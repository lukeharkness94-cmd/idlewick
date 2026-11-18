# Branch consolidation — 18 November 2026

The owner authorised consolidation into main. Starting main: 5f9fcc1 (14 November). Latest playable work: 155b424 (18 November).

## Integration decisions

- codex/hearthside-journal-20261118 supplies the latest source, generated standalone and tests. Its five commits carry the approved progression, equipment, quest, shop and Hearthside changes.
- codex/wip at 0b6c218 is explicitly an older-copy snapshot from 12 November, based on bc6d491. Its changes delete 5,023 lines and add 1,469, including temporary diagnostic tests. The audio patch removes the ambience gain bus, master-volume control, sound reverb and richer effects. Restoring that snapshot would regress the current main and owner-approved work. Its history is retained as a merge parent, while the current source and maintained regression suites take precedence. The old diagnostic scripts remain retrievable from that commit, rather than being installed as current tests.
- chatgpt/export at 5471b44 is a 12 November nested project/export snapshot, also based on bc6d491. All 155 files beneath its idlewick-steam-source directory have corresponding files in the latest root: 75 are byte-identical, 80 have changed in subsequent development. The current root already contains its Beastmastery, farming, story/restoration, settings and source-route systems. Its history is retained without reintroducing a second project directory, .DS_Store or ZIP archive.
- The other eleven side branches were already ancestors of main. No branch deletion is part of this operation.

Historical snapshots are merged with the current source winning intentionally, not by blindly accepting old file replacements. Both original commit trees remain accessible through the merged history. No new audio composition or sound-engine update is claimed by this consolidation.

Required gate: rebuild Play Idlewick.html; regression, ui-fit and ui-current pass on the consolidated tree before pushing main. Also exercise shop/source navigation, rank prerequisites, art coverage and desktop storage. No human-playtest or native/Steam readiness claim.

Verification completed: rebuilt standalone; 122 regression checks, 8 artwork checks, desktop storage, sequential shop purchase rules, eight-layout shop journeys, passive tooltip/source navigation, full ui-fit and full ui-current pass. Working source matches the approved 155b424 build; consolidation adds documentation and history only.
