/* Idlewick: adventures and rare discoveries.
   Discoveries are rare, once-per-save moments in ordinary play (a map in the bark, a lantern in the ore). Three of them
   open a handcrafted adventure: a short chain of ordinary quests that crosses skills and regions and ends with an
   artefact. Each artefact can be displayed in Willowbrook as a village project with a visible change and a small
   lasting benefit. Everything reuses the existing quest, journey, project, notification and save systems. */
(() => {
const DQ = window.DQ, D = DQ.data, UI = DQ.ui, { esc, fmt } = DQ;
const S = () => DQ.S;
const disc = () => (S().disc = S().disc || {});
DQ.discovered = id => !!disc()[id];

/* ---------- Artefacts and finds: keepsakes, not trade goods ---------- */
const relic = (id, name, col, ic, desc) => { D.ITEMS[id] = { id, name, col, ic, val: 0, type: 'relic', desc }; };
relic('weathered_map', 'Weathered map', '#c8a870', 'scroll', 'A bark-stained map of the old Bramble Mill.');
relic('rusted_lantern', 'Rusted lantern', '#b0784a', 'fire', 'A miner’s lantern stamped with a lamplighter’s mark.');
relic('star_shard', 'Star shard', '#bfe8ff', 'gem', 'A splinter of fallen starlight, cool to the touch.');
relic('millers_bell', 'The Miller’s Bell', '#d8b050', 'bell', 'It rang for every harvest at the Bramble Mill.');
relic('lamplighter_lens', 'Lamplighter’s Lens', '#ffe08a', 'gem', 'A crystal lens that gathers light from nothing at all.');
relic('star_heart', 'Star-heart', '#e2d4ff', 'star', 'The warm heart of a fallen star.');

/* ---------- Discoveries ----------
   when(ev, key) decides eligibility; rate is the per-action chance; pity guarantees it after that many eligible actions. */
const T = () => S().town;
D.DISCOVERIES = {
  weathered_map: { name: 'A map in the bark', place: 'willowbrook', text: 'Splitting an old oak, you find a folded map pressed into the grain. It shows a mill past Mossbarrow, circled twice in faded ink.', when: (ev) => ev === 'chop' && ['willowbrook', 'mossbarrow'].includes(T()) && DQ.lvl('woodcutting') >= 10, rate: 1 / 600, pity: 1500, item: 'weathered_map', quest: 'am_map' },
  rusted_lantern: { name: 'A lantern in the ore', place: 'ironpeak', text: 'Your pick rings on brass. Buried in the seam is a miner’s lantern, its glass still whole, stamped with a lamplighter’s mark.', when: (ev) => ev === 'mine' && T() === 'ironpeak', rate: 1 / 600, pity: 1500, item: 'rusted_lantern', quest: 'al_lantern' },
  star_shard: { name: 'A shard of starlight', place: 'skyreach', text: 'Something cold and bright falls past you and lands in the grass: a splinter of starlight, humming faintly.', when: (ev) => ['kill', 'catch'].includes(ev) && T() === 'skyreach', rate: 1 / 400, pity: 900, item: 'star_shard', quest: 'af_star' },
  forgotten_shrine: { name: 'The forgotten shrine', place: 'gloomfen', text: 'Behind a curtain of reeds stands a shrine nobody has tended for a century. You clear the moss from its stone, and the marsh seems to breathe easier.', when: (ev) => ev === 'kill' && T() === 'gloomfen', rate: 1 / 300, pity: 400, reward: { coins: 800, xp: { hitpoints: 1500 } } },
  ashen_anvil: { name: 'The ashen anvil', place: 'emberfall', text: 'Your pick strikes iron under a drift of warm ash: a dwarven anvil, older than the citadel, its face still glowing faintly. The runes on its horn ask to be fed fire.', when: (ev) => ev === 'mine' && T() === 'emberfall', rate: 1 / 400, pity: 800,
    choices: [
      { id: 'quench', label: 'Feed an ember core to the anvil', needItem: 'ember_core', text: 'The core sinks into the iron with a sigh. For a moment the anvil rings by itself, and you understand the old smiths a little better.', reward: { xp: { smithing: 6000, mining: 2000 } } },
      { id: 'citadel', label: 'Leave it to the citadel smiths', text: 'Magmasmith Kael’s apprentices haul it away on rollers and pay you handsomely for the find.', reward: { coins: 1500 } }
    ] },
  lost_traveller: { name: 'A lost traveller', place: 'saltmere', text: 'A soaked traveller is sitting on the jetty, hopelessly lost and very hungry.', when: (ev) => ev === 'catch' && T() === 'saltmere', rate: 1 / 700, pity: 1500,
    choices: [
      { id: 'share', label: 'Share five cooked meals', need: 5, text: 'After a hot meal, the traveller shows you how to spot the sandbanks where fish gather. They thank you for the food before setting off along the coast road.', reward: { xp: { fishing: 1500, cooking: 600 }, coins: 300 } },
      { id: 'directions', label: 'Point the way', text: 'They thank you warmly and hurry off along the coast road.', reward: { coins: 60 } }
    ] }
};
/* An early, reliable discovery on the goblin hunt: a small choice between two kinds of help for the Grubnash fight. */
D.DISCOVERIES.goblin_satchel = { name: 'A goblin’s satchel', place: 'willowbrook', text: 'One of the goblins drops a scruffy satchel. Inside: a brass buckle, a half-eaten turnip and a note in big angry letters: “ALL GOBLINS TO THE HILL FORT. PRACTISE WAR CRY. — GRUBNASH”.',
  when: (ev, key) => ev === 'kill' && key === 'goblin' && T() === 'willowbrook', rate: 1 / 3, pity: 4,
  choices: [
    { id: 'orrin', label: 'Take the note to Sergeant Orrin (+60 Melee and Defence XP)', text: 'Orrin reads it twice, then shows you how goblins telegraph a war cry: a deep breath, a stamp, then the shout. You will see it coming now.', reward: { xp: { attack: 60, defence: 60 } } },
    { id: 'buckle', label: 'Sell the brass buckle (+40 coins)', text: 'The smith gives you a fair price for the buckle, enough to put towards a piece of armour.', reward: { coins: 40 } }
  ] };
const total = () => Object.keys(D.DISCOVERIES).length;

/* ---------- Three adventures, built from ordinary quests ---------- */
const Q = (id, town, name, giver, req, secret, blurb, obj, reward, chain, stage) => ({ id, town, name, giver, adv: 1, req, secret, blurb, obj, reward, adventure: chain, stage });
const ADVENTURES = {
  mill: { name: 'The Miller’s Map', stages: 3 },
  lantern: { name: 'The Lantern Under Ironpeak', stages: 3 },
  star: { name: 'The Fallen Star', stages: 3 }
};
D.ADVENTURES = ADVENTURES;
[
  Q('am_map', 'willowbrook', 'A Map in the Bark', 'Elder Wren', null, 'weathered_map', 'That’s the old Bramble Mill on your map, pet, just beyond Mossbarrow. Nobody has been up there since the miller vanished. Cut oak for the damaged door and pack cooked shrimp for the journey. Then ask Bramble about the mill. She knew him better than anyone.',
    [{ ev: 'chop', key: 'oak', n: 15, label: 'Chop 15 oak logs for the mill door' }, { ev: 'deliver', key: 'shrimp', n: 8, label: 'Pack 8 cooked shrimp for the road' }], { xp: { woodcutting: 400, cooking: 200 }, coins: 120 }, 'mill', 1),
  Q('am_mill', 'mossbarrow', 'The Bramble Mill', 'Granny Bramble', 'am_map', 'weathered_map', 'There are scarecrows walking round the mill at night, dear. They were meant to keep the birds away, not the neighbours. Study how they move before you go near them, then clear them from the grounds. I’d like to see the old place again, if it’s safe.',
    [{ ev: 'guide', key: 'scarecrow', n: 1, label: 'Study the scarecrow in your field guide' }, { ev: 'kill', key: 'scarecrow', n: 8, label: 'Drive off 8 scarecrows at the mill' }], { xp: { attack: 500, strength: 500 }, coins: 250 }, 'mill', 2),
  Q('am_box', 'mossbarrow', 'The Miller’s Strongbox', 'Granny Bramble', 'am_mill', 'weathered_map', 'We found a strongbox inside the mill. The lock is seized, but we ought to be able to make a replacement key from bronze. There’s a note on the lid: “For whoever keeps the village fed.” Smelt the metal and help bring in the harvest. I think my brother would have approved of that.',
    [{ ev: 'smelt', key: 'bar_bronze', n: 5, label: 'Smelt 5 bronze bars for a new key' }, { ev: 'harvest', key: '*', n: 5, label: 'Bring in 5 harvests, as the miller would have' }], { xp: { smithing: 600, farming: 400 }, coins: 400, items: { millers_bell: 1 } }, 'mill', 3),

  Q('al_lantern', 'ironpeak', 'A Lantern in the Ore', 'Foreman Dunmore', null, 'rusted_lantern', 'I know that mark on the lantern. My father used to stamp it into the brass. He went down to the drowned gallery forty winters ago and never came back. If you mean to look for his workshop, clear the old shaft and smelt iron for the supports. Please don’t go down until it’s safe.',
    [{ ev: 'mine', key: '*', n: 40, label: 'Mine 40 ore to clear the old shaft' }, { ev: 'smelt', key: 'bar_iron', n: 10, label: 'Smelt 10 iron bars for supports' }], { xp: { mining: 2000, smithing: 1200 }, coins: 600 }, 'lantern', 1),
  Q('al_gallery', 'ironpeak', 'The Drowned Gallery', 'Foreman Dunmore', 'al_lantern', 'rusted_lantern', 'The gallery’s flooded to the knee, and raiders have made a camp in it. There are trolls farther in, where the water gets deeper. Study the trolls before you start clearing the place. I want to know what happened to my father. I don’t want another family waiting for someone to come back.',
    [{ ev: 'guide', key: 'troll', n: 1, label: 'Study the mountain troll in your field guide' }, { ev: 'kill', key: 'raider', n: 12, label: 'Clear 12 raiders from the gallery' }, { ev: 'kill', key: 'troll', n: 4, label: 'Wake and defeat 4 trolls' }], { xp: { attack: 2500, defence: 2500 }, coins: 1200 }, 'lantern', 2),
  Q('al_rest', 'ironpeak', 'The Lamplighter’s Rest', 'Foreman Dunmore', 'al_gallery', 'rusted_lantern', 'We found his workbench. The lens is still in its frame, half finished. Would you help finish the fittings? And cook something for the miners who cleared the way with you. I need a moment before I go back in there. I’ll join you when I can.',
    [{ ev: 'craft', key: '*', n: 5, label: 'Craft 5 items at the lamplighter’s bench' }, { ev: 'cook', key: '*', n: 15, label: 'Cook 15 meals for the miners' }], { xp: { crafting: 1500, cooking: 1200 }, coins: 1500, items: { lamplighter_lens: 1 } }, 'lantern', 3),

  Q('af_star', 'skyreach', 'A Shard of Starlight', 'Brother Aldous', null, 'star_shard', 'I saw a star fall beyond the Hollow Crown last winter. The storm hawks have been restless ever since, and the golems aren’t helping anyone get close enough to investigate. Deal with the hawks and golems first. Then we can have a proper look at that shard of yours.',
    [{ ev: 'kill', key: 'hawk', n: 15, label: 'Calm 15 storm hawks' }, { ev: 'kill', key: 'golem', n: 8, label: 'Quiet 8 cloud golems' }], { xp: { ranged: 6000, magic: 4000 }, coins: 3000 }, 'star', 1),
  Q('af_fall', 'hollow', 'Where the Star Fell', 'The Last Warden', 'af_star', 'star_shard', 'The star fell into that crater. Shades gather around it, and horrors wait along the rim. They are feeding on its light. Read what the field guide says about the shades before you go down, then clear a path. I have watched this place alone for a long time. I would be glad of your help.',
    [{ ev: 'guide', key: 'shade', n: 1, label: 'Study the shade in your field guide' }, { ev: 'kill', key: 'shade', n: 15, label: 'Drive 15 shades from the crater' }, { ev: 'kill', key: 'horror', n: 6, label: 'Defeat 6 horrors at the rim' }], { xp: { attack: 8000, strength: 8000 }, coins: 6000 }, 'star', 2),
  Q('af_home', 'hollow', 'Starlight Returned', 'The Last Warden', 'af_fall', 'star_shard', 'The star’s heart is still glowing at the bottom of the crater. It will need a strong setting if you are to carry it safely. Forge the fittings and return your shard to the heart. Then take it somewhere people can share its light. It has spent long enough down here.',
    [{ ev: 'smith', key: '*', n: 10, label: 'Smith 10 pieces for a worthy setting' }, { ev: 'deliver', key: 'star_shard', n: 1, label: 'Return the star shard to its heart' }], { xp: { smithing: 6000, crafting: 4000 }, coins: 8000, items: { star_heart: 1 } }, 'star', 3)
].forEach(q => { D.QUESTS.push(q); D.QM[q.id] = q; });

/* ---------- The Silent Bells (Hero 18–28): the midgame story ----------
   Not a secret: it begins in Mossbarrow at Hero 18 and crosses to Saltmere. Recurring faces (Granny Bramble from the
   Miller's Map, Harbourmaster Ilsa, Sergeant Orrin from Willowbrook), one mystery (who is buying up the realm's bells?)
   and one lasting decision (the smugglers' ledger) that changes later dialogue, a quest-giver and the reward. It also
   remembers earlier choices: the goblin satchel, the lost traveller, and whether you finished the Miller's Map. */
ADVENTURES.bells = { name: 'The Silent Bells', stages: 6 };
const B = (id, town, name, giver, adv, req, blurb, obj, reward, stage, extra) => Object.assign({ id, town, name, giver, adv, req, blurb, obj, reward, adventure: 'bells', stage }, extra || {});
[
  B('bl_silence', 'mossbarrow', 'The Silent Bells', 'Granny Bramble', 18, null, '',
    [{ ev: 'kill', key: 'wolf', n: 10, label: 'Drive off 10 wolves stirred up on the night of the theft' }, { ev: 'chop', key: 'oak', n: 20, label: 'Chop 20 oak logs for a temporary bell frame' }],
    { xp: { attack: 1500, woodcutting: 800 }, coins: 600 }, 1),
  B('bl_road', 'saltmere', 'Salt on the Boots', 'Harbourmaster Ilsa', 20, 'bl_silence', '',
    [{ ev: 'guide', key: 'bandit', n: 1, label: 'Study the coast-road bandits in your field guide' }, { ev: 'kill', key: 'bandit', n: 12, label: 'Clear 12 bandits from the coast road' }],
    { xp: { strength: 2000, defence: 1000 }, coins: 900 }, 2),
  B('bl_ledger', 'saltmere', "Mother Silt's Ledger", 'Harbourmaster Ilsa', 22, 'bl_road', 'Mother Silt keeps accounts of every load that passes through the coves, including the stolen bells. One of her smugglers carries the ledger. Fish among the people on the shore and watch their movements, then take it back from the smugglers. With names and dates, I can do more than merely accuse them.',
    [{ ev: 'catch', key: '*', n: 25, label: 'Fish 25 catches at the coves while you watch' }, { ev: 'kill', key: 'smuggler', n: 10, label: 'Take the ledger from the smugglers (10 defeated)' }],
    { xp: { attack: 2000, fishing: 1200 }, coins: 1200 }, 3, {
      choices: [
        { id: 'ilsa', label: 'Hand the ledger to Harbourmaster Ilsa', text: 'Ilsa reads it by lamplight, jaw tight. “Names, dates, ships. Enough to hang half the coast.” The harbour wardens will move at dawn.' },
        { id: 'silt', label: 'Return it to Mother Silt, for a favour', text: 'Mother Silt weighs the ledger in one hand and you in the other. “Honest thieves are rare. I owe you, and I pay my debts.” She ties a knot of tarred rope around your finger.' }
      ] }),
  B('bl_orrin', 'saltmere', 'An Old Friend in Port', 'Sergeant Orrin', 24, 'bl_ledger', '',
    [{ ev: 'kill', key: 'pirate', n: 8, label: 'Defeat 8 pirates crewing the bell ship' }, { ev: 'cook', key: '*', n: 20, label: 'Cook 20 meals for the night watch' }, { ev: 'smith', key: '*', n: 10, label: 'Mend the harbour chain (smith 10 pieces)' }],
    { xp: { attack: 3000, strength: 3000 }, coins: 1500 }, 4),
  B('bl_tide', 'saltmere', 'The Bells Below the Tide', 'Harbourmaster Ilsa', 26, 'bl_orrin', '',
    [{ ev: 'boss', key: 'barnacle', n: 1, label: 'Defeat Captain Barnacle and open his hold' }],
    { xp: { attack: 4000, strength: 4000, defence: 4000 }, coins: 2500 }, 5),
  B('bl_ring', 'mossbarrow', 'Ring It Home', 'Granny Bramble', 28, 'bl_tide', 'The chapel bell is back, dear. We’ve got it on a cart, the right way round this time. Help bring in the harvest for the celebration and make a new rope and fittings. I want everyone here when we raise it. Some of them have forgotten what it sounds like.',
    [{ ev: 'harvest', key: '*', n: 10, label: 'Bring in 10 harvests for the garlands' }, { ev: 'craft', key: '*', n: 5, label: 'Craft 5 items for a new bell rope and fittings' }],
    { xp: { crafting: 2500, farming: 2000 }, coins: 2500 }, 6)
].forEach(q => { D.QUESTS.push(q); D.QM[q.id] = q; });

/* ---------- Lasting choices ----------
   A quest with `choices` asks for a decision when it is claimed; discoveries keep theirs. DQ.choiceOf reads either, so
   later text, quest-givers and rewards can depend on what you chose. Saved in S().choices (older saves simply have none). */
DQ.choiceOf = key => (S().choices && S().choices[key]) || (disc()[key] && disc()[key].choice) || null;
const said = (key, map, fallback) => map[DQ.choiceOf(key)] ?? fallback;
const qdone = id => DQ.questState && D.QM[id] && DQ.questState(D.QM[id]) === 'done';
const vary = (id, props) => { const q = D.QM[id]; if (!q) return; for (const [k, get] of Object.entries(props)) Object.defineProperty(q, k, { get, configurable: true, enumerable: true }); };
vary('bl_silence', {
  blurb: () => `${qdone('am_box') ? 'We only just got the miller’s bell back, dear, and now somebody has taken the chapel bell. ' : 'Somebody took our chapel bell in the night, dear. '}There are salt-stained boot prints by the tower, and the wolves were stirred up to cover the noise. Drive them away from the farms and cut oak for a temporary bell frame. Then we can follow those prints without leaving the village in a mess.`,
  thanks: () => 'The prints head west towards the sea. Ask Harbourmaster Ilsa in Saltmere about them, dear. If anyone has seen a cart carrying a stolen bell, she will have.'
});
vary('bl_road', {
  blurb: () => `${DQ.choiceOf('lost_traveller') === 'share' ? 'You fed my niece when she was lost on the jetty. Thank you; she has not stopped talking about it. ' : DQ.choiceOf('lost_traveller') === 'directions' ? 'You helped my niece find her way home along the coast road. I appreciate that. ' : ''}I’ve seen your bell, wrapped in sailcloth on a cart bound for the smugglers’ coves. Paid bandits are keeping people off that stretch of coast. Study how they fight, then clear the road so we can follow the cart.`,
  thanks: () => 'The cart reached the coves. Someone is paying well for old bells, and Mother Silt is keeping the accounts. We need to see her ledger.',
  reward: () => DQ.choiceOf('lost_traveller') === 'share' ? { xp: { strength: 2000, defence: 1000 }, coins: 1200 } : { xp: { strength: 2000, defence: 1000 }, coins: 900 }
});
vary('bl_ledger', { thanks: () => '' });
vary('bl_orrin', {
  blurb: () => `I came from Willowbrook as soon as I heard. Grubnash’s surviving goblins have hired themselves out as deckhands. The pirates they’re working for are carrying our bell. ${said('goblin_satchel', { orrin: 'You brought me the chief’s orders before. I trust you to find out what this lot are planning.', buckle: 'I hope that brass buckle paid for useful equipment. You’ll want it when we board.' }, '')} ${said('bl_ledger', { ilsa: 'Ilsa has a cutter ready for us.', silt: 'Mother Silt’s people have told us where the pirates anchor.' }, 'We know where to find the ship now.')} Deal with the pirate crew, cook for the night watch and help forge replacement pieces for the harbour chain. We need everything ready before we move.`.replace(/\s+/g, ' ').trim(),
  thanks: () => `${said('goblin_satchel', { orrin: 'You’ve come a long way since that satchel at the east farms. ', buckle: 'You’ve put that equipment to good use. ' }, '')}The pirates told us where the bells went: Captain Barnacle’s hold. He isn’t going to hand them over willingly.`
});
vary('bl_tide', {
  giver: () => DQ.choiceOf('bl_ledger') === 'silt' ? 'Mother Silt' : 'Harbourmaster Ilsa',
  blurb: () => DQ.choiceOf('bl_ledger') === 'silt'
    ? 'Barnacle stole from me as well. His hold is full of bells, including the one you came looking for. Defeat him and you can take Mossbarrow’s bell home. Keep that knot I gave you; my people will recognise it and know whose side you’re on.'
    : 'Barnacle’s hold is full of stolen bells. The ledger gives us the names of the ships that carried them, so we can prove where they belong. Defeat him and my wardens will see the bells returned. You won’t have to carry them all home yourself.',
  reward: () => ({ xp: { attack: 4000, strength: 4000, defence: 4000 }, coins: 2500, items: { [DQ.choiceOf('bl_ledger') === 'silt' ? 'smugglers_knot' : 'wardens_greathelm']: 1 } }),
  thanks: () => DQ.choiceOf('bl_ledger') === 'silt' ? 'There’s Mossbarrow’s bell. Take it home, with my compliments. I’ll arrange the return of the others. There may be a small handling fee. I did say I was on your side, not that I’d retired.' : 'The bells are safe, and the wardens are arranging their return. Take this greathelm. You stood with us when the harbour needed you, and I want you properly equipped for whatever comes next.'
});
vary('bl_ring', {
  thanks: () => `Listen to that, dear. The bell’s ringing and every dog in the valley wants to join in. I’d almost forgotten how noisy home could be. There’s something else you should know: the ledger names a buyer in Ironpeak. A pale stranger who paid in voidstone and used a faceless crown as his signature.${DQ.choiceOf('bl_ledger') === 'silt' ? ' Mother Silt has sent word that she knows more about him. Speak to her when you’re ready.' : ' Ilsa has sent that page to Captain Hrod at Ironpeak. He’ll be expecting you.'}`
});
/* earlier choices echo later */
vary('chiefs_end', {
  blurb: () => `Grubnash has dug himself into the hill fort and decided that makes him a king. His goblins are using it as a base for the farm raids. We need him out of there. You need combat level 8 to face him.${DQ.choiceOf('goblin_satchel') === 'orrin' ? ' Remember the note you brought me: he takes a deep breath and stamps before his war cry. Watch for that warning.' : ' Read his field-guide entry and take food. His war cry is meant to frighten you into making a mistake.'}`
});
const lateThanks = {
  frostmaw_hunt: () => `The pass is open, and our supply carts are coming through. ${qdone('bl_ring') ? 'We found stolen bells in Frostmaw’s den, packed for a buyer farther up the mountain. The payment was voidstone, just as it was in that ledger.' : 'The troll was guarding something deeper in the ice. We’ll find out what, now the road is safe.'} You’ve given the hold room to breathe.`,
  witchs_bane: () => `The graves are staying shut. I’ve checked them twice; old habits are difficult to put down. ${qdone('bl_ring') ? 'There was a letter in Morwenna’s hut, written in the same hand as the ledger. It asks for bells and lights to be taken away so the Crown can have silence.' : 'I found a letter in her hut, sealed with a faceless crown. Someone else was involved in this.'} Thank you for bringing our people some peace.`,
  wyrm_slayer: () => `The wardens are coming home. We can repair the roofs without wondering which one Pyrrhax will burn next. ${DQ.choiceOf('ashen_anvil') === 'quench' ? 'That old anvil you restored rang as the wyrm fell. Kael says he wasn’t touching it.' : DQ.choiceOf('ashen_anvil') === 'citadel' ? 'Kael’s apprentices are making a new banner with fittings from the wyrm’s scales. They’ve put your name on it.' : 'Listen to the citadel bells. Nobody has dared ring them like that in a year.'}`,
  storm_breaker: () => 'The bridges are safe again, and the monks can travel between the peaks. I believe the storms were fleeing something beyond us: the silence spreading from the Hollow Crown. Rest here before you follow it. You’ve done enough for one day.',
  crownfall: () => `The King is gone. The bells can go home, and so can you. People will want to hear what happened. ${qdone('bl_ring') ? 'Mossbarrow will ring its bell when you arrive. I think the others will follow.' : 'There is light in the throne room again. I had forgotten how much of it the windows could let in.'} I shall be glad to have a different story to tell them.`
};
for (const [id, f] of Object.entries(lateThanks)) vary(id, { thanks: f });
/* the anvil remembers: Kael pays the citadel path, the quenched anvil forges cores */
vary('wyrm_slayer', { reward: (() => { const base = D.QM.wyrm_slayer && JSON.parse(JSON.stringify(D.QM.wyrm_slayer.reward || {})); return () => { const r = JSON.parse(JSON.stringify(base || {})); if (DQ.choiceOf('ashen_anvil') === 'quench') r.items = Object.assign({}, r.items, { ember_core: 3 }); else if (DQ.choiceOf('ashen_anvil') === 'citadel') r.coins = (r.coins || 0) + 15000; return r; }; })() });
/* claiming a quest that asks for a decision */
const claimDecide0 = DQ.claimQuest;
DQ.claimQuest = (id, choice) => {
  const q = D.QM[id];
  if (q && q.choices && !DQ.choiceOf(id) && DQ.questState(q) === 'ready') {
    let pick = q.choices.find(c => c.id === choice);
    if (!pick && DQ.started && !(DQ.sim && DQ.sim.on) && UI.openQuestChoice) { UI.openQuestChoice(id); return; }
    pick = pick || q.choices[0];
    S().choices = S().choices || {}; S().choices[id] = pick.id;
    if (DQ.journal) DQ.journal('choice', `${q.name}: you chose to ${pick.label.replace(/^./, m => m.toLowerCase())}.`, 'flag');
    q._lastChoiceText = pick.text;
  }
  return claimDecide0(id);
};
UI.openQuestChoice = id => {
  const q = D.QM[id];
  DQ.modal({ title: q.name, wide: true, body: `<div class="quest-choice"><p>${esc(q.blurb)}</p><p class="k">A decision that will be remembered</p></div>`,
    actions: [...q.choices.map((c, i) => ({ label: c.label, primary: i === 0, fn: () => { DQ.closeModal(); DQ.claimQuest(id, c.id); DQ.modal({ title: q.name, body: `<p>${esc(c.text)}</p>`, actions: [{ label: 'Continue', primary: true }] }); return false; } })), { label: 'Not yet' }] });
};

/* secret quests stay hidden until their discovery is made */
const unlocked0 = DQ.questUnlocked;
DQ.questUnlocked = q => (!q.secret || DQ.discovered(q.secret)) && unlocked0(q);
DQ.questHidden = q => !!q.secret && !DQ.discovered(q.secret);

/* ---------- Artefacts become village projects ---------- */
Object.assign(D.PROJECTS, {
  bell: { town: 'willowbrook', relic: 'millers_bell', name: 'Hang the Miller’s Bell', cost: { millers_bell: 1, coins: 100 }, reward: '+3% coins from every source.', story: 'The Miller’s Bell hangs on the green again and rings for every harvest.', fx: { coin: .03 } },
  lamps: { town: 'willowbrook', relic: 'lamplighter_lens', name: 'Light the village square', cost: { lamplighter_lens: 1, coins: 500 }, reward: 'Gathering is 2% faster.', story: 'Lamps with the lamplighter’s lens keep the square bright long after dusk.', fx: { gather: .02 } },
  star: { town: 'willowbrook', relic: 'star_heart', name: 'Raise the Star-heart above the well', cost: { star_heart: 1, coins: 2000 }, reward: '+3% XP to every skill.', story: 'The Star-heart glows softly above the well, and nobody in Willowbrook has a bad dream any more.', fx: { xpAll: .03 } }
});
Object.assign(D.PROJECT_VOICES, {
  bell: ['Elder Wren', 'It rang for the harvest once. Now it rings for you.'],
  lamps: ['Foreman Dunmore', 'He always said a village should never be dark. Rest easy, old friend.'],
  star: ['Brother Aldous', 'I walked all the way down from Skyreach to see it. It was worth every step.']
});
/* a relic project only appears once you hold its artefact (or have already displayed it) */
const forTown0 = DQ.projectsForTown;
DQ.projectsForTown = town => forTown0(town).filter(([id, p]) => !p.relic || S().projects[id] || DQ.have(p.relic) > 0);

/* ---------- Making a discovery ---------- */
const give = r => { if (!r) return; Object.entries(r.xp || {}).forEach(([k, v]) => DQ.addXp(k, v, { raw: true })); if (r.coins) DQ.addCoins(r.coins); Object.entries(r.items || {}).forEach(([k, v]) => DQ.grant(k, v)); };
DQ.makeDiscovery = (id, o = {}) => {
  const d = D.DISCOVERIES[id]; if (!d || DQ.discovered(id)) return false;
  const away = !!(DQ.sim && DQ.sim.on);
  disc()[id] = { at: Date.now(), town: S().town, away };
  if (d.item) DQ.grant(d.item, 1);
  give(d.reward);
  if (DQ.skillUnlocked && DQ.skillUnlocked('exploration')) DQ.addXp('exploration', 120);
  DQ.log(`Discovery: ${d.name}.`, 'quest');
  if (away) (DQ.awayFinds = DQ.awayFinds || []).push(id);
  else if (!DQ.forecasting) {
    DQ.sfx('discover');
    DQ.notify({ kind: 'unlock', key: 'feature:discovery-' + id, icon: 'star', col: '#bfe8ff', title: `Discovery: ${d.name}`, text: d.quest ? 'It could be the start of an adventure.' : d.choices ? 'Someone needs your help.' : 'A small piece of the realm’s history.', action: { label: 'Read it', fn: () => UI.openDiscovery(id) }, sound: false, burst: true, ttl: 14000 });
  }
  DQ.emit('discovery', id); DQ.emit('quests');
  return true;
};
/* one cheap check per gathering/combat event, skipped entirely in forecasts */
const qev0 = DQ.qev;
DQ.qev = (ev, key, n = 1) => {
  qev0(ev, key, n);
  if (DQ.forecasting || !S()) return;
  const counts = (disc()._n = disc()._n || {});
  for (const [id, d] of Object.entries(D.DISCOVERIES)) {
    if (DQ.discovered(id)) continue;
    let ok = false; try { ok = d.when(ev, key); } catch (e) { ok = false; }
    if (!ok) continue;
    counts[id] = (counts[id] || 0) + n;
    if (counts[id] >= d.pity || Math.random() < 1 - Math.pow(1 - d.rate, n)) { DQ.makeDiscovery(id); break; }
  }
};
DQ.chooseDiscovery = (id, choice) => {
  const d = D.DISCOVERIES[id], rec = disc()[id]; if (!d || !rec || rec.choice || !d.choices) return false;
  const c = d.choices.find(x => x.id === choice); if (!c) return false;
  if (c.needItem) { if (DQ.have(c.needItem) < 1) { DQ.toast(`You need ${D.ITEMS[c.needItem].name.toLowerCase()} for that`, true); return false; } DQ.take(c.needItem, 1); }
  if (c.need) {
    const foods = DQ.foods().filter(f => DQ.have(f) > 0).sort((a, b) => DQ.have(b) - DQ.have(a));
    if (foods.reduce((n, f) => n + DQ.have(f), 0) < c.need) { DQ.toast(`You need ${c.need} cooked meals to share`, true); return false; }
    let left = c.need; for (const f of foods) { const t = Math.min(left, DQ.have(f)); DQ.take(f, t); left -= t; if (!left) break; }
  }
  rec.choice = choice; give(c.reward); DQ.emit('discovery', id); DQ.save(); return true;
};

/* ---------- Reading and revisiting discoveries ---------- */
UI.openDiscovery = id => {
  const d = D.DISCOVERIES[id], rec = disc()[id]; if (!d || !rec) return;
  const q = d.quest && D.QM[d.quest], st = q ? DQ.questState(q) : null;
  const choice = d.choices && (rec.choice ? d.choices.find(c => c.id === rec.choice) : null);
  const body = `<div class="discovery-read"><p class="disc-place">${esc(D.TOWN[d.place].name)}</p><p>${esc(d.text)}</p>
    ${choice ? `<p class="ok">${esc(choice.text)}</p>` : ''}
    ${d.reward ? `<p class="dim">Found: ${esc(DQ.rewardText(d.reward).join(' · '))}</p>` : ''}
    ${q ? `<p class="dim">Adventure: <b>${esc(ADVENTURES[q.adventure].name)}</b>. ${st === 'new' ? `Speak to ${esc(q.giver)} in ${esc(D.TOWN[q.town].name)} to begin.` : st === 'locked' ? esc(DQ.questBlockers(q).join(' · ')) : 'Underway in your quest log.'}</p>` : ''}</div>`;
  const actions = [];
  if (d.choices && !rec.choice) d.choices.forEach((c, i) => actions.push({ label: c.needItem ? `${c.label} (${DQ.have(c.needItem)} held)` : c.label, primary: i === 0, fn: () => { if (!DQ.chooseDiscovery(id, c.id)) return false; UI.openDiscovery(id); return false; } }));
  if (q && st === 'new') actions.push({ label: 'Begin the adventure', primary: true, fn: () => { DQ.startQuest(q.id); UI.questTab = 'active'; DQ.go('quests'); } });
  else if (q) actions.push({ label: 'Open quest log', fn: () => { UI.questTab = st === 'done' ? 'done' : 'active'; DQ.go('quests'); } });
  actions.push({ label: 'Close' });
  DQ.modal({ title: d.name, wide: true, body, actions });
};
Object.assign(UI.DO, { discovery: id => UI.openDiscovery(id) });
UI.discoveriesPanel = () => {
  const found = Object.keys(D.DISCOVERIES).filter(DQ.discovered), left = total() - found.length;
  const advs = Object.entries(ADVENTURES).map(([k, a]) => { const qs = D.QUESTS.filter(q => q.adventure === k), done = qs.filter(q => DQ.questState(q) === 'done').length; return { k, a, qs, done, started: qs.some(q => S().q[q.id]) || DQ.discovered(qs[0].secret) }; }).filter(x => x.started);
  return `<section class="panel discoveries"><div class="phead"><div><span class="k">Secrets of the realm</span><h2>Discoveries</h2></div><small>${found.length} of ${total()} found</small></div>
    ${found.length ? `<div class="disc-list">${found.map(id => { const d = D.DISCOVERIES[id]; return `<button class="disc-card" data-do="discovery" data-a="${id}"><span class="disc-ic">${DQ.ico('star')}</span><span><b>${esc(d.name)}</b><small>${esc(D.TOWN[d.place].name)}${disc()[id].away ? ' · found while you were away' : ''}</small></span></button>`; }).join('')}</div>` : '<p class="dim">Nothing yet. Rare finds turn up while you gather and fight around the realm.</p>'}
    ${left ? `<p class="hint">${left} more ${left === 1 ? 'secret waits' : 'secrets wait'} somewhere out there.</p>` : '<p class="ok">Every secret found.</p>'}
    ${advs.length ? `<h3>Adventures</h3><div class="adv-list">${advs.map(x => `<div class="adv-row"><b>${esc(x.a.name)}</b><span class="bar"><i style="width:${Math.round(x.done / x.a.stages * 100)}%"></i></span><small>${x.done} / ${x.a.stages} chapters</small></div>`).join('')}</div>` : ''}</section>`;
};
const explore0 = UI.V.exploration;
if (explore0) UI.V.exploration = () => explore0() + UI.discoveriesPanel();
/* discoveries can happen before Exploration unlocks, so its locked page lists them too */
const locked0 = UI.lockedPage;
if (locked0) UI.lockedPage = id => locked0(id) + (id === 'exploration' && Object.keys(D.DISCOVERIES).some(DQ.discovered) ? UI.discoveriesPanel() : '');

/* the field guide counts as studying a creature */
const guide0 = UI.openGuide;
/* Studying for an adventure means something: the quest-giver's notes reveal the creature's weak points (display only, derived
   from the quest's own progress, so nothing new is saved), and the guide says which weapon to bring. */
const studyQuest = id => D.QUESTS.find(q => q.obj.some(o => o.ev === 'guide' && o.key === id) && S().q[q.id]);
const studied = id => { const q = studyQuest(id); if (!q) return false; const st = S().q[q.id], i = q.obj.findIndex(o => o.ev === 'guide' && o.key === id); return st.s === 'done' || st.s === 'ready' || (st.p && st.p[i] >= 1); };
const weak0 = DQ.weakKnown;
if (weak0) DQ.weakKnown = m => weak0(m) || (!!m && studied(m.id));
const WEAPON = { stab: 'a dagger', slash: 'a sword', crush: 'a warhammer', pierce: 'a bow and arrows', fire: 'a fire spell', frost: 'a frost spell', storm: 'a storm spell', aether: 'an aether spell' };
const studyNote = id => {
  const q = studyQuest(id), m = D.MON[id]; if (!q || !m || !studied(id) || !DQ.weakOf || !UI.weakChips) return '';
  const w = DQ.weakOf(m), bring = w.weak.map(t => WEAPON[t]).filter(Boolean);
  return `<div class="gsec study-note" style="--c:${m.col}"><div class="gh"><b>${esc(q.giver)}’s notes</b><small>${esc(q.name)}</small></div><div class="chips">${UI.weakChips(m)}</div><p>${bring.length ? `Bring ${esc(bring.join(' or '))}: weak points take +${Math.round((DQ.typeMult(m, 'weak') - 1) * 100)}% damage.` : 'It has no obvious weakness. Bring your strongest gear and plenty of food.'}</p></div>`;
};
if (guide0) UI.openGuide = id => {
  const r = guide0(id); if (DQ.forecasting) return r;
  DQ.qev('guide', id);
  /* a creature someone told you about is named and pictured in the guide before you meet it, with their notes */
  const m = D.MON[id], q = studyQuest(id);
  if (m && q && studied(id) && DQ.research(m).rank < 1) { const h = document.querySelector('.modal .ghead'); if (h) { const t = h.querySelector('.gtitle h3'), sm = h.querySelector('.gtitle > small'), sp = h.querySelector('.gsprite');
    if (t) t.textContent = m.name; if (sm) sm.textContent = `Not met yet · ${q.giver} told you about it · ${D.TOWN[m.town].name}, level ${m.cl}`; if (sp) sp.innerHTML = DQ.monSprite(m, 96, 'bob'); } }
  const note = studyNote(id), col = note && document.querySelector('.modal .gcol-know .gcol-h'), head = note && document.querySelector('.modal .ghead');
  if (!document.querySelector('.modal .study-note')) { if (col) col.insertAdjacentHTML('afterend', note); else if (head) head.insertAdjacentHTML('afterend', note); }
  return r;
};
/* "Continue quest" on a study objective opens the guide itself; a relic hand-in goes to the quest to claim it */
const objPage0 = DQ.objPage;
if (objPage0) DQ.objPage = (q, o) => o.ev === 'guide' ? 'bestiary' : o.ev === 'deliver' && D.ITEMS[o.key] && D.ITEMS[o.key].type === 'relic' ? 'quests' : objPage0(q, o);
const cont0 = UI.DO.questcontinue;
if (cont0) UI.DO.questcontinue = id => {
  const q = D.QM[id], st = S().q[id], o = q && q.obj.find((o, j) => DQ.objProg(q, st, j) < o.n);
  if (o && o.ev === 'guide' && UI.openGuide) return UI.openGuide(o.key);
  return cont0(id);
};

/* found while away: listed in the welcome-back summary */
const extras0 = UI.returnExtras;
UI.returnExtras = sum => { const h = extras0 ? extras0(sum) : ''; const f = (DQ.awayFinds || []).splice(0); return h + (f.length ? `<div class="k" style="margin:14px 0 6px">Discovered while you were away</div><div class="btnrow wrap">${f.map(id => `<button class="btn sm" data-do="discovery" data-a="${id}">${DQ.ico('star')} ${esc(D.DISCOVERIES[id].name)}</button>`).join('')}</div>` : ''); };

/* milestone flourishes: an adventure's last chapter, and the first arrival in a region */
const claim0 = DQ.claimQuest;
DQ.claimQuest = (id, ...rest) => { const q = D.QM[id], before = q && DQ.questState(q); const r = claim0(id, ...rest); if (q && q.adventure && q.stage === ADVENTURES[q.adventure].stages && before === 'ready' && DQ.questState(q) === 'done') setTimeout(() => DQ.sfx('adventure'), 400); return r; };
const travel0 = DQ.travel;
if (travel0) DQ.travel = id => { const first = !(S().towns[id] && S().towns[id].visited); const r = travel0(id); if (first && S().town === id) DQ.sfx('region'); return r; };

/* ---------- Keepsake recovery ----------
   Relics can no longer be sold, but saves from before that rule may have lost one. Each relic is restored (one copy) only when
   it was legitimately earned and has not yet been used by its quest or project; nothing is duplicated and no reward repeats. */
const done = id => S().q[id] && S().q[id].s === 'done';
DQ.RELIC_LIFECYCLE = {
  weathered_map: () => DQ.discovered('weathered_map'),
  rusted_lantern: () => DQ.discovered('rusted_lantern'),
  star_shard: () => DQ.discovered('star_shard') && !done('af_home'),
  millers_bell: () => done('am_box') && !S().projects.bell,
  lamplighter_lens: () => done('al_rest') && !S().projects.lamps,
  star_heart: () => done('af_home') && !S().projects.star
};
DQ.recoverRelics = () => {
  const back = [];
  for (const [id, owed] of Object.entries(DQ.RELIC_LIFECYCLE)) if (D.ITEMS[id] && owed() && DQ.have(id) < 1) { DQ.give(id, 1); back.push(id); }
  if (back.length) {
    const names = back.map(id => D.ITEMS[id].name).join(', ');
    DQ.log(`Recovered keepsake${back.length > 1 ? 's' : ''}: ${names}.`, 'quest');
    DQ.recoveredRelics = back;
  }
  return back;
};
/* run after every successful load or import, then tell the player once the game is on screen */
const tellRecovered = () => { const back = DQ.recoveredRelics; if (!back || !back.length) return; DQ.recoveredRelics = null;
  const go = () => DQ.notify({ kind: 'info', key: 'relics:recovered', icon: 'bag', col: '#d8b050', title: 'Keepsakes recovered', text: `${back.map(id => D.ITEMS[id].name).join(', ')} ${back.length > 1 ? 'are' : 'is'} back in your pack.` });
  if (DQ.started) go(); else setTimeout(() => DQ.started && go(), 2500); };
for (const name of ['load', 'importSave']) { const f0 = DQ[name]; if (f0) DQ[name] = (...a) => { const ok = f0(...a); if (ok && DQ.S) { DQ.recoverRelics(); tellRecovered(); } return ok; }; }
})();
