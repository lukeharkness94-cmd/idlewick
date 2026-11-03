# Idlewick working instructions

Read HANDOFF.md for current product decisions and architecture before changing the game.

- The source is index.html, js/ and css/. Play Idlewick.html is generated; rebuild it with `python3 scripts/package-game.py` after changes.
- Run `node tests/regression.cjs` for engine, persistence, notifications, project pins and onboarding. The test uses only Node built-ins.
- Preview with `python3 scripts/preview.py`. Use `--host 0.0.0.0` only when the cloud preview needs it. Windows uses `py` instead of `python3`.
- Preserve the illustrated task cards and large visible action target. The user explicitly rejected replacing the game with dropdown selectors. Keep the tree and logs, ore-bearing rocks, crafting output and actual enemy visible.
- No dropdowns or collapsed disclosures anywhere. Use visible wrapping buttons, tabs and illustrated cards. Keep the layout fluid across the full viewport, including 2560 × 1440; do not restore a fixed maximum page width.
- Pixel artwork is now drawn on native 48px grids; equipment uses 64px. Preserve crisp pixel rendering and detailed, recognizable silhouettes.
- Beginner and newly unlocked skill guides are inline, dismissible and shown once. Keep routine notifications quiet and contextual. Do not add repeated popups or forced tours.
- Preserve existing saves, town restoration, gear comparisons and selling from both inventory and bank.
- Check desktop and narrow-screen layouts and both themes when changing UI.
- Never commit personal game saves, credentials, test sessions or machine-specific configuration.
