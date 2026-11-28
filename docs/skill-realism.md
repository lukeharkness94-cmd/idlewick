# Skill realism

Owner, 27 Nov 2026: "work on some of the realism. The sizes of things in comparison to each other, the animations,
where the character holds things when using them in skills. Do research to make every skill more closely represent
how that skill would take place in real life."

This page records how each skill is really done by hand in a pre-industrial setting, what the work scene showed before
this pass, and what it shows now. The code is `js/work_rig.js` (poses, tools, stations), `js/strike_sync.js` (the
clock and the sounds), `js/pixelart.js` `heroSide` (the side-view working figure) and `css/work_rig.css`.
`tests/skill-realism.cjs` holds the rules below.

## What changed for every skill

**Before.** The working hero was the front-facing paper-doll figure with both arms hanging, standing at 12% of the
scene's width whatever its size, so the distance to the tree or rock changed with the window (about 2 to 6 m at
1440 px). The tool was the 16 px item icon drawn at 2.5x (not a whole-number scale) floating beside the hero and rotated
by one shared CSS keyframe; it never touched the target. The target's picture sat on its text baseline, a few pixels
above the hero's feet. Only woodcutting, mining, smithing, crafting and carpentry had a sound on the swing; the
smithing anvil was a 16 px icon shown at 4x beside the 3x hero.

**Now.**

- **The hero turns side-on to the job** (facing right, where the work is), feet a stride apart, in one of four
  postures: stand, crouch (reading a trail), kneel (setting a trap or a stake) and sit (on a stool at the stitching
  clam). The figure has no arms of its own; the rig draws both every frame, with the tool in the correct hand(s).
  Right-handed: the dominant hand is the far arm, drawn behind the body; the left (near) arm is in front. Two-handed
  tools have the left hand fixed at the end of the haft and the right hand sliding.
- **Scale.** The hero is 24 x 32 px, about 1.7 m, so 1 px is about 5.3 cm, and everything is drawn at the hero's own
  3x. Tools are sized to that (table below). The figure is drawn with a big head and short legs, so working heights
  follow its own joints rather than centimetres: the anvil face is at its hanging knuckles (8 px up, the smith's
  rule of thumb), the trestled board and the herb table at its belt (12 px).
- **Distance.** The hero stands where the tool reaches: for the axe, the pick, the pell and the archery butt the rig
  reads the target's own pixels at the strike height and places the hero so the bit, point or blade meets that edge
  on the strike frame; workshop skills stand at their station's working distance.
- **One ground line.** The target's picture now stands on the ground line (it was an inline image on a text
  baseline), stations stand on it, and the body leans only forward and back, so the feet never leave it. Fishing
  stands the hero on the jetty planks, 4 px above the bank line.
- **Motion.** 20 drawn frames per cycle, stepped, cached; the body's lean is continuous CSS (transform only) and the
  body breathes as one piece with its arms. Beat work (chopping, mining, smithing, sawing, stitching, carving,
  grinding, staking) repeats a whole number of swings per action as before; fishing, thieving, hunting, capture and
  alchemy play one cycle per action, phased like the real thing. Each strike is exactly on a frame boundary.
- **Sound.** `js/strike_sync.js` draws the frame for the moment, then plays each of the cycle's sounds as its own
  frame appears; if a slow frame skipped past a strike, the strike frame itself is shown with its sound. New
  synthesised beats: the float's plop and the strike's splash, the saw's push and lighter pull, bellows, chisel,
  engraving scratch, pestle grind, the mallet on a stake, the spear's swish, the survey pencil (the quill).
- **The target reacts** on the strike: chips (wood), sparks (rock, anvil), sawdust, ripples and splashes, a glint,
  a flare at the furnace mouth; the tree, rock, anvil or pell gives by a pixel. The forge piece glows hot at the start
  of each action and cools through it (heat, hammer, reheat).
- **The brow wipe** (js/personality.js) now uses each skill's own quiet window (after the strike, before the next
  wind-up), in the hero's posture, and a wipe a late timer lets run on is cut short before the next strike. Skills
  with no quiet moment (a pickpocket mid-lift, a hunter on the trail) never wipe.
- **Calm and reduced motion** hold the ready pose: no stepping, lean, breathing, chips or give. The sounds still play.

### Tool and station sizes

| Thing | Real size | Drawn | Test range |
| --- | --- | --- | --- |
| Felling axe (haft and head) | 70–95 cm haft, 3–3.5 lb head | 16 px (85 cm) | 14–18 |
| Miner's pick | 80–100 cm | 17 px | 15–19 |
| Smith's cross-peen hammer | 35–40 cm handle | 8 px | 7–9 |
| Tongs | 40–55 cm | 9 px | 8–11 |
| Handsaw | 65 cm blade + handle | 15 px | 13–17 |
| Float rod (no reel) | 2–3 m | 45 px (2.4 m) | 38–57 |
| Boar / hunting spear | 1.7–2.1 m | 35 px | 32–40 |
| Arming sword | 80–100 cm | 17 px | 15–19 |
| Bow | short 1.2 m, long 1.6–1.8 m | 24 / 30 px | — |
| Long wooden spoon | 60–70 cm | 13 px | 11–14 |
| Anvil on its stump | face at the smith's knuckles | face 9 px up, 9 px long + horn | knuckle ±2 |
| Trestles and board | board at the worker's hip | 12 px up | belt ±2 |

The thing being made rests on its station at a size from what it really is (pieceScale): a dagger, a bar, a rune or
a dish at 1x (16 css px, about 28 cm), swords, armour and planks at 2x. The selected recipe card still shows it large.

## Skill by skill

Sources are linked once per skill; several were found through web search and read in summary only (the Forest Service
ax manual's host could not be fetched from the build machine).

### Woodcutting
- **Real:** feet apart, side-on to the tree about an axe's length away; one hand fixed just above the swell at the end
  of the handle, the other sliding from near the head on the backswing down to it on the downswing ("switching hands
  instead of developing a proper back swing is not considered acceptable"); the cut goes in at about 45 degrees into
  a notch at knee to waist height; placement and control over power. [USDA Forest Service, *An Ax to Grind* (1999)](https://www.fs.usda.gov/t-d/pubs/htmlpubs/htm99232823/page04.htm);
  [*One Moving Part: The Forest Service Ax Manual* (2020)](https://fs.usda.gov/t-d/pubs/pdfpubs/pdf18232812P/1823-2812P_AxManual_508_10-21-20c_150dpi.pdf).
- **Was:** front-facing hero, an axe icon at 2.5x circling beside the shoulder, a fixed 12% from the left.
- **Now:** left hand on the knob, right hand from under the head (backswing over the right shoulder) sliding down; the
  axe comes through on a 45 degree line and the bit lands in the trunk at about 50 cm, read from the tree's own
  pixels; it stays in the cut a moment, is worked free, back to ready. Thunk and chips on the impact frame (0.4).

### Mining
- **Real:** the pick is swung at the face in front of you, a short controlled swing that drives the point into a seam
  at chest height, then levered out; the hardest veins were cut with a single-pointed pick held as a chisel and struck
  with a hammer. [Canadian Museum of History, Frobisher mining](https://historymuseum.ca/cmc/exhibitions/hist/frobisher/frsub11e.html); [Pickaxe](https://en.wikipedia.org/wiki/Pickaxe).
- **Was:** the pick icon rotating near the head, aimed at nothing.
- **Now:** over the shoulder and down into the rock face at chest height (never overhead at the sky), the point
  entering the face at about 45 degrees down, hands together at the strike, levered out. Sparks and the ring on 0.4.

### Fishing
- **Real:** a reel-less rod or cane pole with a float; the float is the bite indicator; a short cast, then wait with
  the rod tip up and the line under control; when the float dips, lift the rod to set the hook and swing the fish in.
  [Minnesota DNR, cane pole fishing](https://dnr.state.mn.us/gofishing/cane-pole.html); [Fishing float](https://en.wikipedia.org/wiki/Fishing_float).
- **Was:** a rod icon rocking above the hero, a generic ripple, one sound when the catch finished.
- **Now:** one cycle per catch: back-cast, forward cast, the float lands (plop and ripple, 0.24), the wait with the rod
  low and the float bobbing (the brow-wipe window), the float dips, the strike lifts the rod (splash, 0.8), the fish
  is swung in. A 2.4 m rod in both hands, the hero on the jetty planks.

### Thieving (pickpocketing)
- **Real:** misdirection: close in at the mark's side in a crowd or with a bump or a question, the hand dips slowly
  into the purse or pocket, lifts, and withdraws while attention is elsewhere. [Pickpocketing](https://en.wikipedia.org/wiki/Pickpocketing); [How pickpockets work](https://people.howstuffworks.com/pickpocket.htm).
- **Was:** the hero bobbing at 12% with a glove icon reaching into the air.
- **Now:** the hero sidles up shoulder to shoulder, the right hand slips into the mark's belt purse (placed from the
  mark's own outline at belt height), lifts (the coin chink, 0.6, replacing the end-of-task chime), and tucks the take
  into their own belt.

### Smithing (forging)
- **Real:** the anvil face at the standing smith's knuckle height; tongs in the off hand hold the hot work flat on the
  face, the hammer in the dominant hand strikes square from the elbow and shoulder, bouncing between blows; the work
  is turned, and goes back in the fire when it cools to a dull red. [Anvil height discussion, iForgeIron](https://www.iforgeiron.com/topic/10882-proper-anvil-height/); [The proper working height of an anvil](https://www.instructables.com/Anvil-Stand-Pt-2-Proper-Working-Height).
- **Was:** a 16 px anvil icon at 4x beside the 3x hero, a hammer icon rotating, the piece floating above the anvil.
- **Now:** an anvil on its stump drawn at the hero's 3x with its face at the knuckles (in the owned anvil's metal), the
  piece on the face, tongs in the left hand holding it, the owned hammer in the right rising from the elbow and
  falling square on it, bouncing up; the piece is turned between blows; sparks and the ring on 0.4; the piece glows
  hot at the start of each action and cools through it. The district's own painted anvil is gone (one anvil only).

### Smithing (smelting)
- **Real:** a clay shaft furnace charged with charcoal and ore from the top, blown through a tuyere at its foot by hand
  bellows, often pumped while charging. [Bloomery](https://en.wikipedia.org/wiki/Bloomery); [Direct iron smelting in Scandinavia](https://donwagner.dk/arch-iron/eu/scandinavia-eu.html).
- **Was:** the anvil scene above, for bars too.
- **Now:** a clay furnace with its mouth glowing, a bellows at its foot on a pole; both hands bear down, the bag
  breathes out (bellows sound, 0.4) and the flame at the mouth flares. The bars wait on a stone beside it.

### Carpentry
- **Real:** the board across a pair of trestles; hold it down beside the line; the saw at about 45 degrees for a
  crosscut, 60 for a rip; the arm works like a piston in line with the blade; a rip saw cuts on the push and returns
  light. [Fine Homebuilding, cutting with a handsaw](https://www.finehomebuilding.com/project-guides/framing/cutting-with-a-handsaw); [Woodwork for Beginners, ch. III](https://chestofbooks.com/home-improvement/woodworking/Ira-S-Griffith/Woodwork-For-Beginners/Chapter-III-Saws-Their-Uses-11-Hand-Or-Crosscut-Saw-And.html).
- **Was:** a generic tool icon swinging like an axe; the wood thunk once per swing.
- **Now:** trestles at the hero's belt with the board on them, the left hand pinning it, the right sawing at 42
  degrees: a push stroke (rasp and sawdust, 0.12) and a lighter pull (0.6) per beat.

### Cooking
- **Real:** hearth cooking over embers on a trivet or from a pot hung on a crane or tripod, with long-handled ladles
  and spoons "designed to cook the food without cooking the cook". [NPS Fort Scott, open-hearth cooking](https://www.nps.gov/fosc/forteachers/cookhearth.htm); [Reconstructing a long-handled Norse fry pan](https://cockatrice.lochac.sca.org/?p=373).
- **Was:** a cooking icon wobbling in mid air.
- **Now:** a pot hung from an iron tripod over a small fire, stirred in a slow loop with a long wooden spoon held in the
  right hand at arm's length, the left hand back. The dish waits on a warming stone at 1x. No stir sound (as before).

### Crafting (leatherwork)
- **Real:** holes opened with an awl or chisel, the work held upright in a stitching pony or clam between the knees so
  both hands are free; two needles pass through each hole from opposite sides and both are pulled out and tight
  after every stitch (the saddle stitch). [Saddle stitch](https://en.wikipedia.org/wiki/Saddle_stitch); [Make: hand-stitching leather](https://makezine.com/article/craft/yarncraft/handstitch-leather/).
- **Was:** a crafting icon turning beside a standing hero.
- **Now:** seated on a stool, the piece in a clam between the knees; the hands meet at the work, then draw the thread
  out to both sides and tight (stitch sound as the thread goes taut, 0.45).

### Magic: runes
- **Real:** runestones were cut with a chisel held in one hand and struck with a hammer or mallet, after the outline
  was drawn; each carver's marks differ like handwriting. [Uppsala University, research on runes](https://uu.se/en/support/research-on-runes); [Kuml: With chisel or pick hammer?](https://tidsskrift.dk/kuml/article/view/97498).
- **Was:** the generic recipe scene with a hammer icon.
- **Now:** a stone tablet on a block; chisel upright in the left hand, a mallet in the right tapping it (chisel tink and
  chips, 0.4).

### Enchanting
- **Real:** hand engraving: the graver pushed by the heel of the hand and the forearm, the free hand turning the work in
  an engraver's ball or block. [Ganoksin, engraving methods](https://www.ganoksin.com/article/engraving-methods-and-techniques/); [Engraver's ball vice](https://horopedia.org/engravers-ball-vice/).
- **Now:** the piece on the block under the left hand, short push strokes of the graver (scratch and glint, 0.45).
  (Inscribing is reached from the Enchanting page; the scene is used when an enchanting recipe runs.)

### Herbalism
- **Real:** leaves are bruised with a press of the pestle, then ground round; the other hand steadies the mortar.
  [Cook's Illustrated, using a mortar and pestle](https://www.cooksillustrated.com/how_tos/5626-how-to-use-a-mortar-and-pestle); [Farmers' Almanac](https://farmersalmanac.com/back-to-the-old-grind-using-a-mortar-and-pestle-22866).
- **Was:** the generic recipe scene.
- **Now:** the mortar on a table at belt height, held by its rim; the pestle presses (grind sound, 0.3) then circles.

### Exploration (surveys)
- **Real:** plane-table survey: the table levelled over a station with the sheet pinned on it, the alidade sighted on
  a landmark, the ray ruled along its edge and the distance noted, plotting in the field. [Plane table](https://en.wikipedia.org/wiki/Plane_table); [Alberta Land Surveyors, the plane table and alidade](https://albertalandsurveyhistory.ca/evolution-of-land-survey-technology/10-the-survey-instrument-captain-cook-wanted-to-learn-the-plane-table-and-alidade/).
- **Now:** a plane table on its tripod; the hero bends to sight along the alidade, then rules and notes the ray in
  pencil (0.6). Slow work: one sight and note about every 3 seconds.

### Magic: alchemy
- **Real:** none (it is magic). Kept consistent with the staff fighter: the staff planted in the right hand, the item
  held out on the left palm, the light gathering, the flash and the cast sound as it turns to coin (0.82, replacing the
  end-of-task chime).

### Hunting
- **Real:** reading sign crouched on the trail, kneeling to set a snare (a stake driven so the line runs plumb, the
  trigger set last and not handled after), then dispatching the quarry; bow hunting follows the archer's sequence
  below. [Wilderness College, survival snares](https://wildernesscollege.com/survival-snares.html); [Outdoor Life, spring-pole snare](https://www.outdoorlife.com/blogs/survivalist/survival-video-how-set-baited-spring-pole-snare-trap).
- **Was:** the standing hero stepping in 16 px at the strike.
- **Now:** crouched reading prints (track), kneeling with both hands at the trap (set), up with a hunting spear in both
  hands for the strike, which stops short of the animal: whether it lands is shown only after the roll (swish, 0.88).

### Beastmastery (capture)
- **Real:** the same tracking and trap setting; the live catch is coaxed with bait held still and low.
- **Now:** crouched on the track, kneeling to set the live trap, then holding bait out low on the flat of the left
  hand. No sound.

### Fieldwork (trap lines)
- **Real:** kneel at the set, drive the stake with a mallet (forked stake for the snare line), tie off.
- **Now:** kneeling, the stake in the left hand driven by a wooden mallet in the right (a dull thock and dust, 0.4).

### Sailing
- **Real:** sail is raised by hauling the halyard hand over hand; sweating (hauling sideways) for the last tension.
  [Halyard](https://en.wikipedia.org/wiki/Halyard); [Sailing World, master the mast](https://sailingworld.com/how-to/master-the-mast).
- **Now:** on the quay, hauling the halyard hand over hand up to the masthead of your boat. No sound.

### Melee practice (training yard)
- **Real:** recruits struck at a man-high post (the pell) with sword and shield, aiming at head, flanks and legs;
  Vegetius also taught the point over the edge. [ARMA, pell training history](https://www.thearma.org/essays/pell/pellhistory.htm); [Vegetius, *De Re Militari*](https://archive.org/stream/pdfy-sOkC3FmoLlr4C6zz/The+Military+Institutions+Of+The+Romans+%5BDe+Re+Militari%5D_djvu.txt).
- **Was:** the drill's item icon as the target.
- **Now:** a pell drawn for the drill (straw dummy, oak post, iron-bound, runed) at a man's height; the equipped weapon
  (sword, dagger, hammer or cutlass, in its metal) in the right hand, the shield on the left arm if worn; from guard
  over the right shoulder down into the post's flank, placed from the pell's own outline (wood thock, 0.4).

### Ranged practice (archery range)
- **Real:** stance side-on to the target, nock, draw to an anchor point on the face, hold, release with relaxed
  fingers, follow through with the bow arm still toward the target and the drawing hand moving back past the ear.
  [Mississippi State Extension, the archery shot process](https://extension.msstate.edu/sites/default/files/document/2025-12/P3249_web.pdf); [Human Kinetics, shot sequence](https://us.humankinetics.com/blogs/excerpt/a-well-defined-shot-sequence-increases-the-probability-of-a-consistent-outcome).
- **Now:** a hay-bale butt with its painted face; the bow (the equipped bow's wood, short or long) raised in the left
  hand, the string drawn to the cheek, anchored, loosed (bow sound, 0.62), the drawing hand following back, the arrow
  flying to the butt (thock, 0.74).

### Not changed here
- **Farming** has no work scene (plots and their crops); **Scholarship** is project cards. Neither runs as an activity
  (`DQ.act`): crops grow on their own timers and research advances on its own, so there is no strike, no yield event
  and nothing for a working hero to do on screen. Giving them a scene is a design question (what the hero is shown
  doing while a plot grows), not a small fix, and is left for the owner.
- The Runes tab's scene was squeezed to a thin strip under a tall caption on desktop (the hero's head cut off). Since
  28 Nov it is as tall as every other work scene and the caption scrolls inside instead (css/hearthside.css). On
  windows under 800 px tall it is still hidden in favour of the requirements, as before.

## Work scenes that live (owner, 28 Nov 2026)

Three approved polish items, in `js/work_scenes.js`. Three small canvases lie exactly over the backdrop, in its own
240 x 100 pixels: the marks and the small life under the hero, the hour's wash and the weather over them.

**Work leaves a mark.** Each visible strike (strike_sync.js, on the frame the tool lands) changes the scene a little;
each real yield (the engine's `workcycle` with a quantity, never a miss) adds to a capped pile. Starting a different
activity clears it; the same one carries on.

| Workplace | Each strike | Each yield (cap) |
| --- | --- | --- |
| Woodcutting | the notch deepens (to 4 px), chips settle at the foot | a log on the stack beside the tree (10) |
| Mining | pits in the rock face, grit on the ground | an ore lump on the heap at its foot, in the ore's colour (12) |
| Fishing | the splash wets the jetty planks | a fish in the wicker basket behind you (8) |
| Thieving | (the lift is the glint) | a purse or coin stashed by the barrel (8) |
| Smithing: forge | hammer scale round the anvil | the piece laid on the stone rack, glowing orange, cooling to its metal in 7 s (6) |
| Smithing: smelting | charcoal and slag at the furnace foot | an ingot on the stack, cooling the same way (9) |
| Carpentry | the push stroke heaps sawdust under the cut, shavings | a plank on the stack (8) |
| Cooking | (stirring has no strike; the steam thickens as dishes come) | a bowl on the board; a burnt dish is a black lump (6) |
| Crafting | thread ends and leather scraps | the finished piece on the pile (6) |
| Runes | stone chips | a rune stone with its glyph (9) |
| Enchanting | bright filings | the piece on its cloth, a sparkle (6) |
| Herbalism | green flecks on the table | a bottle in the rows by the table (10) |
| Exploration | | a rolled chart tied with red (6) |
| Alchemy | | coins at your feet (12) |
| Hunting | footprints along the trail | a bundle of skins and feathers (6) |
| Beastmastery capture | bait crumbs on each try | a tally cut in the post for each one kept (15) |
| Fieldwork | dust where the stake goes in | a stake and its twine in the line (6) |
| Sailing | | a crate on the quay (6) |
| Melee practice | cuts in the post, straw (or splinters, iron flakes, rune sparks) | |
| Ranged practice | the arrow stays in the butt (8) | |

**Small life**, occasional and subtle: a squirrel along the fence rail and birds (woodcutting); a drip from the mine's
lintel and dust in the lamp light (mining); a fish leaping and a dragonfly by day (fishing); gulls and a leaping fish
(sailing); a pigeon on the cobbles (thieving); a rabbit in the meadow, butterflies by day and fireflies at night
(hunting, capture, fieldwork); the forge's ash door glowing with embers slipping up (smithing); embers and smoke off the
furnace (smelting); steam, bubbles at the pot's rim and a cat asleep by the door (cooking); a sparrow pecking sawdust
and dust in the light (carpentry); a mouse along the skirting (crafting); motes over the magic circle (runes,
enchanting, alchemy); a candle with a moth after dark and a bee by day (herbalism); a butterfly and birds
(exploration); a crow on the yard floor (practice).

**Weather and the hour.** Outdoor workplaces (the districts for woodcutting, mining, fishing, sailing, thieving and the
trap lines) take the current town's `DQ.townWeather` (rain streaks with rings in the puddles, snow that settles in
flecks over the ground, filling in over a minute and a half, and melts when it stops, sea mist, cloud), its light from `DQ.townLight(DQ.townHour())` (a gentler
wash than the town scene's, so the work stays readable; stars over the skyline; a lantern on a post, the mine lamp or a
wall bracket that lights at dusk) and the season (autumn leaves and spring blossom drifting down; winter's snow comes
with the town's weather).
Workshops (every other workplace: a building front filling the frame) show the weather and the hour only in their
window glass: sky blue by day, rose at dusk, dark with a star at night, rain, snow or mist on the panes. Settings →
Display → Town life → Weather off clears it here too. On a 1440 x 900 screen the workshop windows sit above the crop;
they show on taller scenes.

**Calm and reduced motion**: no creature, drop or particle shows or moves; the marks (still pictures; the forge's
pieces already cool) and the hour's wash and lantern stay. Nothing is saved, and a forecast or simulated time away adds
no strike, yield or pile. `tests/work-scenes.cjs`.

## What the checks can and cannot tell you

`tests/skill-realism.cjs` checks tool lengths against real ranges, the anvil and trestle heights against the figure's
joints, one ground line for the hero, tree, rock, mark, anvil and trestles, that the hero is placed by the trunk's own
edge, that every work sound (axe, pick, anvil, both saw strokes, plop and splash) plays on its own frame, and that
calm and reduced motion hold the ready pose with nothing moving. Screenshots were taken at 1440 x 900 and 390 x 844 in
both themes. None of this is a playtest: whether a 1.1 s chop reads as heavy, or the cast reads at a glance on a
phone, needs a person watching.
