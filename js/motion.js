/* Idlewick: small bits of motion that CSS alone cannot do.
   - the tab you just opened pops
   - numbers in the top bar and skill pages give a springy tick when they change
   - a task card pops when you start it
   - Settings > Reduce effects (and the device's reduce-motion setting) turn all of it off */
(() => {
const DQ = window.DQ, UI = DQ.ui, { $, $$ } = DQ;
const S = () => DQ.S;
const osCalm = () => typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
const calm = () => osCalm() || !!(S() && S().settings && S().settings.reduceFx);
const syncCalm = () => document.documentElement.classList.toggle('calm', !!(S() && S().settings && S().settings.reduceFx));
const SPRING = 'cubic-bezier(.34,1.56,.64,1)';

/* the tab you opened pops (only on real navigation, never on quiet refreshes) */
let lastView = null;
const render0 = UI.render;
UI.render = fresh => {
  render0(fresh); syncCalm();
  if (fresh && UI.view !== lastView && lastView !== null && !calm()) $$('#rail .hub.on, #subnav .stab.on').forEach(e => { e.classList.add('pop'); setTimeout(() => e.classList.remove('pop'), 900); });
  lastView = UI.view;
};

/* a value that changes (not one that is merely drawn) gives a tick */
const TICK = /^(coins|adv|combat|packchip|totlvl|lvl:.+)$/, lastTick = new WeakMap();
const tick = el => {
  const now = performance.now(); if (now - (lastTick.get(el) || 0) < 300) return; lastTick.set(el, now);
  el.classList.add('tickable');
  try { el.animate([{ transform: 'scale(1.3)' }, { transform: 'scale(1)' }], { duration: 520, easing: SPRING }); } catch (e) {}
};
const start = () => {
  const app = document.getElementById('app'); if (!app || typeof MutationObserver !== 'function') return;
  new MutationObserver(ms => {
    if (calm()) return; const seen = new Set();
    for (const m of ms) {
      const t = m.target, el = t.nodeType === 3 ? t.parentElement : t;
      if (!el || !el.dataset || !el.dataset.b || seen.has(el) || !TICK.test(el.dataset.b)) continue;
      /* only a real change counts: some binders rewrite the same text every tick */
      const before = m.type === 'characterData' ? m.oldValue : [...m.removedNodes].filter(n => n.nodeType === 3).map(n => n.textContent).join('');
      if (!before || before === el.textContent) continue; seen.add(el); tick(el);
    }
  }).observe(app, { childList: true, characterData: true, characterDataOldValue: true, subtree: true });
};
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();

/* starting a task: its card and the top-bar task give a little pop */
DQ.on('act', () => {
  if (calm() || !DQ.act) return;
  setTimeout(() => { [$('.card.active'), $('.h-task:not(.idle)')].forEach(c => { if (!c) return; c.classList.remove('popnow'); void c.offsetWidth; c.classList.add('popnow'); setTimeout(() => c.classList.remove('popnow'), 700); }); }, 180);
});
})();
