/* Idlewick: small moments of feedback that reward what you just did. Reuses the existing float text, particles
   and motion settings; nothing here runs in forecasts, offline replay, or under reduced motion. */
(() => {
const DQ = window.DQ, D = DQ.data, UI = DQ.ui, { $ } = DQ;
const calm = () => (DQ.S && DQ.S.settings.reduceFx) || (typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches);
const quiet = () => DQ.forecasting || (DQ.sim && DQ.sim.on) || !DQ.started;

/* equipping an upgrade: say what got better, right where you are looking */
const equip0 = DQ.equipItem;
DQ.equipItem = id => {
  if (quiet()) return equip0(id);
  const before = DQ.pstats(), defBefore = DQ.bonus().def || 0, r = equip0(id);
  if (r && r.ok) {
    const after = DQ.pstats(), def = (DQ.bonus().def || 0) - defBefore, hit = (after.max || 0) - (before.max || 0), parts = [];
    if (hit > 0) parts.push(`+${hit} max hit`); if (def > 0) parts.push(`+${def} defence`);
    if (parts.length) setTimeout(() => { const at = $('.fig-img') || $('.eq') || $('#hud'); DQ.floatAt(at, parts.join(' · '), '#7ed69a'); }, 120);
  }
  return r;
};

/* finishing a restoration: a burst from the card and a warm glow on the town scene */
DQ.on('project', () => {
  if (quiet() || calm()) return;
  setTimeout(() => {
    const card = $('#notes .note[data-key^="project:"] .n-ic'); if (card) DQ.burstEl(card, '#f3d58a', 26);
    document.querySelectorAll('.town-projects .scene, .town-projects img').forEach(el => { el.classList.remove('just-restored'); void el.offsetWidth; el.classList.add('just-restored'); });
  }, 200);
});
})();
