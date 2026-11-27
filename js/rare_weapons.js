/* Idlewick: the named weapons (owner, 27 Nov 2026: "bring all the retired names as rare drops with unique art - make them
   all feel genuinely unique and cool").
   The fantasy names that used to sit on smithed gear (Soldier's Blade, Glacier Fang, Starsunder...) are now rare drops
   from one fitting creature each: a regular creature (about 1 in 120 to 1 in 260), a mini-boss (1 in 25), a tower
   boss (1 in 12) or the Hollow King (1 in 40). The engine's bad-luck guarantee gives the first copy after about 2.5x
   the expected number of victories. Viper's kiss already existed as a drop, so 29 names come back here.
   Stats sit a little under the smithed weapon of the same level (stat(), 92%), so wearing one is a choice; what makes
   each one worth it is its signature: `unique.fx` names a mechanic the combat engine applies with this weapon's own
   numbers (engine.js, DQ.rareFx). Art: js/pixel_items.js (one hand-drawn sprite per weapon). Balance evidence:
   node scripts/sim-uniques.cjs. Nothing here is crafted, sold or given by a quest (tests/weapon-names.cjs). */
(() => {
const DQ = window.DQ, D = DQ.data, ITEMS = D.ITEMS;
/* the smithed ladder each kind of weapon is measured against (req level -> stats), from the shipped items */
const LADDER = {
  sword: ['bronze_sword', 'iron_sword', 'steel_sword', 'mithril_sword', 'adamant_sword', 'rune_sword', 'astral_sword'],
  dagger: ['bronze_dagger', 'iron_dagger', 'steel_dagger', 'mithril_dagger', 'adamant_dagger', 'rune_dagger', 'astral_dagger'],
  hammer: ['bronze_hammer', 'iron_hammer', 'steel_hammer', 'mithril_hammer', 'adamant_hammer', 'rune_hammer', 'astral_hammer'],
  bow: ['bow_normal', 'bow_oak', 'bow_willow', 'bow_maple', 'bow_yew', 'bow_magic', 'bow_elder'],
  staff: ['staff_normal', 'staff_oak', 'staff_willow', 'staff_maple', 'staff_yew', 'staff_magic', 'staff_elder'],
};
const reqOf = it => Object.values(it.req || {})[0] || 1;
/* stats for a weapon of this kind at level L: interpolated along the ladder; past the top rung they grow 0.6% a level */
const stat = (kind, L, k = .92) => {
  const rungs = LADDER[kind].map(id => ITEMS[id]).filter(Boolean), keys = Object.keys(rungs[0].b), out = {};
  let lo = rungs[0], hi = rungs[rungs.length - 1], t = 0, past = 1;
  if (L >= reqOf(hi)) { lo = hi; past = 1 + (L - reqOf(hi)) * .006; }
  else for (let i = 0; i < rungs.length - 1; i++) if (L >= reqOf(rungs[i]) && L < reqOf(rungs[i + 1])) { lo = rungs[i]; hi = rungs[i + 1]; t = (L - reqOf(lo)) / (reqOf(hi) - reqOf(lo)); break; }
  for (const s of keys) out[s] = Math.max(1, Math.round(((lo.b[s] || 0) + ((hi.b[s] || 0) - (lo.b[s] || 0)) * t) * past * k));
  const val = Math.round(((lo.val || 1) + ((hi.val || 1) - (lo.val || 1)) * t) * past * 3);
  return { b: out, val: Math.min(60000, Math.max(150, val)) };
};
const KIND = { sword: { ic: 'sword', wtype: 'sword', style: 'melee', skill: 'attack' }, dagger: { ic: 'dagger', wtype: 'dagger', style: 'melee', skill: 'attack' },
  hammer: { ic: 'hammer', wtype: 'hammer', style: 'melee', skill: 'attack' }, bow: { ic: 'bow', style: 'ranged', skill: 'ranged' }, staff: { ic: 'staff', style: 'magic', skill: 'magic' } };
/* [id, name, kind, level, source creature, chance, colour, signature, what it is good for, flavour] */
const W = [
  /* Willowbrook */
  ['alley_knife', 'Alley Knife', 'dagger', 6, 'goblin_raider', 1 / 120, '#8a7a6a',
    { key: 'pickpocket', name: 'Pickpocket', fx: 'steal', coin: .4, pouch: .08, text: '+40% coins from victories · 8% chance of an extra coin pouch' },
    'emptying pockets mid-fight', 'Every town has an alley and every alley has one of these. This one has notches on the handle, and none of them are for goblins.'],
  ['acolytes_staff', "Acolyte's Staff", 'staff', 6, 'goblin_hexer', 1 / 120, '#c8a86a',
    { key: 'study', name: 'Diligent study', fx: 'scholar', m: 1.15, text: '+15% combat XP' },
    'levelling faster while the fights are easy', 'A temple apprentice’s practice staff, chewed at one end. The hexer was using it to stir soup.'],
  ['smiths_maul', "Smith's Maul", 'hammer', 9, 'goblin_brute', 1 / 130, '#a86a3a',
    { key: 'truestrike', name: 'True strike', fx: 'floor', f: .4, text: 'Every hit lands for at least 40% of max hit' },
    'steady damage with no feeble hits', 'Willowbrook’s smith lost it in the spring raid and has been hitting horseshoes with a rock ever since. He would like it back. He will not get it back.'],
  /* Mossbarrow */
  ['hunters_bow', "Hunter's Bow", 'bow', 11, 'poacher', 1 / 140, '#8a6a3a',
    { key: 'fielddress', name: 'Field dressing', fx: 'feast', heal: .12, text: 'Heal 12% of max health on each victory' },
    'long runs of short fights', 'Oiled, strung and looked after better than the poacher looked after anything else. There is a tally of rabbits on the grip.'],
  ['soldiers_blade', "Soldier's Blade", 'sword', 13, 'barrow_ghoul', 1 / 150, '#9aa4b0',
    { key: 'holdline', name: 'Hold the line', fx: 'rally', below: .5, red: .25, text: 'Below half health: take 25% less damage' },
    'fights that go badly before they go well', 'Buried with a soldier who expected to need it. The ghoul has been minding it since, badly.'],
  ['quickfang', 'Quickfang', 'dagger', 16, 'dire_wolf', 1 / 160, '#d8d0c0',
    { key: 'quickbite', name: 'Quick bite', fx: 'quick', spd: .15, dmg: .07, text: '+15% attack speed · −7% damage' },
    'enemies that die before they get going', 'A wolf’s tooth the length of your hand, bound to a grip. Someone made this to prove a point. The point is very sharp.'],
  ['willowshade_staff', 'Willowshade Staff', 'staff', 17, 'bramble_witch', 1 / 160, '#7aa86a',
    { key: 'willowward', name: 'Willow ward', fx: 'guard', n: 3, red: .5, text: 'The first 3 hits each fight deal half damage' },
    'hard openings and short fights', 'Green wood that never quite dried out. Leaves still sprout from it in spring, which the witch found embarrassing.'],
  ['whisperwood_bow', 'Whisperwood Bow', 'bow', 19, 'rookmother', 1 / 25, '#5a6a5a',
    { key: 'silentshot', name: 'Silent shot', fx: 'opener', n: 2, m: 1.75, text: 'First 2 shots each fight: sure hits, +75% damage' },
    'opening on tough targets', 'Strung with something the Rookmother pulled out of her own nest. It makes no sound at all, which is unsettling the first few times.'],
  /* Saltmere */
  ['siegebreaker', 'Siegebreaker', 'hammer', 22, 'pirate_bosun', 1 / 180, '#6a7a8a',
    { key: 'breach', name: 'Breach', fx: 'breach', d: .35, text: 'Ignores 35% of enemy defence' },
    'armoured, hard-to-hit enemies', 'Built to knock in castle doors. The bosun uses it to knock in barrels, which is a waste, but rum is rum.'],
  ['spellstring', 'Spellstring', 'bow', 23, 'sea_hag', 1 / 180, '#8a6ac8',
    { key: 'runedstring', name: 'Runed string', fx: 'spellshot', p: .25, f: .4, text: '25% chance: a bolt of your strongest spell’s element for up to 40% of max hit' },
    'enemies weak to magic', 'A bowstring of twisted kelp with runes knotted into it. The sea hag swore it would sing. It hums, mostly off-key.'],
  ['knights_longsword', "Knight's Longsword", 'sword', 25, 'brinemaw', 1 / 25, '#c8d0e0',
    { key: 'parry', name: 'Parry', fx: 'parry', p: .15, text: '15% chance to turn aside an ordinary hit' },
    'enemies that hit hard and often', 'The Brinemaw swallowed a knight whole, armour and all. It kept the sword. It would like to keep you too.'],
  ['nightglint', 'Nightglint', 'dagger', 29, 'lanternjack', 1 / 25, '#3a3a6a',
    { key: 'glint', name: 'Glint', fx: 'crit', p: .18, m: 2, text: '18% chance to strike for double damage' },
    'big swings of luck', 'A black blade that catches light that isn’t there. Lanternjack kept it in his lamp, where it was very hard to see.'],
  /* Ironpeak */
  ['glacier_fang', 'Glacier Fang', 'sword', 35, 'icewolf', 1 / 200, '#a8d8f0',
    { key: 'glacialbite', name: 'Glacial bite', fx: 'chill', p: .25, slow: .4, n: 2, text: '25% chance on hit: the enemy’s next 2 attacks come 40% slower' },
    'fast-attacking enemies', 'Ice that will not melt, ground to an edge. Your hand goes numb if you hold it too long, so don’t.'],
  ['frostbite', 'Frostbite', 'dagger', 37, 'ice_wight', 1 / 200, '#d0e8f8',
    { key: 'coldfinish', name: 'Cold finish', fx: 'reap', below: .35, m: 1.6, text: '+60% damage against enemies under 35% health' },
    'finishing what you started', 'The ice wight held this for so long it froze to its hand. That turned out to be the wight’s problem, not yours.'],
  ['earthshaker', 'Earthshaker', 'hammer', 43, 'yeti', 1 / 220, '#8a6a4a',
    { key: 'tremor', name: 'Tremor', fx: 'every', n: 4, m: 1.8, stun: 1, text: 'Every 4th attack: +80% damage and the enemy skips its next attack' },
    'heavy hitters you would like to interrupt', 'A boulder on a pine trunk. The yeti did not make it so much as find it and refuse to let go.'],
  ['avalanche', 'Avalanche', 'hammer', 48, 'tw_rimebeard', 1 / 12, '#e8f0f8',
    { key: 'avalanche', name: 'Avalanche', fx: 'snowball', step: .04, cap: .4, text: 'Each hit: +4% damage for the rest of the fight (up to +40%)' },
    'long fights against big health pools', 'Jarl Rimebeard’s maul. He named his best attack after it and has never once been asked about it at parties.'],
  /* Gloomfen */
  ['nightyew_longbow', 'Nightyew Longbow', 'bow', 52, 'reedstalker', 1 / 220, '#3a4a3a',
    { key: 'steadydraw', name: 'Steady draw', fx: 'momentum', step: .06, cap: .3, text: 'Each hit in a row: +6% damage (up to +30%); a miss resets it' },
    'patient, accurate shooting', 'Yew grown in the dark under the fen. The reedstalker used it to stand very still. You will find it works for shooting too.'],
  ['yewbound_staff', 'Yewbound Staff', 'staff', 54, 'bog_hag', 1 / 220, '#5a7a3a',
    { key: 'rootrot', name: 'Rootrot', fx: 'dot', per: .12, max: 3, el: 'nature', text: 'Each spell plants a creeping root (max 3); each deals 12% of max hit when the enemy attacks' },
    'long fights you want to end sooner', 'A staff with roots still wrapped round it. They are still growing. Do not leave it in the umbrella stand.'],
  ['whisperblade', 'Whisperblade', 'dagger', 57, 'gallowmoth', 1 / 25, '#c8c0d8',
    { key: 'secondwhisper', name: 'Second whisper', fx: 'double', p: .25, m: .6, text: '25% chance to cut again for up to 60% of max hit' },
    'quick, steady damage', 'So thin you can read through it. The Gallowmoth wore it like a wing, which explains a lot about the Gallowmoth.'],
  ['emerald_reaver', 'Emerald Reaver', 'sword', 61, 'wraith', 1 / 240, '#3ac87a',
    { key: 'reave', name: 'Reave', fx: 'drain', p: .25, below: .5, text: 'Against enemies under half health: heal 25% of damage dealt' },
    'fights where food is short', 'A green blade that drinks. The fen wraith used it for centuries and still looked terrible, so it is clearly not a beauty treatment.'],
  /* Emberfall */
  ['autumn_recurve', 'Autumn Recurve', 'bow', 63, 'ashveil', 1 / 240, '#d87a3a',
    { key: 'leafstorm', name: 'Leaf storm', fx: 'volley', every: 3, n: 2, m: .5, text: 'Every 3rd shot looses 2 extra arrows for up to 50% each' },
    'steady damage against anything', 'Maple from the last tree on the mountain, the colour of a bonfire. The ashveil kept it as a reminder of trees.'],
  ['emberwood_staff', 'Emberwood Staff', 'staff', 65, 'ash_cultist', 1 / 240, '#e85a2a',
    { key: 'kindle', name: 'Kindle', fx: 'blaze', f: .3, text: 'Each spell adds fire damage up to 30% of max hit' },
    'enemies weak to fire', 'Charred black and still warm at the core. The cultists kept it lit for a hundred years. Please stop blowing on it.'],
  ['worldbreaker', 'Worldbreaker', 'hammer', 75, 'slagmaw', 1 / 25, '#ff8a3a',
    { key: 'shatter', name: 'Shatter', fx: 'sunder', step: .06, cap: .36, text: 'Each hit cracks the enemy’s armour: −6% defence (up to −36%)' },
    'bosses and armoured giants', 'Slagmaw swallowed the mountain’s forge hammer and grew around it. Getting it back was messy. It still glows where the crack runs.'],
  /* Skyreach */
  ['skyforged_saber', 'Skyforged Saber', 'sword', 87, 'sky_pirate', 1 / 250, '#9ad8ff',
    { key: 'skyfire', name: 'Skyfire', fx: 'every', n: 3, m: 1.45, sure: 1, text: 'Every 3rd attack: a sure hit for +45% damage' },
    'reliable damage against evasive enemies', 'Forged in a storm on purpose. The sky pirates stole it from the smith who did it, who was by then very tired.'],
  ['thunderhead', 'Thunderhead', 'hammer', 92, 'stormram', 1 / 25, '#e8d84a',
    { key: 'thunderhead', name: 'Thunderhead', fx: 'stunplus', p: .18, bonus: .5, text: '18% chance on hit: stun, and your next hit deals +50%' },
    'stopping big attacks before they land', 'Cut from the Stormcrown Ram’s own horn. It crackles before a storm, and during, and after, and at breakfast.'],
  ['aetherwood_staff', 'Aetherwood Staff', 'staff', 90, 'cloud_giant', 1 / 250, '#c8a8ff',
    { key: 'aetherwell', name: 'Aether well', fx: 'runesave', p: .35, dmg: .08, text: '35% chance a spell costs no runes · +8% spell damage' },
    'long runs on a rune budget', 'Wood that grew above the clouds and never saw soil. The giant used it as a toothpick. Wipe it first.'],
  /* the Hollow */
  ['elderthorn_greatbow', 'Elderthorn Greatbow', 'bow', 93, 'void_stalker', 1 / 260, '#6a3a4a',
    { key: 'thornvolley', name: 'Thornvolley', fx: 'dot', per: .06, max: 5, weaken: .04, el: 'nature', text: 'Each hit lodges a thorn (max 5): 6% of max hit as the enemy attacks, and −4% enemy damage per thorn' },
    'long fights against hard hitters', 'The oldest elder in the world, strung with a vine that is still alive. Arrows come out of it already angry.'],
  ['elderlight', 'Elderlight', 'staff', 95, 'threadsaint', 1 / 260, '#fff0b0',
    { key: 'dawnlight', name: 'Dawnlight', fx: 'dawn', n: 4, text: 'Every 4th spell also heals you for the damage it deals' },
    'outlasting anything', 'A staff of pale elder with a light at the tip that does not flicker, even in the Hollow. The threadbare saint was guarding it from the dark, or the other way round.'],
  ['starsunder', 'Starsunder', 'sword', 96, 'hollowking', 1 / 40, '#4a3a8a',
    { key: 'starfall', name: 'Starfall', fx: 'every', n: 4, m: 2.5, sure: 1, pierce: 1, text: 'Every 4th attack calls down a star: a sure hit for +150% that ignores resistances' },
    'the hardest fights in the world', 'Forged from a falling star by someone who caught it. The Hollow King had it hung over his throne. He never once swung it. You should.'],
];
D.RARE_WEAPONS = W.map(r => r[0]);
D.UNIQUE_USE = D.UNIQUE_USE || {};
for (const [id, name, kind, L, mon, p, col, u, use, flavour] of W) {
  const K = KIND[kind], s = stat(kind, L);
  ITEMS[id] = Object.assign({ id, name, ic: K.ic, col, type: 'gear', rare: 1, slot: 'weapon', style: K.style, req: { [K.skill]: L }, b: s.b, val: s.val, unique: u, flavour, named: 1 }, K.wtype ? { wtype: K.wtype } : {});
  D.UNIQUE_USE[u.key] = use;
  const m = D.MON[mon]; if (m) (m.drops = m.drops || []).push([id, [1, 1], p]);
}
/* tower bosses are built in towers.js; this file loads after it in the page. The simulators load it without towers,
   where Avalanche simply has no source. */
})();
