/* Idlewick: the app shell. Five hubs (Home, Skills, Combat, World, Hero) with tabs inside each,
   a calmer top bar, and a Home page built around "Up next". */
(() => {
const DQ = window.DQ, D = DQ.data, UI = DQ.ui, { $, $$, ico, fmt, fmtK, esc, clamp } = DQ;
const S = () => DQ.S;

/* ---------- Hubs ---------- */
/* Five places (owner, 27 Nov 2026: "go with the five-place navigation proposal", docs/navigation-review.md): Home,
   Skills (every skill and Combat), Quests, Town (projects, the shop, your house and workers, the map) and Journal (the
   field guide and everything you have done). Hero is the portrait in the corner: backpack, tools, bank and settings.
   Old menu ids (world, village, guide, shop) still work: UI.DO.hub maps them to their new place. */
const HUBS = [
  { id: 'home', name: 'Home', ic: 'home', pages: ['overview', 'activity'] },
  { id: 'skills', name: 'Skills', ic: 'star', pages: ['fishing', 'woodcutting', 'mining', 'thieving', 'farming', 'hunting', 'cooking', 'smithing', 'crafting', 'brewery', 'enchanting', 'research', 'carpentry', 'sailing', 'beastmastery', 'exploration'] },
  { id: 'combat', name: 'Combat', ic: 'attack', pages: ['combat', 'tower', 'melee', 'ranged', 'magic'] },
  { id: 'quests', name: 'Quests', ic: 'quest', pages: ['quests', 'people'] },
  { id: 'town', name: 'Town', ic: 'house', pages: ['projects', 'shop', 'house', 'hirelings', 'map'] },
  { id: 'journal', name: 'Journal', ic: 'book', pages: ['bestiary', 'collection', 'achievements', 'museum', 'skillsummary', 'mastery', 'journal'] },
  { id: 'hero', name: 'Hero', ic: 'bag', pages: ['character', 'tools', 'bank', 'settings'] },
];
/* the page menu along the top (desktop) and the bottom bar (phones): the same five */
const TOP = ['home', 'skills', 'quests', 'town', 'journal'];
const ALIAS = { world: ['town', 'map'], village: ['town', 'projects'], shop: ['town', 'shop'], guide: ['journal', 'bestiary'] };
/* a menu entry is "on" for its own pages and, for Skills, Combat's */
const topOf = id => id === 'combat' ? 'skills' : id;
const UTILITIES = { id: 'settings', name: 'Settings', pages: ['balance'] };
const TAB = { journal:['Story','quest'], arts:['Combat arts','book'], melee:['Melee','attack'], ranged:['Ranged','ranged'], museum:['Museum','museum'], tower:['Trial tower','shield'], collection:['Collection','star'], carpentry:['Carpentry','carpentry'], sailing:['Sailing','sailing'], beastmastery:['Beastmastery','beastmastery'], hunting:['Hunting','paw'], exploration:['Exploration','map'], enchanting:['Enchanting','rune'], brewery: ['Herbalism', 'bottle'], overview: ['Home', 'home'], skillsummary: ['Skill levels', 'star'], tools: ['Tools', 'mining'], activity: ['Activity', 'clock'], journal: ['Journal', 'book'], projects: ['Town projects', 'house'], combat: ['Fight', 'attack'], bestiary: ['Field guide', 'book'], map: ['Map', 'map'], quests: ['Quests', 'quest'], people: ['People', 'users'], shop: ['Shop', 'shop'], character: ['Inventory & equipment', 'bag'], bank: ['Bank', 'bank'], house: ['House', 'house'], hirelings: ['Workers', 'users'], achievements: ['Achievements', 'trophy'], mastery: ['Mastery', 'trophy'], research: ['Scholarship', 'book'], settings: ['Settings', 'gear'] };
UI.hubOf = p => HUBS.find(h => h.pages.includes(p)) || (UTILITIES.pages.includes(p) ? UTILITIES : HUBS[0]);
const lastIn = {};
const hubDefault = h => {
  if (h.id === 'home') return 'overview';
  if (lastIn[h.id]) return lastIn[h.id];
  if (h.id === 'skills') { const ap = DQ.actPage && DQ.actPage(); return ap && h.pages.includes(ap) ? ap : 'fishing'; }
  return h.pages[0];
};

/* A skill row in the left menu celebrates its level-up: a light sweep and a bounce of the level number (CSS, on the
   browser's own timeline). Re-renders during the animation resume it where it was instead of restarting it. */
UI.levelPop = {};
let lastCombat = null;
DQ.on && DQ.on('levelup', sk => {
  const now = Date.now(); UI.levelPop[sk] = now;
  const c = DQ.combatLvl(); if (lastCombat != null && c > lastCombat) UI.levelPop.combat = now; lastCombat = c;
  const row = document.querySelector(`#skilldock .dk[data-a="${D.SK[sk] ? D.SK[sk].page : sk}"]`);
  if (row) { row.classList.remove('lvl-pop'); void row.offsetWidth; row.style.setProperty('--pop-delay', '0ms'); row.classList.add('lvl-pop'); }
  if (UI.levelPop.combat === now) { const e = document.querySelector('#combatnav .combat-entry'); if (e) { e.classList.remove('lvl-pop'); void e.offsetWidth; e.style.setProperty('--pop-delay', '0ms'); e.classList.add('lvl-pop'); } }
});
const topNav = () => { const cur = topOf(UI.hubOf(UI.view).id); return `<nav class="topnav" id="topnav" aria-label="Pages">${TOP.map(id => { const h = HUBS.find(x => x.id === id), on = id === cur; return `<button class="tnav ${on ? 'on' : ''}" data-do="hub" data-a="${id}" aria-label="${h.name}" ${on ? 'aria-current="page"' : ''}>${ico(h.ic)}<span>${h.name}</span><i class="hubdot" data-b="hubdot:${id}"></i></button>`; }).join('')}</nav>`; };
UI.renderRail = () => {
  if (lastCombat == null && DQ.S) lastCombat = DQ.combatLvl();
  const cur = UI.hubOf(UI.view).id;
  $('#rail').innerHTML = `<div class="brand">${ico('candle')}<b>Idlewick</b></div>` + TOP.map(id=>HUBS.find(h=>h.id===id)).map(h => `<button class="hub ${h.id === topOf(cur) ? 'on' : ''}" data-do="hub" data-a="${h.id}" aria-label="${h.name}">${ico(h.ic)}<span>${h.name}</span><i class="hubdot" data-b="hubdot:${h.id}"></i></button>`).join('');
  const cpop=UI.levelPop.combat,cpopping=cpop&&Date.now()-cpop<1600;
  $('#combatnav').innerHTML=`<button class="hub combat-entry ${cur==='combat'?'on':''} ${cpopping?'lvl-pop':''}" ${cpopping?`style="--c:var(--brass);--pop-delay:-${Date.now()-cpop}ms"`:''} data-do="hub" data-a="combat" aria-label="Combat">${ico('attack')}<span>Combat</span><b class="combat-menu-level mono" data-b="combat">${DQ.combatLvl()}</b><i class="hubdot" data-b="hubdot:combat"></i><span class="combat-menu-bar bar"><i data-b="combatbar" style="width:${DQ.combatProgress().pct.toFixed(1)}%"></i></span></button>`;
  UI.upd();
};
UI.B.notice = (e, page) => {
  const n = DQ.noticeCount ? DQ.noticeCount(page) : 0;
  /* rail rows show a dot, never a number (AGENTS.md); the count stays in the label */
  e.hidden = !n; UI.set(e, e.closest('#skilldock,#dock') ? '' : n > 9 ? '9+' : n);
  e.setAttribute('aria-label', n + ' available actions');
};
/* a dot only for something you can do now: a quest to hand in, a site to finish, a crop to pick, a decision waiting;
   not new quests on offer or things the shop could sell you (owner, 27 Nov 2026: the phone bar was "very busy") */
DQ.nowCount = pages => pages.flatMap(p => DQ.actionTargets ? DQ.actionTargets(p) : []).filter(t => t.kind !== 'quest-new' && t.page !== 'shop').length + (pages.includes('activity') ? (S().inbox || []).length : 0);
UI.B.hubdot = (e, h) => {
  let n = 0, live = false;
  const pages = h === 'skills' ? HUBS.filter(x => x.id === 'skills' || x.id === 'combat').flatMap(x => x.pages) : (HUBS.find(hub => hub.id === h)?.pages || []);
  if (h === 'skills' || h === 'combat') { const ap = DQ.act && DQ.actPage(); live = !!ap && pages.includes(ap); }
  n = DQ.nowCount(pages);
  /* top menu (20 Nov): a clear dot says "something to do here"; the count lives in the label, not in tiny text */
  if (e.closest('.tnav')) { e.className = 'hubdot' + (n ? ' todo' : live ? ' live' : ''); UI.set(e, ''); const b = e.closest('.tnav'), base = b.dataset.label || (b.dataset.label = b.getAttribute('aria-label')); b.setAttribute('aria-label', n ? `${base}, ${n} to do` : base); return; }
  e.className = 'hubdot' + (n ? ' todo' : live ? ' live' : ''); UI.set(e, ''); const b = e.closest('.hub'); if (b) { const base = b.dataset.label || (b.dataset.label = b.getAttribute('aria-label')); b.setAttribute('aria-label', n ? `${base}, ${n} to do` : base); }
};
const subnav = () => {
  const h = UI.hubOf(UI.view), el = $('#subnav'); if (!el) return;
  if (h.pages.length === 1) { el.innerHTML = ''; return; }
  const pages = h.pages.filter(p => p !== 'arts' && ((innerWidth<=860 || !(D.SK[p] || p === 'brewery') || p === 'exploration') && p !== 'balance' || S().settings.dev || UI.view === 'balance'));
  if(h.id==='skills'&&innerWidth>860){el.innerHTML='';return;}
  const tabs = pages.map(p => `<button class="stab ${p === UI.view ? 'on' : ''}" data-do="go" data-a="${p}" ${p === UI.view ? 'aria-current="page"' : ''}>${ico(TAB[p]?.[1] || D.SK[p]?.id || 'gear')}<span>${TAB[p]?.[0] || D.SK[p]?.name || DQ.cap(p)}</span><span class="notice-badge" data-b="notice:${p}" hidden></span></button>`).join('');
  el.innerHTML = `<nav class="subnav ${h.id}" aria-label="${h.name} pages">${tabs}</nav>`;
  /* centre the active tab by scrolling the tab strip sideways only, never the page */
  const bar = $('.subnav', el), on = $('.stab.on', el); if (bar && on) bar.scrollLeft = on.offsetLeft - bar.clientWidth / 2 + on.offsetWidth / 2;
  if (bar) { const fade = () => { bar.classList.toggle('fade-l', bar.scrollLeft > 4); bar.classList.toggle('fade-r', bar.scrollLeft + bar.clientWidth < bar.scrollWidth - 4); }; fade(); bar.addEventListener('scroll', fade, { passive: true }); }
};
UI.openMenuAction = target => {
  if(!target)return false;
  if(target.page==='quests'){UI.questTab=target.kind==='quest-ready'?'active':'available';UI.tab.questSelected=target.id;}
  if(target.page==='projects')UI.tab.projectChoice=target.id;
  if(target.page==='research')UI.tab.researchChoice=target.id;
  if(target.page==='shop'&&target.kind==='tool'){UI.shopTab='buy';UI.shopCategory='tools';UI.shopToolFamily=target.family;UI.shopSelected.buy=target.id;}
  if(target.page==='farming'){const animal=target.kind==='animal';UI.estateSection=animal?'pens':'fields';UI.estateTab=animal?'animals':'seeds';UI.tab.farmSection=animal?'livestock':'crops';if(animal)UI.estatePenPage=Math.floor(target.id/(innerWidth<=860?2:innerWidth<=1440?4:6));else UI.estateFieldPage=Math.floor(target.id/(innerWidth<=860?4:innerWidth<=1440?6:12));}
  DQ.go(target.page);return true;
};
const menuTarget=pages=>pages.flatMap(page=>DQ.actionTargets?.(page)||[])[0];
UI.DO.hub = a => { if (ALIAS[a]) return DQ.go(ALIAS[a][1]); const h=HUBS.find(x=>x.id===a);if(!h)return;const target=menuTarget(h.pages);if(!UI.openMenuAction(target))DQ.go(hubDefault(h)); };
const go0=UI.DO.go;UI.DO.go=(page,b,el)=>{if(el?.matches('.dk,.stab')&&UI.openMenuAction(menuTarget([page])))return;return go0(page,b,el);};
const prevRender = UI.render;
UI.render = fresh => {
  prevRender(fresh); lastIn[UI.hubOf(UI.view).id] = UI.view; subnav(); UI.renderDock(); UI.renderPins(); UI.packWarn(true); UI.upd();
  const cur = topOf(UI.hubOf(UI.view).id); $$('.hub').forEach(b => b.classList.toggle('on', b.dataset.a === cur || (b.dataset.a === 'combat' && UI.hubOf(UI.view).id === 'combat')));
  $$('#topnav .tnav').forEach(b => { const on = b.dataset.a === cur; b.classList.toggle('on', on); if (on) b.setAttribute('aria-current', 'page'); else b.removeAttribute('aria-current'); });
  UI.markNow();
};
/* The Now card is outlined when its activity is the page you are looking at. */
UI.markNow = () => { const n = $('#nowcard .now'); if (n) n.classList.toggle('here', !!DQ.act && DQ.actPage && DQ.actPage() === UI.view); };

/* ---------- The skills menu: a second menu, always in reach, so the things people open most are one click away ---------- */
/* what the next level of a skill opens, for the left-menu tooltip */
/* what the next level brings, without spoiling locked content: perks by name; anything else is not named and leaves no
   placeholder (Part C Task 26: a preview names a real reward or says nothing), so callers drop the clause on '' */
UI.unlockShort = nx => { if (!nx) return ''; const all = String(nx.what).split(/, (?![^()]*\))/), perks = all.filter(x => /\(.+\)$/.test(x) && !/^Technique:/.test(x));
  return perks.join(' · '); };
UI.nextUnlock = sk => { const L = DQ.lvl(sk), u = D.UNL && D.UNL[sk]; if (!u) return null; const lvl = Object.keys(u).map(Number).filter(l => l > L).sort((a, b) => a - b)[0]; return lvl ? { lvl, what: [].concat(u[lvl]).join(', ') } : null; };
// Stable progression order: starter activities, early making, then linked and regional unlocks.
const dockOrder=['fishing','woodcutting','cooking','mining','farming','crafting','smithing','hunting','carpentry','beastmastery','exploration','thieving','research','herbalism','magic','enchanting','sailing'];
UI.skillDockOrder=()=>D.SKILLS.filter(s=>s.group!=='combat').sort((a,b)=>{
 const starter=s=>!s.quest&&!s.actionReq&&s.unlock<=1;
 return Number(starter(b))-Number(starter(a))||(dockOrder.indexOf(a.id)<0?999:dockOrder.indexOf(a.id))-(dockOrder.indexOf(b.id)<0?999:dockOrder.indexOf(b.id));
});
/* every skill stays in the rail, locked ones with their lock and requirement (owner, 26 Nov 2026: "I absolutely do not
   want them collapsed or invisible, I want people to be able to see what they're unlocking") */
UI.skillDockVisible = () => UI.skillDockOrder();
/* how far a locked skill's requirements are met, averaged over its live counters (0-100) */
UI.unlockPct = sk => { try { const s = D.SK[sk]; let parts = [];
  if (s.actionReq && DQ.actionProgress) parts = DQ.actionProgress(sk).map(r => Math.min(1, (r.have || 0) / Math.max(1, r.need || 1)));
  else if (s.quest && D.QM[s.quest]) { const q = D.QM[s.quest], p = S().q[q.id]; parts = p && p.s === 'done' ? [1] : q.obj.map((o, i) => p && DQ.objProg ? Math.min(1, DQ.objProg(q, p, i) / o.n) : 0); }
  else if (s.unlock) parts = [Math.min(1, (DQ.advLvl ? DQ.advLvl() : 1) / s.unlock)];
  return parts.length ? Math.round(100 * parts.reduce((a, b) => a + b, 0) / parts.length) : 0; } catch (e) { return 0; } };
UI.lockedSkillsLink = (action = 'go') => {
  const count = UI.skillDockOrder().filter(skill => !DQ.skillUnlocked(skill.id)).length;
  return count && action !== 'go' ? `<button class="btn sm dk-requirements" data-do="${action}" data-a="skillsummary">Locked skills · ${count}</button>` : '';
};
UI.renderDock = () => {
  const el = $('#skilldock'); if (!el) return;
  const cur = UI.view, ap = DQ.act && DQ.actPage ? DQ.actPage() : null;
  el.innerHTML = `<div class="dk-h">Skills</div>` + UI.skillDockVisible().map(s => {
    const lock = !DQ.skillUnlocked(s.id);
    const lv=DQ.lvl(s.id),need=lv>=99?0:Math.max(0,D.XPF[lv+1]-(S().xp[s.id]||0));
    const pop = UI.levelPop[s.id], popping = pop && Date.now() - pop < 1600;
    return `<button class="dk ${cur === s.page ? 'on' : ''} ${lock ? 'locked' : ''} ${popping ? 'lvl-pop' : ''} ${DQ.act && DQ.act.kind !== 'fight' && DQ.actSkill && DQ.actSkill() === s.id ? 'working' : ''}" style="--c:${s.col}${popping ? `;--pop-delay:-${Date.now() - pop}ms` : ''}" data-tip="rail:${s.id}" data-do="go" data-a="${s.page}" aria-label="${s.name}${lock ? ": " + esc(DQ.unlockHow(s.id)) : ""}">${DQ.artImage('skill',s.id,40,'skill-emblem',s.name)}<span class="dk-info"><span class="dk-top"><span class="dk-n">${s.name}</span><span class="notice-badge" data-b="notice:${s.page}" hidden></span>${!lock && S().unlocked[s.id] && S().newSkills && S().newSkills[s.id] ? '<span class="dk-new">New</span>' : ''}${lock?ico('lock'):`<b class="mono" data-b="lvl:${s.id}">${lv}</b>`}</span>${lock?`<span class="bar dk-req" title="Progress toward learning it"><i style="width:${UI.unlockPct(s.id)}%"></i></span>`:''}${lock?'':`<span class="bar"><i data-b="xpbar:${s.id}" style="width:${DQ.pctNext(s.id)}%"></i></span>`}</span>${!lock && ap === s.page ? '<i class="dk-live" aria-label="Working"></i>' : ''}</button>`;
  }).join('') + UI.lockedSkillsLink();
  UI.upd();
};
/* A newly unlocked skill wears a small "New" badge in the rail until its page is first opened. */
const notifyNew0 = DQ.notify;
DQ.notify = o => { const k = o && o.key || ''; if (o && o.kind === 'unlock' && k.startsWith('unlock:') && D.SK[k.slice(7)]) { const st = S(); (st.newSkills = st.newSkills || {})[k.slice(7)] = true; } const r = notifyNew0(o); UI.renderDock && UI.renderDock(); return r; };
const goNew0 = DQ.go;
DQ.go = id => { const st = S(), sk = st && st.newSkills && Object.keys(st.newSkills).find(k => D.SK[k] && D.SK[k].page === id); if (sk) { delete st.newSkills[sk]; } const r = goNew0(id); if (sk) UI.renderDock(); return r; };
DQ.on('act', () => UI.renderDock && UI.renderDock());
DQ.on('lvl', () => UI.renderDock && UI.renderDock());

UI.DO.nowactivity = () => {
  const a = DQ.act;
  if (!a) return;
  const page = DQ.actPage();
  if (a.kind === 'hunt' || (a.kind === 'train' && a.id.startsWith('lure:'))) return UI.focusHuntingActivity(a);
  if (a.kind === 'drill') return UI.focusPractice(page, a.id);
  if (a.kind === 'alch') UI.tab.magic = 'Alchemy';
  if (page === 'combat') {
    UI.routeSource = null;
    return UI.view === page ? UI.render(false) : DQ.go(page);
  }
  UI.focusTask(page, a.id);
};
/* ---------- Top bar ---------- */
UI.renderHud = () => {
  const a = DQ.act, sk = a && DQ.actSkill(), s = sk && D.SK[sk], fight = a && a.kind === 'fight' && D.MON[a.id];
  const taskArt = a && (fight ? DQ.monSprite(fight, 48) : a.kind === 'recipe' ? DQ.itemIco(D.ITEMS[Object.keys(D.RECIPES[a.id].out)[0]]) : a.kind === 'alch' ? DQ.itemIco(D.ITEMS[a.id]) : (() => { const n = (D.NODES[a.kind] || []).find(x => x.id === a.id); return n && D.ITEMS[n.item] ? DQ.itemIco(D.ITEMS[n.item]) : DQ.artImage(a.kind, a.id, 48, '', DQ.actLabel()); })());
  const task = a ? `<div class="h-task" style="--c:${s ? s.col : '#d8a64a'}">
      <button type="button" class="h-tic" data-do="plan" aria-label="Task plan" data-tip="text:Pace, stop rule and queue">${taskArt}</button>
      <button class="h-tb" data-do="nowactivity" data-tip="text:Go to this activity"><span class="h-t1"><b>${esc(DQ.actLabel().replace(/ rock$/, ''))}</b><span class="h-meta"><span data-b="hud:eta"></span><span data-b="hud:rate"></span></span></span><span class="bar prog" role="img" aria-label="This action"><i data-prog="@"></i></span>${sk ? `<span class="bar h-xp" role="img" aria-label="${esc(s.name)} level progress" data-tip="text:${esc(s.name)} level progress"><i data-b="xpbar:${sk}"></i></span>` : ''}<span class="h-t3"><small>${fight ? `Combat <b class="mono" data-b="combat"></b> vs Lv ${fight.cl} · ` : s ? `${s.name} <b class="mono" data-b="lvl:${sk}"></b> · ` : ''}${D.PACE[a.pace || 'steady'].name}${(S().queue || []).length ? ` · ${S().queue.length} queued` : ''} · <span data-b="hud:count"></span></small><span class="hq hb" data-b="hudbuff" hidden></span></span></button>
      <button class="h-stop" data-do="stop" aria-label="Stop this task" data-tip="text:Stop this task (Space)"><i class="stop-sq" aria-hidden="true"></i><span>Stop</span></button></div>`
    : `<div class="h-task idle"><span class="h-tic">${ico('clock')}</span><div class="h-tb"><b>Nothing running</b><small>${esc(S().lastPlannedStop || 'Choose your next step on Home')}</small><span class="hq hb" data-b="hudbuff" hidden></span></div>${S().lastAct ? `<button class="btn sm primary" data-do="resume">Resume</button>` : `<button class="btn sm" data-do="go" data-a="overview">Your destination</button>`}</div>`;
  const nowEl = $('#nowcard');
  if (nowEl) nowEl.innerHTML = a ? `<div class="now" style="--c:${s ? s.col : '#d8a64a'}">
      <span class="now-k">Now<i> · on this page</i>${(S().queue || []).length ? `<em class="now-next"> · then ${esc(DQ.actLabel(S().queue[0]).replace(/ rock$/, ''))}${S().queue.length > 1 ? ` +${S().queue.length - 1}` : ''}</em>` : ''}</span>
      <button class="now-go" data-do="nowactivity" data-tip="text:Go to this activity"><span class="now-ic">${taskArt}</span><b>${esc(DQ.actLabel().replace(/ rock$/, ''))}</b></button>
      <span class="bar prog" role="img" aria-label="This action"><i data-prog="@"></i></span>
      <span class="now-f"><button class="now-plan" data-do="plan" data-tip="text:Pace, stop rule and queue"><span data-b="hud:count"></span><span class="hq hb" data-b="hudbuff" hidden></span></button><button class="now-stop" data-do="stop" aria-label="${fight ? 'Retreat' : 'Stop this task'}" data-tip="text:${fight ? 'Retreat' : 'Stop this task'} (Space)"><i class="stop-sq" aria-hidden="true"></i><span class="now-sl">${fight ? 'Retreat' : 'Stop'}</span></button></span></div>`
    : `<div class="now idle"><span class="now-k">Now</span><b class="now-idle">Nothing running</b>${S().lastPlannedStop ? `<small class="now-why" data-tip="text:${esc(S().lastPlannedStop)}">${esc(S().lastPlannedStop)}</small>` : ''}${S().lastAct ? `<button class="btn sm primary" data-do="resume">Resume</button>` : `<small>Pick a skill below to start</small>`}</div>`;
  $('#hud').innerHTML = `<button class="h-hero" data-do="go" data-a="character" data-tip="text:Your inventory">${UI.portrait(48)}<span class="h-lv mono" data-b="adv"></span></button>
    <div class="h-name"><b>${esc(S().name)}</b><span class="bar" role="img" aria-label="Hero level progress"><i data-b="advbar"></i></span><small>${DQ.heroTitle() ? `<i class="h-title">${esc(DQ.heroTitle())}</i>` : `Hero level <span data-b="adv"></span> · <span data-b="advline"></span>`}</small><div class="hp h-hp" data-tip="text:Health"><span class="bar" role="img" aria-label="Health"><i data-b="hpbar"></i></span><small class="mono" data-b="hptxt"></small></div></div>
    ${UI.petBadge ? UI.petBadge() : ''}${topNav()}${task}
    <div class="h-stats"><div class="h-coin" data-tip="text:Coins">${ico('coin')}<b class="mono" data-b="coins"></b></div></div>
    <div class="h-btns"><button class="packchip" data-do="go" data-a="character" data-tip="text:Backpack">${ico('bag')}<span class="mono" data-b="packchip"></span></button><button class="iconb" data-do="go" data-a="map" aria-label="Travel: you are in ${esc(D.TOWN[S().town].name)}" data-tip="text:${esc(D.TOWN[S().town].name)} · open the map">${ico('pin')}</button><button class="iconb bellb" data-do="bell" aria-label="Recent activity" data-tip="text:Recent activity">${ico('bell')}<i class="belldot" data-b="belldot" hidden></i></button><button class="iconb" data-do="go" data-a="settings" aria-label="Settings" data-tip="text:Settings">${ico('gear')}</button><button class="iconb" data-do="mute" aria-label="Mute" data-tip="text:${S().settings.muted ? 'Unmute (M)' : 'Mute (M)'}">${ico(S().settings.muted ? 'mute' : 'sound')}</button></div>`;
  UI.markNow(); UI.upd(); UI.collectProg();
};

/* ---------- Pinned quests: one slim strip ---------- */
UI.renderPins = () => {
  const box = $('#pins'); if (!box) return;
  const project = UI.projectPinHtml ? UI.projectPinHtml() : '';
  if (UI.view === 'quests') { box.innerHTML = project; UI.upd(); return; }
  const pins = (S().pins || []).filter(id => D.QM[id] && DQ.questState(D.QM[id]) !== 'done'); S().pins = pins;
  const eligible=pins.filter(id=>['active','ready'].includes(DQ.questState(D.QM[id])));
  // Keep one useful objective visible across ordinary navigation, preferring this activity's pin.
  const relevant=eligible.find(id=>{const q=D.QM[id],o=q.obj.find((o,j)=>DQ.objProg(q,S().q[id],j)<o.n);return o&&DQ.objPage(q,o)===UI.view;});
  const ids=relevant?[relevant]:eligible.slice(0,1);
  if (!ids.length) { box.innerHTML=project;UI.upd();return; }
  box.innerHTML = project + `<div class="pinstrip">${ids.map(id => {
    const q = D.QM[id], st = DQ.questState(q), p = S().q[id], i = Math.max(0, q.obj.findIndex((o, j) => DQ.objProg(q, p, j) < o.n)), o = q.obj[i], sk = q.main && D.SK[q.unlocks];
    const act = st === 'new' ? `data-do="qstart" data-a="${id}"` : st === 'ready' ? `data-do="openquest" data-a="${id}"` : `data-do="questcontinue" data-a="${q.id}"`;
    return `<button class="pinchip ${st}" style="${sk ? `--c:${sk.col}` : ''}" ${act} data-tip="text:${esc(q.name)}: ${esc(o.label)}">${ico(q.main ? 'star' : 'quest')}<span class="pc-t"><b>${q.name}</b><small>${st==='ready'?'Ready to return to '+esc(q.giver):esc(o.label)}</small></span><span class="pc-p"><span class="bar"><i data-b="qbar:${id}:${i}"></i></span><small class="mono" data-b="qtxt:${id}:${i}"></small></span>${ico('arrow')}</button>`;
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
  const welcome = '';
  /* other suggestions wait until the first quest is done, so the opening has one clear action */
  const opening = S().q.first_steps?.s !== 'done';
  const decisions = (S().inbox || []).length;
  return `${welcome}${UI.homeSections.map(render => render()).join('')}
    ${decisions ? `<button class="btn sm" data-do="go" data-a="activity">${decisions} decision${decisions === 1 ? '' : 's'} waiting · View activity</button>` : ''}
    ${UI.homeNotices()}
    ${opening ? '' : `<section data-reference="true" class="panel upnext"><h3>Explore other suggestions</h3>
      <div id="goalbox">${UI.homeGoals()}</div>
    </section>`}`;
};
const skillSummaryRows = skills => skills.map(skill => {
  const locked = !DQ.skillUnlocked(skill.id);
  return `<button class="skrow ${locked ? 'locked' : ''}" data-do="go" data-a="${skill.page}" style="--c:${skill.col}">${locked ? ico('lock') : DQ.artImage('skill',skill.id,32,'skill-emblem',skill.name)}<span>${skill.name}</span>${locked ? `<small>${esc(DQ.unlockHow(skill.id))}</small>` : `<b class="mono" data-b="lvl:${skill.id}"></b><span class="bar"><i data-b="xpbar:${skill.id}"></i></span>${(nx => nx ? `<small class="sk-next">Lv ${nx.lvl}${UI.unlockShort(nx) ? ` · ${esc(UI.unlockShort(nx))}` : ''}</small>` : '')(UI.nextUnlock && UI.nextUnlock(skill.id))}`}</button>`;
}).join('');
UI.V.skillsummary = () => {
  const open = D.SKILLS.filter(skill => DQ.skillUnlocked(skill.id));
  const locked = D.SKILLS.filter(skill => !DQ.skillUnlocked(skill.id));
  return `<section class="panel skill-summary"><div class="phead"><h2>Your skills</h2><small>Total level <b data-b="totlvl"></b></small>
    <button class="btn sm" data-do="skiponboarding" aria-pressed="${!!S().tut.showLockedSkills}">${S().tut.showLockedSkills ? 'Onboarding skipped' : 'Skip onboarding'}</button></div>
    <div class="skill-summary-scroll"><div class="skl">${skillSummaryRows(open)}</div>
    ${locked.length ? `<section class="skill-requirement-group"><h3>Locked skills · requirements</h3><div class="skl">${skillSummaryRows(locked)}</div></section>` : ''}</div></section>`;
};
UI.DO.skiponboarding = () => {
  S().tut.showLockedSkills = !S().tut.showLockedSkills;
  if (S().tut.showLockedSkills) {
    S().tut.done.intro = true;
    S().tut.hidden = true;
  }
  DQ.save();
  UI.render(false);
};
UI.V.activity = () => `${UI.inboxPanel() || `<section class="panel inbox-empty">${UI.emptyState('table', 'No decisions waiting. The village is coping, somehow.', 'World events you leave for later wait here.', 'row')}</section>`}<section class="panel"><div class="phead"><h2>Activity</h2><small class="mono" id="xph"></small></div><div id="chart"></div><ul class="log" id="loglist"></ul></section>`;
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
/* The skill column fills the window (Dec 2026, from the player: "the skills menu down the left doesn't adapt to the
   height of the screen"). Rows share the height from the top of the list to the bottom of the window, between 34 and
   64 page pixels each; text and emblems keep their size, only the row gets taller. Measured in page pixels (the page
   is zoomed), and again on resize and whenever the dock is redrawn. */
(() => {
  const DQ = window.DQ, UI = DQ.ui;
  const fit = () => {
    const el = document.getElementById('skilldock'); if (!el || innerWidth <= 860) { if (el) el.style.removeProperty('--dk-h'); document.documentElement.classList.remove('dock-fit'); return; }
    const rows = el.querySelectorAll('.dk'), head = el.querySelector('.dk-h'); if (!rows.length) return;
    const z = DQ.zoom || 1, top = el.getBoundingClientRect().top / z, bottom = innerHeight / z - 18, gap = parseFloat(getComputedStyle(el).rowGap) || 3;
    const requirements = el.querySelector('.dk-requirements');
    const fixed = [head, requirements].reduce((height, element) => height + (element ? element.getBoundingClientRect().height / z + gap : 0), 0);
    const avail = bottom - top - fixed - gap * Math.max(0, rows.length - 1);
    const h = Math.max(34, Math.min(64, Math.floor(avail / rows.length)));
    el.style.setProperty('--dk-h', h + 'px'); document.documentElement.classList.add('dock-fit');
  };
  const render0 = UI.renderDock;
  UI.renderDock = () => { render0(); requestAnimationFrame(fit); };
  addEventListener('resize', () => requestAnimationFrame(fit));
  // Task wording and local fonts can change the space above the dock after it was drawn.
  for (const id of ['nowcard','combatnav']) { const box=document.getElementById(id);if(box)new ResizeObserver(()=>requestAnimationFrame(fit)).observe(box); }
  document.fonts?.ready.then(()=>requestAnimationFrame(fit));
  UI.fitDock = fit;
})();
/* Inventory on desktop: Appearance & sharing sits under Preparations in the right column, so the equipment column fits short windows */
(() => { const UI = window.DQ.ui; const r0 = UI.render; UI.render = (...a) => { const r = r0(...a); try { if (UI.view === 'character' && innerWidth > 860) { const ap = document.getElementById('equipment-appearance'), col = document.querySelector('#view .character-layout>.col'); if (ap && col && ap.parentElement !== col) { ap.classList.add('panel', 'appearance-side'); col.appendChild(ap); } } } catch (e) {} return r; }; })();
/* keep the locked rows' requirement bars live as logs, fish and kills come in */
(() => { const DQ = window.DQ, UI = DQ.ui; const upd = () => { document.querySelectorAll('#skilldock .dk.locked').forEach(b => { const i = b.querySelector('.dk-req i'), sk = (b.dataset.tip || '').replace('rail:', ''); if (i && sk && UI.unlockPct) i.style.width = UI.unlockPct(sk) + '%'; }); };
  DQ.on('workcycle', upd); DQ.on('kill', upd); DQ.on('ui', () => { if (Math.random() < .2) upd(); }); })();
