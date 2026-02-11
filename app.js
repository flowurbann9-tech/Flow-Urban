import { STORE, PRODUCTS } from "./products.js";

const $ = (sel) => document.querySelector(sel);

const els = {
  year: $("#year"),
  grid: $("#grid"),
  q: $("#q"),
  category: $("#category"),
  sort: $("#sort"),
  clearFilters: $("#clearFilters"),
  resultsCount: $("#resultsCount"),

  openCartBtn: $("#openCartBtn"),
  cartDrawer: $("#cartDrawer"),
  cartCount: $("#cartCount"),
  cartItems: $("#cartItems"),
  subtotal: $("#subtotal"),
  shipping: $("#shipping"),
  total: $("#total"),
  clearCart: $("#clearCart"),

  checkoutForm: $("#checkoutForm"),
  cName: $("#cName"),
  cPhone: $("#cPhone"),
  cAddress: $("#cAddress"),
  cNotes: $("#cNotes"),

  productModal: $("#productModal"),
  pmImg: $("#pmImg"),
  pmBadge: $("#pmBadge"),
  pmCat: $("#pmCat"),
  pmTitle: $("#pmTitle"),
  pmDesc: $("#pmDesc"),
  pmPrice: $("#pmPrice"),
  pmSku: $("#pmSku"),
  pmSize: $("#pmSize"),
  pmQty: $("#pmQty"),
  pmAdd: $("#pmAdd"),

  toast: $("#toast"),

  waHint: $("#waHint"),
  waLink1: $("#waLink1"),
  waLink2: $("#waLink2"),
  igLink: $("#igLink"),
  ttLink: $("#ttLink"),
};

const LS_KEY = "flowUrbanCart_v1";

const state = {
  filters: { q: "", category: "Todas", sort: "featured" },
  cart: loadCart(),
  activeProduct: null,
};

function money(n){
  try{
    return new Intl.NumberFormat("es-EC", { style:"currency", currency: STORE.currency }).format(n);
  }catch{
    return `$${Number(n).toFixed(2)}`;
  }
}

function toast(msg){
  els.toast.textContent = msg;
  els.toast.classList.add("show");
  clearTimeout(toast._t);
  toast._t = setTimeout(()=> els.toast.classList.remove("show"), 2200);
}

function saveCart(){
  localStorage.setItem(LS_KEY, JSON.stringify(state.cart));
  updateCartUI();
}
function loadCart(){
  try{
    const raw = localStorage.getItem(LS_KEY);
    return raw ? JSON.parse(raw) : [];
  }catch{ return []; }
}

function cartCount(){ return state.cart.reduce((a,i)=>a+i.qty,0); }
function cartTotals(){
  const subtotal = state.cart.reduce((a,i)=>a+i.price*i.qty,0);
  const shipping = Number(STORE.shippingFlat||0);
  const total = subtotal + shipping;
  return { subtotal, shipping, total };
}

function openDrawer(){ els.cartDrawer.setAttribute("aria-hidden","false"); document.body.style.overflow="hidden"; }
function closeDrawer(){ els.cartDrawer.setAttribute("aria-hidden","true"); document.body.style.overflow=""; }
function openModal(){ els.productModal.setAttribute("aria-hidden","false"); document.body.style.overflow="hidden"; }
function closeModal(){ els.productModal.setAttribute("aria-hidden","true"); document.body.style.overflow=""; }

function setupCloseHandlers(){
  els.cartDrawer.addEventListener("click",(e)=>{ if(e.target?.dataset?.close==="true") closeDrawer(); });
  els.productModal.addEventListener("click",(e)=>{ if(e.target?.dataset?.close==="true") closeModal(); });
  window.addEventListener("keydown",(e)=>{ if(e.key==="Escape"){ closeModal(); closeDrawer(); }});
}

function categories(){
  const cats=[...new Set(PRODUCTS.map(p=>p.category))];
  return ["Todas", ...cats];
}

function filteredProducts(){
  const {q,category,sort}=state.filters;
  let list=[...PRODUCTS];

  if(category!=="Todas") list=list.filter(p=>p.category===category);

  if(q.trim()){
    const qq=q.trim().toLowerCase();
    list=list.filter(p=>
      (p.name||"").toLowerCase().includes(qq) ||
      (p.desc||"").toLowerCase().includes(qq) ||
      (p.category||"").toLowerCase().includes(qq) ||
      (p.id||"").toLowerCase().includes(qq)
    );
  }

  switch(sort){
    case "price_asc": list.sort((a,b)=>a.price-b.price); break;
    case "price_desc": list.sort((a,b)=>b.price-a.price); break;
    case "name_asc": list.sort((a,b)=>(a.name||"").localeCompare(b.name||"")); break;
    default: break;
  }
  return list;
}

function renderCategorySelect(){
  els.category.innerHTML = categories().map(c=>`<option value="${escapeAttr(c)}">${escapeHtml(c)}</option>`).join("");
  els.category.value = state.filters.category;
}

function renderGrid(){
  const list=filteredProducts();
  els.resultsCount.textContent=String(list.length);

  if(list.length===0){
    els.grid.innerHTML = `
      <div class="infoCard" style="grid-column:1/-1;">
        <h3>No encontramos productos 😅</h3>
        <p class="muted">Prueba con otra palabra o cambia la categoría.</p>
      </div>`;
    return;
  }

  els.grid.innerHTML = list.map(p=>`
    <article class="card">
      <img class="card__img" src="${escapeAttr(p.image)}" alt="${escapeAttr(p.name)}"
           onerror="this.removeAttribute('src'); this.style.background='rgba(0,0,0,.25)';">
      <div class="card__body">
        <div class="card__top">
          <div>
            <h3 class="card__title">${escapeHtml(p.name)}</h3>
            <div class="card__cat">${escapeHtml(p.category)}</div>
          </div>
          <div class="card__price">${money(p.price)}</div>
        </div>

        <div style="display:flex; gap:8px; flex-wrap:wrap;">
          ${p.badge ? `<span class="badge">${escapeHtml(p.badge)}</span>` : ""}
          <span class="badge">Tallas: ${escapeHtml((p.sizes||[]).join(", "))}</span>
        </div>

        <div class="card__actions">
          <button class="btn btn--ghost btn--small" data-view="${escapeAttr(p.id)}">Ver</button>
          <button class="btn btn--primary btn--small" data-add="${escapeAttr(p.id)}">Agregar</button>
        </div>
      </div>
    </article>
  `).join("");

  els.grid.querySelectorAll("[data-view]").forEach(btn=>{
    btn.addEventListener("click", ()=>{
      const id=btn.getAttribute("data-view");
      showProduct(PRODUCTS.find(p=>p.id===id));
    });
  });
  els.grid.querySelectorAll("[data-add]").forEach(btn=>{
    btn.addEventListener("click", ()=>{
      const id=btn.getAttribute("data-add");
      showProduct(PRODUCTS.find(p=>p.id===id));
    });
  });
}

function showProduct(product){
  if(!product) return;
  state.activeProduct=product;

  els.pmImg.src=product.image||"";
  els.pmImg.alt=product.name||"Producto";
  els.pmBadge.textContent=product.badge||"";
  els.pmBadge.style.display = product.badge ? "inline-flex" : "none";
  els.pmCat.textContent=product.category||"";
  els.pmTitle.textContent=product.name||"";
  els.pmDesc.textContent=product.desc||"";
  els.pmPrice.textContent=money(product.price);
  els.pmSku.textContent=`SKU: ${product.id}`;

  const sizes = product.sizes?.length ? product.sizes : ["Única"];
  els.pmSize.innerHTML = sizes.map(s=>`<option value="${escapeAttr(s)}">${escapeHtml(s)}</option>`).join("");
  els.pmQty.value="1";
  openModal();
}

function addToCart(product,size,qty){
  const key=`${product.id}__${size}`;
  const existing=state.cart.find(i=>i.key===key);
  if(existing) existing.qty += qty;
  else state.cart.push({ key, id:product.id, name:product.name, price:product.price, size, qty, image:product.image, category:product.category });
  saveCart();
  toast("Agregado al carrito ✅");
}

function updateCartUI(){
  els.cartCount.textContent=String(cartCount());
  const {subtotal,shipping,total}=cartTotals();
  els.subtotal.textContent=money(subtotal);
  els.shipping.textContent = STORE.shippingFlat ? money(shipping) : "A confirmar";
  els.total.textContent=money(total);

  if(state.cart.length===0){
    els.cartItems.innerHTML = `
      <div class="infoCard">
        <h3>Tu carrito está vacío</h3>
        <p class="muted">Agrega productos desde el catálogo.</p>
      </div>`;
    return;
  }

  els.cartItems.innerHTML = state.cart.map(item=>`
    <div class="cartItem">
      <img class="cartItem__img" src="${escapeAttr(item.image)}" alt="${escapeAttr(item.name)}"
           onerror="this.removeAttribute('src'); this.style.background='rgba(0,0,0,.25)';">
      <div>
        <p class="cartItem__title">${escapeHtml(item.name)}</p>
        <div class="cartItem__meta">
          <span>${escapeHtml(item.category||"")}</span><span>•</span>
          <span>Talla: <strong>${escapeHtml(item.size)}</strong></span>
        </div>

        <div class="cartItem__bottom">
          <div class="qty">
            <button class="iconBtn" data-dec="${escapeAttr(item.key)}" aria-label="Disminuir">−</button>
            <strong>${item.qty}</strong>
            <button class="iconBtn" data-inc="${escapeAttr(item.key)}" aria-label="Aumentar">+</button>
          </div>

          <div style="display:flex; gap:8px; align-items:center;">
            <strong>${money(item.price*item.qty)}</strong>
            <button class="iconBtn iconBtn--danger" data-rm="${escapeAttr(item.key)}" aria-label="Eliminar">🗑</button>
          </div>
        </div>
      </div>
    </div>
  `).join("");

  els.cartItems.querySelectorAll("[data-inc]").forEach(btn=>{
    btn.addEventListener("click", ()=>{
      const key=btn.getAttribute("data-inc");
      const item=state.cart.find(i=>i.key===key);
      if(!item) return;
      item.qty += 1;
      saveCart();
    });
  });
  els.cartItems.querySelectorAll("[data-dec]").forEach(btn=>{
    btn.addEventListener("click", ()=>{
      const key=btn.getAttribute("data-dec");
      const item=state.cart.find(i=>i.key===key);
      if(!item) return;
      item.qty -= 1;
      if(item.qty<=0) state.cart = state.cart.filter(i=>i.key!==key);
      saveCart();
    });
  });
  els.cartItems.querySelectorAll("[data-rm]").forEach(btn=>{
    btn.addEventListener("click", ()=>{
      const key=btn.getAttribute("data-rm");
      state.cart = state.cart.filter(i=>i.key!==key);
      saveCart();
      toast("Producto eliminado");
    });
  });
}

function buildWhatsAppOrderMessage(customer){
  const lines=[];
  lines.push(`Hola ${STORE.name} 👋`);
  lines.push(`Quiero hacer un pedido:`);
  lines.push("");

  state.cart.forEach(item=>{
    lines.push(`• ${item.qty}x ${item.name} (Talla: ${item.size}) — ${money(item.price*item.qty)}`);
  });

  const {subtotal,shipping,total}=cartTotals();
  lines.push("");
  lines.push(`Subtotal: ${money(subtotal)}`);
  lines.push(`Envío: ${STORE.shippingFlat ? money(shipping) : "A confirmar"}`);
  lines.push(`Total: ${money(total)}`);
  lines.push("");
  lines.push(`Datos del cliente:`);
  lines.push(`Nombre: ${customer.name}`);
  lines.push(`Teléfono: ${customer.phone}`);
  lines.push(`Dirección: ${customer.address}`);
  if(customer.notes?.trim()) lines.push(`Notas: ${customer.notes.trim()}`);

  return lines.join("\n");
}

function openWhatsApp(message){
  if(!STORE.whatsappSales1){
    toast("No está configurado el WhatsApp Ventas 1");
    return;
  }
  const url = `https://wa.me/${STORE.whatsappSales1}?text=${encodeURIComponent(message)}`;
  window.open(url, "_blank", "noopener");
}

function wireUI(){
  els.year.textContent=String(new Date().getFullYear());

  els.waLink1.href = STORE.whatsappSales1 ? `https://wa.me/${STORE.whatsappSales1}` : "#";
  els.waLink2.href = STORE.whatsappSales2 ? `https://wa.me/${STORE.whatsappSales2}` : "#";

  els.igLink.href = STORE.instagram || "#";
  els.ttLink.href = STORE.tiktok || "#";

  els.waHint.textContent = `Ventas 1: ${STORE.whatsappSales1} | Ventas 2: ${STORE.whatsappSales2}`;

  els.q.addEventListener("input", ()=>{ state.filters.q=els.q.value; renderGrid(); });
  els.category.addEventListener("change", ()=>{ state.filters.category=els.category.value; renderGrid(); });
  els.sort.addEventListener("change", ()=>{ state.filters.sort=els.sort.value; renderGrid(); });
  els.clearFilters.addEventListener("click", ()=>{
    state.filters={q:"",category:"Todas",sort:"featured"};
    els.q.value=""; els.category.value="Todas"; els.sort.value="featured";
    renderGrid();
  });

  els.openCartBtn.addEventListener("click", openDrawer);

  els.pmAdd.addEventListener("click", ()=>{
    const product=state.activeProduct;
    if(!product) return;
    const size=els.pmSize.value || (product.sizes?.[0] || "Única");
    const qty=Math.max(1, Number(els.pmQty.value||1));
    addToCart(product,size,qty);
    closeModal(); openDrawer();
  });

  els.clearCart.addEventListener("click", ()=>{
    state.cart=[]; saveCart(); toast("Carrito vacío");
  });

  els.checkoutForm.addEventListener("submit", (e)=>{
    e.preventDefault();
    if(state.cart.length===0){ toast("Agrega productos primero"); return; }
    const customer={
      name:els.cName.value.trim(),
      phone:els.cPhone.value.trim(),
      address:els.cAddress.value.trim(),
      notes:els.cNotes.value.trim()
    };
    if(!customer.name || !customer.phone || !customer.address){ toast("Completa tus datos"); return; }
    openWhatsApp(buildWhatsAppOrderMessage(customer));
  });
}

function escapeHtml(s){
  return String(s??"")
    .replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;")
    .replaceAll('"',"&quot;").replaceAll("'","&#039;");
}
function escapeAttr(s){ return escapeHtml(s); }

function init(){
  renderCategorySelect();
  setupCloseHandlers();
  wireUI();
  renderGrid();
  updateCartUI();
}
init();
