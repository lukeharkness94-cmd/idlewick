/* Idlewick: Beastmastery captures, and eggs as lucky finds (owner, 26 Nov 2026).
   "Hunting and beastmastery should be two defined things: hunting you are simply going out to try and trap and kill
   creatures for their drops. Beastmastery is the ability to trap and capture animals to keep them, have them as
   companions and level them up. Eggs should be random drops in combat or skills, not the only way to get beasts."
   The owner chose: "Capture replaces expeditions. Beastmastery gets a Capture task like a hunt (track -> set live
   trap -> coax), but a success keeps the animal instead of killing it. Any animal you've hunted can be caught; better
   Beastmastery = better odds. Eggs become rare random drops from combat and all skills. Expeditions go (one already
   out still comes back)."

   Capture (KIND_EXT.capture, id = creature id). The same machinery as a hunt (hunt_stalk.js), so offline work, the
   queue and the Now card behave the same way:
     - three steps: Tracking 40%, Setting the live trap 30%, Coaxing 30% of the cycle (8 s + 0.09 s per Hunting level
       of the animal, before speed bonuses and field-guide entries);
     - any animal you have caught at least once while hunting (S.beast.kills) can be captured, from any town;
     - odds: 55% + 2.5% per Beastmastery level above the animal's Hunting level, between 35% and 90%;
     - kit by tier: a live trap (wooden trap; padded live trap; padded live trap; rune trap; rune trap), which goes
       home with the animal you keep and is not used up otherwise, and from Intermediate up the hunting tier's bait,
       one per try (scent bait, honey bait, smoked lure, moonlit lure);
     - Beastmastery XP per try on the same scale as Hunting XP (an escape pays 30%);
     - a success keeps the animal as a beast (DQ.awardPet('wild_<id>', { hatched: true })): it goes straight to your
       pens, no egg. An animal you already own is tagged and let go instead: full XP, no duplicate, the trap is kept.
   Never in a forecast; offline captures appear in the welcome-back summary from the beast events.

   Expeditions (the Trapper) are retired: nothing can be sent, and an expedition already out still comes back once at
   its saved time (beastmastery.js resolveBeastTrap, untouched).

   Eggs as lucky finds: any skilling action (gathering, making, farming, sailing, fieldwork, drills, captures) has a
   1 in 2,000 chance and any victory or catch a 1 in 500 chance of an egg, from the beasts that used to come only from
   the Trapper (D.BEAST_SPECIES) whose Hero level you have reached in a town you have visited. Never in forecasts. The
   Collection page shows these odds. Every existing egg source (skill pets, harvest, bosses, wild signature beasts,
   fieldwork) is unchanged. */
(() => {
const Q = window.DQ, D = Q.data, UI = Q.ui, S = () => Q.S, { esc, ico, fmt } = Q;
if (!D.HUNT_TIERS || !Q.KIND_EXT || !Q.KIND_EXT.hunt) return;
D.CAPTURE_STEPS = [['Tracking', .40, 'paw'], ['Setting the live trap', .30, 'pin'], ['Coaxing', .30, 'heart']];
D.CAPTURE_KIT = [{ trap: 'wooden_trap', bait: null }, { trap: 'live_trap', bait: 'scent_bait' }, { trap: 'live_trap', bait: 'honey_bait' }, { trap: 'rune_trap', bait: 'smoked_lure' }, { trap: 'rune_trap', bait: 'moonlit_lure' }];
D.EGG_DROP = { action: 1 / 2000, kill: 1 / 500 };
const FAIL = ['Lost the trail', 'It sniffed the trap', 'It would not come'];
const areaOf = id => Object.values(D.AREAS).flat().find(a => a.hunt && a.monsters.some(e => e.id === id)) || null;
const animal = id => { const m = D.MON[id]; return m && m.hl && areaOf(id) ? m : null; };
const hunted = id => ((S().beast.kills || {})[id] || 0) > 0;
const pid = id => 'wild_' + id;
const owned = id => !!(S().pets.owned[pid(id)] || (Q.eggOf && Q.eggOf(pid(id))));
const rec = () => { const p = S().pets; const C = p.capture = p.capture && typeof p.capture === 'object' ? p.capture : {}; C.recent = Array.isArray(C.recent) ? C.recent : []; C.tries = C.tries && typeof C.tries === 'object' ? C.tries : {}; return C; };
Q.captureKit = id => { const m = animal(id); return m ? D.CAPTURE_KIT[m.tier ?? D.huntTierOf(m.hl)] : null; };
Q.captureChance = id => { const m = animal(id); if (!m) return 0; return Math.max(.35, Math.min(.9, .55 + .025 * (Q.lvl('beastmastery') - m.hl))); };
const rawDur = id => { const m = animal(id); return m ? 8000 + m.hl * 90 : 8000; };
Q.captureXp = (id, ok) => { const m = animal(id); if (!m) return 0; const L = Q.lvl('beastmastery');
  return Math.max(1, Math.round(8 * (5 + .35 * L) * (rawDur(id) / 8000) * (1 + m.hl / 100) / .75 * (ok ? 1 : .3))); };
Q.captureXpShown = (id, ok) => Math.max(1, Math.round(Q.captureXp(id, ok) * (Q.xpMult ? Q.xpMult('beastmastery') : 1) * (Q.catchUp ? Q.catchUp('beastmastery') : 1)));
Q.captureStep = (a = Q.act) => { if (!a || a.kind !== 'capture') return null; const p = Math.min(1, Math.max(0, (Date.now() - a.t0) / (a.dur || 1)));
  let acc = 0; for (const s of D.CAPTURE_STEPS) { acc += s[1]; if (p < acc) return s; } return D.CAPTURE_STEPS[2]; };
/* what stands between you and a capture, as one short reason, or '' */
Q.captureNeed = id => { const m = animal(id); if (!m) return 'Choose an animal';
  if (!hunted(id)) return 'Hunt one first';
  const K = Q.captureKit(id); if (K.trap && !Q.have(K.trap)) return `Needs ${D.ITEMS[K.trap].name}`; if (K.bait && !Q.have(K.bait)) return `Needs ${D.ITEMS[K.bait].name}`; return ''; };
const named = m => hunted(m.id) ? m.name.toLowerCase() : 'animal';
const event = (kind, id, text) => { if (Q.forecasting) return; const p = S().pets; p.events = Array.isArray(p.events) ? p.events : []; p.events.push({ kind, id, text, t: Date.now() }); if (p.events.length > 40) p.events.splice(0, p.events.length - 40); if (Q.journal) Q.journal('beast', text, 'paw'); };
Q.KIND_EXT.capture = {
  valid: id => !!animal(id),
  skill: 'beastmastery', page: 'beastmastery', skillFor: () => 'beastmastery', pageFor: () => 'beastmastery',
  label: a => { const m = animal(a.id), s = Q.captureStep(a); return m ? `${s ? s[0] : 'Capturing'}: ${named(m)}` : 'Capturing'; },
  dur: id => rawDur(id),
  check: id => { const m = animal(id); if (!m) return 'Choose an animal'; if (!Q.skillUnlocked('beastmastery')) return 'Learn Beastmastery first'; return Q.captureNeed(id); },
  done: a => {
    const m = animal(a.id); if (!m) return Q.stopAct(false, 'That animal is not here.');
    const K = Q.captureKit(a.id), C = rec(), ok = Q.chance(Q.captureChance(a.id)), had = owned(m.id), keep = ok && !had && !Q.forecasting;
    if (K.bait && Q.have(K.bait)) Q.take(K.bait, 1);
    Q.addXp('beastmastery', Q.captureXp(a.id, ok));
    C.tries[m.id] = (C.tries[m.id] || 0) + 1;
    const failAt = ok ? -1 : (r => r < .3 ? 0 : r < .6 ? 1 : 2)(Math.random());
    const res = { id: m.id, c: ok ? 1 : 0, f: failAt, k: keep ? 1 : 0, t: Date.now() }; C.recent = [...C.recent, { c: res.c, f: failAt, k: res.k }].slice(-12); a.lastCapture = res;
    const stopIfOut = () => { const need = Q.captureNeed(a.id); if (need && Q.act === a) Q.stopAct(false, `${need} to keep capturing.`); };
    if (!Q.sim.on && !Q.forecasting) Q.emit('captureresult', res, m);
    Q.eggDrop('action');
    if (!ok) { C.escaped = (C.escaped || 0) + 1; if (!Q.sim.on && !Q.forecasting) Q.log(`The ${named(m)} would not be caught. Back to tracking.`); stopIfOut(); return; }
    a.count++;
    if (keep) {
      if (K.trap) Q.take(K.trap, 1);
      Q.awardPet(pid(m.id), { hatched: true, quiet: true }); if (S().pets.owned[pid(m.id)]) S().pets.owned[pid(m.id)].caught = Date.now(); if (Q.migrateBeasts) Q.migrateBeasts(S());
      C.kept = (C.kept || 0) + 1; S().stats.captures = (S().stats.captures || 0) + 1; Q.qev('capture', m.id);
      const p = D.PET[pid(m.id)], text = `You caught a ${m.name.toLowerCase()} alive. It is in your pens.`;
      event('capture', pid(m.id), text);
      if (!Q.sim.on) { Q.log(text, 'quest'); Q.sfx && Q.sfx('gem');
        Q.notify({ kind: 'unlock', key: 'capture:' + m.id, icon: 'paw', col: m.col, title: `Caught: ${m.name}`, text: `In your pens. As your companion: ${p ? p.text : 'a small bonus'}.`, sound: false, burst: true, ttl: 9000,
          action: S().pets.active === pid(m.id) ? { label: 'See the ranch', fn: () => { UI.beastMode = 'beasts'; Q.go('beastmastery'); } } : { label: 'Make companion', fn: () => Q.setPet(pid(m.id)) } });
        Q.emit('pets'); Q.emit('capturekept', m); }
    } else if (!Q.forecasting) {
      C.released = (C.released || 0) + 1;
      if (!Q.sim.on) Q.log(`You coax the ${m.name.toLowerCase()} into the trap, check it over and let it go. You already have one.`);
    }
    stopIfOut();
  }
};
/* capture shares the trap-line district; its field-guide topic is Captures (guide_materials.js), counted per success */
const du0 = Q.districtUrl; if (du0) Q.districtUrl = (town, kind, ...r) => du0(town, kind === 'capture' ? 'train' : kind, ...r);
const verb0 = Q.mastVerb; if (verb0) Q.mastVerb = (kind, id) => kind === 'capture' ? 'Capture' : verb0(kind, id);
const name0 = Q.mastName; if (name0) Q.mastName = (kind, id) => kind === 'capture' ? (D.MON[id] ? D.MON[id].name : id) : name0(kind, id);

/* ---------- expeditions are retired: nothing new can be sent; one already out still resolves (beastmastery.js) ---------- */
Q.beastTrapReason = () => 'The Trapper has retired: capture animals instead';
Q.sendBeastTrap = () => false;
if (D.ITEMS.live_trap) D.ITEMS.live_trap.sub = 'Beastmastery: a live trap for Intermediate and Skilled captures. It goes home with the animal you keep.';
if (D.ITEMS.rune_trap) D.ITEMS.rune_trap.sub = 'Craft at Crafting 55 or find on regional bosses. A live trap for Expert and Master captures.';
if (D.ITEMS.wooden_trap) D.ITEMS.wooden_trap.sub = 'Fieldwork gear (25% break chance) and the live trap for Beginner captures in Beastmastery.';
/* why you need a trap or bait now (item_uses.js): the capture tiers it opens */
const uses0 = Q.usesOf;
if (uses0) Q.usesOf = id => { const out = uses0(id); if (!Q.skillUnlocked('beastmastery') || out.length >= 3) return out;
  const tiers = D.CAPTURE_KIT.map((k, i) => (k.trap === id || k.bait === id) ? D.HUNT_TIERS[i].name : null).filter(Boolean);
  if (tiers.length) out.push({ k: 'capture', text: `${D.CAPTURE_KIT.some(k => k.trap === id) ? 'Live trap' : 'Bait'} for ${tiers.join(' and ')} captures`, go: { do: 'capturetier', a: String(D.CAPTURE_KIT.findIndex(k => k.trap === id || k.bait === id)), label: 'Beastmastery' } });
  return out.slice(0, 3); };

/* ---------- eggs as lucky finds ---------- */
Q.eggPool = () => Object.entries(D.BEAST_SPECIES || {}).filter(([id, s]) => D.PET[id] && !S().pets.owned[id] && !(Q.eggOf && Q.eggOf(id)) && Q.advLvl() >= s.hero && !!(S().towns[s.town] && S().towns[s.town].visited)).map(([id]) => id);
Q.eggDrop = kind => {
  if (Q.forecasting || !Q.S || !S().pets) return false;
  const pool = Q.eggPool(), p = D.EGG_DROP[kind] || 0; if (!pool.length || !p || !Q.chance(p)) return false;
  return Q.awardPet(pool[Math.floor(Math.random() * pool.length)]);
};
const roll0 = Q.petRoll; Q.petRoll = (type, key) => { const r = roll0(type, key); if (type === 'skill' || type === 'harvest') Q.eggDrop('action'); return r; };
(Q.killHooks = Q.killHooks || []).push(() => Q.eggDrop('kill'));
for (const k of ['train', 'drill']) { const ext = Q.KIND_EXT[k]; if (!ext || ext._eggs) continue; const done0 = ext.done; ext.done = a => { const before = a.count; const r = done0(a); if (a.count > before || k === 'drill') Q.eggDrop('action'); return r; }; ext._eggs = true; }
/* egg sources and odds, truthfully: a Trapper species is now a lucky find */
const src0 = Q.eggSource; if (src0) Q.eggSource = id => { const p = D.PET[id] || {}; if ((p.src || {}).type === 'beasttrap') return 'A lucky find'; const m = (p.src || {}).type === 'hunt' && D.MON[p.src.mon]; if (m && m.hl) return `A ${m.name.toLowerCase()} from the hunting ground`; return src0(id); };
const odds0 = Q.petOdds;
if (odds0) Q.petOdds = id => { const p = D.PET[id], s = (p && p.src) || {}, spec = (D.BEAST_SPECIES || {})[id];
  if (spec) { const pool = Q.eggPool(), n = Math.max(1, pool.length), here = pool.includes(id);
    return { where: here ? `Lucky find · any skill or fight (one of ${n} eggs)` : `Lucky find · from Hero ${spec.hero} in ${D.TOWN[spec.town].name}`, luck: true, p: here ? D.EGG_DROP.action / n : 0, per: 'action', tries: 0, go: 'beastmastery', kill: D.EGG_DROP.kill / n }; }
  const m = s.type === 'hunt' && D.MON[s.mon];
  if (m && m.hl) return { where: `Capture it in Beastmastery${hunted(m.id) ? '' : ' once you have hunted one'}`, p: hunted(m.id) ? Q.captureChance(m.id) : 0, per: 'try', tries: rec().tries[m.id] || 0, unit: 'tries', go: 'beastmastery' };
  return odds0(id); };

/* a caught beast's journey starts with the catch, not an egg (eggs.js UI.beastJourney) */
const journey0 = UI.beastJourney;
if (journey0) UI.beastJourney = id => { const h = journey0(id), o = S().pets.owned[id]; if (!h || !o || !o.caught) return h;
  const day = new Date(o.caught).toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
  return h.replace(/<li class="on"[^>]*>[\s\S]*?<\/li>/, `<li class="on" data-tip="text:Caught alive · ${esc(day)}"><span class="bj-ic">${ico('paw')}</span><small>Caught</small></li>`)
    .replace(/(<li class="on"[^>]*><span class="bj-ic">[\s\S]*?<\/span><small>)Hatched(<\/small>)/, '$1In your pens$2'); };
/* ---------- the Capture tab ---------- */
const defaultTier = () => { let t = 0; for (let i = 0; i < 5; i++) if (listFor(i).some(m => hunted(m.id))) t = i; return t; };
const listFor = i => { const ids = new Set(Q.groundTier ? Q.groundTier(i).map(m => m.id) : []);
  /* an animal that left the hunting ground can still be captured once you have caught one */
  for (const m of D.MONLIST) if (m.hl && m.tier === i && hunted(m.id) && animal(m.id)) ids.add(m.id);
  return [...ids].map(id => D.MON[id]).sort((a, b) => a.hl - b.hl); };
UI.DO.capturetier = i => { UI.captureTier = Math.max(0, Math.min(4, +i || 0)); UI.beastMode = 'capture'; UI.view === 'beastmastery' ? UI.render(false) : Q.go('beastmastery'); };
UI.DO.capturepick = id => { const m = animal(id); if (!m) return; UI.beastMode = 'capture'; UI.captureTier = m.tier ?? D.huntTierOf(m.hl); UI.taskChoice.beastmastery = id; UI.view === 'beastmastery' ? UI.render(false) : Q.go('beastmastery'); };
const nowAct0 = UI.DO.nowactivity; UI.DO.nowactivity = (...a) => Q.act && Q.act.kind === 'capture' ? UI.DO.capturepick(Q.act.id) : nowAct0(...a);
const part = id => UI.huntKitPart ? UI.huntKitPart(id) : '';
const kitLine = K => `<div class="hunt-kit"><span class="k">Kit</span>${K.trap ? part(K.trap) : ''}${K.bait ? part(K.bait) : ''}<small class="dim">The trap goes home with the animal you keep${K.bait ? '; one bait per try' : ''}.</small></div>`;
const expeditionLine = () => { const j = S().pets.expedition; if (!j || !D.PET[j.species]) return '';
  return `<span class="capture-old-trap">${ico('clock')}Old trap out for ${esc(D.PET[j.species].name)} · <span data-beast-due="${j.due}">${Q.fmtTime(Math.max(0, j.due - Date.now()))}</span></span>`; };
UI.captureView = () => {
  if (UI.captureTier === undefined) UI.captureTier = defaultTier();
  const T = D.HUNT_TIERS[UI.captureTier], K = D.CAPTURE_KIT[UI.captureTier], L = Q.lvl('beastmastery'), C = rec();
  const all = D.MONLIST.filter(m => m.hl && (Q.animalListed ? Q.animalListed(m) : true)), mine = all.filter(m => S().pets.owned[pid(m.id)]).length;
  /* one row above the workspace, like Hunting's: the tier tabs, then how many you have caught (and the last tries) */
  const tabs = UI.huntTierTabs ? UI.huntTierTabs(UI.captureTier, 'capturetier', Math.max(L, Q.huntLevel ? Q.huntLevel() : 1)) : '';
  const sum = `<span class="capture-sum" data-tip="text:Animals you have hunted can be caught and kept. Higher Beastmastery, better odds."><span class="k">Caught alive</span><b class="mono">${mine}/${all.length}</b></span>${C.recent.length ? `<span class="hunt-recent" aria-label="Last captures"><span class="k">Last ${C.recent.length}</span>${C.recent.map(r => `<i class="${r.c ? 'ok' : 'fail'}" title="${r.c ? (r.k ? 'Kept' : 'Let go') : FAIL[r.f]}"></i>`).join('')}<b class="mono">${C.recent.filter(r => r.c).length}/${C.recent.length}</b></span>` : ''}${expeditionLine()}`;
  const head = `<div class="capture-bar">${tabs}<div class="capture-head">${sum}</div></div>`;
  const choices = listFor(UI.captureTier).map(m => { const id = m.id, got = hunted(id), mineNow = owned(id), need = got ? Q.captureNeed(id) : '', pct = Math.round(Q.captureChance(id) * 100), p = D.PET[pid(id)];
    return { id, name: got ? m.name : '???', artKind: 'creature', artId: id, yieldId: null, locked: !got, revealed: false, blocked: !got || !!need, reason: got ? need : 'Hunt one on the Hunting ground first', short: got ? '' : 'Hunt one first',
      caption: mineNow ? 'In your pens' : `Lv ${m.hl}`, stateText: need ? need.replace(/^Needs /, 'No ') : mineNow ? `${pct}% · tag & release` : `${pct}% capture`,
      info: `<div class="hunt-steps">${D.CAPTURE_STEPS.map(s => `<span>${ico(s[2])}${s[0]}</span>`).join('<i aria-hidden="true">→</i>')}</div>${kitLine(K)}<p class="dim">${pct}% chance it walks into the trap; otherwise it wanders off and you track it again. ${Q.captureXpShown(id, true)} Beastmastery XP a capture, ${Q.captureXpShown(id, false)} if it gets away.</p><p class="capture-gives">${mineNow ? `${ico('paw')} Already yours: a capture is let go again, for the XP.` : `${ico('paw')} Keep it as a beast. As your companion: ${esc(p ? p.text : 'a small bonus')}.`}</p>` }; });
  if (!choices.length) return head + `<section class="panel empty"><p>No ${esc(T.name.toLowerCase())} animals yet.</p></section>`;
  const h = UI.taskPanel('beastmastery', `Capture · ${T.name}`, 'capture', choices, 'Capture')
    .replace(`>${D.TOWN[S().town].name}</small>`, `>Hunting ${T.lo}–${T.hi}</small>`).replace('activity-scene capture ', 'activity-scene capture hunt ')
    .replace('<h2>Choose your spot</h2>', '<h2>Choose an animal</h2>');
  return head + h;
};

/* ---------- the stage: three steps, how the last try went, the trap in the scene ---------- */
let showing = null, showTimer = 0;
const stripHtml = () => `<div class="hunt-track capture-track" role="status" aria-live="polite"><ol class="hunt-track-steps">${D.CAPTURE_STEPS.map((s, i) => `<li data-i="${i}"><span class="ht-ico">${ico(s[2])}</span><span class="ht-name">${['Track', 'Set live trap', 'Coax'][i]}</span><span class="ht-mark" aria-hidden="true"></span></li>`).join('')}</ol><div class="hunt-track-out"></div></div>`;
const paint = () => {
  if (UI.view !== 'beastmastery' || UI.beastMode !== 'capture') return;
  const stage = document.querySelector('#view .activity-stage'), sc = stage && stage.querySelector('.activity-scene.capture'); if (!sc) return;
  const a0 = Q.act && Q.act.kind === 'capture' ? Q.act : null, a = a0 && sc.dataset.task === a0.id ? a0 : null;
  if (!a && !(showing && sc.dataset.task === showing.id)) { stage.querySelector('.hunt-track')?.remove(); sc.querySelector('.hunt-steptag')?.remove(); delete sc.dataset.step; return; }
  let el = stage.querySelector('.hunt-track');
  if (!el) { const after = stage.querySelector('.activity-progress'); if (!after) return; after.insertAdjacentHTML('afterend', stripHtml()); el = stage.querySelector('.hunt-track'); }
  const lis = el.querySelectorAll('.hunt-track-steps li'), out = el.querySelector('.hunt-track-out');
  if (showing) {
    lis.forEach((li, i) => { const st = showing.c ? 'ok' : i < showing.f ? 'ok' : i === showing.f ? 'fail' : 'skip'; if (li.dataset.st !== st) { li.dataset.st = st; li.querySelector('.ht-mark').textContent = st === 'ok' ? '✓' : st === 'fail' ? '✗' : ''; } });
    const txt = showing.c ? (showing.k ? 'Caught! It’s yours.' : 'Caught, checked over and let go.') : `${FAIL[showing.f]}. It got away.`; if (out.textContent !== txt) { out.textContent = txt; out.dataset.r = showing.c ? 'ok' : 'fail'; }
  } else {
    const step = D.CAPTURE_STEPS.indexOf(Q.captureStep(a));
    lis.forEach((li, i) => { const st = i < step ? 'done' : i === step ? 'now' : 'next'; if (li.dataset.st !== st) { li.dataset.st = st; li.querySelector('.ht-mark').textContent = st === 'done' ? '✓' : ''; } });
    const txt = `${Q.captureStep(a)[0]}…`; if (out.textContent !== txt) { out.textContent = txt; out.dataset.r = ''; }
    const k = String(step); if (sc.dataset.step !== k) sc.dataset.step = k;
    let t = sc.querySelector('.hunt-steptag'); if (!t) { sc.insertAdjacentHTML('beforeend', '<span class="hunt-steptag"></span>'); t = sc.querySelector('.hunt-steptag'); }
    const s = Q.captureStep(a); if (t.dataset.s !== s[0]) { t.dataset.s = s[0]; t.innerHTML = `${ico(s[2])}${s[0]}`; }
  }
  if (!sc.querySelector('.hunt-trap')) { const K = Q.captureKit(sc.dataset.task), id = (K && K.trap) || 'wooden_trap'; if (D.ITEMS[id]) sc.insertAdjacentHTML('beforeend', `<span class="hunt-trap" aria-hidden="true">${Q.itemIco(D.ITEMS[id])}</span>`); }
};
Q.on('ui', paint);
Q.on('captureresult', res => {
  showing = res; clearTimeout(showTimer);
  const sc = document.querySelector('#view .activity-scene.capture'); if (sc) { sc.dataset.result = res.c ? (res.k ? 'kept' : 'caught') : 'escaped'; sc.dataset.step = '2'; if (Q.floatAt) Q.floatAt(sc, res.c ? (res.k ? 'Caught alive!' : 'Let it go') : 'It got away!', res.c ? '#f3d58a' : '#d9a066'); }
  paint(); showTimer = setTimeout(() => { showing = null; const s2 = document.querySelector('#view .activity-scene.capture'); if (s2) delete s2.dataset.result; paint(); }, 1600);
});
/* a capture that keeps the animal redraws the tab, so the card says "In your pens" */
Q.on('capturekept', () => { if (UI.view === 'beastmastery' && UI.beastMode === 'capture') setTimeout(() => UI.render(false), 1700); });
})();
