// PRC Distribution shop server (Cloudflare Worker)
// - Syncs your active eBay listings (via your own seller account) every 15 minutes
// - Serves them to the website widget
// - Takes payment with PayPal, then ends / reduces the eBay listing automatically
//
// Bindings needed (set in Cloudflare):
//   KV namespace:  STORE
//   Variables:     EBAY_APP_ID, EBAY_RUNAME, PAYPAL_CLIENT_ID, PAYPAL_ENV ("live" or "sandbox")
//   Secrets:       EBAY_CERT_ID, PAYPAL_SECRET, ADMIN_KEY

const EBAY_API = "https://api.ebay.com";
const EBAY_AUTH = "https://auth.ebay.com/oauth2/authorize";
const EBAY_SCOPES = [
  "https://api.ebay.com/oauth/api_scope",
  "https://api.ebay.com/oauth/api_scope/sell.inventory",
  "https://api.ebay.com/oauth/api_scope/sell.account",
  "https://api.ebay.com/oauth/api_scope/sell.fulfillment",
];
const SITE_ID = "3"; // eBay UK
const COMPAT = "1331";

// ---------- tiny XML parser (eBay Trading API responses) ----------
export function parseXml(xml) {
  const root = { children: {} };
  const stack = [root];
  const re = /<(\/?)([A-Za-z_][\w.:-]*)([^>]*?)(\/?)>|([^<]+)/g;
  let m;
  const decode = (s) => s.replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'").replace(/&#(\d+);/g, (_, n) => String.fromCharCode(+n)).replace(/&amp;/g, "&");
  while ((m = re.exec(xml))) {
    if (m[5] !== undefined) { const t = m[5].trim(); if (t) stack[stack.length - 1].text = (stack[stack.length - 1].text || "") + decode(m[5]); continue; }
    const [, close, name, , selfClose] = m;
    if (name.startsWith("?") || m[0].startsWith("<?") || m[0].startsWith("<!")) continue;
    const tag = name.includes(":") ? name.split(":")[1] : name;
    if (close) { stack.pop(); continue; }
    const node = { children: {} };
    const parent = stack[stack.length - 1];
    (parent.children[tag] = parent.children[tag] || []).push(node);
    if (!selfClose) stack.push(node);
  }
  const simplify = (n) => {
    const keys = Object.keys(n.children);
    if (!keys.length) return n.text !== undefined ? n.text.trim() : "";
    const o = {};
    for (const k of keys) { const arr = n.children[k].map(simplify); o[k] = arr.length === 1 ? arr[0] : arr; }
    return o;
  };
  return simplify(root);
}
const arr = (v) => (v === undefined || v === "" ? [] : Array.isArray(v) ? v : [v]);
const num = (v) => (v === undefined || v === "" ? 0 : Number(typeof v === "object" ? v.text ?? 0 : v));

// ---------- eBay auth ----------
async function ebayAccessToken(env, fetchFn = fetch) {
  const cached = await env.STORE.get("ebay_access", "json");
  if (cached && cached.exp > Date.now() + 60000) return cached.token;
  const refresh = await env.STORE.get("ebay_refresh");
  if (!refresh) throw new Error("eBay account not connected yet");
  const res = await fetchFn(`${EBAY_API}/identity/v1/oauth2/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded", Authorization: "Basic " + btoa(`${env.EBAY_APP_ID}:${env.EBAY_CERT_ID}`) },
    body: `grant_type=refresh_token&refresh_token=${encodeURIComponent(refresh)}&scope=${encodeURIComponent(EBAY_SCOPES.join(" "))}`,
  });
  if (!res.ok) throw new Error(`eBay token refresh failed: ${res.status} ${await res.text()}`);
  const j = await res.json();
  await env.STORE.put("ebay_access", JSON.stringify({ token: j.access_token, exp: Date.now() + j.expires_in * 1000 }));
  return j.access_token;
}

async function trading(env, call, body, fetchFn = fetch) {
  const token = await ebayAccessToken(env, fetchFn);
  const xml = `<?xml version="1.0" encoding="utf-8"?><${call}Request xmlns="urn:ebay:apis:eBLBaseComponents">${body}</${call}Request>`;
  const res = await fetchFn(`${EBAY_API}/ws/api.dll`, {
    method: "POST",
    headers: {
      "X-EBAY-API-CALL-NAME": call, "X-EBAY-API-SITEID": SITE_ID, "X-EBAY-API-COMPATIBILITY-LEVEL": COMPAT,
      "X-EBAY-API-IAF-TOKEN": token, "Content-Type": "text/xml",
    },
    body: xml,
  });
  const parsed = parseXml(await res.text());
  const r = parsed[`${call}Response`] || {};
  if (r.Ack === "Failure") {
    const errs = arr(r.Errors).map((e) => e.LongMessage || e.ShortMessage).join("; ");
    throw new Error(`${call} failed: ${errs}`);
  }
  return r;
}

// ---------- listing sync ----------
export function toListing(it) {
  const type = it.ListingType;
  const qty = num(it.Quantity) - num(it.SellingStatus?.QuantitySold);
  const services = arr(it.ShippingDetails?.ShippingServiceOptions);
  const isCollect = (s) => /collect|pickup/i.test(s.ShippingService || "");
  const postal = services.filter((s) => !isCollect(s)).map((s) => num(s.ShippingServiceCost));
  const collection = services.some(isCollect) || services.length === 0;
  const pics = arr(it.PictureDetails?.PictureURL);
  return {
    id: it.ItemID,
    title: it.Title,
    price: num(it.SellingStatus?.CurrentPrice),
    currency: "GBP",
    quantity: qty,
    condition: it.ConditionDisplayName || "",
    image: pics[0] || it.PictureDetails?.GalleryURL || "",
    images: pics.slice(0, 8),
    postage: postal.length ? Math.min(...postal) : null, // null = no postage offered
    collection,
    location: it.Location || "",
    category: String(it.PrimaryCategory?.CategoryName || "").split(":").filter(Boolean).pop() || "",
    categoryPath: String(it.PrimaryCategory?.CategoryName || ""),
    auction: !/FixedPrice/i.test(type || ""),
    url: it.ListingDetails?.ViewItemURL || `https://www.ebay.co.uk/itm/${it.ItemID}`,
    listed: it.ListingDetails?.StartTime || "",
  };
}

export async function syncListings(env, fetchFn = fetch) {
  const now = new Date();
  const to = new Date(now.getTime() + 119 * 864e5);
  const out = [];
  for (let page = 1; page <= 20; page++) {
    const r = await trading(env, "GetSellerList",
      `<EndTimeFrom>${now.toISOString()}</EndTimeFrom><EndTimeTo>${to.toISOString()}</EndTimeTo>` +
      `<DetailLevel>ReturnAll</DetailLevel><Pagination><EntriesPerPage>200</EntriesPerPage><PageNumber>${page}</PageNumber></Pagination>` +
      ["ItemArray.Item.ItemID", "ItemArray.Item.Title", "ItemArray.Item.SellingStatus", "ItemArray.Item.Quantity",
        "ItemArray.Item.PictureDetails", "ItemArray.Item.ShippingDetails.ShippingServiceOptions", "ItemArray.Item.ListingType",
        "ItemArray.Item.ConditionDisplayName", "ItemArray.Item.ListingDetails", "ItemArray.Item.Location", "ItemArray.Item.PrimaryCategory",
        "HasMoreItems", "PaginationResult", "Ack", "Errors"].map((s) => `<OutputSelector>${s}</OutputSelector>`).join(""),
      fetchFn);
    for (const it of arr(r.ItemArray?.Item)) {
      if (it.SellingStatus?.ListingStatus && it.SellingStatus.ListingStatus !== "Active") continue;
      const l = toListing(it);
      if (l.quantity > 0) out.push(l);
    }
    if (r.HasMoreItems !== "true") break;
  }
  out.sort((a, b) => (b.listed || "").localeCompare(a.listed || ""));
  const data = { updated: new Date().toISOString(), count: out.length, listings: out };
  await env.STORE.put("listings", JSON.stringify(data));
  return data;
}

async function getListings(env) {
  return (await env.STORE.get("listings", "json")) || { updated: null, count: 0, listings: [] };
}

async function removeFromEbay(env, item, qty, fetchFn = fetch) {
  if (qty >= item.quantity) {
    await trading(env, "EndFixedPriceItem", `<ItemID>${item.id}</ItemID><EndingReason>NotAvailable</EndingReason>`, fetchFn);
  } else {
    await trading(env, "ReviseInventoryStatus",
      `<InventoryStatus><ItemID>${item.id}</ItemID><Quantity>${item.quantity - qty}</Quantity></InventoryStatus>`, fetchFn);
  }
}

async function deductListings(env, lines) {
  const data = await getListings(env);
  data.listings = data.listings
    .map((l) => { const ln = lines.find((x) => x.id === l.id); return ln ? { ...l, quantity: l.quantity - ln.qty } : l; })
    .filter((l) => l.quantity > 0);
  data.count = data.listings.length;
  await env.STORE.put("listings", JSON.stringify(data));
}

// ---------- item descriptions (fetched from eBay on demand, cached) ----------
export function cleanDescription(h) {
  return String(h || "")
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<(iframe|object|embed|form|meta|link|base)[\s\S]*?>/gi, "")
    .replace(/<\/(iframe|object|embed|form)>/gi, "")
    .replace(/\son\w+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, "")
    .replace(/(href|src)\s*=\s*(["']?)\s*javascript:[^"'\s>]*\2/gi, "")
    .slice(0, 200000);
}

export async function getDescription(env, id, fetchFn = fetch, force = false) {
  if (!/^\d{6,20}$/.test(String(id))) throw httpError(400, "Bad item id");
  if (!force) { const c = await env.STORE.get(`desc:${id}`); if (c !== null) return c; }
  const r = await trading(env, "GetItem",
    `<ItemID>${id}</ItemID><DetailLevel>ReturnAll</DetailLevel><IncludeItemSpecifics>true</IncludeItemSpecifics>` +
    `<OutputSelector>Item.Description</OutputSelector><OutputSelector>Item.ItemSpecifics</OutputSelector>`, fetchFn);
  let html = cleanDescription(r.Item?.Description);
  const specs = arr(r.Item?.ItemSpecifics?.NameValueList).map((n) => [n.Name, arr(n.Value).join(", ")]).filter((x) => x[0] && x[1]);
  if (specs.length) {
    const e = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
    html = `<table class="prc-specs">${specs.map(([k, v]) => `<tr><th>${e(k)}</th><td>${e(v)}</td></tr>`).join("")}</table>` + html;
  }
  await env.STORE.put(`desc:${id}`, html, { expirationTtl: 3 * 86400 });
  return html;
}

// fill in missing descriptions a few at a time (runs after each sync)
export async function prefetchDescriptions(env, max = 25, fetchFn = fetch) {
  const { listings } = await getListings(env);
  let done = 0;
  for (const l of listings) {
    if (done >= max) break;
    if ((await env.STORE.get(`desc:${l.id}`)) !== null) continue;
    try { await getDescription(env, l.id, fetchFn, true); } catch (e) { console.error("desc", l.id, e.message); }
    done++;
  }
  return done;
}

// ---------- PayPal ----------
const ppBase = (env) => (env.PAYPAL_ENV === "sandbox" ? "https://api-m.sandbox.paypal.com" : "https://api-m.paypal.com");
async function paypal(env, path, body, fetchFn = fetch) {
  const t = await fetchFn(`${ppBase(env)}/v1/oauth2/token`, {
    method: "POST",
    headers: { Authorization: "Basic " + btoa(`${env.PAYPAL_CLIENT_ID}:${env.PAYPAL_SECRET}`), "Content-Type": "application/x-www-form-urlencoded" },
    body: "grant_type=client_credentials",
  });
  if (!t.ok) throw new Error(`PayPal auth failed: ${t.status}`);
  const { access_token } = await t.json();
  const res = await fetchFn(`${ppBase(env)}${path}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${access_token}`, "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  const j = await res.json();
  if (!res.ok) throw new Error(`PayPal ${path} failed: ${res.status} ${JSON.stringify(j.details || j.message || j)}`);
  return j;
}

const clean = (s, max = 200) => String(s ?? "").replace(/[\u0000-\u001f]/g, " ").trim().slice(0, max);

export function validateCustomer(c = {}) {
  const cust = {
    name: clean(c.name, 140), email: clean(c.email, 200), phone: clean(c.phone, 30),
    line1: clean(c.line1, 300), line2: clean(c.line2, 300), city: clean(c.city, 120), postcode: clean(c.postcode, 20).toUpperCase(),
  };
  const missing = [];
  if (cust.name.length < 2) missing.push("name");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cust.email)) missing.push("email");
  if (cust.phone.replace(/\D/g, "").length < 7) missing.push("phone number");
  if (!cust.line1) missing.push("address");
  if (!cust.city) missing.push("town/city");
  if (!/^[A-Z]{1,2}\d[A-Z\d]?\s*\d[A-Z]{2}$/.test(cust.postcode)) missing.push("valid UK postcode");
  if (missing.length) throw httpError(400, "Please check your " + missing.join(", ") + ".");
  return cust;
}

// Turn basket lines into checked, priced lines using live stock (never trusts browser prices)
export async function priceBasket(env, rawLines) {
  if (!Array.isArray(rawLines) || !rawLines.length) throw httpError(400, "Your basket is empty.");
  const { listings } = await getListings(env);
  const lines = [];
  for (const raw of rawLines.slice(0, 50)) {
    const item = listings.find((l) => l.id === String(raw.id));
    if (!item || item.auction) throw httpError(409, `Sorry, "${clean(raw.title || raw.id, 60)}" is no longer available. Please remove it from your basket.`);
    const qty = Math.max(1, Math.floor(Number(raw.qty) || 1));
    if (qty > item.quantity) throw httpError(409, `Only ${item.quantity} of "${item.title.slice(0, 60)}" left. Please update your basket.`);
    const delivery = raw.delivery === "collect" ? "collect" : "post";
    if (delivery === "collect" && !item.collection) throw httpError(400, `Collection isn't available for "${item.title.slice(0, 60)}".`);
    if (delivery === "post" && item.postage === null) throw httpError(400, `"${item.title.slice(0, 60)}" is collection only.`);
    if (lines.some((l) => l.id === item.id)) throw httpError(400, "That item is in your basket twice.");
    lines.push({ id: item.id, title: item.title, price: item.price, qty, delivery, postage: delivery === "post" ? item.postage * qty : 0 });
  }
  const f = (n) => (Math.round(n * 100) / 100).toFixed(2);
  const itemTotal = lines.reduce((s, l) => s + l.price * l.qty, 0);
  const shipping = lines.reduce((s, l) => s + l.postage, 0);
  return { lines, itemTotal: f(itemTotal), shipping: f(shipping), total: f(itemTotal + shipping) };
}

export async function createOrder(env, body, fetchFn = fetch) {
  const customer = validateCustomer(body.customer);
  // backwards compatible with single-item requests
  const rawLines = body.items || (body.itemId ? [{ id: body.itemId, qty: 1, delivery: body.delivery }] : []);
  const basket = await priceBasket(env, rawLines);
  const anyPost = basket.lines.some((l) => l.delivery === "post");
  const order = await paypal(env, "/v2/checkout/orders", {
    intent: "CAPTURE",
    purchase_units: [{
      reference_id: "basket",
      description: `PRC Distribution order (${basket.lines.length} item${basket.lines.length > 1 ? "s" : ""})`,
      amount: {
        currency_code: "GBP", value: basket.total,
        breakdown: { item_total: { currency_code: "GBP", value: basket.itemTotal }, shipping: { currency_code: "GBP", value: basket.shipping } },
      },
      items: basket.lines.map((l) => ({
        name: (l.title + (l.delivery === "collect" ? " (collection)" : "")).slice(0, 127),
        sku: l.id, quantity: String(l.qty), unit_amount: { currency_code: "GBP", value: l.price.toFixed(2) },
      })),
      ...(anyPost ? { shipping: {
        type: "SHIPPING",
        name: { full_name: customer.name.slice(0, 300) },
        address: { address_line_1: customer.line1, address_line_2: customer.line2 || undefined, admin_area_2: customer.city, postal_code: customer.postcode, country_code: "GB" },
      } } : {}),
    }],
    payment_source: { paypal: { experience_context: {
      brand_name: "PRC Distribution", user_action: "PAY_NOW", locale: "en-GB",
      shipping_preference: anyPost ? "SET_PROVIDED_ADDRESS" : "NO_SHIPPING",
    } } },
  }, fetchFn);
  await env.STORE.put(`pending:${order.id}`, JSON.stringify({ lines: basket.lines, total: basket.total, customer }), { expirationTtl: 86400 });
  return { id: order.id, total: basket.total };
}

export async function captureOrder(env, orderId, fetchFn = fetch) {
  const pending = await env.STORE.get(`pending:${orderId}`, "json");
  if (!pending) throw httpError(404, "Order not found or expired.");
  // re-check stock before taking any money
  const { listings } = await getListings(env);
  for (const ln of pending.lines) {
    const item = listings.find((l) => l.id === ln.id);
    if (!item || item.quantity < ln.qty) throw httpError(409, `Sorry, "${ln.title.slice(0, 60)}" has just sold. You have not been charged.`);
  }
  const result = await paypal(env, `/v2/checkout/orders/${encodeURIComponent(orderId)}/capture`, null, fetchFn);
  const cap = result.purchase_units?.[0]?.payments?.captures?.[0];
  if (result.status !== "COMPLETED" || !cap || cap.status !== "COMPLETED") {
    throw httpError(402, "Payment was not completed.");
  }
  const amountCheck = cap.amount?.value === pending.total ? "ok" : `MISMATCH: expected ${pending.total}, got ${cap.amount?.value}`;
  await env.STORE.delete(`pending:${orderId}`);
  const ebay = [];
  for (const ln of pending.lines) {
    const item = listings.find((l) => l.id === ln.id);
    try { await removeFromEbay(env, item, ln.qty, fetchFn); ebay.push(`${ln.id}: ok`); }
    catch (e) { ebay.push(`${ln.id}: FAILED ${e.message}`); }
  }
  await deductListings(env, pending.lines);
  const record = {
    paypalOrder: orderId, captureId: cap.id, when: new Date().toISOString(),
    total: pending.total, amountCheck, customer: pending.customer,
    paypalPayer: { name: [result.payer?.name?.given_name, result.payer?.name?.surname].filter(Boolean).join(" "), email: result.payer?.email_address },
    items: pending.lines.map((l) => ({ id: l.id, title: l.title, qty: l.qty, price: l.price, delivery: l.delivery, postage: l.postage })),
    ebay,
  };
  await env.STORE.put(`order:${record.when}:${orderId}`, JSON.stringify(record));
  return { ok: true, total: pending.total, items: record.items.length };
}

// ---------- HTTP ----------
function httpError(status, message) { const e = new Error(message); e.status = status; return e; }
const cors = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "GET,POST,OPTIONS", "Access-Control-Allow-Headers": "Content-Type" };
const json = (obj, status = 200, extra = {}) => new Response(JSON.stringify(obj), { status, headers: { "Content-Type": "application/json", ...cors, ...extra } });
const html = (s, status = 200) => new Response(`<!doctype html><meta name=viewport content="width=device-width"><body style="font-family:system-ui;padding:30px;max-width:560px">${s}</body>`, { status, headers: { "Content-Type": "text/html" } });

export async function handle(request, env, fetchFn = fetch) {
  const url = new URL(request.url);
  const p = url.pathname;
  if (request.method === "OPTIONS") return new Response(null, { headers: cors });
  try {
    if (p === "/api/listings") return json(await getListings(env), 200, { "Cache-Control": "public, max-age=60" });
    const dm = p.match(/^\/api\/description\/(\d+)$/);
    if (dm) return json({ html: await getDescription(env, dm[1], fetchFn) }, 200, { "Cache-Control": "public, max-age=3600" });
    if (p === "/api/config") return json({ paypalClientId: env.PAYPAL_CLIENT_ID, currency: "GBP" });
    if (p === "/api/orders" && request.method === "POST") return json(await createOrder(env, await request.json(), fetchFn));
    const cm = p.match(/^\/api\/orders\/([\w-]+)\/capture$/);
    if (cm && request.method === "POST") return json(await captureOrder(env, cm[1], fetchFn));

    // ----- owner-only pages (need ?key=ADMIN_KEY) -----
    const isAdmin = env.ADMIN_KEY && url.searchParams.get("key") === env.ADMIN_KEY;
    if (p === "/connect-ebay") {
      if (!isAdmin) return html("Not allowed.", 403);
      const state = crypto.randomUUID();
      await env.STORE.put(`state:${state}`, "1", { expirationTtl: 900 });
      const q = new URLSearchParams({ client_id: env.EBAY_APP_ID, response_type: "code", redirect_uri: env.EBAY_RUNAME, scope: EBAY_SCOPES.join(" "), state });
      return Response.redirect(`${EBAY_AUTH}?${q}`, 302);
    }
    if (p === "/ebay-callback") {
      const state = url.searchParams.get("state"), code = url.searchParams.get("code");
      if (!state || !code || !(await env.STORE.get(`state:${state}`))) return html("This link has expired. Please start again.", 400);
      await env.STORE.delete(`state:${state}`);
      const res = await fetchFn(`${EBAY_API}/identity/v1/oauth2/token`, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded", Authorization: "Basic " + btoa(`${env.EBAY_APP_ID}:${env.EBAY_CERT_ID}`) },
        body: `grant_type=authorization_code&code=${encodeURIComponent(code)}&redirect_uri=${encodeURIComponent(env.EBAY_RUNAME)}`,
      });
      if (!res.ok) return html(`eBay connection failed: ${res.status}`, 500);
      const j = await res.json();
      await env.STORE.put("ebay_refresh", j.refresh_token);
      await env.STORE.put("ebay_access", JSON.stringify({ token: j.access_token, exp: Date.now() + j.expires_in * 1000 }));
      const data = await syncListings(env, fetchFn);
      return html(`<h2>eBay connected ✔</h2><p>${data.count} listings loaded. You can close this page.</p>`);
    }
    if (p === "/admin/sync") { if (!isAdmin) return html("Not allowed.", 403); const d = await syncListings(env, fetchFn); return json({ count: d.count, updated: d.updated }); }
    if (p === "/admin/orders") {
      if (!isAdmin) return html("Not allowed.", 403);
      const list = await env.STORE.list({ prefix: "order:" });
      const orders = await Promise.all(list.keys.reverse().map((k) => env.STORE.get(k.name, "json")));
      return json(orders);
    }
    if (p === "/privacy") return html("<h2>Privacy</h2><p>PRC Distribution uses your eBay authorisation only to read and manage our own eBay listings so our website stock stays in sync. Payment is handled by PayPal. We use order details solely to fulfil your purchase and do not share them with anyone else.</p>");
    if (p === "/") return html("PRC Distribution shop server is running.");
    return json({ error: "Not found" }, 404);
  } catch (e) {
    return json({ error: e.message }, e.status || 500);
  }
}

export default {
  fetch: (req, env) => handle(req, env),
  scheduled: (_evt, env, ctx) => ctx.waitUntil(
    syncListings(env).then(() => prefetchDescriptions(env)).catch((e) => console.error("sync failed", e.message))),
};
