/* Idlewick: the hi-res pass.
   Every sprite in the game is still drawn on a small grid (that is what keeps it consistent), but it is now rendered at twice the
   resolution: diagonals are smoothed (Scale2x), the outline is thinned to a single fine line, and a light from the top left gives
   each shape rim light and shade. The same artwork at 48x48 instead of 24x24, so it stays sharp when it is shown large. */
(() => {
const DQ = window.DQ;
const hexRgb = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
const OUTLINES = ['#1a1310', '#1c1410', '#120c08'];

/* source canvas (w x h, small pixel art) -> canvas (2w x 2h) */
DQ.hiRes = (src, opt = {}) => {
  const w = src.width, h = src.height, W = w * 2, H = h * 2;
  const sd = src.getContext('2d').getImageData(0, 0, w, h).data;
  /* palette ids so comparisons are cheap and exact */
  const id = new Int32Array(w * h), cols = [[0, 0, 0, 0]], map = new Map([['0,0,0,0', 0]]);
  for (let i = 0; i < w * h; i++) {
    const a = sd[i * 4 + 3]; if (a < 128) { id[i] = 0; continue; }
    const k = sd[i * 4] + ',' + sd[i * 4 + 1] + ',' + sd[i * 4 + 2] + ',255';
    if (!map.has(k)) { map.set(k, cols.length); cols.push([sd[i * 4], sd[i * 4 + 1], sd[i * 4 + 2], 255]); }
    id[i] = map.get(k);
  }
  const olSet = new Set(); (opt.ol || OUTLINES).forEach(hx => { const c = hexRgb(hx); const k = c[0] + ',' + c[1] + ',' + c[2] + ',255'; if (map.has(k)) olSet.add(map.get(k)); });
  const at = (x, y) => (x < 0 || y < 0 || x >= w || y >= h) ? 0 : id[y * w + x];
  /* 1. Scale2x: rounds the staircase without inventing colours */
  const big = new Int32Array(W * H);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const P = at(x, y), A = at(x, y - 1), B = at(x + 1, y), C = at(x - 1, y), D = at(x, y + 1);
    let e0 = P, e1 = P, e2 = P, e3 = P;
    if (A !== D && C !== B) {
      if (C === A) e0 = A; if (A === B) e1 = B; if (D === C) e2 = C; if (B === D) e3 = D;
    }
    big[(2 * y) * W + 2 * x] = e0; big[(2 * y) * W + 2 * x + 1] = e1; big[(2 * y + 1) * W + 2 * x] = e2; big[(2 * y + 1) * W + 2 * x + 1] = e3;
  }
  const g = (x, y) => (x < 0 || y < 0 || x >= W || y >= H) ? 0 : big[y * W + x];
  const isOl = v => olSet.has(v);
  /* 2. thin the outline: of a two-pixel band only the outermost line stays */
  const out = new Int32Array(big);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const v = big[y * W + x]; if (!isOl(v)) continue;
    const n = [g(x, y - 1), g(x, y + 1), g(x - 1, y), g(x + 1, y)];
    if (n.some(q => q === 0)) continue;                       /* touches the outside: it is the line */
    const far = [g(x, y - 2), g(x, y + 2), g(x - 2, y), g(x + 2, y)];
    if (!far.some(q => q === 0)) continue;                    /* an inner detail line: keep */
    const body = n.concat(far).filter(q => q && !isOl(q));
    if (body.length) out[y * W + x] = body[0];
  }
  /* 3. light from the top left: rim light on lit edges, shade on the far edges */
  const o = (x, y) => (x < 0 || y < 0 || x >= W || y >= H) ? 0 : out[y * W + x];
  const edge = (x, y) => { const v = o(x, y); return v === 0 || isOl(v); };
  const cv = document.createElement('canvas'); cv.width = W; cv.height = H; const cx = cv.getContext('2d'), im = cx.createImageData(W, H), d = im.data;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const v = out[y * W + x]; if (!v) continue; const c = cols[v]; let r = c[0], gg = c[1], b = c[2];
    if (!isOl(v)) {
      let hi = 0, lo = 0;
      if (edge(x - 2, y - 2)) hi += .17; else if (edge(x - 4, y - 4)) hi += .07;
      if (edge(x - 2, y) && edge(x, y - 2)) hi += .05;
      if (edge(x + 2, y + 2)) lo += .2; else if (edge(x + 4, y + 4)) lo += .09;
      if (edge(x + 2, y) && edge(x, y + 2)) lo += .05;
      if (hi > lo) { const t = Math.min(.3, hi - lo * .5); r += (255 - r) * t; gg += (255 - gg) * t; b += (255 - b) * t; }
      else if (lo > 0) { const t = Math.min(.34, lo - hi * .5); r *= 1 - t; gg *= 1 - t; b *= 1 - t; }
    }
    const i = (y * W + x) * 4; d[i] = r; d[i + 1] = gg; d[i + 2] = b; d[i + 3] = 255;
  }
  cx.putImageData(im, 0, 0); return cv;
};
})();
