/* Gallery horizontal scroll: the section pins to the screen and the photo
   track slides right-to-left as the visitor scrolls down.
   main.js fills the track (#masonry) with every gallery photo, handles the
   filter chips and opens the lightbox; this file only drives the movement. */
(function () {
  var sec = document.querySelector('.hscroll');
  if (!sec) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  var track = sec.querySelector('.hscroll-track');
  var distance = 0;
  var ticking = false;

  function measure() {
    track.style.transform = 'none';
    distance = Math.max(0, track.scrollWidth - window.innerWidth);
    // Section height = one screen + the sideways distance, so 1px down = 1px sideways.
    sec.style.height = (window.innerHeight + distance) + 'px';
    update();
  }

  function update() {
    ticking = false;
    var top = sec.getBoundingClientRect().top;
    var total = sec.offsetHeight - window.innerHeight;
    var p = total > 0 ? Math.min(1, Math.max(0, -top / total)) : 0;
    track.style.transform = 'translate3d(' + (-p * distance).toFixed(1) + 'px,0,0)';
  }

  window.addEventListener('scroll', function () {
    if (!ticking) { ticking = true; requestAnimationFrame(update); }
  }, { passive: true });
  window.addEventListener('resize', measure);
  window.addEventListener('load', measure);

  // A filter chip changes how many photos are in the row: re-measure, then
  // jump back to the start of the row so the filtered photos are in view.
  sec.querySelectorAll('.chip').forEach(function (chip) {
    chip.addEventListener('click', function () {
      setTimeout(function () {
        var secTop = sec.getBoundingClientRect().top + window.pageYOffset;
        measure();
        if (window.pageYOffset > secTop) window.scrollTo({ top: secTop, behavior: 'instant' });
      }, 0);
    });
  });

  // Lazy loading never fires for photos that slide in by transform, so load
  // the whole row as the section approaches the screen.
  function loadAll() {
    track.querySelectorAll('img[loading="lazy"]').forEach(function (img) {
      img.loading = 'eager';
      if (!img.complete || !img.naturalWidth) img.src = img.getAttribute('src'); // kick a deferred load
    });
  }
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      if (entries[0].isIntersecting) { loadAll(); io.disconnect(); }
    }, { rootMargin: '1200px 0px' });
    io.observe(sec);
  } else { loadAll(); }

  measure();
})();
