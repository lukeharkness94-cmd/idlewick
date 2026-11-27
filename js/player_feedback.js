/* Live player feedback: preserve existing actions, saves and simulation rules. */
(() => {
const Q=window.DQ,D=Q.data,U=Q.ui,S=()=>Q.S,{esc,ico}=Q;
const calm=()=>S().settings.reduceFx||matchMedia('(prefers-reduced-motion: reduce)').matches;
// Delivery quests include the actual gathering/production prerequisites, not just their headline activity.
const needs=Q.questSkillNeeds;
Q.questSkillNeeds=q=>{
 const out=new Map(needs(q).map(n=>[n.sk,n.lvl]));
 const visit=(id,n,path=new Set())=>{if(Q.have(id)>=n||path.has(id))return;const src=Q.sourceOf(id);if(!src)return;
  if(src.kind==='shop'&&Q.townUnlocked(src.town))return;
  path=new Set(path);path.add(id);if(src.skill)out.set(src.skill,Math.max(out.get(src.skill)||1,src.lvl||1));
  const r=src.kind==='recipe'&&D.RECIPES[src.id];if(r)for(const[k,v]of Object.entries(r.in))visit(k,v,path);
 };
 for(const o of q.obj||[]){if(o.ev==='deliver')visit(o.key,o.n);else{const task=Q.questObjectiveTasks(o)[0],r=task?.kind==='recipe'&&D.RECIPES[task.id];if(r)for(const[k,n]of Object.entries(r.in))visit(k,n);}}
 return [...out].map(([sk,lvl])=>({sk,lvl}));
};
// Only ordinary level unlocks appear in the level-up list. Found patterns have their own shelf.
for(const [sk,levels]of Object.entries(D.UNL))for(const [lv,names]of Object.entries(levels)){levels[lv]=names.filter(name=>!D.SECRET_RECIPES.some(r=>D.RECIPES[r.rec]?.name===name));if(!levels[lv].length)delete levels[lv];}
// Live Guide progress: update only fills/pips, without rebuilding the activity or its controls.
for(const key of ['mastBadge','mastLine']){const fn=Q[key];Q[key]=(kind,id)=>fn(kind,id).replace(/^<([a-z]+) /,`<$1 data-study-kind="${kind}" data-study-id="${id}" `);}
Q.on('ui',()=>{for(const el of document.querySelectorAll('[data-study-kind]')){const m=Q.mastInfo(el.dataset.studyKind,el.dataset.studyId);el.style.setProperty('--p',m.pct+'%');el.classList.toggle('full',!m.next);el.classList.toggle('max',!m.next);el.classList.toggle('near',!!m.next&&m.pct>=90);const fill=el.querySelector('.bar>i');if(fill)fill.style.width=m.pct+'%';el.querySelectorAll('.mast-pips>i').forEach((p,i)=>p.classList.toggle('on',i<m.stars));el.dataset.tip='text:'+Q.mastTip(el.dataset.studyKind,el.dataset.studyId);if(el.classList.contains('mast-line'))el.setAttribute('aria-label',Q.mastTip(el.dataset.studyKind,el.dataset.studyId));}});
// Ordinary DPS is an estimate against the selected enemy, not a promise about abilities or boss phases.
/* what deals each damage type: weapon kinds, spells and combat arts (read from the data, so new ones appear by themselves) */
Q.dtypeSources=dt=>{const D0=D.DTYPES[dt];if(!D0)return'';const w=Object.values(D.WTYPES).filter(x=>x.dtype===dt).map(x=>x.name+'s'),sp=(D.SPELLS||[]).filter(s=>D.SPELL_EL[s.id]===dt).map(s=>s.name+' (spell)'),ar=Object.entries(D.ARTS||{}).flatMap(([st,l])=>l.filter(a=>a.dtype===dt).map(a=>`${a.name} (${st==='melee'?'Melee technique':'Ranged shot'})`));return `${D0.name}: ${[...w,...sp,...ar].join(', ')||'nothing you have yet'}`;};
Q.damageEstimate=(m=Q.combatFocus?.())=>{
 const p=Q.pstats(),w=D.WTYPES[D.weaponType()],dtype=p.style==='magic'?D.SPELL_EL[p.spell.id]:w.dtype,wr=m?Q.weakOf(m,Q.fight):{weak:[],resist:[]},weak=wr.weak.includes(dtype),resist=wr.resist.includes(dtype),mult=m?(weak?Q.typeMult(m,'weak'):resist?Q.typeMult(m,'resist'):1):1;
 const acc=p.acc*w.acc*(weak?1.1:1),def=m?(m.def+8)*(64+m.def):0,chance=m?Q.clamp(acc>def?1-(def+2)/(2*(acc+1)):acc/(2*(def+1)),.05,.95):1;
 const max=Math.max(1,Math.round(p.max*w.dmg*mult*(m?1+Q.beastBonus(m.id):1)*(m?.boss||m?.mini?Q.buffMult('boss'):1))),seconds=Q.combatInterval()/1000;
 return {dps:(1+max)/2*chance/seconds,max,chance,seconds};
};
Q.combatGrowth=(sk,from)=>{if(!['melee','ranged','magic'].includes(sk)||Q.weaponStyle()!==sk)return '';const now=Q.pstats(),xp=S().xp[sk];let before;try{S().xp[sk]=D.XPF[from];Q.fxDirty();before=Q.pstats();}finally{S().xp[sk]=xp;Q.fxDirty();}return `Equipped max hit ${before.max} → ${now.max}; accuracy ${Math.round(before.acc)} → ${Math.round(now.acc)}. A level can improve accuracy before the next whole point of damage.`;};
U.B.dps=e=>{const d=Q.damageEstimate(),dt=Q.myDtype&&D.DTYPES[Q.myDtype()];U.set(e,`${dt?dt.name+' · ':''}${d.dps.toFixed(2)} DPS · ${Math.round(d.chance*100)}% hit · max ${d.max}`);};
// Preserve the arena, training bars and equipment controls across consecutive opponents and level ticks.
let encounterTimer;
U.afterImpact=(fn,delay=0)=>{
 const earliest=performance.now()+delay;
 const run=()=>{const wait=Math.max(earliest,U.impactUntil||0)-performance.now();if(wait>1){setTimeout(run,wait);return;}
  const flights=[...(U.impactFlights||[])];if(flights.length){Promise.allSettled(flights.map(a=>a.finished)).then(run);return;}fn();};
 setTimeout(run,delay);
};
U.updateEncounter=()=>{
 if(U.view!=='combat'||!document.querySelector('.encounter-arena'))return;
 clearTimeout(encounterTimer);const wait=Math.max(0,Math.max(U.impactUntil||0,U.deathHold||0)-performance.now());
 if(wait){encounterTimer=setTimeout(U.updateEncounter,wait+40);return;}
 if(U.impactFlights?.size){Promise.allSettled([...U.impactFlights].map(a=>a.finished)).then(U.updateEncounter);return;}
 const temp=document.createElement('template');temp.innerHTML=U.V.combat();
 const lastSide=r=>{const a=r.querySelectorAll('.encounter-arena>.side');return a[a.length-1]||null;},old=lastSide(document),fresh=lastSide(temp.content);
 if(old&&fresh&&old.querySelector('#av-foe')?.dataset.a!==fresh.querySelector('#av-foe')?.dataset.a){old.replaceWith(fresh);if(!calm())fresh.querySelector('#av-foe')?.animate([{opacity:0},{opacity:1}],{duration:320,easing:'ease-out'});}
 const mid=document.querySelector('.encounter-arena>.mid'),nextMid=temp.content.querySelector('.encounter-arena>.mid');if(mid&&nextMid&&!!mid.querySelector('[data-prog]')!==!!nextMid.querySelector('[data-prog]'))mid.innerHTML=nextMid.innerHTML;
 const prog=mid?.querySelector('[data-prog]');if(prog&&Q.act?.kind==='fight')prog.dataset.prog='fight:'+Q.act.id;
 const targets=document.querySelector('.combat-targets .hunt-areas'),nextTargets=temp.content.querySelector('.combat-targets .hunt-areas');if(targets&&nextTargets&&targets.innerHTML!==nextTargets.innerHTML)targets.innerHTML=nextTargets.innerHTML;
 const heroLevel=document.querySelector('.encounter-arena .lvchip.you');if(heroLevel)heroLevel.textContent='Combat '+Q.combatLvl();
 U.updateCombatHeader?.();U.collectProg();U.upd();
};
/* the next creature waits until the killing blow has visibly landed and the defeated one has faded (27 Nov 2026 audit:
   on a busy frame the swing started after the redraw, so the blow and the "slain" flash landed on the new creature).
   The hold starts when the kill is announced (at most 2 s), then shortens to the death fade once the impact shows;
   fight timing is unchanged (the next creature is tracked first). */
Q.on('slain',()=>{if(Q.sim.on||Q.forecasting||calm())return;U.deathHold=performance.now()+2000;U.afterImpact(()=>{U.deathHold=performance.now()+480;},Q.battleTiming?.impact||390);});
Q.on('splat',(side,text,kind,delay=0)=>{if(side==='foe'&&/^\d/.test(String(text))&&!kind.includes('miss')&&!Q.sim.on&&!Q.forecasting&&!calm())U.impactUntil=performance.now()+Math.max(0,delay-180)+(Q.battleTiming?.impact||390);});
for(const key of ['fhp','fhptxt']){const bind=U.B[key];U.B[key]=(e,...a)=>{if(performance.now()<(U.impactUntil||0)||U.impactFlights?.size)return;bind(e,...a);};}
const render=U.render;
U.render=(...args)=>{const result=render(...args);
 const summary=document.querySelector('.activity-caption .task-summary'),ingredients=summary?.querySelector('.recipe-ingredients');if(ingredients)summary.prepend(ingredients);
 if(U.view==='combat'){const head=document.querySelector('.hud-train .kit-head');if(head&&!head.querySelector('[data-b="dps"]'))head.insertAdjacentHTML('afterend',`<small class="combat-dps" data-b="dps" data-tip="text:Expected ordinary attack damage per second against this creature. Includes hit chance, speed and damage type; excludes ability bursts, companions and special phases."></small>`);const el=document.querySelector('[data-b="dps"]');if(el)U.B.dps(el);}
 if(U.view==='projects'){
  document.querySelectorAll('.local-project-payoff .tag').forEach(e=>e.remove());
  const wrap=document.querySelector('#view .village-map>.phead');if(wrap&&!wrap.querySelector('.village-standing')){
   const town=S().town,have=Q.localStanding(town),max=Object.values(D.PROJECTS).filter(p=>p.town===town&&!p.relic).length*10;
   wrap.querySelector('small')?.remove();wrap.insertAdjacentHTML('beforeend',`<div class="village-standing" role="group" aria-label="Village standing"><b>Local standing ${have} / ${max}</b><span class="bar"><i style="width:${max?have/max*100:0}%"></i></span><small>Restore buildings to open local supplies. Standing is permanent and never spent.</small></div>`);
  }

 }
 return result;
};
// Rare opportunities get a full scene when opened, with the outcome in exactly the same place.
const inbox=U.inboxHtml;
U.eventScene=id=>{const t=document.createElement('template');t.innerHTML=inbox();const card=[...t.content.children].find(e=>e.dataset.eventId===String(id));return card?.outerHTML||'<p>This opportunity has already been settled.</p>';};
U.DO.openevent=id=>{const event=S().inbox.find(e=>String(e.id)===String(id));if(!event)return;U.activeEvent=String(id);/* world events (world_events.js) bring their own art and town, and close with Decide later: the event keeps waiting */const world=event.type==='world',town=D.TOWN[event.town]?event.town:S().town;const m=Q.modal({title:event.title,wide:true,body:`<section class="encounter-moment" style="--event-scene:url('${Q.sceneUrl(town)}')"><div class="event-panorama" aria-hidden="true"><span class="event-subject">${U.eventArt?.(event)||(event.item&&D.ITEMS[event.item]?Q.itemIco(D.ITEMS[event.item]):event.type==='chest'&&D.ITEMS.treasure_chest?Q.itemIco(D.ITEMS.treasure_chest):ico(event.ic))}</span></div><div class="events" id="inboxbox">${U.eventScene(id)}</div></section>`,actions:[world?{label:'Decide later'}:{label:'Return to the adventure',primary:true}]});m.classList.add('event-fullscreen');if(world){m.classList.add('world-moment');m.querySelector('.ev-opt:not([disabled])')?.focus({preventScroll:true});}};
U.inboxHtml=()=>{if(document.querySelector('.encounter-moment'))return U.eventScene(U.activeEvent);const t=document.createElement('template');t.innerHTML=inbox();for(const event of t.content.querySelectorAll('.event')){const opts=event.querySelector('.ev-opts');if(opts){const b=document.createElement('button');b.className='btn primary';b.textContent='Explore this encounter';b.dataset.do='openevent';b.dataset.a=event.dataset.eventId;opts.replaceWith(b);}}return t.innerHTML;};
const inboxPanel=U.inboxPanel;U.inboxPanel=()=>{const h=inboxPanel(),t=document.createElement('template');t.innerHTML=h;for(const event of t.content.querySelectorAll('.event')){const id=event.dataset.eventId;event.querySelector('.ev-opts')?.replaceWith(Object.assign(document.createElement('button'),{className:'btn primary',textContent:'Explore this encounter'}));const button=event.querySelector('button');if(button){button.dataset.do='openevent';button.dataset.a=id;}}return t.innerHTML;};
})();
