# Mastery guilds — 16 November 2026

Each of the 21 skills, including combat skills, now has a level-99 guild under Hero → Mastery. Existing mastery ranks/titles remain under Ranks & titles. Guilds reuse the ordinary quest journal, character portraits, skill artwork, pins and contextual activity routes. They do not introduce a currency, separate task tracker or reputation meter.

## Journey

1. Reach level 99 in that skill. A new level-99 event offers a quiet corner invitation; existing level-99 saves can enter directly through Mastery without a backlog of announcements.
2. Reach the guildmaster's established region if necessary. The guild page explains both admission and regional requirements.
3. Read and accept the initiation in the quest journal. Successful work counts after acceptance. Existing visits, owned enchanted equipment/boats and completed companion bonds can supply the explicitly stated evidence.
4. Return to earn a membership seal. A second, optional specialist pursuit becomes available.
5. Finish that pursuit for its personal title and specialist seal. Wear the title from the guild page, or continue using an earlier mastery or beast title.

Rewards are recognition, personal responses and wearable titles, not new passive power or a source of coins/items. Seals are rendered from existing skill art and derived from completed quests; they do not take inventory space. There are 42 finite quest chapters, two per skill, with distinct authored briefs. They are side stories and never open cinematic scenes. Below level 99 these chapters do not flood Upcoming or Available; the guild catalogue still shows admission requirements.

Examples: Fishing's Patient Tide collects river/harbour catches then reaches distant waters; Smithing's True Ring produces a matched equipment set; Cooking's Extra Place prepares meals for others; Scholarship's Listening Room combines repeatable field notes with creature reports; Defence's Standing Watch requires defensive training victories; Beastmastery's Gentle Hand recognises deliberate care and already-completed bonds. All use existing activities and actual resource requirements.

## Persistence and evidence

Progress uses existing S.q entries (`guild_<skill>_welcome`, `guild_<skill>_specialist`); equipped guild titles use the existing S.title with a `guild:` prefix. Save schema/key, mastery XP, ranks and coin multipliers are unchanged. Old saves need no grant or reset; existing mastery ranks do not automatically complete the new practical work. Guild claims save immediately, restore deliveries/membership state if saving fails, and are disallowed during forecasts/offline simulation. Ordinary offline actions may progress an accepted challenge; claiming remains a deliberate player action.

Research publishes one `study` quest event per completed study. Brewing publishes one event per successful batch, not per bottle. Combat evidence records the equipped style at a real kill, and Defence additionally requires the actual `defensive` training setting. Health evidence counts actual missing HP restored by food, never overhealing. Equipment proofs require still owning/wearing the item. Max-bond companions qualify directly so old completed content cannot block a challenge permanently. Failed work and rejected purchases do not count.

## Verification and limits

`tests/mastery-guilds.cjs` checks all 21 guild definitions/references, level-98/99 gates, sequential membership, earned titles, duplicate claims, rank preservation, save round-trips, forecast protection, combat styles, healing, repeatable research, owned enchantments, save-failure rollback, actual brewing and completed-bond alternatives. `tests/mastery-guilds-ui.cjs` exercises a complete synthetic Fishing journey, task/return routes without starting work, the membership reveal, wearing a specialist title, existing ranks, all guildmaster references and ten viewport/theme cases. Also run regression/art and UI rules for Mastery/Quests.

Fixtures grant endgame state only for QA; they are not evidence of normal pacing or human engagement. These are short, finite practical challenges using existing mechanics. They do not yet include bespoke minigames, new guild buildings in town art, or dedicated guild equipment/abilities. Human playtesting should establish whether recognition and the personal stories are sufficient rewards before adding mechanical bonuses.
