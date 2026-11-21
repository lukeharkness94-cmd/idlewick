/* Idlewick: who you fight and what you hunt (21 Nov 2026, owner brief).
   "Combat creatures should be real dangerous creatures you'd face. Hunting creatures should be more plain initially and
   drop things you'd use for crafting, then get more mythical."
   Combat areas hold only hostile things: goblins, poachers, drowned sailors, kobolds, hags, cultists, harpies, wights.
   Early towns reuse a family in several forms (goblin, slinger, hexer, raider, brute) so there are many distinct fights
   while the world is still small; later towns branch out. Each town also gets one hunting ground (area.hunt) of animals:
   chickens, rabbits, sheep and cows at home, then deer and boar, seals and gulls, goats and yaks, and finally griffins,
   star stags and an eclipse roc. Animals drop crafting and cooking materials (feathers, eggs, wool, hides, raw game) and
   carry no weapons or coin pouches; villains keep their town's loot table.
   Every animal has a Hunting level (m.hl): hunting.js picks only animals you can track, and an active quest's target
   is always reachable, so no quest is blocked. Existing creatures keep their ids, kills, field-guide pages and pets.
   Data only; sprites are in pixel_roster.js, lore and area wiring in villains.js. */
(() => {
const D = window.DQ.data;
/* ---------- one new pair of items: raw game, and roast game for Cooking ---------- */
D.ITEMS.raw_game = { id: 'raw_game', name: 'Raw game', ic: 'food', col: '#b5574a', val: 3, type: 'raw', buy: 6 };
D.ITEMS.roast_game = { id: 'roast_game', name: 'Roast game', ic: 'food', col: '#a8683a', val: 9, type: 'food', heal: 5, buy: 16 };
const roast = { id: 'cook_roast_game', skill: 'cooking', tab: 'Cook', name: 'Roast game', lvl: 5, xp: 35, t: 2000, in: { raw_game: 1 }, out: { roast_game: 1 }, ev: 'cook', burn: true };
D.RECIPES[roast.id] = roast; if (D.RLIST && D.RLIST.cooking) D.RLIST.cooking.push(roast);
if (D.UNL) (D.UNL.cooking = D.UNL.cooking || {})[5] = [...(D.UNL.cooking[5] || []), 'Roast game'];

/* ---------- stats by level, from the regional creatures already in the game ---------- */
const AN = [[1, 3, 1, 1, 1, 0, 3], [2, 4, 1, 2, 2, 0, 3], [9, 12, 2, 7, 6, 4, 12], [19, 26, 5, 18, 14, 8, 28], [30, 46, 8, 28, 27, 35, 100], [49, 72, 12, 48, 41, 75, 210], [69, 128, 19, 72, 63, 155, 340], [88, 230, 31, 90, 86, 320, 690], [106, 390, 39, 108, 104, 720, 1520], [119, 470, 45, 119, 116, 1300, 2450]];
const at = cl => { let i = AN.findIndex(r => r[0] >= cl); if (i < 0) i = AN.length - 1; if (i === 0) return AN[0].slice(1); const a = AN[i - 1], b = AN[i], f = (cl - a[0]) / (b[0] - a[0]); return a.slice(1).map((v, k) => v + (b[k + 1] - v) * f); };
/* hunting level: a little under the animal's combat level, capped at 99 */
D.huntLvl = cl => Math.max(1, Math.min(99, Math.round(cl * .82)));

/* [id, name, town, level, colour, body (battle rig and counters), role c = combat | h = hunt, own drops] */
const R = [
  /* Willowbrook: a goblin family, then the farm */
  ['goblin_slinger', 'Goblin slinger', 'willowbrook', 4, '#86b062', 'humanoid', 'c', [['feather', [1, 3], .2], ['arrow_bronze', [3, 8], .12]]],
  ['thicket_spider', 'Thicket spider', 'willowbrook', 6, '#56604a', 'clawed', 'c', [['string', [1, 2], .3]]],
  ['goblin_hexer', 'Goblin hexer', 'willowbrook', 7, '#7aa65a', 'humanoid', 'c', [['rune', [2, 5], .3]]],
  ['goblin_brute', 'Goblin brute', 'willowbrook', 10, '#6f9e4c', 'humanoid', 'c', [['cowhide', [1, 1], .3], ['bread', [1, 2], .1]]],
  ['rabbit', 'Rabbit', 'willowbrook', 2, '#a68a6a', 'beast', 'h', [['raw_game', [1, 1], .7], ['seed_potato', [1, 2], .15]]],
  ['pheasant', 'Pheasant', 'willowbrook', 4, '#b8653a', 'winged', 'h', [['feather', [2, 5], .9], ['raw_game', [1, 1], .5], ['egg', [1, 1], .1]]],
  ['sheep', 'Wild sheep', 'willowbrook', 5, '#efeae0', 'beast', 'h', [['wool', [1, 2], .9], ['raw_game', [1, 1], .4]]],
  /* Mossbarrow: poachers and things from the barrows; deer and boar in the glades */
  ['poacher', 'Poacher', 'mossbarrow', 11, '#55603a', 'humanoid', 'c', [['wolf_pelt', [1, 1], .25], ['feather', [2, 4], .3]]],
  ['mossback_spider', 'Mossback spider', 'mossbarrow', 12, '#5f7a44', 'clawed', 'c', [['string', [1, 3], .35]]],
  ['barrow_ghoul', 'Barrow ghoul', 'mossbarrow', 14, '#8a9a7a', 'spectral', 'c', [['old_bone', [1, 2], .5]]],
  ['grave_robber', 'Grave robber', 'mossbarrow', 15, '#3a3a44', 'humanoid', 'c', [['gem_sapphire', [1, 1], .03]]],
  ['bramble_witch', 'Bramble witch', 'mossbarrow', 18, '#4a5a2a', 'humanoid', 'c', [['rune', [2, 6], .2], ['seed_strawberry', [1, 2], .1]]],
  ['dire_wolf', 'Dire wolf', 'mossbarrow', 19, '#4a4a52', 'beast', 'c', [['wolf_pelt', [1, 1], .8]]],
  ['red_deer', 'Red deer', 'mossbarrow', 14, '#9a5a34', 'beast', 'h', [['raw_game', [1, 2], .8], ['cowhide', [1, 1], .6]]],
  /* Saltmere: wreckers and the drowned; seals and gulls on the rocks */
  ['tide_thief', 'Tide thief', 'saltmere', 13, '#4a6a7a', 'humanoid', 'c', [['raw_trout', [1, 2], .2]]],
  ['drowned_sailor', 'Drowned sailor', 'saltmere', 16, '#6a8a9a', 'humanoid', 'c', [['old_bone', [1, 1], .4]]],
  ['pirate_bosun', 'Pirate bosun', 'saltmere', 24, '#7a3a2a', 'humanoid', 'c', [['gem_emerald', [1, 1], .03]]],
  ['sea_hag', 'Sea hag', 'saltmere', 25, '#5a8a6a', 'spectral', 'c', [['rune', [3, 8], .25]]],
  ['reef_serpent', 'Reef serpent', 'saltmere', 26, '#3a8a8a', 'beast', 'c', [['gem_sapphire', [1, 1], .05]]],
  ['gull', 'Herring gull', 'saltmere', 13, '#e8e8e0', 'winged', 'h', [['feather', [2, 6], .9], ['egg', [1, 1], .2]]],
  ['seal', 'Grey seal', 'saltmere', 17, '#8a9098', 'beast', 'h', [['raw_game', [1, 2], .7], ['cowhide', [1, 1], .5]]],
  /* Ironpeak: kobolds, wights and a yeti; goats, yaks and ice elk on the high pastures */
  ['kobold', 'Kobold miner', 'ironpeak', 33, '#b0643a', 'humanoid', 'c', [['ore_coal', [1, 3], .3]]],
  ['ice_wight', 'Ice wight', 'ironpeak', 40, '#a8c8e0', 'spectral', 'c', [['rune', [4, 10], .3]]],
  ['yeti', 'Yeti', 'ironpeak', 46, '#eef2f4', 'humanoid', 'c', [['frost_pelt', [1, 1], .6]]],
  ['mountain_goat', 'Mountain goat', 'ironpeak', 30, '#d8d0c0', 'beast', 'h', [['raw_game', [1, 2], .7], ['wool', [1, 2], .5], ['frost_pelt', [1, 1], .15]]],
  ['snow_hare', 'Snow hare', 'ironpeak', 34, '#f2f4f6', 'beast', 'h', [['frost_pelt', [1, 1], .4], ['raw_game', [1, 1], .5]]],
  ['woolly_yak', 'Woolly yak', 'ironpeak', 39, '#6a5a4a', 'beast', 'h', [['wool', [2, 4], .9], ['frost_pelt', [1, 1], .5], ['raw_game', [1, 2], .6]]],
  ['ice_elk', 'Ice elk', 'ironpeak', 44, '#b8d0dc', 'beast', 'h', [['frost_pelt', [1, 2], .8], ['raw_game', [1, 2], .7]]],
  /* Gloomfen: leeches, hags and ghouls; herons, fen boar and a stag that glows */
  ['giant_leech', 'Giant leech', 'gloomfen', 55, '#4a3a3a', 'beast', 'c', [['bogscale', [1, 1], .2]]],
  ['bog_hag', 'Bog hag', 'gloomfen', 60, '#6a7a4a', 'spectral', 'c', [['rune', [5, 12], .3], ['seed_goldleaf', [1, 2], .06]]],
  ['fen_ghoul', 'Fen ghoul', 'gloomfen', 65, '#7a8a6a', 'spectral', 'c', [['old_bone', [1, 3], .6]]],
  ['marsh_heron', 'Marsh heron', 'gloomfen', 52, '#9aa4a8', 'winged', 'h', [['feather', [3, 8], .9], ['egg', [1, 1], .2]]],
  ['fen_boar', 'Fen boar', 'gloomfen', 55, '#4a4a3a', 'beast', 'h', [['bogscale', [1, 1], .5], ['raw_game', [1, 2], .7]]],
  ['mirelight_stag', 'Mirelight stag', 'gloomfen', 60, '#6a8a6a', 'beast', 'h', [['bogscale', [1, 1], .6], ['raw_game', [1, 2], .6], ['seed_goldleaf', [1, 1], .05]]],
  ['moss_tortoise', 'Moss tortoise', 'gloomfen', 67, '#5a6a3a', 'beast', 'h', [['bogscale', [1, 2], .8], ['old_bone', [1, 1], .3]]],
  /* Emberfall: cultists, a magma golem, a wraith; lizards, stags and a firebird */
  ['ash_cultist', 'Ash cultist', 'emberfall', 70, '#8a3a2a', 'humanoid', 'c', [['rune', [6, 14], .4]]],
  ['magma_golem', 'Magma golem', 'emberfall', 78, '#c8602a', 'clawed', 'c', [['ember_core', [1, 1], .05], ['ore_coal', [2, 5], .4]]],
  ['ember_wraith', 'Ember wraith', 'emberfall', 83, '#e07a3a', 'spectral', 'c', [['ember_core', [1, 1], .04]]],
  ['cinder_lizard', 'Cinder lizard', 'emberfall', 64, '#c8503a', 'beast', 'h', [['drakehide', [1, 1], .25], ['raw_game', [1, 1], .5], ['ember_core', [1, 1], .02]]],
  ['ember_stag', 'Ember stag', 'emberfall', 70, '#b8603a', 'beast', 'h', [['drakehide', [1, 1], .5], ['raw_game', [1, 2], .6]]],
  ['ashen_boar', 'Ashen boar', 'emberfall', 74, '#5a524e', 'beast', 'h', [['drakehide', [1, 1], .6], ['raw_game', [1, 2], .7]]],
  ['firebird', 'Firebird', 'emberfall', 86, '#e8502a', 'winged', 'h', [['feather', [4, 10], .9], ['storm_feather', [1, 1], .02], ['ember_core', [1, 1], .05]]],
  /* Skyreach: harpies, sky pirates, a storm elemental, a cloud giant; griffins and sky stags */
  ['harpy', 'Harpy', 'skyreach', 90, '#8a6a9a', 'winged', 'c', [['feather', [3, 8], .6]]],
  ['sky_pirate', 'Sky pirate', 'skyreach', 92, '#5a6a8a', 'humanoid', 'c', [['gem_diamond', [1, 1], .03]]],
  ['storm_elemental', 'Storm elemental', 'skyreach', 97, '#7ac8e8', 'spectral', 'c', [['storm_feather', [1, 1], .02], ['rune', [10, 24], .3]]],
  ['cloud_giant', 'Cloud giant', 'skyreach', 104, '#dce4ec', 'humanoid', 'c', [['ore_astralite', [1, 2], .2]]],
  ['griffin', 'Griffin', 'skyreach', 99, '#c8a050', 'winged', 'h', [['feather', [5, 12], .9], ['drakehide', [1, 1], .4], ['storm_feather', [1, 1], .03]]],
  ['sky_stag', 'Sky stag', 'skyreach', 103, '#e8e0c8', 'beast', 'h', [['drakehide', [1, 1], .5], ['raw_game', [1, 2], .7], ['storm_feather', [1, 1], .03]]],
  /* the Hollow: stalkers and wights; moon hares, star stags and the eclipse roc */
  ['void_stalker', 'Void stalker', 'hollow', 110, '#5a3a7a', 'clawed', 'c', [['ore_voidstone', [1, 1], .2]]],
  ['hollow_wight', 'Hollow wight', 'hollow', 116, '#3a3050', 'spectral', 'c', [['rune', [14, 30], .45], ['wyrm_scale', [1, 1], .02]]],
  ['moon_hare', 'Moon hare', 'hollow', 104, '#d8d4f0', 'beast', 'h', [['raw_game', [1, 2], .6], ['gem_diamond', [1, 1], .02]]],
  ['star_stag', 'Star stag', 'hollow', 108, '#3a3a6a', 'beast', 'h', [['wyrm_scale', [1, 1], .08], ['raw_game', [1, 2], .6]]],
  ['shadow_lynx', 'Shadow lynx', 'hollow', 112, '#2a2438', 'beast', 'h', [['wyrm_scale', [1, 1], .1]]],
  ['eclipse_roc', 'Eclipse roc', 'hollow', 117, '#1a1a2a', 'winged', 'h', [['feather', [6, 14], .9], ['storm_feather', [1, 1], .05], ['wyrm_scale', [1, 1], .12]]]
];
D.EXTRA_CREATURES = D.EXTRA_CREATURES || {};
const base = D.MONLIST.filter(m => !m.boss && !m.mini && !D.EXTRA_CREATURES[m.id]);
/* the town's own loot extras are the drops every original creature there shares */
const townExtras = town => { const ms = base.filter(m => m.town === town); if (!ms.length) return []; return ms[0].drops.filter(d => d[0] !== 'coin_pouch' && d[0] !== 'treasure_chest' && !(D.TOWN_GEAR[town] || []).includes(d[0]) && ms.every(m => m.drops.some(x => x[0] === d[0]))); };
for (const [id, name, town, cl, col, body, role, own] of R) {
  if (D.MON[id]) continue;
  const [hp, max, att, def, c0, c1] = at(cl), hunt = role === 'h', drops = own.map(d => [d[0], d[1], d[2]]);
  if (!hunt) { const gear = D.TOWN_GEAR[town] || [], add = (i, n, p) => { if (!drops.some(d => d[0] === i)) drops.push([i, n, p]); };
    add('coin_pouch', [1, 1], .05); add('treasure_chest', [1, 1], .004); gear.forEach(g => add(g, [1, 1], .006)); townExtras(town).forEach(d => add(d[0], d[1], d[2])); }
  const m = { id, name, town, cl, hp: Math.max(2, Math.round(hp * (hunt ? .85 : 1) * .62)), max: Math.max(1, Math.round(max * (hunt ? .8 : 1) * .72)), att: Math.round(att), def: Math.round(def), coins: hunt ? [0, Math.max(1, Math.round(c0))] : [Math.round(c0), Math.round(c1)], col, drops };
  if (hunt) m.hl = D.huntLvl(cl);
  D.MON[id] = m; D.MONLIST.push(m); D.EXTRA_CREATURES[id] = { body, mark: 'roster', index: Object.keys(D.EXTRA_CREATURES).length };
}
/* ---------- the animals already in the game move to the hunting grounds ---------- */
const ANIMALS = { willowbrook: ['chicken', 'cow'], mossbarrow: ['boar', 'mossglass', 'thimblefox', 'bellhare'], saltmere: ['crab', 'tideglass', 'brineback'], ironpeak: ['chimehorn'], gloomfen: ['candletoad'], emberfall: ['glassback'], skyreach: ['hawk', 'nimbusgrazer', 'prismkite'], hollow: [] };
const extra = { chicken: [['egg', [1, 1], .25], ['raw_game', [1, 1], .4]], cow: [['raw_game', [1, 2], .6]], boar: [['raw_game', [1, 2], .7], ['cowhide', [1, 1], .3]], mossglass: [['raw_game', [1, 2], .6], ['cowhide', [1, 1], .4]], thimblefox: [['wolf_pelt', [1, 1], .25]], bellhare: [['wolf_pelt', [1, 1], .3], ['raw_game', [1, 1], .5]], crab: [['raw_game', [1, 1], .3]], brineback: [['raw_game', [1, 2], .5]], chimehorn: [['frost_pelt', [1, 1], .2], ['raw_game', [1, 2], .5]], candletoad: [['raw_game', [1, 1], .3]], glassback: [['raw_game', [1, 2], .5]], nimbusgrazer: [['wool', [2, 4], .5]], hawk: [['storm_feather', [1, 1], .01]] };
for (const [town, ids] of Object.entries(ANIMALS)) for (const id of ids) {
  const m = D.MON[id]; if (!m) continue; const gear = new Set(D.TOWN_GEAR[town] || []);
  /* animals carry no weapons, coin pouches or picnic bread; unique trophies and materials stay */
  m.drops = m.drops.filter(d => { const it = D.ITEMS[d[0]]; return !gear.has(d[0]) && !['coin_pouch', 'treasure_chest', 'bread'].includes(d[0]) && !(it && it.slot && !it.unique); });
  for (const d of extra[id] || []) if (!m.drops.some(x => x[0] === d[0])) m.drops.push(d);
  m.hl = D.huntLvl(m.cl);
}
/* ---------- the grounds: two combat areas and one hunting ground per town, low levels listed first ---------- */
D.ROSTER = {
  willowbrook: { areas: [['Meadow Path', ['mudling', 'brambleback', 'lanternmoth', 'rat', 'goblin_slinger', 'goblin']], ['Goblin Thicket', ['thicket_spider', 'rilljaw', 'goblin_hexer', 'goblin_raider', 'tattercap', 'goblin_brute']]], hunt: ['Farm fields', ['chicken', 'rabbit', 'pheasant', 'sheep', 'cow']] },
  mossbarrow: { areas: [['Old Farmland', ['poacher', 'mossback_spider', 'wolf', 'barrow_ghoul', 'grave_robber', 'scarecrow']], ['Whispering Wood', ['wolf', 'barrow_ghoul', 'rootbound', 'bramble_witch', 'dire_wolf']]], hunt: ['Bramble glades', ['boar', 'mossglass', 'thimblefox', 'red_deer', 'bellhare']] },
  saltmere: { areas: [['Rocky Shore', ['tide_thief', 'drowned_sailor', 'bandit', 'kelplantern', 'smuggler']], ['Smuggler Coves', ['smuggler', 'pirate_bosun', 'sea_hag', 'reef_serpent', 'pirate', 'wreckling']]], hunt: ['Seal rocks', ['crab', 'gull', 'tideglass', 'seal', 'brineback']] },
  ironpeak: { areas: [['Lower Caverns', ['bat', 'kobold', 'snowcoil', 'icewolf', 'raider', 'cairnmimic']], ['Frozen Pass', ['icewolf', 'ice_wight', 'yeti', 'troll', 'rimewing']]], hunt: ['High pastures', ['mountain_goat', 'chimehorn', 'snow_hare', 'woolly_yak', 'ice_elk']] },
  gloomfen: { areas: [['Sunken Road', ['zombie', 'murkbell', 'giant_leech', 'skeleton', 'reedstalker', 'bog_hag']], ['Witchfen', ['bog_hag', 'bogsnapper', 'fen_ghoul', 'wraith', 'siltmarionette']]], hunt: ['Reed beds', ['marsh_heron', 'fen_boar', 'mirelight_stag', 'candletoad', 'moss_tortoise']] },
  emberfall: { areas: [['Cinder Flats', ['imp', 'ashveil', 'ash_cultist', 'hound', 'cinderloom']], ['Wyrm Crags', ['magma_golem', 'drake', 'ember_wraith', 'emberlord', 'furnacemite']]], hunt: ['Ash plains', ['cinder_lizard', 'ember_stag', 'ashen_boar', 'glassback', 'firebird']] },
  skyreach: { areas: [['Cloud Gardens', ['harpy', 'sky_pirate', 'golem', 'storm_elemental']], ['Thunder Peaks', ['wyvern', 'thunderloom', 'cloud_giant', 'galehermit']]], hunt: ['Sky meadows', ['hawk', 'nimbusgrazer', 'prismkite', 'griffin', 'sky_stag']] },
  hollow: { areas: [['Ruined Causeway', ['voidknight', 'echohusk', 'shade', 'paleorbit', 'void_stalker']], ['Shadow Court', ['void_stalker', 'horror', 'threadsaint', 'hollow_wight', 'nullbloom']]], hunt: ['Starfall glade', ['moon_hare', 'star_stag', 'shadow_lynx', 'eclipse_roc']] }
};
D.ROSTER_WEIGHTS = [30, 24, 18, 13, 9, 6];
})();
