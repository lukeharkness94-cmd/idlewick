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
/* Every region restores six places, like Willowbrook (Nov 2026). The five below each town's first project use that
   region's own materials and grow in cost; their bonuses are small and mostly skill-specific so that finishing all of
   them across the map adds up to a pleasant edge rather than a new balance curve. art = the restoration piece drawn. */
const moreProjects = {
 mossbarrow: [
  ['moss_windmill','windmill','Mend the windmill sails','The sails turn again and the miller grinds the whole valley’s grain.',{coins:250,log_hazel:30,wool:8},{grow:.03},'Crops grow 3% faster.',['Miller Tansy','Listen to her creak! That is the sound of bread, that is.']],
  ['moss_granary','granary','Rebuild the granary','Dry grain stores mean seed for every season.',{coins:400,log_birch:40,crop_wheat:20},{xp_farming:.05},'+5% Farming XP.',['Farmer Hobb','No more rats in the seed corn. Plant whatever you like.']],
  ['moss_pond','pond','Clear the mill pond','The weed is gone and carp rise in the clear pond.',{coins:600,ore_flint:30,raw_carp:20},{speed_fishing:.03},'Fishing is 3% faster.',['A Mossbarrow child','I saw a fish as big as my arm! Well, nearly.']],
  ['moss_tannery','tannery','Reopen the tannery','Hides hang in rows and the leatherworkers are busy again.',{coins:900,cowhide:20,log_oak:30},{xp_crafting:.05},'+5% Crafting XP.',['Tanner Rook','Smells awful, works beautifully. Bring me hides.']],
  ['moss_hall','hall','Raise the harvest hall','A long hall for harvest suppers, with a kitchen at one end.',{coins:1200,crop_cabbage:25,bar_bronze:20,milk:15},{heal:.03},'Food restores 3% more health.',['A Mossbarrow trader','The whole village ate together last night. First time in years.']]],
 saltmere: [
  ['salt_smokehouse','smokehouse','Relight the smokehouse','Fish hang in the sweet smoke and keep for the winter.',{coins:800,log_palm:40,raw_herring:25},{xp_cooking:.05},'+5% Cooking XP.',['Smoker Marla','Herring, mackerel, anything that swims. It all tastes of oak now.']],
  ['salt_nets','nets','Mend the drying nets','The nets are whole and the boats come home heavy.',{coins:1100,string:30,log_oak:30},{xp_fishing:.05},'+5% Fishing XP.',['A Saltmere dockhand','No holes! The fish are outraged.']],
  ['salt_lighthouse','beacon','Light the harbour beacon','A brazier burns at the harbour mouth and the reefs are safe at night.',{coins:1500,ore_quartz:40,bar_iron:15},{dr:.01},'Monsters deal 1% less damage.',['Keeper Ansel','The lighthouse shows the coast, the beacon shows the way in. The rocks stay rocks.']],
  ['salt_saltpans','saltpans','Rake the salt pans','White salt dries in neat squares along the shore.',{coins:2000,ore_quartz:30,raw_mackerel:25},{coin:.02},'+2% coins from every source.',['Salter Gwen','Salt pays for everything here. Now it pays again.']],
  ['salt_boathouse','boathouse','Rebuild the boathouse','Hulls are tarred and new boats take shape on the slip.',{coins:2600,log_willow:40,bar_iron:20},{speed_woodcutting:.03},'Woodcutting is 3% faster.',['Shipwright Odo','Every boat needs timber, and every timber needs a good axe.']]],
 ironpeak: [
  ['iron_smelter','smelter','Fire the great smelter','The great furnace roars and ingots cool in long rows.',{coins:1800,ore_coal:40,ore_iron:40},{speed_smithing:.03},'Smithing is 3% faster.',['Smelter Dagny','Hot enough to melt a grudge. Bring ore.']],
  ['iron_lift','lift','Repair the mine lift','The cage rattles up and down the shaft again.',{coins:2500,bar_iron:25,log_pine:30},{xp_mining:.05},'+5% Mining XP.',['A pit boy','No more ladders! My legs thank you.']],
  ['iron_furstore','furstore','Stock the fur store','Warm furs for every miner going up the cold slopes.',{coins:3200,frost_pelt:15,log_cedar:30},{regen:.05},'Resting health recovery is 5% faster.',['Old Gunnhild','Wrap up. The mountain does not care how brave you are.']],
  ['iron_assay','assay','Reopen the assay office','The assayer weighs every find and pays a fair price.',{coins:4000,ore_silver:25,bar_steel:12},{speed_crafting:.03},'Crafting is 3% faster.',['Assayer Brannoc','Silver, jet, a bit of gold. I know it all by the weight.']],
  ['iron_gate','gate','Rehang the hold gate','The iron gate swings shut and the wolves stay outside.',{coins:5000,bar_steel:25,ore_jet:20},{dr:.01},'Monsters deal 1% less damage.',['A hold guard','Two tonnes of iron on new hinges. Let them knock.']]],
 gloomfen: [
  ['fen_boardwalk','boardwalk','Lay the boardwalk','Planks run over the bog, dry underfoot all the way.',{coins:3500,log_mangrove:30,log_maple:30},{gather:.02},'Gathering is 2% faster.',['A Gloomfen guide','Nobody has lost a boot since. Well, one boot.']],
  ['fen_herbary','herbary','Reopen the herbary','Bundles of marsh herbs dry beneath the rafters.',{coins:4500,crop_goldleaf:20,log_maple:25},{xp_herbalism:.05},'+5% Herbalism XP.',['Herbwife Mora','Bogmint for fevers, goldleaf for everything else.']],
  ['fen_stilthouse','stilthouse','Raise the stilt houses','Homes stand above the water again, lamps in every window.',{coins:5500,log_mangrove:40,bogscale:10},{heal:.03},'Food restores 3% more health.',['A fen mother','Dry floors! The children can finally sit down.']],
  ['fen_eelweir','eelweir','Mend the eel weir','The woven weir guides the catch into waiting baskets.',{coins:6500,raw_catfish:30,log_maple:30},{speed_fishing:.03},'Fishing is 3% faster.',['Eel-catcher Pip','The fen gives, if you ask it nicely and mend your weir.']],
  ['fen_shrine','shrine','Rekindle the marsh shrine','A small flame burns at the shrine and the mist keeps its distance.',{coins:8000,ore_bogiron:20,bar_steel:20},{xp_magic:.05},'+5% Magic XP.',['Sister Wyn','The wisps used to come right up to the door. Not now.']]],
 emberfall: [
  ['ember_kiln','kiln','Restore the glass kiln','Molten obsidian is drawn into shining shapes.',{coins:7000,ore_obsidian:20,log_cinderbark:30},{speed_crafting:.03},'Crafting is 3% faster.',['Glassblower Ines','Blow gently, cool slowly, and never sneeze.']],
  ['ember_armoury','armoury','Restock the armoury','Racks of blades and shields stand ready on the walls.',{coins:9000,bar_mithril:15,log_yew:30},{xp_smithing:.05},'+5% Smithing XP.',['Armourer Vass','Every blade sharpened, every strap oiled.']],
  ['ember_baths','baths','Reopen the hot baths','Steaming pools fed by the mountain soothe tired fighters.',{coins:11000,ore_obsidian:25,bar_mithril:10},{regen:.05},'Resting health recovery is 5% faster.',['A fireguard of Emberfall','Ten minutes in there and you forget you were ever stabbed.']],
  ['ember_ward','ward','Raise the flame wards','Carved wards line the walls and turn the heat aside.',{coins:13000,ember_core:3,bar_mithril:20},{dr:.01},'Monsters deal 1% less damage.',['Warden Kael','Let the fire come. The wards are hungry.']],
  ['ember_forge','greatforge','Relight the dragon forge','The great forge burns with mountain fire again.',{coins:16000,drakehide:6,log_cinderbark:40},{speed_smithing:.03},'Smithing is 3% faster.',['Old Brannoc’s cousin','Hotter than ours back home. Do not tell him I said so.']]],
 skyreach: [
  ['sky_windchimes','chimes','Hang the wind chimes','Chimes of skyglass ring softly over the terraces.',{coins:12000,ore_skyglass:10,log_windpine:30},{xp_research:.05},'+5% Scholarship XP.',['Brother Aldous','The monks study better with a little music.']],
  ['sky_terraces','terraces','Replant the terraces','Sunbloom grows in steps down the mountainside.',{coins:15000,crop_sunbloom:20,log_magic:20},{grow:.03},'Crops grow 3% faster.',['Gardener Lio','Up here the sun is closer. The flowers know it.']],
  ['sky_scriptorium','scriptorium','Reopen the scriptorium','Copyists bend over their desks and the ink never dries out.',{coins:18000,log_magic:30,feather:60},{xp_enchanting:.05},'+5% Enchanting XP.',['Scribe Oriel','Every word copied twice, in case the wind takes one.']],
  ['sky_eyrie','eyrie','Rebuild the eyrie','Messenger birds roost here and carry word between the peaks.',{coins:22000,log_windpine:40,bar_adamant:10},{xp_exploration:.05},'+5% Exploration XP.',['Falconer Brisa','She will find you anywhere. Usually with a beak first.']],
  ['sky_bell','bigbell','Raise the great bell','A deep bell tolls across the clouds at dawn and dusk.',{coins:26000,bar_mithril:30,ore_skyglass:15},{xpAll:.01},'+1% XP to every skill.',['The Abbot','We had forgotten what the morning sounded like.']]],
 hollow: [
  ['hollow_camp','camp','Pitch the waystation','Tents and a warm fire for travellers among the ruins.',{coins:20000,log_wraithbark:30,cloth:20},{heal:.03},'Food restores 3% more health.',['A weary traveller','A fire! I could weep.']],
  ['hollow_watch','watchfire','Light the watchfires','Beacons burn along the old walls through the long night.',{coins:25000,log_elder:30,bar_adamant:15},{dr:.01},'Monsters deal 1% less damage.',['A Hollow scout','We see them coming now. That is half the battle.']],
  ['hollow_archive','archive','Dig out the old archive','Scrolls of the fallen kingdom are recovered and read again.',{coins:30000,log_wraithbark:40,ore_nullite:10},{xp_research:.05},'+5% Scholarship XP.',['Archivist Pell','The kingdom kept wonderful records. And terrible secrets.']],
  ['hollow_garden','gravegarden','Tend the memorial garden','Pale flowers grow over the old graves, and nobody walks past in fear.',{coins:36000,crop_moonmelon:15,ore_voidstone:10},{regen:.05},'Resting health recovery is 5% faster.',['A mourner','My grandmother is here somewhere. Now she has flowers.']],
  ['hollow_throne','throne','Restore the throne hall','Banners hang again in the great hall of the fallen kingdom.',{coins:45000,bar_rune:12,log_elder:40},{coin:.02},'+2% coins from every source.',['The last steward','It is not a kingdom again. But it is a home.']]]
};
for (const [town, list] of Object.entries(moreProjects)) for (const [id, art, name, story, cost, fx, reward, voice] of list) { D.PROJECTS[id] = { town, art, name, story, cost, fx, reward }; D.PROJECT_VOICES[id] = voice; }
DQ.projectsForTown = town => Object.entries(D.PROJECTS).filter(([,p])=>p.town===town);
/* Projects are built in deliveries (Nov 2026): each material can be handed over whenever you have some, the building
   rises in stages as the deliveries add up, and it is complete once everything is in. S().projectGiven[id][item]
   holds what has been delivered; nothing is consumed until it is handed over. */
const given = id => (S().projectGiven && S().projectGiven[id]) || {};
DQ.projectNeed = id => { const p = D.PROJECTS[id], g = given(id), out = {}; if (!p) return out; if (S().projects[id]) return out; for (const [k, n] of Object.entries(p.cost)) { const left = n - (g[k] || 0); if (left > 0) out[k] = left; } return out; };
DQ.projectProgress = id => { const p = D.PROJECTS[id]; if (!p) return 0; if (S().projects[id]) return 1; const g = given(id), lines = Object.entries(p.cost); return lines.reduce((a, [k, n]) => a + Math.min(1, (g[k] || 0) / n), 0) / lines.length; };
/* 0 ruin · 1 site cleared, foundations · 2 walls rising · 3 nearly there · 4 restored */
DQ.projectStage = id => { if (S().projects[id]) return 4; const f = DQ.projectProgress(id); return f <= 0 ? 0 : f < 1 / 3 ? 1 : f < 2 / 3 ? 2 : 3; };
DQ.PROJECT_STAGES = ['Ruined', 'Foundations laid', 'Walls rising', 'Nearly finished', 'Restored'];
const STAGE_LINES = ['', 'Builders clear the site of %s and lay the first stones.', 'The walls of %s are rising.', '%s is nearly finished: the last of it goes up under the scaffolding.'];
const held = k => k === 'coins' ? S().coins : DQ.have(k);
DQ.projectGive = (id, item) => {
  const p = D.PROJECTS[id]; if (!p || S().projects[id] || S().town !== p.town) return 0;
  const items = item ? [item] : Object.keys(DQ.projectNeed(id)), before = DQ.projectStage(id); let total = 0;
  S().projectGiven = S().projectGiven || {}; const g = S().projectGiven[id] = S().projectGiven[id] || {};
  for (const k of items) { const left = DQ.projectNeed(id)[k] || 0, n = Math.min(left, Math.floor(held(k))); if (n <= 0) continue;
    if (k === 'coins') S().coins -= n; else DQ.take(k, n); g[k] = (g[k] || 0) + n; total += n; }
  if (!total) return 0;
  if (!Object.keys(DQ.projectNeed(id)).length) { completeProject(id); return total; }
  const after = DQ.projectStage(id);
  if (after > before) { DQ.log(STAGE_LINES[after].replace('%s', p.name.replace(/^\w+ the /, 'the ').toLowerCase()).replace(/^./, c => c.toUpperCase()), 'good'); DQ.toast && DQ.toast(`${p.name}: ${DQ.PROJECT_STAGES[after].toLowerCase()}`); }
  DQ.emit('project', id); DQ.save(); return total;
};
/* The opening arc: what each Willowbrook villager says when you finish their job, and what it changed. Shown on
   the quest-complete card (not the bell), so the first half hour has visible acknowledgement. Words only. */
Object.entries({
  first_steps: 'Good timber, and you will not faint on the road. The well needs twenty logs for a new winch. Or keep your coins for armour; Grubnash will not wait politely either way.',
  goblin_menace: 'Six fewer goblins at the farms, and the east road is quiet tonight. Grubnash will have heard. He is dug in on the hill fort; mind his war cry.',
  hungry_cook: 'Eight perfect shrimp! The banquet is saved. Take some coins, and take my advice: never fight a goblin chief on an empty stomach.',
  chiefs_end: 'The hill fort is ours. Listen: the children are playing on the green again. The road to Mossbarrow is open, and they say something big has been trampling their fields.'
}).forEach(([id, line]) => { if (D.QM[id]) D.QM[id].thanks = line; });
/* A boss victory is felt in its town: a villager speaks on the victory card, townsfolk return to the scenes, and a
   later note on the door remembers it (touches.js). [speaker, on the day, a note some time later] */
D.BOSS_VOICES = {
  grubnash: ['Elder Wren', 'Listen. No war cries. Just the well bucket and the hens.', 'Sergeant Orrin hung Grubnash’s war-horn over the tavern door. Nobody is allowed to blow it.'],
  oldtusk: ['Granny Bramble', 'The fields will grow straight again. I might even plant pumpkins.', 'The farmers left a sack of turnips on your step. Old Tusk ate their last ones.'],
  barnacle: ['Harbourmaster Ilsa', 'Every ship in the bay rang its bell when he went down. Did you hear them?', 'The fishing boats sail out at dawn again. Ilsa says the harbour is louder than it has been in years.'],
  frostmaw: ['Captain Hrod', 'The pass is open. The first cart through is carrying your name on a banner.', 'Hrod sent a dwarf-forged mug with your name on it. It is very heavy.'],
  morwenna: ['Gravewarden Lysa', 'The dead are sleeping. I might sleep too, for the first time in a month.', 'Lysa planted marsh-lilies over Morwenna’s hut. They are already blooming.'],
  pyrrhax: ['Warden Ignis', 'The banners can fly again. We will need to sew new ones; he burned all the old ones.', 'Emberfall’s new banners arrived. One of them has a very flattering picture of you.'],
  zephyrion: ['Abbot Seren', 'The sky bridges hold. The monks are already arguing about who crosses first.', 'The monks finished the first new sky bridge and named it after you, then argued about the spelling.'],
  hollowking: ['The Last Herald', 'The crown is empty, and the silence with it. Go home. They will want to hear it from you.', 'Every bell in the realm rang at noon today, for no reason anyone could name.']
};
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
      if (!DQ.skillUnlocked('cooking')) return (S().stats.catch || 0) < 5 ? task('Learn Cooking', `Catch five fish and chop five logs for a cooking fire. ${DQ.unlockHow('cooking')}.`, 'fish', 'shrimp') : task('Learn Cooking', `Chop logs for a cooking fire. ${DQ.unlockHow('cooking')}.`, 'wood', 'normal');
      if (!DQ.have('raw_shrimp')) return task('Catch shrimp for the inn', 'The inn needs 12 cooked shrimp. Gather raw shrimp first.', 'fish', 'shrimp');
      return task('Cook for the inn', fmt(DQ.have('shrimp')) + ' / 12 cooked shrimp ready. Some attempts may burn.', 'recipe', 'cook_shrimp');
    }
    /* the first missing material, routed to where it comes from */
    const need = DQ.projectNeed(id), deliverable = Object.entries(need).some(([k]) => held(k) > 0);
    if (deliverable && Object.entries(need).every(([k, n]) => held(k) >= n)) return step('Complete the project', project.reward + ' Hand over the last materials.', 'projectfinish', id);
    const missing = Object.entries(need).find(([item, n]) => item !== 'coins' && DQ.have(item) < n);
    if (missing) {
      const [item, n] = missing, it = D.ITEMS[item], src = DQ.sourceOf ? DQ.sourceOf(item) : null, detail = fmt(DQ.have(item)) + ' / ' + n + ' ' + it.name.toLowerCase() + ' ready for ' + project.name.toLowerCase() + '.';
      if (item === 'log_normal') return task('Gather timber', fmt(DQ.have(item)) + ' / ' + n + ' logs ready.', 'wood', 'normal');
      if (src && src.skill && !DQ.skillUnlocked(src.skill)) return step('Unlock ' + D.SK[src.skill].name, it.name + ' comes from ' + D.SK[src.skill].name + '. ' + DQ.unlockHow(src.skill) + '.', 'go', src.page);
      const verb = { fish: 'Catch', wood: 'Chop', mine: 'Mine', thieve: 'Steal', recipe: 'Make', fight: 'Hunt for' }[src && src.kind];
      if (verb) return task(verb + ' ' + it.name.toLowerCase(), detail, src.kind, src.id);
      if (src) return step('Get ' + it.name.toLowerCase(), detail, 'route', item);
      return step('Find ' + it.name.toLowerCase(), detail, 'go', 'character');
    }
    if (need.coins && S().coins < need.coins) return step('Raise the project funds', fmt(S().coins) + ' / ' + fmt(need.coins) + ' coins still needed. Sell spare resources or claim quest rewards.', 'go', 'character');
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
  if (S().towns.willowbrook.boss) return DQ.regionNext();
  if (S().town !== 'willowbrook') return step('Return to Willowbrook', 'Grubnash awaits outside the village.', 'journeytravel', 'willowbrook');
  const first = D.QM.first_steps, firstState = DQ.questState(first);
  if (firstState === 'new') return step('Meet Elder Wren', 'Goblins have broken Willowbrook’s well. Elder Wren’s first job for you: a little food and a little timber.', 'qstart', first.id);
  if (firstState === 'ready') return step('Claim First Steps', 'Collect your XP and coins from Elder Wren. Her broken well is waiting on timber, and Grubnash on you.', 'qclaim', first.id);
  if (firstState === 'active') {
    const p = S().q[first.id], index = first.obj.findIndex((o, i) => DQ.objProg(first, p, i) < o.n);
    if (index >= 0) return index === 0 ? task('Catch five shrimp', 'Food first: shrimp keep you on your feet when the goblins come. Five, plus five logs for Elder Wren’s broken well, completes First Steps.', 'fish', 'shrimp') : task('Chop five logs', 'Elder Wren needs timber to mend the well’s winch. Five logs finishes First Steps.', 'wood', 'normal');
  }
  if (bossQuest && DQ.questState(bossQuest) === 'new') return step('Accept the Grubnash quest', 'Make your boss victory count toward the village quest and its rewards.', 'qstart', bossQuest.id);
  if (!DQ.skillUnlocked('cooking')) return (S().stats.catch || 0) < 5 ? task('Learn Cooking', 'Food keeps you standing in a fight. Catch five fish and chop five logs for a cooking fire.', 'fish', 'shrimp') : task('Learn Cooking', 'Chop five logs for a cooking fire, then cook your catch.', 'wood', 'normal');
  const food = DQ.foods().reduce((n, id) => n + DQ.have(id) * D.ITEMS[id].heal, 0), req = D.MON.grubnash.boss.req;
  /* never send a beginner to fight with nothing to eat: chickens peck back, and a knock-out ends the session's training */
  if (DQ.combatLvl() < req && food < DQ.maxHp()) return DQ.have('raw_shrimp') >= 12 || (DQ.act && DQ.act.kind === 'recipe' && DQ.have('raw_shrimp') > 0)
    ? task('Cook food for training', `Chickens peck back. You have ${fmt(DQ.have('raw_shrimp'))} raw shrimp; cooked, they keep you on your feet so fights are not cut short.`, 'recipe', 'cook_shrimp')
    : task('Catch shrimp to cook', 'Chickens peck back. Catch about a dozen shrimp, cook them, then train: with food in your pack the fights keep going while you are away.', 'fish', 'shrimp');
  /* an idle beginner keeps the starting focus (Strength) forever; point at the skill that is falling behind */
  if (DQ.combatLvl() < req && DQ.weaponStyle() === 'melee') {
    const sk = ['attack', 'strength', 'defence'].map(k => [k, DQ.lvl(k)]).sort((a, b) => a[1] - b[1]), [low, lv] = sk[0], top = sk[2][1];
    const want = { attack: 'accurate', strength: 'aggressive', defence: 'defensive' }[low];
    if (top - lv >= 3 && S().style.melee !== want) return step(`Train ${D.SK[low].name} for Grubnash`, `Combat ${DQ.combatLvl()} / ${req}. Your ${D.SK[low].name} (${lv}) is falling behind your ${D.SK[sk[2][0]].name} (${top}): ${low === 'attack' ? 'you miss more often' : low === 'defence' ? 'you take more damage' : 'your hits stay small'}. This switches your training focus and fights chickens.`, 'journeytrain', want, 'chicken');
  }
  if (DQ.combatLvl() < req) return task('Train for Grubnash', 'Combat ' + DQ.combatLvl() + ' / ' + req + '. Train Attack, Strength and Defence using the combat training focus.' + (food < DQ.maxHp() ? ' Cook a little food on the way.' : ''), 'fight', 'chicken');
  /* Ready by level: let the battle forecast decide what, if anything, is missing. */
  const f = DQ.bossForecast ? DQ.bossForecast('grubnash') : null;
  if (f && f.winRate >= .75) return task('Challenge Grubnash', `The battle forecast wins ${Math.round(f.winRate * 100)}% of fights with your current gear and food.`, 'fight', 'grubnash');
  /* the most useful concrete step from the real save: rest, armour you own or can afford, his weakness, food */
  const prep = DQ.prepAdvice ? DQ.prepAdvice('grubnash', f).filter(x => x.key !== 'food' && x.key !== 'level') : [];
  if (prep.length && (prep[0].afford !== false)) return step(prep[0].title, `${f ? `Forecast: ${Math.round(f.winRate * 100)}% wins (an estimate). ` : ''}${prep[0].text}`, prep[0].action || 'go', prep[0].a || 'combat');
  const needFood = f && f.foodPerKill != null ? Math.ceil(f.foodPerKill * 1.5) : DQ.maxHp() * 2;
  if (food < needFood) {
    const msg = `${f ? `Forecast: ${Math.round(f.winRate * 100)}% wins. ` : ''}Food restores ${fmt(food)} health; about ${fmt(needFood)} would carry you through.`;
    if (!DQ.have('raw_shrimp')) return task('Gather food for the fight', msg, 'fish', 'shrimp');
    return task('Cook your provisions', msg, 'recipe', 'cook_shrimp');
  }
  return task('Grow a little stronger', `${f ? `Forecast: ${Math.round(f.winRate * 100)}% wins. ` : ''}Food is fine; a few more combat levels or better gear will tip the odds. Check the forecast on the Combat page.`, 'fight', 'chicken');
};
/* After Grubnash the boss destination follows the next region boss: travel, its quest, training, then the most useful
   preparation from the real save (DQ.prepAdvice) until the forecast favours you. */
DQ.regionBoss = () => { for (const t of D.TOWNS) { const b = D.MON[t.boss]; if (b && !(S().towns[t.id] && S().towns[t.id].boss)) return b; } return null; };
DQ.regionNext = () => {
  const b = DQ.regionBoss(); if (!b) return step('The realm is at peace', 'Every boss is defeated. Chase a collection, a title or a trophy, or restore what is left.', 'go', 'bestiary');
  const town = D.TOWN[b.town], short = b.boss.short || b.name, bq = D.QUESTS.find(q => q.obj.some(o => o.ev === 'boss' && o.key === b.id));
  if (S().town !== b.town) return step(`Travel to ${town.name}`, `${short} is the next challenge on the road.`, 'journeytravel', b.town);
  if (bq && DQ.questState(bq) === 'ready') return step('Claim your victory reward', `${bq.giver} is waiting to thank you.`, 'qclaim', bq.id);
  if (bq && DQ.questState(bq) === 'new') return step(`Accept “${bq.name}”`, `${bq.giver} asks you to face ${short}. Accepting makes the victory count.`, 'qstart', bq.id);
  const req = b.boss.req;
  if (DQ.combatLvl() < req) { const fs = DQ.foodStep && DQ.foodStep(`Training here hits back harder than chickens.`); if (fs) return fs; }
  if (DQ.combatLvl() < req) { const foe = D.MONLIST.filter(m => m.town === b.town && !m.boss && !m.mini && m.cl <= DQ.combatLvl() + 2).sort((a, c) => c.cl - a.cl)[0] || D.MONLIST.find(m => m.town === b.town && !m.boss);
    return task(`Train for ${short}`, `Combat ${DQ.combatLvl()} / ${req}. ${foe ? `${foe.name}s are a fair fight here.` : ''}`, 'fight', foe ? foe.id : b.id); }
  const f = DQ.bossForecast ? DQ.bossForecast(b.id) : null;
  if (f && f.winRate >= .75) return task(`Challenge ${short}`, `The battle forecast wins ${Math.round(f.winRate * 100)}% of fights with your current preparation.`, 'fight', b.id);
  const tip = DQ.prepAdvice ? DQ.prepAdvice(b.id, f)[0] : null;
  return tip ? step(tip.title, `${f ? `Forecast: ${Math.round(f.winRate * 100)}% wins (an estimate). ` : ''}${tip.text}`, tip.action || 'go', tip.a || 'combat') : step(`Challenge ${short}`, 'You are ready by level. Check the forecast on the Combat page.', 'go', 'combat');
};
/* Optional goals beside the one primary action: something short, something over a few sessions, a long pursuit */
DQ.optionalGoals = () => {
  const out = [], town = S().town;
  const q = D.QUESTS.find(x => x.town === town && !x.secret && ['active', 'ready'].includes(DQ.questState(x)) && !x.obj.some(o => o.ev === 'boss')) || D.QUESTS.find(x => x.adventure && DQ.questState(x) === 'active');
  if (q) out.push({ span: 'Short', text: `Finish “${q.name}” for ${q.giver}`, action: 'go', a: 'quests' });
  else if (DQ.loadouts && !DQ.loadouts().length && DQ.advLvl() >= 15) out.push({ span: 'Short', text: 'Save your current gear as a preparation, then try another', action: 'go', a: 'character' });
  const proj = DQ.projectsForTown(town).filter(([id]) => !S().projects[id]).sort((a, c) => (a[1].cost.coins || 0) - (c[1].cost.coins || 0))[0];
  if (proj) out.push({ span: 'A few sessions', text: `${proj[1].name}: ${proj[1].reward}`, action: 'openproject', a: proj[0] });
  const chase = D.MONLIST.find(m => m.town === town && !m.boss && (S().beast.kills[m.id] || 0) > 0 && m.drops.some(d => D.ITEMS[d[0]] && D.ITEMS[d[0]].unique && !(S().uniqFound || {})[d[0]]));
  if (chase && DQ.uniqueSource) { const id = chase.drops.find(d => D.ITEMS[d[0]] && D.ITEMS[d[0]].unique)[0], src = DQ.uniqueSource(id); out.push({ span: 'Long', text: `${D.ITEMS[id].name} from ${chase.name}s: ${src.need - Math.min(src.have, src.need)} more defeats at most`, action: 'guide', a: chase.id }); }
  else if (DQ.understanding) { const mons = D.MONLIST.filter(m => m.town === town), u = mons.filter(m => DQ.understanding(m).done).length; if (u < mons.length && mons.some(m => S().beast.kills[m.id])) out.push({ span: 'Long', text: `${D.TOWN[town].name} field guide: ${u} / ${mons.length} creatures understood`, action: 'go', a: 'bestiary' }); }
  return out.slice(0, 3);
};
DQ.finishProject = id => {
  const project = D.PROJECTS[id];
  if (!project || S().projects[id] || S().town !== project.town || !DQ.canAfford(DQ.projectNeed(id))) return false;
  DQ.projectGive(id); return !!S().projects[id];
};
function completeProject(id) {
  const project = D.PROJECTS[id];
  S().projects[id] = true; if (S().projectGiven) delete S().projectGiven[id]; DQ.fxDirty();
  DQ.log(project.story, 'good');
  const voice = D.PROJECT_VOICES[id];
  DQ.notify({ kind: 'quest', page: 'projects', key: 'project:' + id, title: project.name, text: project.story + ' ' + project.reward + (voice ? ` ${voice[0]}: “${voice[1]}”` : ''), icon: 'house', sound: 'restore' });
  DQ.emit('project', id);
  DQ.save(); return true;
}
const actionHtml = next => `<button class="btn primary" data-do="${next.action}" data-a="${next.a || ''}" data-b="${next.b || ''}">${esc(next.title)}</button>`;
const pinButton = id => `<button class="btn sm" data-do="pinproject" data-a="${id}" aria-pressed="${S().pinnedProject === id}">${ico('pin')}${S().pinnedProject === id ? 'Unpin project' : 'Pin project'}</button>`;
UI.projectPinHtml = () => {
  const id = S().pinnedProject, project = D.PROJECTS[id];
  if (!project || (UI.view === 'projects' && project.town === S().town && (UI.tab.projectChoice || DQ.projectsForTown(S().town)[0]?.[0]) === id) || (UI.view === 'overview' && S().journey === id)) return '';
  const done = S().projects[id];
  return `<div class="project-pin" role="group" aria-label="Pinned village project"><button class="project-pin-open" data-do="openproject" data-a="${id}">${ico('pin')}<span><b>${esc(project.name)}</b><small>${done ? '✓ Restored · benefit active' : Object.keys(project.cost).map(item=>`<span data-b="projectneed:${id}:${item}"></span>`).join(' · ')}</small></span></button><button class="btn sm project-pin-next" data-do="projectnext" data-a="${id}" data-b="projectaction:${id}"></button><button class="iconb sm" data-do="pinproject" data-a="${id}" aria-label="Unpin village project">${ico('close')}</button></div>`;
};
UI.B.projectneed = (el, id, item) => {
  const required = D.PROJECTS[id].cost[item], got = given(id)[item] || 0, held = got + (item === 'coins' ? S().coins : DQ.have(item));
  const label = item === 'coins' ? 'coins' : item === 'log_normal' ? 'logs' : item === 'shrimp' ? 'shrimp' : D.ITEMS[item].name.toLowerCase();
  UI.set(el, `${Math.min(held, required)}/${required} ${label}`); el.classList.toggle('ok', held >= required);
};
UI.B.projectaction = (el, id) => UI.set(el, S().projects[id] ? 'View village' : DQ.journeyNext(id).title);
/* How you will know the next step is done, and when it is a good moment to stop: shown under the one action that leads Home */
DQ.journeyDoneWhen = next => {
  const q = D.QM.first_steps, st = S().q[q.id];
  if (st && st.s === 'active') return `Done when you have ${q.obj.map((o, i) => `${Math.min(DQ.objProg(q, st, i), o.n)}/${o.n} ${o.label.replace(/^(Catch|Chop) \d+ /, '')}`).join(' and ')}. Then claim it from ${q.giver}.`;
  if (st === undefined || (st && st.s === 'new') || DQ.questState(q) === 'new') if (next.action === 'qstart' && next.a === q.id) return `First Steps asks for ${q.obj.map(o => o.label.replace(/^(Catch|Chop) /, '').toLowerCase()).join(' and ')}.`;
  if (next.action === 'qclaim') return 'Done when you claim the reward.';
  const req = D.MON.grubnash.boss.req;
  if (/^Train for Grubnash/.test(next.title) && DQ.combatLvl() < req) return `Done when your combat level reaches ${req} (now ${DQ.combatLvl()}).`;
  const rb = DQ.regionBoss && S().towns.willowbrook.boss && DQ.regionBoss();
  if (rb && /^Train for /.test(next.title) && DQ.combatLvl() < rb.boss.req) return `Done when your combat level reaches ${rb.boss.req} (now ${DQ.combatLvl()}).`;
  return '';
};
/* the boss destination names the boss you are actually heading for */
/* The chosen boss goal is fixed when you choose it (S().journeyTarget), so defeating that boss completes the goal
   instead of silently moving it on. Older saves adopt the next undefeated boss the first time this is read. */
DQ.goalTarget = () => { const st = S(); if (!st.journeyTarget || !D.MON[st.journeyTarget]) { const b = DQ.regionBoss && DQ.regionBoss(); st.journeyTarget = b ? b.id : 'grubnash'; } return D.MON[st.journeyTarget]; };
const bossDown = m => !!(m && S().towns[m.town] && S().towns[m.town].boss);
DQ.goalDone = (id = S().journey || 'boss') => id === 'boss' ? bossDown(DQ.goalTarget()) : id === 'house' ? !!(S().house && S().house.owned) : id === 'village' ? !nextVillageProject() : D.PROJECTS[id] ? !!S().projects[id] : false;
const destLabel = id => { if (id === 'boss') { const b = (S().journey || 'boss') === 'boss' ? DQ.goalTarget() : DQ.regionBoss(); return b ? `Defeat ${b.boss.short || b.name}` : 'Every boss defeated'; } return destinations[id] || destinations.boss; };
const fresh = () => DQ.advLvl() < 5 && !(S().towns.willowbrook && S().towns.willowbrook.boss);
UI.journeyPanel = () => {
  const goal = S().journey || 'boss', label = destLabel(goal);
  if (DQ.goalDone(goal)) {
    /* the chosen goal is finished: say so, offer the natural next goal and a way to choose another */
    const t = goal === 'boss' ? DQ.goalTarget() : null, nextTown = t && D.TOWNS[D.TOWN[t.town].idx + 1], bq = t && D.QUESTS.find(q => q.obj.some(o => o.ev === 'boss' && o.key === t.id)), claim = bq && DQ.questState(bq) === 'ready';
    const nb = DQ.regionBoss(), detail = goal === 'boss' ? `${t.name} is defeated.${nextTown ? ` ${nextTown.name} is now open.` : ''}` : goal === 'house' ? 'Your cottage is yours. Rooms and furniture add lasting bonuses.' : goal === 'village' ? 'Every Willowbrook project is complete. Their benefits are permanent.' : `${D.PROJECTS[goal].name} is complete. ${D.PROJECTS[goal].reward}`;
    const primary = claim ? `<button class="btn primary" data-do="qclaim" data-a="${bq.id}">Claim ${esc(bq.giver)}’s reward</button>` : goal === 'boss' && nb ? `<button class="btn primary" data-do="destination" data-a="boss">Next goal: defeat ${esc(nb.boss.short || nb.name)}</button>` : '';
    return `<section class="panel journey goal-done"><div class="phead"><div><span class="k">Goal complete</span><h2>${ico('check')} ${esc(label)}</h2></div></div>
      <p class="journey-why">${esc(detail)}</p>
      <div class="btnrow wrap">${primary}${nextTown && !claim && S().town !== nextTown.id ? `<button class="btn" data-do="journeytravel" data-a="${nextTown.id}">Travel to ${esc(nextTown.name)}</button>` : ''}<button class="btn" data-do="choosegoal">Choose another goal</button></div>
      ${(g => g.length ? `<div class="also-goals"><span class="k">Also worth doing</span><ul>${g.map(x => `<li><small>${esc(x.span)}</small><button class="linkish" data-do="${x.action}" data-a="${x.a}">${esc(x.text)}</button></li>`).join('')}</ul></div>` : '')(DQ.optionalGoals ? DQ.optionalGoals() : [])}</section>`;
  }
  const next = DQ.journeyNext(), done = DQ.journeyDoneWhen(next), firstTime = !S().seen.firstTask && DQ.totalXp() === 0;
  return `<section class="panel journey"><div class="phead"><div><span class="k">Next step</span><h2>${esc(next.title)}</h2></div></div>
    <p class="journey-why">${esc(next.detail)}</p>${done ? `<p class="journey-done">${ico('check')} ${esc(done)}</p>` : ''}
    <div class="btnrow wrap">${(() => { const running = next.action === 'journeytask' && DQ.act && DQ.act.kind === next.a && DQ.act.id === next.b; return next.action === 'journeytask' ? `<button class="btn primary" data-do="journeytask" data-a="${next.a}" data-b="${next.b || ''}">${running ? 'Open the task' : 'Start'}</button>` : actionHtml(next); })()}${D.PROJECTS[S().journey] ? pinButton(S().journey) : ''}</div>
    ${fresh() ? `<p class="journey-pause">${firstTime ? 'Pick one task at a time. It keeps working while you explore other pages or close the game, so any moment is a fine place to stop.' : 'A good place to pause: whenever a quest is claimed. Your task keeps working while you are away.'}</p>` : ''}
    ${fresh() ? '' : (g => g.length ? `<div class="also-goals"><span class="k">Also worth doing</span><ul>${g.map(x => `<li><small>${esc(x.span)}</small><button class="linkish" data-do="${x.action}" data-a="${x.a}">${esc(x.text)}</button></li>`).join('')}</ul></div>` : '')(DQ.optionalGoals())}
    <div class="destination-line"><span class="k">Your goal: ${esc(label)}</span><button class="btn sm" data-do="choosegoal">Change goal</button></div></section>`;
};
UI.DO.choosegoal = () => DQ.modal({ title: 'Choose a goal', body: `<p class="sm dim">Home keeps pointing you at one goal until it is done. Changing it never loses progress.</p><div class="goal-choices">${Object.keys(destinations).map(id => `<button class="goal-choice ${S().journey === id ? 'on' : ''}" aria-pressed="${S().journey === id}" data-do="destination" data-a="${id}"><b>${esc(id === 'boss' ? (b => b ? `Defeat ${b.boss.short || b.name}` : 'Every boss defeated')(DQ.regionBoss()) : destinations[id])}</b><small>${DQ.goalDone(id) && id !== 'boss' ? 'Complete' : esc(DQ.journeyNext(id).title)}</small></button>`).join('')}</div>`, actions: [{ label: 'Close' }] });
UI.projectsPanel = () => {
  /* The village is the menu (Nov 2026): every restoration site in the town scene is a spot you can click. The card
     beside it tells that place's small story, how far the work has got and what it still needs, with a Deliver
     button for each material. */
  const town = S().town, entries = DQ.projectsForTown(town);
  const id = entries.some(([key]) => key === UI.tab.projectChoice) ? UI.tab.projectChoice : (entries.find(([k]) => !S().projects[k]) || entries[0])[0], project = D.PROJECTS[id];
  UI.tab.projectChoice = id;
  const done = S().projects[id], need = DQ.projectNeed(id), canFinish = !done && S().town === project.town && Object.keys(need).length && DQ.canAfford(need);
  const changes = (town==='willowbrook'?['first_steps', 'hungry_cook']:[]).filter(q => S().q[q] && S().q[q].s === 'done');
  const stage = DQ.projectStage(id), pct = Math.round(DQ.projectProgress(id) * 100), g = (S().projectGiven || {})[id] || {};
  const canGive = !done && Object.keys(need).some(k => held(k) > 0), voice = D.PROJECT_VOICES[id];
  const A = DQ.pixelArt, W = (A && A.SCENE_W) || 320, H = (A && A.SCENE_H) || 180, shown = new Set(entries.map(([k]) => k));
  const spots = A && A.siteLayout ? A.siteLayout(town).filter(sp => shown.has(sp.id)).map(sp => { const st = DQ.projectStage(sp.id), p = D.PROJECTS[sp.id];
    return `<button class="site-spot st${st} ${sp.id === id ? 'on' : ''}" style="left:${(sp.X / W * 100).toFixed(3)}%;top:${(sp.Y / H * 100).toFixed(3)}%;width:${(32 / W * 100).toFixed(3)}%;height:${(34 / H * 100).toFixed(3)}%" data-do="projectpick" data-a="${sp.id}" aria-pressed="${sp.id === id}" aria-label="${esc(p.name)}: ${esc(DQ.PROJECT_STAGES[st])}" data-tip="text:${esc(p.name)} · ${esc(DQ.PROJECT_STAGES[st])}"><span class="site-mark">${st >= 4 ? '✓' : st ? Math.round(DQ.projectProgress(sp.id) * 100) + '%' : '!'}</span></button>`; }).join('') : '';
  const story = done ? `<p class="proj-story">${esc(project.story)}</p>${voice ? `<p class="villager-line"><b>${esc(voice[0])}:</b> “${esc(voice[1])}”</p>` : ''}`
    : `<p class="proj-story">${esc(project.before || (stage ? `Work is under way. ${voice ? voice[0] + ' comes by most days to see how it is going.' : ''}` : `It has stood like this for years.${voice ? ` ${voice[0]} is hoping someone will take it on.` : ''}`))} Once it is done: ${esc(project.story.charAt(0).toLowerCase() + project.story.slice(1))}</p>`;
  const lines = done ? '' : `<div class="proj-lines">${Object.entries(project.cost).map(([item, n]) => { const got = Math.min(n, g[item] || 0), left = n - got, have = held(item), name = item === 'coins' ? 'coins' : D.ITEMS[item].name.toLowerCase();
    return `<div class="proj-line ${left ? '' : 'ok'}"><span class="proj-ic">${item === 'coins' ? ico('coin') : DQ.itemIco(D.ITEMS[item])}</span><span class="proj-t"><b>${fmt(got)} / ${fmt(n)} ${esc(name)}</b><small>${left ? `${fmt(have)} held` : '✓ Delivered'}</small><span class="bar"><i style="width:${Math.round(got / n * 100)}%"></i></span></span>${left ? (have > 0 ? `<button class="btn sm" data-do="projectgive" data-a="${id}|${item}">Deliver ${fmt(Math.min(left, Math.floor(have)))}</button>` : (item !== 'coins' && UI.routeChip ? UI.routeChip(item) : '')) : ''}</div>`; }).join('')}</div>`;
  const restored = entries.filter(([k]) => S().projects[k]).length;
  return `<div class="village-projects"><section class="panel town-projects village-map"><div class="phead"><h2>A living ${esc(D.TOWN[town].name)}</h2><small>${restored} of ${entries.length} restored · click a building</small></div>
      <div class="village-scene">${UI.scene(town)}${spots}</div>
      ${changes.length ? `<div class="village-changes">${changes.map(q=>`<p class="village-change">✓ ${esc(D.QM[q].name)} · ${esc(DQ.questImpact(q))}</p>`).join('')}</div>` : ''}</section>
    <section class="panel project-card ${done ? 'done' : ''}"><div class="phead"><div><small>${esc(D.TOWN[town].name)} · restoration</small><h2>${esc(project.name)}</h2></div>${pinButton(id)}</div>
      ${story}<p class="proj-benefit"><span class="k">${done ? 'Benefit, active' : 'Benefit'}</span> ${esc(project.reward)}</p>
      ${done ? '<p class="ok">Restored</p>' : `<div class="proj-stage"><span class="k">${esc(DQ.PROJECT_STAGES[stage])}</span><span class="bar"><i style="width:${pct}%"></i></span><small>${pct}%</small></div>${lines}<div class="btnrow">${canFinish ? `<button class="btn primary" data-do="projectfinish" data-a="${id}">Complete project</button>` : canGive ? `<button class="btn primary" data-do="projectgive" data-a="${id}">Deliver all I can</button><button class="btn" data-do="projectnext" data-a="${id}">What next?</button>` : `<button class="btn primary" data-do="projectnext" data-a="${id}">Work on this project</button>`}</div>`}
    </section></div>`;
};

UI.homeSections.unshift(UI.journeyPanel); /* the one primary objective leads Home */
UI.V.projects = () => UI.projectsPanel();
DQ.destLabel = id => destLabel(id);
UI.returnPlan = sum => {
  const next = DQ.journeyNext();
  const status = sum.died ? 'Your hero was defeated. Replenish food and review equipment before resuming combat.' : sum.stopped ? 'Your task finished or stopped. Check the next step before starting another.' : DQ.act ? DQ.actLabel() + ' is still running.' : 'No task is running.';
  return `<section class="return-plan"><h3>${esc(destLabel(S().journey))}</h3><p>${esc(status)}</p><p>${esc(next.detail)}</p>${actionHtml(next)}</section>${UI.returnChoices()}`;
};
/* Other good options after an absence, read from the real save. Each says what it costs, so a choice is a real
   trade-off; nothing is shown as affordable unless it is, and nothing here is timed or expires. */
DQ.returnChoices = () => {
  const out = [];
  const projects = DQ.projectsForTown(S().town).filter(([id]) => !S().projects[id]);
  const ready = projects.find(([pid]) => DQ.canAfford(DQ.projectNeed(pid)));
  if (ready) { const [id, p] = ready; out.push({ title: `Restore ${p.name.toLowerCase()}`, text: `You hold everything it needs${p.cost.coins ? `, including ${fmt(p.cost.coins)} coins you could otherwise put towards gear` : ''}. ${p.reward}`, action: 'openproject', a: id, art: 'project:' + id }); }
  else if (projects.length) {
    const short = ([pid]) => Object.entries(DQ.projectNeed(pid)).reduce((n, [k, q]) => n + Math.max(0, q - (k === 'coins' ? S().coins : DQ.have(k))) * (k === 'coins' ? 1 : (D.ITEMS[k]?.val || 1)), 0);
    const [id, p] = projects.slice().sort((a, b) => short(a) - short(b))[0];
    const miss = Object.entries(DQ.projectNeed(id)).map(([k, q]) => [k, q - (k === 'coins' ? S().coins : DQ.have(k))]).filter(([, n]) => n > 0).map(([k, n]) => k === 'coins' ? `${fmt(n)} coins` : `${fmt(n)} ${D.ITEMS[k].name.toLowerCase()}`);
    out.push({ title: `Closest restoration: ${p.name.toLowerCase()}`, text: `Still needed: ${miss.join(', ')}.`, action: 'openproject', a: id, art: 'project:' + id });
  }
  const near = D.SKILLS.filter(sk => DQ.skillUnlocked(sk.id) && D.UNL[sk.id]).map(sk => { const L = DQ.lvl(sk.id), nextLvl = Object.keys(D.UNL[sk.id]).map(Number).find(l => l > L); return nextLvl === L + 1 ? { sk, nextLvl, pct: DQ.pctNext(sk.id), what: D.UNL[sk.id][nextLvl] } : null; }).filter(Boolean).sort((a, b) => b.pct - a.pct)[0];
  if (near && near.pct >= 50) out.push({ title: `${near.sk.name} ${near.nextLvl} is close`, text: `${Math.round(near.pct)}% of the way there; it unlocks ${[].concat(near.what).join(', ').toLowerCase()}.`, action: 'go', a: near.sk.page, art: 'skill:' + near.sk.id });
  return out;
};
UI.returnChoices = () => { const L = DQ.returnChoices(); return L.length ? `<div class="k" style="margin:14px 0 6px">Other good options</div><div class="return-choices">${L.map(x => `<div><b>${esc(x.title)}</b><small>${esc(x.text)}</small><button class="btn sm" data-do="returnpick" data-a="${x.action}" data-b="${x.a}">Open</button></div>`).join('')}</div>` : ''; };
UI.DO.returnpick = (action, a) => { DQ.closeModal(); if (UI.DO[action]) UI.DO[action](a); };
Object.assign(UI.DO, {
  pinproject: id => { if (DQ.pinProject(id)) UI.render(false); },
  openproject: id => { const p=D.PROJECTS[id];if(!p)return;if(p.town!==S().town){const next=DQ.journeyNext(id);return UI.DO[next.action](next.a,next.b);} UI.tab.projectChoice = id; if (UI.view === 'projects') UI.render(false); else DQ.go('projects'); },
  projectnext: id => {
    if (!D.PROJECTS[id]) return;
    if (S().projects[id]) return UI.DO.openproject(id);
    const next = DQ.journeyNext(id); UI.DO[next.action](next.a, next.b);
  },
  destination: id => { if (!destinations[id]) return; S().journey = id; if (id === 'boss') { const b = DQ.regionBoss(); S().journeyTarget = b ? b.id : S().journeyTarget; } DQ.closeModal && DQ.closeModal(); DQ.save(); if (UI.view === 'overview') UI.render(false); else DQ.go('overview'); },
  journeytrain: (focus, mon) => { DQ.closeModal(); S().style.melee = focus; if (!(DQ.act && DQ.act.kind === 'fight')) DQ.startAct('fight', mon, { quiet: true }); DQ.go('combat'); DQ.toast(`Training focus: ${DQ.cap(focus)}`); },
  journeytask: (kind, id) => { DQ.closeModal(); if (DQ.startAct(kind, id, { quiet: true })) DQ.go(DQ.actPage()); else { const page = { fish: 'fishing', wood: 'woodcutting', mine: 'mining', thieve: 'thieving', fight: 'combat' }[kind] || (kind === 'recipe' && D.RECIPES[id] ? D.SK[D.RECIPES[id].skill].page : null); if (page) { if (UI.taskChoice) UI.taskChoice[page] = id; DQ.go(page); } } },
  journeytravel: id => { DQ.closeModal(); DQ.travel(id); DQ.go('overview'); },
  projectfinish: id => { if (DQ.finishProject(id)) UI.render(false); },
  projectpick: id => { if (!D.PROJECTS[id]) return; UI.tab.projectChoice = id; UI.render(false); },
  projectgive: arg => { const [id, item] = String(arg).split('|'); if (DQ.projectGive(id, item || null)) UI.render(false); },
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

/* Food before training anywhere: when your food heals less than your own health, catch (about a dozen) and cook the best
   fish you can make here. Returns null when the pack is fine or nothing can be cooked yet. */
DQ.foodStep = why => {
  const food = DQ.foods().reduce((n, f) => n + DQ.have(f) * D.ITEMS[f].heal, 0); if (food >= DQ.maxHp() || !DQ.skillUnlocked('cooking')) return null;
  const options = Object.values(D.RECIPES).filter(r => r.skill === 'cooking' && r.lvl <= DQ.lvl('cooking') && Object.keys(r.in || {}).length === 1).map(r => {
    const raw = Object.keys(r.in)[0], out = Object.keys(r.out)[0], node = (D.NODES.fish || []).find(n => n.item === raw && n.lvl <= DQ.lvl('fishing') && DQ.nodeHere(n));
    return node && D.ITEMS[out] && D.ITEMS[out].heal ? { r, raw, out, node, heal: D.ITEMS[out].heal } : null; }).filter(Boolean).sort((a, b) => b.heal - a.heal);
  const o = options[0]; if (!o) return null; const name = D.ITEMS[o.out].name.toLowerCase(), have = DQ.have(o.raw);
  if (have >= 12 || (DQ.act && DQ.act.kind === 'recipe' && have > 0)) return task(`Cook ${name} for the road`, `${why} You have ${fmt(have)} to cook; food in your pack keeps fights going while you are away.`, 'recipe', o.r.id);
  return task(`Catch fish to cook`, `${why} Catch about a dozen ${D.ITEMS[o.raw].name.toLowerCase()}, cook them, then train.`, 'fish', o.node.id);
};

/* One cached forecast per meaningful change (combat level, gear, food, town), so Home stays fast. */
const fcCache = { key: '', at: 0, res: null };
DQ.bossForecast = id => {
  const m = D.MON[id]; if (!m || m.town !== S().town || DQ.forecasting || !DQ.forecast) return null;
  const food = DQ.foods().reduce((n, f) => n + DQ.have(f) * D.ITEMS[f].heal, 0);
  /* food in steps of half your health (a beginner's whole pack is 6–15 health), current health in quarters, abilities and focus */
  const max = DQ.maxHp(), key = JSON.stringify([id, DQ.combatLvl(), S().equip, Math.min(12, Math.floor(food / Math.max(3, max / 2))), Math.round(S().hp / max * 4), max, S().town, S().abilities, S().style]);
  if (fcCache.key === key && fcCache.res) return fcCache.res;
  if (fcCache.key !== key && Date.now() - fcCache.at < 1500 && fcCache.res) return fcCache.res;
  fcCache.key = key; fcCache.at = Date.now();
  try { fcCache.res = DQ.forecast(id); } catch (e) { fcCache.res = null; }
  return fcCache.res;
};
})();
