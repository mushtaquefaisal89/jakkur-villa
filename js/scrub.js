/* Jakkur Villa — scroll-tied hero.
   A 500vh track with a sticky full-screen scene. Scroll progress p (0–1) drives:
   - the villa video's playback position (never autoplayed), eased with a lerp, or
   - until a video exists, a slow cross-fading sequence of the villa's own photos;
   - three text sections that appear one after another.
   To switch to video: put the villa film at  jakkur-villa/video/villa.mp4  (it is detected automatically).
   Tip: for the smoothest scrubbing, export the mp4 with a keyframe every few frames. */
(function () {
  'use strict';
  var VIDEO_SRC = 'video/villa.mp4';
  var LERP_TAU = 8, SNAP = 0.002;

  var track = document.querySelector('.scrub');
  if (!track) return;
  var photos = Array.prototype.slice.call(track.querySelectorAll('.scrub-photo'));
  var video = track.querySelector('.scrub-video');
  var secs = Array.prototype.slice.call(track.querySelectorAll('.scrub-sec'));
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var span = 1;
  function measure() { span = Math.max(1, track.offsetHeight - window.innerHeight); }
  measure();
  window.addEventListener('resize', measure);
  window.addEventListener('orientationchange', function () { setTimeout(measure, 200); });

  function progress() {
    var y = (window.scrollY || window.pageYOffset) - track.offsetTop;
    return Math.min(1, Math.max(0, y / span));
  }

  /* section opacities — same curves as the brief */
  function s1(p) { return p < 0.20 ? 1 : Math.max(0, 1 - (p - 0.20) / 0.08); }
  function s2(p) { return p < 0.32 ? 0 : p < 0.40 ? (p - 0.32) / 0.08 : p < 0.55 ? 1 : Math.max(0, 1 - (p - 0.55) / 0.08); }
  function s3(p) { return p < 0.67 ? 0 : p < 0.75 ? (p - 0.67) / 0.08 : 1; }
  var curves = [s1, s2, s3];

  function applyText(p) {
    secs.forEach(function (el, i) {
      var o = curves[i](p);
      el.style.opacity = o.toFixed(3);
      el.classList.toggle('show', o > 0.3);
      el.classList.toggle('live', o > 0.5);
      el.setAttribute('aria-hidden', o > 0.5 ? 'false' : 'true');
    });
  }

  /* photo sequence: cross-fade at each boundary, slow push-in within each photo's range */
  var FADE = 0.06;
  function applyPhotos(c) {
    photos.forEach(function (img, i) {
      var a = +img.dataset.from, b = +img.dataset.to, o;
      if (i === 0) o = c < b - FADE / 2 ? 1 : c > b + FADE / 2 ? 0 : (b + FADE / 2 - c) / FADE;
      else if (i === photos.length - 1) o = c < a - FADE / 2 ? 0 : c > a + FADE / 2 ? 1 : (c - (a - FADE / 2)) / FADE;
      else o = Math.min(c < a - FADE / 2 ? 0 : c > a + FADE / 2 ? 1 : (c - (a - FADE / 2)) / FADE,
                        c < b - FADE / 2 ? 1 : c > b + FADE / 2 ? 0 : (b + FADE / 2 - c) / FADE);
      img.style.opacity = o.toFixed(3);
      if (!reduced) {
        var local = Math.min(1, Math.max(0, (c - a) / Math.max(0.01, b - a)));
        img.style.transform = 'scale(' + (1.12 - 0.12 * local).toFixed(4) + ')';
      }
    });
  }

  /* video mode */
  var useVideo = false, dur = 0;
  function enableVideo() {
    video.src = VIDEO_SRC;
    video.muted = true;
    video.addEventListener('loadedmetadata', function () {
      dur = video.duration || 0;
      if (!dur) return;
      useVideo = true;
      video.hidden = false;
      photos.forEach(function (p) { p.style.display = 'none'; });
      track.classList.add('video-mode');
    }, { once: true });
    video.load();
  }
  if (video && window.fetch) {
    fetch(VIDEO_SRC, { method: 'HEAD' }).then(function (r) {
      var type = r.headers.get('content-type') || '';
      if (r.ok && /video|octet/.test(type)) enableVideo();
    }).catch(function () {});
  }

  /* rAF loop: eased current chases the scroll target */
  var current = progress(), last = performance.now(), running = false;
  function frame(now) {
    var dt = Math.min(0.1, (now - last) / 1000); last = now;
    var target = progress();
    if (reduced) current = target;
    else { current += (target - current) * (1 - Math.exp(-dt * LERP_TAU)); if (Math.abs(target - current) < SNAP) current = target; }
    applyText(target);
    if (useVideo && dur > 0) {
      var t = current * dur;
      if (!video.seeking && Math.abs(video.currentTime - t) > 0.01) { try { video.currentTime = t; } catch (e) {} }
    } else applyPhotos(current);
    if (running) requestAnimationFrame(frame);
  }
  function start() { if (!running) { running = true; last = performance.now(); requestAnimationFrame(frame); } }
  function stop() { running = false; }
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (en) { if (en[0].isIntersecting) start(); else stop(); }, { rootMargin: '100px 0px' }).observe(track);
  } else start();
  applyText(progress()); applyPhotos(current);
})();
