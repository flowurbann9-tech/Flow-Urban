(() => {
  const slides = ['assets/hero.jpg?v=6','assets/SmartSelect_20260625_142913_ChatGPT.jpg?v=2'];
  let current = 0;
  let started = false;

  const loadPremium = () => {
    if (!document.getElementById('ultraPremiumCSS')) {
      const link = document.createElement('link');
      link.id = 'ultraPremiumCSS';
      link.rel = 'stylesheet';
      link.href = 'ultra-premium.css?v=2';
      document.head.appendChild(link);
    }
    if (!document.getElementById('wixAnimationsCSS')) {
      const anim = document.createElement('link');
      anim.id = 'wixAnimationsCSS';
      anim.rel = 'stylesheet';
      anim.href = 'wix-animations.css?v=2';
      document.head.appendChild(anim);
    }
    if (!document.getElementById('modalFixCSS')) {
      const modal = document.createElement('link');
      modal.id = 'modalFixCSS';
      modal.rel = 'stylesheet';
      modal.href = 'product-modal-fix.css?v=4';
      document.head.appendChild(modal);
    }
    if (!document.getElementById('oldModalFixCSS')) {
      const modal2 = document.createElement('link');
      modal2.id = 'oldModalFixCSS';
      modal2.rel = 'stylesheet';
      modal2.href = 'modal-fix.css?v=4';
      document.head.appendChild(modal2);
    }
  };

  const hideLoader = () => {
    const loader = document.getElementById('loader');
    if (!loader) return;
    loader.style.display = 'none';
    loader.style.opacity = '0';
    loader.style.visibility = 'hidden';
    loader.setAttribute('aria-hidden','true');
  };

  const closeProductModal = () => {
    const modal = document.getElementById('pModal');
    if (!modal) return;
    modal.setAttribute('aria-hidden','true');
    modal.style.setProperty('display','none','important');
    document.body.classList.remove('pmodalOpen');
  };

  const fitHero = () => {
    const hero = document.querySelector('.hero__img');
    if (!hero) return;
    const wrap = hero.closest('.hero');
    hero.loading = 'eager';
    hero.decoding = 'async';
    hero.fetchPriority = 'high';
    hero.style.setProperty('object-fit','cover','important');
    hero.style.setProperty('object-position','center top','important');
    hero.style.opacity = '1';
    hero.style.transform = 'none';
    hero.style.filter = 'none';
    hero.style.background = 'transparent';
    if (wrap) {
      wrap.style.backgroundColor = 'transparent';
      wrap.style.backgroundImage = 'none';
      wrap.style.backgroundSize = 'cover';
      wrap.style.backgroundPosition = 'center top';
      wrap.style.backgroundRepeat = 'no-repeat';
    }
    return hero;
  };

  const fixProductModal = () => {
    const modal = document.getElementById('pModal');
    if (!modal) return;
    const card = modal.querySelector('.pmodal__card');
    const slider = modal.querySelector('#pSlider,.pslider');
    const track = modal.querySelector('#pSliderTrack,.pslider__track');
    if (modal.getAttribute('aria-hidden') === 'false') {
      modal.style.setProperty('display','flex','important');
      modal.style.setProperty('align-items','center','important');
      modal.style.setProperty('justify-content','center','important');
      modal.style.setProperty('padding','10px','important');
      if (card) {
        card.style.setProperty('width','min(94vw,420px)','important');
        card.style.setProperty('max-width','420px','important');
        card.style.setProperty('max-height','90vh','important');
        card.style.setProperty('margin','auto','important');
        card.style.setProperty('transform','none','important');
        card.style.setProperty('inset','auto','important');
        card.style.setProperty('display','flex','important');
        card.style.setProperty('flex-direction','column','important');
      }
      if (slider) {
        slider.style.setProperty('height','390px','important');
        slider.style.setProperty('min-height','390px','important');
        slider.style.setProperty('max-height','54vh','important');
        slider.style.setProperty('overflow','hidden','important');
      }
      if (track) {
        track.style.setProperty('height','100%','important');
        track.querySelectorAll('.pslide').forEach((slide) => {
          slide.style.setProperty('height','100%','important');
          slide.style.setProperty('padding','10px','important');
          slide.style.setProperty('display','flex','important');
          slide.style.setProperty('align-items','center','important');
          slide.style.setProperty('justify-content','center','important');
        });
        track.querySelectorAll('img,video').forEach((m) => {
          m.style.setProperty('width','100%','important');
          m.style.setProperty('height','100%','important');
          m.style.setProperty('max-width','100%','important');
          m.style.setProperty('max-height','100%','important');
          m.style.setProperty('object-fit','contain','important');
          m.style.setProperty('object-position','center center','important');
          m.style.setProperty('transform','none','important');
          m.style.setProperty('padding','0','important');
          m.style.setProperty('margin','auto','important');
        });
      }
    }
  };

  const tuneImages = () => {
    document.querySelectorAll('img').forEach((img) => {
      if (img.classList.contains('hero__img') || img.id === 'brandLogo') return;
      img.loading = 'lazy';
      img.decoding = 'async';
    });
  };

  const setupReveal = () => {
    const items = document.querySelectorAll('.card,.lux-banner,#contacto,.footer-premium,.flowExtras,#catalogo .filters');
    items.forEach((el) => el.classList.add('fu-reveal'));

    if (!('IntersectionObserver' in window)) {
      items.forEach((el) => el.classList.add('fu-on'));
      return;
    }

    const obs = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('fu-on');
          obs.unobserve(entry.target);
        }
      });
    }, { threshold: .08, rootMargin: '0px 0px -20px 0px' });

    items.forEach((el) => obs.observe(el));
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
    setTimeout(setupReveal, 40);
  };

  const startHero = () => {
    const hero = fitHero();
    if (!hero || started) return;
    started = true;
    hero.src = slides[current];
    setTimeout(fitHero, 60);
    setTimeout(() => { const img = new Image(); img.src = slides[1]; }, 600);
    setInterval(() => {
      current = (current + 1) % slides.length;
      hero.style.transition = 'opacity .28s ease';
      hero.style.opacity = '.45';
      setTimeout(() => { hero.src = slides[current]; fitHero(); hero.style.opacity = '1'; }, 130);
    }, 4200);
  };

  const boot = () => {
    loadPremium();
    hideLoader();
    startHero();
    tuneImages();
    injectExtras();
    fixProductModal();
    setTimeout(setupReveal, 60);
    document.getElementById('btnWomen')?.addEventListener('click', () => setTimeout(injectExtras, 90));
    document.getElementById('btnMen')?.addEventListener('click', () => setTimeout(injectExtras, 90));
  };

  boot();
  document.addEventListener('DOMContentLoaded', boot, { once:true });
  window.addEventListener('load', boot, { once:true });
  window.addEventListener('resize', fitHero);
  document.addEventListener('click', (e) => {
    const modal = document.getElementById('pModal');
    if (!modal || modal.getAttribute('aria-hidden') !== 'false') {
      setTimeout(fixProductModal, 80);
      return;
    }
    if (e.target.closest('.pmodal__close') || e.target.classList.contains('pmodal__back') || e.target === modal) {
      e.preventDefault();
      e.stopPropagation();
      closeProductModal();
      return;
    }
    setTimeout(fixProductModal, 80);
  }, true);
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeProductModal(); });
  new MutationObserver(fixProductModal).observe(document.body, { attributes:true, childList:true, subtree:true });
})();
