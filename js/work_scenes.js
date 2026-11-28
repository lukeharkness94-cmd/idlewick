/* Idlewick: work scenes that live (owner, 28 Nov 2026; three approved polish items on top of the skill realism rig).
   Three small canvases lie over the activity backdrop (towns.js districtFor, 240 x 100 drawn, shown at 3x), in the
   district's own pixels so they line up with the painted scene, the hero and the station exactly:

   - Work leaves a mark (canvas.work-marks, under the hero). Each visible strike (js/strike_sync.js calls strike()
     on the frame the tool lands) changes the scene a little: a notch deepens in the trunk and chips settle round its
     foot, pits open in the rock face, hammer scale falls round the anvil, sawdust heaps under the cut. The pile of
     what you make grows only on a real yield (the engine's 'workcycle' with a quantity, never a miss): logs beside the
     tree, an ore heap, fish in a basket on the jetty, pieces cooling from orange to grey on the smith's rack, planks,
     bowls (a burnt one is a black lump), bottles, runes, coins. Everything is capped and stays put while you keep at
     the same activity; starting a different one clears it.
   - Small life in each workplace (canvas.work-life, under the hero): one or two tiny creatures or effects per place,
     occasional and subtle (a squirrel along the fence, a fish leaping, embers, steam and a sleeping cat at the
     hearth, a drip in the mine, a moth at the herbalist's candle after dark...).
   - The town's weather and hour (div.work-tint, canvas.work-sky over the hero): outdoor workplaces show the current
     town's weather from DQ.townWeather (rain with ripples, snow that settles, sea mist, cloud), its light from
     DQ.townHour / DQ.townLight (a gentle dusk or night wash, stars, a lantern that glows) and the season's touch
     (autumn leaves, spring blossom, summer butterflies), the way js/town_life.js does for the town scenes. Indoor
     workplaces (every workshop: forge, kitchen, bench, study) show it only through their windows.

   One subscriber of the shared clock (DQ.frame); per frame it touches only the live rig's own scene. Under Reduce
   effects and reduced motion no creature, drop or particle moves or shows; the marks (still pictures) and the hour's
   light stay. Settings → Display → Town life → Weather off turns the weather here off too (DQ.townWeather says
   'clear'). Presentation only: nothing here is saved, and a forecast or a simulation (time away) changes nothing. */
(() => {
const Q = window.DQ, D = Q.data, UI = Q.ui, S = () => Q.S;
if (!Q.workRig || !Q.frame) return;
const R = () => Q.workRig;
const DW = 240, DH = 100, PX = 3;
const still = () => R().calm();
const rand = (a, b) => a + Math.random() * (b - a), pick = l => l[Math.floor(Math.random() * l.length)];
const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
const hex = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
const mixc = (a, b, k) => { const x = hex(a), y = hex(b); return '#' + x.map((v, i) => Math.round(v + (y[i] - v) * k).toString(16).padStart(2, '0')).join(''); };
const itemCol = id => (id && D.ITEMS[id] && /^#[0-9a-f]{6}$/i.test(D.ITEMS[id].col || '') ? D.ITEMS[id].col : '#a8845a');

/* ---------- a pixel pen for one 240 x 100 canvas ---------- */
const pen = x => ({ x,
  p(c, X, Y, w = 1, h = 1) { x.fillStyle = c; x.fillRect(Math.round(X), Math.round(Y), w, h); },
  ell(c, cx, cy, rx, ry) { x.fillStyle = c; for (let j = -Math.ceil(ry); j <= Math.ceil(ry); j++) { const w = Math.round(rx * Math.sqrt(Math.max(0, 1 - (j * j) / (ry * ry + .01)))); if (w > 0) x.fillRect(Math.round(cx - w), Math.round(cy + j), w * 2, 1); } },
  ring(c, cx, cy, r) { x.fillStyle = c; const n = Math.max(6, Math.round(r * 5)); for (let i = 0; i < n; i++) { const t = i / n * 6.283; x.fillRect(Math.round(cx + Math.cos(t) * r), Math.round(cy + Math.sin(t) * r * .35), 1, 1); } },
  halo(c, X, Y, r, a) { const [R_, G, B] = hex(c); for (let k = r; k >= 1; k--) { x.fillStyle = `rgba(${R_},${G},${B},${(a * .2 / k).toFixed(3)})`; x.fillRect(Math.round(X - k), Math.round(Y - k), 2 * k + 1, 2 * k + 1); } } });

/* ---------- the session: what this activity has left in the scene ---------- */
const keyOf = a => (a ? a.kind + ':' + a.id : null);
let ses = null;
const fresh = a => ({ key: keyOf(a), kind: a.kind, id: a.id, s: 0, n: 0, burnt: 0, bits: [], items: [], rev: 0 });
const session = () => { const a = Q.act, k = keyOf(a); if (k && (!ses || ses.key !== k)) ses = fresh(a); return ses; };
const CAP_BITS = 40;
const addBit = (b, cap = CAP_BITS) => { ses.bits.push(b); if (ses.bits.length > cap) ses.bits.splice(0, ses.bits.length - cap); };
/* what the activity yields (its colour goes on the pile) */
const outOf = s => { const r = s.kind === 'recipe' && D.RECIPES[s.id]; if (r) return Object.keys(r.out || {})[0];
  const n = D.NODE && D.NODE[s.kind + ':' + s.id]; return n && n.item; };

/* ---------- each workplace's marks ----------
   Anchors (district px): C the tool's contact at the strike (the rig's own point), B the row things rest on (one above
   the ground line), T the target's box and span at the contact row, X0 the station's centre (stage 0 = district 120).
   strike(b) runs on each visible strike, give(n) on each real yield; draw(g, A) paints the lot. */
const sp = (x0, w) => x0 + Math.round(rand(0, w));
/* a stack: [position along the row (half steps up the rows), row], bottom row first */
const pyramid = (n, base) => { const out = []; for (let row = 0, left = n; left > 0 && base - row > 0; row++) { const k = Math.min(left, base - row); for (let i = 0; i < k; i++) out.push([i + row / 2, row]); left -= k; } return out; };
const MARK = {
  wood: { cap: 10,
    strike(A) { ses.notch = Math.min(4, (ses.notch || 0) + .34); for (let i = 0; i < 2; i++) addBit({ x: A.C[0] + rand(-12, 6), y: A.B - rand(0, 2), c: pick(['#e0c690', '#c8a068', '#a8845a']) }); },
    draw(g, A, items) { const d = Math.floor(ses.notch || 0), [xl] = A.span;
      /* the notch: an upper cut sloping down into a flat lower cut, pale fresh wood inside, shadow under its lip */
      if (d > 0) { const y = Math.round(A.C[1]) + 1; for (let k = 0; k < d; k++) { const h = d - k; g.p('#ecd8aa', xl + k, y - h, 1, h); g.p('#3a2418', xl + k, y - h - 1, 1, 1); } g.p('#b8946a', xl, y, d, 1); g.p('#5a3a22', xl, y + 1, d, 1); }
      for (const b of ses.bits) g.p(b.c, b.x, b.y);
      const x0 = A.span[1] + 4, col = itemCol(outOf(ses)), end = mixc(col, '#f0dca8', .55);
      for (const [i, row] of pyramid(items.length, 4)) { const cx = x0 + i * 5, cy = A.B - 2 - row * 4; g.ell(mixc(col, '#3a2418', .25), cx + 2, cy, 2.6, 2.2); g.ell(end, cx + 2, cy, 1.6, 1.3); g.p(mixc(col, '#3a2418', .5), cx + 2, cy, 1, 1); } } },
  mine: { cap: 12,
    strike(A) { if ((ses.pits || []).length < 8) (ses.pits = ses.pits || []).push([A.C[0] + 1 + rand(-1, 3), A.C[1] + rand(-4, 4)]); for (let i = 0; i < 2; i++) addBit({ x: A.C[0] + rand(-6, 10), y: A.B - rand(0, 1.5), c: pick(['#8a8478', '#6a645c', '#a8a094']) }); },
    draw(g, A, items) { for (const [x, y] of ses.pits || []) { g.p('#3a3430', x, y, 2, 1); g.p('#c8c0b0', x, y - 1, 1, 1); }
      for (const b of ses.bits) g.p(b.c, b.x, b.y);
      const col = itemCol(outOf(ses)), x0 = Math.max(A.span[1], A.T ? A.T[2] - 6 : A.C[0] + 10) + 2;
      for (const [i, row] of pyramid(items.length, 5)) { const cx = x0 + i * 3, cy = A.B - 1 - row * 2; g.ell(mixc(col, '#2a2420', .3), cx + 1, cy, 1.8, 1.4); g.p(mixc(col, '#ffffff', .35), cx, cy - 1, 1, 1); } } },
  fish: { cap: 8,
    strike(A, b) { if (b && b.sfx === 'splash') addBit({ x: sp(70, 30), y: 92 + Math.round(rand(0, 4)), c: '#7a5a3a' }, 10); },
    draw(g, A, items) { for (const b of ses.bits) g.p(b.c, b.x, b.y); /* wet planks where the splash landed */
      /* a wicker basket on the jetty behind the angler, filling with the catch */
      const x = 65, y = 91, col = itemCol(outOf(ses));
      items.forEach((it, i) => { const fx = x + 1 + (i % 4) * 2, fy = y - 6 - Math.floor(i / 4) * 2; g.p(mixc(col, '#ffffff', .2), fx, fy, 1, 3); g.p(mixc(col, '#000000', .3), fx, fy + 3, 1, 1); g.p('#f4f8fc', fx, fy, 1, 1); });
      g.p('#a87a40', x, y - 5, 10, 5); for (let q = 0; q < 10; q += 2) g.p('#7a5228', x + q, y - 5, 1, 5); g.p('#c89a58', x - 1, y - 6, 12, 1); g.p('#5a3a1a', x, y - 1, 10, 1); } },
  thieve: { cap: 8,
    draw(g, A, items) { /* the take, tucked behind a barrel by the wall */
      const x = 62, y = A.B; g.p('#6a4a2e', x + 9, y - 8, 7, 9); g.p('#8a6a42', x + 9, y - 8, 7, 1); g.p('#4a3420', x + 9, y - 4, 7, 1); g.p('#4a3420', x + 15, y - 8, 1, 9);
      items.forEach((it, i) => { const px = x + (i % 4) * 2 - 1, py = y - 2 - Math.floor(i / 4) * 3, c = i % 3 === 2 ? '#e6b84a' : '#8a5a3a'; g.p(c, px, py, 2, 2); g.p(mixc(c, '#ffffff', .3), px, py, 1, 1); if (c !== '#e6b84a') g.p('#c8a070', px + 1, py - 1, 1, 1); }); } },
  forge: { cap: 6, hot: true,
    strike(A) { for (let i = 0; i < 2; i++) addBit({ x: A.X0 + rand(-10, 9), y: A.B - rand(0, 1.2), c: pick(['#2a2630', '#3a3440', '#4a4450']) }, 30); },
    draw(g, A, items, now) { for (const b of ses.bits) g.p(b.c, b.x, b.y);
      /* a low rack of stones to the side, the finished pieces laid on it to cool */
      const x = A.X0 + 12, y = A.B; g.p('#6d747c', x, y - 1, 18, 2); g.p('#8a929a', x, y - 1, 18, 1); g.p('#4a5058', x + 2, y, 3, 1); g.p('#4a5058', x + 13, y, 3, 1);
      items.forEach((it, i) => { const c = cool(it, now), py = y - 2 - Math.floor(i / 3) * 2, px = x + 1 + (i % 3) * 6; g.p(c, px, py, 5, 1); g.p(mixc(c, '#ffffff', .25), px, py, 2, 1); }); } },
  smelt: { cap: 9, hot: true,
    strike(A) { addBit({ x: A.X0 + rand(-8, 8), y: A.B - rand(0, 1), c: pick(['#2a2018', '#3a2a1e', '#5a4a3a']) }, 16); },
    draw(g, A, items, now) { for (const b of ses.bits) g.p(b.c, b.x, b.y);
      const x = A.X0 + 20; for (const [[i, row], it] of pyramid(items.length, 4).map((p, k) => [p, items[k]])) { const c = cool(it, now), px = x + i * 5, py = A.B - 1 - row * 2; g.p(c, px, py, 4, 2); g.p(mixc(c, '#ffffff', .3), px, py, 4, 1); g.p(mixc(c, '#000000', .3), px + 3, py + 1, 1, 1); } } },
  saw: { cap: 8,
    strike(A, b) { if (b && b.sfx !== 'saw') return; ses.dust = Math.min(14, (ses.dust || 0) + 1); if (Math.random() < .5) addBit({ x: A.C[0] + rand(-6, 10), y: A.B - rand(0, 1), c: pick(['#f0d8a0', '#d8b878']), curl: Math.random() < .5 }, 16); },
    draw(g, A, items) { const d = ses.dust || 0, cx = Math.round(A.C[0]); /* the sawdust heap under the cut */
      for (let k = 0; k < Math.ceil(d / 4); k++) { const w = Math.max(2, Math.min(d, 9) - k * 2); g.p(k ? '#f0dcae' : '#e0c690', cx - w / 2, A.B - k, w, 1); }
      for (const b of ses.bits) { g.p(b.c, b.x, b.y); if (b.curl) g.p(b.c, b.x + 1, b.y - 1); }
      const x = A.X0 + 22, col = itemCol(outOf(ses)); items.forEach((it, i) => { const y = A.B - i * 2; g.p(mixc(col, '#3a2418', .2), x, y - 1, 14, 2); g.p(mixc(col, '#ffffff', .25), x, y - 1, 14, 1); g.p(mixc(col, '#3a2418', .45), x + 13, y - 1, 1, 2); }); } },
  cook: { cap: 6,
    draw(g, A, items) { /* bowls of what you cooked on the flagstones beside the warming stone; a burnt one is a black lump */
      const x = A.X0 + 21, col = itemCol(outOf(ses)); items.forEach((it, i) => { const px = x + i * 6, py = A.B;
        if (it.burnt) { g.p('#1e1a1c', px, py - 2, 4, 2); g.p('#3a3034', px + 1, py - 3, 2, 1); g.p('#5a4a44', px + 1, py - 2, 1, 1); return; }
        g.p(mixc(col, '#3a2418', .1), px, py - 3, 4, 1); g.p(mixc(col, '#ffffff', .35), px + 1, py - 4, 2, 1); g.p('#f0e6d4', px - 1, py - 2, 6, 1); g.p('#b8a488', px, py - 1, 4, 1); g.p('#8a7860', px + 1, py, 2, 1); });
      if (items.length) g.p('#6a4a30', x - 2, A.B + 1, items.length * 6 + 2, 1); } },
  stitch: { cap: 6,
    strike(A) { if (Math.random() < .6) addBit({ x: A.X0 + rand(-8, 8), y: A.B - rand(0, 1), c: pick(['#efe4c8', '#a8784a', '#7a5230']) }, 20); },
    draw(g, A, items) { for (const b of ses.bits) g.p(b.c, b.x, b.y);
      const x = A.X0 + 10, col = itemCol(outOf(ses)); items.forEach((it, i) => { const y = A.B - i * 2; g.p(mixc(col, '#2a1a10', .2), x - (i % 2), y - 1, 9, 2); g.p(mixc(col, '#ffffff', .2), x - (i % 2), y - 1, 9, 1); g.p('#efe4c8', x + 3 - (i % 2), y, 3, 1); }); } },
  runes: { cap: 9,
    strike(A) { addBit({ x: A.X0 + rand(-8, 8), y: A.B - rand(0, 1), c: pick(['#9a948c', '#7a746c', '#c8c2b8']) }, 24); },
    draw(g, A, items) { for (const b of ses.bits) g.p(b.c, b.x, b.y);
      const x = A.X0 + 11, col = itemCol(outOf(ses)); for (const [i, row] of pyramid(items.length, 4)) { const px = x + i * 5, py = A.B - 3 - row * 4; g.p('#6a645c', px, py, 4, 4); g.p('#9a948c', px, py, 4, 3); g.p('#c8c2b8', px, py, 3, 1); g.p(col, px + 1, py + 1, 1, 2); g.p(col, px + 2, py + 1, 1, 1); } } },
  engrave: { cap: 6,
    strike(A) { addBit({ x: A.X0 + rand(-6, 8), y: A.B - rand(0, 1), c: pick(['#e8eef4', '#c8d0d8', '#fff3cf']) }, 18); },
    draw(g, A, items) { for (const b of ses.bits) g.p(b.c, b.x, b.y);
      const x = A.X0 + 10, col = itemCol(outOf(ses)); g.p('#6a4a8a', x - 1, A.B, 16, 1); items.forEach((it, i) => { const px = x + (i % 3) * 5, py = A.B - 1 - Math.floor(i / 3) * 2; g.p(col, px, py, 3, 1); g.p('#f4eaff', px + 1, py - 1, 1, 1); }); } },
  grind: { cap: 10,
    strike(A) { addBit({ x: A.X0 + rand(-7, 10), y: A.B - 12 - rand(0, 0), c: pick(['#5a8a3a', '#7ab04a', '#3a6a2a']) }, 16); },
    draw(g, A, items) { for (const b of ses.bits) g.p(b.c, b.x, b.y - 1); /* green flecks on the table top */
      /* the bottles made so far stand in two rows by the table's foot */
      const x = A.X0 + 16, col = itemCol(outOf(ses)); items.forEach((it, i) => { const row = Math.floor(i / 5), px = x + (i % 5) * 3 + row, py = A.B - row * 5;
        g.p(mixc(col, '#1a2a2a', .15), px, py - 3, 2, 3); g.p(mixc(col, '#ffffff', .45), px, py - 3, 1, 1); g.p('#c8d8e0', px, py - 4, 2, 1); g.p('#a87a40', px, py - 5, 2, 1); }); } },
  survey: { cap: 6,
    draw(g, A, items) { const x = A.X0 + 11; items.forEach((it, i) => { const px = x + (i % 3) * 4 + (Math.floor(i / 3) ? 2 : 0), py = A.B - Math.floor(i / 3) * 2; g.p('#efe4c8', px, py - 1, 3, 2); g.p('#ffffff', px, py - 1, 3, 1); g.p('#c8483c', px + 1, py - 1, 1, 2); }); } },
  alch: { cap: 12,
    draw(g, A, items) { const x = A.C[0] + 10; for (const [i, row] of pyramid(items.length, 5)) { const px = x + i * 2, py = A.B - row; g.p('#c89a3a', px, py, 2, 1); g.p('#f0d060', px, py, 1, 1); } } },
  hunt: { cap: 6,
    strike(A) { if ((ses.prints || 0) < 10) { ses.prints = (ses.prints || 0) + 1; } },
    draw(g, A, items) { for (let i = 0; i < (ses.prints || 0); i++) { const x = A.X0 + 30 - i * 7, y = A.B + (i % 2) - 1; g.p('#5a4a30', x, y, 2, 1); g.p('#5a4a30', x + 3, y + (i % 2 ? -1 : 1), 2, 1); }
      /* the day's catch: bundled skins and feathers on the grass beside the hunter */
      const x = 52; items.forEach((it, i) => { const px = x + (i % 3) * 5, py = A.B - Math.floor(i / 3) * 3, c = ['#8a6a42', '#b08a5a', '#6a5040'][i % 3]; g.p(c, px, py - 2, 4, 3); g.p(mixc(c, '#ffffff', .25), px, py - 2, 4, 1); g.p('#c8b080', px + 1, py - 1, 1, 1); }); } },
  capture: { cap: 15, any: true,
    tried() { addBit({ x: 150 + rand(-10, 18), y: 95 - rand(0, 2), c: pick(['#c8a040', '#e0c070', '#a87a30']) }, 14); },
    draw(g, A, items) { for (const b of ses.bits) g.p(b.c, b.x, b.y);
      /* a tally cut into the post for each one caught alive */
      const x = 70; g.p('#7a5a3a', x - 1, 74, 8, 16); g.p('#9a7a4e', x - 1, 74, 8, 1); items.forEach((it, i) => { const grp = Math.floor(i / 5), k = i % 5, y = 77 + grp * 5; if (k < 4) g.p('#3a2414', x + k + (grp ? 0 : 0), y, 1, 3); else g.p('#3a2414', x, y + 1, 5, 1); }); } },
  stake: { cap: 6,
    strike(A) { addBit({ x: A.C[0] + rand(-4, 4), y: A.B - rand(0, 1), c: pick(['#8a7a5a', '#6a5a40']) }, 12); },
    draw(g, A, items) { for (const b of ses.bits) g.p(b.c, b.x, b.y);
      const x = A.C[0] + 14; items.forEach((it, i) => { const px = x + i * 6; g.p('#b8946a', px, A.B - 5, 1, 6); g.p('#8a6a42', px, A.B - 5, 1, 1); if (i) g.p('#e8dcc0', px - 5, A.B - 3, 5, 1); }); } },
  haul: { cap: 6,
    draw(g, A, items) { const x = 58; items.forEach((it, i) => { const px = x + (i % 3) * 7 + (Math.floor(i / 3) ? 3 : 0), py = A.B - Math.floor(i / 3) * 6; g.p('#8a6a42', px, py - 5, 6, 6); g.p('#b08a5a', px, py - 5, 6, 1); g.p('#5a4028', px, py - 3, 6, 1); g.p('#5a4028', px + 2, py - 5, 1, 6); }); } },
  pell: { cap: 0,
    strike(A) { if ((ses.cuts || []).length < 8) (ses.cuts = ses.cuts || []).push(A.C[1] + rand(-5, 3) | 0); const d = ses.drill || 'straw';
      addBit({ x: A.X0 + rand(-8, 8), y: A.B - rand(0, 1), c: d === 'straw' ? pick(['#d8b860', '#a88a40']) : d === 'iron' ? pick(['#5a5a62', '#3a3a42']) : d === 'runed' ? pick(['#8fc0ff', '#c8b0ff']) : pick(['#c8a068', '#7a5236']) }, 24); },
    draw(g, A) { for (const b of ses.bits) g.p(b.c, b.x, b.y); for (const y of ses.cuts || []) { g.p('#3a2414', A.X0 - 2, y, 2, 1); g.p('#e8d4a8', A.X0 - 2, y + 1, 1, 1); } } },
  butts: { cap: 0,
    strike(A, b) { if (b && b.sfx !== 'stake') return; const a = ses.arrows = ses.arrows || []; if (a.length < 8) a.push([rand(-4, 3) | 0, rand(-4, 4) | 0]); },
    draw(g, A) { for (const [dx, dy] of ses.arrows || []) { const x = A.X0 - 1 + dx, y = A.B + 1 - 16 + dy; g.p('#c8a070', x - 5, y, 5, 1); g.p('#e8e0d0', x - 6, y - 1, 2, 1); g.p('#c8483c', x - 6, y + 1, 2, 1); } } }
};
/* forge and smelting: a piece glows when it comes off the work and cools to its own metal over a few seconds */
const HOT = 7000;
const cool = (it, now) => { if (still() || !it.t) return it.col; const k = clamp((now - it.t) / HOT); return k < .5 ? mixc('#ffe080', '#e05a20', k * 2) : mixc('#e05a20', it.col, (k - .5) * 2); };

/* ---------- the place: indoor or out, and where its lantern hangs ---------- */
const placeOf = sc => { const kind = sc.dataset.kind, key = (sc.className.match(/skill-([\w-]+)/) || [])[1] || '';
  const dk = kind === 'hunt' || kind === 'capture' ? 'train' : kind;
  const out = ['wood', 'mine', 'fish', 'sail', 'thieve', 'train'].includes(dk);
  const magic = kind === 'alch' || key === 'magic' || key === 'enchanting';
  /* the workshop facade's windows (towns.js facade at x -4, top 20): glass 9 x 9 */
  const windows = out ? [] : [[18, 32], magic ? [92, 28] : [206, 32]];
  /* a lantern on a fence post, the mine's own lamp, the mooring post, the quay bollard, a wall bracket, a stake by the trap line: [x, y, the top of what holds it, already painted] */
  const LAMP = { wood: [163, 63, 66], mine: [151, 66, 0, true], fish: [151, 77, 80], sail: [115, 75, 78], thieve: [104, 60, 0], train: [160, 84, 96] };
  const SKY = { wood: 50, mine: 34, fish: 52, sail: 50, thieve: 22, train: 48 };
  return { kind, dk, key, out, magic, windows, lamp: LAMP[dk], sky: SKY[dk] || 0 }; };

/* ---------- small life: one or two creatures or effects per workplace ---------- */
const LIFE = {};
/* a squirrel scampers along the fence rail, stops, flicks its tail and goes on */
LIFE.squirrel = () => ({ x: -10, y: 68, dir: 1, mode: 'away', wait: rand(4, 10), f: 0,
  step(dt) { if (this.mode === 'away') { if ((this.wait -= dt) <= 0) { this.dir = Math.random() < .5 ? 1 : -1; this.x = this.dir > 0 ? 40 : 200; this.goal = rand(80, 160); this.mode = 'run'; } return; }
    if (this.mode === 'sit') { this.f = Math.sin(this.t = (this.t || 0) + dt * 5) > .3 ? 1 : 0; if ((this.wait -= dt) <= 0) { this.mode = 'off'; } return; }
    this.x += this.dir * 32 * dt; this.f = Math.floor(this.x / 3) % 2;
    if (this.mode === 'run' && (this.dir > 0 ? this.x >= this.goal : this.x <= this.goal)) { this.mode = 'sit'; this.wait = rand(1.5, 3.5); }
    if (this.mode === 'off' && (this.x < 30 || this.x > 210)) { this.mode = 'away'; this.wait = rand(12, 26); } },
  draw(g) { if (this.mode === 'away') return; const x = Math.round(this.x), y = this.y, d = this.dir, c = '#a0603a', lt = '#c8885a';
    g.p(c, x, y - 2, 3, 2); g.p(lt, x, y - 2, 3, 1); g.p(c, d > 0 ? x + 3 : x - 2, y - 3, 2, 2); g.p('#1a1010', d > 0 ? x + 4 : x - 2, y - 3, 1, 1); g.p(c, d > 0 ? x + 3 : x - 1, y - 4, 1, 1);
    const tx = d > 0 ? x - 2 : x + 3; if (this.mode === 'sit') { g.p(c, tx, y - 5 + this.f, 2, 4 - this.f); g.p(lt, tx, y - 5 + this.f, 1, 1); } else { g.p(c, tx, y - 3, 2, 2); g.p(c, d > 0 ? tx - 1 : tx + 2, y - 4, 1, 1); }
    if (this.mode !== 'sit') { g.p(c, x + this.f, y, 1, 1); g.p(c, x + 2 - this.f, y, 1, 1); } } });
/* birds cross the sky now and then */
LIFE.birds = (y0 = 52) => ({ x: -20, dir: 1, wait: rand(8, 20), on: false,
  step(dt) { if (!this.on) { if ((this.wait -= dt) <= 0) { this.on = true; this.dir = Math.random() < .5 ? 1 : -1; this.x = this.dir > 0 ? 40 : 200; this.y = y0 + rand(-4, 4); this.n = 2 + Math.floor(rand(0, 2)); } return; }
    this.x += this.dir * 22 * dt; this.t = (this.t || 0) + dt; if (this.x < 30 || this.x > 210) { this.on = false; this.wait = rand(18, 40); } },
  draw(g, L) { if (!this.on) return; const c = L.dark > .5 ? '#1a1a2a' : '#3a3a44'; for (let i = 0; i < this.n; i++) { const x = this.x - this.dir * i * 6, y = this.y + (i % 2) * 2, f = Math.floor(this.t * 6 + i) % 2;
    g.p(c, x, y); g.p(c, x - 1, y - f); g.p(c, x + 1, y - f); g.p(c, x - 2, y - 1 + f * 0); g.p(c, x + 2, y - 1); } } });
/* a drip gathers on the mine's lintel and falls; dust hangs in the lamp light */
LIFE.drip = () => ({ y: 59, grow: 0, wait: rand(2, 5), mode: 'grow',
  step(dt) { if (this.mode === 'grow') { this.grow += dt; if (this.grow > this.wait) { this.mode = 'fall'; this.v = 0; } }
    else if (this.mode === 'fall') { this.v += 160 * dt; this.y += this.v * dt; if (this.y >= 88) { this.mode = 'splash'; this.t = 0; } }
    else if ((this.t += dt) > .35) { this.mode = 'grow'; this.y = 59; this.grow = 0; this.wait = rand(3, 8); } },
  draw(g) { const c = 'rgba(190,220,240,.85)'; if (this.mode === 'grow') { if (this.grow > this.wait * .5) g.p(c, 163, 59); }
    else if (this.mode === 'fall') g.p(c, 163, this.y, 1, 2); else { const k = this.t > .17 ? 2 : 1; g.p(c, 163 - k, 88 - k + 1); g.p(c, 163 + k, 88 - k + 1); } } });
LIFE.dust = (box, col = '255,236,190') => ({ m: Array.from({ length: 7 }, () => ({ x: rand(box[0], box[2]), y: rand(box[1], box[3]), p: rand(0, 6.28), s: rand(.4, 1) })),
  step(dt) { for (const d of this.m) { d.x += Math.sin(d.p += dt * .7 * d.s) * 2 * dt; d.y -= 1.2 * d.s * dt; if (d.y < box[1]) { d.y = box[3]; d.x = rand(box[0], box[2]); } } },
  draw(g) { for (const d of this.m) { const a = .25 + .35 * (Math.sin(d.p * 2) + 1) / 2; g.p(`rgba(${col},${a.toFixed(2)})`, d.x, d.y); } } });
/* a fish leaps out in the open water */
LIFE.fishjump = (box = [130, 66, 200, 82]) => ({ wait: rand(4, 9), on: false,
  step(dt) { if (!this.on) { if ((this.wait -= dt) <= 0) { this.on = true; this.t = 0; this.x0 = rand(box[0], box[2]); this.y0 = rand(box[1], box[3]); this.dir = Math.random() < .5 ? 1 : -1; } return; }
    if ((this.t += dt) > 1.3) { this.on = false; this.wait = rand(7, 16); } },
  draw(g) { if (!this.on) return; const k = this.t / .7, c = 'rgba(230,244,250,.8)';
    if (k <= 1) { const x = this.x0 + this.dir * k * 10, y = this.y0 - Math.sin(k * Math.PI) * 7; g.p('#b8c8d0', x - (k < .5 ? 0 : 1), y, 3, 1); g.p('#e8f0f4', x + (this.dir > 0 ? 2 : 0), y - (k < .5 ? 1 : 0), 1, 1); g.p('#7a8a98', x - this.dir, y + (k < .5 ? 1 : -1), 1, 1); }
    if (this.t < .45) g.ring(c, this.x0, this.y0 + 1, 1 + this.t * 6); const t2 = this.t - .7; if (t2 > 0 && t2 < .5) g.ring(c, this.x0 + this.dir * 10, this.y0 + 1, 1 + t2 * 6); } });
/* a dragonfly hovers and darts over the water by day */
LIFE.dragonfly = (box = [96, 64, 160, 84]) => ({ x: rand(box[0], box[2]), y: rand(box[1], box[3]), gx: 0, gy: 0, wait: 0,
  step(dt, L) { this.t = (this.t || 0) + dt; if ((this.wait -= dt) <= 0) { this.gx = rand(box[0], box[2]); this.gy = rand(box[1], box[3]); this.wait = rand(1.5, 4); }
    this.x += (this.gx - this.x) * Math.min(1, dt * 4); this.y += (this.gy - this.y) * Math.min(1, dt * 4); this.vis = L.dark < .4; },
  draw(g) { if (!this.vis) return; const x = Math.round(this.x), y = Math.round(this.y), f = Math.floor(this.t * 20) % 2; g.p('#3a7ab0', x, y, 4, 1); g.p('#7ac0e0', x + 3, y, 1, 1); g.p(f ? 'rgba(230,240,255,.8)' : 'rgba(230,240,255,.4)', x + 1, y - 1, 2, 1); } });
/* a pigeon pecks at the cobbles, and flutters off when it has had enough */
LIFE.pigeon = (x0 = 140, x1 = 186, y = 95) => ({ x: rand(x0, x1), dir: 1, mode: 'peck', wait: rand(1, 3), f: 0, yy: y,
  step(dt) { this.t = (this.t || 0) + dt; if (this.mode === 'peck') { this.f = Math.sin(this.t * 6) > .5 ? 1 : 0; if ((this.wait -= dt) <= 0) { this.mode = Math.random() < .12 ? 'fly' : 'walk'; this.goal = clamp(this.x + rand(-12, 12), x0, x1); this.dir = this.goal < this.x ? -1 : 1; } }
    else if (this.mode === 'walk') { this.x += this.dir * 6 * dt; this.f = Math.floor(this.t * 5) % 2; if (this.dir > 0 ? this.x >= this.goal : this.x <= this.goal) { this.mode = 'peck'; this.wait = rand(1.5, 4); } }
    else if (this.mode === 'fly') { this.x += this.dir * 40 * dt; this.yy -= 22 * dt; this.f = Math.floor(this.t * 10) % 2; if (this.yy < 40) { this.mode = 'gone'; this.wait = rand(10, 20); } }
    else if ((this.wait -= dt) <= 0) { this.mode = 'peck'; this.yy = y; this.x = rand(x0, x1); this.wait = rand(2, 4); } },
  draw(g) { if (this.mode === 'gone') return; const x = Math.round(this.x), y = Math.round(this.yy), d = this.dir, c = '#8a8a9a', dk = '#5a5a6a';
    if (this.mode === 'fly') { g.p(c, x, y - 2, 3, 1); g.p(c, x - 1, y - 3 - this.f, 2, 1); g.p(c, x + 2, y - 3 - this.f, 2, 1); return; }
    g.p(c, x, y - 2, 3, 2); g.p(dk, d > 0 ? x : x + 2, y - 2, 1, 1); const hx = d > 0 ? x + 3 : x - 1; g.p(dk, hx, y - 3 + this.f * 2, 1, 1); g.p('#4a8a6a', d > 0 ? x + 2 : x, y - 2, 1, 1); g.p('#d8704a', x + 1, y, 1, 1); } });
/* a rabbit in the far meadow: sits, twitches an ear, hops a little way */
LIFE.rabbit = (x0 = 70, x1 = 180, y = 80) => ({ x: rand(x0, x1), dir: 1, mode: 'sit', wait: rand(2, 5), f: 0,
  step(dt) { this.t = (this.t || 0) + dt; if (this.mode === 'sit') { this.f = Math.sin(this.t * 3) > .85 ? 1 : 0; if ((this.wait -= dt) <= 0) { this.mode = 'hop'; this.h = 0; this.dir = Math.random() < .5 ? -1 : 1; } }
    else { this.h += dt; this.x = clamp(this.x + this.dir * 14 * dt, x0, x1); if (this.h > .45) { this.mode = 'sit'; this.wait = rand(2.5, 7); } } },
  draw(g, L) { const x = Math.round(this.x), hop = this.mode === 'hop' ? Math.round(Math.sin(this.h / .45 * Math.PI) * 2) : 0, yy = y - hop, c = L.dark > .6 ? '#5a4a3a' : '#9a7a5a', d = this.dir;
    g.p(c, x, yy - 2, 3, 2); g.p(c, d > 0 ? x + 2 : x - 1, yy - 3, 2, 2); g.p(c, d > 0 ? x + 2 : x, yy - 5, 1, 2); if (!this.f) g.p(c, d > 0 ? x + 3 : x - 1, yy - 5, 1, 2); g.p('#f4f0e8', d > 0 ? x - 1 : x + 3, yy - 2, 1, 1); } });
/* butterflies by day (summer, or wherever flowers are), fireflies at night */
LIFE.butterfly = (box = [70, 60, 190, 86], always = false) => ({ b: Array.from({ length: 2 }, () => ({ x: rand(box[0], box[2]), y: rand(box[1], box[3]), p: rand(0, 6.28), c: pick(['#f0d060', '#f4f0f4', '#e09040']) })),
  step(dt, L) { this.t = (this.t || 0) + dt; this.vis = L.dark < .4 && (always || L.season === 'summer'); for (const b of this.b) { b.x = clamp(b.x + Math.cos(this.t * .7 + b.p) * 10 * dt, box[0], box[2]); b.y = clamp(b.y + Math.sin(this.t * 1.3 + b.p) * 6 * dt, box[1], box[3]); } },
  draw(g) { if (!this.vis) return; for (const b of this.b) { const up = Math.floor(this.t * 8 + b.p) % 2; g.p(b.c, b.x - 1, b.y - up); g.p(b.c, b.x + 1, b.y - up); g.p('#3a3030', b.x, b.y); } } });
LIFE.fireflies = (box = [60, 60, 190, 92]) => ({ f: Array.from({ length: 6 }, () => ({ x: rand(box[0], box[2]), y: rand(box[1], box[3]), p: rand(0, 6.28), s: rand(.6, 1.4) })),
  step(dt, L) { this.t = (this.t || 0) + dt; this.a = clamp((L.dark - .5) * 2); },
  draw(g) { if (this.a <= 0) return; for (const f of this.f) { const a = (Math.sin(this.t * 2.2 * f.s + f.p) + 1) / 2; if (a < .5) continue; g.p(`rgba(214,255,140,${((a - .5) * 1.8 * this.a).toFixed(2)})`, f.x + Math.sin(this.t * .5 * f.s + f.p) * 8, f.y + Math.cos(this.t * .4 * f.s + f.p) * 4); } } });
/* gulls wheel over the harbour */
LIFE.gulls = () => ({ g: Array.from({ length: 2 }, () => ({ cx: rand(90, 170), cy: rand(48, 58), r: rand(10, 22), a: rand(0, 6.28), sp: rand(.4, .7) * (Math.random() < .5 ? -1 : 1) })),
  step(dt) { this.t = (this.t || 0) + dt; for (const q of this.g) q.a += q.sp * dt; },
  draw(g) { for (const q of this.g) { const x = q.cx + Math.cos(q.a) * q.r * 1.6, y = q.cy + Math.sin(q.a) * q.r * .4, f = Math.floor(this.t * 4 + q.r) % 2; g.p('#f8f8f8', x, y); g.p('#f8f8f8', x - 1, y - f); g.p('#f8f8f8', x + 1, y - f); g.p('#c8c8d0', x - 2, y - 1); g.p('#c8c8d0', x + 2, y - 1); } } });
/* embers lift off a fire and fade */
LIFE.embers = (x0, x1, y0, rise = 26) => ({ e: [], wait: 0,
  step(dt) { if ((this.wait -= dt) <= 0 && this.e.length < 9) { this.e.push({ x: rand(x0, x1), y: y0, t: 0, life: rand(1, 2), dx: rand(-4, 4) }); this.wait = rand(.25, .8); }
    this.e = this.e.filter(e => (e.t += dt) < e.life); },
  draw(g) { for (const e of this.e) { const k = e.t / e.life; g.p(`rgba(255,${Math.round(200 - 90 * k)},70,${(1 - k).toFixed(2)})`, e.x + e.dx * k + Math.sin(e.t * 5) * .8, e.y - k * rise); } } });
/* steam and smoke: puffs that swell, drift and thin out */
LIFE.steam = (x, y, n = () => 2, col = '226,232,242', rise = 18) => ({ p: [], wait: 0,
  step(dt) { if ((this.wait -= dt) <= 0 && this.p.length < n() * 2) { this.p.push({ t: 0, life: rand(1.6, 2.6), dx: rand(-1.5, 1.5) }); this.wait = rand(.5, 1.2) / Math.max(1, n() * .6); }
    this.p = this.p.filter(q => (q.t += dt) < q.life); },
  draw(g) { for (const q of this.p) { const k = q.t / q.life, a = .75 * (1 - k) * Math.min(1, q.t * 3); g.ell(`rgba(${col},${a.toFixed(3)})`, x + q.dx + k * 5 + Math.sin(q.t * 2) * 1, y - k * rise, .8 + k * 2.2, .6 + k * 1.3); } } });
/* the pot bubbles at its rim */
LIFE.bubbles = (x, y, w) => ({ b: [], step(dt) { if (Math.random() < dt * 4 && this.b.length < 4) this.b.push({ x: x + rand(0, w), t: 0 }); this.b = this.b.filter(q => (q.t += dt) < .5); },
  draw(g) { for (const q of this.b) { g.p(q.t < .35 ? '#f0e8d8' : 'rgba(240,232,216,.4)', q.x, y - (q.t < .2 ? 0 : 1)); } } });
/* a cat asleep by the warm hearth: breathes, flicks its tail, now and then lifts its head and looks about */
LIFE.cat = (x, y, col = '#e0a060') => ({ wait: rand(6, 12), mode: 'sleep',
  step(dt) { this.t = (this.t || 0) + dt; if ((this.wait -= dt) <= 0) { this.mode = this.mode === 'sleep' ? 'look' : 'sleep'; this.wait = this.mode === 'look' ? rand(2, 4) : rand(10, 22); } },
  draw(g) { const br = Math.sin(this.t * 1.6) > .2 ? 1 : 0, ol = mixc(col, '#2a1408', .62), dk = mixc(col, '#3a2418', .35), lt = mixc(col, '#ffffff', .3), st = mixc(col, '#3a2418', .22);
    /* curled up, nose to tail: a long low back that rises a pixel on each breath, tabby stripes, a coloured outline */
    g.p(ol, x + 1, y - 3 - br, 5, 1); g.p(ol, x - 1, y - 1, 1, 2); g.p(ol, x, y - 2, 1, 1);
    if (br) g.p(col, x + 1, y - 3, 5, 1); g.p(col, x + 1, y - 2, 6, 1); g.p(col, x, y - 1, 7, 1); g.p(dk, x, y, 9, 1);
    g.p(lt, x + 2, y - 2 - br, 3, 1); g.p(st, x + 2, y - 1, 1, 1); g.p(st, x + 4, y - 1, 1, 1); g.p(st, x + 3, y - 2, 1, 1);
    if (this.mode === 'look') { g.p(ol, x + 6, y - 6, 1, 1); g.p(ol, x + 8, y - 6, 1, 1); g.p(col, x + 6, y - 5, 3, 3); g.p(ol, x + 9, y - 4, 1, 2); g.p('#6ab04a', x + 7, y - 4, 1, 1); g.p(lt, x + 8, y - 3, 1, 1); }
    else { g.p(ol, x + 6, y - 4, 1, 1); g.p(ol, x + 8, y - 4, 1, 1); g.p(col, x + 6, y - 3, 3, 3); g.p(ol, x + 9, y - 2, 1, 2); g.p(ol, x + 7, y - 2, 1, 1); g.p(lt, x + 8, y - 1, 1, 1); }
    /* the tail wrapped round the front, its tip flicking now and then */
    const fl = Math.sin(this.t * .9) > .8 ? 1 : 0; g.p(lt, x + 1, y, 5, 1); g.p(col, x, y - fl, 1, 1); } });
/* a mouse scurries along the skirting, stops to sniff, runs on */
LIFE.mouse = (y = 96) => ({ x: -5, mode: 'away', wait: rand(5, 12), dir: 1,
  step(dt) { this.t = (this.t || 0) + dt; if (this.mode === 'away') { if ((this.wait -= dt) <= 0) { this.mode = 'run'; this.dir = Math.random() < .5 ? 1 : -1; this.x = this.dir > 0 ? 50 : 190; this.stop = rand(90, 150); } return; }
    if (this.mode === 'sniff') { if ((this.wait -= dt) <= 0) this.mode = 'off'; return; }
    this.x += this.dir * 40 * dt; if (this.mode === 'run' && Math.abs(this.x - this.stop) < 2) { this.mode = 'sniff'; this.wait = rand(.8, 1.8); }
    if (this.x < 40 || this.x > 200) { this.mode = 'away'; this.wait = rand(14, 30); } },
  draw(g) { if (this.mode === 'away') return; const x = Math.round(this.x), d = this.dir, c = '#8a8078'; g.p(c, x, y - 2, 3, 2); g.p(c, d > 0 ? x + 3 : x - 1, y - 1, 1, 1); g.p('#c89a9a', d > 0 ? x + 1 : x + 1, y - 3, 1, 1); g.p('#6a605a', d > 0 ? x - 2 : x + 3, y - 1, 2, 1);
    if (this.mode === 'sniff' && Math.sin(this.t * 14) > 0) g.p('#1a1010', d > 0 ? x + 4 : x - 2, y - 1, 1, 1); } });
/* a sparrow or a crow hops about the yard floor and pecks */
LIFE.hopper = (x0, x1, y, col = '#8a6a4a', belly = '#d8c8a8') => ({ x: rand(x0, x1), dir: 1, wait: rand(1, 3), mode: 'peck',
  step(dt) { this.t = (this.t || 0) + dt; if (this.mode === 'peck') { if ((this.wait -= dt) <= 0) { this.mode = 'hop'; this.h = 0; this.dir = Math.random() < .5 ? -1 : 1; } }
    else { this.h += dt; this.x = clamp(this.x + this.dir * 16 * dt, x0, x1); if (this.h > .25) { this.mode = Math.random() < .3 ? 'hop' : 'peck'; this.h = 0; this.wait = rand(.8, 3); } } },
  draw(g) { const x = Math.round(this.x), hop = this.mode === 'hop' ? 1 : 0, peck = this.mode === 'peck' && Math.sin(this.t * 7) > .4 ? 1 : 0, d = this.dir, yy = y - hop;
    g.p(col, x, yy - 2, 3, 2); g.p(belly, x + (d > 0 ? 1 : 0), yy - 1, 2, 1); g.p(col, d > 0 ? x + 2 + peck : x - peck, yy - 3 + peck, 1, 1); g.p('#e0a030', d > 0 ? x + 3 + peck : x - 1 - peck, yy - 3 + peck * 2, 1, 1); g.p(col, d > 0 ? x - 1 : x + 3, yy - 2, 1, 1); g.p('#3a2a1a', x + 1, yy, 1, 1); } });
/* magic motes rise from the circle and twinkle */
LIFE.motes = (box = [70, 60, 170, 96], col = '200,176,255') => LIFE.dust(box, col);
/* a candle on the herbalist's table: a moth circles it after dark, a bee visits the herbs by day */
LIFE.candle = (x, y) => ({ step(dt) { this.t = (this.t || 0) + dt; },
  fixed(g) { g.p('#efe4c8', x, y - 3, 2, 3); g.p('#c8b898', x + 1, y - 3, 1, 3); g.p('#3a2a1a', x, y - 4, 1, 1); g.p('#ffd870', x, y - 6, 1, 2); },
  draw(g) { if (Math.sin(this.t * 9) > .3) { g.p('#fff0b0', x, y - 5, 1, 1); g.p('#ffe080', x, y - 7, 1, 1); } } });
/* the forge's ash door at the foot of the hearth: the coals glow and flicker, and an ember slips up now and then */
LIFE.ashdoor = (x, y) => { const e = LIFE.embers(x + 2, x + 9, y, 16), d0 = e.draw;
  e.fixed = g => { g.p('#2a2226', x, y, 12, 7); g.p('#4a4048', x, y, 12, 1); g.p('#7a2a14', x + 1, y + 1, 10, 5); g.p('#c8501c', x + 2, y + 3, 8, 3); for (let q = x + 2; q < x + 11; q += 3) g.p('#2a2226', q, y + 1, 1, 5); };
  e.draw = function (g) { this.k = (this.k || 0) + 1; const t = performance.now() / 1000; for (let q = 0; q < 3; q++) { const fx = x + 3 + q * 3, on = Math.sin(t * (3 + q) + q * 2) > 0; if (on) g.p('#f8a040', fx, y + 3 + (q % 2), 1, 2); } d0.call(this, g); };
  return e; };
LIFE.moth = (x, y) => ({ step(dt, L) { this.t = (this.t || 0) + dt; this.vis = L.dark > .45; },
  draw(g) { if (!this.vis) return; const a = this.t * 2.6, mx = x + Math.cos(a) * 5 + Math.sin(a * 2.3) * 1.5, my = y - 7 + Math.sin(a) * 3, f = Math.floor(this.t * 14) % 2; g.p('#d8c8a8', mx, my); g.p(f ? '#c8b898' : 'rgba(200,184,152,.5)', mx - 1, my - f); g.p(f ? '#c8b898' : 'rgba(200,184,152,.5)', mx + 1, my - f); } });
LIFE.bee = (box) => ({ x: (box[0] + box[2]) / 2, y: (box[1] + box[3]) / 2, wait: 0, step(dt, L) { this.t = (this.t || 0) + dt; this.vis = L.dark < .4; if ((this.wait -= dt) <= 0) { this.gx = rand(box[0], box[2]); this.gy = rand(box[1], box[3]); this.wait = rand(.6, 2); } this.x += (this.gx - this.x) * Math.min(1, dt * 3) + Math.sin(this.t * 13) * .15; this.y += (this.gy - this.y) * Math.min(1, dt * 3); },
  draw(g) { if (!this.vis) return; g.p('#e0b030', this.x, this.y, 2, 1); g.p('#2a2018', this.x + 1, this.y, 1, 1); g.p(Math.floor(this.t * 20) % 2 ? 'rgba(240,248,255,.85)' : 'rgba(240,248,255,.4)', this.x, this.y - 1, 2, 1); } });
/* which life belongs where (district coordinates of the painted scene) */
const lifeFor = (spec, P) => { const id = spec.id;
  if (id === 'wood') return [LIFE.squirrel(), LIFE.birds(52)];
  if (id === 'mine') return [LIFE.drip(), LIFE.dust([142, 58, 178, 84])];
  if (id === 'fish') return [LIFE.fishjump(), LIFE.dragonfly()];
  if (id === 'haul') return [LIFE.gulls(), LIFE.fishjump([140, 58, 220, 74])];
  if (id === 'thieve') return [LIFE.pigeon(), LIFE.birds(30)];
  if (id === 'hunt' || id === 'capture' || id === 'stake') return [LIFE.rabbit(), LIFE.butterfly([70, 66, 190, 88], true), LIFE.fireflies()];
  if (id === 'forge') return [LIFE.ashdoor(166, 75), LIFE.embers(158, 186, 61, 24)];
  if (id === 'smelt') return [LIFE.embers(118, 122, 69, 18), LIFE.steam(120, 66, () => 1, '190,186,190', 20)];
  if (id === 'cook') return [LIFE.steam(120, 83, () => 1 + Math.min(3, Math.floor(((ses && ses.n) || 0) / 2))), LIFE.bubbles(117, 85, 6), LIFE.cat(64, 95)];
  if (id === 'saw') return [LIFE.hopper(144, 186, 96), LIFE.dust([140, 60, 186, 92])];
  if (id === 'stitch') return [LIFE.mouse(97)];
  if (id === 'runes' || id === 'engrave' || id === 'alch') return [LIFE.motes()];
  if (id === 'grind') return [LIFE.candle(131, 87), LIFE.moth(131, 87), LIFE.bee([136, 66, 176, 84])];
  if (id === 'survey') return [LIFE.butterfly([136, 64, 186, 86], true), LIFE.birds(46)];
  if (id === 'pell' || id === 'butts') return [LIFE.hopper(146, 190, 96, '#2a2a34', '#3a3a48')];
  return []; };

/* ---------- weather and light ---------- */
const tintOf = ({ dark, warm }) => { const sun = [255, 176, 120], night = [70, 84, 150];
  const a = [255, 255, 255].map((v, i) => v + (sun[i] - v) * warm * .45); return a.map((v, i) => Math.round(v + (night[i] - v) * dark * .72 * (1 - warm * .4))); };
const SEASON = { autumn: ['#c8702a', '#b04a2a', '#d0a040'], spring: ['#f4c4d0', '#f8dce4', '#ffffff'] };
const weatherStep = (L, dt) => { const wx = L.weather, want = wx === 'rain' ? 56 : wx === 'snow' ? 38 : 0, G = L.A ? L.A.B : 95;
  if (L.drops.length < want) for (let i = 0; i < Math.min(4, want - L.drops.length); i++) L.drops.push({ x: rand(-10, DW + 20), y: rand(-DH * .6, 0), kind: wx, s: wx === 'rain' ? rand(120, 160) : rand(8, 14), p: rand(0, 6.28), big: Math.random() < .2 });
  L.drops = L.drops.filter(d => { if (d.kind === 'rain') { d.y += d.s * dt; d.x -= d.s * .18 * dt; } else { d.y += d.s * dt; d.x += Math.sin(L.t * 1.3 + d.p) * 4 * dt; }
    if (d.y > DH) { if (L.drops.length > want) return false; d.y = -3; d.x = rand(-10, DW + 20); } return true; });
  /* rain rings the puddles and the water; snow settles in flecks that fill in over a minute and a half, and melts when it stops */
  if (wx === 'rain' && Math.random() < dt * 9) L.rings.push({ x: rand(40, 200), y: rand(G - 1, 99), t: 0 });
  L.rings = L.rings.filter(r => (r.t += dt) < .5);
  L.snow = clamp(L.snow + (wx === 'snow' ? dt / 30 : -dt / 50), 0, 3);
  if (L.season === 'autumn' || L.season === 'spring') { if (!L.fall) L.fall = Array.from({ length: 6 }, () => ({ x: rand(0, DW), y: rand(0, DH), p: rand(0, 6.28), s: rand(6, 11), c: Math.floor(rand(0, 3)) }));
    for (const f of L.fall) { f.y += f.s * dt; f.x += Math.sin(L.t * 1.1 + f.p) * 7 * dt - 2 * dt; if (f.y > DH || f.x < -4) { f.y = -3; f.x = rand(0, DW + 30); } } } };
const drawLife = (L, g) => { g.x.clearRect(0, 0, DW, DH); for (const c of L.critters) if (c.fixed) c.fixed(g, L); if (L.still) return;
  for (const c of L.critters) c.draw(g, L);
  if (!L.P.out) return;
  /* settled snow along the ground and on the pile */
  if (L.snow > .05) { const k = L.snow / 3; for (const s of L.spots) if (k > s.th) g.p(s.y > L.A.B - 2 ? 'rgba(250,252,255,.92)' : 'rgba(240,246,252,.8)', s.x, s.y, s.w, 1); }
  for (const r of L.rings) g.ring('rgba(210,228,240,.7)', r.x, r.y, .6 + r.t * 5);
  /* the season: a leaf or a petal turning as it falls (in the light of the hour, under the wash) */
  if (L.fall && (L.season === 'autumn' || L.season === 'spring')) for (const f of L.fall) { const c = SEASON[L.season][f.c], turn = Math.sin(L.t * 3 + f.p) > 0; if (turn) { g.p(c, f.x, f.y, 2, 1); g.p(mixc(c, '#3a2418', .3), f.x + 1, f.y + 1); } else { g.p(c, f.x, f.y, 1, 2); g.p(mixc(c, '#ffffff', .2), f.x + 1, f.y, 1, 1); } } };
const drawSky = (L, g) => { g.x.clearRect(0, 0, DW, DH); const P = L.P, dk = L.dark;
  if (P.out) {
    /* stars over the skyline after dark */
    if (dk > .45 && P.sky) for (const s of L.stars) if (s.y < P.sky) g.p(`rgba(255,250,232,${((dk - .45) / .55 * (.5 + .4 * Math.sin(L.t * 1.5 + s.p))).toFixed(2)})`, s.x, s.y);
    /* the lantern lights at dusk */
    const glow = clamp((dk - .2) / .6); if (P.lamp) { const [lx, ly, pole, painted] = P.lamp;
      if (!painted) { g.p('#2a2a30', lx - 1, ly - 3, 3, 1); g.p('#2a2a30', lx, ly - 4, 1, 1); g.p(glow > 0 ? '#ffe7a0' : '#b8a888', lx - 1, ly - 2, 3, 3); g.p(glow > 0 ? '#fff6d0' : '#d8ccb0', lx, ly - 1, 1, 1); g.p('#2a2a30', lx - 1, ly + 1, 3, 1); if (pole) g.p('#4a3a2a', lx, ly + 2, 1, pole - ly - 2); else g.p('#2a2a30', lx + 1, ly - 4, 3, 1); }
      if (glow > 0) g.halo('#ffd27a', lx, ly - 1, 5, glow * (L.still ? 1 : .88 + .12 * Math.sin(L.t * 3))); }
    if (L.still) return;
    if (L.weather === 'mist' || L.weather === 'cloud') { const top = L.weather === 'cloud' ? 26 : 56; for (let i = 0; i < 4; i++) { const y = top + i * 10 + Math.sin(L.t * .2 + i) * 2, off = (L.t * (4 + i) + i * 71) % (DW + 140) - 70;
      g.x.fillStyle = L.weather === 'cloud' ? 'rgba(246,251,252,.45)' : 'rgba(228,234,238,.22)'; g.x.fillRect(Math.round(off), Math.round(y), 80, 4); g.x.fillRect(Math.round(off + 10), Math.round(y - 2), 56, 2); g.x.fillRect(Math.round(off - 70 + DW / 2), Math.round(y + 5), 96, 3); } }
    for (const d of L.drops) if (d.kind === 'rain') { g.p('rgba(206,222,242,.65)', d.x, d.y, 1, 3); g.p('rgba(206,222,242,.35)', d.x + 1, d.y - 2, 1, 2); } else g.p('rgba(252,253,255,.95)', d.x, d.y, d.big ? 2 : 1, d.big ? 2 : 1);
    return; }
  /* indoors: the weather and the hour only through the windows */
  const glass = dk > .8 ? '#1e2a50' : dk > .3 || L.warm > .2 ? mixc('#f0a070', '#2a3460', clamp(dk)) : '#bcd8ec';
  for (const [wx, wy] of P.windows) {
    for (const [ox, oy] of [[0, 0], [5, 0], [0, 5], [5, 5]]) g.p(glass, wx + ox, wy + oy, 4, 4);
    if (dk > .6) { g.p('#fff6d8', wx + 1, wy + 1); g.p('#e8e0ff', wx + 7, wy + 2); }
    if (L.still) continue;
    const pane = (x, y) => (x >= wx && x < wx + 9 && y >= wy && y < wy + 9 && x !== wx + 4 && y !== wy + 4);
    if (L.weather === 'rain') for (let i = 0; i < 5; i++) { const x = wx + ((i * 2 + Math.floor(L.t * 3)) % 9), y = wy + ((L.t * 22 + i * 3.7) % 9); if (pane(x, Math.floor(y))) g.p('rgba(220,232,246,.8)', x, y, 1, 2); }
    if (L.weather === 'snow') for (let i = 0; i < 4; i++) { const x = Math.floor(wx + ((i * 2.3 + Math.sin(L.t + i)) % 9 + 9) % 9), y = Math.floor(wy + ((L.t * 3 + i * 2.3) % 9)); if (pane(x, y)) g.p('#ffffff', x, y); }
    if (L.weather === 'mist' || L.weather === 'cloud') { g.x.fillStyle = 'rgba(232,238,242,.5)'; for (const [ox, oy] of [[0, 0], [5, 0], [0, 5], [5, 5]]) g.x.fillRect(wx + ox, wy + oy + 2, 4, 2); } } };

/* ---------- mounting the layers on the live rig's scene ---------- */
const canvas = (cls, z) => { const c = document.createElement('canvas'); c.width = DW; c.height = DH; c.className = 'work-layer ' + cls; c.setAttribute('aria-hidden', 'true'); if (z != null) c.style.zIndex = z; return c; };
let L = null;
const mount = r => {
  const sc = r.sc; sc.querySelectorAll(':scope > .work-layer, :scope > .work-tint').forEach(e => e.remove());
  const marks = canvas('work-marks'), life = canvas('work-life'), sky = canvas('work-sky'), tint = document.createElement('div'); tint.className = 'work-tint'; tint.setAttribute('aria-hidden', 'true');
  sc.prepend(marks, life); sc.append(tint, sky); /* the marks and the life behind the station, the companion and the hero; the wash and the weather over them */
  const P = placeOf(sc), seed = [...String(r.spec.id)].reduce((h, c) => h * 31 + c.charCodeAt(0) >>> 0, 7);
  let s = seed; const rnd = () => (s = (s * 1664525 + 1013904223) >>> 0) / 4294967296;
  L = { r, sc, P, marks, life, sky, tint, gm: pen(marks.getContext('2d')), gl: pen(life.getContext('2d')), gs: pen(sky.getContext('2d')),
    critters: lifeFor(r.spec, P), drops: [], rings: [], snow: 0, t: 0, rev: -1, measured: 0, weather: 'clear', wxAt: 0, dark: 0, warm: 0,
    stars: Array.from({ length: 26 }, () => ({ x: Math.floor(rnd() * DW), y: Math.floor(rnd() * 50), p: rnd() * 6.28 })),
    /* where snow settles first: flecks over the ground in front, filling in as it lies deeper */
    spots: Array.from({ length: 260 }, () => ({ x: Math.floor(rnd() * DW), y: 0, f: rnd(), th: rnd() * .9, w: 1 + Math.floor(rnd() * 3) })) };
  sc._ws = L; ses && (ses.rev++); return L; };
/* where the rig and the target are, in district pixels (measured when the marks are drawn, at most twice a second) */
const spanOf = (img, box, Y) => { try { const w = img.naturalWidth, h = img.naturalHeight; if (!w) return null; const c = spanOf.c || (spanOf.c = document.createElement('canvas')); c.width = w; c.height = h; const x = c.getContext('2d'); x.clearRect(0, 0, w, h); x.drawImage(img, 0, 0);
  const row = Math.round((Y - box[1]) / (box[3] - box[1]) * h); if (row < 0 || row >= h) return null; const d = x.getImageData(0, row, w, 1).data; let a = -1, b = -1;
  for (let i = 0; i < w; i++) if (d[i * 4 + 3] > 40) { if (a < 0) a = i; b = i; } else if (a >= 0) break; if (a < 0) return null; const k = (box[2] - box[0]) / w; return [box[0] + a * k, box[0] + (b + 1) * k]; } catch (e) { return null; } };
const measure = (L, now) => { const { r, sc } = L, spec = r.spec, GY = DH - (spec.ground || 4);
  const A = { GY, B: GY - 1, X0: 120, C: r.contactStage ? [120 + r.contactStage[0], GY + r.contactStage[1]] : [120, GY - 10], T: null, span: null };
  const img = sc.querySelector('.scene-target img');
  if (img && !sc.querySelector('.scene-target.on-station,.scene-target.rig-hidden')) { const sr = sc.getBoundingClientRect(), k = sr.width / (sc.offsetWidth || 1) || 1, ir = img.getBoundingClientRect();
    const ox = sc.clientWidth / 2 - DW * PX / 2, oy = sc.clientHeight - DH * PX, tx = v => ((v - sr.left) / k - sc.clientLeft - ox) / PX, ty = v => ((v - sr.top) / k - sc.clientTop - oy) / PX;
    A.T = [tx(ir.left), ty(ir.top), tx(ir.right), ty(ir.bottom)]; A.span = spanOf(img, A.T, A.C[1]); }
  if (!A.span) A.span = [A.C[0], A.C[0] + 6];
  L.A = A; L.measured = now; for (const s of L.spots) s.y = Math.min(DH - 1, Math.round(A.B - 9 + s.f * (DH - A.B + 9))); return A; };
const paintMarks = (L, now) => { const m = MARK[L.r.spec.id], g = L.gm; g.x.clearRect(0, 0, DW, DH); if (!m || !ses) return;
  m.draw(g, L.A, ses.items, now);
  /* snow caps whatever is piled up (drawn with the settled snow) */ };

/* ---------- the clock ---------- */
const loop = (dt, now) => {
  const r = R().live; if (!r || !r.sc || !r.sc.isConnected) { L = null; return; }
  const s = session(); if (!s) return;
  if (r.spec.id === 'pell' && !s.drill) s.drill = r.ctx && r.ctx.drill;
  if (!L || L.r !== r || r.sc._ws !== L) { mount(r); measure(L, now); }
  if (now - L.measured > 2000) measure(L, now);
  const calm = still(); L.still = calm;
  /* the hour and the weather: read twice a second */
  if (now - L.wxAt > 500) { L.wxAt = now; const town = S().town, light = Q.townLight ? Q.townLight(Q.townHour()) : { dark: 0, warm: 0, phase: 'day' };
    L.dark = light.dark; L.warm = light.warm; L.phase = light.phase; L.weather = L.P.out || L.P.windows.length ? (Q.townWeather ? Q.townWeather(town) : 'clear') : 'clear'; L.season = Q.season ? Q.season() : '';
    const [tr, tg, tb] = L.P.out ? tintOf(light) : [255, 255, 255], col = `rgb(${tr},${tg},${tb})`; if (L.tint.style.backgroundColor !== col) L.tint.style.backgroundColor = col; L.tint.dataset.phase = light.phase; }
  /* the marks: redrawn when something changed, and while a fresh piece is still cooling */
  const hot = MARK[r.spec.id] && MARK[r.spec.id].hot && !calm && s.items.some(it => it.t && now - it.t < HOT + 200);
  if (L.rev !== s.rev || L.ses !== s || (hot && now - (L.hotAt || 0) > 120)) { if (L.ses !== s) measure(L, now); L.ses = s; L.rev = s.rev; L.hotAt = now; paintMarks(L, now); }
  /* life and weather: only while things may move */
  if (!calm) { L.t += dt; for (const c of L.critters) c.step(dt, L); if (L.P.out) weatherStep(L, dt); else L.drops.length = 0; }
  else { L.drops.length = 0; L.rings.length = 0; }
  if (!calm || !L.calmDrawn || now - L.calmDrawn > 1000) { drawLife(L, L.gl); drawSky(L, L.gs); L.calmDrawn = calm ? now : 0; }
};
Q.frame.add(loop); /* the shared animation clock (util.js), after strike_sync.js's */

/* ---------- strikes and yields ---------- */
const live = () => !(Q.sim && Q.sim.on) && !Q.forecasting;
const strike = (r, b) => { if (!live()) return; const s = session(); if (!s || !r || !r.act || keyOf(r.act) !== s.key || !r.sc || !r.sc.isConnected) return; const m = MARK[r.spec.id]; s.s++;
  if (!L || L.r !== r || r.sc._ws !== L) { mount(r); measure(L, performance.now()); }
  if (m && m.strike) { m.strike(L.A, b); s.rev++; } };
Q.on('workcycle', e => { if (!live() || !e) return; const s = session(); if (!s || e.kind !== s.kind || e.id !== s.id) return; const spec = R().specFor({ kind: e.kind, id: e.id }), m = spec && MARK[spec.id]; if (!m) return;
  if (m.any && m.tried) m.tried();
  const q = e.quantity || 0; if (q <= 0) { s.rev++; return; }
  const burnt = Q.S.stats ? Q.S.stats.burn || 0 : 0, wasBurnt = burnt > (s.burnSeen == null ? burnt : s.burnSeen); s.burnSeen = burnt;
  const col = itemCol(outOf(s)); s.n += q; if (wasBurnt) s.burnt++;
  for (let i = 0; i < q && s.items.length < (m.cap || 0); i++) s.items.push({ col, t: m.hot ? performance.now() : 0, burnt: wasBurnt && i === 0 });
  s.rev++; });
/* a new activity clears the scene; the same one carries on where it was */
Q.on('act', () => { const s = session(); if (s && s.burnSeen == null) s.burnSeen = Q.S.stats ? Q.S.stats.burn || 0 : 0; });

Q.workScenes = {
  strike, MARK: Object.keys(MARK), LIFE: Object.keys(LIFE),
  /* for tests: what the scene is showing now */
  live: () => { const r = R().live; return { key: ses && ses.key, spec: r && r.spec.id, strikes: ses ? ses.s : 0, yields: ses ? ses.n : 0, pile: ses ? ses.items.length : 0, cap: r && MARK[r.spec.id] ? MARK[r.spec.id].cap : 0, bits: ses ? ses.bits.length : 0,
    mounted: !!(L && L.sc.isConnected), outdoor: !!(L && L.P.out), weather: L ? L.weather : null, drops: L ? L.drops.length : 0, still: !!(L && L.still), phase: L ? L.phase : null, tint: L ? L.tint.style.backgroundColor : null,
    critters: L ? L.critters.length : 0, lifeInk: L ? ink(L.life) : 0, skyInk: L ? ink(L.sky) : 0, marksInk: L ? ink(L.marks) : 0 }; },
  /* for screenshots and tests: replay n strikes and n yields through the same paths as real work */
  fake: n => { const r = R().live; if (!r) return; for (let i = 0; i < n; i++) { for (const b of r.spec.beats || []) strike(r, b); Q.emit('workcycle', { kind: r.act.kind, id: r.act.id, quantity: 1 }); } }
};
/* painted pixels on a layer (how tests tell "showing" from "empty") */
const ink = c => { const d = c.getContext('2d').getImageData(0, 0, DW, DH).data; let n = 0; for (let i = 3; i < d.length; i += 4) if (d[i]) n++; return n; };
})();
