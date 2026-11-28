/* Idlewick pixel art: the bosses at 64 x 64 (owner, 28 Nov 2026: "larger, detailed sprites like Old Tusk"), and the
   larger versions of the mini-bosses and tower bosses. Everything is original and drawn in code.
   The eight bosses are drawn here in materials (five-step ramps, cool shadows, warm lights), with sphere-lit masses for
   muscle, bellies and armour, edge light on flat shapes, then the selective outline and the face on top. Mini-bosses
   and tower bosses keep their own 32 x 32 designs, redrawn at twice the detail (pixelart.js atScale).
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

/* ================= Pyrrhax, the fire wyrm: wings up, neck curled, embers in the belly ================= */
const pyrrhax = () => { const s = new P(64, 64), sc = s.mat('#d8503a'), scD = s.mat('#9a2e2a'), wing = s.mat('#8a2a3a'), mem = s.mat('#c8603a'), belly = s.mat('#ffd060'), horn = s.mat('#efe2c4'), claw = s.mat('#3a2020'), spike = s.mat('#ffb04a'), fire = s.mat('#ffb040', { warm: '#fffbe0' });
  s.poly([[22, 30], [6, 4], [18, 10], [22, 2], [30, 14], [32, 28]], wing); s.poly([[22, 28], [10, 8], [19, 13], [23, 7], [28, 17], [30, 27]], mem); for (const [a, b] of [[6, 4], [22, 2]]) s.line(26, 28, a, b, wing, 3);   /* the far wing */
  s.poly([[2, 56], [8, 48], [16, 46], [20, 52], [10, 56]], sc); s.poly([[0, 58], [3, 52], [5, 57]], spike);                                                         /* tail */
  s.ell(28, 44, 15, 10, sc); s.ell(30, 48, 10, 5, belly); for (let x = 22; x < 39; x += 4) s.line(x, 45, x + 1, 52, s.mat('#e0a040'), 1);                          /* body and belly plates */
  s.ell(18, 52, 5, 6, scD); s.ell(17, 59, 5, 2.4, claw); s.ell(38, 53, 4.4, 5.4, sc); s.ell(39, 59, 5, 2.4, claw);                                                  /* legs */
  s.poly([[34, 40], [38, 26], [44, 18], [50, 16], [52, 22], [46, 26], [42, 38]], sc); s.ell(42, 32, 4, 6, belly, { flat: 3 });                                      /* the neck */
  s.ell(51, 16, 7, 6, sc); s.poly([[54, 14], [63, 17], [62, 22], [54, 22]], sc); s.line(56, 21, 62, 21, scD, 1);                                                    /* head and jaw */
  s.poly([[47, 12], [41, 2], [49, 9]], horn); s.poly([[52, 11], [52, 1], [55, 9]], horn); for (let i = 0; i < 6; i++) s.poly([[22 + i * 4, 35 - i], [24 + i * 4, 30 - i], [26 + i * 4, 35 - i]], spike);
  /* the near wing, raised over the back: a bony arm to a clawed wrist, three fingers, membrane between */
  s.poly([[26, 38], [24, 22], [30, 6], [33, 4], [36, 14], [40, 12], [40, 24], [36, 36]], mem); s.edges(mem);
  s.thick(28, 38, 31, 6, wing, 2); s.thick(31, 6, 36, 14, wing, 2); s.thick(31, 6, 40, 12, wing, 2); s.line(31, 6, 24, 22, wing, 3); s.dot(31, 4, horn, 4); s.dot(32, 5, horn, 3);
  for (const [x, y] of [[26, 24], [34, 20], [38, 22]]) s.dot(x, y, s.mat('#e07a4a'), 3);
  s.ell(30, 46, 3.6, 3, fire); s.ell(62, 20, 1.6, 1.6, fire);
  s.outline();
  const e = s.mat(['#200800', '#200800', '#ffe070', '#fff6b0', '#fff']); s.dot(52, 14, e, 2); s.dot(53, 14, e, 3); s.line(49, 12, 54, 13, s.mat('#3a0a0a'), 0); s.dot(61, 17, s.mat('#200808'), 0);
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

/* ================= The Hollow King: plate, a cape, a crown on a dark helm, a greatsword planted before him ================= */
const hollowking = () => { const s = new P(64, 64), pl = s.mat('#5a4a7a'), plD = s.mat('#3a2e54'), cape = s.mat('#6a3a8a'), capeD = s.mat('#4a2462'), crown = s.mat('#b08aff', { warm: '#f4eaff' }), blade = s.mat('#b8b0d8'), gold = s.mat('#e6b84a'), void_ = s.mat('#120e1c');
  s.poly([[16, 20], [48, 20], [56, 62], [8, 62]], cape); s.edges(cape); for (const x of [16, 26, 38, 48]) s.line(x, 30, x - (x < 32 ? 3 : -3), 60, capeD, 1);       /* the cape behind */
  s.rect(23, 46, 7, 12, plD); s.rect(34, 46, 7, 12, pl); s.rect(21, 57, 10, 4, plD); s.rect(33, 57, 10, 4, pl); s.dot(26, 50, plD, 4); s.dot(37, 50, pl, 4);       /* legs, sabatons */
  s.poly([[21, 22], [43, 22], [42, 44], [22, 44]], pl); s.edges(pl); s.ell(32, 30, 7, 6, pl); s.line(32, 24, 32, 42, plD, 1);                                       /* breastplate */
  s.poly([[20, 42], [44, 42], [46, 50], [18, 50]], plD); s.edges(plD); s.rect(20, 41, 24, 2, gold, { flat: 3 });                                                     /* tassets, belt */
  s.ell(18, 24, 6, 5, pl); s.ell(46, 24, 6, 5, pl); s.ell(17, 32, 4, 6, plD); s.ell(47, 32, 4, 6, plD);                                                             /* pauldrons, arms */
  s.thick(31, 38, 31, 62, blade, 3); s.rect(25, 36, 14, 2, gold, { flat: 3 }); s.rect(30, 30, 4, 6, s.mat('#4a3020')); s.ell(32, 29, 2, 2, crown);                   /* the greatsword, hilt at the chest */
  s.ell(22, 38, 3.4, 3, pl); s.ell(42, 38, 3.4, 3, pl); s.ell(27, 37, 3, 2.6, plD); s.ell(37, 37, 3, 2.6, pl);                                                      /* gauntlets on the crossguard */
  s.ell(32, 14, 8, 8.5, pl); s.rect(26, 13, 13, 3, void_, { flat: 1 }); s.line(32, 6, 32, 12, plD, 3);                                                              /* the helm, a visor slit */
  s.poly([[23, 8], [23, 1], [26, 4], [29, -1], [32, 3], [35, -1], [38, 4], [41, 1], [41, 8]], crown); s.edges(crown);
  s.outline();
  const e = s.mat(['#1a1030', '#1a1030', '#e0d0ff', '#ffffff', '#ffffff']); s.dot(29, 14, e, 3); s.dot(30, 14, e, 2); s.dot(35, 14, e, 3); s.dot(36, 14, e, 2); s.dot(32, 4, s.mat('#ff7ad0'), 4); s.dot(26, 5, s.mat('#7ad0ff'), 4); s.dot(38, 5, s.mat('#7ad0ff'), 4);
  return s; };

const BIG = { oldtusk, grubnash, frostmaw, barnacle, morwenna, pyrrhax, zephyrion, hollowking };
/* mini-bosses and tower bosses: their own designs at twice the detail */
const fine = id => { const D = Q.data, m = D && D.MON[id]; if (!m || !(m.mini || (m.tower && /^tw_/.test(id) && !m.tower.floor) || (m.tower && A.CREATURE_SPECS[id] && A.CREATURE_SPECS[id] !== A.CREATURE_SPECS[m.base]))) return null; const f = A.CREATURE_SPECS[id]; return f ? A.atScale(2, f) : null; };
A.BIG = BIG;
/* the painter and its ramp, for the mini-bosses' own 64 x 64 drawings (js/pixel_minibosses.js) */
A.BossPainter = P; A.bossRamp = ramp; A.bossMix = mix;
A.bigSprite = id => BIG[id] ? BIG[id]() : fine(id);
A.hasBig = id => !!BIG[id] || !!(Q.data && Q.data.MON[id] && (Q.data.MON[id].mini || (Q.data.MON[id].tower && A.CREATURE_SPECS[id] && A.CREATURE_SPECS[id] !== A.CREATURE_SPECS[Q.data.MON[id].base])));
A.creatureBigUrl = id => A.hasBig(id) ? A.url('creaturebig:' + id, () => A.bigSprite(id)) : null;
})();
