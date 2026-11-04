/* Idlewick: the painted art completion pack, wired into the game.
   Each sheet loads lazily (utility icons and landscapes first). Entries are cropped from their explicit source
   rectangles (never an equal grid) into square canvases with the aspect ratio kept, then cached. Until a sheet
   has loaded, the existing art is used, and the page refreshes quietly once it arrives.
   Covers: cooked food, logs, bars, arrows, ores, gems, supplies, potions, seeds, crops and mature plants, mining
   rocks, the beehive, furnishings, the cottage, worker portraits, utility icons (including distinct Strength,
   Defence and Health), town landscapes and before/after restoration pieces composited onto them. */
(() => {
const Q = window.DQ, D = Q.data, UI = Q.ui, M = Q.ART_COMPLETION;
if (!M) return;
const imgs = {}, ready = {}, cache = new Map();
let refreshT = 0;
const refresh = () => { if (refreshT) return; refreshT = setTimeout(() => { refreshT = 0; if (Q.started && Q.S) { UI.renderHud && UI.renderHud(); UI.render(false); } }, 150); };
const load = sheet => {
  if (imgs[sheet] || !M[sheet]) return;
  const im = imgs[sheet] = new Image();
  im.onload = () => { ready[sheet] = true; if (sheet === 'utility-icons') installIcons(); refresh(); };
  im.onerror = () => { ready[sheet] = false; };
  im.src = M[sheet].file;
};
Q.artCompletionReady = sheet => !!ready[sheet];

/* crop one entry into a square canvas, centred, aspect kept, transparent margin */
const crop = (sheet, id, size) => {
  const key = sheet + ':' + id + ':' + size; if (cache.has(key)) return cache.get(key);
  load(sheet); if (!ready[sheet]) return null;
  const r = M[sheet].e[id]; if (!r) return null;
  const c = document.createElement('canvas'); c.width = c.height = size; const x = c.getContext('2d');
  const s = Math.min(size / r[2], size / r[3]), w = r[2] * s, h = r[3] * s;
  x.imageSmoothingQuality = 'high'; x.drawImage(imgs[sheet], r[0], r[1], r[2], r[3], (size - w) / 2, (size - h) / 2, w, h);
  const url = c.toDataURL('image/png'); cache.set(key, url); if (cache.size > 600) cache.delete(cache.keys().next().value);
  return url;
};
const img = (url, size, cls, alt) => `<img class="painted-image ${cls || ''}" src="${url}" width="${size}" height="${size}" alt="${Q.esc(alt || '')}" draggable="false">`;

/* ---------- which game ids each sheet covers ---------- */
/* any sheet whose entry ids match items becomes those items' art; later sheets can add more without code changes */
const SPECIAL = new Set(['utility-icons', 'landscapes', 'mining-targets', 'furnishings']);
const ITEM = {};
for (const sheet of Object.keys(M)) if (!SPECIAL.has(sheet) && !sheet.startsWith('restoration')) for (const id of Object.keys(M[sheet].e)) if (D.ITEMS[id] && !ITEM[id]) ITEM[id] = sheet;
const MINE = M['mining-targets'].e, FURN = M.furnishings.e;
Q.completionItemSheet = id => ITEM[id] || null;

/* items everywhere (backpack, bank, shop, recipes, rewards) */
const itemIco0 = Q.itemIco;
Q.itemIco = it => { const sheet = it && ITEM[it.id], url = sheet && crop(sheet, it.id, 96); return url ? img(url, 48, 'item-art', it.name) : itemIco0(it); };
/* larger item art, mining rocks and the beehive */
const art0 = Q.artImage;
Q.artImage = (kind, id, size = 96, cls = '', alt = '') => {
  let url = null; const px = size > 96 ? 256 : 192;
  if (kind === 'item' && ITEM[id]) url = crop(ITEM[id], id, px);
  else if (kind === 'mine' && MINE[id]) url = crop('mining-targets', id, 256);
  return url ? img(url, size, cls, alt || (D.ITEMS[id] && D.ITEMS[id].name) || id) : art0(kind, id, size, cls, alt);
};
/* a fully grown crop shows the growing plant, not the harvested produce */
/* growth stages: mature plants now; seedlings (<crop>-stage1/2) and freshly sown soil appear as soon as a sheet provides them */
const entryAnywhere = id => { for (const s of Object.keys(M)) if (M[s].e[id]) return s; return null; };
const plant0 = Q.plantSprite;
Q.plantSprite = (stage, col, size = 96, cls = '') => {
  const c0 = D.CROPS.find(c => c.col === col), id = !c0 ? null : stage >= 3 ? c0.id + '-mature' : stage === 0 ? 'soil' : c0.id + '-stage' + stage;
  const sheet = id && entryAnywhere(id), url = sheet && crop(sheet, id, 192);
  return url ? img(url, size, cls, c0.name + (stage >= 3 ? ' ready to harvest' : ' growing')) : plant0(stage, col, size, cls);
};
const animal0 = Q.animalSprite;
Q.animalSprite = (a, size = 96, cls = '') => { const url = a && a.id === 'bees' && crop('mining-targets', 'beehive', 192); return url ? img(url, size, cls, a.name) : animal0(a, size, cls); };
/* house and workers */
Q.furnIco = (id, ic) => { const url = FURN[id] && crop('furnishings', id, 96); return url ? img(url, 40, 'furn-art', id) : Q.ico(ic); };
Q.cottageArt = () => { const url = crop('furnishings', 'cottage', 384); return url ? `<img class="painted-image cottage-art" src="${url}" alt="A cottage on the hill" draggable="false">` : ''; };
Q.workerArt = skill => { const id = skill + '-worker', url = FURN[id] && crop('furnishings', id, 128); return url ? img(url, 44, 'worker-art', skill + ' worker') : ''; };

/* ---------- utility icons replace the remaining line icons (including distinct combat skills) ---------- */
function installIcons() {
  const rules = Object.keys(M['utility-icons'].e).filter(id => id in Q.ICONS).map(id => {
    const url = crop('utility-icons', id, 96); if (!url) return '';
    return `.pxi-${id}{background-image:url(${url})!important;background-size:contain!important;background-position:center!important;background-repeat:no-repeat!important;-webkit-mask-image:none!important;mask-image:none!important;background-color:transparent!important;image-rendering:auto!important}`;
  }).join('');
  const st = document.createElement('style'); st.id = 'art-completion-icons'; st.textContent = rules; document.head.appendChild(st);
}

/* ---------- town landscapes, with each project's damaged or restored piece composited in place ---------- */
const PLACES = { willowbrook: { inn: .12, well: .88 } };
const RESTORE = Object.keys(M).filter(s => s.startsWith('restoration'));
const pieceOf = id => { for (const s of RESTORE) if (M[s].e[id]) return { sheet: s, rect: M[s].e[id], place: (M[s].p || {})[id] }; return null; };
const pieceX = (town, id) => (PLACES[town] && PLACES[town][id]) || .87;
const sceneCache = {};
const scene0 = Q.sceneUrl;
Q.sceneUrl = id => {
  const L = M.landscapes.e[id]; load('landscapes'); RESTORE.forEach(load);
  if (!L || !ready.landscapes) return scene0 ? scene0(id) : null;
  const projects = Q.S && Q.S.projects || {}, pieces = Object.keys(D.PROJECTS || {}).filter(k => D.PROJECTS[k].town === id && (pieceOf(k + '-before') || pieceOf(k + '-after')));
  const restoreReady = RESTORE.every(s => ready[s]);
  const key = id + ':' + (restoreReady ? pieces.map(k => k + (projects[k] ? 1 : 0)).join(',') : 'base');
  if (sceneCache[key]) return sceneCache[key];
  const c = document.createElement('canvas'); c.width = L[2]; c.height = L[3]; const x = c.getContext('2d');
  x.imageSmoothingQuality = 'high'; x.drawImage(imgs.landscapes, L[0], L[1], L[2], L[3], 0, 0, L[2], L[3]);
  /* a damaged piece before the project, the restored piece after (relic displays only have an "after") */
  if (restoreReady) for (const k of pieces) {
    const pc = pieceOf(k + (projects[k] ? '-after' : '-before')); if (!pc) continue;
    const r = pc.rect, pl = pc.place || {}, h = c.height * (pl.h || .42), w = r[2] * h / r[3], cx = c.width * (pl.x != null ? pl.x : pieceX(id, k));
    x.drawImage(imgs[pc.sheet], r[0], r[1], r[2], r[3], cx - w / 2, c.height * (pl.base || .93) - h, w, h);
  }
  /* a short blob URL: landscapes go into a CSS custom property, which cannot hold a large data URL */
  const data = c.toDataURL('image/jpeg', .9), bin = atob(data.slice(data.indexOf(',') + 1)), bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return (sceneCache[key] = URL.createObjectURL(new Blob([bytes], { type: 'image/jpeg' })));
};

/* the icons and landscapes are needed straight away; item sheets load on first use */
load('utility-icons'); load('landscapes'); RESTORE.forEach(load);
})();
