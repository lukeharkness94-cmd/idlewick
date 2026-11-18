# Skill and system connections — 17 November 2026

**Implementation follow-up:** the approved connections are now implemented; see [cross-skill-update.md](cross-skill-update.md) for shipped rules, examples and evidence. The assessment below preserves the pre-change baseline, not the current catalogue.

Design review of the current base game, including the implemented tool/weapon ladder. Recommendations below are **not new live rules**. This supersedes stale baseline statements in skill-minigames-proposal.md (fieldwork has already moved to Hunting, crafted traps exist, guilds are optional quests, and finite workers already work).

## Findings from the current implementation

- The 21 skills already have a strong resource spine: Mining → Smithing → tools/weapons; Woodcutting → Carpentry → furniture/boats; Fishing/Farming → Cooking → combat and companion training; Crafting → traps → Hunting/Beastmastery. Preserve these.
- The live recipe catalogue has **no recipe outputting runes or animal feed**. These are gaps in player-made supply, not claims that the items are unobtainable: shops, drops and existing local supplies provide alternatives. Arrows already have metal-backed batch recipes; do not invent that link again.
- Exploration currently earns XP for first creature victories and first town visits and presents a regional completion summary. It has no comparable active production/preparation loop. First-kill XP also ties creature discovery to fighting rather than observation.
- Herbalism's five current potions are unlocked by Scholarship research; successful brewing grants a flat 12 Herbalism XP. Its own levels currently have less influence over which useful preparation the player can make than its research prerequisites do. It should not become a second compulsory research grind.
- Secondary woods are thinly used. For example, birch has no ordinary recipe consumer in the loaded catalogue, although it has quest/project uses. Ash and gloomwood each feed one shield recipe and no ordinary project. These are targeted examples, not proof the materials are completely useless. A low recipe count is not inherently bad: copper's single smelting route fans out into many bronze products.
- Many fish feed their own cooked version. That remains a legitimate useful chain; every fish does not need five direct recipe consumers. Extend meal roles where that creates a reason to choose, rather than padding recipes.
- Enchantments are attached to item IDs; the more frequent weapon ladder makes investment in a soon-replaced weapon a concern. Any reclaim/refit feature must respect this existing storage model and remove the source enchantment before giving transfer value.
- Existing connections that must not be pitched as new: charcoal from wood Guide progress; shrimp healing broth; wheat-and-milk bread batches; cooked-food companion training; farmhand Guide credit; finite worker targets; restored-building supply shelves; role-specific companions and distinct tower counters.

## Every skill: useful next connection

| Skill | Existing role | Recommended addition or refinement |
|---|---|---|
| Fishing | Fish for meals; Guide discoveries; Sailing speed support | A few optional bait recipes use common farm produce or herbs to bias known catches. Default fishing remains productive and reliable. No constant bait swapping. |
| Woodcutting | Logs for handles, shields, charcoal, planks and restoration | Give underused woods identifiable jobs: birch for light frames/tackle, ash for handles/bow components, selected late woods for specialist fittings. Reuse outputs before creating resin/bark inventories. |
| Mining | Metals for equipment; minerals for skill charms; gems | Existing quartz can support rune production; selected existing minerals can support a small number of workbench/ward recipes. No extra ore tiers required. |
| Thieving | Coins plus target-specific extra loot | Optional stolen plans, route notes or supply caches can reveal alternative recipes or shortcuts. Provide legitimate Exploration/Scholarship alternatives; do not force theft to restore the village. |
| Farming | Crops, livestock, ingredients and Guide progress | Make batch animal feed from existing grain/vegetables. Add permanent irrigation/feed-storage improvements using Carpentry and Smithing, rather than daily maintenance. |
| Cooking | Healing food, discovered buff recipes, companion training | Extend existing meal/buff infrastructure with a small selection of journey rations and useful specialist meals. Fish, crops and livestock should combine. Keep ordinary healing meals viable. |
| Smithing | All tool families and ordinary melee equipment | Forge durable hinges, reels, springs and reinforced fittings for farm/workshop/boat improvements where a real new capability needs them. Avoid mandatory component chains on every existing recipe. |
| Crafting | Traps, ammunition, jewellery, ranged/magic assembly | Produce batch bait, field kits and basic rune supplies using existing materials. Keep metal-backed arrows and crafted traps; do not create parallel ammunition or trap systems. |
| Magic | Staff combat and alchemy | Give players a self-made rune supply, shared with Enchanting, alongside the reliable shop. Start with the existing generic rune, not six new elemental currencies. |
| Scholarship | Permanent studies, potion knowledge and repeatable notes | Optional practical studies can use existing Guide records plus samples to reveal bait, fitting or ration recipes. Guide evidence is a requirement, not a new spendable research-token inventory. |
| Melee | Automatic weapon-family combat/counters | Let existing crafted weapons, meals, known weaknesses and companion roles produce clearly explained alternatives. No extra melee crafting screen or repeated attack prompts. |
| Defence | Mitigation and protective abilities | Connect optional wards/remedies to the existing readable enemy specials; preserve equipment, food and ability alternatives. No mandatory ward for each boss. |
| Ranged | Bows and metal-backed arrows | Strengthen production planning: exact arrow batch targets and a clear reserve estimate before long fights. Special arrows can wait until ordinary supply is comfortable and existing counters prove insufficient. |
| Health | Endurance and recovery | Cooking/remedies should cover different situations through existing food/auto-eat/emergency-heal rules. Do not turn Health into a separate management minigame. |
| Hunting | Automatic field traps, optional known-material focus, quarry | Optional bait can affect haul composition or trap durability, rather than add a second capture gamble. Already-crafted precision/padded/Rune traps are the foundation. |
| Exploration | Regional visits/first discoveries | Add finite survey projects: select an eligible place, prepare once, observe one real task and record a chart. Charts open optional fishing spots, fieldwork leads, Sailing destinations or story discoveries. They do not replace boss road gates. |
| Herbalism | Five potions plus existing healing/haste/might/fortune/scholar effects | Add optional bait blends, calming preparations or wards using crops and known wild ingredients. Make several recipes respond to Herbalism levels themselves; keep Scholarship as advanced knowledge rather than a duplicate gate for every bottle. |
| Enchanting | Five rune/gem ranks on equipment | Offer a carefully costed refit/reclaim when replacing gear. Later optional patterns can trade an offensive benefit for protection or utility; avoid stacking them on top of every current bonus. |
| Carpentry | Planks, boats, furniture and some tool/trap inputs | Build permanent farm irrigation/feed storage, a useful field-kit frame and workshop fittings. Each should provide a visible lasting function, not another generic percentage. |
| Sailing | Five boat tiers and nine voyages with mixed cargo | Add optional chart-led destinations and a small set of durable cargo/provision choices. Reuse existing voyages and boats; supplies should improve a run, not be required before every departure. |
| Beastmastery | Egg expeditions, cooked-food training, combat bonds and assigned roles | Let crafted training equipment or optional calming preparations offer noncombat ways to develop companions. Respect the existing curated roster, 10-level bonds, no decay and guaranteed capture-track fallback. |

## Recommended order

1. **Complete player-made supplies:** rune production and farm feed, using existing resources/skills. Keep shops as fallback. Model starter stock duration, consumption, output per batch and gold/time costs together; never make a material-backed rune recipe cost runes to unlock itself.
2. **Give Exploration an output:** a finite regional survey → practical chart/lead → a new optional activity using the current task/quest/journal infrastructure. Pair the first example with an existing Willowbrook/Mossbarrow thread. Chart access must not depend on a destination that requires that same chart.
3. **Give Herbalism its own useful progression:** a few level-earned preparation recipes with distinct purposes. Clarify the Herb skill versus the Scholarship research also named Herbalism. Avoid requiring a potion before the player can unlock its own production.
4. **Make Farming/Carpentry a lasting loop:** grain → batch feed; timber/metal → permanent irrigation or storage; output → Cooking/training. No crop spoilage, animal neglect penalty or repair chore.
5. **Protect investment in equipment:** refit/reclaim under Enchanting before adding many more temporary gear sinks. Test duplicate copies, source removal, same-ID items, sell/rebuy, save failure and offline state; no value duplication or automatic spending.
6. **Add selective depth:** known-target bait, mixed meals, optional Thieving plans and tower/museum/guild leads after the first five prove useful. Do not introduce everything at once.

## Other systems

- **Village restoration:** keep supplies/standing and visible scene changes. A forge, kitchen or boathouse can offer a themed optional commission or permanent facility upgrade. Essential crafting must not require repairing a building that needs its own locked product.
- **Housing:** workshop/farm improvements can live in existing furniture/project interfaces. Do not introduce a second town-building system or another workstation currency.
- **Workers:** keep finite output targets. A rune/arrow/feed plan may calculate missing gatherable inputs and link to eligible workers; it must not silently auto-smelt/craft or spend their output.
- **Bestiary/Guide:** let understanding reveal optional practical recipes and preparation advice. Reward records already earned; never require rare encounter completion before ordinary advancement.
- **Museum/collections:** exhibit completion can reveal a rumour, variant recipe or cosmetic. Preserve optional status; no mandatory museum power for combat.
- **Towers:** memorable specialist prizes and optional recipe leads are appropriate. Core rune supply, stronger basic traps, regional roads and normal equipment must remain obtainable without tower completion.
- **Mastery guilds:** optional signature projects can combine a mastered skill with one or two neighbours. Titles/cosmetics and a convenient alternative recipe are safer than exclusive essential power at level 99.
- **Quests/story:** introduce each connection through a short practical request and visible result, using existing characters and objective routes. Side requests stay in-card; only main quests receive conversations. Every accept action remains “Accept quest”.
- **Interface:** use existing contextual source/use routes, requirement tiles, worker targets and journey pins. Show the output's useful destination and actual missing ingredient. No new global tracker or notification stream.

## Integration rules for a first slice

Implement one complete chain at a time. Trace fresh unlocks and sources, real consumption/output, shops, quests, Guide, workers, online/offline, forecasts and saves together. Keep common supplies available across ordinary play; region-specific materials should mark a meaningful rare opportunity. Preparation happens before a run, runs automatically and has a clear result. No mandatory timed clicks, spoilage, durability maintenance on all gear, daily streaks or per-skill currencies.

This review uses source inspection and a loaded-catalogue consumer scan, not human playtesting. The scan counts direct recipe/project/research consumers; it does not count every quest, dynamic drop, sale, museum entry or transitive use. No balance or gameplay changes were made by the review.
