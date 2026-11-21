/* Idlewick: sprites for creature_roster.js (21 Nov 2026). 32 x 32, facing right, drawn with the same builders and
   shared ramps as pixel_creatures.js, each with a detail of its own (a sling, a web, a lantern, antlers of light).
   Also the two new items, raw game and roast game. */
(() => {
const A = window.DQ.pixelArt; if (!A || !A.BUILD) return;
const { humanoid, quad, bird, spider, brute, stout, hunch, floater, golem, wisp, veil, serpent, newt, deer, hare, fox, armoured, knight } = A.BUILD;
const rp = c => A.ramp(c), R = A.R || {};
const gob = '#7fae5c';
const S = {
  /* Willowbrook */
  goblin_slinger: () => { const s = humanoid({ skin: '#86b062', cloth: '#6a7a3a', ears: 'goblin', mouth: 'grin', hat: 'bandana', hatCol: '#a04030' }); s.line(22, 18, 27, 12, rp('#8a6a44')); s.ell(27, 11, 1.6, 1.6, rp('#9a9488')); return s; },
  thicket_spider: () => { const s = spider({ col: '#56604a', web: true }); s.fix(20, 15, '#e05a4a'); s.fix(22, 15, '#e05a4a'); return s; },
  goblin_hexer: () => humanoid({ skin: '#7aa65a', cloth: '#4a3a6a', robe: true, ears: 'goblin', mouth: 'grin', hat: 'hood', hatCol: '#33284a', weapon: 'staff', weaponCol: '#9be07a', glow: '#9be07a' }),
  goblin_brute: () => brute({ skin: '#6f9e4c', cloth: '#6a4a2a', club: true }),
  rabbit: () => hare({ fur: '#a68a6a' }),
  pheasant: () => { const s = bird({ plum: '#b8653a', wing: '#7a4a2a', beak: '#e8c060', crest: '#3a7a5a' }); s.line(8, 20, 1, 26, rp('#8a5a32')); s.line(9, 21, 3, 28, rp('#6a4428')); s.fix(16, 12, '#c83a2a'); return s; },
  sheep: () => quad({ fur: '#efeae0', dark: '#3a3434', wool: true, ears: 'floppy', tail: 'fluff', snout: true, snoutCol: '#4a4040', short: true }),
  /* Mossbarrow */
  poacher: () => { const s = humanoid({ skin: '#d8a878', cloth: '#55603a', hat: 'hood', hatCol: '#3e4a2a', weapon: 'axe', beard: '#6a4a2a' }); s.line(7, 14, 10, 22, rp('#6a4a2a')); s.ell(7, 20, 2, 3, rp('#8a6a44')); return s; },
  mossback_spider: () => { const s = spider({ col: '#5f7a44', mark: '#8fc060' }); for (const [x, y] of [[12, 12], [16, 11], [19, 13]]) s.fix(x, y, '#8fc060'); return s; },
  barrow_ghoul: () => hunch({ col: '#8a9a7a', glow: '#c8e0a0' }),
  grave_robber: () => { const s = humanoid({ skin: '#c89870', cloth: '#3a3a44', hat: 'cap', hatCol: '#2a2a30', weapon: 'club' }); s.ell(7, 21, 3.4, 4, rp('#6a5a4a')); s.fix(7, 18, '#e6c86a'); return s; },
  bramble_witch: () => { const s = humanoid({ skin: '#9ab884', cloth: '#4a5a2a', robe: true, hat: 'witch', hatCol: '#2f3a22', weapon: 'staff', weaponCol: '#e48aa8' }); for (const [x, y] of [[10, 22], [21, 25], [13, 28]]) s.fix(x, y, '#e48aa8'); return s; },
  dire_wolf: () => quad({ fur: '#4a4a52', dark: '#2a2a32', belly: '#8a8a92', ears: 'pointy', tail: 'bushy', big: true, mane: true, glow: '#e0c040' }),
  red_deer: () => deer({ fur: '#9a5a34', antler: '#d8c0a0' }),
  /* Saltmere */
  tide_thief: () => humanoid({ skin: '#c8a080', cloth: '#4a6a7a', hat: 'bandana', hatCol: '#2a4a5a', weapon: 'dagger', mask: '#2a2a30' }),
  drowned_sailor: () => humanoid({ skin: '#8aaab0', cloth: '#3a5a6a', zombie: true, hat: 'cap', hatCol: '#2a3a4a', barnacles: true }),
  pirate_bosun: () => { const s = humanoid({ skin: '#c8906a', cloth: '#7a3a2a', big: true, hat: 'tricorn', hatCol: '#2a2020', weapon: 'cutlass', beard: '#3a2a20' }); s.fix(13, 9, '#1a1414'); return s; },
  sea_hag: () => { const s = hunch({ col: '#5a8a6a' }); for (const x of [9, 13, 18]) s.line(x, 6, x - 2, 14, rp('#3a6a4a')); return s; },
  reef_serpent: () => { const s = serpent({ col: '#3a8a8a' }); for (const [x, y] of [[8, 20], [14, 17], [20, 19]]) s.fix(x, y, '#e8a060'); return s; },
  gull: () => bird({ plum: '#e8e8e0', wing: '#9aa0a8', beak: '#e8c040', small: true }),
  seal: () => { const s = quad({ fur: '#8a9098', dark: '#5a6068', belly: '#c8ccd0', short: true, snout: true, snoutCol: '#5a5a60', tail: 'thin' }); for (const [x, y] of [[10, 15], [15, 14], [19, 16]]) s.fix(x, y, '#5a6068'); return s; },
  /* Ironpeak */
  kobold: () => { const s = stout({ skin: '#b0643a', cloth: '#5a4a3a', helm: '#9aa3ad', beard: '#b0643a', axe: true }); s.fix(18, 6, '#ffe070'); s.fix(19, 6, '#fff2a0'); return s; },
  ice_wight: () => veil({ col: '#a8c8e0' }),
  yeti: () => brute({ skin: '#eef2f4', cloth: '#c8d8e0', ice: true }),
  mountain_goat: () => quad({ fur: '#d8d0c0', dark: '#8a8070', horns: true, hornCol: '#6a5a4a', ears: 'pointy', tail: 'thin', snout: true, snoutCol: '#b8a890', hoof: '#4a4038' }),
  snow_hare: () => { const s = hare({ fur: '#f2f4f6' }); s.fix(19, 2, '#2a2a30'); s.fix(21, 1, '#2a2a30'); return s; },
  woolly_yak: () => quad({ fur: '#6a5a4a', dark: '#3a3028', wool: true, horns: true, hornCol: '#e8e0c8', ears: 'floppy', stout: true, big: true, mane: true }),
  ice_elk: () => { const s = deer({ fur: '#b8d0dc', antler: '#e8f6ff', glassy: true }); s.fix(23, 0, '#7ae8ff'); s.fix(29, 0, '#7ae8ff'); return s; },
  /* Gloomfen */
  giant_leech: () => { const s = serpent({ col: '#4a3a3a' }); s.ell(27, 17, 2, 2, rp('#a05a5a')); return s; },
  bog_hag: () => floater({ skin: '#8a9a6a', cloth: '#4a5a3a', hood: '#3a4a2a', staff: '#9be07a' }),
  fen_ghoul: () => hunch({ col: '#7a8a6a', echo: true }),
  marsh_heron: () => { const s = bird({ plum: '#9aa4a8', wing: '#6a7478', beak: '#d8b040', crest: '#3a4448' }); s.line(14, 22, 13, 31, rp('#d8b040')); s.line(18, 22, 19, 31, rp('#d8b040')); return s; },
  fen_boar: () => quad({ fur: '#4a4a3a', dark: '#2a2a20', tusks: true, snout: true, snoutCol: '#8a7a6a', ears: 'pointy', mane: true, tail: 'curly', stout: true, thorns: true }),
  mirelight_stag: () => { const s = deer({ fur: '#6a8a6a', antler: '#c8f0a0', bell: true }); for (const [x, y] of [[21, -1], [28, -1], [19, 1], [30, 1]]) s.fix(x, Math.max(0, y), '#e8ff9a'); return s; },
  moss_tortoise: () => armoured({ fur: '#5a6a3a', plate: '#7a8a4a', spikes: false }),
  /* Emberfall */
  ash_cultist: () => humanoid({ skin: '#c8a080', cloth: '#8a3a2a', robe: true, hat: 'hood', hatCol: '#3a1a1a', weapon: 'staff', weaponCol: '#ffb04a', glow: '#ffb04a' }),
  magma_golem: () => { const s = golem({ col: '#c8602a', eyes: '#ffe070' }); for (const [x, y] of [[13, 13], [18, 16], [15, 19]]) s.fix(x, y, '#ffd060'); return s; },
  ember_wraith: () => wisp({ col: '#e07a3a', lantern: true }),
  cinder_lizard: () => newt({ col: '#c8503a', fin: '#ffb04a' }),
  ember_stag: () => { const s = deer({ fur: '#b8603a', antler: '#ffb04a' }); s.fix(21, 0, '#ffe070'); s.fix(28, 0, '#ffe070'); return s; },
  ashen_boar: () => quad({ fur: '#5a524e', dark: '#3a3432', tusks: true, snout: true, snoutCol: '#8a6a5a', ears: 'pointy', mane: true, stout: true, cracks: '#ff8a3a' }),
  firebird: () => { const s = bird({ plum: '#e8502a', wing: '#ffb04a', beak: '#ffe070', spread: true, crest: '#ffe070', glow: '#ffd060' }); s.line(12, 22, 6, 29, rp('#ffb04a')); s.line(16, 23, 16, 30, rp('#e8502a')); return s; },
  /* Skyreach */
  harpy: () => { const s = bird({ plum: '#8a6a9a', wing: '#5a4a6a', beak: '#d8b898', spread: true }); s.ell(16, 10, 3.6, 3.4, rp('#d8b898')); s.rect(13, 6, 7, 2, rp('#3a2a3a')); return s; },
  sky_pirate: () => humanoid({ skin: '#d8b090', cloth: '#5a6a8a', hat: 'tricorn', hatCol: '#3a4a6a', weapon: 'cutlass', belt: '#c8a050' }),
  storm_elemental: () => { const s = wisp({ col: '#7ac8e8' }); s.line(8, 10, 12, 16, rp('#ffffff')); s.line(12, 16, 10, 20, rp('#ffffff')); return s; },
  cloud_giant: () => humanoid({ skin: '#dce4ec', cloth: '#5a6aa8', cloth2: '#3a4a7a', big: true, beard: '#f4f6f8', hair: '#f4f6f8', weapon: 'club' }),
  griffin: () => { const s = quad({ fur: '#c8a050', dark: '#8a6a30', ears: 'pointy', tail: 'thin', big: true }); s.poly([[12, 14], [6, 4], [16, 10]], rp('#e8e0c8')); s.poly([[16, 13], [22, 3], [20, 12]], rp('#d8d0b8')); s.poly([[27, 13], [31, 15], [27, 16]], rp('#e8c040')); return s; },
  sky_stag: () => { const s = deer({ fur: '#e8e0c8', antler: '#f0c75a' }); s.poly([[10, 14], [4, 9], [12, 12]], rp('#ffffff')); return s; },
  /* the Hollow */
  void_stalker: () => { const s = spider({ col: '#5a3a7a', glow: '#b08aff' }); s.fix(23, 14, '#e8d8ff'); return s; },
  hollow_wight: () => knight({ metal: '#4a4060', tabard: '#2a2438', cape: '#3a3050', crown: '#b08aff', glow: '#b08aff', blade: '#8a7ab8' }),
  moon_hare: () => { const s = hare({ fur: '#d8d4f0' }); s.ell(9, 6, 3, 3, rp('#f4f0c8')); s.fix(10, 5, '#d8d4f0'); return s; },
  star_stag: () => { const s = deer({ fur: '#3a3a6a', antler: '#e8e0ff' }); for (const [x, y] of [[9, 14], [13, 16], [17, 13], [11, 18]]) s.fix(x, y, '#ffffff'); return s; },
  shadow_lynx: () => { const s = fox({ fur: '#2a2438' }); s.fix(23, 13, '#b08aff'); s.fix(20, 6, '#e8e0ff'); s.fix(25, 6, '#e8e0ff'); return s; },
  eclipse_roc: () => { const s = bird({ plum: '#1a1a2a', wing: '#3a3050', beak: '#f0c75a', spread: true, crest: '#f0c75a' }); s.ell(16, 4, 3, 3, rp('#f0c75a')); s.ell(17, 4, 2.4, 2.4, rp('#1a1a2a')); return s; }
};
Object.assign(A.CREATURE_SPECS, S);
/* the two new items */
const item0 = A.itemSprite;
A.itemSprite = id => {
  if (id === 'raw_game') { const s = A.Spr(16, 16), m = rp('#b5574a'), f = rp('#efe2c4'); s.ell(7, 9, 5.4, 4, m); s.ell(6, 8, 2, 1.4, rp('#d88a7a')); s.line(11, 7, 14, 3, f); s.ell(14, 3, 1.4, 1.4, f); s.fix(15, 2, '#ffffff'); return s; }
  if (id === 'roast_game') { const s = A.Spr(16, 16), p = rp('#efe2c4'), m = rp('#a8683a'); s.ell(8, 12, 7, 2.2, p); s.ell(7, 9, 5, 3.4, m); s.ell(6, 8, 2, 1, rp('#d8a060')); s.line(11, 8, 14, 4, rp('#efe2c4')); s.fix(4, 11, '#6a9a4a'); s.fix(11, 11, '#6a9a4a'); return s; }
  return item0(id);
};
})();
