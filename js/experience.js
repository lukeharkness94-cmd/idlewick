/* Shared experience rules: short help on demand, one skill menu, clear battle preparation. */
(() => {
const Q=window.DQ,D=Q.data,UI=Q.ui,{esc,ico}=Q,S=()=>Q.S;
UI.DO.pagehelp=()=>{
 const sk=D.SKILLS.find(s=>s.page===UI.view),lesson=Q.skillLessons[sk?.id||UI.view];
 const body=lesson?`<p>${esc(lesson.text)}</p>${lesson.towards?`<p>${esc(lesson.towards)}</p>`:''}<p><b>Try this:</b> ${esc(lesson.goal)}</p>`:UI.skillGuide?.(sk?.id)||'';
 Q.modal({title:`${sk?.name||lesson?.title||Q.cap(UI.view)} help`,body,actions:[{label:'Got it',primary:true}]});
};
const oldBest=UI.V.bestiary;
/* The field guide (Nov 2026, from the player: "the whole field guide, bestiary thing is a little confusing"): one name,
   one sentence on how it fills in, plain words instead of stamps, and any creature a quest asks you to study shown
   first, by name, with a button. */
const studyQ=m=>D.QUESTS.find(q=>S().q[q.id]&&['active','new'].includes(S().q[q.id].s)&&q.obj.some((o,j)=>o.ev==='guide'&&o.key===m.id&&Q.objProg(q,S().q[q.id],j)<o.n));
UI.V.bestiary=()=>{
 if(UI.beastTab==='pets')return oldBest();
 const town=UI.tab.guideTown||S().town,filter=UI.tab.guideFilter||'all',R=D.RESEARCH.ranks;
 const all=D.MONLIST.filter(m=>m.town===town),done=all.filter(m=>Q.research(m).rank===6).length,met=all.filter(m=>Q.research(m).rank>0).length;
 const shown=all.filter(m=>filter==='all'||(filter==='complete'?Q.research(m).rank===6:Q.research(m).rank<6)).sort((x,y)=>(studyQ(y)?1:0)-(studyQ(x)?1:0));
 const card=m=>{const r=Q.research(m),seen=r.rank>0,sq=studyQ(m);
  const status=r.rank===6?'Every entry filled in':seen?`Next: <b>${esc(R[r.rank][1])}</b> after ${r.need} more defeat${r.need>1?'s':''}`:`Defeat it once to add it`;
  return `<button class="beast ${r.rank===6?'complete':''} ${sq?'quest-study':''}" data-do="guide" data-a="${m.id}" style="--c:${m.col}">${Q.monSprite(m,72,seen||sq?'':'sil')}<span>${sq?`<em class="study-tag">${ico('quest')}${esc(sq.giver)} asks you to read this</em>`:''}<b>${seen||sq?esc(m.name):'Not met yet'}</b><small>${seen?`Level ${m.cl} · ${r.kills} defeated`:`Lives around ${esc(D.TOWN[m.town].name)}`}${m.boss?' · Boss':''}</small><span class="guide-fill"><span class="bar"><i style="width:${r.rank/6*100}%"></i></span><small>${r.rank} of 6 entries</small></span><small class="guide-next">${sq&&!seen?'Open it to read what '+esc(sq.giver)+' told you':status}</small></span></button>`;};
 return `<section class="panel guide-head"><div class="phead"><div><span class="k">Field guide · ${esc(D.TOWN[town].name)}</span><h2>${met} of ${all.length} creatures met · ${done} complete</h2></div><button class="btn sm" data-do="beasttab" data-a="pets">Beast eggs</button></div>
  <p class="guide-how">Each creature has a page with six entries: <b>${R.map(x=>esc(x[1])).join(', ')}</b>. Defeating it fills them in, one at a time. Click a creature to read its page.</p>
  <nav class="choice-buttons" aria-label="Regions">${D.TOWNS.map(t=>`<button class="choice-button ${t.id===town?'on':''}" data-do="guidetown" data-a="${t.id}">${esc(t.name)}</button>`).join('')}</nav><div class="choice-buttons">${[['all','All'],['unfinished','Not complete'],['complete','Complete']].map(([k,n])=>`<button class="btn sm ${filter===k?'primary':''}" data-do="guidefilter" data-a="${k}">${n}</button>`).join('')}</div></section><section class="panel"><div class="beasts guide-cards">${shown.map(card).join('')||'<p>No creatures match this filter yet.</p>'}</div></section>`;
};
Object.assign(UI.DO,{guidetown:id=>{UI.tab.guideTown=id;UI.render(false);},guidefilter:id=>{UI.tab.guideFilter=id;UI.render(false);}});
const combat=UI.V.combat;
UI.V.combat=()=>{
 const html=combat(),m=Q.combatFocus(),known=Q.weakKnown(m),seen=!!(Q.fight&&Q.fight.id===m.id)||(S().beast.kills[m.id]||0)>0,dg=Q.dangerOf(m);
 const needs=t=>t==='pierce'?'ranged':['fire','frost','storm','aether'].includes(t)?'magic':null;
 const counters=known?Q.weakOf(m).weak.map(t=>{const sk=needs(t),locked=sk&&!Q.skillUnlocked(sk);return `${D.DTYPES[t].name}: ${ {stab:'dagger',slash:'sword',crush:'warhammer',pierce:'bow and arrows',fire:'fire spell',frost:'frost spell',storm:'storm spell',aether:'aether spell'}[t]}${locked?` (${D.SK[sk].name} not learned yet)`:''}`;}).join(' · '):'';
 const tips=known?Q.matchup(m).slice(0,2).map(([kind,line])=>`<span class="${kind==='good'?'ok':kind==='bad'?'bad':'dim'}">${esc(line)}</span>`).join(''):`<span>Defeat this creature to reveal its strengths and weaknesses in the field guide.</span>`;
 const intel=`<section class="panel battle-brief"><div class="phead"><h3>${seen?esc(m.name):'Unknown creature'} · preparation</h3><button class="btn sm" data-do="guide" data-a="${m.id}">Field guide</button></div><p class="danger ${dg.key}"><b>${dg.label}</b> · ${esc(dg.why)}</p><div class="battle-facts"><span>Level <b>${m.cl}</b></span><span>Health <b>${m.hp}</b></span><span>Hits up to <b>${m.max}</b></span></div><div class="battle-advice">${counters?`<span class="ok">Try ${esc(counters)}</span>`:''}${tips}</div><div class="btnrow"><button class="btn sm" data-do="go" data-a="character">Equipment</button></div></section>`;
 return html.replace('<!--battle-brief-->',intel);
};
const render=UI.render;
UI.render=fresh=>{
 render(fresh);
 /* a focused card (from a level-up note) keeps its highlight across re-renders until it has played */
 const sp=UI.spot;if(sp){if(Date.now()>sp.until)UI.spot=null;else{const el=document.querySelector(`.illustrated-card[data-b="${sp.id}"]`);if(el)el.classList.add('spotlight');}}
 const view=document.getElementById('view');if(!view)return;
 const skill=D.SKILLS.find(s=>s.page===UI.view);
 if(UI.view==='combat'){view.querySelector('.howfight')?.remove();}
 if((skill&&Q.skillUnlocked(skill.id)||UI.view==='combat')&&!view.querySelector('.locked-page')){
  // Detailed descriptions are available on demand; first-use lessons remain inline.
  view.querySelectorAll('.guidep').forEach(e=>e.remove());
  const help=document.createElement('div');help.className='page-help';help.innerHTML=`<button class="btn sm" data-do="pagehelp">${ico('book')} How to use ${esc(skill?.name||'Combat')}</button>`;view.append(help);
 }
};
})();
