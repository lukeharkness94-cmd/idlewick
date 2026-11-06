/* node tests/art-pixel.cjs — the code-drawn pixel art, checked without a browser.
   Every id the game can ask for has a finished design; sprites are deterministic, sized to the style guide and lit
   with coloured (never flat black) outlines; no two items are pixel-identical; fish and trees differ in silhouette;
   and no image files or painted-art scripts remain. Node built-ins only. */
const assert = require('node:assert/strict'), fs = require('node:fs'), vm = require('node:vm'), path = require('node:path');
const root = path.join(__dirname, '..');
const el = () => ({ setAttribute() {}, classList: { add() {}, remove() {}, toggle() {} }, appendChild() {}, style: {}, querySelector() {}, querySelectorAll: () => [], addEventListener() {}, getContext: () => null });
const ctx = vm.createContext({ console, Math, Date, JSON, performance: { now: () => 0 }, setTimeout: () => 0, setInterval: () => 0, clearTimeout() {}, addEventListener() {}, matchMedia: () => ({ matches: false }), innerWidth: 1200, innerHeight: 800,
  localStorage: { getItem: () => null, setItem() {}, removeItem() {} }, document: { querySelector: () => null, querySelectorAll: () => [], getElementById: () => null, createElement: el, body: el(), head: el(), addEventListener() {} } });
ctx.window = ctx;
const load = n => vm.runInContext(fs.readFileSync(path.join(root, 'js', n + '.js'), 'utf8'), ctx, { filename: n });
['util', 'data', 'creatures_expanded', 'skill_expansion_data', 'data2', 'data3', 'economy', 'state'].forEach(load);
const Q = ctx.DQ; Q.ui = { V: {}, DO: {}, B: {}, homeSections: [] };
['journey', 'adventures', 'pixelart', 'pixel_items', 'pixel_creatures', 'pixel_world'].forEach(n => { try { load(n); } catch (e) { if (n.startsWith('pixel')) throw e; } });
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
  for (const id of Object.keys(Q.ICONS || {})) if (!A.iconSprite(id)) miss.push('ui-icon:' + id); /* no interface glyph falls back to line art */
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
console.log(checks + ' pixel-art checks passed');
