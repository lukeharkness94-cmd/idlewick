# Idlewick Part C · Original brief

The original Part C instructions below cover Tasks 17–26. Reproduce each finding against current main before editing. The evidence described below comes from the historical scripted run.

PART C - FINAL LIVE PLAYTHROUGH FINDINGS (DO AFTER PART B)
======================================================================

HOW PART C WAS PRODUCED - READ THIS BEFORE STARTING PART C
WHERE TASKS 17-26 COME FROM - THE EVIDENCE BASE
A final live playthrough was completed after the Part B
research and the first live playthrough.
Method, so you do not over-claim from it: the game was played in
real Chromium (headless, via Playwright) against the repo's own
preview server, from a scratch copy, with a fresh browser profile
and a fresh Sword hero ("Playtest"), following the Home screen's
"Next step" guidance and closing pop-ups as a player would.
In-game time was fast-forwarded with the repo's own
`DQ.advanceTime` harness (as in `scripts/play-first-hour.cjs`),
so every timing below is a SIMULATED in-game minute in a real
browser, NOT a real minute of wall-clock play.
Coverage: the full first hour live; a phone-width pass at 390px;
a welcome-back return after a simulated 6-hour absence on a
throwaway profile; and a fixture-loaded mid-game look (all skills
set to 60,000 XP, 8,000 coins, town set to Saltmere, Hero 52 /
Combat 29) used ONLY to observe Map / Combat / Quests / Projects
at that stage - that fixture state was not earned in play.
NOT covered, so do not claim findings about them: hours 2-5 of
earned play, Bow and Staff starters, real-time unaccelerated
session feel, audio, the Steam desktop build.
Zero page errors and zero console errors were observed in every
pass. Any scripted run you add must report errors the same way,
and any new error is a failure of that task.

======================================================================
TASK 17 - Fix the first-hour harness: it cannot click the patrol
(Final report Finding 1 - MAJOR. Do this task first.)
======================================================================
WHAT WAS FOUND, EXACTLY:
`scripts/play-first-hour.cjs` only clicks journey buttons whose
`data-do` value is in this allow-list:
  ['journeytask', 'qstart', 'qclaim', 'act', 'huntarea',
   'journeyfight', 'journeytrain', 'equip', 'abil']
The real guided path at about 6.5 simulated minutes presents a
Next step called "Patrol the east farms" whose button is
`data-do="huntquest"`. `huntquest` is NOT in the allow-list.
So the script never clicks it. It stays on Mudlings for the rest
of the hour and never challenges Grubnash.
CONSEQUENCE YOU MUST STATE IN YOUR PR: because the repo's own
script cannot play the guided path past about 6 minutes, the
claim in `docs/first-hour.md` that Grubnash is defeated first try
at about 30 minutes is CURRENTLY UNVERIFIED. It is not confirmed
and it is not disproved. Do not repeat it as a fact anywhere.
THIS IS A HARNESS BUG, NOT A GAME BLOCK. PROOF FROM A SEPARATE
TARGETED RE-CHECK RUN: clicking "Patrol the east farms"
(`data-do="huntquest"`, target goblin) manually switched the
current fight from Mudling to Goblin; Goblin Menace then
completed 6/6 and was claimed by about 7 minutes; a
"Train Defence for Grubnash" step (`data-do="journeytrain"`)
appeared at about 7.5 minutes; a new quest, Chief's End, was
accepted at about 10.5 minutes; Combat 8 was reached at about
15.5 minutes. That re-check run ended at Hero 7, Combat 8,
1,798 coins, with Goblin Menace done and Chief's End active.
DO EXACTLY THIS:
1. Add `huntquest` to the allow-list in
   `scripts/play-first-hour.cjs`.
2. Do NOT stop there. Audit the whole game for every other
   journey / Next-step `data-do` value that a guided-path button
   can carry, and compare that full list against the harness
   allow-list. Add any other missing value that the Home
   Next-step guidance can present in the first hour, and list
   every value you added, with the button text that carries it.
   If you find a `data-do` value that is deliberately not part
   of the guided path, name it and say why you left it out -
   do not add values blindly just to make the list longer.
3. Re-run the fixed harness for a full simulated first hour.
4. In the PR, report the re-run's end state in the same shape as
   the broken run's end state, so they can be compared:
   broken run was Hero 10, Combat 11, 4,562 coins, 17 inventory
   items, First Steps done, The Hungry Cook done, Goblin Menace
   still active at 0/6, Grubnash never challenged, 1,278 Mudlings
   defeated. Your re-run must state, explicitly: did Goblin
   Menace complete, at what simulated minute was Grubnash first
   challengeable, was Grubnash actually challenged, and was he
   defeated - and at what simulated minute.
5. Update `docs/first-hour.md`: replace the unverified
   "about 30 minutes" wording with whatever the fixed re-run
   actually shows, labelled as a scripted simulated-time result,
   or, if Grubnash was still not reached, leave the claim marked
   UNVERIFIED with the reason. Do not soften this.
DO NOT: change any game balance, quest requirement, or combat
number to make the re-run reach Grubnash. This task fixes the
measuring instrument, not the game. If the fixed harness shows
a genuine game-side problem, report it as a finding and stop.
TESTS / PROOF: the harness run itself is the proof. Attach its
log. Zero page / console errors. Full test suite passes.

======================================================================
TASK 18 - Build the "Before Grubnash" checklist step
(Final report Finding 4 - MAJOR. Entirely new: no earlier task
specifies a pre-boss gear / ability / food checklist step.)
======================================================================
WHAT WAS OBSERVED AT 60 SIMULATED MINUTES, FOLLOWING NEXT STEP:
- Equipment: 1 of 7 slots filled - the starting weapon only.
  No armour was ever equipped in the whole hour.
- Ability slots: 0 of 2 filled. Power Strike, which unlocks at
  Melee 8 and was therefore available from about 19 minutes,
  was never slotted. On the Combat page the two slots read
  "Empty - Choose an ability", with only a small "Manage" link
  and no nudge anywhere.
- Coins: 4,562, accumulated from a 25-coin start, never spent.
- Boss: Grubnash's card on the Combat page read "Ready" and he
  was never challenged.
- For reference, the Combat page at that point showed about
  2.43 DPS, 86% hit chance, max hit 10, and "Food lasts
  approx. 60 min" - the information exists; the guidance to
  act on it before the boss does not.
WHY THIS HAPPENS: the game never spends the player's money and
never changes the player's loadout for them, which is polite -
but the result is a player arriving at the first boss
under-geared without ever having been told to gear up.
DO EXACTLY THIS:
1. Add ONE new guided step to the existing journey / Next-step
   system, shown once the player is on the Grubnash path and
   Combat 8 is reached (or at whatever point the fixed Task 17
   re-run shows Grubnash becoming challengeable - use that
   trigger, and state which trigger you used). Title it in the
   game's own voice, on the pattern of "Before Grubnash".
   Build it INSIDE the existing Next-step system. Do not build
   a new tutorial system, a new screen, or a new quest type.
2. The step is a short checklist with three items, and each
   item must ACT DIRECTLY from the step itself, in the same
   way the existing equip / slot Next steps already act -
   a button that does the thing, not a button that merely
   opens a page where the thing could be done:
   a) ARMOUR: if any armour slot is empty AND the player owns
      a wearable piece for it, the button equips it. If the
      player owns nothing wearable, the button takes them to
      the specific shop stock that fills an empty slot, with
      the cheapest suitable piece identified - it must NOT
      buy anything automatically and must NOT spend coins
      without the player's own click on the purchase.
   b) ABILITY: if an ability slot is empty AND an ability is
      unlocked (Power Strike is the expected case), the button
      slots it. If more than one ability is unlocked, slot the
      first unlocked one and let the player change it via the
      existing Manage route.
   c) FOOD: show how much healing food the player is carrying
      and whether auto-eat is on, in the same terms the Combat
      page already uses ("Food lasts approx. X min"). If they
      carry no food, the button points at cooking or buying
      food - again, no automatic purchase.
3. Each checklist item shows a live done / not-done state and
   ticks itself off when satisfied, including when the player
   satisfies it by any other route (equipping armour from the
   inventory screen must tick item (a) without revisiting the
   step).
4. The step must be SKIPPABLE in one click, and skipping it
   must never block the boss. A player who wants to fight
   Grubnash in a bronze sword and no armour may do so.
5. Once the checklist is done or skipped AND Combat 8 is
   reached, the Home Next step must become the Grubnash
   challenge itself - not another patrol or training loop.
   (In the broken-harness run the Next step was still
   "Patrol the east farms" at 60 minutes. Task 17 explains
   part of that; this item covers the game-side guidance
   once the patrol is genuinely complete.)
DO NOT: auto-buy equipment, auto-spend coins, force the
checklist, change Grubnash's stats, or change any drop rate.
This task changes guidance, not difficulty.
TESTS / PROOF: (1) a scripted state with empty armour slots, an
owned wearable piece, an empty ability slot and Power Strike
unlocked shows the step with (a) and (b) unticked, and using
its buttons ticks both; (2) equipping via the inventory screen
ticks (a) too; (3) skip dismisses the step and the boss stays
challengeable; (4) with Combat 8 reached and the step done or
skipped, Home's Next step is the Grubnash challenge; (5) no
coins are spent by any checklist button - assert the coin
total is unchanged after using buttons (a) and (b).

======================================================================
TASK 19 - Fix the rarity words: "Epic" drops are commoner than
"Rare" drops (Final report Finding 2 - MAJOR, residual slice)
======================================================================
SCOPE LINE - READ CAREFULLY: Task 12 in this prompt already specifies the
notification digest, loot batching, and the ban on unnamed
"Rare drop!" / "Epic drop!" notes. Do NOT redo any of that.
This task is ONLY about the rarity tiers themselves: their
names, their order, and their actual frequencies. No earlier
task audits the drop tables or the tier definitions.
WHAT WAS OBSERVED IN 60 SIMULATED MINUTES - 272 notes / modals
in total, of which the loot notes were:
  - 91 x "Epic drop!"
  - 87 x "Rare drop!"
  - 5 x "Treasure chest!"
That is 183 loot notes. "Epic" fired MORE often than "Rare".
A tier called Epic that is the most common special drop in the
game makes both words meaningless, and no amount of digest
batching fixes that, because the batched summary would still
be labelling routine loot as epic.
DO EXACTLY THIS:
1. Audit the actual drop / rarity definitions in the code:
   for every rarity tier, list its name, what qualifies for
   it, and its real probability or frequency, per source if
   it varies by source. Put that table in the PR. Do not
   work from the note counts alone - the counts are the
   symptom, the definitions are the cause. Note in particular
   whether "Epic" and "Rare" are rolled independently (so
   both can fire often) or are bands of one roll.
2. Fix the inversion, choosing ONE of these two routes and
   justifying the choice in the PR from the audit table:
   ROUTE A - REBALANCE THE FREQUENCIES: change the tier
   thresholds / probabilities so the tiers are strictly
   ordered by rarity - every higher-named tier is genuinely
   rarer than the one below it, and the top tier is rare in
   absolute terms across a normal first hour (single-digit
   occurrences, not dozens).
   ROUTE B - RENAME THE TIERS: if the frequencies are the
   intended design, rename / reorder the tier labels so the
   words match the frequencies - the commonest special tier
   gets an ordinary word, and "Epic" (or its replacement) is
   reserved for the rarest band.
   Whichever route you pick, the end state must satisfy this
   rule: reading the tier names in order, each name implies
   "rarer than the previous one", and the observed frequencies
   agree with that order. Do not pick a route that leaves the
   names and the frequencies disagreeing.
3. "Treasure chest!" (5 occurrences) was the only one of the
   three that behaved like a rare event. Keep its relative
   rarity in whichever route you choose, unless the audit
   shows it belongs to a different system entirely - if so,
   say so and leave it alone.
DO NOT: change total loot value, total item counts dropped,
or XP. If Route A changes WHICH items drop (not just which
label they carry), stop and report that before proceeding -
reclassifying a label is in scope, rebalancing the economy
is not. Coordinate with Task 12's identical-totals proof if
that task has already landed: the totals it protects are
item totals, and this task must not break them.
TESTS / PROOF: (1) a test or sim over a scripted first hour
(or an equivalent fixed-seed drop sample, state which) that
counts occurrences per tier and asserts the strict ordering;
(2) the audit table from step 1, before and after; (3) item
drop totals unchanged, shown numerically.

======================================================================
TASK 20 - Cap offline gains to the player's actual progress
(Final report Finding 3 - MAJOR, residual slice)
======================================================================
SCOPE LINE - READ CAREFULLY: Task 10 in this prompt already decides the
offline MODEL - the stated cap at full rate, the single
Welcome Back panel, per-activity cards, stop reasons, and
Continue auto-resuming. Do NOT re-open that decision, do NOT
reintroduce a taper, and do NOT redo the Welcome Back layout.
This task adds a SECOND, independent limiter that Task 10 does
not contain: a ceiling based on how far the player has
actually progressed through the game's content.
WHAT WAS OBSERVED, EXACTLY: a hero with TWO minutes of play
was returned after a simulated 6-hour absence (counted as
4 hours of work under the then-current model). That hero came
back as Hero 26, with Fishing 29, +91,400 Fishing XP, +728
coins and 9,132 raw shrimp - while the First Steps quest was
still sitting at "Chop five logs 0/5". For comparison, a full
hour of ACTIVE play reached only Hero 10. Absence out-levelled
active play by 16 hero levels and left the returner
over-levelled for every piece of content and every quest,
with nothing left that matched their level.
THE PROBLEM IS NOT THE RATE AND NOT THE CAP. It is that
offline progress is decoupled from story / region progress:
the game keeps paying out on the one activity a brand-new
player happened to leave running, at unlimited depth, into
content the player has never unlocked or seen.
DO EXACTLY THIS:
1. First, write down the current rule precisely: what decides
   how much XP and how many items an offline activity earns,
   and confirm there is currently no progress-based ceiling.
   Cite the code. This is your before-state.
2. Design a PROGRESSION-RELATIVE CEILING with this shape:
   - Offline earnings for a skill stop (that skill pauses;
     the absence is not deleted and other skills are not
     affected) when that skill reaches the highest level
     requirement of the content the player has actually
     UNLOCKED - where "content" means the bosses beaten or
     challengeable, the regions unlocked, and the main-quest
     stage reached, using whichever of those gates the code
     already tracks for that skill.
   - Items from that activity stop accumulating at the same
     moment its XP stops. Do not cap XP and keep paying
     items, or the 9,132-shrimp half of the problem survives.
   - The ceiling applies per skill, not globally: a player
     who has genuinely unlocked deep Fishing content keeps
     earning deep Fishing progress offline. This must only
     bite a player whose levels are running ahead of their
     unlocked content.
3. APPROVAL GATE: if the code has no existing gate that maps
   cleanly onto a skill (step 2's "whichever gates the code
   already tracks" comes up empty for some skill), do NOT
   invent an arbitrary XP number or level number for it.
   Implement the ceiling for the skills where a real gate
   exists, list the unmapped skills in the PR, and leave
   those for my decision with your proposed formula.
4. The Welcome Back screen must SAY when the ceiling bit, in
   the same plain style as its stop reasons - on the pattern
   of "Fishing stopped at level X - that is as far as your
   current quests and regions reach. Beat a boss or unlock a
   region to push it further." Naming the way to raise the
   ceiling is required, not optional: a silent stop reads as
   a bug, a named gate reads as a goal. (This is one added
   line inside Task 10's screen, not a redesign of it.)
5. Add the explicit playtest scenario the report asks for,
   as an automated fixture, not just a note: "close after
   the tutorial, return tomorrow" - a hero with about
   2 minutes of play, First Steps incomplete, left fishing
   shrimp, returning after a simulated 6 hours and after a
   simulated 24 hours. Assert what that hero comes back as.
DO NOT: change the offline rate, the stated cap from Task 10,
active-play XP rates, or any quest requirement. Do not punish
absence in wording anywhere - the ceiling is a gate, not a
penalty, and no earned progress is ever removed by it.
TESTS / PROOF: (1) the step-5 fixture, before and after: the
after-state must NOT be Hero 26 / Fishing 29 / 9,132 shrimp
from a 2-minute-old save - report the actual after numbers;
(2) a counter-fixture proving a player who HAS unlocked the
relevant content still earns offline progress past the point
where the new player stopped; (3) the ceiling line appears
on Welcome Back exactly when, and only when, a skill hit it;
(4) Task 10's counted-time tests (1h, 6h, 12h, beyond cap)
still pass - the two limiters compose, counted-time first,
progression ceiling second.

======================================================================
TASK 21 - Live notes must auto-dismiss and must never cover
actionable combat UI (Final report Finding 5 - MINOR,
residual slice)
======================================================================
SCOPE LINE: Task 12 in this prompt already routes routine events to a
quiet digest and bans routine modals. Do NOT redo the digest,
the categories, or the settings. This task covers what Task 12
does not mention: the LIFETIME and the SCREEN POSITION of the
live notes that remain - they currently never go away on their
own, and they sit on top of panels the player needs to use.
WHAT WAS OBSERVED, EXACTLY:
- The "Hero level 9!" note, created at 37.6 simulated minutes,
  was STILL on screen at 61 minutes - sitting over the Food
  panel on the Combat page, and later over the Shop detail
  panel. It survived for more than 23 minutes.
- A "Woodcutting levels 2-3!" note covered the "Unlocks ahead"
  panel at 5 minutes.
- Notes rise from the bottom-right of the screen and stay
  until the player closes each one manually.
DO EXACTLY THIS:
1. Every live note that is not a decision the player must make
   auto-dismisses after a few seconds (pick a value between
   4 and 8 seconds, use ONE value consistently, state it in
   the PR). Dismissal removes the overlay only - the entry
   stays in the bell / history / digest exactly as it does
   today. Nothing is lost by auto-dismissing.
2. Notes must never render over the Combat page's Food panel
   or ability slots while the player is in combat. Implement
   this as a placement rule, in whichever way the existing
   layout makes cleanest: move the note stack to a screen
   area that holds no actionable controls on that page,
   shrink / restack it, or suppress the overlay (but not the
   history entry) while the Combat page is open. State which
   you chose. The test that matters is the observed one: a
   level-up note firing during combat leaves the Food panel
   fully visible and clickable.
3. Cap how many live notes can be visible at once (a small
   number - 3 is a sensible default; if you pick another,
   justify it). Notes beyond the cap go straight to history
   without ever overlaying. A burst of simultaneous events
   must not produce a tower of overlays.
4. Notes that ARE decisions or story beats are exempt from
   auto-dismiss - but those should already be modals under
   the existing rules, not notes. If you find a note type
   that genuinely needs the player's input, list it in the
   PR instead of silently exempting it.
DO NOT: delete history entries, change what events generate
notes, or change note wording (Task 19 covers rarity words).
TESTS / PROOF: (1) a note created in a test is gone from the
overlay after the chosen timeout and still present in
history; (2) the combat occlusion check from step 2 - a
screenshot or DOM-geometry assertion that the note stack and
the Food panel do not overlap on the Combat page; (3) firing
10 notes at once never shows more than the cap on screen.

======================================================================
TASK 22 - Put a live progress counter on the patrol Next-step
card itself (Final report Finding 10 - MINOR, residual slice)
======================================================================
SCOPE LINE: Task 9 in this prompt already requires the one main quest's
numeric progress to be visible on Home. Do NOT redo the quest
log or the tracker. This task is about ONE specific card that
Task 9 does not name: the Next-step ACTION card for
"Patrol the east farms" - the card the player actually clicks
and watches while doing the patrol.
WHAT WAS OBSERVED, EXACTLY: the patrol card shows NO x/y
counter and NO progress bar, on desktop OR on the 390px phone
layout - while other steps do show counters (First Steps
showed "Catch 5 shrimp 5/5" and "Chop 5 logs 0/5" on its card).
So while fighting goblins, the player cannot tell how close
the patrol is to done. In the main run the underlying quest,
Goblin Menace, sat at 0/6 the whole hour; in the Task 17
re-check it completed at 6/6 - the target is 6.
DO EXACTLY THIS:
1. Add the same live counter style the First Steps card
   already uses to the patrol Next-step card: current /
   target, updating as each goblin is defeated, without the
   player leaving the page or opening the quest log.
2. Drive the counter from the SAME quest-progress value the
   quest log uses for Goblin Menace - one source of truth.
   Do not add a second counter that can disagree with it.
3. Audit the other Next-step action cards of the same kind
   (hunt / patrol / journey steps in the first two hours)
   for the same gap: any card whose underlying objective is
   a countable number of kills, catches, crafts or deliveries
   gets the same counter treatment. List every card you
   changed and every countable card you found already correct.
   Cards whose objective is genuinely not countable (reach a
   place, talk to a person) are exempt - name them as exempt.
DO NOT: change the patrol's target (6), its rewards, or which
quest it advances.
TESTS / PROOF: (1) counter reads 0/6 before the patrol starts,
increments per goblin, and reads 6/6 at completion, matching
the quest log at every step; (2) the same check at 390px
width; (3) zero horizontal overflow at 390px, as before.

======================================================================
TASK 23 - Shop: stop showing a new hero all ten tool tiers
(Final report Finding 8 - MINOR, residual slice)
======================================================================
SCOPE LINE: Task 14 in this prompt already specifies Buy 1 / Buy 10 /
Buy Max inline, lock reasons on buttons, inventory search,
tabs and bulk-sell. Do NOT redo any of that. This task is
ONLY about which stock is VISIBLE by default - a question
Task 14 never asks.
WHAT WAS OBSERVED, EXACTLY: a brand-new hero opening the
Shop's tool stock sees all ten tiers at once - Copper through
Adamant axes, with more below the fold - most of them labelled
"Region required" and unbuyable. A control called
"Available only" exists, but it is small, sits top-left, and
defaults to OFF, so the new player never benefits from it.
DO EXACTLY THIS - THE DEFAULT HAS ALREADY BEEN CHOSEN, do
not substitute the alternative without arguing it in the PR:
1. Default "Available only" to ON for any hero who does not
   yet own an item from the family being browsed (tools are
   the observed case; apply the rule per family, not just to
   axes). Once the player owns something in that family, keep
   whatever the player last set the toggle to.
2. The toggle itself must remain, must be visibly labelled,
   and turning it OFF must restore the full tier list exactly
   as today - nothing is hidden permanently and no stock is
   removed. A player planning ahead must still be able to
   browse future tiers, including their requirements.
3. Remember the player's toggle choice per family within the
   session at minimum; if the save format makes persisting
   it across sessions trivial, persist it and say so.
4. While the filter is ON, show a one-line count of what is
   hidden, on the pattern of "8 higher tiers hidden - turn
   off Available only to preview them", so the filtered view
   never reads as "the shop only sells two axes".
DO NOT: remove tiers, change prices, change region
requirements, or change the lock-reason labelling from
Task 14.
TESTS / PROOF: (1) a fresh hero opening the tool family sees
the filter ON and only available stock, plus the hidden-count
line; (2) toggling OFF shows all ten tiers; (3) a hero who
owns a tool in the family is not forced back to ON against a
choice they already made; (4) 390px Shop check, no overflow.

======================================================================
TASK 24 - Readability sweep: floating combat text, and the
truncated labels (Final report Findings 7, 6 and 13 - MINOR.
Three separate fixes; do all three, report each separately.)
======================================================================
FIX A - FLOATING LOOT TEXT IN THE ARENA (Finding 7).
Observed: strings like "1 coins - 2 ..." and "+4 XP" float
over the green arena backdrop, in small low-contrast text,
overlapping the foe's sprite. They are effectively unreadable
at the moment they are meant to reward the player.
Do: EITHER give all floating combat text a dark outline /
shadow strong enough to read against the arena backdrop, OR
move loot / XP floats to a fixed loot line directly under
the arena. Pick one, apply it to ALL floating combat text
(coins, items, XP - not just the two observed strings), and
state which you picked. The foe sprite must not be overlapped
by the text under either option. Check the result against
the lightest and the darkest arena backdrop the game uses,
not just the green one observed.
FIX B - NOW CARD ACTIVITY LABEL TRUNCATES (Finding 6).
Observed at 1440px desktop width: the Now card's activity
label truncates to "Fighting Mu..." (for Fighting Mudling),
and the same label on the welcome-back screen truncates to
"Fishing shri...". The card is not giving the label its full
width. Do: widen the Now card's label area OR shorten the
label format so the full activity reads - "Fighting Mudling"
and "Fishing shrimp" must both display in full at 1440px.
If you shorten labels, the shortened form must still name
the target (a label like just "Fighting" is not a fix).
Do not fix this by shrinking the font below its current size.
FIX C - LEFT RAIL SKILL NAME TRUNCATES (Finding 13).
Observed at 1440px: the skill named "Scholarship" renders as
"Scholars..." in the left skill rail, including when shown
with its level badge. Do: EITHER shorten the displayed label
(keeping the full name in the skill's own page heading and
in any tooltip) OR widen the rail by the few pixels needed.
Then audit every other skill name in the rail at 1440px and
at 390px and fix any name that truncates the same way - list
which names you checked. A name that only fits by removing
its level badge is not fixed.
DO NOT, for any of the three fixes: rename skills in the
game's data, change combat numbers, or change what loot is
awarded. These are presentation fixes only.
TESTS / PROOF: screenshot or DOM checks for each fix - the
arena text legible / relocated with no sprite overlap; both
Now-card labels in full at 1440px; every rail skill name in
full at 1440px and 390px; zero new horizontal overflow.

======================================================================
TASK 25 - Viewport fit at 1440x900: Home's right column, and
the Welcome Back modal (Final report Findings 9 and 11 -
MINOR, residual slices)
======================================================================
SCOPE LINE: Task 13 in this prompt decides WHAT Home shows above the fold
and Task 10 in this prompt decides WHAT the Welcome Back panel contains.
Do NOT re-decide either. This task is ONLY about whether
those screens FIT a very common laptop viewport - 1440x900 -
without cutting panels in half or pushing the dismissal
control off-screen. Neither earlier task names this viewport.
FINDING 9 - HOME: at 1440x900 the right column overflows the
bottom of the viewport: the "Unlocks ahead" panel runs past
the fold and its Mining row is cut in half. The Shop tool
grid likewise extends below the fold. A half-cut panel is the
bug - a panel that is wholly below the fold inside a column
that clearly scrolls is not.
Do: make Home at 1440x900 behave in ONE deliberate way -
either everything fits, or the right column scrolls as a
column with no panel ever rendered half-cut at rest. State
which behaviour you implemented. If Task 13 has already moved
"Unlocks ahead" off Home by the time you do this task, apply
the same no-half-cut rule to whatever replaced it in that
column and say so - do not re-add the panel to fix this.
FINDING 11 - WELCOME BACK: at 1440x900 the modal is taller
than the viewport. Its "While you were away" tiles are cut
off at the bottom, the modal has to be scrolled to reach
them, and its close / Continue control sits below the fold -
the one button a returning player needs is the one they
cannot see. Separately: the observed return stacked THREE
away-encounters, each demanding its own decision, before the
player could reach the game: "Mabel's taste test", "A tune
with a missing ending", and "A letter at the gate".
Do, for the modal:
1. Give the modal a maximum height that fits 1440x900 with
   margin, an internal scroll area for its content, and a
   STICKY footer: the Continue / close control stays visible
   at the bottom of the modal at all times, without scrolling.
   Verify the same at 390px phone height as well as width.
2. Add ONE "Decide later" action that defers ALL pending
   away-encounters at once. (Task 10 already moves encounters
   behind a count on the return screen; if that has landed,
   this action belongs wherever those encounters are now
   listed, and one press must defer every one of them - the
   player must never have to dismiss three decisions one by
   one.) Deferred encounters must not expire, must not be
   counted as missed anywhere, and must remain reachable
   from wherever encounter prompts normally live.
DO NOT: remove any Welcome Back content, shorten the gains
summary, or change what Continue does (it auto-resumes -
that is Task 10's decision and it stands).
TESTS / PROOF: at 1440x900 - Home screenshot / DOM check with
no half-cut panel; Welcome Back opened on the 6-hour returner
fixture with the Continue control visible without scrolling
and all content reachable by the modal's internal scroll;
"Decide later" clears all three named encounters in one
action and all three are still openable afterwards.

======================================================================
TASK 26 - Remove the placeholder text "next: Something new"
and audit for its siblings (Final report Finding 12 - MINOR.
This is the smallest task in this prompt. Do it exactly as
written and do not expand it into a copy rewrite.)
======================================================================
WHAT WAS OBSERVED, EXACTLY: the Welcome Back screen's
"More to do" row read: "Fishing 30 is close - 78% of the way
there; next: Something new." "Something new" is a placeholder.
It tells the player nothing about what Fishing 30 actually
gives them, on a screen whose whole job is motivating the
next goal.
DO EXACTLY THIS:
1. Find what Fishing 30 actually unlocks or grants in the
   game's data (a perk, a field-guide entry, a new action -
   whatever is really there). Then EITHER replace
   "Something new" with that thing's real name, OR, if
   Fishing 30 genuinely grants nothing specific, delete the
   "; next: ..." clause from that row entirely. A true named
   reward or no clause - those are the only two outcomes.
   Do not write a vaguer replacement ("a new perk", "a
   surprise") - that is the same bug with different words.
2. Audit every string of the same generated shape - any
   "next:" preview, "unlocks:" preview, or milestone teaser
   anywhere in Home, Welcome Back, and the skill pages -
   for the same defect: generic or placeholder text standing
   in for a specific reward. Fix each one by the same rule
   (real name, or remove the clause) and list every string
   you changed, with its before and after text. If the audit
   finds none beyond Fishing 30, say so explicitly.
3. Add a test, or extend an existing text / content test,
   that fails if a "next:" / milestone preview renders with
   an empty value or with the literal string "Something new"
   (and any other placeholder literal your audit uncovers).
DO NOT: invent a new Fishing 30 reward to give the text
something to say, change what any milestone grants, or
rewrite flavour text that is specific and correct.
TESTS / PROOF: the before / after string list from step 2;
the new placeholder test passing; the Fishing row on the
returner fixture now naming a real reward or carrying no
"next:" clause.
