(() => {
  const hideLoader = () => {
    const loader = document.getElementById('loader');
    if (!loader) return;
    loader.style.display = 'none';
    loader.setAttribute('aria-hidden', 'true');
  };

  const slides = [
    'assets/hero.jpg?v=5',
    'assets/SmartSelect_20260625_142913_ChatGPT.jpg?v=1'
  ];

  let current = 0;
  let timerStarted = false;

  const setupHero = () => {
    const hero = document.querySelector('.hero__img');
    if (!hero) return;

    document.querySelectorAll('.hero-continuation').forEach((el) => el.remove());

    hero.loading = 'eager';
    hero.decoding = 'async';
    hero.style.opacity = '1';
    hero.style.transform = 'scale(1)';
    hero.style.filter = 'none';
    hero.style.imageRendering = 'auto';
    hero.style.objectFit = 'cover';
    hero.style.objectPosition = 'center center';
    hero.src = slides[current];

    // Precarga suave de la segunda foto para que cambie sin trabarse.
    const preload = new Image();
    preload.src = slides[1];

    if (timerStarted) return;
    timerStarted = true;

    setInterval(() => {
      current = (current + 1) % slides.length;
      hero.style.transition = 'opacity .28s ease';
      hero.style.opacity = '0.55';

      setTimeout(() => {
        hero.src = slides[current];
        hero.style.opacity = '1';
      }, 160);
    }, 4300);
  };

  hideLoader();
  setupHero();
  document.addEventListener('DOMContentLoaded', () => {
    hideLoader();
    setupHero();
  }, { once: true });
  window.addEventListener('load', hideLoader, { once: true });
})();
