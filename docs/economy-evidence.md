# Economy evidence (Stage 7)

Re-run: `node scripts/sim-economy.cjs 24` (current tuning) and `node scripts/sim-economy.cjs 24 --no-economy`
(pre-tuning values). The bot is a steady, sensible player: it rotates Fishing, Woodcutting and Mining every 15 minutes
on the best node in its town, sells everything every 30 minutes, never spends, and reaches new towns at Hero-level
checkpoints standing in for combat progress (combat itself is not simulated). It measures supply, not fun.

## Coins in the purse (24 hours of active play)

| Hour | Hero | Town | Current tuning | Coins/hour | Pre-tuning | Coins/hour |
|---:|---:|---|---:|---:|---:|---:|
| 0.5 | 13 | Mossbarrow | 2,109 | 4,218 | 3,917 | 7,834 |
| 1 | 18 | Mossbarrow | 4,534 | 4,850 | 11,526 | 15,218 |
| 2 | 26 | Saltmere | 10,914 | 6,380 | 27,111 | 15,585 |
| 4 | 36 | Saltmere | 28,217 | 8,652 | 66,104 | 19,497 |
| 8 | 46 | Ironpeak | 85,229 | 14,253 | 203,912 | 34,452 |
| 12 | 52 | Gloomfen | 157,306 | 18,019 | 376,277 | 43,091 |
| 24 | 61 | Gloomfen | 490,925 | 32,331 | 1,229,495 | 76,331 |

Codex's reward tuning leaves about 40% of the earlier coin supply.

## What it can buy

Key prices are reached early with current tuning: tier 2 tool, cottage, kitchen and the cheaper projects in the first
hour; tier 4 tool, workshop and the most expensive regional project by about 4 hours; a typical Scholarship tier III
project by about 8 hours.

Total coin sinks in the game are about 3.4 million: furniture 1.84M, Scholarship 0.80M, tools 0.43M, farm plots 0.13M,
rooms 0.09M, pens 0.09M, projects 0.04M, animals 0.03M (plus gear purchases up to 300,000 and worker wages).

## Reading

- No rebalance is recommended now. Early purchases come quickly (good for a first session) and the long tail of
  furniture, Scholarship and tools gives coins a purpose for dozens of hours.
- Watch in human playtests: whether the first two hours make shop choices feel trivial, and whether Hero 46 to 65
  (about 8 to 24+ hours here) feels thin. The Ironpeak adventure and later restoration projects now sit in that band.
- Hero pace: Hero 13 at 30 minutes, 26 at 2 hours, 46 at 8 hours, 61 at 24 hours of steady gathering.

## Combat catch-up (Nov 2026)

Playtest note: Hero level rose much faster than combat level, so the first boss (Grubnash, combat 10) took a long time after the quick opening quests, and there was no visible progress towards the next combat level.

- Combat level now shows a progress bar and the cheapest single-skill route ("N Strength XP reaches combat X") in the Combat menu entry and on the combat page (`DQ.combatProgress`).
- While combat level trails Hero level, combat skills earn +15% XP per level behind, up to +200% (`DQ.combatCatchUp`, applied in `DQ.xpMult`). Gathering, crafting and the economy are unaffected; the bonus disappears once combat catches up.

Fresh-character simulation, fighting the best available Willowbrook target with food (minutes of fighting to reach combat 10):

| Player | Before | After |
| --- | --- | --- |
| Fights from the start | 82 | 66 |
| Gathered to Hero 10 first | 81 | 45 |

## First boss rebalance (Nov 2026)

`node scripts/sim-opening.cjs` plays a purposeful beginner through the real engine (First Steps, Goblin Menace, cooking, the best Willowbrook target with training styles rotated, quests claimed), then runs 96 forecast fights against Grubnash at full health for each preparation level. `node scripts/sim-bosses.cjs` checks every boss at its requirement with region melee gear and 15 of the best cookable food (no counters).

| At the gate | Before (combat 10, hp 28, max 4) | After (combat 8, hp 20, max 3) |
| --- | --- | --- |
| Minutes to the gate | 28 | 21 |
| As reached / +15 shrimp | 0% / 0% | 18% / 26% |
| Bronze armour + 15 shrimp | 1% | 68% |
| Armour + warhammer (his weakness) + 15 shrimp | 25% | 92% |

The economy simulator does not model combat, so its coin table is unchanged by this tuning.

## Boss retune with counters (Nov 2026)

`COUNTER=1 node scripts/sim-bosses.cjs` (96 forecast fights per row; the hero follows the field guide with region gear, slots that style's abilities and carries 15 food; counter skill at the melee level). Bosses only: weakness ×1.3 (×1.6 with Focus), resistance 70%.

| Boss | Prepared, at requirement | Prepared, +3 levels | Plain melee |
| --- | --- | --- | --- |
| Old Tusk (hp 60) | 100% | 100% | 49% |
| Barnacle (max 7) | 84% | 97% | 80% |
| Frostmaw (hp 185, max 15) | 94% | 99% | 0% |
| Morwenna (hp 186, max 18) | 85% | 98% | 0% |
| Pyrrhax (hp 440, max 25) | 93% | 99% | 0% |
| Zephyrion (hp 380, max 39) | 85% | 100% | 0% |
| Hollow King (max 32) | 92% | 91% | 0% |

Before: 100% for every boss with counters, and up to 0% without them. Old Tusk stays generous by design (his charge is halved against arrows, and Ranged unlocks at his gate). Single runs vary by about ±10%.

## Preparation choices (Nov 2026 review)

`COMPARE=1 PARTS=1 node scripts/sim-bosses.cjs` compares, for each boss at its requirement: no abilities, a general build, each preparation on its own, the field-guide counter, all alternative preparations together, and +5 levels. The results table and reading are in `docs/experience-assessment.md` (Review response). The earlier "plain melee 0%" column used no abilities and should not be read as "melee cannot win".

## Style parity and the Hollow King (Nov 2026)

`PARITY=1 node scripts/sim-bosses.cjs`: each hero at the boss's combat requirement, made from its own style, with best region gear, its style's abilities and 15 food, against the boss with weaknesses and resistances removed (96 fights).

| Boss | Melee | Ranged | Magic |
| --- | --- | --- | --- |
| Frostmaw | 23% | 99% | 98% |
| Morwenna | 69% | 99% | 100% |
| Pyrrhax | 38% | 99% | 98% |
| Zephyrion | 75% | 100% | 100% |
| Hollow King (new: req 97, hp 580, max 36) | 65% | 100% | 100% |

- A pure ranged or magic hero tops out at combat 97, melee at 113, so the final boss now asks for 97.
- At equal combat level, melee is the weakest style. This is recorded for a future decision and left unchanged.

## Melee parity (Nov 2026, approved: "Rebalance melee across the whole game")

`D.STYLE_TUNE.meleeLevel = 4/3` (data3.js) multiplies effective Attack and Strength in `DQ.pstats`, so a melee hero at a given combat level hits about as often and as hard as the other styles. Same harness as the table above (`PARITY=1 node scripts/sim-bosses.cjs`, weaknesses and resistances removed, 96 fights).

| Boss | Melee before | Melee after | Ranged | Magic |
| --- | --- | --- | --- | --- |
| Frostmaw | 23% | 80% | 97% | 98% |
| Morwenna | 69% | 100% | 95% | 100% |
| Pyrrhax | 38% | 89% | 99% | 98% |
| Zephyrion | 75% | 98% | 100% | 100% |
| Hollow King | 65% | 97% | 100% | 98% |

- Melee is now inside the band of the other styles everywhere except Frostmaw (80%), where it is still the weakest. That is left for a decision, not retuned.
- The opening is barely affected: combat 8 at 22 minutes before the early-pace change below, and following the boss advice wins 90% or more.
- Not retuned: later bosses with general (non-counter) melee preparation now win 84 to 98% (previously 25 to 75%). Whether bosses should be made harder again is an open decision.

## Early pace (Nov 2026 playtest: "level 6 after 4 minutes")

`D.EARLY_PACE = { from: .3, until: 20 }` (state.js): non-combat skills earn 30% XP at level 1, rising evenly to full XP at level 20. Combat skills are unchanged. Normal trees give 18 XP (was 25). Measured through the real engine with `scripts` harness code (fresh hero, one task, no quests):

| Minutes | Fishing before → after | Woodcutting before → after |
| --- | --- | --- |
| 1 | 3 → 2 | 5 → 2 |
| 4 | 7 → 4 | 10 → 6 |
| 10 | 10 → 7 | 14 → 10 |
| 30 | 16 → 13 | 21 → 17 |

- Hero level after 30 minutes of fishing: 10 → 8. Hero-level unlocks arrive later by the same margin.
- `sim-opening.cjs`: combat 8 at 25 minutes (was 22), Hero 8 when you get there (was 10). Following the boss advice wins 97% (was 90%), because the longer opening leaves more food in the pack.
- From level 20 on nothing changes, so the mid- and late-game evidence above still holds. `sim-economy.cjs 24` coin timings are unchanged in shape.

## Content expansion (Nov 2026 brief)

`node scripts/sim-economy.cjs 24` before and after adding 34 gathering resources and 75 recipes. New fish, logs and minerals sell at about 80% of their level neighbours.

| Hour | Coins before | Coins after | Hero before | Hero after |
| --- | --- | --- | --- | --- |
| 4 | 25,654 | 29,082 | 38 | 39 |
| 12 | 145,270 | 163,605 | 54 | 55 |
| 24 | 461,321 | 492,763 | 63 | 64 |

- About 7% more coins at 24h: richer mid-game choices, not a loop. Suppers sell for roughly their ingredients, and made tools cost about their sale value in materials.
- The opening is unchanged: `sim-opening.cjs` still reaches combat 8 at 25 minutes.

## New skills (Nov 2026): node scripts/sim-new-skills.cjs

```
Sailing voyages (per hour, before speed bonuses)
island           lvl boat  XP/h     coin value/h   fishing at same level: XP/h  value/h
Gull Rock        1   1     6912     7092           5400                         1800
Kelp Isle        10  1     11031    6853           14727                        3273
Smugglers’ Cay   20  2     15540    12800          22500                        4500
Amber Shoals     30  2     20083    15866          29077                        6923
Coral Reach      40  3     24624    20146          34714                        14143
Spice Atoll      52  3     30072    20203          36000                        20400
Storm Spire      64  4     35509    40456          39600                        30000
Sunken Crown     78  4     41857    35270          37125                        56250
World’s Edge     90  5     47301    66390          42000                        87000

Carpentry planks (per hour): XP and value added over selling the logs
Planks           lvl 1   XP/h 9327    value added/h 1636
Oak planks       lvl 10  XP/h 15218   value added/h 3273
Willow planks    lvl 22  XP/h 22582   value added/h 3273
Maple planks     lvl 38  XP/h 33382   value added/h 6545
Yew planks       lvl 52  XP/h 42218   value added/h 13091
Magic planks     lvl 68  XP/h 53018   value added/h 27818
Elder planks     lvl 82  XP/h 61364   value added/h 45818

Boats: materials value vs. the boat
Skiff     carpentry 8   reaches tier 1 islands · materials worth 44 coins
Cog       carpentry 25  reaches tier 2 islands · materials worth 350 coins
Sloop     carpentry 45  reaches tier 3 islands · materials worth 904 coins
Caravel   carpentry 65  reaches tier 4 islands · materials worth 2290 coins
Galleon   carpentry 85  reaches tier 5 islands · materials worth 8530 coins
```

Sailing XP runs at roughly 75–110% of Fishing at the same level while the haul is worth about Fishing's value early and mid, less late. Plank sawing adds 1.6k–46k coins an hour of value over selling logs (it costs the logs and the time), so Carpentry pays mainly through what planks build. sim-economy milestones are unchanged: its simulated player does not train these skills.


## Skill perks and flourishes (Nov 2026)

`node scripts/sim-economy.cjs 24` with and without `NO_PERKS=1`: 24 h coins 588,099 → 622,131 (+6%), hero 65 → 66, first hour 3,992 → 4,850 coins. Boss ladder (`sim-bosses.cjs`) identical with and without perks.
