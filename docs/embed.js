/* PRC Distribution – live stock, basket and PayPal checkout.
   Embed:  <div id="prc-listings"></div><script src="https://aaaaaabbbbbbccccddd.github.io/prc-ebay-sync/embed.js"></script>
*/
(function () {
  if (window.__prcShopLoaded) return;
  window.__prcShopLoaded = true;
  var API = "https://prc-shop.simonraivid907.workers.dev";
  var script = document.currentScript;
  if (script && script.getAttribute("data-api")) API = script.getAttribute("data-api");
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start); else start();
  function start() {
  var root = document.getElementById("prc-listings"); // only on the Shop page; other pages get the basket only

  var BLUE = "#0b5cad";
  var css = [
    "#prc-listings{font-family:inherit;color:#1f2933}",
    "#prc-listings .prc-bar{display:flex;flex-wrap:wrap;gap:10px;margin:0 0 18px}",
    "#prc-listings input[type=search],#prc-listings select{padding:9px 12px;border:1px solid #cfd6de;border-radius:6px;font:inherit;font-size:15px;background:#fff}",
    "#prc-listings input[type=search]{flex:1;min-width:180px}",
    "#prc-listings .prc-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:18px}",
    "#prc-listings .prc-card{display:flex;flex-direction:column;border:1px solid #e3e8ee;border-radius:10px;overflow:hidden;background:#fff;transition:box-shadow .15s}",
    "#prc-listings .prc-card:hover{box-shadow:0 6px 18px rgba(0,0,0,.08)}",
    "#prc-listings .prc-img{aspect-ratio:1/1;background:#f5f7f9;display:flex;align-items:center;justify-content:center;cursor:pointer}",
    "#prc-listings .prc-img img{max-width:100%;max-height:100%;object-fit:contain}",
    "#prc-listings .prc-body{padding:14px;display:flex;flex-direction:column;gap:6px;flex:1}",
    "#prc-listings .prc-title{font-size:15px;line-height:1.35;margin:0;font-weight:600;cursor:pointer}",
    ".prc-meta{font-size:13px;color:#5f6b7a}",
    "#prc-listings .prc-price{font-size:20px;font-weight:700;margin-top:auto}",
    ".prc-btn{display:block;width:100%;text-align:center;background:" + BLUE + ";color:#fff;border:0;text-decoration:none;padding:11px;border-radius:6px;font:inherit;font-weight:600;font-size:14px;cursor:pointer}",
    ".prc-btn:hover{background:#094a8b}.prc-btn[disabled]{background:#9aa5b1;cursor:default}",
    ".prc-btn.prc-ghost{background:#fff;color:" + BLUE + ";border:1px solid " + BLUE + "}",
    "#prc-listings .prc-note{font-size:13px;color:#5f6b7a;margin-top:16px;text-align:center}",
    ".prc-fab{position:fixed;right:18px;bottom:18px;z-index:99998;background:" + BLUE + ";color:#fff;border:0;border-radius:30px;padding:13px 20px;font:inherit;font-weight:700;font-size:15px;box-shadow:0 6px 20px rgba(0,0,0,.25);cursor:pointer;display:none}",
    ".prc-bg{position:fixed;inset:0;background:rgba(15,23,32,.55);z-index:99999;display:flex;align-items:flex-start;justify-content:center;overflow:auto;padding:20px}",
    ".prc-modal{background:#fff;color:#1f2933;border-radius:12px;max-width:760px;width:100%;padding:22px;position:relative;font-family:inherit;box-sizing:border-box}",
    ".prc-modal *{box-sizing:border-box}",
    ".prc-close{position:absolute;right:12px;top:6px;border:0;background:none;font-size:30px;cursor:pointer;color:#5f6b7a}",
    ".prc-modal h2{font-size:20px;line-height:1.3;margin:0 0 10px}",
    ".prc-m-grid{display:grid;grid-template-columns:1fr 1fr;gap:22px}",
    "@media(max-width:640px){.prc-m-grid{grid-template-columns:1fr}.prc-row2{grid-template-columns:1fr!important}}",
    ".prc-main{aspect-ratio:1/1;background:#f5f7f9;border-radius:8px;display:flex;align-items:center;justify-content:center}",
    ".prc-main img{max-width:100%;max-height:100%;object-fit:contain}",
    ".prc-thumbs{display:flex;gap:6px;margin-top:8px;flex-wrap:wrap}",
    ".prc-thumbs img{width:54px;height:54px;object-fit:cover;border-radius:5px;border:2px solid transparent;cursor:pointer}",
    ".prc-thumbs img.on{border-color:" + BLUE + "}",
    ".prc-opt{display:flex;gap:10px;align-items:center;border:1px solid #cfd6de;border-radius:8px;padding:10px 12px;margin:8px 0;cursor:pointer;font-size:15px}",
    ".prc-opt input{margin:0}",
    ".prc-big{font-size:22px;font-weight:700;margin:12px 0}",
    ".prc-msg{padding:13px;border-radius:8px;font-size:15px;margin-top:12px;line-height:1.45}",
    ".prc-ok{background:#e7f6ec;color:#17643a}.prc-err{background:#fdecec;color:#9b1c1c}",
    ".prc-line{display:grid;grid-template-columns:64px 1fr auto;gap:12px;align-items:center;padding:12px 0;border-bottom:1px solid #e3e8ee}",
    ".prc-line img{width:64px;height:64px;object-fit:contain;background:#f5f7f9;border-radius:6px}",
    ".prc-line-t{font-size:14px;font-weight:600;line-height:1.3}",
    ".prc-qty{display:inline-flex;align-items:center;border:1px solid #cfd6de;border-radius:6px;margin-top:6px}",
    ".prc-qty button{border:0;background:none;width:28px;height:28px;font-size:16px;cursor:pointer}",
    ".prc-qty span{min-width:24px;text-align:center;font-size:14px}",
    ".prc-link{border:0;background:none;color:#9b1c1c;font:inherit;font-size:13px;cursor:pointer;padding:0;margin-left:10px}",
    ".prc-sel{font:inherit;font-size:13px;padding:4px 6px;border:1px solid #cfd6de;border-radius:6px;margin-top:6px;background:#fff}",
    ".prc-sum{display:flex;justify-content:space-between;font-size:15px;margin:6px 0}",
    ".prc-form label{display:block;font-size:13px;font-weight:600;margin:10px 0 4px}",
    ".prc-form input{width:100%;padding:10px 12px;border:1px solid #cfd6de;border-radius:6px;font:inherit;font-size:15px}",
    ".prc-row2{display:grid;grid-template-columns:1fr 1fr;gap:12px}",
    ".prc-desc{margin-top:22px;border-top:1px solid #e3e8ee;padding-top:16px}",
    "#prc-listings .prc-filters{display:flex;flex-wrap:wrap;gap:10px;margin:0 0 12px;align-items:center}",
    "#prc-listings .prc-filters select,#prc-listings .prc-filters input{padding:8px 10px;border:1px solid #cfd6de;border-radius:6px;font:inherit;font-size:14px;background:#fff}",
    "#prc-listings .prc-filters input[type=number]{width:92px}",
    "#prc-listings .prc-count{font-size:13px;color:#5f6b7a;margin:0 0 14px;display:flex;justify-content:space-between;gap:10px;flex-wrap:wrap}",
    "#prc-listings .prc-clear{border:0;background:none;color:" + BLUE + ";font:inherit;font-size:13px;cursor:pointer;padding:0}",
    ".prc-feat{max-width:1100px;margin:36px auto;padding:0 20px;font-family:inherit;color:#1f2933}",
    ".prc-feat-head{display:flex;justify-content:space-between;align-items:baseline;gap:12px;margin-bottom:16px}",
    ".prc-feat-head h2{margin:0;font-size:28px}",
    ".prc-feat-head a{color:" + BLUE + ";font-weight:600;text-decoration:none;white-space:nowrap}",
    ".prc-feat-wrap{position:relative}",
    ".prc-feat-track{display:grid;grid-template-columns:repeat(4,1fr);gap:18px;transition:opacity .45s ease}",
    "@media(max-width:900px){.prc-feat-track{grid-template-columns:repeat(2,1fr)}}",
    "@media(max-width:520px){.prc-feat-track{grid-template-columns:1fr}}",
    ".prc-feat-card{border:1px solid #e3e8ee;border-radius:10px;overflow:hidden;background:#fff;cursor:pointer;display:flex;flex-direction:column;transition:box-shadow .15s}",
    ".prc-feat-card:hover{box-shadow:0 6px 18px rgba(0,0,0,.1)}",
    ".prc-feat-img{aspect-ratio:1/1;background:#f5f7f9;display:flex;align-items:center;justify-content:center}",
    ".prc-feat-img img{max-width:100%;max-height:100%;object-fit:contain}",
    ".prc-feat-body{padding:12px 14px;display:flex;flex-direction:column;gap:6px;flex:1}",
    ".prc-feat-t{font-size:15px;font-weight:600;line-height:1.35;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}",
    ".prc-feat-p{font-size:19px;font-weight:700;margin-top:auto}",
    ".prc-arrow{position:absolute;top:38%;width:40px;height:40px;border-radius:50%;border:0;background:#fff;box-shadow:0 2px 10px rgba(0,0,0,.2);font-size:22px;cursor:pointer;z-index:2;color:#1f2933}",
    ".prc-arrow.l{left:-14px}.prc-arrow.r{right:-14px}",
    ".prc-dots{display:flex;justify-content:center;gap:6px;margin-top:14px}",
    ".prc-dots span{width:8px;height:8px;border-radius:50%;background:#cfd6de}.prc-dots span.on{background:" + BLUE + "}",
    ".widget:has(.ecomproductslist){display:none!important}",
    ".prc-wa{position:fixed;left:18px;bottom:18px;z-index:99998;display:flex;align-items:center;gap:8px;background:#25d366;color:#fff!important;text-decoration:none;border-radius:30px;padding:12px 18px 12px 14px;font:inherit;font-weight:700;font-size:15px;box-shadow:0 6px 20px rgba(0,0,0,.25)}",
    ".prc-wa svg{width:24px;height:24px;flex:none}",
    "@media(max-width:520px){.prc-wa span{display:none}.prc-wa{padding:13px}}",
    ".prc-wa-item{display:flex;align-items:center;justify-content:center;gap:8px;background:#fff;color:#128c4b!important;border:1px solid #25d366;border-radius:6px;padding:10px;text-decoration:none;font-weight:600;font-size:14px}",
    ".prc-desc h3{font-size:17px;margin:0 0 10px}",
    ".prc-desc iframe{width:100%;border:0;min-height:60px;display:block}",
  ].join("");
  var style = document.createElement("style"); style.textContent = css; document.head.appendChild(style);

  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
    return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function money(v) { try { return new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP" }).format(v); } catch (e) { return "£" + Number(v).toFixed(2); } }
  function deliveryText(i) {
    if (i.postage === null) return "Collection only";
    return (i.postage ? "Postage " + money(i.postage) : "Free postage") + (i.collection ? " · or collect" : "");
  }

  // ---------- basket (kept in this browser) ----------
  var KEY = "prc_basket_v1";
  var basket = [];
  try { basket = JSON.parse(localStorage.getItem(KEY) || "[]") || []; } catch (e) { basket = []; }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(basket)); } catch (e) {} updateFab(); }
  var items = [], byId = {};
  function lineItem(l) { return byId[l.id]; }
  function lineCount() { return basket.reduce(function (s, l) { return s + l.qty; }, 0); }
  function totals() {
    var sub = 0, post = 0;
    basket.forEach(function (l) { var i = lineItem(l); if (!i) return; sub += i.price * l.qty; if (l.delivery === "post") post += (i.postage || 0) * l.qty; });
    return { sub: sub, post: post, total: sub + post };
  }
  function addToBasket(i, delivery, qty) {
    var ex = basket.find(function (l) { return l.id === i.id; });
    if (ex) { ex.qty = Math.min(i.quantity, ex.qty + qty); ex.delivery = delivery; }
    else basket.push({ id: i.id, qty: Math.min(i.quantity, qty), delivery: delivery });
    save();
  }

  // ---------- WhatsApp chat (messages go straight to the shop's phone) ----------
  var WA_NUMBER = "447448472097";
  var WA_ICON = '<svg viewBox="0 0 32 32" fill="currentColor" aria-hidden="true"><path d="M16 3C9 3 3.3 8.6 3.3 15.6c0 2.2.6 4.4 1.7 6.3L3 29l7.3-1.9c1.8 1 3.8 1.5 5.8 1.5 7 0 12.7-5.7 12.7-12.7S23 3 16 3zm0 23.3c-1.9 0-3.7-.5-5.3-1.4l-.4-.2-4.3 1.1 1.2-4.2-.3-.4c-1-1.7-1.6-3.6-1.6-5.6C5.3 9.8 10.1 5.3 16 5.3s10.6 4.7 10.6 10.4S21.9 26.3 16 26.3zm5.8-7.8c-.3-.2-1.9-.9-2.2-1-.3-.1-.5-.2-.7.2-.2.3-.8 1-.9 1.2-.2.2-.3.2-.6.1-.3-.2-1.3-.5-2.5-1.6-.9-.8-1.6-1.8-1.7-2.1-.2-.3 0-.5.1-.6l.5-.5c.1-.2.2-.3.3-.5.1-.2 0-.4 0-.5l-1-2.4c-.3-.6-.5-.5-.7-.5h-.6c-.2 0-.5.1-.8.4-.3.3-1 1-1 2.5s1.1 2.9 1.2 3.1c.2.2 2.1 3.2 5 4.5.7.3 1.3.5 1.7.6.7.2 1.4.2 1.9.1.6-.1 1.9-.8 2.1-1.5.3-.7.3-1.4.2-1.5-.1-.1-.3-.2-.6-.3z"/></svg>';
  function waLink(text) { return "https://wa.me/" + WA_NUMBER + "?text=" + encodeURIComponent(text); }
  var wa = document.createElement("a");
  wa.className = "prc-wa"; wa.target = "_blank"; wa.rel = "noopener";
  wa.href = waLink("Hi PRC Distribution, I have a question:");
  wa.setAttribute("aria-label", "Chat with us on WhatsApp");
  wa.innerHTML = WA_ICON + "<span>Chat with us</span>";
  document.body.appendChild(wa);

  var fab = document.createElement("button");
  fab.className = "prc-fab"; fab.type = "button";
  fab.onclick = function () { openBasket(); };
  document.body.appendChild(fab);
  // The site's own basket icon in the top bar opens this basket instead of the old store basket
  var HEADER_SEL = ".js-navigation-basket, .navigation-basket-toggle, .ecombasket, a[href*='/store/cart']";
  document.addEventListener("click", function (e) {
    var hit = e.target.closest && e.target.closest(HEADER_SEL);
    if (!hit || hit.closest(".prc-bg")) return;
    e.preventDefault(); e.stopPropagation(); if (e.stopImmediatePropagation) e.stopImmediatePropagation();
    openBasket();
  }, true);
  function headerBasket() { return document.querySelector(".js-navigation-basket, .ecombasket"); }
  function updateFab() {
    var n = lineCount();
    [].forEach.call(document.querySelectorAll(".ecombasket__item-count"), function (c) { c.textContent = n; });
    [].forEach.call(document.querySelectorAll(".ecombasket__basket-body"), function (b) { b.style.display = "none"; });
    // floating button only where there's no basket icon in the top bar
    fab.style.display = n && !headerBasket() ? "block" : "none";
    fab.textContent = "🛒 Basket (" + n + ") · " + money(totals().total);
  }

  // ---------- modal helper ----------
  function modal(html) {
    var bg = document.createElement("div"); bg.className = "prc-bg";
    bg.innerHTML = '<div class="prc-modal" role="dialog" aria-modal="true"><button class="prc-close" aria-label="Close">×</button>' + html + "</div>";
    document.body.appendChild(bg);
    bg.close = function () { bg.remove(); };
    bg.querySelector(".prc-close").onclick = bg.close;
    bg.addEventListener("click", function (e) { if (e.target === bg) bg.close(); });
    return bg;
  }

  // ---------- item view ----------
  function openItem(i) {
    var imgs = (i.images && i.images.length ? i.images : [i.image]).filter(Boolean);
    var opts = "";
    if (i.postage !== null) opts += '<label class="prc-opt"><input type="radio" name="prc-del" value="post"> Delivery – ' + (i.postage ? money(i.postage) : "Free") + "</label>";
    if (i.collection) opts += '<label class="prc-opt"><input type="radio" name="prc-del" value="collect"> Collection' + (i.location ? " from " + esc(i.location) : "") + " – Free</label>";
    var bg = modal('<div class="prc-m-grid"><div>' +
      '<div class="prc-main">' + (imgs[0] ? '<img src="' + esc(imgs[0]) + '" alt="">' : "") + "</div>" +
      '<div class="prc-thumbs">' + (imgs.length > 1 ? imgs.map(function (u, n) { return '<img src="' + esc(u) + '" class="' + (n ? "" : "on") + '" alt="">'; }).join("") : "") + "</div></div>" +
      "<div><h2>" + esc(i.title) + '</h2><div class="prc-meta">' + esc(i.condition) + (i.quantity > 1 ? " · " + i.quantity + " available" : "") + "</div>" +
      '<div class="prc-big">' + money(i.price) + "</div>" +
      '<div class="prc-meta" style="font-weight:600">Choose delivery</div>' + opts +
      (i.quantity > 1 ? '<div class="prc-meta" style="font-weight:600;margin-top:10px">Quantity</div><div class="prc-qty" data-q><button type="button" data-d="-1">−</button><span>1</span><button type="button" data-d="1">+</button></div>' : "") +
      '<div style="margin-top:16px;display:grid;gap:8px"><button class="prc-btn" data-add type="button">Add to basket</button>' +
      '<a class="prc-wa-item" target="_blank" rel="noopener" href="' + esc(waLink("Hi PRC Distribution, I have a question about: " + i.title + " (" + money(i.price) + ")")) + '">' + WA_ICON.replace("<svg ", '<svg style="width:20px;height:20px" ') + " Ask about this item</a></div><div data-msg></div>" +
      '</div></div><div class="prc-desc"><h3>Description</h3><div data-desc><p class="prc-meta">Loading description…</p></div></div>');
    loadDescription(i.id, bg.querySelector("[data-desc]"));
    var main = bg.querySelector(".prc-main img");
    [].forEach.call(bg.querySelectorAll(".prc-thumbs img"), function (t) {
      t.onclick = function () { main.src = t.src; [].forEach.call(bg.querySelectorAll(".prc-thumbs img"), function (x) { x.classList.toggle("on", x === t); }); };
    });
    var qty = 1, qEl = bg.querySelector("[data-q] span");
    [].forEach.call(bg.querySelectorAll("[data-q] button"), function (b) {
      b.onclick = function () { qty = Math.max(1, Math.min(i.quantity, qty + Number(b.getAttribute("data-d")))); qEl.textContent = qty; };
    });
    var radios = bg.querySelectorAll("input[name=prc-del]");
    if (radios.length === 1) radios[0].checked = true;
    var msg = bg.querySelector("[data-msg]");
    bg.querySelector("[data-add]").onclick = function () {
      var sel = bg.querySelector("input[name=prc-del]:checked");
      if (!sel) { msg.innerHTML = '<div class="prc-msg prc-err">Please choose delivery or collection.</div>'; return; }
      addToBasket(i, sel.value, qty);
      msg.innerHTML = '<div class="prc-msg prc-ok">Added to your basket.</div>' +
        '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:10px"><button class="prc-btn prc-ghost" data-cont type="button">Keep shopping</button><button class="prc-btn" data-go type="button">View basket</button></div>';
      msg.querySelector("[data-cont]").onclick = bg.close;
      msg.querySelector("[data-go]").onclick = function () { bg.close(); openBasket(); };
    };
  }

  // eBay description shown in a locked-down frame (no scripts) so listing HTML can't affect this site
  var descCache = {};
  function loadDescription(id, box) {
    var got = descCache[id] ? Promise.resolve(descCache[id]) :
      fetch(API + "/api/description/" + encodeURIComponent(id)).then(function (r) { if (!r.ok) throw 0; return r.json(); }).then(function (j) { descCache[id] = j.html || ""; return descCache[id]; });
    got.then(function (html) {
      if (!html || !html.replace(/<[^>]*>/g, "").trim()) { box.innerHTML = '<p class="prc-meta">No description provided.</p>'; return; }
      var f = document.createElement("iframe");
      f.setAttribute("sandbox", "allow-same-origin allow-popups allow-popups-to-escape-sandbox");
      f.setAttribute("title", "Item description");
      f.srcdoc = '<!doctype html><html><head><meta charset="utf-8"><base target="_blank"><style>' +
        'body{margin:0;font:15px/1.5 system-ui,-apple-system,Segoe UI,Roboto,sans-serif;color:#1f2933;overflow-wrap:anywhere}' +
        'img,video{max-width:100%!important;height:auto!important}table{max-width:100%!important}*{max-width:100%;box-sizing:border-box}' +
        '.prc-specs{border-collapse:collapse;margin:0 0 14px;width:100%}.prc-specs th,.prc-specs td{text-align:left;padding:6px 8px;border-bottom:1px solid #e3e8ee;font-size:14px;vertical-align:top}.prc-specs th{color:#5f6b7a;font-weight:600;width:40%}' +
        '</style></head><body>' + html + "</body></html>";
      box.innerHTML = ""; box.appendChild(f);
      function fit() { try { f.style.height = (f.contentDocument.documentElement.scrollHeight + 4) + "px"; } catch (e) { f.style.height = "500px"; } }
      f.onload = function () { fit(); [].forEach.call(f.contentDocument.images || [], function (im) { im.addEventListener("load", fit); }); setTimeout(fit, 800); setTimeout(fit, 2500); };
    }).catch(function () { box.innerHTML = '<p class="prc-meta">Description unavailable right now.</p>'; });
  }

  // ---------- basket view ----------
  function openBasket() {
    var bg = modal('<h2>Your basket</h2><div data-body></div>');
    var body = bg.querySelector("[data-body]");
    function render() {
      basket = basket.filter(function (l) { return lineItem(l); });
      save();
      if (!basket.length) { body.innerHTML = '<p class="prc-meta">Your basket is empty.</p>'; return; }
      var t = totals();
      body.innerHTML = basket.map(function (l, n) {
        var i = lineItem(l);
        var dsel = (i.postage !== null && i.collection)
          ? '<select class="prc-sel" data-del="' + n + '"><option value="post"' + (l.delivery === "post" ? " selected" : "") + ">Delivery – " + (i.postage ? money(i.postage) + " each" : "Free") + '</option><option value="collect"' + (l.delivery === "collect" ? " selected" : "") + ">Collection – Free</option></select>"
          : '<div class="prc-meta" style="margin-top:6px">' + (l.delivery === "collect" ? "Collection – Free" : "Delivery – " + (i.postage ? money(i.postage) + " each" : "Free")) + "</div>";
        return '<div class="prc-line"><img src="' + esc(i.image) + '" alt=""><div><div class="prc-line-t">' + esc(i.title) + "</div>" + dsel +
          '<div><span class="prc-qty"><button type="button" data-qd="' + n + '" data-d="-1">−</button><span>' + l.qty + '</span><button type="button" data-qd="' + n + '" data-d="1">+</button></span>' +
          '<button class="prc-link" type="button" data-rm="' + n + '">Remove</button></div></div><div style="font-weight:700">' + money(i.price * l.qty) + "</div></div>";
      }).join("") +
        '<div style="margin-top:14px"><div class="prc-sum"><span>Items</span><span>' + money(t.sub) + '</span></div><div class="prc-sum"><span>Postage</span><span>' + money(t.post) + '</span></div>' +
        '<div class="prc-sum prc-big" style="margin:8px 0 16px"><span>Total</span><span>' + money(t.total) + '</span></div>' +
        '<button class="prc-btn" type="button" data-checkout>Checkout</button></div>';
      [].forEach.call(body.querySelectorAll("[data-qd]"), function (b) {
        b.onclick = function () { var l = basket[+b.getAttribute("data-qd")], i = lineItem(l); l.qty = Math.max(1, Math.min(i.quantity, l.qty + Number(b.getAttribute("data-d")))); render(); };
      });
      [].forEach.call(body.querySelectorAll("[data-rm]"), function (b) { b.onclick = function () { basket.splice(+b.getAttribute("data-rm"), 1); render(); }; });
      [].forEach.call(body.querySelectorAll("[data-del]"), function (s) { s.onchange = function () { basket[+s.getAttribute("data-del")].delivery = s.value; render(); }; });
      body.querySelector("[data-checkout]").onclick = function () { bg.close(); openCheckout(); };
    }
    render();
  }

  // ---------- checkout ----------
  var ppReady = null;
  function loadPayPal() {
    if (ppReady) return ppReady;
    ppReady = fetch(API + "/api/config").then(function (r) { return r.json(); }).then(function (cfg) {
      return new Promise(function (res, rej) {
        var s = document.createElement("script");
        s.src = "https://www.paypal.com/sdk/js?client-id=" + encodeURIComponent(cfg.paypalClientId) + "&currency=GBP&intent=capture&locale=en_GB&disable-funding=card,credit,paylater,venmo";
        s.onload = function () { res(window.paypal); }; s.onerror = function () { ppReady = null; rej(); };
        document.head.appendChild(s);
      });
    });
    return ppReady;
  }
  var saved = {};
  try { saved = JSON.parse(localStorage.getItem("prc_customer_v1") || "{}") || {}; } catch (e) {}

  function openCheckout() {
    if (!basket.length) return;
    var t = totals();
    var anyPost = basket.some(function (l) { return l.delivery === "post"; });
    var f = function (id, label, type, ac, req) {
      return "<div><label for=\"prc-" + id + "\">" + label + (req ? " *" : "") + '</label><input id="prc-' + id + '" name="' + id + '" type="' + type + '" autocomplete="' + ac + '"' + (req ? " required" : "") + ' value="' + esc(saved[id] || "") + '"></div>';
    };
    var bg = modal("<h2>Checkout</h2>" +
      '<p class="prc-meta">' + lineCount() + " item" + (lineCount() > 1 ? "s" : "") + " · Total <strong>" + money(t.total) + "</strong>" + (t.post ? " (incl. " + money(t.post) + " postage)" : "") + "</p>" +
      '<form class="prc-form" novalidate>' +
      f("name", "Full name", "text", "name", true) +
      '<div class="prc-row2">' + f("email", "Email", "email", "email", true) + f("phone", "Phone number", "tel", "tel", true) + "</div>" +
      f("line1", "Address line 1", "text", "address-line1", true) + f("line2", "Address line 2", "text", "address-line2", false) +
      '<div class="prc-row2">' + f("city", "Town / city", "text", "address-level2", true) + f("postcode", "Postcode", "text", "postal-code", true) + "</div>" +
      (anyPost ? '<p class="prc-meta" style="margin-top:10px">Items will be delivered to this address.</p>' : '<p class="prc-meta" style="margin-top:10px">All items are for collection – we\'ll contact you to arrange a time.</p>') +
      '<button class="prc-btn" type="submit" style="margin-top:14px">Continue to payment</button></form>' +
      '<div data-pp style="margin-top:14px"></div><div data-msg></div>');
    var form = bg.querySelector("form"), ppEl = bg.querySelector("[data-pp]"), msg = bg.querySelector("[data-msg]");
    function show(text, ok) { msg.innerHTML = '<div class="prc-msg ' + (ok ? "prc-ok" : "prc-err") + '">' + text + "</div>"; }
    function customer() {
      var c = {}; ["name", "email", "phone", "line1", "line2", "city", "postcode"].forEach(function (k) { c[k] = form.elements[k].value.trim(); }); return c;
    }
    function check(c) {
      var bad = [];
      if (c.name.length < 2) bad.push("full name");
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(c.email)) bad.push("email");
      if (c.phone.replace(/\D/g, "").length < 7) bad.push("phone number");
      if (!c.line1) bad.push("address");
      if (!c.city) bad.push("town/city");
      if (!/^[A-Z]{1,2}\d[A-Z\d]?\s*\d[A-Z]{2}$/i.test(c.postcode)) bad.push("postcode");
      return bad;
    }
    form.onsubmit = function (e) {
      e.preventDefault();
      var c = customer(), bad = check(c);
      if (bad.length) { show("Please fill in your " + bad.join(", ") + "."); return; }
      try { localStorage.setItem("prc_customer_v1", JSON.stringify(c)); } catch (er) {}
      msg.innerHTML = "";
      [].forEach.call(form.elements, function (el) { el.disabled = true; });
      form.querySelector("button").style.display = "none";
      ppEl.innerHTML = '<p class="prc-meta">Loading secure payment…</p>';
      loadPayPal().then(function (paypal) {
        ppEl.innerHTML = '<p class="prc-meta" style="margin-bottom:8px">Pay securely with PayPal:</p><div data-btns></div><button type="button" class="prc-link" data-edit style="color:' + BLUE + ';margin:8px 0 0">Edit my details</button>';
        ppEl.querySelector("[data-edit]").onclick = function () {
          [].forEach.call(form.elements, function (el) { el.disabled = false; }); form.querySelector("button").style.display = ""; ppEl.innerHTML = "";
        };
        paypal.Buttons({
          fundingSource: paypal.FUNDING.PAYPAL,
          style: { layout: "vertical", shape: "rect", label: "pay" },
          createOrder: function () {
            msg.innerHTML = "";
            return fetch(API + "/api/orders", { method: "POST", headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ items: basket.map(function (l) { return { id: l.id, qty: l.qty, delivery: l.delivery, title: (lineItem(l) || {}).title }; }), customer: c }) })
              .then(function (r) { return r.json().then(function (j) { if (!r.ok) throw new Error(j.error); return j.id; }); });
          },
          onApprove: function (data) {
            ppEl.innerHTML = '<p class="prc-meta">Confirming your payment…</p>';
            return fetch(API + "/api/orders/" + data.orderID + "/capture", { method: "POST" })
              .then(function (r) { return r.json().then(function (j) { if (!r.ok) throw new Error(j.error); return j; }); })
              .then(function () {
                basket.forEach(function (l) { var i = lineItem(l); if (i) i.quantity -= l.qty; });
                items = items.filter(function (i) { return i.quantity > 0; });
                basket = []; save(); rerender();
                form.style.display = "none"; ppEl.innerHTML = "";
                bg.querySelector("h2").textContent = "Thank you for your order!";
                show("<strong>Your payment has been received.</strong><br><br>Please wait for email confirmation of your order. We'll send it to <strong>" + esc(c.email) + "</strong> shortly.", true);
              });
          },
          onError: function (err) {
            ppEl.querySelector("[data-btns]") || (ppEl.innerHTML = "");
            show(esc((err && err.message) || "Something went wrong – you have not been charged. Please try again."));
          },
        }).render(ppEl.querySelector("[data-btns]"));
      }).catch(function () { ppEl.innerHTML = ""; show("Payment couldn't load. Please refresh the page and try again."); });
    };
  }

  // ---------- Home page: rotating random items ----------
  function featured() {
    var home = location.pathname === "/" || location.pathname === "" || /^\/home/i.test(location.pathname);
    var box = document.getElementById("prc-featured");
    if (!box && !home) return;
    if (!items.length) return;
    if (!box) {
      box = document.createElement("div"); box.id = "prc-featured";
      var old = document.querySelector(".ecomproductslist");
      var anchor = old && (old.closest(".widget--zone-widget") || old.closest(".widget"));
      if (!anchor) {
        var h = [].find.call(document.querySelectorAll("h1,h2"), function (e) { return /top deals/i.test(e.textContent); });
        anchor = h && h.closest(".widget--zone-widget");
        if (anchor) { anchor.parentNode.insertBefore(box, anchor.nextSibling); }
      } else anchor.parentNode.insertBefore(box, anchor);
      if (!box.parentNode) return;
    }
    var pool = items.filter(function (i) { return i.image; }).slice();
    for (var k = pool.length - 1; k > 0; k--) { var j = Math.floor(Math.random() * (k + 1)); var t = pool[k]; pool[k] = pool[j]; pool[j] = t; }
    pool = pool.slice(0, 24);
    var per = function () { return window.innerWidth <= 520 ? 1 : window.innerWidth <= 900 ? 2 : 4; };
    var page = 0, timer = null;
    box.className = "prc-feat";
    box.innerHTML = '<div class="prc-feat-head"><h2>Latest deals</h2><a href="/shop">View all ' + items.length + " items →</a></div>" +
      '<div class="prc-feat-wrap"><button class="prc-arrow l" type="button" aria-label="Previous">‹</button><div class="prc-feat-track"></div><button class="prc-arrow r" type="button" aria-label="Next">›</button></div><div class="prc-dots"></div>';
    var track = box.querySelector(".prc-feat-track"), dots = box.querySelector(".prc-dots");
    function pages() { return Math.max(1, Math.ceil(pool.length / per())); }
    function draw() {
      var n = per(), set = pool.slice(page * n, page * n + n);
      track.style.opacity = 0;
      setTimeout(function () {
        track.innerHTML = set.map(function (i) {
          return '<div class="prc-feat-card" data-id="' + esc(i.id) + '"><div class="prc-feat-img"><img src="' + esc(i.image) + '" alt="' + esc(i.title) + '"></div>' +
            '<div class="prc-feat-body"><div class="prc-feat-t">' + esc(i.title) + '</div><div class="prc-meta">' + esc(deliveryText(i)) + '</div><div class="prc-feat-p">' + money(i.price) + "</div></div></div>";
        }).join("");
        dots.innerHTML = Array.apply(null, Array(pages())).map(function (_, d) { return '<span class="' + (d === page ? "on" : "") + '"></span>'; }).join("");
        track.style.opacity = 1;
      }, 250);
    }
    function go(d) { page = (page + d + pages()) % pages(); draw(); }
    function start() { stop(); timer = setInterval(function () { go(1); }, 5000); }
    function stop() { if (timer) clearInterval(timer); timer = null; }
    box.querySelector(".prc-arrow.l").onclick = function () { go(-1); start(); };
    box.querySelector(".prc-arrow.r").onclick = function () { go(1); start(); };
    box.addEventListener("mouseenter", stop); box.addEventListener("mouseleave", start);
    track.addEventListener("click", function (e) { var c = e.target.closest(".prc-feat-card"); if (c && byId[c.getAttribute("data-id")]) openItem(byId[c.getAttribute("data-id")]); });
    var lastPer = per(); window.addEventListener("resize", function () { if (per() !== lastPer) { lastPer = per(); page = 0; draw(); } });
    draw(); start();
  }

  // ---------- listing grid ----------
  var rerender = function () {};
  if (root) root.innerHTML = '<p class="prc-note">Loading our latest stock…</p>';
  updateFab();
  fetch(API + "/api/listings")
    .then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
    .then(function (data) {
      items = (data.listings || []).filter(function (i) { return !i.auction; });
      items.forEach(function (i) { byId[i.id] = i; });
      basket = basket.filter(function (l) { var i = byId[l.id]; if (i) l.qty = Math.min(l.qty, i.quantity); return !!i; });
      save();
      featured();
      if (!root) return; // basket-only page
      function tally(key) { var m = {}; items.forEach(function (i) { if (i[key]) m[i[key]] = (m[i[key]] || 0) + 1; }); return Object.keys(m).sort().map(function (k) { return [k, m[k]]; }); }
      var cats = tally("category"), conds = tally("condition");
      if (!items.length) { root.innerHTML = '<p class="prc-note">No items listed right now – check back soon.</p>'; return; }
      root.innerHTML =
        '<div class="prc-bar"><input type="search" data-f="q" placeholder="Search ' + items.length + ' items…" aria-label="Search items">' +
        '<select data-f="sort" aria-label="Sort by"><option value="new">Sort: Newest first</option><option value="old">Sort: Oldest first</option><option value="low">Sort: Price low to high</option><option value="high">Sort: Price high to low</option><option value="az">Sort: Name A–Z</option><option value="za">Sort: Name Z–A</option></select></div>' +
        '<div class="prc-filters">' +
        (cats.length > 1 ? '<select data-f="cat" aria-label="Category"><option value="">All categories</option>' + cats.map(function (c) { return '<option value="' + esc(c[0]) + '">' + esc(c[0]) + " (" + c[1] + ")</option>"; }).join("") + "</select>" : "") +
        (conds.length > 1 ? '<select data-f="cond" aria-label="Condition"><option value="">Any condition</option>' + conds.map(function (c) { return '<option value="' + esc(c[0]) + '">' + esc(c[0]) + " (" + c[1] + ")</option>"; }).join("") + "</select>" : "") +
        '<select data-f="del" aria-label="Delivery"><option value="">Delivery or collection</option><option value="post">Delivery available</option><option value="free">Free delivery</option><option value="collect">Collection available</option></select>' +
        '<input type="number" data-f="min" min="0" step="1" placeholder="Min £" aria-label="Minimum price"><input type="number" data-f="max" min="0" step="1" placeholder="Max £" aria-label="Maximum price">' +
        "</div>" +
        '<div class="prc-count"><span data-count></span><button type="button" class="prc-clear" data-clear>Clear filters</button></div>' +
        '<div class="prc-grid"></div><p class="prc-note">Secure checkout with PayPal.</p>';
      var grid = root.querySelector(".prc-grid");
      var F = {}; [].forEach.call(root.querySelectorAll("[data-f]"), function (el) { F[el.getAttribute("data-f")] = el; });
      var countEl = root.querySelector("[data-count]");
      root.querySelector("[data-clear]").onclick = function () {
        Object.keys(F).forEach(function (k) { if (k !== "sort") F[k].value = ""; }); rerender();
      };
      var cmp = { new: function (a, b) { return (b.listed || "").localeCompare(a.listed || ""); }, old: function (a, b) { return (a.listed || "").localeCompare(b.listed || ""); },
        low: function (a, b) { return a.price - b.price; }, high: function (a, b) { return b.price - a.price; },
        az: function (a, b) { return a.title.localeCompare(b.title); }, za: function (a, b) { return b.title.localeCompare(a.title); } };
      rerender = function () {
        var q = F.q.value.toLowerCase().trim(), cat = F.cat ? F.cat.value : "", cond = F.cond ? F.cond.value : "", del = F.del.value;
        var mn = parseFloat(F.min.value), mx = parseFloat(F.max.value);
        var list = items.filter(function (i) {
          if (q && i.title.toLowerCase().indexOf(q) < 0) return false;
          if (cat && i.category !== cat) return false;
          if (cond && i.condition !== cond) return false;
          if (del === "post" && i.postage === null) return false;
          if (del === "free" && i.postage !== 0) return false;
          if (del === "collect" && !i.collection) return false;
          if (!isNaN(mn) && i.price < mn) return false;
          if (!isNaN(mx) && i.price > mx) return false;
          return true;
        });
        list.sort(cmp[F.sort.value] || cmp.new);
        countEl.textContent = "Showing " + list.length + " of " + items.length + " items";
        grid.innerHTML = list.map(function (i) {
          return '<div class="prc-card" data-id="' + esc(i.id) + '"><div class="prc-img" data-open>' +
            (i.image ? '<img loading="lazy" src="' + esc(i.image) + '" alt="' + esc(i.title) + '">' : "") +
            '</div><div class="prc-body"><h3 class="prc-title" data-open>' + esc(i.title) + "</h3>" +
            '<div class="prc-meta">' + esc(i.condition) + "</div>" +
            '<div class="prc-meta">' + esc(deliveryText(i)) + "</div>" +
            '<div class="prc-price">' + money(i.price) + "</div>" +
            '<button class="prc-btn" type="button" data-open>Add to basket</button></div></div>';
        }).join("") || '<p class="prc-note">No items match your search.</p>';
      };
      grid.addEventListener("click", function (e) {
        if (!e.target.closest("[data-open]")) return;
        var card = e.target.closest(".prc-card"); var it = card && byId[card.getAttribute("data-id")];
        if (it) openItem(it);
      });
      Object.keys(F).forEach(function (k) { F[k].addEventListener(k === "q" || k === "min" || k === "max" ? "input" : "change", rerender); });
      rerender();
    })
    .catch(function () { if (root) root.innerHTML = '<p class="prc-note">Couldn\'t load our stock right now – please try again shortly.</p>'; });
  }
})();
