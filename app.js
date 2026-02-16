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

    // ✅ MODAL
    pModal: document.getElementById("pModal"),
    pModalBack: document.getElementById("pModalBack"),
    pModalClose: document.getElementById("pModalClose"),
    pSlider: document.getElementById("pSlider"),
    pSliderTrack: document.getElementById("pSliderTrack"),
    pSliderDots: document.getElementById("pSliderDots"),
    pTitle: document.getElementById("pTitle"),
    pMeta: document.getElementById("pMeta"),
    pPrice: document.getElementById("pPrice"),
    pSizes: document.getElementById("pSizes"),
    pAddBtn: document.getElementById("pAddBtn"),
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
  // ✅ PRODUCTS (CSV + fallback)
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
        row.push(cell);
        cell = "";
        continue;
      }

      if ((ch === "\n" || ch === "\r") && !inQuotes) {
        if (ch === "\r" && next === "\n") i++;
        row.push(cell);
        cell = "";
        // guarda filas que tengan algo
        if (row.some((x) => String(x || "").trim() !== "")) rows.push(row);
        row = [];
        continue;
      }

      cell += ch;
    }

    row.push(cell);
    if (row.some((x) => String(x || "").trim() !== "")) rows.push(row);

    return rows;
  }

  function normalizeProduct(raw) {
    const price = Number(String(raw.price || "0").replace(",", "."));
    const featuredRaw = String(raw.featured || "").trim().toLowerCase();
    const featured =
      featuredRaw === "yes" ||
      featuredRaw === "si" ||
      featuredRaw === "true" ||
      featuredRaw === "1";

    // sizes: acepta "S|M|L" o "S, M, L"
    const sizesStr = String(raw.sizes || "").trim();
    const sizes = sizesStr.includes("|")
      ? sizesStr
          .split("|")
          .map((s) => s.trim())
          .filter(Boolean)
      : sizesStr
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean);

    // ✅ media: puede venir "a.jpg|b.jpg|c.jpg"
    const mediaStr = String(raw.media || "").trim();
    const mediaList = mediaStr
      .split("|")
      .map((x) => x.trim())
      .filter(Boolean);

    return {
      id: String(raw.id || "").trim(),
      name: String(raw.name || "").trim(),
      category: String(raw.category || "").trim(),
      price: Number.isFinite(price) ? price : 0,
      sizes,
      tag: String(raw.tag || "").trim(),
      media: mediaList[0] || "",     // ✅ para la card (primera foto)
      mediaList: mediaList.length ? mediaList : (mediaStr ? [mediaStr] : []), // ✅ para el modal
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

    // ✅ encuentra la fila header real (la que contiene 'id')
    let headerRowIndex = -1;
    let headerStartIdx = 0;

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i].map((h) => String(h || "").trim().toLowerCase());
      const idPos = row.indexOf("id");
      if (idPos !== -1) {
        headerRowIndex = i;
        headerStartIdx = idPos;
        break;
      }
    }

    if (headerRowIndex === -1) throw new Error("No encontré encabezados (id,name,...)");

    const headers = rows[headerRowIndex]
      .slice(headerStartIdx)
      .map((h) => String(h || "").trim().toLowerCase());

    const idx = (name) => headers.indexOf(name);

    const needed = ["id", "name", "category", "price", "sizes", "tag", "media", "featured"];
    const ok = needed.every((k) => idx(k) !== -1);
    if (!ok) throw new Error("CSV no tiene columnas correctas");

    const out = [];

    for (let i = headerRowIndex + 1; i < rows.length; i++) {
      const rFull = rows[i];
      const r = rFull.slice(headerStartIdx); // ✅ corta columnas vacías de inicio
      if (r.length < headers.length) continue; // fila incompleta

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
  // ✅ PRODUCT MODAL + SLIDER
  // =========================
  let modalProductId = null;
  let slideIndex = 0;
  let slideCount = 0;

  function openProductModal(p) {
    if (!els.pModal || !els.pSliderTrack || !els.pSliderDots) return;

    modalProductId = p.id;

    // textos
    if (els.pTitle) els.pTitle.textContent = p.name || "";
    if (els.pMeta) els.pMeta.textContent = p.category || "";
    if (els.pPrice) els.pPrice.textContent = money(p.price || 0);
    if (els.pSizes) els.pSizes.textContent = `Tallas: ${(p.sizes || []).join(", ")}`;

    // slides
    const list = Array.isArray(p.mediaList) && p.mediaList.length
      ? p.mediaList
      : (p.media ? [p.media] : []);

    slideCount = list.length || 1;
    slideIndex = 0;

    els.pSliderTrack.innerHTML = list
      .map((src) => {
        const safe = src || "assets/logo.png";
        if (isVideo(safe)) {
          return `
            <div class="pslide">
              <video src="${safe}" muted playsinline loop></video>
            </div>
          `;
        }
        return `
          <div class="pslide">
            <img src="${safe}" alt="${p.name || "Producto"}"
              onerror="this.onerror=null; this.src='assets/logo.png'; this.style.objectFit='contain'; this.style.padding='18px';" />
          </div>
        `;
      })
      .join("");

    els.pSliderDots.innerHTML = Array.from({ length: slideCount })
      .map((_, i) => `<div class="pdot ${i === 0 ? "pdot--on" : ""}" data-dot="${i}"></div>`)
      .join("");

    // mostrar modal
    document.body.classList.add("pmodalOpen");
    els.pModal.setAttribute("aria-hidden", "false");

    // play videos si hay
    requestAnimationFrame(() => {
      els.pSliderTrack?.querySelectorAll("video").forEach((v) => v.play().catch(() => {}));
    });

    updateSlider();
  }

  function closeProductModal() {
    if (!els.pModal) return;
    document.body.classList.remove("pmodalOpen");
    els.pModal.setAttribute("aria-hidden", "true");
    modalProductId = null;
  }

  function updateSlider() {
    if (!els.pSliderTrack || !els.pSliderDots) return;
    const x = slideIndex * -100;
    els.pSliderTrack.style.transform = `translateX(${x}%)`;
    els.pSliderDots.querySelectorAll(".pdot").forEach((d, i) => {
      d.classList.toggle("pdot--on", i === slideIndex);
    });
  }

  function goToSlide(i) {
    if (!slideCount) return;
    slideIndex = Math.max(0, Math.min(slideCount - 1, i));
    updateSlider();
  }

  function nextSlide() {
    goToSlide(slideIndex + 1);
  }

  function prevSlide() {
    goToSlide(slideIndex - 1);
  }

  // swipe
  let touchStartX = 0;
  let touchDeltaX = 0;
  let dragging = false;

  function onTouchStart(e) {
    dragging = true;
    touchDeltaX = 0;
    touchStartX = e.touches ? e.touches[0].clientX : e.clientX;
  }
  function onTouchMove(e) {
    if (!dragging) return;
    const x = e.touches ? e.touches[0].clientX : e.clientX;
    touchDeltaX = x - touchStartX;
  }
  function onTouchEnd() {
    if (!dragging) return;
    dragging = false;

    const TH = 45; // umbral swipe
    if (touchDeltaX <= -TH) nextSlide();
    else if (touchDeltaX >= TH) prevSlide();
  }

  // =========================
  // PRODUCT CARD
  // =========================
  function productCardHTML(p) {
    const badge = p.tag ? `<div class="badge">${p.tag}</div>` : "";
    const media = p.media || "";
    const mediaHTML = isVideo(media)
      ? `<video class="pmedia" src="${media}" muted playsinline loop></video>`
      : `<img class="pmedia" src="${media}" alt="${p.name}" loading="lazy"
            onerror="this.onerror=null; this.src='assets/logo.png'; this.style.objectFit='contain'; this.style.padding='18px';" />`;

    // ✅ IMPORTANTE:
    // - NO ponemos botón "hit" encima (eso era lo que te agregaba al carrito al tocar la foto)
    // - el + es el que agrega, y la foto abre modal
    return `
      <article class="card" data-card="${p.id}">
        <div class="media" data-open="${p.id}">
          ${badge}
          ${mediaHTML}
          <button class="plus" data-add="${p.id}" type="button" aria-label="Agregar">+</button>
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

    // filtros
    els.searchInput?.addEventListener("input", renderProducts);
    els.categorySelect?.addEventListener("change", renderProducts);
    els.sortSelect?.addEventListener("change", renderProducts);

    els.clearBtn?.addEventListener("click", () => {
      if (els.searchInput) els.searchInput.value = "";
      if (els.categorySelect) els.categorySelect.value = "Todas";
      if (els.sortSelect) els.sortSelect.value = "featured";
      renderProducts();
    });

    // ✅ CLICK EN GRID:
    // - data-add => carrito
    // - data-view o data-open o click en img/video => modal
    els.productsGrid?.addEventListener("click", (e) => {
      const addBtn = e.target.closest("[data-add]");
      if (addBtn) {
        const id = addBtn.getAttribute("data-add");
        addToCart(id);
        openDrawer();
        return;
      }

      const viewBtn = e.target.closest("[data-view]");
      const openArea = e.target.closest("[data-open]");
      const mediaEl = e.target.closest(".pmedia");

      const id = (viewBtn && viewBtn.getAttribute("data-view")) ||
                (openArea && openArea.getAttribute("data-open")) ||
                (mediaEl && mediaEl.closest("[data-open]")?.getAttribute("data-open"));

      if (id) {
        const p = PRODUCTS.find((x) => x.id === id);
        if (p) openProductModal(p);
      }
    });

    // drawer
    els.openCartBtn?.addEventListener("click", openDrawer);
    els.closeCartBtn?.addEventListener("click", closeDrawer);
    els.backdrop?.addEventListener("click", closeDrawer);

    // carrito + -
    els.cartItems?.addEventListener("click", (e) => {
      const dec = e.target.closest("[data-dec]");
      const inc = e.target.closest("[data-inc]");
      const del = e.target.closest("[data-del]");
      if (dec) decCart(dec.getAttribute("data-dec"));
      if (inc) incCart(inc.getAttribute("data-inc"));
      if (del) delCart(del.getAttribute("data-del"));
    });

    // ✅ modal wires
    els.pModalBack?.addEventListener("click", closeProductModal);
    els.pModalClose?.addEventListener("click", closeProductModal);

    els.pSliderDots?.addEventListener("click", (e) => {
      const dot = e.target.closest("[data-dot]");
      if (!dot) return;
      const i = Number(dot.getAttribute("data-dot"));
      if (Number.isFinite(i)) goToSlide(i);
    });

    // swipe en slider (touch + mouse)
    if (els.pSlider) {
      els.pSlider.addEventListener("touchstart", onTouchStart, { passive: true });
      els.pSlider.addEventListener("touchmove", onTouchMove, { passive: true });
      els.pSlider.addEventListener("touchend", onTouchEnd, { passive: true });

      els.pSlider.addEventListener("mousedown", onTouchStart);
      window.addEventListener("mousemove", onTouchMove);
      window.addEventListener("mouseup", onTouchEnd);
    }

    // botón agregar dentro del modal
    els.pAddBtn?.addEventListener("click", () => {
      if (!modalProductId) return;
      addToCart(modalProductId);
      openDrawer();
      closeProductModal();
    });

    // ESC para cerrar (drawer y modal)
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        closeDrawer();
        closeProductModal();
      }
      // opcional: flechas para slider
      if (document.body.classList.contains("pmodalOpen")) {
        if (e.key === "ArrowRight") nextSlide();
        if (e.key === "ArrowLeft") prevSlide();
      }
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
