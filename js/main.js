/* Jakkur Villa — site behaviour (no dependencies) */
(function () {
  'use strict';

  /* ===== Settings you can change ===== */
  var CONFIG = {
    whatsapp: '919743107607',
    email: 'jakkurvilla@gmail.com',
    // Free form-to-email service. Create a key at https://web3forms.com with jakkurvilla@gmail.com
    // and paste it here. While empty, bookings are sent to the owner via WhatsApp instead.
    web3formsKey: '',
    // 360° tour link (Matterport / Kuula). Leave empty to show "Request a live video walkthrough".
    tourUrl: '',
    // Plausible analytics domain, e.g. 'jakkurvilla.com'. Loaded only after cookie consent.
    plausibleDomain: '',
    brochureUrl: 'brochure/jakkur-villa-brochure.pdf'
  };

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };

  /* ===== Analytics (consent-gated) ===== */
  function track(name, props) {
    if (window.plausible) { try { window.plausible(name, props ? { props: props } : undefined); } catch (e) {} }
  }
  function loadAnalytics() {
    if (!CONFIG.plausibleDomain || window.plausible) return;
    var s = document.createElement('script');
    s.defer = true; s.dataset.domain = CONFIG.plausibleDomain; s.src = 'https://plausible.io/js/script.js';
    document.head.appendChild(s);
    window.plausible = window.plausible || function () { (window.plausible.q = window.plausible.q || []).push(arguments); };
  }
  function getConsent() { try { return localStorage.getItem('jv-consent'); } catch (e) { return null; } }
  function setConsent(v) { try { localStorage.setItem('jv-consent', v); } catch (e) {} }
  var cookie = $('#cookie');
  if (cookie) {
    var c = getConsent();
    if (c === 'yes') loadAnalytics();
    else if (!c) setTimeout(function () { cookie.classList.add('show'); }, 2600);
    $$('[data-consent]', cookie).forEach(function (b) {
      b.addEventListener('click', function () {
        setConsent(b.dataset.consent); cookie.classList.remove('show');
        if (b.dataset.consent === 'yes') loadAnalytics();
      });
    });
  }
  document.addEventListener('click', function (e) {
    var t = e.target.closest('[data-track]');
    if (t) track(t.dataset.track === 'whatsapp' ? 'WhatsApp click' : 'Call click');
  });

  /* ===== Intro curtain ===== */
  var intro = $('.intro');
  function ready() { document.body.classList.add('ready'); }
  if (intro && !reduceMotion) {
    var introDelay = 1500;
    try { if (sessionStorage.getItem('jv-intro')) introDelay = 300; sessionStorage.setItem('jv-intro', '1'); } catch (e) {}
    setTimeout(function () {
      intro.classList.add('done'); ready();
      setTimeout(function () { intro.remove(); }, 1400);
    }, introDelay);
  } else { if (intro) intro.remove(); ready(); }

  /* ===== Header, progress, parallax ===== */
  var header = $('.site-header');
  var progress = $('.progress');
  var parallax = $$('[data-parallax]');
  var ticking = false;
  function onScroll() {
    var y = window.scrollY || window.pageYOffset;
    if (header) header.classList.toggle('scrolled', y > 40);
    var h = document.documentElement.scrollHeight - window.innerHeight;
    if (progress) progress.style.transform = 'scaleX(' + (h > 0 ? Math.min(1, y / h) : 0) + ')';
    if (!reduceMotion) {
      var vh = window.innerHeight;
      parallax.forEach(function (img) {
        var r = img.parentElement.getBoundingClientRect();
        if (r.bottom < -100 || r.top > vh + 100) return;
        var p = (r.top + r.height / 2 - vh / 2) / (vh + r.height);
        img.style.transform = 'translate3d(0,' + (p * -12).toFixed(2) + '%,0)';
      });
    }
    ticking = false;
  }
  window.addEventListener('scroll', function () { if (!ticking) { requestAnimationFrame(onScroll); ticking = true; } }, { passive: true });
  window.addEventListener('resize', onScroll);
  onScroll();

  /* ===== Mobile menu ===== */
  var toggle = $('.menu-toggle'), menu = $('#mobile-menu');
  function setMenu(open) {
    document.body.classList.toggle('menu-open', open);
    menu.classList.toggle('open', open);
    menu.setAttribute('aria-hidden', String(!open));
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
  }
  if (toggle && menu) {
    toggle.addEventListener('click', function () { setMenu(!menu.classList.contains('open')); });
    $$('a', menu).forEach(function (a) { a.addEventListener('click', function () { setMenu(false); }); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && menu.classList.contains('open')) setMenu(false); });
  }

  /* ===== Reveal on scroll ===== */
  var revealEls = $$('.reveal, .split-lines, .stagger, .draw');
  var clipEls = $$('.reveal-clip');
  if ('IntersectionObserver' in window && !reduceMotion) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    revealEls.forEach(function (el) { io.observe(el); });
    // Clipped elements are invisible to the observer, so watch their (unclipped) parent instead.
    var clipIo = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        clipIo.unobserve(en.target);
        clipEls.filter(function (c) { return c.parentElement === en.target; }).forEach(function (c, i) {
          setTimeout(function () { c.classList.add('in'); }, i * 140);
        });
      });
    }, { rootMargin: '0px 0px -10% 0px', threshold: 0 });
    var parents = [];
    clipEls.forEach(function (c) { if (parents.indexOf(c.parentElement) < 0) parents.push(c.parentElement); });
    parents.forEach(function (p) { clipIo.observe(p); });
  } else {
    revealEls.concat(clipEls).forEach(function (el) { el.classList.add('in'); });
  }
  // Safety net: on fast scrolls or anchor jumps, reveal anything in or above the viewport.
  var pending = revealEls.concat(clipEls);
  function sweep() {
    if (!pending.length) return;
    var vh = window.innerHeight;
    pending = pending.filter(function (el) {
      if (el.classList.contains('in')) return false;
      var r = (el.classList.contains('reveal-clip') ? el.parentElement : el).getBoundingClientRect();
      if (r.top < vh * 0.94) { el.classList.add('in'); return false; }
      return true;
    });
  }
  var sweepT = null;
  window.addEventListener('scroll', function () { if (!sweepT) sweepT = setTimeout(function () { sweepT = null; sweep(); }, 120); }, { passive: true });
  window.addEventListener('load', sweep);
  window.addEventListener('hashchange', function () { setTimeout(sweep, 50); });

  /* ===== Count-up numbers ===== */
  function fmt(n, el) {
    var dec = +(el.dataset.dec || 0), pad = +(el.dataset.pad || 0);
    var s = n.toFixed(dec);
    if (el.dataset.sep) s = Math.round(n).toLocaleString('en-IN');
    if (pad) s = String(Math.round(n)).padStart(pad, '0');
    return s;
  }
  var counters = $$('[data-count]');
  if ('IntersectionObserver' in window && !reduceMotion) {
    var cio = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        var el = en.target, end = parseFloat(el.dataset.count), t0 = null, dur = 1600;
        cio.unobserve(el);
        function step(ts) {
          if (!t0) t0 = ts;
          var k = Math.min(1, (ts - t0) / dur), e = 1 - Math.pow(1 - k, 3);
          el.textContent = fmt(end * e, el);
          if (k < 1) requestAnimationFrame(step); else el.textContent = fmt(end, el);
        }
        el.textContent = fmt(0, el);
        requestAnimationFrame(step);
      });
    }, { threshold: 0.4 });
    counters.forEach(function (el) { cio.observe(el); });
  }

  /* ===== Level explorer (tabs) ===== */
  var tabs = $$('.level-tab');
  function selectTab(tab, focus) {
    tabs.forEach(function (t) {
      var on = t === tab;
      t.setAttribute('aria-selected', String(on));
      t.tabIndex = on ? 0 : -1;
      var panel = document.getElementById(t.getAttribute('aria-controls'));
      if (panel) { panel.hidden = !on; if (on) { panel.classList.remove('fade-in'); void panel.offsetWidth; panel.classList.add('fade-in'); } }
    });
    if (focus) tab.focus();
    if (tab.scrollIntoView && window.innerWidth < 1100) tab.scrollIntoView({ block: 'nearest', inline: 'center', behavior: reduceMotion ? 'auto' : 'smooth' });
  }
  tabs.forEach(function (t, i) {
    t.addEventListener('click', function () { selectTab(t); });
    t.addEventListener('keydown', function (e) {
      var k = e.key, n = null;
      if (k === 'ArrowDown' || k === 'ArrowRight') n = tabs[(i + 1) % tabs.length];
      if (k === 'ArrowUp' || k === 'ArrowLeft') n = tabs[(i - 1 + tabs.length) % tabs.length];
      if (k === 'Home') n = tabs[0];
      if (k === 'End') n = tabs[tabs.length - 1];
      if (n) { e.preventDefault(); selectTab(n, true); }
    });
  });

  /* ===== Gallery data ===== */
  var G = [
    ['exterior-dusk-facade', 'exterior', 'The facade at dusk'],
    ['entrance-teak-door-and-windows', 'exterior', 'Ten foot teak entrance with brass inlay'],
    ['level00-motor-court-parking', 'exterior', 'Motor court for six cars'],
    ['specifications-teak-windows', 'exterior', 'Teak windows, bulletproof glazing'],
    ['level01-living-hall-marble-tv-wall', 'living', 'Living hall, 20 ft ceiling'],
    ['level01-living-hall-from-above', 'living', 'The living hall seen from above'],
    ['living-hall-double-height-wide', 'living', 'Double height living'],
    ['level01-pooja-room-and-lift', 'living', 'Pooja room in carved gold, brass and teak'],
    ['level01-teak-entrance-door-brass', 'living', 'Teak entrance with brass fittings'],
    ['staircase-floating-marble', 'living', 'A staircase that floats'],
    ['staircase-teak-ceiling', 'living', 'Teak ceiling and floating staircase'],
    ['level00-home-office', 'living', 'Home office'],
    ['level00-schindler-lift', 'living', 'Schindler lift, parking to the top floor'],
    ['level01-hafele-kitchen', 'kitchen', 'Fully Hafele fitted kitchen'],
    ['level01-dining', 'kitchen', 'Dining with marble table'],
    ['level01-kitchen-tall-units', 'kitchen', 'Concealed refrigerator, built-in oven'],
    ['level02-master-suite', 'suites', 'Master suite, 7 × 7 ft cot'],
    ['level02-master-suite-detail', 'suites', 'Pure leather headboard, teak panelling'],
    ['suite-leather-wall-art', 'suites', 'Leather wall art, wood pattern floor'],
    ['suite-teak-panelled-study-desk', 'suites', 'Teak panelled suite with study desk'],
    ['suite-balcony-bedroom', 'suites', 'Suite with 8 × 20 ft private balcony'],
    ['suite-study-onyx-wall', 'suites', 'Study, onyx wall and teak cabinetry'],
    ['level03-home-theatre-recliners', 'leisure', '₹80 lakh private cinema'],
    ['level03-theatre-screen', 'leisure', 'Cinema screen wall'],
    ['level03-theatre-projector-starlit-ceiling', 'leisure', '8K JVC projector, starlit ceiling'],
    ['level03-theatre-recliner-detail', 'leisure', 'Leather two way recliners'],
    ['level03-family-lounge-light-lines', 'leisure', 'Family lounge, lines of light'],
    ['level03-family-lounge', 'leisure', 'Family lounge'],
    ['level04-home-gym', 'wellness', '₹25 lakh home gym'],
    ['level04-jacuzzi', 'wellness', 'Six-seater jacuzzi'],
    ['level04-jacuzzi-and-steam-room', 'wellness', 'Jacuzzi and Kohler steam room'],
    ['level04-shower', 'wellness', 'Grohe rain shower, Kohler fittings'],
    ['balcony-after-dark', 'evenings', 'Evenings above the city'],
    ['balcony-evening', 'evenings', 'Upper balcony at dusk'],
    ['balcony-night-lounge', 'evenings', 'Balcony lounge'],
    ['level03-balcony-bar-counter-night', 'evenings', 'Outdoor kitchen and bar counter']
  ];
  var DIM = { 'exterior-dusk-facade': [800, 1199] };
  var masonry = $('#masonry');
  var visible = G.slice();
  if (masonry) {
    var frag = document.createDocumentFragment();
    G.forEach(function (g, i) {
      var b = document.createElement('button');
      b.type = 'button'; b.dataset.cat = g[1]; b.dataset.idx = i;
      b.setAttribute('aria-label', 'Open photo: ' + g[2]);
      var d = DIM[g[0]] || [800, 534];
      b.innerHTML = '<img src="images/' + g[0] + '-sm.jpg" loading="lazy" decoding="async" width="' + d[0] + '" height="' + d[1] + '" alt="' + g[2] + '"><span class="cap">' + g[2] + '</span>';
      frag.appendChild(b);
    });
    masonry.appendChild(frag);
    masonry.addEventListener('click', function (e) {
      var b = e.target.closest('button'); if (!b) return;
      var list = $$('button:not(.hide)', masonry).map(function (x) { return G[+x.dataset.idx]; });
      openLb(list, list.indexOf(G[+b.dataset.idx]));
    });
  }
  $$('.chip').forEach(function (chip) {
    chip.addEventListener('click', function () {
      var f = chip.dataset.filter;
      $$('.chip').forEach(function (c) { c.setAttribute('aria-pressed', String(c === chip)); });
      $$('button', masonry).forEach(function (b) { b.classList.toggle('hide', f !== 'all' && b.dataset.cat !== f); });
    });
  });

  /* ===== Lightbox ===== */
  var lb = $('#lightbox'), lbImg = lb && $('img', lb), lbT = lb && $('.t', lb), lbC = lb && $('.count', lb);
  var lbList = [], lbI = 0, lastFocus = null;
  function showLb() {
    var g = lbList[lbI];
    lbImg.src = 'images/' + g[0] + '.jpg'; lbImg.alt = g[2];
    lbT.textContent = g[2]; lbC.textContent = (lbI + 1) + ' / ' + lbList.length;
  }
  function openLb(list, i) {
    if (!lb) return;
    lbList = list; lbI = Math.max(0, i); lastFocus = document.activeElement;
    showLb(); lb.classList.add('open'); document.body.style.overflow = 'hidden';
    $('.lb-close', lb).focus();
  }
  function closeLb() { lb.classList.remove('open'); document.body.style.overflow = ''; if (lastFocus) lastFocus.focus(); }
  function step(d) { lbI = (lbI + d + lbList.length) % lbList.length; showLb(); }
  if (lb) {
    $('.lb-close', lb).addEventListener('click', closeLb);
    $('.lb-prev', lb).addEventListener('click', function () { step(-1); });
    $('.lb-next', lb).addEventListener('click', function () { step(1); });
    lb.addEventListener('click', function (e) { if (e.target === lb) closeLb(); });
    document.addEventListener('keydown', function (e) {
      if (!lb.classList.contains('open')) return;
      if (e.key === 'Escape') closeLb();
      if (e.key === 'ArrowLeft') step(-1);
      if (e.key === 'ArrowRight') step(1);
      if (e.key === 'Tab') { // keep focus inside
        var f = $$('button', lb), first = f[0], last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    });
    var sx = null;
    lb.addEventListener('touchstart', function (e) { sx = e.touches[0].clientX; }, { passive: true });
    lb.addEventListener('touchend', function (e) {
      if (sx === null) return; var dx = e.changedTouches[0].clientX - sx;
      if (Math.abs(dx) > 50) step(dx < 0 ? 1 : -1); sx = null;
    });
  }
  // suite cards open in lightbox
  var suiteList = $$('.suite-card').map(function (b) { return G.filter(function (g) { return g[0] === b.dataset.lb; })[0]; });
  $$('.suite-card').forEach(function (b, i) { b.addEventListener('click', function () { openLb(suiteList, i); }); });

  /* ===== 360 tour ===== */
  var tourStart = $('#tour-start');
  if (CONFIG.tourUrl && tourStart) {
    tourStart.hidden = false;
    $('#tour-text').textContent = 'Walk through every level at your own pace. The tour loads only when you start it.';
    tourStart.addEventListener('click', function () {
      track('Tour opened');
      $('#tour-slot').innerHTML = '<iframe class="tour-frame" src="' + encodeURI(CONFIG.tourUrl) + '" title="Jakkur Villa 360° virtual tour" allow="fullscreen; xr-spatial-tracking" allowfullscreen></iframe>';
    });
  }

  /* ===== Prefill request type from links ===== */
  $$('[data-request]').forEach(function (a) {
    a.addEventListener('click', function () {
      var sel = $('#f-type'); if (!sel) return;
      $$('option', sel).forEach(function (o) { if (o.textContent === a.dataset.request) sel.value = o.value || o.textContent; });
    });
  });

  /* ===== EMI calculator ===== */
  function inr(n) { return '₹' + Math.round(n).toLocaleString('en-IN'); }
  function short(n) {
    if (n >= 1e7) return '₹' + (n / 1e7).toFixed(2).replace(/\.?0+$/, '') + ' Cr';
    if (n >= 1e5) return '₹' + (n / 1e5).toFixed(2).replace(/\.?0+$/, '') + ' L';
    return inr(n);
  }
  var ePrice = $('#emi-price');
  function calcEmi() {
    var price = +ePrice.value, downPct = +$('#emi-down').value, rate = +$('#emi-rate').value, yrs = +$('#emi-years').value;
    var P = price * (1 - downPct / 100), r = rate / 12 / 100, n = yrs * 12;
    var emi = r === 0 ? P / n : P * r * Math.pow(1 + r, n) / (Math.pow(1 + r, n) - 1);
    var total = emi * n, interest = total - P;
    $('#o-price').textContent = short(price);
    $('#o-down').textContent = downPct + '% · ' + short(price * downPct / 100);
    $('#o-rate').textContent = rate.toFixed(2) + '%';
    $('#o-years').textContent = yrs + ' years';
    $('#r-emi').textContent = inr(emi);
    $('#r-emi-short').textContent = short(emi) + ' per month for ' + n + ' months';
    $('#r-loan').textContent = short(P);
    $('#r-int').textContent = short(interest);
    $('#r-total').textContent = short(total);
    var pct = total > 0 ? (interest / total) * 100 : 0;
    $('#donut-int').setAttribute('stroke-dasharray', pct.toFixed(2) + ' ' + (100 - pct).toFixed(2));
  }
  if (ePrice) {
    $$('#emi input[type=range]').forEach(function (i) { i.addEventListener('input', calcEmi); });
    calcEmi();
  }

  /* ===== Forms ===== */
  var dateInput = $('#f-date');
  if (dateInput) {
    var t = new Date(); t.setDate(t.getDate() + 1);
    dateInput.min = t.toISOString().slice(0, 10);
  }
  function setErr(input, msg) {
    var f = input.closest('.f'); if (!f) return;
    f.classList.toggle('invalid', !!msg);
    var e = $('.err', f); if (e) e.textContent = msg || '';
    input.setAttribute('aria-invalid', msg ? 'true' : 'false');
  }
  function validPhone(v, cc) {
    var d = v.replace(/[^\d]/g, '');
    if (cc === '+91') return /^[6-9]\d{9}$/.test(d.replace(/^0/, ''));
    return d.length >= 6 && d.length <= 14;
  }
  var lastSend = 0;
  function sendLead(data, subject) {
    if (!CONFIG.web3formsKey) return Promise.resolve(false);
    var body = Object.assign({ access_key: CONFIG.web3formsKey, subject: subject, from_name: 'Jakkur Villa website' }, data);
    return fetch('https://api.web3forms.com/submit', {
      method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify(body)
    }).then(function (r) { return r.json(); }).then(function (j) { if (!j.success) throw new Error(j.message || 'Failed'); return true; });
  }
  function utm() {
    var p = new URLSearchParams(location.search), o = {};
    ['utm_source', 'utm_medium', 'utm_campaign'].forEach(function (k) { if (p.get(k)) o[k] = p.get(k); });
    return o;
  }

  var form = $('#book-form');
  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var name = $('#f-name'), phone = $('#f-phone'), cc = $('#f-cc'), email = $('#f-email'), date = $('#f-date'), consent = $('#f-consent');
      var ok = true;
      setErr(name, name.value.trim().length < 2 ? 'Please enter your name.' : ''); if (name.value.trim().length < 2) ok = false;
      var pOk = validPhone(phone.value, cc.value); setErr(phone, pOk ? '' : 'Please enter a valid phone number.'); if (!pOk) ok = false;
      var eOk = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.value.trim()); setErr(email, eOk ? '' : 'Please enter a valid email.'); if (!eOk) ok = false;
      var dOk = date.value && date.value >= date.min; setErr(date, dOk ? '' : 'Please choose a date from tomorrow onwards.'); if (!dOk) ok = false;
      setErr(consent, consent.checked ? '' : 'Please tick this box so we can contact you.'); if (!consent.checked) ok = false;
      if (!ok) { var bad = $('.invalid input, .invalid select', form); if (bad) bad.focus(); return; }
      if ($('#f-company').value) { done(); return; } // honeypot: silently ignore bots
      if (Date.now() - lastSend < 20000) { $('#form-note').textContent = 'Thank you, your request is already on its way.'; return; }
      lastSend = Date.now();

      var slot = ($('input[name=slot]:checked', form) || {}).value || '';
      var data = Object.assign({
        name: name.value.trim(), phone: cc.value + ' ' + phone.value.trim(), email: email.value.trim(),
        request_type: $('#f-type').value, buyer_type: $('#f-buyer').value, preferred_date: date.value,
        preferred_time: slot, message: $('#f-msg').value.trim()
      }, utm());
      var btn = $('button[type=submit]', form);
      btn.classList.add('loading'); btn.disabled = true; $('.txt', btn).textContent = 'Sending…';

      sendLead(data, 'New visit request: ' + data.name + ', ' + data.preferred_date).then(function (sent) {
        track('Visit booked', { type: data.request_type });
        if (!sent) {
          var msg = 'Hi, I would like to book a visit to Jakkur Villa.\n\n' +
            'Name: ' + data.name + '\nPhone: ' + data.phone + '\nEmail: ' + data.email +
            '\nRequest: ' + data.request_type + '\nI am: ' + data.buyer_type +
            '\nPreferred date: ' + data.preferred_date + ' (' + data.preferred_time + ')' +
            (data.message ? '\nMessage: ' + data.message : '');
          var waUrl = 'https://wa.me/' + CONFIG.whatsapp + '?text=' + encodeURIComponent(msg);
          var win = window.open(waUrl, '_blank');
          if (win) { try { win.opener = null; } catch (err) {} }
          else setTimeout(function () { location.href = waUrl; }, 1200);
        }
        done(sent);
      }).catch(function () {
        btn.classList.remove('loading'); btn.disabled = false; $('.txt', btn).textContent = 'Request my visit';
        $('#form-note').innerHTML = 'Something went wrong. Please <a href="tel:+919743107607">call</a> or <a href="https://wa.me/' + CONFIG.whatsapp + '" target="_blank" rel="noopener">WhatsApp</a> us.';
        lastSend = 0;
      });
    });
  }
  function done(sentByEmail) {
    var card = $('#form-card');
    card.innerHTML = '<div class="form-success"><p class="label" style="justify-content:center"><span class="num">Received</span></p>' +
      '<h3>Thank you.</h3><p>' + (sentByEmail === false
        ? 'WhatsApp has opened with your request. Please press send and we will confirm your visit shortly.'
        : 'We will call you shortly to confirm your private visit.') + '</p>' +
      '<a class="btn btn-primary" style="margin-top:14px" href="https://wa.me/' + CONFIG.whatsapp + '?text=Hi%2C%20I%27m%20interested%20in%20Jakkur%20Villa." target="_blank" rel="noopener">WhatsApp us</a></div>';
    card.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'center' });
  }

  /* ===== Brochure dialog ===== */
  var bd = $('#brochure-dialog'), bbtn = $('#brochure-btn');
  function closeBd() { bd.classList.remove('open'); document.body.style.overflow = ''; if (bbtn) bbtn.focus(); }
  if (bd && bbtn) {
    bbtn.addEventListener('click', function () { bd.classList.add('open'); document.body.style.overflow = 'hidden'; $('#b-name').focus(); });
    $('.lb-close', bd).addEventListener('click', closeBd);
    bd.addEventListener('click', function (e) { if (e.target === bd) closeBd(); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && bd.classList.contains('open')) closeBd(); });
    $('#brochure-form').addEventListener('submit', function (e) {
      e.preventDefault();
      var n = $('#b-name'), p = $('#b-phone');
      var ok1 = n.value.trim().length >= 2, ok2 = p.value.replace(/[^\d]/g, '').length >= 8;
      setErr(n, ok1 ? '' : 'Please enter your name.'); setErr(p, ok2 ? '' : 'Please enter a valid phone number.');
      if (!ok1 || !ok2) return;
      if (!$('input[name=company]', bd).value) {
        sendLead(Object.assign({ name: n.value.trim(), phone: p.value.trim(), request_type: 'Brochure download' }, utm()), 'Brochure download: ' + n.value.trim()).catch(function () {});
        track('Brochure download');
      }
      var a = document.createElement('a'); a.href = CONFIG.brochureUrl; a.download = 'Jakkur-Villa-Brochure.pdf';
      document.body.appendChild(a); a.click(); a.remove();
      closeBd();
    });
  }

  var yr = $('#year'); if (yr) yr.textContent = new Date().getFullYear();
  // Footer "Download brochure" on other pages links here with ?brochure=1
  if (bbtn && /[?&]brochure=1/.test(location.search)) setTimeout(function () { bbtn.click(); }, 1800);
})();
