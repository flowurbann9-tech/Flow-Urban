import { STORE, PRODUCTS } from "./products.js";

/* ---------------------------
  Helpers
---------------------------- */
const $ = (sel) => document.querySelector(sel);
const fmtMoney = (n) =>
  new Intl.NumberFormat("es-EC", { style: "currency", currency: STORE.currency || "USD" }).format(n);

const waLink = (phone, text) => {
  const msg = encodeURIComponent(text);
  return `https://wa.me/${phone}?text=${msg}`;
};

const loadCart = () => {
  try { return JSON.parse(localStorage.getItem("flowurban_cart") || "{}"); }
  catch { return {}; }
};
const saveCart = (cart) => localStorage.setItem("flowurban_cart", JSON.stringify(cart));

let cart = loadCart();

/* ---------------------------
  Loader
---------------------------- */
window.addEventListener("load", () => {
  const pre = $("#preloader");
  if (pre) pre.style.display = "none";
});

/* ---------------------------
  Header / Contact links
---------------------------- */
function initContactLinks(){
  const text = `Ventas 1: ${STORE.whatsappSales1} | Ventas 2: ${STORE.whatsappSales2}`;
  $("#waNumbers").textContent = text;

  const msg = "Hola Flow Urban 👋 Quiero información por favor.";
  $("#waBtn1").href = waLink(STORE.whatsappSales1, msg);
  $("#waBtn2").href = waLink(STORE.whatsappSales2, msg);
  $("#waFloat").href = waLink(STORE.whatsappSales1, msg);
  $("#btnWhatsappHero").href = waLink(STORE.whatsappSales1, msg);

  $("#igBtn").href = STORE.instagram || "https://instagram.com/";
  $("#ttBtn").href = STORE.tiktok || "https://tiktok.com/";
}

/* ---------------------------
  Catalog UI
---------------------------- */
function uniqueCategories(){
  const cats = new Set(PRODUCTS.map(p => p.category).filter(Boolean));
  return ["Todas", ...Array.from(cats)];
}

function fillCategorySelect(){
  const sel = $("#categorySelect");
  sel.innerHTML = "";
  uniqueCategories().forEach(c => {
    const opt = document.createElement("option");
    opt.value = c;
    opt.textContent = c;
    sel.appendChild(opt);
  });
}

function productMatches(p, q, cat){
  const query = q.trim().toLowerCase();
  const inCat = (cat === "Todas" || !cat) ? true : p.category === cat;
  if (!inCat) return false;
  if (!query) return true;
  return (
    p.name.toLowerCase().includes(query) ||
    (p.desc || "").toLowerCase().includes(query) ||
    (p.category || "").toLowerCase().includes(query) ||
    (p.sizes || []).join(" ").toLowerCase().includes(query)
  );
}

function sortProducts(list, mode){
  const arr = [...list];
  if (mode === "priceAsc") arr.sort((a,b)=>a.price-b.price);
  else if (mode === "priceDesc") arr.sort((a,b)=>b.price-a.price);
  else if (mode === "nameAsc") arr.sort((a,b)=>a.name.localeCompare(b.name));
  // featured: keep order
  return arr;
}

function renderCatalog(){
  const q = $("#searchInput").value || "";
  const cat = $("#categorySelect").value || "Todas";
  const sort = $("#sortSelect").value || "featured";

  const filtered = PRODUCTS.filter(p => productMatches(p, q, cat));
  const sorted = sortProducts(filtered, sort);

  $("#resultsMeta").textContent = `${sorted.length} productos`;

  const grid = $("#catalogGrid");
  grid.innerHTML = "";
  sorted.forEach(p => grid.appendChild(renderCard(p)));
}

function renderCard(p){
  const card = document.createElement("article");
  card.className = "pcard";

  const imgWrap = document.createElement("div");
  imgWrap.className = "pcard__imgWrap";

  const img = document.createElement("img");
  img.className = "pcard__img";
  img.alt = p.name;
  img.loading = "lazy";
  img.src = p.image || "";
  img.onerror = () => {
    img.remove();
    imgWrap.classList.add("is-missing");
  };

  imgWrap.appendChild(img);

  const body = document.createElement("div");
  body.className = "pcard__body";

  const top = document.createElement("div");
  top.className = "pcard__top";

  const name = document.createElement("h3");
  name.className = "pcard__name";
  name.textContent = p.name;

  const price = document.createElement("div");
  price.className = "pcard__price";
  price.textContent = fmtMoney(p.price);

  top.appendChild(name);
  top.appendChild(price);

  const badge = document.createElement("div");
  badge.innerHTML = p.badge ? `<span class="badge">${p.badge}</span>` : "";

  const sizes = document.createElement("div");
  sizes.className = "sizes";
  sizes.textContent = `Tallas: ${(p.sizes || []).join(", ")}`;

  const actions = document.createElement("div");
  actions.className = "pcard__actions";

  const viewBtn = document.createElement("button");
  viewBtn.className = "btn btn--ghost";
  viewBtn.type = "button";
  viewBtn.textContent = "Ver";
  viewBtn.onclick = () => {
    const msg = `Hola Flow Urban 👋 Quiero ver: ${p.name} (${p.id}).\nPrecio: ${fmtMoney(p.price)}\nTallas: ${(p.sizes||[]).join(", ")}`;
    window.open(waLink(STORE.whatsappSales1, msg), "_blank");
  };

  const addBtn = document.createElement("button");
  addBtn.className = "btn btn--primary";
  addBtn.type = "button";
  addBtn.textContent = "Agregar";
  addBtn.onclick = () => addToCart(p.id);

  actions.appendChild(viewBtn);
  actions.appendChild(addBtn);

  body.appendChild(top);
  if (p.badge) body.appendChild(badge);
  body.appendChild(sizes);
  body.appendChild(actions);

  card.appendChild(imgWrap);
  card.appendChild(body);
  return card;
}

/* ---------------------------
  Cart
---------------------------- */
function cartCount(){
  return Object.values(cart).reduce((a,b)=>a+b,0);
}
function cartTotal(){
  return Object.entries(cart).reduce((sum,[id,qty])=>{
    const p = PRODUCTS.find(x=>x.id===id);
    return sum + (p ? p.price*qty : 0);
  },0);
}
function updateCartUI(){
  $("#cartCount").textContent = String(cartCount());
  $("#cartTotal").textContent = fmtMoney(cartTotal());
}

function addToCart(id){
  cart[id] = (cart[id] || 0) + 1;
  saveCart(cart);
  updateCartUI();
}

function removeOne(id){
  if (!cart[id]) return;
  cart[id] -= 1;
  if (cart[id] <= 0) delete cart[id];
  saveCart(cart);
  updateCartUI();
  renderCartDrawer();
}

function addOne(id){
  addToCart(id);
  renderCartDrawer();
}

function clearCart(){
  cart = {};
  saveCart(cart);
  updateCartUI();
  renderCartDrawer();
}

function openCart(){
  $("#cartDrawer").classList.add("is-open");
  $("#cartDrawer").setAttribute("aria-hidden","false");
  renderCartDrawer();
}
function closeCart(){
  $("#cartDrawer").classList.remove("is-open");
  $("#cartDrawer").setAttribute("aria-hidden","true");
}

function renderCartDrawer(){
  const wrap = $("#cartItems");
  wrap.innerHTML = "";

  const entries = Object.entries(cart);
  if (!entries.length){
    wrap.innerHTML = '<p class="muted">Tu carrito está vacío.</p>';
    $("#cartTotal").textContent = fmtMoney(0);
    return;
  }

  entries.forEach(([id, qty])=>{
    const p = PRODUCTS.find(x=>x.id===id);
    if (!p) return;

    const row = document.createElement("div");
    row.className = "cartItem";

    const left = document.createElement("div");
    left.innerHTML = `
      <div class="cartItem__name">${p.name}</div>
      <div class="cartItem__meta">${fmtMoney(p.price)} • ${p.category}</div>
    `;

    const right = document.createElement("div");
    right.className = "cartItem__qty";

    const minus = document.createElement("button");
    minus.className = "qtyBtn";
    minus.type = "button";
    minus.textContent = "−";
    minus.onclick = () => removeOne(id);

    const num = document.createElement("div");
    num.className = "qtyNum";
    num.textContent = String(qty);

    const plus = document.createElement("button");
    plus.className = "qtyBtn";
    plus.type = "button";
    plus.textContent = "+";
    plus.onclick = () => addOne(id);

    right.appendChild(minus);
    right.appendChild(num);
    right.appendChild(plus);

    row.appendChild(left);
    row.appendChild(right);
    wrap.appendChild(row);
  });

  $("#cartTotal").textContent = fmtMoney(cartTotal());
}

function checkoutWhatsApp(){
  const entries = Object.entries(cart);
  if (!entries.length){
    alert("Tu carrito está vacío.");
    return;
  }

  const lines = entries.map(([id, qty])=>{
    const p = PRODUCTS.find(x=>x.id===id);
    return p ? `• ${qty}x ${p.name} (${id}) - ${fmtMoney(p.price*qty)}` : "";
  }).filter(Boolean);

  const msg =
`Hola Flow Urban 👋
Quiero hacer este pedido:

${lines.join("\n")}

Total: ${fmtMoney(cartTotal())}
¿Me confirmas stock y envío?`;

  window.open(waLink(STORE.whatsappSales1, msg), "_blank");
}

/* ---------------------------
  Events
---------------------------- */
function bindEvents(){
  $("#searchInput").addEventListener("input", renderCatalog);
  $("#categorySelect").addEventListener("change", renderCatalog);
  $("#sortSelect").addEventListener("change", renderCatalog);

  $("#clearFilters").addEventListener("click", ()=>{
    $("#searchInput").value = "";
    $("#categorySelect").value = "Todas";
    $("#sortSelect").value = "featured";
    renderCatalog();
  });

  $("#cartButton").addEventListener("click", openCart);
  $("#closeCart").addEventListener("click", closeCart);
  $("#drawerBackdrop").addEventListener("click", closeCart);

  $("#checkoutBtn").addEventListener("click", checkoutWhatsApp);
  $("#clearCartBtn").addEventListener("click", clearCart);
}

/* ---------------------------
  Init
---------------------------- */
initContactLinks();
fillCategorySelect();
renderCatalog();
bindEvents();
updateCartUI();
