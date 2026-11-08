/* Carpentry, Sailing and Beastmastery (Nov 2026): behaviour and pages. Data in skills_new_data.js, art in
   skills_new_art.js. Sailing ('sail') and Beastmastery ('train') are activity kinds registered on DQ.KIND_EXT, so
   they run, queue, stop and catch up offline exactly like every other task. */
(() => {
const DQ = window.DQ, D = DQ.data, UI = DQ.ui, S = () => DQ.S, { esc, fmt, ico, chance, rnd } = DQ;
const A = DQ.pixelArt;

/* ---------- boats are moored, not carried (like tools) ---------- */
const isTool0 = DQ.isTool; DQ.isTool = id => isTool0(id) || !!(D.ITEMS[id] && D.ITEMS[id].type === 'boat');
DQ.boatTier = () => (D.BOATS || []).reduce((t, [id, , tier]) => DQ.have(id) > 0 ? Math.max(t, tier) : t, 0);
const boatName = tier => ((D.BOATS || []).find(b => b[2] === tier) || [, 'boat'])[1];

/* ---------- labels for carpentry recipes ---------- */
const label0 = DQ.actLabel;
DQ.actLabel = a => { a = a || DQ.act; if (a && a.kind === 'recipe' && D.RECIPES[a.id] && D.RECIPES[a.id].skill === 'carpentry') { const r = D.RECIPES[a.id]; return (r.tab === 'Boats' ? 'Building a ' : 'Sawing ') + r.name.toLowerCase(); } return label0(a); };

/* ---------- Sailing: voyages ---------- */
const floatAt = (txt, col) => { if (!DQ.sim.on && DQ.floatAt) DQ.floatAt(document.querySelector('.scene-target') || document.querySelector('.card.active'), txt, col); };
DQ.KIND_EXT.sail = {
  skill: 'sailing', page: 'sailing',
  label: a => `Sailing to ${D.VOYAGE[a.id].name}`,
  dur: id => D.VOYAGE[id].t,
  check: id => { const v = D.VOYAGE[id]; if (!v) return 'There is no such island'; if (DQ.lvl('sailing') < v.lvl) return `Requires Sailing ${v.lvl}`; if (DQ.boatTier() < v.boat) return `Needs a ${boatName(v.boat).toLowerCase()} or larger (Carpentry builds boats)`; return ''; },
  done: a => {
    const v = D.VOYAGE[a.id]; if (!v) return DQ.stopAct(true);
    if (DQ.act) DQ.act.count++;
    const c = Math.round(rnd(v.coins[0], v.coins[1]) * DQ.coinMult()); DQ.addCoins(c);
    const got = [];
    for (const [k, [lo, hi], p] of v.loot) if (chance(p)) { const n = rnd(lo, hi); DQ.grant(k, n); got.push(`${n} ${D.ITEMS[k].name.toLowerCase()}`); }
    const x = DQ.addXp('sailing', v.xp); S().stats.voyage = (S().stats.voyage || 0) + 1; DQ.qev('sail', v.id); DQ.petRoll && DQ.petRoll('skill', 'sailing');
    if (!DQ.sim.on) { DQ.log(`Back from ${v.name}: ${fmt(c)} coins${got.length ? ', ' + got.join(', ') : ''}.`, 'good'); floatAt(`+${fmt(Math.round(x))} XP · +${fmt(c)} coins`, '#3f8fc8'); DQ.sfx && DQ.sfx('fish'); }
  }
};

/* ---------- Beastmastery: training companions ---------- */
DQ.beastMult = () => 1 + (DQ.skillUnlocked('beastmastery') ? DQ.lvl('beastmastery') * .005 : 0);
DQ.KIND_EXT.train = {
  skill: 'beastmastery', page: 'beastmastery',
  label: a => `Training ${(D.PET[a.id] || {}).name || 'a companion'}`,
  dur: () => 6000,
  check: id => !D.PET[id] ? 'There is no such companion' : !S().pets.owned[id] ? 'You have not found that companion yet' : '',
  done: a => {
    const p = D.PET[a.id], o = S().pets.owned[a.id]; if (!p || !o) return DQ.stopAct(true);
    if (DQ.act) DQ.act.count++;
    const before = DQ.petLevel(a.id); if (!Number.isFinite(o.xp)) o.xp = (D.CREATURE_LEVELS || [0])[Math.max(0, before - 1)] || 0;
    o.xp += 2 + DQ.lvl('beastmastery') / 15;
    const x = DQ.addXp('beastmastery', Math.round(6 * (5 + DQ.lvl('beastmastery') * .35) + before * 4)); S().stats.train = (S().stats.train || 0) + 1; DQ.qev('train', a.id);
    const after = DQ.petLevel(a.id);
    if (after > before) { DQ.fxDirty(); if (!DQ.sim.on) DQ.notify({ kind: 'unlock', key: 'creature:' + a.id, title: `${p.name} reached level ${after}!`, text: 'Their companion bonus is stronger.', icon: 'paw', col: p.col, sound: 'perk', burst: true }); DQ.emit('pets'); }
    if (!DQ.sim.on) floatAt(`+${fmt(Math.round(x))} XP · ♥`, '#d08a5a');
  }
};
/* stronger companion bonuses and busier farm animals */
const animal0 = DQ.animalPeriod; if (animal0) DQ.animalPeriod = a => animal0(a) * (DQ.skillUnlocked('beastmastery') && DQ.lvl('beastmastery') >= 25 ? 1 - DQ.lvl('beastmastery') * .003 : 1);

/* ---------- pages ---------- */
UI.V.carpentry = () => UI.V.recipes('carpentry');
UI.V.sailing = () => {
  const tier = DQ.boatTier(), L = DQ.lvl('sailing');
  const choices = D.VOYAGES.map(v => { const lvlLock = L < v.lvl, boatLock = tier < v.boat;
    return { id: v.id, name: v.name, artKind: 'island', locked: lvlLock, blocked: lvlLock || boatLock, reason: [lvlLock ? `Requires Sailing ${v.lvl}` : '', boatLock ? `Needs a ${boatName(v.boat).toLowerCase()} or larger` : ''].filter(Boolean).join(' · '),
      short: lvlLock ? `Lv ${v.lvl}` : boatLock ? boatName(v.boat) : '', caption: `Level ${v.lvl} · ${boatName(v.boat)}`, stateText: boatLock && !lvlLock ? `Needs a ${boatName(v.boat).toLowerCase()}` : '',
      info: `<p>${esc(v.blurb)}</p><p class="sm dim">${tier ? `Your largest boat: ${esc(boatName(tier))}.` : 'You have no boat yet.'} Carpentry builds bigger boats for farther islands.</p><p>${(v.xp * DQ.xpMult('sailing')).toFixed(0)} XP · ${(DQ.durFor('sail', v.id) / 1000).toFixed(0)}s voyage · ${fmt(v.coins[0])}–${fmt(v.coins[1])} coins</p><div class="voy-loot">${v.loot.map(([k, , p]) => `<span class="voy-item" data-tip="item:${k}">${DQ.itemIco(D.ITEMS[k])}<small>${Math.round(p * 100)}%</small></span>`).join('')}</div>` }; });
  return UI.taskPanel('sailing', 'Sailing', 'sail', choices, 'Sail to');
};
UI.V.beastmastery = () => {
  const owned = (D.PETS || []).filter(p => S().pets.owned[p.id]);
  const choices = owned.map(p => { const lv = DQ.petLevel(p.id), cid = A && A.hasCreature(p.id) ? p.id : p.mon || p.id;
    return { id: p.id, name: p.name, artKind: 'creature', artId: cid, caption: `Level ${lv} · ${esc(p.kind || 'Companion')}`, stateText: S().pets.active === p.id ? 'Your companion' : '',
      info: `<p>${esc(p.text || '')}</p><p>${(DQ.durFor('train', p.id) / 1000).toFixed(0)}s per session · ${Math.round((6 * (5 + DQ.lvl('beastmastery') * .35) + lv * 4) * DQ.xpMult('beastmastery'))} XP · Companion bonuses ×${DQ.beastMult().toFixed(2)}</p>` }; });
  if (!choices.length) return `<section class="panel"><h2>Beastmastery</h2><p>You have no companions to train yet. Hunting and rare finds bring them.</p></section>`;
  return UI.taskPanel('beastmastery', 'Beastmastery', 'train', choices, 'Train');
};
})();
