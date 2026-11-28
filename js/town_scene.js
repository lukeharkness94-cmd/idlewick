/* Idlewick towns, top-down (owner, 28 Nov 2026: "I only want the dark theme ... the pixel art direction I want the
   entire interface ... to take"; towns seen from above in three-quarter view, work and combat scenes stay side-on).
   Every town is a 640 x 360 picture seen from above at a slant, at dusk by default: cobbled streets, cottages with
   tiled, thatched or slate roofs and lit windows, fences, wells, stalls, trees, rocks and water, each town in its own
   character (Willowbrook's farmland, Mossbarrow's fields and windmill, Saltmere's harbour, Ironpeak's snowy forge town
   under the cliffs, Gloomfen on stilts over the fen, Emberfall on black rock beside the lava, Skyreach's monastery
   above the clouds, the haunted Hollow). Townsfolk are about 12 px chibis, homes two to three times that, restoration
   sites 32 x 32 among them, landmarks two to three homes tall. The two main streets carry the walking townsfolk with
   their feet on rows 162 and 244 (js/town_walkers.js); the picture records its lit windows, chimneys, lamps, homes,
   ponds, yards, pens, water and lava in A.sceneMeta for the living-town layer (js/town_life.js).
   Drawn in code: shapes in materials (five-step hue-shifted ramps, cool shadows and warm lights), lit from the top
   left, then a selective outline (each edge in its own material's darkest colour). Nothing traced or copied. */
(() => {
const DQ = window.DQ, D = DQ.data, A = DQ.pixelArt; if (!A) return;
const W = 640, H = 360, ROADS = [162, 244];

/* ---------------- the pixel engine ---------------- */
const hex = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
const toHex = a => '#' + a.map(v => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('');
const mix = (a, b, k) => { const p = hex(a), q = hex(b); return toHex(p.map((v, i) => v + (q[i] - v) * k)); };
const ramp = (base, o = {}) => { const cool = o.cool || '#1a1838', warm = o.warm || '#fff2c8'; return [mix(base, cool, .72), mix(base, cool, .34), base, mix(base, warm, .28), mix(base, warm, .56)]; };
const fixed = c => [c, c, c, c, c];
class Spr {
  constructor(w, h) { this.w = w; this.h = h; this.m = new Int16Array(w * h).fill(-1); this.l = new Float32Array(w * h); this.mats = []; }
  mat(base, o) { const r = Array.isArray(base) ? base : ramp(base, o); this.mats.push(r); return this.mats.length - 1; }
  set(x, y, m, l = 2) { x = Math.round(x); y = Math.round(y); if (x < 0 || y < 0 || x >= this.w || y >= this.h) return; this.m[y * this.w + x] = m; this.l[y * this.w + x] = l; }
  get(x, y) { if (x < 0 || y < 0 || x >= this.w || y >= this.h) return -1; return this.m[y * this.w + x]; }
  lv(x, y) { return this.l[y * this.w + x]; }
  clear(x, y) { x = Math.round(x); y = Math.round(y); if (x >= 0 && y >= 0 && x < this.w && y < this.h) this.m[y * this.w + x] = -1; }
  /* a lit ellipse: light from the top left, a soft terminator, a highlight near the top left */
  ell(cx, cy, rx, ry, m, o = {}) { const L = o.light || [-.55, -.7]; for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++) for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++) {
    const nx = (x + .5 - cx) / rx, ny = (y + .5 - cy) / ry, d = nx * nx + ny * ny; if (d > 1) continue;
    const nz = Math.sqrt(Math.max(0, 1 - d)), dot = -(nx * L[0] + ny * L[1]) * .8 + nz * .45;
    this.set(x, y, m, o.flat != null ? o.flat : dot > .78 ? 4 : dot > .42 ? 3 : dot > .02 ? 2 : 1); } return this; }
  rect(x, y, w, h, m, o = {}) { for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) { let lv = o.flat != null ? o.flat : 2; if (o.flat == null) { if (j === 0 || i === 0) lv = 3; if (j === h - 1 || i === w - 1) lv = 1; } this.set(x + i, y + j, m, lv); } return this; }
  poly(pts, m, o = {}) { const xs = pts.map(p => p[0]), ys = pts.map(p => p[1]); const x0 = Math.floor(Math.min(...xs)), x1 = Math.ceil(Math.max(...xs)), y0 = Math.floor(Math.min(...ys)), y1 = Math.ceil(Math.max(...ys));
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) { let inside = false; for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) { const [xi, yi] = pts[i], [xj, yj] = pts[j]; if ((yi > y + .5) !== (yj > y + .5) && x + .5 < (xj - xi) * (y + .5 - yi) / (yj - yi) + xi) inside = !inside; }
      if (inside) this.set(x, y, m, o.flat != null ? o.flat : 2); } return this; }
  line(x0, y0, x1, y1, m, lv = 2) { const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0), 1); for (let i = 0; i <= n; i++) this.set(x0 + (x1 - x0) * i / n, y0 + (y1 - y0) * i / n, m, lv); return this; }
  dot(x, y, m, lv = 2) { this.set(x, y, m, lv); return this; }
  /* edge light for flat shapes: lit where open to the top left, shaded where open to the bottom right */
  edges(m) { for (let y = 0; y < this.h; y++) for (let x = 0; x < this.w; x++) { if (this.get(x, y) !== m) continue; const i = y * this.w + x;
    if (this.get(x, y - 1) !== m || this.get(x - 1, y) !== m) this.l[i] = Math.max(this.l[i], 3); if (this.get(x, y + 1) !== m || this.get(x + 1, y) !== m) this.l[i] = Math.min(this.l[i], 1); } return this; }
  /* the selective outline: every empty pixel touching a shape takes the darkest colour of what it touches */
  outline() { const add = []; for (let y = 0; y < this.h; y++) for (let x = 0; x < this.w; x++) { if (this.get(x, y) >= 0) continue; for (const [a, b] of [[0, -1], [1, 0], [0, 1], [-1, 0]]) { const v = this.get(x + a, y + b); if (v >= 0) { add.push([x, y, v]); break; } } }
    for (const [x, y, m] of add) { this.m[y * this.w + x] = m; this.l[y * this.w + x] = 0; } return this; }
  col(i) { const m = this.m[i]; return m < 0 ? null : this.mats[m][Math.max(0, Math.min(4, Math.round(this.l[i])))]; }
  /* colours for A.url / A.toCanvas (pixelart.js), already outlined */
  render() { const out = new Array(this.w * this.h); for (let i = 0; i < out.length; i++) out[i] = this.col(i); return out; }
  canvas() { const c = document.createElement('canvas'); c.width = this.w; c.height = this.h; const x = c.getContext('2d'), d = x.createImageData(this.w, this.h), rgb = this.mats.map(r => r.map(hex));
    for (let i = 0; i < this.w * this.h; i++) { const m = this.m[i]; if (m < 0) continue; const p = rgb[m][Math.max(0, Math.min(4, Math.round(this.l[i])))]; d.data[i * 4] = p[0]; d.data[i * 4 + 1] = p[1]; d.data[i * 4 + 2] = p[2]; d.data[i * 4 + 3] = 255; }
    x.putImageData(d, 0, 0); return c; }
}
const seeded = s => { let h = 2166136261; for (const c of String(s)) h = Math.imul(h ^ c.charCodeAt(0), 16777619); return () => { h = Math.imul(h ^ (h >>> 15), 2246822507); h = Math.imul(h ^ (h >>> 13), 3266489909); h ^= h >>> 16; return (h >>> 0) / 4294967296; }; };
const hash2 = (x, y) => { let h = Math.imul(x * 374761393 + y * 668265263, 1274126177); h ^= h >>> 13; return (h >>> 0) % 1000 / 1000; };
const pick = (a, r) => a[Math.floor(r() * a.length) % a.length];
const cache = new Map(), memo = (k, make) => { if (!cache.has(k)) cache.set(k, make()); return cache.get(k); };

/* ---------------- palettes: warm lights, cool shadows, dusk by default ---------------- */
const GLASS = ['#6a3c16', '#d08a2c', '#f2b650', '#fcd77e', '#fff2c0'], DARK_GLASS = ['#0c0e16', '#161a26', '#20283a', '#3a4a64', '#5a6c88'];
const SKIN = { fair: '#f2c9a0', light: '#e8b98e', tan: '#c98e5e', brown: '#9a6640', deep: '#6e4428', pale: '#e6dccf', dwarf: '#e0a882' };
/* each town: its ground, its streets, its homes' walls and roofs, its trees and its windows' glow */
const TD = {
  willowbrook: { grass: '#2f5434', cob: '#5a5a66', dirt: '#5e4630', walls: [['timber', '#d6c49c'], ['stone', '#7a7c8a'], ['timber', '#cbb48c']], roofs: [['thatch', '#b08a40'], ['tile', '#a8463a'], ['tile', '#b4583c']], tree: 'oak', leaf: '#3c6e46', flowers: true, front: 'meadow', back: 'farm', square: 'well', glow: '#f2b650', lamp: '#ffc860' },
  mossbarrow: { grass: '#3c5428', cob: '#5e5848', dirt: '#6a5230', walls: [['timber', '#d8c8a0'], ['brick', '#a0563e'], ['plaster', '#d0b890']], roofs: [['thatch', '#b89848'], ['tile', '#a8463a'], ['thatch', '#a07e38']], tree: 'oak', leaf: '#4a6e34', flowers: true, front: 'meadow', back: 'fields', square: 'market', landmark: 'windmill', glow: '#f2b650', lamp: '#ffc860' },
  saltmere: { grass: '#6a6248', cob: '#5e626c', dirt: '#7a6a4a', sand: true, walls: [['plaster', '#d8dee2'], ['plank', '#8a7a62'], ['plaster', '#c8d2d8']], roofs: [['slate', '#3e5a7a'], ['slate', '#4a6a8a'], ['tile', '#a04a3c']], tree: 'palm', leaf: '#4a7a4a', front: 'harbour', back: 'dunes', square: 'fish', landmark: 'lighthouse', glow: '#f2c060', lamp: '#ffd080' },
  ironpeak: { grass: '#8a94a8', cob: '#5a5e6a', dirt: '#6a6a70', snow: true, walls: [['stone', '#7a7e8c'], ['log', '#6e4e34'], ['stone', '#8a8a92']], roofs: [['slate', '#3e4450'], ['slate', '#4a505e'], ['shingle', '#5a4636']], tree: 'pine', leaf: '#2e5444', front: 'snowfield', back: 'cliffs', square: 'anvil', landmark: 'mine', glow: '#ffb848', lamp: '#ffb050' },
  gloomfen: { grass: '#2c3a28', cob: '#4a4636', dirt: '#3e3424', fen: true, walls: [['plank', '#6a5a40'], ['plank', '#5a4c36'], ['log', '#5e4a32']], roofs: [['moss', '#4e6a36'], ['thatch', '#6a6438'], ['moss', '#3e5a30']], tree: 'fen', leaf: '#34502e', front: 'fen', back: 'marsh', square: 'pool', stilts: 5, glow: '#b8e888', lamp: '#b8f088' },
  emberfall: { grass: '#2e2424', cob: '#463a3a', dirt: '#3a2c28', ash: true, walls: [['stone', '#6a3e34'], ['brick', '#7a4232'], ['stone', '#5a3a36']], roofs: [['slate', '#2e2228'], ['tile', '#5a2a24'], ['slate', '#3a2a2e']], tree: 'charred', leaf: '#4a3a2a', front: 'lava', back: 'volcano', square: 'brazier', landmark: 'citadel', glow: '#ffa840', lamp: '#ff9a3a' },
  skyreach: { grass: '#3e5452', cob: '#6a6e7c', dirt: '#5a5a62', rocky: true, walls: [['plaster', '#e2e0d8'], ['stone', '#a8a8b0'], ['plaster', '#d8d4cc']], roofs: [['tile', '#b0402e'], ['tile', '#c0563a'], ['slate', '#5a6478']], tree: 'windpine', leaf: '#3e6a5a', front: 'clouds', back: 'peaks', square: 'shrine', landmark: 'monastery', glow: '#ffd070', lamp: '#ffd890' },
  hollow: { grass: '#28202e', cob: '#3e3848', dirt: '#2e2630', haunted: true, walls: [['stone', '#5a5066'], ['plank', '#4a3e46'], ['stone', '#4a4458']], roofs: [['slate', '#2a2234'], ['shingle', '#3a2e3e'], ['slate', '#342a40']], tree: 'dead', leaf: '#3a2e40', front: 'graves', back: 'deadwood', square: 'statue', landmark: 'castle', glow: '#c8a8ff', lamp: '#b898ff', ruined: .35 }
};

/* ---------------- buildings in three-quarter view ---------------- */
/* o: w wall length, wh wall height, ns near slope, fs far slope, roof [kind, colour], wall [kind, colour], hip, lit, ruin,
   chimney 'l' | 'r', snow, stilts, sign colour, door position. Returns the canvas and where its windows, chimney and door are. */
const bld = o => memo('b:' + JSON.stringify(o), () => {
  const w = o.w, wh = o.wh, ns = o.ns, fs = o.fs, ov = o.ov != null ? o.ov : 2, ch = o.chimney ? 7 : 0, st = o.stilts || 0, rw = w + ov * 2;
  const s = new Spr(rw + 2, 1 + ch + fs + ns + 1 + wh + st + 2), L = 1, wx = 1 + ov, top = 1 + ch, ridge = top + fs, eave = ridge + ns, base = eave + wh + 1, r = seeded(JSON.stringify(o));
  const roof = s.mat(o.roof[1]), wall = s.mat(o.wall[1]), frame = s.mat('#4a3020'), glass = s.mat(o.lit ? GLASS : DARK_GLASS), wood = s.mat('#6e4a2c'), stone = s.mat('#6a6a74'), hole = s.mat('#140e12'), snow = s.mat('#d8e2f0', { cool: '#3a4a7a' }), timber = s.mat('#5a3a24');
  const kind = o.roof[0], hi = o.hip ? Math.min(Math.round((fs + ns) * .9), Math.floor(rw / 3)) : 0, out = { windows: [], chimney: null, door: null };
  /* the roof: far slope (lit), hips, near slope; each kind has its own courses */
  for (let y = top; y <= eave; y++) for (let u = 0; u < rw; u++) {
    const bnd = hi ? (y <= ridge ? hi * (y - top) / Math.max(1, fs) : hi * (eave - y) / Math.max(1, ns)) : 0;
    const face = u < bnd - .2 ? 'L' : u > rw - 1 - bnd + .2 ? 'R' : y < ridge ? 'F' : 'N', yy = y < ridge ? y - top : y - ridge, X = L + u;
    let lv = 2;
    if (kind === 'tile') { const k = yy % 3, row = Math.floor(yy / 3); lv = k === 0 ? 3 : k === 2 ? 1 : 2; if (k < 2 && (u + row * 2) % 4 === 0) lv = 1; }
    else if (kind === 'slate') { const k = yy % 2, row = Math.floor(yy / 2); lv = k === 0 ? 2 : 1; if (k === 0 && (u + row * 2) % 5 === 0) lv = 1; if (k === 0 && (u + row * 2) % 5 === 1) lv = 3; }
    else if (kind === 'shingle') { const k = yy % 3, row = Math.floor(yy / 3); lv = k === 0 ? 3 : k === 2 ? 1 : 2; if ((u + row) % 3 === 0 && k) lv = 1; if (hash2(u, row) > .85) lv = 1; }
    else if (kind === 'thatch') { lv = [2, 3, 2, 1, 2, 2][(u + Math.floor(yy / 3) * 2) % 6]; if (hash2(u, yy) > .9) lv = 3; if (yy % 5 === 4) lv = Math.min(lv, 2); }
    else if (kind === 'moss') { lv = hash2(u >> 1, yy >> 1) > .6 ? 3 : hash2(u, yy) > .82 ? 1 : 2; }
    if (face === 'F') lv = Math.min(4, lv + 1); else if (face === 'L') lv = Math.min(4, lv + 1); else if (face === 'R') lv = Math.max(1, lv - 1);
    if (y === ridge && face === 'N' || y === ridge - 1 && face === 'F' && kind !== 'thatch') lv = face === 'N' ? 4 : 3;
    if (hi && Math.abs(u - bnd) < .7 || hi && Math.abs((rw - 1 - u) - bnd) < .7) lv = 1;
    if (y === eave) lv = kind === 'thatch' || kind === 'moss' ? 1 : 0;
    s.set(X, y, roof, lv);
  }
  if (kind === 'thatch' || kind === 'moss') for (let u = 0; u < rw; u += 2) if (hash2(u, 7) > .4) s.set(L + u, eave + 1, roof, 0); /* a ragged straw eave */
  /* snow on the roof */
  if (o.snow) for (let y = top; y <= eave - 2; y++) for (let u = 0; u < rw; u++) { const yy = y - top; if (yy <= fs + 1 || (y < ridge + 3 && hash2(u, y) > .25) || hash2(u, y) > .93) if (s.get(L + u, y) === roof) s.set(L + u, y, snow, yy < 1 ? 4 : hash2(u, y + 9) > .6 ? 3 : 2); }
  /* a ruined roof: holes onto the rafters, a ragged edge */
  if (o.ruin) { const hx = Math.round(rw * (.25 + r() * .3)), hw = Math.max(5, Math.round(rw * .28)), hy = ridge + 1, hh = Math.max(3, ns - 3);
    for (let y = hy; y < hy + hh; y++) for (let u = hx; u < hx + hw - Math.abs(y - hy - hh / 2) | 0; u++) s.set(L + u, y, (u - hx) % 3 === 0 ? wood : hole, (u - hx) % 3 === 0 ? 1 : 2);
    for (let u = 0; u < rw; u++) if (hash2(u, 3) > .7) s.clear(L + u, top); }
  /* walls: the wall's own courses, lit on the left, in the roof's shadow at the top */
  const wk = o.wall[0];
  for (let j = 0; j < wh; j++) for (let i = 0; i < w; i++) { const y = eave + 1 + j, X = wx + i; let m = wall, lv = 2;
    if (wk === 'stone') { const k = j % 3, row = Math.floor(j / 3); lv = k === 0 ? 3 : k === 2 ? 1 : 2; if ((i + row * 3) % 6 === 0) lv = 1; }
    else if (wk === 'brick') { const k = j % 2, row = Math.floor(j / 2); lv = k === 1 ? 1 : 2; if (k === 0 && (i + row * 2) % 4 === 0) lv = 1; if (k === 0 && (i + row * 2) % 4 === 1) lv = 3; }
    else if (wk === 'plank') { lv = i % 3 === 0 ? 1 : i % 3 === 1 ? 3 : 2; if (hash2(i, j) > .95) lv = 1; }
    else if (wk === 'log') { const k = j % 3; lv = k === 0 ? 3 : k === 2 ? 1 : 2; if (i === 0 || i === w - 1) lv = k === 1 ? 4 : 2; }
    else if (wk === 'timber') { if (j === wh - 1 || j === 1 || i === 0 || i === w - 1 || i % 11 === 5 || (j === (o.storeys === 2 ? 10 : Math.floor(wh / 2)) && (o.halfbeam || o.storeys === 2))) { m = timber; lv = i === 0 ? 3 : 2; } else lv = hash2(i, j) > .9 ? 3 : 2; }
    else lv = hash2(i, j) > .9 ? 3 : 2;
    if (i === 0 && m === wall) lv = Math.max(lv, 3); if (i === w - 1 && m === wall) lv = Math.min(lv, 1);
    if (j === 0) { m = wall; lv = 0; } else if (j === 1 && m === wall) lv = 1; /* the eave's shadow */
    s.set(X, y, m, lv); }
  for (let i = 0; i < w; i++) s.set(wx + i, base - 1, stone, i === 0 ? 3 : 1); /* the footing */
  /* the door, windows (lit or dark, boarded on an empty house), a flower box now and then */
  const dw = 5, dh = Math.min(8, wh - 3), dx = o.door != null ? wx + o.door : wx + Math.floor((w - dw) / 2);
  for (let j = 0; j < dh; j++) for (let i = 0; i < dw; i++) { if (j === 0 && (i === 0 || i === dw - 1)) continue; s.set(dx + i, base - 1 - dh + j, o.ruin ? hole : wood, o.ruin ? 2 : i === 0 ? 3 : i % 2 ? 1 : 2); }
  for (let i = -1; i <= dw; i++) s.set(dx + i, base - 1, stone, 3);
  if (!o.ruin) s.set(dx + dw - 2, base - 1 - Math.ceil(dh / 2), s.mat(fixed('#f0c860')), 2);
  out.door = [dx + 2, base];
  const ws = 7, win = (X, wy) => {
    for (let j = 0; j < ws; j++) for (let i = 0; i < ws; i++) { const edge = j === 0 || i === 0 || j === ws - 1 || i === ws - 1 || i === 3 || j === 3;
      if (edge) s.set(X + i, wy + j, frame, j === 0 || i === 0 ? 3 : 1); else s.set(X + i, wy + j, glass, (i === 1 && j === 1) ? 4 : (i > 3 && j > 3) ? 1 : (i < 3 && j < 3) ? 3 : 2); }
    if (!o.lit && !o.ruin && o.board) { s.line(X, wy + 1, X + ws - 1, wy + ws - 3, wood, 3); s.line(X, wy + ws - 2, X + ws - 1, wy + 2, wood, 2); }
    if (o.ruin) for (let j = 1; j < ws - 1; j++) for (let i = 1; i < ws - 1; i++) if (i !== 3 && j !== 3) s.set(X + i, wy + j, hole, 2);
    for (let i = -1; i <= ws; i++) s.set(X + i, wy + ws, stone, 3);
    if (o.lit) { out.windows.push([X + 1, wy + 1, ws - 2, ws - 2]); if (o.flowers && hash2(X, wy + w) > .45) { const bx = s.mat('#7a4a2a'); for (let i = 0; i < ws; i++) { s.set(X + i, wy + ws + 1, bx, 2); if (i % 2) s.set(X + i, wy + ws, s.mat(pick(['#e05a7a', '#f0d060', '#e8e8f0', '#a87ae0'], () => hash2(X, i))), 3); } } } };
  /* windows in bays between the door and the corners; a two-storey house has a row above, over the door too */
  const n = Math.max(1, Math.floor((w - 6) / 12)), bays = Array.from({ length: n }, (_, k) => wx + Math.round(3 + k * (w - 6 - ws) / Math.max(1, n - 1 || 1))).map(v => n === 1 ? (dx > wx + w / 2 ? wx + 3 : wx + w - 3 - ws) : v);
  const lowY = base - 2 - ws - 2, clearOfDoor = X => !(X + ws > dx - 1 && X < dx + dw + 1);
  if (wh >= 11) for (const X of bays) if (clearOfDoor(X)) win(X, o.storeys === 2 ? lowY : eave + 3);
  if (o.storeys === 2) for (const X of bays.concat(n % 2 ? [] : [dx - 1])) win(X, eave + 3);
  /* a dormer on a big roof: a little gable with its own window */
  if (o.dormer && !o.ruin) { const cx = wx + Math.round(w * (o.chimney === 'l' ? .62 : .34)), dy = ridge + 2, dwm = s.mat(o.wall[1]);
    s.rect(cx - 4, dy + 3, 9, 6, dwm); for (let j = 0; j < 4; j++) for (let i = 0; i < 3; i++) s.set(cx - 1 + i, dy + 4 + j, glass, i === 0 && j === 0 ? 4 : 2);
    s.poly([[cx - 6, dy + 4], [cx + .5, dy - 2], [cx + 7, dy + 4]], roof); for (let i = -6; i <= 6; i++) s.set(cx + i, dy + 3 + (Math.abs(i) > 4 ? 1 : 0), roof, 0);
    if (o.lit) out.windows.push([cx - 1, dy + 4, 3, 4]); }
  if (o.sign) { const sg = s.mat(o.sign), br = dx + dw + 1; s.set(br, eave + 3, wood, 1); s.set(br + 1, eave + 3, wood, 1); s.rect(br, eave + 4, 4, 3, sg); }
  /* a ruined wall: cracks and a broken corner */
  if (o.ruin) { for (let j = 2; j < wh - 1; j++) s.set(wx + w - 6 + (j % 2), eave + 1 + j, hole, 2); for (let j = 0; j < 4; j++) for (let i = 0; i < 4 - j; i++) s.clear(wx + w - 1 - i + ov, eave + 1 + j); }
  /* stilts over the water */
  if (st) for (let j = 0; j < st; j++) for (const px of [wx + 1, wx + Math.floor(w / 2) - 1, wx + w - 3]) { s.set(px, base + j, wood, 2); s.set(px + 1, base + j, wood, 1); }
  /* the chimney */
  if (o.chimney) { const cx = o.chimney === 'l' ? wx + 3 : wx + w - 8; s.rect(cx, top - 6, 5, fs + 6, stone); for (let i = -1; i < 6; i++) s.set(cx + i, top - 7, stone, i === -1 ? 3 : 1);
    if (o.snow) for (let i = 0; i < 5; i++) s.set(cx + i, top - 7, snow, 4); out.chimney = o.lit ? [cx + 2, top - 8] : null; }
  s.outline();
  return Object.assign(out, { c: s.canvas(), w: s.w, h: s.h, base, wx });
});

/* ---------------- trees, bushes, rocks and the town's small things ---------------- */
const treeArt = (kind, sz, leaf) => memo(`t:${kind}:${sz}:${leaf}`, () => {
  if (kind === 'pine' || kind === 'windpine') { const w = 10 + sz * 6, h = 20 + sz * 10, s = new Spr(w + 2, h + 2), l = s.mat(leaf, { cool: '#0a1830', warm: '#d8f0b0' }), b = s.mat('#4a3426'), sn = s.mat('#dfe8f4', { cool: '#3a4a7a' });
    s.rect(w / 2 - 1, h - 6, 3, 6, b); const tiers = 3 + sz;
    for (let t = 0; t < tiers; t++) { const ty = 2 + t * (h - 8) / tiers, hw = 2 + (t + 1) * (w / 2 - 1) / tiers; s.poly([[w / 2 + 1, ty], [w / 2 + 1 + hw, ty + (h - 6) / tiers + 3], [w / 2 + 1 - hw, ty + (h - 6) / tiers + 3]], l); }
    s.edges(l); if (kind === 'pine') for (let y = 0; y < s.h; y++) for (let x = 0; x < s.w; x++) if (s.get(x, y) === l && s.get(x, y - 1) !== l && hash2(x, y) > .3) s.set(x, y, sn, 4);
    return s.outline().canvas(); }
  if (kind === 'dead' || kind === 'charred') { const w = 18 + sz * 6, h = 24 + sz * 8, s = new Spr(w, h), b = s.mat(kind === 'dead' ? '#5a4a5a' : '#3a2a26'), g = s.mat(fixed('#ff8a3a'));
    s.rect(w / 2 - 1, h * .4, 3, h * .6 - 2, b); const br = [[w / 2, h * .45, 3, h * .12], [w / 2 + 1, h * .5, w - 3, h * .25], [w / 2, h * .62, 2, h * .4], [w / 2 + 1, h * .35, w * .7, 3], [w / 2, h * .3, w * .3, 2]];
    for (const [a, b2, c, d] of br) s.line(a, b2, c, d, b, 3); s.edges(b); if (kind === 'charred') { s.dot(w / 2, h * .7, g); s.dot(w / 2 + 1, h * .82, g); }
    return s.outline().canvas(); }
  if (kind === 'palm') { const w = 26, h = 30 + sz * 4, s = new Spr(w, h), t = s.mat('#8a6a46'), l = s.mat(leaf, { cool: '#0a1830', warm: '#e0f0a0' });
    for (let j = 0; j < h - 12; j++) s.set(13 + Math.round(Math.sin(j / 6) * 2), h - 2 - j, t, j % 3 ? 2 : 1), s.set(14 + Math.round(Math.sin(j / 6) * 2), h - 2 - j, t, 1);
    const cx = 13 + Math.round(Math.sin((h - 14) / 6) * 2), cy = 9; for (const [dx, dy] of [[-11, 4], [11, 4], [-8, -5], [8, -5], [0, -7], [-12, 9], [12, 9]]) { s.line(cx, cy, cx + dx, cy + dy, l, 3); s.line(cx, cy + 1, cx + dx, cy + dy + 1, l, 2); }
    s.ell(cx, cy, 2, 2, s.mat('#6a4a2a')); return s.outline().canvas(); }
  const w = 22 + sz * 8, h = 26 + sz * 8, s = new Spr(w, h), l = s.mat(leaf, { cool: '#0a1830', warm: '#d8f0a0' }), b = s.mat('#5a4030');
  s.rect(w / 2 - 2, h - 11, 4, 9, b); s.ell(w / 2 - 4, h - 3, 2.6, 1.4, b); s.ell(w / 2 + 4, h - 3, 2.6, 1.4, b);
  const R = (w - 4) / 2, blobs = kind === 'fen' ? [[0, -2, .7], [-.5, .2, .55], [.5, .2, .55], [0, .45, .5]] : [[0, -.25, .62], [-.45, .1, .5], [.45, .15, .52], [-.2, -.55, .45], [.3, -.5, .45], [0, .3, .5]];
  for (const [dx, dy, k] of blobs) s.ell(w / 2 + dx * R, (h - 10) / 2 + dy * R + (kind === 'fen' ? 2 : 0), R * k, R * k * .92, l);
  if (kind === 'fen') for (let i = 0; i < 6; i++) s.line(4 + i * (w - 8) / 5, h * .45, 4 + i * (w - 8) / 5, h * .45 + 5 + (i % 2) * 3, l, 1); /* the drooping moss */
  if (kind === 'oak' && sz > 0) for (let i = 0; i < 5; i++) s.dot(w / 2 - R * .6 + hash2(i, sz) * R * 1.2, h * .25 + hash2(sz, i) * h * .3, s.mat(fixed('#c84a3a')));
  return s.outline().canvas(); });
const bushArt = (leaf, v = 0) => memo(`bu:${leaf}:${v}`, () => { const s = new Spr(20, 15), l = s.mat(leaf, { cool: '#0a1830', warm: '#d8f0a0' }); s.ell(7, 8, 5.5, 5, l); s.ell(13, 7, 6, 5.5, l); s.ell(10, 10, 6.5, 3.6, l); if (v) for (const [x, y] of [[6, 6], [12, 5], [15, 8]]) s.dot(x, y, s.mat(fixed(v === 1 ? '#e05a7a' : '#f0d060'))); return s.outline().canvas(); });
const rockArt = (col, v = 0) => memo(`r:${col}:${v}`, () => { const s = new Spr(16, 12), m = s.mat(col); s.poly(v ? [[1, 10], [3, 4], [8, 2], [13, 4], [14, 10]] : [[1, 10], [4, 3], [10, 2], [14, 6], [13, 10]], m); s.edges(m); s.line(6, 4, 8, 8, m, 1); return s.outline().canvas(); });
const shroomArt = () => memo('sh', () => { const s = new Spr(9, 9), c = s.mat('#c8402e'), st = s.mat('#ecdcbc'), w = s.mat(fixed('#fff6e4')); s.rect(3, 4, 3, 4, st); s.ell(4.5, 3.5, 4, 2.6, c); s.dot(3, 2, w); s.dot(6, 3, w); return s.outline().canvas(); });
const stumpArt = () => memo('st', () => { const s = new Spr(14, 11), b = s.mat('#5a4030'), r = s.mat('#a8865a'); s.rect(2, 4, 10, 5, b); s.ell(7, 4, 5, 2.2, r); s.dot(7, 4, b, 1); s.ell(3, 9, 2, 1, b); return s.outline().canvas(); });
const barrelArt = () => memo('ba', () => { const s = new Spr(10, 12), b = s.mat('#7a5232'), i = s.mat('#5a5e6a'); s.rect(1, 2, 8, 9, b); s.edges(b); s.rect(1, 4, 8, 1, i, { flat: 2 }); s.rect(1, 8, 8, 1, i, { flat: 2 }); s.ell(5, 2, 4, 1.2, s.mat('#a07a4a')); return s.outline().canvas(); });
const crateArt = () => memo('cr', () => { const s = new Spr(12, 12), b = s.mat('#8a6038'); s.rect(1, 3, 10, 8, b); s.rect(1, 1, 10, 3, s.mat('#a8804e'), { flat: 3 }); s.line(1, 4, 10, 10, b, 1); return s.outline().canvas(); });
const hayArt = () => memo('hay', () => { const s = new Spr(14, 12), h = s.mat('#c8a040'); s.ell(7, 6, 6, 5, h); for (let x = 3; x < 12; x += 2) s.line(x, 2, x, 10, h, hash2(x, 1) > .5 ? 3 : 1); return s.outline().canvas(); });
const graveArt = v => memo('gr' + v, () => { const s = new Spr(10, 12), m = s.mat('#6a6478'); if (v) { s.rect(4, 1, 2, 9, m); s.rect(2, 3, 6, 2, m); } else { s.rect(2, 3, 6, 7, m); s.ell(5, 3, 3, 2, m); s.line(4, 5, 5, 5, m, 1); } s.edges(m); s.ell(5, 10, 4, 1.2, s.mat('#3a3240')); return s.outline().canvas(); });
const reedArt = () => memo('reed', () => { const s = new Spr(10, 12), r = s.mat('#6a7a3a'), c = s.mat('#6a4a2a'); for (const x of [2, 4, 6, 8]) s.line(x, 11, x + (x % 4 ? 1 : -1), 3 + (x % 3), r, 2); s.rect(3, 2, 1, 3, c); s.rect(7, 3, 1, 3, c); return s.outline().canvas(); });
const lampArt = col => memo('lamp' + col, () => { const s = new Spr(9, 20), p = s.mat('#2e2620'), g = s.mat(fixed(col)), hl = s.mat(fixed('#fff4d0')); s.rect(4, 6, 2, 13, p, { flat: 2 }); s.rect(2, 1, 6, 6, p, { flat: 1 }); s.rect(3, 2, 4, 4, g, { flat: 2 }); s.dot(4, 3, hl); s.rect(1, 18, 8, 1, p, { flat: 1 }); return s.outline().canvas(); });
/* fence runs, drawn on the ground (pickets with a rail) */
const fenceH = (f, x0, x1, y, col = '#5a4030') => { const lt = mix(col, '#fff2c8', .25), dk = mix(col, '#1a1838', .6); for (let q = x0; q < x1; q += 4) { f(dk, q - 1, y - 7, 4, 9); f(col, q, y - 6, 2, 7); f(lt, q, y - 6, 1, 6); } f(dk, x0 - 1, y - 4, x1 - x0, 2); f(col, x0, y - 4, x1 - x0 - 2, 1); };

/* ---------------- townsfolk: small chibis seen from above at a slant (about 12 px tall) ---------------- */
const CLOTH = ['#3f6fb0', '#a8443a', '#6a8a4a', '#b88a3a', '#6a4a8a', '#5e5e6a', '#b86a7a', '#3a7a7a'], HAIRS = ['#3a2414', '#6a4024', '#c8a050', '#24222a', '#9a9a9a', '#8a3a24'];
const folkLook = r => ({ skin: pick(Object.values(SKIN).slice(0, 5), r), hair: pick(HAIRS, r), hs: pick(['short', 'short', 'long', 'bun', 'bald'], r), cloth: pick(CLOTH, r), basket: r() < .2 });
/* dir: 1 right, -1 left, 0 facing you; frame: 0 or 1 (stride), 'cheer' arms up */
const folkSpr = (lk, frame, dir) => memo('f:' + JSON.stringify(lk) + frame + dir, () => {
  const s = new Spr(11, 15), sk = s.mat(lk.skin || SKIN.light), hr = s.mat(lk.hair || '#3a2414'), cl = s.mat(lk.cloth || '#5e5e6a'), lg = s.mat('#3a3038'), k = s.mat(fixed('#141018'));
  const side = dir !== 0, F = frame === 1, cheer = frame === 'cheer';
  /* legs and feet */
  if (side) { s.rect(F ? 3 : 4, 11, 2, 2, lg, { flat: 1 }); s.rect(F ? 6 : 5, 11, 2, 2, lg, { flat: 2 }); } else { s.rect(4, 11, 1, 2, lg, { flat: F ? 1 : 2 }); s.rect(6, 11, 1, F ? 1 : 2, lg, { flat: 2 }); s.rect(4, 11, 3, 1, lg, { flat: 1 }); }
  /* body, arms; an apron or shawl */
  s.rect(3, 8, 5, 3, cl); if (lk.apron) s.rect(4, 9, 3, 2, s.mat(lk.apron), { flat: 3 }); if (lk.shawl) s.rect(3, 8, 5, 1, s.mat(lk.shawl), { flat: 3 });
  if (cheer) { s.rect(2, 4, 1, 4, sk, { flat: 3 }); s.rect(8, 4, 1, 4, sk, { flat: 2 }); }
  else if (side) s.rect(5, 8, 1, 3, cl, { flat: 1 }); else { s.rect(2, 8, 1, 3, cl, { flat: 3 }); s.rect(8, 8, 1, 3, cl, { flat: 1 }); }
  /* head (big, chibi) and hair */
  s.ell(5.5, 5, 3.2, 3, sk); const hs = lk.hs || 'short';
  if (hs !== 'bald' && hs !== 'tonsure') { s.ell(5.5, 3.6, 3.4, 1.9, hr); if (side) s.rect(dir > 0 ? 2 : 7, 3, 2, hs === 'long' ? 5 : 3, hr, { flat: 2 }); else if (hs === 'long' || hs === 'braids') { s.rect(2, 4, 1, 4, hr, { flat: 2 }); s.rect(9, 4, 1, 4, hr, { flat: 1 }); } }
  else if (hs === 'tonsure') s.rect(3, 4, 5, 1, hr, { flat: 2 });
  if (hs === 'bun') s.ell(5.5, 1.6, 1.4, 1.2, hr);
  if (lk.beard) { const bc = s.mat(lk.beard); s.rect(side ? (dir > 0 ? 5 : 3) : 4, 7, 3, 2, bc, { flat: 3 }); }
  /* the hat that makes a giver who they are */
  const [hk, hc] = lk.hat || []; if (hk) { const h = s.mat(hc || '#5a4a3a');
    if (hk === 'chef') { s.rect(3, 0, 5, 3, s.mat('#f4f0e8'), { flat: 3 }); s.rect(3, 2, 5, 1, s.mat('#d8d0c4'), { flat: 2 }); }
    else if (hk === 'hood' || hk === 'cowl') { s.ell(5.5, 4, 3.8, 3.4, h); for (let y = 3; y < 8; y++) for (let x = side ? (dir > 0 ? 5 : 3) : 4; x < (side ? (dir > 0 ? 8 : 6) : 7); x++) if (y > 3) s.set(x, y, sk, 2); }
    else if (hk === 'helmet' || hk === 'horned' || hk === 'plume') { s.ell(5.5, 3, 3.4, 2.2, h); if (hk === 'horned') { s.dot(1, 2, s.mat('#e8e0c8'), 3); s.dot(9, 2, s.mat('#e8e0c8'), 2); } if (hk === 'plume') s.rect(5, 0, 2, 2, s.mat('#d83a2a'), { flat: 3 }); }
    else if (hk === 'minecap') { s.ell(5.5, 3, 3.4, 2, h); s.dot(dir < 0 ? 3 : 7, 3, s.mat(fixed('#fff2b0'))); }
    else if (hk === 'tricorn' || hk === 'brim') { s.rect(1, 3, 9, 1, h, { flat: 1 }); s.rect(3, 1, 5, 2, h); }
    else if (hk === 'circlet') s.rect(3, 3, 5, 1, h, { flat: 3 });
    else { s.ell(5.5, 2.8, 3.2, 1.8, h); if (hk === 'cap') s.rect(dir < 0 ? 1 : 7, 3, 3, 1, h, { flat: 1 }); } }
  if (lk.basket && !cheer) { const b = s.mat('#9a7448'); s.rect(dir < 0 ? 0 : 8, 8, 3, 2, b); s.dot(dir < 0 ? 1 : 9, 7, s.mat('#c8483a'), 3); }
  s.outline();
  /* eyes go on after the outline, so they read as eyes */
  if (!side) { s.dot(4, 5, k, 2); s.dot(7, 5, k, 2); } else s.dot(dir > 0 ? 7 : 3, 5, k, 2);
  if (lk.glow) s.dot(dir < 0 ? 3 : 7, 5, s.mat(fixed(lk.glow)));
  return s.canvas(); });
/* draw a figure with its feet on row Y, centred on X + 2.5 (the walkers' own coordinates) */
const drawFolk = (ctx, X, Y, lk, frame = 0, dir = 0) => ctx.drawImage(folkSpr(lk, frame, dir), Math.round(X) - 3, Math.round(Y) - 14);
A.townFolk = drawFolk; A.townFolkLook = folkLook; A.TOWN_SKIN = SKIN;

/* ---------------- boats moored at Saltmere, seen from above at a slant, sized by tier ---------------- */
const boatArt = (tier, col) => memo(`boat:${tier}:${col}`, () => {
  const L = [0, 22, 34, 42, 52, 62][tier], mh = [0, 0, 22, 28, 34, 40][tier], hh = 3 + Math.ceil(tier / 2), dk = 3 + Math.floor(tier / 2), s = new Spr(L + 4, mh + hh + dk + 6), hull = s.mat(col), deck = s.mat('#b08a5a'), sail = s.mat('#ece4cc', { cool: '#3a4a7a' }), mast = s.mat('#5a3e26'), red = s.mat('#b0402e');
  const bx = 2, by = mh + 3; /* deck top-left */
  s.poly([[bx, by], [bx + L - 6, by], [bx + L, by + dk / 2], [bx + L - 6, by + dk], [bx, by + dk]], deck); for (let q = bx + 3; q < bx + L - 6; q += 4) s.line(q, by, q, by + dk, deck, 1);
  s.poly([[bx, by + dk], [bx + L - 6, by + dk], [bx + L, by + dk / 2], [bx + L - 2, by + dk + hh], [bx + 3, by + dk + hh]], hull); s.edges(hull); s.line(bx + 1, by + dk + 1, bx + L - 6, by + dk + 1, hull, 3);
  if (tier >= 4) for (let q = bx + 6; q < bx + L - 8; q += 6) s.dot(q, by + dk + 2, s.mat(fixed('#2a2830')));
  if (tier === 1) { s.line(bx + L * .45, by + 1, bx + L * .7, by + dk - 1, mast, 2); }
  else { const masts = tier >= 4 ? [.36, .68] : [.5]; masts.forEach((m, i) => { const mx = Math.round(bx + L * m), tp = 3 + (i ? 0 : 4); s.rect(mx, tp, 1, by - tp + 1, mast, { flat: 2 });
      const sw = tier === 2 ? 14 : 10 + tier, sh = Math.round((by - tp) * .78); s.poly([[mx - sw / 2, tp + 2], [mx + sw / 2, tp + 2], [mx + sw / 2 + 2, tp + sh], [mx - sw / 2 + 2, tp + sh]], sail); s.edges(sail);
      if (tier === 2) s.rect(mx - sw / 2 + 1, tp + 6, sw, 2, red, { flat: 2 }); if (tier === 5 && i) s.rect(mx + 1, tp - 3, 5, 2, red, { flat: 3 }); }); }
  s.outline(); return s.canvas(); });

/* ---------------- the restoration sites (32 x 32), ruined, building up, restored ---------------- */
/* a small building in three-quarter view inside a site sprite */
const house = (s, o) => { const { x, y, w, wh, ns, wall, roof, done } = o, fs = o.fs || 3, rf = s.mat(done ? roof : mix(roof, '#3a3438', .45)), wl = s.mat(done ? wall : mix(wall, '#4a4448', .4)), wd = s.mat('#6a4a2c'), gl = s.mat(done ? GLASS : DARK_GLASS), hole = s.mat('#140e12');
  const L = x - 2, R = x + w + 2, top = y, ridge = y + fs, eave = ridge + ns;
  for (let yy = top; yy <= eave; yy++) for (let u = L; u < R; u++) s.set(u, yy, rf, yy === eave ? 0 : yy < ridge ? 3 + (u === L ? 1 : 0) : (yy - ridge) % 3 === 0 ? 3 : (yy - ridge) % 3 === 2 ? 1 : 2);
  for (let j = 1; j <= wh; j++) for (let i = 0; i < w; i++) s.set(x + i, eave + j, wl, j === 1 ? 1 : i === 0 ? 3 : i === w - 1 ? 1 : 2);
  const dx = x + Math.floor(w / 2) - 2; s.rect(dx, eave + wh - 5, 4, 5, done ? wd : hole, { flat: done ? 2 : 2 });
  for (const wx of w >= 18 ? [x + 2, x + w - 6] : [x + 2]) if (wx + 4 <= dx || wx >= dx + 4) s.rect(wx, eave + 3, 4, 4, gl, { flat: 2 }), done && s.dot(wx, eave + 3, gl, 4);
  if (!done) { for (let u = L + Math.floor(w * .4); u < L + Math.floor(w * .4) + 6; u++) for (let yy = ridge + 1; yy < eave - 1; yy++) s.set(u, yy, (u % 3) ? hole : wd, 2); for (let u = L; u < R; u += 3) s.clear(u, top); }
  return { eave, ridge, base: eave + wh + 1, dx }; };
const SITE_ROOF = { inn: '#a8463a', library: '#5a4a7a', refuge: '#4a3a5a', furstore: '#dfe6ee', assay: '#5a5e6a', herbary: '#4e6a36', armoury: '#3a2a2a', scriptorium: '#b0402e', archive: '#2e2640', hall: '#7a4a2a', granary: '#b89848', smokehouse: '#4a3a30', boathouse: '#3e5a7a', tannery: '#6a4a2a' };
const SITE_WALL = { inn: '#d6c49c', library: '#c8b8a0', refuge: '#8a7a9a', furstore: '#8a8e98', assay: '#a8a49c', herbary: '#7a8a5a', armoury: '#6a4a44', scriptorium: '#e2e0d8', archive: '#5a4a6a', hall: '#d0b890', granary: '#8a6a42', smokehouse: '#6e4e34', boathouse: '#6a5a46', tannery: '#8a6a4a' };
const siteArt = (kind, done) => {
  const s = new Spr(32, 32), r = seeded(kind), wood = s.mat(done ? '#7a5232' : '#5e4a3a'), stone = s.mat(done ? '#7a7a86' : '#625e66'), dark = s.mat('#140e12'), water = s.mat(done ? '#3a7aa8' : '#3a4038', { warm: '#c8f0ff' }), soil = s.mat('#5a3e28'), leaf = s.mat('#4a8a3e'), glow = s.mat(fixed('#ffb848')), glowHi = s.mat(fixed('#fff0b0')), cloth = s.mat(done ? '#c8b890' : '#6a6050'), red = s.mat(done ? '#b0402e' : '#5a3a34'), gold = s.mat('#d8a840'), iron = s.mat('#5a5e6a');
  const rubble = () => { for (const [x, y, rr] of [[5, 28, 2], [9, 29, 1.6], [24, 28, 2.2], [27, 29, 1.4], [16, 29, 1.2]]) s.ell(x, y, rr, rr * .7, stone); };
  const pad = (col = soil) => s.ell(16, 27, 14, 3.6, col, { flat: done ? 2 : 1 });
  switch (kind) {
    case 'well': pad(stone); s.ell(16, 22, 9, 5, stone); s.ell(16, 21, 6, 3, done ? water : dark); if (done) { s.rect(7, 7, 2, 14, wood); s.rect(23, 7, 2, 14, wood); s.poly([[4, 9], [16, 3], [28, 9], [26, 12], [6, 12]], red); s.line(16, 11, 16, 17, s.mat('#c8b890'), 2); s.rect(14, 16, 4, 3, wood); } else { s.rect(7, 13, 2, 8, wood); s.line(23, 19, 27, 12, wood, 2); rubble(); } break;
    case 'garden': for (let i = 0; i < 3; i++) { s.rect(2 + i * 10, 12, 8, 16, soil, { flat: 1 }); for (let y = 14; y < 27; y += 3) if (done) { s.ell(6 + i * 10, y, 2, 1.4, leaf); if (y % 2) s.dot(6 + i * 10, y - 1, s.mat(fixed(['#e05a7a', '#f0d060', '#e8e8f0'][i]))); } else if (r() < .4) s.dot(4 + i * 10 + Math.floor(r() * 4), y, s.mat('#6a5a3a')); } s.rect(1, 28, 30, 2, wood); break;
    case 'watchtower': case 'eyrie': s.ell(16, 28, 9, 2.6, soil); s.rect(10, 10, 12, 18, kind === 'eyrie' ? stone : wood); s.edges(kind === 'eyrie' ? stone : wood); s.line(11, 12, 20, 26, wood, 1); s.line(20, 12, 11, 26, wood, 1);
      if (done) { s.poly([[7, 10], [16, 1], [25, 10]], red); s.rect(8, 9, 16, 2, wood); s.dot(16, 6, glow); if (kind === 'eyrie') { s.ell(16, 9, 8, 2, s.mat('#c8a040')); s.dot(17, 3, s.mat('#8a6a4a')); } } else { s.poly([[7, 10], [13, 5], [16, 9], [25, 10]], red); rubble(); } break;
    case 'market': s.rect(3, 17, 26, 10, wood); for (let x = 2; x < 30; x += 4) s.rect(x, 9, 4, 6, done ? ((x / 4) % 2 ? red : cloth) : s.mat('#4a4040'), { flat: 3 }); s.rect(4, 15, 2, 4, wood); s.rect(26, 15, 2, 4, wood);
      if (done) for (const [x, c] of [[8, '#e0405a'], [14, '#f0d060'], [20, '#7ab04a'], [25, '#e09040']]) s.ell(x, 18, 2, 1.4, s.mat(c)); else rubble(); break;
    case 'jetty': s.rect(0, 4, 32, 26, water, { flat: 1 }); for (let i = 0; i < 6; i++) s.line(2 + i * 5, 8 + (i % 2) * 6, 5 + i * 5, 8 + (i % 2) * 6, water, 3); s.rect(11, 0, 10, 30, wood); for (let y = 1; y < 30; y += 3) s.line(11, y, 20, y, wood, 1);
      for (const [x, y] of [[10, 8], [21, 8], [10, 22], [21, 22]]) s.rect(x, y, 2, 3, wood, { flat: 1 }); if (done) { s.rect(22, 12, 8, 4, s.mat('#8a6a42')); s.line(25, 4, 25, 12, wood, 2); s.poly([[25, 4], [30, 10], [25, 10]], cloth); } else for (let y = 12; y < 20; y++) for (let x = 13; x < 19; x++) if ((x + y) % 3) s.set(x, y, water, 1); break;
    case 'forge': case 'greatforge': case 'smelter': case 'kiln': case 'hearth': {
      const big = kind === 'greatforge', m = kind === 'greatforge' || kind === 'kiln' ? s.mat(done ? '#6a4038' : '#4a3a38') : stone;
      if (kind === 'kiln' || kind === 'smelter') { s.ell(16, 20, 10, 9, m); s.rect(6, 20, 20, 8, m); s.edges(m); s.ell(16, 22, 4, 4, done ? glow : dark); if (done) s.dot(15, 21, glowHi); s.rect(22, 2, 5, 12, m); }
      else if (kind === 'hearth') { s.rect(7, 8, 18, 20, m); s.edges(m); s.rect(10, 17, 12, 9, dark); if (done) { s.poly([[11, 26], [16, 18], [21, 26]], glow); s.dot(16, 23, glowHi); } s.rect(6, 6, 20, 3, m); }
      else { house(s, { x: big ? 3 : 5, y: 4, w: big ? 26 : 22, wh: 12, ns: 7, wall: big ? '#6a4038' : '#7a7a86', roof: big ? '#3a2a2a' : '#5a5e6a', done }); s.rect(big ? 22 : 21, 0, 5, 9, m); s.edges(m); if (done) { s.rect(7, 24, 6, 4, glow); s.dot(9, 25, glowHi); s.rect(24, 24, 6, 3, iron); s.rect(25, 22, 4, 2, iron); } }
      if (!done) rubble(); if (done && (kind === 'forge' || kind === 'greatforge' || kind === 'hearth')) s.ell(24, 0, 2, 1, s.mat('#a8a8b0')); break; }
    case 'lanterns': case 'lamps': case 'watchfire': case 'ward': for (const x of kind === 'lamps' ? [5, 16, 27] : [8, 24]) { s.rect(x - 1, 10, 2, 18, kind === 'ward' ? s.mat('#5a4040') : iron); s.ell(x, 28, 3, 1, stone); s.rect(x - 3, 5, 6, 5, done ? glow : s.mat('#3a3a36'), { flat: 2 }); if (done) s.dot(x - 1, 6, glowHi); s.rect(x - 3, 4, 6, 1, iron, { flat: 1 }); } if (!done) rubble(); break;
    case 'cistern': case 'pond': case 'baths': pad(stone); s.ell(16, 20, 13, 7, stone); s.ell(16, 20, 10.5, 5, done ? (kind === 'baths' ? s.mat('#4aa0b0', { warm: '#e0ffff' }) : water) : (kind === 'pond' ? s.mat('#3e4a30') : dark));
      if (done) { s.dot(11, 18, s.mat(fixed('#d8f0ff'))); if (kind === 'pond') { s.ell(21, 21, 1.6, 1, s.mat('#e0a040')); s.line(4, 12, 4, 19, leaf, 2); s.line(6, 13, 6, 19, leaf, 3); } if (kind === 'baths') for (const x of [10, 16, 22]) s.line(x, 8, x + 1, 13, s.mat(fixed('#c8d0d8')), 2); } else { s.line(8, 18, 12, 24, dark, 2); rubble(); } break;
    case 'bridge': s.rect(0, 22, 32, 8, water, { flat: 1 }); for (let x = 1; x < 31; x++) { const y = 18 - Math.round(Math.sin(x / 31 * Math.PI) * 6); if (done || x < 11 || x > 20) s.rect(x, y, 1, 5, stone); } if (done) for (let x = 2; x < 31; x += 4) s.line(x, 15 - Math.round(Math.sin(x / 31 * Math.PI) * 6), x, 18 - Math.round(Math.sin(x / 31 * Math.PI) * 6), wood, 3); break;
    case 'bell': case 'bigbell': { const m = kind === 'bigbell' ? stone : wood; s.rect(6, 5, 3, 23, m); s.rect(23, 5, 3, 23, m); s.poly([[3, 6], [16, 0], [29, 6], [27, 8], [5, 8]], red); if (done) { s.poly([[12, 9], [20, 9], [22, 19], [10, 19]], gold); s.dot(16, 20, s.mat('#6a4a20')); } else s.poly([[9, 26], [20, 24], [22, 29], [8, 29]], s.mat('#5a4a30')); break; }
    case 'star': s.rect(15, 14, 2, 14, iron); s.ell(16, 28, 6, 2, stone); if (done) { const pts = []; for (let i = 0; i < 10; i++) { const rr = i % 2 ? 3 : 7, a = -Math.PI / 2 + i * Math.PI / 5; pts.push([16 + Math.cos(a) * rr, 8 + Math.sin(a) * rr]); } s.poly(pts, s.mat('#e2d4ff', { warm: '#ffffff' })); s.dot(16, 7, glowHi); } break;
    case 'windmill': s.rect(11, 10, 10, 18, s.mat('#d8cfb8')); s.edges(s.mat('#d8cfb8')); s.poly([[10, 11], [16, 4], [22, 11]], red); s.rect(14, 22, 4, 6, wood); if (done) for (const [dx, dy] of [[1, -1], [-1, 1], [1, 1], [-1, -1]]) { s.line(16, 10, 16 + dx * 11, 10 + dy * 9, wood, 2); s.line(16 + dx * 4, 10 + dy * 3, 16 + dx * 11, 10 + dy * 9, cloth, 3); } else { s.line(16, 10, 24, 3, wood, 2); rubble(); } break;
    case 'nets': s.rect(3, 6, 2, 22, wood); s.rect(27, 6, 2, 22, wood); s.rect(3, 6, 26, 1, wood); for (let x = 6; x < 26; x += 3) for (let y = 9; y < 23; y += 3) if (done || (x + y) % 4) { s.line(x, y, x + 2, y + 2, cloth, 2); s.line(x + 2, y, x, y + 2, cloth, 1); } if (done) s.ell(16, 27, 3, 1.4, s.mat('#a8b8c8')); break;
    case 'beacon': s.rect(11, 13, 10, 15, stone); s.rect(9, 11, 14, 3, stone); s.rect(10, 7, 12, 4, iron); if (done) { s.poly([[11, 7], [16, 0], [21, 7]], glow); s.dot(16, 4, glowHi); } else { s.rect(11, 8, 10, 2, dark); rubble(); } break;
    case 'saltpans': for (let i = 0; i < 3; i++) { s.rect(2 + i * 10, 14, 9, 12, stone); s.rect(3 + i * 10, 15, 7, 10, done ? s.mat(i === 1 ? '#e8ecee' : '#b8d0d8') : s.mat('#3a4a58'), { flat: 2 }); } if (done) { s.poly([[9, 13], [13, 7], [17, 13]], s.mat('#f0f0ec')); s.line(22, 6, 26, 14, wood, 2); } break;
    case 'lift': s.rect(6, 2, 2, 26, wood); s.rect(24, 2, 2, 26, wood); s.rect(6, 2, 20, 2, wood); s.ell(16, 5, 2.4, 2.4, iron); s.line(16, 7, 16, done ? 13 : 21, s.mat('#8a8a90'), 2); if (done) { s.rect(11, 13, 10, 10, iron); s.rect(12, 14, 8, 8, s.mat('#3a3a44'), { flat: 2 }); } else s.poly([[10, 25], [20, 23], [21, 29], [11, 29]], s.mat('#4a4a50')); break;
    case 'gate': for (const x of [3, 25]) s.rect(x, 5, 4, 23, stone); s.rect(3, 3, 26, 4, stone); for (let x = 3; x < 29; x += 4) s.rect(x, 1, 2, 2, stone); if (done) { s.rect(7, 8, 18, 20, iron); for (let x = 9; x < 25; x += 3) s.line(x, 8, x, 27, s.mat('#2a2a34'), 2); } else { s.poly([[7, 20], [14, 16], [15, 28], [7, 28]], s.mat('#4a4a50')); rubble(); } break;
    case 'boardwalk': s.rect(0, 10, 32, 20, s.mat('#2a3a30'), { flat: 1 }); for (let x = 1; x < 31; x += 3) if (done || x % 9) s.rect(x, 16, 2, 8, wood, { flat: x % 2 ? 2 : 3 }); if (done) { s.rect(1, 15, 30, 1, wood, { flat: 1 }); for (const x of [4, 16, 28]) s.rect(x, 23, 1, 5, wood); } break;
    case 'stilthouse': s.rect(0, 22, 32, 8, s.mat('#2a3a30'), { flat: 1 }); house(s, { x: 6, y: 2, w: 20, wh: 9, ns: 6, wall: '#6a5a40', roof: '#4e6a36', done }); for (const x of [8, 15, 23]) s.rect(x, 22, 2, 8, wood); break;
    case 'eelweir': s.rect(0, 8, 32, 22, s.mat('#2a4a48'), { flat: 1 }); for (let x = 3; x < 29; x += 4) s.rect(x, 10, 2, 16, wood); if (done) { for (let y = 12; y < 26; y += 3) s.line(3, y, 28, y, s.mat('#9a8a5a'), 2); s.ell(26, 26, 3, 2, s.mat('#c8a040')); } else s.line(3, 16, 12, 16, s.mat('#6a5a3a'), 2); break;
    case 'shrine': s.rect(9, 16, 14, 12, stone); s.poly([[7, 17], [16, 8], [25, 17]], stone); s.rect(14, 20, 4, 8, dark); if (done) { s.poly([[14, 20], [16, 15], [18, 20]], s.mat(fixed('#9ad0ff'))); s.dot(16, 18, glowHi); } else rubble(); break;
    case 'chimes': s.rect(4, 4, 24, 2, wood); s.rect(15, 0, 2, 5, wood); for (const [x, l] of [[7, 10], [11, 14], [16, 12], [21, 16], [25, 9]]) if (done || x < 15) { s.line(x, 6, x, 6 + l, s.mat('#a8a8b0'), 2); s.rect(x - 1, 6 + l, 2, 3, done ? s.mat('#9ad8f0', { warm: '#ffffff' }) : s.mat('#5a6a70')); } break;
    case 'terraces': for (let i = 0; i < 3; i++) { s.rect(2 + i * 4, 18 + i * 4, 28 - i * 8, 3, stone); s.rect(3 + i * 4, 15 + i * 4, 26 - i * 8, 3, soil, { flat: 2 }); if (done) for (let x = 5 + i * 4; x < 28 - i * 4; x += 3) s.dot(x, 15 + i * 4, s.mat(i % 2 ? '#f0d060' : '#7ab04a'), 3); } break;
    case 'gravegarden': s.rect(1, 26, 30, 3, done ? leaf : soil, { flat: 1 }); for (const x of [6, 16, 26]) { s.rect(x - 2, 16, 4, 10, stone); s.ell(x, 16, 2, 1.6, stone); if (done) { s.dot(x - 3, 26, s.mat(fixed('#e0d0ff'))); s.dot(x + 2, 26, s.mat(fixed('#ffffff'))); } } break;
    case 'throne': s.rect(4, 7, 24, 21, s.mat('#4a3e5a')); s.edges(s.mat('#4a3e5a')); s.rect(13, 13, 6, 15, done ? s.mat('#7a2a3a') : dark); if (done) { for (const x of [7, 22]) { s.rect(x, 8, 3, 10, s.mat('#9a7ae0')); s.dot(x + 1, 17, glowHi); } s.rect(14, 9, 4, 3, gold); } else rubble(); break;
    case 'camp': s.poly([[3, 28], [11, 13], [19, 28]], done ? s.mat('#a89070') : s.mat('#5a4a40')); s.poly([[14, 28], [22, 15], [30, 28]], done ? s.mat('#8a7a9a') : s.mat('#4a4050')); if (done) s.poly([[14, 28], [16, 23], [18, 28]], glow); else rubble(); break;
    case 'tannery': s.rect(4, 10, 2, 18, wood); s.rect(26, 10, 2, 18, wood); s.rect(4, 9, 24, 2, wood); if (done) for (const [x, c] of [[9, '#a8683a'], [16, '#8a5030'], [23, '#c88a4a']]) s.poly([[x - 3, 11], [x + 3, 11], [x + 2, 20], [x - 2, 20]], s.mat(c)); else { s.poly([[8, 11], [12, 11], [11, 17], [9, 17]], s.mat('#5a4030')); rubble(); } s.ell(16, 27, 7, 2.4, stone); break;
    default: { const roof = SITE_ROOF[kind] || '#8a5a3a', wall = SITE_WALL[kind] || '#d8c8a8';
      const hs = house(s, { x: 4, y: 3, w: 24, wh: 12, ns: 9, wall, roof, done });
      if (done && kind === 'inn') { s.rect(hs.dx + 6, hs.eave + 2, 4, 3, gold); }
      if (done && (kind === 'furstore' || kind === 'granary')) { s.ell(4, 28, 3, 2, s.mat(kind === 'granary' ? '#c8a040' : '#e0e0e8')); }
      if (done && kind === 'library') s.rect(hs.dx + 6, hs.eave + 2, 3, 3, s.mat('#3a5a8a'));
      if (!done) rubble(); }
  }
  s.outline(); return s; };
/* a site at its construction stage: the finished building rises from its footing behind scaffolding */
const stagePiece = (kind, stage) => memo(`site:${kind}:${stage}`, () => {
  if (stage >= 4) return siteArt(kind, true); if (stage <= 0) return siteArt(kind, false);
  const F = siteArt(kind, true), s = new Spr(32, 32); s.mats = F.mats.slice(); let x0 = 32, x1 = -1, y0 = 32, y1 = -1;
  for (let y = 0; y < 32; y++) for (let x = 0; x < 32; x++) if (F.m[y * 32 + x] >= 0) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); }
  if (x1 < 0) return F; const reveal = [0, .25, .55, .82][stage], top = Math.round(y1 + 1 - (y1 - y0 + 1) * reveal);
  for (let y = top; y <= y1; y++) for (let x = x0; x <= x1; x++) { const i = y * 32 + x; if (F.m[i] >= 0) { s.m[i] = F.m[i]; s.l[i] = F.l[i]; } }
  const wood = s.mat('#a07848'), plank = s.mat('#7a5232'), stone = s.mat('#7a7a86'), L = Math.max(1, x0), R = Math.min(30, x1), pt = Math.max(1, top - 4);
  for (const x of [L, R]) for (let y = pt; y <= y1; y++) s.set(x, y, wood, x === L ? 3 : 1);
  for (let y = y1 - 3; y >= pt; y -= 5) for (let x = L; x <= R; x++) if (s.get(x, y) < 0 || x === L || x === R || y < top) s.set(x, y, plank, 3);
  if (stage >= 2) for (let y = pt + 1; y <= y1; y++) { s.set(L + 2, y, wood, 3); if (y % 2 === 0) s.set(L + 3, y, plank, 2); s.set(L + 4, y, wood, 1); }
  s.rect(Math.min(26, R - 4), 28, 5, 2, plank); s.rect(Math.min(27, R - 3), 26, 4, 2, wood); s.ell(Math.max(3, L + 1), 29, 2, 1.4, stone);
  s.outline(); return s; });

/* ---------------- landmarks, two to three homes tall ---------------- */
const landmarkArt = (kind, T) => memo('lm:' + kind, () => {
  if (kind === 'windmill') { const s = new Spr(70, 92), wall = s.mat('#d8cfb8'), roof = s.mat('#8a3a2e'), wood = s.mat('#6a4a2c'), sail = s.mat('#e0d8c0', { cool: '#3a4a7a' }), gl = s.mat(GLASS), dk = s.mat('#2a1e18');
    s.poly([[24, 88], [46, 88], [43, 38], [27, 38]], wall); s.edges(wall); for (let y = 44; y < 88; y += 5) s.line(26 + (88 - y) * .06, y, 44 - (88 - y) * .06, y, wall, 1);
    s.ell(35, 36, 10, 6, roof); s.poly([[25, 36], [35, 18], [45, 36]], roof); s.rect(31, 76, 8, 12, wood); s.rect(32, 56, 5, 6, gl, { flat: 2 });
    for (const [dx, dy] of [[1, -1], [-1, 1], [1, 1], [-1, -1]]) { s.line(35, 34, 35 + dx * 30, 34 + dy * 26, wood, 2); for (let k = 8; k < 30; k += 1) { const px = 35 + dx * k, py = 34 + dy * k * .87; s.dot(px + (dy > 0 ? 2 : -2) * (dx > 0 ? 1 : -1) * 0, py + 2 * Math.sign(dx), sail, k % 4 ? 3 : 1); s.dot(px, py + 3 * Math.sign(dx), sail, 2); } }
    s.ell(35, 34, 3, 3, dk); s.outline(); return { c: s.canvas(), w: s.w, h: s.h, beam: null }; }
  if (kind === 'lighthouse') { const s = new Spr(48, 110), wh = s.mat('#e4e0d8'), rd = s.mat('#b0402e'), rock = s.mat('#4e5260'), g = s.mat(fixed('#ffe08a')), gh = s.mat(fixed('#fff8d8')), iron = s.mat('#3a3e48');
    s.ell(24, 100, 22, 8, rock); s.ell(14, 98, 9, 6, rock); s.ell(34, 101, 10, 6, rock); s.poly([[15, 96], [33, 96], [30, 26], [18, 26]], wh); s.edges(wh);
    for (let y = 34; y < 96; y += 16) for (let j = 0; j < 7; j++) s.line(18 - (y + j - 26) * .043 + 0, y + j, 30 + (y + j - 26) * .043, y + j, rd, j === 0 ? 3 : j === 6 ? 1 : 2);
    s.rect(16, 22, 16, 4, iron); s.rect(18, 12, 12, 10, g, { flat: 2 }); s.dot(20, 14, gh); s.dot(21, 14, gh); for (const x of [18, 23, 29]) s.rect(x, 12, 1, 10, iron, { flat: 1 }); s.poly([[16, 12], [24, 3], [32, 12]], rd); s.rect(21, 84, 6, 12, iron);
    s.outline(); return { c: s.canvas(), w: s.w, h: s.h, beam: [24, 17] }; }
  if (kind === 'mine') { const s = new Spr(110, 72), rock = s.mat('#5e6270'), rock2 = s.mat('#4a4e5a'), wood = s.mat('#6e4a2c'), dark = s.mat(fixed('#0c0a0e')), snow = s.mat('#d8e2f0', { cool: '#3a4a7a' }), iron = s.mat('#6a6e7a'), g = s.mat(fixed('#ffb050'));
    s.poly([[0, 70], [6, 24], [24, 8], [48, 4], [72, 10], [94, 6], [108, 22], [110, 70]], rock); s.edges(rock); for (let i = 0; i < 14; i++) s.poly([[8 + i * 7, 20 + (i % 3) * 12], [14 + i * 7, 16 + (i % 3) * 12], [16 + i * 7, 26 + (i % 3) * 12]], rock2);
    for (let x = 4; x < 108; x++) { const y = x < 24 ? 24 - x * .66 : x < 48 ? 8 - (x - 24) * .16 : x < 72 ? 4 + (x - 48) * .25 : x < 94 ? 10 - (x - 72) * .18 : 6 + (x - 94) * 1.1; for (let j = 0; j < 3 + (x % 5 ? 0 : 2); j++) s.set(x, y + j, snow, j ? 3 : 4); }
    s.rect(38, 36, 30, 34, dark); s.ell(53, 36, 15, 8, dark); s.rect(34, 30, 4, 40, wood); s.rect(68, 30, 4, 40, wood); s.rect(32, 28, 42, 4, wood); s.dot(36, 36, g); s.dot(70, 36, g);
    for (let y = 46; y < 70; y += 4) s.rect(44, y, 18, 1, wood, { flat: 1 }); s.rect(46, 44, 1, 26, iron, { flat: 3 }); s.rect(59, 44, 1, 26, iron, { flat: 3 });
    s.outline(); return { c: s.canvas(), w: s.w, h: s.h, lamps: [[37, 37], [71, 37]] }; }
  if (kind === 'citadel') { const s = new Spr(118, 100), m = s.mat('#4e3436'), m2 = s.mat('#3a2628'), roof = s.mat('#2a1e22'), g = s.mat(GLASS), ban = s.mat('#a8302a'), gold = s.mat('#d8a040'), dark = s.mat(fixed('#120a0a'));
    s.rect(10, 40, 98, 56, m); s.edges(m); for (let x = 10; x < 108; x += 8) s.rect(x, 34, 5, 6, m); s.rect(4, 22, 20, 74, m2); s.rect(94, 22, 20, 74, m2); s.edges(m2); for (const x0 of [4, 94]) { for (let x = x0; x < x0 + 20; x += 6) s.rect(x, 16, 4, 6, m2); s.poly([[x0 - 2, 22], [x0 + 10, 4], [x0 + 22, 22]], roof); }
    s.rect(46, 14, 26, 30, m); s.edges(m); s.poly([[42, 16], [59, 0], [76, 16]], roof); s.ell(59, 84, 10, 10, dark); s.rect(49, 84, 20, 12, dark);
    for (const [x, y] of [[20, 56], [36, 56], [80, 56], [96, 56], [12, 40], [100, 40], [56, 24], [62, 24]]) s.rect(x, y, 4, 6, g, { flat: 2 }); for (const x of [30, 86]) { s.rect(x, 62, 6, 16, ban, { flat: 2 }); s.dot(x + 2, 67, gold, 3); }
    for (let y = 44; y < 96; y += 6) for (let x = 12 + (y % 12 ? 0 : 4); x < 106; x += 9) s.set(x, y, m, 1);
    s.outline(); return { c: s.canvas(), w: s.w, h: s.h }; }
  if (kind === 'monastery') { const s = new Spr(120, 100), wall = s.mat('#e2e0d8'), roof = s.mat('#b0402e'), stone = s.mat('#9a9aa4'), g = s.mat(GLASS), wood = s.mat('#6a4a2c'), gold = s.mat('#d8a840');
    s.rect(4, 88, 112, 10, stone); s.edges(stone); s.rect(12, 50, 96, 38, wall); s.edges(wall); for (let y = 30; y < 52; y++) { const k = (y - 30) / 22; for (let x = Math.round(8 - k * 0); x < 112; x++) s.set(x, y, roof, y === 51 ? 0 : (y - 30) % 3 === 0 ? 3 : (y - 30) % 3 === 2 ? 1 : 2); } for (let x = 8; x < 112; x++) s.set(x, 29, roof, 4);
    s.rect(50, 6, 20, 46, wall); s.edges(wall); s.poly([[46, 8], [60, -4], [74, 8]], roof); s.rect(48, 6, 24, 3, roof, { flat: 1 }); s.ell(60, 18, 4, 5, s.mat(fixed('#1a1418'))); s.poly([[57, 16], [63, 16], [64, 23], [56, 23]], gold);
    s.rect(54, 70, 12, 18, wood); s.ell(60, 70, 6, 3, wood); for (const x of [20, 34, 80, 94]) { s.rect(x, 60, 6, 9, g, { flat: 2 }); s.dot(x + 1, 61, g, 4); }
    s.outline(); return { c: s.canvas(), w: s.w, h: s.h }; }
  if (kind === 'castle') { const s = new Spr(130, 104), m = s.mat('#4a3e5a'), m2 = s.mat('#3a3048'), roof = s.mat('#6a4a9a', { warm: '#e0d0ff' }), g = s.mat(fixed('#c8a8ff')), gh = s.mat(fixed('#f0e8ff')), dark = s.mat(fixed('#0e0a14'));
    s.rect(14, 44, 102, 56, m); s.edges(m); for (let x = 14; x < 116; x += 8) if (hash2(x, 1) > .3) s.rect(x, 38, 5, 6, m); s.rect(4, 24, 22, 76, m2); s.rect(104, 30, 22, 70, m2); s.edges(m2);
    s.poly([[2, 24], [15, 4], [28, 24]], roof); for (let x = 104; x < 126; x += 6) s.rect(x, 24, 4, 6, m2); s.rect(50, 12, 30, 34, m); s.edges(m); s.poly([[46, 14], [65, -2], [84, 14]], roof);
    for (let y = 14; y < 30; y++) for (let x = 104 + (y % 3); x < 126; x += 5) if (hash2(x, y) > .5) s.clear(x, y); /* the broken tower */
    s.ell(65, 86, 12, 12, dark); s.rect(53, 86, 24, 14, dark); for (const [x, y] of [[12, 40], [12, 62], [112, 48], [30, 60], [96, 60], [60, 26], [68, 26]]) { s.rect(x, y, 4, 7, g, { flat: 2 }); s.dot(x + 1, y + 1, gh); }
    for (let i = 0; i < 40; i++) s.set(20 + hash2(i, 2) * 90, 50 + hash2(2, i) * 46, m, 1); s.outline(); return { c: s.canvas(), w: s.w, h: s.h }; }
  return null; });

/* ---------------- each town's layout ---------------- */
/* the two streets (cobbled bands with the walkers' feet on rows 162 and 244), two lanes, the square between them */
const STREETS = [[150, 22], [232, 22]], LANES = [[100, 16], [522, 16]], SQUARE = [266, 174, 108, 56];
/* restoration sites: 32 x 32, among the homes; the Village page puts a clickable spot over each one */
const SLOTS = [[28, 196], [176, 268], [416, 196], [436, 268], [148, 114], [570, 196], [290, 268], [456, 114], [36, 268]];
const PREF = { well: [304, 192], cistern: [304, 192], pond: null, jetty: [254, 300], salt_boathouse: null, fen_boardwalk: [180, 300], fen_eelweir: [430, 300], bridge: [300, 300] };
const siteLayout = town => { const sites = Object.keys(D.PROJECTS || {}).filter(k => D.PROJECTS[k].town === town); let k = 0;
  return sites.map((id, i) => { const p = PREF[D.PROJECTS[id].art || id] || PREF[id]; const [X, Y] = p || SLOTS[k++ % SLOTS.length]; return { id, i, X, Y }; }).sort((a, b) => a.Y - b.Y); };

let META = null;
function sceneFor(town, stages = {}, extras = {}) {
  const T = TD[town] || TD.willowbrook, rnd = seeded('td:' + town), c = document.createElement('canvas'); c.width = W; c.height = H;
  const x = c.getContext('2d'), f = (col, a, b, w = 1, h = 1) => { x.fillStyle = col; x.fillRect(Math.round(a), Math.round(b), Math.round(w), Math.round(h)); };
  const blit = (cv, X, Y) => x.drawImage(cv, Math.round(X), Math.round(Y));
  const shadow = (sx, sy, rx, ry, a = .4) => { x.fillStyle = `rgba(6,8,14,${a})`; for (let j = -Math.ceil(ry); j <= Math.ceil(ry); j++) { const w = Math.round(rx * Math.sqrt(Math.max(0, 1 - (j * j) / (ry * ry + .01)))); if (w > 0) x.fillRect(Math.round(sx - w), Math.round(sy + j), w * 2, 1); } };
  const glowPool = (gx, gy, r, col, a = .05) => { const [R, G, B] = hex(col); for (let k = r; k > 3; k -= 4) { x.fillStyle = `rgba(${R},${G},${B},${a})`; x.beginPath(); x.ellipse(gx, gy, k, k * .62, 0, 0, 7); x.fill(); } };
  META = { town, W, H, windows: [], chimneys: [], lamps: [], homes: [], ponds: [], water: [], yards: [], pens: [], lava: [], sea: null, sky: 0, style: { snow: !!T.snow, sea: T.front === 'harbour', swamp: !!T.fen, lava: !!T.ash, stars: !!T.haunted, fields: T.back === 'fields', clouds: T.front === 'clouds' }, topdown: true };
  const ground = T.grass, g2 = mix(ground, '#1a1838', .22), g3 = mix(ground, '#fff2c8', .12);
  /* ---- 1 the ground ---- */
  f(ground, 0, 0, W, H);
  for (let i = 0; i < W * H / 22; i++) f(rnd() < .5 ? g3 : g2, rnd() * W, rnd() * H, 2, 1);
  if (!T.sand && !T.ash) for (let i = 0; i < 320; i++) { const a = rnd() * W, b = rnd() * H; f(mix(ground, '#fff2c8', .2), a, b, 1, 2); f(mix(ground, '#fff2c8', .2), a + 2, b - 1, 1, 3); f(g2, a + 1, b + 2, 2, 1); }
  if (T.snow) for (let i = 0; i < 900; i++) f(i % 3 ? '#a8b4c8' : '#c8d2e2', rnd() * W, rnd() * H, 2 + Math.floor(rnd() * 3), 1);
  if (T.ash) for (let i = 0; i < 260; i++) { const a = rnd() * W, b = rnd() * H; f('#1e1618', a, b, 3, 1); f('#3a2e2c', a, b - 1, 2, 1); }
  /* soft patches: the ground is never one flat colour */
  for (let i = 0; i < 46; i++) { const bx = rnd() * W, by = rnd() * H, rx = 14 + rnd() * 34, dark = rnd() < .55; x.fillStyle = dark ? 'rgba(10,14,30,.12)' : 'rgba(255,240,200,.05)'; for (let j = -Math.ceil(rx * .45); j <= Math.ceil(rx * .45); j++) { const w = Math.round(rx * Math.sqrt(Math.max(0, 1 - (j * j) / (rx * rx * .2)))); x.fillRect(Math.round(bx - w), Math.round(by + j), w * 2, 1); } }
  if (T.rocky) for (let i = 0; i < 120; i++) { const a = rnd() * W, b = rnd() * H; f('#2a3438', a, b, 4, 2); f('#7a8290', a, b, 3, 1); }
  if (T.sand) for (let i = 0; i < 400; i++) f(rnd() < .5 ? '#6a6248' : '#4e4a3a', rnd() * W, rnd() * H, 2, 1);
  if (T.flowers) for (let i = 0; i < 60; i++) { const a = rnd() * W, b = rnd() * H; f(pick(['#c86a8a', '#d8c060', '#8aa8e8', '#e8e0f0'], rnd), a, b); f(mix(ground, '#fff2c8', .2), a, b + 1, 1, 2); }
  const draws = []; /* everything that stands up is drawn back to front by its base row */
  const put = (y, fn) => draws.push([y, fn]);
  const water = (X, Y, w, h, col, foam = true) => { const lt = mix(col, '#c8f0ff', .3), dk = mix(col, '#0a0a20', .3); f(col, X, Y, w, h); for (let yy = Y + 2; yy < Y + h; yy += 4) for (let q = X + ((yy * 7) % 11); q < X + w - 6; q += 14 + ((q * 3) % 9)) f(lt, q, yy, 4 + ((q + yy) % 5), 1); for (let yy = Y + 4; yy < Y + h; yy += 7) f(dk, X, yy, w, 1); if (foam) { f(mix(col, '#ffffff', .45), X, Y, w, 1); f(dk, X, Y + 1, w, 1); } META.water.push([X, Y, w, h]); };
  /* ---- 2 the back of the town (north) ---- */
  const back = T.back;
  /* fields in plots behind hedges: wheat, greens, furrows, a pumpkin patch; Mossbarrow's are mostly wheat */
  if (back === 'farm' || back === 'fields') { const kinds = back === 'fields' ? ['wheat', 'wheat', 'furrow', 'wheat', 'greens', 'wheat'] : ['greens', 'wheat', 'furrow', 'pumpkin', 'greens', 'wheat'];
    let px = -6; for (let k = 0; px < W; k++) { const pw = 88 + Math.floor(rnd() * 50), kind = kinds[k % kinds.length], y0 = 6 + (k % 2) * 4, ph = 74 - (k % 2) * 6;
      f(mix(T.dirt, '#1a1838', .25), px, y0, pw, ph); f(T.dirt, px + 1, y0 + 1, pw - 2, ph - 2);
      for (let r = y0 + 3; r < y0 + ph - 3; r += kind === 'wheat' ? 3 : 5) for (let q = px + 3; q < px + pw - 3; q++) {
        if (kind === 'wheat') { const v = hash2(q, r); f(v > .5 ? '#a48838' : '#86682a', q, r, 1, 2); if (v > .86) f('#c8aa5a', q, r - 1, 1, 1); }
        else if (kind === 'greens') { if ((q - px) % 5 === 0) { f('#22381e', q - 1, r, 4, 3); f('#467a38', q, r, 3, 2); f('#6aa050', q, r, 1, 1); } }
        else if (kind === 'pumpkin') { if ((q - px) % 7 === 0) { f('#2a1c14', q - 1, r, 5, 4); f('#b05e26', q, r, 3, 3); f('#d8884a', q, r, 1, 1); f('#4a7a3a', q + 1, r - 1, 1, 1); } else if ((q + r) % 3 === 0) f('#3e6a34', q, r + 1, 1, 1); }
        else if ((r - y0) % 5 === 3) f(mix(T.dirt, '#1a1838', .35), q, r, 1, 1); }
      put(y0 + ph + 2, (() => { const hx = px, hw = pw, hy = y0 + ph; return () => { for (let q = hx; q < hx + hw; q += 9) blit(bushArt(mix(T.leaf, '#1a1838', .15)), q - 4, hy - 10); }; })());
      if (kind === 'wheat' && rnd() < .7) { const hx = px + 10 + rnd() * (pw - 30), hy = y0 + 10 + rnd() * 30; put(hy + 11, () => blit(hayArt(), hx, hy)); }
      px += pw + 10; }
    f(mix(T.dirt, '#fff2c8', .08), 0, 86, W, 5); f(mix(T.dirt, '#1a1838', .3), 0, 91, W, 1); /* a cart track behind the houses */
    META.yards.push([20, W - 20, 96, 108]); }
  /* dunes with beach grass, and net racks drying */
  if (back === 'dunes') { for (let i = 0; i < 9; i++) { const dx = i * 76 + rnd() * 30, dy = 14 + rnd() * 54, rx = 34 + rnd() * 20;
      x.fillStyle = '#5a5238'; x.beginPath(); x.ellipse(dx + 3, dy + 3, rx, 12, 0, 0, 7); x.fill(); x.fillStyle = '#857a58'; x.beginPath(); x.ellipse(dx, dy, rx, 11, 0, 0, 7); x.fill(); x.fillStyle = '#9a8e68'; x.beginPath(); x.ellipse(dx - 8, dy - 4, rx * .6, 4, 0, 0, 7); x.fill();
      for (let k = 0; k < 7; k++) { const gx = dx - rx * .7 + k * rx * .22, gy = dy - 8 + (k % 3) * 4; f('#2e3a26', gx, gy, 1, 5); f('#6a8a4a', gx + 1, gy - 1, 1, 5); f('#8aa860', gx + 2, gy + 1, 1, 3); } }
    for (const [rx, ry] of [[40, 92], [596, 88], [250, 78]]) put(ry + 12, () => { for (let q = 0; q < 5; q++) { f('#2a1c14', rx + q * 8 - 1, ry, 3, 13); f('#6a4a2c', rx + q * 8, ry + 1, 1, 11); } f('#2a1c14', rx - 1, ry + 2, 36, 1); for (let q = 0; q < 33; q += 2) for (let j = 0; j < 6; j++) if ((q + j) % 3 === 0) f('#b8ac88', rx + q, ry + 3 + j, 1, 1); });
    META.yards.push([20, W - 20, 96, 108]); }
  /* the cliffs above Ironpeak, the peaks above Skyreach: strata, ledges and snow */
  if (back === 'cliffs' || back === 'peaks') { const rock = back === 'cliffs' ? '#4a4e5c' : '#5a6070', hiC = mix(rock, '#fff2c8', .22), loC = mix(rock, '#1a1838', .4), edge = q => 74 + Math.round(Math.sin(q / 37) * 9 + Math.sin(q / 13 + 2) * 4);
    for (let q = 0; q < W; q++) { const y = edge(q); f(rock, q, 0, 1, y); f(loC, q, y - 4, 1, 4); f(mix(ground, '#1a1838', .35), q, y, 1, 2); }
    for (let k = 0; k < 7; k++) { const sy = 10 + k * 9; for (let q = 0; q < W; q++) { const y = sy + Math.round(Math.sin(q / 29 + k) * 3); if (y < edge(q) - 6) { if (hash2(q, k) > .25) f(loC, q, y, 1, 1); if (hash2(q, k + 9) > .55) f(hiC, q, y - 1, 1, 1); } } }
    for (let i = 0; i < 26; i++) { const cx = rnd() * W, cy = rnd() * 50; for (let j = 0; j < 9; j++) f(loC, cx + Math.round(Math.sin(j) * 1.5), cy + j, 1, 1); }
    for (let k = 0; k < 4; k++) for (let q = 0; q < W; q++) { const y = 6 + k * 16 + Math.round(Math.sin(q / 23 + k * 2) * 3); if (hash2(q, k + 30) > .35 && y < edge(q) - 8) { f('#c8d2e4', q, y, 1, 2); if (hash2(q, k + 40) > .6) f('#e8eef8', q, y, 1, 1); } }
    for (let q = 0; q < W; q++) f('#d0dae8', q, 0, 1, 2 + Math.round(hash2(q, 99) * 3)); }
  if (back === 'marsh') { water(0, 0, W, 74, '#22362c', false); for (let i = 0; i < 9; i++) { const ix = i * 74 + rnd() * 30, iy = 18 + rnd() * 40; x.fillStyle = '#2c3a28'; x.beginPath(); x.ellipse(ix, iy, 22, 7, 0, 0, 7); x.fill(); x.fillStyle = '#3a4a30'; x.beginPath(); x.ellipse(ix - 4, iy - 2, 12, 3, 0, 0, 7); x.fill(); }
    for (let i = 0; i < 34; i++) { const rx = rnd() * W, ry = 2 + rnd() * 70; put(ry + 12, () => blit(reedArt(), rx, ry)); } for (let q = 0; q < W; q++) f(mix(ground, '#1a1838', .3), q, 74 + Math.round(Math.sin(q / 19) * 2), 1, 2); }
  /* the volcano behind Emberfall: a dark cone, the glow of its crater and two lava rivers running down */
  if (back === 'volcano') { const top = 4; x.fillStyle = '#1a1214'; x.beginPath(); x.moveTo(110, 96); x.lineTo(268, top + 6); x.lineTo(372, top + 6); x.lineTo(540, 96); x.fill();
    x.fillStyle = '#2a1e20'; x.beginPath(); x.moveTo(140, 96); x.lineTo(272, top + 10); x.lineTo(300, top + 10); x.lineTo(240, 96); x.fill();
    f('#ff7a2a', 280, top, 80, 6); f('#ffd070', 296, top + 1, 48, 3); f('#c8401e', 276, top + 6, 88, 2);
    for (const [sx, dir] of [[300, -1], [342, 1]]) { let px = sx, last = null; for (let y = top + 8; y < 100; y++) { px += dir * .9 + Math.sin(y / 7 + sx) * .6; const w = 3 + Math.round((y - top) / 30); f('#5a1a10', px - w / 2 - 1, y, w + 2, 1); f('#e0501e', px - w / 2, y, w, 1); f('#ffb040', px - 1, y, 2, 1); if (y % 6 === 0) f('#fff0a0', px, y, 1, 1); last = [Math.round(px), y]; } META.lava.push(last); }
    for (let q = 0; q < W; q++) f('#1a1214', q, 96 + Math.round(Math.sin(q / 31) * 3), 1, 3);
    x.fillStyle = 'rgba(255,110,40,.08)'; x.fillRect(0, 0, W, 100); }
  if (back === 'deadwood') for (let i = 0; i < 30; i++) { const tx = rnd() * W, ty = rnd() * 64 - 12; put(ty + 30, () => blit(treeArt('dead', i % 3 === 0 ? 1 : 0, T.leaf), tx, ty)); }
  /* ---- 3 streets, lanes and the square ---- */
  const cob = (sx, sy, col) => { f(mix(col, '#0a0a14', .5), sx, sy, 5, 4); f(col, sx, sy, 4, 3); f(mix(col, '#fff2c8', .22), sx, sy, 3, 1); };
  const cobArea = (X, Y, w, h, col) => { for (let yy = Y; yy < Y + h; yy += 4) for (let q = X - ((yy / 4) % 2 ? 2 : 0); q < X + w; q += 5) { const v = hash2(q, yy); cob(Math.max(X, q), yy, v > .8 ? mix(col, '#1a1838', .15) : v < .15 ? mix(col, '#fff2c8', .1) : col); } };
  const kerb = (X, Y, w, h) => { f(mix(T.cob, '#0a0a14', .55), X, Y - 1, w, 1); f(mix(T.cob, '#0a0a14', .55), X, Y + h, w, 1); f(mix(T.cob, '#fff2c8', .15), X, Y + h + 1, w, 1); };
  for (const [y, h] of STREETS) { cobArea(0, y, W, h, T.cob); kerb(0, y, W, h); }
  for (const [lx, lw] of LANES) { cobArea(lx, STREETS[0][0] + STREETS[0][1], lw, STREETS[1][0] - STREETS[0][0] - STREETS[0][1], T.cob); cobArea(lx, STREETS[1][0] + STREETS[1][1], lw, 306 - STREETS[1][0] - STREETS[1][1], T.cob); f(mix(T.cob, '#0a0a14', .55), lx - 1, STREETS[0][0] + STREETS[0][1], 1, 306 - STREETS[0][0] - STREETS[0][1]); f(mix(T.cob, '#0a0a14', .55), lx + lw, STREETS[0][0] + STREETS[0][1], 1, 306 - STREETS[0][0] - STREETS[0][1]); }
  const [sqx, sqy, sqw, sqh] = SQUARE; cobArea(sqx, sqy, sqw, sqh, mix(T.cob, '#fff2c8', .08));
  /* ---- 4 the front of the town (south) ---- */
  const fr = T.front;
  if (fr === 'meadow') { for (let i = 0; i < 40; i++) f(pick(['#c86a8a', '#d8c060', '#e8e0f0'], rnd), rnd() * W, 322 + rnd() * 36, 1, 1);
    for (const [a, b] of [[8, 96], [544, 632]]) { put(330, () => fenceH(f, a, b, 330)); put(358, () => fenceH(f, a, b, 359)); put(359, () => { for (const xx of [a, b - 3]) { f('#2a1c14', xx - 1, 322, 4, 38); f('#5a4030', xx, 323, 2, 36); } }); META.pens.push([a + 4, b - 12, 346]); }
    META.yards.push([130, 510, 312, 324]); }
  if (fr === 'harbour') { f('#4a4c56', 0, 304, W, 12); for (let q = 0; q < W; q += 9) { f('#5e606a', q, 305, 8, 4); f('#3a3c46', q + 8, 305, 1, 10); f('#6e707a', q, 305, 7, 1); f('#5a5c66', q + 4, 310, 8, 4); } f('#2a2c36', 0, 316, W, 2);
    water(0, 318, W, H - 318, '#1e4a6a'); META.sea = [318, H]; for (let q = 6; q < W; q += 46) { f('#2a1c14', q, 312, 3, 8); f('#6a4a2c', q, 312, 2, 6); } }
  if (fr === 'snowfield') { for (let i = 0; i < 18; i++) { const rx = rnd() * W, ry = 318 + rnd() * 30; put(ry + 10, () => blit(rockArt('#5e6270', i % 2), rx, ry)); } f('#4a4a52', 0, 340, W, 2); for (let q = 0; q < W; q += 6) f('#5a3e26', q, 338, 3, 6); f('#6a6e7a', 0, 339, W, 1); f('#6a6e7a', 0, 343, W, 1); META.yards.push([140, 500, 314, 330]); }
  if (fr === 'fen') { water(0, 318, W, H - 318, '#1e3a34'); META.ponds.push([90, 336, 40], [540, 340, 46]); for (let i = 0; i < 26; i++) { const rx = rnd() * W, ry = 312 + rnd() * 40; put(ry + 11, () => blit(reedArt(), rx, ry)); }
    for (let q = 160; q < 470; q += 3) { f('#2a1c14', q, 326, 3, 8); f(q % 6 ? '#7a5a38' : '#6a4a2c', q, 326, 2, 6); } }
  if (fr === 'lava') { const y0 = 330; for (let q = 0; q < W; q++) { const y = y0 + Math.round(Math.sin(q / 40) * 5); f('#1a1214', q, y - 3, 1, 3); f('#c8401e', q, y, 1, 14); f('#ff8a2a', q, y + 3, 1, 7); if (hash2(q, 4) > .85) f('#fff0a0', q, y + 5, 1, 1); f('#1a1214', q, y + 14, 1, 3); }
    META.lava.push([60, 334], [200, 330], [340, 334], [480, 330], [600, 334]); x.fillStyle = 'rgba(255,120,40,.12)'; x.fillRect(0, 312, W, 48); }
  if (fr === 'clouds') { for (let q = 0; q < W; q++) { const y = 324 + Math.round(Math.sin(q / 23) * 4 + Math.sin(q / 9) * 2); f('#3e4452', q, y, 1, 6); f('#2a2e3a', q, y + 6, 1, H - y); }
    for (let i = 0; i < 22; i++) { const cx = rnd() * W, cy = 336 + rnd() * 24, r = 10 + rnd() * 14; x.fillStyle = '#8a96b0'; x.beginPath(); x.ellipse(cx, cy, r * 1.6, r * .6, 0, 0, 7); x.fill(); x.fillStyle = '#b8c2d6'; x.beginPath(); x.ellipse(cx - r * .3, cy - r * .2, r, r * .35, 0, 0, 7); x.fill(); } }
  if (fr === 'graves') { for (let i = 0; i < 22; i++) { const gx = 20 + (i % 11) * 56 + rnd() * 16, gy = 318 + Math.floor(i / 11) * 20 + rnd() * 4; put(gy + 12, () => blit(graveArt(i % 3 === 0), gx, gy)); }
    put(316, () => { for (let q = 0; q < W; q += 5) { f('#1a1420', q, 306, 2, 10); f('#4a4058', q, 306, 1, 8); f('#1a1420', q, 305, 2, 1); } f('#3a3048', 0, 309, W, 1); }); }
  /* ---- 5 the landmark ---- */
  const LM = { windmill: [548, 118], lighthouse: [588, 336], mine: [10, 108], citadel: [500, 128], monastery: [500, 128], castle: [490, 128] }, blocks = [];
  if (T.landmark) { const a = landmarkArt(T.landmark, T), [lx, lb] = LM[T.landmark], X = Math.min(W - a.w, lx), Y = lb - a.h;
    put(lb, () => { shadow(X + a.w / 2 + 6, lb - 2, a.w / 2, 6); blit(a.c, X, Y); }); blocks.push([X - 4, Y + a.h * .4, a.w + 8, a.h * .6 + 4]);
    META.landmark = { kind: T.landmark, x: X, y: Y, w: a.w, h: a.h, beam: a.beam ? [X + a.beam[0], Y + a.beam[1]] : null };
    for (const [px, py] of a.lamps || []) META.lamps.push([X + px, Y + py, T.lamp]); }
  /* ---- 6 sites, the player's cottage, homes ---- */
  const sites = siteLayout(town), ids = Object.keys(D.PROJECTS || {}).filter(k => D.PROJECTS[k].town === town && !D.PROJECTS[k].relic), restored = ids.filter(k => (stages[k] || 0) >= 4).length;
  const lived = Math.min(1, .5 + .5 * restored / Math.max(1, ids.length)) - (T.ruined || 0) * (1 - restored / Math.max(1, ids.length));
  for (const s of sites) blocks.push([s.X - 4, s.Y - 2, 40, 38]);
  blocks.push([SQUARE[0] - 2, SQUARE[1], SQUARE[2] + 4, SQUARE[3]]); for (const [lx, lw] of LANES) blocks.push([lx - 3, 0, lw + 6, H]);
  const cottage = town === 'willowbrook' ? { x: 286, base: 146 } : null;
  if (cottage) { const b = bld({ w: 72, wh: 22, ns: 18, fs: 7, roof: ['thatch', '#b8903e'], wall: ['timber', '#dccaa0'], hip: true, lit: true, chimney: 'r', flowers: true, halfbeam: true, storeys: 2 });
    const X = cottage.x - b.wx, Y = cottage.base - b.base; blocks.push([cottage.x - 8, Y, 88, b.h]); put(cottage.base, () => { shadow(cottage.x + 40, cottage.base, 44, 5); blit(b.c, X, Y); });
    for (const [wx, wy, ww, wh] of b.windows) META.windows.push([X + wx, Y + wy, T.glow, ww, wh]); if (b.chimney) META.chimneys.push([X + b.chimney[0], Y + b.chimney[1]]);
    META.homes.push([cottage.x, cottage.base, 72, 47, true]);
    if (extras.farm) { for (let r = 0; r < 4; r++) { f('#2e1e14', 379, 115 + r * 7, 48, 6); f('#4a3220', 380, 116 + r * 7, 46, 4); for (let q = 0; q < 11; q++) { f('#24401e', 381 + q * 4, 114 + r * 7, 3, 4); f(r % 2 ? '#6aa04a' : '#4e8a3a', 382 + q * 4, 114 + r * 7, 2, 3); f('#8ac860', 382 + q * 4, 114 + r * 7, 1, 1); } } blocks.push([372, 104, 60, 44]); put(146, () => fenceH(f, 376, 430, 146, '#6a4a2c')); } }
  const hit = (a, b) => a[0] < b[0] + b[2] && a[0] + a[2] > b[0] && a[1] < b[1] + b[3] && a[1] + a[3] > b[1];
  const free = r => !blocks.some(b => hit(r, b));
  const ROWS = [[146, 0, W, 58], [228, 0, W, 54], [300, 0, W, 44]], homes = [];
  for (const [base, x0, x1, maxH] of ROWS) { let hx = x0 + 4 + Math.floor(rnd() * 8);
    while (hx < x1 - 36) { const two = base !== 300 && rnd() < .35, ns = 11 + Math.floor(rnd() * 5), fs = 4 + Math.floor(rnd() * 2); let placed = false;
      /* the widest home that fits here, down to a small cottage */
      for (const w of [(two ? 44 : 36) + Math.floor(rnd() * 4) * 4, 40, 36]) { const wh = two && w >= 44 ? 22 : 14 + Math.floor(rnd() * 2), tot = fs + ns + wh + 3, rect = [hx - 3, base - tot, w + 6, tot + 1];
        if (hx + w < x1 - 2 && free(rect) && tot <= maxH) { homes.push({ hx, base, w, wh, ns, fs, two: wh === 22 }); blocks.push(rect); hx += w + 5 + Math.floor(rnd() * 8); placed = true; break; } }
      if (!placed) hx += 4; } }
  /* street lamps on both kerbs of both streets (before anything else claims the spot) */
  STREETS.forEach(([sy, sh], k) => [[sy - 1, 34], [sy + sh + 5, 108]].forEach(([ly, off]) => { for (let lx = off + k * 52; lx < W - 10; lx += 152) { const X = lx, r = [X - 3, ly - 6, 9, 7]; if (!free(r)) continue; blocks.push(r); put(ly, () => blit(lampArt(T.lamp), X - 4, ly - 19)); META.lamps.push([X + 1, ly - 15, T.lamp]); } }));
  /* nothing grows on the streets */
  blocks.push([0, STREETS[0][0] - 1, W, STREETS[0][1] + 3], [0, STREETS[1][0] - 1, W, STREETS[1][1] + 3]);
  for (const h of homes) { const on = rnd() < lived, wl = pick(T.walls, rnd), rf = pick(T.roofs, rnd), ruin = !on && T.ruined && rnd() < .5;
    const b = bld({ w: h.w, wh: h.wh, ns: h.ns, fs: h.fs, roof: rf, wall: wl, hip: rnd() < .4, storeys: h.two ? 2 : 1, dormer: !h.two && h.ns >= 13 && h.w >= 44 && rnd() < .6, lit: on, ruin, board: !on, chimney: rnd() < .8 ? (rnd() < .5 ? 'l' : 'r') : null, snow: !!T.snow, stilts: T.stilts && h.base === 300 ? 0 : 0, flowers: !!T.flowers && on, halfbeam: rnd() < .5, sign: rnd() < .12 && on ? pick(['#b0402e', '#3a6ab0', '#c8a040'], rnd) : null });
    const X = h.hx - b.wx, Y = h.base - b.base; put(h.base, () => { shadow(h.hx + h.w / 2 + 4, h.base, h.w / 2 + 5, 3.5); blit(b.c, X, Y); });
    for (const [wx, wy, ww, wh] of b.windows) META.windows.push([X + wx, Y + wy, T.glow, ww, wh]); if (b.chimney) META.chimneys.push([X + b.chimney[0], Y + b.chimney[1]]);
    META.homes.push([h.hx, h.base, h.w, h.wh + h.ns + h.fs, on]); }
  /* ---- 7 the square ---- */
  const sqc = [SQUARE[0] + SQUARE[2] / 2, SQUARE[1] + SQUARE[3] / 2], siteInSquare = sites.some(s => s.X > SQUARE[0] && s.X < SQUARE[0] + SQUARE[2] && s.Y + 32 > SQUARE[1] && s.Y < SQUARE[1] + SQUARE[3]);
  if (!siteInSquare) { const sq = T.square;
    if (sq === 'market') for (const [mx, col] of [[sqc[0] - 40, '#b0402e'], [sqc[0] + 8, '#3a6ab0']]) put(sqc[1] + 6, () => { f('#2a1c14', mx - 1, sqc[1] - 12, 32, 20); f('#6e4a2c', mx, sqc[1] - 2, 30, 8); f('#8a6038', mx, sqc[1] - 2, 30, 2); for (let k = 0; k < 6; k++) { f(k % 2 ? '#e8e0cc' : col, mx + k * 5, sqc[1] - 11, 5, 8); f(mix(k % 2 ? '#e8e0cc' : col, '#1a1838', .3), mx + k * 5, sqc[1] - 4, 5, 1); } for (let k = 0; k < 6; k++) f(pick(['#e0405a', '#f0d060', '#7ab04a', '#e09040'], rnd), mx + 3 + k * 4, sqc[1] - 1, 3, 2); });
    else if (sq === 'fish') put(sqc[1] + 6, () => { for (const k of [0, 1, 2]) blit(barrelArt(), sqc[0] - 30 + k * 12, sqc[1] - 6); blit(crateArt(), sqc[0] + 10, sqc[1] - 4); blit(crateArt(), sqc[0] + 22, sqc[1] - 6); f('#2a1c14', sqc[0] - 16, sqc[1] + 6, 30, 2); for (let k = 0; k < 5; k++) f('#9ab8c8', sqc[0] - 14 + k * 6, sqc[1] + 4, 4, 2); });
    else if (sq === 'anvil') put(sqc[1] + 6, () => { f('#1a1418', sqc[0] - 9, sqc[1] - 4, 18, 9); f('#5a5e6a', sqc[0] - 8, sqc[1] - 3, 16, 3); f('#7a7e8a', sqc[0] - 8, sqc[1] - 3, 16, 1); f('#4a4e5a', sqc[0] - 3, sqc[1], 6, 5); for (const bx of [-30, 30]) { f('#1a1418', sqc[0] + bx - 5, sqc[1] - 10, 10, 14); f('#3a3a44', sqc[0] + bx - 4, sqc[1] - 6, 8, 9); f('#ff9a3a', sqc[0] + bx - 3, sqc[1] - 9, 6, 3); f('#fff0a0', sqc[0] + bx - 1, sqc[1] - 9, 2, 1); META.lamps.push([sqc[0] + bx, sqc[1] - 8, '#ff9a3a']); } });
    else if (sq === 'pool') { const px = sqc[0], py = sqc[1]; x.fillStyle = '#1e3a34'; x.beginPath(); x.ellipse(px, py, 30, 12, 0, 0, 7); x.fill(); x.fillStyle = '#2e5048'; x.beginPath(); x.ellipse(px - 6, py - 3, 16, 4, 0, 0, 7); x.fill(); META.ponds.push([px, py, 28]); META.water.push([px - 26, py - 9, 52, 18]); }
    else if (sq === 'brazier' || sq === 'shrine' || sq === 'statue') put(sqc[1] + 8, () => { const col = sq === 'brazier' ? '#4e3436' : sq === 'shrine' ? '#9a9aa4' : '#5a5066'; f('#141018', sqc[0] - 12, sqc[1] + 2, 24, 6); f(col, sqc[0] - 11, sqc[1] + 2, 22, 4); f('#141018', sqc[0] - 5, sqc[1] - 20, 10, 23); f(col, sqc[0] - 4, sqc[1] - 19, 8, 21); f(mix(col, '#fff2c8', .25), sqc[0] - 4, sqc[1] - 19, 2, 21);
      if (sq === 'brazier') { f('#ff8a2a', sqc[0] - 5, sqc[1] - 25, 10, 6); f('#fff0a0', sqc[0] - 2, sqc[1] - 24, 4, 3); META.lamps.push([sqc[0], sqc[1] - 23, '#ff9a3a']); } else if (sq === 'shrine') { f('#d8a840', sqc[0] - 3, sqc[1] - 26, 6, 6); f('#fff0b0', sqc[0] - 1, sqc[1] - 25, 2, 2); META.lamps.push([sqc[0], sqc[1] - 23, '#ffd890']); } else { f('#141018', sqc[0] - 4, sqc[1] - 26, 6, 7); f(col, sqc[0] - 3, sqc[1] - 25, 4, 5); } });
    else put(sqc[1] + 8, () => { shadow(sqc[0], sqc[1] + 6, 16, 4); f('#2a2a34', sqc[0] - 14, sqc[1] - 6, 28, 12); f('#7a7a86', sqc[0] - 13, sqc[1] - 5, 26, 10); f('#244a6a', sqc[0] - 11, sqc[1] - 4, 22, 6); f('#4a8ab0', sqc[0] - 9, sqc[1] - 3, 10, 1); f('#2a2a34', sqc[0] - 2, sqc[1] - 16, 4, 12); f('#9a9aa4', sqc[0] - 1, sqc[1] - 15, 2, 10); f('#9ad0f0', sqc[0] - 3, sqc[1] - 18, 6, 2); }); }
  /* ---- 8 restoration sites: a worked plot each, the site at its stage; hidden relic sites are just grass ---- */
  for (const { id, X, Y } of sites) { const pj = D.PROJECTS[id], sg = stages[id] || 0;
    /* a relic's plot waits as a little garden with a bench until the relic is brought home (nothing names it) */
    if (pj.relic && sg < 4) { put(Y + 30, () => { shadow(X + 16, Y + 28, 14, 3, .25); f('#2a1c14', X + 3, Y + 21, 26, 9); f('#4a3220', X + 4, Y + 22, 24, 7); for (let q = 0; q < 6; q++) { f('#2e4a2a', X + 5 + q * 4, Y + 22, 3, 3); f(pick(['#c86a8a', '#d8c060', '#e8e0f0', '#8aa8e8'], () => hash2(q, X)), X + 6 + q * 4, Y + 22, 1, 1); }
      f('#1a1008', X + 6, Y + 12, 20, 6); f('#6e4a2c', X + 7, Y + 12, 18, 3); f('#8a6040', X + 7, Y + 12, 18, 1); f('#3e2818', X + 8, Y + 15, 2, 3); f('#3e2818', X + 22, Y + 15, 2, 3); }); continue; }
    put(Y + 32, () => { shadow(X + 16, Y + 30, 15, 3.5, sg >= 4 ? .3 : .45); const sp = stagePiece(pj.art || id, sg); blit(memo(`sitec:${pj.art || id}:${sg}`, () => sp.canvas()), X, Y);
      if (sg >= 4 && /forge|smith|smelter|kiln|hearth|inn|library|archive|scriptorium|refuge|hall/.test(pj.art || id)) META.windows.push([X + 7, Y + 24, T.glow, 4, 3]);
      if (sg > 0 && sg < 4) drawFolk(x, X - 6, Y + 32, folkLook(seeded(id + ':builder')), 0, 1);
      if (sg >= 4) { const lr = seeded(town + ':' + id + ':folk'); drawFolk(x, X - 7, Y + 33, folkLook(lr), 0, 1); drawFolk(x, X + 32, Y + 34, folkLook(lr), 0, -1); } }); }
  /* ---- 9 trees, bushes and the small things in the gaps ---- */
  const tryPlace = (w, h, base, fn, n = 1) => { for (let t = 0; t < n; t++) { const tx = rnd() * (W - w), tb = base(); const r = [tx, tb - h * .45, w, h * .45]; if (free(r)) { blocks.push(r); put(tb, () => fn(tx, tb)); return true; } } return false; };
  const treeKind = T.tree, nTrees = { oak: 26, pine: 30, windpine: 18, palm: 12, fen: 24, charred: 12, dead: 20 }[treeKind] || 20;
  for (let i = 0; i < nTrees; i++) { const sz = Math.floor(rnd() * 3), tc = treeArt(treeKind, sz, i % 3 ? T.leaf : mix(T.leaf, '#1a1838', .15));
    tryPlace(tc.width, tc.height, () => 90 + rnd() * 236, (tx, tb) => { shadow(tx + tc.width / 2 + 3, tb - 1, tc.width * .4, 3); blit(tc, tx, tb - tc.height + 2); }, 6); }
  /* the edges of the picture: big trees framing it (nearer, so larger) */
  if (fr !== 'harbour' && fr !== 'clouds') for (const [tx, tb] of [[-8, 362], [W - 34, 364], [-6, 120], [W - 30, 124]]) { const tc = treeArt(treeKind, 2, mix(T.leaf, '#1a1838', .2)); put(tb, () => blit(tc, tx, tb - tc.height)); }
  for (let i = 0; i < 26; i++) { const v = T.flowers ? i % 3 : 0, bc = T.ash ? rockArt('#3e3032', i % 2) : bushArt(T.fen ? '#34502e' : T.haunted ? '#3a3048' : T.snow ? '#3a5a50' : mix(T.leaf, '#1a1838', .1), v); tryPlace(bc.width, bc.height, () => 100 + rnd() * 220, (tx, tb) => blit(bc, tx, tb - bc.height), 4); }
  if (!T.snow && !T.ash) for (let i = 0; i < 8; i++) tryPlace(9, 9, () => 110 + rnd() * 210, (tx, tb) => blit(shroomArt(), tx, tb - 9), 3);
  for (let i = 0; i < 6; i++) tryPlace(14, 11, () => 110 + rnd() * 210, (tx, tb) => blit(T.snow || T.ash || T.rocky ? rockArt(T.snow ? '#6a6e7a' : T.ash ? '#3e3032' : '#7a8290', i % 2) : stumpArt(), tx, tb - 11), 3);
  /* barrels and crates by the doors, a fence before some gardens */
  homes.forEach((h, k) => { if (k % 3 === 0) put(h.base + 2, () => { blit(barrelArt(), h.hx + h.w + 2, h.base - 11); if (k % 2) blit(barrelArt(), h.hx + h.w + 10, h.base - 10); });
    else if (k % 3 === 1 && h.base !== 146 && !T.fen) put(h.base + 9, () => fenceH(f, h.hx - 2, h.hx + h.w + 2, h.base + 9, T.haunted ? '#3a3048' : '#5a4030')); });
  /* ---- 11 the things you own: boats, traps ---- */
  if (fr === 'harbour') { let bx = 18; const boats = (extras.boats || []).length ? extras.boats : [1];
    for (const t of boats) { const b = (D.BOATS || []).find(r => r[2] === t), cv = boatArt(t, b && (extras.boats || []).length ? b[6] : '#7a5a3a'); const bX = bx, bY = 352 - cv.height + 3; put(352, () => { x.fillStyle = 'rgba(4,12,24,.4)'; x.fillRect(bX + 2, 352, cv.width - 6, 2); blit(cv, bX, bY); f('#c8b890', bX + 4, 318, 1, bY + cv.height - 318 - 8); }); bx += cv.width + 12; if (bx > 540) break; }
    for (let i = 0; i < 5; i++) put(316, () => { const cx = 360 + i * 34; blit(i % 2 ? crateArt() : barrelArt(), cx, 302); }); }
  const trap = (tx, ty) => { f('#2a1c14', tx - 1, ty - 7, 11, 8); f('#8a6a42', tx, ty - 6, 9, 6); f('#a8845a', tx, ty - 6, 9, 1); f('#5a3e26', tx + 3, ty - 5, 1, 5); f('#5a3e26', tx + 6, ty - 5, 1, 5); f('#c8a070', tx + 9, ty - 11, 1, 8); f('#a8845a', tx + 9, ty - 11, 3, 1); f('#e0405a', tx + 10, ty - 1, 1, 1); };
  if (extras.traps) for (const [tx, ty] of fr === 'harbour' ? [[574, 314], [600, 314], [626, 314]].map(([a, b]) => [a - 40, b]) : [[200, 350], [330, 354], [456, 348]]) put(ty, () => trap(tx, ty));
  /* ---- 12 townsfolk standing about (the walkers come on top, js/town_walkers.js) ---- */
  const people = 6 + Math.round(10 * lived), spots = [];
  for (let i = 0; i < people; i++) { const sx = SQUARE[0] + 10 + rnd() * (SQUARE[2] - 20), sy = SQUARE[1] + 14 + rnd() * (SQUARE[3] - 16); if (i % 2) spots.push([sx, sy]); else spots.push([20 + rnd() * (W - 40), [188, 272, 210][i % 3]]); }
  for (const [sx, sy] of spots) { if (!free([sx - 2, sy - 12, 9, 12]) && !(sx > SQUARE[0] && sx < SQUARE[0] + SQUARE[2])) continue; const lk = folkLook(rnd), dir = pick([-1, 0, 1], rnd); put(sy, () => drawFolk(x, sx, sy, lk, 0, dir)); }
  /* ---- draw it all, back to front ---- */
  draws.sort((a, b) => a[0] - b[0]); for (const [, fn] of draws) fn();
  /* ---- 13 lamp light on the ground: dusk is the default, lamps and windows are already lit ---- */
  for (const [lx, ly, col] of META.lamps) glowPool(lx, ly + 14, 22, col, .045);
  for (const [wx, wy, col, ww] of META.windows) if (wy > 60) glowPool(wx + (ww || 4) / 2, wy + 12, 9, col, .03);
  if (T.haunted) { x.fillStyle = 'rgba(40,20,70,.16)'; x.fillRect(0, 0, W, H); }
  META.lived = lived; META.ruined = !!T.ruined; META.roads = ROADS; (A.sceneMeta = A.sceneMeta || {})[town] = META; c.meta = META; META = null;
  return c;
}

Object.assign(A, { sceneFor, stagePiece, siteLayout, siteArt, TOWN_TD: TD, townBuilding: bld, townTree: treeArt, townPx: { Spr, ramp, mix, fixed, seeded, memo }, townBoat: boatArt, SCENE_W: W, SCENE_H: H, TOWN_ROADS: ROADS });
})();
