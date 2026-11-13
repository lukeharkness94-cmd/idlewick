/* Eggs (Dec 2026, from the player). One rule for every companion: it arrives as an egg and hatches at the ranch.
   Whatever the source (a rare find while working, a boss, the wild creature of a region, a trap, the shop),
   DQ.awardPet now lays an egg in S.pets.eggs with an absolute hatch time; when that time passes the egg hatches by
   itself, with the usual "new companion" pop-up, and the beast moves into a pen. Nothing else about companions changes:
   the same ids, odds, bonuses and bonds. Engine tests that do not load this file keep the instant award. */
(() => {
const Q = window.DQ, D = Q.data, UI = Q.ui, S = () => Q.S, { esc, ico, fmt } = Q;
const MIN = 60000;
/* three kinds of egg, by where the companion comes from */
Q.eggKind = id => { const p = D.PET[id] || {}, s = p.src || {}, spec = (D.BEAST_SPECIES || {})[id];
  if (s.type === 'boss') return { k: 'royal', name: 'Royal egg', ms: 60 * MIN, col: '#e8c860' };
  if (String(id).startsWith('wild_') || (spec && spec.rarity === 'common')) return { k: 'wild', name: 'Wild egg', ms: 10 * MIN, col: '#b8c890' };
  return { k: 'speckled', name: 'Speckled egg', ms: 30 * MIN, col: '#e8dcc8' }; };
Q.eggs = () => { const p = S().pets; if (!Array.isArray(p.eggs)) p.eggs = []; return p.eggs; };
Q.eggOf = id => Q.eggs().find(e => e.id === id) || null;
/* where an egg was found, in the player's words */
Q.eggSource = id => { const p = D.PET[id] || {}, s = p.src || {};
  return s.type === 'boss' ? `Taken from ${D.MON[s.mon].name}` : s.type === 'shop' ? `Bought in ${D.TOWN[s.town].name}` : s.type === 'harvest' ? 'Found among your crops' : s.type === 'skill' ? `Found while ${D.SK[s.skill].name.toLowerCase() === 'thieving' ? 'thieving' : D.SK[s.skill].name.toLowerCase()}` : s.type === 'hunt' ? `From the ${D.MON[s.mon].name.toLowerCase()}s of ${D.TOWN[D.MON[s.mon].town].name}` : 'Brought back by the trapper'; };
const award0 = Q.awardPet;
Q.awardPet = (id, options = {}) => {
  const p = D.PET[id]; if (!p || S().pets.owned[id] || Q.eggOf(id)) return false;
  if (options.hatched) return award0(id, options);
  const kind = Q.eggKind(id), now = Date.now();
  Q.eggs().push({ id, found: now, due: now + kind.ms });
  if (!(Q.sim && Q.sim.on) && !Q.forecasting) Q.sfx && Q.sfx('gem');
  Q.notify({ kind: 'unlock', key: 'egg:' + id, icon: 'paw', col: kind.col, title: `You found an egg!`, text: `${kind.name}. ${Q.eggSource(id)}. It hatches at your ranch in ${Q.fmtTime(kind.ms)}.`, sound: false, burst: true, ttl: 12000,
    action: { label: 'See the hatchery', fn: () => { UI.beastMode = 'beasts'; Q.go('beastmastery'); } },
    popup: (Q.sim && Q.sim.on) || Q.forecasting ? null : { title: 'You found an egg!', body: `<div class="pet-pop egg-pop" style="--c:${kind.col}"><span class="pet-pop-art egg-wobble">${Q.eggImg(id, 96)}</span><p><b>${esc(kind.name)}</b></p><p class="pet-pop-fx">${esc(Q.eggSource(id))}.</p><p class="sm dim">It is keeping warm in the hatchery at your ranch and hatches in ${Q.fmtTime(kind.ms)}, whether you are playing or not.</p></div>`,
      actions: [{ label: 'See the hatchery', fn: () => { UI.beastMode = 'beasts'; Q.go('beastmastery'); } }, { label: 'Close', primary: true }] } });
  Q.log && Q.log(`You found a ${kind.name.toLowerCase()}. It will hatch in ${Q.fmtTime(kind.ms)}.`, 'quest'); Q.emit('pets'); return true;
};
/* hatching: once an egg's time has passed, the original award runs (pop-up, pen, first companion goes with you) */
Q.hatchDue = () => {
  if ((Q.sim && Q.sim.on) || Q.forecasting || !Q.S || !Q.S.pets) return 0;
  const now = Date.now(), eggs = Q.eggs(), ready = eggs.filter(e => e.due <= now); if (!ready.length) return 0;
  S().pets.eggs = eggs.filter(e => e.due > now);
  for (const e of ready) { const id = e.id, p = D.PET[id]; if (!p || S().pets.owned[id]) continue;
    /* a bonded beast hatches with the comparison against your current companion (js/companion_choice.js) */
    const job = Q.beastJob && Q.beastJob(id), cur = S().pets.active;
    if (job && Q.popupQueue && Q.beastCompare && cur) { award0(id, { quiet: true }); if (Q.migrateBeasts) Q.migrateBeasts(S());
      Q.popupQueue({ title: 'An egg hatched', body: `<div class="beast-arrival"><div class="ba-art">${Q.petSprite(p, 96)}</div><div><h3>${esc(p.name)} · ${esc(job.role)}</h3><p>${esc(p.text || '')}</p><p>${Q.beastCompare(id)}</p></div></div>`,
        actions: [{ label: cur !== id ? `Keep ${D.PET[cur] ? D.PET[cur].name : 'current'}` : 'Later' }, { label: 'Bring along', primary: true, fn: () => Q.setPet(id) }] }); Q.emit('pets'); }
    else { award0(id, {}); if (Q.migrateBeasts) Q.migrateBeasts(S()); } }
  if (UI.view === 'beastmastery' && UI.render) UI.render(false); return ready.length;
};
let tick = 0; Q.on('ui', () => { if (++tick % 3 === 0) Q.hatchDue(); });
/* buying a companion: no charge while its egg is already in the hatchery */
const buy0 = UI.DO.buypet; if (buy0) UI.DO.buypet = a => { if (Q.eggOf(a)) return Q.toast('Its egg is already in your hatchery', true); buy0(a); };
const reason0 = Q.beastTrapReason; if (reason0) Q.beastTrapReason = (id, tier) => Q.eggOf(id) ? 'Its egg is already in your hatchery' : reason0(id, tier);

/* ---------- art: one egg shape, coloured and marked by the companion it holds ---------- */
const A = Q.pixelArt, cache = {};
Q.eggUrl = id => { const p = D.PET[id] || {}, kind = Q.eggKind(id), key = kind.k + (p.col || '');
  if (cache[key] || !A || !A.Spr) return cache[key] || '';
  const s = A.Spr(16, 16), shell = A.ramp(kind.col), mark = A.ramp(p.col || '#a08060');
  s.ell(8, 9, 4.6, 5.6, shell); s.ell(8, 6, 3.4, 3.6, shell); s.ell(6.5, 6, 1.4, 2, A.ramp(A.mix(kind.col, '#ffffff', .45)));
  if (kind.k === 'royal') { s.rect(4, 9, 9, 1, mark); s.rect(5, 12, 7, 1, mark); s.fix(8, 5, '#fff4b0'); }
  else if (kind.k === 'wild') { for (const [x, y] of [[5, 8], [10, 7], [7, 11], [10, 11], [6, 13]]) s.ell(x, y, 1, 1, mark); }
  else { for (const [x, y] of [[6, 9], [9, 6], [10, 10], [7, 12], [5, 11], [9, 13]]) s.fix(x, y, p.col || '#a08060'); }
  return cache[key] = A.toCanvas(s).toDataURL(); };
Q.eggImg = (id, box = 32) => { const u = Q.eggUrl(id), k = Math.max(1, Math.floor(box / 16)); return u ? `<img class="pxa egg-art" src="${u}" width="${16 * k}" height="${16 * k}" alt="" draggable="false">` : ico('paw'); };

/* ---------- the hatchery, on the ranch ---------- */
UI.hatcheryHtml = () => { const eggs = Q.eggs().slice().sort((a, b) => a.due - b.due); if (!eggs.length) return '';
  return `<section class="panel ranch-hatchery"><span class="k">Hatchery · ${eggs.length} ${eggs.length === 1 ? 'egg' : 'eggs'}</span><div class="hatch-row">${eggs.slice(0, 4).map(e => { const kind = Q.eggKind(e.id), pct = Math.max(0, Math.min(100, 100 * (Date.now() - e.found) / Math.max(1, e.due - e.found)));
    return `<div class="hatch-egg" data-tip="text:${esc(kind.name)}. ${esc(Q.eggSource(e.id))}."><span class="egg-wobble">${Q.eggImg(e.id, 48)}</span><b>${esc(kind.name)}</b><span class="bar"><i style="width:${pct}%"></i></span><small>Hatches in <span data-beast-due="${e.due}">${Q.fmtTime(Math.max(0, e.due - Date.now()))}</span></small></div>`; }).join('')}${eggs.length > 4 ? `<small class="dim">+${eggs.length - 4} more keeping warm</small>` : ''}</div></section>`; };
const page0 = UI.V.beastmastery;
if (page0) UI.V.beastmastery = () => { const h = page0(); const eggs = UI.hatcheryHtml(); if (!eggs) return h;
  return h.includes('class="ranch-side">') ? h.replace('class="ranch-side">', 'class="ranch-side">' + eggs) : h; };
/* one plain explanation of the three ways, as a pop-up (reference, not an action) and above the two finding pages */
const WAYS = [['Lucky finds', 'Working at any skill, harvesting, or beating a boss can turn up an egg. The odds and your tries are in Hero → Collection.'], ['The trapper', 'Pay for a trap and it comes back by itself in 1 to 4 hours, with an egg or with tracks. Your own task keeps running.'], ['Wooden traps', 'A task you do yourself: lay your crafted traps in a region for loot, Beastmastery XP and a chance at that region’s wild egg.']];
UI.DO.eggways = () => Q.modal({ title: 'Where eggs come from', body: `<div class="egg-ways">${WAYS.map(([t, d], i) => `<div class="egg-way"><b>${i + 1}. ${t}</b><p>${d}</p></div>`).join('')}<p class="sm dim">Every egg hatches at your ranch by itself: wild eggs in 10 minutes, speckled eggs in 30, royal eggs from bosses in an hour.</p></div>`, actions: [{ label: 'Open the collection log', fn: () => { UI.colTab = 'eggs'; Q.go('collection'); } }, { label: 'Close', primary: true }] });
/* the rail count for Beastmastery never counted eggs before; a waiting egg is not an action, so it still does not */
})();
