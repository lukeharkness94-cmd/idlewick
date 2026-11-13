/* Mini-bosses (Nov 2026): named challenges between a region's ordinary creatures and its boss, so the climb from
   Grubnash (level 12, challenge from Combat 8) to Old Tusk (level 26, from Combat 18) has steps to aim for.
   Gnarlroot (level 18, from Combat 13) and the Rookmother (level 22, from Combat 16) each have a special attack, a
   weakness worth preparing for, a guaranteed piece of gear on the first victory, and a quest from a Mossbarrow local.
   They are fought directly from the Challenges strip (never in random encounters) and are added after hunting areas
   and wild companions are built, so existing companions and saves are unchanged. */
(() => {
const DQ = window.DQ, D = DQ.data, UI = DQ.ui, S = () => DQ.S, { esc, ico } = DQ;
/* stats follow data.js's mon() scaling (health x0.62, max hit x0.72) */
const mini = (id, name, town, cl, hp, max, att, def, coins, col, drops, info) => {
  const m = { id, name, town, cl, hp: Math.round(hp * .62), max: Math.max(1, Math.round(max * .72)), att, def, coins, col, drops, mini: info };
  D.MON[id] = m; D.MONLIST.push(m); return m;
};
mini('gnarlroot', 'Gnarlroot', 'mossbarrow', 18, 52, 4, 15, 17, [40, 90], '#7a5a3a',
  [['log_oak', [4, 8], 1], ['seed_cabbage', [2, 4], .5], ['coin_pouch', [1, 1], .3], ['iron_shield', [1, 1], .04], ['treasure_chest', [1, 1], .05]],
  { short: 'Gnarlroot', req: 13, first: 'iron_shield', special: { every: 4, mult: 1.4, name: 'Root snare' }, won: 'The orchard is quiet. Granny Bramble’s apple trees can grow in peace.' });
mini('rookmother', 'The Rookmother', 'mossbarrow', 22, 70, 5, 17, 13, [70, 150], '#3a3a4a',
  [['feather', [10, 20], 1], ['coin_pouch', [1, 1], .45], ['iron_body', [1, 1], .04], ['bow_oak', [1, 1], .04], ['treasure_chest', [1, 1], .08]],
  { short: 'Rookmother', req: 16, first: 'iron_body', special: { every: 3, mult: 1.4, name: 'Diving strike' }, won: 'The rooks scatter from the wheat fields. Hunter Wynn raises a cup to you.' });
D.WEAK.gnarlroot = { weak: ['fire', 'slash'], resist: ['crush', 'pierce'] };
D.WEAK.rookmother = { weak: ['pierce', 'storm'], resist: ['crush'] };
if (D.LORE) {
  D.LORE.gnarlroot = { note: 'An old orchard stump that walked off one wet spring and never came back quietly. Every few blows it snares you in its roots. Axes and fire bite deep; hammers and arrows barely mark it.', legend: 'Granny Bramble says it was the first apple tree in Mossbarrow, planted by her own great-grandmother, and that it is only cross because nobody has pruned it in eighty years.' };
  D.LORE.rookmother = { note: 'The great crow that leads the rooks of the wheat fields. She dives every third pass, hard. Arrows and lightning bring her down; blunt weapons just ruffle her.', legend: 'Hunter Wynn has been trying to shoot her since he was a boy. He swears she remembers him, and laughs.' };
}
/* quests that point at them, from Mossbarrow locals */
const quest = q => { if (D.QM[q.id]) return; D.QUESTS.push(q); D.QM[q.id] = q; };
quest({ id: 'mb_gnarlroot', town: 'mossbarrow', name: 'Roots in the Orchard', giver: 'Granny Bramble', adv: 12, req: null,
  blurb: 'Something old has woken in Granny Bramble’s orchard: a stump that walks, and swats anyone who comes near the apples. She would like it to stop, please, before harvest.',
  obj: [{ ev: 'guide', key: 'gnarlroot', n: 1, label: 'Study Gnarlroot in your field guide' }, { ev: 'kill', key: 'gnarlroot', n: 1, label: 'Defeat Gnarlroot in the orchard' }],
  reward: { xp: { strength: 1400, defence: 900 }, coins: 400 }, thanks: 'There. It only wanted pruning, poor old thing. Take some coins, and come by for pie.' });
quest({ id: 'mb_rookmother', town: 'mossbarrow', name: 'The Rookmother', giver: 'Hunter Wynn', adv: 15, req: null,
  blurb: 'The rooks are stripping the wheat fields bare, and their mother is bigger than a dog. Hunter Wynn has missed her for twenty years. He would like someone else to try.',
  obj: [{ ev: 'guide', key: 'rookmother', n: 1, label: 'Study the Rookmother in your field guide' }, { ev: 'kill', key: 'rookmother', n: 1, label: 'Bring down the Rookmother' }],
  reward: { xp: { attack: 1800, hitpoints: 1000 }, coins: 650 }, thanks: 'Twenty years! And you just walked up and did it. I am going to need a drink, and so are you.' });

/* ---------- Saltmere to Skyreach (Nov 2026): two challenges in every later region ----------
   After Barnacle the next named fight used to be Frostmaw twenty combat levels on, then Morwenna and Pyrrhax another
   twenty each. Each region now has two steps on the way, each with a first-victory piece of the next gear tier. */
mini('brinemaw', 'The Brinemaw', 'saltmere', 30, 92, 9, 24, 26, [90, 180], '#c8643a',
  [['raw_lobster', [2, 4], .6], ['coin_pouch', [1, 1], .4], ['steel_helm', [1, 1], .04], ['treasure_chest', [1, 1], .08]],
  { short: 'the Brinemaw', req: 21, first: 'steel_helm', special: { every: 4, mult: 1.4, name: 'Pincer crush' }, won: 'The harbour steps are clear. The crab pots come up full again.' });
mini('lanternjack', 'Lanternjack', 'saltmere', 33, 86, 8, 28, 22, [120, 240], '#5a7a8a',
  [['coin_pouch', [1, 2], .6], ['rune', [8, 16], .5], ['steel_shield', [1, 1], .04], ['treasure_chest', [1, 1], .1]],
  { short: 'Lanternjack', req: 23, first: 'steel_shield', special: { every: 3, mult: 1.4, name: 'False light' }, won: 'The false light on the shoals is out. Ships come home by the true one.' });
mini('hoarfang', 'Hoarfang', 'ironpeak', 42, 150, 11, 38, 32, [200, 380], '#b8d0e0',
  [['wolf_pelt', [3, 6], 1], ['coin_pouch', [1, 2], .5], ['mithril_helm', [1, 1], .04], ['treasure_chest', [1, 1], .1]],
  { short: 'Hoarfang', req: 31, first: 'mithril_helm', special: { every: 4, mult: 1.5, name: 'Pack howl' }, won: 'The pass is quiet. The pack has gone back up into the snow.' });
mini('cairnwarden', 'The Cairn Warden', 'ironpeak', 49, 205, 15, 42, 46, [280, 520], '#8a8f98',
  [['ore_coal', [6, 12], 1], ['coin_pouch', [1, 2], .5], ['mithril_shield', [1, 1], .04], ['treasure_chest', [1, 1], .12]],
  { short: 'the Cairn Warden', req: 38, first: 'mithril_shield', special: { every: 4, mult: 1.6, name: 'Rockfall' }, won: 'The old cairn settles. The high road is open as far as the glacier.' });
mini('bellringer', 'The Drowned Bellringer', 'gloomfen', 60, 290, 21, 56, 50, [420, 760], '#6a8a7a',
  [['coin_pouch', [2, 3], .6], ['rune', [20, 40], .5], ['adamant_helm', [1, 1], .04], ['treasure_chest', [1, 1], .12]],
  { short: 'the Bellringer', req: 51, first: 'adamant_helm', special: { every: 4, mult: 1.5, name: 'Tolling' }, won: 'The sunken bell is still. Gloomfen sleeps through the night for once.' });
mini('gallowmoth', 'Gallowmoth', 'gloomfen', 68, 255, 21, 64, 54, [560, 980], '#d8d0e8',
  [['feather', [20, 40], 1], ['coin_pouch', [2, 3], .6], ['adamant_shield', [1, 1], .04], ['treasure_chest', [1, 1], .14]],
  { short: 'Gallowmoth', req: 58, first: 'adamant_shield', special: { every: 3, mult: 1.4, name: 'Dust of sleep' }, won: 'Pale wings drift down over the reeds. The lanterns burn steady again.' });
mini('slagmaw', 'Slagmaw', 'emberfall', 80, 540, 31, 76, 72, [900, 1500], '#e0703a',
  [['ore_coal', [12, 24], 1], ['coin_pouch', [2, 4], .6], ['rune_helm', [1, 1], .04], ['treasure_chest', [1, 1], .15]],
  { short: 'Slagmaw', req: 71, first: 'rune_helm', special: { every: 4, mult: 1.5, name: 'Molten spit' }, won: 'The slag pits cool. Kael’s furnaces draw clean again.' });
mini('ashmatriarch', 'The Ashen Matriarch', 'emberfall', 90, 520, 30, 84, 78, [1200, 2000], '#8a3a3a',
  [['coin_pouch', [3, 4], .7], ['rune', [40, 80], .5], ['rune_shield', [1, 1], .04], ['treasure_chest', [1, 1], .16]],
  { short: 'the Matriarch', req: 78, first: 'rune_shield', special: { every: 4, mult: 1.6, name: 'Ashfall' }, won: 'The drakes scatter without their mother. The ridge road is yours.' });
mini('stormram', 'The Stormcrown Ram', 'skyreach', 100, 640, 47, 94, 90, [1600, 2600], '#e8e4d0',
  [['coin_pouch', [3, 5], .7], ['astral_helm', [1, 1], .04], ['treasure_chest', [1, 1], .18]],
  { short: 'the Stormcrown Ram', req: 88, first: 'astral_helm', special: { every: 4, mult: 1.5, name: 'Thunder charge' }, won: 'The ram bows its crowned head and climbs out of sight. The stair is open.' });
mini('cloudbreaker', 'Cloudbreaker', 'skyreach', 106, 555, 44, 98, 90, [2000, 3200], '#7aa0d8',
  [['coin_pouch', [4, 5], .7], ['rune', [60, 120], .5], ['astral_shield', [1, 1], .04], ['treasure_chest', [1, 1], .2]],
  { short: 'Cloudbreaker', req: 92, first: 'astral_shield', special: { every: 3, mult: 1.4, name: 'Breaching dive' }, won: 'The great shape sinks back into the cloud sea. The bells of Skyreach ring it out.' });
Object.assign(D.WEAK, {
  brinemaw: { weak: ['crush', 'storm'], resist: ['slash', 'pierce'] }, lanternjack: { weak: ['stab', 'aether'], resist: ['storm'] },
  hoarfang: { weak: ['fire', 'slash'], resist: ['frost'] }, cairnwarden: { weak: ['crush', 'aether'], resist: ['slash', 'pierce'] },
  bellringer: { weak: ['fire', 'slash'], resist: ['stab'] }, gallowmoth: { weak: ['pierce', 'fire'], resist: ['aether'] },
  slagmaw: { weak: ['frost', 'crush'], resist: ['fire', 'slash'] }, ashmatriarch: { weak: ['frost', 'pierce'], resist: ['fire'] },
  stormram: { weak: ['crush', 'pierce'], resist: ['storm'] }, cloudbreaker: { weak: ['pierce', 'frost'], resist: ['slash'] } });
if (D.LORE) Object.assign(D.LORE, {
  brinemaw: { note: 'A crab the size of a rowing boat that has taken the harbour steps for its own. Every fourth blow is the big pincer. Hammers and lightning crack the shell; blades and arrows skid off.', legend: 'Harbourmaster Ilsa has charged it mooring fees for three years. It has not paid once.' },
  lanternjack: { note: 'A wrecker who swings a false light out on the shoals. Every third swing dazzles and he strikes hard. Daggers and aether find him; storm magic he shrugs off.', legend: 'They say he drowned once already and came back up for his lantern.' },
  hoarfang: { note: 'The white pack leader of the high pass. Every fourth attack it howls and the bite lands heavier. Fire and a sharp edge turn it; frost does nothing.', legend: 'Captain Hrod lost a boot to it as a recruit. He still has the other one.' },
  cairnwarden: { note: 'A walking heap of grave-stones on the high road. Every fourth blow brings the rocks down. Hammers and aether shake it apart; swords and arrows only chip.', legend: 'Foreman Dagna’s people built the cairn. Nobody remembers asking it to stand guard.' },
  bellringer: { note: 'He still rings the chapel bell that sank with him. Every fourth toll rattles your teeth. Fire and a slashing blade work; stabbing finds only water.', legend: 'Gravewarden Lysa leaves a candle for him each autumn. It is always gone by morning.' },
  gallowmoth: { note: 'A pale moth as wide as a door, drawn to every lantern in the fen. Every third pass it shakes down sleeping dust. Arrows and fire bring it down; aether passes through.', legend: 'Mother Alder says its dust cures bad dreams, in very small doses, taken a long way from the moth.' },
  slagmaw: { note: 'A toad of half-cooled rock that lives in the slag pits. Every fourth attack it spits molten stone. Frost and hammers break its crust; fire and blades do little.', legend: 'Magmasmith Kael once quenched a blade in its pond. The blade came out fine. The tongs did not.' },
  ashmatriarch: { note: 'The old mother of the ridge drakes. Every fourth breath she beats down a rain of hot ash. Frost and arrows trouble her; fire she breathes.', legend: 'Warden Ignis counts her scars each year from a safe distance, and adds one to his own count.' },
  stormram: { note: 'A mountain ram with lightning caught in its horns. Every fourth charge lands like thunder. Hammers and arrows stop it; storm magic only feeds the crown.', legend: 'Brother Aldous insists it is a blessing. He says this from behind the abbey door.' },
  cloudbreaker: { note: 'A great finned thing that swims the cloud sea below Skyreach. Every third pass it breaches and dives. Arrows and frost reach it; a sword mostly meets mist.', legend: 'Abbot Seren has watched it for forty years and never seen the whole of it at once.' } });
[['brinemaw', 'ms_brinemaw', 'Mooring Fees', 'Harbourmaster Ilsa', 20, 'A crab the size of a boat is sitting on the harbour steps and will not be reasoned with. Ilsa would like her steps back.', 'Clear the Brinemaw off the harbour steps', 3200, 900, 'Steps clear, pots full, and not a pincer in sight. The harbour owes you one.'],
 ['lanternjack', 'ms_lanternjack', 'The False Light', 'Smith Tolla', 23, 'Somebody is swinging a lantern out on the shoals and luring boats onto the rocks. Tolla lost a cargo of good iron to it.', 'Put out Lanternjack’s light', 4200, 1200, 'That light cost me a season of iron. Worth every coin to see it go dark.'],
 ['hoarfang', 'ms_hoarfang', 'The White Pack', 'Captain Hrod', 30, 'The wolves on the pass have a leader now, white as the drifts and twice as patient. Hrod wants it gone before the carts stop coming.', 'Drive Hoarfang from the pass', 9000, 2000, 'The carts are through. Do me a favour and never ask about the boot.'],
 ['cairnwarden', 'ms_cairnwarden', 'Stones on the High Road', 'Foreman Dagna', 37, 'The old cairn on the high road got up and started turning miners back. Dagna needs that road for the upper seams.', 'Settle the Cairn Warden', 16000, 3200, 'Back in a heap where it belongs. The upper seams are open, and the first cart is yours.'],
 ['bellringer', 'ms_bellringer', 'The Bell Under the Water', 'Gravewarden Lysa', 50, 'A drowned bell tolls every night from the sunk chapel, and nobody in Gloomfen has slept. Lysa knows who is ringing it.', 'Lay the Drowned Bellringer to rest', 42000, 6000, 'Quiet. Proper quiet. He rang it for forty years; he has earned the rest, and so have we.'],
 ['gallowmoth', 'ms_gallowmoth', 'Dust on the Lanterns', 'Mother Alder', 57, 'A pale moth as wide as a door keeps snuffing the fen lanterns and leaving folk asleep where they stand. Alder wants some of the dust. Only some.', 'Bring down Gallowmoth', 60000, 8500, 'A thimble of that dust will do me ten years. The lanterns can have the rest of the night.'],
 ['slagmaw', 'ms_slagmaw', 'Something in the Slag', 'Magmasmith Kael', 70, 'The slag pits have a tenant: a toad of half-cooled rock that spits at anyone tipping a barrow. Kael’s furnaces are backing up.', 'Break Slagmaw’s crust', 130000, 18000, 'Furnaces drawing clean. I would shake your hand but mine are still too hot.'],
 ['ashmatriarch', 'ms_ashmatriarch', 'Mother of Drakes', 'Warden Ignis', 77, 'Every drake on the ridge answers to one old mother, and she has decided the road is hers. Ignis has the scars to say she means it.', 'Defeat the Ashen Matriarch', 190000, 26000, 'She will be back, they always are. But the road is open today, and that is your doing.'],
 ['stormram', 'ms_stormram', 'The Crown of Lightning', 'Brother Aldous', 87, 'A ram with lightning in its horns has taken the abbey stair. Aldous says it is a blessing and would like it blessed somewhere else.', 'Humble the Stormcrown Ram', 300000, 42000, 'A blessing, as I said. Much more of a blessing from down here.'],
 ['cloudbreaker', 'ms_cloudbreaker', 'What Swims Below', 'Abbot Seren', 91, 'Something vast swims the cloud sea under Skyreach and breaches against the lower terraces. Seren has watched it for forty years and would like to stop.', 'Turn back Cloudbreaker', 380000, 55000, 'Forty years, and you are the first to see all of it at once. Tell me everything.']
].forEach(([mid, id, name, giver, adv, blurb, label, xp, coins, thanks]) => { const m = D.MON[mid];
  quest({ id, town: m.town, name, giver, adv, req: null, blurb, obj: [{ ev: 'guide', key: mid, n: 1, label: `Study ${m.mini.short} in your field guide` }, { ev: 'kill', key: mid, n: 1, label }], reward: { xp: { melee: xp, defence: Math.round(xp * .6) }, coins }, thanks }); });

/* ---------- art: two original creatures, drawn in the house style ---------- */
const A = DQ.pixelArt;
if (A && A.CREATURE_SPECS) {
  const { Spr, ramp, mix } = A, rp = c => ramp(c);
  A.CREATURE_SPECS.gnarlroot = () => { const s = Spr(32, 32), bark = rp('#7a5a3a'), dark = rp('#4a3424'), moss = rp('#5f9a45'), ring = rp('#c8a070');
    /* roots for legs, a squat trunk, a cut top with rings, branch arms, moss and glowing knot-eyes */
    s.poly([[8, 30], [11, 24], [13, 25], [11, 31]], dark); s.poly([[24, 30], [21, 24], [19, 25], [21, 31]], dark); s.poly([[14, 31], [15, 25], [17, 25], [18, 31]], dark);
    s.rect(9, 9, 14, 17, bark); s.rect(9, 9, 2, 17, rp(mix('#7a5a3a', '#ffffff', .18))); s.rect(19, 9, 4, 17, dark);
    s.ell(16, 9, 7, 2.6, ring); s.ell(16, 9, 4.4, 1.6, rp('#a8804e')); s.ell(16, 9, 2, .8, ring);
    s.line(9, 15, 3, 10, bark); s.line(4, 10, 2, 6, bark); s.line(4, 10, 6, 6, bark); s.line(23, 14, 29, 9, dark); s.line(28, 9, 30, 5, dark); s.line(28, 9, 26, 5, dark);
    s.ell(3, 6, 2, 1.6, moss); s.ell(29, 5, 2, 1.6, moss); s.ell(12, 11, 3, 1.4, moss); s.ell(21, 21, 2, 1.4, moss);
    for (let y = 12; y < 26; y += 4) s.line(13, y, 14, y + 2, null, '#4a3424');
    s.fix(13, 16, '#d8f070'); s.fix(18, 16, '#d8f070'); s.fix(13, 17, '#a0c040'); s.fix(18, 17, '#a0c040');
    s.line(13, 21, 18, 20, null, '#2a1a10'); return s; };
  A.CREATURE_SPECS.rookmother = () => { const s = Spr(32, 32), body = rp('#3a3a4a'), wing = rp('#2a2a38'), sheen = rp('#5a5a7a'), beak = rp('#9aa0a8');
    /* a great crow with wings half spread, a ruff, a heavy grey beak, red eye and hooked talons */
    s.poly([[15, 13], [1, 8], [4, 14], [2, 18], [13, 21]], wing); s.poly([[17, 13], [31, 8], [28, 14], [30, 18], [19, 21]], wing);
    for (let i = 0; i < 5; i++) { s.line(3 + i * 2, 10 + i, 5 + i * 2, 15 + i, null, '#4a4a64'); s.line(29 - i * 2, 10 + i, 27 - i * 2, 15 + i, null, '#1e1e2a'); }
    s.ell(16, 18, 6, 7, body); s.ell(14, 16, 3, 4, sheen); s.ell(16, 9, 4.4, 4.2, body); s.ell(15, 8, 2, 1.6, sheen);
    s.poly([[11, 12], [16, 15], [21, 12], [19, 15], [16, 17], [13, 15]], wing);
    s.poly([[19, 9], [25, 10], [19, 12]], beak); s.line(19, 11, 24, 10, null, '#5a6068');
    s.fix(17, 8, '#e0403a'); s.fix(17, 7, '#ff8a6a');
    s.poly([[12, 24], [16, 30], [20, 24]], rp('#2a2a38')); for (const x of [13, 19]) { s.line(x, 25, x, 29, null, '#c8b070'); s.fix(x - 1, 30, '#c8b070'); s.fix(x + 1, 30, '#c8b070'); }
    return s; };
  /* --- the later regions' challenges (all drawn facing right, like the rest) --- */
  A.CREATURE_SPECS.brinemaw = () => { const s = Spr(32, 32), sh = rp('#c8643a'), dk = rp('#8a3a24'), pale = rp('#f0c8a0');
    for (const [x, d] of [[7, -1], [10, -1], [22, 1], [25, 1]]) { s.line(x, 22, x + d * 3, 27, dk); s.line(x + d * 3, 27, x + d * 2, 30, dk); }
    s.ell(16, 19, 10, 6, sh); s.ell(15, 17, 7, 3, rp(mix('#c8643a', '#ffffff', .2))); s.ell(16, 23, 8, 2.4, pale);
    for (const x of [10, 14, 19, 23]) s.fix(x, 15 + (x % 3), '#f4a878');
    s.line(7, 16, 3, 10, dk); s.ell(4, 8, 3.4, 3.6, sh); s.poly([[2, 5], [5, 1], [6, 6]], pale); s.poly([[6, 6], [8, 3], [7, 8]], dk);
    s.line(25, 15, 28, 8, dk); s.ell(27, 6, 4.4, 4.8, sh); s.poly([[24, 3], [27, -1], [28, 4]], pale); s.poly([[29, 4], [32, 0], [31, 7]], dk); s.ell(26, 6, 2, 2, rp(mix('#c8643a', '#ffffff', .25)));
    s.line(13, 13, 13, 10, dk); s.line(19, 13, 19, 10, dk); s.fix(13, 9, '#1a1a1a'); s.fix(19, 9, '#1a1a1a'); s.fix(13, 8, '#ffffff'); s.fix(19, 8, '#ffffff');
    s.line(13, 21, 19, 21, null, '#6a2a1a'); return s; };
  A.CREATURE_SPECS.lanternjack = () => { const s = Spr(32, 32), coat = rp('#3a5060'), dk = rp('#24323c'), skin = rp('#a8c0b8'), hat = rp('#2a2a34'), glow = rp('#f4e08a');
    s.poly([[10, 13], [20, 13], [23, 29], [7, 29]], coat); s.poly([[17, 13], [20, 13], [23, 29], [19, 29]], dk); s.line(15, 14, 15, 28, null, '#1a2228');
    s.rect(10, 29, 4, 2, hat); s.rect(17, 29, 4, 2, hat);
    s.ell(15, 9, 3.6, 3.8, skin); s.poly([[8, 7], [22, 7], [19, 5], [11, 5]], hat); s.rect(11, 2, 8, 4, hat); s.line(11, 5, 19, 5, null, '#6a5a3a');
    s.fix(14, 9, '#e8f8ff'); s.fix(17, 9, '#e8f8ff'); s.line(13, 12, 17, 12, null, '#5a7a74');
    for (const x of [12, 14, 16, 18]) s.line(x, 13, x, 15 + (x % 4 ? 1 : 0), null, '#8aa8a0');
    s.line(20, 15, 26, 11, coat); s.line(26, 11, 27, 6, null, '#8a7a5a'); s.line(27, 6, 27, 14, null, '#5a4a30');
    s.ell(27, 17, 3, 3.4, glow); s.rect(25, 13, 5, 1, rp('#6a5a3a')); s.rect(25, 21, 5, 1, rp('#6a5a3a')); s.fix(27, 17, '#ffffff'); s.fix(26, 16, '#fff4b0');
    s.line(10, 15, 5, 21, coat); s.line(5, 21, 3, 26, null, '#b8c0c8'); s.fix(2, 27, '#e8eef4'); return s; };
  A.CREATURE_SPECS.hoarfang = () => { const s = Spr(32, 32), fur = rp('#c8dce8'), dk = rp('#7a94a8'), ice = rp('#8ad0f0');
    s.poly([[3, 17], [0, 12], [2, 11], [6, 15]], fur); s.ell(13, 18, 9, 5.4, fur); s.ell(11, 16, 6, 2.6, rp('#eef6fa'));
    for (const x of [6, 10, 17, 21]) { s.rect(x, 22, 3, 7, x > 12 ? dk : fur); s.rect(x, 29, 4, 1, dk); }
    s.ell(23, 12, 5, 4.6, fur); s.poly([[26, 12], [32, 14], [26, 16]], fur); s.fix(31, 14, '#2a3a4a'); s.line(26, 16, 30, 16, null, '#5a7488');
    s.poly([[20, 9], [21, 3], [23, 8]], dk); s.poly([[24, 8], [26, 3], [27, 9]], fur); s.fix(25, 11, '#ffd24a'); s.fix(26, 11, '#fff0a0');
    for (const x of [27, 29]) s.fix(x, 17, '#ffffff');
    for (const [x, y] of [[8, 13], [11, 11], [14, 12], [17, 11]]) s.poly([[x, y + 2], [x + 1, y - 2], [x + 2, y + 2]], ice);
    s.line(18, 15, 21, 20, null, '#9ab4c6'); return s; };
  A.CREATURE_SPECS.cairnwarden = () => { const s = Spr(32, 32), st = rp('#8a8f98'), dk = rp('#5a5f6a'), lt = rp('#b4bac4'), moss = rp('#6a9a58');
    s.rect(9, 25, 6, 6, dk); s.rect(18, 25, 6, 6, st); s.rect(8, 30, 8, 1, dk); s.rect(17, 30, 8, 1, dk);
    s.poly([[7, 13], [25, 13], [26, 25], [6, 25]], st); s.rect(7, 13, 3, 12, lt); s.rect(21, 14, 5, 11, dk);
    s.line(6, 19, 26, 19, null, '#4a4e58'); s.line(13, 13, 14, 19, null, '#4a4e58'); s.line(19, 19, 18, 25, null, '#4a4e58');
    s.rect(11, 5, 10, 8, st); s.rect(11, 5, 2, 8, lt); s.rect(13, 2, 6, 3, lt); s.rect(15, 0, 3, 2, st);
    s.rect(13, 8, 2, 2, rp('#1a1e24')); s.rect(17, 8, 2, 2, rp('#1a1e24')); s.fix(13, 8, '#8af0ff'); s.fix(17, 8, '#8af0ff');
    s.rect(1, 14, 5, 8, st); s.rect(0, 22, 6, 5, dk); s.rect(26, 13, 5, 8, dk); s.rect(26, 21, 6, 6, st); s.rect(27, 22, 2, 2, lt);
    s.ell(9, 13, 2.4, 1.2, moss); s.ell(22, 5, 2, 1, moss); s.ell(3, 14, 2, 1, moss); return s; };
  A.CREATURE_SPECS.bellringer = () => { const s = Spr(32, 32), robe = rp('#4a6a5e'), dk = rp('#2c4038'), bone = rp('#c8d4c0'), brass = rp('#b8923a'), weed = rp('#3a8a5a');
    s.poly([[9, 11], [19, 11], [22, 30], [6, 30]], robe); s.poly([[16, 11], [19, 11], [22, 30], [17, 30]], dk);
    for (const x of [7, 10, 13, 16, 19]) s.line(x, 28, x, 31, null, '#2c4038');
    s.ell(14, 7, 4.6, 5, robe); s.ell(15, 8, 2.8, 3.2, rp('#141c18')); s.fix(14, 8, '#9af0d0'); s.fix(17, 8, '#9af0d0');
    s.line(9, 14, 5, 20, robe); s.fix(4, 21, '#c8d4c0'); s.line(4, 18, 6, 14, null, '#3a8a5a'); s.line(12, 16, 11, 24, null, '#3a8a5a'); s.ell(11, 25, 1.4, 1, weed);
    s.line(19, 14, 25, 11, robe); s.fix(26, 11, '#c8d4c0'); s.line(26, 11, 26, 14, null, '#6a5a30');
    s.poly([[23, 15], [29, 15], [31, 23], [21, 23]], brass); s.rect(21, 23, 11, 2, rp('#8a6a24')); s.rect(23, 16, 2, 6, rp('#e8c868')); s.fix(26, 26, '#5a4a20'); s.fix(26, 27, '#5a4a20');
    s.ell(27, 19, 1.4, 1, weed); s.line(8, 12, 20, 12, null, '#6a5a30'); return s; };
  A.CREATURE_SPECS.gallowmoth = () => { const s = Spr(32, 32), wing = rp('#d8d0e8'), dk = rp('#9a8ab8'), body = rp('#6a5a7a'), eye = rp('#e8a03a');
    s.poly([[15, 12], [3, 2], [0, 10], [4, 18], [14, 18]], wing); s.poly([[17, 12], [29, 2], [32, 10], [28, 18], [18, 18]], wing);
    s.poly([[14, 18], [5, 20], [4, 27], [10, 29], [15, 22]], dk); s.poly([[18, 18], [27, 20], [28, 27], [22, 29], [17, 22]], dk);
    s.ell(7, 10, 3, 3, eye); s.ell(25, 10, 3, 3, eye); s.ell(7, 10, 1.4, 1.4, rp('#2a1a2a')); s.ell(25, 10, 1.4, 1.4, rp('#2a1a2a')); s.fix(7, 9, '#ffffff'); s.fix(25, 9, '#ffffff');
    for (const [a, b, c, d] of [[14, 14, 4, 5], [14, 16, 2, 13], [18, 14, 28, 5], [18, 16, 30, 13], [13, 21, 6, 26], [19, 21, 26, 26]]) s.line(a, b, c, d, null, '#b0a4cc');
    s.ell(16, 16, 2.6, 8, body); for (let y = 12; y < 24; y += 3) s.line(14, y, 18, y, null, '#4a3e58');
    s.ell(16, 8, 2.6, 2.4, body); s.fix(15, 8, '#f8f0a0'); s.fix(17, 8, '#f8f0a0'); s.line(15, 6, 11, 1, null, '#4a3e58'); s.line(17, 6, 21, 1, null, '#4a3e58'); s.fix(10, 1, '#d8d0e8'); s.fix(22, 1, '#d8d0e8');
    return s; };
  A.CREATURE_SPECS.slagmaw = () => { const s = Spr(32, 32), rock = rp('#4a3a3a'), dk = rp('#2c2224'), lava = rp('#f08a2a'), hot = rp('#ffd060');
    s.ell(5, 27, 4, 2.6, dk); s.ell(27, 27, 4, 2.6, dk); s.rect(2, 28, 7, 2, rock); s.rect(24, 28, 7, 2, rock);
    s.ell(16, 20, 12, 9, rock); s.ell(13, 16, 7, 4, rp('#6a5454')); s.ell(18, 24, 9, 4, dk);
    s.poly([[6, 21], [26, 21], [24, 26], [16, 28], [8, 26]], lava); s.poly([[9, 22], [23, 22], [21, 25], [16, 26], [11, 25]], hot);
    for (const x of [9, 13, 17, 21]) s.poly([[x, 21], [x + 1, 23], [x + 2, 21]], rock);
    s.ell(9, 11, 3.4, 3.2, rock); s.ell(23, 11, 3.4, 3.2, rock); s.ell(9, 11, 1.8, 1.8, hot); s.ell(23, 11, 1.8, 1.8, hot); s.fix(9, 11, '#3a1a0a'); s.fix(23, 11, '#3a1a0a');
    for (const [a, b, c, d] of [[13, 13, 15, 17], [15, 17, 13, 19], [20, 14, 19, 18], [25, 17, 27, 21], [5, 18, 7, 21]]) s.line(a, b, c, d, null, '#f08a2a');
    s.fix(14, 15, '#ffd060'); s.fix(26, 19, '#ffd060'); return s; };
  A.CREATURE_SPECS.ashmatriarch = () => { const s = Spr(32, 32), sc = rp('#8a3a3a'), dk = rp('#5a2228'), ash = rp('#b0a8a8'), horn = rp('#e0d4c0'), wing = rp('#6a2c34');
    s.poly([[12, 14], [2, 3], [0, 12], [3, 17], [1, 21], [11, 20]], wing); for (const x of [3, 6, 9]) s.line(12, 14, x - 2, 4 + (9 - x), null, '#8a4048');
    s.poly([[2, 26], [0, 22], [7, 22], [10, 25]], sc); s.ell(13, 22, 8, 5.6, sc); s.ell(11, 20, 5, 2.4, rp('#b05050')); s.ell(13, 26, 6, 2, rp('#d8a070'));
    s.rect(8, 26, 3, 4, dk); s.rect(16, 26, 3, 4, dk); s.rect(7, 30, 5, 1, horn); s.rect(15, 30, 5, 1, horn);
    s.poly([[17, 20], [20, 10], [24, 10], [22, 22]], sc); s.ell(24, 8, 4.6, 3.6, sc); s.poly([[27, 7], [32, 9], [27, 11]], sc); s.line(27, 10, 31, 10, null, '#3a1418');
    s.poly([[20, 6], [18, 0], [22, 5]], horn); s.poly([[23, 5], [23, -1], [26, 5]], horn); s.fix(26, 7, '#ffd24a'); s.fix(27, 7, '#fff0a0'); s.fix(31, 8, '#2a0a0a');
    for (const [x, y] of [[12, 17], [15, 16], [18, 15], [20, 12]]) s.poly([[x, y + 2], [x + 1, y - 1], [x + 2, y + 2]], ash);
    for (const [x, y] of [[29, 13], [30, 16], [28, 18]]) s.fix(x, y, '#d8d0d0'); return s; };
  A.CREATURE_SPECS.stormram = () => { const s = Spr(32, 32), wool = rp('#e8e4d0'), dk = rp('#b0a888'), face = rp('#4a4038'), horn = rp('#c8a04a'), bolt = rp('#8adcff');
    for (const x of [7, 11, 18, 22]) { s.rect(x, 23, 2, 6, face); s.rect(x, 29, 3, 2, rp('#2a241e')); }
    s.ell(14, 18, 10, 6.4, wool); for (const [x, y] of [[7, 14], [11, 12], [15, 12], [19, 13], [9, 20], [14, 22], [19, 21]]) s.ell(x, y, 2.6, 2.2, (x + y) % 2 ? wool : dk);
    s.ell(5, 16, 2, 2, wool); s.poly([[21, 11], [28, 12], [29, 19], [24, 20]], face); s.fix(26, 14, '#ffe060'); s.line(27, 19, 29, 19, null, '#2a241e');
    s.ell(23, 10, 4.6, 4.4, horn); s.ell(23, 10, 2.6, 2.4, rp('#8a6a2a')); s.ell(23, 10, 1, 1, horn); s.poly([[26, 12], [30, 10], [28, 14]], horn);
    for (const [a, b, c, d] of [[20, 4], [22, 1], [25, 4], [27, 0]].reduce((o, p, i, arr) => i ? o.concat([[arr[i - 1][0], arr[i - 1][1], p[0], p[1]]]) : o, [])) s.line(a, b, c, d, null, '#8adcff');
    s.line(19, 7, 17, 3, null, '#8adcff'); s.line(27, 6, 30, 3, null, '#8adcff'); s.fix(22, 1, '#ffffff'); s.fix(27, 0, '#ffffff'); s.fix(17, 3, '#e0f6ff'); return s; };
  A.CREATURE_SPECS.cloudbreaker = () => { const s = Spr(32, 32), back = rp('#4a6ea8'), belly = rp('#d8e4f4'), fin = rp('#3a5484'), cloud = rp('#eef2fa');
    s.poly([[2, 14], [0, 7], [5, 11], [4, 17]], fin); s.poly([[3, 15], [0, 21], [6, 17]], fin);
    s.poly([[4, 13], [14, 7], [24, 8], [31, 14], [26, 21], [14, 22], [5, 18]], back); s.poly([[6, 17], [14, 18], [26, 17], [30, 15], [26, 21], [14, 22]], belly);
    s.poly([[13, 7], [16, 1], [20, 8]], fin); s.poly([[15, 20], [12, 27], [20, 21]], fin);
    for (const x of [18, 21, 24]) s.line(x, 18, x - 1, 21, null, '#a8b8d0'); for (const [x, y] of [[9, 12], [13, 10], [17, 11], [21, 10]]) s.fix(x, y, '#8ab0e8');
    s.fix(26, 13, '#1a2438'); s.fix(27, 12, '#ffffff'); s.line(25, 17, 30, 15, null, '#2a3a5a');
    for (const [x, y, r] of [[5, 27, 4], [11, 28, 3.4], [18, 28, 4], [25, 27, 3.6], [30, 29, 3]]) s.ell(x, y, r, 2.4, cloud);
    s.line(22, 6, 23, 2, null, '#eef2fa'); s.line(24, 6, 26, 3, null, '#eef2fa'); return s; };
}

/* ---------- the Challenges strip on the hunting panel ---------- */
const minisHere = town => D.MONLIST.filter(m => m.mini && m.town === town);
const area0 = UI.areaPanel;
if (area0) UI.areaPanel = town => {
  const h = area0(town), list = minisHere(town); if (!list.length) return h;
  const f = DQ.act && DQ.act.kind === 'fight' && DQ.act.id;
  const cards = list.map(m => { const ok = DQ.combatLvl() >= m.mini.req, done = S().minis && S().minis[m.id], met = (S().beast.kills[m.id] || 0) > 0, on = f === m.id, d = DQ.dangerOf ? DQ.dangerOf(m) : null;
    return `<article class="mini-card ${done ? 'done' : ''} ${on ? 'on' : ''}" style="--c:${m.col}"><button type="button" class="mini-art" data-do="guide" data-a="${m.id}" aria-label="${esc(m.name)}: open its field guide" data-tip="text:${esc(m.name)} · open its field guide">${DQ.monSprite(m, 64)}</button>
      <div class="mini-t"><span class="k">${done ? '✓ Defeated' : 'Challenge'}</span><b>${esc(m.name)}</b><small>Level ${m.cl}${d ? ` · ${esc(d.label)}` : ''}</small><small class="${ok ? 'ok' : 'bad'}">${ok ? '✓' : '✗'} Combat ${m.mini.req}${ok ? '' : ` (you: ${DQ.combatLvl()})`}</small></div>
      <button class="btn sm ${ok && !on ? 'primary' : ''}" ${ok ? `data-do="act" data-a="fight" data-b="${m.id}"` : 'disabled'}>${on ? 'Retreat' : done ? 'Fight again' : 'Challenge'}</button></article>`; }).join('');
  const strip = `<div class="mini-strip"><div class="k">Challenges before ${esc((D.MON[D.TOWN[town].boss] && D.MON[D.TOWN[town].boss].boss && D.MON[D.TOWN[town].boss].boss.short) || 'the boss')}</div><div class="mini-list">${cards}</div></div>`;
  return h.replace('<div class="area-grid">', strip + '<div class="area-grid">');
};
/* quest tracking: a mini-boss target is fought directly (it is never in a random encounter) */
const hq0 = UI.DO.huntquest;
if (hq0) UI.DO.huntquest = id => { if (D.MON[id] && D.MON[id].mini) { DQ.startAct('fight', id); UI.render(false); return; } hq0(id); };
})();
