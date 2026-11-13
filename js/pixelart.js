/* Idlewick pixel art: one drawing system for every sprite, scene and icon.
   Style rules (docs/pixel-art-style.md): light from the top left; every material uses a five-step, hue-shifted ramp
   (shadows lean violet, highlights lean warm); silhouettes get a selective outline in a darker shade of the material
   they touch, never flat black; detail is placed by hand on top of the automatic lighting. Sprites are tiny and shown at
   whole-number scales with pixelated rendering, so every pixel stays crisp. Everything is deterministic and cached. */
(() => {
const DQ = window.DQ;
const hex = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
const toHex = a => '#' + a.map(v => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('');
const mix = (a, b, t) => { const A = hex(a), B = hex(b); return toHex(A.map((v, i) => v + (B[i] - v) * t)); };
const SHADOW = '#3a2448', LIGHT = '#fff3cf', INK = '#2a1c1f';
/* five steps: out(line), lo, base, hi, glint */
const ramp = (base, o = {}) => ({ out: mix(mix(base, SHADOW, .62), INK, .35), lo: mix(base, SHADOW, o.lo ?? .32), base, hi: mix(base, LIGHT, o.hi ?? .28), gl: mix(base, LIGHT, o.gl ?? .62) });

/* ---------- a sprite canvas with regions, automatic lighting and selective outlines ---------- */
function Spr(w, h) {
  const px = new Array(w * h).fill(null); /* {r: ramp, fix: colour|null} */
  const at = (x, y) => (x >= 0 && y >= 0 && x < w && y < h) ? px[y * w + x] : null;
  const s = {
    w, h, px, at,
    dot(x, y, r) { x |= 0; y |= 0; if (x >= 0 && y >= 0 && x < w && y < h) px[y * w + x] = { r, fix: null }; },
    fix(x, y, c) { x |= 0; y |= 0; if (x >= 0 && y >= 0 && x < w && y < h) { const p = px[y * w + x]; px[y * w + x] = { r: p ? p.r : ramp(c), fix: c }; } },
    erase(x, y) { x |= 0; y |= 0; if (x >= 0 && y >= 0 && x < w && y < h) px[y * w + x] = null; },
    rect(x, y, rw, rh, r) { for (let j = 0; j < rh; j++) for (let i = 0; i < rw; i++) s.dot(x + i, y + j, r); return s; },
    ell(cx, cy, rx, ry, r) { for (let j = Math.floor(-ry); j <= Math.ceil(ry); j++) for (let i = Math.floor(-rx); i <= Math.ceil(rx); i++) if ((i * i) / (rx * rx + .01) + (j * j) / (ry * ry + .01) <= 1) s.dot(cx + i, cy + j, r); return s; },
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
    /* to colours: each pixel lit by exposure to the top-left within its own material, then outlined */
    render(o = {}) {
      const out = new Array(w * h).fill(null), same = (x, y, r) => { const p = at(x, y); return p && p.r === r; };
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
        const p = px[y * w + x]; if (!p) continue; if (p.fix) { out[y * w + x] = p.fix; continue; }
        const r = p.r, up = same(x, y - 1, r), left = same(x - 1, y, r), down = same(x, y + 1, r), right = same(x + 1, y, r);
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
const SKIN = ['#f3cfa6', '#d9a074', '#a96f48', '#6e4630'].map(c => ramp(c, { lo: .26 }));
const HAIR = ['#3a2a1e', '#8a5a2b', '#d6b062', '#c24a2a', '#cfd3d8'].map(c => ramp(c));

/* ================= The hero (24 x 32) ================= */
/* faces: three distinct designs, not recolours */
/* two-pixel eyes with a catch-light; narrowed (determined) eyes lose the top pixel */
const eyes = (s, narrow) => { for (const x of [9, 14]) { if (!narrow) s.fix(x, 8, '#2a1c1f'); s.fix(x, 9, '#2a1c1f'); } if (!narrow) { s.fix(9, 8, '#5a4a4a'); s.fix(14, 8, '#5a4a4a'); } };
const FACES = {
  bright: (s, sk, hr) => { eyes(s); s.fix(9, 7, hr.lo); s.fix(14, 7, hr.lo); s.fix(11, 11, sk.out); s.fix(12, 11, sk.out); s.fix(8, 10, mix(sk.base, '#e07a6a', .45)); s.fix(15, 10, mix(sk.base, '#e07a6a', .45)); },
  freckled: (s, sk, hr) => { eyes(s, true); s.fix(8, 7, hr.lo); s.fix(9, 7, hr.lo); s.fix(14, 7, hr.lo); s.fix(15, 7, hr.lo); s.fix(10, 11, sk.out); s.fix(11, 11, sk.out); s.fix(12, 11, sk.out); [[8, 10], [10, 10], [13, 10], [15, 10]].forEach(([x, y]) => s.fix(x, y, sk.lo)); },
  bearded: (s, sk, hr) => { eyes(s); s.fix(8, 7, hr.lo); s.fix(9, 7, hr.lo); s.fix(14, 7, hr.lo); s.fix(15, 7, hr.lo); for (let x = 8; x <= 15; x++) s.dot(x, 11, hr); for (let x = 9; x <= 14; x++) s.dot(x, 12, hr); s.fix(11, 11, '#5a2a2a'); s.fix(12, 11, '#5a2a2a'); }
};
DQ.HERO_FACES = Object.keys(FACES);
function hero(o = {}) {
  const sk = SKIN[o.skin ?? 0], hr = HAIR[o.hair ?? 1], tunic = ramp(o.tunic || '#3f7fbf'), pants = ramp('#6b4b34'), boots = ramp('#4a3226'), belt = ramp('#3e2a20');
  const s = Spr(24, 32), f = o.frame || 0, bob = 0;
  /* legs and boots */
  s.rect(9, 22, 2, 7, pants).rect(13, 22, 2, 7, pants); s.rect(8, 28, 3, 2, boots).rect(13, 28, 3, 2, boots);
  /* body: tunic with a belt */
  s.poly([[8, 14 + bob], [15, 14 + bob], [16, 23], [7, 23]], tunic); s.rect(7, 20, 10, 1, belt); s.fix(11, 20, '#e6b84a');
  /* arms (the right arm swings for work) */
  const swing = o.pose === 'work' ? [[1, 0], [2, -2], [0, 1]][f % 3] : [0, 0];
  s.rect(6, 15 + bob, 2, 6, tunic); s.rect(6, 21 + bob, 2, 1, sk);
  s.rect(16 + swing[0], 15 + bob + swing[1], 2, 6, tunic); s.rect(16 + swing[0], 21 + bob + swing[1], 2, 1, sk);
  /* head */
  s.ell(11.5, 8.5 + bob, 4.5, 4.6, sk); s.rect(10, 13 + bob, 4, 1, sk);
  /* hair: a parted fringe and fuller back */
  s.dot(6, 9, sk); s.dot(17, 9, sk);                                                                                   /* ears */
  s.ell(11.5, 5, 5.3, 2.8, hr); s.rect(6, 5, 2, 4, hr); s.rect(16, 5, 2, 3, hr);                                       /* crown, side locks */
  [[8, 7], [9, 7], [10, 6], [12, 7], [13, 7], [14, 6], [15, 7]].forEach(([x, y]) => s.dot(x, y, hr));                 /* a swept, uneven fringe */
  (FACES[o.face] || FACES.bright)(s, sk, hr);
  /* equipment fitted to this body. Each slot takes {type, col}; plain strings name a metal (the showcase uses those). */
  const spec = v => !v ? null : typeof v === 'string' ? { type: null, col: (R[v] || R.bronze).base } : v;
  const metal = c => ramp(c, { gl: .72 }), soft = c => ramp(c);
  const cape = o.cape; if (cape) { const c = soft(cape); s.poly([[7, 14], [16, 14], [18, 27], [5, 27]], c); for (let y = 15; y <= 26; y++) { const p = s.px[y * 24 + 11]; } }
  const legs = spec(o.legs);
  if (legs) { const t = legs.type || 'plate', c = t === 'plate' ? metal(legs.col) : soft(legs.col);
    if (t === 'robe') { s.poly([[7, 21], [16, 21], [17, 29], [6, 29]], c); s.line(11, 22, 11, 28, null, c.lo); s.line(6, 28, 17, 28, null, R.gold.base); }
    else { s.rect(9, 21, 2, 7, c); s.rect(13, 21, 2, 7, c); if (t === 'plate') { s.fix(9, 24, c.gl); s.fix(13, 24, c.gl); s.rect(9, 25, 2, 1, ramp(mix(legs.col, '#3a2448', .3))); s.rect(13, 25, 2, 1, ramp(mix(legs.col, '#3a2448', .3))); } else { s.fix(10, 22, '#e6c86a'); } } }
  const body = spec(o.body);
  if (body) { const t = body.type || 'plate', c = t === 'plate' ? metal(body.col) : soft(body.col);
    if (t === 'robe') { s.poly([[7, 14], [16, 14], [17, 23], [6, 23]], c); s.rect(6, 15, 2, 6, c); s.rect(16, 15, 2, 6, c); s.line(11, 15, 11, 22, null, R.gold.base); s.line(12, 15, 12, 22, null, R.gold.hi); }
    else if (t === 'vest') { s.poly([[8, 14], [15, 14], [16, 22], [7, 22]], c); for (let y = 16; y <= 20; y += 2) { s.fix(10, y, '#e8dcc0'); s.fix(13, y, '#e8dcc0'); } s.line(11, 15, 11, 21, null, c.lo); s.line(12, 15, 12, 21, null, c.lo); }
    else { s.poly([[7, 14], [16, 14], [16, 21], [7, 21]], c); s.rect(5, 14, 3, 3, c); s.rect(16, 14, 3, 3, c); s.line(11, 15, 11, 20, null, c.lo); s.line(12, 15, 12, 20, null, c.hi); s.fix(9, 16, c.gl); }
    s.rect(7, 20, 10, 1, belt); s.fix(11, 20, '#e6b84a'); }
  const helm = spec(o.helm);
  if (helm) { const t = helm.type || 'helm';
    if (t === 'coif' || t === 'hood') { const c = soft(helm.col);
      /* a hood around the face: covers hair and ears, leaves the face (rows 7-12, x 8-15) open */
      for (let y = t === 'hood' ? -1 : 1; y <= 13; y++) for (let x = 5; x <= 18; x++) { const dx = (x - 11.5) / 6.6, dy = (y - 7) / 7; const inFace = x >= 8 && x <= 15 && y >= 7 && y <= 12; if (dx * dx + dy * dy <= 1 && !inFace) s.dot(x, y, c); }
      if (t === 'hood') { s.dot(11, -1, c); s.dot(12, 0, c); s.line(7, 13, 16, 13, null, R.gold.base); }
      s.fix(8, 3, c.gl); }
    else if (t === 'crown') { const c = metal(helm.col); s.rect(7, 2, 10, 2, c); for (const x of [7, 10, 13, 16]) s.rect(x, 0, 1, 2, c); s.fix(11, 2, '#ff7ad0'); s.fix(14, 2, '#7ad0ff'); }
    else { const m = metal(helm.col);
      for (let y = 1; y <= 6; y++) for (let x = 6; x <= 17; x++) { const dx = (x - 11.5) / 6, dy = (y - 6.5) / 5.6; if (dx * dx + dy * dy <= 1) s.dot(x, y, m); }
      s.rect(6, 7, 12, 1, m); s.rect(6, 8, 2, 4, m); s.rect(16, 8, 2, 4, m);
      s.line(11, 1, 11, 6, null, m.lo); s.line(12, 1, 12, 6, null, m.hi); s.fix(8, 3, m.gl); s.fix(9, 3, m.hi);
      if (t === 'horned') { const h = ramp('#efe2c4'); s.poly([[6, 4], [3, -1], [5, 0], [7, 2]], h); s.poly([[17, 4], [20, -1], [18, 0], [16, 2]], h); } } }
  const shield = spec(o.shield);
  if (shield) { const m = metal(shield.col); s.poly([[2, 15], [8, 15], [8, 20], [5, 24], [2, 20]], m); s.poly([[3, 16], [7, 16], [7, 19], [5, 22], [3, 19]], ramp(mix(shield.col, '#c8483c', .45))); s.fix(3, 16, m.gl); }
  const wpn = typeof o.weapon === 'string' ? { type: o.weapon, col: R[o.blade || (o.weapon === 'axe' ? 'iron' : 'steel')].base } : o.weapon;
  if (wpn) { const hx = 17 + swing[0], hy = 21 + swing[1], t = wpn.type, m = metal(wpn.col);
    if (t === 'sword' || t === 'cutlass') { for (let i = 2; i <= 11; i++) { const dx = t === 'cutlass' ? Math.round(Math.sin(i / 4) * 1.5) : 0; s.dot(hx + 1 + dx, hy - i, m); s.dot(hx + 2 + dx, hy - i, m); } s.fix(hx + 1, hy - 12, m.gl); s.line(hx + 1, hy - 3, hx + 1, hy - 10, null, m.gl); s.rect(hx - 1, hy - 2, 5, 1, R.gold); s.rect(hx + 1, hy - 1, 2, 2, R.leather); }
    else if (t === 'dagger') { s.line(hx + 1, hy - 2, hx + 1, hy - 7, m); s.line(hx + 2, hy - 2, hx + 2, hy - 6, m); s.fix(hx + 1, hy - 8, m.gl); s.rect(hx, hy - 2, 4, 1, R.gold); }
    else if (t === 'hammer') { s.line(hx + 1, hy + 1, hx + 1, hy - 9, R.wood); s.rect(hx - 1, hy - 12, 6, 4, m); s.fix(hx, hy - 12, m.gl); }
    else if (t === 'axe') { s.line(hx, hy, hx + 3, hy - 7, R.wood); s.poly([[hx + 2, hy - 9], [hx + 6, hy - 9], [hx + 6, hy - 5], [hx + 3, hy - 6]], m); }
    else if (t === 'bow') { const w = ramp(wpn.col); for (let y = -6; y <= 6; y++) { s.dot(19 + Math.round(1.6 - (y * y) / 22), 15 + y, w); s.dot(20 + Math.round(1.6 - (y * y) / 22), 15 + y, w); } s.line(19, 9, 19, 21, null, '#efe4c8'); }
    else if (t === 'staff') { const w = ramp(mix(wpn.col, '#6a4a2a', .3)); s.line(hx + 1, hy + 4, hx + 1, hy - 12, w); s.line(hx + 2, hy + 4, hx + 2, hy - 12, w); s.ell(hx + 1.5, hy - 13, 1.6, 1.6, ramp(wpn.orb || '#8fc0ff', { gl: .85 })); }
  }
  return s;
}

/* ================= Creatures (32 x 32): three anatomies ================= */
function chicken() {
  const s = Spr(32, 32), b = R.feather;
  s.ell(15, 19, 8, 6.5, b); s.ell(21, 12, 4, 4.5, b); s.poly([[7, 15], [3, 9], [5, 16], [8, 20]], b);          /* body, head, tail */
  s.poly([[24, 12], [28, 13], [24, 14]], R.beak); s.rect(20, 6, 3, 2, R.comb); s.dot(19, 7, R.comb); s.dot(22, 5, R.comb); s.rect(23, 15, 1, 2, R.comb);
  s.ell(14, 19, 5, 3.4, ramp('#e2d6c0')); s.line(10, 18, 16, 21, null, '#cbbfa8');                                    /* folded wing */
  s.line(13, 25, 13, 29, R.beak); s.line(18, 25, 18, 29, R.beak); s.line(11, 29, 15, 29, R.beak); s.line(16, 29, 20, 29, R.beak);
  s.fix(22, 11, '#2a1c1f'); s.fix(22, 10, '#ffffff');
  return s;
}
function goblin() {
  const s = Spr(32, 32), g = R.goblin, c = R.goblinCloth;
  s.ell(16, 11, 6, 5.2, g); s.poly([[10, 9], [3, 6], [9, 12]], g); s.poly([[22, 9], [29, 6], [23, 12]], g);       /* head with long ears */
  s.poly([[11, 16], [21, 16], [23, 26], [9, 26]], c); s.rect(9, 21, 14, 1, ramp('#5a3a2a'));                       /* tunic */
  s.rect(7, 17, 3, 7, g); s.rect(22, 17, 3, 6, g); s.rect(11, 26, 3, 4, g); s.rect(18, 26, 3, 4, g); s.rect(10, 29, 4, 2, ramp('#4a3226')); s.rect(18, 29, 4, 2, ramp('#4a3226'));
  s.line(25, 22, 28, 13, R.wood); s.line(26, 22, 29, 13, R.wood); s.ell(29, 12, 2, 2, R.woodLight);                /* a knotted club */
  s.fix(13, 10, '#f0e070'); s.fix(18, 10, '#f0e070'); s.fix(13, 11, '#2a1c1f'); s.fix(18, 11, '#2a1c1f');           /* yellow eyes */
  s.line(13, 14, 18, 14, null, g.out); s.fix(14, 15, '#f4ecd8'); s.fix(17, 15, '#f4ecd8');                          /* toothy grin */
  s.fix(15, 12, g.lo); s.fix(16, 12, g.lo);
  return s;
}
function wolf() {
  const s = Spr(32, 32), f = R.fur, d = R.furDark;
  s.ell(14, 17, 8.5, 4.6, f); s.ell(22.5, 13, 4.2, 3.8, f); s.poly([[24, 12], [30, 14], [29, 17], [24, 17]], f); s.poly([[20, 10], [21, 5], [23, 9]], d); s.poly([[23, 9], [25, 5], [26, 10]], d); /* body, head, muzzle, ears */
  s.poly([[6, 15], [1, 8], [3, 8], [7, 13]], d); s.ell(3, 9, 2, 2.2, d);                                            /* raised bushy tail */
  [[7, 20, 1], [10, 20, -1], [17, 20, 1], [20, 20, 0]].forEach(([x, y, k], i) => { const r = i % 2 ? d : f; s.rect(x, y, 2, 4, r); s.rect(x + k, y + 4, 2, 4, r); s.rect(x + k, y + 7, 3, 1, d); }); /* jointed legs */
  s.ell(14, 19.5, 6.5, 1.8, ramp('#c6c4c0')); s.line(8, 14, 20, 14, null, d.base); s.line(9, 13, 18, 13, null, d.lo); /* pale belly, dark saddle */
  s.fix(23, 12, '#f0d050'); s.fix(24, 12, '#2a1c1f'); s.fix(30, 14, '#2a1c1f'); s.line(25, 16, 29, 16, null, d.out); s.fix(27, 17, '#f4ecd8');
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
  ramp, mix, Spr, R, SKIN, HAIR, hero, url, img, toCanvas, hires, scale2x, logicalOf, sprites: SPRITES, composeScene,
  sprite: (name, ...args) => url(name + ':' + args.join(','), () => SPRITES[name](...args)),
  heroUrl: (o) => url('hero:' + JSON.stringify(o), () => hero(o)),
  sceneUrl: () => { const k = 'scene:willowbrook'; if (!cache.has(k)) cache.set(k, composeScene().toDataURL()); return cache.get(k); }
};
})();
