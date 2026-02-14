// Flow Urban Storefront (vanilla JS)
// - Catálogo con filtros
// - Carrito con tallas
// - Checkout por WhatsApp

(function () {
  const CONTACTS = {
    sales1: "593987771119",
    sales2: "593962722395",
  };

  // ---- Loader (más rápido, no te deja esperando tanto) ----
  const loaderEl = document.getElementById("loader");
  function hideLoader() {
    if (!loaderEl) return;
    loaderEl.style.opacity = "0";
    loaderEl.style.pointerEvents = "none";
    setTimeout(() => {
      loaderEl.hidden = true;
    }, 180);
  }

  // Oculta apenas el DOM esté listo (y no espera a todas las imágenes)
  window.addEventListener("DOMContentLoaded", () => {
    // un mini delay para que se vea bonito, pero rápido
    setTimeout(hideLoader, 650);

    // si el hero carga antes, lo escondemos antes
    const heroImg = document.querySelector(".hero__bg");
    if (heroImg) {
      if (heroImg.complete) hideLoader();
      heroImg.addEventListener("load", hideLoader, { once: true });
      heroImg.addEventListener("error", hideLoader, { once: true });
    }
  });

  // ---- State ----
  let allProducts = Array.isArray(window.PRODUCTS) ? window.PRODUCTS : [];
  let filteredProducts = [...allProducts];

  /** cart items: { id, name, price, size, qty } */
  let cart = loadCart();

  // ---- Elements ----
  const productGrid = document.getElementById("productGrid");
  const searchInput = document.getElementById("searchInput");
  const categoryFilter = document.getElementById("categoryFilter");
  const sortSelect = document.getElementById("sortSelect");
  const clearFiltersBtn = document.getElementById("clearFilters");
  const productCountEl = document.getElementById("productCount");

  const cartButton = document.getElementById("cartButton");
  const cartCount = document.getElementById("cartCount");
  const cartModal = document.getElementById("cartModal");
  const cartBackdrop = document.getElementById("cartBackdrop");
  const cartClose = document.getElementById("cartClose");
  const cartItemsEl = document.getElementById("cartItems");
  const cartTotalEl = document.getElementById("cartTotal");
  const checkoutBtn = document.getElementById("checkoutBtn");

  const toast = document.getElementById("toast");

  // ---- Helpers ----
  function money(value) {
    try {
      return new Intl.NumberFormat("es-EC", {
        style: "currency",
        currency: "USD",
        minimumFractionDigits: 2,
      }).format(value);
    } catch (_) {
      return `$${Number(value).toFixed(2)}`;
    }
  }

  function normalize(str) {
    return (str || "")
      .toString()
      .trim()
      .toLowerCase()
      .normalize("NFD")
      .replace(/\p{Diacritic}/gu, "");
  }

  function showToast(msg) {
    if (!toast) return;
    toast.textContent = msg;
    toast.hidden = false;
    clearTimeout(showToast._t);
    showToast._t = setTimeout(() => (toast.hidden = true), 1600);
  }

  // ---- Catalog ----
  function initCategoryOptions() {
    if (!categoryFilter) return;
    const cats = Array.from(new Set(allProducts.map((p) => p.category || "Otros"))).sort();
    const existing = new Set(Array.from(categoryFilter.options).map((o) => o.value));
    cats.forEach((c) => {
      const v = normalize(c);
      if (existing.has(v)) return;
      const opt = document.createElement("option");
      opt.value = v;
      opt.textContent = c;
      categoryFilter.appendChild(opt);
    });
  }

  function applyFilters() {
    const q = normalize(searchInput?.value || "");
    const cat = categoryFilter?.value || "all";
    const sort = sortSelect?.value || "featured";

    filteredProducts = allProducts.filter((p) => {
      const hay = normalize([p.name, p.category, p.description, (p.tags || []).join(" ")].join(" "));
      const matchQ = !q || hay.includes(q);
      const matchCat = cat === "all" || normalize(p.category) === cat;
      return matchQ && matchCat;
    });

    // Sorting
    if (sort === "price-asc") filteredProducts.sort((a, b) => (a.price || 0) - (b.price || 0));
    if (sort === "price-desc") filteredProducts.sort((a, b) => (b.price || 0) - (a.price || 0));
    if (sort === "name-asc") filteredProducts.sort((a, b) => (a.name || "").localeCompare(b.name || "", "es"));

    renderProducts();
  }

  function renderProducts() {
    if (!productGrid) return;
    productGrid.innerHTML = "";

    if (productCountEl) productCountEl.textContent = `${filteredProducts.length} productos`;

    filteredProducts.forEach((p) => {
      productGrid.appendChild(renderProductCard(p));
    });
  }

  function renderProductCard(p) {
    const card = document.createElement("article");
    card.className = "card";

    const media = document.createElement("div");
    media.className = "card__media";

    const badgeRow = document.createElement("div");
    badgeRow.className = "card__badgeRow";

    if (p.badges?.includes("Nuevo")) {
      const b = document.createElement("span");
      b.className = "badge badge--gold";
      b.textContent = "Nuevo";
      badgeRow.appendChild(b);
    }
    if (p.badges?.includes("Top")) {
      const b = document.createElement("span");
      b.className = "badge";
      b.textContent = "Top";
      badgeRow.appendChild(b);
    }

    if (badgeRow.childNodes.length) media.appendChild(badgeRow);

    // Video / Imagen o placeholder (cuadro blanco para insertar foto)
    if (p.video) {
      const vid = document.createElement("video");
      vid.className = "card__img";
      vid.src = p.video;
      vid.muted = true;
      vid.loop = true;
      vid.playsInline = true;
      vid.preload = "metadata";
      vid.addEventListener("error", () => {
        vid.remove();
        const ph = document.createElement("div");
        ph.className = "card__ph";
        ph.textContent = "VIDEO";
        media.appendChild(ph);
      });
      // Autoplay suave
      const tryPlay = () => vid.play().catch(() => {});
      setTimeout(tryPlay, 50);

      media.appendChild(vid);
    } else if (p.image) {
      const img = document.createElement("img");
      img.className = "card__img";
      img.alt = p.name || "Producto";
      img.loading = "lazy";
      img.src = p.image;

      img.addEventListener("error", () => {
        img.remove();
        const ph = document.createElement("div");
        ph.className = "card__ph";
        ph.textContent = "FOTO";
        media.appendChild(ph);
      });

      media.appendChild(img);
    } else {
      const ph = document.createElement("div");
      ph.className = "card__ph";
      ph.textContent = "FOTO";
      media.appendChild(ph);
    }

    const body = document.createElement("div");
    body.className = "card__body";

    const name = document.createElement("div");
    name.className = "card__name";
    name.textContent = p.name || "Producto";
    body.appendChild(name);

    const meta = document.createElement("div");
    meta.className = "card__meta";

    const cat = document.createElement("div");
    cat.className = "card__cat";
    cat.textContent = p.category || "—";

    const price = document.createElement("div");
    price.className = "card__price";
    price.textContent = money(p.price || 0);

    meta.appendChild(cat);
    meta.appendChild(price);
    body.appendChild(meta);

    const sizes = document.createElement("div");
    sizes.className = "card__sizes";
    const sizesText = Array.isArray(p.sizes) && p.sizes.length ? p.sizes.join(", ") : "S, M, L, XL";
    sizes.textContent = `Tallas: ${sizesText}`;
    body.appendChild(sizes);

    const actions = document.createElement("div");
    actions.className = "card__actions";

    const viewBtn = document.createElement("button");
    viewBtn.className = "btn btn--dark";
    viewBtn.type = "button";
    viewBtn.textContent = "Ver";
    viewBtn.addEventListener("click", () => openQuickView(p));

    const addBtn = document.createElement("button");
    addBtn.className = "btn btn--gold";
    addBtn.type = "button";
    addBtn.textContent = "Agregar";
    addBtn.addEventListener("click", () => quickAdd(p));

    actions.appendChild(viewBtn);
    actions.appendChild(addBtn);

    card.appendChild(media);
    card.appendChild(body);
    card.appendChild(actions);

    return card;
  }

  // ---- Quick actions ----
  function quickAdd(p) {
    const sizes = Array.isArray(p.sizes) && p.sizes.length ? p.sizes : ["Única"];
    const size = sizes[0];
    addToCart(p, size, 1);
    showToast("Agregado al carrito");
    updateCartUI();
  }

  function openQuickView(p) {
    const sizes = Array.isArray(p.sizes) && p.sizes.length ? p.sizes : ["Única"];
    const choice = prompt(
      `Elige talla para: ${p.name}\n\nTallas: ${sizes.join(", ")}\n\nEscribe la talla exactamente (ej: M)`,
      sizes[0]
    );

    if (!choice) return;
    const normalized = normalize(choice);
    const size = sizes.find((s) => normalize(s) === normalized);
    if (!size) {
      alert("Talla no válida. Intenta otra vez.");
      return;
    }
    addToCart(p, size, 1);
    showToast("Agregado al carrito");
    updateCartUI();
    openCart();
  }

  // ---- Cart ----
  function cartKey(item) {
    return `${item.id}__${item.size}`;
  }

  function loadCart() {
    try {
      const raw = localStorage.getItem("flowurban_cart");
      const parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  function saveCart() {
    try {
      localStorage.setItem("flowurban_cart", JSON.stringify(cart));
    } catch {}
  }

  function addToCart(p, size, qty) {
    const item = {
      id: p.id,
      name: p.name,
      price: Number(p.price || 0),
      size,
      qty: Number(qty || 1),
      image: p.image || "",
    };
    const key = cartKey(item);
    const idx = cart.findIndex((x) => cartKey(x) === key);
    if (idx >= 0) cart[idx].qty += item.qty;
    else cart.push(item);
    saveCart();
  }

  function removeFromCart(id, size) {
    cart = cart.filter((x) => !(x.id === id && x.size === size));
    saveCart();
  }

  function changeQty(id, size, delta) {
    const idx = cart.findIndex((x) => x.id === id && x.size === size);
    if (idx < 0) return;
    cart[idx].qty += delta;
    if (cart[idx].qty <= 0) cart.splice(idx, 1);
    saveCart();
  }

  function cartTotal() {
    return cart.reduce((sum, x) => sum + x.price * x.qty, 0);
  }

  function updateCartUI() {
    if (cartCount) cartCount.textContent = String(cart.reduce((s, x) => s + x.qty, 0));
    if (!cartItemsEl) return;

    cartItemsEl.innerHTML = "";
    if (cart.length === 0) {
      const empty = document.createElement("div");
      empty.style.color = "rgba(255,255,255,.70)";
      empty.style.padding = "10px";
      empty.textContent = "Tu carrito está vacío.";
      cartItemsEl.appendChild(empty);
    } else {
      cart.forEach((x) => cartItemsEl.appendChild(renderCartItem(x)));
    }

    if (cartTotalEl) cartTotalEl.textContent = money(cartTotal());
  }

  function renderCartItem(x) {
    const row = document.createElement("div");
    row.className = "cartItem";

    const img = document.createElement("img");
    img.className = "cartItem__img";
    img.alt = x.name;
    img.loading = "lazy";
    img.src = x.image || "";
    img.addEventListener("error", () => (img.style.display = "none"));

    const mid = document.createElement("div");
    const name = document.createElement("div");
    name.className = "cartItem__name";
    name.textContent = x.name;

    const meta = document.createElement("div");
    meta.className = "cartItem__meta";
    meta.textContent = `Talla: ${x.size} • ${money(x.price)}`;

    mid.appendChild(name);
    mid.appendChild(meta);

    const right = document.createElement("div");
    right.className = "cartItem__qty";

    const qtyRow = document.createElement("div");
    qtyRow.className = "qtyRow";

    const minus = document.createElement("button");
    minus.className = "qtyBtn";
    minus.type = "button";
    minus.textContent = "–";
    minus.addEventListener("click", () => {
      changeQty(x.id, x.size, -1);
      updateCartUI();
    });

    const qty = document.createElement("div");
    qty.style.minWidth = "22px";
    qty.style.textAlign = "center";
    qty.textContent = String(x.qty);

    const plus = document.createElement("button");
    plus.className = "qtyBtn";
    plus.type = "button";
    plus.textContent = "+";
    plus.addEventListener("click", () => {
      changeQty(x.id, x.size, +1);
      updateCartUI();
    });

    qtyRow.appendChild(minus);
    qtyRow.appendChild(qty);
    qtyRow.appendChild(plus);

    const remove = document.createElement("button");
    remove.className = "removeBtn";
    remove.type = "button";
    remove.textContent = "Quitar";
    remove.addEventListener("click", () => {
      removeFromCart(x.id, x.size);
      updateCartUI();
    });

    right.appendChild(qtyRow);
    right.appendChild(remove);

    row.appendChild(img);
    row.appendChild(mid);
    row.appendChild(right);

    return row;
  }

  function openCart() {
    if (!cartModal || !cartBackdrop) return;
    cartModal.hidden = false;
    cartBackdrop.hidden = false;
    document.body.style.overflow = "hidden";
  }

  function closeCart() {
    if (!cartModal || !cartBackdrop) return;
    cartModal.hidden = true;
    cartBackdrop.hidden = true;
    document.body.style.overflow = "";
  }

  function checkoutWhatsApp() {
    if (cart.length === 0) {
      showToast("Carrito vacío");
      return;
    }

    const lines = cart.map((x) => `• ${x.name} | Talla: ${x.size} | Cant: ${x.qty} | ${money(x.price * x.qty)}`);
    const total = money(cartTotal());

    const msg =
      `Hola Flow Urban 👋\n\nQuiero hacer este pedido:\n` +
      lines.join("\n") +
      `\n\nTotal: ${total}\n\nMi nombre es: `;

    const url = `https://wa.me/${CONTACTS.sales1}?text=${encodeURIComponent(msg)}`;
    window.open(url, "_blank");
  }

  // ---- Events ----
  searchInput?.addEventListener("input", applyFilters);
  categoryFilter?.addEventListener("change", applyFilters);
  sortSelect?.addEventListener("change", applyFilters);
  clearFiltersBtn?.addEventListener("click", () => {
    if (searchInput) searchInput.value = "";
    if (categoryFilter) categoryFilter.value = "all";
    if (sortSelect) sortSelect.value = "featured";
    applyFilters();
  });

  document.getElementById("viewCatalogBtn")?.addEventListener("click", () => {
    document.getElementById("catalogo")?.scrollIntoView({ behavior: "smooth", block: "start" });
  });

  cartButton?.addEventListener("click", () => {
    updateCartUI();
    openCart();
  });
  cartClose?.addEventListener("click", closeCart);
  cartBackdrop?.addEventListener("click", closeCart);
  checkoutBtn?.addEventListener("click", checkoutWhatsApp);

  // ---- Init ----
  initCategoryOptions();
  applyFilters();
  updateCartUI();
})();
