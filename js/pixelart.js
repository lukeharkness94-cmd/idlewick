/* Idlewick pixel art: one drawing system for every sprite, scene and icon.
   Style rules (docs/pixel-art-style.md; owner, 28 Nov 2026: the chunky, outlined direction): light from the top left;
   every material is a five-step, hue-shifted ramp (outline, shadow, base, light, highlight; shadows lean cool #1a1838,
   lights lean warm #fff2c8); round forms (ellipses) are sphere-lit, so heads, bellies and muscles read as volumes; flat
   shapes take edge light (lit where open to the top left, shaded where open to the bottom right); then a selective
   outline: every empty pixel touching a shape takes that material's darkest colour, never flat black. Faces are drawn
   last, on top. Sprites are tiny and shown at whole-number scales with pixelated rendering, so every pixel stays crisp.
   Everything is deterministic and cached. */
(() => {
const DQ = window.DQ;
const hex = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
const toHex = a => '#' + a.map(v => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('');
const mix = (a, b, t) => { const A = hex(a), B = hex(b); return toHex(A.map((v, i) => v + (B[i] - v) * t)); };
const COOL = '#1a1838', RIM = '#100c22', WARM = '#fff2c8', INK = '#2a1c1f';
const lum = h => { const [r, g, b] = hex(h); return .299 * r + .587 * g + .114 * b; };
/* five steps: out(line), lo, base, hi, glint. Dark materials get brighter lights, so a black cat or a void knight still
   shows its form on the near-black page. */
const ramp = (base, o = {}) => { const dark = lum(base) < 64;
  return { out: mix(base, RIM, .74), lo: mix(base, COOL, o.lo ?? .34), base, hi: mix(base, WARM, o.hi ?? (dark ? .36 : .28)), gl: mix(base, WARM, o.gl ?? (dark ? .66 : .56)) }; };
const STEP = ['out', 'lo', 'base', 'hi', 'gl'];
/* the light on a sphere at normalised offset (nx, ny) from its centre: 1 shadow .. 4 highlight */
const LIGHT = [-.55, -.7];
const sphere = (nx, ny) => { const d = nx * nx + ny * ny, nz = Math.sqrt(Math.max(0, 1 - d)), dot = -(nx * LIGHT[0] + ny * LIGHT[1]) * .8 + nz * .45; return dot > .8 ? 4 : dot > .42 ? 3 : dot > .02 ? 2 : 1; };

/* ---------- a sprite canvas with regions, automatic lighting and selective outlines ---------- */
/* drawn at k times the detail: inside atScale(k, fn) every Spr(w, h) is a (w*k) x (h*k) canvas that takes the same
   drawing calls in the original coordinates. Ellipses and polygons are rasterised afresh at the finer grid (smoother
   curves, sphere light, a one-pixel outline); dots and fixed pixels become k x k blocks. Used for the larger versions of
   mini-bosses and tower bosses on the combat stage (pixel_bosses.js). */
let SCALE = 1;
function Spr(w, h) { return SCALE > 1 ? fineSpr(w, h, SCALE) : rawSpr(w, h); }
function fineSpr(w, h, k) {
  const b = rawSpr(w * k, h * k), blk = (x, y, f) => { x = (x | 0) * k; y = (y | 0) * k; for (let j = 0; j < k; j++) for (let i = 0; i < k; i++) f(x + i, y + j); };
  const s = {
    w, h, big: b, fine: k, px: b.px,
    at: (x, y) => b.at((x | 0) * k, (y | 0) * k),
    dot(x, y, r) { blk(x, y, (X, Y) => b.dot(X, Y, r)); },
    fix(x, y, c) { blk(x, y, (X, Y) => b.fix(X, Y, c)); },
    tone(x, y, r, lv) { blk(x, y, (X, Y) => b.tone(X, Y, r, lv)); },
    erase(x, y) { blk(x, y, (X, Y) => b.erase(X, Y)); },
    rect(x, y, rw, rh, r) { for (let j = 0; j < rh; j++) for (let i = 0; i < rw; i++) s.dot(x + i, y + j, r); return s; },
    ell(cx, cy, rx, ry, r, o) { const lit = !(o && o.flat) && Math.min(rx, ry) >= 1.5, Cx = Math.floor(cx) + .5, Cy = Math.floor(cy) + .5, RX = rx + .4, RY = ry + .4;
      for (let Y = Math.floor((Cy - RY) * k); Y <= Math.ceil((Cy + RY) * k); Y++) for (let X = Math.floor((Cx - RX) * k); X <= Math.ceil((Cx + RX) * k); X++) {
        const nx = ((X + .5) / k - Cx) / RX, ny = ((Y + .5) / k - Cy) / RY; if (nx * nx + ny * ny > 1) continue; lit ? b.tone(X, Y, r, sphere(nx, ny)) : b.dot(X, Y, r); }
      return s; },
    line(x0, y0, x1, y1, r, fixC) { const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0), 1) * k; for (let i = 0; i <= n; i++) { const X = Math.round((x0 + (x1 - x0) * i / n) * k), Y = Math.round((y0 + (y1 - y0) * i / n) * k);
      for (let j = 0; j < k; j++) for (let q = 0; q < k; q++) fixC ? b.fix(X + q, Y + j, fixC) : b.dot(X + q, Y + j, r); } return s; },
    poly(pts, r) { b.poly(pts.map(([x, y]) => [x * k, y * k]), r); return s; },
    grid(rows, map, ox = 0, oy = 0) { rows.forEach((row, j) => [...row].forEach((ch, i) => { const v = map[ch]; if (!v) return; typeof v === 'string' ? s.fix(ox + i, oy + j, v) : s.dot(ox + i, oy + j, v); })); return s; },
    mirrorX() { b.mirrorX(); return s; },
    stamp(o, ox, oy) { if (o.big) b.stamp(o.big, ox * k, oy * k); else for (let y = 0; y < o.h; y++) for (let x = 0; x < o.w; x++) { const p = o.px[y * o.w + x]; if (p) blk(ox + x, oy + y, (X, Y) => { if (X >= 0 && Y >= 0 && X < b.w && Y < b.h) b.px[Y * b.w + X] = p; }); } return s; },
    render: o => b.render(o)
  };
  return s;
}
/* run a sprite maker with every canvas drawn at k times the detail; returns the fine canvas */
const atScale = (k, make) => { const was = SCALE; SCALE = k; try { const s = make(); return s ? (s.big || s) : null; } finally { SCALE = was; } };
function rawSpr(w, h) {
  const px = new Array(w * h).fill(null); /* {r: ramp, fix: colour|null, lv: light step from a sphere|undefined} */
  const at = (x, y) => (x >= 0 && y >= 0 && x < w && y < h) ? px[y * w + x] : null;
  const s = {
    w, h, px, at,
    dot(x, y, r) { x |= 0; y |= 0; if (x >= 0 && y >= 0 && x < w && y < h) px[y * w + x] = { r, fix: null }; },
    fix(x, y, c) { x |= 0; y |= 0; if (x >= 0 && y >= 0 && x < w && y < h) { const p = px[y * w + x]; px[y * w + x] = { r: p ? p.r : ramp(c), fix: c }; } },
    /* a pixel of a material at a chosen light step (0 outline .. 4 highlight) */
    tone(x, y, r, lv) { x |= 0; y |= 0; if (x >= 0 && y >= 0 && x < w && y < h) px[y * w + x] = { r, fix: null, lv }; },
    erase(x, y) { x |= 0; y |= 0; if (x >= 0 && y >= 0 && x < w && y < h) px[y * w + x] = null; },
    rect(x, y, rw, rh, r) { for (let j = 0; j < rh; j++) for (let i = 0; i < rw; i++) s.dot(x + i, y + j, r); return s; },
    /* ellipses are sphere-lit (o.flat keeps them edge-lit; very small ones always are) */
    ell(cx, cy, rx, ry, r, o) { const lit = !(o && o.flat) && Math.min(rx, ry) >= 1.5;
      for (let j = Math.floor(-ry); j <= Math.ceil(ry); j++) for (let i = Math.floor(-rx); i <= Math.ceil(rx); i++) if ((i * i) / (rx * rx + .01) + (j * j) / (ry * ry + .01) <= 1) {
        if (lit) s.tone(cx + i, cy + j, r, sphere(i / rx, j / ry)); else s.dot(cx + i, cy + j, r); }
      return s; },
    line(x0, y0, x1, y1, r, fixC) { const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0), 1); for (let i = 0; i <= n; i++) { const x = Math.round(x0 + (x1 - x0) * i / n), y = Math.round(y0 + (y1 - y0) * i / n); fixC ? s.fix(x, y, fixC) : s.dot(x, y, r); } return s; },
    poly(pts, r) {
      const ys = pts.map(p => p[1]), y0 = Math.floor(Math.min(...ys)), y1 = Math.ceil(Math.max(...ys));
      for (let y = y0; y <= y1; y++) { const xs = [];
        for (let i = 0; i < pts.length; i++) { const a = pts[i], b = pts[(i + 1) % pts.length]; if ((a[1] <= y + .5 && b[1] > y + .5) || (b[1] <= y + .5 && a[1] > y + .5)) xs.push(a[0] + (y + .5 - a[1]) / (b[1] - a[1]) * (b[0] - a[0])); }
        xs.sort((a, b) => a - b); for (let i = 0; i + 1 < xs.length; i += 2) for (let x = Math.ceil(xs[i] - .5); x <= Math.floor(xs[i + 1] - .5); x++) s.dot(x, y, r); }
      return s;
    },
    /* hand-authored rows: map characters to ramps (string) or fixed colours ('#rrggbb'); '.' is empty */
    grid(rows, map, ox = 0, oy = 0) { rows.forEach((row, j) => [...row].forEach((ch, i) => { const v = map[ch]; if (!v) return; typeof v === 'string' ? s.fix(ox + i, oy + j, v) : s.dot(ox + i, oy + j, v); })); return s; },
    mirrorX() { for (let y = 0; y < h; y++) for (let x = 0; x < w / 2; x++) { const a = px[y * w + x], b = px[y * w + w - 1 - x]; px[y * w + x] = b; px[y * w + w - 1 - x] = a; } return s; },
    stamp(o, ox, oy) { for (let y = 0; y < o.h; y++) for (let x = 0; x < o.w; x++) { const p = o.px[y * o.w + x]; if (p) { const X = ox + x, Y = oy + y; if (X >= 0 && Y >= 0 && X < w && Y < h) px[Y * w + X] = p; } } return s; },
    /* to colours: sphere-lit pixels keep their step; the rest take edge light within their own material (lit where
       open to the top left, a glint on an open corner, shaded where open to the bottom right); then the outline */
    render(o = {}) {
      const out = new Array(w * h).fill(null), same = (x, y, r) => { const p = at(x, y); return p && p.r === r; };
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
        const p = px[y * w + x]; if (!p) continue; if (p.fix) { out[y * w + x] = p.fix; continue; }
        const r = p.r;
        if (p.lv != null) { let c = r[STEP[p.lv]]; if (o.soft && c === r.gl) c = r.hi; out[y * w + x] = c; continue; }
        const up = same(x, y - 1, r), left = same(x - 1, y, r), down = same(x, y + 1, r), right = same(x + 1, y, r);
        let c = r.base;
        if (!up && !left) c = r.gl; else if (!up || !left) c = r.hi;
        else if (!down || !right) c = r.lo;
        if (o.soft && c === r.gl) c = r.hi;
        out[y * w + x] = c;
      }
      if (o.outline !== false) {
        const res = out.slice();
        for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
          if (out[y * w + x]) continue;
          const n = [[0, 1], [1, 0], [0, -1], [-1, 0]].map(([a, b]) => at(x + a, y + b)).filter(Boolean);
          if (n.length) res[y * w + x] = n[0].r.out;
        }
        return res;
      }
      return out;
    }
  };
  return s;
}

/* ---------- caching to images ---------- */
const cache = new Map();
const toCanvas = (s, o) => { const c = document.createElement('canvas'); c.width = s.w; c.height = s.h; const x = c.getContext('2d'), cols = s.render(o);
  for (let i = 0; i < cols.length; i++) if (cols[i]) { x.fillStyle = cols[i]; x.fillRect(i % s.w, (i / s.w) | 0, 1, 1); } return c; };
/* Higher pixel count, same design (Nov 2026): small sprites (up to 64 px) are drawn, then doubled twice with Scale2x
   (EPX), a pixel-art upscaler that keeps every colour and shape but smooths stair-step edges and diagonals into 4x
   the pixels. Layout keeps the original (logical) size: logicalOf(url) tells the snapper what it was. */
/* Dec 2026, from the player: back to the original chunky pixels. SMOOTH = true restores the Scale2x pass. */
const SMOOTH = false, HIRES = SMOOTH ? 4 : 1, logical = new Map();
const scale2x = c => {
  if (!SMOOTH) return c;
  const w = c.width, h = c.height, src = new Uint32Array(c.getContext('2d').getImageData(0, 0, w, h).data.buffer);
  const o = document.createElement('canvas'); o.width = w * 2; o.height = h * 2; const od = o.getContext('2d').createImageData(w * 2, h * 2), dst = new Uint32Array(od.data.buffer);
  const at = (x, y) => src[Math.min(h - 1, Math.max(0, y)) * w + Math.min(w - 1, Math.max(0, x))];
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const P = at(x, y), A = at(x, y - 1), B = at(x + 1, y), C = at(x - 1, y), Dn = at(x, y + 1);
    const e0 = C === A && C !== Dn && A !== B ? A : P, e1 = A === B && A !== C && B !== Dn ? B : P, e2 = Dn === C && Dn !== B && C !== A ? C : P, e3 = B === Dn && B !== A && Dn !== C ? Dn : P;
    const i = (y * 2) * w * 2 + x * 2; dst[i] = e0; dst[i + 1] = e1; dst[i + w * 2] = e2; dst[i + w * 2 + 1] = e3;
  }
  o.getContext('2d').putImageData(od, 0, 0); return o;
};
/* dusk grade (owner, 28 Nov 2026: a darker game): scenery behind the work and combat (districts, backdrops) is
   deepened in place, keeping its hue: a gamma of 1.45 sinks the mid-tones, 80% value, and a 10% pull toward the
   shared night ink. Heroes, targets and creatures are not graded, so the thing you act on stays the brightest. */
const DUSK = { gam: 1.45, v: .8, tint: [24, 18, 22], tm: .1 };
const duskLut = Array.from({ length: 256 }, (_, c) => 255 * Math.pow(c / 255, DUSK.gam) * DUSK.v * (1 - DUSK.tm));
const dusk = c => { if (!c || !c.getContext) return c; const x = c.getContext('2d'), d = x.getImageData(0, 0, c.width, c.height), q = d.data;
  for (let i = 0; i < q.length; i += 4) { q[i] = duskLut[q[i]] + DUSK.tint[0] * DUSK.tm; q[i + 1] = duskLut[q[i + 1]] + DUSK.tint[1] * DUSK.tm; q[i + 2] = duskLut[q[i + 2]] + DUSK.tint[2] * DUSK.tm; }
  x.putImageData(d, 0, 0); return c; };
const hires = c => { if (!c || Math.max(c.width, c.height) > 64) return c; let o = c; for (let k = 1; k < HIRES; k *= 2) o = scale2x(o); return o; };
const url = (key, make, o) => { if (cache.has(key)) return cache.get(key); const s = make(); let u = null; if (s) { const c = toCanvas(s, o), up = hires(c); u = up.toDataURL(); if (up !== c) logical.set(u, [c.width, c.height]); } cache.set(key, u); return u; };
/* an <img> at a whole-number scale; size is the target box, the sprite is scaled by the largest integer that fits */
const img = (u, w, h, box, cls = '', alt = '') => { const k = Math.max(1, Math.floor(Math.min(box / w, box / h))); return `<img class="pxa ${cls}" src="${u}" width="${w * k}" height="${h * k}" alt="${alt.replace(/"/g, '&quot;')}" draggable="false">`; };
const logicalOf = u => logical.get(u) || null;

/* ---------- shared palette: every sprite draws from these ramps ---------- */
const R = {
  ink: ramp('#3a2a2a'),
  oakLeaf: ramp('#5f9a45'), oakLeafDeep: ramp('#3f7a3c'), pine: ramp('#2f6b4a'), pineDeep: ramp('#24513f'),
  bark: ramp('#7a5236'), barkDark: ramp('#5a3b2a'), birch: ramp('#e9e2cf'), soil: ramp('#7b5a3c'), grass: ramp('#79b04f'), grassDeep: ramp('#5b9444'),
  stone: ramp('#8a8580'), stoneDark: ramp('#66615e'), copper: ramp('#d0763d'), tin: ramp('#b8c2c4'), sapphire: ramp('#3f6fd6', { gl: .75 }),
  wood: ramp('#9b6a3e'), woodLight: ramp('#c49158'), straw: ramp('#d9b45a'), strawDark: ramp('#b48c3c'), plaster: ramp('#efe2c4'), beam: ramp('#6b4630'),
  bronze: ramp('#c58a52', { gl: .7 }), iron: ramp('#9aa3ad', { gl: .7 }), steel: ramp('#cdd5dc', { gl: .75 }), leather: ramp('#9a6a42'), cloth: ramp('#4f7fbf'),
  string: ramp('#e8dcc0'), gold: ramp('#e6b84a', { gl: .75 }), red: ramp('#c8483c'), water: ramp('#4f8fc0'), waterDeep: ramp('#3a6ea0'),
  feather: ramp('#f2ead8'), comb: ramp('#d8443a'), beak: ramp('#e8a838'), goblin: ramp('#79a84a'), goblinCloth: ramp('#8a5a3a'), fur: ramp('#8e8f96'), furDark: ramp('#62646e'),
  pikeBody: ramp('#7f9a4a'), pikeBelly: ramp('#d8d6a0'), carpBody: ramp('#c8963e'), carpBelly: ramp('#ead39a'), fin: ramp('#c86a44'),
  potato: ramp('#c99a5a'), leafCrop: ramp('#6ea846'), flowerPink: ramp('#e48aa8'), flowerYellow: ramp('#f0d060'), sky: ramp('#9fd0e8'), path: ramp('#cdb07a')
};
const SKIN = ['#f0c49a', '#d49a6e', '#a8704a', '#6e4630'].map(c => ramp(c, { lo: .26 }));
const HAIR = ['#3a2a1e', '#6a4228', '#d6b062', '#c24a2a', '#cfd3d8'].map(c => ramp(c));

/* ---------- faces: the shared vocabulary for eyes (drawn last, on top of the lit shapes) ----------
   kind: 'dot' (a 1 x 2 dark eye), 'shine' (2 x 2 with a catch-light), 'glow' (a coloured eye with a bright core),
   'slit' (narrow, mean) or 'shut' */
const EYES = (s, x, y, o = {}) => { const k = o.kind || 'dot', ink = o.ink || INK, col = o.col;
  if (k === 'shut') { s.fix(x, y + 1, o.lid || '#4a2e2a'); return; }
  if (k === 'slit') { s.fix(x, y, col || ink); s.fix(x + (o.dir || 1), y, col || ink); return; }
  if (k === 'glow') { s.fix(x, y, col || '#ffd84a'); s.fix(x, y + 1, mix(col || '#ffd84a', '#3a1a10', .45)); if (o.core !== false) s.fix(x, y, mix(col || '#ffd84a', '#ffffff', .55)); return; }
  if (k === 'shine') { s.fix(x, y, '#ffffff'); s.fix(x + 1, y, ink); s.fix(x, y + 1, ink); s.fix(x + 1, y + 1, ink); return; }
  s.fix(x, y, ink); s.fix(x, y + 1, ink); };

/* ================= The hero (24 x 32): a chibi in three-quarter view =================
   A big head (13 x 11) with 1 x 2 eyes, a swept fringe and side locks, a short body, chunky boots; feet on rows 28-29
   as before, so every scene that stands the hero on a ground line still does. Faces are three distinct designs. */
const FACES = {
  bright: (s, sk, hr) => { EYES(s, 9, 9); EYES(s, 14, 9); s.fix(11, 12, sk.lo); s.fix(12, 12, sk.lo); s.fix(7, 11, mix(sk.base, '#e0606a', .4)); s.fix(16, 11, mix(sk.base, '#e0606a', .4)); },
  freckled: (s, sk, hr) => { EYES(s, 9, 9); EYES(s, 14, 9); s.fix(8, 8, hr.lo); s.fix(9, 8, hr.lo); s.fix(14, 8, hr.lo); s.fix(15, 8, hr.lo); s.fix(11, 12, sk.out); s.fix(12, 12, sk.lo); [[7, 11], [8, 12], [15, 12], [16, 11]].forEach(([x, y]) => s.fix(x, y, mix(sk.base, '#8a4a2a', .45))); },
  bearded: (s, sk, hr) => { EYES(s, 9, 9); EYES(s, 14, 9); s.fix(8, 8, hr.lo); s.fix(9, 8, hr.lo); s.fix(14, 8, hr.lo); s.fix(15, 8, hr.lo);
    for (let x = 7; x <= 16; x++) s.dot(x, 13, hr); for (let x = 8; x <= 15; x++) s.dot(x, 14, hr); for (let x = 9; x <= 14; x++) s.dot(x, 15, hr); s.dot(7, 12, hr); s.dot(16, 12, hr); s.fix(11, 12, '#5a2a2a'); s.fix(12, 12, '#5a2a2a'); }
};
DQ.HERO_FACES = Object.keys(FACES);
function hero(o = {}) {
  const sk = SKIN[o.skin ?? 0], hr = HAIR[o.hair ?? 1], tunic = ramp(o.tunic || '#3f7fbf'), pants = ramp('#5a4636'), boots = ramp('#3e2c22'), belt = ramp('#7a4e28');
  const s = Spr(24, 32), f = o.frame || 0;
  /* idle-life frames (o.expr, js/personality.js): blink, yawn, stretch (both arms lifted), pack (looking down at the belt
     pouch) and wipe (the free hand at the brow). No expr draws the standing hero. */
  const ex = o.expr || '', lift = ex === 'stretch' ? -3 : 0, wipe = ex === 'wipe';
  const swing0 = o.pose === 'work' ? [[1, 0], [2, -2], [0, 1]][f % 3] : [0, 0], swing = [swing0[0], swing0[1] + lift];
  const spec = v => !v ? null : typeof v === 'string' ? { type: null, col: (R[v] || R.bronze).base } : v;
  const metal = c => ramp(c, { gl: .72 }), soft = c => ramp(c);
  /* a cape hangs behind everything */
  /* seen from the front the skill cape shows as a mantle over the shoulders (drawn after the body, below); a cape
     hanging behind a front-facing chibi read as blue trousers (owner, 28 Nov 2026) */
  /* legs and boots */
  const legs = spec(o.legs), lt = legs ? (legs.type || 'plate') : null, lr = legs ? (lt === 'plate' ? metal(legs.col) : soft(legs.col)) : pants;
  s.rect(8, 23, 3, 5, lr); s.rect(13, 23, 3, 5, lr);
  if (lt === 'plate') { s.tone(9, 24, lr, 4); s.tone(14, 24, lr, 4); s.rect(8, 26, 3, 1, ramp(mix(legs.col, '#1a1838', .3))); s.rect(13, 26, 3, 1, ramp(mix(legs.col, '#1a1838', .3))); }
  else if (lt === 'chaps') { s.fix(9, 23, '#e6c86a'); s.fix(14, 23, '#e6c86a'); s.line(8, 25, 10, 25, null, lr.lo); s.line(13, 25, 15, 25, null, lr.lo); }
  s.rect(7, 27, 4, 3, boots); s.rect(13, 27, 4, 3, boots); s.tone(7, 27, boots, 3); s.tone(13, 27, boots, 3);
  if (lt === 'robe') { s.poly([[6, 21], [18, 21], [19, 28], [5, 28]], lr); s.line(12, 22, 12, 27, null, lr.lo); s.line(5, 28, 18, 28, null, R.gold.base); }
  /* body: a short tunic with a belt; body armour replaces it */
  const body = spec(o.body), bt = body ? (body.type || 'plate') : null, br = body ? (bt === 'plate' ? metal(body.col) : soft(body.col)) : tunic;
  if (bt === 'robe') s.poly([[7, 15], [17, 15], [19, 28], [5, 28]], br);
  else s.rect(7, 15, 10, 8, br);
  if (bt === 'robe') { s.line(11, 16, 11, 27, null, R.gold.base); s.line(12, 16, 12, 27, null, R.gold.hi); s.line(5, 28, 18, 28, null, R.gold.base); }
  else if (bt === 'vest') { s.line(11, 16, 11, 20, null, br.lo); s.line(12, 16, 12, 20, null, br.lo); for (let y = 16; y <= 19; y += 2) { s.fix(10, y, '#e8dcc0'); s.fix(13, y, '#e8dcc0'); } }
  else if (bt === 'plate') { s.ell(7, 16, 2.4, 1.8, br); s.ell(16, 16, 2.4, 1.8, br); s.line(11, 16, 11, 20, null, br.lo); s.line(12, 16, 12, 20, null, br.hi); s.tone(9, 17, br, 4); s.tone(9, 18, br, 3); }
  else { s.fix(11, 15, tunic.lo); s.fix(12, 15, tunic.lo); s.fix(11, 16, tunic.out); }       /* the tunic's neck opening */
  if (bt !== 'robe') { s.rect(7, 21, 10, 1, belt); s.fix(11, 21, '#f2c84a'); s.fix(12, 21, '#c8962a'); }
  if (o.cape) { const c = soft(o.cape); s.rect(6, 15, 12, 2, c); s.line(6, 16, 17, 16, null, c.lo); s.fix(6, 15, c.lo); s.fix(17, 15, c.lo); s.fix(11, 16, '#f2c84a'); s.fix(12, 16, '#c8962a'); }
  /* arms: sleeves and chunky fists; the right one holds the weapon */
  let sleeve = body && bt !== 'vest' ? br : tunic;
  if (!wipe) { s.rect(5, 16 + lift, 2, 5, sleeve); s.rect(5, 21 + lift, 2, 2, sk); s.tone(5, 16 + lift, sleeve, 3); }
  s.rect(17 + swing[0], 16 + swing[1], 2, 5, sleeve); s.rect(17 + swing[0], 21 + swing[1], 2, 2, sk);
  /* head: a big round face, ears, then the hair */
  s.ell(11.5, 9.5, 6.2, 5.6, sk);
  s.dot(4, 10, sk); s.dot(19, 10, sk); s.fix(4, 11, sk.lo); s.fix(19, 11, sk.lo);
  s.ell(11.5, 4.8, 7, 3, hr);                                                                              /* the crown of the hair */
  s.rect(4, 5, 2, 6, hr); s.rect(18, 5, 2, 5, hr); s.tone(4, 5, hr, 3);                                    /* side locks */
  for (const [x, y] of [[5, 8], [6, 8], [7, 8], [8, 8], [9, 8], [6, 9], [16, 8], [17, 8], [12, 8]]) s.tone(x, y, hr, y > 8 ? 1 : 2); /* a fringe swept to one side */
  s.tone(8, 3, hr, 4); s.tone(9, 3, hr, 4); s.tone(10, 2, hr, 3); s.tone(14, 3, hr, 3);
  (FACES[o.face] || FACES.bright)(s, sk, hr);
  if (ex) { for (const x of [9, 14]) { s.dot(x, 9, sk); s.dot(x, 10, sk); if (ex === 'pack') { s.fix(x, 10, INK); s.fix(x, 11, INK); } else s.fix(x, 10, sk.out); }       /* shut, or looking down */
    if (ex === 'yawn' || ex === 'stretch') { s.fix(11, 12, '#5a2a2a'); s.fix(12, 12, '#5a2a2a'); s.fix(11, 13, '#3a1a24'); s.fix(12, 13, '#3a1a24'); } } /* a wide yawn */
  /* headgear fitted to the big head; helmets are open-faced (the eyes always show) */
  const helm = spec(o.helm);
  if (helm) { const t = helm.type || 'helm';
    if (t === 'coif' || t === 'hood') { const c = soft(helm.col);
      for (let y = t === 'hood' ? 0 : 2; y <= 15; y++) for (let x = 3; x <= 20; x++) { const dx = (x - 11.5) / 8.4, dy = (y - 9) / 8.2; const inFace = x >= 7 && x <= 16 && y >= 8 && y <= 14; if (dx * dx + dy * dy <= 1 && !inFace) s.dot(x, y, c); }
      if (t === 'hood') { s.dot(11, -1, c); s.dot(12, 0, c); s.line(7, 15, 16, 15, null, R.gold.base); }
      else for (let x = 5; x <= 18; x += 2) s.fix(x, 15, c.lo);
      s.tone(7, 3, c, 4); s.tone(8, 3, c, 3); }
    else if (t === 'crown') { const c = metal(helm.col); s.rect(6, 2, 12, 2, c); for (const x of [6, 9, 12, 15, 17]) s.rect(x, 0, 1, 2, c); s.fix(11, 2, '#ff7ad0'); s.fix(14, 2, '#7ad0ff'); s.fix(8, 2, '#7ae8a0'); }
    else { const m = metal(helm.col);
      for (let y = 0; y <= 7; y++) for (let x = 3; x <= 20; x++) { const nx = (x + .5 - 12) / 8.2, ny = (y + .5 - 8) / 7.8; if (nx * nx + ny * ny <= 1) s.tone(x, y, m, sphere(nx, ny)); }
      s.rect(4, 8, 16, 1, m); s.rect(4, 9, 2, 4, m); s.rect(18, 9, 2, 4, m);                                   /* dome, brim, cheek guards */
      s.line(11, 1, 11, 7, null, m.lo); s.line(12, 1, 12, 7, null, m.hi);
      if (t === 'horned') { const hh = ramp('#efe2c4'); s.poly([[5, 4], [1, -1], [3, -1], [7, 2]], hh); s.poly([[18, 4], [22, -1], [20, -1], [16, 2]], hh); } } }
  /* a shield on the left arm */
  const shield = spec(o.shield);
  if (shield) { const m = metal(shield.col), L = lift; s.poly([[1, 16 + L], [8, 16 + L], [8, 22 + L], [4.5, 26 + L], [1, 22 + L]], m); s.poly([[2, 17 + L], [7, 17 + L], [7, 21 + L], [4.5, 24 + L], [2, 21 + L]], ramp(mix(shield.col, '#c8483c', .45))); s.ell(4.5, 20 + L, 1, 1, R.gold); s.tone(2, 17 + L, m, 4); }
  /* the weapon in the right fist */
  const wpn = typeof o.weapon === 'string' ? { type: o.weapon, col: R[o.blade || (o.weapon === 'axe' ? 'iron' : 'steel')].base } : o.weapon;
  if (wpn) { const hx = 17 + swing[0], hy = 21 + swing[1], t = wpn.type, m = metal(wpn.col);
    if (t === 'sword' || t === 'cutlass') { for (let i = 2; i <= 12; i++) { const dx = t === 'cutlass' ? Math.round(Math.sin(i / 4) * 1.5) : 0; s.tone(hx + 3 + dx, hy - i, m, 4); s.tone(hx + 4 + dx, hy - i, m, 2); } s.tone(hx + 3, hy - 13, m, 4); s.rect(hx + 1, hy - 1, 5, 1, R.gold); s.rect(hx + 3, hy, 1, 2, R.leather); } /* the blade stands a pixel off the arm, so its outline shows */
    else if (t === 'dagger') { for (let i = 2; i <= 6; i++) { s.tone(hx + 2, hy - i, m, 3); s.tone(hx + 3, hy - i, m, 1); } s.tone(hx + 2, hy - 7, m, 4); s.rect(hx + 1, hy - 1, 4, 1, R.gold); }
    else if (t === 'hammer') { s.line(hx + 2, hy + 2, hx + 2, hy - 9, R.wood); s.rect(hx, hy - 13, 6, 4, m); s.tone(hx, hy - 13, m, 4); }
    else if (t === 'axe') { s.line(hx + 1, hy + 1, hx + 4, hy - 8, R.wood); s.poly([[hx + 3, hy - 10], [hx + 7, hy - 10], [hx + 7, hy - 5], [hx + 4, hy - 6]], m); }
    else if (t === 'bow') { const w = ramp(wpn.col); for (let y = -7; y <= 7; y++) { s.dot(19 + Math.round(2 - (y * y) / 25), 18 + y, w); s.dot(20 + Math.round(2 - (y * y) / 25), 18 + y, w); } s.line(19, 11, 19, 25, null, '#efe4c8'); }
    else if (t === 'staff') { const w = ramp(mix(wpn.col, '#6a4a2a', .3)); s.line(hx + 2, hy + 6, hx + 2, hy - 13, w); s.line(hx + 3, hy + 6, hx + 3, hy - 13, w); s.ell(hx + 2.5, hy - 15, 2, 2, ramp(wpn.orb || '#8fc0ff', { gl: .85 })); s.fix(hx + 2, hy - 16, '#ffffff'); }
  }
  /* the free (left) hand: at the brow, with a bead of sweat flicked off, or holding the belt pouch open */
  if (wipe) { s.rect(4, 13, 2, 4, sleeve); s.rect(5, 11, 2, 2, sleeve); s.rect(6, 8, 3, 2, sk); s.fix(20, 7, '#cfe8f2'); s.fix(21, 6, '#ffffff'); }
  if (ex === 'pack') { s.rect(6, 21, 3, 3, R.leather); s.fix(7, 21, R.leather.lo); s.fix(8, 22, '#e6b84a'); s.rect(5, 21, 2, 1, sk); }
  return s;
}

/* ================= The hero at work, in profile (24 x 32) =================
   Skill realism (owner, 27 Nov 2026: "where the character holds things when using them in skills"): at work the hero
   turns side-on to face the tree, rock, anvil or mark on their right, feet apart, and their arms come from the work rig
   (js/work_rig.js), which draws them with the tool in the right hand(s) for every frame. This figure has no arms of its
   own, except the near arm lifted to the brow in the wipe frame (js/personality.js). The feet stand on the bottom row,
   the scene's ground line. Postures: stand, crouch (tracking), kneel (setting a trap or stake) and sit (on a stool at
   the stitching bench); WORK_POSTURE gives each one's drop and shoulder for the rig. Same equipment and expressions as
   the standing hero, drawn for a side view. The body's geometry (shoulders, belt on row 20, hanging knuckles 8 px up,
   feet) is fixed: the rig's arms and working heights are measured from it (tests/skill-realism.cjs). 28 Nov 2026: the
   head is a pixel rounder and the eye two pixels tall, so it matches the chibi front view. */
const WORK_POSTURE = { stand: { dy: 0 }, crouch: { dy: 3 }, kneel: { dy: 6 }, sit: { dy: 6 } };
function heroSide(o = {}) {
  const sk = SKIN[o.skin ?? 0], hr = HAIR[o.hair ?? 1], tunic = ramp(o.tunic || '#3f7fbf'), pants = ramp('#5a4636'), boots = ramp('#3e2c22'), belt = ramp('#7a4e28');
  const pose = WORK_POSTURE[o.posture] ? o.posture : 'stand', dy = WORK_POSTURE[pose].dy, ex = o.expr || '';
  const s = Spr(24, 32), spec = v => !v ? null : typeof v === 'string' ? { type: null, col: (R[v] || R.bronze).base } : v;
  const metal = c => ramp(c, { gl: .72 }), soft = c => ramp(c);
  const hu = ex === 'stretch' ? -1 : 0, Y = y => y + dy + hu; /* the head and chest; stretch lifts the chin a pixel */
  /* cape first, hanging behind the back */
  if (o.cape) s.poly([[8, 14 + dy], [11, 14 + dy], [9, 30], [4, 29]], soft(o.cape));
  /* legs: a working stance, feet a stride apart (back foot left, front foot right, toes forward) */
  const legsC = spec(o.legs), legT = legsC ? (legsC.type || 'plate') : null, lr = legsC ? (legT === 'plate' ? metal(legsC.col) : soft(legsC.col)) : pants;
  const foot = (x, y) => { s.rect(x, y, 4, 2, boots); s.tone(x + 3, y, boots, 3); };
  if (pose === 'stand') { s.line(10, 22, 8, 29, lr); s.line(11, 22, 9, 29, lr); s.line(13, 22, 14, 29, lr); s.line(14, 22, 15, 29, lr); foot(7, 30); foot(14, 30); }
  else if (pose === 'crouch') { s.line(10, 25, 6, 27, lr); s.line(10, 26, 6, 28, lr); s.line(6, 28, 7, 29, lr); s.line(13, 25, 16, 26, lr); s.line(13, 26, 16, 27, lr); s.line(16, 27, 15, 29, lr); s.line(17, 27, 16, 29, lr); foot(5, 30); foot(15, 30); }
  else if (pose === 'kneel') { s.rect(9, 28, 5, 2, lr); s.rect(7, 30, 7, 2, lr); s.rect(4, 30, 3, 2, boots); s.line(13, 28, 17, 27, lr); s.line(13, 29, 17, 28, lr); s.rect(16, 28, 2, 3, lr); foot(16, 30); }
  else { /* sit: thighs level on a stool, shins down to the floor */
    const st = ramp('#8a6040'); s.rect(6, 29, 8, 1, st); s.rect(7, 30, 1, 2, st); s.rect(12, 30, 1, 2, st);
    s.rect(10, 27, 7, 2, lr); s.rect(15, 27, 2, 3, lr); foot(15, 30); }
  if (legT === 'plate') { const kx = pose === 'stand' ? 14 : 16, ky = pose === 'stand' ? 25 : 27; s.tone(kx, ky, lr, 4); }
  /* body: a tunic seen side-on, chest forward, belt with its buckle at the front */
  const bodyC = spec(o.body), bt = bodyC ? (bodyC.type || 'plate') : null, br = bodyC ? (bt === 'plate' ? metal(bodyC.col) : soft(bodyC.col)) : tunic;
  s.poly([[9, Y(14)], [14, Y(14)], [15, 23 + dy], [8, 23 + dy]], br);
  if (bt === 'robe' || (legT === 'robe')) { const rr = bt === 'robe' ? br : lr; s.poly([[8, 21 + dy], [15, 21 + dy], [17, Math.min(29, 27 + dy)], [7, Math.min(29, 27 + dy)]], rr); s.line(7, Math.min(28, 26 + dy), 17, Math.min(28, 26 + dy), null, R.gold.base); }
  if (bt === 'plate') { s.rect(10, Y(14), 3, 2, br); s.tone(10, Y(14), br, 4); s.line(14, Y(16), 14, 19 + dy, null, br.hi); }
  else if (bt === 'vest') { for (let y = Y(16); y <= 20 + dy; y += 2) s.fix(14, y, '#e8dcc0'); }
  else if (bt === 'robe') s.line(13, Y(15), 13, 22 + dy, null, R.gold.base);
  s.rect(8, 20 + dy, 8, 1, belt); s.fix(14, 20 + dy, '#f2c84a');
  /* head in profile: face to the right, the ear mid-head, a nose and a mouth */
  s.ell(11.5, Y(8.3), 5.2, 5.1, sk); s.rect(10, Y(13), 3, 1, sk); s.dot(17, Y(10), sk);
  s.fix(10, Y(8), sk.lo); s.fix(10, Y(9), sk.lo); s.fix(9, Y(9), sk.lo);                                                /* ear */
  s.ell(10.5, Y(4.6), 5.6, 3, hr); s.rect(6, Y(5), 4, 6, hr); s.rect(6, Y(11), 3, 1, hr);                                /* crown, back of the head */
  [[13, Y(5)], [14, Y(5)], [15, Y(6)], [16, Y(6)], [12, Y(4)]].forEach(([x, y]) => s.dot(x, y, hr));                     /* fringe over the brow */
  s.tone(9, Y(3), hr, 4); s.tone(10, Y(3), hr, 3);
  const eyeX = 15, shut = ex === 'blink' || ex === 'yawn' || ex === 'stretch';
  if (shut) { s.fix(eyeX, Y(9), sk.out); }
  else if (ex === 'pack') { s.fix(eyeX, Y(9), '#5a4a4a'); s.fix(eyeX, Y(10), INK); }
  else { s.fix(eyeX, Y(8), INK); s.fix(eyeX, Y(9), INK); }
  const face = o.face || 'bright';
  if (face === 'bright') s.fix(15, Y(11), mix(sk.base, '#e0606a', .4));
  if (face === 'freckled') { s.fix(14, Y(10), mix(sk.base, '#8a4a2a', .45)); s.fix(16, Y(11), mix(sk.base, '#8a4a2a', .45)); }
  if (face === 'bearded') { for (let x = 12; x <= 16; x++) s.dot(x, Y(12), hr); for (let x = 11; x <= 15; x++) s.dot(x, Y(13), hr); s.dot(16, Y(11), hr); }
  if (ex === 'yawn') { s.fix(16, Y(12), '#5a2a2a'); s.fix(16, Y(13), '#3a1a24'); }
  else if (ex === 'stretch') { s.fix(15, Y(12), '#5a2a2a'); s.fix(16, Y(12), '#3a1a24'); s.fix(15, Y(6), hr.lo); }
  else if (face !== 'bearded') s.fix(16, Y(12), sk.out);
  /* headgear fitted to the side view */
  const helm = spec(o.helm);
  if (helm) { const t = helm.type || 'helm';
    if (t === 'coif' || t === 'hood') { const c = soft(helm.col);
      for (let y = t === 'hood' ? -1 : 1; y <= 13; y++) for (let x = 5; x <= 17; x++) { const dx = (x - 11) / 6.6, dy2 = (y - 7) / 7.2; const inFace = x >= 13 && y >= 7 && y <= 12; if (dx * dx + dy2 * dy2 <= 1 && !inFace) s.dot(x, Y(y), c); }
      if (t === 'hood') { s.dot(6, Y(0), c); s.dot(5, Y(1), c); s.line(10, Y(13), 14, Y(13), null, R.gold.base); }
      s.tone(9, Y(3), c, 4); }
    else if (t === 'crown') { const c = metal(helm.col); s.rect(7, Y(1), 10, 2, c); for (const x of [7, 10, 13, 16]) s.rect(x, Y(-1), 1, 2, c); s.fix(12, Y(1), '#ff7ad0'); }
    else { const m = metal(helm.col);
      for (let y = 0; y <= 7; y++) for (let x = 5; x <= 18; x++) { const dx = (x - 11.5) / 6.6, dy2 = (y - 6.5) / 6.4; if (dx * dx + dy2 * dy2 <= 1) s.dot(x, Y(y), m); }
      s.rect(5, Y(7), 6, 5, m); s.rect(16, Y(7), 1, 3, m); s.tone(8, Y(2), m, 4); s.tone(9, Y(2), m, 3);                 /* neck guard behind, nasal in front */
      if (t === 'horned') { const h = ramp('#efe2c4'); s.poly([[8, Y(3)], [5, Y(-2)], [7, Y(-1)], [10, Y(2)]], h); } } }
  /* the brow wipe: the near arm up, the forearm across the forehead, a bead of sweat flicked off */
  if (ex === 'wipe') { const sl = br; s.line(12, Y(16), 15, Y(12), sl); s.line(13, Y(16), 16, Y(12), sl); s.line(15, Y(12), 15, Y(8), sl); s.line(16, Y(12), 16, Y(8), sl); s.rect(14, Y(6), 3, 2, sk); s.fix(20, Y(4), '#cfe8f2'); }
  return s;
}

/* ================= Creatures (32 x 32): the three the house style started from ================= */
function chicken() {
  const s = Spr(32, 32), b = R.feather, w = ramp('#e2d6c0');
  s.poly([[8, 16], [3, 9], [6, 9], [9, 13]], b); s.poly([[3, 9], [2, 6], [6, 9]], b);                                  /* tail */
  s.ell(15, 19, 8.5, 6.8, b); s.ell(21, 11.5, 4.6, 4.8, b);                                                             /* body, head */
  s.poly([[25, 11], [29, 12.5], [25, 14]], R.beak); s.rect(19, 5, 4, 2, R.comb); s.dot(18, 6, R.comb); s.dot(22, 4, R.comb); s.rect(24, 14, 1, 3, R.comb);
  s.ell(13.5, 19, 5.4, 3.6, w); s.line(10, 19, 16, 22, null, w.lo); s.line(11, 21, 15, 23, null, w.lo);                 /* folded wing */
  s.line(13, 25, 13, 29, R.beak); s.line(18, 25, 18, 29, R.beak); s.line(11, 29, 15, 29, R.beak); s.line(16, 29, 20, 29, R.beak);
  EYES(s, 22, 10, { kind: 'dot' }); s.fix(23, 10, '#ffffff');
  return s;
}
function goblin() {
  const s = Spr(32, 32), g = R.goblin, c = R.goblinCloth, ir = ramp('#a9b1bb', { gl: .75 });
  s.rect(11, 18, 10, 8, c); s.rect(11, 22, 10, 1, ramp('#5a3a2a')); s.rect(12, 26, 3, 3, c); s.rect(17, 26, 3, 3, c);   /* tunic, legs */
  s.rect(11, 29, 4, 2, ramp('#4a3226')); s.rect(17, 29, 4, 2, ramp('#4a3226'));
  s.ell(16, 11.5, 7.2, 6.4, g); s.poly([[9, 10], [1, 5], [9, 14]], g); s.poly([[23, 10], [31, 5], [23, 14]], g);        /* a big head, long ears */
  s.ell(8.5, 21, 2.2, 2.8, g); s.ell(23.5, 21, 2.2, 2.8, g);                                                             /* fists */
  s.line(25, 22, 28, 12, ir); s.line(26, 22, 29, 12, ir); s.tone(28, 12, ir, 4); s.rect(24, 22, 4, 1, R.leather);        /* a notched dagger */
  EYES(s, 12, 10, { kind: 'glow', col: '#f6d24a' }); EYES(s, 19, 10, { kind: 'glow', col: '#f6d24a' }); s.fix(13, 10, INK); s.fix(20, 10, INK);
  s.line(13, 15, 19, 15, null, '#3a2414'); s.fix(14, 16, '#f4ecd8'); s.fix(18, 16, '#f4ecd8');                           /* a toothy grin */
  s.fix(15, 13, g.lo); s.fix(16, 13, g.lo);
  return s;
}
function wolf() {
  const s = Spr(32, 32), f = R.fur, d = R.furDark, w = ramp('#e6e2da');
  s.poly([[6, 16], [1, 8], [4, 8], [8, 14]], d); s.ell(3, 9, 2.4, 2.4, d);                                             /* raised bushy tail */
  s.ell(14, 17, 9, 5.2, f);                                                                                              /* body */
  [[7, 20, 1], [10, 20, -1], [17, 20, 1], [20, 20, 0]].forEach(([x, y, k], i) => { const r = i % 2 ? d : f; s.rect(x, y, 3, 4, r); s.rect(x + k, y + 4, 2, 4, r); s.rect(x + k, y + 7, 3, 1, d); }); /* jointed legs */
  s.ell(22.5, 12.5, 4.8, 4.4, f); s.poly([[24, 11], [31, 13], [30, 17], [24, 17]], f);                                   /* head, muzzle */
  s.poly([[19, 10], [20, 3], [23, 8]], d); s.poly([[23, 8], [26, 3], [26, 10]], f);                                      /* ears */
  s.ell(14, 20, 6.5, 1.8, w, { flat: true }); s.ell(22, 16, 2.6, 1.6, w, { flat: true });                               /* pale belly and throat */
  EYES(s, 24, 11, { kind: 'glow', col: '#f2c040' }); s.fix(31, 13, INK); s.line(25, 16, 30, 16, null, d.out); s.fix(28, 17, '#f4ecd8');
  return s;
}

/* ================= Trees (32 x 48) ================= */
function oak() {
  const s = Spr(32, 48), L = R.oakLeaf, D = R.oakLeafDeep, t = R.bark;
  s.poly([[13, 46], [19, 46], [18, 28], [14, 28]], t); s.poly([[10, 47], [14, 44], [13, 47]], t); s.poly([[22, 47], [18, 44], [19, 47]], t); /* trunk, roots */
  s.line(16, 30, 9, 23, t); s.line(17, 30, 23, 22, t);                                                              /* branches */
  [[16, 14, 10, 9, D], [8, 20, 6, 5, D], [24, 19, 6, 5.5, D], [16, 11, 8.5, 7, L], [9, 17, 5, 4.4, L], [23, 16, 5.5, 4.6, L], [17, 21, 7, 4, L]].forEach(([x, y, rx, ry, r]) => s.ell(x, y, rx, ry, r));
  [[12, 9], [19, 8], [22, 14], [9, 15], [15, 17]].forEach(([x, y]) => { s.fix(x, y, L.gl); s.fix(x + 1, y, L.hi); });  /* leaf clusters catching the light */
  [[14, 22], [20, 23], [7, 22]].forEach(([x, y]) => s.fix(x, y, D.lo));
  s.fix(15, 36, t.lo); s.fix(16, 40, t.lo); s.fix(15, 34, t.hi);
  return s;
}
function pine() {
  const s = Spr(32, 48), P = R.pine, D = R.pineDeep, t = R.barkDark;
  s.rect(15, 38, 3, 9, t);
  [[16, 4, 4, 13], [16, 11, 7, 20], [16, 18, 9, 28], [16, 25, 11, 36], [16, 31, 12, 41]].forEach(([cx, top, half, bot], i) => s.poly([[cx, top], [cx + half, bot], [cx - half, bot]], i % 2 ? D : P));
  [[15, 9], [13, 16], [12, 24], [11, 31], [10, 38]].forEach(([x, y]) => { s.fix(x, y, P.gl); s.fix(x + 1, y + 1, P.hi); });
  [[20, 19], [23, 27], [24, 35], [26, 40]].forEach(([x, y]) => s.fix(x, y, D.lo));
  s.fix(16, 3, '#f0e2a0');
  return s;
}

/* ================= Fish (32 x 16) ================= */
function pike() {
  const s = Spr(32, 16), b = R.pikeBody;
  s.poly([[2, 8], [7, 5], [24, 5], [28, 7], [28, 9], [24, 10], [7, 10]], b); s.poly([[7, 9], [24, 9], [22, 11], [9, 11]], R.pikeBelly);
  s.poly([[1, 4], [5, 8], [1, 12], [3, 8]], R.fin); s.poly([[8, 5], [11, 2], [12, 5]], R.fin); s.poly([[13, 10], [16, 13], [16, 10]], R.fin);  /* forked tail, dorsal set far back, pelvic */
  [[11, 7], [14, 6], [17, 7], [20, 6], [12, 9], [16, 8], [19, 9], [22, 8]].forEach(([x, y]) => s.fix(x, y, ramp('#d8d6a0').hi));                 /* pale spots */
  s.fix(25, 7, '#2a1c1f'); s.line(26, 9, 29, 8, null, b.out);                                                                                     /* duck-bill snout */
  return s;
}
function carp() {
  const s = Spr(32, 16), b = R.carpBody, fin = ramp('#b8743a');
  s.poly([[5, 8], [9, 4], [16, 2], [23, 3], [28, 6], [29, 9], [25, 12], [16, 13], [9, 12]], b);                   /* deep, humped body */
  s.poly([[8, 10], [16, 12], [25, 11], [22, 13], [12, 13]], R.carpBelly);
  s.poly([[6, 8], [1, 3], [3, 8], [1, 13]], fin); s.poly([[12, 3], [15, 0], [22, 1], [23, 3]], fin); s.poly([[17, 12], [19, 15], [21, 12]], fin); /* broad tail, long dorsal, anal fin */
  for (let y = 5; y <= 9; y += 2) for (let x = 10 + (y % 4 ? 2 : 0); x < 23; x += 4) { s.fix(x, y, b.lo); s.fix(x + 1, y - 1, b.hi); }       /* large scales */
  s.fix(24, 6, '#2a1c1f'); s.fix(24, 5, '#ffffff'); s.fix(28, 9, b.out); s.line(28, 10, 30, 12, null, fin.lo);                                /* eye, mouth, barbel */
  return s;
}
/* ================= Equipment (16 x 16 icons) ================= */
function sword(metal = 'bronze') {
  const s = Spr(16, 16), m = R[metal];
  s.line(4, 11, 12, 3, m); s.line(5, 11, 13, 3, m); s.line(5, 12, 13, 4, m); s.fix(13, 2, m.gl); s.line(6, 10, 12, 4, null, m.gl);
  s.line(2, 10, 6, 14, R.gold); s.line(3, 12, 1, 14, R.leather); s.dot(4, 12, R.leather); s.dot(0, 15, R.gold);
  return s;
}
function bow() {
  const s = Spr(16, 16), w = R.wood;
  for (let i = 0; i <= 24; i++) { const t = i / 24, x = 2 + 10 * t, y = 14 - 13 * t, bulge = Math.sin(t * Math.PI) * 3.6; s.dot(x - bulge, y - bulge, w); s.dot(x - bulge + 1, y - bulge, w); }
  s.line(3, 14, 13, 1, null, '#efe4c8'); s.rect(4, 6, 2, 3, R.leather); s.fix(13, 1, R.woodLight.hi); s.fix(2, 14, R.woodLight.hi);
  return s;
}
function platebody(metal = 'bronze') {
  const s = Spr(16, 16), m = R[metal];
  s.poly([[4, 3], [12, 3], [13, 13], [3, 13]], m); s.rect(1, 3, 3, 4, m); s.rect(12, 3, 3, 4, m); s.erase(7, 3); s.erase(8, 3); s.erase(7, 4); s.erase(8, 4);
  s.line(8, 5, 8, 12, null, m.lo); s.fix(5, 5, m.gl); s.fix(6, 5, m.hi); s.line(4, 10, 12, 10, null, m.lo); s.fix(4, 7, m.hi);
  return s;
}

/* ================= Resources (16 x 16) ================= */
function ore(metal = 'copper') {
  const s = Spr(16, 16); s.poly([[2, 12], [4, 6], [8, 3], [12, 5], [14, 11], [11, 14], [4, 14]], R.stone);
  [[6, 7], [9, 6], [10, 10], [5, 11], [8, 9]].forEach(([x, y]) => { s.dot(x, y, R[metal]); s.dot(x + 1, y, R[metal]); s.fix(x, y, R[metal].hi); });
  return s;
}
function log() {
  const s = Spr(16, 16); s.poly([[1, 9], [10, 4], [14, 7], [5, 13]], R.bark); s.ell(12, 5.5, 2.6, 2.4, R.woodLight);
  s.fix(12, 5, R.wood.lo); s.fix(12, 6, R.wood.base); s.fix(11, 5, R.woodLight.gl); s.line(4, 10, 9, 7, null, R.bark.lo); s.fix(6, 11, R.bark.hi);
  return s;
}
function gem(color = 'sapphire') {
  const s = Spr(16, 16), g = R[color]; s.poly([[4, 6], [6, 3], [10, 3], [12, 6], [8, 13]], g);
  s.line(4, 6, 12, 6, null, g.hi); s.line(6, 3, 8, 6, null, g.gl); s.line(8, 6, 8, 12, null, g.lo); s.fix(6, 4, '#ffffff'); s.fix(10, 8, g.lo);
  return s;
}
function potato() {
  const s = Spr(16, 16); s.ell(8, 9, 5, 4, R.potato); s.ell(5, 7, 1.5, 1, ramp('#b98a4a'));
  [[6, 9], [10, 8], [9, 11]].forEach(([x, y]) => s.fix(x, y, R.potato.lo)); s.poly([[7, 5], [9, 1], [10, 5]], R.leafCrop); s.poly([[9, 5], [13, 3], [11, 6]], R.leafCrop);
  return s;
}

/* ================= Buildings and scenery ================= */
function cottage() {
  const s = Spr(48, 40);
  s.rect(8, 18, 32, 18, R.plaster); s.rect(6, 35, 36, 2, R.stone);                                                    /* walls, plinth */
  s.poly([[3, 20], [24, 4], [45, 20]], R.straw); s.poly([[5, 20], [24, 7], [43, 20], [44, 22], [4, 22]], R.strawDark);/* thatch */
  for (let x = 8; x < 42; x += 3) s.line(x, 20, x + 1, 22, null, R.strawDark.lo);
  s.rect(32, 6, 4, 9, R.stone); s.rect(31, 5, 6, 2, R.stoneDark);                                                     /* chimney */
  [[8, 22, 1, 13], [39, 22, 1, 13], [8, 27, 32, 1]].forEach(([x, y, w, h]) => s.rect(x, y, w, h, R.beam));           /* timber frame */
  s.rect(20, 25, 7, 11, R.wood); s.ell(23.5, 25, 3.5, 2, R.wood); s.fix(25, 31, R.gold.base); s.line(23, 24, 23, 35, null, R.wood.lo);
  [[11, 24], [31, 24]].forEach(([x, y]) => { s.rect(x, y, 5, 5, R.beam); s.rect(x + 1, y + 1, 3, 3, ramp('#f6d880')); s.fix(x + 1, y + 1, '#fff2c0'); s.line(x + 2, y + 1, x + 2, y + 3, null, R.beam.base); });
  s.rect(10, 33, 6, 2, R.oakLeaf); s.rect(30, 33, 7, 2, R.oakLeaf); [[11, 33], [14, 33], [32, 33], [35, 33]].forEach(([x, y]) => s.fix(x, y, '#e48aa8'));
  return s;
}
function village() {
  const W = 160, H = 90, s = Spr(W, H);
  const sky = Spr(W, H); /* sky and hills are flat-lit bands, drawn without outlines */
  return { s, W, H };
}
function sceneCanvas() {
  const W = 160, H = 90, c = document.createElement('canvas'); c.width = W; c.height = H; const x = c.getContext('2d');
  const band = (y, h, col) => { x.fillStyle = col; x.fillRect(0, y, W, h); };
  band(0, 14, '#a8d8ec'); band(14, 10, '#b8e0ee'); band(24, 8, '#cbe8ef');                                              /* stepped sky */
  [[18, 8, 14], [104, 5, 18], [136, 11, 10]].forEach(([cx, cy, w]) => { x.fillStyle = '#f6fbfc'; x.fillRect(cx, cy, w, 3); x.fillRect(cx + 3, cy - 2, w - 6, 2); x.fillStyle = '#d8eef4'; x.fillRect(cx + 2, cy + 3, w - 4, 1); });
  const hill = (pts, col) => { x.fillStyle = col; x.beginPath(); x.moveTo(0, H); pts.forEach(([a, b]) => x.lineTo(a, b)); x.lineTo(W, H); x.closePath(); x.fill(); };
  hill([[0, 40], [30, 32], [62, 38], [96, 30], [130, 36], [160, 31]], '#8cbf74');
  hill([[0, 50], [40, 44], [80, 50], [120, 43], [160, 48]], '#79b04f');
  band(56, 34, '#6aa244');
  /* the path: a lighter band winding to the door */
  x.fillStyle = '#cdb07a'; x.beginPath(); x.moveTo(60, H); x.bezierCurveTo(66, 74, 84, 70, 86, 62); x.lineTo(92, 62); x.bezierCurveTo(92, 72, 78, 78, 80, H); x.fill();
  x.fillStyle = '#b8995e'; for (let i = 0; i < 12; i++) x.fillRect(64 + i * 1.5 + (i % 3), 66 + i * 2, 2, 1);
  /* grass tufts and flowers, hand-placed */
  [[10, 70], [24, 82], [40, 74], [120, 72], [140, 84], [150, 66], [104, 80]].forEach(([a, b]) => { x.fillStyle = '#5b9444'; x.fillRect(a, b, 1, 2); x.fillRect(a + 2, b - 1, 1, 3); x.fillRect(a + 4, b, 1, 2); });
  [[30, 78, '#e48aa8'], [36, 80, '#f0d060'], [116, 78, '#e48aa8'], [126, 76, '#ffffff'], [146, 74, '#f0d060']].forEach(([a, b, col]) => { x.fillStyle = col; x.fillRect(a, b, 1, 1); x.fillStyle = '#3f7a3c'; x.fillRect(a, b + 1, 1, 1); });
  /* fence */
  x.fillStyle = '#9b6a3e'; for (let i = 0; i < 6; i++) x.fillRect(100 + i * 6, 62, 2, 7); x.fillRect(99, 64, 34, 1); x.fillRect(99, 67, 34, 1);
  return c;
}
function composeScene() {
  const c = sceneCanvas(), x = c.getContext('2d');
  const shadow = (cx, cy, rx) => { x.fillStyle = 'rgba(40,60,30,.28)'; for (let j = -2; j <= 2; j++) { const w = Math.round(rx * Math.sqrt(1 - (j * j) / 6.5)); x.fillRect(cx - w, cy + j, w * 2, 1); } };
  const put = (spr, X, Y) => x.drawImage(toCanvas(spr), X, Y);
  shadow(22, 67, 10); shadow(50, 77, 9); shadow(144, 59, 8); shadow(86, 63, 20);
  put(oak(), 6, 20); put(pine(), 128, 12); put(cottage(), 62, 26); put(oak(), 34, 30);
  return c;
}

/* ================= Skill icons (16 x 16) ================= */
function iconFishing() { const s = Spr(16, 16); s.line(2, 14, 11, 2, R.wood); s.line(3, 14, 12, 2, R.woodLight); s.line(12, 2, 13, 9, null, '#e8dcc0'); s.ell(13, 11, 2, 1.4, R.fin); s.fix(14, 11, '#2a1c1f'); s.rect(4, 11, 2, 2, R.iron); return s; }
function iconWoodcutting() { const s = Spr(16, 16); s.line(3, 14, 10, 4, R.wood); s.line(4, 14, 11, 4, R.wood); s.poly([[8, 3], [13, 1], [14, 6], [10, 6]], R.iron); s.fix(13, 2, R.iron.gl); s.line(9, 6, 13, 6, null, R.iron.lo); return s; }
function iconMining() { const s = Spr(16, 16); s.line(4, 14, 11, 5, R.wood); s.line(5, 14, 12, 5, R.wood); for (let i = 0; i <= 10; i++) { const t = i / 10; s.dot(3 + Math.round(11 * t), 5 - Math.round(Math.sin(t * Math.PI) * 3), R.iron); s.dot(3 + Math.round(11 * t), 6 - Math.round(Math.sin(t * Math.PI) * 3), R.iron); } s.fix(13, 6, R.iron.gl); return s; }

/* ---------- public API ---------- */
const SPRITES = { chicken, goblin, wolf, oak, pine, pike, carp, sword, bow, platebody, ore, log, gem, potato, cottage, iconFishing, iconWoodcutting, iconMining };
DQ.pixelArt = {
  ramp, mix, Spr, R, SKIN, HAIR, hero, heroSide, WORK_POSTURE, url, img, toCanvas, hires, scale2x, dusk, logicalOf, sprites: SPRITES, composeScene,
  EYES, sphere, INK, COOL, WARM, lum, atScale,
  sprite: (name, ...args) => url(name + ':' + args.join(','), () => SPRITES[name](...args)),
  heroUrl: (o) => url('hero:' + JSON.stringify(o), () => hero(o)),
  heroSideUrl: (o) => url('heroside:' + JSON.stringify(o), () => heroSide(o)),
  sceneUrl: () => { const k = 'scene:willowbrook'; if (!cache.has(k)) cache.set(k, composeScene().toDataURL()); return cache.get(k); }
};
})();
