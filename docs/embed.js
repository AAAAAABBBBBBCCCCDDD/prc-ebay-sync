/* PRC Distribution – live stock + PayPal checkout widget.
   Paste into an HTML/Embed block on your site:
     <div id="prc-listings"></div>
     <script src="https://aaaaaabbbbbbccccddd.github.io/prc-ebay-sync/embed.js"></script>
*/
(function () {
  var API = "https://prc-shop.simonraivid907.workers.dev";
  var script = document.currentScript;
  if (script && script.getAttribute("data-api")) API = script.getAttribute("data-api");
  var root = document.getElementById("prc-listings");
  if (!root) { root = document.createElement("div"); script.parentNode.insertBefore(root, script); }

  var css = [
    "#prc-listings{font-family:inherit;color:#1f2933}",
    "#prc-listings .prc-bar{display:flex;flex-wrap:wrap;gap:10px;margin:0 0 18px}",
    "#prc-listings input[type=search],#prc-listings select{padding:9px 12px;border:1px solid #cfd6de;border-radius:6px;font:inherit;font-size:15px;background:#fff}",
    "#prc-listings input[type=search]{flex:1;min-width:180px}",
    "#prc-listings .prc-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:18px}",
    "#prc-listings .prc-card{display:flex;flex-direction:column;border:1px solid #e3e8ee;border-radius:10px;overflow:hidden;background:#fff;cursor:pointer;transition:box-shadow .15s}",
    "#prc-listings .prc-card:hover{box-shadow:0 6px 18px rgba(0,0,0,.08)}",
    "#prc-listings .prc-img{aspect-ratio:1/1;background:#f5f7f9;display:flex;align-items:center;justify-content:center}",
    "#prc-listings .prc-img img{max-width:100%;max-height:100%;object-fit:contain}",
    "#prc-listings .prc-body{padding:14px;display:flex;flex-direction:column;gap:6px;flex:1}",
    "#prc-listings .prc-title{font-size:15px;line-height:1.35;margin:0;font-weight:600}",
    "#prc-listings .prc-meta{font-size:13px;color:#5f6b7a}",
    "#prc-listings .prc-price{font-size:20px;font-weight:700;margin-top:auto}",
    "#prc-listings .prc-btn{display:block;width:100%;text-align:center;background:#0b5cad;color:#fff;border:0;text-decoration:none;padding:10px;border-radius:6px;font-weight:600;font-size:14px;cursor:pointer}",
    "#prc-listings .prc-note{font-size:13px;color:#5f6b7a;margin-top:16px;text-align:center}",
    ".prc-modal-bg{position:fixed;inset:0;background:rgba(15,23,32,.55);z-index:99999;display:flex;align-items:flex-start;justify-content:center;overflow:auto;padding:20px}",
    ".prc-modal{background:#fff;color:#1f2933;border-radius:12px;max-width:760px;width:100%;padding:22px;position:relative;font-family:inherit}",
    ".prc-close{position:absolute;right:12px;top:8px;border:0;background:none;font-size:28px;cursor:pointer;color:#5f6b7a}",
    ".prc-m-grid{display:grid;grid-template-columns:1fr 1fr;gap:22px}",
    "@media(max-width:640px){.prc-m-grid{grid-template-columns:1fr}}",
    ".prc-main{aspect-ratio:1/1;background:#f5f7f9;border-radius:8px;display:flex;align-items:center;justify-content:center}",
    ".prc-main img{max-width:100%;max-height:100%;object-fit:contain}",
    ".prc-thumbs{display:flex;gap:6px;margin-top:8px;flex-wrap:wrap}",
    ".prc-thumbs img{width:54px;height:54px;object-fit:cover;border-radius:5px;border:2px solid transparent;cursor:pointer}",
    ".prc-thumbs img.on{border-color:#0b5cad}",
    ".prc-modal h2{font-size:19px;line-height:1.3;margin:0 0 8px}",
    ".prc-opt{display:flex;gap:10px;align-items:center;border:1px solid #cfd6de;border-radius:8px;padding:10px 12px;margin:8px 0;cursor:pointer;font-size:15px}",
    ".prc-opt input{margin:0}",
    ".prc-total{font-size:22px;font-weight:700;margin:14px 0}",
    ".prc-msg{padding:12px;border-radius:8px;font-size:15px;margin-top:10px}",
    ".prc-ok{background:#e7f6ec;color:#17643a}.prc-err{background:#fdecec;color:#9b1c1c}",
  ].join("");
  var style = document.createElement("style"); style.textContent = css; document.head.appendChild(style);

  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
    return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function money(v) { try { return new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP" }).format(v); } catch (e) { return "£" + Number(v).toFixed(2); } }
  function deliveryText(i) {
    if (i.postage === null) return "Collection only";
    return (i.postage ? "Postage " + money(i.postage) : "Free postage") + (i.collection ? " · or collect" : "");
  }

  var ppReady = null;
  function loadPayPal() {
    if (ppReady) return ppReady;
    ppReady = fetch(API + "/api/config").then(function (r) { return r.json(); }).then(function (cfg) {
      return new Promise(function (res, rej) {
        var s = document.createElement("script");
        s.src = "https://www.paypal.com/sdk/js?client-id=" + encodeURIComponent(cfg.paypalClientId) + "&currency=GBP&intent=capture";
        s.onload = function () { res(window.paypal); }; s.onerror = rej;
        document.head.appendChild(s);
      });
    });
    return ppReady;
  }

  function openItem(i, onSold) {
    var bg = document.createElement("div"); bg.className = "prc-modal-bg";
    var imgs = (i.images && i.images.length ? i.images : [i.image]).filter(Boolean);
    var opts = "";
    if (i.postage !== null) opts += '<label class="prc-opt"><input type="radio" name="prc-del" value="post"> Delivery – ' + (i.postage ? money(i.postage) : "Free") + "</label>";
    if (i.collection) opts += '<label class="prc-opt"><input type="radio" name="prc-del" value="collect"> Collection' + (i.location ? " from " + esc(i.location) : "") + " – Free</label>";
    bg.innerHTML = '<div class="prc-modal" role="dialog" aria-modal="true"><button class="prc-close" aria-label="Close">×</button><div class="prc-m-grid"><div>' +
      '<div class="prc-main">' + (imgs[0] ? '<img src="' + esc(imgs[0]) + '" alt="">' : "") + "</div>" +
      '<div class="prc-thumbs">' + (imgs.length > 1 ? imgs.map(function (u, n) { return '<img src="' + esc(u) + '" class="' + (n ? "" : "on") + '" alt="">'; }).join("") : "") + "</div></div>" +
      "<div><h2>" + esc(i.title) + '</h2><div class="prc-meta">' + esc(i.condition) + (i.quantity > 1 ? " · " + i.quantity + " available" : "") + "</div>" +
      '<div class="prc-total" data-price>' + money(i.price) + "</div>" +
      (i.auction ? '<p class="prc-meta">This item is an auction – bidding is on eBay.</p><a class="prc-btn" target="_blank" rel="noopener" href="' + esc(i.url) + '">Bid on eBay</a>'
        : '<div class="prc-meta" style="font-weight:600;margin-top:6px">Choose delivery</div>' + opts +
          '<div class="prc-total" data-total style="display:none"></div><div data-pp></div><div data-msg></div>') +
      "</div></div></div>";
    document.body.appendChild(bg);
    function close() { bg.remove(); }
    bg.querySelector(".prc-close").onclick = close;
    bg.addEventListener("click", function (e) { if (e.target === bg) close(); });
    var main = bg.querySelector(".prc-main img");
    [].forEach.call(bg.querySelectorAll(".prc-thumbs img"), function (t) {
      t.onclick = function () { main.src = t.src; [].forEach.call(bg.querySelectorAll(".prc-thumbs img"), function (x) { x.classList.toggle("on", x === t); }); };
    });
    if (i.auction) return;

    var totalEl = bg.querySelector("[data-total]"), ppEl = bg.querySelector("[data-pp]"), msg = bg.querySelector("[data-msg]");
    var delivery = null, rendered = false;
    function show(text, ok) { msg.innerHTML = '<div class="prc-msg ' + (ok ? "prc-ok" : "prc-err") + '">' + text + "</div>"; }
    [].forEach.call(bg.querySelectorAll("input[name=prc-del]"), function (r) {
      r.onchange = function () {
        delivery = r.value;
        var t = i.price + (delivery === "post" ? i.postage : 0);
        totalEl.style.display = ""; totalEl.textContent = "Total " + money(t);
        if (!rendered) { rendered = true; renderButtons(); }
      };
    });
    var radios = bg.querySelectorAll("input[name=prc-del]");
    if (radios.length === 1) { radios[0].checked = true; radios[0].onchange(); }

    function renderButtons() {
      ppEl.innerHTML = '<p class="prc-meta">Loading secure checkout…</p>';
      loadPayPal().then(function (paypal) {
        ppEl.innerHTML = "";
        paypal.Buttons({
          style: { layout: "vertical", shape: "rect", label: "pay" },
          createOrder: function () {
            msg.innerHTML = "";
            return fetch(API + "/api/orders", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ itemId: i.id, delivery: delivery }) })
              .then(function (r) { return r.json().then(function (j) { if (!r.ok) throw new Error(j.error); return j.id; }); });
          },
          onApprove: function (data) {
            return fetch(API + "/api/orders/" + data.orderID + "/capture", { method: "POST" })
              .then(function (r) { return r.json().then(function (j) { if (!r.ok) throw new Error(j.error); return j; }); })
              .then(function () {
                ppEl.innerHTML = "";
                bg.querySelectorAll(".prc-opt").forEach(function (o) { o.style.display = "none"; });
                show("<strong>Thank you – your order is confirmed!</strong><br>A receipt is on its way from PayPal. " +
                  (delivery === "collect" ? "We'll be in touch to arrange collection." : "We'll dispatch your item shortly."), true);
                onSold(i);
              });
          },
          onError: function (err) { show(esc((err && err.message) || "Something went wrong – you have not been charged.")); },
        }).render(ppEl);
      }).catch(function () { ppEl.innerHTML = ""; show("Checkout couldn't load. Please refresh and try again."); });
    }
  }

  root.innerHTML = '<p class="prc-note">Loading our latest stock…</p>';
  fetch(API + "/api/listings")
    .then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
    .then(function (data) {
      var items = data.listings || [];
      if (!items.length) { root.innerHTML = '<p class="prc-note">No items listed right now – check back soon.</p>'; return; }
      root.innerHTML =
        '<div class="prc-bar"><input type="search" placeholder="Search ' + items.length + ' items…" aria-label="Search items">' +
        '<select aria-label="Sort"><option value="new">Newest first</option><option value="low">Price: low to high</option><option value="high">Price: high to low</option></select></div>' +
        '<div class="prc-grid"></div><p class="prc-note">Secure checkout with PayPal or card.</p>';
      var grid = root.querySelector(".prc-grid"), search = root.querySelector("input"), sort = root.querySelector("select");
      function sold(i) { items = items.filter(function (x) { return x.id !== i.id || --x.quantity > 0; }); render(); }
      function render() {
        var q = search.value.toLowerCase().trim();
        var list = items.filter(function (i) { return !q || i.title.toLowerCase().indexOf(q) > -1; });
        if (sort.value === "low") list.sort(function (a, b) { return a.price - b.price; });
        if (sort.value === "high") list.sort(function (a, b) { return b.price - a.price; });
        grid.innerHTML = list.map(function (i) {
          return '<div class="prc-card" data-id="' + esc(i.id) + '"><div class="prc-img">' +
            (i.image ? '<img loading="lazy" src="' + esc(i.image) + '" alt="' + esc(i.title) + '">' : "") +
            '</div><div class="prc-body"><h3 class="prc-title">' + esc(i.title) + "</h3>" +
            '<div class="prc-meta">' + esc(i.condition) + "</div>" +
            '<div class="prc-meta">' + esc(deliveryText(i)) + "</div>" +
            '<div class="prc-price">' + money(i.price) + "</div>" +
            '<button class="prc-btn" type="button">' + (i.auction ? "View auction" : "Buy now") + "</button></div></div>";
        }).join("") || '<p class="prc-note">No items match your search.</p>';
      }
      grid.addEventListener("click", function (e) {
        var card = e.target.closest(".prc-card"); if (!card) return;
        var it = items.find(function (x) { return x.id === card.getAttribute("data-id"); });
        if (it) openItem(it, sold);
      });
      search.addEventListener("input", render);
      sort.addEventListener("change", render);
      render();
    })
    .catch(function () { root.innerHTML = '<p class="prc-note">Couldn\'t load our stock right now – please try again shortly.</p>'; });
})();
