# Idlewick playtest plan

Automated tests prove the game works; only people can tell us whether it is enjoyable. Use this plan with 5 to 8
players across the profiles below. Each session: a fresh browser profile, the standalone `Play Idlewick.html`, and
Settings > Playtest report copied at the end. Observe silently first; ask questions afterwards.

## Profiles and what to watch

| Profile | Session | Watch for |
|---|---|---|
| New player | First 60 minutes from a new hero | Do they understand the first task without help? Do they find the destination on Home? Time to first upgrade, first fight, first restoration project. Any moment they stop and look lost. |
| Early game | A save at Hero 10 to 20 | Do route buttons ("Fish", "Chop", "Make") get used? Do they choose a destination themselves? Farming: do they buy a hen from the first-animal card? |
| Mid game | A save at Hero 35 to 50 in Ironpeak | Is there always something to work towards? Do they notice and start the Ironpeak adventure? Does Hero 46+ feel thin? |
| Advanced | A save at Hero 70+ | Long-term goals: Scholarship tiers, furniture, collections. Are coins meaningful or piling up? |
| Returning | A save left closed for 6 to 30 hours | Is the welcome-back summary clear and short? Do they know what to do next? Any discoveries made while away? |
| Idle-focused | Two hours with the game open in the background | Audio fatigue (ambience, task sounds), notification noise, whether checking in feels rewarding. |

## Questions afterwards (1 to 5 scale, then "why?")

1. I always knew what I could do next.
2. Gathering, crafting, combat and the village felt connected.
3. Rewards felt worth the time.
4. Something surprised or delighted me.
5. The game looked and sounded consistent.
6. I would come back tomorrow to see what happened.
7. What, if anything, felt like a chore?

## Signals in the playtest report

Hero level timeline, first time each system was used, session count, time away versus counted time, and any errors.
Compare against `docs/economy-evidence.md` (a steady gatherer reaches Hero 26 in 2 hours and Hero 46 in 8 hours).

## Known limits to confirm with people

- Discovery rarity (about 1 in 300 to 700 eligible actions, guaranteed by 400 to 1,500): too rare, too common?
- Ambience volume defaults and whether any region's soundscape becomes irritating over an hour.
- The leather coif and other headgear until fitted equipment art arrives.
- Willowbrook projects added in this update show no painted change on the landscape until their art exists.

## Session script for the reliability build (prepared, not yet run)

No human sessions have been run for this build. These are the things a scripted run cannot judge; ask testers to think aloud and note the time at each step.

1. **First ten minutes, fresh hero.** Note the time to the first task, the first quest claim, the first purchase or upgrade, the first fight and the first restoration. Mark every moment they hesitate, open a page and back out, or close a notification without reading it.
2. **Pin and reload.** Pin a village project other than the well or inn, close the game, reopen and press Continue. (Earlier builds refused to load such saves.)
3. **A keepsake.** Give a tester a save holding the Star shard or the Miller's Bell and ask them to tidy their inventory. Do they understand why it has no Sell button?
4. **Farming at a glance.** Plant a crop and leave the Farming page open. Ask them when it will be ready and whether the picture matches.
5. **An adventure chapter.** From a save at The Bramble Mill, ask them to continue the quest without help. Does Continue take them where they expect? Do the quest-giver's notes change which weapon they pick?
6. **Combat pacing.** From a save at Hero 10 and combat about 5, ask whether the catch-up bonus is noticeable and whether Grubnash feels close.
7. **Listening (needs a person).** Ten minutes in two regions with ambience on. Is anything repetitive, too loud or fatiguing? Check the master, music, effects and ambience sliders one at a time, and mute.

Record answers against the 1 to 5 questions above. Do not merge scripted-run timings with human results.

## Enthusiasts and genre sceptics (Nov 2026 build, prepared, not yet run)

Recruit both: **enthusiasts** (play idle or RuneScape-style games regularly) and **sceptics** (have tried idle games and bounced off, or avoid the genre). No sessions have been run. Do not record results until real people have played.

| Step | Enthusiast: watch for | Sceptic: watch for |
| --- | --- | --- |
| First 25 minutes, fresh hero | Do they optimise (style rotation, food) without being told? Time to challenge Grubnash (simulated 21 min). | Can they say *why* they are gathering? Do they read Wren's and Orrin's lines? Do they hesitate anywhere? |
| The goblin satchel choice | Do they reason about XP versus coins? | Do they feel the choice mattered? |
| Grubnash preparation | Do they trust the preparation steps and the forecast, or check them themselves? | Do they follow a step? Does "Not a guarantee" feel honest or discouraging? |
| A loss to Grubnash | Do they understand why? | Do they retry, or quit? |
| Welcome back after 6 hours | Are the "Other good options" useful? | Is it short enough? Do they pick something? |
| Hero levels 4 to 9 | Do they miss the full reveal for small levels? | Are there still too many interruptions? |

Questions for both, after the 1 to 5 set above:
1. When did you first care about something in the game, and what was it?
2. Was there a moment you felt clever?
3. Did any screen tell you something you did not believe?
4. What would make you open it again tomorrow, if anything?

Unanswered until people play: whether 21 minutes feels short or long to each group; whether the satchel and thanks lines read as charming or as filler; whether sceptics read preparation steps at all; whether enthusiasts want the full Hero reveal back for every level.

## Deeper RPG pass (prepared, not yet run)

- **Uniques**: do players notice a unique drop, read the effect and make a real choice (e.g. Viper's kiss against a steel sword)? Do the ▲/▼ marks help or mislead?
- **The Silent Bells**: from a Hero 18 save, do players follow the story without help? Do they hesitate over the ledger, and does the consequence feel worth it?
- **Journal**: after a session, does it read like their own story? Is anything missing or noisy?
- **Bosses**: with the field guide's advice, does a boss feel tense but fair? Without it, do they understand why they lost?

## Questions for this build (prepared, not yet run)

Ask both enthusiasts and sceptics after a session, then "why?":
1. Did the first objective feel obvious? (Watch whether they read the "Done when" line.)
2. Could you explain why you prepared the way you did for a boss?
3. Did the equipment effects feel trustworthy? Did you see them happen?
4. Did the different ways to beat a boss (counter, more food, potions) make sense?
5. When did completing the bestiary start to feel repetitive?
6. After unlocking Herbalism or Enchanting, did you know one worthwhile thing to make?
7. Would you come back tomorrow without being asked?

Unverified without people: whether the Next step card is read or skipped; whether "Most useful change" after a defeat changes behaviour; whether players find ability slots without the advice.

## Questions for the experimentation, goals and combat-page build (prepared, not yet run)

1. Did you save a preparation in the Inventory? Did you use it again later, or only once?
2. When a unique item dropped, did the "Good for …" line change what you did next?
3. On Home, did "Also worth doing" offer something you chose over the Next step? Why?
4. After coming back, did "Since you left" tell you something you cared about?
5. Did you use Copy build or Copy my story? Where did you paste it?
6. On the new combat page, could you say which skill your fights are training without looking for it?
7. Did the first 10 minutes feel too slow, about right, or still too fast? (The early-pace change is unverified with people.)
8. Did you notice the "New" badge on a newly unlocked skill? Did you open it because of the badge?

Unverified without people: whether saved preparations are used beyond the first try, whether the slower opening loses impatient players before the first boss, and whether the combat page's two-column split reads as "you" and "the fight".

## Questions for the Nov 2026 brief build (prepared, not yet run)

1. Could you find the next thing to make on the Crafting and Smithing pages? Did the categories match how you think about them?
2. When something could not be made yet, did you know why and where to go?
3. Did you use a skilling charm, a wooden shield or a made tool? Which one, and why?
4. Did you notice you could gather from any town? Did anything feel like an errand?
5. Was each new skill unlock clear (Cooking, Mining, Farming, Hunting)? Did any feel like a chore?
6. Did "Goal complete" on Home help you choose what to do next?
