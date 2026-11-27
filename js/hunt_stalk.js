/* Idlewick: hunting is its own activity, not a fight (owner, 23 Nov 2026: "it's not a fight, it's about tracking,
   laying the trap and then quickly killing. Sometimes we shouldn't successfully kill them and so we go back to hunting").
   Hunting → Hunting ground: one ground for the whole world (owner, 26 Nov 2026), five tier tabs, ten animals in each
   (D.HUNT_GROUND); what you can hunt depends on your Hunting level and the tier's kit, never on the town you are in.
   Choose an animal and hunt it. Each hunt is one repeating task in three
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
/* better field traps help the strike: +4% per trap tier owned and usable */
const trapBonus = () => { const t = Q.fieldTrap ? Q.fieldTrap() : null; return t ? .04 * (D.FIELD_TRAPS.indexOf(t) + 1) : 0; };
/* hunts take 5-9 s, so about 400-700 an hour: these rates break roughly one trap every 7-10 minutes of hunting
   (wooden 12 an hour, reinforced 8-9, precision 6, ironjaw cage 4-5, starwoven net 3) */
Q.trapWear = id => ({ wooden_trap: 1 / 60, reinforced_trap: 1 / 70, precision_trap: 1 / 85, ironjaw_cage: 1 / 100, starwoven_net: 1 / 120 }[id] || 1 / 80) * (Q.buffMult ? Q.buffMult('trapCare') : 1);
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
/* ---------- tiers and kit (hunt_tiers_data.js) ---------- */
const tierOf = m => D.HUNT_TIERS ? D.HUNT_TIERS[m.tier ?? D.huntTierOf(m.hl)] : null;
Q.huntTierOf = id => { const m = animal(id); return m ? tierOf(m) : null; };
/* any active quest that wants this animal, in any town: such hunts never need the level or the kit */
Q.questWantsAnimal = id => Q.questWantsKill(id);
/* what stands between you and this hunt, as one short reason, or '' */
Q.huntKitNeed = id => { const m = animal(id), T = m && tierOf(m); if (!T || Q.questWantsAnimal(id)) return '';
  if (T.trap && !Q.have(T.trap)) return `Needs ${D.ITEMS[T.trap].name}`;
  if (T.bait && !Q.have(T.bait)) return `Needs ${D.ITEMS[T.bait].name}`; return ''; };
const lootOf = m => { const got = [], out = [];
  for (const [id, [a, b], p] of m.drops || []) { const it = D.ITEMS[id]; if (!it || it.type === 'gear' || it.type === 'ammo' || id === 'coin_pouch' || id === 'treasure_chest') continue;
    if (!Q.chance(Math.min(1, p * (Q.buffMult ? Q.buffMult('luck') : 1)))) continue;
    const n = a + Math.floor(Math.random() * (b - a + 1)); Q.grant(id, n); got.push(id); out.push({ id, n, rar: D.rarityOf ? D.rarityOf(p) : null }); }
  return { got, out }; };
Q.KIND_EXT.hunt = {
  valid: id => !!animal(id),
  skill: 'hunting', page: 'hunting', skillFor: () => 'hunting', pageFor: () => 'hunting',
  label: a => { const m = animal(a.id), s = Q.huntStep(a); return m ? `${s ? s[0] : 'Hunting'}: ${(S().beast.kills[m.id] || 0) > 0 ? m.name.toLowerCase() : 'unknown quarry'}` : 'Hunting'; },
  dur: id => Q.huntDur(id),
  check: id => { const m = animal(id); if (!m) return 'Choose an animal'; if (!Q.skillUnlocked('hunting')) return 'Learn Hunting first';
    /* one hunting ground for every town (owner, 26 Nov 2026): no travelling, only the Hunting level and the tier's kit.
       An animal that is no longer on the ground can still be hunted while a quest asks for it. */
    const wanted = Q.questWantsAnimal(id); if (!m.ground && !wanted) return 'Not on the hunting ground';
    if (Q.huntLevel() < m.hl && !wanted && !(Q.canHunt && Q.canHunt(m) && Q.questHuntTarget && Q.questHuntTarget() === id)) return `Requires Hunting ${m.hl}`;
    return Q.huntKitNeed(id); },
  done: a => { const m = animal(a.id); if (!m) return Q.stopAct(false, 'That animal is not here.');
    const caught = Q.chance(Q.huntCatch(a.id)), H = S().hunt = S().hunt || {}, T = tierOf(m);
    /* one bait per hunt, caught or not (a quest's animal can be hunted without, but uses one if you have it) */
    if (T && T.bait && Q.have(T.bait)) Q.take(T.bait, 1);
    /* traps wear out (owner, 27 Nov 2026: "the number of traps I'm using when hunting isn't changing"; chose wear): the
       trap you set can break, about 1 hunt in 60 for the wooden trap down to 1 in 120 for the sturdiest (one every 7-10
       minutes of hunting); the count drops live and the log says so */
    const setTrap = T && T.trap ? T.trap : (Q.fieldTrap && Q.fieldTrap() ? Q.fieldTrap().id : null);
    if (setTrap && Q.have(setTrap) && Q.chance(Q.trapWear(setTrap))) { Q.take(setTrap, 1);
      if (!Q.sim.on && !Q.forecasting) Q.log(`Your ${D.ITEMS[setTrap].name.toLowerCase()} broke. ${Q.have(setTrap) ? Q.have(setTrap) + ' left.' : 'That was your last one.'}`, 'warn'); }
    const stopIfOut = () => { const need = Q.huntKitNeed(a.id); if (need && Q.act === a) Q.stopAct(false, `${need} to keep hunting.`); };
    Q.addXp('hunting', Q.huntXp(a.id, caught));
    /* which step decided it: a miss is put down to losing the trail, the trap being dodged or the strike missing */
    const failAt = caught ? -1 : (r => r < .3 ? 0 : r < .6 ? 1 : 2)(Math.random());
    const res = { id: m.id, c: caught ? 1 : 0, f: failAt, t: Date.now() }; H.recent = [...(H.recent || []), { c: res.c, f: failAt }].slice(-12); a.lastHunt = res;
    if (!Q.sim.on && !Q.forecasting) Q.emit('huntresult', res, m);
    if (!caught) { H.escaped = (H.escaped || 0) + 1; a.escaped = (a.escaped || 0) + 1; if (!Q.sim.on && !Q.forecasting) { Q.log(`The ${(S().beast.kills[m.id] || 0) > 0 ? m.name.toLowerCase() : 'animal'} slipped away. Back to tracking.`); Q.emit('huntescape', m); } stopIfOut(); return; }
    if (Q.act) Q.act.count++; H.caught = (H.caught || 0) + 1; S().stats.hunts = (S().stats.hunts || 0) + 1;
    const { got, out } = lootOf(m);
    Q.qev('kill', m.id); Q.recordKill(m, got);
    const cid = 'wild_' + m.id, pet = D.PET && D.PET[cid];
    if (pet && pet.collectible && !S().pets.owned[cid] && !Q.forecasting && Q.chance(Math.max(.008, .05 - m.cl * .00035))) Q.awardPet(cid);
    if (!Q.forecasting) { for (const h of Q.killHooks || []) h(m); if (Q.recipeOnKill) Q.recipeOnKill(m); if (Q.museumScan && (S().beast.kills[m.id] || 0) <= 1) Q.museumScan(); }
    if (!Q.sim.on && !Q.forecasting) { Q.log(`You catch the ${m.name.toLowerCase()}.${out.length ? ' ' + out.map(o => `${o.n > 1 ? o.n + ' ' : ''}${D.ITEMS[o.id].name.toLowerCase()}`).join(', ') : ''}`, 'good'); Q.emit('huntcatch', m, out); }
    stopIfOut();
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
  /* with no target, the best animal on the one ground you can hunt right now */
  if (area && area.hunt && Q.skillUnlocked('hunting')) { const id = target && animal(target) ? target : [...(D.HUNT_GROUND || [])].reverse().find(k => !Q.KIND_EXT.hunt.check(k)); if (!id) return false;
    pick(id); return Q.startAct('hunt', id); }
  return start0(areaId, target, forQuest);
};
const pick = id => { const m = animal(id); if (!m) return; UI.huntMode = 'ground'; UI.huntTier = m.tier ?? D.huntTierOf(m.hl); UI.taskChoice.hunting = id; };
const openHunting = () => UI.view === 'hunting' ? UI.render(false) : Q.go('hunting');
const huntAnimal = id => { if (!animal(id) || !Q.skillUnlocked('hunting')) return false; UI.DO.huntground(id); return true; };
UI.DO.huntground = id => { if (!Q.skillUnlocked('hunting')) return Q.go('hunting'); UI.huntMode = 'ground'; if (id && animal(id)) pick(id); openHunting(); };
const track0 = UI.DO.hunttrack; UI.DO.hunttrack = id => huntAnimal(id) || track0(id);
const hq0 = UI.DO.huntquest; if (hq0) UI.DO.huntquest = id => huntAnimal(id) || hq0(id);
const hg0 = UI.DO.huntgo; if (hg0) UI.DO.huntgo = a => { const id = String(a).split('|')[1]; return huntAnimal(id) || hg0(a); };
/* an old save mid-fight with an animal carries on as a hunt */
const resume0 = Q.resumeAfterLoad;
Q.resumeAfterLoad = (...args) => {
  const a = S().act;
  if (a?.kind === 'fight' && animal(a.id) && Q.skillUnlocked('hunting')) {
    S().act = { ...a, kind: 'hunt', progress: 0 };
  }
  /* a hunt saved before the ground was made one (26 Nov 2026) for an animal no longer listed stops with a note */
  const b = S().act, gone = b && b.kind === 'hunt' && animal(b.id) && !D.MON[b.id].ground && !Q.questWantsAnimal(b.id);
  const r = resume0(...args);
  if (gone && !Q.act && Q.log) Q.log(`The ${(S().beast.kills[b.id] || 0) > 0 ? D.MON[b.id].name.toLowerCase() : 'animal'} you were hunting is no longer on the hunting ground, so that hunt has stopped. Pick another from Hunting.`);
  return r;
};
UI.focusHuntingActivity = a => {
  if (a.kind === 'hunt') pick(a.id);
  else {
    UI.huntMode = 'field';
    UI.taskChoice.hunting = a.id;
  }
  openHunting();
};
/* the combat window shows combat areas only */
UI.cwTab = 'areas';
const cw0 = UI.DO.cwtab; if (cw0) UI.DO.cwtab = t => t === 'hunt' ? UI.DO.huntground() : cw0(t);
/* ---------- the Hunting page: Hunting ground | Fieldwork ---------- */
const field0 = UI.V.hunting;
UI.DO.huntmode = mode => { UI.huntMode = mode === 'field' ? 'field' : 'ground'; UI.render(false); };
/* one hunting ground with five tier tabs (owner, 26 Nov 2026: "get rid of there being different towns for each ... Just
   have the different tiers"). Which tier opens first follows your Hunting level. */
const defaultTier = () => { const L = Q.huntLevel(); let t = 0; D.HUNT_TIERS.forEach((T, i) => { if (L >= T.lo) t = i; }); return t; };
/* the animals listed in a tier: the ground's own, plus any other animal an active quest still asks for */
Q.groundTier = i => { const ids = (D.HUNT_GROUND || []).filter(id => D.MON[id].tier === i);
  for (const m of D.MONLIST) if (m.hl && !m.ground && m.tier === i && animal(m.id) && Q.questWantsAnimal(m.id) && !ids.includes(m.id)) ids.push(m.id);
  return ids.map(id => D.MON[id]).sort((a, b) => a.hl - b.hl); };
UI.DO.hunttier = i => { UI.huntTier = Math.max(0, Math.min(4, +i || 0)); UI.render(false); };
UI.DO.huntkit = id => { const r = D.RECIPES['craft_' + id] || D.RECIPES['cook_' + id]; if (!r) return; const bm = UI.view === 'beastmastery'; UI.returnTo = { page: bm ? 'beastmastery' : 'hunting', label: bm ? 'Beastmastery' : 'Hunting' }; UI.focusTask(r.skill, r.id, r.tab, r.skill); };
/* kit counts update live while you hunt (owner, 26 Nov 2026: "need to be able to see how many traps I have left") */
const part = id => { const n = Q.have(id), it = D.ITEMS[id]; return `<button type="button" class="hunt-kit-item ${n ? 'ok' : 'miss'}" data-do="huntkit" data-a="${id}" data-tip="item:${id}" aria-label="${esc(it.name)}: ${n} held, make more">${Q.itemIco(it)}<span>${esc(it.name)}</span><b class="mono" data-b="count:${id}">${n}</b></button>`; };
UI.huntKitPart = part;
/* the five tier tabs, shared with Beastmastery's Capture tab (beast_capture.js) */
UI.huntTierTabs = (cur, action, level) => `<nav class="hunt-tiers btnrow" role="tablist" aria-label="Tiers">${D.HUNT_TIERS.map((t, i) => { const on = i === cur, open = level >= t.lo;
  return `<button type="button" class="btn sm ${on ? 'on' : ''}" role="tab" aria-selected="${on}" data-do="${action}" data-a="${i}">${open ? '' : ico('lock')}${esc(t.name)}<small class="mono">${t.lo}–${t.hi}</small></button>`; }).join('')}</nav>`;
const kitLine = T => { if (!T || (!T.trap && !T.bait)) return D.ITEMS.wooden_trap ? `<div class="hunt-kit"><span class="k">Kit</span>${part('wooden_trap')}<small class="dim">Optional: a trap helps the strike, and wears out now and then.</small></div>` : `<p class="hunt-kit dim">No kit needed.</p>`;
  return `<div class="hunt-kit"><span class="k">${esc(T.name)} kit</span>${part(T.trap)}${part(T.bait)}<small class="dim">One bait per hunt; a trap breaks about 1 hunt in ${Math.round(1 / Q.trapWear(T.trap))}.</small></div>`; };
const groundPage = () => {
  if (UI.huntTier === undefined) UI.huntTier = defaultTier();
  const T = D.HUNT_TIERS[UI.huntTier], L = Q.huntLevel();
  const ttabs = UI.huntTierTabs(UI.huntTier, 'hunttier', L);
  const choices = Q.groundTier(UI.huntTier).map(m => { const id = m.id, known = (S().beast.kills[id] || 0) > 0, wanted = Q.questWantsAnimal(id), open = L >= m.hl || wanted, need = open ? Q.huntKitNeed(id) : '', pct = Math.round(Q.huntCatch(id) * 100);
    const drops = (m.drops || []).map(d => d[0]).filter((k, i, a) => D.ITEMS[k] && a.indexOf(k) === i && Q.itemDiscovered(k));
    const why = !open ? `Requires Hunting ${m.hl}` : need;
    /* an animal you have not caught yet stays ??? (UI rules: unmet creatures are never named) */
    return { id, name: known ? m.name : '???', artKind: 'creature', artId: id, yieldId: null, locked: !open, revealed: false, blocked: !open || !!need, reason: why, short: !open ? 'Lv ' + m.hl : '',
      caption: `Hunting ${m.hl}${wanted ? ' · Quest' : ''}`, stateText: !open ? 'Locked' : need ? need.replace(/^Needs /, 'No ') : `${pct}% catch`,
      info: `<div class="hunt-steps">${D.HUNT_STEPS.map(s => `<span>${ico(s[2])}${s[0]}</span>`).join('<i aria-hidden="true">→</i>')}</div>${kitLine(T)}<p class="dim">${pct}% chance the strike lands; otherwise it slips away and you start tracking again. ${Q.huntXpShown(id, true)} Hunting XP a catch, ${Q.huntXpShown(id, false)} if it gets away.</p>${drops.length ? `<div class="hunt-drops"><span class="k">Drops</span>${drops.map(k => `<span class="cw-drop" data-tip="item:${k}">${Q.itemIco(D.ITEMS[k])}</span>`).join('')}</div>` : ''}` }; });
  if (!choices.length) return ttabs + `<section class="panel empty"><p>No ${esc(T.name.toLowerCase())} animals here.</p></section>`;
  /* the catalogue's corner gives the tier's level band, not a town: the ground is the same from everywhere */
  return ttabs + UI.taskPanel('hunting', `Hunting ground · ${T.name}`, 'hunt', choices, 'Hunt').replace(`>${D.TOWN[S().town].name}</small>`, `>Hunting ${T.lo}–${T.hi}</small>`);
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
Q.on('ui', () => { if (UI.view !== 'hunting' || !Q.act || Q.act.kind !== 'hunt') return; const sc = document.querySelector('#view .activity-scene.hunt'); if (!sc || sc.dataset.task !== Q.act.id) return;
  let t = sc.querySelector('.hunt-steptag'); if (!t) { sc.insertAdjacentHTML('beforeend', '<span class="hunt-steptag" role="status"></span>'); t = sc.querySelector('.hunt-steptag'); }
  const s = Q.huntStep(); if (s && t.dataset.s !== s[0]) { t.dataset.s = s[0]; t.innerHTML = `${ico(s[2])}${s[0]}`; sc.dataset.step = D.HUNT_STEPS.indexOf(s); } });
Q.on('huntescape', () => { const sc = document.querySelector('#view .activity-scene.hunt'); if (sc && Q.floatAt) Q.floatAt(sc, 'It got away!', '#d9a066'); });
Q.on('huntcatch', (m, out) => { const sc = document.querySelector('#view .activity-scene.hunt'); if (sc && Q.floatAt) Q.floatAt(sc, out.length ? out.slice(0, 2).map(o => `+${o.n} ${D.ITEMS[o.id].name}`).join(' · ') : 'Caught!', '#f3d58a'); });

/* ---------- how far the hunt has got, and how the last one went (owner, 23 Nov 2026: "more visual at what stage
   you're at with each hunt and whether certain elements were successful") ----------
   A strip of the three steps under the progress bar: the current one lit, the ones behind it ticked. When a hunt
   resolves, the strip shows that hunt's result for a moment: each step that worked gets a tick, the one that failed a
   cross (lost the trail, dodged the trap, missed the strike), and a catch ends on a full row of ticks. Beside it, dots
   for the last twelve hunts. The scene follows the steps: the animal is distant while you track, the trap appears
   when it is set, you lunge on the strike, then it is caught or bolts. All of it after the roll, never before. */
const FAIL = ['Lost the trail', 'Dodged the trap', 'Missed the strike'];
let showing = null, showTimer = 0;
const stripHtml = () => `<div class="hunt-track" role="status" aria-live="polite"><ol class="hunt-track-steps">${D.HUNT_STEPS.map((s, i) => `<li data-i="${i}"><span class="ht-ico">${ico(s[2])}</span><span class="ht-name">${['Track', 'Set trap', 'Strike'][i]}</span><span class="ht-mark" aria-hidden="true"></span></li>`).join('')}</ol><div class="hunt-track-out"></div><div class="hunt-recent" aria-label="Last hunts"></div></div>`;
const paint = () => {
  if (UI.view !== 'hunting' || UI.huntMode === 'field') return;
  const stage = document.querySelector('#view .activity-stage'); if (!stage) return;
  const sc = stage.querySelector('.activity-scene'), a0 = Q.act && Q.act.kind === 'hunt' ? Q.act : null;
  /* only the animal you are hunting gets the strip; looking at another card shows its details alone */
  const a = a0 && sc && sc.dataset.task === a0.id ? a0 : null;
  if (!a && !(showing && sc && sc.dataset.task === showing.id)) { stage.querySelector('.hunt-track')?.remove(); sc?.querySelector('.hunt-steptag')?.remove(); if (sc) delete sc.dataset.step; return; }
  let el = stage.querySelector('.hunt-track');
  if (!el) { const after = stage.querySelector('.activity-progress'); if (!after) return; after.insertAdjacentHTML('afterend', stripHtml()); el = stage.querySelector('.hunt-track'); }
  const lis = el.querySelectorAll('.hunt-track-steps li'), out = el.querySelector('.hunt-track-out');
  if (showing) {
    lis.forEach((li, i) => { const st = showing.c ? 'ok' : i < showing.f ? 'ok' : i === showing.f ? 'fail' : 'skip'; if (li.dataset.st !== st) { li.dataset.st = st; li.querySelector('.ht-mark').textContent = st === 'ok' ? '✓' : st === 'fail' ? '✗' : ''; } });
    const txt = showing.c ? 'Caught!' : `${FAIL[showing.f]}. It got away.`; if (out.textContent !== txt) { out.textContent = txt; out.dataset.r = showing.c ? 'ok' : 'fail'; }
  } else {
    const step = a ? D.HUNT_STEPS.indexOf(Q.huntStep(a)) : -1;
    lis.forEach((li, i) => { const st = step < 0 ? 'idle' : i < step ? 'done' : i === step ? 'now' : 'next'; if (li.dataset.st !== st) { li.dataset.st = st; li.querySelector('.ht-mark').textContent = st === 'done' ? '✓' : ''; } });
    const txt = a ? `${Q.huntStep(a)[0]}…` : ''; if (out.textContent !== txt) { out.textContent = txt; out.dataset.r = ''; }
    if (sc && a) { const k = String(step); if (sc.dataset.step !== k) sc.dataset.step = k; }
  }
  const rec = (S().hunt && S().hunt.recent) || [], sig = rec.map(r => r.c + '' + r.f).join(',');
  const box = el.querySelector('.hunt-recent'); if (box.dataset.sig !== sig) { box.dataset.sig = sig;
    box.innerHTML = rec.length ? `<span class="k">Last ${rec.length}</span>${rec.map(r => `<i class="${r.c ? 'ok' : 'fail'}" title="${r.c ? 'Caught' : FAIL[r.f]}"></i>`).join('')}<b class="mono">${rec.filter(r => r.c).length}/${rec.length}</b>` : ''; }
  /* the trap appears in the scene once it is set */
  if (sc && !sc.querySelector('.hunt-trap')) { const T = Q.act && Q.act.kind === 'hunt' ? Q.huntTierOf(Q.act.id) : null, id = (T && T.trap) || 'wooden_trap'; sc.insertAdjacentHTML('beforeend', `<span class="hunt-trap" aria-hidden="true">${Q.itemIco(D.ITEMS[id])}</span>`); }
};
Q.on('ui', paint);
Q.on('huntresult', res => {
  showing = res; clearTimeout(showTimer);
  const sc = document.querySelector('#view .activity-scene.hunt'); if (sc) { sc.dataset.result = res.c ? 'caught' : 'escaped'; sc.dataset.step = '2'; }
  paint(); showTimer = setTimeout(() => { showing = null; const s2 = document.querySelector('#view .activity-scene.hunt'); if (s2) delete s2.dataset.result; paint(); }, 1600);
});
})();
