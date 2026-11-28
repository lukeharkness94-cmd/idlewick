# Idlewick pixel-art style guide

All artwork in Idlewick is original pixel art drawn in code (`js/pixelart.js` and the files it feeds). No image files,
no generated or traced imagery, no sprite packs. This guide is the contract every sprite follows; the in-game showcase
(Settings → Art showcase, page `showcase`) is its living reference.

Status: **chosen by the owner on 28 Nov 2026** from reference images (a sheet of chunky 24–32 px outlined monsters, a
large detailed ogre, pixel interface frames). The references set the direction only: nothing is traced, copied or
recoloured from them, and one is a paid asset pack. This replaces the earlier, softer style (violet shadows, flat edge
light, a small-headed hero); `docs/rules-history.md` has the history.

## Canvas sizes and display

| Kind | Sprite size | Shown at |
| --- | --- | --- |
| Inventory items, resources, equipment icons | 16 × 16 | 3× (48 px); 2× in dense lists; readable at 1× |
| Skill and menu icons | 16 × 16 | 2× in menus, 3× on cards |
| Hero (front, chibi) and the side-on working figure | 24 × 32 | 4× on character panels, 6× in a fight, 3× in work scenes |
| Hero portrait (bust) | 16 × 16, cropped from the hero | the portrait box |
| Creatures, companions, townsfolk | 32 × 32 | 3× on cards, up to 6× on the combat stage |
| Bosses, mini-bosses, tower bosses (large) | 64 × 64 | 3× on the combat stage (2× on laptops); the 32 × 32 sprite elsewhere |
| Quest-giver portraits | 32 × 32 | 2× and 4× |
| Fish | 32 × 16 | 3× |
| Trees | 32 × 48 | 3× |

Sprites are only ever scaled by whole numbers, with `image-rendering: pixelated` (the `pxa` class). `pixel_runtime.js`
snaps each sprite to the nearest whole multiple of its native size after every page change. `Q.artImage('creature', id,
size)` hands out the 64 × 64 drawing only when the box shows it at 2× or more (128 px and up); a short window, whose
combat stage is 96 px, keeps the 32 × 32 sprite at 3×.

## Light and colour

- **One light**, from the top left, for everything.
- **Five-step ramps** per material (`ramp()`): outline, shadow, base, light, highlight. Shadows lean cool (`#1a1838`)
  and lights lean warm (`#fff2c8`), so colours stay alive instead of going grey. Dark materials (luminance under 64)
  get brighter lights, so a black cat or a void knight still shows its form on the near-black page (`#0b0c10`) and the
  wood panels (`#2b2019`).
- **Round forms are sphere-lit**: every ellipse (`ell`) takes a light step per pixel from its position on a sphere
  (`sphere(nx, ny)`): a highlight near the top left, light across the middle, the base, then shadow at the lower right.
  Heads, bellies, muscles, pauldrons and orbs read as volumes. `ell(..., { flat: true })` keeps a flat patch (a pale
  belly, a mark).
- **Flat shapes take edge light**: rectangles, polygons and lines are lit where they open to the top left (a glint on
  an open corner) and shaded where they open to the bottom right. `tone(x, y, ramp, step)` places a chosen step by hand.
- **One shared palette** (`R`, `SKIN`, `HAIR` in `pixelart.js`). Fixed colours (`fix`) only for deliberate details:
  eyes, catch-lights, gems, buttons, flowers.

## Outlines

- **Selective outlines**: every empty pixel touching a shape takes the darkest step of the material it touches, never
  flat black. Interior lines use the shadow step.
- Faces and small details are drawn last, on top of the lit shapes and the outline.
- Bold silhouettes first: two- and three-pixel limbs on creatures, chunky boots and fists on characters; no isolated
  stray pixels except catch-lights.

## Characters and creatures

- **The hero** (front, 24 × 32) is a chibi: a 13 × 11 head with 1 × 2 eyes, a swept fringe and side locks, a short
  tunic with a belt, chunky fists and boots; feet on rows 28–29. Three faces (`bright`, `freckled`, `bearded`) with four
  skins, five hair colours and any tunic colour. Equipment is drawn onto the same grid: open-faced helmets (dome, brim,
  cheek guards; the eyes always show), coifs and hoods round the face, crowns, plate with pauldrons, vests, robes to the
  ankle, a shield on the left arm, the weapon in the right fist, a cape behind. Idle-life frames (blink, yawn, stretch,
  pack, wipe) are drawn frames of the same sprite.
- **The side-on working figure** (`heroSide`) uses the same palette, outline and face, with a rounder head, but keeps
  its body geometry (shoulders, belt on row 20, hanging knuckles 8 px up, feet on the bottom row): `js/work_rig.js`
  draws the arms and tools from it and `tests/skill-realism.cjs` measures it.
- **Humanoid creatures** share the chibi build: head centred at (16, 9.5), eyes on columns 13 and 19, torso rows
  15–24, hands on rows 22–23, boots on rows 28–29. Hats and helmets are fitted to the head's box.
- **Eyes** are two pixels tall: a dark eye under a catch-light, or a glowing eye with a bright core (`EYES` in
  pixelart.js, `eye` in pixel_creatures.js). Every creature has a readable face.
- Families are built by anatomy (`A.BUILD`: humanoid, quadruped, bird, clawed, spectral, dragon, bat, rodent, golem,
  blob, brute, stout, lanky, hunch, floater, knight, beetle, spider, scorpion, isopod, newt, mushroom, treant, wisp,
  serpent, veil, orb, shadow, jelly, deer, armoured, toad, hedgehog, hare, fox, moth, kite) from a per-creature spec, so
  a pirate, a scarecrow and a skeleton are different figures. Hunting animals are builder recipes (`D.HUNT_ART`) with a
  mark of their own.
- **Bosses** (`js/pixel_bosses.js`) are drawn at 64 × 64 like Old Tusk: heavy sphere-lit masses for muscle and armour,
  a weapon, a crown or helm, glowing eyes. The twelve regional mini-bosses (`js/pixel_minibosses.js`, same painter) have
  their own 64 × 64 drawings too, each the character, palette and silhouette of its 32 × 32 sprite designed afresh at
  the large size: feet on the bottom rows, animals facing right, one readable face. Tower bosses keep their own designs
  redrawn at twice the detail (`A.atScale(2, make)`: ellipses and polygons are rasterised afresh, so curves are smoother
  and the outline is one fine pixel).
- Locked creatures stay blacked out (the `sil` class) and unnamed, at either size.

## Items

Every item is 16 × 16, readable at 1× and 2×, and different from every other (`node tests/art-pixel.cjs`). Variants
are new shapes, not recolours; material tiers of the same kind of equipment share a shape and differ by ramp and trim.
Fish icons are drawn plumper than their spot pictures so they read at 1×. The 29 named weapons
(`js/rare_weapons.js`) each keep their own hand-drawn identity.

## Animation

- Sprite frames swap on a stepped timeline: pixel art never tweens between frames.
- Whole-sprite motion (lunges, knock-back, wind-ups, staggers), particles and UI transitions stay continuous and
  time-based. Everything respects reduced motion and calm mode.

## Coverage

Every id the game can request resolves to a finished design (`DQ.pixelArt.coverage()` is empty; `node
tests/art-pixel.cjs` enforces it): about 480 items, 284 creatures (8 bosses and 12 mini-bosses with 64 × 64 drawings, tower
bosses with 2× drawings), 21 companions plus their evolved forms, the townsfolk and thieving marks, the farm animals,
the quest givers' portraits, trees, rocks, fish, crops and icons.
