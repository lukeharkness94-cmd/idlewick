# Base-game equipment and starter choice — 17 November 2026

This is base-game development, not an expansion or DLC. It supersedes the historical upgrade-expansion proposal.

## Playable changes

Character creation offers Sword, Bow and Staff, with a full-character weapon preview and a clear statement that switching is always allowed. Sword is the default; no class/skill locks are introduced. Bow equips 300 bronze arrows. Staff equips the apprentice staff, knows the existing Spark spell and carries 300 runes. All kits retain 25 coins and five bread. Supplies are granted once on creation, not on selection or migration; existing saves are untouched. The other starter weapons, arrows and runes remain in Willowbrook's shop. Alternative weapons use their actual production supplies plus the existing coin price.

Each of the five gathering-tool families now has ten steps: Bronze (4%), Reinforced bronze (8%), Iron (12%), Steel (16%), Reinforced steel (20.5%), Mithril (25%), Reinforced mithril (30%), Adamant (35%), Reinforced adamant (40%), Runic (45%). Existing integer IDs and their speed bonuses remain; new half-step IDs fill gaps. Prices are 60/120/290/700/1,600/3,500/7,500/16,000/32,500/65,000 before existing discounts. Upgrades are optional, with no prerequisite shopping chain. Owning a stronger tool hides obsolete ones.

All 50 tools have complete Smithing recipes. Rods and gloves retain their Crafting alternatives with the same required forged supplies. Recipes use the existing bronze/iron/steel/mithril/adamant/rune bars, plus appropriate logs, string or hides. Bar quantities are 2/3/4/6/8/12/16/22/28/36; Smithing levels are 1/6/16/31/40/51/60/71/80/86, aligned with existing smelting levels. Bronze requires copper and tin; other alloy recipes retain coal. No new ores or bars were introduced.

Shop tool commissions require those same forged supplies plus coins. This replaces the previous flat 25-ore pricing; no bar-plus-equivalent-ore double charge. The existing first-pickaxe coin-only commission and Brannoc reward are retained as starter access exceptions. All tools, including that pickaxe, also have a Smithing route. Tool resale values are bounded below input value so the cheaper recipes cannot become a manufacture-and-sell money loop.

Each ordinary weapon family now has fourteen bands. Thirty-five intermediate weapons appear at style levels 3/5/15/25/35/45/55 with material/grade names. Stats and prices interpolate between existing neighbours, retaining weapon-family speed and the current strongest-item stats. Existing ore-backed melee recipes remain; ordinary bows and staves now also require a forged metal fitting alongside their other inputs. New recipes retain Smithing/Crafting skill roles and interpolate recipe levels/XP. New shop stock follows the lower neighbouring weapon's existing region availability.

Distinct fittings/grips are drawn through the existing code-based pixel renderer. The art suite verifies complete coverage and no duplicate item sprites. No AI/generated image assets are used.

Unique named reward weapons remain earned rewards. Removed the repeatable rare-shop purchase routes for weapon trophies; boss/tower/loot awards and already-owned items remain intact. No new named rare drops or changed drop odds are claimed.

## Integration and evidence

`tests/base-gear.cjs` exercises all starter styles fighting and consuming supplies, save round-trips, all 50 Smithing routes and their ore ancestry, rising tool speed, resale bounds, all 35 bridge sources/recipes, actual production and permanent half-step ownership. Existing Hunting/shop integration still passes, with fixtures updated for bars and supporting supplies.

`tests/starter-choice-ui.cjs` covers all three choices at 1280×720, 1440×900 and 390×844: selection, preview, supplies, equipment, persistence and horizontal fit. The old default sword workflow still works without selecting an option.

`EVIDENCE=docs/base-gear-balance.json node scripts/sim-base-gear.cjs` compares 48 controlled configurations (three styles, eight bosses, old/new weapon choice) using 24 seeded forecasts each. Levels, armour, health and abundant supplies are granted fixtures, not normal progression. Endgame top-tier results are unchanged. Early sword averages improve slightly (Grubnash 27.7→27.3s, Old Tusk 58.5→53.5s); other improvements depend on damage rounding and attack timing. Some sampled fights get slower despite higher bonuses. Frostmaw sword wins change from 24/24 to 23/24; this small sample is not a guarantee of greater survival. Different styles already have different counters and should not be expected to match identical boss times. No enemy nerfs or compensation bonuses were added merely to improve these numbers.

The existing no-grant Hunting reachability simulation was rerun. It reaches the first boss and fieldwork through actual actions; its generous fixed preparation is still a reachability test rather than a target beginner pace. Full regression, connected systems, artwork, storage, discovery and browser checks are recorded in the [historical handoff](archive/HANDOFF-2026-11-25.md).

Human testing is still needed for the value of the intermediate purchases, material burden and the number of early fights covered by starter ammunition. No real-display 120 Hz, native Steam/Mac/Windows or human enjoyment claims are made.
