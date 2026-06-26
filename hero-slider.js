(() => {
  const slides = [
    'assets/hero.jpg?v=6',
    'assets/SmartSelect_20260625_142913_ChatGPT.jpg?v=2'
  ];

  let current = 0;
  let started = false;

  const isDesktop = () => window.innerWidth >= 900;

  const fitHero = (hero) => {
    hero.style.objectFit = isDesktop() ? 'cover' : 'cover';
    hero.style.objectPosition = isDesktop() ? 'center center' : 'center top';
    hero.style.background = '#0b0b0f';
  };

  const hideLoader = () => {
    const loader = document.getElementById('loader');
    if (!loader) return;
    loader.style.display = 'none';
    loader.style.opacity = '0';
    loader.style.visibility = 'hidden';
    loader.setAttribute('aria-hidden', 'true');
  };

  const tuneImages = () => {
    document.querySelectorAll('img').forEach((img) => {
      if (img.classList.contains('hero__img') || img.id === 'brandLogo') return;
      img.loading = 'lazy';
      img.decoding = 'async';
    });
  };

  const setupExtras = () => {
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
    const title = women ? 'MAQUILLAJE' : 'GORRAS';
    const sub = women ? 'Beauty drops para completar tu outfit con flow.' : 'Gorras urbanas para completar tu estilo.';
    const emoji = women ? '💄' : '🧢';
    const img = women ? 'assets/logo-women.png' : 'assets/logo.png';
    const items = women
      ? [['Set Maquillaje Glow', '$6,00', 'Beauty, Mujer'], ['Labial Urban Glam', '$3,50', 'Makeup, Glow']]
      : [['Gorra Flow Urban', '$5,00', 'Cap, Streetwear'], ['Gorra Negra Premium', '$7,00', 'Premium, Urban']];

    sec.innerHTML = `
      <div class="flowExtrasHead">
        <span>${emoji} NUEVA SECCIÓN</span>
        <h2>${title}</h2>
        <p>${sub}</p>
      </div>
      <div class="flowExtrasGrid">
        ${items.map((it) => `
          <article class="flowExtraCard">
            <div class="flowExtraTag">${it[2]}</div>
            <div class="flowExtraImg"><img src="${img}" alt="${it[0]}" loading="lazy"></div>
            <h3>${it[0]}</h3>
            <strong>${it[1]}</strong>
            <a href="#contacto">PEDIR</a>
          </article>
        `).join('')}
      </div>`;
  };

  const injectExtrasCSS = () => {
    if (document.getElementById('flowExtrasCSS')) return;
    const s = document.createElement('style');
    s.id = 'flowExtrasCSS';
    s.textContent = `
      .flowExtras{width:min(1220px,calc(100% - 24px));margin:30px auto!important;padding:0!important;}
      .flowExtrasHead{padding:24px 18px;border-radius:28px;background:linear-gradient(135deg,rgba(17,17,24,.96),rgba(236,72,153,.22),rgba(139,92,246,.20));border:1px solid rgba(255,242,189,.28);box-shadow:0 16px 36px rgba(0,0,0,.16)}
      .flowExtrasHead span{display:inline-block;padding:9px 13px;border-radius:999px;background:linear-gradient(135deg,#8b5cf6,#ec4899);color:#fff;font-weight:1000;font-size:.78rem;letter-spacing:.09em}.flowExtrasHead h2{margin:12px 0 0;color:#fff;font-size:clamp(2.7rem,9vw,6rem);line-height:.86;letter-spacing:-.08em}.flowExtrasHead p{margin:10px 0 0;color:#fff2bd;font-weight:800}.flowExtrasGrid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:18px;margin-top:18px}.flowExtraCard{position:relative;border-radius:28px;background:linear-gradient(180deg,#fff,rgba(255,255,255,.78));padding:16px;box-shadow:0 16px 34px rgba(0,0,0,.12);overflow:hidden}.flowExtraTag{position:absolute;top:16px;left:16px;padding:9px 12px;border-radius:999px;background:linear-gradient(135deg,#8b5cf6,#ec4899);color:#fff;font-size:.72rem;font-weight:1000;letter-spacing:.08em}.flowExtraImg{height:220px;display:grid;place-items:center;border-radius:22px;background:linear-gradient(135deg,#f7f2ff,#fff)}.flowExtraImg img{width:76%;height:76%;object-fit:contain}.flowExtraCard h3{margin:14px 0 4px;color:#17111f;font-weight:1000}.flowExtraCard strong{display:block;color:#8b5cf6;font-size:1.15rem}.flowExtraCard a{display:inline-block;margin-top:12px;padding:12px 20px;border-radius:999px;background:linear-gradient(135deg,#8b5cf6,#ec4899);color:#fff;text-decoration:none;font-weight:1000;letter-spacing:.08em}@media(max-width:720px){.flowExtrasGrid{grid-template-columns:1fr}.flowExtraImg{height:210px}.flowExtras{width:calc(100% - 18px)}}
    `;
    document.head.appendChild(s);
  };

  const setupHero = () => {
    const hero = document.querySelector('.hero__img');
    if (!hero) return;

    document.querySelectorAll('.hero-continuation').forEach((el) => el.remove());

    hero.loading = 'eager';
    hero.decoding = 'async';
    hero.fetchPriority = 'high';
    hero.style.opacity = '1';
    hero.style.transform = 'none';
    hero.style.filter = 'none';
    hero.style.imageRendering = 'auto';
    fitHero(hero);
    hero.src = slides[current];

    if (started) return;
    started = true;

    setTimeout(() => {
      const preload = new Image();
      preload.src = slides[1];
    }, 1200);

    setInterval(() => {
      current = (current + 1) % slides.length;
      hero.style.transition = 'opacity .35s ease';
      hero.style.opacity = '0.35';

      setTimeout(() => {
        hero.src = slides[current];
        fitHero(hero);
        hero.style.opacity = '1';
      }, 180);
    }, 4200);
  };

  const boot = () => {
    hideLoader();
    setupHero();
    tuneImages();
    injectExtrasCSS();
    setupExtras();
    document.getElementById('btnWomen')?.addEventListener('click', () => setTimeout(setupExtras, 120));
    document.getElementById('btnMen')?.addEventListener('click', () => setTimeout(setupExtras, 120));
  };

  boot();
  document.addEventListener('DOMContentLoaded', boot, { once: true });
  window.addEventListener('load', boot, { once: true });

  window.addEventListener('resize', () => {
    const hero = document.querySelector('.hero__img');
    if (hero) fitHero(hero);
  });
})();
