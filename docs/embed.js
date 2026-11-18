/* PRC Distribution – live eBay listings widget.
   Paste into an HTML/Embed block on your site:
     <div id="prc-listings"></div>
     <script src="https://aaaaaabbbbbbccccddd.github.io/prc-ebay-sync/embed.js"></script>
*/
(function () {
  var script = document.currentScript;
  var base = script ? script.src.replace(/embed\.js(\?.*)?$/, "") : "./";
  var root = document.getElementById("prc-listings");
  if (!root) { root = document.createElement("div"); script.parentNode.insertBefore(root, script); }

  var css = "\
#prc-listings{font-family:inherit;color:#1f2933}\
#prc-listings .prc-bar{display:flex;flex-wrap:wrap;gap:10px;align-items:center;justify-content:space-between;margin:0 0 18px}\
#prc-listings input,#prc-listings select{padding:9px 12px;border:1px solid #cfd6de;border-radius:6px;font:inherit;font-size:15px;background:#fff}\
#prc-listings input{flex:1;min-width:180px}\
#prc-listings .prc-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:18px}\
#prc-listings .prc-card{display:flex;flex-direction:column;border:1px solid #e3e8ee;border-radius:10px;overflow:hidden;background:#fff;transition:box-shadow .15s}\
#prc-listings .prc-card:hover{box-shadow:0 6px 18px rgba(0,0,0,.08)}\
#prc-listings .prc-img{aspect-ratio:1/1;background:#f5f7f9;display:flex;align-items:center;justify-content:center}\
#prc-listings .prc-img img{max-width:100%;max-height:100%;object-fit:contain}\
#prc-listings .prc-body{padding:14px;display:flex;flex-direction:column;gap:6px;flex:1}\
#prc-listings .prc-title{font-size:15px;line-height:1.35;margin:0;font-weight:600}\
#prc-listings .prc-cond{font-size:13px;color:#5f6b7a}\
#prc-listings .prc-price{font-size:20px;font-weight:700;margin-top:auto}\
#prc-listings .prc-was{font-size:14px;color:#8a95a3;text-decoration:line-through;margin-left:6px;font-weight:400}\
#prc-listings .prc-btn{display:block;text-align:center;background:#0b5cad;color:#fff;text-decoration:none;padding:10px;border-radius:6px;font-weight:600;font-size:14px}\
#prc-listings .prc-btn:hover{background:#094a8b}\
#prc-listings .prc-note{font-size:13px;color:#5f6b7a;margin-top:16px;text-align:center}";
  var style = document.createElement("style"); style.textContent = css; document.head.appendChild(style);

  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
    return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function money(v, cur) {
    try { return new Intl.NumberFormat("en-GB", { style: "currency", currency: cur || "GBP" }).format(v); }
    catch (e) { return "£" + Number(v).toFixed(2); }
  }

  root.innerHTML = '<p class="prc-note">Loading our latest stock…</p>';

  fetch(base + "listings.json?t=" + Date.now())
    .then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
    .then(function (data) {
      var items = data.listings || [];
      if (!items.length) { root.innerHTML = '<p class="prc-note">No items listed right now – check back soon.</p>'; return; }

      root.innerHTML =
        '<div class="prc-bar"><input type="search" placeholder="Search ' + items.length + ' items…" aria-label="Search items">' +
        '<select aria-label="Sort"><option value="new">Newest first</option><option value="low">Price: low to high</option><option value="high">Price: high to low</option></select></div>' +
        '<div class="prc-grid"></div>' +
        '<p class="prc-note">All items are sold through our eBay shop. Updated ' +
        esc(new Date(data.updated).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" })) + '.</p>';

      var grid = root.querySelector(".prc-grid"), search = root.querySelector("input"), sort = root.querySelector("select");

      function render() {
        var q = search.value.toLowerCase().trim();
        var list = items.filter(function (i) { return !q || i.title.toLowerCase().indexOf(q) > -1; });
        if (sort.value === "low") list.sort(function (a, b) { return a.price - b.price; });
        if (sort.value === "high") list.sort(function (a, b) { return b.price - a.price; });
        grid.innerHTML = list.map(function (i) {
          var was = i.wasPrice && i.wasPrice > i.price ? '<span class="prc-was">' + money(i.wasPrice, i.currency) + "</span>" : "";
          var auction = i.buyingOptions.indexOf("AUCTION") > -1 && i.buyingOptions.indexOf("FIXED_PRICE") < 0;
          return '<div class="prc-card"><div class="prc-img">' +
            (i.image ? '<img loading="lazy" src="' + esc(i.image) + '" alt="' + esc(i.title) + '">' : "") +
            '</div><div class="prc-body"><h3 class="prc-title">' + esc(i.title) + "</h3>" +
            (i.condition ? '<div class="prc-cond">' + esc(i.condition) + "</div>" : "") +
            '<div class="prc-price">' + (i.price != null ? money(i.price, i.currency) : "") + was + "</div>" +
            '<a class="prc-btn" href="' + esc(i.url) + '" target="_blank" rel="noopener">' +
            (auction ? "Bid on eBay" : "Buy on eBay") + "</a></div></div>";
        }).join("") || '<p class="prc-note">No items match your search.</p>';
      }
      search.addEventListener("input", render);
      sort.addEventListener("change", render);
      render();
    })
    .catch(function () { root.innerHTML = '<p class="prc-note">Couldn\'t load listings right now.</p>'; });
})();
