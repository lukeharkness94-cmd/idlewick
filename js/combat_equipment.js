/* Combat equipment uses the same pack/bank, equip checks and ammo pool as Inventory. */
(() => {
const Q=window.DQ,D=Q.data,U=Q.ui,S=()=>Q.S,{esc,ico}=Q;
Q.combatEquip=id=>{
 if(Q.forecasting||!D.ITEMS[id]?.slot)return false;
 const before=JSON.parse(JSON.stringify(S())),r=Q.equipItem(id);if(!r.ok)return Q.toast(r.why,true),false;
 Q.fxDirty();if(!Q.save()){Q.S=before;Q.xpAliases?.(Q.S);Q.fxDirty();return false;}Q.emit('shop');return true;
};
U.B.combatreserve=e=>{const w=D.ITEMS[S().equip.weapon],sp=D.SPELLS.find(s=>s.id===S().spell),shots=w?.style==='ranged'?S().ammo.n:w?.style==='magic'?Math.floor(Q.have('rune')/(sp?.runes||1)):null;e.textContent=shots===null?'':`${shots} ${w.style==='ranged'?'equipped arrows':'casts with held runes'} · approximately ${(shots*Q.combatInterval()/60000).toFixed(1)} minutes of attacking. Free-shot effects may extend this estimate.`;};
const emptyIcon=k=>({head:'helm',body:'body',legs:'legs',shield:'shield',weapon:'sword',ring:'ring',amulet:'amulet',ammo:'arrow_ammo'})[k];
U.DO.magicrunes=()=>{U.tab.magic='Runes';Q.go('magic');};
const runeAmmo=()=>!(S().ammo.n>0)&&Q.weaponStyle()==='magic'&&Q.have('rune')>0;
const equippedId=k=>k==='ammo'&&S().ammo.n>0?S().ammo.id:k==='ammo'?(runeAmmo()?'rune':null):S().equip[k];
const loadout=()=>U.equipmentDoll(k=>{const id=equippedId(k),name=Q.SLOT_NAMES[k],item=id&&D.ITEMS[id];return `<button type="button" class="eq combat-equipped-slot ${item?'filled':'empty'}" style="--c:${item?item.col:'var(--mute)'}" data-do="combatgearpick" data-a="${k}" data-tip="${item?'item:'+id:'text:'+esc(name+' · Empty. Choose equipment for this slot.')}" aria-label="${esc(name+': '+(item?item.name:'empty')+'. Choose equipment')}">${item?Q.itemIco(item):ico(emptyIcon(k))}<small>${esc(name)}</small>${k==='ammo'&&item?`<b class="equipped-ammo">${id==='rune'?Q.have('rune'):S().ammo.n}</b>`:''}</button>`;});
/* the worn gear's totals for the style you are fighting with, under the doll (same numbers as Hero > Combat stats) */
const totals=()=>{const b=Q.bonus(),st=Q.weaponStyle(),rows=st==='ranged'?[['Ranged',b.rng,'ranged'],['Arrows',b.rngStr,'ranged']]:st==='magic'?[['Magic',b.mag,'magic']]:[['Accuracy',b.atk,'attack'],['Power',b.str,'strength']];
 return [...rows,['Defence',b.def,'defence']].map(([n,v,sk])=>`<span style="--c:${D.SK[sk].col}" data-tip="text:${esc(n)} from worn gear" aria-label="${esc(n)} +${v||0}">${ico(sk)}<i>${esc(n)} </i><b class="mono">+${v||0}</b></span>`).join('');};
U.B.combatequipped=e=>{const sig=JSON.stringify([S().equip,S().ammo,S().look,Q.weaponStyle()==='magic'?Q.have('rune'):0]);if(e._gearSig!==sig){e._gearSig=sig;e.innerHTML=loadout();const t=e.parentElement&&e.parentElement.querySelector('.combat-equipped-totals');if(t)t.innerHTML=totals();}};
const showLoadout=()=>{if(U.view!=='combat')return;const col=document.querySelector('#view .combat-x>.combat-targets');if(!col||col.querySelector('.combat-equipped'))return;col.insertAdjacentHTML('beforeend','<section class="panel combat-equipped" aria-label="Equipped combat gear"><h3>Equipped</h3><div class="combat-equipped-grid" data-b="combatequipped"></div><p class="combat-equipped-totals"></p></section>');U.B.combatequipped(col.querySelector('[data-b="combatequipped"]'));};
const body=()=>{const slot=U.combatGearSlot||'weapon',current=equippedId(slot),owned=Object.keys({...S().inv,...S().bank}).filter(id=>D.ITEMS[id]?.slot===slot&&Q.have(id)>0);
 const weapon=D.ITEMS[S().equip.weapon],spell=D.SPELLS.find(s=>s.id===S().spell),shots=weapon?.style==='ranged'?S().ammo.n:weapon?.style==='magic'?Math.floor(Q.have('rune')/(spell?.runes||1)):null;
 return `<div class="combat-gear">${shots!==null?'<p class="sm" data-b="combatreserve"></p>':''}${U.combatGearFocused?'':`<nav class="combat-gear-slots" aria-label="Equipment slots">${Q.SLOTS.map(k=>{const id=equippedId(k);return `<button class="btn ${slot===k?'on':''}" data-do="combatgearslot" data-a="${k}" aria-pressed="${slot===k}">${id?Q.itemIco(D.ITEMS[id]):ico(({head:'helm',body:'body',legs:'legs',shield:'shield',weapon:'sword',ring:'ring',amulet:'amulet',ammo:'arrow_ammo'})[k])}<span>${esc(Q.SLOT_NAMES[k])}</span><small>${id?esc(D.ITEMS[id].name):'Empty'}${k==='ammo'&&id?' · '+S().ammo.n:''}</small></button>`;}).join('')}</nav>`}<section><h3>${esc(Q.SLOT_NAMES[slot])}</h3><p>${current?'Equipped: '+esc(D.ITEMS[current].name):'Nothing equipped'} · Backpack and bank supplies</p><div class="combat-gear-options">${owned.map(id=>{const it=D.ITEMS[id],c=Q.canEquip(id);return `<article class="combat-gear-item">${Q.itemIco(it)}<div><b>${esc(it.name)}</b><small>${U.statLine(it.b)||''} · ${Q.have(id)} held</small>${U.gearPurpose?U.gearPurpose(it,false):''}${U.compareLine?U.compareLine(id):''}<small>${c.ok?'Ready':esc(c.why)}</small></div><button class="btn ${c.ok?'primary':''}" data-do="combatequip" data-a="${id}" ${c.ok?'':'disabled'}>Equip ${esc(it.name)}</button></article>`;}).join('')||'<p>No spare equipment for this slot. Your current gear stays equipped.</p>'}</div></section><p class="sm">Changing gear keeps the current encounter and running activity. A bow needs equipped arrows; a staff needs runes.</p></div>`;
};
const refresh=()=>{const e=document.querySelector('.combat-gear')?.parentElement;if(e){e.innerHTML=body();U.upd();}};
U.DO.combatgear=()=>{U.combatGearFocused=false;U.combatGearSlot=U.combatGearSlot||'weapon';Q.modal({title:'Combat equipment',body:body(),wide:true});U.upd();};
U.DO.combatgearpick=slot=>{if(!Q.SLOTS.includes(slot))return;U.combatGearFocused=true;U.combatGearSlot=slot;Q.modal({title:Q.SLOT_NAMES[slot]+' equipment',body:body(),wide:true});U.upd();};
U.DO.combatgearslot=slot=>{if(Q.SLOTS.includes(slot)){U.combatGearSlot=slot;refresh();}};
U.DO.combatequip=id=>{if(Q.combatEquip(id)){U.render(false);U.renderHud();}refresh();};
const render=U.render;U.render=(...args)=>{const r=render(...args);showLoadout();return r;};
const more=U.DO.combatmore;U.DO.combatmore=(key,...args)=>key==='gear'?U.DO.combatgear():more(key,...args);
})();
