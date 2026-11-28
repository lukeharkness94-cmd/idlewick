/* Idlewick pixel art: the twelve regional mini-bosses at 64 x 64 for the combat stage (owner, 28 Nov 2026: they should
   match the new pixel redesign and Old Tusk's finish). Each keeps the character, palette and silhouette of its 32 x 32
   sprite (js/minibosses.js), designed afresh at the large size with the bosses' painter (js/pixel_bosses.js): materials
   as five-step ramps (cool shadows, warm lights), sphere-lit masses, edge light on flat shapes, the selective outline,
   then the face on top. Feet sit on the bottom rows so they stand on the stage's ground line; animals face right (the
   stage turns them to face the hero). Everything is original and drawn in code. */
(() => {
const Q = window.DQ, A = Q && Q.pixelArt; if (!A || !A.BossPainter || !A.BIG) return;
const P = A.BossPainter;
const pane = () => new P(64, 64);
/* a fixed five-step material (outline, shadow, base, light, highlight), for glows and sheens */
const steps = (s, a) => s.mat(a);
const glow = (s, c, hi = '#ffffff', core = '#fff6c0') => s.mat(['#0c0808', '#0c0808', c, core, hi]);
/* cylinder light for a material already laid down: each horizontal run is lit from its left */
const cyl = (s, m, bands = [[.12, 3], [.3, 4], [.48, 3], [.76, 2], [2, 1]]) => { for (let y = 0; y < s.h; y++) { let x = 0; while (x < s.w) { if (s.get(x, y) !== m) { x++; continue; } let e = x; while (e + 1 < s.w && s.get(e + 1, y) === m) e++;
  const n = e - x + 1; for (let i = x; i <= e; i++) { const f = n < 3 ? .5 : (i - x) / (n - 1); s.l[y * s.w + i] = bands.find(b => f < b[0])[1]; } x = e + 1; } } };
/* a two- or three-pixel limb from a to b, lit on its upper-left side */
const limb = (s, x0, y0, x1, y1, m, w = 3) => { const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0), 1); for (let i = 0; i <= n; i++) { const x = x0 + (x1 - x0) * i / n, y = y0 + (y1 - y0) * i / n;
  for (let a = 0; a < w; a++) for (let b = 0; b < w; b++) s.set(x + a - (w >> 1), y + b - (w >> 1), m, a === 0 || b === 0 ? 3 : a === w - 1 && b === w - 1 ? 1 : 2); } };
const tri = (s, x0, y0, x1, y1, x2, y2, m, lv) => s.poly([[x0, y0], [x1, y1], [x2, y2]], m, lv != null ? { flat: lv } : {});
/* a coloured rim light down the right-hand edge of some materials (a lantern's glow, lava below) between columns x0 and x1 */
const rim = (s, mats, y0, y1, x0, x1, c) => { for (let y = y0; y <= y1; y++) for (let x = x1; x >= x0; x--) { const m = s.get(x, y); if (m != null && mats.includes(m) && s.l[y * s.w + x] > 0) { s.fix(x, y, c); break; } } };
/* a tapered horn or spine along a path, base width w at the first point, lit on its edges */
const horn2 = (s, pts, w, m) => { const L = [], R = [], n = pts.length - 1; pts.forEach((p, i) => { const a = pts[Math.max(0, i - 1)], b = pts[Math.min(n, i + 1)], dx = b[0] - a[0], dy = b[1] - a[1], d = Math.hypot(dx, dy) || 1, h = w * (1 - i / n) / 2 + .3;
  L.push([p[0] - dy / d * h, p[1] + dx / d * h]); R.push([p[0] + dy / d * h, p[1] - dx / d * h]); }); s.poly(L.concat(R.reverse()), m); s.edges(m); };
const eyes2 = (s, k, pts) => { for (const [x, y] of pts) { s.dot(x, y, k, 3); s.dot(x + 1, y, k, 4); s.dot(x, y + 1, k, 2); s.dot(x + 1, y + 1, k, 2); } };

/* ================= Gnarlroot: the first apple tree of Mossbarrow, walked off on its roots ================= */
const gnarlroot = () => { const s = pane(), bark = s.mat('#7a5a3a', { cool: '#1a1030', warm: '#ffe0b0' }), barkD = s.mat('#54392a'), ring = s.mat('#c8a070'), ringD = s.mat('#9a7244'), moss = s.mat('#5f9a45'), leaf = s.mat('#4f8a3a', { warm: '#f0ffb0' }),
    apple = s.mat('#d8443a', { warm: '#ffe8c0' }), shroom = s.mat('#e2c890'), hole = steps(s, ['#120a06', '#1a100a', '#22160e', '#22160e', '#22160e']);
  /* roots for feet, spread on the ground */
  s.poly([[19, 46], [26, 50], [19, 57], [11, 62], [3, 62], [8, 58], [14, 52]], barkD); s.poly([[25, 51], [31, 52], [29, 62], [21, 62]], bark);
  s.poly([[34, 52], [39, 51], [44, 62], [35, 62]], barkD); s.poly([[40, 47], [46, 50], [52, 56], [61, 62], [52, 62], [45, 58], [38, 53]], bark); s.edges(bark); s.edges(barkD);
  /* the raised branch arm (behind the trunk's shoulder), twigs, leaves and apples */
  limb(s, 45, 30, 52, 18, bark, 4); limb(s, 52, 18, 50, 8, barkD, 2); limb(s, 52, 18, 59, 10, bark, 2); limb(s, 51, 15, 45, 9, barkD, 2);
  s.ell(50, 6, 5, 4, leaf); s.ell(58, 8, 4.6, 4, leaf); s.ell(44, 8, 3.6, 3.2, leaf); s.ell(55, 3, 3.6, 3, leaf);
  /* the trunk: a squat barrel, flared at the root */
  s.poly([[18, 15], [46, 15], [47, 30], [46, 43], [50, 53], [14, 53], [18, 43], [17, 30]], bark); cyl(s, bark);
  for (const [x, a, b] of [[20, 20, 50], [44, 18, 48], [24, 42, 52], [40, 42, 52], [31, 44, 52]]) for (let y = a; y < b; y++) s.dot(x + (y % 7 < 3 ? 0 : 1), y, bark, 1);
  /* the sawn top: bark rim, rings, a crack */
  s.ell(32, 16, 15, 5, bark); s.ell(32, 15, 13, 4, ring, { flat: 3 }); s.ell(32, 15, 9.5, 2.8, ringD, { flat: 2 }); s.ell(32, 15, 6.5, 1.8, ring, { flat: 2 }); s.ell(32, 15, 3, .9, ringD, { flat: 1 });
  s.line(36, 13, 39, 17, ringD, 1); s.line(22, 15, 24, 17, ringD, 1); s.dot(31, 14, ring, 4); s.dot(26, 14, ring, 4);
  /* the hanging arm: a gnarled bough with a fist of twigs */
  s.ell(16, 29, 4.4, 4.4, bark); limb(s, 15, 31, 9, 43, bark, 4); s.ell(8, 45, 3.6, 3.2, barkD); limb(s, 6, 46, 3, 52, barkD, 2); limb(s, 8, 47, 8, 53, barkD, 2); limb(s, 10, 46, 13, 51, barkD, 2);
  /* moss over the shoulders and rim, a bracket fungus */
  s.ell(21, 13, 4.6, 2.2, moss); s.ell(43, 15, 3.6, 1.8, moss); s.ell(16, 26, 3, 2.4, moss); s.ell(19, 34, 1.8, 3, moss); s.ell(46, 26, 2.4, 2, moss);
  s.poly([[44, 38], [51, 37], [52, 39], [45, 40]], shroom); s.poly([[45, 42], [50, 41], [51, 43], [46, 44]], shroom); s.edges(shroom);
  /* the face: heavy bark brows over knot-hole eyes, a knot nose, a split mouth with splinter teeth */
  s.ell(27, 27, 3.2, 2.8, barkD); s.ell(37, 27, 3.2, 2.8, barkD); s.ell(27, 27.5, 2.2, 1.8, hole, { flat: 1 }); s.ell(37, 27.5, 2.2, 1.8, hole, { flat: 1 });
  s.poly([[21, 24], [26, 22], [31, 25], [26, 24]], barkD, { flat: 1 }); s.poly([[43, 24], [38, 22], [33, 25], [38, 24]], barkD, { flat: 1 }); s.ell(32, 31, 2, 2.4, bark);
  s.ell(32, 38, 7, 3.6, barkD); s.ell(32, 38.5, 5.6, 2.4, hole, { flat: 1 });
  for (const x of [28, 32, 35]) tri(s, x, 36.5, x + 1, 39, x + 2, 36.5, ring, 3); tri(s, 30, 41, 31, 38.5, 32, 41, ring, 2);
  for (const [x, y] of [[52, 10], [59, 12], [45, 11], [13, 49]]) s.ell(x, y, 1.6, 1.6, apple);
  s.outline();
  for (const [x, y] of [[52, 10], [59, 12], [45, 11], [13, 49]]) s.dot(x, y - 2, barkD, 0);
  s.dot(51, 9, apple, 4); s.dot(58, 11, apple, 4); s.dot(44, 10, apple, 4); s.dot(12, 48, apple, 4);
  const k = glow(s, '#b8e040', '#ffffff', '#f0ffa0'); eyes2(s, k, [[26, 27], [36, 27]]);
  return s; };

/* ================= The Rookmother: the great crow of the wheat fields, wings mantled, a hooked grey beak ================= */
const rookmother = () => { const s = pane(), fea = steps(s, ['#0c0b16', '#1d1c2c', '#30303f', '#4c5070', '#7f8ab6']), feaD = steps(s, ['#09080f', '#15141f', '#23232f', '#393c58', '#5c6890']),
    sheen = steps(s, ['#0c0b16', '#2a2a40', '#40445e', '#5c6a98', '#a0b0e0']), beak = s.mat('#9aa0a8'), leg = s.mat('#a88a50'), talon = s.mat('#2a2420'), wheat = s.mat('#d8b050', { warm: '#fff2c0' });
  /* a few wheat stalks bent under her */
  for (const [x, h, d] of [[54, 15, 1], [58, 19, 2], [62, 13, 1], [3, 12, -1]]) { s.line(x, 62, x + d, 62 - h, wheat, 1); for (let i = 0; i < 5; i++) { s.dot(x + d - 1 + (i % 2), 61 - h - i, wheat, 3); s.dot(x + d + (i % 2), 61 - h - i, wheat, 2); } }
  /* the far wing, raised behind the head */
  s.poly([[32, 30], [35, 16], [40, 6], [46, 1], [50, 3], [47, 9], [49, 12], [45, 16], [44, 24], [40, 32]], feaD);
  for (let i = 0; i < 4; i++) s.line(36 + i * 2, 27, 41 + i * 2, 5 + i * 3, feaD, 1);
  /* the tail fan, pressed to the ground */
  for (const [x, y] of [[4, 55], [8, 59], [14, 61]]) { s.poly([[20, 46], [x - 2, y - 2], [x, y + 1], [25, 50]], feaD); s.line(22, 48, x, y, fea, 3); }
  /* the near wing, mantled: long fingered primaries, then the coverts */
  for (let i = 0; i < 6; i++) { const tx = 0 + i * 2.2, ty = 2 + i * 5.4; s.poly([[24 - i, 24 + i * 2], [tx, ty], [tx + 3.4, ty - 1], [28 - i, 27 + i * 2]], i % 2 ? feaD : fea); s.line(25 - i, 25 + i * 2, tx + 2, ty, i % 2 ? fea : feaD, 1); }
  s.poly([[31, 30], [24, 20], [15, 14], [10, 20], [13, 30], [18, 38], [30, 42]], fea); for (let i = 0; i < 3; i++) s.line(28 - i * 2, 26 + i * 4, 14 + i, 19 + i * 5, feaD, 2);
  /* scaly legs and hooked talons gripping the ground */
  limb(s, 33, 49, 32, 59, leg, 2); limb(s, 41, 49, 42, 59, leg, 2);
  for (const [fx, fy] of [[32, 60], [42, 60]]) { s.line(fx, fy, fx - 4, 62, leg, 2); s.line(fx, fy, fx + 4, 62, leg, 2); s.line(fx + 1, fy, fx + 1, 62, leg, 1); }
  for (const y of [52, 55, 58]) { s.dot(32, y, leg, 1); s.dot(42, y, leg, 1); }
  /* the body and a deep breast */
  s.ell(29, 40, 14, 11, fea); s.ell(38, 39, 9, 11, fea); s.ell(35, 35, 4, 5, sheen);
  /* the hackled ruff and a big head */
  for (const [x, y] of [[37, 28], [41, 27], [45, 28], [48, 31], [39, 33], [44, 34], [48, 36]]) tri(s, x - 3, y - 3, x + 3, y - 3, x - 1, y + 4, fea);
  s.ell(46, 21, 9, 7.5, fea); s.ell(43, 18, 4.4, 3, sheen);
  /* the heavy beak, hooked at the tip */
  s.poly([[52, 16], [60, 17], [63, 20], [63, 24], [61, 22], [53, 26]], beak); s.edges(beak); s.line(54, 22, 61, 22, beak, 0); s.dot(54, 18, beak, 0);
  s.outline();
  /* feathers scalloped over the breast */
  for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) { const x = 33 + c * 5 + (r % 2) * 2, y = 39 + r * 4; if (s.get(x, y) === fea && s.get(x + 1, y) === fea) { s.dot(x, y, fea, 1); s.dot(x + 1, y - 1, fea, 3); } }
  for (const x of [28, 37, 38, 47]) s.dot(x, 62, talon, 2);
  const e = glow(s, '#e0403a', '#ffffff', '#ff9a7a'); s.dot(48, 19, e, 3); s.dot(49, 19, e, 4); s.dot(48, 20, e, 2); s.dot(49, 20, e, 2); s.line(45, 17, 50, 18, feaD, 0);
  return s; };

/* ================= The Brinemaw: a crab the size of a rowing boat, one crusher claw raised ================= */
const brinemaw = () => { const s = pane(), sh = s.mat('#c8643a', { warm: '#ffe4c0' }), dk = s.mat('#8a3a24'), legM = s.mat('#a84a2c', { warm: '#ffd8b0' }), pale = s.mat('#f0c8a0'), barn = s.mat('#e8e4d8'), weed = s.mat('#4a7a5a'), eye = steps(s, ['#080808', '#101010', '#1a1a1a', '#1a1a1a', '#ffffff']);
  /* eight jointed legs, four a side */
  /* (back pairs first, so the front legs overlap them) */
  for (let i = 3; i >= 0; i--) for (const side of [-1, 1]) { const X = x => 32 + side * (x - 32), m = (i + (side > 0 ? 1 : 0)) % 2 ? dk : legM, kx = 7 + i * 4.2, ky = 34 + i * 3, tx = 2 + i * 5.4;
    limb(s, X(22 + i * 2), 42 + i, X(kx), ky, m, 3); limb(s, X(kx), ky, X(tx + 1), 56, m, 3); limb(s, X(tx + 1), 56, X(tx), 61, m, 2); }
  /* the small claw, low on the left */
  limb(s, 18, 37, 12, 32, dk, 4); s.ell(9, 28, 5.4, 4.6, sh); s.poly([[4, 27], [2, 19], [5, 18], [7, 25]], sh); s.poly([[8, 24], [10, 17], [13, 19], [12, 25]], dk); s.edges(sh); s.dot(2, 19, pale, 3); s.dot(11, 17, pale, 3);
  /* the crusher claw, raised on the right */
  s.ell(47, 31, 4.4, 4.4, dk); s.ell(51, 25, 4, 4, sh);
  /* the swollen palm, the fixed finger out to the right, the hinged finger above it, toothed on the inside */
  s.ell(50, 16, 9, 7.5, sh); s.poly([[54, 17], [59, 11], [63, 7], [63, 14], [59, 20], [54, 22]], sh);
  s.poly([[42, 12], [44, 5], [49, 1], [56, 0], [61, 2], [56, 4], [51, 7], [48, 13]], sh); s.edges(sh);
  for (const [x, y] of [[50, 5], [54, 4], [58, 3]]) s.dot(x, y + 1, pale, 3); for (const [x, y] of [[57, 11], [60, 9]]) s.dot(x, y, pale, 3);
  s.poly([[60, 1], [63, 2], [62, 4], [59, 3]], dk); s.poly([[62, 7], [63, 7], [63, 11], [61, 10]], dk);
  s.ell(47, 14, 3.4, 2.4, s.mat('#e08a5a'));
  /* the shell, its pale underside and spiked rim */
  s.ell(32, 40, 22, 12, dk); s.ell(32, 39, 21, 11, sh); s.ell(28, 35, 11, 5, sh); s.ell(32, 47, 15, 3.6, pale);
  for (const x of [13, 18, 46, 51]) tri(s, x - 2, 39, x, 34, x + 2, 40, pale);
  for (const [x, y] of [[24, 33], [33, 31], [40, 35]]) s.line(x, y, x + 3, y + 4, dk, 1);
  /* barnacles and weed picked up on the harbour steps */
  for (const [x, y] of [[19, 37], [43, 33], [46, 38]]) { tri(s, x - 2, y + 1.5, x, y - 2, x + 2, y + 1.5, barn); s.dot(x, y - 1, barn, 1); }
  s.line(30, 30, 27, 38, weed, 3); s.line(31, 30, 29, 36, weed, 2); s.line(34, 30, 36, 37, weed, 1);
  /* eyestalks */
  limb(s, 27, 31, 26, 22, dk, 2); limb(s, 37, 31, 38, 22, dk, 2); s.ell(26.5, 20, 2.6, 2.6, eye); s.ell(38.5, 20, 2.6, 2.6, eye);
  s.outline();
  s.dot(26, 19, eye, 4); s.dot(38, 19, eye, 4);
  for (let x = 28; x <= 36; x += 2) s.dot(x, 44, dk, 0); s.line(29, 45, 35, 45, dk, 0);
  const b = s.mat('#a8e0f4'); for (const [x, y] of [[40, 46], [42, 43], [41, 40]]) s.dot(x, y, b, 3);
  return s; };

/* ================= Lanternjack: a drowned wrecker, lantern out on a crooked pole, a boathook in the other hand ================= */
const lanternjack = () => { const s = pane(), coat = s.mat('#3a5060'), coatD = s.mat('#24323c'), skin = s.mat('#a8c0b8', { warm: '#f0ffe8' }), hat = s.mat('#2c2c38'), band = s.mat('#6a5a3a'), hair = s.mat('#5a6a60'),
    boot = s.mat('#26221e'), pole = s.mat('#6a5236'), brass = s.mat('#b8923a'), lamp = s.mat('#f4d870', { warm: '#ffffff' }), iron = s.mat('#9aa4ae');
  /* the boathook, planted */
  limb(s, 9, 61, 13, 18, pole, 2); s.poly([[12, 18], [14, 11], [17, 9], [18, 12], [15, 13], [14, 18]], iron); s.dot(19, 14, iron, 3);
  /* boots and shins */
  s.rect(18, 50, 4, 8, coatD); s.rect(27, 50, 4, 8, coatD); s.rect(16, 57, 7, 5, boot); s.rect(26, 57, 8, 5, boot);
  /* the long coat with a torn hem */
  s.poly([[17, 23], [35, 23], [41, 54], [11, 54]], coat); cyl(s, coat); for (const x of [12, 17, 23, 30, 36]) tri(s, x, 53, x + 2, 58, x + 4, 53, coatD);
  s.line(26, 24, 24, 53, coatD, 1); s.poly([[21, 23], [26, 23], [26, 33]], coatD); s.poly([[31, 23], [27, 23], [27, 33]], coatD);
  for (const y of [30, 36, 42]) { s.dot(24, y, brass, 4); s.dot(29, y, brass, 4); }
  s.rect(13, 39, 27, 2, band, { flat: 2 });
  /* arms: the left hangs to the boathook, the right reaches out with the lantern pole */
  s.ell(16, 28, 4, 5, coat); limb(s, 15, 30, 13, 40, coat, 4); s.ell(13, 42, 2.6, 2.6, skin);
  s.ell(36, 28, 4, 4.4, coat); limb(s, 37, 29, 45, 30, coat, 4); s.ell(47, 30, 2.6, 2.6, skin);
  limb(s, 45, 35, 50, 9, pole, 2); limb(s, 50, 9, 56, 7, pole, 2); s.line(56, 8, 56, 11, iron, 1);
  /* the lantern: cap, glass, frame, base */
  s.poly([[52, 12], [60, 12], [58, 10], [54, 10]], brass); s.ell(56, 19, 4.6, 6, lamp); s.rect(52, 25, 9, 2, brass); s.line(53, 13, 53, 24, brass, 1); s.line(59, 13, 59, 24, brass, 1);
  /* the high collar and the gaunt drowned face */
  s.poly([[18, 25], [20, 16], [24, 22]], coatD); s.poly([[34, 25], [32, 16], [29, 22]], coatD);
  s.ell(26, 17, 6.5, 7, skin); s.dot(22, 20, skin, 1); s.dot(30, 20, skin, 1);
  for (const x of [22, 24, 26, 28, 30]) s.line(x, 22, x + (x % 4 ? 0 : -1), 26 + (x % 3), hair, x % 4 ? 2 : 1);
  s.line(19, 12, 18, 24, hair, 2); s.line(20, 12, 20, 21, hair, 1); s.line(33, 12, 34, 22, hair, 2);
  /* the battered stovepipe hat, crown knocked askew */
  s.poly([[14, 12], [38, 11], [36, 14], [16, 14]], hat); s.poly([[19, 12], [33, 11], [35, 1], [21, 0]], hat); s.edges(hat); s.poly([[19, 9], [33, 8], [33, 10], [19, 11]], band); s.dot(23, 3, hat, 1); s.dot(30, 5, hat, 1);
  s.outline();
  /* lantern light: the glass core, and a warm rim on the side that faces it */
  s.dot(56, 18, lamp, 4); s.dot(55, 17, lamp, 4); s.dot(56, 19, lamp, 4);
  rim(s, [coat], 31, 52, 30, 42, '#c8c088'); rim(s, [skin], 13, 21, 26, 34, '#f0e8b0');
  const e = glow(s, '#d8f8ff', '#ffffff', '#ffffff'); s.dot(23, 17, e, 3); s.dot(24, 17, e, 2); s.dot(28, 17, e, 3); s.dot(29, 17, e, 2); s.line(22, 15, 24, 15, hat, 0); s.line(28, 15, 30, 15, hat, 0);
  for (const [x, y] of [[15, 15], [37, 14], [22, 15]]) s.fix(x, y + 1, '#7ac8d8');
  return s; };

/* ================= Hoarfang: the white pack leader of the pass, ice along its back ================= */
const hoarfang = () => { const s = pane(), fur = s.mat('#c8dce8', { cool: '#1a2848' }), furD = s.mat('#8aa4b8', { cool: '#1a2848' }), belly = s.mat('#eef6fa'), ice = s.mat('#8ad0f0', { warm: '#ffffff' }), nose = s.mat('#2a3a4a'),
    mouth = s.mat('#8a2a3a'), fang = s.mat('#ffffff'), ear = s.mat('#d8a0a8');
  /* far legs */
  s.ell(22, 47, 5, 6, furD); limb(s, 21, 51, 24, 56, furD, 4); limb(s, 24, 56, 22, 60, furD, 4); s.ell(22, 61, 3.6, 1.8, furD);
  limb(s, 42, 46, 41, 60, furD, 4); s.ell(42, 61, 3.6, 1.8, furD);
  /* the bushy tail, held low */
  s.ell(9, 37, 5, 5, fur); s.ell(6, 44, 4, 5.4, fur); s.ell(5, 49, 2.6, 2.6, belly);
  /* body, haunch, deep chest, pale belly */
  s.ell(28, 40, 16, 8.5, fur); s.ell(15, 40, 8, 9, fur); s.ell(43, 39, 9, 10, fur); s.ell(31, 46, 11, 2.6, belly);
  /* near hind leg with its hock, near foreleg planted */
  s.ell(15, 47, 6.4, 6.4, fur); limb(s, 14, 52, 11, 56, fur, 4); limb(s, 11, 56, 14, 60, fur, 4); s.ell(15, 61, 4.4, 1.8, fur);
  limb(s, 47, 45, 48, 59, fur, 5); s.ell(50, 61, 4.6, 1.8, fur);
  /* hackles up along the neck and shoulders */
  for (const [x, y] of [[34, 30], [38, 28], [42, 27], [46, 28], [49, 31], [37, 34], [44, 33]]) tri(s, x - 3, y + 1, x - 1, y - 5, x + 3, y + 1, fur);
  /* ice grown along the spine */
  for (const [x, y, h] of [[12, 32, 5], [18, 31, 7], [24, 31, 9], [30, 31, 7]]) tri(s, x - 2, y + 1, x + 1, y - h, x + 3, y + 1, ice);
  /* the head, low and forward: broad skull, tapered muzzle, jaw open in a snarl */
  s.ell(51, 30, 8.5, 7.5, fur); s.poly([[55, 28], [62, 31], [63, 35], [57, 36]], fur); s.edges(fur);
  s.poly([[54, 38], [62, 38], [60, 41], [55, 41]], furD); s.poly([[56, 36], [63, 35], [62, 38], [56, 38]], mouth, { flat: 1 });
  tri(s, 57, 35.5, 58, 38, 59, 35.5, fang, 4); tri(s, 61, 35, 62, 37.5, 62.5, 35, fang, 4); tri(s, 58, 39.5, 59, 37, 60, 39.5, fang, 3);
  s.ell(49, 36, 4, 3.4, belly);
  /* ears laid back */
  s.poly([[44, 26], [42, 16], [50, 23]], furD); s.poly([[48, 24], [50, 14], [55, 24]], fur); s.poly([[50, 22], [51, 17], [53, 23]], ear);
  s.outline();
  s.dot(63, 32, nose, 2); s.dot(62, 32, nose, 2); s.dot(62, 31, nose, 4);
  const e = glow(s, '#ffd24a', '#ffffff', '#fff0a0'); s.dot(55, 29, e, 3); s.dot(56, 29, e, 4); s.dot(55, 30, e, 2); s.dot(56, 30, e, 2); s.line(53, 27, 57, 28, nose, 2);
  s.line(54, 33, 58, 33, furD, 1); s.line(52, 26, 55, 34, furD, 1);
  for (const [x, y] of [[60, 43], [62, 44], [58, 45]]) s.fix(x, y, '#d8f0ff');
  return s; };

/* ================= The Cairn Warden: a walking heap of grave-stones with a carved stone in its chest ================= */
const cairnwarden = () => { const s = pane(), st = s.mat('#8a8f98'), stD = s.mat('#6a6f7a'), stL = s.mat('#a8aeb8'), slab = s.mat('#9a9688', { warm: '#fff4d8' }), moss = s.mat('#6a9a58'), lich = s.mat('#c8c070'), dark = steps(s, ['#0a0c10', '#12161c', '#1a1e26', '#1a1e26', '#1a1e26']);
  /* legs: stacked stones on boulder feet */
  s.ell(22, 50, 6, 5, stD); s.ell(42, 50, 6, 5, st); s.ell(21, 58, 8, 4.6, st); s.ell(43, 58, 8, 4.6, stD);
  /* the arms: shoulder boulders, stacked forearms, great fists */
  s.ell(10, 36, 5, 5.4, stD); s.ell(9, 46, 7, 6.5, st); s.ell(54, 36, 5, 5.4, st); s.ell(55, 46, 7, 6.5, stD);
  /* the body: a cairn of rounded stones */
  s.ell(32, 40, 16, 10, st); s.ell(23, 30, 9, 7, stL); s.ell(41, 30, 9, 7, st); s.ell(32, 47, 12, 4, stD);
  s.ell(12, 26, 7, 6, st); s.ell(52, 26, 7, 6, stD);
  /* the grave-stone set in the chest, rounded top, a carved ring-cross */
  s.ell(32, 30, 6, 4, slab); s.rect(26, 30, 13, 12, slab); s.edges(slab); s.ell(32, 30, 6, 4, slab);
  /* the head: a capstone with a brow slit, and the last stones of the cairn on top */
  s.ell(32, 16, 9, 7, stL); s.rect(24, 15, 17, 3, dark, { flat: 2 }); s.ell(31, 7, 5, 3, st); s.ell(33, 3, 3, 2.2, stL);
  /* moss and lichen */
  s.ell(14, 21, 4.4, 1.8, moss); s.ell(49, 21, 3.4, 1.6, moss); s.ell(30, 10, 3.4, 1.4, moss); s.ell(20, 43, 2.4, 1.2, moss); s.ell(6, 41, 2, 1.2, moss);
  for (const [x, y] of [[40, 27], [45, 40], [22, 52], [56, 43], [37, 18]]) s.dot(x, y, lich, 3);
  /* cracks */
  s.line(16, 34, 19, 40, st, 1); s.line(44, 36, 47, 42, st, 1); s.line(8, 44, 11, 49, st, 1); s.line(40, 55, 44, 57, stD, 1);
  s.outline();
  const r = '#8af0ff', rd = '#3ab0c8'; for (let y = 31; y <= 40; y++) s.fix(32, y, y < 33 ? r : rd); for (let x = 29; x <= 35; x++) s.fix(x, 34, rd); s.fix(32, 34, r);
  for (const [x, y] of [[30, 32], [34, 32], [30, 36], [34, 36]]) s.fix(x, y, '#2a7a8a');
  const e = glow(s, '#8af0ff', '#ffffff', '#d8ffff'); for (const x of [27, 35]) { s.dot(x, 16, e, 4); s.dot(x + 1, 16, e, 3); s.dot(x + 2, 16, e, 2); }
  return s; };

/* ================= The Drowned Bellringer: a hooded ringer with the chapel bell that sank with him ================= */
const bellringer = () => { const s = pane(), robe = s.mat('#4a6a5e'), robeD = s.mat('#2c4038'), bone = s.mat('#c8d4c0'), brass = s.mat('#b8923a', { warm: '#fff0b0' }), verd = s.mat('#5aa88a'), weed = s.mat('#3a8a5a'), rope = s.mat('#8a7a50'),
    hood = steps(s, ['#080c0a', '#0e1412', '#141c18', '#141c18', '#141c18']);
  /* the bell rope, frayed, hanging from the dark above */
  for (let y = 0; y <= 34; y++) { const x = y < 20 ? 11 : 11 + Math.round(Math.sin((y - 20) / 4) * 1.5); s.dot(x, y, rope, y % 3 ? 2 : 3); s.dot(x + 1, y, rope, y % 3 === 1 ? 1 : 2); }
  s.ell(12, 36, 1.6, 1.4, rope);
  /* the robe with a wet, ragged hem */
  s.poly([[22, 19], [38, 19], [44, 58], [14, 58]], robe); cyl(s, robe); for (const x of [14, 19, 25, 31, 37]) tri(s, x, 57, x + 2.5, 62, x + 5, 57, robeD);
  s.line(30, 22, 29, 56, robeD, 1); s.line(22, 34, 19, 56, robeD, 1); s.line(37, 34, 40, 56, robeD, 1); s.rect(20, 33, 21, 2, rope, { flat: 2 });
  /* the left arm up on the rope, the right arm carrying the bell */
  s.ell(20, 26, 4, 4.4, robe); limb(s, 19, 26, 14, 21, robe, 4); s.ell(12, 20, 2.6, 2.6, bone);
  s.ell(38, 26, 4, 4.6, robe); limb(s, 39, 28, 44, 33, robe, 4); s.ell(46, 34, 2.4, 2.4, bone);
  /* the bell: crown loop, sphere-lit waist, flared lip, clapper */
  s.ell(48, 35, 2, 1.6, brass); s.ell(48, 43, 6.5, 7, brass); s.poly([[41, 46], [55, 46], [59, 53], [37, 53]], brass); s.edges(brass); s.rect(37, 52, 23, 2, brass, { flat: 1 });
  s.line(42, 44, 41, 51, brass, 3); s.ell(48, 56, 2, 1.8, s.mat('#5a4a20'));
  for (const [x, y] of [[51, 41], [45, 48], [53, 49]]) s.ell(x, y, 1.6, 1.2, verd);
  /* the hood, its dark opening, and fen weed hanging off it */
  s.ell(30, 14, 9, 9, robe); s.poly([[25, 7], [31, 0], [35, 7]], robe); s.ell(30.5, 16, 5.6, 6, hood, { flat: 2 });
  s.line(22, 16, 21, 26, weed, 3); s.line(39, 14, 41, 23, weed, 2); s.line(26, 21, 25, 29, weed, 2); s.ell(41, 24, 1.6, 1.2, weed); s.ell(21, 27, 1.6, 1.4, weed);
  s.outline();
  const e = glow(s, '#9af0d0', '#ffffff', '#e0fff4'); eyes2(s, e, [[27, 15], [32, 15]]); s.dot(29, 20, bone, 1); s.dot(31, 20, bone, 1); s.dot(30, 21, bone, 2);
  for (const [x, y] of [[16, 62], [27, 63], [42, 62], [55, 57], [44, 59]]) s.fix(x, y, '#7ac8d8');
  return s; };

/* ================= Gallowmoth: a pale moth as wide as a door, eye-spots on its wings, a death's-head on its back ================= */
const gallowmoth = () => { const s = pane(), wing = s.mat('#d8d0e8', { warm: '#fffaf0' }), wingD = s.mat('#9a8ab8'), hind = s.mat('#b8a8d0'), body = s.mat('#6a5a7a'), fuzz = s.mat('#b8a8c8'),
    spot = s.mat('#e8a03a', { warm: '#fff0c0' }), dot = steps(s, ['#1a0e1a', '#1a0e1a', '#2a1a2a', '#2a1a2a', '#ffffff']), eyeM = s.mat('#4a2a6a', { warm: '#d8b0ff' }), skull = s.mat('#e8e0d0');
  for (const side of [-1, 1]) { const X = x => 32 + side * (x - 32);
    /* hindwing, then forewing with a dark margin, scalloped */
    s.poly([[X(30), 32], [X(16), 34], [X(7), 42], [X(9), 54], [X(17), 59], [X(23), 56], [X(29), 46]], hind);
    s.poly([[X(30), 25], [X(20), 10], [X(9), 2], [X(2), 5], [X(0), 14], [X(3), 24], [X(10), 31], [X(29), 33]], wingD);
    s.poly([[X(30), 25], [X(20), 12], [X(10), 5], [X(4), 8], [X(3), 15], [X(5), 23], [X(11), 29], [X(29), 31]], wing);
    for (let i = 0; i < 4; i++) s.ell(X(3 + i * 0), 8 + i * 5.5, 1.2, 1.2, wingD, { flat: 1 }); }
  cyl(s, wing, [[.5, 3], [2, 2]]);
  for (const side of [-1, 1]) { const X = x => 32 + side * (x - 32);
    for (const [a, b] of [[10, 6], [6, 14], [6, 22], [12, 28]]) s.line(X(29), 27, X(a), b, wingD, 1);
    for (const [a, b] of [[9, 46], [14, 56], [20, 57]]) s.line(X(29), 36, X(a), b, wingD, 1);
    s.ell(X(14), 17, 5, 5, spot); s.ell(X(14), 17, 2.6, 2.6, dot); s.ell(X(14), 49, 3, 3, spot); s.ell(X(14), 49, 1.4, 1.4, dot); }
  /* the body: a fuzzy thorax with the death's-head, a banded abdomen */
  s.ell(32, 44, 4.6, 11, body); for (let y = 37; y < 55; y += 3) s.line(28, y, 36, y, body, 1);
  s.ell(32, 30, 6, 6.4, fuzz); s.ell(32, 30, 3.4, 3, skull);
  /* head, big compound eyes, feathered antennae */
  s.ell(32, 21, 4.6, 4, body); s.ell(28.5, 21, 2.6, 2.8, eyeM); s.ell(35.5, 21, 2.6, 2.8, eyeM);
  for (const side of [-1, 1]) { const X = x => 32 + side * (x - 32); s.line(X(30), 17, X(23), 3, body, 2); for (let i = 0; i < 5; i++) s.line(X(29 - i * 1.4), 15 - i * 2.4, X(27 - i * 1.4), 15 - i * 2.4, body, 1); }
  /* legs reaching for the ground */
  for (const [a, b, c, d] of [[29, 38, 22, 60], [35, 38, 42, 60], [30, 42, 27, 61], [34, 42, 37, 61]]) s.line(a, b, c, d, body, 1);
  s.outline();
  for (const side of [-1, 1]) { const X = x => 32 + side * (x - 32); s.dot(X(13), 16, dot, 4); s.dot(X(13), 48, dot, 4); }
  s.dot(31, 29, dot, 2); s.dot(33, 29, dot, 2); s.dot(32, 31, dot, 2); s.dot(27, 20, eyeM, 4); s.dot(34, 20, eyeM, 4);
  for (const [x, y] of [[24, 62], [30, 58], [38, 62], [44, 59], [20, 57], [34, 63]]) s.fix(x, y, '#f0e8ff');
  return s; };

/* ================= Slagmaw: a toad of half-cooled rock, lava in its cracks and its grin ================= */
const slagmaw = () => { const s = pane(), rock = s.mat('#4a3a3a', { warm: '#ffd0a0' }), rockD = s.mat('#2c2224'), rockL = s.mat('#5e4a48', { warm: '#ffd0a0' }), lava = s.mat('#f08a2a', { warm: '#fff2a0' }), hot = s.mat('#ffd060', { warm: '#ffffff' }),
    seam = steps(s, ['#3a1408', '#c8501a', '#f07a24', '#ffb040', '#ffe080']);
  /* crust plates over a molten body: each plate lit as a sphere, only where the body is, the seams left glowing */
  const plates = (under, pts) => { for (const [cx, cy, r, m] of pts) for (let y = Math.floor(cy - r); y <= cy + r; y++) for (let x = Math.floor(cx - r); x <= cx + r; x++) { const nx = (x + .5 - cx) / r, ny = (y + .5 - cy) / (r * .86); if (nx * nx + ny * ny <= 1 && s.get(x, y) === under) s.set(x, y, m, A.sphere(nx, ny)); } };
  /* splayed hind feet and haunches */
  s.ell(9, 60, 8, 2.6, rockD); s.ell(55, 60, 8, 2.6, rockD); s.ell(11, 50, 9.5, 9, seam); s.ell(53, 50, 9.5, 9, seam);
  /* the body and the two eye domes, molten under the crust */
  s.ell(32, 40, 24, 15, seam); s.ell(19, 25, 7.5, 7, seam); s.ell(45, 25, 7.5, 7, seam);
  plates(seam, [[5, 46, 5.4, rock], [13, 44, 5, rockL], [8, 54, 5, rock], [16, 53, 4.6, rockL], [58, 46, 5.4, rock], [51, 44, 5, rock], [56, 54, 5, rockL], [48, 53, 4.6, rock],
    [32, 28, 6, rockL], [24, 32, 5.4, rock], [40, 32, 5.4, rockL], [32, 36, 4.6, rock], [16, 35, 5, rockL], [48, 35, 5, rock], [11, 40, 4.4, rock], [53, 40, 4.4, rockL], [26, 39, 4, rockL], [38, 39, 4, rock],
    [19, 22, 5.6, rockL], [14, 28, 4, rock], [24, 28, 3.4, rock], [45, 22, 5.6, rock], [40, 28, 3.4, rockL], [50, 28, 4, rockL], [32, 52, 6, rock], [22, 51, 4.6, rockL], [42, 51, 4.6, rockL]]);
  /* front legs and hands */
  s.ell(21, 55, 4.4, 4.6, rockD); s.ell(43, 55, 4.4, 4.6, rockD); s.ell(20, 60, 6, 2.4, rock); s.ell(44, 60, 6, 2.4, rock);
  /* the grin: crust lips round a molten mouth */
  s.poly([[9, 39], [20, 43], [32, 44], [44, 43], [55, 39], [51, 47], [32, 52], [13, 47]], rockD, { flat: 1 });
  s.poly([[12, 41], [21, 45], [32, 46], [43, 45], [52, 41], [48, 46], [32, 50], [16, 46]], lava); s.poly([[19, 46], [32, 48], [45, 46], [32, 49.5]], hot, { flat: 3 });
  for (const x of [17, 23, 29, 35, 41]) tri(s, x, 44.5, x + 1.5, 47.5, x + 3, 44.5, rockL, 3);
  s.outline();
  /* molten eyes with slit pupils */
  for (const x of [19, 45]) { s.ell(x, 24, 3.6, 3.4, hot); s.dot(x, 23, rockD, 0); s.dot(x, 24, rockD, 0); s.dot(x, 25, rockD, 0); s.dot(x - 2, 22, hot, 4); s.dot(x - 1, 22, hot, 4); s.line(x - 4, 20, x + 3, 20, rockD, 1); }
  /* molten spit at the lip, and steam rising */
  s.line(12, 44, 11, 51, lava, 3); s.dot(11, 52, hot, 3); s.dot(11, 54, lava, 2);
  for (const [x, y] of [[30, 16], [32, 13], [31, 10], [33, 7], [38, 15], [39, 11], [26, 15]]) s.fix(x, y, '#8a8088');
  return s; };

/* ================= The Ashen Matriarch: the old mother of the ridge drakes, low and smoking, ash shedding from her wings ================= */
const ashmatriarch = () => { const s = pane(), sc = s.mat('#8a3a3a', { warm: '#ffd8b0' }), scD = s.mat('#5a2228'), ash = s.mat('#b0a8a8'), horn = s.mat('#e0d4c0'), hornD = s.mat('#a89880'), belly = s.mat('#d8a070'), bone = s.mat('#4a1c24'), mem = s.mat('#6a2c34'),
    claw = s.mat('#2a1a1a'), tooth = s.mat('#f0e8d8');
  /* the tattered wing, mantled behind: a bony arm, three fingers, torn membrane */
  s.poly([[20, 38], [12, 20], [3, 6], [10, 10], [15, 3], [20, 12], [27, 5], [30, 16], [34, 36]], mem); s.edges(mem);
  for (const [a, b] of [[3, 6], [15, 3], [27, 5]]) s.thick(28, 30, a, b, bone, 2); s.thick(20, 38, 28, 30, bone, 3);
  for (const [x, y] of [[11, 15], [21, 15], [16, 24], [6, 9]]) { s.set(x, y, null); s.set(x + 1, y, null); s.set(x, y + 1, null); s.set(x + 1, y + 1, null); }
  /* the tail, sweeping down to the ground */
  s.poly([[16, 42], [6, 50], [0, 58], [3, 60], [10, 56], [22, 50]], sc); for (const [x, y] of [[4, 55], [9, 51], [14, 47]]) tri(s, x - 1, y, x, y - 4, x + 2, y, ash);
  /* far legs */
  limb(s, 40, 48, 43, 60, scD, 4); limb(s, 23, 50, 27, 60, scD, 4);
  /* the heavy body, a pale belly, an ash-crusted ridge */
  s.ell(28, 45, 15, 9.5, sc); s.ell(31, 51, 10, 3, belly);
  for (let i = 0; i < 5; i++) tri(s, 17 + i * 5, 38 - i, 19 + i * 5, 32 - i, 22 + i * 5, 38 - i, ash);
  /* near legs, clawed */
  s.ell(18, 50, 6, 6, sc); limb(s, 17, 53, 14, 60, sc, 4); s.ell(46, 48, 4.6, 5, sc); limb(s, 47, 51, 50, 60, sc, 4);
  for (const x of [11, 14, 17, 47, 50, 53]) s.dot(x, 62, claw, 2); s.line(11, 61, 17, 61, sc, 1); s.line(47, 61, 53, 61, sc, 1);
  /* the neck, low and forward */
  s.poly([[36, 40], [40, 33], [47, 28], [52, 31], [47, 37], [42, 45]], sc); for (const [x, y] of [[41, 43], [44, 39], [47, 36]]) s.line(x, y, x + 2, y + 1, belly, 3);
  /* two great horns swept back from the skull along the neck, ridged, curling up at the tips */
  horn2(s, [[55, 25], [56, 19], [54, 14], [51, 11]], 3.6, hornD); horn2(s, [[50, 26], [47, 19], [43, 14], [38, 12]], 5, horn);
  for (const [x, y] of [[47, 20], [44, 16]]) s.line(x, y, x + 2, y - 1, hornD, 1);
  /* the long head: brow, snout, jaw with old teeth, cheek spines */
  s.ell(52, 29, 7.5, 6.5, sc); s.poly([[54, 24], [62, 27], [63, 32], [55, 35]], sc); s.poly([[50, 33], [61, 34], [59, 38], [51, 38]], scD); s.edges(sc);
  for (const x of [55, 59]) { s.dot(x, 34, tooth, 3); s.dot(x, 35, tooth, 2); }
  for (const [x, y] of [[46, 32], [45, 28]]) tri(s, x + 1, y, x - 5, y - 1, x, y + 4, scD);
  s.ell(53, 26, 4, 1.6, scD, { flat: 2 });
  s.outline();
  const e = glow(s, '#ffd24a', '#ffffff', '#fff0a0'); s.dot(54, 28, e, 3); s.dot(55, 28, e, 4); s.dot(54, 29, e, 2); s.line(52, 27, 57, 27, scD, 0); s.dot(61, 29, claw, 2);
  s.line(26, 42, 30, 44, ash, 3); s.line(27, 43, 31, 45, sc, 1);
  for (const [x, y] of [[62, 25], [60, 23], [63, 21], [58, 20]]) s.fix(x, y, '#8a8080');
  for (const [x, y] of [[8, 28], [14, 31], [4, 22], [36, 5], [32, 26], [6, 36], [24, 2]]) s.fix(x, y, '#c8c0c0');
  for (const [x, y] of [[10, 33], [38, 14], [2, 30], [22, 22]]) s.fix(x, y, '#ffb040');
  return s; };

/* ================= The Stormcrown Ram: a great mountain ram, lightning caught between its curled horns ================= */
const stormram = () => { const s = pane(), wool = s.mat('#e8e4d0'), woolD = s.mat('#b8b090'), face = s.mat('#7a6450', { warm: '#ffe0b0' }), legC = s.mat('#54483e'), muzzle = s.mat('#d8ccb0'), horn = s.mat('#c8a04a', { warm: '#fff4c0' }), hornD = s.mat('#8a6a2a'), hoof = s.mat('#2a241e'),
    bolt = s.mat('#8adcff', { warm: '#ffffff' });
  /* far legs */
  limb(s, 18, 48, 19, 59, legC, 4); limb(s, 42, 47, 42, 59, legC, 4); s.rect(16, 59, 6, 3, hoof); s.rect(40, 59, 6, 3, hoof);
  /* the fleece: a big body made of curls */
  s.ell(27, 38, 19, 11, wool); for (const [x, y, r, m] of [[11, 32, 4, 1], [16, 28, 4.4, 0], [23, 26, 4.6, 1], [30, 26, 4.6, 0], [37, 28, 4.4, 1], [9, 40, 4.4, 0], [13, 46, 4.4, 1], [21, 48, 4.6, 0], [30, 49, 4.4, 1], [38, 47, 4.4, 0], [43, 40, 4.4, 1], [19, 36, 3.6, 0], [29, 37, 3.6, 1], [37, 36, 3.4, 0]]) s.ell(x, y, r, r * .9, m ? woolD : wool);
  s.ell(7, 34, 2.4, 3, wool);
  /* near legs, sturdy */
  limb(s, 13, 50, 13, 59, legC, 4); limb(s, 36, 50, 37, 59, legC, 4); s.rect(11, 59, 6, 3, hoof); s.rect(35, 59, 6, 3, hoof);
  /* the head, pushed forward on a thick neck, a pale muzzle and a woolly beard */
  s.ell(44, 32, 6, 7, wool); s.ell(51, 27, 7, 6.4, face); s.poly([[53, 24], [61, 29], [62, 34], [58, 36], [52, 33]], face); s.edges(face); s.ell(59, 32, 3, 3, muzzle); s.ell(53, 37, 2.6, 3.4, woolD);
  /* the great curled horn, round the ear and forward under the eye */
  s.ell(45, 23, 8, 8, horn); s.ell(45, 23, 5.4, 5.4, hornD, { flat: 2 }); s.ell(45, 23, 3.6, 3.6, horn); s.ell(45, 23, 1.6, 1.6, hornD, { flat: 1 }); s.poly([[50, 28], [54, 34], [51, 35], [47, 30]], horn);
  for (let a = 0; a < 7; a++) { const q = a / 7 * Math.PI * 2; s.dot(45 + Math.cos(q) * 7, 23 + Math.sin(q) * 7, hornD, 1); }
  /* the crown of lightning between the horns */
  const zig = pts => { for (let i = 1; i < pts.length; i++) s.thick(pts[i - 1][0], pts[i - 1][1], pts[i][0], pts[i][1], bolt, 2); };
  zig([[40, 16], [37, 10], [40, 9], [36, 1]]); zig([[46, 14], [48, 8], [45, 7], [48, 0]]); zig([[52, 18], [57, 12], [54, 11], [60, 4]]);
  s.outline();
  for (const [x, y] of [[36, 1], [48, 0], [60, 4]]) s.fix(x, y, '#ffffff');
  for (const [x, y] of [[33, 4], [42, 3], [54, 5], [62, 9], [38, 13]]) s.fix(x, y, '#c8f0ff');
  const e = glow(s, '#ffe060', '#ffffff', '#fff6b0'); s.dot(54, 26, e, 3); s.dot(55, 26, e, 2); s.line(53, 25, 56, 25, hoof, 2); s.dot(61, 31, hoof, 2); s.line(58, 34, 61, 34, hoof, 1);
  return s; };

/* ================= Cloudbreaker: a great finned thing breaching out of the cloud sea ================= */
const cloudbreaker = () => { const s = pane(), back = s.mat('#4a6ea8', { warm: '#e8f4ff' }), belly = s.mat('#d8e4f4'), fin = s.mat('#3a5484'), cloud = s.mat('#eef2fa', { cool: '#3a4a7a' }), cloudD = s.mat('#b8c4dc', { cool: '#3a4a7a' }),
    mouth = steps(s, ['#140810', '#1e0c18', '#2a1222', '#2a1222', '#2a1222']), tooth = s.mat('#f4f0e4'), spot = s.mat('#9ac8ff', { warm: '#ffffff' });
  /* the fluke, flipping up out of the cloud behind */
  s.poly([[12, 46], [3, 36], [1, 40], [6, 46], [1, 50], [5, 52], [14, 49]], fin); s.edges(fin);
  /* the body arching up out of the cloud, the pale grooved throat underneath */
  s.ell(16, 47, 9, 7, back); s.ell(26, 39, 12, 10, back); s.ell(38, 29, 13, 11, back); s.ell(47, 20, 11, 9.5, back);
  s.poly([[22, 51], [34, 43], [46, 33], [56, 26], [57, 30], [50, 38], [37, 48], [25, 55]], belly); for (let i = 0; i < 6; i++) s.line(28 + i * 5, 49 - i * 4, 30 + i * 5, 52 - i * 4, belly, 1);
  /* dorsal fin and the long pectoral fin */
  s.poly([[22, 32], [17, 18], [24, 22], [32, 30]], fin); s.edges(fin);
  s.poly([[38, 37], [50, 42], [59, 50], [52, 51], [42, 45]], fin); s.edges(fin);
  /* the blunt head, jaw dropped open on rows of teeth */
  s.ell(52, 16, 8, 7, back); s.poly([[50, 22], [61, 15], [63, 17], [62, 22], [52, 28]], mouth, { flat: 2 }); s.poly([[51, 27], [62, 22], [61, 26], [53, 30]], belly); s.edges(belly);
  for (const [x, y] of [[53, 22], [56, 20], [59, 18]]) tri(s, x, y, x + 1, y + 2.5, x + 2, y - 1, tooth, 3); for (const [x, y] of [[54, 26], [57, 24], [60, 23]]) tri(s, x, y + 1, x + 1, y - 2, x + 2, y + .5, tooth, 3);
  /* the cloud sea it rises from, laid over its tail */
  for (const [x, y, rx, ry, m] of [[4, 58, 8, 5, 1], [14, 56, 7, 5.4, 0], [24, 58, 8, 5, 1], [34, 56, 7, 5, 0], [44, 58, 8, 5, 1], [54, 57, 7, 5, 0], [62, 59, 6, 4.6, 1], [10, 61, 9, 3, 0], [30, 62, 10, 3, 1], [50, 62, 10, 3, 0]]) s.ell(x, y, rx, ry, m ? cloudD : cloud);
  s.outline();
  for (const [x, y] of [[31, 31], [36, 25], [42, 21], [26, 37], [44, 13], [20, 43], [50, 10], [56, 12]]) s.dot(x, y, spot, 3);
  const e = steps(s, ['#0c1424', '#0c1424', '#1a2438', '#1a2438', '#ffffff']); s.dot(53, 15, e, 2); s.dot(54, 15, e, 2); s.dot(53, 16, e, 2); s.dot(54, 16, e, 2); s.dot(53, 15, e, 4); s.line(51, 13, 55, 13, fin, 0);
  for (const [x, y] of [[8, 20], [12, 22], [60, 40], [62, 42]]) s.fix(x, y, '#c8d4ec');
  return s; };

Object.assign(A.BIG, { gnarlroot, rookmother, brinemaw, lanternjack, hoarfang, cairnwarden, bellringer, gallowmoth, slagmaw, ashmatriarch, stormram, cloudbreaker });
A.MINI_BIG = ['gnarlroot', 'rookmother', 'brinemaw', 'lanternjack', 'hoarfang', 'cairnwarden', 'bellringer', 'gallowmoth', 'slagmaw', 'ashmatriarch', 'stormram', 'cloudbreaker'];
})();
