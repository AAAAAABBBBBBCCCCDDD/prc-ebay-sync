// Pulls every live listing for an eBay UK seller via eBay's official Browse API
// and writes them to docs/listings.json for the website to display.
//
// Needs two environment variables (stored as GitHub secrets):
//   EBAY_CLIENT_ID      – your App ID (Client ID)
//   EBAY_CLIENT_SECRET  – your Cert ID (Client Secret)
// Optional:
//   EBAY_SELLER         – seller username (default: prcdistribution)

import { writeFile, mkdir } from "node:fs/promises";

const SELLER = process.env.EBAY_SELLER || "prcdistribution";
const MARKETPLACE = "EBAY_GB";
const CATEGORY_TREE_ID = "3"; // eBay UK
const API = "https://api.ebay.com";
const OUT = new URL("../docs/listings.json", import.meta.url);

export async function getToken(id, secret, fetchFn = fetch) {
  const res = await fetchFn(`${API}/identity/v1/oauth2/token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: "Basic " + Buffer.from(`${id}:${secret}`).toString("base64"),
    },
    body: "grant_type=client_credentials&scope=" +
      encodeURIComponent("https://api.ebay.com/oauth/api_scope"),
  });
  if (!res.ok) throw new Error(`Token request failed: ${res.status} ${await res.text()}`);
  return (await res.json()).access_token;
}

async function api(path, token, fetchFn) {
  const res = await fetchFn(`${API}${path}`, {
    headers: { Authorization: `Bearer ${token}`, "X-EBAY-C-MARKETPLACE-ID": MARKETPLACE },
  });
  if (!res.ok) throw new Error(`${path} failed: ${res.status} ${await res.text()}`);
  return res.json();
}

// The Browse API won't search by seller alone, so we search each top-level
// eBay UK category filtered to this seller, then de-duplicate.
export async function getListings(token, fetchFn = fetch) {
  const tree = await api(`/commerce/taxonomy/v1/category_tree/${CATEGORY_TREE_ID}`, token, fetchFn);
  const categories = (tree.rootCategoryNode.childCategoryTreeNodes || [])
    .map((n) => n.category.categoryId);

  const items = new Map();
  for (const cat of categories) {
    let offset = 0;
    while (true) {
      const q = new URLSearchParams({
        category_ids: cat,
        filter: `sellers:{${SELLER}}`,
        sort: "newlyListed",
        limit: "200",
        offset: String(offset),
      });
      const data = await api(`/buy/browse/v1/item_summary/search?${q}`, token, fetchFn);
      for (const it of data.itemSummaries || []) {
        if (items.has(it.itemId)) continue;
        items.set(it.itemId, {
          id: it.itemId,
          title: it.title,
          price: it.price ? Number(it.price.value) : null,
          currency: it.price?.currency || "GBP",
          wasPrice: it.marketingPrice?.originalPrice
            ? Number(it.marketingPrice.originalPrice.value) : null,
          condition: it.condition || "",
          image: it.image?.imageUrl || it.thumbnailImages?.[0]?.imageUrl || "",
          url: it.itemWebUrl,
          buyingOptions: it.buyingOptions || [],
          listed: it.itemCreationDate || null,
        });
      }
      offset += 200;
      if (!data.next || offset >= (data.total || 0)) break;
    }
  }
  return [...items.values()].sort((a, b) => (b.listed || "").localeCompare(a.listed || ""));
}

async function main() {
  const { EBAY_CLIENT_ID: id, EBAY_CLIENT_SECRET: secret } = process.env;
  if (!id || !secret) throw new Error("Set EBAY_CLIENT_ID and EBAY_CLIENT_SECRET");
  const token = await getToken(id, secret);
  const listings = await getListings(token);
  await mkdir(new URL("../docs/", import.meta.url), { recursive: true });
  await writeFile(OUT, JSON.stringify({
    seller: SELLER,
    updated: new Date().toISOString(),
    count: listings.length,
    listings,
  }, null, 2));
  console.log(`Saved ${listings.length} listings for ${SELLER}`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((e) => { console.error(e.message); process.exit(1); });
}
