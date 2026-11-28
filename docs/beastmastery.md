# Beast bonds and the November 10 UI update

> **28 November 2026: Beastmastery captures mythical beasts.** Hunting is real game with lures (docs/hunting.md);
> Beastmastery catches the 30 mythical beasts below with a crafted capture tool and Cooking bait. Read "Mythical
> beasts" at the end first. "Captures and lucky eggs" (26 Nov) and the expedition rules above it are history where
> they disagree. Bonds, training, evolution, companions and hatching are unchanged.

Baseline: main at bc6d491b7a37fb8c471011795799e0e448d18a5a (8 November 2026). Changes are local; no publication or push.
## Decisions and tuning

- Existing companions, IDs, earned levels, signature bonuses and tricks remain. Four additional species offer one distinct passive each: Hearthwolf (5% critical chance), Bramble boar (8% coins), Duskwatch owl (10% XP), Honeyclaw (5% boss damage). Hero thresholds are 15/18/22/26. Their normal and evolved sprites are original code drawings.
- Ten bond levels use XP thresholds 0/25/100/300/750/1400/2400/3800/5600/8000. Victories share 25% of the hero's actual combat XP with the assigned beast. Losing, unassigned beasts and forecasts grant no bond. The existing offline cap and effective-work rules remain.
- Five milestones (2/4/6/8/10) add 0.6 percentage points each, totalling +3 points. This resolves the brief's approximate +1-per-milestone wording against its explicit +3 cap. At ten, the wolf's critical multiplier rises from 1.5 to 2; every species gains its evolved art state. Legacy signature multipliers retain levels 1–5 and gain 0.05 per level thereafter.
- Deliberate training spends 30 + 10 × bond-level coins and two units of the lowest-healing available cooked food, grants 150 + 50 × bond-level XP and starts a 45-minute per-beast wall-clock cooldown. It does not occupy the main task or generate reminders. Old endlessly repeating owned-beast training is retired; loading such a task stops it rather than spending supplies unexpectedly. Existing wooden-trap fieldwork remains separately accessible.
- Basic/iron/rune expeditions take 1/2/4 real hours. Basic costs 40 coins, iron 120, rune consumes one Rune trap (5% regional boss drop). Common/rare chances are 40/10%, 60/30%, 80/60%; misses return 5/10/20 coins and one species-specific track. Five misses guarantee the sixth expedition and consume five tracks. One expedition may be outstanding; its roll and absolute deadline are saved when sent.
- Sending, training and resolving use save-backed transactions. Failed persistence restores currency, ownership, bond, cooldown and expedition state for retry. Save version remains 2. Companion-field repairs do not relax core save validation.
- Hit strength follows the requested fixed species formula. Attack spacing follows expected ordinary hero DPS so support remains useful over the tested gear range. The cadence carries across consecutive encounters. Swapping resets its clock. This is a significant tuning choice: change `beastHeroDps` / `beastAttack` if playtesting suggests a fixed cadence instead.

## Balance evidence

Run `EVIDENCE=docs/beast-balance.json node scripts/sim-beasts.cjs`.

Sixteen seeded, 30-minute real-engine trials cover all four species at Hero 15/20/25/30, appropriate bronze/iron melee equipment, Power Strike and Brace. A high-HP ordinary target removes overkill, and progression is held fixed. Max-bond support is approximately **16.6–18.1% of hero DPS**, measured separately from hero damage (not percentage of combined damage). See the JSON for exact rows.

These are deliberately controlled fixtures, not normal player journeys. They do not establish every boss, unique-item build, magic or ranged balance. Overkill, missed opportunities on one-hit creatures and special abilities change realised contribution. Human testing must establish whether the added speed and companion choices feel worthwhile.

## Interface and journey changes

- Scholarship groups repeated named ranks in one card with visible rank buttons. Existing costs, gates, slots and study actions remain.
- Routine notification cards rise from the bottom right, above phone navigation; reduced motion removes the animation. Existing notification settings remain.
- Shared item routes select both recipe category and level band, clear Ready-only filters and focus the requested card. Locked skills include an exact-task preview. Farm routes select the crop/animal page; missing crops explain the required seeds and link directly to their shop card.
- Required regional travel has an explicit Travel & return button, uses the existing map journey animation, then returns to the selected task. It never starts work or bypasses a road/skill gate. The existing Back link preserves the originating quest/project.
- Farming reuses the actual plot, animal and supply controls inside code-drawn fields and fenced pasture. Pagination bounds mature farms; phone tabs switch Fields/Pens/Seeds/Livestock without page scrolling. Empty pens open their animal market directly.
- Claiming a quest replaces only its detail card with a same-size reward reveal. The surrounding list retains identity; deferred claim redraws are cancelled. Ready rows have a checkmark, Claim reward wording and a green edge.
- Town markers distinguish Repair, partial percentage, Deliver all (remaining resources affordable) and Complete. Fully delivered legacy projects can be completed without paying again.
- Enemy defeats briefly show the departing sprite and a named defeated caption before the next creature appears. Combat timing is unchanged. The skill activity marker is a left-edge strip, clear of the level. Mining output is a separate tray outside the sprite stack.

## Verification

Engine spec T1–T20 and T22: `node tests/beastmastery.cjs`. T8 sends/resolves 2,000 real attempts for each of six tier/rarity combinations (12,000 total), with pity isolated. Additional checks cover old max-XP migration, extended-task resume, failed return writes and forecast isolation.

T21: `node tests/beastmastery-ui.cjs`, with an isolated seeded test hero at 1280×720, 1440×900, 1920×1080 and 390×844 in both themes. Checks page overflow, action bounds, training payment/cooldown, owned/evolved art and locked recipe selection. Phone companion panes are exercised separately.

T23: `node tests/regression.cjs` (104 existing checks), `node tests/art-pixel.cjs` (8 checks), `node tests/desktop-storage.cjs`, `node tests/ui-current.cjs`, `node tests/ui-fit.cjs` and `node tests/ux-update.cjs`. Browser suites require a running preview and `IDLEWICK_URL`; ui-fit accepts `CHROMIUM_PATH` for a system browser. Layout measurements wait for page-entry transforms to settle.

Browser fixtures grant test resources explicitly; they are not evidence of normal progression speed. The UX suite exercises exact recipe routes, animated regional return, mining output, rail marker placement, bottom notifications, in-card quest rewards, live enemy defeat feedback, seed shop routing, project readiness, grouped research ranks and phone planting/pen navigation.

## Remaining human/platform checks

Observe whether players understand fieldwork versus expeditions, choose beasts for their passives, notice deaths between identical enemies and can follow a missing ingredient through travel back to its objective. Check whether 45-minute training and 1–4-hour expeditions feel rewarding without obligations. Observe a mature farm and full research collection using real player saves. No human enjoyment or retention results are claimed.

Windows/macOS native packaging, a real Steam App ID, Cloud setup and cross-device conflict testing remain release work. Browser/storage tests do not validate Steam Cloud.

## Captures and lucky eggs (26 November 2026)

Owner decision, chosen verbatim: "Capture replaces expeditions: Beastmastery gets a Capture task like a hunt (track →
set live trap → coax), but a success keeps the animal instead of killing it. Any animal you've hunted in a reached
ground can be caught; better Beastmastery = better odds. Eggs become rare random drops from combat and all skills.
Expeditions go (one already out still comes back)." Hunting now has one ground with tier tabs, so "in a reached
ground" became "any animal you have hunted".

- **Capture task** (`js/beast_capture.js`, `KIND_EXT.capture`, id = creature id). Steps: Tracking 40%, Setting the
  live trap 30%, Coaxing 30% of the cycle. Cycle 8 s + 0.09 s per Hunting level of the animal, then the usual speed
  bonuses and the Captures field-guide entries (2% faster each).
- **Who can be caught**: an animal with a kill on record (`S.beast.kills`), from any town. Animals not yet hunted show
  as blacked-out ??? cards with "Hunt one first".
- **Odds**: 55% + 2.5% per Beastmastery level above the animal's Hunting level, between 35% and 90%.
- **Kit**: Beginner wooden trap; Intermediate and Skilled padded live trap; Expert and Master rune trap. The trap goes
  home with the animal you keep and is not used otherwise. From Intermediate up, one of the hunting tier's bait per try
  (scent bait, honey bait, smoked lure, moonlit lure). Running out stops the task with the reason.
- **XP**: Beastmastery XP on the same scale as Hunting (`8 × (5 + 0.35 × level) × cycle/8 s × (1 + animal level/100) /
  0.75`); an escape pays 30%. Expected XP per hour is about 95% of hunting the same animal at the same level (for
  example 21.2k against 21.9k at level 3 on the chicken, 232k against 244k at level 80 on the griffin, before skill
  multipliers).
- **A success** keeps the animal as `wild_<id>` straight in a pen (`DQ.awardPet(id, { hatched: true, quiet: true })`,
  no egg), with a beast event, a journal line and a "Caught" note offering Make companion. If you already own that
  beast, it is checked over and let go: full XP, no duplicate, trap kept. Captures never add bond XP.
- **Never in forecasts.** Offline catch-up uses the same task, and offline captures appear in Welcome Back as beast
  events. Live-sized steps and one long catch-up give the same result (tests/beast-capture.cjs).
- **Expeditions**: `DQ.sendBeastTrap` always refuses; the Trapper's tab is gone (the ranch has Ranch and Capture). An
  expedition saved before this still resolves once at its deadline, with its original odds and pity, and its line
  shows on the ranch card and the Capture tab until then.
- **Lucky eggs**: every skilling action has a 1 in 2,000 chance and every victory or catch a 1 in 500 chance of an
  egg. The egg is one of the former Trapper beasts (Hearthwolf, Bramble boar, Duskwatch owl, Honeyclaw) that you do
  not own or already have in the hatchery, whose Hero level you have reached and whose town you have visited, chosen
  evenly. Hooks: `DQ.petRoll` for gathering, making, thieving, sailing and harvests; `DQ.killHooks` for fights and
  hunt catches; and the fieldwork, drill and capture tasks. Never in forecasts. The Collection page shows each beast's
  odds per action and per fight. The skill pets, harvest, boss, signature wild beasts and fieldwork eggs are unchanged.

Verification: `tests/beast-capture.cjs` (browser, isolated hero with granted levels and items) covers the gate, odds and
bounds, keeping once, letting go, failures, kit and stopping, forecasts, offline parity, save and reload, the old
expedition resolving once, egg hooks and rates, Collection odds and the Capture tab. These are scripted checks, not
human playtesting: whether captures feel worth it and how often lucky eggs land in real play needs players.


## Mythical beasts (28 November 2026)

Owner: "There should be NO animals the same in either ... The beastmastery should be mythical creatures you can
capture with hard work, high skill etc ... Beastmastery should use traps with bait in them and require you to have
physical traps or leashes or some other thing you can capture - again, something you should have to craft to be able
to do. The higher level you are, the easier the lower creatures become." Answers: companions already caught from
ordinary animals: "Get rid."

- **The beasts** (`js/hunt_tiers_data.js` `D.MYTHS`): 30 mythical creatures in the five tiers by Beastmastery level,
  none of them a hunting animal or a combat creature. They are not `D.MON` creatures (nothing fights or hunts them);
  their art is the old creature drawing under the same id where one existed (thimblefox, griffin, firebird...) or a
  new builder recipe (cockatrice, will-o'-wisp, kelpie, kirin, sphinx cub), with front and side views registered by
  js/pixel_views.js. A beast stays ??? until you have tried to catch one or own one.
- **Capture** (`js/beast_capture.js`, `KIND_EXT.capture`, id = beast id): Tracking 40%, Setting the trap 30%, Coaxing
  30% of the cycle (8 s + 0.09 s per Beastmastery level of the beast). It needs Beastmastery at the beast's level, the
  crafted tool that suits its kind (`D.CAPTURE_TOOLS`) and its tier's bait (`D.CAPTURE_BAIT`, Cooking → Bait). One
  bait per try, caught or not; the tool goes home with the beast you keep; a beast you already own is checked over and
  let go for the XP (tool kept). Running out of either stops the task with the reason.
- **Odds**: 55% + 2.5% per Beastmastery level above the beast, between 35% and 90%, so the lower beasts get easier as
  you rise. XP as before (an escape pays 30%).
- **Companions**: each beast is a `wild_<id>` companion (js/beastmastery_data.js) with one bonus that grows with its
  tier (2% to 6%: damage, less damage taken, coins, XP or task speed). Thimblefox, tideglass skitter, candletoad and
  prism kite are still their regions' signature beasts, so Fieldwork's wooden traps can still leave their eggs.
- **Ordinary animals**: the hunting animals have no companions any more (their `wild_` entries are removed), and a
  companion caught from an ordinary animal is let go on load with a note in the log; an egg of one is dropped too.
  Nothing else about the hero changes. The four bond species (Hearthwolf, Bramble boar, Duskwatch owl, Honeyclaw)
  stay as lucky-find eggs; whether a boar and a bear among the ranch's pets clash with the hunting ground's wild boar
  and bears is a question for the owner.

| Beast | Beastmastery | Tier | Kind | Capture tool | Bait | As companion |
|---|---|---|---|---|---|---|
| Thimblefox | 2 | Beginner | Small beasts | Wooden trap | Seed cake | +2% damage |
| Bellhare | 5 | Beginner | Small beasts | Wooden trap | Seed cake | 2% less damage taken |
| Candletoad | 8 | Beginner | Small beasts | Wooden trap | Seed cake | +2% coins from every source |
| Tideglass skitter | 11 | Beginner | Small beasts | Wooden trap | Seed cake | +2% XP to every skill |
| Hearth hare | 14 | Beginner | Small beasts | Wooden trap | Seed cake | Every task is 2% faster |
| Cockatrice | 17 | Beginner | Winged beasts | Fowling net | Seed cake | +2% damage |
| Prism kite | 21 | Intermediate | Winged beasts | Fowling net | Scent bait | 3% less damage taken |
| Will-o’-wisp | 24 | Intermediate | Spirits | Warded snare | Scent bait | +3% coins from every source |
| Chimehorn | 27 | Intermediate | Hoofed beasts | Rope halter | Scent bait | +3% XP to every skill |
| Glassback | 30 | Intermediate | Small beasts | Padded live trap | Scent bait | Every task is 3% faster |
| Kelpie | 33 | Intermediate | Hoofed beasts | Rope halter | Scent bait | +3% damage |
| Moon hare | 36 | Intermediate | Small beasts | Padded live trap | Scent bait | 3% less damage taken |
| Selkie | 39 | Intermediate | Small beasts | Padded live trap | Scent bait | +3% coins from every source |
| Hippogriff | 42 | Skilled | Winged beasts | Fowling net | Honey bait | +4% XP to every skill |
| Mirelight stag | 45 | Skilled | Hoofed beasts | Rope halter | Honey bait | Every task is 4% faster |
| Ember salamander | 48 | Skilled | Spirits | Warded snare | Honey bait | +4% damage |
| Nimbus grazer | 51 | Skilled | Hoofed beasts | Rope halter | Honey bait | 4% less damage taken |
| Kirin | 54 | Skilled | Hoofed beasts | Rope halter | Honey bait | +4% coins from every source |
| Basilisk hatchling | 57 | Skilled | Fierce beasts | Iron-jaw cage | Honey bait | +4% XP to every skill |
| Firebird | 60 | Expert | Winged beasts | Starwoven net | Smoked bait | Every task is 5% faster |
| Unicorn | 63 | Expert | Hoofed beasts | Mithril halter | Smoked bait | +5% damage |
| Griffin | 66 | Expert | Fierce beasts | Iron-jaw cage | Smoked bait | 5% less damage taken |
| Phoenix chick | 69 | Expert | Spirits | Rune trap | Smoked bait | +5% coins from every source |
| Sphinx cub | 72 | Expert | Fierce beasts | Iron-jaw cage | Smoked bait | +5% XP to every skill |
| Thunderbird | 76 | Expert | Winged beasts | Starwoven net | Smoked bait | Every task is 5% faster |
| Star stag | 81 | Master | Hoofed beasts | Mithril halter | Moonlit bait | +6% damage |
| Kraken calf | 84 | Master | Fierce beasts | Iron-jaw cage | Moonlit bait | 6% less damage taken |
| Sun phoenix | 87 | Master | Spirits | Rune trap | Moonlit bait | +6% coins from every source |
| Celestial unicorn | 91 | Master | Hoofed beasts | Mithril halter | Moonlit bait | +6% XP to every skill |
| Eclipse roc | 95 | Master | Winged beasts | Starwoven net | Moonlit bait | Every task is 6% faster |

Capture tools:

| Tool | Recipe | Inputs |
|---|---|---|
| Wooden trap | Crafting 2 | 2 logs, 1 leather string |
| Padded live trap | Crafting 20 | 2 oak planks, 3 fur pelt, 2 leather string |
| Fowling net | Crafting 14 | 4 leather string, 2 down |
| Starwoven net | Crafting 60 | 2 mithril bar, 2 maple planks, 6 down, 6 leather string |
| Rope halter | Crafting 26 | 3 leather string, 2 deer hide |
| Mithril halter | Smithing 60 | 3 mithril bar, 3 deer hide, 2 antler |
| Iron-jaw cage | Crafting 52 | 3 mithril bar, 2 maple planks, 1 bear pelt, 2 horn, 3 leather string |
| Warded snare | Crafting 24 | 3 leather string, 10 arcane rune, 1 antler |
| Rune trap | Crafting 55 | 2 maple planks, 1 mithril bar, 1 sapphire, 10 arcane rune, 2 antler |

Bait (one per try):

| Bait | Cooking | Makes | Inputs |
|---|---|---|---|
| Seed cake | 4 | 6 | 1 bread, 2 potato seeds |
| Scent bait | 18 | 6 | 2 raw rabbit, 1 onion |
| Honey bait | 38 | 6 | 1 honey, 1 wheat, 1 tallow |
| Smoked bait | 58 | 6 | 2 raw venison, 1 maple logs, 1 goldleaf herb |
| Moonlit bait | 78 | 6 | 2 raw beef, 1 moonmelon, 5 arcane rune |

Verification: `tests/beast-capture.cjs` (the gate, odds and bounds, keep once, let go, failures spend bait, the tier
kit and stopping, ordinary-animal companions let go on load, forecasts, offline parity, save and reload, the old
expedition, eggs, Collection odds, the Capture tab), `tests/hunting-loop-ui.cjs` (the fowling net route) and
`tests/art-pixel.cjs` (front and side views for all 30, each its own drawing). Scripted checks with granted levels and
items, not playtests: whether the higher beasts feel like hard work worth doing needs players.
