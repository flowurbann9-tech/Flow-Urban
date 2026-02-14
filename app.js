import { STORE, PRODUCTS } from "./products.js";

const $ = (q) => document.querySelector(q);

const els = {
  promoWhatsApp: $("#promoWhatsApp"),
  headerWhatsApp: $("#headerWhatsApp"),
  floatingWhatsApp: $("#floatingWhatsApp"),

  wa1Btn: $("#wa1Btn"),
  wa2Btn: $("#wa2Btn"),
  waNumbers: $("#waNumbers"),
  igBtn: $("#igBtn"),
  ttBtn: $("#ttBtn"),

  searchInput: $("#searchInput"),
  categorySelect: $("#categorySelect"),
  sortSelect: $("#sortSelect"),
  clearBtn: $("#clearBtn"),
  grid: $("#grid"),
  countText: $("#countText"),

  cartBtn: $("#cartBtn"),
  cartCount: $("#cartCount"),
  cartOverlay: $("#cartOverlay"),
  cartDrawer: $("#cartDrawer"),
  closeCart: $("#closeCart"),
  cartItems: $("#cartItems"),
  cartTotal: $("#cartTotal"),
  checkoutBtn: $("#checkoutBtn"),

  loaderOverlay: $("#loaderOverlay"),
  loaderBarFill: $("#loaderBarFill"),
};

let cart = []; // {id, size, qty}

function money(n) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: STORE.currency }).format(n);
}

function waLink(phone, text = "") {
  const msg = encodeURIComponent(text);
  return `https://wa.me/${phone}?text=${msg}`;
}

function buildWhatsAppLinks() {
  const main = STORE.whatsappSales1;

  const promo = waLink(main, "Hola! Vengo desde Flow Urban 🙌");
  els.promoWhatsApp.href = promo;
  els.headerWhatsApp.href = promo;
  els.floatingWhatsApp.href = promo;

  els.wa1Btn.href = waLink(STORE.whatsappSales1, "Hola! Quiero hacer un pedido 🙌");
  els.wa2Btn.href = waLink(STORE.whatsappSales2, "Hola! Quiero hacer un pedido 🙌");

  els.waNumbers.textContent = `Ventas 1: ${STORE.whatsappSales1} | Ventas 2: ${STORE.whatsappSales2}`;

  els.igBtn.href = STORE.instagram;
  els.ttBtn.href = STORE.tiktok;
}

function categories() {
  const set = new Set(PRODUCTS.map((p) => p.category));
  return ["Todas", ...Array.from(set)];
}

function fillCategories() {
  els.categorySelect.innerHTML = "";
  for (const c of categories()) {
    const opt = document.createElement("option");
    opt.value = c;
    opt.textContent = c;
    els.categorySelect.appendChild(opt);
  }
}

function getFilters() {
  return {
    q: els.searchInput.value.trim().toLowerCase(),
    cat: els.categorySelect.value,
    sort: els.sortSelect.value,
  };
}

function applyFilters(list) {
  const { q, cat, sort } = getFilters();

  let out = [...list];

  if (cat && cat !== "Todas") out = out.filter((p) => p.category === cat);

  if (q) {
    out = out.filter((p) => {
      const hay = `${p.name} ${p.category} ${p.desc ?? ""}`.toLowerCase();
      return hay.includes(q);
    });
  }

  if (sort === "priceAsc") out.sort((a, b) => a.price - b.price);
  if (sort === "priceDesc") out.sort((a, b) => b.price - a.price);
  if (sort === "nameAsc") out.sort((a, b) => a.name.localeCompare(b.name));
  // "featured" deja el orden del array
  return out;
}

function mediaHTML(p) {
  // Si no hay media, ponemos placeholder para que “se vea el cuadro” (como tú quieres)
  if (!p.media) {
    return `<div class="placeholder">SUBIR FOTO / VIDEO</div>`;
  }

  if (p.mediaType === "video") {
    return `<video src="${p.media}" controls playsinline preload="metadata"></video>`;
  }

  // image default
  return `<img src="${p.media}" alt="${p.name}" onerror="this.closest('.media').innerHTML='<div class=&quot;placeholder&quot;>SUBIR FOTO / VIDEO</div>'" />`;
}

function cardHTML(p) {
  const badge = p.badge ? `<div class="badge">${p.badge}</div>` : "";
  const sizes = (p.sizes || []).map((s) => `<span class="size-pill">${s}</span>`).join("");

  return `
    <article class="card">
      <div class="media">
        ${badge}
        ${mediaHTML(p)}
      </div>

      <div class="card-body">
        <h3 class="name">${p.name}</h3>
        <p class="meta">${p.category}</p>

        <div class="price-row">
          <div class="cat">${p.category}</div>
          <div class="price">${money(p.price)}</div>
        </div>

        <div class="sizes">${sizes}</div>

        <div class="card-actions">
          <button class="btn-mini view" data-action="view" data-id="${p.id}">Ver</button>
          <button class="btn-mini add" data-action="add" data-id="${p.id}">Agregar</button>
        </div>
      </div>
    </article>
  `;
}

function renderGrid() {
  const filtered = applyFilters(PRODUCTS);
  els.countText.textContent = `${filtered.length} productos`;
  els.grid.innerHTML = filtered.map(cardHTML).join("");
}

function findProduct(id) {
  return PRODUCTS.find((p) => p.id === id);
}

function addToCart(id, size = null) {
  const p = findProduct(id);
  if (!p) return;

  const chosen = size || (p.sizes && p.sizes[0]) || "U";
  const existing = cart.find((i) => i.id === id && i.size === chosen);

  if (existing) existing.qty += 1;
  else cart.push({ id, size: chosen, qty: 1 });

  saveCart();
  renderCart();
  openCart();
}

function cartCount() {
  return cart.reduce((sum, i) => sum + i.qty, 0);
}

function cartTotal() {
  return cart.reduce((sum, i) => {
    const p = findProduct(i.id);
    return sum + (p ? p.price * i.qty : 0);
  }, 0);
}

function renderCart() {
  els.cartCount.textContent = String(cartCount());
  els.cartTotal.textContent = money(cartTotal());

  if (!cart.length) {
    els.cartItems.innerHTML = `<div style="padding:10px 0;color:rgba(255,255,255,.75)">Tu carrito está vacío.</div>`;
    return;
  }

  els.cartItems.innerHTML = cart.map((i) => {
    const p = findProduct(i.id);
    const line = p ? p.name : i.id;
    const price = p ? money(p.price) : "";
    return `
      <div class="cart-item">
        <div class="row">
          <div>
            <div class="nm">${line}</div>
            <div class="sm">Talla: ${i.size} • ${price}</div>
          </div>
          <div><strong>${p ? money(p.price * i.qty) : ""}</strong></div>
        </div>

        <div class="qty-row">
          <button class="qty-btn" data-action="dec" data-id="${i.id}" data-size="${i.size}">-</button>
          <div class="qty">${i.qty}</div>
          <button class="qty-btn" data-action="inc" data-id="${i.id}" data-size="${i.size}">+</button>
          <button class="remove" data-action="rm" data-id="${i.id}" data-size="${i.size}">Eliminar</button>
        </div>
      </div>
    `;
  }).join("");
}

function openCart() {
  els.cartOverlay.classList.add("show");
  els.cartDrawer.classList.add("show");
  els.cartOverlay.setAttribute("aria-hidden", "false");
  els.cartDrawer.setAttribute("aria-hidden", "false");
}

function closeCart() {
  els.cartOverlay.classList.remove("show");
  els.cartDrawer.classList.remove("show");
  els.cartOverlay.setAttribute("aria-hidden", "true");
  els.cartDrawer.setAttribute("aria-hidden", "true");
}

function saveCart() {
  localStorage.setItem("flowurban_cart", JSON.stringify(cart));
}

function loadCart() {
  try {
    const raw = localStorage.getItem("flowurban_cart");
    cart = raw ? JSON.parse(raw) : [];
  } catch {
    cart = [];
  }
}

function checkoutWhatsApp() {
  if (!cart.length) return;

  const lines = cart.map((i) => {
    const p = findProduct(i.id);
    const name = p ? p.name : i.id;
    const price = p ? p.price : 0;
    return `• ${name} (Talla: ${i.size}) x${i.qty} = ${money(price * i.qty)}`;
  });

  const total = money(cartTotal());
  const msg =
    `Hola! Quiero este pedido 🙌\n\n` +
    lines.join("\n") +
    `\n\nTOTAL: ${total}\n\n¿Stock disponible?`;

  window.open(waLink(STORE.whatsappSales1, msg), "_blank");
}

function bindEvents() {
  els.searchInput.addEventListener("input", renderGrid);
  els.categorySelect.addEventListener("change", renderGrid);
  els.sortSelect.addEventListener("change", renderGrid);

  els.clearBtn.addEventListener("click", () => {
    els.searchInput.value = "";
    els.categorySelect.value = "Todas";
    els.sortSelect.value = "featured";
    renderGrid();
  });

  els.grid.addEventListener("click", (e) => {
    const btn = e.target.closest("button[data-action]");
    if (!btn) return;
    const id = btn.dataset.id;
    const act = btn.dataset.action;

    if (act === "add") addToCart(id);
    if (act === "view") {
      const p = findProduct(id);
      if (!p) return;
      alert(`${p.name}\n\n${p.desc}\n\nPrecio: ${money(p.price)}\nTallas: ${(p.sizes || []).join(", ")}`);
    }
  });

  els.cartBtn.addEventListener("click", openCart);
  els.closeCart.addEventListener("click", closeCart);
  els.cartOverlay.addEventListener("click", closeCart);

  els.cartItems.addEventListener("click", (e) => {
    const b = e.target.closest("[data-action]");
    if (!b) return;

    const { action, id, size } = b.dataset;
    const item = cart.find((x) => x.id === id && x.size === size);
    if (!item) return;

    if (action === "inc") item.qty += 1;
    if (action === "dec") item.qty = Math.max(1, item.qty - 1);
    if (action === "rm") cart = cart.filter((x) => !(x.id === id && x.size === size));

    saveCart();
    renderCart();
  });

  els.checkoutBtn.addEventListener("click", checkoutWhatsApp);
}

function startLoader() {
  // animación simple de barra, luego se oculta
  let p = 0;
  const timer = setInterval(() => {
    p = Math.min(100, p + 6);
    els.loaderBarFill.style.width = `${p}%`;
    if (p >= 100) {
      clearInterval(timer);
      els.loaderOverlay.style.display = "none";
      els.loaderOverlay.setAttribute("aria-hidden", "true");
    }
  }, 120);
}

function init() {
  buildWhatsAppLinks();
  fillCategories();
  loadCart();

  renderGrid();
  renderCart();
  bindEvents();

  // loader al final, cuando ya está pintado
  requestAnimationFrame(() => startLoader());
}

init();
