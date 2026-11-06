/* Idlewick pixel art: trees, rocks, town scenes with their restoration projects, furniture, the cottage, workers and
   the skill and menu icons, all in the house style (docs/pixel-art-style.md). */
(() => {
const DQ = window.DQ, D = DQ.data, A = DQ.pixelArt; if (!A) return;
const { Spr, ramp, mix, R } = A;
const rp = c => ramp(c || '#999999');

/* ================= Trees (32 x 48): nine species ================= */
const TREE = {
  normal: { kind: 'round', leaf: '#5f9a45', deep: '#3f7a3c', bark: '#7a5236' },
  oak: { kind: 'oak' },
  willow: { kind: 'willow', leaf: '#8ab06a', deep: '#5f8a4a', bark: '#6a6a4a' },
  maple: { kind: 'round', leaf: '#d8703a', deep: '#a8482a', bark: '#6a4630', fall: '#f0a050' },
  yew: { kind: 'cone', leaf: '#2f6650', deep: '#204a3a', bark: '#4a3a30', berries: '#e0405a' },
  magic: { kind: 'round', leaf: '#8a76c8', deep: '#5a4a96', bark: '#4a3a7a', sparkle: '#f0e6ff' },
  birch: { kind: 'tall', leaf: '#9cc45a', deep: '#6f9a42', bark: '#ece6d4', marks: '#3a3a3a' },
  elder: { kind: 'gnarled', leaf: '#b8d890', deep: '#88a868', bark: '#a8a890' },
  gloomwood: { kind: 'gnarled', leaf: '#5a4a7a', deep: '#3a2e5a', bark: '#3a2a4a', sparkle: '#b88aff' }
};
function treeSprite(id) {
  const t = TREE[id] || TREE.normal; if (t.kind === 'oak') return A.sprites.oak();
  const s = Spr(32, 48), L = rp(t.leaf), Dp = rp(t.deep), bark = rp(t.bark);
  if (t.kind === 'cone') { s.rect(15, 38, 3, 9, bark); [[16, 5, 6, 18], [16, 12, 9, 28], [16, 20, 11, 39]].forEach(([cx, top, half, bot], i) => s.poly([[cx, top], [cx + half, bot], [cx - half, bot]], i % 2 ? Dp : L)); }
  else if (t.kind === 'willow') { s.poly([[14, 46], [18, 46], [17, 22], [15, 22]], bark); s.ell(16, 16, 11, 9, L); for (let x = 6; x <= 26; x += 2) s.line(x, 18, x + (x < 16 ? -1 : 1), 34 - Math.abs(x - 16) * .5, (x / 2) % 2 ? L : Dp); }
  else if (t.kind === 'tall') { s.rect(14, 16, 4, 31, bark); [[16, 12, 7, 9, L], [12, 20, 4, 5, Dp], [20, 22, 4, 5, Dp], [16, 9, 5, 6, L]].forEach(([x, y, rx, ry, r]) => s.ell(x, y, rx, ry, r)); for (let y = 20; y < 46; y += 4) s.fix(14 + (y % 8 ? 0 : 2), y, t.marks); }
  else if (t.kind === 'gnarled') { for (let y = 46; y > 22; y--) { const x = 16 + Math.round(Math.sin(y / 4) * 2); s.dot(x, y, bark); s.dot(x + 1, y, bark); s.dot(x + 2, y, bark); } s.line(17, 26, 9, 18, bark); s.line(17, 24, 25, 17, bark); [[10, 15, 6, 4.4], [23, 14, 6, 4.4], [16, 10, 7, 5.4]].forEach(([x, y, rx, ry], i) => s.ell(x, y, rx, ry, i === 2 ? L : Dp)); }
  else { s.poly([[13, 46], [19, 46], [18, 26], [14, 26]], bark); [[16, 15, 10, 9, Dp], [16, 12, 8.5, 7, L], [9, 18, 5, 4.4, L], [23, 17, 5.5, 4.6, L]].forEach(([x, y, rx, ry, r]) => s.ell(x, y, rx, ry, r)); }
  [[12, 9], [19, 8], [22, 14], [9, 15]].forEach(([x, y]) => { if (s.at(x, y)) { s.fix(x, y, L.gl); } });
  if (t.fall) [[8, 26], [24, 30], [12, 40]].forEach(([x, y]) => s.fix(x, y, t.fall));
  if (t.berries) [[12, 22], [20, 26], [15, 32], [10, 35]].forEach(([x, y]) => s.fix(x, y, t.berries));
  if (t.sparkle) [[10, 10], [22, 9], [16, 4], [26, 18]].forEach(([x, y]) => s.fix(x, y, t.sparkle));
  return s;
}

/* ================= Rocks (32 x 32): one formation per ore ================= */
function rockSprite(id) { const s = Spr(32, 32); A.drawOre(s, id, 2); return s; }

/* ================= Restoration pieces (32 x 32): broken and restored ================= */
function piece(kind, done) {
  const s = Spr(32, 32), wood = done ? R.wood : rp('#6a5a4a'), stone = done ? R.stone : rp('#6e6a66');
  const rubble = () => [[6, 29], [10, 30], [23, 29], [26, 30]].forEach(([x, y]) => s.ell(x, y, 1.6, 1.2, stone));
  const house = (wall, roof, sign) => { s.rect(6, 14, 20, 15, done ? rp(wall) : rp(mix(wall, '#4a4040', .4))); s.poly(done ? [[3, 15], [16, 4], [29, 15]] : [[3, 15], [10, 9], [14, 12], [18, 8], [29, 15]], done ? rp(roof) : rp(mix(roof, '#3a3030', .45))); s.rect(13, 20, 6, 9, wood); if (done) { s.rect(8, 17, 3, 3, ramp('#f6d880')); s.rect(21, 17, 3, 3, ramp('#f6d880')); } else { s.line(8, 17, 11, 21, null, '#2a2020'); s.line(21, 18, 24, 21, null, '#2a2020'); } if (sign && done) { s.rect(24, 10, 6, 4, R.woodLight); s.fix(26, 12, sign); } };
  switch (kind) {
    case 'well': s.ell(16, 24, 9, 4, stone); s.rect(7, 20, 18, 5, stone); s.ell(16, 20, 7, 2, rp(done ? '#3a6ea0' : '#3a3030')); if (done) { s.rect(8, 8, 2, 12, wood); s.rect(22, 8, 2, 12, wood); s.poly([[5, 9], [16, 3], [27, 9]], R.straw); s.line(16, 9, 16, 15, null, '#d8cfb8'); s.rect(15, 15, 3, 3, R.wood); } else { s.rect(8, 13, 2, 7, wood); s.line(23, 19, 27, 14, wood); rubble(); } break;
    case 'inn': house('#e8dcc0', '#b8483a', '#e6b84a'); break;
    case 'forge': s.rect(4, 16, 24, 13, stone); s.rect(20, 4, 6, 13, stone); if (done) { s.ell(23, 4, 2, 1.4, rp('#c8c8c8')); s.rect(8, 20, 8, 5, ramp('#ff8a3a', { gl: .8 })); s.fix(11, 21, '#fff2a0'); s.poly([[6, 15], [18, 15], [16, 12], [8, 12]], R.iron); } else { s.rect(8, 20, 8, 5, rp('#2a2424')); rubble(); s.erase(24, 4); s.erase(25, 5); } break;
    case 'garden': for (let x = 4; x < 28; x += 8) { s.rect(x, 22, 7, 6, R.soil); if (done) [[x + 1, 21], [x + 3, 20], [x + 5, 21]].forEach(([a, b], i) => { s.line(a, b + 1, a, b + 3, R.leafCrop); s.fix(a, b, ['#e48aa8', '#f0d060', '#ffffff'][i]); }); else s.fix(x + 3, 22, '#5a4030'); } s.rect(3, 28, 26, 2, wood); break;
    case 'library': house('#c8b8a0', '#5a4a7a'); if (done) { s.rect(8, 17, 3, 3, rp('#8a3a3a')); s.rect(21, 17, 3, 3, rp('#3a5a8a')); } break;
    case 'watchtower': s.rect(11, 8, 10, 21, wood); s.poly(done ? [[8, 9], [16, 1], [24, 9]] : [[8, 9], [13, 5], [24, 9]], done ? R.red : rp('#5a3030')); s.rect(9, 9, 14, 2, wood); s.line(13, 12, 19, 26, null, wood.lo); s.line(19, 12, 13, 26, null, wood.lo); if (done) s.fix(16, 4, '#f0d060'); else rubble(); break;
    case 'market': s.rect(4, 18, 24, 11, wood); for (let x = 3; x < 29; x += 4) s.rect(x, 9, 4, 5, done ? ((x / 4) % 2 ? R.red : rp('#f4ecd8')) : rp('#5a4a4a')); s.rect(5, 14, 2, 5, wood); s.rect(25, 14, 2, 5, wood); if (done) [[9, 17, '#e0405a'], [15, 17, '#f0d060'], [21, 17, '#7ab04a']].forEach(([x, y, c]) => s.ell(x, y, 2, 1.6, rp(c))); else rubble(); break;
    case 'jetty': s.rect(2, 22, 28, 3, wood); for (const x of [4, 12, 20, 28]) s.rect(x, 22, 2, 9, wood); if (done) { s.poly([[18, 16], [26, 16], [24, 20], [20, 20]], R.woodLight); s.line(22, 8, 22, 16, R.wood); s.poly([[22, 8], [28, 14], [22, 14]], rp('#f4ecd8')); } else { s.erase(14, 22); s.erase(15, 22); s.erase(16, 23); } break;
    case 'hearth': s.rect(8, 10, 16, 19, stone); s.rect(11, 18, 10, 9, rp('#2a2424')); if (done) { s.poly([[12, 26], [16, 18], [20, 26]], ramp('#ff8a3a', { gl: .85 })); s.fix(16, 22, '#fff2a0'); s.ell(16, 5, 3, 2, rp('#d8d8d8')); } else rubble(); break;
    case 'lanterns': for (const x of [8, 22]) { s.rect(x, 10, 2, 19, wood); s.rect(x - 2, 6, 6, 5, done ? ramp('#ffd060', { gl: .9 }) : rp('#4a4a40')); s.rect(x - 2, 5, 6, 1, R.iron); } break;
    case 'cistern': s.ell(16, 26, 11, 4, stone); s.rect(5, 12, 22, 14, stone); s.ell(16, 12, 11, 3, rp(done ? '#4f8fc0' : '#3a3030')); if (done) s.fix(12, 11, '#e8f6ff'); else { s.line(9, 14, 12, 24, null, '#2a2020'); rubble(); } break;
    case 'bridge': for (let x = 0; x < 32; x++) { const y = 18 - Math.round(Math.sin(x / 31 * Math.PI) * 6); if (done || x < 11 || x > 20) { s.dot(x, y, stone); s.dot(x, y + 1, stone); s.dot(x, y + 2, stone); } } if (done) for (let x = 2; x < 31; x += 4) s.line(x, 18 - Math.round(Math.sin(x / 31 * Math.PI) * 6) - 3, x, 18 - Math.round(Math.sin(x / 31 * Math.PI) * 6), wood); break;
    case 'refuge': house('#8a7a9a', '#4a3a5a', '#c8a8ff'); break;
    case 'bell': s.rect(8, 6, 2, 23, wood); s.rect(22, 6, 2, 23, wood); s.rect(6, 5, 20, 2, wood); if (done) { s.poly([[13, 9], [19, 9], [21, 18], [11, 18]], ramp('#d8b050', { gl: .75 })); s.fix(16, 19, '#7a5a2a'); } break;
    case 'lamps': for (const x of [6, 16, 26]) { s.rect(x, 12, 2, 17, R.iron); s.ell(x + 1, 10, 2.4, 2.4, done ? ramp('#ffe08a', { gl: .9 }) : rp('#4a4a40')); } break;
    case 'star': s.rect(15, 14, 2, 15, R.iron); s.ell(16, 28, 6, 2, stone); if (done) { const pts = []; for (let i = 0; i < 10; i++) { const r = i % 2 ? 3 : 7, a = -Math.PI / 2 + i * Math.PI / 5; pts.push([16 + Math.cos(a) * r, 8 + Math.sin(a) * r]); } s.poly(pts, ramp('#e2d4ff', { gl: .9 })); s.fix(16, 7, '#ffffff'); } break;
    default: house('#d8c8a8', '#8a5a3a');
  }
  return s;
}
const PLACE = { well: [.82, .9], inn: [.12, .86], forge: [.58, .92], garden: [.36, .97], library: [.24, .84], watchtower: [.94, .82], bell: [.47, .86], lamps: [.7, .95], star: [.82, .74],
  market: [.62, .9], jetty: [.7, .92], hearth: [.5, .9], lanterns: [.4, .92], cistern: [.55, .9], bridge: [.48, .9], refuge: [.45, .9] };

/* ================= Town scenes (160 x 90) ================= */
const TOWN = {
  willowbrook: { sky: ['#a8d8ec', '#b8e0ee', '#cbe8ef'], hills: ['#8cbf74', '#79b04f'], ground: '#6aa244', path: '#cdb07a', props: ['oak:6,20', 'pine:128,12', 'cottage:62,26', 'oak:34,30'] },
  mossbarrow: { sky: ['#b8d8e0', '#c8e2e4', '#d8eae4'], hills: ['#a8b868', '#8aa850'], ground: '#7a9a44', path: '#c8a870', fields: true, props: ['windmill:110,10', 'normal:10,22', 'cottage:40,28'] },
  saltmere: { sky: ['#9fd0e8', '#b4dcec', '#cbe6ef'], hills: ['#5a90b8', '#4f8fc0'], ground: '#e0cf98', sea: true, props: ['lighthouse:124,6', 'willow:6,24'] },
  ironpeak: { sky: ['#b8c8d8', '#c8d4e0', '#d8e0e8'], hills: ['#e8eef4', '#c8d4dc'], ground: '#9aa4a8', path: '#b8b0a4', snow: true, props: ['yew:8,22', 'yew:30,28', 'mine:100,30'] },
  gloomfen: { sky: ['#7a8a78', '#8a9a84', '#9aa890'], hills: ['#5a6a4a', '#4a5a3e'], ground: '#4a5a38', path: '#6a6a4a', swamp: true, props: ['gloomwood:8,22', 'gloomwood:120,18', 'elder:60,26'] },
  emberfall: { sky: ['#5a2a2a', '#7a3a2a', '#9a4a2a'], hills: ['#3a2a2a', '#4a2e28'], ground: '#3a2a26', lava: true, props: ['volcano:90,2', 'citadel:20,18'] },
  skyreach: { sky: ['#7ab8e8', '#9cc8ee', '#bcdcf2'], hills: ['#f2f6fa', '#e2ecf4'], ground: '#cfdce6', clouds: true, props: ['birch:10,22', 'monastery:96,14'] },
  hollow: { sky: ['#1e1a34', '#2a2444', '#3a3054'], hills: ['#2a2238', '#342a44'], ground: '#2a2234', path: '#4a3e5a', stars: true, props: ['gloomwood:10,22', 'castle:96,4'] }
};
function landmark(kind) {
  const s = Spr(kind === 'volcano' ? 64 : 48, kind === 'volcano' ? 40 : 48);
  if (kind === 'windmill') { s.poly([[18, 46], [30, 46], [27, 16], [21, 16]], R.plaster); s.poly([[19, 17], [24, 10], [29, 17]], R.red); for (const [dx, dy] of [[1, -1], [-1, 1], [1, 1], [-1, -1]]) s.line(24, 18, 24 + dx * 14, 18 + dy * 12, R.wood); s.rect(22, 38, 4, 8, R.wood); }
  if (kind === 'lighthouse') { s.poly([[18, 46], [30, 46], [28, 12], [20, 12]], R.plaster); for (let y = 16; y < 46; y += 8) s.rect(19, y, 10, 3, R.red); s.rect(19, 6, 10, 6, ramp('#ffe08a', { gl: .9 })); s.poly([[18, 6], [24, 1], [30, 6]], R.red); }
  if (kind === 'mine') { s.poly([[2, 46], [10, 18], [24, 10], [40, 18], [46, 46]], R.stone); s.ell(24, 40, 9, 8, rp('#1e1a1a')); s.rect(14, 32, 2, 14, R.wood); s.rect(32, 32, 2, 14, R.wood); s.rect(14, 31, 20, 2, R.wood); s.rect(30, 42, 10, 4, R.iron); }
  if (kind === 'volcano') { s.poly([[0, 39], [24, 6], [40, 6], [63, 39]], rp('#4a3030')); s.poly([[26, 6], [30, 2], [34, 2], [38, 6]], ramp('#ff8a3a', { gl: .85 })); for (let y = 8; y < 30; y += 3) s.fix(31 + Math.round(Math.sin(y) * 2), y, '#ff8a3a'); }
  if (kind === 'citadel') { s.rect(6, 16, 36, 30, rp('#5a4040')); for (let x = 6; x < 42; x += 6) s.rect(x, 12, 4, 4, rp('#5a4040')); s.rect(20, 4, 8, 14, rp('#6a4a44')); s.rect(21, 30, 6, 16, rp('#2a1a1a')); [[12, 24], [34, 24], [23, 9]].forEach(([x, y]) => s.fix(x, y, '#ffb04a')); }
  if (kind === 'monastery') { s.rect(8, 22, 32, 20, R.plaster); s.poly([[6, 23], [24, 10], [42, 23]], rp('#c8483c')); s.rect(20, 4, 8, 10, R.plaster); s.poly([[19, 5], [24, 0], [29, 5]], rp('#c8483c')); s.ell(24, 44, 18, 4, rp('#f6fbfc')); s.rect(21, 32, 6, 10, R.wood); }
  if (kind === 'castle') { const c = rp('#4a3e5a'); s.rect(6, 20, 36, 26, c); s.rect(4, 10, 8, 36, c); s.rect(36, 10, 8, 36, c); s.rect(18, 4, 12, 18, c); for (const x of [4, 36, 18]) s.poly([[x, x === 18 ? 4 : 10], [x + (x === 18 ? 6 : 4), x === 18 ? -2 : 4], [x + (x === 18 ? 12 : 8), x === 18 ? 4 : 10]], rp('#b08aff')); [[8, 20], [40, 20], [24, 12]].forEach(([x, y]) => s.fix(x, y, '#e0d0ff')); s.rect(20, 34, 8, 12, rp('#1e1a2a')); }
  return s;
}
function sceneFor(town, projects = {}) {
  const T = TOWN[town] || TOWN.willowbrook, W = 160, H = 90, c = document.createElement('canvas'); c.width = W; c.height = H; const x = c.getContext('2d');
  const band = (y, h, col) => { x.fillStyle = col; x.fillRect(0, y, W, h); };
  band(0, 14, T.sky[0]); band(14, 10, T.sky[1]); band(24, 10, T.sky[2]);
  if (T.stars) [[12, 4], [40, 9], [70, 3], [100, 8], [130, 5], [150, 11], [24, 16], [118, 15]].forEach(([a, b]) => { x.fillStyle = '#e6e0ff'; x.fillRect(a, b, 1, 1); });
  else [[18, 8, 14], [104, 5, 18]].forEach(([cx, cy, w]) => { x.fillStyle = mix(T.sky[0], '#ffffff', .75); x.fillRect(cx, cy, w, 3); x.fillRect(cx + 3, cy - 2, w - 6, 2); });
  const hill = (pts, col) => { x.fillStyle = col; x.beginPath(); x.moveTo(0, H); pts.forEach(([a, b]) => x.lineTo(a, b)); x.lineTo(W, H); x.closePath(); x.fill(); };
  if (T.snow) { hill([[0, 44], [24, 18], [44, 36], [72, 12], [100, 34], [128, 16], [160, 38]], T.hills[0]); hill([[0, 50], [40, 40], [80, 48], [120, 40], [160, 46]], T.hills[1]); }
  else { hill([[0, 40], [30, 32], [62, 38], [96, 30], [130, 36], [160, 31]], T.hills[0]); hill([[0, 50], [40, 44], [80, 50], [120, 43], [160, 48]], T.hills[1]); }
  band(56, 34, T.ground);
  if (T.sea) { band(48, 14, '#4f8fc0'); band(52, 4, '#5f9fcc'); for (let i = 0; i < 10; i++) { x.fillStyle = '#e8f6ff'; x.fillRect(8 + i * 16, 50 + (i % 2) * 4, 4, 1); } band(62, 4, '#f0e2b0'); }
  if (T.fields) for (let r = 0; r < 4; r++) { x.fillStyle = r % 2 ? '#c8b058' : '#8aa850'; x.fillRect(96, 62 + r * 5, 64, 3); }
  if (T.swamp) { x.fillStyle = '#3a4a3a'; x.fillRect(20, 70, 50, 8); x.fillRect(100, 76, 46, 6); x.fillStyle = '#5a6a5a'; x.fillRect(24, 71, 20, 1); [[30, 66], [34, 64], [120, 72], [126, 70]].forEach(([a, b]) => { x.fillStyle = '#6a7a4a'; x.fillRect(a, b, 1, 6); }); }
  if (T.lava) { x.fillStyle = '#e8583a'; x.beginPath(); x.moveTo(110, 40); x.bezierCurveTo(112, 60, 96, 70, 104, 90); x.lineTo(112, 90); x.bezierCurveTo(106, 70, 120, 60, 116, 40); x.fill(); x.fillStyle = '#ffb04a'; x.fillRect(108, 60, 2, 6); }
  if (T.clouds) [[0, 70, 40], [50, 78, 36], [96, 72, 64]].forEach(([a, b, w]) => { x.fillStyle = '#f6fbfc'; x.fillRect(a, b, w, 6); x.fillRect(a + 4, b - 3, w - 8, 3); });
  if (T.path && !T.sea && !T.clouds) { x.fillStyle = T.path; x.beginPath(); x.moveTo(60, H); x.bezierCurveTo(66, 74, 84, 70, 86, 62); x.lineTo(92, 62); x.bezierCurveTo(92, 72, 78, 78, 80, H); x.fill(); }
  const shadow = (cx, cy, rx) => { x.fillStyle = 'rgba(30,40,24,.28)'; for (let j = -2; j <= 2; j++) { const w = Math.round(rx * Math.sqrt(1 - (j * j) / 6.5)); x.fillRect(cx - w, cy + j, w * 2, 1); } };
  const put = (spr, X, Y) => x.drawImage(A.toCanvas(spr), X, Y);
  for (const p of T.props) { const [name, pos] = p.split(':'), [px, py] = pos.split(',').map(Number);
    const spr = name === 'cottage' ? A.sprites.cottage() : TREE[name] ? treeSprite(name) : landmark(name); shadow(px + spr.w / 2, py + spr.h - 1, spr.w * .32); put(spr, px, py); }
  /* each restoration project of this town, damaged or restored, placed by hand */
  for (const [id, pj] of Object.entries(D.PROJECTS || {})) { if (pj.town !== town) continue; if (pj.relic && !projects[id]) continue;
    const [fx, fy] = PLACE[id] || [.86, .9], spr = piece(id, !!projects[id]), X = Math.round(fx * W - 16), Y = Math.round(fy * H - 32); shadow(X + 16, Y + 31, 10); put(spr, X, Y); }
  [[10, 70], [24, 82], [120, 72], [140, 84]].forEach(([a, b]) => { x.fillStyle = mix(T.ground, '#1e2a14', .35); x.fillRect(a, b, 1, 2); x.fillRect(a + 2, b - 1, 1, 3); });
  return c;
}

/* ================= The cottage, furniture and workers ================= */
const FURN = {
  fireplace: s => { s.rect(2, 4, 12, 11, R.stone); s.rect(5, 8, 6, 6, rp('#2a2424')); s.poly([[6, 13], [8, 8], [10, 13]], ramp('#ff8a3a', { gl: .85 })); s.rect(1, 3, 14, 2, R.wood); },
  bookshelf: s => { s.rect(2, 1, 12, 14, R.wood); for (const y of [4, 8, 12]) s.rect(2, y, 12, 1, R.wood.lo ? R.wood : R.wood); ['#8a3a3a', '#3a5a8a', '#5a8a4a', '#d8b050', '#7a5a9a'].forEach((c, i) => { s.rect(3 + i * 2, 2, 1, 2, rp(c)); s.rect(4 + i * 2, 5, 1, 3, rp(c)); s.rect(3 + i * 2, 9, 1, 3, rp(c)); }); },
  rug: s => { s.ell(8, 10, 7, 4, rp('#a8483a')); s.ell(8, 10, 4.6, 2.4, rp('#e6c86a')); s.ell(8, 10, 2, 1, rp('#3a5a8a')); },
  range: s => { s.rect(2, 5, 12, 10, R.iron); s.rect(4, 9, 8, 4, rp('#2a2424')); s.fix(7, 11, '#ff8a3a'); s.rect(10, 1, 3, 4, R.iron); s.rect(2, 4, 12, 1, R.steel); },
  larder: s => { s.rect(3, 1, 10, 14, R.wood); s.rect(4, 2, 8, 12, R.woodLight); s.line(8, 2, 8, 13, null, R.wood.lo); s.fix(7, 8, R.gold.base); s.fix(9, 8, R.gold.base); },
  toolrack: s => { s.rect(1, 2, 14, 2, R.wood); s.line(4, 4, 4, 13, R.iron); s.poly([[3, 12], [6, 12], [5, 15]], R.iron); s.line(8, 4, 8, 14, R.wood); s.poly([[6, 4], [10, 4], [10, 7], [8, 6]], R.iron); s.line(12, 4, 12, 14, R.wood); s.rect(11, 12, 3, 3, R.iron); },
  compost: s => { s.rect(2, 5, 12, 10, R.wood); s.line(2, 8, 14, 8, null, R.wood.lo); s.line(2, 11, 14, 11, null, R.wood.lo); s.ell(8, 5, 5, 2, R.soil); s.fix(6, 4, '#7ab04a'); s.fix(10, 4, '#e0a040'); },
  trough: s => { s.poly([[1, 7], [15, 7], [13, 13], [3, 13]], R.wood); s.rect(3, 7, 10, 2, R.water); s.rect(3, 13, 2, 2, R.wood); s.rect(11, 13, 2, 2, R.wood); },
  cot: s => { s.rect(1, 9, 14, 3, R.wood); s.rect(2, 7, 11, 2, rp('#c8b890')); s.rect(2, 6, 3, 2, rp('#f4ecd8')); s.line(1, 12, 1, 14, R.wood); s.line(14, 12, 14, 14, R.wood); },
  noticeboard: s => { s.rect(2, 2, 12, 9, R.wood); s.rect(3, 3, 10, 7, rp('#c8a86a')); s.rect(4, 4, 3, 4, rp('#f4ecd8')); s.rect(9, 4, 3, 3, rp('#f4ecd8')); s.fix(5, 4, '#c8483c'); s.rect(4, 11, 2, 4, R.wood); s.rect(10, 11, 2, 4, R.wood); },
  strongbox: s => { s.rect(2, 5, 12, 9, R.iron); s.rect(2, 5, 12, 2, R.steel); s.rect(7, 8, 2, 3, R.gold); for (const x of [3, 12]) s.line(x, 5, x, 13, null, R.iron.lo); },
  display: s => { s.rect(2, 4, 12, 10, rp('#cfe4ec')); s.rect(2, 13, 12, 2, R.wood); s.rect(2, 3, 12, 1, R.wood); s.poly([[6, 10], [8, 6], [10, 10]], R.gold); s.fix(4, 5, '#ffffff'); },
  spicerack: s => { s.rect(1, 6, 14, 2, R.wood); s.rect(1, 12, 14, 2, R.wood); ['#c8483c', '#e6b84a', '#7ab04a', '#8a5a3a'].forEach((c, i) => { s.rect(2 + i * 3, 3, 2, 3, rp(c)); s.rect(2 + i * 3, 9, 2, 3, rp(c)); }); }
};
function furnSprite(id, ic) { const s = Spr(16, 16); if (FURN[id]) { FURN[id](s); return s; }
  /* the remaining furniture follows its icon family: bed, desk, chest, plants, trophies */
  const w = R.wood; if (/bed/.test(id)) { s.rect(1, 8, 14, 5, w); s.rect(2, 6, 4, 3, rp('#f4ecd8')); s.rect(6, 7, 9, 2, rp('#3f7fbf')); s.rect(1, 13, 2, 2, w); s.rect(13, 13, 2, 2, w); }
  else if (/bench|desk|table|anvil/.test(id)) { s.rect(1, 6, 14, 3, w); s.rect(2, 9, 2, 6, w); s.rect(12, 9, 2, 6, w); s.rect(5, 4, 4, 2, R.iron); }
  else if (/chest|wardrobe|trunk/.test(id)) { s.rect(2, 6, 12, 8, w); s.poly([[2, 6], [3, 3], [13, 3], [14, 6]], R.woodLight); s.rect(7, 6, 2, 3, R.gold); }
  else if (/plant|bed_|herb|flower|tree|pond/.test(id)) { s.rect(5, 10, 6, 5, rp('#b8603a')); s.ell(8, 7, 4.6, 4, R.leafCrop); s.fix(7, 5, '#e48aa8'); }
  else if (/trophy|mount|banner|case/.test(id)) { s.poly([[4, 2], [12, 2], [11, 8], [5, 8]], R.gold); s.rect(7, 8, 2, 4, R.gold); s.rect(4, 12, 8, 2, w); }
  else { s.rect(3, 3, 10, 10, w); s.rect(4, 4, 8, 8, R.woodLight); }
  return s; }
/* workers: townsfolk dressed for their trade, holding its tool */
function workerSprite(skill) {
  const spec = { fishing: { cloth: '#3f7fbf', hat: 'cap', hatCol: '#e0c060', weapon: 'pitchfork' }, woodcutting: { cloth: '#7a5a3a', hat: 'cap', hatCol: '#c8483c', beard: '#6a4a2a', weapon: 'axe' }, mining: { cloth: '#6a6a74', hat: 'helm', hatCol: '#e0b040', weapon: 'axe', weaponCol: '#9aa3ad' } }[skill] || { cloth: '#7a9a5a', hair: '#6a4a2a' };
  return A.humanoid(Object.assign({ skin: '#e0b088' }, spec));
}
/* ================= Skill and menu icons (16 x 16) ================= */
const ICON = {
  fishing: () => A.sprites.iconFishing(), woodcutting: () => A.sprites.iconWoodcutting(), mining: () => A.sprites.iconMining(),
  thieving: s => { const l = R.leather; s.poly([[3, 14], [2, 7], [4, 4], [8, 4], [9, 8], [9, 14]], rp('#4a4a5a')); for (const [x, t] of [[3, 2], [5, 1], [7, 2]]) s.rect(x, t, 2, 4, rp('#4a4a5a')); s.ell(12, 10, 3, 3.4, R.gold); s.fix(11, 9, R.gold.gl); },
  farming: s => { s.line(3, 15, 11, 3, R.wood); s.poly([[9, 3], [14, 4], [14, 7], [11, 6]], R.iron); for (const x of [2, 5]) { s.line(x, 15, x + 1, 9, rp('#b89a40')); s.dot(x + 1, 8, rp('#e0c060')); s.dot(x + 2, 7, rp('#e0c060')); } },
  cooking: s => { s.ell(8, 10, 6, 4, R.iron); s.rect(2, 9, 12, 2, R.iron); s.rect(1, 8, 2, 1, R.iron); s.rect(13, 8, 2, 1, R.iron); s.ell(8, 8, 4, 1.4, rp('#c88a4a')); [[6, 4], [9, 3], [11, 5]].forEach(([x, y]) => s.fix(x, y, '#ffffff')); },
  smithing: s => { s.poly([[2, 9], [14, 9], [12, 12], [4, 12]], R.iron); s.rect(6, 12, 4, 3, R.iron); s.line(8, 7, 13, 2, R.wood); s.poly([[10, 1], [14, 0], [15, 4], [12, 5]], R.steel); s.fix(5, 8, '#ffb04a'); },
  crafting: s => { s.line(3, 13, 13, 3, R.steel); s.fix(13, 2, R.steel.gl); s.ell(4, 12, 2, 2, R.gold); for (let i = 0; i < 8; i++) s.fix(5 + i, 14 - Math.round(Math.sin(i / 2) * 2), '#c8483c'); },
  magic: s => { s.line(3, 15, 10, 5, R.wood); s.line(4, 15, 11, 5, R.wood); s.ell(12, 4, 2.6, 2.6, ramp('#9b87e0', { gl: .85 })); [[14, 1], [9, 2], [15, 7]].forEach(([x, y]) => s.fix(x, y, '#e8e0ff')); },
  research: s => { s.rect(2, 3, 12, 10, rp('#8a3a3a')); s.rect(3, 4, 10, 8, rp('#f4ecd8')); s.line(8, 4, 8, 12, null, '#8a3a3a'); s.line(4, 6, 7, 6, null, '#9a8a7a'); s.line(9, 6, 12, 6, null, '#9a8a7a'); s.ell(12, 12, 2, 2, R.gold); },
  hunting: s => { for (let i = 0; i < 10; i++) { s.dot(3 + i, 12 - Math.round(Math.sin(i / 3) * 3) - i * .5, R.gold); s.dot(3 + i, 13 - Math.round(Math.sin(i / 3) * 3) - i * .5, R.gold); } s.ell(13, 5, 2.4, 2.4, R.gold); [[4, 14], [7, 15]].forEach(([x, y]) => s.fix(x, y, '#7a5236')); },
  exploration: s => { s.ell(8, 8, 6, 6, R.gold); s.ell(8, 8, 4.4, 4.4, rp('#f4ecd8')); s.poly([[8, 4], [9, 8], [8, 12], [7, 8]], R.red); s.fix(8, 8, '#2a1c1f'); },
  herbalism: s => { s.poly([[4, 8], [12, 8], [11, 14], [5, 14]], R.stone); s.line(8, 7, 13, 2, R.stone); s.poly([[3, 7], [5, 2], [7, 7]], R.leafCrop); s.fix(10, 4, '#e48aa8'); },
  enchanting: s => { s.poly([[4, 13], [6, 3], [10, 3], [12, 13]], R.stone); s.line(8, 5, 8, 11, null, '#8fc0ff'); s.line(6, 8, 10, 8, null, '#8fc0ff'); [[3, 3], [13, 5]].forEach(([x, y]) => s.fix(x, y, '#e8e0ff')); },
  attack: s => { s.line(3, 13, 12, 4, R.steel); s.line(4, 13, 13, 4, R.steel); s.fix(13, 3, R.steel.gl); s.line(2, 11, 6, 15, R.gold); s.dot(2, 14, R.leather); },
  strength: s => { s.ell(8, 9, 5, 4.6, rp('#e0a070')); s.rect(3, 4, 4, 6, rp('#e0a070')); s.line(4, 10, 11, 10, null, rp('#e0a070').lo); s.rect(9, 3, 3, 3, rp('#e0a070')); },
  defence: s => { s.poly([[3, 2], [13, 2], [13, 8], [8, 15], [3, 8]], R.steel); s.poly([[5, 4], [11, 4], [11, 8], [8, 12], [5, 8]], rp('#3f6fd6')); s.fix(4, 3, R.steel.gl); },
  hitpoints: s => { s.ell(5.5, 6, 3.4, 3.2, R.red); s.ell(10.5, 6, 3.4, 3.2, R.red); s.poly([[2, 7], [14, 7], [8, 14]], R.red); s.fix(4, 5, '#ffffff'); },
  ranged: s => { for (let i = 0; i <= 20; i++) { const t = i / 20, b = Math.sin(t * Math.PI) * 3; s.dot(2 + 10 * t - b, 14 - 13 * t - b, R.wood); s.dot(3 + 10 * t - b, 14 - 13 * t - b, R.wood); } s.line(3, 14, 13, 1, null, '#efe4c8'); s.line(5, 11, 13, 3, R.woodLight); s.poly([[13, 3], [15, 1], [13, 5]], R.steel); },
  home: () => { const s = Spr(16, 16); s.rect(3, 8, 10, 7, R.plaster); s.poly([[1, 9], [8, 2], [15, 9]], R.straw); s.rect(7, 10, 3, 5, R.wood); s.rect(11, 3, 2, 4, R.stone); return s; },
  quest: s => { s.rect(3, 2, 10, 12, rp('#e8d8b0')); s.rect(2, 1, 12, 2, R.woodLight); s.rect(2, 13, 12, 2, R.woodLight); for (const y of [5, 7, 9]) s.line(5, y, 11, y, null, '#9a8a6a'); s.ell(11, 11, 1.6, 1.6, R.red); },
  map: s => { s.poly([[1, 3], [5, 2], [10, 4], [15, 2], [15, 13], [10, 14], [5, 12], [1, 14]], rp('#e0cf98')); s.line(5, 2, 5, 12, null, '#b89a5a'); s.line(10, 4, 10, 14, null, '#b89a5a'); s.line(3, 10, 8, 6, null, '#c8483c'); s.fix(12, 8, '#3f7a3c'); },
  shop: s => { s.rect(2, 8, 12, 7, R.wood); for (let x = 1; x < 15; x += 3) s.rect(x, 3, 3, 4, (x / 3 | 0) % 2 ? R.red : rp('#f4ecd8')); s.ell(6, 8, 1.6, 1.2, rp('#e0405a')); s.ell(10, 8, 1.6, 1.2, rp('#f0d060')); },
  bag: s => { const b = R.leather; s.poly([[3, 14], [2, 7], [5, 4], [11, 4], [14, 7], [13, 14]], b); s.rect(6, 2, 4, 2, b); s.rect(5, 8, 6, 3, rp(mix('#9a6a42', '#3a2448', .2))); s.fix(8, 9, R.gold.base); },
  gear: s => { const g = R.iron; s.ell(8, 8, 5, 5, g); for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4; s.rect(Math.round(8 + Math.cos(a) * 6) - 1, Math.round(8 + Math.sin(a) * 6) - 1, 2, 2, g); } s.ell(8, 8, 2, 2, rp('#3a3a44')); },
  bell: s => { s.poly([[5, 4], [11, 4], [13, 12], [3, 12]], R.gold); s.ell(8, 4, 3, 2, R.gold); s.rect(2, 12, 12, 1, R.gold); s.ell(8, 14, 1.4, 1.2, rp('#7a5a2a')); s.fix(6, 6, R.gold.gl); },
  coin: s => { s.ell(8, 8, 6, 6, R.gold); s.ell(8, 8, 4, 4, ramp('#f0c860')); s.line(8, 5, 8, 11, null, R.gold.lo); s.fix(6, 5, '#fff6c0'); },
  sound: s => { s.rect(2, 6, 3, 4, R.wood); s.poly([[5, 6], [10, 2], [10, 14], [5, 10]], R.gold); s.line(12, 5, 13, 8, null, '#9ab0c0'); s.line(13, 8, 12, 11, null, '#9ab0c0'); },
  pin: s => { s.ell(8, 6, 4.6, 4.6, R.red); s.poly([[4, 8], [12, 8], [8, 15]], R.red); s.ell(8, 6, 1.6, 1.6, rp('#f4ecd8')); },
  clock: s => { s.ell(8, 8, 6, 6, R.gold); s.ell(8, 8, 4.4, 4.4, rp('#f4ecd8')); s.line(8, 8, 8, 5, null, '#2a1c1f'); s.line(8, 8, 11, 8, null, '#2a1c1f'); },
  star: s => { const pts = []; for (let i = 0; i < 10; i++) { const r = i % 2 ? 2.8 : 6.6, a = -Math.PI / 2 + i * Math.PI / 5; pts.push([8 + Math.cos(a) * r, 8.5 + Math.sin(a) * r]); } s.poly(pts, R.gold); s.fix(7, 6, '#fff6c0'); },
  trophy: s => { s.poly([[4, 2], [12, 2], [11, 8], [5, 8]], R.gold); s.rect(7, 8, 2, 4, R.gold); s.rect(4, 12, 8, 2, R.wood); s.line(2, 3, 3, 6, null, R.gold.base); s.line(14, 3, 13, 6, null, R.gold.base); s.fix(6, 3, '#fff6c0'); }
};
/* Interface glyphs drawn as pixel art too (Nov 2026): no icon falls back to a line glyph any more. Item-type
   icons reuse the matching item sprite so a "fish" icon is the same shrimp you catch. */
const itemIcon = id => () => A.itemSprite(id);
const stroke2 = (s, pts, r) => { for (let i = 0; i + 1 < pts.length; i++) { const [a, b] = [pts[i], pts[i + 1]]; s.line(a[0], a[1], b[0], b[1], r); s.line(a[0] + 1, a[1], b[0] + 1, b[1], r); } };
Object.assign(ICON, {
  fish: itemIcon('raw_shrimp'), log: itemIcon('log_normal'), ore: itemIcon('ore_copper'), bar: itemIcon('bar_bronze'), gem: itemIcon('gem_sapphire'),
  hide: itemIcon('cowhide'), bone: itemIcon('old_bone'), pouch: itemIcon('coin_pouch'), arrow_ammo: itemIcon('arrow_bronze'), helm: itemIcon('bronze_helm'),
  body: itemIcon('bronze_body'), legs: itemIcon('bronze_legs'), shield: itemIcon('bronze_shield'), staff: itemIcon('staff_normal'), ring: itemIcon('ring_sapphire'),
  amulet: itemIcon('amulet_sapphire'), food: itemIcon('bread'), bow: itemIcon('bow_normal'), seed: itemIcon('seed_potato'), crop: itemIcon('crop_potato'),
  egg: itemIcon('egg'), dagger: itemIcon('bronze_dagger'), heart: s => ICON.hitpoints(s),
  close: s => { const r = rp('#c8483c'); stroke2(s, [[3, 3], [11, 11]], r); stroke2(s, [[11, 3], [3, 11]], r); s.line(3, 4, 11, 12, r); s.line(12, 4, 4, 12, r); },
  check: s => { const r = rp('#5cc08a'); stroke2(s, [[2, 8], [5, 11], [12, 4]], r); s.line(2, 9, 5, 12, r); s.line(6, 12, 13, 5, r); },
  chevron: s => { const r = R.iron; stroke2(s, [[5, 2], [10, 7], [5, 12]], r); s.line(5, 3, 9, 7, r); s.line(9, 8, 5, 12, r); },
  arrow: s => { s.rect(2, 7, 9, 3, R.gold); s.poly([[9, 3], [15, 8.5], [9, 14]], R.gold); },
  lock: s => { s.rect(5, 2, 6, 2, R.iron); s.rect(4, 3, 2, 5, R.iron); s.rect(10, 3, 2, 5, R.iron); s.rect(3, 7, 10, 8, R.gold); s.fix(8, 10, '#2a1c1f'); s.fix(8, 11, '#2a1c1f'); s.fix(4, 8, '#fff6c0'); },
  skull: s => { const b = rp('#e8e0d0'); s.ell(8, 7, 5.5, 5, b); s.rect(5, 11, 6, 3, b); for (const [x, y] of [[5, 6], [6, 6], [5, 7], [6, 7], [9, 6], [10, 6], [9, 7], [10, 7], [8, 9]]) s.fix(x, y, '#2a1c1f'); for (const x of [6, 8, 10]) s.fix(x, 13, '#8a7a6a'); },
  info: s => { s.ell(8, 8, 6.6, 6.6, rp('#3f7fbf')); s.fix(8, 4, '#ffffff'); s.fix(7, 4, '#ffffff'); for (let y = 7; y <= 11; y++) { s.fix(7, y, '#ffffff'); s.fix(8, y, '#ffffff'); } s.fix(6, 7, '#ffffff'); s.fix(6, 11, '#ffffff'); s.fix(9, 11, '#ffffff'); },
  sun: s => { s.ell(8, 8, 3.6, 3.6, R.gold); for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4; s.dot(8 + Math.round(Math.cos(a) * 6), 8 + Math.round(Math.sin(a) * 6), R.gold); s.dot(8 + Math.round(Math.cos(a) * 5.4), 8 + Math.round(Math.sin(a) * 5.4), R.gold); } },
  moon: s => { s.ell(8, 8, 6, 6, rp('#e8dca8')); for (let j = -6; j <= 6; j++) for (let i = -6; i <= 6; i++) if (i * i + j * j <= 22) s.erase(11 + i, 6 + j); s.fix(4, 7, '#fff6c0'); },
  music: s => { const r = rp('#9b87e0'); s.ell(4, 12, 2.4, 1.8, r); s.ell(11, 11, 2.4, 1.8, r); s.rect(6, 3, 1, 9, r); s.rect(13, 2, 1, 9, r); s.rect(6, 2, 8, 2, r); },
  town: s => { s.rect(1, 9, 6, 6, R.plaster); s.poly([[0, 10], [4, 5], [8, 10]], R.straw); s.rect(8, 6, 7, 9, R.stone); s.poly([[7, 7], [11.5, 2], [16, 7]], R.red); s.rect(3, 11, 2, 4, R.wood); s.rect(10, 10, 2, 2, rp('#f0d060')); },
  save: s => { s.rect(2, 2, 12, 12, rp('#3f7fbf')); s.rect(4, 2, 7, 4, rp('#d8dce0')); s.fix(9, 3, '#2a1c1f'); s.fix(9, 4, '#2a1c1f'); s.rect(4, 9, 8, 5, rp('#f4ecd8')); },
  flag: s => { s.rect(3, 1, 2, 14, R.wood); s.poly([[5, 2], [14, 4], [5, 8]], R.red); s.fix(6, 3, '#ff9a8a'); },
  barn: s => { s.rect(2, 7, 12, 8, R.red); s.poly([[1, 8], [8, 2], [15, 8]], rp('#7a3a2a')); s.rect(6, 10, 4, 5, R.wood); s.line(6, 10, 9, 14, null, '#f4ecd8'); s.line(9, 10, 6, 14, null, '#f4ecd8'); },
  candle: s => { s.rect(6, 7, 4, 8, rp('#f4ecd8')); s.ell(8, 4, 1.6, 2.4, rp('#ffb04a')); s.fix(8, 4, '#fff6c0'); s.fix(8, 6, '#2a1c1f'); s.rect(4, 14, 8, 1, R.gold); },
  fire: s => { s.poly([[3, 14], [2, 9], [5, 4], [6, 8], [8, 1], [11, 7], [12, 5], [14, 10], [13, 14]], rp('#e0603a')); s.poly([[5, 14], [5, 10], [8, 6], [11, 10], [11, 14]], rp('#ffb04a')); s.fix(8, 11, '#fff6c0'); },
  nest: s => { s.ell(8, 11, 6.5, 3.4, R.wood); s.ell(8, 9.5, 4, 1.4, rp('#5a3a22')); s.ell(6, 8, 1.6, 1.8, rp('#cfe6f0')); s.ell(10, 8, 1.6, 1.8, rp('#cfe6f0')); },
  ring_logo: s => { s.ell(8, 9, 6, 6, R.gold); for (let j = -4; j <= 4; j++) for (let i = -4; i <= 4; i++) if (i * i + j * j <= 12) s.erase(8 + i, 9 + j); s.ell(8, 3, 2, 2, rp('#3f7fd6')); },
  bit: s => { s.ell(8, 8, 3, 3, R.gold); },
  mute: s => { ICON.sound(s); for (let y = 5; y <= 11; y++) s.erase(12, y), s.erase(13, y); const r = rp('#c8483c'); s.line(11, 5, 15, 10, r); s.line(15, 5, 11, 10, r); }
});
const ICON_ALIAS = { book: 'research', scroll: 'quest', compass: 'exploration', sword: 'attack', rod: 'fishing', glove: 'thieving', hoe: 'farming', hammer: 'smithing', bottle: 'herbalism', rune: 'enchanting', house: 'home', bank: 'bag', users: 'bag', paw: 'hunting', defence: 'defence', health: 'hitpoints' };
function iconSprite(id) { const k = ICON[id] ? id : ICON_ALIAS[id]; const f = ICON[k]; if (!f) return null; const s = Spr(16, 16); const out = f(s); return out && out.w ? out : s; }

/* boss trophies: the boss itself mounted on a carved oak plaque with a brass nameplate (40 x 44) */
function trophySprite(id, gilded) {
  const c = A.creatureSprite && A.creatureSprite(id); if (!c) return null;
  const s = Spr(40, 44), oak = R.wood || rp('#8a5a32');
  if (gilded) s.poly([[0, 1], [40, 1], [40, 31], [20, 44], [0, 31]], R.gold);
  s.poly([[2, 3], [38, 3], [38, 30], [20, 42], [2, 30]], oak);
  s.poly([[5, 6], [35, 6], [35, 29], [20, 38], [5, 29]], rp('#5a3a22'));
  s.stamp(c, 4, 3);
  s.rect(12, 34, 16, 4, R.gold); s.fix(13, 35, '#fff6c0'); for (let x = 15; x <= 25; x += 2) s.fix(x, 36, '#7a5a2a');
  s.fix(4, 4, '#ffd9a0'); s.fix(36, 4, '#ffd9a0');
  return s;
}
/* the Hero level-up star: its own 32 x 32 design (shown at 3x), faceted like a cut jewel, not the 16 px menu icon enlarged */
function bigStar() {
  const s = Spr(32, 32), light = ramp('#f0c048', { gl: .85 });
  const P = []; for (let i = 0; i < 10; i++) { const r = i % 2 ? 6.4 : 15, a = -Math.PI / 2 + i * Math.PI / 5; P.push([16 + Math.cos(a) * r, 16.8 + Math.sin(a) * r]); }
  s.poly(P, light);
  /* facet ridges from the centre to each inner corner, and a bright ridge up each point's lit side */
  for (let i = 1; i < 10; i += 2) s.line(16, 16.8, P[i][0], P[i][1], null, '#b07a28');
  for (let i = 0; i < 10; i += 2) s.line(16, 16.8, (P[i][0] * 3 + 16) / 4, (P[i][1] * 3 + 16.8) / 4, null, i === 0 || i === 8 ? '#fff0b8' : '#d9a640');
  s.ell(16, 16.6, 1.6, 1.6, ramp('#fff2c0', { gl: .95 }));
  for (const [x, y] of [[15, 5], [15, 6], [16, 16]]) s.fix(x, y, '#fffaf0');
  return s;
}
A.bigStarUrl = () => A.url('bigstar', bigStar);
Object.assign(A, { trophySprite, trophyUrl: (id, gilded) => A.url('trophy:' + id + (gilded ? ':gold' : ''), () => trophySprite(id, gilded)) });
Object.assign(A, { workerSprite, treeSprite, rockSprite, piece, sceneFor, furnSprite, iconSprite, TREE, TOWN, ICON, ICON_ALIAS,
  treeUrl: id => A.url('tree:' + id, () => treeSprite(id)), rockUrl: id => A.url('rock:' + id, () => rockSprite(id)),
  furnUrl: (id, ic) => A.url('furn:' + id, () => furnSprite(id, ic)), workerUrl: sk => A.url('worker:' + sk, () => workerSprite(sk)), cottageUrl: () => A.url('cottage', () => A.sprites.cottage()), iconUrl: id => A.url('icon:' + id, () => iconSprite(id)) });
})();
