/* Idlewick: hunting is its own activity, not a fight (owner, 23 Nov 2026: "it's not a fight, it's about tracking,
   laying the trap and then quickly killing. Sometimes we shouldn't successfully kill them and so we go back to hunting").
   Hunting → Hunting ground: choose an animal from your town's hunting ground. Each hunt is one repeating task in three
   steps: Tracking, Setting the trap, Strike. The strike lands or the animal slips away; either way the next hunt starts
   with tracking again. It uses DQ.KIND_EXT (kind 'hunt', id = creature id), so offline work, the queue and the Now card
   work as for any other task.
   A catch is what a kill used to be: the animal's drops, a quest kill (DQ.qev('kill')), the creature's field-guide entry
   (DQ.recordKill), the wild-companion chance and the World Life hooks. No combat XP, no damage taken, no food used.
   Hunting XP per hour roughly matches Fieldwork at the same level (the fieldwork rate 8 x (5 + 0.35 x level) per 8 s,
   scaled by duration); an escape still pays 30% for the tracking. Animals no longer appear in the combat window. */
(() => {
const Q = window.DQ, D = Q.data, UI = Q.ui, S = () => Q.S, { esc, ico } = Q;
D.HUNT_STEPS = [['Tracking', .45, 'paw'], ['Setting the trap', .30, 'pin'], ['Strike', .25, 'dagger']];
const areaOf = id => Object.values(D.AREAS).flat().find(a => a.hunt && a.monsters.some(e => e.id === id)) || null;
const animal = id => { const m = D.MON[id]; return m && m.hl && areaOf(id) ? m : null; };
Q.isAnimal = id => !!animal(id);
/* better field traps help the strike: +4% per trap tier owned and usable (never consumed by a hunt) */
const trapBonus = () => { const t = Q.fieldTrap ? Q.fieldTrap() : null; return t ? .04 * (D.FIELD_TRAPS.indexOf(t) + 1) : 0; };
Q.huntCatch = id => { const m = animal(id); if (!m) return 0; const L = Q.huntLevel ? Q.huntLevel() : Q.lvl('hunting');
  return Math.max(.45, Math.min(.92, .6 + .025 * (L - m.hl) + trapBonus())); };
Q.huntDur = id => { const m = animal(id); if (!m) return 6000;
  return Math.max(1500, Math.round((5000 + m.hl * 60) * (Q.speedMult ? Q.speedMult('hunting') : 1))); };
Q.huntXp = (id, caught) => { const m = animal(id); if (!m) return 0; const L = Q.lvl('hunting');
  const base = 8 * (5 + .35 * L) * (Q.huntDur(id) / 8000) * (1 + m.hl / 100) / .75;
  return Math.max(1, Math.round(base * (caught ? 1 : .3))); };
/* what the player actually receives, after the skill's XP multipliers */
Q.huntXpShown = (id, caught) => Math.max(1, Math.round(Q.huntXp(id, caught) * (Q.xpMult ? Q.xpMult('hunting') : 1) * (Q.catchUp ? Q.catchUp('hunting') : 1)));
/* which step the current hunt is on, from how far through the cycle it is */
Q.huntStep = (a = Q.act) => { if (!a || a.kind !== 'hunt') return null; const p = Math.min(1, Math.max(0, (Date.now() - a.t0) / (a.dur || 1)));
  let acc = 0; for (const s of D.HUNT_STEPS) { acc += s[1]; if (p < acc) return s; } return D.HUNT_STEPS[2]; };
const lootOf = m => { const got = [], out = [];
  for (const [id, [a, b], p] of m.drops || []) { const it = D.ITEMS[id]; if (!it || it.type === 'gear' || it.type === 'ammo' || id === 'coin_pouch' || id === 'treasure_chest') continue;
    if (!Q.chance(Math.min(1, p * (Q.buffMult ? Q.buffMult('luck') : 1)))) continue;
    const n = a + Math.floor(Math.random() * (b - a + 1)); Q.grant(id, n); got.push(id); out.push({ id, n, rar: D.rarityOf ? D.rarityOf(p) : null }); }
  return { got, out }; };
Q.KIND_EXT.hunt = {
  skill: 'hunting', page: 'hunting', skillFor: () => 'hunting', pageFor: () => 'hunting',
  label: a => { const m = animal(a.id), s = Q.huntStep(a); return m ? `${s ? s[0] : 'Hunting'}: ${(S().beast.kills[m.id] || 0) > 0 ? m.name.toLowerCase() : 'unknown quarry'}` : 'Hunting'; },
  dur: id => Q.huntDur(id),
  check: id => { const m = animal(id); if (!m) return 'Choose an animal'; if (!Q.skillUnlocked('hunting')) return 'Learn Hunting first';
    const g = areaOf(id); if (g.town !== S().town) return `Travel to ${D.TOWN[g.town].name} first`;
    if (Q.canHunt && !Q.canHunt(m)) return `Requires Hunting ${m.hl}`; return ''; },
  done: a => { const m = animal(a.id); if (!m) return Q.stopAct(false, 'That animal is not here.');
    const caught = Q.chance(Q.huntCatch(a.id)), H = S().hunt = S().hunt || {};
    Q.addXp('hunting', Q.huntXp(a.id, caught));
    if (!caught) { H.escaped = (H.escaped || 0) + 1; a.escaped = (a.escaped || 0) + 1; if (!Q.sim.on && !Q.forecasting) { Q.log(`The ${(S().beast.kills[m.id] || 0) > 0 ? m.name.toLowerCase() : 'animal'} slipped away. Back to tracking.`); Q.emit('huntescape', m); } return; }
    if (Q.act) Q.act.count++; H.caught = (H.caught || 0) + 1; S().stats.hunts = (S().stats.hunts || 0) + 1;
    const { got, out } = lootOf(m);
    Q.qev('kill', m.id); Q.recordKill(m, got);
    const cid = 'wild_' + m.id, pet = D.PET && D.PET[cid];
    if (pet && pet.collectible && !S().pets.owned[cid] && !Q.forecasting && Q.chance(Math.max(.008, .05 - m.cl * .00035))) Q.awardPet(cid);
    if (!Q.forecasting) { for (const h of Q.killHooks || []) h(m); if (Q.recipeOnKill) Q.recipeOnKill(m); if (Q.museumScan && (S().beast.kills[m.id] || 0) <= 1) Q.museumScan(); }
    if (!Q.sim.on && !Q.forecasting) { Q.log(`You catch the ${m.name.toLowerCase()}.${out.length ? ' ' + out.map(o => `${o.n > 1 ? o.n + ' ' : ''}${D.ITEMS[o.id].name.toLowerCase()}`).join(', ') : ''}`, 'good'); Q.emit('huntcatch', m, out); }
  }
};
/* hunts count towards the creature's field-guide page through recordKill, not a second 'hunt' entry */
const tick0 = Q.mastTick; if (tick0) Q.mastTick = (a, ...r) => a && a.kind === 'hunt' ? undefined : tick0(a, ...r);
/* the hunt happens out on the trap lines (towns.js district 'train'); creature pages already hold its field guide */
const du0 = Q.districtUrl; if (du0) Q.districtUrl = (town, kind, ...r) => du0(town, kind === 'hunt' ? 'train' : kind, ...r);
const ml0 = Q.mastLine; if (ml0) Q.mastLine = (kind, id) => kind === 'hunt' ? '' : ml0(kind, id);
const mb0 = Q.mastBadge; if (mb0) Q.mastBadge = (kind, id) => kind === 'hunt' ? '' : mb0(kind, id);
/* ---------- routes: anything that tried to fight an animal now hunts it ---------- */
const start0 = Q.startHunt;
Q.startHunt = (areaId, target = null, forQuest = false) => {
  const area = Object.values(D.AREAS).flat().find(a => a.id === areaId);
  /* before Hunting is learned, a quest's animal can still be fought the old way, so the quest stays reachable */
  if (area && area.hunt && Q.skillUnlocked('hunting')) { const id = target && animal(target) ? target : (area.monsters.find(e => Q.canHunt(D.MON[e.id])) || {}).id; if (!id) return false;
    UI.huntMode = 'ground'; UI.taskChoice.hunting = id; return Q.startAct('hunt', id); }
  return start0(areaId, target, forQuest);
};
const huntAnimal = id => { const m = animal(id); if (!m || !Q.skillUnlocked('hunting')) return false; UI.huntMode = 'ground'; UI.taskChoice.hunting = id; Q.go('hunting'); return true; };
UI.DO.huntground = id => { if (!Q.skillUnlocked('hunting')) return Q.go('hunting'); UI.huntMode = 'ground'; if (id && animal(id)) UI.taskChoice.hunting = id; Q.go('hunting'); };
const track0 = UI.DO.hunttrack; UI.DO.hunttrack = id => huntAnimal(id) || track0(id);
const hq0 = UI.DO.huntquest; if (hq0) UI.DO.huntquest = id => huntAnimal(id) || hq0(id);
const hg0 = UI.DO.huntgo; if (hg0) UI.DO.huntgo = a => { const id = String(a).split('|')[1]; return huntAnimal(id) || hg0(a); };
/* an old save mid-fight with an animal carries on as a hunt */
const resume0 = Q.resumeAfterLoad;
Q.resumeAfterLoad = (...r) => { const a = S().act; if (a && a.kind === 'fight' && animal(a.id)) { S().act = { kind: 'hunt', id: a.id, t0: Date.now(), count: 0, elapsed: 0, progress: 0, pace: 'steady', rule: a.rule || 'none', limit: a.limit || 0 }; } return resume0 ? resume0(...r) : undefined; };
/* the combat window shows combat areas only */
UI.cwTab = 'areas';
const cw0 = UI.DO.cwtab; if (cw0) UI.DO.cwtab = t => t === 'hunt' ? UI.DO.huntground() : cw0(t);
/* ---------- the Hunting page: Hunting ground | Fieldwork ---------- */
const field0 = UI.V.hunting;
UI.DO.huntmode = mode => { UI.huntMode = mode === 'field' ? 'field' : 'ground'; UI.render(false); };
const groundPage = () => {
  const g = Q.huntGround ? Q.huntGround(S().town) : null, L = Q.huntLevel(), here = D.TOWN[S().town].name;
  if (!g) return `<section class="panel empty"><p>No hunting ground near ${esc(here)}.</p></section>`;
  const odds = Q.encounterOdds(g), qt = Q.questHuntTarget && Q.questHuntTarget();
  const choices = odds.map(x => { const m = x.monster, known = (S().beast.kills[m.id] || 0) > 0, open = Q.canHunt(m), id = m.id, pct = Math.round(Q.huntCatch(id) * 100);
    const drops = (m.drops || []).map(d => d[0]).filter((k, i, a) => D.ITEMS[k] && a.indexOf(k) === i && Q.itemDiscovered(k));
    /* an animal you have not caught yet stays ??? (UI rules: unmet creatures are never named), as its silhouette */
    return { id, name: known ? m.name : '???', artKind: 'creature', artId: id, yieldId: null, locked: !open, revealed: false, blocked: !open, reason: open ? '' : `Requires Hunting ${m.hl}`, short: open ? '' : 'Lv ' + m.hl,
      caption: `Hunting ${m.hl}${qt === id ? ' · Quest' : ''}`, stateText: open ? `${pct}% catch` : 'Locked',
      info: `<div class="hunt-steps">${D.HUNT_STEPS.map(s => `<span>${ico(s[2])}${s[0]}</span>`).join('<i aria-hidden="true">→</i>')}</div><p class="dim">${pct}% chance the strike lands; otherwise it slips away and you start tracking again. ${Q.huntXpShown(id, true)} Hunting XP a catch, ${Q.huntXpShown(id, false)} if it gets away.</p>${drops.length ? `<div class="hunt-drops"><span class="k">Drops</span>${drops.map(k => `<span class="cw-drop" data-tip="item:${k}">${Q.itemIco(D.ITEMS[k])}</span>`).join('')}</div>` : ''}` }; });
  return UI.taskPanel('hunting', g.name, 'hunt', choices, 'Hunt');
};
UI.V.hunting = () => {
  if (!Q.skillUnlocked('hunting')) return UI.lockedPage('hunting');
  if (UI.huntMode === 'quarry') UI.huntMode = 'ground';
  if (UI.huntMode === 'field') { const h = field0(); return h.replace(/<nav class="hunt-mode-tabs[\s\S]*?<\/nav>/, tabs()); }
  return tabs() + groundPage() + `<section data-reference="true" class="panel reference-panel" id="hunting-progress">${UI.skillHero('hunting')}</section>`;
};
const tabs = () => `<nav class="hunt-mode-tabs btnrow" role="tablist"><button class="btn ${UI.huntMode !== 'field' ? 'on' : ''}" role="tab" aria-selected="${UI.huntMode !== 'field'}" data-do="huntmode" data-a="ground">${ico('paw')}Hunting ground</button><button class="btn ${UI.huntMode === 'field' ? 'on' : ''}" role="tab" aria-selected="${UI.huntMode === 'field'}" data-do="huntmode" data-a="field">${ico('nest')}Fieldwork</button></nav>`;
if (UI.huntMode === undefined) UI.huntMode = 'ground';
/* the stage says which step the hunt is on */
UI.B.huntstep = e => { const s = Q.huntStep(); UI.set(e, s ? s[0] : ''); };
Q.on('ui', () => { if (UI.view !== 'hunting' || !Q.act || Q.act.kind !== 'hunt') return; const sc = document.querySelector('#view .activity-scene.hunt'); if (!sc) return;
  let t = sc.querySelector('.hunt-steptag'); if (!t) { sc.insertAdjacentHTML('beforeend', '<span class="hunt-steptag" role="status"></span>'); t = sc.querySelector('.hunt-steptag'); }
  const s = Q.huntStep(); if (s && t.dataset.s !== s[0]) { t.dataset.s = s[0]; t.innerHTML = `${ico(s[2])}${s[0]}`; sc.dataset.step = D.HUNT_STEPS.indexOf(s); } });
Q.on('huntescape', () => { const sc = document.querySelector('#view .activity-scene.hunt'); if (sc && Q.floatAt) Q.floatAt(sc, 'It got away!', '#d9a066'); });
Q.on('huntcatch', (m, out) => { const sc = document.querySelector('#view .activity-scene.hunt'); if (sc && Q.floatAt) Q.floatAt(sc, out.length ? out.slice(0, 2).map(o => `+${o.n} ${D.ITEMS[o.id].name}`).join(' · ') : 'Caught!', '#f3d58a'); });
})();
