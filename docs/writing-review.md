# Writing and navigation review — 17 November 2026

The player asked for natural speech rather than cryptic shorthand, actual ingredient names, stable controls and meaningful notification destinations. This pass changes presentation and authored text directly in the existing systems.

## Writing

Reviewed all 90 ordinary quest requests, all 42 mastery-guild requests, 27 character voice profiles, 22 first-use lessons, story scenes and related journey/People/lore copy. Ordinary requests now use the giver’s voice, with a concrete problem and understandable request. The journal prints each request once. Existing quest IDs, targets, quantities, rewards, branching choices and gates remain intact.

Orrin’s former “One notch for every raid. I have nearly run out of gate” was a compressed joke about tally marks. It now reads:

> See the marks on this gatepost? I cut a notch every time the goblins raid a farm, and I’m running out of room. This week they’ve stolen grain, two hens and somebody’s washing. Their chief, Grubnash, calls himself a king. As far as I can tell, his kingdom consists of our missing laundry.

Other corrections include Frostmaw consistently being an ice troll, Whisper asking for the actual cooked-herring payment, a communal supper explaining Brunn’s lobster request, and a missing cod delivery explaining why Piers accepts a mixed catch. Consequence and restoration descriptions use a narrator where a villager would otherwise recite UI mechanics. Character personalities, hesitancy, warmth, dry humour and history-dependent responses remain distinct.

All acceptance actions keep the explicit **Accept quest** label. The request for less text applies to repeated guidance, not replacing a clear quest action with “I’ll help” or an icon.

## Required items and discovery

The latest player instruction explicitly names required inputs. A requirement now says **Potato ×1** or **Raw sardine ×3**, with its acquisition source and source level secondary. Shared requirements, route labels, project materials and recipe-lock reasons agree. This supersedes the older rule that hid even required input names. Undiscovered recipe outputs still show ??? and cannot be produced simply by having a high production level. Sources remain directly selectable without starting work.

## Stable interaction and meaningful counts

Shop navigation lives outside the changing item details. Tools, Equipment and Supplies share the same panel and footer geometry; long explanations scroll inside the details body. The purchase/upgrade action stays anchored. Combat no longer replays page-entry motion on same-page renders or shakes the entire arena for a boss special; fighter motion and hit feedback remain.

`DQ.actionTargets(page)` supplies both counts and destinations. Numbered menus select the exact ready quest, project, research topic, farm subsection/page or affordable tool commission. Ready quest claims take priority over new offers. Ordinary navigation without actions retains its remembered destination. Navigation never starts, claims or spends automatically. Home/Activity history creates no count, so a past quest notification cannot leave Home permanently showing “1”.

The tool audit also corrected the first reinforced commission to 25 copper, while the starter pickaxe stays coin-only. The proposed doubled catalogue is separately documented in [upgrade-expansion-proposal.md](upgrade-expansion-proposal.md); it is not enabled by this writing/UI pass.

## Validation scope

Meaningful checks cover quest voices and duplicate removal, named undiscovered inputs, exact badge destinations, stationary shop geometry across themes/sizes, combat container bounds across special/hit/render events, conversation continuity, journal actions and responsive layouts. Regression, discovery, shop atomicity, Hunting integration, artwork and desktop storage checks remain applicable. Automated fixtures demonstrate behavior and fit; they are not human comprehension, humour, enjoyment or real 120 Hz performance evidence.
