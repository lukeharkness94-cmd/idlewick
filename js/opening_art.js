/* Idlewick: the opening's own pictures (owner, 28 Nov 2026: "use the new interactive characters, motions etc to make the
   opening scene far more immersive"; played by js/intro.js). Original pixel art drawn in code with the town painter's
   material engine (js/town_scene.js A.townPx: five-step ramps, top-left light, an outline in each material's darkest
   colour) and the district painter's palette (js/towns.js, js/pixel_world.js A.TOWN):
   - the noon bell in its belfry, close up and side-on (64 x 64), swinging through five drawn angles, and the same
     belfry with only the rope left, swaying;
   - the belfry seen from above at town scale (32 x 32), built from the town's own bell-frame site piece, with the bell
     nudged a pixel either way as it swings, or the rope alone;
   - the road home seen side-on (320 x 180, the district's pixel scale, so the 24 x 32 hero walks it at 1.7 m): sky,
     far hills, the hedgerow and trees, and the road and its verge, each layer seamless so it can scroll for parallax;
     the season's touch on the verge; a signpost for Willowbrook;
   - Wren's envelope with its red wax seal (small on the lodging floor, large when opened) and the two halves of the
     seal as it breaks.
   Every scenery layer passes through the one dusk grade (A.dusk); the hero, the bell and the envelope do not. */
(() => {
const Q = window.DQ, A = Q.pixelArt; if (!A) return;
const cache = new Map(), memo = (k, make) => { if (!cache.has(k)) cache.set(k, make()); return cache.get(k); };
const TP = () => A.townPx, mixc = (a, b, k) => (A.mix ? A.mix(a, b, k) : a);
const canvas = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };
const rot = (pts, a, px, py) => { const c = Math.cos(a), s = Math.sin(a); return pts.map(([x, y]) => [px + (x - px) * c - (y - py) * s, py + (x - px) * s + (y - py) * c]); };

/* ---------- the belfry, close up (64 x 64), with its own patch of sky ---------- */
const SKY = { noon: ['#5a8ac8', '#6e9ad0', '#86acd8', '#9cbedc'], dusk: ['#2a2a54', '#4a3a64', '#8a5a6a', '#c8806a'], dawn: ['#3a4a7a', '#7a6a8a', '#c89a8a', '#e8c09a'], night: ['#0a0e1e', '#10162a', '#161e34', '#1c2640'] };
const ANGLES = [-26, -13, 0, 13, 26];
A.openingBelfry = (state = 'bell', i = 2, sky = 'noon') => memo(`belfry:${state}:${i}:${sky}`, () => {
  const { Spr, fixed } = TP(), s = new Spr(64, 64);
  const stone = s.mat('#7e7a86'), stoneDk = s.mat('#5a5664'), wood = s.mat('#7a5232'), roof = s.mat('#a8463a'), bronze = s.mat('#c89640', { warm: '#fff0b8' }), iron = s.mat('#4a4a54'), rope = s.mat('#c8b48a');
  /* the roof, the two piers and the sill */
  s.poly([[2, 18], [32, 1], [62, 18], [58, 21], [6, 21]], roof); s.edges(roof); for (let x = 8; x < 58; x += 5) s.line(x, 19, x + 3, 14 - Math.abs(32 - x) * .25, roof, 1);
  for (const x0 of [4, 50]) { s.rect(x0, 20, 10, 44, stone); for (let y = 24; y < 64; y += 6) s.line(x0, y, x0 + 9, y, stoneDk, 1); for (let y = 21; y < 64; y += 12) s.dot(x0 + 5, y + 3, stoneDk, 1); }
  s.rect(4, 58, 56, 6, stone, { flat: 2 }); s.line(4, 58, 59, 58, stone, 3);
  /* the arch over the opening */
  for (let x = 14; x < 50; x++) { const d = (x - 31.5) / 18, y = Math.round(21 + 8 * (1 - Math.sqrt(Math.max(0, 1 - d * d)))); for (let yy = 21; yy <= y; yy++) s.set(x, yy, stone, yy === y ? 1 : 2); }
  /* the headstock beam the bell hangs from */
  s.rect(12, 22, 40, 3, wood); s.dot(31, 25, iron, 2); s.dot(32, 25, iron, 2);
  const a = (ANGLES[i] || 0) * Math.PI / 180, P = [32, 25];
  if (state === 'bell') {
    /* the bell: crown, shoulder, waist and the flared lip, lit on its left; it turns on the beam */
    const body = [[28, 26], [36, 26], [38, 29], [39, 36], [41, 43], [46, 49], [46, 51], [18, 51], [18, 49], [23, 43], [25, 36], [26, 29]];
    s.poly(rot(body, a, ...P), bronze);
    /* cast bronze is round: light it across its own width (lit on the left, a bright streak, shadow on the right),
       measured in the bell's own frame so the light stays put on the metal as it swings */
    const half = ly => ly < 29 ? 4 + (ly - 26) * .7 : ly < 36 ? 6 + (ly - 29) * .15 : ly < 43 ? 7 + (ly - 36) * .3 : 9 + (ly - 43) * .8;
    for (let y = 0; y < 64; y++) for (let x = 0; x < 64; x++) { if (s.get(x, y) !== bronze) continue; const [lx, ly] = rot([[x + .5, y + .5]], -a, ...P)[0], u = (lx - 32) / Math.max(2, half(ly));
      s.set(x, y, bronze, u < -.7 ? 3 : u < -.42 ? 4 : u < -.1 ? 3 : u < .5 ? 2 : u < .85 ? 1 : 0); }
    const [l0, l1] = rot([[19, 49], [45, 49]], a, ...P); s.line(l0[0], l0[1], l1[0], l1[1], bronze, 1); /* the band at the lip */
    /* the clapper lags the swing a little */
    const [cx, cy] = rot([[32, 50]], a * .55, ...P)[0]; s.ell(cx, cy + 1, 2.2, 2.2, iron);
    const [r0, r1] = rot([[34, 51], [34, 58]], a * .3, ...P); s.line(r0[0], r0[1], r1[0], 63, rope, 2);
  } else {
    /* only the rope, cut short, swaying a bit guiltily */
    const sway = [-4, -2, 0, 2, 4][i] || 0, end = [32 + sway, 50];
    s.line(32, 25, end[0], end[1], rope, 3); s.line(33, 25, end[0] + 1, end[1], rope, 2);
    s.dot(end[0] - 1, end[1] + 1, rope, 2); s.dot(end[0] + 1, end[1] + 2, rope, 1); s.dot(end[0] + 2, end[1] + 1, rope, 3);
  }
  s.outline();
  const c = canvas(64, 64), x = c.getContext('2d'), bands = SKY[sky] || SKY.noon;
  bands.forEach((col, k) => { x.fillStyle = col; x.fillRect(0, k * 16, 64, 16); });
  if (sky === 'night' || sky === 'dusk') { x.fillStyle = '#f4ecd0'; for (const [sx, sy] of [[18, 30], [44, 34], [26, 44], [40, 28], [21, 52]]) x.fillRect(sx, sy, 1, 1); }
  x.drawImage(s.canvas(), 0, 0); return c; });
A.OPENING_BELL_ANGLES = ANGLES;

/* ---------- the belfry from above, at town scale (32 x 32): the town's own bell-frame site, the bell nudged or gone ---------- */
A.openingBelfryTop = (state = 'bell', nudge = 0) => memo(`belfrytop:${state}:${nudge}`, () => {
  const c = canvas(32, 32), x = c.getContext('2d'), piece = A.stagePiece ? A.stagePiece('bell', 4) : null; if (!piece) return c;
  const src = piece.canvas(), bell = canvas(14, 13); bell.getContext('2d').drawImage(src, 9, 9, 14, 13, 0, 0, 14, 13);
  x.drawImage(src, 0, 0); x.clearRect(9, 9, 14, 13);
  if (state === 'bell') x.drawImage(bell, 9 + nudge, 9);
  else { const f = (col, a, b, w, h) => { x.fillStyle = col; x.fillRect(a, b, w, h); }; for (let y = 9; y < 20; y++) { const dx = Math.round(nudge * (y - 9) / 11); f('#2a1c10', 15 + dx, y, 3, 1); f('#c8b48a', 16 + dx, y, 1, 1); } f('#e0d0a8', 16 + nudge, 20, 1, 1); }
  return c; });

/* ---------- the road home, side-on (320 x 180), four seamless layers for parallax ---------- */
const RW = 320, RH = 180, GROUND = 160; /* the hero's feet */
A.OPENING_ROAD = { w: RW, h: RH, ground: GROUND };
const wrapDraw = (x, img, X, Y) => { for (const o of [-RW, 0, RW]) x.drawImage(img, Math.round(X + o), Math.round(Y)); };
const ridgeY = (i, base, amp, seed, cycles = [2, 5]) => { const t = i / RW * Math.PI * 2; return Math.round(base + Math.sin(t * cycles[0] + seed) * amp + Math.sin(t * cycles[1] + seed * 2) * amp * .35); };
const ridge = (x, col, base, amp, seed, cycles = [2, 5]) => { x.fillStyle = col; for (let i = 0; i < RW; i++) { const y = ridgeY(i, base, amp, seed, cycles); x.fillRect(i, y, 1, RH - y); } };
A.openingRoad = (town = 'willowbrook', season = 'autumn') => memo(`road:${town}:${season}`, () => {
  const T = (A.TOWN && A.TOWN[town]) || { sky: ['#a8d8ec', '#b8e0ee', '#cbe8ef'], hills: ['#8cbf74', '#79b04f'], ground: '#6aa244', path: '#cdb07a' };
  const st = (A.TOWN_STYLE && A.TOWN_STYLE[town]) || { leaf: '#5f9a45', walls: ['#e8dcc0'], roofs: ['#c8a050'] }, rnd = A.townSeeded ? A.townSeeded('road:' + town) : Math.random;
  const L = { sky: canvas(RW, RH), far: canvas(RW, RH), mid: canvas(RW, RH), near: canvas(RW, RH) };
  const g = k => L[k].getContext('2d'), f = (x, col, a, b, w, h) => { x.fillStyle = col; x.fillRect(Math.round(a), Math.round(b), Math.round(w), Math.round(h)); };
  /* sky: bands from high to the horizon, and a few flat-bottomed clouds */
  { const x = g('sky'), cols = [mixc(T.sky[0], '#1a2a5a', .35), mixc(T.sky[0], '#1a2a5a', .15), T.sky[0], T.sky[1], T.sky[2], mixc(T.sky[2], '#fff2c8', .25)];
    cols.forEach((c, k) => f(x, c, 0, k * 20, RW, 20)); f(x, cols[5], 0, 120, RW, RH - 120);
    /* a dithered seam between bands, so the sky steps rather than stripes */
    for (let k = 1; k < 6; k++) for (let i = 0; i < RW; i++) { if ((i + k) % 2 === 0) f(x, cols[k - 1], i, k * 20, 1, 1); if ((i + k) % 2 === 1) f(x, cols[k], i, k * 20 - 1, 1, 1); if (i % 4 === k % 4) f(x, cols[k - 1], i, k * 20 + 1, 1, 1); }
    for (const [cx, cy, w] of [[30, 24, 40], [140, 14, 56], [236, 30, 34], [290, 50, 26]]) { const cl = mixc(T.sky[0], '#ffffff', .78), sh = mixc(T.sky[0], '#ffffff', .5);
      for (const o of [-RW, 0, RW]) { f(x, cl, cx + o, cy, w, 4); f(x, cl, cx + o + 6, cy - 3, w - 14, 3); f(x, cl, cx + o + 14, cy - 5, w - 26, 2); f(x, sh, cx + o + 2, cy + 4, w - 4, 1); } } }
  /* far: two lines of hills, the nearer a little greener, with a dark hedge line along the nearer crest */
  { const x = g('far'); ridge(x, mixc(T.hills[0], T.sky[2], .45), 92, 8, 1.3); ridge(x, mixc(T.hills[1], T.sky[2], .2), 108, 6, 4.1, [3, 7]);
    for (let i = 0; i < RW; i += 1) if ((i * 13) % 17 < 9) f(x, mixc(T.hills[1], '#1a2a18', .35), i, ridgeY(i, 108, 6, 4.1, [3, 7]), 1, 1); }
  /* mid: a hedgerow along the field behind the road, its trees, and a few fence posts */
  { const x = g('mid'), leaf = st.leaf || '#5f9a45', hedge = mixc(leaf, '#1a2a18', .3), hedgeLt = mixc(leaf, '#fff2c8', .12);
    for (let i = 0; i < RW; i += 7) { const r = 5 + Math.round(Math.abs(Math.sin(i * .31)) * 3); for (const o of [-RW, 0, RW]) { x.fillStyle = hedge; x.beginPath(); x.ellipse(i + o, 142, r, r * .8, 0, 0, 7); x.fill(); x.fillStyle = hedgeLt; x.fillRect(i + o - 2, 142 - r * .8 + 1, 3, 1); } }
    f(x, hedge, 0, 142, RW, 8);
    const tree = id => { try { const sp = A.treeSprite && A.treeSprite(id); return sp ? A.toCanvas(sp) : null; } catch (e) { return null; } };
    for (const [tx, id] of [[14, 'normal'], [118, 'oak'], [204, 'normal'], [262, 'willow']]) { const c = tree(id) || tree('normal'); if (c) wrapDraw(x, c, tx, 148 - c.height); }
    for (let q = 6; q < RW; q += 26) { f(x, '#3e2a1a', q, 136, 2, 14); f(x, '#6a4a2c', q, 136, 1, 14); }
    f(x, '#3e2a1a', 0, 139, RW, 1); f(x, '#3e2a1a', 0, 144, RW, 1);
    if (season === 'spring') for (let i = 0; i < 60; i++) f(x, ['#f4c4d0', '#ffffff', '#f8dce4'][i % 3], rnd() * RW, 134 + rnd() * 12, 1, 1);
    if (season === 'winter') for (let i = 0; i < RW; i += 2) f(x, '#e8eef6', i, 134 + Math.round(Math.abs(Math.sin(i * .31)) * -3), 2, 1); }
  /* near: the verge, the road with its ruts and stones, and grass in front */
  { const x = g('near'), grass = T.ground, grassDk = mixc(grass, '#1a2a18', .35), road = mixc(T.ground, T.path || '#cdb07a', .7), roadDk = mixc(road, '#3a2a1a', .3), roadLt = mixc(road, '#fff2c8', .25);
    f(x, grass, 0, 148, RW, RH - 148); f(x, mixc(grass, '#fff2c8', .2), 0, 148, RW, 1);
    f(x, road, 0, 153, RW, 15); f(x, roadDk, 0, 153, RW, 1); f(x, roadDk, 0, 167, RW, 1);
    for (let i = 0; i < RW; i += 1) { if ((i * 7) % 11 < 6) f(x, roadDk, i, 157, 1, 1); if ((i * 5) % 13 < 7) f(x, roadDk, i, 163, 1, 1); }
    for (let i = 0; i < 46; i++) { const sx = Math.floor(rnd() * RW), sy = 154 + Math.floor(rnd() * 12), w = 1 + Math.floor(rnd() * 3); for (const o of [-RW, 0, RW]) { f(x, roadDk, sx + o, sy + 1, w, 1); f(x, roadLt, sx + o, sy, w, 1); } }
    for (let i = 0; i < 90; i++) { const gx = Math.floor(rnd() * RW), gy = 168 + Math.floor(rnd() * 12), h = 2 + Math.floor(rnd() * 3); for (const o of [-RW, 0, RW]) { f(x, grassDk, gx + o, gy - h, 1, h); f(x, mixc(grass, '#fff2c8', .15), gx + o + 1, gy - h + 1, 1, h - 1); } }
    for (let i = 0; i < 40; i++) { const gx = Math.floor(rnd() * RW), gy = 148 + Math.floor(rnd() * 5); for (const o of [-RW, 0, RW]) f(x, grassDk, gx + o, gy, 1, 2); }
    const fl = season === 'autumn' ? ['#d8782a', '#c8482a', '#e8b040'] : season === 'winter' ? ['#f4f8fc', '#e8eef6', '#ffffff'] : season === 'summer' ? ['#f0d060', '#e0607a', '#f4f0f4'] : ['#f4c4d0', '#a07ae0', '#f0d060'];
    for (let i = 0; i < (season === 'autumn' ? 70 : 34); i++) { const gx = Math.floor(rnd() * RW), gy = (season === 'autumn' && i % 2) ? 154 + Math.floor(rnd() * 13) : 169 + Math.floor(rnd() * 10); for (const o of [-RW, 0, RW]) f(x, fl[i % 3], gx + o, gy, season === 'autumn' ? 2 : 1, 1); } }
  for (const k of ['sky', 'far', 'mid', 'near']) if (A.dusk) A.dusk(L[k]);
  return L; });

/* the signpost (32 x 44): a post, one board pointing on to Willowbrook and one pointing back; the place name is lettered
   over the long board by the page, in the game's own pixel face */
A.openingSignpost = () => memo('signpost', () => { const { Spr } = TP(), s = new Spr(36, 46), wood = s.mat('#8a6040'), dk = s.mat('#5a3e26'), paint = s.mat('#d8c8a0');
  s.rect(16, 6, 4, 40, wood); s.line(16, 6, 16, 45, dk, 1);
  s.poly([[1, 8], [29, 8], [35, 13], [29, 18], [1, 18]], wood); s.edges(wood); s.line(2, 9, 28, 9, paint, 3);
  s.poly([[6, 24], [26, 24], [26, 30], [6, 30], [2, 27]], wood); s.edges(wood);
  s.ell(18, 45, 5, 1.2, dk, { flat: 1 }); s.outline(); const c = s.canvas(); if (A.dusk) A.dusk(c); return c; });
A.OPENING_SIGN_BOARD = [1, 8, 29, 11]; /* the long board's box, for the lettering */

/* ---------- Wren's envelope ---------- */
A.openingEnvelope = (size = 'small', open = false) => memo(`env:${size}:${open}`, () => { const { Spr } = TP(), big = size === 'big', W = big ? 48 : 18, H = big ? 32 : 12, s = new Spr(W, H + (open && big ? 14 : 0)), oy = open && big ? 14 : 0;
  const paper = s.mat('#e8dcc0', { warm: '#fff8e8' }), fold = s.mat('#c8b890'), wax = s.mat('#b8302a', { warm: '#ff9a7a' });
  s.rect(0, oy, W, H, paper); s.edges(paper);
  const mid = Math.floor(W / 2), dip = big ? 16 : 6;
  for (let i = 0; i < mid; i++) { const y = oy + Math.round(i * dip / mid); s.dot(i, y, fold, 1); s.dot(W - 1 - i, y, fold, 1); }
  for (let i = 0; i < mid; i++) { const y = oy + H - 1 - Math.round(i * (H * .45) / mid); s.dot(i, y, fold, 2); s.dot(W - 1 - i, y, fold, 2); }
  if (open && big) { s.poly([[0, oy], [mid, 0], [W - 1, oy]], paper); s.line(0, oy, mid, 0, fold, 1); s.line(mid, 0, W - 1, oy, fold, 1); }
  else { const r = big ? 5 : 2; s.ell(mid - .5, oy + dip - (big ? 1 : 0), r, r, wax); if (big) { s.dot(mid - 2, oy + dip - 3, wax, 4); s.line(mid - 2, oy + dip - 1, mid + 1, oy + dip - 1, wax, 1); s.dot(mid, oy + dip + 1, wax, 1); } }
  s.outline(); return s.canvas(); });
/* the seal's two halves as it cracks (each 6 x 11) */
A.openingSealHalf = side => memo('seal:' + side, () => { const { Spr } = TP(), s = new Spr(7, 12), wax = s.mat('#b8302a', { warm: '#ff9a7a' });
  for (let y = 1; y < 11; y++) { const half = Math.round(Math.sqrt(Math.max(0, 25 - (y - 5.5) * (y - 5.5)))), crack = (y % 3 === 0 ? 1 : 0); if (side === 'l') for (let x = 6 - half; x <= 5 - crack; x++) s.set(x, y, wax, x < 3 ? 3 : 2); else for (let x = 1 + crack; x <= half; x++) s.set(x, y, wax, x > 4 ? 1 : 2); }
  s.outline(); return s.canvas(); });
})();
