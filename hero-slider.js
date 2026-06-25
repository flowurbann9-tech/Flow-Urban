(() => {
  const hero = document.querySelector('.hero__img');
  if (!hero) return;

  // Se desactivaron las imágenes comprimidas para no bajar la calidad de la portada.
  // La portada queda usando la imagen original del sitio hasta subir nuevas imágenes en alta resolución real.
  hero.src = 'assets/hero.jpg?v=2';
  hero.style.opacity = '1';
  hero.style.transform = 'scale(1)';
  hero.style.filter = 'saturate(1.08) contrast(1.05)';
})();
