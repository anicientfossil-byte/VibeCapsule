/* VibeCapsule scroll intro: canvas frame sequence scrubbed by GSAP ScrollTrigger.
   Plays at the top of the page. When the user scrolls into the app, the intro is
   removed for good, so scrolling back up stops at the playlist link box.
   Phone-friendly: frames are downloaded as small files but only ~25 are decoded
   at a time, so it does not run out of memory on iPhones / low-end Androids. */
(function () {
  'use strict';
  var root = document.documentElement;
  function ready() { root.classList.remove('vc-pending'); }

  var header = document.querySelector('header');
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  // Coming back from Spotify login (?code=...) should land straight in the app.
  var returning = window.__vcReturning || /[?&](code|error)=/.test(location.search);
  if (!window.gsap || !window.ScrollTrigger) console.warn('VibeCapsule intro: GSAP did not load, skipping intro');
  if (!header || reduce || returning || !window.gsap || !window.ScrollTrigger) { ready(); return; }

  // SETTING: false = intro plays on every visit (with Skip button). true = only the first visit in this browser.
  var PLAY_ONCE = false;
  if (PLAY_ONCE) {
    try {
      if (localStorage.getItem('vcIntroSeen')) { ready(); return; }
      localStorage.setItem('vcIntroSeen', '1');
    } catch (e) {}
  }
  gsap.registerPlugin(ScrollTrigger);

  var N = 180;
  var WINDOW = 12; // frames decoded on each side of the current frame
  var src = function (i) {
    if (window.VC_FRAMES) return window.VC_FRAMES[i];
    return 'frames/f' + String(i + 1).padStart(3, '0') + '.jpg';
  };
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
  var blobs = new Array(N);     // compressed files (small)
  var bitmaps = new Array(N);   // decoded frames (only a window of these exist)
  var pendingDecode = {};
  var done = 0, started = false, finished = false, tl = null, ticking = false;
  var state = { frame: 0 };

  /* ---------- download all frames as compressed blobs ---------- */
  function dataToBlob(u) {
    var m = /^data:([^;]+);base64,(.*)$/.exec(u);
    var bin = atob(m[2]), arr = new Uint8Array(bin.length);
    for (var k = 0; k < bin.length; k++) arr[k] = bin.charCodeAt(k);
    return new Blob([arr], { type: m[1] });
  }
  function getBlob(u) {
    if (u.indexOf('data:') === 0) return Promise.resolve(dataToBlob(u));
    return fetch(u).then(function (r) { if (!r.ok) throw new Error(r.status); return r.blob(); });
  }
  function onFrame() {
    done++;
    var p = Math.round((done / N) * 100);
    fill.style.width = p + '%';
    pct.textContent = 'Loading ' + p + '%';
    if (done >= N) start();
  }
  for (var i = 0; i < N; i++) {
    (function (j) {
      getBlob(src(j)).then(function (b) { blobs[j] = b; onFrame(); }, function () { onFrame(); });
    })(i);
  }
  setTimeout(function () { if (!started && !finished) start(); }, 25000); // don't hang on a slow connection

  /* ---------- decode only the frames near the current one ---------- */
  function decode(b) {
    if (window.createImageBitmap) return createImageBitmap(b);
    return new Promise(function (res, rej) {
      var u = URL.createObjectURL(b), im = new Image();
      im.onload = function () { URL.revokeObjectURL(u); res(im); };
      im.onerror = function () { URL.revokeObjectURL(u); rej(); };
      im.src = u;
    });
  }
  function ensure(center) {
    for (var d = -WINDOW; d <= WINDOW; d++) {
      var j = center + d;
      if (j < 0 || j >= N || bitmaps[j] || pendingDecode[j] || !blobs[j]) continue;
      pendingDecode[j] = (function (j) {
        return decode(blobs[j]).then(function (bm) {
          delete pendingDecode[j];
          if (finished) { if (bm.close) bm.close(); return; }
          bitmaps[j] = bm;
          if (j === Math.round(state.frame)) render();
        }, function () { delete pendingDecode[j]; });
      })(j);
    }
    for (var k = 0; k < N; k++) {
      if (bitmaps[k] && Math.abs(k - center) > WINDOW + 6) {
        if (bitmaps[k].close) bitmaps[k].close();
        bitmaps[k] = null;
      }
    }
  }
  function pick(i) {
    for (var d = 0; d < N; d++) {
      if (bitmaps[i - d]) return bitmaps[i - d];
      if (bitmaps[i + d]) return bitmaps[i + d];
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
    ensure(i);
    var im = pick(i);
    var cw = canvas.width, ch = canvas.height;
    ctx.fillStyle = BG; ctx.fillRect(0, 0, cw, ch);
    if (!im) return;
    var iw = im.naturalWidth || im.width, ih = im.naturalHeight || im.height;
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
    if (!blobs.some(Boolean)) { // frames missing: show the app and say why
      console.error('VibeCapsule intro: frames not found (looked for ' + src(0) + ')');
      finish(true);
      var t = el('div', '', 'Intro frames not found: upload the "frames" folder next to index.html');
      t.style.cssText = 'position:fixed;z-index:200;left:12px;right:12px;top:12px;padding:10px 12px;background:#E0533C;color:#FBF9F4;border:2px solid #0F1A34;font:700 12px "Space Mono",monospace';
      document.body.appendChild(t);
      setTimeout(function () { if (t.parentNode) t.parentNode.removeChild(t); }, 12000);
      return;
    }
    ensure(0);
    Promise.race([
      Promise.all(Object.keys(pendingDecode).map(function (k) { return pendingDecode[k]; }).slice(0, 3)),
      new Promise(function (r) { setTimeout(r, 4000); })
    ]).then(begin);
  }

  function begin() {
    if (finished) return;
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
    for (var k = 0; k < N; k++) { if (bitmaps[k] && bitmaps[k].close) bitmaps[k].close(); bitmaps[k] = null; blobs[k] = null; }
    if (wrap.parentNode) wrap.parentNode.removeChild(wrap);
    if (loader.parentNode) loader.parentNode.removeChild(loader);
    root.classList.remove('vc-lock', 'vc-intro-on');
    // same view as before, minus the removed intro: scrolling up now stops at the top of the app
    window.scrollTo(0, toTop ? 0 : Math.max(0, sy - h));
  }

  skipBtn.addEventListener('click', function () { finish(true); });
  loaderSkip.addEventListener('click', function () { finish(true); });
})();
