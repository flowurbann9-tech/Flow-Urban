import { STORE, PRODUCTS as FALLBACK_PRODUCTS } from "./products.js";

(() => {
  const WA_NUMBER = STORE?.whatsappNumber || "593962722395";
  const WA_TEXT_DEFAULT =
    "Hola Flow Urban 👋🔥 Quiero hacer un pedido 🛍️ ¿Me ayudas, por favor?";

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

  const waLink = (text = WA_TEXT_DEFAULT) =>
    `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(text)}`;

  const money = (n) => {
    try {
      return new Intl.NumberFormat("es-EC", { style: "currency", currency: "USD" }).format(n);
    } catch {
      return `$${Number(n || 0).toFixed(2)}`.replace(".", ",");
    }
  };

  const isVideo = (url) => /\.(mp4|webm|ogg)$/i.test(url || "");

  // =========================
  // ✅ PRODUCTS (se cargan desde CSV)
  // =========================
  let PRODUCTS = Array.isArray(FALLBACK_PRODUCTS) ? [...FALLBACK_PRODUCTS] : [];

  // CSV parser (soporta comillas y comas dentro)
  function parseCSV(text) {
    const rows = [];
    let row = [];
    let cell = "";
    let inQuotes = false;

    for (let i = 0; i < text.length; i++) {
      const ch = text[i];
      const next = text[i + 1];

      if (ch === '"') {
        if (inQuotes && next === '"') {
          cell += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
        continue;
      }
      if (ch === "," && !inQuotes) {
        row.push(cell.trim());
        cell = "";
        continue;
      }
      if ((ch === "\n" || ch === "\r") && !inQuotes) {
        if (ch === "\r" && next === "\n") i++;
        row.push(cell.trim());
        cell = "";
        if (row.some((x) => x !== "")) rows.push(row);
        row = [];
        continue;
      }
      cell += ch;
    }

    row.push(cell.trim());
    if (row.some((x) => x !== "")) rows.push(row);
    return rows;
  }

  // ✅ acepta media como:
  // - "url1|url2|url3"
  // - "url1,url2,url3"
  // - o una sola "url"
  function normalizeMedia(mediaVal) {
    if (Array.isArray(mediaVal)) return mediaVal.filter(Boolean);

    const s = String(mediaVal || "").trim();
    if (!s) return "";

    if (s.includes("|")) {
      return s
        .split("|")
        .map((x) => x.trim())
        .filter(Boolean);
    }

    // si viene con comas y parece lista
    if (s.includes(",") && !/^https?:\/\//i.test(s)) {
      return s
        .split(",")
        .map((x) => x.trim())
        .filter(Boolean);
    }

    return s; // una sola
  }

  function normalizeProduct(p) {
    const price = Number(String(p.price || "0").replace(",", "."));
    const featuredRaw = String(p.featured || "").trim().toLowerCase();
    const featured =
      featuredRaw === "yes" ||
      featuredRaw === "si" ||
      featuredRaw === "true" ||
      featuredRaw === "1";

    const sizesStr = String(p.sizes || "").trim();
    const sizes = sizesStr.includes("|")
      ? sizesStr.split("|").map((s) => s.trim()).filter(Boolean)
      : sizesStr.split(",").map((s) => s.trim()).filter(Boolean);

    return {
      id: String(p.id || "").trim(),
      name: String(p.name || "").trim(),
      category: String(p.category || "").trim(),
      price: Number.isFinite(price) ? price : 0,
      sizes,
      tag: String(p.tag || "").trim(),
      media: normalizeMedia(p.media),
      featured,
    };
  }

  async function loadProductsFromCSV() {
    const url = `data/productos.csv?v=${Date.now()}`;
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) throw new Error("No se pudo cargar productos.csv");

    const text = await res.text();
    const rows = parseCSV(text);
    if (!rows.length) throw new Error("CSV vacío");

    const headers = rows[0].map((h) => h.trim().toLowerCase());
    const idx = (name) => headers.indexOf(name);

    const needed = ["id", "name", "category", "price", "sizes", "tag", "media", "featured"];
    const ok = needed.every((k) => idx(k) !== -1);
    if (!ok) throw new Error("CSV no tiene columnas correctas");

    const out = [];
    for (let i = 1; i < rows.length; i++) {
      const r = rows[i];
      const obj = {
        id: r[idx("id")] || "",
        name: r[idx("name")] || "",
        category: r[idx("category")] || "",
        price: r[idx("price")] || "",
        sizes: r[idx("sizes")] || "",
        tag: r[idx("tag")] || "",
        media: r[idx("media")] || "",
        featured: r[idx("featured")] || "",
      };
      const normalized = normalizeProduct(obj);
      if (normalized.id && normalized.name) out.push(normalized);
    }

    if (!out.length) throw new Error("No hay productos válidos en el CSV");
    return out;
  }

  // =========================
  // ✅ GALLERY MODAL (Swipe)
  // =========================
  let modalState = {
    open: false,
    productId: null,
    images: [],
    index: 0,
    touchX: 0,
    touchY: 0,
    touching: false,
  };

  function ensureGalleryModal() {
    if (document.getElementById("galleryModal")) return;

    const modal = document.createElement("div");
    modal.id = "galleryModal";
    modal.setAttribute("aria-hidden", "true");
    modal.style.cssText = `
      position:fixed; inset:0; z-index:2000;
      display:none;
    `;

    modal.innerHTML = `
      <div id="galleryBackdrop" style="position:absolute;inset:0;background:rgba(0,0,0,.65);backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px);"></div>

      <div id="galleryCard" style="
        position:absolute; left:50%; top:50%;
        transform:translate(-50%,-50%);
        width:min(920px, 94vw);
        background:rgba(16,16,22,.96);
        border:1px solid rgba(255,255,255,.14);
        border-radius:22px;
        box-shadow:0 24px 80px rgba(0,0,0,.55);
        overflow:hidden;
      ">
        <div style="display:flex;align-items:center;justify-content:space-between;padding:12px 14px;border-bottom:1px solid rgba(255,255,255,.10);">
          <div>
            <div id="galleryTitle" style="font-weight:1000;color:#fff;font-size:16px;line-height:1.1;"></div>
            <div id="gallerySub" style="color:rgba(255,255,255,.72);font-weight:800;font-size:12px;margin-top:2px;"></div>
          </div>
          <button id="galleryClose" type="button" style="
            background:rgba(255,255,255,.10);
            border:1px solid rgba(255,255,255,.16);
            color:#fff;
            border-radius:12px;
            padding:10px 12px;
            cursor:pointer;
          ">✕</button>
        </div>

        <div id="galleryStage" style="
          position:relative;
          background:#0b0b0f;
          height:min(72vh, 640px);
          display:flex;
          align-items:center;
          justify-content:center;
          touch-action: pan-y;
          user-select:none;
        ">
          <button id="galleryPrev" type="button" style="
            position:absolute;left:12px;top:50%;transform:translateY(-50%);
            width:44px;height:44px;border-radius:14px;
            border:1px solid rgba(255,255,255,.18);
            background:rgba(0,0,0,.40);
            color:#fff;cursor:pointer;font-weight:1000;
          ">‹</button>

          <img id="galleryImg" alt="" style="
            width:100%;
            height:100%;
            object-fit:contain;
            display:block;
          "/>

          <button id="galleryNext" type="button" style="
            position:absolute;right:12px;top:50%;transform:translateY(-50%);
            width:44px;height:44px;border-radius:14px;
            border:1px solid rgba(255,255,255,.18);
            background:rgba(0,0,0,.40);
            color:#fff;cursor:pointer;font-weight:1000;
          ">›</button>

          <div id="galleryDots" style="
            position:absolute;left:0;right:0;bottom:12px;
            display:flex;gap:6px;justify-content:center;align-items:center;
          "></div>
        </div>

        <div style="padding:14px;display:flex;gap:10px;align-items:center;justify-content:space-between;border-top:1px solid rgba(255,255,255,.10);">
          <div style="color:rgba(255,255,255,.78);font-weight:900;font-size:13px;">
            Desliza ← → para cambiar foto
          </div>
          <button id="galleryAdd" type="button" class="btn btn--gold" style="border-radius:999px;padding:12px 16px;font-weight:1000;cursor:pointer;">
            Agregar al carrito
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    // events
    const close = () => closeGallery();
    modal.querySelector("#galleryBackdrop").addEventListener("click", close);
    modal.querySelector("#galleryClose").addEventListener("click", close);

    modal.querySelector("#galleryPrev").addEventListener("click", () => stepGallery(-1));
    modal.querySelector("#galleryNext").addEventListener("click", () => stepGallery(1));

    modal.querySelector("#galleryAdd").addEventListener("click", () => {
      if (modalState.productId) {
        addToCart(modalState.productId);
        openDrawer();
      }
    });

    // swipe
    const stage = modal.querySelector("#galleryStage");
    stage.addEventListener("touchstart", (e) => {
      if (!e.touches?.length) return;
      modalState.touching = true;
      modalState.touchX = e.touches[0].clientX;
      modalState.touchY = e.touches[0].clientY;
    }, { passive: true });

    stage.addEventListener("touchend", (e) => {
      if (!modalState.touching) return;
      modalState.touching = false;

      const t = e.changedTouches?.[0];
      if (!t) return;

      const dx = t.clientX - modalState.touchX;
      const dy = t.clientY - modalState.touchY;

      // si es más horizontal que vertical
      if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 45) {
        if (dx < 0) stepGallery(1);
        else stepGallery(-1);
      }
    }, { passive: true });

    // teclado
    document.addEventListener("keydown", (e) => {
      if (!modalState.open) return;
      if (e.key === "Escape") closeGallery();
      if (e.key === "ArrowLeft") stepGallery(-1);
      if (e.key === "ArrowRight") stepGallery(1);
    });
  }

  function getProductImages(p) {
    if (!p) return [];
    const m = p.media;

    if (Array.isArray(m)) {
      const arr = m.map((x) => String(x || "").trim()).filter(Boolean);
      return arr.length ? arr : ["assets/logo.png"];
    }

    const s = String(m || "").trim();
    if (!s) return ["assets/logo.png"];

    // si viene "a|b|c"
    if (s.includes("|")) {
      const arr = s.split("|").map((x) => x.trim()).filter(Boolean);
      return arr.length ? arr : ["assets/logo.png"];
    }

    return [s];
  }

  function openGallery(productId) {
    const p = PRODUCTS.find((x) => x.id === productId);
    if (!p) return;

    ensureGalleryModal();

    const modal = document.getElementById("galleryModal");
    const imgEl = modal.querySelector("#galleryImg");
    const titleEl = modal.querySelector("#galleryTitle");
    const subEl = modal.querySelector("#gallerySub");

    modalState.open = true;
    modalState.productId = productId;
    modalState.images = getProductImages(p);
    modalState.index = 0;

    titleEl.textContent = p.name;
    subEl.textContent = `${p.category} • ${money(p.price || 0)}`;

    renderGallery();
    modal.style.display = "block";
    modal.setAttribute("aria-hidden", "false");

    // focus safe
    imgEl?.focus?.();
  }

  function closeGallery() {
    const modal = document.getElementById("galleryModal");
    if (!modal) return;
    modalState.open = false;
    modalState.productId = null;
    modalState.images = [];
    modalState.index = 0;
    modal.style.display = "none";
    modal.setAttribute("aria-hidden", "true");
  }

  function stepGallery(dir) {
    if (!modalState.open) return;
    const n = modalState.images.length || 0;
    if (n <= 1) return;
    modalState.index = (modalState.index + dir + n) % n;
    renderGallery();
  }

  function renderGallery() {
    const modal = document.getElementById("galleryModal");
    if (!modal) return;

    const imgEl = modal.querySelector("#galleryImg");
    const dots = modal.querySelector("#galleryDots");
    const prev = modal.querySelector("#galleryPrev");
    const next = modal.querySelector("#galleryNext");

    const imgs = modalState.images || [];
    const idx = modalState.index || 0;

    const src = imgs[idx] || "assets/logo.png";
    imgEl.src = src;
    imgEl.onerror = () => {
      imgEl.onerror = null;
      imgEl.src = "assets/logo.png";
      imgEl.style.objectFit = "contain";
    };

    const many = imgs.length > 1;
    prev.style.display = many ? "block" : "none";
    next.style.display = many ? "block" : "none";

    dots.innerHTML = imgs
      .map((_, i) => {
        const active = i === idx;
        return `<span style="
          width:${active ? 18 : 8}px;
          height:8px;
          border-radius:999px;
          background:${active ? "rgba(255,255,255,.92)" : "rgba(255,255,255,.32)"};
          transition:all .18s ease;
          display:inline-block;
        "></span>`;
      })
      .join("");
  }

  // =========================
  // CART (localStorage)
  // =========================
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

  const cartCount = () => Object.values(cart).reduce((a, b) => a + b, 0);

  const cartTotal = () => {
    let total = 0;
    for (const [id, qty] of Object.entries(cart)) {
      const p = PRODUCTS.find((x) => x.id === id);
      if (!p) continue;
      total += (p.price || 0) * qty;
    }
    return total;
  };

  // =========================
  // DRAWER
  // =========================
  function openDrawer() {
    document.body.classList.add("drawerOpen");
    els.cartDrawer?.setAttribute("aria-hidden", "false");
    els.backdrop?.setAttribute("aria-hidden", "false");
  }
  function closeDrawer() {
    document.body.classList.remove("drawerOpen");
    els.cartDrawer?.setAttribute("aria-hidden", "true");
    els.backdrop?.setAttribute("aria-hidden", "true");
  }

  // =========================
  // WHATSAPP LINKS
  // =========================
  function setWaLinks() {
    if (els.topWa) els.topWa.href = waLink();
    if (els.waHeader) els.waHeader.href = waLink();
    if (els.waContact) els.waContact.href = waLink();
    if (els.floatWa) els.floatWa.href = waLink();

    if (els.igBtn) els.igBtn.href = "#";
    if (els.ttBtn) els.ttBtn.href = "#";

    if (els.waOrderBtn) els.waOrderBtn.href = waLink("Hola! Quiero hacer un pedido.");
  }

  // =========================
  // FILTERS
  // =========================
  function buildCategorySelect() {
    const cats = ["Todas", ...Array.from(new Set(PRODUCTS.map((p) => p.category))).sort()];
    if (!els.categorySelect) return;
    els.categorySelect.innerHTML = cats.map((c) => `<option value="${c}">${c}</option>`).join("");
  }

  function applyFilters() {
    const q = (els.searchInput?.value || "").trim().toLowerCase();
    const cat = els.categorySelect?.value || "Todas";

    let out = PRODUCTS.filter((p) => {
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

  // =========================
  // PRODUCT CARD
  // =========================
  function getCoverMedia(p) {
    const imgs = getProductImages(p);
    return imgs[0] || "assets/logo.png";
  }

  function productCardHTML(p) {
    const badge = p.tag ? `<div class="badge">${p.tag}</div>` : "";
    const plus = `<div class="plus" aria-hidden="true">+</div>`;
    const cover = getCoverMedia(p);

    const mediaHTML = isVideo(cover)
      ? `<video src="${cover}" muted playsinline loop></video>`
      : `<img src="${cover}" alt="${p.name}" loading="lazy"
            onerror="this.onerror=null; this.src='assets/logo.png'; this.style.objectFit='contain'; this.style.padding='18px';" />`;

    return `
      <article class="card">
        <div class="media">
          ${badge}
          ${mediaHTML}
          <!-- tocar la imagen abre galería -->
          <button class="hit" data-open="${p.id}" title="Ver fotos"
            style="all:unset;cursor:pointer;position:absolute;inset:0">
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
    const filtered = applyFilters();
    if (els.resultsCount) els.resultsCount.textContent = `${filtered.length} productos`;
    if (els.productsGrid) els.productsGrid.innerHTML = filtered.map(productCardHTML).join("");

    requestAnimationFrame(() => {
      els.productsGrid?.querySelectorAll("video").forEach((v) => v.play().catch(() => {}));
    });
  }

  // =========================
  // CART RENDER
  // =========================
  function renderCart() {
    if (!els.cartCount || !els.cartTotal || !els.cartItems || !els.waOrderBtn) return;

    els.cartCount.textContent = String(cartCount());
    els.cartTotal.textContent = money(cartTotal());

    const entries = Object.entries(cart);
    if (entries.length === 0) {
      els.cartItems.innerHTML = `<div class="muted">Tu carrito está vacío.</div>`;
      els.waOrderBtn.href = waLink("Hola! Quiero hacer un pedido, pero mi carrito está vacío 😅");
      return;
    }

    const lines = [];
    let msg = `Hola! Quiero hacer este pedido en Flow Urban:\n\n`;

    els.cartItems.innerHTML = entries
      .map(([id, qty]) => {
        const p = PRODUCTS.find((x) => x.id === id);
        if (!p) return "";

        const line = `• ${p.name} (${(p.sizes || []).join("/")}) x${qty} — ${money(
          (p.price || 0) * qty
        )}`;
        lines.push(line);

        const imgs = getProductImages(p);
        const imgSrc = imgs[0] && !isVideo(imgs[0]) ? imgs[0] : "assets/logo.png";

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

    msg += lines.join("\n");
    msg += `\n\nTotal: ${money(cartTotal())}\n\n¿Me confirmas disponibilidad y envío?`;
    els.waOrderBtn.href = waLink(msg);
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

  // ✅ ahora "Ver" abre la galería
  function viewProduct(id) {
    openGallery(id);
  }

  // =========================
  // LOADER (no se pega)
  // =========================
  function fastLoader() {
    if (!els.loader) return;

    const bar = els.barFill;
    let pct = 0;

    const tick = setInterval(() => {
      pct = Math.min(92, pct + 6);
      if (bar) bar.style.width = pct + "%";
    }, 80);

    const preload = (src) =>
      new Promise((resolve) => {
        const img = new Image();
        img.onload = resolve;
        img.onerror = resolve;
        img.src = src;
      });

    const critical = ["assets/loader.png", "assets/hero.jpg", "assets/logo.png"];
    const timeout = new Promise((res) => setTimeout(res, 1600));

    Promise.race([Promise.all(critical.map(preload)), timeout]).then(() => {
      clearInterval(tick);
      if (bar) bar.style.width = "100%";
      setTimeout(() => {
        els.loader.style.display = "none";
        els.loader.setAttribute("aria-hidden", "true");
      }, 350);
    });

    setTimeout(() => {
      if (!els.loader) return;
      els.loader.style.display = "none";
      els.loader.setAttribute("aria-hidden", "true");
    }, 4500);
  }

  // =========================
  // THEME SWITCH
  // =========================
  function initThemeSwitch() {
    const btnWomen = document.getElementById("btnWomen");
    const btnMen = document.getElementById("btnMen");
    if (!btnWomen || !btnMen) return;

    const applyTheme = (t) => {
      document.body.classList.toggle("theme-women", t === "women");
      btnWomen.classList.toggle("genderBtn--active", t === "women");
      btnMen.classList.toggle("genderBtn--active", t === "men");
      localStorage.setItem("flowurban_theme", t);
    };

    applyTheme(localStorage.getItem("flowurban_theme") || "men");

    btnWomen.addEventListener("click", () => applyTheme("women"));
    btnMen.addEventListener("click", () => applyTheme("men"));
  }

  // =========================
  // UI
  // =========================
  function wireUI() {
    setWaLinks();

    closeDrawer();
    renderCart();

    buildCategorySelect();
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
      const openBtn = e.target.closest("[data-open]");

      if (addBtn) {
        const id = addBtn.getAttribute("data-add");
        addToCart(id);
        openDrawer();
      }

      if (viewBtn) {
        const id = viewBtn.getAttribute("data-view");
        viewProduct(id);
      }

      // ✅ click en imagen abre modal con swipe
      if (openBtn) {
        const id = openBtn.getAttribute("data-open");
        openGallery(id);
      }
    });

    els.openCartBtn?.addEventListener("click", openDrawer);
    els.closeCartBtn?.addEventListener("click", closeDrawer);
    els.backdrop?.addEventListener("click", closeDrawer);

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

  document.addEventListener("DOMContentLoaded", async () => {
    initThemeSwitch();

    // ✅ Primero intenta CSV
    try {
      const fromCSV = await loadProductsFromCSV();
      PRODUCTS = fromCSV;
      console.log("✅ Productos cargados desde CSV:", PRODUCTS.length);
    } catch (err) {
      console.warn("⚠️ No se pudo cargar CSV, usando products.js", err);
      PRODUCTS = Array.isArray(FALLBACK_PRODUCTS) ? [...FALLBACK_PRODUCTS] : [];
    }

    wireUI();
    fastLoader();
  });
})();
