/* Lists keep their place (Nov 2026): a page redraw (choosing an item, a tick of progress, a finished task) rebuilds the
   page, which used to throw every scrolling list (shop stock, backpack, bank, recipes, quests) back to the top a
   moment after you picked something. Before each redraw of the same page, the scroll position of every scrolled
   element is noted by its place in the page; afterwards the same element is put back where it was. Changing page
   still starts at the top. Loaded last so it wraps every other renderer. */
(() => {
const DQ = window.DQ, UI = DQ.ui;
const pathOf = (el, root) => { const p = []; while (el && el !== root) { const parent = el.parentElement; if (!parent) return null; p.push([...parent.children].indexOf(el) + ':' + el.tagName + '.' + String(el.className).split(' ')[0]); el = parent; } return el === root ? p.reverse().join('/') : null; };
const find = (root, path) => { let el = root; for (const step of path.split('/')) { const [i, sig] = [parseInt(step, 10), step.slice(step.indexOf(':') + 1)]; el = el && el.children[i]; if (!el || el.tagName + '.' + String(el.className).split(' ')[0] !== sig) return null; } return el; };
const save = () => { const root = document.getElementById('view'); if (!root) return null; const out = [[ '', root.scrollTop ]];
  for (const el of root.querySelectorAll('*')) if (el.scrollTop > 0 && el.scrollHeight > el.clientHeight) { const p = pathOf(el, root); if (p) out.push([p, el.scrollTop]); }
  return out; };
const restore = list => { const root = document.getElementById('view'); if (!root || !list) return; for (const [p, top] of list) { const el = p ? find(root, p) : root; if (el && el.scrollTop !== top) el.scrollTop = top; } };
const render0 = UI.render;
UI.render = (fresh, ...rest) => {
  const same = !fresh || UI.view === lastView, kept = same ? save() : null;
  const r = render0(fresh, ...rest); lastView = UI.view;
  if (kept) { restore(kept); requestAnimationFrame(() => restore(kept)); }
  return r;
};
let lastView = UI.view;
})();
