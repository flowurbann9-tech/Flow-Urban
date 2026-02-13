/* CONFIG */
const STORE = {
  currency: "USD",
  whatsapp1: "593987771119",
  whatsapp2: "593962722395",
  instagram: "https://instagram.com/",
  tiktok: "https://tiktok.com/",
  siteName: "Flow Urban"
};

const $ = (q) => document.querySelector(q);

const els = {
  q: $("#q"),
  category: $("#category"),
  sort: $("#sort"),
  clearFilters: $("#clearFilters"),
  countText: $("#countText"),
  grid: $("#grid"),

  cartBtn: $("#cartBtn"),
  cartCount: $("#cartCount"),
  drawer: $("#drawer"),
  drawerClose: $("#drawerClose"),
  drawerBackdrop: $("#drawerBackdrop"),
  cartItems: $("#cartItems"),
  cartTotal: $("#cartTotal"),
  checkoutBtn: $("#checkoutBtn"),

  waBtnMain: $("#waBtnMain"),
  waFloat: $("#waFloat"),
  waNumber1Text: $("#waNumber1Text"),
  waNumber2Text: $("#waNumber2Text"),
  waLink1: $("#waLink1"),
  waLink2: $("#waLink2"),
  igLink: $("#igLink"),
  ttLink: $("#ttLink"),

  loader: $("#loader"),
  loaderFill: $("#loaderFill"),
};

const LS_KEY = "flowUrbanCart_v1";

const state = {
  filters: { q: "", category: "Todas", sort: "featured" },
  cart: loadCart(),
};

function money(n){
  try{
    return new Intl.NumberFormat("es-EC", { style:"currency", currency: STORE.currency }).format(n);
  }catch{
    return `$${Number(n).toFixed(2)}`;
  }
}

function saveCart(){ localStorage.setItem(LS_KEY, JSON.stringify(state.cart)); }
function loadCart(){
  try{ return JSON.parse(localStorage.getItem(LS_KEY)) || []; }
  catch{ return []; }
}

function cartCount(){
  return state.cart.reduce((a,i)=>a+i.qty,0);
}
function cartTotal(){
  return state.cart.reduce((a,i)=>a+(i.price*i.qty),0);
}

/* LOADER */
function hideLoader(){
  if(!els.loader) return;
  els.loader.classList.add("loader--hide");
}
function bootLoader(){
  // solo animación visual; tu catálogo igual carga rápido
  setTimeout(hideLoader, 1200);
}

/* LINKS */
function waLink(number, text){
  const msg = encodeURIComponent(text);
  return `https://wa.me/${number}?text=${msg}`;
}
function openWhatsApp(text){
  window.open(waLink(STORE.whatsapp1, text), "_blank");
}

/* FILTERS */
function categoriesFromProducts(){
  const set = new Set(["Todas"]);
  PRODUCTS.forEach(p=> set.add(p.category));
  return [...set];
}

function applyFilters(){
  let list = [...PRODUCTS];

  const q = (state.filters.q || "").toLowerCase().trim();
  if(q){
    list = list.filter(p =>
      (p.name||"").toLowerCase().includes(q) ||
      (p.category||"").toLowerCase().includes(q)
    );
  }

  if(state.filters.category && state.filters.category !== "Todas"){
    list = list.filter(p => p.category === state.filters.category);
  }

  const s = state.filters.sort;
  if(s === "priceAsc") list.sort((a,b)=> (a.price||0)-(b.price||0));
  if(s === "priceDesc") list.sort((a,b)=> (b.price||0)-(a.price||0));
  if(s === "nameAsc") list.sort((a,b)=> (a.name||"").localeCompare(b.name||""));

  return list;
}

/* RENDER */
function renderGrid(){
  const list = applyFilters();
  els.countText.textContent = `${list.length} productos`;

  els.grid.innerHTML = list.map(p => {
    const sizes = (p.sizes||[]).map(s=> `<span class="size">${s}</span>`).join("");
    const badge = p.badge ? `<div class="badge">${p.badge}</div>` : "";
    return `
      <article class="card">
        <img class="card__img" src="${p.image}" alt="${p.name}"
          onerror="this.onerror=null; this.src=''; this.style.background='#d9d9d9';" />
        <div class="card__title">${p.name}</div>
        <div class="card__cat">${p.category || ""}</div>
        <div class="card__price">${money(p.price || 0)}</div>
        ${badge}
        <div class="sizes">${sizes}</div>

        <div class="card__actions">
          <button class="smallbtn smallbtn--ghost" data-view="${p.id}">Ver</button>
          <button class="smallbtn" data-add="${p.id}">Agregar</button>
        </div>
      </article>
    `;
  }).join("");

  els.grid.querySelectorAll("[data-add]").forEach(btn=>{
    btn.addEventListener("click", ()=> addToCart(btn.getAttribute("data-add")));
  });
  els.grid.querySelectorAll("[data-view]").forEach(btn=>{
    btn.addEventListener("click", ()=> viewProduct(btn.getAttribute("data-view")));
  });
}

function viewProduct(id){
  const p = PRODUCTS.find(x=> String(x.id)===String(id));
  if(!p) return;
  const msg = `Hola! Quiero info de: ${p.name} (${money(p.price)})`;
  openWhatsApp(msg);
}

/* CART */
function addToCart(id){
  const p = PRODUCTS.find(x=> String(x.id)===String(id));
  if(!p) return;
  const found = state.cart.find(i=> String(i.id)===String(id));
  if(found) found.qty += 1;
  else state.cart.push({ id: p.id, name: p.name, price: p.price, qty: 1 });
  saveCart();
  renderCart();
}

function removeFromCart(id){
  state.cart = state.cart.filter(i=> String(i.id)!==String(id));
  saveCart();
  renderCart();
}
function changeQty(id, delta){
  const it = state.cart.find(i=> String(i.id)===String(id));
  if(!it) return;
  it.qty += delta;
  if(it.qty <= 0) removeFromCart(id);
  saveCart();
  renderCart();
}

function renderCart(){
  els.cartCount.textContent = cartCount();
  els.cartTotal.textContent = money(cartTotal());

  if(state.cart.length === 0){
    els.cartItems.innerHTML = `<p style="color:#666;margin:0;">Tu carrito está vacío.</p>`;
    return;
  }

  els.cartItems.innerHTML = state.cart.map(i=> `
    <div style="display:flex;justify-content:space-between;gap:10px;align-items:center;margin-bottom:10px;">
      <div>
        <div style="font-weight:900;">${i.name}</div>
        <div style="color:#666;font-size:13px;">${money(i.price)} x ${i.qty}</div>
      </div>
      <div style="display:flex;gap:6px;align-items:center;">
        <button class="smallbtn smallbtn--ghost" data-dec="${i.id}" style="padding:10px 12px;">-</button>
        <button class="smallbtn smallbtn--ghost" data-inc="${i.id}" style="padding:10px 12px;">+</button>
        <button class="smallbtn" data-del="${i.id}" style="padding:10px 12px;">✕</button>
      </div>
    </div>
  `).join("");

  els.cartItems.querySelectorAll("[data-dec]").forEach(b=> b.onclick=()=>changeQty(b.getAttribute("data-dec"), -1));
  els.cartItems.querySelectorAll("[data-inc]").forEach(b=> b.onclick=()=>changeQty(b.getAttribute("data-inc"), +1));
  els.cartItems.querySelectorAll("[data-del]").forEach(b=> b.onclick=()=>removeFromCart(b.getAttribute("data-del")));
}

function openDrawer(){
  els.drawer.classList.add("drawer--open");
  els.drawer.setAttribute("aria-hidden","false");
}
function closeDrawer(){
  els.drawer.classList.remove("drawer--open");
  els.drawer.setAttribute("aria-hidden","true");
}

/* INIT */
function init(){
  // loader visual
  bootLoader();

  // categories
  els.category.innerHTML = categoriesFromProducts().map(c=> `<option value="${c}">${c}</option>`).join("");

  // links contacto
  els.waNumber1Text.textContent = STORE.whatsapp1;
  els.waNumber2Text.textContent = STORE.whatsapp2;
  els.waLink1.href = waLink(STORE.whatsapp1, "Hola! Quiero hacer un pedido.");
  els.waLink2.href = waLink(STORE.whatsapp2, "Hola! Quiero hacer un pedido.");
  els.waFloat.href = waLink(STORE.whatsapp1, "Hola! Quiero hacer un pedido.");

  els.igLink.href = STORE.instagram;
  els.ttLink.href = STORE.tiktok;

  // events
  els.q.addEventListener("input", (e)=>{ state.filters.q = e.target.value; renderGrid(); });
  els.category.addEventListener("change", (e)=>{ state.filters.category = e.target.value; renderGrid(); });
  els.sort.addEventListener("change", (e)=>{ state.filters.sort = e.target.value; renderGrid(); });

  els.clearFilters.addEventListener("click", ()=>{
    state.filters = { q:"", category:"Todas", sort:"featured" };
    els.q.value = "";
    els.category.value = "Todas";
    els.sort.value = "featured";
    renderGrid();
  });

  els.cartBtn.addEventListener("click", openDrawer);
  els.drawerClose.addEventListener("click", closeDrawer);
  els.drawerBackdrop.addEventListener("click", closeDrawer);

  els.waBtnMain.addEventListener("click", ()=> openWhatsApp("Hola! Quiero hablar con ustedes."));

  els.checkoutBtn.addEventListener("click", ()=>{
    if(state.cart.length === 0){
      openWhatsApp("Hola! Quiero información.");
      return;
    }
    const lines = state.cart.map(i=> `- ${i.name} x${i.qty} (${money(i.price*i.qty)})`).join("\n");
    const total = money(cartTotal());
    openWhatsApp(`Hola! Quiero pedir:\n${lines}\n\nTotal: ${total}`);
  });

  renderGrid();
  renderCart();
}

document.addEventListener("DOMContentLoaded", init);
