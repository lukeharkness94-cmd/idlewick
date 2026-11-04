/* Player-chosen destinations and two permanent Willowbrook improvements. */
(() => {
const DQ = window.DQ, D = DQ.data, UI = DQ.ui;
const { esc, fmt, ico } = DQ;
const S = () => DQ.S;
DQ.questImpact = id => ({ first_steps: 'Restock Willowbrook’s timber supply.', hungry_cook: 'Bring Mabel’s kitchen back to life.' }[id] || '');
D.PROJECTS = {
  well: { town: 'willowbrook', name: 'Restore the village well', cost: { log_normal: 20, coins: 25 }, reward: 'Resting health recovery is 10% faster.', story: 'Fresh water flows through Willowbrook again.' },
  inn: { town: 'willowbrook', name: 'Reopen the village inn', cost: { log_normal: 10, shrimp: 12, coins: 50 }, reward: 'Food restores 5% more health.', story: 'The inn sign is back up. Mabel has a kitchen full of guests.' },
  forge: { town: 'willowbrook', name: 'Rekindle the village forge', cost: { bar_bronze: 10, log_oak: 15, coins: 300 }, reward: 'Smithing is 5% faster.', story: 'Smoke curls from the forge chimney and the anvil rings across the green.', fx: { speed_smithing: .05 } },
  garden: { town: 'willowbrook', name: 'Plant the village gardens', cost: { crop_potato: 15, crop_onion: 10, coins: 200 }, reward: 'Crops grow 5% faster.', story: 'Neat rows of vegetables and a riot of flowers fill the old common.', fx: { grow: .05 } },
  library: { town: 'willowbrook', name: 'Reopen the reading room', cost: { log_oak: 25, feather: 20, coins: 800 }, reward: '+2% XP to every skill.', story: 'Lamps burn late in the reading room, and the shelves are full again.', fx: { xpAll: .02 } },
  watchtower: { town: 'willowbrook', name: 'Raise the watchtower', cost: { log_oak: 40, bar_iron: 8, coins: 1500 }, reward: 'Monsters deal 2% less damage.', story: 'A sturdy watchtower stands over the road, a lantern burning at the top.', fx: { dr: .02 } }
};
/* A villager's reaction when a project is finished. Short, warm and in their own voice. */
D.PROJECT_VOICES = {
  well: ['Elder Wren', 'Cold, clear water. I had forgotten the sound of the bucket.'],
  inn: ['Mabel the Cook', 'Sit, eat. The first bowl is always on the house for whoever fixed my sign.'],
  forge: ['Old Brannoc', 'Hear that? The anvil sings again. Bring me ore whenever you like.'],
  garden: ['Granny Bramble', 'Onions in rows, potatoes in hills. The bees will find us by morning.'],
  library: ['Archivist Pell', 'Every shelf dusted. Every book a little less lonely.'],
  watchtower: ['Captain Hale', 'From up here you can see the goblins coming. Mostly they turn round.'],
  market: ['A Mossbarrow trader', 'A roof over the stalls! Prices are friendlier when nobody is wet.'],
  jetty: ['A Saltmere dockhand', 'Boats tie up properly now. The gulls are furious.'],
  hearth: ['An Ironpeak miner', 'Warm hands, steady picks. We owe you a pint and a pickaxe.'],
  lanterns: ['A Gloomfen guide', 'Follow the lights and you will not follow the wisps.'],
  cistern: ['A fireguard of Emberfall', 'Cool water at last. The courtyard steams like a kettle.'],
  bridge: ['A Skyreach monk', 'The pilgrims cross singing. Some of them even in tune.'],
  refuge: ['A weary traveller', 'Four walls and a fire, here of all places. Thank you.']
};
/* Regional projects use that region's own materials and give a distinct benefit. Every regional project also keeps the
   original +2% resting recovery, so players who finished one before this change keep exactly what they had. */
const regionalProjects = [
 ['mossbarrow','market','Repair the market shelter','The market stalls are sheltered and traders can return.',{coins:150,log_normal:30,crop_potato:15},{coin:.03},'+3% coins from every source.'],
 ['saltmere','jetty','Rebuild the fishing jetty','Fishing boats can unload safely at the repaired jetty.',{coins:500,log_oak:40,raw_sardine:25},{speed_fishing:.05},'Fishing is 5% faster.'],
 ['ironpeak','hearth','Relight the communal hearth','The hold has a warm refuge for returning miners.',{coins:1200,log_willow:30,ore_coal:25},{speed_mining:.05},'Mining is 5% faster.'],
 ['gloomfen','lanterns','Restore the marsh lanterns','Lanterns mark a safe path through the marsh.',{coins:2500,log_maple:30,bar_iron:15},{dr:.03},'Monsters deal 3% less damage.'],
 ['emberfall','cistern','Repair the cooling cistern','Fresh water reaches the citadel courtyards again.',{coins:5000,log_yew:30,bar_steel:15},{heal:.05},'Food restores 5% more health.'],
 ['skyreach','bridge','Repair the monastery bridge','Pilgrims can cross between the monastery peaks.',{coins:9000,log_magic:25,bar_mithril:12},{gather:.03},'Gathering is 3% faster.'],
 ['hollow','refuge','Rebuild the travellers’ refuge','A welcoming refuge stands among the fallen kingdom’s ruins.',{coins:15000,log_elder:25,bar_adamant:12},{xpAll:.03},'+3% XP to every skill.']
];
for(const [town,id,name,story,cost,fx,reward] of regionalProjects)D.PROJECTS[id]={town,name,story,cost,reward:reward+' Resting health recovery is 2% faster.',fx:Object.assign({regen:.02},fx)};
DQ.projectsForTown = town => Object.entries(D.PROJECTS).filter(([,p])=>p.town===town);
const destinations = { boss: 'Defeat Grubnash', house: 'Build my first home', well: D.PROJECTS.well.name, inn: D.PROJECTS.inn.name, village: 'Restore Willowbrook' };
const nextVillageProject = () => DQ.projectsForTown('willowbrook').map(([id]) => id).find(id => !S().projects[id]);
DQ.pinProject = id => {
  if (!D.PROJECTS[id]) return false;
  S().pinnedProject = S().pinnedProject === id ? null : id;
  DQ.save(); DQ.emit('projectpin'); return true;
};
const step = (title, detail, action, a, b) => ({ title, detail, action, a, b });
const task = (title, detail, kind, id) => step(title, detail, 'journeytask', kind, id);
DQ.journeyNext = (id = S().journey || 'boss') => {
  if (id === 'village') { const v = nextVillageProject(); return v ? DQ.journeyNext(v) : step('Willowbrook is restored', 'Every village project is complete. Its benefits are permanent.', 'go', 'projects'); }
  if (D.PROJECTS[id]) {
    const project = D.PROJECTS[id];
    if (S().projects[id]) return step('Project complete', project.story + ' ' + project.reward, 'go', 'map');
    if (S().town !== project.town) return step('Return to '+D.TOWN[project.town].name, 'Your neighbours are ready to help.', 'journeytravel', project.town);
    if (id === 'inn' && DQ.have('shrimp') < 12) {
      if (!DQ.skillUnlocked('cooking')) return task('Unlock Cooking at Hero 3', 'Catch shrimp to earn Hero XP. Cooking opens at Hero level 3.', 'fish', 'shrimp');
      if (!DQ.have('raw_shrimp')) return task('Catch shrimp for the inn', 'The inn needs 12 cooked shrimp. Gather raw shrimp first.', 'fish', 'shrimp');
      return task('Cook for the inn', fmt(DQ.have('shrimp')) + ' / 12 cooked shrimp ready. Some attempts may burn.', 'recipe', 'cook_shrimp');
    }
    /* the first missing material, routed to where it comes from */
    const missing = Object.entries(project.cost).find(([item, n]) => item !== 'coins' && DQ.have(item) < n);
    if (missing) {
      const [item, n] = missing, it = D.ITEMS[item], src = DQ.sourceOf ? DQ.sourceOf(item) : null, detail = fmt(DQ.have(item)) + ' / ' + n + ' ' + it.name.toLowerCase() + ' ready for ' + project.name.toLowerCase() + '.';
      if (item === 'log_normal') return task('Gather timber', fmt(DQ.have(item)) + ' / ' + n + ' logs ready.', 'wood', 'normal');
      if (src && src.skill && !DQ.skillUnlocked(src.skill)) return step('Unlock ' + D.SK[src.skill].name, it.name + ' comes from ' + D.SK[src.skill].name + '. ' + DQ.unlockHow(src.skill) + '.', 'go', src.page);
      const verb = { fish: 'Catch', wood: 'Chop', mine: 'Mine', thieve: 'Steal', recipe: 'Make', fight: 'Hunt for' }[src && src.kind];
      if (verb) return task(verb + ' ' + it.name.toLowerCase(), detail, src.kind, src.id);
      if (src) return step('Get ' + it.name.toLowerCase(), detail, 'route', item);
      return step('Find ' + it.name.toLowerCase(), detail, 'go', 'character');
    }
    if (S().coins < project.cost.coins) return step('Raise the project funds', fmt(S().coins) + ' / ' + project.cost.coins + ' coins. Sell spare resources or claim quest rewards.', 'go', 'character');
    return step('Complete the project', project.reward + ' Materials are consumed once.', 'projectfinish', id);
  }
  if (id === 'house') {
    if (S().house.owned) return step('Your cottage is ready', 'Build rooms and furnish your home for lasting bonuses.', 'go', 'house');
    if (DQ.advLvl() < D.HOUSE.adv) return task('Reach Hero ' + D.HOUSE.adv, 'Your cottage opens at Hero ' + D.HOUSE.adv + '. Train skills or complete quests for Hero XP.', 'fish', 'shrimp');
    if (S().coins < D.HOUSE.price) return step('Save for your cottage', fmt(S().coins) + ' / ' + fmt(D.HOUSE.price) + ' coins. Sell spare resources and claim quests.', 'go', 'character');
    return step('Buy your first home', 'You have the level and coins. Visit the estate to buy your cottage.', 'go', 'house');
  }
  const bossQuest = D.QUESTS.find(q => q.obj.some(o => o.ev === 'boss' && o.key === 'grubnash'));
  if (bossQuest && DQ.questState(bossQuest) === 'ready') return step('Claim your victory reward', 'Return to the quest giver for the rewards you earned by defeating Grubnash.', 'qclaim', bossQuest.id);
  if (S().towns.willowbrook.boss) return step('The road is open', 'Grubnash is defeated. Visit Mossbarrow or choose your next destination.', 'go', 'map');
  if (S().town !== 'willowbrook') return step('Return to Willowbrook', 'Grubnash awaits outside the village.', 'journeytravel', 'willowbrook');
  const first = D.QM.first_steps, firstState = DQ.questState(first);
  if (firstState === 'new') return step('Meet Elder Wren', 'Accept First Steps, or simply start fishing or chopping: the quest is accepted for you and your work counts.', 'qstart', first.id);
  if (firstState === 'ready') return step('Claim First Steps', 'Collect your XP and coins from Elder Wren.', 'qclaim', first.id);
  if (firstState === 'active') {
    const p = S().q[first.id], index = first.obj.findIndex((o, i) => DQ.objProg(first, p, i) < o.n);
    if (index >= 0) return index === 0 ? task('Catch five shrimp', 'Your first quest prepares food and earns Hero XP.', 'fish', 'shrimp') : task('Chop five logs', 'Gather timber to complete First Steps.', 'wood', 'normal');
  }
  if (bossQuest && DQ.questState(bossQuest) === 'new') return step('Accept the Grubnash quest', 'Make your boss victory count toward the village quest and its rewards.', 'qstart', bossQuest.id);
  if (!DQ.skillUnlocked('cooking')) return task('Unlock Cooking at Hero 3', 'Prepare a food supply before taking on stronger opponents.', 'fish', 'shrimp');
  const food = DQ.foods().reduce((n, id) => n + DQ.have(id) * D.ITEMS[id].heal, 0), req = D.MON.grubnash.boss.req;
  if (DQ.combatLvl() < req) return task('Train for Grubnash', 'Combat ' + DQ.combatLvl() + ' / ' + req + '. Train Attack, Strength and Defence using the combat training focus.' + (food < DQ.maxHp() ? ' Cook a little food on the way.' : ''), 'fight', 'chicken');
  /* Ready by level: let the battle forecast decide what, if anything, is missing. */
  const f = DQ.bossForecast ? DQ.bossForecast('grubnash') : null;
  if (f && f.winRate >= .75) return step('Challenge Grubnash', `The battle forecast wins ${Math.round(f.winRate * 100)}% of fights with your current gear and food.`, 'go', 'combat');
  const needFood = f && f.foodPerKill != null ? Math.ceil(f.foodPerKill * 1.5) : DQ.maxHp() * 2;
  if (food < needFood) {
    const msg = `${f ? `Forecast: ${Math.round(f.winRate * 100)}% wins. ` : ''}Food restores ${fmt(food)} health; about ${fmt(needFood)} would carry you through.`;
    if (!DQ.have('raw_shrimp')) return task('Gather food for the fight', msg, 'fish', 'shrimp');
    return task('Cook your provisions', msg, 'recipe', 'cook_shrimp');
  }
  return task('Grow a little stronger', `${f ? `Forecast: ${Math.round(f.winRate * 100)}% wins. ` : ''}Food is fine; a few more combat levels or better gear will tip the odds. Check the forecast on the Combat page.`, 'fight', 'chicken');
};
DQ.finishProject = id => {
  const project = D.PROJECTS[id];
  if (!project || S().projects[id] || S().town !== project.town || !DQ.canAfford(project.cost)) return false;
  Object.entries(project.cost).forEach(([item, n]) => item === 'coins' ? S().coins -= n : DQ.take(item, n));
  S().projects[id] = true; DQ.fxDirty();
  DQ.log(project.story, 'good');
  const voice = D.PROJECT_VOICES[id];
  DQ.notify({ kind: 'quest', page: 'projects', key: 'project:' + id, title: project.name, text: project.story + ' ' + project.reward + (voice ? ` ${voice[0]}: “${voice[1]}”` : ''), icon: 'house', sound: 'restore' });
  DQ.emit('project', id);
  DQ.save(); return true;
};
const actionHtml = next => `<button class="btn primary" data-do="${next.action}" data-a="${next.a || ''}" data-b="${next.b || ''}">${esc(next.title)}</button>`;
const pinButton = id => `<button class="btn sm" data-do="pinproject" data-a="${id}" aria-pressed="${S().pinnedProject === id}">${ico('pin')}${S().pinnedProject === id ? 'Unpin project' : 'Pin project'}</button>`;
UI.projectPinHtml = () => {
  const id = S().pinnedProject, project = D.PROJECTS[id];
  if (!project || (UI.view === 'projects' && project.town === S().town && (UI.tab.projectChoice || DQ.projectsForTown(S().town)[0]?.[0]) === id) || (UI.view === 'overview' && S().journey === id)) return '';
  const done = S().projects[id];
  return `<div class="project-pin" role="group" aria-label="Pinned village project"><button class="project-pin-open" data-do="openproject" data-a="${id}">${ico('pin')}<span><b>${esc(project.name)}</b><small>${done ? '✓ Restored · benefit active' : Object.keys(project.cost).map(item=>`<span data-b="projectneed:${id}:${item}"></span>`).join(' · ')}</small></span></button><button class="btn sm project-pin-next" data-do="projectnext" data-a="${id}" data-b="projectaction:${id}"></button><button class="iconb sm" data-do="pinproject" data-a="${id}" aria-label="Unpin village project">${ico('close')}</button></div>`;
};
UI.B.projectneed = (el, id, item) => {
  const required = D.PROJECTS[id].cost[item], held = item === 'coins' ? S().coins : DQ.have(item);
  const label = item === 'coins' ? 'coins' : item === 'log_normal' ? 'logs' : item === 'shrimp' ? 'shrimp' : D.ITEMS[item].name.toLowerCase();
  UI.set(el, `${Math.min(held, required)}/${required} ${label}`); el.classList.toggle('ok', held >= required);
};
UI.B.projectaction = (el, id) => UI.set(el, S().projects[id] ? 'View village' : DQ.journeyNext(id).title);
UI.journeyPanel = () => {
  const next = DQ.journeyNext();
  return `<section class="panel journey"><div class="phead"><div><span class="k">Your destination</span><h2>${esc(destinations[S().journey] || destinations.boss)}</h2></div></div>
    <section data-reference="true" class="destination-picker"><h3>Change destination</h3><div class="destination-choices" aria-label="Choose your destination">${Object.entries(destinations).map(([id, label]) => `<button class="chip ${S().journey === id ? 'on' : ''}" aria-pressed="${S().journey === id}" data-do="destination" data-a="${id}">${esc(label)}</button>`).join('')}</div></section>
    <p>${esc(next.detail)}</p><div class="btnrow wrap">${actionHtml(next)}${D.PROJECTS[S().journey] ? pinButton(S().journey) : '<button class="btn" data-do="go" data-a="quests">Quest log</button>'}</div>
    <section data-reference="true"><h3>How the journey works</h3><p>Your destination stays selected while you explore. The next step follows your supplies, quest progress and unlocks. Tasks run at full speed for two hours away, then half speed up to eight hours. An eight-hour absence gives five hours of task work.</p></section></section>`;
};
UI.projectsPanel = () => {
  const town=S().town, entries=DQ.projectsForTown(town);
  const id=entries.some(([key])=>key===UI.tab.projectChoice)?UI.tab.projectChoice:entries[0][0],project=D.PROJECTS[id];
  const done = S().projects[id], canFinish = !done && S().town === project.town && DQ.canAfford(project.cost);
  const changes = (town==='willowbrook'?['first_steps', 'hungry_cook']:[]).filter(q => S().q[q] && S().q[q].s === 'done');
  return `<div class="town-project-workspace"><section class="panel"><div class="phead"><h2>${esc(D.TOWN[town].name)} · projects</h2>${pinButton(id)}</div><label class="page-picker" for="town-project">Project${UI.choiceButtons(`<select id="town-project" data-in="town-project">${entries.map(([key, p]) => `<option value="${key}" ${key === id ? 'selected' : ''}>${esc(p.name)}${S().projects[key] ? ' · Complete' : ''}</option>`).join('')}</select>`)}</label>
    ${done ? '<p class="ok">Completed · permanent benefit active</p>' : `<div class="btnrow"><button class="btn primary" data-do="${canFinish ? 'projectfinish' : 'projectnext'}" data-a="${id}">${canFinish ? 'Complete project' : 'Work on this project'}</button></div>`}
    <h3>${esc(project.name)}</h3><p>${esc(done ? project.story : project.reward)}</p>${done ? '' : `<div class="rws">${Object.entries(project.cost).map(([item, n]) => { const held = item === 'coins' ? S().coins : DQ.have(item); return `<span class="${held >= n ? 'ok' : 'bad'}">${fmt(held)} / ${n} ${item === 'coins' ? 'coins' : D.ITEMS[item].name.toLowerCase()}</span>${held < n && item !== 'coins' && UI.routeChip ? UI.routeChip(item) : ''}`; }).join('')}</div>`}</section>
    <section class="panel town-projects"><div class="phead"><h2>A living ${esc(D.TOWN[town].name)}</h2></div>${UI.scene(town)}${changes.map(q=>`<p class="village-change">✓ ${esc(D.QM[q].name)} · ${esc(DQ.questImpact(q))}</p>`).join('')}${entries.filter(([key])=>S().projects[key]).map(([key,p])=>`<p class="village-change">✓ ${esc(p.story)}${D.PROJECT_VOICES[key]?`<span class="villager-line"><b>${esc(D.PROJECT_VOICES[key][0])}:</b> “${esc(D.PROJECT_VOICES[key][1])}”</span>`:''}</p>`).join('')}<p class="sm dim">Completed quests and projects change the village.</p></section></div>`;
};
UI.homeSections.unshift(UI.journeyPanel); /* the one primary objective leads Home */
UI.V.projects = () => UI.projectsPanel();
UI.returnPlan = sum => {
  const next = DQ.journeyNext();
  const status = sum.died ? 'Your hero was defeated. Replenish food and review equipment before resuming combat.' : sum.stopped ? 'Your task finished or stopped. Check the next step before starting another.' : DQ.act ? DQ.actLabel() + ' is still running.' : 'No task is running.';
  return `<section class="return-plan"><h3>${esc(destinations[S().journey] || destinations.boss)}</h3><p>${esc(status)}</p><p>${esc(next.detail)}</p>${actionHtml(next)}</section>`;
};
Object.assign(UI.DO, {
  pinproject: id => { if (DQ.pinProject(id)) UI.render(false); },
  openproject: id => { const p=D.PROJECTS[id];if(!p)return;if(p.town!==S().town){const next=DQ.journeyNext(id);return UI.DO[next.action](next.a,next.b);} UI.tab.projectChoice = id; if (UI.view === 'projects') UI.render(false); else DQ.go('projects'); },
  projectnext: id => {
    if (!D.PROJECTS[id]) return;
    if (S().projects[id]) return UI.DO.openproject(id);
    const next = DQ.journeyNext(id); UI.DO[next.action](next.a, next.b);
  },
  destination: id => { if (!destinations[id]) return; S().journey = id; DQ.save(); if (UI.view === 'overview') UI.render(false); else DQ.go('overview'); },
  journeytask: (kind, id) => { DQ.closeModal(); if (DQ.startAct(kind, id, { quiet: true })) DQ.go(DQ.actPage()); else { const page = { fish: 'fishing', wood: 'woodcutting', mine: 'mining', thieve: 'thieving', fight: 'combat' }[kind] || (kind === 'recipe' && D.RECIPES[id] ? D.SK[D.RECIPES[id].skill].page : null); if (page) { if (UI.taskChoice) UI.taskChoice[page] = id; DQ.go(page); } } },
  journeytravel: id => { DQ.closeModal(); DQ.travel(id); DQ.go('overview'); },
  projectfinish: id => { if (DQ.finishProject(id)) UI.render(false); },
  safetyexport: () => DQ.downloadSave(),
  safetyreload: () => location.reload()
});
let lastJourney = '';
DQ.on('ui', () => {
  if (UI.view !== 'overview') return;
  const next = DQ.journeyNext(), signature = JSON.stringify(next);
  if (signature === lastJourney) return;
  lastJourney = signature;
  const panel = document.querySelector('.journey');
  if (!panel || panel.contains(document.activeElement) || panel.matches(':hover')) return;
  const holder = document.createElement('div'); holder.innerHTML = UI.journeyPanel();
  panel.replaceWith(holder.firstElementChild);
});
const health = document.createElement('section');
health.id = 'save-health'; health.className = 'save-health'; health.hidden = true;
health.setAttribute('role', 'alert'); document.body.appendChild(health);
let healthText = '';
setInterval(() => {
  if (healthText === DQ.saveHealth) return;
  healthText = DQ.saveHealth; health.hidden = !healthText;
  health.innerHTML = healthText ? `<strong>${esc(healthText)}</strong><div class="btnrow wrap"><button class="btn" id="save-export">Download backup</button><button class="btn" id="save-reload">Reload latest save</button></div>` : '';
  if (healthText) {
    health.querySelector('#save-export').onclick = () => DQ.downloadSave();
    health.querySelector('#save-reload').onclick = () => location.reload();
  }
}, 500);

/* Starting a task First Steps asks for accepts it, so a new hero's first catches and logs always count. */
const startAct0 = DQ.startAct;
DQ.startAct = (kind, id, o = {}) => {
  const r = startAct0(kind, id, o);
  const first = D.QM.first_steps;
  if (r && !DQ.forecasting && !(DQ.sim && DQ.sim.on) && first && DQ.questState(first) === 'new' && first.obj.some(ob => ({ fish: 'catch', wood: 'chop' })[kind] === ob.ev && (ob.key === id || ob.key === '*'))) {
    DQ.startQuest('first_steps'); DQ.toast && DQ.toast('First Steps accepted: your catch now counts toward it');
  }
  return r;
};

/* One cached forecast per meaningful change (combat level, gear, food, town), so Home stays fast. */
const fcCache = { key: '', at: 0, res: null };
DQ.bossForecast = id => {
  const m = D.MON[id]; if (!m || m.town !== S().town || DQ.forecasting || !DQ.forecast) return null;
  const food = DQ.foods().reduce((n, f) => n + DQ.have(f) * D.ITEMS[f].heal, 0);
  const key = JSON.stringify([id, DQ.combatLvl(), S().equip, Math.round(food / 20), DQ.maxHp(), S().town]);
  if (fcCache.key === key && fcCache.res) return fcCache.res;
  if (fcCache.key !== key && Date.now() - fcCache.at < 1500 && fcCache.res) return fcCache.res;
  fcCache.key = key; fcCache.at = Date.now();
  try { fcCache.res = DQ.forecast(id); } catch (e) { fcCache.res = null; }
  return fcCache.res;
};
})();
