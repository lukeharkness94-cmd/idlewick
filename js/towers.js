/* Trial towers (Dec 2026, World Life): one per town, five floors, a unique boss at the top with a signature reward.
   Never required: nothing else in the game checks them. Floors are ordinary fights (the same preparation, food,
   abilities and companion), climbed in order; the highest floor cleared is saved in S.towers[town] and losing costs
   nothing. Everything is data: D.TOWERS. Floors 1 to 4 are the region's toughest creatures grown stronger; floor 5 is
   the tower's own boss. Loaded after hunting.js and minibosses.js so wild beasts and saves are unchanged. */
(() => {
const DQ = window.DQ, D = DQ.data, S = () => DQ.S;
const U = (key, name, text) => ({ key, name, text });
const prize = (id, o) => { D.ITEMS[id] = Object.assign({ id, type: 'gear', rare: 1, tower: 1, val: 0, keepsake: true }, o); };
prize('squeaks_crown', { name: 'Squeak’s crown', ic: 'helm', col: '#e8c860', slot: 'head', req: { defence: 5 }, b: { def: 6 }, unique: U('fortune', 'Rat king’s luck', '+25% drop chance · +5% coins'), flavour: 'Bent tin and a great deal of confidence.' });
prize('greenwood_blade', { name: 'Greenwood greatsword', ic: 'sword', col: '#5aa86a', slot: 'weapon', wtype: 'sword', style: 'melee', req: { melee: 20 }, b: { atk: 24, str: 22 }, unique: U('lifesteal', 'Sap', '20% lifesteal'), flavour: 'It is still growing.' });
prize('lamplight_staff', { name: 'Lamplight staff', ic: 'staff', col: '#f0d880', slot: 'weapon', wtype: 'staff', style: 'magic', req: { magic: 22 }, b: { mag: 30 }, unique: U('arc', 'Beam', '20% chance: extra hit for half damage'), flavour: 'The lamp at its head has never needed oil.' });
prize('rimebeards_bulwark', { name: 'Rimebeard’s bulwark', ic: 'shield', col: '#a8d0e8', slot: 'shield', req: { defence: 40 }, b: { def: 28 }, unique: U('thorns', 'Frostbite', 'Reflects 35% of damage taken'), flavour: 'Cold enough to stick to.' });
prize('abbots_censer', { name: 'Abbot’s censer', ic: 'amulet', col: '#8ab8a0', slot: 'amulet', b: { def: 8, mag: 8 }, unique: U('slow', 'Incense', 'Enemies attack 15% slower'), flavour: 'The smoke goes down, not up.' });
prize('ashkas_hammer', { name: 'Ashka’s hammer', ic: 'hammer', col: '#f08a3a', slot: 'weapon', wtype: 'hammer', style: 'melee', req: { melee: 50 }, b: { atk: 44, str: 64 }, unique: U('stun', 'Ringing blow', '12% chance on hit: stun (enemy skips an attack)'), flavour: 'She made everything else with it first.' });
prize('windcaller_bow', { name: 'Windcaller bow', ic: 'bow', col: '#bfe8ff', slot: 'weapon', style: 'ranged', req: { ranged: 55 }, b: { rng: 92 }, unique: U('marked', 'First wind', 'First 3 shots each fight: sure hit, +50% damage'), flavour: 'Strung with a note from the great bell.' });
prize('shadow_mantle', { name: 'Shadow mantle', ic: 'body', col: '#6a5a9a', slot: 'body', req: { defence: 60 }, b: { def: 62 }, unique: U('laststand', 'Borrowed time', 'Survive one fatal blow per fight on 1 health'), flavour: 'It fits better than it should.' });
/* town, the tower, its boss, the prize, a colour for the boss and its special */
D.TOWERS = {
  willowbrook: { name: 'The Old Granary', boss: ['tw_squeak', 'Old Squeak, King of Rats', '#9a8a70', 'Swarm'], prize: 'squeaks_crown' },
  mossbarrow: { name: 'Watchtower in the Wood', boss: ['tw_greenknight', 'The Green Knight', '#4a8a4a', 'Great cleave'], prize: 'greenwood_blade' },
  saltmere: { name: 'The Old Lighthouse', boss: ['tw_keeper', 'The Keeper of the Lamp', '#e0c860', 'Blinding beam'], prize: 'lamplight_staff' },
  ironpeak: { name: 'Frostspire', boss: ['tw_rimebeard', 'Jarl Rimebeard', '#a8c8e0', 'Avalanche'], prize: 'rimebeards_bulwark' },
  gloomfen: { name: 'The Sunken Belfry', boss: ['tw_abbot', 'The Drowned Abbot', '#6a9a8a', 'Last rites'], prize: 'abbots_censer' },
  emberfall: { name: 'The Cinder Stack', boss: ['tw_ashka', 'Forge-Mother Ashka', '#e0703a', 'Quench'], prize: 'ashkas_hammer' },
  skyreach: { name: 'Bell Tower of the Winds', boss: ['tw_bellringer', 'The Last Bellringer', '#d8d0b0', 'Great peal'], prize: 'windcaller_bow' },
  hollow: { name: 'The Hollow Spire', boss: ['tw_shadow', 'The King’s Shadow', '#7a6ab0', 'Eclipse'], prize: 'shadow_mantle' },
};
D.TOWER_FLOORS = 5;
const HP = [2.0, 2.3, 2.6, 3.0], MAX = [1.1, 1.18, 1.26, 1.34];
for (const [town, T] of Object.entries(D.TOWERS)) {
  if (!D.TOWN[town]) { delete D.TOWERS[town]; continue; }
  const local = D.MONLIST.filter(m => m.town === town && !m.boss && !m.mini).sort((a, b) => a.cl - b.cl).slice(-4), boss = D.MON[D.TOWN[town].boss];
  T.town = town; T.floors = []; T.rec = Math.min(118, boss.boss.req + 8);
  const add = (id, name, floor, base, hp, max, k, col, extra) => { const m = { id, name, town, cl: base.cl + floor * 2, hp: Math.round(base.hp * hp), max: Math.max(1, Math.round(base.max * max)), att: Math.round(base.att * k), def: Math.round(base.def * k), coins: [base.coins[0] * 3, base.coins[1] * 4], col, drops: extra.drops || [], tower: { town, floor }, mini: Object.assign({ short: name, req: 0 }, extra.mini || {}) }; D.MON[id] = m; D.MONLIST.push(m); T.floors.push(id); return m; };
  local.forEach((b, i) => add(`tw_${town}_${i + 1}`, `${b.name} of the tower`, i + 1, b, HP[i], MAX[i], 1.08 + i * .03, b.col, { art: b.id, mini: { won: `Floor ${i + 1} of ${T.name} is clear.` }, drops: [['coin_pouch', [1, 2], .5], ['treasure_chest', [1, 1], .06 + i * .02]] }).base = b.id);
  const [bid, bname, bcol, sp] = T.boss;
  add(bid, bname, 5, boss, 1.5, 1.22, 1.12, bcol, { drops: [[T.prize, [1, 1], 0], ['treasure_chest', [1, 1], .5], ['coin_pouch', [2, 4], 1]], mini: { short: bname.replace(/^The /, 'the '), first: T.prize, special: { every: 3, mult: 1.5, name: sp }, won: `${T.name} is yours. ${D.ITEMS[T.prize].name} was waiting at the top.` } });
  D.WEAK[bid] = { weak: [], resist: [] }; local.forEach((b, i) => { D.WEAK[`tw_${town}_${i + 1}`] = D.WEAK[b.id] || { weak: [], resist: [] }; });
  if (D.LORE) D.LORE[bid] = { note: `Waits at the top of ${T.name}. Every third blow is its ${sp.toLowerCase()}. No weakness that anyone has found.`, legend: `Nobody asked it to guard the place. Nobody has managed to ask it to stop.` };
}
/* ---------- rules ---------- */
DQ.towerFloor = town => ((S().towers || {})[town]) || 0;
DQ.towerNext = town => { const T = D.TOWERS[town]; return T && DQ.towerFloor(town) < D.TOWER_FLOORS ? D.MON[T.floors[DQ.towerFloor(town)]] : null; };
DQ.towerDone = town => DQ.towerFloor(town) >= D.TOWER_FLOORS;
const start0 = DQ.startAct;
DQ.startAct = (kind, id, o = {}) => { const m = kind === 'fight' && D.MON[id];
  if (m && m.tower && m.tower.floor > DQ.towerFloor(m.tower.town) + 1 && !(DQ.act && DQ.act.kind === kind && DQ.act.id === id)) { if (!o.quiet) DQ.toast(`Clear floor ${DQ.towerFloor(m.tower.town) + 1} first`, true); return false; }
  return start0(kind, id, o); };
(DQ.killHooks = DQ.killHooks || []).push(m => { if (!m.tower) return; const T = S().towers = S().towers || {}; if (m.tower.floor > (T[m.tower.town] || 0)) { T[m.tower.town] = m.tower.floor;
    if (DQ.journal) DQ.journal('tower', m.tower.floor >= D.TOWER_FLOORS ? `Climbed ${D.TOWERS[m.tower.town].name} and beat ${m.name}.` : `Cleared floor ${m.tower.floor} of ${D.TOWERS[m.tower.town].name}.`, 'trophy');
    for (const r of D.SECRET_RECIPES || []) if (r.tower && r.tower[0] === m.tower.town && r.tower[1] === m.tower.floor) DQ.learnRecipe(r.id); } });
/* ---------- art: floors reuse the creature they grew from; each boss is its own drawing ---------- */
const A = DQ.pixelArt;
if (A && A.CREATURE_SPECS) {
  const { Spr, ramp, mix } = A, rp = c => ramp(c);
  for (const T of Object.values(D.TOWERS)) T.floors.slice(0, 4).forEach(id => { const b = D.MON[id].base; if (A.CREATURE_SPECS[b]) A.CREATURE_SPECS[id] = A.CREATURE_SPECS[b]; });
  A.CREATURE_SPECS.tw_squeak = () => { const s = Spr(32, 32), fur = rp('#9a8a70'), dk = rp('#6a5a48'), pink = rp('#e0a0a0'), gold = rp('#e8c860');
    s.line(6, 26, 1, 22, pink); s.line(1, 22, 3, 17, pink); s.ell(15, 22, 9, 7, fur); s.ell(13, 19, 5, 3, rp(mix('#9a8a70', '#ffffff', .2))); s.ell(16, 26, 6, 2.4, rp('#d8c8b0'));
    s.rect(9, 27, 4, 3, dk); s.rect(18, 27, 4, 3, dk); s.ell(23, 14, 5.4, 4.6, fur); s.poly([[27, 13], [32, 16], [27, 17]], fur); s.fix(31, 16, '#e0a0a0');
    s.ell(20, 9, 2.4, 2.6, pink); s.ell(25, 8, 2.4, 2.6, pink); s.fix(26, 13, '#1a1a1a'); s.fix(27, 12, '#ffffff'); for (const y of [15, 17]) s.line(28, y, 31, y + 1, null, '#d8c8b0');
    s.rect(20, 5, 7, 2, gold); for (const x of [20, 23, 26]) s.rect(x, 3, 1, 2, gold); s.fix(23, 6, '#e0403a'); return s; };
  A.CREATURE_SPECS.tw_greenknight = () => { const s = Spr(32, 32), ar = rp('#4a8a4a'), dk = rp('#2c5a30'), leaf = rp('#8ac860'), steel = rp('#c8d0c8');
    s.rect(10, 26, 4, 5, dk); s.rect(17, 26, 4, 5, ar); s.poly([[8, 13], [23, 13], [22, 26], [9, 26]], ar); s.rect(9, 13, 3, 12, rp('#6aaa60')); s.rect(19, 14, 4, 12, dk);
    s.ell(15, 8, 4.6, 4.8, ar); s.rect(12, 8, 7, 1, rp('#1a2a1a')); s.poly([[13, 3], [15, -1], [17, 3]], leaf); s.ell(8, 14, 3, 2.4, leaf); s.ell(23, 14, 3, 2.4, leaf);
    s.line(23, 16, 27, 20, ar); s.line(27, 22, 27, 2, null, '#c8d0c8'); s.line(28, 21, 28, 4, null, '#8a9890'); s.rect(25, 21, 5, 1, rp('#8a6a2a')); s.line(8, 16, 4, 21, ar); s.ell(4, 22, 3.4, 4.4, dk); s.ell(4, 22, 1.6, 2.4, leaf);
    for (const [x, y] of [[12, 17], [16, 20], [19, 16]]) s.fix(x, y, '#a8e070'); return s; };
  A.CREATURE_SPECS.tw_keeper = () => { const s = Spr(32, 32), coat = rp('#3a4a60'), dk = rp('#242e3c'), skin = rp('#d8c8a8'), glow = rp('#f4e08a'), brass = rp('#b8923a');
    s.poly([[9, 13], [21, 13], [24, 30], [6, 30]], coat); s.poly([[17, 13], [21, 13], [24, 30], [19, 30]], dk); s.ell(15, 9, 4, 4.2, skin); s.poly([[10, 13], [15, 20], [20, 13]], rp('#e8e8e8'));
    s.rect(10, 4, 10, 3, dk); s.rect(8, 6, 14, 1, dk); s.fix(13, 9, '#1a1a1a'); s.fix(17, 9, '#1a1a1a'); s.line(20, 16, 26, 12, coat);
    s.rect(24, 5, 6, 8, brass); s.ell(27, 9, 2.2, 2.6, glow); s.fix(27, 9, '#ffffff'); s.rect(25, 3, 4, 2, brass); for (const [a, b] of [[30, 6], [31, 9], [30, 12]]) s.line(29, 9, a + 1, b, null, '#fff4b0');
    s.line(9, 16, 5, 22, coat); return s; };
  A.CREATURE_SPECS.tw_rimebeard = () => { const s = Spr(32, 32), fur = rp('#8a7a6a'), ice = rp('#a8d0e8'), dk = rp('#4a5a6a'), skin = rp('#d8b8a0'), steel = rp('#b8c4cc');
    s.rect(9, 26, 5, 5, dk); s.rect(18, 26, 5, 5, dk); s.poly([[6, 12], [26, 12], [25, 27], [7, 27]], fur); s.rect(7, 12, 3, 14, rp('#a89a88')); s.ell(16, 12, 10, 3, rp('#e8eef4'));
    s.ell(16, 8, 4.6, 4.4, skin); s.poly([[11, 9], [16, 20], [21, 9]], ice); s.poly([[13, 11], [16, 18], [19, 11]], rp('#e8f4fa')); s.rect(11, 3, 10, 3, steel); s.poly([[10, 4], [7, -1], [12, 3]], rp('#e0d4c0')); s.poly([[22, 4], [25, -1], [20, 3]], rp('#e0d4c0'));
    s.fix(14, 8, '#6ac8ff'); s.fix(18, 8, '#6ac8ff'); s.line(26, 15, 30, 20, fur); s.line(29, 26, 29, 6, null, '#6a5a4a'); s.poly([[26, 4], [32, 6], [32, 12], [26, 12]], ice); s.line(6, 15, 2, 21, fur); return s; };
  A.CREATURE_SPECS.tw_abbot = () => { const s = Spr(32, 32), robe = rp('#3a5a52'), dk = rp('#223832'), bone = rp('#c8d4c0'), weed = rp('#3a8a5a'), gold = rp('#b8a04a');
    s.poly([[8, 12], [22, 12], [26, 31], [4, 31]], robe); s.poly([[17, 12], [22, 12], [26, 31], [19, 31]], dk); s.ell(15, 8, 4.4, 4.6, bone); s.rect(13, 8, 2, 2, rp('#101814')); s.rect(16, 8, 2, 2, rp('#101814')); s.fix(13, 8, '#9af0d0'); s.fix(17, 8, '#9af0d0');
    s.poly([[10, 5], [15, -1], [20, 5]], gold); s.line(15, 0, 15, 4, null, '#e8d880'); s.line(13, 2, 17, 2, null, '#e8d880'); s.line(12, 12, 18, 12, null, '#b8a04a');
    s.line(22, 15, 27, 12, robe); s.line(28, 30, 28, 3, null, '#8a7a4a'); s.ell(28, 3, 2, 2, gold); s.line(8, 15, 4, 20, robe); for (const [x, y] of [[9, 20], [14, 26], [20, 22]]) s.line(x, y, x - 1, y + 4, null, '#3a8a5a'); s.ell(6, 28, 2, 1, weed); return s; };
  A.CREATURE_SPECS.tw_ashka = () => { const s = Spr(32, 32), skin = rp('#8a4a3a'), apron = rp('#5a3a2a'), hot = rp('#ffb040'), iron = rp('#5a5a62'), hair = rp('#e0602a');
    s.rect(10, 26, 5, 5, apron); s.rect(18, 26, 5, 5, apron); s.poly([[7, 12], [25, 12], [24, 27], [8, 27]], skin); s.poly([[10, 14], [22, 14], [21, 27], [11, 27]], apron); s.rect(11, 15, 2, 11, rp('#7a5238'));
    s.ell(16, 8, 4.6, 4.6, skin); s.poly([[11, 6], [13, 0], [16, 4], [19, 0], [21, 6]], hair); s.fix(14, 8, '#ffd060'); s.fix(18, 8, '#ffd060'); s.line(13, 11, 19, 11, null, '#3a1a10');
    s.line(25, 14, 29, 10, skin); s.line(29, 24, 29, 4, null, '#6a4a2a'); s.rect(25, 2, 7, 5, iron); s.rect(25, 2, 7, 1, rp('#8a8a94')); s.rect(31, 3, 1, 3, hot);
    s.line(7, 14, 3, 20, skin); s.ell(3, 22, 2.4, 2.4, hot); s.fix(3, 22, '#ffffff'); for (const [x, y] of [[2, 18], [5, 17], [1, 25]]) s.fix(x, y, '#ffd060'); return s; };
  A.CREATURE_SPECS.tw_bellringer = () => { const s = Spr(32, 32), robe = rp('#b8a888'), dk = rp('#8a7a5a'), skin = rp('#e0c8a8'), brass = rp('#c8a04a'), sky = rp('#bfe8ff');
    s.poly([[8, 12], [20, 12], [23, 31], [5, 31]], robe); s.poly([[16, 12], [20, 12], [23, 31], [18, 31]], dk); s.ell(14, 8, 4.2, 4.4, skin); s.ell(14, 5, 4.6, 2.2, robe); s.fix(13, 8, '#3a5a8a'); s.fix(16, 8, '#3a5a8a'); s.line(12, 11, 16, 11, null, '#8a6a4a');
    s.line(8, 20, 20, 20, null, '#6a5a3a'); s.line(20, 15, 25, 9, robe); s.line(26, 9, 26, 12, null, '#6a5a3a'); s.poly([[22, 13], [30, 13], [32, 23], [20, 23]], brass); s.rect(20, 23, 12, 2, rp('#9a7a2a')); s.rect(22, 14, 2, 8, rp('#f0d070')); s.fix(26, 26, '#6a5a20'); s.fix(26, 27, '#6a5a20');
    for (const [a, b, c, d] of [[19, 5, 22, 3], [27, 4, 30, 2], [3, 9, 6, 7], [2, 16, 5, 15]]) s.line(a, b, c, d, null, '#bfe8ff'); s.line(8, 15, 4, 21, robe); return s; };
  A.CREATURE_SPECS.tw_shadow = () => { const s = Spr(32, 32), sh = rp('#3a2e5a'), dk = rp('#1e1830'), glow = rp('#b08aff'), crown = rp('#7a6ab0');
    s.poly([[9, 12], [23, 12], [28, 31], [20, 28], [16, 31], [12, 28], [4, 31]], sh); s.poly([[17, 12], [23, 12], [28, 31], [20, 28]], dk); s.ell(16, 8, 4.8, 5, dk); s.fix(14, 8, '#d8c0ff'); s.fix(18, 8, '#d8c0ff'); s.fix(14, 9, '#b08aff'); s.fix(18, 9, '#b08aff');
    s.rect(11, 3, 11, 2, crown); for (const x of [11, 14, 16, 18, 21]) s.rect(x, x === 16 ? 0 : 1, 1, x === 16 ? 3 : 2, crown); s.fix(16, 1, '#e8d8ff');
    s.line(23, 15, 28, 11, sh); s.line(29, 28, 29, 2, null, '#5a4a8a'); s.poly([[27, 2], [29, -1], [31, 2], [29, 6]], glow); s.line(9, 15, 4, 19, sh); s.ell(3, 20, 2, 2, glow);
    for (const [x, y] of [[8, 24], [14, 22], [22, 25], [12, 18]]) s.fix(x, y, '#7a6ab0'); return s; };
}
})();
