/* Idlewick: townsfolk walking about the town scene (owner, 26 Nov 2026: "could we have people moving around in the
   towns on the home screen and town projects?").
   The town scene (js/towns.js) is one still picture with its townsfolk painted in. This file lays a transparent canvas
   of the same pixel size over the Home and Village scenes and walks a few more townsfolk along the two main roads
   (feet on rows 162 and 244 in every town). They are drawn with the same 5 x 10 figure as the painted townsfolk, at
   the scene's own pixels, so they scale with the picture exactly as it does (whole scene pixels, never smoothed).
   Positions come from elapsed browser time, so a 144 Hz screen walks them no faster than a 60 Hz one; a hidden tab
   does not catch up. More people walk as the town is restored. Nothing here is clickable or saved.
   Off under html.calm and prefers-reduced-motion (the painted townsfolk stay). */
(() => {
const Q = window.DQ, D = Q.data, UI = Q.ui, S = () => Q.S;
const ROADS = [162, 244];
const CLOTH = ['#3f7fbf', '#b8483a', '#7a9a5a', '#c89a3a', '#7a5a9a', '#6a6a74', '#c87a8a'], HAIR = ['#3a2414', '#7a4a24', '#d8b060', '#2a2a2a', '#a8a8a8'];
const mix = (a, b, t) => { const p = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16)), x = p(a), y = p(b); return '#' + x.map((v, i) => Math.round(v + (y[i] - v) * t).toString(16).padStart(2, '0')).join(''); };
const still = () => document.documentElement.classList.contains('calm') || (window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);
const seeded = seed => () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
const hash = s => [...String(s)].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7);
const restoredShare = town => { const ids = Object.keys(D.PROJECTS || {}).filter(k => D.PROJECTS[k].town === town && !D.PROJECTS[k].relic); return ids.length ? ids.filter(k => S().projects && S().projects[k]).length / ids.length : 0; };
Q.townWalkerCount = town => 3 + Math.round(6 * restoredShare(town));

/* one walker: a figure, a road, a direction, a pace (scene px per second) and the odd pause to chat */
const makeWalkers = (town, W) => { const rnd = seeded(hash(town)), n = Q.townWalkerCount(town);
  return Array.from({ length: n }, (_, i) => ({ x: 8 + rnd() * (W - 24), y: ROADS[i % 2] + (rnd() < .5 ? 0 : 1), dir: rnd() < .5 ? -1 : 1, pace: 5 + rnd() * 5,
    rest: 0, cloth: CLOTH[Math.floor(rnd() * CLOTH.length)], hair: HAIR[Math.floor(rnd() * HAIR.length)], basket: rnd() < .25, walked: 0 })); };
const draw = (x, w) => { const X = Math.round(w.x), Y = w.y, f = (c, a, b, ww, hh) => { x.fillStyle = c; x.fillRect(a, b, ww, hh); };
  const step = w.rest > 0 ? 0 : Math.floor(w.walked / 3) % 2, flip = w.dir < 0;
  const fx = (a, ww) => flip ? X + 5 - a - ww : X + a; /* mirror the figure about its own 5 px width */
  f('#e0b088', fx(1, 3), Y - 10, 3, 3); f(w.hair, fx(1, 3), Y - 10, 3, 1);
  f(w.cloth, X, Y - 7, 5, 4); f(mix(w.cloth, '#000000', .25), fx(3, 2), Y - 7, 2, 4); f(mix(w.cloth, '#ffffff', .2), fx(0, 1), Y - 7, 1, 3);
  if (step) { f('#3a3030', fx(0, 1), Y - 3, 1, 3); f('#3a3030', fx(4, 1), Y - 3, 1, 3); } else { f('#3a3030', fx(1, 1), Y - 3, 1, 3); f('#3a3030', fx(3, 1), Y - 3, 1, 3); }
  if (w.basket) { f('#a07a4a', fx(5, 3), Y - 5, 3, 2); f('#c8483a', fx(5, 1), Y - 6, 1, 1); } };

const layers = new Set();
const fit = L => { const { img, cv } = L; if (!img.isConnected) return; const cs = getComputedStyle(img);
  Object.assign(cv.style, { left: img.offsetLeft + 'px', top: img.offsetTop + 'px', width: img.offsetWidth + 'px', height: img.offsetHeight + 'px', objectFit: cs.objectFit, objectPosition: cs.objectPosition, borderRadius: cs.borderRadius }); };
const attach = img => { if (img.dataset.walkers || img.classList.contains('scene-old') || !img.dataset.town) return;
  const go = () => { if (!img.isConnected || img.dataset.walkers) return; const W = img.naturalWidth, H = img.naturalHeight; if (!W || !H) return;
    img.dataset.walkers = '1'; const cv = document.createElement('canvas'); cv.width = W; cv.height = H; cv.className = 'town-walkers'; cv.setAttribute('aria-hidden', 'true');
    img.after(cv); const L = { img, cv, x: cv.getContext('2d'), walkers: makeWalkers(img.dataset.town, W), W, key: '' };
    if (window.ResizeObserver) { L.ro = new ResizeObserver(() => fit(L)); L.ro.observe(img); } fit(L); layers.add(L); tick.start(); };
  if (img.complete) go(); else img.addEventListener('load', go, { once: true }); };
Q.townWalkersScan = () => { if (still()) return; document.querySelectorAll('.home-scene img.scene[data-town], .village-scene>img.scene[data-town]').forEach(attach); };
Q.townWalkersLive = () => [...layers].filter(L => L.cv.isConnected).map(L => ({ town: L.img.dataset.town, walkers: L.walkers.map(w => ({ x: Math.round(w.x), y: w.y })) }));

const tick = { raf: 0, last: 0, start() { if (!this.raf) { this.last = performance.now(); this.raf = requestAnimationFrame(t => this.run(t)); } },
  run(t) { this.raf = 0; const dt = Math.min(.1, Math.max(0, (t - this.last) / 1000)); this.last = t; /* a hidden tab never catches up */
    for (const L of layers) { if (!L.cv.isConnected) { L.ro && L.ro.disconnect(); layers.delete(L); continue; }
      if (still()) { L.cv.remove(); continue; }
      for (const w of L.walkers) { if (w.rest > 0) { w.rest -= dt; continue; }
        const d = w.pace * dt; w.x += w.dir * d; w.walked += d;
        if (w.x < 4) { w.x = 4; w.dir = 1; } else if (w.x > L.W - 10) { w.x = L.W - 10; w.dir = -1; }
        if (Math.random() < dt * .06) { w.rest = 1 + Math.random() * 3; if (Math.random() < .4) w.dir = -w.dir; } }
      const key = L.walkers.map(w => Math.round(w.x) + ':' + (w.rest > 0 ? 0 : Math.floor(w.walked / 3) % 2) + w.dir).join(',');
      if (key !== L.key) { L.key = key; L.x.clearRect(0, 0, L.cv.width, L.cv.height); for (const w of L.walkers) draw(L.x, w); } }
    if (layers.size) this.raf = requestAnimationFrame(n => this.run(n)); } };

/* Home's town scene at a whole-number scale (27 Nov 2026 audit: object-fit:cover showed it at 2.36x, 1.78x and 0.56x;
   the art rule allows a fitted scale only on the Village page). The picture takes the smallest whole scale that covers
   the card's width (2x on desktop, 1x on phones), sits on the card's bottom edge and is cropped by it; any height left
   above is filled with the scene's own sky colour, so nothing is shrunk or stretched. The walkers' canvas follows. */
const sky = new Map();
const skyOf = img => { const k = img.currentSrc || img.src; if (sky.has(k)) return sky.get(k); let c = '';
  try { const cv = document.createElement('canvas'); cv.width = 1; cv.height = 1; const x = cv.getContext('2d'); x.drawImage(img, Math.floor(img.naturalWidth / 2), 1, 1, 1, 0, 0, 1, 1); const d = x.getImageData(0, 0, 1, 1).data; c = `rgb(${d[0]},${d[1]},${d[2]})`; } catch (e) { /* a tainted image keeps the panel colour */ }
  sky.set(k, c); return c; };
const fitHome = () => { const img = document.querySelector('.home-scene img.scene'); if (!img || !img.naturalWidth) return; const box = img.parentElement;
  img.removeAttribute('style'); box.style.height = ''; box.style.removeProperty('background');
  const bw = box.clientWidth, bh = box.clientHeight; if (!bw || !bh) return;
  const W = img.naturalWidth, H = img.naturalHeight, k = Math.max(1, Math.ceil(bw / W)), w = W * k, h = H * k;
  box.style.height = bh + 'px'; const c = skyOf(img); if (c) box.style.setProperty('background', c, 'important');
  /* with priority: the page's stylesheets size this picture with !important (height:100%), which squashed it */
  for (const [k2, v] of Object.entries({ position: 'absolute', 'max-width': 'none', 'max-height': 'none', 'aspect-ratio': 'auto', width: w + 'px', height: h + 'px', left: Math.round((bw - w) / 2) + 'px', top: (h <= bh ? bh - h : Math.round((bh - h) * .6)) + 'px', 'object-fit': 'fill' })) img.style.setProperty(k2, v, 'important');
  img.dataset.scale = k; for (const L of layers) if (L.img === img) fit(L); };
Q.fitHomeScene = fitHome;
let fitRaf = 0; addEventListener('resize', () => { cancelAnimationFrame(fitRaf); fitRaf = requestAnimationFrame(fitHome); });

const render0 = UI.render;
UI.render = (...a) => { const r = render0(...a);
  try { const img = document.querySelector('.home-scene img.scene'); if (img) { if (img.complete) fitHome(); else img.addEventListener('load', fitHome, { once: true }); } } catch (e) { /* the scene keeps its CSS fit */ }
  try { Q.townWalkersScan(); } catch (e) { /* the scene stays as painted */ } return r; };
})();
