(() => {
  const slides = [
    'assets/hero.jpg?v=6',
    'assets/SmartSelect_20260625_142913_ChatGPT.jpg?v=2'
  ];

  let current = 0;
  let started = false;

  const isDesktop = () => window.innerWidth >= 900;

  const fitHero = (hero) => {
    hero.style.objectFit = isDesktop() ? 'contain' : 'cover';
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

  const setupGenderCatalog = () => {
    const grid = document.getElementById('productsGrid');
    const btnWomen = document.getElementById('btnWomen');
    const btnMen = document.getElementById('btnMen');
    if (!grid) return;

    const apply = () => {
      const women = document.body.classList.contains('theme-women');
      grid.querySelectorAll('.card').forEach((card) => {
        const cat = (card.querySelector('.meta')?.textContent || '').trim().toLowerCase();
        if (cat === 'maquillaje') card.style.display = women ? '' : 'none';
        if (cat === 'gorras') card.style.display = women ? 'none' : '';
      });
    };

    apply();
    btnWomen?.addEventListener('click', () => setTimeout(apply, 80));
    btnMen?.addEventListener('click', () => setTimeout(apply, 80));
    new MutationObserver(apply).observe(grid, { childList: true });
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

  hideLoader();
  setupHero();
  tuneImages();
  setupGenderCatalog();

  document.addEventListener('DOMContentLoaded', () => {
    hideLoader();
    setupHero();
    tuneImages();
    setupGenderCatalog();
  }, { once: true });

  window.addEventListener('load', () => {
    hideLoader();
    tuneImages();
    setupGenderCatalog();
  }, { once: true });

  window.addEventListener('resize', () => {
    const hero = document.querySelector('.hero__img');
    if (hero) fitHero(hero);
  });
})();
