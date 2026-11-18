/* Lists keep their place (Nov 2026): a page redraw (choosing an item, a tick of progress, a finished task) rebuilds the
   page, which used to throw every scrolling list (shop stock, backpack, bank, recipes, quests) back to the top a
   moment after you picked something. Before each redraw of the same page, the scroll position of every scrolled
   element is noted by its place in the page; afterwards the same element is put back where it was. Changing page
   restores its last position when returning. Loaded after layout renderers. */
(() => {
const DQ = window.DQ, UI = DQ.ui;
const pathOf = (el, root) => { const p = []; while (el && el !== root) { const parent = el.parentElement; if (!parent) return null; p.push([...parent.children].indexOf(el) + ':' + el.tagName + '.' + String(el.className).split(' ')[0]); el = parent; } return el === root ? p.reverse().join('/') : null; };
const find = (root, path) => { let el = root; for (const step of path.split('/')) { const [i, sig] = [parseInt(step, 10), step.slice(step.indexOf(':') + 1)]; el = el && el.children[i]; if (!el || el.tagName + '.' + String(el.className).split(' ')[0] !== sig) return null; } return el; };
const save = () => { const root = document.getElementById('view'); if (!root) return null; const out = [[ '', root.scrollTop, root.scrollLeft ]];
  for (const el of root.querySelectorAll('*')) if (el.scrollTop > 0 || el.scrollLeft > 0) { const p = pathOf(el, root); if (p) out.push([p, el.scrollTop, el.scrollLeft]); }
  return out; };
const restore = list => { const root = document.getElementById('view'); if (!root || !list) return; for (const [p, top, left] of list) { const el = p ? find(root, p) : root; if (el) {el.scrollTop=top;el.scrollLeft=left||0;} } };
const render0 = UI.render, memory=new Map(); let generation=0;
UI.render = (fresh, ...rest) => {
  if(lastView)memory.set(lastView,save());const destination=UI.view,kept=memory.get(destination),token=++generation;
  const r = render0(fresh, ...rest); lastView = UI.view;
  if (kept) { restore(kept); requestAnimationFrame(() => {if(generation===token&&UI.view===destination)restore(kept);}); }
  pan();
  return r;
};
let lastView = UI.view;
/* the village scene pans sideways on narrow screens: keep where the player panned to, or start on the chosen site */
const pan = () => { const el = document.querySelector('#view .village-pan'); if (!el || el.scrollWidth <= el.clientWidth + 2) return;
  el.onscroll = () => { UI.tab.villagePan = el.scrollLeft; };
  if (UI.tab.villagePan != null && UI.view === lastPanView) { el.scrollLeft = UI.tab.villagePan; return; }
  lastPanView = UI.view; const on = el.querySelector('.site-spot.on'); if (on) { const r = on.offsetLeft + on.offsetWidth / 2 - el.clientWidth / 2; el.scrollLeft = Math.max(0, r); UI.tab.villagePan = el.scrollLeft; } };
let lastPanView = null;
})();
