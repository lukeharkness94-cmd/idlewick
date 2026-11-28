/* Idlewick pixel art: every weapon and every bundle of arrows, redrawn in the chunky outlined style (owner, 28 Nov 2026;
   docs/pixel-art-style.md). 16 x 16 like every item, read at 2x-4x: blades and hafts two or three pixels thick, lit from
   the top left with a highlight edge and a shaded edge, five-step hue-shifted ramps, then the selective outline in each
   material's darkest colour. Metal tiers differ by their own colour and by small shape details that grow with the tier
   (guards, pommels, grips, gems, runes), so no two items share a drawing (tests/art-pixel.cjs). The named weapons
   (js/rare_weapons.js, docs/named-weapons.md) each keep their own design.
   This file wraps the item dispatcher (`A.itemSprite`), so every place that shows an item (pack, bank, shop, recipe
   cards, the hearth rack, the fighter's held weapon via Q.gearIconUrl) draws these. Loaded just before pixel_runtime.js. */
(() => {
const DQ = window.DQ, D = DQ.data, A = DQ.pixelArt; if (!A || !A.itemSprite) return;
const { Spr, ramp, mix } = A;
const rp = c => ramp(c);
const metal = (c, o) => ramp(c, Object.assign({ gl: .74 }, o));

/* ---------- materials ---------- */
const TIER = ['bronze', 'iron', 'steel', 'mithril', 'adamant', 'rune', 'astral'];
const MCOL = { bronze: '#c58a5a', iron: '#8e98a4', steel: '#c4d0dc', mithril: '#6c7fe0', adamant: '#4fbf7a', rune: '#46c8d8', astral: '#d8c8ff' };
const M = {}; for (const t of TIER) M[t] = metal(MCOL[t]);
M.iron = metal(MCOL.iron, { gl: .5, hi: .2 });
const GOLD = metal('#e6b84a'), BRASS = metal('#c8a040'), DARK = metal('#6a6e80'), BRONZE_D = metal('#9a6438');
const LEATHER = rp('#8a5a36'), LEATHER_D = rp('#5a3a28'), WRAP = rp('#3a2a3a'), CLOTH_V = rp('#6a4aa8'), CORD = rp('#e8dcc0');
const WOODS = { normal: '#a07a4f', oak: '#b58a52', willow: '#9db86a', maple: '#c9703f', yew: '#5f9a5a', magic: '#8f7fe0', elder: '#c9e0a8' };
const ORB = { normal: '#8fc0ff', oak: '#7fe0b0', willow: '#f0d060', maple: '#ff8a5a', yew: '#c07aff', magic: '#e2d4ff', elder: '#9fffe8' };
const STRING = '#efe4c8';

/* ---------- drawing helpers ---------- */
const T = (s, x, y, r, lv) => s.tone(x, y, r, lv);
/* Everything long lies on a 45-degree axis x + y = K, from the lower left (hilt, butt) to the upper right (tip, head).
   A row of an axis band is a horizontal run centred on the axis. */
const span = (a, w) => { const lo = a - Math.floor((w - 1) / 2); return [lo, lo + w - 1]; };
/* light steps across a band, from its lit upper-left edge to its shaded lower-right edge */
const LIT = { 1: [3], 2: [4, 2], 3: [4, 2, 1], 4: [4, 3, 2, 1], 5: [4, 3, 2, 2, 1] };
function band(s, K, y0, y1, r, width, o = {}) { for (let y = y0; y >= y1; y--) { const w = width(y); if (w <= 0) continue; const [a0] = span(K - y, w), a = a0 + (o.shift ? o.shift(y) : 0), steps = (o.lit || LIT)[w] || LIT[Math.min(5, w)];
  for (let x = a; x < a + w; x++) T(s, x, y, r, steps[x - a] ?? 2); } }
/* tone a set of pixels by their horizontal neighbours: lit where open on the left, shaded where open on the right */
function fill(s, pts, r, hiLv = 3, loLv = 1) { const key = new Set(pts.map(([x, y]) => x + ',' + y));
  for (const [x, y] of pts) { const L = key.has((x - 1) + ',' + y), Rr = key.has((x + 1) + ',' + y), U = key.has(x + ',' + (y - 1));
    T(s, x, y, r, !L && !U ? Math.min(4, hiLv + 1) : !L ? hiLv : !Rr ? loLv : 2); } }
/* a guard or crossbar across the axis at (cx, cy), half-length n: a one-pixel bar lit along its length, a glint on its
   upper end, shaded at its lower end, with a two-pixel boss where it meets the blade */
function cross(s, cx, cy, n, r) { for (let i = -n; i <= n; i++) T(s, cx + i, cy + i, r, i === -n ? 4 : i === n ? 2 : 3); T(s, cx + 1, cy, r, 2); T(s, cx, cy + 1, r, 1); }
/* a grip running down-left from (x, y) for len rows, two pixels wide, optionally wrapped in alternate bands */
function grip(s, x, y, len, r, wrap) { for (let j = 0; j < len; j++) { const w = wrap && j % 2 ? wrap : r; T(s, x - j, y + j, w, 3); T(s, x - j + 1, y + j, w, 1); } }
const glint = (c, k = .55) => mix(c, '#ffffff', k), shade = (c, k = .4) => mix(c, '#1a1838', k);
const gem1 = (s, x, y, c) => { s.fix(x, y, glint(c)); s.fix(x + 1, y, c); };
const gem = (s, x, y, c) => { s.fix(x, y, glint(c)); s.fix(x + 1, y, c); s.fix(x, y + 1, c); s.fix(x + 1, y + 1, shade(c)); };
const star = (s, x, y, c) => { s.fix(x, y, '#ffffff'); for (const [i, j] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) s.fix(x + i, y + j, c); };
const ball = (s, x, y, r) => { T(s, x, y, r, 4); T(s, x + 1, y, r, 2); T(s, x, y + 1, r, 2); T(s, x + 1, y + 1, r, 1); };
const orb = (s, x, y, c, rad = 1.8) => { s.ell(x, y, rad, rad, ramp(c, { gl: .85 })); s.fix(Math.round(x - rad * .45), Math.round(y - rad * .45), '#ffffff'); };

/* ================= blades: swords, daggers and their hilts ================= */
/* A blade on axis K from its tip row `tip` down to its base row; w its width; shape leaf (a swell), taper (narrow
   near the tip), curve(y) a sideways shift for sabres. Returns the guard centre. */
function blade(s, o) {
  const K = o.K ?? 15, w = o.w || 3, tip = o.tip ?? 1, base = o.base, r = o.r, n = base - tip;
  const width = y => { const d = y - tip; if (o.widths) return o.widths[Math.min(d, o.widths.length - 1)]; if (d === 0) return 1; if (d === 1) return Math.min(2, w); const t = d / n;
    if (o.shape === 'leaf') return w + (t > .3 && t < .75 ? 1 : 0) - (t > .9 ? 1 : 0);
    if (o.shape === 'taper') return t < .45 ? Math.max(2, w - 1) : w;
    if (o.shape === 'broad') return d === 2 ? w - 1 : w;
    return w; };
  band(s, K, base, tip, r, width, { lit: o.fuller ? { ...LIT, 3: [4, 3, 1], 4: [4, 2, 3, 1] } : o.lit, shift: o.curve });
  if (o.edge) for (let y = tip + 2; y <= base; y++) { const [a] = span(K - y, width(y)); s.fix(a + (o.curve ? o.curve(y) : 0), y, o.edge); }
  return [K - (base + 1), base + 1];
}
/* a hilt below a blade: guard at (gx, gy), grip down-left, pommel at the end.
   guard {r, n, kind: bar|up|down|block|wing, gem}, grip {r, wrap, len}, pommel {r, kind: ball|disk|gem|star|ring, gem} */
function hilt(s, gx, gy, g, G, P) {
  const n = g.n ?? 2, r = g.r;
  cross(s, gx, gy, n, r);
  if (g.kind === 'up') { T(s, gx - n + 1, gy - n - 1, r, 4); T(s, gx + n + 1, gy + n - 1, r, 2); }
  else if (g.kind === 'down') { T(s, gx - n - 1, gy - n + 1, r, 3); T(s, gx + n - 1, gy + n + 1, r, 1); }
  else if (g.kind === 'block') { for (let i = -n; i <= n; i++) T(s, gx + i + 1, gy + i, r, i === n ? 1 : 2); }
  else if (g.kind === 'wing') { T(s, gx - n + 1, gy - n - 1, r, 4); T(s, gx - n + 2, gy - n - 2, r, 3); T(s, gx + n + 1, gy + n - 1, r, 2); T(s, gx + n + 2, gy + n - 2, r, 1); }
  if (g.gem) gem1(s, gx, gy, g.gem);
  const len = G.len ?? 2; grip(s, gx - 1, gy + 1, len, G.r, G.wrap);
  const px = gx - 1 - len, py = gy + 1 + len, pr = P.r;
  switch (P.kind) {
    case 'gem': ball(s, px, py, pr); s.fix(px, py, glint(P.gem, .6)); s.fix(px + 1, py, P.gem); s.fix(px, py + 1, P.gem); break;
    case 'star': star(s, px + 1, py, P.gem); s.fix(px, py + 1, P.gem); break;
    case 'disk': T(s, px - 1, py, pr, 3); T(s, px, py, pr, 3); T(s, px + 1, py, pr, 2); T(s, px, py + 1, pr, 1); T(s, px - 1, py + 1, pr, 2); break;
    case 'ring': T(s, px, py, pr, 3); T(s, px + 1, py, pr, 2); T(s, px - 1, py + 1, pr, 3); T(s, px + 1, py + 1, pr, 1); T(s, px, py + 2, pr, 1); break;
    case 'spike': ball(s, px, py, pr); T(s, px - 1, py + 2, pr, 2); break;
    default: ball(s, px, py, pr);
  }
}

/* swords: blade 8 rows from the tip at (14, 1); the hilt below grows a guard shape, a grip wrap and a pommel per tier */
const SWORD = {
  bronze: { b: { shape: 'leaf' }, g: { r: BRONZE_D, n: 2 }, G: { r: LEATHER }, P: { r: BRONZE_D } },
  iron: { b: {}, g: { r: DARK, n: 2, kind: 'block' }, G: { r: LEATHER_D }, P: { r: DARK, kind: 'disk' } },
  steel: { b: { fuller: true }, g: { r: BRASS, n: 2, kind: 'up' }, G: { r: LEATHER, wrap: LEATHER_D }, P: { r: BRASS } },
  mithril: { b: { fuller: true }, g: { r: GOLD, n: 2, kind: 'down' }, G: { r: rp('#4a6ad0'), wrap: rp('#34489a') }, P: { r: GOLD, kind: 'gem', gem: '#5a9aff' } },
  adamant: { b: { w: 4, shape: 'broad' }, g: { r: metal('#2f7a4a'), n: 2, kind: 'block', gem: '#9affc8' }, G: { r: WRAP }, P: { r: metal('#2f7a4a'), kind: 'spike' } },
  rune: { b: { fuller: true, marks: [[9, 6], [11, 4]] }, g: { r: DARK, n: 2, kind: 'wing', gem: '#9ff6ff' }, G: { r: rp('#24384a'), wrap: rp('#3a8a9a') }, P: { r: DARK, kind: 'gem', gem: '#9ff6ff' } },
  astral: { b: { fuller: true, marks: [[10, 5], [12, 3]], mark: '#ffffff' }, g: { r: GOLD, n: 2, kind: 'wing', gem: '#ff8ad0' }, G: { r: CLOTH_V, wrap: GOLD }, P: { r: GOLD, kind: 'star', gem: '#c8a8ff' } }
};
function swordOf(s, t, o = {}) { const S = SWORD[t], b = { r: M[t], base: 9, ...S.b, ...(o.b || {}) };
  const [gx, gy] = blade(s, b);
  for (const [x, y] of b.marks || []) s.fix(x, y, b.mark || '#d8ffff');
  hilt(s, gx, gy, { ...S.g, ...(o.g || {}) }, { ...S.G, ...(o.G || {}) }, { ...S.P, ...(o.P || {}) }); }

/* daggers: a short blade (tip at (11, 4)) on the same axis, a small guard */
const DAGGER = {
  bronze: { b: { w: 2, shape: 'leaf' }, g: { r: BRONZE_D, n: 1 }, G: { r: LEATHER }, P: { r: BRONZE_D } },
  iron: { b: { w: 2 }, g: { r: DARK, n: 1, kind: 'block' }, G: { r: LEATHER_D }, P: { r: DARK, kind: 'disk' } },
  steel: { b: { w: 3, shape: 'taper' }, g: { r: BRASS, n: 1, kind: 'up' }, G: { r: LEATHER, wrap: LEATHER_D }, P: { r: BRASS } },
  mithril: { b: { w: 3, shape: 'taper' }, g: { r: GOLD, n: 2, kind: 'down' }, G: { r: rp('#4a6ad0') }, P: { r: GOLD, kind: 'gem', gem: '#5a9aff' } },
  adamant: { b: { w: 3, serrate: true }, g: { r: metal('#2f7a4a'), n: 1, kind: 'block', gem: '#9affc8' }, G: { r: WRAP }, P: { r: metal('#2f7a4a'), kind: 'spike' } },
  rune: { b: { w: 3, shape: 'taper', marks: [[9, 7]] }, g: { r: DARK, n: 1, kind: 'wing', gem: '#9ff6ff' }, G: { r: rp('#24384a'), wrap: rp('#3a8a9a') }, P: { r: DARK, kind: 'gem', gem: '#9ff6ff' } },
  astral: { b: { w: 3, wavy: true, marks: [[10, 6]], mark: '#ffffff' }, g: { r: GOLD, n: 2, kind: 'wing', gem: '#ff8ad0' }, G: { r: CLOTH_V }, P: { r: GOLD, kind: 'star', gem: '#c8a8ff' } }
};
function daggerOf(s, t, o = {}) { const S = DAGGER[t], b = { r: M[t], tip: 4, base: 8, ...S.b, ...(o.b || {}) };
  if (b.wavy) b.curve = y => (y === 6 ? 1 : 0);
  const [gx, gy] = blade(s, b);
  if (b.serrate) for (const y of [6, 8]) { const [a] = span(15 - y, 3); T(s, a + 3, y, b.r, 1); }
  for (const [x, y] of b.marks || []) s.fix(x, y, b.mark || '#d8ffff');
  hilt(s, gx, gy, { ...S.g, ...(o.g || {}) }, { ...S.G, ...(o.G || {}) }, { ...S.P, ...(o.P || {}) }); }

/* ================= warhammers ================= */
/* Upright, so a warhammer never reads as an axe or a pick: a two-pixel haft standing in the middle, the head a block
   across its top (top and left faces lit, the lower and right faces shaded), a collar under the head and a butt cap. */
function hammerHead(s, x0, y0, x1, y1, r) { for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) T(s, x, y, r, y === y0 ? (x === x0 ? 4 : 3) : y === y1 ? 1 : x === x0 ? 3 : x === x1 ? 1 : 2); }
const HAMMER = {
  bronze: { box: [4, 2, 11, 5], round: true, collar: BRONZE_D },
  iron: { box: [3, 2, 12, 5], bands: true, collar: DARK, wrap: LEATHER_D },
  steel: { box: [3, 2, 12, 5], spike: true, collar: BRASS, wrap: LEATHER },
  mithril: { box: [3, 2, 11, 5], beak: true, collar: GOLD, wrap: rp('#4a6ad0'), gem: '#5a9aff' },
  adamant: { box: [3, 2, 12, 5], flange: true, collar: metal('#2f7a4a'), wrap: WRAP, gem: '#9affc8' },
  rune: { box: [3, 2, 11, 5], spike: true, beak: true, collar: DARK, wrap: rp('#24384a'), rune: '#d8ffff' },
  astral: { box: [3, 2, 12, 5], spike: true, flange: true, collar: GOLD, wrap: CLOTH_V, star: '#c8a8ff' }
};
function hammerOf(s, t, o = {}) { const S = { ...HAMMER[t], ...o }, r = S.r || M[t], w = S.wood || rp('#8a6038'), [x0, y0, x1, y1] = S.box;
  for (let y = y1 + 1; y <= 13; y++) { T(s, 7, y, w, 3); T(s, 8, y, w, 1); }
  if (S.wrap) for (const y of [10, 11, 12]) { T(s, 7, y, S.wrap, y % 2 ? 3 : 2); T(s, 8, y, S.wrap, 1); }
  if (S.langet) for (const y of [y1 + 2, y1 + 3]) { T(s, 6, y, S.langet, 3); T(s, 9, y, S.langet, 1); }
  T(s, 6, 14, S.cap || S.collar, 3); T(s, 7, 14, S.cap || S.collar, 3); T(s, 8, 14, S.cap || S.collar, 2); T(s, 9, 14, S.cap || S.collar, 1);
  if (S.spike) { T(s, 7, y0 - 1, r, 4); T(s, 8, y0 - 1, r, 2); T(s, 7, y0 - 2, r, 3); }
  hammerHead(s, x0, y0, x1, y1, r);
  if (S.round) { s.erase(x0, y0); s.erase(x1, y0); s.erase(x0, y1); s.erase(x1, y1); T(s, x0 + 1, y0, r, 4); }
  if (S.beak) { T(s, x1 + 1, y0 + 1, r, 2); T(s, x1 + 1, y0 + 2, r, 1); T(s, x1 + 2, y0 + 2, r, 1); T(s, x1 + 1, y1, r, 1); s.erase(x1, y1); T(s, x1, y1, r, 1); }
  if (S.flange) for (const x of [x0, x1]) { T(s, x, y0 - 1, r, x === x0 ? 4 : 2); T(s, x, y1 + 1, r, 1); }
  if (S.bands) { const b2 = rp(shade(MCOL[t], .25)); for (const x of [x0 + 2, x1 - 2]) for (let y = y0; y <= y1; y++) T(s, x, y, b2, y === y0 ? 3 : 2); }
  T(s, 6, y1 + 1, S.collar, 3); T(s, 7, y1 + 1, S.collar, 3); T(s, 8, y1 + 1, S.collar, 2); T(s, 9, y1 + 1, S.collar, 1);
  if (S.gem) gem(s, 7, y0 + 1, S.gem);
  if (S.rune) { s.fix(5, y0 + 1, S.rune); s.fix(6, y0 + 2, S.rune); s.fix(9, y0 + 1, S.rune); s.fix(10, y0 + 2, S.rune); }
  if (S.star) star(s, 8, y0 + 2, S.star);
  if (S.tintCol) for (let x = x0; x <= x0 + 1; x++) for (let y = y0; y <= y1; y++) s.fix(x, y, y === y0 ? glint(S.tintCol, .3) : S.tintCol);
}

/* ================= bows ================= */
/* Shortbows stand upright like the approved example: the string down the left, the limb bowed out to the right, the
   grip at the middle. `bend` is how far the limb bows, `curl` flicks the tips forward (a recurve), `fat` thickens the
   middle. Longbows (the named ones) lie on the diagonal instead, so they read as longer. */
function vbow(s, r, o) { const y0 = o.top ?? 1, y1 = o.bot ?? 14, sx = o.sx ?? 4, bend = o.bend ?? 6, pts = new Map();
  for (let i = 0; i <= 160; i++) { const t = i / 160, y = Math.round(y0 + (y1 - y0) * t), e = Math.max(0, 1 - t / .2) ** 2 + Math.max(0, 1 - (1 - t) / .2) ** 2,
      x = Math.round(sx + 1 + Math.pow(Math.sin(t * Math.PI), o.round ?? .55) * bend + (o.curl || 0) * e), w = (t < .2 || t > .8) ? 1 : (o.w || 2) + (o.fat && t > .36 && t < .64 ? 1 : 0);
    for (let j = 0; j < w; j++) pts.set((x + j) + ',' + y, [x + j, y]); }
  const list = [...pts.values()]; fill(s, list, r, 3, 1);
  const xs = Math.round(sx + (o.curl || 0)); /* the string runs between the tips, wherever a recurve has flicked them */
  for (let y = y0 + 1; y < y1; y++) if (!s.at(xs, y)) s.fix(xs, y, o.stringCol || STRING);
  return list; }
const rowsOf = (list, ys) => list.filter(([, y]) => ys.includes(y));
const BOW = {
  normal: { bend: 6.4, grip: LEATHER },
  oak: { bend: 6.4, fat: true, grip: LEATHER_D, wrap: LEATHER },
  willow: { bend: 7.4, round: .4, grip: rp('#6a8a4a'), bound: true },
  maple: { bend: 6, curl: 2, grip: LEATHER_D },
  yew: { bend: 5, fat: true, round: .4, grip: LEATHER, horn: true },
  magic: { bend: 6.6, curl: 1.4, grip: CLOTH_V, runes: '#f0e0ff', gem: '#f0e0ff' },
  elder: { bend: 6.4, curl: 2.4, fat: true, grip: GOLD, tips: GOLD, leaf: true, gem: '#9fffe8' }
};
function bowOf(s, wood, o = {}) { const S = { ...BOW[wood], ...o }, w = rp(WOODS[wood]);
  const pts = vbow(s, w, S), top = Math.min(...pts.map(p => p[1])), bot = Math.max(...pts.map(p => p[1]));
  fill(s, rowsOf(pts, [7, 8]), S.grip, 3, 1);
  if (S.wrap) fill(s, rowsOf(pts, [6, 9]), S.wrap, 3, 1);
  if (S.bound) for (const y of [top + 2, bot - 2]) fill(s, rowsOf(pts, [y]), CORD, 3, 2);
  if (S.horn) fill(s, rowsOf(pts, [top, top + 1, bot - 1, bot]), rp('#ece0c4'), 3, 2);
  if (S.tips) fill(s, rowsOf(pts, [top, top + 1, bot - 1, bot]), S.tips, 3, 1);
  if (S.fit) { /* forged fittings: metal caps that stand proud of the tips, and on finer work a plate either side of the grip */
    const tips = rowsOf(pts, [top, top + 1, bot - 1, bot]); fill(s, tips, S.fit, 3, 1);
    for (const y of [top, bot]) { const e = rowsOf(pts, [y]).sort((a, b) => b[0] - a[0])[0]; if (e) T(s, e[0] + 1, y, S.fit, y === top ? 3 : 1); }
    if (S.plate) for (const y of [6, 9]) { const row = rowsOf(pts, [y]).sort((a, b) => a[0] - b[0]); fill(s, [[row[0][0] - 1, y], ...row], S.fit, 3, 1); } }
  if (S.runes) for (const y of [3, 12]) { const r0 = rowsOf(pts, [y]); if (r0.length) s.fix(r0[0][0], y, S.runes); }
  if (S.leaf) { const l = rp('#6aa84a'); T(s, 12, 6, l, 3); T(s, 13, 6, l, 2); T(s, 13, 5, l, 3); T(s, 12, 7, l, 1); }
  const g = rowsOf(pts, [7]).sort((a, b) => a[0] - b[0])[0];
  if (S.gem && g) gem1(s, g[0] - 1, 7, S.gem);
  if (S.rest && g) { s.fix(g[0] - 1, 7, S.rest); s.fix(g[0] - 1, 8, shade(S.rest, .3)); }
}

/* ================= staves ================= */
/* a two-pixel haft on the axis from the butt up to the head; each wood holds its own stone in its own way */
function haft(s, y0, y1, r, o = {}) { band(s, o.K ?? 15, y0, y1, r, () => o.w || 2, { lit: { 2: [3, 2], 3: [4, 2, 1] } }); T(s, 15 - y0, y0, r, 2); }
const STAFF = {
  normal: s => { const w = rp(WOODS.normal); haft(s, 14, 5, w); s.ell(10.5, 4.5, 1.6, 1.6, w); orb(s, 12, 3, ORB.normal, 1.9); },
  oak: s => { const w = rp(WOODS.oak); haft(s, 14, 6, w); s.ell(11, 4, 3, 3, w); T(s, 8, 6, w, 3); T(s, 14, 1, w, 3); T(s, 13, 1, w, 2); orb(s, 11.5, 3.5, ORB.oak, 1.6); },
  willow: s => { const w = rp(WOODS.willow), l = rp('#7ac85a'); haft(s, 14, 6, w);
    for (const [x, y, v] of [[9, 5, 3], [8, 4, 3], [8, 3, 3], [8, 2, 4], [9, 1, 3], [11, 6, 2], [12, 6, 2], [13, 6, 1], [14, 5, 1], [14, 4, 2]]) T(s, x, y, w, v);
    orb(s, 11.5, 3.5, ORB.willow, 2); T(s, 6, 1, l, 4); T(s, 6, 2, l, 3); T(s, 7, 2, l, 2); T(s, 14, 7, l, 2); T(s, 15, 6, l, 1); },
  maple: s => { const w = rp(WOODS.maple); haft(s, 14, 6, w);
    for (const [x, y, v] of [[9, 5, 3], [8, 4, 3], [8, 3, 3], [8, 2, 4], [9, 1, 4], [10, 0, 4], [11, 0, 3], [12, 0, 3], [13, 1, 2], [14, 2, 2], [14, 3, 1], [13, 4, 1]]) T(s, x, y, w, v);
    orb(s, 11, 3, ORB.maple, 1.7); },
  yew: s => { const w = rp(WOODS.yew); haft(s, 14, 6, w);
    /* three claws curling round the stone from a knuckle at the top of the haft */
    for (const [x, y, v] of [[9, 5, 3], [10, 5, 2], [8, 4, 3], [8, 3, 4], [8, 2, 3], [9, 1, 4], [11, 6, 2], [12, 6, 2], [13, 5, 1], [14, 4, 1], [14, 3, 2], [13, 1, 3], [12, 0, 3]]) T(s, x, y, w, v);
    orb(s, 11, 3.5, ORB.yew, 2.2); },
  magic: s => { const w = rp(WOODS.magic), c = ramp(ORB.magic, { gl: .9 }); haft(s, 14, 6, w);
    T(s, 8, 5, w, 4); T(s, 9, 5, w, 3); T(s, 10, 6, w, 1); T(s, 7, 4, w, 3); T(s, 11, 7, w, 1);
    s.poly([[11, 0], [14.6, 3.5], [11, 7], [7.6, 3.5]], c); s.fix(10, 2, '#ffffff'); s.fix(11, 2, glint(ORB.magic, .7)); s.fix(10, 3, glint(ORB.magic, .5)); s.fix(12, 5, shade(ORB.magic, .3)); s.fix(13, 4, shade(ORB.magic, .2)); s.fix(14, 0, '#ffffff'); s.fix(6, 1, '#fff6c8'); },
  elder: s => { const w = rp(WOODS.elder), g = GOLD; haft(s, 14, 7, w);
    for (const [x, y, v] of [[8, 6, 3], [7, 5, 3], [7, 4, 3], [7, 3, 4], [8, 2, 4], [9, 1, 4], [10, 1, 3], [9, 7, 2], [10, 7, 2], [11, 8, 1]]) T(s, x, y, w, v);
    orb(s, 11, 4.5, ORB.elder, 2); T(s, 8, 7, g, 3); T(s, 9, 8, g, 1); T(s, 8, 8, g, 2); }
};
function staffOf(s, wood, o = {}) { STAFF[wood](s);
  if (o.bands) for (const y of o.bands) { const a = 15 - y; T(s, a - 1, y - 1, o.fit, 4); T(s, a, y - 1, o.fit, 3); T(s, a, y, o.fit, 3); T(s, a + 1, y, o.fit, 2); T(s, a + 1, y + 1, o.fit, 1); }
  if (o.ferrule) { T(s, 1, 13, o.fit, 3); T(s, 2, 13, o.fit, 2); T(s, 0, 14, o.fit, 3); T(s, 1, 14, o.fit, 1); }
  if (o.gem) gem1(s, ...o.gem, o.gemCol);
}

/* ================= arrows ================= */
/* an arrowhead pointing up-right with its tip at (x, y): pixels (dx <= 0, dy >= 0) within its shape */
const HEADS = {
  leaf: [[0, 0], [-1, 0], [0, 1], [-1, 1], [-2, 1], [-1, 2]],
  plain: [[0, 0], [-1, 0], [0, 1], [-2, 0], [-1, 1], [0, 2]],
  barbed: [[0, 0], [-1, 0], [0, 1], [-2, 0], [-1, 1], [0, 2], [-3, 0], [0, 3]],
  bodkin: [[0, 0], [-1, 0], [0, 1], [-1, 1], [-2, 1], [-1, 2], [-2, 2]],
  broad: [[0, 0], [-1, 0], [0, 1], [-2, 0], [-1, 1], [0, 2], [-3, 0], [-2, 1], [-1, 2], [0, 3]],
  crystal: [[0, 0], [-1, 0], [0, 1], [-1, 1], [-2, 1], [-1, 2], [-2, 0], [0, 2]],
  star: [[0, 0], [-1, 0], [0, 1], [-1, 1], [1, -1], [-2, 1], [-1, 2], [1, 0], [0, -1]]
};
const ARROW = {
  bronze: { head: 'leaf', fl: '#f2ead8', shaft: '#b8905a', vanes: 2 },
  iron: { head: 'plain', fl: '#9a9aa4', shaft: '#a07a4f' },
  steel: { head: 'barbed', fl: '#f4f4f4', shaft: '#8a6440', vanes: 2 },
  mithril: { head: 'bodkin', fl: '#4a6ad8', shaft: '#c8a070' },
  adamant: { head: 'broad', fl: '#3a9a5a', shaft: '#6a4a30' },
  rune: { head: 'crystal', fl: '#2a8a9a', shaft: '#3a3a4a', glow: '#d8ffff', vanes: 2 },
  astral: { head: 'star', fl: '#9a7ae8', shaft: '#e8dcc0', glow: '#ffffff' }
};
function arrowOf(s, t, x0, y0, len) { const A0 = ARROW[t], sh = rp(A0.shaft), fl = rp(A0.fl), m = M[t];
  for (let i = 0; i < len; i++) T(s, x0 + i, y0 - i, sh, 3);
  for (let j = 0, n = A0.vanes || 3; j < n; j++) { T(s, x0 + j - 1, y0 - j, fl, j ? 3 : 4); T(s, x0 + j, y0 - j + 1, fl, j === n - 1 ? 2 : 1); }
  const tx = x0 + len + (A0.head === 'broad' || A0.head === 'barbed' ? 1 : 0), ty = y0 - len - (A0.head === 'broad' || A0.head === 'barbed' ? 1 : 0);
  fill(s, HEADS[A0.head].map(([dx, dy]) => [tx + dx, ty + dy]), m, 3, 1); T(s, tx, ty, m, 4);
  if (A0.glow) s.fix(tx - 1, ty + 1, A0.glow); }
function arrowsOf(s, t) { arrowOf(s, t, 1, 12, 8); arrowOf(s, t, 6, 13, 6); }

/* ---------- the dispatch: one finished design per weapon and arrow id ---------- */
const DRAW = {};
TIER.forEach(t => {
  DRAW[t + '_sword'] = s => swordOf(s, t);
  DRAW[t + '_dagger'] = s => daggerOf(s, t);
  DRAW[t + '_hammer'] = s => hammerOf(s, t);
  DRAW['arrow_' + t] = s => arrowsOf(s, t);
});
Object.keys(WOODS).forEach(w => { DRAW['bow_' + w] = s => bowOf(s, w); DRAW['staff_' + w] = s => staffOf(s, w); });

/* the fine and tempered weapons (data3.js D.WEAPON_BRIDGES): the same metal as their smithed base, finer work.
   Tempered bronze shows the temper colours along the edge; fine work adds a longer, flared guard, a wire-wrapped grip,
   a gilded ricasso or langets, and (on bows and staves) forged fittings in the metal they are named for. */
const FINE = [[3, 'bronze', 'tempered'], [5, 'bronze'], [15, 'iron'], [25, 'steel'], [35, 'mithril'], [45, 'adamant'], [55, 'rune']];
const FINE_WOOD = { 3: 'normal', 5: 'normal', 15: 'oak', 25: 'willow', 35: 'maple', 45: 'yew', 55: 'magic' };
const TEMPER = '#e8c060';
for (const [lv, t, tempered] of FINE) {
  const fit = M[t], wood = FINE_WOOD[lv];
  /* finer work keeps the tier's own guard and pommel shapes, gilded, with a jewel in the guard and a wire-wrapped grip */
  const fine = S => ({ g: { ...S.g, r: GOLD, gem: S.g.gem || '#e84a4a' }, G: { r: LEATHER_D, wrap: BRASS }, P: { ...S.P, r: GOLD, kind: S.P.kind && S.P.kind !== 'spike' ? S.P.kind : 'ring' } });
  DRAW['fine_sword_' + lv] = s => swordOf(s, t, tempered ? { b: { edge: TEMPER }, G: { wrap: BRONZE_D } } : fine(SWORD[t]));
  DRAW['fine_dagger_' + lv] = s => daggerOf(s, t, tempered ? { b: { edge: TEMPER }, G: { wrap: BRONZE_D } } : fine(DAGGER[t]));
  DRAW['fine_hammer_' + lv] = s => hammerOf(s, t, tempered ? { tintCol: TEMPER, wrap: LEATHER, round: false } : { langet: GOLD, wrap: LEATHER_D, collar: GOLD, cap: GOLD, gem: HAMMER[t].gem || '#e84a4a' });
  DRAW['fine_bow_' + lv] = s => bowOf(s, wood, tempered ? { fit } : { fit, plate: true, rest: glint(MCOL[t], .3) });
  DRAW['fine_staff_' + lv] = s => staffOf(s, wood, tempered ? { fit, bands: [10] } : { fit, bands: [8, 11], ferrule: true });
}

/* ================= the named weapons ================= */
/* Each keeps the identity it had (docs/named-weapons.md, the flavour in js/rare_weapons.js), redrawn chunky: a shape of
   its own first, then the detail that tells its story (barnacles, venom, frost, roots, stars, a lantern, a bell...). */
/* a longbow lies on the diagonal, its limb bowed toward the top left: longer than the upright shortbows */
function dbow(s, r, o) { const [x0, y0] = o.lo || [2, 14], [x1, y1] = o.hi || [14, 2], pts = new Map(); let a = null, b = null;
  for (let i = 0; i <= 120; i++) { const t = i / 120, e = Math.max(0, 1 - t / .2) ** 2 + Math.max(0, 1 - (1 - t) / .2) ** 2, k = Math.pow(Math.sin(t * Math.PI), o.round ?? .7) * o.bend - (o.curl || 0) * e,
      x = Math.round(x0 + (x1 - x0) * t - k), y = Math.round(y0 + (y1 - y0) * t - k), w = (t < .15 || t > .85) ? 1 : (o.w || 2) + (o.fat && t > .35 && t < .65 ? 1 : 0);
    for (let j = 0; j < w; j++) pts.set((x + j) + ',' + y, [x + j, y]);
    if (i === 0) a = [x, y]; if (i === 120) b = [x, y]; }
  const list = [...pts.values()]; fill(s, list, r, 3, 1);
  const n = Math.max(Math.abs(b[0] - a[0]), Math.abs(b[1] - a[1]));
  for (let i = 1; i < n; i++) { const x = Math.round(a[0] + (b[0] - a[0]) * i / n) + 1, y = Math.round(a[1] + (b[1] - a[1]) * i / n) + 1; if (!s.at(x, y)) s.fix(x, y, o.stringCol || STRING); }
  return list; }
const where = (list, f) => list.filter(([x, y]) => f(x, y));
const NAMED = {
  /* ---------- swords ---------- */
  barnacle_cutlass: s => { const m = metal('#6fc7d8'), br = BRASS; /* Captain Barnacle's cutlass: a curved, clipped blade, a brass knuckle-bow, barnacles */
    const [gx, gy] = blade(s, { r: m, base: 9, w: 3, curve: y => Math.round(Math.sin((9 - y) / 8 * Math.PI) * 1.2) });
    for (const [x, y] of [[10, 5], [8, 7]]) { s.fix(x, y, '#e8e0c8'); s.fix(x + 1, y, '#a89a80'); }
    hilt(s, gx, gy, { r: br, n: 2 }, { r: LEATHER_D }, { r: br });
    for (const [x, y, v] of [[7, 13, 2], [6, 14, 1], [5, 14, 1], [4, 14, 1]]) T(s, x, y, br, v); },
  vipers_kiss: s => { const m = metal('#5aa86a'), g = metal('#2f6a3a'); /* a coast-road bandit's sword: a venom groove down the blade, fangs for a guard */
    const [gx, gy] = blade(s, { r: m, base: 9, w: 3 });
    for (let y = 3; y <= 8; y++) T(s, 15 - y, y, rp('#2f6a3a'), 2);
    hilt(s, gx, gy, { r: g, n: 2, kind: 'down' }, { r: rp('#3a5a3a'), wrap: rp('#8ab030') }, { r: g, kind: 'gem', gem: '#c8e040' });
    T(s, 3, 9, rp('#f4f8ec'), 3); T(s, 4, 13, rp('#f4f8ec'), 3); T(s, 11, 6, rp('#c8e040'), 3); T(s, 11, 7, rp('#c8e040'), 2); },
  gale_sabre: s => { const m = metal('#8fd0e0'); /* a slim, light sabre forged in a storm, a gilded disc guard */
    const [gx, gy] = blade(s, { r: m, base: 9, w: 2, curve: y => Math.round(Math.sin((9 - y) / 8 * Math.PI) * 1.4) });
    for (let y = 3; y <= 8; y += 2) { const r0 = [16 - y + Math.round(Math.sin((9 - y) / 8 * Math.PI) * 1.4) - 1, y]; s.fix(r0[0], y, '#f4feff'); }
    hilt(s, gx, gy, { r: GOLD, n: 1, kind: 'block' }, { r: rp('#4a3a5a'), wrap: rp('#7a6a9a') }, { r: GOLD, kind: 'ring' }); },
  greenwood_blade: s => { const m = metal('#5aa86a', { gl: .6 }), bark = rp('#6a4a30'), leaf = rp('#7ac85a'); /* a greatsword of living green wood, still growing */
    const [gx, gy] = blade(s, { r: m, base: 9, w: 4, shape: 'broad' });
    for (const [x, y] of [[8, 6], [11, 3], [9, 4]]) s.fix(x, y, '#3a7a3a');
    hilt(s, gx, gy, { r: bark, n: 2, kind: 'block' }, { r: bark, wrap: rp('#4a3a24') }, { r: bark });
    T(s, 2, 8, leaf, 4); T(s, 3, 8, leaf, 2); T(s, 2, 9, leaf, 2); T(s, 8, 12, leaf, 3); T(s, 9, 12, leaf, 1); T(s, 8, 13, leaf, 2); T(s, 13, 1, leaf, 3); T(s, 14, 1, leaf, 2); },
  soldiers_blade: s => { const m = metal('#9aa4b0', { gl: .45, hi: .18 }), p = metal('#8a8f98'); /* a plain, dented arming sword, mossy from the barrow */
    const [gx, gy] = blade(s, { r: m, base: 9, w: 3 });
    s.erase(12, 2); T(s, 12, 3, m, 1); s.fix(7, 7, '#5f8a3a'); s.fix(8, 7, '#8ab04a'); s.fix(10, 4, '#5f8a3a');
    hilt(s, gx, gy, { r: p, n: 2 }, { r: rp('#7a5a3a'), wrap: rp('#5a4030') }, { r: p, kind: 'disk' }); },
  knights_longsword: s => { const m = metal('#c8d0e0', { gl: .8 }); /* a knight's longsword: bright steel, a fuller, a gilt guard with a sapphire */
    const [gx, gy] = blade(s, { r: m, base: 9, w: 3, fuller: true });
    hilt(s, gx, gy, { r: GOLD, n: 3, kind: 'down', gem: '#4f86e8' }, { r: rp('#2a3a7a'), wrap: GOLD }, { r: GOLD, kind: 'gem', gem: '#4f86e8' }); },
  glacier_fang: s => { const ice = ramp('#a8d8f0', { gl: .9 }); /* ice that will not melt, ground to an edge: a jagged crystal blade */
    const [gx, gy] = blade(s, { r: ice, base: 9, w: 3 });
    for (const [x, y] of [[13, 4], [11, 6], [9, 8]]) T(s, x, y, ice, 1); for (const [x, y] of [[9, 3], [7, 5]]) T(s, x, y, ice, 4);
    for (let y = 3; y <= 8; y++) s.fix(16 - y, y, '#f4fcff');
    hilt(s, gx, gy, { r: rp('#3a5a8a'), n: 2, kind: 'up' }, { r: rp('#3a5a8a'), wrap: rp('#dff4ff') }, { r: ice, kind: 'gem', gem: '#e8f8ff' }); },
  emerald_reaver: s => { const m = ramp('#3ac87a', { gl: .8 }), h = metal('#a8843a'); /* a broad green blade that drinks: a glowing edge, a long reaving hook */
    const [gx, gy] = blade(s, { r: m, base: 9, w: 4, shape: 'broad' });
    for (let y = 3; y <= 9; y++) { const [a] = span(15 - y, 4); s.fix(a, y, '#b8ffd8'); }
    T(s, 14, 4, m, 2); T(s, 14, 5, m, 1);
    hilt(s, gx, gy, { r: h, n: 2, kind: 'down' }, { r: rp('#2a3a30') }, { r: ramp('#3ac87a', { gl: .9 }), kind: 'gem', gem: '#7affb8' }); },
  skyforged_saber: s => { const m = metal('#9ad8ff'), c = ramp('#f4f8ff', { lo: .18 }); /* forged in a storm: a lightning line down the blade, a cloud-white guard */
    const [gx, gy] = blade(s, { r: m, base: 9, w: 3, curve: y => Math.round(Math.sin((9 - y) / 8 * Math.PI) * .9) });
    for (const [x, y] of [[12, 3], [11, 4], [11, 5], [9, 6], [9, 7], [7, 8]]) s.fix(x, y, '#fff6a0');
    hilt(s, gx, gy, { r: c, n: 2, kind: 'wing' }, { r: rp('#3a4a6a'), wrap: rp('#6a7aaa') }, { r: c, kind: 'gem', gem: '#fff6a0' }); },
  starsunder: s => { const m = ramp('#3a2c78', { gl: .55, hi: .3 }), y = metal('#f0c840'); /* forged from a falling star: a night blade full of stars */
    const [gx, gy] = blade(s, { r: m, base: 9, w: 3, fuller: true });
    for (const [x, y2] of [[13, 2], [11, 4], [10, 6], [8, 7]]) s.fix(x, y2, '#ffffff'); s.fix(9, 5, '#c8b0ff'); s.fix(12, 4, '#8ad8ff');
    star(s, 14, 5, '#d8ccff');
    hilt(s, gx, gy, { r: y, n: 3, kind: 'wing', gem: '#9a7aff' }, { r: rp('#2a2440'), wrap: y }, { r: y, kind: 'star', gem: '#9a7aff' }); },
  /* ---------- daggers ---------- */
  leechfang: s => { const bone = ramp('#e8dcc8', { gl: .8 }); /* a curved fang that never stops being warm: a red vein, a drop */
    const [gx, gy] = blade(s, { r: bone, tip: 3, base: 8, w: 3, shape: 'taper', curve: y => (y < 6 ? 1 : 0) });
    for (let y = 4; y <= 8; y++) { const [a] = span(15 - y, 3); s.fix(a + 1 + (y < 6 ? 1 : 0), y, '#9a3a4a'); }
    hilt(s, gx, gy, { r: rp('#5a3a2a'), n: 1 }, { r: rp('#9a3a4a'), wrap: rp('#5a2030') }, { r: rp('#5a3a2a') });
    s.fix(10, 10, '#c8483c'); s.fix(10, 11, '#8a2a2a'); },
  alley_knife: s => { const m = ramp('#8a7a6a', { gl: .38, hi: .16 }), w = rp('#4e3a2a'); /* a rusty alley knife: no guard, a notched wooden handle */
    const [gx, gy] = blade(s, { r: m, tip: 4, base: 8, w: 2 });
    for (const [x, y] of [[9, 6], [8, 7], [11, 5]]) s.fix(x, y, '#a8643a');
    T(s, gx, gy, rp('#4a4440'), 3); T(s, gx + 1, gy, rp('#4a4440'), 1);
    grip(s, gx - 1, gy + 1, 3, w); s.fix(gx - 1, gy + 2, '#d8c0a0'); s.fix(gx - 3, gy + 3, '#d8c0a0'); T(s, gx - 4, gy + 4, metal('#6a6460'), 3); T(s, gx - 3, gy + 4, metal('#6a6460'), 1); },
  quickfang: s => { const f = ramp('#e8dfc8', { gl: .8 }), u = rp('#8e8f96'); /* a wolf's tooth the length of your hand, bound to a grip, a tuft of fur */
    const [gx, gy] = blade(s, { r: f, tip: 2, base: 8, widths: [1, 2, 2, 3, 3, 4, 4], curve: y => (y <= 4 ? -1 : 0) });
    T(s, gx, gy, rp('#c8b898'), 3); T(s, gx + 1, gy, rp('#c8b898'), 2); T(s, gx + 2, gy - 1, f, 1);
    grip(s, gx - 1, gy + 1, 2, LEATHER, LEATHER_D); ball(s, gx - 3, gy + 3, rp('#e8dcc8'));
    T(s, gx - 2, gy - 1, u, 4); T(s, gx - 3, gy - 1, u, 3); T(s, gx - 3, gy, u, 2); T(s, gx - 2, gy, u, 2); },
  nightglint: s => { const b = ramp('#2e2e50', { gl: .5, hi: .3 }), m = metal('#c8d0e0'); /* a black blade that catches light that isn't there */
    const [gx, gy] = blade(s, { r: b, tip: 3, base: 8, w: 3, shape: 'taper' });
    for (let y = 5; y <= 8; y++) { const [a] = span(15 - y, 3); s.fix(a + 2, y, '#7a6ac8'); }
    star(s, 10, 5, '#c8b8ff'); s.fix(13, 2, '#ffffff');
    hilt(s, gx, gy, { r: m, n: 1, kind: 'up' }, { r: rp('#3a3050') }, { r: m, kind: 'gem', gem: '#9a7ae8' }); },
  frostbite: s => { const i = ramp('#bfe0f4', { gl: .9 }), g = rp('#4a6a8a'); /* frozen to the wight's hand: an icicle blade, frost on the guard */
    const [gx, gy] = blade(s, { r: i, tip: 2, base: 8, w: 3, shape: 'taper' });
    for (let y = 4; y <= 8; y++) s.fix(16 - y - 1, y, '#ffffff');
    hilt(s, gx, gy, { r: ramp('#8ec4ea', { gl: .85 }), n: 2, kind: 'down' }, { r: g, wrap: rp('#e8f8ff') }, { r: ramp('#8ec4ea'), kind: 'gem', gem: '#ffffff' });
    T(s, 9, 11, i, 3); T(s, 9, 12, i, 1); T(s, 3, 7, i, 3); },
  whisperblade: s => { const t = ramp('#c8c0d8', { gl: .85 }), a = ramp('#d4c8e8', { gl: .85 }); /* so thin you can read through it, worn like a moth's wing */
    const [gx, gy] = blade(s, { r: t, tip: 1, base: 8, w: 2 });
    for (let y = 3; y <= 8; y++) s.fix(16 - y, y, '#fbf8ff');
    s.ell(3.5, 7, 1.8, 1.4, a); s.ell(8, 11.5, 1.6, 1.8, a); s.fix(3, 7, '#6a5a9a'); s.fix(8, 12, '#6a5a9a');
    hilt(s, gx, gy, { r: rp('#5a4a6a'), n: 1 }, { r: rp('#4a3a5a') }, { r: t }); },
  /* ---------- hammers (upright) ---------- */
  thunderclap_maul: s => { const m = metal('#c8b860'); /* a troll's ice-cracking maul: a big rounded block, lightning in the cracks */
    hammerOf(s, 'bronze', { r: m, box: [2, 2, 13, 6], collar: DARK, wrap: rp('#5a4a3a'), round: true });
    for (const [x, y] of [[5, 2], [6, 3], [5, 4], [6, 5], [10, 3], [9, 4], [10, 5], [9, 6]]) s.fix(x, y, '#ffe050'); },
  ashkas_hammer: s => { const m = metal('#5a4a48'), hot = ramp('#f08a3a', { gl: .85 }); /* the forge-mother's hammer: one face still glowing */
    hammerOf(s, 'iron', { r: m, box: [4, 2, 12, 5], collar: hot, wrap: LEATHER_D, bands: false });
    for (let y = 2; y <= 5; y++) { T(s, 4, y, hot, y === 2 ? 4 : 3); T(s, 5, y, hot, 2); } T(s, 3, 3, hot, 3); T(s, 3, 4, hot, 2); s.fix(2, 2, '#ffd060'); s.fix(1, 4, '#ffb04a'); s.fix(13, 1, '#ffd060'); },
  smiths_maul: s => { const k = ramp('#3a3436', { gl: .55, hi: .3 }); /* Willowbrook's forge hammer: a dark iron head, a face still hot from the fire */
    hammerOf(s, 'iron', { r: k, box: [5, 2, 12, 5], collar: rp('#6a4a30'), wrap: LEATHER, bands: false });
    for (let y = 3; y <= 5; y++) s.fix(12, y, y === 4 ? '#ffd060' : '#ff8a3a'); T(s, 13, 3, ramp('#ff8a3a'), 2); T(s, 13, 4, ramp('#ff8a3a'), 1); },
  siegebreaker: s => { const k = metal('#6a7a8a'), B = metal('#3a4450'); /* built to knock in castle doors: a banded ram head with rivets and a spike */
    hammerOf(s, 'iron', { r: k, box: [2, 2, 12, 6], collar: B, wrap: rp('#3a4450'), bands: false });
    for (const x of [4, 9]) for (let y = 2; y <= 6; y++) T(s, x, y, B, y === 2 ? 3 : 2); for (const [x, y] of [[3, 4], [7, 3], [11, 4]]) s.fix(x, y, '#e8eef4');
    T(s, 13, 3, k, 3); T(s, 13, 4, k, 2); T(s, 14, 4, k, 1); T(s, 13, 5, k, 1); },
  earthshaker: s => { const r = rp('#8c8274'), t = rp('#6a4a30'); /* a boulder on a pine trunk, lashed on with rope */
    for (let y = 7; y <= 14; y++) { T(s, 6, y, t, 3); T(s, 7, y, t, 2); T(s, 8, y, t, 1); } T(s, 5, 14, t, 3); T(s, 9, 14, t, 1); s.fix(7, 11, '#4a3020'); s.fix(6, 13, '#4a3020');
    s.poly([[1.5, 4], [4, 1], [11, 0.5], [14.5, 3.5], [13.5, 7.5], [8, 8.5], [2.5, 7.5]], r);
    for (const [x, y] of [[5, 3], [6, 4], [10, 2], [11, 5], [12, 5]]) s.fix(x, y, r.lo); s.fix(4, 2, '#c8c0b0'); s.fix(5, 2, '#b8b0a0');
    for (const x of [6, 7, 8]) T(s, x, 9, CORD, x === 8 ? 1 : 3); T(s, 2, 4, rp('#6a9a4a'), 3); T(s, 3, 3, rp('#6a9a4a'), 3); T(s, 2, 5, rp('#6a9a4a'), 2); },
  avalanche: s => { const w = ramp('#e8f0f8', { gl: .9 }), B = ramp('#7ab0e0', { gl: .8 }); /* Jarl Rimebeard's maul: snow-packed, ice hanging off it */
    hammerOf(s, 'steel', { r: w, box: [2, 2, 13, 6], collar: B, wrap: rp('#5a4a40'), spike: false });
    for (const [x, y] of [[4, 4], [5, 5], [9, 3], [10, 4], [12, 5]]) s.fix(x, y, '#9ac8f0');
    for (const [x, h] of [[3, 2], [11, 3], [13, 1]]) for (let j = 1; j <= h; j++) T(s, x, 6 + j, B, j === h ? 1 : 3); },
  worldbreaker: s => { const k = ramp('#2a2034', { gl: .5, hi: .32 }), h = metal('#4a4450'); /* the mountain's forge hammer, still glowing where the crack runs */
    hammerOf(s, 'iron', { r: k, box: [1, 1, 14, 6], collar: h, wrap: rp('#3a2a3a'), bands: false });
    for (const [x, y] of [[6, 1], [7, 2], [7, 3], [8, 4], [9, 4], [9, 5], [10, 6]]) s.fix(x, y, '#ff8a3a'); s.fix(8, 3, '#ffe070'); s.fix(8, 7, '#ff6a2a'); s.fix(2, 2, '#8a7ab8'); s.fix(3, 2, '#8a7ab8'); },
  thunderhead: s => { const h = ramp('#e8d8a0', { gl: .8 }), hd = ramp('#a8946a'), k = metal('#8a8aa0'); /* cut from the Stormcrown Ram's own horn: a coiled horn on one side, a striking face on the other, crackling */
    for (let y = 7; y <= 13; y++) { T(s, 7, y, rp('#8a6038'), 3); T(s, 8, y, rp('#8a6038'), 2); } for (const y of [10, 11, 12]) { T(s, 7, y, LEATHER, 3); T(s, 8, y, LEATHER, 1); }
    T(s, 6, 14, GOLD, 3); T(s, 7, 14, GOLD, 3); T(s, 8, 14, GOLD, 2); T(s, 9, 14, GOLD, 1);
    s.ell(11, 4, 3.4, 3.4, h); s.ell(11.4, 4.6, 1.7, 1.7, hd, { flat: true }); s.fix(11, 4, hd.lo); s.fix(12, 5, h.out); s.fix(12, 4, hd.lo);
    for (const [x, y] of [[9, 1], [8, 3], [13, 1], [14, 3]]) s.fix(x, y, h.lo);
    hammerHead(s, 1, 2, 7, 6, k); T(s, 8, 3, h, 3); T(s, 8, 5, h, 2);
    T(s, 6, 7, GOLD, 3); T(s, 7, 7, GOLD, 3); T(s, 8, 7, GOLD, 2); T(s, 9, 7, GOLD, 1);
    for (const [x, y] of [[3, 2], [4, 3], [3, 4], [4, 5]]) s.fix(x, y, '#fff07a'); s.fix(0, 1, '#fff07a'); },
  /* ---------- bows ---------- */
  emberfang_bow: s => { const w = rp('#c8402a'); const pts = vbow(s, w, { bend: 6.4, curl: 2.4, fat: true }); /* the wyrm's bow: a red recurve, fang tips, embers */
    fill(s, rowsOf(pts, [7, 8]), rp('#3a2020'), 3, 1); fill(s, where(pts, (x, y) => y <= 2 || y >= 13), rp('#f4ecd8'), 3, 2);
    for (const [x, y] of [[9, 4], [10, 11], [12, 6]]) if (s.at(x, y)) s.fix(x, y, '#ffb04a'); s.fix(14, 3, '#ffd060'); s.fix(14, 12, '#ff8a3a'); gem1(s, 9, 7, '#ffb04a'); },
  wyrdwood_bow: s => { const w = rp('#6a8a4a'), leaf = rp('#7ac85a'); const pts = dbow(s, w, { bend: 3.2 }); /* a longbow cut from the tree the scarecrows guard; it still sprouts */
    fill(s, where(pts, (x, y) => x + y >= 6 && x + y <= 9 && x < 7), LEATHER, 3, 1);
    for (const [x, y] of [[6, 1], [1, 8], [11, 0]]) { T(s, x, y, leaf, 3); T(s, x + 1, y, leaf, 2); T(s, x, y + 1, leaf, 1); } s.fix(9, 1, '#d8ff9a'); },
  windcaller_bow: s => { const w = ramp('#bfe8ff', { gl: .85 }); const pts = vbow(s, w, { bend: 6.6, curl: 1.6 }); /* strung with a note from the great bell: a little brass bell at the grip */
    fill(s, rowsOf(pts, [7, 8]), rp('#6a7aa8'), 3, 1);
    s.ell(12.5, 9.5, 1.4, 1.4, GOLD); T(s, 12, 11, GOLD, 2); T(s, 13, 11, GOLD, 1); s.fix(12, 8, '#8a6a2a');
    for (const [x, y] of [[13, 2], [14, 3], [13, 13], [14, 12]]) s.fix(x, y, '#ffffff'); },
  hunters_bow: s => { const w = rp('#8a6a3a'); const pts = vbow(s, w, { bend: 6.2, fat: true }); /* oiled, strung and looked after; a tally of rabbits on the grip, a feather tied on */
    fill(s, rowsOf(pts, [6, 7, 8, 9]), rp('#5a2e24'), 3, 1); for (const y of [6, 8]) { const r0 = rowsOf(pts, [y]).sort((a, b) => a[0] - b[0]); if (r0[1]) s.fix(r0[1][0], y, '#f0e0c0'); }
    T(s, 12, 2, rp('#f0e8d4'), 4); T(s, 13, 3, rp('#f0e8d4'), 3); T(s, 13, 2, rp('#c8483c'), 2); },
  whisperwood_bow: s => { const w = rp('#667a64'), f = ramp('#34343f', { gl: .45 }); const pts = vbow(s, w, { bend: 6, round: .45, stringCol: '#d8d8c8' }); /* strung from the Rookmother's nest: black feathers at the tips */
    fill(s, rowsOf(pts, [7, 8]), rp('#3a3a44'), 3, 1);
    for (const [x, y, v] of [[9, 0, 3], [10, 1, 2], [11, 1, 1], [9, 15, 2], [10, 14, 2], [11, 14, 1], [12, 13, 1]]) T(s, x, y, f, v); s.fix(10, 0, '#8a9ac8'); },
  spellstring: s => { const w = rp('#8a6ac8'); const pts = vbow(s, w, { bend: 6.4, curl: 1.2, stringCol: '#5ae0b0' }); /* runes knotted into a kelp string that hums off-key */
    fill(s, rowsOf(pts, [7, 8]), rp('#3a2a5a'), 3, 1);
    for (let y = 2; y <= 13; y++) { s.erase(5, y); s.fix(5 + (y % 4 === 1 ? -1 : y % 4 === 3 ? 1 : 0), y, y % 3 ? '#5ae0b0' : '#e0fff0'); }
    for (const [x, y] of [[13, 4], [13, 11]]) s.fix(x, y, '#f0d8ff'); },
  nightyew_longbow: s => { const m = metal('#c8d0e0'); const pts = dbow(s, ramp('#3a4a3a', { hi: .4, gl: .6 }), { bend: 3, lo: [1, 14], hi: [14, 1], stringCol: '#c8d0d8' }); /* yew grown in the dark under the fen, silver-tipped */
    fill(s, where(pts, (x, y) => x + y <= 2 || (x + y >= 13 && (x <= 2 || y <= 2))), m, 3, 1);
    fill(s, where(pts, (x, y) => x + y >= 7 && x + y <= 9 && x < 6), rp('#5a6a7a'), 3, 1);
    for (const [x, y] of [[8, 1], [2, 8]]) if (s.at(x, y)) s.fix(x, y, '#8aa0b4'); },
  autumn_recurve: s => { const w = rp('#d87a3a'), l = rp('#c8402a'); const pts = vbow(s, w, { bend: 5.8, curl: 2.6 }); /* maple the colour of a bonfire, red leaves on it */
    fill(s, rowsOf(pts, [7, 8]), LEATHER_D, 3, 1);
    for (const [x, y] of [[12, 3], [12, 11]]) { T(s, x, y, l, 3); T(s, x + 1, y, l, 2); T(s, x, y + 1, l, 2); T(s, x + 1, y + 1, l, 1); } s.fix(12, 3, '#f0a060'); },
  elderthorn_greatbow: s => { const w = rp('#6a3a4a'), t = rp('#d8c8b8'); const pts = dbow(s, w, { bend: 3.6, fat: true, lo: [1, 14], hi: [14, 1], stringCol: '#6ab04a' }); /* the oldest elder, thorned, strung with a living vine */
    for (const [x, y] of [[5, 0], [9, 0], [0, 5], [0, 9]]) T(s, x, y, t, 3);
    fill(s, where(pts, (x, y) => x + y >= 6 && x + y <= 8 && x < 5), rp('#3a2028'), 3, 1);
    for (const [x, y] of [[9, 7], [6, 10], [11, 5]]) s.fix(x, y, '#8ad060'); },
  /* ---------- staves ---------- */
  witch_staff: s => { const w = ramp('#4a3a3a', { hi: .36, gl: .6 }), m = rp('#5a7a4a'); /* Morwenna's bog staff: gnarled, mossy, a violet orb hung in its crook */
    haft(s, 14, 5, w); for (const [x, y, v] of [[9, 5, 3], [8, 4, 3], [8, 3, 4], [9, 2, 4], [10, 1, 3], [11, 1, 3], [12, 1, 2], [13, 2, 2], [13, 3, 1]]) T(s, x, y, w, v);
    T(s, 13, 4, CORD, 2); orb(s, 12.5, 6, '#b79cff', 1.7); for (const [x, y] of [[6, 9], [5, 10], [9, 2]]) T(s, x, y, m, 3); s.fix(4, 11, '#7a9a5a'); },
  stormcaller_staff: s => { const w = rp('#6a5a8a'); /* stolen from a weather-witch: a storm-blue orb, a bolt crackling off it */
    haft(s, 14, 6, w); T(s, 8, 6, w, 3); T(s, 9, 6, w, 2); T(s, 12, 7, w, 1); T(s, 8, 5, w, 3); T(s, 13, 6, w, 2);
    orb(s, 11, 3.5, '#9ab8ff', 2.4);
    for (const [x, y] of [[14, 1], [15, 2], [14, 3], [15, 4]]) s.fix(x, y, '#fff6a0'); s.fix(14, 2, '#ffffff'); },
  lamplight_staff: s => { const w = rp('#c8a060'), b = metal('#4a4a5c'); /* the lighthouse keeper's staff: a lantern for a head that never needs oil */
    haft(s, 14, 6, w);
    for (let y = 2; y <= 6; y++) for (let x = 9; x <= 13; x++) T(s, x, y, b, x === 9 || y === 2 ? 3 : x === 13 || y === 6 ? 1 : 2);
    for (let y = 3; y <= 5; y++) for (let x = 10; x <= 12; x++) s.fix(x, y, y === 3 && x === 10 ? '#ffffff' : '#ffe48a');
    s.fix(11, 4, '#fff6c8'); T(s, 10, 1, b, 3); T(s, 11, 1, b, 3); T(s, 12, 1, b, 2); T(s, 11, 0, b, 4);
    for (const [x, y] of [[14, 3], [8, 3], [14, 5]]) s.fix(x, y, '#f0d880'); },
  acolytes_staff: s => { const w = rp('#c8a86a'); /* a temple apprentice's practice staff: a gilt sun on top, chewed at the bottom */
    haft(s, 14, 6, w); s.erase(1, 14); T(s, 1, 14, w, 1);
    s.ell(11, 4, 2.2, 2.2, GOLD); s.fix(11, 4, '#fff6c0');
    for (const [x, y] of [[11, 0], [11, 1], [15, 4], [14, 4], [8, 1], [14, 1], [7, 4]]) T(s, x, y, GOLD, 3); T(s, 8, 7, GOLD, 3); T(s, 9, 7, GOLD, 1); },
  willowshade_staff: s => { const w = ramp('#6a9a5a'), l = rp('#a8d878'); /* green wood that never quite dried: a hooked top, leaves still sprouting */
    haft(s, 14, 5, w);
    for (const [x, y, v] of [[9, 4, 3], [9, 3, 4], [10, 2, 4], [11, 1, 3], [12, 1, 3], [13, 2, 2], [14, 3, 2], [14, 4, 1], [14, 5, 1]]) T(s, x, y, w, v);
    for (const [x, y] of [[13, 7], [15, 7], [7, 1], [5, 9]]) { T(s, x, y, l, 3); T(s, x, y + 1, l, 1); } T(s, 12, 5, l, 2); T(s, 6, 2, l, 2); },
  yewbound_staff: s => { const w = rp('#5a7a3a'), r = rp('#7a5a3a'); /* roots still wrapped round it, still growing; a red yew berry */
    haft(s, 14, 4, w); for (const [x, y, v] of [[10, 3, 3], [9, 2, 4], [12, 3, 2], [13, 2, 2], [11, 2, 3]]) T(s, x, y, w, v);
    for (const [x, y] of [[2, 12], [3, 11], [4, 11], [5, 9], [6, 9], [7, 7], [8, 7], [9, 5], [10, 5]]) T(s, x, y, r, 3);
    for (const [x, y] of [[0, 15], [1, 15]]) T(s, x, y, r, 2); s.ell(12.5, 5.5, 1.2, 1.2, rp('#c83a3a')); s.fix(12, 5, '#ffffff'); s.fix(8, 1, '#8ac85a'); s.fix(14, 1, '#8ac85a'); },
  emberwood_staff: s => { const c = ramp('#2e2626', { gl: .5, hi: .34 }), o = ramp('#ff8a3a', { gl: .85 }); /* charred black and still warm at the core: a flame at the tip */
    haft(s, 14, 6, c); for (const y of [8, 11]) { const a = 15 - y; s.fix(a + 1, y, '#ff8a3a'); }
    for (const [x, y, v] of [[8, 5, 3], [8, 4, 3], [9, 3, 2], [13, 5, 1], [13, 4, 1], [12, 3, 2], [9, 6, 2], [12, 6, 1]]) T(s, x, y, c, v);
    s.ell(10.5, 3.5, 1.6, 2, o); s.fix(10, 3, '#fff6c0'); s.fix(10, 1, '#ffb04a'); s.fix(11, 0, '#ffe070'); s.fix(11, 1, '#ffd060'); },
  aetherwood_staff: s => { const w = ramp('#c8a8ff', { gl: .75 }); /* wood that grew above the clouds: forked prongs, a white crystal floating between them */
    haft(s, 14, 6, w); for (const [x, y, v] of [[8, 5, 3], [7, 4, 4], [7, 3, 3], [10, 6, 2], [11, 7, 1], [12, 6, 1]]) T(s, x, y, w, v);
    s.poly([[11, 0], [13.6, 2.8], [11, 5.6], [8.4, 2.8]], ramp('#dff0ff', { gl: .9 })); s.fix(10, 1, '#ffffff'); s.fix(10, 2, '#ffffff'); s.fix(12, 4, '#a8c8f0');
    T(s, 14, 6, ramp('#dff0ff', { gl: .9 }), 4); T(s, 14, 7, ramp('#dff0ff'), 2); },
  elderlight: s => { const w = ramp('#d8c8a0'), g = ramp('#f0d060', { gl: .9 }); /* pale elder with a light at the tip that never flickers */
    haft(s, 14, 5, w); for (const [x, y, v] of [[9, 4, 3], [9, 3, 4], [10, 2, 4], [11, 1, 3], [12, 1, 3], [13, 2, 2]]) T(s, x, y, w, v);
    s.ell(13, 5, 1.8, 1.8, g); s.fix(12, 4, '#ffffff'); s.fix(13, 5, '#ffffff');
    for (const [x, y] of [[13, 8], [15, 5], [11, 6]]) s.fix(x, y, '#fff6c0'); }
};
Object.assign(DRAW, NAMED);

const base = A.itemSprite;
A.itemSprite = id => { const f = DRAW[id]; if (!f || !D.ITEMS[id]) return base(id); const s = Spr(16, 16); f(s); return s; };
A.itemUrl = id => A.url('item:' + id, () => A.itemSprite(id));
A.weaponArt = DRAW;
})();
