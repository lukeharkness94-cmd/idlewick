/* Idlewick: hand-drawn 24x24 creature sprites. Each creature has its own grid and palette.
   M() takes full 24-wide rows; Y() takes 12-wide left halves and mirrors them. */
(() => {
const DQ = window.DQ, SP = DQ.SPR24 = {};
const K = '#1a1310';
const M = (id, pal, rows) => { SP[id] = { pal: Object.assign({ k: K }, pal), rows }; };
const Y = (id, pal, half) => M(id, pal, half.map(r => { r = (r + '............').slice(0, 12); return r + [...r].reverse().join(''); }));

/* ---------------- Willowbrook ---------------- */
M('chicken', { w: '#f6f1e6', s: '#cfc4ae', r: '#d8402f', y: '#f0b030', e: '#120c08' }, [
  '........................', '........rr..............', '.......rrrk.............', '......kwwwwk............', '.....kwwwwwwk...........', '....ykwekwwwwk..........',
  '...yyykwwwwwwk..........', '....kkrwwwwwwk.....kk...', '......rkwwwwwwk...kwwk..', '.......kwwwwwwwkkkwwwk..', '......kwwwwwwwwwwwwwsk..', '.....kwwwwswwwwwwwwssk..',
  '.....kwwwssswwwwwwssk...', '.....kwwwwsswwwwwsssk...', '......kwwwwwwwwwsssk....', '.......kswwwwwwssskk....', '........kkssssssskk.....', '..........kkkkkkk.......',
  '...........y...y........', '...........y...y........', '..........yy..yy........', '.........y.y.y.y........', '........................', '........................']);
M('rat', { g: '#8a8478', d: '#625c52', l: '#aaa494', p: '#e8a0a8', e: '#d83030', w: '#f4efe4' }, [
  '........................', '........................', '........................', '........................', '........................', '........................',
  '.....kk.................', '....kppk..kkkkk.........', '....kpgkkkgggggkk.......', '...kkgggglgggggggk......', '..kegggggllgggggggk.....', '.kpggggggglggggggggk....',
  '.kkgggggggggggggggdk....', '..kwgggggggggggggddk....', '...kkddggggggggdddk.....', '.....kkddddddddddk......', '......kdk.kdk.kdkk......', '......kk..kk..kk.kpp....',
  '..................kppk..', '....................kppk', '......................kp', '........................', '........................', '........................']);
Y('goblin', { g: '#6fb35e', d: '#4a8a3c', l: '#9ad37e', e: '#e8302a', b: '#7a5230', n: '#a07040', t: '#f0e8c8' }, [
  '............', '............', '.....kkkk...', '....kggggk..', 'kk.kggggggk.', 'kgkkgggggggk', '.kggggekggg.', '..kgggggggg.',
  '...kgggggkg.', '....kgtgtggg', '....kkggggkk', '...kbbbbbbbb', '..kgkbbnbbbb', '..kgkbbbbbbb', '..kgkbbbbbbb', '..kkkbbkkbbb',
  '....kbbk.kbb', '....kggk.kgg', '....kggk.kgg', '...kkggk.kgg', '...kkkkk.kkk', '............', '............', '............']);
M('cow', { w: '#f4efe4', b: '#2a2420', p: '#e8a0a8', h: '#d8c8a0', g: '#bdb5a5', e: '#120c08' }, [
  '........................', '........................', '........................', '........................', '.hk.kh..................', '.khkhk..................',
  '..kwwk...kkkkkkkkkkk....', '.kwwbwkkkwwwbbbwwwwwk...', 'kwewbwwwwwbbbbbwwwwwwk..', 'kwwwwwwwwwwbbbwwwbbbwk..', 'kpppkwwwwwwwwwwwbbbbwwk.', 'kppppkwwbbwwwwwwwbbwwwk.',
  '.kkkkkwbbbbwwwwwwwwwwwk.', '.....kwwbbwwwwwwwwwwwgk.', '.....kwwwwwwppwwwwwwggk.', '......kgwwwkpppkwwwwgk..', '......kwgk.kkkk.kwgkwk..', '......kwwk......kwwkwk..',
  '......kwwk......kwwk.k..', '......kbbk......kbbk....', '......kkkk......kkkk....', '........................', '........................', '........................']);
Y('grubnash', { g: '#7aa84e', d: '#527a34', e: '#ffd040', h: '#9a9a9a', m: '#c8c8c8', r: '#c83a2a', b: '#6a4428', t: '#f0e8c8', u: '#e8dcc0' }, [
  'u...........', 'uk..........', 'kuk.kkkkkk..', '.kukhhhhhhk.', '..khmhhhhhhk', '..khhhhhhhhh', '...kgggggggg', '..kkgrekgggg',
  'kgkggrgggggg', '.kgggggggggg', '..kggtgtgtgg', '..kkgggggggk', '.kbbkkkkkkkk', 'kbbbbbrbbbbb', 'kbbbbrbbbbbb', 'kgkbbbbbbbbb',
  'kgkbbbbbbbbb', 'kgkkbbbkkbbb', '.k.kbbbk.kbb', '...kgggk.kgg', '...kgggk.kgg', '..kkkkkk.kkk', '............', '............']);

/* ---------------- Mossbarrow ---------------- */
M('boar', { b: '#7a5032', d: '#553620', l: '#a07048', t: '#f4ecd8', e: '#e8302a', p: '#c88a70' }, [
  '........................', '........................', '........................', '........................', '........................', '........kk.kk.kk........',
  '.......kdkkdkkdkkkk.....', '...kk.kbbbbbbbbbbbbkk...', '..kbbkbbbbbbbbbbbbbbbk..', '.kbebbbbblbbbbbbbbbbbdk.', 'kbbbbbbbllbbbbbbbbbbbdk.', 'kpkbbbbbbbbbbbbbbbbbddk.',
  'kppkbbbbbbbbbbbbbbbdddk.', 'tkkkbbbbbbbbbbbbbbddddk.', 'kt.kddbbbbbbbbbbbdddkk..', '.kk.kkddddddddddddkk....', '.....kbdk.kbdk.kbdk.....', '.....kbdk.kbdk.kbdk.....',
  '.....kkkk.kkkk.kkkk.....', '........................', '........................', '........................', '........................', '........................']);
M('wolf', { g: '#8e939a', d: '#62666c', l: '#c4c8cc', w: '#e8ecee', e: '#f0c030' }, [
  '........................', '........................', '........................', '...k.k..................', '..kgkgk.................', '..kggggk................',
  '.kgeggggk.....kkkkkk....', 'kwgggggggkkkkkggggggkkk.', 'kkwwgggggggggggggggggggk', '..kwwgggggglggggggggggk.', '...kwwggggllgggggggggdk.', '....kwwggggggggggggggdk.',
  '.....kwwgggggggggggggddk', '......kkddggggggggggdddk', '.......kddkkkkkkkkkdddk.', '.......kgk.......kgk.kk.', '.......kgk.......kgk....', '......kggk......kggk....',
  '......kkkk......kkkk....', '........................', '........................', '........................', '........................', '........................']);
Y('scarecrow', { h: '#8a6a3a', y: '#e8c860', s: '#d8c090', d: '#a89060', e: '#1a1310', o: '#ff8a2a', r: '#a04030', b: '#6a4a30', c: '#5a7a9a' }, [
  '............', '......kkkk..', '.....khhhh..', '....khhhhhh.', '..kkkkkkkkkk', '..yyksssssss', '....ksessses', '....ksosssso',
  '....ksssssss', '....kseeeeee', '.....ksssss.', 'bbbbbkkcckkk', 'yykbbkccrccc', '..ykkcccrccc', '....kccccrcc', '....kcccccrc',
  '....kkckkkck', '.....kbk..kb', '.....kbk..kb', '.....kbk..kb', '.....kyk..ky', '....yyy..yyy', '............', '............']);
M('oldtusk', { b: '#6a4228', d: '#4a2c18', l: '#9a6a44', t: '#fff4dc', e: '#ff3a2a', s: '#c89070', c: '#e8c040' }, [
  '........................', '........ckc.ckc.ckc.....', '........kckkckkckk......', '.......kdkdkdkdkdkkk....', '...kk.kbbbbbbbbbbbbbkk..', '..kbbkbbbsbbbbbbbbbbbbk.',
  '.kbebbbbbbsbbbbbbbbbbbbk', 'kbbbbbbbbbbsbbbbbbbbbbdk', 'ksskbbbbbblbbbbbbbbbbbdk', 'ksssbbbbbbllbbbbbbbbbddk', 'kskkbbbbbbbbbbbbbbbbdddk', 'tkt.kbbbbbbbbbbbbbbddddk',
  'tt.ttkbbbbbbbbbbbbdddddk', '.tttkkddbbbbbbbbbdddddk.', '..kk..kkddddddddddddkk..', '.......kbdkk.kbdkk.kbdk.', '.......kbdk..kbdk..kbdk.', '.......kbdk..kbdk..kbdk.',
  '.......kkkk..kkkk..kkkk.', '........................', '........................', '........................', '........................', '........................']);

/* ---------------- Saltmere ---------------- */
Y('crab', { r: '#d8503a', d: '#a03424', l: '#f08a6a', e: '#120c08', w: '#f4efe4' }, [
  '............', '............', '.kk.........', 'krrk........', 'krkrk.......', 'krrrk.......', '.krrk...k...', '..krk..kwk..',
  '..krk..kek..', '...krk.kk.kk', '...kkrrrrrrr', '..krrrrrlrrr', '.krrrrrrrlrr', '.krrrrrrrrrr', '.kdrrrrrrrrr', '..kddrrrrrrr',
  '..kk.kdddddd', '.krk.kkrkkrk', 'krk..kr.krk.', 'kk...kk.kk..', '............', '............', '............', '............']);
Y('bandit', { h: '#4a3a30', d: '#2e241c', s: '#e0b088', e: '#120c08', m: '#8a2a2a', c: '#6a5440', b: '#3a2e24', m2: '#aaa' }, [
  '............', '.....kkkk...', '....khhhhk..', '...khhhhhhk.', '..khhhhhhhhh', '..khhssssss.', '..khmmmmmmmm', '..khmemmmmem',
  '..khhssssss.', '..khhhssssss', '...khhhkkkkk', '...kccccccmc', '..kcccccmccc', '.kscccccccmc', '.kskcccccccc', '.kskbbbbbbbb',
  '.kk.kcccckcc', '....kcck.kcc', '....kbbk.kbb', '...kkbbk.kbb', '...kkkkk.kkk', '............', '............', '............']);
Y('smuggler', { h: '#2e3a44', d: '#1c2630', s: '#d8a880', e: '#120c08', c: '#3a5a6a', l: '#5a7a8a', y: '#f0c040', b: '#3a2a20', r: '#a03a2a' }, [
  '............', '...kkkkkk...', '..khhhhhhk..', '.kkkkkkkkkk.', 'khhhhhhhhhhh', '...kssssssss', '...kseksssse', '...ksssssss.',
  '...kssrrrsss', '....ksssssss', '...kkcckkkkk', '..kcccclcccc', '.kccccclcccc', 'kcskccclcccc', 'kcskccbbbbbb', 'kyykccclcccc',
  'kyyk.kcccckc', '.kk..kcck.kc', '.....kbbk.kb', '....kkbbk.kb', '....kkkkk.kk', '............', '............', '............']);
Y('pirate', { r: '#c83a2a', s: '#d8a070', e: '#120c08', p: '#1a1310', b: '#5a3a24', w: '#f4efe4', c: '#3a3a5a', y: '#e8c040', g: '#c8c8c8' }, [
  '............', '....kkkkk...', '...krrrrrk..', '..krrrwrrrrr', '..krrrrrrrrr', '..kssssssss.', '..kspppssses', '..ksppssssss',
  '..ksssssssss', '...kbbbbbbbb', '...kbbbbbbbb', '..kkkbbbbbbk', '.kcccccwcccc', 'kcskccwcwccc', 'kcskcccwcccc', 'kcskyyyyyyyy',
  'kgk.kcccckcc', 'kgk..kcck.kc', 'kgk..kbbk.kb', '.k..kkbbk.kb', '....kkkkk.kk', '............', '............', '............']);
Y('barnacle', { h: '#1e2a3a', y: '#e8c040', s: '#c89a78', e: '#120c08', w: '#e8e0d0', c: '#2a4a6a', l: '#4a7a9a', t: '#6fc7d8', r: '#d8503a' }, [
  '............', '..kkkkkkkkkk', '.khhhhhhhhhh', 'khhhyhhhhhhh', 'khhhhhhhhhhh', '.kkkkkkkkkkk', '...kssssssss', '...kseksssse',
  '...kssssssss', '...kwwwwwwww', '...kwwkwwwww', '..kkkwwwwwwk', '.kcccccycccc', 'ktckccccyccc', 'kttkctcccycc', 'krrkccccccyc',
  'krrkkcccckcc', '.kk..kcck.kc', '.....ktck.kc', '....kkcck.kc', '....kkkkk.kk', '............', '............', '............']);

/* ---------------- Ironpeak ---------------- */
Y('bat', { p: '#6a5a7a', d: '#4a3e58', l: '#8a7a9a', e: '#ff4040', w: '#f4efe4', m: '#c8a8d8' }, [
  '............', '............', '............', '............', 'k...........', 'kk.......k.k', 'kpk......kpk', 'kppk....kppp',
  'kpppk..kpppp', 'kppppkkpeppp', 'kpppppppppww', 'kpdpppppppmm', 'kdkdpppppppp', 'k.k.kdppppp.', '......kdppp.', '.......kddd.',
  '........kkk.', '............', '............', '............', '............', '............', '............', '............']);
M('icewolf', { w: '#e8f4fa', l: '#bfe0f0', d: '#8ab4cc', e: '#4ad0ff', i: '#9ae0ff' }, [
  '........................', '........................', '........................', '...k.k..................', '..kwkwk.................', '..kwwwwk................',
  '.kwewwwwk.....kkkkkk....', 'kwwwwwwwwkkkkkwwwwwwkkk.', 'kkwwwwwwwwwwwwwwwwwwwwwk', '..kwwwwwwwlwwwwwwwwwwwk.', '...kwwwwwlllwiwwiwwwwlk.', '....kwwwwwwwwwwwwwwwwlk.',
  '.....kwwwwwwwwwwwwwwwllk', '......kkllwwwwwwwwwwlllk', '.......klldkkkkkkkklllk.', '.......kwk.......kwk.kk.', '.......kwk.......kwk....', '......kwwk......kwwk....',
  '......kkkk......kkkk....', '........................', '........................', '........................', '........................', '........................']);
Y('raider', { h: '#8a8a8a', m: '#c8c8c8', u: '#efe4c8', s: '#e0a880', e: '#120c08', o: '#d8702a', d: '#a85020', b: '#6a4a30', c: '#5a4a3a', a: '#b8bcc0' }, [
  '............', 'u...........', 'uk..kkkkkk..', 'uukkhhhhhh..', '.ukhhmhhhhhh', '..khhhhhhhhh', '..kssssssss.', '..ksekssseks',
  '..ksssssssss', '..kooooooooo', '.kooodooodoo', '.koooooooooo', '..kooooooook', '.kkcccbbbbcc', 'kaakcccccccc', 'kaakcccccccc',
  '.kbkcccccccc', '.kbkkcckkkcc', '.kbk.kbbk.kb', '..k..kbbk.kb', '....kkkkk.kk', '............', '............', '............']);
Y('troll', { g: '#7a8a68', d: '#566448', l: '#9aaa86', e: '#ffd040', t: '#f0e8c8', b: '#6a5038' }, [
  '............', '....kkkkkk..', '...kggggggk.', '..kggggggggg', '..kggekggggg', '..kgggggggg.', '..kggggggggg', '...kgtgggtgg',
  '..kkggggggkk', '.kgggggggggg', 'kgggglgggggg', 'kgggggglgggg', 'kgkggggggggg', 'kgkgbbbbbbbb', 'kgkgbbbbbbbb', 'kggkgggggggg',
  '.kk.kgggggkg', '....kgggk.kg', '....kgggk.kg', '...kggggk.kg', '...kkkkkk.kk', '............', '............', '............']);
Y('frostmaw', { w: '#e8f6ff', l: '#bfe6ff', d: '#7aa8cc', e: '#3ab8ff', i: '#9ae8ff', t: '#ffffff' }, [
  '..i.....i...', '..ik...ki...', '..kik.kik...', '...kkkkkkk..', '..klllllllk.', '.kllllllllll', '.klleklllll.', '.klllllllll.',
  '..kltlllltll', '.kkllllllkkk', 'klllllllllll', 'klllwllllwll', 'klklllwlllll', 'klklllllllll', 'kik.klllllll', 'kik.klllllll',
  '.k..kddlllkd', '....klllk.kl', '....klllk.kl', '...kllllk.kl', '...kkkkkk.kk', '............', '............', '............']);

/* ---------------- Gloomfen ---------------- */
Y('zombie', { g: '#8aa07a', d: '#5a7050', e: '#e8f040', c: '#5a4a6a', l: '#7a6a8a', r: '#8a2a2a', b: '#3a3040' }, [
  '............', '.....kkkk...', '....kgggdk..', '...kgggggg..', '...kgegggge.', '...kgggggg..', '...kgrrrrr..', '....kggggg..',
  'kkkkkkcckkkk', 'kgggkcccccl.', 'kgggkcclcccc', '.kkkkcccccc.', '....kccclccc', '....kcccc.cc', '....kbbbbbbb', '....kbbbbbbb',
  '....kcckkcc.', '....kggk.kgg', '....kggk.kgg', '...kkggk.kgg', '...kkkkk.kkk', '............', '............', '............']);
Y('skeleton', { w: '#e8ece4', g: '#b8bcb4', e: '#120c08', r: '#ff5040' }, [
  '............', '.....kkkk...', '....kwwwwk..', '...kwwwwwww.', '...kwkkwwwkk', '...kwkrwwwkr', '...kwwwwwww.', '....kwkwkwkw',
  '.....kwwwwww', '......kkwwkk', '...kkkwgwwgw', '..kw.kwwwwww', '..kw.kgwwgww', '..kw..kwwwww', '..kw...kwwkk', '..kk...kwwkw',
  '......kwk.kw', '......kwk.kw', '......kwk.kw', '.....kwwk.kw', '.....kkkk.kk', '............', '............', '............']);
M('bogsnapper', { g: '#5f8a4a', d: '#3f6430', l: '#8ab06a', e: '#f0e040', t: '#f4efe4', y: '#c8c890' }, [
  '........................', '........................', '........................', '........................', '........................', '........................',
  '...........kk.kk........', '..kkkkkkkkkekkdkk.......', '.kggggggggggggggdkk.....', 'kgtgtgtgtgggggggggdkk...', 'kkkkkkkkkkggglgggggddk..', 'kgtgtgtgtggllgggggggdk..',
  '.kgggggggggggggggggdddk.', '..kkkkkyyyyyyyyyyyddddkk', '......kkkkkkkkkkkkdddkdk', '......kgk.kgk...kgk.kddk', '.....kggk.kggk.kggk..kk.', '.....kkkk.kkkk.kkkk.....',
  '........................', '........................', '........................', '........................', '........................', '........................']);
Y('wraith', { p: '#6a5a9a', d: '#4a3e78', l: '#9b87e0', e: '#c8ff8a', b: '#1e1830', g: '#c8ff8a' }, [
  '............', '.....kkkk...', '....kppppk..', '...kppppppk.', '..kpppbbbbbb', '..kppbbbbbbb', '..kpbbebbbbe', '..kpbbbbbbbb',
  '..kppbbbbbbb', '.kpppppbbbbb', 'kpplpppppppp', 'kplpppppplpp', 'kpkpppppplpp', 'kgkpppppplpp', 'kgkppppplppp', '.k.kppppplpp',
  '...kpdppplpp', '...kpdpppdpp', '....kdppkdpp', '....k.kdk.kd', '.......k...k', '............', '............', '............']);
Y('morwenna', { r: '#7a2a3a', h: '#2a1a3a', p: '#5a3a8a', l: '#8a6aba', s: '#a8c890', e: '#f0e040', g: '#4a7a3a', o: '#c8ff8a', b: '#5a3a20' }, [
  '.....kk.....', '....khhk....', '....khhk....', '...khhhk....', '...khhhhk...', '..khhphhhk..', 'kkkkkkkkkkkk', '...ksssssss.',
  '..gksessssse', '..gkssssssss', '..gksssrrsss', '...kkkssssss', '..kppppppppp', '.kpppplppppp', 'kpspppplpppp', 'kpskppppplpp',
  'kook.pppplpp', 'kook.ppppplp', '.bk..pppppkp', '.bk.kpppppkp', '.bk.kkkkkkkk', '............', '............', '............']);

/* ---------------- Emberfall ---------------- */
Y('imp', { r: '#d84a2a', d: '#a03018', l: '#f08060', e: '#ffe040', h: '#3a2018', w: '#ffb060' }, [
  '............', '...k........', '..khk.......', '..khk.kkkk..', '...kkkrrrrk.', '....krrrrrr.', 'k...krrekrre', 'kk..krrrrrrr',
  'krk..krwwwww', 'krrk..krrrrr', 'krrrkkkrrrrr', 'krrrrrrrlrrr', '.krrrrrrrlrr', '..kkkrrrrrrr', '....krrrrrrr', '....kkrrrkrr',
  '.....krrk.kr', '.....krrk.kr', '....kkhhk.kh', '....kkkkk.kk', '............', '............', '............', '............']);
M('hound', { r: '#5a2a20', d: '#3a1a14', o: '#ff7a2a', y: '#ffd040', e: '#ffe040', l: '#e8502a' }, [
  '........................', '........................', '........................', '...o.o..................', '..oyoyo.................', '..kokok.....o.o.........',
  '.krerrrk..oyoyoyo.......', 'krrrrrrrkkkkkkkkkkkk.oo.', 'kkrrrrrrrrrrrrrrrrrrkoyo', '..krrrrrrrrrlrrrlrrrrko.', '...krrrrrrrllrlllrrrrk..', '....krrrrrrrrrrrrrrrdk..',
  '.....krrrrrrrrrrrrrrdk..', '......kkddrrrrrrrrrddk..', '.......kddkkkkkkkkddk...', '.......krk.......krk....', '.......krk.......krk....', '......kook......kook....',
  '......kkkk......kkkk....', '........................', '........................', '........................', '........................', '........................']);
M('drake', { g: '#4aa86a', d: '#2e7a48', l: '#7ad08e', y: '#e8d870', e: '#ff4020', w: '#c8e8b0', t: '#f4efe4' }, [
  '........................', '..............kk........', '.............kggk..kk...', '............kgggkkkggk..', '...kk......kggggggggggk.', '..kggk....kggggggggdggk.',
  '..kgggk..kggggdggggddgk.', '...kgggkkgggddgggdddgk..', '.....kgggggdddggddddk...', 'kkk...kggggggggggdkk....', 'kegkkkgggggggggggk......', 'kgggggggglgggggggkk.....',
  'ktttkggggllgggggggdk....', 'kkkkkggggyyyyyyggggdkk..', '...kkgggyyyyyyyygggddkk.', '.....kggyyyyyyyyggk.kddk', '......kgdkkkkkkdgk...kdk', '......kgk......kgk....kk',
  '.....kggk.....kggk......', '.....kkkk.....kkkk......', '........................', '........................', '........................', '........................']);
Y('emberlord', { a: '#4a3a34', d: '#2e221e', l: '#7a645a', o: '#ff7a2a', y: '#ffd040', e: '#ffe040', r: '#c83a2a' }, [
  '.....oy.....', '....oyo.....', '....kooy....', '...kaaaak...', '..kaaaaaak..', '..kalaaaaaa.', '..kaaaaaaaa.', '..kakkeekke.',
  '..kaaaaaaaa.', '.kkkaaaaaakk', 'kaaakaaaaaaa', 'kalakaaoaaaa', 'kaaakaaaoaaa', 'kaaakaaaaoaa', '.kk.kaaaaaaa', '.kok.kaaaaaa',
  'kooo.kaaakaa', '.kok.kaak.ka', '.k...kaak.ka', '....kkaak.ka', '....kkkkk.kk', '............', '............', '............']);
M('pyrrhax', { r: '#d8502a', d: '#9a3018', l: '#f0905a', y: '#ffd040', e: '#ffe860', o: '#ff8a2a', t: '#f4efe4', w: '#7a2a1a' }, [
  '..........kk.......kk...', '.........kwwk.....kwwk..', '........kwwwwk...kwwwwk.', '...kk..kwwwwwwk.kwwwwwwk', '..krrk.kwwwwwwwkwwwwwwwk', '.krrrrkkwwwwwwwwwwwwwwwk',
  'krrerrrkkwwwwwwwwwwwwwk.', 'krrrrrrrrkkwwwwwwwwwkk..', 'ktttkrrrrrrkkwwwwwkk....', 'kkkkkrrrrrrrrkkkkk......', 'kyykkrrrrrrrrrrrk.......', 'koyyykrrrrlrrrrrrk......',
  '.kooyykrrrllrrrrrrk.....', '..kkkkrrryyyyyyrrrrk....', '.....krryyyyyyyyrrrdkk..', '.....krryyyyyyyyrrddddkk', '......krdkkkkkkdrk..kddk', '......krk......krk...kdk',
  '.....krrk.....krrk...kk.', '.....kkkk.....kkkk......', '........................', '........................', '........................', '........................']);

/* ---------------- Skyreach ---------------- */
Y('hawk', { b: '#5a7aa8', d: '#3a5a88', l: '#9fd8ff', w: '#e8f4ff', y: '#f0c030', e: '#120c08' }, [
  '............', '............', '............', 'k...........', 'kbk.........', 'kbbk........', 'kbbbk...kkkk', '.kbbbk.kwwww',
  '.kbbbbkkwekw', '..kbbbbbwwwy', '..kblbbbbwwy', '...kbllbbbwk', '...kbbllbbbw', '....kbbbbbbl', '.....kkbbbbl', '.......kbbbl',
  '........kbbk', '.......kddk.', '.......kkk..', '............', '............', '............', '............', '............']);
Y('golem', { s: '#a8a090', d: '#7a7466', l: '#cac2b0', c: '#4ad0ff', e: '#9ae8ff', m: '#6a8a5a' }, [
  '............', '....kkkkkk..', '...kssssssk.', '..ksssssssss', '..ksskeekkss', '..ksssssssss', '..ksdsssssss', '..kkkkkkkkkk',
  '.kssssksssss', 'ksssssksssss', 'ksdskscsssss', 'ksssksscssss', 'kssskssscsss', 'ksskksssccss', 'kmskksssssss', 'kssk.kdsssss',
  'kssk.kssssks', '.kk..ksssk.k', '.....kdssk.k', '....kksssk.k', '....kkkkkk.k', '............', '............', '............']);
M('wyvern', { p: '#c8bce8', d: '#9a8cc0', l: '#e8e0ff', w: '#8a7ab0', e: '#ff60a0', t: '#f4efe4' }, [
  '..............kk........', '.............kwwk.......', '............kwwwwk......', '...........kwwwwwwk.....', '..kkk.....kwwwwwwwwk....', '.kpppk...kwwwwwwwwwwk...',
  'kpeppk..kkkkkkkkkkkkk...', 'kpppppkkpppppppppk......', 'ktktppppppppppppppk.....', 'kkkkkpppppplppppppdk....', '....kpppppllpppppddk....', '.....kpppppppppppddk....',
  '......kppppppppppddkkk..', '.......kpppppppppdk.kdk.', '........kpdkkkkpdk..kdk.', '........kpk...kpk...kk..', '.......kppk..kppk.......', '.......kkkk..kkkk.......',
  '........................', '........................', '........................', '........................', '........................', '........................']);
Y('zephyrion', { b: '#8ac8f0', d: '#5a98c8', l: '#e0f4ff', w: '#ffffff', y: '#ffe040', e: '#2a1a40', o: '#f0b030' }, [
  'y...........', 'yk..........', 'kyk.........', 'kbyk........', 'kbbyk...kkkk', 'kbbbyk.kwwww', '.kbbbbkkwewk', '.kbbbbbbwwwo',
  '..kbbbbbbwwo', '..kblbbbbbwk', '...kbllbbbbw', '...kbbllbbbb', '....kbbblbbl', '.....kbbbbbl', '......kbbbbl', '.......kbbbl',
  '........kbbk', '.......kook.', '......kokok.', '............', '............', '............', '............', '............']);

/* ---------------- The Hollow Crown ---------------- */
Y('voidknight', { a: '#2e2440', d: '#1a1428', l: '#5a4a7a', e: '#c07aff', p: '#8a5ad8', s: '#9a9ab0' }, [
  '............', '.....kk.....', '....kaak....', '...kaaaaak..', '..kaaaaaaaa.', '..kalaaaaaaa', '..kaaaaaaaaa', '..kakkkkeeke',
  '..kaaaaaaaaa', '.kkkaaaaaakk', 'kaaakaaaaaaa', 'kalakaapaaaa', 'kaaakaaaapaa', 'kaaakaaaaapa', 'ks.kkaaaaaaa', 'ks..kaaaaaaa',
  'ks..kaaakkaa', 'ks..kaak.kaa', 'k...kaak.kaa', '...kkaak.kaa', '...kkkkk.kkk', '............', '............', '............']);
Y('shade', { b: '#1e1630', d: '#120c20', p: '#3a2e58', e: '#d0a0ff', l: '#5a4a80' }, [
  '............', '............', '.....kkkk...', '....kbbbbk..', '...kbbbbbbb.', '..kbbbbbbbbb', '..kbbebbbbbe', '..kbbbbbbbbb',
  '..kbbbbbbbbb', '..kbbbblbbbb', '.kbbbbbbbbbb', '.kbpbbbbbbbb', 'kbbbpbbbbbbb', 'kbbbbpbbbbbb', 'kbbbbbbbbbbb', '.kbbpbbbbpbb',
  '..kbbbpbbbbp', '...kbbbbkbbb', '....kpbk.kpb', '.....kk...kk', '............', '............', '............', '............']);
Y('horror', { p: '#8a3a6a', d: '#5a1e44', l: '#c86a9a', w: '#f4efe4', e: '#120c08', y: '#f0e040' }, [
  '............', '............', '....kkkk....', '...kppppkk..', '..kppppppppk', '.kpppppwwwww', '.kppppwwwwww', 'kppppwwwyyyy',
  'kpppwwwyyyee', 'kpppwwwyyyee', 'kppppwwwyyyy', '.kppppwwwwww', '.kpkppppwwww', 'kpk.kpppppkk', 'kpk.kpk.kpk.', 'kpk.kpk..kpk',
  '.kpk.kpk.kpk', '..kk..kk..kk', '............', '............', '............', '............', '............', '............']);
Y('hollowking', { c: '#e8c040', y: '#fff080', b: '#e8e4f0', g: '#a8a4c0', e: '#c07aff', p: '#4a2a7a', l: '#7a4aba', r: '#8a1a3a' }, [
  '...c...c....', '...cc.ccc...', '...cyccccc..', '...kkkkkkkk.', '...kbbbbbbbb', '..kbbbbbbbbb', '..kbkkebbbke', '..kbkkkbbkkk',
  '..kbbbbbbbbb', '...kbkbkbkbk', '..kkkbbbbbbb', '.kppppkggkgk', 'kppppkgggggg', 'kplppkgkgkgg', 'kppppkgggggg', 'kplpppkgkgkg',
  'kppppppkgggg', 'kplpppppkggg', 'kppppppppkgg', 'krrrrrrrrrkg', '.kkkkkkkkkkk', '............', '............', '............']);

/* ---------------- Pets ---------------- */
M('biscuit', { y: '#d8a050', d: '#a87030', l: '#f0c880', w: '#f8ecd8', e: '#120c08', p: '#e8708a', r: '#c83a2a' }, [
  '........................', '........................', '........................', '........................', '........................', '........kk..............',
  '.......kdyk.....kk......', '......kddyyk...kyyk.....', '......kyyyyykkkyyyk.....', '.....kyyeyyyyyyyyk......', '....kwyyyyyyyyyyyk......', '....kewwyyyyyyyyyk......',
  '.....kkwwwrrrryyyk......', '.......kpkyyyyyyyk...kk.', '........kyylyyyyyk.kyyk.', '........kyyyllyyyyyyyk..', '........kyyyyyyyyyyk....', '........kwykkyykkywk....',
  '........kwk..kk..kwk....', '........kkk......kkk....', '........................', '........................', '........................', '........................']);
Y('toast', { y: '#ffd84a', d: '#e8a820', l: '#fff4a0', o: '#f08a20', e: '#120c08' }, [
  '............', '............', '............', '............', '............', '.....k.k....', '......k.....', '....kkkkk...',
  '...kyyyyyk..', '..kyyyyyyyy.', '..kyyekyyyye', '..kyyyyooooo', '..kyyyyyoooo', '.kyyyyyyyyyy', 'kyyykyyyyyyy', 'kyylkyyyyyyy',
  '.kyyykyyyyyy', '..kdyyyyyyyy', '...kkdddddddd', '.....kok..ko', '....kooo.koo', '............', '............', '............']);
M('bubbles', { o: '#ff9a3a', d: '#d86a1a', l: '#ffc880', w: '#f4efe4', e: '#120c08', b: '#8ad8ff' }, [
  '........................', '...................b....', '..................b.b...', '...................b....', '......b.................', '.....b.b................',
  '......b..kkkkk..........', '.......kkllllokk.....kk.', '......kllloooooookk.kook', '....kwlooooooooooookoook', '...kwekoooooooooooooook.', '...kwwoooooooooooodook..',
  '...koooooooooooddddook..', '.....kooooooddddddkkook.', '......kkdddddddkk..kook.', '........kkkkkkk.....kk..', '..........kook..........', '...........kk...........',
  '........................', '........................', '........................', '........................', '........................', '........................']);
M('acorn', { r: '#c8702a', d: '#9a4a1a', l: '#f0a060', w: '#f8ecd8', e: '#120c08', b: '#8a5a30', g: '#6a9a3a' }, [
  '........................', '........................', '................kkkk....', '..............kkrrrrk...', '.............krrlllrrk..', '.............krllrrlrrk.',
  '.............krlrrrrlrk.', '....k.k.......krrrrrlrk.', '...krkrk......krrrrrlrk.', '...krrrrk....krrrrrrlrk.', '..krerrrrk..krrrrrrrrk..', '..kwrrrrrrkkrrrrrrrrk...',
  '..kkwwrrrrrrrrrrrrrk....', '....kbbkwrrrrrrrrrk.....', '...kbbbbkwwrrrrrrk......', '...kgbbbk.kwrrrrrk......', '....kkkk..kwrkkrrk......', '..........kkk.kkkk......',
  '........................', '........................', '........................', '........................', '........................', '........................']);
M('nugget', { m: '#6a5a50', d: '#4a3c34', l: '#8a7a70', p: '#f0909a', w: '#f4efe4', c: '#e8d8c0', b: '#7a5232' }, [
  '........................', '........................', '........................', '........................', '........................', '........................',
  '........................', '........kkkkkkkk........', '......kkmmmmmmmmkk......', '.....kmmmmmmmmmmmmk.....', '....kmmmmmmlmmmmmmmk....', '...kmmkmmmmllmmmmmmmk...',
  '..kppmmmmmmmmmmmmmmmk...', '..kppkmmmmmmmmmmmmmdk...', '...kkmmmmmmmmmmmmmddk...', '..kckkdmmmmmmmmmmdddk...', '.kccck.kddddddddddkk....', '.kkkk...kccck.kccck.....',
  '........kkkkk.kkkkk.....', 'bbbbbbbbbbbbbbbbbbbbbbbb', '........................', '........................', '........................', '........................']);
M('whiskers', { g: '#9a9aa8', d: '#6a6a78', l: '#c8c8d4', w: '#f4efe4', e: '#7ad04a', p: '#e8909a' }, [
  '........................', '........................', '........................', '........................', '....k...k...............', '...kgk.kgk..............',
  '...kgpkpgk..............', '...kgggggk..............', '..kgegggegk.......kk....', '..kggpgpggk......kgk....', '..kgwwwwwgk......kgk....', '...kgwwwgk......kgk.....',
  '...kgggggkk....kgk......', '..kgggllgggkk.kggk......', '..kggglllgggkkggk.......', '..kgggglllgggggk........', '..kggggglgggggk.........', '..kgwwkgggkwwgk.........',
  '..kwwk.kkk.kwwk.........', '..kkk.......kkk.........', '........................', '........................', '........................', '........................']);
Y('cinder', { y: '#ffe060', o: '#ff8a2a', r: '#d84a1a', e: '#3a1a10', w: '#fff8d0' }, [
  '............', '.....o......', '.....oo.....', '....ooy..o..', '....oyyo.oo.', '...kooyyoyo.', '...koyyyyyyy', '..koyyywwwww',
  '..koyywwwwww', '..koywweewww', '..koywwwwwww', '..kooywwrrww', '..krooyywwww', '...krooyyyyy', '....krroooyy', '.....kkrrooo',
  '.......kkrrr', '.........kkk', '............', '............', '............', '............', '............', '............']);
Y('quill', { b: '#a08060', d: '#7a5a3a', l: '#d8c0a0', w: '#f4ecdc', y: '#f0c030', e: '#120c08', o: '#e8a020' }, [
  '............', '............', '..k.........', '..kbk.......', '..kbbkkkkkkk', '..kbbbbbbbbb', '..kbwwwwbbbw', '..kbwyyywbwy',
  '..kbwyeywbwy', '..kbwwwwbbbw', '..kbbbbbbbbo', '.kbbblbbbbbo', '.kbbllbbbbbb', '.kbblllbbbll', '.kbblllbbbll', '.kbbbllbbbbl',
  '..kbbbbbbbbb', '...kkbbbbbbb', '....kokkkkko', '....oo.....o', '............', '............', '............', '............']);
M('pudding', { p: '#f0a8b0', d: '#d07a88', l: '#ffd0d8', e: '#120c08', n: '#e07a8a' }, [
  '........................', '........................', '........................', '........................', '........................', '........................',
  '........................', '.....kk......kkkk.......', '....kdpk...kkppppkk.....', '....kppkkkkppppppppk....', '...kpppppppppplppppk....', '..kpeppppppppllppppkk...',
  '.kpppppppppppppppppdk.k.', 'knnnkpppppppppppppdkkdk.', 'kndnkpppppppppppppddkdk.', '.kkkkdppppppppppppddk.k.', '.....kddppppppppdddk....', '......kpkkpkkpkkpkk.....',
  '......kkk.kkk.kkkk......', '........................', '........................', '........................', '........................', '........................']);
Y('gobbo', { g: '#8fbf6a', d: '#5a8a3c', e: '#ffd040', b: '#8a6a40', t: '#f0e8c8' }, [
  '............', '............', '............', '............', '............', '.....kkkk...', 'kk..kggggk..', 'kgkkgggggg..',
  '.kggggggggg.', '..kggegggge.', '..kgggggggg.', '...kggtgtgg.', '....kkgggg..', '...kbbbbbbbb', '..kgkbbbbbbb', '..kgkbbbbbbb',
  '...kkbbkkbbb', '....kggk.kgg', '....kkkk.kkk', '............', '............', '............', '............', '............']);
M('tusky', { b: '#b07a4a', d: '#7a5030', l: '#d8a878', s: '#e8c8a0', e: '#120c08', p: '#e8a090', t: '#fff4dc' }, [
  '........................', '........................', '........................', '........................', '........................', '........................',
  '........................', '........................', '......k.k.k.k...........', '....kkdkdkdkdkk.........', '..kkbbbbbbbbbbbbk.......', '.kbebsbbsbbsbbbbbk......',
  'kpbbbsbbsbbsbbbbbdk.....', 'kppkbsbbsbbsbbbbddk.....', 'tkkbbbbbbbbbbbbbddk.....', '.kt.kddbbbbbbbbddk......', '....kkkddddddddkk.......', '.....kbk.kbk.kbk........',
  '.....kkk.kkk.kkk........', '........................', '........................', '........................', '........................', '........................']);
M('bill', { s: '#e8d0a0', d: '#b89a68', l: '#fff0c8', p: '#c88a5a', r: '#6fc7d8', o: '#3a98b0', e: '#120c08' }, [
  '........................', '........................', '........................', '........................', '..........kkkkk.........', '........kkssssskk.......',
  '.......kssllllsssk......', '......kssldddlsssk......', '......ksldsssdlssk......', '.....kssldslsdlsssk.....', '.....ksssldddlssssk.....', '.....ksssslllssssdk.....',
  '..k.k.kssssssssssddk....', '.krkrkrkksssssssddk.....', '.krrrkeerrkkkkkkkk......', 'krrrrrrrrrrrrrrk........', 'kokrrrrrrrrrrrok........', '.kk.krkrkrkrk.kk........',
  '....kk.kk.kk............', '........................', '........................', '........................', '........................', '........................']);
Y('frostling', { w: '#e8f6ff', l: '#bfe6ff', d: '#7aa8cc', e: '#3ab8ff', i: '#9ae8ff', t: '#ffffff' }, [
  '............', '............', '............', '............', '...i....i...', '...ik..ki...', '....kkkkkk..', '...kllllll..',
  '..klllllll..', '..klekllllle', '..kllllllll.', '..kltllltlll', '..kkllllllkk', '.klllllwllll', '.klklllllwll', '.klklllllllk',
  '..k.kllllkll', '....klllk.kl', '....kkkkk.kk', '............', '............', '............', '............', '............']);
Y('bogwisp', { g: '#c8ff8a', l: '#efffd0', p: '#b79cff', d: '#7a5ad8', e: '#2a1a40' }, [
  '............', '............', '............', '.....g......', '....gg..g...', '....gl.gg...', '....kkggkk..', '...kpppppp..',
  '..kpppllllll', '..kpplllllll', '..kpllelllle', '..kpllllllll', '..kppllllgll', '...kpppllll.', '...kdppppppp', '....kdpppp.p',
  '.....kdpk.kd', '......kk...k', '............', '............', '............', '............', '............', '............']);
M('wyrmling', { r: '#e8603a', d: '#b03a1a', l: '#ffa070', y: '#ffd860', e: '#120c08', w: '#ffb090', t: '#f4efe4' }, [
  '........................', '........................', '........................', '........................', '........................', '...........kk...........',
  '..kk.....kkwwk..........', '.krrk...kwwwwk..........', 'krerrk..kwwwwwk.........', 'krrrrrkkkwwwwwk.........', 'ktkrrrrrrkkkkkk.........', 'kkkrrrrrrrrrrk..........',
  '..kkrrrlrrrrrrk.........', '....krryyyyrrrrkk.......', '....krryyyyyrrrrdk..kk..', '.....krryyyyrrrrddk.kdk.', '......krdkkkdrdkkddkkdk.', '......krk...krk..kddddk.',
  '.....kkkk..kkkk...kkkk..', '........................', '........................', '........................', '........................', '........................']);
Y('stormchick', { b: '#bfe8ff', d: '#8ac0e8', l: '#ffffff', y: '#ffe040', o: '#f0a030', e: '#120c08' }, [
  '............', '............', '............', '......y.....', '.....yy.....', '.....yk.....', '....kkkkk...', '...kbbbbbk..',
  '..kbbbbbbbb.', '..kbbekbbbbe', '..kbbbbooooo', '..kbbbbboooo', '.kbbbbbbbbbb', 'kbbbkllllbbb', 'kbblkllllbbb', '.kbbkbllbbbb',
  '..kdbbbbbbbb', '...kkdddddddd', '.....kok..ko', '....kooo.koo', '............', '............', '............', '............']);
Y('hollowling', { b: '#2a1e40', p: '#4a3a70', c: '#e8c040', y: '#fff080', e: '#d0a0ff' }, [
  '............', '............', '............', '............', '....c.c.c...', '....ccycc...', '....kkkkkk..', '...kbbbbbb..',
  '..kbbbbbbbb.', '..kbbebbbbbe', '..kbbbbbbbbb', '..kbbbbbbbbb', '..kbpbbbbbbb', '...kbpbbbbbb', '...kbbpbbbbb', '....kbbbkbbk',
  '.....kbk.kbk', '......k...k.', '............', '............', '............', '............', '............', '............']);

/* ---------------- Farm animals (hen and cow reuse the creatures above) ---------------- */
M('sheep', { w: '#f4f0e8', l: '#ffffff', d: '#d4cec0', f: '#3a3028', e: '#f4efe4' }, [
  '........................', '........................', '........................', '........................', '........................', '.........kk.kk.kk.......',
  '.......kkwwkwwkwwkk.....', '..kkk.kwwlwwwwlwwwwk....', '.kfffkwwwwwwlwwwwwlwk...', 'kfefffkwlwwwwwwwlwwwwk..', 'kffffkwwwwwlwwwwwwwwdk..', '.kfffkwwwlwwwwwlwwwwdk..',
  '..kkkkwwwwwwwwwwwwwwddk.', '.....kdwwwlwwwwwwlwdddk.', '......kddwwwwwwwwddddk..', '.......kkddddddddddkk...', '........kfk.kfk.kfk.....', '........kfk.kfk.kfk.....',
  '........kkk.kkk.kkk.....', '........................', '........................', '........................', '........................', '........................']);
M('pig', { p: '#f0a8b0', d: '#d07a88', l: '#ffd0d8', e: '#120c08', n: '#e07a8a' }, [
  '........................', '........................', '........................', '........................', '........................', '.....kk.................',
  '....kdpk..kkkkkkkkk.....', '....kppkkkppppppppkk....', '...kpppppppppplppppkk...', '..kpepppppppppllppppk...', '.kpppppppppppppppppdk.k.', 'knnnkppppppppppppppdkkdk',
  'kndnkppppppppppppppdkdk.', '.kkkkdpppppppppppppddk..', '....kddpppppppppdddk....', '......kpdkkkkkkkpdk.....', '......kpk.......kpk.....', '......kkk.......kkk.....',
  '........................', '........................', '........................', '........................', '........................', '........................']);
M('goat', { g: '#d8c8a0', d: '#a89870', l: '#f0e4c8', h: '#8a7a5a', e: '#120c08', b: '#5a4a3a' }, [
  '........................', '........................', '........................', '...kk...................', '..khhk..................', '..khkhk.................',
  '...kkggk................', '.kgggggk...kkkkkkkk.....', '.kgegggggkkkgggggggkk...', 'kggggggggggggggggggggk..', 'kdggkgggggggglgggggggk..', '.kgk.kgggggggllggggggdk.',
  '.kbk.kgggggggggggggddk..', '.kbk..kddgggggggggdddk..', '..k....kgdkkkkkkkgdk....', '.......kgk.......kgk....', '.......kgk.......kgk....', '.......kbk.......kbk....',
  '.......kkk.......kkk....', '........................', '........................', '........................', '........................', '........................']);
M('bees', { y: '#e8b830', d: '#b88818', l: '#ffe080', b: '#7a5232', e: '#2a1a10', w: '#e8f4ff', k2: '#000' }, [
  '........................', '..w.......w.............', '.wkw.....wkw......w.....', '.yky.....yky.....wkw....', '..........k......yky....', '.......kkkkkkkk.........',
  '......kyyyyyyyyk........', '.....kddddddddddk.......', '....kyyyyyyyyyyyyk......', '....kddddddddddddk......', '...kyyyyyyyyyyyyyyk.....', '...kddddddkkddddddk.....',
  '...kyyyyykeekyyyyyk.....', '...kdddddkeekdddddk.....', '....kyyyyyyyyyyyyk......', '.....kkkkkkkkkkkk.......', '.....kbbbbbbbbbbk.......', '.....kbk......kbk.......',
  '.....kkk......kkk.......', '........................', '........................', '........................', '........................', '........................']);

/* ---------------- Redrawn front-facing creatures (centred) ---------------- */
const Yr = (id, half) => { const pal = SP[id].pal; Y(id, pal, half.concat(Array(24).fill('')).slice(0, 24)); };
Yr('goblin', ['', '', '........kkkk', '.......kgggg', 'kk....kggggg', 'kgkk.kgggggg', '.kggkggggggg', '..kggggeeggg', '...kgggggggg', '....kggtgtgg', '.....kkggggg', '....kbbbbbbb', '...kgkbbbbbb', '...kgkbbnbbb', '...kgkbbbbbb', '....kkbbbbbb', '.....kbbbbbb', '.....kggk...', '.....kggk...', '....kkggk...', '....kkkkk...']);
Yr('grubnash', ['..u.........', '..uk........', '..kuk..kkkkk', '...kukkhhhhh', '....khhmhhhh', '....khhhhhhh', '....kkkkkkkk', '...kgggggggg', '..kgggreeggg', '..kgggrggggg', '..kggggggggg', '...kgtgtgtgt', '...kkggggggg', '..kbbbkkkkkk', '.kgbbbbbbrbb', 'kggkbbbbrbbb', 'kggkbbbbbbbb', 'kggkbbbbbbbb', '....kbbbbbbb', '....kgggk...', '....kgggk...', '...kkgggk...', '...kkkkkk...']);
Yr('zombie', ['', '........kkkk', '.......kgggg', '......kggggg', '......kgeggg', '......kggggg', '......kgrrrr', '.......kgggg', 'kkkkkkkkcccc', 'kgggggkccccc', 'kkkkkkkcclcc', '.....kcccccc', '.....kcclccc', '.....kcccccc', '.....kbbbbbb', '.....kbbbbbb', '.....kcck...', '.....kggk...', '.....kggk...', '....kkggk...', '....kkkkk...']);
Yr('frostmaw', ['..i.........', '..ik........', '..kik..kkkkk', '...kkkkkllll', '...kllllllll', '..klleelllll', '..klllllllll', '..klltllltll', '..kkllllllll', '.kllllllllll', 'kllllwllllll', 'klklllllwlll', 'klklllllllll', 'kik.klllllll', 'kik.klllllll', '.k..kdllllll', '....kllllk..', '....kllllk..', '...klllllk..', '...kkkkkkk..']);
Yr('emberlord', ['..........oy', '.........oyy', '........koyy', '......kkaaaa', '.....kaaaaaa', '....kaalaaaa', '....kaaaaaaa', '....kakkkkee', '....kaaaaaaa', '...kkkaaaaaa', '..kaaakaaaaa', '.kaalakaaoaa', '.kaaakaaaoaa', '.kaaakaaaaoa', '..kk.kaaaaaa', '..kok.kaaaaa', '.kooo.kaaaaa', '..kok.kaak..', '..k...kaak..', '.....kkaak..', '.....kkkkk..']);
Yr('voidknight', ['', '..........kk', '.........kaa', '.......kkaaa', '......kaaaaa', '.....kalaaaa', '.....kaaaaaa', '.....kakkkee', '.....kaaaaaa', '...kkkaaaaaa', '..kaaakaaaaa', '.kaalakaapaa', '.kaaakaaaapa', '.kaaakaaaaap', '.ks.kkaaaaaa', '.ks..kaaaaaa', '.ks..kaaak..', '.ks..kaaak..', '.k...kaaak..', '....kkaaak..', '....kkkkkk..']);
Yr('morwenna', ['..........kk', '.........khh', '.........khh', '........khhh', '........khhh', '.......khhhp', '..kkkkkkkkkk', '......ksssss', '.....ksessss', '.....kssssss', '.....kssssrr', '......kkssss', '....kppppppp', '...kppplpppp', '..kpsppplppp', '.kpskppppplp', '.kook.pppppp', '.kook.pppppp', '..bk.kpppppp', '..bk.kpppppp', '..bk.kkkkkkk']);
Yr('hollowking', ['......c...c.', '......cc.ccc', '......cycccc', '......kkkkkk', '.....kbbbbbb', '....kbbbbbbb', '....kbkekbbb', '....kbbbbbbb', '....kbbbbkbb', '.....kbkbkbk', '.....kkbbbbb', '..kppppkggkg', '.kppppkggggg', 'kpplppkgkgkg', 'kppppkgggggg', 'kplppkgkgkgg', 'kpppppkggggg', 'kplppppkgggg', 'kppppppkkggg', 'krrrrrrrrkgg', '.kkkkkkkkkkk']);
Yr('gobbo', ['', '', '', '', '', '.........kkk', '........kggg', 'kk.....kgggg', 'kgkk.kgggggg', '.kggkggggggg', '..kggggegggg', '...kgggggggg', '....kggggtgt', '.....kkggggg', '.....kbbbbbb', '....kgkbbbbb', '....kgkbbbbb', '.....kbbbbbb', '......kgk...', '......kkk...']);
Yr('frostling', ['', '', '', '', '....i.......', '....ik......', '.....kkkkkkk', '....klllllll', '...kllllllll', '...kllelllll', '...kllllllll', '...kllllltll', '...kkkllllll', '..kllllllwll', '..klklllllll', '..klklllllll', '...k.kllllll', '.....klllk..', '.....kkkkk..']);
Yr('scarecrow', ['', '.........kkk', '........khhh', '.......khhhh', '..kkkkkkkkkk', '..yy.kssssss', '.....ksessss', '.....ksossss', '.....kssssss', '.....ksseeee', '......kkssss', 'bbbbbbkccccc', 'yykbbkcccrcc', '..y.kccccrcc', '....kcccccrc', '....kccccccr', '....kkcccccc', '......kbk...', '......kbk...', '......kbk...', '......kyk...', '.....yyy....']);
const chick = ['', '', '', '', '', '...........k', '..........k.', '........kkkk', '......kkyyyy', '.....kyyyyyy', '....kyyyyyyy', '....kyyyeyyy', '....kyyyyyoo', '....kyyyyyyo', '...kyyyyyyyy', '..kyykyyyyyy', '..kylkyyyyyy', '...kyyyyyyyy', '....kdyyyyyy', '.....kkddddd', '.......kok..', '......kooo..'];
Yr('toast', chick);
Yr('stormchick', chick.map((r, i) => (i === 5 ? '..........yy' : i === 6 ? '..........y.' : r.replace(/y/g, 'b').replace(/l/g, 'l'))));
Yr('hollowling', ['', '', '', '', '.......c..c.', '.......ccccc', '.......kkkkk', '......kbbbbb', '.....kbbbbbb', '.....kbbebbb', '.....kbbbbbb', '.....kbbbbbb', '.....kbpbbbb', '......kbpbbb', '......kbbpbb', '.......kbbbb', '........kbbk', '.........kk.']);
Yr('bogwisp', ['', '', '', '...........g', '..........gl', '.........kgl', '........kppp', '.......kpppl', '......kpplll', '......kplell', '......kpllll', '......kpplll', '.......kpppl', '........kddp', '.........kdd', '..........kk']);

/* ---------------- Use these sprites everywhere creatures appear ---------------- */
const cache = {};
DQ.spr24Url = (id, over) => {
  const key = id + (over ? JSON.stringify(over) : ''); if (cache[key]) return cache[key]; const s0 = SP[id]; if (!s0) return null; const s = over ? { rows: s0.rows, pal: Object.assign({}, s0.pal, over) } : s0;
  const c = document.createElement('canvas'); c.width = c.height = 24; const x = c.getContext('2d');
  s.rows.forEach((r, j) => { for (let i = 0; i < 24; i++) { const ch = r[i]; if (ch !== '.' && s.pal[ch]) { x.fillStyle = s.pal[ch]; x.fillRect(i, j, 1, 1); } } });
  return (cache[key] = (DQ.hiRes ? DQ.hiRes(c) : c).toDataURL());
};
DQ.spr = (id, size = 48, cls = '') => { if (!SP[id]) return null; size = Math.max(24, Math.round(size / 24) * 24); return `<img class="px px24 ${cls}" src="${DQ.spr24Url(id)}" width="${size}" height="${size}" alt="" draggable="false">`; };
const oldMon = DQ.monSprite, oldPet = DQ.petSprite, oldAni = DQ.animalSprite;
DQ.monSprite = (m, size, cls) => DQ.spr(m.id, size, cls) || oldMon(m, size, cls);
DQ.petSprite = (p, size, cls) => DQ.spr(p.id, size, cls) || oldPet(p, size, cls);
const ANI = { hen: 'chicken', cow: 'cow', sheep: 'sheep', pig: 'pig', goat: 'goat', bees: 'bees' };
DQ.animalSprite = (a, size, cls) => DQ.spr(ANI[a.id], size, cls) || oldAni(a, size, cls);

/* ---------------- Hero, towns and crops at 24x24 ---------------- */
const pad = rows => rows.concat(Array(24).fill('')).slice(0, 24).map(r => (r + '.'.repeat(24)).slice(0, 24));
const F = (id, pal, rows) => M(id, pal, pad(rows));
const Yp = (id, pal, half) => Y(id, pal, half.concat(Array(24).fill('')).slice(0, 24));
const heroTop = ['', '........kkkk', '......kkhhhh', '.....khhhhhh', '....khhhhhhh', '....khhhHhhh', '....khhsssss'];
const helmTop = ['', '........kkkk', '......kkmmmm', '.....kmmmmmm', '....kmnmmmmm', '....kmmmmmmm', '....kMMMMMMM'];
const heroBody = ['....khssssss', '....ksswesss', '....ksssssss', '....kSssssss', '.....kssssrr', '......kSssss', '.......kkSss', '......kkksss', '...kkpppkkkk', '..kppppplppp', '.kpppppllppp', 'kppppppplppp', 'kpppdpppplpp', 'kpppdppppppp', 'kpppdppppppp', 'kppppppppppp', 'kkkkkkkkkkkk'];
Yp('hero', {}, heroTop.concat(heroBody));
Yp('heroHelm', {}, helmTop.concat(heroBody));
/* Skeleton redrawn as one slim skull-and-ribs figure */
Yr('skeleton', ['', '', '.....kkkkkkk', '....kwwwwwww', '....kwwwwwww', '....kweeewww', '....kweerwww', '....kwwwwwwk', '.....kwkwkwk', '......kkkkkk', '..........kw', '....kwwwwwww', '...kwkwwwwww', '...kwkgggggw', '...kwkwwwwww', '...kwkgggggw', '.....kwwwwww', '.....kwwwwww', '.....kwwk...', '.....kwwk...', '.....kwwk...', '....kwwwk...', '....kkkkk...']);
/* People-shaped sprites were drawn too broad. Trim each row in from the sides (keeping the outline and the centre detail)
   so heroes, goblins and bandits read as slim figures instead of wide blocks. */
const slim = (id, maxHalf) => {
  const sp = SP[id]; if (!sp) return;
  sp.rows = sp.rows.map(r => {
    const left = r.slice(0, 12), f = left.search(/[^.]/); if (f < 0) return r;
    const hw = 12 - f, drop = hw - maxHalf; if (drop <= 0) return r;
    const half = '.'.repeat(f + drop) + left[f] + left.slice(f + 1 + drop);
    return half + [...half].reverse().join('');
  });
};
[['hero', 7], ['heroHelm', 7], ['goblin', 7], ['gobbo', 7], ['bandit', 7], ['pirate', 7], ['smuggler', 7], ['raider', 7], ['skeleton', 9],
 ['grubnash', 8], ['zombie', 8], ['morwenna', 8], ['hollowking', 8], ['voidknight', 8], ['scarecrow', 8], ['emberlord', 8]].forEach(([id, w]) => slim(id, w));
const mixc = (h, t, a) => { const P = x => [1, 3, 5].map(i => parseInt(x.slice(i, i + 2), 16)), A = P(h), B = P(t); return '#' + A.map((v, i) => Math.round(v + (B[i] - v) * a).toString(16).padStart(2, '0')).join(''); };
DQ.heroUrl = (look, body, helm) => {
  const pal = { h: look.hair, H: mixc(look.hair, '#000000', .35), s: look.skin, S: mixc(look.skin, '#000000', .18), e: '#120c08', w: '#f4efe4', r: '#a8504a', p: body, l: mixc(body, '#ffffff', .25), d: mixc(body, '#000000', .3) };
  if (helm) Object.assign(pal, { m: helm, M: mixc(helm, '#000000', .35), n: mixc(helm, '#ffffff', .4) });
  return DQ.spr24Url(helm ? 'heroHelm' : 'hero', pal);
};
const G = { g: '#5f9a4a', G: '#3f7a34' };
F('town_willowbrook', Object.assign({ t: '#d8b050', T: '#a8803a', w: '#efe4c8', b: '#6a4428', d: '#8a5a30', y: '#ffe080', c: '#8a7a6a', s: '#c8d0d8' }, G), [
  '................s', '...............s.s', '................s', '..............kck', '.........kkkkkkck', '........kttttttckk', '.......kttTttttttk', '......ktttttttTtttk', '.....kttTttttttttttk', '....ktttttttTtttttttk',
  '...kTTTTTTTTTTTTTTTTTk', '....kwwbwwwwwwwwbwwwk', '....kwwbwkkkwwwwbwwwk', '....kwwbwkyykwwwbwwwk', '....kwwbwkyykwkkkkwwk', '....kbbbbkkkbbkddkbbk', '....kwwbwwwwwwkddkwwk', '....kwwbwwwwwwkddkwwk', '....kwwbwwwwwwkdykwwk', '....kwwbwwwwwwkddkwwk',
  '..gggkkkkkkkkkkkkkkkkgg', '.gGgggggggGgggggggGgggg', '..gggGggggggggGgggggg']);
Yp('town_mossbarrow', Object.assign({ r: '#b8503a', R: '#8a3424', w: '#f4efe4', y: '#e8c860' }, G), ['', '', '..........kk', '.........kRR', '........kRRR', '.......kRRRR', '......kRRRRR', '.....kRRRRRR', '....kRRRRRRR', '...kkkkkkkkk', '....krrrrrrr', '....krrrrkyy', '....krrrrkyy', '....krrrrkkk', '....krrrrrrr', '....krrkkkkk', '....krrkwrrr', '....krrkrwrr', '....krrkrrwr', '....krrkrrrw', '..gggkkkkkkk', '.gGgggggggGg', '..gggGgggggg']);
Yp('town_saltmere', { r: '#d8503a', w: '#f4efe4', y: '#ffe080', s: '#8a949c', S: '#646c74', b: '#3d8aa8', B: '#2a6a88', d: '#6a4428' }, ['', '..........kk', '.........krr', '........kyyy', '........kyyy', '........kkkk', '.........kww', '.........kww', '.........krr', '.........krr', '........kwww', '........kwww', '........krrr', '........krrr', '.......kwwww', '.......kwwwk', '.......krrkd', '.......kwwkd', '.....kkkkkkk', '...kssssssss', '.kssSsssssSs', 'bbbbbbbbbbbb', 'bBbbbbBbbbbb']);
Yp('town_ironpeak', { m: '#7a8794', M: '#565f6a', w: '#f4f7fa', s: '#a8a090', r: '#c83a2a', d: '#6a4428' }, ['', '..........kk', '.........kww', '........kwww', '.......kmwmm', '......kmmmmm', '.....kmmmmmm', '....kmmmmmmm', '...kmmmMmmmm', '..kmmmmmmmmm', '.kmmmkkkkkkk', 'kmmmksssssss', 'kmmmksrkkkkk', 'kmmmksrkdddd', 'kmmmksrkdddd', 'kmmmksskdddd', 'kmmmksskdkdd', 'kmmmksskdddd', 'kmmmksskdddd', 'kmmmkkkkkkkk', 'kMMMMMMMMMMM', '.kkkkkkkkkkk']);
Yp('town_gloomfen', { p: '#5a3a8a', b: '#5a4a3a', g: '#c8ff8a', w: '#1d1a33', W: '#3a3466', y: '#c8ff8a' }, ['', '...........k', '..........kp', '.........kpp', '........kppp', '.......kpppp', '......kppppp', '.....kpppppp', '....kkkkkkkk', '...y.kbbbbbb', '..kyk.kbbkgg', '.....kbbbkgg', '.....kbbbkkk', '.....kbbbbbb', '....kkkkkkkk', '.....kbk...k', '.....kbk...k', '.....kbk...k', '.....kbk...k', 'wwwwwwwwwwww', 'wWwwwwwWwwww']);
Yp('town_emberfall', { a: '#3a2a26', A: '#241816', o: '#ff7a2a', y: '#ffd040' }, ['', '..k.......k.', '..k.......k.', '.kak.....kak', '.kak.....kak', '.kak..kk.kak', '.kaakkaakkaa', '.kaaaaaaaaaa', '.kayaaaayaaa', '.kaaaaaaaaaa', '.kaaaayyaaaa', '.kaaaaaaaaaa', '.kaaaaakkkkk', '.kaaaakooooo', '.kaaaakoyyyy', '.kaaaakoyyyy', '.kaaaakooooo', 'kAAAAAAAAAAA', 'koAAoAAAAoAA', 'oooooooooooo', 'oyooooyooooo']);
Yp('town_skyreach', { w: '#f4f7fa', b: '#5a8ad8', y: '#f0c040', c: '#ffffff', C: '#c8d8e8' }, ['', '...........y', '..........ky', '.........kbb', '........kbbb', '......kkbbbb', '....kkbbbbbb', '..kkbbbbbbbb', '.kyyyyyyyyyy', '...kwwkwwkww', '...kwwkwwkww', '...kwwkwwkww', '...kwwkwwkyy', '...kwwkwwkyy', '...kwwkwwkyy', '..kkkkkkkkkk', '.kyyyyyyyyyy', 'cccccccccccc', 'cCccccCccccc', '.ccccccccccc', '...ccc..cccc']);
Yp('town_hollow', { p: '#5a4880', P: '#3a2e58', y: '#e8c040', e: '#c07aff', d: '#1e1630' }, ['', '.........y.y', '.........yyy', '.........kkk', '.k.k....kppp', '.kkkk...kppp', '.kppk...kpep', '.kppk..kpppp', '.kpekkkkpppp', '.kppppppppPp', '.kpppPpppppp', '.kppppppeppp', '.kpPpppppppp', '.kpppppkkkkk', '.kppppkddddd', '.kppppkddddd', '.kpPppkddddd', '.kppppkddddd', 'kPPPPPPPPPPP', 'kkkkkkkkkkkk']);
const soil = ['.......bbbbbbbbbb', '.....bbBbbBbbBbbBbb', '....bBBBBBBBBBBBBBBBb', '....bBBBBBBBBBBBBBBBb'];
const PL = { g: '#6abf4a', G: '#3a7a34', b: '#7a5230', B: '#4a3220', o: '#e8506a', O: '#ffb0c0' };
F('cplant0', PL, Array(18).fill('').concat(['..........kok']).concat(soil));
F('cplant1', PL, Array(14).fill('').concat(['...........g', '..........gGg', '.........g.G.g', '...........G', '...........G']).concat(soil));
F('cplant2', PL, Array(9).fill('').concat(['...........g', '..........ggg', '.........gGgGg', '.......gg..G..gg', '......gGGg.G.gGGg', '.......gg..G..gg', '.....gg....G....gg', '....gGGg...G...gGGg', '.....gg...gGg...gg', '...........G']).concat(soil));
F('cplant3', PL, Array(6).fill('').concat(['...........g', '..........ggg', '.....oo..gGgGg..oo', '....oOoo...G...oOoo', '....oooo.gGg..oooo', '.....oo..gGg...oo', '.......gg.G..gg', '......gGGgGgGGg', '...oo..gg.G.gg..oo', '..oOoo....G....oOoo', '..oooo...gGg...oooo', '...oo...ggGgg...oo', '..........G']).concat(soil));
DQ.plantSprite = (stage, col, size = 72, cls = '') => { size = Math.max(24, Math.round(size / 24) * 24); return `<img class="px px24 ${cls}" src="${DQ.spr24Url('cplant' + stage, { o: col, O: mixc(col, '#ffffff', .45) })}" width="${size}" height="${size}" alt="" draggable="false">`; };
})();
