# Hearthside Journal — 18 November 2026

The owner selected Hearthside Journal from three whole-game concepts and authorised its implementation. The live game now applies that direction, superseding the earlier concepts-only status.

## Shared presentation

- Warm parchment, ink, forest-green status colours and brass actions. Dark mode uses the same hierarchy on warm forest surfaces. Panels are opaque and mostly flat; scenery stays in the illustrated activity/village/combat views rather than competing with text.
- Cinzel headings and Alegreya Sans body/control text form the new Hearthside lettering option. The bundled fonts work offline in the standalone build. Fresh heroes default to light parchment and Hearthside; explicit saved dark/auto themes and other lettering choices remain valid.
- The 180px skill rail, Combat above Skills, original pixel icons, top-level navigation and mobile navigation remain. Rows are quieter; selected locations have one clear accent. The dock remeasures after task-card/font changes and reserves a few pixels to prevent a laptop-only overflow.
- Buttons, selected/disabled states, equipment cells, tooltips, dialogs, notifications, task choices, recipes, quest rows, shop families and settings share the same material/colour language. Unknown outputs still use silhouettes and honest requirements; locked choice captions remain readable.
- Routine acknowledgements appear at the bottom rather than at a stale control position after redraw. Existing notification settings and reduced-motion behaviour remain.

## Home and quest flow

Home leads with the actual selected journey's next step. When that step belongs to a quest, it shows the real giver, chapter and live objective counts. It does not change the selected goal, invent rewards or silently start a task. The main action uses the existing quest/task handlers; active work links back to the running task. Ingredient shortcuts remain icon-first, while the main quest Continue action names its destination objective.

The village preview is a contained image beside the chapter, with a visible village action and actual restored-site count. Nearest skill unlocks are lower-priority reference, not a second primary objective. Existing suggestions remain available through goals, skills and the corresponding systems. Home's finished-target hint no longer uses a misleading green completion tick; quest checklists carry progress directly.

`js/hearthside.js` extends existing journey/Home rendering and route controls. `css/hearthside.css`, loaded after the existing styles, contains the visual standard. Existing activity, combat, farm, project, recipe, research, inventory, bank and save systems are preserved. No balance or save-schema change belongs to this redesign.

## Verification

- Regression: 122 checks; artwork: 8; desktop storage; quest progression: 7.
- Existing one-screen fit and current UI journeys, including laptop/phone/ultrawide layouts and both themes.
- Full UI rules across the page catalogue: discovery masking, readability, supported fonts, pixel scales, no dropdowns/disclosures and wording.
- New Hearthside browser journey: default style; one real chapter action; exact objective routing without auto-start; activity and goal preservation; eight viewport/theme cases; contained village preview; saved theme/font/quest preferences.
- Quest journal: ten layout/theme cases and same-card reward reveal; combat loadout: eight layout/theme cases and actual swaps/ammo; writing/navigation: six stable shop geometry combinations, exact badge routes and stationary combat containers.

These are automated checks plus visual inspection, not human usability sessions, retention evidence or a review score. Native Windows/Mac and Steam Cloud validation are separate work.

18 November shop/source follow-up: tool families are named for their skill. All other skills have three permanent workshop equipment ranks at skill levels 5/25/50, costing 250/2,000/10,000 coins, 25 bronze/iron/steel bars and 10/20/30 logs. These add 3/6/9% skill XP (maximum), preserving combat speeds, crop timers and expedition deadlines; existing tools keep their speed ladder. Shared skill headers link directly to their upgrade shelf. Material requirements are optional investments, not new unlock gates. At equal base XP these ranks require approximately 97.1/94.3/91.7% as many actions; these are arithmetic comparisons, not player pacing measurements.

Boss/tower/unique equipment is excluded from normal stock, rare stock and cache equipment. Buy back offers only previously acquired rare gear absent from pack, bank and equipped slots, one replacement at four times base value; transactions save atomically. Crafting's Hettie introduction is now in Willowbrook at Hero 3: deliver 10 flax fibres (Woodcutting 2) and 5 logs. Flax string is Crafting 1, 2 flax → 3 string; existing leather-string and trap recipes remain. Earned skill unlocks stay intact. Creature portraits in combat now open the existing field-entry popup without changing the encounter. Farm Buy seeds filters the shop to seeds. Choice-list padding contains hover surrounds and tooltips stay above menus.

Requirements follow-up: shared material tiles now show a named input and a single `held / needed` count, including unknown inputs and sufficient supplies. Removed duplicate quantity badges, ticks, “held”, “need more” and missing-count prose. Item names/counts do not wrap within a tile; whole tiles reflow on narrow screens. Workshop unlock counters use the same concise form. Shortened workshop copy to its actual XP benefit.

Item navigation follow-up: every item tooltip has How to get it and Where it’s used sections containing icon buttons. Routes are derived from actual nodes, recipes, shops, creatures, towers, quests, projects, research, farm and equipment definitions; unavailable direct sources are honestly indicated. Recipe outputs remain discovery-gated. Recipe/source shortcuts select the target without starting work; shops never buy/sell automatically. Pointer tooltips stay still and allow crossing into their buttons; focus + ArrowDown enters routes, Escape dismisses, and existing touch-hold behavior remains. Icon names are available through accessible labels and native titles. Exact item names, stats and exceptional effects remain above these sections.

Latest owner direction supersedes interactive hover cards: tooltip source/use icons are passive, borderless images; page source buttons remain actionable. Requirement counts and unlock counters are plain, left-aligned information without surrounding pills. Passive upgrade ranks also lose their button-like frames. Shop header hierarchy is category → shelf actions → skill, with the individual-skill row absent outside Skill upgrades. Primary category contrast uses the shared theme action-ink token. Regression, fit, passive-tooltip and shop journey checks pass; current UI verification follows.
