/* Simple Combat page: only the fight, your fighting style and the creatures to fight are on screen.
   Everything else (combat skills, abilities, food, the selected creature's preparation, the boss and loot) opens from one
   row of buttons as a live pop-up: the full panel is still drawn by the page (hidden), and the pop-up re-reads it after
   every change, so buttons inside it (train, equip abilities, eat settings, challenge) work and update in place. */
(() => {
  const DQ = window.DQ, UI = DQ.ui, { esc, ico } = DQ;
  /* Each button shows its key state, so most checks need no click: the danger of the creature you are looking at,
     how much food you carry and whether auto-eat is on, how many ability slots are filled, how many gear slots are
     worn, and whether the boss is within reach. A warning tone marks the one that needs attention. */
  const S = () => DQ.S, D = DQ.data;
  const foodHeal = () => (DQ.foods ? DQ.foods() : []).reduce((n, id) => n + DQ.have(id) * (D.ITEMS[id].heal || 0), 0);
  const focus = () => DQ.combatFocus && DQ.combatFocus();
  const bossOf = () => (D.MONLIST || []).find(m => m.boss && m.town === S().town);
  const POPS = [
    { key: 'prep', label: 'Prepare', ic: 'info', title: 'Preparation', from: '.combat-side .battle-brief',
      badge: () => { const m = focus(), d = m && DQ.dangerOf ? DQ.dangerOf(m) : null; return d ? { t: d.label, tone: d.key === 'easy' ? 'ok' : d.key === 'deadly' || d.key === 'hard' ? 'bad' : 'warn' } : null; } },
    { key: 'gear', label: 'Equipment', ic: 'bag', title: 'Equipment', go: 'character',
      badge: () => { const slots = ['head', 'body', 'legs', 'shield', 'weapon', 'amulet', 'ring'], n = slots.filter(k => S().equip[k]).length; return { t: `${n}/${slots.length} worn`, tone: n < 4 ? 'warn' : '' }; } },
    { key: 'food', label: 'Food', ic: 'heart', title: 'Food', from: '.combat-col .combat-supplies',
      badge: () => { const h = foodHeal(); return { t: h ? `${h} health${S().settings.autoEat ? ' · auto' : ''}` : 'None', tone: h ? '' : 'bad' }; } },
    { key: 'abilities', label: 'Abilities', ic: 'star', title: 'Abilities', from: '.combat-col .abilp',
      badge: () => { const n = (S().abilities || []).length, m = DQ.abilSlots ? DQ.abilSlots() : 0; return m ? { t: `${n}/${m}`, tone: n < m && D.ABIL.some(a => DQ.abilUnlocked(a) && !(S().abilities || []).includes(a.id)) ? 'warn' : '' } : null; } },
    { key: 'skills', label: 'Combat skills', ic: 'attack', title: 'Combat skills', from: '.combat-col .fighter', badge: () => ({ t: 'Lv ' + DQ.combatLvl() }) },
    { key: 'boss', label: 'Boss', ic: 'trophy', title: 'Boss', from: '.combat-side .bosscard',
      badge: () => { const b = bossOf(); if (!b) return null; const done = !!(S().towns && S().towns[S().town] && S().towns[S().town].boss), ok = DQ.combatLvl() >= b.boss.req; return done ? { t: 'Defeated' } : { t: ok ? 'Ready' : `Combat ${b.boss.req}`, tone: ok ? 'ok' : '' }; } },
    { key: 'loot', label: 'Loot', ic: 'pouch', title: 'Loot', from: '.combat-side .lootp' },
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
    const p = byKey(key); if (!p) return; if (p.go) { DQ.go(p.go); return; } const html = bodyOf(key); if (!html) return;
    const m = DQ.modal({ title: p.title, body: html, wide: true });
    m.dataset.more = key; open = key; UI.upd && UI.upd();
  };
  const addBar = () => {
    const dash = document.querySelector('#view .combat-dashboard'); if (!dash || dash.querySelector('.combat-tools')) return;
    const strip = dash.querySelector('.combat-live .style-strip'); if (!strip) return;
    const btns = POPS.filter(p => p.go || dash.querySelector(p.from)).map(p => { let b = null; try { b = p.badge && p.badge(); } catch (e) { b = null; } return `<button class="ct-btn ${b && b.tone ? 'tone-' + b.tone : ''}" data-do="combatmore" data-a="${p.key}" aria-label="${esc(p.label)}${b ? ': ' + esc(b.t) : ''}">${ico(p.ic)}<span class="ct-l"><span>${esc(p.label)}</span>${b ? `<small>${esc(b.t)}</small>` : ''}</span></button>`; }).join('');
    strip.insertAdjacentHTML('afterend', `<nav class="combat-tools" aria-label="More combat options">${btns}</nav>`);
  };
  const render = UI.render;
  UI.render = fresh => { render(fresh); addBar(); refresh(); };
})();
