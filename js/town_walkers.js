/* Idlewick: townsfolk walking about the town scene (owner, 26 Nov 2026: "could we have people moving around in the
   towns on the home screen and town projects?").
   The town scene (js/towns.js) is one still picture with its townsfolk painted in. This file lays a transparent canvas
   of the same pixel size over the Home and Village scenes and walks a few more townsfolk along the two main roads
   (feet on rows 162 and 244 in every town). They are drawn with the same 5 x 10 figure as the painted townsfolk, at
   the scene's own pixels, so they scale with the picture exactly as it does (whole scene pixels, never smoothed).
   Positions come from elapsed browser time, so a 144 Hz screen walks them no faster than a 60 Hz one; a hidden tab
   does not catch up. More people walk as the town is restored. Nothing here is clickable or saved.
   Off under html.calm and prefers-reduced-motion (the painted townsfolk stay).
   Owner, 27 Nov 2026: the quest givers you have met walk their own town's streets too, drawn at the same scale in their
   portrait's colours (hair, hat, beard, clothes; js/folk.js), with their name on hover (a click opens People); and when a
   restoration project is finished the townsfolk gather in front of the site and cheer for about a minute (hops, raised
   arms, a little confetti and petals). Both are part of this layer, so they are off under calm too. tests/hearth-life.cjs. */
(() => {
const Q = window.DQ, D = Q.data, UI = Q.ui, S = () => Q.S, A = Q.pixelArt;
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
/* the givers you have met who live in this town, in their portrait colours */
const SKIN = { fair: '#f2c9a0', light: '#e8b98e', tan: '#c98e5e', brown: '#9a6640', deep: '#6e4428', pale: '#e6dccf', dwarf: '#e0a882' };
const giversOf = town => (Q.folkMet ? Q.folkMet() : []).filter(f => f.town === town);
const makeGivers = (town, W) => { const rnd = seeded(hash(town + ':givers'));
  return giversOf(town).map((f, i) => ({ giver: f, x: 20 + rnd() * (W - 40), y: ROADS[i % 2] + (rnd() < .5 ? 0 : 1), dir: rnd() < .5 ? -1 : 1, pace: 3 + rnd() * 3, rest: 1 + rnd() * 4, walked: 0, cloth: f.look.clothes || '#6a6a74' })); };
const drawGiver = (x, w) => { const X = Math.round(w.x), Y = w.y, L = w.giver.look, f = (c, a, b, ww, hh) => { x.fillStyle = c; x.fillRect(a, b, ww, hh); }, flip = w.dir < 0, fx = (a, ww) => flip ? X + 5 - a - ww : X + a;
  const step = w.rest > 0 ? 0 : Math.floor(w.walked / 3) % 2, skin = SKIN[L.skin] || SKIN.light, [hc, hs] = L.hair || ['#3a2414', 'short'], [k, c] = L.hat || [], dk = c ? mix(c, '#000000', .3) : '';
  /* body: clothes with a lit edge, a shawl or apron, the legs */
  f(w.cloth, X, Y - 7, 5, 4); f(mix(w.cloth, '#000000', .25), fx(3, 2), Y - 7, 2, 4); f(mix(w.cloth, '#ffffff', .2), fx(0, 1), Y - 7, 1, 3);
  if (L.shawl) f(L.shawl, X, Y - 7, 5, 1); if (L.apron) f(L.apron, fx(1, 3), Y - 6, 3, 3);
  if (step) { f('#3a3030', fx(0, 1), Y - 3, 1, 3); f('#3a3030', fx(4, 1), Y - 3, 1, 3); } else { f('#3a3030', fx(1, 1), Y - 3, 1, 3); f('#3a3030', fx(3, 1), Y - 3, 1, 3); }
  /* head, hair, beard */
  f(skin, fx(1, 3), Y - 10, 3, 3); if (hs !== 'bald' && hs !== 'tonsure') f(hc, fx(1, 3), Y - 10, 3, 1); if (['long', 'braids', 'wild'].includes(hs)) f(hc, fx(0, 1), Y - 10, 1, hs === 'long' ? 4 : 3);
  if (hs === 'bun') f(hc, fx(2, 1), Y - 11, 1, 1);
  if (L.beard) { const [bc, bs] = L.beard; if (bs !== 'stubble') f(bc, fx(1, 3), Y - 8, 3, 1); if (['long', 'braided', 'full'].includes(bs)) f(bc, fx(2, 1), Y - 7, 1, bs === 'full' ? 1 : 2); }
  if (L.glow) f(L.glow, fx(3, 1), Y - 9, 1, 1);
  /* the hat that makes them who they are */
  if (k === 'chef') { f('#f8f4ec', fx(1, 3), Y - 13, 3, 3); f('#d8d0c4', fx(3, 1), Y - 12, 1, 2); }
  else if (k === 'hood' || k === 'cowl') { f(c, fx(1, 3), Y - 11, 3, 1); f(c, fx(0, 1), Y - 10, 1, 3); f(dk, fx(4, 1), Y - 10, 1, 3); }
  else if (k === 'helmet' || k === 'horned' || k === 'plume') { f(c, fx(1, 3), Y - 11, 3, 2); f(dk, fx(3, 1), Y - 11, 1, 2); if (k === 'horned') { f('#e8e0c8', fx(0, 1), Y - 12, 1, 1); f('#e8e0c8', fx(4, 1), Y - 12, 1, 1); } if (k === 'plume') f('#d83a2a', fx(2, 1), Y - 13, 1, 2); }
  else if (k === 'minecap') { f(c, fx(1, 3), Y - 11, 3, 2); f('#fff2b0', fx(3, 1), Y - 11, 1, 1); }
  else if (k === 'tricorn' || k === 'brim') { f(dk, X, Y - 11, 5, 1); f(c, fx(1, 3), Y - 12, 3, 1); }
  else if (k === 'circlet') f(c, fx(1, 3), Y - 10, 3, 1);
  else if (k) { f(c, fx(1, 3), Y - 11, 3, 2); if (k === 'cap') f(dk, fx(3, 2), Y - 10, 2, 1); } };

/* a gathering round a finished site: who, where, and how long (Q.townCheer, set when a project is finished) */
const CHEER_MS = 60000, CONFETTI = ['#e0405a', '#f0d060', '#4a8ad8', '#f4c4d0', '#7ac860', '#ffffff'];
Q.townCheer = null;
Q.on && Q.on('project', id => { const p = D.PROJECTS && D.PROJECTS[id]; if (!p || !(S().projects || {})[id] || Q.forecasting || (Q.sim && Q.sim.on)) return; Q.townCheer = { town: p.town, id, at: performance.now() }; });
const cheerOf = (town, now) => { const c = Q.townCheer; if (!c || c.town !== town) return null; const el = (now - c.at) / 1000; if (el * 1000 > CHEER_MS) { Q.townCheer = null; return null; }
  const site = A && A.siteLayout ? A.siteLayout(town).find(s => s.id === c.id) : null; return site ? { el: Math.max(0, el), X: site.X, Y: site.Y, id: c.id } : null; };
const drawCheer = (x, ch) => { const f = (c, a, b, ww, hh) => { x.fillStyle = c; x.fillRect(Math.round(a), Math.round(b), ww, hh); }, rnd = seeded(hash(ch.id)), { X, Y, el } = ch, fade = Math.min(1, (CHEER_MS / 1000 - el) / 6);
  /* seven townsfolk in two loose rows in front of the site, hopping out of step with their arms up */
  for (let i = 0; i < 7; i++) { const px = X - 12 + i * 8 + Math.round(rnd() * 2), py = Y + 37 + (i % 2) * 4, ph = rnd() * 6.28, hop = Math.max(0, Math.sin(el * 7 + ph)), cloth = CLOTH[Math.floor(rnd() * CLOTH.length)], hair = HAIR[Math.floor(rnd() * HAIR.length)], Yf = py - Math.round(hop * 2.4);
    f('#e0b088', px + 1, Yf - 10, 3, 3); f(hair, px + 1, Yf - 10, 3, 1); f(cloth, px, Yf - 7, 5, 4); f(mix(cloth, '#000000', .25), px + 3, Yf - 7, 2, 4); f('#3a3030', px + 1, Yf - 3, 1, 3); f('#3a3030', px + 3, Yf - 3, 1, 3);
    if (hop > .3) { f('#e0b088', px - 1, Yf - 12, 1, 3); f('#e0b088', px + 5, Yf - 12, 1, 3); } else { f(cloth, px - 1, Yf - 7, 1, 3); f(cloth, px + 5, Yf - 7, 1, 3); } }
  /* confetti and petals drifting down over the site, thinning out at the end */
  const n = Math.round(22 * fade); for (let i = 0; i < n; i++) { const per = 2.6 + rnd() * 1.6, off = rnd() * per, u = ((el + off) % per) / per, sx = X + 16 + (rnd() - .5) * 52, c = CONFETTI[Math.floor(rnd() * CONFETTI.length)];
    f(c, sx + Math.sin(el * 2.2 + i) * 3, Y - 16 + u * 50, i % 3 ? 1 : 2, 1); } };

const draw = (x, w) => { const X = Math.round(w.x), Y = w.y, f = (c, a, b, ww, hh) => { x.fillStyle = c; x.fillRect(a, b, ww, hh); };
  const step = w.rest > 0 ? 0 : Math.floor(w.walked / 3) % 2, flip = w.dir < 0;
  const fx = (a, ww) => flip ? X + 5 - a - ww : X + a; /* mirror the figure about its own 5 px width */
  f('#e0b088', fx(1, 3), Y - 10, 3, 3); f(w.hair, fx(1, 3), Y - 10, 3, 1);
  f(w.cloth, X, Y - 7, 5, 4); f(mix(w.cloth, '#000000', .25), fx(3, 2), Y - 7, 2, 4); f(mix(w.cloth, '#ffffff', .2), fx(0, 1), Y - 7, 1, 3);
  if (step) { f('#3a3030', fx(0, 1), Y - 3, 1, 3); f('#3a3030', fx(4, 1), Y - 3, 1, 3); } else { f('#3a3030', fx(1, 1), Y - 3, 1, 3); f('#3a3030', fx(3, 1), Y - 3, 1, 3); }
  if (w.basket) { f('#a07a4a', fx(5, 3), Y - 5, 3, 2); f('#c8483a', fx(5, 1), Y - 6, 1, 1); } };

const layers = new Set();
/* the givers' hover targets: one invisible button each over its figure (glows on hover; a click opens People) */
const tags = L => { for (const b of L.tags || []) b.remove(); L.tags = L.givers.map(w => { const b = document.createElement('button'), f = w.giver;
  b.className = 'hearth-spot town-giver'; b.dataset.do = 'folkfrom'; b.dataset.a = f.n; b.setAttribute('aria-label', `${f.n}, ${f.role}`); b.dataset.tip = `text:${f.n} · ${f.role}`; L.cv.after(b); return b; }); };
const placeTags = L => { const { img } = L; if (!L.tags || !L.tags.length || !img.isConnected) return; const s = img.offsetWidth / L.W;
  /* at least a 48 px touch target, centred on the figure with its bottom at the feet */
  const bw = Math.max(48, 9 * s), bh = Math.max(48, 16 * s);
  L.tags.forEach((b, i) => { const w = L.givers[i]; b.style.left = img.offsetLeft + (Math.round(w.x) + 2.5) * s - bw / 2 + 'px'; b.style.top = img.offsetTop + (w.y + 2) * s - bh + 'px'; b.style.width = bw + 'px'; b.style.height = bh + 'px'; }); };
const syncGivers = L => { const key = giversOf(L.img.dataset.town).map(f => f.id).join(','); if (key === L.giverKey) return; L.giverKey = key; L.givers = makeGivers(L.img.dataset.town, L.W); tags(L); placeTags(L); L.key = ''; };
const fit = L => { const { img, cv } = L; if (!img.isConnected) return; const cs = getComputedStyle(img);
  Object.assign(cv.style, { left: img.offsetLeft + 'px', top: img.offsetTop + 'px', width: img.offsetWidth + 'px', height: img.offsetHeight + 'px', objectFit: cs.objectFit, objectPosition: cs.objectPosition, borderRadius: cs.borderRadius }); };
const attach = img => { if (img.dataset.walkers || img.classList.contains('scene-old') || !img.dataset.town) return;
  const go = () => { if (!img.isConnected || img.dataset.walkers) return; const W = img.naturalWidth, H = img.naturalHeight; if (!W || !H) return;
    img.dataset.walkers = '1'; const cv = document.createElement('canvas'); cv.width = W; cv.height = H; cv.className = 'town-walkers'; cv.setAttribute('aria-hidden', 'true');
    img.after(cv); const L = { img, cv, x: cv.getContext('2d'), walkers: makeWalkers(img.dataset.town, W), givers: [], W, key: '' };
    if (window.ResizeObserver) { L.ro = new ResizeObserver(() => { fit(L); placeTags(L); }); L.ro.observe(img); } fit(L); syncGivers(L); layers.add(L); tick.start(); };
  if (img.complete) go(); else img.addEventListener('load', go, { once: true }); };
Q.townWalkersScan = () => { if (still()) return; document.querySelectorAll('.home-scene img.scene[data-town], .village-scene>img.scene[data-town]').forEach(attach); for (const L of layers) if (L.cv.isConnected) syncGivers(L); };
Q.townWalkersLive = () => [...layers].filter(L => L.cv.isConnected).map(L => ({ town: L.img.dataset.town, walkers: L.walkers.map(w => ({ x: Math.round(w.x), y: w.y })),
  givers: L.givers.map(w => ({ id: w.giver.id, x: Math.round(w.x), y: w.y })), tags: (L.tags || []).filter(b => b.isConnected).length, cheer: L.cheer || null }));

const tick = { raf: 0, last: 0, start() { if (!this.raf) { this.last = performance.now(); this.raf = Q.frame.add((dt, t) => this.run(t)); } }, /* the shared animation clock (util.js) */
  run(t) { const dt = Math.min(.1, Math.max(0, (t - this.last) / 1000)); this.last = t; /* a hidden tab never catches up */
    for (const L of layers) { if (!L.cv.isConnected) { L.ro && L.ro.disconnect(); for (const b of L.tags || []) b.remove(); layers.delete(L); continue; }
      if (still()) { L.cv.remove(); for (const b of L.tags || []) b.remove(); continue; }
      for (const w of L.walkers.concat(L.givers)) { if (w.rest > 0) { w.rest -= dt; continue; }
        const d = w.pace * dt; w.x += w.dir * d; w.walked += d;
        if (w.x < 4) { w.x = 4; w.dir = 1; } else if (w.x > L.W - 10) { w.x = L.W - 10; w.dir = -1; }
        /* givers stop to chat more often, and for longer */
        if (Math.random() < dt * (w.giver ? .1 : .06)) { w.rest = (w.giver ? 2 : 1) + Math.random() * (w.giver ? 5 : 3); if (Math.random() < .4) w.dir = -w.dir; } }
      const ch = cheerOf(L.img.dataset.town, t); L.cheer = ch ? { id: ch.id, t: Math.round(ch.el) } : null;
      const key = L.walkers.concat(L.givers).map(w => Math.round(w.x) + ':' + (w.rest > 0 ? 0 : Math.floor(w.walked / 3) % 2) + w.dir).join(',') + (ch ? '|' + Math.floor(ch.el * 30) : '');
      if (key !== L.key) { L.key = key; L.x.clearRect(0, 0, L.cv.width, L.cv.height); for (const w of L.walkers) draw(L.x, w); for (const w of L.givers) drawGiver(L.x, w); if (ch) drawCheer(L.x, ch); placeTags(L); } }
    if (!layers.size) { this.raf = 0; return false; } } };

/* Home's town scene at a whole-number scale (27 Nov 2026 audit: object-fit:cover showed it at 2.36x, 1.78x and 0.56x;
   the art rule allows a fitted scale only on the Village page). The picture takes the smallest whole scale that covers
   the card's width (2x on desktop, 1x on phones), sits on the card's bottom edge and is cropped by it; any height left
   above is filled with the scene's own sky colour, so nothing is shrunk or stretched. The walkers' canvas follows. */
const sky = new Map();
const skyOf = img => { const k = img.currentSrc || img.src; if (sky.has(k)) return sky.get(k); let c = '';
  try { const cv = document.createElement('canvas'); cv.width = 1; cv.height = 1; const x = cv.getContext('2d'); x.drawImage(img, Math.floor(img.naturalWidth / 2), 1, 1, 1, 0, 0, 1, 1); const d = x.getImageData(0, 0, 1, 1).data; c = `rgb(${d[0]},${d[1]},${d[2]})`; } catch (e) { /* a tainted image keeps the panel colour */ }
  sky.set(k, c); return c; };
const fitHome = () => { const img = document.querySelector('.home-scene img.scene'); if (!img || !img.naturalWidth) return; const box = img.parentElement;
  img.removeAttribute('style'); box.style.height = ''; box.style.removeProperty('background-color');
  const bw = box.clientWidth, bh = box.clientHeight; if (!bw || !bh) return;
  const W = img.naturalWidth, H = img.naturalHeight, k = Math.max(1, Math.ceil(bw / W)), w = W * k, h = H * k;
  box.style.height = bh + 'px'; const c = skyOf(img); if (c) box.style.setProperty('background-color', c, 'important');
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
