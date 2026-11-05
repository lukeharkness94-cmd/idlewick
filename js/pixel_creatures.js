/* Idlewick pixel art: creatures, companions, townsfolk and farm animals (32 x 32) in the house style.
   Anatomy builders (humanoid, quadruped, bird, clawed, spectral, dragon, bat, rodent, golem, blob, turtle) take a
   per-creature spec of features, so a pirate, a scarecrow and a skeleton are different figures, not recolours. */
(() => {
const DQ = window.DQ, D = DQ.data, A = DQ.pixelArt; if (!A) return;
const { Spr, ramp, mix, R } = A;
const rp = c => ramp(c || '#999999');
const EYE = '#2a1c1f';
const eye = (s, x, y, c = EYE, shine = true) => { s.fix(x, y, c); if (shine && c === EYE) s.fix(x, y - 1, '#ffffff'); };

/* ---------- humanoids ---------- */
function humanoid(o) {
  const s = Spr(32, 32), k = o.big ? 1 : 0, skin = rp(o.skin || '#e0b088'), cloth = rp(o.cloth || '#7a6a5a'), cloth2 = rp(o.cloth2 || mix(o.cloth || '#7a6a5a', '#3a2448', .35));
  const top = 6 - k * 2, legY = 24;
  if (o.skeleton) { const b = rp('#dcdcd0'); s.ell(16, top + 5, 4.4, 4.6, b); s.rect(15, top + 10, 2, 9, b); for (let y = top + 11; y < top + 18; y += 2) s.line(12, y, 20, y, b); s.line(13, legY - 4, 11, 30, b); s.line(19, legY - 4, 21, 30, b); s.line(12, top + 11, 8, top + 19, b); s.line(20, top + 11, 24, top + 19, b); s.rect(13, top + 4, 2, 2, rp('#2a1c1f')); s.rect(17, top + 4, 2, 2, rp('#2a1c1f')); s.line(14, top + 8, 18, top + 8, null, b.lo); if (o.weapon) weapon(s, o.weapon, 24, top + 19); return s; }
  /* legs, body, arms */
  s.rect(12, legY, 3, 6, cloth2); s.rect(17, legY, 3, 6, cloth2); s.rect(11, 29, 4, 2, rp(o.boots || '#4a3226')); s.rect(17, 29, 4, 2, rp(o.boots || '#4a3226'));
  if (o.straw) { const st = R.straw; s.line(13, legY, 12, 30, st); s.line(19, legY, 20, 30, st); }
  s.poly([[11 - k, top + 11], [21 + k, top + 11], [22 + k, legY + 1], [10 - k, legY + 1]], cloth);
  if (o.robe) s.poly([[10, legY - 2], [22, legY - 2], [24, 30], [8, 30]], cloth);
  if (o.armour) { const m = ramp(o.armour, { gl: .72 }); s.poly([[10 - k, top + 11], [22 + k, top + 11], [22 + k, legY], [10 - k, legY]], m); s.rect(8 - k, top + 11, 3, 3, m); s.rect(21 + k, top + 11, 3, 3, m); s.line(16, top + 12, 16, legY - 1, null, m.lo); s.fix(12, top + 13, m.gl); }
  s.rect(8 - k, top + 12, 3, 8, o.armour ? ramp(o.armour) : cloth); s.rect(21 + k, top + 12, 3, 8, o.armour ? ramp(o.armour) : cloth);
  const hand = o.zombie ? [[8, top + 13], [21, top + 13]] : [[8 - k, top + 20], [21 + k, top + 20]];
  if (o.zombie) { s.rect(4, top + 13, 7, 2, skin); s.rect(21, top + 13, 7, 2, skin); } else hand.forEach(([x, y]) => s.rect(x, y, 3, 2, skin));
  s.rect(10 - k, legY - 2, 12 + 2 * k, 1, rp(o.belt || '#3e2a20'));
  /* head */
  s.ell(16, top + 5, 4.6 + k * .6, 4.8 + k * .4, skin);
  if (o.ears === 'goblin') { s.poly([[11, top + 4], [5, top + 1], [11, top + 7]], skin); s.poly([[21, top + 4], [27, top + 1], [21, top + 7]], skin); }
  if (o.horns) { const h = rp('#efe2c4'); s.poly([[12, top + 1], [10, top - 3], [13, top]], h); s.poly([[20, top + 1], [22, top - 3], [19, top]], h); }
  const ey = top + 5, ec = o.glow || EYE; eye(s, 14, ey, ec, !o.glow); eye(s, 18, ey, ec, !o.glow);
  if (o.mouth === 'grin') { s.line(14, ey + 3, 18, ey + 3, null, skin.out); s.fix(15, ey + 4, '#f4ecd8'); s.fix(17, ey + 4, '#f4ecd8'); } else s.line(15, ey + 3, 17, ey + 3, null, skin.out);
  if (o.beard) { const b = rp(o.beard); for (let y = ey + 2; y <= ey + 6; y++) s.line(13 + (y - ey - 2) * .4, y, 19 - (y - ey - 2) * .4, y, b); s.line(15, ey + 3, 17, ey + 3, null, '#5a2a2a'); }
  if (o.mask) s.rect(12, ey + 2, 9, 3, rp(o.mask));
  if (o.hair) { const h = rp(o.hair); s.ell(16, top + 2, 4.8, 2.2, h); s.rect(11, top + 2, 2, 4, h); s.rect(20, top + 2, 2, 3, h); }
  /* hats and helmets */
  const H = o.hat, hc = rp(o.hatCol || '#4a3a5a');
  if (H === 'hood') { s.poly([[16, top - 3], [23, top + 3], [22, top + 10], [10, top + 10], [9, top + 3]], hc); for (let y = top + 3; y <= top + 9; y++) for (let x = 13; x <= 19; x++) if (((x - 16) ** 2) / 11 + ((y - top - 6) ** 2) / 12 < 1) s.dot(x, y, skin); eye(s, 14, ey, ec, !o.glow); eye(s, 18, ey, ec, !o.glow); if (o.mask) s.rect(13, ey + 2, 7, 2, rp(o.mask)); }
  if (H === 'tricorn') { s.poly([[8, top + 1], [24, top + 1], [20, top - 4], [12, top - 4]], hc); s.line(9, top + 1, 23, top + 1, null, R.gold.base); }
  if (H === 'witch') { s.poly([[16, top - 9], [22, top + 1], [10, top + 1]], hc); s.rect(7, top + 1, 18, 2, hc); s.fix(17, top - 4, '#e6c86a'); }
  if (H === 'bandana') { s.rect(11, top, 10, 3, hc); s.poly([[21, top + 1], [25, top + 4], [22, top + 3]], hc); [[13, top + 1], [17, top + 1]].forEach(([x, y]) => s.fix(x, y, '#f4ecd8')); }
  if (H === 'cap') { s.ell(16, top + 1, 6, 2.6, hc); s.rect(10, top + 2, 12, 1, hc); [[13, top], [18, top - 1]].forEach(([x, y]) => s.fix(x, y, '#f4ecd8')); }
  if (H === 'straw') { const st = R.straw; s.rect(7, top + 1, 18, 2, st); s.ell(16, top - 1, 5, 3, st); s.line(10, top + 3, 9, top + 6, null, st.lo); s.line(22, top + 3, 23, top + 6, null, st.lo); }
  if (H === 'helm' || H === 'horned') { const m = ramp(o.hatCol || '#9aa3ad', { gl: .72 }); s.ell(16, top + 2, 5.4, 4, m); s.rect(10, top + 3, 12, 2, m); s.line(16, top - 2, 16, top + 3, null, m.lo); if (H === 'horned') { const h = rp('#efe2c4'); s.poly([[11, top + 1], [7, top - 4], [10, top - 2]], h); s.poly([[21, top + 1], [25, top - 4], [22, top - 2]], h); } }
  if (H === 'crown') { const g = ramp(o.hatCol || '#e6b84a', { gl: .8 }); s.poly([[10, top + 1], [10, top - 3], [13, top - 1], [16, top - 5], [19, top - 1], [22, top - 3], [22, top + 1]], g); s.fix(16, top - 1, '#ff7ad0'); }
  if (H === 'antler') { const a = rp('#a88a5a'); s.line(12, top + 1, 8, top - 5, a); s.line(10, top - 2, 7, top - 2, a); s.line(20, top + 1, 24, top - 5, a); s.line(22, top - 2, 25, top - 2, a); }
  if (H === 'halo') { const h = ramp('#fff0a0', { gl: .9 }); for (let i = 0; i < 16; i++) { const a = i * Math.PI / 8; s.fix(16 + Math.cos(a) * 6, top - 3 + Math.sin(a) * 1.6, h.base); } }
  if (o.straw) [[10, top + 12], [22, top + 12], [16, legY + 1]].forEach(([x, y]) => { s.fix(x, y, R.straw.hi); s.fix(x + 1, y + 1, R.straw.base); });
  if (o.barnacles) [[12, top + 14], [19, top + 17], [14, legY - 4]].forEach(([x, y]) => { s.fix(x, y, '#e8e4d8'); s.fix(x + 1, y, '#b8b4a8'); });
  if (o.strings) for (const x of [9, 16, 23]) s.line(x, 0, x, top + 4, null, '#d8d4c8');
  if (o.weapon) weapon(s, o.weapon, 23 + k, top + 20, o.weaponCol);
  return s;
}
function weapon(s, w, x, y, col) {
  const m = ramp(col || '#b8c0c8', { gl: .75 });
  if (w === 'dagger') { s.line(x + 1, y - 1, x + 1, y - 6, m); s.fix(x + 1, y - 7, m.gl); s.rect(x, y - 1, 3, 1, R.gold); }
  if (w === 'sword' || w === 'cutlass') { for (let i = 1; i <= 9; i++) s.dot(x + 1 + (w === 'cutlass' ? Math.round(Math.sin(i / 4) * 2) : 0), y - i, m); s.fix(x + 1, y - 10, m.gl); s.rect(x - 1, y - 1, 5, 1, R.gold); }
  if (w === 'axe') { s.line(x + 1, y + 2, x + 1, y - 9, R.wood); s.poly([[x + 1, y - 9], [x + 6, y - 11], [x + 6, y - 5], [x + 1, y - 6]], m); }
  if (w === 'club') { s.line(x + 1, y + 1, x + 4, y - 8, R.wood); s.line(x + 2, y + 1, x + 5, y - 8, R.wood); s.ell(x + 5, y - 9, 2, 2, R.woodLight); }
  if (w === 'staff') { s.line(x + 1, y + 6, x + 1, y - 12, R.wood); s.ell(x + 1, y - 13, 2, 2, ramp(col || '#b79cff', { gl: .85 })); }
  if (w === 'pitchfork') { s.line(x + 1, y + 6, x + 1, y - 9, R.wood); for (const dx of [-1, 1, 3]) s.line(x + dx, y - 9, x + dx, y - 12, m); s.line(x - 1, y - 9, x + 3, y - 9, m); }
}

/* ---------- quadrupeds ---------- */
function quad(o) {
  const s = Spr(32, 32), f = rp(o.fur), d = rp(o.dark || mix(o.fur, '#3a2448', .35)), k = o.big ? 1 : 0, belly = rp(o.belly || mix(o.fur, '#ffffff', .35));
  const by = 18 - k, legTop = 20;
  if (o.shell) { const sh = rp(o.shell); s.ell(15, by - 1, 10, 6, sh); for (let x = 8; x < 23; x += 4) s.line(x, by - 5, x + 2, by + 3, null, sh.lo); s.ell(26, by + 1, 3, 2.6, f); [[8, 23], [13, 24], [18, 24], [22, 23]].forEach(([x, y]) => s.rect(x, y, 3, 3, f)); eye(s, 27, by); return s; }
  if (o.tail === 'bushy') { s.poly([[6, by - 2], [1, by - 9], [3, by - 9], [7, by - 4]], d); s.ell(3, by - 8, 2, 2.2, d); }
  else if (o.tail === 'curly') { s.fix(5, by - 3, f.out); s.fix(4, by - 4, f.out); s.fix(4, by - 5, f.out); }
  else if (o.tail === 'thin') s.line(6, by - 2, 2, by + 3, d);
  else if (o.tail === 'fluff') s.ell(5, by - 2, 2.4, 2.4, rp('#f4f0e8'));
  s.ell(14, by, 8.5 + k, 4.8 + k * .6, f);
  const legs = o.short ? 4 : 7;
  [[7, legTop, 1], [10, legTop, -1], [17, legTop, 1], [20, legTop, 0]].forEach(([x, y, kk], i) => { const r = i % 2 ? d : f; s.rect(x, y, 2 + (o.stout ? 1 : 0), Math.ceil(legs / 2), r); s.rect(x + (o.stout ? 0 : kk), y + Math.ceil(legs / 2), 2 + (o.stout ? 1 : 0), Math.floor(legs / 2), r); s.rect(x + (o.stout ? 0 : kk), y + legs, 3, 1, rp(o.hoof || mix(o.fur, '#3a2448', .55))); });
  s.ell(14, by + 2.4, 6.4, 1.8, belly);
  /* head */
  const hx = 23 + k, hy = by - 5;
  s.ell(hx, hy, 4 + k * .5, 3.8, f);
  if (o.snout) { s.ell(hx + 4, hy + 2, 2.6, 2.2, rp(o.snoutCol || mix(o.fur, '#f0a0a0', .4))); s.fix(hx + 5, hy + 2, f.out); s.fix(hx + 3, hy + 2, f.out); }
  else s.poly([[hx + 2, hy - 1], [hx + 8, hy + 1], [hx + 7, hy + 4], [hx + 2, hy + 4]], f);
  if (o.ears === 'pointy') { s.poly([[hx - 3, hy - 2], [hx - 2, hy - 7], [hx, hy - 3]], d); s.poly([[hx, hy - 3], [hx + 2, hy - 7], [hx + 3, hy - 2]], d); }
  else if (o.ears === 'long') { s.rect(hx - 2, hy - 10, 2, 8, f); s.rect(hx + 1, hy - 10, 2, 8, f); s.fix(hx - 1, hy - 8, mix(o.fur, '#f0a0a0', .5)); s.fix(hx + 2, hy - 8, mix(o.fur, '#f0a0a0', .5)); }
  else if (o.ears === 'round') { s.ell(hx - 2, hy - 4, 1.6, 1.6, d); s.ell(hx + 2, hy - 4, 1.6, 1.6, d); }
  else if (o.ears === 'floppy') { s.poly([[hx - 3, hy - 2], [hx - 5, hy + 3], [hx - 2, hy + 1]], d); }
  if (o.horns) { const h = rp(o.hornCol || '#efe2c4'); s.poly([[hx - 2, hy - 3], [hx - 5, hy - 7], [hx - 1, hy - 4]], h); s.poly([[hx + 1, hy - 3], [hx + 3, hy - 8], [hx + 2, hy - 3]], h); }
  if (o.antlers) { const a = rp(o.antlers); s.line(hx - 1, hy - 3, hx - 4, hy - 10, a); s.line(hx - 3, hy - 7, hx - 6, hy - 8, a); s.line(hx + 1, hy - 3, hx + 3, hy - 10, a); s.line(hx + 2, hy - 7, hx + 5, hy - 8, a); }
  if (o.tusks) { s.fix(hx + 6, hy + 4, '#f4ecd8'); s.fix(hx + 6, hy + 3, '#f4ecd8'); s.fix(hx + 3, hy + 4, '#f4ecd8'); }
  if (o.mane) for (let x = 10; x < hx; x += 2) s.fix(x, by - 5 - (x % 4 ? 0 : 1), d.base);
  if (o.spots) [[9, by - 2], [16, by], [12, by + 2], [19, by - 3]].forEach(([x, y]) => s.ell(x, y, 1.6, 1.2, rp(o.spots)));
  if (o.saddle) { s.line(8, by - 4, 20, by - 4, null, d.base); s.line(9, by - 5, 18, by - 5, null, d.lo); }
  if (o.cracks) [[10, by - 1], [13, by + 1], [17, by - 2], [20, by]].forEach(([x, y]) => { s.fix(x, y, o.cracks); s.fix(x + 1, y + 1, o.cracks); });
  if (o.plates) for (let x = 9; x < 21; x += 3) s.poly([[x, by - 4], [x + 1, by - 8], [x + 2, by - 4]], rp(o.plates));
  if (o.thorns) for (let x = 8; x < 22; x += 3) s.poly([[x, by - 4], [x + 1, by - 7], [x + 2, by - 4]], rp('#4a7a3a'));
  if (o.wool) { const w = rp('#f2ece0'); s.ell(14, by - 1, 9, 5.6, w); for (let x = 7; x < 22; x += 3) s.fix(x, by - 5, w.lo); }
  if (o.candle) { s.rect(14, by - 9, 2, 4, rp('#efe2c4')); s.fix(14, by - 10, '#ffd060'); s.fix(15, by - 11, '#fff2a0'); }
  if (o.glassy) [[10, by - 2], [15, by - 3], [19, by - 1]].forEach(([x, y]) => s.fix(x, y, '#ffffff'));
  if (o.cloud) [[9, by - 5], [14, by - 6], [19, by - 5]].forEach(([x, y]) => s.ell(x, y, 2.4, 1.6, rp('#f6fbfc')));
  eye(s, hx + 1, hy - 1, o.glow || EYE, !o.glow);
  if (!o.snout) { s.fix(hx + 7, hy + 1, EYE); s.line(hx + 3, hy + 3, hx + 6, hy + 3, null, f.out); }
  return s;
}

/* ---------- birds, winged things ---------- */
function bird(o) {
  const s = Spr(32, 32), b = rp(o.plum), w = rp(o.wing || mix(o.plum, '#3a2448', .25)), bk = rp(o.beak || '#e8a838');
  if (o.spread) { s.poly([[16, 14], [2, 6], [5, 12], [3, 15], [14, 18]], w); s.poly([[16, 14], [30, 6], [27, 12], [29, 15], [18, 18]], w); for (let i = 0; i < 4; i++) { s.fix(4 + i * 2, 8 + i, w.lo); s.fix(28 - i * 2, 8 + i, w.lo); } }
  s.ell(16, 17, 5.4 - (o.small ? 1.2 : 0), 6 - (o.small ? 1.4 : 0), b); s.ell(16, o.small ? 11 : 10, 3.6, 3.4, b);
  s.poly([[16, o.small ? 12 : 11], [19, o.small ? 13 : 12], [16, o.small ? 14 : 13]], bk);
  if (o.crest) s.poly([[14, 7], [13, 2], [17, 6]], rp(o.crest));
  if (!o.spread) s.ell(13, 17, 3.4, 4.2, w);
  s.poly([[13, 23], [16, 28], [19, 23]], w);
  s.line(14, 23, 14, 27, bk); s.line(18, 23, 18, 27, bk);
  eye(s, 15, o.small ? 11 : 9, o.glow || EYE, !o.glow); eye(s, 18, o.small ? 11 : 9, o.glow || EYE, !o.glow);
  if (o.lamp) { s.ell(16, 19, 2.4, 2.4, ramp('#ffd060', { gl: .9 })); s.fix(16, 18, '#fffbe0'); }
  if (o.prism) [[9, 9], [23, 9], [16, 4]].forEach(([x, y]) => s.fix(x, y, '#ffffff'));
  if (o.ice) [[6, 9], [26, 9]].forEach(([x, y]) => s.fix(x, y, '#e8f6ff'));
  if (o.storm) { s.line(4, 20, 7, 17, null, '#fff2a0'); s.line(7, 17, 6, 22, null, '#fff2a0'); }
  return s;
}
function chicken(o = {}) { return A.sprites.chicken(); }

/* ---------- clawed: crabs, mites, mimics ---------- */
function clawed(o) {
  const s = Spr(32, 32), c = rp(o.shell), d = rp(mix(o.shell, '#3a2448', .35));
  s.ell(16, 19, 9, 5.6, c); s.line(9, 19, 23, 19, null, c.lo);
  for (const [x, dir] of [[9, -1], [12, -1], [20, 1], [23, 1]]) { s.line(x, 22, x + dir * 3, 27, d); s.line(x + dir * 3, 27, x + dir * 4, 29, d); }
  s.line(9, 16, 5, 11, d); s.line(23, 16, 27, 11, d); s.ell(5, 9, 2.6, 2.4, c); s.ell(27, 9, 2.6, 2.4, c); s.fix(4, 7, c.out); s.fix(28, 7, c.out);
  s.line(14, 14, 13, 10, null, d.base); s.line(18, 14, 19, 10, null, d.base); eye(s, 13, 10, o.glow || EYE, !o.glow); eye(s, 19, 10, o.glow || EYE, !o.glow);
  if (o.stones) [[11, 15], [16, 13], [21, 15]].forEach(([x, y]) => s.ell(x, y, 2.4, 2, R.stone));
  if (o.loom) s.line(10, 14, 22, 14, null, '#ffb04a');
  if (o.glowy) [[12, 18], [16, 17], [20, 18]].forEach(([x, y]) => s.fix(x, y, o.glowy));
  return s;
}

/* ---------- spectral ---------- */
function spectral(o) {
  const s = Spr(32, 32), g = ramp(o.col, { gl: .7 }), dark = rp(mix(o.col, '#1a1424', .5));
  s.ell(16, 13, 7, 7.4, g); s.poly([[9, 13], [23, 13], [24, 26], [21, 23], [18, 28], [15, 24], [12, 28], [8, 25]], g);
  s.rect(12, 11, 3, 3, dark); s.rect(17, 11, 3, 3, dark); s.fix(13, 12, o.eyes || '#fff6c0'); s.fix(18, 12, o.eyes || '#fff6c0');
  s.ell(16, 18, 2, 1.4, dark);
  if (o.hood) s.poly([[16, 3], [25, 12], [24, 18], [8, 18], [7, 12]], rp(o.hood));
  if (o.bell) { s.poly([[13, 22], [19, 22], [20, 27], [12, 27]], R.gold); s.fix(16, 28, R.gold.lo); }
  if (o.fronds) for (const x of [10, 16, 22]) s.line(x, 22, x - 1, 29, R.leafCrop);
  if (o.orbit) for (let i = 0; i < 12; i++) { const a = i * Math.PI / 6; s.fix(16 + Math.cos(a) * 12, 14 + Math.sin(a) * 4, '#e6e0ff'); }
  if (o.coil) for (let i = 0; i < 8; i++) s.fix(10 + i * 2, 26 + Math.round(Math.sin(i) * 2), g.lo);
  if (o.flame) [[11, 5], [16, 3], [21, 5]].forEach(([x, y]) => { s.fix(x, y, '#ffb04a'); s.fix(x, y + 1, '#ff6a3a'); });
  return s;
}

/* ---------- dragons ---------- */
function dragon(o) {
  const s = Spr(32, 32), b = rp(o.col), w = rp(o.wing || mix(o.col, '#3a2448', .3)), belly = rp(o.belly || '#f0d090'), k = o.big ? 1 : 0;
  s.poly([[14, 14], [4, 4 - k], [7, 12], [2, 13], [12, 18]], w); s.poly([[18, 14], [27, 4 - k], [25, 12], [30, 13], [20, 18]], w);   /* wings */
  s.ell(15, 19, 7 + k, 5, b); s.ell(15, 21, 4.6, 2.4, belly);
  s.poly([[8, 21], [2, 26], [1, 23], [4, 22]], b); s.poly([[1, 22], [0, 26], [3, 24]], rp(o.spike || '#e6c86a'));                  /* tail */
  s.rect(10, 22, 3, 6, b); s.rect(18, 22, 3, 6, b);
  s.ell(23, 12, 4 + k * .5, 3.4, b); s.poly([[25, 11], [31, 13], [30, 15], [25, 15]], b);                                      /* head, snout */
  s.poly([[21, 9], [19, 4], [23, 8]], rp(o.horn || '#efe2c4')); s.poly([[24, 9], [24, 4], [26, 9]], rp(o.horn || '#efe2c4'));
  for (let x = 10; x < 21; x += 3) s.fix(x, 14, rp(o.spike || '#e6c86a').base);
  eye(s, 24, 11, o.glow || '#f0d050', false); s.fix(30, 13, EYE);
  if (o.fire) { s.fix(31, 15, '#ffb04a'); s.fix(31, 16, '#ff6a3a'); }
  return s;
}

/* ---------- smaller families ---------- */
function bat(o) { const s = Spr(32, 32), b = rp(o.col), w = rp(mix(o.col, '#3a2448', .3)); s.poly([[14, 14], [2, 9], [5, 14], [3, 18], [8, 16], [11, 19], [15, 17]], w); s.poly([[18, 14], [30, 9], [27, 14], [29, 18], [24, 16], [21, 19], [17, 17]], w); s.ell(16, 16, 3.6, 4.4, b); s.poly([[13, 12], [13, 8], [15, 11]], b); s.poly([[19, 12], [19, 8], [17, 11]], b); eye(s, 15, 14, '#ff6a6a', false); eye(s, 17, 14, '#ff6a6a', false); s.fix(15, 18, '#f4ecd8'); s.fix(17, 18, '#f4ecd8'); return s; }
function rodent(o) { const s = Spr(32, 32), f = rp(o.col), b = rp(mix(o.col, '#ffffff', .35)); if (o.tail === 'bushy') { s.poly([[10, 22], [4, 12], [8, 8], [12, 18]], f); } else s.line(9, 24, 2, 26, rp('#d8a0a0')); s.ell(15, 22, 6.4, 4.6, f); s.ell(15, 24, 3.6, 2, b); s.ell(21, 18, 3.6, 3.2, f); s.ell(19, 15, 1.6, 1.6, f); s.ell(23, 15, 1.6, 1.6, f); s.fix(19, 15, mix(o.col, '#f0a0a0', .5)); s.fix(25, 19, '#e07a7a'); eye(s, 22, 17); s.rect(11, 26, 2, 2, f); s.rect(17, 26, 2, 2, f); if (o.acorn) { s.ell(25, 24, 1.8, 2, rp('#a87a3a')); s.rect(24, 22, 3, 1, rp('#6a4a2a')); } return s; }
function golem(o) { const s = Spr(32, 32), g = rp(o.col), d = rp(mix(o.col, '#3a2448', .35)); s.rect(10, 9, 12, 13, g); s.rect(12, 3, 8, 7, g); s.rect(5, 10, 5, 9, d); s.rect(22, 10, 5, 9, d); s.rect(4, 19, 6, 4, g); s.rect(22, 19, 6, 4, g); s.rect(11, 22, 4, 8, d); s.rect(17, 22, 4, 8, d); s.line(12, 14, 19, 17, null, g.lo); s.fix(14, 6, o.eyes || '#7ae8ff'); s.fix(17, 6, o.eyes || '#7ae8ff'); [[13, 11], [18, 19]].forEach(([x, y]) => s.fix(x, y, g.hi)); if (o.moss) [[12, 3], [19, 9], [6, 10]].forEach(([x, y]) => s.fix(x, y, '#6a9a4a')); return s; }
function blob(o) { const s = Spr(32, 32), b = rp(o.col); for (const [x, dir] of [[9, -1], [14, -1], [19, 1], [23, 1]]) for (let i = 0; i < 7; i++) s.dot(x + Math.round(Math.sin(i / 1.5) * dir * 1.5), 21 + i, b); s.ell(16, 15, 9, 8, b); [[12, 12, 2], [19, 11, 2.4], [16, 17, 1.6]].forEach(([x, y, r]) => { s.ell(x, y, r, r, rp('#f4ecd8')); s.fix(x, y, EYE); }); if (o.bloom) for (let i = 0; i < 6; i++) { const a = i * Math.PI / 3; s.ell(16 + Math.cos(a) * 8, 7 + Math.sin(a) * 2.4, 1.6, 1.6, rp(o.bloom)); } return s; }
function fishPet(o) { const s = Spr(32, 32), t = Spr(16, 16); const sp = Object.assign({}, A.FISH.carp, { body: o.col, belly: mix(o.col, '#ffffff', .5) }); return (() => { const big = Spr(32, 32); const f = A.fishLarge('carp'); big.stamp(f, 0, 8); return big; })(); }
function hive() { const s = Spr(32, 32), h = rp('#e0a838'); for (let i = 0; i < 5; i++) s.ell(16, 10 + i * 4, 7 - Math.abs(i - 2) * .8, 2.6, h); s.rect(14, 24, 4, 3, rp('#4a3226')); s.line(16, 2, 16, 7, R.wood); [[24, 10], [7, 16], [25, 20]].forEach(([x, y]) => { s.fix(x, y, '#2a1c1f'); s.fix(x + 1, y, '#f0d060'); s.fix(x, y - 1, '#ffffff'); }); return s; }
function object(kind) {
  const s = Spr(32, 32);
  if (kind === 'chest') { const w = R.wood; s.rect(5, 14, 22, 13, w); s.poly([[5, 14], [7, 7], [25, 7], [27, 14]], R.woodLight); s.rect(5, 14, 22, 2, R.gold); s.rect(14, 14, 4, 5, R.gold); [[8, 5], [13, 4], [19, 5], [24, 6]].forEach(([x, y]) => s.ell(x, y, 1.6, 1.4, R.gold)); return s; }
  if (kind === 'vault') { s.rect(3, 4, 26, 26, R.stoneDark); s.ell(16, 17, 10, 10, R.iron); s.ell(16, 17, 6, 6, R.steel); for (let i = 0; i < 4; i++) { const a = i * Math.PI / 2; s.line(16, 17, 16 + Math.cos(a) * 5, 17 + Math.sin(a) * 5, R.gold); } return s; }
  if (kind === 'rack') { s.rect(4, 26, 24, 3, R.wood); s.rect(5, 6, 2, 21, R.wood); s.rect(25, 6, 2, 21, R.wood); s.rect(5, 8, 22, 2, R.wood); for (const x of [10, 15, 20]) { s.line(x, 10, x, 24, R.steel); s.rect(x - 1, 22, 3, 1, R.gold); } s.poly([[12, 12], [16, 10], [20, 12], [16, 20]], R.bronze); return s; }
  if (kind === 'stall') { s.rect(4, 16, 24, 12, R.wood); for (let x = 3; x < 29; x += 4) s.rect(x, 6, 4, 6, (x / 4) % 2 ? R.red : rp('#f4ecd8')); s.rect(5, 12, 2, 6, R.wood); s.rect(25, 12, 2, 6, R.wood); [[9, 15, '#e0405a'], [14, 15, '#f0d060'], [20, 15, '#7ab04a']].forEach(([x, y, c]) => s.ell(x, y, 2, 1.6, rp(c))); return s; }
  return s;
}

/* ---------- specs for every creature id ---------- */
const H = (o) => () => humanoid(o), Q = o => () => quad(o), B = o => () => bird(o), C = o => () => clawed(o), G = o => () => spectral(o), Dr = o => () => dragon(o);
const SPECS = {
  chicken: () => A.sprites.chicken(), goblin: () => A.sprites.goblin(), wolf: () => A.sprites.wolf(),
  rat: () => rodent({ col: '#9a8e80' }),
  cow: Q({ fur: '#f2ece0', dark: '#5a4a3a', spots: '#4a3a2a', horns: true, ears: 'floppy', tail: 'thin', snout: true, snoutCol: '#e8b0a8', stout: true }),
  grubnash: H({ skin: '#8fbf6a', cloth: '#7a4a2a', ears: 'goblin', big: true, hat: 'horned', hatCol: '#8a7a6a', weapon: 'club', mouth: 'grin' }),
  boar: Q({ fur: '#8a5a3a', dark: '#5a3a2a', tusks: true, snout: true, snoutCol: '#c88a7a', ears: 'pointy', mane: true, tail: 'curly', stout: true }),
  scarecrow: H({ skin: '#e8d8a0', cloth: '#7a5a8a', cloth2: '#6a5a3a', straw: true, hat: 'straw', mouth: 'grin', glow: '#f0a030', weapon: 'pitchfork' }),
  oldtusk: Q({ fur: '#a0703e', dark: '#5a3a2a', tusks: true, snout: true, snoutCol: '#c88a7a', ears: 'pointy', mane: true, tail: 'curly', big: true, stout: true, glow: '#e04a3a' }),
  crab: C({ shell: '#d9734a' }),
  bandit: H({ skin: '#d8a880', cloth: '#6a5a4a', hat: 'hood', hatCol: '#4a4a3a', mask: '#3a3030', weapon: 'dagger' }),
  smuggler: H({ skin: '#c8987a', cloth: '#4a5a6a', hat: 'bandana', hatCol: '#8a3a3a', beard: '#4a3a2a', weapon: 'dagger' }),
  pirate: H({ skin: '#c88a6a', cloth: '#8a3a3a', cloth2: '#3a3a4a', hat: 'tricorn', hatCol: '#2a2a34', beard: '#3a2a1e', weapon: 'cutlass' }),
  barnacle: H({ skin: '#7ab8c0', cloth: '#2a4a6a', big: true, hat: 'tricorn', hatCol: '#1e2a3a', beard: '#4a6a6a', barnacles: true, weapon: 'cutlass', weaponCol: '#6fc7d8' }),
  bat: () => bat({ col: '#6a5a7a' }),
  icewolf: Q({ fur: '#cfe6f2', dark: '#8aaabd', belly: '#ffffff', ears: 'pointy', tail: 'bushy', saddle: true, glow: '#7ae8ff' }),
  raider: H({ skin: '#d8a880', cloth: '#7a6a4a', hat: 'horned', hatCol: '#8a8a8a', beard: '#c08a3a', weapon: 'axe' }),
  troll: H({ skin: '#8a9a78', cloth: '#5a4a3a', big: true, mouth: 'grin', weapon: 'club', ears: 'goblin' }),
  frostmaw: H({ skin: '#bfe0f0', cloth: '#5a6a8a', big: true, mouth: 'grin', weapon: 'club', hat: 'horned', hatCol: '#e8f6ff', glow: '#7ae8ff' }),
  zombie: H({ skin: '#8aaa78', cloth: '#5a5a4a', cloth2: '#4a4a3a', zombie: true, glow: '#e8f070', mouth: 'grin' }),
  skeleton: H({ skeleton: true, weapon: 'sword' }),
  bogsnapper: Q({ fur: '#5f8a4a', shell: '#4a6a3a' }),
  wraith: G({ col: '#9b87e0', hood: '#4a3a6a' }),
  morwenna: H({ skin: '#c8d8a8', cloth: '#5a3a7a', robe: true, hat: 'witch', hatCol: '#3a2a4a', hair: '#2a2a2a', weapon: 'staff', weaponCol: '#b79cff' }),
  imp: () => { const s = humanoid({ skin: '#ff8a4a', cloth: '#a03a2a', horns: true, mouth: 'grin', glow: '#fff070' }); s.poly([[9, 14], [3, 9], [5, 16]], rp('#a03a2a')); s.poly([[23, 14], [29, 9], [27, 16]], rp('#a03a2a')); return s; },
  hound: Q({ fur: '#5a3a34', dark: '#3a2424', ears: 'pointy', tail: 'thin', cracks: '#ff8a3a', glow: '#ffb04a' }),
  drake: Dr({ col: '#58c27e', belly: '#e8e0a0' }),
  emberlord: H({ skin: '#5a3a34', armour: '#7a5a4a', hat: 'helm', hatCol: '#8a5a4a', glow: '#ff8a3a', weapon: 'sword', weaponCol: '#ff8a4a' }),
  pyrrhax: Dr({ col: '#e8583a', belly: '#ffd060', big: true, fire: true, spike: '#ffb04a' }),
  hawk: B({ plum: '#9a7a5a', wing: '#6a5040', beak: '#e8c040', spread: true, crest: '#b8a080' }),
  golem: () => golem({ col: '#b8b0a0' }),
  wyvern: Dr({ col: '#d8ccf0', wing: '#a898d0', belly: '#ffffff', horn: '#ffffff' }),
  zephyrion: B({ plum: '#bfe8ff', wing: '#7ab8e0', beak: '#f0d060', spread: true, storm: true, crest: '#ffffff' }),
  voidknight: H({ skin: '#2a1e3a', armour: '#4a3a6a', hat: 'helm', hatCol: '#3a2a5a', glow: '#c8a8ff', weapon: 'sword', weaponCol: '#8a5ad8' }),
  shade: G({ col: '#4a3a6a', eyes: '#c8a8ff' }),
  horror: () => blob({ col: '#8a3a6a' }),
  hollowking: H({ skin: '#3a2e4a', armour: '#5a4a7a', big: true, hat: 'crown', hatCol: '#b08aff', glow: '#e0d0ff', weapon: 'sword', weaponCol: '#b08aff' }),
  /* regional wildlife (creatures_expanded) */
  brambleback: Q({ fur: '#6f9854', thorns: true, ears: 'round', short: true, snout: true }),
  lanternmoth: B({ plum: '#d6b85f', wing: '#b89a4a', spread: true, lamp: true, small: true, beak: '#6a5a3a' }),
  rilljaw: C({ shell: '#4f9c91' }),
  tattercap: H({ skin: '#e0c0a0', cloth: '#a56f91', hat: 'cap', hatCol: '#a56f91', mouth: 'grin' }),
  mossglass: Q({ fur: '#77a98a', antlers: '#cde8d8', ears: 'pointy', tail: 'fluff', glassy: true }),
  thimblefox: Q({ fur: '#c78354', belly: '#f4ecd8', ears: 'pointy', tail: 'bushy' }),
  rootbound: H({ skin: '#8a7a54', cloth: '#5a6a3a', big: true, hat: 'antler', glow: '#c8f070' }),
  bellhare: Q({ fur: '#806a9b', ears: 'long', tail: 'fluff', short: true }),
  tideglass: C({ shell: '#5da8a8', glowy: '#e8ffff' }),
  kelplantern: G({ col: '#5c9d78', fronds: true }),
  brineback: Q({ fur: '#728f99', plates: '#9ab0b8', stout: true, ears: 'round' }),
  wreckling: H({ skin: '#9a765b', cloth: '#6a5040', barnacles: true, hat: 'cap', hatCol: '#5a4030', weapon: 'club' }),
  chimehorn: Q({ fur: '#9cb7bd', horns: true, hornCol: '#e6c86a', ears: 'pointy', tail: 'thin' }),
  snowcoil: G({ col: '#b2d7d9', coil: true }),
  cairnmimic: C({ shell: '#85857c', stones: true, glow: '#ffb04a' }),
  rimewing: B({ plum: '#91b9cb', spread: true, ice: true }),
  murkbell: G({ col: '#718b6b', bell: true }),
  reedstalker: H({ skin: '#718b56', cloth: '#5a6a3a', hat: 'straw', hatCol: '#8a9a5a', weapon: 'pitchfork' }),
  candletoad: Q({ fur: '#997b55', short: true, candle: true, ears: 'round', stout: true }),
  siltmarionette: H({ skin: '#a898a8', cloth: '#87768f', strings: true, glow: '#e8e0f0' }),
  ashveil: G({ col: '#a36055', flame: true }),
  cinderloom: C({ shell: '#d87a45', loom: true }),
  glassback: Q({ fur: '#ba765e', glassy: true, plates: '#e8d0c0', ears: 'pointy' }),
  furnacemite: C({ shell: '#e09545', glowy: '#fff070' }),
  nimbusgrazer: Q({ fur: '#b7d8d8', cloud: true, horns: true, ears: 'floppy', snout: true, stout: true }),
  prismkite: B({ plum: '#b7a8d8', spread: true, prism: true }),
  thunderloom: C({ shell: '#7da9bb', glowy: '#fff2a0' }),
  galehermit: H({ skin: '#d8b898', cloth: '#a5a28d', robe: true, beard: '#e8e8e8', hat: 'hood', hatCol: '#8a8870', weapon: 'staff', weaponCol: '#bfe8ff' }),
  echohusk: H({ skin: '#625779', cloth: '#4a3e5a', glow: '#e0d0ff' }),
  paleorbit: G({ col: '#a6a0bd', orbit: true }),
  threadsaint: H({ skin: '#c8b8c0', cloth: '#8a728b', robe: true, hat: 'halo' }),
  nullbloom: () => blob({ col: '#76527e', bloom: '#e0a0ff' })
};
/* companions */
const PET_SPECS = {
  biscuit: Q({ fur: '#d8a060', ears: 'floppy', tail: 'thin', short: true }), toast: B({ plum: '#e8c890', small: true }), bubbles: () => fishPet({ col: '#f0a050' }),
  acorn: () => rodent({ col: '#b8783a', tail: 'bushy', acorn: true }), nugget: () => rodent({ col: '#e0b870' }), whiskers: Q({ fur: '#8a8a94', ears: 'pointy', tail: 'thin', short: true }),
  cinder: G({ col: '#e07a4a', flame: true }), quill: B({ plum: '#5a7ab8', crest: '#e0e8ff', small: true }), pudding: Q({ fur: '#f0b0b0', snout: true, ears: 'floppy', tail: 'curly', short: true, stout: true }),
  gobbo: H({ skin: '#8fbf6a', cloth: '#8a5a3a', ears: 'goblin', mouth: 'grin' }), tusky: Q({ fur: '#a0703e', tusks: true, snout: true, ears: 'pointy', short: true, tail: 'curly' }), bill: C({ shell: '#e0784a' }),
  frostling: H({ skin: '#cfe6f2', cloth: '#7a9ab8', mouth: 'grin', glow: '#7ae8ff' }), bogwisp: G({ col: '#8fbf7a' }), wyrmling: Dr({ col: '#ff8a5a', belly: '#ffd8a0' }),
  stormchick: B({ plum: '#bfe8ff', small: true, crest: '#fff2a0' }), hollowling: G({ col: '#b08aff', eyes: '#ffffff' })
};
/* townsfolk and thieving targets */
const FOLK = {
  villager: H({ skin: '#e8b890', cloth: '#7a9a5a', hair: '#6a4a2a' }), farmer: H({ skin: '#d8a070', cloth: '#a87a3a', hat: 'straw', weapon: 'pitchfork' }),
  dockhand: H({ skin: '#c88a6a', cloth: '#4a6a8a', hat: 'bandana', hatCol: '#3a5a7a', beard: '#3a2a1e' }), merchant: H({ skin: '#e8c098', cloth: '#8a3a5a', hat: 'cap', hatCol: '#5a2a4a', belt: '#e6b84a' }),
  dwarf: H({ skin: '#e0a880', cloth: '#6a5a8a', beard: '#c06a3a', hat: 'helm', hatCol: '#9aa3ad', big: true }), armoury: () => object('rack'),
  cultist: H({ skin: '#c8b8b0', cloth: '#5a2a3a', robe: true, hat: 'hood', hatCol: '#3a1a2a', glow: '#ff6a6a' }), witch: H({ skin: '#c8d8a8', cloth: '#4a3a6a', robe: true, hat: 'witch', hatCol: '#2a1e3a', weapon: 'staff' }),
  fireguard: H({ skin: '#c8906a', armour: '#a05a3a', hat: 'helm', hatCol: '#b06a3a', weapon: 'sword' }), hoard: () => object('chest'),
  farmhand: H({ skin: '#e0b088', cloth: '#c89a5a', hair: '#c8903a' }), market: () => object('stall'),
  monk: H({ skin: '#e0b890', cloth: '#d08a3a', robe: true, mouth: 'grin' }), vault: () => object('vault')
};
/* farm animals */
const ANIMAL = {
  hen: () => A.sprites.chicken(), cow: SPECS.cow, sheep: Q({ fur: '#3a3434', wool: true, ears: 'floppy', short: true }), pig: PET_SPECS.pudding,
  goat: Q({ fur: '#e8e0d0', horns: true, ears: 'floppy', tail: 'thin', snout: false }), bees: hive
};
const creatureSprite = id => { const f = SPECS[id] || PET_SPECS[id] || FOLK[id] || ANIMAL[id]; return f ? f() : null; };
Object.assign(A, { humanoid, creatureSprite, CREATURE_SPECS: SPECS, PET_SPECS, FOLK, ANIMAL,
  creatureUrl: id => A.url('creature:' + id, () => creatureSprite(id)),
  hasCreature: id => !!(SPECS[id] || PET_SPECS[id] || FOLK[id] || ANIMAL[id]) });
})();
