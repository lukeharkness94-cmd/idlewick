# Offline progression ceiling (Part C Task 20)

## Before

How much an activity earned while you were away was decided only by time. `DQ.simulate` (js/engine.js) ran
`DQ.advanceTime` for `DQ.offlineEff(gap)`, which is the gap capped at 24 hours, at full rate. Every completed action paid
its normal XP and items whatever the skill's level. No check compared a skill with the content the player had reached.

## The ceiling (js/offline_ceiling.js)

The ceiling is a second, separate limit. Counted time is applied first; the ceiling comes second. It applies only while
catching up on time away (a report-mode `DQ.simulate`). It never applies to forecasts or live play.

An activity stops when its skill reaches the highest level requirement of the content the player has unlocked. Stopping
uses the existing `DQ.stopAct`, which means:

- XP and items from that activity stop together;
- the next queued task still starts;
- other skills are not affected;
- nothing earned is removed.

Welcome Back shows one line in place of the usual stop reason, for example: "Fishing stopped at level 10. That is as far
as your current quests and regions reach. Beat a boss or unlock a region to push it further."

| Skill | Gate already tracked by the code | Fresh hero (Willowbrook only) |
| --- | --- | --- |
| Fishing, Woodcutting, Mining, Thieving | Highest `D.NODES` level among towns reached | 10 / 15 / 10 / 10 |
| Hunting | Highest Hunting level (`m.hl`) on the one hunting ground (26 Nov 2026: the ground no longer belongs to towns, so this is 98 whatever the region; the tier kit is the real gate) | the top ground animal |
| Melee, Ranged, Magic, Defence, Health | Highest creature combat level among towns reached (areas, challenges, bosses; towers excluded) | Willowbrook's top creature |

## Fixture results (tests/offline-ceiling.cjs, granted browser fixture)

The fixture is a fresh hero with about 2 minutes of play, fishing shrimp, with First Steps accepted but not finished.

| Absence | Ceiling | Hero | Fishing | Fishing XP | Raw shrimp |
| --- | --- | ---: | ---: | ---: | ---: |
| 6 h | off (before) | 30 | 33 | 145,673 | 14,062 |
| 24 h | off (before) | 45 | 45 | 668,252 | 57,928 |
| 6 h | on | 6 | 10 | 2,248 | 498 |
| 24 h | on | 6 | 10 | 2,241 | 498 |
| 6 h, every region reached (counter-fixture) | on, ceiling 98 | 30 | 33 | 145,674 | 14,058 |
| 10 min | on, not reached | 5 | 8 | 1,590 | 388 |

## Unmapped skills (for the owner's decision)

These skills have no boss, region or main-quest gate in the code that maps onto them cleanly, so they are not capped.
Most of them consume materials while away, so their earnings are already bounded by what the player carries.

| Skill | Proposed formula |
| --- | --- |
| Cooking, Smithing, Crafting, Carpentry, Herbalism, Enchanting, Magic (runes, alchemy) | Highest level among recipes whose ingredients the player has discovered (`DQ.recipeDiscovery` returns nothing). This is an existing gate, but it tracks knowledge, not region progress. |
| Farming | Highest crop or animal level sold in shops of reached towns. |
| Beastmastery, Sailing, Exploration, Scholarship | Highest requirement among the voyages, studies, companions or survey sites available in reached towns. |

Until the owner decides, these skills keep the time-only rule.
