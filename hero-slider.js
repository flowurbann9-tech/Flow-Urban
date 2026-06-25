(() => {
  const hero = document.querySelector('.hero__img');
  if (!hero) return;

  const baseSlides = ['assets/hero.jpg'];
  const dataFiles = ['assets/hero-flow-1.b64', 'assets/hero-flow-2.b64'];

  hero.style.transition = 'opacity .75s ease, transform 1.1s ease, filter .75s ease';

  async function loadDataSlides() {
    const out = [...baseSlides];
    for (const file of dataFiles) {
      try {
        const txt = await fetch(file + '?v=' + Date.now(), { cache: 'no-store' }).then(r => r.ok ? r.text() : '');
        if (txt && txt.length > 1000) out.push('data:image/jpeg;base64,' + txt.trim());
      } catch (_) {}
    }
    return out;
  }

  function preload(src) {
    const img = new Image();
    img.src = src;
  }

  loadDataSlides().then((slides) => {
    if (slides.length < 2) return;
    slides.forEach(preload);
    let i = 0;
    setInterval(() => {
      i = (i + 1) % slides.length;
      hero.style.opacity = '0.25';
      hero.style.transform = 'scale(1.015)';
      hero.style.filter = 'saturate(1.12) contrast(1.08) brightness(.88)';
      setTimeout(() => {
        hero.src = slides[i];
        hero.style.opacity = '1';
        hero.style.transform = 'scale(1)';
        hero.style.filter = 'saturate(1.08) contrast(1.05)';
      }, 380);
    }, 4200);
  });
})();
