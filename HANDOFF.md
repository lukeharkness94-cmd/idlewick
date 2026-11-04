# Idlewick — current handoff

This repository contains the current game source and the generated `Play Idlewick.html`. It supersedes the older imported dashboard layout. The user wants to continue in Codex Cloud from Windows.

## Product direction — preserve these decisions

The latest feedback was emphatic: **this should feel like a pixel RPG, not a form or dashboard**. Keep visible, illustrated choices and a large target scene. Woodcutting shows the selected tree and resulting logs; mining shows the ore-bearing rock; crafting shows the output and illustrated ingredients; combat shows the actual opponent and the equipped hero. Do not replace these with dropdowns again. Compact navigation is useful, but visual appeal takes priority over squeezing everything into text.

All selectors render visible wrapping buttons through `UI.choiceButtons`, including navigation, combat focus, spells, thresholds, shop quantities and queue rules. The helper parses option definitions in an inert template; no select enters the rendered page. Existing delegated change handlers still apply. Reference sections are always expanded, quests display all cards in the current tab, and inventory uses its illustrated item grid without a duplicate selector. Farming displays fields and animals together.

**Latest widescreen direction: add columns, keep artwork at its normal display size.** The previous screen-size-based artwork, hero, font and panel enlargement has been removed. Combat now exposes independent preparation/loadout/abilities/food/skills cards in an adaptive grid. `js/layout.js` packs their natural heights with ResizeObserver so a tall boss card does not push every other card down. At desktop widths of 1920/2560/3440, the combat grid has 4/6/9 tracks (the battle uses two). Gathering and recipe reference panels can sit beside the action and choice cards. Inventory columns grow automatically, with selected details beside the backpack at wide sizes. Artwork remains native 48px/64px detail, rendered at the normal crisp display sizes. Verified no overlaps/overflow at 390, 1440, 1920, 2560 and 3440px; both themes and combat controls checked. Preserve this density-based adaptation rather than scaling content up with screen width.

The user also requested an initial tutorial and a quick first-time introduction for each newly unlocked skill: what it does, what its output is used for, and a useful goal. These are inline, dismissible cards in `js/onboarding.js`, with persistent once-only state. Existing saves skip lessons for skills already used. Settings → Help & learning can hide or restart the guides. Newly unlocked skill explanations appear on their first visit so running tasks are not interrupted.

Routine achievements and loot use the bell history without menu badges. Every skill and Hero level-up receives a visible alert, even on the current page; show unlocked options and milestone perks, or the next unlock when no content opens at that level. Rapid or offline levels for one skill combine without losing unlock details. Alerts pause while the tab is hidden or the card is hovered/focused. Unlocks (including skill options, new skills, pets, housing, workers and research) receive visible notifications, including on the current page. Quest availability and ready rewards are important alerts. Menu numbers reflect live actionable state: available/claimable quests, ripe crops/animal produce, affordable town projects, free research slots with affordable projects, and away decisions. Visiting a page does not clear an action count; resolving it does. Same-page warnings use inline status. Keep level-up and unlock alerts visible on the current page.

Town restoration matters. Willowbrook has a well and an inn with material costs, permanent benefits and visible scene changes. Projects can be pinned below the HUD, with live material counts and the next useful action. One village project is pinned at a time; it persists through reloads. Quests also affect the village art.

Gear shows its actual stats (e.g. Def 4, Rng 2) and differences from the equipped item in the same slot. Inventory and bank items have Sell and Sell all; source-limited sales preserve banked and equipped copies. Equipment sits around a compact full-body hero.

The equipped copy is stored separately from inventory. Equipping consumes exactly one copy, swapping returns the previous item, and unequipping returns the worn item. Extra copies matching worn gear carry a "Spare" badge in the backpack. Already-worn non-ammo items cannot be redundantly equipped again; their extra copies remain available for banking and selling. Regression coverage includes these transitions.

Shop prices use `UI.money(amount)`: a small visible coin and formatted amount, with an accessible currency label. Do not restore "8 coins each" prose on cards. Buy/sell totals show quantity and the coin amount; rare offers and inventory selling use the same visual treatment. Locked/owned rare cards retain their visible prices.

## Latest navigation, artwork and controls

- Home contains Home and Activity. Skills begins with Skill levels and includes all skills, Brewery and Mastery. Combat retains Fight and Bestiary. World contains Map, Town projects, House, Workers and Research. Shop stands alone. Hero contains Inventory & equipment, Bank and Achievements. Settings is a persistent HUD gear button, with developer balance accessible there.
- Section navigation uses visible wrapping tabs, including Skills on desktop; preserve the Skills rail entry so Brewery, Mastery and levels remain reachable. Research shows active slots before project choices. Brewing has its own page and still unlocks through Herbalism research.
- Accepting quests preserves the current quest tab, allowing several Available quests to be accepted in succession.
- `js/art_identity.js`, loaded immediately after art48.js, gives fish, trees, ores and thieving targets separate silhouettes and paints distinct items, skill emblems, crops, tools, potions, leather equipment, robes, jewellery, boss drops and additional creatures/pets. Cooked fish include a plate, species-specific cooked palettes and grill markings; cooking must not flatten every species to the same orange-brown. Mature farm crops show the actual harvested species.
- `js/icons48.js` paints all 83 UI symbols at native 48px, including the dedicated Farming icon. `pixelui.js` installs the shared full-colour images instead of rasterising the old stroke glyphs; retain normal display sizes.
- `js/scene_motion.js` listens to real combat splats and completed work cycles. Melee lunges/slashes, ranged arrows and magic projectiles have local impact/miss reactions. Work scenes show the equipped hero, activity-specific tool motions, atmosphere and completed output. Effects are capped, cleaned up, paused in hidden tabs, and disabled by both reduced-motion options.
- The entrance always uses a dark night palette in both themes. Set its foreground explicitly: changing scoped colour tokens alone does not reset a foreground inherited from the light-themed body. Keep the name input and Back button readable, while the gold primary action retains dark text.
- Buttons have compact bevels, brass trim, visible selected/pressed/focus states and theme-specific surfaces. Keep reduced-motion support and normal artwork sizes.
- Optional current browser checks: start the preview, then `node tests/ui-current.cjs` (Playwright). Uses an isolated temporary context. `UI_PREVIEW` optionally saves a screenshot. The art check includes all 253 inventory items, all resource silhouettes and creatures; `ART_PREVIEW` saves an artwork contact sheet; `ICON_PREVIEW` saves the icon sheet.

## Steam target and latest layout/motion work

Steam on Windows x64 and macOS universal (Intel + Apple Silicon), with cross-platform Steam Cloud progression, is the release target. `desktop/` provides an isolated Electron host, Steamworks main-process initialization, account-scoped atomic JSON storage, final-save-on-close handling and platform packaging configuration. `js/state.js` and rolling backups use `DQ.storage`: the native bridge for desktop, the original localStorage keys for browser previews. `desktop/STEAM.md` documents Auto-Cloud path overrides and remaining release checks. The real Steam App ID is unset; Steam Cloud and signed target-platform builds are not yet enabled/verified. Tests exercise storage behavior, not a live Steam account.

`js/battle_rig.js` splits equipped heroes and every enemy into articulated parts. Melee swings, bow draw/release, spellcasting, species-specific enemy attacks and recoil use independent joint poses rather than moving a single static sprite. `scene_motion.js` aligns projectiles and damage effects with release/impact phases. All visual timelines are continuous and follow native refresh rates (including 120 Hz where supported). Canvas particles and firefly drift use elapsed time. No display-specific performance guarantee has been measured in headless tests.

The shared layout organizer in `layout.js` moves skill status above its activity in a compact focus column, with choices and references in a separate column. Applies to gathering, recipe skills, farming and magic. The XP bar fills its card (the old `big` badge class had constrained its width). Combat shows an explicit Preview when no fight is running; its attack timer is bound to `fight:<opponent ID>` and never to the global task timer (fishing and other activities continue only in the HUD). Combat puts the scene, level summary and preparation together, independently packs cards from desktop widths upward, keeps loot separate, groups consecutive repeated drops, and displays actual item artwork. Both themes explicitly prevent repeating the landscape background. Native sprite sizes stay fixed as the viewport gains useful choice/card columns.

Ordinary combat now uses town hunting areas with visible weighted encounter rates. Expeditions rotate to another valid encounter after each victory; bosses remain direct challenges, active kill quests expose direct tracking, and Bestiary entries can still start intentional hunts. Quest counters, loot, combat XP, offline combat and boss road gates continue to use the existing fight task. Every non-boss creature can eventually join the creature collection. Existing pets migrate as creatures without losing their level; the active creature gains combat XP, unlocks traits at levels 2/3/5 and supplies the existing passive buff. Hunting and collecting are one progression system rather than two duplicate skills. Combat uses a faster, lower, more rhythmic synthesized music mode and returns to town music on retreat.

Skill unlocks use a blocking full-screen reveal with the skill emblem, rays, description and a Continue action that opens the new skill. This remains visible even when ordinary notifications are disabled. Fishing, Woodcutting and Mining are deterministic gathering actions: Woodcutting and Mining communicate three guaranteed strikes per resource, Fishing a guaranteed catch. Failure remains on activities where risk is meaningful, such as Cooking burns and Thieving.

The first time an item enters inventory through `DQ.grant`, it plays the short `discover` chime, shows a small toast and adds a quiet “New item discovered” entry to the bell. It never creates a menu badge or large alert, and later copies stay silent. `seen.items` is seeded from existing inventory, bank and equipment so older saves do not announce their established collection again.

UI sizing uses 17px base copy everywhere and 18px on desktop, with larger headings, buttons, tabs, chips, choice buttons, HUD icons and navigation targets. Bundled Pixelify Sans gives interactive labels an RPG voice while Alegreya remains on readable prose and display copy. Native pixel artwork retains its established dimensions. Navigation must stay inside one real sidebar column: do not restore the three-column `#app` override or `.sidebar { display:contents }`, which pushed the dock and `main` into implicit grid columns and collapsed activity pages on some scaled/high-DPI browser viewports. UI regression asserts the main skill workspace remains wider than 700px at desktop widths.

`js/creatures_expanded.js` adds four non-cliché regional creatures to every town (32 total; Willowbrook now has eight ordinary creatures). `art_identity.js` supplies a unique native 48px silhouette and markings for every addition. `battle_rig.js` reads their explicit anatomy and gives every creature a stable hash-derived cadence while moving the connected silhouette as the primary attack; joint rotations are intentionally restrained so shoulders, necks and hips never split apart. Art smoke tests require every creature drawing to remain byte-distinct.

Every skill and Hero level now uses a blocking `level-reveal` modal with its emblem, level number and unlock/next-unlock details. Reveals queue behind an existing modal and retry until visible; they no longer rely only on corner alerts. New-skill unlocks retain their separate full-screen `skill-unlock` reveal.

## Run and verify

- Play: open `Play Idlewick.html`, or `python3 scripts/preview.py` and visit http://127.0.0.1:8765/.
- Cloud preview: add `--host 0.0.0.0` if needed by the cloud preview service.
- Windows: use `py` instead of `python3`.
- Desktop storage: `node tests/desktop-storage.cjs`.
- Core checks: `node tests/regression.cjs` (no npm dependencies).
- Optional art check: `node tests/art-smoke.cjs` with `@napi-rs/canvas` installed. Set `ART_PREVIEW` to a PNG output path for a contact sheet.
- Rebuild: `python3 scripts/package-game.py`. Do not hand-edit the generated HTML.
- Current browser suites: `node tests/ui-current.cjs` and `node tests/ui-audit.cjs` (Playwright; start the preview first, or set `IDLEWICK_URL`). Both use the system Chromium when present, otherwise Playwright's bundled browser. The old historical experiments were removed from tests/.

## Architecture

Everything hangs off `window.DQ`: definitions in `DQ.data`, state in `DQ.S`, templates/actions/binders in `DQ.ui`. Script order in index.html matters. Most pages use `UI.V`, actions use delegated `data-do` handlers in `UI.DO`, and live values use `data-b` binders in `UI.B`.

- `state.js`: save validation/migration, localStorage, same-device multi-tab writer protection and derived stats. Add persistent defaults to `DQ.newState` and preserve older saves.
- `engine.js`, `systems.js`, `plan.js`, `research.js`: actions and the shared chronological world clock. Offline time is full speed for two hours, then half speed for six more; eight real hours gives five effective hours.
- `ui_core.js`: illustrated activity workspaces, recipe categories and combat stage. `UI.taskChoice` keeps the selected preview. `UI.DO.taskselect` selects an image card; the main action starts/stops work.
- `ui_pages.js`, `ui_extra.js`, `ui_meta.js`, `shell.js`: remaining pages, compact navigation, inventory/equipment, comparisons and HUD. Be mindful of wrappers around UI.render and page templates.
- `art_identity.js`: distinct resource, item and skill designs layered over the base pixel renderer; keep this after art48.js.
- `art48.js`: native 48×48 creatures, resource targets, crops and items; 48×68 equipped hero; 64px fallback icons for special gear. `gear.js` paints the main equipment at 64×64. These replace the older 24px creature sprites and enlarged-filter art at runtime.
- `scenes.js`: 384×130 town landscapes, with restored-project and quest details in the cache key.
- `journey.js`: selected destinations, restoration projects and persistent project pin tracker.
- `layout.js`: adaptive card packing on wide combat screens; disconnects/reconnects its observer when pages render and clears row spans on narrow screens.
- `onboarding.js`: first-play and skill lessons. `tut.version` handles old saves; `tut.done` stores acknowledgements. A few startup ticks must not make a new hero count as an experienced player.
- `fx.js`: routine bell history, live action counts and visible level/unlock/priority alerts.
- CSS: style.css for layout, light.css for light-theme overrides and motion.css for effects. Respect reduced motion.

## State and transfer

Browser save key: `dashboard-quest-save-v2`. Game progress is not stored in GitHub and does not automatically follow a code checkout or cloud environment. Transfer it privately through Settings → Save data → Download backup file / Load from file. Never commit the user's save or local test fixtures.

The full local conversation is not part of the repository. These notes preserve the implementation and user preferences needed to continue in a new cloud task. Do not claim the original chat itself was migrated just because the code was pushed.

## 2026-11-03 action skill and navigation pass
- Added four action-earned skills: Hunting (10 victories), Exploration (25 catches + 25 logs), Herbalism (20 harvests), and Enchanting (30 crafts + 20 smithing actions). Requirements use lifetime counters and migrate safely into old saves.
- Home now permanently shows an Unlocks ahead roadmap with exact live progress and buttons to each contributing activity. Locked skill rows and the compact left skill dock repeat the requirement.
- The left column is narrower (200px desktop), while hub/skill controls are larger. Unlocked skill rows show an XP bar and exact XP to the next level.
- Weapons retain distinct base intervals (dagger 1.6s, sword/bow 2.0s, staff 2.2s, warhammer 2.6s). Combat level reduces the interval by 0.3% per level, capped at 24%; the loadout shows the effective interval and earned bonus.
- Hunting earns XP from expedition victories; Exploration earns XP for first creature discoveries and first town visits; Herbalism earns XP by brewing; Enchanting consumes runes/gems to add ranks to equipped gear.
- New-skill notifications are prominent bottom cards and do not cover play. Skill/Hero level-ups retain the full reveal.
- Rebuilt `Play Idlewick.html`. Regression (35), art smoke, and current UI checks at 390/1440/1920/2560/3440 in both themes pass.
- Desktop navigation now reserves a 286px left panel for large skill rows (44px art, 18px labels, thicker XP bars); non-skill hubs use a sticky bottom navigation bar.
- Skill unlocks and individual skill level-ups are compact bottom cards. Only overall Hero levels use the full-screen milestone reveal.
- Skill activity figures hide equipped combat weapons/shields and display only their contextual work tool; inventory equipment remains equipped for combat stats.
- Hunting and companion collecting are separated: all monsters feed hunting/field research, while eight signature wild companions (one per region) can bond. Legacy owned wild companions remain visible and usable.

## Experience consistency audit (latest decisions supersede earlier notes)
- Skills have one desktop navigation source: left dock, all 13 entries visible without scrolling. Dock uses live level/XP binders. No duplicate skill tabs. Skill statistics and Mastery belong to Hero. Narrow layouts keep skill navigation in the Skills hub because the left dock is absent.
- Four action skills have no placeholder Hero-level unlock, and Hero level processing explicitly excludes action requirements. Locked pages show actions and routes to complete them.
- Desktop activity panels no longer repeat sidebar XP cards; tools/options remain on the task. First-use tutorials are short inline cards and persist until acknowledged. Optional Help opens full advice. New skill/feature unlocks mark a tutorial pending, including for an established player whose initial guides were hidden.
- Routine notifications remain compact/history; Hero milestones retain the full reveal. Skill unlock cards bypass ordinary notification suppression and offer a route to the lesson.
- Bestiary is a regional completion board: six visible research stamps, next target, complete/unfinished filters, silhouettes and detail entries. Companions remain a curated collection.
- Combat includes enemy/hero max hits, current interval, research-aware matchups and concrete weapon/spell counter suggestions. Regional additions now have anatomy/habitat-based weaknesses. Hidden knowledge is not exposed prematurely.
- Fixed enchanting gem IDs so real sapphire/emerald/ruby/diamond items can be consumed. Work sprites render without changing saved equipment.
- Validated 37 core regressions, art smoke, desktop storage, interaction suite, and an all-page audit covering 600 fresh/progressed/theme/viewport combinations. Tests use isolated saves. Screenshots inspected for skills, combat and bestiary. UI audit source is tests/ui-audit.cjs.
- Combat now has a dedicated entrance beside the top status bar, outside both the left skill dock and bottom general navigation. Fight and Bestiary remain its internal tabs. At narrow widths the entrance occupies its own row to avoid squeezing the HUD.
- Combat placement corrected: dedicated button directly above the Skills heading in the left sidebar. Removed the top HUD combat entrance. Skill row padding/gaps are reduced, with a capped overall list height so rows do not stretch on tall displays; shorter desktop layouts still fit all 13 skills.

## Combined main/work baseline

The branches are combined: the expanded game, artwork, navigation, notifications and desktop-save work coexist with the spare-equipment fixes. Both sides of the stylesheet conflict were retained; the standalone HTML was regenerated from source. Preserve both sets of behavior when continuing.

Merge verification: all 40 core regressions, desktop storage checks, artwork checks (253 distinct inventory drawings and 83 UI icons), and JavaScript syntax checks passed. An older isolated browser save opened successfully with the new skills/navigation and spare labels. Browser checks covered 13 main/new screens at 390px and 2560px in light theme, plus six key screens at both widths in dark theme, with no dropdowns, render errors, horizontal overflow or console errors. This merge did not run the separate full 600-case UI audit or build native Steam releases.

## Menu spacing correction (supersedes height-compression rules)

The left menu uses a 232px column, consistent 6px × 10px row padding, 32px skill icons and natural row heights. Removed the overlapping fixed-height grid and 1px-padding rules. Rows never stretch to fill a tall screen or squeeze their text to fit a shorter one. At shorter desktop heights, the skill list scrolls within the space above bottom navigation; all 13 skills remain reachable. This intentionally supersedes the older requirement to force every row on-screen without scrolling. Browser checks at 1440 × 720/900, 1920 × 1080 and 2560 × 1440 found no clipped row contents or navigation overlap, and the bottom skill was successfully selected in a short window.


## 2026-11-04 catalogue and painted-art pass

Gathering now exposes every region's resources in level order, with level/location labels and inspectable locked choices. Start and queue remain gated; View town opens the selected location on the map. Removed the duplicate elsewhere listing. Shared activity choices are compact 100px cards with fixed-size art. Fixed the inherited align-items:start that was shrink-wrapping the activity workspace on wide screens. Mid-size desktops put a horizontal action panel above the full-width catalogue.

User superseded the pixel-art direction with natural painted models. The first converted sets are all 15 fish (including raw inventory icons) and all nine trees. Generated transparent atlases are in assets/painted; art_painted.js overrides those assets only. Heroes, enemies, equipment, cooked fish, and landscapes still use existing art, so this is not a completed whole-game art conversion. Packaging embeds atlas PNGs into the standalone HTML. Do not replace distinct cooked-item art with raw fish illustrations.

Validation: 41 core regressions including all-region visibility and locked preview gating. Isolated browser save tested for fishing start/stop, locked fish preview, responsive catalogue columns at 390/1024/1440/2560, and painted art in both themes. Personal save untouched.

## 2026-11-04 painted models, Scholarship and economy

Painted models now cover 69 combat creatures, the companion collection, farm animals, thieving targets, five tiers of gathering tools, equipment classes, navigation icons and the hero. Hero face is deliberately weathered/asymmetrical; pets have natural resting mouths. art_painted.js selects atlases; painted_runtime.js composites equipped gear and saved appearance colours and provides smooth whole-model battle motion. Landscapes and remaining material/utility icons retain prior art. Preserve transparent PNGs and embedded-build blob URL conversion (large data URLs exceed CSS variable token limits).

Research is now Scholarship, id/page research retained for saves. Unlock at Hero16, tiers at Scholarship1/10/20/30, second slot at Scholarship20 or legacy Hero40. Projects give XP once; repeatable Field notes bridge gaps. Legacy completed projects receive base XP once only when xp.research is absent. Existing benefits, active projects and purses are retained.

Economy tuning is prospective: gathering cash roughly30% baseline, mining gem chance0.4% (formerly4%), monster cash35%/boss20%, thieving30%, quest65% except first_steps, achievement35%, most sale values50%. Purchase prices and existing coin balances remain unchanged. Offline cap remains8h real/5h effective even after32h absence. All eight towns now have finite gathering coin multipliers. Central tuning lives in economy.js after data3.

Validation:45 core regressions, including Scholarship migration/repeatability/tier gates and32h cap. Browser testing uses isolated8766 save, never personal8765.
Browser checks also passed for painted equipment/companions, live combat, Scholarship start, light/dark themes and390/1440/2560 widths. No console errors; desktop storage and all JavaScript syntax checks pass. Proof: outputs/Idlewick-painted-update.png in the surrounding workspace.

## 2026-11-04 final feedback pass — handoff to Claude Code

- Encounter events refresh the HUD as well as the arena. Combat level uses the live combat binder in the left entry.
- Forecasts suppress live events and save writes; their inline results survive combat rerenders. Equipment comparisons use the same retained result. Trial state is still restored by plan.js.
- Scholarship start was verified in-browser; active cards now explicitly say Studying and count down. Disabled starts explain missing supplies or busy slots.
- Exploration shows saved creature discoveries, area discovery counts, completed quest counts and boss state per town. Discovery means first victory, not merely encountering a creature. No retroactive invented exploration history.
- Town projects select the current town. Existing well/inn save IDs and effects retained. Seven later towns each have a distinct restoration project with a small permanent +2% resting recovery bonus, paid once. Pinning, local action counts, progress and completion stories work for regional projects. Scene uses the correct town; regional restorations currently update the story/effect, not bespoke scenery artwork.
- Travel animation now completes safely if the map is removed during navigation.
- Left rail208px (was232), natural52px skill rows,28px icons,15px labels; card headings/buttons tightened. Secondary HUD rates hide below1500px to keep the active target readable.
- ResizeObserver measures actual bottom-menu height and reserves it inside #app plus24px. Tested bottom actions above navigation at390px and desktop; wide2560 adds columns.

Validation:49 core regressions, desktop storage checks, JavaScript syntax and diff whitespace checks. Isolated8766 browser save verified changing encounter/HUD agreement, forecast result/comparison persistence, Scholarship start/countdown, Mossbarrow travel/project completion, Exploration, desktop/mobile bottom clearance, light/dark themes,390/1280/1440/2560 widths. Personal8765 save untouched. Rebuild standalone via python3 scripts/package-game.py. Generated build is committed; preview server auto-rebuilds. Source and handoff are ready to continue in another coding tool.

## Branch consolidation — latest instruction

`main` is now the sole branch. Both remote branches had identical history at da7e54e (zero unique commits on either side), so no merge was necessary. The redundant `work` branch was removed at the user’s request. This supersedes earlier references to maintaining or pushing both branches. Continue from `main` only.


## 2026-11-04 Claude Code: Living World update (in progress)

Approved roadmap stages are implemented in order. Research/Scholarship lives in the **Skills** hub (this supersedes the older note placing it under World).

### Stage 1: confirmed bugs and farming
- Auto-replant now plants the player's chosen seed (`farm.next`, saved; older saves default to null) when seeds and level allow, otherwise the harvested crop as before. Workers keep their own crop. Choosing a seed persists across reloads.
- Pens render above the animal market. With no animals, a "Your pens are empty" card offers "Find a hen", which scrolls to and spotlights the Hen row and focuses Buy (never buys). Empty pens are buttons to the same route. Locked seeds say "Needs Farming N".
- Starting a task that First Steps asks for accepts First Steps automatically (never during forecasts or offline simulation), so a new hero's first catches and logs count.
- Cards are held behind the welcome-back summary (`DQ.holdNotes`) and follow it after Continue. Level reveals are unchanged.
- Repaired stale browser tests after the Scholarship and painted-model changes; removed obsolete historical scripts. Validation: 52 regressions, desktop storage, ui-current (all widths, both themes) and the 600-case ui-audit pass.

### Stage 2: one clear objective and contextual routes
- Home leads with the journey destination (the single primary objective), then the two nearest action-skill unlocks (the full list stays in All skills), then other suggestions. The plain welcome line only appears when the intro card is hidden.
- Boss preparation follows the cached battle forecast (`DQ.bossForecast`): at 75%+ wins it says challenge; otherwise it asks for food sized to the forecast's food-per-kill, or a little more strength. The old fixed "five health bars" target is gone.
- `js/routes.js`: `DQ.sourceOf(item)` finds the earliest source (gathering node, crop, animal, recipe, shop, creature drop). `UI.routeChip(item)` appears beside missing recipe ingredients, town project costs and Scholarship costs; it opens the page with the right card selected. A "Back to …" bar returns to where you were; hub navigation clears it. Locked skills open their explanation page.
- Validation: 54 regressions, ui-current and the 600-case ui-audit.

### Stage 3: Willowbrook and regional restoration
- Willowbrook gains four projects after the well and inn: forge (Smithing 5% faster), gardens (crops 5% faster), reading room (+2% XP) and watchtower (monsters deal 2% less damage). Each adds a visible prop to the Willowbrook scene; the scene cache key now includes every finished project for that town.
- Regional projects use their region's materials (crops, fish, ore, logs and bars) and each grants a distinct benefit. All seven still include the original +2% resting recovery, so saves that finished one earlier keep exactly what they had and gain the new effect. Restored regional towns show bunting and one project-specific prop.
- `D.PROJECT_VOICES`: a one-line villager reaction appears in the completion card and the "A living …" panel. Project completions are now visible cards (`project:` keys use the `now` tier).
- A "Restore Willowbrook" destination follows the next unfinished village project. Project steps route the first missing material to its source (or explain the locked skill). Journey tasks that cannot start open the activity page instead of doing nothing.
- Project benefits support `speed_<skill>` and `xp_<skill>` keys. Validation: 56 regressions, ui-current and the 600-case ui-audit.

### Stage 4: adventures and rare discoveries
- `js/adventures.js`. Five once-per-save discoveries (`D.DISCOVERIES`) roll in `DQ.qev` while gathering or fighting in a specific region, with a per-action rate and a pity count that guarantees them. They never roll in forecasts; during offline simulation they are recorded (`disc[id].away`) and listed in the welcome-back summary instead of alerting.
- Three adventures (The Miller's Map, The Lantern Under Ironpeak, The Fallen Star) are ordinary chained quests with `secret` (hidden from the quest log until their discovery) and `adventure`/`stage` tags. They cross gathering, cooking, smithing, crafting, farming, combat and a new `guide` objective that fires when the player reads a creature's field-guide entry.
- Each finale grants an artefact (`type: 'relic'`, unsellable). Holding it reveals a Willowbrook relic project (bell, lamps, star) that consumes it, adds a scene prop, a villager line and a small benefit. Relic projects stay hidden without the artefact.
- One discovery offers a choice (the lost traveller), and one is a lore find with a one-time reward. Discoveries are revisited on the Exploration page ("Discoveries", with adventure chapter progress) and never spoil unfound secrets.
- Save field `disc` (older saves default to `{}`). Validation: 60 regressions, ui-current and the 600-case ui-audit.

### Stage 5: audio
- Master volume, plus a separate nature-ambience bus with its own toggle and volume (settings `masterVol`, `ambience`, `ambVol`; older saves gain defaults). Ambience dips during fights.
- Procedural ambience per region (no audio files, so no licensing): a slowly breathing filtered-noise bed plus loose-timed details (birdsong, crickets, waves and gulls, whistling wind and drips, frogs, fire crackle, chimes, a low drone and whispers). It crossfades when the town changes and pauses with the tab.
- Warmer event sounds (soft bell partials with a little reverb) for level, quest and equip, and new flourishes: `restore` (project completion), `region` (first arrival in a town), `adventure` (final chapter) and `collection`. A cap stops more than five ordinary sounds starting within 400ms; milestones always play. Offline replay stays silent.
