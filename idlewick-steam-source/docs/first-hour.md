# First hour and returning players (Nov 2026)

## How this was checked

- `node scripts/sim-opening.cjs`: fresh-save engine simulation of a purposeful beginner (minutes to each combat level,
  Grubnash forecast).
- `MIN=60 node scripts/play-first-hour.cjs` (new): a scripted beginner in the real page that follows Home's Next
  step, closes pop-ups, and logs every pop-up, notification, stopped task and Next-step change.
- A six-hour absence: a mid-opening save with its clock moved back, reloaded to read the welcome-back summary.

These are automated results. They show what the systems do for a player who follows the guidance; they are not
player feedback. Human sessions should still follow `docs/playtest-plan.md`, especially for how the first hour feels.

## What the walkthrough found, and the fixes

| Found (automated) | Fix |
|---|---|
| "Train for Grubnash" sent a beginner to fight chickens with no cooked food; a 10-health hero was knocked out every few minutes, ending each training run. | Next step asks for food first when food heals less than your health: catch about a dozen fish, cook them, then train. The same rule covers every region's training (`DQ.foodStep`). |
| An idle beginner trains only Strength (the starting focus): Attack 1 and Defence 1 at combat 8, so they miss constantly. | When Attack, Strength or Defence falls three levels behind, the step names it and one click switches the training focus and starts the fight. |
| The boss forecast cache ignored food under 20 health and current health, so "Challenge Grubnash" stayed up after defeats left the pack empty (five losses in a row). | The cache key follows food relative to your health, current health, abilities and training focus. |
| After a first boss victory the fight restarted at once at low health, so the win was often followed by a defeat. | A first boss victory ends the fight; later repeat fights for loot are unchanged. |
| Combat XP counted overkill damage (a 30-damage hit on a 4-health goblin paid for 30). Six hours on goblins took Strength 9 to 50 and Hero 9 to 50. | XP counts damage up to the creature's remaining health. The same absence now gives Strength 9 to 34. The opening's combat 8 moves from 25 to 27 minutes; coin milestones are unchanged (`sim-economy.cjs 24`). |
| "Equip your…", "Wear your…", "Switch to your…" and "Slot …" steps only opened a page; "Challenge …" opened Combat, where the boss is behind a pop-up. | Those steps act directly: equip the item, slot the ability, start the boss fight. |
| "Rest to full health first" flickered with "Slot Power Strike" every 30 seconds while training. | Rest advice waits for 60% health while you are fighting something else (90% otherwise). |
| A new skill brought two pop-ups in a row ("Cooking unlocked", then "Cooking: getting started"); eight pop-ups in the first ten minutes. | The skill's quick guide rides inside its unlock pop-up and counts as seen; five pop-ups in the first thirty minutes. |

## After

Guided beginner, first hour: First Steps in 1 minute, Grubnash defeated first try at about 30 minutes (after
equipping bronze, slotting Power Strike and cooking food), the next main quest offered, Hero 11 and combat 10 at the
hour, one knock-out in Mossbarrow. Levels arrive about every 90 seconds early on, slowing naturally.

Returning after six hours: the welcome-back summary shows the task, the two-hour taper, XP, coins, loot, level-ups,
three away decisions (duel, pedlar, trader), a discovery and journal lines, then Home's Next step.

## Still worth a human look

- Whether a skill level-up card every 90 seconds early on feels rewarding or noisy.
- Whether the food-before-training step reads as care or as a chore.
- How players feel about the welcome-back decisions after short versus long absences.
