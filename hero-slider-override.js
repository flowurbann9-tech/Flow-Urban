(() => {
  const init = () => {
    const hero = document.querySelector('.hero__img');
    if (!hero) return;

    const continuation = document.querySelector('.hero-continuation');
    const extraSlides = continuation
      ? Array.from(continuation.querySelectorAll('img'))
          .map(img => img.getAttribute('src'))
          .filter(Boolean)
      : [];

    if (continuation) continuation.remove();

    const slides = ['assets/hero.jpg?v=2', ...extraSlides];
    let index = 0;

    hero.src = slides[0];
    hero.style.opacity = '1';
    hero.style.transform = 'scale(1)';
    hero.style.filter = 'none';

    if (slides.length <= 1) return;

    const swap = () => {
      index = (index + 1) % slides.length;
      hero.style.transition = 'opacity .45s ease';
      hero.style.opacity = '0.45';

      window.setTimeout(() => {
        hero.src = slides[index];
        hero.style.opacity = '1';
        hero.style.filter = 'none';
      }, 220);
    };

    window.setInterval(swap, 4500);
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => window.setTimeout(init, 0), { once: true });
  } else {
    window.setTimeout(init, 0);
  }
})();
