# Accessibility audit (Part B, finished 26 Nov 2026)

Run it with `EVIDENCE=out.json node scripts/audit-a11y.cjs` while the preview is running.

## What was checked

- **Pages:** 13 core pages: Home, Activity, Quests, Map, Village, Hero, Guide, Shop, Combat, Fishing, Cooking, Skill levels and Settings.
- **Viewports:** 390 × 844 (phone) and 1280 × 720 (short desktop).
- **Zoom:** both viewports again at 200% browser zoom. The CSS viewport halves, giving 195 × 422 and 640 × 360.
- **Themes:** both themes.
- **Fixture:** a fresh hero.

## Results

| Check | Result |
| --- | --- |
| Horizontal overflow at 390 × 844 and 1280 × 720 | None, in both themes |
| Horizontal overflow at 200% zoom on the short desktop (640 × 360) | None |
| Horizontal overflow at 200% zoom on the phone (195 CSS px) | 10–88 px on most pages (worst: Combat and Skill levels) |
| Targets under 24 × 24 CSS px, before | 15 kinds |
| Targets under 24 × 24 CSS px, after | 3 kinds |

The phone-at-200% case is narrower than the 320 CSS px that WCAG 1.4.10 asks content to reflow to, so it is recorded here rather than fixed.

## Fixed

- **Top bar icon buttons** (Home link, bell, mute) were 18 × 28 on phones. They are now at least 24 × 24.
- **"Next · Lv" skill-page buttons** (`.sh-next-btn`) were 21 px tall. They are now 24.
- **Other controls** were 20–23 px tall. On desktop they are now 28 design px, so they stay at least 24 CSS px at the 85% zoom floor. This covers:
  - text links styled as links (`button.linkish`);
  - settings switches (`button.tog`);
  - theme buttons.
- **Now card label at 1280 × 720:** its line height was tightened so a wrapped label no longer pushes the left column 2 px past the window.

## Open (recorded, not fixed)

- **Map town markers** (SVG `g.mt`) are 16–17 × 14–28. Enlarging them changes the map art's scale. Each marker also has a full-size town button in the map's side list.
- **Skill-page "Next · Lv" goal button** (`.sk-goal`) is 20 CSS px tall at the 85% desktop zoom floor. It sits in a fixed-height activity panel that `tests/ui-fit.cjs` keeps from scrolling, and Skill levels offers the same detail.
- **Skill rail rows** are 34–35 design px each (29 CSS px at 85% zoom) on short windows, so all 17 rows stay visible as the owner requires. They pass 24 px. The owner's rule keeps every skill visible, so rows cannot grow to 48 px on a 720 px window.
- **Contrast candidates.** The audit reads the nearest opaque background colour. It cannot see gradients, images or the town scenes behind text, so most results below 2:1 are text on gradient buttons or on pixel scenes. These need a visual check, not a colour change:
  - primary buttons;
  - town names on the map;
  - the coin price chip.

  Candidates near 3.4–3.9:1:
  - `span.h-lv`, the top bar level badge;
  - `i.hubdot.num`, the menu count dot;
  - `span.choice-state`;
  - `small.warn`.

  (The light theme was removed on 28 Nov 2026; the game is dark only.)
