/* Ten-level bonds, deliberate training and wall-clock trap expeditions.
   No bell entries, daily obligations or offline decay. All saves remain version 2. */
(() => {
const Q=window.DQ,D=Q.data,UI=Q.ui,S=()=>Q.S,{esc,fmt}=Q;
const finite=(v,f=0)=>Number.isFinite(v)&&v>=0?v:f, own=(o,k)=>Object.prototype.hasOwnProperty.call(o,k);
const record=o=>!!o&&typeof o==='object'&&!Array.isArray(o);
Q.registerBondArt?.();
const MAX=D.BOND_XP.length, COOLDOWN=45*60000;
const oldLevel=Q.petLevel;
Q.beastSpec=id=>D.BEAST_SPECIES[id]||(D.PET[id]?{name:D.PET[id].name,kind:D.PET[id].kind,town:D.MON[D.PET[id].mon]?.town||'willowbrook',hero:15,rarity:'rare',damage:.85,evolution:'True-bond '+D.PET[id].name,passive:'legacy',base:0}:null);
Q.beastTargets=()=>D.PETS.filter(p=>D.BEAST_SPECIES[p.id]||(p.collectible&&p.id.startsWith('wild_')));
Q.beastLevelFrom=x=>{let lv=1;while(lv<MAX&&finite(x)>=D.BOND_XP[lv])lv++;return lv;};
/* Only companion fields are repaired; invalid core save values still fail the original validator. */
Q.prepareBeastSave=o=>{
 if(!record(o))return o;
 const next={...o},p=record(o.pets)?{...o.pets}:{};p.owned=record(p.owned)?{...p.owned}:{};
 for(const [id,v]of Object.entries(p.owned)){
  if(!D.PET[id]||!record(v)){delete p.owned[id];continue;}
  p.owned[id]={...v};for(const k of ['xp','aff','bondXp','trainingUntil'])if(k in v)p.owned[id][k]=finite(v[k]);
 }
 p.active=typeof p.active==='string'&&p.owned[p.active]?p.active:null;
 p.tracks=record(p.tracks)?Object.fromEntries(Object.entries(p.tracks).filter(([k])=>D.PET[k]).map(([k,v])=>[k,Math.min(5,Math.floor(finite(v)))])):{};
 p.events=Array.isArray(p.events)?p.events.filter(e=>record(e)&&typeof e.text==='string'&&Number.isFinite(e.t)).slice(-40):[];
 const j=p.expedition;
 p.expedition=record(j)&&D.PET[j.species]&&D.BEAST_TRAPS[j.tier]&&Number.isFinite(j.due)&&Number.isFinite(j.sent)&&j.due>=j.sent&&Number.isFinite(j.roll)&&j.roll>=0&&j.roll<1?{...j}:null;
 next.pets=p;return next;
};
Q.migrateBeasts=st=>{
 const p=st.pets; if(!p)return;
 p.tracks=p.tracks||{};p.events=p.events||[];p.expedition=p.expedition||null;
 for(const [id,o]of Object.entries(p.owned)){
  if(!D.PET[id])continue;
  if(!Number.isFinite(o.bondXp)){
   /* Preserve earned old levels, not uncapped XP accumulated while already at the old maximum. */
   const table=Number.isFinite(o.xp)?(D.CREATURE_LEVELS||D.PET_LEVELS):D.PET_LEVELS,x=finite(Number.isFinite(o.xp)?o.xp:o.aff);let lv=1;
   table.forEach((t,i)=>{if(x>=t)lv=i+1;});lv=Math.min(MAX,lv);
   o.bondXp=D.BOND_XP[lv-1];
   if(lv<table.length&&table[lv]>table[lv-1])o.bondXp+=(D.BOND_XP[lv]-D.BOND_XP[lv-1])*Math.min(.999,(x-table[lv-1])/(table[lv]-table[lv-1]));
  }
  o.trainingUntil=finite(o.trainingUntil);o.evolved=Q.beastLevelFrom(o.bondXp)>=MAX;
 }
 p.bondVersion=1;
};
const ensure=()=>{const p=S().pets;if(p.bondVersion!==1||Object.values(p.owned).some(o=>!Number.isFinite(o.bondXp)))Q.migrateBeasts(S());return p;};
Q.petLevel=id=>{const o=S().pets.owned[id];return !o?0:Number.isFinite(o.bondXp)?Q.beastLevelFrom(o.bondXp):oldLevel(id);};
Q.beastPassive=(id,level=Q.petLevel(id))=>{const s=Q.beastSpec(id);if(!s)return null;const lv=Math.max(1,Math.min(MAX,level)),step=D.BOND_MILESTONES.filter(n=>n<=lv).length;return {key:s.passive,value:s.base+step*D.BOND_PASSIVE_STEP,steps:step,level:lv};};
Q.beastPassiveText=id=>{const p=D.PET[id],b=Q.beastPassive(id);if(!p||!b)return '';if(b.key==='legacy')return `${p.text||'Signature companion bonus'} · bond multiplier ×${(1+.25*(Math.min(5,b.level)-1)+Math.max(0,b.level-5)*.05).toFixed(2)}`;return `+${+(b.value*100).toFixed(1)}% ${({crit:'critical-hit chance',coin:'coin find',xpAll:'XP gain',boss:'damage against bosses'})[b.key]}${b.level===MAX&&b.key==='crit'?' · critical hits strike twice':''}`;};
Q.beastActive=()=>{const id=S().pets.active;return id&&D.PET[id]&&S().pets.owned[id]?id:null;};
/* Existing signature bonuses stop their old multiplier at five, then grow gently. New species use only their one passive. */
const fx0=Q.fx;let beastFxCache=null;
Q.fx=()=>{const f=fx0(),id=Q.beastActive(),key=id+':'+Q.petLevel(id);if(beastFxCache?.f===f&&beastFxCache.key===key)return f;
 if(id){const b=Q.beastPassive(id);if(b.key==='coin')f.coin+=b.value;if(b.key==='xpAll')f.xpAll+=b.value;}
 beastFxCache={f,key};return f;};
Q.beastHeroHit=(damage,m,f)=>{const id=Q.beastActive(),b=id&&Q.beastPassive(id);if(!b||!damage)return damage;
 if(b.key==='boss'&&m.boss)damage*=1+b.value;
 if(b.key==='crit'&&Math.random()<b.value){damage*=b.level===MAX?Q.beastSpec(id).evolvedCritDamage:Q.beastSpec(id).critDamage;Q.splat('foe',b.level===MAX?'Twin critical':'Critical','hit power',180);}
 return Math.round(damage);
};
Q.beastDamage=(id,level=Q.petLevel(id))=>{const s=Q.beastSpec(id);return s?s.damage*(1+.12*Math.max(1,Math.min(MAX,level))):0;};
/* Synchronised cadence: fixed species hit strength; attack spacing follows the hero's expected ordinary DPS.
   At bond 10, a companion supplies 17.5% of baseline hero DPS rather than dominating low-level equipment. */
Q.beastHeroDps=m=>{const ps=Q.pstats(),W=D.WTYPES[D.weaponType()],wr=Q.weakOf(m,Q.fight),dtype=Q.myDtype(),mult=wr.weak.includes(dtype)?Q.typeMult(m,'weak'):wr.resist.includes(dtype)?Q.typeMult(m,'resist'):1;
 const acc=ps.acc*W.acc*(wr.weak.includes(dtype)?1.1:1),def=(m.def+8)*(64+m.def),hit=acc>def?1-(def+2)/(2*(acc+1)):acc/(2*(def+1));
 const power=Q.ability('power')?1.22:1;return power*Math.max(.05,Math.min(.95,Math.max(.05,hit))*(Math.max(1,Math.round(ps.max*W.dmg*mult))+1)/2/(Q.combatInterval()/1000));};
Q.beastAttack=(f,m)=>{const id=Q.beastActive();if(!id)return 0;
 if(f.beastId!==id){f.beastId=id;f.beastClock=0;}
 const hit=Q.beastDamage(id),maxHit=Q.beastDamage(id,MAX),period=maxHit/(Q.beastHeroDps(m)*.175)*1000;
 f.beastClock=(f.beastClock||0)+(Q.act?.dur||Q.combatInterval());let damage=0;
 while(f.beastClock+1e-6>=period){f.beastClock-=period;damage+=hit;}
 if(damage){f.beastDamage=(f.beastDamage||0)+damage;Q.splat('foe',`${D.PET[id].name} ${+damage.toFixed(2)}`,'hit beast-hit',240);if(!Q.sim.on)Q.emit('beaststrike',id);}
 return damage;
};
const event=(kind,id,text,now=Date.now())=>{if(Q.forecasting)return;const p=ensure();p.events.push({kind,id,text,t:now});if(p.events.length>40)p.events.splice(0,p.events.length-40);if(Q.journal)Q.journal('beast',text,'paw');};
Q.beastGain=(id,xp)=>{if(Q.forecasting||!Number.isFinite(xp)||xp<=0||!S().pets.owned[id])return 0;const p=ensure(),o=p.owned[id],before=Q.petLevel(id),was=o.evolved;
 const gain=Math.min(xp,Math.max(0,D.BOND_XP[MAX-1]-o.bondXp));o.bondXp+=gain;const after=Q.petLevel(id);
 if(Q.sim.on){const b=Q.sim.beasts||(Q.sim.beasts={});b[id]=b[id]||{xp:0,from:before,to:before};b[id].xp+=gain;b[id].to=after;}
 if(after>before){event('level',id,`${D.PET[id].name} grew from bond ${before} to ${after}.`);for(let lv=before+1;lv<=after;lv++)if(D.BOND_MILESTONES.includes(lv))event('milestone',id,`${D.PET[id].name}: bond ${lv} deepened your shared strength.`);}
 if(after===MAX&&!was){o.evolved=true;event('evolution',id,`${D.PET[id].name} evolved into ${Q.beastSpec(id).evolution}.`);}
 if(after!==before)Q.fxDirty();return gain;
};
Q.beastVictory=f=>{if(Q.forecasting||!f)return;const id=Q.beastActive();if(id)Q.beastGain(id,finite(f.heroXp)*.25);};
/* Replace the old per-creature XP grant: combat now awards exactly 25% of actual hero combat XP on victory. */
Q.creatureGainXp=()=>{};
Q.beastTraining=(id,want)=>{const o=S().pets.owned[id];if(!o||!D.PET[id])return {ok:false,reason:'Choose an owned beast'};const lv=Q.petLevel(id),coins=30+lv*10,food=want&&D.ITEMS[want]?.heal>0&&Q.have(want)>=2?want:Q.foods().find(k=>D.ITEMS[k]?.heal>0&&Q.have(k)>=2),left=Math.max(0,finite(o.trainingUntil)-Date.now());
 const reason=!Q.skillUnlocked('beastmastery')?'Learn Beastmastery first':lv>=MAX?'Bond complete':left?`Ready in ${Q.fmtTime(left)}`:S().coins<coins?`Needs ${coins} coins`:!food?'Needs 2 cooked food':'';
 return {ok:!reason,reason,coins,food,foodCount:2,xp:150+lv*50,left};};
const transaction=mutate=>{const before=JSON.parse(JSON.stringify(S()));mutate();Q.fxDirty();if(!Q.save()){Q.S=before;Q.fxDirty();return false;}return true;};
Q.trainBeast=(id,want)=>{if(Q.forecasting)return false;ensure();const t=Q.beastTraining(id,want);if(!t.ok)return false;
 return transaction(()=>{S().coins-=t.coins;Q.take(t.food,2);S().pets.owned[id].trainingUntil=Date.now()+COOLDOWN;Q.beastGain(id,t.xp);Q.addXp('beastmastery',20);S().stats.train=(S().stats.train||0)+1;Q.qev('train',id);event('training',id,`${D.PET[id].name} trained beside you. +${t.xp} bond XP.`);});};
Q.beastTrapReason=(id,tier)=>{const s=Q.beastSpec(id),t=D.BEAST_TRAPS[tier];if(!s||!Q.beastTargets().some(p=>p.id===id)||!t)return 'Choose a beast and trap';if(!Q.skillUnlocked('beastmastery'))return 'Learn Beastmastery first';if(S().pets.owned[id])return 'Already befriended';if(S().pets.expedition)return 'A trap is already out';if(Q.advLvl()<s.hero)return `Requires Hero ${s.hero}`;if(!S().towns[s.town]?.visited)return `Visit ${D.TOWN[s.town].name} first`;if(t.item?!Q.have(t.item):S().coins<t.cost)return t.item?'Needs a Rune trap':`Needs ${t.cost} coins`;return '';};
Q.beastCaptureChance=(id,tier)=>D.BEAST_TRAPS[tier]?.[Q.beastSpec(id)?.rarity]||0;
Q.sendBeastTrap=(id,tier)=>{if(Q.forecasting)return false;ensure();if(Q.beastTrapReason(id,tier))return false;const t=D.BEAST_TRAPS[tier],now=Date.now();return transaction(()=>{if(t.item)Q.take(t.item,1);else S().coins-=t.cost;S().pets.expedition={species:id,tier,sent:now,due:now+t.hours*3600000,roll:Math.random()};event('sent',id,`A ${t.name.toLowerCase()} waits for ${D.PET[id].name}; it returns in ${t.hours} hour${t.hours===1?'':'s'}.`,now);});};
Q.resolveBeastTrap=(now=Date.now())=>{if(Q.forecasting)return false;const p=ensure(),j=p.expedition;if(!j||now<j.due)return false;
 return transaction(()=>{const t=D.BEAST_TRAPS[j.tier],tracks=p.tracks[j.species]||0,pity=tracks>=5,won=pity||j.roll<Q.beastCaptureChance(j.species,j.tier);p.expedition=null;
  if(won){if(pity)p.tracks[j.species]=tracks-5;Q.awardPet(j.species,{quiet:true});Q.migrateBeasts(S());event('capture',j.species,`${D.PET[j.species].name} left an egg in the trap${pity?': five tracks made it certain':''}.`,now);}
  else{S().coins+=t.consolation;p.tracks[j.species]=Math.min(5,tracks+1);event('return',j.species,`${D.PET[j.species].name} slipped away. +${t.consolation} coins, track ${p.tracks[j.species]}/5.`,now);}
 });};
/* Resolve real deadlines after offline work, never during forecasts or by consuming the effective-work cap. */
const simulate0=Q.simulate;
Q.simulate=(ms,real=ms)=>{const p=ensure(),before=new Set(p.events.map(e=>JSON.stringify(e))),summary=simulate0(ms,real);if(!Q.forecasting){Q.resolveBeastTrap();summary.beastEvents=ensure().events.filter(e=>!before.has(JSON.stringify(e))&&e.kind!=='sent');}return summary;};
const world0=Q.advanceWorld;let wallPoll=0;
Q.advanceWorld=dt=>{world0(dt);if(!Q.sim.on&&!Q.forecasting&&(wallPoll+=dt)>=1000){wallPoll=0;if(Q.resolveBeastTrap()&&UI.view==='beastmastery')UI.render(false);}};
/* Training is a deliberate purchase, not an endlessly repeating paid task. Existing fieldwork lures are preserved. */
const train0=Q.KIND_EXT.train;
Q.KIND_EXT.train={...train0,check:id=>String(id).startsWith('lure:')?train0.check(id):'Use the Beast training button; sessions are deliberate purchases',done:a=>{if(String(a.id).startsWith('lure:'))return train0.done(a);Q.stopAct(true);}};
const resume0=Q.resumeAfterLoad;
Q.resumeAfterLoad=()=>{ensure();if(S().act?.kind==='train'&&!String(S().act.id).startsWith('lure:'))S().act=null;if(S().queue)S().queue=S().queue.filter(a=>a.kind!=='train'||String(a.id).startsWith('lure:'));return resume0();};
const set0=Q.setPet;Q.setPet=id=>{if(id&&(!D.PET[id]||!S().pets.owned[id]))return;set0(id);if(Q.fight){Q.fight.beastClock=0;Q.fight.beastId=id;}if(UI.view==='beastmastery')UI.render(false);};
for(const [id,p]of Object.entries(D.BEAST_SPECIES))D.PET[id].text=`+${p.base*100}% ${({crit:'critical-hit chance',coin:'coin find',xpAll:'XP gain',boss:'boss damage'})[p.passive]}; bond milestones add up to 3 percentage points.`;
const abilities0=Q.creatureAbilities;
Q.creatureAbilities=id=>D.BOND_MILESTONES.map(lv=>({lv,name:lv===10?'Evolution':'Deepening bond',text:lv===10?`${Q.beastSpec(id)?.evolution} · final passive upgrade`:'Passive grows by 0.6 percentage points (signature companions grow gently).',open:Q.petLevel(id)>=lv}));
const petSprite0=Q.petSprite;
Q.petSprite=(p,size=48,cls='')=>S().pets.owned[p.id]?.evolved&&Q.pixelArt?.hasCreature('evolved:'+p.id)?Q.artImage('creature','evolved:'+p.id,size,cls,Q.beastSpec(p.id).evolution):petSprite0(p,size,cls);
const return0=UI.returnExtras;
UI.returnExtras=sum=>{const rows=Object.entries(sum.beasts||{}).map(([id,b])=>`<li>${esc(D.PET[id]?.name||id)}: +${fmt(b.xp)} bond XP${b.to>b.from?` · bond ${b.from} → ${b.to}`:''}</li>`),events=(sum.beastEvents||[]).filter(e=>['capture','return','evolution','milestone'].includes(e.kind));return (return0?return0(sum):'')+((rows.length||events.length)?`<section class="beast-return"><h3>Your beasts grew too</h3><ul>${rows.join('')}${events.map(e=>`<li>${esc(e.text)}</li>`).join('')}</ul></section>`:'');};
const activeCard=id=>{const p=D.PET[id],o=S().pets.owned[id],lv=Q.petLevel(id),next=D.BOND_XP[lv]||D.BOND_XP[MAX-1],xp=finite(o.bondXp),base=D.BOND_XP[lv-1],pct=lv===MAX?100:Math.min(100,100*(xp-base)/(next-base)),t=Q.beastTraining(id);return `<section class="panel beast-focus"><div class="beast-portrait">${Q.petSprite(p,96)}</div><div><span class="k">${S().pets.active===id?'With you':'Resting companion'} · Bond ${lv}/${MAX}</span><h2>${esc(o.evolved?Q.beastSpec(id).evolution:p.name)}</h2><p><b>Passive:</b> ${esc(Q.beastPassiveText(id))}</p><div class="bar" role="progressbar" aria-label="Bond progress" aria-valuenow="${Math.round(pct)}" aria-valuemin="0" aria-valuemax="100"><i style="width:${pct}%"></i></div><small>${lv===MAX?'Bond complete':`${fmt(xp)} / ${fmt(next)} bond XP`}</small><div class="beast-milestones">${D.BOND_MILESTONES.map(n=>`<span class="tag ${lv>=n?'ok':''}" data-tip="text:Bond ${n}: ${n===10?'evolves · final upgrade':'passive upgrade'}">${lv>=n?'✓':'◇'} ${n}</span>`).join('')}</div><p class="sm dim">Wins share 25% of your earned combat XP. Training uses 2 ${esc(D.ITEMS[t.food]?.name||'cooked food')} and ${t.coins} coins; ready again in 45 minutes. No decay.</p><div class="btnrow wrap">${S().pets.active!==id?`<button class="btn" data-do="setpet" data-a="${id}">Bring along</button>`:''}<button class="btn primary" data-do="beasttrain" data-a="${id}" ${t.ok?'':'disabled'}>${t.ok?`Train · +${t.xp} bond XP`:esc(t.reason)}</button></div></div></section>`;};
UI.beastMode='beasts';UI.beastOwnedPage=0;UI.beastTargetPage=0;
const oldPage=UI.V.beastmastery;
UI.V.beastmastery=()=>{ensure();if(!Q.skillUnlocked('beastmastery'))return oldPage();const owned=D.PETS.filter(p=>S().pets.owned[p.id]),selected=owned.find(p=>p.id===UI.beastSelected)||owned.find(p=>p.id===S().pets.active)||owned[0],j=S().pets.expedition,tier=UI.beastTier||'basic',targets=Q.beastTargets(),sel=targets.find(p=>p.id===UI.beastTarget)||targets.find(p=>!S().pets.owned[p.id])||targets[0];
 const nav=`<div class="beast-tabs btnrow"><button class="btn beast-mobile-tab ${UI.beastMode==='capture'?'on':''}" data-do="beastmode" data-a="capture">Capture</button><button class="btn beast-mobile-tab ${UI.beastMode==='collection'?'on':''}" data-do="beastmode" data-a="collection">Collection</button><button class="btn ${UI.beastMode==='beasts'?'on':''}" data-do="beastmode" data-a="beasts">Beasts & expeditions</button><button class="btn ${UI.beastMode==='field'?'on':''}" data-do="beastmode" data-a="field">Fieldwork · wooden traps</button></div>`;if(UI.beastMode==='field')return nav+oldPage();
 const lastReturn=[...S().pets.events].reverse().find(e=>e.kind==='capture'||e.kind==='return');
 const status=j?`<p class="beast-trap-status"><b>Trap out:</b> ${esc(D.PET[j.species].name)} · ${D.BEAST_TRAPS[j.tier].name} · <span data-beast-due="${j.due}">${Q.fmtTime(Math.max(0,j.due-Date.now()))}</span> remaining. Returns automatically.</p>`:`<p class="dim">${lastReturn?esc(lastReturn.text):'No trap is out. One expedition at a time; your main task keeps running.'}</p>`;
 const reason=Q.beastTrapReason(sel.id,tier),s=Q.beastSpec(sel.id),t=D.BEAST_TRAPS[tier];
 return nav+`<div class="beast-workspace" data-mode="${UI.beastMode}"><div class="beast-main">${selected?activeCard(selected.id):'<section class="panel"><h2>Find your first companion</h2><p>Every beast starts as an egg. Choose a species and send a trap: it comes back by itself while you do other things.</p></section>'}<section class="panel beast-expedition"><h3>Send a trap for an egg</h3>${status}<div class="btnrow wrap">${Object.entries(D.BEAST_TRAPS).map(([k,v])=>`<button class="btn ${tier===k?'on':''}" data-do="beasttier" data-a="${k}">${v.name} · ${v.cost?`${v.cost} coins`:'1 Rune trap'} · ${v.hours}h</button>`).join('')}</div><p><b>${esc(sel.name)}</b> · ${s.rarity} · ${Math.round(Q.beastCaptureChance(sel.id,tier)*100)}% capture · ${S().pets.tracks[sel.id]||0}/5 tracks</p><p class="sm dim">A miss returns ${t.consolation} coins and one species track. After five misses the next expedition is certain and uses those five tracks.</p><button class="btn primary" data-do="beastsend" data-a="${sel.id}" data-b="${tier}" ${reason?'disabled':''}>${reason?esc(reason):'Send trap'}</button></section></div><section class="panel beast-list"><h3 class="beast-owned-heading">Companions ${Array.from({length:Math.ceil(owned.length/3)},(_,i)=>`<button class="btn sm" data-do="beastpage" data-a="owned" data-b="${i}">${i+1}</button>`).join('')}</h3><div class="beast-cards beast-owned">${owned.slice(UI.beastOwnedPage*3,UI.beastOwnedPage*3+3).map(p=>`<button class="beast-choice ${selected?.id===p.id?'on':''}" data-do="beastselect" data-a="${p.id}">${Q.petSprite(p,64)}<b>${esc(p.name)}</b><small>Bond ${Q.petLevel(p.id)}${p.id===S().pets.active?' · With you':''}</small></button>`).join('')}</div><h3 class="beast-targets-heading">Find a beast ${Array.from({length:Math.ceil(targets.length/4)},(_,i)=>`<button class="btn sm ${UI.beastTargetPage===i?'on':''}" data-do="beastpage" data-a="targets" data-b="${i}">${i+1}</button>`).join('')}</h3><div class="beast-cards beast-targets">${targets.slice(UI.beastTargetPage*4,UI.beastTargetPage*4+4).map(p=>{const sp=Q.beastSpec(p.id),got=!!S().pets.owned[p.id];return `<button class="beast-choice ${sel.id===p.id?'on':''}" data-do="beasttarget" data-a="${p.id}">${Q.petSprite(p,64,got?'':'sil')}<b>${esc(p.name)}</b><small>${got?'Befriended':`Hero ${sp.hero} · ${esc(D.TOWN[sp.town].name)}`} · ${sp.rarity}</small></button>`;}).join('')}</div></section></div>`;
};
Object.assign(UI.DO,{beastmode:a=>{UI.beastMode=a;UI.render(false);},beastpage:(a,b)=>{UI[a==='owned'?'beastOwnedPage':'beastTargetPage']=+b;UI.render(false);},beastselect:a=>{UI.beastSelected=a;if(innerWidth<=860)UI.beastMode='beasts';UI.render(false);},beasttarget:a=>{UI.beastTarget=a;UI.render(false);},beasttier:a=>{if(D.BEAST_TRAPS[a])UI.beastTier=a;UI.render(false);},beasttrain:a=>{UI.beastStatus=Q.trainBeast(a)?'Training complete':Q.beastTraining(a).reason;UI.render(false);},beastsend:(a,b)=>{Q.sendBeastTrap(a,b);UI.render(false);}});
/* Quiet in-place countdowns; no bell entries or ready popups. */
let seconds=0;Q.on('ui',()=>{if(UI.view!=='beastmastery'||++seconds%4)return;const btn=document.querySelector('[data-do="beasttrain"]');if(btn&&btn.disabled&&Q.beastTraining(btn.dataset.a).ok){UI.render(false);return;}document.querySelectorAll('[data-beast-due]').forEach(e=>e.textContent=Q.fmtTime(Math.max(0,+e.dataset.beastDue-Date.now())));});
})();
