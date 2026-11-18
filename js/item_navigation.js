/* Icon routes use the actual catalogue. Navigation never starts or spends an action. */
(() => {
const Q=window.DQ,D=Q.data,U=Q.ui,{esc,ico}=Q;
Q.itemNavigation=id=>{
 const it=D.ITEMS[id];if(!it)return {get:[],use:[]};const get=[],use=[];
 const add=(list,key,page,kind,target,label,pic)=>{if(!list.some(x=>x.key===key))list.push({key,page,kind,target,label,pic});};
 for(const n of Object.values(D.NODE))if(n.item===id)add(get,'node:'+n.skill,D.SK[n.skill].page,'node',n.kind+':'+n.id,`${D.SK[n.skill].name} ${n.lvl}`,U.activityIcon(n.skill));
 for(const r of Object.values(D.RECIPES)){
  if(r.out?.[id])add(get,'recipe:'+r.skill,D.SK[r.skill].page,'recipe',r.id,`${D.SK[r.skill].name} ${r.lvl}`,U.activityIcon(r.skill));
  if(r.in?.[id])add(use,'recipe:'+r.skill,D.SK[r.skill].page,'recipe',r.id,`${D.SK[r.skill].name} ${r.lvl}`,U.activityIcon(r.skill));
 }
 if(Object.values(D.SHOPS).some(s=>s.includes(id)))add(get,'shop','shop','shop',id,'Shop',ico('shop'));
 if(!Q.exclusiveLoot(id)&&(Object.values(D.TOWN_RARE_GEAR).some(s=>s.includes(id))||Object.values(D.TOWN_SPECIALS).some(s=>s.includes(id))))add(get,'rare','shop','rare',id,'Rare wares',ico('shop'));
 for(const m of D.MONLIST)if(m.first===id||m.drops?.some(d=>d[0]===id)){
  const known=(Q.S.beast.kills[m.id]||0)>0,group=m.boss?'boss':m.tower?'tower':'creature';
  add(get,group,'combat','creature',m.id,known?m.name:(m.boss?'Boss reward':'Creature drop'),known?Q.monSprite(m,32):ico(m.boss?'trophy':'paw'));
 }
 for(const t of Object.values(D.TOWERS||{}))if(t.prize===id)add(get,'tower','tower','tower',t.town||Object.keys(D.TOWERS).find(k=>D.TOWERS[k]===t),'Tower reward',ico('tower'));
 for(const q of D.QUESTS){if(q.reward?.items?.[id]&&!q.secret)add(get,'quest','quests','quest',q.id,'Quest reward',ico('quest'));if(q.obj.some(o=>o.ev==='deliver'&&o.key===id))add(use,'quest','quests','quest',q.id,'Quest hand-in',ico('quest'));}
 if(id.startsWith('crop_')||(D.ANIMALS||[]).some(a=>a.prod===id))add(get,'farm','farming','page','farming','Farming',U.activityIcon('farming'));
 if(id.startsWith('seed_')||(D.ANIMALS||[]).some(a=>a.feed===id))add(use,'farm','farming','page','farming','Farming',U.activityIcon('farming'));
 for(const [pid,p]of Object.entries(D.PROJECTS))if(JSON.stringify(p.cost||p.need||{}).includes('"'+id+'"'))add(use,'projects','projects','project',pid,p.name,ico('town'));
 const tech=(D.TECHS||[]).find(t=>t.cost?.[id]);if(tech)add(use,'research','research','research',tech.id,'Scholarship',U.activityIcon('research'));
 for(const r of D.POTION_RECIPES||[]){if(r.id===id)add(get,'potion','brewery','page','brewery','Herbalism',U.activityIcon('herbalism'));if(r.in?.[id])add(use,'potion','brewery','page','brewery','Herbalism',U.activityIcon('herbalism'));}
 if(id==='feed')add(use,'farm','farming','page','farming','Livestock',U.activityIcon('farming'));
 if(it.toolSkill)add(use,'tool',D.SK[it.toolSkill].page,'page',D.SK[it.toolSkill].page,D.SK[it.toolSkill].name,U.activityIcon(it.toolSkill));
 if(it.slot||it.heal||it.type==='ammo'||it.type==='potion')add(use,'combat','combat','page','combat','Combat',U.activityIcon('combat'));
 if(it.type==='egg')add(use,'beasts','beastmastery','page','beastmastery','Beastmastery',U.activityIcon('beastmastery'));
 if((D.FIELD_TRAPS||[]).some(t=>t.id===id))add(use,'field','hunting','page','hunting','Hunting',U.activityIcon('hunting'));
 if(Object.values(D.BEAST_TRAPS||{}).some(t=>t.item===id))add(use,'beasts','beastmastery','page','beastmastery','Beastmastery',U.activityIcon('beastmastery'));
 if(Q.sellable(id))add(use,'sell','shop','sell',id,'Sell in the shop',ico('shop'));
 if(it.slot)add(use,'gear','character','page','character','Equipment',ico('bag'));
 for(const x of Q.usesOf(id)){const a=x.go,page=({project:'projects',quest:'quests',research:'research',boat:'carpentry',farm:'farming'})[x.k]||a?.a;if(a&&!use.some(r=>r.page===page))add(use,page,page,a.do==='openproject'?'project':'page',a.a,a.label,U.activityIcon(page));}
 if(Q.recoveryOffers?.().includes(id))add(get,'recovery','shop','recovery',id,'Buy back',ico('bag'));
 return {get,use};
};
const itemArt=Q.itemIco;Q.itemIco=it=>{const h=itemArt(it);return it?h.replace('<img ',`<img data-tip="item:${it.id}" `):h;};
const prepare=Q.prepareTips;Q.prepareTips=root=>{root?.querySelectorAll('[data-tip^="item:"]').forEach(e=>{if(e.closest('.blackout,.sil,.choice-art:has(.blackout)'))return;const b=e.closest('button');if(b&&!b.dataset.tip)b.dataset.tip=e.dataset.tip;});prepare?.(root);};
U.unlockCompactLabel=r=>{const[k,a]=r.stat.split(':');return r.item?D.ITEMS[r.item].name:k==='hero'?'Hero level':k==='combat'?'Combat level':k==='skill'?D.SK[a].name:k==='visit'?D.TOWN[a].name:k==='tool'?D.ITEMS['tool_'+Q.toolKey(a)+'_1'].name:({craft:'Items crafted',smith:'Items smithed',harvest:'Crops harvested',kill:'Victories',catch:'Fish caught',chop:'Gathering actions',beasts:'Creatures studied'})[k]||Q.reqLabel(r);};
const old=Q.tips.item;
Q.tips.item=id=>{
 const raw=old(id);if(!raw)return raw;const t=document.createElement('template');t.innerHTML=raw;
 for(const e of t.content.querySelectorAll('.tt-k')){if(e.nextElementSibling?.matches('.tt-list'))e.nextElementSibling.remove();e.remove();}
 t.content.querySelectorAll('.uses,.item-uses,.item-purpose').forEach(e=>e.remove());
 const routes=Q.itemNavigation(id),row=(key,title)=>`<section class="item-route-section"><div class="tt-k">${title}</div><div class="item-route-icons">${routes[key].map((r,i)=>`<span class="item-route-icon" role="img" aria-label="${esc(r.label)}" title="${esc(r.label)}">${r.pic}</span>`).join('')||`<span class="item-route-none" role="img" aria-label="${key==='get'?'No direct source recorded':'No further use recorded'}" title="${key==='get'?'No direct source recorded':'No further use recorded'}">${ico('lock')}</span>`}</div></section>`;
 return t.innerHTML+row('get','How to get it')+row('use',"Where it’s used");
};
U.DO.itemnav=(id,index)=>{
 const [side,i]=index.split(':'),r=Q.itemNavigation(id)[side]?.[+i];if(!r)return;Q.hideTip();
 if(r.kind==='recipe'){const recipe=D.RECIPES[r.target];U.routeSource={kind:'recipe',id:r.target,page:r.page,skill:recipe.skill,town:recipe.town,item:id};return U.DO.userecipe(r.target);}
 if(r.kind==='node'){const n=D.NODE[r.target];U.routeSource={kind:n.kind,id:n.id,page:r.page,skill:n.skill,town:n.town,item:id};U.returnTo={page:U.view,label:Q.cap(U.view)};return U.focusTask(D.SK[n.skill].page,n.id,null,n.skill);}
 if(r.kind==='creature')return U.DO.guide(r.target);
 if(r.kind==='quest')return U.DO.openquest(r.target);
 if(r.kind==='project')return U.DO.openproject(r.target);
 if(r.kind==='recovery')return U.DO.shoprecovery();
 if(r.kind==='shop'){const towns=Object.keys(D.SHOPS).filter(t=>D.SHOPS[t].includes(id));U.routeSource={kind:'shop',page:'shop',item:id,town:towns.includes(Q.S.town)?Q.S.town:towns[0]};U.skillCommissionSelected=null;U.shopSeedsOnly=false;U.shopTab='buy';U.shopSelected.buy=id;U.routeShopItem=id;return U.view==='shop'?U.render(false):Q.go('shop');}
 if(r.kind==='sell'){U.shopTab='sell';U.shopSelected.sell=id;return U.view==='shop'?U.render(false):Q.go('shop');}
 if(r.kind==='rare'){const towns=Object.keys(D.TOWN_RARE_GEAR).filter(t=>(D.TOWN_RARE_GEAR[t]||[]).includes(id)||(D.TOWN_SPECIALS[t]||[]).includes(id));if(!towns.includes(Q.S.town)){U.tab.mapTown=towns[0];return Q.go('map');}U.shopTab='rare';U.tab.rareChoice=(Object.values(D.TOWN_RARE_GEAR).some(s=>s.includes(id))?'gear:':'mat:')+id;return U.view==='shop'?U.render(false):Q.go('shop');}
 if(r.kind==='research'){U.tab.researchChoice=r.target;return Q.go('research');}
 if(r.kind==='tower'){if(r.target===Q.S.town)return Q.go('tower');U.tab.mapTown=r.target;return Q.go('map');}
 Q.go(r.page);
};
})();
