(() => {
  const hideLoader = () => {
    const loader = document.getElementById('loader');
    if (!loader) return;
    loader.style.display = 'none';
    loader.setAttribute('aria-hidden', 'true');
  };

  hideLoader();
  document.addEventListener('DOMContentLoaded', hideLoader, { once: true });
  window.addEventListener('load', hideLoader, { once: true });

  const cleanHero = () => {
    const hero = document.querySelector('.hero__img');
    if (!hero) return;

    hero.src = 'assets/hero.jpg?v=4';
    hero.loading = 'eager';
    hero.decoding = 'async';
    hero.style.opacity = '1';
    hero.style.transform = 'scale(1)';
    hero.style.filter = 'none';
    hero.style.imageRendering = 'auto';
    hero.style.objectFit = 'cover';
    hero.style.objectPosition = 'center center';

    document.querySelectorAll('.hero-continuation').forEach((el) => el.remove());
  };

  cleanHero();
  document.addEventListener('DOMContentLoaded', cleanHero, { once: true });
})();
