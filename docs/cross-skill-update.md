# Connected skills — 17 November 2026

Implements the approved skill-connections review through existing recipes, quests, research, workers and voyages. No parallel minigames, currencies, automatic save reset or new maintenance chores.

## Where to try the changes

| Connection | Where | Result |
|---|---|---|
| Ore + wood → runes | Crafting 8; discover quartz and normal logs first | 3 quartz + 4 logs → 16 runes, without consuming runes. Shops remain a fallback. |
| Crops → feed | Cooking → Farmhouse, levels 1/15 | Potato/onion or wheat → 12 feed. Quick feed converts at most five crops instead of the whole pantry. |
| Exploration → useful records | Exploration → Surveys, regional levels 1/8/15/25/35/45/55/65 | Bread/feathers → one kept chart per region; charts open repeatable local observations and known-material fieldwork focus. Existing roads/visits still matter. |
| Herbalism → preparation | Preparations, levels 1/15/25/35 | Bait, trap-care blend, calming draught and special-attack ward. Existing researched potions remain. |
| Timber → permanent facilities | Carpentry 5/22/35/55 | Survey frame, training frame, per-plot planting plans and precision-trap fitting jig. Kept once, no repair chore. |
| Meal → cargo | Cooking 20, packed fish supper | Optional 20-minute provision: 25% chance of an extra voyage cargo stack, no direct extra coins/XP. |
| Charts → voyages | Sailing 18/68 with Saltmere/Skyreach charts and boats | Optional Reed Inlet/Cloud Shoal; original voyages preserved. |
| Old enchantment → new equipment | Enchanting → Equipment | Move a higher enchantment rank to equipped gear for 75 coins + 5 runes per rank. Source loses its enchantment across every same-ID copy. |
| Evidence → advanced production | Scholarship | Quartz Guide evidence unlocks rune patterns; potato evidence unlocks field mixtures. Exact links select the research family/rank. |
| Restoration → commissions | Repaired forge, inn, Saltmere boathouse | Optional themed bronze-bar/provision batches. Essential ordinary recipes remain available. |
| Existing achievements → alternatives | Museum, surveys, merchant Guide, Saltmere tower, Enchanting guild | Alternative picnic/provision/inscription recipes; cosmetic Field curator/Mapmaker titles. No essential collection power gate. |
| Missing materials → finite work | Recipe input routes with eligible workers | Plan 1/5/10 batches of missing gatherable inputs, without automatic production or spending. |
| Quest → first connected example | Wren, “A map worth following”, after First Steps/Hero 4 | Rune batch + Willowbrook survey with exact Continue routes and inline side-quest rewards. |
| Equipment → combat preparation | Combat → lower-left equipped slots (or Equipment) | Eight slots, owned pack/bank gear, arrows and live supply estimates. Swapping preserves the current encounter. |

All output discovery, named missing inputs and exact routes remain. Selecting a route never starts work. Facilities/charts remember acquisition after sale/consumption. Offline tasks use the same gates; forecasts cannot refit/spend/claim.

Preparation effects: bait +8% extra catches; scent 20% less field-trap breakage (unchanged egg odds); calming draught +25% deliberate bond-training XP; ward 10% less boss/tower special damage. Each lasts 20 minutes. Training frame adds 20% training XP without changing cooldown. Survey frame makes surveys 25% faster. Jig or existing home toolrack enables 1 gloomwood + 4 steel bars + 4 string → 4 precision traps; ordinary recipes remain.

Irrigation saves each plot's next crop, spends its seeds only when planting and leaves it empty when seeds run out. It preserves farmhand quarter-Guide/no-personal-XP rules. It does not buy seeds or restart after shortages.

## Long-session interface

Same-page exact routes redraw before focusing. Internal lists retain positions through redraws/navigation; existing tabs, filters and search retain in-session choices. This is not cross-device UI synchronisation. Item actions name equipment/banking destinations; abilities say Slot/Unslot; training labels identify the action. UI purchases/claims ignore accidental second clicks within 350ms, including shelf redraws. Engine ownership/quest-state and failed-save rollback remain authoritative. Erase-hero confirmation remains; routine actions have no new confirmation.

Static tips support keyboard focus/Escape; touch-hold shows information without triggering the held action, and dragging cancels the hold. Essential requirement reasons remain visible. Existing independent repeated-task/ambience/music controls are reused and explained.

Restored sites gain inhabitants, working tables, supplies or planting details, retaining regional scenery/architecture/sound and existing acknowledgements. Unique equipment leads with its effect and build use; weapon descriptions show rhythm, damage type and base interval. Comparisons preserve actual equipped differences and both special effects. Total-stat arrows are labelled as totals rather than complete verdicts. Tower rewards emphasise exceptional properties; first unique finds link to Compare equipment.

## Evidence and limitations

19 cross-skill integration checks cover actual production, permanent records, offline parity, save rollback, seed/worker conservation, real special damage/cargo, refits and continuing fights. Packaged crosslinks-ui exercises Wren's quest, source/travel routes, all new workspaces and 32 theme/layout cases. Regression (122), pixel art (8), desktop storage, Hunting UI (40 layouts), UI fit and World Life checks pass. long-session-ui covers the new interaction details; see HANDOFF for final verification.

Controlled figures in crosslinks-balance.json: rune production takes 4 seconds, about 19.4 seconds including upstream gathering in the granted fixture. Cooked feed yields 12 versus quick conversion's 9 for the same vegetables or 6 for wheat. In 36 paired ten-minute voyage trials, mean feather cargo rose from 8.95 to 11.23 per voyage with provisions; each cohort completed 1,188 voyages. These are simulations, not normal fresh-player pacing, guaranteed yields or enjoyment evidence.

Human testing must still establish opening pacing, long-term optional preparation value and late-game variety. No claim of a review score, Steam Cloud activation or native Windows/Mac validation. No commit/push/publication.
