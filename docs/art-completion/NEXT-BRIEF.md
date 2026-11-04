# Idlewick art brief: the next painted pieces

The completion pack is live in the game (`js/art_completion.js`). These are the gaps that remain, in priority order.
Use the same style and prompt wording as `manifest.json`: transparent gouache-inspired sheets, explicit `rect` per entry,
no lettering, no glossy 3D, no pixel art, no cartoon smiles. Add each new sheet to `manifest.json` as a new `set`
(same fields: `id`, `file`, `cols`, `rows`, `transparent`, `width`, `height`, `entries[{id, subject, rect}]`), put the
PNG in `assets/art-completion/`, then run `python3 scripts/build-art-delivery.py`. The game picks new sheets up
automatically: matching item ids become item art, `restoration*` sheets supply project pieces, and `<crop>-stage1/2`
and `soil` become growth stages.

## 1. Willowbrook restoration additions (highest priority)
Sheet id `restoration-willowbrook`. These projects exist in the game but have no painted piece yet, so the painted
landscape shows no change when they are finished:

| id | subject |
|---|---|
| `forge-before` / `forge-after` | small village smithy: cold and boarded, then a glowing forge with an anvil and smoke |
| `garden-before` / `garden-after` | a patch of the common: weeds and broken edging, then tidy vegetable beds and flowers |
| `library-before` / `library-after` | small stone reading room: shuttered and dark, then warm lit windows and a blank sign |
| `watchtower-before` / `watchtower-after` | timber watchtower: a leaning, half-built frame, then a sturdy tower with a lantern |
| `bell-after` | the Miller's Bell on a simple timber frame on the green |
| `lamps-after` | two iron lamp posts with warm crystal lenses |
| `star-after` | a softly glowing star-shaped heart on a slender pole |

Give each entry a `place` field so it sits correctly on the Willowbrook landscape (`landscapes.png`, entry
`willowbrook`): `{"x": 0.0–1.0 centre across, "base": 0.0–1.0 baseline down, "h": height as a fraction of the
landscape}`. The well sits at x 0.88 and the inn at x 0.12 (base 0.93, h 0.42). Keep the centre foreground (x 0.30–0.70,
below base 0.72) clear; combat and work scenes are drawn there. Pieces should match the landscape's light and scale.

## 2. Relic and discovery items
Sheet id `relics`, six inventory icons (same framing as `supplies`): `weathered_map` (bark-stained folded map),
`rusted_lantern` (old brass miner's lantern), `star_shard` (a splinter of cool starlight), `millers_bell` (bronze
harvest bell), `lamplighter_lens` (crystal lens in a brass frame), `star_heart` (a warm, softly glowing star heart).

## 3. Crop growth stages
Sheet id `farm-growth`: `soil` (freshly sown plot) plus `<crop>-stage1` (sprout) and `<crop>-stage2` (young plant)
for potato, onion, cabbage, wheat, strawberry, pumpkin, goldleaf, sunbloom, moonmelon and starfruit (21 entries).
Same viewpoint and scale as the existing `*-mature` entries in `farm`.

## 4. Woodcutting worker portrait
Add `woodcutting-worker` (same framing as the three worker portraits in `furnishings`).

## 5. Hero equipment that is worn, not stacked (needs a code change too, planned)
Today helmets are drawn over the face and the face is pasted back, hair spills over helmets, and the tunic's sleeves
and trousers show around armour. Fitted layers on the hero's 384 × 576 canvas would fix this. Current slot boxes in
`js/painted_runtime.js`: head 139,12,108,105; face window 163,49,60,48; body 104,107,176,217; legs 114,305,156,218.
For each helmet: the full head covering with the face area left transparent, hair fully hidden. For body armour:
sleeves and collar included so no tunic shows. For leg armour: covers the trousers down to the boots. A leather coif
redrawn as a hood with a face opening. Tier bands (bronze/iron, steel/mithril, adamant/rune, astral) with different
silhouettes, not only tints.

## 6. Optional: a painted world map
The map is still pixel art. A painted map would need town positions matching `D.TOWNS` x/y (1960 × 1000 map units).
