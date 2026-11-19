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

## One-screen overhaul, stage 1: shell (Nov 2026, Claude Code)
- Approved concept canvas: top bar holds the hero, the page menu (Home, Quests, World, Village, Hero, Shop) and coins/bell/settings/mute. Village is a new hub (Town projects, House, Workers); World is now Map and Exploration.
- Left column (208px): Now card (current task, progress, count opens the plan, Stop/Retreat; gold outline when you are on its page), Combat, then all 14 skills at 44px rows. Fits 1440 × 900 without scrolling; shorter windows scroll the column.
- Top menu compacts below 1480px (packchip hidden) and turns icon-only below 1290px. Phones (≤860px) unchanged: bottom bar now includes Village.
- Follow-up (MacBook Air feedback): below 940px tall the left column compacts (36px rows, two-line Now card with a square Stop) so no scrolling down to 720px. Activity pages lock to the window; only `.illustrated-choices` (or the farm animals panel) scrolls. `tests/ui-fit.cjs` covers 1440×900, 1470×820, 1440×780, 1280×800 and 1280×720.
- Stage 2 (Nov 2026): choice cards stack (art on top, short text below; locked = ??? + "Lv 26 · Reach Saltmere", full text in tooltip). Pixel snapping fits both width and height. Desktop shell for every page: window never scrolls; Quests list + detail; Scholarship summary left / projects right; long lists scroll in Exploration, Shop, Map, Skill levels; Combat: `.combat-top` (arena, arena controls, style strip | creature list scrolling in place) stays on screen; `.combat-more` (fighter, abilities, food | preparation, boss, loot) scrolls beneath, min 96px; very short windows fall back to the content area scrolling.
- Stage 3 (Nov 2026): whole-page scaling to a 1920 × 1080 design (`js/scale.js`); Combat in three columns; House rebuilt around the pixel cottage with furniture cards; one `#pagebar` row for page tabs, Back-to link and pinned quests; skill-row action counts sit after the skill name.
- Backdrops (Nov 2026): `js/backdrop.js` paints 18 scenes (2 everyday choices + 16 combat areas) into cached data URLs; html.has-backdrop + --backdrop; Settings → Backdrop.
- Folk (Nov 2026): 27 quest givers in `D.FOLK` with portraits and notes; Quests hub gains a People tab; S.folkSeen tracks notes already announced (first sync on an old save is silent).
- Readability review (Nov 2026): desktop zoom floor 85% (1280 and 1440 laptops no longer shrink to 67–75%); 13px minimum text; Combat buttons carry status and an Equipment shortcut; phone Combat order fixed (fight first), quest Pin anchored to its card, phone tab labels 12px.
- Combat balance review (Nov 2026, docs/combat-balance.md): ability slots auto-fill for fights; Hollow King final form no longer resists aether; prep advice names clear gear upgrades; Fury +10% always; new scripts/sim-uniques.cjs.
- First-hour polish (Nov 2026, docs/first-hour.md): food-before-training step, lagging-skill focus step, forecast cache fix, first boss win ends the fight, overkill XP removed, direct-action advice, unlock pop-up carries the skill guide; scripts/play-first-hour.cjs walkthrough.
- Next stages: paged choices with a context panel, Quests as list + detail, Combat and Scholarship fitted to one screen, page merges, a 1280 × 720 fit test.

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

### Art completion pack (from Codex) and Stage 6 character fixes
- The pack is merged and live through `js/art_completion.js`. `scripts/build-art-delivery.py` writes WebP delivery copies (25 MB of PNG becomes 6.8 MB) and `js/art_completion_map.js` (explicit crop rectangles; optional `place`). PNG sources stay untouched; re-run the script whenever the manifest changes. The packager embeds the WebP copies.
- Covered: food, logs, bars, arrows, ores, gems, supplies, potions, seeds, crops, mature plants, mining rocks, beehive, furnishings, cottage, worker portraits, all remaining utility icons (Strength/Defence/Health are now distinct), town landscapes, and before/after pieces for the original nine projects composited from saved state. Sheets load lazily with the old art as fallback.
- Later sheets are picked up automatically: item-id entries, `restoration*` sheets (with optional `place`), `soil`/`<crop>-stage1/2` growth stages. `docs/art-completion/NEXT-BRIEF.md` lists what is still missing: pieces for the newer Willowbrook projects and relic displays (until then the painted landscape shows no change for those), the six relic items, growth stages, a woodcutting worker, fitted hero equipment layers and an optional painted world map.
- Hero compositing (`painted_runtime.js`): under body armour the tunic becomes a dark padded layer, trousers under leg armour likewise, and full metal helmets hide the hair. The leather coif keeps the hair until fitted art exists.
- Standalone build is about 42 MB and reaches the title in about 3.3 s headless.

### Stage 7: economy evidence
- `scripts/sim-economy.cjs` and `docs/economy-evidence.md`. Codex's tuning leaves about 40% of the earlier coin supply; early prices are reached quickly and about 3.4M coins of long-term sinks remain. No rebalance was made.

### Stage 8: game feel, QA and playtesting
- `js/feel.js`: equipping an upgrade floats "+N max hit · +N defence" from the hero; finishing a project bursts particles from its card and briefly warms the town scene. Both are off in forecasts, offline replay and reduced motion.
- Discoveries appear on the Exploration page even while that skill is locked.
- New regression for a pre-update save (no new fields, legacy regional project) loading with defaults and playing two offline hours. Keyboard pass: route buttons, first-animal button, empty pens and discovery cards are reachable with visible focus rings. ui-current's effect-cleanup check now waits up to 2.5 s rather than sampling once at 1 s.
- `docs/playtest-plan.md`: profiles, observations, questions and signals for human playtests.
- Final validation: 61 regressions, desktop storage, JavaScript syntax, ui-current (all widths, both themes; three consecutive passes) and the 600-case ui-audit. The claude.ai published page was not updated (no release was authorised).

## Fitted hero armour (Codex next delivery, integrated)

- `js/painted_runtime.js` draws Codex's `hero-leg-layers`, `hero-body-layers` and `hero-head-layers` onto the hero's own pose, in that order. Metal sets map to bands (bronze/iron, steel/mithril, adamant/runite, astral) and keep their own colour through a light tint; every coif uses `head-leather`. Robes, leather bodies/legs, the Hollow Crown and Grubnash's war-helm keep the earlier painted equipment pieces.
- Each layer is trimmed to its alpha bounds once. Helmets measure their own brim row and face opening, so the opening is centred on the face with the brim just above the eyes (the dome is lightly squashed vertically if needed to stay on the canvas). Legs are remapped column by column because the painted stance is wider than the hero's. Hands are redrawn in front of the body layer.
- Under a fitted helmet the hair outside the face becomes a dark lining (no old face patch). Under fitted legs the trousers become a dark padded layer down to the boots. Layer readiness is part of the hero cache key, so the figure upgrades as the sheets load and falls back to the earlier pieces until then.
- `js/art_completion.js` exposes `DQ.completionCrop(sheet, id)` (full-resolution source rectangle). `scripts/build-art-delivery.py` now exports per-entry `target`s as `t` and keeps existing WebP files byte-for-byte unless `--force` is passed.

## Pixel-art rebuild and playtester fixes (Nov 2026)

- **Art**: every painted/AI image was removed (assets/painted, assets/art-completion, their scripts, manifests and tests). All art is now code-drawn pixel art: `pixelart.js` (Spr canvas with materials, automatic top-left lighting, selective outlines; shared ramps `R`, `SKIN`, `HAIR`; the 24 x 32 hero with three faces and fitted equipment), `pixel_items.js` (every item at 16 x 16, families with per-item silhouettes), `pixel_creatures.js` (anatomy builders and a spec for every monster, wildlife creature, companion, townsperson and farm animal), `pixel_world.js` (nine tree species, eleven rock formations, eight town scenes with all sixteen restoration projects in broken and restored states, furniture, workers, skill and menu icons) and `pixel_runtime.js` (installed last; routes itemIco, artImage, creatures, plants, animals, scenes, hero figures and portraits, battle rigs, furniture, cottage, workers and `.pxi-*` icons). `DQ.pixelArt.coverage()` is empty. The older code-drawn modules (pixel.js, sprites24.js, art48.js, art_identity.js, gear.js, herogear.js, icons48.js) still load as base layers but every hook is overridden.
- **Showcase and guide**: Settings → Art showcase (page `showcase`); `docs/pixel-art-style.md` records the rules and the internal prototype review. The owner approved this art style after reviewing the rebuild and the showcase.
- **Faces**: hero creation offers three faces (`look.face`, default `bright`; older saves get the default through merge).
- **Progression**: combat XP chip no longer folds catch-up into "+N% XP" (catch-up shown separately, eases off smoothly); gear for unlearned Ranged or Magic neither drops nor sells, with who teaches the skill; A Hunter's Bow needs only Mossbarrow and Hero 18; basic leather needs Defence 1; recipe levels cap at 99 (astral platebody).
- **Usability**: travel states where you are and what opens each road; level-up notes open the new recipe or node; Ready to make is a switch; materials list their uses with a route; denser type and spacing at 100% zoom; the combat page uses two stable columns.
- **Reliability (earlier in this pass)**: project pins never block loading; relics are unsellable keepsakes with safe recovery; live crop art follows growth; study objectives open the guide and reveal weak points; Emberfall's ashen anvil discovery; ambience timers no longer accumulate.

## Enthusiasts and sceptics pass (Nov 2026, Claude Code)

Read `docs/experience-assessment.md` first: the prioritised findings, the before and after evidence, the skill audit and the proposals awaiting approval.

- **First boss**: Grubnash opens at combat 8 (level 12, 20 health, max hit 3, attack 7, defence 6). His mechanics and drops are unchanged. Evidence comes from `scripts/sim-opening.cjs` and `scripts/sim-bosses.cjs` (see `docs/economy-evidence.md`).
- **Preparation**: `DQ.prepAdvice(monId, forecast)` in `plan.js` gives concrete, honest steps from the real save. `UI.prepSteps` and `UI.specialLine` appear on the boss card. Forecast results say "Estimate … Not a guarantee". The Home objective uses the same advice.
- **Level-ups**: `DQ.heroRevealWorthy` keeps the full Hero reveal for levels that unlock something and every fifth level. Other levels get a compact card that is always shown. Offline Hero levels merge into one card that keeps every unlock.
- **Opening arc**: First Steps has a motive (the well's winch). `thanks` lines on four Willowbrook quests (in `journey.js`) are shown as a card. The `goblin_satchel` discovery (adventures.js, reliable within four goblins) offers XP or coins.
- **Return**: `DQ.returnChoices()` and `UI.returnChoices()` add "Other good options" to the welcome-back summary.
- **Icons**: every `DQ.ICONS` id has pixel art (`pixel_world.js`), and `tests/art-pixel.cjs` enforces it. `UI.choiceIcon` puts icons on all button choices. The action bar uses the task's item art without a tinted tile.
- **Open**: late bosses need a counter-aware simulation. Bestiary mastery objectives and companion effects are proposals awaiting approval.
- **Approved and built (Nov 2026)**: slayer goals in the field guide (`DQ.slayerGoals`). Titles: regular creatures at 250 defeats ("Goblin Slayer"), bosses at 50 ("Bane of Grubnash"), stored as `S().title = 'beast:<id>'` and worn from the guide. Boss trophies at 10 defeats (`trophySprite` in pixel_world.js, `DQ.trophyArt`) can be hung on the cottage Trophy wall (`S().house.wall`, defaults to an empty list for older saves). Titles and trophies are announced once each; stars stay quiet.
- **Companions (approved and built)**: the 17 curated companions keep half their passive and gain a signature trick (`D.TRICKS` and `DQ.trick(key)` in `js/companions.js`, with hooks in `engine.js` gather, thieving, recipe and combat code). Tricks apply in forecasts and offline; floating text shows only live. See `docs/companion-effects.md`.
- **Late bosses**: `COUNTER=1 node scripts/sim-bosses.cjs` shows counters win 100% through Zephyrion (Hollow King 67%). No retune yet.

## Deeper RPG pass (Nov 2026, Claude Code)

- **Unique gear** (`data.js`, `unique: { key, name, text }`; effects in `engine.js` combatRound / monsterAttack; `DQ.uniqueFx()` in state.js). There are 11 new uniques with modest stats and one signature effect each: Leechfang (lifesteal), Wyrdwood longbow (hunter's mark), Thornback buckler (thorns), Viper's kiss (poison), Gale sabre (twin cut), Thunderclap maul (stun), Stormcaller staff (arc), Berserker's torc (fury), Salamander coat (last stand), plus the Warden's greathelm (bulwark) and Smuggler's knot (fortune) from the questline. The eight boss trophies also gained effects (roar, thick hide, riposte, frostbite, bog hex, ember arrows, gale, crown of sorrow). Each regular drop comes from one regional monster at 1/150–1/260, with the first copy guaranteed after about 2.5× the expected defeats (`S().upity`, `S().uniqFound`). Effects show in tooltips and the gear comparison (`UI.uniqueLine`). Inventory and bank cards mark better (▲), worse (▼) or unique (✦) gear (`DQ.gearVerdict`).
- **The Silent Bells** (`adventures.js`, adventure `bells`, Hero 18–28): six chapters across Mossbarrow and Saltmere with Granny Bramble, Harbourmaster Ilsa, Sergeant Orrin and Mother Silt. The ledger decision (`choices` on `bl_ledger`) changes later dialogue, the chapter-five quest-giver and the reward (greathelm or knot).
- **Lasting choices**: `DQ.choiceOf(key)` reads quest decisions (`S().choices`) and discovery choices. Quest text, givers and rewards can be getters (`vary()` in adventures.js). Echoes: goblin satchel → Orrin's lines; lost traveller → Ilsa's welcome and reward; ashen anvil → Wyrmslayer's reward and line; the bells → late boss quest lines (Frostmaw, Morwenna, Pyrrhax, Zephyrion, Hollow King).
- **Adventure journal** (`js/journal.js`, Home → Journal): one line each for boss victories, story quests, decisions, discoveries, unique finds, new skills, Hero milestones, restorations, first arrivals and time away, grouped by day. Saved in `S().journal` (capped at 200). Older saves get one "story so far" entry. It listens to existing systems and never notifies.
- **Bosses**: for bosses only, a weakness gives ×1.3 (×1.6 with Focus) and a resistance 70% (ordinary monsters unchanged). Old Tusk, Barnacle, Frostmaw, Morwenna, Pyrrhax, Zephyrion and the Hollow King were retuned so a fully prepared hero (field-guide counter, its abilities, 15 food) wins about 75–95% at the requirement; plain melee is a long shot from Frostmaw on. Evidence: `COUNTER=1 node scripts/sim-bosses.cjs`.
- **Presentation**: skill unlocks use the full reveal dialog (owner request); the Hero level-up star is its own 32 × 32 design at 3×; work scenes draw every target at the hero's 3× scale; obvious tooltips and "how it works" boxes were removed (owner request).

## Nice little touches (Nov 2026, Claude Code) — `js/touches.js`

Quiet details layered onto existing scenes; no new menus or notifications. Motion is CSS (time-based) and is off with Reduce effects and reduced motion.
- **Work scenes**: up to two townsfolk appear once a town has restored projects (land scenes only); your equipped weapon leans beside the hero; your active companion sits beside you (fish, ghosts and birds float) and hops when its trick fires. Armour already showed on the working hero.
- **Time of day** follows the player's clock (`DQ.timeOfDay`, `body[data-tod]`, a `.tod-tint` layer) in work scenes and the arena. **Weather** by region (pollen, leaves, rain, snow, mist, embers, wind, motes).
- **Journal memories**: 100th and 1000th defeat of a creature, first catch of each fish from level 20, first 8-hour absence, first knockout (`S().memories`).
- **Unique finds**: their own chime (`unique` in audio.js) and a glow on the item in the pack until viewed (`S().freshUnique`).
- **Boss tells**: a pulsing "!" over the boss before its special (`bossTell` event) and a short arena shake when it lands (`bossSpecial`).
- **Title nod**: the first time each quest-giver sees a worn title, they mention it on the quest-complete card (`DQ.titleNod`, `S().nods`).
- **Door notes**: after 4+ hours away, sometimes (seeded by day) a short note from a local villager in the welcome-back summary.
- **Night home**: at night, Home opens with the lit cottage (or the inn's hearth) and what the night shift is doing.
- **Left menu** tooltips name each skill's next unlock (`UI.nextUnlock`); the title screen's Continue says what you were last doing.


## Review response pass (Nov 2026, Claude Code) — from 438b1e1

Full write-up: `docs/experience-assessment.md` → "Review response".
- **Fixed**: Gale did nothing (a late duplicate `DQ.combatInterval` in skill_expansion.js); one definition now lives in engine.js. Every unique effect and companion trick counts its triggers in `DQ.effectHits` (transient). `tests/ui-effects.cjs` proves each fires in live play, offline catch-up and forecasts, stops when removed, and survives save and reload, in the real page.
- **One damage-type rule**: `D.TYPE_RULES` (data3.js) feeds the engine (`DQ.typeMult`) and all guidance (`DQ.typeRuleText`). Never hard-code "+50%" or "half" again.
- **Preparation advice**: covers bows (pierce), arrows, runes, any raw fish, ability slots and specials, owned potions, brewable Might and ready enchantments (bosses only, and only when the forecast says you are struggling). A boss defeat names the most useful change (`DQ.lastFoe`, plan.js notify wrapper).
- **Herbalism / Enchanting**: first-goals panel on the Brewery; `DQ.enchantPlan()` ranks worn items by the share a rank adds.
- **Home**: the Next step card (`DQ.journeyDoneWhen`), destination below; the onboarding intro panel only returns if the guides are restarted.
- **Simulator**: sim-bosses loads lore, hunting, bestiary, skill_expansion, adventures and companions; `COMPARE=1` (and `PARTS=1`) runs the preparation comparison.
- **Awaiting approval**: Hollow King retune, a late-magic parity check, stacking-to-guarantee, Healing draught auto-drink, bestiary understanding objectives.
- **New tests**: `tests/ui-effects.cjs`, `tests/ui-journeys.cjs` (both need a preview server).

- **Approved and built (Nov 2026)**:
  - **Healing draught:** drunk automatically when food runs out below 25% health, once per fight (engine monsterAttack).
  - **Hollow King:** requirement 97 (the highest any single style can reach; a regression checks every boss), health 580, max hit 36.
  - **Bestiary understanding:** objectives (`DQ.understanding`, `DQ.understood`) raise the research rank by one when done, and bosses get a gold-rimmed trophy (`trophySprite(id, gilded)`). The counters live in `S().beast.weakWins` and `S().beast.answered`.
  - **Simulator:** `PARITY=1` compares the styles at equal combat level. Late magic is not behind; melee is the weakest style at equal combat level (left for a decision).

## Melee, experimentation, goals and the combat page (Nov 2026, Claude Code) — from c64fa8f

- **Melee parity** (approved): `D.STYLE_TUNE.meleeLevel` = 4/3 in `DQ.pstats`. Evidence and the open decisions are in `docs/economy-evidence.md` → "Melee parity".
- **Saved preparations** (`js/loadouts.js`): up to six named loadouts in the Inventory (equipment, abilities, spell, ammunition), with the changes listed before applying, bank withdrawals, missing and locked items shown, and "Return to previous". Copy build is here too. A captured `null` slot means "empty"; a slot that is absent is left alone.
- **Loot suggests a plan**: `D.UNIQUE_USE` gives each unique a "Good for …" line. Its first-find notification has Inspect. `DQ.uniqueSource` (bestiary.js) names the source, and a first-copy guarantee shows on the drop table. Drop rates are unchanged.
- **Goals**: after Grubnash, `DQ.regionNext()` drives the Next step. `DQ.optionalGoals()` adds up to three "Also worth doing" goals (short, a few sessions, long). `D.BOSS_VOICES` adds a spoken line to each boss victory and a villager note afterwards.
- **Return and sharing**: the welcome back screen shows "Since you left" from the journal. Copy my story (journal) and Copy build (Inventory) are user-triggered only, with no save data or identifiers.
- **Combat page** (ui_core `UI.V.combat`): the left column is you (arena, a fighter panel showing each combat skill once beside its Train focus, abilities, food). The right column is the fight (hunting areas, the chosen foe's preparation `<!--battle-brief-->` filled by experience.js, the boss, loot). On phones it is one column in play order (CSS `order`). The separate Loadout and Combat skills panels are gone. layout.js no longer moves combat cards.
- **Combat-level bar** (`DQ.combatProgress`): follows the trained skill's route (`route`), so the percentage and "N XP reaches combat X" agree.
- **Interface**: creature rows in hunting lists open the field guide, at 64px. `A.EMBLEM` gives 32px skill emblems for sizes of 32 and up (the 16px glyphs remain for inline icons). A newly unlocked skill shows a "New" badge (`S().newSkills`) until its page is opened. Backpack and bank categories stay on one line. Headings no longer use Pixelify Sans, whose C reads as O ("Oowhide"); it stays on map labels and the logo. Notifications and the detail box sit above the bottom menu (`--bottom-navigation-space`). Work scenes show the best owned tool and no longer the weapon. Quest cards read: name, place, story, requirements, rewards, action. The map's location card lists what is left to explore, with Exploration and Quests links. Recent activity icons are 32px.
- **Early pace**: `D.EARLY_PACE` (non-combat skills only). Evidence is in `docs/economy-evidence.md` → "Early pace".
- **Proposals, not built** (need approval): `docs/proposals.md`.
- **Tests**: regression covers melee parity, saved preparations, unique plans, later regions, return/sharing, the combat-bar route and early pace. ui-current covers the combat layout, field-guide links, the New badge, no weapon in work scenes, quest order and the map summary. ui-effects covers the Night study test.

## Town quests to each boss (Nov 2026, approved: "add enough quest options in each town")

- 29 quests in data.js (`TQ(...)`, after the main quests), so that every town has a quest available within 6 Hero levels from its first quest to its boss. Willowbrook +2, Mossbarrow +2, Saltmere +2, Ironpeak +5 (Hero 34–46), Gloomfen +4 (60–67), Emberfall +4 (77–86), Skyreach +5 (84–95), the Hollow Crown +4 (90–98).
- They use only existing creatures, gathering spots, recipes and crops. Givers are existing characters except where a town had none to spare. Each has a `thanks` line, shown on the claim card and in the journal. Rewards follow each region's neighbouring quests (coins pass through economy.js as usual).
- Regression: every objective must point at a real creature, spot, recipe output, crop or item; every requirement must exist; ids must be unique; and no town may have a gap of more than 6 Hero levels between quests.

## Nov 2026 brief: clearer RPG, fewer errands (Claude Code) — from 69f7422

Stages are separate commits so each can be reverted on its own.

**Stage 1: readability and navigation (c65e564)**
- **Type:** a "UI standard" block at the end of css/style.css: 16.5px body, 16px buttons, Alegreya SC headings, 14px meta text. Delete the block to revert.
- **Rail:** icon, name, level or lock, and one bar; exact XP is in the row's hover/focus detail. Every skill fits at 1440 × 900.
- **Header:** health sits with the name and Hero bar. Stop is a neutral labelled control. Action progress and skill-level progress are separate bars.

**Stage 2: layouts (d66f825)**
- **Combat:** `DQ.combatFocus()` is the single selected encounter for the preview, the brief and the start/retreat strip. Also: `DQ.dangerOf(m)` gives a labelled danger line, the eat threshold is a stepper, abilities show slots first with Ready/Future tabs, and a defeated boss is an optional rematch.
- **Home:** `S().journeyTarget` fixes a boss goal when you choose it, and `DQ.goalDone()` drives the "Goal complete" panel. "Choose a goal" is a dialog.
- **Inventory:** a stable `#detailbox` on desktop and 48px item art. Tools moved to Hero → Tools (`UI.V.tools`).
- **World:** the map is the selector. The region list under it uses the map's names, and locked names no longer leak.

**Stage 3: everyday resources and skill unlocks**
- **Gathering from any town:** `DQ.nodeHere(n)` (state.js). An ordinary fishing spot, tree or ore can be worked from any town once its home town has been reached.
- **Regional exceptions:** thieving targets, and the signature resources in `D.SIGNATURE_NODES` (skyfin, void eel, elder, gloomwood, astralite, voidstone).
- **What stays local:** discoveries and adventures still check where you are. Revert by making nodeHere return `n.town === S().town`.
- **Unlock rules:** in data3.js, built on the existing actionReq system with requirement kinds hero, combat, skill:, tool:, own: (kept), use: (consumed when learned), visit: and beasts. `DQ.reqProgress` / `DQ.reqLabel` (state.js) supply progress and labels. `UI.unlockSteps` (skill_expansion.js) is shared by the locked page and Home's "Unlocks ahead".
  - Cooking: 5 fish caught + 5 logs chopped.
  - Mining: own any pickaxe (kept). It is sold in Willowbrook, or Old Brannoc's "A Miner's Pick" now asks for logs and rats instead of mining.
  - Farming: Hero 5, 15 logs chopped, 5 potato seeds (planted).
  - Scholarship: Hero 12 + 8 different creatures studied.
  - Hunting: 20 logs chopped, hold 3 wooden traps, combat 8. Leather string comes from a cowhide (Crafting 1), traps from 2 logs + string (Crafting 2). Held traps give +5% Hunting XP each, up to 3.
  - Herbalism: 20 harvests + Farming 10.
  - Exploration: 25 fish, 25 logs, visit Mossbarrow.
  - Crafting (Hettie's quest) now opens at Hero 8 and uses ordinary logs. Thieving, Smithing, Magic, Ranged and Enchanting are unchanged.
- **Older saves:** `migrate()` grants every skill the save had under `D.UNLOCK_BEFORE` (or any skill with XP), once, marked by `unlockRules: 2`.

**Stage 4: content, sources and making categories**
- **Content counts** (before → after): fish 15 → 29, trees 9 → 18, ores and minerals 11 → 22 (gathering 35 → 69). Recipes 121 → 196: cooking 22 → 49, smithing 57 → 72, crafting 42 → 75. Recipes are about 1.6×, not fully doubled; each addition has a real use rather than padding the count.
- **Largest gap between unlocks:** fishing 14 → 6, woodcutting 15 → 10, mining 15 → 9, cooking 10 → 7, crafting 9 → 6, smithing unchanged at 12.
- **Uses for the new content:**
  - New fish cook into food. Thirteen "fish suppers" combine a new fish with a crop (`dish` on the item).
  - New logs make nine wooden shields (`D.WOOD_SHIELDS`): about 60% of a metal shield's defence, plus ranged or magic.
  - New minerals, and silver, make twelve skilling charms (`D.CHARMS`), amulets that make one non-combat skill faster or give it more XP. `DQ.charmFor` in systems.js extends extraSpeed/extraXp.
  - Gathering tools can now be made (`D.TOOL_MAKE`, data3.js): Smithing makes pickaxes, axes and hoes; Crafting makes rods and gloves. Inputs cost about the tool's sale value; the shop sells at 3× that.
  - Formerly unused materials now have uses: silver, wolf pelt, gloomwood, voidstone.
- **Art:** new features in the fish drawer (flat, ray, spines, whiskers, bars, waves, veil, glow spots); new log features; eleven mineral structures in `drawOre`; nine tree kinds; `woodShield`, `charmSprite` and `dishSprite` in pixel_items.js. art-pixel.cjs passes (pixel-unique items, distinct fish and tree outlines).
- **Shared information:** `DQ.sourcesOf(id)` and `DQ.purposeOf(id)` (routes.js) add "How to get it" (gathering spots with level and any-town or regional, recipes with ingredients held, shops in reached towns, creature drops, quest rewards) and the item's purpose to every item tooltip and the inventory detail panel. All of it comes from the game definitions. Unmet creatures and unreached towns are never named.
- **Crafting and Smithing pages:** categories by material, then type (`DQ.recipeGroup`, ui_core.js). Smithing: Smelting, each metal (Weapons / Armour), Tools. Crafting: Armour (by hide), Wood (Bows / Staves / Shields), Arrows, Jewellery, Charms, Basics, Tools.
  - Each category chip shows how many items are ready, or a lock with its level.
  - Each card shows "Ready to make", "Missing …" (amber) or "🔒 Smithing 30 (you are 12)" (grey).
  - The stage follows the visible category.
- **Economy:** `sim-economy.cjs 24` gives 493k coins at 24h (461k before) and Hero 64 (63). New resources sell at about 80% of their neighbours' values.

## Sprite resolution and gear arrows (Nov 2026)
- Sprites up to 64 px are upscaled with Scale2x twice (4× pixels, same designs) in `js/pixelart.js` (`hires`, `logicalOf`); `snapAll` in pixel_runtime.js snaps to the logical size so layout is unchanged. Quest-giver faces use the same upscaler. Scenes and backdrops are unchanged.
- Gear arrows now compare the summed stat changes for every slot (weapons used damage per second, which marked Soldier's Blade as worse than a Bronze Knife). They show in the backpack, bank, shop, rare shop, recipe cards, item tooltips and the item panel ("Better overall · stats +10 in total"). Regression check covers every gear item.

## Six restoration projects in every town (Nov 2026)
- Each region now restores six places like Willowbrook: its original project plus five more (`moreProjects` in js/journey.js, ids `moss_*`, `salt_*`, `iron_*`, `fen_*`, `ember_*`, `sky_*`, `hollow_*`). Costs use regional materials and rise through the region (2–8 hours of that region's earnings in `sim-economy.cjs 24`; milestones unchanged). Bonuses are small and mostly skill-specific (+5% XP or +3% speed for one skill; a few +1% damage reduction, +2% coins, +3% food healing, +5% resting; Skyreach's bell is the only +1% XP to all).
- Every project has a villager voice and its own damaged/restored 32×32 piece (`piece()` in js/pixel_world.js keyed by `art`) placed in the town scene (`PLACE`).

## Recommended quest levels (Nov 2026)
- `DQ.questRec(q)` (js/meta.js) works out a recommended Hero level (the quest's own, or its region's first for adventures), Combat level (the strongest creature it sends you to fight) and the highest skill level its gathering/making steps need. Shown as chips on quest rows and a "Recommended" row on the quest card, green once met and amber before. Quest lists sort by `questRecScore` after main/ready quests.

## Lived-in towns, deliveries and the clickable village (Nov 2026)
- Town scenes (`js/towns.js`, replaces `sceneFor`) are 320 × 180: three rows of homes (lit and smoking when lived in; more are lived in as the town is restored), streets with townsfolk, the region's landmark and trade, and every restoration site along the front at its construction stage (`stagePiece`: ruin → foundations → walls under scaffolding → nearly finished → restored).
- Projects are built in deliveries (`DQ.projectGive/projectNeed/projectProgress/projectStage` in js/journey.js; `S().projectGiven`, sanitised on load). Each material can be handed over as you get it; completion happens when the last delivery lands.
- The Projects page is the village: `A.siteLayout(town)` places a clickable spot over each site (badge: ! ruined, % in progress, ✓ restored); the card beside it gives the place's small story, benefit, stage bar, materials with Deliver buttons. The scene renders at 3× (960 × 540) on full desktops and 2× on shorter or narrower windows.
- Buttons must not use `data-b` values that match a live binder (e.g. `coins`); project buttons pass `id|item` in `data-a`.

## Quest reward reveal (Nov 2026)
- `js/quest_claim.js`: claiming on the Quests page turns the quest card into a reveal (giver's thanks, then each reward tile pops in with its amount counting up on elapsed time). Stays until Continue, or until another quest/tab is chosen or the page changes. Reduced effects shows everything at once. The duplicate page banner is dismissed; the bell keeps the record.

## Notifications at the top; companion pop-ups (Nov 2026)
- Desktop: notification cards (`#notes`) and short messages (`.toast`) appear at the top right just below the menu bar; a short message sits above the cards. Phones keep them above the bottom menu.
- A new creature companion opens a pop-up (art, bonus, Make active / Meet them) through `DQ.popupQueue`, which waits for any open dialog to close; the bell keeps the record. Notifications with `popup` use this route.

## House room pictures and worker beds (Nov 2026)
- `js/house_rooms.js`: each House room button shows a 24 × 24 code-drawn room scene (`DQ.roomArt`). The Workers page opens with a Worker beds panel: beds filled (bed icons) and `DQ.bedPlan()`'s single next step for another bed (buy the cottage → build the Servants' quarters → place/upgrade Bunk beds, with the cost) and a button straight to that room. Beds come only from Bunk beds (+1/+2/+3 over the one you start with); the "No free beds" message names the next step.

## Short messages and away-choice results (Nov 2026)
- Short messages (`DQ.toast`) appear just above the button that was pressed (its position is remembered at the press, so redrawn buttons still count) when on the same page/dialog within 1.5 s, otherwise at the bottom; they draw in `#toastlayer` above dialogs. Notification cards stay at the top right under the menu.
- Choices from time away (`DQ.resolveEvent`) measure what changed (coins, items, health, new effects) and the card turns into a result in place, in both the welcome-back pop-up and Activity (`UI.eventResultHtml`); no message is sent behind the dialog. Results clear on leaving the page or closing the pop-up. Fixed a crash in `makeAwayEvents` when fewer event types were possible than the number rolled.

## Compact item tiles; lists keep their place (Nov 2026)
- Backpack/bank slots are 64px (48px art); shop stock tiles are about 100px wide (48px art, name, small price) in a wider stock panel.
- `js/keep_scroll.js` (loaded last) notes every scrolled element's position before a same-page redraw and restores it after, so picking an item no longer throws the list back to the top a moment later. Changing page still starts at the top.

## Compact top menu on narrower windows (Nov 2026)
- Below the 1600 layout width (`html.lw-1600`, roughly windows under 1360px) the six top-bar page buttons stack a 13px label under the icon, halving the menu's width so it never overlaps the coins, backpack and settings; `tests/ui-fit.cjs` checks 1000–1920px windows.

## Welcome back, at a glance (Nov 2026)
- `js/welcome.js` (`UI.welcomeBody`) replaces the text summary: a banner (portrait, time away in the Silkscreen pixel face, a status chip), picture tiles for level-ups, XP, coins, creatures and items (big abbreviated numbers), chips for quest rewards and research, one next-step card, picture cards for other good options (`DQ.returnChoices` entries carry `art`), then decisions. Decision buttons show their odds under the label instead of a line of text. Silkscreen is embedded from `fonts/` by the packager.

## Fantasy lettering (Nov 2026)
- New default type, "Storybook": Cinzel headings, Alegreya (calligraphic book serif, weight 500, lining figures) for text, buttons and numbers, replacing the thin Alegreya Sans and the JetBrains Mono code font. Settings → Lettering also offers Adventurer (MedievalSharp headings), Pixel (Silkscreen + Pixelify Sans) and Original. Applied via `type-*` classes on <html> that redefine the font variables; all fonts are local variable woff2 files in fonts/ (SIL OFL), embedded by the packager.

## Thieving purpose, cooking, burning, selling animals (Nov 2026)
- Thieving now matters beyond its (deliberately low) coins (`engine.js`): Silver tongue (shops 0.15% cheaper and buy 0.2% dearer per level: `DQ.buyPrice/sellPrice`, used by the shop, item panel and `DQ.buy/sell`); Lockpicking (treasure chests +1% coins per level from 20, a second gem from 30; "Pick the lock" choice on away chests from 25, `DQ.pickChance`); signature hauls more likely above the target's level. Announced as level unlocks (D.UNL) and shown as chips on the Thieving page (`UI.thiefPerks`). sim-economy milestones unchanged (the simulated player does not train Thieving).
- Cooking: any raw fish you hold can be cooked whatever your level (`DQ.recipeLvlOk`); level sets the burn: 30% at the recipe's level, −2.5%/level above to 1%, +4%/level below to 85% (was 55% at level, −2%/level). Cards and group tabs follow.
- Farm animals can be sold (half price, stored produce collected first) to free a pen: `DQ.sellAnimal`, Sell button with confirmation on each pen.

## Tools are equipped, not carried (Nov 2026)
- Owned tools stay in `S.inv`/`S.bank` (save compatibility, `DQ.have`/`toolTier` unchanged) but `DQ.isTool` keeps them out of `DQ.packSlots`, the backpack and bank grids, their category tabs, and Bank all. The Tools tab lists them.

## Carpentry, Sailing and Beastmastery (Nov 2026)
- Files: `js/skills_new_data.js` (skills, items, recipes, voyages, unlock lines; loaded after economy.js), `js/skills_new_art.js` (planks, boats, islands, emblems, icons; after towns.js), `js/skills_new.js` (activity kinds, perks, pages; after minibosses.js).
- **Carpentry** (artisan; unlocks after chopping 60 logs at Woodcutting 10): saw 7 woods into planks (Lv 1–82), build 5 boats (Skiff 8, Cog 25, Sloop 45, Caravel 65, Galleon 85) from planks, string, cloth and bars. Uses the shared recipe page.
- **Sailing** (gathering; unlocks after visiting Saltmere with a skiff): 9 timed voyages (20–84s) to islands, each needing a boat tier; coins plus island loot (feathers, fish, seeds, gems, ores, cloth, chests). Activity kind `sail` on `DQ.KIND_EXT`. Voyage XP ≈ 85% of gathering per second (5 + 0.4 × level raw/s) since the haul is the reward.
- **Beastmastery** (gathering; unlocks with a companion and Hunting 5): train owned companions (kind `train`, 6s sessions) to raise their level; each Beastmastery level adds 0.5% to every companion bonus (`DQ.beastMult`, ×1.5 at 99) and from 25 farm animals produce 0.3%/level faster.
- Engine: `DQ.KIND_EXT[kind] = { skill, page, label, dur, check, done }` lets a skill add an activity kind that starts, stops, queues and catches up offline like the rest. Boats count as moored (DQ.isTool), not carried.
- Rail: 17 skills; `html.rail-tight` (page height under 1180) applies the compact 36px rows. icons48's legacy renderer no longer throws on new icon names.

## New skills: earlier unlocks from things you make, and a purpose each (Nov 2026)
- Unlocks: Carpentry ← own a Bronze handsaw (Smithing 2: 1 bronze bar + 2 logs); Sailing ← own a skiff (Carpentry 8) and have visited Saltmere; Beastmastery ← own 3 wooden traps (Crafting) and Combat 10. No companion needed.
- Carpentry: planks replace logs in every furniture upgrade (tiers 2–3) and in restoration projects from Saltmere on (logs already delivered convert on load); boats for Sailing. Planks are worth ~1.15× the log, so sawing is a modest value-add, not a coin machine.
- Sailing: voyages bring cloth (boats, furniture), gems, exotic seeds and other regions' ores early; "Sea legs": +0.3% Fishing speed per Sailing level.
- Beastmastery: "Lay traps · <region>" (kind `train`, id `lure:<town>`, 8s, a quarter of traps break) befriends that region's signature companion (`DQ.signatureOf`, `DQ.befriendChance`: 3% + 0.15%/level, more above the region's level, max 25%); otherwise brings that region's hides, feathers and trophies. Region trap lines open at Beastmastery town-index × 10. Training companions and the companion-bonus / farm-animal perks remain.
- Evidence: `node scripts/sim-new-skills.cjs` (voyage XP and value per hour vs Fishing; plank value added; boat material costs). See docs/economy-evidence.md.

## Towns and skill scenes to scale (Nov 2026)
- Towns are drawn at 640 × 360 (was 320 × 180) so homes, townsfolk and the 32 px restoration pieces agree in size; more streets, a square, framed windows, shutters, flower boxes and smoke. Your boats are moored at Saltmere's quay by tier, traps sit at the meadow's edge once Beastmastery lures there, crops grow by the Willowbrook cottage.
- The Village scene fills its panel (no longer snapped to 1×/2×) and pans sideways on phones, starting on the chosen site.
- Skill pages no longer stretch the whole town behind the hero: each kind has a close-up of its part of town (woodland edge, quarry, jetty, market street, kitchen, forge, workshop, timber yard, mage's study, harbour with your boat and the chosen island on the horizon, trap meadow) at the hero's 3× scale. The hero is 72 × 96 (was stretched to 102) with feet on the scene's ground line. `tests/ui-current.cjs` checks the sizes.

## Combat: skills and abilities on screen (Nov 2026)
- The player's rule: only "useful but nothing to do" information may be hidden behind a click; anything you act on stays visible.
- Each fighting-style button shows its skill's level and progress bar (Attack/Strength/Defence, or Ranged/Magic + Defence); Health and the combat level (which opens the level breakdown) sit beside them.
- Abilities sit in a full-height panel beside the fight (after the player found them squeezed into a scroll at the bottom): ability slots (filled slots show In use / Idle and remove on click), every ability you can slot as a button (Swap in when full, replacing the last slot via `UI.DO.abilswap`), ; food (eat buttons, auto-eat, eat-below) is the row under the style strip. Prepare, Equipment, Boss and Loot, and the Selected creature / Explore bar, moved to the top of the creatures column. On narrower or shorter desktops the fight uses 4× sprites so everything fits at 1280 × 720 with all abilities unlocked.

## Combat layout D (Nov 2026)
- The player compared four mockups (Battle HUD, Duel sheet, Hunt board, and a combination) on a design canvas and chose D: the Hunt board's order of play (1 Choose, 2 Ready, 3 Fight) with the Battle HUD's big stage and single action bar.
- Built in `js/combat_simple.js` by rearranging the page ui_core.js draws: the creatures column moves left with a step header and a boss button at its foot; the Ready line, the fight's own line and the `.combat-hud` (Train / Abilities / Food) are added around the arena; the old full panels stay hidden as pop-up sources.
- Creatures face the hero in fights (mirrored; the chicken is drawn facing left already).
- Laptop sizes: the stage gives way first (fight line moves into the Ready line, sprites 4×, then 3× on short windows); the action bar never scrolls. Checked at 1280 × 720, 1366 × 768, 1440 × 900, 1600 × 900 and 1920 × 1080 with every ability unlocked, both themes, and phones (stacked: Ready, fight, action bar, then Choose).

## Field guide entry across the width (Nov 2026)
- The entry (`UI.openGuide`, js/bestiary.js) was a long single-column scroll. It is now a wide card (`.fguide`, up to 1240px): the creature and its six-step research ladder on top, then three columns: Know it (sighted, weak points, vitals, and an adventure giver's study notes), What it carries (drop table), Its story and your goals (field notes, legend, understanding, slayer goals and stars). It fits without scrolling at 1440 x 790 and 1920 x 1080; phones stack it in one column.

## November 10 — Beast bonds and UI continuity (current)

This section supersedes historical notes above about top-right notifications and endlessly repeating owned-companion training. Full rules, significant choices, balance assumptions and tests: **docs/beastmastery.md**; measured support-DPS rows: **docs/beast-balance.json**.

Implemented ten-level passive bonds, deliberate food/coin training (45-minute per-beast cooldown), four distinctive species and evolved forms, three wall-clock expedition tiers, per-species pity tracks, quiet journal/return summaries and additive save migration. Existing companions and wooden-trap fieldwork remain. Fixed extended Sailing/lure task save validation/resume; old owned-training jobs stop safely on load. Failed new-system save transactions restore state for retry. No save version change.

Scholarship ranks now share cards; notices rise from the bottom; missing-item routes focus exact recipes and clear conflicting filters, including locked previews. Required town travel animates then returns to the selected activity without starting it. Farming is an interactive code-drawn estate with fields, pens and bounded supply pages. Quest rewards stay in the same-size selected card; ready quests/projects have clearer actionable states. Enemy defeats now have a brief exit/caption, skill activity markers no longer cover levels, and mining output sits outside character art.

Implementation entry points: `beastmastery_data.js`, `beastmastery_art.js`, `beastmastery.js`, `farm_estate.js`, `ux_update.js`, and existing `quest_claim.js` / `journey.js` hooks. Main baseline bc6d491; no push or publication. Rebuild with `python3 scripts/package-game.py`.

Validation uses isolated browser/test saves. Existing 104 regression checks, 8 art checks, desktop storage, new engine specs, real 12,000-attempt trap checks, 16 support-DPS simulations and desktop/phone browser interactions are documented in docs/beastmastery.md. No human playtest or native Steam Cloud validation is implied.

### Quest acceptance follow-up
Accepting a quest stays on Available while any quest remains acceptable. Accepting the last available quest switches to Active and selects that newly accepted quest. Implemented in `UI.DO.qstart`; accepting quests remains separate from claiming their rewards. Standalone rebuilt; regression and isolated browser acceptance checks cover the change.

### Compact combat and navigation follow-up
Desktop skill rail reduced from 208 to 180px without shrinking lettering or emblems; the combat Choose column is 260px rather than 320px. Train and Food receive most of the bottom HUD width. Abilities moves to the smaller right column, with compact equipped slots and the existing interactive Manage pop-up for selection. Empty slots open that manager. The future third slot is a short hint instead of another large tile. Earlier all-ability-buttons-inline guidance is superseded by this player request. Verified with laptop/ultrawide fit checks, both-theme combat measurements and ability selection in the standalone build.

## Story scenes, restoration feedback and farm separation (current follow-up)

Read **docs/story-and-restoration.md**. New `story_data.js` / `story.js`, loaded after the existing late UI wrappers, extend the existing quest/discovery/choice/journal systems with skippable, player-paced pixel storyboards. Major new events offer scenes without stopping work; offline progress and loading older saves never create a backlog. Home → Journal → Story so far replays scenes and holds undecided choices; automatic scenes can be turned off there. Opening priorities explicitly change the chosen Home goal, while discovery/ledger decisions retain original costs, rewards and downstream branches. Quest-choice claims preserve the same-card reveal.

Home guidance now includes Orrin's goblin quest and Mabel's supper. Every restoration has ruined/restored building art, a permanent-benefit explanation, a villager response and a highlighted completion summary/site. Farm workspaces split Crops & fields from Livestock & pasture. Fixed tile heights, bounded Prev/Next pages and maximum/future-capacity browser checks preserve the no-page-scroll rule.

Validation: story engine and browser suites plus existing engine, Beastmastery, art, storage, layout and journey suites. The accelerated road-focused opening completed four opening quests in its first half-hour without granted resources; this is automated evidence, not human feedback. Source and standalone updated locally; no publication or push.

### Farm destination styling and seed palette
Crops and Livestock now have distinct original pixel emblems, warm field versus green pasture styling, supporting labels and explicit selected states. Switching uses a scoped native view transition (with a continuous slide/fade fallback); reduced motion switches immediately. Keyboard focus follows the selected destination. The crop supply column is wider and all ten owned seed types appear together in a two-column grid on desktop and phone, with no seed pagination. Plot/pen and livestock-market pages remain bounded. Seeds & planting keeps its controls together without a redundant settings heading. No farming/economy/save rules changed.

### Settings organisation
`js/settings_layout.js` composes the existing settings controls into five destinations: Display, Audio, Gameplay, Saves & backups, Help & extras. Display groups theme/size/backdrop in Appearance beside lettering and notification/accessibility controls. Audio separates volume, music/effects and individual sound filters. Gameplay contains combat/offline options, hero name, story/guides and play-time information. Save transfer, automatic backups and destructive restart are distinct cards. Shortcuts, testing/art tools and About are under Help & extras. The redundant Settings self-tab is removed when it is the only utility tab; Balance remains available when tuning tools are enabled. Existing handlers/save keys remain; legacy category names map to the new groups. Desktop cards use available horizontal space; mobile stacks them. Verified all five groups in both themes at phone/tablet/laptop/desktop/ultrawide sizes, plus working display, audio, profile, story and non-destructive save-dialog interactions.

## Merge of the ChatGPT/Codex work (Nov 2026) and known test state
- The story scenes, restoration banners, Beastmastery rework (assigned beasts, trap expeditions), farm estate and quest-flow changes were recovered from a ChatGPT sandbox copy (it had never been pushed), compared against `main`, and merged onto the current game. Hand-merged fixes: `tests/story.cjs` loads the skill data, `js/engine.js` tolerates main quests that unlock no skill, the tab count badge is 13px (readability floor), and the browser tests no longer hard-code `/usr/bin/chromium`.
- `tests/story-ui.cjs` is stale beyond its restoration step: it expects the Hunter's-ledger claim to open a decision scene, which the current UI does not. It also fails the same way in the original ChatGPT copy. Rewrite it alongside the cutscene work below.
- Codex's seven recommendations were all built afterwards: see "Codex's recommendations" below.

## Codex's recommendations, built (Nov 2026)
Checked by `node tests/ux-roles.cjs` (browser) plus the existing suites.
1. **Cutscenes only for main quests.** Already true in the merged code: 13 of 90 story scenes are cinematic (the opening, main quests, boss victories); the other 77 appear in cards. The test asserts side scenes never open `.story-modal`.
2. **Town-project states** (`DQ.projectState`, `DQ.projectContribution`, `DQ.PROJECT_STATE` in journey.js): each site is `needs` (scaffold icon, "Needs supplies"), `can` (hammer, "Can contribute": you hold a material it needs; coins alone never count), `ready` (star, "Ready to finish"). Markers show the icon always and the label when selected or hovered; a legend counts each state; a line under the map says exactly what you can give. Old class `deliver-ready` is kept on ready sites.
3. **Restoration payoff in place** (`js/restoration_fx.js`, banner in story.js): supplies fly from the list to the site, the old town picture melts into the repaired one with a flash, then one villager line and "Active now: <benefit>" show in the banner. Skipped under reduced motion / calm.
4. **Food for an expedition** (`js/expedition.js`): the Ready line says "Food lasts ≈ N min" from a ten-minute dry run against the creature in front of you (endless pack, your real gear; the original save object is restored, never replaced). "Plan food" offers 30 min / 1 h / 2 h / overnight, says how many meals are needed, and starts one cooking batch (`startAct('recipe', id, {limit: n})`). A batch that finishes, or uses every ingredient, stops with a green "Batch complete" note (`stopAct(silent, why, done)`) instead of a warning. `act.limit` is saved and restored.
5. **Hunting and Exploration roles** (`js/hunt_roles.js`): Hunting leads with "Today's hunt" (one quarry and its habitat, with truthful reasons: quest target, drops you need, next field-guide entry, not yet met) plus a short list of other quarry; Combat keeps the area chooser. Exploration leads with the next worthwhile discovery (adventure chapter, unvisited town, creatures still to find) and a compact realm-progress table; the duplicate creature art is gone.
6. **Companions by usefulness** (`js/companion_choice.js`): each beast has a job (striker, provider, scholar, bossbreaker). The selected beast is previewed with what it gives at Bond 1 and Bond 10, a plain "best when" line and a comparison with the companion with you; target cards name the job; a one-line explanation separates expeditions from fieldwork. When an expedition brings a beast home, a pop-up compares it with your current companion and offers "Bring along". The preview moves below the lists on phones and loses its extra lines on short screens so every control stays on screen.
7. **Why you need it** (`js/item_uses.js`, `DQ.usesOf`): truthful uses read from the live save, in priority order: your pinned or nearest restoration here, an active quest hand-in, a research step, your next boat, the recipe it feeds, a seed's field. Shown in item tooltips and under the selected task on activity pages, each with a link to the place that uses it. Hunting reasons reuse it ("Drops feather: used in your restoration").


## Beastmastery ranch (Nov 2026)
Beastmastery opens on a ranch: each owned beast stands in its own pixel pen (`js/ranch_art.js`, `js/ranch.js`, "The ranch" block in css/style.css) with a bond badge, a hungry/napping/fully-bonded state and a "With you" flag. Pick a food on the shelf, select a pen, press Feed & train (`UI.DO.beastfeed`, engine `Q.trainBeast(id, food)`); the food flies to the pen and the bond rises. Tabs: Ranch, Trapper's shed (capture, previews, expeditions) and Fieldwork (wooden traps); the old page is reused for the last two. Pens are native-size images at whole-number 2x/3x; three columns by two rows on desktop, one pen per page on phones (the phone page scrolls by design). Engine rules in docs/beastmastery.md are unchanged. Tests: `tests/ranch.cjs`, `tests/beastmastery-ui.cjs`, `tests/ux-roles.cjs`.


## Fighting styles: Melee, Ranged, Magic (Nov 2026, from the player)
The player chooses how to fight by the weapon they hold, and that weapon family levels as they use it.
- **Melee replaced Attack and Strength.** `D.SKILL_ALIAS` maps the old ids to `melee` (`DQ.skId`), `D.SK.attack/strength` point at Melee, and `S.xp.attack/strength` are non-saved accessors onto `S.xp.melee` (`DQ.xpAliases`, re-attached whenever `DQ.S` is assigned). Gear requirements, abilities and old code that say `attack`/`strength` keep working; new code should say `melee`. Gear *bonuses* (atk, str) are unchanged.
- **Old saves:** `migrate` sets Melee to the higher of Attack and Strength and keeps the lower as `S.xpLegacy`, which still counts in `DQ.totalXp`, so Hero level never drops; combat level never drops either (`.65 × Melee`). Original values are kept in `S.xpOld`.
- **Pace:** a melee hit pays 2 XP per damage to Melee (was 4 to one of two skills), so combat level rises as fast as when both were trained evenly. Quest rewards written for Attack/Strength pay Melee half their sum (`D.foldMelee`).
- **Ranged and Magic are open from the start** (`unlock: 0`, no quest). Hunter Wynn's and Archivist Merrow's quests remain as stories that reward a bow/staff and ammunition. Shops sell bows and staffs from Willowbrook.
- **Catch-up:** `DQ.catchUp(sk)` triples XP for a fighting style below 70% of your best one; the Train button says "Learning 3× faster".
- Melee has two training buttons like the others: Offensive (Melee) and Defensive (Defence). A saved `accurate` focus reads as Offensive.
- Evidence: `node scripts/sim-bosses.cjs` is unchanged within noise; regression covers the save merge.


## Combat: Where to fight (Nov 2026)
`js/where.js` replaces `UI.areaPanel` (the earlier versions in hunting.js and minibosses.js are superseded). The 260px column shows, without scrolling: the quest target row (Track / Challenge), each area as a card with creature portraits and odds, the challenges as tiles, and the boss foot from combat_simple.js. Clicking a portrait sets `UI.taskChoice.combat` so the stage and the Ready check show that creature before you explore. Rarity words live in each portrait's tooltip and aria-label.


## One scale for fighting styles (Nov 2026)
Melee, Ranged and Magic now share combat-level weight, effective level (`D.STYLE_TUNE.level`) and XP per hit; bow, staff, spell, ability, robe and Alchemy levels were rescaled to the sword tiers. Evidence and numbers: docs/combat-balance.md. Gear bonus labels: Accuracy (`atk`) and Power (`str`).


## "Five more minutes" update (Dec 2026)
From the player's request to build all five retention recommendations, plus follow-ups in the same session.
- Challenges: ten new mini-bosses (two per region, Saltmere to Skyreach) in `js/minibosses.js`, tuned on the ladder (`node scripts/sim-bosses.cjs`): 99-100% at the requirement with region gear, 5-10 food per win.
- Combat levels 60-95: eight abilities, nineteen techniques, a fourth slot at Combat 70. The Hollow King's health went from 935 to 1065 (pre-scale) so he stays the final test: 66% at the requirement, 91% at +3.
- Field guide for everything, mastery counts (`S.mast`), album layout, thin progress bars. Up to 10% faster and 10% double on a task done 1,500 times.
- Eggs and the hatchery; Beastmastery tabs renamed (Ranch · beasts and eggs / Trapper · send for an egg / Wooden traps · search a region) with one "Where do eggs come from?" pop-up.
- Collection log under the new Guide top-menu entry.
- The task queue already existed behind the plan button; it is now a visible Queue button with duration choices, shows in the Now card, opens at Hero 3 and advances during offline catch-up when a task runs out of supplies.
- Chunky pixels restored (Scale2x off). First wording pass to RPG shorthand: abilities, techniques, unique gear, companion tricks, choice cards, ranch, eggs, collection. Quest text, tutorials and tooltips were not rewritten.
- Not done: no new economy simulation for mastery beyond the bound above; no human playtest.

- Wording pass 2 (Dec 2026): skill guides and first-time lessons, long tooltips, item and skill tooltips, hints, quest empty states, Home next-step lines and preparation advice now use RPG shorthand. Quest stories (blurbs, thanks, lore, legends) were deliberately left as written. `tests/regression.cjs` no longer requires lessons to be long.


## LittleBird "resume and finish the retention batch" prompt: what was already done and what it added (Dec 2026)
The prompt assumed an interrupted session. Checked item by item against `main`:
1. Two failing tests (top menu count, companion role): already fixed before the prompt; suite was green.
2. Beastmastery clean-up: eggs and renamed tabs existed. **Added**: one vocabulary (a *beast* is any of them; your *companion* is the one with you; "creature" is only used for things you fight), "Make companion" instead of "Bring along", and each beast's journey on its ranch sheet (egg and where it came from, hatched, bond, evolved; `UI.beastJourney`, the egg dates are kept in `S.pets.owned[id].egg`).
3. Field guide build-out: fish, trees, ores, pockets and recipes existed. **Added** crops and livestock (counted on harvest and collect; faster growth and produce), potions (a chance of a second bottle, since brewing has no timer), voyages and trap lines. Later entries on a page read "???" until reached.
4. Navigation: the album (index, picture tiles, ladder page) existed and stacks on phones. No change.
5. Quiet progress: the thin brass bar existed. **Added** the "nearly there" cue: within 10% of the next entry the same bar breathes (off with reduced motion).
6. Wording: two passes existed. No change beyond the new strings.
7. Top menu audit: done earlier; the decision is recorded below.
Final requirements: chunky pixels everywhere (Scale2x stays off; the only new art is the 16 px egg and ten 32 px challenge sprites, drawn in code); both themes checked; **added** save tests for eggs, field-guide entries and the queue to `tests/regression.cjs` (108 checks).

### Top menu decision
Menu: Home, Quests, World, Village, Hero, **Guide**, Shop. Left rail: Now card, Combat, every skill.
- Test applied: does the system need fast, frequent access, and does promoting it encourage continued play?
- **Guide promoted.** The field guide used to be a tab under Combat (two clicks, and invisible to someone who mostly fishes). It now covers every repeatable thing in the game and is the one place that answers "what am I close to?". That is exactly the hook that brings a player back, so it passes both halves of the test. Collection and Achievements moved in beside it for the same reason, which also took Hero from seven tabs to five.
- **Shop stays** (used constantly). **Hero stays** (inventory and equipment are the most opened pages after skills). **Village and World stay**: less frequent, but they are destinations rather than tabs of something else.
- **Not promoted**: Beastmastery (it is a skill, so it sits with skills in the rail), Settings (utility), Bank (a tab of Hero; reached from the backpack).
- Cost: seven entries instead of six. `tests/ui-audit.cjs` checks they fit at every tested width; the phone bottom bar holds eight.
- Menu counts still show available actions only, so Guide carries no badge.

### Current test list
`node tests/regression.cjs` (108), `tests/story.cjs`, `tests/beastmastery.cjs`, `tests/art-pixel.cjs`, `tests/desktop-storage.cjs`; with a preview server and `IDLEWICK_URL`: `ui-fit`, `ui-current`, `ui-audit`, `ux-roles`, `ui-journeys`, `ui-adventure`, `ui-effects`, `ui-farming`, `ux-update`, `beastmastery-ui`, `ranch`. `tests/story-ui.cjs` has a known, older failure at the `bl_ledger` step.


## World Life update (Dec 2026)
Built in the brief's order: museum, hidden recipes, towers, events, audio. All optional.

**What exists**
- Museum: five wings with small permanent bonuses (+1% XP, +2% coins, +2% lucky finds, +1% damage, +1% task speed). A welcome-back line lists entries added while away.
- Hidden recipes (6): Thornweave vest, Tidewalker greaves, Stargazer's hood; Hunter's feast (+20% damage to bosses, 10 min), Stonebread (-15% damage taken, 15 min), Lantern tea (+10% task speed, 20 min). New buff types `boss` and `guard` in the engine. New material: star shard (fallen-star event only).
- Towers (8): five floors each (the region's four toughest creatures, grown, then a unique boss with its own sprite). Prizes are keepsakes with an existing unique effect on a stronger or different slot.
- Events (10): raid, merchant, bard, fallen star, shrine, lost traveller, rare sighting (the Moonlit Hart), festival, bandits, villager's errand.
- Audio: per-village layers by restoration tier; festival layers; combat handover; the four volume sliders already existed.

**Decisions and deviations from the brief**
- *Reputation*: the game has no reputation system and AGENTS.md forbids a second currency, so the lost traveller and errand pay coins, a recipe or a rumour, and the festival gives +10% XP for 20 minutes instead of doubled reputation.
- *Beast attack*: choosing "Bar the doors" (or losing the fight) damages 2-3 buildings; leaving the card unanswered is harmless, as the brief's "ignored events resolve harmlessly" requires.
- *Capturing the rare beast* adds a museum curiosity and coins, not a companion: every companion arrives as an egg, and a ninth route would break that rule.
- *Audio is synthesised* (no sound files, matching the code-drawn art rule). "Market chatter" and "children" are stylised tones, not recordings. Whether they read as intended needs a human ear; automated tests only check the state machine.
- *Tower prizes reuse existing unique effects* (lifesteal, thorns, stun and so on) rather than adding eight new mechanics.
- *Art style*: the brief says "painted pixel-art"; the standing rule is chunky code-drawn pixels with Scale2x off, and that is what was used.

**Balance evidence** (`TOWERS=1 node scripts/sim-bosses.cjs`, plain sword hero, region gear, 15 food): tower bosses at the recommended level win 75-100%; ten levels under, 1-53% (Gloomfen and Skyreach are the soft ones at about 50%). Floors below the boss are 84-100% at the recommended level.

**Known gaps**
- A damaged building still shows its restored art and tick on the village scene; the damage shows only in the Repair card and the paused bonus.
- No economy simulation for event income (events are at most one per 30 minutes and pay roughly one to two creatures' worth of coins scaled by region).
- No human playtest of any of it.

**Test list**: as before, plus `tests/world-life.cjs`. `tests/regression.cjs` is now 116 checks (T1-T8 at the end).


## Chunky pixels everywhere (Dec 2026)
The player still saw the smoother style in places. Two causes: `js/hires.js` (an older hi-res pass: Scale2x, thin outlines, extra shading) was still applied to the 24px sprites, `pixel.js` icons and the hero gear figure; and several pictures were shown at uneven sizes (fight backdrop 2.19×, farm strip 3.39×, ranch banner 3.87×, map town picture 0.85×, quest-row faces 1.25×, story hero 3.63×, hatch pop-up 2.87×). The pass is now off and each is pinned to a whole-number scale, cropped rather than squeezed. Fighters were already exact (6×). The Village page's town scene still fits its panel at a fractional scale: a whole 2× would not fit on one screen at common window sizes and would hide clickable buildings at the edges.


## Return screen and skill column (Dec 2026)
- The welcome-back summary opened scrolled to its bottom: `DQ.modal` focused the first primary button in the body (the next-step button, low down) and the browser scrolled to it. It now focuses the pop-up's own action button without scrolling and resets the scroll.
- The skill column kept fixed row heights (31-48px), leaving 180-380px empty below it on most screens. `UI.fitDock` now shares the height between rows (34-64px), on render and resize. Phones are unchanged.
- New test: `tests/return-and-rail.cjs` (five window sizes).


## Nov 14, 2026: combat layout E and a UI-wide cleanup

- Combat was redone as layout E: one header bar (target and level, danger/food/gear chips, Guide/Details/Loot, one primary button), the fight on its area backdrop with nothing overlaid, and three even panels below (Fighting style, Food, Abilities). See AGENTS.md.
- A screenshot sweep of every page at 1440 × 900, 1280 × 720 and 390 × 844 in both themes led to these fixes: Home "Nearly there" panel; Skill levels card grid with next unlocks; Workers bed picture no longer overlaps its text; House fits 1280 × 720 (compact cottage, two-column rooms, one-row trophy wall, "10 wins" captions, free Parlour says "Build (free)"); Inventory fits 1280 × 720 (right column holds details, preparations and appearance; category tabs wrap; Max hit sits right of Combat stats); Herbalism first-goal button keeps its own width and its copy is shorter.


## Nov 2026: every skill made rewarding (skill perks and flourishes)

- Audit: Hunting, Exploration, Herbalism and Enchanting levels did nothing; Farming, Thieving, Woodcutting, Sailing, Carpentry and Beastmastery had 10 to 19 level stretches with nothing new; only Fishing, Woodcutting and Mining had surprises.
- `js/skill_perks.js`: signature perks for all 21 skills (no gap over five levels, capstone at 99), Scholarship's tier and slot gates added to its unlock list, flourishes for the eleven hands-on skills, "Next · Lv N" under each action and in skill headers, and a per-skill perk track pop-up.
- Evidence: `node scripts/sim-economy.cjs 24` (deterministic) 588,099 → 622,131 coins at 24 h (+6%), hero 65 → 66; `NO_PERKS=1` reproduces the old numbers. `node scripts/sim-bosses.cjs` matches `NO_PERKS=1` exactly after Health and Defence perks were kept to regen and XP (food-healing and damage-reduction perks had lifted the Hollow King from 66% to 79%).


## Nov 2026: the player's UI rules, checked everywhere (`tests/ui-rules.cjs`)

Rules collected from AGENTS.md and the player's messages, checked on 39 pages × early/mid saves × both themes × desktop/phone. Fixed what it found:
- Spoilers: the level-up note ("Next at level N: …"), Home's suggested goals, the "X is close" line, "How to get it" tooltips (unreached spots now "???", unmet creatures "Unknown creature"), the Collection's wild-egg sources and the combat Food chip all named hidden things. They now use `UI.unlockShort` (perks by name, everything else "Something new") and `DQ.monName`.
- Text under 13px on desktop: menu count badges (10–11px), tags, theme toggle, mastery and level numbers raised to 13px.
- The title logo's raw `7vw` now uses `--vw100`.
- No dropdowns, disclosures, stray fonts or fractional sprite scales were found.


## Nov 2026: finish layer (polish pass)

`js/finish.js` and the "Finish layer" CSS block add page entrances (staggered, merged with the existing `.view.enter`), a sliding brass ink under the top menu and page tabs (updated in the same frame as the render so a resized window never overflows), button lift/press and a sheen on primary buttons, card and tile lift with a selected-card glow, a light running along the active task's progress bar, a breathing rail row for the skill being trained, pop-up and tooltip entrances, coin roll-up on gains, themed scrollbars and selection, and a staged title screen with an inviting first button (no blue focus ring on load). All transform/opacity, off under Reduce effects and reduced-motion. Recorded before/after tours: the same scripted path on the previous and new builds.


## Nov 2026: the opening and the game's voice

- `js/intro.js`: the new-hero opening (bells, empty towns, Wren's letter with a P.S. about Orrin, "There was no prophecy, just a letter and a very long walk", the road of towns ending in a bell). Skip only after the first click; replay from the Journal; `tests/intro.cjs`.
- Voice pass, on the player's direction (names stay fantasy, the tone gets plainer and funnier): town descriptions, the flat one-line quests and the boss quests, the thank-you lines with an epic register, region arrival scenes, the late-game legends, achievements and project lines. Each tower keeper has its own legend (they shared one). The early writing already had the target voice and was kept.

- Opening fix (Nov 2026): town shots now show the whole town at the largest whole-number scale whose width fits (only empty sky is trimmed from the top; phones pan edge to edge at 1x), the caption sits beneath or over the faded foot, shots dip to black instead of overlapping, and the hero (drawn 24 x 32) and bell are sized explicitly at 2k+2. Fixed: cropped sides, a black strip from the old pan, a double-exposed town cross-fade and an invisible hero.

## 16 November 2026 — Make every system matter

Implemented against main baseline **5f9fcc1**. See **docs/connected-systems.md** (audit, migrations, decisions, balance assumptions, tests and limitations) and **docs/connected-balance.json** (seeded tower comparisons).

- `local_standing.js`: non-spendable local standing derived from completed restorations; building + standing requirements on local supplies in the existing Shop, direct project previews and concrete per-building stock. Normal progression shelves remain. Save migration `restorationVersion:1` / `legacyRestoration` preserves the old bonuses for projects already completed, once. New restorations give standing/supplies instead. Relic effects remain.
- `systems.js`, `worker_jobs.js`: fixed additional quantity targets on eligible gathering workers; bonuses count, completion stops assignment/wages, output stays in bank. Existing project/recipe links can calculate missing quantities. Unrestricted work remains. Save validation, unpaid pause and online/offline completion covered.
- `mastery.js`, `secret_recipes.js`, `guide_materials.js`: quarter-rate Guide credit from farmhand harvest/collection, with no personal XP; optional shrimp broth, charcoal and batch loaves discovered through existing mastery. Already-earned mastery learns eligible recipes on load. Existing Stonebread retained.
- Fortune overlap: tonic stays 30 minutes, one global purchase per six game hours; researched brewing gives three 60-minute bottles at the old batch cost. Owned stock/research/buffs preserved; failed-save brewing and purchases roll back.
- `preparation_roles.js`: eight tower preparation profiles using existing combat mechanics, boss-strength resistance rules and readable threats. Boar/owl/bear gain existing signature behaviours with lower direct support cadence; wolf remains a general-purpose striker. One assigned owned companion only. Tower progress/reward guards unchanged.
- Tests: new 15-check engine suite and 70-case connected browser matrix, plus existing 121 regression, eight art, desktop storage, UI rules/fit and World Life checks. Browser fixtures are isolated and seeded where stated. Economy gathering-only trajectory remains 622,131 coins / Hero 66 at 24h; it does not model new shopping/restoration choices. Alternative tower preparations measured and documented.

Standalone rebuilt locally. No commit, push, publication, human playtest or native/Steam Cloud readiness claim.

## 16 November — Discover ingredients before revealing recipes; Magic organisation

The player's follow-up requires acquisition knowledge across production screens. High Cooking alone no longer reveals an uncaught/unobtained fish recipe. The same rule now applies to Smithing, Crafting and Carpentry. Unknown recipe titles/art stay concealed; the selected recipe shows where the missing ingredient is discovered and its real source level, with a direct Find route. Common requirement tiles carry those unknown-source hints in brewing, enchanting, research and other cost interfaces; project materials and route hints also conceal unknown ingredients. Guide recipe entries agree with the production screen.

Knowledge reuses `seen.items`, owned inventory/bank/equipment, per-material/recipe mastery and worker output history. Receiving or consuming an item records knowledge, including existing stock from older saves. Spending the last item never hides its recipe again. Live item discovery refreshes relevant screens without a new interrupting popup. Cooking retains its existing rule allowing held raw fish to be cooked below the nominal Cooking level, with the existing burn chance. No costs, XP, gathering gates or save schema changed.

Magic/Alchemy now has a single progress header, clear Alchemy/Spellbook tabs, a coherent selected-action/choices layout, visible casting requirements and coin output, and staff/supply readiness with explicit controls on Spellbook. Future spells remain unnamed/locked. No task starts merely by selecting a spell or following a requirement route.

Verified 121 regression checks; focused cooking and cross-skill ingredient discovery tests; browser discovery/routing/reveal/save-history cases and 20 Magic tab/theme/viewport cases, including actual spell/staff controls and laptop action visibility. UI rules, art and desktop-save checks run alongside. Standalone rebuilt locally; no commit or push.

## Embedded-preview save diagnosis (16 Nov 2026)
Browser saves remain origin/storage-context scoped, with no ChatGPT account or project-file sync. A recreated embedded preview may expose different or ephemeral storage. Do not promise persistence across previews or claim the user's missing hero has been recovered. Settings → Saves & backups now explains this and that rolling browser backups share that same storage; downloaded files/copyable text are the transfer route. Desktop profile storage remains unchanged.

Save now now checks DQ.save() and reports failures instead of always claiming success. Save and import read back the stored payload before acknowledging success or committing imported live state. Cross-tab protection, v2 schema/key, and native bridge remain unchanged. Validation: 122 regression checks; tests/save-preview-ui.cjs verifies same-storage reload/reopen, isolated storage, error/success feedback and backup guidance. No personal save or actual ChatGPT embedded runtime was available to inspect; exact cause of this user's apparent progress loss remains unconfirmed.

## Tap feedback (16 Nov 2026)
Corrected pointer ripple coordinates through DQ.toPage: the fixed effects layer inherits root CSS zoom, while pointer clientX/clientY are viewport pixels. Rings use border-box and sparks are centered on the pointer. Shortened the two-ring burst, reduced sparks from eight to four, used a less abrupt easing curve and compositor hints on short-lived elements. Native Web Animations interpolate transforms/opacity continuously; no fixed animation frame cap was added. Existing Reduce effects and OS reduced-motion suppression remain. tests/tap-feedback.cjs covers 12 viewport/interface-scale combinations, within-frame interpolation, spark origins, reduced motion and cleanup. This verifies animation behavior, not real 120 Hz performance in the user's embedded preview.

## Main-quest conversations (16 Nov 2026)
Replaced storyboards/camera cuts with one mounted conversation layout: original pixel quest-giver portrait left, speaker and text right, click dialogue/Space/Enter or Continue advances with a 220ms fade. Speaker changes update the portrait in place; a brief subtle portrait movement suggests speaking. Reduced effects/OS reduced motion remove both animations. Explicit choices and skip/replay/save semantics remain, and work keeps running. Clicking a waiting decision focuses a response instead of dismissing it. Side quests, discoveries, arrivals and restorations keep their ordinary inline UI; only scenes attached to a main quest (including its boss resolution) are cinematic. A place to start is now explicitly attached to First Steps instead of hard-coded as an exception.

Validation: 122 regression and 10 story-engine checks; tests/story-conversation-ui.cjs exercises mounted scene continuity, click/keyboard progression, background work, persistent choices, side-quest exclusion, ten viewport/theme combinations and reduced motion. Screenshot inspected at 1440×900. No quest rewards, gates or pacing changed.
Broader ux-roles browser checks passed their main-quest/side-scene assertions but did not finish: its later companion fixture expects the old boar Provider label and also intermittently observes a queued egg modal instead of the hatch modal. That unrelated fixture remains unchanged; do not count the entire suite as passing.

## Story journal, character voices and skill ordering (16 Nov 2026)
Rebuilt Quests around the approved Story journal concept: Main story/Side stories sections inside Available/Active/Completed/Upcoming filters, real next-objective counts and progress bars, prominent giver dialogue, concise checklist/rewards and a fixed action footer. Continue selects the exact task without starting it and provides Back to the quest. Existing S.pins now keep one useful objective visible across navigation, preferring a relevant pin. Pin actions save immediately. Reward reveals stay in the same card and survive refreshes; side-story choices live inside the chapter. No quest rewards, unlock conditions or balance changed.

`js/folk_personality.js` gives all 27 original givers authored voice/outlook/major and minor interests, fallback lines and thanks. Quest-specific dialogue and reactions retain precedence. Known characters' People entries show outlook/interests beside earned notes. UI.skillDockOrder keeps fresh-hero skills first (Fishing, Woodcutting, Magic), then stable groups by unlock complexity; unlocking never moves rows. See docs/quest-journal.md.

Tower alternatives are design previews only: Cutaway, Expedition map and Encounter theatre. The current game tower is unchanged. See docs/tower-view-concepts.md. Validation: 122 regression, 10 story and 8 art checks, full UI fit, Quests/People UI rules, and focused journal journeys across ten viewport/theme combinations. Interactive tower concepts passed eighteen layout/selection cases. Synthetic fixtures do not establish human engagement.
Final journal validation also covers a ready side-story choice: buttons stay in the action footer, no cinematic opens, the original selected response appears in the same-card reveal, and the branch is recorded once. Quest-specific thanks and selected-choice responses take precedence over personality fallbacks. Character checks verify coverage and distinct lines for all 27 givers and starter-first rail ordering. Packaged Play Idlewick.html passes the full focused journey.

## Approved tower cutaway and idle creatures (16 Nov 2026)
The player chose the Cutaway concept. `js/tower_cutaway.js` renders the existing tower as five stacked rooms beside one selected encounter, preparation, summit reward and fixed action footer. It reuses D.TOWERS, towerFloor, existing combat and the original sprites. Rooms select without fighting; future occupants stay silhouettes with generic accessible names. Enter starts the existing floor fight; Return to fight navigates without restarting it. Returning after clearing the selected frontier advances the preview to the next floor. Cleared floors remain replayable, saved floors and one-time prizes are unchanged. Regional material tints and concise local flavour distinguish the eight sites.

Known room creatures and the featured opponent gently rise and settle as intact sprites. Their periods/phases differ; there is no stretching, separate body animation, fixed FPS loop or gameplay timing change. CSS interpolates motion at native refresh rate. Reduce effects and OS reduced motion stop it. Future silhouettes remain still. Desktop keeps five rooms and the action footer visible; reference detail scrolls inside the encounter panel if needed. Phone stacks them.

Validation: tests/tower-cutaway-ui.cjs covers eight towers × three progress states, ten viewport/theme combinations, concealed future floors, selection, moving intact sprites, reduced motion and entering combat; source and standalone runs. 122 regression, 15 connected-systems and 8 art checks also passed. The world-life fixture now selects then enters a floor, and discovers Stonebread ingredients before expecting a learned recipe to reveal (the existing discovery rule). Tower UI rules also exposed undersized item-comparison tooltip text, raised to the existing 13px floor. No balance rules or save schema changed. Real 120 Hz embedded-browser performance is not measured by these interpolation checks.

## Optional mastery guilds (16 Nov 2026)
The player approved the proposal for skill-specific level-99 guilds. Implemented all 21 skills in js/mastery_guilds.js with existing named characters as guildmasters, authored invitations, an initiation and a separate specialist pursuit per skill. Hero → Mastery now opens the guild catalogue; Ranks & titles preserves the old post-99 system. Membership and specialist seals are derived from completed ordinary quests; specialist titles use S.title `guild:<skill>`. Rewards are personal titles/seals, without new currencies or passive power. See docs/mastery-guilds.md for exact scope and limits.

Guild chapters are optional side stories, hidden from early Upcoming lists but browseable through the guild catalogue. Level 99 plus the master's region gates admission. Accept/track/return/rewards use the quest journal. Existing visits, owned enchanted equipment/boats and fully trained companions can qualify; other evidence counts successful work after acceptance. Claims save immediately and roll back deliveries on failure. Save schema/key and existing ranks/coin bonuses stay intact. Repeatable field notes avoid a research completion dead-end; full-bond companions qualify without impossible retraining. Added actual-completion study/brew/healing and combat-style evidence using existing actions.

Validation: 8 dedicated engine/data checks and a synthetic full browser journey through invitation, task route, member, specialist/title and original ranks; ten viewport/theme cases and all 21 existing guildmasters. Regression/art and targeted Mastery/Quests UI rules also pass. Endgame fixture grants do not establish real progression pacing or enjoyment. No bespoke guild minigames, town buildings or new power bonuses are claimed.

## Icon-first navigation and hunting stages (16 Nov 2026)
User's standing UI direction: fewer routing words/arrows; recognisable activity/item imagery for navigation shortcuts. UI.activityIcon/objectiveIcon standardise destination art. Shared material routes (including undiscovered ingredients) are icon-only with accessible names and explanatory tooltips; source/level hints remain visible on requirement tiles. The quest Continue objective and field-guide shortcuts use icons. Unlock requirement rows keep the actual requirement/count and replace trailing Go/Get captions with a destination icon. Return routes keep the specific origin label with its icon. Accept, start work, claim and other consequential action labels stay explicit. Route mechanics are unchanged. Tests: regression, quest-journal journey and targeted UI rules pass.

js/hunting_stages.js adds visual-only stage strips. Hunting shows Habitat/Quarry/Hunt with the actual current opponent's health progress, and its lead follows an active quarry. Wooden-trap fieldwork shows Set/Wait/Check as visual thirds of its existing cycle, with no new timers, rolls, XP or resource rules. Real egg expeditions show Trap set, Waiting and Return from sent/due; successful eggs or missed tracks are shown only from the real resolved event. Idle or unrelated activities never animate hunting progress. Native CSS interpolation smooths the fill; reduced motion removes it. tests/hunting-stages.cjs covers state isolation/deadlines/results/read-only behavior, and tests/visual-navigation-ui.cjs covers actual views, material route labels and phone/desktop widths.

User subsequently requested design suggestions for giving every skill a distinct minigame-like loop and stronger late-game progression. Recommendations remain design proposals, not authorisation to bulk-change trap odds, durations, resource consumption or every skill's rules. Current trap tiers are Basic (40 coins, 1h, 40% common/10% rare), Iron (120 coins, 2h, 60%/30%), Rune (boss drop, 4h, 80%/60%), plus separate wooden-trap fieldwork. Higher per-attempt odds are not necessarily better yields per hour. Review this before adding crafted tiers.
All-skill design follow-up is recorded in docs/skill-minigames-proposal.md: distinct planning/idle-execution/result loops for all 21 skills, cross-skill links, current trap-tier weaknesses and a proposed first Hunting/Crafting/Beastmastery slice. These are proposals; only the icon-first navigation and truthful visual hunting stages were implemented in this pass. New trap recipes/odds, mechanical stages and specialist powers have not been applied.

## Integration gate and unfinished candidates (16 November 2026)
The owner explicitly requires cross-system validation before a substantial skill/system rebuild becomes playable. This is now a standing AGENTS.md rule. New working files hunting_loop_data.js, hunting_loop.js and shop_upgrades.js are candidates behind __IDLEWICK_INTEGRATION_TEST__ / DQ.integrationCandidate, disabled in ordinary play. Do not describe these candidates as delivered or validated. The default, gated-off engine regression run passes all 122 checks; that does not validate candidate rules.

Before enabling: verify legacy active fieldwork/save migration, Hunting versus Beastmastery XP/gates and quests, unchanged companion expeditions/training, crafted-trap inputs/discovery, online/offline parity, inventory/bank consumption, atomic shop persistence, permanent tool ownership/duplicate prevention, reachable first-pickaxe bootstrap, and actual browser layouts/routes/readiness cues. Review region access checks against the existing townUnlocked rule and replace Rune-specific expedition cost labels when accepting a new item-funded tier. Material affordability in the ordinary equipment shop must account for selected quantity. Skill-specific backgrounds are requested but not yet implemented. Keep any unverified candidate out of the generated playable build.

## Skill-loop candidate enabled after integration checks (16 November 2026)
The earlier disabled-candidate status is superseded. Hunting/Crafting/Beastmastery, the requested material-backed shop and skill-specific scenery are enabled, and Play Idlewick.html is rebuilt. See docs/hunting-crafting-loop.md for exact recipes, boundaries, migration behaviour, tests and evidence. Original queued/saved fieldwork and Guide IDs remain; the shared extension dispatcher now accepts skillFor/pageFor so fieldwork no longer accidentally requires Beastmastery. Its start/stop/progress/Guide routes consistently use Hunting. The old Beastmastery field tab is removed; Quarry remains available for existing combat objectives.

Larger decisions to review in play: fieldwork now earns Hunting XP; assigned companion victories supply Beastmastery skill XP, avoiding a progression dead end. Kindred ranks give XP instead of a dormant repeating-training flourish. Stronger field traps reduce breakage; precision adds optional material focus. Padded live traps and crafted Rune traps link production skills to existing expeditions. Existing Basic/Iron/Rune expeditions, hatching, bonds, pity, curated creatures and deliberate training are retained. The new shop charges materials for tool commissions/ordinary metal equipment, hides acquired tools permanently and keeps the first pickaxe free of an ore prerequisite. Each noncombat skill page has its own original code-drawn background.

Owner clarified that current testers can restart: design and test fresh progression first, preserve saves where practical, and never wipe automatically. The no-grant simulation reaches the loop through real gathering, cooking, combat, the first boss and Hettie's quest. Its deliberately generous fixed preparation takes about 67.7 simulated minutes and is not a target opening pace. Controlled durability/companion evidence is in docs/hunting-loop-evidence.json; fixture grants are labelled. Human value/pacing assessments remain open.

Before enablement: 16 new integration checks, 25 existing Beastmastery checks with candidate rules, 122 regression, 8 art, 15 connected systems, desktop storage, the existing full UI-fit suite, targeted UI rules and 40 new browser layout cases passed. Final generated-build checks are appended below. No commit, push or native platform release is claimed by this handoff.

Final verification: rebuilt standalone passed the new 40-case browser matrix with no JavaScript errors; an additional fullest known-material-focus / padded-expedition fixture passed at 1280×720. The existing ui-current.cjs suite passed across its full navigation/theme/viewport matrix after correcting its obsolete quest-header selector to the approved journal's actual heading. Final regression (122), integration (16), artwork (8), connected-systems (15) and desktop storage checks pass. The existing 24-hour economy simulator output matches its pre-change run; it models supply, not tool purchases. No personal saves were used. Changes are local and have not been committed/pushed.

## Writing, stable controls and actionable navigation — 17 November 2026

Reviewed all 90 ordinary quest requests, 42 guild requests, 27 character voices and 22 first-use tutorials, plus the related story, journey, People and lore copy. Ordinary requests now read as direct speech with an understandable problem and actual task; repeated journal copy is omitted. Orrin explains cutting raid tally marks into his gatepost before the laundry joke. Frostmaw is consistently an ice troll; payment, food quantities and restoration descriptions agree with mechanics. Narrator lines carry mechanical consequences instead of making villagers read UI instructions. Branch-specific choices, IDs, gates, quantities and rewards remain intact. All quest acceptance actions explicitly say **Accept quest**, including contextual offers and recommendations. See docs/writing-review.md.

The owner's newer requirement supersedes ingredient-input anonymity: required materials name Potato, Raw sardine, etc., with source skill/level secondary and direct routes. Undiscovered recipe outputs remain ??? and discovery-gated; acquisition history survives consumption. Shared tiles, routes, project materials and lock reasons use this rule. No activity starts automatically when following a requirement.

Same-page combat refreshes no longer replay the finish-layer entrance, and boss specials no longer shake the whole arena. Fighter animation/hit feedback remains. Tools, Equipment and Supplies now share an external shop header, matching panel bounds and a fixed purchase/upgrade footer. Long descriptions stay inside the detail body. Narrowed the old preview-art CSS selector so it cannot enlarge ingredient icons beyond their tiles; readiness-cue art also stays inside its assigned slot.

Counts and destinations now derive from the same DQ.actionTargets list. Numbered hub/skill/subpage clicks select a ready quest (before new offers), exact project/research topic, farm crop/pen page or affordable tool commission/family. They do not claim, spend or start work. Home/Activity history produces no menu count, eliminating the permanent Home “1” from a past quest notification.

The tool reachability audit corrected first reinforced commissions from 25 iron to **25 copper**, which is available before the later-town iron source. The starter pickaxe remains coin-only. Higher costs are unchanged; atomic transactions, bank supplies, ownership and duplicate prevention remain covered. Regenerated docs/hunting-loop-evidence.json using the existing no-grant route.

The owner's request to consider doubling tools/weapons is documented and modelled in docs/upgrade-expansion-proposal.md and upgrade-expansion-model.json, reproducible with scripts/model-upgrade-expansion.cjs. Proposal: ten optional tool commissions at the same 45% cap; fourteen ordinary bands per weapon family by inserting levels 3/5/15/25/35/45/55, with distinct fantasy names and unchanged endgame stats. **These extra items are not enabled in the playable catalogue.** Controlled tool cycles and 24 seeded sword forecasts per boss are preliminary evidence, not a natural journey or all-style validation. Frostmaw's small sample includes one extra loss despite shorter wins; materials, economy, art and wider combat integration remain prerequisites to enablement.

Validation this pass: 122 regression, 10 story, 16 Hunting/shop integration, 15 connected-system and 8 artwork checks; ingredient/cooking discovery and desktop storage checks pass. Existing UI fit and targeted UI rules pass. Journal journeys pass ten layout/theme cases; conversation continuity/choices/background work/reduced motion pass ten cases. Hunting/shop journeys pass forty cases. Discovery/Magic UI passes twenty cases. New writing-navigation-stability-ui.cjs verifies spoken copy, duplicate removal, named inputs, zero history Home count, quest/project/farm/tool destinations, six shop geometry combinations and unchanged combat container bounds across special/hit/render events. Final packaged verification follows below. These are isolated synthetic saves; human comprehension/enjoyment and real 120 Hz/native platform behavior are not established. No commit or push was requested or performed.

Final delivery check: rebuilt Play Idlewick.html passes the writing/navigation/stability journey, including **Accept quest**, named requirement tiles with contained artwork, exact tool-badge selection and all six stationary shop geometry combinations. Packaged quest-journal journeys pass all ten layouts/themes; packaged Shop/Quests UI rules pass. Screenshots of the final shop and conversation were inspected. Source git diff --check and syntax checks pass. Work remains local and uncommitted.

### Upgrade proposal correction — 17 November 2026

Owner clarified the expansion: every upgraded tool must be smithable from mined-metal ancestry; ordinary bought/smithed/crafted weapons use material-based names and metal inputs. Unique fantasy names belong to earned rare weapons from bosses, towers, loot and comparable rewards. Updated docs/upgrade-expansion-proposal.md, scripts/model-upgrade-expansion.cjs and its generated JSON accordingly. Removed the ordinary fantasy-name tables, added ten material/grade tool steps and seven material/grade weapon bridges, and recorded required bar IDs. Each proposed bar is checked against an existing ore-only Smithing recipe. Wood/string/leather remain supporting assembly inputs; complete Smithing routes are required for rods/gloves too. Commission ore equivalents must derive from bar recipes rather than double-charging bars plus ore. Starter mining remains reachable before ore collection.

This turn refines the previously unshipped expansion proposal; **no live item, recipe, price, drop or save changes were made**. Current live tool production is still split between Smithing (axes/pickaxes/hoes) and Crafting (rods/gloves), so the new all-family Smithing coverage must be implemented and integrated before the expansion ships. Existing rare rewards remain unchanged. Re-running the controlled model validates the proposed material references and retains the same combat/tool statistics; it does not establish finished recipe quantities, economy or all-style balance.

## Base-game ore-backed equipment and starter kits — 17 November 2026

Owner explicitly authorised implementation and clarified this is the base game. Earlier model-only status is superseded; see docs/base-game-equipment.md for actual costs, quantities, levels and trade-offs. Added 25 intermediate gathering tools (50 total) and 35 intermediate weapons (14 bands per family), using existing ores/bars and unchanged strongest speed/stats. D.TOOL_ORDER replaces integer-only selection in state, shop, migration, inventory and activity helpers; half-step ownership persists without removing older bonuses. All tools have Smithing recipes, including rods/gloves; their Crafting alternatives also consume forged supplies. Ordinary bows/staves gain metal fittings. Shop commissions use matching production supplies plus gold rather than flat ore costs; the existing starter pickaxe exception remains. Tool resale values were reduced where necessary to stay below recipe-input value. Distinct code-drawn fitting/grip details pass artwork uniqueness checks. Named weapon rewards retain their earned sources; removed their rare-shop trophy repurchase routes, preserving existing owned items and boss/tower/loot awards.

Creation offers sword/bow/staff as a reversible preference, with full-character preview and explicit supplies. Bow starts with 300 equipped bronze arrows; staff starts with Spark and 300 runes. All kits keep original coins/food. No new classes, skill gates or loaded-save grants. Other starting weapons/supplies remain stocked in Willowbrook. Kit selection itself does not grant extra items; commit/save uses the chosen draft once.

Validation: tests/base-gear.cjs covers supplied fights, actual ammo/rune consumption, save round-trips, all 50 ore-rooted Smithing recipes, 35 bridge recipes/shop sources, real production, resale bounds and half-step permanent ownership. Existing 122 regression, 16 Hunting/shop integration, 15 connected, 8 artwork, desktop storage and ingredient/cooking discovery checks pass. Existing UI-fit passes; Hunting/shop UI passes 40 layout cases; targeted shop/Smithing/Crafting/Inventory UI rules pass. Controlled three-style/eight-boss old/new forecasts are in docs/base-gear-balance.json; top-tier outcomes remain unchanged, small samples sometimes regress, and these are not natural progression or enjoyment evidence. Reran the existing no-grant Hunting reachability route. Final packaged checks follow below. No reset, commit or push performed.

Packaged verification: all nine starter selection/persistence journeys pass (three kits × laptop/desktop/phone); screenshot inspected after entrance motion settles. The packaged writing/navigation suite passes all six shop geometry combinations, exact ready-upgrade routes, Accept quest labels, named material tiles and combat stability. The latest build also displays the 20.5% intermediate tool bonus accurately rather than rounding it to 21%. Final regression, artwork and both equipment/Hunting integration checks pass. Human pacing/consumable resupply and long-term usefulness of the intermediate choices remain playtest questions.

## Cross-skill connections review — 17 November 2026

Reviewed all 21 current skills and surrounding restoration/housing/worker/Guide/collection/tower/guild systems after the base-game equipment changes. Recommendations are in docs/skill-connections-review.md; **no gameplay changes in this review**. Strongest gaps: no recipe currently outputs runes or animal feed; Exploration is largely first-visit/first-victory tracking; Herbalism depends on five Scholarship-unlocked potions and flat brewing XP; selected secondary woods have very few production uses; frequent gear replacement makes enchantment investment worth reviewing. Existing charcoal, batch bread, healing broth, companion food/training, crafted traps, finite workers and building supplies were recognised as implemented, not proposed anew. Suggested priority: self-made supplies, one practical Exploration chart loop, Herbalism's own recipe progression, permanent farm/workshop improvements, and safe enchantment refitting. Direct consumer counts are not proof of uselessness and omit quest/dynamic/transitive uses; no human-testing results or new balance claims.

## Connected skills and usability — 17 November 2026

Implemented the approved skill-connections review through crosslinks_data.js/crosslinks.js. docs/cross-skill-update.md records actual levels, effects, costs and walkthrough examples. Added rune/feed production, Herbalism preparations, eight once-only regional surveys and repeatable observations, four kept Carpentry facilities, chart-led voyages, optional collection/tower/merchant/guild alternatives and titles, restored-building commissions and a Wren side quest. Safe enchantment refits remove source ranks; per-plot plans preserve seed/worker rules. Missing-input worker plans support 1/5/10 batches. Original recipes, roads, research, quests, workers, boats and saves remain authoritative; core paths have ordinary alternatives.

Combat Equipment now opens owned pack/bank gear and eight slots, including arrows and live supply estimates, preserving the running encounter. usability.js adds special-first gear comparisons, UI purchase/claim double-click protection and keyboard/touch-hold tooltips. Existing independent task/ambience controls are clarified. Internal scrolling lists retain position; existing filters/search/tabs remain in session. Same-page focusTask routes redraw before focusing. Restored town sites show inhabitants and work props. Equipment/ability/bank/train actions have clearer labels. Destructive reset confirmation remains.

Controlled evidence/assumptions: scripts/sim-crosslinks.cjs and docs/crosslinks-balance.json. These are granted fixtures, not human pacing/enjoyment results. No reset, commit, push, publication or platform-readiness claim.

Verification: packaged cross-skill journeys pass all 32 theme/layout cases; 19 integration checks, 122 regression checks, 8 artwork checks and desktop storage pass. Targeted UI rules pass on eleven changed pages in early/mid saves, both themes and desktop/phone. One-screen fit and World Life journeys pass. New long-session browser checks pass exact same-page routing, live/back-navigation scroll and filter retention, specific actions, special-first gear trade-offs, keyboard/touch tips, independent task audio, erase confirmation and double-purchase protection. Scroll preservation extends keep_scroll.js (rather than a second subsystem) and now runs after layout renderers. Human pacing and multi-hour engagement remain unverified.

### Combat loadout and consistent shop cues — 17 November 2026

Owner requested using the spare lower-left combat area for equipped gear. combat_equipment.js now adds an always-visible eight-slot panel beneath the areas/challenges/boss; clicking a slot opens only owned pack/bank alternatives for that slot, with the existing comparisons, requirements and atomic equip logic. Empty slots remain selectable, ammo counts update live, and swaps preserve the encounter. Full Equipment entry still supports browsing all slots. Short laptops keep 32px gear icons with accessible slot labels/tooltips; compact challenge rows keep the busiest left column within the window, without scrolling. Phones retain labelled slot tiles.

Shop category/family readiness now reuses the existing gold notice-badge for actual affordable upgrade counts. Removed green outlined checkmark circles and partial-material-only markers from navigation; missing costs remain in item requirements. Keyboard focus draws inside the selected boundary, avoiding the nested outer ring while preserving visible focus. No progression, price or save-schema changes. Rebuild with scripts/package-game.py; tests/combat-loadout-ui.cjs covers exact slot routing/pack-bank swaps/empty slots/ammo and theme/layout/shop cues, alongside ui-fit.cjs.

Follow-up verification: the packaged combat-loadout journey passes all eight light/dark layout combinations, exact-slot pack/bank equipping, preserved ongoing combat, empty-slot messaging and live arrow counts. Full ui-fit passes, including the busiest Mossbarrow column at 1280×720. All 19 cross-skill integration checks pass. Shop screenshots were inspected to verify the shared count treatment and contained focus styling.

### Shared Hero equipment layout in combat — 17 November 2026

Replaced the combat slot grid with Hero's shared paper-doll component (UI.equipmentDoll): the worn character in the middle, Head/Body/Weapon/Legs left and Amulet/Shield/Ring/Ammo right. Both pages now use the same structure and hero renderer. Combat slots retain their exact-slot gear chooser; filled slots use item-coloured equipment styling and empty slots use the same dashed treatment as Hero. Live gear/ammo/appearance changes refresh the figure. Combat keeps its existing training/stat HUD rather than duplicating the full Hero stats panel. Short desktop sizing preserves 32px slot art and keyboard/touch details, with tighter destination-card spacing to keep the full layout visible. No combat, inventory or save rules changed.

Shared-layout verification: combat-loadout-ui passes all eight layout/theme cases, actual armour/weapon swaps, source-bank conservation and live ammo. The central sprite changes on equipping a helm and matches Hero's equipped sprite exactly. Full ui-fit and targeted Combat/Hero UI rules pass. The settled combat screenshot was inspected; standalone rebuilt. Changes remain local and uncommitted.

## Quest accessibility and whole-game UI concepts — 18 November 2026

Corrected rune recipe recommendations: suffix matching incorrectly picked smelt_bar_rune (Smithing 85) for a Crafting rune objective. meta.js now shares event/primary-output matching with quest_journal.js routes, including wildcard Smithing versus Smelting. All 133 quest entries were audited for real typed targets/finite levels/acyclic prerequisite chains. New offers wait for required direct activity levels and learned skills; quests teaching a skill avoid self-locking, and accepted progress persists. Wren's optional chart request waits for Crafting 8 and Exploration. The granary clean-up meal now uses early-access shrimp rather than later farming crops, with matching speech/counts. See docs/quest-accessibility.md, generated quest-accessibility-audit.json and tests/quest-progression.cjs. No XP/inventory/save reset or visual overhaul.

Owner requested concepts for the entire game, each driven by ease of understanding. Interactive directions in /workspace/idlewick-concepts/whole-game-directions.html cover eight main screen types, original character/village art, different navigation/content priorities, palettes, heading/reading fonts and adjustable type/appearance controls. These remain prototypes; the live game's visual layout is unchanged pending direction. No commit/push/publication.

Quest follow-up verification: all 7 new progression checks, 122 regression checks and 19 cross-skill integration checks pass; packaged quest-journal journeys pass 10 layout/theme cases and cross-skill journeys pass 32. Already-earned once-only surveys now satisfy Wren's request even if it is accepted later and the chart has been sold/reloaded, preventing a permanent block. UI concept navigation/task controls/quest preview passed 96 screen/viewport cases, including desktop and 320px phones. The live game's visual design remains unchanged; prototype palettes/fonts/layouts are for owner review, not a shipped overhaul. Human pacing and enjoyment are unverified.

## Hearthside Journal implemented — 18 November 2026

Owner selected Hearthside Journal and asked to carry on. The concepts-only status is superseded. `css/hearthside.css` applies the common parchment/brass/forest palette, quieter opaque panels, clearer selection/action states, bundled Cinzel/Alegreya Sans lettering, entrance contrast and consistent treatment across activities, combat, quests, equipment, village, shops, research and settings. Fresh games default to light/Hearthside; explicit saved theme/font choices remain. `js/hearthside.js` reuses live journey/quest data for Home's chapter and single next action, with giver portrait, actual objective progress and a contained village preview. It preserves the chosen goal, running work, source routes and existing simulations. Quest Continue labels name their objective; secondary source links remain icons. Routine acknowledgements move to the bottom. Dock remeasurement handles running-card/font changes without scrolling at laptop heights.

See docs/hearthside-journal.md. New Hearthside journey, full UI rules, quest journal, loadout, stable shop/navigation, 122 regression, 8 artwork, 7 quest progression and desktop-storage checks pass; final delivery checks follow. Existing saved progress is preserved. The branch includes the earlier authorised progression/equipment/quest improvements which were still local, as well as this UI implementation. No human enjoyment or Steam/native-platform claim.

Final delivery verification (18 November 2026): rebuilt Play Idlewick.html passes the full one-screen fit suite, current UI suite and Hearthside journey suite. Browser fixtures cover phone/laptop/ultrawide and both themes; explicit theme/font preferences and ongoing activities persist. The fresh Home screenshot was inspected for chapter/action hierarchy and village-card containment. Human enjoyment and native Steam platform behavior remain unverified.

### Shop, sources and Crafting follow-up — 18 November 2026
Implemented the owner's six shop/navigation recommendations. See docs/hearthside-journal.md for exact costs, effects and local flax unlock path. js/shop_skill_updates.js extends the existing shop/actions/save schema; all skills have a reachable upgrade shelf, existing five tool ladders remain. Buy back requires recorded acquisition and current absence, never merely a defeated boss; ordinary rare wares/caches cannot grant exclusive equipment. Save validation covers 0–3 workshop ranks. Creature clicks open field entries, seed link selects the seed shelf, and hover borders remain inside choice-list bounds. Fresh/old save, atomic failure, exact-route, eight responsive/theme cases and integration tests are recorded in tests/shop-skill-updates*.cjs. Existing earned unlocks and gear remain. Optional XP equipment changes were bounded analytically; no human pacing or enjoyment claim.

Follow-up verification: all 122 regression checks, 8 art checks, 7 quest progression checks, 16 hunting/shop integration checks, 19 cross-skill checks and desktop storage tests pass. Full one-screen fit and current UI suites pass; new shop browser checks cover eight theme/viewport combinations, actual upgrades, missing-loot recovery, field-entry clicks, seed filtering and visible mining shortcut. Economy baseline simulation ran for 24 modeled hours; optional workshop ranks are not automatically purchased in that baseline, so it is not evidence of their human pacing. Inspected the skill shop screenshot and contained its actions at laptop heights. UI effect tests now observe actual effect insertion instead of sampling a narrow transient frame.

Owner's in-flight refinements are included: shared requirement tiles now use one named, single-line held/required count with source icons and no duplicate shortage prose. Workshop counters/copy are shorter. New js/item_navigation.js replaces text-heavy item source/use lists with icon routes derived from live definitions. Every item artwork can expose its tooltip, preserving concealed output art; interactive cards remain still while the pointer enters them, keyboard ArrowDown enters their icon controls, Escape dismisses and touch-hold remains supported. No tooltip shortcut starts, buys, sells or claims anything. See tests/item-navigation-ui.cjs.

Final refinements verified: compact requirements and interactive source/use tooltips pass desktop/phone and both-theme browser checks; actual pointer/keyboard recipe routing preserves stopped work and selects locked recipes. Full ui-fit, ui-current and long-session-ui pass after the shared tooltip changes. The 122 engine checks, artwork coverage, storage and skill/shop integrations remain passing. Source routes retain explicit travel/return context; ordinary sell icons only select the shop's Sell shelf. Skill-unlock labels avoid repeating target quantities. No auto-buy/sell/task-start behavior was added.

### Shop hierarchy and passive requirements — 18 November 2026
Owner rejected right-aligned boxed requirements and interactive hover cards. Requirements now align left as plain named held/required counts; skill-unlock counters also have no pill borders. Actual source buttons remain visibly actionable. Skill upgrades / Equipment / Supplies lead the shop header as primary categories; Buy/Rare wares/Sell/Local supplies/Buy back are secondary, and skill navigation appears only within Skill upgrades. Item tooltips retain source/use icons as passive images, with tooltip semantics and no click/focus controls. On-page exact source routes remain. Newer owner direction supersedes interactive hover navigation. Regression (122), passive-tooltip/source-route checks and eight-layout shop journeys pass; screenshot captures use a test hero.

### Wider catalogues and structured rank prerequisites — 18 November 2026
Continued from the owner's card-width feedback. Shop catalogues now fill empty columns with wider cards (including tools/equipment); skill-rank cards are selectable and have room for names and XP benefits. Sparse desktop activity grids also use auto-fit, keeping their prior minimum card width. Cards no longer say “buy the previous rank first.” Selecting any of the three workshop ranks shows its actual skill-level count, prior-rank owned/required count and exact materials on the right. Previously earned ranks remain marked Acquired. Engine now accepts an optional requested rank and rejects skipped/duplicate/invalid ranks without spending; default next-rank behavior, rewards, prices and saved rank IDs remain. No new tool/weapon ownership gate was added merely for presentation consistency. Passive tooltips, left-aligned plain requirements and the new primary shop category hierarchy are preserved. Fresh screenshots use a test hero.

Verification: 122 regression checks, sequential-rank/atomic-spend tests, eight shop theme/layout journeys, passive tooltip/source-link journeys, full ui-fit and ui-current pass. Browser assertions confirm the three ranks occupy the catalogue width and their names/benefit captions each render on one line at 1440×900; selecting a future rank displays its previous-rank count and cannot purchase out of order. Screenshots 11-expanded-upgrades.png and 12-rank-requirements.png were captured from the rebuilt game and inspected. No human usability or native-platform claim.

### Main-branch consolidation — 18 November 2026
Owner authorised consolidating all branches into main. See docs/branch-consolidation.md for the two obsolete November 12 snapshots and why their old source trees were not restored. Both histories are retained as merge parents; all remote branch tips are ancestors of the consolidated tree. The eleven other historical branches were already in main. Current approved playable source, art, save protections and audio engine are retained; no duplicate nested project/ZIP files were introduced. No branch deletion was performed.

Rebuilt standalone and verified: 122 regression checks; 8 artwork checks; desktop atomic-save suite; skill/shop sequential purchase rules; eight-layout shop journeys; passive tooltip/page source navigation; full ui-fit and ui-current. Captured and inspected the current shop with a test hero. Consolidation does not constitute new audio content, human playtesting or native Steam validation.

### Consistent card dimensions correction — 18 November 2026
Owner clarified that “use the space” meant consistent card footprints across catalogues, not stretching Enchanting's three cards. Replaced auto-fit stretching with the shared 300×210 design-pixel card dimensions across illustrated shop/activity lists; sparse panels can retain empty space. Phones cap width to their panel and reduce padding on the smallest screens, preserving font sizes. Card titles are 17px and secondary lines 15px. Recipe cards show compact level/duration metadata; stats and full prerequisite sentences remain in their selected detail/tooltip. Long gated descriptions become a concise card state rather than wrapping. Actual inputs remain named. No progression, price, source or save changes.

Verification: 56 catalogue/page/viewport/theme cases pass fixed width/height and single-line text without horizontal overflow, including the longest thief-glove names at 320px; full ui-fit and 122 regression checks pass. Fresh catalogue screenshots were inspected using a granted level-99 test character. Current UI regression verification follows. This supersedes earlier auto-fit claims; no native/human playtest claim.

Final gate: full ui-current and all 122 regression checks also pass. Rebuilt standalone matches source. This tested correction is delivered to main, with the temporary implementation branch removed after merge.

### Four-wide catalogue follow-up — 18 November 2026
Owner requested four columns. Shared cards are now 260×210 design pixels with the same fonts; reduced horizontal padding keeps the longest tool names on a single line. Catalogue width caps at four cards, and desktop shop detail width is 300px, allowing four columns at 1440×900 and above. Narrower layouts reflow instead of stretching or reducing typography. No game rules, costs or save changes. Updated catalogue checks explicitly assert four tool columns at desktop width, with all existing size/label/theme/phone checks. Screenshot four-wide-tools.png uses a granted level-99 test character.

### Responsive card packing across the game — 18 November 2026
Owner extended the approved packing system across card screens. Removed the four-column cap; cards fill every available column at their readable width. Shared shop/activity cards remain 260×210 with unchanged type. Applied the same fixed-width/auto-fill rule to Beastmastery choices, field-guide entries, furniture, Scholarship families, skill summaries, achievements, collection rows, spells, bounded farm plots/pens/seeds and museum icon grids. Content-heavy cards use wider minimums to retain readable titles. Narrow screens stack guide portraits and collection metadata instead of squeezing names. Live field-guide tiles now show complete creature names rather than ellipses; full entry detail remains in the existing popup. Existing farm/ranch pagination and game rules are retained. No new menus, counters or mechanics.

Verification so far: 122 regression, 56 catalogue/theme/layout cases, 80 cross-screen packing cases and full ui-fit pass. Packing checks verify every available column is used and card names remain single-line without page overflow. Final current-UI, full early/mid UI rules and ultrawide check follow. Screenshot fixtures grant midgame progress; no normal pacing/human-testing claim.

Final delivery verification: full ui-current and ui-fit pass on the frozen rebuilt source; all 122 regression checks pass. The 80 card-screen cases include full live field-guide names and more than four shop columns at ultrawide width; the 56 longest-label catalogue cases also pass. Full early/mid UI rules pass in both themes and desktop/phone layouts. The audit now recognises an explicitly required named seed as an input rather than treating the crop word within its name as a revealed output. Current screenshots were inspected for housing, field guide, research and shop. Temporary usage-limit interruption is resolved; delivery proceeds to main and the temporary branch is removed after merge.

### Whole-game spacing audit and varied returns — 19 November 2026

Responded to the owner's rejection of oversized field-guide cards and wasted menu space across the game. `docs/menu-spacing-audit.md` records 143 captured page/submenu states and the decisions for each screen family. Field guide is now one compact 86px index with full names, counts and real progress, with near-complete entries ordered first rather than in a separate gap-producing section. Catalogue columns share the available row remainder at a 260px minimum. Production choices are 180px high; simple shop stock 170px, material-heavy tools 210px and workshop ranks 180px, with unchanged type sizes. Reading areas and scenery retain their functional space.

Short Home, recipe, spellbook, guild, farm/supply and trapper panels stop after their contents. Tools, collections and reference grids use the available width. Shop skill subnavigation now sits inside stock, including all workshop commissions, while primary categories and purchase controls stay fixed. Phone skill selectors use two columns at narrow widths. Corrected two regressions found by visual inspection: a catalogue collapsing to a narrow column and workshop rendering discarding the relocated skill selector. Required material images have enough room for their enforced pixel scale.

Expanded the existing away-event pool from seven to 21 types, including Mabel/Hettie character moments, a letter, weather, wildlife, gardening, a forge apprentice, map and archive questions and music. Skill moments require their skill; named villagers stay in Willowbrook. Small resource/base-XP rewards and optional exchanges reuse existing systems. Least-seen selection persists in S.seen and excludes pending types. Full inboxes preserve unresolved encounters. Existing absence thresholds, pace risks, offline cap and automatic work remain.

Return outcomes now replace their choice in its original position, preserve measured minimum height, describe the selected choice and show actual compact reward facts (including XP). Focus moves to the outcome without scrolling. Outcome/journal/rewards and consuming the choice save together; failure rolls everything back. Invalid and duplicate claims fail. Existing saved chest decisions still work. No new scheduler, currency, exclusive shop gear or forced check-in loop.

Verification: 122 regression checks; seven new away integration groups covering all 42 new options, fair rotation, pending preservation, save round-trip/failure and old decisions; 170 guide-topic/layout/theme cases at phone/laptop/desktop/ultrawide sizes; 56 catalogue cases; 80 packing cases; full ui-fit and ui-current; shop-skill-updates-ui and stationary shop/combat checks; eight pixel-art checks and desktop-storage. Current screenshots were inspected, including an outcome resolving between two unchanged decision cards. Screenshot fixtures grant progress (levels 35 or 99) and do not represent normal pacing. Final UI-rule and narrow-phone smoke results are appended below when complete. Long-term encounter appeal remains a human-playtest question.

Final delivery checks: full UI rules pass; 24 additional checks pass for 320/390px phones and 1280/1920px desktops in both themes, including all 21 upgrade routes with unbroken menu labels and the shortened Beastmastery list. Rebuilt standalone and source syntax/diff checks pass. No native-platform or human-enjoyment claim.
