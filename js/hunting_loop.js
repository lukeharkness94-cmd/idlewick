/* Lightweight Hunting/Crafting/Beastmastery loop. Preserve train:lure save IDs, existing eggs and all earned XP. */
(() => {
const Q=window.DQ,D=Q.data,UI=Q.ui,S=()=>Q.S,{esc,ico}=Q;
if(D.FLOURISH)D.FLOURISH.hunting='Good trail!';
Q.isFieldHunt=a=>!!a&&a.kind==='train'&&String(a.id).startsWith('lure:');
Q.migrateHuntingLoop=st=>{if(st.hunt.loopVersion===undefined){const worked=st.act?.kind==='train'&&String(st.act.id).startsWith('lure:')||Object.keys(st.mast||{}).some(k=>k.startsWith('train:lure:'));st.hunt.legacyFieldLevel=worked?D.lvlOf(st.xp.beastmastery||0):0;if(worked)st.unlocked.hunting=true;st.hunt.loopVersion=1;}return st;};
Q.fieldAccessLevel=()=>Math.max(Q.lvl('hunting'),S().hunt.legacyFieldLevel||0);
Q.fieldTrap=()=>[...D.FIELD_TRAPS].reverse().find(t=>Q.have(t.id)>0&&Q.lvl('hunting')>=t.lvl)||null;
Q.fieldMaterials=town=>{const out=[];for(const m of D.MONLIST.filter(m=>m.town===town&&!m.boss&&!m.mini))for(const[k]of m.drops||[]){const it=D.ITEMS[k];if(it&&!it.slot&&it.type!=='container'&&!it.unique&&!out.includes(k))out.push(k);}return out.length?out:['feather'];};
Q.fieldFocus=town=>Q.fieldTrap()?.focus&&Q.fieldMaterials(town).includes(S().hunt.fieldFocus)&&Q.itemDiscovered(S().hunt.fieldFocus)?S().hunt.fieldFocus:null;
Q.fieldLootOdds=town=>{const pool=Q.fieldMaterials(town),focus=Q.fieldFocus(town),total=pool.length+(focus?2:0);return pool.map(id=>({id,weight:id===focus?3:1,pct:100*(id===focus?3:1)/total}));};
const skill0=Q.actSkill,page0=Q.actPage,dur0=Q.durFor;
Q.actSkill=a=>Q.isFieldHunt(a||Q.act)?'hunting':skill0(a);
Q.actPage=()=>Q.isFieldHunt(Q.act)?'hunting':page0();
Q.durFor=(kind,id)=>kind==='train'&&String(id).startsWith('lure:')?Math.max(200,Math.round(8000*Q.speedMult('hunting')*(1-Q.mastSpeed('train',id)))):dur0(kind,id);
const train0=Q.KIND_EXT.train;
Q.KIND_EXT.train={...train0,
 skillFor:id=>String(id).startsWith('lure:')?'hunting':'beastmastery',
 pageFor:id=>String(id).startsWith('lure:')?'hunting':'beastmastery',
 check:id=>{if(!String(id).startsWith('lure:'))return train0.check(id);const town=id.slice(5);if(!D.TOWN[town])return 'Choose a habitat';if(!Q.skillUnlocked('hunting'))return 'Learn Hunting first';if(!Q.townUnlocked(town)||!S().towns[town]?.visited)return 'Visit '+D.TOWN[town].name+' first';if(Q.fieldAccessLevel()<Q.lureLvl(town))return 'Requires Hunting '+Q.lureLvl(town);if(!Q.fieldTrap())return 'Craft a wooden field trap first';return '';},
 label:a=>Q.isFieldHunt(a)?'Hunting in '+D.TOWN[a.id.slice(5)].name:train0.label(a),
 done:a=>{if(!Q.isFieldHunt(a))return train0.done(a);const town=a.id.slice(5),trap=Q.fieldTrap(),odds=Q.fieldLootOdds(town);if(!trap)return Q.stopAct(false,'Out of field traps. Craft another to continue.');
 if(Q.act)Q.act.count++;if(Q.chance(trap.break))Q.take(trap.id,1);
 const sig=Q.signatureOf(town),egg=Q.skillUnlocked('beastmastery')&&sig&&!S().pets.owned[sig.id]&&!Q.forecasting&&Q.chance(Q.befriendChance(town));
 if(egg)Q.awardPet(sig.id);else {const sum=odds.reduce((n,x)=>n+x.weight,0);let roll=Math.random()*sum,pick=odds[odds.length-1].id;for(const o of odds){roll-=o.weight;if(roll<=0){pick=o.id;break;}}Q.grant(pick,1+Math.floor(Math.random()*3));}
 Q.addXp('hunting',Math.round(8*(5+Q.lvl('hunting')*.35)));S().stats.train=(S().stats.train||0)+1;Q.qev('lure',town);Q.qev('fieldhunt',town);
 }
};
// Companion use supplies a repeatable Beastmastery path after fieldwork moves to Hunting.
const victory0=Q.beastVictory;
Q.beastVictory=f=>{const assigned=Q.beastActive();victory0(f);if(!Q.forecasting&&assigned&&Q.skillUnlocked('beastmastery')&&Number.isFinite(f?.heroXp)&&f.heroXp>0)Q.addXp('beastmastery',f.heroXp*.25);};
if(Q.usesOf){const uses0=Q.usesOf;Q.usesOf=id=>{const trap=D.FIELD_TRAPS.find(t=>t.id===id),use=trap?{k:'field',text:`Fieldwork gear: Hunting ${trap.lvl}, ${Math.round(trap.break*100)}% break chance${trap.focus?'; optional material focus':''}. Best qualifying owned trap is used automatically.`,go:{do:'go',a:'hunting',label:'Hunting'}}:id==='live_trap'||id==='rune_trap'?{k:'expedition',text:'Consumed when sending an egg expedition from the Trapper.',go:{do:'go',a:'beastmastery',label:'Beastmastery'}}:null;return use?[use,...uses0(id)].slice(0,3):uses0(id);};}
// Existing active fieldwork resumes with its original kind/id; earlier Beastmastery XP is untouched.
const resume0=Q.resumeAfterLoad;
Q.resumeAfterLoad=()=>{if(Q.isFieldHunt(S().act)&&S().unlocked.beastmastery)S().unlocked.hunting=true;return resume0();};
const quarry0=UI.V.hunting;
UI.DO.huntmode=mode=>{UI.huntMode=mode==='quarry'?'quarry':'field';UI.render(false);};
UI.DO.fieldfocus=item=>{const town=String(UI.taskChoice.hunting||'lure:'+S().town).slice(5);if(item&&(!Q.fieldTrap()?.focus||!Q.fieldMaterials(town).includes(item)||!Q.itemDiscovered(item)))return;const before=S().hunt.fieldFocus;S().hunt.fieldFocus=item||null;if(!Q.save())S().hunt.fieldFocus=before;UI.render(false);};
UI.DO.fieldcraft=id=>{const r=D.RECIPES['craft_'+id]||(id==='wooden_trap'?D.RECIPES.craft_trap:null);if(!r)return;UI.returnTo={page:'hunting',label:'Hunting'};UI.focusTask('crafting',r.id,r.tab,'crafting');};
UI.V.hunting=()=>{
 if(!Q.skillUnlocked('hunting'))return UI.lockedPage('hunting');
 const tabs=`<nav class="hunt-mode-tabs btnrow"><button class="btn ${UI.huntMode!=='quarry'?'on':''}" data-do="huntmode" data-a="field">${ico('paw')}Fieldwork</button><button class="btn" data-do="huntground" data-tip="text:Hunt animals in your town's hunting ground, on the combat page">${ico('attack')}Hunting ground</button></nav>`;
 if(UI.huntMode==='quarry'){UI.huntMode='field';setTimeout(()=>UI.DO.huntground&&UI.DO.huntground(),0);}
 const trap=Q.fieldTrap(),L=Q.fieldAccessLevel();
 const choices=D.TOWNS.map(t=>{const lvl=Q.lureLvl(t.id),locked=L<lvl||!Q.townUnlocked(t.id)||!S().towns[t.id]?.visited,sig=Q.signatureOf(t.id),focus=Q.fieldFocus(t.id);return {id:'lure:'+t.id,name:t.name+' fieldwork',artKind:'item',artId:trap?.id||'wooden_trap',yieldId:null,locked,blocked:locked||!trap,reason:!Q.townUnlocked(t.id)||!S().towns[t.id]?.visited?'Visit '+t.name+' first':L<lvl?'Requires Hunting '+lvl:!trap?'Craft a wooden field trap first':'',short:L<lvl?'Lv '+lvl:!S().towns[t.id]?.visited?'Reach '+t.name:'',caption:'Hunting '+lvl,stateText:locked?'Locked':focus?'Material focus':'Materials & discoveries',info:`<div class="field-gear">${D.FIELD_TRAPS.map(x=>`<span class="field-tool ${trap?.id===x.id?'on':''}" data-tip="text:${esc(D.ITEMS[x.id].name)} · Hunting ${x.lvl} · ${Math.round(x.break*100)}% break chance">${Q.itemIco(D.ITEMS[x.id])}<small>${Q.have(x.id)}</small></span>`).join('')}<button class="btn route-icon" data-do="fieldcraft" data-a="${trap?.id==='wooden_trap'?'reinforced_trap':trap?.id==='reinforced_trap'||trap?.id==='precision_trap'?'precision_trap':'wooden_trap'}" aria-label="Craft field traps" data-tip="text:Craft field traps">${UI.activityIcon('crafting')}</button></div><p class="sm">${trap?esc(D.ITEMS[trap.id].name)+' · '+Math.round(trap.break*100)+'% break chance · automatic best trap.':'Craft a trap, then start. Fieldwork repeats while you do other things.'}</p>${trap?.focus?`<div class="field-focus"><button class="btn sm ${!focus?'on':''}" data-do="fieldfocus" data-a="">Mixed haul</button>${Q.fieldLootOdds(t.id).filter(o=>Q.itemDiscovered(o.id)).map(o=>`<button class="btn route-icon ${focus===o.id?'on':''}" data-do="fieldfocus" data-a="${o.id}" aria-label="Favour ${esc(D.ITEMS[o.id].name)}" data-tip="text:${esc(D.ITEMS[o.id].name)} · ${o.pct.toFixed(0)}% of material hauls">${Q.itemIco(D.ITEMS[o.id])}</button>`).join('')}</div>`:''}<p class="sm dim">${sig&&!S().pets.owned[sig.id]&&Q.skillUnlocked('beastmastery')?'An occasional egg can start a new bond at your ranch.':'Hauls supply crafting and other practical work.'}</p>`};});
 let h=UI.taskPanel('hunting','Fieldwork','train',choices,'Start');if(UI.huntingStageStrip)h=h.replace('<div class="activity-actions">',UI.huntingStageStrip('field')+'<div class="activity-actions">');return tabs+h+`<section data-reference="true" class="panel reference-panel" id="hunting-progress">${UI.skillHero('hunting')}</section>`;
};
// Older fieldwork links remain usable, but there is one home for this activity.
const guide0=UI.DO.guidemat;
UI.DO.guidemat=(kind,id)=>{if(kind==='train'&&String(id).startsWith('lure:')){UI.huntMode='field';UI.taskChoice.hunting=id;Q.go('hunting');return;}return guide0?.(kind,id);};

const beast0=UI.V.beastmastery;
UI.V.beastmastery=()=>{if(UI.beastMode==='field')UI.beastMode='beasts';return beast0().replace(/<button[^>]*data-do="beastmode"[^>]*data-a="field"[^>]*>[\s\S]*?<\/button>/g,'');};
const mode0=UI.DO.beastmode;
UI.DO.beastmode=mode=>{if(mode==='field'){UI.huntMode='field';Q.go('hunting');return;}return mode0(mode);};
})();
