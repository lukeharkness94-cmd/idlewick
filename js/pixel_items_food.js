/* Idlewick pixel art: food, fish, potions, seeds, crops and farm produce (16 x 16), redrawn in the chunky outlined
   style (owner, 28 Nov 2026; docs/pixel-art-style.md). Solid masses lit from the top left, five-step ramps, round forms
   sphere-lit, and a one-pixel outline in each material's darkest colour. Each part (a fish, its plate, the garnish) is
   drawn on its own layer and outlined there, so a cooked fish keeps its outline where it lies on the plate.
   Raw fish are whole and glistening, each species its own silhouette; cooked fish are browned on a plate with grill
   marks, a white cooked eye and a garnish; burnt fish are charred. Loaded just before pixel_runtime.js: it wraps the
   item and plant-stage dispatch, and everything else falls through to the earlier drawings. */
(() => {
const DQ = window.DQ, D = DQ.data, A = DQ.pixelArt; if (!A || !A.itemSprite) return;
const { Spr, ramp, mix, sphere } = A;
const rp = (c, o) => ramp(c, o);
const EYE = '#1e1418', WHITE = '#fffaf0';

/* ---------- layers: each drawn and outlined on its own, later ones on top ---------- */
/* a layer is fn(s) (outlined) or { f, outline: false } (fixed details: steam, sparkles, glints) */
function layers(...ls) {
  const out = new Array(256).fill(null);
  for (const l of ls) { if (!l) continue; const f = l.f || l, t = Spr(16, 16); f(t); const c = t.render(l.outline === false ? { outline: false } : undefined); c.forEach((v, i) => { if (v) out[i] = v; }); }
  const s = Spr(16, 16); out.forEach((v, i) => { if (v) s.fix(i % 16, (i / 16) | 0, v); });
  s.render = () => out.slice();
  return s;
}
const one = f => layers(f);

/* ---------- fish: a lit body from a side profile, then tail, fins and the face ---------- */
/* T maps design coordinates (a 16 x 16 fish) to the sprite: k scales about the centre, dx/dy move it (a cooked fish is
   a little smaller and sits up on its plate) */
const T0 = { k: 1, dx: 0, dy: 0 };
const tx = (T, x) => 8 + (x - 8) * T.k + T.dx, ty = (T, y) => 8 + (y - 8) * T.k + T.dy;
const P = (T, pts) => pts.map(([x, y]) => [tx(T, x), ty(T, y)]);
/* prof: keyframes [x, up, down] from the tail root to the snout (half-heights above and below the midline cy) */
function fishBody(s, T, prof, cy, back, belly, split = .55) {
  const xa = prof[0][0], xb = prof[prof.length - 1][0], mid = (xa + xb) / 2, half = (xb - xa) / 2 + .5;
  const at = x => { for (let i = 0; i < prof.length - 1; i++) { const [x0, u0, d0] = prof[i], [x1, u1, d1] = prof[i + 1]; if (x >= x0 && x <= x1) { const t = x1 === x0 ? 0 : (x - x0) / (x1 - x0); return [u0 + (u1 - u0) * t, d0 + (d1 - d0) * t]; } } return null; };
  for (let ox = Math.floor(tx(T, xa)) - 1; ox <= Math.ceil(tx(T, xb)) + 1; ox++) {
    const x = (ox - T.dx - 8) / T.k + 8, ud = at(x); if (!ud) continue;
    const [u, d] = ud, top = Math.round(ty(T, cy - u)), bot = Math.round(ty(T, cy + d));
    for (let oy = top; oy <= bot; oy++) {
      const y = (oy - T.dy - 8) / T.k + 8, yc = cy + (d - u) / 2, hh = (u + d) / 2 + .5;
      const nx = (x - mid) / half, ny = (y - yc) / hh, f = (y - (cy - u)) / Math.max(.5, u + d);
      s.tone(ox, oy, f > split ? belly : back, sphere(nx * .8, ny));
    }
  }
}
/* the eye: raw is wet and dark with a catch-light; cooked turns white */
const fishEye = (s, T, x, y, cooked) => { const X = Math.round(tx(T, x)), Y = Math.round(ty(T, y)); if (cooked) { s.fix(X, Y, '#f4ecdc'); } else { s.fix(X, Y, EYE); s.fix(X, Y - 1, WHITE); } };
const fixT = (s, T, x, y, c) => s.fix(Math.round(tx(T, x)), Math.round(ty(T, y)), c);
const toneT = (s, T, x, y, r, lv) => s.tone(Math.round(tx(T, x)), Math.round(ty(T, y)), r, lv);

/* species: colours (back, belly, fins), the side profile, the tail and fins that make the silhouette, and marks */
const brown = (c, t = .58) => mix(c, '#8a4a1c', t), golden = (c, t = .5) => mix(c, '#e8a850', t);
/* tails, rooted at x = r on the midline cy, h tall each way: chunky filled shapes (never a one-pixel stroke) */
function tail(s, T, type, r, cy, h, m) {
  const pts = {
    fork: [[r + 1, cy - 1.2], [r - 1.6, cy - h], [r - 3.4, cy - h], [r - 1.4, cy], [r - 3.4, cy + h], [r - 1.6, cy + h], [r + 1, cy + 1.2]],
    crescent: [[r + 1, cy - 1], [r - 1, cy - h], [r - 3, cy - h - .4], [r - 1.2, cy], [r - 3, cy + h + .4], [r - 1, cy + h], [r + 1, cy + 1]],
    square: [[r + 1, cy - 1.4], [r - 2.6, cy - h], [r - 3.2, cy - h + .4], [r - 2.6, cy], [r - 3.2, cy + h - .4], [r - 2.6, cy + h], [r + 1, cy + 1.4]],
    fan: [[r + 1, cy - 1.4], [r - 2.4, cy - h], [r - 3.4, cy - h + 1], [r - 3.4, cy + h - 1], [r - 2.4, cy + h], [r + 1, cy + 1.4]],
    shark: [[r + 1, cy - 1], [r - 2, cy - h - 1.6], [r - 3.4, cy - h - 1.6], [r - 1.4, cy + .4], [r - 2.4, cy + h * .7], [r + 1, cy + 1.2]],
    flyer: [[r + 1, cy - 1], [r - 2, cy - h + 1], [r - 3, cy - h + 1], [r - 1.2, cy], [r - 4, cy + h + 1], [r - 2, cy + h + 1], [r + 1, cy + 1.2]],
    veil: [[r + 1, cy - 1.4], [r - 3, cy - h], [r - 5, cy - h + 1], [r - 3, cy], [r - 5, cy + h + 1], [r - 2, cy + h], [r + 1, cy + 1.4]]
  }[type];
  if (type === 'round') s.ell(tx(T, r - 1.6), ty(T, cy), 2 * T.k, h * T.k, m); else s.poly(P(T, pts), m);
}
const fin = (s, T, pts, m) => s.poly(P(T, pts), m);
const SPECIES = {
  /* small, slim, silver-blue; a row of dark spots along the flank */
  sardine: { back: '#3f7896', belly: '#dce6ec', fin: '#5f8aa0', cy: 8.5, prof: [[5, 1, 1], [7, 2, 1.8], [10, 2.2, 2], [12.5, 1.4, 1.4], [13.5, .6, .8]],
    parts: (s, T, c, cy) => { tail(s, T, 'fork', 5, cy, 3, c.fin); fin(s, T, [[8, cy - 1.6], [9, cy - 3.6], [10.4, cy - 1.8]], c.fin); },
    marks: (s, T, c, cy) => { for (const x of [7, 9]) fixT(s, T, x, cy, c.back.out); }, eye: [12, 8] },
  /* longer, deep blue back, a silver flash and the jutting lower jaw */
  herring: { back: '#2f5f8a', belly: '#e4ecf2', fin: '#4f7090', cy: 8, prof: [[4, 1, 1], [6, 2.2, 2.2], [10, 2.6, 2.4], [13, 1.8, 1.8], [15, .4, 1.4]],
    parts: (s, T, c, cy) => { tail(s, T, 'fork', 4, cy, 3.6, c.fin); fin(s, T, [[8, cy - 2.2], [9, cy - 4.2], [11, cy - 2.2]], c.fin); fin(s, T, [[8, cy + 2.2], [9, cy + 4], [10, cy + 2.2]], c.fin); },
    marks: (s, T, c, cy) => { for (let x = 6; x <= 12; x++) fixT(s, T, x, cy, c.belly.gl); fixT(s, T, 15, cy + 1, c.back.lo); }, eye: [13, 7] },
  /* olive with a rosy stripe and black spots, square tail, an adipose fin */
  trout: { back: '#6f7440', belly: '#ecdcb4', fin: '#7a7044', cy: 8, prof: [[4, 1.2, 1.2], [6, 2.6, 2.4], [10, 3, 2.8], [13, 2.2, 2], [15, .8, 1]],
    parts: (s, T, c, cy) => { tail(s, T, 'square', 4, cy, 3.2, c.fin); fin(s, T, [[7.5, cy - 2.4], [8.5, cy - 4.6], [10.5, cy - 2.6]], c.fin); fin(s, T, [[5, cy - 1.6], [5.5, cy - 3], [6.5, cy - 1.8]], c.fin); fin(s, T, [[7, cy + 2.4], [8, cy + 4.2], [9, cy + 2.6]], c.fin); },
    marks: (s, T, c, cy) => { for (let x = 6; x <= 12; x++) fixT(s, T, x, cy + .4, x % 2 ? '#e8907a' : '#d47a68'); for (const [x, y] of [[6, -2], [9, -2], [11, -1], [7, -1], [8, -2.6]]) fixT(s, T, x, cy + y, '#2a2418'); }, eye: [13, 7] },
  /* big and silver with a dark x-spotted back and the hooked jaw (kype) */
  salmon: { back: '#506a86', belly: '#eef0f0', fin: '#5a6e84', cy: 8, prof: [[3, 1.1, 1.1], [5, 2.4, 2.2], [9, 3.4, 3], [12, 2.8, 2.4], [14, 1.6, 1.4], [15.4, .8, .6]],
    parts: (s, T, c, cy) => { tail(s, T, 'fork', 3, cy, 4, c.fin); fin(s, T, [[7.5, cy - 3], [9, cy - 5.4], [10.6, cy - 3]], c.fin); fin(s, T, [[4.6, cy - 1.8], [5.2, cy - 3], [6, cy - 2]], c.fin); fin(s, T, [[8, cy + 2.6], [9, cy + 4.4], [10, cy + 2.6]], c.fin); },
    marks: (s, T, c, cy) => { for (const [x, y] of [[6, -2], [8, -2], [10, -2], [7, -1], [9, -1]]) fixT(s, T, x, cy + y, c.back.out); fixT(s, T, 15, cy + 1, c.back.lo); fixT(s, T, 14, cy + 1.6, c.back.lo); }, eye: [13, 7] },
  /* a torpedo: deep blue back, yellow finlets, crescent tail, a pointed snout */
  tuna: { back: '#1f3a72', belly: '#d4dce6', fin: '#28447a', cy: 8, prof: [[4, .8, .8], [6, 2.6, 2.4], [9, 3.6, 3.2], [12, 3, 2.6], [14, 1.4, 1.2], [15.4, .3, .4]],
    parts: (s, T, c, cy) => { tail(s, T, 'crescent', 4.4, cy, 4.6, c.fin); fin(s, T, [[8, cy - 3.2], [10, cy - 6], [10.8, cy - 3.2]], c.fin); fin(s, T, [[8, cy + 3], [10, cy + 5.6], [10.8, cy + 3]], c.fin); },
    marks: (s, T, c, cy) => { for (const x of [5, 6.5]) { fixT(s, T, x, cy - 1.6, '#f0d040'); fixT(s, T, x, cy + 1.6, '#f0d040'); } for (let x = 8; x <= 13; x++) fixT(s, T, x, cy + .4, mix('#1f3a72', '#9ab8e8', .55)); }, eye: [13, 7] },
  /* a long flat bill, a tall sickle dorsal, a crescent tail */
  swordfish: { back: '#3a5676', belly: '#d8e0ea', fin: '#3e5878', cy: 9, prof: [[4, .8, .8], [6, 2.2, 1.8], [9, 2.6, 2.2], [11, 2, 1.8], [12, 1, 1]],
    parts: (s, T, c, cy) => { tail(s, T, 'crescent', 4.4, cy, 4, c.fin); fin(s, T, [[6.5, cy - 1.8], [7.2, cy - 6.6], [9, cy - 6], [9.6, cy - 2]], c.fin); fin(s, T, [[12, cy - .6], [15.6, cy - .6], [15.6, cy + .2], [12, cy + .6]], c.k('#5a6e80')); },
    marks: (s, T, c, cy) => { }, eye: [11, 8] },
  /* all head: a wide flat skull, a fringe of teeth, a short tapering body */
  monkfish: { back: '#6e5a40', belly: '#c4ae86', fin: '#5a4632', cy: 9, prof: [[3, .8, .8], [6, 1.6, 1.4], [9, 3, 2.4], [12, 4, 3], [14, 3.8, 3], [15.4, 2.2, 2.4]],
    parts: (s, T, c, cy) => { tail(s, T, 'round', 3.4, cy, 2.4, c.fin); fin(s, T, [[9, cy + 2], [10.5, cy + 5], [12, cy + 2.6]], c.fin); },
    marks: (s, T, c, cy) => { for (const [x, y] of [[6, -1], [9, -2], [11, 0], [8, 1], [12, -3]]) fixT(s, T, x, cy + y, c.back.lo); for (let x = 12; x <= 15; x++) fixT(s, T, x, cy + 1, '#2a1812'); fixT(s, T, 13, cy + 2, WHITE); fixT(s, T, 15, cy + 2, WHITE); fixT(s, T, 14, cy, WHITE); }, eye: [12.4, 6] },
  /* the tall triangular dorsal, the long upper tail lobe, gill slits, white belly */
  shark: { back: '#5f7488', belly: '#e4e8ec', fin: '#4e6276', cy: 9.4, prof: [[4, .7, .7], [6, 1.8, 1.4], [10, 2.6, 2.2], [13, 2, 1.6], [15.4, .6, .4]],
    parts: (s, T, c, cy) => { tail(s, T, 'shark', 4.4, cy, 3, c.fin); fin(s, T, [[7, cy - 2], [9.2, cy - 6.6], [10, cy - 6.6], [11, cy - 2.2]], c.fin); fin(s, T, [[10, cy + 1.8], [10.4, cy + 4.6], [11.4, cy + 4.6], [12, cy + 1.8]], c.fin); },
    marks: (s, T, c, cy) => { for (const x of [11, 12]) { fixT(s, T, x, cy - .6, c.back.lo); fixT(s, T, x, cy + .4, c.back.lo); } fixT(s, T, 14, cy + .8, c.back.out); }, eye: [13, 8.4] },
  /* a dark round body, a huge toothy mouth and the glowing lure */
  anglerfish: { back: '#46382a', belly: '#7a6646', fin: '#352a20', cy: 10, prof: [[4, .8, .8], [6, 2.4, 2.2], [9, 3.8, 3.4], [12, 3.8, 3.4], [14, 2.8, 3], [15.4, 1, 2.6]],
    parts: (s, T, c, cy) => { tail(s, T, 'fan', 4.4, cy, 2.6, c.fin); s.line(tx(T, 11), ty(T, 6.4), tx(T, 12), ty(T, 2.4), c.k('#6a5a3a')); s.line(tx(T, 12), ty(T, 2.4), tx(T, 14), ty(T, 2), c.k('#6a5a3a')); s.ell(tx(T, 14.6), ty(T, 3.2), 1.2 * T.k, 1.2 * T.k, rp('#f0d050', { gl: .9 })); },
    marks: (s, T, c, cy) => { for (let x = 11; x <= 15; x++) fixT(s, T, x, cy + 1, '#1a0e0c'); for (const x of [11, 13, 15]) fixT(s, T, x, cy, WHITE); for (const x of [12, 14]) fixT(s, T, x, cy + 2, WHITE); fixT(s, T, 14.6, 2.6, '#ffffe0'); }, eye: [12, 7.6], eyeCol: '#d8c060' },
  /* deep, humped and golden, big net-pattern scales, a long dorsal and a barbel */
  carp: { back: '#a06a24', belly: '#ecd49a', fin: '#9a6030', cy: 9, prof: [[3.6, 1.2, 1.2], [5, 2.8, 2.4], [8, 4.2, 2.8], [11, 3.8, 2.6], [13, 2.4, 2], [15, .8, 1]],
    parts: (s, T, c, cy) => { tail(s, T, 'fork', 3.6, cy - .4, 3.8, c.fin); fin(s, T, [[5.4, cy - 2.6], [6.4, cy - 5.4], [11, cy - 5.4], [11.4, cy - 3]], c.fin); fin(s, T, [[8, cy + 2.4], [9, cy + 4.6], [10.4, cy + 2.4]], c.fin); },
    marks: (s, T, c, cy) => { for (const [x, y] of [[6, -2], [8, -2], [10, -2], [7, 0], [9, 0], [11, 0]]) { fixT(s, T, x, cy + y, c.back.lo); fixT(s, T, x + 1, cy + y - 1, c.back.hi); } fixT(s, T, 15, cy + 1.4, c.fin.lo); fixT(s, T, 15, cy + 2.4, c.fin.lo); }, eye: [13, 7.6] },
  /* long and low, a duck-bill snout, dorsal and anal fins set far back, pale bean spots */
  pike: { back: '#56702e', belly: '#dcd8a0', fin: '#6e6436', cy: 8, prof: [[3, .8, .8], [5, 1.8, 1.8], [10, 2.2, 2], [13, 1.6, 1.4], [15.4, .7, .5]],
    parts: (s, T, c, cy) => { tail(s, T, 'fork', 3, cy, 3.4, c.fin); fin(s, T, [[4.4, cy - 1.6], [5.4, cy - 4], [7, cy - 1.8]], c.fin); fin(s, T, [[4.4, cy + 1.6], [5.4, cy + 4], [7, cy + 1.8]], c.fin); },
    marks: (s, T, c, cy) => { for (const [x, y] of [[6, -1], [8, 0], [10, -1], [12, 0], [7, 1], [9, -1.6]]) fixT(s, T, x, cy + y, '#e8e4a8'); }, eye: [13, 7] },
  /* a flying fish: wide winged pectoral fins and a long lower tail lobe */
  skyfin: { back: '#3a86c4', belly: '#e6f6ff', fin: '#3a78b0', cy: 9.4, prof: [[4.4, .8, .8], [6, 1.8, 1.8], [10, 2.2, 2], [13, 1.6, 1.4], [14.4, .6, .6]],
    parts: (s, T, c, cy) => { tail(s, T, 'flyer', 4.4, cy, 3, c.fin); fin(s, T, [[11, cy - .4], [9, cy - 6.6], [6.6, cy - 7], [4.6, cy - 5], [8.6, cy]], c.k('#c4eaff')); },
    marks: (s, T, c, cy) => { for (const [x, y] of [[6, -5.6], [7, -4.6], [8, -3.6], [9, -2.4]]) fixT(s, T, x, cy + y, '#ffffff'); for (const [x, y] of [[8, -5.6], [9, -4.6], [10, -3.4]]) fixT(s, T, x, cy + y, '#7ab8e0'); }, eye: [12.4, 8.6] },
  /* tiny, with a dark stripe nose to tail */
  minnow: { back: '#66764e', belly: '#e8ecd8', fin: '#7a8a6a', cy: 9, prof: [[6, .8, .8], [8, 1.6, 1.6], [10.4, 1.8, 1.6], [12.4, 1, 1]],
    parts: (s, T, c, cy) => { tail(s, T, 'fork', 6, cy, 2.2, c.fin); fin(s, T, [[8.4, cy - 1.4], [9.2, cy - 3], [10.2, cy - 1.4]], c.fin); },
    marks: (s, T, c, cy) => { for (let x = 6; x <= 11; x++) fixT(s, T, x, cy + .2, '#3a4630'); }, eye: [11.4, 8.4] },
  /* deep bars, a spiny dorsal and red-orange lower fins */
  perch: { back: '#788a28', belly: '#ece4a0', fin: '#d8603a', cy: 9, prof: [[3.6, 1, 1], [5, 2.6, 2.4], [9, 3.6, 2.8], [12, 3, 2.4], [14, 1.6, 1.4], [15.4, .6, .6]],
    parts: (s, T, c, cy) => { tail(s, T, 'square', 3.6, cy, 3, c.k('#9a9a44')); for (let i = 0; i < 4; i++) fin(s, T, [[6 + i * 1.5, cy - 3], [6.6 + i * 1.5, cy - 6], [7.6 + i * 1.5, cy - 3]], c.k('#5e6a30')); fin(s, T, [[9, cy + 2.4], [10, cy + 4.6], [11, cy + 2.4]], c.fin); fin(s, T, [[6, cy + 2], [6.6, cy + 4.2], [8, cy + 2.2]], c.fin); },
    marks: (s, T, c, cy) => { for (const x of [6, 8, 10]) for (let y = -2.4; y <= .6; y++) fixT(s, T, x, cy + y, '#3a4218'); }, eye: [13, 7.6] },
  /* tall and flat-sided, a small head, a long anal fin */
  bream: { back: '#857446', belly: '#ece0b8', fin: '#6e5e3e', cy: 8.4, prof: [[4.6, 1, 1], [6, 3.2, 3.4], [8, 4.4, 4.6], [10.6, 4, 3.6], [12.6, 2.2, 2], [14, .8, .8]],
    parts: (s, T, c, cy) => { tail(s, T, 'fork', 4.6, cy, 3.8, c.fin); fin(s, T, [[8.4, cy - 4.2], [10, cy - 6.4], [11, cy - 3.8]], c.fin); fin(s, T, [[5.4, cy + 3], [6, cy + 5.6], [10.6, cy + 4]], c.fin); },
    marks: (s, T, c, cy) => { for (const [x, y] of [[7, -2], [9, -2], [8, 0], [10, 0], [7, 2], [9, 2]]) fixT(s, T, x, cy + y, c.back.hi); }, eye: [12.4, 7.2] },
  /* slim and striped like rippled water, finlets and a crescent tail */
  mackerel: { back: '#1f6a78', belly: '#e4eef0', fin: '#24586a', cy: 8, prof: [[4.4, .7, .7], [6, 2, 1.8], [10, 2.4, 2.2], [13, 1.8, 1.6], [15.4, .6, .6]],
    parts: (s, T, c, cy) => { tail(s, T, 'crescent', 4.4, cy, 3.8, c.fin); fin(s, T, [[9, cy - 2], [10, cy - 4], [11, cy - 2]], c.fin); },
    marks: (s, T, c, cy) => { for (let i = 0; i < 4; i++) { fixT(s, T, 6 + i * 2, cy - 1.6 + (i % 2), '#0c2a30'); fixT(s, T, 7 + i * 2, cy - .6 - (i % 2), '#0c2a30'); } for (const x of [5, 6]) { fixT(s, T, x, cy - 1.8, '#e8e890'); fixT(s, T, x, cy + 1.8, '#e8e890'); } }, eye: [13, 7.4] },
  /* a flatfish from above: a fringed oval with both eyes on the top side, orange spots */
  flounder: { flat: true, back: '#76664a', belly: '#a8946a', fin: '#857250', cy: 8.5,
    marks: (s, T, c, cy) => { for (const [x, y] of [[5, -1], [8, -2], [7, 2], [10, 1], [6, 1]]) fixT(s, T, x, cy + y, '#d08048'); }, eye: [11.6, 7], eye2: [12.4, 9.2] },
  /* a broad flat head, long whiskers, a long anal fin, dark and smooth */
  catfish: { back: '#4a4a38', belly: '#a8a080', fin: '#3e3e30', cy: 9, prof: [[3.4, .8, .8], [6, 1.8, 2], [10, 2.4, 2.4], [13, 2.4, 2.2], [15.4, 1.4, 1.8]],
    parts: (s, T, c, cy) => { tail(s, T, 'round', 3.6, cy, 2.6, c.fin); fin(s, T, [[5, cy + 1.8], [6, cy + 3.6], [11, cy + 3.6], [12, cy + 2]], c.fin); fin(s, T, [[9, cy - 2], [10, cy - 4.2], [11, cy - 2]], c.fin); },
    marks: (s, T, c, cy) => { }, whiskers: true, eye: [13.4, 8] },
  /* a dark back with pale spots over a fiery orange belly; white-edged fins */
  char: { back: '#3a4a60', belly: '#e8603a', fin: '#d04a32', cy: 8, prof: [[4, 1, 1], [6, 2.2, 2.2], [10, 2.8, 2.6], [13, 2, 1.8], [15.4, .8, .8]],
    parts: (s, T, c, cy) => { tail(s, T, 'fork', 4, cy, 3.4, c.k('#46566c')); fin(s, T, [[8, cy - 2.2], [9, cy - 4.6], [11, cy - 2.4]], c.k('#46566c')); fin(s, T, [[8, cy + 2.4], [9, cy + 4.6], [10.4, cy + 2.4]], c.fin); },
    marks: (s, T, c, cy) => { for (const [x, y] of [[6, -2], [8, -1], [10, -2], [12, -1], [7, 0], [11, 0]]) fixT(s, T, x, cy + y, '#f0d0a8'); fixT(s, T, 8, cy + 4.6, WHITE); }, eye: [13, 7] },
  /* the great flag of a dorsal fin, spotted pink */
  grayling: { back: '#66667c', belly: '#e0e0ea', fin: '#56566e', cy: 10, prof: [[4, .9, .9], [6, 1.8, 1.8], [10, 2.4, 2], [13, 1.8, 1.4], [15.4, .6, .6]],
    parts: (s, T, c, cy) => { tail(s, T, 'fork', 4, cy, 3, c.fin); fin(s, T, [[5.4, cy - 1.6], [6.4, cy - 5.6], [9, cy - 6.8], [11.4, cy - 4.4], [12, cy - 2]], c.k('#6e6490')); },
    marks: (s, T, c, cy) => { for (const [x, y] of [[7, -3.6], [9, -4.6], [10.6, -3.4]]) fixT(s, T, x, cy + y, '#e86a8a'); for (const x of [8, 10]) for (let y = -5; y <= -2.6; y++) fixT(s, T, x, cy + y, '#4e4670'); for (const [x, y] of [[7, 0], [10, 0]]) fixT(s, T, x, cy + y, c.back.out); }, eye: [13, 9] },
  bogpuffer: { ball: true, back: '#667630', belly: '#dcdca0', fin: '#7a7a40', cy: 8.5, eye: [11.4, 7] },
  /* charcoal with glowing ember spots and a hot orange belly */
  cinderfish: { back: '#2e2424', belly: '#d8502a', fin: '#3a2828', cy: 8.6, prof: [[4.4, .7, .7], [6, 2, 1.8], [10, 2.8, 2.4], [13, 2, 1.8], [15.4, .6, .8]],
    parts: (s, T, c, cy) => { tail(s, T, 'shark', 4.4, cy, 3, c.fin); fin(s, T, [[7, cy - 2.2], [9, cy - 5.6], [10.6, cy - 2.4]], c.fin); },
    marks: (s, T, c, cy) => { for (const [x, y] of [[6, -1], [8, 0], [10, -1], [12, 0], [7, 1]]) fixT(s, T, x, cy + y, '#ffb04a'); fixT(s, T, 9, cy - 1.6, '#ff7a30'); }, eye: [13, 7.6], eyeCol: '#ffcf5a' },
  /* a stony block of a fish with an underslung jaw full of teeth */
  basaltjaw: { back: '#45454e', belly: '#7e7e88', fin: '#36363e', cy: 8.6, prof: [[3.6, 1.2, 1.2], [5, 2.8, 2.6], [9, 3.6, 3.2], [12, 3.2, 3.4], [14, 2.2, 3.4], [15.4, 1, 3.2]],
    parts: (s, T, c, cy) => { tail(s, T, 'square', 3.6, cy, 3.4, c.fin); fin(s, T, [[7, cy - 3.2], [8.6, cy - 6.6], [10, cy - 6.6], [11, cy - 3.4]], c.fin); },
    marks: (s, T, c, cy) => { for (const [x, y] of [[6, -2], [9, -3], [7, 1], [10, 0]]) fixT(s, T, x, cy + y, c.back.hi); for (const x of [12, 14]) fixT(s, T, x, cy + .6, WHITE); fixT(s, T, 13, cy + .6, '#1a1418'); fixT(s, T, 15, cy + .6, '#1a1418'); }, eye: [12.4, 6.6], eyeCol: '#e86a3a' },
  /* a pale ghost: a flowing veil tail, see-through spine, glowing blue eye */
  ghostfin: { back: '#b4bede', belly: '#f0f4ff', fin: '#c8d2f0', cy: 8, prof: [[5.4, .8, .8], [7, 2, 1.8], [11, 2.4, 2.2], [14, 1.6, 1.4], [15.4, .6, .6]],
    parts: (s, T, c, cy) => { tail(s, T, 'veil', 5.4, cy, 4.4, c.k('#dfe6fc')); fin(s, T, [[8, cy - 2], [10, cy - 5], [12, cy - 2]], c.fin); },
    marks: (s, T, c, cy) => { for (let x = 7; x <= 13; x++) fixT(s, T, x, cy, mix('#b4bede', '#7a88b8', .5)); for (const x of [8, 10, 12]) fixT(s, T, x, cy - 1, mix('#b4bede', '#7a88b8', .35)); }, eye: [13.4, 7.4], eyeCol: '#6ad0ff' },
  stormray: { ray: 1, back: '#4a72b0', belly: '#dfe8f8', fin: '#3a5a90', cy: 8, eye: [11, 7] },
  bogray: { ray: 0, back: '#4a5a46', belly: '#b8c0a8', fin: '#3a4a38', cy: 8, eye: [11, 7.4] },
  voideel: { eel: true, back: '#4a2a8a', belly: '#9a7ad8', fin: '#6a48b8', cy: 8, eye: [14, 7], eyeCol: '#f0d8ff' }
};
/* flatfish seen from above (both eyes on the top side), puffers as a spiny ball, rays as a kite, eels as a ribbon */
function flatFish(s, T, sp, c) {
  const cy = sp.cy; tail(s, T, 'fan', 2.6, cy, 2.6, c.fin);
  s.ell(tx(T, 8), ty(T, cy), 6 * T.k, 5 * T.k, c.fin, { flat: true });                 /* the fin fringe all round */
  s.ell(tx(T, 8.2), ty(T, cy), 4.8 * T.k, 3.8 * T.k, c.back);
}
function pufferBall(s, T, sp, c) {
  const cy = sp.cy, sp1 = rp('#c8c47a');
  for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2; s.line(Math.round(tx(T, 8 + Math.cos(a) * 4.6)), Math.round(ty(T, cy + Math.sin(a) * 4.3)), Math.round(tx(T, 8 + Math.cos(a) * 6)), Math.round(ty(T, cy + Math.sin(a) * 5.6)), sp1); }
  tail(s, T, 'fan', 3.6, cy, 1.8, c.fin);
  s.ell(tx(T, 8), ty(T, cy), 4.6 * T.k, 4.3 * T.k, c.back); s.ell(tx(T, 8.4), ty(T, cy + 2.4), 3 * T.k, 1.4 * T.k, c.belly);
}
function rayKite(s, T, sp, c) {
  const W = sp.ray ? 7.2 : 6, H = sp.ray ? 6 : 5, cx = sp.ray ? 8.6 : 9.4, cy = sp.cy;
  s.line(tx(T, cx - W + 1), ty(T, cy + .4), tx(T, 0), ty(T, cy + 4), c.fin);
  if (!sp.ray) { s.dot(Math.round(tx(T, cx - W)), Math.round(ty(T, cy + 1)), c.fin); }
  s.poly(P(T, [[cx - W, cy + .5], [cx - 1, cy - H], [cx + W - 1.2, cy - 1], [cx + W - .6, cy + .5], [cx + W - 1.2, cy + 1.6], [cx - 1, cy + H]]), c.back);
  fishBody(s, T, [[cx - 3, 1.6, 1.6], [cx + 1, 2.4, 2.4], [cx + 4.4, 1.4, 1.6]], cy, c.back, c.back, 2);
}
function eelBody(s, T, sp, c) {
  const cy = sp.cy, Y = i => cy + Math.sin(i / 2.4 + 1.2) * 1.8;
  for (let i = 0; i <= 13; i++) { const x = 1.5 + i, y = Math.round(Y(i)), w = i < 2 ? 1 : i > 10 ? 3 : 2;
    s.dot(Math.round(tx(T, x)), Math.round(ty(T, y - 1)), c.fin); for (let j = 0; j < w; j++) s.tone(Math.round(tx(T, x)), Math.round(ty(T, y + j)), j === w - 1 && w > 1 ? c.belly : c.back, j ? 2 : 3); }
}
function drawFish(s, id, T, cooked) {
  const sp = SPECIES[id];
  const c = cooked ? { back: rp(mix(sp.back, '#9a5420', .68)), belly: rp(mix(sp.belly, '#e0a050', .62)), fin: rp(mix(sp.fin, '#7a3c16', .66)), k: col => rp(mix(col, '#8a4a1c', .66)) }
    : { back: rp(sp.back), belly: rp(sp.belly), fin: rp(sp.fin), k: col => rp(col) };
  if (sp.flat) flatFish(s, T, sp, c);
  else if (sp.ball) pufferBall(s, T, sp, c);
  else if (sp.ray != null) rayKite(s, T, sp, c);
  else if (sp.eel) eelBody(s, T, sp, c);
  else { if (sp.parts) sp.parts(s, T, c, sp.cy); fishBody(s, T, sp.prof, sp.cy, c.back, c.belly); }
  return c;
}
function fishMarks(s, id, T, c, cooked) {
  const sp = SPECIES[id], cy = sp.cy;
  if (!cooked && sp.marks) sp.marks(s, T, c, cy);
  if (sp.flat && cooked) for (const [x, y] of [[6, -1], [9, 1]]) fixT(s, T, x, cy + y, c.back.lo);
  if (sp.ball && !cooked) for (const [x, y] of [[6, -1], [8, -2], [10, 0], [7, 1]]) fixT(s, T, x, cy + y, '#3e4a18');
  if (sp.ray != null && !cooked) { if (sp.ray) { for (const [x, y] of [[5, -3], [6, -2], [5, -1], [6, 0], [5, 1]]) fixT(s, T, x, cy + y, '#fff6a0'); fixT(s, T, 6, cy - 2, '#ffffff'); } else for (const [x, y] of [[6, -2], [8, 2], [5, 1], [9, -2], [11, 2]]) fixT(s, T, x, cy + y, '#2a3428'); }
  if (sp.eel && !cooked) for (const i of [3, 6, 9]) fixT(s, T, 1.5 + i, Math.round(cy + Math.sin(i / 2.4 + 1.2) * 1.8), '#e0c8ff');
  if (sp.whiskers) { const w = cooked ? '#5a3418' : '#26261c'; for (const [x, y] of [[15, 9.4], [16, 10.4], [15, 10.4], [14, 11.4], [16, 8.4]]) fixT(s, T, x, y, w); }
  const [ex, ey] = sp.eye; if (sp.eyeCol && !cooked) { fixT(s, T, ex, ey, sp.eyeCol); fixT(s, T, ex, ey - 1, mix(sp.eyeCol, '#ffffff', .6)); } else fishEye(s, T, ex, ey, cooked);
  if (sp.eye2) fishEye(s, T, sp.eye2[0], sp.eye2[1], cooked);
}
/* raw: the whole fish, wet and bright */
const rawFish = id => layers(s => { const c = drawFish(s, id, T0, false); fishMarks(s, id, T0, c, false); });
/* the plate: a cream oval seen from a little above, with a shaded well; the food sits on it. Garnish: a lemon wedge and
   a herb sprig on the rim. */
const PLATE = rp('#e6dfcf'), PLATE_IN = rp('#cbc1ad');
const plate = (s, cy = 10.6, rx = 7.4, ry = 4) => {
  const ins = (x, y, a, b) => ((x - 8) / a) ** 2 + ((y - cy) / b) ** 2 <= 1;
  for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++) for (let x = 0; x < 16; x++) {
    const X = x + .5 - .5, Y = y; if (!ins(X, Y, rx + .3, ry + .3)) continue;
    if (ins(X, Y - .4, rx - 1.7, ry - 1.3)) s.tone(x, y, PLATE_IN, ins(X, Y - 1, rx - 1.7, ry - 1.3) ? (ins(X, Y + 1, rx - 1.7, ry - 1.3) ? 2 : 3) : 1);  /* the well: shaded under its top rim */
    else s.tone(x, y, PLATE, Y < cy - ry * .3 ? 3 : Y > cy + ry * .55 ? 1 : 2);
  }
  s.tone(Math.round(8 - rx * .62), Math.round(cy - ry * .62), PLATE, 4); };
const lemon = s => { const l = rp('#f2d24a', { gl: .8 }); s.poly([[10.6, 14.4], [14.4, 14.4], [13.4, 12.4], [11.6, 12.4]], l); s.tone(11, 13, l, 4); s.fix(12, 14, '#fff6c8'); };
const sprig = s => { const g = rp('#4e9a40'); s.dot(2, 13, g); s.dot(3, 12, g); s.dot(3, 13, g); s.dot(1, 12, g); s.dot(4, 14, g); };
/* grill marks: short diagonal scorches across the flank (only where the fish is) */
const charMarks = (s, T, xs, cy, col) => { for (const gx of xs) { const X = Math.round(tx(T, gx)), Y = Math.round(ty(T, cy)); for (let j = -3; j <= 2; j++) { const p = s.at(X - j, Y + j); if (p && !p.fix) s.fix(X - j, Y + j, col); } } };
/* cooked: browned, a little smaller, lying on the plate, with grill marks, a white cooked eye and the garnish */
function cookedFish(id) {
  const sp = SPECIES[id], T = { k: sp.ball ? .76 : sp.flat ? .8 : .86, dx: 0, dy: sp.ball ? -2 : -1.6 };
  return layers(s => plate(s), s => { const c = drawFish(s, id, T, true); fishMarks(s, id, T, c, true);
    if (!sp.eel) charMarks(s, T, [6.6, 9.8], sp.cy, mix(c.back.lo, '#3a1a0a', .45)); }, lemon, sprig);
}
/* shrimp, side on: an arched, banded body, the fan tail, little legs and long feelers. Raw is grey and see-through;
   cooked curls tight and turns coral with white bands */
function shrimp(s, T, cooked) {
  const b = rp(cooked ? '#f0784c' : '#b8aab6'), fan = rp(cooked ? '#d85434' : '#c8848e'), band = cooked ? '#fff0e0' : '#7a6a7c';
  const a0 = cooked ? 240 : 196, a1 = cooked ? -10 : -4, R = cooked ? 4.2 : 4.8, cx = 7.6, cy = cooked ? 8.6 : 10, fy = cooked ? .9 : .78, n = 7, pts = [];
  for (let i = 0; i < n; i++) { const a = (a0 + (a1 - a0) * i / (n - 1)) * Math.PI / 180; pts.push([cx + Math.cos(a) * R, cy - Math.sin(a) * R * fy, 1 + 1.5 * i / (n - 1)]); }
  const t0 = pts[0]; s.poly(P(T, cooked ? [[t0[0] + .6, t0[1]], [t0[0] - 2.6, t0[1] - 1.4], [t0[0] - 1.4, t0[1] + 2.4]] : [[t0[0] + .6, t0[1] - .4], [t0[0] - 1.6, t0[1] + 3.2], [t0[0] + 1.8, t0[1] + 3]]), fan);
  for (const [x, y, r] of pts) s.ell(tx(T, x), ty(T, y), r * T.k, r * T.k, b);
  for (let i = 1; i < n - 1; i++) { const [x, y, r] = pts[i]; fixT(s, T, x, y - r + .6, band); }
  const [hx, hy] = pts[n - 1]; s.poly(P(T, [[hx + 1, hy - 1.4], [hx + 3.6, hy - .6], [hx + 1.4, hy]]), b);   /* the rostrum */
  if (!cooked) for (let i = 2; i < n; i++) { const [x, y, r] = pts[i]; fixT(s, T, x - .4, y + r + .6, '#c8a0a0'); }  /* legs */
  fixT(s, T, hx + .4, hy - .6, cooked ? '#3a1410' : EYE);
}
const feelers = (cooked) => ({ f: s => { const c = cooked ? '#f8b090' : '#c8ccd8'; if (cooked) { s.line(13, 5, 15, 2, null, c); s.line(12, 4, 12, 0, null, c); } else { s.line(14, 7, 15, 4, null, c); s.line(15, 4, 12, 1, null, c); s.line(12, 1, 7, 1, null, c); s.line(13, 7, 11, 3, null, c); s.line(11, 3, 6, 3, null, c); } }, outline: false });
/* lobster from above: claws forward, banded tail with its fan; raw is the living blue-black, cooked bright red */
function lobster(s, T, cooked) {
  const b = rp(cooked ? '#d83a24' : '#2e4a5e'), cl = rp(cooked ? '#e8502e' : '#3a5a6e'), j = cooked ? '#f4a070' : '#d8803a';
  s.poly(P(T, [[6, 13.6], [10, 13.6], [11.4, 15.4], [4.6, 15.4]]), b);                              /* tail fan */
  for (let i = 0; i < 3; i++) s.ell(tx(T, 8), ty(T, 12.4 - i * 1.6), (2 + i * .3) * T.k, 1 * T.k, b, { flat: true });
  s.ell(tx(T, 8), ty(T, 6.6), 2.6 * T.k, 2.8 * T.k, b);                                              /* carapace */
  s.line(tx(T, 6), ty(T, 5), tx(T, 4), ty(T, 3.6), cl); s.line(tx(T, 10), ty(T, 5), tx(T, 12), ty(T, 3.6), cl);
  s.ell(tx(T, 3.2), ty(T, 2.8), 2.4 * T.k, 2.2 * T.k, cl); s.ell(tx(T, 12.8), ty(T, 2.8), 2.4 * T.k, 2.2 * T.k, cl);   /* claws, each split into a pincer */
  for (const x of [3, 13]) { const X = Math.round(tx(T, x)), Y = Math.round(ty(T, 1)); s.erase(X, Y); s.erase(X, Y + 1); }
  for (const [x, y] of [[5, 8], [11, 8], [5, 10], [11, 10]]) s.dot(Math.round(tx(T, x)), Math.round(ty(T, y)), b); /* legs */
  fixT(s, T, 4.6, 4, j); fixT(s, T, 11.4, 4, j);
  for (let i = 0; i < 3; i++) fixT(s, T, 8, 12.4 - i * 1.6, b.hi);
  fixT(s, T, 7, 4.6, cooked ? '#3a1410' : '#e8d860'); fixT(s, T, 9, 4.6, cooked ? '#3a1410' : '#e8d860');
}
const rawShell = id => id === 'shrimp' ? layers(s => shrimp(s, T0, false), feelers(false))
  : layers(s => lobster(s, T0, false), { f: s => { s.line(6, 3, 5, 0, null, '#8aa0b0'); s.line(10, 3, 11, 0, null, '#8aa0b0'); }, outline: false });
const cookedShell = id => id === 'shrimp'
  ? layers(s => plate(s), s => shrimp(s, { k: .9, dx: 0, dy: -1.6 }, true), feelers(true), lemon, sprig)
  : layers(s => plate(s, 11, 7.6, 3.8), s => lobster(s, { k: .78, dx: 0, dy: -1.6 }, true), lemon);
/* burnt: a charred fish on the plate, cracked with embers, smoke rising */
const burnt = () => layers(s => plate(s), s => {
  const T = { k: .82, dx: 0, dy: -1.6 }, b = rp('#2a2422'), bl = rp('#3a302c');
  tail(s, T, 'fork', 4, 8, 3, b); fishBody(s, T, [[4, 1.2, 1.2], [6, 2.4, 2.2], [10, 2.8, 2.6], [13, 2, 1.8], [15, .8, .8]], 8, b, bl);
  for (const [x, y] of [[6, 7], [9, 6.4], [11, 9]]) fixT(s, T, x, y, '#6a625c');                  /* grey ash */
  for (const [x, y] of [[5, 8], [6, 8], [7, 9], [8, 8], [9, 8], [10, 9]]) fixT(s, T, x, y, '#a8301a'); fixT(s, T, 7, 9, '#ff8a3a'); /* one glowing crack */
  fixT(s, T, 13, 7, '#7a7068');
}, { f: s => { for (const [x, y, c] of [[12, 3, '#8a8490'], [13, 2, '#6e6878'], [12, 1, '#8a8490'], [13, 0, '#6e6878'], [9, 3, '#6e6878'], [8, 2, '#8a8490']]) s.fix(x, y, c); }, outline: false });

/* ---------- small shared pieces ---------- */
const steam = (pts = [[5, 2], [6, 1], [9, 3], [10, 2], [10, 0]]) => ({ f: s => pts.forEach(([x, y], i) => s.fix(x, y, i % 2 ? '#8e8aa0' : '#b4b0c4')), outline: false });
const glint = (...pts) => ({ f: s => pts.forEach(([x, y, c]) => s.fix(x, y, c || '#ffffff')), outline: false });
/* a bowl seen from a little above: lit clay belly, a rim, the contents as a flat oval */
function bowl(s, clay, food, o = {}) {
  const cy = o.cy ?? 9; s.ell(8, cy + 2, 6.6, 3.8, clay); s.rect(5, cy + 5, 6, 1, clay);
  s.ell(8, cy, 6.8, 2.4, rp(mix(clay.base, '#fff2c8', .2)), { flat: true }); s.ell(8, cy + .2, 5.4, 1.6, food, { flat: true });
  if (o.band) for (let x = 3; x <= 13; x++) s.fix(x, cy + 3, o.band);
}
/* a pie dish: the tin's side and the top as an oval */
function pieDish(s, tin, top, o = {}) {
  const cy = o.cy ?? 9; s.poly([[1.4, cy], [14.6, cy], [13.4, cy + 4.4], [2.6, cy + 4.4]], tin);
  s.ell(8, cy, 6.8, 3, top);
}

/* ---------- dishes and baking ---------- */
const DISH = {
  /* a round loaf, sphere-lit, three scores showing the crumb */
  bread: () => layers(s => { const c = rp('#c27a36'); s.ell(8, 9.4, 6.6, 4.4, c); }, { f: s => { for (const x of [4, 7, 10]) { s.fix(x, 7, '#f8e0a8'); s.fix(x + 1, 8, '#f0d090'); s.fix(x + 1, 9, '#d8a868'); s.fix(x + 2, 9, '#f0d090'); } }, outline: false },
    glint([4, 7, '#ffe8b8'])),
  /* stonebread: a squat grey-brown block of a loaf, cracked, with coal in it */
  stonebread: () => layers(s => { const side = rp('#6e6658'), top = rp('#9a8e78'); s.rect(2, 8, 12, 5, side); s.ell(8, 7.6, 6.2, 2.6, top);
    for (const [x, y] of [[5, 7], [6, 8], [10, 6], [11, 7]]) s.fix(x, y, top.out); for (const [x, y] of [[4, 11], [8, 10], [11, 12], [6, 12]]) s.fix(x, y, '#1e1a1c'); s.fix(13, 9, side.lo); s.erase(13, 12); s.erase(2, 12); }),
  /* split open, a pat of butter melting into it, chives, on a plate */
  baked_potato: () => layers(s => plate(s, 11.4, 7.2, 3.4), s => { const k = rp('#9a6a3e'); s.ell(8, 9, 5.6, 3.6, k); s.poly([[4.6, 8], [8, 5.6], [11.4, 8], [8, 9.6]], rp('#f4e2a8')); s.rect(7, 6, 2, 2, rp('#ffd84a', { gl: .9 })); },
    glint([7, 6, '#fff8d0'], [5, 8, '#5aa84a'], [10, 8, '#5aa84a'], [9, 9, '#5aa84a']), steam([[7, 3], [8, 2], [7, 1]])),
  /* a clay bowl of stew: carrot, potato and greens, a wooden spoon */
  veg_stew: () => layers(s => { s.line(11, 8, 14, 1, rp('#b8864a')); s.line(12, 8, 15, 1, rp('#b8864a')); },
    s => { bowl(s, rp('#9a5634'), rp('#a8562a')); for (const [x, y, c] of [[5, 9, '#f08a3a'], [7, 8, '#f0d8a0'], [9, 9, '#6ab04a'], [6, 10, '#6ab04a'], [10, 8, '#f08a3a'], [11, 9, '#f0d8a0']]) s.fix(x, y, c); },
    steam([[4, 5], [5, 4], [4, 3], [8, 5], [8, 3]])),
  /* a folded golden omelette with browned spots and herbs */
  omelette: () => layers(s => plate(s, 11.4, 7.2, 3.4), s => { const e = rp('#eec43e'); s.poly([[2.6, 10.4], [4, 7], [8, 5.4], [12, 7], [13.4, 10.4]], e); s.ell(8, 10.2, 5.4, 1.2, e, { flat: true });
    for (const [x, y] of [[5, 8], [9, 7], [11, 9], [7, 9]]) s.fix(x, y, '#c88a30'); for (const [x, y] of [[6, 7], [10, 8]]) s.fix(x, y, '#4e9a40'); }),
  /* a whole pie with a slice taken out: cheese and onion layers inside */
  cheese_pie: () => layers(s => { pieDish(s, rp('#8a8f98'), rp('#d89a4e'));
    s.poly([[8, 9], [14.4, 9], [13.6, 12.4], [8, 13]], rp('#f0d070')); for (const x of [9, 11, 13]) s.fix(x, 11, '#fbf6e8'); s.line(8, 9, 8, 12, null, '#b87a3a');
    for (const [x, y] of [[4, 8], [6, 7], [9, 7], [5, 10]]) s.fix(x, y, '#a86a2e'); }),
  /* a slice of layered sponge with pink cream and a strawberry on top */
  berry_cake: () => layers(s => { const sp = rp('#f0c890'), cr = rp('#fbf0e6'); s.poly([[2, 8], [13, 5], [14, 8], [3, 11]], cr); s.poly([[3, 11], [14, 8], [14, 14], [3, 15]], sp);
    s.line(3, 13, 14, 10, null, '#f07a98'); s.line(3, 12, 14, 9, null, '#e86888'); },
    s => { s.ell(10, 5, 2, 2, rp('#d8303e')); s.dot(10, 2, rp('#5aa84a')); s.dot(9, 3, rp('#5aa84a')); s.dot(11, 3, rp('#5aa84a')); }, glint([9, 4, '#ffd0d0'], [11, 6, '#f8e080'])),
  /* open pumpkin pie, crimped crust, a dollop of cream */
  pumpkin_pie: () => layers(s => { pieDish(s, rp('#c88a48'), rp('#d89a50')); s.ell(8, 9, 5.4, 2, rp('#e0762a'), { flat: true }); for (let x = 2; x <= 14; x += 2) s.fix(x, 9 + (x === 2 || x === 14 ? 0 : x < 8 ? -2 : -2), '#f0c078'); },
    s => { s.ell(8, 8, 1.8, 1.4, rp('#fbf4ea')); s.dot(8, 6, rp('#fbf4ea')); }),
  /* a glazed roast, honey running down it, shavings of truffle */
  honey_roast: () => layers(s => plate(s, 11.4, 7.2, 3.4), s => { const m = rp('#a85a24'); s.ell(8, 8.6, 5.4, 3.8, m); s.line(5, 7, 11, 6, null, '#f0b030'); s.line(6, 9, 11, 8, null, '#f0b030'); s.fix(10, 10, '#f0b030'); s.fix(10, 11, '#d89020');
    for (const [x, y] of [[7, 6], [9, 7], [6, 8]]) s.fix(x, y, '#3a2418'); }, glint([5, 6, '#ffe0a0']), s => sprig(s)),
  /* roast game: a browned haunch with its bone, on a plate */
  roast_game: () => layers(s => plate(s, 11.4, 7.2, 3.4), s => { const m = rp('#9a5426'); s.ell(6.6, 9, 4.6, 3.4, m); s.line(10, 7, 13, 4, rp('#efe4cc')); s.line(10, 8, 13, 5, rp('#efe4cc')); s.ell(13.4, 3.6, 1.4, 1.4, rp('#efe4cc'));
    s.line(4, 8, 8, 7, null, '#c8803a'); }, glint([4, 7, '#ffd8a0']), s => { const g = rp('#4e9a40'); s.dot(3, 12, g); s.dot(4, 13, g); }),
  /* raw game: a red haunch, marbled with fat, the bone end showing */
  raw_game: () => layers(s => { const m = rp('#b8404a'), f = rp('#f0d8c8'); s.ell(7, 9.6, 5.4, 4.4, m); s.ell(7, 9.6, 3.4, 2.6, rp('#d05a60'));
    s.line(4, 9, 8, 7, null, '#f4d0c8'); s.line(6, 12, 10, 10, null, '#f4d0c8'); s.line(11, 7, 14, 3, f); s.line(12, 7, 15, 3, f); s.ell(14.4, 2.4, 1.4, 1.4, f); }, glint([4, 7, '#ffd8d8'])),
  /* a feast on a board: a grilled salmon fillet, potatoes and an onion */
  hunters_feast: () => layers(s => { const b = rp('#8a5a32'); s.poly([[0.6, 8.6], [15.4, 8.6], [14.4, 14.6], [1.6, 14.6]], b); s.line(1, 11, 15, 11, null, b.lo); s.fix(15, 10, b.lo); },
    s => { const f = rp('#e88a5c'); s.ell(6, 8.6, 4.6, 2.6, f); for (const x of [4, 6, 8]) s.line(x, 7, x - 1, 10, null, '#fbe0cc'); s.line(3, 7, 9, 7, null, f.hi); },
    s => { const p = rp('#c8944e'); s.ell(12.2, 10.4, 2, 1.8, p); s.ell(12.6, 6.8, 1.6, 1.6, rp('#d8a848')); s.ell(4.6, 12.4, 1.8, 1.4, p); s.fix(12, 6, '#4e9a40'); },
    glint([11, 9, '#f0d8a8'], [3, 7, '#ffd8c0'])),
  /* a cup of glowing lantern tea on its saucer */
  lantern_tea: () => layers(s => s.ell(7.6, 13, 6.4, 1.8, rp('#d8e0e8'), { flat: true }), s => { const c = rp('#e8ecf0'); s.ell(7.6, 10, 4.6, 3.4, c); s.rect(3, 7, 10, 3, c); s.ell(13, 9.6, 1.6, 1.8, c); s.erase(13, 9); s.erase(13, 10); s.ell(7.6, 7, 4.4, 1.2, rp('#f0b828', { gl: .9 }), { flat: true }); },
    glint([5, 7, '#fff6c0'], [8, 7, '#ffe070']), steam([[6, 4], [7, 3], [6, 2], [9, 4], [10, 2]])),
  /* the fish suppers: each vessel its own outline */
  perch_stew: () => layers(s => { bowl(s, rp('#9a5634'), rp('#b8a040')); for (const [x, y, c] of [[5, 9, '#fbf6e8'], [6, 9, '#fbf6e8'], [10, 9, '#fbf6e8'], [8, 8, '#d8a050'], [9, 8, '#d8a050']]) s.fix(x, y, c); },
    s => { const t = rp('#a8b45a'); s.poly([[1, 4], [4, 6.4], [2.6, 8], [0.4, 7]], t); s.fix(2, 6, '#3a4218'); }, steam([[8, 4], [9, 3], [8, 2], [11, 5], [12, 3]])),
  puffer_broth: () => layers(s => { bowl(s, rp('#e8e0cc'), rp('#8ab05a'), { band: '#4a7ab8' }); },
    s => { const p = rp('#c8b060'); s.ell(8, 8.6, 1.8, 1.4, p); for (const [x, y] of [[6, 8], [10, 8], [8, 7]]) s.fix(x, y, '#e8e0a0'); s.ell(11, 9.4, 1, .8, rp('#e0c070')); s.fix(5, 9, '#f0d880'); }, steam([[5, 5], [6, 4], [5, 3], [10, 5], [11, 4]])),
  bream_greens: () => layers(s => plate(s), s => { const g = rp('#5aa84a'); s.ell(3.4, 11.6, 2, 1.4, g); s.ell(12.6, 12, 2, 1.2, g); }, s => { const T = { k: .74, dx: 0, dy: -2 }, c = drawFish(s, 'bream', T, true); fishMarks(s, 'bream', T, c, true); charMarks(s, T, [6.6, 9.8], 8.4, mix(c.back.lo, '#3a1a0a', .45)); }),
  flounder_supper: () => layers(s => plate(s), s => { const T = { k: .72, dx: -.6, dy: -1.6 }, c = drawFish(s, 'flounder', T, true); fishMarks(s, 'flounder', T, c, true); }, s => { const p = rp('#d8b070'); s.ell(12.6, 11.6, 1.6, 1.4, p); s.ell(3, 12, 1.4, 1.2, p); }, lemon),
  /* stargazy pie: mackerel heads looking up out of the crust */
  mackerel_pie: () => layers(s => { const h = rp('#3a8090'); for (const [x, l] of [[4.4, -.8], [8, 0], [11.6, .8]]) s.poly([[x - 1.4, 9.4], [x + l, 3], [x + 1.4, 9.4]], h); },
    s => { pieDish(s, rp('#8a8f98'), rp('#d89a4e'), { cy: 10 }); for (const [x, y] of [[4, 10], [7, 11], [10, 10], [12, 11]]) s.fix(x, y, '#a86a2e'); },
    glint([4, 5, '#fffaf0'], [8, 5, '#fffaf0'], [12, 5, '#fffaf0'], [4, 6, '#1e1418'], [8, 6, '#1e1418'], [12, 6, '#1e1418'], [3, 3, '#e8e890'], [8, 2, '#e8e890'], [12, 3, '#e8e890'])),
  /* a pale pie in a blue dish, a fish cut into the crust */
  ghostfin_supper: () => layers(s => { pieDish(s, rp('#4a6aa8'), rp('#e4dcf0')); s.ell(8.4, 8.8, 2.6, 1.2, rp('#b8b0d8'), { flat: true }); s.poly([[5, 8.8], [3.6, 7.6], [3.6, 10]], rp('#b8b0d8')); },
    glint([10, 8, '#6ad0ff'], [4, 8, '#ffffff'], [12, 7, '#ffffff'])),
  /* an iron pot of pumpkin stew, a catfish tail and whiskers over the rim */
  catfish_pot: () => layers(s => { const t = rp('#6a6a58'); s.poly([[11, 6], [14, 2], [15, 4], [12.6, 7]], t); },
    s => { const i = rp('#5a5e66'); s.ell(8, 10.4, 6.4, 4, i); s.rect(0, 8, 2, 2, i); s.rect(14, 8, 2, 2, i); s.ell(8, 8, 6.4, 1.8, rp('#7a7e88'), { flat: true }); s.ell(8, 8.2, 5, 1.2, rp('#e8782a'), { flat: true });
      for (const [x, y] of [[5, 8], [9, 8]]) s.fix(x, y, '#f8b060'); s.fix(7, 8, '#7a7a60'); }, steam([[4, 5], [5, 4], [4, 3], [8, 5], [8, 3]])),
  /* a fish baked in a parcel of goldleaf, tied with string */
  char_goldleaf: () => layers(s => { const f = rp('#c8703a'); s.poly([[1, 11], [3.4, 8], [4, 12]], f); s.ell(13, 6.6, 2, 1.8, f); },
    s => { const l = rp('#d8c048'); s.poly([[3, 11], [6, 6], [12, 4.6], [13.4, 7.6], [10, 12.4], [4.4, 13]], l); s.line(4, 12, 12, 6, null, l.lo); for (const [x, y] of [[6, 9], [9, 7], [8, 11]]) s.fix(x, y, l.hi); s.line(7, 6, 9, 12, null, '#efe4c8'); },
    glint([13, 6, '#f4ecdc'])),
  /* two rolled wraps, greens and fish showing at the ends */
  ray_wraps: () => layers(s => { const w = rp('#e0c890'); s.poly([[1, 9], [10, 4], [12, 7], [3, 12]], w); s.ell(11, 5.6, 1.6, 1.8, rp('#6ab04a')); s.fix(11, 5, '#c8b8a0'); },
    s => { const w = rp('#d8bc80'); s.poly([[4, 13], [13, 8], [15, 11], [6, 15.4]], w); s.ell(14, 9.6, 1.6, 1.8, rp('#6ab04a')); s.fix(14, 9, '#a8b0a0'); s.line(7, 13, 12, 10, null, w.lo); }),
  /* one skewer: grayling chunks and sunbloom petals */
  grayling_sunbloom: () => layers(s => s.line(0, 15, 15, 0, rp('#c8a070')), s => { for (const [x, y, k] of [[3.6, 11.6, 0], [7, 8.6, 1], [10, 5.6, 0], [13, 2.8, 1]]) s.ell(x, y, k ? 1.8 : 2.6, k ? 1.8 : 2.2, k ? rp('#ffd23a') : rp('#c8925a')); s.fix(7, 9, '#8a5a2a'); s.fix(13, 3, '#8a5a2a'); for (const [x, y] of [[4, 12], [10, 6]]) s.fix(x - 1, y, '#6a4020'); }),
  /* two crossed skewers: storm ray and starfruit stars, a crackle of spark */
  storm_skewers: () => layers(s => { s.line(1, 14, 15, 2, rp('#c8a070')); s.line(1, 2, 15, 14, rp('#c8a070')); },
    s => { for (const [x, y] of [[4, 11.4], [12, 4.6], [4, 4.6]]) s.ell(x, y, 1.8, 1.6, rp('#8a9ab8')); for (const [x, y] of [[8, 8], [12, 11.4]]) { const st = rp('#ffe878'); s.dot(x, y, st); s.dot(x - 1, y, st); s.dot(x + 1, y, st); s.dot(x, y - 1, st); s.dot(x, y + 1, st); } },
    glint([8, 8, '#a87a20'], [12, 11, '#a87a20'], [14, 0, '#fff6a0'], [13, 1, '#fff6a0'], [14, 1, '#ffffff'])),
  /* an iron skillet: ember-roasted cinderfish and pumpkin */
  cinder_roast: () => layers(s => { const w = rp('#5a3a24'); s.line(12, 10, 15, 14, w); s.line(12, 11, 15, 15, w); },
    s => { const i = rp('#4a4650'); s.ell(7, 10, 6.6, 3.8, i); s.ell(7, 9.6, 5.2, 2.6, rp('#34303a'), { flat: true }); },
    s => { const T = { k: .7, dx: -1, dy: 1.4 }, c = drawFish(s, 'cinderfish', T, true); fishMarks(s, 'cinderfish', T, c, true); s.ell(3, 11, 1, .8, rp('#e8782a')); s.ell(11, 11, 1, .8, rp('#e8782a')); },
    glint([3, 12, '#ffb04a'], [11, 12, '#ff8a3a'], [9, 12, '#ffcf5a'])),
  /* a slab of basalt: slices of fish and crescents of moonmelon */
  basalt_melon: () => layers(s => { const b = rp('#3e3e46'); s.poly([[0.6, 9], [15.4, 8], [15.4, 13], [0.6, 14]], b); s.line(1, 9, 15, 8, null, b.hi); },
    s => { for (const [x, y] of [[4, 8.4], [7, 8]]) s.ell(x, y, 1.8, 1.6, rp('#c88a54')); for (const x of [10, 13]) { const m = rp('#a8c8f0'); s.ell(x, 9, 1.6, 2.4, m); s.fix(x, 8, '#eef4ff'); s.fix(x - 1, 10, '#3a5a8a'); } }),
  /* a packed supper: a paper parcel tied with string, a tail poking out */
  trail_ration: () => layers(s => { const t = rp('#a8a070'); s.poly([[4, 7], [0.6, 1.4], [2.6, 2.6], [3.6, 0.6], [6, 6.6]], t); },
    s => { const top = rp('#d8b884'), front = rp('#b08a58'); s.poly([[2, 6], [12, 6], [14.6, 8.6], [4.6, 8.6]], top); s.rect(2, 9, 13, 5, front); s.poly([[2, 6], [4.6, 8.6], [4.6, 13.4], [2, 11]], rp('#9a7448'));
      s.line(8, 6, 10, 8, null, '#efe4c8'); s.line(3, 7, 14, 7.6, null, '#efe4c8'); s.line(10, 9, 10, 13, null, '#efe4c8'); s.line(5, 11, 14, 11, null, '#efe4c8'); s.fix(10, 11, '#d8483c'); })
};

/* ---------- potions: glass, the liquid inside, a cork; each bottle its own shape ---------- */
const GLASS = rp('#c8dce6', { gl: .9 }), CORK = rp('#b08050');
function liquidIn(s, test, liq, level) { for (let y = level; y < 16; y++) for (let x = 0; x < 16; x++) { const p = s.at(x, y); if (p && p.r === GLASS && test(x, y)) s.tone(x, y, liq, p.lv == null ? 2 : Math.max(1, Math.min(4, p.lv))); } for (let x = 0; x < 16; x++) { const p = s.at(x, level); if (p && p.r === liq) s.tone(x, level, liq, 3); } }
const BOTTLE = {
  potion_heal: { col: '#d83038', draw: s => { s.ell(8, 10.4, 5, 4.6, GLASS); s.rect(7, 3, 3, 3, GLASS); s.rect(6, 5, 5, 1, GLASS); s.rect(7, 1, 3, 2, CORK); }, level: 8, spark: [[5, 8], [6, 7]] },
  potion_haste: { col: '#3ab8f0', draw: s => { s.rect(6, 3, 5, 12, GLASS); s.ell(8.4, 14, 2.4, 1, GLASS); s.rect(5, 3, 7, 1, GLASS); s.rect(6, 1, 5, 2, CORK); }, level: 6, spark: [[7, 5], [7, 6]], bub: [[8, 9], [9, 12], [7, 11]] },
  potion_might: { col: '#f0742a', draw: s => { s.rect(3, 6, 10, 9, GLASS); s.poly([[3, 6], [6, 3.6], [10, 3.6], [13, 6]], GLASS); s.rect(6, 1, 4, 3, rp('#b83a2a')); s.rect(3, 10, 10, 2, rp('#efe4c8')); }, level: 7, spark: [[4, 7], [4, 8]], seal: true },
  potion_fortune: { col: '#3ab870', draw: s => { s.ell(8, 11, 5, 3.8, GLASS); s.ell(8, 5.6, 2.8, 2.4, GLASS); s.rect(7, 1, 3, 2, rp('#e6b84a', { gl: .8 })); }, level: 6, spark: [[6, 5], [5, 10]], gold: [[2, 3], [13, 4], [14, 9], [1, 8]] },
  potion_scholar: { col: '#a858f0', draw: s => { s.poly([[6, 3], [10, 3], [10, 6], [14, 14.4], [2, 14.4], [6, 6]], GLASS); s.rect(6, 1, 4, 2, CORK); }, level: 9, spark: [[6, 7], [5, 10]], bub: [[8, 11], [10, 12], [7, 13]], star: [12, 4] },
  calming_draught: { col: '#9ccaa8', draw: s => { s.ell(8, 10, 6, 4.6, GLASS); s.rect(7, 3, 3, 3, GLASS); s.rect(7, 1, 3, 2, CORK); }, level: 8, spark: [[4, 7], [3, 9]], leaf: true },
  field_ward: { col: '#9a98e8', draw: s => { s.poly([[3, 5], [13, 5], [13, 10], [8, 15], [3, 10]], GLASS); s.rect(7, 2, 3, 3, GLASS); s.rect(7, 0, 3, 2, CORK); }, level: 7, spark: [[4, 6], [4, 7]], crystal: true }
};
function potion(id) {
  const b = BOTTLE[id], liq = rp(b.col, { gl: .85 });
  return layers(s => { b.draw(s); liquidIn(s, () => true, liq, b.level); if (b.leaf) { const g = rp('#5aa84a'); s.dot(7, 11, g); s.dot(8, 10, g); s.dot(9, 11, g); s.dot(8, 12, g); } if (b.crystal) { const q = rp('#f4f8ff', { gl: .95 }); s.poly([[8, 7.4], [9.6, 10], [8, 13], [6.4, 10]], q); } if (b.seal) { s.fix(9, 4, '#d84a3a'); s.fix(9, 5, '#b83a2a'); } },
    glint(...b.spark.map(([x, y]) => [x, y, '#ffffff']), ...(b.bub || []).map(([x, y]) => [x, y, mix(b.col, '#ffffff', .6)]), ...(b.gold || []).map(([x, y]) => [x, y, '#ffe070']), ...(b.star ? [[b.star[0], b.star[1], '#fff6c0'], [b.star[0] + 1, b.star[1] + 1, '#e8d0ff'], [b.star[0] - 1, b.star[1] + 1, '#e8d0ff'], [b.star[0], b.star[1] + 2, '#e8d0ff']] : [])));
}
/* the two blends: a woven reed basket of bait balls, and a stoppered crock of trail scent with a paw on it */
DISH.reed_bait = () => layers(s => { for (const [x, y] of [[5, 7], [8, 6], [11, 7], [7, 8.4], [10, 8.6]]) s.ell(x, y, 1.6, 1.4, rp('#9a6a3a')); },
  s => { const w = rp('#8aa45a'); s.poly([[1.6, 8.4], [14.4, 8.4], [12.6, 14.4], [3.4, 14.4]], w); for (let y = 10; y <= 13; y += 2) s.line(3, y, 13, y, null, w.lo); for (const x of [5, 8, 11]) s.line(x, 9, x, 14, null, w.hi); s.line(2, 8, 14, 8, null, '#c8b878'); s.line(12, 8, 15, 2, rp('#6a8a3a')); });
DISH.trap_blend = () => layers(s => { const c = rp('#b8a06a'); s.ell(8, 10.4, 5, 4.4, c); s.rect(6, 4, 5, 3, c); s.rect(6, 2, 5, 2, CORK); s.ell(8, 10.6, 1.4, 1.2, rp('#6a4a30'));
  for (const [x, y] of [[6, 8], [8, 7.4], [10, 8]]) s.fix(x, y, '#6a4a30'); }, glint([5, 8, '#f0e4c0']), { f: s => { for (const [x, y] of [[12, 3], [13, 2], [12, 1], [13, 0]]) s.fix(x, y, '#9ab870'); }, outline: false });

/* ---------- seeds: a paper packet with the crop printed on it, a few real seeds spilled beside it ---------- */
const PACKET = rp('#d8c49a');
const SEED = {
  potato: { band: '#b88a50', pic: s => { s.ell(7.6, 8, 2.4, 1.8, rp('#c09058')); s.fix(7, 8, '#6a4a2a'); }, seeds: s => { s.ell(13, 13, 1.6, 1.4, rp('#c09058')); s.fix(13, 11, '#7ac04a'); } },
  onion: { band: '#d8a048', pic: s => { s.ell(7.6, 8.6, 2, 1.8, rp('#e0a848')); s.line(7, 6, 7, 5, rp('#6ab04a')); }, seeds: s => { for (const [x, y] of [[12, 13], [14, 14], [13, 15]]) s.fix(x, y, '#2a2224'); } },
  cabbage: { band: '#6ab04a', pic: s => { s.ell(7.6, 8, 2.4, 2.2, rp('#8ac860')); s.fix(7, 8, '#5a9a40'); }, seeds: s => { for (const [x, y] of [[12, 13], [14, 13], [13, 15]]) s.fix(x, y, '#5a3a3a'); } },
  wheat: { band: '#e0b850', pic: s => { const w = rp('#e8c860'); s.line(7, 10, 7, 6, rp('#b89a40')); s.dot(6, 6, w); s.dot(8, 6, w); s.dot(6, 7, w); s.dot(8, 7, w); s.dot(7, 5, w); }, seeds: s => { for (const [x, y] of [[12, 13], [14, 14]]) { s.dot(x, y, rp('#e0b860')); s.dot(x + 1, y, rp('#e0b860')); } } },
  strawberry: { band: '#e8506a', pic: s => { const r = rp('#e03a50'); s.ell(7.6, 8.4, 2, 1.6, r); s.dot(7, 10, r); s.fix(7, 6, '#5aa84a'); s.fix(8, 6, '#5aa84a'); s.fix(8, 8, '#f8e080'); }, seeds: s => { for (const [x, y] of [[12, 14], [14, 13], [13, 15]]) s.fix(x, y, '#f0d050'); } },
  pumpkin: { band: '#ef8a3a', pic: s => { s.ell(7.6, 8.4, 2.6, 1.8, rp('#ef8a3a')); s.fix(7, 6, '#6a8a3a'); s.fix(7, 8, '#c86a28'); }, seeds: s => { s.ell(13, 13.4, 1.4, .9, rp('#f4ecd4')); s.dot(14, 15, rp('#f4ecd4')); } },
  goldleaf: { band: '#e8d050', pic: s => { const g = rp('#e8d050', { gl: .8 }); s.poly([[7.6, 10], [5.6, 7], [7.6, 5], [9.6, 7]], g); s.fix(7, 7, '#fff6c0'); }, seeds: s => { for (const [x, y] of [[12, 13], [14, 14], [13, 15]]) s.fix(x, y, '#c8a030'); } },
  sunbloom: { band: '#ffd84a', pic: s => { const p = rp('#ffd84a'); for (let i = 0; i < 6; i++) { const a = i * Math.PI / 3; s.dot(Math.round(7.6 + Math.cos(a) * 2), Math.round(8 + Math.sin(a) * 2), p); } s.dot(7, 8, rp('#7a4a2a')); s.dot(8, 8, rp('#7a4a2a')); }, seeds: s => { for (const [x, y] of [[12, 13], [14, 14]]) { s.dot(x, y, rp('#3a3430')); s.dot(x, y + 1, rp('#3a3430')); s.fix(x, y, '#e8e0d0'); } } },
  moonmelon: { band: '#a8c8ff', pic: s => { s.ell(7.6, 8.4, 2.6, 2, rp('#a8c8f0')); s.fix(7, 7, '#eef4ff'); s.fix(9, 9, '#5a7ab0'); }, seeds: s => { for (const [x, y] of [[12, 13], [14, 14]]) { s.dot(x, y, rp('#c8dcf8')); s.dot(x + 1, y, rp('#c8dcf8')); } } },
  starfruit: { band: '#f0e070', pic: s => { const st = rp('#fff0a0', { gl: .9 }); s.dot(7, 6, st); for (let x = 5; x <= 9; x++) s.dot(x, 8, st); s.dot(7, 7, st); s.dot(6, 9, st); s.dot(8, 9, st); s.dot(6, 10, st); s.dot(8, 10, st); }, seeds: s => { for (const [x, y] of [[12, 13], [14, 14], [13, 15]]) s.fix(x, y, '#7a5030'); } }
};
const seedPacket = c => { const d = SEED[c]; return layers(s => { s.rect(2, 3, 11, 12, PACKET); s.rect(2, 1, 11, 2, rp('#c4ae80')); for (let x = 2; x <= 12; x += 2) s.erase(x, 1); s.rect(2, 11, 11, 2, rp(d.band)); s.rect(4, 5, 7, 6, rp('#f2e8d0')); },
  s => d.pic(s), s => d.seeds(s)); };

/* ---------- crops ---------- */
const CROP = {
  potato: () => layers(s => s.ell(11, 7.6, 3.4, 2.8, rp('#b0804a')), s => { const p = rp('#c49458'); s.ell(7, 10, 5.4, 4.2, p); for (const [x, y] of [[5, 9], [9, 11], [7, 12], [10, 8]]) s.fix(x, y, p.lo); }, glint([4, 8, '#f0d8a8'], [10, 5, '#e0c090'])),
  onion: () => layers(s => { const g = rp('#6ab04a'); s.line(8, 6, 7, 1, g); s.line(9, 6, 11, 1, g); },
    s => { const o = rp('#d89a44'); s.ell(8, 10, 5, 4.4, o); s.poly([[6.4, 6.6], [8, 4], [9.6, 6.6]], o); s.line(6, 8, 5, 12, null, o.lo); s.line(10, 8, 11, 12, null, o.lo); for (const x of [6, 8, 10]) s.fix(x, 15, '#efe4c8'); }, glint([5, 8, '#fff0c0'])),
  cabbage: () => layers(s => { const d = rp('#4e9a40'); s.ell(3, 11, 2.6, 2.6, d); s.ell(13, 11, 2.6, 2.6, d); s.ell(8, 13, 4, 1.8, d); },
    s => { const c = rp('#8ac860'); s.ell(8, 8.6, 5.2, 5, c); s.line(8, 5, 8, 12, null, c.hi); s.line(5, 7, 8, 11, null, c.lo); s.line(11, 7, 8, 11, null, c.lo); }, glint([5, 5, '#e0f8c0'])),
  wheat: () => layers(s => { const st = rp('#c8a848'); for (const x of [5, 7, 9, 11]) s.line(x, 15, 8 + (x - 8) * .3, 6, st); },
    s => { const w = rp('#ecc85a'); for (const [x, y] of [[4, 4], [7, 2], [10, 3], [12, 5]]) { s.ell(x, y + 1.6, 1.2, 2.4, w); s.fix(x, y - 1, '#f8e8a0'); } s.rect(6, 10, 5, 2, rp('#8a5a32')); }),
  strawberry: () => layers(s => { const r = rp('#e0304a'); s.ell(8, 8.6, 5, 4, r); s.poly([[3.4, 9], [12.6, 9], [8, 15]], r); for (const [x, y] of [[6, 8], [9, 7], [11, 9], [7, 11], [9, 12], [5, 10], [10, 10]]) s.fix(x, y, '#f8e080'); },
    s => { const g = rp('#4e9a40'); s.poly([[4, 5], [8, 3], [12, 5], [8, 6.4]], g); s.line(8, 3, 9, 0, g); }, glint([5, 7, '#ffd8e0'])),
  pumpkin: () => layers(s => { const p = rp('#ec8030'); s.ell(8, 10, 7, 4.8, p); for (const x of [5, 8, 11]) s.line(x, 6.4, x + (x - 8) * .2, 14, null, p.lo); },
    s => { s.rect(7, 3, 2, 3, rp('#6a7a34')); s.line(9, 4, 12, 2, null, '#5a9a40'); s.ell(4, 4, 2, 1.4, rp('#4e9a40')); }, glint([3, 8, '#ffd0a0'])),
  goldleaf: () => layers(s => { const st = rp('#8a7a3a'); s.line(8, 15, 5, 7, st); s.line(8, 15, 8, 5, st); s.line(8, 15, 11, 7, st); },
    s => { const g = rp('#e8cc40', { gl: .85 }); for (const [x, y, a] of [[4, 5, -1], [8, 3, 0], [12, 5, 1], [5.6, 9, -1], [10.4, 9, 1]]) s.poly([[x, y + 2.6], [x - 1.8 + a * .4, y], [x + a * .6, y - 2.4], [x + 1.8 + a * .4, y]], g); s.rect(6, 12, 4, 1, rp('#b84a3a')); }, glint([8, 1, '#ffffff'], [4, 4, '#fff6c0'])),
  sunbloom: () => layers(s => { const g = rp('#4e9a40'); s.line(8, 11, 9, 15, g); s.ell(11.6, 13, 2, 1.2, g); },
    s => { const p = rp('#ffd23a'); for (let i = 0; i < 12; i++) { const a = i * Math.PI / 6; s.ell(8 + Math.cos(a) * 4.6, 6.6 + Math.sin(a) * 4.4, 1.4, 1.4, p); } s.ell(8, 6.6, 3.2, 3, rp('#7a4a24')); for (const [x, y] of [[7, 6], [9, 7], [8, 5], [7, 8]]) s.fix(x, y, '#4a2a14'); }),
  moonmelon: () => layers(s => { const m = rp('#a4c4ec'); s.ell(8, 9.6, 6.6, 5, m); for (const [x, y] of [[5, 7], [10, 11]]) { s.fix(x, y, '#e8f0ff'); s.fix(x + 1, y, '#e8f0ff'); s.fix(x + 1, y + 1, m.lo); } s.line(4, 11, 7, 13, null, m.lo); s.line(10, 6, 13, 8, null, m.lo); },
    s => { s.rect(7, 3, 2, 2, rp('#5a8a6a')); s.line(9, 3, 11, 2, null, '#6aa07a'); }),
  starfruit: () => layers(s => { const f = rp('#d8d050'); s.poly([[1.6, 7], [4, 3.6], [9, 2.6], [11.4, 4.4], [9, 8], [4, 8.6]], f); s.line(3, 6, 10, 4, null, f.lo); s.line(3, 7.6, 9, 6.6, null, f.hi); s.fix(12, 4, '#7a6a2a'); },
    s => { const st = rp('#fff0a0', { gl: .9 }), pts = []; for (let i = 0; i < 10; i++) { const r = i % 2 ? 2 : 4.6, a = -Math.PI / 2 + i * Math.PI / 5; pts.push([10 + Math.cos(a) * r, 11 + Math.sin(a) * r]); } s.poly(pts, st); s.fix(10, 11, '#c8a040'); s.fix(10, 10, '#ffffff'); })
};

/* ---------- farm produce ---------- */
const PRODUCE = {
  egg: () => layers(s => s.ell(8, 9, 4.4, 5.6, rp('#ead2aa')), glint([6, 5, '#fffaf0'], [6, 6, '#fff4e0'], [10, 10, '#c8a078'], [8, 12, '#c8a078'])),
  milk: () => layers(s => { const g = rp('#f4f2ec'); s.rect(4, 6, 8, 9, g); s.poly([[4, 6], [6, 3], [10, 3], [12, 6]], g); s.rect(6, 1, 4, 2, rp('#4a86c8')); s.rect(4, 9, 8, 3, rp('#4a86c8')); s.fix(6, 10, '#ffffff'); }, glint([5, 7, '#ffffff'], [5, 8, '#ffffff'])),
  wool: () => layers(s => { const w = rp('#ece2cc'); s.ell(7.6, 8.4, 5.6, 5.4, w); }, { f: s => { const l = '#c8b898'; for (const [a, b, c, d] of [[3, 7, 9, 3], [3, 10, 12, 4], [5, 13, 13, 7], [9, 13, 12, 10]]) s.line(a, b, c, d, null, l); s.line(12, 12, 15, 15, null, '#ece2cc'); s.fix(15, 14, '#ece2cc'); }, outline: false }),
  truffle: () => layers(s => { const t = rp('#5a3a28'); s.ell(8, 9, 5, 4.6, t); for (const [x, y] of [[4, 6], [12, 7], [6, 13], [11, 12], [8, 4.6]]) s.ell(x, y, 1.6, 1.4, t); for (const [x, y] of [[6, 8], [9, 10], [10, 7], [7, 11]]) s.fix(x, y, t.lo); }, glint([6, 6, '#b8906a'])),
  cheese: () => layers(s => { const r = rp('#e4dcc4'); s.rect(1, 5, 10, 7, r); for (const [x, y] of [[3, 6], [6, 7], [4, 10], [8, 9]]) s.fix(x, y, '#b0ac9c'); },
    s => { const c = rp('#f8f2dc'); s.ell(11, 8.4, 2.4, 3.6, c, { flat: true }); },
    s => { const c = rp('#f8f2dc'); s.ell(10, 13.4, 3.4, 1.6, c, { flat: true }); s.fix(9, 13, '#fffdf4'); }, glint([2, 5, '#fffaf0'])),
  honey: () => layers(s => { const h = rp('#e8a020', { gl: .8 }); s.ell(8, 10.6, 5, 4.4, h); s.rect(5, 5, 6, 2, h); s.poly([[3.4, 4], [12.6, 4], [11.6, 6.4], [4.4, 6.4]], rp('#d8c49a')); s.line(4, 6, 12, 6, null, '#c8483c'); },
    glint([5, 9, '#fff2a0'], [5, 10, '#ffe080'], [11, 7, '#f0b030'], [11, 8, '#e8a020']))
};

/* ---------- farm plots: soil, then a sprout, the young plant and the ripe crop, each crop its own plant ---------- */
const SOIL = rp('#6e4e34'), LEAF = rp('#5ea844'), LEAF_D = rp('#3f8a3a');
const soil = s => { s.ell(8, 13.6, 7, 2.2, SOIL); };
const sprout = (s, c) => { if (c === 'onion' || c === 'wheat') { s.line(7, 12, 6, 9, LEAF); s.line(9, 12, 10, 8, LEAF); return; } s.line(8, 12, 8, 9, LEAF); s.ell(6.4, 8.6, 1.4, 1, LEAF); s.ell(9.6, 8.6, 1.4, 1, LEAF); };
const YOUNG = {
  potato: s => { for (const [x, y] of [[5, 8], [8, 6], [11, 8], [7, 10], [10, 10]]) s.ell(x, y, 2, 1.6, LEAF); },
  onion: s => { for (const [x, t] of [[6, 5], [8, 3], [10, 5], [7, 6]]) s.line(x, 12, x + (x - 8) * .3, t, LEAF); },
  cabbage: s => { s.ell(8, 10, 4.4, 2.4, LEAF_D); s.ell(8, 9.4, 2.6, 1.8, LEAF); },
  wheat: s => { for (const x of [5, 7, 9, 11]) s.line(x, 12, x + (x - 8) * .4, 4, LEAF); },
  strawberry: s => { for (const [x, y] of [[5, 9], [8, 8], [11, 9]]) s.ell(x, y, 1.8, 1.6, LEAF); s.fix(8, 11, '#ffffff'); s.fix(8, 10, '#f0d050'); },
  pumpkin: s => { s.line(2, 12, 14, 11, LEAF_D); for (const [x, y] of [[5, 9], [11, 8]]) s.ell(x, y, 2.4, 2, LEAF); s.fix(8, 10, '#f0c040'); },
  goldleaf: s => { for (const [x, y] of [[6, 7], [10, 7], [8, 5]]) { s.line(8, 12, x, y, LEAF_D); s.ell(x, y, 1.4, 1.2, LEAF); } },
  sunbloom: s => { s.line(8, 12, 8, 3, LEAF_D); s.ell(6, 8, 1.6, 1, LEAF); s.ell(10, 6, 1.6, 1, LEAF); s.ell(8, 2.6, 1.4, 1.4, rp('#8ab048')); },
  moonmelon: s => { s.line(2, 12, 14, 11, LEAF_D); for (const [x, y] of [[4, 9], [8, 8], [12, 9]]) s.ell(x, y, 1.8, 1.6, LEAF); s.fix(10, 10, '#e8f0ff'); },
  starfruit: s => { s.line(8, 12, 8, 5, rp('#7a5a3a')); s.ell(8, 5, 3.6, 2.6, LEAF); }
};
const RIPE = {
  potato: s => { for (const [x, y] of [[4, 7], [8, 5], [12, 7], [6, 9], [10, 9]]) s.ell(x, y, 2.2, 1.8, LEAF); s.fix(8, 4, '#f0f0f8'); s.ell(4, 12.6, 1.8, 1.2, rp('#c49458')); s.ell(12, 12.6, 1.8, 1.2, rp('#c49458')); },
  onion: s => { for (const [x, y] of [[5, 3], [9, 2], [12, 5]]) s.line(8, 10, x, y, LEAF); s.ell(8, 11.6, 3, 2.2, rp('#d89a44')); },
  cabbage: s => { s.ell(4, 11, 2.4, 2, LEAF_D); s.ell(12, 11, 2.4, 2, LEAF_D); s.ell(8, 9.4, 4.4, 3.8, rp('#8ac860')); s.line(8, 6, 8, 12, null, '#b8e890'); },
  wheat: s => { for (const x of [4, 6.6, 9.4, 12]) { s.line(Math.round(x), 12, Math.round(x), 5, rp('#c8a848')); s.ell(x, 3.4, 1.1, 2.2, rp('#ecc85a')); } },
  strawberry: s => { for (const [x, y] of [[4, 8], [8, 6], [12, 8]]) s.ell(x, y, 2, 1.8, LEAF); for (const [x, y] of [[5, 11], [10, 11], [8, 9]]) s.ell(x, y, 1.4, 1.4, rp('#e0304a')); },
  pumpkin: s => { s.ell(3, 7, 2.4, 2, LEAF); s.ell(13, 6, 2.2, 2, LEAF); s.ell(8, 10, 5, 3.4, rp('#ec8030')); s.rect(7, 5, 2, 2, rp('#6a7a34')); s.line(6, 8, 6, 12, null, '#c8601e'); s.line(10, 8, 10, 12, null, '#c8601e'); },
  goldleaf: s => { for (const [x, y] of [[5, 6], [8, 3], [11, 6], [6, 9], [10, 9]]) { s.line(8, 12, x, y, rp('#8a7a3a')); s.ell(x, y, 1.6, 1.4, rp('#e8cc40', { gl: .85 })); } },
  sunbloom: s => { s.line(8, 12, 8, 6, LEAF_D); s.ell(5.6, 9, 1.6, 1, LEAF); for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4; s.dot(Math.round(8 + Math.cos(a) * 3), Math.round(4 + Math.sin(a) * 3), rp('#ffd23a')); } s.ell(8, 4, 1.6, 1.6, rp('#7a4a24')); },
  moonmelon: s => { s.line(1, 11, 15, 10, LEAF_D); s.ell(3, 8, 1.8, 1.6, LEAF); s.ell(13, 7, 1.8, 1.6, LEAF); s.ell(8, 10, 4.6, 3.2, rp('#a4c4ec')); s.fix(6, 9, '#eef4ff'); s.fix(10, 11, '#6a8ac0'); },
  starfruit: s => { s.line(8, 12, 8, 6, rp('#7a5a3a')); s.ell(8, 5, 5.4, 3.6, LEAF); for (const [x, y] of [[5, 6], [10, 4], [11, 7]]) { const st = rp('#fff0a0'); s.dot(x, y, st); s.dot(x + 1, y, st); s.dot(x, y + 1, st); } }
};
function plantStage(stage, crop) {
  if (stage <= 0 || !crop || !YOUNG[crop]) return layers(s => { soil(s); }, glint([5, 13, '#4a3222'], [8, 12, '#4a3222'], [11, 13, '#4a3222']));
  if (stage === 1) return layers(soil, s => sprout(s, crop));
  if (stage === 2) return layers(soil, YOUNG[crop]);
  return layers(soil, RIPE[crop]);
}

/* ---------- dispatch ---------- */
function mine(id) {
  const it = D.ITEMS[id]; if (!it) return null;
  if (id.startsWith('raw_') && SPECIES[id.slice(4)]) return rawFish(id.slice(4));
  if (id === 'raw_shrimp' || id === 'raw_lobster') return rawShell(id.slice(4));
  if (it.type === 'food' && SPECIES[id]) return cookedFish(id);
  if (id === 'shrimp' || id === 'lobster') return cookedShell(id);
  if (id === 'burnt') return burnt();
  if (DISH[id]) return DISH[id]();
  if (BOTTLE[id]) return potion(id);
  if (id.startsWith('seed_') && SEED[id.slice(5)]) return seedPacket(id.slice(5));
  if (id.startsWith('crop_') && CROP[id.slice(5)]) return CROP[id.slice(5)]();
  if (PRODUCE[id]) return PRODUCE[id]();
  return null;
}
const base = A.itemSprite;
A.itemSprite = id => mine(id) || base(id);
A.itemUrl = id => A.url('item:' + id, () => A.itemSprite(id));
const plant0 = A.plantStage;
A.plantStage = (stage, crop) => (crop && !YOUNG[crop] ? null : plantStage(stage, crop)) || plant0(stage, crop);
A.plantUrl = (stage, crop) => A.url('plant:' + stage + ':' + crop, () => A.plantStage(stage, crop));
})();
