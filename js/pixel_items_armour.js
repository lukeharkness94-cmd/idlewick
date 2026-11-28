/* Idlewick pixel art: armour, shields, rings and amulets (every item worn on the head, body, legs, shield arm, finger or
   neck) in the chunky, outlined house style (owner, 28 Nov 2026; docs/pixel-art-style.md). 16 x 16, light from the top
   left, five-step hue-shifted ramps, sphere-lit domes, pauldrons, knee cops and gems, and the selective outline from
   pixelart.js. Materials read as what they are: metal plate is bright and hard-edged with a specular glint, leather is
   matte with stitching and brass buckles, robes are soft cloth with folds and trim. Tiers of one kind share a shape and
   differ by their alloy, hide or dye AND a small detail that grows with the tier (rivets, ridges, gold trim, a gem, a
   plume or crest, wings), so no two items look alike (tests/art-pixel.cjs). Wraps A.itemSprite; loaded just before
   pixel_runtime.js, so these drawings are the ones shown. */
(() => {
const DQ = window.DQ, D = DQ.data, A = DQ.pixelArt; if (!A || !A.itemSprite) return;
const { Spr, ramp, mix, R, sphere } = A;
const metal = c => ramp(c, { gl: .74 });
const hide = c => ramp(c, { hi: .2, gl: .36 });            /* leather: matte, a soft sheen, no hard glint */
const cloth = c => ramp(c, { hi: .24, gl: .44 });
const gold = metal('#e6b84a'), brass = metal('#c8963e'), strap = hide('#5e3e26'), lace = ramp('#e8dcc0');
const DARK = '#15121c';
const TIERS = ['bronze', 'iron', 'steel', 'mithril', 'adamant', 'rune', 'astral'];

/* a sphere-lit ellipse on pixel centres (exact symmetry about any half pixel); o.clip(x, y) keeps a part of it */
const ball = (s, cx, cy, rx, ry, r, o = {}) => {
  for (let y = Math.floor(cy - ry); y < Math.ceil(cy + ry); y++) for (let x = Math.floor(cx - rx); x < Math.ceil(cx + rx); x++) {
    const nx = (x + .5 - cx) / rx, ny = (y + .5 - cy) / ry; if (nx * nx + ny * ny > 1 || (o.clip && !o.clip(x, y))) continue;
    if (o.flat) s.dot(x, y, r); else s.tone(x, y, r, Math.max(o.min || 1, Math.min(o.max || 4, sphere(nx, ny) + (o.bias || 0)))); } };
/* hand-authored rows: a char maps to a ramp (edge-lit by the renderer), [ramp, step] (a chosen light step) or '#hex' */
const paint = (s, rows, map, ox = 0, oy = 0) => rows.forEach((row, j) => [...row].forEach((ch, i) => { const v = map[ch]; if (!v) return;
  const x = ox + i, y = oy + j; if (typeof v === 'string') s.fix(x, y, v); else if (Array.isArray(v)) s.tone(x, y, v[0], v[1]); else s.dot(x, y, v); }));
/* a gem: sphere-lit with a white catch-light at the top left */
const gem = (s, cx, cy, rx, ry, col) => { const g = ramp(col, { gl: .8 }); ball(s, cx, cy, rx, ry, g); s.fix(Math.floor(cx - rx * .45), Math.floor(cy - ry * .45), '#ffffff'); };
const stud = (s, x, y, r) => { s.tone(x, y, r, 4); };
const star = (s, x, y, c, core = '#ffffff') => { s.fix(x, y, core); s.fix(x - 1, y, c); s.fix(x + 1, y, c); s.fix(x, y - 1, c); s.fix(x, y + 1, c); };

/* ================= metal plate: seven alloys, one shape per piece, a detail per tier ================= */
const TIER_GEM = { adamant: '#e8484a', rune: '#ffb03a', astral: '#fff2b0' };
const PLUME = { adamant: '#d8443a', rune: '#2f4fa8', astral: '#f4f0ff' };

function fullHelm(s, col, t) {
  const m = metal(col), face = metal(mix(col, '#1a1838', .16)), T = TIERS.indexOf(t);
  /* crest or plume behind the dome */
  if (t === 'adamant') { const p = ramp(PLUME[t]); ball(s, 9.5, 2.2, 3.2, 2, p); ball(s, 12, 3.4, 1.8, 1.6, p); s.dot(7, 2, p); }
  if (t === 'rune') { const c = metal(PLUME[t]); paint(s, ['....cccccc', '...ccccccc', '..ccc.....'], { c }, 5, 0); }
  ball(s, 8, 8.4, 5.8, 6.6, m, { clip: (x, y) => y <= 8 });                           /* the dome */
  paint(s, [
    '..ffffffffffff..',
    '..ffffffffffff..',
    '..ffffffffffff..',
    '..ffffffffffff..',
    '...ffffffffff...'], { f: face }, 0, 8);
  s.tone(2, 8, face, 4); s.tone(3, 8, face, 4);
  for (let x = 4; x <= 11; x++) s.fix(x, 10, DARK);                                    /* the eye slit */
  s.fix(4, 11, face.lo); for (let x = 5; x <= 11; x++) s.fix(x, 11, face.base);
  if (T >= 1) { s.fix(6, 11, DARK); s.fix(9, 11, DARK); stud(s, 3, 11, face); stud(s, 12, 11, face); }                  /* breathing holes, rivets */
  for (let y = 2; y <= 7; y++) { s.tone(7, y, m, y < 5 ? 4 : 3); s.tone(8, y, m, 1); } s.tone(7, 1, m, 4); s.tone(8, 1, m, 2);              /* a raised comb */
  if (T >= 2) { for (let y = 9; y <= 12; y++) { s.tone(7, y, face, y === 10 ? 3 : 4); s.tone(8, y, face, 1); } }                                    /* a nasal bar over the slit */
  if (T >= 3) { for (let x = 2; x <= 13; x++) s.tone(x, 9, gold, x < 6 ? 4 : x > 11 ? 2 : 3); }                                                          /* gold brow */
  if (TIER_GEM[t]) gem(s, 8, 9.5, 1, 1, TIER_GEM[t]);
  if (t === 'astral') { const w = ramp('#f4f0ff', { gl: .8 }); paint(s, ['w.....', 'ww....', 'www...', '.ww...'], { w }, 0, 3); paint(s, ['.....w', '....ww', '...www', '...ww.'], { w }, 10, 3); }
  s.tone(4, 4, m, 4); s.tone(5, 3, m, 4);
}

function plateBody(s, col, t) {
  const m = metal(col), fauld = metal(mix(col, '#1a1838', .16)), pd = metal(mix(col, '#fff2c8', .06)), T = TIERS.indexOf(t);
  paint(s, [
    '................',
    '................',
    '....mmm..mmm....',
    '...mmmmmmmmmm...',
    '...mmmmmmmmmm...',
    '...mmmmmmmmmm...',
    '...mmmmmmmmmm...',
    '...mmmmmmmmmm...',
    '...mmmmmmmmmm...',
    '....mmmmmmmm....',
    '....mmmmmmmm....',
    '....bbbbbbbb....',
    '....ffffffff....',
    '....ff.ff.ff....'], { m, b: strap, f: fauld });
  for (let y = 4; y <= 10; y++) { s.tone(7, y, m, 3); s.tone(8, y, m, 1); }          /* the centre ridge */
  s.tone(5, 4, m, 4); s.tone(5, 5, m, 4); s.tone(6, 4, m, 3);                          /* a glint on the left breast */
  s.fix(7, 11, '#f2c84a'); s.fix(8, 11, '#b8862a');                                     /* buckle */
  ball(s, 3.4, 4.6, 2.5, 2.4, pd); ball(s, 12.6, 4.6, 2.5, 2.4, pd);                   /* sphere-lit pauldrons */
  if (T >= 1) { stud(s, 2, 6, pd); stud(s, 13, 6, pd); stud(s, 5, 12, fauld); stud(s, 10, 12, fauld); }
  if (T >= 2) for (let x = 4; x <= 11; x++) s.tone(x, 9, m, x === 7 ? 2 : 1);                                         /* a lame across the belly */
  if (T >= 3) { for (const [x, y] of [[5, 3], [6, 3], [7, 4], [8, 4], [9, 3], [10, 3]]) s.tone(x, y, gold, x < 8 ? 4 : 2); }    /* gold collar */
  if (TIER_GEM[t]) gem(s, 8, 6.5, 1, 1, TIER_GEM[t]);
  if (t === 'rune' || t === 'astral') { const sp = t === 'astral' ? gold : m; s.tone(2, 2, sp, 4); s.tone(13, 2, sp, 3); s.tone(1, 3, sp, 3); s.tone(14, 3, sp, 2); }   /* pauldron spikes / gold tips */
  if (t === 'astral') star(s, 8, 6, '#c8b0ff', '#ffffff');
}

function plateLegs(s, col, t) {
  const m = metal(col), w = metal(mix(col, '#1a1838', .16)), k = metal(mix(col, '#fff2c8', .06)), T = TIERS.indexOf(t);
  paint(s, [
    '................',
    '................',
    '...wwwwwwwwww...',
    '...wwwwwwwwww...',
    '...mmmmmmmmmm...',
    '...mmmmmmmmmm...',
    '...mmmm..mmmm...',
    '...mmmm..mmmm...',
    '...mmmm..mmmm...',
    '...mmmm..mmmm...',
    '...mmmm..mmmm...',
    '...mmmm..mmmm...',
    '...mmmm..mmmm...',
    '..wwwww..wwwww..'], { m, w });
  for (let y = 6; y <= 12; y++) { s.tone(6, y, m, 1); s.tone(12, y, m, 1); }
  for (const x0 of [3, 9]) { for (let x = x0; x < x0 + 4; x++) { s.tone(x, 7, m, 1); s.tone(x, 11, m, 1); }                /* knee cops between two dark joints */
    paint(s, ['.kk.', 'kkkk', '.kk.'], { k }, x0, 8); s.tone(x0 + 1, 8, k, 4); s.tone(x0, 9, k, 3); s.tone(x0 + 3, 9, k, 1); s.tone(x0 + 2, 10, k, 1); }
  s.tone(4, 5, m, 4); s.tone(4, 6, m, 4); s.tone(10, 6, m, 3);
  if (T >= 1) { stud(s, 4, 3, w); stud(s, 11, 3, w); }
  if (T >= 2) { for (const x of [3, 4, 5, 6, 9, 10, 11, 12]) s.tone(x, 12, m, x === 3 || x === 9 ? 2 : 1); }               /* shin lames */
  if (T >= 3) for (let x = 3; x <= 12; x++) s.tone(x, 2, gold, x < 7 ? 4 : 3);                                          /* gold waist */
  if (TIER_GEM[t]) gem(s, 8, 3.5, 1, 1, TIER_GEM[t]);
  if (t === 'rune' || t === 'astral') { const sp = t === 'astral' ? gold : k; s.tone(2, 9, sp, 3); s.tone(13, 9, sp, 2); }   /* fluted knee wings */
  if (t === 'astral') { s.fix(4, 9, '#ffffff'); s.fix(10, 9, '#ffffff'); }
}

/* kiteshields: a metal rim round a heraldic field; each alloy carries its own charge */
const KITE = {
  bronze: { field: '#3f6a3a', charge: 'boss' }, iron: { field: '#3f6fb8', charge: 'pale' }, steel: { field: '#b8403a', charge: 'cross' },
  mithril: { field: '#e8e0d0', charge: 'chevron' }, adamant: { field: '#2a2a38', charge: 'bend' }, rune: { field: '#24306a', charge: 'star' }, astral: { field: '#3a2a6a', charge: 'sun' }
};
function kite(s, col, t) {
  const m = metal(col), k = KITE[t] || KITE.iron, f = ramp(k.field), T = TIERS.indexOf(t);
  const rows = [
    '..rrrrrrrrrrrr..',
    '..rffffffffffr..',
    '..rffffffffffr..',
    '..rffffffffffr..',
    '..rffffffffffr..',
    '..rffffffffffr..',
    '..rffffffffffr..',
    '..rffffffffffr..',
    '...rffffffffr...',
    '...rffffffffr...',
    '....rffffffr....',
    '.....rffffr.....',
    '......rffr......',
    '.......rr.......'];
  rows.forEach((row, j) => [...row].forEach((ch, i) => { const y = j + 1;
    if (ch === 'r') s.tone(i, y, m, j === 0 ? (i < 9 ? 4 : 3) : i < 8 ? 3 : 1);
    else if (ch === 'f') s.tone(i, y, f, (i === 3 || j === 1) ? 3 : (row[i + 1] === 'r' || rows[j + 1][i] === 'r') ? 1 : 2); }));
  const ch = k.charge, c = T >= 3 ? gold : m;
  if (ch === 'boss') { ball(s, 8, 6.5, 2.4, 2.4, m); }
  if (ch === 'pale') for (let y = 3; y <= 11; y++) { s.tone(7, y, c, 4); s.tone(8, y, c, 2); }
  if (ch === 'cross') { for (let y = 3; y <= 11; y++) { s.tone(7, y, c, 4); s.tone(8, y, c, 2); } for (let x = 4; x <= 11; x++) { s.tone(x, 5, c, x < 8 ? 4 : 3); s.tone(x, 6, c, 2); } }
  if (ch === 'chevron') for (let i = 0; i <= 4; i++) { s.tone(3 + i, 9 - i, c, 4); s.tone(3 + i, 10 - i, c, 2); s.tone(12 - i, 9 - i, c, 3); s.tone(12 - i, 10 - i, c, 2); }
  if (ch === 'bend') for (let i = 0; i <= 8; i++) { s.tone(3 + i, 2 + i, c, 4); s.tone(4 + i, 2 + i, c, 2); }
  if (ch === 'star' || ch === 'sun') { const g = ch === 'sun' ? ramp('#fff2b0', { gl: .9 }) : gold;
    ball(s, 8, 6.5, 2, 2, g); for (const [x, y] of [[7, 2], [8, 2], [7, 10], [8, 10], [3, 6], [12, 6], [4, 3], [11, 3], [4, 9], [11, 9]]) s.tone(x, y, g, 3);
    if (ch === 'sun') { s.fix(7, 6, '#ffffff'); for (const [x, y] of [[5, 1], [10, 1]]) s.fix(x, y, '#c8b0ff'); } }
  if (T >= 1) { stud(s, 3, 2, m); stud(s, 12, 2, m); }
  if (TIER_GEM[t] && ch !== 'star' && ch !== 'sun') gem(s, 8, 6.5, 1, 1, TIER_GEM[t]);
}

/* ================= leather: four hides, matte, stitched, brass fittings ================= */
const HIDE = { leather: 'plain', frost: 'fur', bog: 'scale', drake: 'drake' };
const fur = () => ramp('#eef0f2', { lo: .22 });
const scales = (s, h, x0, y0, x1, y1, ok, gloss) => { for (let y = y0; y <= y1; y += 2) for (let x = x0 + ((y - y0) / 2 % 2 ? 1 : 0); x <= x1; x += 2) if (!ok || ok(x, y)) { const on = (X, Y) => { const p = s.at(X, Y); return p && p.r === h && !p.fix; };
  if (on(x, y)) s.tone(x, y, h, 1); if (gloss && on(x, y - 1)) s.tone(x, y - 1, h, 3); } };
function coif(s, col, kind) {
  const h = hide(col), inner = ramp(mix(col, '#140c14', .7)), F = kind === 'fur' ? fur() : null;
  if (kind === 'drake') { const horn = ramp('#e8dcb8'); s.tone(3, 2, horn, 3); s.tone(2, 1, horn, 4); s.tone(12, 2, horn, 2); s.tone(13, 1, horn, 3); }
  ball(s, 8, 8, 6, 6.8, h, { clip: (x, y) => y <= 10 });
  paint(s, [
    '.hhhhhhhhhhhhhh.',
    '.hhhhhhhhhhhhhh.',
    '..hhhhhhhhhhhh..',
    '...hhhhhhhhhh...'], { h }, 0, 10);
  ball(s, 8, 8.6, 3.4, 3.6, inner, { flat: true });                                      /* the face opening */
  for (let x = 5; x <= 10; x++) s.tone(x, 5, inner, 1);
  for (let y = 6; y <= 10; y++) { s.tone(5, y, inner, 1); }
  for (let y = 6; y <= 11; y++) s.tone(10, y, inner, 3);
  for (const y of [1, 3]) { s.tone(8, y, h, 1); }                                          /* a stitched crown seam */
  for (const x of [3, 5, 10, 12]) s.tone(x, 13, h, 1);                                     /* stitches on the hem */
  if (kind === 'plain') { s.fix(7, 12, lace.base); s.fix(8, 12, lace.lo); }               /* a lace at the throat */
  if (F) { for (let a = 0; a < 20; a++) { const t = a / 20 * Math.PI * 2, x = Math.round(7.5 + Math.cos(t) * 4), y = Math.round(8.6 + Math.sin(t) * 4.2); s.tone(x, y, F, (x < 8 && y < 9) ? 4 : (x > 8 && y > 9) ? 1 : 3); }
    for (let x = 1; x <= 14; x++) s.tone(x, 12, F, x % 2 ? 3 : 2); }
  if (kind === 'scale' || kind === 'drake') scales(s, h, 2, 2, 13, 13, null, kind === 'drake');
  if (kind === 'drake') { for (const [x, y] of [[7, 0], [8, 0], [8, 1]]) s.tone(x, y, ramp(mix(col, '#1a1838', .4)), 2); }
  s.tone(4, 3, h, 4);
}
function jerkin(s, col, kind) {
  const h = hide(col), sl = hide(mix(col, '#1a1838', .1)), lin = ramp(mix(col, '#140c14', .7)), F = kind === 'fur' ? fur() : null;
  paint(s, [
    '................',
    '................',
    '....hhh..hhh....',
    '..sshhhllhhhss..',
    '.ssshhhllhhhsss.',
    '.ssshhhllhhhsss.',
    '.ss.hhhllhhh.ss.',
    '.ss.hhhllhhh.ss.',
    '....hhhllhhh....',
    '....hhhllhhh....',
    '...hhhhllhhhh...',
    '...hhhhllhhhh...',
    '...hhhhhhhhhh...'], { h, s: sl, l: lin });
  for (const y of [4, 6, 8, 10]) { s.fix(7, y, lace.base); s.fix(8, y + 1, lace.lo); }           /* cross-laced front */
  for (const x of [4, 6, 9, 11]) s.tone(x, 12, h, 1);                                              /* hem stitching */
  s.tone(4, 2, h, 4); s.tone(5, 3, h, 4);
  if (kind === 'plain') { s.rect(4, 9, 3, 1, strap); s.rect(9, 9, 3, 1, strap); s.fix(5, 9, brass.base); s.fix(10, 9, brass.base); }   /* pocket flaps */
  if (F) { for (const [x, y] of [[4, 2], [5, 2], [6, 2], [9, 2], [10, 2], [11, 2], [3, 3], [12, 3]]) s.tone(x, y, F, x < 8 ? 4 : 2); for (const [x, y] of [[1, 7], [2, 7], [13, 7], [14, 7]]) s.tone(x, y, F, x < 8 ? 3 : 2); for (let x = 3; x <= 12; x++) s.tone(x, 12, F, x % 2 ? 3 : 2); }
  if (kind === 'scale' || kind === 'drake') scales(s, h, 3, 3, 12, 11, x => x !== 7 && x !== 8, kind === 'drake');
  if (kind === 'drake') { const sp = ramp(mix(col, '#1a1838', .4)); for (const [x, y] of [[1, 3], [2, 2], [13, 2], [14, 3]]) s.tone(x, y, sp, 2); }
}
function chaps(s, col, kind) {
  const h = hide(col), F = kind === 'fur' ? fur() : null;
  paint(s, [
    '................',
    '................',
    '...bbbbbbbbbb...',
    '...hhhhhhhhhh...',
    '...hhhhhhhhhh...',
    '...hhhh..hhhh...',
    '...hhhh..hhhh...',
    '...hhhh..hhhh...',
    '...hhhh..hhhh...',
    '...hhhh..hhhh...',
    '..hhhhh..hhhhh..',
    '..hhhhh..hhhhh..',
    '..hhhhh..hhhhh..',
    '..hhhhh..hhhhh..'], { h, b: strap });
  s.fix(7, 2, '#f2c84a'); s.fix(8, 2, '#b8862a');
  for (let y = 4; y <= 12; y += 2) { s.tone(3, y, h, 1); s.tone(12, y, h, 3); }                  /* side lacing */
  for (let y = 6; y <= 12; y++) { s.tone(6, y, h, 1); s.tone(13, y, h, 1); }
  s.tone(4, 3, h, 4); s.tone(4, 4, h, 4); s.tone(10, 5, h, 3);
  if (kind === 'plain') for (const x of [2, 4, 6, 9, 11, 13]) s.tone(x, 14, h, 2);                                       /* a fringe */
  if (F) for (let x = 2; x <= 13; x++) if (x !== 7 && x !== 8) { s.tone(x, 12, F, x % 2 ? 3 : 2); s.tone(x, 13, F, x < 7 ? 3 : 1); }
  if (kind === 'scale' || kind === 'drake') scales(s, h, 3, 4, 13, 12, x => x !== 7 && x !== 8, kind === 'drake');
  if (kind === 'drake') { const sp = ramp(mix(col, '#1a1838', .4)); for (const [x, y] of [[1, 9], [1, 11], [14, 9], [14, 11]]) s.tone(x, y, sp, 2); }
}

/* ================= robes: four dyes, soft cloth, trim that grows with the rank ================= */
const ROBE = { apprentice: 0, adept: 1, mystic: 2, archmage: 3 };
const ROBE_TRIM = ['#c8a070', '#e6b84a', '#e6b84a', '#f2d06a'];
function hoodSprite(s, col, rank) {
  const c = cloth(col), inner = ramp(mix(col, '#0e0a18', .74)), tr = rank ? metal(ROBE_TRIM[rank]) : cloth(ROBE_TRIM[0]);
  paint(s, ['.....cc.', '....ccc.', '...cccc.'], { c }, 4, 0);                               /* the peak, leaning back */
  ball(s, 8, 8.6, 6, 6.4, c, { clip: (x, y) => y <= 11 });
  paint(s, ['.cccccccccccccc.', '.cccccccccccccc.', '..cccccccccccc..'], { c }, 0, 12);
  ball(s, 8, 9.4, 3.4, 3.8, inner, { flat: true });
  for (let x = 5; x <= 10; x++) s.tone(x, 6, inner, 1);
  for (let a = 0; a < 22; a++) { const t = a / 22 * Math.PI * 2, x = Math.round(7.5 + Math.cos(t) * 4.2), y = Math.round(9.4 + Math.sin(t) * 4.4); if (y <= 13) s.tone(x, y, tr, (x < 8 && y < 10) ? 4 : (x > 8 && y > 9) ? 1 : 3); }
  for (const x of [3, 12]) s.tone(x, 13, c, 1);
  s.fix(6, 9, '#f4e8c8'); s.fix(9, 9, '#f4e8c8');                                          /* eyes glinting in the shadow */
  if (rank >= 2) star(s, 8, 3, mix(ROBE_TRIM[rank], '#ffffff', .3), '#ffffff');
  if (rank >= 3) gem(s, 8, 5.5, 1, 1, '#5ad8ff');
  if (rank === 1) { s.tone(7, 3, tr, 4); s.tone(8, 3, tr, 3); }
}
function robeTop(s, col, rank) {
  const c = cloth(col), sl = cloth(mix(col, '#1a1838', .12)), tr = rank ? metal(ROBE_TRIM[rank]) : cloth(ROBE_TRIM[0]), sash = rank >= 2 ? cloth(rank === 3 ? '#b02a4a' : '#e6b84a') : cloth('#c8a070');
  paint(s, [
    '................',
    '................',
    '....ccc..ccc....',
    '...cccc..cccc...',
    '..sccccccccccs..',
    '.sscccccccccss..',
    '.sssccccccccsss.',
    '.sssccccccccsss.',
    '.sss.cccccc.sss.',
    '.sss.cccccc.sss.',
    '....cccccccc....',
    '....cccccccc....',
    '...cccccccccc...',
    '...cccccccccc...'], { c, s: sl });
  for (const [x, y] of [[6, 2], [7, 3], [9, 2], [8, 3], [7, 4], [8, 4]]) s.tone(x, y, tr, x < 8 ? 4 : 2);               /* the V neck */
  for (let x = 4; x <= 11; x++) s.tone(x, 10, sash, x < 6 ? 4 : x > 9 ? 1 : 2);                                              /* sash */
  if (rank) { for (const x of [1, 2, 3, 12, 13, 14]) s.tone(x, 9, tr, x < 8 ? 3 : 2); for (let x = 3; x <= 12; x++) s.tone(x, 13, tr, x < 7 ? 3 : 2); }  /* cuffs and hem */
  for (let y = 11; y <= 12; y++) { s.tone(6, y, c, 1); s.tone(9, y, c, 1); }
  s.tone(4, 4, c, 4); s.tone(5, 3, c, 4);
  if (rank >= 2) { star(s, 5, 7, mix(ROBE_TRIM[rank], '#ffffff', .2), '#ffffff'); s.fix(10, 6, '#fff2c8'); s.fix(9, 8, '#fff2c8'); }
  if (rank >= 3) gem(s, 8, 10.5, 1, 1, '#5ad8ff');
}
function robeBottom(s, col, rank) {
  const c = cloth(col), tr = rank ? metal(ROBE_TRIM[rank]) : cloth(ROBE_TRIM[0]), sash = rank >= 2 ? cloth(rank === 3 ? '#b02a4a' : '#e6b84a') : cloth('#c8a070');
  s.poly([[3.5, 3], [12.5, 3], [14.6, 14.5], [1.4, 14.5]], c);
  paint(s, ['...bbbbbbbbbb...', '...bbbbbbbbbb...'], { b: sash }, 0, 2);
  for (let y = 5; y <= 13; y++) { s.tone(Math.round(5.6 - (y - 5) * .3), y, c, 1); s.tone(8, y, c, 1); s.tone(Math.round(10.6 + (y - 5) * .3), y, c, 3); }   /* folds */
  s.tone(4, 4, c, 4); s.tone(4, 5, c, 4);
  if (rank === 0) { s.tone(10, 4, sash, 2); s.tone(10, 5, sash, 2); s.tone(11, 6, sash, 1); }                              /* the rope's tail */
  if (rank) for (let x = 1; x <= 14; x++) s.tone(x, 14, tr, x < 6 ? 3 : 2);
  if (rank >= 2) { star(s, 5, 10, mix(ROBE_TRIM[rank], '#ffffff', .2), '#ffffff'); s.fix(11, 9, '#fff2c8'); s.fix(10, 12, '#fff2c8'); }
  if (rank >= 3) { gem(s, 8, 3, 1, 1, '#5ad8ff'); for (const x of [3, 6, 9, 12]) s.fix(x, 13, '#fff2c8'); }
}

/* ================= rings and amulets: gold settings, each stone its own cut ================= */
function band(s, metalR) {
  ball(s, 8, 10, 5, 4.4, metalR);
  for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) { const nx = (x + .5 - 8) / 2.7, ny = (y + .5 - 10.2) / 2.2; if (nx * nx + ny * ny <= 1) s.erase(x, y); }
  for (let y = 6; y <= 14; y++) for (let x = 3; x <= 13; x++) { const p = s.at(x, y); if (!p || p.r !== metalR) continue;
    const hole = [[0, 1], [1, 0], [0, -1], [-1, 0]].find(([a, b]) => !s.at(x + a, y + b) && Math.abs(x + a + .5 - 8) < 3 && Math.abs(y + b + .5 - 10.2) < 2.6);
    if (hole && (hole[0] < 0 || hole[1] < 0)) s.tone(x, y, metalR, 3); }        /* the inside of the band: lit where it faces the light through the hole */
}
function ringSprite(s, kind, col) {
  const g = kind === 'diamond' ? metal('#d8dce4') : gold;
  band(s, g);
  const st = ramp(col, { gl: .82 });
  if (kind === 'sapphire') { s.tone(6, 5, g, 3); s.tone(9, 5, g, 2); ball(s, 8, 4, 2.6, 2.2, st); s.fix(6, 3, '#ffffff'); }
  if (kind === 'emerald') { paint(s, ['.gggg.', 'gsssSg', 'gsSSsg', 'gssssg', '.gggg.'], { g: [g, 3], s: [st, 2], S: [st, 3] }, 5, 1); s.tone(6, 2, st, 4); s.tone(9, 4, st, 1); s.tone(10, 2, g, 1); s.tone(10, 3, g, 1); }
  if (kind === 'ruby') { ball(s, 8, 4.2, 2.2, 2.2, st); s.fix(7, 3, '#ffffff'); for (const [x, y] of [[5, 2], [10, 2], [5, 6], [10, 6]]) s.tone(x, y, g, x < 8 ? 4 : 2); }
  if (kind === 'diamond') { paint(s, ['.wwww.', 'wwWWww', '.wwww.', '..ww..'], { w: [st, 3], W: [st, 4] }, 5, 2); s.tone(5, 3, st, 2); s.tone(10, 3, st, 2); s.tone(8, 4, st, 2); s.tone(8, 5, st, 1); s.fix(7, 3, '#ffffff');
    s.fix(12, 1, '#ffffff'); s.fix(12, 0, '#cfe8ff'); s.fix(13, 1, '#cfe8ff'); s.fix(11, 1, '#cfe8ff'); s.fix(12, 2, '#cfe8ff'); }
}
const chain = (s, c, x0, x1, yEnd) => { for (let i = 0; ; i++) { const y = 1 + i; if (y > yEnd) break; const xl = Math.round(x0 + (7 - x0) * (i / (yEnd - 1))), xr = 15 - xl;
  s.tone(xl, y, c, i % 2 ? 2 : 4); s.tone(xr, y, c, i % 2 ? 1 : 3); } };
function amuletSprite(s, kind, col) {
  chain(s, gold, 2, 13, 7);
  const st = ramp(col, { gl: .82 });
  if (kind === 'sapphire') { s.tone(7, 8, gold, 4); s.tone(8, 8, gold, 3); ball(s, 8, 11.6, 3.2, 3.4, gold); ball(s, 8, 11.8, 2.2, 2.4, st); s.tone(7, 9, st, 3); s.tone(8, 9, st, 2); s.fix(7, 10, '#ffffff'); }
  if (kind === 'emerald') { paint(s, ['gggggg', 'gSSSsg', 'gSsssg', 'gsssSg', 'gssssg', 'gggggg'], { g: gold, s: [st, 2], S: [st, 3] }, 5, 8); s.tone(6, 9, st, 4); s.tone(9, 12, st, 1); }
  if (kind === 'ruby') { ball(s, 8, 11, 3.2, 3.2, gold); ball(s, 8, 11, 2.2, 2.2, st); s.fix(7, 10, '#ffffff'); s.tone(7, 14, gold, 3); s.tone(8, 14, gold, 2); }
  if (kind === 'diamond') { s.tone(7, 8, gold, 4); s.tone(8, 8, gold, 3); paint(s, ['..ww..', '.wWWw.', 'wwWwww', '.wwww.', '..ww..', '...w..'], { w: [st, 3], W: [st, 4] }, 5, 8); s.tone(9, 11, st, 1); s.tone(9, 12, st, 1); s.tone(8, 13, st, 1); s.fix(7, 10, '#ffffff');
    for (const [x, y] of [[3, 10], [12, 10], [11, 8], [4, 13]]) s.fix(x, y, '#cfe8ff'); s.fix(12, 11, '#ffffff'); }
}

/* skilling charms: a leather cord, a knot, and a pendant cut from the mineral, each its own shape */
function charm(s, ore) {
  const o = (A.ORE && A.ORE[ore]) || { col: '#999999' }, m = ramp(o.col, { gl: .82 }), cord = hide('#8a6440');
  for (let i = 0; i <= 5; i++) { s.tone(2 + i, 1 + i, cord, 3); s.tone(13 - i, 1 + i, cord, 2); }
  s.tone(7, 7, cord, 2); s.tone(8, 7, cord, 1);
  const cut = {
    flint: () => { s.poly([[4.5, 8], [11.5, 8], [8, 15]], m); for (const [x, y] of [[5, 8], [7, 9], [9, 8], [6, 10], [10, 9], [8, 12]]) s.tone(x, y, m, 3); for (const [x, y] of [[10, 8], [9, 11], [8, 13]]) s.tone(x, y, m, 1); s.tone(5, 8, m, 4); },
    quartz: () => { paint(s, ['...a...', '..aab..', '.aaabb.', '.aaabb.', '.aaabb.', '.aaabb.', '.aaabb.'], { a: [m, 3], b: [m, 1] }, 4, 8); s.tone(7, 8, m, 4); s.tone(6, 10, m, 4); s.tone(6, 11, m, 4); },
    amber: () => { ball(s, 8, 11.4, 3.2, 3.6, m); s.poly([[6.5, 9], [9.5, 9], [8, 7.5]], m); s.fix(8, 12, o.extra); s.fix(9, 12, o.extra); s.fix(8, 11, mix(o.extra, '#ffffff', .2)); s.fix(6, 10, '#fff6d0'); },
    jet: () => { ball(s, 8, 11.4, 3.4, 2.8, m); s.fix(6, 10, '#ffffff'); s.fix(7, 10, mix(o.col, '#ffffff', .6)); },
    jade: () => { ball(s, 8, 11.4, 3.6, 3.6, m); s.erase(7, 11); s.erase(8, 11); s.erase(7, 12); s.erase(8, 12); s.tone(9, 11, m, 3); s.tone(9, 12, m, 3); s.tone(6, 11, m, 1); },
    bloodstone: () => { paint(s, ['bbbbbb', 'bbbbbb', 'bbbbbb', 'bbbbbb', 'bbbbbb'], { b: m }, 5, 9); for (const [x, y] of [[6, 10], [9, 11], [7, 12], [10, 13]]) s.fix(x, y, o.extra || '#c8302a'); s.tone(5, 9, m, 4); },
    moonstone: () => { ball(s, 8, 11.4, 3.6, 3.6, m); for (let y = 6; y <= 16; y++) for (let x = 6; x <= 14; x++) { const nx = (x + .5 - 10.4) / 3, ny = (y + .5 - 10.2) / 3.2; if (nx * nx + ny * ny <= 1) s.erase(x, y); } s.fix(5, 11, '#ffffff'); },
    bogiron: () => { s.poly([[4.5, 9.5], [10.5, 8.5], [12.5, 12], [9, 15], [4.5, 13.5]], m); s.fix(7, 11, o.extra || '#5a3a2a'); s.fix(10, 12, o.extra || '#5a3a2a'); s.tone(6, 10, m, 4); s.tone(10, 13, m, 1); },
    obsidian: () => { s.poly([[8, 8], [11.5, 11.5], [8, 15.5], [4.5, 11.5]], m); for (let i = 0; i < 4; i++) s.fix(7 - (i > 1 ? 1 : 0), 9 + i, mix(o.col, '#e0d0ff', .55)); s.tone(9, 13, m, 1); },
    skyglass: () => { paint(s, ['.aaab.', 'aaaabb', '.aabb.', '..ab..', '..b...'], { a: [m, 3], b: [m, 1] }, 5, 8); s.tone(6, 8, m, 4); s.fix(7, 9, '#ffffff'); s.fix(11, 8, '#ffffff'); },
    silver: () => { paint(s, ['.mmmm.', 'mmmmmm', 'mmmmmm', 'mmmmmm', 'mmmmmm', '.mmmm.'], { m }, 5, 8); s.erase(7, 9); s.erase(8, 9); for (const [x, y] of [[7, 11], [8, 12], [7, 13], [9, 11]]) s.tone(x, y, m, 1); s.tone(6, 10, m, 4); },   /* a pierced silver tag, scratched with a mark */
    nullite: () => { ball(s, 8, 11.5, 3.6, 3.6, m); for (const [x, y] of [[7, 11], [8, 11], [7, 12], [8, 12]]) s.fix(x, y, '#06040c'); s.fix(9, 12, '#b878ff'); s.fix(6, 10, '#d8c0ff'); s.fix(6, 9, '#ffffff'); }
  };
  (cut[ore] || cut.jet)();
}

/* ================= wooden shields: nine woods, nine shapes, rope and iron fittings ================= */
function woodShield(s, log) {
  const W = (A.WOOD && A.WOOD[log]) || { bark: '#7a5236', inner: '#c49158' }, w = hide(W.inner), bark = hide(W.bark), rope = hide('#c8a070'), iron = metal('#8a929c');
  const planks = (xs, y0, y1, ok) => { for (const x of xs) for (let y = y0; y <= y1; y++) { const p = s.at(x, y); if (p && p.r === w && (!ok || ok(x, y))) s.tone(x, y, w, 1); } };
  const rim = (cx, cy, rx, ry, r) => { for (let a = 0; a < 40; a++) { const t = a / 40 * Math.PI * 2, x = Math.round(cx - .5 + Math.cos(t) * (rx - .5)), y = Math.round(cy - .5 + Math.sin(t) * (ry - .5)); s.tone(x, y, r, (Math.cos(t) + Math.sin(t)) < -.3 ? 4 : (Math.cos(t) + Math.sin(t)) > .5 ? 1 : 2); } };
  const shapes = {
    hazel: () => { ball(s, 8, 8, 5.6, 5.6, w); for (let r = 2; r <= 4; r += 2) rim(8, 8, r + 1, r + 1, bark); ball(s, 8, 8, 1.6, 1.6, rope); },                /* a small woven buckler */
    ash: () => { ball(s, 8, 8, 6.6, 6.6, w); planks([4, 8, 12], 1, 14); rim(8, 8, 6.6, 6.6, iron); ball(s, 8, 8, 2.2, 2.2, iron); },
    palm: () => { ball(s, 8, 8, 5.8, 6.8, w); for (let y = 2; y <= 13; y += 2) for (let x = 2 + (y / 2 % 2); x <= 13; x += 2) { const p = s.at(x, y); if (p && p.r === w) s.tone(x, y, bark, 2); } rim(8, 8, 5.8, 6.8, rope); },
    cedar: () => { s.poly([[2, 1.5], [14, 1.5], [14, 8], [8, 15], [2, 8]], w); planks([5, 8, 11], 3, 14); paint(s, ['iiiiiiiiiiii'], { i: iron }, 2, 1); s.fix(5, 6, W.resin || '#f0b040'); s.fix(10, 9, W.resin || '#f0b040'); },
    pine: () => { paint(s, Array(14).fill('...wwwwwwwwww...'), { w }, 0, 1); planks([5, 8, 10], 1, 14); paint(s, ['...iiiiiiiiii...'], { i: iron }, 0, 3); paint(s, ['...iiiiiiiiii...'], { i: iron }, 0, 11); stud(s, 4, 3, iron); stud(s, 11, 11, iron); },
    mangrove: () => { ball(s, 8, 8, 5.2, 7, w); for (let i = 0; i <= 9; i++) { s.tone(4 + Math.round(i * .8), 3 + i, rope, 3); s.tone(11 - Math.round(i * .8), 3 + i, rope, 2); } ball(s, 8, 8, 1.6, 1.6, bark); },
    cinderbark: () => { s.poly([[2.5, 1.5], [13.5, 1.5], [14.5, 7], [8, 15], [1.5, 7]], bark); s.poly([[4.5, 3.5], [11.5, 3.5], [12, 7], [8, 12], [4, 7]], w); for (const [x, y] of [[6, 5], [7, 6], [9, 7], [8, 9]]) s.fix(x, y, '#ffb04a'); s.fix(8, 8, '#fff0a0'); s.fix(3, 3, '#ff7a3a'); s.fix(12, 4, '#ff7a3a'); },
    windpine: () => { s.poly([[8, .5], [14.5, 4.5], [13.5, 12], [8, 15.5], [2.5, 12], [1.5, 4.5]], w); planks([5, 10], 3, 13); const sw = ramp('#eef4fa', { gl: .9 }); paint(s, ['..aa..', '.a..a.', '.a.aa.', '.a....', '..aaa.'], { a: [sw, 3] }, 5, 5); s.fix(7, 7, '#ffffff'); },
    wraithbark: () => { paint(s, ['....wwwwww....', '..wwwwwwwwww..', '.wwwwwwwwwwww.', ...Array(10).fill('.wwwwwwwwwwww.')], { w }, 1, 1); planks([4, 8, 11], 2, 12); paint(s, ['.rrrrrrrrrrrr.'], { r: rope }, 1, 7); for (const [x, y] of [[4, 4], [10, 5], [6, 10], [11, 11]]) s.fix(x, y, W.wisp || '#e0e8ff'); s.fix(10, 4, '#ffffff'); }
  };
  (shapes[log] || shapes.hazel)();
}

/* ================= the named pieces: one hand-drawn design each ================= */
const NAMED = {
  hollow_crown: s => { const m = metal('#b08aff'), b = metal('#7a58c0');
    paint(s, ['......mm......', '......mm......', '.m...mmmm...m.', '.mm..mmmm..mm.', '.mmm.mmmm.mmm.', '.mmmmmmmmmmmm.', '.mmmmmmmmmmmm.'], { m }, 1, 2);
    paint(s, ['bbbbbbbbbbbbbb', 'bbbbbbbbbbbbbb', 'bbbbbbbbbbbbbb'], { b }, 1, 9);
    for (const [x, c] of [[3, '#4ad8c8'], [7, '#e84a8a'], [8, '#e84a8a'], [12, '#4ad8c8']]) { s.fix(x, 10, c); }
    s.fix(7, 1, '#e8ffff'); s.fix(8, 1, '#a0f0ff'); s.fix(2, 3, '#e8ffff'); s.fix(13, 3, '#e8ffff');
    s.fix(10, 4, m.out); s.fix(10, 5, m.out); s.fix(11, 6, m.out); s.fix(11, 7, m.lo); s.fix(11, 8, m.lo); s.tone(6, 4, m, 4); s.tone(6, 5, m, 4); },     /* cracked through, a cold light at the tips */
  chief_helm: s => { const m = metal('#8fbf6a'), bone = ramp('#efe2c4', { lo: .2 }), bnd = hide('#6a4a2e');
    paint(s, ['b....', 'bb...', '.bb..', '..bb.'], { b: bone }, 0, 3); paint(s, ['....b', '...bb', '..bb.', '.bb..'], { b: bone }, 11, 3);   /* tusk horns */
    s.tone(0, 3, bone, 4); s.tone(1, 4, bone, 4); s.tone(15, 3, bone, 3); s.tone(14, 4, bone, 2);
    ball(s, 8, 10, 5.6, 7, m, { clip: (x, y) => y <= 10 });
    paint(s, ['.bbbbbbbbbbbbbb.', '.bbbbbbbbbbbbbb.'], { b: bnd }, 0, 11);
    for (const x of [3, 5, 7, 9, 11, 13]) { s.fix(x, 13, '#e8dcc0'); }                                      /* a fringe of teeth on the band */
    s.fix(9, 5, m.out); s.fix(10, 6, m.lo); s.fix(10, 4, m.lo); stud(s, 4, 8, m); stud(s, 8, 9, m); stud(s, 12, 8, m); s.fix(7, 3, mix('#8fbf6a', '#fff2c8', .7)); },  /* a dented, riveted pot helm */
  tusk_charm: s => { const cord = hide('#7a5236'), t = ramp('#efe2c4', { lo: .2 });
    for (let i = 0; i <= 5; i++) { s.tone(2 + i, 1 + i, cord, 3); s.tone(13 - i, 1 + i, cord, 2); }
    s.tone(7, 7, cord, 1); s.tone(8, 7, cord, 1); ball(s, 8, 7.5, 1.4, 1.4, metal('#c8803a'));
    paint(s, ['.tt....', '.ttt...', '..ttt..', '...ttt.', '....tt.', '....tt.', '...tt..'], { t }, 5, 8); s.tone(6, 8, t, 4); s.tone(7, 9, t, 4); s.tone(10, 12, t, 1); s.tone(9, 14, t, 1); },
  storm_feather: s => { const f = ramp('#bfe8ff', { gl: .8 }), q = ramp('#e8eef4'), bnd = metal('#d8dce4');
    for (let i = 0; i < 9; i++) { s.tone(4 + i, 11 - i, f, 3); s.tone(5 + i, 11 - i, f, 2); s.tone(4 + i, 10 - i, f, 4); s.tone(5 + i, 12 - i, f, 1); }
    s.line(2, 14, 12, 3, q); paint(s, ['bb', 'bb'], { b: bnd }, 3, 11); s.tone(3, 11, bnd, 4);
    s.fix(9, 4, '#fff6a0'); s.fix(10, 5, '#fff6a0'); s.fix(9, 6, '#fff6a0'); s.fix(10, 7, '#ffffff'); },                                       /* a silver band at the quill, a lightning glint */
  frostmaw_pendant: s => { chain(s, metal('#d8dce4'), 2, 13, 7); const ice = ramp('#bfe6ff', { gl: .9 });
    paint(s, ['.aab.', 'aaabb', 'aaabb', '.aab.', '.aab.', '..ab.', '..a..'], { a: [ice, 3], b: [ice, 1] }, 5, 8); s.tone(6, 9, ice, 4); s.fix(6, 10, '#ffffff'); s.fix(4, 11, '#e8f6ff'); s.fix(11, 9, '#e8f6ff'); },
  thornback_buckler: s => { const sh = hide('#c87a5a'), th = ramp('#e8c8a8'), b = metal('#8a4a3a');
    for (let a = 0; a < 8; a++) { const t = a * Math.PI / 4 + Math.PI / 8, x = Math.round(7.5 + Math.cos(t) * 6.6), y = Math.round(7.5 + Math.sin(t) * 6.6); s.tone(x, y, th, (Math.cos(t) + Math.sin(t)) < 0 ? 4 : 2); }
    ball(s, 8, 8, 5.6, 5.6, sh); for (let i = 0; i < 6; i++) { const t = i * Math.PI / 3; s.tone(Math.round(7.5 + Math.cos(t) * 3.6), Math.round(7.5 + Math.sin(t) * 3.6), sh, 1); }
    ball(s, 8, 8, 2.2, 2.2, b); },
  wardens_greathelm: s => { const m = metal('#7a8aa0'), pl = ramp('#3f6fd6');
    paint(s, ['.pp.', 'ppp.', '.pp.'], { p: pl }, 6, 0);
    ball(s, 8, 5.4, 5, 2.8, m, { clip: (x, y) => y <= 5 });
    paint(s, Array(9).fill('...mmmmmmmmmm...'), { m }, 0, 5); paint(s, ['....mmmmmmmm....'], { m }, 0, 14);
    for (let x = 4; x <= 11; x++) if (x !== 7 && x !== 8) s.fix(x, 8, DARK);
    for (let y = 9; y <= 13; y++) { s.tone(7, y, m, 3); s.tone(8, y, m, 1); }
    for (const [x, y] of [[5, 11], [5, 12], [10, 11], [10, 12]]) s.fix(x, y, DARK); stud(s, 4, 6, m); stud(s, 11, 6, m); s.tone(4, 4, m, 4); },
  smugglers_knot: s => { const a = hide('#b89a5a'), b = hide('#7a5e3a');
    for (let i = 0; i < 28; i++) { const t = i / 28 * Math.PI * 2, x = Math.round(7.5 + Math.cos(t) * 4.6), y = Math.round(9.5 + Math.sin(t) * 4.2), c = (i >> 1) % 2 ? a : b; s.tone(x, y, c, (Math.cos(t) + Math.sin(t)) < 0 ? 3 : 2); }
    ball(s, 8, 4, 2.8, 2.2, a); s.tone(6, 3, a, 4); s.tone(8, 3, b, 1); s.tone(8, 4, b, 1); s.tone(5, 6, b, 2); s.tone(11, 6, b, 2); s.tone(4, 1, a, 3); s.tone(11, 1, a, 2); s.tone(5, 2, a, 3); s.tone(10, 2, a, 2); },
  berserkers_torc: s => { const g = metal('#c8803a'), head = metal('#d8a04a');
    for (let i = 0; i <= 20; i++) { const t = Math.PI * (.75 + i / 20 * 1.5), x = Math.round(7.5 + Math.cos(t) * 5.4), y = Math.round(7.5 - Math.sin(t) * 5.2); s.tone(x, y, g, i % 2 ? 2 : (x < 8 ? 4 : 3)); s.tone(x, y + 1, g, i % 2 ? 3 : 1); }
    ball(s, 4.5, 3, 2, 1.8, head); ball(s, 11.5, 3, 2, 1.8, head); s.fix(4, 2, '#ff3030'); s.fix(11, 2, '#ff3030'); s.fix(3, 3, head.out); s.fix(12, 3, head.out); },      /* twisted copper, two snarling terminals with red eyes */
  thornweave_vest: s => { jerkin(s, '#7a9a4a', 'thorn'); const v = hide('#4a3a22');
    for (const [x, y] of [[4, 4], [5, 5], [5, 6], [4, 7], [4, 8], [5, 9], [10, 4], [10, 5], [11, 6], [11, 7], [10, 8], [10, 9]]) s.tone(x, y, v, 2);
    for (const [x, y] of [[6, 5], [3, 7], [12, 6], [9, 8]]) s.fix(x, y, '#f0e4c0'); },                  /* bramble stitched into boiled hide */
  tidewalker_greaves: s => { const h = hide('#5a9ab8'), m = metal('#c0ccd4'), belly = hide('#d8e4ea');
    paint(s, ['...mmmmmmmmmm...', '...mmmmmmmmmm...', '...hhhhhhhhhh...', '...hhhhhhhhhh...', '...hhhh..hhhh...', '...hhhh..hhhh...', '...hhhh..hhhh...', '...hhhh..hhhh...', '...hhhh..hhhh...', '...hhhh..hhhh...', '...hhhh..hhhh...', '..mmmmm..mmmmm..'], { h, m }, 0, 2);
    for (let y = 6; y <= 12; y++) { s.tone(6, y, belly, y % 2 ? 2 : 3); s.tone(9, y, belly, y % 2 ? 2 : 3); }                       /* pale shark belly down the inside */
    for (const x0 of [3, 9]) { paint(s, ['.kk.', 'kkkk', '.kk.'], { k: m }, x0, 8); s.tone(x0 + 1, 8, m, 4); s.tone(x0 + 3, 9, m, 1); }
    paint(s, ['f.', 'ff', 'ff'], { f: h }, 1, 9); paint(s, ['.f', 'ff', 'ff'], { f: h }, 13, 9); s.tone(1, 9, h, 4); s.tone(14, 9, h, 3);   /* fins */
    stud(s, 4, 2, m); stud(s, 11, 2, m); s.tone(4, 4, h, 4); },
  stargazer_hood: s => { hoodSprite(s, '#b8a8f0', 1); const night = ramp('#1a1a48');
    s.fix(6, 9, night.base); s.fix(9, 9, night.base); s.fix(7, 11, '#fff6c0'); s.fix(9, 10, '#c8d8ff');                                       /* no face: a scrap of night sky */
    for (const [x, y, c] of [[3, 7, '#fff6c0'], [12, 9, '#ffffff'], [11, 4, '#fff6c0']]) s.fix(x, y, c);
    gem(s, 8, 5.5, 1, 1, '#4a7fe0'); s.fix(10, 1, '#ffffff'); s.fix(11, 0, '#fff6c0'); s.fix(12, 0, '#c8b0ff'); },                    /* night inside, a fallen star on the peak */
  squeaks_crown: s => { const m = metal('#e8c860'), tail = ramp('#d89a9a');
    paint(s, ['.m.........m..', '.mm...m....mm.', '.mmm.mmm..mmm.', '.mmmmmmmmmmmm.', '.mmmmmmmmmmmm.', 'mmmmmmmmmmmmm.', 'mmmmmmmmmmmm..'], { m }, 1, 5);
    for (let x = 1; x <= 13; x++) s.tone(x, 9 + (x > 8 ? 0 : 0), m, x < 5 ? 4 : 3); for (let x = 1; x <= 12; x++) s.tone(x, 11, m, 1);
    s.fix(6, 9, m.out); s.fix(7, 10, m.lo); s.fix(10, 8, m.lo); s.fix(4, 10, '#c8302a'); s.fix(9, 10, '#3a7ac8');                       /* bent tin, a dent, glass jewels */
    for (const [x, y] of [[14, 10], [15, 9], [15, 8], [14, 7], [13, 7]]) s.tone(x, y, tail, 2); s.tone(2, 5, m, 4); },               /* and a rat's tail wound round it */
  rimebeards_bulwark: s => { const m = metal('#a8d0e8'), rim = metal('#6a7e90'), ice = ramp('#eef8ff', { gl: .9 });
    ball(s, 8, 7.6, 6.6, 6.6, rim); ball(s, 8, 7.6, 5.4, 5.4, m); ball(s, 8, 7.6, 1.8, 1.8, rim);
    for (const [x, y] of [[5, 4], [6, 5], [4, 7], [11, 5], [10, 9], [11, 10]]) s.fix(x, y, '#f4fcff');
    for (const [x, y0, l] of [[4, 13, 2], [6, 14, 2], [9, 14, 1], [11, 13, 2]]) for (let i = 0; i < l; i++) s.tone(x, y0 + i, ice, i ? 2 : 3);   /* icicles off the lower rim */
    s.fix(6, 6, '#ffffff'); },
  abbots_censer: s => { const ch = metal('#a8a090'), m = metal('#8ab8a0'), smoke = ramp('#c8c8d0');
    for (let y = 1; y <= 5; y++) { s.tone(7, y, ch, y % 2 ? 4 : 2); } s.tone(3, 1, ch, 3); s.tone(4, 2, ch, 3); s.tone(5, 3, ch, 3); s.tone(6, 4, ch, 3); s.tone(12, 1, ch, 2); s.tone(11, 2, ch, 2); s.tone(10, 3, ch, 2); s.tone(9, 4, ch, 2);
    ball(s, 8, 7, 2.4, 1.6, m); ball(s, 8, 10, 3.6, 2.8, m, { clip: (x, y) => y >= 8 }); paint(s, ['mmmmmmm'], { m }, 4, 8);
    for (const x of [5, 7, 9, 11]) s.tone(x, 10, m, 1); for (const x of [6, 8, 10]) s.tone(x, 11, m, 1);
    for (const [x, y] of [[7, 13], [8, 13], [6, 14], [9, 14], [10, 14], [5, 15], [11, 15]]) s.tone(x, y, smoke, (x + y) % 2 ? 3 : 2); },               /* the smoke goes down, not up */
  shadow_mantle: s => { const c = cloth('#6a5a9a'), d = cloth('#3a2e5a'), wisp = ramp('#b8a8f0');
    s.poly([[5, 1.5], [10.5, 1.5], [14.5, 13], [1.5, 13]], c);
    ball(s, 8, 4, 3.2, 2.6, d, { flat: true }); for (let x = 6; x <= 9; x++) s.tone(x, 2, d, 1);
    for (let y = 6; y <= 12; y++) { s.tone(8, y, d, 1); s.tone(Math.round(5 - (y - 6) * .3), y, c, 1); s.tone(Math.round(11 + (y - 6) * .35), y, c, 3); }
    for (const x of [2, 4, 6, 9, 11, 13]) s.tone(x, 14, c, 2); for (const x of [3, 5, 10, 12]) s.tone(x, 14, wisp, 3);                      /* a hem that frays into smoke */
    gem(s, 8, 7, 1, 1, '#b878ff'); s.tone(6, 3, c, 4); s.tone(5, 2, c, 4); },
  salamander_coat: s => { const h = hide('#e0703a'), d = hide('#7a3a1a');
    paint(s, ['....hhh..hhh....', '..hhhhhddhhhhh..', '.hhhhhhddhhhhhh.', '.hhhhhhddhhhhhh.', '.hh.hhhddhhh.hh.', '.hh.hhhddhhh.hh.', '....hhhddhhh....', '...hhhhddhhhh...', '...hhhhddhhhh...', '..hhhhhddhhhhh..', '..hhhhhddhhhhh..', '..hhhhh..hhhhh..'], { h, d }, 0, 2);
    for (const [x, y] of [[4, 5], [5, 8], [10, 6], [11, 9], [4, 11], [10, 12], [12, 4], [3, 4]]) s.fix(x, y, '#ffc04a'); for (const y of [5, 8, 11]) { s.fix(7, y, '#f2c84a'); s.fix(8, y, '#b8862a'); } s.tone(4, 2, h, 4); }
};

/* ---------- the dispatch ---------- */
function mine(id) {
  const it = D.ITEMS[id]; if (!it || !['head', 'body', 'legs', 'shield', 'ring', 'amulet'].includes(it.slot)) return null;
  const s = Spr(16, 16), col = it.col || '#999999';
  if (NAMED[id]) { NAMED[id](s); return s; }
  if (it.wood && it.slot === 'shield') { woodShield(s, id.replace(/_shield$/, '')); return s; }
  if (it.charm) { charm(s, id.replace(/_charm$/, '')); return s; }
  const tier = TIERS.find(t => id.startsWith(t + '_'));
  if (tier) { ({ head: fullHelm, body: plateBody, legs: plateLegs, shield: kite })[it.slot]?.(s, col, tier); return s; }
  const robe = /^robe_(\w+?)_(head|body|legs)$/.exec(id);
  if (robe) { const rank = ROBE[robe[1]] ?? 0; ({ head: hoodSprite, body: robeTop, legs: robeBottom })[it.slot](s, col, rank); return s; }
  const lth = /^(\w+?)_(coif|vest|chaps)$/.exec(id);
  if (lth && HIDE[lth[1]]) { ({ coif, vest: jerkin, chaps })[lth[2]](s, col, HIDE[lth[1]]); return s; }
  const jew = /^(ring|amulet)_(\w+)$/.exec(id);
  if (jew) { (jew[1] === 'ring' ? ringSprite : amuletSprite)(s, jew[2], col); return s; }
  return null;
}
const base = A.itemSprite;
A.itemSprite = id => mine(id) || base(id);
A.itemUrl = id => A.url('item:' + id, () => A.itemSprite(id));
A.armourSprite = mine;
})();
