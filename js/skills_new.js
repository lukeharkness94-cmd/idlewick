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

/* ---------- Beastmastery: lay traps to befriend, train to strengthen ---------- */
DQ.beastMult = () => 1 + (DQ.skillUnlocked('beastmastery') ? DQ.lvl('beastmastery') * .005 : 0);
/* each region's signature wild companion (one per region; until now only a rare drop in fights) */
DQ.signatureOf = town => (D.PETS || []).find(p => p.collectible && p.mon && D.MON[p.mon] && D.MON[p.mon].town === town && String(p.id).startsWith('wild_')) || null;
DQ.lureLvl = town => (D.TOWN[town] ? D.TOWN[town].idx : 0) * 10 || 1;
DQ.befriendChance = town => Math.min(.25, .03 + DQ.lvl('beastmastery') * .0015 + Math.max(0, DQ.lvl('beastmastery') - DQ.lureLvl(town)) * .002);
const lureLoot = town => { const out = []; for (const m of D.MONLIST.filter(m => m.town === town && !m.boss && !m.mini)) for (const [k] of m.drops || []) { const it = D.ITEMS[k]; if (it && !it.slot && it.type !== 'container' && !it.unique && !out.includes(k)) out.push(k); } return out.length ? out : ['feather']; };
const trainCheck = id => {
  if (String(id).startsWith('lure:')) { const town = id.slice(5); if (!D.TOWN[town]) return 'There is no such region'; if (!DQ.townUnlocked(town) || !(S().towns[town] && S().towns[town].visited)) return `Reach ${D.TOWN[town].name} first`; if (DQ.lvl('beastmastery') < DQ.lureLvl(town)) return `Requires Beastmastery ${DQ.lureLvl(town)}`; if (DQ.have('wooden_trap') < 1) return 'You need a wooden trap (Crafting makes them)'; return ''; }
  return !D.PET[id] ? 'There is no such beast' : !S().pets.owned[id] ? 'You have not hatched that beast yet' : '';
};
DQ.KIND_EXT.train = {
  skill: 'beastmastery', page: 'beastmastery',
  label: a => String(a.id).startsWith('lure:') ? `Laying traps in ${D.TOWN[a.id.slice(5)].name}` : `Training ${(D.PET[a.id] || {}).name || 'a beast'}`,
  dur: id => String(id).startsWith('lure:') ? 8000 : 6000,
  check: trainCheck,
  done: a => {
    const L = DQ.lvl('beastmastery');
    if (String(a.id).startsWith('lure:')) {
      const town = a.id.slice(5); if (DQ.have('wooden_trap') < 1) return DQ.stopAct(false, 'Out of wooden traps. Craft some more to keep laying them.');
      if (DQ.act) DQ.act.count++;
      if (chance(.25)) DQ.take('wooden_trap', 1); /* a trap breaks now and then */
      const sig = DQ.signatureOf(town);
      if (sig && !S().pets.owned[sig.id] && !DQ.forecasting && chance(DQ.befriendChance(town))) DQ.awardPet(sig.id);
      else { const k = DQ.pick(lureLoot(town)), n = rnd(1, 3); DQ.grant(k, n); if (!DQ.sim.on) floatAt(`+${n} ${D.ITEMS[k].name.toLowerCase()}`, '#d08a5a'); }
      DQ.addXp('beastmastery', Math.round(8 * (5 + L * .35))); S().stats.train = (S().stats.train || 0) + 1; DQ.qev('lure', town);
      return;
    }
    const p = D.PET[a.id], o = S().pets.owned[a.id]; if (!p || !o) return DQ.stopAct(true);
    if (DQ.act) DQ.act.count++;
    const before = DQ.petLevel(a.id); if (!Number.isFinite(o.xp)) o.xp = (D.CREATURE_LEVELS || [0])[Math.max(0, before - 1)] || 0;
    o.xp += 2 + L / 15;
    const x = DQ.addXp('beastmastery', Math.round(6 * (5 + L * .35) + before * 4)); S().stats.train = (S().stats.train || 0) + 1; DQ.qev('train', a.id);
    const after = DQ.petLevel(a.id);
    if (after > before) { DQ.fxDirty(); if (!DQ.sim.on) DQ.notify({ kind: 'unlock', key: 'creature:' + a.id, title: `${p.name} reached level ${after}!`, text: 'Beast bonuses are stronger.', icon: 'paw', col: p.col, sound: 'perk', burst: true }); DQ.emit('pets'); }
    if (!DQ.sim.on) floatAt(`+${fmt(Math.round(x))} XP · ♥`, '#d08a5a');
  }
};
/* Sailing's sea legs: every Sailing level makes Fishing 0.3% faster */
const speed0 = DQ.extraSpeed; if (speed0) DQ.extraSpeed = sk => speed0(sk) + (sk === 'fishing' && DQ.skillUnlocked('sailing') ? DQ.lvl('sailing') * .003 : 0);
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
/* one clear way to choose who comes with you: only one companion at a time gives its bonus */
const companionBtn = p => S().pets.active === p.id ? `<p class="comp-on">★ ${esc(p.name)} is your companion.</p>` : `<div class="btnrow"><button class="btn primary" data-do="setpet" data-a="${p.id}">Make companion</button></div><p class="sm dim">Only your companion gives its bonus${S().pets.active && D.PET[S().pets.active] ? ` (now ${esc(D.PET[S().pets.active].name)})` : ''}.</p>`;
UI.V.beastmastery = () => {
  const L = DQ.lvl('beastmastery'), traps = DQ.have('wooden_trap');
  /* trap lines: one card per region, its signature companion as the picture (silhouette until befriended) */
  const lures = D.TOWNS.map(t => { const sig = DQ.signatureOf(t.id), lvl = DQ.lureLvl(t.id), seen = S().towns[t.id] && S().towns[t.id].visited, lvlLock = L < lvl, got = sig && S().pets.owned[sig.id];
    return { id: 'lure:' + t.id, name: seen ? `Lay traps · ${t.name}` : '???', artKind: 'creature', artId: sig ? (A && A.hasCreature(sig.id) ? sig.id : sig.mon) : 'chicken', locked: lvlLock || !seen, blackout: !seen, blocked: lvlLock || !seen || !traps,
      reason: [!seen ? `Reach ${t.name}` : '', lvlLock ? `Requires Beastmastery ${lvl}` : '', !traps ? 'Needs a wooden trap' : ''].filter(Boolean).join(' · '),
      short: !seen ? `Reach ${t.name}` : lvlLock ? `Lv ${lvl}` : '', caption: got ? `${esc(sig.name)} hatched` : `${sig ? esc(sig.name) : 'Wild'} egg`, stateText: got ? '✓ Hatched · loot only' : `${(DQ.befriendChance(t.id) * 100).toFixed(1)}% per trap`,
      info: `${got ? companionBtn(sig) : ''}<p>Lay traps around ${esc(t.name)}. ${got ? 'You have this region’s wild beast. Traps now bring loot only.' : `Each trap has a ${(DQ.befriendChance(t.id) * 100).toFixed(1)}% chance of <b>${sig ? esc(sig.name) : 'the wild beast'}</b>’s egg; otherwise loot.`}</p><p>${traps} wooden trap${traps === 1 ? '' : 's'} · about 1 in 4 breaks · 8s per trap</p>` }; });
  return UI.taskPanel('beastmastery', 'Fieldwork', 'train', lures, '');
};
})();
