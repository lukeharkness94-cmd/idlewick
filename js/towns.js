/* Idlewick districts (Nov 2026): each skill gets a close-up of the part of town where it happens (districtFor,
   240 x 100), seen side-on and drawn at the same pixel scale as the hero and the tree, rock or fish they work on, so
   the town, the hero and the object agree. The towns themselves are drawn top-down in js/town_scene.js (28 Nov 2026);
   this file keeps each town's district look (STYLE), the shared scene painter and the side-on ship.
   Drawn in code in the house style; whole-pixel art. */
(() => {
const DQ = window.DQ, D = DQ.data, A = DQ.pixelArt; if (!A || !A.piece) return;
const { mix } = A, W = 640, H = 360;
const seeded = s => { let h = 2166136261; for (const c of s) h = Math.imul(h ^ c.charCodeAt(0), 16777619); return () => { h = Math.imul(h ^ (h >>> 15), 2246822507); h = Math.imul(h ^ (h >>> 13), 3266489909); h ^= h >>> 16; return (h >>> 0) / 4294967296; }; };

/* ---------- small drawing helpers on a scene canvas ---------- */
const make = (w = W, h = H) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };
const painter = (x, w = W, h = H) => {
  const f = (col, a, b, ww, hh) => { x.fillStyle = col; x.fillRect(Math.round(a), Math.round(b), Math.round(ww), Math.round(hh)); };
  const ell = (col, cx, cy, rx, ry) => { x.fillStyle = col; for (let j = -Math.ceil(ry); j <= Math.ceil(ry); j++) { const ww = Math.round(rx * Math.sqrt(Math.max(0, 1 - (j * j) / (ry * ry + .01)))); if (ww > 0) x.fillRect(Math.round(cx - ww), Math.round(cy + j), ww * 2, 1); } };
  const ridge = (col, base, amp, seed, step = 1) => { x.fillStyle = col; for (let i = 0; i < w; i += step) { const y = Math.round(base + Math.sin(i / 74 + seed) * amp + Math.sin(i / 26 + seed * 2) * amp * .35); x.fillRect(i, y, step, h - y); } };
  const tri = (col, cx, top, half, bot) => { for (let y = top; y <= bot; y++) { const ww = Math.round(half * (y - top) / Math.max(1, bot - top)); f(col, cx - ww, y, ww * 2 + 1, 1); } };
  const put = (spr, X, Y, k = 1) => x.drawImage(A.toCanvas(spr), Math.round(X), Math.round(Y), spr.w * k, spr.h * k);
  return { f, ell, ridge, tri, put, x };
};
const pick = (arr, rnd) => arr[Math.floor(rnd() * arr.length) % arr.length];
const FLOWERS = ['#f0d060', '#e0607a', '#f4f0f4', '#a07ae0'];

/* a boat seen from the side, sized by tier against the town (skiff 22 px long, galleon 62) */
const ship = (P, X, wl, tier, col, k = 1) => { const { f } = P, L = [0, 22, 34, 42, 52, 62][tier] * k, hh = [0, 5, 7, 8, 9, 10][tier] * k, hull = col, dk = mix(col, '#2a1a10', .45), lt = mix(col, '#ffffff', .22);
  for (let j = 0; j < hh; j++) { const inset = Math.round(j * j / hh * 1.6 * k + (j > hh - 3 ? k : 0)); f(j === 0 ? lt : j === 1 ? dk : hull, X + inset, wl - hh + j, L - inset * 2 + (j < 2 ? 2 * k : 0), 1); }
  f(mix(col, '#000000', .55), X + 2 * k, wl - 1, L - 4 * k, 1);
  for (let q = X + 4 * k; q < X + L - 4 * k; q += 6 * k) f(dk, q, wl - hh + 2 * k, 1, Math.max(1, hh - 4 * k));
  if (tier >= 4) for (let q = X + 8 * k; q < X + L - 8 * k; q += 7 * k) f('#2a2830', q, wl - hh + Math.round(3 * k), Math.ceil(2 * k), Math.ceil(2 * k));
  if (tier === 5) { f(dk, X + L - 14 * k, wl - hh - 5 * k, 12 * k, 5 * k); f(lt, X + L - 14 * k, wl - hh - 5 * k, 12 * k, 1); }
  if (tier === 1) { f('#8a6a42', X - 3 * k, wl - hh - 1, 1, 1); for (let q = 0; q < 8 * k; q++) f('#a8845a', X + L * .3 + q, wl - hh + 1 + q * .5, 1, 1); return; }
  const sail = '#f4ecd8', sh = '#d8ccb0', masts = tier >= 4 ? [.36, .66] : [.5], mh = [0, 0, 26, 32, 40, 48][tier] * k;
  masts.forEach((m, i) => { const mx = Math.round(X + L * m), top = wl - hh - mh + (i ? 0 : 4 * k); f('#5a3e26', mx, top, Math.ceil(k), wl - hh - top);
    if (tier === 2) { f(sail, mx - 9 * k, top + 4 * k, 18 * k, 14 * k); f(sh, mx + 1, top + 4 * k, 8 * k, 14 * k); f('#c8483a', mx - 9 * k, top + 8 * k, 18 * k, 2 * k); }
    else if (tier === 3) { for (let y = 0; y < mh - 6 * k; y++) { const ww = Math.round((y + 1) * .55); f(y % 5 === 4 ? sh : sail, mx + 1, top + 2 * k + y, ww, 1); } }
    else { for (const [o, s2] of [[3, 12], [15, 10], [26, 8]]) if (o * k + s2 * k < mh) { f(sail, mx - s2 * .8 * k, top + o * k, s2 * 1.6 * k, s2 * .8 * k); f(sh, mx + 1, top + o * k, s2 * .8 * k, s2 * .8 * k); } }
    if (tier === 5 && i) { f('#c8483c', mx + 1, top - 4 * k, 6 * k, 3 * k); f('#e6b84a', mx, top - 1, Math.ceil(k), Math.ceil(k)); } });
  f('rgba(255,255,255,.35)', X + 4 * k, wl + 1, L - 8 * k, 1);
};

/* ---------- each town's look and layout ---------- */
const STYLE = {
  willowbrook: { walls: ['#e8dcc0', '#dccca8', '#e4d4b4'], roofs: ['#c8a050', '#b8483a', '#b89048'], leaf: '#5f9a45', landmark: null, trees: 12, timber: true, carts: true },
  mossbarrow: { walls: ['#e8d8b8', '#c87a5a', '#e0ccaa'], roofs: ['#b8483a', '#a85a3a', '#c8a050'], leaf: '#6a9a4a', landmark: ['windmill', 486, 154], trees: 9, fields: true, stalls: true, timber: true, carts: true },
  saltmere: { walls: ['#eef2f4', '#dce8ee', '#e8e0d0'], roofs: ['#4a6a8a', '#3a5a7a', '#b8483a'], leaf: '#8ab06a', landmark: ['lighthouse', 540, 132], trees: 4, sea: true },
  ironpeak: { walls: ['#9aa0a8', '#8a8a90', '#a8a49c'], roofs: ['#4a5058', '#5a6068', '#3a4048'], leaf: '#3a6a4a', landmark: ['mine', 40, 154], trees: 11, snow: true, pines: true },
  gloomfen: { walls: ['#6a5a44', '#5a4a3a', '#7a6a50'], roofs: ['#4a5a3a', '#5a6a42', '#3a4a30'], leaf: '#4a6a3a', landmark: null, trees: 12, swamp: true, stilts: true, glow: '#c8f0a0' },
  emberfall: { walls: ['#6a3a32', '#7a4a3a', '#5a3028'], roofs: ['#3a2420', '#4a2a24', '#2a1a18'], leaf: '#5a4a2a', landmark: ['citadel', 56, 154], volcano: true, trees: 3, lava: true, glow: '#ffb04a' },
  skyreach: { walls: ['#f4f4f0', '#e8e4dc', '#f0ece4'], roofs: ['#c8483c', '#b83a30', '#d86a4a'], leaf: '#6aaa6a', landmark: ['monastery', 470, 150], trees: 6, clouds: true, pines: true },
  hollow: { walls: ['#4a4058', '#3a3448', '#5a4e66'], roofs: ['#2a2238', '#342a44', '#221c30'], leaf: '#4a3a5a', landmark: ['castle', 470, 150], trees: 7, stars: true, glow: '#c8a8ff', ruined: .35 }
};

/* ================= Districts: the part of town where each skill happens (240 x 100) =================
   Shown behind the activity at the same whole-pixel scale (3x) as the hero (24 x 32) and the tree, rock, fish or
   item they work on, so a door is a little taller than the hero, a tree half again as tall, a boat as long as it
   should be. The hero and the target stand at the centre (feet on y 96); the centre 120 x 84 is what a desktop
   panel shows, the sides appear on wider panels. */
const DW = 240, DH = 100;
const WATER = { gloomfen: '#3e5a4a', hollow: '#2e3a5a', emberfall: '#4a4a6a', ironpeak: '#5a8ab0', skyreach: '#6aa8d8', saltmere: '#3f7fb0' };
const TREE_OF = { willowbrook: 'normal', mossbarrow: 'oak', saltmere: 'palm', ironpeak: 'pine', gloomfen: 'gloomwood', emberfall: 'cinderbark', skyreach: 'windpine', hollow: 'wraithbark' };
const ROCK_OF = { ironpeak: '#8a909a', emberfall: '#5a4440', gloomfen: '#6a6a58', hollow: '#4a4458', skyreach: '#a8acb4' };
const DPAL = { wood: '#7a5236', woodLt: '#a8845a', woodDk: '#4a3020', stone: '#8a8478', stoneLt: '#b8b0a0', stoneDk: '#5a564e', iron: '#6a6a74', ironLt: '#9a9aa4', fire: '#ff8a3a', flame: '#ffd070' };
/* far rooftops: the rest of the town beyond the place you are working */
const backTown = (P, T, st, rnd, y0, x0 = -4, x1 = DW) => { const { f } = P;
  for (let hx = x0 + Math.floor(rnd() * 6); hx < x1; hx += 13 + Math.floor(rnd() * 9)) { const w = 9 + Math.floor(rnd() * 6), h = 5 + Math.floor(rnd() * 4), wall = mix(pick(st.walls, rnd), T.sky[2], .38), roof = mix(pick(st.roofs, rnd), T.sky[2], .38), yb = y0 + Math.floor(rnd() * 3);
    f(wall, hx, yb - h, w, h); for (let j = 0; j < 4; j++) f(roof, hx - 1 + j, yb - h - 4 + j, w + 2 - j * 2, 1); if (!st.ruined || rnd() < .5) f(mix(st.glow || '#f6d880', T.sky[2], .2), hx + 2, yb - h + 2, 2, 2);
    if (rnd() < .4) f(mix(roof, '#000000', .3), hx + w - 3, yb - h - 6, 2, 3); } };
const skyBand = (P, T, st, rnd, h = 60) => { const { f } = P; f(T.sky[0], 0, 0, DW, h * .35); f(T.sky[1], 0, h * .35, DW, h * .3); f(T.sky[2], 0, h * .65, DW, h * .35 + 40);
  if (st.stars) for (let i = 0; i < 30; i++) f(i % 4 ? '#c8c0ff' : '#ffffff', Math.floor(rnd() * DW), Math.floor(rnd() * h * .8), 1, 1);
  else for (const [cx, cy, w] of [[20, 10, 26], [150, 6, 34], [206, 16, 20]]) { const cl = mix(T.sky[0], '#ffffff', .78); f(cl, cx, cy, w, 3); f(cl, cx + 4, cy - 2, w - 8, 2); } };
const grassy = (P, T, st, rnd, y0) => { const { f } = P; f(T.ground, 0, y0, DW, DH - y0); f(mix(T.ground, '#ffffff', .18), 0, y0, DW, 1);
  for (let i = 0; i < 120; i++) f(mix(T.ground, i % 2 ? '#ffffff' : '#1e2a14', .14), Math.floor(rnd() * DW), y0 + 1 + Math.floor(rnd() * (DH - y0)), 2, 1);
  if (st.snow) for (let i = 0; i < 50; i++) f('#f4f8fc', Math.floor(rnd() * DW), y0 + Math.floor(rnd() * (DH - y0)), 2, 1);
  for (let i = 0; i < 26; i++) { const gx = Math.floor(rnd() * DW), gy = y0 + 4 + Math.floor(rnd() * (DH - y0 - 4)); f(mix(T.ground, '#1e2a14', .3), gx, gy - 2, 1, 2); f(mix(T.ground, '#1e2a14', .3), gx + 2, gy - 3, 1, 3); } };
const flagstones = (P, base, y0, rnd) => { const { f } = P; f(base, 0, y0, DW, DH - y0); f(mix(base, '#ffffff', .2), 0, y0, DW, 1);
  for (let r = 0, y = y0 + 2; y < DH; r++, y += 5) for (let q = (r % 2) * 5 - 5; q < DW; q += 10) { f(mix(base, '#000000', .22), q, y + 4, 10, 1); f(mix(base, '#000000', .22), q, y, 1, 5); if (rnd() < .3) f(mix(base, '#ffffff', .12), q + 2, y + 1, 4, 1); } };
/* a close-up building front: framed windows with lit glass and flower boxes, timber, a plank door */
const facade = (P, X, base, w, h, st, rnd, o = {}) => { const { f } = P, wall = o.wall || pick(st.walls, rnd), roof = o.roof || pick(st.roofs, rnd), top = base - h, lt = mix(wall, '#ffffff', .22), dk = mix(wall, '#000000', .2), line = mix(wall, '#3a2414', .6), frame = mix(wall, '#2a1a10', .55), glow = st.glow || '#f6d880';
  f(wall, X, top, w, h); f(lt, X, top, 1, h); f(dk, X + w - 4, top, 4, h); f(mix(wall, '#5a5048', .55), X, base - 3, w, 3);
  if (st.timber) { f(line, X, top + Math.floor(h * .45), w, 2); for (let q = X + 2; q < X + w - 2; q += 16) f(line, q, top, 2, h - 3); }
  for (let j = 0; j < 9; j++) f(j % 3 === 2 ? mix(roof, '#000000', .3) : j < 2 ? mix(roof, '#ffffff', .15) : roof, X - 3, top - 9 + j, w + 6, 1);
  f(mix(roof, '#000000', .5), X - 3, top, w + 6, 1);
  if (st.snow) f('#f4f8fc', X - 3, top - 10, w + 6, 2);
  const win = (wx, wy, ww = 9, wh = 9) => { f(frame, wx - 1, wy - 1, ww + 2, wh + 2); f(glow, wx, wy, ww, wh); f(mix(glow, '#ffffff', .5), wx, wy, Math.ceil(ww / 2), 2); f(frame, wx + Math.floor(ww / 2), wy, 1, wh); f(frame, wx, wy + Math.floor(wh / 2), ww, 1); f(lt, wx - 2, wy + wh + 1, ww + 4, 1);
    if (rnd() < .6) { f('#7a5236', wx - 1, wy + wh + 2, ww + 2, 2); for (let q = 0; q < ww; q += 2) f(pick(FLOWERS, rnd), wx + q, wy + wh + 1, 1, 1); } };
  (o.windows || []).forEach(([a, b]) => win(X + a, top + b));
  if (o.door != null) { const dx = X + o.door, dh = Math.min(20, h - 6); f(frame, dx - 1, base - dh - 2, 12, dh + 2); f(mix(roof, '#3a2416', .5), dx, base - dh - 1, 10, dh + 1); for (let q = dx + 2; q < dx + 10; q += 3) f(mix(roof, '#1e140c', .55), q, base - dh, 1, dh); f('#e6c060', dx + 8, base - Math.floor(dh / 2), 1, 1); }
  if (o.sign) { const sx = X + o.sign; f(DPAL.woodDk, sx, top + 8, 8, 1); f(DPAL.woodDk, sx + 1, top + 9, 1, 2); f(DPAL.woodDk, sx + 6, top + 9, 1, 2); f(DPAL.woodLt, sx - 1, top + 11, 10, 7); f(o.signCol || '#c8483a', sx + 2, top + 13, 4, 3); }
};
const person = (P, X, base, rnd) => { try { const look = { face: 'bright', skin: Math.floor(rnd() * 4), hair: Math.floor(rnd() * 5), tunic: pick(['#7a5a9a', '#b8483a', '#3f7fbf', '#7a9a5a', '#c89a3a'], rnd) }; P.put(A.hero(look), X, base - 32); } catch (e) { /* no townsfolk if the hero drawer is missing */ } };
const trapBig = (P, X, base) => { const { f } = P; f(DPAL.wood, X, base - 10, 16, 10); f(DPAL.woodLt, X, base - 10, 16, 1); f(DPAL.woodLt, X, base - 10, 1, 10); for (let q = X + 4; q < X + 15; q += 4) f(DPAL.woodDk, q, base - 9, 1, 9); f(DPAL.woodDk, X, base - 1, 16, 1);
  f('#1e1410', X + 15, base - 8, 2, 7); for (let j = 0; j < 9; j++) f(DPAL.woodLt, X + 17 + Math.floor(j / 3), base - 16 + j, 1, 1); f(DPAL.wood, X + 15, base - 18, 7, 2); f('#e0405a', X + 6, base - 3, 3, 2); f('#7ab04a', X + 9, base - 3, 2, 1); f('rgba(20,30,16,.3)', X - 1, base, 20, 1); };

function districtFor(town, kind, key, o = {}) {
  const T = A.TOWN[town] || A.TOWN.willowbrook, st = Object.assign({ ground: T.ground }, STYLE[town] || STYLE.willowbrook), rnd = seeded(town + kind + key);
  const c = make(DW, DH), x = c.getContext('2d'), P = painter(x, DW, DH), { f, ell, put } = P, water = WATER[town] || '#4f8fc0', road = T.path || mix(T.ground, '#d8c8a0', .45);
  const sea = (y0, col = water) => { f(col, 0, y0, DW, DH - y0); f(mix(col, '#ffffff', .25), 0, y0, DW, 1); for (let y = y0 + 3; y < DH; y += 4) f(mix(col, '#000000', (y - y0) / (DH - y0) * .25), 0, y, DW, 2); for (let i = 0; i < 40; i++) f(mix(col, '#ffffff', .4), Math.floor(rnd() * DW), y0 + 2 + Math.floor(rnd() * (DH - y0 - 2)), 3 + Math.floor(rnd() * 4), 1); };
  if (kind === 'wood') {
    skyBand(P, T, st, rnd, 66); P.ridge(T.hills[0], 50, 4, town.length); backTown(P, T, st, rnd, 66); P.ridge(T.hills[1], 66, 2, town.length + 2);
    grassy(P, T, st, rnd, 78);
    const fc = mix(st.walls[0], '#5a3a26', .6); for (let q = 0; q < DW; q += 18) { f(fc, q, 66, 2, 13); f(mix(fc, '#ffffff', .2), q, 66, 1, 13); } f(fc, 0, 69, DW, 2); f(fc, 0, 74, DW, 2);
    const tid = TREE_OF[town] || 'normal'; for (const [tx, tb] of [[10, 86], [186, 84], [212, 88]]) put(A.treeSprite(tid), tx, tb - 48);
    ell(mix(T.ground, '#6a4a2e', .45), 120, 96, 46, 5); for (let i = 0; i < 26; i++) f(i % 2 ? '#d8b878' : '#a8845a', 84 + Math.floor(rnd() * 72), 90 + Math.floor(rnd() * 9), 2, 1);
    for (let r = 0; r < 3; r++) for (let q = 0; q < 5 - r; q++) { const lx = 152 + q * 6 + r * 3, ly = 84 - r * 5; ell(DPAL.wood, lx, ly, 3, 2.6); ell('#d8b878', lx, ly, 2, 1.6); f(DPAL.woodDk, lx, ly, 1, 1); }
    f(DPAL.woodDk, 52, 84, 13, 7); f(DPAL.wood, 52, 83, 13, 2); f('#d8b878', 54, 83, 9, 1); for (let j = 0; j < 9; j++) f(DPAL.woodLt, 62 + Math.floor(j / 3), 82 - j, 1, 1); f(DPAL.iron, 63, 72, 5, 3); f(DPAL.ironLt, 63, 72, 5, 1);
  } else if (kind === 'mine') {
    skyBand(P, T, st, rnd, 60); backTown(P, T, st, rnd, 56, -4, 60);
    const rock = ROCK_OF[town] || DPAL.stone, rl = mix(rock, '#ffffff', .22), rd = mix(rock, '#000000', .25);
    const top = q => Math.round((q < 70 ? 56 - q * .5 : 22) + Math.sin(q / 9) * 3 + Math.sin(q / 4 + 1) * 1.5);
    for (let q = 0; q < DW; q++) { const t = top(q); f(rock, q, t, 1, 86 - t); f(rl, q, t, 1, 2); if (st.snow) f('#f4f8fc', q, t - 1, 1, 2); else if (q % 5 < 3) f(mix(st.leaf, rock, .3), q, t - 1, 1, 1); }
    for (let y = 30; y < 84; y += 7) for (let q = 0; q < DW; q += 2) if (y > top(q) + 4 && Math.sin(q / 11 + y) > -.4) f(rd, q, y + Math.round(Math.sin(q / 13 + y) * 1.5), 2, 1);
    for (let i = 0; i < 9; i++) { let cx = Math.floor(rnd() * DW), cy = top(cx) + 6; for (let j = 0; j < 10; j++) { f(mix(rock, '#000000', .4), cx, cy, 1, 1); cx += Math.round(rnd() * 2 - 1); cy++; } }
    f('#1a1414', 152, 58, 22, 28); ell('#1a1414', 163, 59, 11, 6); f(DPAL.wood, 149, 56, 3, 30); f(DPAL.wood, 174, 56, 3, 30); f(DPAL.woodLt, 147, 53, 32, 3); f(DPAL.woodDk, 147, 56, 32, 1);
    f('#3a2e24', 151, 60, 1, 4); f('#3a2e24', 149, 63, 5, 1); f(DPAL.flame, 149, 64, 4, 4); f('#fff0b0', 150, 65, 2, 2); ell('rgba(255,208,112,.18)', 151, 66, 6, 5);
    flagstones(P, mix(rock, road, .4), 84, rnd);
    for (let q = 140; q < DW; q += 5) f(DPAL.woodDk, q, 90, 3, 2); f('#7a7a84', 140, 89, DW - 140, 1); f('#5a5a62', 140, 90, DW - 140, 1);
    f(DPAL.iron, 188, 79, 22, 9); f(DPAL.ironLt, 188, 79, 22, 1); f(mix(DPAL.iron, '#000000', .3), 206, 80, 4, 8); for (const [ox, col] of [[192, '#b87a4a'], [198, '#8a7a5a'], [203, '#c8a050']]) ell(col, ox, 78, 3, 2.4); f('#2a2a30', 191, 88, 4, 4); f('#2a2a30', 203, 88, 4, 4);
    for (const [rx, ry, rr] of [[30, 90, 6], [42, 92, 4], [22, 94, 3]]) { ell(rd, rx, ry, rr, rr * .7); ell(rock, rx - 1, ry - 1, rr * .7, rr * .5); }
    for (let j = 0; j < 14; j++) f(DPAL.woodLt, 66 + Math.floor(j / 5), 74 + j, 1, 1); f(DPAL.iron, 62, 72, 9, 2); f(DPAL.ironLt, 62, 72, 9, 1);
  } else if (kind === 'fish' || kind === 'sail') {
    skyBand(P, T, st, rnd, 56);
    if (kind === 'fish') { P.ridge(T.hills[0], 40, 3, town.length); backTown(P, T, st, rnd, 52); f(mix(T.ground, '#f0e2b0', .5), 0, 52, DW, 3); sea(55); }
    else { sea(52, '#3f7fb0'); for (let q = 0; q < 70; q++) { const t = Math.round(34 + q * .3 + Math.sin(q / 7) * 2); f(mix(T.hills[0], '#3f7fb0', .2), DW - q, t, 1, 52 - t + 1); } backTown(P, T, st, rnd, 46, DW - 64, DW); f('#eef2f4', DW - 52, 26, 4, 16); f('#c8483c', DW - 52, 30, 4, 2); f('#c8483c', DW - 52, 36, 4, 2); f(DPAL.flame, DW - 52, 23, 4, 3);
      if (o.island && A.ISLAND && A.ISLAND[o.island]) { /* the island alone on the horizon: its card's own full-width sea and sky and the wave marks are left out */
        const s0 = A.Spr(32, 32), s = new Proxy(s0, { get: (t, k) => k === 'rect' ? (a, b, w, h, col) => (w >= 32 ? null : t.rect(a, b, w, h, col)) : k === 'line' ? (...a) => (a[5] === '#9cd0f0' ? null : t.line(...a)) : typeof t[k] === 'function' ? t[k].bind(t) : t[k] });
        A.ISLAND[o.island](s); const ic = A.toCanvas(s0); x.drawImage(ic, 0, 0, 32, 25, 64, 52 - 21, 32, 25); f(mix('#3f7fb0', '#ffffff', .45), 66, 56, 28, 1); } }
    if (kind === 'fish') {
      /* the jetty runs out to where the hero stands (left of centre); the catch is in open water at the centre */
      const J = 104; f(DPAL.woodLt, 0, 92, J, 1); f(DPAL.wood, 0, 93, J, 4); for (let q = 3; q < J; q += 6) f(DPAL.woodDk, q, 93, 1, 4); f(DPAL.woodDk, 0, 97, J, 1); f(DPAL.woodDk, J - 1, 92, 1, 6);
      for (let q = 6; q < J; q += 22) { f(DPAL.woodDk, q, 98, 3, 2); f('rgba(255,255,255,.25)', q - 2, 99, 7, 1); }
      ship(P, 160, 92, 1, '#8a6a42', 2); f(DPAL.woodDk, 150, 80, 3, 14); f(DPAL.woodLt, 150, 80, 3, 1); for (let q = 0; q < 8; q++) f('#c8b080', 152 + q, 84 + Math.round(q * .4), 1, 1);
      f(DPAL.wood, 20, 82, 11, 10); f(DPAL.woodLt, 20, 82, 11, 1); f(DPAL.woodDk, 25, 82, 1, 10); f(DPAL.wood, 33, 86, 9, 6); f(DPAL.woodLt, 33, 86, 9, 1); ell('#7a8a9a', 50, 90, 4, 2);
    } else {
      const sl = DPAL.stone; f(sl, 0, 86, 128, 14); f(DPAL.stoneLt, 0, 86, 128, 1); for (let q = 0; q < 128; q += 10) f(DPAL.stoneDk, q, 87, 1, 13); f(DPAL.stoneDk, 0, 92, 128, 1); f(DPAL.stoneDk, 127, 86, 1, 14);
      f('#3a3434', 112, 79, 6, 7); f('#5a5450', 111, 78, 8, 2);
      const t = Math.max(1, o.tier || 0), b = (D.BOATS || []).find(r => r[2] === t); if (o.tier) { ship(P, 132, 97, t, b ? b[6] : '#a07a4f', 2.2); for (let q = 0; q < 16; q++) f('#c8b080', 116 + q, 81 + Math.round(q * .5), 1, 1); }
      for (let i = 0; i < 12; i++) f('rgba(255,255,255,.35)', 130 + Math.floor(rnd() * 110), 97 + Math.floor(rnd() * 3), 4, 1);
    }
  } else if (kind === 'thieve') {
    skyBand(P, T, st, rnd, 40);
    [[-12, 70, 56, [[8, 12], [44, 12], [8, 34]], 26, 30], [60, 80, 60, [[8, 10], [62, 10], [8, 32], [62, 32]], 34, 46], [142, 70, 54, [[8, 12], [50, 12]], 30, 12], [214, 60, 58, [[10, 12], [38, 30]], 12, 30]]
      .forEach(([fx, w, h, wins, door, sign]) => facade(P, fx, 82, w, h, st, rnd, { windows: wins, door, sign, signCol: pick(['#c8483a', '#3f7fbf', '#e6b84a', '#7ab04a'], rnd) }));
    flagstones(P, mix(road, '#8a8478', .35), 82, rnd);
    for (const [sx, cols] of [[12, ['#e0405a', '#f0d060', '#7ab04a']], [180, ['#c87a3a', '#e8dcc0', '#8a6a9a']]]) {
      f(DPAL.woodDk, sx + 1, 58, 2, 30); f(DPAL.woodDk, sx + 39, 58, 2, 30);
      for (let k = 0; k < 6; k++) { const ac = k % 2 ? '#f4ecd8' : pick(['#b8483a', '#3f7fbf', '#4a8a5a'], () => sx / 300); f(ac, sx - 2 + k * 8, 52, 8, 7); f(mix(ac, '#000000', .2), sx - 2 + k * 8, 59, 8, 1); f(ac, sx + k * 8, 60, 4, 1); }
      f(DPAL.wood, sx, 78, 42, 10); f(DPAL.woodLt, sx, 78, 42, 1); for (let q = 0; q < 8; q++) ell(cols[q % 3], sx + 4 + q * 5, 76, 2.4, 2); }
    /* no bystanders: the only person in the picture is the one you are picking (owner, 26 Nov 2026: "why are there
       random characters on the skill screen previews?") */
  } else if (kind === 'train') {
    skyBand(P, T, st, rnd, 60); P.ridge(T.hills[0], 48, 4, town.length); backTown(P, T, st, rnd, 60); P.ridge(T.hills[1], 62, 2, town.length + 1);
    for (let q = -6; q < DW; q += 9) { ell(mix(st.leaf, '#000000', .25), q + 4, 70, 7, 6); ell(st.leaf, q + 3, 68, 5, 4); if (rnd() < .3) f(pick(FLOWERS, rnd), q + 2, 66, 1, 1); }
    grassy(P, T, st, rnd, 74); for (let i = 0; i < 30; i++) f(pick(FLOWERS, rnd), Math.floor(rnd() * DW), 78 + Math.floor(rnd() * 20), 1, 1);
    put(A.treeSprite(TREE_OF[town] || 'normal'), 196, 82 - 48);
    trapBig(P, 26, 92); trapBig(P, 172, 90); trapBig(P, 206, 97);
    const fc = mix(st.walls[0], '#5a3a26', .6); for (let q = 0; q < 56; q += 10) f(fc, q, 72, 2, 10); f(fc, 0, 75, 56, 1); f(fc, 0, 79, 56, 1);
  } else if (kind === 'farm') {
    /* the farm (owner, 28 Nov 2026): the barn behind the hero, the field fence, a scarecrow, and the tilled plot the hero
       hoes; the crops themselves stand on it from the live save (js/farm_scene.js), so they grow while you watch */
    skyBand(P, T, st, rnd, 62); P.ridge(T.hills[0], 52, 4, town.length); backTown(P, T, st, rnd, 64, 60); P.ridge(T.hills[1], 66, 2, town.length + 2);
    grassy(P, T, st, rnd, 78);
    const fc = mix(st.walls[0], '#5a3a26', .6); for (let q = 50; q < DW; q += 18) { f(fc, q, 68, 2, 12); f(mix(fc, '#ffffff', .2), q, 68, 1, 12); } f(fc, 50, 71, DW - 50, 2); f(fc, 50, 75, DW - 50, 1);
    /* the barn: about 5 m to the eaves at the hero's 5.3 cm a pixel would not fit, so it stands well back (smaller) */
    const barn = '#9a4a36', barnDk = mix(barn, '#000000', .3), barnLt = mix(barn, '#ffffff', .18);
    f(barn, 6, 50, 40, 32); for (let q = 8; q < 46; q += 4) f(barnDk, q, 50, 1, 32); f(barnLt, 6, 50, 40, 1);
    for (let j = 0; j < 14; j++) f(j % 3 ? '#6a4a3a' : '#7a5a46', 4 + j, 50 - j, 44 - j * 2, 1); f('#5a3a2e', 4, 50, 44, 1);
    f('#3a2420', 18, 62, 16, 20); f('#e8dcc0', 18, 62, 16, 1); for (let j = 0; j < 16; j++) { f('#e8dcc0', 18 + j, 62 + Math.round(j * 20 / 16), 1, 1); f('#e8dcc0', 33 - j, 62 + Math.round(j * 20 / 16), 1, 1); }
    f('#e8dcc0', 22, 40, 8, 6); f('#3a2420', 23, 41, 6, 4); f('#c8a050', 24, 42, 4, 2);
    /* hay at the barn door, a water butt by it */
    ell('#d8b860', 52, 82, 7, 4); ell('#f0d890', 51, 80, 5, 2); f(DPAL.woodDk, 40, 74, 7, 9); f(DPAL.wood, 40, 74, 7, 1); f('#3a4a5a', 41, 75, 5, 1); f(DPAL.iron, 40, 77, 7, 1); f(DPAL.iron, 40, 81, 7, 1);
    /* the tilled plot: ridges and furrows running away from you, darker as they go under */
    const soil = '#6e4a2e', soilDk = '#4a3020', soilLt = '#94683e';
    f(soil, 60, 84, DW - 60, DH - 84); f(soilLt, 60, 84, DW - 60, 1);
    for (let y = 86; y < DH; y += 3) { f(soilDk, 62, y, DW - 62, 1); f(soilLt, 62, y + 1, DW - 62, 1); }
    for (let i = 0; i < 40; i++) f(i % 2 ? soilLt : soilDk, 62 + Math.floor(rnd() * (DW - 64)), 85 + Math.floor(rnd() * 14), 1, 1);
    f(mix(T.ground, soil, .5), 58, 84, 3, DH - 84);
    /* the scarecrow at the far side of the plot: a cross of poles, an old coat, a straw hat (about 1.6 m, 30 px) */
    const sx = 198; f(DPAL.woodDk, sx, 56, 2, 30); f(DPAL.woodDk, sx - 8, 63, 18, 2); f('#5a6a8a', sx - 5, 62, 12, 11); f('#4a5a78', sx - 5, 72, 12, 2); f('#d8b860', sx - 8, 64, 2, 3); f('#d8b860', sx + 8, 64, 2, 3);
    ell('#e8d0a0', sx + 1, 57, 3, 3); f('#d8b860', sx - 4, 53, 10, 2); f('#c8a040', sx - 2, 50, 6, 3); f('#3a2a1e', sx, 57, 1, 1); f('#3a2a1e', sx + 2, 57, 1, 1);
  } else {
    /* workshops: cooking, smithing, crafting, carpentry, magic and the rest */
    f(T.sky[1], 0, 0, DW, 14);
    const magic = kind === 'alch' || key === 'magic' || key === 'enchanting', wallCol = magic ? '#8a8a98' : undefined;
    facade(P, -4, 84, DW + 8, 64, st, rnd, { wall: wallCol, windows: [[22, 12], magic ? [96, 8] : [210, 12]], door: 74 });
    flagstones(P, mix(road, '#8a8478', .5), 84, rnd);
    if (key === 'cooking') {
      f(DPAL.stone, 148, 44, 46, 40); f(DPAL.stoneLt, 148, 44, 46, 1); for (let y = 48; y < 84; y += 5) for (let q = 148 + (y % 10 ? 0 : 4); q < 194; q += 9) f(DPAL.stoneDk, q, y, 1, 4); for (let y = 48; y < 84; y += 5) f(DPAL.stoneDk, 148, y, 46, 1);
      f('#1e1414', 156, 60, 30, 24); ell('#1e1414', 171, 60, 15, 6); ell(DPAL.fire, 171, 81, 12, 3); ell(DPAL.flame, 171, 81, 7, 2); f('#2a2a30', 163, 68, 16, 9); f('#3a3a42', 163, 68, 16, 1); f('#2a2a30', 170, 62, 1, 6); ell('rgba(235,235,240,.6)', 168, 63, 3, 2); ell('rgba(235,235,240,.4)', 174, 57, 4, 2);
      f(DPAL.wood, 28, 40, 34, 2); for (const [jx, col] of [[30, '#c87a3a'], [38, '#e8dcc0'], [46, '#7a9a5a'], [54, '#b8483a']]) { f(col, jx, 34, 6, 6); f(mix(col, '#ffffff', .3), jx, 34, 6, 1); }
      for (const hx of [104, 112, 122]) { f(DPAL.woodDk, hx, 24, 1, 5); ell('#7ab04a', hx, 31, 2.5, 3); }
      f(DPAL.wood, 18, 80, 36, 3); f(DPAL.woodLt, 18, 80, 36, 1); f(DPAL.woodDk, 20, 83, 2, 11); f(DPAL.woodDk, 50, 83, 2, 11); ell('#e8dcc0', 28, 79, 4, 1.6); ell('#c8483a', 40, 78, 3, 2); ell('#f0d060', 45, 79, 2, 1.4);
    } else if (key === 'smithing') {
      const brick = '#8a4a3a'; f(brick, 148, 50, 48, 34); for (let y = 52; y < 84; y += 4) { f(mix(brick, '#000000', .3), 148, y, 48, 1); for (let q = 148 + (y % 8 ? 3 : 0); q < 196; q += 6) f(mix(brick, '#000000', .3), q, y, 1, 4); }
      f('#2a1a14', 154, 54, 36, 8); f(DPAL.fire, 156, 56, 32, 5); f(DPAL.flame, 160, 57, 22, 2); ell('rgba(255,160,80,.25)', 172, 54, 26, 10);
      for (let y = 22; y < 50; y++) { const w = Math.round(14 + (y - 22) * 1.1); f(DPAL.stoneDk, 172 - w, y, w * 2, 1); } f(DPAL.stoneLt, 156, 22, 32, 1);
      /* no anvil painted here: the work rig stands the real one in front of the hero at their own scale (js/work_rig.js) */
      f(DPAL.woodDk, 30, 80, 10, 12); f(DPAL.wood, 30, 80, 10, 1); f('#3a4a5a', 31, 81, 8, 2);
      f(DPAL.woodDk, 204, 76, 14, 18); f(DPAL.wood, 204, 76, 14, 1); f('#3a4a5a', 205, 77, 12, 2); f(DPAL.iron, 204, 82, 14, 1); f(DPAL.iron, 204, 89, 14, 1);
      f(DPAL.woodDk, 18, 34, 34, 2); for (const tx of [22, 30, 38, 46]) { f(DPAL.iron, tx, 36, 1, 10); f(DPAL.ironLt, tx - 1, 46, 3, 2); }
    } else if (key === 'carpentry') {
      for (const lx of [152, 182]) { for (let j = 0; j < 14; j++) { f(DPAL.woodDk, lx - 3 + Math.floor(j / 2), 82 + j * .9 - 12, 1, 1); f(DPAL.woodDk, lx + 3 - Math.floor(j / 2), 82 + j * .9 - 12, 1, 1); } }
      f('#d8b878', 142, 70, 56, 4); f('#f0d8a0', 142, 70, 56, 1); f('#a8845a', 142, 73, 56, 1); f(DPAL.iron, 176, 62, 2, 9); f('#c8a070', 170, 60, 10, 3);
      for (let k = 0; k < 4; k++) for (let j = 0; j < 40; j++) f(k % 2 ? '#d8b878' : '#c8a060', 204 + k * 4 + Math.floor(j / 6), 44 + j, 3, 1);
      for (let i = 0; i < 40; i++) f(i % 2 ? '#f0d8a0' : '#d8b878', 136 + Math.floor(rnd() * 70), 86 + Math.floor(rnd() * 12), 1, 1);
      f(DPAL.woodDk, 24, 34, 30, 2); f(DPAL.iron, 26, 37, 14, 5); f(DPAL.ironLt, 26, 37, 14, 1); f(DPAL.wood, 40, 36, 5, 6); f(DPAL.wood, 46, 36, 2, 10);
    } else if (magic) {
      for (const [bx, w] of [[18, 34]]) { f(DPAL.woodDk, bx, 30, w, 54); for (let y = 32; y < 82; y += 10) { f(DPAL.wood, bx + 2, y + 8, w - 4, 2); for (let q = bx + 3; q < bx + w - 3; q += 3) f(pick(['#b8483a', '#3f7fbf', '#7a9a5a', '#c89a3a', '#7a5a9a'], rnd), q, y + 1, 2, 7); } }
      ell('rgba(160,180,255,.18)', 120, 94, 52, 5); for (let i = 0; i < 20; i++) { const a = i / 20 * Math.PI * 2; f('#b8c8ff', Math.round(120 + Math.cos(a) * 48), Math.round(94 + Math.sin(a) * 4), 2, 1); }
      for (let i = 0; i < 12; i++) f(i % 2 ? '#e0d0ff' : '#b8c8ff', 60 + Math.floor(rnd() * 140), 20 + Math.floor(rnd() * 50), 1, 1);
      f('#3a3448', 160, 70, 26, 14); f('#4a4458', 160, 70, 26, 1); ell('#7a5ae0', 173, 68, 5, 3); ell('#c8b0ff', 172, 67, 2, 1);
    } else {
      f(DPAL.wood, 146, 72, 56, 4); f(DPAL.woodLt, 146, 72, 56, 1); f(DPAL.woodDk, 148, 76, 3, 16); f(DPAL.woodDk, 197, 76, 3, 16);
      f('#a0683a', 152, 68, 14, 4); f(mix('#a0683a', '#ffffff', .25), 152, 68, 14, 1); for (const [sx, col] of [[172, '#e8dcc0'], [180, '#3f7fbf'], [188, '#c8483a']]) { ell(col, sx, 69, 2.6, 3); f(DPAL.woodDk, sx - 1, 66, 3, 1); }
      f(DPAL.woodDk, 22, 28, 2, 34); f(DPAL.woodDk, 52, 28, 2, 34); f(DPAL.woodDk, 22, 28, 32, 2); f(DPAL.woodDk, 22, 60, 32, 2); f('#c89a6a', 25, 31, 26, 28); f(mix('#c89a6a', '#000000', .15), 38, 31, 13, 28);
      for (const bx of [110, 124]) { f(DPAL.woodDk, bx + 3, 24, 1, 4); ell('#8a6a42', bx + 3, 33, 4, 5); }
    }
  }
  return c;
}
Object.assign(A, { TOWN_STYLE: STYLE, townPainter: painter, townShip: ship, townSeeded: seeded, townMake: make, districtFor, DISTRICT_W: DW, DISTRICT_H: DH });
})();
