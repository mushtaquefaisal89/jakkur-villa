/* Jakkur Villa — Ridgeline Dither Footer
   Plain-JS port of the "Ridgeline Dither Footer" React component, recoloured for
   Jakkur Villa (midnight navy + champagne). A pixel-scaled canvas draws ridges in
   ordered (Bayer) dither with drifting mist; the pointer parts the mist and tilts
   the ridges; a click sends a gust. Renders into <div data-jv-footer></div>.
   Must load before js/main.js (both deferred) so the brochure button exists. */
(function () {
  'use strict';
  var host = document.querySelector('[data-jv-footer]');
  if (!host) return;

  /* ---------- settings ---------- */
  // Background exactly as in the supplied component's demo: the "glacier" preset, seed 23, 7 ridges.
  var CFG = {
    seed: 23, ridges: 7, pixel: 2, mist: 0.8, drift: 1, radius: 130, interactive: true,
    maxWidth: '1240px', height: '780px', sceneMin: '260px',
    paper: '#f2f6fa', ink: '#121b26', muted: '#637184', line: '#dae3ed',
    accent: '#34679a', small: '#34679a', navy: '#12203A',
    tones: ['#f2f6fa', '#d6e6f4', '#a8cae7', '#6b9ecc', '#34679a', '#1a3e66', '#0b2140']
  };

  var isHome = !!document.getElementById('book');
  var base = isHome ? '' : 'index.html';
  var hasBrochure = !!document.getElementById('brochure-dialog');
  var WA = 'https://wa.me/919743107607?text=Hi%2C%20I%27m%20interested%20in%20Jakkur%20Villa.%20Please%20share%20details.';

  var COLUMNS = [
    { title: 'Explore', links: [
      { label: 'Story', href: base + '#story' },
      { label: 'Explore the villa', href: base + '#levels', badge: 'New' },
      { label: 'Gallery', href: base + '#gallery' },
      { label: 'Tour & floor plans', href: base + '#tour' },
      { label: 'Location', href: base + '#location' },
      { label: 'EMI calculator', href: base + '#emi' }
    ] },
    { title: 'Contact', links: [
      { label: '+91 97431 07607', href: 'tel:+919743107607', track: 'call' },
      { label: 'WhatsApp', href: WA, ext: true, track: 'whatsapp' },
      { label: 'jakkurvilla@gmail.com', href: 'mailto:jakkurvilla@gmail.com' },
      { label: 'Book a private visit', href: base + '#book' },
      hasBrochure ? { label: 'Download brochure', button: 'brochure-btn' } : { label: 'Download brochure', href: 'index.html?brochure=1' }
    ] },
    { title: 'Legal', links: [
      { label: 'Privacy policy', href: 'privacy.html' },
      { label: 'Terms', href: 'terms.html' },
      { label: 'Disclaimer', href: 'disclaimer.html' },
      { label: 'RERA: to be confirmed', tbc: true }
    ] }
  ];

  var ICONS = {
    whatsapp: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M17.5 14.4c-.3-.1-1.8-.9-2-1s-.5-.1-.7.1-.8 1-.9 1.2-.3.2-.6.1a8.1 8.1 0 0 1-4-3.5c-.3-.5.3-.5.9-1.6.1-.2 0-.4 0-.5l-.9-2.2c-.2-.6-.5-.5-.7-.5h-.6a1.1 1.1 0 0 0-.8.4 3.4 3.4 0 0 0-1.1 2.5 6 6 0 0 0 1.2 3.1 13.4 13.4 0 0 0 5.2 4.6c1.9.8 2.7.9 3.6.7a3.1 3.1 0 0 0 2-1.4 2.5 2.5 0 0 0 .2-1.4c-.1-.2-.3-.3-.6-.4zM12 21.8a9.8 9.8 0 0 1-5-1.4l-.4-.2-3.7 1 1-3.6-.2-.4A9.8 9.8 0 1 1 12 21.8zm8.4-18.2A11.8 11.8 0 0 0 1.8 17.8L.1 24l6.4-1.7a11.8 11.8 0 0 0 5.6 1.4A11.8 11.8 0 0 0 20.4 3.6z"/></svg>',
    phone: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.9.6 2.8.7a2 2 0 0 1 1.8 2z"/></svg>',
    mail: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/></svg>'
  };
  var SOCIALS = [
    { icon: 'whatsapp', href: WA, label: 'Chat on WhatsApp', ext: true, track: 'whatsapp' },
    { icon: 'phone', href: 'tel:+919743107607', label: 'Call +91 97431 07607', track: 'call' },
    { icon: 'mail', href: 'mailto:jakkurvilla@gmail.com', label: 'Email jakkurvilla@gmail.com' }
  ];

  /* ---------- pure helpers (from the original component) ---------- */
  function hex(h) {
    var m = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.exec((h || '').trim()); if (!m) return null;
    var s = m[1].length === 3 ? m[1].split('').map(function (c) { return c + c; }).join('') : m[1];
    return [parseInt(s.slice(0, 2), 16), parseInt(s.slice(2, 4), 16), parseInt(s.slice(4, 6), 16)];
  }
  function pack(rgb) { return ((255 << 24) | (rgb[2] << 16) | (rgb[1] << 8) | rgb[0]) >>> 0; }
  var BAYER = [0,32,8,40,2,34,10,42,48,16,56,24,50,18,58,26,12,44,4,36,14,46,6,38,60,28,52,20,62,30,54,22,
    3,35,11,43,1,33,9,41,51,19,59,27,49,17,57,25,15,47,7,39,13,45,5,37,63,31,55,23,61,29,53,21].map(function (v) { return (v + 0.5) / 64; });
  function dither(t, n, b) { t = t < 0 ? 0 : t > 1 ? 1 : t; var v = Math.floor(t * (n - 1) + b); return v > n - 1 ? n - 1 : v; }
  function hash(x, y, seed) {
    var h = Math.imul(x | 0, 374761393) + Math.imul(y | 0, 668265263) + Math.imul(seed | 0, 1442695041);
    h = Math.imul(h ^ (h >>> 13), 1274126177); h ^= h >>> 16; return (h >>> 0) / 4294967296;
  }
  function noise(x, y, seed) {
    var xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi;
    var u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
    var a = hash(xi, yi, seed), b = hash(xi + 1, yi, seed), c = hash(xi, yi + 1, seed), d = hash(xi + 1, yi + 1, seed);
    return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
  }
  function fbm(x, y, seed, oct) {
    var sum = 0, amp = 0.5, norm = 0;
    for (var o = 0; o < oct; o++) { sum += noise(x, y, seed + o * 31) * amp; norm += amp; x *= 2.03; y *= 2.03; amp *= 0.5; }
    return norm > 0 ? sum / norm : 0;
  }
  function smooth(e0, e1, x) { var t = e1 === e0 ? (x < e0 ? 0 : 1) : Math.min(1, Math.max(0, (x - e0) / (e1 - e0))); return t * t * (3 - 2 * t); }
  function ease(t) { var c = t < 0 ? 0 : t > 1 ? 1 : t; return 1 - Math.pow(1 - c, 3); }
  function ridgeline(cols, rows, i, layers, seed, margin) {
    var k = layers > 1 ? i / (layers - 1) : 1, n = cols + margin * 2, out = new Float32Array(n);
    var base = rows * (0.38 + 0.66 * Math.pow(k, 1.4)), amp = rows * (0.2 + 0.24 * k), freq = 6 - 3.8 * k;
    var flankL = rows * 0.5 * k * k * k * (0.55 + 0.6 * hash(i, 11, seed));
    var flankR = rows * 0.5 * k * k * k * (0.55 + 0.6 * hash(i, 13, seed));
    var ceil = rows * 0.17, tilt = (hash(i, 7, seed) - 0.5) * rows * 0.34 * (0.4 + k), s = (seed | 0) * 13 + i * 101;
    for (var x = 0; x < n; x++) {
      var u = (x - margin) / cols;
      var r1 = 1 - Math.abs(noise(u * freq + i * 3.7, 0.5, s) * 2 - 1);
      var r2 = 1 - Math.abs(noise(u * freq * 2.3, 3.5, s + 1) * 2 - 1);
      var f = fbm(u * freq * 4.1, 9.5, s + 2, 3);
      var h = r1 * r1 * 0.62 + r2 * 0.24 + f * 0.14;
      var e = Math.min(1.2, Math.abs(u * 2 - 1));
      var y = base - h * amp + tilt * (u - 0.5) * 2 - (u < 0.5 ? flankL : flankR) * e * e * Math.sqrt(e);
      out[x] = y < ceil ? ceil - (ceil - y) * 0.25 : y;
    }
    return out;
  }
  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;'); }

  /* ---------- styles ---------- */
  var CSS = '\
.rdf-root{position:relative;display:grid;width:100%;overflow:hidden;isolation:isolate;background:var(--rdf-paper);color:var(--rdf-ink);font-family:var(--sans);-webkit-font-smoothing:antialiased;--rdf-pad:clamp(20px,3.2vw,30px)}\
.rdf-frame{position:relative;display:grid;grid-template-rows:auto auto minmax(var(--rdf-scene-min),1fr);width:100%;max-width:var(--rdf-max);margin:0 auto}\
.rdf-frame::before,.rdf-frame::after{content:"";position:absolute;top:0;bottom:0;width:1px;z-index:3;pointer-events:none;background:var(--rdf-line);transform:scaleY(0);transform-origin:50% 0;transition:transform 1.4s cubic-bezier(.2,.7,.1,1)}\
.rdf-frame::before{left:0}.rdf-frame::after{right:0;transition-delay:.08s}\
.rdf-in .rdf-frame::before,.rdf-in .rdf-frame::after{transform:scaleY(1)}\
.rdf-r{opacity:0;transform:translateY(12px);filter:blur(5px);transition:opacity .9s cubic-bezier(.2,.7,.1,1),transform 1s cubic-bezier(.2,.7,.1,1),filter .9s ease;transition-delay:calc(var(--d,0)*1ms)}\
.rdf-in .rdf-r{opacity:1;transform:none;filter:none}\
.rdf-frame{grid-template-rows:auto auto auto minmax(var(--rdf-scene-min),1fr)}\
.rdf-cta{position:relative;z-index:2;display:grid;grid-template-columns:minmax(0,1.25fr) minmax(0,1fr);gap:clamp(28px,5vw,80px);align-items:end;padding:clamp(72px,9vw,128px) var(--rdf-pad) clamp(44px,5vw,64px);border-bottom:1px solid var(--rdf-line)}\
.rdf-eyebrow{display:inline-flex;align-items:center;gap:14px;margin:0 0 22px;font-size:11.5px;letter-spacing:.26em;text-transform:uppercase;color:var(--rdf-small);font-weight:500}\
.rdf-eyebrow::before{content:"";width:34px;height:1px;background:var(--rdf-accent)}\
.rdf-big{margin:0;font-family:var(--serif);font-weight:400;font-size:clamp(40px,5.6vw,76px);line-height:1.02;letter-spacing:-.015em;color:var(--rdf-ink)}\
.rdf-big em{display:block;font-style:italic;color:#1a3e66}\
.rdf-cta-side{display:flex;flex-direction:column;gap:22px;padding-bottom:8px}\
.rdf-cta-side p{margin:0;font-size:15px;line-height:1.7;color:var(--rdf-muted);max-width:42ch}\
.rdf-btns{display:flex;flex-wrap:wrap;gap:12px}\
.rdf-btn{display:inline-flex;align-items:center;justify-content:center;gap:10px;min-height:52px;padding:0 28px;border-radius:999px;font-size:12.5px;font-weight:500;letter-spacing:.16em;text-transform:uppercase;text-decoration:none;border:1px solid var(--rdf-ink);transition:background-color .3s ease,color .3s ease,transform .4s cubic-bezier(.2,.7,.1,1)}\
.rdf-btn svg{width:17px;height:17px}\
.rdf-btn.solid{background:var(--rdf-navy);border-color:var(--rdf-navy);color:#F7F2E9}\
.rdf-btn.solid:hover{background:var(--rdf-accent);border-color:var(--rdf-accent);transform:translateY(-2px)}\
.rdf-btn.ghost{color:var(--rdf-ink);background:transparent}\
.rdf-btn.ghost:hover{background:var(--rdf-ink);color:#F7F2E9;transform:translateY(-2px)}\
.rdf-top{position:relative;z-index:2;display:grid;grid-template-columns:minmax(0,1.5fr) repeat(3,minmax(0,1fr));gap:36px;padding:clamp(44px,5vw,64px) var(--rdf-pad) clamp(30px,4vw,48px)}\
.rdf-brand{display:flex;flex-direction:column;align-items:flex-start;gap:18px}\
.rdf-logo{display:inline-flex;flex-direction:column;gap:9px;text-decoration:none;color:var(--rdf-ink)}\
.rdf-logo span{font-size:15px;letter-spacing:.42em;font-weight:500;white-space:nowrap}\
.rdf-logo i{width:26px;height:1px;background:var(--rdf-accent);transition:width .6s cubic-bezier(.2,.7,.1,1)}\
.rdf-logo:hover i{width:64px}\
.rdf-tag{margin:0;max-width:32ch;font-size:14.5px;line-height:1.7;color:var(--rdf-muted)}\
.rdf-social{display:flex;gap:10px;margin:4px 0 0;padding:0;list-style:none}\
.rdf-social a{display:grid;place-items:center;width:42px;height:42px;border-radius:50%;color:var(--rdf-ink);background:#fff;border:1px solid var(--rdf-line);box-shadow:0 6px 18px rgba(28,36,51,.05);transition:color .3s ease,background-color .3s ease,border-color .3s ease,transform .45s cubic-bezier(.2,.7,.1,1)}\
.rdf-social a:hover{color:#F7F2E9;background:var(--rdf-navy);border-color:var(--rdf-navy);transform:translateY(-3px)}\
.rdf-social svg{width:17px;height:17px;display:block}\
.rdf-col h3{margin:6px 0 22px;font:500 11px/1 var(--sans);letter-spacing:.26em;text-transform:uppercase;color:var(--rdf-small)}\
.rdf-col ul{list-style:none;margin:0;padding:0;display:grid;gap:13px}\
.rdf-link{position:relative;display:inline-flex;align-items:center;gap:8px;color:var(--rdf-ink);text-decoration:none;font-size:14.5px;line-height:1.35;background:none;border:0;padding:0;font-family:inherit;cursor:pointer;text-align:left;transition:color .3s ease,transform .5s cubic-bezier(.2,.7,.1,1)}\
.rdf-link::before{content:"";position:absolute;left:-12px;top:50%;width:7px;height:1px;background:var(--rdf-accent);transform:scaleX(0);transform-origin:0 50%;transition:transform .45s cubic-bezier(.2,.7,.1,1)}\
.rdf-link:hover{color:var(--rdf-small);transform:translateX(7px)}\
.rdf-link:hover::before{transform:scaleX(1)}\
.rdf-tbc{font-size:14px;color:var(--rdf-muted);font-style:italic;border-bottom:1px dashed var(--rdf-accent);padding-bottom:1px}\
.rdf-badge{font:600 9px/1 var(--sans);letter-spacing:.12em;text-transform:uppercase;padding:4px 8px 3px;border-radius:99px;color:#F7F2E9;background:var(--rdf-navy)}\
.rdf-link:focus-visible,.rdf-logo:focus-visible,.rdf-social a:focus-visible,.rdf-btn:focus-visible{outline:2px solid var(--rdf-accent);outline-offset:4px;border-radius:999px}\
.rdf-link:focus-visible,.rdf-logo:focus-visible{border-radius:3px}\
.rdf-bar{position:relative;z-index:2;display:flex;justify-content:space-between;align-items:center;gap:16px;padding:20px var(--rdf-pad) 0;border-top:1px solid var(--rdf-line);margin:0 var(--rdf-pad);padding-left:0;padding-right:0;font-size:12.5px;color:var(--rdf-muted)}\
.rdf-bar p{margin:0}\
.rdf-bar .facts{font-family:var(--serif);font-style:italic;font-size:14px;color:var(--rdf-ink)}\
.rdf-scene{position:relative;z-index:1;margin-top:-40px;overflow:hidden;cursor:crosshair}\
.rdf-scene canvas{position:absolute;left:0;bottom:0;display:block;max-width:none;image-rendering:pixelated;image-rendering:crisp-edges}\
@media (max-width:900px){.rdf-cta{grid-template-columns:minmax(0,1fr);align-items:start}.rdf-top{grid-template-columns:minmax(0,1fr) minmax(0,1fr);row-gap:40px}.rdf-brand{grid-column:1/-1}}\
@media (max-width:640px){.rdf-top{grid-template-columns:minmax(0,1fr)}.rdf-bar{flex-direction:column;align-items:flex-start;gap:6px}.rdf-scene{margin-top:-24px}.rdf-root{padding-bottom:62px}.rdf-btn{width:100%}}\
@media (prefers-reduced-motion:reduce){.rdf-r,.rdf-frame::before,.rdf-frame::after,.rdf-link,.rdf-link::before,.rdf-social a{transition:none}.rdf-r{filter:none}}';
  var st = document.createElement('style'); st.textContent = CSS; document.head.appendChild(st);

  /* ---------- markup ---------- */
  var year = new Date().getFullYear();
  var cols = COLUMNS.map(function (c, ci) {
    return '<nav class="rdf-col" aria-label="' + esc(c.title) + '"><h3 class="rdf-r" style="--d:' + (260 + ci * 110) + '">' + esc(c.title) + '</h3><ul>' +
      c.links.map(function (l, li) {
        var d = 330 + ci * 110 + li * 55, inner;
        if (l.tbc) inner = '<span class="rdf-tbc">' + esc(l.label) + '</span>';
        else if (l.button) inner = '<button type="button" class="rdf-link" id="' + l.button + '">' + esc(l.label) + '</button>';
        else inner = '<a class="rdf-link" href="' + esc(l.href) + '"' + (l.ext ? ' target="_blank" rel="noopener"' : '') + (l.track ? ' data-track="' + l.track + '"' : '') + '>' +
          esc(l.label) + (l.badge ? '<span class="rdf-badge">' + esc(l.badge) + '</span>' : '') + '</a>';
        return '<li class="rdf-r" style="--d:' + d + '">' + inner + '</li>';
      }).join('') + '</ul></nav>';
  }).join('');
  var socials = SOCIALS.map(function (s, i) {
    return '<li class="rdf-r" style="--d:' + (380 + i * 60) + '"><a href="' + esc(s.href) + '" aria-label="' + esc(s.label) + '"' + (s.ext ? ' target="_blank" rel="noopener"' : '') + (s.track ? ' data-track="' + s.track + '"' : '') + '>' + ICONS[s.icon] + '</a></li>';
  }).join('');

  var root = document.createElement('footer');
  root.className = 'rdf-root';
  root.style.minHeight = CFG.height;
  var vars = { '--rdf-scene-min': CFG.sceneMin, '--rdf-paper': CFG.paper, '--rdf-ink': CFG.ink, '--rdf-muted': CFG.muted, '--rdf-line': CFG.line, '--rdf-accent': CFG.accent, '--rdf-small': CFG.small, '--rdf-navy': CFG.navy, '--rdf-max': CFG.maxWidth };
  Object.keys(vars).forEach(function (k) { root.style.setProperty(k, vars[k]); });
  root.innerHTML =
    '<div class="rdf-frame">' +
    '<div class="rdf-cta">' +
      '<div><p class="rdf-eyebrow rdf-r" style="--d:80">Private visits by appointment</p>' +
      '<h2 class="rdf-big rdf-r" style="--d:160">Come and see it<em>in person.</em></h2></div>' +
      '<div class="rdf-cta-side"><p class="rdf-r" style="--d:300">Photographs show the rooms. Only a visit shows the light moving across the marble from morning to dusk. Tell us when suits you.</p>' +
      '<div class="rdf-btns rdf-r" style="--d:400"><a class="rdf-btn solid" href="' + base + '#book">Book a private visit</a>' +
      '<a class="rdf-btn ghost" href="' + WA + '" target="_blank" rel="noopener" data-track="whatsapp">' + ICONS.whatsapp + 'WhatsApp</a></div></div>' +
    '</div>' +
    '<div class="rdf-top"><div class="rdf-brand">' +
      '<a class="rdf-logo rdf-r" style="--d:500" href="' + (isHome ? '#top' : 'index.html') + '" aria-label="Jakkur Villa, home"><span>JAKKUR VILLA</span><i></i></a>' +
      '<p class="rdf-tag rdf-r" style="--d:560">An ultra luxury, East-facing residence across six levels in Jakkur, North Bengaluru. Four years in the making.</p>' +
      '<ul class="rdf-social">' + socials + '</ul>' +
    '</div>' + cols + '</div>' +
    '<div class="rdf-bar rdf-r" style="--d:1250"><p>© ' + year + ' Jakkur Villa. All images are of the actual property. Details are subject to verification.</p><p class="facts">₹17.5 Cr · 11,500+ sq ft · Five suites · East facing</p></div>' +
    '<div class="rdf-scene"><canvas aria-hidden="true"></canvas></div></div>';
  host.parentNode.replaceChild(root, host);

  /* ---------- reveal ---------- */
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var revealAt = null;
  function reveal() { if (revealAt === null) revealAt = reduced ? -Infinity : performance.now(); root.classList.add('rdf-in'); wake(); }
  if ('IntersectionObserver' in window) {
    var rio = new IntersectionObserver(function (en) { if (en.some(function (e) { return e.isIntersecting; })) { reveal(); rio.disconnect(); } }, { threshold: 0.15 });
    rio.observe(root);
  } else reveal();

  /* ---------- canvas ---------- */
  var scene = root.querySelector('.rdf-scene'), canvas = scene.querySelector('canvas'), ctx = canvas.getContext('2d');
  if (!ctx) return;
  var layers = Math.max(2, Math.min(9, CFG.ridges)), seed = CFG.seed;
  var pal = new Uint32Array(CFG.tones.map(function (t) { return pack(hex(t) || [128, 128, 128]); })), nT = pal.length;
  var p = 2, C = 1, R = 1, margin = 2, img = null, buf = new Uint32Array(0), tops = [], pools = [];
  var colTop = new Float32Array(0), colSlope = new Float32Array(0), colPool = new Float32Array(0), fog = new Float32Array(0), fw = 1, fh = 1, ceil = 0, fadeTo = 1;
  var raf = 0, visible = true, awake = true, lastDraw = 0, lastTick = performance.now();
  var tx = 0, ty = 0, ex = 0, ey = 0, inside = false, clearA = 0, pt = 0, pe = 0, windV = 0, windX = 0;

  function layout() {
    var rect = scene.getBoundingClientRect();
    p = Math.max(1, Math.round(CFG.pixel));
    C = Math.max(8, Math.ceil(rect.width / p)); R = Math.max(8, Math.ceil(rect.height / p));
    canvas.width = C; canvas.height = R; canvas.style.width = C * p + 'px'; canvas.style.height = R * p + 'px';
    img = ctx.createImageData(C, R); buf = new Uint32Array(img.data.buffer);
    margin = Math.ceil(C * 0.045) + 3; ceil = Math.max(R * 0.17, 92 / p); fadeTo = Math.max(R * 0.3, 128 / p);
    tops = []; pools = [];
    for (var i = 0; i < layers; i++) {
      var t = ridgeline(C, R, i, layers, seed, margin);
      for (var x = 0; x < t.length; x++) if (t[x] < ceil) t[x] = ceil - (ceil - t[x]) * 0.2;
      var pool = new Float32Array(t.length);
      for (x = 0; x < t.length; x++) pool[x] = 0.45 + 1.1 * fbm(((x - margin) / C) * 4, i * 5.3, seed + 9, 2);
      tops.push(t); pools.push(pool);
    }
    colTop = new Float32Array(layers * C); colSlope = new Float32Array(layers * C); colPool = new Float32Array(layers * C);
    fw = (C >> 1) + 2; fh = (R >> 1) + 2; fog = new Float32Array(fw * fh); awake = true;
  }

  function draw(now) {
    if (!img) return;
    var dt = Math.min(64, now - lastTick); lastTick = now;
    var live = CFG.interactive && !reduced, age = revealAt === null ? -1 : now - revealAt;
    var e1 = 1 - Math.pow(0.82, dt / 16.7), e2 = 1 - Math.pow(0.93, dt / 16.7);
    ex += (tx - ex) * e1; ey += (ty - ey) * e1;
    clearA += ((inside && CFG.interactive ? 1 : 0) - clearA) * e2;
    pe += ((live ? pt : 0) - pe) * e2;
    windV *= Math.pow(0.965, dt / 16.7); windX += (windV * dt) / 1000;
    var fogT = (reduced ? 0 : (now / 1000) * 0.045 * Math.max(0, CFG.drift)) + windX;
    var sx = 9 / C, sy = 4.4 / R, gx, gy;
    for (gy = 0; gy < fh; gy++) {
      var ny = gy * sy;
      for (gx = 0; gx < fw; gx++) {
        var nx = gx * sx + fogT, warp = noise(nx * 0.45 - fogT * 0.6, ny * 0.8, 77) * 0.6;
        fog[gy * fw + gx] = smooth(0.3, 0.74, fbm(nx + warp, ny + warp * 0.4, 31, 3));
      }
    }
    var rev = new Float32Array(layers), k = new Float32Array(layers), toneBase = new Float32Array(layers), i, x, y;
    for (i = 0; i < layers; i++) {
      k[i] = i / (layers - 1);
      rev[i] = age < 0 ? 0 : ease((age - 380 - i * 170) / 1300);
      toneBase[i] = 0.16 + 0.76 * Math.pow(k[i], 1.6);
      var fogDepth = R * (0.08 + 0.42 * k[i]), rise = (1 - rev[i]) * R * 0.09;
      var shift = Math.round(pe * (0.25 + k[i]) * 0.75 * (margin - 3)), t = tops[i], last = t.length - 1;
      for (x = 0; x < C; x++) {
        var at = x + margin + shift;
        colTop[i * C + x] = t[at] + rise;
        colSlope[i * C + x] = t[Math.min(last, at + 2)] - t[Math.max(0, at - 2)];
        colPool[i * C + x] = fogDepth * pools[i][at];
      }
    }
    var lift = age < 0 ? 1 : 1 - ease((age - 900) / 1800);
    var mistK = Math.max(0, Math.min(1, CFG.mist)), r = Math.max(1, CFG.radius / p), r2 = r * r;
    for (y = 0; y < R; y++) {
      var fade = smooth(0, fadeTo, y), frow = (y >> 1) * fw, by = (y & 7) * 8, dyc = (y - ey) * 1.5;
      for (x = 0; x < C; x++) {
        var L = -1;
        for (i = layers - 1; i >= 0; i--) { if (y >= colTop[i * C + x]) { L = i; break; } }
        var tone = 0, mk = 0.3;
        if (L >= 0) {
          var kk = k[L], d = y - colTop[L * C + x], depth = colPool[L * C + x];
          tone = toneBase[L] * (1 - smooth(0, depth, d) * (0.88 - 0.45 * kk));
          var sl = colSlope[L * C + x] * 0.06;
          tone += (sl < -0.2 ? -0.2 : sl > 0.2 ? 0.2 : sl) * (1 - smooth(0, depth * 0.5, d));
          tone += (hash(x + Math.round(colTop[L * C + x] * 7), d | 0, L) - 0.5) * 0.07 * kk;
          tone *= rev[L]; mk = 0.95 - 0.5 * kk;
        } else tone = 0.05 * smooth(R * 0.15, R * 0.6, y);
        var m = fog[frow + (x >> 1)] * mistK * mk;
        if (clearA > 0.01) {
          var dx = x - ex, q = (dx * dx + dyc * dyc) / r2;
          if (q < 4) { var c = clearA * Math.exp(-q); m *= 1 - c * 0.92; if (L >= 0) tone += c * 0.16 * rev[L]; }
        }
        if (tone > 0.93) tone = 0.93;
        m += lift * 0.55; if (m > 1) m = 1;
        tone = (tone * (1 - m) + 0.09 * m * (1 - lift)) * fade;
        buf[y * C + x] = pal[dither(tone, nT, BAYER[by + (x & 7)])];
      }
    }
    ctx.putImageData(img, 0, 0);
    var settling = Math.abs(tx - ex) + Math.abs(ty - ey) > 0.05 || Math.abs((inside && CFG.interactive ? 1 : 0) - clearA) > 0.005 ||
      Math.abs((live ? pt : 0) - pe) > 0.001 || Math.abs(windV) > 0.002;
    awake = (age >= 0 && age < 3400) || age < 0 || settling || (!reduced && CFG.drift > 0);
  }

  function busy() {
    var age = revealAt === null ? -1 : performance.now() - revealAt;
    return (age >= 0 && age < 3400) || inside || Math.abs(windV) > 0.002 || Math.abs(pt - pe) > 0.001;
  }
  function loop(now) {
    raf = 0;
    if (!visible) return;
    if (revealAt === null) { raf = requestAnimationFrame(loop); return; }
    if (busy() || now - lastDraw > 32) { draw(now); lastDraw = now; }
    if (awake) raf = requestAnimationFrame(loop);
  }
  function wake() { awake = true; if (!raf && visible) raf = requestAnimationFrame(loop); }

  root.addEventListener('pointermove', function (e) {
    if (!CFG.interactive) return;
    var b = root.getBoundingClientRect(); pt = b.width > 0 ? ((e.clientX - b.left) / b.width) * 2 - 1 : 0;
    var s = scene.getBoundingClientRect(), lx = (e.clientX - s.left) / p, ly = (e.clientY - s.top) / p, was = inside;
    inside = lx >= 0 && ly >= 0 && lx < C && ly < R; tx = lx; ty = ly;
    if (inside && !was) { ex = tx; ey = ty; }
    wake();
  });
  root.addEventListener('pointerleave', function () { pt = 0; inside = false; wake(); });
  root.addEventListener('pointerdown', function (e) {
    if (!CFG.interactive || reduced || !inside) return;
    if (e.target.closest('a,button')) return;
    windV += tx < C / 2 ? 1.4 : -1.4; wake();
  });

  layout(); draw(performance.now()); wake();
  if ('ResizeObserver' in window) {
    var lastW = 0, lastH = 0;
    new ResizeObserver(function () {
      var rc = scene.getBoundingClientRect();
      if (Math.abs(rc.width - lastW) < 1 && Math.abs(rc.height - lastH) < 1) return;
      lastW = rc.width; lastH = rc.height; layout(); draw(performance.now()); wake();
    }).observe(scene);
  }
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (en) {
      visible = en[0] ? en[0].isIntersecting : true;
      if (visible) { lastTick = performance.now(); wake(); }
    }).observe(root);
  }
})();
