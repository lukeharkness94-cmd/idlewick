/* Skills earned through play, their pages, and the always-visible unlock roadmap. */
(() => {
const DQ=window.DQ,D=DQ.data,UI=DQ.ui,{esc,fmt,ico}=DQ,S=()=>DQ.S;
const labels={kill:'combat victories',catch:'fish caught',chop:'logs chopped',harvest:'crops harvested',craft:'items crafted',smith:'smithing actions'};
const destinations={kill:'combat',catch:'fishing',chop:'woodcutting',harvest:'farming',craft:'crafting',smith:'smithing'};
DQ.checkActionUnlocks=()=>{
  for(const sk of D.SKILLS.filter(x=>x.actionReq)){
    if(S().unlocked[sk.id]||!DQ.actionProgress(sk.id).every(r=>r.have>=r.need))continue;
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

UI.B.unlockcount=(e,sk,stat)=>{const r=DQ.actionProgress(sk).find(r=>r.stat===stat);if(r)UI.set(e,`${Math.min(r.have,r.need)}/${r.need}`);};
UI.B.unlockbar=(e,sk,stat)=>{const r=DQ.actionProgress(sk).find(r=>r.stat===stat);if(r)e.style.width=Math.min(100,r.have/r.need*100)+'%';};
const reqHtml=sk=>DQ.actionProgress(sk.id).map(r=>{const pct=Math.min(100,r.have/r.need*100);return `<button class="unlock-step" data-do="go" data-a="${destinations[r.stat]||'skillsummary'}"><span><b data-b="unlockcount:${sk.id}:${r.stat}">${Math.min(r.have,r.need)}/${r.need}</b> ${labels[r.stat]||r.stat}</span><span class="bar"><i data-b="unlockbar:${sk.id}:${r.stat}" style="width:${pct}%"></i></span><small>Go to ${D.SK[destinations[r.stat]]?.name||'Combat'} ${ico('arrow')}</small></button>`}).join('');
UI.unlocksAheadPanel=()=>{const near=sk=>{const r=DQ.actionProgress(sk.id);return r.reduce((a,x)=>a+Math.min(1,x.have/x.need),0)/Math.max(1,r.length);},all=D.SKILLS.filter(s=>s.actionReq&&!DQ.skillUnlocked(s.id)).sort((a,b)=>near(b)-near(a)),locked=UI.view==='overview'?all.slice(0,2):all,more=all.length-locked.length;return `<section class="panel unlock-roadmap"><div class="phead"><div><span class="k">Progression</span><h2>${locked.length?'Unlocks ahead':'Action skills discovered'}</h2></div><button class="btn sm" data-do="go" data-a="skillsummary">All skills</button></div>${locked.length?`<p class="hint">${more?`Your two nearest. ${more} more in All skills.`:'Complete their requirements in any order.'}</p><div class="unlock-grid">${locked.map(sk=>`<article style="--c:${sk.col}"><div class="unlock-title">${ico('lock')}<span><b>${esc(sk.name)}</b><small>${esc(sk.blurb)}</small></span></div>${reqHtml(sk)}</article>`).join('')}</div>`:'<p>Every action-earned skill is unlocked. Their next levels remain visible in the Skills menu.</p>'}</section>`;};
UI.homeSections.push(UI.unlocksAheadPanel);

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
 return `${hero('enchanting')}<section class="panel"><div class="phead"><h2>Enchant equipped gear</h2><small>Up to +5 per item</small></div><p class="hint">Each rank adds +1 to every bonus the item already has: a big share on early gear, a small one on top-tier gear. Costs Arcane runes (shop) and a gem (mining, nests, chests).</p><div class="ench-list">${plan.map(p=>{const pct=Math.round(p.gain*100);return `<div class="ench-row ${p===best?'recommended':''}">${DQ.itemIco(p.it)}<span><b>${esc(p.it.name)} +${p.rank}</b>${p===best?' <span class="tag">Best first</span>':''}<small>${p.rank>=5?'Fully enchanted':`Next: ${p.keys.map(k=>`+1 ${names[k]||k}`).join(', ')} (about +${pct}% of its bonus) · ${p.runes} runes (${DQ.have('rune')} held) + 1 ${esc(D.ITEMS[p.need]?.name||p.need)} (${DQ.have(p.need)} held)`}</small></span>${p.rank<5&&!DQ.have(p.need)&&UI.routeChip?UI.routeChip(p.need):''}<button class="btn ${p.ready?'primary':''}" data-do="enchant" data-a="${p.id}" ${p.rank>=5||!p.ready?'disabled':''}>${p.rank>=5?'Complete':'Enchant'}</button></div>`;}).join('')||'<p>Equip a weapon or armour to enchant it.</p>'}</div></section>`;};
Object.assign(UI.DO,{enchant:id=>{if(DQ.enchant(id))UI.render(false);}});
const brewery=UI.V.brewery;
/* Herbalism: a short path to the first useful potion, shown until Potion of Might is brewable */
const herbGoals=()=>{const done=id=>DQ.techDone&&DQ.techDone(id),R=D.POTION_RECIPES.find(r=>r.id==='potion_heal'),M=D.POTION_RECIPES.find(r=>r.id==='potion_might');
 if(done('warbrew'))return '';
 const mats=r=>Object.entries(r.in).map(([k,n])=>`<span class="rw ${DQ.have(k)>=n?'':'short'}">${DQ.ico(D.ITEMS[k].ic)}${DQ.have(k)}/${n} ${esc(D.ITEMS[k].name)}</span>${DQ.have(k)<n&&UI.routeChip?UI.routeChip(k):''}`).join('')+`<span class="rw">${DQ.ico('coin')}${r.coins}</span>`;
 const step=(on,doneNow,title,body,btn)=>`<li class="${doneNow?'done':on?'now':''}"><b>${doneNow?'✓ ':''}${title}</b><small>${body}</small>${on&&!doneNow&&btn?btn:''}</li>`;
 const r1=done('herbalism'),scholar=DQ.advLvl()>=D.RESEARCH_ADV;
 return `<section class="panel herb-goals"><div class="phead"><h2>First goals</h2><small>Herbalism</small></div><ol class="herb-path">
  ${step(true,r1,'Research Herbalism',scholar?'In Scholarship: 900 coins and 10 onions.':`Scholarship opens at Hero ${D.RESEARCH_ADV}.`,scholar?'<button class="btn sm" data-do="go" data-a="research">Open Scholarship</button>':'')}
  ${step(r1,DQ.have('potion_heal')>0,'Brew a Healing draught',`Drink it to restore 40% of your health at once: before a boss instead of resting, or between hard fights. <span class="rws">${mats(R)}</span>`)}
  ${step(r1,false,'Next: War Brewing → Potion of Might','+15% damage for 20 minutes. Worth brewing for a boss you keep losing to, not for everyday fights. Research it in Scholarship (Tier II).')}
 </ol></section>`;};
UI.V.brewery=()=>DQ.skillUnlocked('herbalism')?`${hero('herbalism')}${herbGoals()}${brewery()}`:UI.lockedPage('herbalism');
})();
