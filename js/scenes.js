/* Idlewick: town scenes, painted pixel by pixel at 384x130.
   Each town is a few layers (dithered sky, far and near hills, buildings, foreground) drawn by a tiny pixel painter, then shown
   crisp with no smoothing. They replace the old 104x36 downsampled vector pictures. */
(() => {
const DQ = window.DQ, D = DQ.data, UI = DQ.ui;
const SW = 384, SH = 130;
const P = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
const mix = (a, b, t) => a.map((v, i) => Math.round(v + (b[i] - v) * t));
const lit = (c, t) => t >= 0 ? mix(c, [255, 255, 255], t) : mix(c, [0, 0, 0], -t);
const hash = (x, y = 0, s = 1) => { let h = (x * 374761393 + y * 668265263 + s * 982451653) | 0; h = (h ^ (h >>> 13)) * 1274126177 | 0; return ((h ^ (h >>> 16)) >>> 0) / 4294967295; };
const vn = (x, s, sc) => { const X = x / sc, i = Math.floor(X), f = X - i, u = f * f * (3 - 2 * f); return hash(i, 0, s) * (1 - u) + hash(i + 1, 0, s) * u; };
const BAY = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
const bay = (x, y) => (BAY[(y & 3) * 4 + (x & 3)] + .5) / 16;

function pic() {
  const d = new Uint8ClampedArray(SW * SH * 4); for (let i = 3; i < d.length; i += 4) d[i] = 255;
  const o = {
    d, set(x, y, c, a = 1) { x = Math.round(x); y = Math.round(y); if (x < 0 || y < 0 || x >= SW || y >= SH) return; const i = (y * SW + x) * 4; if (a >= 1) { d[i] = c[0]; d[i + 1] = c[1]; d[i + 2] = c[2]; } else { d[i] += (c[0] - d[i]) * a; d[i + 1] += (c[1] - d[i + 1]) * a; d[i + 2] += (c[2] - d[i + 2]) * a; } },
    get(x, y) { x = Math.max(0, Math.min(SW - 1, Math.round(x))); y = Math.max(0, Math.min(SH - 1, Math.round(y))); const i = (y * SW + x) * 4; return [d[i], d[i + 1], d[i + 2]]; },
    rect(x, y, w, h, c, a = 1) { for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) o.set(x + i, y + j, c, a); },
    disc(cx, cy, r, c, a = 1) { for (let j = -r; j <= r; j++) for (let i = -r; i <= r; i++) if (i * i + j * j <= r * r + r * .6) o.set(cx + i, cy + j, c, a); },
    ell(cx, cy, rx, ry, c, a = 1) { for (let j = -ry; j <= ry; j++) for (let i = -rx; i <= rx; i++) if ((i * i) / (rx * rx + .5) + (j * j) / (ry * ry + .5) <= 1) o.set(cx + i, cy + j, c, a); },
    line(x0, y0, x1, y1, c, a = 1) { x0 = Math.round(x0); y0 = Math.round(y0); x1 = Math.round(x1); y1 = Math.round(y1); const dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0), sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1; let e = dx + dy; for (;;) { o.set(x0, y0, c, a); if (x0 === x1 && y0 === y1) break; const e2 = 2 * e; if (e2 >= dy) { e += dy; x0 += sx; } if (e2 <= dx) { e += dx; y0 += sy; } } },
    poly(pts, c, fn) { let y0 = 1e9, y1 = -1e9, x0 = 1e9, x1 = -1e9; pts.forEach(([x, y]) => { y0 = Math.min(y0, y); y1 = Math.max(y1, y); x0 = Math.min(x0, x); x1 = Math.max(x1, x); });
      for (let y = Math.floor(y0); y <= y1; y++) { const xs = []; for (let i = 0; i < pts.length; i++) { const [ax, ay] = pts[i], [bx, by] = pts[(i + 1) % pts.length]; if ((ay <= y + .5 && by > y + .5) || (by <= y + .5 && ay > y + .5)) xs.push(ax + (y + .5 - ay) / (by - ay) * (bx - ax)); }
        xs.sort((a, b) => a - b); for (let k = 0; k + 1 < xs.length; k += 2) for (let x = Math.round(xs[k]); x < Math.round(xs[k + 1]); x++) o.set(x, y, fn ? fn(x, y) : c); } },
    /* a vertical gradient from stops [[y, hex]...], dithered so the bands never look flat */
    sky(stops, y1 = SH) { for (let y = 0; y < y1; y++) { let i = 0; while (i < stops.length - 2 && y > stops[i + 1][0]) i++; const [ya, ca] = stops[i], [yb, cb] = stops[Math.min(i + 1, stops.length - 1)], t = Math.max(0, Math.min(1, (y - ya) / Math.max(1, yb - ya))), A = P(ca), B = P(cb);
      for (let x = 0; x < SW; x++) { const q = t * 5, f = Math.floor(q), fr = q - f, lv = f + (bay(x, y) < fr ? 1 : 0); o.set(x, y, mix(A, B, Math.min(1, lv / 5))); } } },
    /* rolling ground: a noisy ridge line with a rim light; col(x,y) gives the fill so it can carry texture */
    ridge(base, amp, sc, seed, col, rim, haze) { const hs = []; for (let x = 0; x < SW; x++) { hs[x] = base + amp * ((vn(x, seed, sc) - .5) * 2 + (vn(x, seed + 7, sc / 3) - .5) * .5); }
      for (let x = 0; x < SW; x++) { const y0 = Math.floor(hs[x]); for (let y = y0; y < SH; y++) { let c = typeof col === 'function' ? col(x, y, y - y0) : col; if (haze) c = mix(c, haze[0], haze[1] * Math.max(0, 1 - (y - y0) / 26)); if (y - y0 < 1 && rim) c = rim; else if (y - y0 === 1 && rim && hs[x + 1] < hs[x]) c = mix(c, rim, .5); o.set(x, y, c); } } return hs; },
    glow(cx, cy, r, c, a = .5) { for (let j = -r; j <= r; j++) for (let i = -r; i <= r; i++) { const dd = Math.sqrt(i * i + j * j); if (dd <= r) { const t = (1 - dd / r), q = Math.floor(t * 4) / 4; if (bay(cx + i, cy + j) < t) o.set(cx + i, cy + j, c, a * (.35 + q * .65)); } } },
    cloud(cx, cy, w, h, c, sh) { for (let k = 0; k < 5; k++) { const rx = Math.round(w * (.22 + hash(k, cx, 3) * .12)), ox = Math.round((k - 2) * w * .2), oy = Math.round(-hash(k, cx, 4) * h * .5 + (k === 2 ? -h * .25 : 0)); o.ell(cx + ox, cy + oy, rx, Math.round(h * .5), c); } for (let x = -w / 2; x < w / 2; x++) for (let y = 1; y < h * .5; y++) { const px = cx + x, py = cy + y; const q = o.get(px, py); if (q[0] === c[0] && q[1] === c[1] && q[2] === c[2] && bay(px, py) < y / (h * .5) * .9) o.set(px, py, sh); } },
    outlineOf(x0, y0, x1, y1, from, to) { for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) { const c = o.get(x, y); if (c[0] === from[0] && c[1] === from[1] && c[2] === from[2]) { /* nothing: kept for symmetry */ } } },
  };
  return o;
}

/* ---------- reusable props ---------- */
const house = (o, x, y, w, h, wall, roof, o2 = {}) => {
  const rc = P(roof), wc = P(wall), dk = lit(wc, -.28), hi = lit(wc, .16), k = [26, 19, 16];
  o.rect(x, y, w, h, wc); for (let i = 3; i < w; i += 4) o.rect(x + i, y, 1, h, lit(wc, -.08)); o.rect(x, y + h - 2, w, 2, dk); o.rect(x, y, 1, h, hi);
  const rh = o2.rh || Math.round(w * .55);
  o.poly([[x - 3, y + 1], [x + w / 2, y - rh], [x + w + 3, y + 1]], rc, (px, py) => { const t = (py - (y - rh)) / (rh + 1); let c = (Math.floor(py) + (Math.floor(px / 3) & 1)) % 3 === 0 ? lit(rc, -.14) : rc; if (px < x + w / 2 - 1) c = lit(c, .08); return c; });
  o.line(x - 3, y + 1, x + w / 2, y - rh, lit(rc, .28)); o.line(x + w / 2, y - rh, x + w + 3, y + 1, lit(rc, -.3));
  o.rect(x - 3, y + 1, w + 6, 2, lit(rc, -.4));
  const dw = Math.max(5, Math.round(w * .2)); o.rect(x + Math.round(w / 2 - dw / 2), y + h - Math.round(h * .5), dw, Math.round(h * .5), [96, 62, 34]); o.rect(x + Math.round(w / 2 - dw / 2) + 1, y + h - Math.round(h * .5) + 1, 1, Math.round(h * .5) - 1, [128, 88, 50]);
  for (const wx of [x + 4, x + w - 9]) { if (wx + 5 > x + w / 2 - dw / 2 - 1 && wx < x + w / 2 + dw / 2 + 1) continue; o.rect(wx, y + 4, 5, 5, [64, 42, 28]); o.rect(wx + 1, y + 5, 3, 3, o2.lit === false ? [90, 110, 130] : [255, 224, 130]); o.rect(wx + 2, y + 5, 1, 3, [64, 42, 28]); }
  if (o2.chimney !== false) { const cx = x + w - 6; o.rect(cx, y - rh + 4, 4, 8, [120, 100, 90]); o.rect(cx, y - rh + 4, 4, 1, [80, 66, 60]); if (o2.smoke !== false) for (let i = 0; i < 5; i++) o.disc(cx + 2 + i * 2 + Math.round(Math.sin(i) * 2), y - rh + 1 - i * 4, 2 + i * .4, [235, 235, 235], .5 - i * .08); }
};
const tree = (o, x, y, s, c1, c2, c3, trunk = [88, 58, 32]) => {
  o.rect(x - Math.max(1, s / 6), y - s * .5, Math.max(2, s / 3), s * .55, trunk); o.rect(x - Math.max(1, s / 6), y - s * .5, 1, s * .55, lit(trunk, .2));
  const blobs = [[0, -s * 1.05, s * .62], [-s * .42, -s * .75, s * .5], [s * .44, -s * .72, s * .5], [0, -s * .55, s * .55]];
  blobs.forEach(([bx, by, br]) => o.disc(x + bx, y + by, Math.round(br), c2));
  blobs.forEach(([bx, by, br]) => o.disc(x + bx - 1, y + by - 1, Math.round(br * .78), c1));
  blobs.forEach(([bx, by, br], i) => { for (let k = 0; k < 8; k++) o.set(x + bx - br * .5 + hash(i, k, x) * br * .9, y + by - br * .6 + hash(k, i, x) * br * .5, lit(c1, .24)); });
  for (let k = 0; k < 7; k++) o.set(x - s * .5 + hash(k, x, 2) * s, y - s * .35 + hash(k, x, 3) * s * .3, c3);
};
const pine = (o, x, y, s, c1, c2, snow) => { for (let k = 0; k < 4; k++) { const w = s * (.55 - k * .1), yy = y - s * (.25 + k * .22); o.poly([[x - w, yy + s * .22], [x, yy - s * .12], [x + w, yy + s * .22]], c1, (px, py) => px > x + 1 ? c2 : c1); if (snow) o.line(x - w + 1, yy + s * .2, x, yy - s * .11, snow); } o.rect(x - 1, y, 2, s * .16, [70, 48, 30]); };
const fence = (o, x0, x1, y, c = [124, 92, 56]) => { for (let x = x0; x < x1; x += 8) { o.rect(x, y - 7, 2, 8, c); o.rect(x, y - 7, 1, 8, lit(c, .2)); } o.rect(x0, y - 5, x1 - x0, 1, lit(c, -.15)); o.rect(x0, y - 2, x1 - x0, 1, lit(c, -.15)); };
const tuft = (o, x, y, c) => { o.set(x, y, c); o.set(x - 1, y - 1, c); o.set(x + 1, y - 2, c); o.set(x, y - 2, lit(c, .2)); };
const flower = (o, x, y, c) => { o.set(x, y, c); o.set(x, y - 1, lit(c, .3)); o.set(x, y + 1, [60, 120, 50]); };
const bird = (o, x, y, c) => { o.set(x - 2, y - 1, c); o.set(x - 1, y, c); o.set(x, y, c); o.set(x + 1, y, c); o.set(x + 2, y - 1, c); };

/* ---------- the eight towns ---------- */
const S = {};
S.willowbrook = o => {
  o.sky([[0, '#5b9fd8'], [60, '#a8d4ea'], [88, '#e6f2e4']]);
  o.glow(318, 24, 30, [255, 244, 190], .5); o.disc(318, 24, 9, [255, 250, 214]); o.disc(318, 24, 7, [255, 244, 170]);
  o.cloud(70, 24, 70, 14, [255, 255, 255], [214, 230, 244]); o.cloud(205, 38, 50, 10, [250, 252, 255], [214, 230, 244]); o.cloud(350, 54, 40, 8, [250, 252, 255], [214, 230, 244]);
  [[120, 30], [136, 38], [128, 44]].forEach(([x, y]) => bird(o, x, y, [60, 70, 80]));
  o.ridge(78, 10, 70, 1, P('#93bd86'), P('#b9d9a4'), [P('#e6f2e4'), .45]); o.ridge(88, 8, 48, 2, P('#6fa55a'), P('#9acb78'), [P('#e6f2e4'), .2]);
  [[18, 96, 12], [36, 99, 14], [96, 94, 10], [118, 97, 12], [172, 93, 9]].forEach(([x, y, s]) => tree(o, x, y, s, P('#4f9040'), P('#2f6a30'), P('#79b857')));
  const ground = o.ridge(100, 6, 90, 3, (x, y) => mix(P('#5a9d44'), P('#3f7a34'), Math.min(1, (y - 100) / 30) * .6 + (hash(x, y, 5) > .92 ? .08 : 0)), P('#83c05e'));
  /* a stream */
  for (let y = 104; y < SH; y++) { const cx = 214 + Math.sin((y - 104) * .12) * 9 + (y - 104) * .7, w = 10 + (y - 104) * .9; for (let x = Math.floor(cx - w / 2); x < cx + w / 2; x++) { let c = mix(P('#5aa8d0'), P('#3a7ea8'), (y - 104) / 26); if (hash(x, y, 8) > .93) c = P('#d8f0f8'); if (x < cx - w / 2 + 1.2) c = P('#e4d6a0'); o.set(x, y, c); } }
  house(o, 44, 80, 34, 20, '#f0e2c4', '#c9a24c', { rh: 14 }); house(o, 92, 86, 26, 16, '#e8d6b4', '#b6563e', { rh: 11, smoke: false });
  fence(o, 18, 132, 105); o.rect(0, 108, 0, 0, [0, 0, 0]);
  /* the big willow */
  const wx = 304, wy = 108; o.rect(wx - 3, wy - 34, 7, 36, [96, 66, 36]); o.rect(wx - 3, wy - 34, 2, 36, [132, 96, 56]); o.rect(wx + 2, wy - 34, 2, 36, [66, 44, 26]);
  o.line(wx, wy - 30, wx - 16, wy - 44, [96, 66, 36]); o.line(wx + 1, wy - 30, wx + 18, wy - 42, [96, 66, 36]);
  [[0, -50, 26], [-18, -44, 18], [18, -42, 19], [-8, -56, 16], [10, -56, 16]].forEach(([bx, by, br]) => o.disc(wx + bx, wy + by, br, [62, 122, 56]));
  for (let k = 0; k < 150; k++) { const a = hash(k, 1, 7) * Math.PI * 2, rr = 8 + hash(k, 2, 7) * 28, sx = wx + Math.cos(a) * rr * 1.05, sy = wy - 46 + Math.sin(a) * rr * .55, len = 8 + hash(k, 3, 7) * 22; for (let j = 0; j < len; j++) o.set(sx + Math.sin(j * .35 + k) * .8, sy + j, j < 3 ? [112, 176, 84] : mix([96, 160, 72], [48, 104, 52], j / len)); }
  for (let k = 0; k < 40; k++) o.set(wx - 26 + hash(k, 4, 7) * 52, wy - 70 + hash(k, 5, 7) * 28, [148, 206, 108]);
  for (let i = 0; i < 70; i++) { const x = Math.floor(hash(i, 1, 9) * SW), y = 106 + Math.floor(hash(i, 2, 9) * 24); if (Math.abs(x - 214) < 22) continue; if (i % 5 === 0) flower(o, x, y, [[255, 120, 140], [255, 230, 110], [200, 160, 255]][i % 3]); else tuft(o, x, y, [74, 142, 58]); }
};
S.mossbarrow = o => {
  o.sky([[0, '#8ec4dc'], [50, '#f2e2b8'], [92, '#f8d89a']]);
  o.glow(70, 58, 38, [255, 224, 150], .55); o.disc(70, 58, 10, [255, 246, 200]);
  o.cloud(240, 26, 76, 12, [255, 244, 224], [236, 204, 170]); o.cloud(340, 44, 46, 8, [255, 236, 206], [236, 204, 170]);
  o.ridge(80, 8, 80, 21, P('#b6b27a'), P('#d8cc8c'), [P('#f4dfae'), .5]);
  /* windmill on the far ridge */
  const mx = 300, my = 78; o.poly([[mx - 7, my], [mx - 4, my - 26], [mx + 4, my - 26], [mx + 7, my]], [226, 210, 178], (x, y) => x > mx ? [190, 170, 138] : [232, 218, 188]); o.poly([[mx - 6, my - 26], [mx, my - 36], [mx + 6, my - 26]], [150, 70, 50]);
  for (const a of [0.4, 1.97, 3.54, 5.11]) { o.line(mx, my - 26, mx + Math.cos(a) * 20, my - 26 + Math.sin(a) * 20, [120, 90, 60]); o.line(mx + Math.cos(a) * 6, my - 26 + Math.sin(a) * 6, mx + Math.cos(a + .25) * 19, my - 26 + Math.sin(a + .25) * 19, [236, 224, 196]); }
  o.ridge(92, 5, 60, 22, P('#9fb25a'), P('#c8d27a'), [P('#f4dfae'), .25]);
  /* wheat: bands that widen toward the viewer, with stalks and darker furrows between them */
  { let y = 98, k = 0; while (y < SH) { const bh = Math.max(2, Math.round(2 + (y - 98) * .22)), base = k & 1 ? [226, 186, 84] : [206, 160, 64];
      for (let j = 0; j < bh && y + j < SH; j++) for (let x = 0; x < SW; x++) { let c = base; const st = hash(x, y + j, 4); if (st > .86) c = lit(base, .22); else if (st < .1) c = lit(base, -.16); if (j === bh - 1) c = lit(base, -.24); o.set(x, y + j, c); }
      y += bh; k++; } }
  o.rect(0, 98, SW, 1, [140, 110, 52]);
  /* the barn */
  const bx = 150, by = 98; o.rect(bx - 20, by - 26, 40, 26, [170, 56, 44]); for (let i = 0; i < 40; i += 3) o.rect(bx - 20 + i, by - 26, 1, 26, [146, 44, 36]);
  o.poly([[bx - 24, by - 25], [bx, by - 46], [bx + 24, by - 25]], [92, 44, 36], (x, y) => ((Math.floor(y) + (Math.floor(x / 3) & 1)) % 3 === 0) ? [76, 36, 30] : [98, 48, 38]); o.rect(bx - 24, by - 26, 48, 2, [60, 30, 26]);
  o.rect(bx - 8, by - 16, 16, 16, [240, 230, 210]); o.rect(bx - 7, by - 15, 14, 14, [120, 40, 32]); o.line(bx - 7, by - 15, bx + 6, by - 2, [240, 230, 210]); o.line(bx + 6, by - 15, bx - 7, by - 2, [240, 230, 210]); o.rect(bx - 2, by - 38, 4, 4, [250, 232, 160]);
  o.rect(bx + 26, by - 34, 12, 34, [214, 200, 172]); for (let i = 0; i < 34; i += 4) o.rect(bx + 26, by - 34 + i, 12, 1, [176, 162, 136]); o.ell(bx + 32, by - 34, 6, 4, [150, 70, 50]);
  /* hay bales and fence */
  [[236, 112], [262, 118], [92, 116]].forEach(([x, y]) => { o.ell(x, y, 11, 8, [226, 190, 96]); o.ell(x - 1, y - 1, 9, 6, [240, 208, 120]); o.ell(x, y, 5, 3, [200, 160, 70]); for (let k = 0; k < 8; k++) o.line(x - 9 + k * 2.4, y - 5, x - 8 + k * 2.4, y + 5, [196, 156, 70], .6); });
  fence(o, 0, 120, 124); fence(o, 270, SW, 124);
  [[200, 120], [20, 112], [350, 112]].forEach(([x, y]) => { o.rect(x, y - 8, 2, 14, [110, 78, 44]); o.rect(x - 7, y - 6, 16, 2, [110, 78, 44]); o.disc(x + 1, y - 11, 3, [226, 186, 120]); o.rect(x - 8, y - 6, 4, 4, [220, 170, 60]); o.rect(x + 6, y - 6, 4, 4, [220, 170, 60]); });
  for (let i = 0; i < 6; i++) bird(o, 190 + i * 9 + hash(i, 1, 2) * 8, 40 + hash(i, 3, 2) * 14, [60, 50, 50]);
};
S.saltmere = o => {
  o.sky([[0, '#2a5a88'], [48, '#7ab4c8'], [72, '#f6c8a0']]);
  o.glow(250, 74, 44, [255, 214, 150], .6); o.disc(250, 72, 10, [255, 236, 190]);
  o.cloud(90, 26, 80, 12, [255, 232, 214], [214, 170, 168]); o.cloud(310, 36, 54, 9, [255, 226, 206], [214, 170, 168]);
  /* the sea */
  for (let y = 74; y < SH; y++) { const t = (y - 74) / 56; for (let x = 0; x < SW; x++) { let c = mix(P('#4a98b4'), P('#1f5a7a'), Math.min(1, t * 1.1)); const w = Math.sin(x * .22 + y * .9 + Math.sin(y * .5) * 2) * .5 + .5; if (w > .86 - t * .1) c = lit(c, .16 + t * .12); if (hash(x >> 1, y, 6) > .97 - t * .02) c = lit(c, .3); const dx = Math.abs(x - 250); if (dx < 20 - t * 8 + Math.sin(y) * 4 && bay(x, y) < .5 - t * .3) c = mix(c, [255, 214, 150], .6 - t * .4); o.set(x, y, c); } }
  o.rect(0, 74, SW, 1, [240, 214, 190]);
  /* a sailboat */
  const sx = 170, sy = 96; o.poly([[sx - 12, sy], [sx + 14, sy], [sx + 9, sy + 5], [sx - 8, sy + 5]], [120, 70, 44]); o.rect(sx, sy - 24, 1, 24, [90, 60, 40]);
  o.poly([[sx + 2, sy - 23], [sx + 2, sy - 2], [sx + 16, sy - 2]], [250, 244, 230], (x, y) => x < sx + 6 ? [255, 250, 240] : [226, 216, 200]); o.poly([[sx - 1, sy - 20], [sx - 1, sy - 3], [sx - 9, sy - 3]], [240, 130, 110]);
  o.ell(sx, sy + 7, 16, 2, [20, 60, 80], .5);
  /* the lighthouse on its rock */
  const lx = 56, ly = 100; o.poly([[lx - 22, ly + 12], [lx - 12, ly - 8], [lx + 14, ly - 8], [lx + 26, ly + 12]], [92, 86, 92], (x, y) => hash(x, y, 3) > .85 ? [124, 118, 124] : x > lx + 4 ? [70, 66, 74] : [104, 98, 104]);
  o.poly([[lx - 7, ly - 6], [lx - 4, ly - 56], [lx + 6, ly - 56], [lx + 9, ly - 6]], [244, 240, 232], (x, y) => { const band = Math.floor((ly - y) / 9) & 1; let c = band ? [196, 56, 48] : [244, 240, 232]; if (x > lx + 1) c = lit(c, -.18); return c; });
  o.rect(lx - 7, ly - 62, 16, 6, [60, 60, 68]); o.rect(lx - 4, ly - 68, 10, 6, [255, 236, 150]); o.rect(lx - 5, ly - 74, 12, 3, [196, 56, 48]); o.poly([[lx - 6, ly - 74], [lx + 1, ly - 82], [lx + 8, ly - 74]], [60, 60, 68]);
  o.glow(lx + 1, ly - 65, 20, [255, 240, 170], .55); for (let i = 0; i < 80; i++) { const t = i / 80; o.set(lx + 6 + i * 2.2, ly - 66 + (hash(i, 1, 1) - .5) * 3 * t - i * .05, [255, 244, 190], .25 * (1 - t)); }
  /* the harbour */
  o.rect(228, 104, 160, 4, [150, 108, 70]); for (let x = 228; x < SW; x += 5) o.rect(x, 104, 1, 4, [112, 78, 50]); o.rect(228, 108, 160, 1, [84, 58, 38]);
  for (let x = 236; x < SW; x += 22) { o.rect(x - 1, 108, 4, 20, [90, 62, 40]); o.rect(x - 1, 108, 1, 20, [124, 90, 58]); o.rect(x - 2, 102, 6, 3, [74, 52, 34]); o.ell(x + 1, 128, 5, 1, [20, 60, 80], .5); }
  [[300, 96], [336, 96]].forEach(([x, y]) => { o.rect(x, y, 11, 8, [130, 90, 56]); o.rect(x, y, 11, 1, [170, 126, 84]); o.rect(x + 5, y, 1, 8, [100, 70, 44]); o.rect(x, y + 7, 11, 1, [84, 58, 38]); });
  for (let i = 0; i < 7; i++) bird(o, 120 + i * 24 + hash(i, 1, 4) * 12, 20 + hash(i, 2, 4) * 24, [250, 246, 240]);
  for (let i = 0; i < 40; i++) o.set(hash(i, 1, 8) * 230, 118 + hash(i, 2, 8) * 12, lit([208, 188, 140], hash(i, 3, 8) * .3));
};
S.ironpeak = o => {
  o.sky([[0, '#3f5a82'], [54, '#9ab4d0'], [90, '#dde6ee']]);
  o.cloud(60, 24, 70, 10, [226, 234, 244], [170, 186, 210]); o.cloud(300, 18, 60, 9, [226, 234, 244], [170, 186, 210]);
  const peak = (cx, top, w, base) => { o.poly([[cx - w, base], [cx, top], [cx + w, base]], [112, 124, 142], (x, y) => { const t = (y - top) / (base - top); let c = x > cx + (y - top) * .1 ? [76, 88, 108] : [128, 140, 158]; if (t < .38 + (hash(Math.floor(x / 2), 0, 4) - .5) * .15) c = x > cx + (y - top) * .1 ? [200, 212, 230] : [250, 252, 255]; else if (hash(x, y, 5) > .92) c = lit(c, -.12); return c; }); };
  peak(120, 14, 96, 100); peak(230, 28, 80, 100); peak(330, 20, 70, 100); peak(30, 36, 60, 100);
  o.ridge(100, 4, 40, 31, P('#5a6a78'), P('#8aa0b0'));
  [[16, 110, 20], [38, 114, 16], [66, 108, 22], [96, 114, 15], [140, 112, 18], [300, 112, 17], [330, 108, 22], [360, 114, 16]].forEach(([x, y, s]) => pine(o, x, y, s, [44, 82, 66], [30, 60, 52], [236, 244, 250]));
  /* the fortress on its ledge */
  const fx = 214, fy = 106; o.rect(fx - 40, fy - 22, 80, 22, [112, 116, 124]); for (let y = 0; y < 22; y += 5) o.rect(fx - 40, fy - 22 + y, 80, 1, [88, 92, 100]); for (let x = 0; x < 80; x += 8) o.rect(fx - 40 + x, fy - 22, 1, 22, [96, 100, 108]);
  for (let x = -40; x < 40; x += 8) o.rect(fx + x, fy - 26, 5, 4, [112, 116, 124]);
  [[-34, 34], [28, 34]].forEach(([dx, h]) => { const tx = fx + dx; o.rect(tx - 7, fy - h - 4, 14, h + 4, [124, 128, 138]); o.rect(tx + 2, fy - h - 4, 5, h + 4, [92, 96, 106]); o.poly([[tx - 9, fy - h - 4], [tx, fy - h - 18], [tx + 9, fy - h - 4]], [150, 64, 56]); o.rect(tx - 2, fy - h + 4, 4, 6, [255, 214, 120]); o.rect(tx - 7, fy - h - 6, 14, 2, [88, 92, 100]); });
  o.rect(fx - 8, fy - 16, 16, 16, [50, 40, 36]); o.poly([[fx - 8, fy - 16], [fx, fy - 24], [fx + 8, fy - 16]], [50, 40, 36]); o.rect(fx - 6, fy - 14, 12, 14, [255, 200, 110], .35); o.rect(fx - 1, fy - 14, 1, 14, [50, 40, 36]);
  o.rect(fx - 2, fy - 42, 1, 20, [90, 70, 50]); o.poly([[fx - 1, fy - 42], [fx + 11, fy - 38], [fx - 1, fy - 34]], [196, 58, 48]);
  o.ridge(112, 3, 30, 33, (x, y) => mix(P('#e6eef6'), P('#b4c4d8'), Math.min(1, (y - 112) / 16)), P('#ffffff'));
  [[100, 124], [180, 120], [270, 126]].forEach(([x, y]) => { o.ell(x, y, 8, 5, [138, 148, 164]); o.ell(x - 1, y - 2, 6, 3, [240, 246, 252]); });
  for (let i = 0; i < 90; i++) o.set((hash(i, 1, 6) * SW + i * 3) % SW, hash(i, 2, 6) * 120, [250, 252, 255], .85);
};
S.gloomfen = o => {
  o.sky([[0, '#1a1830'], [50, '#3a3a5a'], [88, '#5a6a6a']]);
  for (let i = 0; i < 50; i++) o.set(hash(i, 1, 2) * SW, hash(i, 2, 2) * 56, [220, 226, 255], .4 + hash(i, 3, 2) * .5);
  o.glow(90, 34, 40, [190, 210, 220], .5); o.disc(90, 34, 14, [236, 240, 226]); o.disc(86, 31, 3, [208, 214, 204], .8); o.disc(95, 38, 4, [214, 220, 210], .7);
  o.ridge(84, 5, 50, 41, P('#2a3848'), P('#445868'), [P('#5a6a6a'), .5]);
  [[20, 92, 26], [140, 88, 20], [250, 90, 24], [340, 92, 22]].forEach(([x, y, s]) => { o.rect(x, y - s, 2, s, [28, 26, 40]); for (const [dx, dy, ex, ey] of [[0, -s * .7, -9, -12], [0, -s * .5, 8, -10], [0, -s * .9, 6, -8], [-1, -s * .3, -7, -6]]) { o.line(x + dx, y + dy, x + ex + dx, y + dy + ey, [28, 26, 40]); o.line(x + ex + dx, y + dy + ey, x + ex * 1.3 + dx, y + dy + ey - 4, [28, 26, 40]); } });
  /* the bog */
  for (let y = 96; y < SH; y++) { const t = (y - 96) / 34; for (let x = 0; x < SW; x++) { let c = mix(P('#2a4040'), P('#12201f'), t); if (Math.sin(x * .3 + y * 1.4) > .9) c = lit(c, .15); if (hash(x, y, 3) > .985) c = [120, 180, 130]; const dx = Math.abs(x - 90); if (dx < 10 - t * 4 && bay(x, y) < .5) c = mix(c, [190, 210, 220], .4); o.set(x, y, c); } }
  for (const [px, py, pw, ph] of [[30, 112, 60, 14], [160, 108, 50, 12], [240, 118, 80, 10], [330, 110, 40, 10]]) o.ell(px + pw / 2, py + ph / 2, pw / 2, ph / 2, [58, 64, 52]);
  /* the stilt house */
  const hx = 270, hy = 86; for (const dx of [-14, -4, 6, 14]) o.rect(hx + dx, hy, 2, 22, [60, 44, 34]); o.rect(hx - 20, hy - 2, 42, 3, [86, 62, 46]); o.rect(hx - 16, hy - 24, 34, 22, [86, 66, 52]); for (let i = 0; i < 34; i += 4) o.rect(hx - 16 + i, hy - 24, 1, 22, [64, 48, 38]);
  o.poly([[hx - 21, hy - 23], [hx, hy - 40], [hx + 23, hy - 23]], [52, 66, 52], (x, y) => ((Math.floor(y) + (Math.floor(x / 2) & 1)) % 3 === 0) ? [40, 52, 42] : [56, 70, 56]); o.rect(hx - 8, hy - 18, 7, 7, [255, 232, 130]); o.glow(hx - 4, hy - 14, 14, [255, 232, 130], .45); o.rect(hx - 5, hy - 18, 1, 7, [64, 48, 38]); o.rect(hx + 5, hy - 16, 8, 14, [40, 30, 28]);
  /* mist */
  for (let band = 0; band < 3; band++) { const by = 78 + band * 12; for (let y = by; y < by + 14; y++) for (let x = 0; x < SW; x++) { const n = vn(x + band * 90, 17 + band, 38), t = 1 - Math.abs(y - by - 7) / 7; if (n * t > .5 && bay(x, y) < (n * t - .3) * 1.2) o.set(x, y, [150, 170, 168], .22 + band * .05); } }
  [[50, 100], [120, 112], [198, 104], [316, 108]].forEach(([x, y], i) => { o.glow(x, y, 9, [170, 255, 150], .6); o.disc(x, y, 2, [226, 255, 200]); });
  const dead = (x, y, s) => { o.rect(x, y - s, 4, s, [24, 22, 34]); o.rect(x, y - s, 1, s, [48, 44, 60]); for (const [ey, ex] of [[.8, -16], [.6, 16], [.95, 10], [.45, -12]]) { o.line(x + 2, y - s * ey, x + 2 + ex, y - s * ey - 10, [24, 22, 34]); o.line(x + 2 + ex, y - s * ey - 10, x + 2 + ex * 1.35, y - s * ey - 16, [24, 22, 34]); } };
  dead(18, 128, 52); dead(350, 126, 46);
};
S.emberfall = o => {
  o.sky([[0, '#1a0e12'], [44, '#5a1a1c'], [82, '#e0602c']]);
  o.glow(190, 70, 70, [255, 150, 60], .5);
  /* the volcano */
  const vx = 190, vt = 28; o.poly([[vx - 110, 104], [vx - 14, vt], [vx + 14, vt], [vx + 110, 104]], [64, 36, 34], (x, y) => { const t = (y - vt) / (104 - vt); let c = x > vx ? [44, 26, 28] : [76, 44, 40]; if (hash(x, y, 6) > .9) c = lit(c, -.18); return c; });
  o.poly([[vx - 15, vt], [vx - 8, vt - 5], [vx + 8, vt - 5], [vx + 15, vt]], [255, 140, 50]); o.rect(vx - 8, vt - 4, 16, 3, [255, 214, 120]);
  for (let k = 0; k < 4; k++) { const sx0 = vx - 6 + k * 4; for (let y = vt; y < 100; y++) { const x = sx0 + Math.sin(y * .12 + k * 2) * (3 + (y - vt) * .22) * (k - 1.5) * .6 + (k - 1.5) * (y - vt) * .35; o.set(x, y, [255, 120 + (y % 7) * 8, 40]); o.set(x + 1, y, [255, 170, 60], .6); } }
  o.glow(vx, vt - 6, 26, [255, 150, 60], .6);
  for (let i = 0; i < 60; i++) { const x = vx - 40 + hash(i, 1, 2) * 80 + i * .4, y = vt - 6 - hash(i, 2, 2) * 24; o.set(x, y, [255, 180 + hash(i, 3, 2) * 60, 70]); }
  o.ridge(100, 4, 26, 51, P('#2c1618'), P('#6a3a30'));
  /* the citadel */
  const cx = 312; [[-26, 34], [-10, 52], [8, 40], [24, 30]].forEach(([dx, h]) => { o.poly([[cx + dx - 8, 112], [cx + dx - 6, 112 - h], [cx + dx, 112 - h - 12], [cx + dx + 6, 112 - h], [cx + dx + 8, 112]], [34, 22, 28], (x, y) => x > cx + dx ? [24, 16, 20] : [44, 30, 36]); for (let k = 0; k < 3; k++) o.rect(cx + dx - 1, 112 - h + 6 + k * 10, 2, 4, [255, 150, 60]); });
  o.glow(cx, 100, 40, [255, 130, 50], .25);
  /* the lava river */
  for (let y = 104; y < SH; y++) { const t = (y - 104) / 26; for (let x = 0; x < SW; x++) { const wave = Math.sin(x * .09 + y * .6 + Math.sin(y * .3) * 3), r = vn(x + y * 4, 9, 14); let c = mix([255, 178, 60], [214, 70, 30], t * .7 + r * .4); if (wave > .8) c = [255, 226, 130]; if (wave < -.7 && hash(x, y, 2) > .5) c = [150, 40, 26]; o.set(x, y, c); } }
  [[24, 112, 22, 16], [88, 118, 28, 10], [250, 116, 20, 12], [350, 112, 30, 18]].forEach(([x, y, w, h]) => { o.ell(x, y, w / 2, h / 2, [40, 28, 32]); o.ell(x - 1, y - 2, w / 2 - 2, h / 2 - 3, [64, 44, 46]); o.rect(x - 3, y - 3, 3, 1, [120, 80, 70]); });
  for (let i = 0; i < 70; i++) { const x = hash(i, 1, 3) * SW, y = 20 + hash(i, 2, 3) * 100; o.set(x, y, [255, 150 + hash(i, 4, 3) * 80, 60], .4 + hash(i, 5, 3) * .6); if (i % 4 === 0) o.set(x, y - 1, [255, 200, 90], .5); }
};
S.skyreach = o => {
  o.sky([[0, '#4a8ad8'], [50, '#9ccaf0'], [92, '#eaf6ff']]);
  o.glow(70, 28, 34, [255, 250, 220], .5); o.disc(70, 28, 8, [255, 252, 232]);
  for (let k = 0; k < 7; k++) { const ang = (k / 7) * Math.PI * .8 + .1; for (let r = 14; r < 120; r += 1) o.set(70 + Math.cos(ang) * r, 28 + Math.sin(ang) * r, [255, 255, 240], .05 + (1 - r / 120) * .07); }
  o.cloud(330, 30, 70, 11, [255, 255, 255], [208, 226, 244]); o.cloud(190, 18, 50, 8, [255, 255, 255], [208, 226, 244]);
  const isle = (cx, cy, w, tw) => {
    for (let x = -w; x <= w; x++) { const f = 1 - Math.abs(x) / w, depth = Math.round(8 + f * f * 26 + hash(x, cx, 3) * 4); for (let y = 0; y < depth; y++) o.set(cx + x, cy + y, y < 3 ? (x > 0 ? [96, 152, 70] : [124, 186, 90]) : mix([146, 118, 92], [90, 76, 70], y / depth) );
      for (let y = 0; y < 2; y++) o.set(cx + x, cy + y - 2, [140, 206, 100]); }
    for (let i = 0; i < 5; i++) { const x = cx - w * .6 + i * w * .3, len = 6 + hash(i, cx, 5) * 14; for (let y = 0; y < len; y++) o.set(x, cy + 30 + y, [120, 140, 170], .6 - y / len * .5); }
    if (tw) { const tx = cx - 4, ty = cy - 3; o.rect(tx - 8, ty - 22, 16, 22, [244, 246, 250]); o.rect(tx + 2, ty - 22, 6, 22, [200, 210, 228]); o.poly([[tx - 10, ty - 22], [tx, ty - 38], [tx + 10, ty - 22]], [232, 184, 70], (x, y) => x > tx ? [196, 148, 50] : [240, 200, 90]); o.rect(tx - 2, ty - 16, 4, 6, [90, 130, 200]); o.rect(tx, ty - 44, 1, 8, [150, 110, 60]); o.poly([[tx + 1, ty - 44], [tx + 9, ty - 41], [tx + 1, ty - 38]], [92, 140, 226]); }
  };
  isle(96, 78, 52, true); isle(250, 62, 40, true); isle(340, 92, 32, false); isle(40, 100, 28, false);
  o.line(140, 82, 214, 66, [170, 134, 96]); o.line(140, 83, 214, 67, [110, 84, 60]); for (let i = 0; i <= 10; i++) { const x = 140 + i * 7.4, y = 82 - i * 1.6 + Math.sin(i / 10 * Math.PI) * 3; o.line(x, y, x, y - 4, [150, 112, 80]); }
  o.rect(0, 112, SW, 18, [255, 255, 255], .7); for (let i = 0; i < 12; i++) o.cloud(i * 36 + 10, 120 + (i % 3) * 3, 60, 14, [250, 252, 255], [206, 222, 240]);
  for (let i = 0; i < 5; i++) bird(o, 150 + i * 14 + hash(i, 1, 2) * 8, 24 + hash(i, 2, 2) * 20, [255, 255, 255]);
};
S.hollow = o => {
  o.sky([[0, '#0e0820'], [60, '#2c1850'], [92, '#6a3a98']]);
  for (let i = 0; i < 80; i++) o.set(hash(i, 1, 2) * SW, hash(i, 2, 2) * 80, [226, 210, 255], .35 + hash(i, 3, 2) * .6);
  /* the void: rings around a dark moon */
  const mx = 192, my = 38; for (let r = 46; r > 6; r -= 2) { const t = r / 46; for (let a = 0; a < 360; a += 2) { const x = mx + Math.cos(a * Math.PI / 180) * r * 1.3, y = my + Math.sin(a * Math.PI / 180) * r * .8; if (bay(Math.round(x), Math.round(y)) < t * .5) o.set(x, y, mix([200, 130, 255], [90, 40, 160], 1 - t), .45); } }
  o.disc(mx, my, 14, [14, 8, 28]); o.disc(mx, my, 14, [200, 140, 255], 0); for (let a = 0; a < 360; a++) { const x = mx + Math.cos(a * Math.PI / 180) * 15, y = my + Math.sin(a * Math.PI / 180) * 15; o.set(x, y, [226, 180, 255]); }
  [[-9, -16], [0, -19], [9, -16]].forEach(([dx, dy], i) => { o.poly([[mx + dx - 3, my + dy + 4], [mx + dx, my + dy - (i === 1 ? 6 : 3)], [mx + dx + 3, my + dy + 4]], [255, 214, 90]); });
  o.glow(mx, my, 44, [190, 120, 255], .25);
  o.ridge(92, 6, 44, 61, P('#241440'), P('#4a2c7a'), [P('#6a3a98'), .35]);
  const spire = (x, y, h, w) => { o.poly([[x - w, y], [x - w * .5, y - h * .7], [x, y - h], [x + w * .5, y - h * .7], [x + w, y]], [30, 18, 52], (px, py) => px > x ? [20, 12, 38] : [40, 26, 66]); o.line(x, y - h, x, y - h + 4, [200, 150, 255]); for (let k = 0; k < Math.floor(h / 14); k++) { o.rect(x - 1, y - 12 - k * 13, 2, 4, [200, 130, 255]); o.glow(x, y - 10 - k * 13, 6, [200, 130, 255], .3); } };
  [[40, 118, 70, 14], [96, 118, 46, 10], [286, 118, 84, 16], [340, 118, 54, 12], [150, 118, 36, 8]].forEach(a => spire(...a));
  /* floating shards */
  [[110, 52, 7], [270, 58, 9], [320, 40, 6], [60, 66, 5]].forEach(([x, y, s]) => { o.poly([[x, y - s], [x + s * .6, y], [x, y + s * 1.4], [x - s * .6, y]], [58, 38, 98], (px) => px > x ? [40, 26, 72] : [86, 58, 140]); o.line(x, y - s, x - s * .6, y, [190, 140, 255]); });
  /* the ground, and fog on it */
  o.ridge(120, 3, 30, 63, (x, y) => mix(P('#1a1030'), P('#0c0618'), Math.min(1, (y - 118) / 12)), P('#5a3a90'));
  for (let band = 0; band < 3; band++) { const by = 98 + band * 10; for (let y = by; y < by + 14; y++) for (let x = 0; x < SW; x++) { const n = vn(x + band * 70, 29 + band, 34), t = 1 - Math.abs(y - by - 7) / 7; if (n * t > .45 && bay(x, y) < (n * t - .25) * 1.3) o.set(x, y, [150, 100, 220], .22); } }
  for (let i = 0; i < 40; i++) { const x = hash(i, 1, 5) * SW, y = 70 + hash(i, 2, 5) * 52; o.set(x, y, [226, 190, 255], .6); }
};

/* ---------- build and use ---------- */
const cache = {};
DQ.sceneUrl = id => {
  const projects = DQ.S.projects || {};
  const stocked = DQ.S.q.first_steps && DQ.S.q.first_steps.s === 'done';
  const kitchen = DQ.S.q.hungry_cook && DQ.S.q.hungry_cook.s === 'done';
  const safe = DQ.S.towns[id] && DQ.S.towns[id].boss;
  const done = Object.keys(DQ.data.PROJECTS || {}).filter(k => DQ.data.PROJECTS[k].town === id && projects[k]).sort().join(',');
  const key = id + ':' + done + ':' + !!stocked + ':' + !!kitchen + ':' + !!safe;
  if (cache[key]) return cache[key]; if (!S[id]) return null;
  const o = pic(); try { S[id](o); } catch (e) { console.error('scene', id, e); return null; }
  if (safe) {
    o.rect(347, 75, 3, 35, P('#795039')); o.rect(350, 76, 17, 12, P('#82b957'));
    o.rect(353, 80, 9, 3, P('#eee1b0'));
  }
  if (id === 'willowbrook') {
    if (stocked) {
      o.rect(45, 104, 24, 9, P('#795039')); o.rect(49, 99, 17, 6, P('#b78a50'));
      o.rect(49, 104, 2, 9, P('#d5b47c')); o.rect(62, 104, 2, 9, P('#d5b47c'));
    }
    if (kitchen) {
      o.rect(163, 99, 13, 13, P('#a9793c')); o.rect(165, 102, 9, 2, P('#d9bd7a'));
      o.disc(190, 62, 3, P('#d7d6c3'), .6); o.disc(192, 56, 4, P('#d7d6c3'), .35);
    }
    if (projects.well) {
      o.rect(280, 95, 23, 16, P('#879697')); o.rect(283, 94, 17, 5, P('#66bdd0'));
      o.rect(278, 77, 3, 25, P('#765239')); o.rect(302, 77, 3, 25, P('#765239'));
      o.rect(275, 75, 33, 5, P('#a96943'));
    }
    if (projects.inn) {
      o.rect(175, 69, 4, 29, P('#795039')); o.rect(161, 71, 30, 15, P('#e2ba69'));
      o.rect(169, 76, 12, 6, P('#805139')); o.rect(180, 76, 3, 7, P('#805139'));
    }
    if (projects.watchtower) {   /* timber tower in the gap behind the fence, lantern lit */
      const x = 140; o.rect(x, 52, 2, 52, P('#6a4528')); o.rect(x + 12, 52, 2, 52, P('#5a3a22'));
      for (let y = 60; y < 100; y += 10) { o.line(x, y, x + 13, y + 9, P('#7a5230')); o.line(x + 13, y, x, y + 9, P('#6a4528')); }
      o.rect(x - 3, 46, 20, 7, P('#8a6038')); o.rect(x - 3, 46, 20, 1, P('#b08050')); o.poly([[x - 5, 46], [x + 7, 34], [x + 19, 46]], P('#8a3f30'));
      o.rect(x + 5, 48, 4, 3, P('#ffe08a')); o.glow(x + 7, 49, 9, [255, 224, 138], .45);
    }
    if (projects.library) {      /* stone reading room with warm windows */
      const x = 196, y = 84; o.rect(x, y, 30, 19, P('#a69f92')); for (let i = 0; i < 30; i += 5) o.rect(x + i, y, 1, 19, P('#8f887c'));
      o.rect(x, y + 6, 30, 1, P('#8f887c')); o.rect(x, y + 12, 30, 1, P('#8f887c'));
      o.poly([[x - 2, y + 1], [x + 15, y - 11], [x + 32, y + 1]], P('#4f5f72')); o.line(x - 2, y + 1, x + 15, y - 11, P('#6f8296'));
      o.rect(x + 4, y + 5, 5, 6, P('#ffd98a')); o.rect(x + 21, y + 5, 5, 6, P('#ffd98a')); o.rect(x + 12, y + 9, 6, 10, P('#5a3a22'));
      o.rect(x + 11, y - 3, 8, 3, P('#e8d8b0')); o.rect(x + 13, y - 2, 4, 1, P('#7a5230'));
    }
    if (projects.forge) {        /* smithy between the stream and the well, glowing hearth and smoke */
      const x = 250, y = 88; o.rect(x, y, 22, 15, P('#7a6a5a')); o.rect(x, y, 22, 2, P('#5a4a3e'));
      o.poly([[x - 2, y + 1], [x + 11, y - 7], [x + 24, y + 1]], P('#5a4a3e')); o.rect(x + 16, y - 10, 4, 8, P('#6a5a4e'));
      o.rect(x + 3, y + 5, 8, 10, P('#2a1a12')); o.rect(x + 4, y + 9, 6, 5, P('#ff8a3a')); o.rect(x + 5, y + 11, 4, 2, P('#ffd060')); o.glow(x + 7, y + 11, 10, [255, 150, 70], .45);
      o.rect(x + 13, y + 10, 7, 2, P('#3a3a42')); o.rect(x + 15, y + 12, 3, 3, P('#3a3a42'));
      for (let i = 0; i < 4; i++) o.disc(x + 18 + i, y - 13 - i * 4, 2 + i * .4, [200, 200, 200], .45 - i * .08);
    }
    if (projects.garden) {       /* vegetable beds and flowers on the common */
      for (let r = 0; r < 3; r++) { const y = 114 + r * 5; o.rect(80, y, 66, 3, P('#6a4528')); for (let x = 82; x < 144; x += 4) { o.set(x, y - 1, P(r === 1 ? '#e8c060' : '#5aa040')); o.set(x + 1, y - 2, P('#78c050')); if (r === 2 && x % 8 === 2) o.set(x, y - 2, P('#ff8aa0')); } }
      o.rect(78, 112, 1, 16, P('#7a5230')); o.rect(147, 112, 1, 16, P('#7a5230'));
    }
  } else if (done) {
    /* a restored regional town: bunting across the scene and one sign of the finished project */
    const tint = { mossbarrow: '#d8b050', saltmere: '#4fb3c8', ironpeak: '#c8d0d8', gloomfen: '#c8ff8a', emberfall: '#ff8a3a', skyreach: '#f0c040', hollow: '#c07aff' }[id] || '#d8a64a';
    for (let x = 12; x < 150; x++) { const y = 18 + Math.round(Math.sin((x - 12) / 138 * Math.PI) * 9); o.set(x, y, P('#5a4a3e')); if ((x - 12) % 10 === 0) o.poly([[x, y], [x + 6, y], [x + 3, y + 6]], P((x / 10) % 2 ? tint : '#f4efe4')); }
    const bx = 14, by = 112;
    if (projects.market) { o.rect(bx, by, 26, 10, P('#8a6038')); for (let i = 0; i < 26; i += 4) o.rect(bx + i, by - 6, 4, 6, P(i % 8 ? '#f4efe4' : '#c84a3a')); o.rect(bx + 3, by + 2, 5, 3, P('#e8c060')); o.rect(bx + 12, by + 2, 5, 3, P('#78c050')); }
    if (projects.jetty) { o.rect(bx, by + 2, 12, 9, P('#8a6038')); o.rect(bx + 13, by + 4, 10, 7, P('#7a5230')); o.disc(bx + 30, by + 8, 3, P('#c8a060')); o.rect(bx, by + 2, 12, 1, P('#b08050')); }
    if (projects.hearth) { o.rect(bx + 4, by + 4, 14, 6, P('#5a5a62')); o.rect(bx + 7, by, 8, 4, P('#ff8a3a')); o.rect(bx + 9, by - 3, 4, 3, P('#ffd060')); o.glow(bx + 11, by + 1, 12, [255, 150, 70], .45); }
    if (projects.lanterns) for (let k = 0; k < 3; k++) { const x = bx + k * 14; o.rect(x, by - 10, 1, 20, P('#3a3046')); o.rect(x - 2, by - 13, 5, 4, P('#e8ffb0')); o.glow(x, by - 11, 8, [220, 255, 170], .5); }
    if (projects.cistern) { o.ell(bx + 13, by + 6, 12, 5, P('#7a6a5a')); o.ell(bx + 13, by + 5, 9, 3, P('#5ab0d0')); o.set(bx + 10, by + 4, P('#d8f0f8')); }
    if (projects.bridge) for (let k = 0; k < 5; k++) o.rect(bx + k * 6, by - 4, 4, 6, P(['#d84a3a', '#f0c040', '#4fb3c8', '#f4efe4', '#78c050'][k]));
    if (projects.refuge) { o.poly([[bx, by + 10], [bx + 14, by - 6], [bx + 28, by + 10]], P('#5a4880')); o.rect(bx + 11, by + 2, 6, 8, P('#ffd98a')); o.glow(bx + 14, by + 5, 10, [255, 217, 138], .4); }
  }
  const cv = document.createElement('canvas'); cv.width = SW; cv.height = SH; cv.getContext('2d').putImageData(new ImageData(o.d, SW, SH), 0, 0);
  return (cache[key] = cv.toDataURL());
};
const prev = UI.scene;
UI.scene = (id, cls = '') => { const u = DQ.sceneUrl(id); return u ? `<img class="scene pxscene ${cls}" src="${u}" alt="" draggable="false">` : prev(id, cls); };
})();
