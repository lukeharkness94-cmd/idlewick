/* Idlewick: the hunting ground and the mythical beasts (owner, 28 Nov 2026).
   "There should be NO animals the same in either. Hunting should be animals you can get resources from (feathers,
   game, chicken meat, bones etc) ... animals like boar, chickens, moose, oxen, deer etc which you'd hunt in real life.
   The beastmastery should be mythical creatures you can capture with hard work, high skill etc. Hunting shouldn't
   require a trap, it should require a lure ... once you've found which lure it likes, its chances of you being able to
   hunt it increase a lot. Beastmastery should use traps with bait in them and require you to have physical traps or
   leashes or some other thing you can capture - again, something you should have to craft." Answers: 40 animals
   (5 tiers x 8); companions caught from ordinary animals are let go ("Get rid"); buildings cost materials too.

   This file is data only:
     D.HUNT_TIERS     five tiers by level (Beginner 1-19 ... Master 80-99), shared by Hunting and Beastmastery.
     D.HUNT_LURES     eight lures made in Cooking; each hunt lays one (hunt_stalk.js).
     D.HUNT_ANIMALS   the 40 real game animals: level, home town (flavour, field guide), drops, favourite lure, art.
                      They become D.MON entries with m.hl (Hunting level), m.tier, m.ground and m.lure.
     D.MYTHS          the 30 mythical beasts for Beastmastery Capture (beast_capture.js): level, kind (which capture
                      tool), art and note. They are not D.MON creatures: nothing fights them and nothing hunts them.
     D.CAPTURE_TOOLS  which crafted tool catches which kind of beast; D.CAPTURE_BAIT the Cooking bait by tier.
     D.FIELD_MATS     what Fieldwork's wooden traps bring back in each region (the materials the old per-town hunting
                      grounds gave), so the crafting tiers keep their routes now the animals are new.
   Every other animal that used to be on the ground is removed from the game here, before anything else reads the
   creature list; quests that named one now name a real animal (data.js, adventures.js). Art: pixel_hunt.js draws the
   animals and beasts from D.HUNT_ART / D.MYTH_ART with pixel_creatures.js's builders; pixel_items_hunt.js the items. */
(() => {
const D = window.DQ.data;
D.HUNT_TIERS = [
  { id: 'beginner', name: 'Beginner', lo: 1, hi: 19 },
  { id: 'intermediate', name: 'Intermediate', lo: 20, hi: 39 },
  { id: 'skilled', name: 'Skilled', lo: 40, hi: 59 },
  { id: 'expert', name: 'Expert', lo: 60, hi: 79 },
  { id: 'master', name: 'Master', lo: 80, hi: 99 }
];
D.huntTierOf = hl => { const i = D.HUNT_TIERS.findIndex(t => hl <= t.hi); return i < 0 ? 4 : i; };

/* ---------- items ---------- */
const item = (id, o) => { D.ITEMS[id] = Object.assign({ id, val: 1, ic: 'bit', col: '#aab', type: 'drop' }, D.ITEMS[id] || {}, o); return D.ITEMS[id]; };
const recipe = r => { r.t = r.t || 2400; D.RECIPES[r.id] = r; (D.RLIST[r.skill] = D.RLIST[r.skill] || []).push(r); return r; };
/* meat: [raw id, raw name, colour, raw value, cooked id, cooked name, Cooking level, xp, heal] */
D.HUNT_MEATS = [
  ['raw_chicken', 'Raw chicken', '#f0c8b0', 2, 'roast_chicken', 'Roast chicken', 2, 32, 3],
  ['raw_rabbit', 'Raw rabbit', '#d89a8a', 2, 'roast_rabbit', 'Roast rabbit', 4, 38, 4],
  ['raw_gamebird', 'Raw game bird', '#c88070', 4, 'roast_gamebird', 'Roast game bird', 9, 48, 5],
  ['raw_duck', 'Raw duck', '#c8786a', 5, 'roast_duck', 'Roast duck', 13, 58, 6],
  ['raw_goose', 'Raw goose', '#d48a78', 8, 'roast_goose', 'Roast goose', 19, 72, 8],
  ['raw_boar', 'Raw boar', '#c86a6a', 10, 'roast_boar', 'Roast boar', 24, 88, 9],
  ['raw_mutton', 'Raw mutton', '#c85a5a', 12, 'mutton_chop', 'Mutton chop', 29, 98, 10],
  ['raw_venison', 'Raw venison', '#a8403a', 18, 'venison_steak', 'Venison steak', 37, 115, 12],
  ['raw_beef', 'Raw beef', '#b8443e', 30, 'beef_steak', 'Beef steak', 50, 142, 15],
  ['raw_bear', 'Raw bear', '#8a3a34', 36, 'bear_steak', 'Bear steak', 58, 150, 16]
];
for (const [raw, rn, col, val, cooked, cn, lvl, xp, heal] of D.HUNT_MEATS) {
  item(raw, { name: rn, type: 'raw', ic: 'food', col, val, hunt: true });
  item(cooked, { name: cn, type: 'food', ic: 'food', col: '#a8683a', val: val * 3, heal });
  recipe({ id: 'cook_' + cooked, skill: 'cooking', tab: 'Cook', name: cn, lvl, xp, t: 2000, in: { [raw]: 1 }, out: { [cooked]: 1 }, ev: 'cook', burn: true });
}
/* what the animals leave besides meat: each one has a real use in Crafting, Cooking or the capture kit */
item('fur_pelt', { name: 'Fur pelt', type: 'resource', ic: 'pelt', col: '#a8805a', val: 10, sub: 'A small soft pelt. Pads live traps.' });
item('deer_hide', { name: 'Deer hide', type: 'resource', ic: 'pelt', col: '#b8875a', val: 24, sub: 'Supple hide. Halters for hoofed beasts.' });
item('antler', { name: 'Antler', type: 'resource', ic: 'bone', col: '#e2d2b0', val: 20, sub: 'Shed or taken antler. Toggles for snares and halters.' });
item('horn', { name: 'Horn', type: 'resource', ic: 'bone', col: '#5a4a3a', val: 22, sub: 'Hollow horn. Latches for cages.' });
item('bear_pelt', { name: 'Bear pelt', type: 'resource', ic: 'pelt', col: '#5a3e2a', val: 60, sub: 'A heavy pelt. Lines iron-jaw cages.' });
item('tallow', { name: 'Tallow', type: 'resource', ic: 'bit', col: '#efe2b0', val: 8, sub: 'Rendered fat. Fish-oil and honey baits.' });
item('down', { name: 'Down', type: 'resource', ic: 'bit', col: '#f4f0e6', val: 6, sub: 'Soft under-feathers. Fowling and starwoven nets.' });
item('ivory', { name: 'Walrus ivory', type: 'resource', ic: 'bone', col: '#f4ecd6', val: 120, sub: 'A walrus tusk. Sells well; jewellers pay for it.' });
item('salt', { name: 'Sea salt', type: 'supply', ic: 'pouch', col: '#e8eef2', val: 3, buy: 12, sub: 'Raked at Saltmere. Salt licks for the hunting ground.' });

/* ---------- lures (Cooking → Lures): one is laid on every hunt ---------- */
/* [id, name, colour, Cooking level, xp, inputs, what it smells of to the animals] */
D.HUNT_LURES = [
  ['grain_mash', 'Grain mash', '#d8b46a', 1, 8, { bread: 1 }, 'soaked bread crumbs'],
  ['root_mash', 'Root mash', '#b88a5a', 3, 12, { crop_potato: 2 }, 'mashed potato peel'],
  ['clover_cake', 'Clover cake', '#7aa85a', 12, 25, { crop_cabbage: 2, bread: 1 }, 'green leaves pressed into a cake'],
  ['salt_lick', 'Salt lick', '#e4ecf0', 18, 35, { salt: 3, crop_wheat: 1 }, 'a block of salt'],
  ['berry_mash', 'Berry mash', '#c8405a', 24, 45, { crop_strawberry: 3 }, 'crushed strawberries'],
  ['carrion_bait', 'Carrion bait', '#8a4a3a', 28, 50, { raw_rabbit: 2, raw_chicken: 1 }, 'raw meat left in the sun'],
  ['fishoil_bait', 'Fish-oil bait', '#8aa0a8', 34, 60, { raw_herring: 2, tallow: 1 }, 'herring rendered down in fat'],
  ['honey_cake', 'Honey cake', '#e8a830', 46, 80, { honey: 1, crop_wheat: 2 }, 'honey baked into wheat']
].map(([id, name, col, lvl, xp, inp, smell]) => {
  item(id, { name, type: 'craft', ic: 'bait', col, val: 2 + Math.round(lvl / 6), lure: true, sub: `A hunting lure: ${smell}. One is laid on each hunt.` });
  recipe({ id: 'cook_' + id, skill: 'cooking', tab: 'Lures', name, lvl, xp, t: 2000, in: inp, out: { [id]: 10 }, ev: 'cook' });
  return { id, name, lvl, smell };
});
D.HUNT_LURE = Object.fromEntries(D.HUNT_LURES.map(l => [l.id, l]));

/* ---------- capture bait (Cooking → Bait): one is loaded into the capture tool on every try ---------- */
item('seed_cake', { name: 'Seed cake', type: 'craft', ic: 'bait', col: '#c8a868', val: 3, bait: true });
const BAIT_RECIPES = [
  ['seed_cake', 4, 20, { bread: 1, seed_potato: 2 }],
  ['scent_bait', 18, 30, { raw_rabbit: 2, crop_onion: 1 }],
  ['honey_bait', 38, 55, { honey: 1, crop_wheat: 1, tallow: 1 }],
  ['smoked_lure', 58, 85, { raw_venison: 2, log_maple: 1, crop_goldleaf: 1 }],
  ['moonlit_lure', 78, 120, { raw_beef: 2, crop_moonmelon: 1, rune: 5 }]
];
item('scent_bait', { name: 'Scent bait', type: 'craft', ic: 'bait', col: '#9a6a3a', val: 6, bait: true });
item('honey_bait', { name: 'Honey bait', type: 'craft', ic: 'bait', col: '#e0a83a', val: 12, bait: true });
item('smoked_lure', { name: 'Smoked bait', type: 'craft', ic: 'bait', col: '#8a5a4a', val: 22, bait: true });
item('moonlit_lure', { name: 'Moonlit bait', type: 'craft', ic: 'bait', col: '#a8c0f0', val: 40, bait: true });
D.CAPTURE_BAIT = BAIT_RECIPES.map(b => b[0]);
BAIT_RECIPES.forEach(([id, lvl, xp, inp], i) => { D.ITEMS[id].sub = `Capture bait for ${D.HUNT_TIERS[i].name} beasts (Beastmastery ${D.HUNT_TIERS[i].lo}-${D.HUNT_TIERS[i].hi}). One is loaded into the tool on each try.`;
  recipe({ id: 'cook_' + id, skill: 'cooking', tab: 'Bait', name: D.ITEMS[id].name, lvl, xp, t: 2400, in: inp, out: { [id]: 6 }, ev: 'cook' }); });

/* ---------- capture tools (Crafting and Smithing): a beast is caught in the tool that suits it ----------
   small beasts in a wooden trap, later a padded live trap; winged ones in a fowling net, later a starwoven net; hoofed
   ones on a rope halter, later a mithril halter; fierce ones in an iron-jaw cage; spirits in a warded snare, later a
   rune trap. The tool goes home with the beast you keep; a try that fails only spends the bait. */
D.CAPTURE_TOOLS = {
  small: [['wooden_trap', 0], ['live_trap', 30]],
  winged: [['fowling_net', 0], ['starwoven_net', 60]],
  hoofed: [['rope_halter', 0], ['mithril_halter', 60]],
  fierce: [['ironjaw_cage', 0]],
  spirit: [['warded_snare', 0], ['rune_trap', 60]]
};
D.CAPTURE_KINDS = { small: 'Small beasts', winged: 'Winged beasts', hoofed: 'Hoofed beasts', fierce: 'Fierce beasts', spirit: 'Spirits' };
D.captureToolFor = (kind, bl) => { const rows = D.CAPTURE_TOOLS[kind] || D.CAPTURE_TOOLS.small; let t = rows[0][0]; for (const [id, from] of rows) if (bl >= from) t = id; return t; };
const tool = (id, name, col, val, sub) => item(id, { name, type: 'craft', ic: 'beastmastery', col, val, captureTool: true, sub });
tool('fowling_net', 'Fowling net', '#c8b890', 40, 'A capture net for winged beasts below Beastmastery 60.');
tool('rope_halter', 'Rope halter', '#b08a5a', 70, 'A capture halter for hoofed beasts below Beastmastery 60.');
tool('warded_snare', 'Warded snare', '#8ab0c8', 90, 'A rune-warded snare for spirits below Beastmastery 60.');
tool('mithril_halter', 'Mithril halter', '#6c7fe0', 260, 'A capture halter for hoofed beasts from Beastmastery 60.');
item('ironjaw_cage', { name: 'Iron-jaw cage', type: 'craft', ic: 'beastmastery', col: '#8a8f98', val: 260, captureTool: true, sub: 'A capture cage for fierce beasts.' });
item('starwoven_net', { name: 'Starwoven net', type: 'craft', ic: 'beastmastery', col: '#b8a8e8', val: 620, captureTool: true, sub: 'A capture net for winged beasts from Beastmastery 60.' });
for (const k of ['ironjaw_cage', 'starwoven_net']) { delete D.ITEMS[k].trap; delete D.ITEMS[k].huntTrap; }
recipe({ id: 'craft_fowling_net', name: 'Fowling net', skill: 'crafting', tab: 'Tools', lvl: 14, xp: 70, t: 3000, in: { string: 4, down: 2 }, out: { fowling_net: 1 }, ev: 'craft' });
recipe({ id: 'craft_warded_snare', name: 'Warded snare', skill: 'crafting', tab: 'Tools', lvl: 24, xp: 105, t: 3000, in: { string: 3, rune: 10, antler: 1 }, out: { warded_snare: 1 }, ev: 'craft' });
recipe({ id: 'craft_rope_halter', name: 'Rope halter', skill: 'crafting', tab: 'Tools', lvl: 26, xp: 110, t: 3000, in: { string: 3, deer_hide: 2 }, out: { rope_halter: 1 }, ev: 'craft' });
recipe({ id: 'craft_ironjaw_cage', name: 'Iron-jaw cage', skill: 'crafting', tab: 'Tools', lvl: 52, xp: 290, t: 4000, in: { bar_mithril: 3, plank_maple: 2, bear_pelt: 1, horn: 2, string: 3 }, out: { ironjaw_cage: 1 }, ev: 'craft' });
recipe({ id: 'craft_starwoven_net', name: 'Starwoven net', skill: 'crafting', tab: 'Tools', lvl: 60, xp: 340, t: 4500, in: { bar_mithril: 2, plank_maple: 2, down: 6, string: 6 }, out: { starwoven_net: 1 }, ev: 'craft' });
recipe({ id: 'smith_mithril_halter', name: 'Mithril halter', skill: 'smithing', tab: 'Tools', lvl: 60, xp: 320, t: 3600, in: { bar_mithril: 3, deer_hide: 3, antler: 2 }, out: { mithril_halter: 1 }, ev: 'smith' });
/* the generic hunting drop of the old grounds stays an item (old saves hold it) but nothing drops it now, and its
   roast is no longer a recipe you could never unlock */
if (D.RECIPES.cook_roast_game) { const r = D.RECIPES.cook_roast_game; delete D.RECIPES.cook_roast_game; D.RLIST.cooking = D.RLIST.cooking.filter(x => x !== r); }
if (D.ITEMS.raw_game) D.ITEMS.raw_game.sub = 'Old hunting meat. Nothing drops it any more; the general store still takes it.';
if (D.UNL) { const u = (sk, l, n) => { (D.UNL[sk] = D.UNL[sk] || {})[l] = [...(D.UNL[sk][l] || []), n]; };
  for (const l of D.HUNT_LURES) u('cooking', l.lvl, l.name);
  u('cooking', 4, 'Seed cake'); u('cooking', 18, 'Scent bait'); u('cooking', 38, 'Honey bait'); u('cooking', 58, 'Smoked bait'); u('cooking', 78, 'Moonlit bait');
  for (const [raw, , , , , cn, lvl] of D.HUNT_MEATS) u('cooking', lvl, cn);
  u('crafting', 14, 'Fowling net'); u('crafting', 24, 'Warded snare'); u('crafting', 26, 'Rope halter'); u('crafting', 52, 'Iron-jaw cage'); u('crafting', 60, 'Starwoven net'); u('smithing', 60, 'Mithril halter');
  for (const t of D.HUNT_TIERS.slice(1)) { u('hunting', t.lo, `${t.name} animals`); u('beastmastery', t.lo, `${t.name} beasts`); } }
if (D.SHOPS && Array.isArray(D.SHOPS.saltmere) && !D.SHOPS.saltmere.includes('salt')) D.SHOPS.saltmere.push('salt');

/* ---------- the 40 animals ----------
   [id, name, Hunting level, home town, favourite lure, drops [[item, [min, max], chance]], note, art (builder,
   options) for the ones without an older drawing]. Small game and fowl first, the great beasts last. */
const L = D.HUNT_ANIMALS = [
  /* Beginner 1-19 */
  ['chicken', 'Chicken', 1, 'willowbrook', 'grain_mash', [['raw_chicken', [1, 1], .9], ['feather', [2, 5], .85], ['egg', [1, 1], .25]], 'Went feral after the Grubnash raids and now runs the lane like a toll road. Will follow a trail of crumbs anywhere, including into a sack.'],
  ['rabbit', 'Rabbit', 3, 'willowbrook', 'root_mash', [['raw_rabbit', [1, 1], .9], ['fur_pelt', [1, 1], .45]], 'Eats half the vegetable patch and plans to finish it. Cannot resist a potato peel, which is how most of them end up in a pie.'],
  ['rock_dove', 'Wood pigeon', 5, 'willowbrook', 'grain_mash', [['raw_gamebird', [1, 1], .8], ['feather', [2, 4], .8]], 'Fat, grey and smug about it. Coos the same five notes all summer until the whole village can hum along.'],
  ['pheasant', 'Pheasant', 8, 'willowbrook', 'root_mash', [['raw_gamebird', [1, 1], .85], ['feather', [3, 6], .9], ['egg', [1, 1], .1]], 'Loud, bright and not as quick off the ground as it thinks. Scratches up roots in the stubble and shouts about it.'],
  ['mallard', 'Mallard', 10, 'gloomfen', 'grain_mash', [['raw_duck', [1, 1], .85], ['feather', [2, 4], .7], ['down', [1, 1], .35], ['egg', [1, 1], .12]], 'An ordinary duck that has been fed bread by every child in the fen and now expects it.'],
  ['brown_hare', 'Brown hare', 12, 'mossbarrow', 'clover_cake', [['raw_rabbit', [1, 2], .85], ['fur_pelt', [1, 1], .6]], 'Boxes other hares in the spring and outruns dogs the rest of the year. Will stop for clover, and only clover.', ['hare', { fur: '#9a6a3a' }]],
  ['wild_goose', 'Greylag goose', 15, 'saltmere', 'clover_cake', [['raw_goose', [1, 1], .85], ['feather', [3, 6], .8], ['down', [1, 2], .55], ['egg', [1, 1], .15]], 'Grazes the harbour green in a gang of forty and hisses at the harbourmaster. The harbourmaster hisses back.', ['bird', { plum: '#9a9488', wing: '#6a6458', beak: '#e8903a' }]],
  ['boar', 'Wild boar', 18, 'mossbarrow', 'root_mash', [['raw_boar', [1, 2], .9], ['boar_tusk', [1, 1], .5], ['tallow', [1, 1], .4]], 'Roots up whole fields overnight and charges anything that complains. Dig a little potato into the ground and it forgets to be angry.'],
  /* Intermediate 20-39 */
  ['red_grouse', 'Red grouse', 20, 'ironpeak', 'berry_mash', [['raw_gamebird', [1, 1], .85], ['feather', [2, 5], .85]], 'Explodes out of the heather at your feet with a noise like a dropped tray, then lands ten yards away looking innocent.', ['bird', { plum: '#8a3a2a', wing: '#5a2a1e', beak: '#3a2a24', crest: '#d8402a', small: true }]],
  ['roe_deer', 'Roe deer', 22, 'mossbarrow', 'salt_lick', [['raw_venison', [1, 1], .85], ['deer_hide', [1, 1], .5], ['antler', [1, 1], .25]], 'Small, quick and gone. Usually you see the white of its rump and nothing else, unless there is salt about.'],
  ['sheep', 'Wild sheep', 25, 'willowbrook', 'clover_cake', [['raw_mutton', [1, 1], .85], ['wool', [1, 3], .85], ['horn', [1, 1], .2]], 'Left the farm two generations ago and never looked back. Still turns up at the gate when the clover comes in.'],
  ['red_fox', 'Red fox', 27, 'willowbrook', 'carrion_bait', [['fur_pelt', [1, 2], .75]], 'The real reason the chickens hold meetings. Ignores anything you cooked on purpose and steals anything you did not.'],
  ['capercaillie', 'Capercaillie', 30, 'mossbarrow', 'berry_mash', [['raw_gamebird', [1, 2], .85], ['feather', [3, 7], .9]], 'A grouse the size of a turkey that clicks and pops like a cart wheel to impress other grouse. Lives on bilberries.'],
  ['fallow_deer', 'Fallow deer', 32, 'mossbarrow', 'berry_mash', [['raw_venison', [1, 2], .85], ['deer_hide', [1, 1], .55], ['antler', [1, 1], .3]], 'Spotted, shy and very fond of other people’s orchards. Hears a twig snap from two fields away.'],
  ['mountain_goat', 'Mountain goat', 35, 'ironpeak', 'salt_lick', [['raw_mutton', [1, 2], .8], ['horn', [1, 1], .4], ['frost_pelt', [1, 1], .25]], 'Climbs cliffs that would scare a cat and licks the salt off them when it gets there. Has eaten a sign that said “No goats”.'],
  ['beaver', 'Beaver', 38, 'gloomfen', 'root_mash', [['fur_pelt', [1, 2], .85], ['tallow', [1, 1], .3]], 'Built half the fen’s dams and floods the road whenever it feels the road is getting above itself. Gnaws lantern posts for practice.'],
  /* Skilled 40-59 */
  ['turkey', 'Wild turkey', 40, 'willowbrook', 'grain_mash', [['raw_gamebird', [2, 3], .9], ['feather', [4, 8], .9], ['egg', [1, 1], .1]], 'Thinks it runs the farm. Has chased the postman, the vicar and once a cart, and stops for a handful of grain every time.'],
  ['ibex', 'Ibex', 42, 'skyreach', 'salt_lick', [['raw_mutton', [1, 2], .85], ['horn', [1, 2], .5], ['frost_pelt', [1, 1], .2]], 'Climbs sheer rock walls to lick the salt off them. Its horns are longer than your arm and it knows exactly where your arm is.'],
  ['red_deer', 'Red deer', 45, 'mossbarrow', 'salt_lick', [['raw_venison', [1, 2], .9], ['deer_hide', [1, 2], .6], ['antler', [1, 1], .4]], 'A big red stag that rules the glades in autumn. Roars all night; the village roars back, mostly asking it to stop.'],
  ['lynx', 'Lynx', 47, 'mossbarrow', 'carrion_bait', [['fur_pelt', [1, 2], .85], ['frost_pelt', [1, 1], .15]], 'Tufted ears, enormous paws and a stare that makes you check your laces. Comes to meat, never to sweets.'],
  ['black_bear', 'Black bear', 50, 'mossbarrow', 'honey_cake', [['raw_bear', [1, 2], .85], ['bear_pelt', [1, 1], .5], ['tallow', [1, 2], .5]], 'Mostly eats berries. Mostly. The honey-takers of Mossbarrow carry two pots: one for the bear.'],
  ['seal', 'Grey seal', 52, 'saltmere', 'fishoil_bait', [['tallow', [1, 2], .8], ['fur_pelt', [1, 1], .5]], 'Hauled out on the rocks, fat with fish. Sings on still nights; fishers say it is a lament, but it is mostly about herring.'],
  ['reindeer', 'Reindeer', 55, 'ironpeak', 'clover_cake', [['raw_venison', [1, 2], .85], ['deer_hide', [1, 1], .55], ['antler', [1, 2], .45], ['frost_pelt', [1, 1], .2]], 'Comes down from the snowfields every winter in a herd that sounds like knitting. Both kinds grow antlers.', ['deer', { fur: '#8a7a6a', antler: '#e8dcc0' }]],
  ['great_bustard', 'Great bustard', 58, 'skyreach', 'clover_cake', [['raw_gamebird', [2, 4], .9], ['feather', [5, 10], .9], ['down', [1, 2], .3]], 'The heaviest bird that still bothers to fly. Mostly it walks the high meadows with tremendous dignity and a mouthful of leaves.'],
  /* Expert 60-79 */
  ['wolverine', 'Wolverine', 60, 'ironpeak', 'carrion_bait', [['fur_pelt', [2, 3], .85], ['frost_pelt', [1, 1], .4]], 'The size of a dog and the temper of three. Will drag off a carcass twice its weight and then come back for your bag.', ['quad', { fur: '#4a3424', dark: '#2a1c14', short: true, stout: true, ears: 'round', tail: 'bushy', saddle: true }]],
  ['elk', 'Elk', 62, 'hollow', 'berry_mash', [['raw_venison', [2, 3], .9], ['deer_hide', [1, 2], .65], ['antler', [1, 2], .5]], 'A deer the size of a horse that bugles across the valley at dusk. Cannot walk past a fruiting bush without stopping.', ['deer', { fur: '#7a5a3a', antler: '#d8c8a0' }]],
  ['musk_ox', 'Musk ox', 65, 'ironpeak', 'root_mash', [['raw_beef', [1, 2], .85], ['wool', [2, 5], .8], ['horn', [1, 1], .45], ['frost_pelt', [1, 1], .35]], 'Wears a coat that drags on the snow. Forms a circle with the others and stares at you until you leave, or dig.'],
  ['aurochs', 'Wild ox', 67, 'hollow', 'grain_mash', [['raw_beef', [2, 3], .9], ['cowhide', [1, 2], .8], ['horn', [1, 1], .45], ['tallow', [1, 1], .4]], 'The great-great-grandmother of every cow in Willowbrook, and nothing like as polite. Still comes to a bucket of grain.'],
  ['moose', 'Moose', 70, 'gloomfen', 'salt_lick', [['raw_venison', [2, 4], .9], ['deer_hide', [2, 2], .7], ['antler', [1, 2], .6]], 'Walks through the forest rather than round it. The trees have learned to lean. Will cross a river for salt.'],
  ['brown_bear', 'Brown bear', 72, 'hollow', 'honey_cake', [['raw_bear', [2, 3], .9], ['bear_pelt', [1, 1], .6], ['tallow', [1, 2], .6]], 'Stands up to see you better, which does not help anyone. Has opinions about bees and the honey they keep from it.', ['quad', { fur: '#6a4a2e', dark: '#3a2818', ears: 'round', snout: true, snoutCol: '#9a7a5a', big: true, stout: true }]],
  ['bison', 'Bison', 75, 'skyreach', 'salt_lick', [['raw_beef', [2, 4], .9], ['cowhide', [1, 2], .75], ['horn', [1, 1], .5], ['tallow', [1, 2], .5]], 'A ton of shaggy patience. Rolls in the dust, licks the salt, and moves for nobody, not even the weather.', ['quad', { fur: '#5a3e28', dark: '#2e2018', horns: true, hornCol: '#2a2420', big: true, mane: true, stout: true, ears: 'round' }]],
  ['water_buffalo', 'Water buffalo', 78, 'gloomfen', 'clover_cake', [['raw_beef', [2, 3], .9], ['cowhide', [1, 2], .8], ['horn', [1, 2], .55]], 'Spends the afternoon up to its nose in the fen and the evening deciding whether you are worth getting out for.', ['quad', { fur: '#3a3a40', dark: '#1e1e24', horns: true, hornCol: '#6a6058', big: true, ears: 'floppy', tail: 'thin' }]],
  /* Master 80-99 */
  ['argali', 'Argali', 80, 'skyreach', 'salt_lick', [['raw_mutton', [2, 3], .9], ['horn', [2, 2], .6], ['wool', [1, 3], .5]], 'The biggest wild sheep there is, with horns that curl round twice. Lives where the air runs out and the salt begins.', ['quad', { fur: '#a8865a', horns: true, hornCol: '#c8b088', ears: 'pointy', tail: 'thin', big: true, belly: '#efe2c8' }]],
  ['walrus', 'Walrus', 82, 'saltmere', 'fishoil_bait', [['ivory', [1, 1], .6], ['tallow', [2, 3], .85]], 'Hauls itself on to the rocks and sleeps there for a week. Wakes up and wants the rocks to itself, and your fish.'],
  ['woolly_yak', 'Wild yak', 85, 'ironpeak', 'clover_cake', [['raw_beef', [2, 3], .9], ['wool', [3, 6], .9], ['horn', [1, 1], .45], ['frost_pelt', [1, 2], .45]], 'A slow shaggy mountain of wool with horns. The tame ones carry the convoy; this one carried off the convoy.'],
  ['giant_eland', 'Giant eland', 87, 'emberfall', 'berry_mash', [['raw_venison', [2, 4], .9], ['deer_hide', [2, 3], .7], ['horn', [1, 2], .55]], 'An antelope as tall as a door that clears a fence from standing. Browses the fruiting thorn on the ash plains.', ['quad', { fur: '#b8925a', horns: true, hornCol: '#4a3a2a', ears: 'pointy', tail: 'thin', big: true, saddle: true }]],
  ['cape_buffalo', 'Cape buffalo', 90, 'emberfall', 'clover_cake', [['raw_beef', [3, 4], .9], ['cowhide', [2, 2], .8], ['horn', [1, 2], .65]], 'Wallows in the cooling pools and remembers every face. The most patient grudge on the ash plains.', ['quad', { fur: '#2a2422', dark: '#141210', horns: true, hornCol: '#4a4238', big: true, stout: true, ears: 'floppy' }]],
  ['elephant_seal', 'Elephant seal', 92, 'saltmere', 'fishoil_bait', [['tallow', [3, 5], .9], ['fur_pelt', [1, 1], .3]], 'A seal with a nose like a trumpet and the volume to match. Owns the beach in winter and lets you know.'],
  ['gaur', 'Gaur', 95, 'emberfall', 'salt_lick', [['raw_beef', [3, 5], .9], ['cowhide', [2, 3], .85], ['horn', [2, 2], .65], ['tallow', [1, 2], .5]], 'The largest wild cattle in the world, in white stockings. Digs at salt licks like a miner on a bonus.', ['quad', { fur: '#3a2a1e', dark: '#1e140e', horns: true, hornCol: '#c8b888', big: true, stout: true, ears: 'round', belly: '#e8dcc0' }]],
  ['polar_bear', 'Polar bear', 98, 'ironpeak', 'fishoil_bait', [['raw_bear', [2, 4], .9], ['bear_pelt', [1, 2], .7], ['frost_pelt', [1, 2], .6], ['tallow', [2, 3], .7]], 'Walks a hundred miles of ice for the smell of fish oil and arrives unhurried. The work of a lifetime, and it knows.', ['quad', { fur: '#f0ece0', dark: '#c8c0b0', ears: 'round', snout: true, snoutCol: '#2a2a2a', big: true, stout: true }]]
];
/* drawings for the animals that used to be on the old grounds (their own recipes, kept as they were) */
const ART = {
  rock_dove: ['bird', { plum: '#9aa0a8', wing: '#6a7078', beak: '#d8b0a0', small: true }],
  mallard: ['bird', { plum: '#6a5a44', wing: '#3a7a5a', beak: '#e8c040', small: true, crest: '#2a6a4a' }],
  roe_deer: ['deer', { fur: '#a8683a', antler: '#c8b090' }],
  red_fox: ['fox', { fur: '#c8642a' }],
  capercaillie: ['bird', { plum: '#2a2a2e', wing: '#4a5a3a', beak: '#e8e0c8', crest: '#c83a2a' }],
  fallow_deer: ['deer', { fur: '#c8945a', antler: '#e8d8b8' }],
  beaver: ['quad', { fur: '#6a4a2e', short: true, stout: true, ears: 'round', snout: true, snoutCol: '#4a3220', tail: 'thin' }],
  turkey: ['bird', { plum: '#5a4a3a', wing: '#8a6a4a', beak: '#e8c060', crest: '#c83a3a' }],
  ibex: ['quad', { fur: '#9a8a6a', horns: true, hornCol: '#4a3a2a', ears: 'pointy', tail: 'thin', big: true }],
  lynx: ['fox', { fur: '#b8945a' }],
  black_bear: ['quad', { fur: '#2a2628', dark: '#141214', ears: 'round', snout: true, snoutCol: '#8a6a5a', big: true, stout: true }],
  great_bustard: ['bird', { plum: '#b8945a', wing: '#e8e0d0', beak: '#a8a088', crest: '#f0e8d8' }],
  musk_ox: ['quad', { fur: '#3e3228', wool: true, horns: true, hornCol: '#d8cca8', big: true, stout: true }],
  aurochs: ['quad', { fur: '#2e2420', dark: '#1a1412', horns: true, hornCol: '#efe2c4', big: true, ears: 'floppy', tail: 'thin', saddle: true }],
  moose: ['deer', { fur: '#4a3628', antler: '#c8b088' }],
  walrus: ['quad', { fur: '#9a6a4e', dark: '#6a4432', short: true, big: true, snout: true, snoutCol: '#c89a7a', tusks: true }],
  elephant_seal: ['quad', { fur: '#7a6a5e', short: true, big: true, snout: true, snoutCol: '#9a7a6a', stout: true }]
};
/* the 30 mythical beasts: [id, name, Beastmastery level, kind (capture tool), home town, note, art (builder, options)
   or null where the creature art already exists under this id] */
D.MYTHS = [
  /* Beginner 1-19 */
  ['thimblefox', 'Thimblefox', 2, 'small', 'mossbarrow', 'A fox no bigger than a teapot that steals thimbles, buttons and anything small and shiny. Its den looks like a sewing basket.', null],
  ['bellhare', 'Bellhare', 5, 'small', 'mossbarrow', 'Lives in the belladonna patch and rings like a little bell when it runs. Nobody knows why the berries never hurt it, and it is not telling.', null],
  ['candletoad', 'Candletoad', 8, 'small', 'gloomfen', 'A fat fen toad with a glow in its throat like a candle. Fen folk used them as lanterns until the toads started wandering off with the light.', null],
  ['tideglass', 'Tideglass skitter', 11, 'small', 'saltmere', 'A skittering shore thing with a shell of sea glass. Children collect the shells. The skitters would like them back.', null],
  ['hearth_hare', 'Hearth hare', 14, 'small', 'willowbrook', 'Warm to the touch, and the frost never settles where it sleeps. Farmers leave a gap in the wall for it and a bowl of seed cake.', ['hare', { fur: '#d89048' }]],
  ['cockatrice', 'Cockatrice', 17, 'winged', 'willowbrook', 'Half cockerel, half bad idea. Its stare turns milk sour and people stiff with embarrassment. Crows at midnight, out of spite.', ['bird', { plum: '#c8a040', wing: '#4a7a3a', beak: '#e8b030', crest: '#d83a2a', glow: '#ff6a3a' }]],
  /* Intermediate 20-39 */
  ['prismkite', 'Prism kite', 21, 'winged', 'skyreach', 'A thin bright bird that splits the sunlight into rainbows as it flies. Skyreach washing is very colourful and never quite dry.', null],
  ['will_o_wisp', 'Will-o’-wisp', 24, 'spirit', 'gloomfen', 'A small cold light that bobs over the fen and leads walkers into the deep water. In a warded snare it sulks like a candle in a draught.', ['wisp', { col: '#9be07a', lantern: true }]],
  ['chimehorn', 'Chimehorn', 27, 'hoofed', 'ironpeak', 'A goat whose horns ring like chimes when it butts something. Ironpeak always knows when one is annoyed, which is always.', null],
  ['glassback', 'Glassback', 30, 'small', 'emberfall', 'A lizard whose back has cooled into black glass in the Emberfall heat. Smiths say it is good luck. The lizard says nothing and bites.', null],
  ['kelpie', 'Kelpie', 33, 'hoofed', 'saltmere', 'A water horse with weed in its mane that offers tired walkers a ride into the sea. Takes a halter badly and a carrot well.', ['quad', { fur: '#2e5a5a', dark: '#1a3a3a', mane: true, ears: 'pointy', tail: 'bushy', big: true, glassy: true, glow: '#7ae8c8', spots: '#4a8a5a' }]],
  ['moon_hare', 'Moon hare', 36, 'small', 'hollow', 'A pale hare that glows faintly and carries a little moonlight in its pouch. Children leave carrots out; in the morning there is moonlight on the step.', null],
  ['moonpearl_seal', 'Selkie', 39, 'small', 'saltmere', 'A seal that is sometimes a girl on the rocks combing her hair, and always a seal when you look properly. Keeps its skin folded very carefully.', ['quad', { fur: '#d8dcf0', short: true, snout: true, snoutCol: '#f0f0ff', glow: '#a8c0f0', glassy: true }]],
  /* Skilled 40-59 */
  ['storm_pegasus', 'Hippogriff', 42, 'winged', 'skyreach', 'An eagle in front and a horse behind, and neither half will apologise for the other. Bow before you approach. It checks.', ['quad', { fur: '#e8ecf4', mane: true, ears: 'pointy', tail: 'bushy', big: true, storm: true, cloud: true }]],
  ['mirelight_stag', 'Mirelight stag', 45, 'hoofed', 'gloomfen', 'A stag whose antlers glow green at night. Folk once followed the light into the bog. Some came back with a story.', null],
  ['fire_salamander', 'Ember salamander', 48, 'spirit', 'emberfall', 'A lizard of living coal that sleeps in forge fires and wakes up hungry. Do not put it out; it is resting.', ['newt', { col: '#2a2420', fin: '#ffb04a' }]],
  ['nimbusgrazer', 'Nimbus grazer', 51, 'hoofed', 'skyreach', 'A big woolly cloud of a beast that grazes the sky meadows. When it lies down it is hard to tell from the weather.', null],
  ['kirin', 'Kirin', 54, 'hoofed', 'ironpeak', 'A scaled deer with antlers like coral that walks on grass without bending it. Appears before good harvests and very good weddings.', ['quad', { fur: '#e8b040', antlers: '#7ae8c8', mane: true, spots: '#f8e8a0', glow: '#fff0a0', ears: 'pointy', tail: 'bushy' }]],
  ['cinder_basilisk', 'Basilisk hatchling', 57, 'fierce', 'emberfall', 'Do not meet its eyes; you will be fine but extremely embarrassed. Trappers wear hats pulled low and talk to it kindly.', ['serpent', { col: '#8a5a2a' }]],
  /* Expert 60-79 */
  ['firebird', 'Firebird', 60, 'winged', 'emberfall', 'A bird of red and gold flame. Its tail feathers are prized and its temper is legendary.', null],
  ['twilight_unicorn', 'Unicorn', 63, 'hoofed', 'hollow', 'Real, it turns out, and nothing like the paintings: muddy, bad-tempered and very good at hiding. Takes to mithril, oddly.', ['deer', { fur: '#8a7aa8', antler: '#f0e8ff' }]],
  ['griffin', 'Griffin', 66, 'fierce', 'skyreach', 'An eagle’s head and wings on a lion’s body, and the pride of both. Mates for life and holds grudges for longer.', null],
  ['phoenix_hen', 'Phoenix chick', 69, 'spirit', 'emberfall', 'A young phoenix that keeps catching fire and then getting better. Very warm to hold, briefly.', ['bird', { plum: '#e8703a', wing: '#ffd04a', beak: '#ffe070', crest: '#ff4a2a' }]],
  ['sphinx_cub', 'Sphinx cub', 72, 'fierce', 'emberfall', 'A lion cub with a face that asks riddles. It is too young to know the answers, so any guess annoys it.', ['quad', { fur: '#d8b070', mane: true, ears: 'round', tail: 'thin', glow: '#ffe070', plates: '#f0dca0', big: true }]],
  ['thunderbird', 'Thunderbird', 76, 'winged', 'skyreach', 'Flaps once and the sky cracks. The cloud giants leave it offerings, and stand well back.', ['bird', { plum: '#3a4a7a', wing: '#f0e060', beak: '#fff0a0', spread: true, crest: '#7ac8e8', storm: true }]],
  /* Master 80-99 */
  ['star_stag', 'Star stag', 81, 'hoofed', 'hollow', 'A dark stag with stars in its coat and pale antlers. It only walks where no lamps are lit.', null],
  ['kraken_calf', 'Kraken calf', 84, 'fierce', 'saltmere', 'A young kraken that took a wrong turn into the shallows. Only the size of a fishing boat. Yet.', ['serpent', { col: '#7a3a6a' }]],
  ['sun_phoenix', 'Sun phoenix', 87, 'spirit', 'emberfall', 'When it dies it bursts into flame and comes back younger. When it is caught it is merely very annoyed.', ['bird', { plum: '#ffb030', wing: '#ff5a2a', beak: '#fff0a0', spread: true, crest: '#fff0a0', glassy: true }]],
  ['celestial_unicorn', 'Celestial unicorn', 91, 'hoofed', 'hollow', 'The one in the paintings. Stars follow it through the glade like ducklings. Catching it is the work of a lifetime.', ['deer', { fur: '#e8e4ff', antler: '#f0c75a' }]],
  ['eclipse_roc', 'Eclipse roc', 95, 'winged', 'hollow', 'A black bird big enough to blot out the sun, with a ring of gold where its eye catches the light. Every candle gutters when it passes.', null]
].map(([id, name, bl, kind, town, note, art], i) => ({ id, name, bl, kind, town, note, art, tier: D.huntTierOf(bl), index: i }));
D.MYTH = Object.fromEntries(D.MYTHS.map(m => [m.id, m]));
D.MYTH_ART = Object.fromEntries(D.MYTHS.filter(m => m.art).map(m => [m.id, m.art]));

/* ---------- Fieldwork's regional hauls: what the old grounds of each region gave, at the Hunting level the first
   animal that dropped it was found at (the generic raw game is now the region's own meat) ---------- */
D.FIELD_MATS = {
  willowbrook: { feather: 1, seed_potato: 1, gem_sapphire: 1, egg: 1, raw_rabbit: 1, wool: 6, cowhide: 8, gem_diamond: 82 },
  mossbarrow: { boar_tusk: 10, seed_onion: 10, seed_cabbage: 10, gem_sapphire: 10, raw_rabbit: 9, cowhide: 9, seed_strawberry: 9, feather: 14, wolf_pelt: 14, seed_pumpkin: 18, egg: 35, gem_diamond: 81 },
  saltmere: { feather: 3, egg: 3, raw_duck: 3, gem_sapphire: 12, raw_trout: 12, gem_emerald: 12, cowhide: 20, old_bone: 20, bogscale: 35, wyrm_scale: 62, gem_diamond: 82 },
  ironpeak: { raw_gamebird: 1, frost_pelt: 1, feather: 6, egg: 6, wool: 22, ore_coal: 28, gem_diamond: 80 },
  gloomfen: { bogscale: 2, raw_duck: 2, feather: 6, egg: 6, seed_goldleaf: 49, old_bone: 55, wyrm_scale: 61, gem_diamond: 81 },
  emberfall: { raw_gamebird: 3, drakehide: 3, feather: 15, egg: 15, wool: 42, ember_core: 54, gem_diamond: 82 },
  skyreach: { feather: 1, egg: 1, raw_gamebird: 1, wool: 6, drakehide: 10, gem_diamond: 70, seed_starfruit: 70 },
  hollow: { raw_rabbit: 2, wyrm_scale: 2, feather: 6, egg: 6, wool: 70, gem_diamond: 86 }
};

/* ---------- the ground: the 40 become the only animals in the game ---------- */
const AN = [[1, 3, 1], [9, 12, 2], [19, 26, 5], [30, 46, 8], [49, 72, 12], [69, 128, 19], [88, 230, 31], [106, 390, 39], [120, 520, 48]];
const statAt = cl => { let i = AN.findIndex(r => r[0] >= cl); if (i < 0) i = AN.length - 1; if (i === 0) return AN[0].slice(1); const a = AN[i - 1], b = AN[i], f = (cl - a[0]) / (b[0] - a[0]); return a.slice(1).map((v, k) => v + (b[k + 1] - v) * f); };
/* the villains of Willowbrook were first cloned from the old farm animals (villains.js); keep those as their template */
D.MON_TEMPLATES = Object.fromEntries(['cow', 'chicken'].filter(id => D.MON[id]).map(id => [id, JSON.parse(JSON.stringify(D.MON[id]))]));
const keep = new Set(L.map(a => a[0]));
/* a beast that used to be a creature keeps its colour (its companion, egg and pen tint) */
for (const m of D.MYTHS) m.col = (D.MON[m.id] && D.MON[m.id].col) || (m.art && (m.art[1].fur || m.art[1].plum || m.art[1].col)) || '#b8a8e8';
const gone = D.MONLIST.filter(m => (m.hl || m.huntKind) && !keep.has(m.id)).map(m => m.id);
/* the mythical beasts and the old ground animals are no longer creatures: off the list before anything reads it */
for (const id of [...gone, ...D.MYTHS.map(m => m.id)]) { if (keep.has(id)) continue; delete D.MON[id]; if (D.EXTRA_CREATURES) delete D.EXTRA_CREATURES[id]; }
D.MONLIST.splice(0, D.MONLIST.length, ...D.MONLIST.filter(m => D.MON[m.id] === m));
D.HUNT_GONE = gone;
D.HUNT_ART = {};
D.EXTRA_CREATURES = D.EXTRA_CREATURES || {};
for (const [id, name, hl, town, lure, drops, note, art] of L) {
  let m = D.MON[id];
  if (!m) { const cl = Math.max(1, Math.round(hl / .82)), [hp, max] = statAt(cl);
    m = { id, cl, hp: Math.max(2, Math.round(hp * .85 * .62)), max: Math.max(1, Math.round(max * .8 * .72)), att: Math.round(cl * .9), def: Math.round(cl * .8), coins: [0, 0] };
    D.MON[id] = m; D.MONLIST.push(m); }
  const a = art || ART[id];
  if (a) { D.HUNT_ART[id] = a; if (!D.EXTRA_CREATURES[id] || D.EXTRA_CREATURES[id].mark === 'hunt') D.EXTRA_CREATURES[id] = { body: a[0] === 'bird' ? 'winged' : 'beast', mark: 'hunt', index: Object.keys(D.EXTRA_CREATURES).length }; }
  Object.assign(m, { name, town, hl, tier: D.huntTierOf(hl), ground: true, lure, drops: drops.map(d => [d[0], d[1].slice(), d[2]]), huntKind: 'game', col: m.col || (a && (a[1].fur || a[1].plum)) || '#8a7a6a' });
  (D.HUNT_NOTES = D.HUNT_NOTES || {})[id] = note;
}
D.HUNT_GROUND = L.map(a => a[0]).sort((a, b) => D.MON[a].hl - D.MON[b].hl);
/* each region's own animals in its hunting-ground area (villains.js lays the areas out from D.ROSTER), so a quest's
   animal can still be fought before Hunting is learned and every animal has a home in the field guide */
for (const [town, r] of Object.entries(D.ROSTER || {})) if (r.hunt) r.hunt[1] = D.HUNT_GROUND.filter(id => D.MON[id].town === town);
for (const m of D.MYTHS) (D.MYTH_NOTES = D.MYTH_NOTES || {})[m.id] = m.note;
/* field-guide notes in the house voice: the hunting ground's and the beasts' replace any older note under the id */
const notes = () => { if (!D.LORE) return; for (const [id, note] of Object.entries({ ...D.HUNT_NOTES, ...D.MYTH_NOTES })) D.LORE[id] = { note, legend: note }; };
notes(); if (typeof document !== 'undefined' && document.readyState === 'loading') document.addEventListener('DOMContentLoaded', notes);
})();
