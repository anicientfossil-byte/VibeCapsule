/* VibeCapsule scroll intro: canvas frame sequence scrubbed by GSAP ScrollTrigger.
   Plays once at the top of the page. When the user scrolls into the app, the intro is
   removed for good, so scrolling back up stops at the playlist link box. */
(function () {
  'use strict';
  var root = document.documentElement;
  function ready() { root.classList.remove('vc-pending'); }

  var header = document.querySelector('header');
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  // Coming back from Spotify login (?code=...) should land straight in the app.
  var returning = window.__vcReturning || /[?&](code|error)=/.test(location.search);
  if (!header || reduce || returning || !window.gsap || !window.ScrollTrigger) { ready(); return; }
  gsap.registerPlugin(ScrollTrigger);

  var N = 180;
  var src = function (i) { return 'frames/f' + String(i + 1).padStart(3, '0') + '.jpg'; };
  var BG = '#EEECDF';

  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
  window.scrollTo(0, 0);

  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text) e.textContent = text;
    return e;
  }

  /* ---------- DOM ---------- */
  var wrap = el('div', 'vc-intro'); wrap.id = 'vc-intro';
  var stage = el('div', 'vc-stage');
  var canvas = el('canvas', 'vc-canvas'); canvas.setAttribute('aria-hidden', 'true');
  var skipBtn = el('button', 'vc-skip', 'Skip intro \u2193'); skipBtn.type = 'button';
  var cue = el('div', 'vc-cue', 'Scroll \u2193');
  var endCue = el('div', 'vc-end', 'Keep scrolling \u2193 paste your playlist');
  stage.appendChild(canvas); stage.appendChild(skipBtn); stage.appendChild(cue); stage.appendChild(endCue);
  wrap.appendChild(stage);
  header.parentNode.insertBefore(wrap, header);

  var loader = el('div', 'vc-loader');
  var title = el('b', '', 'VibeCapsule');
  var bar = el('div', 'vc-bar'); var fill = el('i'); bar.appendChild(fill);
  var pct = el('small', '', 'Loading 0%');
  var loaderSkip = el('button', '', 'Skip intro'); loaderSkip.type = 'button';
  loader.appendChild(title); loader.appendChild(bar); loader.appendChild(pct); loader.appendChild(loaderSkip);
  document.body.appendChild(loader);

  root.classList.add('vc-lock', 'vc-intro-on');
  ready();

  /* ---------- state ---------- */
  var ctx = canvas.getContext('2d');
  var imgs = new Array(N);
  var loaded = 0, started = false, finished = false, tl = null, ticking = false;
  var state = { frame: 0 };

  /* ---------- preload ---------- */
  function onFrame() {
    loaded++;
    var p = Math.round((loaded / N) * 100);
    fill.style.width = p + '%';
    pct.textContent = 'Loading ' + p + '%';
    if (loaded >= N) start();
  }
  for (var i = 0; i < N; i++) {
    var im = new Image();
    im.decoding = 'async';
    im.onload = onFrame;
    im.onerror = onFrame;
    im.src = src(i);
    imgs[i] = im;
  }
  setTimeout(function () { if (!started && !finished) start(); }, 25000); // don't hang on a slow connection

  function ok(im) { return im && im.complete && im.naturalWidth > 0; }
  function pick(i) {
    for (var d = 0; d < N; d++) {
      if (ok(imgs[i - d])) return imgs[i - d];
      if (ok(imgs[i + d])) return imgs[i + d];
    }
    return null;
  }

  /* ---------- drawing ---------- */
  function sizeCanvas() {
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.max(1, Math.round(stage.clientWidth * dpr));
    canvas.height = Math.max(1, Math.round(stage.clientHeight * dpr));
  }
  function render() {
    var i = Math.max(0, Math.min(N - 1, Math.round(state.frame)));
    var im = pick(i);
    var cw = canvas.width, ch = canvas.height;
    ctx.fillStyle = BG; ctx.fillRect(0, 0, cw, ch);
    if (!im) return;
    var iw = im.naturalWidth, ih = im.naturalHeight;
    // wide screens: fill the screen; tall/phone screens: show the whole frame
    var s = (cw / ch >= 1.2) ? Math.max(cw / iw, ch / ih) : Math.min(cw / iw, ch / ih);
    var dw = iw * s, dh = ih * s;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(im, (cw - dw) / 2, (ch - dh) / 2, dw, dh);
  }
  function onResize() { if (!finished) { sizeCanvas(); render(); } }

  /* ---------- start ---------- */
  function start() {
    if (started || finished) return;
    started = true;
    if (!imgs.some(ok)) { finish(true); return; } // frames missing: just show the app
    sizeCanvas(); render();
    loader.classList.add('vc-out');
    setTimeout(function () { if (loader.parentNode) loader.parentNode.removeChild(loader); }, 400);
    root.classList.remove('vc-lock');

    tl = gsap.timeline({
      scrollTrigger: {
        trigger: wrap, start: 'top top', end: 'bottom bottom', scrub: 0.4,
        onUpdate: function (self) {
          cue.classList.toggle('vc-hide', self.progress > 0.02);
          endCue.classList.toggle('vc-show', self.progress > 0.95);
        }
      }
    });
    // 92% of the scroll draws the 180 frames, the last 8% holds the finished dragon
    tl.to(state, { frame: N - 1, ease: 'none', duration: 0.92, snap: { frame: 1 }, onUpdate: render });
    tl.to({}, { duration: 0.08 });

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onResize);
    ScrollTrigger.refresh();
  }

  /* ---------- leaving the intro ---------- */
  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(function () {
      ticking = false;
      if (!finished && header.getBoundingClientRect().top <= 0) finish(false);
    });
  }

  function finish(toTop) {
    if (finished) return;
    finished = true;
    var sy = window.pageYOffset || 0;
    var h = wrap.offsetHeight;
    window.removeEventListener('scroll', onScroll);
    window.removeEventListener('resize', onResize);
    try { if (tl) { if (tl.scrollTrigger) tl.scrollTrigger.kill(); tl.kill(); } } catch (e) {}
    if (wrap.parentNode) wrap.parentNode.removeChild(wrap);
    if (loader.parentNode) loader.parentNode.removeChild(loader);
    root.classList.remove('vc-lock', 'vc-intro-on');
    // same view as before, minus the removed intro: scrolling up now stops at the top of the app
    window.scrollTo(0, toTop ? 0 : Math.max(0, sy - h));
  }

  skipBtn.addEventListener('click', function () { finish(true); });
  loaderSkip.addEventListener('click', function () { finish(true); });
})();
