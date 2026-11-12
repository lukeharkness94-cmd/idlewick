/* Player-paced storyboards over existing pixel towns. Choices use the existing save/journal/quest systems. */
(() => {
const Q=window.DQ,D=Q.data,UI=Q.ui,S=()=>Q.S,{esc,ico}=Q;
const defs=D.STORY_SCENES,seen=id=>!!S().seen['story:'+id],quiet=()=>Q.forecasting||Q.sim?.on;
let active=null,pending=null;
/* Main-story quests are explicit; discoveries, projects and regional arrivals are quiet entries. */
for(const q of D.QUESTS)if(q.id==='first_steps'||q.id==='goblin_menace'||q.obj.some(o=>o.ev==='boss'))q.main=true;
Q.storyCinematic=s=>!!(s&&(s.id==='willowbrook_promise'||s.quest&&D.QM[s.quest]?.main||s.type==='quest'&&D.QM[s.source]?.main||s.boss&&D.QUESTS.some(q=>q.main&&q.obj.some(o=>o.ev==='boss'&&o.key===s.boss))));

const text=v=>typeof v==='function'?v():v;
Q.availableStories=()=>Object.values(defs).filter(s=>s.eligible());
const choiceOf=s=>s.type==='discovery'?S().disc?.[s.source]?.choice:Q.choiceOf(s.choiceKey);
const missing=c=>c.needItem&&!Q.have(c.needItem)?`Needs ${D.ITEMS[c.needItem].name}`:c.need&&Q.foods().reduce((n,id)=>n+Q.have(id),0)<c.need?`Needs ${c.need} cooked meals`:'';
/* Standalone priorities are explicit, reversible goals; permanent adventure decisions keep their authored outcomes. */
Q.chooseStory=(id,pick)=>{
 if(quiet())return false;const s=defs[id],c=s?.choices?.find(c=>c.id===pick);
 if(typeof s?.eligible!=='function'||!s.eligible()||!c||choiceOf(s)||missing(c))return false;
 if(s.type==='discovery')return Q.chooseDiscovery(s.source,pick);
 if(s.type==='quest'){
  if(Q.questState(D.QM[s.source])!=='ready')return false;
  UI.DO.qclaim(s.source,pick);return Q.questState(D.QM[s.source])==='done';
 }
 const before=JSON.parse(JSON.stringify(S()));S().choices=S().choices||{};S().choices[s.choiceKey]=pick;
 if(c.goal){S().journey=c.goal();if(S().journey==='boss')S().journeyTarget=Q.regionBoss()?.id||S().journeyTarget;}
 Q.journal('choice',`${s.title}: ${c.label}. ${c.effect}`,'flag');
 if(!Q.save()){Q.S=before;Q.fxDirty();return false;}return true;
};
const close0=Q.closeModal;
Q.closeModal=()=>{if(active){S().seen['story:'+active.id]=1;active=null;Q.save();}return close0();};
const finish=()=>{if(!active)return;const id=active.id;S().seen['story:'+id]=1;Q.journal('story',`Remembered “${defs[id].title}”.`,'book');active=null;Q.save();Q.closeModal();};
function draw(){
 if(!active)return;const s=defs[active.id],frames=s.frames(),decision=active.index>=frames.length,chosen=choiceOf(s),c=s.choices?.find(c=>c.id===chosen),f=frames[Math.min(active.index,frames.length-1)];
 const speaker=decision&&c?(s.type==='quest'?D.QM[s.source].giver:f.speaker):f.speaker;
 const legacyDecision=s.type==='quest'&&Q.questState(D.QM[s.source])==='done'&&!chosen;
 const body=decision?(legacyDecision?'This chapter was completed before its decision was recorded. Your earned progress and rewards are preserved.':c?text(c.response||c.text):'What will you do?'):text(f.text);
 const portrait=speaker==='Narrator'?UI.portrait(64):Q.folkPortrait(speaker,64);
 const choices=decision&&!chosen&&!legacyDecision?(s.choices||[]).map(c=>`<button class="story-choice btn" data-do="storychoose" data-a="${s.id}" data-b="${c.id}" ${missing(c)?'disabled':''}><b>${esc(c.label)}</b><small>${esc(missing(c)||text(c.effect)||'This choice will be remembered.')}</small></button>`).join(''):'';
 const step=Math.min(active.index+1,frames.length+(s.choices?1:0)),total=frames.length+(s.choices?1:0);
 const project=s.project&&D.PROJECTS[s.project],A=Q.pixelArt,art=project&&(project.art||s.project);
 const restoration=project?`<div class="story-restoration"><div><span>Before restoration</span><img src="${A.url('story-before:'+art,()=>A.stagePiece(art,0))}" alt="${esc(project.name)} before repair"></div><span class="story-repair-arrow" aria-hidden="true">→</span><div><span>Restored</span><img src="${A.url('story-after:'+art,()=>A.stagePiece(art,4))}" alt="Restored ${esc(project.name)}"></div></div>`:'';
 const m=active.modal,root=m.querySelector('.m-body');
 root.innerHTML=`<section class="story-scene" data-scene="${s.id}" data-shot="${f.shot||'wide'}"><div class="story-stage" role="img" aria-label="${esc(D.TOWN[s.town].name)} · ${esc(s.title)}"><img class="story-landscape" src="${Q.sceneUrl(s.town)}" alt=""><span class="story-location">${esc(D.TOWN[s.town].name)}</span><img class="story-hero" src="${Q.heroFigureUrl(S().look)}" alt="Your hero"><span class="story-stage-person">${speaker==='Narrator'?'':Q.folkPortrait(speaker,96)}</span><span class="story-vignette"></span>${restoration}</div><div class="story-dialogue"><span class="story-portrait">${portrait}</span><div><span class="k">${esc(speaker)}</span><p class="story-line" tabindex="-1">${esc(body)}</p>${decision&&c?`<small class="story-remembered">Your decision: ${esc(c.label)}${c.effect?' · '+esc(text(c.effect)):''}</small>`:''}</div></div>${active.error?`<p class="story-error" role="alert">${esc(active.error)}</p>`:''}${choices?`<div class="story-choices" role="group" aria-label="Your decision">${choices}</div>`:''}<div class="story-controls"><button class="btn sm" data-do="storyskip">${decision&&!chosen&&!legacyDecision?'Decide later':'Skip scene'}</button><small>${step} / ${total} · your task keeps running</small>${choices?'':`<button class="btn primary" data-do="storynext">${decision||(!s.choices&&active.index===frames.length-1)?'Return to game':'Continue'}</button>`}</div></section>`;
 const line=root.querySelector('.story-line');line.focus({preventScroll:true});
}
Q.openStory=id=>{
 const s=defs[id];if(typeof s?.eligible!=='function'||!s.eligible()||quiet()||!Q.started)return false;
 if(!Q.storyCinematic(s)){if(s.project){UI.restoredSite=s.project;UI.DO.openproject(s.project);}else if(s.type==='discovery')discovery0(s.source);else if(s.type==='quest')UI.openQuestChoice(s.source);else{UI.storyEntry=id;Q.go('journal');}return true;}
 if(s.type==='quest'&&Q.questState(D.QM[s.source])==='ready'&&UI.view!=='quests'){UI.questTab='active';UI.tab.questSelected=s.source;Q.go('quests');}
 Q.closeModal();if(pending===id)pending=null;const m=Q.modal({title:s.title,wide:true,body:'',actions:[]});m.classList.add('story-modal');m.dataset.story=id;
 active={id,index:0,modal:m};draw();return true;
};
Object.assign(UI.DO,{
 storyopen:id=>Q.openStory(id),storynext:()=>{if(!active)return;const s=defs[active.id];if(active.index>=s.frames().length-1&&!s.choices||active.index>=s.frames().length)return finish();active.index++;draw();},
 storyskip:()=>finish(),storychoose:(id,pick)=>{if(!active||active.id!==id)return;if(Q.chooseStory(id,pick)){active.error=null;draw();UI.renderHud();UI.renderRail();if(UI.view==='overview')UI.render(false);}else{active.error=missing(defs[id].choices.find(c=>c.id===pick)||{})||Q.saveHealth||'This decision could not be saved. Nothing has been spent; please try again.';draw();}},
 storyarchive:()=>Q.go('journal'),restorationdismiss:()=>{UI.restoredSite=null;UI.render(false);},storypage:a=>{UI.storyPage=Math.max(0,+a||0);UI.render(false);},
 storysetting:()=>{S().settings.storyScenes=S().settings.storyScenes===false;pending=null;Q.save();UI.render(false);}
});
/* Story controls own their keys; Space must never pause the task behind the dialogue. */
addEventListener('keydown',e=>{
 if(!active)return;
 const line=e.target.closest?.('.story-line'),buttons=[...active.modal.querySelectorAll('button')].filter(b=>!b.disabled&&b.offsetWidth);
 if(line&&e.key==='Tab'){e.preventDefault();e.stopImmediatePropagation();(e.shiftKey?buttons[buttons.length-1]:buttons[0])?.focus();return;}
 if(line&&(e.key===' '||e.key==='Enter')){e.preventDefault();e.stopImmediatePropagation();const s=defs[active.id];if(active.index>=s.frames().length&&!choiceOf(s)&&s.choices?.length)buttons[0]?.focus();else UI.DO.storynext();return;}
 if(!['Tab','Escape'].includes(e.key))e.stopImmediatePropagation();
},true);
function offer(id){if(quiet()||!Q.started||S().settings.storyScenes===false||seen(id)||!defs[id]?.eligible()||!Q.storyCinematic(defs[id]))return;if(pending&&defs[pending]?.choices?.length&&!choiceOf(defs[pending]))return;pending=id;}
/* Only a new major event can queue a scene; loading an advanced save never replays a backlog. */
const start0=Q.startQuest;
Q.startQuest=id=>{const before=D.QM[id]&&Q.questState(D.QM[id]);const r=start0(id);if(before==='new'&&['active','ready'].includes(Q.questState(D.QM[id]))){const scene=Object.values(defs).find(s=>s.quest===id);if(scene)offer(scene.id);}return r;};
const claim0=Q.claimQuest;
Q.claimQuest=(id,...args)=>{const before=D.QM[id]&&Q.questState(D.QM[id]),r=claim0(id,...args);if(before==='ready'&&Q.questState(D.QM[id])==='done'){if(id==='first_steps')offer('willowbrook_promise');else{const boss=D.QM[id]?.obj.find(o=>o.ev==='boss');if(boss)offer('victory_'+boss.key);}}return r;};
const travel0=Q.travel;
Q.travel=id=>{const first=!S().towns[id]?.visited,r=travel0(id);/* Arrival flavour stays in the journal, without a cutscene. */return r;};
Q.on('project',id=>{if(S().projects[id]){const s=Object.values(defs).find(s=>s.project===id);UI.restoredSite=id;setTimeout(()=>{if(UI.view==='projects')UI.render(false);},150);}});
const notify0=Q.notify;
Q.notify=o=>{const r=notify0(o);/* The main quest claim owns the victory scene, preventing duplicate celebrations. */return r;};
let ticks=0;
Q.on('ui',()=>{if(++ticks%5||!pending||S().settings.storyScenes===false||quiet()||!Q.started||document.hidden||document.querySelector('.modal,.quest-reveal'))return;const id=pending;pending=null;if(!seen(id))Q.openStory(id);});
/* Present existing consequential choices as scenes rather than introducing another decision system. */
for(const [id,d]of Object.entries(D.DISCOVERIES).filter(([,d])=>d.choices))defs['discovery_'+id]={id:'discovery_'+id,title:d.name,town:d.place,type:'discovery',source:id,eligible:()=>Q.discovered(id),frames:()=>[{speaker:'Narrator',shot:'wide',text:d.text}],choices:d.choices.map(c=>({...c,effect:c.needItem?`Uses one ${D.ITEMS[c.needItem].name}. ${c.label}`:c.need?`Uses ${c.need} cooked meals. ${c.label}`:c.label}))};
const discovery0=UI.openDiscovery;
UI.openDiscovery=id=>defs['discovery_'+id]?Q.openStory('discovery_'+id):discovery0(id);
for(const q of D.QUESTS.filter(q=>q.choices))defs['decision_'+q.id]={id:'decision_'+q.id,title:q.name,town:q.town,type:'quest',source:q.id,choiceKey:q.id,eligible:()=>['ready','done'].includes(Q.questState(q)),frames:()=>[{speaker:q.giver,shot:'wide',text:q.blurb}],choices:q.choices.map(c=>({...c,effect:q.id==='bl_ledger'?(c.id==='ilsa'?'Ilsa becomes your ally. Later: a warden’s greathelm.':'Mother Silt becomes your ally. Later: a smuggler’s knot.'):'Changes the story and its later acknowledgement.'}))};
UI.openQuestChoice=id=>{const q=D.QM[id];if(!q)return;if(q.main)return Q.openStory('decision_'+id);UI.questTab='active';UI.tab.questSelected=id;Q.go('quests');};
const quests0=UI.V.quests;
UI.V.quests=()=>{const h=quests0(),q=D.QM[UI.tab.questSelected];if(!q||q.main||!q.choices||Q.questState(q)!=='ready'||Q.choiceOf(q.id)||h.includes('quest-reveal'))return h;const options=`<section class="inline-decision"><b>Choose how this chapter ends</b>${q.choices.map(c=>`<button class="btn" data-do="qclaim" data-a="${q.id}" data-b="${c.id}"><b>${esc(c.label)}</b><small>${esc(c.text)}</small></button>`).join('')}</section>`;return h.replace('<div class="qdetail">','<div class="qdetail">'+options);};
const makeDiscovery0=Q.makeDiscovery;Q.makeDiscovery=(id,...a)=>{const r=makeDiscovery0(id,...a);if(r&&id==='goblin_satchel')offer('discovery_'+id);return r;};
/* Home leads through the existing opening quests. It never accepts or changes goals on the player's behalf. */
const next0=Q.journeyNext;
Q.journeyNext=(id=S().journey||'boss')=>{
 if(id==='boss'&&!S().towns.willowbrook.boss&&S().town==='willowbrook'&&S().q.first_steps?.s==='done'){
  const step=(title,detail,action,a,b)=>({title,detail,action,a,b});
  const gob=D.QM.goblin_menace,mabel=D.QM.hungry_cook;
  if(Q.questState(gob)==='new')return step('Speak to Sergeant Orrin','The east farms need help. Accept his patrol before fighting so your victories count.','qstart',gob.id);
  if(Q.questState(gob)==='ready')return step('Report to Sergeant Orrin','The patrol is complete. Hear what he learned about the hill fort and claim your reward.','qclaim',gob.id);
  if(Q.questState(mabel)==='new')return step('Help Mabel prepare supper','Cook for the raided families, and keep spare meals for your own journey.','qstart',mabel.id);
  if(Q.questState(mabel)==='ready')return step('Bring supper to Mabel','The kitchen is ready. Collect her thanks and your reward.','qclaim',mabel.id);
  if(Q.questState(mabel)==='active'&&Q.have('raw_shrimp')>0)return step('Cook Mabel’s supper','Eight successful shrimp meals complete her request. Keep spare meals for the patrol.','journeytask','recipe','cook_shrimp');
  if(Q.questState(gob)==='active'&&Q.combatLvl()>=5&&Q.foods().reduce((n,k)=>n+Q.have(k)*D.ITEMS[k].heal,0)>=Q.maxHp())return step('Patrol the east farms','Track goblins for Orrin. Their orders may explain what Grubnash is planning.','huntquest','goblin');
 }
 return next0(id);
};
const journal0=UI.V.journal;
UI.V.journal=()=>{
 const list=Q.availableStories(),pages=Math.max(1,Math.ceil(list.length/6)),page=Math.min(UI.storyPage||0,pages-1),choices=Object.entries(S().choices||{}).filter(([id])=>id.startsWith('story_'));
 const entry=defs[UI.storyEntry],note=entry&&!Q.storyCinematic(entry)&&entry.eligible()?`<section class="panel story-note"><h2>${esc(entry.title)}</h2>${entry.frames().map(f=>`<p><b>${esc(f.speaker)}</b> · ${esc(text(f.text))}</p>`).join('')}</section>`:'';
 const archive=`<section class="panel story-archive"><div class="phead"><h2>Story so far</h2><button class="btn sm" data-do="storysetting">Automatic scenes: ${S().settings.storyScenes===false?'off':'on'}</button></div><p class="sm dim">Replay without spending resources or changing a remembered decision. Unfinished decisions can be made here.</p><div class="story-chapters">${list.slice(page*6,page*6+6).map(s=>`<button class="btn story-chapter" data-do="storyopen" data-a="${s.id}"><b>${esc(s.title)}</b><small>${esc(D.TOWN[s.town].name)} · ${s.choices?.length&&!choiceOf(s)&&!(s.type==='quest'&&Q.questState(D.QM[s.source])==='done')?'Decision waiting':Q.storyCinematic(s)?(seen(s.id)?'Replay':'Watch scene'):'Read entry'}</small></button>`).join('')||'<p>Your story begins with Elder Wren’s first request.</p>'}</div>${pages>1?`<div class="btnrow"><button class="btn sm" data-do="storypage" data-a="${page-1}" ${page?'':'disabled'}>Previous</button><span>${page+1} / ${pages}</span><button class="btn sm" data-do="storypage" data-a="${page+1}" ${page+1<pages?'':'disabled'}>Next</button></div>`:''}${choices.map(([key,value])=>{const s=Object.values(defs).find(s=>s.choiceKey===key),c=s?.choices?.find(c=>c.id===value);return c?`<p class="story-choice-record">${esc(s.title)}: <b>${esc(c.label)}</b></p>`:'';}).join('')}</section>`;
 return note+archive+(journal0?journal0():'');
};
const render0=UI.render;
UI.render=fresh=>{render0(fresh);if(UI.view==='projects'&&UI.restoredSite&&S().projects[UI.restoredSite]&&D.PROJECTS[UI.restoredSite].town===S().town){const id=UI.restoredSite,p=D.PROJECTS[id],scene=Object.values(defs).find(s=>s.project===id),view=document.getElementById('view');/* the summary lives inside the project card on the right, so the village and page never move (Nov 2026, from the player) */
const card=view.querySelector('.project-card.done'),art=(p.art||id),A=Q.pixelArt;if(card&&!card.querySelector('.restoration-feedback'))card.querySelector('.phead')?.insertAdjacentHTML('afterend',`<div class="restoration-feedback rf-card" role="status">${A&&A.stagePiece?`<span class="rf-art">${A.img(A.url('rf-site:'+art+':4',()=>A.stagePiece(art,4)),32,32,64,'','')}</span>`:''}<span class="rf-text"><b class="rf-title">${ico('check')} ${esc(p.name)} · restored</b><span class="rf-benefit"><b>Active now:</b> ${esc(p.reward)}</span></span><button class="btn sm rf-x" data-do="restorationdismiss" aria-label="Dismiss restoration summary">×</button></div>`);view.querySelector('.site-spot[data-a="'+id+'"]')?.classList.add('restoration-highlight');}if(UI.view==='overview'){const h=document.querySelector('.journey .phead');if(h&&!h.querySelector('[data-do="storyarchive"]'))h.insertAdjacentHTML('beforeend',`<button class="btn sm" data-do="storyarchive">${ico('book')} Story so far</button>`);}};
})();
