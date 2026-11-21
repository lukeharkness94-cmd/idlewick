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
 const html=journey0(),next=Q.journeyNext(),q=questFor(next);
 if(Q.goalDone())return html;
 const t=document.createElement('template');t.innerHTML=html;const panel=t.content.querySelector('.journey');if(!panel)return html;
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
const home0=U.V.overview;
U.V.overview=()=>{
 const t=document.createElement('template');t.innerHTML=home0();const journey=t.content.querySelector('.journey');if(!journey)return home0();
 journey.remove();const town=D.TOWN[S().town],restored=Q.projectsForTown(S().town).filter(([id])=>S().projects[id]).length;
 const secondary=[...t.content.children].map(el=>el.outerHTML).join('');
 return `<div class="hs-home"><header class="hs-home-heading"><div><h1>${Q.goalDone()?'A good day’s work':'One good deed at a time'}</h1><p>${esc(town.name)} · A useful next step, at your own pace.</p></div></header><div class="hs-home-primary">${journey.outerHTML}</div><aside class="hs-home-side"><section class="panel hs-town-card">${U.scene(S().town)}<div class="hs-town-caption"><h2>${esc(town.name)}</h2><p>${restored?`${restored} restored ${restored===1?'site':'sites'} · Your work is changing the village.`:'A village worth bringing back to life.'}</p><button class="btn" data-do="go" data-a="projects">${ico('town')}View the village</button></div></section><div class="hs-home-reference" aria-label="Other opportunities">${secondary}</div></aside></div>`;
};
// The chapter's primary route is labelled; small ingredient/source shortcuts remain icon-first.
const render0=U.render;
U.render=(...args)=>{const result=render0(...args);if(U.view==='quests'){
 const button=document.querySelector('.quest-actions [data-do="questcontinue"]'),q=button&&D.QM[button.dataset.a];
 if(button&&q){const p=U.questProgress(q),o=q.obj[p.index];button.classList.remove('route-icon');button.classList.add('hs-continue');button.innerHTML=U.objectiveIcon(q,o)+'<span>Continue: '+esc(o.label)+'</span>';}
}return result;};
})();
