/* Shared experience rules: short help on demand, one skill menu, clear battle preparation. */
(() => {
const Q=window.DQ,D=Q.data,UI=Q.ui,{esc,ico}=Q,S=()=>Q.S;
UI.DO.pagehelp=()=>{
 const sk=D.SKILLS.find(s=>s.page===UI.view),lesson=Q.skillLessons[sk?.id||UI.view];
 const body=lesson?`<p>${esc(lesson.text)}</p>${lesson.towards?`<p>${esc(lesson.towards)}</p>`:''}<p><b>Try this:</b> ${esc(lesson.goal)}</p>`:UI.skillGuide?.(sk?.id)||'<p>Choose an illustrated card, check its requirements, then use the highlighted action.</p>';
 Q.modal({title:`${sk?.name||lesson?.title||Q.cap(UI.view)} help`,body,actions:[{label:'Got it',primary:true}]});
};
const oldBest=UI.V.bestiary;
UI.V.bestiary=()=>{
 if(UI.beastTab==='pets')return oldBest();
 const town=UI.tab.guideTown||S().town,filter=UI.tab.guideFilter||'all';
 const all=D.MONLIST.filter(m=>m.town===town),done=all.filter(m=>Q.research(m).rank===6).length;
 const shown=all.filter(m=>filter==='all'||(filter==='complete'?Q.research(m).rank===6:Q.research(m).rank<6));
 return `<section class="panel"><div class="phead"><div><span class="k">Field guide</span><h2>${done}/${all.length} entries complete</h2></div><button class="btn sm" data-do="beasttab" data-a="pets">Companions</button></div><nav class="choice-buttons" aria-label="Regions">${D.TOWNS.map(t=>`<button class="choice-button ${t.id===town?'on':''}" data-do="guidetown" data-a="${t.id}">${esc(t.name)}</button>`).join('')}</nav><div class="bar guide-total"><i style="width:${done/all.length*100}%"></i></div><div class="choice-buttons">${[['all','All'],['unfinished','To complete'],['complete','Complete']].map(([k,n])=>`<button class="btn sm ${filter===k?'primary':''}" data-do="guidefilter" data-a="${k}">${n}</button>`).join('')}</div></section><section class="panel"><div class="beasts guide-cards">${shown.map(m=>{
 const r=Q.research(m),seen=r.rank>0,next=r.rank===6?'Entry complete':`${r.need} more victories → ${D.RESEARCH.ranks[r.rank][1]}`;
 return `<button class="beast ${r.rank===6?'complete':''}" data-do="guide" data-a="${m.id}" style="--c:${m.col}">${Q.monSprite(m,72,seen?'':'sil')}<span><b>${seen?esc(m.name):'Undiscovered creature'}</b><small>${seen?`Level ${m.cl} · ${r.kills} victories`:`Found in ${D.TOWN[m.town].name}`}</small><span class="research-stamps" aria-label="${r.rank} of 6 research stages">${D.RESEARCH.ranks.map((rank,i)=>`<i class="${i<r.rank?'on':''}" data-tip="text:${esc(rank[1]+': '+rank[2])}">${i<r.rank?'◆':'◇'}</i>`).join('')}</span><small>${next}</small></span></button>`;
 }).join('')||'<p>No entries match this filter yet. Explore this region to discover its creatures.</p>'}</div></section>`;
};
Object.assign(UI.DO,{guidetown:id=>{UI.tab.guideTown=id;UI.render(false);},guidefilter:id=>{UI.tab.guideFilter=id;UI.render(false);}});
const combat=UI.V.combat;
UI.V.combat=()=>{
 const html=combat(),m=D.MON[Q.fight?.id]||D.MONLIST.find(m=>m.town===S().town&&!m.boss),known=Q.weakKnown(m);
 const counters=known?Q.weakOf(m).weak.map(t=>`${D.DTYPES[t].name}: ${ {stab:'dagger',slash:'sword',crush:'warhammer',pierce:'bow and arrows',fire:'fire spell',frost:'frost spell',storm:'storm spell',aether:'aether spell'}[t]}`).join(' · '):'';
 const tips=known?Q.matchup(m).slice(0,2).map(([kind,line])=>`<span class="${kind==='good'?'ok':kind==='bad'?'bad':'dim'}">${esc(line)}</span>`).join(''):`<span>Defeat this creature to reveal its strengths and weaknesses in the field guide.</span>`;
 const intel=`<section class="panel battle-brief"><div class="phead"><h3>${esc(m.name)} · preparation</h3><button class="btn sm" data-do="guide" data-a="${m.id}">Field guide</button></div><div class="battle-facts"><span>Enemy max hit <b>${m.max}</b></span><span>Your max hit <b>${Q.pstats().max}</b></span><span>Attack every <b>${(Q.actDur({kind:'fight',pace:Q.act?.kind==='fight'?Q.act.pace:'steady'})/1000).toFixed(2)}s</b></span></div><div class="battle-advice">${counters?`<span class="ok">Try ${esc(counters)}</span>`:''}${tips}</div><div class="btnrow"><button class="btn sm" data-do="go" data-a="character">Equipment</button><button class="btn sm" data-do="go" data-a="cooking">Prepare food</button></div></section>`;
 /* Ranged and Magic are combat styles, each trained by its own skill: say how a locked one is learned */
 const styles=['ranged','magic'].filter(k=>!Q.skillUnlocked(k));
 const styleNote=styles.length?`<p class="style-note">${Q.ico('lock')}<span><b>Other fighting styles.</b> ${styles.map(k=>`<b>${D.SK[k].name}</b> is a combat style with its own skill (equip a ${k==='ranged'?'bow and arrows':'staff and runes'}). ${esc(Q.skillTeacher(k))}.`).join(' ')}</span></p>`:'';
 return html.replace('<div class="combat-live">','<div class="combat-live">'+intel).replace(/(<section class="panel combat-training">[\s\S]*?)(<\/section>)/,'$1'+styleNote+'$2');
};
const render=UI.render;
UI.render=fresh=>{
 render(fresh);
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
