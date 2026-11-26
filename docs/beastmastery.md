# Beast bonds and the November 10 UI update

> **26 November 2026: captures replace expeditions.** The owner split the two skills: Hunting goes out to trap and
> kill animals for their drops; Beastmastery catches animals alive and keeps them. Read "Captures and lucky eggs"
> at the end first. The expedition rules below are history: nothing can be sent any more, and an expedition already
> out still resolves once at its saved time. Bonds, training, evolution, companions and hatching are unchanged.

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
