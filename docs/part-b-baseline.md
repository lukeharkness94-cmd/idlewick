# Part B baseline — Task 7

25 November 2026 · clean main `036ecef` · packaged browser build. These measurements came from scripts using isolated browser profiles. They are automated evidence. The original observation's save and random seed were unavailable.

## First hour

Run `MIN=60.5 EVIDENCE=first-hour.json node scripts/play-first-hour.cjs` against the preview. The optional JSON contains starting and ending states, 5/15/30/45/60 minute snapshots, action transitions, event counts by type and time window, and JavaScript errors. The walkthrough uses the existing Home click policy. It advances task time in 30-second blocks. Its choices still depend on the state at each block and on queued events.

The unchanged walkthrough reproduced the reported blocked route. It started at Hero 1, Combat 3, 25 coins and 10/10 HP. First Steps was claimed at 1 minute, Mabel's quest at 3.5. Mudling fighting began at 1.5 minutes and resumed after cooking. At 6 minutes Home changed to **Patrol the east farms**. The hero ended at Hero 10 and Combat 11, with 4,254 coins, Fishing 2, Woodcutting 3, Cooking 4, Melee 13 and Health 13. Goblin Menace was still active. The original observation ended with 4,562 coins. Both runs reproduced the progression and stall, while loot and exact timings varied.

The enhanced logging run found a second outcome. Patrol appeared at 6.5 minutes and remained unclicked while the Mudling fight ran. Food ran short, and the guidance routed back through fishing and cooking. At 11.5 minutes, between activities, the script clicked **Patrol the east farms**. Goblin Menace then reached 6/6 and was claimed at minute 12. The first boss was defeated before minute 19 and the script proceeded to Mossbarrow. The path the script samples can therefore recover if a separate stop or supply step intervenes.

| Minute | Original Hero / Combat / coins | Enhanced run Hero / Combat / coins |
| --- | --- | --- |
| 5 | 4 / 4 / 971 | 3 / 4 / 898 |
| 15 | 6 / 7 / 1,703 | 6 / 7 / 1,901 |
| 30 | 8 / 9 / 2,490 | 10 / 10 / 4,645 |
| 45 | 9 / 10 / 3,676 | 12 / 11 / 6,515 |
| 60 | 10 / 11 / 4,562 | 13 / 12 / 7,471 |
| 60.5 | 10 / 11 / 4,562 | 13 / 12 / 7,813 |

The enhanced run ended at 9/13 HP with 31 inventory entries. The observed run ended at 11/13 with 17. These are different routes and cannot be used to infer any balance change.

**Cause.** `js/story.js` emits `huntquest: goblin` when Orrin's quest is active and the hero has enough food. `scripts/play-first-hour.cjs` skips that action while any activity is running. The `js/hunting.js` handler starts a targeted Goblin fight when clicked. `js/data.js` requires six kills with the exact Goblin ID and `js/engine.js` reports the actual defeated ID. Mudling kills give no patrol credit. The tracker itself counted the Goblins as soon as the script acted on the correct guidance. Task 17 still owns the change to the legacy script's click policy.

## Notifications

| Event | Original observation | Reproduced stall | Enhanced run after route recovered |
| --- | ---: | ---: | ---: |
| Loot | 183 | 169 | 57 |
| Skill levels | 20 | 20 | 41 |
| Discoveries | 16 | 16 | 33 |
| Information | 11 | 12 | 65 |
| Modal openings | 9 | 9 | 15 |
| Hero levels | 9 | 9 | 12 |
| Quests | 8 | 8 | 18 |
| Achievements | 7 | 5 | 10 |
| Unlocks | 5 | 5 | 9 |
| Folk | 4 | 4 | 8 |
| Boss | 0 | 0 | 1 |
| **Total** | **272** | **257** | **269** |

| Minute window | Original total / loot | Reproduced stall total / loot | Enhanced total / loot |
| --- | --- | --- | --- |
| 0–5 | 55 / 7 | 53 / 6 | 48 / 5 |
| 5–15 | 49 / 30 | 45 / 27 | 73 / 20 |
| 15–30 | 57 / 46 | 53 / 44 | 75 / 14 |
| 30–60.5 | 111 / 100 | 106 / 92 | 73 / 18 |

In the stalled run, the modal sequence matched the original: Fishing guide, The broken bucket, Woodcutting guide, Cooking unlock, A place to start, Combat guide, Hero level, Farming unlock, Hero level. Six opened in the first five minutes. The two Hero reveals appeared at 8.1 and 49.1 minutes.

- `DQ.heroRevealWorthy` in `js/fx.js` promotes Hero levels with an unlock and every fifth level to the full reveal. Other Hero levels use the compact card. A reveal can open just after the level was earned when a dialog delayed it.
- `js/engine.js` emits one note per eligible rolled loot entry, plus notes for chest and rare-item finds. Ordinary rare/epic-tier rolls generate these individually and the bell records them before filtering. The note key may replace a visible or queued card, but it does not batch those events across kills. Long repeated fights therefore dominate the digest.

## Six-hour return and layout

Run `EVIDENCE=return-layout.json SHOT_DIR=/tmp/idlewick-shots node scripts/review-return-layout.cjs`. It creates a seeded save with active First Steps at 5 catches and 0 logs, starts shrimp fishing, backdates the save by six hours, reloads, and uses the real Continue action. It then inspects the rendered return card and its live guidance.

The fixture started at Hero 26 and Fishing 20. After returning it showed Hero 33 and Fishing 31, about 103,000 Fishing XP, 734 coins, 9,266 raw shrimp, three emeralds and three sapphires. It displayed three encounter choices. The original save’s exact XP, policies, and encounter history are unavailable, so the fixture does not reproduce its exact rewards. The returner counted six hours away as four hours of work. Fishing was still running. “Chop five logs” appeared because First Steps was actually active and unfinished in this fixture. `js/welcome.js` calls the live `DQ.journeyNext()` that Home uses. In the controlled comparison, marking that quest complete immediately changed the result to “Speak to Sergeant Orrin.” This reproduces the reported mismatch from a high-level save that never finished the quest. It cannot confirm the quest state stored in the original observation.

Current display order: hero/elapsed time/status, pending decisions, What next (claim if ready, running task or last task, current quest), More to do, completed research if present, earnings tiles, and Since you left with a journal link. The rate explanation after the earnings is conditional on exceeding the cap, which is why six hours shows the reduced total without the reason.

Fresh phone Combat, Shop, Fishing and Quests each measured 390px document width at 390px. Seeded Hero 52 / Combat 29 Saltmere Map, Combat, Quests and Projects measured 1440px at 1440px. Both the first-hour and return/layout runs recorded zero JavaScript page errors.

## Starter comparison

Run `EVIDENCE=starter-runs.json node scripts/review-opening.cjs`. This seeded policy uses real starter kits, Home's guidance, 30-second work blocks, uncached forecasts, actual costs and junk-only sales. It can execute `huntquest` directly, so its timings describe a different policy from the legacy click-only walk. No progression was granted.

| Starter | First Grubnash challenge | Travel to Mossbarrow | Hero / Combat at 120 min | Deaths by 120 min |
| --- | ---: | ---: | --- | ---: |
| Sword | 20.5 min | 22.5 min | 21 / 14 | 0 |
| Bow | 22.5 min | 23.5 min | 20 / 16 | 3 |
| Staff | 29 min | 32 min | 17 / 14 | 2 |

Staff was slowest to reach and clear the first boss in this seed. All three cleared Grubnash, reached Mossbarrow and had yet to challenge Old Tusk at 120 minutes. These timings are evidence for this policy and seed, not a balance change or a claim about human pacing.
