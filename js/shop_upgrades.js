/* Material-backed shop upgrades; acquired tools are permanent and never offered twice. */
(() => {
const Q=window.DQ,D=Q.data,UI=Q.ui,S=()=>Q.S,{esc,ico}=Q;
const metal=[{}, {ore_iron:25},{ore_iron:25,ore_coal:10},{ore_mithril:25},{ore_adamant:25},{ore_runite:25},{ore_astralite:25}];
Q.migrateToolUpgrades=st=>{st.toolUpgrades=st.toolUpgrades||{};for(const id of new Set([...Object.keys(st.bank),...Object.keys(st.inv)])){const n=(st.bank[id]||0)+(st.inv[id]||0),it=D.ITEMS[id];if(n>0&&it?.toolSkill&&it.tier)for(const t of D.TOOL_ORDER.filter(t=>t<=it.tier))st.toolUpgrades['tool_'+Q.toolKey(it.toolSkill)+'_'+t]=true;}return st;};
Q.toolUpgradeOwned=id=>{const it=D.ITEMS[id];return !!(S().toolUpgrades?.[id]||Q.have(id)>0||(it?.toolSkill&&Q.toolTier(it.toolSkill)>=it.tier));};
const give0=Q.give,tier0=Q.toolTier;
Q.give=(id,n=1)=>{const r=give0(id,n),it=D.ITEMS[id];if(n>0&&it?.toolSkill&&it.tier){S().toolUpgrades=S().toolUpgrades||{};for(const t of D.TOOL_ORDER.filter(t=>t<=it.tier))S().toolUpgrades['tool_'+Q.toolKey(it.toolSkill)+'_'+t]=true;}return r;};
Q.toolTier=sk=>{const k=Q.toolKey(sk);for(const t of [...D.TOOL_ORDER].reverse())if(S().toolUpgrades?.['tool_'+k+'_'+t])return Math.max(t,tier0(sk));return tier0(sk);};
Q.shopMaterialCost=id=>{const it=D.ITEMS[id];if(!it)return {};if(it.toolSkill)return {...D.TOOL_COSTS[id]};/* every tier needs its own metal (owner, 22 Nov); the Willowbrook shop sells copper ore, so the first pickaxe and Mining can still start */if(it.slot==='weapon'&&!it.rare){const r=Object.values(D.RECIPES).find(r=>r.out[id]);return r?{...r.in}:{};}return it.type==='gear'&&Number.isInteger(it.tier)&&it.tier>0?{...metal[it.tier]}:{};};
Q.toolShopRegion=id=>D.TOWNS.find(t=>(D.SHOPS[t.id]||[]).includes(id))?.id;
Q.shopUpgradeState=id=>{
 const it=D.ITEMS[id],cost=Q.shopMaterialCost(id),region=Q.toolShopRegion(id),owned=it?.type==='tool'&&Q.toolUpgradeOwned(id),lock=Q.lockedSkillFor(id),reachable=!region||Q.townUnlocked(region),materials=Object.entries(cost).every(([k,n])=>Q.have(k)>=n),gold=S().coins>=Q.buyPrice(id);
 return {cost,region,owned,materials,gold,reachable,lock,ready:!!it&&!owned&&!lock&&reachable&&materials&&gold};
};
Q.shopMaterialsAffordable=(id,qty=1)=>Number.isSafeInteger(qty)&&qty>0&&Object.entries(Q.shopMaterialCost(id)).every(([k,n])=>Q.have(k)>=n*qty);
const buy0=Q.buy;
Q.buy=(id,qty=1)=>{
 const it=D.ITEMS[id];if(!it||!Number.isSafeInteger(qty)||qty<1)return false;
 const cost=Q.shopMaterialCost(id),tool=it.type==='tool'&&it.toolSkill;
 if(!tool&&!Object.keys(cost).length)return buy0(id,qty);
 const state=Q.shopUpgradeState(id);if(tool&&state.owned)return Q.toast('That tool upgrade is already acquired',true),false;
 if(state.lock)return Q.toast('Learn '+D.SK[state.lock].name+' first',true),false;
 if(tool&&!state.reachable)return Q.toast('Reach '+D.TOWN[state.region].name+' first',true),false;
 const count=tool?1:qty,coins=Q.buyPrice(id)*count;if(S().coins<coins||Object.entries(cost).some(([k,n])=>Q.have(k)<n*count))return Q.toast('More coins or materials needed',true),false;
 const before=JSON.parse(JSON.stringify(S()));S().coins-=coins;for(const[k,n]of Object.entries(cost))Q.take(k,n*count);Q.give(id,count);S().stats.bought+=count;if(tool)S().stats.tools++;
 if(!Q.save()){Q.S=before;Q.xpAliases(Q.S);Q.fxDirty();return false;}Q.sfx('buy');Q.achDirty=true;Q.emit('shop');return true;
};
const families=D.TOOLS.map(([key,sk,ic,label])=>({key,sk,ic,label:D.SK[sk].name,ids:D.TOOL_ORDER.map(t=>'tool_'+key+'_'+t)}));
const targets0=Q.actionTargets;
if(targets0)Q.actionTargets=page=>page==='shop'?families.flatMap(f=>f.ids.filter(id=>Q.shopUpgradeState(id).ready).map(id=>({page:'shop',kind:'tool',family:f.key,id}))):targets0(page);
const selectReadyTool=family=>{const f=families.find(f=>f.key===family),id=f?.ids.find(id=>Q.shopUpgradeState(id).ready);if(id)UI.shopSelected.buy=id;return id;};
const cues=ids=>{const ready=ids.filter(id=>Q.shopUpgradeState(id).ready).length+(ids.length>10?(UI.shopUpgradeExtraCount?.()||0):0);return ready?`<span class="notice-badge upgrade-cue ready" aria-label="${ready} upgrades ready" data-tip="text:${ready} upgrades ready: coins and materials available">${ready}</span>`:'';};
UI.shopCategory=UI.shopCategory||'tools';UI.shopToolFamily='axe';
UI.shopCatalogFilter=id=>{const it=D.ITEMS[id];return UI.shopCategory==='equipment'?it.type!=='tool'&&!!(it.slot||it.type==='ammo'):it.type!=='tool'&&!it.slot&&it.type!=='ammo'&&(!UI.shopSupplyFilter||UI.shopSupplyFilter(id));};
UI.shopCardCost=id=>UI.money(Q.buyPrice(id))+`<span class="shop-mat-price">${Object.entries(Q.shopMaterialCost(id)).map(([k,n])=>`<span>${Q.itemDiscovered(k)?Q.itemIco(D.ITEMS[k]):ico('lock')}<b>${n}</b></span>`).join('')}</span>`;
const tabs0=UI.shopTabs;
UI.shopTabs=tab=>tabs0(tab)+`<nav class="shop-categories" aria-label="Shop categories">${[['tools','Skill upgrades','mining'],['equipment','Equipment','shield'],['supplies','Supplies','bag']].map(([id,label,ic])=>`<button class="btn ${tab==='buy'&&UI.shopCategory===id?'on':''}" data-do="shopcategory" data-a="${id}">${ico(ic)}<span>${label}</span>${id==='tools'?cues(families.flatMap(f=>f.ids)):''}</button>`).join('')}</nav>`;
UI.shopSkillExtraNav=()=>'';
const familyNav=()=>`<nav class="tool-families" aria-label="Skill upgrades">${families.map(f=>`<button class="btn ${UI.shopTab==='buy'&&UI.shopCategory==='tools'&&f.key===UI.shopToolFamily?'on':''}" data-do="toolfamily" data-a="${f.key}" aria-pressed="${UI.shopTab==='buy'&&UI.shopCategory==='tools'&&f.key===UI.shopToolFamily}">${UI.activityIcon(f.sk)}<span>${esc(f.label)}</span>${cues(f.ids)}</button>`).join('')}${UI.shopSkillExtraNav()}</nav>`;
const shopHeader=()=>{const t=document.createElement('template');t.innerHTML=UI.shopTabs(UI.shopTab);const categories=t.content.querySelector('.shop-categories');const primary=categories?.outerHTML||'';categories?.remove();return `<section class="panel shop-upgrade-header"><div class="phead"><h2>Shop</h2><small>${esc(D.TOWN[S().town].name)}</small></div>${primary}<div class="shop-shelf-actions">${t.innerHTML}</div></section>`;};
// One scaffold for every shelf: navigation never sits inside a changing item panel.
const stableShop=raw=>{
 const tmp=document.createElement('template');tmp.innerHTML=raw;
 const workspace=tmp.content.querySelector('.visual-shop'),stock=workspace?.querySelector('.shop-stock'),task=workspace?.querySelector('.shop-task');if(!workspace||!stock||!task)return shopHeader()+raw;
 for(const e of stock.querySelectorAll(':scope > .phead,:scope > .tabs,:scope > .shop-categories'))e.remove();
 if(UI.shopTab==='buy'&&UI.shopCategory==='tools'){const nav=document.createElement('template');nav.innerHTML=familyNav();stock.prepend(nav.content);}
 const controls=task.querySelector('.shop-controls')||task.querySelector('[data-do="localqty"]')?.parentElement;
 let actions=task.querySelector('.shop-action');const local=task.querySelector('[data-do="localbuy"]');
 if(!actions&&local){actions=document.createElement('div');actions.className='shop-action';actions.append(local);}
 if(controls)controls.remove();if(actions)actions.remove();
 const body=document.createElement('div');body.className='shop-detail-body';body.append(...task.childNodes);
 const footer=document.createElement('div');footer.className='shop-detail-actions';
 const qty=document.createElement('div');qty.className='shop-quantity-slot';if(controls)qty.append(controls);else qty.innerHTML=UI.shopTab==='buy'&&UI.shopCategory==='tools'?'<span class="sm">One permanent tool upgrade</span>':'<span class="sm">Choose an item from this shelf.</span>';
 footer.append(qty);if(actions)footer.append(actions);task.append(body,footer);
 return shopHeader()+tmp.innerHTML;
};
const shop0=UI.V.shop;
UI.V.shop=()=>{
 if(UI.routeShopItem&&D.ITEMS[UI.routeShopItem]){const it=D.ITEMS[UI.routeShopItem];UI.shopCategory=it.type==='tool'?'tools':it.slot||it.type==='ammo'?'equipment':'supplies';if(it.toolSkill)UI.shopToolFamily=Q.toolKey(it.toolSkill);UI.routeShopItem=null;}
 if(UI.shopTab!=='buy'||UI.shopCategory!=='tools')return stableShop(shop0());
 /* every tier stays on the shelf; the "Available only" switch (like Ready to make) hides tiers that need a region or skill you don't have yet */
 const F=families.find(f=>f.key===UI.shopToolFamily)||families[0],open=id=>{const st=Q.shopUpgradeState(id);return !st.lock&&st.reachable;},all=F.ids.filter(id=>!Q.toolUpgradeOwned(id)),only=!!UI.shopAvailableOnly,ids=only?all.filter(open):all,hidden=all.length-ids.length,selected=ids.includes(UI.shopSelected.buy)?UI.shopSelected.buy:ids[0];UI.shopSelected.buy=selected;
 const detail=selected?(()=>{const it=D.ITEMS[selected],state=Q.shopUpgradeState(selected);return `<div class="phead"><h2>Tool upgrade</h2></div>${UI.shopPreview(selected)}<p class="upgrade-purpose">${esc(it.purpose||'')}</p><p>${+(D.TOOL_SPEED[it.tier]*100).toFixed(1)}% faster ${esc(D.SK[F.sk].name)}. Your best acquired tool is used automatically.</p>${UI.needTiles({coins:Q.buyPrice(selected),...state.cost})}<p class="${state.ready?'ok':'dim'}">${state.lock?'Learn '+esc(D.SK[state.lock].name)+' first.':!state.reachable?'Reach '+esc(D.TOWN[state.region].name)+' to unlock this commission.':state.ready?'You have the supplies for this upgrade.':'Gather the missing supplies, then return here to upgrade.'}</p><div class="shop-action"><button class="btn primary" data-do="buyupgrade" data-a="${selected}" ${state.ready?'':'disabled'}>Upgrade</button></div>`;})():'<h2>Every upgrade acquired</h2><p>Your best tool is already in use.</p>';
 const toggle=`<div class="shop-filter-row"><button class="filter-toggle ${only?'on':''}" role="switch" aria-checked="${only}" data-do="shopavailonly" data-tip="text:Hide tiers that need a region you haven't reached or a skill you haven't learned"><span class="ft-track" aria-hidden="true"><span class="ft-knob"></span></span><span>Available only</span><b>${only?'On':'Off'}</b></button>${only&&hidden?`<small class="dim">${hidden} later ${hidden===1?'tier':'tiers'} hidden</small>`:''}</div>`;
 return stableShop(`<div class="visual-shop shop-tools"><section class="panel shop-stock">${all.length?toggle:''}<div class="illustrated-choices">${ids.map(id=>{const it=D.ITEMS[id],state=Q.shopUpgradeState(id);return `<button class="illustrated-card ${id===selected?'selected':''}" data-tool="${id}" data-do="shopselect" data-a="${id}" aria-pressed="${id===selected}"><span class="choice-art">${Q.itemIco(it)}</span><b>${esc(it.name)}</b><small>${+(D.TOOL_SPEED[it.tier]*100).toFixed(1)}% faster</small><span class="stock-price">${UI.shopCardCost(id)}</span><span class="choice-state ${state.ready?'ok':''}">${state.ready?'✓ Ready to upgrade':state.lock?'Skill required':!state.reachable?'Region required':'Supplies needed'}</span></button>`;}).join('')||(all.length?'<p>Nothing in this family is open to you yet. Turn off Available only to see the later tiers.</p>':'<p>You have acquired every upgrade in this family.</p>')}</div></section><section class="panel shop-task">${detail}</section></div>`);
};
Object.assign(UI.DO,{
 shopcategory:id=>{if(!['tools','equipment','supplies'].includes(id))return;UI.shopTab='buy';UI.shopCategory=id;UI.shopSelected.buy=null;if(id==='tools'){const f=families.find(f=>f.ids.some(id=>Q.shopUpgradeState(id).ready));if(f){UI.shopToolFamily=f.key;selectReadyTool(f.key);}}UI.render(false);},
 shopavailonly:()=>{UI.shopAvailableOnly=!UI.shopAvailableOnly;UI.render(false);},
 toolfamily:id=>{if(!families.some(f=>f.key===id))return;UI.shopTab='buy';UI.shopCategory='tools';UI.shopToolFamily=id;selectReadyTool(id);UI.render(false);},
 toolshop:id=>{const it=D.ITEMS[id];UI.shopTab='buy';UI.shopCategory='tools';UI.shopToolFamily=Q.toolKey(it?.toolSkill)||'axe';UI.shopSelected.buy=id;if(UI.view==='shop')UI.render(false);else Q.go('shop');},
 buyupgrade:id=>{if(!Q.buy(id,1)&&Q.saveHealth)Q.toast(Q.saveHealth,true);UI.renderHud();UI.renderRail();UI.render(false);}
});
let stockSignature='';Q.on('ui',()=>{if(UI.view!=='shop'||UI.shopTab!=='buy')return;const sig=JSON.stringify([S().coins,S().inv,S().bank,S().toolUpgrades,D.TOOLS.map(t=>Q.skillUnlocked(t[1])),Object.keys(S().towns)]);if(sig===stockSignature)return;stockSignature=sig;UI.refresh?.();});
})();
