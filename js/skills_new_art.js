/* Carpentry, Sailing and Beastmastery (Nov 2026): art, drawn in code in the house style (top-left light, ramps from
   the shared palette, coloured outlines). Planks and boats (16 x 16 items), islands (32 x 32), and each skill's
   emblem (32 x 32) and icon (16 x 16). Items are routed through A.itemSprite / A.itemUrl. */
(() => {
const DQ = window.DQ, D = DQ.data, A = DQ.pixelArt; if (!A || !A.itemSprite) return;
const { Spr, ramp, mix, R } = A, rp = c => ramp(c);

/* planks: a short stack, each wood its own colour and a different stack and binding so no two read alike */
const PLANK = { normal: [3, null], oak: [3, 'rope'], willow: [2, 'rope'], maple: [3, 'iron'], yew: [4, 'iron'], magic: [3, 'gold'], elder: [4, 'gold'] };
const plank = (s, w) => {
  const log = D.ITEMS['log_' + w] || { col: '#a07a4f' }, b = rp(mix(log.col, '#ffffff', .12)), d = rp(mix(log.col, '#3a2414', .3));
  const [n, band] = PLANK[w] || [3, null];
  for (let i = 0; i < n; i++) { const y = 13 - i * 3, x0 = 1 + (i % 2), x1 = 15 - ((i + 1) % 2); s.rect(x0, y - 2, x1 - x0, 2, i % 2 ? d : b); s.line(x0, y - 2, x1 - 1, y - 2, null, mix(log.col, '#ffffff', .35)); s.fix(x0 + 3 + i, y - 1, mix(log.col, '#2a1a10', .5)); s.fix(x1 - 4 - i, y - 1, mix(log.col, '#2a1a10', .5)); }
  if (w === 'magic') [[4, 3], [11, 5]].forEach(([x, y]) => s.fix(x, y, '#e0d0ff'));
  if (w === 'elder') s.fix(8, 4, '#f4ffe0');
  if (band) { const c = band === 'rope' ? R.straw : band === 'iron' ? R.iron : R.gold; for (const x of [4, 11]) s.line(x, 14 - n * 3, x, 13, c); }
};
/* boats: hull shapes and rigs grow with the tier */
const boat = (s, tier, col) => {
  const hull = rp(col), dark = rp(mix(col, '#2a1a10', .35)), sail = rp('#f4ecd8');
  const len = [0, 10, 12, 13, 14, 15][tier], x0 = Math.round((16 - len) / 2), y = 11;
  s.poly([[x0, y], [x0 + len, y], [x0 + len - 2, y + 3], [x0 + 2, y + 3]], hull); s.line(x0 + 1, y + 1, x0 + len - 2, y + 1, null, mix(col, '#2a1a10', .45));
  s.rect(0, 15, 16, 1, rp('#4f8fc0'));
  if (tier === 1) { s.line(x0 + 2, y - 3, x0 + 7, y - 1, R.wood); s.fix(x0 + 8, y - 1, '#8a6a42'); return; } /* oars */
  const mast = x0 + Math.floor(len / 2); s.line(mast, 2, mast, y - 1, dark);
  if (tier === 2) s.rect(mast - 3, 3, 6, 6, sail);
  if (tier === 3) s.poly([[mast + 1, 2], [mast + 6, y - 1], [mast + 1, y - 1]], sail);
  if (tier >= 4) { s.poly([[mast + 1, 2], [mast + 5, 5], [mast + 1, 8]], sail); s.poly([[mast - 1, 3], [mast - 5, 6], [mast - 1, 9]], sail); }
  if (tier === 5) { s.line(x0 + 2, 5, x0 + 2, y - 1, dark); s.rect(x0, 5, 3, 3, rp('#c8483c')); s.fix(mast, 1, '#e6b84a'); }
};
const base = A.itemSprite;
A.itemSprite = id => {
  const it = D.ITEMS[id];
  if (it && id.startsWith('plank_')) { const s = Spr(16, 16); plank(s, id.slice(6)); return s; }
  if (it && it.type === 'boat') { const s = Spr(16, 16); boat(s, it.tier, it.col); return s; }
  return base(id);
};
A.itemUrl = id => A.url('item:' + id, () => A.itemSprite(id));

/* islands (32 x 32): a patch of sea and the island's own shape */
const sea = s => { s.rect(0, 18, 32, 14, rp('#3f7fb0')); for (let i = 0; i < 6; i++) s.line(2 + i * 5, 22 + (i % 3) * 3, 4 + i * 5, 22 + (i % 3) * 3, null, '#9cd0f0'); };
const ISLAND = {
  gull_rock: s => { sea(s); s.poly([[10, 22], [14, 6], [20, 8], [23, 22]], R.stone); s.line(14, 8, 18, 9, null, '#ffffff'); [[12, 12], [19, 14], [16, 18]].forEach(([x, y]) => s.fix(x, y, '#f4f4f0')); s.fix(22, 4, '#f4f4f0'); s.fix(23, 3, '#f4f4f0'); },
  kelp_isle: s => { sea(s); s.ell(16, 21, 11, 4, rp('#d8c890')); s.ell(16, 19, 7, 3, rp('#6a9a4a')); for (const x of [4, 8, 25, 28]) s.line(x, 30, x + 1, 23, rp('#3a7a4a')); s.rect(15, 14, 4, 4, R.wood); s.poly([[14, 14], [17, 11], [20, 14]], R.straw); },
  smugglers_cay: s => { sea(s); s.poly([[4, 22], [9, 10], [24, 9], [29, 22]], rp('#7a6a5a')); s.ell(16, 18, 4, 4, rp('#1e1a1a')); s.rect(21, 14, 3, 3, R.wood); s.fix(22, 15, '#e6b84a'); },
  amber_shoals: s => { sea(s); s.ell(16, 22, 13, 3, rp('#e0c070')); for (const [x, y] of [[8, 21], [14, 23], [20, 21], [25, 22]]) s.ell(x, y, 1.4, 1, ramp('#ffb04a', { gl: .9 })); },
  coral_reach: s => { sea(s); for (const [x, c] of [[6, '#e8705a'], [12, '#f0a0c0'], [18, '#e8705a'], [24, '#f0d060']]) { s.line(x, 26, x, 18, rp(c)); s.line(x, 21, x - 2, 18, rp(c)); s.line(x, 22, x + 2, 19, rp(c)); } },
  spice_atoll: s => { sea(s); s.ell(16, 21, 12, 4, rp('#d8c890')); s.line(10, 21, 12, 8, R.wood); s.ell(12, 8, 5, 2, R.leafCrop); s.rect(18, 15, 7, 5, rp('#c8483c')); s.rect(18, 14, 7, 1, rp('#f0d060')); },
  storm_spire: s => { s.rect(0, 0, 32, 18, rp('#3a3a5a')); sea(s); s.poly([[13, 24], [16, 2], [19, 24]], R.stone); s.line(23, 2, 21, 7, null, '#fff2a0'); s.line(21, 7, 24, 9, null, '#fff2a0'); s.line(24, 9, 21, 14, null, '#fff2a0'); },
  sunken_crown: s => { sea(s); s.rect(8, 16, 16, 6, rp('#8a8aa0')); for (const x of [8, 13, 18, 23]) s.rect(x, 12, 2, 5, rp('#8a8aa0')); s.poly([[12, 12], [16, 8], [20, 12]], R.gold); s.fix(16, 10, '#e0405a'); },
  worlds_edge: s => { s.rect(0, 0, 32, 18, rp('#1e1a34')); [[4, 3], [12, 6], [22, 2], [28, 8], [18, 10]].forEach(([x, y]) => s.fix(x, y, '#e0d0ff')); sea(s); s.rect(27, 18, 5, 14, rp('#0a0a14')); for (let y = 19; y < 32; y += 3) s.fix(26, y, '#b0c8ff'); }
};
A.ISLAND = ISLAND;
A.islandUrl = id => ISLAND[id] ? A.url('island:' + id, () => { const s = Spr(32, 32); ISLAND[id](s); return s; }) : null;

/* skill emblems (32 x 32) and icons (16 x 16) */
const EMB = {
  carpentry: s => { s.rect(4, 18, 24, 4, rp('#c08a4a')); s.rect(4, 22, 24, 4, rp('#a06a3a')); s.line(4, 18, 27, 18, null, '#e8c890'); s.poly([[8, 4], [24, 12], [22, 15], [6, 7]], R.steel); for (let x = 9; x < 23; x += 2) s.fix(x, 8 + Math.round((x - 9) / 2.3), '#5a6068'); s.rect(23, 12, 5, 4, R.wood); },
  sailing: s => { s.rect(0, 24, 32, 8, rp('#3f7fb0')); s.line(2, 26, 8, 26, null, '#9cd0f0'); s.line(20, 28, 28, 28, null, '#9cd0f0'); s.poly([[5, 20], [27, 20], [24, 25], [8, 25]], R.wood); s.line(16, 3, 16, 20, R.wood); s.poly([[17, 4], [27, 17], [17, 17]], rp('#f4ecd8')); s.poly([[15, 6], [7, 17], [15, 17]], rp('#e8dcc0')); s.rect(15, 2, 4, 2, rp('#c8483c')); },
  beastmastery: s => { s.ell(16, 20, 8, 7, rp('#d08a5a')); for (const [x, y] of [[7, 9], [13, 6], [19, 6], [25, 9]]) s.ell(x, y, 3, 3.4, rp('#d08a5a')); s.ell(16, 21, 4, 3, rp('#f0c0a0')); s.fix(14, 18, '#ffffff'); s.line(4, 29, 28, 29, null, '#c8a050'); }
};
const ICO = {
  carpentry: s => { s.rect(1, 10, 14, 3, rp('#c08a4a')); s.line(1, 10, 14, 10, null, '#e8c890'); s.poly([[3, 2], [13, 7], [12, 9], [2, 4]], R.steel); s.rect(12, 6, 3, 3, R.wood); },
  sailing: s => { s.rect(0, 13, 16, 3, rp('#3f7fb0')); s.poly([[2, 11], [14, 11], [12, 14], [4, 14]], R.wood); s.line(8, 1, 8, 11, R.wood); s.poly([[9, 2], [14, 9], [9, 9]], rp('#f4ecd8')); },
  beastmastery: s => { s.ell(8, 10, 4, 3.6, rp('#d08a5a')); for (const [x, y] of [[3, 5], [6, 3], [10, 3], [13, 5]]) s.ell(x, y, 1.6, 1.8, rp('#d08a5a')); },
  plank: s => plank(s, 'oak'), boat: s => boat(s, 3, '#b58a52'), island: s => { s.rect(0, 11, 16, 5, rp('#3f7fb0')); s.ell(8, 11, 6, 2, rp('#d8c890')); s.line(7, 11, 8, 3, R.wood); s.ell(8, 3, 3, 1.4, R.leafCrop); }
};
if (A.EMBLEM) Object.assign(A.EMBLEM, EMB);
if (A.ICON) Object.assign(A.ICON, ICO);
})();
