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
['journey', 'adventures', 'pixelart', 'pixel_items', 'pixel_creatures', 'pixel_roster', 'pixel_hunt', 'pixel_world', 'skills_new_art', 'beastmastery_art', 'pixel_items_armour'].forEach(n => { try { load(n); } catch (e) { if (n.startsWith('pixel')) throw e; } });
['journey', 'adventures', 'pixelart', 'pixel_items', 'pixel_creatures', 'pixel_roster', 'pixel_hunt', 'pixel_world', 'skills_new_art', 'beastmastery_art', 'pixel_items_weapons'].forEach(n => { try { load(n); } catch (e) { if (n.startsWith('pixel')) throw e; } });
['journey', 'adventures', 'pixelart', 'pixel_items', 'pixel_creatures', 'pixel_roster', 'pixel_hunt', 'pixel_world', 'skills_new_art', 'beastmastery_art', 'pixel_items_materials'].forEach(n => { try { load(n); } catch (e) { if (n.startsWith('pixel')) throw e; } });
['journey', 'adventures', 'pixelart', 'pixel_items', 'pixel_creatures', 'pixel_roster', 'pixel_hunt', 'pixel_world', 'skills_new_art', 'beastmastery_art', 'pixel_items_food'].forEach(n => { try { load(n); } catch (e) { if (n.startsWith('pixel')) throw e; } });
['journey', 'adventures', 'pixelart', 'pixel_items', 'pixel_creatures', 'pixel_roster', 'pixel_hunt', 'pixel_world', 'skills_new_art', 'beastmastery_art', 'pixel_icons'].forEach(n => { try { load(n); } catch (e) { if (n.startsWith('pixel')) throw e; } });
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
