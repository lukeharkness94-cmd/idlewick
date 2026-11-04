# Idlewick Art Completion Pack

Proposed art for approval, based on main at `67a5999923a45192899e9454873e94443a4c3c41`. No game scripts, saves, layouts or live asset mappings change in this PR. The user's request for an approval branch takes precedence over the older main-only workflow in AGENTS.md.

Open [review.html](review.html) locally after cloning the branch. It provides category buttons, light/dark backgrounds and 64/128/256 px views. GitHub displays HTML source rather than running the page; the PNG atlases can be viewed directly there.

## Contents

| Sheet | Entries | Purpose |
|---|---:|---|
| food | 24 | Cooked fish, meals and burnt food |
| timber-metals | 24 | Logs, metal bars and ammunition |
| minerals | 16 | Ores, gems and ember core |
| supplies | 26 | Drops, produce, feed, cloth, currency containers and potions |
| farm | 30 | Ten seeds, ten harvests, ten mature plants |
| mining-targets | 12 | Eleven distinct geological formations and a beehive |
| furnishings | 25 | 21 furnishings, cottage and three worker portraits |
| utility-icons | 50 | Remaining utility and material symbols |
| restoration | 18 | Before/after pairs for nine projects |
| landscapes | 8 | One landscape per town |

233 entries across ten PNG atlases, about 25 MB. These are gouache-inspired raster assets generated with built-in imagegen, not human-painted originals. Exact generation prompts are retained in [manifest.json](manifest.json); the final mining edit is recorded in [mining-revision-prompt.txt](mining-revision-prompt.txt).

## Art direction and audit

The repository already contains painted fish, trees, creatures, companions, townsfolk, tools, equipment templates, navigation and a composited hero. Those assets are preserved. This pack addresses the remaining broad static-art categories: landscapes, restoration scenery, material/food icons, farm plants, mining targets, furnishings and utility symbols.

Use muted pigment, irregular worn edges, recognizable materials and species, restrained highlights and distinct silhouettes. No smiling animal replacements, idealized hero replacement, recoloured generic boulders, glossy 3D treatment or pixelated scaling. Town scenes have different geography and quiet foreground space. Restoration pairs make completed projects visually legible.

This is not a new animation system or an exhaustive equipment-tier repaint. Intermediate crop growth stages, animation rigs, particle effects and bespoke art for every equipment tier remain outside this pack. The three workers are portrait assets, not full articulated characters.

## Integration after approval

- Use each entry's explicit `rect: [x,y,width,height]` in source pixels. Generated sheets are not perfectly uniform; blindly dividing into equal cells clips subjects and leaks neighbouring icons. The review page uses the corrected rectangles.
- IDs are scoped by sheet. Food fish IDs refer to cooked fish, not the existing raw-fish portraits. Resolve them through the existing item definitions when wiring the renderer.
- Register approved art through `js/art_painted.js`, preserving existing fallback behaviour, identifiers and display sizes. Normalize transparent source rectangles into a square canvas with aspect ratio preserved before runtime use.
- Map mining targets to the matching mining node IDs. Farm `*-mature` entries depict fully grown plants only.
- Landscape entries map to town IDs. Each landscape is 768 × 256 pixels; avoid promising native 4K detail or enlarging interface cards merely to fill a wide screen.
- Composite project `*-before` / `*-after` pieces according to existing restoration state. Keep them aligned and do not bake completed projects permanently into every town background.
- Load assets lazily by category. This approval pack intentionally retains lossless PNG sources; choose delivery compression after visual approval.
- Runtime integration must include both themes, narrow and wide screens, save preservation and packaged-game rebuild checks. None of that integration is claimed by this PR.

## Validation

Run `python3 scripts/build-art-review.py` to rebuild the review page. Run `node tests/art-completion.cjs` with `@napi-rs/canvas` available (the same optional dependency as the existing art smoke test). Set `ART_PACK_PREVIEW` to an output directory to render labelled crops against alternating light and dark backgrounds.

The asset check verifies all 233 entries, unique IDs per sheet, PNG decoding, dimensions, checksums, source-rectangle bounds, nonempty crops and transparent margins. The sheets and cropped contact sheets were visually inspected. Explicit rectangles fix clipping found in the first equal-grid review. Browser interaction testing of review.html was blocked by the browser's local-file URL policy; no browser behaviour is claimed as verified.

Approval is for the visual direction and proposed static assets. The game continues to use its existing art until a separate integration change is approved.
