/* Idlewick: the world map as pixel art. Terrain is generated on a 196x100 grid, one cell per 5 map units. */
(() => {
const DQ = window.DQ, D = DQ.data, UI = DQ.ui, { esc } = DQ;
const W = 196, H = 100, CELL = 5;
const T = DQ.SPRITES;
T.village = ['................', '................', '.......kk.......', '......kppk......', '.....kppppk.....', '....kppppppk....', '...kppppppppk...', '..kkkkkkkkkkkk..', '...kwwwwwwwwk...', '...kwyywwyywk...', '...kwyywwyywk...', '...kwwwkkwwwk...', '...kwwwkbkwwk...', '...kwwwkbkwwk...', '..kkkkkkkkkkkk..', '................'];
T.tower = ['......kkkk......', '.....kppppk.....', '....kppppppk....', '....kkkkkkkk....', '.....kwwwwk.....', '.....kwyywk.....', '.....kwwwwk.....', '.....kwwwwk.....', '.....kwyywk.....', '.....kwwwwk.....', '.....kwwwwk.....', '....kwwkkwwk....', '....kwwkbkwk....', '...kkwwkbkwkk...', '...kkkkkkkkkk...', '................'];
T.castle = ['................', '.k.k.k....k.k.k.', '.kkkkk....kkkkk.', '.kwwwk.kk.kwwwk.', '.kwywkkppkkwywk.', '.kwwwkppppkwwwk.', '.kwwkkkkkkkkwwk.', '.kwwwwwwwwwwwwk.', '.kwywwwwwwwwywk.', '.kwwwwkkkkwwwwk.', '.kwwwkbbbbkwwwk.', '.kwwwkbbbbkwwwk.', '.kwwwkbbbbkwwwk.', 'kkkkkkkkkkkkkkkk', '................', '................'];
const TOWN_SPR = { willowbrook: 'village', mossbarrow: 'village', saltmere: 'tower', ironpeak: 'castle', gloomfen: 'tower', emberfall: 'castle', skyreach: 'tower', hollow: 'castle' };
const BIOME = {
  willowbrook: { g: ['#5f9a4a', '#6aa852', '#548c42'], feat: 'tree' },
  mossbarrow: { g: ['#9cb050', '#b8a858', '#8aa448'], feat: 'field' },
  saltmere: { g: ['#7fae6a', '#8ab874', '#729f5f'], feat: 'tree' },
  ironpeak: { g: ['#7a8794', '#8a96a2', '#6a7480'], feat: 'mountain' },
  gloomfen: { g: ['#4a5a48', '#3f4a40', '#55506a'], feat: 'deadtree', water: '#2a3a4a' },
  emberfall: { g: ['#5a3a30', '#4a2e28', '#6a4030'], feat: 'lava' },
  skyreach: { g: ['#c8d8e8', '#dfe9f2', '#b8cadb'], feat: 'cloud' },
  hollow: { g: ['#4a3a6a', '#3a2e58', '#5a4880'], feat: 'spire' },
};
const hash = (x, y, s = 1) => { let h = (x * 374761393 + y * 668265263 + s * 982451653) | 0; h = (h ^ (h >>> 13)) * 1274126177 | 0; return ((h ^ (h >>> 16)) >>> 0) / 4294967295; };
const noise = (x, y, sc, s) => { const X = x / sc, Y = y / sc, xi = Math.floor(X), yi = Math.floor(Y), xf = X - xi, yf = Y - yi, sm = t => t * t * (3 - 2 * t);
  const a = hash(xi, yi, s), b = hash(xi + 1, yi, s), c = hash(xi, yi + 1, s), d = hash(xi + 1, yi + 1, s), u = sm(xf), v = sm(yf); return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v; };
const mix = (h, t, a) => { const p = s => [1, 3, 5].map(i => parseInt(s.slice(i, i + 2), 16)); const A = p(h), B = p(t); return '#' + A.map((v, i) => Math.round(v + (B[i] - v) * a).toString(16).padStart(2, '0')).join(''); };
let base = null; const cache = {};

function buildBase() {
  const cv = document.createElement('canvas'); cv.width = W; cv.height = H; const x = cv.getContext('2d');
  const land = new Path2D(UI.MAP_LAND); x.setTransform(1 / CELL, 0, 0, 1 / CELL, 0, 0);
  const isLand = new Uint8Array(W * H); for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) isLand[j * W + i] = x.isPointInPath(land, i + .5, j + .5) ? 1 : 0;
  x.setTransform(1, 0, 0, 1, 0, 0);
  const L = (i, j) => i >= 0 && j >= 0 && i < W && j < H && isLand[j * W + i];
  const biomeAt = (i, j) => { let best = null, bd = 1e9; const ox = (noise(i, j, 9, 7) - .5) * 30, oy = (noise(i, j, 9, 8) - .5) * 30; for (const t of D.TOWNS) { const d = (t.x / CELL - i - ox / CELL * 2) ** 2 + (t.y / CELL - j - oy / CELL * 2) ** 2; if (d < bd) { bd = d; best = t.id; } } return best; };
  const bio = []; const px = (i, j, c) => { x.fillStyle = c; x.fillRect(i, j, 1, 1); };
  for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) {
    if (!L(i, j)) { const n = noise(i, j, 6, 3), deep = Math.min(1, (Math.min(i, j, W - 1 - i, H - 1 - j)) / 10); let c = mix('#123440', '#1d4a5a', deep * .7 + n * .3); if (hash(i, j, 5) > .985) c = '#3f7f8f'; if (L(i + 1, j) || L(i - 1, j) || L(i, j + 1) || L(i, j - 1)) c = '#2a6272'; px(i, j, c); continue; }
    const b = biomeAt(i, j), B = BIOME[b]; bio[j * W + i] = b;
    const n = noise(i, j, 5, 11), g = B.g[n < .38 ? 2 : n > .66 ? 1 : 0];
    const coast = !L(i + 1, j) || !L(i - 1, j) || !L(i, j + 1) || !L(i, j - 1);
    let c = coast ? (b === 'emberfall' || b === 'hollow' ? '#2a2026' : b === 'skyreach' ? '#eef4fa' : '#e3cf94') : g;
    if (!coast && B.feat === 'field') c = (Math.floor(i / 4) + Math.floor(j / 3)) % 2 ? B.g[0] : B.g[1];
    if (!coast && B.water && noise(i, j, 4, 21) > .68) c = B.water;
    if (!coast && B.feat === 'lava' && noise(i, j, 3, 31) > .78) c = hash(i, j, 2) > .5 ? '#ff7a2a' : '#e8502a';
    if (!coast && b === 'ironpeak' && noise(i, j, 7, 41) > .7) c = '#eef3f7';
    px(i, j, c);
  }
  /* small features */
  const stamp = (i, j, rows, pal) => rows.forEach((r, dy) => [...r].forEach((ch, dx) => { if (pal[ch]) px(i + dx, j + dy, pal[ch]); }));
  const SPR = {
    tree: [['.g.', 'ggg', '.b.'], { g: '#2f6a34', b: '#5a3a20' }], deadtree: [['k.k', '.k.', '.k.'], { k: '#1c1a24' }],
    mountain: [['..w..', '.wkk.', 'kkkdd', 'kkddd'], { w: '#f4f7fa', k: '#5a6470', d: '#46505c' }], cloud: [['.ww.', 'wwww'], { w: '#ffffff' }],
    spire: [['.p.', '.p.', 'ppp'], { p: '#24183a' }], lava: [['.r.', 'rkr'], { r: '#ff8a3a', k: '#2a1512' }], field: [['y.y'], { y: '#e8d070' }],
  };
  for (let j = 2; j < H - 4; j += 3) for (let i = 2; i < W - 5; i += 3) {
    const b = bio[j * W + i]; if (!b || !L(i - 1, j) || !L(i + 4, j + 4)) continue;
    const near = D.TOWNS.some(t => Math.abs(t.x / CELL - i) < 7 && Math.abs(t.y / CELL - j) < 6); if (near) continue;
    const f = BIOME[b].feat, r = hash(i, j, 9); const dens = { tree: .22, deadtree: .12, mountain: .16, cloud: .1, spire: .07, lava: .08, field: .08 }[f];
    if (r < dens) stamp(i + Math.floor(hash(i, j, 4) * 2), j, ...SPR[f]);
  }
  /* frame */
  x.strokeStyle = '#0b0f12'; x.lineWidth = 1; x.strokeRect(.5, .5, W - 1, H - 1);
  return cv;
}
function bez(a, b, t) { const dx = (b.x - a.x) * .55, p0 = [a.x, a.y], p1 = [a.x + dx, a.y], p2 = [b.x - dx, b.y], p3 = [b.x, b.y], u = 1 - t; return [0, 1].map(k => u * u * u * p0[k] + 3 * u * u * t * p1[k] + 3 * u * t * t * p2[k] + t * t * t * p3[k]); }
function mapImage() {
  const key = D.TOWNS.map(t => DQ.townUnlocked(t.id) ? 1 : 0).join('');
  if (cache[key]) return cache[key];
  if (!base) base = buildBase();
  const cv = document.createElement('canvas'); cv.width = W; cv.height = H; const x = cv.getContext('2d'); x.drawImage(base, 0, 0);
  /* roads: chunky dotted paths */
  D.TOWNS.slice(0, -1).forEach((t, i) => {
    const open = DQ.townUnlocked(D.TOWNS[i + 1].id); let last = null;
    for (let s = 0; s <= 120; s++) {
      const [px, py] = bez(t, D.TOWNS[i + 1], s / 120), ci = Math.floor(px / CELL), cj = Math.floor(py / CELL), k = ci + ',' + cj; if (k === last) continue; last = k;
      if (open) { x.fillStyle = '#3a2412'; x.fillRect(ci, cj + 1, 1, 1); x.fillStyle = (ci + cj) % 2 ? '#e8c98a' : '#c89a5a'; x.fillRect(ci, cj, 1, 1); }
      else if ((ci + cj) % 2 === 0) { x.fillStyle = 'rgba(30,22,16,.7)'; x.fillRect(ci, cj, 1, 1); }
    }
  });
  /* fog over towns you have not reached: a dithered shroud */
  D.TOWNS.forEach(t => {
    if (DQ.townUnlocked(t.id)) return; const cx = t.x / CELL, cy = t.y / CELL;
    for (let j = Math.floor(cy - 15); j <= cy + 15; j++) for (let i = Math.floor(cx - 17); i <= cx + 17; i++) {
      const d = Math.hypot((i - cx) / 17, (j - cy) / 15); if (d > 1 || i < 0 || j < 0 || i >= W || j >= H) continue;
      if (d < .6 || (i + j) % 2 === 0 || (d < .85 && (i * 3 + j) % 4 !== 0)) { x.fillStyle = d < .6 ? 'rgba(10,14,18,.78)' : 'rgba(10,14,18,.55)'; x.fillRect(i, j, 1, 1); }
    }
  });
  return (cache[key] = cv.toDataURL());
}
UI.mapSVG = sel => {
  const cur = DQ.S.town, ct = D.TOWN[cur], L = DQ.S.look, eq = DQ.S.equip, I = D.ITEMS;
  const segs = D.TOWNS.slice(0, -1).map((t, i) => { const b = D.TOWNS[i + 1], dx = (b.x - t.x) * .55; return `<path id="seg${i}" d="M${t.x} ${t.y}C${t.x + dx} ${t.y} ${b.x - dx} ${b.y} ${b.x} ${b.y}" fill="none" stroke="none"/>`; }).join('');
  const towns = D.TOWNS.map(t => {
    const open = DQ.townUnlocked(t.id), boss = DQ.S.towns[t.id] && DQ.S.towns[t.id].boss, isSel = t.id === sel, isCur = t.id === cur;
    const spr = DQ.spr24Url('town_' + t.id);
    return `<g class="mt ${open ? '' : 'locked'} ${isSel ? 'sel' : ''}" transform="translate(${t.x} ${t.y})" data-do="mapsel" data-a="${t.id}" tabindex="0" role="button" aria-label="${esc(t.name)}${open ? '' : ', locked'}">
      <rect x="-26" y="-26" width="52" height="52" fill="transparent"/>
      ${isSel ? `<g class="selbr" fill="#f3d58a"><rect x="-30" y="-30" width="12" height="4"/><rect x="-30" y="-30" width="4" height="12"/><rect x="18" y="-30" width="12" height="4"/><rect x="26" y="-30" width="4" height="12"/><rect x="-30" y="26" width="12" height="4"/><rect x="-30" y="18" width="4" height="12"/><rect x="18" y="26" width="12" height="4"/><rect x="26" y="18" width="4" height="12"/></g>` : ''}
      <image href="${spr}" x="-24" y="-34" width="48" height="48" class="pxsvg ${open ? '' : 'dimmed'}"/>
      ${open ? '' : `<g style="color:#f3e6c0"><use href="#i-lock" x="-9" y="-6" width="18" height="18"/></g>`}
      <text y="44" text-anchor="middle" class="ml">${open ? esc(t.name) : '???'}</text>
      <text y="62" text-anchor="middle" class="ms">${open ? (boss ? '★ Boss defeated' : 'Boss awaits') : 'Unknown road'}</text>
      ${isCur ? `<rect x="-24" y="20" width="48" height="4" fill="#f3d58a" class="curbar"/>` : ''}</g>`;
  }).join('');
  const hero = DQ.heroUrl(L, eq.body ? I[eq.body].col : L.tunic, eq.head ? I[eq.head].col : undefined);
  return `<svg class="map pxmap" viewBox="0 0 980 500" role="group" aria-label="World map"><image href="${mapImage()}" width="980" height="500" preserveAspectRatio="none" class="pxsvg"/>${segs}${towns}
    <g id="hero-pin" transform="translate(${ct.x} ${ct.y - 40})" class="pin"><image href="${hero}" x="-24" y="-40" width="48" height="48" class="pxsvg bobsvg"/></g></svg>`;
};
})();
