(() => {
  const hero = document.querySelector('.hero__img');
  if (!hero) return;

  // Portada principal limpia: sin filtros, sin blur y sin imágenes pegadas en baja calidad.
  hero.src = 'assets/hero.jpg?v=4';
  hero.style.opacity = '1';
  hero.style.transform = 'scale(1)';
  hero.style.filter = 'none';
  hero.style.imageRendering = 'auto';
  hero.style.objectFit = 'cover';
  hero.style.objectPosition = 'center center';

  // Elimina cualquier bloque viejo de fotos debajo del hero.
  document.querySelectorAll('.hero-continuation').forEach((el) => el.remove());
})();
