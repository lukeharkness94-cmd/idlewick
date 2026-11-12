# Combat balance review (Nov 2026)

Evidence from the game's own fight forecast (96 seeded fights per row). Reproduce with:

- `node scripts/sim-bosses.cjs`: boss ladder, a plain melee hero exactly at each boss's combat requirement
- `CSCALE=1.333 COUNTER=1 node scripts/sim-bosses.cjs`: the field guide's counter build at a fair level
- `COMPARE=1 node scripts/sim-bosses.cjs`: general / counter / extra preparation / +5 levels
- `PARITY=1 node scripts/sim-bosses.cjs`: melee, ranged and magic at the same combat level
- `node scripts/sim-uniques.cjs` (new): each unique against the regular gear it replaces

## Findings and changes

| Finding | Change |
|---|---|
| Without abilities, bosses from Frostmaw on dropped from 99% to 0–11% wins: their special attacks are built around Brace, and a player who never opened Abilities hit a wall. | Empty ability slots fill when a fight starts, with abilities you already have, Brace first, and a log line says so. A chosen ability is never replaced; removing one yourself turns this off (`settings.autoAbil`). |
| The Hollow King's first form resisted every magic element and its last form resisted Aether, so a mage's best spell was resisted for two thirds of the fight (counter build 28%, melee 98%). | The final form no longer resists aether. Every style now has one weak form and at least one neutral one: melee crush (weak, resisted, resisted), magic aether (resisted, weak, neutral), ranged pierce (neutral, resisted, weak). |
| Preparation advice only noticed empty armour slots, so a hero in the previous region's gear (Hollow King 61%) was told only to rest. | Advice now names a clearly stronger weapon or armour piece (20%+) you own, or the local shop's upgrades and their price. |
| The Berserker's torc did almost nothing in practice: auto-eat keeps health high, so Fury rarely engaged (0% faster kills). | Fury is now +10% damage always, rising to +40% as health falls (7% faster kills, less food). |

## After

Boss ladder (plain melee at the requirement, abilities filled as in game, 15 food):

| Boss | Combat | Win | Food per kill | +3 levels |
|---|---|---|---|---|
| Grubnash | 8 | 100% | 1.3 | 100% |
| Old Tusk | 18 | 100% | 8.0 | 100% |
| Barnacle | 25 | 100% | 5.7 | 100% |
| Frostmaw | 45 | 86% | 13.8 | 95% |
| Morwenna | 65 | 95% | 9.3 | 99% |
| Pyrrhax | 85 | 97% | 11.7 | 98% |
| Zephyrion | 95 | 90% | 11.4 | 98% |
| Hollow King | 97 | 61% (rune gear) / 98% (astral gear) | 14.5 | 68% |

Field-guide counters at a fair level win 100% from Grubnash to Zephyrion with roughly half the food of a plain build;
the Hollow King stays the final test at 80% (89% at +3). Preparation therefore changes safety and cost rather than
being a lock, and the final boss still rewards gear and levels.

Style parity (weaknesses removed, same combat level): all three styles win 96–100% at every boss from Old Tusk on.
They stay distinct: ranged kills fastest with steady hits, magic hits hardest but misses more, melee has the
strongest abilities and shields.

Unique gear: every unique now shows a measurable benefit in its niche (faster kills, less food, or a higher boss
win rate); see `node scripts/sim-uniques.cjs`. Early trophies (chief's helm, tusk charm) stay small by design.

Companions: the four combat tricks (Heckle, Charge, Cold shoulder, Ember breath) are modest and verified in live
play by `tests/ui-effects.cjs`; no change.

Early bosses (Grubnash, Old Tusk, Barnacle) stay forgiving at their requirement for accessibility; their cost shows in
food per kill rather than in losses.

## Mini-bosses (Nov 2026)
The climb from Grubnash (level 12, challenge from Combat 8) to Old Tusk (level 26, from Combat 18) had no named steps. Mossbarrow now has two challenges (`js/minibosses.js`), fought directly from the Challenges strip and never in random encounters:

| | level | challenge from | special | weak / resists | first victory |
|---|---|---|---|---|---|
| Gnarlroot | 18 | Combat 13 | Root snare every 4th attack (x1.4) | fire, slash / crush, pierce | Iron shield |
| The Rookmother | 22 | Combat 16 | Diving strike every 3rd attack (x1.4) | pierce, storm / crush | Iron platebody |

`node scripts/sim-bosses.cjs` (ladder now includes mini-bosses, marked ·) at the requirement with region melee gear: Grubnash 100% (1.3 food/kill), Gnarlroot 100% (7.8), Rookmother 100% (9.2), Old Tusk 100% (8.6). Each is a real food-and-preparation step without being a wall. Quests: Roots in the Orchard (Granny Bramble, Hero 12) and The Rookmother (Hunter Wynn, Hero 15).
