(() => {
  const HERO = 'assets/SmartSelect_20260625_142913_ChatGPT.jpg?v=2';

  const hideLoader = () => {
    const loader = document.getElementById('loader');
    if (!loader) return;
    loader.style.display = 'none';
    loader.style.opacity = '0';
    loader.style.visibility = 'hidden';
    loader.setAttribute('aria-hidden', 'true');
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
    hero.style.objectFit = 'cover';
    hero.style.objectPosition = 'center center';
    hero.src = HERO;
  };

  hideLoader();
  setupHero();

  document.addEventListener('DOMContentLoaded', () => {
    hideLoader();
    setupHero();
  }, { once: true });

  window.addEventListener('load', hideLoader, { once: true });
})();
