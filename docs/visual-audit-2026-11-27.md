# Visual audit, 27 Nov 2026

Three report-only browser audits of `main` (ae79f1e) covered every page and state the game reaches from a fresh hero and
a mid-game fixture (every skill 30, three towns cleared, coins and materials), at 1440×900, 1280×720 and 390×844, in
light and dark, with reduced motion and Settings → Reduce effects. Together they reported 84 bugs and 32 suggestions.
This file records what was fixed on `claude/visual-audit`, what is still open, and the decisions that belong to the
owner. Screenshots and simulations are evidence, not human playtests: sound, real-time feel and long sessions still
need a person.

## Fixed

Shop, skills and Hero
- Backpack: the "a restoration needs this" house was drawn at the slot's full 48px over the item, hiding half the pack.
  It is now a 20px corner badge (an ID-level pack rule had been overriding the badge size).
- Shop → Sell: the same marker pushed "25 held" out of the fixed 170px card. On cards it is a corner badge with the
  restoration's name in the tooltip.
- Activity scenes: villagers stood in the mine, at the forge, on the hunting ground and on open sea once a town was
  restored. Removed: backdrops have no bystanders, and townsfolk walk the Home and Village scenes instead.
- Now card: "then <next task>" was hidden on desktop. It now shows on short windows and on the task's own page, where
  it replaces "on this page".
- Activity details at 1280×720 were cut off mid-line (a locked survey's reason, Smithing's stats). The scene gives up
  its height first, then the details scroll inside the panel.
- A fresh hero's route to the copper pickaxe landed on an empty shelf ("Available only" hid it). A route now pins its
  tool on the shelf until the player picks another card or flips the switch.
- Buy back drew its own header and moved the category row. It now uses the shared shop header.
- Tool shelf: owned tiers disappeared after a purchase, so the selection jumped to the next tier under a "Bought"
  label. Every tier stays on the shelf; owned ones read "✓ Owned" and stay selected after buying.
- Work scenes: the hero's body rotated 2–5° while working, smearing its pixels. It now moves in position only; tools
  still swing.
- The target inside a work scene had an outlined route box around it. Scene pictures are no longer route controls.
- Scholarship, Melee, Hunting, Exploration, Herbalism and Enchanting showed a placeholder dot as their icon in page
  headers, the field guide and route chips. Every skill's pixel icon is now registered.
- A disabled Queue next to a disabled primary looked usable. Disabled secondary controls fade their outline.
- Recipe category tabs showed "Steel Lv 30" greyed out at Smithing 30. Tabs now say what actually locks them
  ("Find Steel bar" or "Lv 50"), with the full reason in the tooltip.
- "Restore Rekindle the village…": project names are already verbs, so the gate reads "Rekindle the village forge
  first". The same fix applies to local supplies.
- The hunting action read "Hunt ???" for unnamed animals. It now reads "Hunt".
- The next-perk chip ran past the panel edge. It wraps.
- Farming: "Harvest ripe crops" was the main action on an empty field. It leads only while something is ripe (live),
  and planting leads when plots are empty and a seed is chosen.
- Starter weapons are written in sentence case like the armour (Bronze shortsword, Wooden staff…).
- Local supplies said "Requirements unmet". They now name the step.
- Hero → Tools showed the undiscounted price. It now shows the shop's price after the Thieving discount.
- The phone bottom bar used 12px labels and 11px counts. Both are now 13px.

Combat
- At 1280×720 the doll was cut at the waist and the Legs, Ammo and Weapon slots couldn't be clicked. The doll keeps its
  own height; the two training buttons share a row, and on short windows the "Slot 3 · Combat 40" line moves into the
  Abilities heading's tooltip. All eight slots are verified clickable.
- The sixth creature in an area wrapped onto a clipped row and lost its Track button. The list of places now scrolls.
- The killing blow and its "slain" flash landed on the next creature on a busy frame. The next creature now waits
  until the blow has visibly landed and the fade has played; fight timing is unchanged.
- The death fade copied the whole foe card into the toast layer, where it grew 2–3× and covered the Food panel and
  pop-ups. It now copies only the sprite, at its drawn size, inside the stage, and is skipped while a pop-up is open.
- Challenge in the Boss pop-up left the pop-up covering the whole fight. Starting any fight now closes the pop-up.
- Phantom "hurt" sounds: forecasts scheduled them and they played for real. Fixed.
- Trial tower floors used hunting-ground animals (a Lv 107 bear on Mossbarrow floor 1). Floors are the town's own
  fighting creatures again. `TOWERS=1 node scripts/sim-bosses.cjs` was compared with main; see below.
- On phones the foe was drawn at 6× next to a 4× hero and spilled out of its frame. It is now 4×.
- XP floats appeared while the arrow or spell was still in flight. They now wait for the impact.
- The fighter stood tilted 2° at rest, which jagged its pixels. It now stands upright.
- Unlock pop-ups opened over a fight you were watching, including bosses. They wait, and the bell keeps them.
- With no food, defeat advice said "remove Second Wind". Food advice now comes first, and removing a heal is never the
  headline tip.
- Hover lifts on pack slots and pens used `transform`. They now use `translate`.
- "1 stories completed" now reads "1 story completed".

Home, Quests, Village, World
- After time away, a long stop reason pushed rail rows under their 34px floor and Sailing off the window. The reason is
  now two lines at most, with the full text in its tooltip.
- Level-ups read "Experience bonus is now +-66%." The figure now matches the skill's own "+N% XP" chip, and nothing is
  shown when there is no bonus.
- Home's town scene was at 2.36×, 1.78× and 0.56×. It is now a whole-number scale (2× desktop, 1× phone) cropped by
  its card, with the scene's own sky above it; the walkers follow.
- Quest pictures not yet earned were invisible in the dark theme. They are now a light ghost.
- The phone top bar cropped the hero portrait to its hair. It now shows the whole 48px face.
- Story dialogue text touched its outline. It has padding now.
- Home's accept button said "Meet Elder Wren". It now says "Accept quest", and the toast names the Current tab, not
  "Active".
- Requirement rows ("What you need") now have padding off their outline.
- Title-screen fireflies ignored reduced motion. They hold still now.
- The planning unlock pop-up said "Tap" on desktop. The wording now works on any device.

## Still open (bugs)

- Farming: the "Empty plot" label overlaps the soil sprite on short windows. The livestock icons look washed out.
- Shop → Equipment: Bronze shortsword has no stat line, lock icons in cost rows are twice the size of the other cost
  icons, and "Buy —" is disabled with no reason. Rare wares offers 1/10/100 for one-of-a-kind items. Cost rows need
  gaps between the amounts.
- Sailing: Gull Rock floats at the top of the sea scene, and survey-chart cards have no picture.
- Enchanting has an unlabelled "0" tab. Carpentry's boat route points to the page you're on.
- Smithing's anvil is drawn at 4× beside the 3× hero.
- The item detail repeats the stat block, and its title is pale in the light theme.
- The Now card grows by about 13px when a task starts, which shifts the rail.
- Phones: the "Combat" card and an empty panel sit above the header on several pages; the Now card text is cut off.
- Dark theme: locked silhouettes and tab icons are hard to see on dark green.
- Combat: sounds play at the round tick rather than at the visible impact (`strike_sync.js` covers work only);
  leftover "+XP" floats after a defeat; truncated ability names ("Second …"); the world-event pill covers the ability
  slots; the boss victory scene repeats Wren's line and still shows "Grubnash · Ready"; the practice yard swings the
  bow like an axe and draws the hay-bale butts as an arrow; drill pages have two tab rows; the "Your fighter" column
  arrives about 80 ms after the page; `snapAll` rescans the whole page on every DOM change (a likely jank source).
- Village: after a delivery, the button under the pointer becomes a route chip; "Deliver 12" shows what you hold
  rather than what's needed; "Collect proceeds · 0 coins" is enabled with nothing to collect; "Complete project" is
  7px below the window at 1280×720.
- Welcome Back and Settings draw non-clickable information as outlined boxes (shape rule). The Settings segmented
  buttons use 13px text.
- World events: after choosing, the only exit is still "Decide later"; "Track it · Lv 14" is enabled for a level-1
  hero; unaffordable choices read "150 coins · Need 150 coins".
- Bell history: the buttons for "Waiting in Activity" and "Items gained" open Home.
- Quests: the page notice covers the tab row for 9 seconds; Daily errands hides the tab row.
- Notes appear under a pop-up's dimmed backdrop. Coins jump in the top bar before the claim animation counts up.
- The world map at 1280 shows region labels about 5px tall.
- Unlock and quest-reward icons are 16px inside 110px rings.

## Decisions for the owner

1. **Weapon names.** The rules say ordinary gear uses material names, but every metal weapon after bronze has a fantasy
   name (Soldier's Blade, Knight's Longsword, Skyforged Saber…; `js/lore.js`). Renaming them touches quests and story
   text. Options: plain names everywhere (Iron sword, Steel sword), or keep the fantasy names and change the rule.
2. **Animals at your Hunting level.** The ground shows them in full colour but names them ??? until the first catch
   (`tests/ui-rules.cjs` treats them as unmet creatures). Fish and trees are named once their level is reached. Options:
   name animals once reachable (as fish), or keep ??? and show the picture as a silhouette too.

## Suggestions

- Give Melee and Ranged technique cards real pictures instead of a 10px dot; make Magic spells picture-first cards.
- Exploration, the training yard, Herbalism and Capture prep reuse the workshop interior; each deserves its own district.
- Keep the stage column width steady across Spellbook, Runes and Alchemy.
- "Max ×13,736" can spend 54,944 coins in one click: add a confirm or a cap.
- The fresh-hero shop shows nothing to buy; show the next tier as a goal.
- Achievements' "Show all 93" works like a collapsed disclosure; give the list its own scroll area.
- Decisions waiting: six identical primary buttons; order them or make one primary.
- Settings → Saves offers copy/paste save text twice; merge them.
- Add a heal number on the hero when eating; say "Miss" instead of a blue 0; keep damage numbers above heads.
- On phones, put the fight stage first on Combat, and drop the sticky header that covers it.
- Event art: "three bandits" shows one oversized goblin brute.
