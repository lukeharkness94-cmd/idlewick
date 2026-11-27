# Idlewick working instructions

These are the rules in force. Each one is the owner's latest decision; where an older rule said otherwise it has been
removed. The reasons, owner quotes and the rules they replaced are in `docs/rules-history.md` (history, not
instructions). Product decisions and architecture are in HANDOFF.md; read it before changing the game. When the owner
gives a new instruction that changes a rule here, edit the rule in place (don't append a "supersedes" note) and add one
dated line to the history file.

## 1. How to work

- **GitHub `main` is the only source of truth** (https://github.com/lukeharkness94-cmd/idlewick). Start every session from
  `git pull origin main`, never from a zip, export, sandbox copy or old folder. Work on a short-lived branch
  (`claude/…`, `codex/…`, `chatgpt/…`), push it before the session ends, and merge to `main` only with passing tests.
  Do not recreate the old `work` branch. Work that exists only in a sandbox or chat does not count; if you cannot push,
  say so plainly and hand over a patch or branch name.
- **The source is `index.html`, `js/` and `css/`.** `Play Idlewick.html` is generated: rebuild it with
  `python3 scripts/package-game.py` after changes (Windows: `py`). Preview with `python3 scripts/preview.py` (`--host
  0.0.0.0` only when a cloud preview needs it).
- **Tests before merging: the whole suite, not only your area.** `node scripts/run-tests.cjs` rebuilds the game, starts
  its own preview server on a free port, runs every file in `tests/` several at a time (half the CPU cores, 2 to 4;
  `--jobs N` to change) and prints a summary;
  `node scripts/run-tests.cjs ui- shop` runs only matching files. Two runs on one machine no longer collide.
  Failures are rerun once by themselves; a test that only passes alone is reported as **flaky**: say so when you
  report results, and fix its timing when you next touch that area rather than ignoring it. Browser
  tests read `IDLEWICK_URL` and `SHOT_DIR`, use Playwright's bundled Chromium unless `CHROMIUM_PATH` is set, and never
  hard-code a machine's browser path, port or folder. A failing test written for an older rule is updated to the
  current rule in the same change, with the reason in the commit.
- **Evidence for balance changes:** combat `node scripts/sim-bosses.cjs` (COUNTER=1, COMPARE=1, PARITY=1, TOWERS=1,
  NO_PERKS=1; see docs/combat-balance.md) and `node scripts/sim-uniques.cjs`; economy `node scripts/sim-economy.cjs 24`
  (`--no-economy` to compare; docs/economy-evidence.md); first hour `SEED=7 node scripts/play-first-hour.cjs`; long runs
  `RESTORE=1 MIN=300 KITS=<kit> node scripts/review-opening.cjs`. Simulations and browser checks are evidence, not human
  playtests (docs/playtest-plan.md); say which you ran and what they can't tell you.
- **Visual changes are delivered with screenshots** of the rebuilt game that you have looked at yourself, naming any
  test fixture (granted levels, coins, items). Check desktop and phone widths and both themes.
- **Integration gate** (owner, 16 Nov): before replacing or rebuilding a system, audit its connections (saves and earned
  progress, unlock reachability, ingredient and source routes, quests, inventory/bank conservation, shop transactions,
  companions, offline work, UI journeys), validate in isolated test saves, keep working behaviour while candidates are
  under test, and report unresolved failures and limits.
- **Fresh-start design** (owner, 16 Nov): judge progression from a new character first; testers will restart. Keep
  compatible saves where practical, never silently erase a hero, make any reset explicit.
- **Never commit** personal saves, credentials, test sessions, screenshots or machine-specific configuration (agent
  worktrees under `.claude/worktrees/` are ignored).
- **Release target:** Steam on Windows x64 and macOS (Intel and Apple Silicon) with shared Cloud saves. Keep the desktop
  storage bridge and the save schema and file names; browser storage is a preview fallback. Read desktop/STEAM.md
  before touching persistence or packaging. Never claim Steam Cloud is active or native builds are validated without
  the real App ID and platform tests.
- Ask the owner only at real decision points (a design choice, a consequential balance change); give options with a
  recommendation. Otherwise act, then report. Obvious fixes you notice along the way (a generic icon where the real
  sprite belongs, a mislabelled button, a clipped label) are made in the same change, not offered as follow-ups
  (owner, 27 Nov).

## 2. Look and art

- **Original pixel art drawn in code, nothing else.** `js/pixelart.js` (system, palette, hero), `js/pixel_items.js`,
  `js/pixel_creatures.js`, `js/pixel_world.js` (trees, rocks, scenes, restoration, furniture, icons), `js/pixel_runtime.js`
  (routes every art hook; loaded last). Follow docs/pixel-art-style.md: top-left light, five-step hue-shifted ramps,
  selective coloured outlines. No image files, AI-generated, traced or recoloured art, or sprite packs. Settings → Art
  showcase is the living reference.
- **Chunky pixels at whole-number scales.** `SMOOTH = false` (pixelart.js) and `HIRES_ON = false` (hires.js) stay off.
  Show every sprite and scene at a whole-number multiple of the size it was drawn; crop rather than shrink or stretch.
  The one exception is the Village page's town scene, which fits its panel (about 1.5–1.9×) so every building stays
  clickable. Layout uses logical sizes (`logicalOf`). Sprite frames may step; motion stays continuous.
- **Every item and resource looks different**: no shared tool sprites, fish recolours, identical tree silhouettes or
  metal art on leather gear. `node tests/art-pixel.cjs` enforces it.
- **Sizes follow real things** on gathering cards (`js/card_scale.js`, 96px art box): trees 2×, shrubs (hazel, elder) 1×,
  flax a low clump; fish 2×/3×/4× by length; ore and thieving marks 2×. Activity backdrops have no bystanders.
- **Towns to one scale** (`js/towns.js`): each town scene is 640 × 360 with townsfolk ~10px, homes two to three times
  that, restoration pieces 32px among them and landmarks at 2×. Things you own appear in the scene (boats at Saltmere,
  traps, crops); add them through `extras` and the scene cache key in pixel_runtime.js. Townsfolk walk the two roads on
  Home and Village (`js/town_walkers.js`; more as the town is restored; off under Reduce effects).
- **Activity backdrops**: each activity shows a close-up district (`districtFor`, 240 × 100) at 3× with the 3× hero
  (72 × 96) and target on one ground line; the 17 skill workplaces are in skill_backdrops.js. Any new activity kind or
  recipe skill needs a district. The page backdrop (`js/backdrop.js`) is Starlit hills or Twilight forest; combat shows
  the area's own scene (two per region, keyed like `saltmere:1`); a new area needs a recipe there.
- **Hearthside Journal** (owner, 18 Nov) is the whole game's look: light parchment and Hearthside lettering by default
  (local Cinzel + Alegreya Sans), dark theme available; `css/hearthside.css` is the shared presentation layer (extend it,
  don't add per-page skins). Lettering presets (Storybook, Adventurer, Pixel, Original) stay in Settings; use the
  `--f-display/--f-body/--f-ui/--f-mono` variables, never a hard-coded family. Silkscreen only for big numbers and short
  headlines. Type: 16.5px body, 16px buttons, 14px meta; nothing visible under 13px in the design.
- **Shape rule** (owner, 26 Nov, chose 8px): anything you can click is one shape, an 8px rounded rectangle (`--r-act`)
  with a 2px outline (`--act-line`); states change only its colour. Anything you can't click has no outline: panels are
  12px soft fills, labels/chips/badges/counts are flat 4px tinted fills. Circles only for round things you don't click
  (pips, dots). `css/shape.css` (linked last, one `@layer shape`) applies it by role; rail rows draw the outline inset so
  the 180px rail keeps its width. Exceptions: hotspots on pixel scenes (Village sites, tower rooms, the SVG map).
  `tests/shape-rule.cjs`.
- **Motion** (`js/finish.js`, Finish layer in css/style.css): browser timelines at native refresh, elapsed-time motion,
  no stepped easing or 60 Hz loops; hover lifts use `translate`, not `transform`; everything transform/opacity only and
  off under `html.calm` and `prefers-reduced-motion`.
- **Music and sound are synthesised** (`js/audio.js`, no audio files): one theme per region plus title, combat and boss
  (`D.MUSIC`), played lo-fi (`D.MUSIC_LOFI`); ambience per town with ruined/mending/restored tiers (`D.AMBIENCE`). A new
  region needs a theme row and ambience. Work sounds land on each visible strike (`js/strike_sync.js`). Quest and boss
  chimes play even when their card is skipped.

## 3. Screen layout

- **Design size 1920 × 1080.** On desktop (> 860px) `js/scale.js` zooms by innerWidth / 1920 (capped at innerHeight /
  1080 when above 1; `html.lw-wide` over 2300 page px), times Settings → Interface size, never below 85%; laptops adapt
  with `html.lw-1600` / `html.lw-1300` / `html.short` instead of smaller text. Use `--vh`/`--vh100`/`--vw100`, never raw
  vh/vw, and `DQ.toPage()` for screen-to-page coordinates. Phones (≤ 860px) stay responsive at 100%.
- **Shell**: the top bar holds the page menu (Home, Quests, World, Village, Hero, Guide, Shop; `js/shell.js`) with dots
  for "something to do here". The 180px left rail holds the Now card (current task, Stop/Retreat, "then …" for the
  queue), a Combat group (overall level, then Melee, Ranged, Magic, Defence, Health) and every other skill. Rail rows
  share the window height (`UI.fitDock`, 34–64 page px) and show icon, name, level or lock and one bar; rail order is
  stable (fresh-hero activities first). Never shrink text or icons to fit. Phones keep the bottom bar.
- **Nothing you act on scrolls away.** Desktop pages lock to the window: activity pages scroll only their list of
  choices; Quests is a scrolling list beside the selected quest; Scholarship, Exploration, Shop, Map and Skill levels
  scroll only their long list. Only useful-but-not-actionable information may sit behind a click. Page tabs, "Back to …"
  and pinned quests share one `#pagebar` row. `tests/ui-fit.cjs` checks it at 1280 × 720.
- **No dropdowns or collapsed disclosures anywhere** (no `<select>`, no `<details>`): visible wrapping buttons, tabs and
  illustrated cards. Keep the illustrated task cards and big action target; keep the tree and logs, ore rocks, crafting
  output and the actual enemy visible.
- **Choice cards** stack picture, name, one short caption and state, centred. On every activity page, choices you can use
  come before locked ones (`UI.taskPanel`). Locked cards show the blacked-out picture, ??? and what to do in a few words
  ("Lv 26 · Reach Saltmere", "Find Feather", "Make the Willowbrook field chart"; never "Requirements not met"); the full
  wording lives in the tooltip and the selected detail.
- **Catalogue sizes**: comparable catalogues use fixed footprints (min width 260 design px), packed as many whole cards
  per row as fit, never stretched or with shrunk/wrapped/clipped labels: production cards 180px high, simple shop stock
  170px, tool upgrades 210px, workshop ranks 180px; the field guide uses one compact 86px index grid. Sparse panels stop
  after their contents. docs/menu-spacing-audit.md.
- **Shop**: Skill upgrades, Equipment and Supplies are the main category row above quieter shelf actions; navigation and
  the detail/purchase footer keep their positions as contents change. Every tool tier and workshop rank stays on the
  shelf; the "Available only" switch is per shelf family (`UI.availOnly`, saved in `settings.availOnly`), on by default
  until the hero owns something from that family, and when on shows only what the hero can afford and make now, with a
  line counting what is hidden. Purchases fly to the backpack; double clicks are guarded (`js/usability.js`).
- **Tooltips are passive**: never clickable; source/use icons inside them have no handlers or tab stops; Escape
  dismisses and touch-hold works. Requirements are plain named counts (`held / required`) with a real button for the
  source route (needs.js, item_navigation.js).
- **Pop-ups** open at their top (`DQ.modal` focuses with `preventScroll`). Notes rise from the bottom: one on screen, at
  most three per burst, each gone after `DQ.NOTE_TTL`, none over the Combat page in a fight (`tests/live-notes.cjs`).
- **Combat page** (`js/combat_simple.js`, `js/combat_window.js` `shape()`): left column **Your fighter**: Equipped (the
  paper doll from Hero, `UI.equipmentDoll`; slot clicks open that slot's owned alternatives), Fighting style (weapon,
  style buttons, Health, Combat level with Breakdown), Abilities (headed by the technique, shot or spell in use, or on
  the heading line on short windows). The stage is the **Where to fight** window out of combat (areas with their combat
  range, creature portraits that open the field entry, odds, Track and Explore) or the fight itself; tracking a creature
  takes `DQ.TRACK_MS` (4 s) with no attacks and the VS bar shows tracking progress. Below: **This fight** (the foe card:
  level, health, speed, max hit, "You deal <type>", weaknesses ticked, drops found; or challenges and the next boss out
  of a fight) beside **Food** ("+N HP each", auto-eat). Level tags are flat labels. Phones stack Where to fight, Your
  fighter, then This fight and Food. Same-page refreshes keep the arena and training DOM (`UI.updateEncounter`) and
  never shake the page; hit numbers wait for the visible impact (`UI.afterImpact`).
- **Home**: the live journey, selected goal, real giver and objective progress (`js/hearthside.js`), one clear main
  action, the town scene with walking townsfolk, "Nearly there" once every skill is open, and the Before <boss>
  checklist when it applies. **Village**: town scene with always-visible site signs: Finish (green, site glows), Give
  (blue, the item you can hand in), Needs (faint dashed, missing item greyed, a lock if never found); standing appears
  once in the map header.
- **Settings** are composed by `js/settings_layout.js` into five groups (Display, Audio, Gameplay, Saves & backups,
  Help & extras); add new controls to a group, reuse existing option keys.

## 4. Words

- **Voice**: keep the fantasy names (Mithril, Saltbitten Cutlass, the Ember Wyrm, the Hollow King) but write plain, grounded and
  comic: specific everyday detail, dry jokes, no epic register; let the heartfelt line land straight. Quest requests
  sound like a person speaking, with a clear referent and a truthful task, rendered once through `questVoice`. Character
  voices live in js/folk_personality.js. Boss quests keep their plain requirement sentence ("You need combat level 25.").
- **Wording for RPG players**: stat lines over sentences ("+10% attack speed", "Lv 15"); detail in tooltips. All quest
  acceptance says **Accept quest**.
- **Say why it matters now**, from the live save, never generic text: item uses `DQ.usesOf`, sites `DQ.projectState`,
  food `DQ.expedition`, companion jobs `DQ.beastJob`. New items, sites or companions need a truthful entry there
  (`tests/ux-roles.cjs`).
- **Locked content is never named** (`tests/ui-rules.cjs`): unreached fish, trees, rocks, marks, recipes, crops, voyages
  and unmet creatures stay ??? or "Unknown creature", on the page and in tooltips and alt text. Quests may name their
  targets; places, bosses, challenges, towers and quests may be named. Use `DQ.monName(m)` for creatures. **Named
  required inputs**: requirements say Potato, Raw sardine, etc. with an exact route; a production level alone never
  reveals a recipe whose ingredients are undiscovered (`DQ.itemDiscovered`, `DQ.recipeDiscovery`); acquisition history
  survives use and sale. Next-unlock previews name real perks or say nothing (`UI.unlockShort`).
- **Icon-first navigation**: recognisable activity/item icons with accessible labels instead of repeated Go/Find/Make
  captions (`UI.activityIcon`, `UI.routeChip`); routes select the exact target (even a locked card, with explicit
  travel and a way back where needed; `UI.revealCard` scrolls only the list) and never start, spend or claim anything.
  Counts and destinations share `DQ.actionTargets(page)`; filters, tabs and list positions survive redraws.
- **Beast vocabulary**: a *beast* is any animal you own or could own; your *companion* is the one with you; a
  *creature* is something you fight. Buttons say "Make companion".

## 5. Game rules

### Progression and skills
- **Fighting styles**: Melee, Ranged, Magic, Defence and Health; all three weapon styles open from the start, on one
  shared scale (`D.STYLE_TUNE`), a lagging style learns 3× faster (`DQ.catchUp`). Attack and Strength are gone (old ids
  alias to `melee`); don't re-lock styles or split Melee. Gear bonuses read Accuracy and Power. Melee and Ranged pages
  have their book (techniques/shots, one chosen per style, power-neutral trade-offs) and a practice yard (drills: no
  Health XP, loot or kills); Magic has Spellbook (opens first), Runes and Alchemy; no spell beats Aether Blast's 36. A
  new art or spell must not add net power without re-running the boss and PARITY sims.
- **Combat extras**: empty ability slots fill at fight start (Brace first) unless the player removed one
  (`settings.autoAbil`); abilities at 70/80/90/95, passive techniques every 5 levels (`D.TECHNIQUES`) and a fourth slot
  at Combat 70; every region from Mossbarrow to Skyreach has two mini-bosses (`js/minibosses.js`; a new region needs two
  with art, lore, weaknesses and a quest); combat XP counts damage up to the creature's remaining health; a first boss
  victory ends the fight; damage types show what deals them (`DQ.dtypeSources`).
- **Starter kits**: character creation (three steps in the title card, `create()` in js/boot.js) picks Sword, Bow or
  Staff through the letter to Wren; never a class lock, never re-granted to loaded saves (`D.STARTER_KITS`).
- **Unique levels** (`js/level_spread.js`, runs last): no two gathering spots of one kind and no two recipes in one
  category/type share a level (tools climb per family); the opening keeps flax string at Crafting 1, the wooden trap at
  Crafting 2 and copper at Mining 1 (tin is 2). A quest may push a skill a little further.
- **Towns open content everywhere**: once a town is unlocked, all its gathering spots (thieving and signature ones
  too), surveys and fieldwork work from any town (`DQ.nodeRegional` is always false). Towns matter for restoration,
  combat, shops, local supplies and discoveries.
- **Tools**: ten tiers per family in Mining order (copper → runic, `D.TOOL_ORDER`, half steps included), each its own
  metal and colour, the first pickaxe included (Willowbrook's shop sells copper ore so Mining can start); all 50 tools
  have Smithing routes (rods and gloves also Crafting); acquired tools can't be rebought. Every purchase explains why
  its effect follows from the item (`D.TOOL_PURPOSE`, `D.SKILL_COMMISSIONS`). Workshop ranks give +3/6/9% XP; Smithing
  has six anvils (speed) and six hammers (double chance), `S.smithGear`. Anything you can craft, buy, upgrade or get
  from a quest is named for its alloy or wood (Iron sword, Runite dagger, Oak shortbow, Fine steel longsword); named
  weapons exist only as rare drops from rare creatures, mini-bosses, bosses and towers (`tests/weapon-names.cjs`). The
  29 in `js/rare_weapons.js` (docs/named-weapons.md) each have hand-drawn art, a fitting source, stats a little under the
  smithed weapon of their level and a signature (`unique.fx` with its own numbers, applied through `DQ.rareFx`); a new
  one needs all four, a row in `tests/ui-effects.cjs` and `node scripts/sim-uniques.cjs` evidence.
- **Perks and flourishes** (`js/skill_perks.js`): every skill gets something new at least every five levels plus a 99
  capstone, written into `D.UNL`; effects go only through `DQ.extraXp`, `DQ.extraSpeed`, `DQ.dblChance`, `DQ.fx`,
  `DQ.researchRate`, `DQ.brew`. Flourishes (`D.FLOURISH`) repeat an action's XP and output, never in forecasts or for
  burnt food. `NO_PERKS=1` boss sims must match the default.
- **Field guide** (`js/guide_materials.js`, `js/mastery.js`): creatures have six entries; every fish, tree, ore, pocket,
  recipe, crop, animal, brew, voyage and training has five (25/100/300/750/1,500: 2% faster each, 5% and 10% double at 3
  and 5), counted in `S.mast`. A thin brass bar on the thing itself; under the action button a labelled line ("Field
  guide 1/5", "Catch 54 more · 4% faster"). Any new repeatable activity needs a topic and a truthful perk.
- **Farming**: crops grow 4× longer than their base and give 6× XP (yields unchanged); farm plots say Plant <seed> /
  Growing · time / Harvest; farmhands earn 1/4 Guide progress per harvest or collection and no personal XP.
- **Queue** unlocks at Hero 3; it asks how long with plain buttons.
- **Gear and items**: equipped copies live outside the pack; keep spare-copy labels, conservation through swaps,
  unequips and bank moves, the guard against re-equipping an identical non-ammo item, and selling from both pack and
  bank (Sell 1 / Sell all / Sell all but 1). Gear arrows (`DQ.gearVerdict`/`gearMark`) sum stat changes against what is
  worn, in the backpack, bank, shop, recipe cards (with the full comparison on the selected recipe) and tooltips.
  `DQ.give` refuses ids that are not items. Rarity labels (`D.RARITY`) are bands of a drop's own chance; never change a
  chance to fix a label.
- **Offline**: up to 24 h counted at full speed; the ceiling (`js/offline_ceiling.js`) stops gathering and combat skills
  at the highest content level in the towns reached (Hunting's cap is the top ground animal; Beastmastery and the rest
  uncapped pending the owner). Never in forecasts or live play.

### Hunting and Beastmastery (owner, 26 Nov: two separate things)
- **Hunting** kills animals for their drops. One hunting ground with five tier tabs (`D.HUNT_GROUND`, js/hunt_stalk.js):
  ten animals per tier, each on its own level two apart, plain animals low and mythic ones high; only the Hunting level
  and the tier's kit matter, never the town. A hunt tracks (45%), sets the trap (30%) and strikes (25%); the strike lands
  with `DQ.huntCatch` (45–92%), otherwise it slips away for 30% XP. Kit from Intermediate up: that tier's trap kept in the
  pack and one bait per hunt; counts update live. A catch gives drops, quest kills and the wild-companion chance, never
  combat XP or food. An animal's name stays ??? until your first catch, even at
  your level and even a chicken (owner, 27 Nov). Animals off the ground keep their ids, kills, guide pages and pets
  and are listed only once caught (`DQ.animalListed`); an active quest can still send you after one. Fieldwork lays traps for a region's materials.
- **Beastmastery Capture** (`js/beast_capture.js`): any animal you have hunted can be caught alive and kept. Track 40%,
  live trap 30%, coax 30%; odds 55% + 2.5% per Beastmastery level above the animal (35–90%); one bait per try, the trap
  used only on a keep; a success is a `wild_<id>` beast straight to a pen (`DQ.awardPet(id, { hatched: true })`); one you
  own is let go for the XP. Never in forecasts. No bond XP from captures: deliberate paid training (cooldown, no
  repeating training) stays the only repeating bond growth; ten bond levels as in docs/beastmastery.md.
- **Eggs** are lucky finds: 1 in 2,000 skilling actions and 1 in 500 victories or catches (`D.EGG_DROP`), hatching at the
  ranch after 10/30/60 minutes; all older egg sources stay. Expeditions are retired: none can be sent; one already out
  resolves once. Only the assigned companion gives its bonus. Collection (`js/collection.js`) shows real odds.

### Quests, story and the world
- **Quests**: one Current list (ready first, then active, then new), story index with Main/Side grouping, live counts
  and same-card rewards (`docs/quest-journal.md`). Continue names and selects the next objective without starting it.
  Each objective fills a row of pictures of the thing it asks for; quests that teach or give equipment assemble it as a
  blueprint (`js/quest_pictures.js`). Recipe objectives match the actual completion event and output; new offers need
  their direct skills and levels, except the skill the quest teaches (docs/quest-accessibility.md). Quest givers have a
  32 × 32 portrait and notes revealed by finishing their quests (`js/folk.js`); any new giver needs both.
- **Story** (`js/story_data.js`, `js/story.js`): cutscenes only for main quests and boss victories, in the one
  conversation screen (portrait left, dialogue right, click/Space/Enter, Skip, choices, journal replay); work continues
  behind them; no replays on load. Decisions in `S.choices`, history in `S.seen`. The opening (`js/intro.js`) plays once
  for a new hero (automated browsers skip unless `localStorage['idlewick.intro'] = '1'`).
- **Restoration** shows what changed (ruined and restored art, the benefit, a villager's thanks). Standing is derived
  (10 per finished non-relic project), never a currency; local supplies need standing and the restored, undamaged
  building. Restoration migration version 1 rules in docs/connected-systems.md.
- **Guidance**: Next step never sends a hero to train with less food than their health (`DQ.foodStep`); the Before
  <boss> checklist (armour, ability, food) is skippable; follow-up restorations appear after 30 minutes without a reward;
  regional challenges are offered at ≥ 60% forecast (Saltmere 50%). docs/first-hour.md.
- **First-visit guides and unlock pop-ups** are on by default: a skill or feature page opens its short guide once (same
  text as Help); new skills open their celebration pop-up unless the player turned it off. Automated browsers skip both
  unless `localStorage['idlewick.reveals'] = '1'`.
- **World Life** (all optional, data-driven, nothing in main progression depends on them): museum (`D.WINGS`, one
  permanent bonus per finished wing), hidden recipes (`D.SECRET_RECIPES`, never listed or sold before heard), trial
  towers (`D.TOWERS`, cutaway view `js/tower_cutaway.js`, nothing may require a tower), ambient audio.
- **World events** (`js/world_events.js`): none in the first 15 minutes, 30–60 minutes apart. While someone is playing an
  event opens full-screen with work running behind it; Decide later or Escape keeps it. Events due while idle (5 min) or
  hidden, and events rolled for time away, wait in `S.inbox` (Activity, Home and Welcome Back count them), never expire,
  at most three (`DQ.WORLD_CAP`); choices resolve atomically, unaffordable ones show why, fights need the event's town,
  every event has a free choice. Buildings can be damaged, never destroyed; repair is cheap. No spendable reputation.
- **Away encounters** (plan.js, 21 types): least-seen first, never discarded at capacity, outcomes replace their slot,
  chosen in a large scene; Welcome Back offers Decide later and puts totals and quest progress first.
- **Connected systems** (docs/connected-systems.md, docs/cross-skill-update.md, docs/base-game-equipment.md): shop
  tonic 30 min, one per 6 game hours; brewing 3 bottles × 60 min; refits cost 75 coins + 5 runes per rank and consume the
  source enchantments; each tower has its own preparation profile (`js/preparation_roles.js`); secret recipes may output
  existing items and `DQ.migrateDiscoveries` grants ones earned by mastery; plots keep a saved next crop. Purchases,
  brewing, claims and choices save atomically and roll back on a failed save; forecasts never change anything.
- **Hunting stage strips** (js/hunting_stages.js) show only real progress (fight health, the trap cycle, the running
  hunt or capture); outcomes appear after the roll, never before.
- **Workers** take finite jobs through `DQ.assign` (`js/worker_jobs.js`); wages only for time worked; output never spent
  automatically.
- **Mastery guilds** (`js/mastery_guilds.js`) extend all skills at 99 through side quests; never reset earned ranks.

## 6. Tests to know

The runner covers everything; these are the ones to read when you touch an area. Engine and saves:
`tests/regression.cjs` (Node only). Layout and rules: `ui-fit`, `ui-current`, `ui-rules`, `shape-rule`, `hearthside-ui`,
`card-packing-ui`, `catalogue-cards-ui`, `menu-density-ui`, `scripts/audit-overflow.cjs`. Art: `art-pixel`. Systems:
`connected-systems`, `crosslinks`, `quest-progression`, `beastmastery`, `beast-capture`, `hunt-stalk`, `creature-roster`,
`world-life`, `world-events-hindsight`, `story`, `combat-arts`, `base-gear`, `unique-levels`, `choice-order`,
`offline-ceiling`, `live-notes`, `music`. HANDOFF.md has the full list.
