# NEXT-BRIEF delivery

Prepared from `NEXT-BRIEF.md` at main `2b57c11`, on `art/idlewick-next-pieces`. No main-branch changes or deployment.

## Delivered

52 additional entries across seven PNG sheets, bringing the manifest to 285 entries:

| Sheet | Count | Status after merging this branch |
|---|---:|---|
| restoration-willowbrook | 11 | Four before/after project pairs plus bell, lamps and star displays; automatic scene integration |
| relics | 6 | Automatic item-ID integration |
| farm-growth | 21 | Soil and two early stages for all ten crops; automatic growth integration |
| workers | 1 | Woodcutting portrait; worker lookup now searches all sheets |
| hero-head-layers | 5 | Four metal tier bands and leather hood; reserved for Claude's fitted compositor |
| hero-body-layers | 4 | Four tier bands, including sleeves and collar; reserved |
| hero-leg-layers | 4 | Four tier bands with boots; reserved |

PNG source files are under `assets/art-completion/`; WebP delivery files are under `assets/art-completion/web/`. Exact initial and correction prompts, SHA-256 hashes, explicit crop rectangles and restoration placement are in `manifest.json`. Generated with built-in imagegen. No existing PNG artwork was replaced. Existing WebP deliveries were retained byte-for-byte because local encoder versions otherwise introduced unrelated changes.

The optional painted world map was not included. No town coordinates, equipment statistics, progression or saves were changed.

## Restoration placement

Each new piece has `place: {x, base, h}`. Pairs share a placement. Forge and library sit beside the middle-distance green; the watchtower is farther back. The garden occupies the right foreground without crossing into the action area. Bell, lamps and star sit above baseline .72. The original well/inn placements are unchanged.

The actual scene compositor was exercised with all projects unfinished and then all completed. Tests assert that each new rectangle stays within the landscape and does not enter the protected centre foreground (x .30–.70 below .72). The before/after rendered scenes were visually reviewed.

## Fitted hero handoff

These are **layer source assets, not an enabled or fully validated equipment renderer**. Each entry includes a nominal `target: [x,y,w,h]` on the 384 × 576 hero canvas. The head targets follow the brief; body/leg targets extend slightly to cover sleeves and boots. These targets remain in the source manifest (the current delivery-map builder intentionally exports only crop and restoration placement metadata).

- `head-bronze-iron`, `body-bronze-iron`, `legs-bronze-iron`: rounded hammered metal and bronze rivets.
- `*-steel-mithril`: articulated angular plate and cool blue-steel accents.
- `*-adamant-rune`: heavy ridges and a higher angular collar.
- `*-astral`: pale fluted silver with subdued lavender detail.
- `head-leather`: enclosing leather hood with an open face aperture.

The head layers have transparent face openings; body layers have collar and sleeve openings; legs include boots and an open gap between them. Shapes differ between tiers rather than relying solely on tinting. They are front-facing and must be fitted to the same hero pose.

Claude's compositor work still needs to suppress underlying hair/clothes where appropriate, preserve hands and the original face, map item IDs to tier bands, draw legs then body then head, and verify seams across all appearances and work/combat poses. Do not simply route these IDs through inventory artwork or paste the old rectangular face patch on top. Crop-padding and face-aperture alignment need final fitting in that renderer. Existing equipment and hero output are unchanged here.

## Verification

- `node tests/art-completion.cjs`: 285 entries / 17 sheets; PNG decoding, checksums, source bounds, unique IDs, nonempty crops and transparency.
- `node tests/art-next-integration.cjs`: real art-completion renderer with local canvas/image loading; new worker lookup, six relics, 30 growth render cases, restoration state/cache changes and placement bounds.
- `node tests/regression.cjs`: core gameplay regression suite.
- `python3 scripts/build-art-review.py`: regenerated review gallery; supports single-entry sheets and nonsquare crop proportions.
- `python3 scripts/build-art-delivery.py`: regenerated WebP additions and delivery map (requires Pillow).
- `python3 scripts/package-game.py`: rebuilt the standalone game.

Optional `ART_PACK_PREVIEW` and `ART_NEXT_PREVIEW` output directories produce crop contact sheets and before/after town renders for inspection. Headless canvas tests do not replace browser/interactive playtesting; no new browser UI verification or fitted-hero validation is claimed.
