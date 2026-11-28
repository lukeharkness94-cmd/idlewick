/* Idlewick: living towns (owner, 27 Nov 2026: "moving town scenes, animated animals and characters, smoother and higher
   FPS animations ... cosy, logical and like a warm dashboard we can feel at home in").
   The town scene (js/towns.js) is one still picture; while it paints, it records where its lit windows, chimneys,
   lanterns, homes, ponds and landmark are (A.sceneMeta[town]). This file lays three things over the Home and Village
   scenes, at the scene's own pixels so they scale with the picture exactly (whole scene pixels, never smoothed):
   - under the light: smoke rising from lived-in chimneys, the weather (rain, snow, sea mist, drifting cloud), animals
     (chickens pecking, sheep in their pens, a cat by a door, gulls over Saltmere, ducks on Gloomfen's ponds, birds
     crossing the sky), glints on the water;
   - the light: a tint for the time of day from the player's own clock (dawn, day, dusk, night), multiplied over the
     scene and the townsfolk walking in it (js/town_walkers.js);
   - over the light: windows and lanterns that glow at dusk and night, stars, fireflies, Emberfall's embers and the
     Hollow's motes.
   Since 28 Nov 2026 the towns are seen from above and painted at dusk (js/town_scene.js), so the night tint is
   gentler, there is no sky for stars (the Hollow keeps its motes), and the scene's own record says where the yards,
   pens, sea, water and lava are and how big each window is.
   Positions come from elapsed browser time at the screen's own refresh rate; a hidden tab does not catch up. More
   animals as the town is restored. Settings → Display → Town life: follow my clock or always daytime; weather on or
   off. Under Reduce effects and prefers-reduced-motion nothing moves: the light for the hour, lit windows and stars
   stay, still. Nothing here is clickable or saved. tests/town-life.cjs. */
(() => {
const Q = window.DQ, D = Q.data, UI = Q.ui, A = Q.pixelArt, S = () => Q.S;
if (!A) return;
const still = () => document.documentElement.classList.contains('calm') || (window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);
const hash = s => [...String(s)].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7);
const seeded = seed => () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
const rgb = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
const lerp = (a, b, t) => a + (b - a) * t, clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
const smooth = (e0, e1, x) => { const t = clamp((x - e0) / (e1 - e0)); return t * t * (3 - 2 * t); };
const restoredShare = town => { const ids = Object.keys(D.PROJECTS || {}).filter(k => D.PROJECTS[k].town === town && !D.PROJECTS[k].relic); return ids.length ? ids.filter(k => S().projects && S().projects[k]).length / ids.length : 0; };

/* ---------- the hour and its light ---------- */
/* settings.townTime: 'clock' (default) or 'day'; automated browsers show daytime unless a test sets DQ.townTimeOverride */
Q.townHour = () => { if (Q.townTimeOverride != null) return Q.townTimeOverride; const set = S() && S().settings && S().settings.townTime;
  if (set === 'day' || (set == null && navigator.webdriver)) return 13; const d = new Date(); return d.getHours() + d.getMinutes() / 60; };
/* dark: 0 by day, 1 at night; warm: the low sun at dawn and dusk */
Q.townLight = h => { const dark = h < 12 ? 1 - smooth(4.8, 7.4, h) : smooth(17.6, 21.2, h);
  const warm = Math.max(1 - Math.abs(h - 18.9) / 1.9, 1 - Math.abs(h - 6.1) / 1.5, 0);
  return { dark, warm, phase: dark > .8 ? 'night' : warm > .2 ? (h < 12 ? 'dawn' : 'dusk') : dark > .3 ? (h < 12 ? 'dawn' : 'dusk') : 'day' }; };
const tintOf = ({ dark, warm }) => { const w = [255, 255, 255], sun = [255, 168, 104], night = [46, 58, 120];
  const a = w.map((v, i) => lerp(v, sun[i], warm * .62)); return a.map((v, i) => Math.round(lerp(v, night[i], dark * .45 * (1 - warm * .45)))); };

/* ---------- weather: a fresh roll every 40 minutes, by town ---------- */
const WEATHER = { willowbrook: [['rain', .2]], mossbarrow: [['rain', .25]], saltmere: [['mist', .3], ['rain', .15]], ironpeak: [['snow', .65]],
  gloomfen: [['mist', .45], ['rain', .2]], emberfall: [], skyreach: [['snow', .25], ['cloud', .5]], hollow: [['mist', .25]] };
Q.townWeather = (town, now = Date.now()) => { if (Q.townWeatherOverride !== undefined) return Q.townWeatherOverride; if (S() && S().settings && S().settings.townWeather === false) return 'clear';
  const r = (hash(town + ':' + Math.floor(now / 2.4e6)) % 1000) / 1000; let acc = 0;
  /* in winter the lowland towns see snow too */
  const table = (Q.season && Q.season() === 'winter' && !/ironpeak|skyreach|emberfall/.test(town) ? [['snow', .3]] : []).concat(WEATHER[town] || []);
  for (const [k, p] of table) { acc += p; if (r < acc) return k; } return 'clear'; };

/* ---------- little animals, drawn at town scale (5 to 7 px), two frames each ---------- */
const px = (x, c, X, Y, w = 1, h = 1) => { x.fillStyle = c; x.fillRect(Math.round(X), Math.round(Y), w, h); };
const ART = {
  chicken: (x, X, Y, f, dir) => { const o = dir < 0 ? -1 : 1, hx = dir < 0 ? X : X + 2; px(x, '#f4f0e8', X, Y - 2, 3, 2); px(x, '#d8d0c0', X, Y - 1, 3, 1);
    if (f) { px(x, '#f4f0e8', hx + o, Y - 1); px(x, '#e04030', hx + o, Y - 2); px(x, '#e0a030', hx + 2 * o, Y); } else { px(x, '#f4f0e8', hx, Y - 3); px(x, '#e04030', hx, Y - 4); px(x, '#e0a030', hx + o, Y - 3); }
    px(x, '#e0a030', X + 1, Y); },
  sheep: (x, X, Y, f, dir) => { px(x, '#f2eee4', X, Y - 4, 6, 3); px(x, '#ffffff', X + 1, Y - 4, 3, 1); px(x, '#d8d2c4', X, Y - 2, 6, 1);
    const hx = dir < 0 ? X - 2 : X + 6; px(x, '#3a3030', hx, f ? Y - 3 : Y - 4, 2, 2); px(x, '#3a3030', X + 1, Y - 1, 1, 1); px(x, '#3a3030', X + 4, Y - 1, 1, 1); },
  cat: (x, X, Y, f, dir, col) => { const dk = '#00000040'; px(x, col, X, Y - 3, 4, 3); px(x, col, dir < 0 ? X - 1 : X + 3, Y - 5, 2, 2); px(x, col, dir < 0 ? X - 1 : X + 3, Y - 6); px(x, col, dir < 0 ? X : X + 4, Y - 6);
    const tx = dir < 0 ? X + 4 : X - 1; px(x, col, tx, Y - (f ? 4 : 2), 1, f ? 3 : 2); px(x, dk, X, Y - 1, 4, 1); },
  duck: (x, X, Y, f, dir) => { px(x, '#8a6a42', X, Y - 2, 4, 2); const hx = dir < 0 ? X - 1 : X + 3; px(x, '#3a7a4a', hx, Y - 4, 2, 2); px(x, '#e0a030', dir < 0 ? hx - 1 : hx + 2, Y - 3); px(x, '#ffffff60', X - 1, Y, 6, 1); },
  bird: (x, X, Y, f, dir, col) => { px(x, col, X, Y); px(x, col, X - 1, Y - (f ? 1 : 0)); px(x, col, X + 1, Y - (f ? 1 : 0)); if (f) { px(x, col, X - 2, Y - 1); px(x, col, X + 2, Y - 1); } else { px(x, col, X - 2, Y + 1); px(x, col, X + 2, Y + 1); } }
};

/* ---------- one town's life ---------- */
const build = (town, meta) => { const rnd = seeded(hash(town + ':life')), share = restoredShare(town), st = meta.style || {}, W = meta.W, H = meta.H;
  const L = { town, meta, animals: [], puffs: [], drops: [], stars: [], flies: [], glints: [], birds: null, birdWait: 6 + rnd() * 20, t: 0 };
  const skyMax = st.snow ? 40 : 62;
  for (let i = 0; i < 70; i++) L.stars.push({ x: Math.floor(rnd() * W), y: Math.floor(rnd() * skyMax), p: rnd() * 6.28, big: rnd() < .12 });
  const top = !!meta.topdown, yards = top ? (meta.yards || []) : (st.sea ? [] : [[20, W - 20, 292, 316]]);
  if (yards.length && !meta.ruined && town !== 'hollow') for (let i = 0, n = 3 + Math.round(3 * share); i < n; i++) { const [a, b, y0, y1] = yards[i % yards.length]; L.animals.push({ kind: 'chicken', x: a + 10 + rnd() * (b - a - 20), y: y0 + rnd() * (y1 - y0), x0: a, x1: b, dir: rnd() < .5 ? -1 : 1, pace: 4, mode: 'idle', wait: rnd() * 3, f: 0 }); }
  /* sheep in the fenced pens at the meadow's edge, and in Mossbarrow's fields */
  const pens = top ? (meta.pens || []).map(([a, b, y]) => [a, b, y]) : (!st.sea && /willowbrook|mossbarrow|skyreach/.test(town) ? [[6, 82, 348], [566, 632, 348]] : []);
  if (!meta.ruined) for (const [a, b, y] of pens) for (let i = 0; i < 1 + Math.round(share); i++) L.animals.push({ kind: 'sheep', x: a + rnd() * (b - a - 8), y: y + rnd() * 6, x0: a, x1: b - 8, dir: rnd() < .5 ? -1 : 1, pace: 2, mode: 'idle', wait: rnd() * 5, f: 0 });
  if (top && st.fields) for (let i = 0; i < 3 + Math.round(2 * share); i++) L.animals.push({ kind: 'sheep', x: 20 + rnd() * (W - 60), y: 98 + rnd() * 8, x0: 10, x1: W - 20, dir: rnd() < .5 ? -1 : 1, pace: 2, mode: 'idle', wait: rnd() * 5, f: 0 });
  if (!top && st.fields) for (let i = 0; i < 3 + Math.round(2 * share); i++) { const right = i % 2; L.animals.push({ kind: 'sheep', x: (right ? 450 : 10) + rnd() * 170, y: 116 + rnd() * 16, x0: right ? 444 : 4, x1: right ? 630 : 230, dir: rnd() < .5 ? -1 : 1, pace: 2, mode: 'idle', wait: rnd() * 5, f: 0 }); }
  /* a cat by the door of a lived-in home */
  const homes = (meta.homes || []).filter(h => h[4]); if (homes.length && town !== 'hollow') { const h = homes[Math.floor(rnd() * homes.length)]; L.animals.push({ kind: 'cat', x: h[0] + h[2] + 2, y: h[1] + 1, x0: h[0] - 6, x1: h[0] + h[2] + 8, dir: -1, pace: 3, mode: 'idle', wait: 4, f: 0, col: ['#e0a060', '#5a5050', '#f4f0e8'][Math.floor(rnd() * 3)], sits: true }); }
  for (const [cx, cy, rx] of meta.ponds || []) L.animals.push({ kind: 'duck', x: cx - rx * .4, y: cy + 1, x0: cx - rx * .7, x1: cx + rx * .6, dir: 1, pace: 3, mode: 'walk', wait: 0, f: 0 });
  const gullY = meta.sea ? meta.sea[0] + 8 : 70;
  if (st.sea) for (let i = 0; i < 3 + Math.round(2 * share); i++) L.animals.push({ kind: 'gull', cx: 80 + rnd() * 480, cy: gullY + rnd() * 24, r: 14 + rnd() * 20, a: rnd() * 6.28, sp: (.35 + rnd() * .3) * (rnd() < .5 ? -1 : 1) });
  if (top) for (const [wx, wy, ww, wh] of meta.water || []) for (let i = 0, n = Math.round(ww * wh / 900); i < n; i++) L.glints.push({ x: wx + rnd() * ww, y: wy + 2 + rnd() * (wh - 3), p: rnd() * 6.28, w: 3 + Math.floor(rnd() * 4) });
  else if (st.sea) { for (let i = 0; i < 26; i++) L.glints.push({ x: rnd() * W, y: 84 + rnd() * 36, p: rnd() * 6.28, w: 3 + Math.floor(rnd() * 4) }); for (let i = 0; i < 22; i++) L.glints.push({ x: rnd() * W, y: 332 + rnd() * 26, p: rnd() * 6.28, w: 3 + Math.floor(rnd() * 4) }); }
  for (const c of meta.chimneys || []) L.puffs.push(...[0, 1, 2].map(k => ({ cx: c[0], cy: c[1] - (top ? 1 : 18), age: k * 1.6 + rnd() * 1.6, life: 4.8, drift: .4 + rnd() * .6 })));
  for (let i = 0; i < 22; i++) L.flies.push({ x: rnd() * W, y: 150 + rnd() * 170, p: rnd() * 6.28, s: .6 + rnd() * .8 });
  /* the season (Q.season, js/hearth.js): leaves in autumn, blossom in spring, butterflies in summer */
  L.fall = Array.from({ length: 34 }, () => ({ x: rnd() * W, y: rnd() * H, p: rnd() * 6.28, s: 8 + rnd() * 8, c: Math.floor(rnd() * 3) }));
  L.flutter = Array.from({ length: 5 }, () => ({ x: 40 + rnd() * (W - 80), y: 280 + rnd() * 40, p: rnd() * 6.28, c: Math.floor(rnd() * 3) }));
  L.weather = '';
  return L; };

/* ---------- moving everything on (dt in seconds) ---------- */
const step = (L, dt) => { L.t += dt; const W = L.meta.W, H = L.meta.H, wx = Q.townWeather(L.town);
  for (const a of L.animals) {
    if (a.kind === 'gull') { a.a += a.sp * dt; continue; }
    if (a.mode === 'idle') { a.wait -= dt; a.f = a.kind === 'chicken' ? (Math.sin(L.t * 7 + a.x) > .4 ? 1 : 0) : a.kind === 'cat' ? (Math.sin(L.t * 1.3 + a.x) > .6 ? 1 : 0) : (Math.sin(L.t * 2 + a.x) > .7 ? 1 : 0);
      if (a.wait <= 0) { a.mode = 'walk'; a.goal = clamp(a.x + (Math.random() - .5) * (a.kind === 'sheep' ? 24 : 40), a.x0, a.x1); a.dir = a.goal < a.x ? -1 : 1; } }
    else { const d = a.pace * dt; a.x += a.dir * d; a.f = Math.floor(L.t * 6) % 2;
      if (a.kind === 'duck') { if (a.x > a.x1 || a.x < a.x0) { a.dir = -a.dir; a.x = clamp(a.x, a.x0, a.x1); } continue; }
      if ((a.dir > 0 && a.x >= a.goal) || (a.dir < 0 && a.x <= a.goal)) { a.mode = 'idle'; a.wait = (a.kind === 'cat' ? 6 : 2) + Math.random() * (a.kind === 'sheep' ? 8 : 4); } } }
  for (const p of L.puffs) { p.age += dt; if (p.age > p.life) p.age -= p.life; }
  /* weather particles: spawn while the weather lasts; the ones in the air finish their fall when it stops */
  const want = wx === 'rain' ? 150 : wx === 'snow' ? 110 : 0;
  if (L.drops.length < want) for (let i = 0; i < Math.min(8, want - L.drops.length); i++) L.drops.push({ x: Math.random() * (W + 60) - 30, y: -Math.random() * H * .5, kind: wx, s: wx === 'rain' ? 150 + Math.random() * 60 : 14 + Math.random() * 12, p: Math.random() * 6.28, big: Math.random() < .2 });
  L.drops = L.drops.filter(d => { if (d.kind === 'rain') { d.y += d.s * dt; d.x -= d.s * .18 * dt; } else { d.y += d.s * dt; d.x += Math.sin(L.t * 1.3 + d.p) * 6 * dt; }
    if (d.y > H) { if (L.drops.length > want) return false; d.y = -4; d.x = Math.random() * (W + 60) - 30; } return true; });
  L.weather = wx; L.season = Q.season ? Q.season() : '';
  if (L.season === 'autumn' || L.season === 'spring') for (const f of L.fall) { f.y += f.s * dt; f.x += Math.sin(L.t * 1.1 + f.p) * 9 * dt - 3 * dt; if (f.y > H || f.x < -4) { f.y = -4; f.x = Math.random() * (W + 40); } }
  if (L.season === 'summer') for (const b of L.flutter) { b.x += Math.cos(L.t * .7 + b.p) * 10 * dt; b.y += Math.sin(L.t * 1.3 + b.p) * 6 * dt; }
  if (L.birds) { L.birds.x += L.birds.dir * 22 * dt; if (L.birds.x < -40 || L.birds.x > W + 40) L.birds = null; }
  else if ((L.birdWait -= dt) <= 0) { const dir = Math.random() < .5 ? -1 : 1; L.birds = { x: dir > 0 ? -20 : W + 20, y: 18 + Math.random() * 34, dir, n: 3 + Math.floor(Math.random() * 3) }; L.birdWait = 25 + Math.random() * 35; } };

/* ---------- drawing ---------- */
const ell = (x, c, cx, cy, rx, ry) => { x.fillStyle = c; for (let j = -Math.ceil(ry); j <= Math.ceil(ry); j++) { const w = Math.round(rx * Math.sqrt(Math.max(0, 1 - (j * j) / (ry * ry + .01)))); if (w > 0) x.fillRect(Math.round(cx - w), Math.round(cy + j), w * 2, 1); } };
const drawUnder = (L, x, moving) => { const { W, H, style: st = {} } = L.meta; x.clearRect(0, 0, W, H); if (!moving) return;
  /* glints on the water */
  for (const g of L.glints) { const a = (Math.sin(L.t * 1.7 + g.p) + 1) / 2; if (a < .45) continue; px(x, `rgba(240,250,255,${(a - .45) * 1.4})`, g.x + Math.sin(L.t * .4 + g.p) * 3, g.y, g.w, 1); }
  /* chimney smoke above the painted wisps: a puff swells, drifts with the wind and thins out */
  for (const p of L.puffs) { const k = p.age / p.life, a = .42 * (1 - k) * Math.min(1, p.age * 2); if (a <= .02) continue; ell(x, `rgba(234,234,238,${a.toFixed(3)})`, p.cx + k * 14 * p.drift + Math.sin(p.age * 1.4) * 1.2, p.cy - k * 26, 1.6 + k * 2.6, 1.2 + k * 1.6); }
  for (const a of L.animals) { if (a.kind === 'gull') { ART.bird(x, a.cx + Math.cos(a.a) * a.r * 1.6, a.cy + Math.sin(a.a) * a.r * .5, Math.floor(L.t * 4 + a.r) % 2, 1, '#f8f8f8'); continue; } ART[a.kind](x, a.x, a.y, a.f, a.dir, a.col); }
  if (L.birds) for (let i = 0; i < L.birds.n; i++) ART.bird(x, L.birds.x - L.birds.dir * i * 6, L.birds.y + (i % 2) * 3 + Math.sin(L.t * 2 + i) * 1.5, Math.floor(L.t * 5 + i) % 2, L.birds.dir, st.stars ? '#2a2238' : '#3a3a44');
  /* the season */
  const LEAF = L.season === 'spring' ? ['#f4c4d0', '#f8dce4', '#ffffff'] : ['#d8782a', '#c8482a', '#e8b040'];
  if (L.season === 'autumn' || L.season === 'spring') for (const f of L.fall) { px(x, LEAF[f.c], f.x, f.y, 2, 1); if (Math.sin(L.t * 3 + f.p) > 0) px(x, LEAF[f.c], f.x + 1, f.y + 1); }
  if (L.season === 'summer' && L.lightDark < .4) for (const b of L.flutter) { const up = Math.floor(L.t * 8 + b.p) % 2, c = ['#f0d060', '#f4f0f4', '#e09040'][b.c]; px(x, c, b.x - 1, b.y - up); px(x, c, b.x + 1, b.y - up); px(x, '#3a3030', b.x, b.y); }
  /* weather */
  if (L.weather === 'mist' || L.weather === 'cloud') { const top = L.weather === 'cloud' ? 96 : 120; for (let i = 0; i < 6; i++) { const y = top + i * 34 + Math.sin(L.t * .2 + i) * 4, off = (L.t * (6 + i) + i * 97) % (W + 260) - 130;
    x.fillStyle = L.weather === 'cloud' ? 'rgba(246,251,252,.55)' : 'rgba(230,236,240,.16)'; x.fillRect(Math.round(off), Math.round(y), 180, 8); x.fillRect(Math.round(off + 16), Math.round(y - 4), 140, 4); x.fillRect(Math.round(off - 120 + W / 2), Math.round(y + 12), 220, 6); } }
  for (const d of L.drops) if (d.kind === 'rain') { px(x, 'rgba(206,220,240,.55)', d.x, d.y, 1, 3); px(x, 'rgba(206,220,240,.35)', d.x + 1, d.y - 2, 1, 2); } else px(x, 'rgba(250,252,255,.9)', d.x, d.y, d.big ? 2 : 1, d.big ? 2 : 1); };

const drawOver = (L, x, light, moving) => { const { W, H, style: st = {} } = L.meta, dk = light.dark, t = moving ? L.t : 0; x.clearRect(0, 0, W, H);
  /* stars come out as the sky darkens (the Hollow's are painted in) */
  if (dk > .45 && !st.stars && !L.meta.topdown) for (const s of L.stars) { const a = (dk - .45) / .55 * (.55 + .45 * Math.sin(t * 1.5 + s.p)); px(x, `rgba(255,250,232,${a.toFixed(3)})`, s.x, s.y, s.big ? 2 : 1, 1); }
  /* lit windows and lanterns glow above the darkened town; each flickers a little like a candle */
  const glow = clamp((dk - .2) / .6);
  if (glow > 0) { const halo = (X, Y, w, h, col, a, r) => { const [R, G, B] = rgb(col); for (let k = r; k >= 1; k--) px(x, `rgba(${R},${G},${B},${(a * .16 / k).toFixed(3)})`, X - k, Y - k, w + 2 * k, h + 2 * k); px(x, `rgba(${R},${G},${B},${a.toFixed(3)})`, X, Y, w, h); };
    for (const [wx, wy, col, ww, wh] of L.meta.windows || []) { const f = moving ? .85 + .15 * Math.sin(t * 3.1 + wx * .7 + wy) : 1; halo(wx, wy, ww || 4, wh || 4, col, glow * f, 2); }
    for (const [lx, ly, col] of L.meta.lamps || []) halo(lx - 2, ly - 2, 4, 4, col, glow * (moving ? .85 + .15 * Math.sin(t * 2.3 + lx) : 1), 4);
    const lm = L.meta.landmark; if (lm && lm.kind === 'lighthouse') { const bx = lm.beam ? lm.beam[0] : lm.x + Math.round(lm.w / 2), by = lm.beam ? lm.beam[1] : lm.y + 10; halo(bx - 2, by - 2, 4, 4, '#fff2b0', glow, 5);
      if (moving) { const sw = Math.sin(t * .8); x.fillStyle = `rgba(255,242,176,${(.10 * glow).toFixed(3)})`; for (let i = 1; i < 26; i++) x.fillRect(Math.round(bx + sw * i * 6), by - 1 - Math.floor(i / 9), 6, 2 + Math.floor(i / 9)); } } }
  if (!moving) return;
  /* fireflies over Gloomfen and the meadows on a summer night; embers over Emberfall; motes in the Hollow */
  if ((/gloomfen|willowbrook|mossbarrow/.test(L.town) && dk > .6) || L.town === 'gloomfen') for (const f of L.flies) { const a = (Math.sin(t * 2.2 * f.s + f.p) + 1) / 2; if (a < .5) continue; px(x, `rgba(214,255,140,${((a - .5) * 1.6 * Math.max(dk, L.town === 'gloomfen' ? .5 : 0)).toFixed(3)})`, f.x + Math.sin(t * .5 * f.s + f.p) * 10, f.y + Math.cos(t * .4 * f.s + f.p) * 6, 1, 1); }
  if (st.lava && (L.meta.lava || []).length) for (const [i, f] of L.flies.entries()) { const [lx, ly] = L.meta.lava[i % L.meta.lava.length], k = ((t * f.s * .18 + f.p) % 1); px(x, `rgba(255,${150 + Math.round(60 * (1 - k))},70,${(.9 * (1 - k)).toFixed(3)})`, lx + (f.x % 60) - 30 + Math.sin(t + f.p) * 4, ly - k * 90, 1, 1); }
  else if (st.lava) for (const f of L.flies) { const k = ((t * f.s * .18 + f.p) % 1), y = 132 - k * 110 + (f.y - 150) * .1; px(x, `rgba(255,${150 + Math.round(60 * (1 - k))},70,${(.9 * (1 - k)).toFixed(3)})`, f.x + Math.sin(t + f.p) * 4, y, 1, 1); }
  if (st.stars) for (const f of L.flies) { const a = (Math.sin(t * 1.4 * f.s + f.p) + 1) / 2; if (a < .6) continue; px(x, `rgba(200,168,255,${((a - .6) * 2).toFixed(3)})`, f.x + Math.sin(t * .3 + f.p) * 14, f.y - ((t * 4 * f.s) % 60), 1, 1); } };

/* ---------- layers over each scene image ---------- */
const layers = new Set();
const place = (el, img, cover) => { const cs = getComputedStyle(img), box = img.parentElement;
  if (cover) Object.assign(el.style, { left: -box.clientLeft + 'px', top: -box.clientTop + 'px', width: box.offsetWidth + 'px', height: box.offsetHeight + 'px', borderRadius: getComputedStyle(box).borderRadius });
  else Object.assign(el.style, { left: img.offsetLeft + 'px', top: img.offsetTop + 'px', width: img.offsetWidth + 'px', height: img.offsetHeight + 'px', objectFit: cs.objectFit, objectPosition: cs.objectPosition, borderRadius: cs.borderRadius }); };
const fit = L => { if (!L.img.isConnected) return; place(L.under, L.img); place(L.over, L.img); place(L.tint, L.img, L.home); place(L.glow, L.img, L.home); };
const attach = img => { if (img.dataset.life || img.classList.contains('scene-old') || !img.dataset.town) return;
  const go = () => { if (!img.isConnected || img.dataset.life) return; const town = img.dataset.town, meta = A.sceneMeta && A.sceneMeta[town]; if (!meta || !img.naturalWidth) return;
    img.dataset.life = '1'; const mk = (tag, cls) => { const e = document.createElement(tag); e.className = cls; e.setAttribute('aria-hidden', 'true'); if (tag === 'canvas') { e.width = meta.W; e.height = meta.H; } return e; };
    const under = mk('canvas', 'town-life town-life-under'), tint = mk('div', 'town-tint'), glow = mk('div', 'town-glow'), over = mk('canvas', 'town-life town-life-over');
    img.after(under, tint, glow, over);
    const L = Object.assign(build(town, meta), { img, under, tint, glow, over, ux: under.getContext('2d'), ox: over.getContext('2d'), home: !!img.closest('.home-scene') });
    if (window.ResizeObserver) { L.ro = new ResizeObserver(() => fit(L)); L.ro.observe(img); if (L.home) L.ro.observe(img.parentElement); } fit(L); layers.add(L); paint(L, 0); requestAnimationFrame(() => tint.classList.add('eased')); tick.start(); };
  if (img.complete) go(); else img.addEventListener('load', go, { once: true }); };
const paint = (L, dt) => { const moving = !still(); if (moving && dt) step(L, dt); const light = Q.townLight(Q.townHour()), [r, g, b] = tintOf(light); L.lightDark = light.dark;
  L.tint.style.backgroundColor = `rgb(${r},${g},${b})`; L.tint.dataset.phase = light.phase;
  /* the low sun warms the sky (an overlay, so a blue sky turns gold and rose rather than brown) */
  const sw = light.warm * (1 - light.dark * .5); L.glow.style.background = sw > .02 ? `linear-gradient(to bottom, rgba(255,128,72,${(sw * .85).toFixed(3)}) 0%, rgba(255,176,96,${(sw * .55).toFixed(3)}) 34%, rgba(255,190,120,${(sw * .25).toFixed(3)}) 60%, rgba(255,190,120,0) 85%)` : 'none'; drawUnder(L, L.ux, moving); drawOver(L, L.ox, light, moving); };
Q.townLifeScan = () => document.querySelectorAll('.home-scene img.scene[data-town], .village-scene>img.scene[data-town]').forEach(attach);
/* for tests: what each layer is showing right now */
Q.townLifeLive = () => [...layers].filter(L => L.img.isConnected).map(L => ({ town: L.town, phase: L.tint.dataset.phase, tint: L.tint.style.backgroundColor, weather: L.weather, windows: (L.meta.windows || []).length, chimneys: (L.meta.chimneys || []).length,
  animals: L.animals.map(a => ({ kind: a.kind, x: Math.round(a.kind === 'gull' ? a.cx + Math.cos(a.a) * a.r * 1.6 : a.x) })), drops: L.drops.length }));

const tick = { raf: 0, last: 0, start() { if (!this.raf) { this.last = performance.now(); this.raf = Q.frame.add((dt, t) => this.run(t)); } }, /* the shared animation clock (util.js) */
  run(t) { const dt = Math.min(.1, Math.max(0, (t - this.last) / 1000)); this.last = t; /* a hidden tab never catches up */
    const calm = still();
    for (const L of layers) { if (!L.img.isConnected) { L.ro && L.ro.disconnect(); layers.delete(L); continue; }
      /* still: nothing moves; the light is brought up to the hour twice a minute */
      if (!calm) { paint(L, dt); L.calmAt = 0; } else if (!L.calmAt || t - L.calmAt > 30000) { paint(L, 0); L.calmAt = t; } }
    if (!layers.size) { this.raf = 0; return false; } } };

/* ---------- Settings → Display → Town life ---------- */
Q.townLifeSettings = () => { const s = S().settings, clock = s.townTime !== 'day', wet = s.townWeather !== false;
  return `<div class="settings-field"><h3>Time of day in town</h3><div class="btnrow wrap"><button class="btn ${clock ? 'on' : ''}" data-do="townclock" data-a="clock" aria-pressed="${clock}">Follow my clock</button><button class="btn ${clock ? '' : 'on'}" data-do="townclock" data-a="day" aria-pressed="${!clock}">Always daytime</button></div><small class="dim">Dawn, dusk and night with lit windows, from your device's clock.</small></div>
  <button class="tog ${wet ? 'on' : ''}" data-do="townweather" role="switch" aria-checked="${wet}"><span class="sw"></span><span><b>Weather</b><small>Rain, snow and sea mist come and go in each town.</small></span></button>`; };
UI.DO.townclock = v => { if (!['clock', 'day'].includes(v)) return; S().settings.townTime = v; Q.save && Q.save(); UI.render(false); for (const L of layers) paint(L, 0); };
UI.DO.townweather = () => { const s = S().settings; s.townWeather = s.townWeather === false; Q.save && Q.save(); UI.render(false); };

const render0 = UI.render;
UI.render = (...a) => { const r = render0(...a); try { Q.townLifeScan(); } catch (e) { /* the scene stays as painted */ } return r; };
})();
