# Named weapons (27 Nov 2026)

Owner: "bring all the retired names as rare drops with unique art - make them all feel genuinely unique and cool."

The 30 fantasy names that used to sit on smithed gear came back as rare drops. Viper's kiss was already a drop,
so 29 are new (`js/rare_weapons.js`). Bronze shortsword, Bronze knife and Bronze mallet were plain names, not
fantasy ones, so they stayed retired. Smithed and sold weapons keep their alloy names (`tests/weapon-names.cjs`).

## How they work

- **Source:** one fitting creature each, at about 1 in 120–260 for regular creatures, 1 in 25 for mini-bosses, 1 in
  12 for Jarl Rimebeard (tower boss) and 1 in 40 for the Hollow King. The bad-luck guarantee gives the first copy within
  about 2.5× the expected victories (`engine.js` kill, `DQ.uniqueSource` for the tooltip line).
- **Stats:** 92% of the smithed weapon of the same kind at the same level. Above level 60, stats grow 0.6% a level past
  the astral and elder rungs. Wearing one is a choice; the signature is the reason to.
- **Signature:** `unique: { key, name, text, fx, …numbers }`. `fx` names a mechanic the engine applies with this
  weapon's own numbers (`DQ.rareFx()`; only the weapon slot carries one). `key` is the weapon's own, so every effect
  is counted and described separately (`D.UNIQUE_USE`). `tests/ui-effects.cjs` checks each one fires live, offline and
  in a forecast, and stops when the weapon is taken off.

| Weapon | Kind | Level | Drops from | Chance | Signature |
|---|---|---|---|---|---|
| Alley Knife | dagger | 6 | Goblin raider (Willowbrook) | 1/120 | Pickpocket: +40% coins from victories, 8% extra coin pouch |
| Acolyte's Staff | staff | 6 | Goblin hexer | 1/120 | Diligent study: +15% combat XP |
| Smith's Maul | hammer | 9 | Goblin brute | 1/130 | True strike: hits land for at least 40% of max hit |
| Hunter's Bow | bow | 11 | Poacher (Mossbarrow) | 1/140 | Field dressing: heal 12% of max health per victory |
| Soldier's Blade | sword | 13 | Barrow ghoul | 1/150 | Hold the line: below half health, 25% less damage taken |
| Quickfang | dagger | 16 | Dire wolf | 1/160 | Quick bite: +15% attack speed, −7% damage |
| Willowshade Staff | staff | 17 | Bramble witch | 1/160 | Willow ward: first 3 hits each fight deal half damage |
| Whisperwood Bow | bow | 19 | The Rookmother (mini-boss) | 1/25 | Silent shot: first 2 shots sure hits, +75% |
| Siegebreaker | hammer | 22 | Pirate bosun (Saltmere) | 1/180 | Breach: ignores 35% of enemy defence |
| Spellstring | bow | 23 | Sea hag | 1/180 | Runed string: 25% chance of a bolt in your strongest spell's element (40% of max hit) |
| Knight's Longsword | sword | 25 | The Brinemaw (mini-boss) | 1/25 | Parry: 15% chance to turn aside an ordinary hit |
| Nightglint | dagger | 29 | Lanternjack (mini-boss) | 1/25 | Glint: 18% chance of double damage |
| Glacier Fang | sword | 35 | Ice wolf (Ironpeak) | 1/200 | Glacial bite: 25% chance the enemy's next 2 attacks come 40% slower |
| Frostbite | dagger | 37 | Ice wight | 1/200 | Cold finish: +60% damage under 35% enemy health |
| Earthshaker | hammer | 43 | Yeti | 1/220 | Tremor: every 4th attack +80% and the enemy skips its next attack |
| Avalanche | hammer | 48 | Jarl Rimebeard (Frostspire tower) | 1/12 | Avalanche: +4% damage per hit this fight (up to +40%) |
| Nightyew Longbow | bow | 52 | Reedstalker (Gloomfen) | 1/220 | Steady draw: +6% per hit in a row (up to +30%), a miss resets |
| Yewbound Staff | staff | 54 | Bog hag | 1/220 | Rootrot: spells plant roots (max 3), each 12% of max hit as the enemy attacks |
| Whisperblade | dagger | 57 | Gallowmoth (mini-boss) | 1/25 | Second whisper: 25% chance of a second cut (60% of max hit) |
| Emerald Reaver | sword | 61 | Fen wraith | 1/240 | Reave: heal 25% of damage dealt to enemies under half health |
| Autumn Recurve | bow | 63 | Ashveil (Emberfall) | 1/240 | Leaf storm: every 3rd shot looses 2 extra arrows (50% each) |
| Emberwood Staff | staff | 65 | Ash cultist | 1/240 | Kindle: spells add fire damage up to 30% of max hit |
| Worldbreaker | hammer | 75 | Slagmaw (mini-boss) | 1/25 | Shatter: −6% enemy defence per hit (up to −36%) |
| Skyforged Saber | sword | 87 | Sky pirate (Skyreach) | 1/250 | Skyfire: every 3rd attack a sure hit for +45% |
| Thunderhead | hammer | 92 | The Stormcrown Ram (mini-boss) | 1/25 | Thunderhead: 18% chance to stun; the next hit +50% |
| Aetherwood Staff | staff | 90 | Cloud giant | 1/250 | Aether well: 35% chance a spell costs no runes, +8% spell damage |
| Elderthorn Greatbow | bow | 93 | Void stalker (the Hollow) | 1/260 | Thornvolley: thorns (max 5) deal 6% of max hit as the enemy attacks, −4% enemy damage each |
| Elderlight | staff | 95 | Threadbare saint | 1/260 | Dawnlight: every 4th spell also heals you for its damage |
| Starsunder | sword | 96 | The Hollow King | 1/40 | Starfall: every 4th attack a sure hit for +150% that ignores resistances |

## Evidence: `node scripts/sim-uniques.cjs`

The simulator puts a hero at the drop region's boss requirement in the region's best ordinary gear, then swaps the
named weapon in. It reports seconds and food per kill against the region's toughest ordinary creature, and the boss win
rate. Existing named gear ranges from "same" to 57% faster.

| Weapon | vs toughest regular | vs boss |
|---|---|---|
| Acolyte's Staff | same (its value is XP, which the sim does not count) | Grubnash 92% → 95% |
| Smith's Maul | 17% faster | Grubnash 100%, food 1.0 → 0.7 |
| Hunter's Bow | same (heals between short fights) | Old Tusk 100% |
| Soldier's Blade | 7% faster | Old Tusk 100% |
| Quickfang | 36% faster | Old Tusk 100%, food 5.8 → 3.4 |
| Willowshade Staff | 8% faster, food 0.6 → 0.1 | Old Tusk 100% |
| Whisperwood Bow | 27% faster | Old Tusk 100% |
| Siegebreaker | 38% faster | Barnacle 100%, food 5.4 → 3.1 |
| Spellstring | 12% faster | Barnacle 51% → 73% |
| Knight's Longsword | 41% faster | Barnacle 100% |
| Nightglint | 35% faster | Barnacle 100% |
| Glacier Fang | 21% faster | Frostmaw 81% → 96% |
| Frostbite | 36% faster | Frostmaw 83% → 100% |
| Earthshaker | 32% faster | Frostmaw 88% → 100%, food 12.1 → 4.9 |
| Avalanche | 32% faster | Frostmaw 98% → 100%, food 10.3 → 4.5 |
| Nightyew Longbow | 12% faster | Morwenna 99% → 98% |
| Yewbound Staff | 41% faster | Morwenna 98% → 100%, food 8.0 → 1.5 |
| Whisperblade | 47% faster | Morwenna 95% → 100% |
| Emerald Reaver | 59% faster | Morwenna 100%, food 8.2 → 2.8 |
| Autumn Recurve | 28% faster | Pyrrhax 100%, food 4.9 → 2.5 |
| Emberwood Staff | 38% faster | Pyrrhax 100% |
| Worldbreaker | 39% faster | Pyrrhax 98% → 100%, food 9.9 → 3.4 |
| Skyforged Saber | 61% faster | Zephyrion 99% → 100% |
| Thunderhead | 26% faster | Zephyrion 100%, food 6.9 → 3.5 |
| Aetherwood Staff | 26% faster | Zephyrion 96% → 97% (its value is runes saved) |
| Elderthorn Greatbow | 31% faster | Hollow King 100%, food 9.9 → 4.4 |
| Elderlight | same | Hollow King 92% → 100%, food 12.8 → 7.5 |
| Starsunder | 27% faster | Hollow King 100%, food 6.8 → 1.8 |

The baseline melee weapon is the slowest-swinging, highest-total one (a hammer), so swords and daggers look faster
than they would against a plain sword. Viper's kiss and the Barnacle cutlass show the same 54–57%. Skyforged Saber
went from +60% to +45% on its third attack and Emerald Reaver from 30% to 25% healing after the first run.
Alley Knife shows no source in the sim because its goblin raider is defined in a file the sim does not load; its
signature is coins, which the sim does not measure anyway. Simulations are evidence, not playtests.

`node scripts/sim-bosses.cjs` gives identical output before and after the engine changes, so fights without a named
weapon are unchanged.
