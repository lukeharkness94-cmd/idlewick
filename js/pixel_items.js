/* Idlewick pixel art: every item as a 16 x 16 sprite in the house style (docs/pixel-art-style.md).
   Each category is a small family of hand-tuned shapes; variants differ in silhouette and features, not only colour. */
(() => {
const DQ = window.DQ, D = DQ.data, A = DQ.pixelArt; if (!A) return;
const { Spr, ramp, mix, R } = A;
const rp = c => ramp(c || '#999999');
const metalOf = col => ramp(col, { gl: .72 });
const EYE = '#2a1c1f', WHITE = '#fffaf0';

/* ---------- fish: one generator, species set by proportions and features ---------- */
const FISH = {
  sardine: { len: 12, dep: 3, body: '#9fb2c8', belly: '#e4ecf2', tail: 'fork', marks: 'dots' },
  herring: { len: 13, dep: 3.4, body: '#6f8fb4', belly: '#dde6ee', tail: 'fork' },
  trout: { len: 13, dep: 4, body: '#9a8a5a', belly: '#e8d8b0', tail: 'square', marks: 'spots', stripe: '#d8907a' },
  salmon: { len: 14, dep: 4.2, body: '#b8c4cc', belly: '#f2c4b0', tail: 'fork', hook: true, stripe: '#e8907a' },
  tuna: { len: 14, dep: 4.6, body: '#3f5f94', belly: '#d8e0e8', tail: 'crescent', finlets: '#f0d060' },
  swordfish: { len: 11, dep: 3.6, body: '#5f7f9f', belly: '#dce4ea', tail: 'crescent', bill: true, sail: true },
  monkfish: { len: 13, dep: 5, body: '#8a7656', belly: '#c8b48c', tail: 'round', wide: true, marks: 'mottle' },
  shark: { len: 14, dep: 4.2, body: '#71879a', belly: '#e8ecee', tail: 'shark', fin: 'tall' },
  anglerfish: { len: 11, dep: 6, body: '#6a5a3a', belly: '#9a8456', tail: 'round', lure: true, teeth: true },
  carp: { len: 13, dep: 5.4, body: '#d09a48', belly: '#ecd49a', tail: 'fork', marks: 'scales', barbel: true },
  pike: { len: 15, dep: 3, body: '#7f9a4a', belly: '#d8d6a0', tail: 'fork', marks: 'spots', snout: true },
  skyfin: { len: 12, dep: 3.6, body: '#7fc4ee', belly: '#e6f6ff', tail: 'fork', wings: true },
  voideel: { len: 15, dep: 2.4, body: '#5a3a9a', belly: '#9a7ad8', tail: 'eel', glow: '#c8a8ff' }
};
function fish(s, sp, ox, oy, cooked) {
  const body = rp(cooked ? mix(sp.body, '#8a4a20', .55) : sp.body), belly = rp(cooked ? mix(sp.belly, '#c88a4a', .5) : sp.belly), fin = rp(cooked ? '#7a4a2a' : mix(sp.body, '#3a2448', .25));
  const L = sp.len, H = sp.dep, x0 = ox + (15 - L) / 2 + 1, cy = oy + 8, x1 = x0 + L;
  if (sp.tail === 'eel') { for (let i = 0; i <= L; i++) { const y = cy + Math.round(Math.sin(i / 2.2) * 1.6); s.dot(x0 + i, y, body); s.dot(x0 + i, y + 1, i % 3 ? body : belly); } s.fix(x1, cy, EYE); for (let i = 2; i < L; i += 4) s.fix(x0 + i, cy + Math.round(Math.sin(i / 2.2) * 1.6), sp.glow); return; }
  s.ell(x0 + L * .55, cy, L * .5, H / 2 + (sp.wide ? .5 : 0), body); s.ell(x0 + L * .55, cy + H * .28, L * .4, H * .22, belly);
  /* tails */
  const tx = x0 + 1;
  if (sp.tail === 'fork') s.poly([[tx + 1, cy], [tx - 2, cy - 3], [tx - 1, cy], [tx - 2, cy + 3]], fin);
  else if (sp.tail === 'square') s.rect(tx - 2, cy - 2, 2, 5, fin);
  else if (sp.tail === 'round') s.ell(tx - 1, cy, 1.6, 2.4, fin);
  else if (sp.tail === 'crescent') s.poly([[tx + 1, cy], [tx - 2, cy - 4], [tx - 1, cy], [tx - 2, cy + 4]], fin);
  else if (sp.tail === 'shark') s.poly([[tx + 1, cy], [tx - 2, cy - 5], [tx - 1, cy], [tx - 1, cy + 3]], fin);
  /* fins and features */
  if (sp.fin === 'tall') s.poly([[x0 + L * .45, cy - H / 2], [x0 + L * .55, cy - H / 2 - 3], [x0 + L * .65, cy - H / 2]], fin);
  else if (sp.sail) s.poly([[x0 + L * .3, cy - H / 2], [x0 + L * .45, cy - H / 2 - 3], [x0 + L * .7, cy - H / 2]], fin);
  else s.poly([[x0 + L * .4, cy - H / 2], [x0 + L * .5, cy - H / 2 - 1.5], [x0 + L * .62, cy - H / 2]], fin);
  if (sp.finlets) for (let i = 0; i < 3; i++) s.fix(x0 + 3 + i * 2, cy - H / 2, sp.finlets);
  if (sp.bill) s.line(x1, cy - 1, x1 + 4, cy - 1, rp('#3f5a74'));
  if (sp.snout) { s.dot(x1, cy, body); s.dot(x1 + 1, cy, body); }
  if (sp.wings) { s.poly([[x0 + L * .5, cy], [x0 + L * .25, cy - 5], [x0 + L * .7, cy - 1]], rp('#cdeeff')); }
  if (sp.lure) { s.line(x1 - 3, cy - H / 2, x1 - 1, cy - H / 2 - 3, rp('#5a4a2a')); s.fix(x1, cy - H / 2 - 3, '#fff6a0'); }
  if (sp.marks === 'spots') for (let i = 0; i < 4; i++) s.fix(x0 + 3 + i * 2.6, cy - 1 + (i % 2), cooked ? body.lo : mix(sp.belly, '#ffffff', .2));
  if (sp.marks === 'dots') for (let i = 0; i < 3; i++) s.fix(x0 + 5 + i * 2, cy - 1, body.out);
  if (sp.marks === 'mottle') for (let i = 0; i < 4; i++) s.fix(x0 + 3 + i * 2.5, cy - 1 + (i % 2) * 2, body.lo);
  if (sp.marks === 'scales') for (let i = 0; i < 4; i++) { s.fix(x0 + 4 + i * 2, cy - 1, body.lo); s.fix(x0 + 5 + i * 2, cy + 1, body.lo); }
  if (sp.stripe && !cooked) s.line(x0 + 3, cy, x1 - 3, cy, null, sp.stripe);
  s.fix(x1 - 2, cy - 1, EYE); if (!cooked) s.fix(x1 - 2, cy - 2, WHITE);
  if (sp.hook) s.fix(x1, cy + 1, body.out);
  if (sp.teeth) { s.fix(x1 - 1, cy + 1, WHITE); s.fix(x1, cy, WHITE); }
  if (sp.barbel) s.fix(x1, cy + 2, fin.lo);
  if (cooked) { s.line(x0 + 4, cy - 1, x0 + 6, cy + 1, null, body.out); s.line(x0 + 8, cy - 1, x0 + 10, cy + 1, null, body.out); }
}
function shrimp(s, cooked) { const b = rp(cooked ? '#f07a4a' : '#f0a47c'); for (let i = 0; i < 9; i++) { const a = Math.PI * (.15 + i / 11), x = 8 + Math.cos(a) * 5, y = 8 - Math.sin(a) * 4; s.ell(x, y + 1, 1.6 - i * .05, 1.4, b); } s.poly([[2, 10], [0, 12], [3, 12]], b); s.line(13, 6, 15, 2, null, b.lo); s.line(12, 6, 14, 1, null, b.lo); s.fix(12, 6, EYE); for (let i = 0; i < 3; i++) s.fix(6 + i * 2, 11, b.lo); }
function lobster(s, cooked) { const b = rp(cooked ? '#e04a2a' : '#b8483a'); s.ell(8, 10, 2.4, 4.4, b); s.ell(8, 4.5, 2, 2, b); s.ell(4, 3, 2, 1.6, b); s.ell(12, 3, 2, 1.6, b); s.line(6, 5, 4, 4, b); s.line(10, 5, 12, 4, b); s.poly([[6, 14], [10, 14], [8, 16]], b); for (const y of [9, 11, 13]) s.line(6, y, 10, y, null, b.lo); s.fix(7, 4, EYE); s.fix(9, 4, EYE); s.line(7, 2, 5, 0, null, b.lo); s.line(9, 2, 11, 0, null, b.lo); }
const plate = s => { s.ell(8, 12, 7, 2.6, rp('#e8e2d4')); s.ell(8, 11.6, 5.4, 1.6, rp('#f6f2ea')); };

/* ---------- wood: nine logs with their own bark, grain and character ---------- */
const WOOD = {
  normal: { bark: '#7a5236', inner: '#c49158', pair: true }, oak: { bark: '#6a4630', inner: '#d0a060', thick: true },
  willow: { bark: '#7a7a54', inner: '#d8c890', slim: true, moss: '#8aa65a' }, maple: { bark: '#8a4a32', inner: '#e0a070', leaf: '#d8603a' },
  yew: { bark: '#4a3a30', inner: '#c86a4a', sprig: '#3f7a4a' }, magic: { bark: '#4a3a7a', inner: '#b8a0ff', glow: '#e0d0ff' },
  birch: { bark: '#e9e2cf', inner: '#e8c890', marks: '#3a3a3a', slim: true }, elder: { bark: '#a8b890', inner: '#f0e8c0', knot: true },
  gloomwood: { bark: '#3a2a4a', inner: '#7a5a9a', glow: '#b88aff', twist: true }
};
function logSprite(s, w) {
  const bark = rp(w.bark), inner = rp(w.inner), draw = (dx, dy, len, r) => { s.poly([[1 + dx, 9 + dy], [1 + dx + len, 9 + dy - len * .45], [3 + dx + len, 11 + dy - len * .45], [3 + dx, 13 + dy]], bark); s.ell(2 + dx + len, 10 + dy - len * .45, r, r, inner); s.fix(2 + dx + len, 10 + dy - len * .45, inner.lo); };
  if (w.pair) { draw(0, 2, 9, 1.8); draw(2, -2, 9, 1.8); }
  else if (w.thick) { s.poly([[1, 9], [10, 4], [14, 7], [5, 13]], bark); s.ell(12, 5.5, 2.8, 2.6, inner); s.fix(12, 5, inner.lo); s.fix(12, 6, inner.base); s.line(4, 10, 9, 7, null, bark.lo); }
  else if (w.slim) { draw(1, 0, 10, 1.4); }
  else if (w.twist) { for (let i = 0; i < 11; i++) { s.dot(2 + i, 12 - i * .7 + Math.round(Math.sin(i) * 1), bark); s.dot(2 + i, 13 - i * .7 + Math.round(Math.sin(i) * 1), bark); } s.ell(13, 4.5, 1.6, 1.6, inner); }
  else draw(0, 0, 10, 2);
  if (w.marks) for (const [x, y] of [[4, 11], [7, 9], [10, 7]]) s.fix(x, y, w.marks);
  if (w.moss) for (const [x, y] of [[3, 12], [6, 10]]) s.fix(x, y, w.moss);
  if (w.leaf) { s.poly([[11, 12], [14, 10], [15, 13], [12, 14]], rp(w.leaf)); }
  if (w.sprig) { s.line(10, 12, 14, 10, rp(w.sprig)); s.fix(12, 12, w.sprig); s.fix(13, 12, w.sprig); }
  if (w.glow) for (const [x, y] of [[5, 9], [8, 8], [11, 2]]) s.fix(x, y, w.glow);
  if (w.knot) { s.ell(6, 9, 1.2, 1.2, rp('#7a8a64')); }
}

/* ---------- ore: rock formations and seams per metal ---------- */
const ORE = {
  copper: ['#d0763d', 'seam'], tin: ['#c8d0d4', 'flecks'], iron: ['#b0603a', 'rust'], coal: ['#2e2a2c', 'coal'], gold: ['#f0c75a', 'nugget'],
  mithril: ['#6c7fe0', 'seam'], adamant: ['#4fbf7a', 'crystal'], runite: ['#46c8d8', 'crystal'], silver: ['#e6ecf0', 'flecks'], astralite: ['#e2d4ff', 'crystal'], voidstone: ['#7a4ad0', 'crystal']
};
function oreSprite(s, kind) {
  const [c, style] = ORE[kind] || ['#999', 'flecks'], m = rp(c);
  if (style === 'coal') { [[5, 10, 3.5, 3], [10, 9, 3, 3.4], [8, 6, 2.6, 2.4]].forEach(([x, y, a, b]) => s.ell(x, y, a, b, rp('#3a3438'))); [[4, 9], [9, 8], [8, 5]].forEach(([x, y]) => s.fix(x, y, '#8a8a94')); return; }
  if (style === 'nugget') { s.poly([[3, 12], [5, 7], [9, 5], [13, 8], [12, 13], [6, 14]], m); [[6, 8], [7, 8], [10, 9]].forEach(([x, y]) => s.fix(x, y, m.gl)); s.fix(9, 12, m.lo); return; }
  s.poly([[2, 13], [3, 7], [7, 3], [12, 4], [14, 10], [11, 14]], R.stone); s.line(5, 12, 9, 6, null, R.stone.lo);
  if (style === 'seam') { s.line(4, 10, 12, 6, m); s.line(4, 11, 11, 8, m); s.fix(7, 8, m.gl); }
  else if (style === 'flecks' || style === 'rust') [[5, 6], [9, 5], [11, 9], [6, 10], [9, 11]].forEach(([x, y]) => { s.dot(x, y, m); s.fix(x, y, m.hi); });
  else if (style === 'crystal') { [[6, 9, 4], [9, 7, 6], [12, 9, 4]].forEach(([x, y, h]) => { s.poly([[x - 1, y + 2], [x, y + 2 - h], [x + 1, y + 2]], m); s.fix(x, y + 1 - h, m.gl); }); }
  if (style === 'rust') s.fix(8, 12, '#8a4a2a');
}

/* ---------- gems: distinct cuts ---------- */
function gemSprite(s, id) {
  const col = (D.ITEMS[id] || {}).col || '#4a7fe0', g = ramp(col, { gl: .78 });
  if (id === 'gem_emerald') { s.poly([[4, 4], [12, 4], [13, 6], [13, 11], [12, 13], [4, 13], [3, 11], [3, 6]], g); s.rect(5, 6, 6, 5, rp(mix(col, '#ffffff', .15))); s.fix(5, 6, '#ffffff'); return; }
  if (id === 'gem_ruby') { s.ell(8, 8.5, 5, 4.6, g); s.poly([[5, 6], [8, 4], [11, 6], [8, 9]], rp(mix(col, '#ffffff', .2))); s.fix(6, 6, '#ffffff'); return; }
  if (id === 'gem_diamond') { s.poly([[3, 6], [5, 3], [11, 3], [13, 6], [8, 14]], g); s.line(3, 6, 13, 6, null, g.hi); s.line(5, 3, 8, 6, null, '#ffffff'); s.line(11, 3, 8, 6, null, g.lo); s.line(8, 6, 8, 13, null, g.lo); s.fix(6, 4, '#ffffff'); return; }
  if (id === 'ember_core') { s.ell(8, 9, 5, 5, ramp('#e0602a')); s.ell(8, 9, 3, 3, ramp('#ffb04a')); s.fix(8, 9, '#fff2a0'); s.poly([[6, 5], [8, 1], [10, 5]], ramp('#ff8a3a')); return; }
  s.poly([[4, 6], [6, 3], [10, 3], [12, 6], [8, 13]], g); s.line(4, 6, 12, 6, null, g.hi); s.line(6, 3, 8, 6, null, g.gl); s.line(8, 6, 8, 12, null, g.lo); s.fix(6, 4, '#ffffff');
}

/* ---------- metal bars ---------- */
function barSprite(s, col) { const m = metalOf(col); s.poly([[2, 11], [5, 6], [14, 6], [12, 11]], m); s.poly([[2, 11], [12, 11], [12, 13], [2, 13]], rp(mix(col, '#3a2448', .3))); s.line(5, 7, 12, 7, null, m.gl); s.fix(13, 6, m.gl); }

/* ---------- weapons ---------- */
function dagger(s, col) { const m = metalOf(col); s.line(7, 9, 11, 5, m); s.line(8, 9, 11, 6, m); s.fix(12, 4, m.gl); s.line(8, 8, 10, 6, null, m.gl); s.line(4, 8, 8, 12, R.gold); s.line(5, 11, 3, 13, R.leather); s.dot(2, 14, R.gold); }
function longsword(s, col) { const m = metalOf(col); s.line(4, 11, 12, 3, m); s.line(5, 11, 13, 3, m); s.line(5, 12, 13, 4, m); s.fix(13, 2, m.gl); s.line(6, 10, 12, 4, null, m.gl); s.line(2, 10, 6, 14, R.gold); s.line(3, 12, 1, 14, R.leather); s.dot(4, 12, R.leather); s.dot(0, 15, R.gold); }
function warhammer(s, col) { const m = metalOf(col); s.line(3, 14, 10, 5, R.wood); s.line(4, 14, 11, 5, R.wood); s.poly([[7, 3], [11, 0], [15, 4], [11, 8]], m); s.fix(10, 2, m.gl); s.line(9, 6, 13, 2, null, m.lo); s.dot(3, 15, R.leather); }
function cutlass(s, col) { const m = metalOf(col); for (let i = 0; i < 10; i++) { const x = 4 + i, y = 11 - i + Math.round(Math.sin(i / 3) * 1.5); s.dot(x, y, m); s.dot(x, y + 1, m); } s.fix(14, 1, m.gl); s.line(2, 10, 6, 14, R.gold); s.ell(3, 12, 2, 2, R.gold); s.line(3, 12, 1, 14, R.leather); }
function bowSprite(s, col, glow) { const w = rp(col); for (let i = 0; i <= 24; i++) { const t = i / 24, x = 2 + 10 * t, y = 14 - 13 * t, b = Math.sin(t * Math.PI) * 3.6; s.dot(x - b, y - b, w); s.dot(x - b + 1, y - b, w); } s.line(3, 14, 13, 1, null, '#efe4c8'); s.rect(4, 6, 2, 3, R.leather); if (glow) for (const [x, y] of [[2, 6], [7, 1], [13, 1]]) s.fix(x, y, glow); }
function staffSprite(s, col, orb) { const w = rp(col); s.line(3, 15, 11, 4, w); s.line(4, 15, 12, 4, w); const o = ramp(orb, { gl: .8 }); s.ell(12.5, 3, 2.4, 2.4, o); s.fix(12, 2, '#ffffff'); s.line(10, 5, 14, 5, null, w.lo); }
const ORB = ['#8fc0ff', '#7fe0b0', '#f0d060', '#ff8a5a', '#c07aff', '#e2d4ff', '#9fffe8'];

/* ---------- armour ---------- */
function helmSprite(s, col) { const m = metalOf(col); s.ell(8, 7, 5.4, 5.6, m); s.rect(3, 7, 11, 6, m); s.rect(5, 8, 7, 1, rp('#1e1a24')); s.rect(7, 9, 3, 3, rp('#1e1a24')); s.line(8, 2, 8, 6, null, m.lo); s.fix(5, 4, m.gl); s.fix(6, 3, m.hi); }
function chiefHelm(s, col) { helmSprite(s, col); const h = rp('#efe2c4'); s.poly([[3, 6], [0, 1], [2, 2], [4, 4]], h); s.poly([[13, 6], [16, 1], [14, 2], [12, 4]], h); }
function crown(s, col) { const m = metalOf(col); s.poly([[2, 13], [2, 6], [5, 9], [8, 4], [11, 9], [14, 6], [14, 13]], m); s.rect(2, 11, 13, 2, rp(mix(col, '#3a2448', .2))); [[5, 11], [8, 11], [11, 11]].forEach(([x, y]) => s.fix(x, y, '#ff7ad0')); s.fix(8, 5, '#ffffff'); }
function coif(s, col) { const m = rp(col); s.ell(8, 8, 6, 6.4, m); s.ell(8, 9.5, 3.4, 3.6, rp('#2a1e24')); s.rect(3, 12, 10, 3, m); s.fix(5, 4, m.gl); s.line(4, 14, 12, 14, null, m.lo); }
function hood(s, col) { const m = rp(col); s.poly([[8, 1], [14, 10], [13, 15], [3, 15], [2, 10]], m); s.ell(8, 10, 3, 3.6, rp('#1e1a2a')); s.line(8, 1, 6, 6, null, m.hi); s.line(3, 14, 13, 14, null, rp('#e6c86a').base); }
function platebody(s, col) { const m = metalOf(col); s.poly([[4, 3], [12, 3], [13, 13], [3, 13]], m); s.rect(1, 3, 3, 4, m); s.rect(12, 3, 3, 4, m); s.erase(7, 3); s.erase(8, 3); s.erase(7, 4); s.erase(8, 4); s.line(8, 5, 8, 12, null, m.lo); s.fix(5, 5, m.gl); s.line(4, 10, 12, 10, null, m.lo); }
function vest(s, col) { const m = rp(col); s.poly([[4, 3], [12, 3], [13, 14], [3, 14]], m); s.rect(2, 3, 2, 5, m); s.rect(12, 3, 2, 5, m); s.erase(7, 3); s.erase(8, 3); s.erase(8, 4); s.erase(7, 4); for (let y = 6; y <= 12; y += 2) { s.fix(7, y, '#e8dcc0'); s.fix(9, y, '#e8dcc0'); } s.line(8, 5, 8, 13, null, m.lo); s.line(3, 13, 13, 13, null, m.lo); }
function robeTop(s, col) { const m = rp(col), trim = rp('#e6c86a'); s.poly([[4, 2], [12, 2], [15, 9], [12, 9], [12, 15], [4, 15], [4, 9], [1, 9]], m); s.line(8, 2, 8, 15, trim); s.line(1, 9, 4, 9, null, trim.base); s.line(12, 9, 15, 9, null, trim.base); s.rect(4, 10, 8, 1, rp(mix(col, '#3a2448', .3))); }
function platelegs(s, col) { const m = metalOf(col); s.rect(3, 2, 10, 3, m); s.rect(3, 5, 4, 10, m); s.rect(9, 5, 4, 10, m); s.line(5, 6, 5, 13, null, m.gl); s.line(11, 6, 11, 13, null, m.hi); s.rect(3, 9, 4, 1, rp(mix(col, '#3a2448', .3))); s.rect(9, 9, 4, 1, rp(mix(col, '#3a2448', .3))); }
function chaps(s, col) { const m = rp(col); s.rect(4, 2, 8, 3, m); s.poly([[4, 5], [7, 5], [7, 15], [3, 15]], m); s.poly([[9, 5], [12, 5], [13, 15], [9, 15]], m); s.rect(4, 2, 8, 1, rp('#4a3226')); s.fix(8, 2, '#e6c86a'); s.line(5, 7, 5, 13, null, m.hi); }
function robeBottom(s, col) { const m = rp(col); s.poly([[4, 2], [12, 2], [14, 15], [2, 15]], m); s.rect(4, 2, 8, 2, rp('#e6c86a')); s.line(8, 4, 8, 14, null, m.lo); s.line(2, 14, 14, 14, null, rp('#e6c86a').base); }
function shield(s, col) { const m = metalOf(col); s.poly([[3, 2], [13, 2], [13, 8], [8, 15], [3, 8]], m); s.poly([[5, 4], [11, 4], [11, 8], [8, 12], [5, 8]], rp(mix(col, '#c8483c', .45))); s.line(8, 4, 8, 11, null, m.gl); s.line(5, 7, 11, 7, null, m.gl); s.fix(4, 3, m.gl); }

/* ---------- jewellery ---------- */
function ring(s, col) { const g = R.gold; s.ell(8, 10, 4.6, 4, g); for (let y = 8; y <= 12; y++) for (let x = 6; x <= 10; x++) if (((x - 8) ** 2) / 7 + ((y - 10) ** 2) / 5 < 1) s.erase(x, y); s.ell(8, 5, 2.2, 2, ramp(col, { gl: .8 })); s.fix(7, 4, '#ffffff'); }
function amulet(s, col) { for (let i = 0; i <= 12; i++) { const a = Math.PI * i / 12; s.fix(8 + Math.cos(a) * 6, 2 + Math.sin(a) * 5, R.gold.base); } s.poly([[8, 7], [11, 10], [8, 14], [5, 10]], ramp(col, { gl: .8 })); s.fix(7, 9, '#ffffff'); s.dot(8, 7, R.gold); }
function tuskCharm(s) { for (let i = 0; i <= 10; i++) { const a = Math.PI * i / 10; s.fix(8 + Math.cos(a) * 6, 2 + Math.sin(a) * 4, '#7a5236'); } for (let i = 0; i < 7; i++) s.dot(7 + Math.round(Math.sin(i / 3) * 2), 7 + i, rp('#efe2c4')); s.dot(8, 7, rp('#efe2c4')); }
function featherSprite(s, col) { const f = rp(col); s.line(3, 14, 12, 2, rp('#d8d0b8')); for (let i = 0; i < 9; i++) { s.dot(5 + i, 11 - i, f); s.dot(6 + i, 12 - i, f); s.dot(4 + i, 10 - i, f); } s.fix(12, 2, f.gl); }
function pendant(s, col) { amulet(s, col); s.poly([[8, 6], [10, 9], [8, 15], [6, 9]], ramp(col, { gl: .85 })); s.fix(7, 9, '#ffffff'); }

/* ---------- tools ---------- */
function rod(s, col) { s.line(2, 14, 12, 1, R.wood); s.line(3, 14, 13, 1, R.woodLight); s.line(13, 1, 14, 9, null, '#e8dcc0'); s.rect(4, 11, 2, 2, metalOf(col)); s.fix(14, 10, metalOf(col).gl); s.fix(2, 15, R.leather.base); }
function axe(s, col) { const m = metalOf(col); s.line(3, 14, 10, 4, R.wood); s.line(4, 14, 11, 4, R.wood); s.poly([[8, 3], [13, 1], [14, 7], [10, 6]], m); s.fix(13, 2, m.gl); s.line(9, 6, 13, 6, null, m.lo); }
function pick(s, col) { const m = metalOf(col); s.line(4, 14, 11, 5, R.wood); s.line(5, 14, 12, 5, R.wood); for (let i = 0; i <= 10; i++) { const t = i / 10, x = 3 + Math.round(11 * t), y = 5 - Math.round(Math.sin(t * Math.PI) * 3); s.dot(x, y, m); s.dot(x, y + 1, m); } s.fix(13, 6, m.gl); }
function gloves(s, col) { const l = R.leather, m = metalOf(col); const hand = (ox, flip) => { const X = x => flip ? ox + 6 - x : ox + x; s.rect(X(1) - (flip ? 4 : 0), 7, 5, 6, l); for (const [fx, top] of [[1, 3], [2, 2], [3, 2], [4, 3]]) s.rect(X(fx), top, 1, 5, l); s.rect(X(flip ? 6 : 0), 8, 1, 3, l); s.rect(X(1) - (flip ? 4 : 0), 12, 5, 2, m); }; hand(1, false); hand(8, true); s.fix(3, 9, l.lo); s.fix(12, 9, l.lo); }
function hoe(s, col) { const m = metalOf(col); s.line(3, 15, 11, 2, R.wood); s.line(4, 15, 12, 2, R.wood); s.poly([[9, 2], [14, 3], [14, 6], [11, 5]], m); s.fix(13, 3, m.gl); }

/* ---------- farming: seeds, crops and growth stages ---------- */
const CROP_DRAW = {
  potato: s => { s.ell(8, 9, 5, 4, R.potato); [[6, 9], [10, 8], [9, 11]].forEach(([x, y]) => s.fix(x, y, R.potato.lo)); s.poly([[7, 5], [9, 1], [10, 5]], R.leafCrop); },
  onion: s => { const o = rp('#d8b060'); s.ell(8, 10, 4.6, 4.2, o); s.poly([[7, 6], [8, 1], [9, 6]], rp('#7ab04a')); s.line(8, 7, 8, 13, null, o.lo); s.line(5, 13, 11, 13, null, rp('#e8e0c0').base); },
  cabbage: s => { const c = rp('#8fcf6a'); s.ell(8, 9, 6, 5.4, c); s.ell(8, 9, 3.6, 3.4, rp('#b8e890')); s.line(8, 4, 8, 13, null, c.lo); s.line(4, 9, 12, 9, null, c.lo); },
  wheat: s => { const w = rp('#e0c060'); for (const x of [5, 8, 11]) { s.line(x, 15, x + 1, 6, rp('#b89a40')); for (let y = 2; y < 7; y++) { s.dot(x + 1, y, w); s.dot(x + 2, y + 1, w); } } s.rect(4, 11, 9, 1, rp('#7a5236')); },
  strawberry: s => { const r = rp('#e0405a'); s.poly([[3, 6], [13, 6], [8, 15]], r); s.ell(8, 7, 5, 2, r); [[6, 8], [9, 9], [8, 11], [11, 8], [7, 12]].forEach(([x, y]) => s.fix(x, y, '#f8e080')); s.poly([[5, 5], [8, 2], [11, 5], [8, 6]], R.leafCrop); },
  pumpkin: s => { const p = rp('#ef8a3a'); s.ell(8, 10, 6.6, 4.6, p); s.line(5, 6, 5, 14, null, p.lo); s.line(8, 6, 8, 15, null, p.lo); s.line(11, 6, 11, 14, null, p.lo); s.rect(7, 3, 2, 3, rp('#6a8a3a')); s.dot(10, 3, R.leafCrop); },
  goldleaf: s => { const g = ramp('#e8d050', { gl: .8 }); [[5, 9, -1], [8, 6, 0], [11, 9, 1]].forEach(([x, y, k]) => s.poly([[x, y + 6], [x - 2 + k, y], [x + 2 + k, y]], g)); s.line(8, 15, 8, 9, rp('#8a7a3a')); s.fix(8, 6, '#ffffff'); },
  sunbloom: s => { const p = rp('#ffd84a'); for (let i = 0; i < 10; i++) { const a = i * Math.PI / 5; s.ell(8 + Math.cos(a) * 4, 7 + Math.sin(a) * 4, 1.4, 1.4, p); } s.ell(8, 7, 2.6, 2.6, rp('#8a5a2a')); s.line(8, 11, 8, 15, rp('#5a8a3a')); },
  moonmelon: s => { const m = rp('#a8c8ff'); s.ell(8, 9, 6, 5, m); s.poly([[5, 6], [8, 4], [10, 7], [7, 7]], rp('#f0f6ff')); [[5, 9], [8, 12], [11, 9]].forEach(([x, y]) => s.fix(x, y, m.lo)); s.rect(7, 3, 2, 2, rp('#5a8a6a')); },
  starfruit: s => { const st = ramp('#fff0a0', { gl: .85 }); const pts = []; for (let i = 0; i < 10; i++) { const r = i % 2 ? 2.6 : 6.4, a = -Math.PI / 2 + i * Math.PI / 5; pts.push([8 + Math.cos(a) * r, 8.5 + Math.sin(a) * r]); } s.poly(pts, st); s.fix(8, 8, '#ffffff'); }
};
function seedPacket(s, cropId) { const p = rp('#d8c49a'); s.rect(3, 3, 10, 12, p); s.rect(3, 3, 10, 2, rp('#b89a6a')); const c = (D.CROPS.find(x => x.id === cropId) || {}).col || '#8fcf6a'; s.ell(8, 10, 3, 2.6, rp(c)); s.fix(7, 9, rp(c).gl); s.line(5, 6, 11, 6, null, p.lo); }
function plantStage(stage, cropId) {
  const s = Spr(16, 16), soil = R.soil;
  s.ell(8, 13, 7, 2.6, soil); s.fix(5, 13, soil.lo); s.fix(10, 12, soil.lo); s.fix(12, 14, soil.lo);
  const leaf = R.leafCrop, c = (D.CROPS.find(x => x.id === cropId) || {}).col || '#8fcf6a';
  if (stage <= 0 || !cropId) { [[6, 12], [9, 11], [11, 13]].forEach(([x, y]) => s.fix(x, y, '#5a4030')); return s; }
  if (stage === 1) { s.line(8, 12, 8, 9, leaf); s.poly([[8, 9], [5, 7], [7, 10]], leaf); s.poly([[8, 9], [11, 7], [9, 10]], leaf); return s; }
  if (stage === 2) { s.line(8, 12, 8, 5, leaf); [[5, 9], [11, 8], [5, 6], [11, 5]].forEach(([x, y], i) => s.poly([[8, y + 2], [x, y], [i % 2 ? x - 2 : x + 2, y + 2]], leaf)); s.fix(8, 4, leaf.gl); return s; }
  /* mature: the plant with its produce showing */
  s.line(8, 12, 8, 4, leaf); [[4, 8], [12, 7], [5, 5], [11, 4]].forEach(([x, y], i) => s.poly([[8, y + 2], [x, y], [i % 2 ? x - 2 : x + 2, y + 2]], leaf));
  const pr = rp(c);
  if (cropId === 'wheat' || cropId === 'goldleaf') { for (const x of [5, 8, 11]) for (let y = 2; y < 7; y++) s.dot(x, y, pr); }
  else if (cropId === 'sunbloom') { for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4; s.dot(8 + Math.round(Math.cos(a) * 3), 4 + Math.round(Math.sin(a) * 3), pr); } s.ell(8, 4, 1.4, 1.4, rp('#8a5a2a')); }
  else if (cropId === 'potato' || cropId === 'onion') { s.ell(5, 12, 2, 1.6, pr); s.ell(11, 12, 2, 1.6, pr); }
  else if (cropId === 'pumpkin' || cropId === 'moonmelon' || cropId === 'cabbage') { s.ell(8, 11, 4, 3, pr); s.line(8, 9, 8, 13, null, pr.lo); }
  else { [[5, 7], [11, 6], [8, 3], [6, 10], [11, 10]].forEach(([x, y]) => { s.dot(x, y, pr); s.fix(x, y, pr.hi); }); }
  return s;
}

/* ---------- food, produce, potions, supplies ---------- */
const FOOD = {
  bread: s => { const b = rp('#c8904a'); s.ell(8, 10, 6, 4, b); s.ell(8, 9, 5, 3, rp('#dca868')); [[5, 8], [8, 7], [11, 8]].forEach(([x, y]) => s.line(x, y, x + 1, y + 2, null, b.lo)); },
  baked_potato: s => { plate(s); s.ell(8, 9, 5, 3.4, R.potato); s.poly([[6, 7], [10, 7], [8, 9]], rp('#f8e8a0')); s.fix(8, 7, '#fffbe0'); },
  veg_stew: s => { const bowl = rp('#8a5a3a'); s.ell(8, 9, 6, 2.4, rp('#c88a4a')); s.poly([[2, 9], [14, 9], [11, 14], [5, 14]], bowl); [[5, 8, '#e8a040'], [8, 9, '#7ab04a'], [11, 8, '#e0c070']].forEach(([x, y, c]) => s.fix(x, y, c)); s.fix(7, 5, '#ffffff'); s.fix(9, 4, '#ffffff'); },
  omelette: s => { plate(s); const e = rp('#f0d060'); s.poly([[3, 10], [8, 7], [13, 10], [8, 12]], e); s.line(4, 10, 12, 10, null, e.lo); s.fix(6, 9, '#7ab04a'); },
  cheese_pie: s => { const c = rp('#e0b060'); s.poly([[2, 11], [14, 11], [12, 14], [4, 14]], rp('#c08040')); s.ell(8, 10, 6, 2.4, c); for (const x of [4, 7, 10, 12]) s.fix(x, 10, c.lo); },
  berry_cake: s => { const c = rp('#f6e0c8'); s.poly([[3, 7], [13, 5], [13, 13], [3, 14]], c); s.poly([[3, 7], [13, 5], [13, 7], [3, 9]], rp('#f08aa0')); [[6, 5], [10, 4]].forEach(([x, y]) => s.ell(x, y, 1.2, 1.2, rp('#c8304a'))); s.line(3, 11, 13, 10, null, rp('#f08aa0').base); },
  pumpkin_pie: s => { const p = rp('#e8803a'); s.poly([[2, 11], [14, 11], [12, 14], [4, 14]], rp('#c08040')); s.ell(8, 10, 6, 2.4, p); s.fix(8, 10, '#fff2d0'); s.fix(7, 10, '#fff2d0'); },
  honey_roast: s => { plate(s); const m = rp('#c0702a'); s.ell(8, 8.6, 5, 3.6, m); s.line(11, 7, 15, 4, rp('#efe2c4')); [[6, 8], [9, 7]].forEach(([x, y]) => s.fix(x, y, '#ffd060')); }
};
const PRODUCE = {
  egg: s => { s.ell(8, 9, 4, 5, rp('#f6efe0')); s.fix(6, 6, '#ffffff'); s.fix(10, 11, rp('#f6efe0').lo); },
  milk: s => { s.poly([[5, 5], [11, 5], [12, 14], [4, 14]], rp('#f4f4f0')); s.rect(6, 2, 4, 3, rp('#e8e0d0')); s.rect(6, 1, 4, 1, rp('#4a8ac0')); s.line(5, 9, 11, 9, null, rp('#4a8ac0').base); },
  wool: s => { const w = rp('#efe8d8'); s.ell(8, 9, 5.6, 5, w); for (let i = 0; i < 4; i++) s.line(4 + i * 2, 5, 6 + i * 2, 13, null, w.lo); s.line(12, 12, 15, 15, rp('#d8cfb8')); },
  truffle: s => { const t = rp('#5a3a28'); s.ell(8, 9, 5, 4.6, t); [[6, 7], [9, 8], [7, 11], [10, 11]].forEach(([x, y]) => s.fix(x, y, t.lo)); s.fix(6, 6, t.hi); },
  cheese: s => { const c = rp('#f0d890'); s.poly([[2, 12], [12, 6], [14, 12]], c); s.rect(2, 12, 13, 2, rp('#e0c070')); [[8, 10], [11, 9], [6, 12]].forEach(([x, y]) => s.fix(x, y, c.lo)); },
  honey: s => { s.poly([[4, 6], [12, 6], [12, 14], [4, 14]], ramp('#e8a820', { gl: .7 })); s.rect(4, 4, 8, 2, rp('#d8c49a')); s.line(4, 3, 12, 3, null, rp('#c8483c').base); s.fix(6, 8, '#fff2a0'); s.line(4, 9, 12, 9, null, '#c8803a'); }
};
const BOTTLE = { potion_heal: 'round', potion_haste: 'tall', potion_might: 'square', potion_fortune: 'clover', potion_scholar: 'flask' };
function potion(s, id) {
  const col = (D.ITEMS[id] || {}).col || '#e2574c', liq = ramp(col, { gl: .8 }), glass = rp('#d8e8f0'), shape = BOTTLE[id] || 'round';
  if (shape === 'tall') { s.rect(6, 3, 4, 12, glass); s.rect(6, 7, 4, 8, liq); s.rect(6, 1, 4, 2, R.wood); }
  else if (shape === 'square') { s.rect(4, 6, 8, 9, glass); s.rect(4, 9, 8, 6, liq); s.rect(6, 3, 4, 3, glass); s.rect(6, 1, 4, 2, R.wood); }
  else if (shape === 'flask') { s.poly([[6, 2], [10, 2], [10, 6], [14, 14], [2, 14], [6, 6]], glass); s.poly([[5, 9], [11, 9], [14, 14], [2, 14]], liq); s.rect(6, 0, 4, 2, R.wood); }
  else { s.ell(8, 10, 5, 4.6, glass); s.ell(8, 11, 4.4, 3.4, liq); s.rect(7, 3, 2, 3, glass); s.rect(6, 1, 4, 2, R.wood); }
  s.fix(5, shape === 'tall' ? 5 : 8, '#ffffff');
  if (shape === 'clover') [[6, 9], [10, 9], [8, 11]].forEach(([x, y]) => s.fix(x, y, '#e8ffe0'));
}
function runeStone(s, col) { const r = rp('#8a8a9a'); s.poly([[4, 2], [12, 3], [13, 13], [3, 14]], r); const g = ramp(col, { gl: .85 }); s.line(8, 5, 8, 11, null, g.hi); s.line(6, 7, 10, 9, null, g.hi); s.fix(8, 5, g.gl); }
function sack(s, col) { const b = rp(col); s.poly([[3, 14], [2, 9], [5, 5], [11, 5], [14, 9], [13, 14]], b); s.rect(6, 3, 4, 2, b); s.line(5, 5, 11, 5, null, rp('#7a5236').base); s.line(5, 9, 8, 12, null, b.lo); }
function pouch(s) { const b = rp('#a8783a'); s.ell(8, 10, 5.4, 4.4, b); s.rect(6, 4, 4, 2, b); s.line(5, 6, 11, 6, null, R.gold.base); [[6, 11], [9, 12], [11, 10]].forEach(([x, y]) => s.fix(x, y, R.gold.gl)); }
function chest(s) { const w = R.wood; s.rect(2, 7, 12, 7, w); s.poly([[2, 7], [3, 3], [13, 3], [14, 7]], R.woodLight); s.rect(2, 7, 12, 1, R.gold); s.rect(7, 7, 2, 3, R.gold); s.line(2, 10, 14, 10, null, w.lo); s.fix(8, 9, '#2a1c1f'); s.fix(4, 4, R.woodLight.gl); }

/* ---------- hides, bones, odd bits ---------- */
function hide(s, id, col) {
  const h = rp(col);
  if (id === 'cloth') { s.poly([[2, 5], [13, 3], [14, 12], [3, 14]], h); s.line(3, 8, 13, 6, null, h.lo); s.line(3, 11, 13, 9, null, h.lo); return; }
  if (id === 'wyrm_scale') { s.poly([[8, 2], [14, 8], [8, 15], [2, 8]], ramp(col, { gl: .75 })); s.line(8, 3, 8, 14, null, rp(col).lo); s.fix(6, 6, '#fff2c0'); return; }
  s.poly([[3, 3], [7, 2], [9, 4], [13, 3], [14, 8], [13, 14], [9, 12], [7, 14], [2, 13], [3, 8]], h);
  if (id === 'cowhide') [[6, 6], [10, 9], [5, 11]].forEach(([x, y]) => s.ell(x, y, 1.6, 1.2, rp('#4a3a2a')));
  else if (id === 'bogscale' || id === 'drakehide') for (let y = 5; y < 13; y += 2) for (let x = 4 + (y % 4 ? 1 : 0); x < 13; x += 3) s.fix(x, y, h.lo);
  else for (let i = 0; i < 5; i++) s.line(4 + i * 2, 4, 5 + i * 2, 12, null, h.lo);
}
function bone(s, id, col) {
  const b = rp(col);
  if (id === 'boar_tusk') { for (let i = 0; i < 11; i++) { const t = i / 10; s.dot(3 + i, 13 - Math.round(Math.sin(t * 2.4) * 8), b); s.dot(3 + i, 14 - Math.round(Math.sin(t * 2.4) * 8), b); } s.fix(13, 6, b.gl); return; }
  const big = id === 'troll_bone' ? 1 : 0; s.line(4, 12, 12, 4, b); s.line(5, 12, 12, 5, b); if (big) s.line(4, 11, 11, 4, b);
  s.ell(3, 12, 1.8 + big, 1.8 + big, b); s.ell(5, 14, 1.4 + big * .5, 1.4, b); s.ell(13, 4, 1.8 + big, 1.8 + big, b); s.ell(11, 2, 1.4 + big * .5, 1.4, b);
}
function arrows(s, col) { const m = metalOf(col); for (const [dx, dy] of [[0, 0], [2, 2], [-2, 2]]) { s.line(3 + dx, 13 + dy, 11 + dx, 5 + dy, R.woodLight); s.poly([[11 + dx, 5 + dy], [14 + dx, 2 + dy], [12 + dx, 6 + dy]], m); s.dot(3 + dx, 12 + dy, R.feather); s.dot(2 + dx, 13 + dy, R.feather); } }

/* ---------- relics ---------- */
const RELIC = {
  weathered_map: s => { const p = rp('#d8c08a'); s.rect(3, 3, 10, 11, p); s.rect(2, 2, 2, 12, rp('#b89a5a')); s.rect(12, 3, 2, 12, rp('#b89a5a')); s.line(5, 6, 8, 9, null, '#7a5a3a'); s.line(8, 9, 11, 7, null, '#7a5a3a'); s.fix(11, 7, '#c8483c'); s.fix(6, 11, '#5a8a4a'); },
  rusted_lantern: s => { const m = rp('#9a6a3a'); s.rect(4, 5, 8, 9, m); s.rect(5, 6, 6, 7, ramp('#ffd060', { gl: .8 })); s.rect(6, 3, 4, 2, m); s.line(6, 1, 9, 1, null, m.lo); s.fix(8, 9, '#fff6c0'); s.fix(5, 13, '#7a4a2a'); },
  star_shard: s => { const c = ramp('#bfe8ff', { gl: .9 }); s.poly([[8, 1], [11, 8], [8, 15], [5, 8]], c); s.line(8, 2, 8, 14, null, c.hi); s.fix(7, 5, '#ffffff'); s.fix(12, 3, '#ffffff'); s.fix(3, 12, '#ffffff'); },
  millers_bell: s => { const b = ramp('#d8b050', { gl: .75 }); s.poly([[5, 4], [11, 4], [13, 13], [3, 13]], b); s.ell(8, 4, 3, 2, b); s.rect(2, 12, 12, 2, b); s.ell(8, 14.5, 1.4, 1.4, rp('#7a5a2a')); s.fix(6, 6, b.gl); s.rect(7, 1, 2, 2, rp('#7a5236')); },
  lamplighter_lens: s => { const g = ramp('#ffe08a', { gl: .9 }); s.ell(8, 8, 5.4, 5.4, R.gold); s.ell(8, 8, 4, 4, g); s.fix(6, 6, '#ffffff'); s.fix(7, 6, '#ffffff'); s.line(12, 12, 15, 15, R.wood); },
  star_heart: s => { const c = ramp('#e2d4ff', { gl: .9 }); const pts = []; for (let i = 0; i < 10; i++) { const r = i % 2 ? 3 : 7, a = -Math.PI / 2 + i * Math.PI / 5; pts.push([8 + Math.cos(a) * r, 8.5 + Math.sin(a) * r]); } s.poly(pts, c); s.ell(8, 8.5, 2, 2, ramp('#ffb0e0')); s.fix(8, 8, '#ffffff'); }
};

/* ---------- the dispatcher: one finished design per item id ---------- */
const TIER_OF = id => ['bronze', 'iron', 'steel', 'mithril', 'adamant', 'rune', 'astral'].find(t => id.startsWith(t + '_'));
function itemSprite(id) {
  const it = D.ITEMS[id]; if (!it) return null;
  const s = Spr(16, 16), col = it.col || '#999999';
  if (id.startsWith('raw_') && (FISH[id.slice(4)] || id === 'raw_shrimp' || id === 'raw_lobster')) { const k = id.slice(4); if (k === 'shrimp') shrimp(s); else if (k === 'lobster') lobster(s); else fish(s, FISH[k], 0, 0); return s; }
  if (it.type === 'food' && (FISH[id] || id === 'shrimp' || id === 'lobster')) { plate(s); if (id === 'shrimp') shrimp(s, true); else if (id === 'lobster') lobster(s, true); else fish(s, FISH[id], 0, -2, true); return s; }
  if (id === 'burnt') { plate(s); fish(s, { len: 11, dep: 3.4, body: '#3a322e', belly: '#5a4a3e', tail: 'fork' }, 0, -2, false); return s; }
  if (FOOD[id]) { FOOD[id](s); return s; }
  if (PRODUCE[id]) { PRODUCE[id](s); return s; }
  if (RELIC[id]) { RELIC[id](s); return s; }
  if (id.startsWith('log_')) { logSprite(s, WOOD[id.slice(4)] || WOOD.normal); return s; }
  if (id.startsWith('ore_')) { oreSprite(s, id.slice(4)); return s; }
  if (id.startsWith('bar_')) { barSprite(s, col); return s; }
  if (it.type === 'gem') { gemSprite(s, id); return s; }
  if (id.startsWith('crop_')) { (CROP_DRAW[id.slice(5)] || CROP_DRAW.potato)(s); return s; }
  if (id.startsWith('seed_')) { seedPacket(s, id.slice(5)); return s; }
  if (it.type === 'potion') { potion(s, id); return s; }
  if (id === 'rune') { runeStone(s, col); return s; }
  if (id === 'feed') { sack(s, col); return s; }
  if (id === 'coin_pouch') { pouch(s); return s; }
  if (id === 'treasure_chest') { chest(s); return s; }
  if (id === 'feather') { featherSprite(s, col); return s; }
  if (it.ic === 'hide') { hide(s, id, col); return s; }
  if (it.ic === 'bone') { bone(s, id, col); return s; }
  if (it.type === 'tool') { ({ rod, woodcutting: axe, mining: pick, glove: gloves, hoe })[it.ic]?.(s, col); return s; }
  if (it.slot === 'ammo') { arrows(s, col); return s; }
  if (it.slot === 'weapon') {
    if (id === 'barnacle_cutlass') cutlass(s, col);
    else if (it.style === 'ranged') bowSprite(s, col, /magic|elder|emberfang/.test(id) ? (id === 'emberfang_bow' ? '#ffb04a' : '#e0d0ff') : null);
    else if (it.style === 'magic') staffSprite(s, col, id === 'witch_staff' ? '#b79cff' : ORB[Math.max(0, ['normal', 'oak', 'willow', 'maple', 'yew', 'magic', 'elder'].indexOf(id.replace('staff_', '')))] || '#8fc0ff');
    else if (it.wtype === 'dagger' || /dagger/.test(id)) dagger(s, col);
    else if (it.wtype === 'hammer' || /hammer/.test(id)) warhammer(s, col);
    else longsword(s, col);
    return s;
  }
  if (it.slot === 'head') { if (id === 'hollow_crown') crown(s, col); else if (id === 'chief_helm') chiefHelm(s, col); else if (/robe_/.test(id)) hood(s, col); else if (it.lth || /coif/.test(id)) coif(s, col); else helmSprite(s, col); return s; }
  if (it.slot === 'body') { if (/robe_/.test(id)) robeTop(s, col); else if (it.lth || /vest/.test(id)) vest(s, col); else platebody(s, col); return s; }
  if (it.slot === 'legs') { if (/robe_/.test(id)) robeBottom(s, col); else if (it.lth || /chaps/.test(id)) chaps(s, col); else platelegs(s, col); return s; }
  if (it.slot === 'shield') { shield(s, col); return s; }
  if (it.slot === 'ring') { if (id === 'storm_feather') featherSprite(s, col); else ring(s, col); return s; }
  if (it.slot === 'amulet') { if (id === 'tusk_charm') tuskCharm(s); else if (id === 'frostmaw_pendant') pendant(s, col); else amulet(s, col); return s; }
  return null;
}
/* larger node art for fishing spots (32 x 16), reusing the species definitions */
function fishLarge(id) { const s = Spr(32, 16); if (id === 'shrimp') { const t = Spr(16, 16); shrimp(t); s.stamp(t, 8, 0); return s; } if (id === 'lobster') { const t = Spr(16, 16); lobster(t); s.stamp(t, 8, 0); return s; }
  const sp = FISH[id]; if (!sp) return null; const big = Object.assign({}, sp, { len: Math.min(28, sp.len * 1.9), dep: sp.dep * 1.6 }); fish(s, big, 8, 0); return s; }
Object.assign(A, { itemSprite, plantStage, fishLarge, FISH, WOOD, ORE, TIER_OF,
  itemUrl: id => A.url('item:' + id, () => itemSprite(id)),
  plantUrl: (stage, crop) => A.url('plant:' + stage + ':' + crop, () => plantStage(stage, crop)) });
})();
