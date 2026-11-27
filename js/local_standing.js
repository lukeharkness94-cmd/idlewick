/* Local standing is derived, never spent. Old completed-project bonuses are grandfathered once. */
(() => {
const Q=window.DQ,D=Q.data,UI=Q.ui,S=()=>Q.S,{esc,fmt}=Q;
Q.migrateRestoration=st=>{
 if(st.restorationVersion===1)return;
 if(st.restorationVersion!==undefined&&st.restorationVersion!==0)throw new Error('Unsupported restoration version');
 st.legacyRestoration=Object.fromEntries(Object.entries(st.projects||{}).filter(([id,done])=>done&&D.PROJECTS[id]&&!D.PROJECTS[id].relic).map(([id])=>[id,true]));
 st.restorationVersion=1;
};
Q.projectBenefitActive=id=>!!S().projects[id]&&(!D.PROJECTS[id]||D.PROJECTS[id].relic||!!S().legacyRestoration?.[id]);
Q.localStanding=(town=S().town)=>Object.entries(D.PROJECTS).filter(([id,p])=>p.town===town&&!p.relic&&S().projects[id]).length*10;
const stock={
 well:['potion_heal'],inn:['shrimp','bread'],forge:['bar_bronze'],garden:['seed_onion','feed'],library:['feather','rune'],watchtower:['arrow_bronze'],
 market:['wool'],moss_pond:['raw_carp'],moss_tannery:['cowhide','wolf_pelt'],moss_hall:['bread','milk'],moss_windmill:['crop_wheat','bread'],moss_granary:['seed_wheat','feed'],
 jetty:['raw_herring','log_palm'],/* palm logs (owner, 26 Nov 2026): a combat-trained hero can still rebuild the smokehouse */salt_smokehouse:['herring','sardine'],salt_nets:['string'],salt_lighthouse:['rune'],salt_saltpans:['raw_mackerel'],salt_boathouse:['cloth','plank_oak'],
 hearth:['bread'],iron_smelter:['bar_iron','ore_coal'],iron_lift:['ore_iron'],iron_furstore:['frost_pelt'],iron_assay:['ore_silver'],iron_gate:['bar_steel'],
 lanterns:['rune'],fen_boardwalk:['plank_maple'],fen_herbary:['crop_goldleaf','crop_cabbage'],fen_stilthouse:['bread'],fen_eelweir:['raw_catfish'],fen_shrine:['rune'],
 cistern:['bread'],ember_kiln:['ore_obsidian'],ember_armoury:['bar_mithril'],ember_baths:['crop_onion'],ember_ward:['rune'],ember_forge:['ore_coal','bar_steel'],
 bridge:['cloth'],sky_windchimes:['ore_skyglass'],sky_terraces:['crop_sunbloom'],sky_scriptorium:['feather','rune'],sky_eyrie:['feed'],sky_bell:['gem_sapphire'],
 refuge:['bread'],hollow_camp:['cloth'],hollow_watch:['rune'],hollow_archive:['feather'],hollow_garden:['crop_moonmelon'],hollow_throne:['ore_voidstone']
};
D.LOCAL_SUPPLIES=[];
for(const town of D.TOWNS){let rank=0;for(const [id,p]of Object.entries(D.PROJECTS).filter(([,p])=>p.town===town.id&&!p.relic)){
 p.legacyReward=p.reward;const items=(stock[id]||Object.keys(p.cost).filter(k=>k!=='coins').slice(0,1)).filter(k=>D.ITEMS[k]);
 const standing=[10,10,20,20,30,30][rank++]||30;
 for(const item of items)D.LOCAL_SUPPLIES.push({id:id+':'+item,project:id,town:town.id,item,standing,price:Math.max(4,Math.ceil(D.ITEMS[item].val*(D.ITEMS[item].heal||D.ITEMS[item].drink?.heal?4:2.5))),carry:D.ITEMS[item].drink?.heal?3:D.ITEMS[item].heal?12:null});
 p.reward=`+10 local standing. Supplies at the ${town.name} shop: ${items.map(k=>D.ITEMS[k].name.toLowerCase()).join(', ')} (${standing} standing and this building restored).`;
}}
/* the reason names the actual step (27 Nov 2026 audit: cards said "Requirements unmet", which the rules ban) */
Q.localSupplyReason=o=>!o||o.town!==S().town?'Visit this town first':!S().projects[o.project]?`${D.PROJECTS[o.project].name} first`:S().damaged?.[o.project]?'Repair this building first':Q.localStanding(o.town)<o.standing?`Local standing ${Q.localStanding(o.town)}/${o.standing}`:'';
Q.localSupplyPrice=o=>Math.max(1,Math.ceil(o.price*(1-(Q.thiefLvl?Q.thiefLvl():0)*.0015)));
Q.buyLocalSupply=(key,n=1)=>{
 const o=D.LOCAL_SUPPLIES.find(o=>o.id===key);if(!o||Q.localSupplyReason(o)||!Number.isSafeInteger(n)||n<1||n>10000)return false;
 if(o.carry&&Q.have(o.item)+n>o.carry)return false;
 const cost=Q.localSupplyPrice(o)*n;if(S().coins<cost)return false;
 const before=JSON.parse(JSON.stringify(S()));S().coins-=cost;Q.give(o.item,n);S().stats.bought+=n;
 if(!Q.save()){Q.S=before;Q.fxDirty();Q.invDirty=true;return false;}Q.sfx('buy');Q.emit('shop');return true;
};
const brew0=Q.brew;Q.brew=id=>{const before=JSON.parse(JSON.stringify(S())),ok=brew0(id);if(!ok)return ok;if(!Q.save()){Q.S=before;Q.fxDirty();Q.invDirty=true;return false;}return true;};
Q.projectLegacyText=id=>S().legacyRestoration?.[id]?`Kept from your earlier restoration: ${D.PROJECTS[id].legacyReward}`:'';
const tabs0=UI.shopTabs;UI.shopTabs=tab=>tabs0(tab).replace('</div>',`<button class="tab ${tab==='local'?'on':''}" data-do="shoptab" data-a="local">Local supplies · ${Q.localStanding()}</button></div>`);
const shop0=UI.V.shop;
UI.V.shop=()=>{
 if(UI.shopTab!=='local')return shop0();
 const offers=D.LOCAL_SUPPLIES.filter(o=>o.town===S().town),o=offers.find(o=>o.id===UI.localSupply)||offers[0];if(!o)return shop0();
 const it=D.ITEMS[o.item],why=Q.localSupplyReason(o),n=[1,5,10].includes(UI.localQty)?UI.localQty:1,cost=Q.localSupplyPrice(o)*n,carry=o.carry&&Q.have(o.item)+n>o.carry,available=!why&&!carry&&S().coins>=cost;
 return `<div class="visual-shop"><section class="panel shop-stock local-stock"><div class="phead"><h2>${esc(D.TOWN[S().town].name)} supplies</h2><small>Standing ${Q.localStanding()}</small></div>${UI.shopTabs('local')}<div class="illustrated-choices">${offers.map(x=>`<button class="illustrated-card ${x.id===o.id?'selected':''}" data-do="localpick" data-a="${x.id}" aria-pressed="${x.id===o.id}"><span class="choice-art">${Q.itemIco(D.ITEMS[x.item])}</span><b>${esc(D.ITEMS[x.item].name)}</b><small>${x.standing} standing · ${esc(D.PROJECTS[x.project].name)}</small><span class="choice-state">${esc(Q.localSupplyReason(x)||'Available · '+fmt(Q.localSupplyPrice(x))+' coins')}</span></button>`).join('')}</div></section><section class="panel shop-task"><h2>${esc(it.name)}</h2><div class="local-picture">${Q.itemIco(it)}</div><p>${esc(D.PROJECTS[o.project].story)}</p><p class="${why?'warn':'ok'}">${Q.localStanding()>=o.standing?'✓':'◇'} Standing ${Q.localStanding()} / ${o.standing}<br>${S().projects[o.project]?'✓':'◇'} ${esc(D.PROJECTS[o.project].name)}${S().damaged?.[o.project]?' · needs repair':''}</p>${!S().projects[o.project]||S().damaged?.[o.project]?`<button class="btn" data-do="openproject" data-a="${o.project}">Open building</button>`:''}<p>${o.carry?`Emergency reserve: carry up to ${o.carry}. ${it.drink?.heal?'Brew or discover a recipe for sustained supply.':'Cook for longer expeditions.'}`:'Local ingredients for your own crafting. No stock timer or daily visit required.'}</p><div class="btnrow">${[1,5,10].map(v=>`<button class="btn ${n===v?'on':''}" data-do="localqty" data-a="${v}">${v}</button>`).join('')}</div><button class="btn primary" data-do="localbuy" data-a="${o.id}" data-b="${n}" ${available?'':'disabled'}>${why?esc(why):carry?'Food reserve full':`Buy ${n} · ${fmt(cost)} coins`}</button><small>${Q.have(o.item)} held</small></section></div>`;
};
Object.assign(UI.DO,{localpick:id=>{UI.localSupply=id;UI.render(false);},localqty:n=>{UI.localQty=+n;UI.render(false);},localbuy:(id,n)=>{const ok=Q.buyLocalSupply(id,+n);if(!ok&&Q.saveHealth)Q.toast(Q.saveHealth,true);UI.render(false);},projectshop:id=>{const o=D.LOCAL_SUPPLIES.find(o=>o.project===id);if(o){UI.shopTab='local';UI.localSupply=o.id;Q.go('shop');}}});
const projects0=UI.projectsPanel;UI.projectsPanel=()=>{
 const h=projects0(),id=UI.tab.projectChoice,p=D.PROJECTS[id];if(!p||p.relic)return h;
 const legacy=Q.projectLegacyText(id),line=`<div class="local-project-payoff"><span class="tag">Local standing ${Q.localStanding(p.town)}${S().projects[id]?'':' → '+(Q.localStanding(p.town)+10)}</span><button class="btn sm" data-do="projectshop" data-a="${id}">Preview local supplies</button>${legacy?`<small>${esc(legacy)}</small>`:''}</div>`;
 return h.replace('<p class="proj-benefit">',line+'<p class="proj-benefit">');
};
})();
