/* Idlewick: Beastmastery captures mythical beasts, and eggs are lucky finds.
   Owner, 26 Nov 2026: "Hunting and beastmastery should be two defined things ... Beastmastery is the ability to trap
   and capture animals to keep them, have them as companions and level them up. Eggs should be random drops in combat
   or skills." Owner, 28 Nov 2026: "There should be NO animals the same in either ... The beastmastery should be
   mythical creatures you can capture with hard work, high skill etc ... Beastmastery should use traps with bait in
   them and require you to have physical traps or leashes or some other thing you can capture - again, something you
   should have to craft to be able to do. The higher level you are, the easier the lower creatures become."

   Capture (KIND_EXT.capture, id = a beast in D.MYTHS, hunt_tiers_data.js). The same machinery as a hunt, so offline
   work, the queue and the Now card behave the same way:
     - three steps: Tracking 40%, Setting the tool 30%, Coaxing 30% of the cycle (8 s + 0.09 s per Beastmastery level
       of the beast, before speed bonuses and field-guide entries);
     - you need Beastmastery at the beast's level, the crafted capture tool that suits it (D.CAPTURE_TOOLS: wooden or
       padded live trap for small beasts, fowling or starwoven net for winged ones, rope or mithril halter for hoofed
       ones, the iron-jaw cage for fierce ones, a warded snare or rune trap for spirits) and its tier's bait (Cooking);
     - odds: 55% + 2.5% per Beastmastery level above the beast, between 35% and 90%: the higher you are, the easier
       the lower beasts become;
     - one bait per try, used whether it works or not; the tool goes home with the beast you keep;
     - Beastmastery XP per try on the same scale as Hunting XP (an escape pays 30%);
     - a success keeps the beast (DQ.awardPet('wild_<id>', { hatched: true })): straight to your pens, no egg. A beast
       you already own is tagged and let go instead: full XP, no duplicate, the tool is kept.
   A beast's name stays ??? until you have tried to catch one. Never in a forecast.

   Companions caught from ordinary animals before 28 Nov 2026 are let go on load (owner: "Get rid"); nothing else about
   the hero changes. Eggs (D.EGG_DROP and the older sources) only ever hatch companions that still exist.
   Expeditions (the Trapper) are retired: nothing can be sent, and one already out still comes back once. */
(() => {
const Q = window.DQ, D = Q.data, UI = Q.ui, S = () => Q.S, { esc, ico, fmt } = Q;
if (!D.HUNT_TIERS || !D.MYTHS || !Q.KIND_EXT || !Q.KIND_EXT.hunt) return;
D.CAPTURE_STEPS = [['Tracking', .40, 'paw'], ['Setting the trap', .30, 'pin'], ['Coaxing', .30, 'heart']];
D.EGG_DROP = { action: 1 / 2000, kill: 1 / 500 };
const FAIL = ['Lost the trail', 'It sniffed out the trap', 'It would not come'];
const myth = id => D.MYTH[id] || null;
Q.isMyth = id => !!myth(id);
const pid = id => 'wild_' + id;
const owned = id => !!(S().pets.owned[pid(id)] || (Q.eggOf && Q.eggOf(pid(id))));
const rec = () => { const p = S().pets; const C = p.capture = p.capture && typeof p.capture === 'object' ? p.capture : {}; C.recent = Array.isArray(C.recent) ? C.recent : []; C.tries = C.tries && typeof C.tries === 'object' ? C.tries : {}; return C; };
/* a beast is named once you have tried to catch one, or own one */
Q.mythSeen = id => !!myth(id) && ((rec().tries[id] || 0) > 0 || owned(id));
Q.mythName = id => { const m = myth(id); return m ? (Q.mythSeen(id) ? m.name : '???') : ''; };
Q.captureKit = id => { const m = myth(id); if (!m) return null; const tool = D.captureToolFor(m.kind, m.bl); return { tool, trap: tool, bait: D.CAPTURE_BAIT[m.tier] }; };
Q.captureChance = id => { const m = myth(id); if (!m) return 0; return Math.max(.35, Math.min(.9, .55 + .025 * (Q.lvl('beastmastery') - m.bl))); };
const rawDur = id => { const m = myth(id); return m ? 8000 + m.bl * 90 : 8000; };
Q.captureXp = (id, ok) => { const m = myth(id); if (!m) return 0; const L = Q.lvl('beastmastery');
  return Math.max(1, Math.round(8 * (5 + .35 * L) * (rawDur(id) / 8000) * (1 + m.bl / 100) / .75 * (ok ? 1 : .3))); };
Q.captureXpShown = (id, ok) => Math.max(1, Math.round(Q.captureXp(id, ok) * (Q.xpMult ? Q.xpMult('beastmastery') : 1) * (Q.catchUp ? Q.catchUp('beastmastery') : 1)));
Q.captureStep = (a = Q.act) => { if (!a || a.kind !== 'capture') return null; const p = Math.min(1, Math.max(0, (Date.now() - a.t0) / (a.dur || 1)));
  let acc = 0; for (const s of D.CAPTURE_STEPS) { acc += s[1]; if (p < acc) return s; } return D.CAPTURE_STEPS[2]; };
/* what stands between you and a capture, as one short reason, or '' */
Q.captureNeed = id => { const m = myth(id); if (!m) return 'Choose a beast';
  if (Q.lvl('beastmastery') < m.bl) return `Requires Beastmastery ${m.bl}`;
  const K = Q.captureKit(id); if (!Q.have(K.tool)) return `Needs ${D.ITEMS[K.tool].name}`; if (!Q.have(K.bait)) return `Needs ${D.ITEMS[K.bait].name}`; return ''; };
const named = id => Q.mythSeen(id) ? myth(id).name.toLowerCase() : 'beast';
const event = (kind, id, text) => { if (Q.forecasting) return; const p = S().pets; p.events = Array.isArray(p.events) ? p.events : []; p.events.push({ kind, id, text, t: Date.now() }); if (p.events.length > 40) p.events.splice(0, p.events.length - 40); if (Q.journal) Q.journal('beast', text, 'paw'); };
Q.KIND_EXT.capture = {
  valid: id => !!myth(id),
  skill: 'beastmastery', page: 'beastmastery', skillFor: () => 'beastmastery', pageFor: () => 'beastmastery',
  label: a => { const m = myth(a.id), s = Q.captureStep(a); return m ? `${s ? s[0] : 'Capturing'}: ${named(a.id)}` : 'Capturing'; },
  dur: id => rawDur(id),
  check: id => { if (!myth(id)) return 'Choose a beast'; if (!Q.skillUnlocked('beastmastery')) return 'Learn Beastmastery first'; return Q.captureNeed(id); },
  done: a => {
    const m = myth(a.id); if (!m) return Q.stopAct(false, 'That beast is not here.');
    const K = Q.captureKit(a.id), C = rec(), ok = Q.chance(Q.captureChance(a.id)), had = owned(m.id), keep = ok && !had && !Q.forecasting;
    if (Q.have(K.bait)) Q.take(K.bait, 1);
    Q.addXp('beastmastery', Q.captureXp(a.id, ok));
    const first = !(C.tries[m.id] > 0); C.tries[m.id] = (C.tries[m.id] || 0) + 1;
    const failAt = ok ? -1 : (r => r < .3 ? 0 : r < .6 ? 1 : 2)(Math.random());
    const res = { id: m.id, c: ok ? 1 : 0, f: failAt, k: keep ? 1 : 0, t: Date.now() }; C.recent = [...C.recent, { c: res.c, f: failAt, k: res.k }].slice(-12); a.lastCapture = res;
    const stopIfOut = () => { const need = Q.captureNeed(a.id); if (need && Q.act === a) Q.stopAct(false, `${need} to keep capturing.`); };
    if (!Q.sim.on && !Q.forecasting) Q.emit('captureresult', res, m);
    if (first && !Q.sim.on && !Q.forecasting) Q.log(`You have found the tracks of a ${m.name.toLowerCase()}.`, 'good');
    Q.eggDrop('action');
    if (!ok) { C.escaped = (C.escaped || 0) + 1; if (!Q.sim.on && !Q.forecasting) Q.log(`The ${named(m.id)} would not be caught. One ${D.ITEMS[K.bait].name.toLowerCase()} gone; back to tracking.`); stopIfOut(); return; }
    a.count++;
    if (keep) {
      Q.take(K.tool, 1);
      Q.awardPet(pid(m.id), { hatched: true, quiet: true }); if (S().pets.owned[pid(m.id)]) S().pets.owned[pid(m.id)].caught = Date.now(); if (Q.migrateBeasts) Q.migrateBeasts(S());
      C.kept = (C.kept || 0) + 1; S().stats.captures = (S().stats.captures || 0) + 1; Q.qev('capture', m.id);
      const p = D.PET[pid(m.id)], text = `You caught a ${m.name.toLowerCase()} alive in your ${D.ITEMS[K.tool].name.toLowerCase()}. It is in your pens.`;
      event('capture', pid(m.id), text);
      if (!Q.sim.on) { Q.log(text, 'quest'); Q.sfx && Q.sfx('gem');
        Q.notify({ kind: 'unlock', key: 'capture:' + m.id, icon: 'paw', col: p ? p.col : '#d08a5a', title: `Caught: ${m.name}`, text: `In your pens. As your companion: ${p ? p.text : 'a small bonus'}.`, sound: false, burst: true, ttl: 9000,
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
const name0 = Q.mastName; if (name0) Q.mastName = (kind, id) => kind === 'capture' ? (myth(id) ? Q.mythName(id) : id) : name0(kind, id);

/* ---------- the companions of the beasts, and none from ordinary animals ---------- */
/* beastmastery_data.js made a companion for each beast (wild_<id>); the hunting ground's animals had one too from
   hunting.js's every-creature rule, and the animals that left the game took theirs with them: those go */
/* companions are mythical only (owner, 28 Nov 2026): the hidden companions of combat creatures that are ordinary
   animals (rats, wolves, bats, spiders, a leech, a hound) go too; none could be earned since 21 Nov */
const REAL = new Set(['rat', 'wolf', 'bat', 'icewolf', 'dire_wolf', 'thicket_spider', 'mossback_spider', 'giant_leech', 'hound']);
const animalPet = p => p && String(p.id).startsWith('wild_') && !p.myth && (!p.mon || !D.MON[p.mon] || (D.MON[p.mon].hl > 0) || REAL.has(p.mon));
for (let i = D.PETS.length - 1; i >= 0; i--) if (animalPet(D.PETS[i])) { delete D.PET[D.PETS[i].id]; D.PETS.splice(i, 1); }
/* an old save keeps every companion that still exists; one caught from an ordinary animal is let go, its egg too */
const prep0 = Q.prepareBeastSave;
Q.prepareBeastSave = o => { const before = o && o.pets && o.pets.owned ? Object.keys(o.pets.owned).filter(k => !D.PET[k]).length : 0;
  const out = prep0 ? prep0(o) : o; if (!out || !out.pets) return out;
  if (Array.isArray(out.pets.eggs)) out.pets.eggs = out.pets.eggs.filter(e => e && D.PET[e.id]);
  if (before) out.pets.letGo = (out.pets.letGo || 0) + before;
  return out; };
const resume0 = Q.resumeAfterLoad;
Q.resumeAfterLoad = (...args) => { const r = resume0 ? resume0(...args) : undefined; const n = S().pets && S().pets.letGo;
  if (n && Q.log) { Q.log(`${n} companion${n > 1 ? 's' : ''} caught from ordinary animals ${n > 1 ? 'were' : 'was'} let go: Beastmastery keeps mythical beasts now, and the animals went back to the hunting ground.`, 'warn'); delete S().pets.letGo; }
  return r; };

/* ---------- expeditions are retired: nothing new can be sent; one already out still resolves (beastmastery.js) ---------- */
Q.beastTrapReason = () => 'The Trapper has retired: capture beasts instead';
Q.sendBeastTrap = () => false;
/* why you need a capture tool or bait now (item_uses.js): the beasts it catches, from the live save */
const toolBeasts = id => D.MYTHS.filter(m => Q.captureKit(m.id).tool === id);
const baitBeasts = id => D.MYTHS.filter(m => Q.captureKit(m.id).bait === id);
const uses0 = Q.usesOf;
if (uses0) Q.usesOf = id => { const out = uses0(id), it = D.ITEMS[id]; if (!it) return out;
  const list = it.captureTool ? toolBeasts(id) : D.CAPTURE_BAIT.includes(id) ? baitBeasts(id) : null; if (!list || !list.length) return out;
  const L = Q.lvl('beastmastery'), ready = list.filter(m => L >= m.bl), next = list.find(m => L < m.bl), seen = list.filter(m => Q.mythSeen(m.id)).map(m => m.name);
  const lo = Math.min(...list.map(m => m.bl)), hi = Math.max(...list.map(m => m.bl));
  const what = it.captureTool ? `Capture tool for ${list.length} ${list.length > 1 ? 'beasts' : 'beast'} (Beastmastery ${lo}${hi > lo ? '–' + hi : ''}); used up on a keep` : `Capture bait for ${list.length} beasts (Beastmastery ${lo}–${hi}); one per try`;
  const now = ready.length ? `${ready.length} in reach now${seen.length ? ': ' + seen.slice(0, 2).join(', ') : ''}` : next ? `first at Beastmastery ${next.bl}` : '';
  const tier = Math.max(0, D.HUNT_TIERS.findIndex(t => lo <= t.hi));
  return [{ k: 'capture', text: `${what}${now ? ' · ' + now : ''}`, go: { do: 'capturetier', a: String(tier), label: 'Beastmastery' } }, ...out].slice(0, 3); };

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
/* each region's signature beast (fieldwork's wooden traps can leave its egg): four of them are mythical beasts now */
const sig0 = Q.signatureOf;
if (sig0) Q.signatureOf = town => sig0(town) || D.PETS.find(p => p.myth && p.signature && p.town === town) || null;
/* egg sources and odds, truthfully */
const src0 = Q.eggSource; if (src0) Q.eggSource = id => { const p = D.PET[id] || {}, s = p.src || {}; if (s.type === 'beasttrap') return 'A lucky find'; if (s.type === 'capture') return p.signature ? `From the wooden traps of ${D.TOWN[p.town].name}` : 'Caught alive in Beastmastery'; return src0(id); };
const odds0 = Q.petOdds;
if (odds0) Q.petOdds = id => { const p = D.PET[id], s = (p && p.src) || {}, spec = (D.BEAST_SPECIES || {})[id];
  if (spec) { const pool = Q.eggPool(), n = Math.max(1, pool.length), here = pool.includes(id);
    return { where: here ? `Lucky find · any skill or fight (one of ${n} eggs)` : `Lucky find · from Hero ${spec.hero} in ${D.TOWN[spec.town].name}`, luck: true, p: here ? D.EGG_DROP.action / n : 0, per: 'action', tries: 0, go: 'beastmastery', kill: D.EGG_DROP.kill / n }; }
  if (s.type === 'capture') { const m = myth(s.myth), open = m && Q.lvl('beastmastery') >= m.bl;
    return { where: `Capture · Beastmastery ${m ? m.bl : '?'}${open ? '' : ' (not yet)'}`, p: open ? Q.captureChance(m.id) : 0, per: 'try', tries: rec().tries[s.myth] || 0, unit: 'tries', go: 'beastmastery' }; }
  return odds0(id); };

/* a caught beast's journey starts with the catch, not an egg (eggs.js UI.beastJourney) */
const journey0 = UI.beastJourney;
if (journey0) UI.beastJourney = id => { const h = journey0(id), o = S().pets.owned[id]; if (!h || !o || !o.caught) return h;
  const day = new Date(o.caught).toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
  return h.replace(/<li class="on"[^>]*>[\s\S]*?<\/li>/, `<li class="on" data-tip="text:Caught alive · ${esc(day)}"><span class="bj-ic">${ico('paw')}</span><small>Caught</small></li>`)
    .replace(/(<li class="on"[^>]*><span class="bj-ic">[\s\S]*?<\/span><small>)Hatched(<\/small>)/, '$1In your pens$2'); };

/* ---------- the Capture tab ---------- */
const tierList = i => D.MYTHS.filter(m => m.tier === i);
const defaultTier = () => { const L = Q.lvl('beastmastery'); let t = 0; D.HUNT_TIERS.forEach((T, i) => { if (L >= T.lo) t = i; }); return t; };
UI.DO.capturetier = i => { UI.captureTier = Math.max(0, Math.min(4, +i || 0)); UI.beastMode = 'capture'; UI.view === 'beastmastery' ? UI.render(false) : Q.go('beastmastery'); };
UI.DO.capturepick = id => { const m = myth(id); if (!m) return; UI.beastMode = 'capture'; UI.captureTier = m.tier; UI.taskChoice.beastmastery = id; UI.view === 'beastmastery' ? UI.render(false) : Q.go('beastmastery'); };
const nowAct0 = UI.DO.nowactivity; UI.DO.nowactivity = (...a) => Q.act && Q.act.kind === 'capture' ? UI.DO.capturepick(Q.act.id) : nowAct0(...a);
const part = id => UI.huntKitPart ? UI.huntKitPart(id) : '';
const kitLine = K => `<div class="hunt-kit"><span class="k">Kit</span>${part(K.tool)}${part(K.bait)}<small class="dim">One bait per try; the ${esc(D.ITEMS[K.tool].name.toLowerCase())} goes home with the beast you keep.</small></div>`;
const expeditionLine = () => { const j = S().pets.expedition; if (!j || !D.PET[j.species]) return '';
  return `<span class="capture-old-trap">${ico('clock')}Old trap out for ${esc(D.PET[j.species].name)} · <span data-beast-due="${j.due}">${Q.fmtTime(Math.max(0, j.due - Date.now()))}</span></span>`; };
UI.captureView = () => {
  if (UI.captureTier === undefined) UI.captureTier = defaultTier();
  const T = D.HUNT_TIERS[UI.captureTier], L = Q.lvl('beastmastery'), C = rec();
  const mine = D.MYTHS.filter(m => S().pets.owned[pid(m.id)]).length;
  /* one row above the workspace, like Hunting's: the tier tabs, then how many you have caught (and the last tries) */
  const tabs = UI.huntTierTabs ? UI.huntTierTabs(UI.captureTier, 'capturetier', L) : '';
  const sum = `<span class="capture-sum" data-tip="text:Mythical beasts caught alive and kept. Higher Beastmastery, better odds."><span class="k">Caught alive</span><b class="mono">${mine}/${D.MYTHS.length}</b></span>${C.recent.length ? `<span class="hunt-recent" aria-label="Last captures"><span class="k">Last ${C.recent.length}</span>${C.recent.map(r => `<i class="${r.c ? 'ok' : 'fail'}" title="${r.c ? (r.k ? 'Kept' : 'Let go') : FAIL[r.f]}"></i>`).join('')}<b class="mono">${C.recent.filter(r => r.c).length}/${C.recent.length}</b></span>` : ''}${expeditionLine()}`;
  const head = `<div class="capture-bar">${tabs}<div class="capture-head">${sum}</div></div>`;
  const choices = tierList(UI.captureTier).map(m => { const id = m.id, open = L >= m.bl, seen = Q.mythSeen(id), mineNow = owned(id), need = open ? Q.captureNeed(id) : '', pct = Math.round(Q.captureChance(id) * 100), p = D.PET[pid(id)], K = Q.captureKit(id);
    return { id, name: seen ? m.name : '???', artKind: 'creature', artId: id, yieldId: null, locked: !open, revealed: false, blocked: !open || !!need, reason: open ? need : `Requires Beastmastery ${m.bl}`, short: open ? '' : `Lv ${m.bl}`,
      caption: mineNow ? 'In your pens' : `${D.CAPTURE_KINDS[m.kind]} · Lv ${m.bl}`, stateText: need ? need.replace(/^Needs /, 'No ') : mineNow ? `${pct}% · tag & release` : `${pct}% capture`,
      info: `<div class="hunt-steps">${D.CAPTURE_STEPS.map(s => `<span>${ico(s[2])}${s[0]}</span>`).join('<i aria-hidden="true">→</i>')}</div>${kitLine(K)}<p class="dim">${pct}% chance it walks into the ${esc(D.ITEMS[K.tool].name.toLowerCase())}; otherwise it wanders off and you track it again. ${Q.captureXpShown(id, true)} Beastmastery XP a capture, ${Q.captureXpShown(id, false)} if it gets away.</p>${seen ? `<p class="capture-note">${esc(m.note)}</p>` : ''}<p class="capture-gives">${mineNow ? `${ico('paw')} Already yours: a capture is let go again, for the XP.` : `${ico('paw')} Keep it as a beast. As your companion: ${esc(p ? p.text : 'a small bonus')}.`}</p>` }; });
  if (!choices.length) return head + UI.emptyState('lens', 'Not a hoofprint.', `No ${esc(T.name.toLowerCase())} beasts.`);
  const h = UI.taskPanel('beastmastery', `Capture · ${T.name}`, 'capture', choices, 'Capture')
    .replace(`>${D.TOWN[S().town].name}</small>`, `>Beastmastery ${T.lo}–${T.hi}</small>`).replace('activity-scene capture ', 'activity-scene capture hunt ')
    .replace('<h2>Choose your spot</h2>', '<h2>Choose a beast</h2>');
  return head + h;
};

/* ---------- the stage: three steps, how the last try went, the tool in the scene ---------- */
let showing = null, showTimer = 0;
const stripHtml = () => `<div class="hunt-track capture-track" role="status" aria-live="polite"><ol class="hunt-track-steps">${D.CAPTURE_STEPS.map((s, i) => `<li data-i="${i}"><span class="ht-ico">${ico(s[2])}</span><span class="ht-name">${['Track', 'Set trap', 'Coax'][i]}</span><span class="ht-mark" aria-hidden="true"></span></li>`).join('')}</ol><div class="hunt-track-out"></div></div>`;
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
  if (!sc.querySelector('.hunt-trap')) { const K = Q.captureKit(sc.dataset.task), id = K && K.tool; if (id && D.ITEMS[id]) sc.insertAdjacentHTML('beforeend', `<span class="hunt-trap" aria-hidden="true">${Q.itemIco(D.ITEMS[id])}</span>`); }
};
Q.on('ui', paint);
Q.on('captureresult', res => {
  showing = res; clearTimeout(showTimer);
  const sc = document.querySelector('#view .activity-scene.capture'); if (sc) { sc.dataset.result = res.c ? (res.k ? 'kept' : 'caught') : 'escaped'; sc.dataset.step = '2'; if (Q.floatAt) Q.floatAt(sc, res.c ? (res.k ? 'Caught alive!' : 'Let it go') : 'It got away!', res.c ? '#f3d58a' : '#d9a066'); }
  paint(); showTimer = setTimeout(() => { showing = null; const s2 = document.querySelector('#view .activity-scene.capture'); if (s2) delete s2.dataset.result; paint(); }, 1600);
});
/* a capture that keeps the beast redraws the tab, so the card says "In your pens" */
Q.on('capturekept', () => { if (UI.view === 'beastmastery' && UI.beastMode === 'capture') setTimeout(() => UI.render(false), 1700); });
})();
