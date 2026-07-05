(() => {
  const slides = ['assets/hero.jpg?v=6','assets/SmartSelect_20260625_142913_ChatGPT.jpg?v=2'];
  let current = 0;
  let started = false;

  const loadPremium = () => {
    if (document.getElementById('ultraPremiumCSS')) return;
    const link = document.createElement('link');
    link.id = 'ultraPremiumCSS';
    link.rel = 'stylesheet';
    link.href = 'ultra-premium.css?v=1';
    document.head.appendChild(link);
  };

  const hideLoader = () => {
    const loader = document.getElementById('loader');
    if (!loader) return;
    loader.style.display = 'none';
    loader.style.opacity = '0';
    loader.style.visibility = 'hidden';
    loader.setAttribute('aria-hidden','true');
  };

  const fitHero = () => {
    const hero = document.querySelector('.hero__img');
    if (!hero) return;
    hero.loading = 'eager';
    hero.decoding = 'async';
    hero.fetchPriority = 'high';
    hero.style.objectFit = 'cover';
    hero.style.objectPosition = window.innerWidth >= 900 ? 'center center' : 'center top';
    hero.style.opacity = '1';
    hero.style.transform = 'none';
    hero.style.filter = 'none';
    return hero;
  };

  const tuneImages = () => {
    document.querySelectorAll('img').forEach((img) => {
      if (img.classList.contains('hero__img') || img.id === 'brandLogo') return;
      img.loading = 'lazy';
      img.decoding = 'async';
    });
  };

  const injectExtras = () => {
    if (!document.getElementById('flowExtrasMiniCSS')) {
      const st = document.createElement('style');
      st.id = 'flowExtrasMiniCSS';
      st.textContent = `.flowExtras{width:min(1220px,calc(100% - 24px));margin:32px auto!important;padding:0!important}.flowExtrasHead{padding:24px 18px;border-radius:30px;background:linear-gradient(135deg,#111118,#8b5cf633,#ec489933);border:1px solid #fff2bd55;box-shadow:0 18px 38px #0002}.flowExtrasHead span{display:inline-block;padding:9px 13px;border-radius:999px;background:linear-gradient(135deg,#8b5cf6,#ec4899);color:#fff;font-weight:1000}.flowExtrasHead h2{margin:12px 0 0;color:#fff;font-size:clamp(2.8rem,9vw,6rem);line-height:.86;letter-spacing:-.08em}.flowExtrasHead p{color:#fff2bd;font-weight:800}.flowExtrasGrid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:18px;margin-top:18px}.flowExtraCard{position:relative;min-height:238px;border-radius:28px;background:linear-gradient(180deg,#fff,#fff9);padding:18px;display:flex;flex-direction:column;justify-content:flex-end;box-shadow:0 18px 36px #0002;overflow:hidden}.flowExtraCard:before{content:"";position:absolute;inset:0;background:radial-gradient(circle at 70% 15%,#ec489933,transparent 40%),radial-gradient(circle at 10% 20%,#8b5cf633,transparent 38%)}.flowExtraTag,.flowExtraIcon,.flowExtraCard h3,.flowExtraCard strong,.flowExtraCard a{position:relative;z-index:1}.flowExtraTag{position:absolute;top:16px;left:16px;padding:9px 12px;border-radius:999px;background:linear-gradient(135deg,#8b5cf6,#ec4899);color:#fff;font-size:.72rem;font-weight:1000}.flowExtraIcon{height:105px;display:grid;place-items:center;border-radius:24px;background:linear-gradient(135deg,#f7f2ff,#fff);font-size:4rem;margin:36px 0 10px}.flowExtraCard h3{margin:8px 0 4px;color:#17111f;font-weight:1000;font-size:1.25rem}.flowExtraCard strong{color:#8b5cf6;font-size:1.25rem}.flowExtraCard a{width:max-content;margin-top:12px;padding:12px 22px;border-radius:999px;background:linear-gradient(135deg,#8b5cf6,#ec4899);color:#fff;text-decoration:none;font-weight:1000}@media(max-width:720px){.flowExtras{width:calc(100% - 18px)}.flowExtrasGrid{grid-template-columns:1fr}.flowExtraCard{min-height:230px}}`;
      document.head.appendChild(st);
    }

    const catalogo = document.getElementById('catalogo');
    if (!catalogo) return;
    let sec = document.getElementById('flowExtras');
    if (!sec) {
      sec = document.createElement('section');
      sec.id = 'flowExtras';
      sec.className = 'section flowExtras';
      catalogo.insertAdjacentElement('afterend', sec);
    }

    const women = document.body.classList.contains('theme-women');
    const data = women
      ? ['💄','MAQUILLAJE','Beauty drops para completar tu outfit con flow.',[['Set Maquillaje Glow','$6,00','Beauty, Mujer','💋'],['Labial Urban Glam','$3,50','Makeup, Glow','💄']]]
      : ['🧢','GORRAS','Gorras urbanas para completar tu estilo.',[['Gorra Flow Urban','$5,00','Cap, Streetwear','🧢'],['Gorra Negra Premium','$7,00','Premium, Urban','🖤']]];

    sec.innerHTML = `<div class="flowExtrasHead"><span>${data[0]} NUEVA SECCIÓN</span><h2>${data[1]}</h2><p>${data[2]}</p></div><div class="flowExtrasGrid">${data[3].map((it)=>`<article class="flowExtraCard"><div class="flowExtraTag">${it[2]}</div><div class="flowExtraIcon">${it[3]}</div><h3>${it[0]}</h3><strong>${it[1]}</strong><a href="#contacto">PEDIR</a></article>`).join('')}</div>`;
  };

  const startHero = () => {
    const hero = fitHero();
    if (!hero || started) return;
    started = true;
    hero.src = slides[current];
    setTimeout(() => { const img = new Image(); img.src = slides[1]; }, 900);
    setInterval(() => {
      current = (current + 1) % slides.length;
      hero.style.transition = 'opacity .35s ease';
      hero.style.opacity = '.35';
      setTimeout(() => { hero.src = slides[current]; fitHero(); hero.style.opacity = '1'; }, 180);
    }, 4200);
  };

  const boot = () => {
    loadPremium();
    hideLoader();
    startHero();
    tuneImages();
    injectExtras();
    document.getElementById('btnWomen')?.addEventListener('click', () => setTimeout(injectExtras, 120));
    document.getElementById('btnMen')?.addEventListener('click', () => setTimeout(injectExtras, 120));
  };

  boot();
  document.addEventListener('DOMContentLoaded', boot, { once:true });
  window.addEventListener('load', boot, { once:true });
  window.addEventListener('resize', fitHero);
})();
