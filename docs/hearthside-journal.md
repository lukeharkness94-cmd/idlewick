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
