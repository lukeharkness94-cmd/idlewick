/* Visual hunting stages reflect current actions and real expedition deadlines; no extra timers or rewards. */
(() => {
const Q=window.DQ,UI=Q.ui,D=Q.data,{ico,esc}=Q;
const fieldSteps = [
  ['Set trap', 'wooden_trap', .15, 'Set the best qualifying field trap you own.'],
  ['Wait', 'clock', .65, 'Give the bait and the trail time to work.'],
  ['Check trap', 'paw', .85, 'Look for signs before lifting the trap.'],
  ['Recover trap', 'bag', 1, 'At the end of the cycle, you recover the haul and any unbroken trap.']
];
Q.huntingStageState=(mode,now=Date.now())=>{
 const a=Q.act,j=Q.S.pets.expedition;
 if(mode==='expedition'){
  if(j){const span=Math.max(1,j.due-j.sent),p=Math.max(0,Math.min(1,(now-j.sent)/span));return {labels:['Set','Wait','Return'],icons:['wooden_trap','clock','bag'],current:p>=1?2:1,progress:p>=1?0:p,done:false,active:true};}
  const result=[...(Q.S.pets.events||[])].reverse().find(e=>e.kind==='capture'||e.kind==='return');
  return {labels:['Set','Wait',result?.kind==='capture'?'Egg found':result?'Tracks found':'Return'],icons:['wooden_trap','clock',result?.kind==='capture'?'egg':'paw'],current:result?3:-1,progress:0,done:!!result,active:false};
 }
 if(mode==='field'){
  const active=Q.isFieldHunt ? Q.isFieldHunt(a) : a?.kind==='train'&&String(a.id).startsWith('lure:');
  const p=active?Math.max(0,Math.min(.999999,(a.progress||0)/Math.max(1,a.dur))):0;
  const phase=fieldSteps.findIndex(step=>p<step[2]);
  const start=fieldSteps[phase-1]?.[2]||0, end=fieldSteps[phase][2];
  return {labels:fieldSteps.map(step=>step[0]),icons:[Q.fieldTrap?.()?.id||fieldSteps[0][1],...fieldSteps.slice(1).map(step=>step[1])],
    current:active?phase:-1,progress:active?(p-start)/(end-start):0,active,done:false};
 }
 const active=a?.kind==='fight'&&!!a.area,mon=active&&D.MON[a.id],hp=Q.fight?.hp;
 return {labels:['Habitat','Quarry','Hunt'],icons:['map','paw','attack'],current:active?2:-1,progress:active&&Number.isFinite(hp)?Math.max(0,Math.min(1,1-hp/mon.hp)):0,active,done:false};
};
const explain={hunt:['Choose a reachable habitat.','Locate the quarry for this hunt.','Progress reflects the current opponent’s remaining health.'],field:fieldSteps.map(step=>step[3]),expedition:['The trap was sent.','The trap stays out until its real return time.','The return is resolved automatically. An egg or tracks are shown only after the result is known.']};
const html=mode=>`<ol class="hunt-stages" data-hunt-stages="${mode}" aria-label="${mode==='hunt'?'Hunt':mode==='field'?'Fieldwork cycle':'Trap expedition'} stages">${Array.from({length:explain[mode].length},(_,i)=>`<li data-stage="${i}"><span class="stage-glyph" aria-hidden="true"></span><b class="stage-label"></b><span class="stage-check" aria-hidden="true"></span><span class="stage-track" aria-hidden="true"><i></i></span></li>`).join('')}</ol>`;
UI.huntingStageStrip=html;
const updateStages=()=>document.querySelectorAll('[data-hunt-stages]').forEach(el=>{
 const mode=el.dataset.huntStages,s=Q.huntingStageState(mode);el.querySelectorAll('[data-stage]').forEach((li,i)=>{const done=s.done||s.current>i,current=s.current===i;li.classList.toggle('done',done);li.classList.toggle('current',current);if(li.dataset.glyph!==s.icons[i]){li.querySelector('.stage-glyph').innerHTML=D.ITEMS[s.icons[i]]?Q.itemIco(D.ITEMS[s.icons[i]]):ico(s.icons[i]);li.dataset.glyph=s.icons[i];}li.querySelector('.stage-label').textContent=s.labels[i];li.querySelector('.stage-check').innerHTML=done?ico('check'):'';li.querySelector('.stage-track i').style.transform=`scaleX(${done?1:current?s.progress:0})`;li.setAttribute('aria-label',s.labels[i]+': '+(done?'complete':current?'in progress':'pending'));li.dataset.tip='text:'+explain[mode][i];});
});
const update=()=>{
 updateStages();
 for(const el of document.querySelectorAll('[data-field-recovery]')){
  const town=el.dataset.fieldRecovery, result=Q.fieldRecovery?.(town);
  const signature=Q.signatureOf?.(town)?.id;
  const egg=signature&&Q.eggOf?.(signature)?signature:null;
  if(el.lastRecovery===result&&el.waitingEgg===egg)continue;
  el.lastRecovery=result;
  el.waitingEgg=egg;
  el.innerHTML=UI.fieldRecoveryHtml(result,egg);
 }
};
const hunting0=UI.V.hunting;
UI.V.hunting=()=>{const h=hunting0();return !Q.skillUnlocked('hunting')?h:h.replace('<div class="btnrow"><button class="btn primary" data-do="huntgo"',html('hunt')+'<div class="btnrow"><button class="btn primary" data-do="huntgo"');};
const beasts0=UI.V.beastmastery;
UI.V.beastmastery=()=>{const h=beasts0();if(!Q.skillUnlocked('beastmastery'))return h;if(UI.beastMode==='field')return h.replace('<div class="activity-actions">',html('field')+'<div class="activity-actions">');return h.replace('<section class="panel beast-expedition"><h3>Send a trap for an egg</h3>','<section class="panel beast-expedition"><h3>Send a trap for an egg</h3>'+html('expedition'));};
const render0=UI.render;
UI.render=(...args)=>{const r=render0(...args);update();return r;};
Q.on('ui',update);
})();
