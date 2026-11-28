/* Idlewick pixel art: what the hunting ground gives and what Hunting and Beastmastery use (owner, 28 Nov 2026), 16 x 16
   in the chunky outlined style (docs/pixel-art-style.md): light from the top left, five-step ramps, sphere-lit round
   forms and a one-pixel outline in each material's darkest colour, every part drawn and outlined on its own layer.
   Raw cuts are pink or red with their own bone, fat or skin (a drumstick, a saddle, a plucked bird, a scored breast,
   a goose, a joint with rind, a chop, a haunch, a T-bone, a slab); the cooked dishes are browned on a plate, each with
   its own garnish. The hides, horn, antler, fat, down and ivory; the eight hunting lures, each in its own bowl, pot or
   form; the seed cake; the four new capture tools. Loaded after pixel_items_food.js: it wraps the item dispatch and
   tells the materials test which kit and materials it draws (A.materialItem). */
(() => {
const DQ = window.DQ, D = DQ && DQ.data, A = DQ && DQ.pixelArt; if (!A || !A.itemSprite || !D) return;
const { Spr, ramp } = A;
const rp = (c, o) => ramp(c, o);
const WHITE = '#fffaf0';
/* each layer drawn and outlined on its own, later ones on top; { f, outline: false } for loose details */
function layers(...ls) {
  const out = new Array(256).fill(null);
  for (const l of ls) { if (!l) continue; const f = l.f || l, t = Spr(16, 16); f(t); const c = t.render(l.outline === false ? { outline: false } : undefined); c.forEach((v, i) => { if (v) out[i] = v; }); }
  const s = Spr(16, 16); out.forEach((v, i) => { if (v) s.fix(i % 16, (i / 16) | 0, v); });
  s.render = () => out.slice();
  return s;
}
const plate = s => { s.ell(8, 12.4, 7.2, 2.6, rp('#e8e2d4'), { flat: true }); };
const bone = (s, x0, y0, x1, y1) => { const b = rp('#f0e6cc'); s.line(x0, y0, x1, y1, b); s.line(x0 + 1, y0, x1 + 1, y1, b); s.ell(x1 + .5, y1, 1.4, 1.4, b); };
const loose = f => ({ f, outline: false });

/* ---------- raw cuts ---------- */
const RAW = {
  raw_chicken: () => layers(s => { s.ell(6.5, 6.5, 4.6, 4.2, rp('#f2c2a8')); s.fix(5, 5, '#fff0e4'); }, s => bone(s, 9, 9, 12, 12), loose(s => { s.fix(4, 8, '#e8a090'); s.fix(7, 9, '#e8a090'); })),
  raw_rabbit: () => layers(s => { s.poly([[2, 7], [9, 4], [13, 6], [12, 10], [5, 12], [2, 10]], rp('#d89a8a')); s.line(4, 8, 11, 6, null, '#c07a6e'); }, s => bone(s, 12, 7, 14, 5), loose(s => { s.fix(5, 7, '#f6d8cc'); s.fix(8, 9, '#f6d8cc'); })),
  raw_gamebird: () => layers(s => { s.ell(8, 9, 5, 4, rp('#e8b49c')); s.ell(12.5, 5, 1.6, 2, rp('#e8b49c')); }, s => { s.line(6, 12, 5, 15, rp('#d8a070')); s.line(10, 12, 11, 15, rp('#d8a070')); },
    loose(s => { for (const [x, y] of [[6, 8], [9, 7], [7, 10], [10, 10], [5, 9]]) s.fix(x, y, '#d0907c'); s.fix(6, 6, '#fff0e4'); })),
  raw_duck: () => layers(s => { s.ell(8, 9.5, 6.2, 3.6, rp('#c8786a')); }, s => { s.line(3, 7, 13, 7, rp('#f0dcc0')); s.line(4, 6, 12, 6, rp('#f0dcc0')); },
    loose(s => { for (const x of [5, 8, 11]) { s.fix(x, 9, '#9a4a40'); s.fix(x + 1, 10, '#9a4a40'); } })),
  raw_goose: () => layers(s => { s.ell(7.5, 10, 6.2, 4.4, rp('#f0d0b8')); }, s => { s.poly([[11, 8], [13, 3], [15, 3], [13, 9]], rp('#f0d0b8')); }, s => { s.line(5, 14, 4, 15, rp('#e89040')); s.line(9, 14, 10, 15, rp('#e89040')); },
    loose(s => { s.fix(5, 8, '#fff6ee'); s.fix(6, 8, '#fff6ee'); for (const [x, y] of [[4, 11], [8, 12], [10, 10]]) s.fix(x, y, '#d8a890'); })),
  raw_boar: () => layers(s => { s.poly([[2, 6], [13, 4], [14, 11], [3, 13]], rp('#c86a6a')); }, s => { s.poly([[2, 6], [13, 4], [13, 6], [2, 8]], rp('#c89a7a')); },
    loose(s => { for (const [x, y] of [[4, 6], [7, 5], [10, 5], [12, 5]]) s.fix(x, y, '#5a3a2a'); s.fix(6, 10, '#f0d8c8'); s.fix(10, 9, '#f0d8c8'); })),
  raw_mutton: () => layers(s => { s.ell(6, 9, 4.4, 3.8, rp('#c85a5a')); }, s => { s.line(9, 8, 14, 3, rp('#f0e6cc')); s.line(9, 9, 14, 4, rp('#f0e6cc')); }, s => { for (let a = 0; a < 7; a++) s.dot(2 + a, 12 - Math.abs(a - 3) * .6, rp('#f4e8d8')); },
    loose(s => { s.fix(5, 8, '#e88a8a'); s.fix(6, 9, '#8a2a2a'); })),
  raw_venison: () => layers(s => { s.poly([[3, 3], [9, 2], [14, 7], [12, 13], [5, 13], [2, 8]], rp('#a8403a')); }, s => bone(s, 12, 11, 13, 14),
    loose(s => { s.line(4, 6, 12, 5, null, '#e8d8b0'); for (const [x, y] of [[6, 9], [9, 8], [8, 11]]) s.fix(x, y, '#e8a8a0'); })),
  raw_beef: () => layers(s => { s.ell(8, 8.5, 6.4, 5.2, rp('#b8443e')); }, s => { s.line(4, 5, 12, 5, rp('#f2ead6')); s.line(8, 5, 8, 12, rp('#f2ead6')); },
    loose(s => { for (const [x, y] of [[5, 8], [11, 8], [5, 11], [11, 11], [6, 9]]) s.fix(x, y, '#f0c0b0'); s.line(2, 9, 2, 10, null, '#f4e4d0'); })),
  raw_bear: () => layers(s => { s.rect(2, 5, 12, 7, rp('#8a3a34')); }, s => { s.rect(2, 4, 12, 2, rp('#e8d8b8')); },
    loose(s => { for (const [x, y] of [[4, 8], [7, 9], [10, 7], [12, 10], [5, 10]]) s.fix(x, y, '#c87070'); s.line(3, 12, 13, 12, null, '#5a2420'); }))
};
/* ---------- cooked, each on a plate with its own garnish ---------- */
const COOKED = {
  roast_chicken: () => layers(plate, s => { s.ell(6.5, 8, 4.2, 3.6, rp('#c8843a')); }, s => bone(s, 9, 10, 12, 12), loose(s => { s.fix(5, 6, '#f0c070'); s.fix(13, 9, '#6a9a4a'); s.fix(14, 10, '#6a9a4a'); })),
  roast_rabbit: () => layers(plate, s => { s.poly([[3, 9], [9, 6], [13, 8], [11, 11], [4, 12]], rp('#a86a3a')); }, s => bone(s, 12, 8, 14, 6), loose(s => { s.line(4, 9, 10, 7, null, '#d8a060'); s.fix(2, 11, '#5a8a3a'); s.fix(3, 10, '#7aaa4a'); })),
  roast_gamebird: () => layers(plate, s => { s.ell(8, 9, 4.6, 3.4, rp('#b86a2a')); }, s => { s.line(5, 11, 3, 13, rp('#e8d0a0')); s.line(11, 11, 13, 13, rp('#e8d0a0')); }, loose(s => { s.fix(6, 7, '#f0b060'); s.fix(8, 8, '#8a4a1a'); s.fix(10, 9, '#8a4a1a'); })),
  roast_duck: () => layers(plate, s => { for (const [x, y] of [[4, 9], [7, 8], [10, 9]]) s.ell(x, y, 1.8, 3.2, rp('#c87a5a')); }, loose(s => { for (const x of [4, 7, 10]) s.fix(x, 6, '#6a3a1a'); s.fix(13, 11, '#e88a2a'); s.fix(12, 12, '#e88a2a'); })),
  roast_goose: () => layers(plate, s => { s.ell(7.5, 8.5, 5.6, 3.8, rp('#d8963a')); }, s => { s.ell(13, 10, 1.6, 1.6, rp('#c83a2a')); }, loose(s => { s.fix(5, 7, '#f8d080'); s.fix(6, 7, '#f8d080'); s.line(4, 10, 10, 10, null, '#a8601a'); })),
  roast_boar: () => layers(plate, s => { s.poly([[3, 7], [12, 5], [13, 10], [4, 11]], rp('#9a5a32')); }, s => { s.poly([[3, 7], [12, 5], [12, 7], [3, 9]], rp('#e0b060')); }, loose(s => { for (const x of [5, 7, 9, 11]) s.fix(x, 7 - (x - 3) / 5, '#8a5020'); s.fix(14, 11, '#6a9a4a'); })),
  mutton_chop: () => layers(plate, s => { s.ell(6, 9, 3.8, 3, rp('#8a4a2a')); }, s => { s.line(8, 8, 13, 4, rp('#f0e6cc')); s.line(8, 9, 13, 5, rp('#f0e6cc')); }, loose(s => { s.line(4, 8, 7, 10, null, '#4a2414'); s.line(5, 7, 8, 9, null, '#4a2414'); s.fix(13, 11, '#5a8a3a'); })),
  venison_steak: () => layers(plate, s => { s.ell(7, 8.5, 5, 3.6, rp('#5a2a22')); }, loose(s => { for (const [x, y] of [[11, 10], [12, 9], [13, 11], [12, 11]]) s.fix(x, y, '#c82a4a'); s.line(4, 7, 9, 10, null, '#2a1410'); s.fix(5, 7, '#8a4a3a'); })),
  beef_steak: () => layers(plate, s => { s.ell(8, 8.5, 5.6, 3.8, rp('#6a3424')); }, s => { s.line(5, 6, 11, 6, rp('#f2ead6')); s.line(8, 6, 8, 11, rp('#f2ead6')); }, loose(s => { s.line(4, 9, 6, 11, null, '#2a140e'); s.line(10, 8, 12, 10, null, '#2a140e'); s.fix(14, 12, '#5a8a3a'); })),
  bear_steak: () => layers(plate, s => { s.rect(3, 6, 10, 5, rp('#4a2420')); }, s => { s.ell(13, 9, 1.6, 1.4, rp('#8a6a4a')); }, loose(s => { s.line(4, 7, 11, 7, null, '#7a3a30'); s.line(4, 9, 11, 9, null, '#2a1210'); s.fix(2, 11, '#6a9a4a'); }))
};
/* ---------- hides, horn, fat, down ---------- */
const MATS = {
  fur_pelt: () => layers(s => { const f = rp('#a8805a'); s.ell(8, 8, 5, 4.4, f); s.rect(2, 4, 2, 2, f); s.rect(12, 4, 2, 2, f); s.rect(2, 11, 2, 2, f); s.rect(12, 11, 2, 2, f); s.poly([[7, 12], [9, 12], [8, 15]], f); },
    loose(s => { for (const [x, y] of [[6, 6], [9, 6], [7, 9], [10, 9], [8, 7]]) s.fix(x, y, '#d8b88a'); s.fix(5, 5, '#e8d0a8'); })),
  deer_hide: () => layers(s => { s.poly([[2, 3], [6, 2], [10, 2], [14, 3], [13, 8], [14, 13], [10, 14], [6, 14], [2, 13], [3, 8]], rp('#b8875a')); },
    loose(s => { for (const [x, y] of [[5, 5], [9, 4], [11, 7], [6, 9], [9, 10], [4, 11], [11, 11]]) s.fix(x, y, '#f4ecd8'); s.line(8, 3, 8, 13, null, '#8a5e3a'); })),
  antler: () => layers(s => { const a = rp('#e2d2b0'); s.line(4, 15, 7, 8, a); s.line(5, 15, 8, 8, a); s.line(7, 8, 6, 2, a); s.line(7, 9, 12, 4, a); s.line(10, 6, 13, 7, a); s.line(7, 5, 3, 3, a); s.ell(4.5, 14.5, 1.6, 1.2, rp('#a8906a')); },
    loose(s => { s.fix(6, 3, WHITE); s.fix(12, 4, WHITE); })),
  horn: () => layers(s => { const h = rp('#5a4a3a'); for (let i = 0; i <= 10; i++) { const a = i / 10, x = 3 + a * 10, y = 13 - Math.sin(a * Math.PI) * 9, w = 2.6 - a * 1.8; s.ell(x, y, w, w, h); } },
    loose(s => { s.fix(13, 12, '#e8dcc0'); s.fix(12, 12, '#c8b898'); for (const x of [5, 7, 9]) s.fix(x, 13 - Math.round(Math.sin((x - 3) / 10 * Math.PI) * 9), '#8a7a62'); })),
  bear_pelt: () => layers(s => { const b = rp('#5a3e2a'); s.poly([[4, 4], [12, 4], [15, 9], [13, 15], [3, 15], [1, 9]], b); s.ell(8, 3.5, 3.2, 2.8, b); s.ell(5.5, 1.5, 1.2, 1.2, b); s.ell(10.5, 1.5, 1.2, 1.2, b); },
    loose(s => { s.fix(7, 3, '#141010'); s.fix(9, 3, '#141010'); for (const [x, y] of [[1, 9], [15, 9], [3, 15], [13, 15]]) s.fix(x, y, '#e8e0d0'); s.line(8, 6, 8, 13, null, '#3a2818'); })),
  tallow: () => layers(s => { s.rect(3, 6, 10, 7, rp('#efe2b0')); s.ell(8, 6, 5, 1.6, rp('#f8f0d0'), { flat: true }); }, s => { s.rect(2, 12, 12, 2, rp('#8a6a44')); },
    loose(s => { s.fix(5, 5, WHITE); s.fix(6, 5, WHITE); s.line(4, 8, 4, 11, null, '#d8c890'); })),
  down: () => layers(s => { const w = rp('#f4f0e6'); s.ell(5, 9, 3, 2.6, w); s.ell(10, 7, 3.4, 3, w); s.ell(10, 12, 2.6, 2.2, w); },
    loose(s => { for (const [x, y] of [[4, 8], [9, 6], [10, 11], [12, 8]]) s.fix(x, y, WHITE); s.line(11, 3, 13, 1, null, '#c8c0b0'); })),
  ivory: () => layers(s => { const v = rp('#f4ecd6'); for (let i = 0; i <= 12; i++) { const a = i / 12, x = 2 + a * 11, y = 4 + a * 9 - Math.sin(a * Math.PI) * 3, w = 2.4 - a * 1.7; s.ell(x, y, w, w, v); } }, s => { s.ell(2.5, 4, 2.2, 2.2, rp('#c8a878')); },
    loose(s => { s.fix(6, 4, WHITE); s.fix(9, 7, WHITE); })),
  salt: () => layers(s => { s.ell(8, 11, 6, 3, rp('#e4ecf0')); s.poly([[4, 10], [8, 5], [12, 10]], rp('#e4ecf0')); }, s => { s.line(11, 5, 14, 2, rp('#a8784a')); s.ell(10, 6, 1.6, 1.2, rp('#a8784a')); },
    loose(s => { for (const [x, y] of [[6, 9], [8, 7], [10, 10], [5, 12], [11, 12]]) s.fix(x, y, '#ffffff'); s.fix(3, 13, '#b8c8d0'); }))
};
/* ---------- the eight lures and the seed cake ---------- */
const bowl = (s, c) => { s.ell(8, 11, 6.4, 3.4, rp(c)); s.rect(2, 9, 13, 2, rp(c)); };
const LURE = {
  grain_mash: () => layers(s => bowl(s, '#8a6a44'), s => { s.ell(8, 9, 5.4, 1.8, rp('#d8b46a'), { flat: true }); }, loose(s => { for (const [x, y] of [[5, 9], [7, 8], [9, 9], [11, 8], [8, 10]]) s.fix(x, y, '#f0d890'); })),
  root_mash: () => layers(s => { s.poly([[3, 7], [13, 7], [12, 14], [4, 14]], rp('#b8603a')); }, s => { s.ell(8, 7, 5, 1.6, rp('#b88a5a'), { flat: true }); }, loose(s => { s.line(6, 6, 7, 3, null, '#c8a070'); s.line(10, 6, 12, 4, null, '#c8a070'); s.fix(5, 10, '#8a4020'); })),
  clover_cake: () => layers(s => { s.ell(8, 10, 6, 3.6, rp('#7aa85a')); }, s => { for (const [x, y] of [[7, 6], [9, 6], [8, 4]]) s.ell(x, y, 1.6, 1.6, rp('#4a8a3a')); }, loose(s => { s.line(8, 7, 8, 9, null, '#3a6a2a'); s.fix(5, 9, '#a8d080'); s.fix(11, 11, '#a8d080'); })),
  salt_lick: () => layers(s => { s.poly([[3, 6], [10, 4], [14, 7], [14, 13], [7, 15], [3, 12]], rp('#e4ecf0')); }, s => { s.line(8, 1, 8, 5, rp('#a8784a')); },
    loose(s => { s.ell(8, 9, 2, 1.4, rp('#b8c8d0'), { flat: true }); s.line(10, 5, 14, 7, null, '#ffffff'); s.fix(5, 7, '#ffffff'); })),
  berry_mash: () => layers(s => bowl(s, '#c8c0b0'), s => { s.ell(8, 9, 5.4, 1.8, rp('#c8405a'), { flat: true }); }, s => { for (const [x, y] of [[5, 7], [8, 6], [11, 7]]) s.ell(x, y, 1.4, 1.4, rp('#d8304a')); }, loose(s => { s.fix(8, 5, '#5a8a3a'); s.fix(5, 6, '#ffd0d8'); })),
  carrion_bait: () => layers(s => { s.ell(8, 10, 4.6, 3.8, rp('#8a4a3a')); }, s => { s.line(8, 1, 8, 6, rp('#9aa0a8')); s.line(8, 6, 10, 7, rp('#9aa0a8')); },
    loose(s => { for (const [x, y] of [[3, 4], [13, 5], [12, 2]]) { s.fix(x, y, '#2a2a2a'); s.fix(x + 1, y, '#a8c8d8'); } s.fix(6, 9, '#c87a6a'); s.fix(9, 12, '#5a2a20'); })),
  fishoil_bait: () => layers(s => { s.ell(7, 10, 4.6, 4.4, rp('#8aa0a8', { gl: .85 })); s.rect(5, 3, 4, 3, rp('#8aa0a8', { gl: .85 })); }, s => { s.rect(5, 1, 4, 2, rp('#8a6a44')); }, s => { s.poly([[11, 9], [15, 6], [15, 12]], rp('#7a8a9a')); },
    loose(s => { s.fix(5, 8, '#ffffff'); s.line(4, 12, 9, 12, null, '#c8b868'); })),
  honey_cake: () => layers(s => { s.ell(8, 10, 6, 3.6, rp('#c8883a')); s.rect(2, 8, 13, 2, rp('#c8883a')); }, s => { s.ell(8, 7.6, 5.4, 1.8, rp('#e8a830', { gl: .9 }), { flat: true }); },
    loose(s => { s.line(4, 8, 4, 11, null, '#f0b840'); s.line(11, 8, 11, 12, null, '#f0b840'); s.fix(7, 7, '#fff0a0'); for (const x of [5, 8, 10]) s.fix(x, 12, '#8a5a2a'); })),
  seed_cake: () => layers(s => { s.ell(8, 9.5, 6, 4.4, rp('#c8a868')); }, loose(s => { for (const [x, y] of [[5, 8], [7, 7], [10, 8], [6, 10], [9, 10], [11, 11], [8, 12]]) s.fix(x, y, '#5a4a2a'); s.fix(5, 6, '#f0dca0'); }))
};
/* ---------- the new capture tools ---------- */
const TOOL = {
  fowling_net: () => layers(s => { const w = rp('#8a6a44'); for (let i = 0; i < 40; i++) { const a = i / 40 * Math.PI * 2; s.dot(8 + Math.cos(a) * 6, 8 + Math.sin(a) * 6, w); s.dot(8 + Math.cos(a) * 6.8, 8 + Math.sin(a) * 6.8, w); } }, loose(s => {
    for (let y = 3; y <= 13; y++) for (let x = 3; x <= 13; x++) { const dx = x - 8, dy = y - 8; if (dx * dx + dy * dy > 25) continue; s.fix(x, y, (x + y) % 3 === 0 || (x - y + 30) % 3 === 0 ? '#e8dcb0' : '#2a2018'); } s.line(13, 13, 15, 15, null, '#6a4a2a'); })),
  rope_halter: () => layers(s => { const r = rp('#b08a5a'); for (let i = 0; i < 24; i++) { const a = i / 24 * Math.PI * 2; s.ell(7 + Math.cos(a) * 4.6, 7 + Math.sin(a) * 3.4, 1, 1, r); } s.line(9, 11, 14, 15, r); },
    loose(s => { for (const [x, y] of [[3, 7], [11, 7], [7, 4]]) { s.fix(x, y, '#e8c890'); s.fix(x, y + 1, '#6a4a2a'); } s.fix(14, 15, '#e8c890'); })),
  warded_snare: () => layers(s => { const c = rp('#c8a070'); for (let i = 0; i < 20; i++) { const a = i / 20 * Math.PI * 2; s.dot(8 + Math.cos(a) * 5, 7 + Math.sin(a) * 4.4, c); } s.line(8, 11, 8, 15, c); }, s => { s.rect(1, 5, 3, 4, rp('#8ab0c8')); s.rect(12, 5, 3, 4, rp('#8ab0c8')); }, s => { s.line(6, 14, 10, 14, rp('#e2d2b0')); },
    loose(s => { s.fix(2, 6, '#2a4a6a'); s.fix(2, 7, '#bfe6ff'); s.fix(13, 6, '#2a4a6a'); s.fix(13, 7, '#bfe6ff'); s.fix(8, 3, '#bfe6ff'); })),
  mithril_halter: () => layers(s => { const st = rp('#7a5a3a'); s.line(2, 4, 12, 4, st); s.line(2, 5, 12, 5, st); s.line(3, 4, 3, 12, st); s.line(11, 4, 11, 12, st); s.line(3, 11, 11, 11, st); },
    s => { const m = rp('#6c7fe0', { gl: .8 }); for (const [x, y] of [[3, 4], [11, 4], [3, 11], [11, 11]]) s.ell(x, y, 1.6, 1.6, m); s.ell(12.5, 13.5, 1.8, 1.8, m); },
    loose(s => { s.line(12, 12, 14, 15, null, '#5a4030'); s.fix(2, 3, '#e8ecff'); s.fix(10, 3, '#e8ecff'); }))
};
const ALL = { ...RAW, ...COOKED, ...MATS, ...LURE, ...TOOL };
const mine = id => ALL[id] && D.ITEMS[id] ? ALL[id]() : null;
const base = A.itemSprite;
A.itemSprite = id => mine(id) || base(id);
A.itemUrl = id => A.url('item:' + id, () => A.itemSprite(id));
const mat0 = A.materialItem; A.materialItem = id => !!(MATS[id] || LURE[id] || TOOL[id]) || (mat0 ? mat0(id) : false);
const has0 = A.hasItem; if (has0) A.hasItem = id => !!ALL[id] || has0(id);
A.HUNT_ITEM_ART = Object.keys(ALL);
})();
