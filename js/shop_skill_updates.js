/* Earned loot recovery and skill-specific workshop commissions. Existing tools keep their ladder. */
(() => {
const Q=window.DQ,D=Q.data,UI=Q.ui,S=()=>Q.S,{esc,ico}=Q;
Q.exclusiveLoot=id=>{const it=D.ITEMS[id];return !!it?.slot&&(!!it.rare||!!it.unique||Object.values(D.TOWN_TROPHY).includes(id)||Object.values(D.TOWERS||{}).some(t=>t.prize===id));};
for(const stock of Object.values(D.SHOPS))for(let i=stock.length-1;i>=0;i--)if(Q.exclusiveLoot(stock[i]))stock.splice(i,1);
const buy=Q.buy;Q.buy=(id,n=1)=>Q.exclusiveLoot(id)?(Q.toast('Earn this loot in the field. Previously found pieces can be recovered under Buy back.',true),false):buy(id,n);
Q.recoveryOffers=()=>Object.keys(D.ITEMS).filter(id=>Q.exclusiveLoot(id)&&!Q.owns(id)&&!!S().seen.items?.[id]);
Q.recoverLoot=id=>{
 if(Q.forecasting||Q.sim.on||!Q.recoveryOffers().includes(id))return false;
 const price=Math.max(1,D.ITEMS[id].val*4);if(S().coins<price)return false;
 const before=JSON.parse(JSON.stringify(S()));S().coins-=price;Q.give(id,1);S().stats.bought++;
 if(!Q.save()){Q.S=before;Q.xpAliases(Q.S);Q.fxDirty();return false;}Q.emit('shop');return true;
};
const enterShop=()=>UI.view==='shop'?UI.render(false):Q.go('shop');
const toolSkills=new Set(D.TOOLS.map(t=>t[1])),skills=D.SKILLS.filter(s=>!toolSkills.has(s.id));
D.SKILL_COMMISSIONS=Object.fromEntries(skills.map(s=>[s.id,{name:({cooking:'Kitchen fittings',smithing:'Forge fittings',crafting:'Sewing bench',hunting:'Tracking kit',beastmastery:'Ranch training kit',exploration:'Survey kit',research:'Study desk',herbalism:'Apothecary kit',enchanting:'Runework bench',carpentry:'Joinery bench',sailing:'Navigation kit',melee:'Practice equipment',ranged:'Range fittings',magic:'Spellwork kit',defence:'Defence training kit',hitpoints:'Conditioning kit'})[s.id]||s.name+' equipment'}]));
Q.skillCommission=sk=>{
 const rank=S().skillUpgrades?.[sk]||0,next=rank+1,need=[0,5,25,50][next],cost=rank<3?{coins:[0,250,2000,10000][next],['bar_'+['','bronze','iron','steel'][next]]:25,log_normal:10*next}:{};
 return {rank,next,need,cost,ready:rank<3&&Q.skillUnlocked(sk)&&Q.lvl(sk)>=need&&Object.entries(cost).every(([id,n])=>id==='coins'?S().coins>=n:Q.have(id)>=n)};
};
Q.buySkillCommission=sk=>{
 if(!D.SKILL_COMMISSIONS[sk]||Q.forecasting||Q.sim.on)return false;const st=Q.skillCommission(sk);if(!st.ready)return false;
 const before=JSON.parse(JSON.stringify(S()));S().coins-=st.cost.coins;for(const[id,n]of Object.entries(st.cost))if(id!=='coins')Q.take(id,n);(S().skillUpgrades||={})[sk]=st.next;
 if(!Q.save()){Q.S=before;Q.xpAliases(Q.S);Q.fxDirty();return false;}Q.fxDirty();Q.emit('shop');return true;
};
const xp=Q.extraXp;Q.extraXp=sk=>(xp?xp(sk):1)*(1+.03*(S().skillUpgrades?.[sk]||0));
UI.shopUpgradeExtraCount=()=>skills.filter(s=>Q.skillCommission(s.id).ready).length;
const targets=Q.actionTargets;Q.actionTargets=page=>page==='shop'?[...targets(page),...skills.filter(s=>Q.skillCommission(s.id).ready).map(s=>({page:'shop',kind:'skillupgrade',family:s.id,id:s.id}))]:targets(page);
UI.shopSkillExtraNav=()=>skills.map(s=>{const st=Q.skillCommission(s.id);return `<button class="btn ${UI.shopToolFamily===s.id?'on':''}" data-do="skillcommission" data-a="${s.id}">${UI.activityIcon(s.id)}<span>${esc(s.name)}</span>${st.ready?'<span class="notice-badge">1</span>':''}</button>`;}).join('');
const tabs=UI.shopTabs;UI.shopTabs=tab=>tabs(tab).replace('</div>',`<button class="btn ${tab==='recovery'?'on':''}" data-do="shoprecovery">${ico('bag')}Buy back</button></div>`);
const family=UI.DO.toolfamily;UI.DO.toolfamily=id=>{UI.skillCommissionSelected=null;family(id);};
const openMenu=UI.openMenuAction;UI.openMenuAction=t=>{if(t?.kind==='skillupgrade'){UI.DO.skillcommission(t.id);return true;}if(t?.kind==='tool')UI.skillCommissionSelected=null;return openMenu(t);};
const toolshop=UI.DO.toolshop;UI.DO.toolshop=id=>{UI.skillCommissionSelected=null;toolshop(id);};
const category=UI.DO.shopcategory;UI.DO.shopcategory=id=>{UI.skillCommissionSelected=null;UI.shopSeedsOnly=false;category(id);};
UI.shopSupplyFilter=id=>!UI.shopSeedsOnly||D.ITEMS[id].type==='seed'||id.startsWith('seed_');
UI.DO.shopseeds=()=>{UI.skillCommissionSelected=null;UI.shopSeedsOnly=true;UI.shopTab='buy';UI.shopCategory='supplies';UI.shopSelected.buy=null;enterShop();};
UI.DO.shoprecovery=()=>{UI.shopTab='recovery';UI.skillCommissionSelected=null;enterShop();};
let lastShopSpend=-Infinity;const spendOnce=fn=>{if(Date.now()-lastShopSpend<500)return;lastShopSpend=Date.now();fn();};
UI.DO.recoverloot=id=>spendOnce(()=>{Q.recoverLoot(id);UI.renderHud();UI.render(false);});
UI.DO.skillcommission=sk=>{if(!D.SKILL_COMMISSIONS[sk])return;UI.shopTab='buy';UI.shopCategory='tools';UI.shopToolFamily=sk;UI.skillCommissionSelected=sk;enterShop();};
UI.DO.buycommission=sk=>spendOnce(()=>{Q.buySkillCommission(sk);UI.renderHud();UI.render(false);});
const shortcut=sk=>`<button class="linkish skill-shop-link" data-do="skillupgrades" data-a="${sk}" aria-label="${esc(D.SK[sk].name)} upgrades" data-tip="text:Open ${esc(D.SK[sk].name)} shop upgrades">${ico('shop')}</button>`;
const taskPanel=UI.taskPanel;if(taskPanel)UI.taskPanel=(key,...args)=>{const raw=taskPanel(key,...args);return D.SK[key]?raw.replace(/(<section class="panel activity-choices"><div class="phead"><h2>.*?<\/h2>)/,'$1'+shortcut(key)):raw;};
const hero=UI.skillHero;UI.skillHero=(sk,extra='')=>hero(sk,extra).replace('</h2>',`</h2><button class="linkish skill-shop-link" data-do="skillupgrades" data-a="${sk}" aria-label="${esc(D.SK[sk].name)} upgrades" data-tip="text:Open ${esc(D.SK[sk].name)} shop upgrades">${ico('shop')}</button>`);
UI.DO.skillupgrades=sk=>{const tool=D.TOOLS.find(t=>t[1]===sk);if(tool){UI.skillCommissionSelected=null;UI.shopTab='buy';UI.shopCategory='tools';UI.shopToolFamily=tool[0];enterShop();}else UI.DO.skillcommission(sk);};
const commissionLocks=sk=>!Q.skillUnlocked(sk)?`<div class="skill-commission-locks">${Q.actionProgress(sk).map(r=>`<span data-tip="text:${esc(Q.reqLabel(r))}">${esc(({craft:'Crafted',smith:'Smithed',harvest:'Harvested',kill:'Victories',catch:'Fish caught',chop:'Gathered'})[r.stat]||Q.reqLabel(r).replace(/ level \d+/,''))}<b>${r.have} / ${r.need}</b></span>`).join('')}</div>`:'';
const shop=UI.V.shop;
UI.V.shop=()=>{
 const sk=UI.skillCommissionSelected;
 if(UI.shopTab==='recovery')return `<section class="panel shop-upgrade-header"><h2>Shop · Buy back</h2>${UI.shopTabs('recovery')}</section><section class="panel recovery-shelf"><p>Recover rare equipment you previously found and no longer own. Each replacement costs four times its base value.</p><div class="illustrated-choices">${Q.recoveryOffers().map(id=>`<article class="illustrated-card">${Q.itemIco(D.ITEMS[id])}<b>${esc(D.ITEMS[id].name)}</b><button class="btn" data-do="recoverloot" data-a="${id}" ${S().coins<D.ITEMS[id].val*4?'disabled':''}>Recover · ${D.ITEMS[id].val*4} coins</button></article>`).join('')||'<p>No missing rare equipment to recover. Find a piece first; equipped and stored items are already safe.</p>'}</div></section>`;
 if(sk&&UI.shopCategory==='tools'&&UI.shopTab==='buy'){
  const st=Q.skillCommission(sk),label=D.SKILL_COMMISSIONS[sk].name,raw=shop(),t=document.createElement('template');t.innerHTML=raw;
  const work=t.content.querySelector('.visual-shop');if(work)work.outerHTML=`<div class="visual-shop"><section class="panel shop-stock"><h2>${esc(D.SK[sk].name)} upgrades</h2><div class="illustrated-choices">${[1,2,3].map(r=>`<article class="illustrated-card ${r===st.next?'selected':''}">${UI.activityIcon(sk)}<b>${esc(label)} ${r}</b><small>+${r*3}% ${esc(D.SK[sk].name)} XP</small><small>Level ${[0,5,25,50][r]} · ${r<=st.rank?'Acquired':r===st.next?'Next upgrade':'Buy the previous rank first'}</small></article>`).join('')}</div></section><section class="panel shop-task"><div class="shop-detail-body"><h2>${esc(label)}</h2><p>+3% ${esc(D.SK[sk].name)} XP per rank · maximum +9%.</p>${st.rank<3?UI.needTiles(st.cost):'<p class="ok">All ranks acquired.</p>'}${commissionLocks(sk)}<p>${!Q.skillUnlocked(sk)?'':st.rank<3&&Q.lvl(sk)<st.need?'Requires '+esc(D.SK[sk].name)+' '+st.need:st.ready?'Ready to upgrade.':'Gather the missing materials.'}</p></div><div class="shop-detail-actions"><span></span><button class="btn primary" data-do="buycommission" data-a="${sk}" ${st.ready?'':'disabled'}>Upgrade ${esc(label)}</button></div></section></div>`;return t.innerHTML;
 }
 return shop();
};
})();
