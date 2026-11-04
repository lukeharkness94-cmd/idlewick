# Idlewick working instructions

Read HANDOFF.md for current product decisions and architecture before changing the game.

- `main` is the sole working and delivery branch. The redundant `work` branch was removed after verifying identical history. Pull from and push to `main`; do not recreate `work`.

- The source is index.html, js/ and css/. Play Idlewick.html is generated; rebuild it with `python3 scripts/package-game.py` after changes.
- Run `node tests/regression.cjs` for engine, persistence, notifications, project pins and onboarding. The test uses only Node built-ins.
- Preview with `python3 scripts/preview.py`. Use `--host 0.0.0.0` only when the cloud preview needs it. Windows uses `py` instead of `python3`.
- Preserve the illustrated task cards and large visible action target. The user explicitly rejected replacing the game with dropdown selectors. Keep the tree and logs, ore-bearing rocks, crafting output and actual enemy visible.
- No dropdowns or collapsed disclosures anywhere. Use visible wrapping buttons, tabs and illustrated cards. Keep the layout fluid across the full viewport, including 2560 × 1440; do not restore a fixed maximum page width.
- Extra screen width must add useful card columns, not enlarge artwork, typography or panels. Keep normal pixel-art display sizes and pack shorter cards below each other.
- Keep the 208px desktop rail and naturally sized 52px skill rows with consistent padding. Short desktop windows may scroll the skill list; never crush rows or remove their padding to force all skills on-screen.
- Each item and resource must remain visually distinct; do not restore shared tool sprites, fish recolours, identical tree silhouettes or metal artwork for leather equipment. `js/art_identity.js` layers these designs over art48.js.
- The latest art direction is painted, natural, characterful models. Fish, trees, creatures, companions, townsfolk, tools, equipment and navigation use transparent gouache atlases via art_painted.js; painted_runtime.js composites the hero. Landscapes and some material/utility icons retain earlier art. Preserve unique silhouettes and normal display sizes; never apply pixelated rendering to painted assets.
- Beginner and newly unlocked skill guides are inline, dismissible and shown once. Keep routine finds and achievements in the bell. Skill and Hero level-ups and unlocks must be visible even on the current page, with the unlocked content/perks explained. Menu counts reflect current available actions, not unread notifications. Do not add forced tours.
- Preserve existing saves, town restoration, gear comparisons and selling from both inventory and bank.
- Equipped copies live outside inventory. Preserve the spare-copy labels, item conservation during swaps/unequips, and the guard against re-equipping an identical non-ammo item.
- Check desktop and narrow-screen layouts and both themes when changing UI.
- Never commit personal game saves, credentials, test sessions or machine-specific configuration.

- Steam on Windows x64 and macOS (Intel/Apple Silicon) with shared Cloud progression is the release target. Preserve the desktop storage bridge and identical save schema/file names; browser storage is a preview fallback. See desktop/STEAM.md before changing persistence or packaging. Never claim Steam Cloud is activated or native builds are validated without the real App ID and platform tests.
- Animations use continuous browser timelines/native refresh rates, with no stepped easing or hard 60 Hz repaint loops. Particle and background motion must use elapsed time so high-refresh screens do not change animation speed.
- Keep skill progress in compact cards above the activity, independent of long choices lists. Combat status/preparation belongs with the fight; loot is a separate lower-priority card. Both themes must use a single non-repeating arena background.
