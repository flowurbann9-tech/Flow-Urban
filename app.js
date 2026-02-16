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
      return new Intl.NumberFormat("es-EC", {
        style: "currency",
        currency: "USD",
      }).format(n);
    } catch {
      return `$${Number(n || 0).toFixed(2)}`.replace(".", ",");
    }
  };

  const isVideo = (url) => /\.(mp4|webm|ogg)$/i.test(url || "");

  // =========================
  // ✅ MULTI-FOTO: media puede venir como:
  // "a.jpg"  o  "a.jpg|b.jpg|c.jpg"
  // =========================
  function mediaToList(media) {
    const m = String(media || "").trim();
    if (!m) return [];
    if (m.includes("|")) return m.split("|").map((s) => s.trim()).filter(Boolean);
    if (m.includes(";")) return m.split(";").map((s) => s.trim()).filter(Boolean);
    return [m];
  }

  function normalizeProduct(p) {
    const price = Number(String(p.price || "0").replace(",", "."));
    const featuredRaw = String(p.featured || "").trim().toLowerCase();
    const featured =
      featuredRaw === "yes" ||
      featuredRaw === "si" ||
      featuredRaw === "true" ||
      featuredRaw === "1";

    // sizes: acepta "S|M|L" o "S, M, L"
    const sizesStr = String(p.sizes || "").trim();
    const sizes = sizesStr.includes("|")
      ? sizesStr.split("|").map((s) => s.trim()).filter(Boolean)
      : sizesStr.split(",").map((s) => s.trim()).filter(Boolean);

    const media = String(p.media || "").trim();
    const mediaList = mediaToList(media).slice(0, 3); // ✅ máximo 3 fotos

    return {
      id: String(p.id || "").trim(),
      name: String(p.name || "").trim(),
      category: String(p.category || "").trim(),
      price: Number.isFinite(price) ? price : 0,
      sizes,
      tag: String(p.tag || "").trim(),
      media,
      mediaList,
      featured,
    };
  }

  // =========================
  // ✅ PRODUCTS (se cargan desde CSV)
  // =========================
  let PRODUCTS = Array.isArray(FALLBACK_PRODUCTS)
    ? FALLBACK_PRODUCTS.map(normalizeProduct)
    : [];

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
  // ✅ MODAL SLIDER (NO toca tu HTML)
  // =========================
  let modalRoot = null;
  let modalTrack = null;
  let modalDots = null;
  let modalTitle = null;
  let modalMeta = null;
  let modalPrice = null;
  let modalSizes = null;
  let modalAddBtn = null;

  const modalState = { open: false, id: null, idx: 0, list: [] };

  function ensureModal() {
    if (modalRoot) return;

    const style = document.createElement("style");
    style.textContent = `
      .fuModal{position:fixed;inset:0;z-index:10050;display:none}
      .fuModal.isOpen{display:block}
      .fuModal__bd{position:absolute;inset:0;background:rgba(0,0,0,.55);backdrop-filter:blur(8px)}
      .fuModal__panel{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);
        width:min(560px,92vw);max-height:86vh;overflow:hidden;border-radius:22px;
        background:rgba(18,18,24,.96);border:1px solid rgba(255,255,255,.12);
        box-shadow:0 26px 80px rgba(0,0,0,.55)}
      body.theme-women .fuModal__panel{background:rgba(255,255,255,.90);border-color:rgba(168,85,247,.20)}
      .fuModal__top{display:flex;align-items:center;justify-content:space-between;padding:14px;border-bottom:1px solid rgba(255,255,255,.08)}
      body.theme-women .fuModal__top{border-bottom-color:rgba(20,10,40,.10)}
      .fuModal__t{font-weight:1000;color:#fff}
      body.theme-women .fuModal__t{color:#17131f}
      .fuModal__x{cursor:pointer;border:0;background:rgba(255,255,255,.10);color:#fff;border-radius:12px;padding:10px 12px}
      body.theme-women .fuModal__x{background:rgba(168,85,247,.12);color:#17131f;border:1px solid rgba(168,85,247,.22)}
      .fuModal__media{position:relative;background:#0f0f14}
      body.theme-women .fuModal__media{background:#fff}
      .fuModal__viewport{width:100%;aspect-ratio:1/1;overflow:hidden;touch-action:pan-y}
      .fuModal__track{display:flex;height:100%;transform:translateX(0);transition:transform .25s ease}
      .fuModal__slide{min-width:100%;height:100%}
      .fuModal__slide img{width:100%;height:100%;object-fit:cover}
      .fuModal__navBtn{position:absolute;top:50%;transform:translateY(-50%);border:0;cursor:pointer;
        width:44px;height:44px;border-radius:14px;background:rgba(0,0,0,.55);color:#fff;display:grid;place-items:center}
      body.theme-women .fuModal__navBtn{background:rgba(168,85,247,.14);color:#17131f;border:1px solid rgba(168,85,247,.20)}
      .fuModal__navBtn.prev{left:10px}
      .fuModal__navBtn.next{right:10px}
      .fuModal__dots{position:absolute;left:0;right:0;bottom:10px;display:flex;gap:6px;justify-content:center}
      .fuDot{width:8px;height:8px;border-radius:999px;background:rgba(255,255,255,.35)}
      body.theme-women .fuDot{background:rgba(23,19,31,.22)}
      .fuDot.isOn{background:rgba(255,255,255,.92)}
      body.theme-women .fuDot.isOn{background:rgba(168,85,247,.85)}
      .fuModal__body{padding:14px}
      .fuModal__meta{opacity:.8;font-weight:800;font-size:13px;margin-top:4px;color:#fff}
      body.theme-women .fuModal__meta{color:#17131f}
      .fuModal__price{margin-top:10px;font-weight:1000;color:#fff}
      body.theme-women .fuModal__price{color:#ff5db1}
      .fuModal__sizes{margin-top:8px;opacity:.85;font-size:13px;color:#fff}
      body.theme-women .fuModal__sizes{color:#17131f}
      .fuModal__actions{margin-top:14px;display:grid;grid-template-columns:1fr;gap:10px}
    `;
    document.head.appendChild(style);

    modalRoot = document.createElement("div");
    modalRoot.className = "fuModal";
    modalRoot.innerHTML = `
      <div class="fuModal__bd" data-close="1"></div>
      <div class="fuModal__panel" role="dialog" aria-modal="true" aria-label="Producto">
        <div class="fuModal__top">
          <div class="fuModal__t" id="fuModalTitle">Producto</div>
          <button class="fuModal__x" type="button" aria-label="Cerrar" data-close="1">✕</button>
        </div>

        <div class="fuModal__media">
          <div class="fuModal__viewport" id="fuViewport">
            <div class="fuModal__track" id="fuTrack"></div>
          </div>
          <button class="fuModal__navBtn prev" type="button" id="fuPrev" aria-label="Anterior">‹</button>
          <button class="fuModal__navBtn next" type="button" id="fuNext" aria-label="Siguiente">›</button>
          <div class="fuModal__dots" id="fuDots"></div>
        </div>

        <div class="fuModal__body">
          <div class="fuModal__meta" id="fuMeta"></div>
          <div class="fuModal__price" id="fuPrice"></div>
          <div class="fuModal__sizes" id="fuSizes"></div>
          <div class="fuModal__actions">
            <button class="btn btn--gold btn--wide" type="button" id="fuAddBtn">Agregar al carrito</button>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(modalRoot);

    modalTrack = modalRoot.querySelector("#fuTrack");
    modalDots = modalRoot.querySelector("#fuDots");
    modalTitle = modalRoot.querySelector("#fuModalTitle");
    modalMeta = modalRoot.querySelector("#fuMeta");
    modalPrice = modalRoot.querySelector("#fuPrice");
    modalSizes = modalRoot.querySelector("#fuSizes");
    modalAddBtn = modalRoot.querySelector("#fuAddBtn");

    const prevBtn = modalRoot.querySelector("#fuPrev");
    const nextBtn = modalRoot.querySelector("#fuNext");
    const viewport = modalRoot.querySelector("#fuViewport");

    modalRoot.addEventListener("click", (e) => {
      if (e.target.closest('[data-close="1"]')) closeModal();
    });

    prevBtn.addEventListener("click", () => slideTo(modalState.idx - 1));
    nextBtn.addEventListener("click", () => slideTo(modalState.idx + 1));

    // Swipe
    let startX = 0;
    let lastX = 0;
    let dragging = false;

    const onDown = (x) => {
      dragging = true;
      startX = x;
      lastX = x;
      modalTrack.style.transition = "none";
    };
    const onMove = (x) => {
      if (!dragging) return;
      lastX = x;
      const dx = x - startX;
      const w = viewport.clientWidth || 1;
      const base = -modalState.idx * w;
      modalTrack.style.transform = `translateX(${base + dx}px)`;
    };
    const onUp = () => {
      if (!dragging) return;
      dragging = false;
      modalTrack.style.transition = "transform .25s ease";
      const dx = lastX - startX;
      const w = viewport.clientWidth || 1;
      if (Math.abs(dx) > w * 0.18) {
        if (dx < 0) slideTo(modalState.idx + 1);
        else slideTo(modalState.idx - 1);
      } else {
        slideTo(modalState.idx);
      }
    };

    viewport.addEventListener("touchstart", (e) => onDown(e.touches[0].clientX), { passive: true });
    viewport.addEventListener("touchmove", (e) => onMove(e.touches[0].clientX), { passive: true });
    viewport.addEventListener("touchend", onUp);

    viewport.addEventListener("mousedown", (e) => {
      e.preventDefault();
      onDown(e.clientX);
    });
    window.addEventListener("mousemove", (e) => onMove(e.clientX));
    window.addEventListener("mouseup", onUp);

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && modalState.open) closeModal();
    });
  }

  function slideTo(nextIdx) {
    if (!modalState.list.length) return;
    const max = modalState.list.length - 1;
    const idx = Math.max(0, Math.min(max, nextIdx));
    modalState.idx = idx;

    const viewport = modalRoot.querySelector("#fuViewport");
    const w = viewport.clientWidth || 1;
    modalTrack.style.transform = `translateX(${-idx * w}px)`;

    Array.from(modalDots.children).forEach((d, i) => {
      d.classList.toggle("isOn", i === idx);
    });
  }

  function openModal(id) {
    ensureModal();

    const p = PRODUCTS.find((x) => x.id === id);
    if (!p) return;

    const list = (p.mediaList && p.mediaList.length ? p.mediaList : mediaToList(p.media)).slice(0, 3);
    const safeList = list.length ? list : ["assets/logo.png"];

    modalState.open = true;
    modalState.id = id;
    modalState.idx = 0;
    modalState.list = safeList;

    modalTitle.textContent = p.name || "Producto";
    modalMeta.textContent = p.category || "";
    modalPrice.textContent = money(p.price || 0);
    modalSizes.textContent = `Tallas: ${(p.sizes || []).join(", ")}`;

    modalTrack.innerHTML = safeList
      .map((src) => {
        const s = String(src || "").trim() || "assets/logo.png";
        return `<div class="fuModal__slide">
          <img src="${s}" alt="${p.name}" loading="eager"
            onerror="this.onerror=null; this.src='assets/logo.png'; this.style.objectFit='contain'; this.style.padding='18px';" />
        </div>`;
      })
      .join("");

    modalDots.innerHTML = safeList
      .map((_, i) => `<span class="fuDot ${i === 0 ? "isOn" : ""}"></span>`)
      .join("");

    modalAddBtn.onclick = () => {
      addToCart(id);
      openDrawer();
    };

    modalRoot.classList.add("isOpen");
    document.body.style.overflow = "hidden";
    requestAnimationFrame(() => slideTo(0));
  }

  function closeModal() {
    if (!modalRoot) return;
    modalState.open = false;
    modalState.id = null;
    modalState.idx = 0;
    modalState.list = [];
    modalRoot.classList.remove("isOpen");
    document.body.style.overflow = "";
  }

  // =========================
  // PRODUCT CARD
  // =========================
  function productCardHTML(p) {
    const badge = p.tag ? `<div class="badge">${p.tag}</div>` : "";
    const plus = `<div class="plus" aria-hidden="true">+</div>`;

    const list = (p.mediaList && p.mediaList.length ? p.mediaList : mediaToList(p.media));
    const thumb = (list && list.length ? list[0] : p.media) || "assets/logo.png";

    const mediaHTML = isVideo(thumb)
      ? `<video src="${thumb}" muted playsinline loop></video>`
      : `<img src="${thumb}" alt="${p.name}" loading="lazy"
            onerror="this.onerror=null; this.src='assets/logo.png'; this.style.objectFit='contain'; this.style.padding='18px';" />`;

    // ✅ la tarjeta abre modal (menos los botones)
    return `
      <article class="card" data-open="${p.id}">
        <div class="media" data-open="${p.id}">
          ${badge}
          ${mediaHTML}

          <!-- ✅ ESTE botón agrega (no abre modal) -->
          <button class="hit" data-add="${p.id}" title="Agregar"
            style="all:unset;cursor:pointer;position:absolute;right:0;bottom:0;left:0;top:0">
            ${plus}
          </button>
        </div>

        <div class="card__body" data-open="${p.id}">
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

        const list = (p.mediaList && p.mediaList.length ? p.mediaList : mediaToList(p.media));
        const imgSrc = list && list.length ? list[0] : "assets/logo.png";

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

  // ✅ "Ver" abre modal
  function viewProduct(id) {
    openModal(id);
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
  function buildCategoryAndRender() {
    buildCategorySelect();
    renderProducts();
  }

  function wireUI() {
    setWaLinks();

    closeDrawer();
    renderCart();

    buildCategoryAndRender();

    els.searchInput?.addEventListener("input", renderProducts);
    els.categorySelect?.addEventListener("change", renderProducts);
    els.sortSelect?.addEventListener("change", renderProducts);

    els.clearBtn?.addEventListener("click", () => {
      if (els.searchInput) els.searchInput.value = "";
      if (els.categorySelect) els.categorySelect.value = "Todas";
      if (els.sortSelect) els.sortSelect.value = "featured";
      renderProducts();
    });

    // ✅ Clicks: prioridad a "Agregar"
    els.productsGrid?.addEventListener("click", (e) => {
      const addBtn = e.target.closest("[data-add]");
      if (addBtn) {
        const id = addBtn.getAttribute("data-add");
        addToCart(id);
        openDrawer();
        return;
      }

      const viewBtn = e.target.closest("[data-view]");
      if (viewBtn) {
        const id = viewBtn.getAttribute("data-view");
        viewProduct(id);
        return;
      }

      const open = e.target.closest("[data-open]");
      if (open) {
        const id = open.getAttribute("data-open");
        if (id) openModal(id);
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
      PRODUCTS = fromCSV.map(normalizeProduct);
      console.log("✅ Productos cargados desde CSV:", PRODUCTS.length);
    } catch (err) {
      console.warn("⚠️ No se pudo cargar CSV, usando products.js", err);
      PRODUCTS = Array.isArray(FALLBACK_PRODUCTS)
        ? FALLBACK_PRODUCTS.map(normalizeProduct)
        : [];
    }

    wireUI();
    fastLoader();
  });
})();
