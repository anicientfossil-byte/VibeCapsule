/* VibeCapsule scroll intro: canvas frame sequence scrubbed by GSAP ScrollTrigger.
   Plays at the top of the page. When the user scrolls into the app, the intro is
   removed for good, so scrolling back up stops at the playlist link box.
   Phone-friendly: frames are downloaded as small files but only ~25 are decoded
   at a time, so it does not run out of memory on iPhones / low-end Androids. */
(function () {
  'use strict';
  var root = document.documentElement;
  function ready() { root.classList.remove('vc-pending'); }
  // Tell the app (React) it may start. It waits for this so the 3D scene does not run during the intro.
  var released = false;
  function releaseApp() {
    if (released) return;
    released = true;
    window.__vcIntroPending = false;
    window.dispatchEvent(new Event('vc-intro-mount'));
  }

  // ---- debug panel: open the site with ?debug=1 on the end of the address ----
  var DEBUG = /[?&]debug/.test(location.search);
  var dbgBox = null, dbgLines = [];
  function log(msg) {
    if (!DEBUG) return;
    try {
      if (!dbgBox) {
        dbgBox = document.createElement('pre');
        dbgBox.style.cssText = 'position:fixed;z-index:99999;left:0;right:0;bottom:0;margin:0;padding:6px 8px;max-height:45vh;overflow:hidden;pointer-events:none;background:rgba(0,0,0,.85);color:#7CFF9B;font:11px/1.3 monospace;white-space:pre-wrap;visibility:visible';
        (document.body || root).appendChild(dbgBox);
      }
      dbgLines.push(msg);
      if (dbgLines.length > 14) dbgLines.shift();
      dbgBox.textContent = dbgLines.join('\n');
    } catch (e) {}
  }
  window.addEventListener('error', function (e) { log('ERROR: ' + e.message + ' @' + (e.lineno || '?')); });
  window.addEventListener('unhandledrejection', function (e) { log('PROMISE ERROR: ' + (e.reason && e.reason.message || e.reason)); });
  log('intro.js running, version react-v1');

  var header = document.getElementById('root') || document.querySelector('header');
  window.__vcIntro = 'react-v1';
  // Many phones have "reduce motion" / battery-saver animation settings turned on, which would
  // silently hide the intro. The animation is controlled by the user's own scrolling, so it is
  // shown anyway (there is a Skip button). Set to true to hide it for those users instead.
  var RESPECT_REDUCED_MOTION = false;
  var reduce = RESPECT_REDUCED_MOTION && window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  // Coming back from Spotify login (?code=...) should land straight in the app.
  var returning = window.__vcReturning || /[?&](code|error)=/.test(location.search);
  log('gsap: ' + !!window.gsap + '  ScrollTrigger: ' + !!window.ScrollTrigger + '  header: ' + !!header + '  returning: ' + !!returning + '  reduce: ' + !!reduce);
  if (!window.gsap || !window.ScrollTrigger) console.warn('VibeCapsule intro: GSAP did not load, skipping intro');
  if (!header || reduce || returning || !window.gsap || !window.ScrollTrigger) { ready(); releaseApp(); return; }

  // SETTING: false = intro plays on every visit (with Skip button). true = only the first visit in this browser.
  var PLAY_ONCE = false;
  if (PLAY_ONCE) {
    try {
      if (localStorage.getItem('vcIntroSeen')) { ready(); releaseApp(); return; }
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
  // horizontal centre of the action (0 = left edge, 1 = right edge) for each of the 180 frames
  var FOCAL = [0.649, 0.648, 0.647, 0.645, 0.643, 0.64, 0.636, 0.633, 0.629, 0.625, 0.62, 0.616, 0.611, 0.607, 0.602, 0.597, 0.593, 0.588, 0.584, 0.58, 0.576, 0.572, 0.568, 0.564, 0.559, 0.555, 0.551, 0.547, 0.543, 0.54, 0.536, 0.532, 0.528, 0.524, 0.52, 0.515, 0.511, 0.507, 0.502, 0.498, 0.494, 0.489, 0.485, 0.481, 0.477, 0.473, 0.469, 0.465, 0.461, 0.457, 0.454, 0.451, 0.449, 0.446, 0.444, 0.444, 0.444, 0.444, 0.445, 0.446, 0.448, 0.451, 0.453, 0.455, 0.458, 0.461, 0.465, 0.468, 0.473, 0.477, 0.481, 0.485, 0.489, 0.493, 0.496, 0.499, 0.502, 0.504, 0.506, 0.508, 0.509, 0.511, 0.512, 0.513, 0.513, 0.514, 0.515, 0.516, 0.517, 0.518, 0.519, 0.52, 0.521, 0.522, 0.523, 0.524, 0.525, 0.525, 0.526, 0.525, 0.524, 0.525, 0.525, 0.525, 0.525, 0.525, 0.525, 0.525, 0.525, 0.526, 0.526, 0.526, 0.526, 0.526, 0.526, 0.526, 0.525, 0.524, 0.523, 0.521, 0.519, 0.517, 0.514, 0.512, 0.511, 0.509, 0.508, 0.508, 0.507, 0.507, 0.508, 0.509, 0.51, 0.511, 0.512, 0.513, 0.515, 0.517, 0.518, 0.52, 0.521, 0.523, 0.524, 0.525, 0.527, 0.528, 0.529, 0.531, 0.533, 0.535, 0.537, 0.54, 0.541, 0.542, 0.544, 0.545, 0.546, 0.547, 0.548, 0.549, 0.549, 0.549, 0.548, 0.548, 0.548, 0.548, 0.548, 0.548, 0.548, 0.548, 0.548, 0.548, 0.548, 0.548, 0.548, 0.548, 0.548, 0.548, 0.548, 0.548];
  var FOCAL = [0.649,0.648,0.647,0.645,0.643,0.64,0.636,0.633,0.629,0.625,0.62,0.616,0.611,0.607,0.602,0.597,0.593,0.588,0.584,0.58,0.576,0.572,0.568,0.564,0.559,0.555,0.551,0.547,0.543,0.54,0.536,0.532,0.528,0.524,0.52,0.515,0.511,0.507,0.502,0.498,0.494,0.489,0.485,0.481,0.477,0.473,0.469,0.465,0.461,0.457,0.454,0.451,0.449,0.446,0.444,0.444,0.444,0.444,0.445,0.446,0.448,0.451,0.453,0.455,0.458,0.461,0.465,0.468,0.473,0.477,0.481,0.485,0.489,0.493,0.496,0.499,0.502,0.504,0.506,0.508,0.509,0.511,0.512,0.513,0.513,0.514,0.515,0.516,0.517,0.518,0.519,0.52,0.521,0.522,0.523,0.524,0.525,0.525,0.526,0.525,0.524,0.525,0.525,0.525,0.525,0.525,0.525,0.525,0.525,0.526,0.526,0.526,0.526,0.526,0.526,0.526,0.525,0.524,0.523,0.521,0.519,0.517,0.514,0.512,0.511,0.509,0.508,0.508,0.507,0.507,0.508,0.509,0.51,0.511,0.512,0.513,0.515,0.517,0.518,0.52,0.521,0.523,0.524,0.525,0.527,0.528,0.529,0.531,0.533,0.535,0.537,0.54,0.541,0.542,0.544,0.545,0.546,0.547,0.548,0.549,0.549,0.549,0.548,0.548,0.548,0.548,0.548,0.548,0.548,0.548,0.548,0.548,0.548,0.548,0.548,0.548,0.548,0.548,0.548,0.548];

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
  var lastLogged = -1, lastDbg = 0;

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
    if (p % 25 === 0 && p !== lastLogged) { lastLogged = p; log('frames downloaded: ' + done + '/' + N + ' (ok ' + blobs.filter(Boolean).length + ')'); }
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
    // Always fill the whole screen. On tall phone screens the picture is cropped on the sides and the
    // visible window slides to follow the dragon (FOCAL), so it stays in view.
    var s = Math.max(cw / iw, ch / ih);
    var dw = iw * s, dh = ih * s;
    var dx = Math.min(0, Math.max(cw - dw, cw / 2 - FOCAL[i] * dw));
    var dy = (ch - dh) / 2;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(im, dx, dy, dw, dh);
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
    log('start(): blobs ok ' + blobs.filter(Boolean).length + ', decoding first frames');
    ensure(0);
    Promise.race([
      Promise.all(Object.keys(pendingDecode).map(function (k) { return pendingDecode[k]; }).slice(0, 3)),
      new Promise(function (r) { setTimeout(r, 4000); })
    ]).then(begin);
  }

  function begin() {
    if (finished) return;
    log('begin(): canvas ' + (stage.clientWidth) + 'x' + (stage.clientHeight) + ', bitmaps ' + bitmaps.filter(Boolean).length + ', wrap height ' + wrap.offsetHeight);
    sizeCanvas(); render();
    loader.classList.add('vc-out');
    setTimeout(function () { if (loader.parentNode) loader.parentNode.removeChild(loader); }, 400);
    root.classList.remove('vc-lock');

    tl = gsap.timeline({
      scrollTrigger: {
        trigger: wrap, start: 'top top', end: 'bottom bottom', scrub: 0.4,
        onUpdate: function (self) {
          if (DEBUG && Date.now() - lastDbg > 400) { lastDbg = Date.now(); log('scroll ' + Math.round(window.pageYOffset) + '  progress ' + self.progress.toFixed(2) + '  frame ' + Math.round(state.frame) + '  bitmaps ' + bitmaps.filter(Boolean).length); }
          if (self.progress > 0.85) releaseApp();
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
    log('scroll animation armed. Now scroll down slowly.');
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
    log('finish(' + (toTop ? 'skip' : 'scrolled into app') + ') at scrollY ' + Math.round(window.pageYOffset));
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
    var target = toTop ? 0 : Math.max(0, sy - h);
    releaseApp();
    try {
      if (window.__vcLenis && window.__vcLenis.scrollTo) window.__vcLenis.scrollTo(target, { immediate: true, force: true });
      else window.scrollTo(0, target);
    } catch (e) { window.scrollTo(0, target); }
    window.dispatchEvent(new Event('vc-intro-finished'));
  }

  skipBtn.addEventListener('click', function () { finish(true); });
  loaderSkip.addEventListener('click', function () { finish(true); });
})();
