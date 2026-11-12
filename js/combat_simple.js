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
  /* Layout D (Nov 2026, chosen by the player from four concepts): 1 Choose on the left (areas and creatures, the boss
     at the foot); on the right 2 a one-line Ready check (danger, food, gear, with Details and Loot), 3 the fight as
     the biggest thing on screen, and under it one action bar: Train (each style with its skill level), Abilities
     (slots and every ability you can slot) and Food. The stage gives way on small screens, never the action bar. */
  const dashHas = sel => !!document.querySelector('#view .combat-dashboard ' + sel);
  const readyLine = (tight = false) => {
    const m = focus(), d = m && DQ.dangerOf ? DQ.dangerOf(m) : null, heal = foodHeal(), slots = ['head', 'body', 'legs', 'shield', 'weapon', 'amulet', 'ring'], worn = slots.filter(k => S().equip[k]).length;
    const ok = d && d.key === 'easy' && heal > 0, t = ok ? 'ok' : d && d.key !== 'easy' && d.key !== 'fair' ? 'bad' : 'warn';
    const nm = m && (DQ.act && DQ.act.kind === 'fight' && DQ.act.id === m.id || (S().beast.kills[m.id] || 0) > 0) ? m.name : 'unknown creature';
    const head = !m ? 'Choose a creature' : tight ? `${ok ? 'Ready' : d && d.key !== 'easy' ? 'Careful' : 'Not ready'}: ${esc(nm)}` : `${ok ? 'Ready for' : d && d.key !== 'easy' ? 'Careful with' : 'Not ready for'} ${esc(nm)}`;
    const item = (good, text) => `<span class="rl-i ${good ? 'ok' : 'warn'}">${good ? '✓' : '!'} ${text}</span>`;
    return `<div class="ready-line tone-${t}">${tight ? '' : '<span class="step-n">2</span>'}<b class="rl-head">${head}</b>${d ? item(d.key === 'easy', esc(d.label)) : ''}${item(heal > 0, heal ? (tight ? `Food ${heal} hp` : `Food ${heal} health${S().settings.autoEat ? ' · auto-eat' : ''}`) : 'No food')}<button class="rl-i ${worn < 4 ? 'warn' : 'ok'}" data-do="go" data-a="character">${worn < 4 ? '!' : '✓'} Gear ${worn}/${slots.length}${tight ? '' : ' worn'}</button><span class="rl-tools"><button class="btn sm" data-do="pagehelp" aria-label="How to use Combat" data-tip="text:How to use Combat">${ico('book')}${tight ? '' : 'Guide'}</button>${dashHas('.combat-side .battle-brief') ? `<button class="btn sm" data-do="combatmore" data-a="prep" aria-label="Preparation details" data-tip="text:Preparation details">${ico('info')}${tight ? '' : 'Details'}</button>` : ''}${dashHas('.combat-side .lootp') ? `<button class="btn sm" data-do="combatmore" data-a="loot">${ico('pouch')}Loot</button>` : ''}</span></div>`;
  };
  const bossBtn = () => { const b = bossOf(), p = byKey('boss'); if (!b || !dashHas(p.from)) return ''; let bg = null; try { bg = p.badge(); } catch (e) { bg = null; }
    return `<button class="boss-foot ${bg && bg.tone ? 'tone-' + bg.tone : ''}" data-do="combatmore" data-a="boss">${ico('trophy')}<span><b>Boss: ${esc(b.name)}</b><small>${esc(bg ? bg.t : '')}</small></span><span class="bf-go">${bg && bg.t === 'Defeated' ? 'Details' : 'Challenge'}</span></button>`; };
  const addBar = () => {
    const dash = document.querySelector('#view .combat-dashboard'); if (!dash || dash.dataset.d) return;
    const live = dash.querySelector('.combat-live'), strip = live && live.querySelector('.style-strip'), arena = live && live.querySelector('.encounter-arena'), ctl = live && live.querySelector('.arena-ctl'), tg = dash.querySelector('.combat-targets');
    if (!live || !strip) return; dash.dataset.d = '1'; dash.classList.add('combat-d');
    if (tg) { tg.insertAdjacentHTML('afterbegin', '<div class="step-h"><span class="step-n">1</span>Choose</div>'); tg.insertAdjacentHTML('beforeend', bossBtn()); }
    const tight = /\b(short|lw-1600)\b/.test(document.documentElement.className) && innerWidth > 860;
    live.insertAdjacentHTML('afterbegin', readyLine(tight));
    /* on shorter or narrower desktops the fight's own line (Fighting … / Retreat, or Selected … / Explore) joins the
       ready line so the stage keeps its height for the fighters */
    if (arena && ctl) { ctl.classList.add('stage-ctl'); ctl.insertAdjacentHTML('afterbegin', '<span class="step-n on">3</span>'); if (tight) { if (!ctl.querySelector('button')) { ctl.remove(); } else { const n = ctl.querySelector('.step-n'); if (n) n.remove(); ctl.classList.add('in-ready'); live.querySelector('.ready-line').appendChild(ctl); } arena.classList.add('no-ctl'); } else arena.appendChild(ctl); }
    strip.insertAdjacentHTML('beforebegin', `<div class="combat-hud"><section class="panel hud-train"><div class="kit-head"><span class="k">Train</span></div></section>${foodPanel()}${abilPanel()}</div>`);
    const train = live.querySelector('.hud-train'); train.appendChild(strip);
    const w = strip.querySelector('.ss-weapon'); if (w) train.querySelector('.kit-head').appendChild(w);
  };
  const abilPanel = () => {
    const on = S().abilities || [], slots = DQ.abilSlots ? DQ.abilSlots() : 0, ready = D.ABIL.filter(a => DQ.abilUnlocked(a)), spare = ready.filter(a => !on.includes(a.id));
    const next = D.ABIL.filter(a => !DQ.abilUnlocked(a)).sort((x, y) => (x.lvl - DQ.lvl(x.skill)) - (y.lvl - DQ.lvl(y.skill)))[0];
    const why = a => DQ.ability(a.id) ? 'In use' : a.needShield && !S().equip.shield ? 'Needs a shield' : a.style ? `${DQ.cap(a.style)} only` : 'Idle';
    const slotHtml = Array.from({ length: slots }, (_, i) => { const a = D.ABIL.find(x => x.id === on[i]);
      return a ? `<button class="ab-tile on ${DQ.ability(a.id) ? '' : 'idle'}" data-do="abil" data-a="${a.id}" aria-pressed="true" data-tip="text:${esc(a.name)}: ${esc(a.text)} Click to take it out of the slot.">${ico(a.ic)}<b>${esc(a.name)}</b><small>${esc(why(a))}</small></button>`
        : `<button class="ab-tile empty" data-do="combatmore" data-a="abilities" aria-label="Choose ability for slot ${i+1}">${ico('star')}<b>Empty</b><small>${spare.length ? 'Choose an ability' : 'Slot ' + (i + 1)}</small></button>`; }).join('');
    const nextSlot = slots < 3 ? `<small class="ab-future-slot">Third slot · Combat 40</small>` : '';
    const nxt = next ? (() => { const need = D.XPF[next.lvl] || 1, have = S().xp[next.skill] || 0; return `<div class="ab-next"><span>${ready.length ? 'Next' : 'First ability'}: <b>${esc(next.name)}</b> at ${esc(D.SK[next.skill].name)} ${next.lvl}</span><span class="bar"><i style="width:${Math.min(100, Math.round(have / need * 100))}%"></i></span></div>`; })() : '';
    return `<section class="panel combat-abils"><div class="kit-head"><span class="k">Abilities <b class="mono">${on.length}/${slots}</b></span><button class="linkish" data-do="combatmore" data-a="abilities">Manage</button></div>
      <div class="ab-slots">${slotHtml}</div>${nextSlot}${ready.length ? '' : nxt}</section>`;
  };
  const foodPanel = () => {
    const foods = (DQ.foods ? DQ.foods() : []).filter(id => DQ.have(id) > 0), heal = foodHeal(), at = S().settings.eatAt || 50;
    const tiles = foods.map(id => { const it = D.ITEMS[id]; return `<button class="food-tile" data-do="eat" data-a="${id}" data-tip="item:${id}">${DQ.itemIco(it)}<span><b>${esc(it.name)} <span class="mono" data-b="count:${id}"></span></b><small>+${it.heal} each</small></span></button>`; }).join('');
    return `<section class="panel combat-food"><div class="kit-head"><span class="k">Food · ${heal} health</span><button class="tog ${S().settings.autoEat ? 'on' : ''}" data-do="autoeat"><span class="sw"></span>Auto-eat</button></div>
      <div class="food-tiles">${tiles || '<p class="food-none">None carried. Cook fish or buy bread.</p>'}</div>
      <div class="eat-step" role="group" aria-label="Eat below this health"><span>Eat below</span><button type="button" class="btn sm" data-do="eatstep" data-a="-10" aria-label="Eat at lower health">−</button><output class="mono">${at}%</output><button type="button" class="btn sm" data-do="eatstep" data-a="10" aria-label="Eat at higher health">+</button></div></section>`;
  };
  UI.DO.abilswap = id => { const on = S().abilities || []; if (on.length >= DQ.abilSlots()) DQ.toggleAbility(on[on.length - 1]); if (DQ.toggleAbility(id)) DQ.sfx && DQ.sfx('equip'); UI.render(false); };
  const render = UI.render;
  UI.render = fresh => { render(fresh); addBar(); refresh(); };
})();
