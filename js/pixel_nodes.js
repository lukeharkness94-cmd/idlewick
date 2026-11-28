/* Idlewick pixel art: the gathering pictures and the house, redrawn in the chunky outlined style (owner, 28 Nov 2026;
   docs/pixel-art-style.md). Trees on Woodcutting cards and in the woodcutting scene, ore boulders on Mining cards,
   the fish on Fishing spot cards, crops on the farm plots, the house furniture and the hired workers.
   Same canvases as before (trees 32 x 48, rocks 32 x 32, fish 32 x 16, crops and furniture 16 x 16, workers 32 x 32),
   so layout, js/card_scale.js and the work rig (which reads the trunk's and rock face's own pixels) are unchanged.
   Solid sphere-lit masses lit from the top left, five-step hue-shifted ramps, a selective outline in each material's
   darkest step; drawn in code, nothing traced or copied. Loaded just before pixel_runtime.js: each drawing wraps the
   older one (an id this file does not know falls through to it) and the URL helpers are re-pointed here. */
(() => {
const DQ = window.DQ, D = DQ.data, A = DQ.pixelArt; if (!A || !A.treeSprite) return;
const { Spr, ramp, mix, R, sphere } = A;
const rp = (c, o) => ramp(c, o);
/* a deterministic 0..1 hash for leaf and stone texture */
const hsh = (x, y, k = 0) => { let h = Math.imul(x + 101 * k, 374761393) ^ Math.imul(y + 7, 668265263); h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };
/* shift the light step of every sphere-lit pixel of one material: leaf tufts and stone grain */
const texture = (s, r, k, f) => { for (let y = 0; y < s.h; y++) for (let x = 0; x < s.w; x++) { const p = s.px[y * s.w + x]; if (p && p.r === r && !p.fix) { const lv = p.lv != null ? p.lv : 2, n = f(x, y, lv, hsh(x, y, k)); if (n != null && n !== lv) s.px[y * s.w + x] = { r, fix: null, lv: n }; } } };
/* leaves: flecks of light on the lit side, small dark pockets inside, so a crown reads as foliage, not a ball */
const leafy = (s, r, k = 1, amt = 1) => { const tufts = []; texture(s, r, k, (x, y, lv, h) => { if (lv === 3 && h < .07 * amt) tufts.push([x + 1, y]); return lv === 3 && h < .07 * amt ? 4 : lv === 2 && h < .05 * amt ? 1 : null; });
  for (const [x, y] of tufts) { const p = s.at(x, y); if (p && p.r === r && p.lv >= 2) s.tone(x, y, r, 4); } };
/* a sphere-lit mass, rasterised at pixel centres so its rim has no one-pixel nubs */
const blob = (s, cx, cy, rx, ry, r, o = {}) => { for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++) for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++) {
  const nx = (x + .5 - cx) / rx, ny = (y + .5 - cy) / ry; if (nx * nx + ny * ny > 1) continue; o.flat ? s.dot(x, y, r) : s.tone(x, y, r, sphere(nx, ny)); } };
const clumps = (s, list, r) => list.forEach(([x, y, rx, ry]) => blob(s, x, y, rx, ry, r));
/* a trunk: a tapered polygon with bark grain down it (edge light makes the left side lit, the right shaded) */
const trunk = (s, pts, bark, grain = true) => { s.poly(pts, bark); if (!grain) return; const ys = pts.map(p => p[1]), y0 = Math.min(...ys), y1 = Math.max(...ys);
  for (let y = Math.ceil(y0) + 1; y < y1; y++) for (let x = 0; x < s.w; x++) { const p = s.at(x, y); if (!p || p.r !== bark || p.lv != null) continue;
    const l = s.at(x - 1, y), r = s.at(x + 1, y); if (l && l.r === bark && r && r.r === bark && hsh(x, (y / 3) | 0, 9) < .28) s.tone(x, y, bark, 1); } };
const branch = (s, x0, y0, x1, y1, r, w = 2) => { for (let i = 0; i < w; i++) s.line(x0 + i, y0, x1 + i, y1, r); };

/* ================= Trees (32 x 48) =================
   One species, one silhouette; shrubs (hazel, elder) and flax drawn for their 1x card scale. The bottom third keeps
   the trunk clear on its left, so the axe in the woodcutting scene meets bark. */
const T = {
  normal: s => { const L = rp('#5f9a45'), Dp = rp('#3f6f3c'), b = rp('#7a5236');
    trunk(s, [[13, 47], [19, 47], [18, 27], [14, 27]], b); s.poly([[10, 47], [14, 43], [14, 47]], b); s.poly([[22, 47], [18, 43], [18, 47]], b);
    branch(s, 15, 30, 10, 23, b); branch(s, 17, 29, 22, 22, b);
    clumps(s, [[16, 14, 13, 10], [7, 22, 6, 5], [25, 21, 6, 5]], Dp); clumps(s, [[11, 10, 7, 6], [21, 10, 7, 6], [16, 18, 9, 6], [7, 18, 5, 4], [25, 17, 5, 4], [16, 5, 5, 3.5]], L);
    leafy(s, L); leafy(s, Dp, 2); },
  oak: s => { const L = rp('#6a9a3e'), Dp = rp('#41683a'), b = rp('#6e4a30');
    trunk(s, [[11, 47], [21, 47], [19, 28], [13, 28]], b); s.poly([[7, 47], [12, 42], [12, 47]], b); s.poly([[25, 47], [20, 42], [20, 47]], b);
    branch(s, 14, 31, 6, 24, b, 3); branch(s, 17, 30, 26, 22, b, 3); branch(s, 15, 29, 15, 20, b, 2);
    clumps(s, [[16, 14, 15, 10], [4, 21, 4, 4], [28, 20, 4, 4]], Dp); clumps(s, [[7, 13, 6, 5], [16, 9, 7, 6], [25, 12, 6, 5], [10, 20, 6, 4], [22, 20, 6, 4], [3, 17, 3, 3], [29, 16, 2.5, 3]], L);
    leafy(s, L); leafy(s, Dp, 2); [[9, 19], [23, 21], [17, 13]].forEach(([x, y]) => { s.fix(x, y, '#c89a4a'); s.fix(x, y + 1, '#7a5a2a'); }); },
  willow: s => { const L = rp('#9ab86a'), Dp = rp('#5f8848'), b = rp('#6a604a');
    for (let y = 47; y >= 18; y--) { const x = 14 + Math.round(Math.sin(y / 5) * 1.2) + (y > 42 ? -1 : 0), w = y > 42 ? 6 : y > 30 ? 4 : 3; for (let i = 0; i < w; i++) s.dot(x + i, y, b); }
    s.poly([[10, 47], [14, 43], [14, 47]], b); s.poly([[22, 47], [18, 44], [18, 47]], b); for (const y of [44, 38, 33, 27]) s.tone(16 + Math.round(Math.sin(y / 5) * 1.2), y, b, 1);
    clumps(s, [[16, 12, 13, 8]], Dp); clumps(s, [[11, 9, 7, 5], [21, 9, 7, 5], [16, 6, 6, 4]], L);
    for (let x = 3; x <= 29; x++) { if (x >= 14 && x <= 18) continue; const end = 22 + Math.round((13 - Math.abs(x - 16)) * .75) + Math.round(hsh(x, 1, 4) * 3), r = (x % 3) ? L : Dp, sw = x < 16 ? -1 : 1;
      for (let y = 14; y <= end; y++) s.dot(x + (y > end - 4 ? sw * ((y - end + 4) >> 2) : 0), y, r); }
    for (let x = 14; x <= 18; x++) for (let y = 14; y <= 19; y++) s.dot(x, y, x % 2 ? L : Dp);
    leafy(s, L, 3); },
  maple: s => { const L = rp('#e0702e'), Dp = rp('#a8402a'), G = rp('#f0a840'), b = rp('#5e4030');
    trunk(s, [[14, 47], [18, 47], [17, 28], [15, 28]], b); branch(s, 15, 31, 9, 25, b); branch(s, 16, 30, 23, 24, b);
    clumps(s, [[16, 15, 14, 12]], Dp); clumps(s, [[10, 11, 7, 6], [21, 9, 7, 6], [16, 18, 9, 6], [6, 20, 5, 4], [26, 19, 5, 4], [15, 4, 5, 3.5]], L); clumps(s, [[11, 8, 3, 2.5], [20, 6, 3, 2.5]], G);
    leafy(s, L, 5); leafy(s, Dp, 6); for (const [x, y] of [[5, 31], [27, 34], [9, 40], [24, 43]]) { s.fix(x, y, '#f0a840'); s.fix(x + 1, y, '#c0502a'); }
    for (const [x, y] of [[8, 47], [11, 46], [21, 46], [24, 47], [12, 47], [20, 47]]) s.dot(x, y, y === 46 ? G : L); },
  yew: s => { const L = rp('#2f6a4e'), Dp = rp('#1e4a3a'), b = rp('#7a3e2e');
    trunk(s, [[12, 47], [20, 47], [19, 31], [13, 31]], b); s.poly([[9, 47], [13, 43], [13, 47]], b);
    clumps(s, [[16, 8, 5, 4.5], [16, 15, 9, 6], [16, 23, 12, 7], [16, 29, 14, 4.5]], Dp); clumps(s, [[14, 7, 4, 3.5], [13, 14, 7, 4.5], [12, 22, 9, 5], [11, 28, 9, 3.5], [22, 26, 5, 3]], L);
    leafy(s, L, 7, 1.3); leafy(s, Dp, 8, 1.3); [[8, 24], [20, 18], [14, 27], [24, 28], [17, 11], [6, 29]].forEach(([x, y]) => { s.fix(x, y, '#ff5a6a'); s.fix(x, y + 1, '#a8203a'); }); },
  magic: s => { const L = rp('#8a70d8'), Dp = rp('#4e3a96'), b = rp('#4a3a7a'), glow = '#f0e0ff';
    for (let y = 47; y >= 22; y--) { const x = 15 + Math.round(Math.sin(y / 4.5) * 1.6); for (let i = -1; i < 3; i++) s.dot(x + i, y, b); if (y > 43) { s.dot(x - 2, y, b); s.dot(x + 3, y, b); } }
    clumps(s, [[16, 15, 12, 10]], Dp); clumps(s, [[11, 13, 6, 5], [21, 13, 6, 5], [16, 7, 6, 5], [16, 19, 8, 4], [16, 2, 2.5, 2]], L);
    leafy(s, L, 11); for (const [x, y] of [[10, 9], [21, 7], [16, 14], [25, 16], [8, 18]]) s.fix(x, y, glow);
    for (const [x, y] of [[4, 8], [28, 10], [3, 26], [27, 30], [25, 4], [6, 36]]) s.fix(x, y, '#d8c0ff'); s.fix(16, 34, '#e8d8ff'); s.fix(16, 35, '#a888ff'); },
  birch: s => { const L = rp('#a8cc5a'), Dp = rp('#6f9a3e'), b = rp('#e8e2d2', { lo: .42 });
    for (let y = 47; y >= 4; y--) { const x = 15 + (y < 20 ? 1 : 0); s.dot(x, y, b); s.dot(x + 1, y, b); if (y > 12) s.dot(x + 2, y, b); }
    branch(s, 15, 22, 9, 15, b, 1); branch(s, 17, 18, 24, 11, b, 1); branch(s, 16, 28, 22, 24, b, 1);
    clumps(s, [[9, 13, 5, 4], [23, 10, 5, 4], [16, 5, 4, 3.5], [22, 22, 4, 3], [9, 22, 3.5, 3]], Dp); clumps(s, [[8, 11, 4, 3], [22, 8, 4, 3], [15, 3, 3, 2.5], [21, 20, 3, 2.5], [8, 21, 2.5, 2]], L);
    leafy(s, L, 13); for (let y = 8; y < 47; y += 3) { const x = 15 + (y < 20 ? 1 : 0) + ((y * 7) % 3); s.fix(Math.min(x, 17), y, '#2e2a2a'); if (y % 2) s.fix(Math.min(x, 17) + 1 > 17 ? 16 : x + 1, y, '#4a4440'); } },
  elder: s => { const L = rp('#7a9a4e'), Dp = rp('#4e6e3c'), b = rp('#9a8a6a'), F = rp('#f2ead0');
    /* a many-stemmed shrub: arching stems from a spread base, leafy mounds, flat cream flower heads on top */
    for (const [x0, x1, y1] of [[14, 4, 28], [15, 10, 20], [16, 17, 16], [17, 23, 19], [18, 28, 27]]) { const n = 30; for (let i = 0; i <= n; i++) { const t = i / n, x = Math.round(x0 + (x1 - x0) * t * t), y = Math.round(47 - (47 - y1) * t); s.dot(x, y, b); if (t < .35) s.dot(x + 1, y, b); } }
    clumps(s, [[8, 29, 7, 6], [24, 28, 7, 6], [16, 22, 9, 7]], Dp); clumps(s, [[9, 27, 5, 4], [23, 26, 5, 4], [15, 19, 6, 4.5]], L); leafy(s, L, 14);
    /* elderflower: flat plates of tiny cream florets */
    for (const [cx, cy, w] of [[7, 22, 3], [16, 15, 4], [25, 21, 3], [12, 28, 2], [21, 30, 2]]) { for (let i = -w; i <= w; i++) s.dot(cx + i, cy, F); for (let i = 1 - w; i < w; i++) s.dot(cx + i, cy + 1, F); for (let i = -w; i <= w; i += 2) s.fix(cx + i, cy, '#fffbe8'); s.fix(cx, cy + 2, '#5a6a3a'); } },
  gloomwood: s => { const L = rp('#5a4a82'), Dp = rp('#32285a'), b = rp('#3e2e4e');
    for (let y = 47; y > 16; y--) { const x = 14 + Math.round(Math.sin(y / 3.6) * 2.2); for (let i = 0; i < 4; i++) s.dot(x + i, y, b); } s.poly([[9, 47], [14, 42], [14, 47]], b); s.poly([[23, 47], [18, 42], [18, 47]], b);
    branch(s, 15, 24, 6, 17, b); branch(s, 17, 22, 27, 15, b); branch(s, 6, 17, 3, 21, b, 1);
    clumps(s, [[9, 12, 8, 6], [23, 11, 8, 6], [16, 7, 7, 5]], Dp); clumps(s, [[9, 10, 6, 4], [22, 9, 6, 4], [16, 5, 5, 3]], L); leafy(s, L, 15);
    for (const [x, len] of [[3, 7], [7, 9], [12, 5], [20, 6], [25, 10], [29, 6]]) for (let y = 15; y < 15 + len; y++) s.dot(x + ((y >> 2) % 2), y, Dp);
    for (const [x, y] of [[7, 9], [24, 8], [15, 3], [26, 24], [5, 27]]) s.fix(x, y, '#c89aff'); s.fix(16, 31, '#ffe07a'); s.fix(17, 31, '#ffe07a'); s.fix(16, 32, '#1a1020'); s.fix(17, 32, '#1a1020'); },
  hazel: s => { const L = rp('#7aaa50'), Dp = rp('#4e7a3c'), b = rp('#8a6a44');
    /* coppiced: straight rods fanning from a stool at the ground, round leaves in loose mounds */
    s.poly([[11, 47], [21, 47], [20, 45], [12, 45]], b);
    for (const [x0, x1, y1] of [[12, 3, 22], [14, 8, 14], [15, 14, 10], [17, 20, 11], [18, 26, 15], [20, 29, 24]]) s.line(x0, 45, x1, y1, b);
    clumps(s, [[6, 22, 6, 6], [26, 21, 6, 6], [16, 14, 9, 7], [10, 31, 6, 5], [23, 31, 6, 5]], Dp); clumps(s, [[7, 20, 4, 4], [25, 19, 4, 4], [15, 12, 6, 5], [10, 29, 4, 3], [22, 29, 4, 3]], L); leafy(s, L, 17, 1.3);
    for (const [x, y] of [[7, 27], [20, 24], [13, 33], [25, 31], [16, 22]]) { s.ell(x, y, 1, 1, rp('#b88a4a')); s.fix(x, y - 1, '#e0c080'); s.fix(x + 1, y + 1, '#6a4a2a'); }
    for (const [x, y] of [[11, 13], [19, 11], [27, 17]]) for (let i = 0; i < 3; i++) s.fix(x, y + i, i === 2 ? '#a88a30' : '#e8d060'); },
  ash: s => { const L = rp('#8ab868'), Dp = rp('#5a8a4c'), b = rp('#a8a294');
    /* tall and open: a straight pale trunk forking into upswept limbs, airy clumps with sky between them */
    trunk(s, [[13, 47], [19, 47], [17, 24], [15, 24]], b); s.poly([[10, 47], [14, 44], [14, 47]], b);
    branch(s, 15, 27, 7, 15, b); branch(s, 16, 25, 25, 12, b); branch(s, 15, 24, 14, 8, b); branch(s, 16, 26, 21, 20, b, 1);
    clumps(s, [[7, 13, 6, 6], [25, 10, 6, 6], [14, 6, 7, 5], [21, 19, 5, 4], [8, 22, 4, 3]], Dp); clumps(s, [[6, 11, 4, 4], [24, 8, 4, 4], [13, 4, 5, 3.5], [20, 17, 3.5, 3]], L); leafy(s, L, 19, 1.5);
    for (const [x, y] of [[8, 10], [24, 17], [12, 24]]) { s.fix(x, y, '#c8a86a'); s.fix(x + 1, y + 1, '#a8884a'); s.fix(x - 1, y + 1, '#a8884a'); } },
  palm: s => { const L = rp('#6aa848'), Dp = rp('#457a3a'), b = rp('#a88a58');
    for (let y = 47; y > 12; y--) { const x = 11 + Math.round(Math.pow((47 - y) / 35, 1.6) * 9); for (let i = 0; i < 4 - (y < 26 ? 1 : 0); i++) s.dot(x + i, y, b); if (y % 3 === 0) for (let i = 0; i < 3; i++) s.tone(x + i, y, b, 1); }
    const cx = 21, cy = 12;
    for (const [dx, dy, r] of [[-13, 6, Dp], [12, 8, Dp], [-9, -5, L], [9, -6, L], [0, -10, L], [-12, 12, L], [11, 14, L]]) { const n = 14;
      for (let i = 0; i <= n; i++) { const t = i / n, x = cx + dx * t, y = cy + dy * t + Math.sin(t * Math.PI) * (dy < 0 ? -2 : 0) + t * t * 3; s.dot(x, y, r); s.dot(x, y + 1, r); if (i > 2 && i % 2 === 0) s.dot(x + (dx > 0 ? -1 : 1) * .3, y + 2, r); } }
    s.ell(cx - 1, cy + 3, 2, 2, rp('#6a4a2a')); s.ell(cx + 2, cy + 4, 2, 2, rp('#7a5a32')); s.ell(cx, cy + 6, 1.6, 1.6, rp('#6a4a2a')); },
  cedar: s => { const L = rp('#3f7a52'), Dp = rp('#26553a'), b = rp('#8a4a30');
    trunk(s, [[13, 47], [19, 47], [18, 6], [15, 6]], b); s.poly([[10, 47], [14, 43], [14, 47]], b);
    for (const [y, l, r] of [[7, 6, 7], [14, 11, 11], [21, 14, 14], [28, 15, 13]]) { s.ell(16 - l / 2 + 1, y + 1, l / 2 + 3, 2.6, Dp); s.ell(16 + r / 2, y + 1, r / 2 + 3, 2.6, Dp); s.ell(16 - l / 2 + 1, y, l / 2 + 2, 2, L); s.ell(16 + r / 2, y, r / 2 + 2, 2, L); }
    s.ell(16, 3, 3, 2.5, L); leafy(s, L, 21, 1.2); },
  pine: s => { const L = rp('#2f7050'), Dp = rp('#1e4a36'), b = rp('#6a4a30');
    trunk(s, [[14, 47], [18, 47], [17, 30], [15, 30]], b);
    /* narrow and tiered: each whorl a skirt whose tips droop, lit on its left half */
    for (let i = 0; i < 6; i++) { const y = 2 + i * 5, half = 3 + i * 2.1, bot = y + 7; s.poly([[16, y], [16.5 + half, bot - 1], [16 + half, bot + 1], [16, bot - 1], [16 - half, bot + 1], [15.5 - half, bot - 1]], Dp); s.poly([[16, y + 1], [16, bot - 1], [16 - half + 1, bot - 1]], L); }
    leafy(s, L, 23, 1.2); for (const [x, y] of [[10, 25], [21, 20], [13, 15]]) { s.dot(x, y, rp('#8a5a30')); s.dot(x, y + 1, rp('#8a5a30')); s.fix(x, y, '#c8904a'); } },
  mangrove: s => { const L = rp('#5a8c4a'), Dp = rp('#3a6a3a'), b = rp('#5a4030');
    trunk(s, [[14, 38], [18, 38], [18, 18], [14, 18]], b);
    for (const x1 of [3, 9, 23, 29]) { let px = null; for (let i = 0; i <= 40; i++) { const t = i / 40, x = Math.round(16 + (x1 - 16) * t), y = Math.round(30 + 17 * t - Math.sin(t * Math.PI) * 6); s.dot(x, y, b); s.dot(x + (x1 > 16 ? 1 : -1) * (t < .5 ? 1 : 0), y, b); } }
    clumps(s, [[16, 13, 14, 7]], Dp); clumps(s, [[9, 10, 7, 4.5], [22, 10, 7, 4.5], [16, 7, 6, 4]], L); leafy(s, L, 25);
    for (const x of [6, 12, 21, 27]) { s.line(x, 18, x, 23, null, b.base); s.fix(x, 24, b.lo); } },
  cinderbark: s => { const b = rp('#2e2422'), E = '#ffb04a', E2 = '#e85a2a';
    trunk(s, [[12, 47], [20, 47], [18, 12], [15, 10], [14, 14]], b);
    for (const [a, c, d, e, w] of [[15, 26, 6, 17, 2], [6, 17, 3, 12, 1], [17, 22, 26, 14, 2], [26, 14, 28, 9, 1], [16, 16, 10, 8, 1], [17, 32, 24, 28, 2]]) branch(s, a, c, d, e, b, w);
    s.poly([[9, 47], [13, 42], [13, 47]], b); s.poly([[23, 47], [19, 42], [19, 47]], b);
    for (const [x0, y0, x1, y1] of [[15, 44, 17, 36], [17, 36, 15, 29], [16, 24, 17, 18]]) s.line(x0, y0, x1, y1, null, E2);
    for (const [x, y] of [[16, 40], [16, 33], [17, 21], [9, 15], [25, 15], [21, 29]]) s.fix(x, y, E);
    for (const [x, y] of [[8, 6], [22, 4], [27, 6], [12, 2], [19, 9]]) s.fix(x, y, (x + y) % 2 ? E : E2); },
  windpine: s => { const L = rp('#7aa2b4'), Dp = rp('#4e7a90'), b = rp('#8a96a6');
    for (let y = 47; y > 14; y--) { const x = 9 + Math.round((47 - y) * .28); for (let i = 0; i < 3; i++) s.dot(x + i, y, b); }
    branch(s, 12, 34, 5, 30, b, 1); branch(s, 13, 28, 7, 25, b, 1); branch(s, 18, 22, 28, 22, b, 1);
    clumps(s, [[21, 14, 10, 4.5], [24, 21, 7, 3], [19, 9, 7, 3]], Dp); clumps(s, [[19, 12, 8, 3], [22, 19, 5, 2], [17, 8, 5, 2]], L); leafy(s, L, 27);
    for (const [x, y] of [[30, 12], [31, 14], [29, 20]]) s.dot(x, y, L); },
  wraithbark: s => { const L = rp('#cdd6e8'), Dp = rp('#8a96b4'), b = rp('#b8b8cc');
    for (let y = 47; y >= 14; y--) { const x = 14 + Math.round(Math.sin(y / 3.2) * 1.4), w = y > 41 ? 5 : 3; for (let i = 0; i < w; i++) s.dot(x + i, y, b); }
    s.poly([[9, 47], [14, 43], [14, 47]], b); s.poly([[23, 47], [18, 43], [18, 47]], b);
    clumps(s, [[16, 11, 11, 6]], Dp); clumps(s, [[12, 9, 6, 4], [21, 9, 6, 4]], L);
    for (let x = 6; x <= 26; x += 2) { if (x === 16) continue; const len = 10 + Math.round(hsh(x, 3, 29) * 10) - Math.abs(x - 16) * .4; for (let y = 14; y < 14 + len; y++) s.dot(x + (((y + x) >> 3) % 2), y, (x / 2) % 2 ? L : Dp); }
    for (const [x, y] of [[9, 7], [23, 6], [16, 4], [4, 22], [28, 26]]) s.fix(x, y, '#ffffff'); s.fix(15, 28, '#bfe8ff'); s.fix(17, 28, '#bfe8ff'); s.fix(15, 29, '#6a7aa8'); s.fix(17, 29, '#6a7aa8'); },
  flax: s => { const st = rp('#5e8a54'), F = rp('#7a90d8'), lt = rp('#9ab070');
    for (const [x, y] of [[7, 32], [11, 28], [16, 26], [21, 29], [25, 33], [13, 35], [19, 34]]) { s.line(x, y + 1, 16 + (x - 16) * .25, 46, st); }
    for (const [x, y] of [[9, 38], [23, 38]]) s.line(x, y, 16 + (x - 16) * .3, 46, lt);
    for (const [x, y] of [[7, 32], [11, 28], [16, 26], [21, 29], [25, 33]]) { s.ell(x, y, 1.6, 1.6, F); s.fix(x, y, '#f0e8b0'); }
    for (const [x, y] of [[13, 35], [19, 34]]) { s.dot(x, y, F); s.dot(x, y - 1, F); }
    s.ell(16, 46.5, 7, 1.4, rp('#3e5e40')); }
};
function treeSprite(id) { const f = T[id]; if (!f) return null; const s = Spr(32, 48); f(s); return s; }

/* ================= Rocks (32 x 32): a sphere-lit boulder per ore, the ore showing its own way ================= */
const ORE = A.ORE || {};
/* boulder outlines vary by family, so a row of deposits doesn't read as one stone repeated */
const BOULDER = { a: [[15, 17, 13, 12], [7, 23, 7, 7], [24, 21, 7, 8]], b: [[14, 16, 11, 13], [24, 22, 7, 7], [5, 24, 5, 5]], c: [[16, 20, 14, 10], [10, 13, 8, 7], [22, 15, 7, 7]], d: [[17, 15, 10, 14], [7, 23, 7, 6], [26, 24, 5, 5]] };
const SHAPE = { copper: 'a', tin: 'c', iron: 'b', gold: 'd', silver: 'c', mithril: 'a', adamant: 'b', runite: 'd', astralite: 'a', voidstone: 'b', flint: 'c', quartz: 'd', amber: 'a', jet: 'c', jade: 'b', bloodstone: 'a', moonstone: 'd', bogiron: 'c', obsidian: 'b', skyglass: 'd', nullite: 'a' };
const boulder = (s, rock, shape) => { for (const [x, y, rx, ry] of BOULDER[shape]) blob(s, x + .5, y + .5, rx + .5, ry + .5, rock);
  for (let x = 0; x < 32; x++) for (let y = 30; y < 32; y++) if (s.at(x, y)) s.erase(x, y); /* a flat base on the ground line */
  for (let x = 0; x < 32; x++) if (s.at(x, 29) && s.at(x, 28)) s.tone(x, 29, rock, 1);
  texture(s, rock, 31, (x, y, lv, h) => lv === 2 && h < .035 ? 1 : lv === 3 && h < .03 ? 4 : null); };
/* a crack: a jagged line in the stone's shadow step */
const crack = (s, rock, pts) => { for (let i = 0; i + 1 < pts.length; i++) { const [x0, y0] = pts[i], [x1, y1] = pts[i + 1]; const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0)); for (let j = 0; j <= n; j++) { const x = Math.round(x0 + (x1 - x0) * j / n), y = Math.round(y0 + (y1 - y0) * j / n); if (s.at(x, y)) s.fix(x, y, rock.out); } } };
/* a faceted crystal standing from (x, base): lit face on the left, shaded face on the right, a glint at the tip */
const crystal = (s, x, base, w, h, lean, r) => { for (let y = 0; y < h; y++) { const t = y / h, cx = x + lean * t, half = y < h * .25 ? Math.max(.5, w * (y / (h * .25))) : w;
    for (let i = -Math.ceil(half); i <= Math.ceil(half); i++) { if (Math.abs(i) > half + .3) continue; const X = Math.round(cx + i), Y = base - (h - 1 - y) - 0; s.tone(X, base - h + 1 + y, r, i < 0 ? 3 : i === 0 ? 2 : 1); } }
  s.tone(Math.round(x + lean * 0), base - h + 1, r, 4); s.tone(Math.round(x + lean * .1) - 1, base - h + 3, r, 4); };
const nodule = (s, x, y, rad, r, glint) => { s.ell(x, y, rad, rad * .9, r); if (glint) s.fix(Math.round(x - rad * .4), Math.round(y - rad * .5), glint); };
const ROCKSTYLE = {
  veins: (s, m, o, rock) => { for (const [a, b, c, d] of [[5, 26, 15, 16], [15, 16, 27, 12], [9, 22, 18, 24], [18, 24, 26, 20]]) { s.line(a, b, c, d, m); s.line(a, b + 1, c, d + 1, m); }
    texture(s, m, 33, (x, y, lv, h) => s.at(x, y - 1) && s.at(x, y - 1).r === m ? 1 : 3); [[21, 14], [12, 25], [24, 21], [7, 24]].forEach(([x, y]) => { s.fix(x, y, o.extra); s.fix(x + 1, y, mix(o.extra, '#1a3a30', .4)); }); },
  nodules: (s, m) => [[9, 21, 2.4], [16, 16, 2.6], [22, 22, 2.4], [14, 25, 1.8], [24, 15, 1.8], [7, 15, 1.6]].forEach(([x, y, r]) => nodule(s, x, y, r, m, '#ffffff')),
  streaks: (s, m) => { for (const [a, b, c, d] of [[6, 16, 10, 27], [12, 12, 16, 27], [19, 12, 22, 26], [25, 16, 27, 24]]) { s.line(a, b, c, d, m); s.line(a + 1, b, c + 1, d, m); } texture(s, m, 35, (x, y) => (s.at(x - 1, y) && s.at(x - 1, y).r === m) ? 1 : 3); },
  branch: (s, m) => { const W = '#ffffff'; for (const [a, b, c, d] of [[6, 25, 13, 18], [13, 18, 18, 11], [13, 18, 24, 19], [18, 11, 25, 9], [18, 11, 16, 7], [24, 19, 27, 25], [9, 22, 7, 15]]) { s.line(a, b, c, d, m); } [[25, 9], [16, 7], [27, 25], [7, 15], [13, 18]].forEach(([x, y]) => s.fix(x, y, W)); },
  blobs: (s, m, o) => { [[10, 18, 3.4], [20, 23, 3.8], [21, 14, 2.4], [11, 26, 2]].forEach(([x, y, r]) => nodule(s, x, y, r, m)); [[9, 17], [19, 21], [21, 13]].forEach(([x, y]) => s.fix(x, y, o.extra)); },
  crystal: (s, m) => { crystal(s, 10, 24, 1.6, 12, -2, m); crystal(s, 16, 22, 2, 16, 0, m); crystal(s, 22, 24, 1.6, 11, 2, m); crystal(s, 26, 26, 1, 6, 2, m); },
  cluster: (s, m, o) => { const e = ramp(o.extra, { gl: .9 }); crystal(s, 9, 22, 1.4, 9, -3, m); crystal(s, 16, 21, 2, 15, 0, m); crystal(s, 22, 22, 1.6, 11, 3, m); crystal(s, 13, 24, 1, 6, -1, e); crystal(s, 19, 24, 1, 7, 1, e); [[3, 6], [28, 8], [5, 14]].forEach(([x, y]) => s.fix(x, y, o.extra)); },
  stars: (s, m, o) => [[9, 17], [18, 13], [22, 22], [12, 25], [25, 16], [16, 20]].forEach(([x, y], i) => { const c = i % 2 ? o.extra : o.col; s.fix(x, y, '#ffffff'); if (i < 4) { s.fix(x - 1, y, c); s.fix(x + 1, y, c); s.fix(x, y - 1, c); s.fix(x, y + 1, c); } }),
  shards: (s, m, o) => { crystal(s, 10, 25, 1.4, 11, -3, m); crystal(s, 17, 23, 1.8, 16, 1, m); crystal(s, 23, 25, 1.4, 10, 3, m); [[10, 15], [18, 8], [25, 16]].forEach(([x, y]) => s.fix(x, y, o.extra)); },
  chips: (s, m, o) => [[9, 18, 1], [17, 14, -1], [22, 22, 1], [12, 25, -1], [24, 14, 1]].forEach(([x, y, d]) => { s.poly([[x - 3, y + 2], [x, y - 3], [x + 3, y + 1 * d]], m); s.fix(x, y - 2, o.extra); s.fix(x - 1, y - 1, o.extra); }),
  prism: (s, m) => { for (const [x, y, h] of [[9, 25, 9], [15, 23, 15], [21, 25, 11], [25, 26, 6]]) { s.rect(x - 1, y - h + 1, 3, h, m); s.poly([[x - 1, y - h + 1], [x, y - h - 1], [x + 1, y - h + 1]], m); for (let j = y - h + 2; j < y; j++) s.tone(x + 1, j, m, 1); s.fix(x - 1, y - h + 2, '#ffffff'); } },
  drops: (s, m, o) => [[9, 18, 2.6], [19, 22, 3.4], [21, 13, 2], [11, 25, 1.8]].forEach(([x, y, r], i) => { nodule(s, x, y, r, m, '#fff4c8'); if (i === 1) { s.fix(x, y, o.extra); s.fix(x + 1, y, o.extra); } }),
  glossy: (s, m, o) => [[10, 18, 3.6, 2.6], [20, 22, 4, 3], [21, 13, 2.2, 1.8]].forEach(([x, y, a, b]) => { s.ell(x, y, a, b, m); s.fix(x - 1, y - 1, o.extra); s.fix(x, y - 1, mix(o.extra, '#ffffff', .4)); }),
  banded: (s, m, o) => { const e = rp(o.extra); for (const [y, r] of [[13, m], [17, e], [21, m], [25, e]]) for (let x = 0; x < 32; x++) { const yy = y + Math.round(Math.sin(x / 4) * 1.5) - Math.round(x * .15); if (s.at(x, yy)) { s.dot(x, yy, r); if (r === m) s.dot(x, yy + 1, r); } } },
  speckle: (s, m, o) => { s.ell(15, 19, 8, 6, m); s.ell(23, 23, 4, 3, m); [[11, 17], [16, 15], [19, 20], [13, 22], [22, 23], [17, 24], [24, 21]].forEach(([x, y]) => s.fix(x, y, o.extra)); },
  sheen: (s, m, o) => [[10, 18, 3.4], [20, 22, 3.8], [21, 13, 2.2]].forEach(([x, y, r]) => { s.ell(x, y, r, r * .85, m); s.line(x - 2, y - 1, x + 1, y - 2, null, o.extra); s.fix(x - 1, y - 2, '#ffffff'); }),
  crust: (s, m, o) => [[8, 19, 3], [15, 15, 3.2], [22, 20, 3.4], [13, 24, 2.6], [25, 13, 2]].forEach(([x, y, r]) => { s.ell(x, y, r, r * .75, m); s.fix(x, y - 1, o.extra); s.fix(x + 1, y + 1, mix(o.col, '#2a1a10', .5)); }),
  glass: (s, m, o) => { const g = ramp('#3a3050', { gl: .7 }); crystal(s, 9, 26, 2.4, 11, -4, g); crystal(s, 17, 24, 3, 16, 1, g); crystal(s, 24, 26, 2.2, 10, 4, g);
    for (const [x0, y0, x1, y1] of [[8, 25, 6, 17], [17, 23, 18, 10], [24, 25, 27, 18]]) s.line(x0, y0, x1, y1, null, o.extra); },
  feather: (s, m, o) => { for (const [a, b, c, d] of [[6, 25, 18, 12], [11, 26, 25, 16], [17, 26, 26, 22]]) { s.line(a, b, c, d, m); s.line(a + 1, b, c + 1, d, m); for (let i = 1; i < 5; i++) { const x = Math.round(a + (c - a) * i / 5), y = Math.round(b + (d - b) * i / 5); s.fix(x + 1, y - 2, o.extra); s.fix(x + 2, y - 1, o.extra); } } },
  rings: (s, m, o) => [[10, 18, 3.6], [20, 22, 4], [22, 12, 2.4]].forEach(([x, y, r]) => { s.ell(x, y, r, r, m); s.ell(x, y, r * .5, r * .5, rp(o.extra), { flat: true }); })
};
function rockSprite(id) {
  const o = ORE[id]; if (!o) return null; const s = Spr(32, 32), m = ramp(o.col, { gl: .8 });
  if (o.style === 'coal') { /* a heap of coal lumps, no host rock, each catching a cold sheen */ const c = rp('#4a4650'), c2 = rp('#36323a');
    [[7, 24, 6.5, 5.5, c2], [23, 24, 7.5, 5.5, c2], [15, 17, 7.5, 7, c], [8, 15, 4.5, 4.5, c], [24, 14, 4.5, 4.5, c], [15, 26, 6.5, 4.5, c], [19, 8, 3.5, 3.5, c2]].forEach(([x, y, a, b, r]) => blob(s, x + .5, y + .5, a, b, r));
    for (let x = 0; x < 32; x++) for (let y = 30; y < 32; y++) s.erase(x, y);
    for (const [x, y] of [[12, 13], [6, 12], [21, 11], [18, 6], [11, 22], [20, 21], [4, 21]]) { s.fix(x, y, '#c8d0e0'); s.fix(x + 1, y, '#7a8090'); s.fix(x, y + 1, '#7a8090'); } return s; }
  if (o.style === 'nugget') { /* a pale quartz boulder split by a seam of gold, nuggets bulging from it */ const rock = rp('#9a8a76'); boulder(s, rock, 'd');
    crack(s, rock, [[8, 28], [12, 20], [17, 16], [22, 8]]); [[11, 22, 3.4], [17, 16, 3.8], [22, 23, 2.6], [21, 11, 2], [9, 27, 1.8]].forEach(([x, y, r]) => nodule(s, x, y, r, m, '#fff8d0')); return s; }
  const rock = rp(o.rock); boulder(s, rock, SHAPE[id] || 'a');
  const sh = SHAPE[id] || 'a', lo = (x, y) => s.at(x, y) && s.tone(x, y, rock, 1);
  for (const [x, y] of { a: [[13, 28], [13, 27], [14, 26]], b: [[20, 28], [20, 27], [21, 26]], c: [[17, 28], [18, 27], [18, 26]], d: [[11, 28], [11, 27], [12, 26]] }[sh]) lo(x, y); /* a fissure up from the base */
  (ROCKSTYLE[o.style] || ROCKSTYLE.nodules)(s, m, o, rock);
  return s;
}

/* ================= Fish (32 x 16): side-on, head to the right ================= */
/* len and dep in sprite pixels; peak: where the body is deepest (0 tail .. 1 nose); nose: bluntness; hump: a high back */
const FISHV = {
  sardine: { len: 24, dep: 6, body: '#8aa4c4', belly: '#e8eef4', tail: 'fork', marks: 'dots' },
  herring: { len: 25, dep: 7, body: '#5f82ae', belly: '#e0e8f0', tail: 'fork', marks: 'sheen' },
  trout: { len: 25, dep: 8, body: '#8c8a56', belly: '#f0dcb0', tail: 'square', marks: 'spots', stripe: '#e0907e' },
  salmon: { len: 26, dep: 8, body: '#9aaab8', belly: '#f4cab4', tail: 'fork', hook: true, stripe: '#e8907a', marks: 'xs' },
  tuna: { len: 26, dep: 10, body: '#33548e', belly: '#dce4ec', tail: 'crescent', finlets: '#f0d060', peak: .55 },
  swordfish: { len: 22, dep: 7, body: '#4e7098', belly: '#dce4ea', tail: 'crescent', bill: true, sail: true },
  monkfish: { len: 24, dep: 10, body: '#86704e', belly: '#c8b48c', tail: 'round', nose: .9, peak: .8, marks: 'mottle', teeth: true, flat: true },
  shark: { len: 27, dep: 8, body: '#6a8296', belly: '#eceff0', tail: 'shark', fin: 'tall', gills: 3 },
  anglerfish: { len: 21, dep: 11, body: '#5e4e34', belly: '#9a8456', tail: 'round', lure: true, teeth: true, nose: .8, peak: .7 },
  carp: { len: 25, dep: 10, body: '#cc9442', belly: '#f0d8a0', tail: 'fork', marks: 'scales', barbel: true, hump: .25 },
  pike: { len: 28, dep: 6, body: '#748f42', belly: '#dedca8', tail: 'fork', marks: 'spots', snout: true, fin: 'back' },
  skyfin: { len: 23, dep: 7, body: '#6abcec', belly: '#eaf8ff', tail: 'fork', wings: true },
  voideel: { eel: true, len: 29, body: '#5a3a9a', belly: '#9a7ad8', glow: '#e0c8ff' },
  minnow: { len: 18, dep: 5, body: '#9cab94', belly: '#ecf0e0', tail: 'fork', stripe: '#4e5e46' },
  perch: { len: 23, dep: 9, body: '#9aaa44', belly: '#ece4a4', tail: 'square', marks: 'bars', fin: 'spiky', finCol: '#e0643a', hump: .2 },
  bream: { len: 23, dep: 12, body: '#b4a474', belly: '#f0e4c4', tail: 'fork', marks: 'scales', hump: .3, peak: .5 },
  mackerel: { len: 26, dep: 7, body: '#2e7484', belly: '#e4f0f2', tail: 'crescent', marks: 'waves', finlets: '#e8e8a0' },
  flounder: { len: 22, dep: 11, body: '#86765a', belly: '#c8b890', tail: 'round', skirt: true, marks: 'rings', peak: .45, nose: .15 },
  catfish: { len: 27, dep: 8, body: '#56564a', belly: '#aca484', tail: 'round', whiskers: true, nose: .9, peak: .75 },
  char: { len: 25, dep: 7, body: '#52667a', belly: '#ec6c4a', tail: 'fork', marks: 'spots', finEdge: '#ffffff' },
  grayling: { len: 25, dep: 7, body: '#848a9c', belly: '#dedee6', tail: 'fork', sail: true, sailCol: '#c86a9a' },
  bogpuffer: { len: 19, dep: 12, body: '#768a46', belly: '#dcdca4', tail: 'round', spines: true, nose: .8, peak: .5 },
  bogray: { ray: 5, body: '#56685a', belly: '#b8c0a8' },
  cinderfish: { len: 25, dep: 8, body: '#3a2a2a', belly: '#e8603a', tail: 'shark', glowspots: '#ffb04a', fin: 'tall' },
  basaltjaw: { len: 24, dep: 11, body: '#4a4a54', belly: '#8a8a94', tail: 'square', teeth: true, fin: 'tall', nose: .85, plates: true, plateCol: '#e8603a' },
  stormray: { ray: 7, body: '#5e82b8', belly: '#dfe8f8', zap: '#fff6a0' },
  ghostfin: { len: 24, dep: 7, body: '#c4cce6', belly: '#f2f6ff', tail: 'veil', glow: '#ffffff', fin: 'veil' }
};
const EYE = '#1e1418', SHINE = '#fffaf0';
function fishNode(id) {
  const s = Spr(32, 16);
  if (id === 'shrimp') { /* a curled prawn, segments catching the light, long feelers */ const b = rp('#f0a07a'), b2 = rp('#e88a64');
    for (let i = 0; i < 11; i++) { const a = Math.PI * (.08 + i / 13), x = 15 + Math.cos(a) * 9, y = 10 - Math.sin(a) * 6; blob(s, x, y, 2.4 - i * .06, 2.6, i % 2 ? b2 : b); }
    s.poly([[6, 11], [2, 14], [7, 14]], b2); s.poly([[6, 11], [3, 9], [5, 13]], b2);
    for (const [x0, y0, x1, y1] of [[24, 7, 31, 1], [24, 8, 31, 5]]) s.line(x0, y0, x1, y1, null, '#c86a4a');
    for (let i = 0; i < 4; i++) s.line(12 + i * 3, 13, 11 + i * 3, 15, null, '#c86a4a');
    s.fix(23, 6, EYE); s.fix(22, 6, '#3a2420'); return s; }
  if (id === 'lobster') { /* side-on: a fanned tail, banded abdomen, the carapace, a crusher claw held forward, long feelers */
    const b = rp('#b04236'), d = rp('#7e2a2a'), pale = rp('#e8907a');
    s.poly([[0, 6], [4, 8.5], [4, 11.5], [0, 14], [1, 10]], d);
    for (const x of [6, 9, 12]) blob(s, x, 10, 2, 2.8, b); blob(s, 15, 9.5, 2.2, 3, b);
    blob(s, 20, 8.5, 4.6, 3.6, b); s.poly([[24, 7], [27, 8], [24, 9]], b);
    for (const [x0, x1] of [[17, 16], [19, 19], [21, 22]]) s.line(x0, 11, x1, 14, d);
    s.line(21, 11, 24, 12, b); s.line(21, 12, 24, 13, b); blob(s, 26.5, 12.5, 2.4, 2, b);
    s.poly([[27, 10], [31, 10], [29, 12]], b); s.poly([[27, 14], [31, 15], [29, 13]], d);
    for (const x of [6, 9, 12, 15]) s.fix(x, 12, pale.base);
    s.line(24, 7, 31, 1, null, '#d86a4a'); s.line(23, 6, 28, 0, null, '#c85a3a'); s.fix(23, 7, EYE); s.fix(22, 7, '#3a1a1a'); return s; }
  const sp = FISHV[id]; if (!sp) return null;
  const body = rp(sp.body), belly = rp(sp.belly), fin = rp(sp.finCol || mix(sp.body, '#3a2448', .3)), cy = 8;
  if (sp.ray) { /* a ray from above: wide diamond wings, a pale underside showing at the edge, a whip tail */
    const W = sp.ray * 1.8 + 2, H = sp.ray * 1.05, cx = 19;
    for (let y = Math.floor(cy - H); y <= Math.ceil(cy + H); y++) for (let x = 0; x < 32; x++) { const nx = (x + .5 - cx) / (x < cx ? W : W * .6), ny = (y + .5 - cy) / H; if (Math.abs(nx) + Math.abs(ny) * 1.05 > 1) continue; s.tone(x, y, body, sphere(nx * .7, ny)); }
    s.line(cx - W, cy, 1, cy + 2, fin); s.line(cx - W + 1, cy + 1, 2, cy + 3, fin); blob(s, cx + 1, cy, 3, 2, body);
    s.fix(cx + 4, cy - 1, EYE); s.fix(cx + 4, cy + 1, EYE); s.fix(cx + 3, cy - 1, SHINE);
    if (sp.zap) for (const [x, y] of [[cx - 6, cy - 2], [cx - 5, cy - 3], [cx - 4, cy - 2], [cx - 3, cy - 3], [cx + 2, cy + 3], [cx + 3, cy + 4]]) s.fix(x, y, sp.zap);
    else for (const [x, y] of [[cx - 4, cy - 2], [cx - 2, cy + 2], [cx + 1, cy - 3], [cx - 6, cy + 1]]) s.fix(x, y, belly.base);
    return s; }
  if (sp.eel) { /* a long wave of a body with a glowing lateral line */
    for (let x = 1; x <= 30; x++) { const y = cy + Math.sin((x - 2) / 3.4) * 2.4, h = x < 4 ? 1 : x > 27 ? 1.6 : 2; for (let yy = Math.round(y - h); yy <= Math.round(y + h); yy++) s.tone(x, yy, yy > y + .5 ? belly : body, yy < y - 1 ? 3 : yy > y + 1 ? 1 : 2); }
    for (let x = 3; x < 27; x++) { const y = cy + Math.sin((x - 2) / 3.4) * 2.4; if (x % 4 === 0) s.fix(x, Math.round(y), sp.glow); }
    const ey = Math.round(cy + Math.sin(26 / 3.4) * 2.4) - 1; s.fix(28, ey, '#ffffff'); s.fix(28, ey + 1, EYE); return s; }
  const L = sp.len, H = sp.dep / 2, x1 = 30 - (sp.bill ? 6 : sp.snout ? 1 : 0) - (sp.whiskers ? 2 : 0), x0 = x1 - L + 1, peak = sp.peak || .62, nose = sp.nose ?? .35, hump = sp.hump || 0;
  const half = t => t < peak ? .3 + .7 * Math.sin(t / peak * Math.PI / 2) : nose + (1 - nose) * Math.sqrt(Math.max(0, 1 - ((t - peak) / (1 - peak)) ** 2));
  const rows = [];
  for (let x = x0; x <= x1; x++) { const t = (x - x0 + .5) / L, h = H * half(t), top = cy - h * (1 + hump * Math.sin(t * Math.PI)), bot = cy + h * (sp.flat ? .7 : 1); rows.push([x, top, bot]);
    for (let y = Math.round(top); y <= Math.round(bot) - 1 + (bot - Math.round(bot) > .2 ? 1 : 0); y++) { const ny = ((y + .5) - (top + bot) / 2) / ((bot - top) / 2 || 1), nx = (t - .6) * 1.2;
      const isBelly = ny > .3; s.tone(x, y, isBelly ? belly : body, isBelly ? (ny > .75 ? 2 : 3) : sphere(nx, Math.max(-1, Math.min(1, ny * .9)))); } }
  const topAt = x => { const r = rows.find(q => q[0] === Math.round(x)); return r ? Math.round(r[1]) : cy; }, botAt = x => { const r = rows.find(q => q[0] === Math.round(x)); return r ? Math.round(r[2]) : cy; };
  /* tail */
  const tx = x0, tt = Math.max(2, Math.round(H * .9));
  const tails = {
    fork: [[tx + 1, cy - 1], [tx - 4, cy - tt - 1], [tx - 2, cy], [tx - 4, cy + tt + 1], [tx + 1, cy + 1]],
    square: [[tx + 1, cy - 1], [tx - 3, cy - tt], [tx - 3, cy + tt], [tx + 1, cy + 1]],
    crescent: [[tx + 1, cy - 1], [tx - 3, cy - tt - 2], [tx - 2, cy], [tx - 3, cy + tt + 2], [tx + 1, cy + 1]],
    shark: [[tx + 1, cy - 1], [tx - 4, cy - tt - 3], [tx - 2, cy], [tx - 2, cy + tt], [tx + 1, cy + 1]],
    veil: [[tx + 1, cy - 1], [tx - 5, cy - tt - 2], [tx - 4, cy], [tx - 6, cy + tt + 3], [tx + 1, cy + 1]] };
  if (sp.tail === 'round') blob(s, tx - 1.5, cy + .5, 3, tt * .75 + .5, fin); else s.poly(tails[sp.tail] || tails.fork, sp.tail === 'veil' ? rp(mix(sp.body, '#ffffff', .4)) : fin);
  if (sp.tail === 'fork' || sp.tail === 'crescent') s.tone(tx - 2, cy - tt, fin, 3);
  /* fins */
  const mid = x0 + L * .5, tp = x => topAt(x);
  if (sp.fin === 'tall') s.poly([[mid - 3, tp(mid - 3) + 1], [mid, tp(mid) - 5], [mid + 3, tp(mid + 3) + 1]], fin);
  else if (sp.sail) s.poly([[x0 + L * .25, tp(x0 + L * .25) + 1], [x0 + L * .38, tp(x0 + L * .38) - 4], [x0 + L * .7, tp(x0 + L * .7) - 2], [x0 + L * .75, tp(x0 + L * .75) + 1]], sp.sailCol ? rp(sp.sailCol) : fin);
  else if (sp.fin === 'spiky') { for (let i = 0; i < 5; i++) { const x = Math.round(x0 + L * .4 + i * 1.6); s.line(x, tp(x), x + 1, tp(x) - 3, fin); } }
  else if (sp.fin === 'back') s.poly([[x0 + 3, tp(x0 + 3) + 1], [x0 + 5, tp(x0 + 5) - 3], [x0 + 8, tp(x0 + 8) + 1]], fin);
  else if (sp.fin === 'veil') s.poly([[x0 + L * .3, tp(x0 + L * .3) + 1], [x0 + L * .4, tp(x0 + L * .4) - 4], [x0 + L * .65, tp(x0 + L * .65) + 1]], rp(mix(sp.body, '#ffffff', .4)));
  else if (sp.skirt) { for (let x = x0 + 2; x < x1 - 2; x++) { s.dot(x, tp(x) - 1, fin); s.dot(x, botAt(x), fin); } }
  else s.poly([[x0 + L * .38, tp(x0 + L * .38) + 1], [x0 + L * .48, tp(x0 + L * .48) - 2], [x0 + L * .62, tp(x0 + L * .62) + 1]], fin);
  if (!sp.skirt) s.poly([[x0 + L * .3, botAt(x0 + L * .3)], [x0 + L * .38, botAt(x0 + L * .38) + 2], [x0 + L * .48, botAt(x0 + L * .48)]], fin);
  if (sp.finEdge) { s.fix(Math.round(x0 + L * .38), botAt(x0 + L * .38) + 1, sp.finEdge); s.fix(Math.round(x0 + L * .38) + 1, botAt(x0 + L * .38) + 1, sp.finEdge); }
  if (sp.finlets) for (let i = 0; i < 3; i++) { const x = x0 + 3 + i * 2; s.fix(x, tp(x) - 1, sp.finlets); s.fix(x, botAt(x) + 1, sp.finlets); }
  /* markings */
  const hx = Math.round(x1 - Math.max(4, L * .22));
  const inBody = (x, y) => { const p = s.at(x, y); return p && (p.r === body || p.r === belly); };
  const mark = (x, y, c) => { if (inBody(x, y)) s.fix(x, y, c); };
  if (sp.marks === 'spots') for (let i = 0; i < 6; i++) mark(Math.round(x0 + 4 + i * (L - 10) / 6), cy - 2 + (i % 2) * 2, mix(sp.belly, '#ffffff', .25));
  if (sp.marks === 'dots') for (let i = 0; i < 4; i++) mark(Math.round(x0 + 7 + i * 3), cy - 1, body.out);
  if (sp.marks === 'xs') for (let i = 0; i < 4; i++) { const x = Math.round(x0 + 6 + i * 3.5); mark(x, cy - 2, body.out); mark(x + 1, cy - 3, body.out); }
  if (sp.marks === 'mottle') for (let i = 0; i < 7; i++) mark(Math.round(x0 + 4 + i * 2.6), cy - 2 + (i % 3), body.lo);
  if (sp.marks === 'scales') for (let x = x0 + 5; x < hx - 1; x += 2) for (let y = cy - 3; y <= cy + 1; y += 2) mark(x + ((y >> 1) & 1), y, body.lo);
  if (sp.marks === 'bars') for (let i = 0; i < 5; i++) { const x = Math.round(x0 + 5 + i * 3); for (let y = tp(x) + 1; y < cy + 2; y++) mark(x, y, body.out); }
  if (sp.marks === 'waves') for (let i = 0; i < 6; i++) { const x = x0 + 4 + i * 2; mark(x, tp(x) + 1 + (i % 2), body.out); mark(x, tp(x) + 2 + (i % 2), body.out); }
  if (sp.marks === 'rings') for (const [x, y] of [[x0 + 7, cy - 2], [x0 + 13, cy], [x0 + 10, cy + 2]]) { mark(x, y, body.lo); mark(x + 1, y, mix(sp.belly, '#ffffff', .2)); }
  if (sp.marks === 'sheen') for (let x = x0 + 4; x < hx - 2; x++) mark(x, cy - 1, mix(sp.body, '#bfe8ff', .5));
  if (sp.stripe) for (let x = x0 + 3; x < hx - 1; x++) mark(x, cy, sp.stripe);
  if (sp.glowspots) for (let i = 0; i < 5; i++) mark(Math.round(x0 + 4 + i * 3.4), cy + (i % 2 ? 1 : -1), sp.glowspots);
  if (sp.glow) for (const [x, y] of [[x0 + L * .35, cy - 1], [x0 + L * .55, cy - 2], [x0 + L * .7, cy]]) mark(Math.round(x), y, sp.glow);
  if (sp.plates) for (let x = x0 + 5; x < hx - 2; x += 6) for (let y = tp(x) + 2; y < cy + 3; y++) mark(x + ((y >> 1) & 1), y, (y + x) % 5 ? body.out : sp.plateCol);
  if (sp.spines) for (let i = 0; i < 9; i++) { const a = Math.PI * (i / 8), X = Math.round(x0 + L * .55 + Math.cos(a) * (L * .5)), Y = Math.round(cy - Math.sin(a) * (H + 1.6)); s.fix(X, Y, mix(sp.body, '#2a2010', .45)); }
  /* gills, pectoral fin, eye, mouth */
  for (let y = cy - Math.round(H * .5); y <= cy + Math.round(H * .45); y++) if (inBody(hx, y)) s.tone(hx, y, s.at(hx, y).r, 1);
  if (sp.gills) for (let g = 1; g < sp.gills; g++) for (let y = cy - 1; y <= cy + 1; y++) if (inBody(hx - g * 2, y)) s.tone(hx - g * 2, y, body, 1);
  s.poly([[hx - 1, cy + 1], [hx - 5, cy + 3], [hx - 2, cy + 3]], fin);
  const ex = x1 - Math.max(2, Math.round(L * .1)), ey = Math.round(cy - H * .35) - (sp.flat ? 1 : 0), big = sp.dep >= 9;
  s.fix(ex, ey, SHINE); s.fix(ex, ey + 1, EYE); if (big) { s.fix(ex + 1, ey, EYE); s.fix(ex + 1, ey + 1, EYE); }
  s.fix(x1, cy + 1, body.out);
  if (sp.hook) { s.fix(x1, cy + 1, body.lo); s.fix(x1 - 1, cy + 2, body.out); }
  if (sp.teeth) for (let i = 0; i < 3; i++) s.fix(x1 - i * 2, cy + 1 + (i % 2), SHINE);
  if (sp.barbel) { s.line(x1, cy + 2, x1 + 1, cy + 4, fin); }
  if (sp.whiskers) { s.line(x1, cy + 1, x1 + 2, cy + 4, fin); s.line(x1, cy, x1 + 2, cy - 2, fin); s.line(x1 - 1, cy + 2, x1, cy + 5, fin); }
  if (sp.bill) { s.line(x1 + 1, cy - 1, 31, cy - 1, rp('#3f5a74')); s.line(x1 + 1, cy, 27, cy, rp('#3f5a74')); }
  if (sp.snout) { s.dot(x1 + 1, cy, body); s.dot(x1 + 1, cy + 1, belly); }
  if (sp.wings) { s.poly([[x0 + L * .55, cy + 1], [x0 + L * .2, cy - 6], [x0 + L * .35, cy - 6], [x0 + L * .7, cy]], rp('#cdeeff')); }
  if (sp.lure) { s.line(x1 - 4, topAt(x1 - 4), x1 - 1, 1, rp('#5a4a2a')); s.fix(x1, 1, '#fff6a0'); s.fix(x1, 0, '#fffbe0'); s.fix(x1 + 1, 1, '#e8c040'); }
  return s;
}

/* ================= Crops on the plots (16 x 16): soil, sprout, young plant, ripe ================= */
const SOIL = rp('#7b5a3c'), LEAF = rp('#6ea846'), LEAF2 = rp('#4e8a3a');
const leaf = (s, x, y, dx, dy, r = LEAF) => { s.line(x, y, x + dx, y + dy, r); s.dot(x + dx, y + dy - (dy < 0 ? 0 : 1), r); };
/* a small round shape centred on a pixel (odd width), for leaves, berries and fruit */
const disc = (s, x, y, rx, ry, r) => blob(s, x + .5, y + .5, rx + .35, ry + .35, r);
const CROP = {
  potato: { young: s => { clumps(s, [[5, 10, 3, 2.5], [11, 10, 3, 2.5], [8, 8, 3.5, 3]], LEAF); },
    ripe: (s, c) => { clumps(s, [[5, 9, 3.4, 2.8], [11, 9, 3.4, 2.8], [8, 6, 4, 3]], LEAF); for (const [x, y] of [[6, 5], [10, 6], [8, 3]]) { s.fix(x, y, '#f4f0e0'); s.fix(x + 1, y, '#e8d870'); } disc(s, 4, 12.5, 2, 1.6, rp(c)); disc(s, 12, 13, 2.2, 1.6, rp(c)); } },
  onion: { young: s => { for (const x of [6, 8, 10]) s.line(x, 12, x + (x - 8) * .3, 6, LEAF); },
    ripe: (s, c) => { for (const [x, top] of [[6, 2], [8, 1], [10, 3]]) { s.line(x, 10, x + (x - 8) * .5, top, LEAF); s.dot(x + 1, 9, LEAF2); } disc(s, 8, 10.5, 3.2, 3, rp(c)); s.fix(7, 10, '#fff6d8'); s.line(8, 9, 8, 13, null, rp(c).lo); } },
  cabbage: { young: s => { clumps(s, [[6, 10, 2.6, 2], [10, 10, 2.6, 2], [8, 9, 2, 2]], LEAF); },
    ripe: (s, c) => { clumps(s, [[3.5, 11, 3, 2.4], [12.5, 11, 3, 2.4]], LEAF2); blob(s, 8, 9, 5, 4.4, rp(c)); s.line(8, 6, 8, 12, null, rp(c).lo); s.line(5, 8, 7, 11, null, rp(c).lo); s.line(11, 8, 9, 11, null, rp(c).lo); } },
  wheat: { young: s => { for (const [x, d] of [[5, -1], [7, 0], [9, 1], [11, 1]]) s.line(x, 12, x + d, 6, LEAF); },
    ripe: (s, c) => { const g = rp(c); for (const [x, d, top] of [[4, -1, 3], [7, 0, 1], [10, 1, 2], [12, 1, 4]]) { s.line(x, 12, x + d, top + 4, rp('#c8b060')); for (let y = top; y < top + 4; y++) { s.dot(x + d, y, g); s.dot(x + d + 1, y, g); } s.fix(x + d, top - 1, mix(c, '#ffffff', .4)); } } },
  strawberry: { young: s => { for (const [x, y] of [[5, 9], [8, 8], [11, 9]]) blob(s, x, y, 2, 1.6, LEAF); },
    ripe: (s, c) => { clumps(s, [[4, 8, 2.8, 2.2], [8, 6, 3, 2.4], [12, 8, 2.8, 2.2]], LEAF); s.fix(8, 3, '#ffffff'); s.fix(9, 3, '#f0e060');
      for (const [x, y] of [[4, 12], [8, 11], [12, 12]]) { blob(s, x, y, 2, 2.2, rp(c)); s.fix(x - 1, y - 1, '#ffe0a0'); s.fix(x, y + 1, '#ffe070'); s.dot(x, y - 2, LEAF2); } } },
  pumpkin: { young: s => { s.line(3, 12, 13, 11, LEAF2); disc(s, 5, 8, 2.4, 2, LEAF); disc(s, 11, 7, 2.4, 2, LEAF); },
    ripe: (s, c) => { disc(s, 3, 7, 2.4, 2, LEAF); s.line(2, 11, 14, 10, LEAF2); const p = rp(c); blob(s, 9, 10.5, 5.4, 3.8, p); for (const x of [7, 9, 11]) s.line(x, 8, x, 13, null, p.lo); s.rect(9, 5, 2, 2, rp('#6a7a3a')); } },
  goldleaf: { young: s => { s.line(8, 12, 8, 7, LEAF2); leaf(s, 8, 9, -3, -2); leaf(s, 8, 8, 3, -2); },
    ripe: (s, c) => { const g = ramp(c, { gl: .85 }); s.line(8, 12, 8, 3, LEAF2); for (const [x, y, dx] of [[8, 10, -4], [8, 9, 4], [8, 7, -3], [8, 6, 3], [8, 4, -2]]) { s.line(x, y, x + dx, y - 2, g); s.line(x + Math.sign(dx), y, x + dx, y - 1, g); } s.fix(5, 7, '#fffbe0'); s.fix(11, 6, '#fffbe0'); s.fix(8, 2, '#fffbe0'); } },
  sunbloom: { young: s => { s.line(8, 12, 8, 5, LEAF2); leaf(s, 8, 9, -3, -1); leaf(s, 8, 8, 3, -1); blob(s, 8, 4, 1.6, 1.6, LEAF); },
    ripe: (s, c) => { s.line(8, 13, 8, 7, LEAF2); s.dot(9, 13, LEAF2); leaf(s, 8, 11, -3, -1); leaf(s, 8, 10, 3, -1); const p = rp(c);
      for (let i = 0; i < 10; i++) { const a = i * Math.PI / 5; blob(s, 8 + Math.cos(a) * 3.6, 4.5 + Math.sin(a) * 3.2, 1.6, 1.6, p); } blob(s, 8, 4.5, 2.4, 2.2, rp('#7a4a24')); s.fix(7, 4, '#a8743a'); } },
  moonmelon: { young: s => { s.line(3, 12, 13, 11, LEAF2); disc(s, 5, 8, 2.4, 2, LEAF); disc(s, 11, 8, 2, 1.8, LEAF); },
    ripe: (s, c) => { s.line(1, 11, 14, 9, LEAF2); disc(s, 3, 7, 2.2, 1.8, LEAF); const m = ramp(c, { gl: .85 }); blob(s, 9, 10, 5, 3.8, m); for (const x of [6, 9, 12]) s.line(x, 8, x - 1, 12, null, mix(c, '#4a6aa8', .45)); s.fix(7, 8, '#ffffff'); s.fix(13, 6, '#e8f0ff'); } },
  starfruit: { young: s => { s.line(8, 12, 8, 6, rp('#7a5a3a')); disc(s, 5, 5, 2.4, 2, LEAF); disc(s, 10, 4, 2.4, 2, LEAF); },
    ripe: (s, c) => { s.line(8, 13, 8, 7, rp('#7a5a3a')); clumps(s, [[5, 6, 3.4, 2.8], [11, 5, 3.4, 2.8], [8, 3, 3, 2.4]], LEAF2); const st = ramp(c, { gl: .9 });
      for (const [cx, cy] of [[4, 9], [12, 9], [8, 7]]) { const pts = []; for (let i = 0; i < 10; i++) { const r = i % 2 ? 1 : 2.6, a = -Math.PI / 2 + i * Math.PI / 5; pts.push([cx + .5 + Math.cos(a) * r, cy + .5 + Math.sin(a) * r]); } s.poly(pts, st); s.fix(cx, cy, '#ffffff'); } } }
};
function plantSprite(stage, cropId) {
  const s = Spr(16, 16), c = (D.CROPS.find(x => x.id === cropId) || {}).col || '#8fcf6a', k = CROP[cropId];
  if (cropId && !k) return null;
  blob(s, 8, 13.5, 7.5, 2.6, SOIL); for (let x = 3; x < 13; x += 3) s.tone(x, 13, SOIL, 1);
  if (stage <= 0 || !cropId) { for (const [x, y] of [[5, 12], [8, 12], [11, 12]]) { s.fix(x, y, '#3a2618'); s.fix(x + 1, y, '#5a3e28'); } return s; }
  if (stage === 1) { s.line(8, 12, 8, 9, LEAF2); blob(s, 6, 8.5, 2, 1.4, LEAF); blob(s, 10.5, 8, 2, 1.4, LEAF); return s; }
  (stage === 2 ? k.young : k.ripe)(s, c);
  return s;
}

/* ================= House furniture (16 x 16) ================= */
const W = rp('#9b6a3e'), WL = rp('#c08a52'), WD = rp('#6a4428'), IRON = ramp('#8a929c', { gl: .7 }), STONE = rp('#8a8580'), BRASS = ramp('#e6b84a', { gl: .78 }), FIRE = ramp('#ff8a3a', { gl: .9 }), CLOTH = rp('#a8483a'), LINEN = rp('#efe6d0');
const FURNV = {
  fireplace: s => { s.rect(1, 3, 14, 12, STONE); for (const [x, y] of [[3, 5], [8, 4], [12, 6], [2, 9], [13, 10]]) s.tone(x, y, STONE, 1); s.rect(0, 2, 16, 2, W); s.rect(4, 8, 8, 7, rp('#2a1c1c'));
    s.poly([[5, 15], [7, 9], [8, 12], [9, 8], [11, 15]], FIRE); s.fix(8, 13, '#fff2a0'); s.fix(7, 12, '#ffd060'); s.rect(4, 14, 8, 1, WD); },
  bookshelf: s => { s.rect(1, 0, 14, 16, WD); for (const y of [1, 6, 11]) { s.rect(2, y, 12, 4, rp('#2a1c18'));
      ['#a8403a', '#3a64a8', '#5a9a4a', '#e0b048', '#8a5aa8', '#c87a3a'].forEach((c, i) => { const h = 3 + ((i + y) % 2); if (i * 2 + 2 < 14) s.rect(2 + i * 2, y + 4 - h, 2, h, rp(c)); }); } },
  rug: s => { blob(s, 8, 10, 7.5, 4.5, CLOTH, { flat: true }); blob(s, 8, 10, 5.5, 3, rp('#e6c86a'), { flat: true }); blob(s, 8, 10, 3, 1.5, rp('#3a5a8a'), { flat: true }); for (const x of [1, 15]) for (let y = 8; y <= 12; y += 2) s.fix(x, y, '#e6c86a'); },
  range: s => { s.rect(1, 5, 14, 10, IRON); s.rect(1, 4, 14, 2, ramp('#b8c0c8', { gl: .75 })); s.rect(3, 8, 6, 5, rp('#2a1c1c')); s.poly([[4, 12], [6, 9], [8, 12]], FIRE); s.rect(11, 0, 3, 5, IRON); s.rect(10, 8, 3, 2, BRASS); blob(s, 6, 3, 2.4, 1.4, IRON); },
  larder: s => { s.rect(2, 0, 12, 16, W); s.rect(3, 1, 4, 14, WL); s.rect(9, 1, 4, 14, WL); s.fix(7, 8, BRASS.base); s.fix(8, 8, BRASS.base); s.rect(3, 4, 4, 1, WD); s.rect(9, 4, 4, 1, WD); s.rect(3, 11, 4, 1, WD); s.rect(9, 11, 4, 1, WD); },
  spicerack: s => { s.rect(0, 5, 16, 2, W); s.rect(0, 12, 16, 2, W); ['#c8483c', '#e6b84a', '#7ab04a', '#8a5a3a', '#e8e0d0'].forEach((c, i) => { const x = 1 + i * 3; s.rect(x, 2, 2, 3, rp(c)); s.fix(x, 1, '#c8b8a0'); s.rect(x, 9, 2, 3, rp(['#5a8a4a', '#d88a3a', '#a83a3a', '#e0d090', '#6a5a8a'][i])); s.fix(x, 8, '#c8b8a0'); }); },
  bed: s => { s.rect(0, 7, 16, 6, W); s.rect(0, 3, 3, 12, WD); s.rect(13, 6, 3, 9, WD); s.rect(3, 6, 4, 3, LINEN); s.rect(6, 7, 8, 4, rp('#3f6fb0')); for (let x = 7; x < 14; x += 2) s.tone(x, 7, rp('#3f6fb0'), 4); },
  chest: s => { s.rect(1, 7, 14, 8, W); s.poly([[1, 7], [2, 3], [14, 3], [15, 7]], WL); s.rect(1, 7, 14, 1, IRON); for (const x of [3, 12]) s.rect(x, 3, 1, 12, IRON); s.rect(7, 7, 2, 3, BRASS); },
  wardrobe: s => { s.rect(7, 13, 2, 3, W); s.rect(4, 15, 8, 1, W); s.line(8, 1, 8, 13, W); blob(s, 8, 3, 3, 2.4, IRON); s.rect(4, 5, 8, 7, IRON); s.rect(2, 5, 3, 3, IRON); s.rect(11, 5, 3, 3, IRON); s.line(8, 6, 8, 11, null, IRON.lo); s.fix(6, 3, '#1e1418'); s.fix(10, 3, '#1e1418'); },
  workbench: s => { s.rect(0, 7, 16, 3, WL); s.rect(1, 10, 2, 6, W); s.rect(13, 10, 2, 6, W); s.rect(1, 13, 14, 1, W); s.line(3, 6, 8, 6, IRON); s.rect(10, 4, 4, 3, W); s.fix(11, 4, '#d8c8a8'); s.line(5, 4, 7, 6, rp('#c8b890')); },
  anvil: s => { s.poly([[1, 4], [12, 4], [15, 5], [12, 7], [10, 7], [10, 9], [5, 9], [5, 7], [3, 7]], IRON); s.rect(4, 9, 7, 2, IRON); s.rect(3, 11, 9, 4, rp('#6a4a30')); s.fix(2, 4, '#e8eef4'); s.fix(12, 2, '#ffb04a'); s.fix(13, 1, '#ffd060'); },
  toolrack: s => { s.rect(0, 2, 16, 2, W); s.line(3, 4, 3, 14, W); s.poly([[1, 4], [5, 4], [5, 6], [3, 7]], IRON); s.line(8, 4, 8, 15, W); for (let i = 0; i < 4; i++) s.dot(6 + i, 13 + (i % 2), IRON); s.line(12, 4, 12, 14, W); s.poly([[10, 12], [14, 12], [13, 15], [11, 15]], IRON); },
  compost: s => { s.rect(1, 6, 14, 9, W); for (const y of [8, 11]) s.line(1, y, 14, y, null, WD.base); blob(s, 8, 6, 6.5, 3, SOIL); s.fix(5, 4, '#7ab04a'); s.fix(6, 4, '#5a8a3a'); s.fix(10, 5, '#e0a040'); s.fix(11, 4, '#c8483c'); },
  trough: s => { s.poly([[0, 6], [16, 6], [14, 12], [2, 12]], W); s.rect(2, 6, 12, 2, rp('#4f8fc0')); s.fix(4, 6, '#d8eef8'); s.rect(2, 12, 2, 3, WD); s.rect(12, 12, 2, 3, WD); },
  planter: s => { s.rect(0, 9, 16, 6, W); s.rect(1, 9, 14, 2, SOIL); for (const x of [3, 8, 13]) { s.line(x, 9, x, 5, LEAF2); blob(s, x, 5, 1.6, 1.6, LEAF); } s.fix(8, 4, '#e48aa8'); s.line(0, 12, 15, 12, null, WD.base); },
  cot: s => { for (const y of [3, 10]) { s.rect(1, y, 14, 2, W); s.rect(2, y - 1, 3, 1, LINEN); s.rect(5, y - 1, 9, 1, rp('#8a6a9a')); } s.rect(0, 0, 2, 16, WD); s.rect(14, 0, 2, 16, WD); },
  noticeboard: s => { s.rect(1, 1, 14, 10, W); s.rect(2, 2, 12, 8, rp('#c8a86a')); s.rect(3, 3, 4, 5, LINEN); s.rect(8, 3, 5, 3, LINEN); s.rect(9, 7, 3, 2, rp('#f0d890')); s.fix(5, 3, '#c8483c'); s.fix(10, 3, '#3a64a8'); s.rect(3, 11, 2, 5, WD); s.rect(11, 11, 2, 5, WD); },
  strongbox: s => { s.rect(1, 5, 14, 10, IRON); s.rect(1, 5, 14, 3, ramp('#b8c0c8', { gl: .75 })); for (const x of [3, 12]) s.line(x, 5, x, 14, null, IRON.lo); for (const [x, y] of [[2, 9], [13, 9], [2, 13], [13, 13]]) s.fix(x, y, '#e8eef4'); s.rect(6, 9, 4, 4, BRASS); s.fix(7, 10, '#3a2a10'); s.fix(7, 11, '#3a2a10'); },
  mounts: s => { s.poly([[3, 2], [13, 2], [14, 9], [8, 14], [2, 9]], W); const b = rp('#8a6a4a'); blob(s, 8, 8, 3.6, 3.2, b); s.poly([[5, 6], [2, 1], [6, 4]], rp('#efe2c4')); s.poly([[11, 6], [14, 1], [10, 4]], rp('#efe2c4')); s.fix(7, 8, '#ff6a3a'); s.fix(9, 8, '#ff6a3a'); blob(s, 8, 11, 1.8, 1.2, rp('#d8a890')); },
  display: s => { s.rect(1, 3, 14, 11, rp('#5a7a8a')); s.rect(2, 4, 12, 9, rp('#2a3a44')); s.poly([[5, 12], [8, 6], [11, 12]], BRASS); s.fix(8, 8, '#ffffff'); blob(s, 4, 11, 1.4, 1.4, rp('#d84a5a')); blob(s, 12, 11, 1.4, 1.4, rp('#4a8ad8')); s.rect(1, 14, 14, 2, W); s.rect(1, 2, 14, 1, W); s.fix(3, 5, '#e8f6ff'); s.fix(4, 5, '#a8c8d8'); },
  banner: s => { s.rect(1, 1, 14, 2, W); s.fix(0, 1, BRASS.base); s.fix(15, 1, BRASS.base); s.poly([[3, 3], [13, 3], [13, 14], [8, 11], [3, 14]], CLOTH); s.poly([[8, 5], [10, 7], [8, 9], [6, 7]], BRASS); s.line(3, 4, 3, 12, null, CLOTH.hi); }
};
/* anything not drawn above keeps its family picture from pixel_world.js */
function furnitureSprite(id) { const f = FURNV[id]; if (!f) return null; const s = Spr(16, 16); f(s); return s; }

/* ================= Hired workers (32 x 32): dressed for the trade, holding its tool ================= */
const WORKER = {
  fishing: { spec: { cloth: '#3f6f9f', hat: 'cap', hatCol: '#e0c060', skin: '#d8a070' }, tool: s => { s.line(23, 26, 30, 2, R.wood); s.line(24, 26, 31, 3, R.woodLight); s.line(30, 2, 31, 14, null, '#e8dcc0'); blob(s, 30.5, 17, 1.6, 2.6, rp('#9fb2c8')); s.fix(31, 15, EYE); } },
  woodcutting: { spec: { cloth: '#7a5a3a', hat: 'cap', hatCol: '#c8483c', beard: '#6a4a2a', skin: '#e0b088' }, tool: s => { s.line(23, 27, 23, 11, R.wood); s.line(24, 27, 24, 11, R.wood); s.poly([[24, 10], [30, 8], [31, 12], [30, 16], [24, 14]], IRON); s.tone(30, 9, IRON, 4); s.line(31, 11, 31, 14, null, '#e8eef4'); } },
  mining: { spec: { cloth: '#5e6270', hat: 'helm', hatCol: '#e0b040', skin: '#c88a6a' }, tool: s => { s.line(23, 27, 26, 11, R.wood); s.line(24, 27, 27, 11, R.wood); for (let i = 0; i <= 12; i++) { const t = i / 12, x = 20 + Math.round(11 * t), y = 13 - Math.round(Math.sin(t * Math.PI) * 4); s.dot(x, y, IRON); s.dot(x, y + 1, IRON); } s.fix(31, 13, '#e8eef4'); s.fix(18, 5, '#fff2a0'); } },
  farming: { spec: { cloth: '#a87a3a', hat: 'straw', skin: '#d8a070' }, tool: s => { s.line(23, 28, 25, 6, R.wood); s.line(24, 28, 26, 6, R.wood); s.poly([[23, 5], [30, 5], [30, 7], [25, 8]], IRON); } }
};
function workerFigure(skill) { const w = WORKER[skill]; if (!w || !A.humanoid) return null; const s = A.humanoid(Object.assign({}, w.spec)); w.tool(s); return s; }

/* ================= Thieving marks that are things, not people (32 x 32) =================
   The townsfolk marks are chibis from pixel_creatures.js; the stalls, the cauldron, the hoard and the vault are drawn
   here as solid outlined objects standing on the same ground line (rows 29-30). */
const awning = (s, y, a, b) => { for (let x = 3; x < 29; x++) { const r = ((x - 3) >> 2) % 2 ? a : b, scal = ((x - 3) % 4 === 0 || (x - 3) % 4 === 3) ? 0 : 1; for (let j = y; j < y + 6 + scal; j++) s.dot(x, j, r); }
  s.rect(3, y - 1, 26, 1, rp('#6a4428')); };
const stall = (s, a, b) => { const w = W, wl = WL; s.rect(5, 11, 2, 19, w); s.rect(25, 11, 2, 19, w); awning(s, 6, a, b);
  s.rect(3, 18, 26, 3, wl); s.rect(4, 21, 24, 9, w); for (const y of [24, 27]) s.line(4, y, 27, y, null, WD.base); };
const MARKS = {
  merchant: s => { stall(s, rp('#3f6fd6'), rp('#f2ecdc')); s.rect(5, 16, 22, 2, rp('#e4f0f6'));
    for (const [x, c] of [[7, '#9fb2c8'], [13, '#d09a48'], [19, '#ef8a6e']]) { blob(s, x + 3, 16.5, 3.6, 1.6, rp(c)); s.poly([[x - 1, 15], [x + 1, 16.5], [x - 1, 18]], rp(c)); s.fix(x + 5, 16, EYE); } s.rect(23, 12, 4, 3, LINEN); s.fix(24, 13, '#3a2a1a'); s.fix(25, 13, '#3a2a1a'); },
  market: s => { stall(s, rp('#c8483c'), rp('#f2ecdc'));
    for (const [x, c] of [[8, '#e0405a'], [15, '#f0c040'], [22, '#7ab04a']]) { s.rect(x - 3, 15, 7, 3, rp('#b88a4a')); for (const [dx, dy] of [[-2, 0], [0, -1], [2, 0], [-1, -2], [1, -2]]) disc(s, x + dx, 14 + dy, 1.2, 1.2, rp(c)); } },
  witch: s => { const m = ramp('#4a4650', { gl: .7 }), brew = ramp('#7ad07a', { gl: .9 });
    for (const [x0, x1] of [[9, 7], [22, 24]]) s.line(x0, 24, x1, 30, m); for (const [x, y] of [[11, 30], [20, 30]]) s.rect(x - 2, y, 5, 1, rp('#6a4428'));
    s.poly([[11, 31], [13, 26], [16, 29], [19, 25], [21, 31]], FIRE); s.fix(16, 30, '#fff2a0');
    blob(s, 16, 20, 10.5, 7.5, m); s.rect(5, 13, 22, 3, m); blob(s, 16, 14, 9.5, 2, brew, { flat: true });
    for (const [x, y, r] of [[12, 12, 1.6], [19, 11, 2], [15, 9, 1.2], [21, 6, 1]]) disc(s, x, y, r, r, brew); s.fix(11, 11, '#e8ffe8'); s.fix(18, 10, '#e8ffe8');
    for (const [x, y] of [[9, 4], [10, 2], [23, 3]]) s.fix(x, y, '#b8e8b8'); },
  hoard: s => { const g = ramp('#e6b84a', { gl: .8 });
    blob(s, 16, 27.5, 14, 3.5, g); for (const [x, y] of [[4, 27], [8, 26], [25, 26], [28, 28], [12, 28], [20, 28]]) { disc(s, x, y, 1.6, 1, g); s.fix(x - 1, y - 1, '#fff6c8'); }
    s.rect(7, 13, 18, 13, W); s.poly([[7, 13], [9, 6], [23, 6], [25, 13]], WL); s.rect(7, 13, 18, 2, g); for (const x of [9, 22]) s.rect(x, 6, 2, 20, IRON); s.rect(14, 14, 4, 5, g); s.fix(15, 16, '#3a2a10');
    blob(s, 16, 7, 7, 3, g); for (const [x, y] of [[12, 5], [17, 4], [20, 6]]) s.fix(x, y, '#fff6c8'); disc(s, 13, 6, 1.2, 1.2, rp('#d84a5a')); disc(s, 20, 5, 1.2, 1.2, rp('#4ac8d8')); },
  vault: s => { const st = rp('#6a666e'), door = ramp('#8a929c', { gl: .72 });
    s.rect(2, 3, 28, 28, st); for (let y = 5; y < 31; y += 4) for (let x = 2 + ((y >> 2) % 2) * 3; x < 30; x += 6) s.tone(x, y, st, 1);
    blob(s, 16, 17, 11.5, 11.5, rp('#3a3840')); blob(s, 16, 17, 10, 10, door);
    for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4; s.fix(Math.round(16 + Math.cos(a) * 8.4 - .5), Math.round(17 + Math.sin(a) * 8.4 - .5), '#d8dee6'); }
    blob(s, 16, 17, 4, 4, BRASS); for (let i = 0; i < 4; i++) { const a = i * Math.PI / 2 + .4; s.line(16, 17, 16 + Math.cos(a) * 6.5, 17 + Math.sin(a) * 6.5, BRASS); } disc(s, 15.5, 16.5, 1.2, 1.2, rp('#5a4420')); }
};
function markSprite(id) { const f = MARKS[id]; if (!f) return null; const s = Spr(32, 32); f(s); return s; }

/* ================= wire in ================= */
const baseTree = A.treeSprite, baseRock = A.rockSprite;
A.treeSprite = id => treeSprite(id) || baseTree(id);
A.rockSprite = id => rockSprite(id) || baseRock(id);
A.TREE_V2 = T;
A.treeUrl = id => A.url('tree2:' + id, () => A.treeSprite(id));
A.rockUrl = id => A.url('rock2:' + id, () => A.rockSprite(id));
/* fishing spots: pixel_runtime.js asks A.fishLarge under the key 'fishnode:<id>' */
const baseFish = A.fishLarge; A.fishLarge = id => fishNode(id) || baseFish(id);
const basePlant = A.plantStage; A.plantStage = (stage, crop) => plantSprite(stage, crop) || basePlant(stage, crop);
A.plantUrl = (stage, crop) => A.url('plant2:' + stage + ':' + crop, () => A.plantStage(stage, crop));
const baseFurn = A.furnSprite; A.furnSprite = (id, ic) => furnitureSprite(id) || baseFurn(id, ic);
A.furnUrl = (id, ic) => A.url('furn2:' + id, () => A.furnSprite(id, ic));
const baseWorker = A.workerSprite; A.workerSprite = sk => workerFigure(sk) || baseWorker(sk);
A.workerUrl = sk => A.url('worker2:' + sk, () => A.workerSprite(sk));
/* the object marks only; every creature, townsperson and boss keeps its own drawing */
const baseCreature = A.creatureSprite, baseCreatureUrl = A.creatureUrl, isMark = id => MARKS[id] && (D.NODES.thieve || []).some(n => n.id === id);
if (baseCreature && baseCreatureUrl) { A.creatureSprite = id => (isMark(id) && markSprite(id)) || baseCreature(id); A.creatureUrl = id => isMark(id) ? A.url('mark2:' + id, () => markSprite(id)) : baseCreatureUrl(id); }
})();
