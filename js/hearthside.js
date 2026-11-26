/* Hearthside Journal extends the existing journey and screen components; it never starts work on navigation. */
(() => {
const Q=window.DQ,D=Q.data,U=Q.ui,S=()=>Q.S,{esc,ico}=Q;
document.documentElement.classList.add('hearthside');
const questFor=next=>{
 if(D.QM[next.a])return D.QM[next.a];
 if(next.action==='journeytask')return Q.questLinks?.(next.a,next.b)?.[0]?.q||null;
 if(next.action==='go'&&next.a==='quests')return D.QM.first_steps&&Q.questState(D.QM.first_steps)!=='done'?D.QM.first_steps:null;
 return null;
};
const journey0=U.journeyPanel;
U.journeyPanel=()=>{
 const html=journey0(),next=Q.journeyNext(),main=Q.mainQuestProgress?.(),q=main ? D.QM[main.id] : questFor(next);
 if(Q.goalDone()&&!main)return html;
 const t=document.createElement('template');t.innerHTML=html;const panel=t.content.querySelector('.journey');if(!panel)return html;
 if(next.optional){
  const kicker=panel.querySelector('.phead .k');
  if(kicker)kicker.textContent='Optional side story';
 }
 const taskButton=panel.querySelector('.btn.primary');
 if(taskButton&&next.action==='journeytask'){
  const recipe=next.a==='recipe'&&D.RECIPES[next.b],node=D.NODE[next.a+':'+next.b],running=Q.act?.kind===next.a&&Q.act?.id===next.b;
  const verb=recipe?({cooking:'Cook',smithing:recipe.ev==='smelt'?'Smelt':'Forge',crafting:'Craft',carpentry:'Make'}[recipe.skill]||'Make'):({fish:'Fish',wood:'Chop',mine:'Mine',thieve:'Pickpocket'}[next.a]||'Start');
  taskButton.textContent=running?'Open the active task':verb+' '+(recipe?.name||node?.name||next.title);
 }

 const completion=panel.querySelector('.journey-done');if(completion){if(q)completion.remove();else{completion.innerHTML='<b>Done when:</b> '+esc(completion.textContent.trim().replace(/^Done when\s*/i,''));completion.classList.add('hs-completion-hint');}}
 if(!q)return panel.outerHTML;
 const state=Q.questState(q),p=S().q[q.id];
 const person=document.createElement('div');person.className='hs-chapter-person';person.innerHTML=`${Q.folkPortrait(q.giver,64)}<div><small>${q.main?'Main story':'Side story'} · ${esc(D.TOWN[q.town].name)}</small><h3>${esc(q.name)}</h3><small>${esc(q.giver)}</small></div>`;panel.prepend(person);
 const rows=document.createElement('div');rows.className='hs-chapter-steps';rows.setAttribute('aria-label','Chapter progress');
 rows.innerHTML=q.obj.map((o,i)=>{const have=state==='done'?o.n:Math.min(o.n,Q.objProg(q,p,i)),done=have>=o.n;return `<div class="hs-chapter-step"><span>${done?ico('check'):U.objectiveIcon(q,o)}${esc(o.label)}</span><b class="mono" ${p?`data-b="qtxt:${q.id}:${i}"`:''}>${have} / ${o.n}</b></div>`;}).join('');
 const action=panel.querySelector('.btnrow');if(action)panel.insertBefore(rows,action);
 if(next.action==='go'&&next.a==='quests'&&state==='new'){const button=panel.querySelector('.btn.primary');if(button){button.dataset.do='openquest';button.dataset.a=q.id;button.textContent='Meet '+q.giver;}}
 return panel.outerHTML;
};
const i=U.homeSections.indexOf(journey0);if(i>=0)U.homeSections[i]=U.journeyPanel;
const home0 = U.V.overview, activity0 = U.V.activity;
const homeRate = () => {
 const act = Q.act;
 if (!act) return S().lastPlannedStop || 'No activity running';
 const skill = Q.actSkill(act), node = D.NODE[act.kind + ':' + act.id], recipe = act.kind === 'recipe' && D.RECIPES[act.id];
 const xp = (recipe || node)?.xp;
 const rate = xp && skill && act.kind !== 'thieve' && !recipe?.burn ? `${Q.fmt(xp * Q.xpMult(skill) * 3600000 / Q.actDur(act))} XP/hour estimated` : 'Earnings vary';
 return `${Q.actLabel()} · Running · ${rate}`;
};
const homeGlance = () => {
 const town = D.TOWN[S().town], main = Q.mainQuestProgress?.();
 const project = [S().journey, S().pinnedProject, !main && Q.closestRestoration()].find(id => D.PROJECTS[id]?.town === town.id && !S().projects[id]);
 const next = Q.journeyNext(project || S().journey);
 const goal = project ? { name: D.PROJECTS[project].name, label: 'Bundles complete',
   have: Object.keys(D.PROJECTS[project].cost).length - Object.keys(Q.projectNeed(project)).length,
   need: Object.keys(D.PROJECTS[project].cost).length } : main;
 /* a checklist step (boss_checklist.js): its first open item is the main action, then Skip; the list sits in the card */
 const todo = next.checklist && next.checklist.items.find(i => !i.done && i.action);
 const button = next.checklist ? `${todo ? `<button class="btn primary" data-do="${todo.action.do}" data-a="${esc(todo.action.a)}">${esc(todo.key === 'armour' || todo.key === 'ability' ? todo.label : todo.action.text)}</button>` : ''}<button class="btn" data-do="bossprepskip" data-a="${esc(next.a || '')}">Skip checks</button>`
   : `<button class="btn primary" data-do="${next.action}" data-a="${esc(next.a || '')}" data-b="${esc(next.b || '')}">${esc(next.title)}</button>`;
 const count = S().inbox?.length || 0;
 const local = (town.id !== 'willowbrook' || S().q.goblin_menace?.s === 'done') && Q.closestRestoration();
 const flag = count ? `<button class="btn" data-do="go" data-a="activity">${count} away ${count === 1 ? 'decision' : 'decisions'}</button>` :
   S().lastAway && !S().lastAway.gone ? '<button class="btn" data-do="go" data-a="activity">Welcome Back summary</button>' :
   local && local !== project ? `<button class="btn" data-do="openproject" data-a="${local}">${ico('house')}${esc(D.PROJECTS[local].name)}${Q.projectReady(local) ? ' · Ready' : ''}</button>` : '';
 return `<div class="home-glance">
  <section class="panel home-scene" data-home-unit="scene">${U.scene(town.id)}<button class="btn" data-do="go" data-a="projects">${ico('house')}${esc(town.name)}</button></section>
  <div class="home-glance-row"><button class="panel home-state" data-home-unit="activity" data-do="${Q.act ? 'nowactivity' : 'go'}" data-a="${Q.act ? '' : 'activity'}">${ico('clock')}<b data-b="homerate"></b></button>
  <div class="panel home-coins" data-home-unit="coins">${ico('coin')}<b data-b="coins"></b><span>coins</span></div></div>
  <section class="panel journey home-next" data-home-unit="goal"><h2>${esc(goal?.name || 'Your next step')}</h2>
 ${goal ? `<span>${esc(goal.label)} <b>${goal.have} / ${goal.need}</b></span><progress value="${goal.have}" max="${goal.need}" aria-label="${esc(goal.label)}"></progress>` : ''}
 ${next.checklist ? `<h3 class="bc-title">${esc(next.title)}</h3>${U.bossChecklistHtml(next)}` : ''}
 ${project ? `<span>${Object.entries(Q.projectNeed(project)).map(([id, n]) => `${Q.fmt(n)} ${id === 'coins' ? 'coins' : esc(D.ITEMS[id].name)}`).join(' · ')}</span>` : ''}
  <div class="btnrow">${button}<button class="btn" data-do="go" data-a="activity">Activity &amp; goals</button></div></section>
  ${flag ? `<div data-home-unit="flag">${flag}</div>` : ''}</div>`;
};
U.V.overview = homeGlance;
U.B.homerate = e => U.set(e, homeRate());
let lastHomeHtml = '', lastHomeCheck = 0;
Q.on('ui', () => {
 if (U.view !== 'overview' || performance.now() - lastHomeCheck < 400) return;
 lastHomeCheck = performance.now();
 const goal = document.querySelector('.home-next');
 if (!goal) return;
 const html = homeGlance();
 if (html === lastHomeHtml) return;
 const next = document.createElement('template');
 next.innerHTML = html;
 const replacement = next.content.querySelector('.home-next');
 /* under the pointer or keyboard focus the card is not swapped (it would steal the click), but its count and bar still
    move, so a patrol reads 3 / 6 while you watch it (Part C Task 22) */
 if (goal.contains(document.activeElement) || goal.matches(':hover')) {
  const same = replacement && replacement.querySelector('h2')?.textContent === goal.querySelector('h2')?.textContent;
  if (same) { const b0 = goal.querySelector(':scope > span > b'), b1 = replacement.querySelector(':scope > span > b'), p0 = goal.querySelector('progress'), p1 = replacement.querySelector('progress');
   if (b0 && b1) b0.textContent = b1.textContent; if (p0 && p1) { p0.value = p1.value; p0.max = p1.max; } }
  return;
 }
 lastHomeHtml = html;
 if (replacement?.outerHTML !== goal.outerHTML) goal.replaceWith(replacement);
});
U.V.activity = () => activity0() + `<section class="home-activity-details" aria-label="Goals and opportunities">${home0()}</section>`;
// The chapter's primary route is labelled; small ingredient/source shortcuts remain icon-first.
const render0=U.render;
U.render=(...args)=>{const result=render0(...args);if(U.view==='quests'){
 const button=document.querySelector('.quest-actions [data-do="questcontinue"]'),q=button&&D.QM[button.dataset.a];
 if(button&&q){const o=Q.unfinishedObjective(q)||q.obj[0];button.classList.remove('route-icon');button.classList.add('hs-continue');button.innerHTML=U.objectiveIcon(q,o)+'<span>Continue: '+esc(o.label)+'</span>';}
}return result;};
})();
