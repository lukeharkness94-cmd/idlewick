const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('fs');
(async()=>{const browser=await chromium.launch({...(fs.existsSync('/usr/bin/chromium')?{executablePath:process.env.CHROMIUM_PATH||undefined}:{}),args:['--no-sandbox']});try{
const p=await browser.newPage({viewport:{width:1440,height:900}}),errors=[];p.on('pageerror',e=>errors.push(e.message));
await p.goto(process.env.IDLEWICK_URL||'http://127.0.0.1:8765/Play%20Idlewick.html');await p.locator('#t-new').click();await p.locator('#cr-go').click();await p.waitForTimeout(700);
const checks=await p.evaluate(()=>{
const Q=DQ,D=Q.data,U=Q.ui;Q.paused=true;Q.S.settings.notify=false;Q.S.settings.storyScenes=false;Q.S.tut.hidden=true;for(const id of Object.keys(Q.skillLessons))Q.S.tut.done['lesson:'+id]=true;for(let i=0;i<20;i++)Q.closeModal();
const out=[];const check=(yes,label)=>{if(!yes)throw Error(label);out.push(label);};
check(['shop','fight'].includes(Q.sourceOf('feather').kind),'Uncharted feathers have a direct source, not their own survey');
check(Q.sourceOf('rune').kind==='shop','A beginner can obtain runes without first unlocking Crafting');
check(Q.ingredientDiscovery('rune').label.startsWith('Shop'),'Ingredient hint agrees with the available source');
const before=JSON.stringify([Q.S.coins,Q.S.inv,Q.S.bank]);U.DO.route('rune');check(U.view==='shop'&&U.shopSelected.buy==='rune','Rune route selects actual shop stock');check(JSON.stringify([Q.S.coins,Q.S.inv,Q.S.bank])===before&&!Q.act,'Supply navigation does not start or spend');
Q.S.q.first_steps={s:'done',p:[5,5]};Q.S.q.goblin_menace={s:'done',p:[6]};Q.S.q.hungry_cook={s:'done',p:[8]};Q.S.equip.weapon='staff_normal';Q.S.inv.rune=0;Q.S.bank.rune=0;Q.S.coins=1000;
let step=Q.combatSupplyStep();check(step.action==='journeysupply'&&step.a==='rune'&&+step.b===100,'Empty staff supplies produce an affordable restock');
U.DO.journeysupply(step.a,step.b);check(U.shopTab==='buy'&&U.shopSelected.buy==='rune'&&U.shopQty===100,'Restock opens the exact item and quantity');
Q.S.inv.rune=7;Q.S.coins=6;check(Q.combatSupplyStep()===null,'Low money does not prevent using remaining runes');Q.S.inv.rune=0;Q.S.coins=0;check(['journeysell','qstart','huntquest','journeytask'].includes(Q.combatSupplyStep().action),'An empty purse gives a supply or funding route');
Q.S.equip.weapon='bow_normal';Q.S.ammo={id:'arrow_bronze',n:0};Q.S.coins=1000;step=Q.combatSupplyStep();check(step.a==='arrow_bronze','Bow guidance names the actual ammunition');
const plan=Q.purchasePlan(['bronze_hammer']);check(!plan.ready&&plan.missing.some(x=>x.id==='bar_bronze'),'A full purse alone cannot afford a material-gated weapon');
Q.S.equip.weapon='bronze_dagger';Q.give('bronze_hammer',1);const tips=Q.prepAdvice('grubnash');check(tips.some(t=>t.key==='weak'&&t.action==='equip'&&t.a==='bronze_hammer'),'An owned counter remains a preparation option');check(!tips.some(t=>t.preparing&&t.afford),'Missing materials never claim affordability');
Q.S.towns.willowbrook.boss=true;Q.S.towns.mossbarrow={visited:true,boss:false};Q.S.town='mossbarrow';Q.S.xp.melee=D.XPF[20];Q.S.xp.hitpoints=D.XPF[20];Q.S.xp.defence=D.XPF[20];Q.S.q.chiefs_end={s:'done',p:[1]};
step=Q.regionNext();for(let i=0;i<8&&step.action==='equip';i++){Q.equipItem(step.a);step=Q.regionNext();}check(step.action==='qstart'&&step.a==='boar_hunt','Entering Mossbarrow introduces the boss prerequisite quest');Q.startQuest('boar_hunt');Q.give('bread',50);step=Q.regionNext();check(step.action==='huntquest'&&step.a==='boar','Regional guidance advances the active story objective');Q.S.q.boar_hunt={s:'ready',p:[10,6]};check(Q.regionNext().a==='boar_hunt'&&Q.regionNext().action==='qclaim','Completed preparation has a clear reward claim');Q.S.q.boar_hunt.s='done';check(Q.regionNext().a==='king_of_the_wood','Boss quest follows the completed prerequisite');
// Scan every declared item source in the complete build, then repeat with learned/visited progression.
let count=0;for(const id of Object.keys(D.ITEMS)){Q.sourceOf(id);Q.ingredientDiscovery(id);count++;}
for(const t of D.TOWNS)Q.S.towns[t.id]={visited:true,boss:false};for(const s of D.SKILLS){Q.S.unlocked[s.id]=true;Q.S.xp[s.id]=D.XPF[99];}
for(const id of Object.keys(D.ITEMS)){Q.sourceOf(id);Q.ingredientDiscovery(id);}
Q.give('ore_quartz',4);Q.give('log_normal',4);check(Q.ingredientDiscovery('crop_pumpkin').level===D.CROP.pumpkin.lvl,'Farm ingredient hints retain actual crop levels');check(Q.sourceOf('rune').kind==='recipe','A trained crafter is offered self-supply rather than forced shopping');
return {checks:out,itemsScanned:count,skills:D.SKILLS.length,quests:D.QUESTS.length};
});
assert.deepEqual(errors,[]);console.log(JSON.stringify(checks,null,2));
if(process.env.SCREENSHOTS){fs.mkdirSync(process.env.SCREENSHOTS,{recursive:true});await p.evaluate(()=>{DQ.S=DQ.newState();DQ.S.settings.notify=false;DQ.S.settings.storyScenes=false;DQ.S.tut.hidden=true;for(const id of Object.keys(DQ.skillLessons))DQ.S.tut.done['lesson:'+id]=true;DQ.S.q.first_steps={s:'done',p:[5,5]};DQ.S.q.goblin_menace={s:'done',p:[6]};DQ.S.q.hungry_cook={s:'done',p:[8]};DQ.S.equip.weapon='bow_normal';DQ.S.ammo={id:'arrow_bronze',n:0};DQ.S.coins=250;DQ.fxDirty();DQ.go('overview');DQ.ui.renderHud();DQ.ui.renderRail();DQ.ui.render(true);});await p.waitForTimeout(350);await p.screenshot({path:process.env.SCREENSHOTS+'/opening-ammunition-route.png'});await p.evaluate(()=>{DQ.S.towns.willowbrook.boss=true;DQ.S.towns.mossbarrow={visited:true,boss:false};DQ.S.town='mossbarrow';DQ.S.q.chiefs_end={s:'done',p:[1]};DQ.S.xp.melee=DQ.data.XPF[15];DQ.S.xp.hitpoints=DQ.data.XPF[15];DQ.S.xp.defence=DQ.data.XPF[15];DQ.S.equip.weapon='bronze_sword';DQ.fxDirty();DQ.go('overview');DQ.ui.renderHud();DQ.ui.renderRail();DQ.ui.render(true);});await p.waitForTimeout(350);await p.screenshot({path:process.env.SCREENSHOTS+'/opening-regional-story.png'});}
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exit(1)});
