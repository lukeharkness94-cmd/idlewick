# Connected experience review — 19 November 2026

Baseline: main `10dc23c`, committed 19 November 2026 at 07:04:47 GMT. Scope: all 21 skills, 133 quests, 463 item definitions, the eight-region journey, preparation, shops, restoration, discoveries, collections, offline return and save continuity. The subsequent player notes are part of this same review.

This is a code, browser and scripted-progression review, not a human playtest. Rendering a late-game fixture does not demonstrate earning it, and a scripted journey does not establish enjoyment or retention.

## Findings and changes

| Player-facing problem | Result |
|---|---|
| Bronze-bar information could be clipped beneath its scene | The selected activity reserves space for its caption; actual ingredients lead the detail before secondary use notes. Original art and readable type remain. |
| Locked field charts replaced their entire detail with a lock | Locked previews retain named inputs, counts and source routes. Unknown outputs remain concealed. |
| Delivery quests could conceal another skill requirement | New quest eligibility includes the actual production/gathering prerequisites behind missing deliveries and recipe inputs. Teacher quests remain exempt from requiring their own taught skill. Accepted quest progress is preserved. |
| Found recipes were hard to find and looked like level unlocks | Discovered recipes have their own shelf and book marker. Known patterns retain their identity while missing materials/levels still block production. Found patterns are removed from ordinary level-unlock announcements. First discovery queues a short original-art reveal with an exact recipe route; quiet/offline discoveries and notification settings remain quiet. |
| Staff supplies depended on repeated purchases or Crafting 8 / quartz | **Magic → Runes** offers a Magic 1 copper batch: 2 copper ore + 2 logs → 16 runes, 6 base XP, 4 seconds. Magic 10 introduces 3 quartz + 4 logs → 40 runes. Existing `craft_runes` ID and completion event remain, so older mastery and quest targets still work. Advanced Enchanting/Scholarship batches remain optional. |
| Exhausted arrows/runes left Home saying to train | Supply guidance equips owned ammunition, selects real affordable stock, or follows the mining introduction and gathers rune inputs. Navigation alone never buys or spends. Useful larger batches are preferred; low-money reminders do not trap players in one-item purchases. Later-region ammunition advice checks local stock. |
| Random opportunities felt like small administrative cards | Opening an opportunity presents a full scene with explicit choices. The real atomic outcome replaces the choice in that scene. Pending opportunities can still wait; closing does not choose, lose or expire them. Return summaries route into the scene rather than offering a competing inline decision UI. |
| Combat showed neither DPS nor a clear damage-growth explanation | The training area shows estimated ordinary DPS, hit chance and maximum hit against the selected creature. Its tooltip states exclusions. Relevant level notices show equipped accuracy/max-hit before and after, including when rounding prevents an immediate max-hit increase. |
| Shop shortcuts floated within skill information | Shortcuts occupy consistent header positions; they do not float among descriptive paragraphs. |
| Early Farming felt slow | Potato, onion, cabbage and wheat planting/harvest XP receive a 25% increase (rounded per action). Timers, yields, seed prices, workers and later crop rewards are unchanged. No retroactive XP grant. |
| Tempered/fine bronze weapons shared identical material requirements | Fine bridge weapons now require more of their tier's bar than the tempered bridge. Shop equipment is ordered by required level, then price/name within that level. Different styles and sidegrades still require comparison. |
| Early material upgrades depended on Smithing's Hero 12 introduction | **The Cold Forge moves to Hero 4**, after the existing free-pickaxe quest. Copper, tin and timber still have to be earned; the quest, material costs and crafting actions remain. Existing unlocked Smithing is retained. |
| Each encounter/level tick rebuilt the combat page and restarted bars | Encounter, quest and level refreshes update the foe/header/progress in place. Training bars, the arena and equipped-gear controls retain their DOM identity. Deferred refreshes also check the current page, preventing a prior activity's timer from rebuilding Combat. |
| Magic kills appeared before projectiles arrived | Visual health/encounter changes and the death exit wait for the existing attack-impact time. Simulation timing, rewards, damage and offline outcomes are unchanged; reduced motion skips the delay. |
| Melee level notices appeared while using Magic | Ordinary Magic attacks were verified to award Magic, not Melee. Quest rewards can independently award Melee; those level notices now identify the quest rather than implying the current staff trained it. |
| Some creatures faced away | The revised chicken is drawn facing right, but an old exception treated it as left-facing. Battle rendering now mirrors the canonical sprite consistently, including unknown previews, without revealing their names. An explicit art-facing override is available for future left-facing drawings. |
| Standing was repeated on individual buildings | One standing bar lives in the village map header. Building cards retain their actual supply benefit and costs; repeated standing badges are removed. |
| Activity Guide bars stopped appearing/updating | Guide fills exist from the first action and update their percentages, pips and accessible descriptions in place. They no longer depend on a later page rebuild. |
| Town projects lacked an introduction | First entry offers a brief, once-only explanation of contributions, restoration, standing and pinning, through the existing tutorial settings/reset behavior. |
| Feathers pointed back to observations needing a feather-funded chart | Direct obtainable sources take priority over incidental observation outputs. Ingredient hints use the same resolver as their actual route. Crop/livestock hints retain their true levels. |
| Preparation said a weapon was affordable using only its coin price | Advice totals coins and actual shop materials, checks every missing material route, and keeps usable owned counters ahead of blocked purchases. |
| Later boss guidance skipped the quest introducing it | The selected boss goal follows the existing prerequisite quest chain: accept, prepare, complete objectives, claim, then the boss quest. A blocked skill routes to its actual introduction/activity. Ready boss rewards remain claimable after the region opens. |
| An inn contribution could be requested twice | Advice uses the remaining contribution, rather than asking for the original twelve shrimp after some were delivered. |

## System connections reviewed

| Skill/system | First purpose and ongoing connection | Review conclusion |
|---|---|---|
| Fishing | Starter food → Cooking; surveys, suppers and voyage supplies later | Strong early purpose. Repeated food preparation can still dominate a combat-only journey. |
| Woodcutting | Timber for restoration; flax for string; later woodwork, traps and tools | Verified an earned flax → string → traps branch. No extra material needed. |
| Mining | Free pickaxe route → copper/tin → bars and early runes | Bootstrap remains ore-free. Earlier Smithing makes the output useful promptly. |
| Cooking | First caught species → meals for preparation; found recipes and farm dishes | Requirements, discovery and recipe identity are now distinguishable. Burn probabilities still need human pacing feedback. |
| Smithing | Hero 4 introduction → bronze bars, tools, weapons and armour | Corrected the early supply gate. Later bars remain tied to mining progression. |
| Crafting | Hettie's Willowbrook flax introduction → string, traps, equipment | Existing introduction can be earned before the first boss; no Mossbarrow dependence. |
| Magic | Starting staff, spells and now early rune inscription; later Alchemy | Self-supply now belongs on the skill page. Higher-tier spell costs remain meaningful and need sustained-play validation. |
| Melee | Starting sword, armour/food preparation, weapon families and counters | Gear costs and counter advice are truthful; damage growth is visible. |
| Ranged | Starting bow/arrows, crafted arrows, local shop stock, counters | Supply interruption now has an exact route rather than a false training instruction. |
| Defence | Shared defensive training, damage reduction and abilities | Training controls stay stable; detailed stats remain secondary. |
| Health | Progress from fights, food capacity and sustainability | Combat-only tests distinguish this from the selected offensive skill. |
| Farming | Seeds and crop choice, food/feed, Herbalism, restoration | Modest early XP change; field/pen layout, tending and bounded pages retained. |
| Thieving | Regional teacher, materials/coins and optional plans | Delivery prerequisites now participate in quest readiness. Non-theft alternatives for optional plans remain. |
| Hunting | Three crafted traps plus Combat 8 → field materials; later trap grades | Existing trap wear/material focus and offline integration tests retained. No additional clicking minigame. |
| Beastmastery | Crafted preparation plus Combat 10 → curated companions, bonds/jobs | Existing roster, deliberate training and assigned-only bonuses remain. No mass generic-creature collecting system introduced. |
| Exploration | Gathering and Mossbarrow → regional charts, observations and routes | Survey inputs are visible; feather self-reference removed. One-time charts continue to count from acquisition history. |
| Scholarship | Hero 12 and studied creatures → deliberate research and advanced recipes | Existing family/rank structure retained. Not every long research wait has been validated for enjoyment. |
| Herbalism | Harvest/Farming milestones → bait, scent, calming preparations and wards | Cross-skill uses remain real rather than new passive counters. Resource prerequisites participate in new quest offers. |
| Enchanting | Craft/smith action milestones → equipment effects, refits and study batches | Existing study/commission distinction retained; not renamed into a separate Runework skill. |
| Carpentry | Owned bronze handsaw → frames, fittings and boats | Smithing availability improves the first saw's supply chain; no alternate scheduling system. |
| Sailing | Saltmere + skiff → charted routes, cargo, useful provisions | Existing return times, cargo rules and crafted preparation retained. Late voyage pacing is fixture/integration coverage, not an earned two-hour journey. |
| Village/restoration | Earned inputs → visible repairs, standing and supply access | First-use explanation and one village-level standing display; existing scenes/voices retained. |
| Quests/story | Main conversations, side stories, objectives and rewards | No new blanket cutscenes. Offer readiness now considers input chains; regional next steps follow existing story prerequisites. |
| Field guide/towers | Optional understanding, counters, collections and exclusive prizes | Existing rewards and earned-only recovery preserved. No boss-exclusive items added to ordinary shops. |
| Shop/inventory/bank | Stable shelves, real costs, comparisons and exact destinations | Ordered equipment, distinct bridge costs and actual material-aware guidance. Existing conservation/save-failure tests retained. |
| Offline/returns/saves | Actual work, optional persistent opportunities and atomic decisions | Existing cap/schema/storage bridge retained. Event presentation changes do not invent rewards or expire choices. |

## Evidence and reproducibility

- `scripts/review-opening.cjs` loads the complete standalone browser build for fresh Sword/Bow/Staff heroes, follows Home guidance for up to 120 simulated minutes, uses real resource costs and uncached battle forecasts, and sells junk only. It excludes reading/navigation time, disables tutorial/story interruptions for the harness and grants no XP/items/unlocks. The seed is reset immediately before the synchronous simulation. Forecast draws and changed routes affect subsequent randomness, so these are illustrative policy runs, not statistically controlled balance estimates.
- A baseline can be supplied through `BASELINE=/path/to/original-standalone.html EVIDENCE=/tmp/before.json`. This is an isolated test artifact, never another delivery checkout. The pre-change bow/staff policy runs exhausted ammunition/runes and kept receiving training advice at Combat 6. That is a guidance failure, not proof players could not find a shop themselves.
- `scripts/review-preparation.cjs` takes a fresh Sword hero through First Steps, Hettie's flax/string introduction, three crafted traps, the well restoration and the earned mining pick. Seed 23; no granted progression. The initial review run completed that branch in about seven minutes of simulated work, excluding reading time. It does not claim Hunting itself is unlocked: its Combat 8 requirement remains.
- `tests/opening-routes-ui.cjs` scans all 463 item sources at fresh and advanced fixture states, checks concrete restocking/material advice and follows the regional quest chain. Advanced fixtures are explicitly granted test progress.
- `tests/player-feedback-ui.cjs` reproduces the player-reported requirement, recipe, rune, combat, Guide, village and encounter problems in the rebuilt game. It checks DOM identity/position after page-entry motion settles. Screenshots from this suite use granted system-specific progress and are presentation fixtures, not normal progression evidence.
- `scripts/sim-economy.cjs 24` remains a supply/coin model that grants region access at Hero checkpoints and sells without spending. Its reported 24-hour purse is not a forecast of a normal combat playthrough. It does not measure Farming enjoyment or the new rune route by itself.

## What still needs to be earned in playtesting

1. The stretch between Grubnash and Old Tusk remains much more repetitive for a player who follows only the boss objective. The regional story now gives that work context and rewards, but it is not evidence that the entire stretch is fun. Observe whether players discover useful preparation/side pursuits voluntarily before adding more systems or blanket XP acceleration.
2. Test the complete staff loop with real players: does gathering and batching runes feel like preparation, or a recurring chore? The shop is a fallback, not the intended only source. Do not make late spell costs trivial based on a single short run.
3. Compare the modest crop XP change against an unchanged build with a farmer who tends multiple plots and a casual player who checks in occasionally. Later Farming levels have not been declared solved.
4. Full-screen opportunities are explicitly requested, but test whether frequent returns create too many interruptions. Keep the ability to defer, preserve pending choices and avoid risk before an explicit decision.
5. Test whether DPS/accuracy explanations help players choose gear without implying one universal best weapon. Special properties, counters and abilities deliberately remain outside the ordinary-DPS estimate.
6. Validate narrative memory, character attachment, meaningful stopping points, keyboard/touch use and longer-term fatigue with human enthusiasts and sceptics. No participants, quotes, enjoyment scores or retention results were fabricated.

No Steam Cloud activation or native Windows/macOS readiness is claimed by this browser review.

### Recorded opening results

Illustrative Home-guided runs, not target completion promises; see `opening-review-evidence.json` for the compact source data. First-boss minutes include actual simulated preparation but exclude reading/menu time.

| Starter | Before | After | State after 120 simulated minutes |
|---|---|---|---|
| Sword | First boss reward at 25.5 minutes | 23.5 minutes | Hero 20, Combat 14; regional prerequisite completed and Old Tusk quest accepted |
| Bow | Stopped following guidance at 20 minutes with no arrows | First boss reward at 21 minutes; continued | Hero 20, Combat 16; regional prerequisite completed and Old Tusk quest accepted |
| Staff | Stopped following guidance at 22 minutes with no runes | First boss reward at 33.5 minutes; earned pickaxe and made runes | Hero 17, Combat 14; 193 mining actions, 89 crafting events; regional prerequisite completed |

The staff opening remains longer than the earlier 15–25 minute aspiration. This pass makes the route functional and self-supplied; it does not declare that pacing ideal. All three final policy runs reached two simulated hours without the original guidance stall. The staff policy bought 101 items, rather than relying on repeated purchases throughout the run. Regional guidance also points at usable, already-owned improvements before more grinding; it does not automatically change equipment or switch the chosen offensive style.

### Economy and validation notes

The basic rune batch has base input value 10 and output value 16; quartz has input value 20 and output value 40. Neither ore nor logs are ordinary shop inputs, so these are earned gathering/production routes rather than an immediate buy-input/sell-output loop. Their four-second inscription time also excludes gathering. The first two-hour staff run consumed real inputs and costs. These checks support a functional early alternative to buying every rune; they do not prove the optimal long-term sell/craft strategy.

Final checks: regression (122), quest progression (7 groups/all 133 definitions), crosslinks (19), connected systems (15), hunting/crafting/shop (16), desktop storage, pixel art (8), full ui-fit/ui-current/ui-rules, crosslinks browser interactions (32 layout/theme cases), all-source opening routes and the 12 player-feedback scenario groups. The latter includes an actual discovered-recipe reveal, live projectile-before-exit observation and the Magic Runes workspace at 1280×720 and 390×844 in both themes. Current screenshots were inspected; their granted fixture progress is not opening-pacing evidence.
