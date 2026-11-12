/* The ranch (Nov 2026): pixel art for the Beastmastery page, drawn in code like everything else (docs/pixel-art-style.md:
   top-left light, hue-shifted ramps, selective outlines, whole-number scales). Each owned beast lives in a pen:
   fenced grass with a hut roofed in the beast's own colour, a hay bale, a water trough and a log hurdle to train over.
   A pen is two images, 96 x 64 logical pixels each: the back (ground, hut, props, back fence) and the front fence, so
   the beast can stand between them. A backdrop strip (barn, hills, trees) sits above the pens. */
(() => {
const Q = window.DQ, A = Q.pixelArt; if (!A || !A.townPainter) return;
const { mix } = A, seeded = A.townSeeded;
const PW = 96, PH = 64;
const post = (f, x, y0, y1, wood) => { f(mix(wood, '#000000', .35), x, y0, 3, y1 - y0); f(wood, x, y0, 2, y1 - y0); f(mix(wood, '#ffffff', .28), x, y0, 1, y1 - y0); f(mix(wood, '#ffffff', .4), x - 1, y0 - 1, 4, 1); };
const rail = (f, x0, x1, y, wood) => { f(mix(wood, '#000000', .3), x0, y + 2, x1 - x0, 1); f(wood, x0, y, x1 - x0, 2); f(mix(wood, '#ffffff', .25), x0, y, x1 - x0, 1); };
/* the back of a pen: ground, hut, hay, trough, hurdle and the back fence */
A.penBack = (id, col = '#a08060') => {
  const rnd = seeded('pen:' + id), c = A.townMake(PW, PH), x = c.getContext('2d'), P = A.townPainter(x, PW, PH), { f, ell, tri } = P;
  const g = '#6aa244', gd = mix(g, '#1e3a14', .3), gl = mix(g, '#ffffff', .22), dirt = '#b49264', wood = '#8a6a42';
  f(g, 0, 0, PW, PH); f(gl, 0, 0, PW, 1);
  for (let i = 0; i < 70; i++) f(i % 3 ? gd : gl, Math.floor(rnd() * PW), 12 + Math.floor(rnd() * (PH - 12)), 1 + (i % 2), 1);
  ell(mix(dirt, '#000000', .12), 48, 41, 31, 13); ell(dirt, 47, 40, 29, 11); ell(mix(dirt, '#ffffff', .18), 44, 37, 14, 5);
  for (let i = 0; i < 22; i++) f(mix(dirt, '#000000', .22), 22 + Math.floor(rnd() * 52), 32 + Math.floor(rnd() * 16), 2, 1);
  /* back fence */
  rail(f, 0, PW, 9, wood); rail(f, 0, PW, 14, wood); for (let px = 1; px < PW; px += 16) post(f, px, 5, 20, wood);
  /* hut, roofed in the beast's colour */
  const roof = mix(col, '#3a2414', .15), wall = '#d8c49a';
  f(mix(wall, '#000000', .3), 7, 22, 26, 2); f(wall, 8, 12, 24, 11); f(mix(wall, '#ffffff', .25), 8, 12, 1, 11); f(mix(wall, '#000000', .2), 28, 12, 4, 11);
  for (let j = 0; j < 8; j++) { const inset = 7 - j; f(mix(roof, '#ffffff', j % 3 === 0 ? .2 : 0), 6 + inset, 4 + j, 28 - inset * 2, 1); } f(mix(roof, '#000000', .4), 6, 12, 28, 1);
  f('#3a2a20', 15, 16, 9, 7); f('#1e1612', 16, 17, 7, 6); f(mix(wall, '#000000', .4), 14, 15, 11, 1);
  /* hay bale */
  const hay = '#e6c660'; f(mix(hay, '#000000', .35), 64, 25, 20, 2); f(hay, 64, 15, 20, 10); f(mix(hay, '#ffffff', .3), 64, 15, 20, 2); f(mix(hay, '#000000', .25), 64, 19, 20, 1); f(mix(hay, '#000000', .25), 64, 22, 20, 1); f('#8a6a42', 70, 15, 1, 10); f('#8a6a42', 77, 15, 1, 10);
  for (let i = 0; i < 9; i++) f(hay, 62 + Math.floor(rnd() * 24), 25 + Math.floor(rnd() * 3), 2, 1);
  /* trough with water */
  f(mix(wood, '#000000', .4), 66, 49, 22, 3); f(wood, 66, 43, 22, 7); f(mix(wood, '#ffffff', .25), 66, 43, 22, 1); f('#5a9ad0', 68, 45, 18, 3); f('#9cd0f0', 70, 45, 6, 1); f(mix(wood, '#000000', .25), 66, 43, 1, 7);
  /* log hurdle to train over */
  f(mix(wood, '#000000', .3), 8, 43, 3, 9); f(wood, 8, 43, 2, 9); f(mix(wood, '#000000', .3), 26, 43, 3, 9); f(wood, 26, 43, 2, 9);
  f(mix('#7a5236', '#000000', .35), 7, 41, 24, 4); f('#7a5236', 7, 40, 24, 4); f(mix('#7a5236', '#ffffff', .25), 7, 40, 24, 1); f('#d8b878', 7, 41, 2, 2); f('#d8b878', 29, 41, 2, 2);
  return c;
};
/* the front fence: low rails and posts, drawn over the beast's feet */
A.penFront = () => {
  const c = A.townMake(PW, PH), x = c.getContext('2d'), P = A.townPainter(x, PW, PH), { f } = P, wood = '#8a6a42';
  rail(f, 0, PW, 55, wood); rail(f, 0, PW, 59, wood); for (let px = 1; px < PW; px += 16) post(f, px, 51, 64, wood);
  post(f, 0, 9, 55, wood); post(f, PW - 3, 9, 55, wood);
  return c;
};
/* the ranch strip above the pens: barn, hills, trees and a long fence (330 x 30) */
A.ranchStrip = () => {
  const W = 330, H = 30, c = A.townMake(W, H), x = c.getContext('2d'), P = A.townPainter(x, W, H), { f, ell } = P, rnd = seeded('ranch');
  f('#a8d8ec', 0, 0, W, 12); f('#bfe2ee', 0, 12, W, 8); f('#cbe8ef', 0, 20, W, 10);
  for (const [cx, cy, w] of [[40, 5, 24], [180, 3, 30], [270, 8, 20]]) { f('#ffffff', cx, cy, w, 3); f('#ffffff', cx + 4, cy - 2, w - 8, 2); }
  for (let i = 0; i < W; i++) { const y = Math.round(16 + Math.sin(i / 20) * 3 + Math.sin(i / 7) * 1); f('#8cbf74', i, y, 1, H - y); }
  for (let i = 0; i < W; i++) { const y = Math.round(21 + Math.sin(i / 14 + 2) * 2); f('#79b04f', i, y, 1, H - y); }
  /* barn */
  const bx = 232; f('#7a2a24', bx, 9, 32, 16); f('#a84a3a', bx, 9, 2, 16); f('#5a1c18', bx + 28, 9, 4, 16);
  for (let j = 0; j < 8; j++) { const inset = 7 - j; f(j % 2 ? '#4a3a34' : '#5a4a42', bx - 3 + inset, 1 + j, 38 - inset * 2, 1); }
  f('#e8dcc0', bx + 10, 12, 12, 13); f('#3a2a20', bx + 12, 14, 8, 11); f('#e8dcc0', bx + 15, 14, 2, 11); f('#e8dcc0', bx + 12, 17, 8, 1); f('#2a2830', bx + 14, 5, 4, 3);
  /* trees */
  for (const tx of [18, 62, 118, 150, 205, 310]) { f('#5a3a26', tx, 15, 2, 8); ell('#3f7a3c', tx + 1, 12, 7, 6); ell('#5f9a45', tx, 10, 5, 4); ell('#9cc45a', tx - 2, 8, 2, 1.5); }
  /* the long fence across the front */
  const wood = '#8a6a42'; rail(f, 0, W, 24, wood); for (let px = 2; px < W; px += 14) post(f, px, 21, 30, wood);
  for (let i = 0; i < 40; i++) f(['#f0d060', '#e0607a', '#f4f0f4'][i % 3], Math.floor(rnd() * W), 26 + Math.floor(rnd() * 4), 1, 1);
  return c;
};
const dataUrl = (key, make) => { const cache = (A._ranch = A._ranch || {}); if (cache[key]) return cache[key]; const c = make(); return cache[key] = c.toDataURL(); }; /* native size: shown at whole-number multiples (2x, 3x) so the pixels stay square */
A.penBackUrl = (id, col) => dataUrl('b:' + id + col, () => A.penBack(id, col));
A.penFrontUrl = () => dataUrl('front', () => A.penFront());
A.ranchStripUrl = () => dataUrl('strip', () => A.ranchStrip());
A.PEN_W = PW; A.PEN_H = PH;
})();
