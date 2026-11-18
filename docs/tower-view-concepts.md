# Tower view alternatives — 16 November 2026

Concepts only; the shipped tower view and mechanics are unchanged. All options retain the current five floors, sequential access, saved highest floor, replay and signature reward.

- **The cutaway (recommended):** a compact cross-section of the local building. Cleared rooms light up; the next room is highlighted; unknown occupants remain silhouettes. A fixed encounter panel holds the next opponent, preparation and Enter. Strongest sense of place without adding menus.
- **The expedition map:** five connected room stops, with a selected encounter below and the final reward beside it. Emphasises the short journey and reason to finish. Particularly suited to locations that do not look like literal towers.
- **The encounter theatre:** large current opponent in a local interior, small floor strip and preparation beside the action. Gives combat art the most space and makes the next encounter immediate.

Use existing code-drawn art and no AI imagery. Future implementation should connect the choice to live tower state rather than introduce branching routes, entry fees, random modifiers or a second progression system. The three interactive design previews live outside game source under /workspace/idlewick-concepts/tower-concepts.html.

## Selection and implementation

The player approved The cutaway on 16 November 2026. It is now the game view in js/tower_cutaway.js, with subtle asynchronous whole-sprite idle breathing. The other alternatives remain concepts. Tower mechanics are unchanged.
