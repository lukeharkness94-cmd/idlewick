# Idlewick — current handoff

This repository contains the current game source and the generated `Play Idlewick.html`. It supersedes the older imported dashboard layout. The user wants to continue in Codex Cloud from Windows.

## Product direction — preserve these decisions

The latest feedback was emphatic: **this should feel like a pixel RPG, not a form or dashboard**. Keep visible, illustrated choices and a large target scene. Woodcutting shows the selected tree and resulting logs; mining shows the ore-bearing rock; crafting shows the output and illustrated ingredients; combat shows the actual opponent and the equipped hero. Do not replace these with dropdowns again. Compact navigation is useful, but visual appeal takes priority over squeezing everything into text.

All selectors render visible wrapping buttons through `UI.choiceButtons`, including navigation, combat focus, spells, thresholds, shop quantities and queue rules. The helper parses option definitions in an inert template; no select enters the rendered page. Existing delegated change handlers still apply. Reference sections are always expanded, quests display all cards in the current tab, and inventory uses its illustrated item grid without a duplicate selector. Farming displays fields and animals together.

**Latest widescreen direction: add columns, keep artwork at its normal display size.** The previous screen-size-based artwork, hero, font and panel enlargement has been removed. Combat now exposes independent preparation/loadout/abilities/food/skills cards in an adaptive grid. `js/layout.js` packs their natural heights with ResizeObserver so a tall boss card does not push every other card down. At desktop widths of 1920/2560/3440, the combat grid has 4/6/9 tracks (the battle uses two). Gathering and recipe reference panels can sit beside the action and choice cards. Inventory columns grow automatically, with selected details beside the backpack at wide sizes. Artwork remains native 48px/64px detail, rendered at the normal crisp display sizes. Verified no overlaps/overflow at 390, 1440, 1920, 2560 and 3440px; both themes and combat controls checked. Preserve this density-based adaptation rather than scaling content up with screen width.

The user also requested an initial tutorial and a quick first-time introduction for each newly unlocked skill: what it does, what its output is used for, and a useful goal. These are inline, dismissible cards in `js/onboarding.js`, with persistent once-only state. Existing saves skip lessons for skills already used. Settings → Help & learning can hide or restart the guides. Newly unlocked skill explanations appear on their first visit so running tasks are not interrupted.

Routine achievements, loot and levels use badges and the bell history instead of popups. Same-page warnings use inline status. Do not notify the user with a popup for a level gained on the screen they are already viewing.

Town restoration matters. Willowbrook has a well and an inn with material costs, permanent benefits and visible scene changes. Projects can be pinned below the HUD, with live material counts and the next useful action. One village project is pinned at a time; it persists through reloads. Quests also affect the village art.

Gear shows its actual stats (e.g. Def 4, Rng 2) and differences from the equipped item in the same slot. Inventory and bank items have Sell and Sell all; source-limited sales preserve banked and equipped copies. Equipment sits around a compact full-body hero.

Shop prices use `UI.money(amount)`: a small visible coin and formatted amount, with an accessible currency label. Do not restore "8 coins each" prose on cards. Buy/sell totals show quantity and the coin amount; rare offers and inventory selling use the same visual treatment. Locked/owned rare cards retain their visible prices.

## Run and verify

- Play: open `Play Idlewick.html`, or `python3 scripts/preview.py` and visit http://127.0.0.1:8765/.
- Cloud preview: add `--host 0.0.0.0` if needed by the cloud preview service.
- Windows: use `py` instead of `python3`.
- Core checks: `node tests/regression.cjs` (no npm dependencies).
- Optional art check: `node tests/art-smoke.cjs` with `@napi-rs/canvas` installed. Set `ART_PREVIEW` to a PNG output path for a contact sheet.
- Rebuild: `python3 scripts/package-game.py`. Do not hand-edit the generated HTML.
- Historical Playwright experiments in tests/ predate this UI, include obsolete selectors and absolute paths, and are not the current regression suite.

## Architecture

Everything hangs off `window.DQ`: definitions in `DQ.data`, state in `DQ.S`, templates/actions/binders in `DQ.ui`. Script order in index.html matters. Most pages use `UI.V`, actions use delegated `data-do` handlers in `UI.DO`, and live values use `data-b` binders in `UI.B`.

- `state.js`: save validation/migration, localStorage, same-device multi-tab writer protection and derived stats. Add persistent defaults to `DQ.newState` and preserve older saves.
- `engine.js`, `systems.js`, `plan.js`, `research.js`: actions and the shared chronological world clock. Offline time is full speed for two hours, then half speed for six more; eight real hours gives five effective hours.
- `ui_core.js`: illustrated activity workspaces, recipe categories and combat stage. `UI.taskChoice` keeps the selected preview. `UI.DO.taskselect` selects an image card; the main action starts/stops work.
- `ui_pages.js`, `ui_extra.js`, `ui_meta.js`, `shell.js`: remaining pages, compact navigation, inventory/equipment, comparisons and HUD. Be mindful of wrappers around UI.render and page templates.
- `art48.js`: native 48×48 creatures, resource targets, crops and items; 48×68 equipped hero; 64px fallback icons for special gear. `gear.js` paints the main equipment at 64×64. These replace the older 24px creature sprites and enlarged-filter art at runtime.
- `scenes.js`: 384×130 town landscapes, with restored-project and quest details in the cache key.
- `journey.js`: selected destinations, restoration projects and persistent project pin tracker.
- `layout.js`: adaptive card packing on wide combat screens; disconnects/reconnects its observer when pages render and clears row spans on narrow screens.
- `onboarding.js`: first-play and skill lessons. `tut.version` handles old saves; `tut.done` stores acknowledgements. A few startup ticks must not make a new hero count as an experienced player.
- `fx.js`: quiet history, page badges and priority alerts.
- CSS: style.css for layout, light.css for light-theme overrides and motion.css for effects. Respect reduced motion.

## State and transfer

Browser save key: `dashboard-quest-save-v2`. Game progress is not stored in GitHub and does not automatically follow a code checkout or cloud environment. Transfer it privately through Settings → Save data → Download backup file / Load from file. Never commit the user's save or local test fixtures.

The full local conversation is not part of the repository. These notes preserve the implementation and user preferences needed to continue in a new cloud task. Do not claim the original chat itself was migrated just because the code was pushed.
