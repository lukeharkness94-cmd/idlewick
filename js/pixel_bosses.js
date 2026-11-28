/* Idlewick pixel art: the bosses at 64 x 64 (owner, 28 Nov 2026: "larger, detailed sprites like Old Tusk"), and the
   larger versions of the mini-bosses and tower bosses. Everything is original and drawn in code.
   The eight bosses are drawn here in materials (five-step ramps, cool shadows, warm lights), with sphere-lit masses for
   muscle, bellies and armour, edge light on flat shapes, then the selective outline and the face on top. The eight
   tower bosses have their own 64 x 64 drawings too (28 Nov 2026); mini-bosses keep their own 32 x 32 designs, redrawn
   at twice the detail (pixelart.js atScale).
   The small (32 x 32) sprite stays the one every list, card and field-guide row uses; the large one is for boxes of 128
   px and more (the combat stage, the field guide's big picture), always at a whole-number scale. */
(() => {
const Q = window.DQ, A = Q && Q.pixelArt; if (!A) return;
const hex = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
const toHex = a => '#' + a.map(v => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('');
const mix = (a, b, k) => toHex(hex(a).map((v, i) => v + (hex(b)[i] - v) * k));
const ramp = (base, o = {}) => { const cool = o.cool || '#1a1838', warm = o.warm || '#fff2c8'; return [mix(base, '#100c22', .74), mix(base, cool, .34), base, mix(base, warm, .28), mix(base, warm, .56)]; };
/* a canvas of materials and light steps (0 outline, 1 shadow, 2 base, 3 light, 4 highlight) */
class P {
  constructor(w, h) { this.w = w; this.h = h; this.m = new Array(w * h).fill(null); this.l = new Array(w * h).fill(2); this.mats = []; this.fixed = new Map(); }
  mat(base, o) { this.mats.push(Array.isArray(base) ? base : ramp(base, o)); return this.mats.length - 1; }
  set(x, y, m, l = 2) { x = Math.round(x); y = Math.round(y); if (x < 0 || y < 0 || x >= this.w || y >= this.h) return; const i = y * this.w + x; this.m[i] = m; this.l[i] = l; this.fixed.delete(i); }
  get(x, y) { if (x < 0 || y < 0 || x >= this.w || y >= this.h) return null; return this.m[y * this.w + x]; }
  fix(x, y, c) { x = Math.round(x); y = Math.round(y); if (x < 0 || y < 0 || x >= this.w || y >= this.h) return; const i = y * this.w + x; if (this.m[i] == null) this.m[i] = -1; this.fixed.set(i, c); }
  ell(cx, cy, rx, ry, m, o = {}) { for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++) for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++) {
    const nx = (x + .5 - cx) / rx, ny = (y + .5 - cy) / ry, d = nx * nx + ny * ny; if (d > 1) continue; this.set(x, y, m, o.flat != null ? o.flat : A.sphere(nx, ny)); } }
  rect(x, y, w, h, m, o = {}) { for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) { let lv = o.flat != null ? o.flat : 2; if (o.flat == null) { if (j === 0 || i === 0) lv = 3; if (j === h - 1 || i === w - 1) lv = 1; } this.set(x + i, y + j, m, lv); } }
  poly(pts, m, o = {}) { const xs = pts.map(p => p[0]), ys = pts.map(p => p[1]); const x0 = Math.floor(Math.min(...xs)), x1 = Math.ceil(Math.max(...xs)), y0 = Math.floor(Math.min(...ys)), y1 = Math.ceil(Math.max(...ys));
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) { let inside = false; for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) { const [xi, yi] = pts[i], [xj, yj] = pts[j]; if ((yi > y + .5) !== (yj > y + .5) && x + .5 < (xj - xi) * (y + .5 - yi) / (yj - yi) + xi) inside = !inside; }
      if (inside) this.set(x, y, m, o.flat != null ? o.flat : 2); } }
  line(x0, y0, x1, y1, m, lv = 2) { const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0), 1); for (let i = 0; i <= n; i++) this.set(x0 + (x1 - x0) * i / n, y0 + (y1 - y0) * i / n, m, lv); }
  thick(x0, y0, x1, y1, m, w = 2) { const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0), 1); for (let i = 0; i <= n; i++) { const x = x0 + (x1 - x0) * i / n, y = y0 + (y1 - y0) * i / n; for (let a = 0; a < w; a++) this.set(x + a, y, m, a === 0 ? 3 : a === w - 1 ? 1 : 2); } }
  dot(x, y, m, lv) { this.set(x, y, m, lv); }
  /* edge light for flat shapes: lit where open to the top left, shaded where open to the bottom right */
  edges(m) { for (let y = 0; y < this.h; y++) for (let x = 0; x < this.w; x++) { if (this.get(x, y) !== m) continue; const i = y * this.w + x;
    if (this.get(x, y - 1) !== m || this.get(x - 1, y) !== m) this.l[i] = Math.max(this.l[i], 3); if (this.get(x, y + 1) !== m || this.get(x + 1, y) !== m) this.l[i] = Math.min(this.l[i], 1); } }
  /* the outline: every empty pixel touching a shape takes the darkest colour of what it touches */
  outline() { const add = []; for (let y = 0; y < this.h; y++) for (let x = 0; x < this.w; x++) { if (this.get(x, y) != null) continue; const n = [[0, -1], [1, 0], [0, 1], [-1, 0]].map(([a, b]) => this.get(x + a, y + b)).filter(v => v != null && v >= 0);
    if (n.length) add.push([x, y, n[0]]); } for (const [x, y, m] of add) { this.m[y * this.w + x] = m; this.l[y * this.w + x] = 0; } }
  render() { const out = new Array(this.w * this.h).fill(null); for (let i = 0; i < out.length; i++) { if (this.fixed.has(i)) out[i] = this.fixed.get(i); else if (this.m[i] != null && this.m[i] >= 0) out[i] = this.mats[this.m[i]][this.l[i]]; } return out; }
}
const ink = s => s.mat(['#120a0a', '#120a0a', '#120a0a', '#fff', '#fff']);

/* ================= Old Tusk, the Boar King (the approved design) ================= */
const oldtusk = () => { const s = new P(64, 64), Y = 2, hide = s.mat('#8a6a52', { cool: '#1a1030', warm: '#ffe0b0' }), dark = s.mat('#5c4034'), mane = s.mat('#3e2a22'), snout = s.mat('#d89a8e'), tusk = s.mat('#f4ecd8'), gold = s.mat('#e8b440'), club = s.mat('#7a5232'), iron = s.mat('#8a94a2'), cloth = s.mat('#6a7a3a'), k = s.mat(['#120806', '#120806', '#ff5a2a', '#ffb060', '#fff2c0']);
  const y = v => v + Y;
  s.ell(22, y(52), 5, 7, dark); s.ell(40, y(52), 5, 7, hide); s.ell(21, y(59), 6, 2.6, mane, { flat: 1 }); s.ell(41, y(59), 6, 2.6, mane);
  s.poly([[52, y(8)], [60, y(2)], [63, y(8)], [56, y(14)]], club); s.line(52, y(12), 46, y(30), club, 2); s.line(53, y(12), 47, y(30), club, 3); for (const [x, yy] of [[57, 3], [61, 6], [55, 10], [59, 11]]) s.dot(x, y(yy), iron, 4);
  s.ell(31, y(34), 16, 14, hide); s.ell(25, y(31), 6.5, 5.5, hide); s.ell(37, y(31), 6.5, 5.5, hide); s.ell(31, y(40), 10, 7, s.mat('#b8967a')); for (let i = 0; i < 9; i++) s.ell(18 + i * 3.2, y(22 + Math.sin(i) * 1.5), 2.2, 3.2, mane, { flat: i % 2 ? 1 : 2 });
  s.rect(17, y(41), 29, 4, s.mat('#4a3020')); s.poly([[18, y(45)], [45, y(45)], [43, y(52)], [20, y(52)]], cloth); s.edges(cloth); s.ell(31, y(43), 3.4, 3, iron); s.dot(30, y(42), k, 0); s.dot(32, y(42), k, 0);
  s.ell(13, y(32), 5.5, 6, hide); s.ell(12, y(39), 4.5, 4.5, hide); s.ell(12, y(45), 4, 3.6, dark); s.rect(9, y(38), 8, 3, gold, { flat: 3 }); s.ell(48, y(26), 5, 7, hide); s.ell(47, y(31), 4, 3.6, dark); s.rect(43, y(22), 9, 3, gold, { flat: 2 });
  s.ell(31, y(15), 10, 8.5, hide); s.ell(31, y(20), 6, 4.4, snout); s.ell(29, y(21), 1, 1.2, dark, { flat: 1 }); s.ell(33, y(21), 1, 1.2, dark, { flat: 1 });
  s.poly([[24, y(20)], [22, y(13)], [26, y(18)]], tusk); s.poly([[38, y(20)], [40, y(13)], [36, y(18)]], tusk); s.poly([[22, y(9)], [19, y(3)], [26, y(8)]], dark); s.poly([[40, y(9)], [43, y(3)], [36, y(8)]], dark);
  s.rect(25, y(5), 12, 3, gold); for (const x of [25, 30, 35]) s.poly([[x, y(5)], [x + 1, y(1)], [x + 2, y(5)]], gold, { flat: 3 }); s.dot(31, y(6), k, 2);
  s.outline();
  s.dot(26, y(14), k, 2); s.dot(27, y(14), k, 3); s.dot(35, y(14), k, 2); s.dot(36, y(14), k, 3); s.line(25, y(12), 28, y(13), mane, 0); s.line(37, y(12), 34, y(13), mane, 0); return s; };

/* ================= a heavy biped (Grubnash, Frostmaw): legs planted, a barrel chest, one fist down, one raised ================= */
const brute = (o) => { const s = new P(64, 64), hide = s.mat(o.hide), dark = s.mat(o.dark), belly = s.mat(o.belly), mane = s.mat(o.mane || o.dark), kilt = s.mat(o.kilt), belt = s.mat(o.belt || '#4a3020'), brace = s.mat(o.brace || '#e8b440'), wpn = s.mat(o.wpn || '#7a5232'), stud = s.mat(o.stud || '#8a94a2');
  s.ell(22, 53, 5, 7, dark); s.ell(40, 53, 5, 7, hide); s.ell(21, 60, 6, 2.6, s.mat(o.foot || o.dark), { flat: 1 }); s.ell(41, 60, 6, 2.6, s.mat(o.foot || o.dark));
  o.weapon(s, wpn, stud);
  s.ell(31, 35, 16, 14, hide); s.ell(25, 32, 6.5, 5.5, hide); s.ell(37, 32, 6.5, 5.5, hide); s.ell(31, 41, 10, 7, belly);
  if (o.mane) for (let i = 0; i < 9; i++) s.ell(18 + i * 3.2, 23 + Math.sin(i) * 1.5, 2.4, 3.2, mane, { flat: i % 2 ? 1 : 2 });
  s.rect(17, 42, 29, 4, belt); s.poly([[18, 46], [45, 46], [43, 53], [20, 53]], kilt); s.edges(kilt); for (let x = 22; x < 43; x += 5) s.line(x, 47, x - 1, 52, kilt, 1);
  s.ell(13, 33, 5.5, 6, hide); s.ell(12, 40, 4.5, 4.5, hide); s.ell(12, 46, 4, 3.6, dark); s.rect(9, 39, 8, 3, brace, { flat: 3 }); s.ell(48, 27, 5, 7, hide); s.ell(47, 32, 4, 3.6, dark); s.rect(43, 23, 9, 3, brace, { flat: 2 });
  o.extra && o.extra(s, { hide, dark, belly, mane, belt, brace, stud });
  o.head(s, { hide, dark, mane, brace, stud });
  s.outline(); o.face(s, ink(s)); return s; };
const clubUp = (s, w, st) => { s.poly([[52, 9], [60, 3], [63, 9], [56, 15]], w); s.line(52, 13, 46, 31, w, 2); s.line(53, 13, 47, 31, w, 3); for (const [x, y] of [[57, 4], [61, 7], [55, 11], [59, 12]]) s.dot(x, y, st, 4); };
const grubnash = () => brute({ hide: '#6f9e4c', dark: '#4a6e34', belly: '#9ab86a', mane: '#6a4a2a', kilt: '#7a4a2a', belt: '#3a2618', brace: '#8a94a2', wpn: '#6a4428', stud: '#c8d0d8', foot: '#3a2a1e',
  weapon: clubUp,
  extra: (s, m) => { const pelt = s.mat('#8a7460'); s.poly([[15, 22], [47, 22], [44, 30], [31, 27], [18, 30]], pelt); s.edges(pelt); for (const x of [18, 24, 30, 36, 42]) s.dot(x, 29, pelt, 1); const bone = s.mat('#e8dcc0'); s.ell(31, 44, 3, 2.6, bone); s.dot(30, 44, bone, 0); s.dot(32, 44, bone, 0); },
  head: (s, m) => { const skin = m.hide, ear = s.mat('#7cae54'), helm = s.mat('#8a94a2'), horn = s.mat('#efe2c4'), tooth = s.mat('#f4ecd8');
    s.poly([[22, 15], [5, 9], [9, 13], [22, 20]], ear); s.poly([[40, 15], [57, 9], [53, 13], [40, 20]], ear);
    s.ell(31, 16, 10, 8.5, skin); s.ell(31, 19, 4, 3, s.mat('#5f8e3e'));
    for (let y = 5; y <= 11; y++) for (let x = 20; x <= 42; x++) { const nx = (x + .5 - 31) / 11, ny = (y + .5 - 12) / 7.5; if (nx * nx + ny * ny <= 1) s.dot(x, y, helm, A.sphere(nx, ny)); }
    s.rect(20, 11, 23, 2, helm); s.poly([[21, 8], [14, -1], [17, -1], [24, 6]], horn); s.poly([[41, 8], [48, -1], [45, -1], [38, 6]], horn);
    s.line(24, 24, 38, 24, s.mat('#2a1a10'), 2); s.poly([[25, 25], [26, 19], [28, 24]], tooth); s.poly([[37, 25], [36, 19], [34, 24]], tooth); },
  face: (s, k) => { const y = s.mat(['#140c08', '#140c08', '#f6d24a', '#fff4a0', '#fff4a0']); s.dot(26, 15, y, 2); s.dot(27, 15, y, 2); s.dot(35, 15, y, 2); s.dot(36, 15, y, 2); s.dot(27, 16, k, 0); s.dot(35, 16, k, 0); s.line(24, 13, 28, 14, k, 0); s.line(38, 13, 34, 14, k, 0); } });
const frostmaw = () => brute({ hide: '#cfe4f0', dark: '#8aaabd', belly: '#e8f4fa', mane: '#b0cede', kilt: '#5a6a8a', belt: '#3a4458', brace: '#7ae0ff', wpn: '#a8e0f4', stud: '#ffffff', foot: '#6a8a9c',
  weapon: (s, w, st) => { s.poly([[50, 4], [58, 0], [62, 6], [57, 16], [52, 13]], w); s.edges(w); s.line(52, 13, 46, 31, s.mat('#6a7a8a'), 2); s.line(53, 13, 47, 31, s.mat('#6a7a8a'), 3); s.dot(57, 3, st, 4); s.dot(55, 8, st, 4); },
  extra: (s, m) => { const ice = s.mat('#9ad8f4'); for (const [x, y, h] of [[17, 22, 9], [22, 20, 7], [40, 20, 7], [45, 22, 9], [12, 26, 6], [50, 21, 6]]) { s.poly([[x - 2, y + 2], [x, y - h], [x + 2, y + 2]], ice); } },
  head: (s, m) => { const face = s.mat('#6a8aa8'), horn = s.mat('#e8e0d0'), fang = s.mat('#ffffff');
    s.ell(31, 15, 11, 9, m.hide); s.ell(31, 18, 6.5, 5.5, face); s.poly([[21, 10], [13, 2], [12, 8], [20, 14]], horn); s.poly([[41, 10], [49, 2], [50, 8], [42, 14]], horn);
    s.line(27, 22, 35, 22, s.mat('#1e2a3a'), 2); s.poly([[28, 23], [29, 19], [30, 23]], fang); s.poly([[34, 23], [33, 19], [32, 23]], fang); s.ell(31, 11, 7, 2, m.mane, { flat: 3 }); },
  face: (s, k) => { const g = s.mat(['#0a1838', '#0a1838', '#7ae8ff', '#c8f8ff', '#ffffff']); s.dot(28, 16, g, 3); s.dot(29, 16, g, 2); s.dot(33, 16, g, 3); s.dot(34, 16, g, 2); s.line(26, 14, 29, 15, k, 0); s.line(36, 14, 33, 15, k, 0); } });

/* ================= Barnacle Bill: a drowned captain in a long coat, cutlass raised ================= */
const barnacle = () => { const s = new P(64, 64), skin = s.mat('#7ab8c0'), coat = s.mat('#2a4a6a'), coatD = s.mat('#1e3450'), shirt = s.mat('#d8d0b8'), hat = s.mat('#1e2a3a'), gold = s.mat('#e6b84a'), kelp = s.mat('#4a7a5a'), boot = s.mat('#2a2220'), peg = s.mat('#9a6a42'), steel = s.mat('#6fc7d8'), barn = s.mat('#e8e4d8'), belt = s.mat('#4a3020');
  s.rect(24, 48, 6, 10, coatD); s.rect(22, 57, 9, 4, boot); s.rect(35, 48, 4, 12, peg); s.rect(34, 59, 6, 2, peg, { flat: 1 });                                       /* a boot and a peg */
  s.poly([[18, 24], [46, 24], [50, 52], [14, 52]], coat); s.edges(coat); s.poly([[28, 24], [36, 24], [35, 46], [29, 46]], shirt); s.edges(shirt);                     /* the long coat over a shirt */
  for (const y of [28, 33, 38]) { s.dot(27, y, gold, 4); s.dot(37, y, gold, 4); }
  s.rect(17, 40, 30, 4, belt); s.rect(30, 40, 4, 4, gold, { flat: 3 });
  s.poly([[14, 52], [18, 52], [16, 58], [12, 56]], coat); s.poly([[46, 52], [50, 52], [52, 57], [47, 58]], coat);                                                   /* coat tails */
  s.ell(15, 30, 5, 6, coat); s.ell(13, 38, 4, 5, coat); s.ell(12, 44, 3.6, 3.4, skin);                                                                              /* the left arm down */
  s.ell(48, 28, 5, 6, coat); s.ell(51, 21, 4, 4.4, coat); s.ell(53, 16, 3.4, 3.2, skin);                                                                            /* the right arm up */
  s.poly([[52, 14], [55, 12], [58, 1], [61, 0], [59, 6], [56, 14]], steel); s.rect(50, 13, 7, 2, gold, { flat: 3 });                                                 /* a cutlass */
  for (const [x, y] of [[20, 30], [24, 45], [42, 33], [44, 47], [16, 36], [47, 40]]) { s.ell(x, y, 1.6, 1.4, barn); }
  s.ell(32, 14, 9, 8.5, skin); for (let i = 0; i < 7; i++) s.line(25 + i * 2.2, 19, 24 + i * 2.4, 28 + (i % 3) * 2, kelp, i % 2 ? 1 : 3);                           /* a kelp beard */
  s.poly([[18, 9], [46, 9], [42, 1], [32, 4], [22, 1]], hat); s.edges(hat); s.line(19, 9, 45, 9, gold, 3); s.ell(32, 5, 2, 2, s.mat('#efe2c4'));                  /* tricorn with a skull pin */
  s.outline();
  const e = s.mat(['#0c1c1c', '#0c1c1c', '#e8f070', '#f8ffb0', '#fff']); s.dot(28, 14, e, 2); s.dot(29, 14, e, 3); s.dot(35, 14, e, 2); s.dot(36, 14, e, 3); s.line(26, 12, 29, 13, s.mat('#2a4a4a'), 0); s.line(38, 12, 35, 13, s.mat('#2a4a4a'), 0); s.dot(32, 17, skin, 1);
  return s; };

/* ================= Morwenna, the bog witch: a hunched robe, a tall bent hat, a staff with a green light ================= */
const morwenna = () => { const s = new P(64, 64), robe = s.mat('#4a3a6a'), robeD = s.mat('#33284a'), skin = s.mat('#a8c890'), hat = s.mat('#2a2238'), band = s.mat('#7a5a2a'), hair = s.mat('#3a3a3a'), wood = s.mat('#5a4030'), orb = s.mat('#9be07a', { warm: '#f0fff0' }), moss = s.mat('#5f8a4a'), cand = s.mat('#efe2c4');
  s.line(48, 61, 50, 8, wood, 2); s.line(49, 61, 51, 8, wood, 3); s.ell(51, 6, 4.4, 4.4, orb); for (const [x, y] of [[46, 4], [55, 3], [54, 10]]) s.line(50, 7, x, y, wood, 1);            /* the staff, its root claws round the orb */
  s.poly([[22, 24], [42, 24], [52, 61], [10, 61]], robe); s.edges(robe); for (let x = 12; x < 52; x += 5) s.poly([[x, 61], [x + 2, 56], [x + 4, 61]], robeD);      /* a ragged hem */
  s.line(32, 26, 30, 58, robeD, 1); s.ell(20, 34, 5, 7, robe); s.ell(18, 44, 4, 5, robe); s.ell(44, 33, 5, 6, robe); s.ell(48, 38, 3.4, 3, skin);                  /* arms */
  for (let i = 0; i < 4; i++) s.line(15 + i * 2, 47, 14 + i * 2, 52, skin, 2);                                                                                       /* a clawed hand */
  for (const [x, y] of [[16, 58], [26, 59], [40, 57]]) s.ell(x, y, 2.4, 1.4, moss);
  s.ell(30, 21, 8, 7, skin); s.poly([[34, 20], [42, 24], [35, 24]], skin);                                                                                         /* face and a long nose */
  s.rect(21, 17, 3, 12, hair); s.rect(37, 17, 2, 8, hair);
  s.poly([[14, 15], [48, 15], [44, 11], [18, 11]], hat); s.poly([[22, 12], [40, 12], [38, 0], [30, -2], [26, 4]], hat); s.edges(hat); s.rect(22, 10, 18, 2, band, { flat: 3 }); s.dot(31, 10, s.mat('#e6c86a'), 4);
  s.ell(10, 51, 3, 4, cand); s.dot(10, 46, s.mat('#ffd060'), 4); s.dot(10, 45, s.mat('#fff2a0'), 4);
  s.outline();
  const e = s.mat(['#102008', '#102008', '#c8f070', '#f0ffb0', '#fff']); s.dot(28, 19, e, 2); s.dot(33, 19, e, 2); s.dot(28, 18, e, 4); s.dot(33, 18, e, 4); s.line(27, 25, 33, 25, s.mat('#3a4a2a'), 0); s.dot(29, 26, s.mat('#e8e0c0'), 3);
  return s; };

/* ---------- tools for the hand-built bosses ---------- */
/* a limb, neck or tail along a polyline, tapering from r0 to r1 and lit as a cylinder (each pixel takes the sphere light
   of its offset from the axis), so arms and necks read as round forms like the ellipses do */
const tube = (s, pts, r0, r1, m, o = {}) => { const seg = []; let L = 0; for (let i = 1; i < pts.length; i++) { const [ax, ay] = pts[i - 1], [bx, by] = pts[i], l = Math.hypot(bx - ax, by - ay) || 1; seg.push([ax, ay, bx, by, l, L]); L += l; }
  const R = Math.max(r0, r1), xs = pts.map(p => p[0]), ys = pts.map(p => p[1]);
  for (let y = Math.floor(Math.min(...ys) - R); y <= Math.ceil(Math.max(...ys) + R); y++) for (let x = Math.floor(Math.min(...xs) - R); x <= Math.ceil(Math.max(...xs) + R); x++) { const px = x + .5, py = y + .5; let best = null;
    for (const [ax, ay, bx, by, l, l0] of seg) { const t = Math.max(0, Math.min(1, ((px - ax) * (bx - ax) + (py - ay) * (by - ay)) / (l * l))), cx = ax + (bx - ax) * t, cy = ay + (by - ay) * t, d = Math.hypot(px - cx, py - cy), r = r0 + (r1 - r0) * (l0 + t * l) / L;
      if (d <= r && (!best || d / r < best[0])) best = [d / r, (px - cx) / r, (py - cy) / r]; }
    if (best) s.set(x, y, m, o.flat != null ? o.flat : A.sphere(best[1], best[2])); } };
/* change the light steps of one material by a rule (scales, mail, seams): f(x, y, step) returns the new step or null */
const grain = (s, m, f) => { for (let y = 0; y < s.h; y++) for (let x = 0; x < s.w; x++) if (s.get(x, y) === m) { const i = y * s.w + x, v = f(x, y, s.l[i]); if (v != null) s.l[i] = v; } };
/* light a material as an upright cylinder about column cx (bells, helms, barrels) */
const column = (s, m, cx, rx) => grain(s, m, (x, y, l) => l === 0 ? null : A.sphere(Math.max(-.98, Math.min(.98, (x + .5 - cx) / rx)), -.15));
/* one fixed colour per pixel, for light that should not be outlined (beams, glows, smoke, sound) */
const glint = (s, pts, c) => { for (const [x, y] of pts) s.fix(x, y, c); };

/* ================= Pyrrhax, the Ember Wyrm: reared on its haunches, wings up, embers showing through the belly plates ================= */
const pyrrhax = () => { const s = new P(64, 64), sc = s.mat('#d8503a', { warm: '#ffd890' }), scD = s.mat('#9a2e2a'), bone = s.mat('#7a2232'), mem = s.mat('#b8443a', { warm: '#ffb070' }), memD = s.mat('#842a34'),
    belly = s.mat('#f0b448', { warm: '#fff2c0' }), horn = s.mat('#efe2c4'), claw = s.mat('#f4e8d0'), spike = s.mat('#ff9a3a'), fire = s.mat(['#5a1000', '#ff5a1a', '#ffa030', '#ffd860', '#fffbe0']);
  /* the far wing, behind everything: its arm rises behind the neck, its sail shows between the near wing and the head */
  s.poly([[36, 30], [39, 16], [33, 1], [28, 10], [27, 20], [30, 28]], memD); tube(s, [[37, 30], [40, 16], [33, 1]], 2, 1.2, bone);
  /* the near wing: arm up to a clawed wrist, three fingers fanning down, a scalloped membrane back to the flank */
  s.poly([[29, 30], [24, 14], [12, 3], [1, 17], [7, 21], [3, 31], [10, 30], [12, 37], [18, 35], [24, 41]], mem);
  grain(s, mem, (x, y) => (y > 30 - x * .55 + 6 ? 1 : null));
  tube(s, [[30, 31], [24, 14], [12, 3]], 2.6, 1.6, bone); for (const [x, y] of [[1, 17], [3, 31], [12, 37]]) tube(s, [[12, 4], [x, y]], 1.2, .8, bone);
  s.poly([[11, 3], [8, -1], [13, 2]], claw);
  /* the tail, curled along the ground behind the hind leg, a spade at its tip */
  tube(s, [[30, 56], [18, 59.5], [8, 58], [3, 51], [5, 44]], 4.4, 1.4, sc); s.poly([[2, 45], [5, 37], [10, 44], [5, 47]], spike);
  /* far legs */
  tube(s, [[38, 48], [39, 58]], 3, 2.6, scD); s.ell(40, 60.5, 4, 2, scD);
  /* the body: a haunch, a deep chest leaning forward */
  s.ell(29, 44, 13, 10, sc); s.ell(39, 36, 8, 10, sc);
  /* the neck, curling up and forward to the head */
  tube(s, [[37, 34], [41, 24], [46, 17]], 6.4, 4.4, sc);
  /* belly plates from the throat to between the legs, embers glowing through the seams */
  tube(s, [[47, 20], [44, 28], [42, 38], [37, 48]], 2.4, 4.6, belly); grain(s, belly, (x, y, l) => (y % 3 === 0 ? 1 : null));
  for (const [x, y] of [[42, 33], [40, 39], [44, 27], [38, 45], [41, 42]]) s.dot(x, y, fire, 3); for (const [x, y] of [[43, 33], [41, 39], [39, 45]]) s.dot(x, y, fire, 2);
  /* dorsal spikes down the neck and back */
  for (const [x, y, a] of [[42, 17, 0], [39, 23, 0], [36, 28, 1], [31, 33, 1], [25, 34, 2], [19, 37, 2], [15, 41, 2]]) s.poly(a === 0 ? [[x, y + 2], [x - 4, y - 1], [x + 1, y - 1]] : [[x - 2, y + 1], [x - 2 - a, y - 4], [x + 2, y]], spike);
  /* the near legs: a thick haunch and hind foot, a foreleg planted in front */
  s.ell(23, 47, 9, 9, sc, { flat: 1 }); s.ell(23, 47, 8, 8, sc); tube(s, [[20, 52], [19, 58]], 4, 3.4, sc); s.ell(21, 60.5, 6.4, 2.4, scD); for (const x of [25, 27]) { s.dot(x, 61, claw, 3); s.dot(x + 1, 62, claw, 2); }
  tube(s, [[43, 42], [44, 47], [47, 58]], 5.4, 3.8, sc, { flat: 1 }); s.ell(43, 44, 4.6, 6, sc); tube(s, [[44, 47], [47, 58]], 3.2, 2.8, sc); s.ell(48, 60.5, 5, 2.2, scD); for (const x of [51, 53]) { s.dot(x, 61, claw, 3); s.dot(x + 1, 62, claw, 2); }
  /* the head: a heavy skull, a long snout, the jaw a little open with fire inside */
  s.ell(50, 13, 7, 6, sc); s.poly([[51, 8], [60, 11], [63, 14], [62, 17], [51, 18]], sc); s.edges(sc);
  s.poly([[49, 17], [60, 18], [59, 21], [51, 22]], scD); s.line(53, 18, 61, 18, fire, 3); s.line(54, 19, 59, 19, fire, 2); for (const x of [55, 58]) s.dot(x, 17, claw, 3);
  s.poly([[45, 14], [39, 18], [46, 18]], spike); s.line(47, 9, 55, 10, scD, 1);
  s.poly([[47, 9], [35, 2], [38, 1], [50, 6]], horn); s.poly([[51, 7], [45, -1], [48, -1], [54, 6]], horn);
  grain(s, sc, (x, y, l) => (l === 3 && y % 3 === 1 && (x + ((y / 3) | 0) * 2) % 4 === 0 ? 2 : null));
  s.outline();
  const e = s.mat(['#200800', '#200800', '#ffd040', '#fff2a0', '#ffffff']); s.dot(53, 11, e, 4); s.dot(54, 11, e, 3); s.dot(53, 12, e, 2); s.dot(54, 12, e, 2); s.line(51, 10, 55, 10, s.mat('#3a0a0a'), 0);
  s.dot(60, 13, s.mat('#3a0a0a'), 0); s.dot(61, 13, s.mat('#3a0a0a'), 0);
  glint(s, [[63, 19], [62, 20], [63, 21]], '#ffb040'); glint(s, [[60, 6], [57, 3], [62, 9]], '#ff8a3a'); glint(s, [[59, 4]], '#ffd860');
  return s; };

/* ================= Zephyrion, the storm roc: wings spread, a crest of feathers, lightning in its talons ================= */
const zephyrion = () => { const s = new P(64, 64), body = s.mat('#bfe8ff'), wing = s.mat('#7ab8e0'), wingD = s.mat('#4a86b8'), crest = s.mat('#ffffff'), beak = s.mat('#f0c040'), talon = s.mat('#4a3a2a'), bolt = s.mat('#fff2a0', { warm: '#ffffff' });
  for (const side of [-1, 1]) { const X = x => 32 + side * x;
    s.poly([[X(6), 26], [X(30), 10], [X(31), 18], [X(28), 26], [X(30), 32], [X(22), 36], [X(8), 38]], wing);
    for (let i = 0; i < 5; i++) s.poly([[X(12 + i * 4), 34 - i], [X(14 + i * 4), 44 - i * 2], [X(17 + i * 4), 33 - i]], wingD);
    for (let i = 0; i < 4; i++) s.line(X(10 + i * 5), 30 - i * 3, X(26), 14 + i * 3, wingD, 1); }
  s.poly([[26, 48], [32, 60], [38, 48]], wing); s.poly([[22, 50], [26, 58], [30, 50]], wingD); s.poly([[34, 50], [38, 58], [42, 50]], wingD);
  s.ell(32, 38, 10, 12, body); s.ell(32, 41, 6, 7, s.mat('#e8f6ff'));
  for (const x of [27, 37]) { s.line(x, 49, x, 55, talon, 2); s.line(x - 2, 56, x + 2, 56, talon, 1); }
  s.ell(32, 20, 7.5, 7, body); s.poly([[29, 23], [32, 30], [35, 23]], beak); s.line(32, 25, 32, 28, s.mat('#c89020'), 1);
  for (const [a, b] of [[26, 6], [30, 3], [34, 3], [38, 6]]) s.poly([[a - 1, 15], [a, b], [a + 2, 15]], crest);
  s.line(14, 52, 18, 45, bolt, 3); s.line(18, 45, 15, 44, bolt, 3); s.line(15, 44, 20, 36, bolt, 4); s.line(50, 52, 46, 45, bolt, 3); s.line(46, 45, 49, 44, bolt, 3); s.line(49, 44, 44, 36, bolt, 4);
  s.outline();
  const e = s.mat(['#10203a', '#10203a', '#10203a', '#fff', '#fff']); s.dot(28, 19, e, 0); s.dot(28, 20, e, 0); s.dot(36, 19, e, 0); s.dot(36, 20, e, 0); s.dot(28, 18, e, 4); s.dot(36, 18, e, 4); s.line(26, 16, 29, 17, s.mat('#3a5a7a'), 0); s.line(38, 16, 35, 17, s.mat('#3a5a7a'), 0);
  return s; };

/* ================= The Hollow King: heavy plate over a tattered cape, a skull under the open helm, a crown of violet
   crystal, both gauntlets on the pommel of a greatsword planted before him; a crack in the breastplate shows the void ================= */
const hollowking = () => { const s = new P(64, 64), pl = s.mat('#6a5a90', { cool: '#120c30' }), plD = s.mat('#463a68', { cool: '#0e0a28' }), cape = s.mat('#6a3a8a'), capeD = s.mat('#40205a'), lining = s.mat('#8a2a4a'),
    crown = s.mat('#b08aff', { warm: '#f4eaff' }), gold = s.mat('#c8a048'), bone = s.mat('#ddd4c4', { cool: '#2a2048' }), blade = s.mat('#c0b8e0', { warm: '#ffffff' }), grip = s.mat('#4a3020'),
    hole = s.mat(['#06040c', '#06040c', '#0e0a18', '#0e0a18', '#0e0a18']), glow = s.mat(['#2a1050', '#8a4aff', '#b08aff', '#e0d0ff', '#ffffff']);
  /* the cape: a high collar behind the helm, falling wide to a torn hem, its red lining showing at the edges */
  const hem = []; for (let x = 60, i = 0; x >= 4; x -= 4, i++) hem.push([x, i % 2 ? 56 : 62]); s.poly([[14, 21], [50, 21], [60, 62], ...hem, [4, 62]], cape); s.edges(cape);
  s.poly([[14, 21], [8, 50], [4, 62], [9, 58], [12, 40]], lining); s.poly([[50, 21], [56, 50], [60, 62], [55, 58], [52, 40]], lining);
  for (const [x, d] of [[18, -3], [24, -2], [40, 2], [46, 3]]) s.line(x, 30, x + d, 58, capeD, 1);
  s.poly([[19, 20], [21, 6], [26, 16]], capeD); s.poly([[45, 20], [43, 6], [38, 16]], capeD);
  /* legs in greaves, knee cops, broad sabatons */
  tube(s, [[26, 47], [25, 57]], 4.2, 3.8, plD); tube(s, [[38, 47], [39, 57]], 4.2, 3.8, pl); s.ell(25.5, 51, 3.2, 2.8, plD); s.ell(38.5, 51, 3.2, 2.8, pl);
  s.ell(23.5, 60, 6, 2.6, plD); s.ell(40.5, 60, 6, 2.6, pl);
  /* the faulds: three lames of plate below a belt */
  s.poly([[19, 42], [45, 42], [48, 51], [16, 51]], plD); s.edges(plD); for (const y of [45, 48]) s.line(18, y, 46, y, plD, 1);
  /* the breastplate, sphere-lit, with a ridge and a crack full of void light */
  s.ell(32, 32, 13, 11, pl); s.line(32, 23, 32, 40, pl, 1); s.line(33, 24, 33, 38, pl, 3);
  for (const [x, y] of [[23, 30], [24, 34], [40, 30], [39, 34]]) s.line(x, y, x + (x < 32 ? 4 : -4), y + 1, pl, 1);
  for (const [x, y, l] of [[37, 25, 2], [38, 26, 3], [38, 27, 4], [37, 28, 3], [37, 29, 4], [38, 30, 3], [39, 31, 2], [39, 32, 3], [38, 33, 2]]) s.dot(x, y, glow, l);
  s.line(26, 22, 38, 22, gold, 3); s.rect(19, 41, 26, 2, gold, { flat: 3 });
  /* pauldrons, layered lames and spikes */
  for (const [x, d, m] of [[16, -1, plD], [48, 1, pl]]) { s.poly([[x - 3, 21], [x - 1 + d * 4, 9], [x + 3, 20]], m); s.ell(x, 30, 6, 3.4, plD); s.ell(x, 24.5, 8, 6.5, m); s.line(x - 6, 28, x + 6, 28, gold, 2); s.line(x - 5, 29, x + 5, 29, gold, 1); }
  /* arms down to both gauntlets stacked on the grip */
  for (const [a, m] of [[[[15, 31], [20, 36], [27, 39]], plD], [[[49, 31], [44, 36], [37, 39]], plD]]) { tube(s, a, 5, 4.4, m, { flat: 1 }); tube(s, a, 4, 3.4, m); }
  /* the greatsword, point in the ground */
  s.poly([[29, 45], [35, 45], [35, 58], [32, 62], [29, 58]], blade); s.edges(blade); s.line(32, 46, 32, 58, blade, 1);
  s.rect(21, 42, 22, 3, gold); s.dot(21, 45, gold, 1); s.dot(42, 45, gold, 1); s.rect(31, 33, 3, 9, grip);
  s.ell(28, 38, 3.6, 3.2, pl); s.ell(36, 38, 3.6, 3.2, pl); s.ell(32, 32, 2, 2, glow);
  /* the helm, open at the face: a skull inside, dark sockets, a jaw of teeth */
  s.ell(32, 13, 8.5, 9, pl); s.poly([[26, 10], [38, 10], [37, 19], [32, 23], [27, 19]], hole, { flat: 2 });
  s.ell(32, 15, 5, 5.6, bone); s.rect(28, 13, 3, 3, hole, { flat: 2 }); s.rect(34, 13, 3, 3, hole, { flat: 2 }); s.dot(32, 17, hole, 2);
  for (let x = 29; x <= 35; x += 2) s.dot(x, 19, hole, 2); s.line(29, 20, 35, 20, bone, 1);
  /* the crown: a band with five violet crystal points */
  s.rect(23, 4, 18, 3, gold); for (const [x, h] of [[23, 4], [27, 6], [32, 7], [37, 6], [41, 4]]) s.poly([[x - 1.5, 5], [x, 5 - h], [x + 1.5, 5]], crown); s.edges(crown);
  s.outline();
  s.dot(29, 14, glow, 4); s.dot(29, 15, glow, 3); s.dot(35, 14, glow, 4); s.dot(35, 15, glow, 3); s.dot(32, 5, s.mat('#ff7ad0'), 4); s.dot(27, 5, s.mat('#7ad0ff'), 4); s.dot(37, 5, s.mat('#7ad0ff'), 4);
  glint(s, [[10, 14], [55, 12], [6, 30], [58, 34], [52, 6], [12, 6]], '#b08aff'); glint(s, [[11, 13], [54, 11]], '#e0d0ff');
  return s; };

/* ================= the tower bosses at 64 x 64: each the same character as its 32 x 32 sprite, drawn properly large ================= */

/* Old Squeak, King of Rats (the Old Granary): sat up on his haunches in a red cloak, a thimble for a crown, a dinner fork
   for a sceptre and a wedge of stolen cheese */
const tw_squeak = () => { const s = new P(64, 64), fur = s.mat('#9a8a70'), furD = s.mat('#6a5a48'), cream = s.mat('#d8c8b0'), pink = s.mat('#e0a0a0'), gold = s.mat('#e8c860'), cloak = s.mat('#b0383a'),
    ermine = s.mat('#efe8dc', { cool: '#3a3a5a' }), fork = s.mat('#b8c0cc', { warm: '#ffffff' }), cheese = s.mat('#f0c040'), tooth = s.mat('#f4ecd8');
  tube(s, [[20, 58], [9, 60], [3, 54], [4, 46], [10, 41]], 2.4, 1, pink);                                                                        /* the tail */
  s.poly([[20, 24], [36, 22], [40, 58], [12, 59]], cloak); s.edges(cloak); s.rect(12, 56, 28, 3, ermine); for (const x of [15, 21, 27, 33]) s.dot(x, 57, s.mat('#1a1418'), 2);
  s.ell(37, 60.5, 5, 2, pink, { flat: 1 });                                                                                                         /* far foot */
  s.ell(30, 42, 12, 13, fur); s.ell(33, 46, 7, 9, cream);                                                                                        /* the pot belly */
  s.ell(22, 50, 8, 7, fur); s.line(16, 55, 28, 56, fur, 1); s.ell(24, 60.5, 7, 2.2, pink); for (const x of [29, 31]) s.dot(x, 61, pink, 3);   /* the haunch and a long pink foot */
  for (let i = 0; i <= 10; i++) s.dot(25 + i * 1.2, 30 + Math.sin(i / 10 * Math.PI) * 5, gold, i % 2 ? 1 : 3); s.ell(31, 36, 2.4, 2.4, gold); s.dot(31, 36, s.mat('#e0403a'), 3);                     /* a chain of office */
  tube(s, [[25, 35], [21, 42], [25, 46]], 3.4, 2.8, fur); s.poly([[19, 43], [29, 40], [29, 48], [19, 48]], cheese); s.edges(cheese); for (const [x, y] of [[22, 45], [26, 43], [25, 47]]) s.dot(x, y, cheese, 1); s.ell(26, 45, 2.4, 2, pink);
  /* the fork, held like a sceptre and stood on the floor */
  s.line(47, 61, 47, 13, fork, 3); s.line(48, 61, 48, 13, fork, 1); s.rect(44, 11, 7, 2, fork); for (const x of [44, 46, 48, 50]) s.rect(x, 4, 1, 7, fork, { flat: x === 44 ? 4 : 3 });
  tube(s, [[37, 34], [43, 38], [46, 35]], 3.4, 2.8, fur); s.ell(47, 34.5, 2.6, 2.4, pink);
  /* the head: round ears, a long snout, buck teeth */
  s.ell(27, 11, 6, 6.5, fur); s.ell(27, 11.5, 3.6, 4.4, pink); s.ell(37, 20, 9, 8, fur); s.poly([[40, 15], [55, 22], [53, 26], [40, 27]], fur); s.edges(fur); s.ell(42, 24, 4, 3.4, cream);
  s.ell(54.5, 22.5, 2, 1.8, pink); s.rect(48, 26, 3, 3, tooth);
  s.ell(39, 9, 5, 5.5, fur); s.ell(39, 9.5, 3, 3.6, pink);
  /* the thimble, worn as a crown, a little too small */
  s.rect(29, 6, 9, 7, gold); s.ell(33.5, 6, 4.5, 2.4, gold); s.rect(28, 12, 11, 2, gold, { flat: 1 }); grain(s, gold, (x, y, l) => (y >= 6 && y <= 11 && (x + y) % 2 === 0 && x % 2 === 0 ? Math.max(1, l - 1) : null));
  s.outline();
  s.dot(45, 17, s.mat(['#1a1a1a', '#1a1a1a', '#1a1a1a', '#fff', '#fff']), 3); s.dot(45, 18, ink(s), 0); s.dot(46, 18, ink(s), 0); s.dot(46, 17, ink(s), 0);
  s.line(42, 15, 47, 15, furD, 0); s.line(49, 29, 51, 29, s.mat('#3a1a1a'), 0);
  for (const [y, d] of [[22, -1], [24, 0], [26, 1]]) glint(s, Array.from({ length: 6 }, (_, i) => [56 + i, y + Math.round(d * i / 2)]), '#d8c8b0');
  s.dot(37, 9, s.mat('#e0403a'), 4);
  return s; };

/* The Green Knight (the Watchtower in the Wood): green plate gone to leaf and vine, a mossy beard under the great helm,
   a leaf-crested helm, an oak shield, and the greenwood greatsword that is still growing */
const tw_greenknight = () => { const s = new P(64, 64), ar = s.mat('#3e7a4a', { warm: '#f0ffc8' }), arD = s.mat('#28543a'), leaf = s.mat('#9ad060'), leafD = s.mat('#5a9a34'), moss = s.mat('#6aa040'), wood = s.mat('#7a5a32'),
    rim = s.mat('#a8b4a8'), gold = s.mat('#c8a040'), steel = s.mat('#c8d4c8', { warm: '#ffffff' }), hole = s.mat(['#0a120a', '#0a120a', '#101a10', '#101a10', '#101a10']), glow = s.mat(['#1a3010', '#6ac040', '#a8f070', '#e0ffc0', '#ffffff']);
  const leafAt = (x, y, m = leaf, r = 1.8) => { s.ell(x, y, r, r * .62, m); };
  /* the greatsword, upright in the right hand, vines climbing the blade */
  s.poly([[50, 33], [50, 5], [52, 1], [54, 5], [54, 33]], steel); s.edges(steel); s.line(52, 5, 52, 32, steel, 1);
  tube(s, [[51, 30], [53, 24], [51, 18], [53, 12], [51, 7]], .9, .6, leafD); for (const [x, y] of [[49, 24], [55, 19], [49, 13], [55, 8]]) leafAt(x, y);
  /* legs, knee cops and sabatons */
  for (const [a, m] of [[[[26, 47], [25, 57]], arD], [[[38, 47], [39, 57]], ar]]) { tube(s, a, 4.8, 4.4, m, { flat: 1 }); tube(s, a, 4, 3.6, m); } s.ell(25.5, 51, 3, 2.6, ar); s.ell(38.5, 51, 3, 2.6, ar); s.ell(24, 60, 5.8, 2.6, arD); s.ell(40, 60, 5.8, 2.6, ar);
  /* a skirt of leaves over the faulds */
  s.poly([[20, 42], [44, 42], [47, 51], [17, 51]], arD); s.edges(arD); for (const y of [45, 48]) s.line(19, y, 45, y, arD, 1); for (const x of [21, 32, 43]) leafAt(x, 51, leaf, 2.2);
  /* the breastplate, vines across it */
  s.ell(32, 32, 12, 11, ar); s.line(32, 24, 32, 40, ar, 1); s.line(33, 24, 33, 40, ar, 3); s.line(24, 23, 40, 23, gold, 3); s.rect(20, 41, 24, 2, gold, { flat: 3 });
  tube(s, [[21, 27], [26, 32], [32, 30], [37, 35], [43, 31]], .9, .9, moss); for (const [x, y, m] of [[24, 28, leaf], [29, 33, leaf], [35, 31, leaf], [40, 36, leaf], [43, 29, leaf]]) leafAt(x, y, m, 2);
  /* pauldrons sprouting leaves */
  for (const x of [19, 45]) { s.ell(x, 24.5, 7, 6, ar); s.line(x - 6, 29, x + 6, 29, gold, 2); for (const [dx, dy, m] of [[-3, -5, leaf], [1, -6, leafD], [4, -4, leaf]]) leafAt(x + dx, 24 + dy, m, 2.2); }
  /* right arm to the sword's grip */
  tube(s, [[46, 30], [49, 35], [51, 38]], 4.6, 4, ar, { flat: 1 }); tube(s, [[46, 30], [49, 35], [51, 38]], 3.8, 3.2, ar);
  s.rect(46, 33, 11, 2, gold); s.rect(51, 35, 2, 8, wood); s.ell(52, 39, 3.4, 3, arD); s.ell(52, 44.5, 1.8, 1.8, gold);
  /* left arm behind a round oak shield bound in iron, a leaf on its face */
  tube(s, [[19, 29], [15, 36]], 4, 3.6, arD); s.ell(13, 41, 9, 10, rim); s.ell(13, 41, 7.6, 8.6, wood); for (const x of [10, 16]) s.line(x, 33, x, 49, wood, 1);
  s.poly([[13, 34], [18, 40], [13, 48], [8, 40]], leaf); s.line(13, 36, 13, 46, leafD, 1); s.edges(leaf);
  /* a mossy beard spilling from under the great helm */
  /* the great helm: flat-topped, a visor slit, breath holes, a crest of oak leaves */
  s.rect(25, 7, 15, 13, ar); s.ell(32.5, 8, 7.5, 4, ar); s.rect(26, 12, 13, 2, hole, { flat: 2 }); for (const [x, y] of [[35, 15], [37, 15], [36, 17], [38, 17]]) s.dot(x, y, hole, 2); s.line(32, 4, 32, 19, ar, 3);
  for (const [x, y, m, r] of [[32, 2, leaf, 3], [28, 3, leafD, 2.6], [36, 3, leafD, 2.6], [30, 0, leaf, 2], [34, 0, leaf, 2]]) leafAt(x, y, m, r);
  grain(s, ar, (x, y, l) => (y < 20 && y > 4 ? A.sphere((x + .5 - 32.5) / 8, (y + .5 - 12) / 11) : null));
  s.outline();
  for (const x of [29, 35]) { s.dot(x, 12, glow, 4); s.dot(x + 1, 12, glow, 3); s.dot(x, 13, glow, 3); s.dot(x + 1, 13, glow, 2); }
  glint(s, [[12, 22], [58, 28], [6, 54], [56, 52]], '#a8e070');
  return s; };

/* The Keeper of the Lamp (the Old Lighthouse): a stooped old keeper in a pea coat and peaked cap, a beard like sea foam,
   the great lamp held high and blazing, an oil can in the other hand */
const tw_keeper = () => { const s = new P(64, 64), coat = s.mat('#3a4a60'), coatD = s.mat('#283448'), skin = s.mat('#d8b8a0'), nose = s.mat('#e0907a'), beard = s.mat('#e8eaec', { cool: '#3a4a6a' }), cap = s.mat('#222a38'),
    brass = s.mat('#c8983a'), boot = s.mat('#2a2420'), trouser = s.mat('#4a4a52'), lamp = s.mat(['#6a4a10', '#f4c860', '#f4e08a', '#fff4c0', '#ffffff']), pipe = s.mat('#6a4428');
  /* legs and boots */
  tube(s, [[27, 48], [26, 57]], 3.6, 3.4, trouser); tube(s, [[36, 48], [37, 57]], 3.6, 3.4, trouser); s.ell(25, 60, 5.6, 2.6, boot); s.ell(38.5, 60, 5.6, 2.6, boot);
  /* the pea coat: long skirts, a round belly, two rows of brass buttons */
  s.poly([[20, 23], [43, 23], [47, 53], [16, 53]], coat); s.edges(coat); s.ell(31, 38, 11, 11, coat); s.line(32, 30, 31, 52, coatD, 1);
  for (const y of [31, 36, 41, 46]) { s.dot(28, y, brass, 4); s.dot(35, y, brass, 3); } s.rect(16, 52, 31, 1, coatD, { flat: 1 });
  /* left arm down with the oil can, its spout dripping */
  tube(s, [[21, 27], [17, 35], [17, 41]], 4.4, 3.6, coat, { flat: 1 }); tube(s, [[21, 27], [17, 35], [17, 41]], 3.6, 2.8, coat); s.ell(17, 43, 2.6, 2.4, skin);
  s.ell(16, 48, 4.6, 3.8, brass); s.rect(13, 43, 6, 2, brass); tube(s, [[13, 47], [8, 42], [6, 41]], 1.2, .7, brass);
  /* right arm raised, the lamp in its fist */
  tube(s, [[42, 27], [47, 21], [49, 13]], 4.4, 3.6, coat, { flat: 1 }); tube(s, [[42, 27], [47, 21], [49, 13]], 3.6, 2.8, coat); s.ell(49.5, 11, 2.8, 2.6, skin);
  s.rect(45, 13, 11, 13, brass); s.rect(47, 15, 7, 9, lamp, { flat: 3 }); s.ell(50.5, 19.5, 2.4, 3, lamp, { flat: 4 }); s.line(50, 15, 50, 23, brass, 2); s.rect(44, 25, 13, 2, brass); s.poly([[45, 13], [50.5, 8], [56, 13]], brass);
  /* the head: a big red nose, bushy brows, a foam of beard, a short pipe */
  s.ell(32, 15, 7.5, 7, skin); s.poly([[23, 17], [41, 17], [40, 26], [32, 31], [24, 26]], beard); s.edges(beard); s.ell(32, 20, 5, 2, beard);
  s.ell(35.5, 17, 2.6, 2.2, nose); s.ell(28.5, 12, 3, 1.5, beard, { flat: 3 }); s.ell(36.5, 12, 3, 1.5, beard, { flat: 3 });
  s.line(37, 22, 41, 23, pipe, 2); s.rect(41, 20, 2, 3, pipe);
  /* the peaked cap with its brass badge */
  s.ell(32, 7, 8.5, 3.6, cap); s.rect(24, 6, 17, 4, cap); s.poly([[23, 10], [41, 10], [44, 12], [25, 12]], coatD); s.ell(32, 8, 1.6, 1.4, brass);
  column(s, cap, 32, 9);
  s.outline();
  const e = ink(s); for (const x of [29, 35]) { s.dot(x, 14, e, 3); s.dot(x, 15, e, 0); }
  /* the beam: rays out of the glass, and smoke from the pipe */
  for (const a of [-1.1, -.55, 0, .55, 1.1]) for (let r = 8; r <= 13; r++) { const x = Math.round(50.5 + Math.cos(a) * r), y = Math.round(19.5 + Math.sin(a) * r); if (x < 64 && s.get(x, y) == null) s.fix(x, y, r < 11 ? '#fff4b0' : '#e8c860'); }
  glint(s, [[42, 18], [43, 16], [42, 14]], '#a8b0c0'); glint(s, [[6, 44], [6, 46]], '#6ab8e0');
  return s; };

/* Jarl Rimebeard (Frostspire): a broad jarl in a horned helm and a shaggy fur mantle, his beard frozen into icicles,
   a frost-rimed round shield on one arm and an axe of ice raised in the other */
const tw_rimebeard = () => { const s = new P(64, 64), fur = s.mat('#8a7a6a'), furL = s.mat('#a89a88'), mail = s.mat('#5a6a7a'), skin = s.mat('#d8b8a0'), beard = s.mat('#d8ecf6', { cool: '#2a4a6a' }), ice = s.mat('#a8d8f0', { warm: '#ffffff' }),
    steel = s.mat('#b8c4cc', { warm: '#ffffff' }), horn = s.mat('#e0d4c0'), wood = s.mat('#7a5232'), leather = s.mat('#4a3424'), gold = s.mat('#d8a840'), glow = s.mat(['#0a2a48', '#3aa8ff', '#6ac8ff', '#c8f0ff', '#ffffff']);
  /* the axe: a long haft, a blade of clear ice */
  s.line(54, 33, 54, 3, wood, 3); s.line(55, 33, 55, 3, wood, 1); s.poly([[56, 2], [62, 0], [63, 10], [58, 13], [56, 9]], ice); s.edges(ice); s.poly([[53, 4], [49, 5], [53, 8]], steel);
  /* legs bound in fur boots */
  tube(s, [[26, 47], [25, 56]], 4.6, 4.2, leather); tube(s, [[38, 47], [39, 56]], 4.6, 4.2, leather); s.ell(24, 59.5, 6.4, 3.2, fur); s.ell(40, 59.5, 6.4, 3.2, fur);
  for (const x of [21, 25, 37, 41]) s.line(x, 57, x + 1, 61, fur, 1);
  /* a mail shirt, a skirt, a heavy belt */
  s.ell(32, 35, 14, 12, mail); s.poly([[19, 43], [45, 43], [47, 51], [17, 51]], mail); s.edges(mail); grain(s, mail, (x, y, l) => ((x + y * 2) % 4 === 0 ? Math.max(1, l - 1) : null));
  s.rect(18, 42, 28, 3, leather); s.rect(30, 41, 5, 5, gold);
  /* the right arm, bare to the shoulder, a gold ring on it, the fist on the haft */
  tube(s, [[47, 29], [52, 24], [54, 17]], 5, 4.6, skin, { flat: 1 }); tube(s, [[47, 29], [52, 24], [54, 17]], 4.4, 3.8, skin); s.rect(49, 23, 6, 2, gold, { flat: 3 }); s.ell(54.5, 15, 3.6, 3.2, skin);
  /* the round shield on the left arm, frost along its rim, icicles hanging */
  s.ell(14, 40, 11, 11, steel); s.ell(14, 40, 9.4, 9.4, wood); for (const a of [0, 1, 2, 3]) { const r = a * Math.PI / 2 + .4; s.line(14, 40, 14 + Math.cos(r) * 9, 40 + Math.sin(r) * 9, s.mat('#a05a2a'), 2); }
  s.ell(14, 40, 3.2, 3.2, steel); s.ell(10, 31, 6, 2.4, ice, { flat: 3 });
  for (const [x, h] of [[8, 5], [11, 7], [15, 6], [19, 4]]) s.poly([[x - 1, 49], [x, 49 + h], [x + 1, 49]], ice);
  /* the fur mantle over the shoulders */
  s.ell(32, 24.5, 18, 7, fur); for (let i = 0; i < 9; i++) s.ell(15.5 + i * 4.1, 29.5 + (i % 2), 2.6, 3, i % 2 ? fur : furL);
  /* the head under a horned helm with a nasal guard */
  s.ell(32, 15, 7.5, 7.5, skin);
  for (let y = 3; y <= 12; y++) for (let x = 22; x <= 42; x++) { const nx = (x + .5 - 32) / 9.6, ny = (y + .5 - 12.6) / 9.2; if (nx * nx + ny * ny <= 1) s.dot(x, y, steel, A.sphere(nx, ny)); }
  s.rect(22, 11, 21, 2, steel); s.rect(31, 11, 3, 7, steel); s.dot(32, 6, gold, 4);
  tube(s, [[24, 9], [18, 7], [14, 1]], 2.6, 1, horn); tube(s, [[40, 9], [46, 7], [50, 1]], 2.6, 1, horn);
  /* the frozen beard: braids and icicles */
  s.poly([[23, 17], [41, 17], [42, 27], [37, 35], [32, 40], [27, 35], [22, 27]], beard); s.edges(beard); for (const x of [26, 32, 38]) s.line(x, 22, x, 34 - Math.abs(x - 32) / 2, beard, 1);
  for (const [x, y, h] of [[26, 33, 5], [29, 37, 6], [32, 40, 7], [35, 37, 6], [38, 33, 5]]) s.poly([[x - 1, y], [x, y + h], [x + 1, y]], ice);
  s.ell(32, 19.5, 6, 1.8, beard, { flat: 3 });
  s.outline();
  for (const x of [28, 36]) { s.dot(x, 14, glow, 4); s.dot(x + 1, 14, glow, 3); s.dot(x, 15, glow, 3); s.dot(x + 1, 15, glow, 2); }
  s.line(27, 13, 30, 13, s.mat('#e8f4fa'), 4); s.line(35, 13, 38, 13, s.mat('#e8f4fa'), 4);
  glint(s, [[5, 20], [60, 26], [3, 56], [59, 44], [47, 2]], '#e8f8ff');
  return s; };

/* The Drowned Abbot (the Sunken Belfry): a tall drowned churchman in a sodden cope and mitre, weed hanging off him,
   barnacles on his cheek, a crozier in one hand and a censer whose smoke runs down, not up */
const tw_abbot = () => { const s = new P(64, 64), robe = s.mat('#3a5a52'), robeD = s.mat('#223832'), cope = s.mat('#5a3a4a'), bone = s.mat('#c8d4c0', { cool: '#1a3a3a' }), weed = s.mat('#3a8a5a'),
    gold = s.mat('#c8a848'), mitre = s.mat('#d8d0b0'), barn = s.mat('#e8e4d8'), hole = s.mat(['#081410', '#081410', '#0e1c18', '#0e1c18', '#0e1c18']), glow = s.mat(['#0a3028', '#3ac8a0', '#9af0d0', '#e0fff4', '#ffffff']);
  /* the crozier, its crook curled at the top */
  s.line(50, 61, 50, 8, gold, 3); s.line(51, 61, 51, 8, gold, 1); tube(s, [[50.5, 9], [51, 3], [55, 1], [58, 4], [57, 8], [55, 9]], 1.4, 1.1, gold);
  /* the robe to the ground, a ragged hem with weed trailing from it, bony feet */
  const hem = []; for (let x = 50, i = 0; x >= 14; x -= 3, i++) hem.push([x, i % 2 ? 58 : 61]); s.poly([[22, 20], [42, 20], [50, 61], ...hem, [14, 61]], robe); s.edges(robe);
  for (const x of [24, 30, 36, 42]) s.line(x, 28, x + (x - 32) / 6, 58, robeD, 1);
  s.ell(25, 61, 3.4, 1.6, bone); s.ell(38, 61, 3.4, 1.6, bone);
  /* the cope over the shoulders, a gold border, a clasp */
  s.poly([[21, 21], [43, 21], [46, 40], [32, 46], [18, 40]], cope); s.edges(cope); s.line(18, 40, 32, 46, gold, 3); s.line(32, 46, 46, 40, gold, 2); s.rect(30, 26, 4, 19, gold); s.line(30, 26, 30, 44, gold, 3); for (const y of [30, 35, 40]) s.dot(32, y, s.mat('#3a8a7a'), 3); s.ell(32, 25, 2.4, 2, gold);
  /* weed hanging off everything */
  for (const [x, y, l] of [[20, 38, 14], [27, 44, 12], [36, 44, 10], [44, 38, 16], [16, 50, 9]]) tube(s, [[x, y], [x + 1, y + l / 2], [x - 1, y + l]], .9, .5, weed);
  /* right arm out to the crozier, a wide dripping sleeve */
  tube(s, [[41, 24], [46, 30], [48, 34]], 3.6, 3.2, robe); s.ell(47, 35, 4, 3.4, robeD); s.ell(49.5, 34, 2.2, 2.2, bone);
  /* left arm down holding the censer's chain */
  tube(s, [[23, 24], [18, 31], [16, 37]], 3.6, 3.2, robe); s.ell(16, 38, 4, 3.4, robeD); s.ell(15, 40.5, 2.2, 2.2, bone);
  for (let y = 42; y <= 46; y++) s.dot(14 + (y % 2), y, gold, 3);
  s.ell(14, 50, 4.4, 3.8, gold); s.rect(11, 46, 7, 2, gold); s.poly([[11, 46], [14, 43], [17, 46]], gold); for (const x of [12, 14, 16]) s.dot(x, 50, hole, 2);
  /* the cowl, the drowned face: sunken sockets, an open jaw, barnacles */
  s.ell(32, 16, 9, 9, robeD); s.ell(32, 16, 6, 6.6, bone); s.rect(28, 13, 3, 3, hole, { flat: 2 }); s.rect(34, 13, 3, 3, hole, { flat: 2 }); s.rect(30, 19, 5, 3, hole, { flat: 2 }); s.dot(31, 19, bone, 3); s.dot(33, 19, bone, 3);
  for (const [x, y] of [[27, 18], [26, 16], [37, 19]]) s.dot(x, y, barn, 4);
  /* the mitre, two peaks, a gold band, a dripping lappet of weed */
  s.poly([[25, 11], [25, 4], [31, -1], [32, 1], [33, -1], [39, 4], [39, 11]], mitre); s.edges(mitre); s.rect(25, 9, 15, 2, gold, { flat: 3 }); s.line(32, 1, 32, 9, gold, 2);
  tube(s, [[38, 6], [41, 10], [40, 16]], .9, .6, weed);
  s.outline();
  for (const x of [29, 35]) { s.dot(x, 14, glow, 4); s.dot(x, 15, glow, 3); }
  /* the smoke going down, and bubbles going up */
  glint(s, [[13, 55], [15, 56], [12, 57], [14, 58], [11, 59], [16, 59], [13, 60], [10, 61], [15, 61], [12, 62], [17, 62], [9, 62]], '#9ab8b0'); glint(s, [[14, 56], [13, 59], [12, 61]], '#c8dcd8');
  for (const [x, y] of [[44, 14], [46, 9], [43, 4], [20, 8]]) glint(s, [[x, y - 1], [x - 1, y], [x + 1, y], [x, y + 1]], '#9af0d0');
  glint(s, [[48, 39], [47, 42], [17, 44]], '#6ab8c8');
  return s; };

/* Forge-Mother Ashka (the Cinder Stack): a broad old smith with flame-red hair, goggles pushed up, a scorched leather
   apron and arms like anvils, a sledge raised high and a white-hot billet held in her tongs */
const tw_ashka = () => { const s = new P(64, 64), skin = s.mat('#8a4a3a', { warm: '#ffd0a0' }), hair = s.mat('#e0602a', { warm: '#ffe080' }), apron = s.mat('#6a4430'), shirt = s.mat('#a8a090'), trouser = s.mat('#4a3a34'),
    boot = s.mat('#2e221c'), glove = s.mat('#3a2a20'), iron = s.mat('#5a5a66', { warm: '#d8e0ff' }), wood = s.mat('#7a5232'), brass = s.mat('#c8a04a'), lens = s.mat('#8ad0e0', { warm: '#ffffff' }),
    hot = s.mat(['#6a1800', '#ff6a1a', '#ffb040', '#ffe080', '#ffffff']);
  /* the sledge, raised: a long haft, a heavy head with one face glowing */
  s.line(53, 26, 53, 6, wood, 3); s.line(54, 26, 54, 6, wood, 1); s.rect(45, 0, 16, 7, iron); s.rect(59, 1, 2, 5, hot, { flat: 3 }); s.rect(45, 0, 2, 7, iron, { flat: 1 });
  /* legs and boots */
  tube(s, [[26, 47], [25, 56]], 4.4, 4, trouser); tube(s, [[38, 47], [39, 56]], 4.4, 4, trouser); s.ell(24, 59.5, 6.2, 3, boot); s.ell(40, 59.5, 6.2, 3, boot);
  /* a broad body in a rolled-sleeve shirt, the leather apron over it */
  s.ell(32, 34, 13, 12, shirt); s.poly([[22, 26], [42, 26], [45, 55], [19, 55]], apron); s.edges(apron); s.rect(26, 40, 12, 7, apron, { flat: 1 }); s.line(26, 40, 37, 40, apron, 3);
  for (const [x, y] of [[23, 27], [41, 27], [20, 52], [44, 52]]) s.dot(x, y, brass, 4); for (const [x, y] of [[30, 33], [34, 50], [23, 46], [40, 36]]) s.dot(x, y, apron, 0);
  /* the left arm down and forward, tongs gripping a white-hot billet */
  s.ell(19, 27, 6.4, 5.6, skin); tube(s, [[18, 30], [15, 38], [16, 43]], 4.8, 4.4, skin, { flat: 1 }); tube(s, [[18, 30], [15, 38], [16, 43]], 4.4, 3.8, skin); s.ell(16, 45, 3.6, 3.2, glove);
  s.line(15, 47, 9, 52, iron, 2); s.line(17, 47, 11, 53, iron, 1); s.rect(3, 51, 9, 4, hot, { flat: 3 }); s.line(3, 51, 11, 51, hot, 4);
  /* the right arm up, a biceps like a loaf, the glove on the haft */
  s.ell(45, 27, 6.4, 5.6, skin); tube(s, [[46, 29], [51, 23], [53, 14]], 4.8, 4.4, skin, { flat: 1 }); tube(s, [[46, 29], [51, 23], [53, 14]], 4.4, 3.8, skin); s.ell(50, 23, 4, 3.6, skin); s.ell(53.5, 12, 3.8, 3.4, glove);
  /* the head: wild flame hair, goggles up on the brow */
  for (const [x, y, h] of [[23, 10, 9], [27, 7, 11], [32, 6, 12], [37, 7, 11], [41, 10, 9]]) s.poly([[x - 3, y + 3], [x + (x - 32) / 5, y - h + 3], [x + 3, y + 3]], hair);
  s.ell(32, 11, 10, 6, hair); s.ell(32, 16, 7.4, 7.4, skin); s.rect(24, 10, 16, 2, s.mat('#3a2a20'));
  s.ell(28.5, 10.5, 2.8, 2.4, brass); s.ell(35.5, 10.5, 2.8, 2.4, brass); s.ell(28.5, 10.5, 1.6, 1.4, lens); s.ell(35.5, 10.5, 1.6, 1.4, lens);
  s.ell(25, 19, 1.6, 2.6, hair); s.ell(39, 19, 1.6, 2.6, hair);
  s.outline();
  const e = s.mat(['#200800', '#200800', '#ffb030', '#ffe070', '#ffffff']); for (const x of [29, 35]) { s.dot(x, 15, e, 4); s.dot(x, 16, e, 2); } s.line(28, 14, 30, 13, s.mat('#3a1a10'), 0); s.line(36, 14, 34, 13, s.mat('#3a1a10'), 0);
  s.line(30, 20, 34, 20, s.mat('#3a1a10'), 0); for (const [x, y] of [[27, 18], [37, 18], [33, 17]]) s.dot(x, y, skin, 1);
  glint(s, [[1, 48], [4, 46], [8, 47], [2, 44], [12, 49], [6, 43], [62, 8], [61, 10]], '#ffd060'); glint(s, [[0, 50], [5, 45], [10, 46]], '#ffffff');
  return s; };

/* The Last Bellringer (the Bell Tower of the Winds): a small, ancient monk with a tonsure and a long white beard, one hand
   cupped to his ear, the other holding up a brass bell nearly as big as he is, the peal ringing out in rings */
const tw_bellringer = () => { const s = new P(64, 64), robe = s.mat('#b8a888'), robeD = s.mat('#8a7a5a'), skin = s.mat('#e0c8a8'), beard = s.mat('#f0ece0', { cool: '#4a4a6a' }), brass = s.mat('#d0a448', { warm: '#fff0b0' }),
    iron = s.mat('#4a4a52'), wood = s.mat('#6a5a3a'), rope = s.mat('#a08050');
  /* the robe, a cowl at the shoulders, a rope belt with a hanging knot, sandalled feet */
  s.poly([[23, 24], [39, 24], [45, 60], [17, 60]], robe); s.edges(robe); for (const x of [26, 31, 36]) s.line(x, 32, x + (x - 31) / 3, 58, robeD, 1);
  s.ell(24, 61, 4.4, 1.8, skin); s.ell(38, 61, 4.4, 1.8, skin); s.line(21, 60, 27, 60, wood, 2); s.line(35, 60, 41, 60, wood, 2);
  s.line(21, 39, 41, 39, rope, 3); s.line(21, 40, 41, 40, rope, 1); tube(s, [[25, 40], [24, 46], [25, 50]], 1, .8, rope); s.ell(25, 51, 1.6, 1.6, rope);
  s.ell(31, 24.5, 11, 4.2, robeD);
  /* the left arm up, a hand cupped behind the ear */
  tube(s, [[22, 26], [16, 27], [17, 20], [22, 16]], 3.4, 2.8, robe); s.ell(22.5, 15.5, 2.6, 2.6, skin);
  /* the head: a bald crown with a white fringe, large ears, a long beard */
  s.ell(31, 15, 7.6, 7.6, skin); s.ell(23.5, 15, 1.8, 2.8, skin); s.ell(38.5, 15, 1.8, 2.8, skin);
  s.ell(25, 13, 2, 3, beard); s.ell(37, 13, 2, 3, beard); s.poly([[25, 18], [37, 18], [36, 29], [31, 36], [26, 29]], beard); s.edges(beard); s.ell(31, 19.5, 5, 1.8, beard);
  for (const x of [28, 31, 34]) s.line(x, 22, x, 32 - Math.abs(x - 31), beard, 1);
  s.ell(28, 12.5, 2.2, 1.2, beard, { flat: 3 }); s.ell(34, 12.5, 2.2, 1.2, beard, { flat: 3 });
  /* the right arm up, the bell held by its wooden handle */
  tube(s, [[39, 26], [46, 23], [50, 15]], 3.4, 2.8, robe); s.rect(49, 3, 4, 15, wood); s.ell(51, 3, 2.4, 2, wood); s.ell(50.5, 11.5, 3, 2.8, skin);
  s.ell(51, 23, 7, 5, brass); s.poly([[44, 23], [58, 23], [60, 32], [63, 36], [39, 36], [42, 32]], brass); s.rect(39, 35, 25, 2, brass);
  column(s, brass, 50.5, 12); s.line(39, 36, 63, 36, brass, 1); s.line(43, 28, 58, 28, brass, 1); s.ell(51, 39, 2.4, 2.2, iron);
  s.outline();
  const e = s.mat(['#1a2a4a', '#1a2a4a', '#3a5a8a', '#a8c8f0', '#ffffff']); for (const x of [28, 34]) { s.dot(x, 14, e, 3); s.dot(x, 15, e, 2); } s.line(30, 19, 32, 19, s.mat('#6a4a3a'), 0);
  /* the peal, in rings of wind */
  const ring = (cx, cy, r, a0, a1) => { const p = []; for (let a = a0; a <= a1; a += .12) p.push([Math.round(cx + Math.cos(a) * r), Math.round(cy + Math.sin(a) * r)]); glint(s, p, '#bfe8ff'); };
  ring(51, 30, 13, -.9, .5); ring(51, 30, 17, -.6, .25); ring(51, 30, 13, 2.6, 3.4); ring(14, 16, 6, 2.4, 3.9);
  return s; };

/* The King's Shadow (the Hollow Spire): the Hollow King's shadow stood up on its own, taller and thinner, ringed in
   violet light, crowned in jagged dark, an eclipse behind its head, a long shadow blade and a flame of night in its hand.
   Its own ramp's darkest step is violet, so the outline glows instead of vanishing on the dark stage */
const tw_shadow = () => { const s = new P(64, 64), sh = s.mat(['#9a7aff', '#211a38', '#3a2e5a', '#54447e', '#6e5aa0']), dk = s.mat(['#7a5ad8', '#120e20', '#1e1830', '#2c2446', '#3c3260']),
    crown = s.mat(['#3a2a6a', '#5a4a8a', '#7a6ab0', '#b8a0f0', '#e8d8ff']), glow = s.mat(['#2a1050', '#8a4aff', '#b08aff', '#e0d0ff', '#ffffff']);
  /* the eclipse: a dark disc with a burning corona */
  for (let y = 0; y < 30; y++) for (let x = 18; x < 48; x++) { const d = Math.hypot(x + .5 - 32, y + .5 - 13); if (d <= 10) s.dot(x, y, dk, 2); else if (d <= 11.6) s.fix(x, y, d < 10.8 ? '#e0d0ff' : '#8a4aff'); }
  /* a pool of shadow on the ground, the robe pouring down into it in tendrils */
  s.ell(32, 61, 21, 2.2, dk, { flat: 1 });
  s.poly([[25, 22], [39, 22], [46, 52], [49, 61], [43, 56], [39, 61], [35, 55], [31, 61], [27, 55], [22, 61], [19, 56], [14, 61], [18, 52]], sh); s.edges(sh);
  for (const [x0, x1] of [[29, 27], [35, 37], [24, 20], [40, 44]]) s.line(x0, 28, x1, 54, dk, 2);
  /* spiked pauldrons, the King's in shadow */
  for (const [x, d] of [[22, -1], [42, 1]]) { s.poly([[x - 4, 25], [x + d * 6, 14], [x + 4, 24]], dk); s.ell(x, 25, 5.4, 4, sh); }
  /* the left arm raised, a flame of night above its hand */
  tube(s, [[22, 27], [15, 25], [11, 18]], 2.8, 2.2, sh); s.ell(10.5, 16.5, 2.2, 2.2, dk); s.ell(10, 10, 3.4, 3.8, glow); s.poly([[7, 9], [10, 1], [13, 9]], glow);
  /* the right arm down, a long thin blade */
  tube(s, [[42, 27], [47, 33], [49, 39]], 2.8, 2.2, sh); s.poly([[48, 40], [51, 38], [63, 60], [60, 61]], dk); s.edges(dk); s.rect(46, 39, 7, 2, crown); s.ell(49.5, 39, 2.2, 2, dk);
  /* the head: smooth, featureless but for its eyes; a jagged crown */
  s.ell(32, 14, 6.6, 7.4, dk); s.rect(25, 6, 14, 2, crown); for (const [x, h] of [[25, 5], [28, 3], [32, 7], [36, 3], [39, 5]]) s.poly([[x - 1.2, 7], [x, 7 - h], [x + 1.2, 7]], crown);
  s.outline();
  for (const x of [29, 34]) { s.dot(x, 13, glow, 4); s.dot(x + 1, 13, glow, 3); s.dot(x, 14, glow, 3); s.dot(x + 1, 14, glow, 2); }
  for (const x of [25, 32, 39]) s.dot(x, 7 - (x === 32 ? 6 : 4), glow, 4);
  glint(s, [[6, 30], [58, 20], [8, 44], [56, 46], [14, 6], [4, 22]], '#b08aff'); glint(s, [[10, 4], [9, 7]], '#ffffff');
  return s; };

const BIG = { oldtusk, grubnash, frostmaw, barnacle, morwenna, pyrrhax, zephyrion, hollowking, tw_squeak, tw_greenknight, tw_keeper, tw_rimebeard, tw_abbot, tw_ashka, tw_bellringer, tw_shadow };
/* mini-bosses and tower bosses: their own designs at twice the detail */
const fine = id => { const D = Q.data, m = D && D.MON[id]; if (!m || !(m.mini || (m.tower && /^tw_/.test(id) && !m.tower.floor) || (m.tower && A.CREATURE_SPECS[id] && A.CREATURE_SPECS[id] !== A.CREATURE_SPECS[m.base]))) return null; const f = A.CREATURE_SPECS[id]; return f ? A.atScale(2, f) : null; };
A.BIG = BIG;
A.bigSprite = id => BIG[id] ? BIG[id]() : fine(id);
A.hasBig = id => !!BIG[id] || !!(Q.data && Q.data.MON[id] && (Q.data.MON[id].mini || (Q.data.MON[id].tower && A.CREATURE_SPECS[id] && A.CREATURE_SPECS[id] !== A.CREATURE_SPECS[Q.data.MON[id].base])));
A.creatureBigUrl = id => A.hasBig(id) ? A.url('creaturebig:' + id, () => A.bigSprite(id)) : null;
})();
