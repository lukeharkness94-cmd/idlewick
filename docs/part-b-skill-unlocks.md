# Part B · Starter skills and requirements

The default desktop skill rail and phone picker show learned activities. Fishing, Woodcutting and Cooking are usable immediately. Cooking recipes still need their ingredients discovered and held. The Combat area is separate. The **Locked skills** button opens the separate Skills screen with one visible requirements group. **Skip onboarding** shows the regular skill order in navigation and skips guidance while still requiring earned skill access. This follows the owner's instruction to keep collapsed menus out of the game.

| Skill or activity | How it becomes usable | What it teaches |
| --- | --- | --- |
| Fishing | Starter activity | Catch the first ingredient for Cooking. |
| Woodcutting | Starter activity | Collect timber for construction and equipment. |
| Cooking | Starter activity, with discovered ingredients required per recipe | Turn Fishing output into useful healing. |
| Combat styles, Defence and Health | The style areas and starter kit stay available. Before a fresh hero's first fight, use one log to finish the equipped starter weapon and cook a serving. | Prepare a weapon and food before starting the patrol. |
| Mining | Chop 10 logs and own a pickaxe. A pickaxe is available from Brannoc's quest or the shop. | Build from the first gatherable material towards metal equipment. |
| Farming | Hero 5, chop 15 logs, and spend 5 potato seeds. | Use timber and seeds to establish a crop patch. |
| Crafting | Complete Needle and Thread. Deliver 10 flax fibres and 5 logs. | Turn Woodcutting supplies into cord and crafted gear. |
| Smithing | Complete The Cold Forge. Mine 10 copper and 10 tin, and deliver 20 logs after Brannoc's pickaxe quest. | Combine Mining and Woodcutting inputs into metalwork. |
| Hunting | Chop 20 logs, hold 3 wooden traps, and reach Combat 8. The traps are kept. | Turn crafted equipment into field supplies. |
| Carpentry | Make 5 crafted items and keep a handsaw. | Use manufactured tools to turn raw wood into planks. |
| Beastmastery | Hunting 3, 3 held wooden traps and Combat 10. | Use experience in trapping before raising companions. |
| Exploration | Catch 25 fish, chop 25 logs and visit Mossbarrow. | Use the early skills and follow the first opened road. |
| Thieving | Complete The Light-Fingered Stranger. Visit Mossbarrow, deliver 5 cooked herring and defeat 3 haunted scarecrows. | Bring a meal and prove readiness for riskier activities. |
| Scholarship | Hero 12 and 8 distinct creatures studied. | Apply discoveries made through encounters. |
| Herbalism | Farming 10 and 20 harvests. | Develop crop production before brewing. |
| Enchanting | 30 crafting actions and 20 smithing actions. | Improve an item after learning the two equipment disciplines. |
| Sailing | Visit Saltmere and keep a skiff. | Use Carpentry to start voyages. |

The opening assembly uses the selected kit without creating an extra tradeable weapon or changing its stats. Existing saves retain effective unlocks and resume their existing activities. An earned skill with positive XP is retained during validation even when its threshold changes. The starting preparation rule is stamped only when a player creates a new hero through the title screen.

`tests/opening-skill-gates.cjs` checks the real title screen, exact first unlock, weapon and food preparation, legacy skill XP, the navigation setting and 390px layout. `tests/regression.cjs` checks the prerequisite graph and save handling.
