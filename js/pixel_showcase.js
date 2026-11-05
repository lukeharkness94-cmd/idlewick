/* Idlewick: the pixel-art showcase. Every representative sprite at the size players actually see it, in the current
   theme, with the hero's idle and work animations and a combat lunge. Open it from Settings (Art showcase). */
(() => {
const DQ = window.DQ, UI = DQ.ui, A = DQ.pixelArt; if (!A) return;
const fig = (u, w, h, k, label) => `<figure class="pxs-fig"><img class="pxa" src="${u}" width="${w * k}" height="${h * k}" alt="${label}"><figcaption>${label}<small>${w}×${h} at ${k}×</small></figcaption></figure>`;
const group = (title, body) => `<section class="panel pxs-group"><div class="phead"><h2>${title}</h2></div><div class="pxs-row">${body}</div></section>`;
UI.V.showcase = () => {
  const faces = DQ.HERO_FACES.map((f, i) => fig(A.heroUrl({ face: f, skin: i, hair: [1, 3, 0][i], tunic: ['#3f7fbf', '#b8503f', '#4a9a6a'][i] }), 24, 32, 4, `Face: ${f}`)).join('');
  const kitted = [
    ['Bronze, sword', { face: 'bright', skin: 3, hair: 4, tunic: '#8a5fbf', helm: 'bronze', body: 'bronze', weapon: 'sword' }],
    ['Ranger, bow', { face: 'freckled', skin: 0, hair: 2, tunic: '#4a5a66', weapon: 'bow' }]
  ].map(([l, o]) => fig(A.heroUrl(o), 24, 32, 4, l)).join('');
  const anim = `<figure class="pxs-fig"><span class="pxs-anim idle">${[0, 1].map(f => `<img class="pxa" src="${A.heroUrl({ face: 'bright', skin: 1, hair: 1 })}" width="96" height="128" alt="">`).join('')}</span><figcaption>Idle breathing<small>2 frames</small></figcaption></figure>
    <figure class="pxs-fig"><span class="pxs-anim work">${[0, 1, 2].map(f => `<img class="pxa" src="${A.heroUrl({ face: 'bright', skin: 1, hair: 1, pose: 'work', frame: f, weapon: 'axe' })}" width="96" height="128" alt="">`).join('')}</span><figcaption>Chopping<small>3 frames, stepped</small></figcaption></figure>
    <figure class="pxs-fig"><span class="pxs-fight"><img class="pxa hero" src="${A.heroUrl({ face: 'bearded', skin: 2, hair: 0, tunic: '#4a9a6a', weapon: 'sword', helm: 'iron' })}" width="96" height="128" alt=""><img class="pxa foe" src="${A.sprite('goblin')}" width="96" height="96" alt=""></span><figcaption>Combat: lunge and hit<small>whole-sprite motion with a hit flash</small></figcaption></figure>`;
  return `<section class="panel pxs-head"><div class="phead"><h2>Pixel-art showcase</h2><small>Internal prototype review · shown at in-game sizes</small></div>
      <p class="dim">The representative set every later sprite follows. Light comes from the top left; every material uses a five-step ramp with violet-leaning shadows and warm highlights; outlines take a darker shade of the material they touch. Sprites are shown at whole-number scales so every pixel stays crisp.</p></section>
    ${group('Hero: three faces', faces + kitted)}
    ${group('Animation', anim)}
    ${group('Creatures: three anatomies', ['chicken', 'goblin', 'wolf'].map(n => fig(A.sprite(n), 32, 32, 3, n)).join(''))}
    ${group('Trees and fish', ['oak', 'pine'].map(n => fig(A.sprite(n), 32, 48, 3, n)).join('') + ['pike', 'carp'].map(n => fig(A.sprite(n), 32, 16, 3, n)).join(''))}
    ${group('Equipment and resources (inventory size)', [['sword', 'Bronze sword'], ['bow', 'Shortbow'], ['platebody', 'Bronze platebody'], ['ore', 'Copper ore'], ['log', 'Logs'], ['gem', 'Sapphire'], ['potato', 'Potato']].map(([n, l]) => fig(A.sprite(n), 16, 16, 3, l)).join(''))}
    ${group('Skill icons', [['iconFishing', 'Fishing'], ['iconWoodcutting', 'Woodcutting'], ['iconMining', 'Mining']].map(([n, l]) => fig(A.sprite(n), 16, 16, 3, l) + fig(A.sprite(n), 16, 16, 2, l + ' (menu)')).join(''))}
    ${group('Village', fig(A.sprite('cottage'), 48, 40, 3, 'Cottage') + fig(A.sceneUrl(), 160, 90, 3, 'Willowbrook scene'))}`;
};
/* a link from Settings */
const settings0 = UI.V.settings;
/* its own category in the Settings picker */
if (settings0) UI.V.settings = () => settings0() + `<section class="panel"><div class="phead"><h2>Art showcase</h2></div><p class="dim">The pixel-art style guide in action: the hero, creatures, items and village at their real sizes.</p><button class="btn" data-do="go" data-a="showcase">Open the art showcase</button></section>`;
})();
