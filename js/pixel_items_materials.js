/* Idlewick pixel art: tools, materials, crafted kit, relics, containers, boats and draughts redrawn in the chunky,
   outlined style the owner chose on 28 Nov 2026 (docs/pixel-art-style.md). 16 x 16 items, light from the top left,
   five-step ramps, sphere-lit round forms (ore lumps, gems, reels, bottles), solid two-pixel hafts and a coloured
   outline in each material's darkest step. Every drawing here is original and made in code.
   Wraps the item dispatch: anything drawn here wins, the rest falls through to the earlier files. */
(() => {
const DQ = window.DQ, D = DQ && DQ.data, A = DQ && DQ.pixelArt; if (!A || !A.itemSprite || !D) return;
const { Spr, ramp, mix, R, sphere } = A;
const rp = c => ramp(c || '#999999');
const metal = c => ramp(c, { gl: .78 });
const glass = c => ramp(c, { gl: .9, hi: .4 });
const WHITE = '#fffaf0', INK = '#2a1c1f';

/* ---------- small drawing helpers ---------- */
/* re-light every pixel of material r as a sphere over its own bounding box (lumps, nuggets, bottles) */
const orb = (s, r, o = {}) => { let x0 = 99, y0 = 99, x1 = -1, y1 = -1;
  for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) { const p = s.at(x, y); if (p && p.r === r && !p.fix) { x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y); } }
  if (x1 < 0) return; const cx = (x0 + x1 + 1) / 2 + (o.dx || 0), cy = (y0 + y1 + 1) / 2 + (o.dy || 0), rx = (x1 - x0 + 1) / 2, ry = (y1 - y0 + 1) / 2;
  for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) { const p = s.at(x, y); if (p && p.r === r && !p.fix) s.tone(x, y, r, sphere((x + .5 - cx) / rx, (y + .5 - cy) / ry)); } };
/* a solid two-pixel haft on a 45-degree diagonal, lit on its upper-left edge */
const haft = (s, x0, y0, x1, y1, w) => { s.line(x0, y0, x1, y1, w); s.line(x0 + 1, y0, x1 + 1, y1, w); };
/* paint hand-placed rows: a ramp is lit by the renderer, [ramp, step] fixes a step (0 out .. 4 glint), '#hex' a detail */
const paint = (s, rows, map, ox = 0, oy = 0) => rows.forEach((row, y) => [...row].forEach((ch, x) => { const v = map[ch]; if (!v) return;
  if (typeof v === 'string') s.fix(ox + x, oy + y, v); else if (Array.isArray(v)) s.tone(ox + x, oy + y, v[0], v[1]); else s.dot(ox + x, oy + y, v); }));
/* an annulus or arc of pixels around (cx, cy) between radii, optionally limited to an angle range (degrees, y up) */
const arc = (s, cx, cy, r0, r1, a0, a1, r, thick) => { for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) { const dx = x + .5 - cx, dy = cy - (y + .5), d = Math.hypot(dx, dy);
  let a = Math.atan2(dy, dx) * 180 / Math.PI; if (a < a0 - 180) a += 360; if (a > a0 + 360) a -= 360; if (a < a0 || a > a1) continue;
  const t = (a - a0) / (a1 - a0), half = thick ? thick(t) : (r1 - r0) / 2, mid = (r0 + r1) / 2; if (Math.abs(d - mid) <= half) s.dot(x, y, r); } };

/* ---------- tools: ten tiers per family, each its own metal and its own small detail ----------
   copper (verdigris), bronze (a rivet), iron (a socket collar), silver (collar and an engraved line), steel (a leather
   grip), gold (grip and a pommel cap), mithril (a set stone), adamant (a heavier head), obsidian (knapped glass edge,
   black haft), runic (glowing runes). Each family keeps one silhouette so a tier reads as an upgrade of the same tool. */
const TIER = [
  { key: 'copper', wood: '#c39060', grip: null }, { key: 'bronze', wood: '#a8703f', grip: null }, { key: 'iron', wood: '#8f5c36', grip: null },
  { key: 'silver', wood: '#9a6648', grip: null }, { key: 'steel', wood: '#7a5036', grip: '#6a3c24' }, { key: 'gold', wood: '#7a3a28', grip: '#8a2a2a' },
  { key: 'mithril', wood: '#5e4636', grip: '#2a4a8a', stone: '#9ad0ff' }, { key: 'adamant', wood: '#4e3a2a', grip: '#2a5a34', stone: '#c8ff9a' },
  { key: 'obsidian', wood: '#2e2632', grip: '#4a2a6a', glint: '#d8b8ff' }, { key: 'runic', wood: '#2a3442', grip: '#1a4a5a', rune: '#e8ffff' }];
const tierOf = it => Math.max(0, (D.TOOL_ORDER || [.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5]).indexOf(it.tier));
/* each family is one hand-placed silhouette (m metal, e the darker eye or socket, w the haft); the tiers add their
   detail on top at fixed points */
const PICK = [
  '................',
  '.....mmmmm......',
  '...mmmmmmmmm....',
  '..mmmm.ee.mmmm..',
  '.mmm...ee...mmm.',
  '.mm....ww....mm.',
  '.m....ww......m.',
  '.m....ww......m.',
  '.....ww.........',
  '.....ww.........',
  '....ww..........',
  '....ww..........',
  '...ww...........',
  '...ww...........',
  '..ww............',
  '..w.............'];
const AXE = [
  '.mm.....ww......',
  '.mmm....ee......',
  '.mmmm..mee.m....',
  '.mmmmmmmeemm....',
  '.mmmmmmmeem.....',
  '.mmmm...ww......',
  '.mmm....ww......',
  '.mm....ww.......',
  '.......ww.......',
  '......ww........',
  '......ww........',
  '.....ww.........',
  '.....ww.........',
  '....ww..........',
  '....ww..........',
  '....w...........'];
const HOE = [
  '................',
  '..........eemm..',
  '.........weemmm.',
  '.........ww.mmm.',
  '........ww..mmm.',
  '........ww..mmm.',
  '.......ww...mmmm',
  '.......ww....mmm',
  '......ww........',
  '......ww........',
  '.....ww.........',
  '.....ww.........',
  '....ww..........',
  '....ww..........',
  '...ww...........',
  '...w............'];
/* wrap from steel up and a pommel cap from gold up, at the haft's foot (gx, gy: the lowest full row of the haft) */
const footTrim = (s, t, m, gx, gy) => { const T = TIER[t];
  if (T.grip) { const g = rp(T.grip); for (let i = 0; i < 4; i++) { const x = gx + Math.floor(i / 2), y = gy - i; s.dot(x, y, g); s.dot(x + 1, y, g); if (i % 2) { s.tone(x, y, g, 3); s.tone(x + 1, y, g, 1); } } }
  if (t >= 5) { s.dot(gx - 1, gy + 1, m); s.dot(gx, gy + 1, m); s.tone(gx - 1, gy + 1, m, 3); }
  if (t === 9) s.fix(gx, gy + 1, TIER[9].rune); };
const eyeOf = (c, t) => rp(mix(c, '#1a1838', t >= 2 ? .5 : .35));
const VERD = '#5fc8a0', RIVET = '#f6d47a';
function pickaxe(s, it) {
  const t = tierOf(it), T = TIER[t], m = metal(it.col);
  paint(s, PICK, { m, e: eyeOf(it.col, t), w: rp(T.wood) });
  if (t >= 7) { s.dot(5, 0, m); s.dot(6, 0, m); s.dot(7, 0, m); s.dot(8, 0, m); s.dot(1, 8, m); s.dot(14, 8, m); }      /* adamant up: a heavier head */
  if (t >= 2) { s.dot(6, 3, eyeOf(it.col, t)); s.dot(9, 3, eyeOf(it.col, t)); }                                         /* a collar round the eye */
  if (t === 0) { s.fix(3, 3, VERD); s.fix(12, 4, VERD); s.fix(9, 2, VERD); }
  if (t === 1) { s.fix(4, 3, RIVET); s.fix(11, 3, RIVET); }
  if (t === 3) { s.line(3, 4, 4, 3, null, m.lo); s.line(11, 3, 12, 4, null, m.lo); s.fix(7, 1, WHITE); }
  if (t === 6) { s.fix(7, 2, T.stone); s.fix(8, 2, mix(T.stone, '#1a1838', .35)); }
  if (t === 7) { s.fix(7, 1, T.stone); }
  if (t === 8) for (const [x, y] of [[1, 6], [1, 7], [14, 6], [14, 7], [4, 2]]) s.fix(x, y, T.glint);
  if (t === 9) for (const [x, y] of [[4, 3], [7, 2], [11, 3]]) s.fix(x, y, T.rune);
  footTrim(s, t, m, 3, 13);
}
function axe(s, it) {
  const t = tierOf(it), T = TIER[t], m = metal(it.col);
  paint(s, AXE, { m, e: eyeOf(it.col, t), w: rp(T.wood) });
  for (let y = 0; y <= 7; y++) s.tone(1, y, m, y > 5 ? 3 : 4); s.tone(2, 0, m, 4);                                  /* the honed edge */                           /* the honed edge */
  if (t >= 7) { for (let y = 1; y <= 6; y++) { s.dot(0, y, m); s.tone(0, y, m, 4); } s.dot(1, 8, m); s.dot(12, 3, m); s.dot(11, 4, m); s.dot(3, 1, m); }
  if (t >= 2) { s.dot(7, 3, eyeOf(it.col, t)); s.dot(7, 4, eyeOf(it.col, t)); }
  if (t === 0) { s.fix(3, 3, VERD); s.fix(2, 5, VERD); s.fix(11, 2, VERD); }
  if (t === 1) s.fix(5, 3, RIVET);
  if (t === 3) { s.line(3, 3, 5, 3, null, m.lo); s.fix(4, 5, m.lo); }
  if (t === 6) { s.fix(5, 3, T.stone); s.fix(5, 4, mix(T.stone, '#1a1838', .35)); }
  if (t === 7) s.fix(5, 3, T.stone);
  if (t === 8) for (const [x, y] of [[0, 3], [1, 2], [2, 1], [1, 5]]) s.fix(x, y, T.glint);
  if (t === 9) for (const [x, y] of [[3, 3], [5, 4], [4, 2], [11, 3]]) s.fix(x, y, T.rune);
  footTrim(s, t, m, 5, 13);
}
function hoe(s, it) {
  const t = tierOf(it), T = TIER[t], m = metal(it.col);
  paint(s, HOE, { m, e: eyeOf(it.col, t), w: rp(T.wood) });
  s.tone(13, 7, m, 4); s.tone(14, 7, m, 4); s.tone(15, 7, m, 3); s.tone(12, 6, m, 3);                                  /* the scraping edge */
  if (t >= 7) { s.dot(12, 2, m); s.dot(12, 7, m); s.dot(13, 8, m); s.dot(14, 8, m); s.dot(15, 8, m); s.tone(13, 8, m, 4); s.tone(14, 8, m, 4); }
  if (t >= 2) s.dot(12, 1, eyeOf(it.col, t));
  if (t === 0) { s.fix(14, 3, VERD); s.fix(13, 5, VERD); }
  if (t === 1) s.fix(13, 3, RIVET);
  if (t === 3) s.line(13, 3, 13, 5, null, m.lo);
  if (t === 6) { s.fix(14, 4, T.stone); s.fix(14, 5, mix(T.stone, '#1a1838', .35)); }
  if (t === 7) s.fix(14, 4, T.stone);
  if (t === 8) for (const [x, y] of [[15, 6], [15, 2], [12, 7]]) s.fix(x, y, T.glint);
  if (t === 9) for (const [x, y] of [[13, 3], [14, 5], [13, 6]]) s.fix(x, y, T.rune);
  footTrim(s, t, m, 4, 13);
}
function rod(s, it) {
  const t = tierOf(it), T = TIER[t], m = metal(it.col), w = rp(T.wood), cork = rp(t >= 4 ? T.grip : '#c8a070');
  /* a long rod: a thick cork butt, a tapering blank, guides, a reel under the grip and the line down to a float */
  haft(s, 1, 14, 5, 10, cork); s.line(6, 9, 11, 4, w); s.line(7, 9, 11, 5, w); s.line(12, 3, 13, 2, w);
  for (const [x, y] of [[9, 6], [11, 4]]) s.fix(x + 1, y + 1, m.base);                                          /* guides */
  s.ell(4, 12.5, 2.2, 2.2, m); s.fix(4, 12, mix(it.col, '#1a1838', .55)); s.fix(3, 11, m.gl);                  /* the reel */
  if (t >= 2) { s.dot(6, 9, m); s.dot(7, 8, m); }                                                               /* a ferrule */
  s.line(14, 2, 14, 9, null, '#e8e0cc');
  const fl = t >= 8 ? rp(t === 9 ? '#46c8d8' : '#8a5ad8') : rp(t >= 5 ? '#f0c75a' : '#d8443a');
  s.dot(14, 10, fl); s.dot(13, 11, fl); s.dot(14, 11, fl); s.dot(14, 12, fl); s.dot(13, 12, fl); s.tone(14, 10, fl, 3); s.fix(13, 12, WHITE); s.fix(14, 13, '#e8e0cc');
  if (t === 0) s.fix(5, 13, VERD);
  if (t === 1) s.fix(9, 6, RIVET);
  if (t === 3) s.fix(11, 4, WHITE);
  if (t === 4) { s.fix(14, 6, m.hi); s.fix(14, 7, m.lo); }                                                      /* a split-shot sinker on the line */
  if (t === 6) s.fix(5, 13, T.stone);
  if (t === 7) { s.dot(2, 12, m); s.fix(2, 12, T.stone); }
  if (t === 8) for (const [x, y] of [[10, 5], [12, 3]]) s.fix(x, y, T.glint);
  if (t === 9) for (const [x, y] of [[9, 6], [12, 3], [5, 13]]) s.fix(x, y, T.rune);
  if (t >= 5) { s.dot(0, 15, m); s.dot(1, 15, m); }
}
/* a fitted thief's glove, fingers apart, with its pair's fingertips peeping from behind; the cuff is the tier's metal */
const GLOVE = [
  '.......f.f.f....',
  '.....b.f.f.f....',
  '.....bfffffff...',
  '.....bfffffff...',
  '.....bfffffff...',
  '....tbfffffff...',
  '...ttbfffffff...',
  '...tt.fffffff...',
  '....ttfffffff...',
  '.....tffffff....',
  '......ffffff....',
  '......cccccc....',
  '......cccccc....',
  '......cccccc....',
  '................'];
function gloves(s, it) {
  const t = tierOf(it), T = TIER[t], m = metal(it.col), lc = t >= 8 ? '#3e3240' : t >= 6 ? '#54402e' : t >= 4 ? '#6e4a34' : '#9a6a42';
  const l = rp(lc), back = rp(mix(lc, '#1a1838', .35));
  paint(s, GLOVE, { f: l, t: l, b: back, c: m }, 0, 1);
  for (const x of [8, 10]) for (let y = 1; y <= 4; y++) s.tone(x, y + 1, l, 1);                                  /* the gaps between fingers */
  s.tone(6, 12, m, 4); s.line(7, 13, 11, 13, null, m.hi);
  if (t >= 2) { s.tone(9, 9, m, 3); s.tone(10, 9, m, 3); }                                                       /* a stud on the back of the hand */
  if (t >= 4) for (const x of [7, 9, 11]) s.tone(x, 5, m, x === 7 ? 4 : 3);                                       /* knuckle plates */
  if (t >= 7) for (const x of [7, 9, 11]) s.tone(x, 1, m, 3);                                                     /* tipped fingers */
  if (t === 0) { s.fix(8, 13, VERD); s.fix(10, 14, VERD); }
  if (t === 1) { s.fix(7, 13, RIVET); s.fix(10, 13, RIVET); }
  if (t === 3) { s.fix(8, 8, WHITE); s.fix(10, 8, WHITE); s.fix(9, 7, WHITE); }                               /* silver thread on the back */
  if (t === 5) s.fix(9, 12, RIVET);
  if (t === 6) { s.fix(9, 12, T.stone); s.fix(9, 13, mix(T.stone, '#1a1838', .35)); }
  if (t === 8) for (const [x, y] of [[7, 1], [11, 1], [12, 6]]) s.fix(x, y, T.glint);
  if (t === 9) for (const [x, y] of [[7, 12], [9, 13], [11, 12], [9, 9]]) s.fix(x, y, T.rune);
}

/* ---------- the other kept tools ---------- */
function handsaw(s) {
  const m = metal('#c08a4a'), w = rp('#9a6a3e');
  paint(s, [
    '..........hhhh..',
    '.bbbbbbbbbhh.hh.',
    '.bbbbbbbbbh...h.',
    '..bbbbbbbbh...h.',
    '...bbbbbbbhh.hh.',
    '....bbbbbb.hhh..',
    '....b.b.b.b.....'], { b: m, h: w }, 0, 4);                                                                  /* a toothed blade and an open handle */
  s.line(2, 5, 9, 5, null, m.gl); s.fix(11, 6, '#f6d47a'); s.fix(11, 8, '#f6d47a'); s.fix(5, 7, m.lo); s.fix(8, 7, m.lo);
}
function surveyFrame(s, it) {
  const w = rp(it.col), b = metal('#e6b84a'), g = glass('#9ad0e8');
  haft(s, 2, 14, 6, 8, w); s.line(13, 14, 9, 8, w); s.line(14, 14, 10, 8, w); s.line(8, 9, 8, 14, w);           /* tripod */
  s.rect(4, 5, 9, 3, b); s.ell(8, 6, 2, 2, g); s.fix(7, 5, WHITE);                                             /* sighting bar and lens */
  s.rect(12, 4, 2, 2, b); s.rect(3, 4, 2, 2, b);
  for (const x of [5, 10]) s.fix(x, 8, w.lo);
}
function trainingFrame(s, it) {
  const w = rp(it.col), st = rp('#c8a868'), red = rp('#c8483c');
  s.rect(2, 1, 2, 14, w); s.rect(12, 1, 2, 14, w); s.rect(2, 1, 12, 2, w);                                     /* posts and crossbar */
  s.line(8, 3, 8, 5, null, '#e8dcc0');
  s.ell(8, 9.5, 3.6, 3.6, st, { flat: true }); s.ell(8, 9.5, 2, 2, red, { flat: true }); s.fix(8, 9, '#f4ecd8');  /* a straw target */
  s.fix(6, 7, st.gl); s.rect(1, 14, 4, 1, w); s.rect(11, 14, 4, 1, w);
}
function irrigationFrame(s, it) {
  const w = rp('#9a5a3a'), wa = glass(it.col), m = metal('#9aa3ad');
  s.rect(1, 9, 14, 4, w); s.rect(2, 10, 12, 2, wa); s.tone(2, 10, wa, 4); s.tone(3, 10, wa, 3);                 /* a trough of water */
  s.rect(10, 2, 2, 7, m); s.rect(6, 2, 6, 2, m); s.rect(6, 4, 2, 2, m);                                         /* pump and spout */
  s.line(12, 3, 14, 1, null, m.hi);
  for (const [x, y] of [[7, 7], [6, 8], [3, 14], [8, 14], [12, 14]]) s.fix(x, y, wa.hi);
  for (const x of [2, 13]) { s.dot(x, 13, w); s.dot(x, 14, w); }
}
function workshopJig(s, it) {
  const w = rp(it.col), m = metal('#9aa3ad');
  s.rect(1, 9, 14, 3, w); s.rect(2, 12, 2, 3, w); s.rect(12, 12, 2, 3, w);                                     /* bench */
  s.rect(4, 4, 3, 5, m); s.rect(9, 4, 3, 5, m); s.rect(7, 6, 2, 2, rp('#8a6a42'));                              /* vice jaws holding a block */
  s.line(12, 5, 15, 5, m); s.ell(15, 5, 1, 1.4, m); s.line(1, 6, 4, 6, null, m.lo);
  s.fix(6, 3, '#c8b8ff'); s.fix(10, 10, w.gl);
}
/* field charts: a rolled survey map, each town's own mark drawn on it */
const CHART_MARK = {
  willowbrook: s => { const g = rp('#5f9a45'); s.ell(8, 8, 2.4, 2, g); s.line(8, 10, 8, 11, null, '#7a5236'); },
  mossbarrow: s => { const y = rp('#d9b45a'); for (const x of [6, 8, 10]) { s.line(x, 11, x, 7, null, '#8a7a3a'); s.dot(x, 6, y); s.dot(x, 7, y); } },
  saltmere: s => { for (const y of [7, 10]) for (let x = 5; x <= 11; x++) s.fix(x, y + (x % 2), '#3a7ac0'); },
  ironpeak: s => { s.poly([[4, 11], [8, 5], [12, 11]], rp('#8a8f98')); s.fix(8, 6, WHITE); s.fix(7, 7, WHITE); },
  gloomfen: s => { for (const x of [6, 8, 10]) s.line(x, 11, x - 1 + (x % 3), 6, null, '#4a7a5a'); s.fix(8, 5, '#6a5a3a'); s.fix(6, 6, '#6a5a3a'); },
  emberfall: s => { s.poly([[4, 11], [7, 7], [9, 7], [12, 11]], rp('#5a4a44')); s.fix(8, 6, '#ff8a3a'); s.fix(7, 5, '#ffd04a'); s.fix(9, 5, '#ff8a3a'); },
  skyreach: s => { const c = rp('#e8f0f8'); s.ell(7, 8, 2, 1.4, c, { flat: true }); s.ell(10, 9, 2, 1.4, c, { flat: true }); s.fix(9, 6, '#9fd8ff'); },
  hollow: s => { const g = rp('#8a8a9a'); s.rect(6, 7, 2, 4, g); s.rect(5, 8, 4, 1, g); s.rect(10, 8, 2, 3, g); s.fix(10, 7, '#8a5ad8'); }
};
function chart(s, it, town) {
  const p = rp('#e0c890'), rl = rp('#c8a868'), band = rp(it.col);
  s.rect(2, 3, 12, 10, p); s.rect(1, 2, 2, 12, rl); s.rect(13, 2, 2, 12, rl);                                    /* sheet and two rolled ends */
  s.tone(1, 2, rl, 4); s.tone(13, 2, rl, 4); s.line(3, 3, 12, 3, null, p.gl);
  s.rect(1, 7, 2, 2, band); s.rect(13, 7, 2, 2, band);                                                          /* the town's ribbon */
  for (const [x, y] of [[4, 12], [6, 11], [10, 4], [12, 5]]) s.fix(x, y, p.lo);
  (CHART_MARK[town] || CHART_MARK.willowbrook)(s);
  s.fix(11, 11, '#c8483c'); s.fix(12, 12, '#c8483c');
}

/* ---------- logs: a chunky round log with its end grain to the front, each wood with its own bark, cut and mark ---------- */
const LOG = {
  normal: { bark: '#7a5236', end: '#d0a060', kind: 'pair' },
  oak: { bark: '#6a4630', end: '#d8a868', kind: 'thick', knot: true },
  willow: { bark: '#7a7a54', end: '#e0d098', kind: 'slim', moss: '#8ab05a', twig: '#9db86a' },
  maple: { bark: '#8a4a32', end: '#e8a878', leaf: '#e0603a' },
  yew: { bark: '#4a3a30', end: '#d87850', sprig: '#3f8a4a' },
  magic: { bark: '#4a3a7a', end: '#c8b0ff', glow: '#f0e4ff' },
  birch: { bark: '#ece6d4', end: '#ecc890', kind: 'slim', marks: '#3a3638' },
  elder: { bark: '#98a884', end: '#f4ecc8', stub: true },
  gloomwood: { bark: '#3e2e52', end: '#8a6aaa', kind: 'twist', glow: '#c89aff' },
  hazel: { bark: '#8a6a44', end: '#dcc08a', kind: 'bundle' },
  ash: { bark: '#a8a090', end: '#f0e4c4', kind: 'split' },
  palm: { bark: '#a88a58', end: '#ecd8a8', kind: 'palm', frond: '#6aa04a' },
  cedar: { bark: '#8a4a30', end: '#e09060', resin: '#f6b840' },
  pine: { bark: '#6a4a30', end: '#e0b878', cone: '#8a5a30' },
  mangrove: { bark: '#5a4030', end: '#c09060', kind: 'roots' },
  cinderbark: { bark: '#2e2424', end: '#f06a3a', embers: '#ffc04a' },
  windpine: { bark: '#8a98a8', end: '#eef4fa', swirl: '#ffffff' },
  wraithbark: { bark: '#b4b4c8', end: '#f4f4ff', kind: 'slim', wisp: '#e8f0ff' }
};
/* one log: (ax, ay) the centre of the end grain, (bx, by) the far end, h its radius */
function logAt(s, ax, ay, bx, by, h, bark, end, o = {}) {
  const L = Math.hypot(bx - ax, by - ay), nx = -(by - ay) / L, ny = (bx - ax) / L;
  s.poly([[ax + nx * h, ay + ny * h], [bx + nx * h, by + ny * h], [bx - nx * h, by - ny * h], [ax - nx * h, ay - ny * h]], bark);
  s.ell(bx, by, h - .2, h - .2, bark, { flat: true });
  for (const [k, t0, t1] of [[0, .3, .8], [h * .55, .5, .7], [-h * .5, .45, .6]]) /* bark furrows along the log */
    s.line(Math.round(ax + (bx - ax) * t0 + nx * k), Math.round(ay + (by - ay) * t0 + ny * k), Math.round(ax + (bx - ax) * t1 + nx * k), Math.round(ay + (by - ay) * t1 + ny * k), null, bark.lo);
  if (h >= 1.6) { s.ell(ax, ay, h * .95, h + .1, end);                                                           /* the end grain, lit as a rounded face */
    const rc = h >= 2.6 ? 1.6 : 1; for (let a = 0; a < 24; a++) { const x = Math.round(ax + Math.cos(a / 12 * Math.PI) * rc), y = Math.round(ay + Math.sin(a / 12 * Math.PI) * rc); if (x !== Math.round(ax) || y !== Math.round(ay)) s.fix(x, y, end.lo); }
    s.fix(Math.round(ax), Math.round(ay), end.out); }
  else { s.dot(Math.round(ax), Math.round(ay), end); s.tone(Math.round(ax), Math.round(ay), end, 3); }
  if (o.lit !== false) s.fix(Math.round(bx), Math.round(by - h + 1), bark.gl);
}
function logSprite(s, w) {
  const b = rp(w.bark), e = ramp(w.end, { lo: .3 }), k = w.kind;
  if (k === 'pair') { logAt(s, 3.5, 12.5, 10.5, 7.5, 2.4, b, e); logAt(s, 6.5, 7.5, 12.5, 3.5, 2.4, b, e); }
  else if (k === 'thick') logAt(s, 4.5, 10.5, 11, 5, 3.4, b, e);
  else if (k === 'slim') logAt(s, 3.5, 11.5, 12.5, 4.5, 2.2, b, e);
  else if (k === 'bundle') { /* three straight hazel rods, tied */
    [[2, 9, .3], [3, 12, .15], [5, 14, 0]].forEach(([x, y, dk]) => { const r = dk ? rp(mix(w.bark, '#1a1838', dk)) : b; haft(s, x, y, x + 8, y - 8, r); s.dot(x, y, e); s.tone(x, y, e, 3); s.tone(x + 8, y - 8, r, 4); });
    const st = rp('#d8c090'); s.line(6, 11, 9, 8, st); s.line(7, 11, 10, 8, st); s.tone(6, 11, st, 4); }
  else if (k === 'split') { /* a half-round billet: the bark back and the pale split face */
    s.poly([[2, 11], [10, 3], [14, 6], [6, 14]], b); s.poly([[3, 11], [10, 4], [12, 6], [5, 13]], e); for (let i = 0; i < 4; i++) s.line(4 + i * 2, 11 - i * 2, 6 + i * 2, 12 - i * 2, null, e.lo); s.fix(9, 5, e.gl); }
  else if (k === 'twist') { for (let i = 0; i <= 10; i++) { const x = 3 + i, y = 11 - i * .7 + Math.round(Math.sin(i * .9) * 1.2); s.ell(x, y, 1.6, 1.6, b); } logAt(s, 3.5, 11.5, 4, 11, 1.8, b, e, { lit: false }); }
  else if (k === 'palm') { logAt(s, 4.5, 10.5, 11.5, 4.5, 2.6, b, e); for (let i = 0; i < 4; i++) { const x = 6 + i * 1.6, y = 9.5 - i * 1.4; s.line(Math.round(x - 1.6), Math.round(y - 2), Math.round(x + 1.6), Math.round(y + 2), null, b.lo); } }
  else if (k === 'roots') { logAt(s, 5.5, 9.5, 12, 4, 2.6, b, e); const r = rp(mix(w.bark, '#1a1838', .1)); s.line(5, 12, 3, 15, r); s.line(7, 12, 7, 15, r); s.line(4, 11, 1, 13, r); s.line(8, 11, 10, 14, r); }
  else logAt(s, 4.5, 10.5, 11.5, 4.5, 2.8, b, e);
  if (w.knot) { s.ell(10, 7, 1.2, 1.2, rp(mix(w.bark, '#1a1838', .2)), { flat: true }); s.fix(10, 7, b.out); }
  if (w.moss) for (const [x, y] of [[8, 5], [9, 5], [10, 4], [6, 7]]) s.fix(x, y, w.moss);
  if (w.twig) { s.line(10, 8, 13, 11, rp(w.twig)); s.fix(13, 12, w.twig); }
  if (w.leaf) { const l = rp(w.leaf); s.poly([[11, 14], [12, 10], [14, 11], [15, 13], [13, 15]], l); s.fix(12, 12, l.lo); s.line(10, 15, 12, 13, null, '#7a3a2a'); }
  if (w.sprig) { const g = rp(w.sprig); s.line(10, 9, 14, 12, g); for (const [x, y] of [[11, 11], [12, 12], [13, 10], [12, 9]]) s.dot(x, y, g); s.fix(14, 13, '#e04a3a'); }
  if (w.glow) for (const [x, y] of [[7, 7], [10, 5], [13, 2], [12, 8]]) s.fix(x, y, w.glow);
  if (w.marks) for (const [x, y] of [[6, 8], [7, 8], [9, 6], [11, 5], [12, 5], [8, 9]]) s.fix(x, y, w.marks);
  if (w.stub) { s.line(9, 8, 11, 11, b); s.line(10, 8, 12, 11, b); s.fix(12, 12, e.base); }
  if (w.frond) { const f = rp(w.frond); s.poly([[11, 3], [15, 1], [14, 4]], f); s.poly([[12, 3], [15, 6], [12, 5]], f); }
  if (w.resin) for (const [x, y] of [[8, 6], [10, 8], [11, 4]]) { s.fix(x, y, w.resin); s.fix(x, y + 1, mix(w.resin, '#8a4a1a', .4)); }
  if (w.cone) { const c = rp(w.cone); s.ell(12.5, 11.5, 2, 2.6, c); for (const [x, y] of [[12, 10], [13, 12], [12, 13]]) s.fix(x, y, c.lo); s.fix(11, 10, c.gl); }
  if (w.embers) for (const [x, y] of [[6, 8], [8, 6], [10, 6], [9, 8], [12, 4]]) s.fix(x, y, w.embers);
  if (w.swirl) for (const [x, y] of [[6, 8], [7, 7], [9, 6], [10, 6], [11, 5]]) s.fix(x, y, w.swirl);
  if (w.wisp) { s.line(11, 2, 13, 0, null, w.wisp); s.line(14, 3, 15, 1, null, w.wisp); s.fix(9, 3, w.wisp); }
}

/* ---------- ore: a sphere-lit lump of its own rock, the ore showing in its own way ---------- */
const ORE = {
  copper:    { col: '#e8782e', rock: '#7e6c5e', style: 'veins', extra: '#4fc8a8', lump: 0 },
  tin:       { col: '#e2e6ea', rock: '#9a8466', style: 'nodules', lump: 1 },
  iron:      { col: '#c0482c', rock: '#5c5856', style: 'streaks', lump: 2 },
  coal:      { col: '#3a3438', rock: '#3a3438', style: 'coal', lump: 0 },
  gold:      { col: '#f6cc4a', rock: '#7a6a5e', style: 'nugget', lump: 1 },
  silver:    { col: '#f6faff', rock: '#4c5870', style: 'branch', lump: 2 },
  mithril:   { col: '#4c72f8', rock: '#808696', style: 'blobs', extra: '#ffffff', lump: 0 },
  adamant:   { col: '#2cc464', rock: '#56665a', style: 'crystal', lump: 1 },
  runite:    { col: '#18d6ee', rock: '#3e4e5c', style: 'cluster', extra: '#e8ffff', lump: 2 },
  astralite: { col: '#efe2ff', rock: '#2c2848', style: 'stars', extra: '#b89aff', lump: 0 },
  voidstone: { col: '#a83cff', rock: '#241c2e', style: 'shards', extra: '#ff6ad8', lump: 1 },
  flint:     { col: '#5a5a62', rock: '#c0b6a0', style: 'chips', extra: '#f0f0ea', lump: 2 },
  quartz:    { col: '#f4f8ff', rock: '#7a7a84', style: 'prism', lump: 0 },
  amber:     { col: '#f0a030', rock: '#6a5040', style: 'drops', extra: '#5a3a1a', lump: 1 },
  jet:       { col: '#22222e', rock: '#7a7468', style: 'glossy', extra: '#c8d0e0', lump: 2 },
  jade:      { col: '#5ab87a', rock: '#8a8a78', style: 'banded', extra: '#d0f4d8', lump: 0 },
  bloodstone: { col: '#3a7a4a', rock: '#5a5a54', style: 'speckle', extra: '#e83a3a', lump: 1 },
  moonstone: { col: '#dce4ff', rock: '#4a4a62', style: 'sheen', extra: '#9ab8ff', lump: 2 },
  bogiron:   { col: '#b0602a', rock: '#4a4234', style: 'crust', extra: '#e0a868', lump: 0 },
  obsidian:  { col: '#2a2040', rock: '#6a5a50', style: 'glass', extra: '#b898ff', lump: 1 },
  skyglass:  { col: '#c4ecff', rock: '#8aa0b8', style: 'feather', extra: '#ffffff', lump: 2 },
  nullite:   { col: '#5a3a8a', rock: '#2e2834', style: 'rings', extra: '#0c0812', lump: 0 }
};
const LUMP = [[[2, 13], [2, 8], [5, 4], [10, 3], [14, 6], [14, 12], [11, 14], [5, 14]], [[1, 12], [3, 6], [7, 3], [12, 4], [14, 9], [13, 13], [7, 14]],
  [[2, 11], [4, 5], [9, 2], [13, 4], [14, 10], [10, 14], [4, 14]]];
/* a small sphere-lit nugget of ore (2-3 px), the commonest way ore shows */
const nug = (s, x, y, r, big) => { s.dot(x, y, r); s.dot(x + 1, y, r); s.dot(x, y + 1, r); s.dot(x + 1, y + 1, r); if (big) { s.dot(x + 2, y, r); s.dot(x + 1, y - 1, r); s.dot(x + 2, y + 1, r); }
  s.tone(x, y, r, 4); s.tone(x + 1, y, r, 3); s.tone(x, y + 1, r, 3); s.tone(x + 1, y + 1, r, 1); if (big) { s.tone(x + 1, y - 1, r, 4); s.tone(x + 2, y, r, 2); s.tone(x + 2, y + 1, r, 1); } };
function oreSprite(s, kind) {
  const o = ORE[kind] || ORE.copper, m = ramp(o.col, { gl: .82 }), rock = rp(o.rock);
  if (o.style === 'coal') { const c = ramp('#3e3a46', { hi: .5, gl: .82 }); s.poly([[2, 13], [3, 8], [7, 5], [9, 7], [12, 5], [14, 9], [13, 13], [8, 14]], c); orb(s, c);
    for (const [x, y] of [[5, 8], [10, 7], [7, 11], [11, 11]]) { s.fix(x, y, '#b8b8c8'); } s.line(6, 9, 8, 13, null, c.out); s.line(9, 8, 12, 12, null, c.lo); return; }
  if (o.style === 'nugget') { s.poly([[3, 12], [3, 8], [6, 5], [9, 6], [11, 4], [14, 7], [13, 12], [9, 14], [5, 14]], m); orb(s, m);
    for (const [x, y] of [[6, 10], [10, 8], [9, 12]]) s.fix(x, y, m.lo); s.fix(5, 7, '#ffffff'); s.fix(11, 6, m.gl); return; }
  s.poly(LUMP[o.lump], rock); orb(s, rock);
  s.line(5, 13, 7, 9, null, rock.lo); s.line(11, 13, 12, 10, null, rock.lo);                                    /* cracks */
  switch (o.style) {
    case 'veins': for (const [a, b2, c2, d] of [[3, 11, 12, 5], [5, 13, 13, 8]]) { s.line(a, b2, c2, d, m); s.line(a, b2 + 1, c2, d + 1, m); } s.tone(6, 9, m, 4); s.tone(9, 7, m, 4); s.tone(10, 10, m, 4); for (const [x, y] of [[4, 6], [12, 12], [8, 5]]) s.fix(x, y, o.extra); break;
    case 'nodules': for (const [x, y] of [[4, 7], [9, 5], [10, 10], [5, 11]]) nug(s, x, y, m); break;
    case 'streaks': for (const [a, b2, c2, d] of [[4, 6], [8, 4], [11, 6]].map(([x, y]) => [x, y, x + 2, y + 7])) { s.line(a, b2, c2, d, m); s.line(a + 1, b2, c2 + 1, d, m); } break;
    case 'branch': s.line(4, 12, 8, 7, m); s.line(5, 12, 9, 7, m); s.line(9, 7, 12, 4, m); s.line(9, 7, 13, 10, m); s.line(6, 10, 4, 6, m); for (const [x, y] of [[12, 4], [9, 7], [4, 6]]) s.fix(x, y, '#ffffff'); break;
    case 'blobs': nug(s, 4, 6, m, true); nug(s, 9, 9, m, true); nug(s, 10, 4, m); for (const [x, y] of [[5, 5], [10, 8]]) s.fix(x, y, o.extra); break;
    case 'crystal': for (const [x, y, h] of [[4, 11, 5], [7, 11, 8], [11, 11, 6]]) { s.poly([[x - 1, y + 1], [x, y + 1 - h], [x + 2, y + 1 - h + 1], [x + 2, y + 1]], m); s.line(x, y - h + 2, x, y, null, m.gl); } break;
    case 'cluster': for (const [x, y, h, l] of [[7, 11, 8, 0], [4, 12, 5, -1], [11, 12, 6, 1]]) { s.poly([[x - 1, y], [x + l, y - h], [x + 1 + l, y - h], [x + 2, y]], m); s.line(x + l, y - h + 1, x, y - 1, null, m.gl); s.fix(x + l, y - h, o.extra); } break;
    case 'stars': for (const [x, y, c] of [[5, 7, o.col], [10, 6, o.extra], [8, 11, o.col], [12, 10, o.extra]]) { s.fix(x, y, '#ffffff'); s.fix(x - 1, y, c); s.fix(x + 1, y, c); s.fix(x, y - 1, c); s.fix(x, y + 1, c); } s.fix(4, 11, o.extra); s.fix(11, 3, o.col); break;
    case 'chips': for (const [x, y] of [[4, 7], [9, 5], [10, 10], [5, 11]]) { s.poly([[x - 1, y + 2], [x + 1, y - 1], [x + 3, y + 2]], m); s.fix(x + 1, y, o.extra); } break;
    case 'prism': for (const [x, y, h] of [[4, 12, 6], [7, 12, 9], [11, 12, 5]]) { s.rect(x, y - h, 2, h, m); s.dot(x + 1, y - h - 1, m); s.tone(x, y - h, m, 4); s.line(x, y - h + 1, x, y - 1, null, m.hi); } break;
    case 'drops': for (const [x, y, r] of [[5.5, 7.5, 2], [10, 10, 2.4], [10.5, 5, 1.5]]) s.ell(x, y, r, r, m); s.fix(10, 10, o.extra); s.fix(5, 6, '#fff2c0'); s.fix(9, 9, '#fff2c0'); break;
    case 'glossy': for (const [x, y, a, b2] of [[6, 7, 2.6, 1.8], [10, 11, 2.6, 1.8]]) { s.ell(x, y, a, b2, m); s.fix(x - 1, y - 1, o.extra); s.fix(x, y - 1, o.extra); } break;
    case 'banded': for (const [y, c] of [[6, m], [9, rp(o.extra)], [12, m]]) { s.line(3, y + 1, 12, y - 2, c); s.line(4, y + 1, 13, y - 2, c); } break;
    case 'speckle': s.ell(8, 9, 4.2, 3.6, m); for (const [x, y] of [[6, 8], [9, 7], [10, 10], [7, 11], [11, 8]]) s.fix(x, y, o.extra); break;
    case 'sheen': for (const [x, y] of [[6, 7], [10, 11]]) { s.ell(x, y, 2.6, 2.2, m); s.line(x - 1, y - 1, x + 1, y - 1, null, o.extra); s.fix(x - 1, y - 2, '#ffffff'); } break;
    case 'crust': for (const [x, y] of [[4, 8], [8, 6], [10, 10], [6, 11]]) nug(s, x, y, m); for (const [x, y] of [[5, 7], [9, 5]]) s.fix(x, y, o.extra); break;
    case 'glass': for (const [x, y, h, l] of [[6, 12, 8, -2], [11, 12, 6, 1]]) { s.poly([[x - 2, y], [x + l, y - h], [x + 2, y]], m); s.line(x + l, y - h + 1, x + l + 1, y - 1, null, o.extra); } break;
    case 'feather': for (const [a, b2, c2, d] of [[4, 11, 11, 4], [6, 13, 13, 7]]) { s.line(a, b2, c2, d, m); s.line(a + 1, b2, c2 + 1, d, m); for (let i = 1; i < 4; i++) s.fix(Math.round(a + (c2 - a) * i / 4) + 2, Math.round(b2 + (d - b2) * i / 4), o.extra); } break;
    case 'rings': for (const [x, y, r] of [[6, 7, 2.6], [10, 11, 2.4]]) { s.ell(x, y, r, r, m); s.ell(x, y, r * .45, r * .45, rp(o.extra), { flat: true }); } break;
    case 'shards': for (const [x, y, h, l] of [[5, 12, 6, -1], [8, 12, 9, 1], [11, 12, 5, 0]]) { s.poly([[x - 1, y], [x + l, y - h], [x + 1 + l, y - h + 1], [x + 2, y]], m); s.fix(x + l, y - h, o.extra); s.line(x + 1, y - 1, x + 1, y - h / 2, null, '#2a1030'); } break;
  }
}

/* ---------- metal bars: an ingot in three-quarter view, each metal with its own stamp or cast ---------- */
const BAR_MARK = { bronze: 'plain', iron: 'stamp', steel: 'bevel', mithril: 'moon', adamant: 'facet', rune: 'rune', astral: 'star', gold: 'stack' };
function ingot(s, m, ox, oy, fh = 4) {
  s.poly([[ox + 3, oy], [ox + 11, oy], [ox + 13, oy + 3], [ox + 1, oy + 3]], m);                                  /* top face */
  for (let x = ox + 1; x <= ox + 13; x++) for (let y = oy; y <= oy + 3; y++) { const p = s.at(x, y); if (p && p.r === m) s.tone(x, y, m, y === oy ? 4 : 3); }
  for (let y = oy + 4; y < oy + 4 + fh; y++) for (let x = ox + 1; x <= ox + 13; x++) s.tone(x, y, m, y === oy + 3 + fh ? 1 : 2);   /* front face */
  s.tone(ox + 1, oy + 4, m, 3);
}
function barSprite(s, id) {
  const it = D.ITEMS[id], k = id.slice(4), m = metal(it.col), mark = BAR_MARK[k] || 'plain';
  if (mark === 'stack') { ingot(s, m, 1, 8, 3); ingot(s, m, 2, 2, 3); s.fix(6, 3, '#ffffff'); s.fix(5, 9, m.gl); return; }
  ingot(s, m, 1, 5);
  if (mark === 'stamp') { s.fix(6, 6, m.lo); s.fix(7, 7, m.lo); s.fix(8, 6, m.lo); s.fix(7, 6, m.base); }
  if (mark === 'bevel') { s.line(4, 7, 11, 7, null, m.gl); s.line(3, 8, 12, 8, null, m.base); }
  if (mark === 'moon') { s.fix(7, 6, '#ffffff'); s.fix(6, 7, '#ffffff'); s.fix(8, 7, m.base); }
  if (mark === 'facet') { s.line(7, 5, 7, 12, null, m.lo); s.line(8, 5, 8, 12, null, m.gl); }
  if (mark === 'rune') { s.line(6, 6, 8, 7, null, '#e8ffff'); s.line(8, 6, 6, 7, null, '#e8ffff'); s.fix(10, 11, '#e8ffff'); }
  if (mark === 'star') { s.fix(7, 6, '#ffffff'); s.fix(6, 7, '#b89aff'); s.fix(8, 7, '#b89aff'); s.fix(7, 7, '#ffffff'); s.fix(11, 4, '#ffffff'); s.fix(12, 3, '#d8c8ff'); s.fix(3, 4, '#d8c8ff'); }
  if (mark === 'plain') { s.fix(4, 6, '#ffffff'); }
}

/* ---------- planks: a short stack of sawn boards, each wood with its own count and binding ---------- */
const PLANK = { normal: [3, null], oak: [3, 'rope'], willow: [2, 'rope'], maple: [3, 'iron'], yew: [4, 'iron'], magic: [3, 'gold'], elder: [4, 'gold'] };
function plankSprite(s, w) {
  const wd = LOG[w] || LOG.normal, b = rp(mix(wd.end, wd.bark, .35)), [n, band] = PLANK[w] || [3, null];
  for (let i = 0; i < n; i++) { const y = 13 - i * 3, x0 = 1 + (i % 2), x1 = 14 - ((i + 1) % 2);
    s.rect(x0, y - 2, x1 - x0 + 1, 3, b);
    for (let x = x0; x <= x1; x++) { s.tone(x, y - 2, b, 3); s.tone(x, y, b, 1); }
    s.tone(x0, y - 1, b, 4); s.fix(x0 + 3 + i, y - 1, b.lo); s.fix(x1 - 4 - i, y - 1, b.lo); s.fix(x1, y - 1, b.lo); }
  if (w === 'magic') [[4, 3], [11, 5], [7, 9]].forEach(([x, y]) => s.fix(x, y, '#f0e4ff'));
  if (w === 'elder') s.fix(8, 3, '#f8ffe8');
  if (band) { const c = band === 'rope' ? rp('#d9b45a') : band === 'iron' ? metal('#9aa3ad') : metal('#e6b84a'); const top = 14 - n * 3; for (const x of [4, 11]) { s.line(x, top, x, 14, c); s.tone(x, top, c, 4); } }
}

/* ---------- gems: each its own cut, a facet pattern and a glint ---------- */
function gemSprite(s, id) {
  if (id === 'gem_sapphire') { const g = glass('#3a72e0'); s.poly([[2, 6], [5, 2], [11, 2], [14, 6], [8, 14]], g);
    s.line(2, 6, 14, 6, null, g.hi); s.line(5, 3, 7, 5, null, g.gl); s.line(5, 6, 8, 13, null, g.base); s.line(11, 6, 8, 13, null, g.lo); s.line(9, 3, 11, 5, null, g.lo); s.fix(4, 5, '#ffffff'); s.fix(6, 3, '#ffffff'); return; }
  if (id === 'gem_emerald') { const g = glass('#2fae5e'); s.poly([[4, 2], [12, 2], [14, 4], [14, 12], [12, 14], [4, 14], [2, 12], [2, 4]], g);
    s.rect(5, 5, 7, 7, rp('#3fcf72')); s.rect(6, 6, 5, 5, glass('#5fe08a')); s.line(3, 3, 5, 5, null, g.gl); s.line(13, 13, 11, 11, null, g.lo); s.line(3, 13, 5, 11, null, g.lo); s.line(13, 3, 11, 5, null, g.hi);
    s.fix(6, 6, '#ffffff'); s.fix(7, 6, '#e8ffe8'); return; }
  if (id === 'gem_ruby') { const g = glass('#d83048'); s.ell(8, 8.5, 5.6, 5, g); s.poly([[5, 6], [8, 4], [11, 6], [10, 9], [6, 9]], glass('#f05a70'));
    s.fix(6, 5, '#ffffff'); s.fix(7, 5, '#ffe0e8'); s.fix(11, 11, g.lo); return; }
  if (id === 'gem_diamond') { const g = glass('#bfe6ff'); s.poly([[1, 6], [4, 2], [12, 2], [15, 6], [8, 15]], g);
    s.line(1, 6, 15, 6, null, '#ffffff'); s.line(4, 3, 6, 5, null, '#ffffff'); s.line(4, 6, 8, 14, null, g.hi); s.line(12, 6, 8, 14, null, g.lo); s.line(8, 2, 8, 5, null, g.lo); s.line(10, 3, 12, 5, null, g.lo);
    for (const [x, y] of [[14, 1], [1, 12], [13, 11]]) s.fix(x, y, '#ffffff'); s.fix(14, 0, '#d8f1ff'); s.fix(15, 1, '#d8f1ff'); return; }
  if (id === 'ember_core') { const o = ramp('#d8501e', { gl: .9 }), y = ramp('#ffb03a', { gl: .9 }); s.poly([[6, 6], [7, 1], [9, 4], [11, 2], [11, 7]], rp('#ff7a2a')); s.ell(8, 10, 5, 4.6, o); s.ell(8, 10, 3, 2.8, y); s.fix(8, 10, '#fff6c0'); s.fix(7, 9, '#ffffff'); s.fix(9, 3, '#ffe070'); return; }
}

/* ---------- hides, scales, cloth and feathers ---------- */
const PELT = [[3, 2], [6, 3], [10, 3], [13, 2], [13, 5], [12, 7], [12, 10], [14, 13], [10, 13], [8, 14], [6, 13], [2, 13], [4, 10], [4, 7], [3, 5]];
function hideSprite(s, id, it) {
  const h = rp(it.col);
  if (id === 'cowhide') { s.poly(PELT, h); for (const [x, y, a, b2] of [[6, 6, 1.8, 1.4], [10, 9, 1.6, 2], [6, 11, 1.4, 1]]) s.ell(x, y, a, b2, rp('#4a3426'), { flat: true }); s.fix(5, 5, '#5a4030'); return; }
  if (id === 'wolf_pelt') { const d = rp('#5e646e'), pale = '#e8e4dc';
    s.poly([[4, 2], [6, 4], [10, 4], [12, 2], [12, 6], [14, 9], [13, 13], [10, 12], [9, 15], [7, 15], [6, 12], [3, 13], [2, 9], [4, 6]], h);   /* a pelt laid flat: ears, forelegs, hind legs, tail */
    for (let y = 4; y <= 13; y++) s.dot(8, y, d); for (let y = 5; y <= 11; y++) s.dot(7, y, d); s.tone(7, 5, d, 3);
    for (const [x, y] of [[3, 12], [5, 13], [12, 12], [11, 13], [3, 10], [13, 10]]) s.fix(x, y, h.lo); s.fix(5, 3, pale); s.fix(11, 3, pale); s.fix(8, 15, pale);
    for (const [x, y] of [[2, 8], [14, 8], [1, 9]]) s.dot(x, y, h); return; }
  if (id === 'frost_pelt') { s.poly(PELT, h); for (const [x, y] of [[3, 2], [13, 2], [2, 13], [14, 13], [8, 14], [12, 8], [4, 8]]) s.ell(x, y, 1.3, 1.3, h);
    for (const [x, y] of [[6, 5], [10, 6], [7, 9], [10, 11], [5, 12]]) { s.fix(x, y, '#ffffff'); s.fix(x + 1, y + 1, h.lo); } s.fix(9, 8, '#ffffff'); return; }
  if (id === 'bogscale') { s.ell(8, 8.5, 6, 6.2, h); for (let y = 4; y <= 12; y += 2) for (let x = 4 + (y % 4 ? 1 : 0); x <= 12; x += 2) { s.fix(x, y, h.lo); s.fix(x, y - 1, h.hi); } s.fix(5, 4, h.gl); return; }
  if (id === 'drakehide') { const sp = rp('#e0c050'); s.poly(PELT, h);
    for (let y = 5; y <= 12; y += 2) for (let x = 5 + (y % 4 ? 1 : 0); x <= 11; x += 2) { s.fix(x, y, h.lo); s.fix(x, y - 1, h.gl); }
    for (let i = 0; i < 4; i++) { const y = 4 + i * 3; s.dot(8, y, sp); s.dot(8, y + 1, sp); s.dot(7, y + 1, sp); s.tone(8, y, sp, 4); } return; }
  if (id === 'cloth') { const c = rp(it.col), stripe = '#c86a4a';
    for (const [y, k] of [[11, 0], [7, 1], [3, 2]]) { s.rect(2 + k, y, 11, 3, c); s.tone(2 + k, y, c, 4); for (let x = 3 + k; x <= 12 + k; x++) s.tone(x, y, c, 3); s.ell(13 + k, y + 1.5, 1.4, 1.6, c); }
    for (const y of [5, 9, 13]) s.fix(7, y - 1, stripe); s.line(3, 13, 12, 13, null, c.lo); return; }
  if (id === 'wyrm_scale') { const g = ramp(it.col, { gl: .85 }); s.poly([[3, 2], [13, 2], [14, 6], [12, 11], [8, 15], [4, 11], [2, 6]], g); orb(s, g, { dy: -1 });
    s.line(8, 3, 8, 13, null, g.lo); s.line(4, 4, 7, 4, null, '#fff2c0'); s.fix(5, 5, '#ffffff'); s.fix(11, 10, '#ffd04a'); return; }
}
function featherSprite(s, it) {
  const f = ramp(it.col, { lo: .3 }), q = rp('#c8b89a'), band = rp('#9a6a42');
  for (let i = 0; i <= 10; i++) { const x = 3 + i, y = 12 - i, w = i < 2 ? 0 : i > 8 ? 1 : 2; for (let k = -w; k <= w; k++) { s.dot(x + k, y + k, f); s.dot(x + k + 1, y + k, f); } }  /* the vane */
  s.line(2, 14, 12, 4, null, q.gl); s.line(1, 15, 3, 13, q);                                                       /* quill and shaft */
  for (const [x, y] of [[9, 8], [10, 8], [7, 10], [8, 10]]) s.fix(x, y, band.base); s.fix(5, 11, f.lo); s.fix(10, 3, f.gl); s.fix(13, 4, f.hi);
}
function flaxSprite(s) {
  const st = rp('#78a58b'), fl = rp('#7f91d8'), tie = rp('#d9b45a');
  for (const [x, top] of [[5, 4], [7, 2], [9, 3], [11, 5], [6, 6], [10, 6]]) { s.line(x, top + 1, 8 + (x - 8) * .3, 14, st); }
  for (const [x, y] of [[5, 3], [7, 1], [9, 2], [11, 4]]) { s.ell(x, y, 1.2, 1.2, fl, { flat: true }); s.tone(x, y, fl, 4); }
  s.rect(6, 10, 5, 2, tie); s.tone(6, 10, tie, 4);
}
function runeTrapSprite(s, it) {
  const iron = metal('#708c9b'), g = it.col;
  s.poly([[2, 7], [7, 3], [14, 7], [14, 13], [7, 15], [2, 12]], iron); s.line(7, 3, 7, 15, null, iron.lo); s.line(2, 7, 7, 9, null, iron.hi); s.line(7, 9, 14, 7, null, iron.hi);
  for (const [x, y] of [[4, 10], [5, 12], [10, 11], [12, 10], [11, 13]]) s.fix(x, y, g); s.fix(4, 11, '#e8ffff'); s.fix(11, 12, '#e8ffff');
  s.poly([[5, 2], [8, 0], [11, 2], [8, 4]], glass(g)); s.fix(8, 1, '#ffffff');
}

/* ---------- bones and tusks ---------- */
function boneSprite(s, id, it) {
  const b = ramp(it.col, { lo: .3 });
  if (id === 'boar_tusk') { for (let i = 0; i <= 11; i++) { const t2 = i / 11, x = 3 + i, y = Math.round(13 - Math.sin(t2 * 2.2) * 9), w = i < 4 ? 2 : i < 9 ? 1 : 0; for (let k = 0; k <= w; k++) s.dot(x, y + k, b); }
    s.rect(2, 12, 3, 3, rp('#a88a60')); s.fix(13, 4, '#ffffff'); s.fix(6, 7, b.gl); s.fix(8, 6, b.gl); return; }
  const big = id === 'troll_bone';
  s.line(4, 12, 12, 4, b); s.line(5, 12, 12, 5, b); s.line(4, 11, 11, 4, b); if (big) { s.line(5, 13, 13, 5, b); s.line(3, 11, 11, 3, b); }
  const r = big ? 2.2 : 1.8; for (const [x, y] of [[3, 11.5], [4.5, 13], [11.5, 3], [13, 4.5]]) s.ell(x, y, r, r, b);
  if (big) { s.line(7, 9, 9, 8, null, b.out); s.fix(8, 7, b.lo); for (const [x, y] of [[10, 9], [11, 8]]) s.fix(x, y, '#6a8a4a'); }
  else s.fix(7, 9, b.lo);
}

/* ---------- supplies and containers ---------- */
function runeSprite(s, it) {
  const st = ramp('#6a6a80', { hi: .4 }), g = it.col;
  s.poly([[3, 3], [11, 1], [14, 4], [13, 14], [4, 15], [2, 11]], st); orb(s, st);
  s.line(8, 4, 8, 12, null, g); s.line(6, 6, 10, 9, null, g); s.line(10, 6, 7, 9, null, mix(g, '#ffffff', .5)); s.fix(8, 4, '#ffffff');
  s.fix(5, 5, st.gl); for (const [x, y] of [[4, 12], [12, 12]]) s.fix(x, y, st.lo);
}
function feedSprite(s, it) {
  const sk = rp('#b8945a'), gr = rp('#e0c060'), tie = rp('#7a5236');
  s.poly([[3, 15], [2, 10], [4, 6], [12, 6], [14, 10], [13, 15]], sk); orb(s, sk, { dy: 1 });
  s.poly([[5, 6], [4, 3], [7, 4], [9, 3], [12, 3], [11, 6]], sk); s.rect(5, 5, 7, 1, tie);
  for (const [x, y] of [[6, 2], [8, 2], [10, 2], [7, 1], [9, 1]]) s.dot(x, y, gr); s.fix(8, 1, gr.gl);
  for (const [x, y] of [[13, 14], [14, 13], [15, 14]]) s.fix(x, y, gr.base); s.line(6, 9, 6, 13, null, sk.lo); s.line(10, 9, 11, 13, null, sk.lo);
}
function coinPouch(s) {
  const p = rp('#a8783a'), g = ramp('#f0c040', { gl: .85 }), tie = rp('#e6c86a');
  s.ell(7, 10, 5.4, 4.6, p); s.poly([[4, 6], [3, 3], [6, 4], [8, 3], [11, 4], [10, 6]], p); s.rect(4, 5, 7, 1, tie);
  for (const [x, y] of [[13, 13], [11, 14], [13.5, 10.5]]) { s.ell(x, y, 1.6, 1.4, g); } s.fix(12, 13, g.gl); s.fix(6, 9, p.gl);
  s.fix(7, 3, g.gl); s.fix(6, 3, g.base);
}
function treasureChest(s) {
  const w = rp('#8a5a32'), lid = rp('#a87040'), b = metal('#e6b84a'), gold = ramp('#ffd060', { gl: .9 });
  s.rect(1, 8, 14, 7, w); s.poly([[1, 8], [2, 4], [4, 3], [12, 3], [14, 4], [15, 8]], lid);
  for (let x = 4; x <= 12; x++) s.dot(x, 2, gold); s.fix(6, 2, '#ffffff'); s.fix(10, 1, '#fff6c0');
  s.rect(1, 8, 15, 1, b); s.rect(3, 3, 1, 12, b); s.rect(12, 3, 1, 12, b); s.rect(7, 8, 2, 3, b); s.fix(7, 10, INK); s.tone(7, 8, b, 4);
  s.line(2, 12, 14, 12, null, w.lo);
}

/* ---------- crafted kit: string, traps, nets and baits ---------- */
function boxTrap(s, wood, band, door) {
  const w = rp(wood); s.rect(1, 6, 14, 8, w); s.poly([[1, 6], [3, 3], [13, 3], [15, 6]], rp(mix(wood, '#fff2c8', .15)));
  for (const x of [5, 10]) s.line(x, 7, x, 13, null, w.lo);
  if (band) { const m = metal(band); s.rect(1, 6, 14, 1, m); s.rect(1, 12, 14, 1, m); for (const x of [3, 13]) s.fix(x, 9, '#f0e5c7'); }
  if (door) { s.rect(6, 8, 4, 6, rp('#3a2e2a')); s.fix(8, 9, '#e9cf80'); }
}
const CRAFT = {
  string: (s, it) => { const c = rp(it.col), d = rp(mix(it.col, '#1a1838', .25));
    arc(s, 8, 8, 4.4, 6.4, -400, 400, c); arc(s, 8, 8, 2.2, 3.6, -400, 400, d);                                     /* a hank of cord, two turns */
    for (let a = 0; a < 360; a += 45) { const x = Math.floor(8 + Math.cos(a * Math.PI / 180) * 5.4), y = Math.floor(8 - Math.sin(a * Math.PI / 180) * 5.4); s.tone(x, y, c, 1); }
    s.rect(7, 1, 2, 4, rp('#7a5236')); s.line(11, 12, 14, 15, c); s.tone(4, 4, c, 4); s.tone(5, 3, c, 4); },
  wooden_trap: (s, it) => { boxTrap(s, it.col, null, true); const st = rp('#c8a070'); s.line(11, 5, 14, 1, st); s.fix(14, 0, '#e8dcc0'); },
  reinforced_trap: (s, it) => { boxTrap(s, '#8a6745', '#a6adb2', true); },
  live_trap: (s, it) => { const w = rp('#b18b61'), pad = rp(it.col); s.rect(1, 4, 14, 10, w); s.rect(3, 6, 10, 6, rp('#3e3637')); for (const x of [4, 7, 10]) s.rect(x, 6, 1, 6, w); s.rect(1, 12, 14, 3, pad); for (const x of [3, 7, 11]) s.fix(x, 13, pad.lo); s.rect(5, 1, 6, 3, rp('#c9c3b7')); s.tone(5, 1, rp('#c9c3b7'), 4); },
  precision_trap: (s, it) => { const m = metal(it.col), sp = rp('#d9bd68'); s.rect(1, 12, 14, 3, rp('#71523d')); s.ell(8, 9, 6, 3.6, m); s.ell(8, 9, 4, 2, rp('#283c40'), { flat: true });
    for (const x of [3, 5, 7, 9, 11, 13]) { s.dot(x, 6 + (x === 3 || x === 13 ? 1 : 0), m); s.tone(x, 6 + (x === 3 || x === 13 ? 1 : 0), m, 4); } s.ell(8, 9.5, 1.4, 1.2, sp); s.line(2, 13, 6, 10, null, sp.base); },
  ironjaw_cage: (s, it) => { const m = metal(it.col), d = rp('#3a3e46'); s.rect(2, 4, 12, 11, d); for (const x of [2, 5, 8, 11, 13]) s.rect(x, 4, 1, 11, m); s.rect(2, 3, 12, 2, m); s.rect(2, 14, 12, 1, m);
    for (const x of [4, 6, 8, 10, 12]) s.fix(x, 13, '#f0f0ea'); s.tone(2, 3, m, 4); s.rect(6, 1, 4, 2, m); },
  starwoven_net: (s, it) => { const n = rp(it.col); for (let i = 0; i < 4; i++) { s.line(2 + i * 4, 1, 14 - i * 1, 14, n); s.line(14 - i * 4, 1, 2 + i * 1, 14, n); }
    for (const [x, y] of [[8, 6], [5, 10], [11, 10], [8, 13]]) { s.fix(x, y, '#fff6c0'); } s.fix(8, 5, '#ffffff'); s.ell(8, 2, 1.4, 1.2, rp('#e6c86a')); },
  scent_bait: (s, it) => { const m = rp(it.col), herb = rp('#6a9a3a'); s.ell(8, 10, 5.6, 4, m); s.ell(6, 9, 2.4, 1.4, rp('#c8945a'), { flat: true }); s.line(8, 6, 7, 2, herb); s.line(9, 6, 11, 3, herb); s.fix(7, 2, '#a8d86a'); s.fix(11, 3, '#a8d86a'); for (const [x, y] of [[10, 11], [5, 12]]) s.fix(x, y, m.lo); },
  honey_bait: (s, it) => { const c = ramp(it.col, { gl: .82 }); s.poly([[3, 6], [8, 3], [13, 6], [13, 12], [8, 15], [3, 12]], c);
    for (const [x, y] of [[5, 7], [9, 7], [7, 10], [11, 10], [5, 12], [9, 13]]) { s.fix(x, y, c.out); s.fix(x + 1, y, c.lo); s.fix(x, y - 1, c.hi); s.fix(x + 1, y - 1, c.hi); } s.fix(5, 6, '#fff6c0'); s.line(13, 9, 14, 13, null, c.hi); s.fix(14, 14, c.base); },
  smoked_lure: (s, it) => { const m = rp(it.col), hk = metal('#9aa3ad'); s.rect(4, 6, 7, 8, m); s.tone(4, 6, m, 4); for (const y of [8, 11]) s.line(5, y, 10, y, null, m.lo); s.line(7, 1, 7, 5, null, '#e8e0cc');
    for (const [x, y] of [[11, 4], [12, 2], [13, 3], [12, 0]]) s.fix(x, y, '#b8b0a8'); s.line(11, 13, 13, 15, hk); s.fix(13, 14, hk.gl); },
  moonlit_lure: (s, it) => { const g = glass(it.col), hk = metal('#c8d0e0'); s.ell(8, 9, 5, 5, g); s.ell(10.5, 7, 3.4, 3.6, rp('#1e2240'), { flat: true }); s.fix(5, 7, '#ffffff'); s.fix(5, 11, '#ffffff');
    s.line(8, 4, 8, 0, null, '#e8e0ff'); s.line(8, 14, 9, 15, hk); s.fix(10, 15, hk.gl); s.fix(13, 3, '#fff6a0'); }
};

/* ---------- relics: each a found object with its own story ---------- */
const RELIC = {
  weathered_map: s => { const p = rp('#d8c08a'), f = rp('#b89a5a'); s.poly([[2, 3], [6, 2], [10, 3], [14, 2], [14, 13], [10, 14], [6, 13], [2, 14]], p); s.line(6, 3, 6, 13, null, f.base); s.line(10, 3, 10, 13, null, f.lo);
    s.line(3, 11, 6, 8, null, '#7a5a3a'); s.line(7, 8, 9, 9, null, '#7a5a3a'); s.line(10, 9, 12, 6, null, '#7a5a3a'); s.fix(11, 5, '#c8483c'); s.fix(12, 6, '#c8483c'); s.fix(12, 4, '#c8483c'); s.fix(11, 6, '#c8483c'); s.fix(4, 5, '#5a8a4a'); s.fix(5, 5, '#5a8a4a'); s.fix(12, 12, f.lo); },
  rusted_lantern: s => { const m = rp('#9a6a3a'), fl = ramp('#ffc850', { gl: .9 }); s.rect(4, 5, 8, 9, m); s.rect(5, 6, 6, 7, fl); s.ell(8, 9.5, 1.6, 2.4, rp('#fff2b0'));
    s.rect(3, 4, 10, 2, m); s.rect(3, 13, 10, 2, m); s.rect(6, 2, 4, 2, m); arc(s, 8, 2.5, 1.4, 2.6, 0, 180, m); for (const x of [7, 9]) s.line(x, 6, x, 12, null, m.lo); for (const [x, y] of [[4, 13], [11, 5], [12, 14]]) s.fix(x, y, '#c05a2a'); },
  star_shard: s => { const c = glass('#bfe8ff'); s.poly([[8, 0], [11, 7], [9, 15], [6, 15], [5, 7]], c); s.line(8, 1, 7, 14, null, c.hi); s.line(9, 2, 10, 8, null, c.lo); s.fix(7, 4, '#ffffff'); s.fix(7, 5, '#ffffff');
    for (const [x, y] of [[13, 2], [2, 10], [13, 12]]) { s.fix(x, y, '#ffffff'); s.fix(x - 1, y, '#bfe8ff'); s.fix(x + 1, y, '#bfe8ff'); } },
  millers_bell: s => { const b = metal('#d8b050'); s.poly([[5, 4], [11, 4], [12, 10], [14, 12], [2, 12], [4, 10]], b); s.ell(8, 4, 3, 2, b); orb(s, b); s.rect(2, 12, 12, 1, b); s.tone(2, 12, b, 3);
    s.ell(8, 14, 1.4, 1.2, rp('#7a5a2a')); s.rect(7, 0, 2, 2, rp('#7a5236')); s.line(5, 8, 11, 8, null, b.lo); s.fix(6, 5, '#ffffff'); },
  lamplighter_lens: s => { const g = glass('#ffe08a'), r = metal('#e6b84a'); s.ell(7, 7, 5.6, 5.6, r); s.ell(7, 7, 4, 4, g); s.fix(5, 5, '#ffffff'); s.fix(6, 5, '#ffffff'); s.fix(5, 6, '#ffffff'); s.line(11, 11, 14, 14, rp('#7a5236')); s.line(12, 11, 15, 14, rp('#7a5236')); },
  star_heart: s => { const c = ramp('#e2d4ff', { gl: .92 }), pts = []; for (let i = 0; i < 10; i++) { const r = i % 2 ? 3 : 7.4, a = -Math.PI / 2 + i * Math.PI / 5; pts.push([8 + Math.cos(a) * r, 8.6 + Math.sin(a) * r]); }
    s.poly(pts, c); orb(s, c); s.ell(8, 9, 1.8, 1.6, ramp('#ff8ad0', { gl: .9 })); s.fix(7, 8, '#ffffff'); s.fix(8, 2, '#ffffff'); }
};

/* ---------- boats: hull and rig grow with the tier ---------- */
function boatSprite(s, it) {
  const tier = it.tier || 1, hull = rp(it.col), sail = rp('#f4ecd8'), mast = rp('#5a3a24'), sea = glass('#3f7fb8');
  const len = [0, 10, 12, 13, 14, 15][tier], x0 = Math.round((16 - len) / 2), y = 10;
  for (let x = 0; x < 16; x++) { s.dot(x, 14, sea); s.dot(x, 15, sea); s.tone(x, 14, sea, x % 4 === 1 ? 4 : 3); }
  s.poly([[x0, y], [x0 + len, y - (tier >= 4 ? 1 : 0)], [x0 + len - 2, y + 4], [x0 + 2, y + 4]], hull); s.line(x0 + 1, y + 1, x0 + len - 2, y + 1, null, hull.lo);
  if (tier >= 3) for (let x = x0 + 3; x < x0 + len - 2; x += 3) s.fix(x, y + 2, '#2a1c1f');                     /* gun ports and windows */
  if (tier === 1) { s.line(x0 + 1, y - 3, x0 + 8, y + 2, rp('#c49158')); s.fix(x0 + 9, y + 3, '#c49158'); s.fix(x0 + 4, y - 1, '#e8dcc0'); return; }
  const mx = x0 + Math.floor(len / 2); s.line(mx, 1, mx, y - 1, mast);
  if (tier === 2) { s.rect(mx - 3, 2, 7, 6, sail); s.line(mx - 3, 2, mx + 3, 2, null, sail.gl); s.line(mx - 2, 5, mx + 2, 5, null, '#c8483c'); }
  if (tier === 3) { s.poly([[mx + 1, 1], [mx + 6, y - 1], [mx + 1, y - 1]], sail); s.poly([[mx - 1, 3], [mx - 5, y - 1], [mx - 1, y - 1]], sail); }
  if (tier >= 4) { s.poly([[mx + 1, 1], [mx + 5, 4], [mx + 1, 8]], sail); s.poly([[mx - 1, 2], [mx - 5, 5], [mx - 1, 8]], sail); s.line(x0 + 2, 4, x0 + 2, y - 1, mast); s.poly([[x0 + 3, 4], [x0 + 5, 7], [x0 + 3, 8]], sail); }
  if (tier === 5) { s.line(x0 + len - 3, 3, x0 + len - 3, y - 1, mast); s.rect(x0 + len - 2, 4, 2, 3, sail); s.rect(mx, 0, 3, 1, rp('#c8483c')); s.fix(mx, 0, '#e6b84a'); }
}

/* ---------- draughts, baits and rations: bottles by shape, jars and parcels ---------- */
const GLASS = '#cfe4ee';
function bottle(s, shape, col) {
  const g = glass(GLASS), l = ramp(col, { gl: .85 }), cork = rp('#9a6a3e');
  if (shape === 'round') { s.ell(8, 10, 5.4, 4.8, g); s.ell(8, 11, 4.4, 3.6, l); s.rect(6, 3, 4, 3, g); s.rect(6, 1, 4, 2, cork); s.line(5, 5, 10, 5, null, g.lo); }
  else if (shape === 'tall') { s.rect(5, 3, 6, 12, g); s.rect(6, 6, 4, 8, l); s.rect(6, 1, 4, 2, cork); orb(s, l); }
  else if (shape === 'square') { s.rect(3, 6, 10, 9, g); s.rect(4, 8, 8, 6, l); s.rect(6, 3, 4, 3, g); s.rect(6, 1, 4, 2, cork); orb(s, l); }
  else if (shape === 'flask') { s.poly([[6, 2], [10, 2], [10, 6], [14, 14], [2, 14], [6, 6]], g); s.poly([[5, 9], [11, 9], [13, 13], [3, 13]], l); s.rect(6, 0, 4, 2, cork); orb(s, l); }
  else if (shape === 'clover') { for (const [x, y] of [[5.5, 9], [10.5, 9], [8, 12.5]]) s.ell(x, y, 2.8, 2.8, g); for (const [x, y] of [[5.5, 9], [10.5, 9], [8, 12.5]]) s.ell(x, y, 1.8, 1.8, l); s.rect(7, 3, 2, 4, g); s.rect(6, 1, 4, 2, cork); }
  s.tone(6, 1, cork, 4); s.fix(shape === 'tall' ? 6 : shape === 'square' ? 4 : 5, shape === 'tall' ? 4 : 8, '#ffffff');
  return { g, l };
}
const DRAUGHT = {
  potion_heal: (s, it) => bottle(s, 'round', it.col),
  potion_haste: (s, it) => { bottle(s, 'tall', it.col); s.fix(12, 6, '#ffffff'); s.fix(13, 5, '#ffffff'); s.fix(13, 8, '#e8f8ff'); },
  potion_might: (s, it) => bottle(s, 'square', it.col),
  potion_fortune: (s, it) => bottle(s, 'clover', it.col),
  potion_scholar: (s, it) => { bottle(s, 'flask', it.col); s.fix(12, 3, '#ffffff'); s.fix(13, 1, '#e8e0ff'); },
  calming_draught: (s, it) => { const { l } = bottle(s, 'round', it.col); const leaf = rp('#5a9a4a'); s.poly([[10, 1], [14, 0], [13, 3]], leaf); s.line(10, 2, 9, 3, null, '#3a6a3a'); s.fix(8, 11, l.gl); },
  field_ward: (s, it) => { const { l } = bottle(s, 'square', it.col); const m = metal('#e6b84a'); s.poly([[6, 9], [10, 9], [10, 11], [8, 13], [6, 11]], m); s.fix(7, 10, '#ffffff'); },
  reed_bait: (s, it) => { const j = glass(GLASS), b = rp(it.col), reed = rp('#8aa65a'); s.rect(3, 7, 10, 8, j); s.rect(4, 9, 8, 5, b); for (const [x, y] of [[5, 10], [8, 11], [10, 10], [6, 12]]) s.fix(x, y, '#e0d4a0');
    s.rect(3, 5, 10, 2, rp('#9a6a3e')); for (const [x, top] of [[5, 0], [8, 1], [11, 2]]) { s.line(x, top + 1, x, 4, reed); s.fix(x, top, '#c8a86a'); } s.fix(4, 8, '#ffffff'); },
  trap_blend: (s, it) => { const p = rp(it.col), tie = rp('#7a5236'); s.ell(8, 10, 5.4, 4.6, p); s.poly([[5, 6], [4, 3], [8, 4], [12, 3], [11, 6]], p); s.rect(5, 5, 7, 1, tie);
    const k = rp('#5a4030'); s.ell(8, 11, 1.4, 1.2, k, { flat: true }); for (const [x, y] of [[6, 9], [8, 8], [10, 9]]) s.dot(x, y, k); },
  trail_ration: (s, it) => { const p = rp(it.col), tw = rp('#e8dcc0'); s.poly([[2, 6], [11, 3], [14, 10], [5, 13]], p); s.line(3, 7, 12, 4, null, p.gl); s.line(5, 4, 9, 12, tw); s.line(3, 10, 13, 7, null, p.lo);
    s.fix(12, 12, '#7aa8c8'); s.fix(13, 12, '#7aa8c8'); s.fix(14, 11, '#4a7898'); },
  hunters_feast: (s, it) => { const pl = rp('#e8e2d4'), m = rp('#a8683a'); s.ell(8, 12, 7, 2.4, pl, { flat: true }); s.ell(7, 8.6, 4.6, 3.4, m); s.line(10, 8, 14, 3, rp('#efe2c4')); s.ell(14, 3, 1.2, 1.2, rp('#efe2c4')); s.fix(3, 11, '#6a9a4a'); s.fix(12, 11, '#e04a3a'); s.fix(5, 7, m.gl); },
  stonebread: (s, it) => { const b = ramp('#a8906a', { lo: .38 }); s.ell(8, 9.5, 6.2, 4.6, b); for (const [x, y] of [[5, 8], [8, 7], [11, 8], [7, 11], [10, 11]]) { s.fix(x, y, b.lo); s.fix(x + 1, y, b.lo); } s.fix(4, 7, b.gl); s.line(3, 13, 13, 13, null, b.out); },
  lantern_tea: (s, it) => { const c = rp('#e8e2d4'), t = ramp('#e8a040', { gl: .9 }); s.poly([[2, 7], [12, 7], [11, 13], [3, 13]], c); s.ell(7, 7, 5, 1.2, t, { flat: true }); s.tone(5, 7, t, 4);
    arc(s, 12.5, 9.5, 1.2, 2.6, -90, 90, c); s.rect(1, 14, 13, 1, c); for (const [x, y] of [[6, 4], [7, 2], [8, 3], [9, 1]]) s.fix(x, y, '#fff2b0'); }
};

/* ---------- dispatch ---------- */
const FAMILY = { rod, axe, pick: pickaxe, gloves, hoe };
function mine(id) {
  const it = D.ITEMS[id]; if (!it) return null;
  const s = Spr(16, 16), fam = /^tool_(rod|axe|pick|gloves|hoe)_/.exec(id);
  if (fam && it.tier != null) { FAMILY[fam[1]](s, it); return s; }
  if (id === 'tool_handsaw') { handsaw(s); return s; }
  if (id === 'survey_frame') { surveyFrame(s, it); return s; }
  if (id === 'training_frame') { trainingFrame(s, it); return s; }
  if (id === 'irrigation_frame') { irrigationFrame(s, it); return s; }
  if (id === 'workshop_jig') { workshopJig(s, it); return s; }
  if (id.startsWith('chart_')) { chart(s, it, id.slice(6)); return s; }
  if (id.startsWith('log_') && LOG[id.slice(4)]) { logSprite(s, LOG[id.slice(4)]); return s; }
  if (id.startsWith('ore_') && ORE[id.slice(4)]) { oreSprite(s, id.slice(4)); return s; }
  if (id.startsWith('bar_')) { barSprite(s, id); return s; }
  if (id.startsWith('plank_')) { plankSprite(s, id.slice(6)); return s; }
  if (it.type === 'gem') { gemSprite(s, id); return s; }
  if (it.ic === 'hide') { hideSprite(s, id, it); return s; }
  if (it.ic === 'bone') { boneSprite(s, id, it); return s; }
  if (id === 'feather') { featherSprite(s, it); return s; }
  if (id === 'flax') { flaxSprite(s); return s; }
  if (id === 'rune_trap') { runeTrapSprite(s, it); return s; }
  if (id === 'rune') { runeSprite(s, it); return s; }
  if (id === 'feed') { feedSprite(s, it); return s; }
  if (id === 'coin_pouch') { coinPouch(s); return s; }
  if (id === 'treasure_chest') { treasureChest(s); return s; }
  if (CRAFT[id]) { CRAFT[id](s, it); return s; }
  if (RELIC[id]) { RELIC[id](s); return s; }
  if (it.type === 'boat') { boatSprite(s, it); return s; }
  if (DRAUGHT[id]) { DRAUGHT[id](s, it); return s; }
  return null;
}
const base = A.itemSprite;
A.itemSprite = id => mine(id) || base(id);
A.itemUrl = id => A.url('item:' + id, () => A.itemSprite(id));
A.materialItem = id => !!mine(id); /* true when this file draws the item (tests and the art showcase) */
})();
