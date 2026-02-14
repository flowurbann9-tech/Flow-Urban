import { STORE, PRODUCTS } from "./products.js";

(() => {
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

  const CART_KEY = "flowurban_cart_v2";

  const money = (n) => {
    try {
      return new Intl.NumberFormat("es-EC", { style: "currency", currency: "USD" }).format(n);
    } catch {
      return `$${Number(n || 0).toFixed(2)}`.replace(".", ",");
    }
  };

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

  const cartCount = () => Object.values(cart).reduce((a, b) => a + b, 0);

  const cartTotal = () => {
    let total = 0;
    for (const [id, qty] of Object.entries(cart)) {
      const p = PRODUCTS.find(x => x.id === id);
      if (!p) continue;
      total += (p.price || 0) * qty;
    }
    return total;
  };

  // ============ DRAWER (NO abrir solo) ============
  function openDrawer() {
    document.body.classList.add("drawerOpen");
    els.cartDrawer.setAttribute("aria-hidden", "false");
    els.backdrop.setAttribute("aria-hidden", "false");
  }
  function closeDrawer() {
    document.body.classList.remove("drawerOpen");
    els.cartDrawer.setAttribute("aria-hidden", "true");
    els.backdrop.setAttribute("aria-hidden", "true");
  }

  // ============ WHATSAPP LINKS (TODO al MISMO número) ============
  function setWaLinks() {
    const number = STORE.whatsappSales2 || STORE.whatsappSales1;
    const base = `https://wa.me/${number}`;
    const text = encodeURIComponent("Hola Flow Urban, quiero hacer un pedido.");

    const link = `${base}?text=${text}`;

    if (els.topWa) els.topWa.href = link;
    if (els.waHeader) els.waHeader.href = link;
    if (els.waContact) els.waContact.href = link;
    if (els.floatWa) els.floatWa.href = link;

    // socials
    if (els.igBtn) els.igBtn.href = STORE.instagram || "#";
    if (els.ttBtn) els.ttBtn.href = STORE.tiktok || "#";

    // botón del carrito se actualiza en renderCart con el pedido real
    if (els.waOrderBtn) els.waOrderBtn.href = link;
  }

  // ============ FILTROS ============
  function buildCategorySelect() {
    const cats = ["Todas", ...Array.from(new Set(PRODUCTS.map(p => p.category))).sort()];
    els.categorySelect.innerHTML = cats.map(c => `<option value="${c}">${c}</option>`).join("");
  }

  function applyFilters() {
    const q = (els.searchInput.value || "").trim().toLowerCase();
    const cat = els.categorySelect.value;
    let out = PRODUCTS.filter(p => {
      const matchQ = !q || `${p.name} ${p.category}`.toLowerCase().includes(q);
      const matchCat = !cat || cat === "Todas" || p.category === cat;
      return matchQ && matchCat;
    });

    const sort = els.sortSelect.value;
    if (sort === "priceAsc") out.sort((a, b) => (a.price || 0) - (b.price || 0));
    if (sort === "priceDesc") out.sort((a, b) => (b.price || 0) - (a.price || 0));
    if (sort === "nameAsc") out.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
    if (sort === "featured") out.sort((a, b) => (b.badge === "Top") - (a.badge === "Top"));

    return out;
  }

  // ============ PRODUCTOS (2 en 2 en móvil) ============
  function productCardHTML(p) {
    const badge = p.badge ? `<div class="badge">${p.badge}</div>` : "";
    const img = p.image || "assets/logo.png";
    return `
      <article class="card">
        <div class="media">
          ${badge}
          <img src="${img}" alt="${p.name}" loading="lazy"
               onerror="this.onerror=null; this.src='assets/logo.png'; this.style.objectFit='contain'; this.style.padding='18px';" />
          <button class="hit" data-add="${p.id}" title="Agregar" type="button">
            <span class="plus">+</span>
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
    const filtered = applyFilters();
    els.resultsCount.textContent = `${filtered.length} productos`;
    els.productsGrid.innerHTML = filtered.map(productCardHTML).join("");
  }

  // ============ CARRITO ============
  function renderCart() {
    els.cartCount.textContent = String(cartCount());
    els.cartTotal.textContent = money(cartTotal());

    const number = STORE.whatsappSales2 || STORE.whatsappSales1;
    const base = `https://wa.me/${number}`;

    const entries = Object.entries(cart);

    if (entries.length === 0) {
      els.cartItems.innerHTML = `<div class="muted">Tu carrito está vacío.</div>`;
      els.waOrderBtn.href = `${base}?text=${encodeURIComponent("Hola Flow Urban, quiero hacer un pedido 😄")}`;
      return;
    }

    let msgLines = [];
    let msg = `Hola! Quiero hacer este pedido en Flow Urban:\n\n`;

    els.cartItems.innerHTML = entries.map(([id, qty]) => {
      const p = PRODUCTS.find(x => x.id === id);
      if (!p) return "";

      msgLines.push(`• ${p.name} x${qty} — ${money((p.price || 0) * qty)}`);

      return `
        <div class="ci">
          <div class="ci__img">
            <img src="${p.image || "assets/logo.png"}" alt="${p.name}"
                 onerror="this.onerror=null; this.src='assets/logo.png'; this.style.objectFit='contain'; this.style.padding='10px';" />
          </div>
          <div class="ci__info">
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
    }).join("");

    msg += msgLines.join("\n");
    msg += `\n\nTotal: ${money(cartTotal())}\n\n¿Me confirmas disponibilidad y envío?`;

    els.waOrderBtn.href = `${base}?text=${encodeURIComponent(msg)}`;
  }

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
    cart[id] = (cart[id] || 0) + 1;
    saveCart(cart);
    renderCart();
  }
  function delCart(id) {
    delete cart[id];
    saveCart(cart);
    renderCart();
  }

  function viewProduct(id) {
    const p = PRODUCTS.find(x => x.id === id);
    if (!p) return;
    alert(`${p.name}\n${p.category}\n${money(p.price || 0)}\nTallas: ${(p.sizes || []).join(", ")}`);
  }

  // ============ LOADER rápido ============
  function fastLoader() {
    let pct = 15;
    const tick = setInterval(() => {
      pct = Math.min(92, pct + 10);
      els.barFill.style.width = pct + "%";
    }, 120);

    const preload = (src) => new Promise((res) => {
      const img = new Image();
      img.onload = () => res();
      img.onerror = () => res();
      img.src = src;
    });

    const critical = ["assets/logo.png", "assets/loader.png", "assets/hero.jpg"];
    const timeout = new Promise((res) => setTimeout(res, 1200));

    Promise.race([Promise.all(critical.map(preload)), timeout]).then(() => {
      clearInterval(tick);
      els.barFill.style.width = "100%";
      setTimeout(() => {
        els.loader.style.display = "none";
        els.loader.setAttribute("aria-hidden", "true");
      }, 120);
    });
  }

  function wireUI() {
    setWaLinks();

    // 100% cerrado al cargar (evita “carrito colgado”)
    closeDrawer();
    renderCart();

    buildCategorySelect();
    renderProducts();

    els.searchInput.addEventListener("input", renderProducts);
    els.categorySelect.addEventListener("change", renderProducts);
    els.sortSelect.addEventListener("change", renderProducts);

    els.clearBtn.addEventListener("click", () => {
      els.searchInput.value = "";
      els.categorySelect.value = "Todas";
      els.sortSelect.value = "featured";
      renderProducts();
    });

    els.productsGrid.addEventListener("click", (e) => {
      const addBtn = e.target.closest("[data-add]");
      const viewBtn = e.target.closest("[data-view]");
      if (addBtn) {
        addToCart(addBtn.getAttribute("data-add"));
        openDrawer(); // abre carrito al agregar
      }
      if (viewBtn) viewProduct(viewBtn.getAttribute("data-view"));
    });

    els.openCartBtn.addEventListener("click", openDrawer);
    els.closeCartBtn.addEventListener("click", closeDrawer);
    els.backdrop.addEventListener("click", closeDrawer);

    els.cartItems.addEventListener("click", (e) => {
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
