/* World events (Dec 2026, World Life). Now and then, while you are playing, something happens and asks for a decision.
   Rules, from the brief: only during active play (the clock here counts time with the game open and visible, and lives
   in memory, so nothing can queue up while the game is closed); never in the first 15 minutes of a session; one at a
   time; 30 to 60 minutes apart; no countdown pressure (an unanswered event ends harmlessly after 12 minutes of play).
   Everything is data: D.WORLD_EVENTS. An event is { id, title, ic, col, ok(), make() -> text and details,
   choices(ev) -> [{ id, label, sub, can, run(ev) -> message | { doing } }], lapse(ev) -> message }.
   Outcomes go to the adventure journal. Buildings can be damaged (S.damaged), never destroyed; repair is cheap. */
(() => {
const DQ = window.DQ, D = DQ.data, S = () => DQ.S, { rnd, pick, chance, fmt } = DQ;
const MIN = 60000, FIRST = 15 * MIN, GAP = [30 * MIN, 60 * MIN], LAPSE = 12 * MIN;
const W = DQ.worldState = { played: 0, next: 0, active: null, result: null, fired: 0 };
const span = () => GAP[0] + Math.random() * (GAP[1] - GAP[0]);
const reset = () => { W.played = 0; W.next = Math.max(FIRST, 20 * MIN + Math.random() * 20 * MIN); W.active = null; W.result = null; };
reset();
const tIdx = () => D.TOWN[S().town].idx, scale = n => Math.round(n * Math.pow(tIdx() + 1, 1.5));
const topCreature = () => D.MONLIST.filter(m => m.town === S().town && !m.boss && !m.mini).sort((a, b) => b.cl - a.cl)[0];
const restored = () => Object.entries(D.PROJECTS || {}).filter(([id, p]) => p.town === S().town && S().projects[id] && !(S().damaged || {})[id]);
const cooked = () => (DQ.foods ? DQ.foods() : []).filter(id => DQ.have(id) > 0);
const stack = () => Object.entries(S().inv || {}).filter(([id, n]) => D.ITEMS[id] && n >= 10 && ['resource', 'raw', 'food'].includes(D.ITEMS[id].type) && DQ.sellable(id) && !D.ITEMS[id].secret).sort((a, b) => b[1] - a[1])[0];
const pay = n => { if (S().coins < n) return false; S().coins -= n; return true; };
const journal = (ev, msg) => { if (DQ.journal) DQ.journal('event', `${ev.title}: ${msg}`, ev.ic); DQ.log && DQ.log(`${ev.title}: ${msg}`, 'quest'); };
/* a creature made for one event: the town's toughest regular creature, grown, fought like any other */
const foe = (id, name, hp, max, col) => { const b = topCreature(); const m = D.MON[id] = { id, name, town: S().town, cl: b.cl + 4, hp: Math.round(b.hp * hp), max: Math.max(1, Math.round(b.max * max)), att: b.att, def: b.def, coins: [b.coins[0] * 3, b.coins[1] * 4], col: col || b.col, drops: [['treasure_chest', [1, 1], .25]], event: true, base: b.id };
  D.WEAK[id] = D.WEAK[b.id] || { weak: [], resist: [] }; const A = DQ.pixelArt; if (A && A.CREATURE_SPECS && !A.CREATURE_SPECS[id + ':own'] && A.CREATURE_SPECS[b.id] && id !== 'ev_hart') A.CREATURE_SPECS[id] = A.CREATURE_SPECS[b.id]; return m; };
for (const id of ['ev_raider', 'ev_bandits', 'ev_hart']) D.MON[id] = { id, name: 'Something', town: 'willowbrook', cl: 1, hp: 5, max: 1, att: 1, def: 1, coins: [0, 0], col: '#888', drops: [], event: true };
DQ.damageBuildings = n => { const list = restored(); const hit = []; S().damaged = S().damaged || {}; for (let i = 0; i < n && list.length; i++) { const [id] = list.splice(rnd(0, list.length - 1), 1)[0]; S().damaged[id] = Date.now(); hit.push(id); } if (hit.length && DQ.fxDirty) DQ.fxDirty(); return hit; };
DQ.repairCost = id => { const p = D.PROJECTS[id]; return Math.max(20, Math.round(((p && p.cost.coins) || 100) * .15)); };
DQ.repair = id => { if (!(S().damaged || {})[id]) return false; if (!pay(DQ.repairCost(id))) { DQ.toast('Not enough coins', true); return false; } delete S().damaged[id]; DQ.fxDirty(); DQ.sfx && DQ.sfx('anvil'); if (DQ.journal) DQ.journal('event', `Repaired: ${D.PROJECTS[id].name.replace(/^\w+ the /, 'the ')}.`, 'house'); DQ.emit('world'); return true; };
D.WORLD_EVENTS = [
  { id: 'raid', title: 'Something is coming', ic: 'attack', col: '#e0564f', ok: () => restored().length > 0 && !!topCreature(),
    make: () => { const m = foe('ev_raider', `Rampaging ${topCreature().name.toLowerCase()}`, 2.2, 1.2); return { mon: m.id, text: `A ${topCreature().name.toLowerCase()}, bigger than it has any right to be, is heading for ${D.TOWN[S().town].name}.` }; },
    choices: ev => [{ id: 'fight', label: 'Fight it', sub: `Lv ${D.MON[ev.mon].cl}`, run: e => ({ fight: e.mon, won: () => { const c = scale(120); DQ.addCoins(c); return `You drove it off. The town paid ${fmt(c)} coins.`; }, lost: () => { const h = DQ.damageBuildings(rnd(2, 3)); return h.length ? `It got past you. ${h.length} building${h.length > 1 ? 's are' : ' is'} damaged.` : 'It got past you, and found nothing worth breaking.'; } }) },
      { id: 'hide', label: 'Bar the doors', sub: '2–3 buildings damaged', run: () => { const h = DQ.damageBuildings(rnd(2, 3)); return `It took its temper out on ${h.map(id => D.PROJECTS[id].name.replace(/^\w+ the /, 'the ')).join(', ')}. Repairs are cheap.`; } }],
    lapse: () => 'The watch saw it off before it reached the gate.' },
  { id: 'merchant', title: 'A travelling merchant', ic: 'shop', col: '#f3d58a', ok: () => true,
    make: () => { const rec = DQ.recipeFromEvent && DQ.recipeFromEvent('merchant'); return { rec, gem: DQ.weighted(D.GEM_WEIGHTS), text: 'A merchant has stopped to water her mule. She has a few things you will not see in the shop.' }; },
    choices: ev => [...(ev.rec ? [{ id: 'rec', label: `Trade for a recipe`, sub: `${fmt(scale(150))} coins`, can: () => S().coins >= scale(150), run: e => { pay(scale(150)); DQ.learnRecipe(e.rec); return `She wrote it out for you: ${D.ITEMS[e.rec].name}.`; } }] : []),
      { id: 'gem', label: `Buy a ${D.ITEMS[ev.gem].name.toLowerCase()}`, sub: `${fmt(Math.round(D.ITEMS[ev.gem].val * 1.2))} coins`, can: () => S().coins >= Math.round(D.ITEMS[ev.gem].val * 1.2), run: e => { pay(Math.round(D.ITEMS[e.gem].val * 1.2)); DQ.give(e.gem, 1); return `Bought a ${D.ITEMS[e.gem].name.toLowerCase()}.`; } },
      { id: 'no', label: 'Wave her on', run: () => 'She tips her hat and moves on.' }],
    lapse: () => 'She moved on down the road.' },
  { id: 'bard', title: 'A wandering bard', ic: 'sound', col: '#c8a0e8', ok: () => true, make: () => ({ cost: scale(60), text: 'A bard has set up by the well and is tuning something with too many strings.' }),
    choices: ev => [{ id: 'pay', label: 'Pay for a song', sub: `${fmt(ev.cost)} coins · +8% task speed, 20 min`, can: () => S().coins >= ev.cost, run: e => { pay(e.cost); DQ.addBuff('slow', .92, 20 * MIN, 'The bard’s song', '+8% task speed'); DQ.museumCurio && DQ.museumCurio('bard'); return 'The whole town works to the tune.'; } }, { id: 'no', label: 'Walk on', run: () => 'You catch the chorus anyway.' }],
    lapse: () => 'The bard packed up at dusk.' },
  { id: 'star', title: 'A fallen star', ic: 'gem', col: '#cfc4ff', ok: () => DQ.skillUnlocked('mining'), make: () => { DQ.hearRecipe && DQ.hearRecipe('stargazer_hood'); return { need: 10, text: 'Something bright came down in the hills. It is still warm, and it will not stay that way.' }; },
    choices: ev => [{ id: 'mine', label: 'Go and mine it', sub: `Mine ${ev.need} ore while it is warm`, run: e => ({ count: 'mine', need: e.need, go: 'mining', won: () => { const n = 1 + Math.floor(DQ.lvl('mining') / 35); DQ.give('star_shard', n); DQ.museumCurio && DQ.museumCurio('star'); if (S().inv.star_shard >= 3 || chance(.35)) DQ.learnRecipe && DQ.learnRecipe('stargazer_hood'); return `You chipped out ${n} star shard${n > 1 ? 's' : ''}.`; } }) }, { id: 'no', label: 'Let it cool', run: () => 'By morning it is only a stone.' }],
    lapse: () => 'It cooled before anyone reached it.' },
  { id: 'shrine', title: 'A wayside shrine', ic: 'star', col: '#8ad0c0', ok: () => !!stack(), make: () => { const [id] = stack(); return { item: id, text: 'An old shrine by the road, with a bowl worn smooth. People leave things. Sometimes it answers.' }; },
    choices: ev => [{ id: 'offer', label: `Offer 10 ${D.ITEMS[ev.item].name.toLowerCase()}`, sub: 'A blessing, or nothing', can: () => DQ.have(ev.item) >= 10, run: e => { DQ.take(e.item, 10); if (chance(.6)) { DQ.addBuff('xp', 1.1, 30 * MIN, 'Shrine’s blessing', '+10% XP'); DQ.museumCurio && DQ.museumCurio('shrine'); return 'Warmth, like sun on your back. +10% XP for 30 minutes.'; } return 'The bowl is empty when you look again. Nothing else happens.'; } }, { id: 'no', label: 'Leave it be', run: () => 'You nod to it anyway.' }],
    lapse: () => 'The road carried you past.' },
  { id: 'traveller', title: 'A lost traveller', ic: 'map', col: '#8fc7ff', ok: () => true, make: () => ({ text: 'A traveller with the wrong map and no supper asks if this is the road to anywhere.' }),
    choices: ev => [{ id: 'feed', label: 'Share your food', sub: '3 cooked food', can: () => cooked().reduce((n, id) => n + DQ.have(id), 0) >= 3, run: () => { let left = 3; for (const id of cooked()) { const n = Math.min(left, DQ.have(id)); DQ.take(id, n); left -= n; if (!left) break; } const c = scale(90); DQ.addCoins(c); const rec = DQ.recipeFromEvent && DQ.recipeFromEvent('traveller'); if (rec) DQ.learnRecipe(rec); return rec ? `They ate, thanked you with ${fmt(c)} coins, and wrote a recipe on the back of the map.` : `They ate and pressed ${fmt(c)} coins on you.`; } },
      { id: 'point', label: 'Point the way', run: () => { const c = scale(20); DQ.addCoins(c); return `A few coins for your trouble: ${fmt(c)}.`; } }],
    lapse: () => 'Somebody else set them right.' },
  { id: 'hart', title: 'A rare sighting', ic: 'paw', col: '#e8f0ff', ok: () => !!topCreature(), make: () => { const m = foe('ev_hart', 'The Moonlit Hart', 1.8, .9, '#e8f0ff'); return { mon: m.id, text: 'A white hart at the treeline, watching you. Hunters go a lifetime without seeing it.' }; },
    choices: ev => [{ id: 'track', label: 'Track it', sub: `Lv ${D.MON[ev.mon].cl}`, run: e => ({ fight: e.mon, won: () => { DQ.museumCurio && DQ.museumCurio('hart'); const c = scale(150); DQ.addCoins(c); return `You caught up with it, once. It left ${fmt(c)} coins’ worth of silver hair on the thorns.`; }, lost: () => 'It was gone between one blink and the next.' }) }, { id: 'no', label: 'Just watch', run: () => 'It watches back, then is not there.' }],
    lapse: () => 'It slipped away.' },
  { id: 'festival', title: 'Festival day', ic: 'star', col: '#f0c060', ok: () => restored().length >= 2, make: () => ({ text: `${D.TOWN[S().town].name} has hung out the ribbons. Nobody is quite sure what the festival is for.` }),
    choices: () => [{ id: 'join', label: 'Join in', sub: '+10% XP, 20 min', run: () => { DQ.addBuff('xp', 1.1, 20 * MIN, 'Festival', '+10% XP'); W.festival = W.played + 20 * MIN; DQ.museumCurio && DQ.museumCurio('festival'); DQ.ambienceRefresh && DQ.ambienceRefresh(); return 'Music, pies, and a great deal of dancing.'; } }, { id: 'no', label: 'Work through it', run: () => 'You can hear it from here.' }],
    lapse: () => 'The ribbons came down at sunset.' },
  { id: 'bandits', title: 'Bandits on the road', ic: 'sword', col: '#d8503f', ok: () => !!topCreature(), make: () => { const m = foe('ev_bandits', 'Road bandits', 2.4, 1.15, '#8a5a4a'); return { mon: m.id, text: 'Three of them, a cart across the road, and a toll that changes each time they say it.' }; },
    choices: ev => [{ id: 'fight', label: 'Clear the road', sub: `Lv ${D.MON[ev.mon].cl} · good loot`, run: e => ({ fight: e.mon, won: () => { const c = scale(220); DQ.addCoins(c); DQ.give('treasure_chest', 1); return `They ran. ${fmt(c)} coins and a chest were in the cart.`; }, lost: () => 'You left them to it.' }) }, { id: 'no', label: 'Go around', run: () => 'A longer walk, and nothing lost.' }],
    lapse: () => 'They got bored and left.' },
  { id: 'errand', title: 'A villager’s errand', ic: 'users', col: '#b8d08a', ok: () => !!stack(), make: () => { const [id, n] = stack(), want = Math.min(20, Math.floor(n / 2)); const giver = (D.QUESTS.find(q => q.town === S().town) || {}).giver || 'A villager'; return { item: id, want, giver, text: `${giver} is ${want} ${D.ITEMS[id].name.toLowerCase()} short and looking hopeful.` }; },
    choices: ev => [{ id: 'give', label: `Hand over ${ev.want}`, sub: 'Paid double', can: () => DQ.have(ev.item) >= ev.want, run: e => { DQ.take(e.item, e.want); const c = Math.max(10, D.ITEMS[e.item].val * e.want * 2); DQ.addCoins(c); const un = (D.SECRET_RECIPES || []).find(r => !DQ.recipeHeard(r.id)); if (un) DQ.hearRecipe(un.id); return `${e.giver} paid ${fmt(c)} coins${un ? ' and passed on a rumour' : ''}.`; } }, { id: 'no', label: 'Not today', run: () => 'They will manage.' }],
    lapse: () => 'They found it elsewhere.' },
];
D.WORLD_EVENT = Object.fromEntries(D.WORLD_EVENTS.map(e => [e.id, e]));
const finish = (msg, bad) => { const ev = W.active; if (!ev) return; journal(ev.def, msg); W.result = { title: ev.def.title, ic: ev.def.ic, col: ev.def.col, msg, bad: !!bad, until: W.played + 20000 }; W.active = null; W.next = W.played + span(); if (ev.def.id === 'recipes') 0; DQ.emit('world'); };
DQ.worldFire = id => { if (W.active || !DQ.S) return false; const pool = D.WORLD_EVENTS.filter(e => (!id || e.id === id) && e.ok()); if (!pool.length) return false; const def = pick(pool), data = def.make(); W.active = Object.assign({ def, at: W.played, title: def.title }, data); W.result = null; W.fired++; if (!(DQ.sim && DQ.sim.on)) DQ.sfx && DQ.sfx('perk'); DQ.emit('world'); return true; };
DQ.worldChoices = () => W.active && !W.active.doing ? W.active.def.choices(W.active) : [];
DQ.worldChoose = cid => { const ev = W.active; if (!ev || ev.doing) return false; const c = ev.def.choices(ev).find(x => x.id === cid); if (!c || (c.can && !c.can())) return false;
  const r = c.run(ev); if (typeof r === 'string') { finish(r); return true; }
  ev.doing = r; ev.count = 0;
  if (r.fight) { if (!DQ.startAct('fight', r.fight, { quiet: true })) { finish(r.lost ? r.lost() : 'You could not get there in time.', true); return true; } if (DQ.go) DQ.go('combat'); }
  else if (r.go && DQ.go) DQ.go(r.go);
  DQ.emit('world'); return true; };
(DQ.killHooks = DQ.killHooks || []).push(m => { const ev = W.active; if (ev && ev.doing && ev.doing.fight === m.id && !(DQ.sim && DQ.sim.on)) { const msg = ev.doing.won(); ev.doing = null; finish(msg); setTimeout(() => { if (DQ.act && DQ.act.kind === 'fight' && DQ.act.id === m.id) DQ.stopAct(true); }, 0); } });
/* the fight was lost or abandoned; or ore was mined for the star */
DQ.on && DQ.on('act', () => { const ev = W.active; if (ev && ev.doing && ev.doing.fight && !(DQ.act && DQ.act.kind === 'fight' && DQ.act.id === ev.doing.fight)) { const msg = ev.doing.lost(); finish(msg, true); } });
DQ.on && DQ.on('workcycle', o => { const ev = W.active; if (ev && ev.doing && ev.doing.count === o.kind) { ev.count += o.quantity || 1; if (ev.count >= ev.doing.need) finish(ev.doing.won()); else DQ.emit('world'); } });
/* the clock: only time with the game open and visible counts; dt is capped so a sleeping tab adds nothing */
DQ.worldTick = dt => { if (!DQ.S || (DQ.sim && DQ.sim.on) || DQ.forecasting) return; W.played += Math.max(0, Math.min(dt, 5000));
  if (W.result && W.played > W.result.until) { W.result = null; DQ.emit('world'); }
  if (W.active) { if (W.played - W.active.at > LAPSE) { const ev = W.active; if (ev.doing && ev.doing.fight) return; finish(ev.def.lapse(ev)); } return; }
  if (W.played >= W.next) { if (!DQ.worldFire()) W.next = W.played + 5 * MIN; } };
DQ.worldFestival = () => !!W.festival && W.played < W.festival;
DQ.worldReset = reset;
let last = Date.now(); DQ.on && DQ.on('ui', () => { const now = Date.now(), dt = now - last; last = now; if (typeof document !== 'undefined' && document.hidden) return; DQ.worldTick(dt); });
})();
