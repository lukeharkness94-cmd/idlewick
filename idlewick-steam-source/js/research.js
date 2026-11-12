/* Idlewick: Research. Projects take real time (and keep running while you are away), cost coins and materials,
   and give permanent benefits. The Alchemy branch unlocks potions you can brew for timed boosts. */
(() => {
const DQ = window.DQ, D = DQ.data, UI = DQ.ui, { $, $$, ico, fmt, esc } = DQ;
const S = () => DQ.S, GT = () => S().gameTime || 0;
const MIN = 60000;
D.RESEARCH_ADV = 16;                       /* legacy: Scholarship now opens through its skill unlock (DQ.scholarOpen) */
DQ.scholarOpen = () => DQ.skillUnlocked('research');
D.TECH_TIER_ADV = [0, 16, 28, 45, 65];
D.SCHOLAR_TIER = [0, 1, 10, 20, 30];
DQ.researchXp = t => t.mins * 30 * t.tier;

/* ---------- Potions: made in the Brewery, drunk from your backpack ---------- */
const potion = (id, name, col, val, drink) => { D.ITEMS[id] = Object.assign({ id, name, col, val, ic: 'bottle', type: 'potion', drink }, {}); };
potion('potion_heal', 'Healing draught', '#e2574c', 40, { heal: .4, text: 'Heals 40% of your health at once. In a fight it is drunk for you once your food runs out and health drops below 25% (once per fight)' });
potion('potion_haste', 'Potion of Haste', '#5fd0ff', 120, { buff: 'slow', mult: .85, mins: 20, name: 'Haste', text: 'Tasks are 15% faster for 20 minutes' });
potion('potion_might', 'Potion of Might', '#ff8a3a', 150, { buff: 'weak', mult: 1.15, mins: 20, name: 'Might', text: 'You hit 15% harder for 20 minutes' });
potion('potion_fortune', 'Potion of Fortune', '#5cc08a', 400, { buff: 'luck', mult: 1.5, mins: 30, name: 'Fortune', text: 'Rare drops are 50% more likely for 30 minutes' });
potion('potion_scholar', "Scholar's tonic", '#c07aff', 600, { buff: 'xp', mult: 1.1, mins: 20, name: 'Scholar', text: '+10% XP from everything for 20 minutes' });
D.POTION_RECIPES = [
  { id: 'potion_heal', tech: 'herbalism', in: { crop_onion: 2, crop_cabbage: 1 }, coins: 30 },
  { id: 'potion_haste', tech: 'quickening', in: { crop_goldleaf: 2, feather: 6 }, coins: 150 },
  { id: 'potion_might', tech: 'warbrew', in: { crop_sunbloom: 2, bar_iron: 1 }, coins: 200 },
  { id: 'potion_fortune', tech: 'fortune', in: { crop_moonmelon: 1, gem_sapphire: 1 }, coins: 500 },
  { id: 'potion_scholar', tech: 'scholar', in: { crop_starfruit: 1, gem_emerald: 1 }, coins: 800 },
];

/* ---------- The tech tree ---------- */
const BR = { gather: ['Gathering', '#7ec36a', 'woodcutting'], craft: ['Artisans', '#e8703a', 'smithing'], combat: ['Combat', '#e0564f', 'attack'], alch: ['Alchemy', '#b08aff', 'bottle'], trade: ['Commerce', '#f3d58a', 'coin'] };
D.TECH_BRANCHES = BR;
const T = (id, br, tier, name, desc, fx, cost, mins, req = []) => ({ id, br, tier, name, desc, fx, cost, mins, req });
D.TECHS = [
  T('sharper1', 'gather', 1, 'Sharper Tools I', 'Gathering is 3% faster.', { gather: .03 }, { coins: 600, log_normal: 20 }, 10),
  T('hauling1', 'gather', 1, 'Bigger Packs I', '+4 backpack slots.', { pack: 4 }, { coins: 800, log_oak: 15 }, 15),
  T('sharper2', 'gather', 2, 'Sharper Tools II', 'Gathering is 3% faster again.', { gather: .03 }, { coins: 6000, bar_iron: 15 }, 45, ['sharper1']),
  T('keen1', 'gather', 2, 'Keen Eyes I', 'Gems, nests and lucky finds turn up 30% more often.', { find: .3 }, { coins: 4000, gem_sapphire: 3 }, 40),
  T('hauling2', 'gather', 3, 'Bigger Packs II', '+4 more backpack slots.', { pack: 4 }, { coins: 30000, cloth: 20 }, 90, ['hauling1']),
  T('sharper3', 'gather', 3, 'Sharper Tools III', 'Gathering is 4% faster again.', { gather: .04 }, { coins: 50000, bar_mithril: 15 }, 120, ['sharper2']),
  T('keen2', 'gather', 4, 'Keen Eyes II', 'Lucky finds turn up 40% more often again.', { find: .4 }, { coins: 120000, gem_ruby: 4 }, 180, ['keen1']),

  T('bellows', 'craft', 1, 'Better Bellows', '+6% Smithing XP.', { xp_smithing: .06 }, { coins: 700, bar_bronze: 10 }, 10),
  T('hands', 'craft', 1, 'Steady Hands', 'Crafting is 6% faster.', { speed_crafting: .06 }, { coins: 700, log_oak: 10 }, 10),
  T('spice', 'craft', 1, 'Spice Lore', '6% less burnt food.', { burn: .06 }, { coins: 500, crop_potato: 20 }, 10),
  T('wastenot', 'craft', 3, 'Waste Not', '5% chance of double yield when gathering and making things.', { dbl: .05 }, { coins: 40000, bar_steel: 20 }, 120, ['bellows']),
  T('mastercraft', 'craft', 4, 'Mastercraft', 'Smithing and Crafting are 8% faster.', { speed_smithing: .08, speed_crafting: .08 }, { coins: 110000, bar_mithril: 20 }, 180, ['hands', 'wastenot']),

  T('medicine', 'combat', 1, 'Field Medicine', 'Food heals 10% more.', { heal: .1 }, { coins: 600, bread: 20 }, 10),
  T('drills1', 'combat', 2, 'Weapon Drills I', 'You deal 2% more damage.', { dmg: .02 }, { coins: 5000, bar_bronze: 20 }, 45),
  T('study1', 'combat', 2, 'Bestiary Studies I', 'Monster entries unlock 25% sooner.', { study: .25 }, { coins: 4500, feather: 10 }, 40),
  T('drills2', 'combat', 3, 'Weapon Drills II', 'You deal 3% more damage again.', { dmg: .03 }, { coins: 50000, bar_steel: 20 }, 120, ['drills1']),
  T('study2', 'combat', 3, 'Bestiary Studies II', 'Monster entries unlock another 35% sooner.', { study: .35 }, { coins: 40000, gem_emerald: 3 }, 120, ['study1']),
  T('tactics', 'combat', 3, 'Battle Plans', 'Monsters deal 3% less damage.', { dr: .03 }, { coins: 45000, bar_steel: 15 }, 120, ['medicine']),

  T('herbalism', 'alch', 1, 'Herbalism', 'Unlocks the Healing draught in the Brewery.', {}, { coins: 900, crop_onion: 10 }, 15),
  T('quickening', 'alch', 2, 'Quickening', 'Unlocks the Potion of Haste.', {}, { coins: 6000, feather: 20 }, 45, ['herbalism']),
  T('warbrew', 'alch', 2, 'War Brewing', 'Unlocks the Potion of Might.', {}, { coins: 6000, bar_iron: 10 }, 45, ['herbalism']),
  T('fortune', 'alch', 3, 'Fortune Lore', 'Unlocks the Potion of Fortune.', {}, { coins: 45000, gem_sapphire: 5 }, 120, ['quickening']),
  T('scholar', 'alch', 4, 'Scholar’s Tonic', "Unlocks Scholar's tonic.", {}, { coins: 150000, gem_diamond: 2 }, 180, ['fortune']),

  T('routes1', 'trade', 2, 'Trade Routes I', '+3% coins from every source.', { coin: .03 }, { coins: 4000, bar_bronze: 20 }, 40),
  T('surveyor', 'trade', 2, "Surveyor's Map", '+1 farm plot.', { plots: 1 }, { coins: 5000, log_oak: 20 }, 45),
  T('routes2', 'trade', 3, 'Trade Routes II', '+4% coins from every source.', { coin: .04 }, { coins: 40000, bar_iron: 25 }, 120, ['routes1']),
  T('guild', 'trade', 3, "Workers' Guild", '+1 worker bed.', { workers: 1 }, { coins: 35000, cloth: 10 }, 100, ['routes1']),
];
D.TECHS.push({...T('field_notes','gather',1,'Field notes','Repeatable study. Practise Scholarship between discoveries.',{}, {coins:25,feather:2},5),repeatable:true});
D.TECH = Object.fromEntries(D.TECHS.map(t => [t.id, t]));

/* ---------- state and progress ---------- */
const R = () => (S().research = S().research || { done: {}, active: [] });
DQ.techDone = id => !!R().done[id];
DQ.researchSlots = () => 1 + (DQ.lvl('research') >= 20 || DQ.advLvl() >= 40 ? 1 : 0);
DQ.techReason = t => {
  if (DQ.techDone(t.id)) return 'done'; if (R().active.some(a => a.id === t.id)) return 'active';
  if (!DQ.scholarOpen()) return 'Learn Scholarship first';
  if (DQ.lvl('research') < D.SCHOLAR_TIER[t.tier]) return `Scholarship ${D.SCHOLAR_TIER[t.tier]}`;
  const miss = t.req.find(r => !DQ.techDone(r)); if (miss) return `Needs ${D.TECH[miss].name}`;
  return '';
};
DQ.techCanAfford = t => Object.entries(t.cost).every(([k, n]) => k === 'coins' ? S().coins >= n : DQ.have(k) >= n);
DQ.startResearch = id => {
  const t = D.TECH[id], why = t ? DQ.techReason(t) : 'Unknown project'; if (!t || why) return DQ.toast(why ? `Not yet: ${why}` : 'Unknown project', true);
  if (R().active.length >= DQ.researchSlots()) return DQ.toast('Your research slots are busy', true);
  if (!DQ.techCanAfford(t)) return DQ.toast('You are missing coins or materials', true);
  Object.entries(t.cost).forEach(([k, n]) => { if (k === 'coins') S().coins -= n; else DQ.take(k, n); });
  R().active.push({ id, left: t.mins * MIN }); DQ.sfx('start'); DQ.log(`Research begins: ${t.name}.`, 'quest'); DQ.emit('research'); return true;
};
DQ.researchTick = dt => {
  const A = R().active; if (!A.length) return;
  for (let i = A.length - 1; i >= 0; i--) {
    A[i].left -= dt; if (A[i].left > 0) continue;
    const t = D.TECH[A[i].id]; A.splice(i, 1); if(!t.repeatable)R().done[t.id] = 1; DQ.addXp('research',DQ.researchXp(t)); if (DQ.sim.on) (DQ.awayDone = DQ.awayDone || []).push(t.name); DQ.fxDirty(); DQ.syncPlots && DQ.syncPlots(); DQ.achDirty = true;
    DQ.log(`Research complete: ${t.name}.`, 'quest');
    if (!DQ.forecasting) DQ.notify({ kind: 'unlock', key: 'tech:' + t.id, icon: 'rune', col: BR[t.br][1], title: 'Research complete', text: `${t.name}. ${t.desc}`, action: { label: 'Open Scholarship', fn: () => DQ.go('research') }, sound: 'unlock', ttl: 12000 });
    DQ.emit('research');
  }
};
const adv = DQ.advanceWorld;
DQ.advanceWorld = dt => { adv(dt); if (dt <= 5000) DQ.researchTick(dt); };

/* ---------- effects feed the same bonus table as furniture and pets ---------- */
DQ.techFx = f => {
  Object.keys(R().done).forEach(id => { const t = D.TECH[id]; if (!t) return;
    Object.entries(t.fx).forEach(([k, v]) => { if (k.startsWith('xp_')) f.xp[k.slice(3)] = (f.xp[k.slice(3)] || 0) + v; else if (k.startsWith('speed_')) f.speed[k.slice(6)] = (f.speed[k.slice(6)] || 0) + v; else f[k] = (f[k] || 0) + v; }); });
};

/* ---------- potions ---------- */
DQ.addBuff = (type, mult, ms, name, text, maxMs = 3 * 60 * MIN) => {
  const old = DQ.buffs().find(b => b.name === name), left = old ? old.until - GT() : 0;
  S().buffs = DQ.buffs().filter(b => b.name !== name).concat({ type, mult, until: GT() + Math.min(maxMs, left + ms), name, text });
};
DQ.drink = id => {
  const it = D.ITEMS[id], d = it && it.drink; if (!d || !DQ.have(id)) return;
  if (d.heal) { if (S().hp >= DQ.maxHp()) return DQ.toast('You are already at full health', true); S().hp = Math.min(DQ.maxHp(), S().hp + Math.round(DQ.maxHp() * d.heal)); }
  else DQ.addBuff(d.buff, d.mult, d.mins * MIN, d.name, d.text);
  DQ.take(id, 1); DQ.sfx('eat'); DQ.toast(d.heal ? 'You feel better' : `${d.name}: ${d.text}`); DQ.emit('shop');
};
DQ.canBrew = r => DQ.techDone(r.tech);
DQ.brew = id => {
  const r = D.POTION_RECIPES.find(x => x.id === id); if (!r || !DQ.canBrew(r)) return;
  if (S().coins < r.coins || !Object.entries(r.in).every(([k, n]) => DQ.have(k) >= n)) return DQ.toast('You are missing coins or ingredients', true);
  S().coins -= r.coins; Object.entries(r.in).forEach(([k, n]) => DQ.take(k, n)); DQ.give(id, 1); DQ.sfx('sizzle'); DQ.emit('shop'); return true;
};

/* ---------- the Research page ---------- */
const costChips = c => Object.entries(c).map(([k, n]) => { const ok = k === 'coins' ? S().coins >= n : DQ.have(k) >= n; return k === 'coins' ? `<span class="rw ${ok ? '' : 'short'}" style="--c:#f3d58a">${ico('coin')}${fmt(n)}</span>` : `<span class="rw ${ok ? '' : 'short'}" style="--c:${D.ITEMS[k].col}">${ico(D.ITEMS[k].ic)}${n}× ${esc(D.ITEMS[k].name)}</span>${ok || !UI.routeChip ? '' : UI.routeChip(k)}`; }).join('');
const dur = m => m >= 60 ? `${Math.floor(m / 60)}h${m % 60 ? ' ' + m % 60 + 'm' : ''}` : `${m}m`;
const techCard = t => {
  const why = DQ.techReason(t), br = BR[t.br], act = R().active.find(a => a.id === t.id);
  const state = why === 'done' ? 'done' : why === 'active' ? 'active' : why ? 'locked' : 'open';
  const foot = state === 'done' ? `<span class="tdone">${ico('check')} Researched</span>` : state === 'active' ? `<span class="tbar"><b>Studying</b><span class="bar"><i data-b="rbar:${t.id}"></i></span><small class="mono" data-b="rleft:${t.id}"></small></span>` : state === 'locked' ? `<span class="tlock">${ico('lock')} ${esc(why)}</span>` : `<button class="btn sm ${DQ.techCanAfford(t) && R().active.length < DQ.researchSlots() ? 'primary' : ''}" data-do="rstart" data-a="${t.id}" ${DQ.techCanAfford(t) && R().active.length < DQ.researchSlots() ? '' : 'disabled'}>Start · ${dur(t.mins)}</button>`;
  return `<div class="tech ${state}" style="--c:${br[1]}"><div class="th"><b>${esc(t.name)}</b><small>${['', 'Tier I', 'Tier II', 'Tier III', 'Tier IV'][t.tier]}</small></div><p>${esc(t.desc)}</p><small class="study-reward">+${fmt(Math.round(DQ.researchXp(t)*DQ.xpMult('research')))} Scholarship XP · Level ${D.SCHOLAR_TIER[t.tier]}</small>${state === 'done' || state === 'active' ? '' : `<div class="rws">${costChips(t.cost)}</div>`}<div class="tf">${foot}</div>${state==='open'&&!DQ.techCanAfford(t)?'<small class="bad">More coins or materials needed</small>':state==='open'&&R().active.length>=DQ.researchSlots()?'<small>All study slots are busy</small>':''}</div>`;
};
UI.B.rbar = (e, id) => { const a = R().active.find(x => x.id === id), t = D.TECH[id]; if (a) { const w = (100 - a.left / (t.mins * MIN) * 100).toFixed(1) + '%'; if (e.style.width !== w) e.style.width = w; } };
UI.B.rleft = (e, id) => { const a = R().active.find(x => x.id === id); UI.set(e, a ? `${DQ.fmtTime(Math.max(0, a.left))} left` : ''); };
const researchPage = (potions = false) => {
  const slots = DQ.researchSlots(), A = R().active;
  const activeRows = Array.from({ length: slots }, (_, i) => { const a = A[i]; if (!a) return `<div class="aslot empty"><span class="k">Slot ${i + 1}</span><b>Free</b><small>Research keeps running while you are away.</small></div>`; const t = D.TECH[a.id]; return `<div class="aslot" style="--c:${BR[t.br][1]}"><span class="k">Slot ${i + 1}</span><b>${esc(t.name)}</b><span class="tbar"><span class="bar"><i data-b="rbar:${t.id}"></i></span><small class="mono" data-b="rleft:${t.id}"></small></span><small>${esc(t.desc)}</small></div>`; }).join('');
  const done = D.TECHS.filter(t => DQ.techDone(t.id)).length;

  const unlocked = D.POTION_RECIPES.filter(DQ.canBrew);
  const selectedPotion = unlocked.find(r => r.id === UI.tab.potionChoice) || unlocked[0];
  const brewery = `<section class="panel brewery"><div class="phead"><h2>${ico('bottle')} Brewery</h2><small>${unlocked.length ? 'Brew potions, then drink them from your backpack' : 'Research Herbalism to open it'}</small></div>${unlocked.length ? `<label class="page-picker" for="potion-choice">Potion${UI.choiceButtons(`<select id="potion-choice" data-in="potion-choice">${unlocked.map(r=>`<option value="${r.id}" ${r === selectedPotion ? 'selected' : ''}>${esc(D.ITEMS[r.id].name)}</option>`).join('')}</select>`)}</label><div class="srows">${[selectedPotion].map(r => { const it = D.ITEMS[r.id], ok = S().coins >= r.coins && Object.entries(r.in).every(([k, n]) => DQ.have(k) >= n); return `<div class="srow ${ok ? '' : 'cant'}">${UI.itm(r.id, DQ.have(r.id))}<div class="sr-t"><b>${esc(it.name)}</b><small>${esc(it.drink.text)}</small><span class="rws">${costChips(Object.assign({ coins: r.coins }, r.in))}</span></div><span class="btnrow"><button class="btn sm ${ok ? 'primary' : ''}" data-do="brew" data-a="${r.id}" ${ok ? '' : 'disabled'}>Brew</button>${DQ.have(r.id) ? `<button class="btn sm" data-do="drink" data-a="${r.id}">Drink (${DQ.have(r.id)})</button>` : ''}</span></div>`; }).join('')}</div>` : '<p class="dim" style="margin:0">Nothing to brew yet.</p>'}</section>`;
  const selected = D.TECH[UI.tab.researchChoice] || D.TECHS.find(t => !DQ.techReason(t) && DQ.techCanAfford(t)) || D.TECHS[0];
  if (potions) return brewery;
  return `${UI.skillHero('research')}<section class="panel scholarship-overview"><div class="phead"><h2>Discoveries</h2><small>${done} / ${D.TECHS.filter(t=>!t.repeatable).length} complete</small></div><p>Complete a project to earn Scholarship XP and its permanent benefit. Tier II opens at level 10, Tier III at 20 and Tier IV at 30. A second slot opens at Scholarship 20 (or Hero 40). Field notes are repeatable.</p><section data-reference="true" id="active-research"><h3>Study slots · ${A.length} / ${slots}</h3><div class="aslots">${activeRows}</div></section></section><div class="scholarship-grid">${D.TECHS.map(techCard).join('')}</div>`;
};
UI.V.research = () => researchPage();
UI.V.brewery = () => researchPage(true);
Object.assign(UI.DO, { rstart: a => { if (DQ.startResearch(a)) { UI.tab.researchChoice = a; UI.render(false); } }, brew: a => { if (DQ.brew(a)) UI.render(false); }, drink: a => { DQ.drink(a); UI.renderHud(); UI.render(false); } });
DQ.on('research', () => { if (['research', 'brewery'].includes(UI.view)) UI.refresh && UI.refresh(); });

/* locked until the Research hall opens, with a preview */
const rpage = UI.V.research;
UI.V.research = () => !DQ.scholarOpen() ? UI.lockedPage('research') : rpage();
const ts0 = UI.tabState;
UI.tabState = p => p === 'research' ? (!DQ.scholarOpen() ? { lock: true } : (S().seenTabs && S().seenTabs.research ? null : { fresh: true })) : ts0(p);
const prevR = UI.render; UI.render = fresh => { prevR(fresh); if (UI.view === 'research' && DQ.scholarOpen()) { S().seenTabs = S().seenTabs || {}; S().seenTabs.research = 1; } };

/* Up next suggests a project when a slot is free */
const goals = DQ.goals;
DQ.goals = (...a) => {
  const g = goals(...a); if (!DQ.scholarOpen() || R().active.length >= DQ.researchSlots()) return g;
  const ready = D.TECHS.filter(t => !DQ.techReason(t) && DQ.techCanAfford(t)); if (!ready.length) return g;
  return [{ id: 'research', cat: 'Research', icon: 'rune', col: '#b08aff', title: 'Start a research project', sub: `${ready.length} project${ready.length > 1 ? 's' : ''} ready, such as ${ready[0].name}`, pct: 1, ready: true, go: 'research' }].concat(g);
};

/* potions in the item panel, the quick bar and tooltips */
const tipB = DQ.tips.item;
DQ.tips.item = id => { const h = tipB(id), it = D.ITEMS[id]; return h && it && it.drink ? h.replace('<div class="dim">Worth', `<div class="ok">${esc(it.drink.text)}</div><div class="dim">Worth`) : h; };
const detail0 = UI.detail;
UI.detail = (id, from) => { const h = detail0(id, from), it = id && D.ITEMS[id]; return it && it.drink && DQ.have(id) ? h.replace('<div class="btnrow wrap">', `<div class="btnrow wrap"><button class="btn primary" data-do="drink" data-a="${id}">Drink</button>`) : h; };
const sel0 = UI.selbarHtml;
UI.selbarHtml = (id, from) => { const h = sel0(id, from), it = id && D.ITEMS[id]; return it && it.drink && DQ.have(id) ? h.replace('<span class="sb-b">', `<span class="sb-b"><button class="btn sm primary" data-do="drink" data-a="${id}">Drink</button>`).replace(/<span class="sb-l">[\s\S]*?<\/span><\/span>/, `<span class="sb-l"><span class="ok">${esc(it.drink.text)}</span></span></span>`) : h; };
})();
