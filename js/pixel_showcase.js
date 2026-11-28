/* Idlewick: the pixel-art showcase, the living reference for docs/pixel-art-style.md. Every family of sprite at the
   size players see it: the chibi hero in three looks and in gear, the side-on working figure, creatures from every
   family, the bosses at 64 x 64, items by category and the named weapons. Open it from Settings (Art showcase). */
(() => {
const DQ = window.DQ, UI = DQ.ui, A = DQ.pixelArt; if (!A) return;
const fig = (u, w, h, k, label) => u ? `<figure class="pxs-fig"><img class="pxa" src="${u}" width="${w * k}" height="${h * k}" alt="${label}"><figcaption>${label}<small>${w}×${h} at ${k}×</small></figcaption></figure>` : '';
const group = (title, body) => `<section class="panel pxs-group"><div class="phead"><h2>${title}</h2></div><div class="pxs-row">${body}</div></section>`;
const D = () => DQ.data;
UI.V.showcase = () => {
  const faces = DQ.HERO_FACES.map((f, i) => fig(A.heroUrl({ face: f, skin: i, hair: [1, 3, 0][i], tunic: ['#3f7fbf', '#b8503f', '#4a9a6a'][i] }), 24, 32, 4, `Face: ${f}`)).join('');
  const kitted = [
    ['Iron, sword and shield', { face: 'bright', skin: 1, hair: 1, helm: { type: 'helm', col: '#9aa3ad' }, body: { type: 'plate', col: '#9aa3ad' }, legs: { type: 'plate', col: '#9aa3ad' }, shield: { col: '#9aa3ad' }, weapon: { type: 'sword', col: '#cdd5dc' } }],
    ['Ranger, bow', { face: 'freckled', skin: 0, hair: 2, helm: { type: 'coif', col: '#9a6a42' }, body: { type: 'vest', col: '#9a6a42' }, legs: { type: 'chaps', col: '#9a6a42' }, weapon: { type: 'bow', col: '#a07a4f' }, cape: '#3f6a3a' }],
    ['Mage, staff', { face: 'bearded', skin: 3, hair: 4, helm: { type: 'hood', col: '#5a3a8a' }, body: { type: 'robe', col: '#5a3a8a' }, legs: { type: 'robe', col: '#5a3a8a' }, weapon: { type: 'staff', col: '#8a6a4a', orb: '#8fc0ff' } }]
  ].map(([l, o]) => fig(A.heroUrl(o), 24, 32, 4, l)).join('');
  const side = ['stand', 'crouch', 'kneel', 'sit'].map(p => fig(A.heroSideUrl({ posture: p }), 24, 32, 3, 'At work: ' + p)).join('');
  const anim = `<figure class="pxs-fig"><span class="pxs-anim idle">${[null, 'blink'].map(f => `<img class="pxa" src="${A.heroUrl({ face: 'bright', skin: 1, hair: 1, expr: f })}" width="96" height="128" alt="">`).join('')}</span><figcaption>Idle: blink<small>2 frames</small></figcaption></figure>
    <figure class="pxs-fig"><span class="pxs-fight"><img class="pxa hero" src="${A.heroUrl({ face: 'bearded', skin: 2, hair: 0, tunic: '#4a9a6a', weapon: 'sword', helm: 'iron' })}" width="96" height="128" alt=""><img class="pxa foe" src="${A.sprite('goblin')}" width="96" height="96" alt=""></span><figcaption>Combat: lunge and hit<small>whole-sprite motion with a hit flash</small></figcaption></figure>`;
  const families = ['goblin', 'skeleton', 'zombie', 'wraith', 'pirate', 'raider', 'troll', 'wolf', 'boar', 'icewolf', 'bat', 'crab', 'drake', 'hawk', 'golem', 'horror', 'cinderloom', 'furnacemite', 'snowcoil', 'kelplantern', 'tattercap', 'rootbound', 'chicken', 'cow']
    .filter(id => A.hasCreature(id)).map(id => fig(A.creatureUrl(id), 32, 32, 3, (D().MON[id] || {}).name || id)).join('');
  const bosses = Object.keys(A.BIG || {}).map(id => fig(A.creatureBigUrl(id), 64, 64, 2, (D().MON[id] || {}).name || id)).join('');
  const minis = (D().MONLIST || []).filter(m => m.mini).slice(0, 4).map(m => fig(A.creatureBigUrl(m.id), 64, 64, 2, m.name)).join('');
  const items = ['bronze_sword', 'iron_body', 'iron_helm', 'bow_oak', 'ore_copper', 'bar_iron', 'log_oak', 'gem_ruby', 'raw_pike', 'pike', 'baked_potato', 'tool_pick_1', 'ring_ruby', 'amulet_sapphire', 'robe_mystic_body']
    .filter(id => D().ITEMS[id]).map(id => fig(A.itemUrl(id), 16, 16, 3, D().ITEMS[id].name)).join('');
  const named = Object.keys(D().ITEMS).filter(id => D().ITEMS[id].unique).slice(0, 8).map(id => fig(A.itemUrl(id), 16, 16, 3, D().ITEMS[id].name)).join('');
  return `<section class="panel pxs-head"><div class="phead"><h2>Pixel-art showcase</h2><small>The style guide · shown at in-game sizes</small></div>
      <p class="dim">Chunky, outlined pixel art drawn in code. Light comes from the top left; every material is a five-step ramp whose shadows lean cool and lights lean warm; round forms are lit as spheres; every silhouette is outlined in its own material's darkest colour. Sprites are shown at whole-number scales so every pixel stays crisp.</p></section>
    ${group('Hero: three faces', faces + kitted)}
    ${group('The hero at work (side-on, the work rig draws the arms and tool)', side)}
    ${group('Animation', anim)}
    ${group('Creatures: one of each family', families)}
    ${group('Bosses (64 × 64)', bosses + minis)}
    ${group('Items (inventory size)', items + named)}
    ${group('Trees and fish', ['oak', 'pine'].map(n => fig(A.sprite(n), 32, 48, 3, n)).join('') + ['pike', 'carp'].map(n => fig(A.sprite(n), 32, 16, 3, n)).join(''))}
    ${group('Skill icons', [['iconFishing', 'Fishing'], ['iconWoodcutting', 'Woodcutting'], ['iconMining', 'Mining']].map(([n, l]) => fig(A.sprite(n), 16, 16, 3, l) + fig(A.sprite(n), 16, 16, 2, l + ' (menu)')).join(''))}`;
};
/* a link from Settings */
const settings0 = UI.V.settings;
/* its own category in the Settings picker */
if (settings0) UI.V.settings = () => settings0() + `<section class="panel"><div class="phead"><h2>Art showcase</h2></div><p class="dim">The pixel-art style guide in action: the hero, creatures, bosses and items at their real sizes.</p><button class="btn" data-do="go" data-a="showcase">Open the art showcase</button></section>`;
})();
