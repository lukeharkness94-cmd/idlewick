# Beast bonds and the November 10 UI update

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
