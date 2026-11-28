/* Idlewick: the interface icons, skill emblems and boss trophies, redrawn in the chunky outlined style (owner, 28 Nov
   2026; docs/pixel-art-style.md). 16 x 16 icons (the menus, the HUD, coins, stats, routes) keep a one-pixel margin so
   every silhouette gets its outline in its material's darkest step; strokes are two pixels wide, light comes from the
   top left and each icon uses a few materials. The 32 x 32 skill emblems (the rail, skill rows, level-ups) are fuller
   drawings of the same objects. Ids drawn here win; anything else falls through to pixel_world.js (item-type icons
   such as fish, ore or helm reuse the item sprite there). Loaded after pixel_world.js and the skill art files and
   before pixel_runtime.js, which builds the .pxi-<id> rules from A.iconUrl when it loads. */
(() => {
const Q = window.DQ, A = Q && Q.pixelArt; if (!A || !A.iconSprite) return;
const { Spr, ramp, R } = A, rp = (c, o) => ramp(c, o);

/* ---------- materials ---------- */
const M = {
  wood: R.wood, dark: rp('#6a4428'), pale: R.woodLight, steel: R.steel, iron: R.iron, gold: R.gold, brass: rp('#d8a040', { gl: .7 }),
  red: R.red, paper: rp('#e8d8b0'), leather: R.leather, stone: R.stone, slate: rp('#5a6070'), cloth: R.cloth, leaf: R.leafCrop,
  straw: R.straw, plaster: R.plaster, fish: rp('#6aa8d0'), water: rp('#3f7fb8'), violet: rp('#8a6ae0', { gl: .8 }), rune: rp('#6a7088'),
  glow: rp('#8fd0ff', { gl: .9 }), heart: rp('#d8403a'), flame: rp('#f07a2a', { gl: .9 }), ember: rp('#ffc04a', { gl: .9 }),
  bone: rp('#e8e0cc'), cork: rp('#c8a070'), pot: rp('#5a5660'), skin: rp('#e8a878'), fur: rp('#b0784a'), green: rp('#4fa860'),
  ink: rp('#2a2230'), bronze: R.bronze, white: rp('#f4ecd8'), blue: rp('#3f6fd6', { gl: .75 }), sea: rp('#2f6fa8'), sail: rp('#efe2c4')
};
/* a stroke w pixels wide, lit on its top-left side and shaded on the other (steep lines thicken sideways, shallow ones
   downwards); w = 1 keeps the automatic edge light */
const tline = (s, x0, y0, x1, y1, r, lv) => { const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0), 1); for (let i = 0; i <= n; i++) { const x = Math.round(x0 + (x1 - x0) * i / n), y = Math.round(y0 + (y1 - y0) * i / n); lv == null ? s.dot(x, y, r) : s.tone(x, y, r, lv); } };
const ln = (s, x0, y0, x1, y1, r, w = 2) => { const steep = Math.abs(y1 - y0) >= Math.abs(x1 - x0); for (let k = 0; k < w; k++) { const lv = w === 1 ? null : k === 0 ? 3 : k === w - 1 ? 1 : 2; steep ? tline(s, x0 + k, y0, x1 + k, y1, r, lv) : tline(s, x0, y0 + k, x1, y1 + k, r, lv); } };
const dots = (s, list, r) => { for (const [x, y] of list) s.dot(x, y, r); };
const fixes = (s, list, c) => { for (const [x, y] of list) s.fix(x, y, c); };
/* hand-placed rows: each character names a material (or a fixed colour); '.' is empty */
const G = (s, rows, map, ox = 0, oy = 0) => s.grid(rows, map, ox, oy);
const INK = '#1c1418', SHINE = '#fff6dc';

/* ================= 16 x 16 icons ================= */
const I = {
  /* skills */
  fishing: s => { ln(s, 1, 7, 9, 1, M.dark); ln(s, 1, 7, 3, 6, M.cork); fixes(s, [[10, 1], [11, 2], [11, 3], [11, 4], [11, 5], [11, 6], [11, 7]], '#e8e4d8');
    const f = rp('#3f80b8'); s.ell(10, 11, 3.4, 2.4, f); s.poly([[7, 11], [4, 8.5], [4, 13.5]], f); s.line(8, 9, 11, 9, null, '#3f7aa8'); s.fix(12, 10, INK); s.fix(13, 11, '#3f7aa8'); s.line(8, 12, 12, 12, null, '#d8ecf4'); s.fix(11, 8, '#c8483c'); },
  woodcutting: s => { s.rect(2, 10, 10, 4, M.wood); s.line(3, 12, 10, 12, null, '#6a4428'); s.ell(12, 11, 1.6, 2, M.pale, { flat: true }); s.fix(12, 11, '#8a5a32'); ln(s, 3, 9, 9, 3, M.dark);
    G(s, ['....ss', '...sss', 'iiisss', 'iiisss', 'iiisss', '...sss', '....ss'], { i: M.iron, s: M.steel }, 8, 0); s.erase(13, 0); s.erase(12, 0); s.dot(12, 1, M.steel); s.fix(13, 2, SHINE); },
  mining: s => { s.poly([[2, 14], [3, 10], [7, 9], [12, 11], [13, 14]], M.stone); fixes(s, [[5, 12], [6, 12], [9, 12]], '#e0843e'); s.fix(5, 11, '#f8b070');
    ln(s, 5, 10, 9, 3, M.dark); for (const [x, y] of [[3, 4], [4, 3], [5, 2], [6, 2], [7, 2], [8, 2], [9, 2], [10, 2], [11, 3], [12, 4], [13, 5]]) s.dot(x, y, M.iron); for (const [x, y] of [[4, 4], [5, 3], [11, 4], [12, 5]]) s.dot(x, y, M.iron); },
  thieving: s => { G(s, ['......hhhh......', '....hhhhhhhh....', '...hhhhhhhhhh...', '..hhhhffffhhhh..', '..hhhffffffhhh..', '.hhhffffffffhhh.', '.hhhfeffffefhhh.', '.hhhffffffffhhh.', '.hhhhffffffhhhh.', '..hhhhffffhhhh..', '..hhhhhhhhhhhh..', '.hhhhhhhhhhhhhh.', '.hhhhhhhhhhhhhh.'], { h: rp('#5a4a78'), f: '#160f1c', e: '#ffd84a' }, 0, 1); },
  farming: s => { ln(s, 2, 14, 7, 3, M.wood); s.poly([[6, 1], [10, 1], [12, 4], [11, 5], [9, 3], [6, 3]], M.iron); s.fix(9, 1, SHINE);
    for (const [x, t] of [[10, 7], [13, 8]]) { s.line(x, 14, x, t + 3, rp('#8aa040')); for (let y = t - 2; y <= t + 2; y++) { s.dot(x, y, M.straw); s.dot(x + (y % 2 ? -1 : 1), y, M.straw); } s.fix(x, t - 3, '#f6dc8a'); } },
  cooking: s => { s.ell(8, 10, 5.6, 3.6, M.pot); s.rect(2, 7, 12, 2, M.iron); s.ell(8, 7, 4.4, 1, rp('#d8803a'), { flat: true }); s.fix(6, 7, '#f8b070'); s.rect(1, 8, 1, 2, M.iron); s.rect(14, 8, 1, 2, M.iron);
    fixes(s, [[5, 5], [6, 4], [5, 3], [6, 2], [10, 5], [11, 4], [10, 3], [11, 2]], '#d8d4d0'); },
  smithing: s => { G(s, ['................', '................', '................', '................', '................', '................', '.aaaaaaaaaaa....', '..aaaaaaaaaaaa..', '....aaaaaaaa....', '......aaaa......', '......aaaa......', '....aaaaaaaa....', '...aaaaaaaaaa...', '................'], { a: M.slate });
    ln(s, 8, 6, 12, 2, M.wood, 1); s.rect(10, 1, 5, 3, M.iron); s.fix(10, 1, SHINE); fixes(s, [[3, 4], [5, 3]], '#ffb04a'); s.fix(4, 2, '#fff0a0'); },
  crafting: s => { s.rect(2, 2, 8, 2, M.pale); s.rect(2, 12, 8, 2, M.pale); s.rect(3, 4, 6, 8, rp('#c84a6a')); for (const y of [5, 7, 9]) s.line(3, y, 8, y, null, '#9a3050'); fixes(s, [[3, 4], [3, 6], [3, 8]], '#f08aa8');
    s.line(9, 10, 11, 12, null, '#c84a6a'); ln(s, 11, 14, 14, 3, M.steel, 1); s.fix(14, 2, SHINE); s.fix(13, 5, INK); },
  magic: s => { ln(s, 2, 14, 8, 6, M.dark); s.rect(8, 5, 2, 2, M.gold); s.ell(11, 4, 2.6, 2.6, M.violet); s.fix(10, 3, '#ffffff'); fixes(s, [[14, 8], [6, 2], [14, 1]], '#d8ccff'); s.fix(13, 9, '#a898ff'); },
  research: s => { s.poly([[1, 4], [7, 3], [8, 4], [9, 3], [14, 4], [14, 12], [9, 12], [8, 13], [7, 12], [1, 12]], M.red); s.poly([[2, 5], [7, 4], [7, 11], [2, 11]], M.white); s.poly([[9, 4], [13, 5], [13, 11], [9, 11]], M.paper);
    for (const y of [6, 8, 10]) { s.line(3, y, 6, y, null, '#9a8a7a'); s.line(10, y, 12, y, null, '#a89a88'); } s.rect(11, 1, 2, 5, M.gold); },
  attack: s => { for (let i = 0; i < 8; i++) { s.dot(5 + i, 10 - i, M.steel); s.dot(6 + i, 10 - i, M.steel); } s.dot(13, 2, M.steel); s.fix(12, 2, SHINE); ln(s, 2, 8, 7, 13, M.gold, 1); s.dot(3, 8, M.gold); s.dot(7, 12, M.gold); ln(s, 2, 13, 4, 11, M.leather, 2); s.dot(1, 14, M.gold); },
  strength: s => { G(s, ['................', '................', '.......aaa......', '......aaaaa.....', '......aaaaa.....', '......aaaa......', '.....aaaa.......', '....aaaa........', '.aaaaaaaaaa.....', '.aaaaaaaaaaa....', '.aaaaaaaaaaa....', '..aaaaaaaaa.....', '................'], { a: M.skin }); s.rect(1, 8, 2, 4, M.cloth); s.fix(8, 4, '#c87a50'); s.fix(4, 9, '#c87a50'); },
  defence: s => { s.poly([[2, 2], [13, 2], [13, 8], [8, 14], [7, 14], [2, 8]], M.steel); s.poly([[4, 4], [11, 4], [11, 8], [7.5, 12], [4, 8]], M.blue); s.rect(7, 4, 2, 8, M.gold); s.rect(4, 6, 8, 2, M.gold); },
  hitpoints: s => { G(s, ['................', '................', '..hhhh..hhhh....', '.hhhhhhhhhhhh...', '.hhhhhhhhhhhh...', '.hhhhhhhhhhhh...', '.hhhhhhhhhhhh...', '..hhhhhhhhhh....', '...hhhhhhhh.....', '....hhhhhh......', '.....hhhh.......', '......hh........'], { h: M.heart }, 1, 1); fixes(s, [[3, 4], [4, 4], [3, 5]], '#ffd8c8'); },
  ranged: s => { G(s, ['....bb..........', '....sbb.........', '...s..bb........', '...s...bb.......', '..s.....b...h...', '..s.....bb..hh..', '.faaaaaaaaaahhh.', '..s.....bb..hh..', '..s.....b...h...', '...s...bb.......', '...s..bb........', '....sbb.........', '....bb..........'],
    { b: M.dark, s: '#efe4c8', a: M.pale, h: M.steel, f: M.red }, 0, 1); },
  hunting: s => { G(s, ['.a..a......a..a.', '.a..a......a..a.', '.aa.a.a..a.a.aa.', '..aaaa....aaaa..', '....aa....aa....', '...eeffffffee...', '..eeeffffffeee..', '.....ffffff.....', '.....ffffff.....', '.....ffffff.....', '......ffff......', '......ffff......', '.......nn.......'], { a: M.bone, e: M.fur, f: M.fur, n: '#2a1c1f' }, 0, 1);
    s.fix(6, 9, INK); s.fix(9, 9, INK); fixes(s, [[7, 11], [8, 11], [7, 12], [8, 12]], '#d8a878'); },
  exploration: s => { s.ell(8, 8, 6, 6, M.brass); s.ell(8, 8, 4.4, 4.4, M.white, { flat: true }); s.poly([[8, 3.5], [9.5, 8], [8, 9], [6.5, 8]], M.red); s.poly([[8, 12.5], [6.5, 8], [8, 7], [9.5, 8]], M.slate); s.fix(8, 8, '#f6d47a'); },
  herbalism: s => { s.ell(8, 10, 4.6, 4, M.glow); s.ell(8, 11, 3.4, 2.6, M.green); s.rect(6, 3, 4, 4, M.glow); s.rect(6, 1, 4, 2, M.cork); s.fix(6, 8, '#ffffff'); s.poly([[10, 5], [14, 2], [13, 6]], M.leaf); },
  enchanting: s => { s.poly([[3, 14], [4, 4], [8, 1], [12, 4], [13, 14]], M.rune); const g = '#8fd0ff'; s.line(8, 4, 8, 11, null, g); s.line(5, 7, 11, 7, null, g); s.line(6, 10, 8, 11, null, g); s.line(10, 10, 8, 11, null, g); s.fix(8, 4, '#e8f6ff'); fixes(s, [[1, 3], [14, 6]], '#cfe4ff'); },
  carpentry: s => { G(s, ['.........hhhh.', '........hh..hh', '........hh..hh', '..sssssshh..hh', 'sssssssshhhhh.', 'sssssssshhh...', 'sssssssshh....', 't.t.t.t.t.....'], { s: M.steel, h: M.dark, t: M.iron }, 1, 2); s.rect(1, 12, 14, 2, M.pale); s.line(2, 13, 13, 13, null, '#a87848'); },
  sailing: s => { s.rect(1, 13, 14, 2, M.sea); s.poly([[2, 10], [14, 10], [12, 13], [4, 13]], M.wood); s.line(8, 1, 8, 9, M.dark); s.poly([[9, 2], [14, 8], [9, 8]], M.sail); s.poly([[7, 3], [3, 8], [7, 8]], M.white); s.fix(9, 1, '#c8483c'); },
  beastmastery: s => { s.ell(8, 9, 4.6, 4, M.fur); s.poly([[3, 7], [3, 2], [6, 5]], M.fur); s.poly([[13, 7], [13, 2], [10, 5]], M.fur); s.ell(8, 11, 2.4, 1.8, rp('#e8c8a0'), { flat: true }); s.fix(8, 10, INK); s.fix(6, 8, INK); s.fix(10, 8, INK); s.fix(7, 12, '#a04a3a'); },
  paw: s => { s.ell(8, 10, 3.6, 3, M.fur); for (const [x, y] of [[3, 6], [6, 3], [10, 3], [13, 6]]) s.ell(x, y, 1.6, 1.6, M.fur); },
  /* the five places along the top */
  home: s => { s.poly([[1, 8], [8, 1], [15, 8]], M.red); s.rect(3, 8, 10, 6, M.plaster); s.rect(7, 10, 3, 4, M.dark); s.rect(4, 9, 2, 2, M.ember); s.rect(11, 3, 2, 3, M.stone); },
  skills: s => { ln(s, 3, 13, 12, 4, M.wood); s.poly([[10, 1], [14, 2], [14, 6], [12, 5], [11, 3]], M.steel); ln(s, 12, 13, 4, 5, M.dark); s.poly([[1, 4], [3, 1], [6, 2], [7, 4], [4, 6]], M.iron); s.fix(3, 2, SHINE); s.fix(13, 2, SHINE); },
  quest: s => { s.rect(3, 3, 9, 10, M.paper); s.rect(2, 1, 11, 2, M.pale); s.rect(4, 13, 11, 2, M.pale); for (const y of [5, 7, 9]) s.line(5, y, 10, y, null, '#9a8460'); s.ell(11, 11, 1.8, 1.8, M.red); s.fix(10, 10, '#ff9a8a'); },
  house: s => { s.poly([[0.5, 8], [4.5, 4], [8.5, 8]], M.red); s.rect(1, 8, 7, 6, M.plaster); s.rect(3, 10, 2, 4, M.dark); s.poly([[7, 6], [11.5, 1], [15.5, 6]], rp('#4a6a9a')); s.rect(8, 6, 7, 8, M.stone); s.rect(10, 8, 2, 2, M.ember); s.rect(12, 11, 2, 3, M.dark); },
  book: s => { s.rect(3, 1, 10, 13, rp('#7a2e4a')); s.rect(4, 13, 9, 2, M.white); s.rect(2, 1, 2, 13, rp('#5a2038')); s.rect(7, 4, 4, 4, M.gold); s.fix(8, 5, SHINE); s.fix(12, 2, M.gold.base); s.fix(12, 11, M.gold.base); },
  map: s => { s.poly([[1, 3], [5, 2], [10, 4], [14, 2], [14, 13], [10, 14], [5, 12], [1, 14]], rp('#e0cf98')); s.line(5, 3, 5, 12, null, '#b89a5a'); s.line(10, 5, 10, 13, null, '#b89a5a'); fixes(s, [[3, 11], [4, 10], [6, 9], [7, 8], [8, 7]], '#c8483c'); fixes(s, [[11, 6], [12, 7], [11, 8], [12, 5]], '#c8483c'); fixes(s, [[12, 10], [11, 11]], '#3f7a3c'); },
  shop: s => { for (let i = 0; i < 5; i++) s.rect(1 + i * 3, 2, i === 4 ? 2 : 3, 4, i % 2 ? M.white : M.red); s.rect(2, 6, 12, 1, M.dark); s.rect(2, 7, 2, 7, M.dark); s.rect(12, 7, 2, 7, M.dark); s.rect(4, 10, 8, 3, M.wood); s.ell(6, 9, 1.4, 1.2, rp('#e0405a')); s.ell(10, 9, 1.4, 1.2, rp('#f0d060')); },
  /* the hero's things and the HUD */
  bag: s => { s.poly([[3, 14], [2, 8], [4, 5], [12, 5], [14, 8], [13, 14]], M.leather); s.rect(6, 2, 4, 3, M.dark); s.rect(4, 8, 8, 3, rp('#7a4e30')); s.rect(7, 9, 2, 2, M.gold); },
  bank: s => { s.rect(2, 7, 12, 7, M.wood); s.poly([[2, 7], [3, 3], [13, 3], [14, 7]], M.pale); s.rect(2, 7, 12, 1, M.iron); s.rect(7, 7, 2, 3, M.gold); for (const x of [4, 11]) s.line(x, 3, x, 13, null, '#7a7480'); },
  users: s => { s.ell(5, 5, 2.4, 2.4, M.skin); s.ell(5, 12, 3.6, 3, M.cloth); s.ell(11, 4, 2.4, 2.4, M.skin); s.ell(11, 11, 3.4, 3, rp('#6a9a4a')); s.erase(5, 15); },
  gear: s => { s.ell(8, 8, 4.6, 4.6, M.iron); for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4; s.rect(Math.round(7.5 + Math.cos(a) * 5.2), Math.round(7.5 + Math.sin(a) * 5.2), 2, 2, M.iron); } s.ell(8, 8, 1.6, 1.6, M.ink, { flat: true }); },
  bell: s => { s.poly([[5, 4], [11, 4], [13, 11], [3, 11]], M.gold); s.ell(8, 4, 3, 2, M.gold); s.rect(2, 11, 12, 2, M.gold); s.rect(7, 1, 2, 2, M.dark); s.rect(7, 13, 2, 2, M.dark); s.fix(6, 5, SHINE); },
  coin: s => { s.ell(8, 8, 5.6, 5.6, M.gold); s.ell(8, 8, 3.4, 3.4, M.gold, { flat: true }); s.rect(7, 6, 2, 4, rp('#c08a2a'), { flat: true }); s.fix(5, 4, SHINE); },
  sound: s => { s.rect(2, 6, 3, 4, M.dark); s.poly([[5, 6], [9, 2], [9, 14], [5, 10]], M.gold); s.line(11, 6, 11, 10, M.white); s.line(13, 4, 13, 12, M.white); },
  mute: s => { s.rect(2, 6, 3, 4, M.dark); s.poly([[5, 6], [9, 2], [9, 14], [5, 10]], M.gold); ln(s, 10, 6, 13, 9, M.red, 1); ln(s, 11, 6, 14, 9, M.red, 1); ln(s, 13, 6, 10, 9, M.red, 1); ln(s, 14, 6, 11, 9, M.red, 1); },
  music: s => { s.ell(4, 12, 2.4, 1.8, M.violet); s.ell(11, 11, 2.4, 1.8, M.violet); s.rect(6, 3, 1, 9, M.violet); s.rect(13, 2, 1, 9, M.violet); s.rect(6, 2, 8, 2, M.violet); },
  pin: s => { s.ell(8, 6, 4.4, 4.4, M.red); s.poly([[4, 8], [12, 8], [8, 14]], M.red); s.ell(8, 6, 1.6, 1.6, M.white, { flat: true }); },
  clock: s => { s.ell(8, 8, 6, 6, M.brass); s.ell(8, 8, 4.4, 4.4, M.white, { flat: true }); s.line(8, 8, 8, 5, null, INK); s.line(8, 8, 11, 8, null, INK); },
  star: s => { const p = []; for (let i = 0; i < 10; i++) { const r = i % 2 ? 2.8 : 6.6, a = -Math.PI / 2 + i * Math.PI / 5; p.push([8 + Math.cos(a) * r, 8.6 + Math.sin(a) * r]); } s.poly(p, M.gold); s.fix(7, 5, SHINE); s.fix(7, 6, SHINE); },
  trophy: s => { s.poly([[4, 2], [12, 2], [11, 8], [5, 8]], M.gold); s.rect(7, 8, 2, 3, M.gold); s.rect(4, 11, 8, 3, M.dark); s.line(2, 3, 3, 6, M.gold); s.line(13, 3, 12, 6, M.gold); s.fix(6, 3, SHINE); },
  close: s => { G(s, ['..rr........rr..', '..rrr......rrr..', '...rrr....rrr...', '....rrr..rrr....', '.....rrrrrr.....', '......rrrr......', '......rrrr......', '.....rrrrrr.....', '....rrr..rrr....', '...rrr....rrr...', '..rrr......rrr..', '..rr........rr..'], { r: M.red }, 0, 2); },
  check: s => { G(s, ['............gg..', '...........ggg..', '..........ggg...', '.........ggg....', '..gg....ggg.....', '..ggg..ggg......', '...ggggggg......', '....ggggg.......', '.....ggg........', '......g.........'], { g: rp('#5cc08a') }, 0, 3); },
  chevron: s => { G(s, ['....ii..', '....iii.', '.....iii', '......iii', '.......iii', '........iii', '........iii', '.......iii', '......iii', '.....iii', '....iii.', '....ii..'], { i: M.iron }, 1, 2); },
  arrow: s => { s.rect(2, 7, 8, 3, M.gold); s.poly([[9, 3], [14.5, 8.5], [9, 14]], M.gold); },
  lock: s => { s.rect(5, 2, 6, 2, M.iron); s.rect(4, 3, 2, 5, M.iron); s.rect(10, 3, 2, 5, M.iron); s.rect(3, 7, 10, 7, M.gold); s.fix(8, 9, INK); s.rect(8, 10, 1, 2, rp('#2a1c1f')); },
  skull: s => { s.ell(8, 7, 5.4, 5, M.bone); s.rect(5, 11, 6, 3, M.bone); for (const [x, y] of [[5, 7], [6, 7], [5, 8], [6, 8], [10, 7], [11, 7], [10, 8], [11, 8]]) s.fix(x, y, INK); s.fix(8, 10, INK); for (const x of [6, 8, 10]) s.fix(x, 13, '#8a7a6a'); },
  info: s => { s.ell(8, 8, 6, 6, M.blue); s.rect(7, 4, 2, 2, M.white); s.rect(7, 7, 2, 5, M.white); s.fix(6, 7, '#f4ecd8'); s.rect(6, 11, 4, 1, M.white); },
  sun: s => { s.ell(8, 8, 3.4, 3.4, M.ember); for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4; s.rect(Math.round(7.5 + Math.cos(a) * 5.6), Math.round(7.5 + Math.sin(a) * 5.6), i % 2 ? 1 : 2, i % 2 ? 1 : 2, M.ember); } },
  moon: s => { s.ell(8, 8, 6, 6, rp('#e8dca8')); for (let j = -6; j <= 6; j++) for (let i = -6; i <= 6; i++) if (i * i + j * j <= 20) s.erase(11 + i, 5 + j); s.fix(4, 8, '#fff6c0'); },
  town: s => { s.rect(1, 9, 5, 5, M.plaster); s.poly([[0.5, 9], [3.5, 6], [6.5, 9]], M.straw); s.rect(6, 4, 4, 10, M.stone); s.poly([[5.5, 4], [8, 1], [10.5, 4]], M.red); s.rect(10, 8, 5, 6, M.plaster); s.poly([[9.5, 8], [12.5, 5], [15.5, 8]], M.red); s.rect(7, 6, 2, 2, M.ember); s.rect(7, 11, 2, 3, M.dark); },
  save: s => { s.rect(2, 2, 12, 12, M.blue); s.rect(4, 2, 7, 4, M.steel); s.rect(9, 3, 1, 2, M.ink); s.rect(4, 9, 8, 5, M.white); },
  flag: s => { s.rect(3, 1, 2, 14, M.dark); s.poly([[5, 2], [14, 4.5], [5, 8]], M.red); s.fix(6, 3, '#ff9a8a'); },
  barn: s => { s.poly([[1, 7], [8, 2], [15, 7]], rp('#7a3a2a')); s.rect(2, 7, 12, 7, M.red); s.rect(6, 9, 4, 5, M.white); s.line(6, 9, 9, 13, null, '#c8483c'); s.line(9, 9, 6, 13, null, '#c8483c'); },
  candle: s => { s.rect(6, 7, 4, 7, M.white); s.ell(8, 3.6, 1.6, 2.4, M.flame); s.fix(8, 4, '#fff6c0'); s.fix(8, 6, INK); s.rect(4, 13, 8, 2, M.brass); },
  fire: s => { s.poly([[3, 14], [2, 9], [5, 4], [6, 8], [8, 1], [11, 7], [12, 5], [14, 10], [13, 14]], M.flame); s.poly([[5, 14], [5, 10], [8, 6], [11, 10], [11, 14]], M.ember); s.fix(8, 11, '#fff6c0'); },
  nest: s => { s.ell(8, 11, 6.4, 3.2, M.wood); s.ell(5.5, 8, 1.8, 2, rp('#cfe6f0')); s.ell(10, 8, 1.8, 2, rp('#cfe6f0')); s.line(3, 11, 13, 11, null, '#6a4428'); },
  ring_logo: s => { s.ell(8, 9, 5.6, 5.6, M.gold); for (let j = -4; j <= 4; j++) for (let i = -4; i <= 4; i++) if (i * i + j * j <= 10) s.erase(8 + i, 9 + j); s.ell(8, 3, 2, 2, M.violet); },
  museum: s => { s.poly([[1, 5], [8, 1], [15, 5]], M.red); s.rect(1, 5, 14, 2, M.paper); for (const x of [2, 5, 10, 13]) s.rect(x, 7, 1, 6, M.paper); s.rect(1, 13, 14, 2, M.stone); s.ell(8, 10, 1.4, 1.6, M.gold); },
  bit: s => { s.ell(8, 8, 3, 3, M.gold); },
  hammer: s => { s.rect(7, 6, 2, 8, M.wood); s.rect(3, 2, 10, 4, M.iron); s.rect(13, 3, 1, 2, M.iron); s.rect(2, 3, 1, 2, M.iron); s.fix(4, 2, SHINE); s.rect(6, 14, 4, 1, M.dark); }
};
/* the Skills hub had the generic star; the approved mockup shows the crossed pick and axe */
if (Q.ICONS && !('skills' in Q.ICONS)) Q.ICONS.skills = Q.ICONS.mining;
const ALIAS = { scroll: 'quest', compass: 'exploration', sword: 'attack', melee: 'attack', rod: 'fishing', glove: 'thieving', hoe: 'farming', bottle: 'herbalism', rune: 'enchanting', health: 'hitpoints', heart: 'hitpoints', defense: 'defence' };
const iconMine = id => { const f = I[id] || I[ALIAS[id]]; if (!f) return null; const s = Spr(16, 16); f(s); return s; };

/* ================= 32 x 32 skill emblems ================= */
const arc = (s, n, f, r, w = 3) => { for (let i = 0; i <= n; i++) { const [x, y] = f(i / n); for (let k = 0; k < w; k++) s.tone(Math.round(x), Math.round(y) + k, r, w === 1 ? 2 : k === 0 ? 3 : k === w - 1 ? 1 : 2); } };
const sparkle = (s, x, y, c = SHINE) => { s.fix(x, y, c); s.fix(x - 1, y, c); s.fix(x + 1, y, c); s.fix(x, y - 1, c); s.fix(x, y + 1, c); };
const E = {
  fishing: s => { ln(s, 3, 27, 19, 4, M.dark, 3); s.tone(20, 3, M.dark, 3); ln(s, 3, 27, 6, 22, M.cork, 3); s.ell(11, 19, 2.4, 2.4, M.iron); s.fix(10, 18, SHINE);
    fixes(s, [[21, 3], [22, 4], [23, 5], [24, 6], [24, 7], [24, 8], [24, 9], [24, 10], [24, 11], [24, 12], [24, 13], [24, 14]], '#e8e4d8');
    const f = rp('#3f80b8'); s.ell(21, 20, 6.4, 4.2, f); s.poly([[16, 20], [12, 15], [12, 25]], f); s.poly([[18, 16], [22, 13.5], [24, 16]], rp('#c86a44'));
    s.line(17, 22, 25, 22, null, '#cfe4f0'); s.line(18, 23, 24, 23, null, '#a8cce0'); s.fix(25, 18, '#ffffff'); s.fix(26, 18, INK); s.fix(26, 19, INK); s.line(23, 17, 23, 21, null, '#2f6090'); s.fix(24, 15, '#c8483c'); },
  woodcutting: s => { s.rect(2, 20, 22, 8, M.wood); for (const [a, b, y] of [[4, 11, 22], [13, 20, 25], [6, 14, 26]]) s.line(a, y, b, y, null, '#6a4428'); s.ell(24, 23.5, 3, 4, M.pale, { flat: true }); s.ell(24, 23.5, 1.6, 2.4, rp('#d8a868'), { flat: true }); s.fix(24, 23, '#8a5a32'); s.fix(24, 24, '#8a5a32');
    ln(s, 6, 26, 18, 7, M.dark, 3); s.rect(15, 4, 5, 6, M.slate); s.poly([[19, 4], [24, 1], [28, 3], [29, 8], [28, 13], [24, 14], [19, 10]], M.iron); s.line(28, 3, 28, 12, null, '#e8eef4'); s.line(27, 2, 27, 3, null, SHINE); s.fix(16, 5, '#a8b0c0'); },
  mining: s => { s.poly([[3, 29], [5, 21], [12, 17], [21, 17], [28, 22], [29, 29]], M.stone); for (const [x, y] of [[10, 23], [18, 21], [22, 26], [13, 27]]) { s.ell(x, y, 1.6, 1.4, R.copper); s.fix(x - 1, y - 1, '#f8b070'); } s.fix(25, 24, '#f6d47a');
    ln(s, 9, 21, 19, 6, M.wood, 3); arc(s, 40, t => [4 + 24 * t, 10 - Math.sin(t * Math.PI) * 6 + t * 3], M.iron, 3); s.fix(4, 11, M.iron.gl); s.fix(17, 4, SHINE); s.fix(18, 4, SHINE); },
  thieving: s => { const h = rp('#5a4a78'); s.poly([[2, 30], [5, 21], [27, 21], [30, 30]], h); s.ell(16, 13, 10, 10.4, h); s.ell(16, 15, 6, 6.6, rp('#1a1222'), { flat: true });
    for (const x of [13, 19]) { s.fix(x, 15, '#fff2a0'); s.fix(x + 1, 15, '#ffd84a'); s.fix(x, 16, '#c89a20'); s.fix(x + 1, 16, '#c89a20'); } s.line(9, 25, 23, 25, null, '#3a2e52');
    s.ell(25, 25, 4, 4, M.gold); s.ell(25, 25, 2.2, 2.2, M.gold, { flat: true }); s.fix(23, 23, SHINE); },
  farming: s => { s.ell(15, 27, 13, 3, R.soil); s.line(4, 27, 26, 27, null, '#5a3b2a');
    for (const [x, t] of [[6, 8], [12, 5], [18, 9]]) { s.rect(x, t + 6, 2, 26 - t - 6, rp('#a8a040')); s.ell(x + .5, t + 3, 2.2, 4.2, M.straw); for (let y = t; y <= t + 6; y += 2) { s.fix(x - 1, y + 1, '#a87a2a'); s.fix(x + 2, y, '#a87a2a'); } s.fix(x, t - 2, '#f6dc8a'); s.fix(x + 1, t - 3, '#f6dc8a'); }
    ln(s, 27, 28, 22, 6, M.wood, 2); s.poly([[21, 3], [27, 2], [29, 5], [25, 8], [22, 6]], M.iron); s.fix(27, 3, SHINE); },
  cooking: s => { for (const [x, h] of [[9, 6], [16, 8], [23, 6]]) { s.poly([[x - 4, 30], [x, 30 - h], [x + 4, 30]], M.flame); s.poly([[x - 2, 30], [x, 27 - h / 3], [x + 2, 30]], M.ember); }
    s.ell(16, 17, 11, 7, M.pot); s.rect(4, 11, 24, 3, M.iron); s.ell(16, 11, 10, 1.6, rp('#d8803a'), { flat: true }); fixes(s, [[12, 11], [19, 10], [16, 12]], '#f0b060'); s.fix(21, 11, '#7ab04a'); s.rect(1, 12, 3, 2, M.iron); s.rect(28, 12, 3, 2, M.iron);
    for (const [x, y] of [[10, 8], [11, 7], [10, 6], [11, 5], [16, 7], [17, 6], [16, 5], [17, 4], [16, 3], [22, 8], [23, 7], [22, 6], [23, 5]]) s.fix(x, y, '#d8d4d0'); },
  smithing: s => { const a = M.slate; s.rect(7, 13, 20, 4, a); s.poly([[1, 13], [7, 13], [7, 16]], a); s.rect(12, 17, 10, 5, a); s.poly([[8, 22], [26, 22], [28, 28], [6, 28]], rp('#4a5060')); s.line(2, 13, 26, 13, null, '#c8d0dc');
    s.rect(10, 11, 10, 2, M.ember); s.fix(10, 11, '#fff2a0'); ln(s, 17, 10, 24, 5, M.wood, 2); s.rect(21, 1, 9, 5, M.iron); s.fix(22, 1, SHINE); for (const [x, y, c] of [[8, 8, '#ffd060'], [11, 6, '#ffb04a'], [14, 8, '#fff6c0'], [6, 10, '#ff8a3a'], [13, 4, '#ffd060']]) s.fix(x, y, c); },
  crafting: s => { s.rect(3, 4, 15, 3, M.pale); s.rect(3, 24, 15, 3, M.pale); const t = rp('#c84a6a'); s.rect(5, 7, 11, 17, t); for (let y = 8; y < 24; y += 2) s.line(5, y, 15, y, null, '#9a3050'); s.line(6, 8, 6, 22, null, '#f08aa8');
    s.line(16, 20, 18, 23, null, '#c84a6a'); s.line(18, 23, 21, 23, null, '#c84a6a'); ln(s, 21, 29, 28, 3, M.steel, 2); s.fix(27, 5, INK); s.fix(28, 2, SHINE); },
  magic: s => { ln(s, 4, 29, 17, 12, M.dark, 3); s.rect(16, 11, 5, 3, M.gold); s.ell(22, 8, 5.6, 5.6, M.violet); s.fix(20, 5, '#ffffff'); s.fix(21, 5, '#f0e8ff'); s.fix(20, 6, '#f0e8ff');
    sparkle(s, 28, 18, '#d8ccff'); sparkle(s, 10, 5, '#d8ccff'); s.fix(29, 3, '#ffffff'); s.fix(14, 20, '#a898ff'); },
  research: s => { s.poly([[1, 9], [15, 7], [16, 9], [17, 7], [30, 9], [30, 27], [17, 26], [16, 28], [15, 26], [1, 27]], M.red); s.poly([[3, 10], [15, 9], [15, 25], [3, 25]], M.white); s.poly([[17, 9], [28, 10], [28, 25], [17, 25]], M.paper);
    for (const y of [13, 16, 19, 22]) { s.line(5, y, 13, y, null, '#9a8a7a'); s.line(19, y, 26, y, null, '#a89a88'); } s.rect(22, 3, 3, 11, M.gold); s.fix(23, 14, '#a8782a'); },
  hunting: s => { const a = M.bone; ln(s, 12, 11, 7, 3, a, 2); ln(s, 9, 6, 4, 6, a, 2); ln(s, 10, 8, 11, 2, a, 2); ln(s, 19, 11, 24, 3, a, 2); ln(s, 22, 6, 27, 6, a, 2); ln(s, 21, 8, 20, 2, a, 2);
    const f = M.fur; s.ell(8, 13, 3.4, 1.8, f); s.ell(24, 13, 3.4, 1.8, f); s.ell(16, 17, 6, 7, f); s.ell(16, 24, 3.6, 3.4, rp('#d8a878')); s.rect(15, 26, 3, 2, rp('#2a1c1f')); s.fix(13, 16, INK); s.fix(13, 17, INK); s.fix(19, 16, INK); s.fix(19, 17, INK); s.fix(12, 16, '#ffffff'); s.fix(18, 16, '#ffffff'); },
  exploration: s => { s.rect(14, 2, 4, 3, M.brass); s.ell(16, 17, 12.4, 12.4, M.brass); s.ell(16, 17, 9.6, 9.6, M.white, { flat: true }); for (const [x, y] of [[16, 9], [16, 25], [8, 17], [24, 17]]) s.fix(x, y, '#5a4a3a');
    s.poly([[16, 8.5], [18.6, 17], [16, 18.5], [13.4, 17]], M.red); s.poly([[16, 25.5], [13.4, 17], [16, 15.5], [18.6, 17]], M.slate); s.ell(16, 17, 1.2, 1.2, M.gold, { flat: true }); s.fix(9, 9, '#ffffff'); },
  herbalism: s => { s.ell(16, 20, 9.4, 8.4, M.glow); s.ell(16, 22, 7.6, 5.8, M.green); s.rect(12, 6, 8, 7, M.glow); s.rect(12, 2, 8, 5, M.cork); s.line(12, 6, 19, 6, null, '#8a6a4a'); s.fix(11, 16, '#ffffff'); s.fix(11, 17, '#ffffff'); s.fix(12, 15, '#ffffff');
    for (const [x, y] of [[14, 20], [18, 22], [16, 24]]) s.fix(x, y, '#c8f0a8'); s.poly([[21, 9], [29, 3], [27, 11]], M.leaf); s.line(22, 9, 27, 5, null, '#3f7a3c'); },
  enchanting: s => { s.poly([[7, 29], [8, 8], [16, 3], [24, 8], [25, 29]], M.rune); s.rect(5, 28, 22, 2, rp('#4a4e60')); const g = '#8fd0ff';
    s.line(16, 8, 16, 23, null, g); s.line(11, 13, 21, 13, null, g); s.line(12, 19, 16, 23, null, g); s.line(20, 19, 16, 23, null, g); s.fix(16, 8, '#e8f6ff'); s.fix(16, 13, '#e8f6ff'); sparkle(s, 4, 8, '#cfe4ff'); sparkle(s, 28, 12, '#cfe4ff'); s.fix(27, 4, g); },
  attack: s => { for (let i = 0; i <= 15; i++) { s.tone(11 + i, 20 - i, M.steel, 3); s.tone(12 + i, 20 - i, M.steel, 2); s.tone(12 + i, 21 - i, M.steel, 1); } s.tone(27, 4, M.steel, 3); s.tone(28, 3, M.steel, 4); s.line(13, 18, 25, 6, null, '#8a96a4');
    ln(s, 6, 16, 14, 24, M.gold, 2); s.dot(5, 15, M.gold); s.dot(15, 25, M.gold); ln(s, 4, 26, 9, 21, M.leather, 3); s.ell(3, 28, 2, 2, M.gold); },
  strength: s => { const k = M.skin; s.ell(19, 10, 5, 5, k); s.rect(15, 10, 7, 11, k); s.ell(13, 21, 9, 6, k); s.rect(2, 18, 6, 9, M.cloth); s.line(17, 6, 21, 6, null, '#c87a50'); s.line(9, 23, 17, 23, null, '#c87a50'); },
  defence: s => { s.poly([[3, 3], [28, 3], [28, 16], [16, 30], [15, 30], [3, 16]], M.steel); s.poly([[6, 6], [25, 6], [25, 16], [15.5, 26.5], [6, 16]], M.blue); s.rect(14, 6, 3, 19, M.gold); s.rect(6, 12, 19, 3, M.gold); s.ell(15, 13, 2.4, 2.4, M.gold); s.fix(5, 4, '#ffffff'); },
  hitpoints: s => { s.ell(10, 12, 7, 6.6, M.heart); s.ell(21, 12, 7, 6.6, M.heart); s.poly([[3, 14], [28, 14], [16, 28], [15, 28]], M.heart); s.ell(9, 10, 2.4, 2, rp('#f08070'), { flat: true }); s.fix(8, 9, '#ffffff'); s.fix(9, 9, '#ffffff'); s.fix(8, 10, '#ffe0d8'); },
  ranged: s => { for (const [d, lv] of [[0, 3], [1, 2], [2, 1]]) arc(s, 40, t => [9 + d + Math.sin(t * Math.PI) * 8, 2 + 26 * t], M.dark, 1);
    s.line(10, 3, 4, 15, null, '#efe4c8'); s.line(4, 16, 10, 28, null, '#efe4c8'); s.rect(4, 15, 21, 2, M.pale); s.poly([[24, 12], [30, 16], [24, 20]], M.steel); s.poly([[2, 13], [6, 15], [2, 15]], M.red); s.poly([[2, 18], [6, 16], [2, 16]], M.red); },
  carpentry: s => { s.poly([[2, 12], [21, 5], [21, 16.5], [2, 16.5]], M.iron); for (let x = 2; x < 21; x += 2) s.dot(x, 17, M.iron); s.line(3, 12, 20, 6, null, '#e8eef4');
    G(s, ['..hhhhhh', '.hhhhhhhh', 'hhh....hhh', 'hhh....hhh', 'hhh....hhh', 'hhh...hhh.', 'hhhhhhhh..', 'hhhhhh....', 'hhh.......', 'hhh.......', 'hh........'], { h: M.dark }, 20, 3);
    s.rect(2, 21, 26, 3, M.pale); s.rect(4, 24, 25, 4, M.wood); s.line(3, 22, 26, 22, null, '#a87848'); s.line(5, 26, 27, 26, null, '#6a4428'); },
  sailing: s => { s.rect(1, 24, 30, 6, M.sea); fixes(s, [[3, 25], [4, 25], [5, 26], [18, 26], [19, 26], [20, 27], [26, 25], [27, 25]], '#9cd0f0'); s.poly([[3, 19], [29, 19], [25, 25], [7, 25]], M.wood); s.line(5, 21, 27, 21, null, '#6a4428');
    s.rect(15, 3, 2, 16, M.dark); s.poly([[17, 4], [27, 17], [17, 17]], M.sail); s.poly([[14, 6], [6, 17], [14, 17]], M.white); s.poly([[17, 1], [22, 2], [17, 3]], M.red); },
  beastmastery: s => { const f = M.fur; s.ell(16, 17, 9, 8.4, f); s.poly([[7, 8], [12, 7], [11, 20], [6, 21], [4, 14]], rp('#7a4a2a')); s.poly([[25, 8], [20, 7], [21, 20], [26, 21], [28, 14]], rp('#7a4a2a'));
    s.ell(16, 22, 5, 3.8, rp('#ecd0a8')); s.ell(16, 19.5, 2, 1.4, rp('#2a1c1f'), { flat: true }); s.fix(15, 19, '#8a7a7a'); for (const x of [12, 20]) { s.fix(x, 15, INK); s.fix(x, 16, INK); s.fix(x - 1, 15, '#ffffff'); } s.fix(16, 24, '#c85a5a'); s.fix(17, 24, '#c85a5a');
    s.rect(9, 27, 14, 2, M.red); s.ell(16, 29.6, 1.4, 1.2, M.gold, { flat: true }); }
};
/* boss trophies: the boss mounted on a bevelled oak shield plaque, brass pins and a brass nameplate (40 x 44) */
function trophy(id, gilded) {
  const c = A.creatureSprite && A.creatureSprite(id); if (!c) return null;
  const s = Spr(40, 44), rim = gilded ? M.gold : M.dark, face = rp('#4a3020');
  s.poly([[1, 1], [38, 1], [38, 30], [20, 42], [19, 42], [1, 30]], rim);
  s.poly([[4, 4], [35, 4], [35, 29], [20, 39], [19, 39], [4, 29]], face);
  for (let y = 7; y < 30; y += 5) s.line(5, y, 34, y, null, '#40291c');
  /* the boss keeps its own outline against the wood: the ring of pixels round it takes its darkest step */
  const at = (x, y) => (x >= 0 && y >= 0 && x < c.w && y < c.h) ? c.px[y * c.w + x] : null;
  for (let y = -1; y <= c.h; y++) for (let x = -1; x <= c.w; x++) { if (at(x, y)) continue; const n = at(x, y + 1) || at(x + 1, y) || at(x, y - 1) || at(x - 1, y); if (n && s.at(x + 4, y + 3)) s.fix(x + 4, y + 3, n.r.out); }
  s.stamp(c, 4, 3);
  s.rect(12, 34, 16, 4, M.brass); s.fix(12, 34, SHINE); for (let x = 14; x <= 26; x += 2) s.fix(x, 36, '#7a5a2a');
  for (const [x, y] of [[3, 3], [36, 3]]) { s.fix(x, y, '#f6d47a'); s.fix(x + 1, y + 1, '#8a6024'); }
  return s;
}

/* ---------- route everything through the new drawings ---------- */
const baseIcon = A.iconSprite, baseEmblem = A.emblemSprite;
A.ICONS2 = I; A.EMBLEM2 = E;
A.iconSprite = id => iconMine(id) || baseIcon(id);
A.iconUrl = id => A.url('icon2:' + id, () => A.iconSprite(id));
A.emblemSprite = id => { const f = E[id] || (id === 'scholarship' ? E.research : id === 'melee' ? E.attack : null); if (f) { const s = Spr(32, 32); f(s); return s; } return baseEmblem ? baseEmblem(id) : null; };
A.emblemUrl = id => (E[id] || (A.EMBLEM && A.EMBLEM[id]) || id === 'melee') ? A.url('emblem2:' + id, () => A.emblemSprite(id)) : null;
A.trophySprite = trophy;
A.trophyUrl = (id, gilded) => A.url('trophy2:' + id + (gilded ? ':gold' : ''), () => trophy(id, gilded));
})();
