/* Idlewick: the hero, drawn from what they wear.
   A 24x34 pixel figure painted in layers: cape, legs, body, head, helm, amulet, shield, weapon.
   Gear tier changes the shapes (cap -> full helm -> crested helm, mail -> plate -> ornate plate), not just the colour.
   Veterans stand out: a skill cape once a skill passes 30, trimmed at 60, golden at 99, plus hero-level medals and a mastery glow. */
(() => {
const DQ = window.DQ, D = DQ.data;
const W = 24, H = 34, K = '#1a1310';
const rgb = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
const mix = (a, b, t) => { const A = rgb(a), B = rgb(b); return '#' + A.map((v, i) => Math.round(v + (B[i] - v) * t).toString(16).padStart(2, '0')).join(''); };
const lite = (c, t = .3) => mix(c, '#ffffff', t), dark = (c, t = .3) => mix(c, '#000000', t);
const GOLD = '#e8bb62', GOLD_D = '#a8761b';

/* ---------- tiny painting kit ---------- */
const grid = () => Array.from({ length: H }, () => Array(W).fill(null));
const px = (g, x, y, c) => { if (x >= 0 && x < W && y >= 0 && y < H) g[y][x] = c; };
const rect = (g, x, y, w, h, c) => { for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) px(g, x + i, y + j, c); };
const mrect = (g, x, y, w, h, c) => { rect(g, x, y, w, h, c); rect(g, W - x - w, y, w, h, c); };   /* mirrored left/right */
const mpx = (g, x, y, c) => { px(g, x, y, c); px(g, W - 1 - x, y, c); };
const stamp = (g, x, y, rows, pal) => rows.forEach((r, j) => [...r].forEach((ch, i) => { if (pal[ch]) px(g, x + i, y + j, pal[ch]); }));

/* ---------- gear lookup ---------- */
const TIER_IDS = (D.TIERS || []).map(t => t.id || t.name);
const tierOf = id => id ? TIER_IDS.findIndex(t => id.startsWith(t + '_')) : -1;
const colOf = id => { const ti = tierOf(id); return ti >= 0 ? D.TIERS[ti].col : (D.ITEMS[id] && D.ITEMS[id].col) || '#9aa3ad'; };
const kindOf = id => !id ? null : id.startsWith('robe_') ? 'robe' : /^(leather|frost|bog|drake)_/.test(id) ? 'leather' : tierOf(id) >= 0 ? 'metal' : 'special';
const SKIN_FALL = '#e0b088';

/* ---------- the figure ---------- */
function paint(o) {
  const g = grid(), eq = o.eq || {}, skin = o.skin || SKIN_FALL, skinS = dark(skin, .18), hair = o.hair || '#5a3a22', hairS = dark(hair, .35);
  const tunic = o.tunic || '#4a78c8';
  const cape = o.cape;           /* { col, level 1..3 } */

  /* cape, behind everything */
  if (cape) {
    const c = dark(cape.col, .2), c2 = dark(cape.col, .42);
    rect(g, 3, 15, 18, 14, c); rect(g, 3, 15, 2, 14, lite(c, .12)); rect(g, 19, 15, 2, 14, c2);
    for (let y = 16; y < 29; y += 3) px(g, 4, y, c2);
    if (cape.level >= 2) { rect(g, 3, 28, 18, 1, GOLD); px(g, 3, 15, GOLD); px(g, 20, 15, GOLD); }
    if (cape.level >= 3) { stamp(g, 10, 24, ['..y..', '.yyy.', 'yyyyy', '.yyy.'], { y: GOLD }); }
  }

  /* legs and boots (a robe will cover them later) */
  const legC = eq.legs ? colOf(eq.legs) : '#5a4636', legK = eq.legs ? kindOf(eq.legs) : null;
  const legCol = legK === 'robe' ? legC : legC;
  rect(g, 7, 23, 4, 6, legCol); rect(g, 13, 23, 4, 6, legCol);
  rect(g, 7, 23, 1, 6, lite(legCol, .18)); rect(g, 13, 23, 1, 6, lite(legCol, .18)); rect(g, 10, 23, 1, 6, dark(legCol, .25)); rect(g, 16, 23, 1, 6, dark(legCol, .25));
  if (eq.legs && legK === 'metal') { mpx(g, 8, 25, lite(legCol, .4)); mpx(g, 9, 25, lite(legCol, .4)); mrect(g, 7, 26, 4, 1, dark(legCol, .3)); }
  if (eq.legs && legK === 'leather') { mrect(g, 7, 27, 4, 1, dark(legCol, .35)); }
  const boot = eq.legs && legK === 'metal' ? dark(legCol, .35) : '#3b2a1a';
  rect(g, 6, 29, 5, 2, boot); rect(g, 13, 29, 5, 2, boot); px(g, 6, 29, lite(boot, .25)); px(g, 13, 29, lite(boot, .25));

  /* torso and arms: plain tunic first */
  const body = eq.body, bk = kindOf(body), bti = tierOf(body), bc = body ? colOf(body) : tunic;
  const tc = body ? bc : tunic;
  rect(g, 5, 15, 14, 1, tc);                                  /* shoulders */
  rect(g, 6, 16, 12, 6, tc); rect(g, 6, 22, 12, 1, '#5a3a1c'); /* torso + belt */
  rect(g, 6, 16, 1, 6, lite(tc, .22)); rect(g, 17, 16, 1, 6, dark(tc, .22)); rect(g, 8, 17, 2, 3, lite(tc, .1));
  mpx(g, 11, 22, GOLD); px(g, 12, 22, GOLD);
  mrect(g, 4, 16, 2, 4, tc); mrect(g, 4, 20, 2, 2, skin);       /* sleeves and hands */
  mrect(g, 4, 16, 1, 4, lite(tc, .18));
  px(g, 10, 15, skinS); px(g, 11, 15, skin); px(g, 12, 15, skin); px(g, 13, 15, skinS);   /* neckline */

  /* body armour */
  if (body) {
    if (bk === 'robe') {
      rect(g, 6, 23, 12, 7, bc); rect(g, 6, 23, 1, 7, lite(bc, .2)); rect(g, 17, 23, 1, 7, dark(bc, .25));
      rect(g, 6, 29, 12, 1, lite(bc, .45)); mrect(g, 3, 17, 3, 4, bc); mrect(g, 3, 20, 3, 1, lite(bc, .45));
      rect(g, 10, 15, 4, 1, lite(bc, .45)); px(g, 11, 23, lite(bc, .45)); px(g, 12, 23, lite(bc, .45));
      for (let y = 24; y < 29; y += 2) { px(g, 11, y, dark(bc, .25)); px(g, 12, y, dark(bc, .25)); }
    } else if (bk === 'leather') {
      for (let i = 0; i < 5; i++) { px(g, 10 + (i % 2), 16 + i, dark(bc, .45)); px(g, 13 - (i % 2), 16 + i, dark(bc, .45)); }
      mrect(g, 6, 15, 3, 2, dark(bc, .3)); mrect(g, 4, 19, 2, 2, dark(bc, .35));
    } else if (bti <= 1) {                       /* mail: a checker of links */
      for (let y = 16; y < 22; y++) for (let x = 7; x < 17; x++) if ((x + y) % 2 === 0) px(g, x, y, dark(bc, .22));
      mrect(g, 4, 16, 2, 3, dark(bc, .1));
    } else {                                     /* plate and ornate */
      rect(g, 11, 16, 2, 6, lite(bc, .42)); rect(g, 7, 16, 1, 6, lite(bc, .3)); rect(g, 16, 16, 1, 6, dark(bc, .3));
      mrect(g, 3, 14, 4, 3, lite(bc, .1)); mrect(g, 3, 14, 4, 1, lite(bc, .45)); mrect(g, 4, 17, 2, 3, bc);
      rect(g, 6, 22, 12, 1, dark(bc, .45));
      if (bti >= 4) { rect(g, 8, 15, 8, 1, GOLD); rect(g, 6, 22, 12, 1, GOLD); mpx(g, 3, 13, lite(bc, .55)); stamp(g, 11, 17, ['aa', 'aa'], { a: lite(bc, .6) }); mrect(g, 3, 16, 4, 1, GOLD); }
    }
  }

  /* head: reuse the hand-drawn face from the 24x24 hero (hair, skin, eyes, mouth) */
  const SPR = DQ.SPR24 && DQ.SPR24.hero;
  const pal = { h: hair, H: hairS, s: skin, S: skinS, e: '#120c08', w: '#f4efe4', r: '#a8504a' };
  if (SPR) for (let y = 2; y <= 14; y++) [...SPR.rows[y]].forEach((ch, x) => { if (pal[ch]) px(g, x, y, pal[ch]); });

  /* eyes sit closer together than the hand-drawn template */
  for (const x of [7, 8, 15, 16]) px(g, x, 8, skin);
  px(g, 8, 8, '#f4efe4'); px(g, 9, 8, '#120c08'); px(g, 14, 8, '#120c08'); px(g, 15, 8, '#f4efe4');

  /* helm */
  const helm = eq.head, hk = kindOf(helm), hti = tierOf(helm), hc = helm ? colOf(helm) : null;
  if (helm) {
    if (helm === 'hollow_crown') {
      rect(g, 6, 2, 12, 1, hair); rect(g, 6, 4, 12, 2, GOLD); for (const x of [6, 9, 12, 15]) rect(g, x, 1, 2, 3, GOLD); mpx(g, 8, 3, '#b08aff'); px(g, 11, 3, '#e0564f'); px(g, 12, 3, '#e0564f');
    } else if (hk === 'robe') {
      const t = [[11, 1, 2], [10, 2, 4], [9, 3, 6], [8, 4, 8], [7, 5, 10]]; t.forEach(([x, y, w]) => rect(g, x, y, w, 1, hc)); px(g, 11, 0, hc);
      rect(g, 4, 6, 16, 1, dark(hc, .25)); rect(g, 6, 5, 12, 1, lite(hc, .3)); px(g, 10, 3, GOLD); px(g, 13, 4, GOLD); rect(g, 8, 6, 8, 1, dark(hc, .35));
    } else if (hk === 'leather') {
      rect(g, 6, 2, 12, 4, hc); rect(g, 5, 3, 14, 10, hc); rect(g, 7, 6, 10, 7, null); rect(g, 6, 2, 12, 1, lite(hc, .3));
      for (let y = 6; y <= 12; y++) { mpx(g, 6, y, dark(hc, .3)); }
      stamp(g, 7, 6, ['sssssssssss'], {}); rect(g, 7, 6, 10, 7, null);
      /* face shows through the hood: repaint skin under the opening */
      if (SPR) for (let y = 6; y <= 12; y++) [...SPR.rows[y]].forEach((ch, x) => { if (x >= 7 && x <= 16 && pal[ch]) px(g, x, y, pal[ch]); });
      rect(g, 7, 13, 10, 1, dark(hc, .25)); rect(g, 7, 5, 10, 1, dark(hc, .2));
    } else {                                      /* metal helms by tier */
      const m = hc, hi = lite(m, .4), lo = dark(m, .35), acc = lite(m, .55);
      rect(g, 8, 2, 8, 1, m); rect(g, 6, 3, 12, 3, m); rect(g, 5, 4, 14, 3, m); px(g, 8, 3, hi); px(g, 9, 3, hi); px(g, 7, 4, hi); rect(g, 5, 6, 14, 1, lo);
      if (hti >= 2) {                              /* full helm with a visor */
        rect(g, 5, 7, 14, 3, m); rect(g, 5, 7, 2, 3, hi); rect(g, 17, 7, 2, 3, lo);
        rect(g, 7, 8, 10, 1, '#120c08'); mpx(g, 9, 8, '#f4efe4');
        rect(g, 6, 10, 12, 2, lo); for (let x = 8; x <= 15; x += 2) px(g, x, 10, m);
      }
      if (hti <= 1) rect(g, 11, 6, 2, 4, lo);       /* nose guard on the plain caps */
      if (hti >= 4) {                               /* crested: plume and gold trim */
        rect(g, 11, 0, 2, 1, acc); rect(g, 10, 1, 4, 1, acc); rect(g, 9, 2, 6, 1, acc); rect(g, 5, 6, 14, 1, GOLD);
        mpx(g, 6, 3, GOLD); rect(g, 11, 3, 2, 1, GOLD);
      }
      if (helm === 'chief_helm') { mrect(g, 3, 1, 2, 4, '#e8dcc0'); mrect(g, 4, 0, 1, 1, '#e8dcc0'); }
    }
  }

  /* amulet and ring */
  if (eq.amulet) { const ac = colOf(eq.amulet); px(g, 10, 16, GOLD_D); px(g, 13, 16, GOLD_D); px(g, 11, 17, GOLD); px(g, 12, 17, GOLD); px(g, 11, 18, ac); px(g, 12, 18, ac); px(g, 11, 19, lite(ac, .4)); px(g, 12, 19, ac); }
  if (eq.ring) px(g, 19, 21, colOf(eq.ring)), px(g, 18, 21, lite(colOf(eq.ring), .4));

  /* hero-level medals on the left chest (bronze 10, silver 25, gold 50, gem 75) */
  const hl = o.heroLvl || 1;
  if (hl >= 10) { const col = hl >= 75 ? '#8fe8ff' : hl >= 50 ? GOLD : hl >= 25 ? '#d8e0e8' : '#c58a5a'; px(g, 8, 18, col); px(g, 9, 18, col); px(g, 8, 19, lite(col, .4)); px(g, 9, 19, dark(col, .2)); }

  /* shield (left hand) */
  if (eq.shield) {
    const c = colOf(eq.shield), ti = tierOf(eq.shield), rim = dark(c, .4);
    rect(g, 1, 17, 5, 6, c); rect(g, 2, 23, 3, 1, c); px(g, 3, 24, rim); rect(g, 1, 17, 5, 1, rim); mrect(g, 1, 18, 1, 5, rim); rect(g, 5, 18, 1, 5, rim);
    rect(g, 1, 17, 1, 1, lite(c, .5)); px(g, 3, 20, ti >= 4 ? lite(c, .7) : lite(c, .45)); px(g, 2, 20, lite(c, .45)); px(g, 3, 19, lite(c, .45));
    if (ti >= 4) { px(g, 3, 22, GOLD); px(g, 3, 18, GOLD); }
  }

  /* weapon (right hand) */
  const w = eq.weapon;
  if (w) {
    const it = D.ITEMS[w] || {}, wt = (() => { if (it.style === 'ranged') return 'bow'; if (it.style === 'magic') return 'staff'; return it.wtype || (/dagger/.test(w) ? 'dagger' : /hammer/.test(w) ? 'hammer' : 'sword'); })();
    const c = colOf(w), hi = lite(c, .45), lo = dark(c, .3), wood = '#7a5230';
    if (wt === 'sword') { rect(g, 21, 7, 2, 12, c); rect(g, 21, 7, 1, 12, hi); px(g, 21, 6, hi); rect(g, 19, 19, 5, 1, GOLD_D); rect(g, 21, 20, 2, 3, wood); px(g, 21, 23, GOLD); }
    else if (wt === 'dagger') { rect(g, 21, 13, 2, 6, c); rect(g, 21, 13, 1, 6, hi); px(g, 21, 12, hi); rect(g, 20, 19, 4, 1, GOLD_D); rect(g, 21, 20, 2, 2, wood); }
    else if (wt === 'hammer') { rect(g, 21, 10, 2, 14, wood); rect(g, 19, 6, 5, 5, c); rect(g, 19, 6, 5, 1, hi); rect(g, 19, 10, 5, 1, lo); }
    else if (wt === 'bow') { const bw = wood; for (let y = 8; y <= 24; y++) { const d = Math.abs(y - 16); px(g, 21 + (d > 5 ? 0 : d > 2 ? 1 : 2), y, bw); } rect(g, 20, 8, 1, 17, '#e8e0c8'); px(g, 21, 16, hi); }
    else if (wt === 'staff') { rect(g, 21, 8, 2, 17, wood); rect(g, 21, 8, 1, 17, lite(wood, .3)); const oc = o.orb || lite(c, .2); rect(g, 20, 4, 4, 4, oc); rect(g, 20, 4, 2, 2, lite(oc, .6)); px(g, 23, 7, dark(oc, .4)); }
  }

  /* mastery glow: a few sparks around a master */
  if (o.aura) for (const [x, y] of [[2, 4], [21, 3], [1, 11], [22, 12], [3, 20], [20, 1]]) { px(g, x, y, '#fff0b0'); px(g, x - 1, y, GOLD); px(g, x + 1, y, GOLD); px(g, x, y - 1, GOLD); px(g, x, y + 1, GOLD); }
  return g;
}

/* a black outline around every painted pixel, then out to a canvas */
function toCanvas(g, scaleOut = 1) {
  const out = grid();
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    if (g[y][x]) out[y][x] = g[y][x];
    else if ((x > 0 && g[y][x - 1]) || (x < W - 1 && g[y][x + 1]) || (y > 0 && g[y - 1][x]) || (y < H - 1 && g[y + 1][x])) out[y][x] = K;
  }
  const cv = document.createElement('canvas'); cv.width = W * scaleOut; cv.height = H * scaleOut; const cx = cv.getContext('2d');
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (out[y][x]) { cx.fillStyle = out[y][x]; cx.fillRect(x * scaleOut, y * scaleOut, scaleOut, scaleOut); }
  return cv;
}

/* ---------- what the hero is wearing and what they have achieved ---------- */
DQ.heroLook = (look, S = DQ.S) => {
  const eq = Object.assign({}, S.equip), top = D.SKILLS.reduce((a, s) => (DQ.lvl(s.id) > a.l ? { id: s.id, l: DQ.lvl(s.id) } : a), { id: null, l: 0 });
  const capeLvl = top.l >= 99 ? 3 : top.l >= 60 ? 2 : top.l >= 30 ? 1 : 0;
  const spell = S.spell && D.SPELL_EL && D.DTYPES[D.SPELL_EL[S.spell]];
  return { eq, skin: look.skin, hair: look.hair, tunic: look.tunic, heroLvl: DQ.advLvl(), aura: DQ.masteryTotal ? DQ.masteryTotal() > 0 : false, orb: spell && spell.col,
    cape: capeLvl ? { col: D.SK[top.id].col, level: capeLvl } : null, topSkill: top };
};
const cache = new Map();
const key = o => JSON.stringify([o.eq, o.skin, o.hair, o.tunic, o.heroLvl >= 75 ? 75 : o.heroLvl >= 50 ? 50 : o.heroLvl >= 25 ? 25 : o.heroLvl >= 10 ? 10 : 0, o.aura, o.orb, o.cape]);
const hiFigure = o => DQ.hiRes ? DQ.hiRes(toCanvas(paint(o))) : toCanvas(paint(o));
DQ.heroCanvas = (look, scale = 1) => {
  const o = DQ.heroLook(look || DQ.S.look || {}), hi = hiFigure(o); if (!DQ.hiRes) return toCanvas(paint(o), scale);
  const cv = document.createElement('canvas'); cv.width = W * scale; cv.height = H * scale; const c = cv.getContext('2d'); c.imageSmoothingEnabled = false; c.drawImage(hi, 0, 0, cv.width, cv.height); return cv;
};
DQ.heroFigureUrl = look => { const o = DQ.heroLook(look || DQ.S.look || {}), k = 'f' + key(o); if (!cache.has(k)) cache.set(k, hiFigure(o).toDataURL()); return cache.get(k); };
/* the round portraits show the top of the figure: head, helm, shoulders, cape and chest medals */
DQ.heroBustUrl = look => {
  const o = DQ.heroLook(look || DQ.S.look || {}), k = 'b' + key(o);
  if (!cache.has(k)) { const full = hiFigure(o), f = full.width / W, cv = document.createElement('canvas'); cv.width = cv.height = 24 * f; cv.getContext('2d').drawImage(full, 0, 0, 24 * f, 24 * f, 0, f, 24 * f, 24 * f); cache.set(k, cv.toDataURL()); }
  return cache.get(k);
};
DQ.heroUrl = (look) => DQ.heroBustUrl(look);
DQ.heroGearKey = () => key(DQ.heroLook(DQ.S.look || {}));
})();
