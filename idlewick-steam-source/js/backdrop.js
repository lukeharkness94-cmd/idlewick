/* Backdrops: original pixel-art scenes drawn in code behind the whole game (no image files).
   Outside combat the player's chosen backdrop shows (Settings: Starlit hills or Twilight forest). On the Combat page
   the backdrop matches the area being fought in or previewed: every region has two scenes, one per hunting area.
   Each scene is a recipe (sky ramp, terrain layers, ground, particles) painted once at 480 × 270 and cached as a
   data URL; it is shown scaled with pixelated rendering under a theme wash so panels stay readable. */
(() => {
  const DQ = window.DQ, D = DQ.data, UI = DQ.ui, S = () => DQ.S;
  const W = 480, H = 270;

  /* recipes: sky top→bottom, layers back→front [type, baseline, colour, height], ground, particles, extras */
  const R = {
    hills: { sky: ['#0b1020', '#16223a', '#1d2b3a'], stars: 160, moon: [395, 40], layers: [['hills', 140, '#2c4258', 12], ['hills', 170, '#22344a', 14], ['hills', 205, '#172535', 10]], windows: [[120, 196], [300, 200], [330, 203]] },
    forest: { sky: ['#2a1d3a', '#3a2d4a', '#2a4048'], layers: [['pines', 200, '#22303a', 100], ['pines', 228, '#1a2630', 90], ['pines', 256, '#111a20', 80]], dots: [40, ['#e8e07a', '#b8d86a'], 150, 270] },
    'willowbrook:0': { sky: ['#30406a', '#c9805a', '#f0b56a'], sun: [380, 150, '#ffd98a'], layers: [['hills', 175, '#5a7a3a', 10], ['hills', 200, '#45652e', 12], ['hills', 230, '#33501f', 8]], dots: [50, ['#f5e8a0', '#ffffff'], 120, 260] },
    'willowbrook:1': { sky: ['#14202a', '#24382e', '#3a4a2e'], layers: [['pines', 190, '#1e3024', 110], ['pines', 220, '#16261c', 95], ['pines', 252, '#0e1a12', 80]], dots: [50, ['#e8e07a', '#c6e06a'], 140, 270] },
    'mossbarrow:0': { sky: ['#4a5560', '#7a8580', '#9aa08a'], layers: [['hills', 190, '#5e6a44', 5], ['fields', 215, '#4a5636', 0], ['hills', 245, '#38422a', 4]], posts: '#2a2a1e', dots: [16, ['#20201a'], 30, 120] },
    'mossbarrow:1': { sky: ['#0c1a1e', '#14282c', '#1e3634'], layers: [['pines', 185, '#1a3030', 120], ['pines', 220, '#122424', 100], ['pines', 255, '#0a1818', 90]], mist: ['#5a7a78', 0.18] },
    'saltmere:0': { sky: ['#3a78a8', '#7ab0d0', '#cfe4ec'], sun: [90, 50, '#fff3c0'], layers: [['waves', 185, '#2e6a8a', 4], ['waves', 205, '#25587a', 5], ['rocks', 240, '#4a4a52', 30]], dots: [40, ['#ffffff'], 175, 230] },
    'saltmere:1': { sky: ['#060c18', '#101c30', '#1a2a40'], stars: 120, moon: [70, 36], layers: [['cliffs', 150, '#1a2230', 90], ['waves', 215, '#14304a', 5], ['waves', 235, '#0e2238', 6]], windows: [[150, 158], [176, 170]] },
    'ironpeak:0': { sky: ['#120e0c', '#1c1612', '#24201a'], layers: [['stalactites', 0, '#2e2620', 70], ['rocks', 215, '#2a221c', 45], ['rocks', 245, '#1c1712', 35]], crystals: ['#7ad0e8', '#b08af0'] },
    'ironpeak:1': { sky: ['#5a7aa0', '#9ab8d0', '#d8e6ee'], layers: [['peaks', 160, '#7a8ea8', 110, '#f2f6fa'], ['peaks', 205, '#5a6e88', 90, '#e6eef4'], ['hills', 240, '#e8eef2', 6]], snow: 160 },
    'gloomfen:0': { sky: ['#1a2420', '#2a3a30', '#3a4a3a'], layers: [['deadtrees', 205, '#1a241c', 80], ['reeds', 235, '#202c20', 22], ['hills', 255, '#141c16', 3]], mist: ['#8aa08a', 0.22] },
    'gloomfen:1': { sky: ['#140c22', '#24163a', '#30204a'], stars: 60, layers: [['deadtrees', 200, '#1c1430', 95], ['reeds', 238, '#160f26', 24], ['hills', 255, '#0e0a18', 3]], dots: [36, ['#c08af8', '#8ae0d0'], 120, 260] },
    'emberfall:0': { sky: ['#2a0e0a', '#6a2414', '#b8481c'], layers: [['hills', 200, '#3a1810', 6], ['flats', 225, '#2a120c', 0], ['hills', 250, '#1a0a06', 3]], cracks: '#ff7a2a', dots: [70, ['#ffb24a', '#ff6a2a'], 60, 260] },
    'emberfall:1': { sky: ['#1a0606', '#3a0e0a', '#6a1c10'], layers: [['peaks', 170, '#4e1a10', 130, '#ff6a2a'], ['peaks', 215, '#1c0806', 100], ['rocks', 250, '#120604', 25]], dots: [80, ['#ffb24a', '#ff6a2a'], 40, 260] },
    'skyreach:0': { sky: ['#6aa8e0', '#a8d0f0', '#e8f4fa'], sun: [400, 50, '#fff8d8'], layers: [['clouds', 150, '#f4f8fc', 30], ['island', 205, '#5a8a4a', 40], ['clouds', 245, '#ffffff', 26]], dots: [30, ['#ffffff', '#fff2b0'], 20, 200] },
    'skyreach:1': { sky: ['#1a1e30', '#2c3248', '#40465a'], layers: [['peaks', 175, '#24283a', 120], ['clouds', 215, '#4a5068', 28], ['peaks', 248, '#161a26', 70]], rain: 140, bolt: [300, 10] },
    'hollow:0': { sky: ['#100c1a', '#1c1428', '#2a1e36'], stars: 40, layers: [['ruins', 205, '#33284a', 90], ['hills', 240, '#18121f', 4]], mist: ['#6a5a80', 0.2] },
    'hollow:1': { sky: ['#06040c', '#100a1c', '#1a1028'], layers: [['spires', 210, '#160e24', 150], ['ruins', 240, '#0e0818', 60]], dots: [50, ['#b88af8', '#f0d8ff'], 40, 260] },
  };

  const paint = key => {
    const r = R[key] || R.hills, c = document.createElement('canvas'); c.width = W; c.height = H;
    const g = c.getContext('2d'); let s = [...key].reduce((a, ch) => a * 31 + ch.charCodeAt(0), 7) % 2147483647 || 7;
    const rnd = () => (s = (s * 16807) % 2147483647) / 2147483647;
    const px = (x, y, w, h, col) => { g.fillStyle = col; g.fillRect(Math.round(x), Math.round(y), Math.max(1, Math.round(w)), Math.max(1, Math.round(h))); };
    const sky = g.createLinearGradient(0, 0, 0, H); r.sky.forEach((col, i) => sky.addColorStop(i / (r.sky.length - 1), col)); g.fillStyle = sky; g.fillRect(0, 0, W, H);
    if (r.stars) for (let i = 0; i < r.stars; i++) { const b = rnd(); px(rnd() * W, rnd() * H * .55, 1, 1, b > .9 ? '#f3e6b0' : b > .6 ? '#9fb0d0' : '#5a6a8a'); }
    if (r.moon) { const [mx, my] = r.moon; for (let y = -9; y <= 9; y++) for (let x = -9; x <= 9; x++) { if (x * x + y * y <= 81) px(mx + x, my + y, 1, 1, '#e9dfb8'); if ((x - 4) ** 2 + (y + 2) ** 2 <= 64) px(mx + x, my + y, 1, 1, r.sky[0]); } }
    if (r.sun) { const [sx, sy, col] = r.sun; for (let y = -14; y <= 14; y++) for (let x = -14; x <= 14; x++) if (x * x + y * y <= 196) px(sx + x, sy + y, 1, 1, col); }
    if (r.bolt) { let [bx, by] = r.bolt; while (by < 170) { const nx = bx + (rnd() - .5) * 14, ny = by + 8 + rnd() * 8; g.strokeStyle = '#e8ecff'; g.beginPath(); g.moveTo(bx, by); g.lineTo(nx, ny); g.stroke(); bx = nx; by = ny; } }
    const pine = (x, top, h, col) => { for (let i = 0; i < h; i++) { const w = Math.max(1, Math.round(i * .42) - (i % 6 === 5 ? 2 : 0)); px(x - w / 2, top + i, w, 1, col); } };
    const fillUnder = (f, col) => { for (let x = 0; x < W; x++) { const y = Math.round(f(x)); px(x, y, 1, H - y, col); } };
    for (const [type, base, col, h, cap] of r.layers) {
      const ph = rnd() * 400;
      if (type === 'hills') fillUnder(x => base + Math.sin((x + ph) * .02) * h + Math.sin((x + ph * 3) * .046) * h * .4, col);
      else if (type === 'fields' || type === 'flats') { px(0, base, W, H - base, col); if (type === 'fields') for (let y = base + 4; y < H; y += 6) px(0, y, W, 1, '#56603c'); }
      else if (type === 'pines') { px(0, base, W, H - base, col); for (let x = -10; x < W + 10; x += 6 + rnd() * 8) { const t = h * (.55 + rnd() * .45); pine(x, base - t, t, col); } }
      else if (type === 'waves') { px(0, base, W, H - base, col); for (let x = 0; x < W; x += 10 + rnd() * 14) px(x, base + rnd() * 20, 4 + rnd() * 6, 1, '#cfe8f4'); }
      else if (type === 'rocks') fillUnder(x => base - Math.abs(Math.sin((x + ph) * .05)) * h * (.5 + .5 * Math.sin((x + ph) * .013)), col);
      else if (type === 'cliffs') fillUnder(x => x < 260 ? base - (x % 37 < 4 ? 6 : 0) + (x > 200 ? (x - 200) * 1.2 : 0) : H, col);
      else if (type === 'peaks' ) { const pts = []; for (let x = -40; x < W + 40; x += 40 + rnd() * 50) pts.push([x, base - h * (.45 + rnd() * .55)]);
        fillUnder(x => { let best = H; for (const [px0, py] of pts) { const y = py + Math.abs(x - px0) * 1.15; if (y < best) best = y; } return Math.min(best, base); }, col);
        if (cap) for (const [px0, py] of pts) for (let i = 0; i < 12; i++) px(px0 - i * 1.15, py + i, i * 2.3 + 1, 1, cap); }
      else if (type === 'stalactites') { for (let x = 0; x < W; x += 6 + rnd() * 10) { const t = h * (.3 + rnd() * .7); for (let i = 0; i < t; i++) px(x - (t - i) * .12, i, Math.max(1, (t - i) * .24), 1, col); } }
      else if (type === 'deadtrees') { px(0, base + 10, W, H - base, col); for (let x = 10; x < W; x += 40 + rnd() * 50) { const t = h * (.6 + rnd() * .4); px(x, base - t, 3, t + 10, col); for (let k = 0; k < 4; k++) { const by = base - t + k * t / 5, d = (k % 2 ? 1 : -1); for (let i = 0; i < 10 + rnd() * 10; i++) px(x + 1 + d * i, by - i * .6, 1, 1, col); } } }
      else if (type === 'reeds') { px(0, base + h * .4, W, H, col); for (let x = 0; x < W; x += 2 + rnd() * 3) px(x, base + h * .4 - rnd() * h, 1, h, col); }
      else if (type === 'clouds') { for (let x = -20; x < W; x += 30 + rnd() * 40) { const rw = 20 + rnd() * 30, rh = 6 + rnd() * h * .4; for (let y = -rh; y <= rh; y++) { const w = rw * Math.sqrt(1 - (y / rh) ** 2); px(x - w, base + y, w * 2, 1, col); } } }
      else if (type === 'island') { const cx = 250, rw = 70; for (let y = 0; y < h; y++) { const w = rw * (1 - y / h); px(cx - w, base + y, w * 2, 1, y < 4 ? col : '#5a4a3a'); } pine(cx - 30, base - 30, 30, '#3a6a3a'); pine(cx + 20, base - 24, 24, '#3a6a3a'); }
      else if (type === 'ruins') { px(0, base, W, H - base, col); for (let x = 10; x < W; x += 36 + rnd() * 40) { const t = h * (.3 + rnd() * .7); px(x, base - t, 10, t, col); px(x - 2, base - t, 14, 3, col); if (rnd() > .5) px(x + 10, base - t * .7, 26, 4, col); } }
      else if (type === 'spires') { px(0, base, W, H - base, col); for (let x = 20; x < W; x += 50 + rnd() * 40) { const t = h * (.5 + rnd() * .5); for (let i = 0; i < t; i++) px(x - i * .08, base - t + i, 2 + i * .16, 1, col); } }
    }
    if (r.posts) for (let x = 6; x < W; x += 22) px(x, 206, 2, 10, r.posts);
    if (r.windows) for (const [x, y] of r.windows) { px(x, y, 8, 6, '#0c141c'); px(x + 1, y - 2, 6, 2, '#0c141c'); px(x + 2, y + 2, 2, 2, '#e8b44a'); px(x + 5, y + 2, 1, 2, '#e8b44a'); }
    if (r.cracks) for (let i = 0; i < 26; i++) { let x = rnd() * W, y = 232 + rnd() * 34; for (let k = 0; k < 8; k++) { px(x, y, 2, 1, r.cracks); x += 2; y += (rnd() - .5) * 3; } }
    if (r.crystals) for (let i = 0; i < 14; i++) { const x = rnd() * W, y = 200 + rnd() * 50, col = r.crystals[i % 2]; px(x, y - 6, 2, 6, col); px(x - 2, y - 3, 2, 3, col); }
    if (r.mist) { const [col, a] = r.mist; for (let i = 0; i < 40; i++) { g.globalAlpha = a * .35; const y = 150 + rnd() * 110, x = rnd() * W - 60; px(x, y, 80 + rnd() * 140, 2 + rnd() * 3, col); } g.globalAlpha = 1; }
    if (r.snow) for (let i = 0; i < r.snow; i++) px(rnd() * W, rnd() * H, 1, 1, '#ffffff');
    if (r.rain) { g.globalAlpha = .5; for (let i = 0; i < r.rain; i++) { const x = rnd() * W, y = rnd() * H; px(x, y, 1, 4, '#9aa8c8'); } g.globalAlpha = 1; }
    if (r.dots) { const [n, cols, y0, y1] = r.dots; for (let i = 0; i < n; i++) px(rnd() * W, y0 + rnd() * (y1 - y0), 1, 1, cols[i % cols.length]); }
    return c.toDataURL();
  };
  const cache = {};
  const urlOf = key => cache[key] || (cache[key] = paint(key));
  DQ.backdropKeys = () => Object.keys(R);
  DQ.backdropUrl = urlOf;

  /* which scene: the fought or previewed area on Combat, otherwise the player's choice */
  const combatKey = () => {
    const a = DQ.act && DQ.act.kind === 'fight' && DQ.act.area;
    if (a && R[a]) return a;
    const m = DQ.combatFocus && DQ.combatFocus(), area = m && DQ.areaForMonster && DQ.areaForMonster(m.id);
    if (area && R[area.id]) return area.id;
    const t = S().town; return R[t + ':0'] ? t + ':0' : null;
  };
  let shown = '';
  const apply = () => {
    if (!DQ.S || !DQ.S.settings) return;
    const key = (UI.view === 'combat' && combatKey()) || (S().settings.backdrop === 'forest' ? 'forest' : 'hills');
    const root = document.documentElement; root.classList.add('has-backdrop'); root.dataset.backdrop = key;
    if (key === shown) return; shown = key;
    root.style.setProperty('--backdrop', `url('${urlOf(key)}')`);
  };
  DQ.applyBackdrop = apply;
  const render = UI.render; UI.render = fresh => { render(fresh); apply(); };
  for (const ev of ['act', 'travel', 'settings']) DQ.on && DQ.on(ev, apply);

  /* Settings: choose the everyday backdrop */
  UI.DO.backdrop = k => { S().settings.backdrop = k === 'forest' ? 'forest' : 'hills'; apply(); UI.render(false); };
  const settings0 = UI.V.settings;
  if (settings0) UI.V.settings = () => { const cur = S().settings.backdrop === 'forest' ? 'forest' : 'hills';
    return settings0() + `<section class="panel backdrop-pick"><div class="phead"><h2>Backdrop</h2><small>Combat shows the area you fight in</small></div><div class="bd-opts">${[['hills', 'Starlit hills'], ['forest', 'Twilight forest']].map(([k, n]) => `<button class="bd-opt ${cur === k ? 'on' : ''}" data-do="backdrop" data-a="${k}" aria-pressed="${cur === k}"><img src="${urlOf(k)}" width="240" height="135" alt=""><span>${n}</span></button>`).join('')}</div></section>`; };
})();
