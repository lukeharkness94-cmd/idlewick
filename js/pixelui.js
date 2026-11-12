/* Idlewick: turns the interface pixel-art. Icons are rasterised to 16x16 masks, the hero portrait
   and town scenes become pixel images. */
(() => {
const DQ = window.DQ, D = DQ.data, UI = DQ.ui;
const T = DQ.SPRITES;

/* ---------- Hero bust: hair or helmet, tunic or armour ---------- */
const head = (a, b, c) => [a, b, c];
const hero = top => [
  '................',
  '.....kkkkkk.....',
  ...top,
  '...k' + 'sesssses' + 'k...',
  '...k' + 'ssssssss' + 'k...',
  '...k' + 'sssrrsss' + 'k...',
  '....k' + 'ssssss' + 'k....',
  '.....k' + 'ssss' + 'k.....',
  '...kk' + 'pppppp' + 'kk...',
  '..k' + 'ppplppppdp' + 'k..',
  '.k' + 'pppplppppppp' + 'k.',
  '.k' + 'pppdppppppdp' + 'k.',
  '.k' + 'pppdppppppdp' + 'k.',
  '.k' + 'pppppppppppp' + 'k.',
];
T.hero = hero(['....k' + 'hhhhhh' + 'k....', '...k' + 'hhhhhhhh' + 'k...', '...k' + 'hssssssh' + 'k...']);
T.heroHelm = hero(['....k' + 'nmmmmm' + 'k....', '...k' + 'nmmmmmmm' + 'k...', '...k' + 'mmmMMmmm' + 'k...']);
const ORIG_PORTRAIT = UI.portrait;
UI.portrait = (px = 48, cls = '') => {
  const L = DQ.S.look, eq = DQ.S.equip, I = D.ITEMS;
  const pal = { p: eq.body ? I[eq.body].col : L.tunic, s: L.skin, h: L.hair, m: eq.head ? I[eq.head].col : undefined };
  return `<span class="portrait pxport ${cls}" style="width:${px}px;height:${px}px"><img class="px" src="${DQ.heroUrl(L, pal.p, pal.m)}" width="${Math.max(24, Math.round(px * .8 / 24) * 24)}" height="${Math.max(24, Math.round(px * .8 / 24) * 24)}" alt="" draggable="false"></span>`;
};

/* ---------- Icons as crisp 16x16 pixel masks ---------- */
DQ.pixelInit = () => {
  if (DQ.pxIcons) return;
  try {
    const rules = [];
    for (const [k, d] of Object.entries(DQ.ICONS)) {
      const c = document.createElement('canvas'); c.width = c.height = 24; const x = c.getContext('2d');
      x.lineWidth = 2.2; x.lineCap = 'round'; x.lineJoin = 'round'; x.strokeStyle = '#000'; x.stroke(new Path2D(d));
      const im = x.getImageData(0, 0, 24, 24); for (let i = 3; i < im.data.length; i += 4) im.data[i] = im.data[i] > 96 ? 255 : 0; x.setTransform(1, 0, 0, 1, 0, 0); x.putImageData(im, 0, 0);
      const big = document.createElement('canvas'); big.width = big.height = 96; const bx = big.getContext('2d'); bx.imageSmoothingEnabled = false; bx.drawImage(c, 0, 0, 96, 96);
      const u = big.toDataURL(); rules.push(`.pxi-${k}{-webkit-mask-image:url(${u});mask-image:url(${u})}`);
    }
    const st = document.createElement('style'); st.textContent = rules.join('\n'); document.head.appendChild(st);
    DQ.pxIcons = true;
  } catch (e) { DQ.pxIcons = false; }
  prerenderScenes();
};

/* ---------- Town scenes: the vector art downsampled into chunky pixels ---------- */
const sceneCache = {}, ORIG_SCENE = UI.scene;
function prerenderScenes() {
  let left = D.TOWNS.length;
  D.TOWNS.forEach(t => {
    const svg = ORIG_SCENE(t.id).replace('<svg ', '<svg xmlns="http://www.w3.org/2000/svg" width="440" height="150" ');
    const img = new Image();
    img.onload = () => {
      const c = document.createElement('canvas'); c.width = 104; c.height = 36; const x = c.getContext('2d'); x.imageSmoothingEnabled = false; x.drawImage(img, 0, 0, 104, 36);
      sceneCache[t.id] = c.toDataURL(); if (--left === 0 && DQ.started) UI.refresh && UI.refresh();
    };
    img.onerror = () => { left--; };
    img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
  });
}
UI.scene = (id, cls = '') => sceneCache[id] ? `<img class="scene pxscene ${cls}" src="${sceneCache[id]}" alt="" draggable="false">` : ORIG_SCENE(id, cls);
})();
