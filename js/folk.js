/* Folk: the people who give quests. Each has a code-drawn pixel portrait (32 × 32, original art) shown on their quests,
   and a quiet record on the People page that grows as you finish their quests. Notes are never labelled as unlocks:
   the page only shows what you already know, with no counts or hints of what is missing. */
(() => {
  const DQ = window.DQ, D = DQ.data, UI = DQ.ui, S = () => DQ.S, { esc, ico } = DQ;

  /* look: skin, hair [colour, style], beard [colour, style], hat [kind, colour], clothes, extras */
  const SKIN = { fair: ['#f2c9a0', '#d9a77c', '#b9825c'], light: ['#e8b98e', '#cc9a70', '#a87650'], tan: ['#c98e5e', '#a87048', '#84553a'], brown: ['#9a6640', '#7c4f30', '#5e3a24'], deep: ['#6e4428', '#56331d', '#3e2414'], pale: ['#e6dccf', '#c8bcac', '#a89a88'], dwarf: ['#e0a882', '#c48a64', '#a06a48'] };
  const F = [
    { n: 'Old Brannoc', id: 'brannoc', town: 'willowbrook', role: 'Retired miner', look: { skin: 'light', hair: ['#d8d8d0', 'bald'], beard: ['#e8e8e0', 'long'], hat: ['cap', '#6a5038'], clothes: '#7a5a3a', soot: 1, old: 1 },
      notes: [['meet', 'Spent forty years under the hill. Keeps a stool by the cold forge, mostly to grumble from.'], ['mq_smithing', 'Kept Smith Edda’s hammer and notebook when she left for the mountains. He has never read past the first page. He says the rest is hers.'], ['miners_pick', 'Named every pit prop in the old mine. The spare pickaxe he gave you was the one he never quite trusted himself with.'], ['mb_silver', 'Was right about the silver seam after all. He has told the whole tavern twice, and Mabel three times.']] },
    { n: 'Whisper', id: 'whisper', town: 'mossbarrow', role: 'Pickpocket', look: { skin: 'fair', hair: ['#3a2a2a', 'short'], hat: ['hood', '#4a3a6a'], clothes: '#3a2e4a', freckles: 1, grin: 1 },
      notes: [['meet', 'Grins before she speaks. Nobody in Mossbarrow knows her real name, and she likes it that way.'], ['mq_thieving', 'Took your purse to see whether you would chase her. Gave half your lesson fee to the children by the mill that same night.'], ['quick_fingers', 'Turns up wherever there are docks and deep pockets. Says the sea air is good for her fingers.']] },
    { n: 'Seamstress Hettie', id: 'hettie', town: 'mossbarrow', role: 'Seamstress', look: { skin: 'fair', hair: ['#e8e4dc', 'bun'], clothes: '#8a6a9a', glasses: '#c8a050', old: 1, tape: 1 },
      notes: [['meet', 'Has sewn every coat in Mossbarrow for fifty years and can tell whose is whose by the stitching alone.'], ['mq_crafting', 'Her hands shake now, but she still threads a needle first time. She kept a scrap of your first leather in her button tin.']] },
    { n: 'Hunter Wynn', id: 'wynn', town: 'mossbarrow', role: 'Hunter', look: { skin: 'tan', hair: ['#8a4a24', 'short'], beard: ['#8a4a24', 'short'], hat: ['hood', '#3e5a2e'], clothes: '#4a5a32' },
      notes: [['meet', 'Talks to the woods more than to people, and never lets anyone hunt with only a sword.'], ['mq_ranged', 'Carved his first bow at nine, from a branch Old Tusk had snapped. He has waited a long time for the rematch.'], ['boar_hunt', 'Leaves the smallest boars alone and will not say why.'], ['king_of_the_wood', 'Hung one of Old Tusk’s tusks over his door. He sat with it a whole evening before he could talk about the hunt.']] },
    { n: 'Archivist Merrow', id: 'merrow', town: 'saltmere', role: 'Archivist', look: { skin: 'brown', hair: ['#1e2a40', 'long'], clothes: '#2e6a6a', glasses: '#c8c8d0', ink: 1 },
      notes: [['meet', 'Smells of seawater and old paper. Dries spellbook pages on a washing line along the quay.'], ['mq_magic', 'Reads the drowned pages aloud at night, in case the words forget how they sound.']] },
    { n: 'Elder Wren', id: 'wren', town: 'willowbrook', role: 'Village elder', look: { skin: 'light', hair: ['#c8c4bc', 'long'], clothes: '#5a7a4a', shawl: '#8a6a3a', old: 1 },
      notes: [['meet', 'Has kept Willowbrook going through three bad winters and one very bad goblin chief. Knows everyone’s name, and their grandmother’s.'], ['first_steps', 'Fed you before she sent you anywhere. You cannot fix a well on an empty stomach, she says.'], ['wb_tattercaps', 'Sews tiny hats for the tattercaps she catches before letting them go. She thinks they are only copying the goblins.'], ['am_map', 'Knew the Bramble Mill miller when they were both young. Her hands were shaking when she turned the map over.']] },
    { n: 'Sergeant Orrin', id: 'orrin', town: 'willowbrook', role: 'Village sergeant', look: { skin: 'light', hair: ['#6a4a2a', 'short'], beard: ['#6a4a2a', 'moustache'], hat: ['helmet', '#9aa4ac'], clothes: '#8a2a2a' },
      notes: [['meet', 'Willowbrook’s only soldier, and its only drill sergeant. Polishes his helmet every morning whether it needs it or not.'], ['goblin_menace', 'Counts every goblin raid with a notch on a stick by the gate. The stick is getting short.'], ['chiefs_end', 'Fought Grubnash once, years ago, and lost. He told nobody until you came back from the hill fort.'], ['bl_orrin', 'Walked all the way to Saltmere to warn you. He had never seen the sea before and will not admit he liked it.']] },
    { n: 'Mabel the Cook', id: 'mabel', town: 'willowbrook', role: 'Cook', look: { skin: 'fair', hair: ['#c0602a', 'short'], hat: ['chef', '#f4f0e8'], clothes: '#e8e0d0', rosy: 1 },
      notes: [['meet', 'Feeds half the village from one small kitchen and somehow never runs out of pie.'], ['hungry_cook', 'Kept the burnt shrimp for herself and served you the best ones.'], ['wb_granary', 'Calls her best pie dish Gerald. She took the teeth marks very personally.']] },
    { n: 'Granny Bramble', id: 'bramble', town: 'mossbarrow', role: 'Farmer', look: { skin: 'light', hair: ['#d0ccc4', 'short'], hat: ['kerchief', '#b03a2a'], clothes: '#4a6a3a', rosy: 1, old: 1 },
      notes: [['meet', 'Runs the oldest farm in Mossbarrow and calls everyone “dear”, the goats included.'], ['egg_hunt', 'Knows each hen by name. The fat speckled one is Duchess, and she gets the warm corner.'], ['mb_bellhares', 'Was born under a bellhare moon. She leaves a carrot at the edge of the field every year, just in case.'], ['am_box', 'The miller was her brother. She has never said so, but she kept his note.'], ['bl_ring', 'Cried when the bell rang again, then told everyone it was the wind.']] },
    { n: 'Harbourmaster Ilsa', id: 'ilsa', town: 'saltmere', role: 'Harbourmaster', look: { skin: 'tan', hair: ['#e0c070', 'braids'], hat: ['tricorn', '#1e2a44'], clothes: '#2a3a5a', earring: 1 },
      notes: [['meet', 'Runs Saltmere harbour from memory: every ship, every berth, every debt.'], ['captains_bane', 'Lost her first ship to Barnacle’s crew. Its bell rope sits coiled on her desk.'], ['bl_ledger', 'Reads a smuggler’s ledger faster than a ballad, and out loud like one.'], ['bl_tide', 'Rang every recovered bell herself before sending it home. Her arms ached for a week and she was proud of it.']] },
    { n: 'Chef Piers', id: 'piers', town: 'saltmere', role: 'Chef', look: { skin: 'pale', hair: ['#1a1a1a', 'short'], beard: ['#1a1a1a', 'moustache'], hat: ['chef', '#f4f0e8'], clothes: '#e8e0d0' },
      notes: [['meet', 'Saltmere’s only chef, and the harbour feast’s only cook, as he will tell you.'], ['salt_cod', 'Learned to cook on a whaler. He will not say whose salt cod recipe it is, only that she would be proud.']] },
    { n: 'Smith Tolla', id: 'tolla', town: 'saltmere', role: 'Smith', look: { skin: 'deep', hair: ['#141414', 'short'], clothes: '#6a4a2a', apron: '#4a3020', soot: 1 },
      notes: [['meet', 'Works the forge with her sleeves rolled and her temper short. Bars first, then nails. Always that order.'], ['forged_in_salt', 'Hammers in time with the tide bell. She says it keeps her steady.'], ['sm_fleet', 'Named the first boat of the new fleet after her mother, and will not tell you which boat it is.']] },
    { n: 'Foreman Dagna', id: 'dagna', town: 'ironpeak', role: 'Mine foreman', look: { skin: 'dwarf', hair: ['#b0482a', 'braids'], hat: ['minecap', '#d8b040'], clothes: '#5a4a3a' },
      notes: [['meet', 'Has run Ironpeak’s deep shafts for thirty years without losing a miner.'], ['deep_vein', 'Can tell good ore from bad by the sound it makes when it falls.'], ['ip_gold', 'Wants the hall doors gilded so the mountain remembers who it belongs to, and because her grandmother saw them shine.']] },
    { n: 'Hearthkeeper Brunn', id: 'brunn', town: 'ironpeak', role: 'Hearthkeeper', look: { skin: 'dwarf', hair: ['#c0602a', 'short'], beard: ['#c0602a', 'full'], hat: ['wool', '#8a3a2a'], clothes: '#6a4a2e', rosy: 1 },
      notes: [['meet', 'Keeps the great hearth of Ironpeak burning. He has never once let it go out.'], ['frozen_catch', 'Hums while he cooks for three hundred. The tune is older than the hold.'], ['ip_frostpelt', 'Gives his own coat to whoever is cold on watch, then grumbles about the draught all night.']] },
    { n: 'Smith Grotta', id: 'grotta', town: 'ironpeak', role: 'Smith', look: { skin: 'dwarf', hair: ['#1e1a18', 'bald'], beard: ['#1e1a18', 'braided'], clothes: '#4a3a2e', apron: '#3a2a1e', soot: 1 },
      notes: [['meet', 'Speaks to the anvil before she speaks to you.'], ['dwarven_steel', 'Calls you kin now. She has not said that to anyone from outside the hold in twenty years.']] },
    { n: 'Captain Hrod', id: 'hrod', town: 'ironpeak', role: 'Captain of the watch', look: { skin: 'dwarf', hair: ['#9a9a94', 'short'], beard: ['#b4b4ac', 'full'], hat: ['horned', '#8a949c'], clothes: '#3a4a5a', scar: 1, old: 1 },
      notes: [['meet', 'Captain of the watch. His scar came from a troll, and you will hear the story whether you ask or not.'], ['ip_chimes', 'Takes the coldest watch himself and pretends it is the warmest.'], ['ip_raiders', 'Knows every watchman’s family, and sends sweets home whenever one is hurt.'], ['frostmaw_hunt', 'Has stood in Frostmaw’s shadow every winter of his life. He laughed out loud when the pass opened.']] },
    { n: 'Boatwright Sorrel', id: 'sorrel', town: 'gloomfen', role: 'Boatwright', look: { skin: 'brown', hair: ['#2a2018', 'short'], beard: ['#2a2018', 'stubble'], hat: ['brim', '#4a5030'], clothes: '#3e4a2e' },
      notes: [['meet', 'Builds boats that float on bog water, which everyone else says cannot be done.'], ['gf_lanterns', 'Lights a lantern for every boat that leaves, and does not put it out until the boat is back.'], ['gf_rivets', 'Keeps a rivet from every boat that ever sank, in a jar by the door. The jar is nearly full.']] },
    { n: 'Gravewarden Lysa', id: 'lysa', town: 'gloomfen', role: 'Gravewarden', look: { skin: 'pale', hair: ['#e8e8f0', 'long'], hat: ['hood', '#1e1e28'], clothes: '#24242e' },
      notes: [['meet', 'Tends the fen graves, and the graves that will not stay closed.'], ['gf_reeds', 'Walks the path to Morwenna’s hut every evening, as far as the reeds and no further.'], ['witchs_bane', 'Morwenna was her sister. She ran out of prayers long before she ran out of grief.']] },
    { n: 'Mother Alder', id: 'alder', town: 'gloomfen', role: 'Herb-wife', look: { skin: 'deep', hair: ['#8a9a7a', 'wild'], clothes: '#4a5a3a', shawl: '#6a7a4a', old: 1 },
      notes: [['meet', 'Swears monkfish cures anything. She has never been ill, so who can argue.'], ['gf_wraithlight', 'Leaves a candle in her window for travellers, and a spoon by the pot for anyone who comes in.']] },
    { n: 'Magmasmith Kael', id: 'kael', town: 'emberfall', role: 'Magmasmith', look: { skin: 'deep', hair: ['#141414', 'bald'], clothes: '#6a2a1a', glasses: '#e88a2a', soot: 1 },
      notes: [['meet', 'Works runite in the lava tubes with bare forearms and a wide grin.'], ['ef_glass', 'Keeps the prettiest glass shards and gives them to the garrison children.']] },
    { n: 'Quartermaster Vess', id: 'vess', town: 'emberfall', role: 'Quartermaster', look: { skin: 'tan', hair: ['#5a3a20', 'short'], hat: ['beret', '#9a2a24'], clothes: '#4a3a2a', scar: 1 },
      notes: [['meet', 'Counts every ration in the garrison, twice.'], ['drakehide_deal', 'Was a ranger once. She still checks the stitching on every drakehide coat herself.'], ['ef_anglers', 'Salted the anglerfish for the wardens’ last march, and packed one extra for whoever does not come back.']] },
    { n: 'Brother Aldous', id: 'aldous', town: 'skyreach', role: 'Monk', look: { skin: 'light', hair: ['#7a5a3a', 'tonsure'], hat: ['cowl', '#b8b0a0'], clothes: '#a8a090', grin: 1 },
      notes: [['meet', 'The youngest monk on Skyreach, and the only one who laughs out loud in the gardens.'], ['sr_feathers', 'Writes a name on every prayer flag. Yours is on one now.'], ['af_star', 'Watched the star fall from the high terrace, and has been sketching it ever since.']] },
    { n: 'Abbot Seren', id: 'seren', town: 'skyreach', role: 'Abbot', look: { skin: 'fair', hair: ['#d8dce4', 'long'], hat: ['cowl', '#5a6a8a'], clothes: '#4a5a7a', old: 1 },
      notes: [['meet', 'Abbot of Skyreach. She speaks softly and expects to be heard.'], ['sr_astral', 'The cracked bells were cast in her first year as abbot. She wanted star iron so the new ones would outlast her.'], ['sr_hermit', 'Was a gale hermit herself, before the monastery. The riddles are hers.'], ['storm_breaker', 'Rebuilt the first sky bridge with her own hands, and walked it first.']] },
    { n: 'The Last Herald', id: 'herald', town: 'hollow', role: 'Herald', look: { skin: 'pale', hair: ['#2a2234', 'long'], hat: ['circlet', '#c8c8d8'], clothes: '#3a2a4a', glow: '#b88af8' },
      notes: [['meet', 'Carries a list of names and adds to it every night.'], ['hc_echoes', 'Recognised one of the echoes, and would not say whose voice it was.'], ['hc_threads', 'Was a herald of the Hollow King’s court, before the court went hollow.'], ['crownfall', 'Read every name on the list aloud at the drowned throne, then set the list down for good.']] },
    { n: 'Warden Ignis', id: 'ignis', town: 'emberfall', role: 'Warden', look: { skin: 'tan', hair: ['#c83a1a', 'long'], hat: ['plume', '#b8803a'], clothes: '#7a2a1a' },
      notes: [['meet', 'Leads the wardens of Emberfall, and has remade every banner Pyrrhax burned.'], ['ef_hounds', 'Knows the hounds’ pack calls, and can answer them.'], ['wyrm_slayer', 'Sewed a new banner the night Pyrrhax fell, with your name stitched small in one corner.']] },
    { n: 'Foreman Dunmore', id: 'dunmore', town: 'ironpeak', role: 'Mine foreman', look: { skin: 'dwarf', hair: ['#6a4a2a', 'short'], beard: ['#6a4a2a', 'full'], hat: ['minecap', '#d8b040'], clothes: '#4a4a3a' },
      notes: [['meet', 'A careful foreman who checks every lamp himself before a shift.'], ['al_lantern', 'The lamplighter was his father.'], ['al_rest', 'Keeps the finished lens on his desk and lights it every evening, at the hour his father went down.']] },
    { n: 'The Last Warden', id: 'warden', town: 'hollow', role: 'Warden of the crater', look: { skin: 'pale', hair: ['#c8ccd8', 'long'], beard: ['#c8ccd8', 'long'], hat: ['hood', '#4a4e64'], clothes: '#3a3e54', glow: '#e8e0a0', old: 1 },
      notes: [['meet', 'Has guarded the crater alone for longer than anyone can remember.'], ['af_home', 'Smiled when the star went home, for the first time anyone at the Crown can recall.']] },
  ];
  const BY = {}; for (const f of F) BY[f.n] = f;
  D.FOLK = F; DQ.folkOf = giver => BY[giver] || null;

  /* ---------- portrait painter (32 × 32, top-left light, outlined) ---------- */
  const shade = (hex, k) => { const n = parseInt(hex.slice(1), 16), c = [n >> 16, n >> 8 & 255, n & 255].map(v => Math.max(0, Math.min(255, Math.round(k < 0 ? v * (1 + k) : v + (255 - v) * k)))); return '#' + c.map(v => v.toString(16).padStart(2, '0')).join(''); };
  const paint = f => {
    const L = f.look, c = document.createElement('canvas'); c.width = c.height = 32; const g = c.getContext('2d');
    const P = (x, y, col, w = 1, h = 1) => { g.fillStyle = col; g.fillRect(x, y, w, h); };
    const sk = SKIN[L.skin] || SKIN.light, [hc, hs] = L.hair || ['#5a3a20', 'short'], hd = shade(hc, -.35), hl = shade(hc, .25);
    const inFace = (x, y) => ((x - 15.5) / 6.6) ** 2 + ((y - 16) / 7.6) ** 2 <= 1;
    const cl = L.clothes || '#5a4a3a', cd = shade(cl, -.35), ch = shade(cl, .2);
    // shoulders
    for (let y = 24; y < 32; y++) { const hw = 7 + (y - 24) * 1.3; for (let x = Math.round(15.5 - hw); x <= Math.round(15.5 + hw); x++) P(x, y, x > 18 ? cd : x < 11 ? ch : cl); }
    for (let y = 24; y < 32; y++) { const hw = 7 + (y - 24) * 1.3; P(Math.round(15.5 - hw) - 1, y, shade(cl, -.6)); P(Math.round(15.5 + hw) + 1, y, shade(cl, -.6)); }
    if (L.apron) { for (let y = 26; y < 32; y++) P(12, y, L.apron, 8); }
    if (L.shawl) { for (let y = 24; y < 29; y++) { const hw = 8 + (y - 24) * 1.2; P(Math.round(15.5 - hw), y, L.shawl, Math.round(hw * 2)); } }
    if (L.tape) { for (let i = 0; i < 9; i++) P(9 + i, 25 + (i > 4 ? 1 : 0), '#e8c040'); }
    // neck
    P(13, 22, sk[1], 6, 3); P(13, 22, sk[2], 1, 3);
    // long hair behind the face
    if (['long', 'braids', 'wild'].includes(hs)) { for (let y = 9; y < (hs === 'long' ? 27 : 24); y++) { P(8, y, hd, 2); P(22, y, hd, 2); } if (hs === 'braids') { for (let y = 22; y < 30; y++) { P(7, y, y % 2 ? hc : hd, 2); P(23, y, y % 2 ? hc : hd, 2); } } }
    // face with top-left light
    for (let y = 8; y < 25; y++) for (let x = 8; x < 24; x++) if (inFace(x, y)) P(x, y, x >= 19 || y >= 22 ? sk[1] : (x <= 11 && y <= 13) ? shade(sk[0], .12) : sk[0]);
    for (let y = 8; y < 25; y++) for (let x = 7; x < 25; x++) if (!inFace(x, y) && (inFace(x + 1, y) || inFace(x - 1, y) || inFace(x, y + 1) || inFace(x, y - 1))) P(x, y, sk[2]);
    P(8, 15, sk[1], 1, 3); P(23, 15, sk[2], 1, 3); // ears
    // eyes, brows, nose, mouth
    const eye = L.glow || '#1e1610';
    P(12, 15, eye, 2, 2); P(18, 15, eye, 2, 2); if (!L.glow) { P(12, 15, '#f4ece0'); P(18, 15, '#f4ece0'); }
    P(11, 13, hs === 'bald' ? sk[2] : hd, 4); P(17, 13, hs === 'bald' ? sk[2] : hd, 4);
    P(16, 17, sk[1], 1, 2); P(15, 19, sk[2], 2, 1);
    if (L.grin) { P(13, 21, '#7a2a24', 6); P(14, 21, '#f4ece0', 4); } else P(14, 21, '#8a4434', 4);
    if (L.rosy) { P(10, 18, '#e08a7a', 2); P(20, 18, '#d07a6a', 2); }
    if (L.freckles) { P(11, 18, sk[2]); P(13, 19, sk[2]); P(19, 18, sk[2]); P(20, 19, sk[2]); }
    if (L.old) { P(11, 17, sk[2], 2); P(19, 17, sk[2], 2); P(12, 22, sk[2]); P(19, 22, sk[2]); }
    if (L.scar) { for (let i = 0; i < 5; i++) P(19 + (i > 2 ? 1 : 0), 12 + i, '#a85a4a'); }
    if (L.soot) { P(10, 19, '#5a4a40', 2); P(20, 12, '#5a4a40'); }
    if (L.ink) P(20, 19, '#2a3a6a', 2);
    if (L.glasses) { const gc = L.glasses; for (const x0 of [11, 17]) { P(x0, 14, gc, 4); P(x0, 17, gc, 4); P(x0, 15, gc, 1, 2); P(x0 + 3, 15, gc, 1, 2); } P(15, 15, gc, 2); }
    // hair on top
    const top = (y0, y1, side) => { for (let y = y0; y <= y1; y++) for (let x = 7; x < 25; x++) if (inFace(x, y + 1) || inFace(x, y)) { if (y > 10 && x > 10 && x < 21 && !side) continue; P(x, y, y <= y0 + 1 ? hl : (x > 19 ? hd : hc)); } };
    if (hs === 'short' || hs === 'braids' || hs === 'long' || hs === 'bun' || hs === 'wild') top(7, 12, false);
    if (hs === 'long' || hs === 'braids') { for (let y = 10; y < 22; y++) { P(8, y, hc); P(23, y, hd); } }
    if (hs === 'bun') { for (let y = 3; y < 8; y++) for (let x = 13; x < 19; x++) if ((x - 15.5) ** 2 + (y - 5.5) ** 2 <= 7) P(x, y, x < 15 ? hl : hc); }
    if (hs === 'wild') { for (let x = 6; x < 26; x += 2) P(x, 6 + (x % 4 ? 0 : 1), hc, 1, 3); for (let y = 10; y < 24; y += 2) { P(6, y, hc, 2); P(24, y, hd, 2); } }
    if (hs === 'bald') { P(8, 13, hc, 2, 4); P(22, 13, hd, 2, 4); }
    if (hs === 'tonsure') { for (let x = 8; x < 24; x++) if (inFace(x, 11)) P(x, 11, hc); P(8, 12, hc, 2, 4); P(22, 12, hd, 2, 4); }
    // beards
    if (L.beard) { const [bc, bs] = L.beard, bd = shade(bc, -.3), bl = shade(bc, .2);
      if (bs === 'moustache') { P(13, 20, bc, 6); P(12, 21, bd); P(19, 21, bd); }
      if (bs === 'stubble') { for (let y = 19; y < 24; y++) for (let x = 10; x < 22; x++) if (inFace(x, y) && (x + y) % 2) P(x, y, shade(bc, .1)); }
      if (['short', 'full', 'long', 'braided'].includes(bs)) { const yEnd = bs === 'short' ? 24 : bs === 'full' ? 27 : 30;
        for (let y = 18; y < yEnd; y++) for (let x = 8; x < 24; x++) { const inside = inFace(x, y) && y >= 19 || (y >= 23 && Math.abs(x - 15.5) < (bs === 'long' || bs === 'braided' ? 5 - (y - 23) * .45 : 6 - (y - 23)) ); if (inside && !(y === 21 && x >= 14 && x <= 17)) P(x, y, x < 13 ? bl : x > 18 ? bd : bc); }
        P(13, 20, bc, 6); if (bs === 'braided') for (let y = 25; y < 31; y++) { P(13, y, y % 2 ? bd : bc, 2); P(17, y, y % 2 ? bd : bc, 2); } }
    }
    // headwear
    if (L.hat) { const [k, hc2] = L.hat, h2 = shade(hc2, -.3), h3 = shade(hc2, .25);
      if (k === 'cap' || k === 'wool' || k === 'beret') { for (let y = 5; y < 11; y++) for (let x = 7; x < 25; x++) if (inFace(x, y + 2)) P(x, y, y < 7 ? h3 : x > 19 ? h2 : hc2); if (k === 'cap') P(6, 10, h2, 20, 1); if (k === 'wool') P(14, 4, h3, 4, 2); if (k === 'beret') { P(17, 5, hc2, 8, 2); P(23, 7, h2, 2, 1); } }
      if (k === 'minecap') { for (let y = 4; y < 11; y++) for (let x = 7; x < 25; x++) if (inFace(x, y + 3)) P(x, y, y < 6 ? h3 : x > 19 ? h2 : hc2); P(6, 10, h2, 20, 1); P(14, 5, '#fff2b0', 4, 3); }
      if (k === 'helmet' || k === 'horned') { for (let y = 4; y < 12; y++) for (let x = 7; x < 25; x++) if (inFace(x, y + 3)) P(x, y, y < 6 ? h3 : x > 19 ? h2 : hc2); P(7, 11, h2, 18, 1); P(15, 11, h2, 2, 6); if (k === 'horned') { for (let i = 0; i < 5; i++) { P(5 - (i > 2 ? 1 : 0), 9 - i, '#e8e0c8'); P(26 + (i > 2 ? 1 : 0), 9 - i, '#d0c8b0'); } } }
      if (k === 'hood' || k === 'cowl') { for (let y = 3; y < 28; y++) for (let x = 4; x < 28; x++) { const out = ((x - 15.5) / 10) ** 2 + ((y - 15) / 12) ** 2 <= 1, inn = ((x - 15.5) / 6.8) ** 2 + ((y - 16.5) / 7.8) ** 2 <= 1; if (out && !inn) P(x, y, x < 10 ? h3 : x > 21 ? h2 : hc2); } }
      if (k === 'chef') { for (let y = 0; y < 10; y++) for (let x = 8; x < 24; x++) if (((x - 15.5) / 8) ** 2 + ((y - 4.5) / 5) ** 2 <= 1 || y >= 7) P(x, y, x > 19 ? '#d8d0c4' : '#f8f4ec'); P(8, 9, '#c8c0b4', 16, 1); }
      if (k === 'kerchief') { for (let y = 5; y < 12; y++) for (let x = 7; x < 25; x++) if (inFace(x, y + 2)) P(x, y, x > 19 ? h2 : hc2); for (let x = 9; x < 23; x += 3) P(x, 8, h3); P(22, 12, hc2, 3, 3); }
      if (k === 'tricorn') { P(4, 8, h2, 24, 2); for (let y = 2; y < 8; y++) P(9, y, hc2, 14); P(9, 2, h3, 14, 1); P(14, 5, '#d8b040', 4, 1); }
      if (k === 'brim') { P(4, 9, h2, 24, 2); for (let y = 4; y < 9; y++) P(10, y, hc2, 12); P(10, 4, h3, 12, 1); }
      if (k === 'circlet') { P(8, 10, hc2, 16, 1); P(15, 8, hc2, 2, 2); P(15, 9, '#b88af8', 2, 1); }
      if (k === 'plume') { for (let y = 4; y < 12; y++) for (let x = 7; x < 25; x++) if (inFace(x, y + 3)) P(x, y, y < 6 ? h3 : x > 19 ? h2 : hc2); P(7, 11, h2, 18, 1); for (let i = 0; i < 6; i++) P(15 + i, 4 - Math.floor(i / 2), '#d83a2a', 2, 2); }
    }
    if (L.earring) P(23, 18, '#e8c040');
    return c.toDataURL();
  };
  const cache = {};
  DQ.folkUrl = f => cache[f.id] || (cache[f.id] = paint(f));
  DQ.folkPortrait = (giver, size = 64, cls = '') => { const f = DQ.folkOf(giver); return f ? `<img class="px folk-face ${cls}" src="${DQ.folkUrl(f)}" width="${size}" height="${size}" alt="${esc(f.n)}">` : ''; };

  /* what you know: a note shows once its quest is finished; "meet" once any of their quests is under way */
  const qs = f => D.QUESTS.filter(q => q.giver === f.n);
  const met = f => qs(f).some(q => ['active', 'ready', 'done'].includes(DQ.questState(q)));
  const known = f => f.notes.filter(([k]) => k === 'meet' ? met(f) : DQ.questState(D.QM[k] || {}) === 'done');
  DQ.folkMet = () => F.filter(met);

  /* a quiet line in the bell when you learn something new about someone (no pop-up, no count of what is left) */
  const sync = () => {
    const st = S(); if (!st || !st.q) return; const first = !st.folkSeen; st.folkSeen = st.folkSeen || {};
    for (const f of F) { const n = known(f).length, was = st.folkSeen[f.id] || 0;
      if (n > was && !first) DQ.notify({ kind: 'folk', key: 'folk:' + f.id + ':' + n, icon: 'users', col: '#d8a64a', page: 'people', title: was ? `You learned something about ${f.n}` : `You met ${f.n}`, text: known(f)[n - 1][1], sound: false });
      st.folkSeen[f.id] = Math.max(was, n); }
  };
  DQ.on && DQ.on('quests', () => setTimeout(sync, 0));

  /* ---------- People page ---------- */
  UI.V.people = () => {
    const ppl = DQ.folkMet(); if (!ppl.length) return `<section class="panel"><h2>People</h2><p class="dim">Accept a quest and the person who gave it will appear here.</p></section>`;
    const sel = ppl.find(f => f.id === UI.tab.folk) || ppl[0]; UI.tab.folk = sel.id;
    const list = ppl.map(f => `<button class="folk-card ${f === sel ? 'on' : ''}" data-do="folk" data-a="${f.id}" aria-pressed="${f === sel}"><img class="px folk-face" src="${DQ.folkUrl(f)}" width="64" height="64" alt=""><b>${esc(f.n)}</b><small>${esc(D.TOWN[f.town].name)}</small></button>`).join('');
    const done = qs(sel).filter(q => DQ.questState(q) === 'done');
    const notes = known(sel).map(([, t]) => `<li>${esc(t)}</li>`).join('');
    return `<div class="folk-layout"><nav class="panel folk-list" aria-label="People you have met"><div class="phead"><h2>People</h2><small>${ppl.length} met</small></div><div class="folk-grid">${list}</div></nav>
      <section class="panel folk-detail"><div class="folk-head"><img class="px folk-face big" src="${DQ.folkUrl(sel)}" width="128" height="128" alt="${esc(sel.n)}"><div><h2>${esc(sel.n)}</h2><small>${esc(sel.role)} · ${esc(D.TOWN[sel.town].name)}</small></div></div>
      <div class="k">What you know</div><ul class="folk-notes">${notes}</ul>
      ${done.length ? `<div class="k">You have helped with</div><div class="folk-quests">${done.map(q => `<span class="chip">${ico(q.main ? 'star' : 'quest')}${esc(q.name)}</span>`).join('')}</div>` : ''}</section></div>`;
  };
  UI.DO.folk = id => { UI.tab.folk = id; UI.render(false); };
  UI.DO.folkfrom = giver => { const f = DQ.folkOf(giver); if (!f) return; if (met(f)) { UI.tab.folk = f.id; DQ.go('people'); } else DQ.toast && DQ.toast(`You will get to know ${f.n} as you help them.`); };
})();
