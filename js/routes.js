/* Idlewick: contextual routes. When something you need is missing, a small button takes you to where it comes from
   (the fishing spot, tree, rock, recipe, field, creature or shop), with the right card already selected. A slim
   "Back to …" bar returns you to where you were. Routes respect unlocks: a locked skill opens its explanation page. */
(() => {
const DQ = window.DQ, D = DQ.data, UI = DQ.ui, { $, esc, ico } = DQ;
const S = () => DQ.S;
const PAGE = { fish: 'fishing', wood: 'woodcutting', mine: 'mining', thieve: 'thieving' };
const VERB = { fish: 'Fish', wood: 'Chop', mine: 'Mine', thieve: 'Steal', recipe: 'Make', farm: 'Grow', animal: 'Raise', fight: 'Hunt', shop: 'Buy' };

/* Where an item comes from, cheapest/earliest source first. Null when it has no single obvious source. */
DQ.sourceOf = id => {
  const it = D.ITEMS[id]; if (!it) return null;
  for (const kind of ['fish', 'wood', 'mine', 'thieve']) {
    const nodes = (D.NODES[kind] || []).filter(n => n.item === id).sort((a, b) => a.lvl - b.lvl);
    if (nodes.length) { const n = nodes.find(x => DQ.nodeHere(x)) || nodes[0]; return { kind, id: n.id, page: PAGE[kind], skill: n.skill, lvl: n.lvl, town: n.town, name: n.name }; }
  }
  if (id.startsWith('crop_')) return { kind: 'farm', page: 'farming', skill: 'farming', name: it.name };
  const animal = (D.ANIMALS || []).find(a => a.prod === id); if (animal) return { kind: 'animal', page: 'farming', skill: 'farming', name: animal.name };
  const recipe = Object.values(D.RECIPES || {}).filter(r => r.out && r.out[id]).sort((a, b) => a.lvl - b.lvl)[0];
  if (recipe) return { kind: 'recipe', id: recipe.id, page: D.SK[recipe.skill].page, skill: recipe.skill, lvl: recipe.lvl, name: recipe.name };
  const shops = Object.entries(D.SHOPS || {}).filter(([, list]) => list.includes(id)).map(([town]) => town);
  if (shops.length) return { kind: 'shop', page: 'shop', town: shops.includes(S().town) ? S().town : shops[0], name: 'Shop' };
  const mon = D.MONLIST.filter(m => !m.boss && (m.drops || []).some(d => d[0] === id)).sort((a, b) => a.cl - b.cl)[0];
  if (mon) return { kind: 'fight', id: mon.id, page: 'combat', town: mon.town, name: mon.name };
  return null;
};
const where = src => {
  const town = src.town && src.town !== S().town && !(src.kind !== 'shop' && D.NODE && DQ.nodeHere(D.NODE[src.kind + ':' + src.id])) ? ` in ${D.TOWN[src.town].name}` : '';
  const lvl = src.skill && src.lvl > 1 ? ` (${D.SK[src.skill].name} ${src.lvl})` : '';
  return `${src.name}${lvl}${town}`;
};
/* a compact button beside anything you are short of */
UI.routeChip = id => {
  const src = DQ.sourceOf(id); if (!src) return '';
  const locked = src.skill && !DQ.skillUnlocked(src.skill);
  return `<button class="route-chip" data-do="route" data-a="${id}" data-tip="text:${esc((locked ? 'Locked: ' : 'Get it from ') + where(src))}" aria-label="${esc(`${VERB[src.kind]} ${D.ITEMS[id].name}: ${where(src)}`)}">${esc(VERB[src.kind])} ${ico('arrow')}</button>`;
};

/* follow a route, remembering where you came from */
const titleOf = page => (D.SK[page] && D.SK[page].name) || ({ overview: 'Home', projects: 'Town projects', research: 'Scholarship', character: 'Inventory', quests: 'Quests', combat: 'Combat', brewery: 'Brewery', enchanting: 'Enchanting', shop: 'Shop', map: 'Map' })[page] || 'previous page';
UI.returnTo = null;
const go = page => { DQ.go(page); };
Object.assign(UI.DO, {
  route: id => {
    const src = DQ.sourceOf(id); if (!src) return;
    if (UI.view !== src.page) UI.returnTo = { page: UI.view, label: titleOf(UI.view) };
    if (src.kind === 'shop' && src.town !== S().town) DQ.toast(`${D.ITEMS[id].name} is sold in ${D.TOWN[src.town].name}`);
    if (src.id && ['fish', 'wood', 'mine', 'thieve', 'recipe', 'fight'].includes(src.kind)) UI.taskChoice[src.page] = src.id;
    go(src.page);
  },
  routeback: () => { const r = UI.returnTo; UI.returnTo = null; if (r) go(r.page); else UI.render(false); },
  routeclose: () => { UI.returnTo = null; UI.render(false); }
});
const render0 = UI.render;
UI.render = fresh => {
  render0(fresh);
  const r = UI.returnTo; if (!r) return;
  if (r.page === UI.view) { UI.returnTo = null; return; }
  const view = $('#view'); if (!view || view.querySelector('.returnbar')) return;
  view.insertAdjacentHTML('afterbegin', `<div class="returnbar" role="navigation" aria-label="Return"><button class="btn sm" data-do="routeback">${ico('arrow')}<span>Back to ${esc(r.label)}</span></button><button class="n-x" data-do="routeclose" aria-label="Dismiss">${ico('close')}</button></div>`);
};
/* moving through the main menus is a fresh start, not a detour */
const hub0 = UI.DO.hub; if (hub0) UI.DO.hub = (...a) => { UI.returnTo = null; return hub0(...a); };

/* ---------- What a material is for ----------
   Built from the real recipes, village projects and quests, so it never goes stale. Shown in the item detail panel,
   the backpack selection bar and tooltips (not on the inventory cards themselves), with one route to a recipe that uses it. */
const usesCache = new Map();
const TAB_USE = { Bars: 'bars', Weapons: 'weapons', Armour: 'armour', Leather: 'leather armour', Bows: 'bows', Staves: 'staves', Arrows: 'ammunition', Jewellery: 'jewellery', Potions: 'potions' };
DQ.itemUses = id => {
  if (usesCache.has(id)) return usesCache.get(id);
  const out = [], recipes = Object.values(D.RECIPES || {}).filter(r => r.in && r.in[id]).sort((a, b) => a.lvl - b.lvl);
  const bySkill = {};
  recipes.forEach(r => { const k = D.SK[r.skill] ? D.SK[r.skill].name : r.skill; (bySkill[k] = bySkill[k] || new Set()).add(TAB_USE[r.tab] || (r.skill === 'cooking' ? 'meals' : (r.tab || '').toLowerCase())); });
  Object.entries(bySkill).forEach(([k, set]) => out.push(`${k} (${[...set].filter(Boolean).slice(0, 3).join(', ')})`));
  if ((D.CROPS || []).some(c => 'seed_' + c.id === id)) out.push('Farming (planting)');
  const it = D.ITEMS[id]; if (it && it.heal) out.push(`Eating (heals ${it.heal})`);
  if (id === 'rune') out.push('Magic (spell runes)');
  const proj = Object.values(D.PROJECTS || {}).filter(p => p.cost && p.cost[id]); if (proj.length) out.push(`Restoration (${proj.slice(0, 2).map(p => p.name.toLowerCase()).join(', ')})`);
  const quests = (D.QUESTS || []).filter(q => q.obj.some(o => o.ev === 'deliver' && o.key === id)); if (quests.length) out.push(`Quests (${quests.length})`);
  const r = { list: out, recipe: recipes.find(r => DQ.skillUnlocked(r.skill)) || recipes[0] || null };
  usesCache.set(id, r); return r;
};
const usesLine = id => { const u = DQ.itemUses(id); return u.list.length ? `Used for: ${u.list.join(' · ')}` : ''; };
const tip0 = DQ.tips.item;
DQ.tips.item = id => { const h = tip0(id), line = usesLine(id); return h && line ? h + `<div class="uses">${esc(line)}</div>` : h; };
const detail1 = UI.detail;
UI.detail = (id, from) => {
  const h = detail1(id, from), it = id && D.ITEMS[id]; if (!it || it.slot) return h;
  const u = DQ.itemUses(id), line = usesLine(id); if (!line) return h;
  const r = u.recipe, go = r ? `<button class="btn sm" data-do="userecipe" data-a="${r.id}">${ico('arrow')} ${esc(D.SK[r.skill].name)}: ${esc(r.name)}</button>` : '';
  return h.replace(/<\/div>\s*$/, `<p class="item-uses">${esc(line)}</p>${go}</div>`);
};
UI.DO.userecipe = id => { const r = D.RECIPES[id]; if (!r) return; UI.returnTo = { page: UI.view, label: titleOf(UI.view) }; UI.focusTask ? UI.focusTask(D.SK[r.skill].page, r.id, r.tab, r.skill) : go(D.SK[r.skill].page); };
})();
