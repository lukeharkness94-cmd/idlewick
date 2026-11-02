/* Idlewick: the app shell. Five hubs (Home, Skills, Combat, World, Hero) with tabs inside each,
   a calmer top bar, and a Home page built around "Up next". */
(() => {
const DQ = window.DQ, D = DQ.data, UI = DQ.ui, { $, $$, ico, fmt, fmtK, esc, clamp } = DQ;
const S = () => DQ.S;

/* ---------- Hubs ---------- */
const HUBS = [
  { id: 'home', name: 'Home', ic: 'home', pages: ['overview'] },
  { id: 'quests', name: 'Quests', ic: 'quest', pages: ['quests'] },
  { id: 'skills', name: 'Skills', ic: 'star', pages: ['fishing', 'woodcutting', 'mining', 'thieving', 'farming', 'cooking', 'smithing', 'crafting', 'magic'] },
  { id: 'combat', name: 'Combat', ic: 'attack', pages: ['combat', 'bestiary'] },
  { id: 'world', name: 'World', ic: 'map', pages: ['map'] },
  { id: 'shop', name: 'Shop', ic: 'shop', pages: ['shop', 'bank'] },
  { id: 'hero', name: 'Hero', ic: 'bag', pages: ['character', 'house', 'hirelings', 'research', 'mastery', 'achievements', 'settings', 'balance'] },
];
/* pages that share one tab; the page itself shows a small switch between them */
const GROUPS = [{ id: 'estate', name: 'Estate', ic: 'house', pages: ['house', 'hirelings'] }, { id: 'progress', name: 'Progress', ic: 'trophy', pages: ['achievements', 'mastery'] }, { id: 'settings', name: 'Settings', ic: 'gear', pages: ['settings', 'balance'] }];
UI.GROUPS = GROUPS;
const TAB = { combat: ['Fight', 'attack'], bestiary: ['Bestiary', 'book'], map: ['Map', 'map'], quests: ['Quests', 'quest'], shop: ['Shop', 'shop'], character: ['Inventory', 'bag'], bank: ['Bank', 'bank'], house: ['House', 'house'], hirelings: ['Workers', 'users'], achievements: ['Achievements', 'trophy'], mastery: ['Mastery', 'trophy'], research: ['Research', 'rune'], settings: ['Settings', 'gear'] };
UI.hubOf = p => HUBS.find(h => h.pages.includes(p)) || HUBS[0];
const lastIn = {};
const hubDefault = h => {
  if (lastIn[h.id]) return lastIn[h.id];
  if (h.id === 'skills') { const ap = DQ.actPage && DQ.actPage(); return ap && h.pages.includes(ap) ? ap : 'fishing'; }
  return h.pages[0];
};

UI.renderRail = () => {
  const cur = UI.hubOf(UI.view).id;
  $('#rail').innerHTML = `<div class="brand">${ico('candle')}<b>Idlewick</b></div>` + HUBS.map(h => `<button class="hub ${h.id === cur ? 'on' : ''}" data-do="hub" data-a="${h.id}" aria-label="${h.name}">${ico(h.ic)}<span>${h.name}</span><i class="hubdot" data-b="hubdot:${h.id}"></i></button>`).join('');
  UI.upd();
};
UI.B.hubdot = (e, h) => {
  let n = 0, live = false;
  if (h === 'home') n = (S().inbox || []).length + (DQ.goals ? 0 : 0);
  if (h === 'quests') { n = D.QUESTS.filter(q => DQ.questState(q) === 'ready').length; live = !n && D.QUESTS.some(q => DQ.questState(q) === 'new'); }
  if (h === 'skills' || h === 'combat') { const ap = DQ.act && DQ.actPage(); live = !!ap && HUBS.find(x => x.id === h).pages.includes(ap); }
  e.className = 'hubdot' + (n ? ' num' : live ? ' live' : ''); UI.set(e, n || '');
};
const subnav = () => {
  const h = UI.hubOf(UI.view), el = $('#subnav'); if (!el) return;
  if (h.pages.length === 1) { el.innerHTML = ''; return; }
  let tabs;
  if (h.id === 'skills') tabs = h.pages.map(p => { const s = D.SK[p], lock = !DQ.skillUnlocked(p), live = DQ.act && DQ.actPage() === p; return `<button class="stab ${UI.view === p ? 'on' : ''} ${lock ? 'locked' : ''}" style="--c:${s.col}" data-do="go" data-a="${p}">${ico(lock ? 'lock' : p)}<span>${s.name}</span>${lock ? '' : `<b class="mono" data-b="lvl:${p}"></b>`}${live ? '<i class="live"></i>' : ''}</button>`; }).join('');
  else { const done = {}; tabs = h.pages.map(p => {
    const g = GROUPS.find(x => x.pages.includes(p)); if (g && done[g.id]) return ''; if (g) done[g.id] = 1;
    const ps = g ? g.pages : [p], sts = ps.map(q => UI.tabState ? UI.tabState(q) : null), on = ps.includes(UI.view);
    const lock = sts.every(t => t && t.lock) ? Math.min(...sts.map(t => t.lock)) : 0, fresh = !lock && sts.some(t => t && t.fresh);
    const target = g ? (ps.includes(lastIn[h.id]) ? lastIn[h.id] : ps.find((q, i) => !(sts[i] && sts[i].lock)) || ps[0]) : p, name = g ? g.name : TAB[p][0], ic = g ? g.ic : TAB[p][1];
    return `<button class="stab ${on ? 'on' : ''} ${lock ? 'locked' : ''}" data-do="go" data-a="${target}">${ico(lock ? 'lock' : ic)}<span>${name}</span>${lock ? `<em class="tabchip">Hero ${lock}</em>` : fresh ? '<em class="tabchip new">New</em>' : ''}${p === 'quests' ? '<span class="badge" data-b="qbadge"></span>' : ''}${p === 'combat' && DQ.act && DQ.act.kind === 'fight' ? '<i class="live"></i>' : ''}</button>`; }).join(''); }
  el.innerHTML = `<div class="subnav ${h.id}">${tabs}</div>`;
  /* centre the active tab by scrolling the tab strip sideways only, never the page */
  const bar = $('.subnav', el), on = $('.stab.on', el); if (bar && on) bar.scrollLeft = on.offsetLeft - bar.clientWidth / 2 + on.offsetWidth / 2;
  if (bar) { const fade = () => { bar.classList.toggle('fade-l', bar.scrollLeft > 4); bar.classList.toggle('fade-r', bar.scrollLeft + bar.clientWidth < bar.scrollWidth - 4); }; fade(); bar.addEventListener('scroll', fade, { passive: true }); }
};
UI.DO.hub = a => { const h = HUBS.find(x => x.id === a); DQ.go(hubDefault(h)); };
const prevRender = UI.render;
UI.render = fresh => {
  prevRender(fresh); lastIn[UI.hubOf(UI.view).id] = UI.view; subnav(); UI.renderDock(); UI.packWarn(true); UI.upd();
  const cur = UI.hubOf(UI.view).id; $$('.hub').forEach(b => b.classList.toggle('on', b.dataset.a === cur));
};

/* ---------- The skills menu: a second menu, always in reach, so the things people open most are one click away ---------- */
UI.renderDock = () => {
  const el = $('#skilldock'); if (!el) return;
  const cur = UI.view, ap = DQ.act && DQ.actPage ? DQ.actPage() : null;
  el.innerHTML = `<div class="dk-h">Skills</div>` + D.SKILLS.filter(s => s.group !== 'combat').map(s => {
    const lock = !DQ.skillUnlocked(s.id);
    return `<button class="dk ${cur === s.page ? 'on' : ''} ${lock ? 'locked' : ''}" style="--c:${s.col}" data-do="go" data-a="${s.page}" data-tip="skill:${s.id}" aria-label="${s.name}">${ico(lock ? 'lock' : s.id)}<span class="dk-n">${s.name}</span>${lock ? '' : `<b class="mono" data-b="lvl:${s.id}"></b>`}${!lock && ap === s.page ? '<i class="dk-live"></i>' : ''}</button>`;
  }).join('');
  UI.upd();
};
DQ.on('act', () => UI.renderDock && UI.renderDock());
DQ.on('lvl', () => UI.renderDock && UI.renderDock());

/* ---------- Top bar ---------- */
UI.renderHud = () => {
  const a = DQ.act, sk = a && DQ.actSkill(), s = sk && D.SK[sk], fight = a && a.kind === 'fight' && D.MON[a.id];
  const task = a ? `<div class="h-task" style="--c:${s ? s.col : '#d8a64a'}">
      <span class="h-tic">${fight ? DQ.monSprite(fight, 48) : ico(sk || 'star')}</span>
      <button class="h-tb" data-do="plan" data-tip="text:Pace, stop rule and queue"><span class="h-t1"><b>${esc(DQ.actLabel().replace(/ rock$/, ''))}</b><span class="h-meta"><span data-b="hud:eta"></span><span data-b="hud:rate"></span></span></span><span class="bar prog"><i data-prog="@"></i></span><span class="h-t3"><small>${fight ? `Combat <b class="mono" data-b="combat"></b> vs Lv ${fight.cl} · ` : s ? `${s.name} <b class="mono" data-b="lvl:${sk}"></b> · ` : ''}${D.PACE[a.pace || 'steady'].name}${(S().queue || []).length ? ` · ${S().queue.length} queued` : ''} · <span data-b="hud:count"></span></small><span class="hq" data-b="hudq" hidden></span><span class="hq hb" data-b="hudbuff" hidden></span></span></button>
      <button class="h-stop" data-do="stop" aria-label="Stop" data-tip="text:Stop (Space)">${ico('close')}</button></div>`
    : `<div class="h-task idle"><span class="h-tic">${ico('clock')}</span><div class="h-tb"><b>Nothing running</b><small>Pick a task, or see what is up next</small><span class="hq hb" data-b="hudbuff" hidden></span></div>${S().lastAct ? `<button class="btn sm primary" data-do="resume">Resume</button>` : `<button class="btn sm" data-do="go" data-a="overview">Up next</button>`}</div>`;
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
  if (UI.view === 'quests') { box.innerHTML = ''; return; }
  let ids = (S().pins || []).filter(id => D.QM[id] && DQ.questState(D.QM[id]) !== 'done'); S().pins = ids;
  const sug = !ids.length;
  if (!ids.length) { const nx = D.QUESTS.find(q => q.main && DQ.questState(q) === 'new'); ids = nx ? [nx.id] : []; }
  if (!ids.length || UI.view === 'overview') { box.innerHTML = ''; return; }
  box.innerHTML = `<div class="pinstrip">${ids.map(id => {
    const q = D.QM[id], st = DQ.questState(q), p = S().q[id], i = Math.max(0, q.obj.findIndex((o, j) => DQ.objProg(q, p, j) < o.n)), o = q.obj[i], sk = q.main && D.SK[q.unlocks];
    const act = st === 'new' ? `data-do="qstart" data-a="${id}"` : st === 'ready' ? `data-do="qclaim" data-a="${id}"` : `data-do="go" data-a="${DQ.objPage(q, o)}"`;
    return `<button class="pinchip ${st} ${sug ? 'sug' : ''}" style="${sk ? `--c:${sk.col}` : ''}" ${act} data-tip="text:${esc(q.name)}: ${esc(st === 'new' ? 'click to accept' : st === 'ready' ? 'click to claim' : o.label)}">${ico(q.main ? 'star' : 'quest')}<span class="pc-t"><b>${q.name}</b><small>${st === 'new' ? 'Accept' : st === 'ready' ? 'Claim reward' : o.label}</small></span>${st === 'active' ? `<span class="pc-p"><span class="bar"><i data-b="qbar:${id}:${i}"></i></span></span>` : ''}${ico('arrow')}</button>`;
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
UI.V.overview = () => {
  const s = S(), a = DQ.act, sk = a && DQ.actSkill(), fresh = DQ.totalXp() === 0;
  const start = fresh ? `<section class="panel startp fancy"><h2>Welcome to Idlewick</h2><p>Pick a first task. It keeps going on its own, even after you close the game.</p><div class="quick"><button class="btn primary" data-do="act" data-a="fish" data-b="shrimp">${ico('fishing')}Catch shrimp</button><button class="btn primary" data-do="act" data-a="wood" data-b="normal">${ico('woodcutting')}Chop trees</button><button class="btn" data-do="act" data-a="fight" data-b="chicken">${ico('attack')}Fight chickens</button></div></section>` : '';
  const now = a ? `<section class="panel nowp" style="--c:${D.SK[sk] ? D.SK[sk].col : '#d8a64a'}"><div class="phead"><h2>Current task</h2><button class="btn sm" data-do="stop">Stop</button></div>
      <div class="now"><div class="ring"><svg viewBox="0 0 112 112"><circle class="bg" cx="56" cy="56" r="46"/><circle class="fg" cx="56" cy="56" r="46" data-prog="@" data-ring="1"/></svg><div class="mid">${a.kind === 'fight' ? DQ.monSprite(D.MON[a.id], 48) : ico(sk)}</div></div>
      <div><h3>${DQ.actLabel()}</h3>${sk ? `<div class="mono sm dim">${D.SK[sk].name} <span data-b="lvl:${sk}"></span> · <span data-b="eta:${sk}"></span></div><span class="bar" style="margin-top:8px;max-width:240px"><i data-b="xpbar:${sk}"></i></span>` : ''}</div></div>
      ${UI.planSummary()}<p class="offline-note">${ico('clock')} Keeps going while the game is closed: full speed for 2 hours, then half speed, up to 8 hours.</p></section>`
    : (fresh ? '' : `<section class="panel nowp"><div class="phead"><h2>Current task</h2></div><p class="dim" style="margin:0">Nothing running. Pick something from <b>Up next</b>, or ${s.lastAct ? '' : 'open a skill.'}</p>${s.lastAct ? `<div class="quick"><button class="btn primary" data-do="resume">Resume: ${DQ.actLabel(s.lastAct)}</button><button class="btn" data-do="plan">Plan a queue</button></div>` : ''}</section>`);
  const quests = D.QUESTS.filter(q => ['active', 'ready'].includes(DQ.questState(q)));
  const qpanel = `<section class="panel"><div class="phead"><h2>Quests</h2><button class="btn sm" data-do="go" data-a="quests">Quest log</button></div>${quests.length ? quests.slice(0, 2).map(q => { const p = s.q[q.id], i = Math.max(0, q.obj.findIndex((o, j) => DQ.objProg(q, p, j) < o.n)), o = q.obj[i], st = DQ.questState(q); return `<div class="qrow ${q.main ? 'mainq' : ''}"><div class="top"><b>${q.main ? ico('star') + ' ' : ''}${q.name}</b>${st === 'ready' ? `<button class="btn primary sm" data-do="qclaim" data-a="${q.id}">Claim</button>` : `<button class="btn sm" data-do="go" data-a="${DQ.objPage(q, o)}">Go</button>`}</div><small class="dim">${st === 'ready' ? 'Done! Claim your reward.' : o.label}</small><span class="bar"><i data-b="qall:${q.id}"></i></span></div>`; }).join('') : `<p class="dim sm" style="margin:0">No quests in progress. ${D.QUESTS.some(q => DQ.questState(q) === 'new') ? 'New ones are waiting in the quest log.' : ''}</p>`}</section>`;
  const skills = `<section class="panel"><div class="phead"><h2>Skills</h2><small class="mono">Total level <b data-b="totlvl"></b></small></div><div class="skl">${D.SKILLS.map(x => { const lock = !DQ.skillUnlocked(x.id); return `<button class="skrow ${lock ? 'locked' : ''}" style="--c:${x.col}" data-do="go" data-a="${x.page}" data-tip="skill:${x.id}">${ico(lock ? 'lock' : x.id)}<span>${x.name}</span>${lock ? `<small>${x.quest ? '★ Quest' : 'Hero ' + x.unlock}</small>` : `<b class="mono" data-b="lvl:${x.id}"></b><span class="bar"><i data-b="xpbar:${x.id}"></i></span>`}</button>`; }).join('')}</div></section>`;
  return `${UI.inboxPanel()}${start}
    <section class="panel upnext"><div class="phead"><div><h2>Up next</h2><small>The closest goals, with time estimates from your pace</small></div><div class="tabs">${[['top', 'Closest'], ['all', 'Everything']].map(([k, n]) => `<button class="tab ${(UI.tab.goals || 'top') === k ? 'on' : ''}" data-do="tab" data-a="goals" data-b="${k}">${n}</button>`).join('')}</div></div><div id="goalbox">${UI.homeGoals()}</div></section>
    <div class="home2"><div class="col">${now}${qpanel}${UI.homestead ? UI.homestead() : ''}</div>
    <div class="col">${skills}<section class="panel"><div class="phead"><h2>Activity</h2><small class="mono" id="xph"></small></div><div id="chart"></div><ul class="log" id="loglist"></ul></section></div></div>`;
};
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
