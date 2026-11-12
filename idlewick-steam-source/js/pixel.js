/* Idlewick: pixel-art sprites. Each template is a 16x16 grid recoloured per creature. */
(() => {
const DQ = window.DQ;
const T = {
  bird: [
    '................', '......rr........', '.....rrkk.......', '....kpppk.......', '...kpepppk......', '..yykpppppk.....', '...ykppppppk....', '....kpppppppkk..',
    '...kpplllppppk..', '..kppllllpppppk.', '..kpppllppppppk.', '...kdpppppppdk..', '....kddddddkk...', '.....k....k.....', '....yyk..yyk....', '................'],
  quad: [
    '................', '................', '.kk.............', 'kpdk............', 'kppkkkkkkkkkk...', 'kepppppppppppk..', 'kppppplllppppdk.', 'kwkppplllpppppdk',
    '.kkpppppppppppk.', '...kppppppppppk.', '...kdpkkkkkdpk..', '...kdk....kdk...', '...kdk....kdk...', '...kkk....kkk...', '................', '................'],
  rodent: [
    '................', '................', '................', '.......kkk......', '.....kkpppk.....', '....kppppppk....', '...kpepppppkk...', '..kppppplppppk..',
    '.kpppppppppppk..', '.kwppppppppppk..', '..kkdpppppppk.kk', '....kkdppdkkkddk', '.....kk..kk..kk.', '................', '................', '................'],
  humanoid: [
    '................', '.....kkkkkk.....', '....khhhhhhk....', '....kssssssk....', '....ksessesk....', '....kssssssk....', '.....kssssk.....', '...kkppppppkk...',
    '..kspplppppppsk.', '..ksppppppppsk..', '..kskppppppksk..', '...k.pppppp.k...', '....kpdkkdpk....', '....kpk..kpk....', '....kkk..kkk....', '................'],
  brute: [
    '................', '....kkkkkkkk....', '...kppppppppk...', '...kpeppppepk...', '...kppppppppk...', '...kpwkwwkwpk...', '..kkkppppppkkk..', '.kppkppplpppkppk',
    '.kppkpppppppkppk', '.kddkpppppppkddk', '..kk.kppppppk.kk', '.....kddkddk....', '.....kpk.kpk....', '....kkpk.kpkk...', '....kkkk.kkkk...', '................'],
  crab: [
    '................', '................', '.kk..........kk.', 'kppk........kppk', 'kpkpk......kpkpk', '.kpk..k..k..kpk.', '..kk.kek.kek.kk.', '...kkkpkkpkkk...',
    '..kppppppppppk..', '.kpplllppppppdk.', '.kpppppppppppdk.', '..kddddddddddk..', '.kpk.kpk.kpk.kpk', '.kk..kk...kk..kk', '................', '................'],
  bat: [
    '................', '................', 'k......kk......k', 'kk....kppk....kk', 'kpk..kpepek..kpk', 'kppk.kppppk.kppk', 'kpppkppppppkpppk', 'kppppppppppppppk',
    '.kpppkppppkpppk.', '..kpk.kppk.kpk..', '...k...kk...k...', '................', '................', '................', '................', '................'],
  skeleton: [
    '................', '.....kkkkkk.....', '....kppppppk....', '....kpkppkpk....', '....kppppppk....', '.....kpkpkk.....', '......kppk......', '...kkpkppkpkk...',
    '..kp.kppppk.pk..', '..kp.kpkkpk.pk..', '..kp..kppk..pk..', '......kppk......', '.....kp..pk.....', '.....kp..pk.....', '....kkp..pkk....', '................'],
  ghost: [
    '................', '.....kkkkkk.....', '....kllllllk....', '...kllppppllk...', '...klpeppeplk...', '...kppppppppk...', '...kppkkkkppk...', '..kppppppppppk..',
    '..kppppppppppk..', '..kppppppppppk..', '..kpdppppppdpk..', '..kpdpppppdppk..', '..kdpkdpkdpkdk..', '...k..k..k..k...', '................', '................'],
  dragon: [
    '................', '..........kk....', '.........kppk.kk', '....kk..kpppkkpk', '...kppk.kpepppk.', '..kpllpkkppppwwk', '.kplllppppppkkk.', '.kpllppppppk....',
    'kpppppppppppk...', 'kpdpppppppppk...', '.kdppppppppk.kk.', '..kddpkkdpkkkpk.', '...kpk.kpk..kk..', '...kkk.kkk......', '................', '................'],
  fish: [
    '................', '................', '................', '......kkkk......', '....kkllllkk..kk', '...kplllllllkkpk', '..kpepppppppppk.', '..kpppppppppppk.',
    '..kpppppppppkkpk', '...kddpppppk..kk', '....kkddddkk....', '......kkkk......', '................', '................', '................', '................'],
  hive: [
    '................', '......kkkk......', '.....kppppk.....', '....kpddddpk....', '...kppppppppk...', '...kddddddddk...', '..kppppppppppk..', '..kdddkkkddddk..',
    '..kpppkekppppk..', '..kddddddddddk..', '...kppppppppk...', '....kkkkkkkk....', '....bbbbbbbb....', '................', '................', '................'],
  plant0: [
    '................', '................', '................', '................', '................', '................', '................', '................',
    '................', '................', '................', '.......bb.......', '....bbbbbbbb....', '...bBbBbBbBbb...', '..bBBBBBBBBBBb..', '................'],
  plant1: [
    '................', '................', '................', '................', '................', '................', '................', '.......g........',
    '......gGg.......', '.....g.G.g......', '.......G........', '.......G........', '....bbbbbbbb....', '...bBbBbBbBbb...', '..bBBBBBBBBBBb..', '................'],
  plant2: [
    '................', '................', '................', '.......g........', '......ggg.......', '.....gGgGg......', '...gg..G..gg....', '..gGGg.G.gGGg...',
    '...gg..G..gg....', '.....g.G.g......', '......gGg.......', '.......G........', '....bbbbbbbb....', '...bBbBbBbBbb...', '..bBBBBBBBBBBb..', '................'],
  plant3: [
    '................', '.......g........', '......ggg.......', '....oogGgoo.....', '...oOooGooOo....', '...oooogoooo.g..', '..gg.oo.oo.ggGg.', '.gGGg..G..gGGg..',
    '..ggoo.G.oo.g...', '...oOoo.ooOo....', '...ooooGoooo....', '.....oo.oo......', '....bbbbbbbb....', '...bBbBbBbBbb...', '..bBBBBBBBBBBb..', '................'],
};
DQ.SPRITES = T;
const hex = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
const mix = (h, t, a) => { const A = hex(h), B = hex(t); return '#' + A.map((v, i) => Math.round(v + (B[i] - v) * a).toString(16).padStart(2, '0')).join(''); };
const cache = {};
DQ.pxUrl = (tpl, pal = {}) => {
  const key = tpl + JSON.stringify(pal); if (cache[key]) return cache[key];
  const p = pal.p || '#a0a0a0', o = pal.o || '#e8506a';
  const C = { k: '#1c1410', p, d: mix(p, '#000000', .3), l: mix(p, '#ffffff', .28), c: pal.c || mix(p, '#000000', .5), s: pal.s || '#e8b890', h: pal.h || '#3a2a1e', e: '#120c08', w: '#f6f0e4', y: '#f0b840', r: '#d8503f', g: '#6abf4a', G: '#3a7a34', b: '#7a5230', B: '#4a3220', o, O: mix(o, '#ffffff', .4), m: pal.m || '#9aa3ad', M: mix(pal.m || '#9aa3ad', '#000000', .35), n: mix(pal.m || '#9aa3ad', '#ffffff', .35) };
  const cv = document.createElement('canvas'); cv.width = 16; cv.height = 16; const cx = cv.getContext('2d');
  (T[tpl] || T.ghost).forEach((row, y) => { for (let x = 0; x < 16 && x < row.length; x++) { const ch = row[x]; if (ch === '.' || !C[ch]) continue; cx.fillStyle = C[ch]; cx.fillRect(x, y, 1, 1); } });
  return (cache[key] = (DQ.hiRes ? DQ.hiRes(cv) : cv).toDataURL());
};
/* Always draw at a whole multiple of 16 so every pixel stays square and sharp */
DQ.pxSize = n => Math.max(16, Math.round(n / 16) * 16);
DQ.px = (tpl, pal, size = 48, cls = '') => { size = DQ.pxSize(size); return `<img class="px ${cls}" src="${DQ.pxUrl(tpl, pal)}" width="${size}" height="${size}" alt="" draggable="false">`; };

/* Which template each monster uses, and humanoid skin tones */
const MON_SPR = { chicken: 'bird', rat: 'rodent', goblin: 'humanoid', cow: 'quad', grubnash: 'brute', boar: 'quad', wolf: 'quad', scarecrow: 'humanoid', oldtusk: 'quad', crab: 'crab', bandit: 'humanoid', smuggler: 'humanoid', pirate: 'humanoid', barnacle: 'humanoid', bat: 'bat', icewolf: 'quad', raider: 'humanoid', troll: 'brute', frostmaw: 'brute', zombie: 'humanoid', skeleton: 'skeleton', bogsnapper: 'dragon', wraith: 'ghost', morwenna: 'humanoid', imp: 'bat', hound: 'quad', drake: 'dragon', emberlord: 'brute', pyrrhax: 'dragon', hawk: 'bird', golem: 'brute', wyvern: 'dragon', zephyrion: 'bird', voidknight: 'brute', shade: 'ghost', horror: 'crab', hollowking: 'brute' };
const SKIN = { goblin: '#7ab85a', zombie: '#9ab08a', scarecrow: '#e8c870', morwenna: '#b8d0a0', raider: '#e0b088' };
const HAIR = { scarecrow: '#c8a040', pirate: '#2a1a14', morwenna: '#2a1a3a', barnacle: '#e8e0d0' };
DQ.monSprite = (m, size = 48, cls = '') => DQ.px(MON_SPR[m.id] || 'ghost', { p: m.col, s: SKIN[m.id], h: HAIR[m.id] }, size, cls);
DQ.petSprite = (p, size = 40, cls = '') => DQ.px(p.spr, { p: p.col, s: p.col }, size, cls);
const ANI_SPR = { hen: 'bird', cow: 'quad', sheep: 'quad', pig: 'quad', goat: 'quad', bees: 'hive' };
DQ.animalSprite = (a, size = 48, cls = '') => DQ.px(ANI_SPR[a.id] || 'quad', { p: a.col }, size, cls);
DQ.plantSprite = (stage, col, size = 48, cls = '') => DQ.px('plant' + stage, { o: col }, size, cls);
})();
