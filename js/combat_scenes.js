/* Combat scenes (owner, 28 Nov 2026: the fight should look like the approved pixel mockup): every combat area gets a
   layered scene painted in code at 480 x 270 (shown 4x behind the fight stage, anchored at the bottom): a sky with
   stars or sun, two or three silhouette layers with a lit rim, the region's own landmark (windmill, lighthouse, mine
   timbers, volcano, monastery, castle...) and a solid ground band from row G, where the fighters' feet land, with tufts,
   stones and the area's own detail. Everything goes through backdrop.js (DQ.registerBackdrop), so the shared dusk
   grade and the cache still apply. Original art drawn in code; nothing here is an image file. */
(() => {
  const DQ = window.DQ; if (!DQ || !DQ.registerBackdrop) return;
  const G = 238;                                   /* the fighters' ground line (their feet land on rows ~240-250) */

  /* ---------- painters (each gets the backdrop.js toolkit: px, pine, rnd, W, H) ---------- */
  const ground = (t, o) => { const { px, rnd, W, H } = t;
    for (let y = G; y < H; y++) { const k = (y - G) / (H - G); px(0, y, W, 1, k < .5 ? o.mid : o.dark); }
    for (let y = G + 10; y < H; y += 2) for (let x = (y / 2) % 4; x < W; x += 4) px(x, y, 1, 1, o.dark);          /* dither into the dark */
    px(0, G, W, 1, o.top); px(0, G + 1, W, 1, o.mid);
    for (let x = 0; x < W; x += 2) if (rnd() < .55) px(x, G - 1, 1, 1, o.top);                                  /* a ragged lit edge */
    for (let i = 0; i < (o.tufts ?? 60); i++) { const x = rnd() * W, y = G + 2 + rnd() * (H - G - 6), h = 2 + (rnd() * 3 | 0);
      px(x, y - h, 1, h, o.tuft || o.top); px(x + 1, y - h + 1, 1, h - 1, o.tuft2 || o.mid); }
    for (let i = 0; i < (o.stones ?? 18); i++) { const x = rnd() * W, y = G + 4 + rnd() * (H - G - 8), w = 2 + (rnd() * 4 | 0);
      px(x, y, w, 2, o.stone || o.dark); px(x, y, w - 1, 1, o.stoneLit || o.top); } };
  const pineRow = (t, base, h, col, rim, step = 9) => { const { px, rnd, W } = t;
    for (let x = -8; x < W + 8; x += step * (.6 + rnd() * .8)) { const th = h * (.6 + rnd() * .4), top = base - th;
      for (let i = 0; i < th; i++) { const w = Math.max(1, Math.round(i * .42) - (i % 6 === 5 ? 2 : 0)); px(x - w / 2, top + i, w, 1, col); if (rim && w > 3 && i % 6 < 4) px(x - w / 2 + 1, top + i, Math.max(1, Math.round(w * .3)), 1, rim); }
      px(x - 1, base, 2, 3, col); } px(0, base, W, 4, col); };
  const roundTree = (t, x, base, r, dark, mid, lit, trunk) => { const { px } = t;
    px(x - 1, base - r, 3, r + 1, trunk); px(x - 1, base - r, 1, r + 1, mid);
    for (let y = -r; y <= r; y++) for (let i = -r; i <= r; i++) { if (i * i + y * y > r * r) continue; const s = (i + y) / r; px(x + i, base - r * 1.6 + y, 1, 1, s < -.6 ? lit : s < .3 ? mid : dark); } };
  const hills = (t, base, amp, col, rim, ph = 0) => { const { px, W, H } = t;
    for (let x = 0; x < W; x++) { const y = Math.round(base + Math.sin((x + ph) * .018) * amp + Math.sin((x + ph * 2) * .05) * amp * .35); px(x, y, 1, H - y, col); if (rim) px(x, y, 1, 1, rim); } };
  const peaks = (t, base, h, col, cap, rim) => { const { px, rnd, W } = t; const pts = []; for (let x = -40; x < W + 40; x += 46 + rnd() * 50) pts.push([x, base - h * (.5 + rnd() * .5)]);
    for (let x = 0; x < W; x++) { let y = base; for (const [p0, py] of pts) y = Math.min(y, py + Math.abs(x - p0) * 1.1); px(x, y, 1, base - y + 40, col); if (rim && x % 1 === 0) px(x, y, 1, 1, rim); }
    if (cap) for (const [p0, py] of pts) for (let i = 0; i < 10; i++) px(p0 - i * 1.1, py + i, i * 2.2 + 1, 1, cap); };
  const stars = (t, n, y1 = 150) => { const { px, rnd, W } = t; for (let i = 0; i < n; i++) { const b = rnd(), x = rnd() * W, y = rnd() * y1; px(x, y, 1, 1, b > .92 ? '#fff4d0' : b > .6 ? '#b8c4e0' : '#6a7898'); if (b > .97) { px(x - 1, y, 3, 1, '#d8e0f8'); px(x, y - 1, 1, 3, '#d8e0f8'); } } };
  const moon = (t, x, y, r, col = '#f0e6c0', shade = '#c8bc98') => { const { px } = t; for (let j = -r; j <= r; j++) for (let i = -r; i <= r; i++) if (i * i + j * j <= r * r) px(x + i, y + j, 1, 1, (i + j) > r * .5 ? shade : col); };
  const glow = (t, x, y, r, col, a = .18) => { const g = t.g; if (!g) return; g.save(); g.globalAlpha = Math.min(a, a * 4 / Math.max(1, r / 3)); for (let k = r; k > 0; k -= 3) { g.fillStyle = col; g.beginPath(); g.arc(x, y, k, 0, 7); g.fill(); } g.restore(); };
  const fence = (t, y, col, lit) => { const { px, W } = t; for (let x = 4; x < W; x += 18) { px(x, y - 12, 2, 13, col); px(x, y - 12, 1, 1, lit); } px(0, y - 9, W, 1, col); px(0, y - 5, W, 1, col); px(0, y - 9, W, 1, col); };
  const rock = (t, x, base, w, h, dark, mid, lit) => { const { px } = t; for (let j = 0; j < h; j++) { const ww = Math.round(w * (1 - Math.pow(1 - (j + 1) / h, 2) * .55)); px(x - ww / 2, base - h + j, ww, 1, j < 2 ? lit : mid); px(x + ww / 2 - 2, base - h + j, 2, 1, dark); } };

  /* landmarks */
  const windmill = (t, x, base) => { const { px } = t, w = '#3a2e2a', l = '#5a4a3e'; for (let j = 0; j < 44; j++) { const ww = 10 + j * .25; px(x - ww / 2, base - 44 + j, ww, 1, j % 6 ? w : l); }
    px(x - 3, base - 52, 6, 8, w); const cx = x, cy = base - 46; for (let k = 0; k < 4; k++) { const a = k * Math.PI / 2 + .4; for (let i = 3; i < 26; i++) { px(cx + Math.cos(a) * i, cy + Math.sin(a) * i, 2, 2, i % 5 ? '#2a2220' : l); } }
    px(x - 2, base - 10, 4, 10, '#18120e'); px(x - 1, base - 30, 3, 3, '#f0c060'); };
  const lighthouse = (t, x, base) => { const { px } = t; for (let j = 0; j < 70; j++) { const ww = 14 - j * .08; px(x - ww / 2, base - j, ww, 1, (j / 10 | 0) % 2 ? '#d8d0c4' : '#a83a32'); px(x + ww / 2 - 3, base - j, 3, 1, '#4a3a3a'); }
    px(x - 6, base - 80, 12, 10, '#2a2a30'); px(x - 4, base - 78, 8, 6, '#ffe08a'); px(x - 7, base - 82, 14, 2, '#1a1a20'); glow(t, x, base - 75, 26, '#ffe08a', .12);
    const g = t.g; if (g) { g.save(); g.globalAlpha = .14; g.fillStyle = '#fff0b0'; g.beginPath(); g.moveTo(x, base - 75); g.lineTo(x - 220, base - 110); g.lineTo(x - 220, base - 60); g.fill(); g.restore(); } };
  const timbers = (t, x, base, h = 70) => { const { px } = t; px(x, base - h, 6, h, '#4a3424'); px(x, base - h, 2, h, '#6a4c34'); px(x + 40, base - h, 6, h, '#4a3424'); px(x + 40, base - h, 2, h, '#6a4c34'); px(x - 4, base - h - 6, 54, 7, '#5a4030'); px(x - 4, base - h - 6, 54, 2, '#7a5a40');
    px(x + 22, base - h + 2, 1, 10, '#2a2a2a'); px(x + 19, base - h + 12, 7, 5, '#3a2a1a'); px(x + 20, base - h + 13, 5, 3, '#ffc860'); glow(t, x + 23, base - h + 15, 18, '#ffb040', .16); };
  const rails = (t, y) => { const { px, W } = t; for (let x = 0; x < W; x += 8) px(x, y, 5, 2, '#3a2a1e'); px(0, y - 1, W, 1, '#8a8a94'); px(0, y + 3, W, 1, '#8a8a94'); };
  const crystals = (t, n, cols) => { const { px, rnd, W } = t; for (let i = 0; i < n; i++) { const x = rnd() * W, y = G - 2 + rnd() * 4, h = 5 + rnd() * 9, c = cols[i % cols.length]; for (let j = 0; j < h; j++) { const ww = Math.max(1, Math.round((h - j) / 3)); px(x - ww / 2, y - j, ww, 1, j > h - 3 ? '#ffffff' : c); } glow(t, x, y - h / 2, 8, c, .1); } };
  const volcano = (t, x, base) => { const { px } = t; for (let j = 0; j < 110; j++) { const ww = 30 + j * 2.4; px(x - ww / 2, base - 110 + j, ww, 1, '#2a1410'); } px(x - 16, base - 112, 32, 4, '#ff6a2a'); glow(t, x, base - 115, 40, '#ff7a3a', .18);
    for (let i = 0; i < 40; i++) px(x - 4 + Math.sin(i * .5) * 6, base - 108 + i * 2.5, 3, 3, i % 3 ? '#ff5a1a' : '#ffb04a'); };
  const monastery = (t, x, base) => { const { px } = t, w = '#c8ccd8', d = '#8a90a8'; px(x - 30, base - 30, 60, 30, w); px(x + 20, base - 30, 10, 30, d); px(x - 34, base - 34, 68, 5, '#7a4a3a');
    px(x - 8, base - 62, 16, 32, w); px(x + 4, base - 62, 4, 32, d); for (let j = 0; j < 12; j++) px(x - 10 + j, base - 74 + j, 20 - j * 2 + j, 1, '#7a4a3a'); px(x - 2, base - 52, 4, 6, '#ffe08a'); px(x - 22, base - 20, 4, 6, '#ffe08a'); px(x + 10, base - 20, 4, 6, '#ffe08a'); };
  const castle = (t, x, base, col, lit) => { const { px } = t; const tower = (cx, h, w) => { px(cx - w / 2, base - h, w, h, col); px(cx - w / 2, base - h, 1, h, lit); for (let k = 0; k < w; k += 4) px(cx - w / 2 + k, base - h - 4, 2, 4, col); px(cx - 1, base - h + 10, 2, 4, '#c08af8'); };
    tower(x - 50, 70, 16); tower(x + 50, 64, 16); tower(x, 110, 22); px(x - 50, base - 46, 100, 46, col); for (let k = -50; k < 50; k += 6) px(x + k, base - 50, 3, 4, col); for (const wx of [-30, -10, 10, 30]) px(x + wx, base - 34, 3, 5, '#a070e0'); };
  const graves = (t, n, col, lit) => { const { px, rnd, W } = t; for (let i = 0; i < n; i++) { const x = 20 + rnd() * (W - 40), y = G + 3 + rnd() * 18, h = 7 + (rnd() * 4 | 0); if (Math.abs(x - 240) < 70 && y < G + 12) continue;
    if (rnd() > .4) { px(x, y - h, 6, h, col); px(x + 1, y - h - 1, 4, 1, col); px(x, y - h, 1, h, lit); } else { px(x + 2, y - h - 2, 2, h + 2, col); px(x, y - h + 1, 6, 2, col); px(x + 2, y - h - 2, 1, h + 2, lit); } } };
  const stones = (t, xs, base, col, lit) => { const { px } = t; for (const [x, h] of xs) { px(x, base - h, 8, h, col); px(x + 1, base - h - 1, 6, 1, col); px(x, base - h, 2, h, lit); } };
  const deadTree = (t, x, base, h, col) => { const { px } = t; px(x, base - h, 3, h, col); const br = (bx, by, dx, n) => { for (let i = 0; i < n; i++) px(bx + dx * i, by - i * .7, 2, 1, col); }; br(x, base - h * .7, -1, 12); br(x + 2, base - h * .55, 1, 14); br(x, base - h * .4, -1, 9); br(x + 2, base - h * .85, 1, 8);
    for (let i = 0; i < 6; i++) px(x - 8 + i * 4, base - h * .7 + (i % 2) * 3, 1, 5 + (i % 3) * 2, '#4a6a3a'); };
  const willow = (t, x, base, col, leaf) => { const { px } = t; px(x - 1, base - 40, 4, 40, col); for (let i = -22; i <= 22; i += 2) { const top = base - 52 + Math.abs(i) * .4; px(x + i, top, 2, 30 + (i * 7 % 9), leaf); } for (let i = -18; i <= 18; i++) px(x + i, base - 56 + Math.abs(i) * .3, 1, 6, leaf); };
  const reeds = (t, n, col, tip) => { const { px, rnd, W } = t; for (let i = 0; i < n; i++) { const x = rnd() * W; if (Math.abs(x - 240) < 60) continue; const h = 8 + rnd() * 14; px(x, G + 4 - h, 1, h, col); if (rnd() > .5) px(x, G + 4 - h, 1, 3, tip); } };
  const puddles = (t, n, col, lit) => { const { px, rnd, W } = t; for (let i = 0; i < n; i++) { const x = rnd() * W, y = G + 6 + rnd() * 20, w = 10 + rnd() * 26; px(x, y, w, 2, col); px(x + 3, y, w / 3, 1, lit); } };
  const lavaCracks = (t, n) => { const { px, rnd, W } = t; for (let i = 0; i < n; i++) { let x = rnd() * W, y = G + 4 + rnd() * 26; for (let k = 0; k < 10; k++) { px(x, y, 2, 1, k % 3 ? '#ff6a1a' : '#ffc04a'); x += 2; y += (rnd() - .5) * 2.4; } } };
  const clouds = (t, base, n, col, lit) => { const { px, rnd, W } = t; for (let i = 0; i < n; i++) { const x = rnd() * W, rw = 18 + rnd() * 30, rh = 5 + rnd() * 7; for (let y = -rh; y <= rh; y++) { const w = rw * Math.sqrt(1 - (y / rh) ** 2); px(x - w, base + y, w * 2, 1, y < -rh * .4 ? lit : col); } } };
  const mushrooms = (t, n) => { const { px, rnd, W } = t; for (let i = 0; i < n; i++) { const x = rnd() * W, y = G + 3 + rnd() * 16; if (Math.abs(x - 240) < 50) continue; px(x + 1, y - 3, 2, 3, '#e8dcc8'); px(x - 1, y - 5, 6, 2, i % 2 ? '#d84a3a' : '#c8a060'); px(x, y - 6, 4, 1, i % 2 ? '#d84a3a' : '#c8a060'); px(x, y - 5, 1, 1, '#fff'); } };
  const fireflies = (t, n, col) => { const { px, rnd, W } = t; for (let i = 0; i < n; i++) { const x = rnd() * W, y = 150 + rnd() * 90; px(x, y, 1, 1, col); glow(t, x, y, 3, col, .2); } };
  const wheat = (t, base, col, lit) => { const { px, W } = t; for (let x = 0; x < W; x += 2) { const h = 10 + ((x * 7) % 5); px(x, base - h, 1, h, col); px(x, base - h, 1, 2, lit); } px(0, base, W, 3, col); };

  /* ---------- the sixteen scenes (area keys as in backdrop.js: <town>:0 and <town>:1) ---------- */
  const S = {
    'willowbrook:0': { sky: ['#1c2244', '#5a3c5a', '#d0785a'], sun: [380, 182, '#ffcf7a'], layers: [], detail: t => { stars(t, 40, 80);
      hills(t, 182, 8, '#3a4a3a', '#5a6a4a', 10); hills(t, 202, 10, '#2c3c2c', '#4a5c3a', 140);
      for (const [x, r] of [[40, 12], [96, 9], [330, 11], [418, 13], [460, 8]]) roundTree(t, x, 214, r, '#1e2e1e', '#2e4a2a', '#4a6a3a', '#2a1e18');
      fence(t, 232, '#3a2c20', '#6a5440'); ground(t, { top: '#7a9a4a', mid: '#4a6a32', dark: '#2a3e20', tuft: '#8aaa52', stone: '#3a3a30', stoneLit: '#7a7a6a' });
      const { px } = t; for (let x = 150; x < 330; x++) px(x, G + 8 + Math.sin(x * .03) * 2, 1, 6, '#6a5238'); mushrooms(t, 4); } },
    'willowbrook:1': { sky: ['#060a14', '#0e1828', '#1a2a30'], layers: [], detail: t => { stars(t, 140); moon(t, 400, 40, 9);
      pineRow(t, 200, 110, '#16242e', '#1e3040', 8); pineRow(t, 222, 90, '#101c24', '#18283a', 10); pineRow(t, 236, 60, '#0a1218', '#142028', 12);
      ground(t, { top: '#3a5a3a', mid: '#22362a', dark: '#121e18', tuft: '#4a6a42', stone: '#1a2420', stoneLit: '#4a5a50' }); mushrooms(t, 6); fireflies(t, 18, '#d8f08a'); } },
    'mossbarrow:0': { sky: ['#2a2a3a', '#6a5a5a', '#c8946a'], layers: [], detail: t => { stars(t, 20, 60);
      hills(t, 188, 6, '#4a4a3a', '#6a6a52', 40); windmill(t, 380, 196); wheat(t, 224, '#b8963a', '#e8c860');
      ground(t, { top: '#8a6a3e', mid: '#5a4428', dark: '#33261a', tuft: '#c8a04a', stone: '#3a2e22', stoneLit: '#8a7a5a' });
      const { px } = t; px(86, 200, 2, 30, '#4a3624'); px(78, 206, 18, 2, '#4a3624'); px(82, 196, 10, 6, '#c8a060'); px(84, 194, 6, 3, '#5a4030'); } },
    'mossbarrow:1': { sky: ['#0a1414', '#14262a', '#24383a'], layers: [], detail: t => { stars(t, 50, 90); moon(t, 80, 50, 8, '#e0e8d8', '#b0b8a8');
      hills(t, 190, 12, '#1e2e2c', '#2e4440', 0); for (const x of [60, 150, 380]) { const { px } = t; for (let j = 0; j < 22; j++) px(x - 24 + j * .9, 208 - j * .8, 48 - j * 1.8, 1, j > 18 ? '#4a6460' : '#2a403e'); }
      stones(t, [[120, 22], [134, 28], [150, 20], [330, 24], [346, 18]], 224, '#4a5450', '#7a8a84'); for (const x of [30, 250, 440]) deadTree(t, x, 230, 60, '#141e1c');
      ground(t, { top: '#4a6a4a', mid: '#2a3e34', dark: '#16221e', tuft: '#5a7a52', stone: '#2a3430', stoneLit: '#6a7a72' });
      const g = t.g; if (g) { g.save(); g.globalAlpha = .12; g.fillStyle = '#a8c8c0'; for (let i = 0; i < 6; i++) g.fillRect(0, 200 + i * 7, 480, 3); g.restore(); } } },
    'saltmere:0': { sky: ['#1a2a4a', '#4a6a8a', '#e8a070'], sun: [120, 168, '#ffd890'], layers: [], detail: t => { const { px, rnd, W } = t; stars(t, 10, 50);
      for (let y = 172; y < 214; y++) px(0, y, W, 1, y < 180 ? '#4a7a9a' : y < 196 ? '#2e5a7a' : '#22465e'); for (let i = 0; i < 60; i++) px(rnd() * W, 174 + rnd() * 38, 3 + rnd() * 6, 1, '#a8d0e0');
      for (let x = 100; x < 140; x++) px(x, 174 + (x % 3), 1, 1, '#ffe0a0'); rock(t, 40, 222, 40, 22, '#2a2a34', '#4a4a56', '#7a7a88'); rock(t, 440, 224, 50, 26, '#2a2a34', '#4a4a56', '#7a7a88');
      ground(t, { top: '#e8d0a0', mid: '#c8a870', dark: '#8a6a48', tuft: '#d8c090', tufts: 10, stone: '#f0e8d8', stoneLit: '#ffffff', stones: 14 }); px(0, 214, W, 3, '#d8f0f0'); px(0, 217, W, 21, '#c8b080'); } },
    'saltmere:1': { sky: ['#04080e', '#0a1424', '#16243a'], layers: [], detail: t => { const { px, rnd, W } = t; stars(t, 160); moon(t, 70, 36, 8);
      for (let y = 190; y < 230; y++) px(0, y, W, 1, y < 200 ? '#122a40' : '#0c1e30'); for (let i = 0; i < 50; i++) px(rnd() * W, 192 + rnd() * 36, 3 + rnd() * 5, 1, '#4a7a9a');
      for (let x = 300; x < 480; x++) { const y = 150 + Math.max(0, (x - 300) * -.1) + (x % 9 < 2 ? 2 : 0); px(x, y + (x - 300) * .2, 1, 240 - y, '#161c26'); } lighthouse(t, 400, 182);
      ground(t, { top: '#5a5a66', mid: '#33333e', dark: '#1a1a22', tuft: '#4a6a5a', tufts: 20, stone: '#24242c', stoneLit: '#6a6a78', stones: 30 }); } },
    'ironpeak:0': { sky: ['#0a0808', '#140f0c', '#1c1612'], layers: [], detail: t => { const { px, rnd, W } = t;
      for (let x = 0; x < W; x += 5 + rnd() * 8) { const h = 14 + rnd() * 46; for (let i = 0; i < h; i++) px(x - (h - i) * .1, i, Math.max(1, (h - i) * .22), 1, '#2a221c'); }
      hills(t, 200, 14, '#241c16', '#3a2e24', 20); timbers(t, 90, 236); timbers(t, 330, 236, 64); crystals(t, 12, ['#7ad0e8', '#b08af0']);
      ground(t, { top: '#6a5a4a', mid: '#3e3228', dark: '#201812', tuft: '#5a4a3c', tufts: 8, stone: '#2a221a', stoneLit: '#8a7a68', stones: 40 }); rails(t, G + 14); } },
    'ironpeak:1': { sky: ['#2a3a5a', '#5a7aa0', '#a8c0d8'], layers: [], detail: t => { stars(t, 30, 60);
      peaks(t, 190, 120, '#6a7e98', '#f2f6fa', '#8aa0b8'); peaks(t, 214, 80, '#4a5e78', '#e6eef4', '#6a80a0');
      pineRow(t, 232, 40, '#2a3a42', '#4e6470', 11); ground(t, { top: '#ffffff', mid: '#d8e4ee', dark: '#9ab0c4', tuft: '#c8d8e8', tufts: 20, stone: '#6a7a8a', stoneLit: '#b8c8d8', stones: 12 });
      const { px, rnd, W, H } = t; for (let i = 0; i < 120; i++) px(rnd() * W, rnd() * H, 1, 1, '#ffffff'); } },
    'gloomfen:0': { sky: ['#16241e', '#2a4034', '#4a6050'], layers: [], detail: t => { stars(t, 20, 60);
      hills(t, 200, 6, '#24342c', '#3a4c3e', 30); for (const [x, h] of [[30, 80], [110, 66], [370, 90], [450, 70]]) deadTree(t, x, 234, h, '#1a2620');
      ground(t, { top: '#4a5a34', mid: '#2e3a24', dark: '#182016', tuft: '#5a6a3a', stone: '#1e2618', stoneLit: '#4a5a40' }); puddles(t, 10, '#1a2a2a', '#5a7a6a'); reeds(t, 50, '#3a4a2a', '#8a6a3a');
      const g = t.g; if (g) { g.save(); g.globalAlpha = .1; g.fillStyle = '#a8c0a0'; for (let i = 0; i < 8; i++) g.fillRect(0, 196 + i * 6, 480, 3); g.restore(); } } },
    'gloomfen:1': { sky: ['#0c0818', '#1c1230', '#2c1c42'], layers: [], detail: t => { stars(t, 90); moon(t, 380, 44, 10, '#e8d8f8', '#b8a8d0');
      hills(t, 204, 8, '#1a1228', '#2c2040', 60); willow(t, 70, 232, '#140e1e', '#241a34'); willow(t, 410, 232, '#140e1e', '#241a34');
      ground(t, { top: '#3a3050', mid: '#221a32', dark: '#120e1c', tuft: '#4a3e62', stone: '#1a1428', stoneLit: '#5a4e72' }); puddles(t, 8, '#1a1430', '#8a6ac0'); reeds(t, 40, '#2a2040', '#6a4a8a'); fireflies(t, 20, '#9af0e0'); } },
    'emberfall:0': { sky: ['#1a0606', '#4a140a', '#a83c14'], layers: [], detail: t => { stars(t, 20, 50);
      volcano(t, 330, 200); hills(t, 210, 8, '#2a120c', '#5a2414', 80);
      ground(t, { top: '#4a3a36', mid: '#2a201e', dark: '#140e0c', tuft: '#3a2a26', tufts: 10, stone: '#1a1210', stoneLit: '#6a5450', stones: 30 }); lavaCracks(t, 26);
      const { px, rnd, W } = t; for (let i = 0; i < 70; i++) px(rnd() * W, 60 + rnd() * 170, 1, 1, i % 2 ? '#ffb24a' : '#ff6a2a'); } },
    'emberfall:1': { sky: ['#0e0404', '#2a0a06', '#5a160c'], layers: [], detail: t => { stars(t, 30, 60);
      peaks(t, 200, 140, '#3a1410', '#ff6a2a', '#7a2a1a'); peaks(t, 226, 80, '#1c0806', null, '#4a1a10');
      ground(t, { top: '#3a2a26', mid: '#1e1412', dark: '#0e0808', tuft: '#2a1c18', tufts: 6, stone: '#140c0a', stoneLit: '#5a4440', stones: 30 }); lavaCracks(t, 34);
      const { px } = t; for (let x = 0; x < 480; x++) { const y = 226 + Math.sin(x * .04) * 3; px(x, y, 1, 2, x % 7 ? '#ff5a1a' : '#ffc04a'); } glow(t, 240, 228, 120, '#ff6a2a', .06);
      const { rnd, W } = t; for (let i = 0; i < 80; i++) px(rnd() * W, 40 + rnd() * 190, 1, 1, i % 2 ? '#ffb24a' : '#ff6a2a'); } },
    'skyreach:0': { sky: ['#3a6aa8', '#7aaee0', '#d8eef8'], sun: [400, 50, '#fff6d0'], layers: [], detail: t => {
      clouds(t, 160, 10, '#e8f0f8', '#ffffff'); monastery(t, 110, 196); clouds(t, 206, 14, '#c8d8e8', '#f4f8fc');
      ground(t, { top: '#b8c0b0', mid: '#8a9282', dark: '#5a6256', tuft: '#9ac08a', tufts: 30, stone: '#6a7266', stoneLit: '#e0e8d8', stones: 20 });
      const { px } = t; for (let x = 0; x < 480; x += 24) { px(x, G + 2, 22, 1, '#a0a890'); } clouds(t, 262, 10, '#f4f8fc', '#ffffff'); } },
    'skyreach:1': { sky: ['#12141e', '#22263a', '#3a4058'], layers: [], detail: t => {
      peaks(t, 196, 130, '#22263a', null, '#3a4260'); clouds(t, 190, 12, '#3a4058', '#5a6280'); peaks(t, 228, 60, '#161a28', null, '#2a3048');
      ground(t, { top: '#5a6072', mid: '#343848', dark: '#1a1c26', tuft: '#4a5466', stone: '#22242e', stoneLit: '#7a8094', stones: 26 }); puddles(t, 10, '#2a2e40', '#8a94b8');
      const { px, rnd, W, H, g } = t; if (g) { g.save(); g.strokeStyle = '#e8ecff'; g.lineWidth = 2; let bx = 320, by = 0; g.beginPath(); g.moveTo(bx, by); while (by < 150) { bx += (rnd() - .5) * 18; by += 10 + rnd() * 8; g.lineTo(bx, by); } g.stroke(); g.restore(); }
      for (let i = 0; i < 200; i++) px(rnd() * W, rnd() * H, 1, 4, '#7a88a8'); } },
    'hollow:0': { sky: ['#0c0814', '#1a1228', '#2a1e3a'], layers: [], detail: t => { stars(t, 60); moon(t, 90, 46, 11, '#e8dcf8', '#b0a0d0');
      castle(t, 330, 214, '#2e2446', '#5a4a80'); hills(t, 216, 4, '#18121f', '#2a2238', 0);
      ground(t, { top: '#4a4458', mid: '#2a2636', dark: '#14121c', tuft: '#3a3448', tufts: 14, stone: '#1e1a28', stoneLit: '#6a6280', stones: 20 }); graves(t, 14, '#3a3448', '#6a6280');
      const g = t.g; if (g) { g.save(); g.globalAlpha = .1; g.fillStyle = '#8a7ab0'; for (let i = 0; i < 6; i++) g.fillRect(0, 206 + i * 6, 480, 3); g.restore(); } } },
    'hollow:1': { sky: ['#040208', '#0e0818', '#1c1030'], layers: [], detail: t => { stars(t, 40);
      const { px, rnd, W } = t; for (let x = 20; x < W; x += 46 + rnd() * 30) { const h = 70 + rnd() * 90; for (let i = 0; i < h; i++) px(x - i * .06, 230 - h + i, 2 + i * .14, 1, '#241838'); px(x, 230 - h, 2, h * .8, '#4a3270'); }
      glow(t, 240, 150, 90, '#9a5af0', .07); ground(t, { top: '#3a2a52', mid: '#1e1430', dark: '#0e0818', tuft: '#4a3468', tufts: 8, stone: '#160e24', stoneLit: '#6a4a98', stones: 30 });
      for (let i = 0; i < 16; i++) { let x = rnd() * W, y = G + 4 + rnd() * 24; for (let k = 0; k < 8; k++) { px(x, y, 2, 1, '#a070f0'); x += 2; y += (rnd() - .5) * 2; } }
      for (let i = 0; i < 40; i++) px(rnd() * W, 60 + rnd() * 170, 1, 1, i % 2 ? '#b88af8' : '#f0d8ff'); } },
  };
  /* backdrop.js hands detail() its toolkit, the canvas included (glows, light beams) */
  for (const [k, r] of Object.entries(S)) DQ.registerBackdrop(k, r);
  DQ.COMBAT_GROUND_ROW = G;
})();
