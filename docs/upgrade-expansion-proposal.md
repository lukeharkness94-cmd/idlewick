# Tool and weapon expansion — 17 November 2026

Status: **historical proposal, superseded by the implemented base-game changes in [base-game-equipment.md](base-game-equipment.md)**. The tables below document the prior model; consult the new document and live recipes for final names, quantities, production levels and costs. This is base-game work, not an expansion or DLC.

## Decision

Double the choices by inserting optional improvements between existing milestones, keeping the current strongest items and level-60 weapon milestone. Do not double the time required or make players buy every intermediate item. Keep commissions material-backed, hide acquired tools and use the existing permanent ownership ledger.

The audit found one immediate progression problem: reinforced tools required iron from a later town. The live build now uses **25 copper ore** for the first commission, except the starter pickaxe, which remains coin-only so mining can begin. This is the only balance change from this proposal applied to the game.

## Proposed tool ladder

Each row is optional. Prices are model candidates; percentages are total speed bonuses. Every family uses these same metal milestones. Names say what the tool is: for example **Mithril pickaxe**, **Steel fishing rod** or **Reinforced adamant axe**. Preserve existing item IDs and ownership when renaming or inserting tiers.

| Speed | Gold | Material/grade | Smelted input |
|---|---:|---|---|
| 4% | 60 | Bronze | Bronze bar: copper + tin |
| 8% | 120 | Reinforced bronze | Bronze bar: copper + tin |
| 12% | 290 | Iron | Iron bar: iron ore |
| 16% | 700 | Steel | Steel bar: iron + coal |
| 20.5% | 1,600 | Reinforced steel | Steel bar: iron + coal |
| 25% | 3,500 | Mithril | Mithril bar: mithril ore + coal |
| 30% | 7,500 | Reinforced mithril | Mithril bar: mithril ore + coal |
| 35% | 16,000 | Adamant | Adamant bar: adamant ore + coal |
| 40% | 32,500 | Reinforced adamant | Adamant bar: adamant ore + coal |
| 45% | 65,000 | Runic | Rune bar: runite ore + coal |

All five families need a complete **Smithing recipe**, including rods and thief gloves. Forge hooks, reels, tool heads, buckles and other fittings from bars. Wood, string and leather can remain supporting inputs; no upgraded tool may bypass its mined-metal ancestry. Existing Crafting assembly recipes can remain alternative routes, but must include the corresponding forged metal and must not replace the required Smithing route. Use the current recipe system, discovery rules and acquisition ledger.

A plain starter pickaxe must remain available before mining. Treat it as starter equipment outside the material-gated upgrade ladder, with a Smithing replacement route; do not require ore before the player can collect ore. Resolve the old free first-commission ID carefully when integrating, without removing earned bonuses.

NPC commissions and self-production create the same item. Derive the metal requirement from one shared tier definition. A commission can accept the corresponding mined ores plus its service fee; a player Smithing recipe uses the bars they smelted. Never charge both the full ore equivalent and the same bars. Calculate raw ore equivalents through existing smelting recipes, including copper/tin and coal; the former flat 25-ore rule must be rebalanced against actual bar quantities and metal availability before enabling this ladder.

## Proposed ordinary weapon bridges

Seven additions per family give fourteen ordinary bands at 1/3/5/10/15/20/25/30/35/40/45/50/55/60. Existing top-tier combat stats stay unchanged. Ordinary purchases, Smithing outputs and Crafting outputs use **material + grade + weapon type**, not unique legendary names.

| Inserted style level | Material/grade | Bar input |
|---|---|---|
| 3 | Tempered bronze | Bronze |
| 5 | Fine bronze | Bronze |
| 15 | Fine iron | Iron |
| 25 | Fine steel | Steel |
| 35 | Fine mithril | Mithril |
| 45 | Fine adamant | Adamant |
| 55 | Fine rune | Rune |

Examples: **Fine iron longsword**, **Fine steel dagger**, **Fine mithril warhammer**. Ordinary bows and staves retain wood/string and their current skill roles, with forged fittings/bands made from the corresponding bars. Their labels should make both function and metal tier clear; the model uses “Fine iron fitted bow” and “Fine iron banded staff” as working names. Modelled weapon bonuses/prices remain interpolated between existing neighbours. Exact values and required metal IDs appear in upgrade-expansion-model.json; recipe quantities and gates remain to be integrated.

## Rare weapons have earned identities

Reserve names such as **Brinesong**, **Quiet Lantern**, **Last Toll** and **Ash Canticle** for special tower prizes, boss drops, rare loot or comparable earned rewards. These are a name bank, not newly granted rewards. Preserve existing named rare items and their sources. Do not add ordinary purchase, Smithing or Crafting routes to these weapons or quietly replace their drop tables. A named rare weapon can still depict metal construction without becoming generically forgeable. Ordinary crafted weapons remain a viable preparation route, not inferior filler that forces a rare drop.

## Evidence and limits

Reproduce with `EVIDENCE=docs/upgrade-expansion-model.json node scripts/model-upgrade-expansion.cjs`. This is an isolated engine model: it does not add items to the shipped catalogue.

At controlled Fishing 20, shrimp cycles move from 1,840 ms at the proposed 4% tool to 1,020 ms at the unchanged 45% cap. The model retains existing perks and speed floors. These are granted test states, not a new-player timing claim.

Boss comparisons use 24 seeded forecasts per configuration, granted recommended combat skills, appropriate existing armour and abundant bread. Only the sword family was forecast. Grubnash averages 27.67 → 27.33 seconds; Old Tusk 58.5 → 53.5; Barnacle 50.33 → 47.83. The current top-tier encounters remain unchanged. Frostmaw is a warning against assuming stronger automatically means validated: average successful fights shorten, but the small sample changes from 24/24 to 23/24 wins as attack timing changes. Repeat larger samples and test food sustainability before enabling.

Not yet established: natural resource and gold affordability, complete first-hour pacing, ranged/magic balance, all weapon weaknesses, crafting recipe placement, drop value, artwork differentiation or player enjoyment. A larger catalogue should be enabled only after those checks. The live copper correction already resolves a concrete reachability issue without importing this unfinished ladder.

## Implementation requirements

Use an ordered catalogue rather than hard-coded five-tier loops. Preserve existing item IDs and permanent ownership when inserting rungs. Audit shop readiness, auto-tool selection, tool comparisons, saves, workers, recipes, discovery, field-guide perks, art and all simulations together. Every proposed item needs distinct code-drawn art and a real source/use before release. Do not sell placeholder clones or claim this model is the finished doubling.
