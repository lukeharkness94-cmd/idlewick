/* Idlewick: pets, house, hirelings. */
(() => {
const DQ = window.DQ, D = DQ.data;

/* ---------- Pets: found while playing, one can follow you at a time ---------- */
const pet = (id, name, kind, spr, col, src, bonus, text) => ({ id, name, kind, spr, col, src, bonus, text });
D.PETS = [
  pet('biscuit', 'Biscuit', 'Farm dog', 'quad', '#c89a5a', { type: 'shop', price: 5000, town: 'mossbarrow' }, { xpAll: .02 }, '+2% XP to every skill'),
  pet('toast', 'Toast', 'Chick', 'bird', '#ffd84a', { type: 'harvest', chance: 1 / 120 }, { xp: { farming: .06 } }, '+6% Farming XP'),
  pet('bubbles', 'Bubbles', 'Goldfish', 'fish', '#ff9a3a', { type: 'skill', skill: 'fishing', chance: 1 / 900 }, { xp: { fishing: .06 } }, '+6% Fishing XP'),
  pet('acorn', 'Acorn', 'Squirrel', 'rodent', '#c8703a', { type: 'skill', skill: 'woodcutting', chance: 1 / 900 }, { xp: { woodcutting: .06 } }, '+6% Woodcutting XP'),
  pet('nugget', 'Nugget', 'Mole', 'rodent', '#6a5a50', { type: 'skill', skill: 'mining', chance: 1 / 900 }, { xp: { mining: .06 } }, '+6% Mining XP'),
  pet('whiskers', 'Whiskers', 'Alley cat', 'quad', '#9a9aa8', { type: 'skill', skill: 'thieving', chance: 1 / 800 }, { coin: .06 }, '+6% coins from every source'),
  pet('cinder', 'Cinder', 'Fire sprite', 'ghost', '#ff8a3a', { type: 'skill', skill: 'smithing', chance: 1 / 700 }, { xp: { smithing: .06 } }, '+6% Smithing XP'),
  pet('quill', 'Quill', 'Owl', 'bird', '#c8b090', { type: 'skill', skill: 'crafting', chance: 1 / 700 }, { xp: { crafting: .06, magic: .06 } }, '+6% Crafting and Magic XP'),
  pet('pudding', 'Pudding', 'Piglet', 'quad', '#f0a8b0', { type: 'skill', skill: 'cooking', chance: 1 / 900 }, { heal: .1 }, 'Food heals 10% more'),
  pet('gobbo', 'Gobbo', 'Goblin whelp', 'humanoid', '#8fbf6a', { type: 'boss', mon: 'grubnash', chance: 1 / 15 }, { dmg: .03 }, '+3% damage'),
  pet('tusky', 'Tusky', 'Boarlet', 'quad', '#b07a4a', { type: 'boss', mon: 'oldtusk', chance: 1 / 15 }, { dr: .03 }, '3% less damage taken'),
  pet('bill', 'Barnacle Bill', 'Hermit crab', 'crab', '#6fc7d8', { type: 'boss', mon: 'barnacle', chance: 1 / 20 }, { coin: .08 }, '+8% coins from every source'),
  pet('frostling', 'Frostling', 'Ice troll pup', 'brute', '#bfe6ff', { type: 'boss', mon: 'frostmaw', chance: 1 / 20 }, { dmg: .05 }, '+5% damage'),
  pet('bogwisp', 'Bogwisp', 'Marsh light', 'ghost', '#b79cff', { type: 'boss', mon: 'morwenna', chance: 1 / 20 }, { xpAll: .05 }, '+5% XP to every skill'),
  pet('wyrmling', 'Wyrmling', 'Baby wyrm', 'dragon', '#ff6a3a', { type: 'boss', mon: 'pyrrhax', chance: 1 / 25 }, { dmg: .07, dr: .03 }, '+7% damage, 3% less damage taken'),
  pet('stormchick', 'Stormchick', 'Roc hatchling', 'bird', '#bfe8ff', { type: 'boss', mon: 'zephyrion', chance: 1 / 25 }, { speed: .05 }, 'Every task is 5% faster'),
  pet('hollowling', 'Hollowling', 'Crowned shade', 'ghost', '#b08aff', { type: 'boss', mon: 'hollowking', chance: 1 / 25 }, { xpAll: .08, coin: .08 }, '+8% XP and coins'),
];
D.PET = Object.fromEntries(D.PETS.map(p => [p.id, p]));
D.PET_LEVELS = [0, 10, 30, 70, 150];   // minutes together to reach each bond level

/* ---------- House ---------- */
D.HOUSE = { price: 2500, adv: 14, where: 'a cottage on the hill above Willowbrook' };
const F = (id, name, ic, fx, label, costs) => ({ id, name, ic, fx, label, costs });
D.ROOMS = [
  { id: 'parlour', name: 'Parlour', price: 0, blurb: 'Where you put your feet up after a long day.', furn: [
    F('fireplace', 'Fireplace', 'fire', { regen: [.3, .6, 1] }, v => `+${v * 100}% health regeneration`, [{ coins: 200, log_normal: 25 }, { coins: 2500, log_willow: 30, bar_iron: 10 }, { coins: 20000, log_yew: 40, bar_mithril: 10 }]),
    F('bookshelf', 'Bookshelf', 'book', { xpAll: [.02, .04, .07] }, v => `+${Math.round(v * 100)}% XP to every skill`, [{ coins: 800, log_oak: 20 }, { coins: 6000, log_maple: 30, cloth: 5 }, { coins: 40000, log_magic: 30, gem_ruby: 3 }]),
    F('rug', 'Rug', 'hide', { coin: [.03, .06, .1] }, v => `+${Math.round(v * 100)}% coins found`, [{ coins: 300, cowhide: 10 }, { coins: 3000, wool: 20 }, { coins: 25000, cloth: 30, gem_emerald: 2 }]),
  ] },
  { id: 'kitchen', name: 'Kitchen', price: 4000, blurb: 'A proper range, and somewhere to keep the good cheese.', furn: [
    F('range', 'Iron range', 'cooking', { burn: [.05, .1, .18] }, v => `${Math.round(v * 100)}% less burnt food`, [{ coins: 500, bar_bronze: 10 }, { coins: 4000, bar_iron: 20 }, { coins: 30000, bar_steel: 30 }]),
    F('larder', 'Larder', 'food', { heal: [.1, .2, .3] }, v => `Food heals ${Math.round(v * 100)}% more`, [{ coins: 600, log_normal: 30 }, { coins: 5000, log_willow: 30, bar_iron: 10 }, { coins: 35000, log_yew: 30, bar_mithril: 10 }]),
    F('spicerack', 'Spice rack', 'crop', { xp_cooking: [.05, .1, .15] }, v => `+${Math.round(v * 100)}% Cooking XP`, [{ coins: 400, crop_onion: 20 }, { coins: 4000, crop_goldleaf: 10 }, { coins: 30000, crop_sunbloom: 20 }]),
  ] },
  { id: 'bedroom', name: 'Bedroom', price: 7000, blurb: 'A good night’s sleep and somewhere to stash your things.', furn: [
    F('bed', 'Bed', 'heart', { regen: [.5, 1, 2] }, v => `+${v * 100}% health regeneration`, [{ coins: 1000, log_oak: 20, wool: 10 }, { coins: 8000, log_maple: 30, cloth: 10 }, { coins: 50000, log_magic: 30, cloth: 30 }]),
    F('chest', 'Storage chest', 'bag', { pack: [4, 8, 12] }, v => `+${v} backpack slots`, [{ coins: 1500, log_oak: 30, bar_bronze: 10 }, { coins: 12000, log_willow: 40, bar_steel: 10 }, { coins: 60000, log_yew: 40, bar_adamant: 10 }]),
    F('wardrobe', 'Armour stand', 'shield', { dr: [.02, .04, .06] }, v => `${Math.round(v * 100)}% less damage taken`, [{ coins: 2000, log_oak: 30 }, { coins: 15000, cloth: 15, bar_iron: 20 }, { coins: 70000, bar_rune: 5, cloth: 30 }]),
  ] },
  { id: 'workshop', name: 'Workshop', price: 12000, blurb: 'Benches, an anvil and a rack for every tool.', furn: [
    F('workbench', 'Workbench', 'crafting', { speed_crafting: [.05, .1, .15] }, v => `Crafting ${Math.round(v * 100)}% faster`, [{ coins: 2000, log_oak: 40 }, { coins: 15000, log_maple: 40, bar_steel: 10 }, { coins: 80000, log_magic: 40, bar_adamant: 10 }]),
    F('anvil', 'Home anvil', 'smithing', { speed_smithing: [.05, .1, .15] }, v => `Smithing ${Math.round(v * 100)}% faster`, [{ coins: 2500, bar_iron: 20 }, { coins: 18000, bar_steel: 30 }, { coins: 90000, bar_mithril: 30 }]),
    F('toolrack', 'Tool rack', 'hammer', { gather: [.03, .06, .1] }, v => `Gathering ${Math.round(v * 100)}% faster`, [{ coins: 3000, log_oak: 30, bar_iron: 10 }, { coins: 20000, log_maple: 30, bar_steel: 20 }, { coins: 100000, log_yew: 40, bar_rune: 5 }]),
  ] },
  { id: 'garden', name: 'Garden', price: 9000, blurb: 'Compost heaps, troughs and room for more beds.', furn: [
    F('compost', 'Compost heap', 'seed', { grow: [.1, .2, .3] }, v => `Crops grow ${Math.round(v * 100)}% faster`, [{ coins: 800, crop_potato: 30 }, { coins: 6000, crop_pumpkin: 20 }, { coins: 40000, crop_moonmelon: 15 }]),
    F('trough', 'Feeding trough', 'pouch', { animal: [.1, .2, .3] }, v => `Animals produce ${Math.round(v * 100)}% faster`, [{ coins: 1000, log_normal: 40 }, { coins: 8000, log_willow: 40, bar_iron: 10 }, { coins: 50000, log_yew: 40, bar_steel: 20 }]),
    F('planter', 'Raised beds', 'crop', { plots: [1, 2, 3] }, v => `+${v} farm plot${v > 1 ? 's' : ''}`, [{ coins: 2000, log_oak: 30 }, { coins: 15000, log_maple: 40 }, { coins: 80000, log_magic: 40 }]),
  ] },
  { id: 'quarters', name: 'Servants’ quarters', price: 20000, blurb: 'Room and board for the people who work for you.', furn: [
    F('cot', 'Bunk beds', 'users', { workers: [1, 2, 3] }, v => `+${v} worker bed${v > 1 ? 's' : ''}`, [{ coins: 3000, log_oak: 30, wool: 10 }, { coins: 20000, log_maple: 40, cloth: 15 }, { coins: 100000, log_magic: 40, cloth: 30 }]),
    F('noticeboard', 'Job board', 'scroll', { wspeed: [.1, .2, .3] }, v => `Workers work ${Math.round(v * 100)}% faster`, [{ coins: 2500, log_oak: 20 }, { coins: 18000, log_maple: 30 }, { coins: 90000, log_yew: 40 }]),
    F('strongbox', 'Strongbox', 'coin', { wage: [.15, .3, .45] }, v => `Wages ${Math.round(v * 100)}% cheaper`, [{ coins: 3000, bar_iron: 15 }, { coins: 20000, bar_steel: 25 }, { coins: 100000, bar_adamant: 20 }]),
  ] },
  { id: 'trophy', name: 'Trophy hall', price: 40000, blurb: 'Show visitors what you have beaten. Visitors may not want to see.', furn: [
    F('mounts', 'Boss mounts', 'skull', { trophy: [.01, .015, .02] }, v => `+${(v * 100).toFixed(1)}% damage per boss defeated`, [{ coins: 5000, boar_tusk: 10 }, { coins: 30000, troll_bone: 20 }, { coins: 150000, wyrm_scale: 1 }]),
    F('display', 'Display case', 'gem', { coin: [.03, .06, .1] }, v => `+${Math.round(v * 100)}% coins found`, [{ coins: 5000, gem_sapphire: 3 }, { coins: 30000, gem_ruby: 3 }, { coins: 150000, gem_diamond: 5 }]),
    F('banner', 'Hall banners', 'flag', { xpAll: [.02, .04, .06] }, v => `+${Math.round(v * 100)}% XP to every skill`, [{ coins: 4000, cloth: 10 }, { coins: 25000, cloth: 25, gem_emerald: 2 }, { coins: 120000, cloth: 50, ember_core: 2 }]),
  ] },
];
D.FURN = {}; D.ROOMS.forEach(r => r.furn.forEach(f => { f.room = r.id; D.FURN[f.id] = f; }));

/* ---------- Hirelings ---------- */
D.HIRE = { adv: 22, skills: ['fishing', 'woodcutting', 'mining', 'farming'] };
D.HIRE_NAMES = ['Ada', 'Bram', 'Cora', 'Dunstan', 'Elsie', 'Finn', 'Greta', 'Hob', 'Ivy', 'Jory', 'Kit', 'Linnet', 'Morrow', 'Nell', 'Oswin', 'Pip', 'Quinn', 'Rook', 'Saffi', 'Tamsin', 'Ulf', 'Vesna', 'Wren', 'Yara', 'Zeb', 'Marigold', 'Thatch', 'Bryony', 'Cobb', 'Hazel'];
D.HIRE_TRAITS = [['Tireless', 'wspeed', .1, 'works 10% faster'], ['Lucky', 'dbl', .08, '8% chance of double yield'], ['Frugal', 'wage', .25, 'asks 25% less pay'], ['Quick study', 'xp', .3, 'levels up 30% faster'], ['Steady', null, 0, 'reliable, nothing special']];
})();
