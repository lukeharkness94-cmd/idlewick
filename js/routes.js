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
    if (nodes.length) { const n = nodes.find(x => x.town === S().town) || nodes[0]; return { kind, id: n.id, page: PAGE[kind], skill: n.skill, lvl: n.lvl, town: n.town, name: n.name }; }
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
  const town = src.town && src.town !== S().town ? ` in ${D.TOWN[src.town].name}` : '';
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
})();
