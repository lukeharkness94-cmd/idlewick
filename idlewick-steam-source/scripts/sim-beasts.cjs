/* Empirical DPS evidence: real combat rounds, default melee ability, seeded RNG, fixed progression per trial.
   Bond-10 support is measured separately from hero damage; artificial high-HP dummy prevents overkill bias. */
const {beasts}=require('../tests/beast-harness.cjs');const assert=require('node:assert/strict');const rows=[];
for(const hero of [15,20,25,30])for(const id of ['bond_wolf','bond_boar','bond_owl','bond_bear']){
 const {q}=beasts(),D=q.data,S=q.S;S.unlocked.beastmastery=true;let lv=1;
 while(lv<30&&3*D.XPF[lv+1]+Math.max(0,D.XPF[lv+1]-D.XPF[10])<D.advReq(hero)*.65)lv++;
 for(const sk of ['attack','strength','defence'])S.xp[sk]=D.XPF[lv];S.xp.hitpoints=D.XPF[Math.max(10,lv)];S.xp.fishing=Math.max(0,D.advReq(hero)-q.totalXp());
 S.equip={weapon:lv>=10?'iron_sword':'bronze_sword',body:lv>=10?'iron_body':'bronze_body',head:lv>=10?'iron_helm':'bronze_helm',legs:lv>=10?'iron_legs':'bronze_legs',shield:lv>=10?'iron_shield':'bronze_shield'};
 S.inv.bread=100000;S.pets.owned[id]={bondXp:8000,evolved:true,trainingUntil:0};q.setPet(id);S.hp=q.maxHp();S.abilities=['power','brace'];S.settings.autoAbil=false;q.fxDirty();
 const m=D.MON.goblin;m.hp=1e8;m.def=lv;m.att=0;m.str=0;m.max=0;
 let damage=0;q.addXp=(sk,base)=>{if(['attack','strength','defence'].includes(sk))damage+=base/4;return base;};
 assert.ok(q.startAct('fight','goblin',{quiet:true}));const interval=q.combatInterval();q.simulate(30*60000);const beast=q.fight?.beastDamage||0,ratio=beast/damage;
 rows.push({hero:q.advLvl(),melee:lv,species:id,heroDamage:+damage.toFixed(2),beastDamage:+beast.toFixed(2),contributionPct:+(ratio*100).toFixed(2)});
}
console.table(rows);if(!rows.every(r=>r.contributionPct>=15&&r.contributionPct<=20))process.exitCode=1;
if(process.env.EVIDENCE){require('node:fs').writeFileSync(process.env.EVIDENCE,JSON.stringify({assumptions:'Seeded 30-minute real engine trials; fixed XP, appropriate bronze/iron gear, Power Strike and Brace, ordinary equal-defence target with inflated HP to remove overkill. No boss resistances or uniques. This is support DPS / hero DPS, not percentage of combined DPS.',rows},null,2));}
