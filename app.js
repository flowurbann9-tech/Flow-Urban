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

    // ✅ MODAL PRODUCTO
    pModal: document.getElementById("pModal"),
    pModalBack: document.getElementById("pModalBack"),
    pModalClose: document.getElementById("pModalClose"),
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

    return {
      id: String(p.id || "").trim(),
      name: String(p.name || "").trim(),
      category: String(p.category || "").trim(),
      price: Number.isFinite(price) ? price : 0,
      sizes,
      tag: String(p.tag || "").trim(),
      media: String(p.media || "").trim(), // ✅ puede ser "a.jpg|b.jpg|c.jpg"
      featured,
    };
  }

  async function loadProductsFromCSV() {
    // ✅ cache-bust para GitHub Pages
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
  // ✅ MEDIA HELPERS (3 fotos por producto)
  // =========================
  function splitMedia(mediaStr) {
    const raw = String(mediaStr || "").trim();
    if (!raw) return [];
    return raw
      .split("|")
      .map((s) => s.trim())
      .filter(Boolean);
  }

  function firstMedia(p) {
    const list = splitMedia(p.media);
    return list[0] || p.media || "assets/logo.png";
  }

  // =========================
  // PRODUCT CARD
  // =========================
  function productCardHTML(p) {
    const badge = p.tag ? `<div class="badge">${p.tag}</div>` : "";
    const plus = `<div class="plus" aria-hidden="true">+</div>`;

    const media0 = firstMedia(p);
    const mediaHTML = isVideo(media0)
      ? `<video src="${media0}" muted playsinline loop></video>`
      : `<img src="${media0}" alt="${p.name}" loading="lazy"
            onerror="this.onerror=null; this.src='assets/logo.png'; this.style.objectFit='contain'; this.style.padding='18px';" />`;

    return `
      <article class="card">
        <div class="media" data-open="${p.id}">
          ${badge}
          ${mediaHTML}

          <button class="hit" data-add="${p.id}" title="Agregar"
            style="all:unset;cursor:pointer;position:absolute;right:12px;bottom:12px;width:44px;height:44px;z-index:3">
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

        const imgSrc = firstMedia(p);
        const safeImg = imgSrc && !isVideo(imgSrc) ? imgSrc : "assets/logo.png";

        return `
          <div class="ci">
            <div class="ci__img">
              <img src="${safeImg}" alt="${p.name}"
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
  // ✅ MODAL + SLIDER (SWIPE)
  // =========================
  let modalProductId = null;
  let sliderIndex = 0;
  let sliderItems = [];
  let touchStartX = 0;
  let touchStartY = 0;
  let isSwiping = false;

  function openProductModal(id) {
    const p = PRODUCTS.find((x) => x.id === id);
    if (!p || !els.pModal) return;

    modalProductId = id;
    sliderIndex = 0;

    const list = splitMedia(p.media);
    sliderItems = list.length ? list : [p.media || "assets/logo.png"];

    if (els.pSliderTrack) {
      els.pSliderTrack.innerHTML = sliderItems
        .map((url) => {
          const u = String(url || "").trim();
          if (!u) return "";
          if (isVideo(u)) {
            return `
              <div class="pslide">
                <video src="${u}" playsinline controls></video>
              </div>
            `;
          }
          return `
            <div class="pslide">
              <img src="${u}" alt="${p.name}"
                onerror="this.onerror=null; this.src='assets/logo.png'; this.style.objectFit='contain'; this.style.padding='18px';" />
            </div>
          `;
        })
        .join("");
    }

    if (els.pSliderDots) {
      els.pSliderDots.innerHTML = sliderItems
        .map((_, i) => `<span class="pdot ${i === 0 ? "pdot--on" : ""}" data-dot="${i}"></span>`)
        .join("");
    }

    if (els.pTitle) els.pTitle.textContent = p.name || "";
    if (els.pMeta) els.pMeta.textContent = p.category || "";
    if (els.pPrice) els.pPrice.textContent = money(p.price || 0);
    if (els.pSizes) els.pSizes.textContent = `Tallas: ${(p.sizes || []).join(", ")}`;

    document.body.classList.add("pmodalOpen");
    els.pModal.setAttribute("aria-hidden", "false");

    updateSlider();

    requestAnimationFrame(() => {
      els.pSliderTrack?.querySelectorAll("video").forEach((v) => v.play().catch(() => {}));
    });

    attachZoomToCurrentSlide();
  }

  function closeProductModal() {
    if (!els.pModal) return;
    document.body.classList.remove("pmodalOpen");
    els.pModal.setAttribute("aria-hidden", "true");
    modalProductId = null;
    sliderIndex = 0;
    sliderItems = [];
  }

  function updateDots() {
    if (!els.pSliderDots) return;
    els.pSliderDots.querySelectorAll(".pdot").forEach((d) => {
      const i = Number(d.getAttribute("data-dot"));
      d.classList.toggle("pdot--on", i === sliderIndex);
    });
  }

  function updateSlider() {
    if (!els.pSliderTrack) return;
    const x = sliderIndex * 100;
    els.pSliderTrack.style.transform = `translateX(-${x}%)`;
    updateDots();
    attachZoomToCurrentSlide(true);
  }

  function nextSlide() {
    if (sliderItems.length <= 1) return;
    sliderIndex = Math.min(sliderItems.length - 1, sliderIndex + 1);
    updateSlider();
  }

  function prevSlide() {
    if (sliderItems.length <= 1) return;
    sliderIndex = Math.max(0, sliderIndex - 1);
    updateSlider();
  }

  // =========================
  // ✅ PINCH ZOOM + DOBLE TAP (MÓVIL)
  // =========================
  function makePinchZoom(container) {
    if (!container) return;
    if (container.__pzBound) return;
    container.__pzBound = true;

    let scale = 1;
    let startScale = 1;
    let lastTap = 0;

    let panX = 0;
    let panY = 0;
    let startPanX = 0;
    let startPanY = 0;

    let startDist = 0;
    let startMidX = 0;
    let startMidY = 0;

    let isPinching = false;
    let isPanning = false;

    const getMedia = () => container.querySelector("img,video");

    const apply = () => {
      const media = getMedia();
      if (!media) return;
      media.style.transformOrigin = "center center";
      media.style.transform = `translate(${panX}px, ${panY}px) scale(${scale})`;
      media.style.transition = "none";
    };

    const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

    const reset = () => {
      scale = 1;
      panX = 0;
      panY = 0;
      apply();
    };

    const dist = (t1, t2) => {
      const dx = t2.clientX - t1.clientX;
      const dy = t2.clientY - t1.clientY;
      return Math.hypot(dx, dy);
    };

    const mid = (t1, t2) => ({
      x: (t1.clientX + t2.clientX) / 2,
      y: (t1.clientY + t2.clientY) / 2,
    });

    container.style.touchAction = "none";

    container.addEventListener(
      "touchstart",
      (e) => {
        const media = getMedia();
        if (!media) return;

        const now = Date.now();
        if (e.touches.length === 1) {
          if (now - lastTap < 260) {
            if (scale === 1) {
              scale = 2.2;
              panX = 0;
              panY = 0;
            } else {
              reset();
            }
            apply();
            e.preventDefault();
          }
          lastTap = now;
        }

        if (e.touches.length === 2) {
          isPinching = true;
          isPanning = false;

          startScale = scale;
          startDist = dist(e.touches[0], e.touches[1]);

          const m = mid(e.touches[0], e.touches[1]);
          startMidX = m.x;
          startMidY = m.y;

          startPanX = panX;
          startPanY = panY;

          e.preventDefault();
        } else if (e.touches.length === 1 && scale > 1) {
          isPanning = true;
          isPinching = false;

          startPanX = panX;
          startPanY = panY;

          startMidX = e.touches[0].clientX;
          startMidY = e.touches[0].clientY;

          e.preventDefault();
        }
      },
      { passive: false }
    );

    container.addEventListener(
      "touchmove",
      (e) => {
        const media = getMedia();
        if (!media) return;

        if (isPinching && e.touches.length === 2) {
          const d = dist(e.touches[0], e.touches[1]);
          const factor = d / startDist;

          scale = clamp(startScale * factor, 1, 4);

          const m = mid(e.touches[0], e.touches[1]);
          panX = startPanX + (m.x - startMidX) * 0.35;
          panY = startPanY + (m.y - startMidY) * 0.35;

          apply();
          e.preventDefault();
        }

        if (isPanning && e.touches.length === 1 && scale > 1) {
          const x = e.touches[0].clientX;
          const y = e.touches[0].clientY;

          panX = startPanX + (x - startMidX);
          panY = startPanY + (y - startMidY);

          apply();
          e.preventDefault();
        }
      },
      { passive: false }
    );

    container.addEventListener("touchend", (e) => {
      if (e.touches.length === 0) {
        isPinching = false;
        isPanning = false;
        if (scale < 1.05) reset();
      }
    });

    container.addEventListener("zoomReset", reset);
  }

  function attachZoomToCurrentSlide(resetFirst = false) {
    const slides = els.pSliderTrack?.querySelectorAll(".pslide");
    if (!slides || !slides.length) return;
    const current = slides[sliderIndex];
    if (!current) return;

    makePinchZoom(current);
    if (resetFirst) current.dispatchEvent(new Event("zoomReset"));
  }

  function bindSliderSwipe() {
    const slider = document.getElementById("pSlider");
    if (!slider) return;

    slider.addEventListener(
      "touchstart",
      (e) => {
        if (e.touches.length !== 1) return;
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
        isSwiping = true;
      },
      { passive: true }
    );

    slider.addEventListener(
      "touchmove",
      (e) => {
        if (!isSwiping || e.touches.length !== 1) return;
        const dx = e.touches[0].clientX - touchStartX;
        const dy = e.touches[0].clientY - touchStartY;

        if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 10) {
          e.preventDefault();
        }
      },
      { passive: false }
    );

    slider.addEventListener(
      "touchend",
      (e) => {
        if (!isSwiping) return;
        isSwiping = false;

        const touch = e.changedTouches[0];
        if (!touch) return;

        const dx = touch.clientX - touchStartX;
        const dy = touch.clientY - touchStartY;

        if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 45) {
          if (dx < 0) nextSlide();
          else prevSlide();
        }
      },
      { passive: true }
    );
  }

  // =========================
  // LOADER
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
    const brandLogo = document.querySelector(".brand__logo");

// Guardar logo original
const defaultLogo = "assets/logo.png";
const womenLogo = "assets/logo-women.png";

btnWomen.addEventListener("click", () => {
  document.body.classList.add("theme-women");
  brandLogo.src = womenLogo;
});

btnMen.addEventListener("click", () => {
  document.body.classList.remove("theme-women");
  brandLogo.src = defaultLogo;
});
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
      const openArea = e.target.closest("[data-open]");

      if (addBtn) {
        e.preventDefault();
        e.stopPropagation();
        const id = addBtn.getAttribute("data-add");
        addToCart(id);
        openDrawer();
        return;
      }

      if (viewBtn) {
        const id = viewBtn.getAttribute("data-view");
        openProductModal(id);
        return;
      }

      if (openArea) {
        const id = openArea.getAttribute("data-open");
        openProductModal(id);
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
      if (e.key === "Escape") {
        closeDrawer();
        closeProductModal();
      }
    });

    els.pModalBack?.addEventListener("click", closeProductModal);
    els.pModalClose?.addEventListener("click", closeProductModal);

    els.pSliderDots?.addEventListener("click", (e) => {
      const dot = e.target.closest("[data-dot]");
      if (!dot) return;
      sliderIndex = Number(dot.getAttribute("data-dot") || 0);
      updateSlider();
    });

    els.pAddBtn?.addEventListener("click", () => {
      if (!modalProductId) return;
      addToCart(modalProductId);
      closeProductModal();
      openDrawer();
    });

    bindSliderSwipe();

    // ✅ Anti-descarga PRO: SOLO en grilla y carrito (NO modal)
    bindAntiDownload();
  }

  // =========================
  // ✅ ANTI-DESCARGA PRO (NO rompe swipe/zoom)
  // =========================
  function bindAntiDownload() {
    // click derecho (solo imagen/video)
    document.addEventListener("contextmenu", (e) => {
      const t = e.target;
      if (t && (t.tagName === "IMG" || t.tagName === "VIDEO")) e.preventDefault();
    });

    // dragstart
    document.addEventListener("dragstart", (e) => {
      const t = e.target;
      if (t && (t.tagName === "IMG" || t.tagName === "VIDEO")) e.preventDefault();
    });

    // móvil: bloquear “mantener presionado” SOLO fuera del modal
    document.addEventListener(
      "touchstart",
      (e) => {
        const t = e.target;
        if (!t) return;

        // ❌ si está dentro del modal, no bloquees (para pinch/swipe)
        if (t.closest("#pModal")) return;

        // ✅ si está en grilla o carrito, bloquea guardar
        if (
          (t.tagName === "IMG" || t.tagName === "VIDEO") &&
          (t.closest("#productsGrid") || t.closest("#cartDrawer"))
        ) {
          e.preventDefault();
        }
      },
      { passive: false }
    );
  }

  document.addEventListener("DOMContentLoaded", async () => {
    initThemeSwitch();

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
/* =========================
   ANTI-DESCARGA (disuadir) ✅ PRO + NO rompe modal
========================= */
document.addEventListener("contextmenu", (e) => {
  const t = e.target;
  // bloquea click derecho solo sobre imágenes y videos
  if (t && (t.tagName === "IMG" || t.tagName === "VIDEO")) {
    e.preventDefault();
  }
});

document.addEventListener("dragstart", (e) => {
  const t = e.target;
  if (t && (t.tagName === "IMG" || t.tagName === "VIDEO")) {
    e.preventDefault();
  }
});

/* Bloquear “guardar imagen” en móviles (mantener presionado)
   ✅ SOLO en catálogo + carrito (NO en modal para no matar swipe/zoom)
*/
document.addEventListener(
  "touchstart",
  (e) => {
    const t = e.target;
    if (!t) return;

    // ✅ si está dentro del modal, NO bloquees (para pinch zoom y swipe)
    if (t.closest("#pModal")) return;

    // ✅ solo bloquear en el catálogo y el carrito
    const inCatalog = t.closest("#productsGrid");
    const inCart = t.closest("#cartDrawer");

    if ((inCatalog || inCart) && (t.tagName === "IMG" || t.tagName === "VIDEO")) {
      e.preventDefault();
    }
  },
  { passive: false }
);
const btnWomen = document.getElementById("btnWomen");
const btnMen = document.getElementById("btnMen");
const logo = document.getElementById("brandLogo");

// Cambiar imagen con animación
function changeLogo(src){
  logo.classList.add("fade-out");

  setTimeout(() => {
    logo.src = src;
    logo.classList.remove("fade-out");
    logo.classList.add("fade-in");

    setTimeout(() => {
      logo.classList.remove("fade-in");
    }, 250);

  }, 250);
}

// MUJER
btnWomen.addEventListener("click", () => {
  document.body.classList.add("theme-women");
  btnWomen.classList.add("genderBtn--active");
  btnMen.classList.remove("genderBtn--active");

  changeLogo("assets/logo-women.png"); // ← tu segunda imagen
});

// HOMBRE
btnMen.addEventListener("click", () => {
  document.body.classList.remove("theme-women");
  btnMen.classList.add("genderBtn--active");
  btnWomen.classList.remove("genderBtn--active");

  changeLogo("assets/logo.png"); // ← logo normal
});
/* ======================================
   GUARDAR TEMA Y LOGO AL REFRESCAR
====================================== */

const btnWomen = document.getElementById("btnWomen");
const btnMen = document.getElementById("btnMen");
const logo = document.getElementById("brandLogo");

// Cambiar logo con animación
function changeLogo(src){
  logo.classList.add("fade-out");

  setTimeout(() => {
    logo.src = src;
    logo.classList.remove("fade-out");
    logo.classList.add("fade-in");

    setTimeout(() => {
      logo.classList.remove("fade-in");
    }, 250);

  }, 250);
}

// Activar MUJER
btnWomen.addEventListener("click", () => {
  document.body.classList.add("theme-women");
  btnWomen.classList.add("genderBtn--active");
  btnMen.classList.remove("genderBtn--active");

  changeLogo("assets/logo-women.png");

  localStorage.setItem("theme", "women");
});

// Activar HOMBRE
btnMen.addEventListener("click", () => {
  document.body.classList.remove("theme-women");
  btnMen.classList.add("genderBtn--active");
  btnWomen.classList.remove("genderBtn--active");

  changeLogo("assets/logo.png");

  localStorage.setItem("theme", "men");
});

// Al cargar la página
window.addEventListener("DOMContentLoaded", () => {
  const savedTheme = localStorage.getItem("theme");

  if(savedTheme === "women"){
    document.body.classList.add("theme-women");
    btnWomen.classList.add("genderBtn--active");
    btnMen.classList.remove("genderBtn--active");
    logo.src = "assets/logo-women.png";
  }
});
