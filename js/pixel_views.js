/* Idlewick pixel art: the second view of every ordinary creature (owner, 28 Nov 2026: "each boss, creature, monster etc
   needs a side view and a front view - front view for when we're viewing them in menus and guides and such and a side
   view for when they're fighting, being caught, being hunted etc").
   Each anatomy builder in pixel_creatures.js draws one view natively (A.NATIVE_VIEW): animals, lizards and serpents
   side-on, people, birds, crabs, spiders and spirits front-on. This file draws the other one for every builder into
   A.ALT_VIEWS, in the same house style (32 x 32, top-left light, sphere-lit ellipses, coloured outlines, two-pixel
   eyes, feet on the bottom rows): a head-on front view with both eyes and symmetric legs or wings, and a true profile
   facing right with one eye, the snout or nose forward and the weapon held out toward the right. Then it registers
   A.VIEWS.front / A.VIEWS.side for every creature in D.MON except the 28 with hand-drawn 64 x 64 art (bosses,
   mini-bosses and tower bosses keep their own); tower floor creatures also get matching 64 x 64 views at twice the
   detail (A.atScale), as their single drawing did. Loaded after the creature art files and before pixel_runtime.js. */
(() => {
const Q = window.DQ, D = Q && Q.data, A = Q && Q.pixelArt; if (!A || !A.ALT_VIEWS || !A.CKIT) return;
const { Spr, ramp, mix, R } = A, { rp, eye, weapon, dome, EYE } = A.CKIT, ALT = A.ALT_VIEWS;
const shade = (c, t = .3) => mix(c, '#1a1838', t);
const sinr = Math.sin, cosr = Math.cos, PI = Math.PI;

/* ================= profiles of the front-on builders ================= */
/* a weapon held out in the near hand (hx, hy), pointing forward and up */
function weaponSide(s, w, hx, hy, col) {
  const m = ramp(col || '#b8c0c8', { gl: .75 });
  if (w === 'dagger') { s.line(hx + 1, hy - 1, hx + 4, hy - 4, m); s.line(hx + 2, hy - 1, hx + 5, hy - 4, m); s.fix(hx + 5, hy - 5, m.gl); s.line(hx, hy - 2, hx + 2, hy, R.gold); }
  if (w === 'sword') { s.line(hx + 1, hy - 1, hx + 7, hy - 7, m); s.line(hx + 2, hy - 1, hx + 8, hy - 7, m); s.fix(hx + 8, hy - 8, m.gl); s.line(hx - 1, hy - 2, hx + 2, hy + 1, R.gold); }
  if (w === 'cutlass') { for (let i = 1; i <= 9; i++) { const y = hy - Math.round(i * .45 + i * i / 28); s.dot(hx + i, y, m); if (i < 8) s.dot(hx + i, y + 1, m); } s.fix(hx + 10, hy - 8, m.gl); s.line(hx, hy - 2, hx, hy + 1, R.gold); s.fix(hx - 1, hy + 1, R.gold.lo); }
  if (w === 'axe') { s.line(hx - 2, hy + 3, hx + 3, hy - 7, R.wood); s.poly([[hx + 2, hy - 8], [hx + 8, hy - 10], [hx + 8, hy - 2], [hx + 3, hy - 4]], m); }
  if (w === 'club') { s.line(hx - 1, hy + 2, hx + 4, hy - 7, R.wood); s.line(hx, hy + 2, hx + 5, hy - 7, R.wood); s.ell(hx + 5, hy - 8, 2.2, 2.2, R.woodLight); }
  if (w === 'staff') { s.line(hx + 1, hy + 10, hx + 1, hy - 12, R.wood); s.ell(hx + 1, hy - 13, 2, 2, ramp(col || '#b79cff', { gl: .85 })); }
  if (w === 'pitchfork') { s.line(hx + 1, hy + 10, hx + 1, hy - 9, R.wood); for (const dx of [-1, 1, 3]) s.line(hx + dx, hy - 9, hx + dx, hy - 12, m); s.line(hx - 1, hy - 9, hx + 3, hy - 9, m); }
}

/* humanoid in profile: the same chibi (head centre row 9.5, feet on rows 28-29), turned to face right */
ALT.humanoid = o => {
  const s = Spr(32, 32), k = o.big ? 1 : 0, skinC = o.skin || '#e0b088', skin = rp(skinC), cl = o.cloth || '#7a6a5a', cloth = rp(cl), c2 = o.cloth2 || mix(cl, '#1a1838', .35), cloth2 = rp(c2),
    far = rp(shade(c2, .3)), bootC = o.boots || '#4a3226', boots = rp(bootC), bootsFar = rp(shade(bootC, .35)), T = 4, B = 14, hx = 15, hc = 9.5, ec = o.glow || EYE;
  const tall = o.weapon === 'staff' || o.weapon === 'pitchfork', reach = o.weapon || o.reach, hand = tall ? [23, 19] : [21, 19];
  if (o.skeleton) { const b = rp('#e4ddca'), bf = rp('#aaa290'), dk = rp('#2a1c2a');
    s.line(13, 24, 12, 29, bf); s.rect(11, 29, 4, 1, bf); s.line(12, 16, 10, 22, bf);                                                  /* far leg and arm */
    s.line(14, 14, 13, 22, b); s.line(15, 14, 14, 22, b); for (let y = 16; y <= 20; y += 2) s.line(15, y, 19, y + 1, b);               /* spine, ribs forward */
    s.rect(12, 22, 6, 2, b); s.line(16, 24, 17, 29, b); s.rect(16, 29, 5, 1, b);                                                        /* pelvis, near leg, foot forward */
    s.ell(15, 8.5, 5.4, 5.2, b); s.rect(16, 12, 5, 2, b); for (const x of [17, 19]) s.fix(x, 13, dk.base);                               /* skull, jaw */
    s.rect(17, 7, 3, 3, dk); s.fix(18, 8, o.glow || '#7fd6ff'); s.fix(21, 10, dk.base); s.fix(11, 9, dk.lo);
    if (o.weapon) { s.line(15, 15, 17, 19, b); s.line(17, 19, 20, 19, b); weaponSide(s, o.weapon, 21, 19, o.weaponCol); s.rect(20, 18, 2, 2, b); } else s.line(15, 15, 16, 22, b);
    return s; }
  /* legs a step apart, the far one in shadow; boots point forward */
  s.rect(12, 24, 3, 4, far); s.rect(12, 28, 5, 2, bootsFar);
  s.rect(16, 24, 3, 4, cloth2); s.rect(16, 28, 5, 2, boots);
  if (o.straw) { s.line(13, 24, 12, 30, R.straw); s.line(17, 24, 18, 30, R.straw); }
  /* the far arm, behind the body */
  const sleeveC = o.armour || cl, sleeve = rp(sleeveC), sleeveFar = rp(shade(sleeveC, .38)), skinFar = rp(shade(skinC, .3));
  if (o.zombie) { s.rect(16, 15, 9, 2, sleeveFar); s.rect(25, 14, 3, 3, skinFar); }
  else { s.rect(10 - k, 16, 2, 6, sleeveFar); s.rect(10 - k, 22, 2, 2, skinFar); }
  /* body */
  s.poly([[12 - k, 15], [20 + k, 15], [20 + k, 25], [12 - k, 25]], cloth);
  if (o.robe) s.poly([[11, 21], [21, 21], [23, 30], [10, 30]], cloth);
  if (o.armour) { const m = ramp(o.armour, { gl: .72 }); s.poly([[12 - k, 15], [20 + k, 15], [21 + k, 19], [20 + k, 24], [12 - k, 24]], m); s.line(18 + k, 16, 18 + k, 23, null, m.lo); s.tone(14, 17, m, 4); }
  s.rect(12 - k, 22, 9 + 2 * k, 1, rp(o.belt || '#3e2a20')); s.fix(19 + k, 22, '#e6b84a');
  /* head */
  if (o.ears === 'goblin') s.poly([[hx - 3, hc - 2], [hx - 12, hc - 6], [hx - 3, hc + 2]], skin);
  s.ell(hx, hc, 6 + k * .5, 5.8, skin);
  s.rect(21, 10, o.ears === 'goblin' ? 2 : 1, 2, skin);                                                                                /* the nose */
  if (o.horns) { const h = rp('#efe2c4'); s.poly([[16, T + 2], [20, T - 4], [19, T + 1]], h); s.poly([[11, T + 3], [7, T - 3], [13, T + 1]], h); }
  const face = () => { eye(s, 18, 10, ec, !o.glow);
    if (o.mouth === 'grin') { s.line(16, 13, 20, 13, null, skin.out); s.fix(19, 14, '#f4ecd8'); } else s.line(18, 13, 19, 13, null, skin.out);
    if (!o.glow && !o.zombie) s.fix(16, 12, mix(skin.base, '#e0606a', .35)); };
  if (!o.hat || !['hood', 'helm', 'horned'].includes(o.hat)) { if (o.ears !== 'goblin') { s.fix(12, 9, skin.lo); s.fix(11, 10, skin.lo); s.fix(12, 11, skin.lo); } }
  face();
  if (o.beard) { const b = rp(o.beard); for (let y = 12; y <= 17; y++) { const x0 = 12 + Math.max(0, y - 12) * .8, x1 = 21 - Math.max(0, y - 14) * 1.4; s.line(x0, y, x1, y, b); } s.line(18, 13, 20, 13, null, '#5a2a2a'); }
  if (o.mask) { s.rect(15, 11, 8, 3, rp(o.mask)); s.line(9, 11, 7, 14, rp(o.mask)); }
  if (o.hair) { const h = rp(o.hair); s.ell(hx - 1, T + 1.5, 6.2, 2.6, h); s.rect(8, T + 1, 4, 7, h); }
  /* hats and helmets, in profile */
  const H = o.hat, hc2 = rp(o.hatCol || '#4a3a5a');
  if (H === 'hood') { s.poly([[12, T - 5], [19, T - 3], [23, T + 3], [22, B + 2], [8, B + 2], [7, T + 3]], hc2); s.ell(18, hc + 1.5, 3.4, 4.2, skin); s.rect(21, 10, 1, 2, skin); face(); if (o.mask) s.rect(16, 12, 6, 2, rp(o.mask)); }
  if (H === 'tricorn') { s.poly([[6, T + 2], [25, T + 2], [26, T - 1], [21, T], [19, T - 4], [11, T - 4], [9, T], [5, T - 1]], hc2); s.line(6, T + 2, 25, T + 2, null, R.gold.base); s.fix(21, T - 1, R.gold.hi); }
  if (H === 'witch') { s.poly([[8, T - 10], [20, T + 1], [10, T + 1]], hc2); s.rect(6, T + 1, 19, 2, hc2); s.fix(14, T - 1, '#e6c86a'); s.fix(15, T - 1, '#e6c86a'); }
  if (H === 'bandana') { s.rect(9, T - 1, 13, 4, hc2); s.poly([[9, T], [3, T + 5], [8, T + 3]], hc2); [[12, T], [16, T + 1], [19, T]].forEach(([x, y]) => s.fix(x, y, '#f4ecd8')); }
  if (H === 'cap') { s.ell(hx - 1, T + .5, 6.4, 3.2, hc2); s.rect(15, T + 2, 9, 1, hc2); [[12, T - 1], [17, T - 2]].forEach(([x, y]) => s.fix(x, y, '#f4ecd8')); }
  if (H === 'straw') { const st = R.straw; s.rect(5, T + 1, 20, 2, st); s.ell(15, T - 1, 5.4, 3, st); s.line(5, T + 3, 4, T + 6, null, st.lo); s.line(24, T + 3, 25, T + 5, null, st.lo); s.rect(11, T, 9, 1, rp('#a8483a')); }
  if (H === 'helm' || H === 'horned') { const m = ramp(o.hatCol || '#9aa3ad', { gl: .72 }); dome(s, hx, T + 5, 7.2, 7.4, T + 4, m); s.rect(8, T + 4, 15, 1, m); s.rect(8, T + 5, 4, 5, m); s.rect(20, T + 5, 2, 3, m); s.line(15, T - 2, 15, T + 3, null, m.lo);
    if (H === 'horned') { const h = rp('#efe2c4'); s.poly([[18, T + 1], [23, T - 5], [20, T - 3]], h); s.poly([[11, T + 1], [6, T - 5], [9, T - 3]], h); } }
  if (H === 'crown') { const g = ramp(o.hatCol || '#e6b84a', { gl: .8 }); s.poly([[10, T + 2], [10, T - 3], [12, T - 1], [15, T - 5], [18, T - 1], [20, T - 3], [20, T + 2]], g); s.fix(15, T - 1, '#ff7ad0'); s.fix(19, T, '#7ad0ff'); }
  if (H === 'antler') { const a = rp('#a88a5a'); s.line(12, T + 1, 8, T - 4, a); s.line(10, T - 2, 7, T - 1, a); s.line(17, T + 1, 21, T - 4, a); s.line(19, T - 2, 22, T - 1, a); }
  if (H === 'halo') { const h = ramp('#fff0a0', { gl: .9 }); for (let i = 0; i < 18; i++) { const a = i * PI / 9; s.fix(14 + cosr(a) * 5, T - 2 + sinr(a) * 1.4, h.base); } }
  if (o.straw) [[10, 17], [20, 18], [16, 25]].forEach(([x, y]) => { s.fix(x, y, R.straw.hi); s.fix(x + 1, y + 1, R.straw.base); });
  if (o.barnacles) [[13, 18], [18, 20], [14, 23]].forEach(([x, y]) => { s.fix(x, y, '#e8e4d8'); s.fix(x + 1, y, '#b8b4a8'); });
  if (o.strings) for (const [x, y] of [[11, 15], [15, T - 1], [21, 17]]) s.line(x, 0, x, y, null, '#d8d4c8');
  /* the near arm: out front with the weapon, both out for the walking dead, hanging otherwise */
  if (o.armour) s.ell(15, 16, 2.6, 2, ramp(o.armour, { gl: .72 }));
  if (o.zombie) { s.rect(15, 17, 9, 3, sleeve); s.rect(24, 17, 3, 3, skin); }
  else if (reach) { s.rect(14, 16, 3, 4, sleeve); s.rect(16, 19, hand[0] - 17, 2, sleeve); if (o.weapon) weaponSide(s, o.weapon, hand[0], hand[1], o.weaponCol); s.rect(hand[0] - 1, 18, 2, 3, skin); }
  else { s.rect(15, 16, 3, 6, sleeve); s.rect(15, 22, 3, 2, skin); }
  return s;
};

/* knight in profile: visored helm, one pauldron, the sword raised out front, the cape behind */
ALT.knight = o => { const s = Spr(32, 32), m = ramp(o.metal, { gl: .7 }), mf = ramp(shade(o.metal, .32), { gl: .6 }), t = rp(o.tabard || '#5a2a2a'), gl = o.glow || '#ff8a3a';
  if (o.cape) s.poly([[10, 12], [16, 12], [14, 30], [4, 30]], rp(o.cape));
  s.rect(12, 23, 3, 6, mf); s.rect(12, 29, 5, 2, mf); s.rect(9, 14, 3, 8, mf);
  s.poly([[11, 12], [20, 12], [20, 24], [12, 24]], m); s.poly([[17, 14], [21, 14], [21, 26], [19, 27], [17, 25]], t);
  s.rect(16, 23, 3, 6, m); s.rect(16, 29, 5, 2, m);
  s.ell(15, 7, 4.6, 5, m); s.rect(18, 7, 3, 4, m); s.rect(16, 7, 5, 1, rp('#120e18')); s.fix(18, 7, gl); s.line(13, 2, 11, 6, null, m.gl); for (const y of [9, 10]) s.fix(19, y, m.lo);
  if (o.plume) s.poly([[14, 2], [9, -1], [7, 3], [12, 3]], rp(o.plume));
  if (o.crown) { const g = ramp(o.crown, { gl: .85 }); s.poly([[11, 3], [11, 0], [13, 2], [15, -1], [17, 2], [19, 0], [19, 3]], g); }
  if (o.embers) [[10, 20], [22, 18], [13, 4], [8, 26]].forEach(([x, y]) => s.fix(x, y, '#ffb04a'));
  const bl = ramp(o.blade || '#cdd5dc', { gl: .8 }); s.line(22, 17, 26, 3, bl); s.line(23, 17, 27, 3, bl); s.line(20, 17, 25, 18, R.gold); s.line(21, 19, 22, 20, R.leather || R.wood);
  s.ell(15, 13, 3.4, 2.6, m); s.rect(14, 14, 3, 5, m); s.rect(16, 18, 5, 3, m);
  return s; };

/* stocky in profile: barrel body, the beard hanging forward, a round nose, the axe held up in front */
ALT.stout = o => { const s = Spr(32, 32), sk = rp(o.skin), skF = rp(shade(o.skin, .3)), c = rp(o.cloth), cf = rp(shade(o.cloth, .35)), b = rp(o.beard || '#c06a3a');
  s.rect(11, 25, 4, 4, rp('#3a2c22')); s.rect(11, 29, 6, 2, rp('#2e2219')); s.rect(9, 16, 3, 7, cf); s.rect(9, 23, 3, 2, skF);
  s.rect(11, 15, 10, 10, c); s.ell(19, 20, 3, 4, c);
  s.rect(16, 25, 4, 4, rp('#4a3a2a')); s.rect(16, 29, 6, 2, rp('#3a2a20'));
  s.ell(16, 11, 4.6, 4.4, sk); s.ell(21, 11, 1.6, 1.4, sk);
  for (let y = 12; y <= 20; y++) s.line(13 + (y - 12) * .5, y, 21 - Math.max(0, y - 14) * .5, y, b); s.fix(18, 19, R.gold.base); s.fix(16, 20, R.gold.base);
  eye(s, 18, 10); s.fix(13, 10, sk.lo); s.fix(13, 11, sk.lo);
  const m = ramp(o.helm || '#9aa3ad', { gl: .72 }); s.ell(15, 7, 5.6, 3.6, m); s.rect(10, 8, 11, 2, m); s.rect(10, 9, 2, 3, m);
  if (o.horns) { const h = rp('#efe2c4'); s.poly([[18, 6], [23, 0], [20, 4]], h); s.poly([[12, 6], [7, 0], [10, 4]], h); }
  if (o.axe) { s.rect(15, 16, 3, 4, c); s.rect(17, 19, 4, 3, c); s.line(22, 28, 22, 9, R.wood); s.poly([[22, 9], [28, 6], [28, 14], [22, 12]], ramp('#b8c0c8', { gl: .75 })); s.rect(21, 19, 2, 3, sk); }
  else { s.rect(15, 16, 3, 7, c); s.rect(15, 23, 3, 2, sk); }
  return s; };

/* hulking brute in profile: hunched forward, head low and jutting, the knuckles near the ground */
ALT.brute = o => { const s = Spr(32, 32), sk = rp(o.skin), skF = rp(shade(o.skin, .32)), c = rp(o.cloth || mix(o.skin, '#3a2448', .4));
  s.rect(8, 13, 4, 12, skF); s.ell(9, 26, 2.6, 2.2, skF); s.rect(10, 24, 4, 6, skF); s.rect(10, 29, 6, 1, skF);
  s.ell(14, 15, 8.4, 7, sk); s.rect(10, 20, 10, 5, c);
  s.rect(15, 24, 4, 6, sk); s.rect(15, 29, 6, 1, sk);
  s.ell(21, 12, 4, 3.6, sk); s.rect(21, 13, 4, 3, sk); s.line(19, 9, 24, 9, null, sk.lo);
  eye(s, 22, 11, o.glow || EYE, !o.glow); s.fix(24, 15, '#f4ecd8'); s.fix(24, 14, '#f4ecd8'); s.line(22, 15, 24, 15, null, sk.out);
  if (o.ice) [[8, 8], [11, 5], [15, 4], [19, 6]].forEach(([x, y]) => s.poly([[x - 1, y + 3], [x, y - 1], [x + 1, y + 3]], ramp('#e8f6ff', { gl: .9 })));
  if (o.moss) [[9, 10], [14, 8], [18, 9]].forEach(([x, y]) => s.fix(x, y, '#6a9a4a'));
  s.rect(16, 13, 5, 12, sk); s.ell(19, 26, 3, 2.4, sk); s.line(17, 16, 17, 22, null, sk.lo);
  if (o.club) { s.line(20, 26, 27, 13, R.wood); s.line(21, 26, 28, 13, R.wood); s.ell(28, 11, 2, 2.4, R.woodLight); s.ell(19, 26, 3, 2.4, sk); }
  return s; };

/* golem in profile: a block head pushed forward, one glowing eye, the near fist forward */
ALT.golem = o => { const s = Spr(32, 32), g = rp(o.col), d = rp(mix(o.col, '#3a2448', .35)), df = rp(mix(o.col, '#3a2448', .55)), ec = o.eyes || '#7ae8ff';
  s.rect(8, 10, 4, 9, df); s.rect(7, 19, 5, 4, df); s.rect(11, 22, 4, 8, df);
  s.rect(11, 9, 10, 13, g); s.rect(14, 3, 8, 7, g); s.rect(16, 22, 4, 8, d);
  s.rect(15, 10, 5, 9, d); s.rect(15, 19, 7, 4, g); s.line(12, 14, 14, 17, null, g.lo);
  s.fix(19, 6, ec); s.fix(20, 6, ec); s.line(17, 8, 21, 8, null, g.lo); [[12, 11], [16, 4]].forEach(([x, y]) => s.fix(x, y, g.hi));
  if (o.moss) [[15, 3], [12, 9], [8, 10]].forEach(([x, y]) => s.fix(x, y, '#6a9a4a'));
  return s; };
ALT.plankgolem = o => { const s = Spr(32, 32), w = rp(o.col || '#8a6a4a'), d = rp('#5a4030'), df = rp('#46322a');
  s.rect(8, 10, 4, 9, df); s.rect(11, 23, 4, 7, df);
  s.rect(11, 9, 10, 14, w); for (let y = 11; y < 23; y += 3) s.line(11, y, 20, y, null, w.lo); s.ell(18, 6, 4, 4, w);
  s.rect(16, 23, 4, 7, d); s.rect(15, 10, 5, 8, d); s.rect(15, 18, 6, 3, d); s.ell(22, 19, 2.4, 2.4, rp('#9aa3ad'));
  [[12, 12], [18, 17]].forEach(([x, y]) => s.fix(x, y, '#c8c8c8')); s.fix(20, 6, '#80e0ff'); s.fix(21, 5, '#80e0ff');
  if (o.barnacles) [[12, 10], [19, 14], [9, 18]].forEach(([x, y]) => { s.fix(x, y, '#e8e4d8'); s.fix(x + 1, y, '#b8b4a8'); });
  return s; };

/* floating robe in profile: the hood peaks back, the hem streams behind, the near hand reaches forward */
ALT.floater = o => { const s = Spr(32, 32), c = rp(o.cloth), cf = rp(shade(o.cloth, .35)), skC = o.skin || '#d8b898', sk = rp(skC);
  if (o.kite) { s.poly([[27, 1], [31, 5], [27, 10], [23, 5]], rp('#e0c060')); s.line(26, 10, 23, 14, null, '#d8d4c8'); }
  s.rect(10, 13, 3, 6, cf);
  s.poly([[13, 10], [20, 10], [22, 25], [18, 23], [14, 27], [10, 23], [5, 26], [9, 17]], c);
  s.ell(17, 7, 3.6, 4.2, sk);
  if (o.hood) { s.poly([[13, 0], [20, 3], [22, 8], [21, 12], [10, 12], [9, 5]], rp(o.hood)); s.ell(19, 7.5, 2.4, 3.2, sk); }
  eye(s, 20, 7); s.fix(22, 8, sk.base);
  if (o.beard) for (let y = 10; y <= 15; y++) s.line(18 - Math.max(0, y - 12) * .4, y, 21 - Math.max(0, y - 11) * .7, y, rp(o.beard));
  if (o.halo) for (let i = 0; i < 16; i++) { const a = i * PI / 8; s.fix(16 + cosr(a) * 4.4, 1 + sinr(a) * 1.2, '#fff0a0'); }
  if (o.threads) for (const x of [7, 11, 15, 19]) s.line(x, 25, x - 2, 31, null, '#c8b0c8');
  s.rect(15, 13, 6, 3, c); s.rect(21, 13, 2, 3, sk);
  if (o.staff) { s.line(24, 30, 24, 6, R.wood); s.ell(24, 5, 1.6, 1.6, ramp(o.staff, { gl: .85 })); s.rect(22, 13, 2, 3, sk); }
  s.ell(15, 30, 5, 1, rp('#00000020'));
  return s; };

/* lanky puppet or stalker in profile: mid-stride, the near arm out front */
ALT.lanky = o => { const s = Spr(32, 32), b = rp(o.col), d = rp(mix(o.col, '#3a2448', .35)), df = rp(mix(o.col, '#3a2448', .6)), j = rp(mix(o.col, '#ffffff', .3));
  s.line(15, 11, 11, 16, df); s.line(11, 16, 10, 23, df); s.line(15, 20, 13, 25, df); s.line(13, 25, 11, 31, df);
  s.rect(14, 10, 3, 10, b); s.ell(17, 6, 3, 3.4, b); s.fix(20, 7, b.base);
  s.line(16, 11, 21, 15, d); s.line(21, 15, 25, 20, d); s.line(16, 20, 19, 25, d); s.line(19, 25, 20, 31, d);
  [[11, 16], [21, 15], [13, 25], [19, 25]].forEach(([x, y]) => s.ell(x, y, 1.2, 1.2, j));
  eye(s, 18, 6, o.glow || EYE, !o.glow);
  if (o.strings) for (const [x, y] of [[10, 21], [17, 2], [25, 19]]) s.line(x, 0, x, y, null, '#d8d4c8');
  if (o.reeds) { s.line(15, 4, 12, 0, rp('#8a9a5a')); s.line(17, 3, 17, 0, rp('#8a9a5a')); s.rect(14, 12, 3, 6, rp('#6a7a44')); }
  return s; };

/* ================= front views of the side-on builders ================= */
/* a quadruped head-on: chest and shoulders, the front legs wide, the hind legs between them in shadow */
ALT.quad = o => {
  const s = Spr(32, 32), f = rp(o.fur), dC = o.dark || mix(o.fur, '#3a2448', .35), d = rp(dC), k = o.big ? 1 : 0, belly = rp(o.belly || mix(o.fur, '#ffffff', .35)), hoof = rp(o.hoof || mix(o.fur, '#3a2448', .55)), hf = rp(shade(dC, .25));
  const by = 18 - k;
  if (o.shell) { const sh = rp(o.shell); s.rect(6, 21, 4, 4, f); s.rect(22, 21, 4, 4, f); s.ell(16, by - 1, 11, 6.4, sh); for (const x of [10, 16, 22]) s.line(x, by - 6, x + (x - 16) / 3, by + 3, null, sh.lo); s.line(6, by + 2, 26, by + 2, null, sh.lo);
    s.ell(16, by + 4, 3.6, 3, f); eye(s, 14, by + 4); eye(s, 18, by + 4); s.line(15, by + 6, 17, by + 6, null, f.out); s.rect(11, 23, 3, 3, f); s.rect(18, 23, 3, 3, f); return s; }
  const legs = o.short ? 4 : 7, lw = o.stout ? 4 : 3, top = 20, lx = 16 - 3 - lw, rx = 16 + 3;
  if (o.tail === 'bushy') { s.ell(25, by - 3, 2.6, 3.4, d); s.fix(26, by - 6, d.hi); }
  else if (o.tail === 'fluff') s.ell(24, by + 1, 2.2, 2.2, rp('#f4f0e8'));
  /* hind legs, between and behind */
  s.rect(13, top + 1, 2, legs - 1, hf); s.rect(17, top + 1, 2, legs - 1, hf); s.rect(13, top + legs, 2, 1, hoof); s.rect(17, top + legs, 2, 1, hoof);
  if (o.mane) s.ell(16, by - 4, 7 + k, 6, d);
  s.ell(16, by, 7.4 + k, 5.6 + k * .6, f);
  if (o.wool) { const w = rp('#f2ece0'); s.ell(16, by - 1, 9 + k, 6, w); for (let x = 9; x < 24; x += 3) s.fix(x, by - 5 + (x % 2), w.lo); }
  /* front legs */
  for (const x of [lx, rx]) { s.rect(x, top, lw, legs, f); s.rect(x, top + legs, lw, 1, hoof); }
  s.ell(16, by + 2, 3, 2.6, belly, { flat: true });
  if (o.spots) [[11, by - 1], [20, by + 1], [14, by + 3], [21, by - 2]].forEach(([x, y]) => s.ell(x, y, 1.4, 1.2, rp(o.spots)));
  if (o.cracks) [[10, by], [13, by + 3], [19, by - 1], [21, by + 2]].forEach(([x, y]) => { s.fix(x, y, o.cracks); s.fix(x + 1, y + 1, o.cracks); });
  if (o.plates) for (const x of [7, 10, 20, 23]) s.poly([[x - 1, by - 3], [x, by - 7], [x + 1, by - 3]], rp(o.plates));
  if (o.thorns) for (const x of [8, 11, 21, 24]) s.poly([[x - 1, by - 3], [x, by - 6], [x + 1, by - 3]], rp('#4a7a3a'));
  if (o.saddle) { s.line(8, by - 3, 10, by - 4, null, d.base); s.line(22, by - 4, 24, by - 3, null, d.base); }
  if (o.candle) { s.rect(22, by - 12, 2, 5, rp('#efe2c4')); s.fix(22, by - 13, '#ffd060'); s.fix(22, by - 14, '#fff2a0'); }
  if (o.cloud) [[9, by - 5], [23, by - 5], [16, by - 9]].forEach(([x, y]) => s.ell(x, y, 2.4, 1.6, rp('#f6fbfc')));
  /* head */
  const hy = by - 5;
  if (o.ears === 'long') { s.rect(11, hy - 10, 2, 8, f); s.rect(19, hy - 10, 2, 8, f); s.fix(11, hy - 8, mix(o.fur, '#f0a0a0', .5)); s.fix(20, hy - 8, mix(o.fur, '#f0a0a0', .5)); }
  if (o.horns) { const h = rp(o.hornCol || '#efe2c4'); s.poly([[13, hy - 3], [8, hy - 7], [9, hy - 8], [14, hy - 5]], h); s.poly([[19, hy - 3], [24, hy - 7], [23, hy - 8], [18, hy - 5]], h); }
  if (o.antlers) { const a = rp(o.antlers); s.line(14, hy - 3, 11, hy - 10, a); s.line(12, hy - 7, 9, hy - 8, a); s.line(18, hy - 3, 21, hy - 10, a); s.line(20, hy - 7, 23, hy - 8, a); }
  s.ell(16, hy, 5 + k * .5, 4.6, f);
  if (o.ears === 'pointy') { s.poly([[11, hy - 1], [11, hy - 7], [14, hy - 3]], d); s.poly([[21, hy - 1], [21, hy - 7], [18, hy - 3]], d); }
  else if (o.ears === 'round') { s.ell(12, hy - 4, 1.6, 1.6, d); s.ell(20, hy - 4, 1.6, 1.6, d); }
  else if (o.ears === 'floppy') { s.poly([[11, hy - 2], [8, hy + 3], [11, hy + 2]], d); s.poly([[21, hy - 2], [24, hy + 3], [21, hy + 2]], d); }
  if (o.snout) { s.ell(16, hy + 3, 3, 2.2, rp(o.snoutCol || mix(o.fur, '#f0a0a0', .4))); s.fix(15, hy + 3, f.out); s.fix(17, hy + 3, f.out); }
  else { s.rect(14, hy + 2, 5, 3, f); s.rect(15, hy + 3, 3, 2, belly); s.rect(15, hy + 5, 3, 1, f); s.fix(16, hy + 5, EYE); s.fix(15, hy + 5, f.out); s.fix(17, hy + 5, f.out); }
  if (o.tusks) { for (const x of [13, 19]) { s.fix(x, hy + 4, '#f4ecd8'); s.fix(x, hy + 3, '#f4ecd8'); } }
  if (o.glassy) [[10, by - 1], [21, by - 2], [14, hy - 3]].forEach(([x, y]) => s.fix(x, y, '#ffffff'));
  eye(s, 13, hy, o.glow || EYE, !o.glow); eye(s, 19, hy, o.glow || EYE, !o.glow);
  return s;
};

/* a deer head-on: a long neck, the muzzle, ears out to the sides and the antlers spread */
ALT.deer = o => { const s = Spr(32, 32), f = rp(o.fur), d = rp(mix(o.fur, '#3a2448', .35)), hf = rp(mix(o.fur, '#3a2448', .5)), w = rp(mix(o.fur, '#ffffff', .45));
  s.rect(13, 21, 2, 8, hf); s.rect(17, 21, 2, 8, hf);
  s.ell(16, 17, 6.4, 4.4, f); s.ell(16, 18, 2.6, 2.4, w, { flat: true });
  for (const x of [10, 19]) { s.rect(x, 19, 3, 6, f); s.rect(x + (x < 16 ? 0 : 1), 25, 2, 5, d); }
  s.rect(14, 9, 5, 8, f); s.line(16, 11, 16, 15, null, f.lo);
  s.poly([[13, 6], [8, 4], [9, 6], [13, 8]], f); s.poly([[19, 6], [24, 4], [23, 6], [19, 8]], f); s.fix(10, 5, d.base); s.fix(22, 5, d.base);
  s.ell(16, 7, 3.4, 3, f); s.ell(16, 10, 2.2, 1.8, w); s.fix(16, 11, EYE); s.fix(15, 11, f.out); s.fix(17, 11, f.out);
  const a = rp(o.antler || '#cde8d8'); s.line(14, 4, 11, -1, a); s.line(12, 1, 9, 1, a); s.line(18, 4, 21, -1, a); s.line(20, 1, 23, 1, a);
  eye(s, 14, 7); eye(s, 18, 7);
  if (o.glassy) [[11, 16], [20, 16], [15, 13]].forEach(([x, y]) => s.fix(x, y, '#ffffff')); if (o.bell) s.ell(16, 14, 1.6, 1.6, R.gold);
  return s; };

/* a fox head-on: big ears, a white muzzle and chest, the brush curled round one side */
ALT.fox = o => { const s = Spr(32, 32), f = rp(o.fur), w = rp('#f4ecd8'), dk = rp('#3a2a24'), hf = rp(shade(o.fur, .3));
  s.poly([[18, 27], [25, 26], [28, 20], [27, 14], [24, 16], [24, 22], [18, 24]], f); s.ell(26, 15, 1.8, 2, w);
  s.rect(10, 24, 2, 4, hf); s.rect(20, 24, 2, 4, hf); s.rect(10, 28, 2, 1, dk); s.rect(20, 28, 2, 1, dk);
  s.ell(16, 21, 5, 4.6, f); s.ell(16, 21, 2.6, 3.4, w, { flat: true });
  for (const x of [13, 17]) { s.rect(x, 23, 2, 3, f); s.rect(x, 26, 2, 3, dk); }
  s.poly([[11, 12], [11, 5], [15, 10]], f); s.poly([[21, 12], [21, 5], [17, 10]], f); s.fix(12, 8, dk.base); s.fix(20, 8, dk.base);
  s.ell(16, 13, 4.6, 3.8, f); s.ell(13, 15, 1.6, 1.4, w); s.ell(19, 15, 1.6, 1.4, w); s.poly([[14, 15], [18, 15], [16, 18]], w); s.fix(16, 17, EYE);
  eye(s, 14, 13); eye(s, 18, 13);
  if (o.thimble) s.rect(14, 7, 4, 3, R.gold);
  return s; };

/* a hare head-on: both tall ears, a round body sitting up, the feet in front */
ALT.hare = o => { const s = Spr(32, 32), f = rp(o.fur), b = rp(mix(o.fur, '#ffffff', .4)), pink = mix(o.fur, '#f0a0a0', .5);
  s.ell(16, 23, 6, 5, f); s.ell(16, 24, 3.4, 3, b, { flat: true });
  s.rect(10, 27, 4, 2, f); s.rect(18, 27, 4, 2, f); s.rect(13, 25, 2, 2, b); s.rect(17, 25, 2, 2, b);
  s.rect(12, 3, 2, 10, f); s.rect(18, 3, 2, 10, f); s.line(13, 5, 13, 10, null, pink); s.line(18, 5, 18, 10, null, pink);
  s.ell(16, 15, 4.4, 3.6, f); s.ell(16, 17, 2, 1.4, b, { flat: true });
  eye(s, 14, 15); eye(s, 18, 15); s.fix(16, 17, '#e07a7a');
  if (o.berries) [[12, 30], [20, 30]].forEach(([x, y]) => s.fix(x, y, '#5a2a6a'));
  return s; };

/* a newt or lizard head-on: low and wide, eyes on top, the legs splayed, the tail curling up behind */
ALT.newt = o => { const s = Spr(32, 32), b = rp(o.col), belly = rp(mix(o.col, '#f0e0a0', .45)), bf = rp(shade(o.col, .3));
  s.poly([[19, 18], [25, 13], [27, 8], [28, 9], [27, 15], [21, 20]], bf);
  s.line(9, 18, 6, 21, bf); s.line(23, 18, 26, 21, bf);
  s.ell(16, 18, 6.6, 3.6, b);
  s.poly([[12, 17], [16, 10], [20, 17]], rp(o.fin || mix(o.col, '#e0a050', .4)));
  s.line(11, 21, 7, 25, b); s.line(7, 25, 6, 28, b); s.line(21, 21, 25, 25, b); s.line(25, 25, 26, 28, b); s.fix(5, 28, b.base); s.fix(27, 28, b.base);
  s.ell(16, 22, 5.4, 3.4, b); s.ell(16, 24, 3.4, 1.4, belly, { flat: true });
  s.ell(13, 19, 1.6, 1.6, b); s.ell(19, 19, 1.6, 1.6, b); eye(s, 13, 19); eye(s, 19, 19);
  s.line(12, 23, 20, 23, null, b.out); s.fix(13, 24, '#f4ecd8'); s.fix(19, 24, '#f4ecd8');
  return s; };

/* an armoured beast head-on: the plated dome, the head poking out in front, the legs at the corners */
ALT.armoured = o => { const s = Spr(32, 32), f = rp(o.fur), p = ramp(o.plate || mix(o.fur, '#ffffff', .25), { gl: .7 });
  s.rect(6, 22, 4, 7, f); s.rect(22, 22, 4, 7, f);
  s.ell(16, 20, 11, 6, f); for (let i = 0; i < 5; i++) s.ell(8 + i * 4, 16 - (i === 2 ? 1 : i % 2 ? .5 : 0), 3, 4, p);
  if (o.spikes) for (let i = 0; i < 5; i++) s.poly([[7 + i * 4, 13], [8 + i * 4, 9], [9 + i * 4, 13]], p);
  s.ell(16, 23, 3.6, 3, f); eye(s, 14, 23); eye(s, 18, 23); s.line(15, 25, 17, 25, null, f.out);
  s.rect(11, 25, 3, 4, f); s.rect(18, 25, 3, 4, f);
  if (o.glassy) [[9, 14], [16, 13], [23, 14]].forEach(([x, y]) => s.fix(x, y, '#ffffff'));
  return s; };

/* a serpent head-on: coiled on the ground, the neck rising, the head facing you */
ALT.serpent = o => { const s = Spr(32, 32), b = ramp(o.col, { gl: .8 });
  s.ell(16, 27, 10, 3.4, b); s.ell(16, 23, 7.4, 3, b);
  for (let i = 0; i < 11; i++) s.ell(16 + Math.round(sinr(i / 2.6) * 1.6), 20 - i * 1.1, 2.6 - i * .05, 2.4, b);
  s.ell(16, 7, 4.4, 3.4, b); s.fix(14, 7, '#2a1c1f'); s.fix(18, 7, '#2a1c1f'); s.fix(14, 6, '#ffffff'); s.fix(18, 6, '#ffffff');
  s.line(16, 10, 16, 12, null, '#e06a8a'); s.fix(15, 13, '#e06a8a'); s.fix(17, 13, '#e06a8a');
  for (const [x, y] of [[9, 26], [14, 22], [21, 27], [16, 16]]) s.fix(x, y, '#ffffff');
  return s; };

/* rodent head-on */
ALT.rodent = o => { const s = Spr(32, 32), f = rp(o.col), b = rp(mix(o.col, '#ffffff', .35));
  if (o.tail === 'bushy') s.poly([[19, 25], [26, 15], [24, 9], [19, 20]], f); else s.line(21, 27, 28, 26, rp('#d8a0a0'));
  s.ell(16, 22, 5.4, 4.6, f); s.ell(16, 24, 3, 2.2, b, { flat: true }); s.rect(12, 26, 2, 2, f); s.rect(18, 26, 2, 2, f);
  s.ell(12, 13, 1.8, 1.8, f); s.ell(20, 13, 1.8, 1.8, f); s.fix(12, 13, mix(o.col, '#f0a0a0', .5)); s.fix(20, 13, mix(o.col, '#f0a0a0', .5));
  s.ell(16, 16, 3.8, 3.2, f); s.ell(16, 18, 1.8, 1.4, b); s.fix(16, 19, '#e07a7a'); eye(s, 14, 16); eye(s, 18, 16);
  s.line(11, 18, 13, 18, null, f.lo); s.line(19, 18, 21, 18, null, f.lo);
  if (o.acorn) { s.ell(16, 23, 1.8, 2, rp('#a87a3a')); s.rect(15, 21, 3, 1, rp('#6a4a2a')); }
  return s; };

/* hedgehog head-on: a ball of spines, the pale face low in front */
ALT.hedgehog = o => { const s = Spr(32, 32), sp = rp(o.col), face = rp('#d8b890');
  s.ell(16, 20, 10, 6.6, sp); for (let i = 0; i <= 10; i++) { const a = PI * (1.02 + i * .096); s.poly([[16 + cosr(a) * 8, 20 + sinr(a) * 5], [16 + cosr(a + .05) * 13, 20 + sinr(a + .05) * 10], [16 + cosr(a + .12) * 8, 20 + sinr(a + .12) * 5]], sp); }
  s.ell(16, 22, 4.6, 3.6, face); s.ell(16, 24, 2, 1.6, face); s.fix(16, 25, '#2a1c1f'); eye(s, 14, 22); eye(s, 18, 22);
  s.rect(11, 27, 3, 2, face); s.rect(18, 27, 3, 2, face);
  if (o.thorns) [[9, 15], [16, 11], [23, 15]].forEach(([x, y]) => s.fix(x, y, '#e48aa8'));
  return s; };

/* scorpion head-on: pincers out to the sides, the tail arched over the back, stinger forward */
ALT.scorpion = o => { const s = Spr(32, 32), b = ramp(o.col, { gl: .7 }), d = rp(mix(o.col, '#1a1424', .45));
  for (const [x0, x1] of [[11, 6], [12, 8], [13, 10]]) { s.line(x0, 23, x1, 27, d); s.line(32 - x0, 23, 32 - x1, 27, d); s.fix(x1 - 1, 28, d.base); s.fix(33 - x1, 28, d.base); }
  for (let i = 0; i < 6; i++) s.ell(16, 19 - i * 2.3, 2 - i * .1, 1.8, b);
  s.poly([[14, 4], [18, 4], [16, 8]], rp(o.sting || '#fff070'));
  s.ell(16, 22, 8, 4, b);
  s.line(10, 21, 6, 16, d); s.line(22, 21, 26, 16, d); s.ell(5, 14, 2.6, 2.2, b); s.ell(27, 14, 2.6, 2.2, b); s.fix(5, 12, b.out); s.fix(27, 12, b.out);
  eye(s, 14, 22, '#fff070', false); eye(s, 18, 22, '#fff070', false);
  if (o.storm) { s.line(20, 3, 22, 6, null, '#fff2a0'); s.line(22, 6, 20, 8, null, '#fff2a0'); }
  return s; };

/* isopod head-on: the banded dome, the face below it, antennae out */
ALT.isopod = o => { const s = Spr(32, 32), b = ramp(o.col, { gl: .8 }), d = rp(mix(o.col, '#1a1424', .4));
  for (const y of [22, 24, 26]) { s.line(8, y, 5, y + 2, d); s.line(24, y, 27, y + 2, d); }
  s.ell(16, 19, 10, 6.4, b); for (const y of [15, 18, 21]) for (let x = 7; x <= 25; x++) s.fix(x, y + Math.round(((x - 16) / 9) ** 2 * 2), b.lo);
  s.ell(16, 24, 4.4, 2.6, b); s.line(13, 23, 7, 16, null, b.lo); s.line(19, 23, 25, 16, null, b.lo);
  eye(s, 14, 24); eye(s, 18, 24);
  if (o.glass) [[10, 16], [16, 14], [22, 16]].forEach(([x, y]) => s.fix(x, y, '#ffffff'));
  return s; };

/* dragon head-on: wings spread both sides, belly scales, horns, the tail curling round */
ALT.dragon = o => { const s = Spr(32, 32), b = rp(o.col), w = rp(o.wing || mix(o.col, '#3a2448', .3)), belly = rp(o.belly || '#f0d090'), k = o.big ? 1 : 0, sp = rp(o.spike || '#e6c86a');
  s.poly([[12, 14], [2, 4 - k], [5, 12], [1, 14], [11, 19]], w); s.poly([[20, 14], [30, 4 - k], [27, 12], [31, 14], [21, 19]], w);
  for (let i = 0; i < 3; i++) { s.fix(4 + i * 2, 7 + i * 2, w.lo); s.fix(28 - i * 2, 7 + i * 2, w.lo); }
  s.poly([[20, 24], [27, 27], [30, 23], [26, 25]], b); s.poly([[29, 22], [31, 20], [31, 24]], sp);
  s.rect(10, 22, 3, 6, b); s.rect(19, 22, 3, 6, b);
  s.ell(16, 19, 6.4 + k, 5, b); s.ell(16, 21, 3.4, 3, belly);
  s.rect(14, 12, 5, 5, b); s.ell(16, 10, 4.4 + k * .5, 3.4, b); s.ell(16, 13, 3, 2, b); s.fix(15, 13, b.out); s.fix(17, 13, b.out);
  s.poly([[13, 8], [10, 3], [14, 7]], rp(o.horn || '#efe2c4')); s.poly([[19, 8], [22, 3], [18, 7]], rp(o.horn || '#efe2c4'));
  for (const x of [11, 21]) s.fix(x, 15, sp.base);
  eye(s, 14, 10, o.glow || '#f0d050', false); eye(s, 18, 10, o.glow || '#f0d050', false);
  if (o.fire) { s.fix(16, 15, '#ffb04a'); s.fix(16, 16, '#ff6a3a'); }
  return s; };

/* hunched husk head-on: the hump and back spines behind, the head thrust low between the shoulders */
ALT.hunch = o => { const s = Spr(32, 32), b = rp(o.col), d = rp(mix(o.col, '#1a1424', .4)), gl = o.glow || '#e0d0ff';
  for (const x of [9, 13, 17, 21]) s.poly([[x, 11], [x + 1, 6], [x + 2, 11]], d);
  s.rect(11, 21, 3, 8, d); s.rect(18, 21, 3, 8, d); s.rect(10, 28, 4, 1, d); s.rect(18, 28, 4, 1, d);
  s.ell(16, 13, 9, 5.4, b); s.ell(16, 19, 6, 4, b);
  s.line(8, 15, 6, 27, b); s.line(9, 15, 7, 27, b); s.line(24, 15, 26, 27, b); s.line(23, 15, 25, 27, b); for (const x of [5, 7, 25, 27]) s.fix(x, 28, d.base);
  s.ell(16, 15, 4.2, 3.6, b); eye(s, 14, 15, gl, false); eye(s, 18, 15, gl, false); s.line(14, 18, 18, 18, null, d.base);
  if (o.echo) for (let i = 0; i < 3; i++) for (let a = -1; a <= 1; a++) { s.fix(2 - i + 2, 14 + a * (i + 1), '#c8b8e8'); s.fix(28 + i, 14 + a * (i + 1), '#c8b8e8'); }
  return s; };

/* ================= profiles of the remaining front-on builders ================= */
/* a bird in profile: head and beak forward, the wing folded along the body (or both raised), the tail behind */
ALT.bird = o => { const s = Spr(32, 32), b = rp(o.plum), wC = o.wing || mix(o.plum, '#3a2448', .25), w = rp(wC), wf = rp(shade(wC, .3)), bk = rp(o.beak || '#e8a838'), sm = !!o.small;
  const by = sm ? 19 : 18, hy = sm ? 13 : 11;
  if (o.spread) s.poly([[13, 15], [8, 1], [5, 3], [7, 12], [11, 17]], wf);
  s.poly([[11, by], [2, by + 3], [3, by + 6], [12, by + 3]], w);
  s.line(15, 23, 15, 27, bk); s.line(18, 23, 18, 27, bk); s.line(15, 27, 17, 27, bk); s.line(18, 27, 20, 27, bk);
  s.ell(15, by, sm ? 5 : 6.4, sm ? 4.4 : 5.4, b); s.ell(18, hy + 3, 2.6, 2.4, b); s.ell(20, hy, 3.6, 3.4, b);
  s.poly([[23, hy - 1], [27, hy + 1], [23, hy + 2]], bk);
  if (o.crest) s.poly([[19, hy - 3], [14, hy - 8], [21, hy - 4]], rp(o.crest));
  if (o.spread) { s.poly([[12, 16], [17, 0], [21, 2], [19, 11], [17, 18]], w); for (let i = 0; i < 4; i++) s.fix(17 + i, 3 + i * 3, w.lo); }
  else { s.ell(13, by, 5, 3.4, w); s.line(9, by + 1, 14, by + 3, null, w.lo); s.line(10, by - 1, 15, by + 1, null, w.lo); }
  eye(s, 21, hy, o.glow || EYE, !o.glow);
  if (o.lamp) { s.ell(15, by + 2, 2.4, 2.4, ramp('#ffd060', { gl: .9 })); s.fix(15, by + 1, '#fffbe0'); }
  if (o.prism) [[8, 2], [20, 1], [3, by + 4]].forEach(([x, y]) => s.fix(x, y, '#ffffff'));
  if (o.ice) [[6, 4], [18, 2]].forEach(([x, y]) => s.fix(x, y, '#e8f6ff'));
  if (o.storm) { s.line(4, 9, 7, 6, null, '#fff2a0'); s.line(7, 6, 6, 11, null, '#fff2a0'); }
  return s; };

/* a crab in profile: the shell from the side, legs walking, the near claw raised forward */
ALT.clawed = o => { const s = Spr(32, 32), c = rp(o.shell), d = rp(mix(o.shell, '#3a2448', .35)), df = rp(mix(o.shell, '#3a2448', .55)), cf = rp(shade(o.shell, .3));
  for (const x of [11, 15, 19]) { s.line(x, 22, x - 2, 27, df); s.line(x - 2, 27, x - 2, 29, df); }
  s.line(18, 16, 21, 10, df); s.ell(21, 8, 2.2, 2, cf);
  s.ell(15, 19, 8.4, 5.4, c); s.line(8, 20, 22, 20, null, c.lo);
  s.line(20, 15, 21, 11, null, d.base); eye(s, 21, 11, o.glow || EYE, !o.glow);
  for (const x of [9, 13, 17]) { s.line(x, 23, x - 3, 27, d); s.line(x - 3, 27, x - 4, 29, d); }
  s.line(21, 19, 24, 15, d); s.line(22, 19, 25, 15, d); s.ell(26, 12, 3, 2.6, c); s.fix(29, 11, c.out); s.fix(28, 12, c.out);
  if (o.stones) [[10, 15], [15, 13], [19, 15]].forEach(([x, y]) => s.ell(x, y, 2.4, 2, R.stone));
  if (o.loom) s.line(9, 15, 21, 15, null, '#ffb04a');
  if (o.glowy) [[11, 18], [15, 17], [19, 18]].forEach(([x, y]) => s.fix(x, y, o.glowy));
  return s; };

/* a bat in profile: one wing raised, the far one low behind, big ear and snout forward */
ALT.bat = o => { const s = Spr(32, 32), b = rp(o.col), wC = mix(o.col, '#1a1838', .3), w = rp(wC), wf = rp(shade(wC, .3)), m = rp(mix(o.col, '#e0a0b0', .25));
  s.poly([[14, 17], [4, 21], [7, 24], [10, 22], [12, 24], [16, 20]], wf);
  s.ell(16, 17, 4.6, 5, b); s.ell(17, 19, 2.6, 2.6, m);
  s.poly([[19, 12], [18, 5], [22, 10]], b); s.fix(19, 8, m.base);
  s.ell(21, 13, 3, 2.8, b); s.rect(23, 13, 2, 2, b);
  s.poly([[15, 14], [7, 2], [9, 8], [4, 9], [9, 13], [5, 16], [17, 17]], w);
  for (const [x0, y0, x1, y1] of [[15, 14, 8, 4], [15, 15, 6, 10], [16, 16, 7, 15]]) s.line(x0, y0, x1, y1, null, w.lo);
  eye(s, 21, 13, '#ff6a6a', false); s.fix(23, 15, '#f4ecd8'); s.line(15, 22, 14, 24, null, w.out); s.line(17, 22, 17, 24, null, w.out);
  return s; };

/* blob in profile: the eyes gathered on the near side, the tendrils dragging behind */
ALT.blob = o => { const s = Spr(32, 32), b = rp(o.col), bf = rp(shade(o.col, .3));
  for (const x of [9, 13, 18, 22]) for (let i = 0; i < 7; i++) s.dot(x - Math.round(i * .7) + Math.round(sinr(i / 1.5) * 1.2), 21 + i, x < 16 ? bf : b);
  s.ell(16, 15, 9, 8, b);
  [[20, 11, 2.2], [23, 15, 1.8], [18, 17, 1.6]].forEach(([x, y, r]) => { s.ell(x, y, r, r, rp('#f4ecd8')); s.fix(x + 1, y, EYE); });
  if (o.bloom) for (let i = 0; i < 6; i++) { const a = i * PI / 3; s.ell(14 + cosr(a) * 6, 7 + sinr(a) * 2, 1.6, 1.6, rp(o.bloom)); }
  return s; };

/* the cairn mimic in profile: the stack leaning forward, the face on the near side */
ALT.stonepile = o => { const s = Spr(32, 32), gl = o.glow || '#ffb04a';
  for (const [x0, x1] of [[9, 6], [13, 11], [18, 20], [22, 25]]) s.line(x0, 27, x1, 31, R.stoneDark);
  [[14, 24, 9, 5], [17, 16, 7, 4.6], [21, 9, 4.6, 4]].forEach(([x, y, a, b2], i) => s.ell(x, y, a, b2, i % 2 ? R.stoneDark : R.stone));
  s.fix(22, 15, gl); s.fix(22, 14, mix(gl, '#ffffff', .6)); s.line(19, 18, 24, 18, null, '#2a1c1f'); s.fix(22, 19, '#e8e0d0'); s.fix(24, 19, '#e8e0d0');
  return s; };

/* the mushroom folk in profile */
ALT.mushroom = o => { const s = Spr(32, 32), cap = rp(o.col), stem = rp('#efe2c4'), sf = rp('#c8b89c');
  s.rect(9, 18, 3, 6, sf); s.rect(11, 28, 4, 2, sf);
  s.rect(12, 16, 8, 12, stem); s.rect(16, 28, 5, 2, stem);
  s.ell(15, 11, 11, 6, cap); s.rect(4, 12, 22, 3, cap); [[8, 8], [14, 6], [20, 9], [11, 11], [18, 12]].forEach(([x, y]) => s.ell(x, y, 1.4, 1.2, rp('#f8f0e0')));
  eye(s, 18, 19); s.line(18, 22, 19, 22, null, stem.out); s.fix(20, 20, stem.lo);
  s.rect(15, 19, 3, 3, stem); s.rect(18, 21, 4, 2, stem);
  return s; };

/* the walking tree in profile: one branch reaching forward, roots mid-stride */
ALT.treant = o => { const s = Spr(32, 32), bark = rp(o.col || '#6a5236'), bf = rp(shade(o.col || '#6a5236', .3)), leaf = rp(o.leaf || '#5f8a3a'), lf = rp(shade(o.leaf || '#5f8a3a', .25));
  s.line(13, 13, 6, 6, bf); s.line(13, 14, 7, 8, bf); s.ell(5, 5, 2.6, 2.2, lf);
  for (const [x0, x1] of [[12, 9], [15, 13]]) s.line(x0, 25, x1, 31, bf);
  s.rect(12, 10, 9, 15, bark); for (const [x0, x1] of [[17, 19], [20, 23]]) s.line(x0, 25, x1, 31, bark);
  s.line(19, 13, 28, 7, bark); s.line(19, 14, 27, 9, bark); s.ell(28, 6, 3, 2.6, leaf);
  s.ell(15, 6, 8, 5, leaf); s.fix(18, 15, o.glow || '#c8f070'); s.fix(19, 15, o.glow || '#c8f070'); s.line(17, 19, 20, 19, null, bark.out); s.line(14, 20, 14, 24, null, bark.lo);
  return s; };

/* spirits in profile: the flame and veil lean back as they drift forward */
ALT.wisp = o => { const s = Spr(32, 32), g = ramp(o.col, { gl: .85 }), c = rp(mix(o.col, '#ffffff', .5));
  s.poly([[8, 3], [15, 9], [22, 14], [22, 22], [17, 26], [11, 23], [9, 15]], g); s.ell(17, 19, 4.4, 4.4, c); s.fix(19, 18, '#2a1c1f'); s.fix(20, 21, c.lo);
  [[4, 8], [5, 17], [7, 24], [25, 10]].forEach(([x, y]) => s.fix(x, y, c.base));
  if (o.lantern) { s.rect(18, 26, 4, 4, R.gold); s.rect(19, 27, 2, 2, ramp('#fff2a0')); for (const x of [11, 14]) s.line(x, 22, x - 3, 30, R.leafCrop); }
  return s; };
ALT.veil = o => { const s = Spr(32, 32), v = ramp(o.col, { gl: .6 }), d = rp(mix(o.col, '#1a1424', .5));
  s.poly([[18, 2], [23, 9], [24, 22], [22, 28], [17, 25], [13, 30], [9, 26], [3, 29], [8, 18], [12, 7]], v); s.ell(19, 9, 3.6, 4.2, d); s.fix(21, 9, '#ffb04a'); s.fix(21, 8, '#ffe0a0');
  for (const x of [11, 16, 21]) s.line(x, 14, x - 3, 27, null, v.lo); if (o.ash) [[4, 8], [6, 14], [2, 21], [27, 6]].forEach(([x, y]) => s.fix(x, y, '#8a8080'));
  return s; };
ALT.shadow = o => { const s = Spr(32, 32), d = rp(o.col), df = rp(shade(o.col, .3)), ec = rp(o.eyes || '#c8a8ff');
  s.line(14, 16, 8, 24, df); s.dot(7, 25, df);
  s.poly([[13, 13], [21, 13], [24, 30], [19, 26], [14, 31], [9, 26], [3, 29]], d); s.ell(18, 10, 4.4, 5.2, d);
  s.line(20, 16, 28, 21, d); s.dot(29, 22, d); s.dot(29, 20, d); s.rect(20, 9, 2, 1, ec);
  [[7, 6], [25, 4], [4, 15]].forEach(([x, y]) => s.fix(x, y, d.hi));
  return s; };
ALT.orb = o => { const s = Spr(32, 32), b = ramp(o.col, { gl: .85 }), ring = (front) => { for (let i = 0; i < 30; i++) { const a = i * PI / 15, x = cosr(a) * 12, y = sinr(a) * 4, X = 16 + x * .8 - y * .6, Y = 16 + x * .6 + y * .8; if ((sinr(a) > 0) === front) s.fix(X, Y, i % 3 ? '#d8d0f0' : '#ffffff'); } };
  ring(false); s.ell(16, 16, 7, 7, b); s.ell(14, 13, 2, 2, rp('#ffffff')); ring(true);
  [[5, 8], [27, 24], [24, 4]].forEach(([x, y]) => s.ell(x, y, 1.4, 1.4, b)); s.fix(20, 16, '#2a1c3a'); s.fix(21, 19, '#2a1c3a'); s.fix(22, 19, '#2a1c3a');
  return s; };
ALT.jelly = o => { const s = Spr(32, 32), b = ramp(o.col, { gl: .75 });
  for (const x of [11, 14, 17, 20, 23]) for (let i = 0; i < 13; i++) s.dot(x - Math.round(i * .45) + Math.round(sinr(i / 2 + x) * 1.2), 14 + i, b);
  s.ell(17, 11, 9, 6, b); s.rect(8, 11, 19, 3, b); s.fix(22, 9, '#2a1c1f'); s.fix(22, 8, '#ffffff'); s.ell(13, 7, 1.6, 1, rp('#ffffff'));
  if (o.bell) { s.poly([[17, 15], [23, 15], [24, 20], [16, 20]], R.gold); s.fix(20, 21, R.gold.lo); }
  return s; };
ALT.spectral = o => { const s = Spr(32, 32), g = ramp(o.col, { gl: .7 }), dark = rp(mix(o.col, '#1a1424', .5));
  s.ell(17, 13, 7, 7.4, g); s.poly([[10, 13], [24, 13], [22, 24], [18, 22], [14, 27], [10, 23], [4, 26]], g);
  s.rect(19, 11, 3, 3, dark); s.fix(20, 12, o.eyes || '#fff6c0'); s.ell(21, 18, 1.4, 1.4, dark);
  if (o.hood) s.poly([[15, 3], [24, 9], [24, 18], [8, 18], [8, 10]], rp(o.hood));
  if (o.flame) [[11, 5], [15, 3], [19, 5]].forEach(([x, y]) => { s.fix(x, y, '#ffb04a'); s.fix(x, y + 1, '#ff6a3a'); });
  return s; };

/* a toad in profile: the haunch folded behind, the head and its wide mouth forward, the eye bump on top */
ALT.toad = o => { const s = Spr(32, 32), b = rp(o.col), belly = rp(mix(o.col, '#f0e0a0', .45));
  s.poly([[4, 29], [12, 28], [12, 30], [4, 30]], b);
  s.ell(15, 21, 9, 6.4, b); s.ell(17, 24, 6, 2.6, belly, { flat: true }); s.ell(9, 23, 4.4, 3.6, b);
  s.ell(22, 19, 5, 4, b); s.ell(21, 15, 2.6, 2.4, b); eye(s, 22, 15);
  s.line(19, 21, 27, 21, null, b.out); s.line(22, 24, 23, 29, b); s.line(23, 24, 24, 29, b); s.rect(22, 29, 5, 1, b);
  [[12, 19], [16, 17], [8, 21]].forEach(([x, y]) => s.fix(x, y, b.lo));
  if (o.candle) { s.rect(12, 8, 3, 7, rp('#efe2c4')); s.fix(13, 7, '#ffd060'); s.fix(13, 6, '#fff2a0'); s.line(11, 15, 15, 15, null, '#d8c8a0'); }
  return s; };

/* a moth at rest in profile: the wings folded up over the back, the body along the ground line, antennae forward */
ALT.moth = o => { const s = Spr(32, 32), w = rp(o.col), d = rp(mix(o.col, '#3a2448', .35));
  s.poly([[11, 18], [5, 4], [14, 2], [19, 17]], d); s.poly([[13, 18], [9, 6], [19, 3], [21, 17]], w); s.ell(15, 10, 2.4, 2.4, rp(o.eyespot || '#f0d060'));
  s.ell(15, 19, 7, 2.6, rp('#5a4a3a')); s.ell(23, 18, 2.4, 2.4, rp('#5a4a3a')); s.fix(24, 17, '#2a1c1f');
  s.line(24, 16, 28, 10, null, '#5a4a3a'); s.line(23, 16, 25, 9, null, '#5a4a3a');
  for (const x of [13, 17, 21]) s.line(x, 21, x - 1, 25, null, '#5a4a3a');
  if (o.lamp) { s.ell(8, 20, 2.4, 2.4, ramp('#ffd060', { gl: .9 })); s.fix(8, 19, '#fffbe0'); }
  return s; };

/* the kite in profile: turned, narrower, its tail streaming behind */
ALT.kite = o => { const s = Spr(32, 32), c = ramp(o.col, { gl: .85 });
  s.poly([[18, 2], [24, 13], [17, 24], [11, 13]], c); s.line(18, 2, 17, 24, null, c.hi); s.line(11, 13, 24, 13, null, c.lo); s.poly([[16, 8], [18, 4], [21, 8], [18, 12]], rp(mix(o.col, '#ffffff', .4)));
  for (let i = 0; i < 6; i++) s.fix(15 - i * 2, 25 + Math.round(sinr(i) * 1.5), ['#ff8a8a', '#ffe08a', '#8affb0', '#8ac8ff', '#c08aff', '#ffffff'][i]); s.fix(21, 11, '#2a1c1f');
  return s; };

/* beetle in profile: the domed shell, the horn swept forward, three legs on the near side */
ALT.beetle = o => { const s = Spr(32, 32), sh = ramp(o.col, { gl: .72 }), d = rp(mix(o.col, '#1a1424', .5)), df = rp(mix(o.col, '#1a1424', .65));
  for (const [x, dx] of [[12, -1], [17, 1], [21, 2]]) s.line(x, 24, x + dx, 29, df);
  s.ell(14, 20, 9, 6, sh); s.line(7, 17, 21, 15, null, sh.lo);
  s.ell(23, 22, 3.4, 3, d); if (o.horn) s.poly([[23, 20], [29, 12], [26, 21]], sh);
  for (const [x, dx] of [[10, -2], [15, 0], [19, 2]]) { s.line(x, 25, x + dx, 29, d); s.fix(x + dx + 1, 29, d.base); }
  eye(s, 24, 21, o.glow || '#fff070', false);
  if (o.glowy) [[10, 18], [15, 17], [19, 18], [12, 22]].forEach(([x, y]) => s.fix(x, y, o.glowy));
  return s; };

/* spider in profile: the abdomen behind, the eyes clustered at the front, legs arching up and down */
ALT.spider = o => { const s = Spr(32, 32), b = rp(o.col), d = rp(mix(o.col, '#1a1424', .45)), df = rp(mix(o.col, '#1a1424', .62)), gl = o.glow || '#ff6a3a';
  if (o.web) { for (let i = 0; i < 6; i++) { const a = i * PI / 10; s.line(2, 2, 2 + cosr(a) * 14, 2 + sinr(a) * 9, null, '#e8dcc8'); }
    for (const r of [6, 11]) for (let i = 0; i <= 10; i++) { const a = i * PI / 20; s.fix(2 + cosr(a) * r, 2 + sinr(a) * r * .65, '#bfb4a2'); } }
  for (const [kx, fx] of [[14, 11], [19, 18], [24, 25]]) { s.line(17, 21, kx, 15, df); s.line(kx, 15, fx, 29, df); }
  s.ell(10, 18, 6.4, 5, b); s.ell(19, 21, 4.4, 3.4, b);
  for (const [kx, ky, fx] of [[12, 13, 8], [17, 12, 14], [22, 12, 21], [26, 14, 28]]) { s.line(18, 21, kx, ky, d); s.line(kx, ky, fx, 29, d); }
  for (const [x, y] of [[22, 19], [23, 20], [21, 18], [23, 18]]) s.fix(x, y, gl); s.fix(24, 23, '#e8dcc8'); s.fix(23, 24, '#e8dcc8');
  if (o.mark) s.poly([[9, 15], [11, 18], [9, 21], [7, 18]], rp(o.mark));
  return s; };

Object.assign(A.CKIT, { weaponSide });

/* ================= creatures with their own drawing (pixelart.js, world_ui.js): the missing view ================= */
/* the hen head-on: comb, wattle and beak in the middle, the wings folded at her sides */
const chickenFront = () => { const s = Spr(32, 32), b = R.feather, w = ramp('#e2d6c0');
  s.poly([[20, 15], [26, 8], [27, 11], [22, 17]], b);
  s.line(13, 25, 13, 29, R.beak); s.line(18, 25, 18, 29, R.beak); s.line(11, 29, 14, 29, R.beak); s.line(17, 29, 20, 29, R.beak);
  s.ell(16, 19, 7.4, 6.8, b); s.ell(9.5, 19, 2.4, 4, w); s.ell(22.5, 19, 2.4, 4, w); s.ell(16, 21, 3.4, 3.4, w, { flat: true });
  s.ell(16, 11, 4.6, 4.6, b); s.rect(14, 5, 4, 2, R.comb); s.dot(13, 6, R.comb); s.dot(18, 5, R.comb);
  s.poly([[14, 12], [18, 12], [16, 15]], R.beak); s.rect(15, 15, 2, 2, R.comb);
  A.EYES(s, 13, 10, { kind: 'dot' }); A.EYES(s, 19, 10, { kind: 'dot' }); s.fix(13, 9, '#ffffff'); s.fix(19, 9, '#ffffff');
  return s; };
/* the goblin in profile: big head and long ear, the notched dagger out front */
const goblinSide = () => { const s = Spr(32, 32), g = R.goblin, gf = ramp(mix(R.goblin.base, '#1a1838', .3)), c = R.goblinCloth, cf = ramp(mix(R.goblinCloth.base, '#1a1838', .3)), ir = ramp('#a9b1bb', { gl: .75 });
  s.rect(12, 26, 3, 3, cf); s.rect(12, 29, 5, 2, ramp('#3a2820')); s.ell(10, 21, 2, 2.6, gf);
  s.rect(11, 18, 10, 8, c); s.rect(11, 22, 10, 1, ramp('#5a3a2a')); s.rect(16, 26, 3, 3, c); s.rect(16, 29, 5, 2, ramp('#4a3226'));
  s.poly([[11, 9], [1, 4], [11, 14]], g); s.ell(15, 11.5, 7, 6.4, g); s.rect(22, 11, 2, 2, g); s.fix(23, 13, g.base);
  A.EYES(s, 18, 10, { kind: 'glow', col: '#f6d24a' }); s.fix(19, 10, A.INK);
  s.line(17, 15, 21, 15, null, '#3a2414'); s.fix(20, 16, '#f4ecd8'); s.fix(18, 16, '#f4ecd8'); s.fix(11, 10, g.lo); s.fix(12, 12, g.lo);
  s.rect(15, 19, 6, 2, c); s.line(22, 19, 28, 13, ir); s.line(22, 20, 29, 13, ir); s.tone(29, 12, ir, 4); s.line(21, 18, 22, 21, R.leather || R.wood); s.ell(21, 20, 2, 2, g);
  return s; };
/* the wolf head-on: ears up, the long muzzle and pale throat, the brush behind */
const wolfFront = () => { const s = Spr(32, 32), f = R.fur, d = R.furDark, w = ramp('#e6e2da');
  s.ell(25, 14, 2.6, 3.6, d); s.rect(13, 21, 2, 7, d); s.rect(17, 21, 2, 7, d);
  s.ell(16, 18, 7.4, 5.4, f); s.ell(16, 19, 3.4, 3.4, w, { flat: true });
  for (const x of [10, 19]) { s.rect(x, 20, 3, 8, f); s.rect(x, 28, 3, 1, d); }
  s.poly([[11, 11], [10, 3], [15, 8]], d); s.poly([[21, 11], [22, 3], [17, 8]], f); s.fix(12, 7, d.lo); s.fix(20, 7, d.lo);
  s.ell(16, 11, 5, 4.4, f); s.rect(14, 13, 5, 4, f); s.rect(15, 14, 3, 3, w); s.fix(16, 17, A.INK); s.fix(15, 17, f.out); s.fix(17, 17, f.out);
  A.EYES(s, 13, 11, { kind: 'glow', col: '#f2c040' }); A.EYES(s, 19, 11, { kind: 'glow', col: '#f2c040' });
  return s; };
/* the Moonlit Hart head-on (world_ui.js draws it side-on) */
const hartFront = () => { const s = A.drawView('front', () => A.BUILD.deer({ fur: '#e8f0ff', antler: '#f4e8c0' }));
  for (const [x, y] of [[4, 8], [27, 5], [26, 18], [3, 22]]) s.fix(x, y, '#ffffff'); s.fix(14, 6, '#3a5a9a'); s.fix(18, 6, '#3a5a9a'); return s; };
const OWN = { chicken: { front: chickenFront }, goblin: { side: goblinSide }, wolf: { front: wolfFront }, ev_hart: { front: hartFront } };

/* ================= registration ================= */
A.VIEWS = A.VIEWS || { front: {}, side: {} }; A.BIG_VIEWS = A.BIG_VIEWS || { front: {}, side: {} };
const handDrawn = id => !!(A.BIG && A.BIG[id]);
const isFloor = id => /^tw_[a-z]+_\d$/.test(id);
/* the creatures that take both views here: every ordinary creature and animal, the tower floor creatures and the
   world-event creatures; not the bosses, mini-bosses or tower bosses (their own 64 x 64 drawings) */
A.viewScope = m => !!m && !handDrawn(m.id) && (!m.mini || isFloor(m.id));
const draw = (id, v) => { const own = OWN[id] && OWN[id][v]; if (own) return own(); return A.drawView(v, () => A.creatureSprite(id)); };
A.creatureView = draw;
/* the mythical beasts of Beastmastery (hunt_tiers_data.js D.MYTHS, 28 Nov 2026) are not creatures you fight, but they are
   seen in menus (front) and on the capture stage (side) the same way */
A.registerViews = () => {
  for (const m of [...Object.values(D.MON || {}), ...(D.MYTHS || []).map(x => ({ id: x.id, myth: true }))]) { if (!m.myth && !A.viewScope(m)) continue; const id = m.id; if (!A.hasCreature(id) && !OWN[id]) continue;
    for (const v of ['front', 'side']) { if (!A.VIEWS[v][id]) A.VIEWS[v][id] = () => draw(id, v);
      if (isFloor(id) && !A.BIG_VIEWS[v][id]) A.BIG_VIEWS[v][id] = () => A.atScale(2, () => draw(id, v)); } }
};
A.registerViews();
if (typeof document !== 'undefined' && document.addEventListener) document.addEventListener('DOMContentLoaded', A.registerViews);
})();
