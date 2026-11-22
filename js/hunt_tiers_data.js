/* Idlewick: hunting tiers (owner, 23 Nov 2026: "a LOT more animals to hunt, with tiers like Beginner, Intermediate,
   Skilled, Expert and Master, increasingly impressive things to hunt, as grounded as possible and more fantastical
   the further up you go ... this will require new traps and materials to capture them").
   Five tiers by Hunting level. Every hunting ground holds five animals in every tier (8 grounds x 5 tiers x 5 = 200;
   the 39 animals already in the game keep their ids, levels, kills and field-guide pages and fill their own tier).
   Kit: from Intermediate up, a hunt needs that tier's trap in your pack (kept, never used up) and one bait per hunt
   (used whether the strike lands or not). Beginner needs nothing; a wooden trap still helps the strike.
     Beginner      Hunting 1-19   no kit
     Intermediate  Hunting 20-39  Reinforced field trap (Crafting 12)  + Scent bait (Cooking 18)
     Skilled       Hunting 40-59  Precision field trap (Crafting 35)   + Honey bait (Cooking 38)
     Expert        Hunting 60-79  Iron-jaw cage (Crafting 58)          + Smoked lure (Cooking 58)
     Master        Hunting 80-99  Starwoven net (Crafting 78)          + Moonlit lure (Cooking 78)
   Baits come ten to a batch and are made from raw game (which hunting itself provides), a crop and, higher up, logs or
   runes, so the loop feeds itself. An active quest's animal never needs the kit (quests are never blocked).
   Data and sprite recipes; drawing is in pixel_hunt.js, the activity in hunt_stalk.js. */
(() => {
const D = window.DQ.data;
D.HUNT_TIERS = [
  { id: 'beginner', name: 'Beginner', lo: 1, hi: 19, trap: null, bait: null },
  { id: 'intermediate', name: 'Intermediate', lo: 20, hi: 39, trap: 'reinforced_trap', bait: 'scent_bait' },
  { id: 'skilled', name: 'Skilled', lo: 40, hi: 59, trap: 'precision_trap', bait: 'honey_bait' },
  { id: 'expert', name: 'Expert', lo: 60, hi: 79, trap: 'ironjaw_cage', bait: 'smoked_lure' },
  { id: 'master', name: 'Master', lo: 80, hi: 99, trap: 'starwoven_net', bait: 'moonlit_lure' }
];
D.huntTierOf = hl => D.HUNT_TIERS.findIndex(t => hl <= t.hi) < 0 ? 4 : D.HUNT_TIERS.findIndex(t => hl <= t.hi);
/* ---------- the new kit ---------- */
const item = (id, name, col, val, sub, extra = {}) => { D.ITEMS[id] = { id, name, type: 'craft', ic: 'beastmastery', col, val, sub, ...extra }; };
item('ironjaw_cage', 'Iron-jaw cage', '#8a8f98', 260, 'Expert hunting trap. Kept in your pack; needed for Expert animals (Hunting 60+).', { trap: true, huntTrap: true });
item('starwoven_net', 'Starwoven net', '#b8a8e8', 620, 'Master hunting trap. Kept in your pack; needed for Master animals (Hunting 80+).', { trap: true, huntTrap: true });
item('scent_bait', 'Scent bait', '#9a6a3a', 6, 'One per Intermediate hunt (Hunting 20-39).', { bait: true });
item('honey_bait', 'Honey bait', '#e0a83a', 12, 'One per Skilled hunt (Hunting 40-59).', { bait: true });
item('smoked_lure', 'Smoked lure', '#8a5a4a', 22, 'One per Expert hunt (Hunting 60-79).', { bait: true });
item('moonlit_lure', 'Moonlit lure', '#a8c0f0', 40, 'One per Master hunt (Hunting 80-99).', { bait: true });
const recipe = r => { D.RECIPES[r.id] = r; (D.RLIST[r.skill] = D.RLIST[r.skill] || []).push(r); };
recipe({ id: 'craft_ironjaw_cage', name: 'Iron-jaw cage', skill: 'crafting', tab: 'Tools', lvl: 58, xp: 290, t: 4000, in: { bar_mithril: 3, plank_yew: 2, cowhide: 2, string: 3 }, out: { ironjaw_cage: 1 }, ev: 'craft' });
recipe({ id: 'craft_starwoven_net', name: 'Starwoven net', skill: 'crafting', tab: 'Tools', lvl: 78, xp: 520, t: 4500, in: { bar_adamant: 3, plank_magic: 2, drakehide: 2, string: 6 }, out: { starwoven_net: 1 }, ev: 'craft' });
recipe({ id: 'cook_scent_bait', name: 'Scent bait', skill: 'cooking', tab: 'Bait', lvl: 18, xp: 30, t: 2400, in: { raw_game: 2, crop_onion: 1 }, out: { scent_bait: 10 }, ev: 'cook' });
recipe({ id: 'cook_honey_bait', name: 'Honey bait', skill: 'cooking', tab: 'Bait', lvl: 38, xp: 55, t: 2400, in: { raw_game: 2, honey: 1, crop_wheat: 1 }, out: { honey_bait: 10 }, ev: 'cook' });
recipe({ id: 'cook_smoked_lure', name: 'Smoked lure', skill: 'cooking', tab: 'Bait', lvl: 58, xp: 85, t: 2600, in: { raw_game: 3, log_maple: 1, crop_goldleaf: 1 }, out: { smoked_lure: 10 }, ev: 'cook' });
recipe({ id: 'cook_moonlit_lure', name: 'Moonlit lure', skill: 'cooking', tab: 'Bait', lvl: 78, xp: 120, t: 2800, in: { raw_game: 3, crop_moonmelon: 1, rune: 5 }, out: { moonlit_lure: 10 }, ev: 'cook' });
if (D.UNL) { const u = (sk, l, n) => { (D.UNL[sk] = D.UNL[sk] || {})[l] = [...(D.UNL[sk][l] || []), n]; };
  u('crafting', 58, 'Iron-jaw cage'); u('crafting', 78, 'Starwoven net'); u('cooking', 18, 'Scent bait'); u('cooking', 38, 'Honey bait'); u('cooking', 58, 'Smoked lure'); u('cooking', 78, 'Moonlit lure');
  for (const t of D.HUNT_TIERS.slice(1)) u('hunting', t.lo, `${t.name} animals`); }

/* ---------- the animals ----------
   [id, name, ground, tier 0-4, kind (game|wool|bird|shell|scale), builder, builder options, field-guide note]
   kinds pick the drops; builders are pixel_creatures.js's (quad, bird, deer, hare, fox, newt, serpent, armoured). */
const A = [
  /* Willowbrook, the farm fields: farm and hedgerow animals, then the ones the old farmers swore they saw */
  ['wild_goat', 'Wild goat', 'willowbrook', 1, 'game', 'quad', { fur: '#b8a88a', horns: true, hornCol: '#5a4a3a', ears: 'pointy', tail: 'thin' }, 'Escaped from somebody in 1987 and has been eating fences ever since. Treats every trap as a snack with a puzzle in it.'],
  ['badger', 'Badger', 'willowbrook', 1, 'game', 'quad', { fur: '#6a6a6e', dark: '#2a2a2e', belly: '#e8e8e8', short: true, stout: true, ears: 'round', snout: true, snoutCol: '#f2f2f2' }, 'Digs under the henhouse every night, then looks offended when you mention it.'],
  ['red_fox', 'Red fox', 'willowbrook', 1, 'game', 'fox', { fur: '#c8642a' }, 'The real reason the chickens hold meetings. Clever enough to spring your trap with a stick.'],
  ['barn_owl', 'Barn owl', 'willowbrook', 1, 'bird', 'bird', { plum: '#e8d8b8', wing: '#c8a878', beak: '#e8d8c8' }, 'Lives in the hayloft and screams at midnight for reasons it keeps to itself.'],
  ['wild_turkey', 'Wild turkey', 'willowbrook', 1, 'bird', 'bird', { plum: '#5a4a3a', wing: '#8a6a4a', beak: '#e8c060', crest: '#c83a3a' }, 'Thinks it runs the farm. Has been known to chase the postman, the vicar and once a cart.'],
  ['fallow_deer', 'Fallow deer', 'willowbrook', 2, 'game', 'deer', { fur: '#c8945a', antler: '#e8d8b8' }, 'Spotted, shy and very fond of other people’s orchards. Hears a twig snap from two fields away.'],
  ['orchard_tusker', 'Orchard tusker', 'willowbrook', 2, 'game', 'quad', { fur: '#5a4a3e', dark: '#2e2620', tusks: true, snout: true, snoutCol: '#8a6a5a', ears: 'pointy', big: true, mane: true }, 'A boar the size of a wheelbarrow that eats windfall apples until it is slightly drunk. Charges when sober.'],
  ['great_bustard', 'Great bustard', 'willowbrook', 2, 'bird', 'bird', { plum: '#b8945a', wing: '#e8e0d0', beak: '#a8a088', crest: '#f0e8d8' }, 'The heaviest bird that still bothers to fly. Mostly it walks, with tremendous dignity.'],
  ['aurochs', 'Wild aurochs', 'willowbrook', 2, 'game', 'quad', { fur: '#2e2420', dark: '#1a1412', horns: true, hornCol: '#efe2c4', big: true, ears: 'floppy', tail: 'thin', saddle: true }, 'The great-great-grandmother of every cow in Willowbrook, and nothing like as polite.'],
  ['hedge_hound', 'Hedgerow hound', 'willowbrook', 2, 'game', 'fox', { fur: '#8a7a5a' }, 'A wild dog that lives in the hedges and knows every gap in them. You will not, so bring bait.'],
  ['golden_pheasant', 'Golden pheasant', 'willowbrook', 3, 'bird', 'bird', { plum: '#e8b030', wing: '#c83a2a', beak: '#f0e0a0', crest: '#ffd84a' }, 'So bright the crows complain. The miller swears one laid a gold egg; the miller also swears at the mill.'],
  ['hearth_hare', 'Hearth hare', 'willowbrook', 3, 'game', 'hare', { fur: '#d89048' }, 'Warm to the touch, and the frost never settles where it sleeps. Farmers leave a gap in the wall for it.'],
  ['thornback_hog', 'Thornback hog', 'willowbrook', 3, 'game', 'quad', { fur: '#6a5a3e', tusks: true, snout: true, snoutCol: '#9a7a6a', ears: 'pointy', thorns: true }, 'Grew up in the bramble patch and came out with the brambles still attached. Do not hug.'],
  ['mist_stag', 'Mist stag', 'willowbrook', 3, 'game', 'deer', { fur: '#c8ccd0', antler: '#f0f4f8' }, 'Seen only at dawn, standing in the low fog by the river. Leaves no hoofprints, just damp grass.'],
  ['harvest_ram', 'Harvest ram', 'willowbrook', 3, 'wool', 'quad', { fur: '#e8d8a8', wool: true, horns: true, hornCol: '#d8a838', ears: 'floppy', tail: 'fluff' }, 'Its fleece goes the colour of ripe wheat every September. Shearers queue for it, then lose.'],
  ['sunwheat_stag', 'Sunwheat stag', 'willowbrook', 4, 'game', 'deer', { fur: '#e8c060', antler: '#fff0a0' }, 'The old harvest songs are about this one. Wherever it lies down, the wheat comes up a week early.'],
  ['copperhorn_aurochs', 'Copperhorn aurochs', 'willowbrook', 4, 'game', 'quad', { fur: '#4a2e22', dark: '#2a1812', horns: true, hornCol: '#d8783a', big: true, ears: 'floppy', glow: '#ffb04a', saddle: true }, 'Horns like polished kettles and a temper like a full one. The last of the great wild herd.'],
  ['thunder_ram', 'Thunder ram', 'willowbrook', 4, 'wool', 'quad', { fur: '#9aa0b0', wool: true, horns: true, hornCol: '#5a5a78', ears: 'floppy', storm: true, cloud: true }, 'When it butts a gatepost you hear it in the next village. The gatepost does not survive.'],
  ['fernwing_owl', 'Fernwing owl', 'willowbrook', 4, 'bird', 'bird', { plum: '#5a7a4a', wing: '#8ab870', beak: '#e8d8a0', spread: true, crest: '#c8e8a0' }, 'Feathers like bracken fronds. Old Fern says it is a forest spirit; it says nothing, it is an owl.'],
  ['hedge_king', 'Hedgerow king', 'willowbrook', 4, 'game', 'fox', { fur: '#e8783a' }, 'A fox with a white crown of fur and the run of every hedge in the county. It lets you catch it, once.'],
  /* Mossbarrow, the bramble glades: woodland game, then the barrow-haunted kind */
  ['pine_marten', 'Pine marten', 'mossbarrow', 1, 'game', 'fox', { fur: '#6a3e22' }, 'Moves through the treetops like it owes nobody money. Fond of eggs, other people’s.'],
  ['wildcat', 'Wildcat', 'mossbarrow', 1, 'game', 'fox', { fur: '#8a8274' }, 'Looks like a tabby, hisses like a kettle, and will never, ever sit on your lap.'],
  ['roe_deer', 'Roe deer', 'mossbarrow', 1, 'game', 'deer', { fur: '#a8683a', antler: '#c8b090' }, 'Small, quick and gone. Usually you see the white of its rump and nothing else.'],
  ['capercaillie', 'Capercaillie', 'mossbarrow', 1, 'bird', 'bird', { plum: '#2a2a2e', wing: '#4a5a3a', beak: '#e8e0c8', crest: '#c83a2a' }, 'A grouse the size of a turkey that clicks and pops like a cart wheel to impress other grouse.'],
  ['hedgehog', 'Giant hedgehog', 'mossbarrow', 1, 'game', 'quad', { fur: '#8a6a4a', short: true, ears: 'round', snout: true, snoutCol: '#4a3a30', thorns: true }, 'Grows to the size of a footstool in the glades. Rolls into a ball and dares you.'],
  ['black_bear', 'Black bear', 'mossbarrow', 2, 'game', 'quad', { fur: '#2a2628', dark: '#141214', ears: 'round', snout: true, snoutCol: '#8a6a5a', big: true, stout: true }, 'Mostly eats berries. Mostly. The honey-takers of Mossbarrow carry two pots: one for the bear.'],
  ['moose', 'Glade moose', 'mossbarrow', 2, 'game', 'deer', { fur: '#4a3628', antler: '#c8b088' }, 'Walks through the forest rather than round it. The trees have learned to lean.'],
  ['lynx', 'Lynx', 'mossbarrow', 2, 'game', 'fox', { fur: '#b8945a' }, 'Tufted ears, enormous paws, and a stare that makes your trap feel stupid.'],
  ['bristleback_sow', 'Bristleback sow', 'mossbarrow', 2, 'game', 'quad', { fur: '#4a3a2e', tusks: true, snout: true, snoutCol: '#8a6a5a', ears: 'pointy', mane: true, stout: true }, 'The boar’s mother, and twice as cross. Keep the bait at arm’s length.'],
  ['eagle_owl', 'Eagle owl', 'mossbarrow', 2, 'bird', 'bird', { plum: '#8a6a44', wing: '#5a4428', beak: '#2a2a2a', crest: '#6a4a2a', spread: true }, 'Hunts foxes for fun. Glares orange from the oak by the barrow mound.'],
  ['barrow_stag', 'Barrow stag', 'mossbarrow', 3, 'game', 'deer', { fur: '#9aa08a', antler: '#e8e8d8' }, 'Grazes on the barrow mounds and nowhere else. Its antlers are the colour of old bone.'],
  ['moss_bear', 'Moss bear', 'mossbarrow', 3, 'game', 'quad', { fur: '#4a5a32', dark: '#2a3a1a', ears: 'round', snout: true, snoutCol: '#7a6a4a', big: true, stout: true, thorns: true }, 'Sleeps so long the moss grows on it. Wakes up hungry, and green.'],
  ['bramble_boar', 'Bramble boar', 'mossbarrow', 3, 'game', 'quad', { fur: '#3e3424', tusks: true, snout: true, snoutCol: '#7a5a4a', ears: 'pointy', thorns: true, big: true }, 'Wears the bramble witch’s thorns like armour, which is apparently how she likes it.'],
  ['bonehorn_elk', 'Bonehorn elk', 'mossbarrow', 3, 'game', 'deer', { fur: '#5a4a3a', antler: '#f4ecd8' }, 'Its antlers are said to be made of the barrow dead’s spare bones. Nobody has asked the dead.'],
  ['ghostfeather_owl', 'Ghostfeather owl', 'mossbarrow', 3, 'bird', 'bird', { plum: '#d8e0e0', wing: '#a8b8b8', beak: '#c8d0d0', spread: true, crest: '#e8f0f0' }, 'Flies through branches rather than round them. Hoots the names of people who are behind you.'],
  ['greenwood_hart', 'Greenwood hart', 'mossbarrow', 4, 'game', 'deer', { fur: '#5a8a4a', antler: '#c8f0a0' }, 'Leaves grow from its antlers in spring and fall in autumn. The forest goes quiet when it passes.'],
  ['barrow_bear', 'Barrowking bear', 'mossbarrow', 4, 'game', 'quad', { fur: '#3a3438', dark: '#1a181c', ears: 'round', snout: true, snoutCol: '#8a7a6a', big: true, stout: true, glow: '#c8e0a0', mane: true }, 'Sleeps inside the biggest barrow and wears a dead king’s circlet it found in there. Takes it seriously.'],
  ['wisp_fox', 'Wisp fox', 'mossbarrow', 4, 'game', 'fox', { fur: '#a8d8c8' }, 'Leads travellers off the path with a lantern-bright tail. Leads trappers off it too.'],
  ['elderwood_elk', 'Elderwood elk', 'mossbarrow', 4, 'game', 'deer', { fur: '#6a4a30', antler: '#8ab060' }, 'Older than the oldest tree in the glade, and the tree knows it.'],
  ['thornmane_aurochs', 'Thornmane aurochs', 'mossbarrow', 4, 'game', 'quad', { fur: '#3a2a20', horns: true, hornCol: '#c8c0a0', big: true, thorns: true, mane: true, ears: 'floppy', glow: '#e48aa8' }, 'Roses bloom along its spine every midsummer. It is extremely touchy about this.'],
  /* Saltmere, the seal rocks: shore birds and seals, then what the sea gives back */
  ['plover', 'Ringed plover', 'saltmere', 0, 'bird', 'bird', { plum: '#c8b89a', wing: '#8a7a64', beak: '#e88a3a', small: true }, 'Runs along the tide line like it is late for something. Pretends to have a broken wing when you get close.'],
  ['cormorant', 'Cormorant', 'saltmere', 1, 'bird', 'bird', { plum: '#1e2428', wing: '#3a4448', beak: '#e8c060' }, 'Dives for fish, then stands with its wings out to dry like washing. Smells like the harbour.'],
  ['sea_otter', 'Sea otter', 'saltmere', 1, 'game', 'fox', { fur: '#6a4a32' }, 'Floats on its back cracking crabs on its belly. Holds hands with the others while it sleeps, which is unfair.'],
  ['puffin', 'Puffin', 'saltmere', 1, 'bird', 'bird', { plum: '#1e1e24', wing: '#f4f0e8', beak: '#e8583a', small: true, crest: '#f4f0e8' }, 'Carries ten fish crossways in its beak at once. Nobody knows how. Nobody has asked nicely.'],
  ['rock_lobster', 'Rock lobster', 'saltmere', 1, 'shell', 'quad', { fur: '#b8402a', shell: '#c84a32', short: true }, 'Lives under the sea wall and has opinions about your fingers.'],
  ['walrus', 'Walrus', 'saltmere', 2, 'game', 'quad', { fur: '#9a6a4e', dark: '#6a4432', short: true, big: true, snout: true, snoutCol: '#c89a7a', tusks: true }, 'Hauls itself on to the rocks and sleeps there for a week. Wakes up and wants the rocks to itself.'],
  ['gannet', 'Gannet', 'saltmere', 2, 'bird', 'bird', { plum: '#f4f4ee', wing: '#2a2a2e', beak: '#a8b0b8', spread: true, crest: '#f0d890' }, 'Folds itself into an arrow and hits the sea at full speed. The fish never see it coming. Neither do you.'],
  ['albatross', 'Albatross', 'saltmere', 2, 'bird', 'bird', { plum: '#f0f0ea', wing: '#5a5a5e', beak: '#e8c8a0', spread: true }, 'Spends years at sea without landing, then lands here, on your trap, out of spite.'],
  ['elephant_seal', 'Elephant seal', 'saltmere', 2, 'game', 'quad', { fur: '#7a6a5e', short: true, big: true, snout: true, snoutCol: '#9a7a6a', stout: true }, 'A seal with a nose like a trumpet and the volume to match. Owns the beach in winter.'],
  ['king_crab', 'King crab', 'saltmere', 2, 'shell', 'quad', { fur: '#c8603a', shell: '#a84a2a', short: true, big: true }, 'A crab with a leg span wider than a cart. Walks sideways, thinks forwards.'],
  ['pearl_turtle', 'Pearl turtle', 'saltmere', 3, 'shell', 'armoured', { fur: '#6a9a8a', plate: '#e8e0d8' }, 'Its shell grows a pearly coat with age. Comes ashore at high tide under a full moon, and is late.'],
  ['stormwing_petrel', 'Stormwing petrel', 'saltmere', 3, 'bird', 'bird', { plum: '#3a3e48', wing: '#6a7488', beak: '#2a2a2e', spread: true, crest: '#a8c8e8' }, 'Arrives just before a gale, which sailors find very unhelpful.'],
  ['barnacle_walrus', 'Barnacle walrus', 'saltmere', 3, 'game', 'quad', { fur: '#8a6a52', short: true, big: true, snout: true, tusks: true, spots: '#c8c0a8', stout: true }, 'So old the barnacles have their own barnacles. Grumbles at the tide.'],
  ['tidecaller_seal', 'Tidecaller seal', 'saltmere', 3, 'game', 'quad', { fur: '#5a7a8a', short: true, snout: true, snoutCol: '#8ab0c0', glow: '#7ae8ff' }, 'When it sings on the rocks the tide comes in early. Fishermen hate it; their wives love the extra hour.'],
  ['coral_crab', 'Coral crab', 'saltmere', 3, 'shell', 'quad', { fur: '#e86a7a', shell: '#f08a8a', short: true, spots: '#f8d0a0' }, 'Grows a coral garden on its back and defends it like a retired gardener.'],
  ['leviathan_turtle', 'Leviathan turtle', 'saltmere', 4, 'shell', 'armoured', { fur: '#3a5a5a', plate: '#5a8a7a', spikes: true }, 'Sailors once mistook its shell for an island and built a hut on it. It is still a bit annoyed.'],
  ['moonpearl_seal', 'Moonpearl seal', 'saltmere', 4, 'game', 'quad', { fur: '#d8dcf0', short: true, snout: true, snoutCol: '#f0f0ff', glow: '#a8c0f0', glassy: true }, 'Silver in moonlight, and comes ashore only on the clearest nights. Brings the sea’s calm with it.'],
  ['kraken_calf', 'Kraken calf', 'saltmere', 4, 'scale', 'serpent', { col: '#7a3a6a' }, 'A young kraken that took a wrong turn into the shallows. Only the size of a fishing boat. Yet.'],
  ['siren_gull', 'Siren gull', 'saltmere', 4, 'bird', 'bird', { plum: '#e8f0f8', wing: '#8ab8d8', beak: '#f0c75a', spread: true, crest: '#7ae8ff' }, 'Sings like a person on the rocks so you walk out to look. Everyone in Saltmere has done it once.'],
  ['abyssal_crab', 'Abyssal crab', 'saltmere', 4, 'shell', 'quad', { fur: '#2a2448', shell: '#3a3468', short: true, big: true, glow: '#7ae8ff' }, 'Climbs up from the trench once a year with lights in its shell. Pinches with the weight of the deep.'],
  /* Ironpeak, the high pastures: mountain game, then the frost-touched */
  ['marmot', 'Marmot', 'ironpeak', 0, 'game', 'quad', { fur: '#9a7a52', short: true, stout: true, ears: 'round', snout: true, snoutCol: '#c8a87a' }, 'Whistles when anything approaches, including you, the wind and other marmots.'],
  ['ptarmigan', 'Ptarmigan', 'ironpeak', 0, 'bird', 'bird', { plum: '#f4f4f0', wing: '#d8d8d0', beak: '#2a2a2a', small: true }, 'White in winter, brown in summer, invisible in both if it holds still. It always holds still.'],
  ['stoat', 'Stoat', 'ironpeak', 0, 'game', 'fox', { fur: '#e8e4dc' }, 'Turns white for winter and does a little dance to confuse rabbits. It works on rabbits.'],
  ['pika', 'Pika', 'ironpeak', 0, 'game', 'hare', { fur: '#a89070' }, 'Spends the whole summer making hay. Spends the whole winter refusing to share it.'],
  ['rock_dove', 'Rock dove', 'ironpeak', 0, 'bird', 'bird', { plum: '#9aa0a8', wing: '#6a7078', beak: '#d8b0a0', small: true }, 'The mountain pigeon. Exactly as clever as the town pigeon, but with better views.'],
  ['ibex', 'Ibex', 'ironpeak', 2, 'game', 'quad', { fur: '#9a8a6a', horns: true, hornCol: '#4a3a2a', ears: 'pointy', tail: 'thin', big: true }, 'Climbs sheer rock walls to lick the salt off them. Its horns are longer than your arm.'],
  ['snow_leopard', 'Snow leopard', 'ironpeak', 2, 'game', 'fox', { fur: '#e0dcd0' }, 'A ghost with a tail as long as itself. The herders have never seen one; it has seen them every day.'],
  ['musk_ox', 'Musk ox', 'ironpeak', 2, 'wool', 'quad', { fur: '#3e3228', wool: true, horns: true, hornCol: '#d8cca8', big: true, stout: true }, 'Wears a coat that drags on the snow. Forms a circle with the others and stares at you until you leave.'],
  ['golden_eagle', 'Golden eagle', 'ironpeak', 2, 'bird', 'bird', { plum: '#6a4a2a', wing: '#b8843a', beak: '#e8c060', spread: true, crest: '#d8a848' }, 'Carries goats off the ledges. Small goats. Mostly.'],
  ['cave_bear', 'Cave bear', 'ironpeak', 2, 'game', 'quad', { fur: '#5a4632', dark: '#2a2016', ears: 'round', snout: true, snoutCol: '#8a6a4a', big: true, stout: true }, 'Sleeps in the old mine workings and considers the miners its lodgers.'],
  ['frost_ram', 'Frost ram', 'ironpeak', 3, 'wool', 'quad', { fur: '#d8e8f0', wool: true, horns: true, hornCol: '#9ad8f0', ears: 'floppy', ice: true }, 'Its horns are rimed with ice that never melts, even by the forge fire. Smiths have checked.'],
  ['glacier_lynx', 'Glacier lynx', 'ironpeak', 3, 'game', 'fox', { fur: '#c8e0ec' }, 'Walks across crevasses on snow bridges that would not hold a sparrow. Weighs exactly nothing, apparently.'],
  ['avalanche_yak', 'Avalanche yak', 'ironpeak', 3, 'wool', 'quad', { fur: '#e8ecf0', dark: '#9aa0a8', wool: true, horns: true, hornCol: '#5a5a5a', big: true, stout: true, ice: true }, 'Named for how it comes down a mountain. Brings half the mountain with it.'],
  ['crystal_eagle', 'Crystal eagle', 'ironpeak', 3, 'bird', 'bird', { plum: '#a8d8e8', wing: '#e8f8ff', beak: '#7ae8ff', spread: true, glassy: true }, 'Its feathers ring like glass in the wind. You can hear it hunting from a mile off; it does not care.'],
  ['rime_stag', 'Rime stag', 'ironpeak', 3, 'game', 'deer', { fur: '#b8ccd8', antler: '#e8f6ff' }, 'Breathes frost on the grass to keep it fresh for later. The goats steal it.'],
  ['thunderhorn_ram', 'Thunderhorn ram', 'ironpeak', 4, 'wool', 'quad', { fur: '#5a5a78', wool: true, horns: true, hornCol: '#f0c75a', ears: 'floppy', storm: true, big: true }, 'Calls the storms down on to the peaks so it can butt the lightning. Usually wins.'],
  ['aurora_elk', 'Aurora elk', 'ironpeak', 4, 'game', 'deer', { fur: '#3a4a6a', antler: '#7ae8c8' }, 'Green and violet light hangs from its antlers on winter nights. Herders follow it home through blizzards.'],
  ['frostmane_lion', 'Frostmane lion', 'ironpeak', 4, 'game', 'quad', { fur: '#d8e0e8', mane: true, ears: 'round', big: true, tail: 'thin', ice: true, glow: '#7ae8ff' }, 'A mountain lion with a mane of icicles. Sleeps on the glacier and is never cold, only bored.'],
  ['starhorn_ibex', 'Starhorn ibex', 'ironpeak', 4, 'game', 'quad', { fur: '#6a6a8a', horns: true, hornCol: '#e8e0ff', ears: 'pointy', big: true, glassy: true, glow: '#e8e0ff' }, 'Climbs to the very top of the highest peak and stands there all night, as if waiting for a star to pass close.'],
  ['peak_wyrmling', 'Peak wyrmling', 'ironpeak', 4, 'scale', 'newt', { col: '#8ab0d0', fin: '#e8f6ff' }, 'A small ice dragon that nests in the summit cairns. Small for a dragon. Huge for anything else.'],
  /* Gloomfen, the reed beds: marsh life, then the lights over the water */
  ['bullfrog', 'Bullfrog', 'gloomfen', 0, 'scale', 'newt', { col: '#5a7a3a', fin: '#8aa860' }, 'Bellows all night like a cow in a barrel. The reed cutters have tried earplugs.'],
  ['mallard', 'Mallard', 'gloomfen', 0, 'bird', 'bird', { plum: '#6a5a44', wing: '#3a7a5a', beak: '#e8c040', small: true, crest: '#2a6a4a' }, 'An ordinary duck in an extraordinary bog. Seems completely untroubled by either.'],
  ['water_vole', 'Water vole', 'gloomfen', 0, 'game', 'hare', { fur: '#6a4e36' }, 'Paddles in circles and eats reeds with great seriousness.'],
  ['coot', 'Coot', 'gloomfen', 0, 'bird', 'bird', { plum: '#1e1e22', wing: '#3a3a3e', beak: '#f4f4f0', small: true, crest: '#f4f4f0' }, 'A black water bird with a white forehead, permanently squabbling with its neighbours.'],
  ['mud_eel', 'Mud eel', 'gloomfen', 0, 'scale', 'serpent', { col: '#4a4a32' }, 'Lives in the bottom of the ditch and comes up to complain. Slippery in every sense.'],
  ['beaver', 'Beaver', 'gloomfen', 1, 'game', 'quad', { fur: '#6a4a2e', short: true, stout: true, ears: 'round', snout: true, snoutCol: '#4a3220', tail: 'thin' }, 'Built half the fen’s dams and floods the road whenever it feels the road is getting above itself.'],
  ['bittern', 'Bittern', 'gloomfen', 1, 'bird', 'bird', { plum: '#a8844a', wing: '#6a5030', beak: '#d8c060', crest: '#4a3a24' }, 'Points its beak at the sky and pretends to be a reed. Booms like a foghorn when it gives up.'],
  ['snapping_turtle', 'Snapping turtle', 'gloomfen', 1, 'shell', 'armoured', { fur: '#4a4a32', plate: '#5a5a3a', spikes: true }, 'Bites first, considers later, never apologises.'],
  ['water_deer', 'Water deer', 'gloomfen', 1, 'game', 'deer', { fur: '#9a7a52', antler: '#9a7a52' }, 'A little deer with fangs instead of antlers, which it uses mainly for looking alarming.'],
  ['fen_otter', 'Fen otter', 'gloomfen', 1, 'game', 'fox', { fur: '#4a3a2a' }, 'Slides down the mudbanks for fun and steals the eel-catchers’ lunch.'],
  ['bog_lynx', 'Bog lynx', 'gloomfen', 3, 'game', 'fox', { fur: '#5a6a3a' }, 'Green-eyed and silent on the moss. Hunts the will-o’-wisps, or the other way round.'],
  ['wisp_heron', 'Wisp heron', 'gloomfen', 3, 'bird', 'bird', { plum: '#c8d8c0', wing: '#8aa888', beak: '#c8f07a', crest: '#9be07a', glassy: true }, 'Fishes by lantern light; its own. Fish swim up to look and that is the end of them.'],
  ['mire_bear', 'Mire bear', 'gloomfen', 3, 'game', 'quad', { fur: '#3e4a30', dark: '#1e2a18', ears: 'round', snout: true, snoutCol: '#6a6a4a', big: true, stout: true, spots: '#6a8a4a' }, 'Wades the deep pools up to its chin and comes out wearing half the bog.'],
  ['lantern_newt', 'Lantern newt', 'gloomfen', 3, 'scale', 'newt', { col: '#3a5a4a', fin: '#c8f07a', candle: true }, 'Carries a little flame on its back through the reeds. Swamp folk follow it home in the fog.'],
  ['peat_stag', 'Peat stag', 'gloomfen', 3, 'game', 'deer', { fur: '#3a2e22', antler: '#8a7a5a' }, 'Dark as wet turf and twice as heavy. Leaves hoofprints that fill with water and glow.'],
  ['marsh_drake', 'Marsh drake', 'gloomfen', 4, 'scale', 'newt', { col: '#4a6a3a', fin: '#c8e070' }, 'A wingless dragon that swims like an otter and grins like a crocodile. Very much a dragon.'],
  ['hydra_calf', 'Hydra calf', 'gloomfen', 4, 'scale', 'serpent', { col: '#3a6a4a' }, 'Only three heads so far, and they argue about everything. Catch it before it grows the fourth.'],
  ['moonbog_moose', 'Moonbog moose', 'gloomfen', 4, 'game', 'deer', { fur: '#4a4a5a', antler: '#c8f0e0' }, 'Its antlers hold little pools of moonlight. Drink from them, the hag says, and you will see true. Do not.'],
  ['elder_toad', 'Elder toad', 'gloomfen', 4, 'scale', 'newt', { col: '#6a6a3a', fin: '#a8a050' }, 'Big enough to sit on, and once a witch did. It has been grumpy for two hundred years.'],
  ['wisp_stag', 'Will-o’-wisp stag', 'gloomfen', 4, 'game', 'deer', { fur: '#6a8a7a', antler: '#e8ffb0' }, 'Made mostly of marsh light, with just enough stag in it to catch. Lights the fen like a street.'],
  /* Emberfall, the ash plains: things that live on hot rock, then the things made of it */
  ['ash_rat', 'Ash rat', 'emberfall', 0, 'game', 'hare', { fur: '#5a524e' }, 'Lives under the cooling lava and eats anything warm. Including, once, a boot.'],
  ['cinder_beetle', 'Cinder beetle', 'emberfall', 0, 'shell', 'quad', { fur: '#3a2a22', shell: '#c8402a', short: true }, 'Glows dull red when it is cross. It is usually cross.'],
  ['dust_lizard', 'Dust lizard', 'emberfall', 0, 'scale', 'newt', { col: '#b89a6a', fin: '#d8b880' }, 'Basks on the hot rocks all day doing push-ups at other lizards.'],
  ['ash_crow', 'Ash crow', 'emberfall', 0, 'bird', 'bird', { plum: '#3a3634', wing: '#5a524e', beak: '#2a2a2a', small: true }, 'Grey with soot and sharp as a pin. Steals shiny things, especially your trap’s springs.'],
  ['scorch_hare', 'Scorch hare', 'emberfall', 0, 'game', 'hare', { fur: '#c8783a' }, 'Runs so fast across the hot ground that its feet barely get warm.'],
  ['fire_salamander', 'Fire salamander', 'emberfall', 1, 'scale', 'newt', { col: '#2a2420', fin: '#ffb04a' }, 'Black with orange spots and perfectly happy in a campfire. Do not put it out; it is resting.'],
  ['basalt_tortoise', 'Basalt tortoise', 'emberfall', 1, 'shell', 'armoured', { fur: '#4a4440', plate: '#2e2a28' }, 'Its shell is solid rock. It has been walking to the same pool for sixty years and will get there soon.'],
  ['ember_fox', 'Ember fox', 'emberfall', 1, 'game', 'fox', { fur: '#e8603a' }, 'Its tail smoulders when it runs. Leaves little fires behind it, which it seems proud of.'],
  ['smoke_vulture', 'Smoke vulture', 'emberfall', 1, 'bird', 'bird', { plum: '#4a4040', wing: '#6a5a58', beak: '#c8a080', spread: true, crest: '#e8d8c8' }, 'Circles the vents waiting for something to cook. Very patient. Very rude.'],
  ['lava_toad', 'Lava toad', 'emberfall', 1, 'scale', 'newt', { col: '#8a3a2a', fin: '#ff8a3a' }, 'Bathes in the cooler lava pools. Croaks like a kettle coming to the boil.'],
  ['obsidian_ram', 'Obsidian ram', 'emberfall', 2, 'wool', 'quad', { fur: '#2a2428', wool: true, horns: true, hornCol: '#1a1418', ears: 'floppy', glassy: true }, 'Its horns are black glass. Smiths pay well for the broken tips it leaves on the rocks.'],
  ['ember_lynx', 'Ember lynx', 'emberfall', 2, 'game', 'fox', { fur: '#d86a2a' }, 'Ear tufts like little flames. Hunts by the light of the vents.'],
  ['magma_boar', 'Magma boar', 'emberfall', 2, 'game', 'quad', { fur: '#3a2e2a', tusks: true, snout: true, snoutCol: '#c8603a', ears: 'pointy', cracks: '#ffb04a', big: true }, 'Roots for coal and eats it. Its back cracks open and glows when it is full.'],
  ['phoenix_hen', 'Phoenix hen', 'emberfall', 3, 'bird', 'bird', { plum: '#e8703a', wing: '#ffd04a', beak: '#ffe070', crest: '#ff4a2a' }, 'A wild hen that keeps catching fire and then getting better. Lays warm eggs. Very warm.'],
  ['flamemane_lion', 'Flamemane lion', 'emberfall', 3, 'game', 'quad', { fur: '#c8803a', mane: true, ears: 'round', big: true, tail: 'thin', glow: '#ffb04a', cracks: '#ffe070' }, 'Its mane burns, actually burns. It does not seem to mind, so neither should you, from a distance.'],
  ['ashwing_drake', 'Ashwing drake', 'emberfall', 4, 'scale', 'newt', { col: '#5a3a32', fin: '#ff8a3a' }, 'A young fire drake that rides the hot air over the plains. Lands only to eat, and everything is food.'],
  ['sun_phoenix', 'Sun phoenix', 'emberfall', 4, 'bird', 'bird', { plum: '#ffb030', wing: '#ff5a2a', beak: '#fff0a0', spread: true, crest: '#fff0a0', glassy: true }, 'When it dies it bursts into flame and comes back younger. When it is caught it is merely very annoyed.'],
  ['molten_stag', 'Molten stag', 'emberfall', 4, 'game', 'deer', { fur: '#3a2420', antler: '#ff8a3a' }, 'Its antlers drip slow lava. The grass grows back black where it walks.'],
  ['volcano_tortoise', 'Volcano tortoise', 'emberfall', 4, 'shell', 'armoured', { fur: '#4a3430', plate: '#8a3a2a', spikes: true }, 'A small volcano grows on its shell and erupts when it sneezes. It has a cold.'],
  ['cinder_basilisk', 'Cinder basilisk', 'emberfall', 4, 'scale', 'serpent', { col: '#8a5a2a' }, 'Do not meet its eyes; you will be fine but extremely embarrassed. Trappers wear hats pulled low.'],
  /* Skyreach, the sky meadows: high-meadow birds and goats, then the weather made flesh */
  ['swift', 'Alpine swift', 'skyreach', 0, 'bird', 'bird', { plum: '#5a4a44', wing: '#3a3434', beak: '#2a2a2a', small: true, spread: true }, 'Eats, sleeps and courts on the wing. Lands roughly once a year, by mistake.'],
  ['cloud_lamb', 'Cloud lamb', 'skyreach', 0, 'wool', 'quad', { fur: '#f4f8fc', wool: true, ears: 'floppy', tail: 'fluff', short: true, cloud: true }, 'So fluffy it drifts uphill in a good breeze. Shepherds tie little stones to its ankles.'],
  ['sky_hare', 'Sky hare', 'skyreach', 0, 'game', 'hare', { fur: '#c8d8e8' }, 'Leaps off the meadow edge and floats back down on its ears.'],
  ['meadow_pipit', 'Meadow pipit', 'skyreach', 0, 'bird', 'bird', { plum: '#a8946a', wing: '#7a6a4a', beak: '#5a4a3a', small: true }, 'Sings while climbing straight up, then parachutes down and pretends it meant to.'],
  ['kestrel', 'Kestrel', 'skyreach', 0, 'bird', 'bird', { plum: '#b8743a', wing: '#8a5a32', beak: '#3a3a3a', spread: true, small: true }, 'Hangs perfectly still in the wind above one spot of grass. The spot of grass gets nervous.'],
  ['wind_goat', 'Wind goat', 'skyreach', 1, 'game', 'quad', { fur: '#e8e4dc', horns: true, hornCol: '#a8b8c8', ears: 'pointy', tail: 'thin', cloud: true }, 'Its beard blows sideways even on still days. Leaps between floating rocks without looking.'],
  ['peregrine', 'Peregrine falcon', 'skyreach', 1, 'bird', 'bird', { plum: '#6a7078', wing: '#3a4048', beak: '#f0d060', spread: true }, 'The fastest thing in the sky, and it knows it. Pigeons have filed complaints.'],
  ['glider_squirrel', 'Glider squirrel', 'skyreach', 1, 'game', 'fox', { fur: '#9a8a7a' }, 'Spreads its arms and glides from tree to tree with a look of great surprise every time.'],
  ['storm_crow', 'Storm crow', 'skyreach', 1, 'bird', 'bird', { plum: '#2a2a34', wing: '#4a4a5a', beak: '#2a2a2a', crest: '#a8c8e8' }, 'Flies into the thunderclouds for fun and comes out with its feathers on end.'],
  ['highland_pony', 'Highland pony', 'skyreach', 1, 'game', 'quad', { fur: '#8a6a4a', mane: true, ears: 'pointy', tail: 'bushy', stout: true }, 'Small, shaggy and sure-footed on the cliff paths. Bites, but only people it likes.'],
  ['silver_eagle', 'Silver eagle', 'skyreach', 2, 'bird', 'bird', { plum: '#c8ccd4', wing: '#8a909a', beak: '#f0d060', spread: true, crest: '#f4f4f8' }, 'Nests on the highest spires of the cloud gardens and judges everyone below.'],
  ['cloud_ram', 'Cloud ram', 'skyreach', 2, 'wool', 'quad', { fur: '#e8eef4', wool: true, horns: true, hornCol: '#c8d0e0', ears: 'floppy', cloud: true }, 'Its fleece is half fog. Knit it into a jumper and the jumper floats away.'],
  ['sky_lynx', 'Sky lynx', 'skyreach', 2, 'game', 'fox', { fur: '#a8b8d0' }, 'Pads along the cloud banks where nothing else can walk and pounces on birds from above.'],
  ['gale_stag', 'Gale stag', 'skyreach', 2, 'game', 'deer', { fur: '#9aa8b8', antler: '#e8f0ff' }, 'Runs with the wind, which is cheating. Its antlers whistle at full gallop.'],
  ['windhorn_ox', 'Windhorn ox', 'skyreach', 2, 'wool', 'quad', { fur: '#6a6a78', wool: true, horns: true, hornCol: '#e8e0c8', big: true, stout: true }, 'Its horns are hollow and moan in a breeze. Herds of them sound like a choir that has lost the music.'],
  ['storm_pegasus', 'Storm pegasus', 'skyreach', 3, 'game', 'quad', { fur: '#e8ecf4', mane: true, ears: 'pointy', tail: 'bushy', big: true, storm: true, cloud: true }, 'A winged horse that only flies in thunderstorms. Very hard to trap. Very easy to get struck next to.'],
  ['rainbow_condor', 'Rainbow condor', 'skyreach', 3, 'bird', 'bird', { plum: '#8a5aa8', wing: '#3ab8a8', beak: '#f0c75a', spread: true, crest: '#e8583a', prism: true }, 'Its wings split the light into colours as it passes. Painters climb the peaks just to see it.'],
  ['thunderbird', 'Thunderbird', 'skyreach', 4, 'bird', 'bird', { plum: '#3a4a7a', wing: '#f0e060', beak: '#fff0a0', spread: true, crest: '#7ac8e8', storm: true }, 'Flaps once and the sky cracks. The cloud giants leave it offerings, and stand well back.'],
  ['sunwing_griffin', 'Sunwing griffin', 'skyreach', 4, 'game', 'quad', { fur: '#e8b040', dark: '#a8702a', ears: 'pointy', tail: 'thin', big: true, mane: true, glow: '#fff0a0' }, 'A griffin with gold wings that flies so close to the sun its feathers are warm at night.'],
  ['tempest_roc', 'Tempest roc', 'skyreach', 4, 'bird', 'bird', { plum: '#4a5a6a', wing: '#8a9aaa', beak: '#e8c060', spread: true, crest: '#e8f0ff', storm: true, cloud: true }, 'A bird big enough to carry off a yak, which is why the yaks of Ironpeak keep looking up.'],
  /* the Hollow, the starfall glade: night creatures, then the stars that fell and kept walking */
  ['glimmer_mouse', 'Glimmer mouse', 'hollow', 0, 'game', 'hare', { fur: '#a8a0c8' }, 'A field mouse that ate a fallen star crumb and has glowed faintly ever since. Still a mouse.'],
  ['pale_crow', 'Pale crow', 'hollow', 0, 'bird', 'bird', { plum: '#d8d4e0', wing: '#a8a4b8', beak: '#4a4458', small: true }, 'Crows forget their colour in the Hollow. This one forgot its manners too.'],
  ['nightjar', 'Nightjar', 'hollow', 0, 'bird', 'bird', { plum: '#5a5048', wing: '#3a3430', beak: '#2a2420', small: true }, 'Churrs all night like a tiny engine. Sleeps on a branch looking exactly like the branch.'],
  ['shade_rat', 'Shade rat', 'hollow', 0, 'game', 'hare', { fur: '#3a3448' }, 'A rat that lives in shadows and leaves when you bring a lantern. Bring a lantern.'],
  ['dusk_newt', 'Dusk newt', 'hollow', 0, 'scale', 'newt', { col: '#5a4a7a', fin: '#a88ad8' }, 'Purple, slow and found under every stone in the glade. Children collect them.'],
  ['starling_flock', 'Star-speckled starling', 'hollow', 1, 'bird', 'bird', { plum: '#2a2a48', wing: '#4a4a78', beak: '#f0c75a', small: true, spots: '#e8e0ff' }, 'Its speckles are tiny stars. Flocks of them make constellations nobody has named yet.'],
  ['dusk_fox', 'Dusk fox', 'hollow', 1, 'game', 'fox', { fur: '#6a5a8a' }, 'Comes out exactly at sunset and goes home exactly at sunrise. You could set a clock by it, if clocks worked here.'],
  ['velvet_deer', 'Velvet deer', 'hollow', 1, 'game', 'deer', { fur: '#5a4a6a', antler: '#c8b8e8' }, 'Its antlers stay in soft velvet all year round, like a deer that never quite grew up.'],
  ['void_beetle', 'Void beetle', 'hollow', 1, 'shell', 'quad', { fur: '#1e1a2a', shell: '#4a3a7a', short: true, glow: '#b08aff' }, 'Its shell shows the night sky, even at noon. Look too long and you will want to lie down.'],
  ['lantern_owl', 'Lantern owl', 'hollow', 1, 'bird', 'bird', { plum: '#8a7a5a', wing: '#5a4a32', beak: '#f0c75a', crest: '#ffe070', candle: true }, 'Carries a light in its chest feathers. Hunts the shade rats, who hate it.'],
  ['mist_panther', 'Mist panther', 'hollow', 2, 'game', 'fox', { fur: '#4a4a5a' }, 'Half fog, half cat, all teeth. You see the eyes first. Sometimes only the eyes.'],
  ['void_boar', 'Void boar', 'hollow', 2, 'game', 'quad', { fur: '#2a2438', tusks: true, snout: true, snoutCol: '#6a5a8a', ears: 'pointy', glow: '#b08aff' }, 'Roots up fallen stars and eats them. Its tusks glow for a week after.'],
  ['comet_hare', 'Comet hare', 'hollow', 2, 'game', 'hare', { fur: '#e8e0ff' }, 'Leaves a short shining trail behind it as it runs, like a little comet with ears.'],
  ['night_elk', 'Night elk', 'hollow', 2, 'game', 'deer', { fur: '#2a2a44', antler: '#8a8ab8' }, 'Its antlers are the colour of a sky just after dark. Bellows once at midnight, and the glade answers.'],
  ['dream_moth', 'Dream moth', 'hollow', 2, 'bird', 'bird', { plum: '#c8b8e8', wing: '#8a6ab8', beak: '#e8e0ff', spread: true, small: true, glassy: true }, 'A moth the size of a hat. Its dust gives you very strange dreams, mostly about cheese.'],
  ['starfall_lynx', 'Starfall lynx', 'hollow', 3, 'game', 'fox', { fur: '#3a3a6a' }, 'Its spots are the shapes of constellations, and a different one each night.'],
  ['gloom_bear', 'Gloom bear', 'hollow', 3, 'game', 'quad', { fur: '#2a2430', dark: '#14121a', ears: 'round', snout: true, snoutCol: '#5a4a6a', big: true, stout: true, glow: '#b08aff' }, 'Sleeps through the day under a cloak of shadow. Wakes for honey, and for the end of the world.'],
  ['astral_ram', 'Astral ram', 'hollow', 3, 'wool', 'quad', { fur: '#4a4a7a', wool: true, horns: true, hornCol: '#e8e0ff', ears: 'floppy', glassy: true, glow: '#e8e0ff' }, 'Its fleece holds starlight; spin it and the thread glows. The Hollow’s shepherds are very quiet people.'],
  ['wraith_owl', 'Wraith owl', 'hollow', 3, 'bird', 'bird', { plum: '#8a8aa8', wing: '#4a4a6a', beak: '#c8c8e8', spread: true, crest: '#e8e8ff', glassy: true }, 'Flies in total silence and is nearly see-through. Its hoot sounds like a door closing somewhere else.'],
  ['twilight_unicorn', 'Twilight unicorn', 'hollow', 3, 'game', 'deer', { fur: '#8a7aa8', antler: '#f0e8ff' }, 'Real, it turns out, and nothing like the paintings: muddy, bad-tempered and very good at hiding.'],
  ['celestial_unicorn', 'Celestial unicorn', 'hollow', 4, 'game', 'deer', { fur: '#e8e4ff', antler: '#f0c75a' }, 'The one in the paintings. Stars follow it through the glade like ducklings. Catching it is the work of a lifetime.']
];
/* ---------- drops: what each kind of animal gives, in this ground's materials ---------- */
const HIDE = { willowbrook: 'cowhide', mossbarrow: 'wolf_pelt', saltmere: 'cowhide', ironpeak: 'frost_pelt', gloomfen: 'bogscale', emberfall: 'drakehide', skyreach: 'drakehide', hollow: 'wyrm_scale' };
const SCALE = { gloomfen: 'bogscale', emberfall: 'drakehide', hollow: 'wyrm_scale', ironpeak: 'frost_pelt', saltmere: 'bogscale', skyreach: 'drakehide' };
const has = id => !!D.ITEMS[id];
const dropsFor = (ground, tier, kind) => {
  const t = tier, hide = HIDE[ground] || 'cowhide', out = [], add = (id, a, b, p) => { if (has(id)) out.push([id, [a, b], Math.min(1, p)]); };
  const rare = ground === 'hollow' ? .35 : 1; /* wyrm scale is precious: keep it rare even as a hide */
  if (kind === 'game') { add('raw_game', 1, 1 + Math.ceil(t / 2), .75); add(hide, 1, 1 + Math.floor(t / 2), (.45 + t * .08) * rare); }
  if (kind === 'wool') { add('wool', 1 + t, 2 + t * 2, .9); add('raw_game', 1, 1 + Math.floor(t / 2), .45); if (ground === 'ironpeak') add('frost_pelt', 1, 1, .25 + t * .05); }
  if (kind === 'bird') { add('feather', 2 + t * 2, 5 + t * 3, .9); add('egg', 1, 1, .15); add('raw_game', 1, 1, .35); }
  if (kind === 'shell') { add(SCALE[ground] || hide, 1, 1 + Math.floor(t / 2), (.55 + t * .06) * rare); add('raw_game', 1, 1, .4); }
  if (kind === 'scale') { add(SCALE[ground] || hide, 1, 1 + Math.floor(t / 2), (.55 + t * .06) * rare); add('raw_game', 1, 1, .45); }
  /* the more impressive the animal, the better the odd find */
  if (t >= 3 && ground === 'emberfall') add('ember_core', 1, 1, .03 + (t - 3) * .02);
  if (t >= 3 && (ground === 'skyreach' || (kind === 'bird' && ground !== 'willowbrook'))) add('storm_feather', 1, 1, .02 + (t - 3) * .02);
  if (t >= 3 && ['gloomfen', 'hollow', 'saltmere'].includes(ground) && kind !== 'bird') add('wyrm_scale', 1, 1, .02 + (t - 3) * .03);
  if (t === 4) add('gem_diamond', 1, 1, .01);
  return out;
};
/* ---------- levels: each tier spans its band; five slots per ground, the existing animals keep theirs ---------- */
const AN = [[1, 3, 1], [9, 12, 2], [19, 26, 5], [30, 46, 8], [49, 72, 12], [69, 128, 19], [88, 230, 31], [106, 390, 39], [120, 520, 48]];
const statAt = cl => { let i = AN.findIndex(r => r[0] >= cl); if (i <= 0) return AN[Math.max(0, i)].slice(1); const a = AN[i - 1], b = AN[i], f = (cl - a[0]) / (b[0] - a[0]); return a.slice(1).map((v, k) => v + (b[k + 1] - v) * f); };
const R = D.ROSTER || {}, TOWNS = Object.keys(R);
D.HUNT_NEW = [];
for (const town of TOWNS) {
  const r = R[town]; if (!r || !r.hunt) continue;
  const existing = r.hunt[1].filter(id => D.MON[id]).map(id => D.MON[id]);
  for (let ti = 0; ti < 5; ti++) {
    const T = D.HUNT_TIERS[ti], mine = A.filter(a => a[2] === town && a[3] === ti), taken = existing.filter(m => D.huntTierOf(m.hl) === ti).map(m => m.hl);
    /* five evenly spaced levels in the band, nudged per town so grounds do not all share the same numbers */
    const off = TOWNS.indexOf(town) % 3, slots = [0, 1, 2, 3, 4].map(k => Math.min(T.hi, T.lo + off + Math.round(k * (T.hi - T.lo - off) / 4)));
    const free = slots.filter(l => !taken.some(x => Math.abs(x - l) < 2)); while (free.length < mine.length) free.push(Math.min(T.hi, (free[free.length - 1] || T.lo) + 1));
    mine.forEach((a, k) => {
      const [id, name, , , kind, builder, opts, note] = a; if (D.MON[id]) { console.warn('hunt tier id taken', id); return; }
      const hl = free[k], cl = Math.max(1, Math.round(hl / .82)), [hp, max] = statAt(cl);
      const m = { id, name, town, cl, hl, tier: ti, hp: Math.max(2, Math.round(hp * .85 * .62)), max: Math.max(1, Math.round(max * .8 * .72)), att: Math.round(cl * .9), def: Math.round(cl * .8), coins: [0, 0], col: opts.fur || opts.plum || opts.col || '#8a8a8a', drops: dropsFor(town, ti, kind), huntKind: kind };
      D.MON[id] = m; D.MONLIST.push(m);
      D.EXTRA_CREATURES = D.EXTRA_CREATURES || {}; D.EXTRA_CREATURES[id] = { body: builder === 'bird' ? 'winged' : builder === 'serpent' || builder === 'newt' ? 'serpent' : 'beast', mark: 'hunt', index: Object.keys(D.EXTRA_CREATURES).length };
      D.HUNT_NEW.push(id); r.hunt[1].push(id);
      (D.HUNT_ART = D.HUNT_ART || {})[id] = [builder, opts];
      (D.HUNT_NOTES = D.HUNT_NOTES || {})[id] = note;
    });
  }
  for (const m of existing) m.tier = D.huntTierOf(m.hl);
  /* the ground lists its animals lowest first */
  r.hunt[1].sort((a, b) => (D.MON[a]?.hl || 0) - (D.MON[b]?.hl || 0));
}
/* field-guide notes in the house voice (villains.js writes the roster's; these are the hunt tiers') */
const notes = () => { if (!D.LORE) return; for (const [id, note] of Object.entries(D.HUNT_NOTES || {})) if (!D.LORE[id]) D.LORE[id] = { note, legend: note }; };
notes(); if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', notes);
})();
