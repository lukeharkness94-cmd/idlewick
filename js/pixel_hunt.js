/* Idlewick: sprites for the hunting tiers (hunt_tiers_data.js). Each animal is drawn with pixel_creatures.js's
   builders (32 x 32, facing right, shared ramps) from its own recipe in D.HUNT_ART, plus a small mark of its own so
   two animals of the same build never share a picture. Also the six new kit items (16 x 16). */
(() => {
const Q = window.DQ, A = Q && Q.pixelArt, D = Q && Q.data; if (!A || !A.BUILD || !D) return;
const rp = c => A.ramp(c);
const mix = (a, b, t) => { const p = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16)), x = p(a), y = p(b); return '#' + x.map((v, i) => Math.round(v + (y[i] - v) * t).toString(16).padStart(2, '0')).join(''); };
/* a mark per animal, from its id: a collar, a blaze, a tail tip or a few flecks, in a colour from its own recipe */
const hash = s => { let h = 7; for (const c of s) h = (h * 31 + c.charCodeAt(0)) >>> 0; return h; };
const mark = (s, id, o) => {
  const h = hash(id), col = o.glow || o.crest || o.fin || o.antler || o.hornCol || mix(o.fur || o.plum || o.col || '#888888', '#ffffff', .45);
  const k = h % 4, dx = (h >> 3) % 3;
  if (k === 0) for (let i = 0; i < 3; i++) s.fix(11 + i * 3 + dx, 16 + (i % 2), col);
  else if (k === 1) { s.fix(24 + dx, 10, col); s.fix(25 + dx, 11, col); }
  else if (k === 2) { s.fix(5 + dx, 15, col); s.fix(6 + dx, 16, col); s.fix(5 + dx, 17, col); }
  else for (const [x, y] of [[13, 14], [16, 15], [19, 14]]) s.fix(x + dx, y, col);
  return s;
};
const SPECS = {};
for (const [id, [builder, opts]] of Object.entries(D.HUNT_ART || {})) {
  const b = A.BUILD[builder]; if (!b) continue;
  SPECS[id] = () => mark(b({ ...opts }), id, opts);
}
Object.assign(A.CREATURE_SPECS, SPECS);
/* ---------- the kit ---------- */
const ITEMS = {
  ironjaw_cage: s => { const m = rp('#8a8f98'), d = rp('#4a4e56'); s.rect(2, 4, 12, 10, d); for (const x of [3, 6, 9, 12]) s.rect(x, 4, 1, 10, m); s.rect(2, 4, 12, 1, m); s.rect(2, 13, 12, 1, m); for (const x of [4, 7, 10]) s.fix(x, 12, '#f0e5c7'); s.rect(6, 1, 4, 3, rp('#6a5a4a')); },
  starwoven_net: s => { const n = rp('#b8a8e8'); for (let i = 0; i < 4; i++) { s.line(1 + i * 4, 2, 14 - i * 2, 14, n); s.line(14 - i * 4, 2, 1 + i * 2, 14, n); } s.ell(8, 8, 1.6, 1.6, rp('#fff0a0')); s.fix(3, 3, '#ffffff'); s.fix(12, 4, '#ffffff'); s.fix(10, 12, '#ffffff'); },
  scent_bait: s => { s.ell(8, 10, 5, 4, rp('#9a6a3a')); s.ell(7, 9, 2, 1.4, rp('#c8945a')); s.line(8, 6, 8, 2, rp('#6a8a3a')); s.fix(9, 3, '#8ab05a'); },
  honey_bait: s => { s.ell(8, 10, 5, 4, rp('#e0a83a')); s.ell(7, 9, 2.4, 1.6, rp('#f8d86a')); s.fix(10, 7, '#fff0a0'); s.rect(6, 4, 4, 2, rp('#8a5a2a')); },
  smoked_lure: s => { s.rect(5, 6, 6, 8, rp('#8a5a4a')); s.rect(5, 6, 6, 1, rp('#c88a6a')); for (const [x, y] of [[7, 4], [8, 3], [9, 2], [8, 1]]) s.fix(x, y, '#b8b0a8'); s.fix(7, 9, '#d8a86a'); },
  moonlit_lure: s => { s.ell(8, 9, 5, 5, rp('#a8c0f0')); s.ell(10, 7, 3, 3, rp('#2a3060')); s.fix(5, 8, '#ffffff'); s.fix(6, 11, '#ffffff'); s.line(8, 4, 8, 1, rp('#e8e0ff')); }
};
const item0 = A.itemSprite;
A.itemSprite = id => { if (ITEMS[id]) { const s = A.Spr(16, 16); ITEMS[id](s); return s; } return item0(id); };
const has0 = A.hasItem; if (has0) A.hasItem = id => !!ITEMS[id] || has0(id);
})();
