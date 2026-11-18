# Quest journal and character voices — 16 November 2026

The quest page uses a story index beside a selected chapter. Available, Active, Completed and Upcoming have explicit counts. Each filter separates Main story and Side stories; active rows show the next unfinished objective's actual quantity and total quest progress. Ready quests have a distinct Return state.

The chapter leads with the original quest title, quest giver and prominent dialogue. Original objectives, level recommendations, consequences, rewards and unlock gates are preserved. Quest voice uses authored quest speech or its authored scene before falling back to a character's voice. Completed chapters and the in-card reward reveal use original thanks before character-specific fallback responses.

Acceptance keeps the Available view while more requests remain, then switches to Active. Continue objective uses existing contextual routes and selects the exact gathering/production task without starting it. Its return link restores the selected quest. Pin controls reuse S.pins and save immediately. Up to three existing pins are preserved; the page bar displays one useful pin across navigation, preferring the current activity's objective. Ready pins open the quest for its return conversation. There is no new tracker.

The selected card keeps its outer size through the reward reveal, including background refreshes. Changing quest/filter or leaving Quests ends that reveal. Desktop action buttons stay at the foot of the chapter; long text/checklists scroll within its reading area, and the left index scrolls independently. Phone stacks the compact index and chapter. Side-story choices remain explicit inside the chapter; only main-quest scenes are cinematic.

## Character writing

`js/folk_personality.js` covers all 27 original quest givers. Each has a speaking style, outlook, major/minor interests, two short fallback offer lines and a personal acknowledgement. Existing authored choice responses, quest-specific dialogue and history-dependent thanks retain precedence. The People page exposes outlook/interests only for people already met, beside its existing earned notes.

Examples: Mabel is affectionately bossy with kitchen humour and a fondness for Gerald the pie dish; Wren sees the village as her world and worries about departure; Wynn is hesitant socially but precise about woodland; Merrow is eloquent and curious about distant history; Vess manages anxiety through lists; Sorrel dreams of travel but fears leaving sheltered water; Ignis admits fear without surrendering command; the Last Herald confuses past/future tenses while trying to learn ordinary greetings. Sparse or hesitant speech does not imply low intelligence. Dialect uses idiom and rhythm, rather than heavy phonetic spelling.

This pass gives distinct voices and interests, not a new relationship/affinity system or new mechanical choice consequences. More quest-specific lines can replace fallbacks as chapters are revised.

## Skill rail

`UI.skillDockOrder` keeps every activity available to a fresh hero first (currently Fishing, Woodcutting and Magic). Remaining rows use a stable progression grouping: early gathering/making, multi-skill activities and companions, regional/exploration/research, then advanced combinations and Sailing. Unlocking does not reorder the rail; save data and unlock conditions are unchanged. The exact requirements still appear in each skill's existing details. Rank is a presentation decision rather than a promise of exact unlock time, since players can pursue prerequisites in different orders.

## Verification

`tests/quest-journal-ui.cjs`: batch acceptance, live 5/8-style counts, exact cooking selection without starting, route back, pins across navigation, ready/completed states, reward reveal surviving refresh at the same size, character coverage, People interests, stable starter-first ordering, and five viewports × both themes.

Also run regression, story engine, UI fit, targeted UI rules (Quests/People) and artwork coverage checks. Fixtures are isolated synthetic saves, not evidence of normal progression pacing or human engagement.
