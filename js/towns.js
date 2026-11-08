/* Idlewick towns (Nov 2026): every town is a wide, lived-in place drawn at 640 x 360, with everything in it to one
   scale: townsfolk about 10 px tall, homes two to three times that, the restoration sites (32 x 32 pieces) the size
   of a building, your boats moored at Saltmere and your traps at the meadow's edge sized against them. Rows of homes
   with lit windows and chimney smoke, streets with townsfolk, each region's own landmark and trade, and the
   restoration sites among the homes. Each site shows its project as a ruin, then building up in stages as materials
   are delivered, then restored; the more of a town is restored, the more of its homes are lived in again.
   Each skill also gets a close-up of the part of town where it happens (districtFor, 240 x 100), drawn at the same
   pixel scale as the hero and the tree, rock or fish they work on, so the town, the hero and the object agree.
   Drawn in code in the house style; whole-pixel art. */
(() => {
const DQ = window.DQ, D = DQ.data, A = DQ.pixelArt; if (!A || !A.piece) return;
const { mix } = A, W = 640, H = 360;
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

/* a home (town scale): 22 to 36 px wide; framed windows, shutters and flower boxes, a door with a step, tiled roof,
   chimney smoke when lived in; boarded windows and doors when not. Top-left light. */
const home = (P, X, base, w, h, st, lived, rnd) => {
  const { f } = P, wall = pick(st.walls, rnd), roof = pick(st.roofs, rnd), top = base - h;
  const lt = mix(wall, '#ffffff', .25), dk = mix(wall, '#000000', .2), line = mix(wall, '#3a2414', .6), frame = mix(wall, '#2a1a10', .5);
  if (st.stilts) for (const px of [X + 2, X + w - 4]) { f(mix(st.ground, '#000000', .5), px, base, 2, 9); f(mix(st.ground, '#000000', .35), px, base + 3, w - 4, 1); }
  f(wall, X, top, w, h); f(lt, X, top, 1, h); f(dk, X + Math.ceil(w * .68), top, Math.floor(w * .32), h);
  f(mix(wall, '#5a5048', .55), X, base - 2, w, 2);
  if (st.timber && rnd() < .6) { f(line, X, top, w, 1); f(line, X, top + Math.floor(h / 2), w, 1); for (let q = X; q < X + w - 2; q += Math.max(7, Math.floor(w / 3))) f(line, q, top, 1, h - 2); f(line, X + w - 1, top, 1, h - 2); }
  const rh = Math.max(7, Math.round(w / 2.3));
  for (let j = 0; j < rh; j++) { const inset = Math.round((rh - 1 - j) * (w / 2 + 2) / rh), a = X - 2 + inset, b = X + w + 2 - inset; if (b <= a) continue; const mid = Math.round((a + b) / 2), band = j % 3 === 2 ? .12 : 0;
    f(mix(roof, '#ffffff', .14 - band), a, top - rh + j, mid - a, 1); f(mix(roof, '#000000', .2 + band), mid, top - rh + j, b - mid, 1); }
  f(mix(roof, '#000000', .45), X - 2, top - 1, w + 4, 1);
  if (st.snow) { const m = X + Math.floor(w / 2); f('#f4f8fc', m - 4, top - rh, 8, 2); f('#f4f8fc', X - 2, top - 2, w + 4, 1); }
  /* missing tiles on an empty house */
  if (!lived) { f(mix(roof, '#000000', .55), X + Math.floor(w * .55), top - Math.floor(rh * .6), 3, 2); }
  const glow = st.glow || '#f6d880', win = (wx, wy) => {
    f(frame, wx - 1, wy - 1, 6, 6); f(lived ? glow : '#2a2830', wx, wy, 4, 4);
    if (lived) { f(mix(glow, '#ffffff', .45), wx, wy, 2, 1); f(frame, wx + 2, wy, 1, 4); f(frame, wx, wy + 2, 4, 1); if (rnd() < .5) { f(pick(['#4a6a9a', '#9a4a3a', '#4a7a4a'], rnd), wx - 2, wy, 1, 4); f(pick(['#4a6a9a', '#9a4a3a', '#4a7a4a'], rnd), wx + 5, wy, 1, 4); } if (rnd() < .45) { f('#7a5236', wx - 1, wy + 5, 6, 1); f(pick(FLOWERS, rnd), wx, wy + 4, 1, 1); f(pick(FLOWERS, rnd), wx + 3, wy + 4, 1, 1); } }
    else { f('#7a5a3a', wx - 1, wy + 1, 6, 1); f('#7a5a3a', wx - 1, wy + 3, 6, 1); }
    f(lt, wx - 1, wy + 5, 6, 1); };
  const dw = 5, dh = Math.min(9, h - 4), dx = w >= 26 ? X + Math.floor(w / 2) - 2 : X + w - 9;
  if (w >= 26) { win(X + 4, top + 4); win(X + w - 9, top + 4); } else win(X + 3, top + 4);
  f(frame, dx - 1, base - dh - 1, dw + 2, dh + 1); f(lived ? mix(roof, '#3a2416', .45) : '#2e2828', dx, base - dh, dw, dh);
  if (lived) f('#e6c060', dx + 3, base - Math.ceil(dh / 2), 1, 1); else { f('#6a4a30', dx - 1, base - dh + 2, dw + 2, 1); f('#6a4a30', dx - 1, base - 3, dw + 2, 1); }
  f(mix(wall, '#8a8478', .5), dx - 1, base, dw + 2, 1);
  if (rnd() < .75) { const cx = X + (rnd() < .5 ? 3 : w - 7), cy = top - Math.round(rh * .75); f(mix(st.walls[0], '#3a2e28', .55), cx, cy, 4, top - cy - 1); f(mix(st.walls[0], '#1e1a18', .6), cx - 1, cy - 1, 6, 2);
    if (lived) for (let k = 0; k < 4; k++) P.ell(`rgba(232,232,236,${.75 - k * .16})`, cx + 2 + k * 2, cy - 4 - k * 5, 2 + k * .6, 1.6 + k * .4); }
};
/* trees at town scale: 14 to 28 px */
const tree = (P, X, base, size, leaf, rnd) => { const { f, ell } = P; f(mix(leaf, '#3a2414', .7), X - 1, base - size * .55, 3, size * .55); ell(mix(leaf, '#000000', .22), X + 1, base - size * .62, size * .5, size * .38); ell(leaf, X, base - size * .7, size * .42, size * .32); ell(mix(leaf, '#ffffff', .22), X - size * .12, base - size * .8, size * .2, size * .14); if (rnd() < .3) f(mix(leaf, '#000000', .3), X - 4, base, 9, 1); };
const pine = (P, X, base, size, leaf) => { const { f } = P; f('#4a3424', X, base - 4, 2, 4); for (let j = 0; j < size; j++) { const w = Math.round((j + 2) * .42); f(j % 4 === 0 ? mix(leaf, '#ffffff', .18) : j % 4 === 3 ? mix(leaf, '#000000', .18) : leaf, X + 1 - w, base - 4 - size + j, w * 2, 1); } };
/* a townsperson (5 x 10): hair, face, clothes, legs; some carry a basket */
const folk = (P, X, Y, rnd) => { const { f } = P, cloth = pick(['#3f7fbf', '#b8483a', '#7a9a5a', '#c89a3a', '#7a5a9a', '#6a6a74', '#c87a8a'], rnd), hair = pick(['#3a2414', '#7a4a24', '#d8b060', '#2a2a2a', '#a8a8a8'], rnd);
  f('#e0b088', X + 1, Y - 10, 3, 3); f(hair, X + 1, Y - 10, 3, 1); f(cloth, X, Y - 7, 5, 4); f(mix(cloth, '#000000', .25), X + 3, Y - 7, 2, 4); f(mix(cloth, '#ffffff', .2), X, Y - 7, 1, 3);
  f('#3a3030', X + 1, Y - 3, 1, 3); f('#3a3030', X + 3, Y - 3, 1, 3); if (rnd() < .25) { f('#a07a4a', X + 5, Y - 5, 3, 2); f('#c8483a', X + 5, Y - 6, 1, 1); } };
const chicken = (P, X, Y) => { P.f('#f4f0e8', X, Y - 2, 3, 2); P.f('#e04030', X + 2, Y - 3, 1, 1); P.f('#e0a030', X + 3, Y - 2, 1, 1); };
const dog = (P, X, Y, col) => { const { f } = P; f(col, X, Y - 4, 6, 2); f(col, X + 5, Y - 6, 2, 3); f(mix(col, '#000000', .3), X + 6, Y - 6, 1, 1); f(col, X, Y - 2, 1, 2); f(col, X + 5, Y - 2, 1, 2); f(col, X - 1, Y - 5, 1, 1); };
/* a trap at town scale (8 x 6): wooden box, the door propped on a stick, a bit of bait */
const trapSmall = (P, X, Y) => { const { f } = P; f('#8a6a42', X, Y - 5, 8, 5); f('#a8845a', X, Y - 5, 8, 1); f('#5a3e26', X + 7, Y - 5, 1, 5); f('#6a4a2e', X + 2, Y - 3, 1, 3); f('#6a4a2e', X + 5, Y - 3, 1, 3); f('#c8a070', X + 8, Y - 8, 1, 6); f('#a8845a', X + 8, Y - 9, 3, 1); f('#e0405a', X + 9, Y - 1, 1, 1); };
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

/* where each restoration site stands in a town scene (32 x 32 each, in scene pixels): among the homes, alternating
   between the middle street and the front; the Projects page puts a clickable spot over each one */
const siteLayout = town => { const sites = Object.keys(D.PROJECTS || {}).filter(k => D.PROJECTS[k].town === town), n = sites.length, gap = (W - 40) / Math.max(1, n);
  return sites.map((id, i) => ({ id, i, X: Math.round(20 + gap * (i + .5) - 16), Y: i % 2 ? 254 : 198 })).sort((a, b) => a.Y - b.Y); };
/* extras: what you have built or laid elsewhere that belongs in the town (boats, traps, the cottage's crops) */
function sceneFor(town, stages = {}, extras = {}) {
  const T = A.TOWN[town] || A.TOWN.willowbrook, st = Object.assign({ ground: T.ground }, STYLE[town] || STYLE.willowbrook), rnd = seeded(town);
  const c = make(), x = c.getContext('2d'), P = painter(x), { f, ell, ridge, put } = P;
  /* sky */
  f(T.sky[0], 0, 0, W, 30); f(T.sky[1], 0, 30, W, 28); f(T.sky[2], 0, 58, W, 50);
  if (st.stars) for (let i = 0; i < 90; i++) f(i % 5 ? '#c8c0ff' : '#ffffff', Math.floor(rnd() * W), Math.floor(rnd() * 80), 1, 1);
  else for (const [cx, cy, w] of [[60, 16, 52], [300, 10, 68], [500, 22, 44], [600, 8, 30]]) { const cl = mix(T.sky[0], '#ffffff', .78); f(cl, cx, cy, w, 5); f(cl, cx + 8, cy - 4, w - 16, 4); f(mix(T.sky[0], '#ffffff', .55), cx + 4, cy + 5, w - 8, 1); }
  if (st.volcano) put(A.landmark('volcano'), 400, 0, 3);
  /* far and near hills, with distant homes on the ridge */
  ridge(T.hills[0], st.snow ? 60 : 76, st.snow ? 18 : 8, town.length);
  if (st.snow) for (let i = 0; i < W; i++) { const y = Math.round(60 + Math.sin(i / 74 + town.length) * 18 + Math.sin(i / 26 + town.length * 2) * 6.3); f('#ffffff', i, y, 1, 3); }
  const farBase = st.snow ? 60 : 76, farAmp = st.snow ? 18 : 8, farY = i => farBase + Math.sin(i / 74 + town.length) * farAmp + Math.sin(i / 26 + town.length * 2) * farAmp * .35;
  for (let i = 0; i < 12; i++) { const hx = 10 + i * 53 + Math.floor(rnd() * 20), hy = Math.round(Math.max(farY(hx), farY(hx + 10)) + 5 + rnd() * 4); f(mix(st.walls[0], T.hills[0], .45), hx, hy, 10, 7); f(mix(st.roofs[0], T.hills[0], .45), hx - 1, hy - 3, 12, 3); if (!st.ruined || i % 2) f(st.glow || '#f6d880', hx + 3, hy + 2, 2, 2); }
  ridge(T.hills[1], 102, 6, town.length + 3);
  /* ground and water */
  f(T.ground, 0, 110, W, H - 110);
  for (let i = 0; i < 900; i++) f(mix(T.ground, i % 2 ? '#ffffff' : '#000000', .1), Math.floor(rnd() * W), 110 + Math.floor(rnd() * 250), 2, 1);
  if (st.snow) for (let i = 0; i < 260; i++) f('#f4f8fc', Math.floor(rnd() * W), 110 + Math.floor(rnd() * 250), 2, 1);
  if (st.sea) { f('#4f8fc0', 0, 80, W, 44); f('#5f9fcc', 0, 90, W, 5); for (let i = 0; i < 50; i++) f('#e8f6ff', Math.floor(rnd() * W), 84 + Math.floor(rnd() * 36), 6, 1); f('#f0e2b0', 0, 122, W, 10); f('#d8c890', 0, 131, W, 2);
    for (const [bx, by, t] of [[70, 104, 2], [220, 96, 3], [360, 110, 1]]) ship(P, bx, by, t, '#7a5236'); }
  if (st.clouds) for (const [cx, cy, w] of [[0, 120, 120], [180, 128, 140], [400, 118, 180]]) { f('#f6fbfc', cx, cy, w, 9); f('#f6fbfc', cx + 12, cy - 5, w - 24, 5); }
  if (st.fields) for (let r = 0; r < 6; r++) { f(r % 2 ? '#c8b058' : '#8aa850', 0, 112 + r * 4, 240, 3); f(r % 2 ? '#d8c068' : '#9ab860', 440, 112 + r * 4, 200, 3); }
  if (st.swamp) for (const [px, py, rx] of [[120, 196, 50], [520, 168, 56], [330, 272, 40]]) { ell('#3a4a3a', px, py, rx, 7); ell('#4a5a4a', px - 8, py - 2, rx * .5, 2.5); for (let k = 0; k < 4; k++) f('#5a8a4a', px - rx * .6 + k * rx * .4, py - 1, 3, 1); }
  if (st.lava) { f('#e8583a', 0, 128, W, 4); f('#ffb04a', 0, 128, W, 1); for (let i = 0; i < 20; i++) f('#ff8a3a', Math.floor(rnd() * W), 130 + Math.floor(rnd() * 3), 5, 1); }
  /* streets: two long roads and the lanes between them */
  const road = T.path || mix(T.ground, '#d8c8a0', .45), roadDk = mix(road, '#000000', .14), roadLt = mix(road, '#ffffff', .16);
  for (const ry of [154, 236]) { f(road, 0, ry, W, 9); f(roadDk, 0, ry + 8, W, 1); f(roadLt, 0, ry, W, 1); for (let i = 0; i < 70; i++) f(roadDk, Math.floor(rnd() * W), ry + 2 + Math.floor(rnd() * 5), 2, 1); }
  for (let i = 0; i < 6; i++) { const lx = 36 + i * 112; f(road, lx, 132, 5, 22); f(road, lx + 40, 163, 5, 73); f(road, lx + 70, 245, 5, 76); }
  /* a small square with a fountain or a well-worn green in the middle of the town */
  ell(mix(road, '#ffffff', .06), 320, 200, 34, 9);
  /* landmark (a landmark is a big building: drawn at twice its sprite size so it stands two to three homes tall) */
  const lm = st.landmark, LMK = 2;
  if (lm) { const s = A.landmark(lm[0]); if (lm[0] === 'lighthouse') { ell('#7a746a', lm[1] + 48, lm[2] - 2, 26, 6); ell('#9a9488', lm[1] + 44, lm[2] - 4, 18, 3); } put(s, lm[1], lm[2] - s.h * LMK, LMK); }
  const cottage = town === 'willowbrook' ? [296, 156] : null;
  if (cottage) { const s = A.sprites.cottage(); put(s, cottage[0], cottage[1] - s.h); if (extras.farm) for (let r = 0; r < 4; r++) { f('#6a4a2e', 350, 140 + r * 4, 34, 3); for (let q = 0; q < 8; q++) f(r % 2 ? '#7ab04a' : '#5f9a45', 352 + q * 4, 140 + r * 4, 2, 2); } }
  /* homes in rows among the restoration sites; the more of the town is restored, the more of them are lived in */
  const ids = Object.keys(D.PROJECTS || {}).filter(k => D.PROJECTS[k].town === town && !D.PROJECTS[k].relic), restored = ids.filter(k => (stages[k] || 0) >= 4).length;
  const lived = Math.min(1, .5 + .5 * restored / Math.max(1, ids.length)) - (st.ruined || 0) * (1 - restored / Math.max(1, ids.length));
  const sites = siteLayout(town);
  const hit = (a0, a1, b0, b1, c0, c1, d0, d1) => a0 < c1 && a1 > c0 && b0 < d1 && b1 > d0;
  const blocked = (hx, w, base, h = 34) => (lm && hit(hx, hx + w, base - h, base, lm[1] - 4, lm[1] + 100, lm[2] - 96, lm[2]))
    || (cottage && hit(hx, hx + w, base - h, base, cottage[0] - 6, cottage[0] + 92, cottage[1] - 42, cottage[1] + 2))
    || sites.some(s => hit(hx, hx + w, base - h, base, s.X - 6, s.X + 38, s.Y - 4, s.Y + 34))
    || hit(hx, hx + w, base - h, base, 288, 352, 178, 214);
  const homes = [];
  for (const [base, step] of [[150, 40], [192, 46], [230, 44], [284, 48], [318, 54]]) for (let i = 0; i * step < W; i++) {
    const w = 22 + Math.floor(rnd() * 14), hgt = 14 + Math.floor(rnd() * 6), hx = Math.round(6 + i * step + rnd() * (step - w - 6)), hb = base + Math.floor(rnd() * 2);
    if (hx + w > W - 4 || blocked(hx - 2, w + 4, hb)) continue; homes.push([hx, hb, w, hgt]); }
  /* gardens and fences in front of some homes */
  homes.forEach(([hx, hb, hw], k) => { if (k % 3 === 0) { f(mix(T.ground, '#3a2a1a', .35), hx, hb + 1, hw, 3); for (let q = 1; q < hw; q += 3) f(k % 2 ? st.leaf : pick(FLOWERS, rnd), hx + q, hb + 1, 2, 1); } else if (k % 3 === 1) { const fc = mix(st.walls[0], '#5a3a26', .6); for (let q = -3; q < hw + 3; q += 3) f(fc, hx + q, hb + 1, 1, 3); f(fc, hx - 3, hb + 2, hw + 6, 1); } });
  homes.sort((a, b) => a[1] - b[1]).forEach(([hx, hb, hw, hh]) => home(P, hx, hb, hw, hh, st, rnd() < lived, rnd));
  /* trees between the homes and along the edges */
  for (let i = 0; i < st.trees + 16; i++) { const tx = Math.floor(rnd() * W), tb = 132 + Math.floor(rnd() * 190); if (blocked(tx - 8, 16, tb, 26)) continue; if (st.pines) pine(P, tx, tb, 16 + Math.floor(rnd() * 12), st.leaf); else tree(P, tx, tb, 16 + Math.floor(rnd() * 10), st.leaf, rnd); }
  /* the town's trade: market stalls, carts, lanterns, banners */
  const clear = (sx, w, base) => !blocked(sx, w, base, 26);
  if (st.stalls) for (const sx of [292, 330]) { f('#7a5236', sx, 214, 26, 8); f('#5a3a26', sx, 221, 26, 1); f('#5a3a26', sx + 1, 202, 2, 12); f('#5a3a26', sx + 23, 202, 2, 12); for (let k = 0; k < 4; k++) f(k % 2 ? '#f4ecd8' : '#b8483a', sx - 1 + k * 7, 198, 7, 6); for (let k = 0; k < 5; k++) f(pick(['#e0405a', '#f0d060', '#7ab04a', '#c87a3a'], rnd), sx + 3 + k * 4, 212, 3, 2); }
  else { ell(mix(st.walls[0], '#5a5048', .5), 320, 200, 10, 3); f(mix(st.walls[0], '#5a5048', .4), 316, 190, 8, 9); f('#6aa8d8', 317, 191, 6, 2); f(mix(st.walls[0], '#5a5048', .3), 319, 184, 2, 6); f('#9cd0f0', 318, 182, 4, 2); }
  if (st.swamp || town === 'hollow') for (const lx of [50, 190, 270, 470, 610]) if (clear(lx - 4, 10, 246)) { f('#5a4a3a', lx, 220, 2, 26); f('#3a2e24', lx - 2, 218, 6, 2); f(st.glow, lx - 2, 212, 6, 6); f(mix(st.glow, '#ffffff', .5), lx - 1, 213, 2, 2); }
  if (town === 'emberfall') for (const bx of [170, 300, 440, 580]) if (clear(bx, 14, 236)) { f('#3a2420', bx, 190, 2, 46); f('#c8483c', bx + 2, 192, 10, 16); f('#8a2a24', bx + 9, 192, 3, 16); f('#ffb04a', bx + 5, 197, 4, 4); }
  if (town === 'ironpeak') for (const cx of [172, 226, 400]) if (clear(cx, 22, 248)) { f('#6a6a74', cx, 237, 20, 9); f('#8a8a94', cx, 237, 20, 1); f('#3a3a40', cx + 2, 246, 4, 4); f('#3a3a40', cx + 14, 246, 4, 4); f('#8a7a5a', cx + 3, 234, 6, 3); f('#b87a4a', cx + 10, 233, 6, 4); }
  if (town === 'skyreach') for (let k = 0; k < 44; k++) f(['#c8483c', '#f0d060', '#3f7fbf', '#7ab04a'][k % 4], 10 + k * 14, 116 + Math.round(Math.sin(k / 2.2) * 3), 6, 5);
  if (st.carts) for (const [cx, cy] of [[140, 250], [500, 248]]) if (clear(cx, 24, cy)) { f('#7a5236', cx, cy - 8, 20, 7); f('#5a3a26', cx, cy - 2, 20, 1); f('#3a3030', cx + 2, cy - 1, 4, 4); f('#3a3030', cx + 14, cy - 1, 4, 4); f('#d8b860', cx + 1, cy - 12, 18, 4); f('#c8a050', cx + 3, cy - 14, 13, 2); f('#5a3a26', cx + 20, cy - 6, 6, 1); }
  /* townsfolk on the streets, and a few animals */
  const people = 14 + Math.round(20 * lived);
  for (let i = 0; i < people; i++) folk(P, 8 + Math.floor(rnd() * (W - 16)), [162, 244, 200][i % 3] + (i % 3 === 2 ? Math.floor(rnd() * 6) : 0), rnd);
  if (!st.ruined) { for (let i = 0; i < 6; i++) chicken(P, 20 + Math.floor(rnd() * (W - 40)), 290 + Math.floor(rnd() * 24)); dog(P, 30 + Math.floor(rnd() * 560), 164, '#8a6a42'); }
  /* restoration sites: a dug plot each, the piece at its stage; hidden relic sites are just grass */
  sites.forEach(({ id, X, Y }) => {
    const pj = D.PROJECTS[id], sg = stages[id] || 0; if (pj.relic && sg < 4) return;
    ell(mix(T.ground, '#3a2a1a', sg >= 4 ? .12 : .3), X + 16, Y + 31, 17, 3);
    ell('rgba(30,40,24,.28)', X + 16, Y + 31, 12, 2);
    put(stagePiece(pj.art || id, sg), X, Y);
    if (sg > 0 && sg < 4) { folk(P, X - 4, Y + 32, rnd); f('#a8845a', X - 1, Y + 24, 1, 6); }
  });
  /* the front: a quay with your boats at Saltmere, otherwise the meadow's edge (where your traps are laid) */
  if (st.sea) { f('#8a8478', 0, 322, W, 6); f('#b8b0a0', 0, 322, W, 1); for (let q = 0; q < W; q += 12) f('#6a6458', q, 323, 1, 5); f('#3f7fb8', 0, 328, W, H - 328); for (let i = 0; i < 70; i++) f('#9cd0f0', Math.floor(rnd() * W), 332 + Math.floor(rnd() * 28), 5, 1);
    let bx = 18; for (const t of (extras.boats || [])) { const b = (D.BOATS || []).find(r => r[2] === t); ship(P, bx, 344, t, b ? b[6] : '#a07a4f'); f('#5a4a3a', bx - 4, 326, 2, 18); bx += [0, 22, 34, 42, 52, 62][t] + 18; }
    if (!(extras.boats || []).length) ship(P, 40, 344, 1, '#8a6a42'); }
  else { for (let i = 0; i < 40; i++) { const gx = Math.floor(rnd() * W), gy = 326 + Math.floor(rnd() * 30); f(mix(T.ground, '#1e2a14', .35), gx, gy, 1, 3); f(mix(T.ground, '#1e2a14', .35), gx + 2, gy - 1, 1, 4); }
    for (let i = 0; i < 26; i++) f(pick(FLOWERS, rnd), Math.floor(rnd() * W), 330 + Math.floor(rnd() * 26), 2, 2);
    const fc = mix(st.walls[0], '#5a3a26', .6); for (const [a, b] of [[0, 90], [560, 640]]) { for (let q = a; q < b; q += 8) f(fc, q, 330, 2, 9); f(fc, a, 332, b - a, 1); f(fc, a, 336, b - a, 1); } }
  if (extras.traps) for (const [tx, ty] of st.sea ? [[574, 327], [600, 327], [622, 327]] : [[200, 346], [330, 352], [456, 344]]) { if (st.sea) f('#8a8478', tx - 2, ty - 1, 12, 1); trapSmall(P, tx, ty); }
  /* foreground: big trees framing the edges (nearer, so larger) */
  if (!st.sea) for (const [tx, sz] of [[8, 46], [W - 10, 40]]) { if (st.pines) pine(P, tx, H + 2, sz, mix(st.leaf, '#000000', .1)); else tree(P, tx, H + 4, sz, mix(st.leaf, '#000000', .1), rnd); }
  return c;
}

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
    person(P, 64, 84, rnd); person(P, 196, 86, rnd);
  } else if (kind === 'train') {
    skyBand(P, T, st, rnd, 60); P.ridge(T.hills[0], 48, 4, town.length); backTown(P, T, st, rnd, 60); P.ridge(T.hills[1], 62, 2, town.length + 1);
    for (let q = -6; q < DW; q += 9) { ell(mix(st.leaf, '#000000', .25), q + 4, 70, 7, 6); ell(st.leaf, q + 3, 68, 5, 4); if (rnd() < .3) f(pick(FLOWERS, rnd), q + 2, 66, 1, 1); }
    grassy(P, T, st, rnd, 74); for (let i = 0; i < 30; i++) f(pick(FLOWERS, rnd), Math.floor(rnd() * DW), 78 + Math.floor(rnd() * 20), 1, 1);
    put(A.treeSprite(TREE_OF[town] || 'normal'), 196, 82 - 48);
    trapBig(P, 26, 92); trapBig(P, 172, 90); trapBig(P, 206, 97);
    const fc = mix(st.walls[0], '#5a3a26', .6); for (let q = 0; q < 56; q += 10) f(fc, q, 72, 2, 10); f(fc, 0, 75, 56, 1); f(fc, 0, 79, 56, 1);
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
      f(DPAL.woodDk, 54, 84, 12, 8); f(DPAL.wood, 54, 84, 12, 1); f(DPAL.iron, 48, 77, 24, 4); f(DPAL.ironLt, 48, 77, 24, 1); for (let j = 0; j < 4; j++) f(DPAL.iron, 44 + j, 78 + j * .3, 4 - j, 1); f(DPAL.iron, 55, 81, 10, 3);
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
Object.assign(A, { sceneFor, stagePiece, siteLayout, SCENE_W: W, SCENE_H: H, TOWN_STYLE: STYLE, townPainter: painter, townHome: home, townShip: ship, townSeeded: seeded, townMake: make, districtFor, DISTRICT_W: DW, DISTRICT_H: DH });
})();
