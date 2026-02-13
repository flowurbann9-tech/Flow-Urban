import { STORE, PRODUCTS } from "./products.js";

/* Helpers */
const money = (n) => {
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: STORE.currency || "USD",
    }).format(n);
  } catch {
    return `$${Number(n || 0).toFixed(2)}`;
  }
};

const waLink = (phone, text) => {
  const msg = encodeURIComponent(text);
  return `https://wa.me/${phone}?text=${msg}`;
};

const els = {
  loader: document.getElementById("loader"),

  // top
  topWhatsappLink: document.getElementById("topWhatsappLink"),
  openCartBtn: document.getElementById("openCartBtn"),
  closeCartBtn: document.getElementById("closeCartBtn"),
  cartCount: document.getElementById("cartCount"),

  // filters
  searchInput: document.getElementById("searchInput"),
  categorySelect: document.getElementById("categorySelect"),
  sortSelect: document.getElementById("sortSelect"),
  clearBtn: document.getElementById("clearBtn"),

  // products
  productsGrid: document.getElementById("productsGrid"),
  productCount: document.getElementById("productCount"),

  // cart
  cartDrawer: document.getElementById("cartDrawer"),
  cartItems: document.getElementById("cartItems"),
  subtotal: document.getElementById("subtotal"),
  shipping: document.getElementById("shipping"),
  total: document.getElementById("total"),
  checkoutBtn: document.getElementById("checkoutBtn"),

  // contact
  waNumbers: document.getElementById("waNumbers"),
  waLink1: document.getElementById("waLink1"),
  waLink2: document.getElementById("waLink2"),
};

let cart = JSON.parse(localStorage.getItem("fu_cart") || "[]");

const saveCart = () => localStorage.setItem("fu_cart", JSON.stringify(cart));

const getCategories = () => {
  const set = new Set(PRODUCTS.map((p) => p.category));
  return ["Todas", ...Array.from(set).sort()];
};

const filteredProducts = () => {
  const q = (els.searchInput.value || "").trim().toLowerCase();
  const cat = els.categorySelect.value || "Todas";
  const sort = els.sortSelect.value || "featured";

  let list = PRODUCTS.slice();

  if (cat !== "Todas") {
    list = list.filter((p) => p.category === cat);
  }

  if (q) {
    list = list.filter((p) => {
      return (
        p.name.toLowerCase().includes(q) ||
        (p.desc || "").toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q)
      );
    });
  }

  // sorting
  if (sort === "price_asc") list.sort((a, b) => a.price - b.price);
  if (sort === "price_desc") list.sort((a, b) => b.price - a.price);
  if (sort === "name_asc") list.sort((a, b) => a.name.localeCompare(b.name));

  return list;
};

const renderCategories = () => {
  const cats = getCategories();
  els.categorySelect.innerHTML = cats.map((c) => `<option value="${c}">${c}</option>`).join("");
};

const addToCart = (productId, size) => {
  const p = PRODUCTS.find((x) => x.id === productId);
  if (!p) return;

  const key = `${productId}__${size || ""}`;
  const existing = cart.find((i) => i.key === key);

  if (existing) existing.qty += 1;
  else cart.push({ key, id: productId, size: size || "", qty: 1 });

  saveCart();
  renderCart();
};

const cartTotals = () => {
  let subtotal = 0;
  for (const item of cart) {
    const p = PRODUCTS.find((x) => x.id === item.id);
    if (p) subtotal += p.price * item.qty;
  }
  const shipping = Number(STORE.shippingFlat || 0);
  const total = subtotal + shipping;
  return { subtotal, shipping, total };
};

const renderCart = () => {
  const count = cart.reduce((acc, i) => acc + i.qty, 0);
  els.cartCount.textContent = String(count);

  if (!els.cartItems) return;

  if (cart.length === 0) {
    els.cartItems.innerHTML = `<div style="opacity:.7;padding:10px 0;">Tu carrito está vacío.</div>`;
  } else {
    els.cartItems.innerHTML = cart
      .map((item) => {
        const p = PRODUCTS.find((x) => x.id === item.id);
        if (!p) return "";
        const img = p.image ? `<img src="${p.image}" alt="${p.name}" onerror="this.remove();">` : "";
        return `
          <div class="cart-item">
            <div class="cart-thumb">${img}</div>
            <div>
              <p class="cart-name">${p.name}</p>
              <div class="cart-sub">${item.size ? `Talla: ${item.size}` : ""}</div>
              <div class="cart-sub">${money(p.price)}</div>
            </div>
            <div class="qty">
              <button data-action="dec" data-key="${item.key}">-</button>
              <strong>${item.qty}</strong>
              <button data-action="inc" data-key="${item.key}">+</button>
            </div>
          </div>
        `;
      })
      .join("");
  }

  const t = cartTotals();
  els.subtotal.textContent = money(t.subtotal);
  els.shipping.textContent = money(t.shipping);
  els.total.textContent = money(t.total);
};

const renderProducts = () => {
  const list = filteredProducts();
  els.productCount.textContent = `${list.length} productos`;

  els.productsGrid.innerHTML = list
    .map((p) => {
      const badge = p.badge ? `<span class="badge">${p.badge}</span>` : "";
      const sizes = (p.sizes || []).join(", ");

      const media = p.image
        ? `<img src="${p.image}" alt="${p.name}" onerror="this.closest('.card-media').innerHTML='<div class=placeholder>SUBE FOTO</div>';">`
        : `<div class="placeholder">SUBE FOTO</div>`;

      const sizeButtons = (p.sizes || [])
        .map(
          (s) => `<button class="btn dark" type="button" data-add="${p.id}" data-size="${s}">Agregar (${s})</button>`
        )
        .join("");

      return `
        <article class="card">
          <div class="card-media">${media}</div>
          <div class="card-body">
            <div class="card-top">
              <h3 class="card-title">${p.name}</h3>
              <div class="price">${money(p.price)}</div>
            </div>
            <div class="meta">${p.category} ${badge ? "• " + badge : ""}</div>
            <div class="sizes">Tallas: ${sizes}</div>
            <div class="card-actions" style="flex-wrap:wrap;">
              ${sizeButtons}
            </div>
          </div>
        </article>
      `;
    })
    .join("");

  // click handlers (agregar)
  els.productsGrid.querySelectorAll("[data-add]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = btn.getAttribute("data-add");
      const size = btn.getAttribute("data-size") || "";
      addToCart(id, size);
      openCart();
    });
  });
};

const openCart = () => {
  els.cartDrawer.classList.add("open");
  els.cartDrawer.setAttribute("aria-hidden", "false");
};
const closeCart = () => {
  els.cartDrawer.classList.remove("open");
  els.cartDrawer.setAttribute("aria-hidden", "true");
};

const setupWhatsApp = () => {
  const phone1 = STORE.whatsappSales1;
  const phone2 = STORE.whatsappSales2;

  els.waNumbers.textContent = `Ventas 1: ${phone1} | Ventas 2: ${phone2}`;

  els.waLink1.href = waLink(phone1, "Hola! Quiero hacer un pedido en Flow Urban.");
  els.waLink2.href = waLink(phone2, "Hola! Quiero hacer un pedido en Flow Urban.");

  // TOP WhatsApp (usa Ventas 1)
  els.topWhatsappLink.href = waLink(phone1, "Hola! Estoy viendo Flow Urban. ¿Me ayudas con un pedido?");
};

const checkoutWhatsApp = () => {
  if (cart.length === 0) {
    alert("Tu carrito está vacío.");
    return;
  }

  const lines = cart.map((item) => {
    const p = PRODUCTS.find((x) => x.id === item.id);
    if (!p) return "";
    return `• ${p.name} ${item.size ? `(Talla: ${item.size})` : ""} x${item.qty} — ${money(p.price * item.qty)}`;
  });

  const t = cartTotals();
  const msg =
    `Hola! Quiero pedir:\n\n` +
    `${lines.join("\n")}\n\n` +
    `Subtotal: ${money(t.subtotal)}\n` +
    `Envío: ${money(t.shipping)}\n` +
    `Total: ${money(t.total)}\n\n` +
    `¿Hay stock y cómo coordinamos envío/pago?`;

  const url = waLink(STORE.whatsappSales1, msg);
  window.open(url, "_blank", "noopener");
};

const bindEvents = () => {
  els.openCartBtn.addEventListener("click", openCart);
  els.closeCartBtn.addEventListener("click", closeCart);

  els.cartDrawer.addEventListener("click", (e) => {
    if (e.target === els.cartDrawer) closeCart();
  });

  els.cartItems.addEventListener("click", (e) => {
    const btn = e.target.closest("button[data-action]");
    if (!btn) return;

    const action = btn.getAttribute("data-action");
    const key = btn.getAttribute("data-key");

    const item = cart.find((x) => x.key === key);
    if (!item) return;

    if (action === "inc") item.qty += 1;
    if (action === "dec") item.qty -= 1;

    cart = cart.filter((x) => x.qty > 0);
    saveCart();
    renderCart();
  });

  els.checkoutBtn.addEventListener("click", checkoutWhatsApp);

  ["input", "change"].forEach((evt) => {
    els.searchInput.addEventListener(evt, renderProducts);
    els.categorySelect.addEventListener(evt, renderProducts);
    els.sortSelect.addEventListener(evt, renderProducts);
  });

  els.clearBtn.addEventListener("click", () => {
    els.searchInput.value = "";
    els.categorySelect.value = "Todas";
    els.sortSelect.value = "featured";
    renderProducts();
  });
};

const hideLoader = () => {
  // pequeño delay para que se vea bonito
  setTimeout(() => {
    els.loader.classList.add("hidden");
  }, 650);
};

const init = () => {
  renderCategories();
  setupWhatsApp();
  bindEvents();
  renderProducts();
  renderCart();
  hideLoader();
};

init();
