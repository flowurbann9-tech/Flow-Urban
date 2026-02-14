(() => {
  // ✅ WhatsApp único (SIN +)
  const WA_NUMBER = "593962722395";

  const els = {
    topWa: document.getElementById("topWa"),
    waHeader: document.getElementById("waHeader"),
    waContact: document.getElementById("waContact"),
    floatWa: document.getElementById("floatWa"),
    igBtn: document.getElementById("igBtn"),
    ttBtn: document.getElementById("ttBtn"),

    productsGrid: document.getElementById("productsGrid"),
    resultsCount: document.getElementById("resultsCount"),
    searchInput: document.getElementById("searchInput"),
    categorySelect: document.getElementById("categorySelect"),
    sortSelect: document.getElementById("sortSelect"),
    clearBtn: document.getElementById("clearBtn"),

    openCartBtn: document.getElementById("openCartBtn"),
    closeCartBtn: document.getElementById("closeCartBtn"),
    cartDrawer: document.getElementById("cartDrawer"),
    backdrop: document.getElementById("backdrop"),

    cartItems: document.getElementById("cartItems"),
    cartCount: document.getElementById("cartCount"),
    cartTotal: document.getElementById("cartTotal"),
    waOrderBtn: document.getElementById("waOrderBtn"),

    loader: document.getElementById("loader"),
    barFill: document.getElementById("barFill"),
  };

  const money = (n) => {
    try {
      return new Intl.NumberFormat("es-EC", { style: "currency", currency: "USD" }).format(n);
    } catch {
      return `$${Number(n || 0).toFixed(2)}`.replace(".", ",");
    }
  };

  const isVideo = (url) => /\.(mp4|webm|ogg)$/i.test(url || "");
  const getProducts = () => (window.PRODUCTS || []).slice();

  // Cart in localStorage
  const CART_KEY = "flowurban_cart_v1";
  const loadCart = () => {
    try {
      const raw = localStorage.getItem(CART_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  };
  const saveCart = (cart) => localStorage.setItem(CART_KEY, JSON.stringify(cart));
  let cart = loadCart();

  function cartCount() {
    return Object.values(cart).reduce((a, b) => a + b, 0);
  }

  function cartTotal() {
    const products = getProducts();
    const map = new Map(products.map((p) => [p.id, p]));
    let total = 0;
    for (const [id, qty] of Object.entries(cart)) {
      const p = map.get(id);
      if (!p) continue;
      total += (p.price || 0) * qty;
    }
    return total;
  }

  // Drawer controls (✅ NO abrir al cargar)
  function openDrawer() {
    document.body.classList.add("drawerOpen");
    if (els.cartDrawer) els.cartDrawer.setAttribute("aria-hidden", "false");
    if (els.backdrop) els.backdrop.setAttribute("aria-hidden", "false");
  }
  function closeDrawer() {
    document.body.classList.remove("drawerOpen");
    if (els.cartDrawer) els.cartDrawer.setAttribute("aria-hidden", "true");
    if (els.backdrop) els.backdrop.setAttribute("aria-hidden", "true");
  }

  // ✅ Todos los WhatsApp al MISMO número
  function setWaLinks() {
    const text = "Hola Flow Urban, quiero hacer un pedido.";
    const link = `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(text)}`;

    if (els.topWa) els.topWa.href = link;
    if (els.waHeader) els.waHeader.href = link;
    if (els.waContact) els.waContact.href = link;
    if (els.floatWa) els.floatWa.href = link;

    // redes (pon tus links reales si quieres)
    if (els.igBtn) els.igBtn.href = "#";
    if (els.ttBtn) els.ttBtn.href = "#";

    // el botón del carrito se setea con pedido en renderCart, pero dejamos link por defecto
    if (els.waOrderBtn) els.waOrderBtn.href = link;
  }

  // Filters / sort
  function buildCategorySelect(products) {
    if (!els.categorySelect) return;
    const cats = ["Todas", ...Array.from(new Set(products.map((p) => p.category))).sort()];
    els.categorySelect.innerHTML = cats.map((c) => `<option value="${c}">${c}</option>`).join("");
  }

  function applyFilters(products) {
    const q = (els.searchInput?.value || "").trim().toLowerCase();
    const cat = els.categorySelect?.value || "Todas";

    let out = products.filter((p) => {
      const matchQ = !q || `${p.name} ${p.category}`.toLowerCase().includes(q);
      const matchCat = cat === "Todas" || p.category === cat;
      return matchQ && matchCat;
    });

    const sort = els.sortSelect?.value || "featured";
    if (sort === "priceAsc") out.sort((a, b) => (a.price || 0) - (b.price || 0));
    if (sort === "priceDesc") out.sort((a, b) => (b.price || 0) - (a.price || 0));
    if (sort === "nameAsc") out.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
    if (sort === "featured") out.sort((a, b) => (b.featured === true) - (a.featured === true));

    return out;
  }

  // Product Card
  function productCardHTML(p) {
    const badge = p.tag ? `<div class="badge">${p.tag}</div>` : "";
    const plus = `<div class="plus" aria-hidden="true">+</div>`;

    const media = p.media || "";
    const mediaHTML = isVideo(media)
      ? `<video src="${media}" muted playsinline loop></video>`
      : `<img src="${media}" alt="${p.name}" loading="lazy"
            onerror="this.onerror=null; this.src='assets/logo.png'; this.style.objectFit='contain'; this.style.padding='18px';" />`;

    return `
      <article class="card">
        <div class="media">
          ${badge}
          ${mediaHTML}
          <button class="hit" data-add="${p.id}" title="Agregar" style="all:unset;cursor:pointer;position:absolute;inset:0">
            ${plus}
          </button>
        </div>
        <div class="card__body">
          <div class="title">${p.name}</div>
          <div class="meta">${p.category}</div>
          <div class="price">${money(p.price || 0)}</div>
          <div class="sizes">Tallas: ${(p.sizes || []).join(", ")}</div>
          <div class="actions">
            <button class="btn btn--ghost" data-view="${p.id}" type="button">Ver</button>
            <button class="btn btn--gold" data-add="${p.id}" type="button">Agregar</button>
          </div>
        </div>
      </article>
    `;
  }

  function renderProducts() {
    const products = getProducts();
    const filtered = applyFilters(products);

    if (els.resultsCount) els.resultsCount.textContent = `${filtered.length} productos`;
    if (els.productsGrid) els.productsGrid.innerHTML = filtered.map(productCardHTML).join("");

    requestAnimationFrame(() => {
      els.productsGrid?.querySelectorAll("video").forEach((v) => v.play().catch(() => {}));
    });
  }

  // Cart render (✅ manda pedido + total al mismo número)
  function renderCart() {
    const products = getProducts();
    const map = new Map(products.map((p) => [p.id, p]));
    const entries = Object.entries(cart);

    if (els.cartCount) els.cartCount.textContent = String(cartCount());
    if (els.cartTotal) els.cartTotal.textContent = money(cartTotal());

    if (!els.cartItems || !els.waOrderBtn) return;

    const base = `https://wa.me/${WA_NUMBER}`;

    if (entries.length === 0) {
      els.cartItems.innerHTML = `<div class="muted">Tu carrito está vacío.</div>`;
      els.waOrderBtn.href = `${base}?text=${encodeURIComponent("Hola Flow Urban! Quiero hacer un pedido 😄")}`;
      return;
    }

    const lines = [];
    let msg = `Hola! Quiero hacer este pedido en Flow Urban:%0A%0A`;

    els.cartItems.innerHTML = entries
      .map(([id, qty]) => {
        const p = map.get(id);
        if (!p) return "";

        const line = `• ${p.name} (${(p.sizes || []).join("/")}) x${qty} — ${money((p.price || 0) * qty)}`;
        lines.push(line);

        const imgSrc = p.media && !isVideo(p.media) ? p.media : "assets/logo.png";

        return `
          <div class="ci">
            <div class="ci__img">
              <img src="${imgSrc}" alt="${p.name}"
                onerror="this.onerror=null; this.src='assets/logo.png'; this.style.objectFit='contain'; this.style.padding='10px';" />
            </div>
            <div>
              <div class="ci__name">${p.name}</div>
              <div class="ci__sub">${p.category} • ${money(p.price || 0)}</div>
              <div class="ci__row">
                <div class="qty">
                  <button type="button" data-dec="${id}">−</button>
                  <strong>${qty}</strong>
                  <button type="button" data-inc="${id}">+</button>
                </div>
                <button class="iconBtn trash" type="button" data-del="${id}" title="Quitar">🗑</button>
              </div>
            </div>
          </div>
        `;
      })
      .join("");

    msg += lines.join("%0A");
    msg += `%0A%0ATotal: ${encodeURIComponent(money(cartTotal()))}%0A%0A¿Me confirmas disponibilidad y envío?`;

    els.waOrderBtn.href = `${base}?text=${msg}`;
  }

  // Actions
  function addToCart(id) {
    cart[id] = (cart[id] || 0) + 1;
    saveCart(cart);
    renderCart();
  }
  function decCart(id) {
    if (!cart[id]) return;
    cart[id] -= 1;
    if (cart[id] <= 0) delete cart[id];
    saveCart(cart);
    renderCart();
  }
  function incCart(id) {
    if (!cart[id]) cart[id] = 0;
    cart[id] += 1;
    saveCart(cart);
    renderCart();
  }
  function delCart(id) {
    delete cart[id];
    saveCart(cart);
    renderCart();
  }

  // Simple modal "Ver"
  function viewProduct(id) {
    const p = getProducts().find((x) => x.id === id);
    if (!p) return;
    alert(`${p.name}\n${p.category}\n${money(p.price || 0)}\nTallas: ${(p.sizes || []).join(", ")}`);
  }

  // Loader fast (max 1500ms)
  function fastLoader() {
    if (!els.loader || !els.barFill) return;

    let pct = 20;
    const tick = setInterval(() => {
      pct = Math.min(95, pct + 10);
      els.barFill.style.width = pct + "%";
    }, 120);

    const preload = (src) =>
      new Promise((res) => {
        if (!src) return res();
        const img = new Image();
        img.onload = () => res();
        img.onerror = () => res();
        img.src = src;
      });

    const critical = ["assets/logo.png", "assets/loader.png", "assets/hero.jpg"];
    const timeout = new Promise((res) => setTimeout(res, 1500));

    Promise.race([Promise.all(critical.map(preload)), timeout]).then(() => {
      clearInterval(tick);
      els.barFill.style.width = "100%";
      setTimeout(() => {
        els.loader.style.display = "none";
        els.loader.setAttribute("aria-hidden", "true");
      }, 200);
    });
  }

  function wireUI() {
    setWaLinks();

    // ✅ asegurar que el drawer esté cerrado al cargar
    closeDrawer();
    renderCart();

    const products = getProducts();
    buildCategorySelect(products);
    renderProducts();

    els.searchInput?.addEventListener("input", renderProducts);
    els.categorySelect?.addEventListener("change", renderProducts);
    els.sortSelect?.addEventListener("change", renderProducts);

    els.clearBtn?.addEventListener("click", () => {
      if (els.searchInput) els.searchInput.value = "";
      if (els.categorySelect) els.categorySelect.value = "Todas";
      if (els.sortSelect) els.sortSelect.value = "featured";
      renderProducts();
    });

    els.productsGrid?.addEventListener("click", (e) => {
      const addBtn = e.target.closest("[data-add]");
      const viewBtn = e.target.closest("[data-view]");
      if (addBtn) {
        const id = addBtn.getAttribute("data-add");
        addToCart(id);
        openDrawer();
      }
      if (viewBtn) {
        const id = viewBtn.getAttribute("data-view");
        viewProduct(id);
      }
    });

    els.openCartBtn?.addEventListener("click", () => openDrawer());
    els.closeCartBtn?.addEventListener("click", () => closeDrawer());
    els.backdrop?.addEventListener("click", () => closeDrawer());

    els.cartItems?.addEventListener("click", (e) => {
      const dec = e.target.closest("[data-dec]");
      const inc = e.target.closest("[data-inc]");
      const del = e.target.closest("[data-del]");
      if (dec) decCart(dec.getAttribute("data-dec"));
      if (inc) incCart(inc.getAttribute("data-inc"));
      if (del) delCart(del.getAttribute("data-del"));
    });

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") closeDrawer();
    });
  }

  document.addEventListener("DOMContentLoaded", () => {
    wireUI();
    fastLoader();
  });
})();
