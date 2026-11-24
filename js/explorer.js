/* Villa explorer: tap a floor on the facade photo, it zooms in and shows that level's
   details and real photos. Works anywhere a .vx block exists (home page #levels and
   villa-explorer.html). Add data-keys="global" on .vx to let ↑/↓ keys work page-wide. */
(function () {
  'use strict';
  var root = document.querySelector('.vx');
  if (!root) return;

  /* Floor bands as a fraction of the facade photo (0 = top, 1 = bottom).
     Estimated from the photo; adjust here if a band needs to move. */
  var LEVELS = [
    { no: '05', name: 'Terrace & services', sub: 'Pergola, solar, services', top: 0.152, bottom: 0.238,
      title: 'Terrace &amp; <em>services</em>',
      text: 'The services that keep the house quiet, kept out of sight on the top level under the pergola.',
      feats: ['Solar array', 'Mitsubishi outdoor units', 'Heat pump', 'Softener and pressure pumps'],
      photos: [] },
    { no: '04', name: 'Wellness', sub: 'Gym, jacuzzi, steam', top: 0.238, bottom: 0.282,
      title: 'A home that <em>takes care of you.</em>',
      text: 'Sink into a six seater jacuzzi and let the day dissolve. Step into a Kohler steam room. Train in a twenty five lakh gym, then breathe on a floating glass balcony made for yoga.',
      feats: ['₹25 lakh home gym', 'Six-seater jacuzzi', 'Kohler steam room', 'Floating glass yoga balcony', 'Guest suite'],
      photos: [['level04-jacuzzi', 'Six-seater jacuzzi'], ['level04-home-gym', '₹25 lakh home gym'], ['level04-jacuzzi-and-steam-room', 'Jacuzzi and Kohler steam room'], ['level04-shower', 'Grohe rain shower, Kohler fittings']] },
    { no: '03', name: 'Entertainment', sub: 'Cinema, lounge, bar', top: 0.282, bottom: 0.393,
      title: 'Lights down. <em>Stars up.</em>',
      text: 'A ₹80 lakh private cinema, a family lounge framed by teak beams and light, and a double height balcony with an outdoor kitchen and bar counter: the best seat in the house after sunset.',
      feats: ['₹80 lakh home theatre', 'Klipsch 6000 series 11.4.2 sound', '8K JVC projector', 'Eight leather two way recliners', 'Family lounge with Italian marble bar', 'Double height balcony, outdoor kitchen'],
      photos: [['level03-home-theatre-recliners', '₹80 lakh private cinema'], ['level03-theatre-screen', 'Cinema screen wall'], ['level03-theatre-projector-starlit-ceiling', '8K JVC projector, starlit ceiling'], ['level03-theatre-recliner-detail', 'Leather two way recliners'], ['level03-family-lounge-light-lines', 'Family lounge, lines of light'], ['level03-family-lounge', 'Family lounge'], ['level03-balcony-bar-counter-night', 'Outdoor kitchen and bar counter'], ['balcony-after-dark', 'Evenings above the city'], ['balcony-night-lounge', 'Balcony lounge']] },
    { no: '02', name: 'Private suites', sub: 'Master and study bedrooms', top: 0.393, bottom: 0.479,
      title: 'Rest, <em>elevated.</em>',
      text: 'Study and master bedrooms, each with its own balcony. A seven by seven foot cot on a Korean marble base with a pure leather headboard, teak panelling and six inch teak frames around bulletproof glass. The five suites are spread across Levels 01 to 04.',
      feats: ['7 × 7 ft king cot, Korean marble base', 'Pure leather headboard', 'Walk in wardrobe with digital lock', 'Private balcony for every suite', 'Legrand Living Now switches'],
      photos: [['level02-master-suite', 'Master suite'], ['level02-master-suite-detail', 'Leather headboard, teak panelling'], ['suite-leather-wall-art', 'Leather wall art, wood pattern floor'], ['suite-teak-panelled-study-desk', 'Teak panelled suite with study desk'], ['suite-balcony-bedroom', 'Suite with 8 × 20 ft private balcony'], ['suite-study-onyx-wall', 'Study, onyx wall and teak cabinetry']] },
    { no: '01', name: 'Living', sub: 'Hall, kitchen, dining, pooja', top: 0.479, bottom: 0.586,
      title: 'Double height. <em>Double the drama.</em>',
      text: 'A 23 × 23 ft living hall under a twenty foot ceiling, Breccia Aurora marble underfoot and a hand crafted four layer marble TV wall. It opens to the Hafele kitchen, dining, the pooja room in brass and teak, and the first master suite.',
      feats: ['23 × 23 ft hall, 20 ft ceiling', 'Four layer marble TV panel', 'Fully Hafele kitchen + utility kitchen', 'Pooja room in brass and teak', 'Floating marble staircase', 'First master suite'],
      photos: [['level01-living-hall-marble-tv-wall', 'Living hall, 20 ft ceiling'], ['level01-living-hall-from-above', 'Seen from above'], ['living-hall-double-height-wide', 'Double height living'], ['level01-hafele-kitchen', 'Hafele kitchen'], ['level01-dining', 'Dining with marble table'], ['level01-kitchen-tall-units', 'Concealed refrigerator, built-in oven'], ['level01-pooja-room-and-lift', 'Pooja room beside the lift'], ['staircase-floating-marble', 'A staircase that floats'], ['level01-teak-entrance-door-brass', 'Teak entrance with brass fittings']] },
    { no: '00', name: 'Arrival', sub: 'Motor court, office, lift', top: 0.586, bottom: 0.792,
      title: 'Arrive like <em>you mean it.</em>',
      text: 'An automated Beninca gate from Italy opens onto a gallery style motor court for six cars. The ground level keeps the household running, so the floors above can stay calm.',
      feats: ['Beninca (Italy) automated gate', 'Six car covered parking', 'Home office with washroom', 'Staff room and store with washroom', 'Schindler lift to every level', '40,000 L water, 20 KVA backup'],
      photos: [['level00-motor-court-parking', 'Motor court for six cars'], ['entrance-teak-door-and-windows', 'Ten foot teak entrance, brass inlay'], ['level00-home-office', 'Home office'], ['level00-schindler-lift', 'Schindler lift, parking to the top floor']] }
  ];
  var VIEW_TOP = 0.07; // the stage starts 7% down the photo to trim empty sky
  var bookHref = document.getElementById('book') ? '#book' : 'index.html#book';

  var q = function (s) { return root.querySelector(s); };
  var stage = q('.stage'), zoom = q('.zoom'), spot = q('.spot'), rail = q('.rail'), panel = q('.panel');
  var where = q('.vx-where'), prevB = q('.vx-prev'), nextB = q('.vx-next');
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var globalKeys = root.dataset.keys === 'global';
  var current = -1;

  LEVELS.forEach(function (L, i) {
    var b = document.createElement('button');
    b.type = 'button'; b.className = 'band';
    b.style.top = (L.top * 100) + '%'; b.style.height = ((L.bottom - L.top) * 100) + '%';
    b.setAttribute('aria-label', 'Level ' + L.no + ', ' + L.name);
    b.innerHTML = '<span class="tag">' + L.no + ' · ' + L.name + '</span>';
    b.addEventListener('click', function () { select(i); });
    b.addEventListener('mouseenter', function () { hover(i, true); });
    b.addEventListener('mouseleave', function () { hover(i, false); });
    zoom.appendChild(b); L.band = b;
    var dot = document.createElement('span'); dot.className = 'pulse';
    dot.style.top = ((L.top + L.bottom) / 2 * 100) + '%'; dot.style.left = i % 2 ? '62%' : '38%';
    zoom.appendChild(dot);

    var r = document.createElement('button');
    r.type = 'button'; r.setAttribute('aria-pressed', 'false');
    r.innerHTML = '<span class="no">' + L.no + '</span><span class="nm">' + L.name + '</span><span class="sub">' + L.sub + '</span>';
    r.addEventListener('click', function () { select(i); });
    r.addEventListener('mouseenter', function () { hover(i, true); });
    r.addEventListener('mouseleave', function () { hover(i, false); });
    rail.appendChild(r); L.railBtn = r;
  });
  var allBtn = document.createElement('button');
  allBtn.className = 'all'; allBtn.type = 'button'; allBtn.textContent = '↺ Whole villa';
  allBtn.addEventListener('click', function () { select(-1); });
  rail.appendChild(allBtn);

  function hover(i, on) {
    if (current !== -1) return;
    LEVELS[i].band.classList.toggle('hover', on);
    LEVELS[i].railBtn.classList.toggle('hover', on);
  }

  function layout() {
    var W = stage.clientWidth, H = stage.clientHeight, imgH = W * 1535 / 1024;
    if (!W) return;
    if (current === -1) {
      zoom.style.transform = 'translate(0px,' + (-Math.min(VIEW_TOP * imgH, imgH - H)) + 'px) scale(1)';
      return;
    }
    var L = LEVELS[current];
    var bandH = (L.bottom - L.top) * imgH, bandW = 0.665 * W;
    var s = Math.max(1.15, Math.min(2.3, (H * 0.62) / bandH, (W * 0.96) / bandW));
    var cy = (L.top + L.bottom) / 2 * imgH;
    var tx = Math.min(0, Math.max(W - W * s, W / 2 - W * 0.5 * s));
    var ty = Math.min(0, Math.max(H - imgH * s, H / 2 - cy * s));
    zoom.style.transform = 'translate(' + tx + 'px,' + ty + 'px) scale(' + s + ')';
  }

  function select(i, quiet) {
    current = i;
    stage.classList.toggle('zoomed', i !== -1);
    LEVELS.forEach(function (L, k) {
      L.railBtn.setAttribute('aria-pressed', String(k === i));
      L.band.classList.remove('hover'); L.railBtn.classList.remove('hover');
    });
    if (i !== -1) {
      var L = LEVELS[i];
      spot.style.top = (L.top * 100) + '%'; spot.style.height = ((L.bottom - L.top) * 100) + '%';
      where.textContent = 'Level ' + L.no + ' · ' + L.name;
      prevB.disabled = i === LEVELS.length - 1; nextB.disabled = i === 0;
      renderDetail(L);
      if (!quiet && window.innerWidth <= 760) stage.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'center' });
      if (!quiet && window.innerWidth <= 1100 && rail.scrollTo) rail.scrollTo({ left: L.railBtn.offsetLeft - rail.clientWidth / 2 + L.railBtn.offsetWidth / 2, behavior: reduce ? 'auto' : 'smooth' });
    } else {
      where.textContent = 'Whole villa';
      prevB.disabled = false; nextB.disabled = false;
      renderWelcome();
    }
    layout();
  }

  function renderWelcome() {
    panel.innerHTML = '<div class="welcome detail"><p class="label"><span class="num">Jakkur Villa</span> Front elevation, East facing</p>' +
      '<h2>Tap a floor.<br><em>Step inside.</em></h2>' +
      '<p>A Schindler lift rises from the motor court to the very top. Every floor has its own private balcony and its own purpose. Choose a floor on the villa or from the list to zoom in and see its rooms.</p>' +
      '<ul class="floor-stack">' + LEVELS.map(function (L) {
        return '<li><span class="no">' + L.no + '</span><span>' + L.name + '</span><span class="cnt">' + (L.photos.length ? L.photos.length + ' photos' : 'Details') + '</span></li>';
      }).join('') + '</ul></div>';
    Array.prototype.forEach.call(panel.querySelectorAll('.floor-stack li'), function (li, i) {
      li.tabIndex = 0; li.setAttribute('role', 'button');
      li.addEventListener('click', function () { select(i); });
      li.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); select(i); } });
    });
  }

  function renderDetail(L) {
    var thumbs = L.photos.length
      ? '<div class="thumbs">' + L.photos.map(function (p, k) {
          return '<button type="button" data-k="' + k + '" style="animation-delay:' + (0.35 + k * 0.07) + 's" aria-label="Open photo: ' + p[1] + '"><img src="images/' + p[0] + (k === 0 ? '' : '-sm') + '.jpg" alt="' + p[1] + '" loading="lazy" decoding="async"><span class="cap">' + p[1] + '</span></button>';
        }).join('') + '</div>'
      : '<p class="none">Photos of this level are coming soon. Ask us for a live video walkthrough of the terrace.</p>';
    panel.innerHTML = '<div class="detail"><div class="lvl" aria-hidden="true">' + L.no + '</div>' +
      '<p class="label"><span class="num">Level ' + L.no + '</span> ' + L.name + '</p>' +
      '<h2>' + L.title + '</h2><p>' + L.text + '</p>' +
      '<ul class="feat">' + L.feats.map(function (f) { return '<li>' + f + '</li>'; }).join('') + '</ul>' + thumbs +
      '<div class="cta"><a class="btn btn-gold" href="' + bookHref + '">Book a private visit</a>' +
      '<a class="btn btn-outline-light" href="https://wa.me/919743107607?text=' + encodeURIComponent("Hi, I'm interested in Jakkur Villa. Please share details of Level " + L.no + ' (' + L.name + ').') + '" target="_blank" rel="noopener">Ask about this level</a></div></div>';
    Array.prototype.forEach.call(panel.querySelectorAll('.thumbs button'), function (b) {
      b.addEventListener('click', function () { openLb(L.photos, +b.dataset.k); });
    });
  }

  prevB.addEventListener('click', function () { select(current === -1 ? LEVELS.length - 1 : Math.min(LEVELS.length - 1, current + 1)); });
  nextB.addEventListener('click', function () { select(current === -1 ? LEVELS.length - 1 : Math.max(0, current - 1)); });
  document.addEventListener('keydown', function (e) {
    if (lb.classList.contains('open')) return;
    if (!globalKeys && !root.contains(document.activeElement)) return;
    if (e.target.closest && e.target.closest('input, textarea, select')) return;
    if (e.key === 'ArrowUp') { e.preventDefault(); nextB.click(); }
    if (e.key === 'ArrowDown') { e.preventDefault(); prevB.click(); }
    if (e.key === 'Escape' && current !== -1) select(-1);
  });
  window.addEventListener('resize', layout);

  /* its own lightbox, so it never clashes with the page's gallery lightbox */
  var lb = document.createElement('div');
  lb.className = 'lightbox'; lb.id = 'vx-lightbox';
  lb.setAttribute('role', 'dialog'); lb.setAttribute('aria-modal', 'true'); lb.setAttribute('aria-label', 'Photo viewer');
  lb.innerHTML = '<button class="lb-btn lb-close" aria-label="Close"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M6 6l12 12M18 6L6 18"/></svg></button>' +
    '<button class="lb-btn lb-prev" aria-label="Previous photo"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M15 5l-7 7 7 7"/></svg></button>' +
    '<figure><img alt=""><figcaption><span class="t"></span><span class="count"></span></figcaption></figure>' +
    '<button class="lb-btn lb-next" aria-label="Next photo"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M9 5l7 7-7 7"/></svg></button>';
  document.body.appendChild(lb);
  var lbImg = lb.querySelector('img'), lbT = lb.querySelector('.t'), lbC = lb.querySelector('.count');
  var list = [], idx = 0, lastFocus = null;
  function show() { lbImg.src = 'images/' + list[idx][0] + '.jpg'; lbImg.alt = list[idx][1]; lbT.textContent = list[idx][1]; lbC.textContent = (idx + 1) + ' / ' + list.length; }
  function openLb(l, i) { list = l; idx = i; lastFocus = document.activeElement; show(); lb.classList.add('open'); document.body.style.overflow = 'hidden'; lb.querySelector('.lb-close').focus(); }
  function closeLb() { lb.classList.remove('open'); document.body.style.overflow = ''; if (lastFocus) lastFocus.focus(); }
  function step(d) { idx = (idx + d + list.length) % list.length; show(); }
  lb.querySelector('.lb-close').addEventListener('click', closeLb);
  lb.querySelector('.lb-prev').addEventListener('click', function () { step(-1); });
  lb.querySelector('.lb-next').addEventListener('click', function () { step(1); });
  lb.addEventListener('click', function (e) { if (e.target === lb) closeLb(); });
  document.addEventListener('keydown', function (e) {
    if (!lb.classList.contains('open')) return;
    if (e.key === 'Escape') closeLb(); if (e.key === 'ArrowLeft') step(-1); if (e.key === 'ArrowRight') step(1);
  });
  var sx = null;
  lb.addEventListener('touchstart', function (e) { sx = e.touches[0].clientX; }, { passive: true });
  lb.addEventListener('touchend', function (e) { if (sx === null) return; var dx = e.changedTouches[0].clientX - sx; if (Math.abs(dx) > 50) step(dx < 0 ? 1 : -1); sx = null; });

  var img = zoom.querySelector('img');
  select(-1, true);
  if (!img.complete) img.addEventListener('load', layout);
  if ('ResizeObserver' in window) new ResizeObserver(layout).observe(stage);
})();
