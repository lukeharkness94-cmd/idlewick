/* Idlewick towns (Nov 2026): every town is a wide, lived-in place (320 x 180), not one or two buildings. Rows of
   homes with lit windows and chimney smoke, streets with townsfolk, each region's own landmark and trade, and the
   restoration sites along the front. Each site shows its project as a ruin, then building up in stages as materials
   are delivered (foundations, walls under scaffolding, nearly finished), then restored. The more of a town is
   restored, the more of its homes are lived in again. Drawn in code in the house style; whole-pixel art. */
(() => {
const DQ = window.DQ, D = DQ.data, A = DQ.pixelArt; if (!A || !A.piece) return;
const { mix } = A, W = 320, H = 180;
const seeded = s => { let h = 2166136261; for (const c of s) h = Math.imul(h ^ c.charCodeAt(0), 16777619); return () => { h = Math.imul(h ^ (h >>> 15), 2246822507); h = Math.imul(h ^ (h >>> 13), 3266489909); h ^= h >>> 16; return (h >>> 0) / 4294967296; }; };

/* ---------- a restoration piece at its construction stage ---------- */
const stagePiece = (kind, stage) => {
  if (stage >= 4) return A.piece(kind, true);
  if (stage <= 0) return A.piece(kind, false);
  const F = A.piece(kind, true), s = A.Spr(32, 32); let x0 = 32, x1 = -1, y0 = 32, y1 = -1;
  for (let y = 0; y < 32; y++) for (let x = 0; x < 32; x++) if (F.px[y * 32 + x]) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); }
  if (x1 < 0) return F;
  const reveal = [0, .18, .5, .82][stage], top = Math.round(y1 + 1 - (y1 - y0 + 1) * reveal);
  for (let y = top; y <= y1; y++) for (let x = x0; x <= x1; x++) { const p = F.px[y * 32 + x]; if (p) s.px[y * 32 + x] = p; }
  /* foundations along the ground line */
  s.rect(Math.max(0, x0 - 1), y1, Math.min(32, x1 - x0 + 3), 1, A.R.stone);
  /* scaffolding: two posts a little above the work, planks every few rows, a ladder on stages 2 and 3 */
  const wood = A.R.woodLight, postTop = Math.max(0, top - 4), L = Math.max(0, x0), Rt = Math.min(31, x1);
  for (const x of [L, Rt]) for (let y = postTop; y <= y1; y++) s.dot(x, y, wood);
  for (let y = y1 - 3; y >= postTop; y -= 5) for (let x = L; x <= Rt; x++) if (!s.px[y * 32 + x] || (x === L || x === Rt) || y < top) s.dot(x, y, A.R.wood);
  if (stage >= 2) for (let y = postTop + 1; y <= y1; y++) { s.dot(L + 2, y, wood); if (y % 2 === 0) s.dot(L + 3, y, A.R.wood); s.dot(L + 4, y, wood); }
  /* materials waiting by the site: timber and stone */
  const px = Math.min(28, x1 + 1) - 3; s.rect(px, 29, 4, 1, A.R.wood); s.rect(px + 1, 28, 3, 1, A.R.woodLight); s.ell(Math.max(2, x0 - 1), 29, 1.6, 1.2, A.R.stone);
  return s;
};

/* ---------- small drawing helpers on the scene canvas ---------- */
const make = () => { const c = document.createElement('canvas'); c.width = W; c.height = H; return c; };
const painter = x => {
  const f = (col, a, b, w, h) => { x.fillStyle = col; x.fillRect(a, b, w, h); };
  const ell = (col, cx, cy, rx, ry) => { x.fillStyle = col; for (let j = -Math.ceil(ry); j <= Math.ceil(ry); j++) { const w = Math.round(rx * Math.sqrt(Math.max(0, 1 - (j * j) / (ry * ry + .01)))); if (w > 0) x.fillRect(Math.round(cx - w), Math.round(cy + j), w * 2, 1); } };
  const ridge = (col, base, amp, seed, step = 1) => { x.fillStyle = col; for (let i = 0; i < W; i += step) { const y = Math.round(base + Math.sin(i / 37 + seed) * amp + Math.sin(i / 13 + seed * 2) * amp * .35); x.fillRect(i, y, step, H - y); } };
  return { f, ell, ridge };
};
/* a home: lit windows and smoke when lived in, boarded and dark when not; top-left light */
const home = (P, X, base, w, h, st, lived, rnd) => {
  const { f } = P, wall = st.walls[Math.floor(rnd() * st.walls.length)], roof = st.roofs[Math.floor(rnd() * st.roofs.length)], top = base - h;
  if (st.stilts) { f(mix(st.ground, '#000000', .45), X + 1, base, 1, 5); f(mix(st.ground, '#000000', .45), X + w - 2, base, 1, 5); }
  f(wall, X, top, w, h); f(mix(wall, '#ffffff', .25), X, top, 1, h); f(mix(wall, '#000000', .2), X + Math.ceil(w * .66), top, Math.floor(w * .34), h);
  const rh = Math.max(3, Math.round(w / 2.4));
  for (let j = 0; j < rh; j++) { const inset = Math.round((rh - 1 - j) * (w / 2 + 1) / rh), a = X - 1 + inset, b = X + w + 1 - inset; if (b <= a) continue; const mid = Math.round((a + b) / 2); f(mix(roof, '#ffffff', .12), a, top - rh + j, mid - a, 1); f(mix(roof, '#000000', .18), mid, top - rh + j, b - mid, 1); }
  f(mix(roof, '#000000', .4), X - 1, top - 1, w + 2, 1);
  if (st.snow) f('#f4f8fc', X + Math.floor(w / 2) - 2, top - rh, 4, 1);
  const win = lived ? (st.glow || '#f6d880') : '#2a2830';
  if (w >= 9) { f(win, X + 2, top + 2, 2, 2); f(win, X + w - 4, top + 2, 2, 2); } else f(win, X + 2, top + 2, 2, 2);
  f(lived ? mix(wall, '#3a2416', .6) : '#3a3030', X + Math.floor(w / 2) - 1, base - 4, 3, 4);
  if (!lived) { f(mix(wall, '#000000', .45), X + 1, top + 3, w - 2, 1); }
  if (rnd() < .7) { const cx = X + (rnd() < .5 ? 2 : w - 4); f(mix(st.walls[0], '#000000', .35), cx, top - rh, 2, 3); if (lived) { f('rgba(225,225,230,.8)', cx, top - rh - 3, 2, 2); f('rgba(225,225,230,.55)', cx + 1, top - rh - 6, 2, 2); f('rgba(225,225,230,.35)', cx + 2, top - rh - 9, 3, 2); } }
};
const tree = (P, X, base, size, leaf, rnd) => { const { f, ell } = P; f(mix(leaf, '#3a2414', .7), X, base - size, 2, size); ell(mix(leaf, '#000000', .2), X + 1, base - size - size * .3, size * .62, size * .5); ell(leaf, X, base - size - size * .4, size * .5, size * .4); ell(mix(leaf, '#ffffff', .2), X - 1, base - size - size * .55, size * .25, size * .2); };
const pine = (P, X, base, size, leaf) => { const { f } = P; f('#4a3424', X, base - 3, 2, 3); for (let j = 0; j < size; j++) { const w = Math.round((j + 2) * .45); f(j % 3 === 0 ? mix(leaf, '#ffffff', .15) : leaf, X + 1 - w, base - 3 - size + j, w * 2, 1); } };
const folk = (P, X, Y, rnd) => { const { f } = P, cloth = ['#3f7fbf', '#b8483a', '#7a9a5a', '#c89a3a', '#7a5a9a', '#6a6a74'][Math.floor(rnd() * 6)]; f('#e0b088', X, Y - 6, 2, 2); f(cloth, X, Y - 4, 2, 3); f('#3a3030', X, Y - 1, 1, 1); f('#3a3030', X + 1, Y - 1, 1, 1); };

/* ---------- each town's look and layout ---------- */
const STYLE = {
  willowbrook: { walls: ['#e8dcc0', '#dccca8', '#e4d4b4'], roofs: ['#c8a050', '#b8483a', '#b89048'], leaf: '#5f9a45', homes: 16, landmark: null, trees: 9 },
  mossbarrow: { walls: ['#e8d8b8', '#c87a5a', '#e0ccaa'], roofs: ['#b8483a', '#a85a3a', '#c8a050'], leaf: '#6a9a4a', homes: 15, landmark: ['windmill', 236, 46], trees: 6, fields: true, stalls: true },
  saltmere: { walls: ['#eef2f4', '#dce8ee', '#e8e0d0'], roofs: ['#4a6a8a', '#3a5a7a', '#b8483a'], leaf: '#8ab06a', homes: 14, landmark: ['lighthouse', 268, 34], trees: 3, sea: true },
  ironpeak: { walls: ['#9aa0a8', '#8a8a90', '#a8a49c'], roofs: ['#4a5058', '#5a6068', '#3a4048'], leaf: '#3a6a4a', homes: 14, landmark: ['mine', 30, 52], trees: 8, snow: true, pines: true },
  gloomfen: { walls: ['#6a5a44', '#5a4a3a', '#7a6a50'], roofs: ['#4a5a3a', '#5a6a42', '#3a4a30'], leaf: '#4a6a3a', homes: 13, landmark: null, trees: 9, swamp: true, stilts: true, glow: '#c8f0a0' },
  emberfall: { walls: ['#6a3a32', '#7a4a3a', '#5a3028'], roofs: ['#3a2420', '#4a2a24', '#2a1a18'], leaf: '#5a4a2a', homes: 14, landmark: ['citadel', 38, 50], volcano: true, trees: 2, lava: true, glow: '#ffb04a' },
  skyreach: { walls: ['#f4f4f0', '#e8e4dc', '#f0ece4'], roofs: ['#c8483c', '#b83a30', '#d86a4a'], leaf: '#6aaa6a', homes: 13, landmark: ['monastery', 232, 30], trees: 4, clouds: true, pines: true },
  hollow: { walls: ['#4a4058', '#3a3448', '#5a4e66'], roofs: ['#2a2238', '#342a44', '#221c30'], leaf: '#4a3a5a', homes: 14, landmark: ['castle', 236, 26], trees: 5, stars: true, glow: '#c8a8ff', ruined: .35 }
};

/* where each restoration site stands in a town scene (32 x 32 each, in scene pixels); the Projects page puts a
   clickable spot over each one */
const siteLayout = town => { const sites = Object.keys(D.PROJECTS || {}).filter(k => D.PROJECTS[k].town === town), n = sites.length, gap = (W - 16) / Math.max(1, n);
  return sites.map((id, i) => ({ id, i, X: Math.round(8 + gap * (i + .5) - 16), Y: i % 2 ? 144 : 134 })).sort((a, b) => a.Y - b.Y); };
function sceneFor(town, stages = {}) {
  const T = A.TOWN[town] || A.TOWN.willowbrook, st = Object.assign({ ground: T.ground }, STYLE[town] || STYLE.willowbrook), rnd = seeded(town);
  const c = make(), x = c.getContext('2d'), P = painter(x), { f, ell, ridge } = P;
  /* sky (kept short: the town is the subject) */
  f(T.sky[0], 0, 0, W, 16); f(T.sky[1], 0, 16, W, 14); f(T.sky[2], 0, 30, W, 30);
  if (st.stars) for (let i = 0; i < 40; i++) f(i % 5 ? '#c8c0ff' : '#ffffff', Math.floor(rnd() * W), Math.floor(rnd() * 40), 1, 1);
  else for (const [cx, cy, w] of [[30, 8, 26], [150, 5, 34], [250, 11, 22]]) { f(mix(T.sky[0], '#ffffff', .75), cx, cy, w, 3); f(mix(T.sky[0], '#ffffff', .75), cx + 4, cy - 2, w - 8, 2); }
  if (st.volcano) { const v = A.landmark('volcano'); x.drawImage(A.toCanvas(v), 196, 0, 128, 80); }
  /* far and near hills, with distant homes on the ridge */
  ridge(T.hills[0], st.snow ? 30 : 38, st.snow ? 9 : 4, town.length);
  if (st.snow) for (let i = 0; i < W; i++) { const y = Math.round(30 + Math.sin(i / 37 + town.length) * 9 + Math.sin(i / 13 + town.length * 2) * 3.15); f('#ffffff', i, y, 1, 2); }
  for (let i = 0; i < 9; i++) { const hx = 8 + i * 35 + Math.floor(rnd() * 12), hy = 44 + Math.floor(rnd() * 3); f(mix(st.walls[0], T.hills[0], .45), hx, hy, 6, 4); f(mix(st.roofs[0], T.hills[0], .45), hx - 1, hy - 2, 8, 2); if (!st.ruined || i % 2) f(st.glow || '#f6d880', hx + 2, hy + 1, 1, 1); }
  ridge(T.hills[1], 52, 3, town.length + 3);
  /* ground and water */
  f(T.ground, 0, 60, W, H - 60);
  for (let i = 0; i < 220; i++) f(mix(T.ground, i % 2 ? '#ffffff' : '#000000', .1), Math.floor(rnd() * W), 60 + Math.floor(rnd() * 120), 2, 1);
  if (st.sea) { f('#4f8fc0', 0, 40, W, 26); f('#5f9fcc', 0, 46, W, 3); for (let i = 0; i < 26; i++) f('#e8f6ff', Math.floor(rnd() * W), 42 + Math.floor(rnd() * 22), 4, 1); f('#f0e2b0', 0, 64, W, 6);
    for (const [bx, by] of [[40, 52], [120, 46], [190, 56]]) { f('#7a5236', bx, by, 14, 3); f('#5a3a26', bx + 1, by + 3, 12, 1); f('#e8e0d0', bx + 6, by - 8, 1, 8); f('#f4ecd8', bx + 7, by - 7, 5, 6); } }
  if (st.clouds) for (const [cx, cy, w] of [[0, 62, 60], [90, 66, 70], [200, 60, 90]]) { f('#f6fbfc', cx, cy, w, 5); f('#f6fbfc', cx + 6, cy - 3, w - 12, 3); }
  if (st.fields) for (let r = 0; r < 5; r++) { f(r % 2 ? '#c8b058' : '#8aa850', 0, 62 + r * 3, 120, 2); f(r % 2 ? '#d8c068' : '#9ab860', 236, 62 + r * 3, 84, 2); }
  if (st.swamp) for (const [px, py, rx] of [[60, 100, 26], [250, 82, 30], [170, 128, 34]]) { ell('#3a4a3a', px, py, rx, 4); ell('#4a5a4a', px - 4, py - 1, rx * .5, 1.5); }
  if (st.lava) { f('#e8583a', 0, 70, W, 2); f('#ffb04a', 0, 70, W, 1); for (let i = 0; i < 10; i++) f('#ff8a3a', Math.floor(rnd() * W), 71 + Math.floor(rnd() * 2), 3, 1); }
  /* streets: two long roads and the lanes between them */
  const road = T.path || mix(T.ground, '#d8c8a0', .45), roadDk = mix(road, '#000000', .14);
  for (const ry of [88, 128]) { f(road, 0, ry, W, 5); f(roadDk, 0, ry + 4, W, 1); }
  for (let i = 0; i < 6; i++) { const lx = 18 + i * 56; f(road, lx, 70, 3, 18); f(road, lx + 20, 93, 3, 35); }
  /* landmark */
  if (st.landmark) { const [k, lx, ly] = st.landmark, s = A.landmark(k); x.drawImage(A.toCanvas(s), lx, ly - 24); }
  if (town === 'willowbrook') x.drawImage(A.toCanvas(A.sprites.cottage()), 146, 52);
  /* homes in three rows; the more of the town is restored, the more of them are lived in */
  const ids = Object.keys(D.PROJECTS || {}).filter(k => D.PROJECTS[k].town === town && !D.PROJECTS[k].relic), restored = ids.filter(k => (stages[k] || 0) >= 4).length;
  const lived = Math.min(1, .5 + .5 * restored / Math.max(1, ids.length)) - (st.ruined || 0) * (1 - restored / Math.max(1, ids.length));
  const blocked = (hx, w, base) => (st.landmark && hx + w > st.landmark[1] - 2 && hx < st.landmark[1] + (st.landmark[0] === 'volcano' ? 0 : 50) && base < st.landmark[2] + 40) || (town === 'willowbrook' && hx + w > 142 && hx < 196 && base < 92);
  const rows = [[84, 11, 12, 3, 8, 2, 27], [110, 9, 16, 4, 11, 3, 34], [124, 0, 0, 0, 0, 0, 0]];
  const homes = [];
  for (const [base, count, w0, wv, h0, hv, step] of rows) for (let i = 0; i < count; i++) {
    const w = w0 + Math.floor(rnd() * wv), hgt = h0 + Math.floor(rnd() * hv), hx = Math.round(4 + i * step + rnd() * (step - w - 2)), hb = base + Math.floor(rnd() * 2);
    if (hx + w > W - 2 || blocked(hx, w, hb)) continue; homes.push([hx, hb, w, hgt]); }
  /* gardens and fences in front of some homes */
  homes.forEach(([hx, hb, hw], k) => { if (k % 3 === 0) { f(mix(T.ground, '#3a2a1a', .35), hx, hb + 1, hw, 2); for (let q = 1; q < hw; q += 3) f(st.leaf, hx + q, hb + 1, 1, 1); } else if (k % 3 === 1) { for (let q = -2; q < hw + 2; q += 2) f(mix(st.walls[0], '#5a3a26', .6), hx + q, hb + 1, 1, 2); f(mix(st.walls[0], '#5a3a26', .6), hx - 2, hb + 1, hw + 4, 1); } });
  homes.sort((a, b) => a[1] - b[1]).forEach(([hx, hb, hw, hh]) => home(P, hx, hb, hw, hh, st, rnd() < lived, rnd));
  /* trees between the homes */
  for (let i = 0; i < st.trees + 4; i++) { const tx = Math.floor(rnd() * W), tb = 70 + Math.floor(rnd() * 44); if (blocked(tx - 4, 8, tb)) continue; if (st.pines) pine(P, tx, tb, 8 + Math.floor(rnd() * 6), st.leaf); else tree(P, tx, tb, 5 + Math.floor(rnd() * 4), st.leaf, rnd); }
  /* the town's trade: market stalls, carts, lanterns, banners */
  if (st.stalls) for (const sx of [60, 104, 178, 214]) { f('#7a5236', sx, 122, 16, 6); for (let k = 0; k < 4; k++) f(k % 2 ? '#f4ecd8' : '#b8483a', sx + k * 4, 117, 4, 4); f(['#e0405a', '#f0d060', '#7ab04a'][sx % 3], sx + 3, 121, 3, 1); }
  if (st.swamp || town === 'hollow') for (const lx of [24, 96, 168, 240, 300]) { f('#5a4a3a', lx, 112, 1, 14); f(st.glow, lx - 1, 110, 3, 3); }
  if (town === 'emberfall') for (const bx of [80, 150, 220, 290]) { f('#3a2420', bx, 96, 1, 22); f('#c8483c', bx + 1, 96, 5, 7); f('#ffb04a', bx + 2, 98, 2, 2); }
  if (town === 'ironpeak') for (const cx of [86, 112, 200]) { f('#6a6a74', cx, 120, 10, 5); f('#3a3a40', cx + 1, 125, 2, 2); f('#3a3a40', cx + 7, 125, 2, 2); f('#8a7a5a', cx + 2, 118, 6, 2); }
  if (town === 'skyreach') for (let k = 0; k < 30; k++) f(['#c8483c', '#f0d060', '#3f7fbf', '#7ab04a'][k % 4], 20 + k * 9, 66 + Math.round(Math.sin(k / 2) * 2), 4, 3);
  if (town === 'willowbrook' || town === 'mossbarrow') for (const [cx, cy] of [[70, 125], [250, 124]]) { f('#7a5236', cx, cy, 10, 4); f('#3a3030', cx + 1, cy + 4, 2, 2); f('#3a3030', cx + 7, cy + 4, 2, 2); f('#c8a050', cx + 1, cy - 2, 8, 2); }
  /* townsfolk on the streets */
  const people = 10 + Math.round(12 * lived);
  for (let i = 0; i < people; i++) folk(P, 8 + Math.floor(rnd() * (W - 16)), i % 2 ? 92 : 132, rnd);
  /* restoration sites along the front: a dug plot each, the piece at its stage; hidden relic sites are just grass */
  siteLayout(town).forEach(({ id, X, Y }) => {
    const pj = D.PROJECTS[id], sg = stages[id] || 0; if (pj.relic && sg < 4) return;
    ell(mix(T.ground, '#3a2a1a', sg >= 4 ? .12 : .3), X + 16, Y + 31, 14, 3);
    ell('rgba(30,40,24,.28)', X + 16, Y + 31, 10, 2);
    x.drawImage(A.toCanvas(stagePiece(pj.art || id, sg)), X, Y);
  });
  /* foreground grass tufts */
  for (let i = 0; i < 26; i++) { const gx = Math.floor(rnd() * W), gy = 168 + Math.floor(rnd() * 10); f(mix(T.ground, '#1e2a14', .35), gx, gy, 1, 2); f(mix(T.ground, '#1e2a14', .35), gx + 2, gy - 1, 1, 3); }
  return c;
}
Object.assign(A, { sceneFor, stagePiece, siteLayout, SCENE_W: W, SCENE_H: H, TOWN_STYLE: STYLE });
})();
