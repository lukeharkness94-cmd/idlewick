# Menu spacing and return encounters — 19 November 2026

The previous packing pass applied catalogue-sized tiles to reference indexes. It also checked overflow without checking whether a panel was using its allocated width sensibly. This pass corrects both problems.

## Coverage and decisions

Captured 101 initial page/submenu states and expanded the final inventory to 143 states, including guide topics, upgrade families and both Mastery modes. Screenshots use isolated granted-progress fixtures (all skills at 35, several visited towns, built rooms, six farm plots and four pens). They are layout fixtures, not evidence of normal progression. Long-name browser checks additionally use level 99 and known items. The audit files live outside the source tree in `/workspace/idlewick-ui-audit`; delivery screenshots live in `/workspace/idlewick-screenshots`.

| Screens | Finding and treatment |
| --- | --- |
| Home | A short objective stretched to the window bottom. Its panel now ends after its contents; the village and optional reference remain alongside it. |
| Activity, Journal, People, empty quest filters | Existing natural-size panels and helpful empty states retained. A chart's plotting area is functional space. |
| Quest journal | Retained the stable list/detail workspace, readable dialogue and fixed claim/accept controls. Do not compress the reading area into catalogue tiles. |
| World map, town projects | Retained the map/scene plus selected destination/project. Open scenery is intentional, not a blank menu gap. |
| House, all seven rooms | Furniture grids now distribute the remainder of each row across readable columns. Existing requirements, trophy wall and room navigation remain. |
| Workers | Retained natural-size empty/team/hiring panels. No invented workers or filler cards. |
| Hero, Bank | Equipment and storage retained. Tool references now form compact rows in a responsive grid instead of five window-wide strips. |
| Skill levels, achievements, collections | Used available row width, smaller consistent gaps, and wider content-dependent reference rows where needed. Collection rows fit three columns at the audited desktop size. |
| Mastery guilds and ranks | Guild details end after their contents; the guild index still scrolls independently. Ranks retain the compact skill selectors. |
| Field guide, all available topics | Replaced 170px tiles and split nearly-complete/other galleries with one 86px index row grid. Sprite, full name, entry count and real progress stay together. Near-complete entries remain first without leaving an empty half-row. Topic/entry/full-page actions are preserved. |
| Museum | Retained its compact icon collection and selected summary. |
| Shop, all three main categories and shelf operations | Common header and purchase controls stay stable. Skill subnavigation belongs in the catalogue, including workshop commissions. Sparse shelves end after their cards. Detail height is bounded and its action stays pinned across category changes. |
| All skill gathering/making catalogues | Columns distribute unused remainder rather than leaving a large gutter. Ordinary choices are 180px tall; simple shop stock is 170px, material-heavy tool commissions 210px, workshop ranks 180px. Width minimum remains 260px, fonts unchanged. Short recipe catalogues stop after their contents; long catalogues scroll internally. |
| Farming: fields, pens, seeds, livestock | Land and supply panels end after their visible contents instead of filling the remaining height with empty soil/grass. Capacity pagination, purchase/harvest controls and separate crop/livestock workspaces remain. |
| Magic: Alchemy and Spellbook | Spellbook reading/choice panels use their content height. Casting readiness and actual spell selections remain visible; navigation does not start combat. |
| Scholarship, Enchanting | Preserved family/rank grouping and named requirements; grids use their allocated width. |
| Hunting, Sailing, Carpentry, Herbalism | Shared catalogue changes apply; actual staged work, recipes and travel rules remain unchanged. |
| Beastmastery: ranch and trapper | Retained the inhabited ranch scene. Removed inherited full-height rows from the trapper's creature choices. |
| Combat, tower, loadout controls | Existing compact combat action bar, paper doll, arena and five-floor cutaway retained. Whitespace in a scene is composition, not padding to remove. |
| Settings: five groups | Existing horizontal groups and natural-height setting cards retained; no duplicate controls or extra settings categories. |

This supersedes the blanket fixed-width/fixed-height rule for every card. Consistency is within a function: index rows, production choices, reading panels and scenes have different needs. Do not shrink fonts or replace absent content with decorative filler.

## Returning: more than commerce and fights

Added fourteen optional encounter types to the existing seven: Mabel's taste test, a misaddressed letter, conflicting weather advice, Hettie's mending, a snagged fishing line, a fallen bough, an apprentice's ore sample, a first hinge, a neighbour's planting plan, wildlife tracks, map margins, a reading-room argument, a visitor's questions and a musician's unfinished tune.

Some are quiet character moments; others offer modest common resources, a small base-XP reward, or an explicit material exchange. Named villagers stay in their home town; skill-specific moments require their skill. No new currency, scheduler, modal chain, timed opportunity or exclusive equipment source was added. The current activity keeps running. Existing 20-minute absence threshold and one-to-three generated encounters remain.

Selection prefers the least-seen eligible types using persistent `S.seen['away:<type>']` counts, excluding already-pending types. Pending encounters are preserved rather than discarded when the six-entry inbox is full. Existing pushed-pace injury rules remain, so anti-repetition is not a promise to suppress a real risk consequence.

Outcomes replace the original choice in display order, retain its measured minimum height, show the selected choice, narrative and actual item/coin/XP/health changes, and receive keyboard focus without scrolling. Reward facts are compact inline information rather than oversized decorative tiles. Results remain temporary; narrative outcomes are recorded in the journal. Decision consumption and rewards are saved together; failed saves roll back both. Existing saved encounters still resolve.

## Verification

Use `tests/menu-density-ui.cjs` for every guide topic with known-item long names, entry selection, allocated catalogue width, all 21 skill upgrade destinations and a middle-card return choice. The first and third cards must retain their positions. `tests/away-variety.cjs` covers eligibility, every new option, fair rotation across eligible types, save round-trips, inbox preservation, duplicate claims, missing supplies, save failure and legacy chest decisions.

Also run regression, art-pixel, desktop-storage, catalogue-cards-ui, card-packing-ui, writing-navigation-stability-ui, ui-fit, ui-current and ui-rules. Inspect captured images: overflow checks alone previously missed the narrow-column regression. Automated checks do not establish that the encounters remain enjoyable after many sessions; human testing should check repetition, dialogue appeal and whether quiet options are worthwhile.
