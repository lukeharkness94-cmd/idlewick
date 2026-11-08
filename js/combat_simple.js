/* Simple Combat page: the fight, your fighting style with each combat skill's level and progress on it, your ability
   slots and your food are on screen, beside the creatures to fight (Nov 2026: what you act on is never hidden).
   Reference detail (combat level breakdown, the full and future ability list, the selected creature's preparation, the
   boss and loot) opens from buttons as a live pop-up: the full panel is still drawn by the page (hidden), and the
   pop-up re-reads it after every change, so buttons inside it work and update in place. */
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
    { key: 'food', label: 'Food', bar: false, ic: 'heart', title: 'Food', from: '.combat-col .combat-supplies',
      badge: () => { const h = foodHeal(); return { t: h ? `${h} health${S().settings.autoEat ? ' · auto' : ''}` : 'None', tone: h ? '' : 'bad' }; } },
    { key: 'abilities', label: 'Abilities', bar: false, ic: 'star', title: 'Abilities', from: '.combat-col .abilp',
      badge: () => { const n = (S().abilities || []).length, m = DQ.abilSlots ? DQ.abilSlots() : 0; return m ? { t: `${n}/${m}`, tone: n < m && D.ABIL.some(a => DQ.abilUnlocked(a) && !(S().abilities || []).includes(a.id)) ? 'warn' : '' } : null; } },
    { key: 'skills', label: 'Combat skills', bar: false, ic: 'attack', title: 'Combat skills', from: '.combat-col .fighter', badge: () => ({ t: 'Lv ' + DQ.combatLvl() }) },
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
  /* Layout (Nov 2026, after "abilities are a small scroll at the bottom"): abilities get a full-height panel beside the
     fight, at eye level with your hero, so they never shrink into a scrolling strip; the fighting style (with the
     combat skills) runs under both; food takes the last row and the reference buttons head the creatures column. */
  const addBar = () => {
    const dash = document.querySelector('#view .combat-dashboard'); if (!dash || dash.querySelector('.combat-tools')) return;
    const strip = dash.querySelector('.combat-live .style-strip'), arena = dash.querySelector('.combat-live .encounter-arena'); if (!strip) return;
    const btns = POPS.filter(p => p.bar !== false && (p.go || dash.querySelector(p.from))).map(p => { let b = null; try { b = p.badge && p.badge(); } catch (e) { b = null; } return `<button class="ct-btn ${b && b.tone ? 'tone-' + b.tone : ''}" data-do="combatmore" data-a="${p.key}" aria-label="${esc(p.label)}${b ? ': ' + esc(b.t) : ''}">${ico(p.ic)}<span class="ct-l"><span>${esc(p.label)}</span>${b ? `<small>${esc(b.t)}</small>` : ''}</span></button>`; }).join('');
    if (arena) { const row = document.createElement('div'); row.className = 'fight-row'; arena.before(row); row.appendChild(arena); row.insertAdjacentHTML('beforeend', abilPanel()); }
    else strip.insertAdjacentHTML('afterend', abilPanel());
    strip.insertAdjacentHTML('afterend', `<div class="kit-bottom">${foodPanel(dash)}</div>`);
    /* the reference buttons (preparation, equipment, boss, loot) head the creatures column: they are about whom to fight */
    const tg = dash.querySelector('.combat-targets'), tools = `<nav class="combat-tools" aria-label="More combat options">${btns}</nav>`;
    if (tg) tg.insertAdjacentHTML('afterbegin', tools); else strip.insertAdjacentHTML('afterend', tools);
    /* "Selected: creature · Explore" belongs with the creatures you pick from, which frees the left column for you */
    const ctl = dash.querySelector('.combat-live > .arena-ctl'), tools2 = tg && tg.querySelector('.combat-tools'); if (ctl && tools2) tools2.after(ctl);
  };
  /* abilities: each slot, and the abilities you can put in one, as buttons right under the fighting style; food: what
     you carry (click to eat), auto-eat and when to eat, cloned from the page's own food panel */
  const abilPanel = () => {
    const on = S().abilities || [], slots = DQ.abilSlots ? DQ.abilSlots() : 0, ready = D.ABIL.filter(a => DQ.abilUnlocked(a)), spare = ready.filter(a => !on.includes(a.id));
    const next = D.ABIL.filter(a => !DQ.abilUnlocked(a)).sort((x, y) => (x.lvl - DQ.lvl(x.skill)) - (y.lvl - DQ.lvl(y.skill)))[0];
    const why = a => DQ.ability(a.id) ? 'In use' : a.needShield && !S().equip.shield ? 'Needs a shield' : a.style ? `${DQ.cap(a.style)} only` : 'Idle';
    const slotHtml = Array.from({ length: slots }, (_, i) => { const a = D.ABIL.find(x => x.id === on[i]);
      return a ? `<button class="kit-abil on ${DQ.ability(a.id) ? '' : 'idle'}" data-do="abil" data-a="${a.id}" aria-pressed="true" data-tip="text:${esc(a.name)}: ${esc(a.text)} Click to take it out of the slot.">${ico(a.ic)}<span><b>${esc(a.name)}</b><small>${esc(why(a))} · remove</small></span></button>`
        : `<span class="kit-abil empty">${ico('star')}<span><b>Empty slot</b><small>${spare.length ? 'Pick an ability below' : next ? `Next at ${esc(D.SK[next.skill].name)} ${next.lvl}` : ''}</small></span></span>`; }).join('');
    const full = on.length >= slots, adds = spare.map(a => `<button class="kit-add" data-do="${full ? 'abilswap' : 'abil'}" data-a="${a.id}" data-tip="text:${esc(a.name)}: ${esc(a.text)}${full ? ' Replaces your last slot.' : ''}">${ico(a.ic)}<span>${esc(a.name)}</span></button>`).join('');
    return `<section class="panel combat-abils"><div class="kit-head"><span class="k">Abilities <b class="mono">${on.length}/${slots}</b></span><button class="linkish" data-do="combatmore" data-a="abilities">All abilities</button></div>
      <div class="kit-slots">${slotHtml}</div>${adds ? `<div class="kit-sub">${full ? 'Swap in (replaces your last slot)' : 'Add to a slot'}</div><div class="kit-adds">${adds}</div>` : ''}</section>`;
  };
  const foodPanel = dash => {
    const sup = dash.querySelector('.combat-col .combat-supplies'), food = sup ? sup.cloneNode(true) : null;
    if (food) { food.querySelectorAll('[id]').forEach(e => e.removeAttribute('id')); const h = food.querySelector('h2'); if (h) h.outerHTML = '<span class="k">Food</span>'; }
    return `<section class="panel combat-food">${food ? food.innerHTML : '<span class="k">Food</span><p class="dim sm">No food carried.</p>'}</section>`;
  };
  UI.DO.abilswap = id => { const on = S().abilities || []; if (on.length >= DQ.abilSlots()) DQ.toggleAbility(on[on.length - 1]); if (DQ.toggleAbility(id)) DQ.sfx && DQ.sfx('equip'); UI.render(false); };
  const render = UI.render;
  UI.render = fresh => { render(fresh); addBar(); refresh(); };
})();
