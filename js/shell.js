/* Idlewick: the app shell. Five hubs (Home, Skills, Combat, World, Hero) with tabs inside each,
   a calmer top bar, and a Home page built around "Up next". */
(() => {
const DQ = window.DQ, D = DQ.data, UI = DQ.ui, { $, $$, ico, fmt, fmtK, esc, clamp } = DQ;
const S = () => DQ.S;

/* ---------- Hubs ---------- */
const HUBS = [
  { id: 'home', name: 'Home', ic: 'home', pages: ['overview', 'skillsummary', 'activity'] },
  { id: 'quests', name: 'Quests', ic: 'quest', pages: ['quests'] },
  { id: 'skills', name: 'Skills', ic: 'star', pages: ['fishing', 'woodcutting', 'mining', 'thieving', 'farming', 'cooking', 'smithing', 'crafting', 'magic'] },
  { id: 'combat', name: 'Combat', ic: 'attack', pages: ['combat', 'bestiary'] },
  { id: 'world', name: 'World', ic: 'map', pages: ['map', 'projects'] },
  { id: 'shop', name: 'Shop', ic: 'shop', pages: ['shop', 'bank'] },
  { id: 'hero', name: 'Hero', ic: 'bag', pages: ['character', 'house', 'hirelings', 'research', 'mastery', 'achievements', 'settings', 'balance'] },
];
const TAB = { overview: ['Home', 'home'], skillsummary: ['Skill levels', 'star'], activity: ['Activity', 'clock'], projects: ['Town projects', 'house'], combat: ['Fight', 'attack'], bestiary: ['Bestiary', 'book'], map: ['Map', 'map'], quests: ['Quests', 'quest'], shop: ['Shop', 'shop'], character: ['Inventory', 'bag'], bank: ['Bank', 'bank'], house: ['House', 'house'], hirelings: ['Workers', 'users'], achievements: ['Achievements', 'trophy'], mastery: ['Mastery', 'trophy'], research: ['Research', 'rune'], settings: ['Settings', 'gear'] };
UI.hubOf = p => HUBS.find(h => h.pages.includes(p)) || HUBS[0];
const lastIn = {};
const hubDefault = h => {
  if (h.id === 'home') return 'overview';
  if (lastIn[h.id]) return lastIn[h.id];
  if (h.id === 'skills') { const ap = DQ.actPage && DQ.actPage(); return ap && h.pages.includes(ap) ? ap : 'fishing'; }
  return h.pages[0];
};

UI.renderRail = () => {
  const cur = UI.hubOf(UI.view).id;
  $('#rail').innerHTML = `<div class="brand">${ico('candle')}<b>Idlewick</b></div>` + HUBS.map(h => `<button class="hub ${h.id === cur ? 'on' : ''}" data-do="hub" data-a="${h.id}" aria-label="${h.name}">${ico(h.ic)}<span>${h.name}</span><i class="hubdot" data-b="hubdot:${h.id}"></i></button>`).join('');
  UI.upd();
};
UI.B.notice = (e, page) => {
  const n = DQ.noticeCount ? DQ.noticeCount(page) : 0;
  e.hidden = !n; UI.set(e, n > 9 ? '9+' : n);
  e.setAttribute('aria-label', n + ' unread updates');
};
UI.B.hubdot = (e, h) => {
  let n = 0, live = false;
  if (h === 'home') n = (S().inbox || []).length + (DQ.goals ? 0 : 0);
  if (h === 'quests') { n = D.QUESTS.filter(q => DQ.questState(q) === 'ready').length; live = !n && D.QUESTS.some(q => DQ.questState(q) === 'new'); }
  if (h === 'skills' || h === 'combat') { const ap = DQ.act && DQ.actPage(); live = !!ap && HUBS.find(x => x.id === h).pages.includes(ap); }
  n = Math.max(n, DQ.noticeCount ? DQ.noticeCount(HUBS.find(hub => hub.id === h)?.pages || []) : 0);
  e.className = 'hubdot' + (n ? ' num' : live ? ' live' : ''); UI.set(e, n || '');
};
const subnav = () => {
  const h = UI.hubOf(UI.view), el = $('#subnav'); if (!el) return;
  if (h.pages.length === 1) { el.innerHTML = ''; return; }
  const pages = h.pages.filter(p => p !== 'balance' || S().settings.dev || UI.view === 'balance');
  if (pages.length > 3) {
    const name = p => D.SK[p] ? D.SK[p].name : TAB[p] ? TAB[p][0] : DQ.cap(p);
    el.innerHTML = `<div class="subnav section-picker ${h.id}"><span>${h.name}</span>${UI.choiceButtons(`<select id="section-select" data-in="page" aria-label="${h.name} section">${pages.map(p => `<option value="${p}" ${p === UI.view ? 'selected' : ''}>${name(p)}</option>`).join('')}</select>`)}</div>`;
    return;
  }
  const tabs = pages.map(p => `<button class="stab ${p === UI.view ? 'on' : ''}" data-do="go" data-a="${p}" ${p === UI.view ? 'aria-current="page"' : ''}>${ico(TAB[p][1])}<span>${TAB[p][0]}</span><span class="notice-badge" data-b="notice:${p}" hidden></span></button>`).join('');
  el.innerHTML = `<nav class="subnav ${h.id}" aria-label="${h.name} pages">${tabs}</nav>`;
  /* centre the active tab by scrolling the tab strip sideways only, never the page */
  const bar = $('.subnav', el), on = $('.stab.on', el); if (bar && on) bar.scrollLeft = on.offsetLeft - bar.clientWidth / 2 + on.offsetWidth / 2;
  if (bar) { const fade = () => { bar.classList.toggle('fade-l', bar.scrollLeft > 4); bar.classList.toggle('fade-r', bar.scrollLeft + bar.clientWidth < bar.scrollWidth - 4); }; fade(); bar.addEventListener('scroll', fade, { passive: true }); }
};
UI.DO.hub = a => { const h = HUBS.find(x => x.id === a); DQ.go(hubDefault(h)); };
const prevRender = UI.render;
UI.render = fresh => {
  prevRender(fresh); lastIn[UI.hubOf(UI.view).id] = UI.view; subnav(); UI.renderDock(); UI.renderPins(); UI.packWarn(true); UI.upd();
  const cur = UI.hubOf(UI.view).id; $$('.hub').forEach(b => b.classList.toggle('on', b.dataset.a === cur));
};

/* ---------- The skills menu: a second menu, always in reach, so the things people open most are one click away ---------- */
UI.renderDock = () => {
  const el = $('#skilldock'); if (!el) return;
  const cur = UI.view, ap = DQ.act && DQ.actPage ? DQ.actPage() : null;
  el.innerHTML = `<div class="dk-h">Skills</div>` + D.SKILLS.filter(s => s.group !== 'combat').map(s => {
    const lock = !DQ.skillUnlocked(s.id);
    return `<button class="dk ${cur === s.page ? 'on' : ''} ${lock ? 'locked' : ''}" style="--c:${s.col}" data-do="go" data-a="${s.page}" data-tip="skill:${s.id}" aria-label="${s.name}">${ico(lock ? 'lock' : s.id)}<span class="dk-n">${s.name}</span>${lock ? '' : `<b class="mono" data-b="lvl:${s.id}"></b>`}${!lock && ap === s.page ? '<i class="dk-live"></i>' : ''}<span class="notice-badge" data-b="notice:${s.page}" hidden></span></button>`;
  }).join('');
  UI.upd();
};
DQ.on('act', () => UI.renderDock && UI.renderDock());
DQ.on('lvl', () => UI.renderDock && UI.renderDock());

/* ---------- Top bar ---------- */
UI.renderHud = () => {
  const a = DQ.act, sk = a && DQ.actSkill(), s = sk && D.SK[sk], fight = a && a.kind === 'fight' && D.MON[a.id];
  const taskArt = a && (fight ? DQ.monSprite(fight, 48) : a.kind === 'recipe' ? DQ.itemIco(D.ITEMS[Object.keys(D.RECIPES[a.id].out)[0]]) : a.kind === 'alch' ? DQ.itemIco(D.ITEMS[a.id]) : DQ.artImage(a.kind, a.id, 48, '', DQ.actLabel()));
  const task = a ? `<div class="h-task" style="--c:${s ? s.col : '#d8a64a'}">
      <span class="h-tic">${taskArt}</span>
      <button class="h-tb" data-do="plan" data-tip="text:Pace, stop rule and queue"><span class="h-t1"><b>${esc(DQ.actLabel().replace(/ rock$/, ''))}</b><span class="h-meta"><span data-b="hud:eta"></span><span data-b="hud:rate"></span></span></span><span class="bar prog"><i data-prog="@"></i></span><span class="h-t3"><small>${fight ? `Combat <b class="mono" data-b="combat"></b> vs Lv ${fight.cl} · ` : s ? `${s.name} <b class="mono" data-b="lvl:${sk}"></b> · ` : ''}${D.PACE[a.pace || 'steady'].name}${(S().queue || []).length ? ` · ${S().queue.length} queued` : ''} · <span data-b="hud:count"></span></small><span class="hq hb" data-b="hudbuff" hidden></span></span></button>
      <button class="h-stop" data-do="stop" aria-label="Stop" data-tip="text:Stop (Space)">${ico('close')}</button></div>`
    : `<div class="h-task idle"><span class="h-tic">${ico('clock')}</span><div class="h-tb"><b>Nothing running</b><small>Choose your next step on Home</small><span class="hq hb" data-b="hudbuff" hidden></span></div>${S().lastAct ? `<button class="btn sm primary" data-do="resume">Resume</button>` : `<button class="btn sm" data-do="go" data-a="overview">Your destination</button>`}</div>`;
  $('#hud').innerHTML = `<button class="h-hero" data-do="go" data-a="character" data-tip="text:Your inventory">${UI.portrait(48)}<span class="h-lv mono" data-b="adv"></span></button>
    <div class="h-name"><b>${esc(S().name)}</b><span class="bar"><i data-b="advbar"></i></span><small>${DQ.heroTitle() ? `<i class="h-title">${esc(DQ.heroTitle())}</i>` : `Hero level <span data-b="adv"></span> · <span data-b="advline"></span>`}</small></div>
    ${UI.petBadge ? UI.petBadge() : ''}${task}
    <div class="h-stats"><div class="h-coin" data-tip="text:Coins">${ico('coin')}<b class="mono" data-b="coins"></b></div>
      <div class="hp h-hp" data-tip="text:Health"><span class="bar"><i data-b="hpbar"></i></span><small class="mono" data-b="hptxt"></small></div></div>
    <div class="h-btns"><button class="packchip" data-do="go" data-a="character" data-tip="text:Backpack slots used. Click to open your inventory">${ico('bag')}<span class="mono" data-b="packchip"></span></button><button class="iconb" data-do="go" data-a="map" data-tip="text:${esc(D.TOWN[S().town].name)}: open the map">${ico('pin')}</button><button class="iconb bellb" data-do="bell" aria-label="Recent activity" data-tip="text:Recent activity">${ico('bell')}<i class="belldot" data-b="belldot" hidden></i></button><button class="iconb" data-do="mute" aria-label="Mute" data-tip="text:${S().settings.muted ? 'Unmute (M)' : 'Mute (M)'}">${ico(S().settings.muted ? 'mute' : 'sound')}</button></div>`;
  UI.upd(); UI.collectProg();
};

/* ---------- Pinned quests: one slim strip ---------- */
UI.renderPins = () => {
  const box = $('#pins'); if (!box) return;
  const project = UI.projectPinHtml ? UI.projectPinHtml() : '';
  if (UI.view === 'quests') { box.innerHTML = project; UI.upd(); return; }
  const pins = (S().pins || []).filter(id => D.QM[id] && DQ.questState(D.QM[id]) !== 'done'); S().pins = pins;
  const ids = pins.filter(id => {
    const q = D.QM[id]; if (DQ.questState(q) !== 'active') return false;
    const objective = q.obj.find((o, j) => DQ.objProg(q, S().q[id], j) < o.n);
    return objective && DQ.objPage(q, objective) === UI.view;
  });
  if (!ids.length || UI.view === 'overview') { box.innerHTML = project; UI.upd(); return; }
  box.innerHTML = project + `<div class="pinstrip">${ids.map(id => {
    const q = D.QM[id], st = DQ.questState(q), p = S().q[id], i = Math.max(0, q.obj.findIndex((o, j) => DQ.objProg(q, p, j) < o.n)), o = q.obj[i], sk = q.main && D.SK[q.unlocks];
    const act = st === 'new' ? `data-do="qstart" data-a="${id}"` : st === 'ready' ? `data-do="qclaim" data-a="${id}"` : `data-do="questcontinue" data-a="${q.id}"`;
    return `<button class="pinchip ${st}" style="${sk ? `--c:${sk.col}` : ''}" ${act} data-tip="text:${esc(q.name)}: ${esc(o.label)}">${ico(q.main ? 'star' : 'quest')}<span class="pc-t"><b>${q.name}</b><small>${o.label}</small></span><span class="pc-p"><span class="bar"><i data-b="qbar:${id}:${i}"></i></span></span>${ico('arrow')}</button>`;
  }).join('')}</div>`;
  UI.upd();
};

/* ---------- Home ---------- */
const goalCard = (g, i) => {
  const vis = g.sprite ? (g.pet ? DQ.petSprite(g.sprite, 48) : DQ.monSprite(g.sprite, 48)) : ico(g.icon, 'lg');
  const eta = g.ready ? 'Ready now' : g.eta != null ? `about ${DQ.fmtTime(g.eta)}` : g.pct >= 1 ? 'Ready' : g.hint;
  return `<button class="goal ${g.ready ? 'ready' : ''}" data-gid="${esc(g.id)}" style="--c:${g.col};--i:${i}" data-do="${g.act ? g.act.do : 'go'}" data-a="${g.act ? g.act.a : g.go}">
    <span class="g-ic">${vis}</span><span class="g-b"><small class="g-cat">${g.cat}</small><b>${esc(g.title)}</b><small class="g-sub">${esc(g.sub)}</small>
    <span class="bar"><i style="width:${Math.round(clamp(g.pct, 0, 1) * 100)}%"></i></span>${eta ? `<small class="g-eta ${g.ready ? 'ok' : ''}">${g.ready ? ico('check') : ico('clock')}${eta}</small>` : ''}</span>
    <span class="g-go">${g.act ? g.act.label : 'Go'} ${ico('arrow')}</span></button>`;
};
UI.homeGoals = () => {
  const all = DQ.goals(), showAll = UI.tab.goals === 'all';
  if (!showAll) return `<div class="goals">${all.slice(0, 4).map(goalCard).join('')}</div>`;
  const cats = [...new Set(all.map(g => g.cat))];
  return cats.map(c => `<div class="gcat"><div class="k">${c}</div><div class="goals">${all.filter(g => g.cat === c).map(goalCard).join('')}</div></div>`).join('');
};
UI.homeSections = [];
UI.homeNotices = () => '';
UI.V.overview = () => {
  const welcome = !S().seen.firstTask && !DQ.act && DQ.totalXp() === 0
    ? '<p class="home-welcome">Welcome to Idlewick. Follow your next step below. Once started, tasks carry on while you are away.</p>' : '';
  const decisions = (S().inbox || []).length;
  return `${welcome}${UI.homeSections.map(render => render()).join('')}
    ${decisions ? `<button class="btn sm" data-do="go" data-a="activity">${decisions} away decision${decisions === 1 ? '' : 's'} waiting · View activity</button>` : ''}
    ${UI.homeNotices()}
    <section data-reference="true" class="panel upnext"><h3>Explore other suggestions</h3>
      <div id="goalbox">${UI.homeGoals()}</div>
    </section>`;
};
UI.V.skillsummary = () => `<section class="panel"><div class="phead"><h2>Your skills</h2><small>Total level <b data-b="totlvl"></b></small></div><div class="skl">${D.SKILLS.map(skill => {
  const locked = !DQ.skillUnlocked(skill.id);
  return `<button class="skrow ${locked ? 'locked' : ''}" data-do="go" data-a="${skill.page}" style="--c:${skill.col}">${ico(locked ? 'lock' : skill.id)}<span>${skill.name}</span>${locked ? `<small>${skill.quest ? 'Quest unlock' : 'Hero ' + skill.unlock}</small>` : `<b class="mono" data-b="lvl:${skill.id}"></b><span class="bar"><i data-b="xpbar:${skill.id}"></i></span>`}</button>`;
}).join('')}</div></section>`;
UI.V.activity = () => `${UI.inboxPanel()}<section class="panel"><div class="phead"><h2>Activity</h2><small class="mono" id="xph"></small></div><div id="chart"></div><ul class="log" id="loglist"></ul></section>`;
let gAcc = 0;
/* Up next refreshes quietly: if the same goals are showing, only the numbers and bars are updated in place, so nothing flickers or re-animates */
const syncGoal = (a, b) => {
  a.className = b.className;
  const ai = $('.bar i', a), bi = $('.bar i', b); if (ai && bi && ai.style.width !== bi.style.width) ai.style.width = bi.style.width;
  for (const sel of ['.g-sub', '.g-eta', '.g-go']) {
    const x = $(sel, a), y = $(sel, b); if (!x && !y) continue;
    if (!x || !y) { a.replaceWith(b); return; }
    if (x.innerHTML !== y.innerHTML) x.innerHTML = y.innerHTML;
  }
};
UI.refreshGoals = () => {
  const box = $('#goalbox'); if (!box || box.matches(':hover') || box.contains(document.activeElement) && document.activeElement.matches(':focus-visible')) return;
  const all = DQ.goals(), shown = UI.tab.goals === 'all' ? all : all.slice(0, 4);
  const ids = shown.map(g => g.id).join('|'), have = $$('.goal', box).map(e => e.dataset.gid).join('|');
  const tpl = document.createElement('div'); tpl.innerHTML = UI.homeGoals();
  if (ids === have) { $$('.goal', box).forEach(el => { const n = $(`.goal[data-gid="${CSS.escape(el.dataset.gid)}"]`, tpl); if (n) syncGoal(el, n); }); return; }
  box.innerHTML = tpl.innerHTML; /* the list itself changed: swap it once, without replaying the entrance animation */
};
DQ.on('ui', () => { if (UI.view !== 'overview') return; if ((gAcc += 1) % 12 === 0) UI.refreshGoals(); });
DQ.on('act', () => UI.renderPins());

/* ---------- Backpack full: always visible, always with a way out ---------- */
UI.B.packchip = e => { const n = DQ.packSlots(), m = DQ.packMax(); e.textContent = n + '/' + m; const b = e.parentNode; b.classList.toggle('full', n >= m); b.classList.toggle('near', n < m && n >= m - 3); };
const junkValue = () => Object.keys(Object.assign({}, S().inv, S().bank)).reduce((c, id) => c + (D.ITEMS[id] && D.ITEMS[id].type === 'junk' ? DQ.have(id) * (D.ITEMS[id].val || 0) : 0), 0);
let packSig = '';
UI.packWarn = force => {
  const el = $('#packwarn'); if (!el) return;
  const full = DQ.packSlots() >= DQ.packMax() && !['character', 'bank', 'shop'].includes(UI.view);
  const sig = full + ':' + DQ.packMax(); if (!force && sig === packSig) return; packSig = sig;
  if (!full) { el.innerHTML = ''; return; }
  const chest = D.FURN.chest, tier = ((S().house || {}).furn || {}).chest || 0, more = chest && tier < 3;
  el.innerHTML = `<div class="packbar"><span class="pk-ic">${ico('bag')}</span><div class="pk-t"><b>Your backpack is full (${DQ.packSlots()}/${DQ.packMax()})</b>
    <small>Your task keeps running. Items you already carry keep stacking, but <b>new kinds of item go straight to your bank</b>. Free some slots to keep loot in your backpack.</small></div>
    <div class="pk-b"><button class="btn sm primary" data-do="depositall">Bank everything</button>${junkValue() > 0 ? `<button class="btn sm" data-do="sellall">Sell junk (${fmt(junkValue())}c)</button>` : ''}<button class="btn sm" data-do="go" data-a="character">Inventory</button>${more ? `<button class="btn sm" data-do="go" data-a="house" data-tip="text:A Storage chest adds backpack slots">More space: house</button>` : ''}</div></div>`;
};
DQ.on('ui', () => UI.packWarn(false));
DQ.on('overflow', () => UI.packWarn(true));
DQ.on('act', () => UI.packWarn(true));
})();
