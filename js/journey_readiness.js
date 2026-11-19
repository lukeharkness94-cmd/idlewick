/* Concrete preparation and consumable routes. No automatic purchases, starts or goal changes. */
(() => {
const Q=window.DQ,D=Q.data,U=Q.ui,S=()=>Q.S;
Q.purchasePlan=(ids,qty=1)=>{
 const cost={coins:0};for(const id of ids){cost.coins+=Q.buyPrice(id)*qty;for(const[k,n]of Object.entries(Q.shopMaterialCost(id)))cost[k]=(cost[k]||0)+n*qty;}
 const missing=Object.entries(cost).filter(([id,n])=>(id==='coins'?S().coins:Q.have(id))<n).map(([id,n])=>({id,need:n,have:id==='coins'?S().coins:Q.have(id)}));
 return {cost,missing,ready:!missing.length};
};
const prep=Q.prepAdvice;
Q.prepAdvice=(...args)=>{
 const rows=prep(...args).map(row=>{if(!row.items?.length)return row;const plan=Q.purchasePlan(row.items),material=plan.missing.find(x=>x.id!=='coins');
  if(material){const can=plan.missing.filter(x=>x.id!=='coins').every(x=>{const src=Q.sourceOf(x.id);return src&&(!src.skill||Q.skillUnlocked(src.skill)&&Q.lvl(src.skill)>=(src.lvl||1))&&(!src.town||Q.townUnlocked(src.town))&&(src.kind!=='shop'||S().coins>=Q.buyPrice(x.id)*(x.need-x.have));});
   return {...row,title:'Prepare '+D.ITEMS[material.id].name.toLowerCase()+' for your gear',text:plan.missing.map(x=>(x.id==='coins'?'Coins':D.ITEMS[x.id].name)+': '+Q.fmt(x.have)+' / '+Q.fmt(x.need)).join(' · ')+'. This purchase also needs materials.',action:'route',a:material.id,preparing:true,actionable:can,afford:false,purchase:plan};
  }
  return {...row,afford:plan.ready,purchase:plan,text:row.text.replace(/You have [\d,]+ coins, enough for all of it\./,'You have the coins and materials for this purchase.')};
 });
 // A counter already in your pack or a usable ability takes priority over a blocked shopping recommendation.
 return [...rows.filter(x=>!x.preparing),...rows.filter(x=>x.preparing)];
};
Q.combatSupplyStep=()=>{
 const style=Q.weaponStyle();if(!['ranged','magic'].includes(style))return null;
 let id='rune',held=Q.have(id);
 if(style==='ranged'){
  const owned=Object.keys({...S().inv,...S().bank}).find(k=>D.ITEMS[k]?.slot==='ammo'&&Q.have(k)>0&&Q.canEquip(k).ok);
  held=(S().ammo.n||0)+(S().ammo.id?Q.have(S().ammo.id):0);id=S().ammo.id||owned||'arrow_bronze';
  if(held<20&&owned&&owned!==S().ammo.id)return {title:'Equip '+D.ITEMS[owned].name,detail:'You already have arrows. Equip them to continue Ranged training.',action:'equip',a:owned};
 }
 // Once the rune-material introduction is accepted, finish it before resuming the boss route.
 // Its combat objective still needs casting supplies; never point an empty staff at rats.
 if(style==='magic'&&!Q.skillUnlocked('mining')){
  const q=D.QM.miners_pick,state=Q.questState(q);
  if(state==='ready')return {title:'Collect your mining pick',detail:'Mine copper for your own Magic supplies.',action:'qclaim',a:q.id};
  if(state==='active'){const o=q.obj.find((o,i)=>Q.objProg(q,S().q[q.id],i)<o.n);
   if(o?.ev==='chop')return {title:o.label,detail:'Earn your pickaxe, then mine copper for Magic.',action:'journeytask',a:'wood',b:o.key};
   if(o?.ev==='kill'&&held>=20)return {title:o.label,detail:'You have casting supplies for the mine. Earn your pickaxe, then make runes in Magic.',action:'huntquest',a:o.key};
  }
 }
 if(held>=20)return null;
 if(style==='ranged'&&!(D.SHOPS[S().town]||[]).includes(id)){
  const local=(D.SHOPS[S().town]||[]).find(k=>D.ITEMS[k]?.slot==='ammo'&&Q.canEquip(k).ok);
  if(local){id=local;held=Q.have(id);}else return {title:'Find '+D.ITEMS[id].name.toLowerCase(),detail:'The source route shows where these arrows are available and keeps a return link.',action:'route',a:id};
 }
 const recipe=Object.values(D.RECIPES).filter(r=>r.out[id]).sort((a,b)=>b.out[id]/b.t-a.out[id]/a.t).find(r=>Q.skillUnlocked(r.skill)&&Q.lvl(r.skill)>=r.lvl&&!Q.recipeGate?.(r)&&Q.recipeDiscovered(r)&&Q.canMake(r));
 if(recipe)return {title:'Make '+D.ITEMS[id].name.toLowerCase(),detail:Q.fmt(held)+' left. You have the supplies to make another batch.',action:'journeytask',a:'recipe',b:recipe.id};
 if(style==='magic'){
  const r=D.RECIPES.craft_runes,missing=Object.entries(r.in).find(([k,n])=>Q.have(k)<n);
  if(missing){const src=Q.sourceOf(missing[0]);
   if(src?.id&&src.skill&&Q.skillUnlocked(src.skill)&&Q.lvl(src.skill)>=(src.lvl||1))return {title:'Gather '+D.ITEMS[missing[0]].name.toLowerCase()+' for runes',detail:Q.have(missing[0])+' / '+missing[1]+'. Inscribe a batch in Magic instead of buying casting supplies.',action:'journeytask',a:src.kind,b:src.id};
   if(src?.skill==='mining'&&!Q.skillUnlocked('mining')){
    const q=D.QM.miners_pick,state=Q.questState(q);
    if(state==='new'||state==='ready')return {title:state==='new'?'Learn to mine your rune materials':'Collect your mining pick',detail:'A pickaxe opens copper for your first player-made runes.',action:state==='new'?'qstart':'qclaim',a:q.id};
   }
  }
 }
 // A low-stock reminder must not trap a player in repeated one-item purchases.
 // Let the remaining supplies work when a useful refill is unaffordable.
 const price=Q.buyPrice(id);if(held>0&&S().coins<price*10)return null;
 const qty=[100,10,1].find(n=>S().coins>=price*n);
 if(!qty)return {title:'Fund your combat supplies',detail:'You need '+D.ITEMS[id].name.toLowerCase()+'. Sell spare supplies or claim a quest reward before continuing.',action:'journeysell',a:id};
 return {title:'Restock '+D.ITEMS[id].name.toLowerCase(),detail:Q.fmt(held)+' left · '+qty+' cost '+Q.fmt(price*qty)+' coins. Your chosen fighting style needs these supplies.',action:'journeysupply',a:id,b:String(qty)};
};
const next=Q.journeyNext;
Q.journeyNext=(id=S().journey||'boss')=>{
 const step=next(id);if(id!=='boss'||S().q.first_steps?.s!=='done'||['qstart','qclaim'].includes(step.action)||!Q.regionBoss())return step;
 return Q.combatSupplyStep()||step;
};
const regional=Q.regionNext;
Q.regionNext=()=>{
 const ready=D.QUESTS.find(q=>!q.guild&&q.obj.some(o=>o.ev==='boss')&&Q.questState(q)==='ready');
 if(ready)return {title:'Claim your victory reward',detail:ready.giver+' is waiting to thank you.',action:'qclaim',a:ready.id};
 const boss=Q.regionBoss();if(!boss||S().town!==boss.town)return regional();
 if(Q.combatLvl()<boss.boss.req){
  const owned=Q.prepAdvice(boss.id).find(x=>x.action==='equip'&&(x.key.startsWith('equip:')||x.key==='upgrade')&&(D.ITEMS[x.a]?.slot!=='weapon'||D.ITEMS[x.a]?.style===Q.weaponStyle()));
  if(owned)return {title:owned.title,detail:owned.text+' Use the gear you have before more training.',action:'equip',a:owned.a};
 }
 let quest=D.QUESTS.find(q=>!q.guild&&q.obj.some(o=>o.ev==='boss'&&o.key===boss.id));
 const seen=new Set();while(quest?.req&&S().q[quest.req]?.s!=='done'&&!seen.has(quest.id)){seen.add(quest.id);quest=D.QM[quest.req];}
 if(!quest||quest.obj.some(o=>o.ev==='boss'&&o.key===boss.id))return regional();
 const state=Q.questState(quest);
 if(state==='new')return {title:'Accept “'+quest.name+'”',detail:quest.giver+' needs your help before the '+(boss.boss.short||boss.name)+' hunt.',action:'qstart',a:quest.id};
 if(state==='ready')return {title:'Claim “'+quest.name+'”',detail:'Collect your reward and continue the regional story.',action:'qclaim',a:quest.id};
 if(state==='active'){
  const obj=quest.obj.find((o,i)=>Q.objProg(quest,S().q[quest.id],i)<o.n);
  if(obj?.ev==='kill'&&D.MON[obj.key]&&!D.MON[obj.key].boss){const food=Q.foodStep?.('Prepare food for “'+quest.name+'”.');if(food)return food;
   return {title:obj.label,detail:quest.giver+' · '+Q.objProg(quest,S().q[quest.id],quest.obj.indexOf(obj))+' / '+obj.n+'. This helps open the regional boss quest.',action:'huntquest',a:obj.key};}
  return {title:'Continue “'+quest.name+'”',detail:obj?.label||'Check your next objective.',action:'questcontinue',a:quest.id};
 }
 const need=Q.questPreparation(quest)[0];
 if(need)return {title:'Prepare '+D.SK[need.sk].name+' for “'+quest.name+'”',detail:Q.skillUnlocked(need.sk)?D.SK[need.sk].name+' '+Q.lvl(need.sk)+' / '+need.lvl+'. This preparation opens the next story objective.':Q.unlockHow(need.sk),action:'go',a:D.SK[need.sk].page};
 return regional();
};
U.DO.journeysupply=(id,qty)=>{
 if(!D.ITEMS[id])return;U.skillCommissionSelected=null;U.shopTab='buy';U.shopCategory=D.ITEMS[id].slot==='ammo'?'equipment':'supplies';U.shopSupplyFilter=null;U.shopQty=[1,10,100].includes(+qty)?+qty:1;U.shopSelected.buy=id;U.returnTo={page:'overview',label:'Your goal'};Q.go('shop');
};
U.DO.journeysell=()=>{U.skillCommissionSelected=null;U.shopTab='sell';U.returnTo={page:'overview',label:'Your goal'};Q.go('shop');};
})();
