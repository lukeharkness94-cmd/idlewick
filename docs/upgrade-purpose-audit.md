# Upgrade purpose audit — 19 November 2026

Owner rule: the thing being upgraded must provide a believable reason for its actual benefit. A physical speed upgrade, a teaching aid and a magical effect must not be described interchangeably.

This pass covers all 21 shop skill/tool families (50 graded tools and 16 three-rank workshop families), their shared item information, and Scholarship upgrade names. Checked the skill-related house improvements too: reference books support learning, a workbench/anvil support production speed, organised tool storage supports fieldwork, and compost/feeding facilities support crop/animal production. No new mechanical effects, changed numbers, recipes, resource costs, gates or save IDs are introduced.

## Physical tools

Every grade inherits its family's explanation, shown in selected shop details and item tooltips. Existing grade/material names and artwork remain.

| Family | Actual effect | Physical explanation |
| --- | --- | --- |
| Fishing rods | Shorter catch interval | Balanced fittings and controlled line retrieval help land each catch. |
| Axes | Shorter cutting interval | Cutting edge and secure handle remove wood with less wasted effort. |
| Pickaxes | Shorter mining interval | Durable point and balanced head break ore-bearing rock efficiently. |
| Thief gloves | Shorter thieving interval | Fitted fingers and reinforced cuffs improve control over pockets and locks; no claim of increased success chance. |
| Hoes | Shorter crop-growing time | Improved soil preparation gives roots better access to air and water. Explicitly about growing time, not fictitious planting/harvesting timers. |

## Workshop ranks

These retain their actual +3%, +6% and +9% skill XP effects at levels 5/25/50. The explanation describes learning through ordinary existing activities; no extra practice activity or minigame is implied. Timber, forged fittings and the existing metal inputs support these physical structures and guides.

| Skill | Purchase | Why it improves learning |
| --- | --- | --- |
| Cooking | Practice cookware | Measures and even heating help teach temperature control. |
| Smithing | Smithing patterns | Engraved patterns provide a reference for correct forging. |
| Crafting | Pattern bench | Measured guides make accurate cuts and mistakes easier to recognise. |
| Magic | Spell study stand | A steady focus and casting guides support learning from spells. |
| Hunting | Track study kit | Casts and measuring guides teach recognition of animal signs. |
| Beastmastery | Handling pen | A controlled space supports learning companion handling. |
| Exploration | Survey kit | Calibrated measuring guides support learning through surveys. |
| Scholarship | Study desk | Notes and references can be compared in one organised place. |
| Herbalism | Herbal study bench | Labelled preparation guides support plant recognition and preparation. |
| Enchanting | Enchanting bench | Etched guides and clamps support study of inscriptions. No separate Runework skill. |
| Carpentry | Joinery templates | Measured templates help recognise mistakes in woodwork. |
| Sailing | Navigation table | Charts and plotting instruments support learning from voyages. |
| Melee | Melee dummy | Striking zones support positioning and control. |
| Ranged | Archery targets | Aiming marks support learning from shots. |
| Defence | Guard dummy | Marked angles support guard-position training. |
| Health | Conditioning frame | Supported exercises develop conditioning through Health training. |

Descriptions live with `D.SKILL_COMMISSIONS`; the shop uses the same purpose for every rank. Required previous ranks also use the updated names. Existing saved rank ownership is keyed by skill ID and continues unchanged.

## Scholarship corrections

- Sharper Tools I–III → Efficient Fieldwork I–III. Its gathering-speed effect includes activities that do not involve a cutting edge; handling and work routines fit the real scope.
- Better Bellows → Forge Heat Studies. The existing effect is Smithing XP, so studying heat fits it better than a hardware upgrade implying speed.
- Spice Lore → Heat Control. The existing benefit reduces burnt meals, so the subject is temperature rather than seasoning.
- Waste Not → Productive Methods. It grants occasional double output, not ingredient preservation. The description now says useful extra output explicitly.

Other studies retain their names where their effects fit: packs add capacity, recognition studies reveal information/finds, weapon drills increase damage, battle plans reduce damage, and practical studies unlock their named recipes. Stable research IDs and prerequisite links remain unchanged.

## Boundaries and verification

The earlier proposed selectable enchantments and material-preservation purchases are not enabled by this naming pass. Do not advertise them as shipped. No rebalance is necessary because engine effects and values have not changed.

Use shop-skill-updates.cjs and its browser suite to exercise real purchases, saved ranks and rollback; regression plus ui-fit/ui-current are the delivery gates. Catalogue checks retain long-name, phone and both-theme coverage. The visual audit additionally opens all 21 families at 1280×720, 1920×1080 and 390×844 in both themes, verifies full labels and visible actions, and captures representative tool and workshop details. Screenshots grant level-35 test progress; they are not normal progression evidence.
