# Economy evidence (Stage 7)

Re-run: `node scripts/sim-economy.cjs 24` (current tuning) and `node scripts/sim-economy.cjs 24 --no-economy`
(pre-tuning values). The bot is a steady, sensible player: it rotates Fishing, Woodcutting and Mining every 15 minutes
on the best node in its town, sells everything every 30 minutes, never spends, and reaches new towns at Hero-level
checkpoints standing in for combat progress (combat itself is not simulated). It measures supply, not fun.

## Coins in the purse (24 hours of active play)

| Hour | Hero | Town | Current tuning | Coins/hour | Pre-tuning | Coins/hour |
|---:|---:|---|---:|---:|---:|---:|
| 0.5 | 13 | Mossbarrow | 2,109 | 4,218 | 3,917 | 7,834 |
| 1 | 18 | Mossbarrow | 4,534 | 4,850 | 11,526 | 15,218 |
| 2 | 26 | Saltmere | 10,914 | 6,380 | 27,111 | 15,585 |
| 4 | 36 | Saltmere | 28,217 | 8,652 | 66,104 | 19,497 |
| 8 | 46 | Ironpeak | 85,229 | 14,253 | 203,912 | 34,452 |
| 12 | 52 | Gloomfen | 157,306 | 18,019 | 376,277 | 43,091 |
| 24 | 61 | Gloomfen | 490,925 | 32,331 | 1,229,495 | 76,331 |

Codex's reward tuning leaves about 40% of the earlier coin supply.

## What it can buy

Key prices are reached early with current tuning: tier 2 tool, cottage, kitchen and the cheaper projects in the first
hour; tier 4 tool, workshop and the most expensive regional project by about 4 hours; a typical Scholarship tier III
project by about 8 hours.

Total coin sinks in the game are about 3.4 million: furniture 1.84M, Scholarship 0.80M, tools 0.43M, farm plots 0.13M,
rooms 0.09M, pens 0.09M, projects 0.04M, animals 0.03M (plus gear purchases up to 300,000 and worker wages).

## Reading

- No rebalance is recommended now. Early purchases come quickly (good for a first session) and the long tail of
  furniture, Scholarship and tools gives coins a purpose for dozens of hours.
- Watch in human playtests: whether the first two hours make shop choices feel trivial, and whether Hero 46 to 65
  (about 8 to 24+ hours here) feels thin. The Ironpeak adventure and later restoration projects now sit in that band.
- Hero pace: Hero 13 at 30 minutes, 26 at 2 hours, 46 at 8 hours, 61 at 24 hours of steady gathering.
