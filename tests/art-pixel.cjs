/* node tests/art-pixel.cjs — the code-drawn pixel art, checked without a browser.
   Every id the game can ask for has a finished design; sprites are deterministic, sized to the style guide and lit
   with coloured (never flat black) outlines; no two items are pixel-identical; fish and trees differ in silhouette;
   and no image files or painted-art scripts remain. Node built-ins only. */
const assert = require('node:assert/strict'), fs = require('node:fs'), vm = require('node:vm'), path = require('node:path');
const root = path.join(__dirname, '..');
const el = () => ({ setAttribute() {}, classList: { add() {}, remove() {}, toggle() {} }, appendChild() {}, style: {}, querySelector() {}, querySelectorAll: () => [], addEventListener() {}, getContext: () => null });
const ctx = vm.createContext({ console, Math, Date, JSON, performance: { now: () => 0 }, setTimeout: () => 0, setInterval: () => 0, clearTimeout() {}, addEventListener() {}, matchMedia: () => ({ matches: false }), innerWidth: 1200, innerHeight: 800,
  localStorage: { getItem: () => null, setItem() {}, removeItem() {} }, document: { querySelector: () => null, querySelectorAll: () => [], getElementById: () => null, createElement: el, body: el(), head: el(), addEventListener() {} } });
ctx.window = ctx;ctx.__IDLEWICK_INTEGRATION_TEST__=true;
const load = n => vm.runInContext(fs.readFileSync(path.join(root, 'js', n + '.js'), 'utf8'), ctx, { filename: n });
['util', 'data', 'creatures_expanded', 'creature_roster', 'hunt_tiers_data', 'skill_expansion_data', 'data2', 'data3', 'economy', 'skills_new_data', 'beastmastery_data', 'hunting_loop_data', 'crosslinks_data', 'state', 'rare_weapons'].forEach(load); /* the 29 named weapons must look different too (27 Nov 2026) */
const Q = ctx.DQ; Q.ui = { V: {}, DO: {}, B: {}, homeSections: [] };
['journey', 'adventures', 'pixelart', 'pixel_items', 'pixel_creatures', 'pixel_roster', 'pixel_hunt', 'pixel_world', 'pixel_icons', 'skills_new_art', 'beastmastery_art', 'pixel_items_armour', 'pixel_items_weapons', 'pixel_items_materials', 'pixel_items_food', 'pixel_items_hunt', 'pixel_nodes', 'pixel_bosses', 'pixel_minibosses', 'pixel_views', 'pixel_hand_1'].forEach(n => { try { load(n); } catch (e) { if (n.startsWith('pixel')) throw e; } });
const A = Q.pixelArt, D = Q.data;
let checks = 0; const check = (name, fn) => { fn(); checks++; console.log('PASS', name); };
const colours = spr => spr.render();

check('every item, creature, companion, townsperson, animal, fishing spot, tree, rock, town, skill and crop stage has a design', () => {
  const miss = [];
  for (const id of Object.keys(D.ITEMS)) if (!A.itemSprite(id)) miss.push('item:' + id);
  for (const m of D.MONLIST) if (!A.hasCreature(m.id)) miss.push('creature:' + m.id);
  for (const p of D.PETS || []) if (!A.hasCreature(p.id)) miss.push('pet:' + p.id);
  for (const n of D.NODES.thieve) if (!A.hasCreature(n.id)) miss.push('townsfolk:' + n.id);
  for (const a of D.ANIMALS) if (!A.hasCreature(a.id)) miss.push('animal:' + a.id);
  for (const n of D.NODES.fish) if (!A.fishLarge(n.id)) miss.push('fish:' + n.id);
  for (const n of D.NODES.wood) if (!A.TREE[n.id]) miss.push('tree:' + n.id);
  for (const n of D.NODES.mine) if (!A.ORE[n.id]) miss.push('rock:' + n.id);
  for (const t of D.TOWNS) if (!A.TOWN[t.id]) miss.push('scene:' + t.id);
  for (const s of D.SKILLS) if (!A.iconSprite(s.id)) miss.push('icon:' + s.id);
  for (const id of Object.keys(Q.ICONS || {})) if (!A.iconSprite(id)) miss.push('ui-icon:' + id);
  for (const m of D.MONLIST.filter(x => x.boss)) { const t = A.trophySprite(m.id); if (!t || t.w !== 40 || t.h !== 44) miss.push('trophy:' + m.id); } /* no interface glyph falls back to line art */
  for (const c of D.CROPS) for (let st = 0; st <= 3; st++) if (!A.plantStage(st, c.id)) miss.push('plant:' + c.id + st);
  for (const p of Object.keys(D.PROJECTS)) for (const done of [false, true]) if (!A.piece(p, done)) miss.push('project:' + p);
  assert.deepEqual(miss, []);
});
check('sprites follow the style guide sizes and are deterministic', () => {
  for (const id of Object.keys(D.ITEMS)) { const s = A.itemSprite(id); assert.equal(s.w, 16); assert.equal(s.h, 16); assert.deepEqual(colours(s), colours(A.itemSprite(id)), id + ' renders the same every time'); }
  for (const m of D.MONLIST) { const s = A.creatureSprite(m.id); assert.equal(s.w, 32); assert.equal(s.h, 32); }
  for (const n of D.NODES.wood) { const s = A.treeSprite(n.id); assert.equal(s.w, 32); assert.equal(s.h, 48); }
  const h = A.hero({}); assert.equal(h.w, 24); assert.equal(h.h, 32);
});
check('no two items are pixel-identical, and no sprite is empty', () => {
  const seen = new Map();
  for (const id of Object.keys(D.ITEMS)) { const key = colours(A.itemSprite(id)).join(','), filled = colours(A.itemSprite(id)).filter(Boolean).length;
    assert.ok(filled >= 20, id + ' has a real drawing'); assert.ok(!seen.has(key), `${id} is identical to ${seen.get(key)}`); seen.set(key, id); }
});
check('fish and trees differ in silhouette, not just colour', () => {
  const mask = s => s.render().map(Boolean).join('');
  const fish = D.NODES.fish.map(n => mask(A.fishLarge(n.id))), trees = D.NODES.wood.map(n => mask(A.treeSprite(n.id)));
  assert.equal(new Set(fish).size, fish.length, 'every fish has its own outline'); assert.equal(new Set(trees).size, trees.length, 'every tree has its own outline');
});
check('every weapon and bundle of arrows is drawn in the chunky style, and each tier of a family has its own shape', () => {
  /* 28 Nov 2026: js/pixel_items_weapons.js redraws them; tiers differ by guard, pommel, head or limb, not only colour */
  const W = A.weaponArt; assert.ok(W, 'js/pixel_items_weapons.js is loaded');
  const ids = Object.values(D.ITEMS).filter(it => it.slot === 'weapon' || it.slot === 'ammo').map(it => it.id);
  assert.deepEqual(ids.filter(id => !W[id]), [], 'every weapon and ammo id has its drawing in js/pixel_items_weapons.js');
  const mask = id => A.itemSprite(id).render().map(Boolean).join(''), tiers = D.TIERS.map(t => t.id), woods = ['normal', 'oak', 'willow', 'maple', 'yew', 'magic', 'elder'];
  for (const fam of [tiers.map(t => t + '_sword'), tiers.map(t => t + '_dagger'), tiers.map(t => t + '_hammer'), tiers.map(t => 'arrow_' + t), woods.map(w => 'bow_' + w), woods.map(w => 'staff_' + w)])
    assert.equal(new Set(fam.map(mask)).size, fam.length, fam[0] + ' and its family: every tier has its own silhouette');
  for (const id of (D.RARE_WEAPONS || [])) assert.ok(!ids.filter(o => o !== id).some(o => mask(o) === mask(id)), id + ' has a silhouette of its own');
});
check('outlines are coloured shades of their material, never flat black', () => {
  for (const id of ['bronze_sword', 'gem_ruby', 'log_oak', 'raw_pike']) for (const c of colours(A.itemSprite(id)).filter(Boolean)) assert.notEqual(c, '#000000');
  const r = A.ramp('#c58a52'); assert.notEqual(r.out, '#000000'); assert.ok(r.lo !== r.base && r.hi !== r.base && r.gl !== r.hi, 'five distinct steps');
});
check('the hero has three distinct faces and fits every equipment type', () => {
  const faces = Q.HERO_FACES.map(face => colours(A.hero({ face })).join(',')); assert.equal(new Set(faces).size, 3);
  const plain = colours(A.hero({})).join(',');
  for (const o of [{ helm: { type: 'helm', col: '#c58a5a' } }, { helm: { type: 'coif', col: '#b08a5e' } }, { helm: { type: 'hood', col: '#7f8cff' } }, { body: { type: 'robe', col: '#5f93df' } }, { legs: { type: 'chaps', col: '#b08a5e' } }, { shield: { col: '#9aa3ad' } }, { weapon: { type: 'bow', col: '#a07a4f' } }, { weapon: { type: 'staff', col: '#a07a4f' } }])
    assert.notEqual(colours(A.hero(o)).join(','), plain, JSON.stringify(o) + ' changes the hero');
  /* an open helmet leaves the eyes visible */
  const helmed = A.hero({ helm: { type: 'helm', col: '#c58a5a' } }).render(); assert.equal(helmed[9 * 24 + 9], '#2a1c1f'); assert.equal(helmed[9 * 24 + 14], '#2a1c1f');
});
check('no image files or painted-art scripts remain', () => {
  assert.ok(!fs.existsSync(path.join(root, 'assets/painted')) && !fs.existsSync(path.join(root, 'assets/art-completion')));
  const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8'); assert.ok(!/art_painted|painted_runtime|art_completion/.test(html)); assert.ok(/pixel_runtime\.js/.test(html));
  for (const f of fs.readdirSync(path.join(root, 'js'))) { const src = fs.readFileSync(path.join(root, 'js', f), 'utf8'); assert.ok(!/assets\/(painted|art-completion)/.test(src), f + ' references a removed image'); }
});
check('interface icons, skill emblems and trophies are the chunky outlined drawings, each its own', () => {
  /* 28 Nov 2026: js/pixel_icons.js redraws the 16 x 16 icons, the 32 x 32 emblems and the trophy plaques. Every one keeps
     a pixel of margin so its outline shows, and no two skills (or the five places along the top) share a picture. */
  const shape = s => s.px.map(Boolean), edge = s => { const m = shape(s); for (let i = 0; i < s.w; i++) if (m[i] || m[(s.h - 1) * s.w + i] || m[i * s.w] || m[i * s.w + s.w - 1]) return true; return false; };
  const tight = [];
  for (const id of Object.keys(A.ICONS2)) { const s = A.iconSprite(id); assert.equal(s.w, 16); if (edge(s)) tight.push('icon:' + id); assert.ok(s.render().filter(Boolean).length >= 20, id + ' icon is a real drawing'); }
  for (const id of Object.keys(A.EMBLEM2)) { const s = A.emblemSprite(id); assert.equal(s.w, 32); if (edge(s)) tight.push('emblem:' + id); }
  assert.deepEqual(tight, [], 'every icon and emblem leaves a pixel for its outline');
  const key = s => s.render().join(','), skills = D.SKILLS.map(s => s.id);
  assert.equal(new Set(skills.map(id => key(A.iconSprite(id)))).size, skills.length, 'every skill icon is different');
  assert.equal(new Set(skills.map(id => key(A.emblemSprite(id)))).size, skills.length, 'every skill emblem is different');
  assert.equal(new Set(['home', 'skills', 'quest', 'house', 'book'].map(id => key(A.iconSprite(id)))).size, 5, 'the five places along the top each have their own icon');
  assert.ok('skills' in Q.ICONS, 'the Skills place has its icon id');
  for (const m of D.MONLIST.filter(x => x.boss)) assert.notEqual(key(A.trophySprite(m.id, false)), key(A.trophySprite(m.id, true)), m.id + ' gilded trophy differs');
});
check('every ordinary creature has a front view and a side view, and the two are different drawings', () => {
  /* owner, 28 Nov 2026: a front view for menus and guides, a side view (facing right) for fights, hunts and captures.
     js/pixel_views.js draws the missing view for every builder; the 28 with their own 64 x 64 art are drawn elsewhere. */
  const mask = s => s.render().map(Boolean).join(''), scope = D.MONLIST.filter(A.viewScope), bad = [];
  /* 28 Nov 2026: the hunting ground is 40 real animals and the 160 old ground animals left the game, so ~115 creatures */
  assert.ok(scope.length >= 110, 'creatures in scope: ' + scope.length);
  assert.ok(!scope.some(m => A.BIG[m.id] || (m.mini && !/^tw_[a-z]+_\d$/.test(m.id))), 'bosses, mini-bosses and tower bosses keep their own drawings');
  for (const m of scope) { const f = A.VIEWS.front[m.id], sd = A.VIEWS.side[m.id];
    if (!f || !sd) { bad.push(m.id + ' missing a view'); continue; }
    const a = f(), b = sd(); if (!a || !b || a.w !== 32 || a.h !== 32 || b.w !== 32 || b.h !== 32) { bad.push(m.id + ' size'); continue; }
    if (mask(a) === mask(b)) bad.push(m.id + ' front and side share a silhouette');
    if (a.render().filter(Boolean).length < 60 || b.render().filter(Boolean).length < 60) bad.push(m.id + ' empty view');
    assert.deepEqual(a.render(), f().render(), m.id + ' front view is deterministic'); }
  assert.deepEqual(bad, []);
  /* creatures that share no drawing on purpose (tower floors reuse their base creature) never share a view */
  for (const v of ['front', 'side']) { const seen = new Map();
    for (const m of scope.filter(m => !/^tw_/.test(m.id))) { const k = A.VIEWS[v][m.id]().render().join(','); assert.ok(!seen.has(k), `${m.id} ${v} view is identical to ${seen.get(k)}`); seen.set(k, m.id); } }
  /* the 30 mythical beasts of Beastmastery (not creatures you fight) have both views too, each its own drawing */
  const myths = D.MYTHS || []; assert.equal(myths.length, 30);
  for (const v of ['front', 'side']) { const seen = new Map();
    for (const m of [...scope.filter(m => !/^tw_/.test(m.id)), ...myths]) { const f = A.VIEWS[v][m.id]; assert.ok(f, m.id + ' has a ' + v + ' view'); const k = f().render().join(','); assert.ok(!seen.has(k), `${m.id} ${v} view is identical to ${seen.get(k)}`); seen.set(k, m.id); } }
  for (const m of myths) { const a = A.VIEWS.front[m.id](), b = A.VIEWS.side[m.id](); assert.notEqual(mask(a), mask(b), m.id + ' front and side differ'); assert.ok(a.render().filter(Boolean).length >= 60, m.id + ' front not empty'); }
  /* tower floor creatures keep a 64 x 64 drawing in both views */
  for (const m of scope.filter(m => /^tw_[a-z]+_\d$/.test(m.id))) for (const v of ['front', 'side']) { const s = A.BIG_VIEWS[v][m.id] && A.BIG_VIEWS[v][m.id](); assert.ok(s && s.w === 64, m.id + ' ' + v + ' large view'); }
  /* no view leaves the old drawing's extras floating: the side view of a humanoid holds its weapon forward (right half) */
  const right = s => { const r = s.render(); let n = 0; for (let y = 0; y < 32; y++) for (let x = 27; x < 32; x++) if (r[y * 32 + x]) n++; return n; };
  assert.ok(right(A.VIEWS.side.pirate()) > right(A.VIEWS.front.pirate()), 'the pirate turns to face right with the cutlass out front');
});
check('the Willowbrook and Mossbarrow creatures are hand-designed in both views, standing on the ground line', () => {
  /* owner, 28 Nov 2026: every creature gets the bosses' level of thought. js/pixel_hand_1.js draws these by hand with the
     bosses' painter; they replace the builder views, and each stands with its feet on row 29 like the rest of the stage
     (a flier may hover). The Mudling and Goblin raider are added by villains.js, which this test does not load. */
  const ids = [...new Set(D.MONLIST.filter(m => ['willowbrook', 'mossbarrow'].includes(m.town) && !m.boss && !m.mini && !m.tower && !m.hl).map(m => m.id).concat(['mudling', 'goblin_raider']))], bad = [];
  assert.ok(A.HAND && ids.length >= 21, 'batch: ' + ids.length);
  for (const id of ids) for (const v of ['front', 'side']) { const f = A.VIEWS[v][id]; if (!f || !f.hand) { bad.push(id + ' ' + v + ' not hand-drawn'); continue; }
    const s = f(), r = s.render(); let low = -1; for (let i = 0; i < r.length; i++) if (r[i] && !(s.fixed && s.fixed.has(i))) low = Math.max(low, Math.floor(i / 32));
    if (!f.flies && (low < 29 || low > 30)) bad.push(`${id} ${v} lowest row ${low}`); }
  assert.deepEqual(bad, []);
});
check('new beasts and evolved forms have distinct structural silhouettes', () => {
 const keys=[];for(const id of Object.keys(D.BEAST_SPECIES)){const a=A.creatureSprite(id),b=A.creatureSprite('evolved:'+id);assert.ok(a&&b);assert.notEqual(a.render().map(Boolean).join(''),b.render().map(Boolean).join(''),id+' evolved shape');keys.push(a.render().join(','),b.render().join(','));}assert.equal(new Set(keys).size,8);
});
check('tools, materials, kit, relics, boats and draughts use the chunky set, and no tool tier is a recolour of another', () => {
  const scope = Object.entries(D.ITEMS).filter(([id, it]) => ['tool', 'resource', 'gem', 'craft', 'relic', 'container', 'boat', 'potion', 'supply'].includes(it.type) || (it.type === 'junk' && id !== 'burnt'));
  assert.ok(scope.length > 150); for (const [id] of scope) assert.ok(A.materialItem(id), id + ' is drawn by pixel_items_materials.js');
  /* a recolour keeps the same pattern of colours: relabel each sprite's colours by first appearance and compare */
  const pattern = id => { const seen = new Map(); return colours(A.itemSprite(id)).map(c => c ? (seen.has(c) ? seen.get(c) : (seen.set(c, seen.size), seen.size - 1)) : '.').join(','); };
  for (const fam of ['rod', 'axe', 'pick', 'gloves', 'hoe']) { const ids = D.TOOL_ORDER.map(t => `tool_${fam}_${t}`); assert.equal(ids.filter(id => D.ITEMS[id]).length, 10, fam);
    { const P = ids.map(pattern); P.forEach((p, i) => { const j = P.indexOf(p); if (j !== i) console.log('same pattern', ids[i], ids[j]); }); } assert.equal(new Set(ids.map(pattern)).size, 10, fam + ': every tier has its own detail, not only its own metal'); }
  for (const pre of ['log_', 'ore_', 'bar_']) { const ids = Object.keys(D.ITEMS).filter(id => id.startsWith(pre)); assert.equal(new Set(ids.map(pattern)).size, ids.length, pre + ' items differ beyond colour'); }
});
console.log(checks + ' pixel-art checks passed');
