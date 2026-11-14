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
  /* how long your food lasts against this creature (a dry-run forecast with your gear); opens the food plan */
  const foodPill = (heal, tight) => { let e = null; try { e = DQ.expedition && DQ.expedition(); } catch (x) { e = null; }
    if (!heal) return `<button class="rl-i warn" data-do="planfood" data-a="60" data-tip="text:Plan food for a longer trip">! No food</button>`;
    if (!e || e.unknown) return `<button class="rl-i ok" data-do="planfood" data-a="60">✓ Food ${tight ? heal + ' hp' : heal + ' health'}</button>`;
    const low = e.minutes < 30; return `<button class="rl-i ${low ? 'warn' : 'ok'}" data-do="planfood" data-a="60" data-tip="text:Food lasts ≈ ${esc(DQ.expeditionSpan(e.minutes))} vs ${esc(e.m.name)} · click to plan">${low ? '!' : '✓'} Food ${tight ? '' : 'lasts '}≈ ${esc(DQ.expeditionSpan(e.minutes))}</button>`; };
  /* ---------- Layout E (Dec 2026, from the player: "the combat screen looks poor again"). One header bar names what you
     are fighting or looking at, with its danger, your food and gear, the reference buttons and the one main button
     (Explore, Retreat or Challenge). Under it the fight, on a calm backdrop of the area itself, and under that three
     equal panels: fighting style, food, abilities. Where to fight stays on the left, the boss directly under the
     challenges. No numbered steps, no second bar inside the fight. ---------- */
  const areaKey = () => { const a = DQ.act && DQ.act.kind === 'fight' && DQ.act.area, R = DQ.backdropKeys ? DQ.backdropKeys() : [];
    if (a && R.includes(a)) return a; const m = focus(), ar = m && DQ.areaForMonster && DQ.areaForMonster(m.id); if (ar && R.includes(ar.id)) return ar.id;
    const t = S().town; return R.includes(t + ':0') ? t + ':0' : R.includes(t + ':1') ? t + ':1' : null; };
  const header = () => {
    const m = focus(), d = m && DQ.dangerOf ? DQ.dangerOf(m) : null, heal = foodHeal(), slots = ['head', 'body', 'legs', 'shield', 'weapon', 'amulet', 'ring'], worn = slots.filter(k => S().equip[k]).length;
    const fighting = DQ.act && DQ.act.kind === 'fight', fm = fighting && D.MON[DQ.act.id], tm = fm || m;
    const met = tm && ((S().beast.kills[tm.id] || 0) > 0 || fighting), nm = tm ? (met ? tm.name : 'Unknown creature') : 'Choose where to fight';
    const area = tm && !tm.boss && !tm.mini && DQ.areaForMonster ? DQ.areaForMonster(tm.id) : null, areaName = fighting && DQ.act.area && D.AREAS ? ((Object.values(D.AREAS).flat().find(x => x.id === DQ.act.area) || {}).name || '') : area ? area.name : '';
    const where = fighting ? `Fighting${areaName ? ' · ' + esc(areaName) : ''}` : tm ? (tm.tower ? 'Trial tower' : tm.boss ? 'Boss' : tm.mini ? 'Challenge' : areaName ? esc(areaName) : 'Selected') : '';
    const tone = d ? (d.key === 'easy' ? 'ok' : d.key === 'fair' ? 'warn' : 'bad') : '';
    const go = fighting ? `<button class="btn cx-go" data-do="stop">Retreat</button>`
      : tm && (tm.boss || tm.mini || tm.tower) ? (DQ.combatLvl() >= ((tm.boss || tm.mini).req || 0) ? `<button class="btn primary cx-go" data-do="act" data-a="fight" data-b="${tm.id}">Challenge</button>` : `<button class="btn cx-go" disabled>Combat ${(tm.boss || tm.mini).req}</button>`)
      : area ? `<button class="btn primary cx-go" data-do="huntarea" data-a="${area.id}">Explore ${esc(area.name)}</button>` : '';
    return `<div class="ready-line cx-head tone-${tone || 'none'}"><div class="arena-ctl cx-title">${tm ? `<small>${where}</small><b>${esc(nm)}</b>${tm ? `<span class="lvchip">Lv ${tm.cl}</span>` : ''}` : `<b>${nm}</b>`}</div>
      <div class="cx-chips">${d ? `<span class="rl-i ${tone}" data-tip="text:${esc(d.why || d.label)}">${tone === 'ok' ? '✓' : '!'} ${esc(d.label)}</span>` : ''}${foodPill(heal, false)}<button class="rl-i ${worn < 4 ? 'warn' : 'ok'}" data-do="go" data-a="character" data-tip="text:Open your equipment">${worn < 4 ? '!' : '✓'} Gear ${worn}/${slots.length}</button></div>
      <div class="cx-tools">${tm ? `<button class="btn sm" data-do="guide" data-a="${tm.id}">${ico('book')}Guide</button>` : ''}${dashHas(byKey('prep').from) ? `<button class="btn sm" data-do="combatmore" data-a="prep">${ico('info')}Details</button>` : ''}${dashHas(byKey('loot').from) ? `<button class="btn sm" data-do="combatmore" data-a="loot">${ico('pouch')}Loot</button>` : ''}</div>${go}</div>`;
  };
  const bossBtn = () => { const b = bossOf(), p = byKey('boss'); if (!b || !dashHas(p.from)) return ''; let bg = null; try { bg = p.badge(); } catch (e) { bg = null; }
    return `<button class="boss-foot ${bg && bg.tone ? 'tone-' + bg.tone : ''}" data-do="combatmore" data-a="boss">${DQ.monSprite(b, 32)}<span><small>Boss</small><b>${esc(b.boss.short || b.name)}</b></span><span class="bf-go">${esc(bg ? bg.t : '')}</span></button>`; };
  const trainPanel = strip => {
    const w = strip.querySelector('.ss-weapon'), btns = [...strip.querySelectorAll('.ss-btn')];
    const hp = `<span class="ss-hp" data-tip="text:Health · levels with every fight">${ico('hitpoints')}<span>Health <b class="mono" data-b="lvl:hitpoints"></b><span class="bar ss-xp"><i data-b="xpbar:hitpoints"></i></span></span></span>`;
    const cl = `<button class="ss-cl" data-do="combatmore" data-a="skills" data-tip="text:Combat level breakdown">${ico('attack')}<span>Combat <b class="mono" data-b="combat"></b><small>Breakdown</small></span></button>`;
    return `<section class="panel hud-train"><div class="kit-head"><span class="k">Fighting style</span>${w ? w.outerHTML : ''}</div><div class="style-strip" role="group" aria-label="Fighting style"><div class="cx-styles">${btns.map(b => b.outerHTML).join('')}</div><div class="cx-stats">${hp}${cl}</div></div></section>`; };
  const addBar = () => {
    const dash = document.querySelector('#view .combat-dashboard'); if (!dash || dash.dataset.d) return;
    const live = dash.querySelector('.combat-live'), strip = live && live.querySelector('.style-strip'), arena = live && live.querySelector('.encounter-arena'), ctl = live && live.querySelector('.arena-ctl'), tg = dash.querySelector('.combat-targets');
    if (!live || !strip) return; dash.dataset.d = '1'; dash.classList.add('combat-d', 'combat-x');
    if (tg) { tg.insertAdjacentHTML('afterbegin', '<div class="step-h">Where to fight</div>'); const minis = tg.querySelector('.wh-minis'); if (minis) minis.insertAdjacentHTML('afterend', bossBtn()); else tg.insertAdjacentHTML('beforeend', bossBtn()); }
    if (ctl) ctl.remove();
    live.insertAdjacentHTML('afterbegin', header());
    /* the fight stands on its own area, at a whole-number scale (4x), never the busy town */
    const k = areaKey(); if (arena && k && DQ.backdropUrl) { arena.style.backgroundImage = `linear-gradient(color-mix(in srgb,var(--panel) 18%,transparent),color-mix(in srgb,var(--panel) 34%,transparent)),url('${DQ.backdropUrl(k)}')`; arena.classList.add('cx-stage'); }
    strip.insertAdjacentHTML('beforebegin', `<div class="combat-hud">${trainPanel(strip)}${foodPanel()}${abilPanel()}</div>`); strip.remove();
  };
  const abilPanel = () => {
    const on = S().abilities || [], slots = DQ.abilSlots ? DQ.abilSlots() : 0, ready = D.ABIL.filter(a => DQ.abilUnlocked(a)), spare = ready.filter(a => !on.includes(a.id));
    const next = D.ABIL.filter(a => !DQ.abilUnlocked(a)).sort((x, y) => (x.lvl - DQ.lvl(x.skill)) - (y.lvl - DQ.lvl(y.skill)))[0];
    const why = a => DQ.ability(a.id) ? 'In use' : a.needShield && !S().equip.shield ? 'Needs a shield' : a.style ? `${DQ.cap(a.style)} only` : 'Idle';
    const slotHtml = Array.from({ length: slots }, (_, i) => { const a = D.ABIL.find(x => x.id === on[i]);
      return a ? `<button class="ab-tile on ${DQ.ability(a.id) ? '' : 'idle'}" data-do="abil" data-a="${a.id}" aria-pressed="true" data-tip="text:${esc(a.name)}: ${esc(a.text)} · click to remove">${ico(a.ic)}<b>${esc(a.name)}</b><small>${esc(why(a))}</small></button>`
        : `<button class="ab-tile empty" data-do="combatmore" data-a="abilities" aria-label="Choose ability for slot ${i+1}">${ico('star')}<b>Empty</b><small>${spare.length ? 'Choose an ability' : 'Slot ' + (i + 1)}</small></button>`; }).join('');
    const nextSlot = slots < 3 ? `<small class="ab-future-slot">Slot 3 · Combat 40</small>` : slots < 4 ? `<small class="ab-future-slot">Slot 4 · Combat 70</small>` : '';
    const nxt = next ? (() => { const need = D.XPF[next.lvl] || 1, have = S().xp[next.skill] || 0; return `<div class="ab-next"><span>${ready.length ? 'Next' : 'First ability'}: <b>${esc(next.name)}</b> at ${esc(D.SK[next.skill].name)} ${next.lvl}</span><span class="bar"><i style="width:${Math.min(100, Math.round(have / need * 100))}%"></i></span></div>`; })() : '';
    return `<section class="panel combat-abils"><div class="kit-head"><span class="k">Abilities <b class="mono">${on.length}/${slots}</b></span><button class="linkish" data-do="combatmore" data-a="abilities">Manage</button></div>
      <div class="ab-slots">${slotHtml}</div>${nextSlot}${ready.length ? '' : nxt}</section>`;
  };
  const foodPanel = () => {
    const foods = (DQ.foods ? DQ.foods() : []).filter(id => DQ.have(id) > 0), heal = foodHeal(), at = S().settings.eatAt || 50;
    const tiles = foods.map(id => { const it = D.ITEMS[id]; return `<button class="food-tile" data-do="eat" data-a="${id}" data-tip="item:${id}">${DQ.itemIco(it)}<span><b>${esc(it.name)} <span class="mono" data-b="count:${id}"></span></b><small>+${it.heal} each</small></span></button>`; }).join('');
    return `<section class="panel combat-food"><div class="kit-head"><span class="k">Food <b class="mono">${heal}</b> <small>health</small></span><button class="tog ${S().settings.autoEat ? 'on' : ''}" data-do="autoeat"><span class="sw"></span>Auto-eat</button></div>
      <div class="food-tiles">${tiles || '<p class="food-none">None carried. Cook fish or buy bread.</p>'}</div>
      <div class="eat-step" role="group" aria-label="Eat below this health"><span>Eat below</span><button type="button" class="btn sm" data-do="eatstep" data-a="-10" aria-label="Eat at lower health">−</button><output class="mono">${at}%</output><button type="button" class="btn sm" data-do="eatstep" data-a="10" aria-label="Eat at higher health">+</button></div></section>`;
  };
  UI.DO.abilswap = id => { const on = S().abilities || []; if (on.length >= DQ.abilSlots()) DQ.toggleAbility(on[on.length - 1]); if (DQ.toggleAbility(id)) DQ.sfx && DQ.sfx('equip'); UI.render(false); };
  const render = UI.render;
  UI.render = fresh => { render(fresh); addBar(); refresh(); };
})();
