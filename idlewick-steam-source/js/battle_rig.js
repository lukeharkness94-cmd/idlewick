/* Articulated pixel fighters: separate head, torso, arms, hands and legs.
   Browser timelines interpolate every pose at the display's refresh rate. */
(() => {
const Q=window.DQ,D=Q.data;
const unit=n=>`calc(${n} * var(--rig-unit))`;
const colour=(c,t)=>'#'+[1,3,5].map(i=>Math.round(parseInt(c.slice(i,i+2),16)*(1-t)+240*t).toString(16).padStart(2,'0')).join('');
const img=cv=>`<img src="${cv.toDataURL()}" alt="" draggable="false">`;
const box=(name,x,y,w,h,px,py,html)=>`<span class="battle-bone ${name}" style="left:${unit(x)};top:${unit(y)};width:${unit(w)};height:${unit(h)};transform-origin:${unit(px)} ${unit(py)}">${html}</span>`;
function crop(source,x,y,w,h){const c=document.createElement('canvas');c.width=w;c.height=h;c.getContext('2d').drawImage(source,x,y,w,h,0,0,w,h);return c;}
let heroKey='',heroHtml='';
Q.battleHero=()=>{
 const look=Q.heroLook(Q.S.look),key=JSON.stringify(look);if(key===heroKey)return heroHtml;
 const eq=look.eq,skin=look.skin||'#ddb38e',cloth=eq.body?D.ITEMS[eq.body].col:look.tunic||'#528eab',legs=eq.legs?D.ITEMS[eq.legs].col:'#655545',source=Q.heroRigCanvas(Q.S.look);
 const arm=()=>{const p=Q.pixelPainter(8,15);p.poly([[1,0],[7,0],[8,12],[6,15],[1,14]],cloth);p.line(2,2,2,11,colour(cloth,.22));return img(p.canvas());};
 const hand=()=>{const p=Q.pixelPainter(8,14);p.rect(1,0,6,6,eq.body?cloth:skin);p.rect(1,5,6,8,skin);p.line(2,7,2,11,colour(skin,.18));return img(p.canvas());};
 const leg=(front)=>{const p=Q.pixelPainter(13,22);p.poly([[2,0],[11,0],[10,18],[2,18]],legs);p.line(3,2,3,16,colour(legs,.2));if(eq.legs){p.rect(2,8,8,4,colour(legs,.15));p.line(4,9,8,9,colour(legs,.35));}p.rect(0,18,13,4,'#4a3d30');p.rect(1,18,10,1,'#8d7652');return img(p.canvas());};
 const style=Q.weaponStyle(),weapon=eq.weapon&&D.ITEMS[eq.weapon];
 let held='';
 if(weapon&&style!=='ranged')held=box('rig-held-weapon',-5,-13,36,36,9,27,`<img src="${Q.gearIconUrl(weapon.id)}" alt="" draggable="false">`);
 if(weapon&&style==='ranged'){
  const p=Q.pixelPainter(24,42),c=weapon.col;p.poly([[5,1],[11,4],[20,17],[20,26],[10,39],[4,41],[9,32],[15,23],[15,18],[9,8]],c);p.line(6,3,16,17,colour(c,.3));p.rect(13,18,5,8,'#bfa16c');
  held=box('rig-bow',-7,-20,24,42,7,26,img(p.canvas())+`<svg class="rig-bow-string" viewBox="0 0 24 42" aria-hidden="true"><path d="M5 2 L5 21 L5 40"/></svg><span class="rig-nocked-arrow"></span>`);
 }
 const shield=eq.shield&&style==='melee'?box('rig-held-shield',-5,3,20,24,10,9,`<img src="${Q.gearIconUrl(eq.shield)}" alt="" draggable="false">`):'';
 let cape='';if(look.cape){const p=Q.pixelPainter(48,68),c=look.cape.col||'#738451';p.poly([[13,25],[35,25],[41,59],[9,59]],c);p.line(10,58,39,58,'#dcb866');cape=box('rig-cape',0,0,48,68,24,27,img(p.canvas()));}
 heroHtml=`<span class="battle-rig hero-rig encounter-hero rig-${style}" role="img" aria-label="Your equipped hero in a battle stance">${cape}${box('rig-leg-left',10,44,13,22,7,2,leg(false))}${box('rig-leg-right',26,44,13,22,6,2,leg(true))}${box('rig-torso',10,25,29,24,14,20,img(crop(source,10,25,29,24)))}${box('rig-head',11,0,27,27,13,24,img(crop(source,11,0,27,27)))}${box('rig-arm-left',7,25,8,15,6,3,arm()+box('rig-forearm-left',0,11,8,14,4,2,hand()+shield))}${box('rig-arm-right',30,25,8,15,4,3,arm()+box('rig-forearm-right',0,11,8,14,4,2,hand()+held+`<span class="rig-hand-anchor"></span>`))}</span>`;
 heroKey=key;return heroHtml;
};
const humans=new Set(['goblin','grubnash','scarecrow','bandit','smuggler','pirate','barnacle','raider','troll','frostmaw','zombie','skeleton','morwenna','emberlord','golem','voidknight','hollowking']);
const quads=new Set(['rat','cow','boar','wolf','oldtusk','icewolf','hound','bogsnapper']);
const birds=new Set(['chicken','hawk','zephyrion']);
const wings=new Set(['bat','imp','drake','pyrrhax','wyvern']);
const foes=new Map();
Q.battleFoe=m=>{
 if(foes.has(m.id))return foes.get(m.id);
 const type=D.EXTRA_CREATURES?.[m.id]?.body|| (humans.has(m.id)?'humanoid':quads.has(m.id)?'beast':birds.has(m.id)?'bird':wings.has(m.id)?'winged':['crab','horror'].includes(m.id)?'clawed':'spectral');
 const source=Q.artCanvas('creature',m.id),data=source.getContext('2d').getImageData(0,0,48,48),layers=new Map();
 const group=(x,y)=>{
  if(type==='humanoid'){if(y<23)return 'foe-head';if(x<15)return 'foe-arm-front';if(x>33)return 'foe-arm-back';if(y>=35)return x<25?'foe-leg-front':'foe-leg-back';return 'foe-torso';}
  if(type==='beast'){if(x<17&&y<31)return y>=24?'foe-jaw':'foe-head';if(x>39&&y<30)return 'foe-tail';if(y>=32)return x<27?'foe-leg-front':'foe-leg-back';return 'foe-torso';}
  if(type==='bird'){if(x<21&&y<25)return 'foe-head';if(x>=31&&y<31)return 'foe-wing-back';if(x>=17&&x<31&&y>=23&&y<33)return 'foe-wing-front';if(y>=36)return x<25?'foe-leg-front':'foe-leg-back';return 'foe-torso';}
  if(type==='winged'){if(x<17&&y<35)return 'foe-wing-front';if(x>32&&y<35)return 'foe-wing-back';if(y<23)return 'foe-head';if(y>35)return x<25?'foe-leg-front':'foe-tail';return 'foe-torso';}
  if(type==='clawed'){if(y<25&&x<13)return 'foe-claw-front';if(y<25&&x>34)return 'foe-claw-back';if(y>=32)return x<24?'foe-leg-front':'foe-leg-back';return 'foe-torso';}
  if(y<24)return 'foe-head';if(y>33)return x<24?'foe-tail':'foe-leg-back';return 'foe-torso';
 };
 for(let y=0;y<48;y++)for(let x=0;x<48;x++){
  const i=(y*48+x)*4;if(!data.data[i+3])continue;const name=group(x,y);
  if(!layers.has(name))layers.set(name,new Uint8ClampedArray(48*48*4));layers.get(name).set(data.data.subarray(i,i+4),i);
 }
 const pivots={'foe-head':type==='beast'?[17,22]:[24,23],'foe-jaw':[13,24],'foe-arm-front':[14,25],'foe-arm-back':[34,25],'foe-leg-front':[18,34],'foe-leg-back':[31,34],'foe-wing-front':[21,24],'foe-wing-back':[30,24],'foe-claw-front':[13,25],'foe-claw-back':[35,25],'foe-tail':[32,31],'foe-torso':[25,32]};
 const html=[...layers].sort(([a],[b])=>a.includes('back')?-1:b.includes('back')?1:0).map(([name,pixels])=>{
  const cv=document.createElement('canvas');cv.width=cv.height=48;const cx=cv.getContext('2d'),im=cx.createImageData(48,48);im.data.set(pixels);cx.putImageData(im,0,0);
  return box(name,0,0,48,48,...pivots[name],img(cv));
 }).join('');
 const result=`<span class="battle-rig foe-rig foe-${type}" role="img" aria-label="${Q.esc(m.name)} ready for battle" data-creature="${m.id}" data-body="${type}">${html}</span>`;foes.set(m.id,result);return result;
};
Q.battleTiming={release:210,impact:390,duration:720};
Q.poseBattle=(avatar,style,phase,animate)=>{
 const root=avatar?.querySelector('.battle-rig');if(!root)return false;
 const token={};root._pose=token;root.dataset.action=phase==='attack'?style:phase;
 const run=(name,poses,duration=Q.battleTiming.duration)=>{
  const el=root.querySelector('.'+name);if(!el)return;
  const frames=poses.map(([offset,transform])=>({offset,transform,easing:'cubic-bezier(.25,.65,.35,1)'}));
  animate(el,frames,{duration,easing:'linear'});
 };
 const limb=(name,ready,windup,strike,follow)=>run(name,[[0,`rotate(${ready}deg)`],[.26,`rotate(${windup}deg)`],[.54,`rotate(${strike}deg)`],[.72,`rotate(${follow}deg)`],[1,`rotate(${ready}deg)`]]);
 if(phase==='hit'||phase==='miss'){
  const sign=root.classList.contains('hero-rig')?-1:1;
  run(root.classList.contains('hero-rig')?'rig-torso':'foe-torso',[[0,'rotate(0)'],[.2,`translateX(${sign*3}px) rotate(${sign*7}deg)`],[.55,`rotate(${-sign*2}deg)`],[1,'rotate(0)']],340);
  run(root.classList.contains('hero-rig')?'rig-head':'foe-head',[[0,'rotate(0)'],[.22,`rotate(${sign*12}deg)`],[1,'rotate(0)']],340);
 }else if(root.classList.contains('hero-rig')){
  limb('rig-leg-left',4,10,-12,-5);limb('rig-leg-right',-4,-8,14,8);
  run('rig-torso',[[0,'rotate(-2deg)'],[.25,'rotate(-8deg) translateX(-1px)'],[.54,'rotate(7deg) translateX(2px)'],[.75,'rotate(4deg)'],[1,'rotate(-2deg)']]);
  run('rig-head',[[0,'rotate(2deg)'],[.26,'rotate(-5deg)'],[.54,'rotate(7deg) translateX(1px)'],[1,'rotate(2deg)']]);
  if(style==='ranged'){
   limb('rig-arm-right',-20,-100,-95,-80);limb('rig-forearm-right',10,7,0,10);limb('rig-bow',0,93,95,70);
   limb('rig-arm-left',15,-50,-70,-30);limb('rig-forearm-left',-10,-95,-10,-20);
   const string=root.querySelector('.rig-bow-string path');
   if(string)animate(string,[{d:'path("M5 2 L5 21 L5 40")'},{d:'path("M5 2 L-8 21 L5 40")',offset:.3},{d:'path("M5 2 L5 21 L5 40")',offset:.54},{d:'path("M5 2 L5 21 L5 40")'}],{duration:720,easing:'ease-in-out'});
   const arrow=root.querySelector('.rig-nocked-arrow');if(arrow)animate(arrow,[{opacity:0},{opacity:1,offset:.18},{opacity:1,offset:.29},{opacity:0,offset:.32},{opacity:0}],{duration:720,easing:'linear'});
  }else if(style==='magic'){
   limb('rig-arm-right',-15,-140,-100,-70);limb('rig-forearm-right',0,25,-25,5);limb('rig-held-weapon',10,40,105,90);
   limb('rig-arm-left',10,45,-95,-45);limb('rig-forearm-left',-5,-55,-5,-15);
  }else{
   limb('rig-arm-right',-20,-150,-75,25);limb('rig-forearm-right',10,65,-30,-50);limb('rig-held-weapon',0,30,105,115);
   limb('rig-arm-left',12,40,5,15);limb('rig-forearm-left',-15,-40,-55,-20);
  }
  limb('rig-cape',0,4,-7,-3);
 }else{
  const type=root.dataset.body;
  const creature=root.dataset.creature||'',motion=[...creature].reduce((n,ch)=>(n*33+ch.charCodeAt(0))>>>0,5381);
  const reach=7+(motion%7),lift=1+((motion>>>3)%5),tilt=1+((motion>>>6)%4),squash=(.97-((motion>>>9)%3)*.01).toFixed(2);
  /* Move the connected silhouette as the main attack. Joint motion stays small
     so hard pixel cut-lines never open into visible gaps. A stable creature hash
     varies reach, lift, tilt and squash, giving every species its own cadence. */
  animate(root,[{transform:'translate(0,0) rotate(0) scale(1)'},{transform:`translate(${Math.ceil(reach/2)}px,-${lift}px) rotate(${tilt}deg) scale(1.02,.99)`,offset:.28},{transform:`translate(-${reach}px,${Math.floor(lift/2)}px) rotate(-${tilt}deg) scale(1.04,${squash})`,offset:.54},{transform:`translate(-${Math.floor(reach/3)}px,0) rotate(-1deg) scale(1.01)`,offset:.74},{transform:'translate(0,0) rotate(0) scale(1)'}],{duration:Q.battleTiming.duration+(motion%5)*18,easing:'cubic-bezier(.25,.65,.35,1)'});
  limb('foe-head',0,3,type==='beast'?-7:-5,-2);limb('foe-jaw',0,2,10,4);
  limb('foe-arm-front',0,-18,24,8);limb('foe-arm-back',0,12,-10,-4);
  limb('foe-leg-front',0,-4,6,2);limb('foe-leg-back',0,4,-5,-2);
  limb('foe-wing-front',0,14,-17,-6);limb('foe-wing-back',0,-12,15,5);
  limb('foe-claw-front',0,-12,16,5);limb('foe-claw-back',0,12,-16,-5);limb('foe-tail',0,-7,10,3);
 }
 setTimeout(()=>{if(root._pose===token)delete root.dataset.action;},Q.battleTiming.duration);
 return true;
};
})();
