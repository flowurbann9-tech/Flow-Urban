import { STORE, PRODUCTS as FALLBACK_PRODUCTS } from "./products.js";

(() => {

  /* =========================
     CONFIG
  ========================= */

  const WA_NUMBER = STORE?.whatsappNumber || "593962722395";
  const WA_TEXT_DEFAULT =
    "Hola Flow Urban 👋🔥 Quiero hacer un pedido 🛍️ ¿Me ayudas, por favor?";

  const els = {
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

  const waLink = (text = WA_TEXT_DEFAULT) =>
    `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(text)}`;

  const money = (n) =>
    new Intl.NumberFormat("es-EC", {
      style: "currency",
      currency: "USD",
    }).format(n || 0);

  /* =========================
     PRODUCTS
  ========================= */

  let PRODUCTS = Array.isArray(FALLBACK_PRODUCTS)
    ? [...FALLBACK_PRODUCTS]
    : [];

  async function loadProductsFromCSV() {
    const url = `data/productos.csv?v=${Date.now()}`;
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) throw new Error("No se pudo cargar productos.csv");
    const text = await res.text();
    const rows = text.trim().split("\n").map(r => r.split(","));
    const headers = rows[0];

    PRODUCTS = rows.slice(1).map(r => ({
      id: r[0],
      name: r[1],
      category: r[2],
      price: parseFloat(r[3]),
      sizes: r[4]?.split("|") || [],
      tag: r[5],
      media: r[6],
      featured: r[7] === "true"
    }));
  }

  /* =========================
     CART
  ========================= */

  const CART_KEY = "flowurban_cart_v1";
  let cart = JSON.parse(localStorage.getItem(CART_KEY) || "{}");

  function saveCart() {
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
  }

  function cartCount() {
    return Object.values(cart).reduce((a, b) => a + b, 0);
  }

  function cartTotal() {
    let total = 0;
    for (const [id, qty] of Object.entries(cart)) {
      const p = PRODUCTS.find(x => x.id === id);
      if (p) total += p.price * qty;
    }
    return total;
  }

  function renderCart() {
    if (!els.cartItems) return;

    els.cartCount.textContent = cartCount();
    els.cartTotal.textContent = money(cartTotal());

    const entries = Object.entries(cart);

    if (!entries.length) {
      els.cartItems.innerHTML = `<div class="muted">Tu carrito está vacío.</div>`;
      return;
    }

    els.cartItems.innerHTML = entries.map(([id, qty]) => {
      const p = PRODUCTS.find(x => x.id === id);
      if (!p) return "";
      return `
        <div class="ci">
          <div>${p.name}</div>
          <div>x${qty}</div>
        </div>
      `;
    }).join("");

    els.waOrderBtn.href = waLink(
      `Hola Flow Urban 👋🔥 Quiero hacer este pedido:\n\nTotal: ${money(cartTotal())}`
    );
  }

  function addToCart(id) {
    cart[id] = (cart[id] || 0) + 1;
    saveCart();
    renderCart();
    document.body.classList.add("drawerOpen");
  }

  /* =========================
     PRODUCTS RENDER
  ========================= */

  function renderProducts() {
    if (!els.productsGrid) return;

    els.productsGrid.innerHTML = PRODUCTS.map(p => `
      <article class="card">
        <div class="media">
          <img src="${p.media || "assets/logo.png"}" alt="${p.name}" />
        </div>
        <div class="card__body">
          <div class="title">${p.name}</div>
          <div class="meta">${p.category}</div>
          <div class="price">${money(p.price)}</div>
          <button class="btn btn--gold" data-add="${p.id}">Agregar</button>
        </div>
      </article>
    `).join("");
  }

  /* =========================
     THEME SWITCH (FIXED)
  ========================= */

  function initThemeSwitch() {
    const btnWomen = document.getElementById("btnWomen");
    const btnMen = document.getElementById("btnMen");
    const logo = document.getElementById("brandLogo");

    if (!btnWomen || !btnMen || !logo) return;

    const applyTheme = (theme) => {
      const isWomen = theme === "women";
      document.body.classList.toggle("theme-women", isWomen);
      btnWomen.classList.toggle("genderBtn--active", isWomen);
      btnMen.classList.toggle("genderBtn--active", !isWomen);
      logo.src = isWomen ? "assets/logo-women.png" : "assets/logo.png";
      localStorage.setItem("flowurban_theme", theme);
    };

    const saved = localStorage.getItem("flowurban_theme") || "men";
    applyTheme(saved);

    btnWomen.addEventListener("click", () => applyTheme("women"));
    btnMen.addEventListener("click", () => applyTheme("men"));
  }

  /* =========================
     LOADER
  ========================= */

  function fastLoader() {
    if (!els.loader) return;
    setTimeout(() => {
      els.loader.style.display = "none";
    }, 1200);
  }

  /* =========================
     UI
  ========================= */

  function wireUI() {
    renderProducts();
    renderCart();

    els.productsGrid?.addEventListener("click", e => {
      const btn = e.target.closest("[data-add]");
      if (!btn) return;
      addToCart(btn.getAttribute("data-add"));
    });
  }

  /* =========================
     INIT
  ========================= */

  document.addEventListener("DOMContentLoaded", async () => {
    initThemeSwitch();

    try {
      await loadProductsFromCSV();
    } catch (err) {
      console.warn("Usando products.js como fallback");
    }

    wireUI();
    fastLoader();
  });

})();
