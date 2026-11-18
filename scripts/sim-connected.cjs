/* Seeded comparison, not normal progression: region gear/food, tower boss, alternative preparation profiles. */
const {setup}=require('../tests/connected-harness.cjs'),fs=require('node:fs');
function trial(town,mode){const {q}=setup(),D=q.data,T=D.TOWERS[town],m=D.MON[T.floors[4]],S=q.S;
 S.settings.notify=false;S.inv={};S.town=town;for(const t of D.TOWNS)S.towns[t.id]={visited:true,boss:false};S.towers={[town]:4};
 let lv=10;for(;lv<99;lv++){for(const k of ['melee','defence','hitpoints'])S.xp[k]=D.XPF[lv];if(q.combatLvl()>=T.rec)break;}
 for(const k of ['magic','ranged'])S.xp[k]=D.XPF[Math.min(99,lv)];S.unlocked.magic=true;S.unlocked.ranged=true;q.fxDirty();
 const gear=D.TOWN_GEAR[town]||[],best={};
 for(const id of gear){const it=D.ITEMS[id];if(!it?.slot||it.slot==='ammo'||it.style&&it.style!=='melee')continue;S.inv[id]=1;if(!q.canEquip(id).ok)continue;const b=it.b||{},score=(b.def||0)+(b.atk||0)+(b.str||0);if(!best[it.slot]||score>best[it.slot].score)best[it.slot]={id,score};}
 for(const {id}of Object.values(best))q.equipItem(id);
 if(mode==='counter'){const weak=D.WEAK[m.id].weak,weapon=gear.filter(id=>D.ITEMS[id]?.slot==='weapon'&&q.canEquip(id).ok).find(id=>weak.includes(D.WTYPES[D.ITEMS[id].wtype||'sword']?.dtype));if(weapon){S.inv[weapon]=1;q.equipItem(weapon);}}
 const food=D.FISH_IDS.filter(id=>D.ITEMS[id]?.heal).filter(id=>{const r=Object.values(D.RECIPES).find(r=>r.out[id]);return r&&r.lvl<=lv;}).sort((a,b)=>D.ITEMS[b].heal-D.ITEMS[a].heal)[0]||'shrimp';
 S.inv[food]=mode==='packed'?30:15;S.abilities=mode==='unprepared'?['power']:['power','brace'];S.settings.autoAbil=false;
 if(mode==='guard'){S.pets.owned.bond_bear={bondXp:8000};q.setPet('bond_bear');}
 if(mode==='striker'){S.pets.owned.bond_wolf={bondXp:8000};q.setPet('bond_wolf');}
 if(mode==='broth'){S.buffs=[{type:'guard',mult:.85,until:3e8,name:'Stonebread'}];}
 if(mode==='legacy'){m.attackMs=2000;Object.assign(m.mini.special,{every:3,mult:1.5,freeze:0,hex:0,frostMult:1,rangedMult:1});D.WEAK[m.id]={weak:[],resist:[]};}
 S.hp=q.maxHp();q.fxDirty();const results=Array.from({length:3},()=>q.forecast(m.id));return {combat:q.combatLvl(),wins:results.reduce((n,r)=>n+r.wins,0),trials:72,mealsPerWin:results.reduce((n,r)=>n+r.eaten,0)/Math.max(1,results.reduce((n,r)=>n+r.wins,0)),food,weapon:S.equip.weapon};
}
const rows=[];for(const town of ['willowbrook','mossbarrow','saltmere','ironpeak','gloomfen','emberfall','skyreach','hollow']){const row={town};for(const mode of ['legacy','unprepared','brace','guard','striker','broth','counter','packed'])row[mode]=trial(town,mode);rows.push(row);console.log(town,Object.fromEntries(Object.entries(row).filter(([k])=>k!=='town').map(([k,v])=>[k,`${Math.round(v.wins/v.trials*100)}% / ${v.mealsPerWin.toFixed(1)} meals/win`])));}
const {q}=setup(),D=q.data,p=D.POTION_RECIPES.find(r=>r.id==='potion_fortune'),materials=Object.entries(p.in).reduce((n,[id,c])=>n+D.ITEMS[id].val*c,0);
const fortune={before:{minutes:30,coins:500,materialSaleValue:materials},after:{bottles:p.yield,minutes:p.yield*D.ITEMS.potion_fortune.drink.mins,coins:p.coins,materialSaleValue:materials},research:{coins:D.TECH.fortune.cost.coins,materials:D.TECH.fortune.cost,minutes:D.TECH.fortune.mins},tonic:{mossbarrowPrice:q.tonicPrice('mossbarrow'),minutes:30,onePerGameHours:6}};
fs.writeFileSync('docs/connected-balance.json',JSON.stringify({assumptions:'Seeded region gear, recommended combat target before ranged/magic XP, fifteen best unlocked meals (thirty in packed), 72 deterministic trials per profile. No claim of normal progression or human testing. Profiles are independent, not additive.',fortune,towers:rows},null,2)+'\n');console.log('Fortune',fortune);
