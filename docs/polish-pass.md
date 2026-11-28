# Polish pass

You are adding the small, finished details that make a game feel hand-made and high-quality: things that answer the player, a world that lives while nobody touches it, and sound that sits under it all. The game's rules stay exactly as they are. Everything you add is **cosmetic**: it reads the game and never changes it.

Work through the steps in order. The reference after them is what every detail you build must obey.

## Steps

### 1. Survey the game

Play it, or read through its main loop, and write down two lists:

- **Moments.** Every verb and event the player meets: buying, selling, crafting, levelling up, opening a message, failing, a day or turn ending, a new area, an upgrade, a rare find. Note how each is answered today (often: a number changes).
- **Rests.** Every screen where the player looks without acting: menus, maps, waiting for a turn, reading.

Done when both lists cover every screen and every action the player can take.

### 2. Propose stages, and ask

From the lists, propose details in 6–10 **stages**, each a theme with a few related ideas (for example: the world at rest, characters, the core transaction, crafting, inventory, the passing of time, messages and the map, progress made visible, things to poke, sound). Order them by feel gained per hour of work. Each idea names the moment it answers.

Then ask the user, with the interactive question tool:
- whether any of it should affect gameplay (default: cosmetic only)
- whether particles are allowed (default: inside the game world's pictures only, never on the interface)
- how to deliver: merge each stage as it is done, or one branch at the end
- whether to pause for their test after each stage

Done when the user has chosen the stages and answered these.

### 3. Build each stage

For each stage, in this order:

1. **Timings first.** Write one small table of the stage's timings in seconds (when the drawer opens, when the coin lands, when the sound plays). The picture and the sound both read from it, so they stay together.
2. **Decisions in pure functions.** Anything that decides what is shown or heard is a pure function with unit tests: what a character may wear, where the pet is at a given time, how loud the rain is at this hour, which notes the music plays. Keep the drawing and audio plumbing thin.
3. **Draw and wire.** Hook it to the moment it answers, after the game has already changed.
4. **Check it** (step 4).
5. **Record the rule.** Add a line or two to the project's agent instructions saying how this kind of detail works, so later work keeps it.
6. **Deliver.** Commit with a plain message, merge if that was agreed, and give the user a short checklist: what to do and what they should see and hear.

Done for a stage when its checks pass, its screenshots have been looked at, its rules are recorded, and the checklist is written.

### 4. Check like a sceptic

For every detail, prove these with automated checks where the platform allows, and by looking at real screenshots:

- **It answers.** The effect starts when it should and finishes cleanly.
- **The game is untouched.** The full game state and its random number generator are identical before and after the effect plays.
- **Nothing waits.** The action takes effect at once; a second click mid-effect works; a click or key finishes the effect.
- **Reduced Motion.** With it on, the end state stands complete and nothing moves.
- **Every screen.** It fits and stays sharp at common sizes and densities, from phone to ultrawide, including high-density (Retina) displays.
- **Smooth.** It runs at the display's rate up to 120 frames a second. Measure the time a frame costs before and after the stage.
- **Sound.** It plays in time with the picture. Where nobody can listen, measure the output level: audible, and peaks below −1 dBFS.

Report what was checked and where. Keep checks run in your environment separate from checks that need the user's own devices, and say plainly what remains unverified: by ear, by feel, on real hardware.

## Reference

### Staged, never delayed
The game changes the instant the player acts; the picture then catches up. A sale is recorded on the click, and only then does the drawer open and the coins land. Buttons are never held back for an animation, and every effect can be hurried by a click. Facts revealed by an effect may appear as it reveals them; the controls never wait.

### Every action answered
Each moment gets a picture and a sound that belong to it, timed from one table. **Weight** scales with significance: a bigger sale gives more coins and a deeper clunk, a rarer find a longer chime and more light. Most answers last about a quarter of a second to a second and a half; the big ones (a new season, a new chapter) get a short title moment that takes no clicks.

### Things show where they go
Objects keep their identity on screen. Something that moves between lists glides there; something bought travels to where it is stored; a value that changes turns over or counts up from its old figure. Give each such thing a stable key and animate from its old place to its new one when the screen rebuilds.

### Alive at rest
Screens the player only looks at still move gently: breathing and blinking, weather, passers-by, light that follows the time of day, a pet with its own routine. All of it is cheap, measured in seconds, and paused when the window is hidden.

### Honest pictures
Cosmetic detail never reveals what the player has not learned. If an outcome is hidden until a report is read, characters look neutral until then; a map shows what has been reported, not what is true. Decide these looks in pure, unit-tested functions that read only the player's knowledge.

### Cosmetic stays cosmetic
Effects use their own randomness: a hash of a seed and the time, or the platform's random for texture. They never read or advance the game's random number generator, and never change prices, outcomes or saves. A check that the full state is unchanged after each effect enforces this.

### The world remembers
Progress becomes visible in the world itself: upgrades take their place in the scene, kept items stand on a shelf and open their record when clicked, friends appear on a board, a plant grows with the chapters, small comforts gather over the years. Give every placed thing its own spot in one layout table, and unit-test that no two overlap.

### Things to poke
A few objects answer a click and do nothing else: a pet that purrs, a lamp to turn up, a bell to ring, a clock to wind. Each one is reachable by keyboard as well as pointer, with a name for screen readers, and placed where every framing of the screen shows it.

### Respect the player
Reduced Motion turns movement off and leaves complete still pictures. Sound has separate switches and volumes for effects, ambience and music; ambience and music fade while the window is hidden, and the music drops while the player reads. Keyboard focus survives every rebuild. The interface itself stays calm: motion is ease-out, about a quarter of a second, with no bounce.

### Every screen, every frame
Animation is measured in seconds and follows the display's refresh rate up to 120 frames a second. Draw static layers once and cache them; redraw only what moves; when lighting changes, relight cached layers rather than repainting them; pre-render glows and gradients once. Pictures keep their proportions on every screen: fill the height and crop the sides, never stretch. Interactive spots sit in the part of the picture every framing shows. Optional panel parts fold away in short windows instead of squashing.

### Sound
Route everything through a small mixer with three buses: effects, ambience and music. The ambience follows the scene (time of day, weather, season, what the player has built). The music follows the mood (season, time of day, tension), composed or arranged to rest between phrases. Effects are timed against the same tables as the pictures. Nothing sounds before the player's first input, as browsers require, or in automated tests. Measure real levels where you cannot listen.

## In Idlewick (owner, 28 Nov 2026)

The owner's answers to step 2: build all eight stages in order; everything is cosmetic (it reads the game and never
changes it, and "none of this should change the new menu or style, simply the immersive feeling players get");
particles only inside the game's pictures (work scenes, the fight stage, the hearth, town scenes, item art), never on
interface chrome; each stage is merged and published on its own, by the owner. AGENTS.md section 2 (Motion) holds the
rules each stage adds; docs/rules-history.md has the decision.

- Stage 1, bigger moments feel bigger ("Every action answered", weight scales with significance): `js/weight_rules.js`
  (the timings table in seconds and the decisions as pure functions), `js/weight.js` (drawing and wiring), the weighted
  sounds in `js/audio.js` (`weighted()`), `tests/polish-weight.cjs`. Milestone levels (10, 25, 50, 75, 90, 99) get a
  short title moment and a deeper chord, ordinary levels a chime pitched by tier; finds glint, light the scene and
  (rarest, the first find of each item only) title by their `D.RARITY` band; sales drop more coins with a deeper clunk as the sum grows; crits and
  killing blows stagger further, sound heavier and hit-stop the stage sprites for under 80 ms.
