# Experience assessment: enthusiasts and genre sceptics (Nov 2026)

Baseline commit `f8197ac`. Two design perspectives, not real players: **Player A** knows idle and RuneScape-style games and wants depth, efficient routes and mastery. **Player B** doubts idle games and needs a clear reason to care, early agency and rewards that feel earned. No feedback was collected for this document. Everything marked *evidence* comes from the deterministic simulators in `scripts/`.

## Prioritised findings

| # | Problem | Who it hurts | Status |
| - | ------- | ------------ | ------ |
| 1 | **The first boss could not be beaten at its gate.** A purposeful beginner reached combat 10 in 28 minutes, then the game's own forecast gave 0 wins in 96 fights; even full bronze armour, a warhammer and 15 cooked shrimp only reached 25%. Grubnash had four times the health and hit of anything else in Willowbrook. Every later boss is 1.3 to 2.7 times its region's health and about 1 times its hit. | Both. B quits at a wall that looks fair, and A finds the opening's pacing broken. | **Fixed** (tuned, evidence below). |
| 2 | **Preparation was a list of facts, not a decision.** The boss card showed health, food, weaknesses and counters, but never said which step would help most or whether the player could afford it. | B could not tell what to do. A had to work it out by hand. | **Fixed**: preparation steps from the real save. |
| 3 | **Every Hero level was a sticky full-screen modal.** About 7 interruptions in the first 15 minutes. Several Hero levels from an absence each queued their own reveal, and only the last kept its unlock list. | B (interruptions), and relaxed play generally. | **Fixed**: full reveal only for unlocks and every fifth level, a compact card otherwise, and combined offline cards. |
| 4 | **The opening had tasks but no reason.** First Steps was "catch shrimp, chop logs". Finished quests went to the bell, so nobody acknowledged the work. The earliest discovery needed Woodcutting 10 and up to 1,500 chops. | Mostly B. | **Improved**: villager motive, thanks lines, an early discovery with a choice. |
| 5 | **The return summary said what happened but offered one path.** | Both. | **Improved**: "Other good options" with real costs. |
| 6 | **About half the interface icons were unfinished line glyphs** (close, lock, check, info, item categories…). Button choices had text only. | Both (polish and readability). | **Fixed**: all 83 icons are pixel art (enforced by test), and choices carry icons. |
| 7 | **The late bosses depend on counters.** With region melee gear at the requirement, the win rate falls from 46% (Frostmaw) to 17% (Morwenna), 4% (Pyrrhax) and 0% (Zephyrion, Hollow King). These fights are designed around elemental, ranged and phase counters. The simulator does not use counters, so this is **not proof of a spike**. | A (late game). | **Measured**: with counters, not a spike (see below). |
| 8 | **Bestiary mastery and companions have no visible goals.** Slayer stars (+4% damage at 10, 50 and 250 defeats) and the six research stamps exist but are not framed as objectives. | A. | **Proposal only** (mechanical rewards need approval). |

## Improvements in detail

Each change below covers the current experience, why it hurts, how the change helps each player, the existing systems it builds on, and how it was verified.

### 1. First boss rebalance (authorised by the lead brief)
- **Before:** the gate (combat 10) took 28 minutes, with 0% wins on arrival and 25% when fully prepared. The quick early quests then led to a long, unwinnable grind.
- **Change:** Grubnash now opens at combat 8, is shown as level 12 (was 16), and has 20 health (was 28), a maximum hit of 3 (was 4), attack 7 (was 10) and defence 6 (was 8). His War cry, his enrage below half health and his crush weakness are unchanged, and so are his drops. `js/data.js` and the quest text.
- **A:** preparation still matters (18% unprepared, 92% prepared), so efficient play is rewarded. **B:** a wall becomes a goal reachable in one session.
- **Systems:** the existing `mon()` scaling, `DQ.forecast` and the boss gate. No progress is removed: a defeated Grubnash stays defeated and nothing is reset.
- **Verification:** `node scripts/sim-opening.cjs` (96 forecast fights per row). The new regression check covers the gate and the stat ceiling.

| At the gate (simulated beginner) | Before (combat 10) | After (combat 8) |
| --- | --- | --- |
| Minutes to reach the gate (fighting) | 28 (20) | **21 (13)** |
| As reached | 0% | 18% |
| + 15 cooked shrimp | 0% | 26% |
| Bronze helm, body, legs and shield + 15 shrimp | 1% | 68% |
| **Follows the new advice** (set + bronze warhammer + 15 shrimp) | 25% | **92%** |
| Full bronze + 15 shrimp + 3 levels | 8% | 79% |

Old Tusk stays the next step up: 42% at his gate with Willowbrook gear, 96% with three more levels (`scripts/sim-bosses.cjs`).

### 2. Preparation steps (presentation of existing mechanics)
- **Before:** "Health 5 / 11 · 52 health of food", weakness chips and a forecast that read only "Dangerous".
- **Change:** `DQ.prepAdvice(monId, forecast)` gives up to three concrete steps, in order of usual impact. It reads only the real save: rest to full (with the real recovery time), equip owned armour, buy shop armour for empty slots (only called affordable when it is, otherwise "Save for armour" with the gap), switch to or buy a weapon matching the weakness, train Magic or get a staff for an elemental weakness, and bring more food. The forecast result now reads "Estimate: … Most useful next step: … Not a guarantee." The boss special is spelled out: when it lands, roughly how hard, and which abilities stop it at which level. The Home objective uses the same advice.
- **A:** a fast, honest checklist that stays in step with the simulator. **B:** "Buy armour for your empty slots (185 coins). You have 579" is something you can act on.
- **Midgame example (Frostmaw, combat 46):** "Rest to full health first: Health 24 / 40. You recover about 48s outside combat", then "Train Magic to 35 for Fire Surge: Frostmaw is weak to fire. Magic 30 / 35." It never suggests an unlearned skill: without Magic unlocked, only the rest step appears.
- **Verification:** a regression check confirms low health comes first, an unaffordable set is never called affordable, the advice names the weakness and the save is unchanged. Browser screenshots at 1440 (dark) and 390 (light).

### 3. Calmer level-ups (AGENTS rule kept: always visible, unlocks explained)
- **Change:** `DQ.heroRevealWorthy`. The full Hero reveal appears for levels that unlock something and every fifth level. Other Hero levels show a compact card that appears even with notifications off. Offline Hero levels merge into one "Hero levels 4–9!" card listing every unlock. Skill level cards were already merged.
- **A:** no change in information. **B:** from Hero 2 to 11 (the first ~28 minutes in the simulator), full-screen reveals drop from 10 to 4 (Cooking at 3, 5, Mining at 6, Farming and 10).

### 4. Opening arc (words and one small discovery)
1. **Personal reason:** First Steps now explains that goblins smashed the well's winch and Elder Wren needs timber.
2. **Purposeful gathering:** the logs feed the well project (20 logs and 25 coins already).
3. **Decision:** Wren's thanks names the trade-off: the well (faster resting) or coins for armour. The goblin satchel discovery (1 in 3 per goblin, guaranteed by the fourth) offers *+60 Attack and Defence XP* or *+40 coins*.
4. **Short challenge:** Goblin Menace, then Grubnash at about 21 minutes.
5. **Visible consequence and acknowledgement:** villager thanks lines on First Steps, Goblin Menace, The Hungry Cook and The Chief's Last Stand appear as a card, not in the bell.
6. **Curiosity:** the satchel note foreshadows the War cry. Orrin's victory line points at whatever is trampling Mossbarrow's fields (Old Tusk).

### 5. Return summary trade-offs
- `DQ.returnChoices()` adds up to two options under the existing next step. One is a restoration you can afford now, naming the coins it would take from gear, or else the closest one with exactly what is missing. The other is a skill at least 50% of the way to a level that unlocks something, with what it unlocks. There are no streaks, timers or expiring offers, and the offline cap is unchanged.

### 6. Icons and choices
- All 83 interface icons are pixel art (`js/pixel_world.js`). Item-type icons reuse the item sprite, and glyphs (close, lock, check, info, skull, sun and moon, save, flag, town, barn, candle, fire, nest…) are drawn in the shared palette with top-left light. `tests/art-pixel.cjs` now fails if any icon is missing.
- The action bar shows the task's own item art without a tinted tile, and its stop button uses the new pixel close icon.
- Every button choice (training focus, eat threshold, stop rule, pace, spells, item categories, settings, travel, projects, rooms, workers, skills) carries its menu icon.

## Skill audit (unlock → first action → next levels → why return → supports)

| Skill | Unlock | First action | Next goals | Why return | Supports |
| --- | --- | --- | --- | --- | --- |
| Hunting | 10 combat victories (shown on Home's unlock roadmap) | Explore a hunting area | Encounter tiers and companions | Bonded companions and their perks | Combat (beast bonus), collections |
| Exploration | 25 fish and 25 logs | Chart a road or habitat | Discoveries (+120 XP each) | Secrets and regional rewards | Adventures, discoveries |
| Herbalism | 20 crops harvested, then the Scholarship research | Brew a first remedy | Potion tiers | Buffs for hard fights and gathering | Combat preparation, farming demand |
| Enchanting | 30 crafts and 20 smithing actions | Bind a rune to gear | Gem tiers | Strengthen gear you already own | Every combat style |

Weakness: Herbalism and Enchanting arrive with no named first target, and the preparation advice does not yet suggest potions or enchantments. That is a sensible next extension (presentation only).

## Proposals that need approval (not implemented)

1. **Bestiary mastery objectives:** three goals per creature (10, 50 and 250 defeats already give slayer stars), with the reward shown before you start. A new reward, such as a trophy furnishing or a cosmetic title, is a new effect, so it needs approval.
2. **Companion distinctness:** give each curated companion one unique, readable effect in place of the shared small percentage bonuses. This is a mechanical change.
3. **Counters may be too strong (measured, not changed):** see "Late bosses with counters" below. A possible retune would make counters a big advantage rather than a near-guarantee. That's a balance change, so it awaits your call after playtesting.
4. **Keep or remove the satchel rewards:** +60 Attack and Defence XP, or +40 coins. Both are tiny and removable in one line.

## Remaining weak stretches
- Mossbarrow to Saltmere (Hero 18–30) has the fewest stories. The Bramble Mill adventure is the only thread.
- Hero 46+ (late Ironpeak) was flagged as thin earlier and is unchanged.
- Herbalism and Enchanting first steps need named targets.
- Counter play makes the bosses before the Hollow King near-certain wins. Whether that feels rewarding or too easy is a playtest question.

## Late bosses with counters (`COUNTER=1 node scripts/sim-bosses.cjs`)

The simulated hero stands at each boss's requirement and follows the field guide: the matching spell (with staff), a bow and arrows against pierce, or the matching melee weapon. Gear comes only from that region and the one before, plus 15 of the best cookable food. The counter skill is set to keep combat level at the requirement. Abilities slotted: Focus and Ward, Pin, Aimed and Keep Distance, or Power, Bash and Brace.

| Boss | Counter used | Win at requirement | Food per win | +3 levels |
| --- | --- | --- | --- | --- |
| Grubnash | Bronze warhammer | 100% | 1.7 | 100% |
| Old Tusk | Oak bow, iron arrows | 100% | 1.4 | 100% |
| Barnacle | Oak staff (Spark, storm) | 100% | 8.1 | 100% |
| Frostmaw | Willow staff, Fire Surge | 100% | 1.5 | 100% |
| Morwenna | Maple bow, adamant arrows | 100% | 2.5 | 100% |
| Pyrrhax | Yew bow, rune arrows | 100% | 3.8 | 100% |
| Zephyrion | Magic bow, astral arrows | 100% | 2.7 | 100% |
| Hollow King | Elder staff, Aether Blast | 67% | 13.3 | 79% |

**Reading:** with plain melee the later bosses look like walls (0–46%). With the field guide's counter they are near-certain wins. The design intent (bosses as counter checks) works, but the gap is very wide. One caveat: this assumes the player has trained the counter style as far as their melee, which a melee-only player will not have done.


## Review response (from build 438b1e1, provisional 7.5/10)

No newer commits existed beyond two cosmetic ones (badd31b, 37c0acf) when this pass began. None of the numbers below come from players; they come from the real page in a browser or the deterministic simulators.

### Confirmed problems and their causes
1. **Gale (Storm feather) did nothing.** `skill_expansion.js` loads after `engine.js` and redefined `DQ.combatInterval` without the Gale multiplier. The earlier regression passed because its harness never loaded that file. Fixed by keeping one definition in `engine.js`. `tests/ui-effects.cjs` now drives the real page in the shipped script order, and it fails when the old override is restored ("Gale: 1520ms → 1520ms").
2. **An audit of every unique effect and companion trick** in live play, offline catch-up and forecasts, plus removal, swaps and save/reload. 19 effects (18 exercised in fights, plus Gale's interval) and 16 of 17 tricks are exercised in the browser. Night study was checked by reading the code only (it scales research progress inside `DQ.researchTick`). Gale was the only effect that never applied. Five descriptions understated or hid their numbers (Venom, Ember arrows, Twin cut, Frostbite, Riposte), and four companion texts were vague or inaccurate (Fetch, Night study, Heckle; Early riser was already right). Each now states its magnitude, frequency and condition. Effects now show when they happen: green "+N" splats for healing, poison ticks, Twin cut and Arc labels, thorns and riposte numbers, and "Stunned" over the enemy.
3. **Boss advice described the old multipliers** ("+50%", "half damage") after bosses moved to ×1.3 / 70%. All guidance (field guide, matchup lines, preparation steps, study notes, the Elemental Focus description) now reads from one table, `D.TYPE_RULES`, which the engine also uses.
4. **Preparation advice had blind spots.**
   - It never suggested a bow against a pierce weakness (it read a weapon-type field that bows lack).
   - It could recommend a bow without arrows, or a spell without enough runes.
   - It only knew about raw shrimp.
   - It never mentioned ability slots, which turned out to matter more than anything else (below).
5. **The earlier "plain melee 0%" evidence was misleading:** those runs slotted no abilities at all.

### Boss preparation: is it a real choice? (`COMPARE=1 PARTS=1 node scripts/sim-bosses.cjs`)
The simulator now loads the same gameplay systems as the page (field guide, enchantments, adventures, companion tricks). Each row is 96 forecast fights at the boss's requirement, with region gear.

| Boss | No abilities | General (abilities, 15 food) | +25 food | +Might/Haste | +3 enchants | Counter | All alternatives | +5 levels |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Frostmaw | 0% | 25% | 86% | 78% | 41% | 94% | 100% | 68% |
| Morwenna | 0% | 59% | 90% | 88% | 64% | 88% | 100% | 83% |
| Pyrrhax | 0% | 27% | 81% | 64% | 34% | 98% | 100% | 59% |
| Zephyrion | 0% | 26% | 79% | 67% | 41% | 85% | 100% | 49% |
| Hollow King | 14% | 100% | 100% | 100% | 100% | 89% | 100% | 100% |

Preparation costs, from the game's own numbers:
- **Counter:** train a second style to the requirement level from scratch (372k XP at Frostmaw, 27M at Zephyrion), plus the gear.
- **Potions:** 270 coins of Might and Haste, but Herbalism needs Scholarship research first.
- **+3 enchants:** two each of sapphires, emeralds and rubies, plus runes.
- **More food:** ten more cooked fish.
- **+5 levels:** 0.97M XP (Frostmaw) to 68M XP (Zephyrion).

Reading:
- **No style is mandatory.** A melee player who slots their abilities and brings more food wins about 80–90%. The counter's advantage is efficiency: fewer supplies per win.
- **Abilities were the trap:** with none slotted, the later bosses are unwinnable. The preparation advice now raises empty slots, abilities that don't work with the current weapon, and specials nothing answers.
- **Failure now teaches:** a boss defeat names the most useful change.
- **Early bosses** (Old Tusk, Barnacle) are won by every level-appropriate build; the counter only saves food.
- **The final boss is the easiest of the late bosses** for a melee player in region (astral) gear, and the magic counter is weaker than melee there. This points to late-game magic falling behind (see proposals).

### Proposals awaiting approval (not implemented)
1. **Hollow King retune.** Candidates (general / magic counter / all alternatives): today 100% / 89% / 100%; health 560 & max 38 → 77% / 33% / 100%; health 620 & max 40 → 63% / 5% / 100%. Because magic collapses at these values, I recommend looking at proposal 2 first.
2. **Late magic investigation.** Elder staff plus Aether Blast at Magic 92 trails astral melee badly. This needs a style-parity check before any boss retune.
3. **Stacking every preparation guarantees victory** (100% for every boss). Accept it, since preparing is the point, or ask for a small tax (for example, potion durations that cover one fight rather than twenty minutes).
4. **Healing draught as an emergency drink in combat** (auto-drunk below about 25% health, after food runs out). Today it is manual only, which makes Herbalism's first potion weak.
5. **Bestiary understanding objectives** (one per entry, optional, each with a fair alternative):
   - **Regular creatures:** "Defeat it 10 times using its weak point" or "reach 50 defeats". Reward: the Field notes research stage early, paying the existing per-stage coins.
   - **Bosses:** "Answer its special 5 times (Brace, Shield Bash, Arcane Ward or Frostling)" or "defeat it 3 times". Reward: the Legend stage early and a gold rim on its trophy.
   - **Avoided:** full-health and no-food conditions (punitive and easy to miss).
   - **Tracking:** two counters per creature in `S().beast` (save-compatible).

### What changed for the player
- **Home:** one "Next step" card with what to do, why (Elder Wren's broken well), how you'll know it's done ("0/5 shrimp and 0/5 logs") and a sentence on stopping. The destination sits below as smaller buttons. The separate welcome panel is gone, and "Explore other suggestions" waits until First Steps is done.
- **Herbalism:** a three-step first-goals panel (research, Healing draught with materials and where to get them, then Potion of Might and when it's worth it).
- **Enchanting:** each worn item shows what the next rank adds, its share of the item's bonus, materials held, and the best first item.
- **Advice:** owned potions, a ready enchantment or a brewable Might are offered only for a boss you're likely to lose to.

### Remaining weak stretches
- Herbalism's first useful potion is still a long way off (Scholarship at Hero 16, then Tier II research).
- Hero 46+ (late Ironpeak) is still thin, and late magic may be underpowered.
- Companion tricks are small (Gobbo's heckle barely moves a boss fight). That's by design for now.


### Decisions implemented (owner approval, Nov 2026)
1. **Healing draught as an emergency drink:** drunk automatically once food runs out and health drops below 25%, at most once per fight. It applies in forecasts and offline, shows a "Draught +N" splat, and the item text says so.
2. **Late magic: the gap was a simulator artefact.** `PARITY=1 node scripts/sim-bosses.cjs` compares the three styles at the same combat level (the combat formula counts Ranged and Magic at 1.5×, so a mage has a higher Magic level than a fighter's Attack). Against each boss with its weaknesses removed, ranged and magic match or beat melee at every boss (table in `docs/economy-evidence.md`), so no change was made to magic.
   - **Real defect found:** a pure ranged or pure magic hero can only reach combat 97, while melee reaches 113, so the Hollow King's old requirement of 105 locked pure archers and mages out of the final boss. It is now 97 for every style, and a regression enforces it.
   - **New finding (not changed, needs a decision):** at the same combat level, melee is the weakest style at most bosses (general melee 23–75% against 98–100% for ranged and magic).
3. **Hollow King retune:** requirement 105 → 97, health 434 → 580, max hit 32 → 36. Melee general build: 100% → 50%; +5 levels: 81%; all preparations: 100%; ranged and magic: 100%. His phase weaknesses are unchanged.
4. **Stacking preparations:** accepted as is. Each preparation on its own still leaves real risk.
5. **Bestiary understanding:** one optional objective per creature in the field guide, with the reward shown up front.
   - **Ordinary creatures:** 10 wins whose finishing blow used a weak point, or 25 more defeats after its weak point is known.
   - **Bosses:** answer the special 5 times (Brace, Shield Bash, Arcane Ward, or survive it), or defeat it 3 times.
   - **Reward:** the next research stage early (with its usual coins); bosses also get a gold-rimmed trophy and a journal line.
   - **Tracking:** `S().beast.weakWins` and `S().beast.answered` (older saves start at zero).

## Experimentation, goals and the combat page (Nov 2026)

What has improved, and how far the evidence goes:
- **Trying a different setup costs one click.** Saved preparations apply owned items, take them from the bank, show what is missing or locked, and can be undone. Tests prove that items are never lost or duplicated; whether players come back to them is unknown.
- **A rare find suggests a next step** ("Good for …", Inspect, its source and the first-copy guarantee). This is a presentation change only: drop rates are untouched.
- **Later regions always name a next step**, and up to three optional goals sit beside it. This covers the thin Ironpeak stretch in presentation only. New content is a proposal (docs/proposals.md).
- **Melee is no longer the weak style** (simulated; see economy-evidence). Frostmaw remains the exception at 80%.
- **The combat page answers "how strong am I in this style?" in one place**, and each combat skill appears once. This is verified in the real page at 390, 1440, 2560 and 3440 wide in both themes (ui-current, ui-audit). Whether people read the split as intended is untested.
- **The opening is slower** (Fishing level 4 at 4 minutes instead of 7). That responds to one playtester's report. The right pace still has to be found through play.

What still needs to be earned through play: whether experimentation and optional goals give people reasons to return, and whether the slower opening keeps both impatient and patient players. No sessions have been run for this build.
