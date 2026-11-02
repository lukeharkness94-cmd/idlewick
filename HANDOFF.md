# Idlewick: handoff notes

Single-player idle RPG ("everything is a dashboard"). Plain HTML/CSS/JS, **no build step, no dependencies**. Open `index.html` in a browser (a local server such as `python3 -m http.server` is fine). Steam and mobile wrappers are planned (Electron / Capacitor), not started.

## Run and test
- Run: serve this folder, open `index.html`. Fonts load from Google Fonts with local fallbacks in `fonts/`.
- Tests were Playwright scripts (headless Chromium) driving the real page: start a new game with `#t-new` then `#cr-go`, then use `DQ.*` in `page.evaluate`. They are in `tests/` (they hard-code an absolute path to `index.html`; change `U`/the `goto` line first). Useful: `e2e*.js` (flows), `fold.js` (is the main action near the top?), `contrast.js light|dark` (WCAG contrast scan), `nflood.js` (notification flood), `dock1.js`/`dock2.js` (layout at several widths).
- `tests/harness.js` is a Node `vm` harness for engine-only simulation (no DOM). Notifications are suppressed during `DQ.simulate`.

## Architecture
- Everything hangs off `window.DQ`. Data in `DQ.data` (`D`), UI in `DQ.ui` (`UI`), state in `DQ.S`.
- State is saved to localStorage key `dashboard-quest-save-v2`; `merge(base, saved)` fills new fields, so **add new state fields to `newState()` in `js/state.js`**. Rolling backups: key `dashboard-quest-backups`.
- Script load order is in `index.html` and matters (later files wrap earlier ones): util, data, data2, data3, lore, hires, gear, pixel, sprites24, herogear, state, audio, fx, engine, systems, plan, goals, meta, ui_core, ui_pages, ui_extra, ui_plan, ui_more, pixelui, pixelmap, scenes, shell, ui_meta, shops, bestiary, research, polish, motion, boot.
- Pages are template strings in `UI.V.<page>` rendered into `#view`. Buttons use `data-do="name" data-a="arg" data-b="arg2"` and are handled by `UI.DO` (event delegation). Live numbers use `data-b="type:arg"` binders in `UI.B` (names cannot contain `:`; use one binder name plus an argument).
- Extension style used throughout: **wrapper pattern**, `const orig = UI.V.x; UI.V.x = () => orig().replace(...)`.
- Hubs (main menu) and grouped tabs are in `js/shell.js` (`HUBS`, `GROUPS`). Skills have their own second menu (`#skilldock`, `UI.renderDock`).
- World clock: `DQ.advanceWorld(dt)`; offline catch-up: `DQ.simulate(effMs, realMs)` with a taper (100% for 2h, then 50%, 8h cap).
- Theme: `html[data-theme=dark|light]`; `css/light.css` is scoped overrides only. `html.calm` (Settings > Reduce effects) and `prefers-reduced-motion` disable motion (`css/motion.css`).

## Art pipeline
- Creatures and plants: hand-drawn character grids (`js/sprites24.js`, 24x24). `js/hires.js` renders them at 48x48 (Scale2x, thin outline, rim light). The hero is painted in layers (`js/herogear.js`, 24x34 -> 48x68).
- Gear icons: `js/gear.js` paints 32x32 icons with a different design per tier (swords, daggers, hammers, bows, staves, arrows, helms, bodies, legs, shields, rings, amulets). Anything else falls back to the line icon. Use `DQ.itemIco(item)`.
- Town scenes: `js/scenes.js` paints eight 384x130 scenes procedurally. UI line icons are 24-unit SVG paths rasterised to pixel masks (`js/util.js`, `js/pixelui.js`).

## Design rules the owner set (keep following them)
- Fast to do what you came to the screen to do, with useful info beside it. Check where the first primary action sits on every page (desktop and phone).
- Consider mobile in every change. No horizontal scrolling in menus.
- Progressive disclosure with teasers, not hidden tabs; one new idea at a time in the first hour (unlock levels in `data.js`, `data2.js`, `meta.js`, `research.js`).
- Notifications are grouped (`js/fx.js`: now / digest / quiet tiers plus the bell). Motion is a reaction to clicks, never to hover or idle.
- Keep dark mode working when touching light mode, and vice versa. Run the contrast scan.
- Body font for headings and text; the pixel font is only for the logo and big numerals.

## Known gaps and ideas
- Not tested on real phones or in embedded browsers (image copy/save in the share sheet especially).
- Balance (research costs and times, bestiary rewards, potions) is by feel. The hidden Balance sheet (Settings > Show tuning tools) and the playtest report are for tuning from real play.
- Still 24x24 or line art: pets use the older templates in places, tool icons, many small UI icons. Hero figure gear variety is by tier shape and colour, not yet using the new gear icon designs.
- Farming page main action sits low; dark-mode contrast has two minor failures (combat "?" avatar, damage-type chip).
- Older ambient animations remain (combat sprites bobbing, "live" dots).
