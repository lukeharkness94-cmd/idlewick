# Hunting, Crafting and Beastmastery — 16 November 2026

Implemented the approved first slice. Further skill minigame designs remain proposals. Decisions happen before a run; no reaction tests, mandatory bait rotation, extra currency or repeated stage clicks were added.

- **Hunting:** Fieldwork is the default, with Set → Wait → Check reflecting the real repeating action. Existing Quarry recommendations/combat remain available. Fieldwork supplies the existing regional material pool and can discover a signature egg once Beastmastery is open. It earns Hunting XP; old `train:lure:<town>` action/Guide/quest IDs are retained. Known material focus is optional and only available with a usable precision trap (weight 3 versus 1 for each other material, not a guaranteed drop).
- **Crafting:** Wooden trap remains Crafting 2 (2 logs + string). Reinforced field trap: Crafting 12, 2 oak planks + 2 iron bars + string; usable at Hunting 15, 8% break chance. Precision field trap: Crafting 35, 2 maple planks + 2 steel bars + 2 string; usable at Hunting 35, 2% break chance and focus. Wooden traps retain their 25% break chance. The strongest qualifying owned trap is chosen automatically; spare stock can be in the bank. Exhaustion stops safely, and a lower qualifying trap is used when available.
- **Beastmastery:** Egg expeditions, hatching, assigned companions and deliberate training remain here. Padded live trap: Crafting 20, 2 oak planks + 2 cloth + 2 string, consumed on dispatch; 1 real hour, 55% common/20% rare, 10-coin miss return. Rune traps gain a Crafting 55 route (2 magic planks, rune bar, sapphire, 10 runes); boss drops remain. Original Basic/Iron/Rune costs, odds, deadlines and five-track guarantee are unchanged. Requirement icons route directly to the crafted trap. Existing bond XP is unchanged; assigned-companion victories now give Beastmastery base XP equal to 25% of recorded combat XP, then apply normal skill multipliers. Kindred ranks now improve Beastmastery XP instead of increasing a repeating-training flourish chance that no longer had a live activity. Fieldwork retains the existing occasional XP-flourish behaviour under Hunting.

Fresh heroes retain the existing multifaceted Hunting gate: 20 logs chopped, 3 held wooden traps and Combat 8. Beastmastery still needs 3 held traps and Combat 10. These requirements keep the traps. Crafting opens through Hettie's existing main quest. New recipes use the shared ingredient-discovery rules and direct-source navigation. Higher traps don't bypass habitat levels or roads.

## Shop and scenery follow-ups

Shop Buy has Tools, Equipment and Supplies. Tool families show all remaining tiers, with existing increasing coin prices plus 25 relevant ore (Steel-tipped also uses 10 coal). The first reinforced pickaxe is coin-only to avoid requiring Mining to unlock Mining; the free pickaxe quest remains. Ordinary metal equipment purchases also require the corresponding materials, multiplied by quantity. Rare wares retain their existing separate rules. Tool commissions become available when their original region opens; buying does not require another trip there. Acquired/obsolete tool tiers disappear and cannot be repurchased. A permanent acquisition ledger preserves tool effectiveness, recognises older owned/banked tools and records crafted/reward tools too. Transactions recheck costs and roll back on failed saves. Green category/family cues count fully available upgrades; amber means materials are ready but coins are short.

17 November correction: the first reinforced commissions use 25 **copper** ore, available before later-town iron; the starter pickaxe remains coin-only. Higher tool and ordinary equipment material costs stay as described above. All shelves now share anchored navigation and a purchase footer, with changing details inside the body. Numbered shop/family menus select an affordable commission rather than returning to an unrelated remembered item.

Seventeen original code-drawn skill workplaces now follow the viewed page. Combat retains its area scenery; general pages retain the chosen hills/forest setting. Scenery is cached and quiet under both theme washes. No image generation or external art was used.

## Integration evidence and limits

- `tests/hunting-loop.cjs`: 16 checks for recipe references, fresh gates, actual crafting, trap selection/bank fallback, skill/Guide/quest events, exhaustion, concealed/invalid focus, online/offline parity, legacy save resume, save validation, absolute-time dispatch/once-only returns, forecast/failed-save safety, shop conservation/duplicates/bootstrap and companion XP. Harness loads expansion data in production order and includes skill perks.
- `tests/hunting-loop-ui.cjs`: real start/navigation/stage updates, exact crafting and padded-trap requirement routes, 17 different cached backdrops, live readiness/owned-tool removal, and 40 cases across five viewport sizes and both themes. Laptop checks include field setup and expedition action bounds. Uses isolated saves; the mature fixture explicitly grants levels and supplies.
- Candidate checks passed before enabling: 122 regression checks, 25 existing Beastmastery checks with the candidate loaded, 8 artwork checks including new items, existing desktop storage, 15 connected-system checks, targeted UI rules and the existing full UI-fit suite. Final packaged verification is recorded in HANDOFF.md.
- `scripts/sim-hunting-loop.cjs` / `hunting-loop-evidence.json`: a new-state route gathers, cooks, fights, defeats the first boss, visits Hettie, completes her actual quest, makes string/traps and starts fieldwork without grants, direct XP edits or unlock overrides. The fixed intervals deliberately overprepare (about 67.7 simulated minutes); this proves reachability, **not** an optimal opening or target pacing. The harness covers the affected rules, not every optional world event.
- Controlled durability fixtures hold Hunting 35 and Guide progress fixed, disable companions and grant abundant trap stock. Across 1,000 cycles: 241 wooden, 73 reinforced and 23 precision traps break; each produces 2,018 material units. Durability changes resupply burden, not baseline haul size. These are seeded samples, not guaranteed results.
- A separately granted level-25 iron-equipped combat fixture with a bond-1 Hearthwolf advances Beastmastery from 1 to 12 over one hour of goblins; previously victories granted no Beastmastery skill XP. Bond rules remain unchanged. This does not establish balance across every enemy/build.
- The existing 24-hour economy supply simulation remains unchanged. It does not buy tools, so its unchanged output does not validate the new material costs; explicit commission costs and bootstrap/conservation checks supplement it.

Human testing is still needed for material usefulness, resupply frequency, the value of focus, companion-skill pacing and the clarity of Fieldwork versus Quarry versus expeditions. No human enjoyment results or real 120 Hz/platform/Steam Cloud validation are claimed. No reset is required by the tested migrations. Fresh-start design takes priority; future unavoidable resets must be explicit, never silent.

## v4 Task 4 — Fieldwork checkpoint

Fieldwork uses its existing repeating task and save IDs. The strip divides each
cycle into **Set trap → Wait → Check trap → Recover trap**. The recovery settles
at the end of the existing cycle. It shows the actual haul and whether the trap
came back intact. Stopping before recovery leaves that cycle unpaid.

Trap preparation links take players to the actual recipes. Carpentry saws the
frames, Smithing makes the bars and Crafting makes the string and assembles the
trap. The starter wooden trap continues to use ordinary logs so it can still
unlock Hunting before Carpentry. The Fieldwork panel offers the existing trail
scent blend, and the Hunting ground keeps its bait tiers and original tracking,
trap and strike stages, with trail signs on the selected quarry.

An occasional Fieldwork egg goes straight into the existing Beastmastery
hatchery. The hatchery link is available while the egg is waiting, even after
Fieldwork has recovered more materials. Feeding and training take place at the
ranch. The hatchery persists in saves. The latest fieldwork recovery is session
feedback, so it can be rebuilt from the next completed cycle after a reload.
The egg expedition and the later live-capture task retain their own scope.

The reachability simulator now follows Hettie's current Willowbrook flax-and-logs
quest. Its fresh route reached Fieldwork after 62.97 simulated minutes with no
grants. The controlled 1,000-cycle samples produced 2,018 material units per
trap tier, with 241 wooden, 73 reinforced and 23 precision traps breaking.
These samples measure the simulated actions and supply burden.
