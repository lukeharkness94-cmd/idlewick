/* World events (Dec 2026, World Life; reworked 26 Nov 2026 at the owner's request). Now and then something happens and
   asks for a decision. "Can these random events come up as a full-screen pop up. When idle or offline, these can be
   tasks people can come choose their action in hindsight."
   - While you are playing (game open, visible, some input in the last 5 minutes), an event opens as a full-screen
     scene (the same scene as the away encounters, js/player_feedback.js). Work carries on behind it. Decide later
     (or Escape) closes it and the event waits in the inbox with the away encounters (S.inbox, type 'world').
   - An event that comes due while you are idle or the tab is hidden, and events rolled for time away, go straight to
     the inbox with a quiet bell line. A waiting event never expires; choose it whenever you like.
   - Timing: never in the first 15 minutes of play, 30 to 60 minutes apart; time away rolls at the same rate (one
     every 30 to 60 minutes away, so nothing for an absence under 30 minutes), counted only in report catch-up, never
     in forecasts. At most 3 world events wait at once (CAP); when full, nothing new is added and nothing is dropped.
   - A waiting event saves what make() produced (and the creature it made, if any), so it can be chosen after a reload.
     Choices that can no longer be afforded show disabled with the reason. Fights need you in the event's town.
   Everything is data: D.WORLD_EVENTS. An event is { id, title, ic, col, ok(), make() -> text and details,
   choices(ev) -> [{ id, label, sub, can, why, fight|doing, run(ev) -> message | { fight|count, start, won, lost } }],
   lapse(ev) -> message (for an errand under way that runs out of time) }.
   Outcomes go to the adventure journal. Buildings can be damaged (S.damaged), never destroyed; repair is cheap. */
(() => {
const DQ = window.DQ, D = DQ.data, S = () => DQ.S, { rnd, pick, chance, fmt } = DQ;
const MIN = 60000, FIRST = 15 * MIN, GAP = [30 * MIN, 60 * MIN], LAPSE = 12 * MIN, IDLE = 5 * MIN, CAP = 3;
/* played: visible play counted by the event clock. away: the current absence (closed, hidden or catch-up time). */
const W = DQ.worldState = { played: 0, next: 0, active: null, result: null, fired: 0, away: 0, awayNext: 0, open: null };
const span = () => GAP[0] + Math.random() * (GAP[1] - GAP[0]);
const reset = () => { W.played = 0; W.next = Math.max(FIRST, 20 * MIN + Math.random() * 20 * MIN); W.active = null; W.result = null; W.away = 0; W.awayNext = 0; W.open = null; };
reset();
DQ.WORLD_CAP = CAP; DQ.WORLD_IDLE = IDLE;
const townOf = t => D.TOWN[t] ? t : S().town;
const scale = (n, t) => Math.round(n * Math.pow(D.TOWN[townOf(t)].idx + 1, 1.5));
/* the toughest creature you would actually fight here: not a boss, challenge, tower floor or hunting-ground animal
   (since the 23 Nov hunting tiers a Master animal of level 121 lived in Willowbrook and made a level-125 bandit) */
const topCreature = () => D.MONLIST.filter(m => m.town === S().town && !m.boss && !m.mini && !m.tower && !m.event && !m.hl && !m.huntKind).sort((a, b) => b.cl - a.cl)[0];
const restored = t => Object.entries(D.PROJECTS || {}).filter(([id, p]) => p.town === townOf(t) && S().projects[id] && !(S().damaged || {})[id]);
const cooked = () => (DQ.foods ? DQ.foods() : []).filter(id => DQ.have(id) > 0);
const stack = () => Object.entries(S().inv || {}).filter(([id, n]) => D.ITEMS[id] && n >= 10 && ['resource', 'raw', 'food'].includes(D.ITEMS[id].type) && DQ.sellable(id) && !D.ITEMS[id].secret).sort((a, b) => b[1] - a[1])[0];
const pay = n => { if (S().coins < n) return false; S().coins -= n; return true; };
const journal = (ev, msg) => { if (DQ.journal) DQ.journal('event', `${ev.title}: ${msg}`, ev.ic); DQ.log && DQ.log(`${ev.title}: ${msg}`, 'quest'); };
const short = id => D.PROJECTS[id].name.replace(/^\w+ the /, 'the ');
/* a creature made for one event: the town's toughest regular creature, grown, fought like any other. Its stats are
   saved with the waiting event (ev.foe) and put back by ensureFoe, so a fight chosen after a reload is the same fight. */
const register = m => { const b = D.MON[m.base]; D.WEAK[m.id] = (b && D.WEAK[b.id]) || D.WEAK[m.id] || { weak: [], resist: [] };
  const A = DQ.pixelArt; if (b && A && A.CREATURE_SPECS && !A.CREATURE_SPECS[m.id + ':own'] && A.CREATURE_SPECS[b.id] && m.id !== 'ev_hart') A.CREATURE_SPECS[m.id] = A.CREATURE_SPECS[b.id]; return m; };
const foe = (id, name, hp, max, col) => { const b = topCreature(); return register(D.MON[id] = { id, name, town: S().town, cl: b.cl + 4, hp: Math.round(b.hp * hp), max: Math.max(1, Math.round(b.max * max)), att: b.att, def: b.def, coins: [b.coins[0] * 3, b.coins[1] * 4], col: col || b.col, drops: [['treasure_chest', [1, 1], .25]], event: true, base: b.id }); };
const ensureFoe = ev => { if (ev && ev.foe && ev.foe.id && /^ev_/.test(ev.foe.id)) register(D.MON[ev.foe.id] = Object.assign({}, ev.foe, { event: true })); return ev; };
for (const id of ['ev_raider', 'ev_bandits', 'ev_hart']) D.MON[id] = { id, name: 'Something', town: 'willowbrook', cl: 1, hp: 5, max: 1, att: 1, def: 1, coins: [0, 0], col: '#888', drops: [], event: true };
DQ.damageBuildings = (n, town) => { const list = restored(town); const hit = []; S().damaged = S().damaged || {}; for (let i = 0; i < n && list.length; i++) { const [id] = list.splice(rnd(0, list.length - 1), 1)[0]; S().damaged[id] = Date.now(); hit.push(id); } if (hit.length && DQ.fxDirty) DQ.fxDirty(); return hit; };
DQ.repairCost = id => { const p = D.PROJECTS[id]; return Math.max(20, Math.round(((p && p.cost.coins) || 100) * .15)); };
DQ.repair = id => { if (!(S().damaged || {})[id]) return false; if (!pay(DQ.repairCost(id))) { DQ.toast('Not enough coins', true); return false; } delete S().damaged[id]; DQ.fxDirty(); DQ.sfx && DQ.sfx('anvil'); if (DQ.journal) DQ.journal('event', `Repaired: ${short(id)}.`, 'house'); DQ.emit('world'); return true; };
const coinsWhy = n => `Need ${fmt(n)} coins`;
D.WORLD_EVENTS = [
  { id: 'raid', title: 'Something is coming', ic: 'attack', col: '#e0564f', ok: () => restored().length > 0 && !!topCreature(),
    make: () => { const kind = topCreature().name.toLowerCase(), m = foe('ev_raider', `Rampaging ${kind}`, 2.2, 1.2); return { mon: m.id, text: `A ${kind}, bigger than it has any right to be, is heading for ${D.TOWN[S().town].name}. The watch has a bell and a strong opinion about running.` }; },
    choices: ev => [{ id: 'fight', fight: true, label: 'Fight it', sub: `Lv ${D.MON[ev.mon].cl}`, run: e => ({ fight: e.mon, start: 'You grab your gear and head for the gate.', won: () => { const c = scale(120, e.town); DQ.addCoins(c); return `You drove it off. The town paid ${fmt(c)} coins.`; }, lost: () => { const h = DQ.damageBuildings(rnd(2, 3), e.town); return h.length ? `It got past you. ${h.length} building${h.length > 1 ? 's are' : ' is'} damaged.` : 'It got past you, and found nothing worth breaking.'; } }) },
      { id: 'hide', label: 'Bar the doors', sub: '2–3 buildings damaged', run: e => { const h = DQ.damageBuildings(rnd(2, 3), e.town); return h.length ? `It took its temper out on ${h.map(short).join(', ')}. Repairs are cheap.` : 'It kicked the gate, found nothing worth breaking, and wandered off.'; } },
      { id: 'watch', label: 'Leave it to the watch', sub: 'Nothing spent or lost', run: e => DQ.data.WORLD_EVENT.raid.lapse(e) }],
    lapse: () => 'The watch rang the bell until it went away. They are very proud of the bell.' },
  { id: 'merchant', title: 'A travelling merchant', ic: 'shop', col: '#f3d58a', ok: () => true,
    make: () => { const rec = DQ.recipeFromEvent && DQ.recipeFromEvent('merchant'); return { rec, gem: DQ.weighted(D.GEM_WEIGHTS), text: 'A merchant has stopped to water her mule. She has a few things you will not see in the shop, and a mule who bites.' }; },
    choices: ev => [...(ev.rec ? [{ id: 'rec', label: `Trade for a recipe`, sub: `${fmt(scale(150, ev.town))} coins`, can: () => S().coins >= scale(150, ev.town), why: coinsWhy(scale(150, ev.town)), run: e => { if (DQ.recipeKnown && DQ.recipeKnown(e.rec)) return 'You already know that one. She sells you the paper anyway, for nothing.'; pay(scale(150, e.town)); DQ.learnRecipe(e.rec); return `She wrote it out for you: ${D.ITEMS[e.rec] ? D.ITEMS[e.rec].name : 'a new recipe'}.`; } }] : []),
      { id: 'gem', label: `Buy a ${D.ITEMS[ev.gem].name.toLowerCase()}`, sub: `${fmt(Math.round(D.ITEMS[ev.gem].val * 1.2))} coins`, can: () => S().coins >= Math.round(D.ITEMS[ev.gem].val * 1.2), why: coinsWhy(Math.round(D.ITEMS[ev.gem].val * 1.2)), run: e => { pay(Math.round(D.ITEMS[e.gem].val * 1.2)); DQ.give(e.gem, 1); return `Bought a ${D.ITEMS[e.gem].name.toLowerCase()}.`; } },
      { id: 'no', label: 'Wave her on', run: () => 'She tips her hat and moves on. The mule does not.' }],
    lapse: () => 'She moved on down the road.' },
  { id: 'bard', title: 'A wandering bard', ic: 'sound', col: '#c8a0e8', ok: () => true, make: () => ({ cost: scale(60), text: 'A bard has set up by the well and is tuning something with too many strings.' }),
    choices: ev => [{ id: 'pay', label: 'Pay for a song', sub: `${fmt(ev.cost)} coins · +8% task speed, 20 min`, can: () => S().coins >= ev.cost, why: coinsWhy(ev.cost), run: e => { pay(e.cost); DQ.addBuff('slow', .92, 20 * MIN, 'The bard’s song', '+8% task speed'); DQ.museumCurio && DQ.museumCurio('bard'); return 'The whole town works to the tune.'; } }, { id: 'no', label: 'Walk on', run: () => 'You catch the chorus anyway.' }],
    lapse: () => 'The bard packed up at dusk.' },
  { id: 'star', title: 'A fallen star', ic: 'gem', col: '#cfc4ff', ok: () => DQ.skillUnlocked('mining'), make: () => { DQ.hearRecipe && DQ.hearRecipe('stargazer_hood'); return { need: 10, text: 'Something bright came down in the hills. It is still warm, and it will not stay that way.' }; },
    choices: ev => [{ id: 'mine', doing: true, label: 'Go and mine it', sub: `Mine ${ev.need} ore within 12 minutes`, run: e => ({ count: 'mine', need: e.need, go: 'mining', start: 'You set off for the hills with a pick.', won: () => { const n = 1 + Math.floor(DQ.lvl('mining') / 35); DQ.give('star_shard', n); DQ.museumCurio && DQ.museumCurio('star'); if (S().inv.star_shard >= 3 || chance(.35)) DQ.learnRecipe && DQ.learnRecipe('stargazer_hood'); return `You chipped out ${n} star shard${n > 1 ? 's' : ''}.`; } }) }, { id: 'no', label: 'Let it cool', run: () => 'By morning it is only a stone.' }],
    lapse: () => 'It cooled before you got enough out of it. It is a very nice stone now.' },
  { id: 'shrine', title: 'A wayside shrine', ic: 'star', col: '#8ad0c0', ok: () => !!stack(), make: () => { const [id] = stack(); return { item: id, text: 'An old shrine by the road, with a bowl worn smooth. People leave things. Sometimes it answers.' }; },
    choices: ev => [{ id: 'offer', label: `Offer 10 ${D.ITEMS[ev.item].name.toLowerCase()}`, sub: 'A blessing, or nothing', can: () => DQ.have(ev.item) >= 10, why: `Need 10 ${D.ITEMS[ev.item].name.toLowerCase()}`, run: e => { DQ.take(e.item, 10); if (chance(.6)) { DQ.addBuff('xp', 1.1, 30 * MIN, 'Shrine’s blessing', '+10% XP'); DQ.museumCurio && DQ.museumCurio('shrine'); return 'Warmth, like sun on your back. +10% XP for 30 minutes.'; } return 'The bowl is empty when you look again. Nothing else happens.'; } }, { id: 'no', label: 'Leave it be', run: () => 'You nod to it anyway.' }],
    lapse: () => 'The road carried you past.' },
  { id: 'traveller', title: 'A lost traveller', ic: 'map', col: '#8fc7ff', ok: () => true, make: () => ({ text: 'A traveller with the wrong map and no supper asks if this is the road to anywhere.' }),
    choices: ev => [{ id: 'feed', label: 'Share your food', sub: '3 cooked food', can: () => cooked().reduce((n, id) => n + DQ.have(id), 0) >= 3, why: 'Need 3 cooked food', run: e => { let left = 3; for (const id of cooked()) { const n = Math.min(left, DQ.have(id)); DQ.take(id, n); left -= n; if (!left) break; } const c = scale(90, e.town); DQ.addCoins(c); const rec = DQ.recipeFromEvent && DQ.recipeFromEvent('traveller'); if (rec) DQ.learnRecipe(rec); return rec ? `They ate, thanked you with ${fmt(c)} coins, and wrote a recipe on the back of the map.` : `They ate and pressed ${fmt(c)} coins on you.`; } },
      { id: 'point', label: 'Point the way', run: e => { const c = scale(20, e.town); DQ.addCoins(c); return `A few coins for your trouble: ${fmt(c)}.`; } }],
    lapse: () => 'Somebody else set them right.' },
  { id: 'hart', title: 'A rare sighting', ic: 'paw', col: '#e8f0ff', ok: () => !!topCreature(), make: () => { const m = foe('ev_hart', 'The Moonlit Hart', 1.8, .9, '#e8f0ff'); return { mon: m.id, text: 'A white hart at the treeline, watching you. Hunters go a lifetime without seeing it.' }; },
    choices: ev => [{ id: 'track', fight: true, label: 'Track it', sub: `Lv ${D.MON[ev.mon].cl}`, run: e => ({ fight: e.mon, start: 'You follow the tracks into the trees.', won: () => { DQ.museumCurio && DQ.museumCurio('hart'); const c = scale(150, e.town); DQ.addCoins(c); return `You caught up with it, once. It left ${fmt(c)} coins’ worth of silver hair on the thorns.`; }, lost: () => 'It was gone between one blink and the next.' }) }, { id: 'no', label: 'Just watch', run: () => 'It watches back, then is not there.' }],
    lapse: () => 'It slipped away.' },
  { id: 'festival', title: 'Festival day', ic: 'star', col: '#f0c060', ok: () => restored().length >= 2, make: () => ({ text: `${D.TOWN[S().town].name} has hung out the ribbons. Nobody is quite sure what the festival is for.` }),
    choices: () => [{ id: 'join', label: 'Join in', sub: '+10% XP, 20 min', run: () => { DQ.addBuff('xp', 1.1, 20 * MIN, 'Festival', '+10% XP'); W.festival = W.played + 20 * MIN; DQ.museumCurio && DQ.museumCurio('festival'); DQ.ambienceRefresh && DQ.ambienceRefresh(); return 'Music, pies, and a great deal of dancing.'; } }, { id: 'no', label: 'Work through it', run: () => 'You can hear it from here.' }],
    lapse: () => 'The ribbons came down at sunset.' },
  { id: 'bandits', title: 'Bandits on the road', ic: 'sword', col: '#d8503f', ok: () => !!topCreature(), make: () => { const m = foe('ev_bandits', 'Road bandits', 2.4, 1.15, '#8a5a4a'); return { mon: m.id, text: 'Three of them, a cart across the road, and a toll that changes each time they say it.' }; },
    choices: ev => [{ id: 'fight', fight: true, label: 'Clear the road', sub: `Lv ${D.MON[ev.mon].cl} · good loot`, run: e => ({ fight: e.mon, start: 'You walk up to the cart and ask what the toll is today.', won: () => { const c = scale(220, e.town); DQ.addCoins(c); DQ.give('treasure_chest', 1); return `They ran. ${fmt(c)} coins and a chest were in the cart.`; }, lost: () => 'You left them to it.' }) }, { id: 'no', label: 'Go around', run: () => 'A longer walk, and nothing lost.' }],
    lapse: () => 'They got bored and left.' },
  { id: 'errand', title: 'A villager’s errand', ic: 'users', col: '#b8d08a', ok: () => !!stack(), make: () => { const [id, n] = stack(), want = Math.min(20, Math.floor(n / 2)); const giver = (D.QUESTS.find(q => q.town === S().town) || {}).giver || 'A villager'; return { item: id, want, giver, text: `${giver} is ${want} ${D.ITEMS[id].name.toLowerCase()} short and looking hopeful.` }; },
    choices: ev => [{ id: 'give', label: `Hand over ${ev.want}`, sub: 'Paid double', can: () => DQ.have(ev.item) >= ev.want, why: `Need ${ev.want} ${D.ITEMS[ev.item].name.toLowerCase()}`, run: e => { DQ.take(e.item, e.want); const c = Math.max(10, D.ITEMS[e.item].val * e.want * 2); DQ.addCoins(c); const un = (D.SECRET_RECIPES || []).find(r => !DQ.recipeHeard(r.id)); if (un) DQ.hearRecipe(un.id); return `${e.giver} paid ${fmt(c)} coins${un ? ' and passed on a rumour' : ''}.`; } }, { id: 'no', label: 'Not today', run: () => 'They will manage.' }],
    lapse: () => 'They found it elsewhere.' },
];
D.WORLD_EVENT = Object.fromEntries(D.WORLD_EVENTS.map(e => [e.id, e]));

/* ---------- waiting events live in the inbox beside the away encounters ---------- */
const inbox = () => (S().inbox = S().inbox || []);
const waiting = () => inbox().filter(e => e && e.type === 'world');
DQ.worldWaiting = () => waiting();
const ctxOf = e => ensureFoe(Object.assign({}, e.data, { town: townOf(e.town), title: e.title, inboxId: e.id }));
/* each choice with whether it can be taken now and, if not, why */
const choicesOf = e => { const def = D.WORLD_EVENT[e.ev]; if (!def) return []; const ctx = ctxOf(e), here = S().town === ctx.town;
  return def.choices(ctx).map(c => { let why = '';
    if ((c.fight || c.doing) && cur()) why = 'Another event is under way';
    else if (c.fight && !here) why = `Back in ${D.TOWN[ctx.town].name}`;
    else if (c.can && !c.can()) why = c.why || 'Not possible now';
    return Object.assign({}, c, { ok: !why, why }); }); };
DQ.worldChoicesFor = id => { const e = waiting().find(x => String(x.id) === String(id)); return e ? choicesOf(e) : []; };
/* the inbox cards read e.opts: [id, label, what it does, why it is unavailable] */
const refresh = e => { try { e.opts = choicesOf(e).map(c => [c.id, c.label, c.sub || (['no', 'watch'].includes(c.id) ? 'Nothing spent or lost' : ''), c.ok ? '' : c.why]); } catch (x) {} return e; };
DQ.inboxRefresh = () => { if (DQ.S) waiting().forEach(refresh); };
/* the least-seen eligible event, never one already waiting */
const choose = id => { const pool = D.WORLD_EVENTS.filter(e => (!id || e.id === id) && !waiting().some(w => w.ev === e.id) && (() => { try { return e.ok(); } catch (x) { return false; } })()); if (!pool.length) return null;
  const seen = S().seen || {}, least = Math.min(...pool.map(e => seen['world:' + e.id] || 0)); return pick(pool.filter(e => (seen['world:' + e.id] || 0) === least)); };
const queue = (def, how) => { if (waiting().length >= CAP) return null; const data = def.make(); const town = S().town;
  if (data.mon && D.MON[data.mon]) data.foe = JSON.parse(JSON.stringify(D.MON[data.mon]));
  const e = { id: `world-${def.id}-${Date.now().toString(36)}${rnd(100, 999)}`, type: 'world', ev: def.id, at: Date.now(), town, how, title: def.title, ic: def.ic, col: def.col, text: data.text, data };
  refresh(e); inbox().push(e); S().seen = S().seen || {}; S().seen['world:' + def.id] = (S().seen['world:' + def.id] || 0) + 1; W.fired++;
  if (how !== 'live' && DQ.notify) DQ.notify({ kind: 'event', key: 'world:' + e.id, title: def.title, text: how === 'away' ? 'Happened while you were away. Waiting in Activity.' : 'Happened while you were busy elsewhere. Waiting in Activity.', ic: def.ic, col: def.col, page: 'activity' });
  DQ.emit('inbox'); return e; };
/* is anyone there? hidden tab, or no input for 5 minutes */
let lastInput = Date.now();
if (typeof addEventListener === 'function') for (const t of ['pointerdown', 'pointermove', 'keydown', 'wheel', 'touchstart']) addEventListener(t, () => { lastInput = Date.now(); }, { passive: true, capture: true });
DQ.worldIdle = () => (typeof document !== 'undefined' && document.hidden) || Date.now() - lastInput > IDLE;
DQ.worldInput = () => { lastInput = Date.now(); };
/* something else already holds the screen: a pop-up, the opening story, a scene or the title screen */
const busyScreen = () => { if (typeof document === 'undefined' || !document.querySelector) return false; const t = document.getElementById && document.getElementById('title'); return !!(document.querySelector('.modal, #intro, .story-scene') || (t && !t.hidden)); };
/* fire one now. live: shown full-screen if someone is there and nothing holds the screen; otherwise it waits. */
DQ.worldFire = (id, o = {}) => { if (!DQ.S || DQ.forecasting || (DQ.sim && DQ.sim.on)) return false; const def = choose(id); if (!def) return false;
  const show = !o.quiet && !DQ.worldIdle() && !busyScreen() && !!DQ.worldShow;
  const e = queue(def, o.away ? 'away' : show ? 'live' : 'idle'); if (!e) return false;
  if (!(DQ.sim && DQ.sim.on) && show) { DQ.sfx && DQ.sfx('perk'); W.open = e.id; DQ.worldShow(e.id); }
  DQ.save && !o.away && DQ.save(); DQ.emit('world'); return true; };
/* time away: called after each report catch-up (and for hidden-tab time); the same 30-60 minute spacing as play */
DQ.worldAway = ms => { if (!DQ.S || DQ.forecasting || !(ms > 0)) return 0; W.away += Math.min(ms, DQ.OFFLINE_CAP || 24 * 3600e3); if (!W.awayNext) W.awayNext = span(); let made = 0;
  for (let guard = 0; W.away >= W.awayNext && guard < 200; guard++) { W.awayNext += span(); if (waiting().length < CAP && DQ.worldFire(null, { away: true })) made++; }
  return made; };
{ const mk0 = DQ.makeAwayEvents; if (mk0) DQ.makeAwayEvents = (sum, away) => { const r = mk0(sum, away); if (!DQ.forecasting) { DQ.worldAway(away); last = Date.now(); } return r; }; }
/* resolving a waiting world event: through the away encounters' resolver (atomic save, measured result in place) */
let pending = null;
(DQ.inboxKinds = DQ.inboxKinds || {}).world = { resolve: (e, opt) => { const c = choicesOf(e).find(x => x.id === opt); if (!c || !c.ok) return null; const ctx = ctxOf(e), r = c.run(ctx);
  if (typeof r === 'string') return r; if (!r || typeof r !== 'object') return null; pending = { def: D.WORLD_EVENT[e.ev], ctx, r, cid: opt }; return r.start || 'You set off.'; } };
/* an event under way is saved too (S.worldDoing: the event, the choice and its data), so a fight chosen in hindsight
   survives a reload as the same fight; the closures are rebuilt by running the choice again (fight and mine choices
   only describe the job, they change nothing when run) */
const plain = ctx => JSON.parse(JSON.stringify(Object.assign({}, ctx, { def: undefined })));
const cur = () => { if (W.active || !DQ.S || !S().worldDoing) return W.active; const w = S().worldDoing, def = D.WORLD_EVENT[w.ev];
  try { const ctx = ensureFoe(Object.assign({}, w.ctx)), c = def && def.choices(ctx).find(x => x.id === w.choice), r = c && c.run(ctx);
    if (r && typeof r === 'object') W.active = Object.assign({ def, at: W.played, title: def.title }, ctx, { doing: r, count: w.count || 0, live: false }); else delete S().worldDoing; } catch (x) { delete S().worldDoing; }
  return W.active; };
DQ.worldActive = cur;
const startDoing = ({ def, ctx, r, cid }) => { W.active = Object.assign({ def, at: W.played, title: def.title }, ctx, { doing: r, count: 0, live: true }); S().worldDoing = { ev: def.id, choice: cid, ctx: plain(ctx), count: 0 };
  if (r.fight) { ensureFoe(ctx); if (!DQ.startAct('fight', r.fight, { quiet: true })) { finish(r.lost ? r.lost() : 'You could not get there in time.', true); return; } DQ.closeModal && DQ.closeModal(); if (DQ.go) DQ.go('combat'); }
  else if (r.go && DQ.go) { DQ.closeModal && DQ.closeModal(); DQ.go(r.go); }
  DQ.emit('world'); };
{ const res0 = DQ.resolveEvent; DQ.resolveEvent = (id, opt) => { const e = inbox().find(x => x && x.id === id); if (!e || e.type !== 'world') return res0(id, opt); pending = null; if (W.open === id) W.open = null;
  const ok = res0(id, opt), job = pending; pending = null; if (ok && job) startDoing(job); DQ.emit('world'); return ok; }; }
/* compatibility: the newest waiting world event */
const newest = () => waiting().slice(-1)[0];
DQ.worldChoices = () => { const e = newest(); return e ? choicesOf(e) : []; };
DQ.worldChoose = cid => { const e = newest(); return e ? DQ.resolveEvent(e.id, cid) : false; };
/* an event under way (a fight or ore to mine) finishes here */
const finish = (msg, bad) => { const ev = W.active; if (!ev) return; journal(ev.def, msg); W.result = { title: ev.def.title, ic: ev.def.ic, col: ev.def.col, msg, bad: !!bad, until: W.played + 20000 }; W.active = null; if (DQ.S) delete S().worldDoing; DQ.emit('world'); };
(DQ.killHooks = DQ.killHooks || []).push(m => { const ev = cur(); if (ev && ev.doing && ev.doing.fight === m.id && !(DQ.sim && DQ.sim.on)) { const msg = ev.doing.won(); ev.doing = null; finish(msg); setTimeout(() => { if (DQ.act && DQ.act.kind === 'fight' && DQ.act.id === m.id) DQ.stopAct(true); }, 0); } });
/* the fight was lost or abandoned; or ore was mined for the star */
const onFight = ev => DQ.act && DQ.act.kind === 'fight' && DQ.act.id === ev.doing.fight;
/* a restored fight only counts as abandoned once this page has seen it running (loading fires 'act' before it resumes) */
DQ.on && DQ.on('act', () => { const ev = cur(); if (!ev || !ev.doing || !ev.doing.fight) return; if (onFight(ev)) { ev.live = true; return; } if (ev.live) { const msg = ev.doing.lost(); finish(msg, true); } });
DQ.on && DQ.on('workcycle', o => { const ev = cur(); if (ev && ev.doing && ev.doing.count === o.kind) { ev.count += o.quantity || 1; if (S().worldDoing) S().worldDoing.count = ev.count; if (ev.count >= ev.doing.need) finish(ev.doing.won()); else DQ.emit('world'); } });
/* the clock: only time with the game open and visible counts; dt is capped so a sleeping tab adds nothing */
DQ.worldTick = dt => { if (!DQ.S || (DQ.sim && DQ.sim.on) || DQ.forecasting) return; W.played += Math.max(0, Math.min(dt, 5000));
  if (W.result && W.played > W.result.until) { W.result = null; DQ.emit('world'); }
  const ev = cur();
  if (ev && !(ev.doing && ev.doing.fight) && W.played - ev.at > LAPSE) finish(ev.def.lapse(ev), true);
  /* a saved fight that did not come back with the game (the task was changed elsewhere): it ends harmlessly */
  else if (ev && ev.doing && ev.doing.fight && !ev.live) { if (onFight(ev)) ev.live = true; else finish(ev.def.lapse(ev)); }
  if (W.played >= W.next) {
    /* someone is here but a pop-up or scene holds the screen: wait a minute rather than stack another on top */
    if (!DQ.worldIdle() && busyScreen()) { W.next = W.played + MIN; return; }
    W.next = W.played + (DQ.worldFire() ? span() : 5 * MIN); } };
DQ.worldFestival = () => !!W.festival && W.played < W.festival;
DQ.worldReset = reset;
/* save validation (state.js runs DQ.saveChecks): keep well-formed waiting world events, drop rows this version cannot resolve */
(DQ.saveChecks = DQ.saveChecks || []).push(r => { if (!r) return; const w = r.worldDoing;
  if (w !== undefined && !(w && typeof w === 'object' && D.WORLD_EVENT[w.ev] && w.ctx && typeof w.ctx === 'object' && typeof w.choice === 'string')) delete r.worldDoing;
  else if (w) ensureFoe(w.ctx);
  /* a fight with an event creature resumes only with its event; otherwise there is nothing truthful to fight */
  if (r.act && r.act.kind === 'fight' && /^ev_/.test(String(r.act.id)) && !(r.worldDoing && r.worldDoing.ctx.mon === r.act.id)) r.act = null;
  if (Array.isArray(r.inbox)) r.inbox = r.inbox.filter(e => !e || e.type !== 'world' || (!!D.WORLD_EVENT[e.ev] && !!e.data && typeof e.data === 'object' && !Array.isArray(e.data) && typeof e.title === 'string' && typeof e.id === 'string')); });
let last = Date.now(); DQ.on && DQ.on('ui', () => { const now = Date.now(), dt = now - last; last = now; if (typeof document !== 'undefined' && document.hidden) { DQ.worldAway(dt); return; } W.away = 0; W.awayNext = 0; DQ.worldTick(dt); });
})();
