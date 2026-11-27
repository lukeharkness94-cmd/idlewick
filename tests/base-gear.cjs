const assert=require('node:assert/strict'),{setup}=require('./hunting-loop.cjs');
const{q}=setup(),D=q.data;
for(const [kit,style]of [['sword','melee'],['bow','ranged'],['staff','magic']]){
 q.S=q.newState('Starter',undefined,kit);q.fxDirty();assert.equal(q.weaponStyle(),style);assert.equal(q.skillUnlocked(style),true);
 if(kit==='bow'){assert.equal(q.S.ammo.id,'arrow_bronze');assert.equal(q.S.ammo.n,300);}if(kit==='staff')assert.equal(q.have('rune'),300);
 q.startAct('fight','chicken',{quiet:true});assert.ok(q.act,'starter '+kit+' can fight');q.simulate(5000);q.stopAct(true);
 if(kit==='bow')assert.ok(q.S.ammo.n<300);if(kit==='staff')assert.ok(q.have('rune')<300);
 const round=q.validateSave(JSON.parse(JSON.stringify(q.S)));assert.equal(round.equip.weapon,D.STARTER_KITS[kit].weapon);
}
q.S=q.newState();q.fxDirty();
for(const[key,sk]of D.TOOLS){assert.equal(D.TOOL_ORDER.length,10);let speed=0;for(const t of D.TOOL_ORDER){const id=`tool_${key}_${t}`,r=D.RECIPES['smith_'+id];assert.ok(r&&r.skill==='smithing');assert.ok(D.TOOL_SPEED[t]>speed);speed=D.TOOL_SPEED[t];/* every tier is its own mined material (20 Nov): a bar smelted from ore, or the ore itself */const metal=Object.keys(r.in).filter(k=>k.startsWith('bar_')||k.startsWith('ore_'));assert.ok(metal.length>=1,'mined material in '+id);for(const bar of metal.filter(k=>k.startsWith('bar_'))){const smelt=Object.values(D.RECIPES).find(r=>r.out[bar]);assert.ok(Object.keys(smelt.in).every(k=>k.startsWith('ore_')));}const inputValue=Object.entries(r.in).reduce((n,[k,v])=>n+D.ITEMS[k].val*v,0);assert.ok(D.ITEMS[id].val<=inputValue,'no tool sell loop '+id);}assert.equal(speed,.45);}
assert.equal(D.WEAPON_BRIDGES.length,35);
for(const id of D.WEAPON_BRIDGES){const it=D.ITEMS[id],r=Object.values(D.RECIPES).find(r=>r.out[id]);assert.ok(r);assert.ok(Object.keys(r.in).some(k=>k.startsWith('bar_')));assert.match(it.name,/bronze|iron|steel|mithril|adamant|runite|rune/i);assert.ok(Object.values(D.SHOPS).some(stock=>stock.includes(id)));}
for(const id of ['tool_rod_1.5','tool_gloves_1','fine_sword_15','fine_bow_15','fine_staff_15']){q.S=q.newState();q.S.unlocked.smithing=q.S.unlocked.crafting=true;q.S.xp.smithing=q.S.xp.crafting=D.XPF[99];const r=Object.values(D.RECIPES).find(r=>r.out[id]);for(const[k,n]of Object.entries(r.in))q.give(k,n);assert.ok(q.startAct('recipe',r.id,{quiet:true}),id);q.simulate(5000);q.stopAct(true);assert.ok(q.have(id)>0,id+' produced');if(D.ITEMS[id].toolSkill){const before=q.toolTier(D.ITEMS[id].toolSkill);q.take(id,q.have(id));q.S=q.validateSave(JSON.parse(JSON.stringify(q.S)));assert.equal(q.toolTier(D.ITEMS[id].toolSkill),before);}}
q.S=q.newState();q.S.towns.saltmere={boss:true};q.S.town='saltmere';assert.ok(!q.rareOffers().gear.some(g=>D.ITEMS[g.id].slot==='weapon'));
console.log('PASS all three supplied starter kits fight/save; 50 smithable ore-backed tools, 35 weapon bridges, real production, permanent fractional-tier ownership and earned-only named weapons');
