/* Hidden recipes (Dec 2026, World Life). Armour and food that no shop sells and no ordinary loot table holds. A recipe
   is found (a rare drop, an event, a tower floor, a villager, a seam of ore) and then known for good: S.recipes.known.
   Before that it is invisible, unless you have heard of it (S.recipes.heard): then the crafting menu shows "???" and
   the rumour. Everything is data: add a row to D.SECRET_RECIPES and, if it should be findable, a source. */
(() => {
const DQ = window.DQ, D = DQ.data, S = () => DQ.S;
const gear = (id, name, ic, col, slot, req, b, unique, flavour, val) => { D.ITEMS[id] = { id, name, ic, col, val, type: 'gear', slot, req, b, unique, flavour, rare: 1, secret: 1 }; };
const meal = (id, name, col, val, drink) => { D.ITEMS[id] = { id, name, ic: 'bread', col, val, type: 'potion', drink, secret: 1 }; };
gear('thornweave_vest', 'Thornweave vest', 'body', '#7a9a4a', 'body', { defence: 20 }, { def: 14, rng: 4 }, { key: 'thorns', name: 'Thorns', text: 'Reflects 35% of damage taken' }, 'Bramble stitched into boiled hide. It bites back.', 900);
gear('tidewalker_greaves', 'Tidewalker greaves', 'legs', '#5a9ab8', 'legs', { defence: 25 }, { def: 15 }, { key: 'hide', name: 'Thick hide', text: 'Normal attacks: −15% damage taken' }, 'Sharkskin over steel, cut for wading.', 1600);
gear('stargazer_hood', 'Stargazer’s hood', 'helm', '#b8a8f0', 'head', { defence: 35 }, { def: 12, mag: 10 }, { key: 'swift', name: 'Gale', text: '+10% attack speed' }, 'Lined with something that fell out of the sky.', 4200);
meal('hunters_feast', 'Hunter’s feast', '#c86a3a', 260, { buff: 'boss', mult: 1.2, mins: 10, name: 'Feast', text: '+20% damage to bosses for 10 minutes' });
meal('stonebread', 'Stonebread', '#a89a80', 180, { buff: 'guard', mult: .85, mins: 15, name: 'Stonebread', text: '−15% damage taken for 15 minutes' });
meal('lantern_tea', 'Lantern tea', '#e8c860', 140, { buff: 'slow', mult: .9, mins: 20, name: 'Lantern tea', text: '+10% task speed for 20 minutes' });
D.ITEMS.star_shard = { id: 'star_shard', name: 'Star shard', ic: 'gem', col: '#cfc4ff', val: 300, type: 'resource', sub: 'From a fallen star. Stargazer’s hood needs three.' };
/* id, skill, tab, level, xp, materials, where it is found (shown once known), the rumour (shown as ???) */
D.SECRET_RECIPES = [
  { id: 'thornweave_vest', skill: 'crafting', tab: 'Armour', lvl: 28, xp: 180, in: { cowhide: 6, log_oak: 4, wolf_pelt: 2 }, found: 'A scrap of pattern, dropped by a thimblefox', rumour: 'The foxes of Mossbarrow have been at somebody’s sewing.', drop: ['thimblefox', 1 / 60] },
  { id: 'tidewalker_greaves', skill: 'smithing', tab: 'Armour', lvl: 34, xp: 260, in: { bar_steel: 4, cowhide: 3 }, found: 'Chalked on a wall, three floors up the Saltmere tower', rumour: 'Somebody climbed the Saltmere tower in the wet and came down dry.', tower: ['saltmere', 3] },
  { id: 'stargazer_hood', skill: 'crafting', tab: 'Armour', lvl: 45, xp: 420, in: { cloth: 4, star_shard: 3, gem_sapphire: 1 }, found: 'It came to you while the star was still warm', rumour: 'They say starlight can be sewn, if you catch it falling.', event: 'star' },
  { id: 'hunters_feast', skill: 'cooking', tab: 'Farmhouse', lvl: 30, xp: 150, in: { salmon: 2, crop_onion: 2, crop_potato: 2 }, found: 'A traveller’s thanks, written on the back of a map', rumour: 'A hunter’s supper that makes big things fall over faster.', event: 'traveller' },
  { id: 'stonebread', skill: 'cooking', tab: 'Farmhouse', lvl: 22, xp: 110, in: { bread: 2, ore_coal: 1 }, found: 'A miner’s note, wedged in an iron seam', rumour: 'Ironpeak miners bake something you could build a wall with.', study: ['mine', 'iron', 3] },
  { id: 'lantern_tea', skill: 'cooking', tab: 'Farmhouse', lvl: 12, xp: 60, in: { crop_cabbage: 2, feather: 1 }, found: 'Traded for a story with a travelling merchant', rumour: 'The merchants drink something that keeps them walking all night.', event: 'merchant' },
  { id:'shore_broth', output:'potion_heal', qty:1, skill:'cooking',tab:'Farmhouse',lvl:12,xp:55,in:{shrimp:4,crop_onion:1},found:'A fisher’s lunch notes, copied beside the shrimp entry',rumour:'The fishers turn yesterday’s shrimp into a useful emergency broth.',study:['fish','shrimp',2] },
  { id:'charcoal_burn', output:'ore_coal',qty:3,skill:'crafting',tab:'Materials',lvl:10,xp:35,in:{log_normal:4},found:'A charcoal burner’s sketch in your tree notes',rumour:'Stack the wood tightly and let it smoulder. The notes explain the rest.',study:['wood','normal',3] },
  { id:'field_loaf',output:'bread',qty:4,skill:'cooking',tab:'Farmhouse',lvl:15,xp:65,in:{crop_wheat:2,milk:1},found:'A farmhand’s batch recipe in the wheat notes',rumour:'One mixing bowl, four loaves. A field lunch that travels well.',study:['crop','wheat',2] },
].filter(r => D.ITEMS[r.output||r.id] && Object.keys(r.in).every(k => D.ITEMS[k]));
for (const r of D.SECRET_RECIPES) {
  const rec = { id: 'secret_' + r.id, skill: r.skill, tab: r.tab, name: ({shore_broth:'Fisher’s healing broth',charcoal_burn:'Charcoal burning',field_loaf:'Farmhand’s four loaves'})[r.id] || D.ITEMS[r.id].name, lvl: r.lvl, xp: r.xp, t: 3200, in: r.in, out: { [r.output||r.id]: r.qty||1 }, ev: r.skill === 'cooking' ? 'cook' : r.skill === 'smithing' ? 'smith' : 'craft', secret: r.id };
  D.RECIPES[rec.id] = rec; (D.RLIST[r.skill] = D.RLIST[r.skill] || []).push(rec); r.rec = rec.id;
}
D.SECRET = Object.fromEntries(D.SECRET_RECIPES.map(r => [r.id, r]));
const book = () => { const st = S(); if (!st.recipes || typeof st.recipes !== 'object') st.recipes = { known: {}, heard: {} }; st.recipes.known = st.recipes.known || {}; st.recipes.heard = st.recipes.heard || {}; return st.recipes; };
DQ.recipeKnown = id => !!book().known[id];
DQ.recipeHeard = id => !!book().heard[id] || DQ.recipeKnown(id);
/* is this ordinary recipe row usable or visible? (ordinary recipes: always) */
DQ.recipeShown = r => !r.secret || DQ.recipeHeard(r.secret);
DQ.recipeUsable = r => !r.secret || DQ.recipeKnown(r.secret);
DQ.hearRecipe = id => { const r = D.SECRET[id]; if (!r || DQ.recipeHeard(id) || DQ.forecasting) return false; book().heard[id] = Date.now();
  if (!(DQ.sim && DQ.sim.on)) DQ.notify({ kind: 'info', key: 'rumour:' + id, icon: 'book', col: '#b8a8f0', title: 'A rumour', text: r.rumour, sound: false, ttl: 8000 });
  if (DQ.journal) DQ.journal('recipe', `Heard a rumour: ${r.rumour}`, 'book'); return true; };
DQ.learnRecipe = (id, quiet) => { const r = D.SECRET[id]; if (!r || DQ.recipeKnown(id) || DQ.forecasting) return false; book().known[id] = Date.now(); book().heard[id] = book().heard[id] || Date.now();
  const it = D.ITEMS[r.output||id];
  if (!quiet && !(DQ.sim && DQ.sim.on)) DQ.notify({ kind: 'unlock', key: 'recipe:' + id, icon: 'book', col: it.col, title: `Recipe found: ${D.RECIPES[r.rec]?.name||it.name}`, text: `${r.found}. Make it in ${D.SK[r.skill].name}.`, sound: 'gem', burst: true, ttl: 12000 });
  if (DQ.journal) DQ.journal('recipe', `Recipe found: ${D.RECIPES[r.rec]?.name||it.name}. ${r.found}.`, 'book'); DQ.emit && DQ.emit('recipes'); return true; };
/* the sources that are plain rules: a creature's rare drop (with a rumour after ten defeats), and a studied seam */
DQ.recipeOnKill = m => { for (const r of D.SECRET_RECIPES) { if (!r.drop || r.drop[0] !== m.id || DQ.recipeKnown(r.id)) continue; if ((S().beast.kills[m.id] || 0) >= 10) DQ.hearRecipe(r.id); if (DQ.chance(r.drop[1])) DQ.learnRecipe(r.id); } };
DQ.recipeOnStudy = (kind, id, stars) => { for (const r of D.SECRET_RECIPES) { if (!r.study || r.study[0] !== kind || r.study[1] !== id) continue; if (stars >= 1) DQ.hearRecipe(r.id); if (stars >= r.study[2]) DQ.learnRecipe(r.id); } };
DQ.studyDiscovery = (kind,id) => { const r=D.SECRET_RECIPES.find(r=>r.study&&r.study[0]===kind&&r.study[1]===id&&!DQ.recipeKnown(r.id));if(!r)return null;const at=D.MASTERY_STEPS[r.study[2]-1],n=DQ.mastCount(kind,id);return {id:r.id,at,left:Math.max(0,at-n),text:DQ.recipeHeard(r.id)?r.rumour:'A practical recipe waits in these notes.'}; };
DQ.migrateDiscoveries = st => {for(const r of D.SECRET_RECIPES){if(!r.study)continue;const n=(st.mast||{})[r.study[0]+':'+r.study[1]]||0;if(n<25)continue;st.recipes=st.recipes||{known:{},heard:{}};st.recipes.known=st.recipes.known||{};st.recipes.heard=st.recipes.heard||{};st.recipes.heard[r.id]=st.recipes.heard[r.id]||Date.now();if(n>=D.MASTERY_STEPS[r.study[2]-1])st.recipes.known[r.id]=st.recipes.known[r.id]||Date.now();}};
DQ.recipeFromEvent = key => { const r = D.SECRET_RECIPES.find(x => x.event === key && !DQ.recipeKnown(x.id)); return r ? r.id : null; };
})();
