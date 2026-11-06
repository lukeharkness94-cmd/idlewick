# Companion effects: design for approval (not built)

**Now:** you have one active companion at a time. Each gives a small passive bonus (+2% to +8% to XP, coins, damage, damage taken or speed), and many companions share the same kind of bonus, so they feel interchangeable.

**Proposal:** every curated companion keeps a *smaller* passive (roughly half of today's) and gains one **signature trick**: a visible moment you can see happen, with its own floating text in the scene or arena. The tricks are tuned to be roughly as strong as today's bonus over an hour, so overall power barely changes. Each trick lists the existing engine hook it would use.

| Companion | How you get it | Today | Signature trick (proposed) | Hook |
| --- | --- | --- | --- | --- |
| Biscuit (farm dog) | Mossbarrow shop | +2% XP | **Fetch**: every few minutes of gathering, brings back a bonus resource from the current task. "Biscuit fetched a log!" | gatherDone |
| Toast (chick) | Harvesting | +6% Farming XP | **Early riser**: crops ripen 10% sooner. | crop timers |
| Bubbles (goldfish) | Fishing | +6% Fishing XP | **School spotter**: 1 in 12 catches is doubled, with a splash. | gatherDone (double catch) |
| Acorn (squirrel) | Woodcutting | +6% Woodcutting XP | **Nut stash**: bird's nests are twice as common. | woodNestChance |
| Nugget (mole) | Mining | +6% Mining XP | **Seam sense**: gems from mining are twice as common. | mineGemChance |
| Whiskers (alley cat) | Thieving | +6% coins | **Light paws**: the first failed pickpocket each minute is shrugged off with no damage. | thieveDone |
| Cinder (fire sprite) | Smithing | +6% Smithing XP | **Bellows**: 1 in 10 smelts makes a second bar. | recipeDone |
| Quill (owl) | Crafting | +6% Crafting and Magic XP | **Night study**: research finishes 10% sooner. | research timers |
| Pudding (piglet) | Cooking | Food heals 10% more | **Taster**: never burns the first item of each cooking session, and burns are 25% rarer. | burnChance |
| Gobbo (goblin whelp) | Grubnash | +3% damage | **Heckle**: once per fight, makes the enemy miss its next attack ("Oi!"). | monsterAttack |
| Tusky (boarlet) | Old Tusk | 3% less damage taken | **Charge**: opens each fight with a free hit for half your max hit. | combatRound (first round) |
| Barnacle Bill (hermit crab) | Barnacle | +8% coins | **Beachcomber**: coin pouches from fishing and fighting are 50% larger. | coin pouch drops |
| Frostling (ice troll pup) | Frostmaw | +5% damage | **Cold shoulder**: boss specials hit 20% softer. | monsterAttack (special) |
| Bogwisp (marsh light) | Morwenna | +5% XP | **Will-o'-wisp**: reveals one unknown bestiary entry stage early for each creature. | research ranks |
| Wyrmling (baby wyrm) | Pyrrhax | +7% damage, 3% less taken | **Ember breath**: every 6th attack adds a small fire hit (good against frost-weak foes). | combatRound |
| Stormchick (roc hatchling) | Zephyrion | Every task 5% faster | **Tailwind**: travel and the first minute of each task are 25% faster. | actDur |
| Hollowling (crowned shade) | Hollow King | +8% XP and coins | **Echo**: 1 in 20 task completions repeats itself for free. | task completion |

The eight signature wild companions from Hunting would keep their current simple bonuses for now. They could get tricks in a second pass.

**Rules:** tricks never trigger during forecasts. Offline, they are applied the same way as live play but stay quiet (no floating text). Each companion card shows its trick in one sentence. No companion trick depends on a timer you have to watch.

**What I need from you:** approve the list as it stands, or mark any rows to change or drop. Then I'll build it, retest with the simulators, and report the before and after.
