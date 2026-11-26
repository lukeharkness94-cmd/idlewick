# Idlewick handoff for Claude

## Start here

- Repository: `lukeharkness94-cmd/idlewick`. Start from the current GitHub `main`. The Part B integration starts from the former main tip `036ecef` and includes the commits from draft PR #7. Use `git pull --ff-only origin main` and record `git rev-parse HEAD` before changing files.
- Read `AGENTS.md`, the final Part B section of `HANDOFF.md`, [the verification report](part-b-verification.md), and [the hours-three-to-five pacing map](part-b-hours-3-to-5.md). Historical handoff entries describe earlier interfaces.
- The browser entry is `index.html`. The distributable is `Play Idlewick.html`. Edit the sources in `js/` and `css/` and rebuild with `python3 scripts/package-game.py`. Preserve the script order in `index.html`.
- Work on scoped, reversible changes and make small commits. Ask the owner only when the decision materially changes progression, economy, save compatibility or another approved design. The owner asked to defer human playtesting until the amendments are finished. Do not claim observations from human players.

## Owner decisions to preserve

- Combat sits above the desktop skills rail. Keep the skill menu fully expanded. Keep original code-drawn pixel art and existing responsive layouts.
- Quick guides open on request, with contextual routes from the page being used. Routine progress belongs in the bell. Only a genuine unlock, main story scene or real decision can take over the screen. Unlock reveals are opt-in. Keep the Welcome Back summary first and use its decision count to open pending choices in Activity.
- Keep Fishing, Woodcutting and Cooking accessible at the start. Show other unlocks with actual requirements, preserve existing skill and quest progress when old saves load, and keep exact objective destinations. Ingredient links navigate and retain a return route without starting an activity.
- Preserve the 24-hour offline cap at full speed, all eight regions, ordinary quest gates, current boss stats, and the distinct Combat and Hunting activities. Preserve one main chapter at a time with side stories available.
- Use one currency. Preserve permanent restoration, optional daily errands without streak pressure, and the existing Museum. Apply the no-collapse rail requirement when addressing smaller targets. Keep a short layout accessible without hiding or duplicating skills.
- Steam Cloud and native macOS/Windows are unverified. Keep this explicit. Protect the original save and preserve the current save key, backward compatibility, recovery slot and export string. Use separate browser contexts and throwaway saves in QA.

## Work to pick up, in order

1. **Triage the full browser suite before changing design.** Compare failures on the current main tip and `036ecef` or the prior Part B test snapshot, ideally in separate clean worktrees. The first full Part B pass flagged `combat-loadout-ui`, `crosslinks-ui`, `hearthside-ui`, `hunt-stalk`, `player-feedback-ui`, `regional-preparation`, `tower-cutaway-ui`, `ui-current`, `ui-adventure`, `ui-fit`, `ui-journeys`, `ui-audit`, `ux-roles`, `ux-update`, `writing-navigation-stability-ui` and `ui-rules`. The latest focused reruns passed `combat-loadout-ui`, `regional-preparation` and `part-b-systems`. Some fixtures were updated to use a legitimately prepared hero. Verify the rest individually. Fix genuine issues. Update an old assertion only when a documented owner decision intentionally changed its behavior.
2. **Finish the pacing proof and investigate the remaining gap.** The final 180-minute no-grant Sword run restored the Mossbarrow market at 28½ minutes, unlocked Scholarship at 49, defeated Old Tusk at 131½, restored the Saltmere jetty at 133 and completed Crab Cull at 139. The 82½-minute interval from Scholarship to Old Tusk exceeds the target of no more than 60 minutes between meaningful rewards. The run reached real training for Barnacle. Capture bow and staff as well, then walk the rest of hours three to five. Prefer making an existing attainable non-boss reward easy to discover during that stretch, such as a regional side story, follow-up restoration, or a Field Guide milestone. Ask before changing boss stats or XP curves.
3. **Finish the accessibility audit.** The combined check verifies four basic Home units with an optional fifth flag, Home contrast in both themes, the scoped Home button dimensions and 18px to 36px type scaling at 390px, and Shop horizontal fit. Audit real browser zoom/text scaling on the full core-page matrix at 390px and a short desktop. Record actual legacy target-size and contrast failures with their selectors and fix reachable cases. Keep all rail skills visible. Seventeen 48px skill rows alone exceed 720px, so flag this exception and use an accessible design that preserves the owner's navigation requirement.
4. **After Part B is stable, resume Part C only if requested.** The Steam audit was skipped at the owner's request to work on Part B. Verify any separate work from earlier branches against main before applying it. Give release/platform validation and human playtesting their own pass.

## Reproduction

```sh
python3 scripts/package-game.py
python3 -m http.server 8765 --bind 127.0.0.1
```

In a separate shell:

```sh
export IDLEWICK_URL=http://127.0.0.1:8765/Play%20Idlewick.html
node tests/regression.cjs
node tests/art-pixel.cjs
node tests/desktop-storage.cjs
node tests/opening-skill-gates.cjs
node tests/campaign-opening.cjs
node tests/offline-digest.cjs
node tests/regional-preparation.cjs
node tests/progress-digest.cjs
node tests/part-b-systems.cjs
RESTORE=1 MIN=300 KITS=sword,bow,staff EVIDENCE=/tmp/idlewick-first-five-hours.json node scripts/review-opening.cjs
MIN=60 EVIDENCE=/tmp/idlewick-first-hour.json node scripts/play-first-hour.cjs
```

The browser tests require Playwright and Chromium. Set `CHROMIUM_PATH` only when using a system browser. For screenshots, set `SHOT_DIR` to an existing writable directory. Run the whole suite before marking release-ready. For the final report, give the commit, the actual script results, the remaining exceptions and screenshots from the rebuilt standalone.
