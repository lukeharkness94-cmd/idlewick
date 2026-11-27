# Where everything sits: review and proposal (27 Nov 2026)

Owner: "have a look again at where every skill, menu and system currently sits and suggest where it might better sit.
There's a lot of menus at the top and it makes the phone menu system look very busy."

Chosen by the owner on 27 Nov 2026 ("go with the five-place navigation proposal") and built in `js/shell.js`.

## What there is today

| Place | Desktop | Phone |
|---|---|---|
| Top menu | Home, Quests, World, Village, Hero, Guide, Shop (7) | bottom bar: Home, Quests, Skills, World, Village, Hero, Guide, Shop (8), four with number badges |
| HUD beside it | portrait (→ Hero), coins, backpack 13/40, map pin (→ World map), bell, settings, mute (5 icon buttons) | the same 5 icon buttons in a card above every page |
| Left rail | Now card, Combat group (Combat, Melee, Ranged, Magic, Defence, Health), 17 skills | "Choose skill" / "Combat" tabs, then lists |

Pages under each menu (sub-tabs in the page bar):

| Menu | Tabs |
|---|---|
| Home | Home, Activity (decisions waiting, recent log), Journal (story replay) |
| Quests | Quests, People |
| World | Map, Exploration |
| Village | Town projects, House, Workers |
| Hero | Inventory & equipment, Tools, Bank, Skill levels, Mastery |
| Guide | Field guide, Museum, Collection, Achievements |
| Shop | Skill upgrades / Equipment / Supplies, then Buy, Rare wares, Sell, Local supplies, Buy back |
| Combat (rail) | Fight, Trial tower; Melee/Ranged: book, practice yard; Magic: Spellbook, Runes, Alchemy |

## What makes it feel busy or illogical

1. **Eight phone tabs with number badges.** Phone guidelines top out at five; four live counters (20, 2, 2, 25) shout at
   once, and most of them aren't things to do right now (25 = shop items you could buy).
2. **The town is split in three.** Village (projects, house, workers), Shop and the World map's "you are here" all
   describe the town you're standing in, but sit under three menus plus a HUD pin.
3. **Exploration is a skill in the rail but a tab under World.** Every other skill opens from the rail into the Skills
   group; this one jumps you into another menu.
4. **Progress lives in three places.** Skill levels and Mastery sit under Hero (your stuff), while the Field guide,
   Collection, Achievements and Museum sit under Guide, and the story Journal under Home. They're all "what I've done
   and what's next".
5. **Home's Activity tab repeats the bell.** Decisions waiting and the recent log are also the bell's contents.
6. **The HUD map pin and the World menu go to the same page.**

## Proposal (recommended)

Five places, named for what you do there, the same on desktop and phone:

| New menu | Holds | Was |
|---|---|---|
| **Home** | the hearth (your room, your goal, the town through the window), Welcome back, decisions waiting | Home + Activity |
| **Skills** | every skill and Combat (rail on desktop; on phones a grid of skills with Combat first) | rail + phone "Skills" |
| **Quests** | Quests, People | unchanged |
| **Town** | Town projects, Shop, House, Workers, Map (travel) | Village + Shop + World map + HUD pin |
| **Journal** | Field guide, Collection, Achievements, Museum, Skill levels, Mastery, Story | Guide + Hero's progress tabs + Home's Journal |

**Hero** becomes the portrait in the top-left corner, as it already acts: tap it for Backpack & equipment, Tools and
Bank. **Exploration** moves to Skills with the other skills (the atlas stays reachable from the Map). The **bell** keeps
decisions and the log; Home shows only the one decision that's waiting, if any.

Phone: a five-tab bottom bar (Home, Skills, Quests, Town, Journal) with **dots, not numbers**, and a dot only when
something can be done now (a quest to hand in, a site to finish, a decision waiting). The HUD card shrinks to portrait,
coins and the bell; settings and mute move into the portrait's menu.

Desktop: the top bar is the same five; the rail stays exactly as it is (it's the fastest way to switch skill).

### Alternatives

- **B, lighter touch:** keep seven desktop menus, but give phones five tabs (Home, Skills, Quests, Town, More) where
  More lists Hero, Guide and Settings. Fixes the phone, leaves desktop as is.
- **C, phone only cosmetic:** keep eight tabs but drop the number badges to dots and shorten labels. Least work, still
  crowded.

**Recommendation: the proposal above.** It's one model for both screen sizes, it matches how the town already works in
the fiction (the shop, the projects and the map are all in town), and every existing page keeps its content and save
keys; only where you reach it from changes. Routes, the Next step and quest links would follow automatically through
`UI.hubOf`, with redirects so old links (World, Village, Guide, Hero) still land in the right place.
