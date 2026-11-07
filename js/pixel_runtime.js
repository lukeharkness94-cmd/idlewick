/* Idlewick: the pixel-art runtime. Installed last, it routes every art request in the game to the code-drawn sprites
   in pixelart.js, pixel_items.js, pixel_creatures.js and pixel_world.js. There are no image files and no fallback to
   painted art: DQ.pixelArt.coverage() lists any id without a finished design (it is empty). */
(() => {
const Q = window.DQ, D = Q.data, UI = Q.ui, A = Q.pixelArt; if (!A) return;
const esc = Q.esc || (s => String(s));
const img = (u, w, h, box, cls = '', alt = '') => A.img(u, w, h, box, cls, alt);

/* ---------- items and equipment ---------- */
Q.itemIco = it => { const u = it && A.itemUrl(it.id); return u ? img(u, 16, 16, 48, 'item-art', it.name || '') : ''; };
Q.gearIconUrl = id => A.itemUrl(id);
Q.gearIco = (id, cls = '') => { const u = A.itemUrl(id); return u ? img(u, 16, 16, 48, 'gico ' + cls, (D.ITEMS[id] || {}).name || '') : ''; };
/* the shared entry point for larger art: items, creatures, gathering spots, trees, rocks, skills, plants */
Q.artImage = (kind, id, size = 96, cls = '', alt = '') => {
  const item = D.ITEMS[id];
  if (kind === 'item') return item ? img(A.itemUrl(id), 16, 16, size, cls, alt || item.name) : '';
  if (kind === 'creature' || kind === 'thieve') { const k = String(id).replace(/^wild_/, ''), u = A.hasCreature(k) ? A.creatureUrl(k) : null; return u ? img(u, 32, 32, size, cls, alt || k) : ''; }
  if (kind === 'fish') { const s = A.url('fishnode:' + id, () => A.fishLarge(id)); return s ? img(s, 32, 16, size, cls, alt || id) : ''; }
  if (kind === 'wood' || kind === 'tree') return img(A.treeUrl(id), 32, 48, size * 1.1, cls, alt || id);
  if (kind === 'mine' || kind === 'rock') return img(A.rockUrl(id), 32, 32, size, cls, alt || id);
  if (kind === 'skill' && size >= 32 && A.emblemUrl && A.emblemUrl(id)) return img(A.emblemUrl(id), 32, 32, size, cls, alt || id);
  if (kind === 'skill' || kind === 'icon') { const u = A.iconUrl(id); return u ? img(u, 16, 16, size, cls, alt || id) : ''; }
  if (kind === 'plant') { const [stage, col] = String(id).split('|'), c = D.CROPS.find(x => x.col === col); return img(A.plantUrl(+stage, c ? c.id : null), 16, 16, size, cls, alt); }
  return '';
};
Q.monSprite = (m, size = 96, cls = '') => Q.artImage('creature', m.id, size, cls, m.name);
Q.petSprite = (p, size = 48, cls = '') => { const id = A.hasCreature(p.id) ? p.id : p.mon || p.id; return Q.artImage('creature', id, size, cls, p.name); };
Q.animalSprite = (a, size = 96, cls = '') => Q.artImage('creature', a.id, size, cls, a.name);
/* crop plots: soil, sprout, young plant, mature (the live binder in ui_extra.js re-renders through this) */
Q.plantSprite = (stage, col, size = 96, cls = '') => { const c = D.CROPS.find(x => x.col === col); const alt = !c ? 'Empty soil' : c.name + (stage >= 3 ? ' ready to harvest' : stage === 0 ? ' just sown' : ' growing'); return img(A.plantUrl(c ? stage : 0, c ? c.id : null), 16, 16, size, cls, alt); };
Q.trophyArt = (id, size = 88, cls = '') => { const u = A.trophyUrl(id, !!(Q.understood && Q.understood(id))); return u ? img(u, 40, 44, size, 'trophy-art ' + cls, (D.MON[id] ? D.MON[id].name : id) + ' trophy') : ''; };
Q.furnIco = (id, ic) => img(A.furnUrl(id, ic), 16, 16, 40, 'furn-art', id);
Q.cottageArt = () => `<img class="pxa cottage-art" src="${A.cottageUrl()}" width="192" height="160" alt="A cottage on the hill" draggable="false">`;
Q.workerArt = skill => img(A.workerUrl(skill), 32, 32, 44, 'worker-art', skill + ' worker');

/* ---------- town scenes, with every restoration project in its current state ---------- */
const scenes = {};
Q.sceneUrl = id => { const pj = (Q.S && Q.S.projects) || {}, key = id + ':' + Object.keys(D.PROJECTS || {}).filter(k => D.PROJECTS[k].town === id).map(k => pj[k] ? 1 : 0).join('');
  if (!scenes[key]) scenes[key] = A.sceneFor(id, pj).toDataURL(); return scenes[key]; };
UI.scene = (id, cls = '') => `<img class="scene pxscene pxa ${cls}" src="${Q.sceneUrl(id)}" alt="" draggable="false">`;

/* ---------- the hero ---------- */
const nearest = (list, hex) => { if (!hex) return 0; const h = c => [1, 3, 5].map(i => parseInt(c.slice(i, i + 2), 16)); const a = h(hex); let best = 0, bd = 1e9; list.forEach((c, i) => { const b = h(c), d = a.reduce((s, v, k) => s + (v - b[k]) ** 2, 0); if (d < bd) { bd = d; best = i; } }); return best; };
const slotSpec = (slot, id) => { const it = id && D.ITEMS[id]; if (!it) return null; const col = it.col || '#999999';
  if (slot === 'head') return { type: id === 'hollow_crown' ? 'crown' : id === 'chief_helm' ? 'horned' : /robe_/.test(id) ? 'hood' : (it.lth || /coif/.test(id)) ? 'coif' : 'helm', col };
  if (slot === 'body') return { type: /robe_/.test(id) ? 'robe' : (it.lth || /vest/.test(id)) ? 'vest' : 'plate', col };
  if (slot === 'legs') return { type: /robe_/.test(id) ? 'robe' : (it.lth || /chaps/.test(id)) ? 'chaps' : 'plate', col };
  if (slot === 'shield') return { col };
  if (slot === 'weapon') { const type = it.style === 'ranged' ? 'bow' : it.style === 'magic' ? 'staff' : id === 'barnacle_cutlass' ? 'cutlass' : /dagger/.test(id) ? 'dagger' : /hammer/.test(id) ? 'hammer' : 'sword'; return { type, col, orb: type === 'staff' ? (id === 'witch_staff' ? '#b79cff' : '#8fc0ff') : null }; }
  return null; };
const heroOpts = (look, extra = {}) => {
  const o = Q.heroLook ? Q.heroLook(look || (Q.S && Q.S.look) || {}) : { eq: {} }, eq = o.eq || {}, L = look || (Q.S && Q.S.look) || {};
  return Object.assign({ face: L.face || 'bright', skin: nearest(D.LOOKS.skin, o.skin), hair: nearest(D.LOOKS.hair, o.hair), tunic: o.tunic || '#3f7fbf',
    helm: slotSpec('head', eq.head), body: slotSpec('body', eq.body), legs: slotSpec('legs', eq.legs), shield: slotSpec('shield', eq.shield), weapon: slotSpec('weapon', eq.weapon), cape: o.cape ? o.cape.col : null }, extra);
};
const heroUrl = (look, extra) => A.heroUrl(heroOpts(look, extra));
Q.heroFigureUrl = look => heroUrl(look);
Q.heroWorkFigureUrl = look => heroUrl(look, { shield: null, weapon: null });
Q.heroCanvas = (look, scale = 1) => { const c = document.createElement('canvas'); c.width = 48 * scale; c.height = 64 * scale; const x = c.getContext('2d'); x.imageSmoothingEnabled = false; const im = new Image(); im.src = heroUrl(look); x.drawImage(im, 0, 0, c.width, c.height); return c; };
Q.heroBustUrl = look => { const k = 'bust:' + JSON.stringify(heroOpts(look)); return A.url(k, () => { const full = A.hero(heroOpts(look)), s = A.Spr(16, 16); for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) { const p = full.px[y * 24 + x + 4]; if (p) s.px[y * 16 + x] = p; } return s; }); };
Q.heroUrl = Q.heroBustUrl;
UI.portrait = (size = 48, cls = '') => `<span class="portrait px-portrait ${cls}" style="width:${size}px;height:${size}px"><img class="pxa" src="${Q.heroBustUrl(Q.S && Q.S.look)}" width="${size}" height="${size}" alt="Your hero"></span>`;
/* combat: the hero and foe as whole sprites; attacks move the whole figure, hits flash */
Q.battleHero = () => `<span class="battle-rig hero-rig px-hero encounter-hero" role="img" aria-label="Your equipped hero"><span class="rig-torso"><img class="pxa" src="${Q.heroFigureUrl(Q.S.look)}" width="144" height="192" alt="" draggable="false"></span></span>`;
Q.battleFoe = m => `<span class="battle-rig foe-rig px-foe" role="img" aria-label="${esc(m.name)} ready for battle" data-creature="${m.id}"><span class="foe-torso">${Q.artImage('creature', m.id, 192, '', m.name)}</span></span>`;
const pose0 = Q.poseBattle;
Q.poseBattle = (avatar, style, phase, animate) => { const root = avatar && avatar.querySelector('.px-hero'); if (!root) return pose0 ? pose0(avatar, style, phase, animate) : false; if (Q.S.settings.reduceFx) return true;
  const attack = phase === 'attack', dir = attack ? 1 : -1; animate(root, [{ transform: 'translateX(0)' }, { transform: `translateX(${-dir * 4}px)`, offset: .25 }, { transform: `translateX(${dir * 14}px)`, offset: .5 }, { transform: 'translateX(0)' }], { duration: attack ? (Q.battleTiming ? Q.battleTiming.duration : 420) : 340, easing: 'ease-in-out' }); return true; };

/* ---------- icons: every .pxi class gets its pixel icon; ids without one keep the code-drawn line glyph ---------- */
const installIcons = () => {
  const rules = Object.keys(Q.ICONS || {}).map(id => { const u = A.iconUrl(id); return u ? `.pxi-${id}{background:transparent url(${u}) center/contain no-repeat!important;-webkit-mask:none!important;mask:none!important;image-rendering:pixelated!important}` : ''; }).join('');
  let st = document.getElementById('pixel-icons'); if (!st) { st = document.createElement('style'); st.id = 'pixel-icons'; document.head.appendChild(st); } st.textContent = rules;
};
installIcons(); document.addEventListener('DOMContentLoaded', installIcons);

/* ---------- coverage: every id the game can ask for has a finished design ---------- */
A.coverage = () => {
  const miss = [];
  for (const id of Object.keys(D.ITEMS)) if (!A.itemSprite(id)) miss.push('item:' + id);
  for (const m of D.MONLIST) if (!A.hasCreature(m.id)) miss.push('creature:' + m.id);
  for (const p of D.PETS || []) if (!A.hasCreature(p.id) && !A.hasCreature(p.mon)) miss.push('pet:' + p.id);
  for (const n of D.NODES.thieve || []) if (!A.hasCreature(n.id)) miss.push('townsfolk:' + n.id);
  for (const a of D.ANIMALS || []) if (!A.hasCreature(a.id)) miss.push('animal:' + a.id);
  for (const n of D.NODES.fish || []) if (!A.fishLarge(n.id)) miss.push('fish:' + n.id);
  for (const n of D.NODES.wood || []) if (!A.TREE[n.id]) miss.push('tree:' + n.id);
  for (const n of D.NODES.mine || []) if (!A.ORE[n.id]) miss.push('rock:' + n.id);
  for (const t of D.TOWNS) if (!A.TOWN[t.id]) miss.push('scene:' + t.id);
  for (const s of D.SKILLS) if (!A.iconSprite(s.id)) miss.push('skill-icon:' + s.id);
  for (const c of D.CROPS) for (let st = 0; st <= 3; st++) if (!A.plantStage(st, c.id)) miss.push('plant:' + c.id + ':' + st);
  return miss;
};

/* ---------- whole-number scales everywhere ----------
   CSS sizes boxes for layout; a pixel sprite inside must still be drawn at an exact multiple of its own size, or its
   pixels smear (1.5x) or vanish (0.94x) and it reads as low-res. After any change to the page, each sprite is snapped
   to the nearest whole multiple of its native size (large scenes round down so they never overflow), and kept from
   being squeezed by flex layouts. Reads first, then writes, once per frame. */
const NAT_ICON = 16;
const snapAll = root => {
  const els = [...(root || document).querySelectorAll('img.pxa, i.ic.pxi')], plan = [];
  for (const el of els) {
    const lg = el.tagName === 'IMG' && el.naturalWidth && A.logicalOf && A.logicalOf(el.currentSrc || el.src), nat = el.tagName === 'IMG' ? (lg ? lg[0] : el.naturalWidth) : NAT_ICON, natH = el.tagName === 'IMG' ? (lg ? lg[1] : el.naturalHeight) : NAT_ICON;
    if (!nat) { if (el.tagName === 'IMG' && !el.dataset.snapWait) { el.dataset.snapWait = 1; el.addEventListener('load', () => queue(), { once: true }); } continue; }
    const w = el.offsetWidth; if (!w) continue;
    const hh = el.offsetHeight, byH = hh && hh / natH < w / nat, ratio = byH ? hh / natH : w / nat, k = nat >= 64 || byH ? Math.max(1, Math.floor(ratio + .001)) : Math.max(1, Math.round(ratio - .01));
    const want = nat * k; if (Math.abs(w - want) < .5 && el.dataset.snapped) continue;
    plan.push([el, want, natH * k]);
  }
  for (const [el, w, h] of plan) { el.style.setProperty('width', w + 'px', 'important'); el.style.setProperty('height', h + 'px', 'important'); el.style.setProperty('flex-shrink', '0'); el.style.setProperty('max-width', 'none', 'important'); el.style.setProperty('max-height', 'none', 'important'); el.dataset.snapped = 1; }
};
let pending = 0; const queue = () => { if (pending) return; pending = requestAnimationFrame(() => { pending = 0; snapAll(document); }); };
if (typeof MutationObserver === 'function' && typeof document !== 'undefined' && document.documentElement) {
  const start = () => { new MutationObserver(queue).observe(document.body, { childList: true, subtree: true }); queue(); };
  if (document.body) start(); else document.addEventListener('DOMContentLoaded', start);
  addEventListener('resize', () => { document.querySelectorAll('[data-snapped]').forEach(el => { el.style.removeProperty('width'); el.style.removeProperty('height'); delete el.dataset.snapped; }); queue(); });
}
Q.snapPixels = snapAll;
})();
