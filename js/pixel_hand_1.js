/* Idlewick pixel art: hand-designed creatures, batch 1 (owner, 28 Nov 2026: "Have a deeper think about a lot of the
   creatures, some of them still look quite simplistic - the bosses and mini bosses look REALLY good - could we put this
   same amount of effort into the thoughts of every creature, monster, beast and character in the game?").
   Every ordinary creature whose home is Willowbrook or Mossbarrow is drawn here by hand at 32 x 32 with the bosses'
   painter (A.BossPainter, js/pixel_bosses.js): materials as five-step ramps (cool shadows, warm lights), sphere-lit
   masses, tubes lit as cylinders, edge light on flat shapes, the selective outline, then the face on top. Each one has
   its own silhouette, body language, material, a face with an expression and one signature detail, in both views:
   front (menus, cards, the field guide) and side, facing right (the fight stage mirrors it to face the hero; hunting and
   capture scenes). Feet stand on row 29 with the outline below, like every other creature on the stage.
   Loaded after pixel_views.js and before pixel_runtime.js: these drawings replace the builder views in A.VIEWS.
   The kit (A.HAND) is shared with later batches. Everything is original and drawn in code. */
(() => {
const Q = window.DQ, A = Q && Q.pixelArt; if (!A || !A.BossPainter || !A.VIEWS) return;
const P = A.BossPainter;

/* ================= the kit ================= */
const pane = () => new P(32, 32);
/* a material from one base colour, on the house ramp (dark bases get brighter lights; pixelart.js ramp) */
const mat = (s, base, o = {}) => { const r = A.ramp(base, o); return s.mat([o.out || r.out, r.lo, r.base, r.hi, r.gl]); };
/* a limb, neck or tail along a polyline, tapering from r0 to r1 and lit as a cylinder (pixel_bosses.js tube) */
const tube = (s, pts, r0, r1, m, o = {}) => { const seg = []; let L = 0; for (let i = 1; i < pts.length; i++) { const [ax, ay] = pts[i - 1], [bx, by] = pts[i], l = Math.hypot(bx - ax, by - ay) || 1; seg.push([ax, ay, bx, by, l, L]); L += l; }
  const R = Math.max(r0, r1), xs = pts.map(p => p[0]), ys = pts.map(p => p[1]);
  for (let y = Math.floor(Math.min(...ys) - R); y <= Math.ceil(Math.max(...ys) + R); y++) for (let x = Math.floor(Math.min(...xs) - R); x <= Math.ceil(Math.max(...xs) + R); x++) { const px = x + .5, py = y + .5; let best = null;
    for (const [ax, ay, bx, by, l, l0] of seg) { const t = Math.max(0, Math.min(1, ((px - ax) * (bx - ax) + (py - ay) * (by - ay)) / (l * l))), cx = ax + (bx - ax) * t, cy = ay + (by - ay) * t, d = Math.hypot(px - cx, py - cy), r = r0 + (r1 - r0) * (l0 + t * l) / L;
      if (d <= r && (!best || d / r < best[0])) best = [d / r, (px - cx) / r, (py - cy) / r]; }
    if (best) s.set(x, y, m, o.flat != null ? o.flat : A.sphere(best[1], best[2])); } };
/* change the light steps of one material by a rule: f(x, y, step) returns the new step or null */
const grain = (s, m, f) => { for (let y = 0; y < s.h; y++) for (let x = 0; x < s.w; x++) if (s.get(x, y) === m) { const i = y * s.w + x, v = f(x, y, s.l[i]); if (v != null) s.l[i] = v; } };
/* fixed colours, not outlined (glows, sparks, whiskers, silk) */
const glint = (s, pts, c) => { for (const [x, y] of pts) s.fix(x, y, c); };
/* pixels of one material at one step */
const dots = (s, pts, m, l = 2) => { for (const [x, y] of pts) s.set(x, y, m, l); };
/* a polygon with edge light (lit to the top left, shaded to the bottom right) */
const slab = (s, pts, m) => { s.poly(pts, m); s.edges(m); };
/* eyes, drawn last: 'dot' a dark eye under a catch-light, 'glow' a coloured eye with a bright core, 'shut' a lid line */
const eye = (s, x, y, o = {}) => { const k = o.kind || 'dot';
  if (k === 'glow') { s.fix(x, y, A.mix(o.col || '#ffd84a', '#ffffff', .55)); s.fix(x, y + 1, o.col || '#ffd84a'); if (o.wide) { s.fix(x + 1, y, o.col || '#ffd84a'); s.fix(x + 1, y + 1, A.mix(o.col || '#ffd84a', '#3a1a10', .4)); } return; }
  if (k === 'shut') { s.fix(x, y + 1, o.lid || '#2a1c1f'); if (o.wide) s.fix(x + 1, y + 1, o.lid || '#2a1c1f'); return; }
  if (k === 'big') { s.fix(x, y, '#ffffff'); s.fix(x + 1, y, o.white || '#f4efe4'); s.fix(x, y + 1, o.white || '#f4efe4'); s.fix(x + 1, y + 1, o.ink || '#2a1c1f'); return; }
  s.fix(x, y, o.light || '#ffffff'); s.fix(x, y + 1, o.ink || '#2a1c1f'); };
/* light every pixel of a material as one sphere about (cx, cy) with radii (rx, ry): a body built from several ellipses
   and tubes then reads as one volume instead of a pile of pillows. Pixels outside the ellipse take its edge light. */
const relight = (s, m, cx, cy, rx, ry, o = {}) => grain(s, m, (x, y, l) => { if (l === 0) return null; let nx = (x + .5 - cx) / rx, ny = (y + .5 - cy) / ry; const d = Math.hypot(nx, ny); if (d > .97) { nx *= .97 / d; ny *= .97 / d; }
  let v = A.sphere(nx, ny); if (o.max) v = Math.min(v, o.max); if (o.min) v = Math.max(v, o.min); return v; });
/* crisp edge light: pixels of a material open to the top or left (to empty space) step up to light */
const rim = (s, m, lv = 3) => grain(s, m, (x, y, l) => (l > 0 && (s.get(x, y - 1) == null || s.get(x - 1, y) == null) ? Math.max(l, lv) : null));
/* hand-placed rows: each character maps to [material, step], a fixed '#colour', or '_' to erase; '.' and ' ' skip */
const grid = (s, ox, oy, rows, map) => rows.forEach((row, j) => [...row].forEach((ch, i) => { if (ch === '.' || ch === ' ') return; const x = ox + i, y = oy + j; if (ch === '_') { s.set(x, y, null); return; }
  const v = map[ch]; if (v == null) return; if (typeof v === 'string') s.fix(x, y, v); else s.set(x, y, v[0], v[1] == null ? 2 : v[1]); }));
/* a contact shadow: pixels of the back material touching the front one sink to step lv (1 shadow, 0 a drawn line), so
   a near leg, a head or an arm separates from the body behind it even in the same colour */
const contact = (s, front, back, lv = 1) => { const f = Array.isArray(front) ? front : [front], hit = []; for (let y = 0; y < s.h; y++) for (let x = 0; x < s.w; x++) { if (s.get(x, y) !== back || s.l[y * s.w + x] === 0) continue;
  if ([[0, -1], [1, 0], [0, 1], [-1, 0]].some(([a, b]) => f.includes(s.get(x + a, y + b)))) hit.push(y * s.w + x); } for (const i of hit) s.l[i] = Math.min(s.l[i], lv); };
/* repaint some pixels of one material in another, keeping their light (stripes, patches, spots): f(x, y) */
const swap = (s, m, m2, f) => { for (let y = 0; y < s.h; y++) for (let x = 0; x < s.w; x++) if (s.get(x, y) === m && s.l[y * s.w + x] > 0 && f(x, y)) s.m[y * s.w + x] = m2; };
/* register a creature's two views (o.flies: it hovers, so its feet need not reach the ground line) */
const own = (id, front, side, o = {}) => { for (const f of [front, side]) { f.hand = true; if (o.flies) f.flies = true; } A.VIEWS.front[id] = front; A.VIEWS.side[id] = side; };
A.HAND = { pane, mat, tube, grain, glint, dots, slab, eye, relight, rim, grid, contact, swap, own };

/* ================= Giant rat (Willowbrook, Lv 3): grew large on mill grain; never stops chewing ================= */
/* a hunched grey-brown rat, flour on its back, a bitten ear, orange incisors and a long ringed pink tail; signature:
   its nibbled wedge of cheese (the Great Cheese Spill), held up to its teeth from the front, kept under a paw side-on */
const ratMats = s => ({ fur: mat(s, '#8a7e72', { lo: .4 }), head: mat(s, '#8a7e72', { lo: .4 }), furD: mat(s, '#5e544c'), belly: mat(s, '#c2b5a2'), pink: mat(s, '#d8968a'), pinkD: mat(s, '#a86a64'),
  cheese: mat(s, '#f2c94a', { hi: .42, gl: .7 }), rind: mat(s, '#d8902a') });
const RAT_TOOTH = ['#f8d070', '#c8862a'];
const ratFront = () => { const s = pane(), m = ratMats(s);
  tube(s, [[20, 28], [25, 29], [28.5, 27], [28.5, 24], [26.5, 22]], 1.2, .7, m.pink); grain(s, m.pink, (x, y) => ((x + y) % 2 ? 1 : null));
  s.ell(16, 23, 7, 6.5, m.fur); relight(s, m.fur, 15, 20, 8, 8); s.ell(16, 25.5, 4.4, 3.6, m.belly);
  s.ell(11.5, 28.6, 2.6, 1.2, m.pink); s.ell(20.5, 28.6, 2.6, 1.2, m.pink);
  s.ell(10.5, 9, 3, 3.2, m.head); s.ell(21.5, 9, 3, 3.2, m.head); s.ell(16, 13.5, 5.4, 4.6, m.head); relight(s, m.head, 15, 11, 7, 6);
  s.ell(10.5, 9.5, 1.8, 2, m.pink, { flat: 2 }); s.ell(21.5, 9.5, 1.8, 2, m.pink, { flat: 2 }); s.ell(16, 16.4, 2.6, 1.8, m.belly);
  /* the cheese: a wedge, its rind along the top, holes, a bite out of the point; front paws at both ends */
  s.poly([[9, 23.5], [23, 18.5], [23, 23.5]], m.cheese); s.line(9, 23, 23, 18, m.rind, 3); s.line(23, 18, 23, 23, m.rind, 1);
  s.set(9, 23, null); s.set(10, 23, null); s.set(10, 22, null);
  s.outline();
  dots(s, [[14, 22], [19, 21], [21, 22]], m.rind, 1); dots(s, [[17, 22], [12, 23]], m.cheese, 4);
  dots(s, [[11, 21], [12, 21]], m.pink, 3); dots(s, [[21, 18], [22, 18]], m.pink, 3);
  s.set(23, 6, null); s.set(23, 7, m.head, 0); s.set(22, 6, m.head, 0);
  eye(s, 13, 12, { ink: '#1a0e12' }); eye(s, 18, 12, { ink: '#1a0e12' });
  s.fix(15, 15, '#e07a80'); s.fix(16, 15, '#e07a80'); s.fix(15, 16, '#8a4a50'); s.fix(16, 16, '#8a4a50');
  s.fix(15, 17, RAT_TOOTH[0]); s.fix(16, 17, RAT_TOOTH[0]); s.fix(15, 18, RAT_TOOTH[1]); s.fix(16, 18, RAT_TOOTH[1]);
  glint(s, [[9, 15], [8, 14], [9, 17], [8, 18], [22, 15], [23, 14], [22, 17], [23, 18]], '#c8c0b8');
  dots(s, [[13, 19], [18, 19], [11, 22]], m.fur, 4);
  return s; };
const ratSide = () => { const s = pane(), m = ratMats(s);
  tube(s, [[7, 24], [3.5, 26.8], [1.5, 24], [2, 20.5], [4.5, 18.5]], 1.25, .6, m.pink); grain(s, m.pink, (x, y) => ((x + y) % 2 ? 1 : null));
  s.ell(14, 28.7, 1.6, .9, m.pinkD); s.ell(19.5, 28.7, 1.3, .9, m.pinkD);
  /* one hunched mass: haunch, arched back, shoulders */
  s.ell(10.5, 22, 5.6, 5.6, m.fur); s.ell(15.5, 20.5, 6.6, 5.4, m.fur); s.ell(20.5, 21.5, 4, 4.4, m.fur); relight(s, m.fur, 13, 17, 11, 9);
  s.ell(16, 25.8, 5.4, 1.8, m.belly);
  s.ell(10, 28.6, 3, 1.1, m.pink);
  /* the cheese on the ground, a paw on it */
  s.poly([[22, 29.5], [22, 25], [30, 27.5], [30, 29.5]], m.cheese); s.line(22, 25, 30, 27.5, m.rind, 3); s.line(30, 28, 30, 29, m.rind, 1);
  s.set(30, 27, null); s.set(29, 27, null); s.set(30, 28, null);
  /* the head: a domed skull drawn out to a pointed snout */
  s.ell(23.5, 18.5, 4, 3.6, m.head); s.poly([[24, 15.5], [30.5, 18.6], [30.5, 20], [25, 22]], m.head); relight(s, m.head, 24, 16, 6, 5); contact(s, m.head, m.fur);
  s.poly([[24, 21.5], [29.5, 20.2], [27, 22.5], [24, 22.5]], m.belly);
  s.ell(20.5, 14.5, 2.4, 2.8, m.head); s.ell(20.8, 14.9, 1.3, 1.7, m.pink, { flat: 2 });
  tube(s, [[21.5, 23], [23.5, 26]], 1.4, 1.1, m.fur); s.ell(24.5, 25.6, 1.6, .9, m.pink);
  s.outline();
  dots(s, [[24, 28], [27, 28], [25, 29]], m.rind, 1); dots(s, [[26, 27]], m.cheese, 4);
  s.set(19, 12, null); s.set(19, 13, m.head, 0); s.set(20, 12, m.head, 0);
  dots(s, [[12, 16], [15, 15], [9, 18], [17, 16]], m.fur, 4);
  eye(s, 24, 17, { ink: '#1a0e12' }); s.fix(31, 18, '#e07a80'); s.fix(31, 19, '#a85a5e'); s.fix(30, 18, '#c87070');
  s.fix(28, 21, RAT_TOOTH[0]); s.fix(28, 22, RAT_TOOTH[1]);
  glint(s, [[31, 16], [30, 21], [31, 22]], '#c8c0b8');
  return s; };
own('rat', ratFront, ratSide);

/* ================= Mudling (Willowbrook, Lv 1): well mud that got up one night; personally offended by boots ========== */
/* a slumped, dripping heap of wet mud with pebbles in it and a reed sprouting from its crown, scowling brows and a sulky
   mouth; signature: the boot it has half swallowed, sole up and toe in the air, sticking out of its side */
const mudMats = s => ({ mud: mat(s, '#7a5a3a', { hi: .32, gl: .62 }), mudD: mat(s, '#56402c'), wet: mat(s, '#a8805a'), peb: mat(s, '#a09a90'), reed: mat(s, '#7aa04a'),
  boot: mat(s, '#3a2a34', { hi: .4, gl: .62 }), sole: mat(s, '#c8a878'), buckle: mat(s, '#e0b850') });
/* a boot, toe up and sole out: shaft (sx, sy) into the mud, d = +1 toe to the right, -1 to the left */
const mudBoot = (s, m, sx, sy, d) => { const X = x => sx + d * x;
  s.poly([[X(-2), sy + 3], [X(2), sy - 4], [X(5), sy - 2], [X(1), sy + 5]], m.boot);
  s.poly([[X(2), sy - 4], [X(3), sy - 9], [X(6), sy - 9], [X(7), sy - 3], [X(5), sy - 2]], m.boot); s.edges(m.boot);
  s.line(X(3), sy - 10, X(6), sy - 10, m.sole, 3); s.line(X(7), sy - 9, X(8), sy - 4, m.sole, d > 0 ? 1 : 3); s.set(X(7), sy - 10, m.sole, 4);
  s.rect(Math.min(X(1), X(3)), sy - 2, 2, 2, m.buckle); };
const mudFront = () => { const s = pane(), m = mudMats(s);
  s.ell(16, 28.6, 12.5, 1.6, m.mudD, { flat: 1 });
  tube(s, [[16, 12], [15, 7], [12.5, 3.5]], 1, .5, m.reed); tube(s, [[17, 12], [19.5, 8], [22, 7]], .9, .5, m.reed); s.ell(12, 3.5, 1.4, 1, m.reed);
  s.ell(16, 21, 10, 7.6, m.mud); s.ell(12, 15.5, 4.5, 3.6, m.mud); s.ell(19.5, 14.5, 4.6, 3.8, m.mud);
  s.ell(6.2, 23.5, 2.4, 2.6, m.mud); s.ell(25.5, 24, 2.4, 2.4, m.mud); relight(s, m.mud, 13, 15, 12, 11);
  /* drips running down */
  tube(s, [[8, 24], [8, 27]], 1, .7, m.mud, { flat: 2 }); tube(s, [[22, 26], [22.5, 28]], .9, .6, m.mud, { flat: 1 });
  mudBoot(s, m, 25, 21, 1);
  for (const [x, y, r] of [[9, 19, 1.2], [21, 26, 1.1], [12, 25.5, 1]]) s.ell(x, y, r, r, m.peb);
  s.outline();
  dots(s, [[10, 14], [17, 12], [13, 17], [7, 21]], m.wet, 4); dots(s, [[18, 13], [11, 15], [20, 12]], m.wet, 3);
  /* the face: heavy brows down at the middle, white eyes, a sulk */
  dots(s, [[10, 17], [11, 17], [12, 17], [13, 18], [14, 18]], m.mudD, 0); dots(s, [[22, 17], [21, 17], [20, 17], [19, 18], [18, 18]], m.mudD, 0);
  eye(s, 11, 19, { kind: 'big' }); eye(s, 19, 19, { kind: 'big' });
  dots(s, [[13, 24], [14, 23], [15, 23], [16, 23], [17, 23], [18, 24]], m.mudD, 0); dots(s, [[14, 24], [17, 24]], m.mud, 3);
  return s; };
const mudSide = () => { const s = pane(), m = mudMats(s);
  s.ell(15, 28.6, 13, 1.6, m.mudD, { flat: 1 }); s.ell(2.5, 28.5, 1.8, 1, m.mudD, { flat: 1 });
  tube(s, [[17, 12], [14, 7], [10, 5]], 1, .5, m.reed); tube(s, [[19, 12], [18, 8], [16, 6]], .9, .5, m.reed); s.ell(9.5, 5, 1.4, 1, m.reed);
  /* the boot sticks out of its back */
  mudBoot(s, m, 7, 20, -1);
  s.ell(16, 21, 9.6, 7.6, m.mud); s.ell(19.5, 15, 6, 4.5, m.mud); s.ell(24, 21.5, 3.6, 4.4, m.mud); s.ell(26.5, 25.5, 2.6, 2.2, m.mud); relight(s, m.mud, 15, 15, 12, 11);
  tube(s, [[25, 25], [27, 28]], 1.2, .8, m.mud, { flat: 1 });
  for (const [x, y, r] of [[13, 18, 1.2], [10, 25, 1.1], [18, 26, 1]]) s.ell(x, y, r, r, m.peb);
  s.outline();
  dots(s, [[15, 13], [19, 11], [21, 13], [11, 17]], m.wet, 4); dots(s, [[17, 12], [23, 13]], m.wet, 3);
  dots(s, [[19, 17], [20, 17], [21, 17], [22, 18], [23, 18]], m.mudD, 0);
  eye(s, 22, 19, { kind: 'big' });
  dots(s, [[23, 24], [24, 23], [25, 23], [26, 24]], m.mudD, 0);
  return s; };
own('mudling', mudFront, mudSide);

/* ================= Goblin (Willowbrook, Lv 5): steals first, plans later; wealth counted in shiny buttons ============ */
/* a scrawny green chibi in a ragged jerkin, ears out like jug handles (one nicked), a hook nose and a snaggle-toothed
   grin, barefoot with long toes; signature: a row of stolen buttons, none matching, down its front, and a notched knife */
const BUTTONS = ['#f0c84a', '#d8e0e8', '#e0884a', '#7ac8f0', '#f0e8d0'];
const gobMats = (s, skin = '#6fb35e', cloth = '#7a5236') => ({ skin: mat(s, skin), head: mat(s, skin), skinD: mat(s, A.mix(skin, '#1a3020', .32)), jerk: mat(s, cloth), jerkD: mat(s, A.mix(cloth, '#1a1838', .3)),
  belt: mat(s, '#3e2a1e'), knife: mat(s, '#b8c2cc', { gl: .75 }), grip: mat(s, '#6a4428') });
/* a goblin face by hand: b brow, s skin crease, n/N the nose lit and shaded, E/e the eye (light, colour), p pupil,
   m mouth, t tooth, r tongue; rows are placed with their top-left at (ox, oy) */
const GOB_EYE = '#f6d24a';
const gobFace = (s, m, rows, ox = 12, oy = 6, eyeCol = GOB_EYE) => grid(s, ox, oy, rows, { b: [m.skinD, 0], s: [m.head, 1], n: [m.head, 4], N: [m.head, 3], E: A.mix(eyeCol, '#ffffff', .5), e: eyeCol, p: '#2a1c10', m: '#3a1418', t: '#f4ecd8', r: '#c84a4a' });
const gobFront = () => { const s = pane(), m = gobMats(s);
  /* legs and long bare feet */
  s.rect(12, 24, 3, 4, m.skinD); s.rect(17, 24, 3, 4, m.skin); s.ell(12, 28.6, 3, 1.4, m.skinD); s.ell(20, 28.6, 3, 1.4, m.skin);
  /* the jerkin, ragged at the hem */
  slab(s, [[11, 15], [21, 15], [22, 24], [20, 25.5], [18, 24], [16, 25.5], [14, 24], [12, 25.5], [10, 24]], m.jerk); s.line(16, 16, 16, 21, m.jerkD, 1);
  s.rect(10, 21, 12, 2, m.belt);
  /* arms: the left hanging, the right holding the knife up */
  tube(s, [[10.5, 16], [9, 20], [9, 22]], 1.6, 1.3, m.skin); s.ell(9, 23, 1.7, 1.5, m.skin);
  tube(s, [[21.5, 16], [23, 19], [23.5, 21]], 1.6, 1.3, m.skin);
  s.line(24, 20, 24, 12, m.knife, 3); s.line(25, 20, 25, 13, m.knife, 1); s.set(25, 12, m.knife, 4); s.set(25, 16, null); s.rect(23, 20, 3, 3, m.grip);
  s.ell(24, 21.5, 1.7, 1.5, m.skin);
  /* ears: the right one up and out, the left one lower and nicked */
  s.poly([[11, 8], [1.5, 4], [3, 7], [11, 12.5]], m.head); s.line(10, 9.5, 4, 6, m.head, 1); s.set(5, 5, null);
  s.poly([[21, 8], [30.5, 3], [29, 7], [21, 12.5]], m.head); s.line(22, 9.5, 28, 5.5, m.head, 1);
  s.ell(16, 9.5, 6.4, 5.8, m.head); relight(s, m.head, 14, 7, 9, 7); grain(s, m.head, (x, y, l) => ((x < 9 || x > 22) && l > 1 && (y === 9 || y === 10) ? 1 : null));
  s.outline();
  s.fix(15, 16, BUTTONS[0]); s.fix(17, 17, BUTTONS[1]); s.fix(15, 18, BUTTONS[2]); s.fix(17, 19, BUTTONS[3]); s.fix(12, 17, BUTTONS[4]); s.fix(20, 18, BUTTONS[0]);
  gobFace(s, m, ['bb.....bb', '.bb...bb.', '.Ee...Ee.', '.ep...pe.', '....n....', '...NNs...', 'm.......m', '.mtmmmtm.']);
  return s; };
const gobSide = () => { const s = pane(), m = gobMats(s);
  s.rect(11, 24, 3, 4, m.skinD); s.ell(12, 28.6, 3, 1.3, m.skinD); s.rect(16, 24, 3, 4, m.skin); s.ell(19, 28.6, 3.4, 1.4, m.skin);
  tube(s, [[12, 16], [10, 20], [10, 22]], 1.4, 1.2, m.skinD);
  slab(s, [[11, 15], [20, 15], [21, 24], [19, 25.5], [17, 24], [15, 25.5], [13, 24], [11, 25.5], [10, 24]], m.jerk); s.rect(10, 21, 12, 2, m.belt);
  /* the ear swept back, the hooked nose forward */
  s.poly([[13, 7], [1.5, 2.5], [4, 7], [13, 12.5]], m.head); s.line(12, 8.5, 5, 5, m.head, 1);
  s.ell(17, 10, 6.2, 5.6, m.head); s.poly([[22, 8.5], [27, 12.5], [23, 13]], m.head); relight(s, m.head, 15, 7, 9, 7);
  /* the knife arm forward */
  tube(s, [[18, 16], [21, 19], [24, 19]], 1.6, 1.3, m.skin); s.ell(24.5, 19, 1.7, 1.6, m.skin);
  s.line(25, 17, 30, 12, m.knife, 3); s.line(26, 17, 30, 13, m.knife, 1); s.set(28, 14, null); s.rect(24, 19, 2, 3, m.grip);
  s.outline();
  s.fix(20, 16, BUTTONS[0]); s.fix(20, 18, BUTTONS[3]); s.fix(19, 20, BUTTONS[2]);
  gobFace(s, m, ['.bbb...', '..Ee...', '..ep...', '.....n.', '....NN.', '.t..s..', 'mmmmm..', '.mtm...'], 18, 6);
  return s; };
own('goblin', gobFront, gobSide);

/* ================= Goblin slinger (Willowbrook, Lv 4): aims for the head, hits the knee, counts it anyway ========== */
/* a skinny young goblin in a mustard smock with a strap across it, a hen feather stuck in its headband, one eye
   screwed shut and its tongue out in concentration; signature: the sling whirling over its head with a pebble at the
   end of the arc, and a bulging pouch of gravel on its hip */
const slingMats = s => Object.assign(gobMats(s, '#86b062', '#a88a44'), { band: mat(s, '#8a3a2a'), strap: mat(s, '#5a3a24'), pouch: mat(s, '#7a5a3a'), peb: mat(s, '#a8a49a'), cord: mat(s, '#c8a878'), feather: mat(s, '#ece4d4') });
const slingArc = (s, cx, cy, r, a0, a1) => { for (let a = a0; a <= a1; a += .16) { const x = Math.round(cx + Math.cos(a) * r), y = Math.round(cy + Math.sin(a) * r * .7); if (s.get(x, y) == null) s.fix(x, y, (a - a0) / (a1 - a0) > .6 ? '#f0e8d0' : '#8a8470'); } };
const slingFront = () => { const s = pane(), m = slingMats(s);
  s.rect(13, 24, 2, 4, m.skinD); s.rect(17, 24, 2, 4, m.skin); s.ell(13, 28.6, 2.6, 1.3, m.skinD); s.ell(19, 28.6, 2.6, 1.3, m.skin);
  slab(s, [[12, 15], [20, 15], [21, 24], [19, 25], [17, 24], [15, 25], [13, 24], [11, 24]], m.jerk); s.line(12, 16, 19, 22, m.strap, 2); s.rect(11, 21, 10, 1, m.belt);
  /* the gravel pouch on its hip, the hand in it */
  s.ell(10, 22.5, 2.6, 2.4, m.pouch); tube(s, [[11.5, 16], [10, 19], [10, 21]], 1.4, 1.2, m.skin); s.ell(10, 21, 1.5, 1.3, m.skin);
  /* the sling arm up, the cord, the pebble flying round */
  tube(s, [[20.5, 16], [23, 13], [24.5, 9.5]], 1.5, 1.2, m.skin); s.ell(24.5, 8.6, 1.6, 1.5, m.skin);
  s.line(25, 7, 27, 3, m.cord, 2); s.ell(28, 2.5, 1.3, 1.2, m.peb);
  /* swept-back ears, the head, the headband and its feather */
  s.poly([[11, 8], [3.5, 6], [5, 8], [11, 11.5]], m.head); s.poly([[21, 8], [28.5, 6], [27, 8], [21, 11.5]], m.head);
  s.ell(16, 9.5, 6, 5.5, m.head); relight(s, m.head, 14, 7, 9, 7);
  tube(s, [[10.5, 6], [8.5, 2], [7.5, -.5]], 1.2, .7, m.feather); s.line(10, 5.5, 22, 5.5, m.band, 3); s.line(10, 6.5, 22, 6.5, m.band, 1);
  s.outline();
  dots(s, [[8, 1], [7, 0]], m.band, 2); dots(s, [[9, 3], [10, 4]], m.feather, 1);
  dots(s, [[9, 22], [10, 23]], m.peb, 4); dots(s, [[11, 22]], m.peb, 3);
  slingArc(s, 25, 6, 5.5, -3.5, -1.3);
  gobFace(s, m, ['bbb...bb.', '.ss...Ee.', '......pe.', '....n....', '...NNs...', '.........', '..mmmr...'], 12, 7);
  return s; };
const slingSide = () => { const s = pane(), m = slingMats(s);
  s.rect(11, 24, 2, 4, m.skinD); s.ell(11.5, 28.6, 2.6, 1.3, m.skinD); s.rect(17, 24, 2, 4, m.skin); s.ell(19.5, 28.6, 2.8, 1.3, m.skin);
  /* the back arm up behind the head, whirling the sling */
  tube(s, [[12, 16], [9, 12], [8, 7.5]], 1.4, 1.2, m.skinD); s.ell(8, 7, 1.5, 1.4, m.skinD); s.line(7, 6, 4, 2, m.cord, 2); s.ell(3.5, 1.8, 1.3, 1.2, m.peb);
  slab(s, [[11, 15], [19, 15], [20, 24], [18, 25], [16, 24], [14, 25], [12, 24], [10, 24]], m.jerk); s.line(18, 16, 12, 22, m.strap, 2); s.rect(10, 21, 10, 1, m.belt);
  s.ell(10, 22.5, 2.4, 2.4, m.pouch);
  s.poly([[13, 7.5], [3.5, 5.5], [5, 8], [13, 11.5]], m.head); s.ell(17, 10, 5.8, 5.4, m.head); s.poly([[22, 8.5], [26, 12], [22.5, 12.5]], m.head); relight(s, m.head, 15, 7, 9, 7);
  tube(s, [[12.5, 6], [10, 2], [9, -.5]], 1.2, .7, m.feather); s.line(12, 5.5, 22, 5.5, m.band, 3); s.line(12, 6.5, 22, 6.5, m.band, 1);
  /* the front arm out, pointing at the target */
  tube(s, [[18, 16], [22, 17], [26, 16]], 1.5, 1.2, m.skin); s.ell(26.5, 15.8, 1.5, 1.3, m.skin);
  s.outline();
  dots(s, [[9, 22], [10, 21]], m.peb, 4);
  slingArc(s, 8, 5, 5, -2.6, -.2);
  gobFace(s, m, ['.bbb...', '..Ee...', '..ep...', '.....n.', '....NN.', '....s..', '..mmr..'], 18, 7);
  return s; };
own('goblin_slinger', slingFront, slingSide);

/* ================= Goblin hexer (Willowbrook, Lv 7): read half a spellbook; green sparks and confident shouting ===== */
/* a goblin in a patched violet robe and a stolen striped stocking for a wizard's hat, flopping over with a bobble; its
   mouth wide open mid-shout, one hand flung up crackling with green sparks; signature: the half of a spellbook it
   owns, held open, the back pages torn away */
const hexMats = s => Object.assign(gobMats(s, '#7aa65a', '#5c3a6e'), { patch: mat(s, '#b0904a'), hat: mat(s, '#e2d4b4'), hatR: mat(s, '#b03a3a'), cover: mat(s, '#6a3a24'), page: mat(s, '#eee2c4'), rope: mat(s, '#a88a5a') });
const SPARK = ['#f0ffb0', '#a8f060', '#5ac838'];
const sparks = (s, pts) => pts.forEach(([x, y, k]) => s.fix(x, y, SPARK[k || 0]));
const hexFront = () => { const s = pane(), m = hexMats(s);
  s.ell(12.5, 29, 2.4, 1, m.skinD); s.ell(19.5, 29, 2.4, 1, m.skin);
  slab(s, [[11, 15], [21, 15], [23.5, 28.6], [21, 27.6], [18.5, 28.6], [16, 27.6], [13.5, 28.6], [11, 27.6], [8.5, 28.6]], m.jerk); s.line(16, 22, 15, 27, m.jerkD, 1);
  s.rect(18, 23, 3, 3, m.patch); s.rect(10, 20, 13, 1, m.rope);
  /* the right hand flung up, fingers spread, sparks off it */
  tube(s, [[21, 16], [24, 13], [25.5, 9.5]], 1.5, 1.2, m.jerk); s.ell(25.6, 8.4, 1.7, 1.6, m.skin); s.line(24, 7, 23.5, 6, m.skin, 3); s.line(27, 7, 28, 6, m.skin, 2);
  /* the book in the left hand: the front cover and its pages, the back half torn off at the spine */
  tube(s, [[11, 16], [9, 19], [9.5, 21]], 1.5, 1.2, m.jerk);
  s.poly([[3, 18], [9.5, 19.5], [9.5, 24.5], [3, 23]], m.cover); s.poly([[4, 18.5], [9.5, 19.7], [9.5, 23.5], [4, 22.2]], m.page); s.poly([[9.5, 19.5], [12, 18.6], [11, 20.5], [12.5, 21.5], [11, 23], [12, 24], [9.5, 24.5]], m.page);
  s.ell(9.6, 22, 1.4, 1.3, m.skin);
  /* ears out under the hat */
  s.poly([[11, 10], [2.5, 9], [4, 11], [11, 13.5]], m.head); s.poly([[21, 10], [28.5, 11], [27, 12.5], [21, 13.5]], m.head);
  s.ell(16, 10.5, 6, 5.3, m.head); relight(s, m.head, 14, 8, 9, 7);
  /* the stocking hat: a band, the crown, the long tail flopped over to the right */
  s.ell(16, 5, 6.4, 3.4, m.hat); tube(s, [[18, 3], [23.5, 2], [27, 4.5], [28, 8]], 2.2, 1.1, m.hat); s.rect(9.5, 6, 13, 2, m.hat); s.ell(28.4, 9.4, 1.8, 1.8, m.hatR);
  swap(s, m.hat, m.hatR, (x, y) => (y === 6 || y === 7) ? false : ((x + y) >> 1) % 2 === 0);
  s.outline();
  dots(s, [[5, 20], [6, 20], [7, 21], [5, 22], [7, 22]], m.cover, 1); s.fix(6, 21, SPARK[2]);
  sparks(s, [[25, 4, 0], [25, 3, 1], [24, 4, 1], [26, 4, 1], [25, 5, 2], [29, 3, 0], [29, 2, 2], [28, 3, 2], [30, 3, 2], [23, 2, 1], [27, 1, 2], [31, 5, 1], [22, 5, 2]]);
  gobFace(s, m, ['b.......b', '.bb...bb.', '.Ee...Ee.', '.ep...pe.', '....n....', '...NNs...', '...mmm...', '..mtrtm..', '...mmm...'], 12, 7);
  return s; };
const hexSide = () => { const s = pane(), m = hexMats(s);
  s.ell(12, 29, 2.4, 1, m.skinD); s.ell(19.5, 29, 2.6, 1, m.skin);
  slab(s, [[11, 15], [20, 15], [22.5, 28.6], [20, 27.6], [17.5, 28.6], [15, 27.6], [12.5, 28.6], [10, 27.6], [8, 28.6]], m.jerk); s.rect(9, 20, 13, 1, m.rope); s.rect(11, 23, 3, 3, m.patch);
  /* the book held to its chest, open toward us */
  s.poly([[13, 16.5], [18, 17.5], [18, 21.5], [13, 20.5]], m.cover); s.poly([[13.5, 17], [18, 17.8], [18, 20.8], [13.5, 20]], m.page); s.poly([[18, 17.5], [20, 16.8], [19, 18.5], [20.5, 19.5], [18, 21.5]], m.page);
  s.poly([[13, 9.5], [3.5, 8.5], [5, 10.5], [13, 13]], m.head);
  s.ell(17, 10.5, 5.8, 5.2, m.head); s.poly([[22, 9], [26, 12.5], [22.5, 13]], m.head); relight(s, m.head, 15, 8, 9, 7);
  s.ell(16, 5, 6.2, 3.4, m.hat); tube(s, [[13, 3], [8, 2], [4.5, 4.5], [3.5, 8]], 2.2, 1.1, m.hat); s.rect(10, 6, 13, 2, m.hat); s.ell(3.2, 9.4, 1.8, 1.8, m.hatR);
  swap(s, m.hat, m.hatR, (x, y) => (y === 6 || y === 7) ? false : ((x - y) >> 1) % 2 === 0);
  /* the front arm thrust out, sparks off the fingers */
  tube(s, [[19, 16], [23, 16.5], [26, 15]], 1.5, 1.2, m.jerk); s.ell(27, 14.6, 1.6, 1.5, m.skin);
  s.outline();
  dots(s, [[15, 18], [16, 18], [15, 19]], m.cover, 1); s.fix(16, 19, SPARK[2]);
  sparks(s, [[30, 14, 0], [30, 13, 1], [29, 14, 1], [31, 14, 1], [30, 15, 2], [29, 11, 0], [28, 10, 2], [30, 10, 2], [29, 17, 1], [31, 17, 2], [28, 12, 2]]);
  gobFace(s, m, ['.bbb...', '..Ee...', '..ep...', '.....n.', '....NN.', '...mmm.', '...mtrm', '...mmm.'], 18, 7);
  return s; };
own('goblin_hexer', hexFront, hexSide);

/* ================= Goblin brute (Willowbrook, Lv 10): the biggest goblin in the Thicket, and it knows it ========== */
/* the opposite of a chibi: slabs of muscle (two pecs, a belly, arms like hams) with a small head sunk between its
   shoulders, a jutting underbite and two tusks, tiny eyes under one long brow, a half loaf of bread tucked in its rope
   belt; signature: the broken field gate it carries for a club, slats and brace and hinge, "hits like a falling gate" */
const bruteMats = s => { const k = '#628f44'; return Object.assign(gobMats(s, k, '#6a4a2e'), { pecL: mat(s, k), pecR: mat(s, k), belly: mat(s, '#7aa056'), arm: mat(s, k), arm2: mat(s, k), leg: mat(s, A.mix(k, '#1a3020', .25)),
  gate: mat(s, '#b48c5a', { lo: .38 }), gateD: mat(s, '#7a5a38'), iron: mat(s, '#4a4a56'), rope: mat(s, '#b09060'), tusk: mat(s, '#f2e8cc'), strap: mat(s, '#4a3020'), bread: mat(s, '#d8a058') }); };
/* a field gate: a frame of rails and slats with the light showing between, a diagonal brace and a hinge strap */
const fieldGate = (s, m, x0, y0, w, h) => { for (let i = 0; i < w; i += 3) s.rect(x0 + i, y0, 2, h, m.gate); s.rect(x0, y0, w, 2, m.gate); s.rect(x0, y0 + h - 2, w, 2, m.gate);
  s.line(x0 + 1, y0 + h - 2, x0 + w - 2, y0 + 1, m.gateD, 2); s.line(x0 + 1, y0 + h - 3, x0 + w - 3, y0 + 1, m.gateD, 3); s.rect(x0 + w - 1, y0 + 2, 2, 2, m.iron); s.rect(x0 + w - 1, y0 + h - 4, 2, 2, m.iron); };
const bruteFront = () => { const s = pane(), m = bruteMats(s);
  /* the gate, upright behind its right shoulder, held at the bottom rail */
  fieldGate(s, m, 20, 0, 11, 11);
  s.rect(9, 23, 5, 5, m.leg); s.rect(18, 23, 5, 5, m.leg); s.ell(10.5, 28.6, 4, 1.4, m.leg); s.ell(21.5, 28.6, 4, 1.4, m.leg);
  /* the trunk in three masses, each its own volume */
  s.ell(16, 21, 7.4, 4.6, m.belly); s.ell(11.6, 15, 5.4, 4.4, m.pecL); s.ell(20.4, 15, 5.4, 4.4, m.pecR); contact(s, [m.pecL, m.pecR], m.belly); contact(s, m.pecL, m.pecR, 0);
  slab(s, [[10, 23], [22, 23], [21, 26.5], [18, 25.5], [16, 27], [14, 25.5], [11, 26.5]], m.jerk); s.rect(9, 22, 14, 2, m.rope); s.ell(19.5, 21.5, 2.4, 1.6, m.bread);
  s.line(9, 12, 21, 23, m.strap, 2);
  /* arms like hams: the left down to a fist at the knee, the right up on the gate */
  s.ell(5.8, 15, 3.4, 3.6, m.arm); tube(s, [[5.5, 17], [4.5, 21], [5, 23]], 2.6, 2.2, m.arm); s.ell(5.3, 24.6, 2.8, 2.5, m.arm); contact(s, m.arm, [m.pecL, m.belly]);
  s.ell(26.4, 14.5, 3.4, 3.6, m.arm2); tube(s, [[27, 13], [28, 10.5], [26.5, 10]], 2.4, 2.1, m.arm2); s.ell(25.8, 10.6, 2.4, 2.2, m.arm2); contact(s, m.arm2, [m.pecR, m.gate]);
  /* the small head, sunk low; ears like cut corners */
  s.poly([[12, 7.5], [7.5, 6], [12, 10.5]], m.head); s.poly([[20, 7.5], [24.5, 6], [20, 10.5]], m.head);
  s.ell(16, 8, 4.6, 4.2, m.head); s.poly([[11.5, 9], [20.5, 9], [20, 13], [12, 13]], m.head); relight(s, m.head, 15, 6, 6, 6); contact(s, m.head, [m.pecL, m.pecR], 0);
  s.outline();
  dots(s, [[12, 6], [13, 6], [14, 7], [15, 7], [16, 7], [17, 7], [18, 7], [19, 6], [20, 6]], m.skinD, 0);
  s.fix(14, 8, '#f0d050'); s.fix(18, 8, '#f0d050'); s.fix(14, 9, '#3a2a10'); s.fix(18, 9, '#3a2a10');
  dots(s, [[13, 11], [14, 11], [15, 11], [16, 11], [17, 11], [18, 11], [19, 11]], m.skinD, 0);
  dots(s, [[13, 10], [19, 10]], m.tusk, 4); dots(s, [[13, 9], [19, 9]], m.tusk, 3); dots(s, [[15, 10], [17, 10]], m.tusk, 3);
  dots(s, [[16, 9], [16, 10]], m.head, 4); dots(s, [[20, 21], [19, 21]], m.bread, 4);
  return s; };
const bruteSide = () => { const s = pane(), m = bruteMats(s);
  /* the gate swung up behind, about to come down */
  fieldGate(s, m, 1, 0, 11, 10);
  s.ell(9.5, 12.5, 3, 3.2, m.arm); tube(s, [[10, 14], [10.5, 11], [9.5, 9]], 2.4, 2.1, m.arm);
  s.rect(10, 23, 5, 5, m.leg); s.ell(12, 28.6, 4, 1.4, m.leg); s.rect(18, 23, 5, 5, m.leg); s.ell(21.5, 28.6, 4.2, 1.4, m.leg);
  s.ell(14, 16.5, 7.6, 6.6, m.pecL); s.ell(19, 20.5, 5.4, 4.6, m.belly); relight(s, m.pecL, 12, 12, 10, 8); contact(s, m.belly, m.pecL);
  slab(s, [[9, 23], [23, 23], [22, 26.5], [18, 25.5], [16, 27], [13, 25.5], [10, 26.5]], m.jerk); s.rect(8, 22, 16, 2, m.rope); s.ell(12, 21.5, 2.2, 1.5, m.bread);
  s.line(9, 12, 18, 23, m.strap, 2); contact(s, m.arm, m.pecL);
  /* the head thrust forward and low, the jaw out */
  s.poly([[19.5, 9.5], [21.5, 7], [21.5, 11]], m.head);
  s.ell(23, 11, 4.2, 4, m.head); s.poly([[23, 11], [28.5, 12], [28, 15.5], [22, 15]], m.head); relight(s, m.head, 22, 9, 6, 6); contact(s, m.head, [m.pecL, m.belly], 0);
  /* the fist forward */
  s.ell(19.5, 16, 3.4, 3.4, m.arm2); tube(s, [[20, 17], [24, 20], [27, 19.5]], 2.6, 2.2, m.arm2); s.ell(27.5, 19.5, 2.6, 2.5, m.arm2); relight(s, m.arm2, 21, 15, 8, 6); contact(s, m.arm2, [m.pecL, m.belly, m.head]);
  s.outline();
  dots(s, [[21, 9], [22, 9], [23, 9], [24, 9], [25, 9], [26, 9]], m.skinD, 0);
  s.fix(25, 10, '#f0d050'); s.fix(25, 11, '#3a2a10');
  dots(s, [[23, 14], [24, 14], [25, 14], [26, 14], [27, 14]], m.skinD, 0); dots(s, [[27, 13], [24, 13]], m.tusk, 4); dots(s, [[27, 12]], m.tusk, 3);
  dots(s, [[27, 11], [28, 12]], m.head, 4); dots(s, [[11, 21]], m.bread, 4);
  return s; };
own('goblin_brute', bruteFront, bruteSide);

/* ================= Goblin raider (Willowbrook, Lv 8): one of Grubnash's farm raiders, ranked by the size of its sack == */
/* a goblin in a dark cowl with its ears out through slits, a hen's feather stuck up in the hood as a uniform, a sly
   narrow-eyed smirk, a rust-red smock, creeping with a dagger low; signature: the huge lumpy burlap sack of stolen hides
   slung over its shoulder, patched and roped, a brown-and-white calfskin hanging out of the neck */
const raidMats = s => Object.assign(gobMats(s, '#7fae5c', '#8a3e2e'), { hood: mat(s, '#3e3428'), sack: mat(s, '#c8ae80', { lo: .38 }), sackD: mat(s, '#8a7048'), hide: mat(s, '#8a5232', { hi: .34 }), feather: mat(s, '#f4ece0'), tip: mat(s, '#b0602e'), rope: mat(s, '#5a3e24') });
const raidFront = () => { const s = pane(), m = raidMats(s);
  /* the sack over its left shoulder (our right), hanging to its knee */
  s.ell(23, 17.5, 6.6, 8.6, m.sack); s.ell(21.5, 8.5, 3.4, 3, m.sack); relight(s, m.sack, 21, 12, 8, 11); s.rect(24, 19, 3, 3, m.sackD);
  s.poly([[19, 4.5], [22.5, 2], [26.5, 2.5], [28.5, 5.5], [27, 8], [25, 6.5], [23, 8.5], [20.5, 7]], m.hide); s.edges(m.hide); s.rect(19, 9, 5, 2, m.rope);
  s.rect(12, 24, 3, 4, m.skinD); s.rect(17, 24, 3, 4, m.skin); s.ell(12.5, 28.6, 2.8, 1.3, m.skinD); s.ell(19.5, 28.6, 2.8, 1.3, m.skin);
  slab(s, [[11, 15], [20, 15], [21, 24], [19, 25.5], [17, 24], [15, 25.5], [13, 24], [11, 25.5], [10, 24]], m.jerk); s.rect(10, 21, 11, 2, m.belt); s.line(11, 21, 20, 13, m.rope, 2);
  tube(s, [[10.5, 16], [9, 20], [9, 22]], 1.6, 1.3, m.skin); s.ell(9, 23, 1.7, 1.5, m.skin); s.line(8, 24, 6, 28, m.knife, 3); s.line(9, 24, 7, 28, m.knife, 1);
  tube(s, [[20, 16], [21, 13], [21, 11]], 1.5, 1.3, m.skin); s.ell(21, 10.5, 1.6, 1.4, m.skin);
  /* the cowl, the ears out through slits, the face in its shadow */
  s.poly([[11, 9], [3, 6], [5, 9], [11, 12]], m.head); s.poly([[20, 9], [27, 7], [25, 10], [20, 12]], m.head);
  s.ell(15.5, 9, 6.4, 6.4, m.hood); s.poly([[9.5, 9], [21.5, 9], [21.5, 15], [9.5, 15]], m.hood); relight(s, m.hood, 13, 5, 9, 9); contact(s, m.hood, m.sack, 0);
  s.ell(15.5, 10.5, 4.4, 4, m.head); relight(s, m.head, 15, 9, 6, 5); grain(s, m.head, (x, y, l) => (y <= 8 ? 1 : null));
  tube(s, [[11.5, 4], [10, 0.5]], 1.3, .8, m.feather);
  s.outline();
  dots(s, [[9, 0], [10, 0]], m.tip, 2); dots(s, [[11, 2], [12, 3]], m.feather, 1);
  for (const [x, y] of [[22, 4], [23, 4], [22, 5], [26, 5], [27, 5], [26, 6], [24, 3]]) s.fix(x, y, HIDE_SPOT_R);
  dots(s, [[24, 19], [26, 21], [25, 20]], m.rope, 1);
  gobFace(s, m, ['.........', '..bb.bb..', '..Ee.Ee..', '...n.....', '...Ns....', '..mmmmt..'], 11, 8);
  return s; };
const HIDE_SPOT_R = '#ece4d4';
const raidSide = () => { const s = pane(), m = raidMats(s);
  /* creeping on its toes, bent over under the sack */
  s.rect(11, 24, 3, 3, m.skinD); s.ell(13, 28, 2.6, 1.3, m.skinD); tube(s, [[12, 26], [13, 28]], 1.2, 1, m.skinD);
  s.rect(17, 24, 3, 4, m.skin); s.ell(20, 28.6, 2.8, 1.3, m.skin);
  slab(s, [[12, 15], [21, 15], [22, 24], [20, 25.5], [18, 24], [16, 25.5], [14, 24], [11, 24]], m.jerk); s.rect(11, 21, 11, 2, m.belt);
  s.ell(9, 14, 7.6, 7.8, m.sack); s.ell(6, 7.5, 3.6, 3.4, m.sack); relight(s, m.sack, 6, 9, 10, 10); s.rect(4, 14, 3, 3, m.sackD);
  s.poly([[1, 4.5], [4, 1.5], [8, 1.8], [9.5, 4.5], [7.5, 6.5], [5.5, 5], [3, 7]], m.hide); s.edges(m.hide); s.line(13, 11, 18, 17, m.rope, 2);
  s.poly([[16, 9], [8.5, 6.5], [10, 9.5], [16, 12]], m.head);
  s.ell(19, 10, 5.6, 5.8, m.hood); s.poly([[13.5, 9], [24, 9], [24, 15], [13.5, 15]], m.hood); relight(s, m.hood, 17, 6, 8, 8); contact(s, m.hood, m.sack, 0);
  s.ell(21, 11, 3.6, 3.8, m.head); s.poly([[23, 10], [27, 13], [23.5, 13.6]], m.head); relight(s, m.head, 21, 9, 5, 5);
  tube(s, [[17, 4.5], [16, 0.5]], 1.3, .8, m.feather);
  tube(s, [[20, 16], [23, 19], [25.5, 21]], 1.6, 1.3, m.skin); s.ell(26, 21.5, 1.6, 1.5, m.skin); s.line(27, 22, 31, 20, m.knife, 3); s.line(27, 23, 31, 21, m.knife, 1);
  s.outline();
  dots(s, [[16, 0], [15, 0]], m.tip, 2);
  for (const [x, y] of [[3, 3], [4, 3], [3, 4], [7, 4], [8, 4], [7, 5], [6, 2]]) s.fix(x, y, HIDE_SPOT_R);
  gobFace(s, m, ['.bb...', '.Ee...', '..n...', '..Ns..', '.mmmt.'], 21, 9);
  return s; };
own('goblin_raider', raidFront, raidSide);

/* ================= Brambleback (Willowbrook, Lv 2): a hedgerow urchin that roots in the potato rows ============== */
/* a round little hog-nosed creature, all soft brown face and belly, whose back is a tangle of living bramble: arched
   green canes with red thorns; signature: ripe blackberries and one white bramble flower growing among its spines */
const bramMats = s => ({ fur: mat(s, '#a07a58'), face: mat(s, '#c8a07a'), cane: mat(s, '#5a8a3a', { lo: .42 }), caneD: mat(s, '#3e6a2c'), thorn: mat(s, '#b05a3a'), berry: mat(s, '#4a2a5a', { hi: .45, gl: .75 }), petal: mat(s, '#f4f0e4'), nose: mat(s, '#3a2626') });
/* the bramble back: overlapping arched canes, each with a few thorns */
const canes = (s, m, cx, cy, rx, ry, n, side) => { s.ell(cx, cy, rx, ry, m.caneD); relight(s, m.caneD, cx - rx * .3, cy - ry * .4, rx, ry, { max: 3 });
  for (let i = 0; i < n; i++) { const a = Math.PI * (1.08 + i * .84 / (n - 1)), x = cx + Math.cos(a) * rx * .78, y = cy + Math.sin(a) * ry * .78; const tx = x + Math.cos(a) * 3.4 + (side || 0), ty = y + Math.sin(a) * 3.4 - .6;
    tube(s, [[cx + Math.cos(a) * rx * .3, cy + Math.sin(a) * ry * .3], [x, y], [tx, ty]], 1.3, .6, m.cane); s.set(Math.round(tx + Math.cos(a)), Math.round(ty + Math.sin(a)), m.thorn, 2); } };
const bramFront = () => { const s = pane(), m = bramMats(s);
  s.ell(11.5, 28.6, 2.2, 1, m.fur); s.ell(20.5, 28.6, 2.2, 1, m.fur);
  canes(s, m, 16, 20, 11, 8.6, 7, 0);
  s.ell(16, 23, 6.6, 5.4, m.face); relight(s, m.face, 15, 20, 8, 7);
  s.ell(16, 25.2, 2.6, 2, m.fur); s.ell(16, 26.2, 1.6, 1, m.nose);
  s.outline();
  /* berries and a flower in the canes */
  for (const [x, y] of [[8, 15], [21, 12], [13, 11], [24, 17]]) { s.set(x, y, m.berry, 3); s.set(x + 1, y, m.berry, 2); s.set(x, y + 1, m.berry, 2); s.set(x + 1, y + 1, m.berry, 1); s.fix(x, y, '#c8a8e0'); }
  for (const [x, y] of [[17, 11], [16, 10], [18, 10], [16, 12], [18, 12]]) s.set(x, y, m.petal, 3); s.fix(17, 11, '#f0c840');
  eye(s, 13, 21, { ink: '#1e1214' }); eye(s, 19, 21, { ink: '#1e1214' });
  s.fix(15, 26, '#6a4040'); s.fix(17, 26, '#6a4040'); dots(s, [[15, 28], [16, 28], [17, 28]], m.fur, 0);
  glint(s, [[11, 24], [21, 24]], '#e8a090');
  return s; };
const bramSide = () => { const s = pane(), m = bramMats(s);
  s.ell(10, 28.6, 2.2, 1, m.fur); s.ell(19, 28.6, 2.2, 1, m.fur);
  canes(s, m, 13.5, 21, 10, 7.4, 7, -1);
  /* the face pushed forward, a long pink-tipped snout */
  s.ell(21, 23, 4.6, 4.4, m.face); s.poly([[22, 21], [29, 24], [28.6, 26], [22, 26.5]], m.face); relight(s, m.face, 21, 21, 6, 5);
  s.ell(12, 25.6, 7, 2.6, m.fur); s.ell(28.6, 24.6, 1.3, 1.2, m.nose);
  s.outline();
  for (const [x, y] of [[6, 16], [17, 13], [4, 20], [20, 16]]) { s.set(x, y, m.berry, 3); s.set(x + 1, y, m.berry, 2); s.set(x, y + 1, m.berry, 2); s.set(x + 1, y + 1, m.berry, 1); s.fix(x, y, '#c8a8e0'); }
  for (const [x, y] of [[12, 12], [11, 11], [13, 11], [11, 13], [13, 13]]) s.set(x, y, m.petal, 3); s.fix(12, 12, '#f0c840');
  eye(s, 22, 22, { ink: '#1e1214' }); glint(s, [[24, 25]], '#e8a090'); dots(s, [[25, 27], [26, 27], [27, 27]], m.fur, 0);
  return s; };
own('brambleback', bramFront, bramSide);

/* ================= Lantern moth (Willowbrook, Lv 3): a big dusk moth with a lamp for a tail ===================== */
/* dusty gold wings with dark veins and a ringed eye-spot on each, a fluffy cream collar, feathery antennae and two big
   dark eyes; signature: its abdomen glows like a little lantern, ribbed and amber, throwing a pool of light on the
   ground beneath it */
const mothMats = s => ({ wing: mat(s, '#c8a050', { lo: .42 }), wingB: mat(s, '#a8803c'), vein: mat(s, '#6a4a2a'), fluff: mat(s, '#f0e4c8'), body: mat(s, '#7a5a3a'), lamp: s.mat(['#6a3410', '#e0802a', '#f8b040', '#ffe080', '#fffbe0']), spot: mat(s, '#d0602a'), feel: mat(s, '#d8c8a0') });
const LIGHT_POOL = ['#5a4a2a', '#7a6430', '#9a8038'];
const pool = (s, cx, w) => { for (let x = -w; x <= w; x++) { const k = Math.abs(x) / w; s.fix(cx + x, 30, LIGHT_POOL[k < .35 ? 2 : k < .7 ? 1 : 0]); if (k < .5) s.fix(cx + x, 29, LIGHT_POOL[k < .25 ? 1 : 0]); } };
const mothFront = () => { const s = pane(), m = mothMats(s);
  /* upper wings, then the smaller lower wings */
  for (const d of [-1, 1]) { const X = x => 16 + d * x;
    s.poly([[X(1), 9], [X(6), 4], [X(12), 3], [X(15), 6], [X(14), 11], [X(9), 15], [X(2), 15]], m.wing);
    s.poly([[X(1), 15], [X(8), 15], [X(11), 19], [X(9), 23], [X(4), 23], [X(1), 20]], m.wingB);
    s.line(X(2), 11, X(13), 5, m.vein, 1); s.line(X(2), 13, X(12), 11, m.vein, 1); s.line(X(2), 17, X(8), 21, m.vein, 1);
    s.ell(X(9), 9, 2.4, 2.2, m.spot, { flat: 2 }); s.ell(X(9), 9, 1.2, 1, m.vein, { flat: 1 }); }
  relight(s, m.wing, 11, 4, 16, 11, { max: 3 }); s.edges(m.wingB);
  /* the lantern abdomen, ribbed, and the furry thorax */
  s.ell(16, 20.5, 2.8, 4.6, m.lamp); s.ell(16, 13, 3.2, 3.2, m.fluff); s.ell(16, 9, 2.6, 2.2, m.body);
  tube(s, [[15, 7], [13, 3], [10, 1.5]], .9, .6, m.feel); tube(s, [[17, 7], [19, 3], [22, 1.5]], .9, .6, m.feel);
  s.outline();
  for (const y of [18, 20, 22]) { s.set(14, y, m.lamp, 1); s.set(18, y, m.lamp, 1); s.set(16, y, m.lamp, 4); }
  for (const [x, y] of [[12, 3], [11, 2], [20, 3], [21, 2], [13, 4], [19, 4]]) s.fix(x, y, '#e8d8b0');
  eye(s, 14, 8, { kind: 'big', white: '#2a2a3a', ink: '#120e1a' }); eye(s, 17, 8, { kind: 'big', white: '#2a2a3a', ink: '#120e1a' }); s.fix(15, 8, '#3a3446'); s.fix(18, 8, '#3a3446');
  for (const [x, y] of [[11, 22], [21, 22], [16, 26], [13, 25], [19, 25]]) s.fix(x, y, '#ffe08a'); s.fix(16, 27, '#c89a40');
  pool(s, 16, 7);
  return s; };
const mothSide = () => { const s = pane(), m = mothMats(s);
  /* the far wing raised behind, the near wing raised in front */
  s.poly([[13, 13], [9, 4], [12, 1], [18, 3], [19, 10]], m.wingB); s.edges(m.wingB);
  s.poly([[14, 14], [5, 8], [3, 3], [7, 1], [14, 2], [19, 9], [18, 14]], m.wing); relight(s, m.wing, 8, 3, 12, 10, { max: 3 });
  s.line(16, 13, 6, 3, m.vein, 1); s.line(16, 12, 13, 2, m.vein, 1); s.line(15, 14, 4, 6, m.vein, 1); s.ell(10, 6, 2.4, 2.2, m.spot, { flat: 2 }); s.ell(10, 6, 1.2, 1, m.vein, { flat: 1 });
  /* legs hanging, the lantern abdomen trailing back and down */
  for (const [x0, x1] of [[17, 18], [19, 21], [21, 24]]) s.line(x0, 17, x1, 22, m.body, 1);
  s.ell(12, 20, 5, 3, m.lamp); s.ell(19, 15.5, 3.6, 3, m.fluff); s.ell(22.5, 14.5, 2.4, 2.2, m.body);
  tube(s, [[23, 12.5], [25, 8], [28.5, 6]], .9, .6, m.feel);
  s.outline();
  for (const x of [9, 11, 13]) { s.set(x, 19, m.lamp, 4); s.set(x, 22, m.lamp, 1); } s.set(15, 20, m.lamp, 2);
  for (const [x, y] of [[26, 7], [27, 6], [25, 9], [28, 7]]) s.fix(x, y, '#e8d8b0');
  s.fix(23, 14, '#ffffff'); s.fix(24, 14, '#2a2a3a'); s.fix(23, 15, '#2a2a3a'); s.fix(24, 15, '#120e1a');
  for (const [x, y] of [[6, 21], [12, 25], [17, 23], [8, 24]]) s.fix(x, y, '#ffe08a');
  pool(s, 12, 7);
  return s; };
own('lanternmoth', mothFront, mothSide, { flies: true });

/* ================= Rilljaw (Willowbrook, Lv 6): a stream newt that has started coming up into the reed ponds ====== */
/* a low, wet, teal newt with dark spots, an orange sail along its back and frilly orange gills behind its head;
   signature: its oversized underslung jaw of needle teeth, with a pink shrimp still hanging out of it */
const rillMats = s => ({ skin: mat(s, '#4f9c91', { lo: .4 }), head: mat(s, '#4f9c91', { lo: .4 }), belly: mat(s, '#b8d8b0'), fin: mat(s, '#e09048', { hi: .35 }), gill: mat(s, '#e86a5a'), leg: mat(s, '#3e7e76'), jaw: mat(s, '#3a7a72'), shrimp: mat(s, '#f08a7a') });
const RILL_SPOT = '#2a5a54', RILL_MOUTH = '#2a1018', RILL_TOOTH = '#f4f0e0';
const rillFront = () => { const s = pane(), m = rillMats(s);
  /* splayed front legs, webbed feet */
  tube(s, [[10, 21], [6, 24], [5, 28.4]], 1.6, 1.2, m.leg); tube(s, [[22, 21], [26, 24], [27, 28.4]], 1.6, 1.2, m.leg);
  for (const [x, d] of [[5, -1], [27, 1]]) { s.line(x, 29, x + d * 3, 29, m.leg, 2); s.line(x, 29, x - d, 29, m.leg, 2); }
  /* the fin crest behind the head, the gills fanned out */
  s.poly([[13, 9], [16, 2], [19, 9]], m.fin); s.edges(m.fin);
  for (const d of [-1, 1]) for (let i = 0; i < 3; i++) tube(s, [[16 + d * 7, 13 + i * 1.5], [16 + d * (10 + i), 10 + i * 3.2]], 1, .7, m.gill);
  /* the body low behind, the broad flat head, the great jaw */
  s.ell(16, 22, 8, 5, m.skin); s.ell(16, 24.5, 5, 2.4, m.belly);
  s.ell(16, 13, 7.4, 4.6, m.head); relight(s, m.head, 14, 10, 9, 6);
  s.poly([[8, 15], [24, 15], [23, 21], [9, 21]], m.jaw); s.edges(m.jaw); contact(s, m.jaw, m.skin, 0);
  s.outline();
  /* the gape: a dark mouth with needle teeth top and bottom, the shrimp hanging out of the corner */
  for (let x = 10; x <= 22; x++) { s.set(x, 16, m.jaw, 0); s.set(x, 17, m.jaw, 0); }
  for (let x = 10; x <= 22; x += 2) s.fix(x, 16, RILL_TOOTH); for (let x = 11; x <= 21; x += 2) s.fix(x, 17, RILL_TOOTH);
  s.ell(22.5, 19, 1.4, 1.2, m.shrimp, { flat: 3 }); dots(s, [[23, 20], [24, 21], [24, 22]], m.shrimp, 2); s.fix(24, 23, '#c85a5a'); s.fix(22, 18, '#1a1018');
  for (const [x, y] of [[11, 11], [20, 10], [9, 22], [22, 23], [16, 20]]) s.fix(x, y, RILL_SPOT);
  eye(s, 12, 11, { kind: 'big', white: '#e8e070', ink: '#1a1418' }); eye(s, 19, 11, { kind: 'big', white: '#e8e070', ink: '#1a1418' });
  glint(s, [[13, 9], [21, 9], [7, 20]], '#d8f4f0');
  return s; };
const rillSide = () => { const s = pane(), m = rillMats(s);
  /* a paddle tail with a fin along it, the sail down the back */
  tube(s, [[10, 23], [5, 22], [1.5, 19.5]], 2.4, 1, m.skin); s.poly([[2, 18], [8, 18.5], [12, 18], [6, 16]], m.fin);
  s.poly([[8, 19], [9, 14], [11, 15], [12, 11], [14, 14], [16, 10], [18, 14], [20, 12], [21, 15], [23, 18]], m.fin); s.edges(m.fin);
  for (const [x, y] of [[12, 11], [16, 10], [20, 12], [9, 14]]) s.line(x, y + 1, x + (x < 15 ? 1 : 0), 18, m.fin, 1);
  /* far legs, the body, near legs splayed */
  tube(s, [[13, 25], [12, 28.4]], 1.2, 1, m.jaw); tube(s, [[20, 25], [21, 28.4]], 1.2, 1, m.jaw);
  s.ell(15, 22.5, 7.6, 4.2, m.skin); relight(s, m.skin, 13, 19, 9, 6); s.ell(15.5, 25.5, 6, 1.5, m.belly);
  tube(s, [[11, 24], [8.5, 27], [9.5, 28.6]], 1.5, 1.1, m.leg); tube(s, [[19, 24], [17.5, 27], [18.5, 28.6]], 1.5, 1.1, m.leg); s.line(8, 29, 11, 29, m.leg, 2); s.line(17, 29, 20, 29, m.leg, 2);
  /* the head, the gills behind it, the big underslung jaw open */
  for (let i = 0; i < 3; i++) tube(s, [[21, 18 + i * 1.6], [18.5 - i * .5, 14.5 + i * 2.6]], 1, .7, m.gill);
  s.ell(24, 18.5, 4.4, 3.4, m.head); s.poly([[24, 16], [30.5, 18], [30, 20], [24, 20.5]], m.head); relight(s, m.head, 23, 16, 6, 4);
  s.poly([[21, 21], [31, 22.5], [30, 25.5], [22, 25]], m.jaw); s.edges(m.jaw); contact(s, m.jaw, m.skin, 0);
  s.outline();
  for (let x = 23; x <= 30; x++) s.set(x, 21, m.jaw, 0); for (let x = 24; x <= 30; x += 2) { s.fix(x, 20, RILL_TOOTH); s.fix(x + 1, 21, RILL_TOOTH); }
  s.ell(30, 23, .8, .8, m.shrimp); dots(s, [[29, 22], [30, 24], [31, 25], [31, 26]], m.shrimp, 2); s.fix(31, 27, '#c85a5a');
  for (const [x, y] of [[11, 20], [16, 19], [19, 22], [8, 22], [26, 17]]) s.fix(x, y, RILL_SPOT);
  eye(s, 25, 17, { kind: 'big', white: '#e8e070', ink: '#1a1418' });
  glint(s, [[22, 16], [14, 19]], '#d8f4f0');
  return s; };
own('rilljaw', rillFront, rillSide);

/* ================= Tattercap (Willowbrook, Lv 9): a mushroom imp that pulls washing off the lines ================ */
/* a stubby cream stalk with gills under a wide mauve cap, the cap's edge torn into tatters with a hole through it and
   pale spots; a wicked grin under the brim; signature: a wooden clothes peg clipped to its cap and a stolen striped sock
   it waves like a flag (Wren sews the ones she catches tiny hats) */
const tatMats = s => ({ cap: mat(s, '#8e4470', { lo: .45, hi: .3, gl: .5 }), capU: mat(s, '#6e3858'), gill: mat(s, '#d8c0a0'), stalk: mat(s, '#ece0c6', { lo: .3 }), peg: mat(s, '#d8b07a'), pegD: mat(s, '#8a9098'), sock: mat(s, '#e8e4dc'), sockR: mat(s, '#5a8ac8') });
const tatCap = (s, m, cx, w, tilt) => { /* dome, the torn hem, the hole */
  s.ell(cx, 11, w, 7.4, m.cap); s.rect(cx - w, 11, w * 2 + 1, 3, m.cap);
  /* the hem torn into tatters: hanging strips and bites out of it */
  for (let x = Math.ceil(cx - w); x <= cx + w; x++) { const k = ((x - cx + 20) * 5) % 7; if (k < 2) { s.set(x, 14, m.cap, 2); s.set(x, 15, m.cap, 1); } else if (k === 4 || k === 5) { s.set(x, 13, null); if (k === 4) s.set(x, 12, null); } }
  relight(s, m.cap, cx - 1 + tilt, 10, w + 2, 9); for (const [a, b] of [[4, 7], [5, 7], [4, 8], [5, 8]]) s.set(cx + a, b, null); };
const peg = (s, m, x, y) => { s.rect(x, y, 2, 7, m.peg); s.set(x, y + 3, m.pegD, 2); s.set(x + 1, y + 3, m.pegD, 2); s.line(x, y + 4, x + 1, y + 4, m.pegD, 1); };
const tatFront = () => { const s = pane(), m = tatMats(s);
  s.ell(12.5, 28.6, 2.6, 1.3, m.stalk); s.ell(19.5, 28.6, 2.6, 1.3, m.stalk);
  s.ell(16, 21.5, 5.4, 6.6, m.stalk); relight(s, m.stalk, 14, 18, 7, 8);
  /* the sock, held up in the right hand and hanging */
  tube(s, [[20.5, 19], [23, 17], [24, 15]], 1.3, 1.1, m.stalk); s.poly([[23, 14], [26, 14], [26.5, 22], [29, 24], [28.5, 26], [24.5, 25], [24, 18]], m.sock); s.edges(m.sock);
  swap(s, m.sock, m.sockR, (x, y) => y % 3 === 0); s.ell(23.5, 14.5, 1.4, 1.3, m.stalk);
  tube(s, [[11.5, 19], [9.5, 22], [9.5, 23.5]], 1.3, 1.1, m.stalk);
  s.ell(16, 14.6, 8, 2.2, m.gill, { flat: 2 });
  tatCap(s, m, 16, 12, 0);
  peg(s, m, 5, 10);
  s.outline();
  for (let x = 9; x <= 23; x++) if (s.get(x, 15) === m.gill) s.set(x, 15, m.gill, x % 2 ? 1 : 2);
  for (const [x, y] of [[11, 6], [15, 4], [8, 10], [17, 9], [24, 11]]) { s.fix(x, y, '#f8ecf0'); s.fix(x + 1, y, '#e0c4d4'); s.fix(x, y + 1, '#d8b8cc'); }
  /* the face under the brim: wide eyes, a wicked grin */
  eye(s, 13, 18, { kind: 'big' }); eye(s, 18, 18, { kind: 'big' }); dots(s, [[12, 17], [13, 17], [19, 17], [20, 17]], m.stalk, 0);
  dots(s, [[13, 22], [14, 23], [15, 23], [16, 23], [17, 23], [18, 22]], m.stalk, 0); s.fix(15, 24, '#4a2a3a'); s.fix(16, 24, '#4a2a3a');
  s.fix(12, 21, '#e8a0a0'); s.fix(19, 21, '#e8a0a0');
  return s; };
const tatSide = () => { const s = pane(), m = tatMats(s);
  /* running: the sock trailing behind like a flag */
  s.poly([[9, 17], [9, 20], [3, 21], [1, 19.5], [2, 17.5]], m.sock); s.edges(m.sock); swap(s, m.sock, m.sockR, (x, y) => x % 3 === 0);
  tube(s, [[13, 19], [10.5, 18.5]], 1.3, 1.1, m.stalk); s.ell(10, 18.4, 1.4, 1.3, m.stalk);
  tube(s, [[14, 25], [11, 28]], 1.6, 1.3, m.stalk); s.ell(10.6, 28.6, 2.4, 1.2, m.stalk);
  s.ell(16, 21.5, 5, 6.4, m.stalk); relight(s, m.stalk, 14, 18, 7, 8);
  tube(s, [[17, 26], [20, 28.4]], 1.6, 1.3, m.stalk); s.ell(21, 28.6, 2.6, 1.2, m.stalk);
  tube(s, [[19, 19], [22.5, 20], [24, 18.5]], 1.3, 1.1, m.stalk);
  s.ell(15.5, 14.8, 8, 2, m.gill, { flat: 2 });
  tatCap(s, m, 15, 12, -2);
  peg(s, m, 24, 10);
  s.outline();
  for (let x = 8; x <= 22; x++) if (s.get(x, 15) === m.gill) s.set(x, 15, m.gill, x % 2 ? 1 : 2);
  for (const [x, y] of [[9, 7], [14, 4], [6, 10], [16, 9], [22, 11]]) { s.fix(x, y, '#f8ecf0'); s.fix(x + 1, y, '#e0c4d4'); s.fix(x, y + 1, '#d8b8cc'); }
  eye(s, 19, 18, { kind: 'big' }); dots(s, [[18, 17], [19, 17]], m.stalk, 0);
  dots(s, [[17, 22], [18, 23], [19, 23], [20, 22]], m.stalk, 0); s.fix(19, 24, '#4a2a3a'); s.fix(21, 21, '#e8a0a0');
  return s; };
own('tattercap', tatFront, tatSide);

/* ================= Thicket spider (Willowbrook, Lv 6): the size of a dinner plate and twice as pleased to see you == */
/* a leggy olive spider up on tiptoe, legs banded pale at every joint, a round abdomen marked with a bramble-leaf
   chevron, two big glossy eyes and four small ones over a pair of fangs set in a delighted grin; signature: the line
   of its own good silk, the stuff bowstrings are made of, running from its spinnerets */
const spiMats = s => ({ body: mat(s, '#5a6448', { lo: .42 }), abd: mat(s, '#5a6448', { lo: .42 }), leg: mat(s, '#5a6644', { hi: .34 }), legF: mat(s, '#3c4430'), band: mat(s, '#c8c08a'), mark: mat(s, '#a8a858'), fang: mat(s, '#e8dcc0') });
const SILK = ['#f4f0e8', '#b8b4ac'];
/* a jointed leg: hip, knee up high, foot on the ground; a pale band at the knee */
const spiLeg = (s, m, mat2, hx, hy, kx, ky, fx, fy) => { s.line(hx, hy, kx, ky, mat2, 3); s.line(hx, hy + 1, kx, ky + 1, mat2, 1); s.line(kx, ky, fx, fy, mat2, 2); s.line(kx + (fx > kx ? 1 : -1), ky + 1, fx, fy, mat2, 1); s.set(kx, ky, m.band, 4); s.set(Math.round((kx + fx) / 2), Math.round((ky + fy) / 2), m.band, 2); s.set(fx, fy, m.band, 2); };
const spiFront = () => { const s = pane(), m = spiMats(s);
  /* the silk line from above */
  for (let y = 0; y <= 8; y++) s.fix(16, y, SILK[y % 3 === 0 ? 1 : 0]);
  /* the abdomen behind, up high */
  s.ell(16, 13, 6.4, 5.4, m.abd); relight(s, m.abd, 15, 11, 7, 6);
  /* back legs first (darker), then front legs */
  for (const d of [-1, 1]) { const X = x => 16 + d * x;
    spiLeg(s, m, m.legF, X(4), 18, X(10), 12, X(13), 28); spiLeg(s, m, m.legF, X(4), 19, X(8), 14, X(9), 29);
    spiLeg(s, m, m.leg, X(4), 20, X(12), 15, X(15), 29); spiLeg(s, m, m.leg, X(3), 21, X(6), 17, X(6), 29); }
  /* the head and thorax */
  s.ell(16, 20.5, 5, 4.4, m.body); relight(s, m.body, 15, 18, 6, 5); contact(s, m.body, m.abd, 0);
  s.outline();
  for (const [x, y] of [[16, 10], [15, 11], [17, 11], [14, 12], [18, 12], [16, 13], [16, 15]]) s.set(x, y, m.mark, 3);
  /* the faces: two big glossy eyes, four small, fangs in a grin */
  eye(s, 13, 19, { kind: 'big', white: '#3a2a30', ink: '#0e0a0e' }); eye(s, 18, 19, { kind: 'big', white: '#3a2a30', ink: '#0e0a0e' });
  s.fix(14, 19, '#2a1a20'); s.fix(19, 19, '#2a1a20'); for (const [x, y] of [[12, 17], [15, 17], [17, 17], [20, 17]]) s.fix(x, y, '#c83a3a');
  dots(s, [[13, 22], [14, 23], [15, 23], [16, 23], [17, 23], [18, 22]], m.body, 0); s.fix(14, 24, '#e8dcc0'); s.fix(17, 24, '#e8dcc0'); s.fix(14, 25, '#a89a7a'); s.fix(17, 25, '#a89a7a');
  return s; };
const spiSide = () => { const s = pane(), m = spiMats(s);
  /* far legs (darker), then the abdomen raised behind, the silk line it came down on */
  for (const [hx, kx, ky, fx] of [[17, 10, 12, 5], [18, 15, 11, 12], [19, 21, 11, 20], [20, 26, 13, 28]]) spiLeg(s, m, m.legF, hx, 18, kx, ky, fx, 29);
  s.ell(10, 15, 6.2, 5.4, m.abd); relight(s, m.abd, 9, 13, 7, 6);
  s.ell(20, 18.5, 4.6, 3.8, m.body); relight(s, m.body, 19, 16, 6, 5); contact(s, m.body, m.abd, 0);
  for (const [hx, kx, ky, fx] of [[18, 8, 14, 3], [19, 13, 13, 9], [21, 22, 12, 23], [22, 28, 15, 30]]) spiLeg(s, m, m.leg, hx, 20, kx, ky, fx, 29);
  s.outline();
  for (const [x, y] of [[9, 11], [8, 12], [10, 12], [7, 13], [11, 13], [9, 14], [9, 16]]) s.set(x, y, m.mark, 3);
  for (let y = 0; y <= 9; y++) s.fix(8 - (y >> 2), y, SILK[y % 3 === 0 ? 1 : 0]);
  eye(s, 22, 16, { kind: 'big', white: '#3a2a30', ink: '#0e0a0e' }); s.fix(23, 16, '#2a1a20'); s.fix(21, 15, '#c83a3a'); s.fix(24, 15, '#c83a3a');
  s.fix(24, 20, '#e8dcc0'); s.fix(24, 21, '#e8dcc0'); s.fix(24, 22, '#a89a7a'); dots(s, [[21, 20], [22, 20], [23, 20]], m.body, 0);
  return s; };
own('thicket_spider', spiFront, spiSide);

/* ================= Mossback spider (Mossbarrow, Lv 12): lets moss grow on its back to pass for a rock ============ */
/* squat, short-legged and heavy: almost all of it is a grey field boulder furred with moss, a sprig of tiny flowers and
   a toadstool on top, with only a row of red eyes and two hooked fangs showing under the front edge; signature: the
   rock-and-moss back itself ("It is not a rock") */
const mossMats = s => ({ rock: mat(s, '#8a8a84', { lo: .42 }), moss: mat(s, '#6a9a44', { hi: .32 }), mossD: mat(s, '#4a6e32'), leg: mat(s, '#5a4e3a'), legF: mat(s, '#3a3428'), under: mat(s, '#3a3628'), cap: mat(s, '#c84a3a'), stem: mat(s, '#ece0c4'), fang: mat(s, '#d8c8a0') });
const mossTop = (s, m, cx, cy, rx, ry) => { s.ell(cx, cy + 1, rx, ry - 1, m.rock); s.ell(cx - rx * .45, cy - ry * .25, rx * .5, ry * .62, m.rock); s.ell(cx + rx * .4, cy - ry * .35, rx * .52, ry * .66, m.rock);
  relight(s, m.rock, cx - rx * .3, cy - ry * .5, rx * 1.05, ry * 1.1);
  swap(s, m.rock, m.moss, (x, y) => y < cy - ry * .15 + Math.sin(x * 1.1) * 1.8); swap(s, m.moss, m.mossD, (x, y) => (x * 3 + y * 5) % 7 === 0 || (x * 5 + y) % 11 === 0);
  /* two cracks in the stone */
  for (const [x0, y0, pts] of [[cx - rx * .5, cy + 2, [[1, 1], [2, 1], [2, 2], [3, 3]]], [cx + rx * .3, cy + 1, [[0, 1], [1, 2], [0, 3], [1, 4]]]]) for (const [a, b] of pts) if (s.get(Math.round(x0 + a), Math.round(y0 + b)) === m.rock) s.set(x0 + a, y0 + b, m.rock, 0); };
const mossLeg = (s, mm, hx, hy, kx, ky, fx) => { tube(s, [[hx, hy], [kx, ky], [fx, 29]], 1.1, .8, mm, { flat: 2 }); s.set(kx, ky, mm, 4); s.set(kx, ky + 1, mm, 3); };
const mossFront = () => { const s = pane(), m = mossMats(s);
  for (const d of [-1, 1]) { const X = x => 16 + d * x;
    mossLeg(s, m.legF, X(9), 20, X(14), 14.5, X(15)); mossLeg(s, m.legF, X(7), 22, X(12.5), 18, X(13)); }
  s.ell(16, 24, 7, 3.4, m.under);
  mossTop(s, m, 16, 17, 12, 8.6);
  /* a toadstool and a sprig of flowers on top */
  for (const d of [-1, 1]) { const X = x => 16 + d * x; mossLeg(s, m.leg, X(6), 23, X(9.5), 21.5, X(9.5)); mossLeg(s, m.leg, X(3), 24, X(5), 23, X(4.5)); }
  s.rect(21, 7, 1, 3, m.stem); s.ell(21.5, 6.5, 2.4, 1.4, m.cap); s.line(10, 9, 10, 6, m.mossD, 2);
  s.outline();
  s.fix(20, 6, '#f4e4d8'); s.fix(22, 6, '#f4e4d8');
  for (const [x, y] of [[9, 5], [11, 6], [10, 4]]) s.fix(x, y, '#f0e8f8'); s.fix(10, 5, '#f0c840');
  /* the eyes and fangs under the rim */
  for (const x of [12, 14, 18, 20]) s.fix(x, 25, '#e83a2a'); s.fix(15, 25, '#ff8a6a'); s.fix(17, 25, '#ff8a6a'); s.fix(15, 26, '#a81a1a'); s.fix(17, 26, '#a81a1a');
  s.fix(14, 27, '#d8c8a0'); s.fix(18, 27, '#d8c8a0'); s.fix(14, 28, '#8a7a5a'); s.fix(18, 28, '#8a7a5a');
  return s; };
const mossSide = () => { const s = pane(), m = mossMats(s);
  for (const [hx, kx, ky, fx] of [[8, 2, 15, 1], [12, 8, 18, 6], [17, 20, 18, 20], [20, 27, 15, 29]]) mossLeg(s, m.legF, hx, 21, kx, ky, fx);
  s.ell(22, 23, 4, 3, m.under);
  mossTop(s, m, 14, 18, 12, 8.4);
  for (const [hx, kx, ky, fx] of [[10, 5, 19, 3.5], [14, 12, 22, 10.5], [18, 22, 21.5, 23], [21, 28, 18, 30]]) mossLeg(s, m.leg, hx, 23, kx, ky, fx);
  s.rect(9, 8, 1, 3, m.stem); s.ell(9.5, 7.5, 2.4, 1.4, m.cap); s.line(18, 10, 18, 7, m.mossD, 2);
  s.outline();
  s.fix(8, 7, '#f4e4d8'); s.fix(10, 7, '#f4e4d8');
  for (const [x, y] of [[17, 6], [19, 7], [18, 5]]) s.fix(x, y, '#f0e8f8'); s.fix(18, 6, '#f0c840');
  for (const [x, y] of [[24, 22], [26, 23]]) s.fix(x, y, '#e83a2a'); s.fix(25, 22, '#ff8a6a'); s.fix(25, 23, '#a81a1a');
  s.fix(26, 25, '#d8c8a0'); s.fix(26, 26, '#8a7a5a');
  return s; };
own('mossback_spider', mossFront, mossSide);

/* ================= Haunted scarecrow (Mossbarrow, Lv 16): straw and old grudges; moves when you're not looking ===== */
/* a burlap sack for a head with a stitched grin and a candle-glow behind the eye holes, a battered straw hat, a patched
   coat on a crossbar with straw bursting from the cuffs, hem and collar, stuck on its post; signature: the crow that
   rides on its arm and won't leave */
const scareMats = s => ({ sack: mat(s, '#c8a878', { lo: .38 }), hat: mat(s, '#d8b860', { lo: .4 }), band: mat(s, '#8a3a2a'), coat: mat(s, '#7a4a3a', { lo: .38 }), patch: mat(s, '#6a7a4a'), straw: mat(s, '#e8c860'), post: mat(s, '#6a4e32'), coatF: mat(s, '#583428'), crow: mat(s, '#3e3c52', { hi: .45, gl: .7 }), beak: mat(s, '#e0a040'), stitch: mat(s, '#3a2418') });
const GLOW = ['#fff2a0', '#ffb040', '#a84a10'];
const straws = (s, m, pts) => pts.forEach(([x, y, dx, dy]) => { s.line(x, y, x + dx, y + dy, m.straw, 3); });
const crow = (s, m, x, y, d = 1) => { s.ell(x, y, 2.6, 2, m.crow); s.ell(x + d * 2, y - 2, 1.8, 1.6, m.crow); s.poly([[x - d * 2, y], [x - d * 5, y + 2], [x - d * 2, y + 2]], m.crow); s.line(x + d * 3.5, y - 2, x + d * 5, y - 1.5, m.beak, 3); };
const scareFront = () => { const s = pane(), m = scareMats(s);
  /* the post, then the legs dangling either side of it */
  s.rect(15, 22, 2, 8, m.post); s.rect(12, 24, 2, 4, m.coat); s.rect(18, 24, 2, 4, m.coat); straws(s, m, [[12, 28, -1, 1], [13, 28, 0, 1], [18, 28, 0, 1], [19, 28, 1, 1]]);
  /* the crossbar arms, out straight, straw hands */
  s.rect(3, 14, 26, 3, m.coat); straws(s, m, [[3, 15, -2, -1], [3, 16, -2, 1], [2, 15, -2, 0], [28, 15, 2, -1], [28, 16, 2, 1], [29, 15, 2, 0]]);
  /* the coat, patched, straw at the hem */
  slab(s, [[11, 13], [21, 13], [22, 25], [10, 25]], m.coat); s.rect(18, 18, 3, 3, m.patch); s.rect(6, 14, 3, 3, m.patch); s.line(16, 14, 16, 24, m.coat, 1);
  straws(s, m, [[11, 25, -1, 2], [13, 25, 0, 2], [20, 25, 1, 2], [17, 25, 0, 1]]);
  /* the sack head tied at the neck, the hat */
  s.ell(16, 9, 5.4, 4.8, m.sack); s.rect(13, 13, 7, 1, m.stitch);
  s.ell(16, 3.5, 4, 2.4, m.hat); s.rect(7, 5, 18, 2, m.hat); s.rect(12, 4, 9, 1, m.band); s.set(9, 6, null); s.set(23, 5, null);
  crow(s, m, 4.5, 11, 1);
  s.outline();
  /* the face: two burnt holes with a glow behind, a stitched grin */
  s.fix(13, 9, GLOW[0]); s.fix(14, 9, GLOW[1]); s.fix(13, 10, GLOW[1]); s.fix(14, 10, GLOW[2]); s.fix(18, 9, GLOW[0]); s.fix(19, 9, GLOW[1]); s.fix(18, 10, GLOW[1]); s.fix(19, 10, GLOW[2]);
  for (let x = 12; x <= 20; x++) s.set(x, 12, m.stitch, x % 2 ? 0 : 2); for (const x of [13, 15, 17, 19]) s.set(x, 11, m.stitch, 0);
  for (const [x, y] of [[19, 19], [20, 18]]) s.set(x, y, m.stitch, 0);
  s.fix(6, 9, '#f0d040'); s.fix(7, 9, '#1a1418');
  for (const [x, y] of [[15, 13], [17, 13], [14, 13]]) s.fix(x, y, '#e8c860');
  return s; };
const scareSide = () => { const s = pane(), m = scareMats(s);
  s.rect(14, 22, 2, 8, m.post); s.rect(12, 24, 2, 4, m.coat); s.rect(17, 24, 2, 4, m.coat); straws(s, m, [[12, 28, -1, 1], [17, 28, 1, 1], [18, 28, 1, 1]]);
  /* off its crossbar now: both arms reaching for you, the far one lower, straw fingers clawing */
  s.rect(18, 17, 8, 2, m.coatF); straws(s, m, [[26, 17, 2, -1], [26, 18, 2, 1]]);
  slab(s, [[10, 13], [20, 13], [21, 25], [9, 25]], m.coat); s.rect(11, 18, 3, 3, m.patch);
  straws(s, m, [[10, 25, -1, 2], [13, 25, 0, 2], [19, 25, 1, 2], [9, 14, -2, -1], [9, 15, -2, 0]]);
  s.rect(16, 13, 12, 3, m.coat); s.line(17, 15, 27, 15, m.coat, 1); straws(s, m, [[28, 13, 2, -2], [28, 14, 3, 0], [28, 15, 2, 2]]); contact(s, m.coat, [m.patch, m.coatF]);
  /* the sack head leaning forward, the hat tipped down over it, the crow on the brim */
  s.ell(17, 9, 5.2, 4.8, m.sack); s.poly([[21, 8], [24, 10], [21, 12]], m.sack); s.rect(14, 13, 7, 1, m.stitch);
  s.ell(16, 3.6, 4, 2.4, m.hat); s.poly([[8, 5], [26, 4.5], [26, 6.5], [8, 7]], m.hat); s.rect(12, 4, 9, 1, m.band);
  crow(s, m, 10, 3, -1);
  s.outline();
  s.fix(20, 9, GLOW[0]); s.fix(21, 9, GLOW[1]); s.fix(20, 10, GLOW[1]); s.fix(21, 10, GLOW[2]);
  for (let x = 17; x <= 23; x++) s.set(x, 12, m.stitch, x % 2 ? 0 : 2); for (const x of [18, 20, 22]) s.set(x, 11, m.stitch, 0);
  s.fix(8, 1, '#f0d040'); s.fix(7, 1, '#1a1418');
  return s; };
own('scarecrow', scareFront, scareSide);

/* ================= The Rootbound (Mossbarrow, Lv 17): the wood's sleepers, stirring ============================== */
/* a tall, stooped figure of oak bark lashed round and round with pale living roots, moss on its shoulders, arms so long
   the root-fingers drag, roots spreading from its feet into the ground; a long knotted face caught mid-yawn, eyes still
   heavy-lidded and glowing green; signature: the crown of oak leaves and acorns sprouting from its head */
const rootMats = s => ({ bark: mat(s, '#5a4230', { lo: .42 }), head: mat(s, '#6a5038', { lo: .42 }), arm: mat(s, '#4e3a2a'), root: mat(s, '#ccae7a', { lo: .38 }), rootD: mat(s, '#8a7048'), moss: mat(s, '#788754', { hi: .32 }),
  leaf: mat(s, '#6a9a3a', { hi: .35 }), acorn: mat(s, '#c8a060'), cup: mat(s, '#6a4a2a'), hole: s.mat(['#120a06', '#1a100a', '#22160e', '#22160e', '#22160e']) });
const ROOT_EYE = ['#e8ffb0', '#a8e040'];
const wrap = (s, m, pts) => pts.forEach(([a, b]) => tube(s, [a, b], .9, .8, m.root));
const rootFront = () => { const s = pane(), m = rootMats(s);
  /* roots out into the ground */
  for (const [a, b] of [[[13, 27], [6, 29.4]], [[14, 28], [10, 29.6]], [[18, 28], [22, 29.6]], [[19, 27], [27, 29.4]]]) tube(s, [a, b], 1, .5, m.rootD);
  tube(s, [[13.5, 21], [13, 28]], 2.2, 2.4, m.bark); tube(s, [[18.5, 21], [19, 28]], 2.2, 2.4, m.bark);
  /* the trunk, lashed with roots */
  s.poly([[10, 12], [22, 12], [21, 23], [11, 23]], m.bark); s.ell(16, 13.5, 6.6, 3, m.bark); relight(s, m.bark, 13, 12, 9, 12);
  wrap(s, m, [[[10.5, 14], [21, 19]], [[21.5, 14.5], [11, 21]], [[11, 22], [21, 23]], [[13, 21], [14, 27]], [[19, 21], [18, 27]]]);
  /* long arms, root fingers dragging */
  tube(s, [[10, 13], [7, 18], [5.5, 24]], 2, 1.6, m.arm); for (const [x, y] of [[3, 28.6], [5, 29], [7.5, 28.6]]) tube(s, [[5.5, 24.5], [x, y]], 1, .6, m.arm);
  tube(s, [[22, 13], [25, 18], [26.5, 24]], 2, 1.6, m.arm); for (const [x, y] of [[24.5, 28.6], [27, 29], [29, 28.6]]) tube(s, [[26.5, 24.5], [x, y]], 1, .6, m.arm); contact(s, m.arm, [m.bark, m.root]);
  s.ell(10, 12, 3, 1.8, m.moss); s.ell(22, 12, 3, 1.8, m.moss);
  /* the head: long and knotted, the leaf crown */
  s.ell(16, 7.6, 4.4, 5, m.head); relight(s, m.head, 15, 6, 6, 6);
  for (const [x, y] of [[9.5, 4], [12, 1.6], [16, 0.8], [20, 1.6], [22.5, 4], [11, 5.5], [21, 5.5]]) s.ell(x, y, 2.6, 1.8, m.leaf);
  s.outline();
  for (const [x, y] of [[12, 3], [20, 3]]) { s.set(x, y, m.cup, 2); s.set(x, y + 1, m.acorn, 3); s.set(x + 1, y + 1, m.acorn, 2); s.set(x + 1, y, m.cup, 1); }
  /* heavy-lidded eyes and a yawn */
  dots(s, [[13, 6], [14, 6], [18, 6], [19, 6]], m.head, 0); s.fix(13, 7, ROOT_EYE[0]); s.fix(14, 7, ROOT_EYE[1]); s.fix(18, 7, ROOT_EYE[1]); s.fix(19, 7, ROOT_EYE[0]);
  s.ell(16, 10.5, 1.4, 1.8, m.hole, { flat: 2 }); s.set(16, 8, m.head, 4); s.set(16, 9, m.head, 3);
  for (const [x, y] of [[13, 16], [19, 20], [15, 22]]) s.set(x, y, m.root, 4);
  return s; };
const rootSide = () => { const s = pane(), m = rootMats(s);
  for (const [a, b] of [[[11, 27], [3, 29.4]], [[12, 28], [7, 29.6]], [[18, 28], [22, 29.6]]]) tube(s, [a, b], 1, .5, m.rootD);
  /* the far arm hanging behind */
  tube(s, [[12, 13], [10, 19], [9.5, 24]], 1.8, 1.4, m.rootD); for (const [x, y] of [[7.5, 28.6], [10, 29]]) tube(s, [[9.5, 24.5], [x, y]], .9, .6, m.rootD);
  tube(s, [[13, 21], [12, 28]], 2.2, 2.4, m.bark); tube(s, [[17, 21], [18.5, 28]], 2.2, 2.4, m.bark);
  /* the trunk stooped forward */
  s.poly([[11, 13], [20, 11], [21, 22], [11, 23]], m.bark); s.ell(16, 12.5, 5.6, 3, m.bark); relight(s, m.bark, 14, 12, 8, 12);
  wrap(s, m, [[[11, 15], [20.5, 19]], [[20.5, 13], [11.5, 21]]]);
  s.ell(15, 11, 3.6, 1.8, m.moss);
  /* the head pushed forward, the leaf crown */
  s.ell(21, 8, 4.2, 4.6, m.head); s.poly([[23, 6], [27, 9], [24, 11]], m.head); relight(s, m.head, 20, 6, 6, 6); contact(s, m.head, m.bark);
  for (const [x, y] of [[16, 4], [18.5, 1.8], [22, 1.6], [25, 3.6], [17, 6]]) s.ell(x, y, 2.6, 1.8, m.leaf);
  /* the near arm reaching forward and down, root fingers spread */
  tube(s, [[18, 13], [23, 17], [26, 22]], 2, 1.6, m.arm); for (const [x, y] of [[26, 28.6], [28.5, 28], [30, 25.6]]) tube(s, [[26.5, 22.5], [x, y]], 1, .6, m.arm); contact(s, m.arm, [m.bark, m.root]);
  s.outline();
  for (const [x, y] of [[18, 2], [23, 2]]) { s.set(x, y, m.cup, 2); s.set(x, y + 1, m.acorn, 3); }
  dots(s, [[22, 6], [23, 6]], m.head, 0); s.fix(22, 7, ROOT_EYE[1]); s.fix(23, 7, ROOT_EYE[0]);
  s.ell(23.5, 10.5, 1.2, 1.4, m.hole, { flat: 2 });
  return s; };
own('rootbound', rootFront, rootSide);

/* ================= Poacher (Mossbarrow, Lv 11): sets snares in the Bramble glades; carries an axe for arguments ==== */
/* a stubbled, narrow-eyed man in olive and brown, a coil of snare wire on his belt and a brace of rabbits at his hip, a
   hatchet in his fist; signature: he wears a whole wolf pelt as a hood, ears up, the wolf's upper jaw and fangs over his
   brow and its grey fur falling over his shoulders like a cape */
const poachMats = s => ({ skin: mat(s, '#c89a74'), coat: mat(s, '#4e5434'), trous: mat(s, '#5a4a32'), boot: mat(s, '#33261c'), belt: mat(s, '#2e2016'),
  pelt: mat(s, '#857c70', { lo: .4 }), peltD: mat(s, '#5a5248'), pale: mat(s, '#d8d4cc'), wood: mat(s, '#7a5a36'), steel: mat(s, '#b8c0c8', { gl: .78 }), rab: mat(s, '#8a7058'), wire: mat(s, '#c8c8c0') });
const STUBBLE = '#8a6650';
const poachFront = () => { const s = pane(), m = poachMats(s);
  s.rect(12, 23, 3, 5, m.trous); s.rect(17, 23, 3, 5, m.trous); s.ell(12.5, 28.6, 2.8, 1.3, m.boot); s.ell(19.5, 28.6, 2.8, 1.3, m.boot);
  /* the pelt cape behind his shoulders */
  s.poly([[9, 12], [23, 12], [25, 22], [21, 20], [16, 23], [11, 20], [7, 22]], m.pelt); relight(s, m.pelt, 12, 12, 10, 10);
  slab(s, [[11, 14], [21, 14], [21, 24], [11, 24]], m.coat); s.rect(11, 20, 10, 2, m.belt); s.fix(16, 20, '#c8a048');
  /* the rabbits on his left hip, hung by the feet */
  for (const x of [8, 10]) { s.ell(x, 23.5, 1.4, 2.8, m.rab); s.line(x, 26, x - 1, 28, m.rab, 2); }
  s.line(8, 20, 11, 20, m.belt, 2);
  /* arms: the hatchet in his right fist */
  tube(s, [[11, 15], [9.5, 19], [10, 21]], 1.5, 1.3, m.coat); tube(s, [[21, 15], [22.5, 19], [23, 21]], 1.5, 1.3, m.coat);
  s.line(23, 25, 24.5, 13, m.wood, 2); s.poly([[23.5, 12], [28, 10.5], [28.5, 15], [24.5, 15.5]], m.steel); s.edges(m.steel); s.ell(23, 21.5, 1.6, 1.5, m.skin); s.ell(10, 21.5, 1.5, 1.4, m.skin);
  /* the face under the wolf's jaw */
  s.ell(16, 11, 4.6, 4.2, m.skin); relight(s, m.skin, 15, 9, 6, 5);
  /* the wolf's head worn as a hood: ears up, its eyes on his crown, its upper jaw and fangs over his forehead, its
     forelegs knotted across his chest */
  s.poly([[9.5, 6], [10, 0], [14, 4]], m.peltD); s.poly([[22.5, 6], [22, 0], [18, 4]], m.pelt);
  s.ell(16, 5, 6.8, 3.6, m.pelt); s.rect(9.5, 5, 3, 4, m.pelt); s.rect(19.5, 5, 3, 4, m.pelt); relight(s, m.pelt, 13, 3, 9, 6);
  s.poly([[12, 6], [20, 6], [19.5, 8.6], [12.5, 8.6]], m.pale);
  tube(s, [[10.5, 13], [14, 16], [16, 16.6]], 1.2, 1, m.peltD); tube(s, [[21.5, 13], [18, 16], [16, 16.6]], 1.2, 1, m.peltD); s.ell(16, 16.6, 1.4, 1.2, m.peltD);
  s.outline();
  s.fix(15, 6, '#22181c'); s.fix(16, 6, '#22181c'); s.fix(17, 6, '#22181c'); s.fix(16, 7, '#3a3034');
  for (const x of [13, 15, 17, 19]) s.fix(x, 9, '#f4ecd8'); s.fix(13, 10, '#c8c0b0'); s.fix(19, 10, '#c8c0b0');
  s.fix(12, 4, '#f2b030'); s.fix(20, 4, '#f2b030'); s.fix(13, 4, '#3a2a10'); s.fix(19, 4, '#3a2a10'); dots(s, [[11, 2], [11, 3], [21, 2], [21, 3]], m.peltD, 1);
  /* narrow, sideways eyes; stubble; a flat mouth */
  s.fix(13, 12, '#2a1c1f'); s.fix(14, 12, '#f4efe4'); s.fix(18, 12, '#2a1c1f'); s.fix(19, 12, '#f4efe4'); dots(s, [[13, 11], [14, 11], [18, 11], [19, 11]], m.skin, 0);
  for (const [x, y] of [[13, 14], [15, 15], [17, 15], [19, 14], [14, 15], [18, 15]]) s.fix(x, y, STUBBLE); dots(s, [[15, 14], [16, 14], [17, 14]], m.skin, 0);
  for (const [x, y] of [[20, 19], [19, 18], [20, 17], [21, 18]]) s.fix(x, y, '#c8c8c0');
  s.fix(25, 11, '#ffffff'); dots(s, [[8, 22], [10, 22]], m.rab, 4);
  return s; };
const poachSide = () => { const s = pane(), m = poachMats(s);
  /* a stalking crouch, knees bent */
  tube(s, [[13, 22], [11, 25], [12, 28]], 1.6, 1.4, m.trous); s.ell(13, 28.6, 2.8, 1.3, m.boot);
  tube(s, [[17, 22], [20, 25], [19, 28]], 1.6, 1.4, m.trous); s.ell(20.5, 28.6, 2.8, 1.3, m.boot);
  s.poly([[11, 9], [17, 11], [16.5, 18], [12, 19.5], [8.5, 17]], m.pelt); relight(s, m.pelt, 10, 10, 8, 9);
  slab(s, [[12, 13], [20, 13], [21, 23], [12, 23]], m.coat); s.rect(12, 19, 9, 2, m.belt);
  for (const x of [11, 13]) { s.ell(x, 23, 1.4, 2.8, m.rab); s.line(x, 25.5, x - 1, 27.5, m.rab, 2); }
  /* the face, the wolf's head over it, muzzle forward */
  s.ell(19, 10.5, 4, 4.2, m.skin); s.poly([[22, 10], [24, 12], [22, 12.6]], m.skin); relight(s, m.skin, 18, 9, 5, 5);
  s.poly([[14, 5], [15, -0.5], [17.5, 4]], m.peltD); s.ell(17.5, 5.6, 5.2, 3.4, m.pelt); s.poly([[18, 3.6], [27.5, 5.6], [27.5, 8.2], [19, 8.4]], m.pelt); s.poly([[12.5, 6], [12, 12], [15.5, 9]], m.pelt); relight(s, m.pelt, 15, 3, 8, 7);
  tube(s, [[17, 11], [19, 14.5]], 1.2, 1, m.peltD);
  s.poly([[19, 7.8], [27, 8.2], [25.5, 9.4], [19, 9.4]], m.pale);
  /* the hatchet raised over his shoulder, ready */
  tube(s, [[19, 15], [22, 17], [24, 14]], 1.6, 1.3, m.coat); s.ell(24.4, 13.4, 1.6, 1.5, m.skin);
  s.line(23, 17, 26, 6, m.wood, 2); s.poly([[25, 5], [30, 3.5], [30.5, 8.5], [26, 8.5]], m.steel); s.edges(m.steel);
  s.outline();
  s.fix(27, 6, '#22181c'); s.fix(27, 5, '#3a3034'); for (const x of [20, 22, 24, 26]) s.fix(x, 9, '#f4ecd8'); s.fix(20, 10, '#c8c0b0'); s.fix(20, 5, '#f2b030'); dots(s, [[15, 2], [15, 3]], m.peltD, 1); for (const x of [19, 20]) s.fix(x, 15, '#e8dcc8');
  s.fix(21, 11, '#2a1c1f'); s.fix(22, 11, '#f4efe4'); dots(s, [[21, 10], [22, 10]], m.skin, 0);
  for (const [x, y] of [[20, 14], [22, 13], [21, 14], [19, 13]]) s.fix(x, y, STUBBLE); dots(s, [[21, 13], [22, 13]], m.skin, 0);
  s.fix(29, 4, '#ffffff');
  return s; };
own('poacher', poachFront, poachSide);

/* ================= Barrow ghoul (Mossbarrow, Lv 14): climbed out of the old barrows and liked the fresh air ======= */
/* a gaunt grey-green thing in a crouch, knees out, ribs showing, arms long enough to walk on its knuckles, the rags of
   its burial shroud round its middle, stringy hair over sunken sockets with pinprick lights in them; signature: the
   gold torc of a barrow chieftain still round its neck, and the grave-smell rising off it in green wisps */
const ghoulMats = s => ({ skin: mat(s, '#8a9a7a', { lo: .42 }), head: mat(s, '#8a9a7a', { lo: .42 }), limb: mat(s, '#748466'), limbF: mat(s, '#55634c'), shroud: mat(s, '#c8c2aa', { lo: .36 }), hair: mat(s, '#3e423a'),
  gold: mat(s, '#e0b040', { hi: .4, gl: .7 }), dirt: mat(s, '#5a4a36') });
const WISP = ['#b8e08a', '#6a9a5a'];
const GHOUL_EYE = '#e8ffb0';
const ghoulFront = () => { const s = pane(), m = ghoulMats(s);
  /* frog-crouched legs, knees out, clawed feet */
  tube(s, [[13, 21], [8.5, 23], [10, 28.4]], 1.8, 1.4, m.limb); tube(s, [[19, 21], [23.5, 23], [22, 28.4]], 1.8, 1.4, m.limb);
  for (const [x, d] of [[10, -1], [22, 1]]) { s.line(x, 29, x + d * 2.5, 29, m.limb, 2); s.line(x, 29, x - d * 1.5, 29, m.limb, 2); }
  /* long arms down to the ground, knuckles on it */
  tube(s, [[10, 12], [5.5, 18], [4.5, 27]], 1.7, 1.3, m.limbF); tube(s, [[22, 12], [26.5, 18], [27.5, 27]], 1.7, 1.3, m.limbF);
  for (const [x, d] of [[4.5, -1], [27.5, 1]]) for (const k of [-1, 0, 1]) s.line(x + k, 27, x + k + d * .5, 29, m.limbF, 1);
  /* a narrow, hunched trunk: ribs, the shroud rags */
  s.ell(16, 16.5, 6, 5.6, m.skin); relight(s, m.skin, 14, 13, 8, 7);
  for (const y of [15, 17, 19]) { s.line(12, y, 15, y + 1, m.skin, 1); s.line(20, y, 17, y + 1, m.skin, 1); }
  s.poly([[10, 20], [22, 20], [22, 23], [20, 26], [18, 23.5], [16, 27], [14, 23.5], [12, 26], [10, 23]], m.shroud); s.edges(m.shroud); s.line(12, 22, 20, 22, m.dirt, 1);
  /* the head low between bony shoulders, hair hanging */
  s.ell(9.5, 12, 2.4, 2, m.skin); s.ell(22.5, 12, 2.4, 2, m.skin);
  s.ell(16, 10, 4.6, 4.8, m.head); s.poly([[12.5, 11], [19.5, 11], [18.5, 15], [13.5, 15]], m.head); relight(s, m.head, 15, 8, 6, 6);
  for (const x of [11.5, 12.5, 19.5, 20.5]) s.line(x, 7, x + (x < 16 ? -.5 : .5), 14, m.hair, 1); s.ell(16, 6, 4.4, 1.6, m.hair);
  /* the torc */
  s.ell(16, 14.8, 4.2, 1.4, m.gold); s.set(16, 15, null); s.set(16, 14, null); s.set(15, 15, m.gold, 4); s.set(17, 15, m.gold, 4);
  s.outline();
  s.set(16, 15, m.skin, 1); s.set(16, 14, m.head, 2);
  /* sunken sockets, pinprick eyes, a lipless mouth of jagged teeth */
  for (const [x, y] of [[13, 9], [14, 9], [13, 10], [14, 10], [18, 9], [19, 9], [18, 10], [19, 10]]) s.set(x, y, m.head, 0); s.fix(14, 10, GHOUL_EYE); s.fix(18, 10, GHOUL_EYE);
  for (let x = 14; x <= 18; x++) s.set(x, 13, m.head, 0); for (const x of [14, 16, 18]) s.fix(x, 12, '#d8d0b0'); s.fix(15, 13, '#b8b090'); s.fix(17, 13, '#b8b090');
  for (const [x, y, k] of [[11, 3, 0], [10, 1, 1], [21, 4, 0], [22, 2, 1], [16, 1, 1], [12, 0, 1]]) s.fix(x, y, WISP[k]);
  return s; };
const ghoulSide = () => { const s = pane(), m = ghoulMats(s);
  /* the far limbs */
  tube(s, [[12, 20], [15, 23], [12, 28.4]], 1.6, 1.3, m.limbF); s.line(11, 29, 14, 29, m.limbF, 2);
  tube(s, [[19, 13], [21, 20], [21.5, 28.4]], 1.5, 1.2, m.limbF); s.line(20, 29, 23, 29, m.limbF, 2);
  /* the back curved high, the shroud rags hanging */
  s.ell(13, 15, 6.4, 5.6, m.skin); s.ell(18.5, 15, 4, 4, m.skin); relight(s, m.skin, 12, 11, 9, 7);
  for (const x of [10, 13, 16]) s.line(x, 13, x + 1, 17, m.skin, 1);
  s.poly([[7, 17], [15, 18], [14, 21], [12, 24], [11, 21], [9, 24], [8, 20]], m.shroud); s.edges(m.shroud);
  /* the near leg folded under, foot clawed */
  tube(s, [[10, 19], [15, 21], [11.5, 28.4]], 1.9, 1.4, m.limb); s.line(11, 29, 15, 29, m.limb, 2);
  /* the head thrust forward and low, hair hanging, the torc at its throat */
  s.ell(23.5, 15, 4.4, 4, m.head); s.poly([[25, 14], [29, 16.5], [27, 19], [24, 18.5]], m.head); relight(s, m.head, 23, 13, 5, 5); contact(s, m.head, m.skin);
  for (const x of [20.5, 21.5, 22.5]) s.line(x, 12, x - .5, 19, m.hair, 1); s.ell(22.5, 11.5, 3.4, 1.4, m.hair);
  s.ell(20.5, 18.5, 1.6, 2.6, m.gold);
  /* the near arm reaching forward, claws down */
  tube(s, [[19, 15], [24, 21], [27, 25]], 1.8, 1.3, m.limb); for (const k of [-1, 0, 1]) s.line(27 + k, 25, 28.5 + k, 28.6, m.limb, 1); contact(s, m.limb, [m.skin, m.shroud]);
  s.outline();
  for (const [x, y] of [[25, 14], [26, 14], [25, 15], [26, 15]]) s.set(x, y, m.head, 0); s.fix(26, 15, GHOUL_EYE);
  for (let x = 26; x <= 28; x++) s.set(x, 17, m.head, 0); s.fix(27, 16, '#d8d0b0'); s.fix(28, 18, '#d8d0b0');
  s.set(20, 17, m.gold, 4);
  for (const [x, y, k] of [[10, 7, 0], [8, 5, 1], [14, 6, 0], [12, 3, 1], [6, 8, 1]]) s.fix(x, y, WISP[k]);
  return s; };
own('barrow_ghoul', ghoulFront, ghoulSide);

/* ================= Grave robber (Mossbarrow, Lv 15): digs up the barrows by night, swings the shovel at questions === */
/* a lean figure in a dark coat and a flat cap, a red muffler pulled up over nose and mouth so only a pair of shifty eyes
   show, a bulging sack on his back with a stolen gilt candlestick poking out; signature: the dirt-caked spade in one
   hand and the shuttered lantern in the other, its light leaking out of the slot */
const robMats = s => ({ coat: mat(s, '#3e3e4c', { lo: .3, hi: .34 }), coatD: mat(s, '#2c2c38'), cap: mat(s, '#4a4036'), scarf: mat(s, '#8a3434'), skin: mat(s, '#c89a7a'), boot: mat(s, '#241c18'),
  wood: mat(s, '#8a6a42'), spade: mat(s, '#8a929c', { gl: .7 }), dirt: mat(s, '#5a4632'), sack: mat(s, '#9a8460'), gold: mat(s, '#e0b440', { gl: .72 }), lamp: mat(s, '#3a342e'), glass: s.mat(['#5a2a08', '#c86a1a', '#f0a030', '#ffd860', '#fff6c0']) });
const LAMP_LIGHT = ['#ffd860', '#c8801a'];
const robFront = () => { const s = pane(), m = robMats(s);
  /* the sack behind, a candlestick out of its neck */
  s.ell(21.5, 14, 5, 5.6, m.sack); s.line(23, 9, 25, 3, m.gold, 3); s.rect(23.5, 2, 3, 1, m.gold); s.set(25, 1, m.gold, 4);
  s.rect(12, 23, 3, 5, m.coatD); s.rect(17, 23, 3, 5, m.coatD); s.ell(12.5, 28.6, 2.8, 1.3, m.boot); s.ell(19.5, 28.6, 2.8, 1.3, m.boot);
  /* the long coat */
  slab(s, [[11, 14], [21, 14], [22.5, 26], [9.5, 26]], m.coat); s.line(16, 15, 16, 25, m.coatD, 2); s.rect(10, 19, 12, 1, m.coatD);
  /* the spade upright in his right hand, the lantern hung from his left */
  s.line(24, 26, 24, 11, m.wood, 3); s.line(25, 26, 25, 11, m.wood, 1); s.rect(23, 9, 3, 2, m.wood); s.poly([[22.5, 26], [26.5, 26], [26.5, 29.5], [24.5, 30], [22.5, 29.5]], m.spade); s.edges(m.spade);
  tube(s, [[21, 15], [23, 18.5], [23.5, 20]], 1.5, 1.3, m.coat); s.ell(24, 20.5, 1.6, 1.5, m.skin);
  tube(s, [[11, 15], [9, 18.5], [8, 20]], 1.5, 1.3, m.coat); s.ell(8, 20.5, 1.5, 1.4, m.skin); s.line(8, 21, 8, 22, m.lamp, 1);
  s.rect(6, 23, 5, 5, m.lamp); s.rect(7, 22, 3, 1, m.lamp); s.rect(7, 24, 3, 2, m.glass);
  /* the head: cap, muffler, a strip of face */
  s.ell(16, 9.6, 4.8, 4.6, m.skin); relight(s, m.skin, 15, 8, 6, 5);
  s.poly([[11, 10.5], [21, 10.5], [21.5, 15], [10.5, 15]], m.scarf); s.edges(m.scarf); s.poly([[17, 13], [21, 13], [22, 17], [19, 17]], m.scarf);
  s.ell(16, 6.5, 5.4, 2.6, m.cap); s.poly([[10.5, 7], [22.5, 7], [23.5, 8.6], [10, 8.6]], m.cap); relight(s, m.cap, 14, 5, 7, 4);
  s.outline();
  dots(s, [[13, 12], [15, 12], [17, 12], [19, 12], [14, 14], [18, 14]], m.scarf, 1);
  s.fix(13, 9, '#ffffff'); s.fix(14, 9, '#2a1c1f'); s.fix(18, 9, '#ffffff'); s.fix(19, 9, '#2a1c1f'); dots(s, [[13, 8], [14, 8], [18, 8], [19, 8]], m.skin, 1);
  for (const [x, y] of [[23, 27], [25, 28], [24, 29]]) s.set(x, y, m.dirt, 2);
  s.fix(8, 24, LAMP_LIGHT[0]); s.fix(9, 25, LAMP_LIGHT[0]); for (const [x, y] of [[5, 25], [4, 26], [11, 25], [12, 27], [5, 29]]) s.fix(x, y, LAMP_LIGHT[1]);
  s.fix(22, 3, '#ffe880');
  return s; };
const robSide = () => { const s = pane(), m = robMats(s);
  s.ell(9, 14, 5, 5.6, m.sack); s.line(8, 9, 6, 3, m.gold, 3); s.rect(4.5, 2, 3, 1, m.gold);
  tube(s, [[13, 22], [11, 25], [11.5, 28]], 1.6, 1.4, m.coatD); s.ell(12.5, 28.6, 2.8, 1.3, m.boot);
  tube(s, [[17, 22], [19, 25], [19, 28]], 1.6, 1.4, m.coatD); s.ell(20.5, 28.6, 2.8, 1.3, m.boot);
  slab(s, [[12, 14], [20, 14], [21.5, 25], [10.5, 25]], m.coat); s.rect(11, 19, 10, 1, m.coatD); contact(s, m.coat, m.sack, 0);
  /* the lantern on his belt */
  s.rect(17, 20, 4, 4, m.lamp); s.rect(18, 21, 2, 2, m.glass);
  /* the spade raised in both hands, the blade forward */
  tube(s, [[17, 15], [20, 18], [22, 17]], 1.5, 1.3, m.coat); s.ell(22.5, 16.6, 1.6, 1.5, m.skin);
  s.line(16, 21, 27, 7, m.wood, 3); s.line(17, 21, 28, 7, m.wood, 1); s.poly([[26, 6], [29, 2], [31, 4.5], [29.5, 9]], m.spade); s.edges(m.spade);
  s.ell(19, 9.6, 4.2, 4.6, m.skin); relight(s, m.skin, 18, 8, 5, 5);
  s.poly([[15, 10.5], [23, 10.5], [24, 14], [15, 15]], m.scarf); s.edges(m.scarf); s.poly([[14, 12], [10, 15], [11, 17], [15, 14]], m.scarf);
  s.ell(18.5, 6.5, 5, 2.6, m.cap); s.poly([[14, 7], [24.5, 7], [25.5, 8.6], [13.5, 8.6]], m.cap); relight(s, m.cap, 17, 5, 7, 4);
  s.outline();
  dots(s, [[17, 12], [19, 12], [21, 12], [18, 14], [20, 14]], m.scarf, 1);
  s.fix(21, 9, '#ffffff'); s.fix(22, 9, '#2a1c1f'); dots(s, [[21, 8], [22, 8]], m.skin, 1);
  for (const [x, y] of [[28, 4], [30, 5], [29, 7]]) s.set(x, y, m.dirt, 2);
  s.fix(18, 21, LAMP_LIGHT[0]); for (const [x, y] of [[22, 22], [16, 24], [22, 25]]) s.fix(x, y, LAMP_LIGHT[1]);
  s.fix(5, 1, '#ffe880');
  return s; };
own('grave_robber', robFront, robSide);

/* ================= Bramble witch (Mossbarrow, Lv 18): throws thorns, curses and the occasional jar of jam ========= */
/* a short, round old woman with a hooked nose and a wart, a gap-toothed grin, a knitted plum shawl and a long green
   skirt whose hem has gone to bramble; her hair is a whole thicket, thorns and leaves and blackberries in it, and a
   thorny switch in one hand; signature: the jar of her famous jam, lid tied on with string, raised to throw */
const witchMats = s => ({ skin: mat(s, '#d0a088'), hair: mat(s, '#3e4a26', { lo: .42, hi: .32 }), leaf: mat(s, '#6a9a3a'), thorn: mat(s, '#a8784a'), berry: mat(s, '#3a1a3a', { hi: .45, gl: .8 }),
  shawl: mat(s, '#6a2a4a', { lo: .38 }), skirt: mat(s, '#3e4e2a'), apron: mat(s, '#a89a7a'), jar: s.mat(['#2a1a1e', '#7a1a2a', '#b82a3a', '#e85a5a', '#ffc0b0']), glass: mat(s, '#c8e0e0'), lid: mat(s, '#ece4d4'), switch: mat(s, '#6a4a2a') });
const BERRY_SHINE = '#b8a0d0';
const thicket = (s, m, cx, cy, rx, ry) => { s.ell(cx, cy, rx, ry, m.hair); relight(s, m.hair, cx - rx * .3, cy - ry * .45, rx, ry);
  for (let i = 0; i < 9; i++) { const a = Math.PI * (.95 + i * .14), x = cx + Math.cos(a) * rx, y = cy + Math.sin(a) * ry; s.set(Math.round(x + Math.cos(a)), Math.round(y + Math.sin(a)), m.thorn, 3); } };
const witchFront = () => { const s = pane(), m = witchMats(s);
  /* the skirt, bramble at the hem */
  s.poly([[10, 18], [22, 18], [25, 28.6], [7, 28.6]], m.skirt); s.edges(m.skirt); s.poly([[13, 18], [19, 18], [20, 26], [12, 26]], m.apron); s.edges(m.apron);
  for (let x = 7; x <= 25; x += 3) { s.set(x, 29, m.thorn, 2); s.set(x + 1, 28, m.leaf, 3); }
  /* the shawl over round shoulders */
  s.ell(16, 17.4, 7.6, 4, m.shawl); s.poly([[12, 18], [20, 18], [16, 23]], m.shawl); relight(s, m.shawl, 14, 15, 9, 6);
  /* the switch in her left hand, the jam jar up in her right */
  s.line(5, 26, 8, 14, m.switch, 2); for (const [x, y] of [[6, 21], [7, 17], [6, 24]]) s.set(x - 1, y, m.thorn, 3); s.ell(8, 19.5, 1.6, 1.5, m.skin);
  tube(s, [[22, 15], [24.5, 12], [25, 9]], 1.5, 1.3, m.shawl); s.ell(25, 8.6, 1.6, 1.5, m.skin);
  s.rect(23, 2, 5, 6, m.jar); s.rect(23, 1, 5, 1, m.lid); s.rect(22.5, 0, 6, 1, m.lid); s.line(23, 2, 27, 2, m.glass, 3);
  /* the face, the thicket of hair above it */
  s.ell(16, 11, 4.6, 4.2, m.skin); relight(s, m.skin, 15, 9, 6, 5);
  thicket(s, m, 16, 4.4, 8.8, 4.2); s.ell(10.5, 9, 2, 3.4, m.hair); s.ell(21.5, 9, 2, 3.4, m.hair);
  s.outline();
  for (const [x, y] of [[9, 4], [13, 1], [18, 2], [22, 5], [11, 6]]) { s.set(x, y, m.berry, 2); s.set(x + 1, y, m.berry, 2); s.set(x, y + 1, m.berry, 1); s.fix(x, y, BERRY_SHINE); }
  for (const [x, y] of [[16, 1], [8, 6], [20, 5], [15, 5]]) { s.set(x, y, m.leaf, 3); s.set(x + 1, y, m.leaf, 2); }
  s.fix(23, 3, '#ffffff'); s.fix(25, 4, '#f8e0d8'); s.line(23, 1, 27, 1, null); s.fix(24, 1, '#8a6a48'); s.fix(26, 1, '#8a6a48');
  /* eyes like currants, a long nose and a wart, a gap-toothed grin */
  eye(s, 14, 9); eye(s, 18, 9); dots(s, [[13, 8], [14, 8], [18, 8], [19, 8]], m.skin, 1);
  dots(s, [[16, 10], [16, 11]], m.skin, 4); dots(s, [[17, 12], [16, 12]], m.skin, 3); s.fix(19, 12, '#8a6a5a');
  dots(s, [[14, 13], [15, 14], [16, 14], [17, 14], [18, 13]], m.skin, 0); s.fix(15, 13, '#f4ecd8'); s.fix(17, 13, '#f4ecd8');
  s.fix(13, 12, '#e08a8a'); s.fix(19, 11, '#e08a8a');
  return s; };
const witchSide = () => { const s = pane(), m = witchMats(s);
  s.poly([[10, 18], [20, 18], [23, 28.6], [6, 28.6]], m.skirt); s.edges(m.skirt); s.poly([[16, 18], [20, 18], [22, 26], [17, 26]], m.apron); s.edges(m.apron);
  for (let x = 6; x <= 23; x += 3) { s.set(x, 29, m.thorn, 2); s.set(x + 1, 28, m.leaf, 3); }
  /* the jar arm wound back to throw */
  tube(s, [[12, 15], [8, 13], [6, 9]], 1.5, 1.3, m.shawl); s.ell(6, 8.6, 1.6, 1.5, m.skin); s.rect(3, 2, 5, 6, m.jar); s.rect(3, 1, 5, 1, m.lid); s.rect(2.5, 0, 6, 1, m.lid);
  s.ell(15, 16.5, 6.6, 4.4, m.shawl); s.poly([[11, 17], [19, 17], [16, 22]], m.shawl); relight(s, m.shawl, 13, 14, 8, 6);
  /* the switch held out front */
  tube(s, [[18, 16], [21, 19], [23, 18]], 1.5, 1.3, m.shawl); s.ell(23.5, 18, 1.6, 1.5, m.skin); s.line(23, 19, 29, 11, m.switch, 2); for (const [x, y] of [[26, 14], [28, 12], [25, 16]]) s.set(x + 1, y + 1, m.thorn, 3);
  s.ell(19, 10.5, 4.2, 4.4, m.skin); s.poly([[22, 9.5], [26, 13], [22.5, 12.5]], m.skin); relight(s, m.skin, 18, 9, 5, 5);
  thicket(s, m, 15, 6, 8, 4.8); s.ell(13.5, 10, 3, 3.4, m.hair);
  s.outline();
  for (const [x, y] of [[9, 4], [13, 2], [18, 3], [11, 8]]) { s.set(x, y, m.berry, 2); s.set(x + 1, y, m.berry, 2); s.set(x, y + 1, m.berry, 1); s.fix(x, y, BERRY_SHINE); }
  for (const [x, y] of [[16, 2], [7, 6], [20, 5]]) { s.set(x, y, m.leaf, 3); s.set(x + 1, y, m.leaf, 2); }
  s.fix(3, 3, '#ffffff'); s.fix(4, 1, '#8a6a48'); s.fix(6, 1, '#8a6a48');
  s.fix(21, 9, '#2a1c1f'); s.fix(21, 10, '#2a1c1f'); s.fix(21, 8, '#ffffff'); s.fix(24, 11, '#8a6a5a');
  dots(s, [[20, 13], [21, 14], [22, 14], [23, 13]], m.skin, 0); s.fix(22, 13, '#f4ecd8'); s.fix(19, 12, '#e08a8a');
  return s; };
own('bramble_witch', witchFront, witchSide);

/* ================= Grey wolf (Mossbarrow, Lv 13): hunts at dusk and respects fire ================= */
/* a lean grey wolf stalking with its head below its shoulders and its brush held low, hackles up along a dark saddle,
   pale cheeks and throat, amber eyes, the lip lifted off its fangs; front-on it stands square, tall ears set wide and
   pale ruffs flaring off its cheeks. (The Dire wolf below is drawn as its own, heavier animal.) */
const wolfMats = (s, o = {}) => { const f = o.fur || '#7c8290'; return { fur: mat(s, f, { lo: .4 }), head: mat(s, f, { lo: .4 }), leg: mat(s, f, { lo: .4 }), furD: mat(s, o.furD || '#636977'), saddle: mat(s, o.saddle || '#3a3e4a'),
  pale: mat(s, o.pale || '#d4cec2', { lo: .25 }), tail: mat(s, f, { lo: .4 }) }; };
const WOLF_NOSE = '#22181c', WOLF_TOOTH = '#f4ecd8';
const wolfFront = (o = {}) => { const s = pane(), m = wolfMats(s, o), ey = o.eye || '#f2b030';
  /* the brush showing past its flank, the hind legs behind */
  tube(s, [[21, 25], [25.5, 22], [27, 17]], 2.2, 1.3, m.tail); s.rect(9, 23, 3, 7, m.furD); s.rect(20, 23, 3, 7, m.furD);
  /* the chest and ruff */
  s.ell(16, 21, 6.6, 6, m.fur); relight(s, m.fur, 14, 17, 8, 8); contact(s, m.fur, m.tail);
  s.poly([[12, 16], [20, 16], [16, 25]], m.pale, { flat: 3 }); grain(s, m.pale, (x, y) => (x >= 17 || y >= 23 ? 2 : null));
  /* the forelegs, white socks */
  s.rect(12, 23, 3, 7, m.leg); s.rect(17, 23, 3, 7, m.leg); contact(s, m.leg, [m.fur, m.pale]); s.rect(12, 28, 3, 2, m.pale); s.rect(17, 28, 3, 2, m.pale);
  /* the head: tall ears set wide, a wedge of a face narrowing to the muzzle, ruffs of pale fur flaring off the cheeks */
  s.poly([[8.5, 8.5], [8.5, 0.5], [14, 5]], m.head); s.poly([[23.5, 8.5], [23.5, 0.5], [18, 5]], m.head);
  s.poly([[11, 7], [6.5, 12.5], [9, 12], [8, 15], [12, 13.5], [13.5, 10]], m.pale); s.poly([[21, 7], [25.5, 12.5], [23, 12], [24, 15], [20, 13.5], [18.5, 10]], m.pale); grain(s, m.pale, (x, y) => (x > 16 && y < 16 ? 2 : x < 16 && y < 16 ? 3 : null));
  s.ell(16, 8.5, 5.6, 4, m.head); s.poly([[11, 9], [21, 9], [18.5, 14], [13.5, 14]], m.head); relight(s, m.head, 14, 5, 8, 7);
  s.poly([[14, 9], [18, 9], [18, 15.5], [14, 15.5]], m.head); grain(s, m.head, (x, y) => (x >= 14 && x <= 17 && y >= 10 && y <= 15 ? (x === 14 ? 4 : x === 15 ? 3 : 2) : null));
  s.poly([[13.5, 14], [18.5, 14], [17.5, 17], [14.5, 17]], m.pale, { flat: 3 }); contact(s, [m.head, m.pale], [m.fur], 1);
  s.ell(16, 4.8, 3.2, 1.6, m.saddle);
  s.outline();
  dots(s, [[9, 3], [9, 4], [9, 5], [10, 5], [10, 6]], m.saddle, 1); dots(s, [[23, 3], [23, 4], [23, 5], [22, 5], [22, 6]], m.saddle, 1);
  dots(s, [[11, 7], [12, 7], [13, 8], [21, 7], [20, 7], [19, 8]], m.saddle, 0);
  eye(s, 13, 9, { kind: 'glow', col: ey }); eye(s, 19, 9, { kind: 'glow', col: ey });
  s.fix(15, 14, WOLF_NOSE); s.fix(16, 14, WOLF_NOSE); s.fix(17, 14, WOLF_NOSE); s.fix(16, 13, '#5a5058'); s.fix(15, 13, '#3a3038');
  s.fix(16, 15, WOLF_NOSE); s.fix(14, 16, WOLF_TOOTH); s.fix(18, 16, WOLF_TOOTH); dots(s, [[15, 16], [16, 16], [17, 16]], m.saddle, 0);
  o.extra && o.extra(s, m, 'front');
  return s; };
const wolfSide = (o = {}) => { const s = pane(), m = wolfMats(s, o), ey = o.eye || '#f2b030';
  /* far legs in shadow */
  tube(s, [[12, 21], [13, 25], [11.5, 28.6]], 1.4, 1.1, m.furD); tube(s, [[20.5, 21], [21, 28.6]], 1.4, 1.1, m.furD);
  /* the body: rump, a lean waist, a deep chest; hackles up along the saddle */
  s.ell(9.5, 18.5, 4.8, 4.6, m.fur); s.ell(15, 18.5, 6, 3.6, m.fur); s.ell(20.5, 18, 4.6, 5, m.fur); relight(s, m.fur, 15, 18.5, 11, 6);
  s.ell(20.5, 21.6, 3.2, 1.8, m.pale, { flat: 3 }); s.ell(15, 21.8, 4, 1, m.pale, { flat: 2 });
  s.ell(13.5, 14.6, 6.6, 1.6, m.saddle);
  for (const [x, y] of [[8, 14.5], [11, 13], [14, 12.5], [17, 12.5], [20, 13]]) s.poly([[x - 1.8, y + 2], [x - .6, y - 1.6], [x + 1.6, y + 2]], m.saddle);
  /* the brush, held low */
  tube(s, [[6.5, 16.5], [3.8, 18.8], [2.5, 22.5], [2.8, 26]], 2.4, 1.1, m.tail); grain(s, m.tail, (x, y, l) => (y > 24 && l > 0 ? 1 : null)); contact(s, m.tail, m.fur);
  /* near legs: a bent hind leg (the thigh over the flank), a straight foreleg */
  s.ell(9.5, 20, 3.2, 3.6, m.leg); tube(s, [[8.5, 22], [7.5, 24.5], [9.5, 26.5], [9, 28.6]], 1.7, 1.2, m.leg); s.ell(10, 29, 2, .9, m.furD);
  tube(s, [[22.5, 19.5], [23.5, 25], [23.5, 28.6]], 1.8, 1.3, m.leg); s.ell(24.5, 29, 2, .9, m.furD); relight(s, m.leg, 9, 18, 16, 10); contact(s, m.leg, [m.fur, m.pale]);
  /* the head, low and forward, ears up */
  s.poly([[23.5, 15.5], [24, 10], [27, 14.5]], m.head);
  s.ell(25.5, 16.5, 3.8, 3.4, m.head); s.poly([[26, 14.5], [31, 16.5], [31, 18.5], [27, 19.5]], m.head); relight(s, m.head, 25, 14, 6, 5);
  s.poly([[26, 19], [30.5, 18.5], [29, 20.6], [26, 20.6]], m.pale); s.ell(22.8, 18, 1.6, 2.6, m.pale, { flat: 3 }); contact(s, [m.head, m.pale], m.fur);
  s.outline();
  dots(s, [[24, 12], [24, 13], [25, 14]], m.saddle, 1);
  s.fix(31, 16, WOLF_NOSE); s.fix(30, 16, '#3a3038');
  dots(s, [[27, 18], [28, 18], [29, 18], [30, 18]], m.saddle, 0); s.fix(28, 19, WOLF_TOOTH); s.fix(30, 19, WOLF_TOOTH); s.fix(27, 17, '#a85a5e');
  dots(s, [[25, 14], [26, 14], [27, 14]], m.saddle, 0);
  eye(s, 26, 15, { kind: 'glow', col: ey });
  o.extra && o.extra(s, m, 'side');
  return s; };
own('wolf', () => wolfFront(), () => wolfSide());

/* ================= Dire wolf (Mossbarrow, Lv 19): a wolf the size of a pony; the pack follows it ================= */
/* not the grey wolf grown up but a different animal: charcoal and grizzled, a great hump of shoulder bristling with
   black hackles, a heavy head carried low, jaws open on a mouthful of fangs, ember eyes; signature: the old pale scar
   that runs down over its blind, milky left eye, and the torn notch out of the same ear */
const direMats = s => { const f = '#4e4e5a'; return { fur: mat(s, f, { hi: .3, gl: .5 }), head: mat(s, f, { hi: .3, gl: .5 }), leg: mat(s, f, { hi: .3, gl: .5 }), legF: mat(s, '#34343e'), grizzle: mat(s, '#8a8a94'),
  hackle: mat(s, '#26262e', { hi: .5, gl: .7 }), muzzle: mat(s, '#9a948e'), mouth: s.mat(['#1a0a0e', '#2a0e14', '#4a1a22', '#6a2a30', '#8a3a40']) }; };
const DIRE_EYE = '#ff7a2a', SCAR = '#c8a8a0', FANG = '#f4ecd8', MILK = '#c8d0d0';
const direFront = () => { const s = pane(), m = direMats(s);
  s.rect(7, 23, 4, 7, m.legF); s.rect(21, 23, 4, 7, m.legF);
  /* the shoulders, a great ruff of hackles */
  s.ell(16, 18, 11, 7, m.fur); relight(s, m.fur, 13, 13, 13, 9);
  for (let i = 0; i < 9; i++) { const x = 6 + i * 2.5, h = 4 - Math.abs(i - 4) * .4; s.poly([[x - 1.6, 14], [x + (x < 16 ? -1 : 1), 14 - h - 1.5], [x + 1.6, 14]], m.hackle); }
  swap(s, m.fur, m.grizzle, (x, y) => (x * 7 + y * 3) % 9 === 0 && y < 22);
  s.rect(10, 22, 4, 8, m.leg); s.rect(18, 22, 4, 8, m.leg); s.rect(9, 29, 6, 1, m.legF); s.rect(17, 29, 6, 1, m.legF); contact(s, m.leg, m.fur);
  /* the head, low between the shoulders, jaws open */
  s.poly([[9.5, 12], [9, 5.5], [13, 9]], m.head); s.poly([[22.5, 12], [23, 5.5], [19, 9]], m.head); s.set(10, 7, null); s.set(10, 6, null);
  s.ell(16, 13, 6, 4.6, m.head); relight(s, m.head, 15, 10, 7, 6); contact(s, m.head, m.fur, 0);
  s.poly([[13, 14], [19, 14], [19, 18], [13, 18]], m.muzzle); s.edges(m.muzzle);
  s.poly([[12.5, 18], [19.5, 18], [18.5, 23], [13.5, 23]], m.mouth); s.edges(m.mouth);
  s.outline();
  s.fix(15, 14, '#16100e'); s.fix(16, 14, '#16100e'); s.fix(17, 14, '#16100e'); s.fix(16, 15, '#3a3034');
  for (const x of [13, 15, 17, 19]) s.fix(x, 18, FANG); s.fix(13, 19, FANG); s.fix(19, 19, FANG); s.fix(14, 22, FANG); s.fix(18, 22, FANG); s.fix(14, 21, '#c8c0b0'); s.fix(18, 21, '#c8c0b0');
  dots(s, [[12, 10], [13, 11], [20, 10], [19, 11]], m.head, 0);
  /* the ember eye, and the scarred milky one */
  s.fix(19, 12, '#ffd090'); s.fix(20, 12, DIRE_EYE); s.fix(12, 12, MILK); s.fix(13, 12, '#9aa4a4');
  for (const [x, y] of [[12, 8], [12, 9], [12, 10], [13, 11], [12, 13], [11, 14]]) s.fix(x, y, SCAR);
  return s; };
const direSide = () => { const s = pane(), m = direMats(s);
  /* the tail straight out behind, bristling */
  tube(s, [[6, 15], [3, 16], [1, 18.5]], 2.2, 1.2, m.fur);
  tube(s, [[10, 20], [11.5, 25], [10, 28.6]], 1.8, 1.4, m.legF); tube(s, [[21, 21], [21.5, 28.6]], 1.8, 1.4, m.legF);
  /* a body that rises to the hump of its shoulders */
  s.ell(9, 17.5, 5, 4.6, m.fur); s.ell(14, 17.5, 6, 4.4, m.fur); s.ell(20, 16, 6.4, 6.4, m.fur); relight(s, m.fur, 14, 13, 12, 8);
  swap(s, m.fur, m.grizzle, (x, y) => (x * 7 + y * 3) % 9 === 0 && y < 21);
  for (const [x, y, h] of [[7, 13.5, 2], [10, 13, 2.6], [13, 12.5, 3], [16, 11, 3.6], [19, 9.6, 4], [22, 10, 3.4]]) s.poly([[x - 2, y + 2], [x - 1, y - h], [x + 1.8, y + 2]], m.hackle);
  /* the near legs, thick */
  s.ell(8.5, 19.5, 3.4, 3.8, m.leg); tube(s, [[8.5, 21], [7.5, 24.5], [9.5, 26.5], [9, 28.6]], 2, 1.4, m.leg);
  tube(s, [[22, 19], [23.5, 25], [23.5, 28.6]], 2.3, 1.6, m.leg); relight(s, m.leg, 12, 17, 16, 10); contact(s, m.leg, m.fur);
  s.ell(10, 29, 2.2, .9, m.legF); s.ell(24.5, 29, 2.4, .9, m.legF);
  /* the head, low and huge, the jaws open */
  s.poly([[23, 14], [23.5, 8.5], [26, 12.5]], m.head); s.set(23, 10, null);
  s.ell(26, 15.5, 4.2, 3.8, m.head); s.poly([[27, 13.4], [31.4, 15.6], [31.4, 17.4], [27, 17.4]], m.head); relight(s, m.head, 25, 13, 6, 5); contact(s, m.head, m.fur, 0);
  s.poly([[25, 18.4], [31, 18.6], [29.5, 21.8], [25, 21.4]], m.muzzle); s.edges(m.muzzle);
  s.poly([[27, 17.4], [31, 17.4], [31, 18.4], [27, 18.6]], m.mouth);
  s.outline();
  s.fix(31, 15, '#16100e'); s.fix(30, 15, '#3a3034');
  for (const x of [27, 29, 31]) s.fix(x, 17, FANG); for (const x of [28, 30]) s.fix(x, 19, FANG); s.fix(26, 17, '#3a1a20');
  dots(s, [[25, 12], [26, 12], [27, 13]], m.head, 0); s.fix(26, 14, '#ffd090'); s.fix(27, 14, DIRE_EYE);
  for (const [x, y] of [[26, 11], [27, 12], [28, 13], [28, 15]]) s.fix(x, y, SCAR);
  return s; };
own('dire_wolf', direFront, direSide);

})();
