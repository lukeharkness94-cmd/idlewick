# Connected systems — 16 November 2026

Implemented on main baseline `5f9fcc12e79cd56cdd273be3f460594021bd6156` (14 November, 21:04 UTC). This follows the player's “Make every system matter” brief; it does not copy the older checkout's unfinished work.

## Audit and decisions

The baseline already contained restoration staging/reveals, two shop shelves, instant researched brewing, autonomous wage-paid workers, five-stage material mastery, Iron's Stonebread recipe, eight five-floor towers, and one active companion with signature tricks plus four bond species. Those systems were extended. No new general menu, currency, tower, active companion slot or acquisition route was introduced.

### Restoration and shops

Each completed non-relic project contributes 10 permanent local standing. Standing is derived from completed flags; reload, repair and repeat events cannot increment it. Damaged buildings keep their standing. The local supply service pauses until repaired. Thresholds are 10, 20 or 30; no stock requires every project. Each offering additionally requires its own building restored. Normal shop stock, quest gates and main roads are unchanged.

Every non-relic building now previews specific supplies. Examples: the tannery supplies hides/pelts; smokehouse sells herring/sardines; forge sells bronze bars; the well supports emergency healing draughts; windmill offers wheat/bread; granary offers seed/feed; herbary offers plants; boathouse offers cloth/planks. Other towns have corresponding regional supplies. Prices are premiums over item sale values (ingredients 2.5×, food 4×, rounded up and with existing Thieving discount). Ingredients have no restock timer; prepared food is restricted to an owned reserve of 12 of that food, and well draughts to three bottles (inventory and bank together), encouraging cooking for sustained supply. Both conditions, actual availability and purchase price use shared rule functions. Project previews link to the exact supply entry in the existing shop; locked entries link back to the building.

### Explicit restoration migration

`restorationVersion:1` is written for new saves, with `legacyRestoration:{}`. When loading a save without that version, only its already-completed non-relic projects are recorded as legacy. Their original percentages remain, once, and remain paused by damage as before. Newly completed projects do not gain those percentages. Relic project effects remain unchanged. The old `fx` definitions are retained solely to calculate grandfathered benefits; no replacement percentage is added to the new supply service. The selected legacy building explicitly states its retained benefit. Existing projects, deliveries, pins, inventory, research, workers, companions and tower records are preserved. Unknown future migration versions are rejected rather than guessed at. Save schema/file names remain v2.

This intentionally lets an established save retain its earned advantage while receiving the new supply options. It does not silently remove investments or award legacy bonuses to later restorations.

### Shop/crafting overlap

| Fortune route | Before | After |
|---|---|---|
| Shop tonic | 30 minutes at 1.5× drop chance; repeat purchases extend the buff | Same duration/strength; one purchase per six game hours globally, across towns |
| Researched brewing | One 30-minute bottle for 500 coins, one moonmelon, one sapphire | Three 60-minute bottles for the same batch ingredients and coins |

Existing bottles improve to the new duration; active buffs are not truncated. Existing research remains earned. The 45,000-coin, five-sapphire, 120-minute Fortune research investment remains; the payoff is sustained portable supply, not a stronger drop multiplier. A base batch now covers three hours, before optional existing extra-bottle perks. Six emergency tonics at Mossbarrow's 580-coin price would cost 3,480 coins and would be spread over 30 hours between purchases. Brewing costs 500 coins plus materials with 100-coin sale value, approximately 100 coins per equivalent 30 minutes when valuing ingredients at their sale price. Ingredient acquisition time and research investment are additional costs; sale value is not a claim that those materials are instantly available. At that valuation, research pays back after roughly 94 half-hour units (~47 hours of buff use), before accounting for five research sapphires, acquisition time, higher-town prices or extra bottles. The main immediate benefit is availability for sustained preparation.

The emergency cooldown advances on the existing game/offline clock, has no expiry, and generates no “ready” nag. Local supply ingredients have no such cooldown. New supply purchases, tonic purchases and composed brewing actions restore their prior state if persistence fails.

### Finite workers

`DQ.assign(id,node,target,label)` extends the existing assignment. Null target means unrestricted. An integer target is **additional actual output**, calculated at creation. A project requiring 100 with 60 held creates a 40-output job. Later spending does not extend it. Recipe links calculate the missing ingredients for one recipe batch. Only the worker's already-eligible skill/level/town nodes are offered; farmhands retain their ordinary tending job.

Output enters the existing bank. Bonuses count toward `done`; a two-item final action can overshoot by one. No resources are auto-crafted, delivered or spent. Finishing stores `jobComplete`, clears task/progress and stops subsequent wage accrual. Fractional existing wages remain accounted for rather than being reset by reassignment. World ticks split at work boundaries, so completion does not charge the remainder of a large offline tick. Insufficient wages pause progress without producing more output; funding resumes it. Cancelling/assigning another node clears the old target. Saved targets and item/task consistency are validated. The worker view shows live progress, completion, custom quantity and a switch back to unrestricted work; desktop puts the planner beside assignments to keep its controls visible at 1280×720. Project/recipe links bring an eligible worker and its requirement together.

### Optional Guide discoveries and farmhands

The existing secret-recipe book now supports outputting established items. Three additions:

- Shrimp Guide stage 2 (100 catches): Fisher's healing broth — four cooked shrimp + one onion → one existing Healing draught, Cooking 12. Familiar fish can provide a situational emergency heal; researched Herbalism remains another supply route.
- Tree Guide stage 3 (300 chops): Charcoal burning — four logs → three coal, Crafting 10. An alternative fuel source connects Woodcutting to smelting.
- Wheat Guide stage 2 (100 harvest credits): Farmhand's four loaves — two wheat + one milk → four bread, Cooking 15. Crops and livestock support efficient meal batches.

Iron's Stonebread discovery is unchanged. Rumours and the next relevant recipe lead appear through the existing Guide/progress hints without listing every secret. Learning is one-time and saved. On load, existing mastery grants any already-earned discoveries quietly; no repeated work or reward claim is needed.

Farmhand harvesting gives 0.25 crop Guide credit per harvest; collecting gives 0.25 per unit of animal produce. These are the same events that award full manual Guide credit, at one quarter the rate. Personal Farming XP remains unchanged (none from worker actions). Growth does not separately award credit. A later manual collection sees zero stored output and therefore cannot re-credit it. Offline uses the same functions. Existing worker XP/output, automatic replanting and produce rules remain.

### Towers and companions

The eight existing towers keep their floors/prizes. Their boss profiles now differ in clock, special cadence, weaknesses and effects: fast ordinary hits in the Granary; slow cleaves in Mossbarrow; interrupted attacks in the Lighthouse; a long avalanche wind-up in Frostspire; lingering rites in Gloomfen; frost-softened quenching in Emberfall; rapid hits and ranged-softened peals in Skyreach; sustained eclipses in the Hollow Spire. Floor creatures use a tempered version of their tower's attack clock while retaining local creature weaknesses. Existing Freeze/Hex/Brace/Bash/Ward/normal-hit protection, food, weapons and companions do the work. Tower resistances use the gentler boss damage rules, with visible preparation advice. There is no exact-beast check or mandatory tower prize in progression.

Existing companion passives, ownership, bond XP/levels, evolution and eggs remain. Selected bond species gain existing behaviours:

- Hearthwolf: general-purpose striker; original critical passive and direct support.
- Bramble boar: Disruptor; enemy skips attack two, retains coin passive, 70% of prior direct support cadence budget.
- Duskwatch owl: Research partner; +10% research speed while assigned, retains XP passive, 70% direct support budget.
- Honeyclaw: Special guard; 20% less special damage while assigned, retains boss-damage passive (also applies to tower bosses), 65% direct support budget.

These support multipliers intentionally trade direct damage for utility; the old equal 17.5% support-DPS aspiration is not forced onto every role. Signatures such as Gobbo's Heckle and Frostling's Cold shoulder remain viable alternatives; other legacy bonuses differ. Only an owned, assigned companion applies a trick. Swapping clears the combat support clock, and cached effects are dirtied. Existing combat feedback shows the skipped attack; special protection logs once per fight rather than sending repeated notifications. Role, passive and trade-off appear in the existing comparison/ranch presentation.

## Verification

- Baseline engine: 121 checks; baseline browser seven-recommendation journey passed before changes.
- New `tests/connected-systems.cjs`: 15 checks covering standing migration/idempotence, legacy/new benefits, both shop gates, damage/carry limits, failed-save purchases/brewing, finite job output/wages, target snapshots/cancellation/bonus yields, offline/reload/insufficient wages, malformed saved targets, quarter farmhand progress/no personal XP/no double credit, new/old discoveries, Fortune roles, tower identities/progress and assigned-only companion behaviour. Online/offline worker and farmhand results match.
- New `tests/connected-ui.cjs`: actual restoration → supply preview → purchase, unmet gates, project → worker target → completion, discovery recipe selection, Fortune brewing, and 70 page/theme/viewport combinations across 1280×720, 1440×900, 1920×1080, 3440×1440 and 390×844. Later states are seeded fixtures, not claimed normal progression.
- Existing regression (121), art (8), desktop storage, UI rules, one-screen fit and World Life browser suites passed. Screenshots of the changed shop, worker and tower screens were inspected.
- `scripts/sim-connected.cjs` writes `docs/connected-balance.json`: eight tower bosses × alternative profiles, 72 deterministic trials per profile. This uses seeded region gear and 15 best unlocked meals (30 for the packed-reserve alternative) at the recorded combat level, not an end-to-end progression simulation. Damage, food, available counters and utility are assessed together. Successful fights report mean meals eaten, not health restored. The “legacy” column reconstructs the old boss clock/special/no-weakness profile under the same harness, not a replay of a historical player save.
- `scripts/sim-economy.cjs 24`, run against baseline 5f9fcc1 and this build, produced the same gathering-only trajectory: Hero 66, 622,131 coins at 24 hours. This bot neither restores buildings nor purchases the new supplies, so that result does not establish whole-game economic equivalence.
- Main boss ladder output matches baseline 5f9fcc1 exactly with the changed engine; main encounters retain their clocks/special rules. The stronger tower identities remain optional.

### Seeded tower preparation results

Win rates from 72 trials per cell. Brace uses 15 meals; packed uses 30 and no companion or discovered recipe. These are controlled examples, not guarantees.

| Town | Brace | Special guard | Stonebread + Brace | Available physical counter + Brace | Packed reserve + Brace |
|---|---:|---:|---:|---:|---:|
| willowbrook | 100% | 100% | 100% | 100% | 100% |
| mossbarrow | 100% | 100% | 100% | 100% | 100% |
| saltmere | 86% | 100% | 97% | 86% | 100% |
| ironpeak | 67% | 93% | 89% | 67% | 100% |
| gloomfen | 67% | 89% | 72% | 96% | 99% |
| emberfall | 32% | 72% | 69% | 32% | 97% |
| skyreach | 39% | 78% | 67% | 100% | 99% |
| hollow | 88% | 99% | 99% | 88% | 100% |

The physical-counter column switches only when the region offers a usable weapon matching a listed physical weakness; otherwise it retains the original weapon. Spell counters are explained in the game but are not covered by this matrix.

## Limits and follow-up

No human playtest, native Windows/macOS runtime check or Steam Cloud validation was performed. The connected balance fixtures do not cover every loadout, every floor or every companion level. Stock prices and research payback still need a human assessment of material acquisition and convenience. Finite targets are available for node-gathering workers; farmhands continue tending rather than promising a specific crop mix. Local supplies extend the existing shops; normal shelves intentionally still overlap in places so essential progression is not restoration-gated. No pushed or published build is implied.
