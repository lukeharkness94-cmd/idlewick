/* Idlewick: the hearth (owner, 27 Nov 2026: "cosy, logical and like a warm dashboard we can feel at home in"; the Home
   view of your own room). Home opens inside: your hero by the fire, your companion asleep on the rug, a notice board
   with today's goal pinned to it, a desk, a bookshelf, a chest, the map on the wall and a window onto the town as it is
   right now (the hour's light and weather from js/town_life.js). Every object is a way into its page: the note opens
   Quests, the chest your backpack, the bookshelf the Guide, the map the World, the window steps outside to the town
   scene (with its walking townsfolk), the companion its pen. The view is remembered in settings.homeView.
   Drawn in code in the house style at 320 x 240 room pixels, shown at a whole-number scale (3x on desktop, 1x on phones)
   and cropped by its card; the fire, the firelight and the candle move with elapsed time at native refresh; under
   Reduce effects and prefers-reduced-motion they hold still and the room keeps its light. tests/hearth.cjs.
   The room fills up as you play (owner, 27 Nov 2026): boss trophies over the fire, named weapons on a rack, museum
   pieces on a shelf, a basket per beast and letters on the desk (js/hearth_letters.js), each with its own hotspot.
   tests/hearth-life.cjs. */
(() => {
const Q = window.DQ, D = Q.data, UI = Q.ui, A = Q.pixelArt, S = () => Q.S, esc = Q.esc, ico = Q.ico;
if (!A || !A.townPainter) return;
const RW = 320, RH = 280, OY = 40, mix = A.mix; /* the room is drawn 240 tall, OY below a strip of upper wall and a hanging lantern */
const still = () => document.documentElement.classList.contains('calm') || (window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);
/* automated browsers keep the town view (the suite measures it) unless a test asks for the hearth */
Q.homeView = () => { const v = S() && S().settings && S().settings.homeView; if (v) return v; return navigator.webdriver && localStorage.getItem('idlewick.hearth') !== '1' ? 'town' : 'hearth'; };
Q.season = (d = new Date()) => (Q.seasonOverride || ['winter', 'winter', 'spring', 'spring', 'spring', 'summer', 'summer', 'summer', 'autumn', 'autumn', 'autumn', 'winter'][d.getMonth()]);

/* where things stand in the room (room pixels); hotspots and the note use the same numbers */
const SPOTS = {
  window: { x: 206, y: 46, w: 96, h: 72, label: 'Step outside', act: ['homeview', 'town'] },
  board: { x: 152, y: 52, w: 46, h: 62, label: "Today's goal: open Quests", act: ['go', 'quests'] },
  shelf: { x: 6, y: 62, w: 40, h: 114, label: 'Bookshelf: the Guide', act: ['go', 'bestiary'] },
  map: { x: 6, y: 20, w: 40, h: 36, label: 'Map of the world', act: ['go', 'map'] },
  chest: { x: 162, y: 182, w: 38, h: 26, label: 'Chest: your backpack', act: ['go', 'character'] },
  desk: { x: 208, y: 146, w: 92, h: 40, label: 'Desk: activity and goals', act: ['go', 'activity'] },
  pet: { x: 92, y: 196, w: 40, h: 26, label: 'Your companion', act: ['go', 'beastmastery'] }
};
/* where letters wait: on the desk, right of the inkpot (js/hearth_letters.js) */
const LETTER = { x: 274, y: 137, w: 22, h: 16 };
const FIRE = { x: 72, y: 128, w: 56, h: 44 }, HERO = { x: 140, y: 172 }, PET = { x: 96, y: 216 };
/* a beast's own sprite where it has one, else the creature it came from (the same choice as DQ.petSprite) */
const petArt = id => { const p = D.PET[id]; if (!p || !A.creatureUrl) return null; const k = String(A.hasCreature && A.hasCreature(p.id) ? p.id : p.mon || p.id).replace(/^wild_/, ''); return A.hasCreature && !A.hasCreature(k) ? null : A.creatureUrl(k); };

/* ---------- the room fills up as you play (owner, 27 Nov 2026) ----------
   Boss trophies over the fireplace, the named weapons you own on a rack under the rafters, museum pieces on a wall
   shelf and a basket for every beast you keep (the companion with you still sleeps on the rug). Each has a fixed slot;
   a row that runs out of room shows "+N" in its last slot. Everything is read from the save; the dates of first boss
   victories are kept in S.trophies from now on (older victories just say "beaten"). */
const TROPHY = { grubnash: 'tusk', oldtusk: 'other tusk', barnacle: 'hat', frostmaw: 'tooth', morwenna: 'lantern', pyrrhax: 'scale', zephyrion: 'tail feather', hollowking: 'circlet' };
const dayOf = t => t ? new Date(t).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : '';
(Q.killHooks = Q.killHooks || []).push(m => { if (!m.boss || Q.forecasting || (S().towns[m.town] && S().towns[m.town].boss)) return; const T = S().trophies = S().trophies || {}; if (!T[m.id]) T[m.id] = Date.now(); });
const possess = n => n + (/s$/.test(n) ? '’' : '’s');
const ownedAnywhere = id => (Q.have ? Q.have(id) : 0) > 0 || ((S().bank || {})[id] || 0) > 0 || Object.values(S().equip || {}).includes(id);
/* rows: room-pixel slots (inside the translated room, so the rafter strip has negative y) */
const ROWS = {
  trophy: { slots: [[56, 18], [79, 18], [102, 18], [125, 18], [56, 44], [79, 44], [102, 44], [125, 44]], w: 20, h: 22 },
  rack: { slots: [[110, -24], [131, -24], [152, -24], [173, -24]], w: 16, h: 16 },
  shelf: { slots: [[14, -21], [34, -21], [54, -21], [74, -21]], w: 16, h: 16 },
  bed: { slots: [[206, 208], [244, 208], [282, 208]], w: 30, h: 28 }
};
const CURIO_ART = { hart: ['#f4f4f8', '#c8c8d8'], star: ['#f8e070', '#d8a830'], shrine: ['#a8a49a', '#7a766e'], festival: ['#e0405a', '#4a8ad8'], bard: ['#c8904a', '#8a5a2a'], recipes: ['#b8483a', '#f4ecd8'] };
Q.hearthKeep = () => { const st = S(), out = [];
  const put = (row, list) => { const R = ROWS[row], n = R.slots.length, over = list.length > n;
    list.slice(0, over ? n - 1 : n).forEach((e, i) => out.push(Object.assign({ row, x: R.slots[i][0], y: R.slots[i][1], w: R.w, h: R.h }, e)));
    if (over) { const rest = list.slice(n - 1), [x, y] = R.slots[n - 1]; out.push({ row, key: row + ':more', more: rest.length, x, y, w: R.w, h: R.h, label: `${rest.length} more: ${rest.map(e => e.name).join(', ')}`, act: rest[0].act }); } };
  /* trophies: the main bosses, in the order of the road */
  put('trophy', D.TOWNS.filter(t => st.towns[t.id] && st.towns[t.id].boss && D.MON[t.boss]).map(t => { const m = D.MON[t.boss], nm = (m.boss && m.boss.short) || m.name, at = (st.trophies || {})[m.id];
    return { key: 'trophy:' + m.id, id: m.id, name: nm, label: `${possess(nm)} ${TROPHY[m.id] || 'trophy'} · beaten${at ? ' ' + dayOf(at) : ''}`, act: ['hearthgo', 'guide:' + m.id] }; }));
  /* the named weapons you own, wherever they are kept */
  put('rack', (D.RARE_WEAPONS || []).filter(id => D.ITEMS[id] && ownedAnywhere(id)).map(id => ({ key: 'rack:' + id, id, name: D.ITEMS[id].name, label: `${D.ITEMS[id].name} · ${Object.values(st.equip || {}).includes(id) ? 'in your hand' : (Q.have && Q.have(id)) ? 'in your pack' : 'in the bank'}`, act: ['hearthgo', 'gear:' + id] })));
  /* museum pieces: a medal for each finished wing, then the relics and curiosities you have found */
  const mu = st.museum || {}, got = mu.got || {};
  put('shelf', [].concat((D.WINGS || []).filter(w => (mu.wings || {})[w.id]).map(w => ({ key: 'wing:' + w.id, id: w.id, medal: true, name: w.name, label: `${w.name} complete · ${w.gives}`, act: ['hearthgo', 'museum:'] })),
    Object.values(D.ITEMS).filter(it => it.type === 'relic' && got['r:' + it.id]).map(it => ({ key: 'relic:' + it.id, id: it.id, name: it.name, label: `${it.name} · in the museum since ${dayOf(got['r:' + it.id])}`, act: ['hearthgo', 'museum:r:' + it.id] })),
    (D.CURIOS || []).filter(c => got['x:' + c.id]).map(c => ({ key: 'curio:' + c.id, id: c.id, curio: true, name: c.name, label: `${c.name} · ${c.text}`, act: ['hearthgo', 'museum:x:' + c.id] }))));
  /* a basket for each beast you keep; the companion with you is on the rug */
  const pets = st.pets || {}; put('bed', Object.keys(pets.owned || {}).filter(id => D.PET[id] && id !== pets.active).map(id => ({ key: 'bed:' + id, id, name: D.PET[id].name, label: `${D.PET[id].name} the ${String(D.PET[id].kind || 'beast').toLowerCase()} · asleep in its basket`, act: ['hearthgo', 'beast:' + id] })));
  return out; };
UI.DO.hearthgo = a => { const [k, ...r] = String(a || '').split(':'), id = r.join(':');
  if (k === 'guide' && UI.openGuide) return UI.openGuide(id);
  if (k === 'gear') return Q.go('character');
  if (k === 'museum') { UI.museumSel = id || null; return Q.go('museum'); }
  if (k === 'beast') { Q.go('beastmastery'); if (UI.DO.beastselect) UI.DO.beastselect(id); } };
/* drawing the keepsakes into the room (room pixels, whole scale) */
const head = img => { const c = document.createElement('canvas'); c.width = img.naturalWidth; c.height = img.naturalHeight; const g = c.getContext('2d'); g.drawImage(img, 0, 0);
  const d = g.getImageData(0, 0, c.width, c.height).data; let x0 = c.width, x1 = -1, y0 = c.height; for (let y = 0; y < c.height; y++) for (let x = 0; x < c.width; x++) if (d[(y * c.width + x) * 4 + 3] > 40) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); }
  return x1 < 0 ? null : { c, sx: Math.max(0, Math.min(c.width - 16, Math.round((x0 + x1) / 2) - 8)), sy: y0 }; };
const drawKeep = async (x, P, list) => { const { f, ell } = P, wood = '#8a5e3a', woodDk = '#5e3e24', woodLt = '#a87a4e', brass = '#c8a050';
  /* the rack and the shelf under the rafters, drawn whenever they hold something */
  if (list.some(e => e.row === 'rack')) { f(woodDk, 106, -6, 86, 4); f(woodLt, 106, -6, 86, 1); for (const [sx] of ROWS.rack.slots) { f('#3a2a1a', sx + 3, -9, 2, 3); f('#3a2a1a', sx + 11, -9, 2, 3); } }
  if (list.some(e => e.row === 'shelf')) { f(woodDk, 12, -5, 82, 3); f(woodLt, 12, -5, 82, 1); f(woodDk, 16, -2, 2, 5); f(woodDk, 88, -2, 2, 5); }
  for (const e of list) {
    if (e.row === 'trophy') { const X = e.x, Y = e.y;
      /* a shield-shaped plaque: dark rim, lit top-left, a point at the bottom */
      for (let j = 0; j < 22; j++) { const inset = j < 15 ? (j === 0 ? 2 : j === 1 ? 1 : 0) : Math.round((j - 14) * 1.3); if (inset * 2 >= 20) continue; f(woodDk, X + inset, Y + j, 20 - inset * 2, 1); if (j > 0 && j < 20) f(j < 3 ? woodLt : wood, X + inset + 1, Y + j, Math.max(0, 18 - inset * 2), 1); }
      f(mix(wood, '#ffffff', .2), X + 2, Y + 2, 1, 10);
      if (e.more) { f(brass, X + 6, Y + 8, 8, 6); f('#f4dc8a', X + 6, Y + 8, 8, 1); continue; }
      const im = await load(A.creatureUrl ? A.creatureUrl(e.id) : null), h = im && head(im);
      if (h) x.drawImage(h.c, h.sx, h.sy, 16, 13, X + 2, Y + 3, 16, 13);
      f(brass, X + 7, Y + 17, 6, 2); f('#f4dc8a', X + 7, Y + 17, 6, 1); }
    else if (e.row === 'rack' || (e.row === 'shelf' && !e.medal && !e.curio)) { if (e.more) { f(brass, e.x + 4, e.y + 8, 8, 6); f('#f4dc8a', e.x + 4, e.y + 8, 8, 1); continue; }
      const im = await load(A.itemUrl ? A.itemUrl(e.id) : null); if (im) x.drawImage(im, 0, 0, 16, 16, e.x, e.y, 16, 16); }
    else if (e.medal) { const X = e.x + 4, Y = e.y + 2; f('#b8483a', X + 2, Y, 2, 6); f('#3a6ac8', X + 4, Y, 2, 6); ell('#8a6a2a', X + 4, Y + 10, 5, 5); ell(brass, X + 4, Y + 10, 4, 4); f('#f4dc8a', X + 2, Y + 8, 2, 1); f('#8a6a2a', X + 3, Y + 10, 3, 1); }
    else if (e.curio) { const [a, b] = CURIO_ART[e.id] || ['#d8c8a0', '#8a7a5a'], X = e.x + 3, Y = e.y + 4;
      if (e.id === 'hart') { f(a, X + 2, Y + 4, 6, 8); f(b, X + 2, Y + 10, 6, 2); f(a, X, Y, 1, 4); f(a, X + 9, Y, 1, 4); f(a, X + 1, Y + 2, 2, 1); f(a, X + 7, Y + 2, 2, 1); f('#3a3030', X + 3, Y + 6, 1, 1); f('#3a3030', X + 6, Y + 6, 1, 1); }
      else if (e.id === 'star') { f('#4a4a5a', X, Y + 9, 10, 3); f(a, X + 4, Y + 2, 2, 7); f(a, X + 1, Y + 5, 8, 2); f('#fff8d0', X + 4, Y + 4, 1, 1); f(b, X + 5, Y + 7, 1, 2); }
      else if (e.id === 'shrine') { f(b, X + 1, Y + 2, 8, 10); f(a, X + 2, Y + 3, 6, 9); f(b, X, Y + 1, 10, 2); f('#f0d060', X + 4, Y + 6, 2, 3); }
      else if (e.id === 'festival') { f(a, X + 3, Y, 4, 4); f(b, X + 1, Y + 4, 3, 8); f(a, X + 6, Y + 4, 3, 8); f(mix(a, '#000000', .25), X + 4, Y + 1, 2, 2); }
      else if (e.id === 'bard') { ell(a, X + 4, Y + 9, 4, 3); f(b, X + 4, Y, 2, 8); f(b, X + 3, Y, 4, 1); f('#3a2414', X + 4, Y + 9, 2, 1); f('#f4ecd8', X + 5, Y + 1, 1, 7); }
      else { f(a, X, Y + 3, 10, 9); f(mix(a, '#000000', .3), X, Y + 11, 10, 1); f(b, X + 1, Y + 4, 8, 6); f(a, X + 5, Y + 3, 1, 8); } }
    else if (e.row === 'bed') { const X = e.x, base = e.y + 26;
      /* the sleeper first, then the basket's front rim over its feet */
      if (!e.more) { const im = await load(petArt(e.id)); if (im) x.drawImage(im, 0, 0, 32, 32, X - 1, base - 31, 32, 32); }
      else { ell('#c8b0d0', X + 15, base - 6, 11, 3); ell('#e0cce8', X + 13, base - 7, 6, 2); }
      ell('#7a5230', X + 15, base - 3, 15, 4); ell('#a87a4a', X + 15, base - 4, 14, 3); for (let q = X + 3; q < X + 28; q += 3) f('#7a5230', q, base - 6, 1, 4); f('#c89a62', X + 2, base - 7, 26, 1); f('#5e3e24', X + 4, base, 22, 1); } } };

/* ---------- the room itself (redrawn when the quarter hour, weather, season or companion changes) ---------- */
const load = src => new Promise(r => { if (!src) return r(null); const im = new Image(); im.onload = () => r(im); im.onerror = () => r(null); im.src = src; });
const room = async (town, light, weather, season, petId, keep = [], letters = 0) => {
  const c = document.createElement('canvas'); c.width = RW; c.height = RH; const x = c.getContext('2d'), P = A.townPainter(x, RW, RH), { f, ell } = P;
  const plaster = '#d8c6a0', beam = '#5a3e26', beamLt = '#7a5636', stone = '#8a8278', stoneDk = '#615a52', wood = '#8a5e3a', woodDk = '#5e3e24', woodLt = '#a87a4e';
  /* the upper wall and the rafters, with a lantern on a chain */
  f(mix(plaster, '#5a3e26', .18), 0, 0, RW, OY); for (const bx of [0, 96, 192, 288]) { f(beam, bx, 0, 10, OY); f(beamLt, bx, 0, 2, OY); } f(beam, 0, 6, RW, 6); f(beamLt, 0, 6, RW, 1);
  f('#3a3030', 250, 12, 1, 22); f('#3a3030', 245, 34, 11, 2); f('#f6d880', 247, 36, 7, 8); f('#3a3030', 246, 36, 1, 8); f('#3a3030', 254, 36, 1, 8); f('#3a3030', 245, 44, 11, 2);
  x.save(); x.translate(0, OY);
  /* wall: plaster between timber, a ceiling beam, a skirting board */
  f(plaster, 0, 0, RW, 176); for (let i = 0; i < 260; i++) f(mix(plaster, i % 2 ? '#ffffff' : '#7a5a3a', .12), (i * 97) % RW, (i * 53) % 172, 2, 1);
  f(beam, 0, 0, RW, 12); f(beamLt, 0, 0, RW, 2); f(mix(beam, '#000000', .3), 0, 11, RW, 1);
  for (const bx of [0, 48, 148, 200, 304]) { f(beam, bx, 12, 8, 164); f(beamLt, bx, 12, 2, 164); }
  f(woodDk, 0, 172, RW, 4); f(woodLt, 0, 172, RW, 1);
  /* floor: planks catching the firelight */
  for (let y = 176, k = 0; y < RH; y += 8, k++) { f(k % 2 ? wood : mix(wood, '#000000', .08), 0, y, RW, 8); f(woodDk, 0, y + 7, RW, 1); for (let q = (k * 37) % 60; q < RW; q += 60 + (k % 3) * 10) f(woodDk, q, y, 1, 7); }
  /* the window onto the town: the scene's own pixels, in the hour's light and weather */
  const W = SPOTS.window, scene = await load(Q.sceneUrl(town));
  f(beam, W.x - 4, W.y - 4, W.w + 8, W.h + 8); f(beamLt, W.x - 4, W.y - 4, W.w + 8, 1);
  if (scene) x.drawImage(scene, 272, 112, W.w, W.h, W.x, W.y, W.w, W.h); else f('#9cc8e8', W.x, W.y, W.w, W.h);
  if (light) { x.save(); x.globalCompositeOperation = 'multiply'; x.fillStyle = `rgb(${light.tint.join(',')})`; x.fillRect(W.x, W.y, W.w, W.h); x.restore();
    if (light.dark > .5) for (let i = 0; i < 14; i++) f(`rgba(255,250,232,${(light.dark - .5) * 1.6})`, W.x + (i * 41) % W.w, W.y + (i * 13) % 20, 1, 1); }
  if (weather === 'rain') for (let i = 0; i < 26; i++) f('rgba(210,224,244,.6)', W.x + (i * 29) % W.w, W.y + (i * 17) % (W.h - 3), 1, 3);
  if (weather === 'snow' || season === 'winter') { for (let i = 0; i < 22; i++) f('rgba(255,255,255,.85)', W.x + (i * 23) % W.w, W.y + (i * 31) % W.h, 1, 1); f('#f4f8fc', W.x, W.y + W.h - 3, W.w, 3); }
  f(beam, W.x + W.w / 2 - 1, W.y, 3, W.h); f(beam, W.x, W.y + W.h / 2 - 1, W.w, 3);
  f('#b8483a', W.x - 10, W.y - 6, 9, W.h + 14); f('#8a2e26', W.x - 4, W.y - 6, 3, W.h + 14); f('#b8483a', W.x + W.w + 1, W.y - 6, 9, W.h + 14); f('#8a2e26', W.x + W.w + 1, W.y - 6, 3, W.h + 14);
  f(woodLt, W.x - 6, W.y + W.h + 2, W.w + 12, 4); f(woodDk, W.x - 6, W.y + W.h + 6, W.w + 12, 1);
  /* fireplace: a stone surround, the mantel, the hearth stone */
  f(stone, 52, 70, 96, 106); for (let y = 72; y < 174; y += 6) for (let q = 52 + ((y / 6) % 2) * 6; q < 146; q += 12) { f(mix(stone, '#ffffff', .12), q, y, 11, 1); f(stoneDk, q + 11, y, 1, 6); f(stoneDk, q, y + 5, 12, 1); }
  f(stoneDk, 54, 14, 92, 56); for (let y = 16; y < 70; y += 6) for (let q = 54 + ((y / 6) % 2) * 6; q < 144; q += 12) f(mix(stoneDk, '#000000', .2), q + 11, y, 1, 6);
  f('#2a1a14', FIRE.x, FIRE.y, FIRE.w, FIRE.h); f('#1a100c', FIRE.x + 4, FIRE.y + 4, FIRE.w - 8, FIRE.h - 8);
  f(woodDk, 46, 98, 108, 8); f(woodLt, 46, 98, 108, 2); f(mix(woodDk, '#000000', .3), 46, 105, 108, 1);
  f('#6a6a74', 44, 172, 112, 6); f('#8a8a94', 44, 172, 112, 1);
  f('#4a2e1e', FIRE.x + 8, FIRE.y + FIRE.h - 8, 40, 5); f('#6a4228', FIRE.x + 12, FIRE.y + FIRE.h - 12, 32, 5);
  /* on the mantel: a candle, a jar, a little clock; the season's own touch */
  f('#f0ead8', 60, 88, 4, 10); f('#e8b048', 61, 85, 2, 3); f('#6a8aa8', 120, 90, 8, 8); f('#9ab8d0', 121, 90, 2, 4); f('#c8a050', 96, 88, 10, 10); f('#f4ecd8', 98, 90, 6, 6); f('#3a2414', 100, 92, 1, 3); f('#3a2414', 101, 93, 2, 1);
  if (season === 'winter') { for (let q = 48; q < 152; q += 4) { f('#2f6a3a', q, 96, 4, 3); if (q % 12 === 0) f('#c8382e', q + 1, 97, 2, 2); } }
  if (season === 'autumn') { ell('#d8782a', 36, 170, 7, 5); ell('#e8923a', 34, 168, 3, 2); f('#5a7a3a', 36, 164, 1, 2); ell('#c8a040', 156, 171, 5, 4); f('#5a7a3a', 156, 166, 1, 2); }
  if (season === 'spring' || season === 'summer') { f('#6a8aa8', 280, 136, 6, 8); for (const [dx, col] of [[-2, '#e0607a'], [3, '#f0d060'], [7, '#f4f0f4'], [1, season === 'summer' ? '#f0a030' : '#a07ae0']]) { f('#5a8a4a', 282 + dx / 2, 130, 1, 6); f(col, 280 + dx, 127, 3, 3); } }
  /* map on the wall, rolled at the edges */
  const M = SPOTS.map; f('#e8d8b0', M.x + 2, M.y + 2, M.w - 4, M.h - 4); f('#c8b088', M.x, M.y, 3, M.h); f('#c8b088', M.x + M.w - 3, M.y, 3, M.h);
  f('#8ab06a', M.x + 6, M.y + 8, 14, 10); f('#6aa8d8', M.x + 22, M.y + 6, 10, 20); f('#8a909a', M.x + 8, M.y + 20, 8, 8); f('#b8483a', M.x + 12, M.y + 12, 2, 2); f('#8a6a42', M.x + 14, M.y + 14, 10, 1);
  /* bookshelf */
  const B = SPOTS.shelf; f(woodDk, B.x, B.y, B.w, B.h); f(wood, B.x + 2, B.y + 2, B.w - 4, B.h - 4);
  const books = ['#7a3a2a', '#3a5a7a', '#5a7a3a', '#8a6a2a', '#5a3a6a', '#2a4a4a', '#9a4a3a'];
  for (let s = 0; s < 4; s++) { const sy = B.y + 6 + s * 27; f(woodDk, B.x + 2, sy + 22, B.w - 4, 3); for (let q = B.x + 4, k = s; q < B.x + B.w - 6; k++) { const bw = 3 + (k % 3), bh = 14 + ((k * 5) % 7); f(books[k % books.length], q, sy + 22 - bh, bw, bh); f(mix(books[k % books.length], '#ffffff', .25), q, sy + 22 - bh, 1, bh); q += bw + 1; } }
  /* notice board with pins (the goal note itself is a card laid over it) */
  const N = SPOTS.board; f(woodDk, N.x, N.y, N.w, N.h); f('#b08a5a', N.x + 3, N.y + 3, N.w - 6, N.h - 6); for (let i = 0; i < 40; i++) f('#9a764a', N.x + 4 + (i * 13) % (N.w - 8), N.y + 4 + (i * 7) % (N.h - 8), 1, 1);
  f('#f4ecd8', N.x + 6, N.y + 40, 14, 12); f('#e8dcb8', N.x + 26, N.y + 44, 12, 10); f('#c8382e', N.x + 12, N.y + 40, 1, 1); f('#3a6ac8', N.x + 31, N.y + 44, 1, 1);
  /* desk under the window: candle, inkpot and quill, an open book */
  const K = SPOTS.desk; f(woodDk, K.x, K.y + 4, K.w, 5); f(woodLt, K.x, K.y + 4, K.w, 1); f(woodDk, K.x + 4, K.y + 9, 4, 28); f(woodDk, K.x + K.w - 8, K.y + 9, 4, 28);
  f('#f4ecd8', K.x + 30, K.y - 2, 22, 6); f('#d8ccb0', K.x + 41, K.y - 2, 1, 6); f('#2a2a3a', K.x + 60, K.y, 5, 4); f('#f4f4f4', K.x + 63, K.y - 8, 1, 8); f('#f0ead8', K.x + 10, K.y - 8, 4, 12);
  /* chest */
  const C = SPOTS.chest; f(woodDk, C.x, C.y + 6, C.w, C.h - 6); f(wood, C.x + 2, C.y + 8, C.w - 4, C.h - 10); f(woodDk, C.x - 1, C.y, C.w + 2, 8); f(woodLt, C.x, C.y + 1, C.w, 2); f('#c8a050', C.x + C.w / 2 - 2, C.y + 8, 4, 5); f('#8a6a2a', C.x + 4, C.y, 3, C.h); f('#8a6a2a', C.x + C.w - 7, C.y, 3, C.h);
  /* rug in front of the fire */
  ell('#8a2e26', 100, 214, 62, 14); ell('#b8483a', 100, 214, 56, 11); ell('#d8a050', 100, 214, 44, 7); ell('#b8483a', 100, 214, 38, 5);
  /* the hero by the fire, the companion (or the house cat) asleep on the rug */
  const hero = await load(Q.heroFigureUrl && Q.heroFigureUrl(S().look)); if (hero) x.drawImage(hero, HERO.x, HERO.y - 32, 24, 32);
  const pet = await load(petId ? petArt(petId) : null);
  if (pet) x.drawImage(pet, PET.x, PET.y - 32 + 6, 32, 32);
  else { const cat = '#7a7480'; ell(cat, PET.x + 14, PET.y - 4, 9, 4); f(cat, PET.x + 4, PET.y - 9, 6, 5); f(cat, PET.x + 4, PET.y - 11, 2, 2); f(cat, PET.x + 8, PET.y - 11, 2, 2); f(mix(cat, '#000000', .3), PET.x + 18, PET.y - 3, 8, 2); }
  /* what you have gathered over time, and any letters waiting on the desk (envelopes with a red seal, a little stacked) */
  await drawKeep(x, P, keep);
  for (let i = 0; i < Math.min(3, letters); i++) { const ex = LETTER.x + 2 + i * 2, ey = LETTER.y + 5 - i * 2; f('#c8b890', ex, ey, 13, 8); f('#f4ecd8', ex, ey, 12, 7); f('#d8ccb0', ex, ey, 6, 1); f('#d8ccb0', ex + 6, ey, 6, 1); f('#d8ccb0', ex + 1, ey + 1, 1, 1); f('#d8ccb0', ex + 10, ey + 1, 1, 1); f('#d8ccb0', ex + 2, ey + 2, 1, 1); f('#d8ccb0', ex + 9, ey + 2, 1, 1); f('#c8382e', ex + 5, ey + 2, 3, 3); f('#e86050', ex + 5, ey + 2, 1, 1); }
  x.restore(); return c.toDataURL();
};

/* ---------- the living parts: fire, firelight, embers, candle, sleeping breaths ---------- */
const lights = (x, t, dark, moving) => { x.clearRect(0, 0, RW, RH); x.save(); x.translate(0, OY); const fl = moving ? .5 + .5 * Math.sin(t * 9) * Math.sin(t * 5.3 + 1) : .6;
  const glow = (cx, cy, rx, ry, a) => { for (let k = 6; k >= 1; k--) { x.fillStyle = `rgba(255,170,80,${(a / k * .5).toFixed(3)})`; const w = rx * k / 6, h = ry * k / 6; x.beginPath(); x.ellipse(cx, cy, w, h, 0, 0, 6.283); x.fill(); } };
  glow(100, 176, 150, 50, .16 + .1 * dark + .05 * fl); glow(100, 150, 90, 70, .08 + .08 * dark);
  /* flames: three tongues and a bed of coals, a frame every ~70 ms so they flicker like pixel flame */
  const fr = moving ? Math.floor(t * 14) : 0, base = FIRE.y + FIRE.h - 10;
  for (let i = 0; i < 7; i++) { const cx = FIRE.x + 12 + i * 5.5, h = 8 + ((fr * 7 + i * 13) % 9) + (i === 3 ? 6 : 0); for (let j = 0; j < h; j++) { const w = Math.max(1, Math.round(3 - j * 2.6 / h)); x.fillStyle = j < h * .35 ? '#ffe08a' : j < h * .7 ? '#ff9a3a' : '#d8482a'; x.fillRect(Math.round(cx - w / 2 + Math.sin(j * .6 + fr + i) * .8), base - j, w, 1); } }
  x.fillStyle = '#ffb04a'; for (let i = 0; i < 10; i++) x.fillRect(FIRE.x + 10 + ((i * 7 + fr) % 36), base + 2 + (i % 2), 2, 1);
  if (moving) for (let i = 0; i < 4; i++) { const k = ((t * .35 + i * .27) % 1); x.fillStyle = `rgba(255,${180 - k * 80 | 0},80,${(1 - k).toFixed(2)})`; x.fillRect(Math.round(FIRE.x + 24 + Math.sin(t * 2 + i) * 6), Math.round(base - 12 - k * 40), 1, 1); }
  /* candles on the mantel and the desk */
  for (const [cx, cy] of [[61, 84], [SPOTS.desk.x + 11, SPOTS.desk.y - 11]]) { glow(cx + 1, cy + 1, 16, 12, .1 + .1 * dark); x.fillStyle = '#ffe08a'; x.fillRect(cx, cy - (moving && Math.sin(t * 11 + cx) > .6 ? 1 : 0), 2, 3); }
  /* the companion breathing in its sleep, and a slow z now and then */
  if (moving) { const z = (t * .4) % 1; if (z < .7) { x.fillStyle = `rgba(250,246,236,${(.9 - z).toFixed(2)})`; const zx = PET.x + 28 + z * 10, zy = PET.y - 22 - z * 18; x.fillRect(zx, zy, 4, 1); x.fillRect(zx + 2, zy + 1, 1, 1); x.fillRect(zx + 1, zy + 2, 1, 1); x.fillRect(zx, zy + 3, 4, 1); } }
  /* the lantern's warm pool on the rafters */
  glow(250.5, 40 - OY, 26, 18, .1 + .14 * dark);
  x.restore(); };

/* ---------- the Home card ---------- */
const st = { key: '', url: '', busy: false, raf: 0, last: 0, t: 0 };
const lightNow = () => { const town = S().town, h = Q.townHour ? Q.townHour() : 13, L = Q.townLight ? Q.townLight(h) : { dark: 0, warm: 0 };
  const night = [46, 58, 120], sun = [255, 168, 104], tint = [255, 255, 255].map((v, i) => Math.round(v + (sun[i] - v) * L.warm * .62)).map((v, i) => Math.round(v + (night[i] - v) * L.dark * .45 * (1 - L.warm * .45)));
  return { town, dark: L.dark, warm: L.warm, tint, weather: Q.townWeather ? Q.townWeather(town) : 'clear', quarter: Math.floor(h * 4) }; };
const goalNote = () => { const g = Q.homeGoalNow; return g ? `<b>${esc(g.name)}</b><span>${esc(g.label)} ${g.have} / ${g.need}</span>` : '<b>Your next step</b><span>See Quests</span>'; };
/* the keepsakes and the letters have their own hotspots, placed like the furniture's (st.extra holds this render's) */
const keepSpot = e => `<button class="hearth-spot hearth-keep" data-spot="${esc(e.key)}" data-row="${e.row}" data-do="${e.act[0]}" data-a="${esc(e.act[1])}" aria-label="${esc(e.label)}" data-tip="text:${esc(e.label)}">${e.more ? `<b class="hearth-more">+${e.more}</b>` : ''}</button>`;
const letterSpot = () => { const n = Q.lettersWaiting ? Q.lettersWaiting().length : 0; if (!n) return ''; const L = Q.lettersWaiting()[0], f = D.FOLK.find(x => x.id === L.from);
  const tip = n > 1 ? `${n} letters on your desk · the first is from ${f ? f.n : 'a friend'}` : `A letter from ${f ? f.n : 'a friend'} · open it`;
  return `<button class="hearth-spot hearth-letter" data-spot="letter" data-do="letteropen" data-a="${esc(L.id)}" aria-label="${esc(tip)}" data-tip="text:${esc(tip)}"></button>`; };
UI.hearth = () => { const keep = Q.hearthKeep(); st.extra = { letter: LETTER }; for (const e of keep) st.extra[e.key] = e;
  return `<div class="hearth" data-hearth><img class="hearth-room" alt="Your room by the fire" draggable="false"><canvas class="hearth-lights" width="${RW}" height="${RH}" aria-hidden="true"></canvas><div class="hearth-dim" aria-hidden="true"></div>
  <button class="hearth-note" data-do="go" data-a="quests" data-tip="text:Today's goal · open Quests">${goalNote()}</button>
  ${Object.entries(SPOTS).filter(([k]) => k !== 'board' && (k !== 'pet' || (S().pets && S().pets.active))).map(([k, s]) => `<button class="hearth-spot" data-spot="${k}" data-do="${s.act[0]}" data-a="${s.act[1]}" aria-label="${esc(s.label)}" data-tip="text:${esc(s.label)}"></button>`).join('')}
  ${keep.map(keepSpot).join('')}${letterSpot()}</div>`; };
const place = () => { const box = document.querySelector('.home-scene'), H = box && box.querySelector('.hearth'); if (!H) return;
  const img = H.querySelector('.hearth-room'), bw = H.clientWidth, bh = H.clientHeight; /* the room's own box: on phones the buttons get a strip below it */ if (!bw || !bh) return;
  const k = Math.max(1, Math.floor(Math.max(bw / RW, bh / RH))), w = RW * k, h = RH * k, left = Math.round((bw - w) / 2), top = bh - h;
  /* with priority: the page's sprite snapper and scene rules size pictures with !important */
  for (const el of [img, H.querySelector('.hearth-lights'), H.querySelector('.hearth-dim')]) for (const [k2, v] of Object.entries({ left: left + 'px', top: top + 'px', width: w + 'px', height: h + 'px' })) el.style.setProperty(k2, v, 'important');
  H.dataset.scale = k;
  /* a small keepsake on a phone gets the 48 px touch target, centred on it rather than hanging off its corner */
  for (const b of H.querySelectorAll('.hearth-spot')) { const s = SPOTS[b.dataset.spot] || (st.extra || {})[b.dataset.spot]; if (!s) continue; const sw = Math.max(48, s.w * k), sh = Math.max(48, s.h * k);
    Object.assign(b.style, { left: left + s.x * k - (sw - s.w * k) / 2 + 'px', top: top + (s.y + OY) * k - (sh - s.h * k) / 2 + 'px', width: sw + 'px', height: sh + 'px' }); }
  const n = H.querySelector('.hearth-note'), N = SPOTS.board; Object.assign(n.style, { left: left + (N.x + 2) * k + 'px', top: top + (N.y + OY + 3) * k + 'px', width: Math.max(150, (N.w - 2) * k) + 'px' }); };
const refresh = async (force) => { const H = st.H && st.H.isConnected ? st.H : document.querySelector('.home-scene .hearth'); if (!H) return; const L = lightNow(), season = Q.season(), pet = S().pets && S().pets.active;
  const keep = Q.hearthKeep(), letters = Q.lettersWaiting ? Q.lettersWaiting().length : 0;
  const key = [L.town, L.quarter, L.weather, season, pet, JSON.stringify(S().look || {}), S().equip && S().equip.weapon, keep.map(e => e.key + (e.more || '')).join(','), letters].join('|');
  const dim = H.querySelector('.hearth-dim'); dim.style.backgroundColor = `rgb(${[255, 255, 255].map((v, i) => Math.round(v + ([150, 112, 84][i] - v) * L.dark * .55)).join(',')})`;
  if (key !== st.key || force) { if (st.busy) { st.again = true; return; } st.busy = true; try { st.url = await room(L.town, L, L.weather, season, pet, keep, letters); st.key = key; } finally { st.busy = false; } if (st.again) { st.again = false; return refresh(); } }
  const img = H.querySelector('.hearth-room'); if (img.isConnected && img.getAttribute('src') !== st.url) img.src = st.url; st.dark = L.dark; };
/* one subscriber on the shared clock (DQ.frame, js/util.js): elapsed time at native refresh, paused while hidden */
const tick = (dt, now) => { const H = st.H && st.H.isConnected ? st.H : (st.H = document.querySelector('.home-scene .hearth')); if (!H) { st.on = false; return false; } const moving = !still(); if (moving) st.t += dt;
  if (st.cxH !== H) { st.cxH = H; st.cx = H.querySelector('.hearth-lights').getContext('2d'); } lights(st.cx, st.t, st.dark || 0, moving);
  const n = now || performance.now(); if (Math.floor(n / 30000) !== st.minute) { st.minute = Math.floor(n / 30000); refresh(); } };
const start = () => { st.H = document.querySelector('.home-scene .hearth'); place(); refresh(); if (!st.on) { st.on = true; if (Q.frame) Q.frame.add(tick); else { const loop = n => { if (tick(1 / 60, n) !== false) requestAnimationFrame(loop); }; requestAnimationFrame(loop); } } };
Q.hearthLive = () => { const H = document.querySelector('.home-scene .hearth'); return H ? { scale: +H.dataset.scale, spots: [...H.querySelectorAll('.hearth-spot')].map(b => b.dataset.spot), key: st.key, note: H.querySelector('.hearth-note').innerText, src: !!H.querySelector('.hearth-room').getAttribute('src'), t: st.t } : null; };

UI.DO.homeview = v => { if (!['hearth', 'town'].includes(v)) return; S().settings.homeView = v; Q.save && Q.save(); UI.render(true); };
/* Home's scene card: the hearth or the town, with a way to the other */
const swap = () => { const box = document.querySelector('#view .home-scene'); if (!box || box.dataset.hearthDone === Q.homeView()) return;
  box.dataset.hearthDone = Q.homeView();
  if (Q.homeView() === 'hearth') { box.querySelector('img.scene')?.remove(); box.querySelectorAll('canvas.town-walkers,canvas.town-life,.town-tint,.town-glow').forEach(e => e.remove()); box.insertAdjacentHTML('afterbegin', UI.hearth()); box.classList.add('is-hearth'); box.style.removeProperty('background-color');
    box.insertAdjacentHTML('beforeend', `<button class="btn home-viewswap" data-do="homeview" data-a="town">${ico('map')}Step outside</button>`); }
  else box.insertAdjacentHTML('beforeend', `<button class="btn home-viewswap" data-do="homeview" data-a="hearth">${ico('house')}Go inside</button>`); };
const render0 = UI.render;
UI.render = (...a) => { const r = render0(...a); try { if (UI.view === 'overview') { swap(); if (document.querySelector('#view .hearth')) start(); } } catch (e) { console.error('hearth', e); } return r; };
let fitRaf = 0; addEventListener('resize', () => { cancelAnimationFrame(fitRaf); fitRaf = requestAnimationFrame(place); });
})();
