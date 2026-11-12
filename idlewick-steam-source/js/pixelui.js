/* Idlewick: turns the interface pixel-art. Icons are painted on native 48px grids, the hero portrait
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

/* ---------- Detailed pixel icons at the normal interface size ---------- */
DQ.pixelInit = () => {
  if (DQ.pxIcons) return;
  const rules = Object.keys(DQ.ICONS).map(k => `.pxi-${k}{-webkit-mask:none;mask:none;background:transparent url(${DQ.uiIconUrl(k)}) center/contain no-repeat}`);
  const st = document.createElement('style'); st.textContent = rules.join('\n'); document.head.appendChild(st);
  DQ.pxIcons = true;
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
