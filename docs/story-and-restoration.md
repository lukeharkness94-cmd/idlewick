# Story, restoration and distinct farm workspaces

## Story delivery

`js/story_data.js` defines scenes using existing quests, discoveries, villagers, town art and project states. `js/story.js` presents player-paced storyboards: animated town framing, the hero, character portraits, dialogue and visible decision buttons. All art reuses the original code-drawn pixel system. No video/image packs, AI artwork, new currency or parallel quest tracker were added.

The opening connects Elder Wren's broken well, Mabel's supper, Orrin's patrol, the goblin satchel and Grubnash. Authored conversations and acknowledgements extend to later regional arrivals, boss aftermath and the existing adventure chains, including Silent Bells. Scenes remain short; extra history stays in the existing quests/People/Journal.

A new event may offer an automatic scene. It waits for other dialogs and in-card quest reward reveals; it never pauses the main task. Only one pending scene is retained, with an unanswered priority decision protected from replacement by a routine conversation. Loading an advanced hero does not enqueue an old-scene backlog. Offline/forecast work never opens scenes. Story so far in Home → Journal provides paginated access to eligible scenes, replay and deferred decisions. Automatic playback can be disabled there.

Space/Enter advance dialogue; Tab stays within its controls, and gameplay hotkeys cannot navigate or pause the task behind the scene. Skip, Escape and backdrop dismissal do not select a default decision. Completed scenes are recorded in the existing `S.seen`; decisions use existing `S.choices`. No save-version change. Older saves keep their progress, rewards and choices. A completed legacy decision quest with no recorded outcome cannot be claimed or rewritten from the archive.

## Decisions and consequences

- After First Steps: explicitly choose the well/village or the goblin threat as the next Home goal. Both remain playable; normal destination controls still let the player change priorities.
- After Grubnash: choose whether to stay and restore Willowbrook or make the next region the goal. This never automatically starts travel or work.
- Discovery scenes delegate to `DQ.chooseDiscovery`, retaining their existing costs and rewards. The satchel's Attack/Defence XP versus coins, the traveller's meals and the anvil's ember core are real outcomes, not decorative buttons.
- The ledger delegates to the original quest-choice system: Ilsa/warden's greathelm or Mother Silt/smuggler's knot, with the existing later dialogue. Claiming still uses the in-card reward reveal. Opening a ready quest decision from the Journal selects the quest first.
- Replaying a decision shows its canonical response without spending supplies, changing the choice or granting rewards again. New priority decisions roll back on failed persistence and show an inline retry message.

Home now offers the relevant goblin quest before further boss training, Mabel's cooking quest when available, and the tracked patrol once prepared. It never accepts a quest or changes the selected destination without a player action.

## Restoration feedback

Every village/regional/relic project has an eligible scene after completion. The scene displays the actual code-drawn ruined and restored building side by side, the villager's acknowledgement and the project's existing permanent benefit. The town image uses the real updated project state. A local completion summary identifies the restored site and benefit, offers See what changed, and highlights its map marker. Reduced motion removes camera, reveal and marker animation. Older restored projects can be revisited from the Journal without paying again.

## Farm workspaces

Desktop Farming has separate Crops & fields and Livestock & pasture workspaces, with distinct wheat/cow emblems and warm field/green pasture styling. Changes use a scoped native slide/crossfade, with a continuous-motion fallback and an immediate switch for reduced motion. Each shows only its own actions and matching supply panel; phones retain Fields/Pens/Seeds/Livestock section buttons. Crop tiles are capped at 120px height (100px on phones), and pen tiles at 150px (110px on phones). The current three-plot farm therefore no longer creates giant cards stretched to fill the screen.

Owned plots/pens are paged independently of their purchase buttons. Pages use fixed Prev/current/Next controls, so future capacity cannot create an endless row of page numbers. Desktop capacity per page: 12 plots/6 pens, reduced to 6/4 at laptop widths; phones show 4/2. All owned seeds share a wider two-column palette without pagination; livestock market stock remains bounded separately. No new farming simulation, resource prices or capacity unlocks were introduced.

## Verification and evidence

- `node tests/story.cjs`: 10 story checks for remembered goals, eligibility, failed-save rollback, save round-trip, existing discovery rewards, ledger branches, every project's scene/benefit, opening guidance, offline suppression and legacy completed decisions.
- `node tests/story-ui.cjs`: actual default opening scene, task progress during dialogue, keyboard advance/navigation isolation and Escape, skip/replay, priority choice, in-card reward reveal, real well restoration with distinct before/after town and building art, ledger choice, anvil cost/reward, and reduced motion.
- The browser matrix covers both themes at 1280×720, 1440×900, 1920×1080 and 390×844 with the current full farm. Explicit future-capacity fixtures also cover 32 plots/16 pens and multiple pages at laptop, desktop and phone widths. These fixtures do not change the real capacity/economy or represent normal progression.
- Existing suites: 104 engine regressions; 25 Beastmastery checks; eight pixel-art checks; desktop storage; desktop/ultrawide fit; current UI interactions; first-use, bestiary, returning and older-save journeys. Focused older journey suites opt out of automatic story playback; story-ui exercises the default playback itself.
- A real-browser, accelerated road-focused opening with no granted resources completed First Steps, Mabel's supper, Goblin Menace and the chief's quest within approximately 30 simulated minutes, encountering the satchel and post-victory decisions. Grubnash fell at approximately 18 minutes. The prior guidance-only run completed only First Steps across its hour. The bot was extended to interact with story controls and the existing tracked-patrol action; these are guidance checks, not a human playtest or a claim of enjoyment/retention.

Human checks remain: story frequency versus relaxed play, whether players notice restoration changes, whether the priority decisions feel useful, and whether villagers/choices are remembered later. Windows/macOS packaging and real Steam Cloud validation remain separate release work.
