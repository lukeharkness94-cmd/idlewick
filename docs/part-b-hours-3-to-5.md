# Part B · Hours three to five pacing map

This is a design map for approval. The 30-minute bands are intended reward windows, with route alternatives determined by the player's actual progress. They are not measured player milestones or extra campaign requirements. Task 7 reached Mossbarrow at 22.5 to 32 minutes across three fresh starter runs, and none of those policies challenged Old Tusk by minute 120. [Opening baseline](part-b-baseline.md)

## Proposed beats

| Elapsed session | Capability or payoff | Road gate | Existing restoration piece | Skills to combine |
| --- | --- | --- | --- | --- |
| 2:00–2:30 | Feed and equip the Mossbarrow patrol, with clear credit against Tusks and Trouble | Grubnash | Repair the market shelter | Woodcutting supplies timber, Farming supplies potatoes, Cooking supplies the patrol. |
| 2:30–3:00 | Pick one practical Old Tusk preparation and earn an intermediate quarry, challenge or Field guide result | Grubnash | Continue the market shelter, or clear the mill pond when its inputs are reachable | Combat tests the loadout, Cooking keeps it supplied, and Crafting gives a route to traps or spare bow components. |
| 3:00–3:30 | See Old Tusk's counter, current max hit and food check. Attempt him when ready, or finish a regional reward first | Old Tusk opens the next road | Finish the first affordable Mossbarrow project | Combat, Cooking and the player's chosen supply skill, such as Fishing or Crafting. |
| 3:30–4:00 | Arriving in Saltmere opens the jetty and a harbour task. If still in Mossbarrow, keep the local payoff available | Old Tusk for Saltmere | Rebuild the fishing jetty if the needed fish and oak are reachable | Fishing supplies the catch, Woodcutting supplies the timber, Cooking helps prepare the harbour patrol. |
| 4:00–4:30 | Shore work and a Field guide counter lead into the next boss preparation | Old Tusk | Complete the jetty or contribute to the drying nets | Fishing, Crafting and Combat. |
| 4:30–5:00 | Choose a harbour preparation or equipment improvement. Barnacle is an optional stage-ending attempt when ready | Barnacle opens Ironpeak | Mend the drying nets, or contribute to the smokehouse if the supplies are available | Woodcutting, Cooking and the chosen equipment or supply skill. |

## Gaps to decide on

1. **Mossbarrow between its first patrol and Old Tusk.** The existing Home path gives the boss, food and training most of the attention. The market, optional creature research and the side quests are available through their own pages. Bring one affordable off-ramp into the current journey and make it easy to return to the main track. The map proposes starting with the market and a food-and-gear preparation involving multiple skills.
2. **Saltmere entry and the next useful goal.** Existing projects already change the scenery and improve production. A fresh arrival should get one realistic action toward the jetty or an accessible alternative based on actual unlocks and inventory. Keep higher-tier landmark projects for later.
3. **Boss preparation.** Give each boss a concise counter, effective max hit and carried healing readout, with an estimated food warning using existing forecast logic. Keep boss stats unchanged.

The gap threshold in the brief is over 10 minutes without affordable progress for a genuine main-path wall and over 60 minutes between meaningful reward beats. Count those separately. A long period of fighting with affordable side routes is a pacing gap. A repeatable route that cannot make progress with earned gear and supplies requires a reachability fix.

## Approved work and control run

In a five-hour no-grant Sword run (seed 19), Grubnash fell at 21½ minutes, the Mossbarrow patrol finished at 27½ minutes and Scholarship unlocked at 46½ minutes. On reaching Combat 18 at roughly 106 minutes the route equipped a bow and bought arrows. From minute 107 until the five-hour cut-off, the primary Home recommendation sent the hero to the same combat page to read an incompatible ability warning. The hero had no mission change or later reward beat, and Old Tusk was never attempted. A warning about an optional ability is now shown in preparation details while Home chooses a route that can change the player's state.

The approved market project uses 12 logs, 6 flax and 100 coins. Saltmere's jetty uses 16 logs, 12 raw sardines and 200 coins. Crops and oak previously delivered to those projects transfer to the new ingredient at equivalent progress, rounded up within the new limit. The existing regional patrols combine Woodcutting and Combat, with Cooking also included for Wynn. Boss preparation shows the counter type, current effective max hit and a rough carried-food check. The detailed forecast remains available for a tailored estimate.

## No-grant browser replay

| Milestone | Control | Revised route with optional restoration |
| --- | ---: | ---: |
| First Steps turned in | 2 min | 2 min |
| Grubnash defeated | 21½ min | 21½ min |
| Tusks and Trouble turned in | 27½ min | 28 min |
| Market shelter restored | — | 29 min |
| Scholarship unlocked | 46½ min | 50½ min |
| Old Tusk defeated | Not attempted within five hours | 133 min |
| Saltmere jetty restored | — | 135 min |

The replay explicitly took the available restoration detours and did not grant resources, levels, unlocks or bosses. The stretch from Scholarship to Old Tusk still took 82½ minutes on this policy. It fell outside the requested 60-minute reward window. The revised hero reached four crab victories before running out of bronze arrows. Saltmere now sells the same standard bronze arrows as the first two towns. The focused patrol test checks the exact resupply route.

Reproduce the restoration policy with `RESTORE=1 MIN=240 KITS=sword EVIDENCE=/tmp/idlewick-regional.json node scripts/review-opening.cjs` against the packaged build. Progression times exclude menu reading and are neither a player average nor a promise.
