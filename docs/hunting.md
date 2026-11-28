# Hunting: real game and lures (28 November 2026)

Owner, 28 Nov 2026: "still not happy with beastmastery and hunting. There should be NO animals the same in either.
Hunting should be animals you can get resources from (feathers, game, chicken meat, bones etc etc - decide for each of
the animals). They should be animals like boar, chickens, moose, oxen, deer etc which you'd hunt in real life. The
beastmastery should be mythical creatures you can capture with hard work, high skill etc. Hunting shouldn't require a
trap, it should require a lure - so on the first attempt when hunting, you lay the lure down (something you make in
cooking) and then it tells you if that animal likes that lure or not, once you've found which lure it likes, its
chances of you being able to hunt it, increase a lot." Answers: 40 animals (5 tiers x 8); companions already caught
from ordinary animals: "Get rid. We're treating this game like it's not launched yet so it doesn't matter."

Beastmastery's side of the change (the 30 mythical beasts, capture tools and bait) is in docs/beastmastery.md; the
building costs are at the end of this file.

## Rules

- **The ground** (`js/hunt_tiers_data.js` `D.HUNT_ANIMALS` → `D.HUNT_GROUND`, `js/hunt_stalk.js`): 40 real game
  animals, eight in each tier (Beginner 1-19, Intermediate 20-39, Skilled 40-59, Expert 60-79, Master 80-99), each on
  its own Hunting level, small game and fowl first and the great beasts last. Only the Hunting level matters, never the
  town; each animal keeps a home town for its field-guide page and the fight route before Hunting is learned (a
  quest's animal can still be fought then). No animal is a mythical beast or a combat creature.
- **Lures** (Cooking → Lures, ten a batch): one is laid on every hunt, caught or not. No lure, no hunt ("Needs a
  lure"), except an active quest's animal, which is hunted without one at the ignored-lure odds (quests are never
  blocked). The lure row under the selected animal shows a button per lure with how many you hold and what you know
  (its name and count, then ♥ likes, ✗ ignores or ? untried); picking one lays it until you pick it again; with none picked the game lays the
  liked lure you have found, else one you have not tried on that animal, else any. A lure is named on the row once its
  recipe's ingredients are found or you have held one; the rest are counted ("2 more to find in Cooking").
- **The verdict**: each animal secretly likes one lure (`m.lure`). The first hunt with a lure on an animal says
  plainly, after the roll, whether it likes it or ignores it (a note, the log, the stage strip and a float); this is
  saved (`S.hunt.lures[animal][lure] = 1 | 0`) and shown from then on on the animal's card (the liked lure's icon), in
  the selected detail, on its field-guide page ("Likes salt lick" / "Ignores grain mash, root mash") and in its
  creature tooltip.
- **Odds** (`DQ.huntCatch(id, lure)`): with the liked lure 80% + 1% per Hunting level above the animal, up to 95%;
  with any other lure 25% + 1% a level, up to 45%. The page never shows a figure the player cannot know yet: an
  untried lure reads "30% if it ignores the grain mash, 82% if it likes it: this hunt tells you which".
- **A hunt**: Tracking 45%, Laying the lure 30%, Strike 25% of the cycle (5 s + 0.06 s per Hunting level of the
  animal). A catch gives its drops, a quest kill, the field-guide entry and the World Life hooks; an escape pays 30%
  of the XP. A failure with an ignored lure is usually put down to the lure ("Ignored the lure"). No combat XP, no
  damage, no food, no companions (Beastmastery keeps mythical beasts). Hunting XP per catch is unchanged.
- **Learning Hunting**: 20 logs cut, combat 8 and three grain mash held (Cooking 1, from bread; pinned at Cooking 1
  by js/level_spread.js like the opening's string and trap). Held wooden traps no longer add Hunting XP.
- **Fieldwork** still lays wooden traps for a region's materials. The old per-town grounds are gone, so each region's
  hauls are fixed in `D.FIELD_MATS` (what that region's old animals gave, from the Hunting level they were found at;
  the generic raw game became the region's own meat). Frost pelt, bog scale, drakehide and wyrm scale keep their
  sources for the leather tiers.
- **Offline**: the ceiling stops Hunting at the top animal's level (98, the polar bear). Lures run out offline like
  any other input and stop the hunt with the reason.

## The 40 animals

| Tier | Animal | Hunting | Home | Drops (chance) | Likes |
|---|---|---|---|---|---|
| Beginner | Chicken | 1 | Willowbrook | Raw chicken 1 (90%), Feather 2-5 (85%), Egg 1 (25%) | Grain mash |
| Beginner | Rabbit | 3 | Willowbrook | Raw rabbit 1 (90%), Fur pelt 1 (45%) | Root mash |
| Beginner | Wood pigeon | 5 | Willowbrook | Raw game bird 1 (80%), Feather 2-4 (80%) | Grain mash |
| Beginner | Pheasant | 8 | Willowbrook | Raw game bird 1 (85%), Feather 3-6 (90%), Egg 1 (10%) | Root mash |
| Beginner | Mallard | 10 | Gloomfen | Raw duck 1 (85%), Feather 2-4 (70%), Down 1 (35%), Egg 1 (12%) | Grain mash |
| Beginner | Brown hare | 12 | Mossbarrow | Raw rabbit 1-2 (85%), Fur pelt 1 (60%) | Clover cake |
| Beginner | Greylag goose | 15 | Saltmere | Raw goose 1 (85%), Feather 3-6 (80%), Down 1-2 (55%), Egg 1 (15%) | Clover cake |
| Beginner | Wild boar | 18 | Mossbarrow | Raw boar 1-2 (90%), Boar tusk 1 (50%), Tallow 1 (40%) | Root mash |
| Intermediate | Red grouse | 20 | Ironpeak Hold | Raw game bird 1 (85%), Feather 2-5 (85%) | Berry mash |
| Intermediate | Roe deer | 22 | Mossbarrow | Raw venison 1 (85%), Deer hide 1 (50%), Antler 1 (25%) | Salt lick |
| Intermediate | Wild sheep | 25 | Willowbrook | Raw mutton 1 (85%), Wool 1-3 (85%), Horn 1 (20%) | Clover cake |
| Intermediate | Red fox | 27 | Willowbrook | Fur pelt 1-2 (75%) | Carrion bait |
| Intermediate | Capercaillie | 30 | Mossbarrow | Raw game bird 1-2 (85%), Feather 3-7 (90%) | Berry mash |
| Intermediate | Fallow deer | 32 | Mossbarrow | Raw venison 1-2 (85%), Deer hide 1 (55%), Antler 1 (30%) | Berry mash |
| Intermediate | Mountain goat | 35 | Ironpeak Hold | Raw mutton 1-2 (80%), Horn 1 (40%), Frost pelt 1 (25%) | Salt lick |
| Intermediate | Beaver | 38 | Gloomfen | Fur pelt 1-2 (85%), Tallow 1 (30%) | Root mash |
| Skilled | Wild turkey | 40 | Willowbrook | Raw game bird 2-3 (90%), Feather 4-8 (90%), Egg 1 (10%) | Grain mash |
| Skilled | Ibex | 42 | Skyreach | Raw mutton 1-2 (85%), Horn 1-2 (50%), Frost pelt 1 (20%) | Salt lick |
| Skilled | Red deer | 45 | Mossbarrow | Raw venison 1-2 (90%), Deer hide 1-2 (60%), Antler 1 (40%) | Salt lick |
| Skilled | Lynx | 47 | Mossbarrow | Fur pelt 1-2 (85%), Frost pelt 1 (15%) | Carrion bait |
| Skilled | Black bear | 50 | Mossbarrow | Raw bear 1-2 (85%), Bear pelt 1 (50%), Tallow 1-2 (50%) | Honey cake |
| Skilled | Grey seal | 52 | Saltmere | Tallow 1-2 (80%), Fur pelt 1 (50%) | Fish-oil bait |
| Skilled | Reindeer | 55 | Ironpeak Hold | Raw venison 1-2 (85%), Deer hide 1 (55%), Antler 1-2 (45%), Frost pelt 1 (20%) | Clover cake |
| Skilled | Great bustard | 58 | Skyreach | Raw game bird 2-4 (90%), Feather 5-10 (90%), Down 1-2 (30%) | Clover cake |
| Expert | Wolverine | 60 | Ironpeak Hold | Fur pelt 2-3 (85%), Frost pelt 1 (40%) | Carrion bait |
| Expert | Elk | 62 | The Hollow Crown | Raw venison 2-3 (90%), Deer hide 1-2 (65%), Antler 1-2 (50%) | Berry mash |
| Expert | Musk ox | 65 | Ironpeak Hold | Raw beef 1-2 (85%), Wool 2-5 (80%), Horn 1 (45%), Frost pelt 1 (35%) | Root mash |
| Expert | Wild ox | 67 | The Hollow Crown | Raw beef 2-3 (90%), Cowhide 1-2 (80%), Horn 1 (45%), Tallow 1 (40%) | Grain mash |
| Expert | Moose | 70 | Gloomfen | Raw venison 2-4 (90%), Deer hide 2 (70%), Antler 1-2 (60%) | Salt lick |
| Expert | Brown bear | 72 | The Hollow Crown | Raw bear 2-3 (90%), Bear pelt 1 (60%), Tallow 1-2 (60%) | Honey cake |
| Expert | Bison | 75 | Skyreach | Raw beef 2-4 (90%), Cowhide 1-2 (75%), Horn 1 (50%), Tallow 1-2 (50%) | Salt lick |
| Expert | Water buffalo | 78 | Gloomfen | Raw beef 2-3 (90%), Cowhide 1-2 (80%), Horn 1-2 (55%) | Clover cake |
| Master | Argali | 80 | Skyreach | Raw mutton 2-3 (90%), Horn 2 (60%), Wool 1-3 (50%) | Salt lick |
| Master | Walrus | 82 | Saltmere | Walrus ivory 1 (60%), Tallow 2-3 (85%) | Fish-oil bait |
| Master | Wild yak | 85 | Ironpeak Hold | Raw beef 2-3 (90%), Wool 3-6 (90%), Horn 1 (45%), Frost pelt 1-2 (45%) | Clover cake |
| Master | Giant eland | 87 | Emberfall Citadel | Raw venison 2-4 (90%), Deer hide 2-3 (70%), Horn 1-2 (55%) | Berry mash |
| Master | Cape buffalo | 90 | Emberfall Citadel | Raw beef 3-4 (90%), Cowhide 2 (80%), Horn 1-2 (65%) | Clover cake |
| Master | Elephant seal | 92 | Saltmere | Tallow 3-5 (90%), Fur pelt 1 (30%) | Fish-oil bait |
| Master | Gaur | 95 | Emberfall Citadel | Raw beef 3-5 (90%), Cowhide 2-3 (85%), Horn 2 (65%), Tallow 1-2 (50%) | Salt lick |
| Master | Polar bear | 98 | Ironpeak Hold | Raw bear 2-4 (90%), Bear pelt 1-2 (70%), Frost pelt 1-2 (60%), Tallow 2-3 (70%) | Fish-oil bait |

## Lures


| Lure | Cooking | Makes | Inputs | Liked by |
|---|---|---|---|---|
| Grain mash | 1 | 10 | 1 bread | Chicken, Wood pigeon, Mallard, Wild turkey, Wild ox |
| Root mash | 3 | 10 | 2 potato | Rabbit, Pheasant, Wild boar, Beaver, Musk ox |
| Clover cake | 12 | 10 | 2 cabbage, 1 bread | Brown hare, Greylag goose, Wild sheep, Reindeer, Great bustard, Water buffalo, Wild yak, Cape buffalo |
| Salt lick | 18 | 10 | 3 sea salt, 1 wheat | Roe deer, Mountain goat, Ibex, Red deer, Moose, Bison, Argali, Gaur |
| Berry mash | 24 | 10 | 3 strawberry | Red grouse, Capercaillie, Fallow deer, Elk, Giant eland |
| Carrion bait | 28 | 10 | 2 raw rabbit, 1 raw chicken | Red fox, Lynx, Wolverine |
| Fish-oil bait | 34 | 10 | 2 raw herring, 1 tallow | Grey seal, Walrus, Elephant seal, Polar bear |

Sea salt for salt licks is sold at Saltmere's general store. Clover cake needs cabbage, berry mash strawberries and
honey cake a beehive's honey from Farming; carrion and fish-oil bait come from the ground and the sea.

## What the drops are for

- **Meat** cooks into food (Cooking → Game); raw rabbit, chicken, venison and beef also go into lures and bait.


| Meat | Cooks into | Cooking | Heals |
|---|---|---|---|
| Raw chicken | Roast chicken | 2 | 3 |
| Raw rabbit | Roast rabbit | 4 | 4 |
| Raw game bird | Roast game bird | 9 | 5 |
| Raw duck | Roast duck | 13 | 6 |
| Raw goose | Roast goose | 19 | 8 |
| Raw boar | Roast boar | 24 | 9 |
| Raw mutton | Mutton chop | 29 | 10 |
| Raw venison | Venison steak | 37 | 12 |
| Raw beef | Beef steak | 50 | 15 |
| Raw bear | Bear steak | 58 | 16 |

- **Feather** fletches arrows; **egg** cooks into omelettes and cakes; **wool** spins into cloth; **cowhide** and
  **frost pelt** are the first two leather tiers (Crafting).
- **Fur pelt** pads the live trap; **deer hide** makes the rope and mithril halters; **antler** toggles the warded
  snare, rune trap and mithril halter; **horn** latches the iron-jaw cage; **bear pelt** lines it; **down** fills the
  fowling and starwoven nets; **tallow** goes into fish-oil bait and honey bait; **walrus ivory** sells well; **boar
  tusk** mounts in the trophy hall.
- The old generic **raw game** and **roast game** stay items (old saves hold them; the general store takes them), but
  nothing drops raw game now and its roast is no longer a recipe.

## Quests that named old animals

| Quest | Was | Now |
|---|---|---|
| Geese on the Jetty (was Crab Cull, Saltmere) | 10 rock crabs | 10 greylag geese |
| Under the Hare Moon (was Under the Bellhare Moon, Mossbarrow) | 8 bellhares | 8 brown hares |
| Goats in the Pass (was Chimes in the Pass, Ironpeak) | 12 chimehorns | 12 mountain goats |
| Lanterns over the Bog (Gloomfen) | 15 candletoads | 15 beavers gnawing the lantern posts |
| Ash and Glass (Emberfall) | 12 glassbacks | 12 cape buffalo |
| Feathers of the Gale (Skyreach) | 25 storm hawks | 25 great bustards |
| Golems of the Stair (Skyreach) | 12 prism kites | 12 argali |
| A Shard of Starlight (Skyreach, adventure) | 15 storm hawks | 15 great bustards |

The wild boar quests (A Hunter's Bow, Tusks and Trouble) are unchanged.

## Old saves

The game is treated as unlaunched (owner), but no save is erased: kills of animals that left the game stay in
`S.beast.kills` and do nothing; a running hunt or fight of an animal that left the game, or a capture of an ordinary
animal, stops on load with a note instead of failing the save (`js/state.js`); companions caught from ordinary animals
are let go on load with a note in the log (`js/beast_capture.js`). Nothing else about the hero changes.

## Buildings cost materials (js/build_costs.js)

Owner: "building anything in the game should require resources as well as money (pens, chicken coops etc)"; answer:
materials matched to tier, coins roughly halved. Farm plots, pens (the coops, sties and byres the livestock lives in),
the cottage and its rooms now take logs, planks and bars as well as coins. Furniture, workshop ranks, the smithy's
anvils and hammers, boats and restorations already took materials and are unchanged. The materials show as named
held / required tiles with a route to each source; a short build refuses with one plain sentence ("You need 100 more
coins and 9 more logs."); the spend is atomic and rolls back if the save fails; prices inside the buttons are
`UI.money`, so a big build holds to confirm like a big purchase. Home goals and Next step read the same cost.

|---|---|---|
| Farm plot 4 | 600 | 300 coins + 15 logs |
| Farm plot 5 | 2,500 | 1,250 coins + 25 logs + 5 bronze bar |
| Farm plot 6 | 9,000 | 4,500 coins + 20 oak planks + 10 iron bar |
| Farm plot 7 | 30,000 | 15,000 coins + 30 willow planks + 10 steel bar |
| Farm plot 8 | 90,000 | 45,000 coins + 40 maple planks + 10 mithril bar |
| Pen 3 | 1,500 | 750 coins + 20 logs + 4 bronze bar |
| Pen 4 | 6,000 | 3,000 coins + 20 oak planks + 8 iron bar |
| Pen 5 | 20,000 | 10,000 coins + 30 willow planks + 10 steel bar |
| Pen 6 | 60,000 | 30,000 coins + 40 maple planks + 12 mithril bar |
| Cottage | 2,500 | 1,250 coins + 40 logs + 5 bronze bar |
| Kitchen | 4,000 | 2,000 coins + 20 oak logs + 10 bronze bar |
| Bedroom | 7,000 | 3,500 coins + 30 oak logs + 8 iron bar |
| Workshop | 12,000 | 6,000 coins + 20 oak planks + 15 iron bar |
| Garden | 9,000 | 4,500 coins + 40 logs + 20 oak logs |
| Servants’ quarters | 20,000 | 10,000 coins + 25 willow planks + 20 iron bar |
| Trophy hall | 40,000 | 20,000 coins + 30 maple planks + 15 steel bar |

## Verification

`tests/hunt-stalk.cjs` (40 animals, tiers, levels, no overlap with beasts or combat, the lure gate, like/ignore
verdicts saved and shown, odds bounds, quest animals without a lure, the strip), `tests/creature-roster.cjs`,
`tests/combat-hunting-qa.cjs` (fresh hero: string, traps, grain mash → Hunting; the stop-on-load migration),
`tests/hunting-loop.cjs` and `tests/art-pixel.cjs` (every new item drawn and distinct; 30 beasts with front and side
views). These are scripted checks with granted fixtures, not playtests: whether finding the liked lure feels like
discovery rather than a chore, and whether ten lures a batch is the right amount of cooking, needs players.
