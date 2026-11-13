/* Skills earned through play, their pages, and the always-visible unlock roadmap. */
(() => {
const DQ=window.DQ,D=DQ.data,UI=DQ.ui,{esc,fmt,ico}=DQ,S=()=>DQ.S;
const labels={kill:'combat victories',catch:'fish caught',chop:'logs chopped',harvest:'crops harvested',craft:'items crafted',smith:'smithing actions'};
const destinations={kill:'combat',catch:'fishing',chop:'woodcutting',harvest:'farming',craft:'crafting',smith:'smithing'};
DQ.checkActionUnlocks=()=>{
  for(const sk of D.SKILLS.filter(x=>x.actionReq)){
    if(S().unlocked[sk.id]||!DQ.actionProgress(sk.id).every(r=>r.have>=r.need))continue;
    /* consumed requirements are taken now, once (seeds planted, materials used) */
    for(const r of DQ.actionProgress(sk.id))if(r.kind==='consumed'&&r.item)DQ.take(r.item,r.need);
    S().unlocked[sk.id]=true; DQ.sfx('unlock');
    DQ.notify({kind:'unlock',key:'unlock:'+sk.id,icon:sk.id,col:sk.col,title:`${sk.name} unlocked!`,text:sk.blurb,action:{label:`Open ${sk.name}`,fn:()=>DQ.go(sk.page)},sound:false,ttl:14000,burst:true});
    DQ.emit('lvl'); DQ.save();
  }
};
/* combat speed lives in engine.js (DQ.combatInterval / DQ.combatSpeedText); a copy here used to override it and drop the Gale effect */

const oldNext=DQ.nextEncounter;
DQ.nextEncounter=m=>{DQ.checkActionUnlocks();if(DQ.skillUnlocked('hunting'))DQ.addXp('hunting',Math.max(3,Math.round(m.cl*1.4)));return oldNext(m);};
const oldKill=DQ.recordKill;
DQ.recordKill=(m,drops)=>{const first=!(S().beast.kills[m.id]||0);oldKill(m,drops);if(first&&DQ.skillUnlocked('exploration'))DQ.addXp('exploration',Math.max(5,m.cl*2));};
const oldTravel=DQ.travel;
DQ.travel=id=>{const first=!(S().towns[id]?.visited);const out=oldTravel(id);if(first&&S().town===id&&DQ.skillUnlocked('exploration'))DQ.addXp('exploration',30);return out;};
const oldBrew=DQ.brew;
DQ.brew=id=>{if(!DQ.skillUnlocked('herbalism'))return DQ.toast(`Herbalism is locked. ${DQ.unlockHow('herbalism')}.`,true);const ok=oldBrew(id);if(ok){S().stats.brew++;DQ.addXp('herbalism',12);DQ.emit('lvl');}return ok;};

const enc=st=>st.replace(/:/g,'|'),dec=st=>st.replace(/\|/g,':');
UI.B.unlockcount=(e,sk,stat)=>{const r=DQ.actionProgress(sk).find(r=>r.stat===dec(stat));if(r)UI.set(e,r.kind==='level'?`${r.have}/${r.need}`:`${Math.min(r.have,r.need)}/${r.need}`);};
UI.B.unlockbar=(e,sk,stat)=>{const r=DQ.actionProgress(sk).find(r=>r.stat===dec(stat));if(r)e.style.width=Math.min(100,r.have/r.need*100)+'%';};
/* where each requirement is fulfilled: the page (and, for items, the route to obtain them) */
const reqDest=r=>{const [k,a]=r.stat.includes(':')?r.stat.split(':'):[r.stat,null];if(destinations[k])return {go:destinations[k]};if(k==='hero')return {go:'overview'};if(k==='combat'||k==='beasts')return {go:'combat'};if(k==='skill')return {go:D.SK[a].page};if(k==='visit')return {go:'map'};if(k==='tool')return {route:`tool_${DQ.toolKey(a)}_1`};if(k==='own'||k==='use')return {route:a};return {go:'skillsummary'};};
const reqHtml=sk=>DQ.actionProgress(sk.id).map(r=>{const pct=Math.min(100,r.have/r.need*100),d=reqDest(r),done=r.have>=r.need,where=d.route?(DQ.sourceOf&&DQ.sourceOf(d.route)):null,goName=d.go?(D.SK[d.go]?.name||({overview:'Home',combat:'Combat',map:'World',skillsummary:'Skills'})[d.go]||d.go):where?where.name:'';
  return `<button class="unlock-step ${done?'done':''}" ${d.route?`data-do="route" data-a="${d.route}"`:`data-do="go" data-a="${d.go}"`}><span>${done?ico('check'):''}<b data-b="unlockcount:${sk.id}:${enc(r.stat)}">${r.kind==='level'?`${r.have}/${r.need}`:`${Math.min(r.have,r.need)}/${r.need}`}</b> ${esc(DQ.reqLabel(r))}</span><span class="bar"><i data-b="unlockbar:${sk.id}:${enc(r.stat)}" style="width:${pct}%"></i></span><small>${done?'Done':`${d.route?'Get it':'Go to '+esc(goName)}`} ${done?'':ico('arrow')}</small></button>`}).join('');
UI.unlockSteps=sk=>reqHtml(D.SK[sk]);
/* ---------- Skill menu tooltip: pictures and one line per requirement (Nov 2026) ---------- */
const STAT_ART={catch:['item','raw_shrimp'],chop:['item','log_normal'],harvest:['item','crop_potato'],craft:['skill','crafting'],smith:['skill','smithing'],kill:['skill','attack'],mine:['item','ore_copper'],cook:['skill','cooking']};
const art=(k,id)=>k==='item'&&D.ITEMS[id]?DQ.itemIco(D.ITEMS[id]):k==='skill'&&D.SK[id]?DQ.artImage('skill',id,32,'',''):ico(id||'star');
DQ.reqParts=r=>{const [k,a]=r.stat.includes(':')?r.stat.split(':'):[r.stat,null],I=a&&D.ITEMS[a],plural=n=>n.replace(/s?$/,'s');
  if(k==='hero')return {pic:ico('star'),label:`Hero level ${r.need}`};
  if(k==='combat')return {pic:art('skill','attack'),label:`Combat level ${r.need}`};
  if(k==='skill')return {pic:art('skill',a),label:`${D.SK[a].name} level ${r.need}`};
  if(k==='tool'){const t=`tool_${DQ.toolKey(a)}_1`;return {pic:art('item',t),label:`A ${({mining:'pickaxe',fishing:'fishing rod',woodcutting:'axe',thieving:'pair of thief gloves',farming:'hoe'})[a]||'tool'}`,note:'kept'};}
  if(k==='own'||k==='use')return {pic:art('item',a),label:`${r.need>1&&I?plural(I.name):I?I.name:a}`,note:k==='own'?'kept':'used when you learn it'};
  if(k==='visit')return {pic:ico('town'),label:`Visit ${D.TOWN[a]?D.TOWN[a].name:a}`};
  if(k==='beasts')return {pic:ico('paw'),label:'Different creatures studied'};
  const st=STAT_ART[k]||['star','star'];return {pic:art(st[0],st[1]),label:DQ.cap?DQ.cap(labels[k]||k):(labels[k]||k)};};
const nextArt=(sk,name)=>{const r=(D.RLIST[sk]||[]).find(x=>x.name===name);if(r)return art('item',Object.keys(r.out)[0]);const n=Object.values(D.NODES).flat().find(x=>x.skill===sk&&x.name===name);if(n&&n.item)return art('item',n.item);const it=Object.values(D.ITEMS).find(x=>x.name===name);return it?art('item',it.id):ico('star');};
DQ.tips.rail=sk=>{const s=D.SK[sk];if(!s)return '';const lock=!DQ.skillUnlocked(sk),head=`<div class="tt-head">${DQ.artImage('skill',sk,32,'','')}<span><b>${esc(s.name)}</b><small>${lock?'Not learned yet':`Level ${DQ.lvl(sk)}`}</small></span></div>`;
  if(lock&&s.actionReq)return head+`<div class="tt-k">To learn it</div><ul class="tt-list">${DQ.actionProgress(sk).map(r=>{const p=DQ.reqParts(r),done=r.have>=r.need;const item=r.item||(r.stat.startsWith('tool:')?`tool_${DQ.toolKey(r.skill)}_1`:null),src=!done&&item&&DQ.sourcesOf?DQ.sourcesOf(item):[],how=src.length?`${src[0].text}${src[0].note?` (${src[0].note})`:''}${src.length>1?` · or ${src[1].text.toLowerCase()}`:''}`:'';return `<li class="${done?'ok':''}"><span class="tt-pic">${p.pic}</span><span class="tt-l">${esc(p.label)}${p.note?`<small>${esc(p.note)}</small>`:''}${how?`<small class="tt-how">${ico('arrow')} ${esc(how)}</small>`:''}</span><b class="mono">${done?ico('check'):r.kind==='level'?`${r.have}/${r.need}`:`${Math.min(r.have,r.need)}/${r.need}`}</b></li>`;}).join('')}</ul>`;
  if(lock&&s.quest){const q=D.QM[s.quest];return head+`<div class="tt-k">Taught by a quest</div><ul class="tt-list"><li><span class="tt-pic">${ico('quest')}</span><span class="tt-l">${esc(q.name)}<small>${esc(q.giver)}, ${esc(D.TOWN[q.town].name)}${DQ.advLvl()<q.adv?` · from Hero ${q.adv}`:''}</small></span></li></ul>`;}
  if(lock)return head+`<p class="tt-p">${esc(DQ.unlockHow(sk))}</p>`;
  const L=DQ.lvl(sk),need=L>=99?0:Math.max(0,D.XPF[L+1]-(S().xp[sk]||0)),nx=UI.nextUnlock&&UI.nextUnlock(sk);
  return head+`<div class="tt-xp"><span class="bar"><i style="width:${DQ.pctNext(sk).toFixed(1)}%;background:${s.col}"></i></span><small>${L>=99?'Maximum level':`${fmt(need)} XP to level ${L+1}`}</small></div>${nx?`<div class="tt-k">At level ${nx.lvl}</div><ul class="tt-list">${String(nx.what).split(', ').slice(0,4).map(n=>`<li><span class="tt-pic blackout">${nextArt(sk,n)}</span><span class="tt-l">Something new</span></li>`).join('')}</ul>`:''}`;};
UI.unlocksAheadPanel=()=>{const statSkill={harvest:'farming',craft:'crafting',smith:'smithing',cook:'cooking',mine:'mining'},blocked=x=>{const [k,a]=x.stat.split(':'),need=k==='skill'?a:statSkill[k]||(k==='own'||k==='use'?(Object.values(D.RECIPES).find(r=>r.out[a])||{}).skill:null);return need&&!DQ.skillUnlocked(need)&&x.have<x.need?2:0;},near=sk=>-DQ.actionProgress(sk.id).reduce((a,x)=>a+(1-Math.min(1,x.have/x.need))*(x.kind==='level'?1.5:1)+blocked(x),0),all=D.SKILLS.filter(s=>s.actionReq&&!DQ.skillUnlocked(s.id)).sort((a,b)=>near(b)-near(a)),locked=UI.view==='overview'?all.slice(0,2):all,more=all.length-locked.length;return `<section class="panel unlock-roadmap"><div class="phead"><div><span class="k">Progression</span><h2>${locked.length?'Unlocks ahead':'Action skills discovered'}</h2></div><button class="btn sm" data-do="go" data-a="skillsummary">All skills</button></div>${locked.length?`<p class="hint">${more?`Your two nearest. ${more} more in All skills.`:'Complete their requirements in any order.'}</p><div class="unlock-grid">${locked.map(sk=>`<article style="--c:${sk.col}"><div class="unlock-title">${ico('lock')}<span><b>${esc(sk.name)}</b><small>${esc(sk.blurb)}</small></span></div>${reqHtml(sk)}</article>`).join('')}</div>`:'<p>Every action-earned skill is unlocked. Their next levels remain visible in the Skills menu.</p>'}</section>`;};
UI.homeSections.push(UI.unlocksAheadPanel);
DQ.on('lvl',()=>DQ.checkActionUnlocks());DQ.on('quests',()=>DQ.checkActionUnlocks());
{const r0=UI.render;UI.render=f=>{try{DQ.checkActionUnlocks();}catch(e){}return r0(f);};}

const hero=sk=>UI.skillHero?UI.skillHero(sk):`<section class="panel"><h2>${D.SK[sk].name}</h2></section>`;
UI.V.hunting=()=>`${hero('hunting')}${UI.areaPanel(S().town)}`;
DQ.explorationSummary=town=>{
 const creatures=D.MONLIST.filter(m=>m.town===town),found=creatures.filter(m=>(S().beast.kills[m.id]||0)>0);
 const quests=D.QUESTS.filter(q=>q.town===town),completed=quests.filter(q=>S().q[q.id]?.s==='done');
 return {creatures,found,quests,completed,visited:!!S().towns[town]?.visited,boss:!!S().towns[town]?.boss};
};
UI.V.exploration=()=>`${hero('exploration')}<section class="panel"><div class="phead"><h2>Realm discoveries</h2><small>${D.TOWNS.filter(t=>S().towns[t.id]?.visited).length}/${D.TOWNS.length} towns visited</small></div><p>Discoveries are recorded from your first victory against each creature. Visit towns and discover creatures to earn Exploration XP.</p><div class="area-grid">${D.TOWNS.map(t=>{
 const r=DQ.explorationSummary(t.id);
 return `<article class="area-card ${r.visited?'selected':''}"><h3>${esc(t.name)}</h3><small>${r.visited?'Visited':'Not visited'} · ${r.boss?'Boss defeated':'Boss undefeated'}</small><p>${r.found.length}/${r.creatures.length} creatures discovered · ${r.completed.length}/${r.quests.length} quests completed</p><div class="bar"><i style="width:${r.found.length/r.creatures.length*100}%"></i></div><div class="discovery-creatures">${r.creatures.map(m=>`<span class="discovery-entry">${DQ.monSprite(m,40,r.found.includes(m)?'':'sil')}<small>${r.found.includes(m)?esc(m.name):'Undiscovered'}</small></span>`).join('')}</div>${(D.AREAS?.[t.id]||[]).map(a=>`<p class="sm">${esc(a.name)} · ${a.monsters.filter(m=>(S().beast.kills[m.id]||0)>0).length}/${a.monsters.length} creatures discovered</p>`).join('')}</article>`;
 }).join('')}</div><div class="btnrow"><button class="btn primary" data-do="go" data-a="map">Open world map</button><button class="btn" data-do="go" data-a="combat">Find creatures</button></div></section>`;
const gems=['gem_sapphire','gem_emerald','gem_ruby','gem_diamond','gem_diamond'];
DQ.enchant=id=>{const rank=S().enchants[id]||0,need=gems[rank];if(!DQ.skillUnlocked('enchanting')||rank>=5)return false;if(!Object.values(S().equip).includes(id))return DQ.toast('Equip the item first',true);if(DQ.have('rune')<5*(rank+1)||!DQ.have(need))return DQ.toast(`Requires ${5*(rank+1)} runes and 1 ${D.ITEMS[need]?.name||need}`,true);DQ.take('rune',5*(rank+1));DQ.take(need,1);S().enchants[id]=rank+1;S().stats.enchant++;DQ.addXp('enchanting',20*(rank+1));DQ.sfx('unlock');DQ.toast(`${D.ITEMS[id].name} is now enchantment +${rank+1}`);DQ.emit('lvl');return true;};
const baseBonus=DQ.bonus;
DQ.bonus=()=>{const out=baseBonus();for(const [slot,id] of Object.entries(S().equip)){if(slot==='ammo')continue;const rank=S().enchants[id]||0,b=D.ITEMS[id]?.b||{};for(const k of Object.keys(b))out[k]+=rank;}return out;};
/* Enchanting: what the next rank adds to each worn item, what it costs, where the materials come from, and which item
   gains most from a first enchantment (the biggest share of its own bonus, weapon first on a tie). */
DQ.enchantPlan=()=>Object.entries(S().equip).filter(([slot,id])=>slot!=='ammo'&&D.ITEMS[id]&&Object.keys(D.ITEMS[id].b||{}).length).map(([slot,id])=>{const it=D.ITEMS[id],r=S().enchants[id]||0,b=it.b||{},keys=Object.keys(b),total=keys.reduce((n,k)=>n+Math.abs(b[k]),0)+keys.length*r,need=gems[r],runes=5*(r+1);return {slot,id,it,rank:r,keys,gain:total?keys.length/total:0,need,runes,ready:r<5&&DQ.have('rune')>=runes&&DQ.have(need)>0};}).sort((a,b)=>b.gain-a.gain||(a.slot==='weapon'?-1:b.slot==='weapon'?1:0));
UI.V.enchanting=()=>{const plan=DQ.enchantPlan(),best=plan.find(p=>p.rank<5),names=UI.statNames||{};
 /* each row shows what it needs as pictures (Nov 2026, from the player): rank pips, stat changes as before→after chips,
    and the runes and gem as tiles that are green when you have enough and red, with how many are missing, when not */
 const pips=r=>`<span class="ench-pips" aria-label="Rank ${r} of 5">${[1,2,3,4,5].map(i=>`<i class="${i<=r?'on':''}"></i>`).join('')}</span>`;
 const cost=(id,n)=>UI.needTile(id,n);
 const gains=p=>p.keys.map(k=>{const v=(p.it.b[k]||0)+p.rank;return `<span class="ench-gain"><small>${esc(names[k]||k)}</small><b>${v}</b><i>→</i><b class="up">${v+1}</b></span>`;}).join('');
 return `${hero('enchanting')}<section class="panel"><div class="phead"><h2>Enchant equipped gear</h2><small>Up to +5 per item</small></div><p class="hint">Each rank: +1 to every bonus the item has.</p><div class="ench-list">${plan.map(p=>{const pct=Math.round(p.gain*100),max=p.rank>=5;
  return `<div class="ench-row ${p===best?'recommended':''} ${p.ready?'ready':''} ${max?'max':''}"><span class="ench-item">${DQ.itemIco(p.it)}</span><span class="ench-main"><span class="ench-name"><b>${esc(p.it.name)} +${p.rank}</b>${pips(p.rank)}${p===best?' <span class="tag">Best first</span>':''}</span>${max?'<small>Fully enchanted</small>':`<span class="ench-gains">${gains(p)}<small class="dim">about +${pct}% of its bonus</small></span>`}</span>${max?'':`<span class="need-tiles ench-costs">${cost('rune',p.runes)}${p.need?cost(p.need,1):''}</span>`}<button class="btn ${p.ready?'primary':''}" data-do="enchant" data-a="${p.id}" ${max||!p.ready?'disabled':''}>${max?'Complete':p.ready?'Enchant':'Missing items'}</button></div>`;}).join('')||'<p>Equip a weapon or armour to enchant it.</p>'}</div></section>`;};
Object.assign(UI.DO,{enchant:id=>{if(DQ.enchant(id))UI.render(false);}});
const brewery=UI.V.brewery;
/* Herbalism: a short path to the first useful potion, shown until Potion of Might is brewable */
const herbGoals=()=>{const done=id=>DQ.techDone&&DQ.techDone(id),R=D.POTION_RECIPES.find(r=>r.id==='potion_heal'),M=D.POTION_RECIPES.find(r=>r.id==='potion_might');
 if(done('warbrew'))return '';
 const mats=r=>UI.needTiles(Object.assign({},r.in,{coins:r.coins}));
 const step=(on,doneNow,title,body,btn)=>`<li class="${doneNow?'done':on?'now':''}"><b>${doneNow?'✓ ':''}${title}</b><small>${body}</small>${on&&!doneNow&&btn?btn:''}</li>`;
 const r1=done('herbalism'),scholar=DQ.skillUnlocked('research');
 return `<section class="panel herb-goals"><div class="phead"><h2>First goals</h2><small>Herbalism</small></div><ol class="herb-path">
  ${step(true,r1,'Research Herbalism',scholar?'In Scholarship: 900 coins and 10 onions.':`Learn Scholarship first: ${DQ.unlockHow('research')}.`,scholar?'<button class="btn sm" data-do="go" data-a="research">Open Scholarship</button>':'')}
  ${step(r1,DQ.have('potion_heal')>0,'Brew a Healing draught',`Restores 40% of your health. In a fight it is drunk for you once your food runs out and health is low (once per fight): a safety net for a hard boss. <span class="rws">${mats(R)}</span>`)}
  ${step(r1,false,'Next: War Brewing → Potion of Might','+15% damage for 20 minutes. Worth brewing for a boss you keep losing to, not for everyday fights. Research it in Scholarship (Tier II).')}
 </ol></section>`;};
UI.V.brewery=()=>DQ.skillUnlocked('herbalism')?`${hero('herbalism')}${herbGoals()}${brewery()}`:UI.lockedPage('herbalism');
})();
