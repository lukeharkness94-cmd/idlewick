# Motion performance: one clock, a cheaper snapper, page turns (27 Nov 2026)

Owner: "smoother and higher FPS animations, more logical flow". What changed is in HANDOFF.md ("One animation clock,
a cheaper snapper and page turns"); the rule is in AGENTS.md (Motion).

## How it was measured

`node scripts/measure-motion.cjs` (Playwright's headless Chromium, 1440 × 900, a fresh hero, no pop-ups open):
10 s on Home with woodcutting running, then 10 s on Combat fighting a chicken. It records

- requestAnimationFrame callbacks per frame (callbacks grouped by the frame timestamp they receive) and the time
  spent inside them;
- frame times from those timestamps (p50, p95, frames over 25 ms);
- scripting, layout and style time per second (CDP `Performance.getMetrics`) and long tasks (`PerformanceObserver`);
- time inside the pixel snapper (CDP CPU profile, inclusive time of `snapAll` before, `snapEls` after).

"Before" is `origin/main` at d32cb31 (its built `Play Idlewick.html`), "after" is this branch. Runs alternated
before/after three times on the same machine; the table gives the median of the three.

| | Home before | Home after | Combat before | Combat after |
|---|---:|---:|---:|---:|
| rAF callbacks per frame | 4.07 (up to 6) | **1.01** (up to 2) | 2.12 (up to 4) | **1.00** (up to 1) |
| time in rAF callbacks, ms/s | 27.8 | 25.8 | 37.3 | **5.9** |
| pixel snapper, ms/s | 3.4 | **0.1** | 30.4 | **0.04** |
| scripting, ms/s | 44.4 | 42.4 | 25.0 | 22.0 |
| layout, ms/s | 7.4 | 7.6 | 33.4 | 26.8 |
| style recalculation, ms/s | 76.1 | 68.5 | 184.8 | 198.1 |
| all main-thread tasks, ms/s | 237.9 | 229.2 | 399 | 384 |
| long tasks (> 50 ms) in 10 s | 0 | 0–1 | 3 (≤ 85 ms) | 4 (≤ 59 ms) |
| frames/s (headless, see limits) | 56.2 | 56.1 | 52.9 | 52.3 |
| frames over 25 ms in 10 s | 37 | 36 | 62 | 64 |

Other evidence from CPU profiles during a fight (8 s, 0.1 ms sampling):

- The strike beat searched the page (`document.querySelector('#view .activity-stage.working')`) every frame, even in a
  fight with no work stage: about 19 ms of every second, the largest single per-frame cost. It now reads a live list
  and only when the task has a beat; the search is gone from the profile.
- The old snapper ran a whole-page `querySelectorAll` plus a forced layout on every frame that had any DOM change (text
  updates count), which in a fight is most frames. Now a ResizeObserver hands it only the sprites that were added or
  changed, after the browser's own layout, so it forces nothing; in a quiet fight it measures nothing at all.
- Infinite CSS loops that repainted or relaid out every frame: the progress-bar light (background-position), weather
  drops (top/left/bottom) and two box-shadow "breathing" loops that the shape layer's `!important` shadows already hid.
  The first two now move by transform; the hidden two are gone.

## Page turns

Changing page from the top menu, page tabs, rail or a route chip cross-fades and slides `#view` only (170 ms out, 210 ms
in) with the View Transitions API. `tests/motion-clock.cjs` checks that it runs only with the API and the
`idlewick.transitions` flag in automated browsers, never under Reduce effects or reduced motion, that the top bar and
rail never move and that `#view` keeps its box. It adds one frame between the click and the new page (the click is
replayed inside the transition so state and DOM still change together).

## What these numbers cannot tell you

- Headless Chromium here has no GPU: the compositor draws in software and frames are paced at 60 Hz, so frames/s and
  frames over 25 ms are bounded by software compositing (the same before and after) and say nothing about 120/144 Hz
  displays. What the change guarantees is structural: one callback per frame on the display's own clock, elapsed-time
  motion, and less main-thread work per frame. Real smoothness on the Steam builds (Windows, macOS) needs a look on
  that hardware.
- The machine was shared; absolute ms/s move with load (one run of each was taken at load average 5–9). The
  callback counts and snapper numbers are stable across runs.
- Biggest remaining cost in a fight is style recalculation (~190 ms/s), from the fight's own animations; not touched
  here.
