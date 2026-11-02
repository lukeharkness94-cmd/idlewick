/* Idlewick: gear icons, painted at 32x32 with a different design at every tier.
   A bronze sword and an astral sword no longer share a silhouette: guards, blades, crests, horns, trims and glows change as the metal improves.
   Anything without a painted icon (tools, unique drops) keeps its line icon. */
(() => {
const DQ = window.DQ, D = DQ.data, { esc } = DQ;
const N = 32;
const P = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
const mix = (a, b, t) => a.map((v, i) => Math.round(v + (b[i] - v) * t));
const lit = (c, t) => t >= 0 ? mix(c, [255, 255, 255], t) : mix(c, [0, 0, 0], -t);
const INK = [26, 18, 18], GOLD = [238, 198, 96], GOLDD = [170, 124, 44], WOOD = [138, 94, 52], LEATHER = [120, 78, 44];

function paintr() {
  const px = new Array(N * N).fill(null);
  const o = {
    px, set(x, y, c) { x = Math.round(x); y = Math.round(y); if (x >= 0 && y >= 0 && x < N && y < N) px[y * N + x] = c; },
    get(x, y) { return x >= 0 && y >= 0 && x < N && y < N ? px[y * N + x] : null; },
    rect(x, y, w, h, c) { for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) o.set(x + i, y + j, c); },
    disc(cx, cy, r, c) { for (let j = -r; j <= r; j++) for (let i = -r; i <= r; i++) if (i * i + j * j <= r * r + r * .5) o.set(cx + i, cy + j, c); },
    ell(cx, cy, rx, ry, c) { for (let j = -ry; j <= ry; j++) for (let i = -rx; i <= rx; i++) if (i * i / (rx * rx + .3) + j * j / (ry * ry + .3) <= 1) o.set(cx + i, cy + j, c); },
    line(x0, y0, x1, y1, c) { const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0), 1) * 2; for (let i = 0; i <= n; i++) o.set(x0 + (x1 - x0) * i / n, y0 + (y1 - y0) * i / n, c); },
    poly(pts, fn) { let y0 = 1e9, y1 = -1e9; pts.forEach(p => { y0 = Math.min(y0, p[1]); y1 = Math.max(y1, p[1]); });
      for (let y = Math.floor(y0); y <= y1; y++) { const xs = []; for (let i = 0; i < pts.length; i++) { const [ax, ay] = pts[i], [bx, by] = pts[(i + 1) % pts.length]; if ((ay <= y + .5 && by > y + .5) || (by <= y + .5 && ay > y + .5)) xs.push(ax + (y + .5 - ay) / (by - ay) * (bx - ax)); }
        xs.sort((a, b) => a - b); for (let k = 0; k + 1 < xs.length; k += 2) for (let x = Math.round(xs[k]); x < Math.round(xs[k + 1]); x++) o.set(x, y, typeof fn === 'function' ? fn(x, y) : fn); } },
    /* draw along a direction: s runs along it, w across it */
    along(h, s0, s1, w0, w1, fn, step = .5) { for (let s = s0; s <= s1; s += step) for (let w = w0; w <= w1; w += step) { const c = fn(s, w); if (c) o.set(h[0] + (s * .7071) + (w * .7071), h[1] - (s * .7071) + (w * .7071), c); } },
    finish() { const out = new Uint8ClampedArray(N * N * 4);
      for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) { let c = px[y * N + x], i = (y * N + x) * 4;
        if (!c) { const nb = [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => o.get(x + dx, y + dy)); if (nb) c = INK; }
        if (c) { out[i] = c[0]; out[i + 1] = c[1]; out[i + 2] = c[2]; out[i + 3] = 255; } }
      return out; },
  };
  return o;
}

/* ---------- palettes ---------- */
const metal = t => { const c = P(D.TIERS[t].col); return { b: c, h: lit(c, .42), l: lit(c, -.32), d: lit(c, -.52) }; };
const woodPal = col => { const c = P(col); return { b: c, h: lit(c, .3), l: lit(c, -.3), d: lit(c, -.5) }; };
const GLOW = [[200, 220, 255], [190, 255, 230], [255, 226, 160]];

/* ---------- blades ---------- */
const guards = (o, H, s, t, m) => {
  const col = t >= 3 ? GOLD : m.l, hi = t >= 3 ? [255, 232, 150] : m.b;
  const gw = [3, 4, 5, 5, 6, 7, 8][t];
  o.along(H, s - .5, s + 1, -gw, gw, (a, w) => Math.abs(w) < gw - .6 || a < s + .5 ? (w < 0 ? hi : col) : null);
  if (t >= 2) { for (const sg of [-1, 1]) { const tipS = s + (t >= 3 ? 3.5 : -1), w = sg * (gw + 1); o.along(H, s + (t >= 3 ? 1 : -.5), tipS, w - .5, w + .5, () => col); } }
  if (t >= 4) o.along(H, s - 1, s + 1.5, -1, 1, () => [90, 200, 255]);
  if (t === 6) o.along(H, s - 1, s + 1.5, -1, 1, () => [255, 255, 255]);
};
const sword = t => {
  const o = paintr(), m = metal(t), H = [7, 25], len = [14, 15, 17, 18, 19, 20, 21][t], bw = t < 2 ? 1.5 : 2.4, s0 = 6;
  o.along(H, -3, 5, -1.1, 1.1, (s, w) => s < 0 ? (t < 3 ? m.l : GOLD) : (Math.floor(s * 1.5) & 1 ? LEATHER : lit(LEATHER, -.25)));
  o.along(H, -4.5, -2.5, -1.8, 1.8, (s, w) => (Math.abs(w) < 1.4 ? (t >= 3 ? [120, 200, 255] : GOLD) : GOLDD));
  guards(o, H, 5.5, t, m);
  o.along(H, s0, s0 + len, -bw, bw, (s, w) => { const taper = Math.min(1, (s0 + len - s) / 4.5); if (Math.abs(w) > bw * taper + .2) return null; if (t >= 2 && Math.abs(w) < .5 && s < s0 + len - 4) return m.l; return w < -bw * .2 ? m.h : w > bw * .45 ? m.l : m.b; });
  if (t >= 4) for (let s = s0 + 3; s < s0 + len - 4; s += 2.6) o.along(H, s, s + .5, -.3, .3, () => GLOW[t % 3]);
  if (t === 6) [[24, 6], [28, 11], [20, 3], [27, 5]].forEach(([x, y]) => { o.set(x, y, [255, 255, 255]); o.set(x - 1, y, [200, 190, 255]); o.set(x + 1, y, [200, 190, 255]); o.set(x, y - 1, [200, 190, 255]); o.set(x, y + 1, [200, 190, 255]); });
  return o;
};
const dagger = t => {
  const o = paintr(), m = metal(t), H = [9, 23], len = [9, 10, 11, 12, 13, 14, 15][t], bw = t < 3 ? 1.5 : 2;
  o.along(H, -2, 4, -1, 1, (s, w) => s < 0 ? (t >= 3 ? GOLD : m.l) : (Math.floor(s * 1.5) & 1 ? LEATHER : lit(LEATHER, -.25)));
  o.along(H, 4, 5.5, -3.2, 3.2, (s, w) => Math.abs(w) > 1.6 && t < 2 ? null : (w < 0 ? m.b : m.l));
  o.along(H, 5.5, 5.5 + len, -bw, bw, (s, w) => { const taper = Math.min(1, (5.5 + len - s) / 3.5); const curve = t >= 4 ? Math.sin((s - 5.5) * .6) * .9 : 0; if (Math.abs(w - curve) > bw * taper + .2) return null; return w - curve < -bw * .2 ? m.h : w - curve > bw * .4 ? m.l : m.b; });
  if (t >= 3) o.along(H, 7, 5.5 + len - 3, -.2, .2, () => t >= 5 ? [110, 255, 170] : m.l);
  if (t >= 5) [[22, 8], [25, 12]].forEach(([x, y]) => o.set(x, y, [255, 255, 255]));
  return o;
};
const hammer = t => {
  const o = paintr(), m = metal(t), H = [7, 26];
  o.along(H, -2, 17, -1, 1, (s, w) => (w < 0 ? lit(WOOD, .15) : WOOD));
  o.along(H, -2, 0, -1.6, 1.6, () => LEATHER);
  const hs = 5 + Math.floor(t * .7), hh = 3.4 + t * .3, S0 = 16;
  const headCol = t === 0 ? WOOD : null;
  o.along(H, S0, S0 + hs, -hh * 1.4, hh * 1.4, (s, w) => { const c = headCol ? (w < 0 ? lit(WOOD, .2) : lit(WOOD, -.15)) : (w < -hh * .5 ? m.h : w > hh * .6 ? m.l : m.b); if (t >= 3 && Math.abs(w) < hh * 1.4 && s > S0 + hs - 1.1) return GOLD; return c; });
  if (t >= 2) o.along(H, S0 - 1.2, S0, -hh * 1.4 - 1, hh * 1.4 + 1, () => m.l);
  if (t >= 3) { o.along(H, S0 + hs * .4, S0 + hs * .6, hh * 1.4, hh * 1.4 + 3.2, () => m.h); o.along(H, S0 + hs * .4, S0 + hs * .6, -hh * 1.4 - 3.2, -hh * 1.4, () => m.h); }
  if (t >= 4) o.along(H, S0 + 1, S0 + hs - 1, -.5, .5, () => GLOW[t % 3]);
  if (t === 6) [[26, 5], [20, 3]].forEach(([x, y]) => { o.set(x, y, [255, 255, 255]); o.set(x + 1, y, [200, 190, 255]); o.set(x, y + 1, [200, 190, 255]); });
  return o;
};
const bow = t => {
  const o = paintr(), m = woodPal(D.ITEMS[['bow_normal', 'bow_oak', 'bow_willow', 'bow_maple', 'bow_yew', 'bow_magic', 'bow_elder'][t]].col), R = 12 + t * .6;
  for (let a = -78; a <= 78; a += 1) { const rad = a * Math.PI / 180, x = 9 + (1 - Math.cos(rad)) * -R * .45 + Math.cos(rad) * R * .45 + 3, y = 16 + Math.sin(rad) * R * 1.12; const th = Math.abs(a) < 18 ? 2.2 : Math.abs(a) < 55 ? 1.6 : 1.1; for (let k = 0; k < th; k++) o.set(x + k - 0.5, y, k === 0 ? m.h : m.b); }
  const top = [9 + 3 + 0, 16 - R * 1.12 * Math.sin(78 * Math.PI / 180)], bot = [top[0], 32 - top[1]];
  o.line(top[0] + 1, top[1], bot[0] + 1, bot[1], t >= 5 ? [200, 255, 240] : [236, 232, 214]);
  o.rect(10, 14, 3, 5, t >= 3 ? GOLD : LEATHER); o.set(11, 15, lit(t >= 3 ? GOLD : LEATHER, .3));
  if (t >= 2) { o.disc(top[0] + 1, top[1] - 1, 1, t >= 5 ? [180, 120, 255] : m.l); o.disc(bot[0] + 1, bot[1] + 1, 1, t >= 5 ? [180, 120, 255] : m.l); }
  if (t >= 4) for (let k = 0; k < 4; k++) o.set(12 + k * 1.2, 8 + k * 4.4, GLOW[t % 3]);
  if (t === 6) { [[24, 6], [27, 14], [24, 24]].forEach(([x, y]) => { o.set(x, y, [255, 255, 255]); o.set(x + 1, y, [200, 255, 220]); o.set(x, y + 1, [200, 255, 220]); }); }
  return o;
};
const staff = t => {
  const o = paintr(), m = woodPal(D.ITEMS[['staff_normal', 'staff_oak', 'staff_willow', 'staff_maple', 'staff_yew', 'staff_magic', 'staff_elder'][t]].col), H = [6, 28];
  o.along(H, -3, 22, -1, 1, (s, w) => (w < 0 ? m.h : m.b)); o.along(H, 0, 3, -1.5, 1.5, () => LEATHER);
  const hx = 6 + 22 * .7071, hy = 28 - 22 * .7071, orb = [[200, 160, 100], [150, 210, 255], [160, 255, 200], [255, 160, 90], [255, 120, 80], [190, 130, 255], [255, 240, 200]][t];
  if (t === 0) { o.line(hx, hy, hx - 3, hy - 4, m.b); o.line(hx, hy, hx + 3, hy - 4, m.b); }
  else if (t === 1) { o.disc(hx + 1, hy - 2, 3, orb); o.set(hx, hy - 3, [255, 255, 255]); }
  else if (t === 2) { for (let a = 40; a <= 320; a += 12) o.set(hx + 1 + Math.cos(a * Math.PI / 180) * 5, hy - 3 + Math.sin(a * Math.PI / 180) * 5, orb); o.disc(hx + 1, hy - 3, 2, lit(orb, .2)); }
  else if (t === 3) { o.poly([[hx + 1, hy - 10], [hx + 5, hy - 3], [hx + 1, hy + 2], [hx - 3, hy - 3]], (x, y) => x > hx + 1 ? lit(orb, -.2) : orb); o.set(hx, hy - 6, [255, 255, 255]); }
  else if (t === 4) { o.poly([[hx + 1, hy - 11], [hx + 5, hy - 4], [hx + 3, hy + 1], [hx - 1, hy + 1], [hx - 3, hy - 4]], (x, y) => y < hy - 6 ? [255, 230, 120] : orb); o.set(hx + 1, hy - 4, [255, 255, 255]); }
  else if (t === 5) { o.disc(hx + 1, hy - 4, 4, orb); o.disc(hx, hy - 5, 1, [255, 255, 255]); for (let a = 0; a < 360; a += 15) o.set(hx + 1 + Math.cos(a * Math.PI / 180) * 7, hy - 4 + Math.sin(a * Math.PI / 180) * 3, GOLD); }
  else { o.disc(hx + 1, hy - 4, 4, orb); o.disc(hx, hy - 5, 2, [255, 255, 255]); for (let k = 0; k < 8; k++) { const a = k * Math.PI / 4; o.set(hx + 1 + Math.cos(a) * 7, hy - 4 + Math.sin(a) * 7, [255, 255, 255]); o.set(hx + 1 + Math.cos(a) * 6, hy - 4 + Math.sin(a) * 6, orb); } }
  return o;
};
const arrow = t => {
  const o = paintr(), m = metal(t), H = [5, 27];
  o.along(H, 0, 22, -.6, .6, (s, w) => (w < 0 ? lit(WOOD, .3) : WOOD));
  o.along(H, 22, 27, -1.8, 1.8, (s, w) => Math.abs(w) < 1.8 * (1 - (s - 22) / 5.4) ? (w < 0 ? m.h : m.b) : null);
  const f = [[220, 60, 50], [60, 150, 220], [90, 200, 110], [230, 190, 60], [170, 90, 220], [60, 210, 220], [255, 240, 255]][t];
  for (const k of [0, 2.2, 4.4]) o.along(H, k, k + 2, -2.2, 2.2, (s, w) => Math.abs(w) > 1.1 ? (w < 0 ? f : lit(f, -.25)) : null);
  return o;
};

/* ---------- armour (front view) ---------- */
const plate = (t) => { const m = metal(t); return (x, y, x0, x1) => x < (x0 + x1) / 2 - 1 ? m.h : x > (x0 + x1) / 2 + 2 ? m.l : m.b; };
const helm = t => {
  const o = paintr(), m = metal(t), cx = 16;
  if (t >= 4) { /* horns / wings first, so the dome sits in front */
    const hc = t === 4 ? [240, 232, 210] : [250, 250, 255];
    if (t === 4) { for (const sg of [-1, 1]) { o.poly([[cx + sg * 8, 10], [cx + sg * 13, 8], [cx + sg * 14, 3], [cx + sg * 10, 5], [cx + sg * 7, 8]], (x, y) => y < 6 ? hc : lit(hc, -.2)); } }
    else for (const sg of [-1, 1]) { for (let k = 0; k < 4; k++) o.line(cx + sg * 8, 11 - k, cx + sg * (14 + k), 6 - k * 1.5, k % 2 ? lit(hc, -.15) : hc); }
  }
  o.ell(cx, 14, 8, 8, m.b); o.rect(cx - 8, 14, 17, 8, m.b);
  for (let y = 5; y < 23; y++) for (let x = 7; x < 25; x++) { const c = o.get(x, y); if (c === m.b) o.set(x, y, x < cx - 3 ? m.h : x > cx + 3 ? m.l : m.b); }
  o.rect(cx - 9, 21, 19, 2, m.l);
  if (t === 0) { o.rect(cx - 7, 17, 15, 2, lit(LEATHER, .1)); }                       /* cap */
  if (t >= 1) o.rect(cx - 1, 12, 3, 8, m.l);                                         /* nasal guard */
  if (t >= 2) { o.rect(cx - 6, 15, 13, 2, INK); o.rect(cx - 6, 15, 13, 1, [60, 40, 40]); }  /* visor slit */
  if (t >= 3) { o.rect(cx - 1, 2, 3, 6, t === 3 ? [214, 56, 50] : GOLD); o.rect(cx - 2, 3, 5, 3, t === 3 ? [230, 80, 70] : GOLD); }   /* crest */
  if (t >= 4) o.rect(cx - 8, 10, 17, 1, GOLD);
  if (t === 6) { o.poly([[cx - 8, 7], [cx - 6, 1], [cx - 3, 6], [cx, 0], [cx + 3, 6], [cx + 6, 1], [cx + 8, 7]], (x, y) => x < cx ? [255, 232, 150] : GOLD); o.disc(cx, 8, 1, [150, 230, 255]); }
  else if (t >= 3) o.set(cx, 9, [120, 200, 255]);
  return o;
};
const body = t => {
  const o = paintr(), m = metal(t), cx = 16, cloth = [[160, 110, 70], [150, 150, 160], [200, 60, 56], [60, 100, 200], [60, 160, 100], [70, 190, 210], [190, 150, 255]][t];
  const shade = (x0, x1) => (x) => x < (x0 + x1) / 2 - 2 ? m.h : x > (x0 + x1) / 2 + 3 ? m.l : m.b;
  if (t >= 3) for (const sg of [-1, 1]) { o.ell(cx + sg * 11, 8, 5, 4, m.b); o.ell(cx + sg * 11, 7, 3, 2, m.h); if (t >= 5) o.disc(cx + sg * 11, 5, 1, GOLD); }
  if (t === 0) { o.poly([[8, 6], [13, 4], [19, 4], [24, 6], [27, 14], [23, 15], [23, 28], [9, 28], [9, 15], [5, 14]], (x, y) => x < 14 ? lit(cloth, .15) : x > 19 ? lit(cloth, -.2) : cloth); o.rect(9, 20, 14, 2, [80, 56, 36]); o.rect(15, 20, 2, 2, GOLD); }
  else { o.poly([[8, 5], [13, 4], [19, 4], [24, 5], [26, 13], [23, 14], [23, 28], [9, 28], [9, 14], [6, 13]], (x, y) => shade(8, 24)(x)); }
  if (t === 1) for (let y = 6; y < 28; y += 2) for (let x = 9 + (y & 2 ? 1 : 0); x < 23; x += 2) { const c = o.get(x, y); if (c) o.set(x, y, lit(c, .22)); }
  if (t >= 2) { o.line(16, 5, 16, 27, m.l); o.line(10, 14, 22, 14, m.l); }
  if (t >= 2) [[11, 8], [21, 8], [11, 22], [21, 22]].forEach(([x, y]) => o.set(x, y, lit(m.h, .3)));
  if (t >= 4) { o.rect(13, 22, 7, 7, cloth); o.rect(13, 22, 7, 1, lit(cloth, .3)); o.rect(16, 22, 1, 7, lit(cloth, -.25)); }
  if (t >= 5) { o.rect(9, 20, 14, 2, GOLD); o.poly([[16, 8], [19, 11], [16, 15], [13, 11]], [120, 200, 255]); }
  if (t === 6) { for (let k = 0; k < 6; k++) o.set(8 + k * 3, 6 + (k % 2) * 20, [255, 255, 255]); o.disc(16, 11, 1, [255, 255, 255]); }
  if (t === 0) o.rect(13, 4, 7, 2, lit(LEATHER, .1));
  return o;
};
const legs = t => {
  const o = paintr(), m = metal(t), cloth = [[130, 100, 70], [120, 120, 130], [190, 60, 56], [60, 100, 190], [60, 150, 100], [70, 180, 200], [180, 140, 240]][t];
  const waist = t === 0 ? LEATHER : m.l;
  o.rect(8, 4, 16, 4, waist); o.rect(8, 4, 16, 1, lit(waist, .3)); o.rect(14, 4, 4, 4, t >= 3 ? GOLD : lit(waist, .2));
  for (const [x0, x1] of [[8, 15], [17, 24]]) {
    o.poly([[x0, 8], [x1, 8], [x1 - (x0 < 12 ? 1 : 0), 29], [x0 + (x0 < 12 ? 0 : 1), 29]], (x, y) => t === 0 ? (x < (x0 + x1) / 2 ? lit(cloth, .12) : cloth) : (x < (x0 + x1) / 2 - 1 ? m.h : x > (x0 + x1) / 2 + 1 ? m.l : m.b));
    if (t >= 1) { o.ell((x0 + x1) / 2, 16, 4, 3, t >= 2 ? m.h : m.b); o.rect(x0, 25, x1 - x0, 4, m.l); }
    if (t >= 3) o.rect((x0 + x1) / 2 - .5, 18, 1, 5, GOLD);
    if (t >= 4) { o.set((x0 + x1) / 2, 11, [120, 220, 255]); o.set((x0 + x1) / 2, 14, [120, 220, 255]); }
    if (t === 0) o.rect(x0, 25, x1 - x0, 2, [90, 62, 40]);
  }
  if (t >= 5) [[10, 12], [22, 12]].forEach(([x, y]) => o.disc(x, y, 1, [255, 255, 255]));
  return o;
};
const shield = t => {
  const o = paintr(), m = metal(t), cx = 16, rim = t >= 3 ? GOLD : m.l;
  const shape = [[[16, 4], [26, 8], [26, 20], [16, 28], [6, 20], [6, 8]], null, null, null, null, null, null];
  const round = (r) => { o.disc(cx, 16, r, rim); o.disc(cx, 16, r - 2, m.b); for (let y = 16 - r; y < 16 + r; y++) for (let x = cx - r; x < cx + r; x++) { const c = o.get(x, y); if (c === m.b && x < cx - 3) o.set(x, y, m.h); else if (c === m.b && x > cx + 3) o.set(x, y, m.l); } };
  if (t === 0) { round(11); o.disc(cx, 16, 3, m.l); o.set(cx - 1, 15, m.h); }
  else if (t === 1) { round(12); o.disc(cx, 16, 4, m.h); o.disc(cx, 16, 2, m.l); }
  else if (t === 2) { o.poly([[6, 5], [26, 5], [26, 18], [16, 29], [6, 18]], rim); o.poly([[8, 7], [24, 7], [24, 17], [16, 26], [8, 17]], (x) => x < 13 ? m.h : x > 19 ? m.l : m.b); o.rect(15, 7, 2, 19, m.l); }
  else if (t === 3) { o.poly([[8, 4], [24, 4], [26, 12], [16, 30], [6, 12]], rim); o.poly([[10, 6], [22, 6], [23, 12], [16, 27], [9, 12]], (x) => x < 14 ? m.h : x > 18 ? m.l : m.b); o.rect(15, 6, 2, 20, [200, 60, 56]); o.rect(10, 11, 12, 2, [200, 60, 56]); }
  else if (t === 4) { o.rect(7, 3, 18, 26, rim); o.rect(9, 5, 14, 22, (0)); for (let y = 5; y < 27; y++) for (let x = 9; x < 23; x++) o.set(x, y, x < 14 ? m.h : x > 18 ? m.l : m.b); o.poly([[16, 9], [20, 14], [16, 21], [12, 14]], [230, 70, 60]); o.rect(7, 3, 18, 2, GOLD); o.rect(7, 27, 18, 2, GOLD); }
  else if (t === 5) { o.poly([[8, 3], [24, 3], [28, 10], [24, 24], [16, 30], [8, 24], [4, 10]], GOLD); o.poly([[10, 6], [22, 6], [25, 11], [22, 22], [16, 27], [10, 22], [7, 11]], (x) => x < 14 ? m.h : x > 18 ? m.l : m.b); o.disc(16, 15, 4, [120, 220, 255]); o.disc(15, 14, 1, [255, 255, 255]); }
  else { for (const sg of [-1, 1]) for (let k = 0; k < 4; k++) o.line(cx + sg * 8, 12 - k, cx + sg * (14 + k), 6 - k * 1.5, k % 2 ? [220, 210, 255] : [255, 255, 255]); o.poly([[8, 5], [24, 5], [26, 14], [16, 29], [6, 14]], GOLD); o.poly([[10, 7], [22, 7], [24, 13], [16, 26], [8, 13]], (x) => x < 14 ? m.h : x > 18 ? m.l : m.b); for (let k = 0; k < 5; k++) { const a = k * Math.PI * 2 / 5 - Math.PI / 2; o.line(16, 15, 16 + Math.cos(a) * 6, 15 + Math.sin(a) * 6, [255, 255, 255]); } o.disc(16, 15, 2, [200, 170, 255]); }
  return o;
};

/* ---------- jewellery: the item's own colour is the gem ---------- */
const ring = id => { const o = paintr(), g = P(D.ITEMS[id].col); o.ell(16, 19, 8, 8, GOLD); o.ell(16, 19, 5, 5, null); for (let j = -5; j <= 5; j++) for (let i = -5; i <= 5; i++) if (i * i / 25 + j * j / 25 <= 1) o.px[(19 + j) * N + 16 + i] = null; o.ell(16, 19, 8, 8, null);
  for (let a = 0; a < 360; a += 3) for (const r of [6, 7, 8]) { const x = 16 + Math.cos(a * Math.PI / 180) * r, y = 20 + Math.sin(a * Math.PI / 180) * r; o.set(x, y, a > 200 && a < 340 ? lit(GOLD, .3) : a > 20 && a < 160 ? GOLDD : GOLD); }
  o.poly([[16, 4], [21, 8], [16, 14], [11, 8]], (x, y) => x < 16 ? lit(g, .25) : g); o.set(14, 7, [255, 255, 255]); o.line(11, 8, 21, 8, lit(g, -.3)); return o; };
const amulet = id => { const o = paintr(), g = P(D.ITEMS[id].col); for (let a = 20; a <= 160; a += 4) { const x = 16 + Math.cos(a * Math.PI / 180) * 11, y = 2 + Math.sin(a * Math.PI / 180) * 18; o.set(x, y, GOLD); o.set(x + 1, y, GOLDD); }
  o.poly([[16, 14], [22, 21], [16, 30], [10, 21]], GOLD); o.poly([[16, 16], [20, 21], [16, 28], [12, 21]], (x, y) => x < 16 ? lit(g, .25) : g); o.set(14, 19, [255, 255, 255]); return o; };

/* ---------- which item gets which painter ---------- */
const TIER_IDX = Object.fromEntries(D.TIERS.map((t, i) => [t.id, i]));
const WOODS = ['normal', 'oak', 'willow', 'maple', 'yew', 'magic', 'elder'];
const LEATHER_SETS = { leather: 0, frost: 3 };
const kindOf = id => {
  let m = id.match(/^(bronze|iron|steel|mithril|adamant|rune|astral)_(sword|dagger|hammer|helm|body|legs|shield)$/); if (m) return [m[2], TIER_IDX[m[1]]];
  m = id.match(/^arrow_(bronze|iron|steel|mithril|adamant|rune|astral)$/); if (m) return ['arrow', TIER_IDX[m[1]]];
  m = id.match(/^(bow|staff)_(normal|oak|willow|maple|yew|magic|elder)$/); if (m) return [m[1], WOODS.indexOf(m[2])];
  m = id.match(/^ring_/); if (m && D.ITEMS[id]) return ['ring', 0];
  m = id.match(/^amulet_/); if (m && D.ITEMS[id]) return ['amulet', 0];
  m = id.match(/^(leather|frost)_(coif|vest|chaps)$/); if (m) return [{ coif: 'helm', vest: 'body', chaps: 'legs' }[m[2]], LEATHER_SETS[m[1]]];
  return null;
};
const PAINT = { sword, dagger, hammer, helm, body, legs, shield, bow, staff, arrow };
const cache = {};
DQ.gearIconUrl = id => {
  if (id in cache) return cache[id];
  let url = null; const k = kindOf(id);
  try { if (k) { const o = (k[0] === 'ring' ? ring(id) : k[0] === 'amulet' ? amulet(id) : PAINT[k[0]](k[1])), cv = document.createElement('canvas'); cv.width = cv.height = N; cv.getContext('2d').putImageData(new ImageData(o.finish(), N, N), 0, 0); url = cv.toDataURL(); } } catch (e) { console.error('gear', id, e); }
  return (cache[id] = url);
};
/* an <img> sized in whole multiples of the 32px art, so every pixel stays square */
DQ.gearIco = (id, cls = '') => { const u = DQ.gearIconUrl(id); return u ? `<img class="gico ${cls}" src="${u}" alt="" draggable="false">` : null; };
DQ.itemIco = it => (it && DQ.gearIco(it.id)) || DQ.ico(it.ic);
})();
