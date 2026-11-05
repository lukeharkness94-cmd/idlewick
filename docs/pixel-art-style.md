# Idlewick pixel-art style guide

All artwork in Idlewick is original pixel art drawn in code by `js/pixelart.js`. No image files, no generated or traced imagery, no sprite packs. This guide is the contract every sprite follows; the in-game showcase (Settings → Art showcase, page `showcase`) is its living reference.

Status: the prototype set passed an **internal** quality review (described below). It has not been approved by the project owner.

## Canvas sizes and display

| Kind | Sprite size | Shown at |
| --- | --- | --- |
| Inventory items, resources, equipment icons | 16 × 16 | 3× (48 px); 2× in dense lists |
| Skill and menu icons | 16 × 16 | 2× in menus, 3× on cards |
| Hero | 24 × 32 | 4× on character panels, 3× in work scenes |
| Creatures, companions, townsfolk | 32 × 32 | 3× on cards, 4–5× in the arena |
| Fish | 32 × 16 | 3× |
| Trees | 32 × 48 | 3× |
| Buildings | 48 × 40 | 3× |
| Town scenes | 160 × 90 | the largest whole number that fits |

Sprites are only ever scaled by whole numbers, with `image-rendering: pixelated` (the `pxa` class). Never resample, blur or draw a sprite at a fractional scale.

## Light and colour

- **One light**, from the top left, for everything. The renderer lights each material automatically: pixels exposed to the top left take the highlight (or the glint on corners), pixels exposed to the bottom right take the shadow.
- **Five-step ramps** per material (`ramp()`): outline, shadow, base, highlight, glint. Shadows lean violet (`#3a2448`) and highlights lean warm (`#fff3cf`), so colours stay alive instead of going grey.
- **One shared palette** (`R`, `SKIN`, `HAIR` in `pixelart.js`). New materials are added there as a ramp, never as one-off colours in a sprite.
- Fixed colours (`fix`) only for deliberate details: eyes, catch-lights, gems, buttons, flowers.

## Outlines and clusters

- **Selective outlines**: the silhouette is outlined in the darkest step of the material it touches, never flat black. Interior lines use the shadow step.
- Keep pixel clusters intentional: no isolated stray pixels except catch-lights; no single-pixel lines longer than three pixels for important shapes (use two-pixel strokes, as on the bow and sword).
- Avoid dithering on sprites; scenes may use stepped bands (the sky) instead of gradients.

## Silhouette first

Every item must be recognisable from its silhouette alone. Variants are new shapes, not recolours: the pike is long with a forked tail and a dorsal fin set far back; the carp is deep and humped with a long dorsal; the oak is a lumpy dome on a rooted trunk; the pine is stacked tiers. Material tiers (bronze, iron, steel, …) may share a shape **only** for equipment of the same kind, and then they differ by ramp and trim.

## Characters

- The hero is a 24 × 32 chibi: a big readable head, two-pixel eyes with a catch-light, ears, a swept fringe and side locks.
- Faces are distinct designs (`bright`, `freckled`, `bearded`), combined with four skin ramps, five hair ramps and six tunic colours.
- Equipment is drawn onto the same body grid: helmets are open-faced (dome to the brow, brim, cheek guards beside the face, never over it); body armour covers the torso and shoulders; weapons sit in the right hand.
- Creatures use anatomy-specific constructions (bird, humanoid, quadruped, …) on 32 × 32 with eyes always readable.

## Animation

- Sprite frames swap on a stepped timeline: pixel art never tweens between frames (idle breathing 2 frames, chopping 3 frames).
- Whole-sprite motion (lunges, knock-back), particles and UI transitions stay continuous and time-based, as the rest of the game requires.
- Hits flash the target white for one beat. Everything respects reduced motion and calm mode (the first frame, still).

## Scenes

- Scenes are composed from the same sprites (trees, buildings) on stepped-band skies and layered hills, with soft contact shadows under everything that stands on the ground.
- Paths, flowers and grass tufts are placed by hand for each town, never scattered randomly at render time.

## Internal prototype review (quality gate)

Reviewed at 100% zoom on desktop (1440) and phone (390), in both themes:

1. Consistent colour and lighting: one light direction and shared ramps across hero, creatures, items and scenery. Pass.
2. Crisp clusters: all sprites at whole-number scales, pixelated rendering. Pass.
3. Distinct silhouettes: three creature anatomies, two tree species, two fish and three tools all read at a glance. Pass.
4. Materials and equipment: bronze reads as warm metal, the helmet leaves the face visible, the sword has a crossguard and grip. Pass after fixes (the first helmet covered the face; the first bow was a one-pixel line).
5. Proportions: hero 24 × 32 against 32 × 32 creatures. Pass.
6. Detail density: comparable across sprites; the scene's hand-placed flowers and tufts match the sprites. Pass.
7. UI integration: the showcase sits in the normal page and panels in both themes. Pass.
8. Warm, characterful aesthetic. Judged pass internally; needs the owner's eye.

Fixed during the review: face-covering helmet, dotted bow, stiff wolf legs, noisy carp scales (then a new carp shape), floating trees (contact shadows), stray hair pixels.
