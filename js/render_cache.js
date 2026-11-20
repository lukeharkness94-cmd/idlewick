/* Idlewick: per-draw memory for expensive lookups (20 Nov 2026 review).
   A single page draw asked DQ.sourceOf ("where can I get this item?") thousands of times for a few dozen items, and
   DQ.questRecipeCandidates hundreds of times for three objectives; Smithing took ~190 ms to draw instead of ~45.
   Both answers depend only on game data and the current save, and nothing changes the save while a page is being
   drawn, so each answer is remembered for the duration of one UI.render call and forgotten afterwards. Outside a draw
   (ticks, tooltips, actions) the original functions run unchanged. Loaded after every other render wrapper. */
(() => {
const DQ = window.DQ, UI = DQ.ui;
let depth = 0;
const caches = [];
const remember = (name, keyOf, copy) => {
  const f = DQ[name]; if (typeof f !== 'function') return;
  const memo = new Map(); caches.push(memo);
  DQ[name] = (...a) => {
    if (!depth) return f(...a);
    const k = keyOf(...a); if (k === null) return f(...a);
    if (!memo.has(k)) memo.set(k, f(...a));
    const v = memo.get(k);
    return copy && Array.isArray(v) ? v.slice() : v;
  };
};
remember('sourceOf', id => typeof id === 'string' ? id : null, false);
remember('questRecipeCandidates', o => o && typeof o === 'object' ? `${o.ev}|${o.key}|${o.n > 1 ? 'n' : '1'}` : null, true);
const clear = () => caches.forEach(m => m.clear());
const render0 = UI.render;
UI.render = (...a) => {
  if (!depth) clear();
  depth++;
  try { return render0(...a); } finally { depth--; if (!depth) clear(); }
};
})();
