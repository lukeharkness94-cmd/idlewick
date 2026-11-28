/* Idlewick: the work rig (skill realism, owner 27 Nov 2026: "work on some of the realism. The sizes of things in
   comparison to each other, the animations, where the character holds things when using them in skills").
   Research and the choices behind every pose are in docs/skill-realism.md.

   In a work scene the hero stands side-on (js/pixelart.js heroSide), facing the job on their right, and this file draws
   their arms and what they hold for every frame of the work: an axe with the knob hand fixed and the other hand sliding
   down the haft, a pick swung into the rock face at chest height, a rod cast and struck, the smith's hammer in the right
   hand and tongs in the left over an anvil at knuckle height, a saw pushed and drawn on trestles, and so on. Right
   handed: the dominant hand is the far arm (drawn behind the body), the near arm is the left.

   Scale: the hero is 24 x 32 px (about 1.7 m, so 1 px is about 5.3 cm). Tools are sized to that (felling axe haft 15 px
   = 80 cm, pick 16 px, rod 44 px = 2.3 m, smith's hammer handle 7 px = 37 cm, saw blade 12 px = 64 cm...). Work
   heights follow the figure's own joints, because the figure is drawn with a big head and short legs: the anvil face sits
   at the hero's hanging knuckles, the trestle and the table at the belt.

   Each skill is a list of key poses over one cycle (a swing for beat work, the whole action for fishing, thieving,
   hunting and the rest). Frames are drawn in code at the hero's pixel scale, cached, and stepped (FRAMES per cycle);
   js/strike_sync.js runs the clock, draws the frame for the moment and plays each work sound as its frame appears, so
   the sound lands on the strike. The body leans continuously (CSS, transform only). Calm and reduced motion show the
   ready pose and nothing moves. Presentation only: timings, chances and rewards are untouched. */
(() => {
const Q = window.DQ, D = Q.data, UI = Q.ui, A = Q.pixelArt; if (!A || !A.Spr) return;
const { Spr, ramp, mix, R: PAL } = A, S = () => Q.S;
const RW = 112, RH = 72, OX = 40, OY = 40; /* rig canvas, hero px; the body's top-left sits at (OX, OY), feet on its bottom row */
const SW = 96, SH = 56;                    /* station canvas: stage x -48..47, y -56..-1 (0 is the ground line) */
const PX = 3;                              /* css px per hero px in a work scene */
const L1 = 4, L2 = 4.5;                    /* upper arm and forearm */
const calm = () => document.documentElement.classList.contains('calm') || !!(S() && S().settings && S().settings.reduceFx) || (typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches);
const rad = d => d * Math.PI / 180, dir = a => [Math.cos(rad(a)), Math.sin(rad(a))];
const at = (B, a, u, v = 0) => { const [c, s] = dir(a); return [B[0] + c * u - s * v, B[1] + s * u + c * v]; };
const lerp = (a, b, k) => a + (b - a) * k;
const EASE = { lin: k => k, in: k => k * k * k, out: k => 1 - (1 - k) ** 3, io: k => k < .5 ? 4 * k * k * k : 1 - (-2 * k + 2) ** 3 / 2, hold: () => 0 };
const darker = r => ramp(mix(r.base, '#3a2448', .24));
const WOOD = PAL.wood, WOODL = PAL.woodLight, IRON = ramp('#9aa3ad', { gl: .7 }), STEEL = ramp('#b8c2cc', { gl: .75 }), STRING = ramp('#e8dcc0'), LEATHER = PAL.leather, STONE = PAL.stone;

/* ---------- drawing helpers, in body coordinates (the body sprite's own pixels) ---------- */
const layer = spr => {
  const T = ([x, y]) => [Math.round(x + OX), Math.round(y + OY)];
  const g = {
    spr,
    dot(p, r) { const [x, y] = T(p); spr.dot(x, y, r); },
    fix(p, c) { const [x, y] = T(p); spr.fix(x, y, c); },
    line(p0, p1, r) { const [a, b] = T(p0), [c, d] = T(p1); spr.line(a, b, c, d, r); },
    fline(p0, p1, c) { const [a, b] = T(p0), [x, y] = T(p1); spr.line(a, b, x, y, null, c); },
    thick(p0, p1, r) { const [a, b] = T(p0), [c, d] = T(p1); const n = Math.max(Math.abs(c - a), Math.abs(d - b), 1); for (let i = 0; i <= n; i++) spr.rect(Math.round(a + (c - a) * i / n) - 1, Math.round(b + (d - b) * i / n), 2, 2, r); },
    rect(p, w, h, r) { const [x, y] = T(p); spr.rect(x, y, w, h, r); },
    poly(pts, r) { spr.poly(pts.map(([x, y]) => [x + OX, y + OY]), r); },
    ell(p, rx, ry, r) { spr.ell(p[0] + OX, p[1] + OY, rx, ry, r); },
    /* a straight haft from B along angle a, L long */
    haft(B, a, L, r = WOOD) { g.line(B, at(B, a, L), r); },
    /* a shape in the tool's own frame (u along the haft from B, v to its clockwise side) */
    shape(B, a, pts, r) { g.poly(pts.map(([u, v]) => at(B, a, u, v)), r); }
  };
  return g;
};
/* an arm from the shoulder to the hand, the elbow bent down and back */
const ARM = { near: [11, 16], far: [12, 15] };
const arm = (g, side, H, look, dy, o = {}) => {
  const Sh = [ARM[side][0], ARM[side][1] + dy], dx = H[0] - Sh[0], dyy = H[1] - Sh[1]; let d = Math.hypot(dx, dyy) || .01;
  const reach = L1 + L2 - .05; let Hh = H; if (d > reach) { Hh = [Sh[0] + dx / d * reach, Sh[1] + dyy / d * reach]; d = reach; }
  const base = Math.atan2(Hh[1] - Sh[1], Hh[0] - Sh[0]), cosA = Math.max(-1, Math.min(1, (L1 * L1 + d * d - L2 * L2) / (2 * L1 * d))), al = Math.acos(cosA);
  const e1 = [Sh[0] + Math.cos(base + al) * L1, Sh[1] + Math.sin(base + al) * L1], e2 = [Sh[0] + Math.cos(base - al) * L1, Sh[1] + Math.sin(base - al) * L1];
  const E = o.up ? (e1[1] < e2[1] ? e1 : e2) : (e1[1] > e2[1] ? e1 : e2);
  const sl = side === 'far' ? look.sleeveFar : look.sleeve, sk = side === 'far' ? look.skinFar : look.skin;
  const wrist = [lerp(E[0], Hh[0], .62), lerp(E[1], Hh[1], .62)];
  g.thick(Sh, E, sl); g.thick(E, wrist, sl); g.thick(wrist, Hh, sk);
  return Hh;
};

/* ---------- tools ---------- */
const TOOL = {
  /* felling axe: 80 cm haft, the bit to the clockwise side, a short poll behind the eye */
  axe(g, B, a, m) { g.haft(B, a, 15); g.shape(B, a, [[13, -1], [15, -1], [15.6, 1], [16.5, 3.5], [12.5, 3.5], [13.4, 1]], m); g.fix(at(B, a, 14.5, 3), m.gl); return at(B, a, 14.6, 3.6); },
  /* miner's pick: 85 cm haft, a curved head pointed both ways */
  pick(g, B, a, m) { g.haft(B, a, 16); g.shape(B, a, [[15, -1], [16.4, -1], [16.2, 1], [17.2, 3.5], [16.2, 4.8], [14.6, 1.4], [14.6, -1.4], [15.6, -4], [14.6, -3.8]], m); return at(B, a, 16.3, 4.8); },
  /* cross-peen hammer: 37 cm handle, a short head with the face on the clockwise side */
  hammer(g, B, a, m) { g.haft(B, a, 7); g.shape(B, a, [[5.6, -2], [7.6, -2], [7.6, 2], [5.6, 2]], m); g.fix(at(B, a, 6, -2), m.gl); return at(B, a, 6.6, 2.4); },
  /* tongs: 45 cm reins and short jaws */
  tongs(g, B, a, m) { g.fline(B, at(B, a, 6, -.5), m.lo); g.fline(at(B, a, 0, 1), at(B, a, 6, .5), m.base); g.fline(at(B, a, 6, -.5), at(B, a, 8, 0), m.lo); return at(B, a, 8, 0); },
  mallet(g, B, a) { g.haft(B, a, 5); g.shape(B, a, [[4.5, -1.5], [6.5, -1.5], [6.5, 2.5], [4.5, 2.5]], WOODL); return at(B, a, 5.5, 2.6); },
  chisel(g, B, a, m) { g.line(B, at(B, a, 2), WOOD); g.line(at(B, a, 2), at(B, a, 4), m); return at(B, a, 4.2); },
  saw(g, B, a, m) { /* B is the handle; the blade runs 12 px along a, deep at the heel, tapering to the toe */
    g.shape(B, a, [[-1, -1.5], [2, -1.5], [2, 1.5], [-1, 1.5]], WOOD); g.shape(B, a, [[2, -1], [14, 0], [14, 1], [2, 2]], m); for (let u = 3; u < 14; u += 2) g.fix(at(B, a, u, 1.6), mix(m.base, '#3a2448', .4)); return at(B, a, 14, .5); },
  spoon(g, B, a) { g.haft(B, a, 11); g.shape(B, a, [[10.5, -1], [12.5, -1], [12.5, 1], [10.5, 1]], WOODL); return at(B, a, 12, 0); },
  pestle(g, B, a) { g.line(B, at(B, a, 4), WOODL); g.shape(B, a, [[4, -1], [5.5, -1], [5.5, 1], [4, 1]], WOODL); return at(B, a, 5.6); },
  graver(g, B, a, m) { g.dot(B, WOOD); g.line(at(B, a, 1), at(B, a, 3), m); return at(B, a, 3.2); },
  quill(g, B, a) { g.line(B, at(B, a, 4), ramp('#efe8d8')); g.fix(at(B, a, 4.2), '#2a1c1f'); return at(B, a, 4.2); },
  /* a draw hoe: about 1.2 m of ash haft (23 px) and a 15 cm iron blade set back toward the user (owner, 28 Nov 2026) */
  hoe(g, B, a, m) { g.haft(B, a, 21); g.shape(B, a, [[19.6, -.4], [21.4, -.4], [21.4, 3.4], [19.6, 3.4]], m); g.fix(at(B, a, 20.4, 0), m.gl); return at(B, a, 21, 3.4); },
  stake(g, B, a) { g.line(B, at(B, a, 6), WOODL); g.fix(at(B, a, 6), WOOD.lo); return at(B, a, 0); },
  staff(g, B, a, m) { g.haft(B, a, 28, ramp('#7a5a3a')); g.ell(at(B, a, 29), 1.4, 1.4, ramp(m.base, { gl: .85 })); return at(B, a, 29); },
  spear(g, B, a, m) { g.haft(B, a, 32); g.shape(B, a, [[31, -1], [33, -1.4], [36, 0], [33, 1.4]], m); return at(B, a, 36); },
  /* a rod: 2.3 m of tapering cane, the butt wrapped in cord */
  rod(g, B, a) { g.line(B, at(B, a, 44), ramp('#b99a5e')); g.line(B, at(B, a, 3), LEATHER); return at(B, a, 44); },
  /* swords and the rest of the practice weapons, by type, in the weapon's own metal */
  sword(g, B, a, m) { g.line(at(B, a, -1.5), at(B, a, .5), LEATHER); g.shape(B, a, [[.5, -2], [1.5, -2], [1.5, 2], [.5, 2]], PAL.gold); g.shape(B, a, [[1.5, -.8], [15, -.8], [16.5, 0], [15, .8], [1.5, .8]], m); g.fline(at(B, a, 3), at(B, a, 14), m.gl); return at(B, a, 16.5); },
  dagger(g, B, a, m) { g.line(at(B, a, -1), at(B, a, .5), LEATHER); g.shape(B, a, [[.5, -1.5], [1.5, -1.5], [1.5, 1.5], [.5, 1.5]], PAL.gold); g.shape(B, a, [[1.5, -.7], [6.5, -.6], [7.5, 0], [6.5, .6], [1.5, .7]], m); return at(B, a, 7.5); },
  warhammer(g, B, a, m) { g.haft(B, a, 11); g.shape(B, a, [[9.5, -2], [12.5, -2], [12.5, 2.5], [9.5, 2.5]], m); return at(B, a, 11, 2.6); },
  cutlass(g, B, a, m) { g.line(at(B, a, -1.5), at(B, a, .5), LEATHER); g.shape(B, a, [[.5, -2], [1.5, -2], [1.5, 2], [.5, 2]], PAL.gold); g.shape(B, a, [[1.5, -.8], [9, -1.4], [14, -.4], [15, 1.2], [9, .6], [1.5, .8]], m); return at(B, a, 15, 1); }
};
/* a bow held at its grip G, limbs along angle a (up is -90), drawn by the hand at N (string hand) or braced */
const bowDraw = (g, G, a, len, wood, N) => {
  const h = len / 2, t0 = at(G, a, -h, 0), t1 = at(G, a, h, 0), bend = N ? 2.6 : 1.8;
  const pts = []; for (let i = 0; i <= 12; i++) { const u = -h + len * i / 12, v = -bend * (1 - (u / h) ** 2); pts.push(at(G, a, u, v)); }
  for (let i = 0; i < 12; i++) g.line(pts[i], pts[i + 1], wood);
  g.dot(G, LEATHER);
  const tip0 = at(G, a, -h, -.2), tip1 = at(G, a, h, -.2);
  if (N) { g.fline(tip0, N, '#efe4c8'); g.fline(N, tip1, '#efe4c8'); } else g.fline(tip0, tip1, '#efe4c8');
  return { t0, t1 };
};

/* ---------- the skills ---------- */
/* key: [t, {pose numbers}, ease into this key]; draw(p, g, ctx) draws one frame and returns its contact point */
const K = (t, o, e = 'io') => [t, o, e];
const posture = p => p.posture || 'stand';
const SPEC = {};
/* Woodcutting: feet apart, side-on to the tree; the left hand stays at the knob, the right slides from under the head
   (backswing, over the right shoulder) down to the left as the axe comes through, into the notch at knee to waist
   height at about 45 degrees; the bit stays in the cut a moment and is worked free. */
SPEC.wood = { lean: 'chop', beatMs: 1200, beats: [{ at: .4, sfx: 'wood', fx: 'chips' }], wipe: [.52, .86], contact: 'edge', rest: .9,
  keys: [K(0, { hx: 14, hy: 22, a: -30, g2: 6 }), K(.28, { hx: 9, hy: 9, a: -150, g2: 12 }, 'io'), K(.36, { hx: 12, hy: 11, a: -80, g2: 8 }, 'in'), K(.4, { hx: 15, hy: 21, a: -32, g2: 3 }, 'in'), K(.5, { hx: 15, hy: 21, a: -32, g2: 3 }, 'hold'), K(.62, { hx: 13, hy: 22, a: -24, g2: 4 }, 'out'), K(1, { hx: 14, hy: 22, a: -30, g2: 6 }, 'io')],
  draw(p, g, c) { const B = [p.hx, p.hy], tip = TOOL.axe(g.front, at(B, p.a, -1), p.a, c.metal); if (!c.wipe) arm(g.front, 'near', B, c.look, 0); arm(g.back, 'far', at(B, p.a, p.g2), c.look, 0); return tip; } };
/* Mining: the pick swung from over the shoulder down into the rock face in front at chest height, never at the sky;
   the hands slide together on the way down, and the point is levered out before the next blow. */
SPEC.mine = { lean: 'chop', beatMs: 1200, beats: [{ at: .4, sfx: 'mine', fx: 'sparks' }], wipe: [.52, .86], contact: 'edge', rest: .9,
  keys: [K(0, { hx: 14, hy: 21, a: -62, g2: 6 }), K(.28, { hx: 9, hy: 9, a: -165, g2: 11 }, 'io'), K(.36, { hx: 12, hy: 11, a: -100, g2: 8 }, 'in'), K(.4, { hx: 16, hy: 19, a: -52, g2: 3 }, 'in'), K(.5, { hx: 16, hy: 19, a: -52, g2: 3 }, 'hold'), K(.62, { hx: 14, hy: 20, a: -64, g2: 4 }, 'out'), K(1, { hx: 14, hy: 21, a: -62, g2: 6 }, 'io')],
  draw(p, g, c) { const B = [p.hx, p.hy], tip = TOOL.pick(g.front, at(B, p.a, -1), p.a, c.metal); if (!c.wipe) arm(g.front, 'near', B, c.look, 0); arm(g.back, 'far', at(B, p.a, p.g2), c.look, 0); return tip; } };
/* Fishing (float and rod, no reel): back-cast over the shoulder, forward cast, the float lands; wait with the rod tip
   up; the float dips, a quick lift of the rod sets the hook, and the fish is swung in. One cycle per catch. */
SPEC.fish = { lean: 'cast', mode: 'action', ground: 8, beats: [{ at: .24, sfx: 'plop', fx: 'ripple' }, { at: .8, sfx: 'splash', fx: 'splash' }], wipe: [.34, .62], contact: 'free', stand: 46, rest: .5,
  keys: [K(0, { hx: 15, hy: 20, a: -30, f: 0, dip: 0 }), K(.12, { hx: 12, hy: 16, a: -105, f: 0, dip: 0 }, 'out'), K(.22, { hx: 17, hy: 20, a: -12, f: 0, dip: 0 }, 'in'), K(.24, { hx: 17, hy: 20, a: -14, f: 1, dip: 0 }, 'out'), K(.34, { hx: 15, hy: 21, a: -20, f: 1, dip: 0 }, 'io'), K(.7, { hx: 15, hy: 21, a: -21, f: 1, dip: 0 }, 'io'), K(.76, { hx: 15, hy: 21, a: -19, f: 1, dip: 2 }, 'in'),
    K(.8, { hx: 14, hy: 19, a: -38, f: 1, dip: -1 }, 'in'), K(.92, { hx: 13, hy: 18, a: -50, f: 2, dip: 0 }, 'out'), K(1, { hx: 15, hy: 20, a: -30, f: 0, dip: 0 }, 'io')],
  draw(p, g, c) { const B = [p.hx, p.hy], tip = TOOL.rod(g.front, at(B, p.a, -3), p.a);
    if (!c.wipe) arm(g.front, 'near', at(B, p.a, -3), c.look, 0); arm(g.back, 'far', B, c.look, 0);
    const fl = [c.float[0], c.float[1] + p.dip];
    if (p.f >= 1 && p.f < 2) { g.front.fline(tip, fl, '#f4f0e0'); g.front.fix(fl, '#d84838'); g.front.fix([fl[0], fl[1] + 1], '#f4ecd8'); }
    else if (p.f >= 2) { const hang = [tip[0] + 1, tip[1] + 9]; g.front.fline(tip, hang, '#e8f0f0'); g.front.poly([[hang[0] - 1, hang[1]], [hang[0] + 1, hang[1]], [hang[0] + 1, hang[1] + 4], [hang[0] - 1, hang[1] + 4]], ramp('#a8c0c8')); }
    else { g.front.fline(tip, [tip[0] - 2, tip[1] + 6], '#e8f0f0'); }
    return fl; } };
/* Thieving: sidle up close at the mark's side, the right hand slips slowly into their purse at the belt, lifts, and
   tucks the take into your own belt as you ease away. One cycle per attempt; the chink is the lift. */
SPEC.thieve = { lean: 'sidle', mode: 'action', beats: [{ at: .6, sfx: 'thieve', fx: 'glint', replaces: 'thieve' }], wipe: null, contact: 'edge', rest: .05,
  keys: [K(0, { hx: 13, hy: 22, ox: 13, oy: 23 }), K(.3, { hx: 16, hy: 21, ox: 13, oy: 23 }, 'io'), K(.55, { hx: 19, hy: 21, ox: 13, oy: 23 }, 'io'), K(.6, { hx: 19, hy: 21, ox: 13, oy: 23 }, 'hold'), K(.68, { hx: 18, hy: 19, ox: 13, oy: 23 }, 'out'), K(.88, { hx: 13, hy: 20, ox: 13, oy: 23 }, 'io'), K(1, { hx: 13, hy: 22, ox: 13, oy: 23 }, 'io')],
  draw(p, g, c) { const H = arm(g.back, 'far', [p.hx, p.hy], c.look, 0); if (!c.wipe) arm(g.front, 'near', [p.ox, p.oy], c.look, 0); if (p.hy < 20.5 && p.hx > 16) g.back.fix([H[0], H[1] - 1], '#e6b84a'); return [p.hx + 1, p.hy]; } };
/* Smithing: the anvil at the smith's hanging knuckles; tongs in the left hand hold the hot piece flat on the face, the
   hammer in the right rises from the elbow and falls square; it bounces up between blows and the piece is turned. The
   heat fades through the action and comes back with the next one (heat, hammer, reheat). */
SPEC.forge = { lean: 'hammer', beatMs: 1200, beats: [{ at: .4, sfx: 'anvil', fx: 'sparks' }], wipe: [.55, .86], contact: 'station', station: 'anvil', stand: 26, rest: .9, heat: true,
  keys: [K(0, { hx: 18, hy: 17, a: -10, tx: 15, ty: 22, ta: 6 }), K(.26, { hx: 15, hy: 11, a: -80, tx: 15, ty: 22, ta: 6 }, 'out'), K(.4, { hx: 18, hy: 18, a: 22, tx: 15, ty: 22, ta: 6 }, 'in'), K(.5, { hx: 18, hy: 16, a: 0, tx: 15, ty: 22, ta: 6 }, 'out'), K(.75, { hx: 18, hy: 17, a: -8, tx: 15, ty: 22, ta: 0 }, 'io'), K(1, { hx: 18, hy: 17, a: -10, tx: 15, ty: 22, ta: 6 }, 'io')],
  draw(p, g, c) { if (!c.wipe) { const T = [p.tx, p.ty]; TOOL.tongs(g.front, T, p.ta, IRON); arm(g.front, 'near', T, c.look, 0); }
    const B = [p.hx, p.hy]; const tip = TOOL.hammer(g.back, B, p.a, c.metal); arm(g.back, 'far', B, c.look, 0); return tip; } };
/* Smelting: a clay furnace blown by a lever bellows; both hands bear down on the lever, the bag breathes out and the
   flame at the furnace top flares; let it rise and pump again. The bars wait in the mould at its foot. */
SPEC.smelt = { lean: 'pump', beatMs: 1200, beats: [{ at: .4, sfx: 'bellows', fx: 'flare' }], wipe: [.55, .86], contact: 'station', station: 'furnace', stand: 26, rest: .9,
  keys: [K(0, { hy: 15 }), K(.4, { hy: 21 }, 'in'), K(.5, { hy: 21 }, 'hold'), K(1, { hy: 15 }, 'io')],
  draw(p, g, c) { const y = p.hy, H1 = [16, y], H2 = [17, y], m = ramp('#7a5236'), sq = (y - 15) / 6, top = 25 + Math.round(sq * 2);
    /* the bellows: a leather bag between two boards at the furnace's foot, the pole from its top board up to the hands */
    g.front.rect([19, 31], 7, 1, WOOD); g.front.poly([[19, top + 1], [25, top + 1], [26, 30], [19, 30]], LEATHER); g.front.rect([19, top], 7, 1, WOOD); g.front.line([25, 29], [27, 29], IRON);
    g.front.line([22, top], [17, y + 1], m);
    arm(g.back, 'far', H2, c.look, 0); if (!c.wipe) arm(g.front, 'near', H1, c.look, 0); return [27, 29]; } };
/* Carpentry: the board across two trestles at belt height, the left hand pins it down beside the line, the right arm
   saws like a piston from the shoulder, blade at about 45 degrees: the push cuts, the pull returns light. */
SPEC.saw = { lean: 'saw', beatMs: 1200, beats: [{ at: .12, sfx: 'saw', fx: 'dust' }, { at: .6, sfx: 'sawback' }], wipe: [.5, .58], contact: 'station', station: 'trestle', stand: 20, rest: .5,
  keys: [K(0, { u: 0 }), K(.12, { u: 0 }, 'hold'), K(.45, { u: 6 }, 'io'), K(.6, { u: 6 }, 'hold'), K(.92, { u: 0 }, 'io'), K(1, { u: 0 }, 'hold')],
  draw(p, g, c) { const a = 42, B = at([12.5, 15.5], a, p.u); TOOL.saw(g.back, B, a, STEEL); arm(g.back, 'far', B, c.look, 0); if (!c.wipe) arm(g.front, 'near', [18, 21], c.look, 0); return at(B, a, 9); } };
/* Cooking: a pot hung from an iron tripod over a small fire, stirred with a long wooden spoon so the cook stays out of
   the smoke; the left hand steadies the lid's cloth. The dish waits on the warming stone. */
SPEC.cook = { lean: 'stir', beatMs: 1600, beats: [], wipe: [.6, .9], contact: 'station', station: 'tripod', stand: 27, rest: 0,
  keys: [K(0, { hx: 17, hy: 16, a: 48 }), K(.25, { hx: 19, hy: 16, a: 58 }, 'io'), K(.5, { hx: 18, hy: 17, a: 64 }, 'io'), K(.75, { hx: 16, hy: 17, a: 54 }, 'io'), K(1, { hx: 17, hy: 16, a: 48 }, 'io')],
  draw(p, g, c) { const B = [p.hx, p.hy]; const tip = TOOL.spoon(g.back, B, p.a); arm(g.back, 'far', B, c.look, 0); if (!c.wipe) arm(g.front, 'near', [14, 22], c.look, 0); return tip; } };
/* Crafting (leather): seated, the work clamped upright in a stitching clam between the knees; an awl opens the hole,
   two needles pass through it from both sides and both hands draw the thread out and tight (the saddle stitch). */
SPEC.stitch = { lean: 'none', beatMs: 1300, beats: [{ at: .45, sfx: 'stitch' }], wipe: [.55, .85], contact: 'station', station: 'clam', stand: 20, rest: .9, posture: 'sit',
  keys: [K(0, { nx: 17, ny: 17, fx: 18, fy: 17 }), K(.25, { nx: 18, ny: 17, fx: 19, fy: 17 }, 'io'), K(.45, { nx: 13, ny: 15, fx: 23, fy: 16 }, 'out'), K(.55, { nx: 13, ny: 15, fx: 23, fy: 16 }, 'hold'), K(1, { nx: 17, ny: 17, fx: 18, fy: 17 }, 'io')],
  draw(p, g, c) { const dy = 6, F = [p.fx, p.fy + dy], N = [p.nx, p.ny + dy], hole = [19.5, 22]; arm(g.back, 'far', F, c.look, dy); g.back.fline(hole, F, '#efe4c8');
    if (!c.wipe) { arm(g.front, 'near', N, c.look, dy); g.front.fline(hole, N, '#efe4c8'); } return hole; } };
/* Runes: a stone tablet on a block; the chisel held upright in the left hand, a mallet in the right tapping it in a
   few blows per stroke, as runestones were cut. */
SPEC.runes = { lean: 'tap', beatMs: 1000, beats: [{ at: .4, sfx: 'chisel', fx: 'chips' }], wipe: [.55, .86], contact: 'station', station: 'tablet', stand: 18, rest: .9,
  keys: [K(0, { hx: 15, hy: 16, a: -40 }), K(.28, { hx: 14, hy: 13, a: -95 }, 'out'), K(.4, { hx: 17, hy: 15, a: -15 }, 'in'), K(.5, { hx: 16, hy: 15, a: -40 }, 'out'), K(1, { hx: 15, hy: 16, a: -40 }, 'io')],
  draw(p, g, c) { const top = [22, 19.5]; if (!c.wipe) { TOOL.chisel(g.front, [22, 17], 90, STEEL); arm(g.front, 'near', [22, 18], c.look, 0); }
    const B = [p.hx, p.hy]; TOOL.mallet(g.back, B, p.a); arm(g.back, 'far', B, c.look, 0); return [22, 22]; } };
/* Enchanting: an engraver's push: the piece on the block under the left hand, the graver pushed through the line by
   the heel of the right hand in short strokes. */
SPEC.engrave = { lean: 'tap', beatMs: 1000, beats: [{ at: .45, sfx: 'scratch', fx: 'glint' }], wipe: [.6, .9], contact: 'station', station: 'tablet', stand: 18, rest: .9,
  keys: [K(0, { u: 0 }), K(.45, { u: 3 }, 'io'), K(.55, { u: 3 }, 'hold'), K(1, { u: 0 }, 'io')],
  draw(p, g, c) { const B = [18 + p.u, 19]; TOOL.graver(g.back, B, 10, STEEL); arm(g.back, 'far', B, c.look, 0); if (!c.wipe) arm(g.front, 'near', [24, 20], c.look, 0); return [B[0] + 3, 20]; } };
/* Herbalism: mortar on the table held by the rim in the left hand; the pestle in the right bruises the leaves with a
   press, then grinds them round. */
SPEC.grind = { lean: 'tap', beatMs: 1300, beats: [{ at: .3, sfx: 'grind' }], wipe: [.4, .55], contact: 'station', station: 'mortar', stand: 18, rest: .9,
  keys: [K(0, { hx: 21, hy: 14, a: 80 }), K(.3, { hx: 21, hy: 16, a: 86 }, 'in'), K(.5, { hx: 22, hy: 15, a: 70 }, 'io'), K(.7, { hx: 20, hy: 15, a: 100 }, 'io'), K(.85, { hx: 21, hy: 15, a: 84 }, 'io'), K(1, { hx: 21, hy: 14, a: 80 }, 'io')],
  draw(p, g, c) { const B = [p.hx, p.hy]; const tip = TOOL.pestle(g.back, B, p.a); arm(g.back, 'far', B, c.look, 0); if (!c.wipe) arm(g.front, 'near', [18, 19], c.look, 0); return tip; } };
/* Exploration: a plane table on its tripod; the alidade is sighted along to a landmark, then the ray is ruled and
   noted on the sheet in pencil. Slow, careful work: one sight and note every few seconds. */
SPEC.survey = { lean: 'sight', beatMs: 3200, beats: [{ at: .6, sfx: 'quill' }], wipe: [.86, .98], contact: 'station', station: 'planetable', stand: 20, rest: .3,
  keys: [K(0, { nx: 19, ny: 20, fx: 16, fy: 22, w: 0 }), K(.15, { nx: 21, ny: 19, fx: 16, fy: 22, w: 0 }, 'io'), K(.45, { nx: 21, ny: 19, fx: 16, fy: 22, w: 0 }, 'hold'), K(.55, { nx: 20, ny: 20, fx: 23, fy: 18, w: 0 }, 'io'), K(.6, { nx: 20, ny: 20, fx: 24, fy: 18, w: 1 }, 'lin'), K(.75, { nx: 20, ny: 20, fx: 26, fy: 18, w: 1 }, 'lin'), K(.85, { nx: 20, ny: 20, fx: 25, fy: 19, w: 0 }, 'io'), K(1, { nx: 19, ny: 20, fx: 16, fy: 22, w: 0 }, 'io')],
  draw(p, g, c) { const F = [p.fx, p.fy]; if (p.w > .5 || p.fx > 20) TOOL.quill(g.back, F, 120); arm(g.back, 'far', F, c.look, 0); if (!c.wipe) arm(g.front, 'near', [p.nx, p.ny], c.look, 0); return [26, 19]; } };
/* Alchemy: the staff planted in the right hand, the item held out on the left palm; the light gathers and the item
   turns to coin. */
SPEC.alch = { lean: 'sight', mode: 'action', beats: [{ at: .82, sfx: 'cast', fx: 'flash', replaces: 'cast' }], wipe: [.2, .5], contact: 'free', stand: 22, rest: .1,
  keys: [K(0, { nx: 17, ny: 21, sy: 1 }), K(.6, { nx: 18, ny: 19, sy: 0 }, 'io'), K(.82, { nx: 19, ny: 18, sy: -1 }, 'in'), K(1, { nx: 17, ny: 21, sy: 1 }, 'io')],
  draw(p, g, c) { const B = [17, 31 + p.sy]; TOOL.staff(g.back, B, -86, c.orb); arm(g.back, 'far', at(B, -86, 12), c.look, 0); if (!c.wipe) { arm(g.front, 'near', [p.nx, p.ny], c.look, 0); g.front.fix([p.nx + 1, p.ny - 1], '#e6b84a'); } return [p.nx + 1, p.ny - 2]; } };
/* Hunting: crouched on the trail reading prints; kneel to lay the lure; then up with the spear for the strike, which
   stops short: whether it lands is shown only after the roll. */
SPEC.hunt = { lean: 'none', mode: 'action', beats: [{ at: .88, sfx: 'swish' }], wipe: null, contact: 'free', stand: 56, rest: .1,
  posture: t => t < .45 ? 'crouch' : t < .75 ? 'kneel' : 'stand',
  keys: [K(0, { nx: 18, ny: 28, fx: 15, fy: 26, s: 0 }), K(.2, { nx: 19, ny: 30, fx: 15, fy: 26, s: 0 }, 'io'), K(.44, { nx: 18, ny: 29, fx: 15, fy: 26, s: 0 }, 'io'), K(.46, { nx: 19, ny: 30, fx: 20, fy: 30, s: 0 }, 'lin'), K(.74, { nx: 19, ny: 30, fx: 21, fy: 30, s: 0 }, 'io'),
    K(.76, { nx: 15, ny: 21, fx: 12, fy: 21, s: 0 }, 'lin'), K(.84, { nx: 13, ny: 21, fx: 10, fy: 21, s: 0 }, 'out'), K(.88, { nx: 19, ny: 21, fx: 16, fy: 21, s: 1 }, 'in'), K(1, { nx: 16, ny: 21, fx: 13, fy: 21, s: 0 }, 'io')],
  draw(p, g, c) { const pos = c.posture, dy = A.WORK_POSTURE[pos].dy;
    if (pos === 'stand') { const a = -4, N = [p.nx, p.ny], F = [p.fx, p.fy + .3]; TOOL.spear(g.front, at(N, a, -14), a, IRON); if (!c.wipe) arm(g.front, 'near', N, c.look, 0); arm(g.back, 'far', F, c.look, 0); return at(N, a, 22); }
    arm(g.back, 'far', [p.fx, Math.min(31, p.fy)], c.look, dy); if (!c.wipe) arm(g.front, 'near', [p.nx, Math.min(31, p.ny)], c.look, dy); return [p.nx, p.ny]; } };
/* Beastmastery capture: crouched and quiet on the track, kneel to set the live trap, then coax: bait held out low on
   the flat of the hand, the other hand still. */
SPEC.capture = { lean: 'none', mode: 'action', beats: [], wipe: null, contact: 'free', stand: 40, rest: .1,
  posture: t => t < .4 ? 'crouch' : 'kneel',
  keys: [K(0, { nx: 18, ny: 28, fx: 15, fy: 26 }), K(.38, { nx: 19, ny: 29, fx: 15, fy: 26 }, 'io'), K(.42, { nx: 19, ny: 30, fx: 20, fy: 30 }, 'lin'), K(.68, { nx: 20, ny: 30, fx: 21, fy: 30 }, 'io'), K(.72, { nx: 20, ny: 26, fx: 14, fy: 27 }, 'io'), K(.86, { nx: 21, ny: 26, fx: 14, fy: 27 }, 'io'), K(1, { nx: 20, ny: 26, fx: 14, fy: 27 }, 'io')],
  draw(p, g, c) { const dy = A.WORK_POSTURE[c.posture].dy; arm(g.back, 'far', [p.fx, Math.min(31, p.fy)], c.look, dy); if (!c.wipe) { arm(g.front, 'near', [p.nx, Math.min(31, p.ny)], c.look, dy); if (c.t > .7) g.front.fix([p.nx + 1, p.ny - 1], '#c8a040'); } return [p.nx, p.ny]; } };
/* Fieldwork: kneeling at the set, the stake held in the left hand and driven with a wooden mallet in the right. */
SPEC.stake = { lean: 'none', beatMs: 1200, beats: [{ at: .4, sfx: 'stake', fx: 'dust' }], wipe: [.55, .86], contact: 'free', stand: 40, rest: .9, posture: 'kneel',
  keys: [K(0, { hx: 16, hy: 23, a: -40, d: 0 }), K(.28, { hx: 14, hy: 19, a: -100, d: 0 }, 'out'), K(.4, { hx: 18, hy: 24, a: -5, d: 1 }, 'in'), K(.5, { hx: 17, hy: 23, a: -30, d: 1 }, 'out'), K(1, { hx: 16, hy: 23, a: -40, d: 0 }, 'io')],
  draw(p, g, c) { const s0 = [22, 25 + Math.round(p.d)]; TOOL.stake(g.front, s0, 90); if (!c.wipe) arm(g.front, 'near', [22, 27], c.look, 6); const B = [p.hx, p.hy]; TOOL.mallet(g.back, B, p.a); arm(g.back, 'far', B, c.look, 6); return s0; } };
/* Farming: hoeing between the rows while the crops grow. A chop hoe is lifted in front so the blade rides at about waist height, dropped
   so the blade bites the soil a stride ahead of the toes, then drawn back through the earth toward the feet to cut the
   weeds and loosen the crust; the left hand stays high on the haft, the right lower, and the back bends a little. */
SPEC.hoe = { lean: 'chop', beatMs: 1600, beats: [{ at: .4, sfx: 'hoe', fx: 'dust' }], wipe: [.84, .98], contact: 'free', stand: 62, rest: .8,
  keys: [K(0, { hx: 12, hy: 12, a: 64, g2: 6 }), K(.26, { hx: 15, hy: 14, a: 12, g2: 6 }, 'io'), K(.31, { hx: 15, hy: 13, a: 6, g2: 6 }, 'out'), K(.4, { hx: 16, hy: 16, a: 40, g2: 5 }, 'in'), K(.48, { hx: 16, hy: 16, a: 40, g2: 5 }, 'hold'), K(.62, { hx: 14, hy: 14, a: 52, g2: 5 }, 'lin'), K(.78, { hx: 12, hy: 12, a: 64, g2: 6 }, 'lin'), K(1, { hx: 12, hy: 12, a: 64, g2: 6 }, 'hold')],
  draw(p, g, c) { const B = [p.hx, p.hy], tip = TOOL.hoe(g.front, at(B, p.a, -1), p.a, c.metal); if (!c.wipe) arm(g.front, 'near', B, c.look, 0); arm(g.back, 'far', at(B, p.a, p.g2), c.look, 0); return tip; } };
/* Sailing: on the quay, hauling the halyard hand over hand to raise the sail before casting off. */
SPEC.haul = { lean: 'pull', beatMs: 1400, beats: [], wipe: null, contact: 'free', stand: 30, rest: 0,
  keys: [K(0, { ny: 12, fy: 19 }), K(.5, { ny: 19, fy: 12 }, 'io'), K(1, { ny: 12, fy: 19 }, 'io')],
  draw(p, g, c) { const N = [16, p.ny], F = [17, p.fy], top = c.mast || [46, -40], hi = N[1] < F[1] ? N : F, lo = hi === N ? F : N;
    g.front.fline(top, hi, '#c8b080'); g.front.fline(hi, lo, '#c8b080'); g.front.fline(lo, [13, 31], '#c8b080');
    arm(g.back, 'far', F, c.look, 0); if (!c.wipe) arm(g.front, 'near', N, c.look, 0); return top; } };
/* Melee practice: at the pell (a post or straw dummy) with sword in the right hand and the shield on the left arm, a
   cut from over the right shoulder down into the post's flank, then back to guard (Vegetius's drill at the post). */
SPEC.pell = { lean: 'chop', beatMs: 1200, beats: [{ at: .4, sfx: 'wood', fx: 'chips' }], wipe: [.55, .86], contact: 'edge', station: 'pell', rest: .9,
  keys: [K(0, { hx: 16, hy: 19, a: -55 }), K(.28, { hx: 12, hy: 10, a: -135 }, 'io'), K(.4, { hx: 18, hy: 17, a: -10 }, 'in'), K(.5, { hx: 18, hy: 18, a: 0 }, 'out'), K(1, { hx: 16, hy: 19, a: -55 }, 'io')],
  draw(p, g, c) { const B = [p.hx, p.hy], wt = c.weaponType || 'sword', tip = (TOOL[wt] || TOOL.sword)(g.back, B, p.a, c.metal); arm(g.back, 'far', B, c.look, 0);
    if (!c.wipe) { const N = [15, 19]; arm(g.front, 'near', N, c.look, 0); if (c.shield) { const m = ramp(c.shield, { gl: .7 }); g.front.poly([[13, 13], [17, 13], [17, 21], [15, 24], [13, 21]], m); g.front.fix([13, 13], m.gl); } }
    return wt === 'warhammer' ? tip : at(B, p.a, wt === 'dagger' ? 6 : 12); } };
/* Archery practice: side-on to the butt, the bow arm out at the target, the string drawn to the cheek, anchored a
   breath, loosed; the drawing hand follows back past the ear. */
SPEC.butts = { lean: 'none', beatMs: 1400, beats: [{ at: .62, sfx: 'bow' }, { at: .74, sfx: 'stake', fx: 'dust' }], wipe: [.8, .95], contact: 'edge', station: 'butt', rest: .05,
  keys: [K(0, { bx: 16, by: 24, ba: -60, dx: 15, dy: 22, n: 0, f: 0 }), K(.15, { bx: 20, by: 16, ba: -90, dx: 20, dy: 16, n: 1, f: 0 }, 'io'), K(.45, { bx: 20, by: 16, ba: -90, dx: 15, dy: 11, n: 1, f: 0 }, 'io'), K(.62, { bx: 20, by: 16, ba: -90, dx: 14, dy: 11, n: 1, f: 0 }, 'lin'),
    K(.63, { bx: 20, by: 16, ba: -90, dx: 12, dy: 11, n: 0, f: 0 }, 'lin'), K(.74, { bx: 20, by: 16, ba: -90, dx: 11, dy: 12, n: 0, f: 1 }, 'out'), K(.85, { bx: 19, by: 18, ba: -80, dx: 13, dy: 18, n: 0, f: 1 }, 'io'), K(1, { bx: 16, by: 24, ba: -60, dx: 15, dy: 22, n: 0, f: 1 }, 'io')],
  draw(p, g, c) { const G = [p.bx, p.by], Nh = [p.dx, p.dy], drawn = p.n > .5; bowDraw(g.front, G, p.ba, c.bowLen, ramp(c.bowCol || '#9b6a3e'), drawn ? [p.dx + 1, p.dy] : null);
    if (drawn) g.front.line([p.dx + 1, p.dy], at([p.dx + 1, p.dy], 0, 14), ramp('#c8a070'));
    if (!c.wipe) arm(g.front, 'near', G, c.look, 0); arm(g.back, 'far', Nh, c.look, 0);
    if (c.t > .62 && c.t < .74) { const k = (c.t - .62) / .12, x0 = p.bx + 2, x1 = c.edgeX != null ? c.edgeX : x0 + 30, x = lerp(x0, x1 - 12, k); g.front.line([x, 16], [x + 12, 16], ramp('#c8a070')); }
    else if (c.t >= .74 && c.edgeX != null) g.front.line([c.edgeX - 7, 16], [c.edgeX + 1, 16], ramp('#c8a070'));
    return [p.bx + 14 + (c.t >= .74 ? 0 : 0), 16]; } };

/* which spec runs an activity */
const specKey = act => {
  if (!act) return null; const k = act.kind;
  if (k === 'wood' || k === 'mine' || k === 'fish' || k === 'thieve' || k === 'hunt' || k === 'capture' || k === 'alch') return k;
  if (k === 'train') return 'stake';
  if (k === 'farm') return 'hoe';
  if (k === 'sail') return 'haul';
  if (k === 'drill') return String(act.id).startsWith('ranged') ? 'butts' : 'pell';
  if (k === 'recipe') { const r = D.RECIPES[act.id]; if (!r) return null;
    if (r.skill === 'smithing') return /^smelt/.test(r.id) ? 'smelt' : 'forge';
    return { cooking: 'cook', crafting: 'stitch', carpentry: 'saw', magic: 'runes', enchanting: 'engrave', herbalism: 'grind', exploration: 'survey' }[r.skill] || null; }
  return null;
};
const specFor = act => { const k = specKey(act); return k ? Object.assign({ id: k }, SPEC[k]) : null; };

/* ---------- poses and frames ---------- */
const FRAMES = 20;
const poseAt = (spec, t) => { const ks = spec.keys; let i = 0; while (i < ks.length - 2 && ks[i + 1][0] <= t) i++;
  const [t0, a] = ks[i], [t1, b, e] = ks[i + 1], k = t1 > t0 ? Math.max(0, Math.min(1, (t - t0) / (t1 - t0))) : 1, f = (EASE[e] || EASE.io)(k), o = {};
  for (const n in b) o[n] = lerp(a[n] ?? b[n], b[n], f); return o; };
const postureAt = (spec, t) => typeof spec.posture === 'function' ? spec.posture(t) : spec.posture || 'stand';
/* the frame on screen for cycle time t; impacts land exactly on a frame boundary (each beat's `at` is a multiple of 1/FRAMES) */
const frameOf = t => Math.min(FRAMES - 1, Math.floor(t * FRAMES + 1e-6));
const cache = new Map();
const lookFor = look => { const L = Q.heroRigLook ? Q.heroRigLook(look) : { skin: 0, sleeve: '#3f7fbf', sleeveType: 'cloth' };
  const sl = ramp(L.sleeve, L.sleeveType === 'plate' ? { gl: .72 } : {}), sk = A.SKIN[L.skin] || A.SKIN[0];
  return { key: [L.skin, L.sleeve, L.sleeveType].join(','), sleeve: sl, skin: sk, sleeveFar: darker(sl), skinFar: darker(sk) }; };
/* draws frame i of a spec into two canvases: back (the far arm, behind the body) and front (tools and the near arm) */
const drawFrame = (spec, ctx, i, wipe) => {
  const key = [spec.id, ctx.key, i, wipe ? 'w' : ''].join('|'); if (cache.has(key)) return cache.get(key);
  const t = (i + .5) / FRAMES, tq = i / FRAMES, p = poseAt(spec, tq), pos = postureAt(spec, tq);
  const g = { front: layer(Spr(RW, RH)), back: layer(Spr(RW, RH)) };
  const contact = spec.draw(p, g, Object.assign({}, ctx, { wipe, posture: pos, t: tq }));
  const out = { back: A.toCanvas(g.back.spr), front: A.toCanvas(g.front.spr), posture: pos, contact, t };
  if (cache.size > 900) cache.delete(cache.keys().next().value); cache.set(key, out); return out;
};
/* the contact point of a spec at its first strike, in body coordinates (for placing the hero and for tests) */
const contactOf = (spec, ctx) => { const b = (spec.beats || [])[0], t = b ? b.at : spec.rest || 0; return spec.draw(poseAt(spec, t), { front: layer(Spr(RW, RH)), back: layer(Spr(RW, RH)) }, Object.assign({}, ctx, { posture: postureAt(spec, t), t })); };

/* ---------- stations: the anvil, trestles, tripod and the rest, drawn at the hero's scale ---------- */
/* stage coordinates: x from the scene's centre, y up from the ground line (negative is up). The station canvas covers
   x -48..47 and y -56..-1. Each returns where the piece rests (x, y of its bottom centre) and the item's scale. */
const ST = (spr) => { const T = (x, y) => [x + SW / 2, y + SH]; return {
  rect(x, y, w, h, r) { const [a, b] = T(x, y); spr.rect(a, b, w, h, r); }, fix(x, y, c) { const [a, b] = T(x, y); spr.fix(a, b, c); },
  line(x0, y0, x1, y1, r) { const [a, b] = T(x0, y0), [c, d] = T(x1, y1); spr.line(a, b, c, d, r); }, ell(x, y, rx, ry, r) { const [a, b] = T(x, y); spr.ell(a, b, rx, ry, r); },
  poly(pts, r) { spr.poly(pts.map(([x, y]) => T(x, y)), r); } }; };
const STATION = {
  /* anvil on a stump: the face at the hero's hanging knuckles (8 px up), 12 px (64 cm) long, horn away from the smith */
  anvil(s, c) { const m = ramp(c.anvil || '#6a6e76', { gl: .7 }), st = ramp('#7a5236'); s.rect(-4, -4, 8, 4, st); s.fix(-3, -4, '#9a7a50'); s.fix(1, -2, st.lo);
    s.rect(-4, -5, 8, 1, m); s.rect(-2, -7, 4, 2, m); s.rect(-5, -9, 9, 2, m); s.poly([[4, -9], [8, -9], [4, -7]], m); s.rect(-6, -9, 1, 1, m); s.fix(-5, -9, m.gl); s.fix(-4, -9, m.gl); return { x: -2, y: -9, k: c.k }; },
  /* a clay shaft furnace with the bellows' tuyere at its foot; the mould for the bars on a flat stone beside it */
  furnace(s) { const clay = ramp('#b07a52'); s.poly([[-7, 0], [7, 0], [3, -24], [-3, -24]], clay); s.rect(-3, -25, 6, 1, ramp('#6a4030'));
    s.ell(0, -27, 2, 2, ramp('#f8b040')); s.fix(0, -28, '#fff0b0'); s.rect(-2, -5, 4, 4, ramp('#2a1810')); s.rect(-1, -3, 2, 2, ramp('#f08030')); s.fix(0, -3, '#f8d060');
    for (const [x, y] of [[-4, -8], [2, -12], [-2, -17], [3, -5]]) s.fix(x, y, clay.lo); s.rect(10, -2, 8, 2, STONE); return { x: 14, y: -2, k: 1 }; },
  /* two trestles at belt height with the board across them */
  trestle(s) { const w = ramp('#9b7a4e'); for (const x of [-8, 14]) { s.line(x - 3, -1, x, -9, w); s.line(x + 3, -1, x, -9, w); s.rect(x - 3, -10, 7, 1, w); }
    s.rect(-14, -12, 34, 2, ramp('#d8b878')); s.fix(-14, -12, '#f0d8a0'); for (let i = 0; i < 4; i++) s.fix(-2 + i * 2, -1 - (i % 2), '#e8d0a0'); return { x: 16, y: -12 }; },
  /* an iron tripod with the pot on its chain over a small fire; a warming stone for the dish */
  tripod(s) { const ir = ramp('#4a4a52'); s.line(-7, -1, 0, -24, ir); s.line(7, -1, 0, -24, ir); s.line(0, -24, 0, -14, ir);
    s.ell(0, -9, 4.5, 3.5, ramp('#3a3a42')); s.rect(-5, -12, 10, 1, ramp('#5a5a62')); s.ell(0, -2, 4, 1.5, ramp('#e07030')); s.ell(0, -2, 2, 1, ramp('#f8d060'));
    for (const x of [-4, -1, 2]) s.rect(x, -1, 3, 1, ramp('#6a4a30')); s.rect(10, -3, 7, 3, STONE); return { x: 13, y: -3, k: 1 }; },
  /* a stitching clam between the knees: two staves meeting at the jaws, holding the work upright */
  clam(s) { const w = ramp('#a07a4a'); s.line(-3, -1, -2, -7, w); s.line(-1, -1, -1, -7, w); s.rect(-3, -8, 3, 1, w); return { x: -1.5, y: -8, k: 1 }; },
  /* a stone tablet (or the piece) on a waist-high block */
  tablet(s) { s.rect(-6, -9, 12, 9, ramp('#7a6a5a')); s.rect(-7, -11, 14, 2, ramp('#9a948c')); s.fix(-7, -11, '#c8c2b8'); return { x: 3, y: -11, k: 1 }; },
  /* a table at belt height with a stone mortar on it */
  mortar(s) { const w = ramp('#8a6040'); s.rect(-9, -12, 22, 2, w); s.rect(-8, -10, 2, 10, w); s.rect(10, -10, 2, 10, w); s.poly([[-4, -16], [2, -16], [1, -12], [-3, -12]], ramp('#9a948c')); s.rect(-4, -16, 6, 1, ramp('#7a746c')); return { x: 7, y: -12, k: 1 }; },
  /* a plane table on a tripod, the sheet pinned on it and the alidade (a sighting rule) on the sheet */
  planetable(s) { const w = ramp('#8a6040'); s.line(-4, -1, 0, -11, w); s.line(4, -1, 0, -11, w); s.line(0, -1, 0, -11, w); s.rect(-7, -13, 14, 2, w); s.rect(-6, -14, 12, 1, ramp('#f0e6cc')); s.rect(-4, -15, 8, 1, ramp('#6a5a40')); s.fix(-4, -16, '#6a5a40'); s.fix(3, -16, '#6a5a40'); return { x: 5, y: -14, k: 1 }; },
  /* the pell: a post as tall as a man; straw dummy, oak post, iron-bound or runed by the drill */
  pell(s, c) { const v = c.drill || 'straw', post = ramp(v === 'oak' ? '#7a5236' : '#9b7a4e');
    s.rect(-2, -30, 4, 30, post); s.rect(-4, -1, 8, 1, ramp('#6a4a30'));
    if (v === 'straw') { s.ell(0, -22, 5, 7, ramp('#d8b860')); s.ell(0, -32, 3.5, 3.5, ramp('#d8b860')); s.line(-4, -20, 4, -20, ramp('#8a6a30')); }
    if (v === 'iron') for (const y of [-26, -18, -10]) s.rect(-3, y, 6, 1, IRON);
    if (v === 'runed') for (const y of [-24, -16]) { s.fix(-1, y, '#8fc0ff'); s.fix(0, y + 1, '#c8b0ff'); }
    return null; },
  /* a hay-bale butt with its painted face */
  butt(s) { const h = ramp('#d8b860'); s.rect(-5, -12, 10, 12, h); s.rect(-5, -24, 10, 12, h); s.line(-5, -12, 4, -12, ramp('#a88a40'));
    s.ell(-1, -16, 3.5, 3.5, ramp('#f0e6cc')); s.ell(-1, -16, 2, 2, ramp('#c8483c')); s.fix(-1, -16, '#f0d060'); return null; }
};
const stationCanvas = (name, c) => { const key = 'st|' + name + '|' + JSON.stringify(c); if (cache.has(key)) return cache.get(key); const spr = Spr(SW, SH), info = STATION[name](ST(spr), c) || null; const out = { canvas: A.toCanvas(spr), info }; cache.set(key, out); return out; };

/* how big the thing being made sits on the anvil, bench or table: by what it really is, at a whole-number scale
   (1x = 16 css px, about 28 cm) */
const pieceScale = id => { const it = D.ITEMS[id]; if (!it) return 1; const s = it.slot;
  if (s === 'weapon') return /dagger|knife/.test(id) || it.wtype === 'dagger' ? 1 : 2;
  if (s === 'body' || s === 'legs' || s === 'shield') return 2;
  if (/^plank|^tool_|bow|staff|furn/.test(id)) return 2; return 1; };

/* ---------- reading a sprite's edge, so the tool meets the trunk or rock face exactly ---------- */
const alphaOf = img => { try { const c = document.createElement('canvas'), w = img.naturalWidth, h = img.naturalHeight; if (!w || !h) return null; c.width = w; c.height = h; const x = c.getContext('2d'); x.drawImage(img, 0, 0); return { w, h, d: x.getImageData(0, 0, w, h).data }; } catch (e) { return null; } };
const edgeAt = (al, row) => { if (!al) return null; for (const r of [row, row - 1, row + 1, row - 2, row + 2]) { if (r < 0 || r >= al.h) continue; for (let x = 0; x < al.w; x++) if (al.d[(r * al.w + x) * 4 + 3] > 40) return x; } return null; };
const bottomGap = al => { if (!al) return 0; for (let y = al.h - 1; y >= 0; y--) for (let x = 0; x < al.w; x++) if (al.d[(y * al.w + x) * 4 + 3] > 40) return al.h - 1 - y; return 0; };

/* ---------- mounting the rig on a work scene ---------- */
const GROUND = 4; /* the district's ground line, district px above the scene's bottom (towns.js districtFor) */
const toolMetal = act => { const sk = act && (act.kind === 'wood' ? 'woodcutting' : act.kind === 'mine' ? 'mining' : null); const k = sk && Q.toolKey && Q.toolKey(sk), n = k && Q.toolTier && Q.toolTier(sk), it = n && D.ITEMS[`tool_${k}_${n}`];
  return ramp(it && it.col || '#9aa3ad', { gl: .72 }); };
const ctxFor = (spec, act) => {
  const look = lookFor(S().look), eq = (S().equip) || {}, w = eq.weapon && D.ITEMS[eq.weapon];
  const c = { look, key: look.key, metal: toolMetal(act) };
  if (spec.id === 'forge') { const g = S().smithGear || {}; c.metal = ramp(Q.smithMetalCol ? Q.smithMetalCol('hammer') : '#b98d4e', { gl: .72 }); c.anvil = Q.smithMetalCol ? Q.smithMetalCol('anvil') : null; c.key += '|' + (g.hammer || 0); }
  if (spec.id === 'pell') { const t = !w ? 'sword' : /dagger/.test(w.id) || w.wtype === 'dagger' ? 'dagger' : /hammer/.test(w.id) || w.wtype === 'hammer' ? 'warhammer' : w.id === 'barnacle_cutlass' ? 'cutlass' : 'sword';
    c.weaponType = t; c.metal = ramp(w && w.col || '#cdd5dc', { gl: .75 }); c.shield = eq.shield && D.ITEMS[eq.shield] ? D.ITEMS[eq.shield].col : null; c.drill = String(act.id).split(':')[1]; c.key += '|' + t + (w ? w.col : '') + (c.shield || ''); }
  if (spec.id === 'butts') { c.bowLen = w && /long|yew|magic/.test(w.id) ? 30 : 24; c.bowCol = w && w.col; c.drill = String(act.id).split(':')[1]; c.key += '|' + c.bowLen + (c.bowCol || ''); }
  if (spec.id === 'alch') { c.orb = ramp(w && w.style === 'magic' && w.id === 'witch_staff' ? '#b79cff' : '#8fc0ff'); }
  if (spec.id === 'wood' || spec.id === 'mine') c.key += '|' + c.metal.base;
  return c;
};
/* the rig's DOM: two canvases around the body inside .scene-worker, a station canvas, and an effects layer */
const canvasEl = (cls, w, h, css) => { const c = document.createElement('canvas'); c.width = w; c.height = h; c.className = cls; c.setAttribute('aria-hidden', 'true'); Object.assign(c.style, css); return c; };
const mount = (stage, act, spec) => {
  const sc = stage.querySelector('.activity-scene'), worker = sc && sc.querySelector('.scene-worker'), body = worker && worker.querySelector('img'); if (!worker || !body) return null;
  const ctx = ctxFor(spec, act), rig = { act, spec, ctx, sc, worker, body, frame: -1, wipe: false, posture: null, strikes: {}, t0: act.t0 };
  sc.classList.add('rigged', 'rig-' + spec.id); sc.querySelectorAll('.action-tool,.work-atmosphere').forEach(e => e.remove());
  worker.querySelectorAll('.rig-body').forEach(e => e.remove());
  const wrap = document.createElement('span'); wrap.className = 'rig-body'; worker.insertBefore(wrap, body);
  rig.back = canvasEl('rig-back', RW, RH, { left: -OX * PX + 'px', width: RW * PX + 'px', height: RH * PX + 'px' }); rig.front = canvasEl('rig-front', RW, RH, { left: -OX * PX + 'px', width: RW * PX + 'px', height: RH * PX + 'px' });
  wrap.append(rig.back, body, rig.front);
  worker.className = 'scene-worker lean-' + (spec.lean || 'none');
  const ground = (spec.ground || GROUND) * PX; worker.style.bottom = ground + 'px';
  /* the station, centred where the target was, and the piece on it */
  const tgt = sc.querySelector('.scene-target');
  sc.querySelectorAll('.work-station,.work-fx').forEach(e => e.remove());
  if (spec.station) { const st = stationCanvas(spec.station, { anvil: ctx.anvil, drill: ctx.drill });
    const cv = canvasEl('work-station', SW, SH, { left: `calc(50% - ${SW / 2 * PX}px)`, bottom: ground + 'px', width: SW * PX + 'px', height: SH * PX + 'px' }); cv.getContext('2d').drawImage(st.canvas, 0, 0); sc.appendChild(cv); rig.station = st;
    if (tgt) { if (!st.info) tgt.classList.add('rig-hidden'); else { tgt.classList.add('on-station'); const img = tgt.querySelector('img'), r = D.RECIPES[sc.dataset.task], k = st.info.k || pieceScale(r ? Object.keys(r.out)[0] : null);
      tgt.style.left = `calc(50% + ${st.info.x * PX}px)`; tgt.style.bottom = (ground - st.info.y * PX) + 'px';
      if (img) { img.style.setProperty('width', 16 * k + 'px', 'important'); img.style.setProperty('height', 16 * k + 'px', 'important'); img.dataset.snapped = 1; }
      if (spec.heat) tgt.insertAdjacentHTML('beforeend', '<span class="work-heat" aria-hidden="true"></span>'); } } }
  const fx = document.createElement('span'); fx.className = 'work-fx'; fx.setAttribute('aria-hidden', 'true'); sc.appendChild(fx); rig.fx = fx;
  stage._rig = rig; place(rig); return rig;
};
/* where the hero stands: at their stand distance from the station, or so the tool meets the target's edge */
const place = rig => {
  const { spec, ctx, sc, worker } = rig, tgt = sc.querySelector('.scene-target'), img = tgt && tgt.querySelector('img');
  let bx = -(spec.stand || 30), edgeX = null;
  if (spec.id === 'fish') ctx.float = [-bx - 2, 19]; /* the float sits over the fish, out in the water */
  if (spec.id === 'haul') ctx.mast = [-bx + 16, -40]; /* the halyard runs up to the boat's masthead (towns.js ship at the quay) */
  const contact = contactOf(spec, ctx);
  if (spec.contact === 'edge') {
    let al = null, k = PX, left = 0;
    if (spec.station && rig.station) { /* a drawn station (pell, butt): read its own pixels */ const c = rig.station.canvas, x = c.getContext('2d'); al = { w: SW, h: SH, d: x.getImageData(0, 0, SW, SH).data }; k = PX; left = -SW / 2; }
    else if (img && img.complete && img.naturalWidth) { al = alphaOf(img); k = (img.offsetWidth || img.naturalWidth * PX) / img.naturalWidth; left = -(img.offsetWidth || 0) / 2 / PX;
      const gap = bottomGap(al); if (gap && tgt) tgt.style.marginBottom = (GROUND * PX - gap * k) + 'px'; /* stand the target's lowest pixel on the ground line */ }
    else if (img) { img.addEventListener('load', () => { if (rig.sc.isConnected) place(rig); }, { once: true }); }
    if (al) { const rows = al.h, hy = contact[1] - 32, row = spec.station ? SH + Math.round(hy) : rows - 1 - Math.round(-hy * PX / k);
      const ex = edgeAt(al, row); if (ex != null) { edgeX = left + ex * k / PX; bx = Math.round(edgeX - contact[0] + 1); } }
  }
  rig.bx = bx; rig.ctx.edgeX = edgeX != null ? edgeX - bx : null; /* butts: the arrow flies to the face (body coordinates) */
  if (spec.id === 'butts') { for (const k of [...cache.keys()]) if (k.startsWith(spec.id + '|')) cache.delete(k); rig.frame = -1; }
  rig.ctx.key = rig.ctx.key.replace(/\|bx-?\d+$/, '') + '|bx' + bx;
  worker.style.left = `calc(50% + ${bx * PX}px)`; sc.style.setProperty('--worker-x', `calc(50% + ${bx * PX}px)`);
  rig.contactStage = [bx + contact[0], contact[1] - 32];
  if (rig.fx) { rig.fx.style.left = `calc(50% + ${(bx + contact[0]) * PX}px)`; rig.fx.style.bottom = ((spec.ground || GROUND) * PX + (32 - contact[1]) * PX) + 'px'; }
};
/* draw frame i (and the right posture of the body) */
const show = (rig, t) => {
  const { spec, ctx } = rig, still = calm(), tt = still ? (spec.rest || 0) : t, i = frameOf(tt);
  const wipeUrl = rig.wipeUrl || (rig.wipeUrl = {}), pos = postureAt(spec, i / FRAMES);
  if (pos !== rig.posture) { rig.posture = pos; rig.worker.dataset.posture = pos; const base = Q.heroFrameUrl(S().look, null, pos); if (rig.body.getAttribute('src') !== base) rig.body.setAttribute('src', base); }
  const wu = wipeUrl[pos] || (wipeUrl[pos] = Q.heroFrameUrl(S().look, 'wipe', pos));
  let wipe = rig.body.getAttribute('src') === wu;
  /* a wipe that a late timer let run on past its window is cut short before the next strike (personality.js puts
     the plain figure back on its next tick) */
  const W = spec.wipe; if (wipe && (!W || still || t < W[0] - .03 || t > W[1] + .08)) { rig.body.setAttribute('src', Q.heroFrameUrl(S().look, null, pos)); wipe = false; }
  if (i === rig.frame && wipe === rig.wipe) return i;
  const f = drawFrame(spec, ctx, i, wipe); rig.frame = i; rig.wipe = wipe; rig.worker.dataset.frame = i;
  for (const [el, src] of [[rig.back, f.back], [rig.front, f.front]]) { const x = el.getContext('2d'); x.clearRect(0, 0, RW, RH); x.drawImage(src, 0, 0); }
  return i;
};
/* effects at the contact point: chips, sparks, sawdust, ripples; the target gives a little */
const FX = { chips: ['#d8b878', '#a8845a', '#7a5236'], sparks: ['#fff0b0', '#f8c050', '#f08030'], dust: ['#e8d0a0', '#d8b878'], ripple: ['#d8eef4'], splash: ['#d8eef4', '#a8d0e0', '#ffffff'], glint: ['#fff3cf', '#e6b84a'], flare: ['#f8d060', '#f08030'], flash: ['#fff3cf', '#c8b0ff'] };
const burst = (rig, kind) => {
  if (calm() || !rig.fx || !rig.fx.isConnected || !FX[kind]) return;
  const cols = FX[kind], n = kind === 'ripple' ? 2 : 5, up = kind === 'dust' || kind === 'chips' ? 1 : -1;
  for (let i = 0; i < n; i++) { const s = document.createElement('i'); s.style.background = cols[i % cols.length]; if (kind === 'ripple' || kind === 'splash') s.classList.add('wide');
    rig.fx.appendChild(s); const dx = (i - n / 2) * (kind === 'sparks' ? 4 : 3) * (kind === 'ripple' ? 3 : 1), dy = kind === 'ripple' ? 0 : -(6 + (i % 3) * 5);
    try { s.animate([{ transform: 'translate(0,0)', opacity: 1 }, { transform: `translate(${dx}px,${dy}px)`, opacity: .9, offset: .35 }, { transform: `translate(${dx * 1.6}px,${dy + 18 * (up > 0 ? 1 : .4)}px)`, opacity: 0 }], { duration: 420 + i * 40, easing: 'cubic-bezier(.2,.7,.4,1)' }).finished.then(() => s.remove(), () => s.remove()); } catch (e) { s.remove(); } }
  const tgt = rig.sc.querySelector(rig.spec.station ? '.work-station' : '.scene-target');
  if (tgt && (kind === 'chips' || kind === 'sparks' || kind === 'dust')) try { tgt.animate([{ translate: '0 0' }, { translate: '2px 0' }, { translate: '-1px 0' }, { translate: '0 0' }], { duration: 160, composite: 'add' }); } catch (e) { /* older browsers: no give */ }
};
/* the heat in the piece fades through the action and comes back with the next one (forge) */
const heat = (rig, k) => { const h = rig.sc.querySelector('.work-heat'); if (h) h.style.opacity = calm() ? .5 : (1 - k * .85).toFixed(3); };

/* a tool's drawn length in hero px (1 px is about 5.3 cm): what tests/skill-realism.cjs holds to real sizes */
const toolLength = name => { const g = layer(Spr(RW, RH)); TOOL[name](g, [0, 0], 0, IRON); let a = RW, b = -1;
  for (let y = 0; y < RH; y++) for (let x = 0; x < RW; x++) if (g.spr.px[y * RW + x]) { a = Math.min(a, x); b = Math.max(b, x); } return b - a + 1; };
Q.workRig = {
  TOOLS: Object.keys(TOOL), toolLength, STATIONS: Object.keys(STATION),
  SPEC, FRAMES, RW, RH, OX, OY, PX, specFor, specKey, poseAt, drawFrame, contactOf, pieceScale, stationCanvas,
  mount, show, burst, heat, ctxFor, calm, frameOf,
  /* for personality.js: the current cycle and when a brow wipe fits (never over a strike) */
  beatNow: () => { const r = Q.workRig.live; if (!r || !r.spec.wipe) return null; return { beat: r.beat, key: r.cycleKey, phase: r.t, wipe: r.spec.wipe }; },
  wipeOk: () => { const r = Q.workRig.live; if (!r) return true; const W = r.spec.wipe; return !!W && r.t >= W[0] - .03 && r.t <= W[1] + .08; },
  live: null
};
/* redraws replace the stage: the clock (strike_sync.js) remounts on the next frame */
})();
