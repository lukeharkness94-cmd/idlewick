/* Idlewick: game content. Pure data plus generators; no UI here. */
(() => {
const DQ = window.DQ, { cap } = DQ;
const D = DQ.data = {};

/* ---------- Experience table ---------- */
const XPF = [0, 0];
{ let a = 0; for (let l = 1; l < 99; l++) { a += Math.floor(l + 300 * Math.pow(2, l / 7)); XPF[l + 1] = Math.floor(a / 4); } }
/* Skill levels follow a steeper curve than the classic table: quick at first, a real grind later.
   XPF_RAW is the classic table, still used for Hero level. */
const XPF_RAW = D.XPF_RAW = XPF.slice();
for (let l = 2; l <= 99; l++) XPF[l] = Math.round(XPF_RAW[l] * (1 + 9 * Math.pow(Math.min(1, Math.max(0, (l - 3) / 37)), 1.25)));
D.XPF = XPF;
D.lvlOf = xp => { let l = 1; while (l < 99 && xp >= XPF[l + 1]) l++; return l; };
D.ADV_MULT = 10;
/* Hero level L needs advReq(L) total xp. Early levels are cheap so level 2 arrives in a minute or two. */
D.advReq = L => L <= 1 ? 0 : Math.round(XPF_RAW[L] * Math.min(10, 2 + (L - 2) * .62));

/* ---------- Skills ---------- */
D.SKILLS = [
  { id: 'fishing',     name: 'Fishing',     col: '#4fb3c8', group: 'gather',  page: 'fishing',     unlock: 0,  blurb: 'Cast a line and bring in the catch of the day.' },
  { id: 'woodcutting', name: 'Woodcutting', col: '#82b957', group: 'gather',  page: 'woodcutting', unlock: 0,  blurb: 'Fell trees for logs. Bows, staves and a good fire all start here.' },
  { id: 'mining',      name: 'Mining',      col: '#a7b4c0', group: 'gather',  page: 'mining',      unlock: 6,  blurb: 'Dig ore and gems from the rock.' },
  { id: 'thieving',    name: 'Thieving',    col: '#9b87e0', group: 'gather',  page: 'thieving',    unlock: 13, quest: 'mq_thieving',  blurb: 'Lift purses and raid stalls. A fine way to find coins.' },
  { id: 'farming',     name: 'Farming',     col: '#b8864f', group: 'gather',  page: 'farming',     unlock: 10,  blurb: 'Grow crops and raise animals on your own homestead.' },
  { id: 'cooking',     name: 'Cooking',     col: '#f2b44a', group: 'artisan', page: 'cooking',     unlock: 3,  blurb: 'Turn raw fish into food that heals you in a fight.' },
  { id: 'smithing',    name: 'Smithing',    col: '#e8703a', group: 'artisan', page: 'smithing',    unlock: 12, quest: 'mq_smithing',  blurb: 'Smelt ore into bars and hammer them into weapons and armour.' },
  { id: 'crafting',    name: 'Crafting',    col: '#d98ad1', group: 'artisan', page: 'crafting',    unlock: 15, quest: 'mq_crafting', blurb: 'Sew leather, cut jewellery, carve bows and staves.' },
  { id: 'magic',       name: 'Magic',       col: '#7d89f5', group: 'artisan', page: 'magic',       unlock: 28, quest: 'mq_magic', blurb: 'Cast spells in battle and turn clutter into coins with alchemy.' },
  { id:'research', name:'Scholarship', col:'#b79862', group:'artisan', page:'research', unlock:16, blurb:'Study practical discoveries to earn Scholarship XP and permanent improvements.' },
  { id: 'attack',      name: 'Attack',      col: '#df5b4a', group: 'combat',  page: 'combat',      unlock: 0,  blurb: 'Hit more often with melee weapons.' },
  { id: 'strength',    name: 'Strength',    col: '#3fb88f', group: 'combat',  page: 'combat',      unlock: 0,  blurb: 'Hit harder with melee weapons.' },
  { id: 'defence',     name: 'Defence',     col: '#5f93df', group: 'combat',  page: 'combat',      unlock: 0,  blurb: 'Avoid blows and wear heavier armour.' },
  { id: 'ranged',      name: 'Ranged',      col: '#b5d84b', group: 'combat',  page: 'combat',      unlock: 18, quest: 'mq_ranged', blurb: 'Loose arrows from a safe distance.' },
  { id: 'hitpoints',   name: 'Health',   col: '#f0607a', group: 'combat',  page: 'combat',      unlock: 0,  blurb: 'How much punishment you can take.' },
];
D.SK = Object.fromEntries(D.SKILLS.map(s => [s.id, s]));
D.GROUPS = { gather: 'Gathering', artisan: 'Artisan', combat: 'Combat' };

/* ---------- Items ---------- */
const ITEMS = D.ITEMS = {};
const mk = (id, o) => { ITEMS[id] = Object.assign({ id, val: 1, ic: 'bit', col: '#aab', type: 'drop' }, o); return ITEMS[id]; };

const TIERS = D.TIERS = [
  { id: 'bronze',  name: 'Bronze',  col: '#c58a5a', equip: 1,  bar: 1,  P: 4,  base: 20,    barXp: 6 },
  { id: 'iron',    name: 'Iron',    col: '#9aa3ad', equip: 10, bar: 15, P: 9,  base: 110,   barXp: 12 },
  { id: 'steel',   name: 'Steel',   col: '#cdd5dc', equip: 20, bar: 30, P: 16, base: 420,   barXp: 17 },
  { id: 'mithril', name: 'Mithril', col: '#6c7fe0', equip: 30, bar: 50, P: 25, base: 1300,  barXp: 30 },
  { id: 'adamant', name: 'Adamant', col: '#4fbf7a', equip: 40, bar: 70, P: 36, base: 4000,  barXp: 38 },
  { id: 'rune',    name: 'Runite',  col: '#46c8d8', equip: 50, bar: 85, P: 50, base: 12000, barXp: 50 },
  { id: 'astral',  name: 'Astral',  col: '#e2d4ff', equip: 60, bar: 92, P: 66, base: 36000, barXp: 65 },
];

/* Fish: id, name, colour, town, lvl, xp, ms, cookLvl, cookXp, heal, sell */
const FISH = [
  ['shrimp', 'Shrimp', '#f0a47c', 'willowbrook', 1, 10, 2000, 1, 30, 3, 4],
  ['sardine', 'Sardine', '#b9c7d6', 'willowbrook', 5, 20, 2100, 5, 40, 4, 7],
  ['herring', 'Herring', '#9fb4c8', 'willowbrook', 10, 30, 2200, 10, 50, 5, 10],
  ['trout', 'Trout', '#c9ae7a', 'saltmere', 20, 50, 2400, 15, 70, 7, 16],
  ['salmon', 'Salmon', '#ef8a6e', 'saltmere', 30, 70, 2600, 25, 90, 9, 30],
  ['tuna', 'Tuna', '#7a98c8', 'saltmere', 35, 80, 2700, 30, 100, 10, 42],
  ['lobster', 'Lobster', '#e0573f', 'ironpeak', 40, 90, 2800, 40, 120, 12, 65],
  ['swordfish', 'Swordfish', '#8aa6bd', 'ironpeak', 50, 100, 3000, 45, 140, 14, 100],
  ['monkfish', 'Monkfish', '#a99478', 'gloomfen', 62, 110, 3000, 62, 150, 16, 150],
  ['shark', 'Shark', '#7f9fb8', 'emberfall', 76, 110, 3200, 80, 210, 20, 300],
  ['anglerfish', 'Anglerfish', '#c8a85a', 'emberfall', 82, 125, 3400, 84, 230, 22, 420],
  ['carp', 'Carp', '#d9a050', 'mossbarrow', 12, 25, 2200, 12, 55, 6, 12],
  ['pike', 'Pike', '#8fae6a', 'mossbarrow', 16, 40, 2300, 16, 65, 6, 14],
  ['skyfin', 'Skyfin', '#9fd8ff', 'skyreach', 88, 140, 3600, 90, 260, 24, 520],
  /* Nov 2026 additions: fill the long stretches between catches; ordinary ones work from any town once discovered */
  ['minnow', 'Minnow', '#b8c4a8', 'willowbrook', 3, 14, 2000, 3, 34, 3, 4],
  ['perch', 'Perch', '#a8b45a', 'willowbrook', 7, 24, 2150, 7, 44, 4, 6],
  ['bream', 'Bream', '#c8b888', 'mossbarrow', 22, 55, 2450, 20, 75, 8, 16],
  ['mackerel', 'Mackerel', '#4a8a9a', 'saltmere', 26, 62, 2500, 23, 82, 8, 19],
  ['flounder', 'Flounder', '#9a8a64', 'saltmere', 33, 76, 2650, 28, 96, 10, 29],
  ['catfish', 'Catfish', '#6a6a58', 'mossbarrow', 38, 86, 2750, 35, 110, 11, 42],
  ['char', 'Arctic char', '#e8704a', 'ironpeak', 44, 94, 2900, 42, 128, 13, 64],
  ['grayling', 'Grayling', '#9a9aac', 'ironpeak', 56, 105, 3000, 52, 145, 15, 96],
  ['bogpuffer', 'Bog puffer', '#8a9a52', 'gloomfen', 66, 112, 3050, 66, 165, 17, 152],
  ['bogray', 'Bog ray', '#6a7a64', 'gloomfen', 70, 115, 3100, 70, 180, 18, 184],
  ['cinderfish', 'Cinderfish', '#d8603a', 'emberfall', 79, 118, 3300, 78, 215, 21, 272],
  ['basaltjaw', 'Basaltjaw', '#5a5a64', 'emberfall', 86, 132, 3500, 86, 240, 23, 368],
  ['stormray', 'Storm ray', '#7a9ac8', 'skyreach', 92, 150, 3700, 92, 270, 25, 480],
  ['ghostfin', 'Ghostfin', '#d8e0f4', 'hollow', 98, 170, 3900, 97, 300, 27, 608],
  ['voideel', 'Void eel', '#8a5ad8', 'hollow', 95, 160, 3800, 96, 290, 26, 560],
];
const WOOD = [
  ['normal', 'Logs', 'Tree', '#a07a4f', 'willowbrook', 1, 18, 2200, 3],
  ['oak', 'Oak logs', 'Oak tree', '#b58a52', 'willowbrook', 15, 38, 2400, 8],
  ['willow', 'Willow logs', 'Willow tree', '#9db86a', 'saltmere', 30, 68, 2600, 18],
  ['maple', 'Maple logs', 'Maple tree', '#c9703f', 'ironpeak', 45, 100, 2800, 40],
  ['yew', 'Yew logs', 'Yew tree', '#5f9a5a', 'gloomfen', 60, 175, 3200, 90],
  ['magic', 'Magic logs', 'Magic tree', '#8f7fe0', 'emberfall', 75, 250, 3600, 220],
  ['birch', 'Birch logs', 'Birch tree', '#e6dcc4', 'mossbarrow', 8, 30, 2300, 5],
  ['elder', 'Elder logs', 'Elder tree', '#c9e0a8', 'skyreach', 88, 320, 3800, 360],
  ['gloomwood', 'Gloomwood logs', 'Gloomwood tree', '#5a4a7a', 'hollow', 95, 380, 4000, 480],
  ['hazel', 'Hazel logs', 'Hazel tree', '#b89a6a', 'willowbrook', 5, 24, 2250, 3],
  ['ash', 'Ash logs', 'Ash tree', '#cfc0a0', 'mossbarrow', 22, 50, 2500, 10],
  ['palm', 'Palm logs', 'Palm tree', '#c8a868', 'saltmere', 27, 60, 2550, 12],
  ['cedar', 'Cedar logs', 'Cedar tree', '#b0603a', 'ironpeak', 40, 88, 2750, 26],
  ['pine', 'Pine logs', 'Pine tree', '#9a7a52', 'ironpeak', 52, 130, 3000, 48],
  ['mangrove', 'Mangrove logs', 'Mangrove tree', '#7a5a3a', 'gloomfen', 67, 210, 3400, 120],
  ['cinderbark', 'Cinderbark logs', 'Cinderbark tree', '#4a3430', 'emberfall', 80, 275, 3700, 224],
  ['windpine', 'Windpine logs', 'Windpine tree', '#a8b8c8', 'skyreach', 92, 345, 3900, 336],
  ['wraithbark', 'Wraithbark logs', 'Wraithbark tree', '#c8c8d8', 'hollow', 98, 400, 4100, 448],
];
const ORES = [
  ['copper', 'Copper', '#cf8a52', 'willowbrook', 1, 17, 2200, 6],
  ['tin', 'Tin', '#aab4bc', 'willowbrook', 1, 17, 2200, 6],
  ['iron', 'Iron', '#a07860', 'saltmere', 15, 35, 2600, 18],
  ['coal', 'Coal', '#6a727b', 'saltmere', 30, 50, 2800, 30],
  ['gold', 'Gold', '#f0c75a', 'ironpeak', 40, 65, 3000, 70],
  ['mithril', 'Mithril', '#6c7fe0', 'ironpeak', 55, 80, 3400, 100],
  ['adamant', 'Adamant', '#4fbf7a', 'gloomfen', 70, 95, 3800, 220],
  ['runite', 'Runite', '#46c8d8', 'emberfall', 85, 125, 4400, 600],
  ['silver', 'Silver', '#d6dde4', 'mossbarrow', 20, 40, 2600, 35],
  ['astralite', 'Astralite', '#e2d4ff', 'skyreach', 90, 150, 4800, 900],
  ['voidstone', 'Voidstone', '#6a4aa8', 'hollow', 97, 180, 5200, 1300],
  /* minerals for skilling charms (Crafting): each strengthens one non-combat skill */
  ['flint', 'Flint', '#8a8a86', 'willowbrook', 4, 15, 2150, 4],
  ['quartz', 'Quartz', '#e8eef4', 'willowbrook', 10, 24, 2300, 7],
  ['amber', 'Amber', '#e8a030', 'mossbarrow', 18, 34, 2500, 13],
  ['jet', 'Jet', '#2a2a34', 'saltmere', 26, 44, 2700, 21],
  ['jade', 'Jade', '#5ab87a', 'saltmere', 35, 56, 2900, 36],
  ['bloodstone', 'Bloodstone', '#3a6a4a', 'ironpeak', 46, 70, 3100, 60],
  ['moonstone', 'Moonstone', '#d8e0ff', 'ironpeak', 58, 84, 3400, 96],
  ['bogiron', 'Bog iron', '#9a5a2a', 'gloomfen', 64, 92, 3600, 128],
  ['obsidian', 'Obsidian', '#2a2238', 'emberfall', 78, 115, 4100, 304],
  ['skyglass', 'Skyglass', '#bfe6ff', 'skyreach', 91, 146, 4700, 608],
  ['nullite', 'Nullite', '#3a2a5a', 'hollow', 99, 185, 5300, 1120],
];
const THIEF = [
  ['villager', 'Villager', 'willowbrook', 1, 8, 2000, 3, 9, 2, null],
  ['farmer', 'Farmer', 'willowbrook', 10, 15, 2200, 8, 22, 3, ['bread', .12]],
  ['dockhand', 'Dockhand', 'saltmere', 20, 30, 2400, 22, 55, 4, ['raw_trout', .1]],
  ['merchant', 'Merchant stall', 'saltmere', 30, 45, 2600, 45, 110, 5, ['rune', .2]],
  ['dwarf', 'Dwarven miner', 'ironpeak', 40, 60, 2800, 70, 170, 7, ['ore_gold', .08]],
  ['armoury', 'Armoury guard', 'ironpeak', 52, 78, 3000, 120, 260, 9, ['bar_steel', .1]],
  ['cultist', 'Cultist', 'gloomfen', 60, 95, 3000, 150, 330, 11, ['rune', .25]],
  ['witch', "Witch's cauldron", 'gloomfen', 68, 130, 3200, 260, 520, 13, ['bogscale', .1]],
  ['fireguard', 'Citadel guard', 'emberfall', 76, 160, 3400, 380, 760, 16, ['ember_core', .04]],
  ['hoard', 'Dragon hoard', 'emberfall', 85, 220, 3800, 600, 1300, 22, ['gem_diamond', .06]],
  ['farmhand', 'Farmhand', 'mossbarrow', 14, 22, 2300, 12, 30, 3, ['seed_potato', .2]],
  ['market', 'Market stall', 'mossbarrow', 18, 28, 2400, 20, 45, 4, ['seed_strawberry', .08]],
  ['monk', 'Wandering monk', 'skyreach', 88, 250, 3800, 700, 1500, 24, ['rune', .3]],
  ['vault', 'Royal vault', 'hollow', 95, 300, 4000, 1200, 2600, 28, ['gem_diamond', .08]],
];

D.NODES = { fish: [], wood: [], mine: [], thieve: [] };
D.NODE = {};
const addNode = (kind, n) => { n.kind = kind; D.NODES[kind].push(n); D.NODE[kind + ':' + n.id] = n; };

FISH.forEach(([id, name, col, town, lvl, xp, t, cl, cxp, heal, sell]) => {
  mk('raw_' + id, { name: 'Raw ' + name.toLowerCase(), ic: 'fish', col, val: Math.max(1, Math.floor(sell / 3)), type: 'raw', dim: 1 });
  mk(id, { name, ic: 'fish', col, val: sell, type: 'food', heal });
  addNode('fish', { id, name, town, skill: 'fishing', lvl, xp, t, item: 'raw_' + id, col, ic: 'fishing' });
});
mk('burnt', { name: 'Burnt fish', ic: 'fish', col: '#6b625a', val: 0, type: 'junk' });
mk('bread', { name: 'Bread', ic: 'food', col: '#d9a85c', val: 3, type: 'food', heal: 5, buy: 8 });

WOOD.forEach(([id, iname, name, col, town, lvl, xp, t, sell]) => {
  mk('log_' + id, { name: iname, ic: 'log', col, val: sell, type: 'resource' });
  addNode('wood', { id, name, town, skill: 'woodcutting', lvl, xp, t, item: 'log_' + id, col, ic: 'woodcutting' });
});
ORES.forEach(([id, name, col, town, lvl, xp, t, sell]) => {
  mk('ore_' + id, { name: name + ' ore', ic: 'ore', col, val: sell, type: 'resource' });
  addNode('mine', { id, name: name + ' rock', town, skill: 'mining', lvl, xp, t, item: 'ore_' + id, col, ic: 'mining' });
});
const GEMS = [['sapphire', 'Sapphire', '#4a7fe0', 60, 60], ['emerald', 'Emerald', '#3fbf6a', 110, 25], ['ruby', 'Ruby', '#e0485a', 180, 12], ['diamond', 'Diamond', '#d8f1ff', 400, 3]];
D.GEM_WEIGHTS = GEMS.map(g => ['gem_' + g[0], g[4]]);
GEMS.forEach(([id, name, col, val]) => mk('gem_' + id, { name, ic: 'gem', col, val, type: 'gem' }));
THIEF.forEach(([id, name, town, lvl, xp, t, cmin, cmax, dmg, loot]) =>
  addNode('thieve', { id, name, town, skill: 'thieving', lvl, xp, t, cmin, cmax, dmg, loot, col: '#9b87e0', ic: 'thieving' }));

/* Misc drops and supplies */
mk('feather', { name: 'Feather', col: '#e8e2cf', val: 1, buy: 2, type: 'resource' });
mk('rune', { name: 'Arcane rune', ic: 'rune', col: '#8f9bff', val: 2, buy: 5, type: 'supply' });
mk('cowhide', { name: 'Cowhide', ic: 'hide', col: '#b08a5e', val: 7, type: 'resource' });
mk('frost_pelt', { name: 'Frost pelt', ic: 'hide', col: '#a8c8e0', val: 35, type: 'resource' });
mk('bogscale', { name: 'Bogscale', ic: 'hide', col: '#6f9f6a', val: 80, type: 'resource' });
mk('drakehide', { name: 'Drakehide', ic: 'hide', col: '#58c27e', val: 220, type: 'resource' });
mk('old_bone', { name: 'Old bone', ic: 'bone', col: '#d8d4c6', val: 6, type: 'junk' });
mk('troll_bone', { name: 'Troll bone', ic: 'bone', col: '#cdb88f', val: 45, type: 'junk' });
mk('ember_core', { name: 'Ember core', ic: 'gem', col: '#ff8a4a', val: 480, type: 'gem', rare: 1 });
mk('wyrm_scale', { name: 'Wyrm scale', ic: 'hide', col: '#ff6a3a', val: 1500, type: 'junk', rare: 1 });

/* Bars */
const BAR_IN = [{ copper: 1, tin: 1 }, { iron: 1 }, { iron: 1, coal: 2 }, { mithril: 1, coal: 4 }, { adamant: 1, coal: 6 }, { runite: 1, coal: 8 }, { astralite: 1, coal: 10 }];
const BAR_VAL = [8, 20, 45, 130, 260, 650, 1600];
D.RECIPES = {}; D.RLIST = { cooking: [], smithing: [], crafting: [] };
const addR = (r) => { r.t = r.t || 2400; D.RECIPES[r.id] = r; D.RLIST[r.skill].push(r); return r; };

TIERS.forEach((t, i) => {
  mk('bar_' + t.id, { name: t.name + ' bar', ic: 'bar', col: t.col, val: BAR_VAL[i], type: 'resource' });
  const inp = {}; Object.entries(BAR_IN[i]).forEach(([k, v]) => inp['ore_' + k] = v);
  addR({ id: 'smelt_' + t.id, skill: 'smithing', tab: 'Bars', name: t.name + ' bar', lvl: t.bar, xp: t.barXp, t: 2600, in: inp, out: { ['bar_' + t.id]: 1 }, ev: 'smelt' });
});
mk('bar_gold', { name: 'Gold bar', ic: 'bar', col: '#f0c75a', val: 90, type: 'resource' });
addR({ id: 'smelt_gold', skill: 'smithing', tab: 'Bars', name: 'Gold bar', lvl: 40, xp: 22, t: 2600, in: { ore_gold: 1 }, out: { bar_gold: 1 }, ev: 'smelt' });

/* Extra drops and boss trophies for the new towns */
mk('boar_tusk', { name: 'Boar tusk', ic: 'bone', col: '#efe2c4', val: 12, type: 'junk' });
mk('wolf_pelt', { name: 'Wolf pelt', ic: 'hide', col: '#9aa0a8', val: 15, type: 'resource' });
mk('tusk_charm', { name: 'Tusk charm', ic: 'amulet', col: '#efe2c4', val: 900, type: 'gear', slot: 'amulet', b: { str: 4, def: 4 }, rare: 1 });
mk('storm_feather', { name: 'Storm feather', ic: 'bit', col: '#bfe8ff', val: 60000, type: 'gear', slot: 'ring', b: { atk: 8, str: 8, def: 8, rng: 8, mag: 8 }, rare: 1 });
mk('hollow_crown', { name: 'The Hollow Crown', ic: 'helm', col: '#b08aff', val: 120000, type: 'gear', slot: 'head', req: { defence: 70 }, b: { def: 40, atk: 10, str: 10, mag: 10, rng: 10 }, rare: 1 });

/* Farming: crops (id, name, colour, lvl, grow seconds, yield, plant xp, harvest xp, sell, seed price) */
D.CROPS = [
  ['potato', 'Potato', '#c9a46a', 1, 45, [3, 6], 8, 12, 3, 4],
  ['onion', 'Onion', '#e0c070', 5, 70, [3, 6], 12, 18, 4, 6],
  ['cabbage', 'Cabbage', '#8fcf6a', 10, 100, [3, 5], 18, 26, 6, 10],
  ['wheat', 'Wheat', '#e8c860', 15, 130, [4, 8], 22, 32, 5, 14],
  ['strawberry', 'Strawberry', '#e8506a', 22, 180, [4, 8], 30, 45, 10, 25],
  ['pumpkin', 'Pumpkin', '#ef8a3a', 30, 260, [2, 4], 45, 70, 30, 60],
  ['goldleaf', 'Goldleaf herb', '#e8d050', 40, 320, [2, 5], 60, 95, 45, 110],
  ['sunbloom', 'Sunbloom', '#ffd84a', 50, 420, [2, 5], 80, 130, 70, 200],
  ['moonmelon', 'Moonmelon', '#a8c8ff', 65, 540, [2, 4], 110, 180, 140, 420],
  ['starfruit', 'Starfruit', '#fff0a0', 80, 720, [2, 4], 150, 260, 300, 900],
].map(([id, name, col, lvl, secs, yld, pxp, hxp, sell, seed]) => {
  mk('seed_' + id, { name: name + ' seeds', ic: 'seed', col, val: Math.max(1, Math.floor(seed / 3)), buy: seed, type: 'seed' });
  mk('crop_' + id, { name, ic: 'crop', col, val: sell, type: 'crop', heal: lvl < 25 ? 2 : undefined });
  return { id, name, col, lvl, secs, yld, pxp, hxp };
});
D.CROP = Object.fromEntries(D.CROPS.map(c => [c.id, c]));
/* Animals: (id, name, colour, farming lvl, price, produce, seconds per produce, produce value, collect xp) */
D.ANIMALS = [
  ['hen', 'Hen', '#f0e6d0', 1, 150, 'egg', 'Egg', '#f6efe0', 50, 4, 8],
  ['cow', 'Cow', '#d6c2a4', 10, 1200, 'milk', 'Milk', '#f4f4f0', 80, 9, 18],
  ['sheep', 'Sheep', '#efeae0', 20, 2500, 'wool', 'Wool', '#efe8d8', 110, 14, 28],
  ['pig', 'Pig', '#f0a8b0', 30, 5000, 'truffle', 'Truffle', '#6a4a30', 160, 40, 45],
  ['goat', 'Goat', '#c8b898', 40, 9000, 'cheese', 'Goat cheese', '#f0d890', 140, 35, 55],
  ['bees', 'Beehive', '#e8b830', 50, 15000, 'honey', 'Honey', '#e8a820', 150, 55, 70],
].map(([id, name, col, lvl, price, pid, pname, pcol, secs, pval, xp]) => {
  mk(pid, { name: pname, ic: pid === 'egg' ? 'egg' : pid === 'milk' ? 'bottle' : pid === 'wool' ? 'bit' : 'crop', col: pcol, val: pval, type: 'produce' });
  return { id, name, col, lvl, price, prod: pid, secs, xp };
});
D.ANIMAL = Object.fromEntries(D.ANIMALS.map(a => [a.id, a]));
mk('feed', { name: 'Animal feed', ic: 'pouch', col: '#c8a860', val: 1, buy: 3, type: 'supply' });
D.PLOT_PRICES = [0, 0, 0, 600, 2500, 9000, 30000, 90000];      // plots 1-3 are free
D.PEN_PRICES = [0, 0, 1500, 6000, 20000, 60000];               // pens 1-2 are free

/* Cooking */
FISH.forEach(([id, name, col, town, lvl, xp, t, cl, cxp, heal]) =>
  addR({ id: 'cook_' + id, skill: 'cooking', tab: 'Cook', name, lvl: cl, xp: cxp, t: 2000, in: { ['raw_' + id]: 1 }, out: { [id]: 1 }, ev: 'cook', burn: true, evKey: id }));

const farmCook = (id, name, col, lvl, xp, heal, inp, val) => { mk(id, { name, ic: 'food', col, val, type: 'food', heal }); addR({ id: 'cook_' + id, skill: 'cooking', tab: 'Farmhouse', name, lvl, xp, t: 2400, in: inp, out: { [id]: 1 }, ev: 'cook', burn: true }); };
farmCook('baked_potato', 'Baked potato', '#d9a860', 3, 20, 4, { crop_potato: 1 }, 6);
farmCook('veg_stew', 'Vegetable stew', '#c88a4a', 18, 60, 10, { crop_potato: 1, crop_onion: 1, crop_cabbage: 1 }, 30);
farmCook('omelette', 'Omelette', '#f0d060', 25, 80, 12, { egg: 2, crop_onion: 1 }, 45);
farmCook('cheese_pie', 'Cheese and onion pie', '#e8c070', 35, 110, 15, { crop_wheat: 2, cheese: 1, crop_onion: 1 }, 90);
farmCook('berry_cake', 'Strawberry cake', '#f08aa0', 45, 140, 18, { crop_wheat: 2, egg: 1, milk: 1, crop_strawberry: 2 }, 140);
farmCook('pumpkin_pie', 'Pumpkin pie', '#ef8a3a', 55, 170, 20, { crop_pumpkin: 1, crop_wheat: 1, egg: 1 }, 180);
farmCook('honey_roast', 'Honey truffle roast', '#c8782a', 70, 230, 26, { honey: 1, truffle: 1, crop_potato: 2 }, 320);
/* Fish suppers (Nov 2026): one new fish and one crop, so farming and fishing feed each other. They heal about four
   more than the fish alone and sell for roughly their ingredients, so they are a preparation choice, not a money loop. */
[['perch_stew', 'Perch and onion stew', 'perch', 'onion', 'bowl'], ['bream_greens', 'Bream with greens', 'bream', 'cabbage', 'plate'],
 ['mackerel_pie', 'Mackerel pie', 'mackerel', 'wheat', 'pie'], ['flounder_supper', 'Flounder supper', 'flounder', 'potato', 'plate2'],
 ['catfish_pot', 'Catfish pumpkin pot', 'catfish', 'pumpkin', 'pot'], ['char_goldleaf', 'Goldleaf char', 'char', 'goldleaf', 'wrap'],
 ['grayling_sunbloom', 'Sunbloom grayling', 'grayling', 'sunbloom', 'skewer'], ['puffer_broth', 'Marsh puffer broth', 'bogpuffer', 'onion', 'bowl2'],
 ['ray_wraps', 'Bog ray wraps', 'bogray', 'cabbage', 'wrap2'], ['cinder_roast', 'Ember-roast cinderfish', 'cinderfish', 'pumpkin', 'pan'],
 ['basalt_melon', 'Basaltjaw and melon', 'basaltjaw', 'moonmelon', 'platter'], ['storm_skewers', 'Storm ray skewers', 'stormray', 'starfruit', 'skewer2'],
 ['ghostfin_supper', 'Ghostfin supper', 'ghostfin', 'moonmelon', 'pie2']
].forEach(([id, name, f, crop, vessel]) => {
  const F = FISH.find(x => x[0] === f), lvl = Math.min(99, F[7] + 3), cropVal = (ITEMS['crop_' + crop] || { val: 5 }).val;
  farmCook(id, name, F[2], lvl, Math.round(F[8] * 1.25), F[9] + 4, { [f]: 1, ['crop_' + crop]: 1 }, F[10] + cropVal + 2);
  ITEMS[id].dish = { vessel, fish: F[2], crop: (ITEMS['crop_' + crop] || {}).col || '#8ab060' };
});

/* Gear: melee */
const PIECES = [['weapon', 'dagger', 'dagger', 1, 0, .6], ['weapon', 'hammer', 'warhammer', 3, 3, 1.1], ['weapon', 'sword', 'sword', 2, 0, .8], ['head', 'helm', 'full helm', 2, 2, .5], ['shield', 'shield', 'kiteshield', 3, 4, .8], ['legs', 'legs', 'platelegs', 3, 6, 1], ['body', 'body', 'platebody', 5, 8, 1.4]];
const PIECE_IC = { dagger: 'dagger', hammer: 'hammer', weapon: 'sword', head: 'helm', shield: 'shield', legs: 'legs', body: 'body' };
TIERS.forEach((t, i) => PIECES.forEach(([slot, key, label, bars, off, f]) => {
  const P = t.P, b = {};
  if (key === 'dagger') { b.atk = Math.round(P * 1.15); b.str = Math.round(P * .55); }
  else if (key === 'hammer') { b.atk = Math.round(P * .8); b.str = Math.round(P * 1.25); }
  else if (slot === 'weapon') { b.atk = P; b.str = Math.round(P * .85); }
  else b.def = Math.round(P * { head: .35, shield: .55, legs: .6, body: .9 }[slot]);
  const id = `${t.id}_${key}`, val = Math.round(t.base * f);
  mk(id, { name: `${t.name} ${label}`, ic: PIECE_IC[key] || PIECE_IC[slot], wtype: slot === 'weapon' ? key : undefined, col: t.col, val, type: 'gear', slot, style: slot === 'weapon' ? 'melee' : undefined, req: { [slot === 'weapon' ? 'attack' : 'defence']: t.equip }, b, tier: i });
  addR({ id: 'smith_' + id, skill: 'smithing', tab: slot === 'weapon' ? 'Weapons' : 'Armour', name: `${t.name} ${label}`, lvl: Math.min(99, t.bar + off), /* skills cap at 99: the astral platebody (bar 90 + 10) was uncraftable */ xp: Math.round(bars * 12.5 * (1 + i * .25)), t: 3000, in: { ['bar_' + t.id]: bars }, out: { [id]: 1 }, ev: 'smith' });
}));

/* Gear: leather (ranged armour) */
const LEATHER = [
  { id: 'leather', name: 'Leather', hide: 'cowhide', col: '#b08a5e', equip: 1, craft: 1, P: 5, base: 15, xp: 14 },
  { id: 'frost', name: 'Frostpelt', hide: 'frost_pelt', col: '#a8c8e0', equip: 20, craft: 30, P: 12, base: 70, xp: 30 },
  { id: 'bog', name: 'Bogscale', hide: 'bogscale', col: '#6f9f6a', equip: 40, craft: 50, P: 24, base: 240, xp: 50 },
  { id: 'drake', name: 'Drakehide', hide: 'drakehide', col: '#58c27e', equip: 60, craft: 70, P: 40, base: 800, xp: 80 },
];
const LPIECES = [['head', 'coif', 'coif', 2, 0, .35, 'helm'], ['legs', 'chaps', 'chaps', 3, 3, .6, 'legs'], ['body', 'vest', 'body', 4, 6, .9, 'body']];
LEATHER.forEach((t, i) => LPIECES.forEach(([slot, key, label, n, off, f, ic]) => {
  const id = `${t.id}_${key}`;
  mk(id, { name: `${t.name} ${label}`, ic, col: t.col, val: Math.round(t.base * (f + .4)), type: 'gear', slot, req: i === 0 ? { defence: 1 } : { ranged: t.equip }, b: { def: Math.round(t.P * f * .8), rng: Math.round(t.P * f * .45) }, tier: i, lth: 1 }); /* basic leather is everyone's first armour; finer hides need Ranged */
  addR({ id: 'craft_' + id, skill: 'crafting', tab: 'Leather', name: `${t.name} ${label}`, lvl: t.craft + off, xp: t.xp * n, t: 2600, in: { [t.hide]: n }, out: { [id]: 1 }, ev: 'craft' });
}));

/* Bows, staves, arrows */
const BW = [['normal', 'Shortbow', 'Apprentice staff', 1, 5, 6, 5, 20, 30], ['oak', 'Oak shortbow', 'Oak staff', 15, 20, 12, 11, 34, 80], ['willow', 'Willow shortbow', 'Willow staff', 30, 35, 20, 19, 60, 200], ['maple', 'Maple shortbow', 'Maple staff', 45, 50, 30, 29, 90, 520], ['yew', 'Yew shortbow', 'Yew staff', 60, 65, 42, 41, 140, 1400], ['magic', 'Magic shortbow', 'Magic staff', 75, 80, 56, 55, 200, 4000], ['elder', 'Elder shortbow', 'Elder staff', 88, 90, 72, 70, 280, 12000]];
BW.forEach(([w, bname, sname, equip, craft, rng, mag, xp, val], i) => {
  const wc = WOOD.find(x => x[0] === w)[3];
  mk('bow_' + w, { name: bname, ic: 'bow', col: wc, val, type: 'gear', slot: 'weapon', style: 'ranged', req: { ranged: equip }, b: { rng }, tier: i });
  addR({ id: 'craft_bow_' + w, skill: 'crafting', tab: 'Bows', name: bname, lvl: craft, xp, t: 2800, in: { ['log_' + w]: 2 }, out: { ['bow_' + w]: 1 }, ev: 'craft' });
  mk('staff_' + w, { name: sname, ic: 'staff', col: wc, val: Math.round(val * 1.1), type: 'gear', slot: 'weapon', style: 'magic', req: { magic: equip }, b: { mag }, tier: i });
  addR({ id: 'craft_staff_' + w, skill: 'crafting', tab: 'Staves', name: sname, lvl: craft + 3, xp: Math.round(xp * 1.1), t: 2800, in: { ['log_' + w]: 2, rune: 4 }, out: { ['staff_' + w]: 1 }, ev: 'craft' });
});
const ARR_STR = [3, 7, 12, 19, 28, 40, 54], ARR_VAL = [1, 2, 3, 6, 12, 28, 60];
TIERS.forEach((t, i) => {
  mk('arrow_' + t.id, { name: t.name + ' arrows', ic: 'arrow_ammo', col: t.col, val: ARR_VAL[i], type: 'ammo', slot: 'ammo', req: { ranged: t.equip }, b: { rngStr: ARR_STR[i] }, tier: i, buy: Math.ceil(ARR_VAL[i] * 2.5) + 1 });
  addR({ id: 'craft_arrow_' + t.id, skill: 'crafting', tab: 'Arrows', name: t.name + ' arrows (12)', lvl: t.bar + 1, xp: 12 + i * 12, t: 2400, in: { ['bar_' + t.id]: 1, feather: 5 }, out: { ['arrow_' + t.id]: 12 }, ev: 'craft' });
});

/* Robes (shop and boss only) */
const ROBES = [
  { id: 'apprentice', name: 'Apprentice', col: '#7f8cff', req: 1, P: 3, base: 40 },
  { id: 'adept', name: 'Adept', col: '#5f93df', req: 20, P: 7, base: 160 },
  { id: 'mystic', name: 'Mystic', col: '#9b87e0', req: 40, P: 13, base: 520 },
  { id: 'archmage', name: 'Archmage', col: '#d98ad1', req: 60, P: 21, base: 1700 },
];
ROBES.forEach((r, i) => [['head', 'hood', .4, 'helm'], ['body', 'robe top', 1, 'body'], ['legs', 'robe bottom', .7, 'legs']].forEach(([slot, label, f, ic]) =>
  mk(`robe_${r.id}_${slot}`, { name: `${r.name} ${label}`, ic, col: r.col, val: Math.round(r.base * f), type: 'gear', slot, req: { magic: r.req }, b: { def: Math.round(r.P * f * .5), mag: Math.round(r.P * f * 1.3) }, tier: i })));

/* Jewellery */
const JEW = [['sapphire', 20, 24, { mag: 4 }, { mag: 7, def: 2 }], ['emerald', 27, 31, { rng: 4 }, { rng: 7, def: 2 }], ['ruby', 34, 40, { str: 4 }, { str: 7, atk: 3 }], ['diamond', 43, 50, { atk: 3, def: 3, str: 3 }, { atk: 6, str: 6, def: 6, rng: 4, mag: 4 }]];
JEW.forEach(([g, rl, al, rb, ab], i) => {
  const gi = GEMS[i], rxp = [40, 55, 70, 100][i], axp = [60, 80, 100, 150][i];
  mk('ring_' + g, { name: `${gi[1]} ring`, ic: 'ring', col: gi[2], val: [150, 320, 560, 1400][i], type: 'gear', slot: 'ring', b: rb, tier: i });
  mk('amulet_' + g, { name: `${gi[1]} amulet`, ic: 'amulet', col: gi[2], val: [260, 520, 900, 2200][i], type: 'gear', slot: 'amulet', b: ab, tier: i });
  addR({ id: 'craft_ring_' + g, skill: 'crafting', tab: 'Jewellery', name: `${gi[1]} ring`, lvl: rl, xp: rxp, t: 2600, in: { bar_gold: 1, ['gem_' + g]: 1 }, out: { ['ring_' + g]: 1 }, ev: 'craft' });
  addR({ id: 'craft_amulet_' + g, skill: 'crafting', tab: 'Jewellery', name: `${gi[1]} amulet`, lvl: al, xp: axp, t: 2800, in: { bar_gold: 1, ['gem_' + g]: 1 }, out: { ['amulet_' + g]: 1 }, ev: 'craft' });
});

mk('cloth', { name: 'Woollen cloth', ic: 'hide', col: '#efe8d8', val: 30, type: 'resource' });
addR({ id: 'craft_cloth', skill: 'crafting', tab: 'Leather', name: 'Woollen cloth', lvl: 12, xp: 25, t: 2200, in: { wool: 2 }, out: { cloth: 1 }, ev: 'craft' });
/* Hunting preparation (Nov 2026): leather string from a cowhide, then wooden traps. Held traps are your first hunting gear. */
mk('string', { name: 'Leather string', ic: 'bit', col: '#c8a070', val: 3, type: 'craft', sub: 'Cut from cowhide. Ties traps and strings bows.' });
mk('wooden_trap', { name: 'Wooden trap', ic: 'bit', col: '#a8784a', val: 9, type: 'craft', trap: true, sub: 'Starting hunting gear: each one held adds 5% Hunting XP (up to three).' });
addR({ id: 'craft_string', skill: 'crafting', tab: 'Leather', name: 'Leather string', lvl: 1, xp: 6, t: 1800, in: { cowhide: 1 }, out: { string: 3 }, ev: 'craft' });
addR({ id: 'craft_trap', skill: 'crafting', tab: 'Leather', name: 'Wooden trap', lvl: 2, xp: 12, t: 2400, in: { log_normal: 2, string: 1 }, out: { wooden_trap: 1 }, ev: 'craft' });
/* Wooden shields (Nov 2026): a lighter alternative to metal kiteshields. About 60% of the defence of the metal shield at
   the same requirement, plus a ranged or magic bonus, so archers and casters have a reason to carry one. */
D.WOOD_SHIELDS = [
  ['hazel', 'Hazel buckler', 5, 1, { def: 1, rng: 1 }], ['ash', 'Ash round shield', 24, 12, { def: 3, mag: 2 }],
  ['palm', 'Palm wicker shield', 29, 15, { def: 4, rng: 3 }], ['cedar', 'Cedar heater', 42, 25, { def: 7, mag: 4 }],
  ['pine', 'Pine tower shield', 54, 32, { def: 9, rng: 5 }], ['mangrove', 'Mangrove ward', 69, 42, { def: 12, mag: 7 }],
  ['cinderbark', 'Cinderbark shield', 82, 50, { def: 17, rng: 9 }], ['windpine', 'Windpine aegis', 93, 56, { def: 20, mag: 11 }],
  ['wraithbark', 'Wraithbark bulwark', 99, 60, { def: 22, rng: 8, mag: 8 }]
];
D.WOOD_SHIELDS.forEach(([log, name, lvl, dreq, b], i) => {
  const id = log + '_shield', val = Math.round(14 * Math.pow(1.62, i) + lvl * 2);
  mk(id, { name, ic: 'shield', col: (WOOD.find(w => w[0] === log) || [])[3] || '#a07a4f', val, type: 'gear', slot: 'shield', req: { defence: dreq }, b, tier: i, wood: true });
  addR({ id: 'craft_' + id, skill: 'crafting', tab: 'Shields', name, lvl, xp: Math.round(20 + lvl * 2.2), t: 2800, in: { ['log_' + log]: 4, string: 2 }, out: { [id]: 1 }, ev: 'craft' });
});
/* Skilling charms: amulets that make one non-combat skill faster (gathering) or more rewarding (making). A real
   alternative to combat amulets in the same slot, which saved preparations make easy to swap. */
D.CHARMS = [
  ['flint', 'Flint charm', 'woodcutting', 'speed', .05], ['quartz', 'Quartz charm', 'fishing', 'speed', .05],
  ['amber', 'Amber charm', 'farming', 'xp', .06], ['jet', 'Jet charm', 'thieving', 'speed', .05],
  ['jade', 'Jade charm', 'cooking', 'xp', .06], ['bloodstone', 'Bloodstone charm', 'mining', 'speed', .06],
  ['moonstone', 'Moonstone charm', 'research', 'xp', .07], ['bogiron', 'Bog-iron charm', 'smithing', 'xp', .07],
  ['obsidian', 'Obsidian charm', 'crafting', 'xp', .07], ['skyglass', 'Skyglass charm', 'herbalism', 'xp', .08],
  ['nullite', 'Nullite charm', 'hunting', 'xp', .08], ['silver', 'Silver charm', 'exploration', 'xp', .06]
];
D.CHARMS.forEach(([ore, name, skill, kind, amt]) => {
  const o = ORES.find(x => x[0] === ore), lvl = Math.min(99, o[4] + 2), id = ore + '_charm';
  mk(id, { name, ic: 'amulet', col: o[2], val: Math.round(o[7] * 4 + 10), type: 'gear', slot: 'amulet', b: {}, charm: { skill, [kind]: amt }, sub: `${kind === 'speed' ? `${Math.round(amt * 100)}% faster` : `+${Math.round(amt * 100)}% XP in`} ${skill === 'research' ? 'Scholarship' : skill.charAt(0).toUpperCase() + skill.slice(1)} while worn` });
  addR({ id: 'craft_' + id, skill: 'crafting', tab: 'Jewellery', name, lvl, xp: Math.round(15 + lvl * 1.8), t: 2600, in: { ['ore_' + ore]: 3, string: 1, ...(ore === 'nullite' ? { ore_voidstone: 1 } : {}) }, out: { [id]: 1 }, ev: 'craft' });
});
/* older materials stay useful: wolf pelts line the pine tower shield; gloomwood braces the wraithbark bulwark */
D.RECIPES.craft_pine_shield.in.wolf_pelt = 1; D.RECIPES.craft_wraithbark_shield.in.log_gloomwood = 2;

/* Boss trophies */
mk('chief_helm', { name: "Grubnash's war-helm", ic: 'helm', col: '#8fbf6a', val: 600, type: 'gear', slot: 'head', req: { defence: 5 }, b: { def: 14, str: 3 }, rare: 1 });
mk('barnacle_cutlass', { name: "Barnacle's cutlass", ic: 'sword', col: '#6fc7d8', val: 2400, type: 'gear', slot: 'weapon', style: 'melee', req: { attack: 22 }, b: { atk: 26, str: 24 }, rare: 1 });
mk('frostmaw_pendant', { name: 'Frostmaw pendant', ic: 'amulet', col: '#bfe6ff', val: 6000, type: 'gear', slot: 'amulet', b: { atk: 7, str: 7, def: 8, rng: 5, mag: 5 }, rare: 1 });
mk('witch_staff', { name: "Morwenna's bog staff", ic: 'staff', col: '#b79cff', val: 14000, type: 'gear', slot: 'weapon', style: 'magic', req: { magic: 50 }, b: { mag: 58 }, rare: 1 });
mk('emberfang_bow', { name: 'Emberfang bow', ic: 'bow', col: '#ff8a4a', val: 45000, type: 'gear', slot: 'weapon', style: 'ranged', req: { ranged: 70 }, b: { rng: 84 }, rare: 1 });

/* Tools: tier 0 is free and always owned */
D.TOOL_TIERS = ['Basic', 'Reinforced', 'Steel-tipped', 'Mithril', 'Adamant', 'Runic'];
D.TOOL_PRICE = [0, 120, 700, 3500, 16000, 65000];
D.TOOL_SPEED = [0, .08, .16, .25, .35, .45];
D.TOOLS = [['rod', 'fishing', 'rod', 'Fishing rod'], ['axe', 'woodcutting', 'woodcutting', 'Axe'], ['pick', 'mining', 'mining', 'Pickaxe'], ['gloves', 'thieving', 'glove', 'Thief gloves'], ['hoe', 'farming', 'hoe', 'Hoe']];
D.TOOLS.forEach(([k, sk, ic, label]) => { for (let t = 1; t <= 5; t++) mk(`tool_${k}_${t}`, { name: `${D.TOOL_TIERS[t]} ${label.toLowerCase()}`, ic, col: TIERS[t].col, val: Math.round(D.TOOL_PRICE[t] / 3), buy: D.TOOL_PRICE[t], type: 'tool', toolSkill: sk, tier: t }); });

/* ---------- Spells ---------- */
D.SPELLS = [
  { id: 'spark', name: 'Spark', lvl: 1, max: 4, runes: 1 },
  { id: 'frost', name: 'Frost Bolt', lvl: 15, max: 9, runes: 2 },
  { id: 'fire', name: 'Fire Surge', lvl: 35, max: 16, runes: 3 },
  { id: 'storm', name: 'Storm Lance', lvl: 55, max: 25, runes: 4 },
  { id: 'aether', name: 'Aether Blast', lvl: 75, max: 36, runes: 5 },
];
D.ALCH = [{ id: 'low', name: 'Low Alchemy', lvl: 21, mult: 1.5, runes: 2, xp: 31 }, { id: 'high', name: 'High Alchemy', lvl: 55, mult: 2, runes: 3, xp: 65 }];

/* ---------- Towns ---------- */
D.TOWNS = [
  { id: 'willowbrook', name: 'Willowbrook', tag: 'Farming hamlet', col: '#82b957', x: 100, y: 400, boss: 'grubnash', blurb: 'Thatched roofs, reed ponds and one very loud goblin problem. A gentle place to learn your trade.' },
  { id: 'mossbarrow', name: 'Mossbarrow', tag: 'Market village', col: '#b8864f', x: 215, y: 290, boss: 'oldtusk', blurb: 'Hedgerows, haystacks and the best market for seeds and livestock in the realm. Something huge roots in the woods.' },
  { id: 'saltmere', name: 'Saltmere', tag: 'Harbour town', col: '#4fb3c8', x: 345, y: 200, boss: 'barnacle', blurb: 'Gulls, rope and tar. Smugglers work the docks, and the fish run fat in the cold water.' },
  { id: 'ironpeak', name: 'Ironpeak Hold', tag: 'Dwarven mountain hold', col: '#a7b4c0', x: 480, y: 325, boss: 'frostmaw', blurb: 'A hold of hammers cut into the mountain. Rich veins, frozen tarns and hungry trolls.' },
  { id: 'gloomfen', name: 'Gloomfen', tag: 'Haunted marsh', col: '#9b87e0', x: 600, y: 165, boss: 'morwenna', blurb: 'Lantern light on black water. The dead walk here, and the witch of the fen walks with them.' },
  { id: 'emberfall', name: 'Emberfall Citadel', tag: 'Volcanic stronghold', col: '#e8703a', x: 720, y: 335, boss: 'pyrrhax', blurb: 'A citadel on a living volcano. Only the finest adventurers come back from the Wyrm.' },
  { id: 'skyreach', name: 'Skyreach', tag: 'Monastery in the clouds', col: '#9fd8ff', x: 815, y: 150, boss: 'zephyrion', blurb: 'Rope bridges between floating peaks. The monks guard secrets older than the realm.' },
  { id: 'hollow', name: 'The Hollow Crown', tag: 'Fallen kingdom', col: '#8a5ad8', x: 905, y: 335, boss: 'hollowking', blurb: 'A drowned throne room under a violet sky. The last road ends here.' },
];
D.TOWN = Object.fromEntries(D.TOWNS.map((t, i) => (t.idx = i, [t.id, t])));

/* ---------- Monsters ---------- */
D.MON = {}; D.MONLIST = [];
const mon = (id, name, town, cl, hp, max, att, def, coins, col, drops, boss) => { hp = Math.round(hp * .62); max = Math.max(1, Math.round(max * .72)); if (boss && boss.special) boss.special.mult = 1.5; const m = { id, name, town, cl, hp, max, att, def, coins, col, drops: drops || [], boss }; D.MON[id] = m; D.MONLIST.push(m); };
mon('chicken', 'Chicken', 'willowbrook', 1, 3, 1, 1, 1, [0, 3], '#e8d8a0', [['feather', [4, 9], .85]]);
mon('rat', 'Giant rat', 'willowbrook', 3, 5, 1, 2, 2, [0, 2], '#a6998a', []);
mon('goblin', 'Goblin', 'willowbrook', 5, 7, 2, 3, 2, [3, 14], '#6fb35e', [['rune', [1, 3], .08]]);
mon('cow', 'Cow', 'willowbrook', 8, 10, 2, 3, 4, [0, 5], '#d6c2a4', [['cowhide', [1, 1], 1]]);
/* Bosses 2-8 retuned Nov 2026 with field-guide counters (scripts/sim-bosses.cjs COUNTER=1): fully prepared ~75-95% at the requirement. */
/* First boss, tuned Nov 2026 (scripts/sim-opening.cjs): a beginner reaches combat 8 in ~21 minutes; prepared (bronze armour, ~15 cooked fish) wins about two times in three. */
mon('grubnash', 'Grubnash the Goblin Chief', 'willowbrook', 12, 32, 4, 7, 6, [80, 160], '#8fbf6a', [['cowhide', [2, 3], .5], ['chief_helm', [1, 1], .12]], { req: 8, first: 'chief_helm', special: { every: 4, mult: 1.8, name: 'War cry' }, short: 'Grubnash' });
mon('boar', 'Wild boar', 'mossbarrow', 10, 14, 3, 9, 8, [2, 10], '#9a6a4a', [['boar_tusk', [1, 1], .5]]);
mon('wolf', 'Grey wolf', 'mossbarrow', 13, 18, 3, 12, 10, [0, 4], '#9aa0a8', [['wolf_pelt', [1, 1], .7]]);
mon('scarecrow', 'Haunted scarecrow', 'mossbarrow', 16, 22, 4, 14, 14, [5, 20], '#d9b860', [['seed_wheat', [1, 3], .25], ['seed_pumpkin', [1, 1], .05]]);
mon('oldtusk', 'Old Tusk the Boar King', 'mossbarrow', 26, 96, 6, 18, 16, [150, 300], '#b07a4a', [['boar_tusk', [2, 4], 1], ['tusk_charm', [1, 1], .12]], { req: 18, first: 'tusk_charm', special: { every: 4, mult: 1.6, name: 'Trampling charge' }, short: 'Old Tusk' });
mon('crab', 'Rock crab', 'saltmere', 12, 18, 3, 9, 14, [0, 8], '#d9825a', [['gem_sapphire', [1, 1], .03]]);
mon('bandit', 'Bandit', 'saltmere', 18, 26, 5, 16, 14, [14, 40], '#b08a6a', [['rune', [2, 5], .15], ['gem_sapphire', [1, 1], .03]]);
mon('smuggler', 'Smuggler', 'saltmere', 22, 32, 6, 20, 18, [20, 60], '#8aa0b0', [['rune', [2, 6], .15], ['feather', [3, 8], .3]]);
mon('pirate', 'Pirate', 'saltmere', 28, 42, 8, 26, 24, [35, 95], '#c46a4a', [['gem_emerald', [1, 1], .03], ['old_bone', [1, 1], .3]]);
mon('barnacle', 'Captain Barnacle', 'saltmere', 36, 100, 10, 28, 26, [250, 500], '#6fc7d8', [['gem_emerald', [1, 2], .5], ['barnacle_cutlass', [1, 1], .12]], { req: 25, first: 'barnacle_cutlass', special: { every: 4, mult: 1.7, name: 'Cannon volley' }, short: 'Barnacle' });
mon('bat', 'Cave bat', 'ironpeak', 30, 30, 5, 25, 18, [10, 30], '#7a6a8a', []);
mon('icewolf', 'Ice wolf', 'ironpeak', 38, 42, 8, 36, 32, [0, 10], '#bfe0f0', [['frost_pelt', [1, 1], .8]]);
mon('raider', 'Dwarf raider', 'ironpeak', 42, 50, 9, 40, 40, [60, 150], '#c0a070', [['ore_coal', [2, 5], .3], ['gem_ruby', [1, 1], .03]]);
mon('troll', 'Mountain troll', 'ironpeak', 48, 70, 12, 46, 44, [80, 200], '#8a9a78', [['troll_bone', [1, 1], .7], ['gem_ruby', [1, 1], .04]]);
mon('frostmaw', 'Frostmaw the Ice Troll', 'ironpeak', 56, 298, 21, 46, 42, [600, 1100], '#bfe6ff', [['frost_pelt', [3, 5], 1], ['frostmaw_pendant', [1, 1], .1]], { req: 45, first: 'frostmaw_pendant', special: { every: 4, mult: 1.8, name: 'Glacier slam' }, short: 'Frostmaw' });
mon('zombie', 'Bog zombie', 'gloomfen', 52, 80, 12, 50, 40, [60, 150], '#7a9a6a', [['old_bone', [1, 1], .8]]);
mon('skeleton', 'Marsh skeleton', 'gloomfen', 56, 90, 14, 56, 54, [70, 170], '#cfd6d4', [['old_bone', [1, 2], .9], ['gem_ruby', [1, 1], .04]]);
mon('bogsnapper', 'Bogsnapper', 'gloomfen', 62, 110, 16, 62, 60, [0, 30], '#5f8a4a', [['bogscale', [1, 1], .8]]);
mon('wraith', 'Fen wraith', 'gloomfen', 68, 120, 18, 70, 62, [150, 320], '#9b87e0', [['rune', [6, 14], .4], ['gem_diamond', [1, 1], .02]]);
mon('morwenna', 'Morwenna the Bog Witch', 'gloomfen', 76, 300, 25, 62, 58, [1500, 2600], '#b79cff', [['bogscale', [3, 6], 1], ['gem_diamond', [1, 2], .5], ['witch_staff', [1, 1], .1]], { req: 65, first: 'witch_staff', special: { every: 4, mult: 1.8, name: 'Hex' }, short: 'Morwenna' });
mon('imp', 'Fire imp', 'emberfall', 64, 90, 15, 62, 56, [80, 200], '#ff8a4a', [['rune', [4, 10], .35]]);
mon('hound', 'Lava hound', 'emberfall', 72, 130, 20, 72, 66, [120, 300], '#e0573f', [['ember_core', [1, 1], .03]]);
mon('drake', 'Ember drake', 'emberfall', 80, 170, 25, 82, 78, [200, 480], '#58c27e', [['drakehide', [1, 1], .85], ['gem_diamond', [1, 1], .04]]);
mon('emberlord', 'Cinder knight', 'emberfall', 86, 220, 30, 88, 84, [300, 650], '#c88a5a', [['ember_core', [1, 1], .06], ['gem_diamond', [1, 1], .05]]);
mon('pyrrhax', 'Pyrrhax the Ember Wyrm', 'emberfall', 98, 709, 35, 82, 78, [6000, 9000], '#ff6a3a', [['wyrm_scale', [1, 1], 1], ['ember_core', [2, 4], 1], ['emberfang_bow', [1, 1], .1]], { req: 85, first: 'emberfang_bow', special: { every: 4, mult: 1.7, name: 'Wyrmfire' }, short: 'Pyrrhax' });
mon('hawk', 'Storm hawk', 'skyreach', 88, 200, 28, 90, 80, [300, 700], '#9fd8ff', [['feather', [10, 30], .8], ['gem_diamond', [1, 1], .05]]);
mon('golem', 'Sky golem', 'skyreach', 94, 260, 32, 96, 100, [400, 900], '#c8c0a8', [['ore_astralite', [1, 2], .3]]);
mon('wyvern', 'Cloud wyvern', 'skyreach', 100, 300, 36, 100, 95, [500, 1100], '#e2d4ff', [['drakehide', [1, 2], .6], ['ember_core', [1, 1], .08]]);
mon('zephyrion', 'Zephyrion the Storm Roc', 'skyreach', 110, 613, 54, 92, 88, [10000, 15000], '#bfe8ff', [['ore_astralite', [3, 6], 1], ['storm_feather', [1, 1], .1]], { req: 95, first: 'storm_feather', special: { every: 4, mult: 1.6, name: 'Thunder dive' }, short: 'Zephyrion' });
mon('voidknight', 'Void knight', 'hollow', 104, 320, 38, 104, 104, [700, 1500], '#6a4aa8', [['ore_voidstone', [1, 1], .3]]);
mon('shade', 'Hollow shade', 'hollow', 108, 340, 40, 110, 100, [800, 1700], '#3a2a5a', [['rune', [20, 40], .5]]);
mon('horror', 'Abyssal horror', 'hollow', 112, 380, 42, 112, 108, [1000, 2000], '#8a3a6a', [['gem_diamond', [1, 2], .2], ['wyrm_scale', [1, 1], .03]]);
mon('hollowking', 'The Hollow King', 'hollow', 126, 935, 50, 104, 100, [25000, 40000], '#b08aff', [['ore_voidstone', [3, 6], 1], ['hollow_crown', [1, 1], .1]], { req: 97, first: 'hollow_crown', special: { every: 4, mult: 1.6, name: 'Crown of sorrow' }, short: 'The Hollow King' });

/* ---------- Combat loot: every monster also rolls on its town's loot table ---------- */
mk('coin_pouch', { name: 'Coin pouch', ic: 'pouch', col: '#f3d58a', val: 0, type: 'container' });
mk('treasure_chest', { name: 'Treasure chest', ic: 'pouch', col: '#ffb84a', val: 0, type: 'container', rare: 1 });
D.RARITY = [['common', 'Common', '#c9c3b3', .2], ['uncommon', 'Uncommon', '#5cc08a', .05], ['rare', 'Rare', '#5f9bff', .012], ['epic', 'Epic', '#c07aff', 0]];
D.rarityOf = p => D.RARITY.find(r => p >= r[3]);
const TOWN_LOOT = {
  willowbrook: { gear: [0], extra: [['seed_potato', [1, 3], .04], ['bread', [1, 2], .03], ['gem_sapphire', [1, 1], .008]] },
  mossbarrow: { gear: [0, 1], extra: [['seed_onion', [1, 3], .04], ['seed_cabbage', [1, 2], .025], ['gem_sapphire', [1, 1], .01]] },
  saltmere: { gear: [1], extra: [['arrow_bronze', [5, 15], .04], ['raw_trout', [1, 3], .04], ['gem_emerald', [1, 1], .008]] },
  ironpeak: { gear: [2], extra: [['ore_coal', [2, 4], .05], ['arrow_iron', [5, 15], .03], ['gem_ruby', [1, 1], .008]] },
  gloomfen: { gear: [3], extra: [['seed_goldleaf', [1, 2], .03], ['rune', [5, 12], .05], ['gem_diamond', [1, 1], .005]] },
  emberfall: { gear: [4], extra: [['ember_core', [1, 1], .008], ['arrow_mithril', [5, 15], .03], ['gem_diamond', [1, 1], .008]] },
  skyreach: { gear: [5], extra: [['seed_starfruit', [1, 1], .02], ['gem_diamond', [1, 2], .01]] },
  hollow: { gear: [5, 6], extra: [['ore_voidstone', [1, 1], .02], ['gem_diamond', [1, 2], .012]] },
};
D.TOWN_GEAR = {};
Object.entries(TOWN_LOOT).forEach(([town, L]) => {
  const gear = L.gear.flatMap(t => [...PIECES.map(p => `${TIERS[t].id}_${p[1]}`), `bow_${BW[t][0]}`, `staff_${BW[t][0]}`]).filter(id => ITEMS[id]);
  D.TOWN_GEAR[town] = gear;
  D.MONLIST.filter(m => m.town === town).forEach(m => {
    const add = (id, n, p) => { if (!m.drops.some(d => d[0] === id)) m.drops.push([id, n, p]); };
    if (m.boss) { add('coin_pouch', [1, 1], .5); add('treasure_chest', [1, 1], .12); gear.forEach(id => add(id, [1, 1], .02)); }
    else { add('coin_pouch', [1, 1], .05); add('treasure_chest', [1, 1], .004); gear.forEach(id => add(id, [1, 1], .006 / L.gear.length)); L.extra.forEach(([id, n, p]) => add(id, n, p)); }
  });
});

/* ---------- Unique gear (Nov 2026): a signature effect instead of bigger numbers ----------
   Each unique carries `unique: { key, name, text }`; the combat engine reads the keys of equipped items (DQ.uniqueFx).
   New uniques have modest stats for their level, so wearing one is a choice, not an automatic upgrade. They drop rarely
   from one regional monster, with a bad-luck guarantee on the first copy (engine.js kill). Boss trophies gain effects too. */
const U = (key, name, text) => ({ key, name, text });
Object.entries({
  chief_helm: U('roar', 'Battle roar', 'The first enemy attack of every fight misses.'),
  tusk_charm: U('hide', 'Thick hide', 'Normal enemy attacks deal 15% less damage.'),
  barnacle_cutlass: U('riposte', 'Riposte', 'When you are hit, 20% chance to strike straight back for up to your max hit.'),
  frostmaw_pendant: U('slow', 'Frostbite', 'Enemies wait 15% longer between attacks.'),
  witch_staff: U('curse', 'Bog hex', 'Each spell that lands weakens the enemy: 5% softer hits per stack, up to 15%.'),
  emberfang_bow: U('ember', 'Ember arrows', 'Every shot adds fire damage of up to a quarter of your max hit; more against fire-weak foes, less against fire-resistant ones.'),
  storm_feather: U('swift', 'Gale', 'You attack 10% faster.'),
  hollow_crown: U('sovereign', 'Crown of sorrow', 'Heal 8% of the damage you deal; boss specials hit 20% softer.')
}).forEach(([id, u]) => { if (ITEMS[id]) ITEMS[id].unique = u; });
const uq = (id, o) => mk(id, Object.assign({ type: 'gear', rare: 1 }, o));
uq('leechfang', { name: 'Leechfang', ic: 'dagger', col: '#9a3a4a', val: 400, slot: 'weapon', wtype: 'dagger', style: 'melee', req: { attack: 12 }, b: { atk: 10, str: 5 }, unique: U('lifesteal', 'Leech', 'Heal 20% of the damage you deal.'), flavour: 'The wolves of Mossbarrow carry it off from careless travellers. It never quite stops being warm.' });
uq('wyrdwood_bow', { name: 'Wyrdwood longbow', ic: 'bow', col: '#6a8a4a', val: 450, slot: 'weapon', style: 'ranged', req: { ranged: 18 }, b: { rng: 11 }, unique: U('marked', "Hunter's mark", 'The first three shots of every fight always hit, for 50% more damage.'), flavour: 'Cut from a tree the scarecrows guard. It hums when it finds its mark.' });
uq('thornback_buckler', { name: 'Thornback buckler', ic: 'shield', col: '#c87a5a', val: 500, slot: 'shield', req: { defence: 15 }, b: { def: 7 }, unique: U('thorns', 'Thorns', 'Enemies take 35% of the damage they deal to you.'), flavour: 'A rock crab shell, spines and all, strapped to a board.' });
uq('vipers_kiss', { name: "Viper's kiss", ic: 'sword', col: '#5aa86a', val: 900, slot: 'weapon', wtype: 'sword', style: 'melee', req: { attack: 20 }, b: { atk: 13, str: 10 }, unique: U('poison', 'Venom', 'Each hit adds a poison stack (up to 3). Whenever the enemy attacks, each stack deals 12% of your max hit.'), flavour: 'A coast-road bandit’s favourite. The groove along the blade is not decoration.' });
uq('gale_sabre', { name: 'Gale sabre', ic: 'sword', col: '#8fd0e0', val: 1400, slot: 'weapon', wtype: 'sword', style: 'melee', req: { attack: 28 }, b: { atk: 20, str: 16 }, unique: U('twin', 'Twin cut', 'Each hit has a 20% chance to strike again for a full second hit.'), flavour: 'Pirates swear it was forged in a storm. It is certainly light enough.' });
uq('wardens_greathelm', { name: "Warden's greathelm", ic: 'helm', col: '#7a8aa0', val: 1500, slot: 'head', req: { defence: 25 }, b: { def: 9 }, unique: U('bulwark', 'Bulwark', 'Boss special attacks hit 35% softer.'), flavour: 'Saltmere’s harbour wardens wore these on the sea wall. This one was given, not found.' });
uq('smugglers_knot', { name: "Smuggler's knot", ic: 'ring', col: '#b89a5a', val: 1500, slot: 'ring', b: {}, unique: U('fortune', "Smuggler's luck", '+25% chance of item drops and +5% coins. No combat stats.'), flavour: 'A ring of tarred rope. Mother Silt’s people will know you by it.' });
uq('thunderclap_maul', { name: 'Thunderclap maul', ic: 'hammer', col: '#c8b860', val: 4000, slot: 'weapon', wtype: 'hammer', style: 'melee', req: { attack: 40 }, b: { atk: 24, str: 38 }, unique: U('stun', 'Thunderclap', 'Hits have a 12% chance to stun: the enemy loses its next attack.'), flavour: 'Trolls use it to crack ice. It cracks most things.' });
uq('stormcaller_staff', { name: 'Stormcaller staff', ic: 'staff', col: '#9ab8ff', val: 3500, slot: 'weapon', style: 'magic', req: { magic: 40 }, b: { mag: 25 }, unique: U('arc', 'Arc', '20% chance for a spell to arc and hit again for half damage.'), flavour: 'Raiders stole it from a weather-witch. The weather has not forgiven them.' });
uq('berserkers_torc', { name: "Berserker's torc", ic: 'amulet', col: '#c86a3a', val: 6000, slot: 'amulet', b: { str: 6 }, unique: U('fury', 'Fury', 'Deal 10% more damage, rising to 40% more as your health falls.'), flavour: 'Pulled from the fen with its owner still attached. He did not want to let go.' });
uq('salamander_coat', { name: 'Salamander coat', ic: 'body', col: '#e0703a', val: 20000, slot: 'body', req: { defence: 70 }, b: { def: 40 }, lth: 1, unique: U('laststand', 'Last stand', 'Once per fight, a blow that would defeat you leaves you at 1 health instead.'), flavour: 'Drake leather that remembers being on fire, and refuses to do it again.' });
/* what each signature effect is good for: shown with the item so a find can suggest a plan */
D.UNIQUE_USE = { lifesteal: 'long fights when food is short', marked: 'a fast opening against tough targets', thorns: 'enemies that hit often', poison: 'long boss fights', twin: 'quick kills and steady damage', bulwark: 'bosses with heavy special attacks', fortune: 'farming drops and coins rather than hard fights', stun: 'bosses whose attacks you would rather skip', arc: 'magic users who want more damage', fury: 'bold play at low health', laststand: 'a safety net in a fight you might lose', roar: 'blunting the opening blow', hide: 'enemies that land many small hits', riposte: 'trading blows with hard hitters', slow: 'fights where fewer enemy attacks matter most', curse: 'mages in long fights', ember: 'fire-weak enemies, with a bow', swift: 'more attacks in every fight', sovereign: 'sustained boss fights' };
/* rare drops from one regional monster each (first copy guaranteed after about 2.5x the expected number of defeats) */
[['wolf', 'leechfang', 1 / 150], ['scarecrow', 'wyrdwood_bow', 1 / 150], ['crab', 'thornback_buckler', 1 / 160], ['bandit', 'vipers_kiss', 1 / 180], ['pirate', 'gale_sabre', 1 / 200],
 ['troll', 'thunderclap_maul', 1 / 220], ['raider', 'stormcaller_staff', 1 / 220], ['zombie', 'berserkers_torc', 1 / 250], ['drake', 'salamander_coat', 1 / 260]]
  .forEach(([mon, id, p]) => { if (D.MON[mon]) D.MON[mon].drops.push([id, [1, 1], p]); });

/* ---------- Shops ---------- */
const metal = (...ts) => ts.flatMap(i => PIECES.map(p => `${TIERS[i].id}_${p[1]}`));
const bows = (...ws) => ws.flatMap(i => [`bow_${BW[i][0]}`, `staff_${BW[i][0]}`]);
const robes = (...rs) => rs.flatMap(i => ['head', 'body', 'legs'].map(s => `robe_${ROBES[i].id}_${s}`));
const tools = (...ts) => ts.flatMap(t => D.TOOLS.map(([k]) => `tool_${k}_${t}`));
const arrows = (...ts) => ts.map(i => 'arrow_' + TIERS[i].id);
const seeds = (...ids) => ids.map(c => 'seed_' + c);
D.SHOPS = {
  willowbrook: ['bread', 'feather', 'rune', 'feed', ...seeds('potato', 'onion'), ...tools(1), ...metal(0), ...arrows(0), ...bows(0), ...robes(0)],
  mossbarrow:  ['bread', 'feather', 'rune', 'feed', ...seeds('potato', 'onion', 'cabbage', 'wheat', 'strawberry', 'pumpkin'), ...tools(1, 2), ...metal(0, 1), ...arrows(0, 1), ...bows(0, 1), ...robes(0)],
  saltmere:    ['bread', 'feather', 'rune', 'feed', ...seeds('cabbage', 'wheat'), ...tools(1, 2), ...metal(1), ...arrows(1), ...bows(1), ...robes(1)],
  ironpeak:    ['bread', 'feather', 'rune', 'feed', ...seeds('pumpkin', 'goldleaf'), ...tools(2, 3), ...metal(2), ...arrows(2), ...bows(2), ...robes(1, 2)],
  gloomfen:    ['bread', 'feather', 'rune', 'feed', ...seeds('goldleaf', 'sunbloom'), ...tools(3, 4), ...metal(3), ...arrows(3), ...bows(3, 4), ...robes(2, 3)],
  emberfall:   ['bread', 'feather', 'rune', 'feed', ...seeds('sunbloom', 'moonmelon'), ...tools(4, 5), ...metal(4, 5), ...arrows(4, 5), ...bows(5), ...robes(3)],
  skyreach:    ['bread', 'feather', 'rune', 'feed', ...seeds('moonmelon', 'starfruit'), ...tools(5), ...metal(5, 6), ...arrows(5, 6), ...bows(5, 6), ...robes(3)],
  hollow:      ['bread', 'feather', 'rune', 'feed', ...seeds('starfruit'), ...tools(5), ...metal(6), ...arrows(6), ...bows(6), ...robes(3)],
};
Object.values(ITEMS).forEach(it => { if (!it.buy) it.buy = Math.max(1, Math.ceil(it.val * 2.5)); });

/* ---------- Quests ---------- */
const Q = (id, town, name, giver, adv, req, blurb, obj, reward) => ({ id, town, name, giver, adv, req, blurb, obj, reward });
D.QUESTS = [
  Q('first_steps', 'willowbrook', 'First Steps', 'Elder Wren', 1, null, 'Goblins smashed the winch on the village well and ran off with the bucket. Elder Wren needs timber for a new winch, and you need something in your belly before you go after them. Catch some shrimp and chop a few logs.',
    [{ ev: 'catch', key: 'shrimp', n: 5, label: 'Catch 5 shrimp' }, { ev: 'chop', key: 'normal', n: 5, label: 'Chop 5 logs' }], { xp: { fishing: 80, woodcutting: 80 }, coins: 60 }),
  Q('goblin_menace', 'willowbrook', 'Goblin Menace', 'Sergeant Orrin', 1, null, 'Goblins keep raiding the east farms. Thin their numbers.',
    [{ ev: 'kill', key: 'goblin', n: 6, label: 'Defeat 6 goblins' }], { xp: { strength: 250, hitpoints: 120 }, coins: 120 }),
  Q('hungry_cook', 'willowbrook', 'The Hungry Cook', 'Mabel the Cook', 3, null, 'Mabel has a banquet tonight and an empty larder. Bring her cooked shrimp.',
    [{ ev: 'cook', key: 'shrimp', n: 8, label: 'Cook 8 shrimp' }], { xp: { cooking: 350 }, coins: 150 }),
  Q('miners_pick', 'willowbrook', "A Miner's Pick", 'Old Brannoc', 6, null, 'Brannoc lost his pickaxe and his patience. Show him how it is done.',
    [{ ev: 'mine', key: 'copper', n: 6, label: 'Mine 6 copper ore' }, { ev: 'mine', key: 'tin', n: 6, label: 'Mine 6 tin ore' }], { xp: { mining: 300 }, coins: 150, items: { tool_pick_1: 1 } }),
  Q('chiefs_end', 'willowbrook', "The Chief's Last Stand", 'Sergeant Orrin', 6, 'goblin_menace', 'Grubnash leads the goblins from a hill fort. End it. You need combat level 8 to face him.',
    [{ ev: 'boss', key: 'grubnash', n: 1, label: 'Defeat Grubnash the Goblin Chief' }], { xp: { attack: 800, strength: 800, defence: 400 }, coins: 400 }),

  Q('seeds_of_hope', 'mossbarrow', 'Seeds of Hope', 'Granny Bramble', 10, null, 'Granny Bramble lends you a corner of her farm. Show her you can grow something.',
    [{ ev: 'harvest', key: 'potato', n: 10, label: 'Harvest 10 potatoes' }], { xp: { farming: 300 }, coins: 200, items: { seed_onion: 6, feed: 20 } }),
  Q('egg_hunt', 'mossbarrow', 'Egg Hunt', 'Granny Bramble', 11, 'seeds_of_hope', 'The market wants eggs and the hens want feeding. Look after a hen or two.',
    [{ ev: 'collect', key: 'egg', n: 10, label: 'Collect 10 eggs' }, { ev: 'pet', key: '*', n: 5, label: 'Pet your animals 5 times' }], { xp: { farming: 600 }, coins: 400 }),
  Q('boar_hunt', 'mossbarrow', 'Tusks and Trouble', 'Hunter Wynn', 7, null, 'Boars are tearing up the fields. Wynn wants them gone before planting.',
    [{ ev: 'kill', key: 'boar', n: 10, label: 'Defeat 10 wild boars' }, { ev: 'kill', key: 'wolf', n: 6, label: 'Defeat 6 grey wolves' }], { xp: { attack: 500, defence: 500 }, coins: 300 }),
  Q('king_of_the_wood', 'mossbarrow', 'King of the Wood', 'Hunter Wynn', 10, 'boar_hunt', 'Old Tusk has ruled the woods for forty winters. You need combat level 18 to face him.',
    [{ ev: 'boss', key: 'oldtusk', n: 1, label: 'Defeat Old Tusk the Boar King' }], { xp: { attack: 1500, strength: 1500, defence: 1000 }, coins: 700 }),
  Q('crab_cull', 'saltmere', 'Crab Cull', 'Harbourmaster Ilsa', 8, null, 'Rock crabs are chewing the pier posts. Clear them out.',
    [{ ev: 'kill', key: 'crab', n: 10, label: 'Defeat 10 rock crabs' }], { xp: { defence: 700, hitpoints: 300 }, coins: 250 }),
  Q('quick_fingers', 'saltmere', 'Quick Fingers', 'Whisper', 9, 'mq_thieving', 'The dock rats need a lesson in generosity. Practise your light touch.',
    [{ ev: 'thieve', key: '*', n: 15, label: 'Steal successfully 15 times' }], { xp: { thieving: 600 }, coins: 300 }),
  Q('salt_cod', 'saltmere', 'The Salt Cod Supper', 'Chef Piers', 10, null, 'The harbour feast needs twenty plates and Piers has nobody to cook.',
    [{ ev: 'cook', key: '*', n: 20, label: 'Cook 20 fish' }], { xp: { cooking: 900 }, coins: 350 }),
  Q('forged_in_salt', 'saltmere', 'Forged in Salt', 'Smith Tolla', 11, 'mq_smithing', 'Tolla needs bars and nails, in that order.',
    [{ ev: 'smelt', key: '*', n: 15, label: 'Smelt 15 bars' }, { ev: 'smith', key: '*', n: 8, label: 'Smith 8 items' }], { xp: { smithing: 1200 }, coins: 500 }),
  Q('captains_bane', 'saltmere', "Captain's Bane", 'Harbourmaster Ilsa', 16, 'crab_cull', 'Captain Barnacle is shaking down every ship in the bay. You need combat level 25.',
    [{ ev: 'boss', key: 'barnacle', n: 1, label: 'Defeat Captain Barnacle' }], { xp: { attack: 2500, strength: 2500, defence: 2500 }, coins: 1000 }),

  Q('deep_vein', 'ironpeak', 'The Deep Vein', 'Foreman Dagna', 22, null, 'The old vein runs deep and the coal runs out. Dagna needs ore, and plenty.',
    [{ ev: 'mine', key: 'coal', n: 20, label: 'Mine 20 coal' }, { ev: 'mine', key: 'gold', n: 8, label: 'Mine 8 gold ore' }], { xp: { mining: 2500 }, coins: 700 }),
  Q('frozen_catch', 'ironpeak', 'Frozen Catch', 'Hearthkeeper Brunn', 24, null, 'The hold eats lobster at midwinter. Catch and cook enough to feed three hundred dwarves.',
    [{ ev: 'catch', key: 'lobster', n: 12, label: 'Catch 12 lobsters' }, { ev: 'cook', key: 'lobster', n: 12, label: 'Cook 12 lobsters' }], { xp: { fishing: 3000, cooking: 3000 }, coins: 900 }),
  Q('dwarven_steel', 'ironpeak', 'Dwarven Steel', 'Smith Grotta', 26, 'mq_smithing', 'Prove yourself at the forge and the dwarves will call you kin.',
    [{ ev: 'smelt', key: 'bar_steel', n: 10, label: 'Smelt 10 steel bars' }, { ev: 'smith', key: '*', n: 10, label: 'Smith 10 items' }], { xp: { smithing: 3500 }, coins: 1000 }),
  Q('trollbane', 'ironpeak', 'Trollbane', 'Captain Hrod', 30, null, 'Trolls are coming down from the high passes. Hrod wants them sent back.',
    [{ ev: 'kill', key: 'troll', n: 12, label: 'Defeat 12 mountain trolls' }], { xp: { strength: 4000, hitpoints: 2000 }, coins: 1200 }),
  Q('frostmaw_hunt', 'ironpeak', 'The Frostmaw Hunt', 'Captain Hrod', 32, 'trollbane', 'Frostmaw sits on the pass and nothing gets through. You need combat level 45.',
    [{ ev: 'boss', key: 'frostmaw', n: 1, label: 'Defeat Frostmaw the Ice Troll' }], { xp: { attack: 6000, strength: 6000, defence: 6000 }, coins: 2500 }),

  Q('yew_planks', 'gloomfen', 'Lanterns and Yew', 'Boatwright Sorrel', 50, null, 'The fen boats are rotting. Sorrel needs strong yew and a strong back.',
    [{ ev: 'chop', key: 'yew', n: 25, label: 'Chop 25 yew logs' }], { xp: { woodcutting: 20000 }, coins: 3000 }),
  Q('bone_collector', 'gloomfen', 'Bone Collector', 'Gravewarden Lysa', 52, null, 'The dead will not stay put. Lay them down again.',
    [{ ev: 'kill', key: 'zombie', n: 20, label: 'Defeat 20 bog zombies' }, { ev: 'kill', key: 'skeleton', n: 20, label: 'Defeat 20 marsh skeletons' }], { xp: { defence: 15000, hitpoints: 6000 }, coins: 3500 }),
  Q('swamp_supper', 'gloomfen', 'Swamp Supper', 'Mother Alder', 54, null, 'Mother Alder swears monkfish cures anything. Catch it, cook it, hope for the best.',
    [{ ev: 'catch', key: 'monkfish', n: 25, label: 'Catch 25 monkfish' }, { ev: 'cook', key: 'monkfish', n: 25, label: 'Cook 25 monkfish' }], { xp: { fishing: 20000, cooking: 20000 }, coins: 4000 }),
  Q('witchs_bane', 'gloomfen', "Witch's Bane", 'Gravewarden Lysa', 58, 'bone_collector', 'Morwenna is the reason the dead walk. Lysa has run out of prayers. You need combat level 65.',
    [{ ev: 'boss', key: 'morwenna', n: 1, label: 'Defeat Morwenna the Bog Witch' }], { xp: { attack: 30000, strength: 30000, defence: 30000 }, coins: 8000 }),

  Q('forge_of_embers', 'emberfall', 'Forge of Embers', 'Magmasmith Kael', 64, null, 'Runite hides in the lava tubes. Kael will pay well for it.',
    [{ ev: 'mine', key: 'runite', n: 10, label: 'Mine 10 runite ore' }], { xp: { mining: 60000, smithing: 20000 }, coins: 9000 }),
  Q('shark_feast', 'emberfall', 'Shark Feast', 'Quartermaster Vess', 66, null, 'The garrison will eat well tonight if you do.',
    [{ ev: 'catch', key: 'shark', n: 30, label: 'Catch 30 sharks' }, { ev: 'cook', key: 'shark', n: 30, label: 'Cook 30 sharks' }], { xp: { fishing: 60000, cooking: 60000 }, coins: 12000 }),
  Q('drakehide_deal', 'emberfall', 'The Drakehide Deal', 'Quartermaster Vess', 70, 'mq_crafting', 'Drakehide armour is the finest a ranger can wear. Bring in the hides.',
    [{ ev: 'kill', key: 'drake', n: 25, label: 'Defeat 25 ember drakes' }, { ev: 'craft', key: '*', n: 10, label: 'Craft 10 items' }], { xp: { ranged: 80000, crafting: 40000 }, coins: 15000 }),
  Q('cloud_harvest', 'skyreach', 'Cloud Harvest', 'Brother Aldous', 78, null, 'The monks tend gardens above the clouds. Help them bring in the starfruit.',
    [{ ev: 'harvest', key: 'starfruit', n: 15, label: 'Harvest 15 starfruit' }, { ev: 'catch', key: 'skyfin', n: 20, label: 'Catch 20 skyfin' }], { xp: { farming: 150000, fishing: 100000 }, coins: 30000 }),
  Q('storm_breaker', 'skyreach', 'Stormbreaker', 'Abbot Seren', 82, 'cloud_harvest', 'Zephyrion has torn the bridges from the sky. You need combat level 95.',
    [{ ev: 'boss', key: 'zephyrion', n: 1, label: 'Defeat Zephyrion the Storm Roc' }], { xp: { attack: 200000, strength: 200000, defence: 200000 }, coins: 80000 }),
  Q('crownfall', 'hollow', 'Crownfall', 'The Last Herald', 88, 'storm_breaker', 'The Hollow King waits on a drowned throne. End the long sorrow. You need combat level 97.',
    [{ ev: 'kill', key: 'voidknight', n: 20, label: 'Defeat 20 void knights' }, { ev: 'boss', key: 'hollowking', n: 1, label: 'Defeat the Hollow King' }], { xp: { attack: 400000, strength: 400000, defence: 400000, hitpoints: 200000 }, coins: 250000 }),
  Q('wyrm_slayer', 'emberfall', 'Wyrmslayer', 'Warden Ignis', 75, 'drakehide_deal', 'Pyrrhax has burned every banner in the realm. End it. You need combat level 85.',
    [{ ev: 'boss', key: 'pyrrhax', n: 1, label: 'Defeat Pyrrhax the Ember Wyrm' }], { xp: { attack: 100000, strength: 100000, defence: 100000, hitpoints: 60000 }, coins: 40000 }),
];
/* ---------- Main quests: each one teaches a new skill ---------- */
const MQ = (id, unlocks, town, name, giver, adv, req, blurb, obj, reward) => Object.assign(Q(id, town, name, giver, adv, req, blurb, obj, reward), { main: true, unlocks });
D.QUESTS.unshift(
  MQ('mq_smithing', 'smithing', 'willowbrook', 'The Cold Forge', 'Old Brannoc', 12, 'miners_pick',
    'Willowbrook’s forge has been cold since Smith Edda left for the mountains. Brannoc kept her hammer and her notebook. Bring him ore and fuel, and he will show you how to wake the furnace and work metal yourself.',
    [{ ev: 'mine', key: 'copper', n: 10, label: 'Mine 10 copper ore for the first smelt' }, { ev: 'mine', key: 'tin', n: 10, label: 'Mine 10 tin ore to make bronze' }, { ev: 'deliver', key: 'log_normal', n: 20, label: 'Bring 20 logs to fuel the furnace' }],
    { xp: { smithing: 150 }, coins: 100, items: { bar_bronze: 5 } }),
  MQ('mq_thieving', 'thieving', 'mossbarrow', 'The Light-Fingered Stranger', 'Whisper', 13, null,
    'Your coin purse vanished in the Mossbarrow market, and a grinning girl called Whisper is jingling it. She will hand it back, and teach you exactly how she took it, if you pay for the lesson and prove you have the nerve.',
    [{ ev: 'visit', key: 'mossbarrow', n: 1, label: 'Find Whisper in the Mossbarrow market' }, { ev: 'deliver', key: 'herring', n: 5, label: 'Pay her in 5 cooked herring' }, { ev: 'kill', key: 'scarecrow', n: 3, label: 'Knock down 3 haunted scarecrows on a dare' }],
    { xp: { thieving: 100 }, coins: 150, items: { tool_gloves_1: 1 } }),
  MQ('mq_crafting', 'crafting', 'mossbarrow', 'Needle and Thread', 'Seamstress Hettie', 15, null,
    'Hettie has sewn every coat in Mossbarrow for fifty years, but her hands have stiffened. Bring her the makings of one last lesson and she will teach you to sew leather, string bows and set gems, so the village is not left in rags.',
    [{ ev: 'deliver', key: 'cowhide', n: 8, label: 'Bring 8 cowhides to practise on' }, { ev: 'deliver', key: 'feather', n: 20, label: 'Bring 20 feathers for her quills' }, { ev: 'chop', key: 'birch', n: 10, label: 'Chop 10 birch logs for her frames' }],
    { xp: { crafting: 150 }, coins: 150, items: { cowhide: 6 } }),
  MQ('mq_ranged', 'ranged', 'mossbarrow', 'A Hunter’s Bow', 'Hunter Wynn', 18, null,
    'Wynn will not take you after Old Tusk with only a sword. “A hunter strikes from a distance,” he says. Help him carve your first bow and fletch your first arrows, and he will teach you to shoot.',
    [{ ev: 'deliver', key: 'log_birch', n: 10, label: 'Bring 10 birch logs for the bow stave' }, { ev: 'deliver', key: 'feather', n: 40, label: 'Bring 40 feathers to fletch arrows' }, { ev: 'kill', key: 'boar', n: 6, label: 'Track down 6 wild boars as practice' }],
    { xp: { ranged: 150 }, items: { bow_normal: 1, arrow_bronze: 150 } }),
  MQ('mq_magic', 'magic', 'saltmere', 'The Drowned Library', 'Archivist Merrow', 28, null,
    'A library sank with the old Saltmere harbour. Merrow has fished up the first pages of a spellbook, but smugglers stole the cover and the rest is still underwater. Recover them and she will teach you to read the old magic.',
    [{ ev: 'catch', key: '*', n: 25, label: 'Fish up 25 catches (lost pages turn up in the nets)' }, { ev: 'kill', key: 'smuggler', n: 5, label: 'Take the spellbook cover back from 5 smugglers' }, { ev: 'deliver', key: 'gem_sapphire', n: 1, label: 'Bring a sapphire to focus your first spell' }],
    { xp: { magic: 150 }, coins: 300, items: { staff_normal: 1, rune: 60 } }),
);
/* ---------- Town quests that carry each region to its boss (Nov 2026) ----------
   Every town keeps an open quest within a few Hero levels from arrival to its boss, so there is always a reason to
   continue. Existing places, creatures, gathering spots and recipes only; rewards in line with each region's neighbours.
   `thanks` is said when the quest is claimed (journal and claim note). */
const TQ = (id, town, name, giver, adv, req, blurb, obj, reward, thanks) => ({ ...Q(id, town, name, giver, adv, req, blurb, obj, reward), thanks });
const k = (key, n, label) => ({ ev: 'kill', key, n, label }), act = (ev, key, n, label) => ({ ev, key, n, label });
D.QUESTS.push(
  /* Willowbrook: between the first quests and Grubnash */
  TQ('wb_granary', 'willowbrook', 'Rats in the Granary', 'Mabel the Cook', 5, 'hungry_cook', 'Something has been at the winter grain, and Mabel has found tiny teeth marks on her best pie dish. Clear the granary and bake the village something to celebrate.',
    [k('rat', 12, 'Clear 12 rats from the granary'), act('cook', 'baked_potato', 5, 'Bake 5 potatoes for the clean-up crew')], { xp: { attack: 400, cooking: 300 }, coins: 140 },
    'Not one sack lost. You can have the first slice of everything this week.'),
  TQ('wb_tattercaps', 'willowbrook', 'Tattercaps in the Lane', 'Elder Wren', 8, 'first_steps', 'Little hooded tattercaps have been pulling washing off lines and leading rilljaws into the reed ponds. Elder Wren suspects the goblins taught them.',
    [k('tattercap', 6, 'Shoo 6 tattercaps out of the lanes'), k('rilljaw', 6, 'Drive 6 rilljaws back into deep water')], { xp: { strength: 600, defence: 400 }, coins: 220 },
    'They always did copy the worst of us. With Grubnash gone, perhaps they will copy you instead.'),

  /* Mossbarrow: after Old Tusk, on to Saltmere */
  TQ('mb_silver', 'mossbarrow', 'The Silver Seam', 'Old Brannoc', 20, 'miners_pick', 'Brannoc followed a rumour to a silver seam above Mossbarrow and came back with a sore back and no silver. He would like to be proved right.',
    [act('mine', 'silver', 15, 'Mine 15 silver ore'), act('catch', 'pike', 15, 'Catch 15 pike for the miners’ supper')], { xp: { mining: 1800, fishing: 1200 }, coins: 650 },
    'Told them. Fifty years I have been telling them.'),
  TQ('mb_bellhares', 'mossbarrow', 'Under the Bellhare Moon', 'Granny Bramble', 23, 'seeds_of_hope', 'At the bellhare moon the rootbound wake and the hares ring through the fields. Granny Bramble wants the harvest in before they trample it.',
    [k('bellhare', 8, 'Calm 8 bellhares'), k('rootbound', 8, 'Put 8 rootbound back to sleep'), act('harvest', 'strawberry', 10, 'Bring in 10 strawberries before the moon')], { xp: { defence: 2000, farming: 1800 }, coins: 900 },
    'Every berry in and not a hare hurt. My mother never managed that, and she had three dogs.'),

  /* Saltmere: past Barnacle, towards Ironpeak */
  TQ('sm_wreckers', 'saltmere', 'The Wreck Divers', 'Harbourmaster Ilsa', 30, 'captains_bane', 'With Barnacle gone, wrecklings have crawled out of the old hulks to pick over what is left. Ilsa wants the harbour floor safe enough to salvage.',
    [k('wreckling', 10, 'Clear 10 wrecklings from the hulks'), act('catch', 'salmon', 20, 'Catch 20 salmon for the salvage crew')], { xp: { attack: 3500, fishing: 2500 }, coins: 1400 },
    'Half of Saltmere is down there. Now we can go and get it back.'),
  TQ('sm_fleet', 'saltmere', 'Iron for the Fleet', 'Smith Tolla', 33, 'forged_in_salt', 'The new fishing fleet needs fittings, and Tolla needs a second pair of hands at the forge and willow for the hulls.',
    [act('smelt', 'bar_iron', 20, 'Smelt 20 iron bars'), act('smith', '*', 15, 'Smith 15 fittings at any anvil'), act('chop', 'willow', 20, 'Chop 20 willow logs for the hulls')], { xp: { smithing: 4000, woodcutting: 2500 }, coins: 1800 },
    'First new boat in ten years. We are naming it after you. Well, after your hammer.'),

  /* Ironpeak: Hero 34 to 47, the long climb to Frostmaw */
  TQ('ip_chimes', 'ironpeak', 'Chimes in the Pass', 'Captain Hrod', 34, 'trollbane', 'Something rings in the high pass at night. The watch say it is chimehorns calling the ice wolves down. Captain Hrod says it is your turn on watch.',
    [k('chimehorn', 12, 'Silence 12 chimehorns'), k('icewolf', 10, 'Turn back 10 ice wolves')], { xp: { attack: 7000, defence: 5000 }, coins: 2200 },
    'Quiet at last. Frostmaw will notice. Good. Let it come down to us for a change.'),
  TQ('ip_gold', 'ironpeak', 'Gold for the Hall', 'Foreman Dagna', 37, 'deep_vein', 'The great hall’s doors were once gilded. Dagna means to see them gleam again before Frostmaw is driven off, so the mountain knows who it belongs to.',
    [act('mine', 'gold', 25, 'Mine 25 gold ore'), act('smelt', 'bar_gold', 10, 'Smelt 10 gold bars')], { xp: { mining: 9000, smithing: 6000 }, coins: 3000 },
    'There. Now it looks like a hall worth defending.'),
  TQ('ip_raiders', 'ironpeak', 'Raiders at the Gate', 'Captain Hrod', 40, 'ip_chimes', 'Raiders have learned that the watch is stretched thin. Hold the gate, and keep the watch fed while you do.',
    [k('raider', 15, 'Repel 15 raiders'), act('cook', 'lobster', 20, 'Cook 20 lobsters for the watch')], { xp: { strength: 12000, cooking: 6000 }, coins: 3800 },
    'The gate held. And for once the watch is not complaining about the food.'),
  TQ('ip_frostpelt', 'ironpeak', 'Furs for the Long Night', 'Hearthkeeper Brunn', 43, 'frozen_catch', 'Winter on the peak is worst just before Frostmaw wakes. Brunn needs warm coats for the watch and fuel for the hearths.',
    [k('icewolf', 15, 'Gather pelts from 15 ice wolves'), act('craft', '*', 8, 'Craft 8 pieces of warm gear'), act('chop', 'maple', 20, 'Chop 20 maple logs for the hearths')], { xp: { crafting: 9000, woodcutting: 7000 }, coins: 4200 },
    'Every hearth lit and every guard in fur. Now we can wait out anything. Even a dragon.'),
  TQ('ip_longnight', 'ironpeak', 'Before the Long Night', 'Captain Hrod', 46, 'ip_raiders', 'The trolls and rimewings always come down before Frostmaw. Thin them out, and the watch will stand with you when the dragon comes.',
    [k('troll', 15, 'Drive back 15 trolls'), k('rimewing', 8, 'Bring down 8 rimewings'), act('deliver', 'swordfish', 10, 'Stock the watch with 10 cooked swordfish')], { xp: { attack: 15000, hitpoints: 8000 }, coins: 5000 },
    'The mountain is ready. Now so are you. Frostmaw is waiting at the top.'),

  /* Gloomfen: Hero 60 to 68, towards Morwenna */
  TQ('gf_lanterns', 'gloomfen', 'Lanterns over the Bog', 'Boatwright Sorrel', 60, 'yew_planks', 'Candletoads swallow the marsh lights, and murkbells ring travellers off the path. Sorrel wants the route lit and safe for the boats.',
    [k('candletoad', 15, 'Clear 15 candletoads from the lantern posts'), k('murkbell', 10, 'Silence 10 murkbells'), act('chop', 'yew', 30, 'Chop 30 yew logs for new posts')], { xp: { defence: 30000, woodcutting: 25000 }, coins: 6500 },
    'A light every twenty paces. Nobody drowns on my route again.'),
  TQ('gf_rivets', 'gloomfen', 'Adamant Rivets', 'Boatwright Sorrel', 62, 'gf_lanterns', 'Bog water eats ordinary nails. Sorrel’s new boats need adamant rivets, and nobody in Gloomfen can smelt it.',
    [act('mine', 'adamant', 15, 'Mine 15 adamant ore'), act('smelt', 'bar_adamant', 10, 'Smelt 10 adamant bars')], { xp: { mining: 35000, smithing: 30000 }, coins: 7500 },
    'These will outlast the boat. They might outlast the bog.'),
  TQ('gf_reeds', 'gloomfen', 'The Reed Stalkers', 'Gravewarden Lysa', 64, 'bone_collector', 'Reedstalkers and bogsnappers guard the path to Morwenna’s hut. Lysa will not let you go up it alone until they are dealt with.',
    [k('reedstalker', 15, 'Clear 15 reedstalkers'), k('bogsnapper', 15, 'Drive off 15 bogsnappers')], { xp: { attack: 40000, strength: 30000 }, coins: 8500 },
    'The path is open. So is her door. She knows you are coming.'),
  TQ('gf_wraithlight', 'gloomfen', 'Wraithlight', 'Mother Alder', 67, 'swamp_supper', 'Wraiths gather where Morwenna’s lanterns burn. Mother Alder says a hunter who eats well and walks in the light will not be taken.',
    [k('wraith', 15, 'Put 15 wraiths to rest'), k('siltmarionette', 8, 'Cut the strings of 8 silt marionettes'), act('cook', 'monkfish', 30, 'Cook 30 monkfish for the road')], { xp: { hitpoints: 30000, cooking: 30000 }, coins: 9500 },
    'Now you smell of supper, not fear. The wraiths hate that.'),

  /* Emberfall: Hero 77 to 86, towards Pyrrhax */
  TQ('ef_glass', 'emberfall', 'Ash and Glass', 'Magmasmith Kael', 77, 'forge_of_embers', 'Glassbacks have been grazing on the runite seams, leaving shards that ruin a forge. Kael wants the seams cleared and worked.',
    [k('glassback', 12, 'Drive off 12 glassbacks'), act('mine', 'runite', 15, 'Mine 15 runite ore')], { xp: { defence: 90000, mining: 70000 }, coins: 16000 },
    'Clean ore at last. Now I can forge you something worthy of the wyrm.'),
  TQ('ef_hounds', 'emberfall', 'Hounds of the Caldera', 'Warden Ignis', 80, 'drakehide_deal', 'Hounds run the caldera rim in packs, and the cinderlooms weave their dens out of living flame. The wardens cannot reach Pyrrhax while they hold the rim.',
    [k('hound', 25, 'Break up 25 hounds'), k('cinderloom', 12, 'Unravel 12 cinderlooms')], { xp: { strength: 120000, hitpoints: 60000 }, coins: 19000 },
    'The rim is ours. From up there you can hear the wyrm breathing.'),
  TQ('ef_anglers', 'emberfall', 'The Angler’s Lantern', 'Quartermaster Vess', 83, 'shark_feast', 'Anglerfish hunt by the light of the lava pools. Vess wants a stock of them salted for the wardens’ last march.',
    [act('catch', 'anglerfish', 30, 'Catch 30 anglerfish'), act('cook', 'anglerfish', 30, 'Cook 30 anglerfish')], { xp: { fishing: 110000, cooking: 110000 }, coins: 21000 },
    'Enough for every warden. Nobody faces a dragon on an empty stomach in my watch.'),
  TQ('ef_furnace', 'emberfall', 'The Furnace Heart', 'Warden Ignis', 86, 'ef_hounds', 'Emberlords stoke the furnace that keeps Pyrrhax warm, and furnacemites carry the coals. Put out the furnace and the wyrm will come out angry and cold.',
    [k('emberlord', 15, 'Defeat 15 emberlords'), k('furnacemite', 10, 'Scatter 10 furnacemites'), act('smith', '*', 10, 'Smith 10 pieces at the cooling anvils')], { xp: { attack: 150000, smithing: 90000 }, coins: 24000 },
    'Cold for the first time in a hundred years. Go now, before it warms again.'),

  /* Skyreach: Hero 84 to 95, towards Zephyrion */
  TQ('sr_feathers', 'skyreach', 'Feathers of the Gale', 'Brother Aldous', 84, 'cloud_harvest', 'The monks fletch their prayer flags from hawk feathers and hang them from elder poles. Both have been scarce since the storms began.',
    [k('hawk', 25, 'Gather feathers from 25 hawks'), act('chop', 'elder', 25, 'Chop 25 elder logs for flag poles')], { xp: { ranged: 180000, woodcutting: 140000 }, coins: 30000 },
    'The flags fly again. Listen. The wind sounds kinder already.'),
  TQ('sr_astral', 'skyreach', 'Star Iron', 'Abbot Seren', 87, null, 'Astralite falls on the high terraces after every storm. The monastery bells cracked in the last one, and Seren wants them recast in star iron.',
    [act('mine', 'astralite', 25, 'Mine 25 astralite'), act('smelt', 'bar_astral', 10, 'Smelt 10 astral bars')], { xp: { mining: 200000, smithing: 160000 }, coins: 34000 },
    'Listen to them ring. High and clear, and the whole mountain listening. Star iron remembers where it fell from.'),
  TQ('sr_golems', 'skyreach', 'Golems of the Stair', 'Abbot Seren', 90, 'sr_astral', 'The stone golems that guard the thousand steps no longer know friend from foe, and prismkites dazzle anyone who climbs. The way to Zephyrion runs through them.',
    [k('golem', 20, 'Still 20 golems'), k('prismkite', 12, 'Ground 12 prismkites')], { xp: { defence: 240000, strength: 200000 }, coins: 40000 },
    'The stair is clear. At the top, the storm has a name.'),
  TQ('sr_thunder', 'skyreach', 'Thunder in the Loom', 'Brother Aldous', 92, 'sr_feathers', 'Thunderlooms weave the storm out of cloud, and wyverns ride it. Unpick both, and Zephyrion will have to fight without its weather.',
    [k('thunderloom', 15, 'Unpick 15 thunderlooms'), k('wyvern', 15, 'Bring down 15 wyverns')], { xp: { attack: 280000, hitpoints: 140000 }, coins: 46000 },
    'Blue sky. I had almost forgotten the colour.'),
  TQ('sr_hermit', 'skyreach', 'The Hermit’s Riddle', 'Abbot Seren', 95, 'sr_golems', 'Gale hermits know the way into Zephyrion’s eyrie, but they only answer those who bring the mountain’s gifts.',
    [k('galehermit', 10, 'Win the answers of 10 gale hermits'), act('harvest', 'starfruit', 20, 'Bring 20 starfruit as gifts'), act('catch', 'skyfin', 40, 'Catch 40 skyfin as gifts')], { xp: { farming: 220000, fishing: 220000 }, coins: 52000 },
    'The hermits have answered. Up, they say, and into the wind. It has been waiting for someone to argue with.'),

  /* The Hollow Crown: Hero 90 to 98, towards the Hollow King */
  TQ('hc_echoes', 'hollow', 'Echoes in the Dark', 'The Last Herald', 90, null, 'Echohusks repeat the last words of everyone the Hollow King has taken, and shades follow the voices. The Herald wants them quiet so the names can be written down.',
    [k('echohusk', 20, 'Silence 20 echohusks'), k('shade', 15, 'Disperse 15 shades')], { xp: { defence: 350000, hitpoints: 200000 }, coins: 80000 },
    'Every name, written down at last. Now someone will remember them.'),
  TQ('hc_foundations', 'hollow', 'Voidstone Foundations', 'The Last Herald', 93, 'hc_echoes', 'The road into the Crown is falling into the dark. Voidstone and gloomwood are the only things that hold there.',
    [act('mine', 'voidstone', 25, 'Mine 25 voidstone'), act('chop', 'gloomwood', 25, 'Chop 25 gloomwood logs')], { xp: { mining: 320000, woodcutting: 320000 }, coins: 90000 },
    'A road that will still be here tomorrow. That is more than this place has had in a long time.'),
  TQ('hc_threads', 'hollow', 'Threads of the Saint', 'The Last Herald', 95, 'hc_echoes', 'Threadsaints stitch the Hollow King’s court together and pale orbits keep it lit. Cut the threads and put out the lights.',
    [k('threadsaint', 12, 'Cut the threads of 12 threadsaints'), k('paleorbit', 15, 'Put out 15 pale orbits'), act('catch', 'voideel', 30, 'Catch 30 void eels for the long watch')], { xp: { attack: 450000, fishing: 300000 }, coins: 110000 },
    'The court is coming apart. He will have to face you himself now.'),
  TQ('hc_bloom', 'hollow', 'The Last Bloom', 'The Last Herald', 98, 'hc_threads', 'Nullblooms open wherever the King’s horrors walk, and each one swallows a little more of the world. Close them, and the realm stops shrinking.',
    [k('horror', 15, 'Defeat 15 horrors'), k('nullbloom', 10, 'Close 10 nullblooms')], { xp: { strength: 500000, hitpoints: 300000 }, coins: 130000 },
    'Look. Where the last bloom closed, something green is coming up through the stone. I had forgotten that things could grow here.'),
);
D.QM = Object.fromEntries(D.QUESTS.map(q => [q.id, q]));
D.SKILLS.forEach(s => { if (s.quest) s.questName = D.QM[s.quest].name; });

/* ---------- Achievements ---------- */
const A = D.ACH = [];
const S = () => DQ.S;
const ach = (id, name, desc, goal, val, coins, ic = 'trophy') => A.push({ id, name, desc, goal, val, coins, ic });
D.SKILLS.forEach(s => [[10, 'Novice', 50], [30, 'Adept', 300], [60, 'Expert', 2000], [99, 'Master', 15000]].filter(a => s.id !== 'hitpoints' || a[0] > 10).forEach(([l, t, c]) =>
  ach(`${s.id}_${l}`, `${s.name} ${t}`, `Reach ${s.name} level ${l}.`, l, () => DQ.lvl(s.id), c, s.id)));
const cnt = (key, label, verb, goals, ic) => goals.forEach((g, i) => ach(`${key}_${g}`, `${label} ${['I', 'II', 'III'][i]}`, `${verb} ${DQ.fmt(g)}.`, g, () => S().stats[key] || 0, [100, 800, 6000][i], ic));
cnt('catch', 'Angler', 'Catch', [100, 1000, 10000], 'fishing');
cnt('chop', 'Lumberjack', 'Chop', [100, 1000, 10000], 'woodcutting');
cnt('mine', 'Prospector', 'Mine', [100, 1000, 10000], 'mining');
cnt('thieve', 'Cutpurse', 'Steal successfully', [50, 500, 5000], 'thieving');
cnt('cook', 'Chef', 'Cook', [100, 1000, 10000], 'cooking');
cnt('smelt', 'Furnace Hand', 'Smelt', [50, 500, 5000], 'smithing');
cnt('smith', 'Hammerhand', 'Smith', [25, 250, 2500], 'smithing');
cnt('craft', 'Artisan', 'Craft', [25, 250, 2500], 'crafting');
cnt('kill', 'Slayer', 'Defeat monsters:', [50, 500, 5000], 'attack');
cnt('harvest', 'Green Thumb', 'Harvest crops:', [50, 500, 5000], 'farming');
cnt('collect', 'Rancher', 'Collect animal produce:', [25, 250, 2500], 'farming');
cnt('alch', 'Alchemist', 'Cast alchemy', [25, 250, 2500], 'magic');
[1000, 100000, 10000000].forEach((g, i) => ach(`earn_${g}`, ['Pocket Change', 'Well Off', 'Tycoon'][i], `Earn ${DQ.fmt(g)} coins in total.`, g, () => S().stats.earned, [100, 2000, 50000][i], 'coin'));
[10, 25, 50, 75, 99].forEach((g, i) => ach(`adv_${g}`, ['Rising Hero', 'Seasoned Hero', 'Veteran', 'Legend', 'Paragon'][i], `Reach Hero level ${g}.`, g, () => DQ.advLvl(), [200, 1000, 6000, 20000, 100000][i], 'star'));
D.TOWNS.forEach((t, i) => ach(`boss_${t.boss}`, `${D.MON[t.boss].boss.short} Falls`, `Defeat ${D.MON[t.boss].name}.`, 1, () => (S().towns[t.id] && S().towns[t.id].boss) ? 1 : 0, [300, 800, 1500, 6000, 20000, 100000, 200000, 500000][i], 'skull'));
ach('visit_all', 'Well Travelled', 'Visit every town in the realm.', D.TOWNS.length, () => Object.values(S().towns).filter(t => t.visited).length, 5000, 'map');
[1, 5, 10, D.QUESTS.length].forEach((g, i) => ach(`quests_${g}`, ['First Errand', 'Odd Jobs', 'Hired Hand', 'Questmaster'][i], `Complete ${g} quest${g > 1 ? 's' : ''}.`, g, () => Object.values(S().q).filter(q => q.s === 'done').length, [100, 600, 2500, 25000][i], 'quest'));
ach('first_buy', 'Open for Business', 'Buy something from a shop.', 1, () => S().stats.bought, 50, 'shop');
ach('first_sell', 'Fair Trade', 'Sell an item.', 1, () => S().stats.sold, 25, 'coin');
ach('first_equip', 'Dressed for the Part', 'Equip a piece of gear.', 1, () => S().stats.equipped, 50, 'shield');
ach('tool_upgrade', 'Right Tool for the Job', 'Buy an upgraded tool.', 1, () => S().stats.tools, 200, 'hammer');
ach('die_1', 'Oh Dear', 'Be defeated for the first time.', 1, () => S().stats.deaths, 25, 'skull');
ach('die_10', 'Persistent', 'Be defeated 10 times.', 10, () => S().stats.deaths, 250, 'skull');
ach('rare_drop', 'Lucky Day', 'Find a rare item.', 1, () => S().stats.rare, 500, 'gem');
ach('dbl_xp', 'Quick Study', 'Reach level 50 in any skill.', 50, () => DQ.maxLvl(), 2000, 'star');

/* ---------- Unlock index: what appears at each skill level ---------- */
D.UNL = {};
const unl = (sk, l, name) => { if (l <= 1) return; ((D.UNL[sk] = D.UNL[sk] || {})[l] = D.UNL[sk][l] || []).push(name); };
/* what Thieving is for: shown on level-up like any other unlock */
[[5, 'Silver tongue: better prices in every shop'], [20, 'Lockpicking: richer treasure chests'], [25, 'Pick the locks on chests found while away'], [30, 'Lockpicking: a second gem in treasure chests']].forEach(([l, n]) => unl('thieving', l, n));
Object.values(D.NODE).forEach(n => unl(n.skill, n.lvl, n.name));
Object.values(D.RECIPES).forEach(r => unl(r.skill, r.lvl, r.name));
Object.values(ITEMS).forEach(it => { if (it.type === 'gear' || it.type === 'ammo') Object.entries(it.req || {}).forEach(([sk, l]) => unl(sk, l, 'Equip: ' + it.name)); });
D.SPELLS.forEach(s => unl('magic', s.lvl, s.name + ' spell'));
D.ALCH.forEach(a => unl('magic', a.lvl, a.name));

/* Perks: small passive bonuses at level milestones */
D.PERKS = [{ lvl: 10, name: 'Steady Hands', speed: .04 }, { lvl: 30, name: 'Practised Rhythm', speed: .04 }, { lvl: 50, name: 'Second Nature', speed: .04 }, { lvl: 70, name: 'Fluid Motion', speed: .04 }, { lvl: 90, name: 'Mastery', speed: .04 }, { lvl: 99, name: 'Overflowing Yield', dbl: .1 }];
D.GATHER_SKILLS = ['farming', 'fishing', 'woodcutting', 'mining', 'thieving', 'cooking', 'smithing', 'crafting', 'magic'];

/* Portrait palette for character creation */
D.LOOKS = {
  skin: ['#f2c9a0', '#d9a074', '#a96f48', '#6e4630'],
  hair: ['#3a2a1e', '#8a5a2b', '#d6b062', '#c24a2a', '#cfd3d8'],
  tunic: ['#3f7fbf', '#b8503f', '#4a9a6a', '#8a5fbf', '#c9a04a', '#4a5a66'],
};
})();
