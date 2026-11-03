/* Scene-local effects driven by real combat hits and completed work cycles.
   No simulation timers or permanent animation loop are added. */
(() => {
const Q=window.DQ,UI=Q.ui;
const calm=()=>Q.S.settings.reduceFx||matchMedia('(prefers-reduced-motion: reduce)').matches;
const active=new Set(),channels=new WeakMap();
function animate(el,frames,options,channel='pose'){
 if(!el||!el.isConnected||calm()||document.hidden)return;
 let owned=channels.get(el);if(!owned){owned=new Map();channels.set(el,owned);}
 owned.get(channel)?.cancel();
 const a=el.animate(frames,options);owned.set(channel,a);active.add(a);
 const clean=()=>{active.delete(a);if(owned.get(channel)===a)owned.delete(channel);};a.onfinish=clean;a.oncancel=clean;return a;
}
function effect(scene,cls,html,x,y){
 const el=document.createElement('span');el.className='scene-effect '+cls;el.setAttribute('aria-hidden','true');el.innerHTML=html;el.style.left=x+'px';el.style.top=y+'px';scene.appendChild(el);
 const older=scene.querySelectorAll('.scene-effect');if(older.length>12)older[0].remove();return el;
}
function fly(el,frames,options){
 const a=animate(el,frames,options);if(!a){el.remove();return;}const finish=a.onfinish,cancel=a.oncancel;
 a.onfinish=()=>{finish?.();el.remove();};a.oncancel=()=>{cancel?.();el.remove();};
}
function point(el,scene){const a=el.getBoundingClientRect(),b=scene.getBoundingClientRect();return {x:a.left-b.left+a.width/2,y:a.top-b.top+a.height*.55};}
function sparks(scene,x,y,col,count=4){
 for(let i=0;i<count;i++){
  const el=effect(scene,'pixel-spark','',x,y);el.style.background=col;
  fly(el,[{transform:'translate(0,0)',opacity:1},{transform:`translate(${(i%2?-1:1)*(10+i*6)}px,${-12-i*5}px)`,opacity:.9,offset:.5},{transform:`translate(${(i%2?-1:1)*(15+i*7)}px,${8+i*4}px)`,opacity:0}],{duration:450+i*35,easing:'cubic-bezier(.22,.7,.3,1)'});
 }
}
Q.on('splat',(side,text,kind,delay=0)=>{
 if(calm()||document.hidden||UI.view!=='combat'||Q.sim.on)return;
 const arena=document.querySelector('.encounter-arena'),you=document.getElementById('av-you'),foe=document.getElementById('av-foe');if(!arena||!you||!foe)return;
 const numeric=/^\d/.test(String(text));if(!numeric)return;
 const actor=side==='foe'?you:foe,target=side==='foe'?foe:you,dir=side==='foe'?1:-1;
 const style=side==='foe'?Q.pstats().style:'melee',landed=!kind.includes('miss');
 setTimeout(()=>{
  if(!arena.isConnected||calm()||document.hidden||UI.view!=='combat')return;
  const end=point(target,arena);
  const pose=style==='melee'?[{transform:'translateX(0)'},{transform:`translateX(${-dir*5}px) rotate(${-dir*3}deg)`,offset:.22},{transform:`translateX(${dir*20}px) rotate(${dir*5}deg)`,offset:.48},{transform:'translateX(0)'}]:[{transform:'translateY(0)'},{transform:'translateY(-3px)',offset:.3},{transform:'translateY(0)'}];
  Q.poseBattle?.(actor,style,'attack',animate);
  animate(actor,pose.map(frame=>({...frame,easing:'cubic-bezier(.22,.7,.3,1)'})),{duration:Q.battleTiming?.duration||720,easing:'linear'});
  const timing=Q.battleTiming||{release:210,impact:390};
  setTimeout(()=>{
   if(!arena.isConnected||calm()||document.hidden)return;
   const hand=actor.querySelector(style==='magic'?'.rig-held-weapon':'.rig-hand-anchor')||actor;
   const launch=point(hand,arena);
   if(style==='ranged'||style==='magic'){
    const projectile=effect(arena,'combat-projectile '+style,style==='ranged'?Q.ico('arrow_ammo'):'',launch.x,launch.y);
    if(style==='magic')projectile.style.setProperty('--spell-color',Q.fight?.lastEl==='fire'?'#ebaa65':Q.fight?.lastEl==='frost'?'#a8d8e2':'#c3ace7');
    const angle=Math.atan2(end.y-launch.y,end.x-launch.x)*180/Math.PI;
    fly(projectile,[{transform:`translate(-50%,-50%) rotate(${angle+45}deg)`,opacity:1},{transform:`translate(calc(-50% + ${end.x-launch.x}px),calc(-50% + ${end.y-launch.y}px)) rotate(${angle+45}deg)`,opacity:1}],{duration:timing.impact-timing.release,easing:'linear'});
   }else{
    const slash=effect(arena,'combat-slash','',end.x,end.y);
    fly(slash,[{transform:'translate(-50%,-50%) rotate(-65deg) scale(.4)',opacity:0},{transform:'translate(-50%,-50%) rotate(15deg) scale(1)',opacity:1,offset:.5},{transform:'translate(-50%,-50%) rotate(80deg) scale(1.1)',opacity:0}],{duration:260,easing:'cubic-bezier(.2,.7,.3,1)'});
   }
  },timing.release);
  setTimeout(()=>{
   if(!arena.isConnected||calm()||document.hidden)return;
   Q.poseBattle?.(target,style,landed?'hit':'miss',animate);
   if(landed){
    animate(target,[{transform:'translateX(0)',filter:'brightness(1)'},{transform:`translateX(${dir*7}px)`,filter:'brightness(1.35)',offset:.2},{transform:`translateX(${-dir*3}px)`,filter:'brightness(1)',offset:.5},{transform:'translateX(0)',filter:'brightness(1)'}],{duration:310,easing:'cubic-bezier(.22,.7,.3,1)'});
    sparks(arena,end.x,end.y,side==='you'?'#d99882':'#e2cca0',String(text).includes('!')?6:4);
   }else animate(target,[{transform:'translateX(0)'},{transform:`translateX(${dir*9}px)`,offset:.45},{transform:'translateX(0)'}],{duration:350,easing:'cubic-bezier(.22,.7,.3,1)'});
  },timing.impact);
 },Math.max(0,delay-180));
});
Q.on('workcycle',event=>{
 if(calm()||document.hidden||Q.sim.on)return;
 const scene=document.querySelector('.activity-scene');if(!scene||scene.dataset.kind!==event.kind||scene.dataset.task!==event.id)return;
 const target=scene.querySelector('.scene-target'),at=point(target,scene);
 if(event.quantity>0){
  const node=Q.data.NODE[event.kind+':'+event.id],recipe=Q.data.RECIPES[event.id];
  const item=node?.item||recipe&&Object.keys(recipe.out)[0];
  const output=effect(scene,'work-result',item?Q.itemIco(Q.data.ITEMS[item]):Q.ico('coin'),at.x,at.y);
  fly(output,[{transform:'translate(-50%,-30%) scale(.6)',opacity:0},{transform:'translate(-50%,-75%) scale(1)',opacity:1,offset:.25},{transform:'translate(65px,-110px) scale(.6)',opacity:0}],{duration:850,easing:'cubic-bezier(.2,.65,.4,1)'});
  const yieldIcon=scene.querySelector('.scene-yield');if(yieldIcon)animate(yieldIcon,[{filter:'brightness(1)'},{filter:'brightness(1.4)',offset:.4},{filter:'brightness(1)'}],{duration:450});
  if(event.kind==='wood'||event.kind==='mine')sparks(scene,at.x-25,at.y+25,event.kind==='wood'?'#c5a06a':'#d8c69d');
  if(event.kind==='fish')animate(target,[{transform:'translateY(0) rotate(0)'},{transform:'translateY(-18px) rotate(-8deg)',offset:.4},{transform:'translateY(0) rotate(0)'}],{duration:600,easing:'cubic-bezier(.22,.7,.3,1)'});
 }else if(event.kind==='thieve')animate(target,[{filter:'brightness(1)'},{filter:'brightness(.8)',offset:.4},{filter:'brightness(1)'}],{duration:400});
});
const render=UI.render;
UI.render=fresh=>{render(fresh);if(calm())for(const a of [...active])a.cancel();};
document.addEventListener('visibilitychange',()=>{
 document.body.classList.toggle('scene-paused',document.hidden);
 if(document.hidden)for(const a of [...active])a.cancel();
});
})();
