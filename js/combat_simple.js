/* Simple Combat page: only the fight, your fighting style and the creatures to fight are on screen.
   Everything else (combat skills, abilities, food, the selected creature's preparation, the boss and loot) opens from one
   row of buttons as a live pop-up: the full panel is still drawn by the page (hidden), and the pop-up re-reads it after
   every change, so buttons inside it (train, equip abilities, eat settings, challenge) work and update in place. */
(() => {
  const DQ = window.DQ, UI = DQ.ui, { esc, ico } = DQ;
  const POPS = [
    { key: 'skills', label: 'Combat skills', ic: 'attack', title: 'Combat skills', from: '.combat-col .fighter', badge: () => DQ.combatLvl() },
    { key: 'abilities', label: 'Abilities', ic: 'star', title: 'Abilities', from: '.combat-col .abilp' },
    { key: 'food', label: 'Food', ic: 'heart', title: 'Food', from: '.combat-col .combat-supplies' },
    { key: 'prep', label: 'Prepare', ic: 'info', title: 'Preparation', from: '.combat-side .battle-brief' },
    { key: 'boss', label: 'Boss', ic: 'trophy', title: 'Boss', from: '.combat-side .bosscard' },
    { key: 'loot', label: 'Loot', ic: 'bag', title: 'Loot', from: '.combat-side .lootp' },
  ];
  const byKey = k => POPS.find(p => p.key === k);
  let open = null;
  const bodyOf = key => { const el = document.querySelector('#view ' + byKey(key).from); return el ? `<div class="combat-pop">${el.outerHTML}</div>` : ''; };
  const refresh = () => {
    if (!open) return; const m = document.querySelector('.modal[data-more]');
    if (!m) { open = null; return; }
    if (!document.querySelector('#view .combat-dashboard')) { open = null; DQ.closeModal(); return; }
    const b = m.querySelector('.m-body'), html = bodyOf(open); if (b && html) { b.innerHTML = html; UI.upd && UI.upd(); }
  };
  UI.DO.combatmore = key => {
    const p = byKey(key); if (!p) return; const html = bodyOf(key); if (!html) return;
    const m = DQ.modal({ title: p.title, body: html, wide: true });
    m.dataset.more = key; open = key; UI.upd && UI.upd();
  };
  const addBar = () => {
    const dash = document.querySelector('#view .combat-dashboard'); if (!dash || dash.querySelector('.combat-tools')) return;
    const strip = dash.querySelector('.combat-live .style-strip'); if (!strip) return;
    const btns = POPS.filter(p => dash.querySelector(p.from)).map(p => { const b = p.badge && p.badge(); return `<button class="ct-btn" data-do="combatmore" data-a="${p.key}" data-tip="text:${esc(p.title)}">${ico(p.ic)}<span>${esc(p.label)}</span>${b != null ? `<b class="mono">${b}</b>` : ''}</button>`; }).join('');
    strip.insertAdjacentHTML('afterend', `<nav class="combat-tools" aria-label="More combat options">${btns}</nav>`);
  };
  const render = UI.render;
  UI.render = fresh => { render(fresh); addBar(); refresh(); };
})();
