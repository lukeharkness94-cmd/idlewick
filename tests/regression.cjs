/* node tests/regression.cjs — deterministic engine and persistence regression checks. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const { harness } = require('./engine-harness.cjs');
const encode = state => Buffer.from(JSON.stringify(state)).toString('base64');
let tests = 0;
function test(name, run) { run(); tests++; console.log('PASS', name); }
test('gather catalogue exposes future regions while keeping their actions gated', () => {
  const {q,load}=harness();
  q.ico=()=>'';q.itemIco=()=>'';q.artImage=()=>'';
  load('ui_core');q.ui.skillHero=()=>'';q.ui.toolLine=()=>'';
  const before=JSON.stringify(q.S);
  let html=q.ui.V.gather('fishing');
  for(const fish of q.data.NODES.fish)assert.ok(html.includes(`data-do="taskselect" data-a="fish" data-b="${fish.id}"`),fish.name+' must be inspectable');
  q.ui.taskChoice.fishing='voideel';html=q.ui.V.gather('fishing');
  assert.match(html,/data-do="act" data-a="fish" data-b="voideel" disabled/);
  assert.match(html,/Requires Fishing 95/);assert.match(html,/to open The Hollow Crown/);
  assert.equal(JSON.stringify(q.S),before,'Previewing must not change progression');
  q.ui.taskChoice.fishing='shrimp';html=q.ui.V.gather('fishing');
  assert.doesNotMatch(html,/data-do="act" data-a="fish" data-b="shrimp" disabled/);
});
test('desktop save bridge preserves save semantics without silently falling back to browser storage', () => {
  const files=new Map(),desktop={getItem:key=>files.get(key)||null,setItem:(key,value)=>files.set(key,value),removeItem:key=>files.delete(key)};
  const {q,storage}=harness(desktop);assert.ok(q.save());assert.ok(q.hasSave());assert.equal(storage.size,0);assert.equal(files.size,1);
  const before=q.exportSave();desktop.setItem=()=>{throw Error('disk full');};
  assert.equal(q.save(),false);assert.equal(storage.size,0);assert.equal(q.exportSave(),before);
});
test('invalid import leaves live and persisted state unchanged', () => {
  const {q, storage} = harness(); q.save(); const before = q.exportSave(), persisted = [...storage.entries()];
  assert.equal(q.importSave(encode({v:2,xp:{},name:'Corrupt',farm:null})),false);
  assert.equal(q.exportSave(), before); assert.deepEqual([...storage.entries()], persisted);
});
test('negative values and prototype keys are rejected', () => {
  const {q} = harness();
  assert.equal(q.importSave(encode({v:2,xp:{fishing:-1},coins:-2})),false);
  assert.equal(q.importSave(Buffer.from('{"v":2,"xp":{},"__proto__":{"polluted":true}}').toString('base64')),false);
});
test('legacy state gains new fields and round-trips', () => {
  const {q} = harness(); const old = q.newState(); delete old.projects; delete old.journey;
  assert.equal(q.importSave(encode(old)),true); assert.equal(q.S.journey,'boss'); assert.deepEqual(Object.keys(q.S.projects),[]);
  assert.equal(q.importSave(q.exportSave()),true);
});
test('failed storage writes do not commit imported state', () => {
  const {q, deny} = harness(); const before=q.S; deny(true);
  assert.equal(q.importSave(encode(q.newState('Replacement'))),false); assert.equal(q.S,before);
  assert.equal(q.save(),false); assert.match(q.saveHealth,/could not be saved/);
});
test('another writer pauses before overwriting', () => {
  const {q,storage}=harness(); assert.equal(q.save(),true);
  storage.set('dashboard-quest-save-v2','different');
  assert.equal(q.save(),false); assert.equal(q.paused,true);
  assert.equal(storage.get('dashboard-quest-save-v2'),'different');
});
test('mixed duration queue respects its time budget and preserves remainder', () => {
  const {q}=harness(); q.S.xp.fishing=q.data.advReq(8); q.startAct('fish','shrimp',{quiet:true,rule:'count:1'}); q.queueAdd('wood','normal','none');
  q.simulate(60000);
  assert.equal(q.S.gameTime,60000); assert.equal(q.act.kind,'wood');
  // Count rules count successful catches, so use actual elapsed work for the first task.
  assert.ok(q.act.elapsed + q.act.progress <= 60000);
  assert.ok(q.act.progress >= 0 && q.act.progress < q.act.dur);
});
test('long and short deterministic simulations produce identical progress', () => {
  const a=harness().q,b=harness().q;
  for(const q of [a,b]) q.startAct('fish','shrimp',{quiet:true});
  a.simulate(60000); for(let i=0;i<60;i++)b.simulate(1000);
  assert.equal(a.S.xp.fishing,b.S.xp.fishing); assert.deepEqual(JSON.parse(JSON.stringify(a.S.inv)),JSON.parse(JSON.stringify(b.S.inv)));
  assert.equal(a.act.progress,b.act.progress);
});
test('research completes chronologically inside catch-up', () => {
  const a=harness().q,b=harness().q;
  for(const q of [a,b]) { q.S.research.active=[{id:'sharper1',left:30000}]; q.startAct('fish','shrimp',{quiet:true}); }
  a.simulate(60000); for(let i=0;i<60;i++)b.simulate(1000);
  assert.equal(a.S.research.done.sharper1,1); assert.equal(a.S.xp.fishing,b.S.xp.fishing); assert.equal(a.act.progress,b.act.progress);
});
test('potion expiry is consistent across long and short runs', () => {
  const a=harness().q,b=harness().q;
  for(const q of [a,b]) { q.S.buffs=[{type:'slow',mult:.85,until:30000}]; q.startAct('fish','shrimp',{quiet:true}); }
  a.simulate(60000); for(let i=0;i<60;i++)b.simulate(1000);
  assert.equal(a.S.xp.fishing,b.S.xp.fishing); assert.ok(Math.abs(a.act.progress-b.act.progress)<.01);
});
test('offline cap and taper match the player-facing promise', () => {
  const {q}=harness(); assert.equal(q.offlineEff(8*3600000),5*3600000); assert.equal(q.offlineEff(24*3600000),5*3600000);
});
test('town projects consume supplies once and grant lasting benefits', () => {
  const {q}=harness(); q.S.inv.log_normal=30; q.S.inv.shrimp=12; q.S.coins=100;
  assert.equal(q.finishProject('well'),true); assert.equal(q.S.inv.log_normal,10); assert.equal(q.fx().regen,.1);
  assert.equal(q.finishProject('well'),false); assert.equal(q.S.inv.log_normal,10);
  assert.equal(q.finishProject('inn'),true); assert.equal(q.have('shrimp'),0); assert.equal(q.fx().heal,.05);
});
test('destination follows quest, food, training and victory state', () => {
  const {q}=harness(); assert.equal(q.journeyNext().a,'first_steps');
  q.S.q.first_steps={done:true}; q.S.towns.willowbrook.boss=true;
  assert.equal(q.journeyNext().action,'journeytravel');assert.equal(q.journeyNext().a,'mossbarrow','after Grubnash the destination points to the next region');
  q.S.journey='well'; assert.equal(q.journeyNext().b,'normal');
});

test('forecast and equipment comparison preserve the real hero', () => {
  const {q}=harness(); for(const skill of ['attack','strength','defence','hitpoints'])q.S.xp[skill]=q.data.XPF[20];
  q.S.hp=12; q.S.inv.bread=50; q.S.inv.iron_sword=1; q.S.research.active=[{id:'sharper1',left:5000}];
  const before=q.exportSave();
  assert.ok(q.forecast('grubnash').trials===24);
  assert.equal(q.exportSave(),before);
  assert.ok(q.forecast('grubnash','iron_sword').trials===24);
  assert.equal(q.exportSave(),before);
});
test('queued actions conserve time across different task durations', () => {
  const a=harness().q,b=harness().q;
  for(const q of [a,b]) {q.S.xp.fishing=q.data.advReq(8);q.startAct('fish','shrimp',{quiet:true,rule:'time:0.1'});q.queueAdd('wood','normal','none');}
  a.simulate(60000);for(let i=0;i<60;i++)b.simulate(1000);
  assert.equal(a.S.xp.fishing,b.S.xp.fishing);assert.equal(a.S.xp.woodcutting,b.S.xp.woodcutting);
  assert.ok(Math.abs(a.act.progress-b.act.progress)<.01);
});
test('a stopped task does not run again without supplies', () => {
  const {q}=harness();q.S.xp.fishing=q.data.advReq(4);q.S.stats.catch=5;q.S.stats.chop=5;q.S.inv.raw_shrimp=1;
  q.startAct('recipe','cook_shrimp',{quiet:true});q.simulate(60000);
  assert.equal(q.have('raw_shrimp'),0);assert.equal(q.act,null);assert.equal(q.S.gameTime,60000);
});
test('offline rewards do not inflate live activity rates', () => {
  const {q}=harness();q.startAct('fish','shrimp',{quiet:true});q.simulate(60000);
  assert.ok(q.S.xp.fishing>0);assert.equal(Object.keys(q.hist[0]).length,0);
});
test('visual particle motion is independent of monitor refresh rate', () => {
  const {q,load}=harness();load('fx');
  const advance=hz=>{const p={x:0,y:0,vx:4,vy:-3,life:1,d:.01};for(let i=0;i<hz;i++)q.stepParticle(p,1000/hz);return p;};
  const slow=advance(60),fast=advance(120);
  for(const key of ['x','y','vx','vy','life'])assert.ok(Math.abs(slow[key]-fast[key])<1e-8,key);
});
test('level-up notifications include new content, farming unlocks and milestone perks', () => {
  const {q}=harness(), notes=[];q.notify=o=>notes.push(o);
  q.S.xp.fishing=q.data.XPF[10]-1;q.addXp('fishing',1,{raw:true});
  const fishing=notes.find(n=>n.key==='lvl:fishing');
  assert.equal(fishing.kind,'level');assert.match(fishing.text,/Herring/);assert.match(fishing.text,/Steady Hands/);
  q.S.xp.attack=300000;q.S.unlocked.farming=true;q.S.xp.farming=q.data.XPF[5]-1;q.addXp('farming',1,{raw:true});
  assert.match(notes.find(n=>n.key==='lvl:farming').text,/Grow Onion/);
});
test('routine progress stays in history without creating menu badges', () => {
  const {q,load}=harness();load('fx');q.ui.view='quests';
  for(const o of [{kind:'info',key:'beast:chicken',title:'Bestiary progress'}, {kind:'ach',key:'ach:first',title:'First achievement'}, {kind:'loot',key:'rare:gem_sapphire',title:'Rare find'}])q.notify(o);
  assert.equal(q.noteLog.length,3);assert.equal(q.noticeCount('mining'),0);assert.equal(q.noticeCount('character'),0);
  assert.equal(q.notificationTier({kind:'level'}),'now');assert.equal(q.notificationTier({kind:'loot'}),'quiet');
  assert.equal(q.notificationTier({kind:'unlock'}),'now');
});
test('same-page routine progress stays quiet and does not create unread counts', () => {
  const {q,load}=harness();load('fx');q.ui.view='bestiary';q.notify({kind:'info',key:'beast:chicken',title:'Bestiary progress'});
  assert.equal(q.noteLog.length,1);assert.equal(q.noticeCount('mining'),0);assert.equal(q.noteMissed,0);
});
test('menu counts follow actionable state and survive visiting the page', () => {
  const {q,load}=harness();load('fx');q.ui.view='quests';
  const expected=()=>q.data.QUESTS.filter(x=>['new','ready'].includes(q.questState(x))).length;
  assert.equal(q.noticeCount('quests'),expected());
  q.markNoticesRead('quests');assert.equal(q.noticeCount('quests'),expected());
  const quest=q.data.QUESTS.find(x=>q.questState(x)==='new');assert.ok(quest);
  const before=q.noticeCount('quests');q.startQuest(quest.id);assert.equal(q.noticeCount('quests'),before-1);
  q.S.q[quest.id].s='ready';assert.equal(q.noticeCount('quests'),before);
  q.S.noticeBadges={mining:{'lvl:mining':'Old level'}};assert.equal(q.noticeCount('mining'),0);
});
test('project and research badges disappear when resources or slots are unavailable', () => {
  const {q,load}=harness();load('fx');
  q.S.coins=1e8;for(const id of Object.keys(q.data.ITEMS))q.S.bank[id]=100000;
  assert.equal(q.noticeCount('projects'),q.projectsForTown(q.S.town).length);
  q.S.coins=0;assert.equal(q.noticeCount('projects'),q.projectsForTown(q.S.town).length,'materials can be delivered without coins');
  q.S.bank={};q.S.inv={};assert.equal(q.noticeCount('projects'),0,'nothing to deliver, nothing to count');
  for(const id of Object.keys(q.data.ITEMS))q.S.bank[id]=100000;q.S.coins=1e8;for(const sk of Object.keys(q.S.xp))q.S.xp[sk]=100000;q.S.unlocked.research=true;
  assert.ok(q.noticeCount('research')>0);
  q.S.research.active=Array.from({length:q.researchSlots()},()=>({id:q.data.TECHS[0].id,left:100}));
  assert.equal(q.noticeCount('research'),0);
});
test('same-page warnings become inline status and critical alerts retain priority', () => {
  const {q,load}=harness();load('fx');q.ui.view='mining';let rendered=0;q.ui.renderPageNotice=()=>rendered++;
  q.notify({kind:'warn',key:'stopped',page:'mining',title:'Task stopped',text:'Missing supplies'});
  assert.equal(rendered,1);assert.equal(q.ui.pageNotice.text,'Missing supplies');assert.equal(q.noteMissed,0);
  for(const kind of ['death','warn','boss'])assert.equal(q.notificationTier({kind}),'now');
});
test('equipping the only copy removes it from the backpack and unequipping returns it', () => {
  const {q}=harness(); q.S.inv={bronze_body:1}; delete q.S.equip.body;
  assert.equal(q.equipItem('bronze_body').ok,true);
  assert.equal(q.S.equip.body,'bronze_body');
  assert.equal(q.S.inv.bronze_body,undefined); assert.equal(q.have('bronze_body'),0);
  assert.equal(q.unequip('body'),true); assert.equal(q.S.inv.bronze_body,1);
  assert.equal(q.S.equip.body,undefined);
});
test('equipping consumes one copy and preserves genuinely spare copies', () => {
  const {q}=harness(); q.S.inv={bronze_body:3}; delete q.S.equip.body;
  assert.equal(q.equipItem('bronze_body').ok,true);
  assert.equal(q.S.inv.bronze_body,2); assert.equal(q.S.equip.body,'bronze_body');
  const before=q.exportSave();
  assert.equal(q.canEquip('bronze_body').equipped,true);
  assert.equal(q.equipItem('bronze_body').ok,false); assert.equal(q.exportSave(),before);
});
test('swapping equipment returns the previous item and consumes the new item', () => {
  const {q}=harness(); q.S.inv={bronze_body:1}; q.S.equip.body='leather_vest';
  assert.equal(q.equipItem('bronze_body').ok,true);
  assert.equal(q.S.inv.bronze_body,undefined); assert.equal(q.S.inv.leather_vest,1);
  assert.equal(q.S.equip.body,'bronze_body');
});
test('gear comparison uses the equipped item in the same slot and shows losses', () => {
  const {q}=harness(); q.S.equip.body='iron_body'; q.S.equip.head='bronze_helm';
  const before=q.exportSave(), comparison=q.compareItem('leather_vest');
  assert.equal(comparison.cur.id,'iron_body');
  assert.equal(comparison.itemRows.find(r=>r.key==='def').a,8);
  assert.equal(comparison.itemRows.find(r=>r.key==='def').b,4);
  assert.equal(comparison.itemRows.find(r=>r.key==='def').d,-4);
  assert.equal(comparison.itemRows.find(r=>r.key==='rng').d,2);
  assert.equal(q.exportSave(),before);
});
test('empty and already equipped slots have accurate comparison values', () => {
  const {q}=harness();
  const empty=q.compareItem('leather_vest');
  assert.equal(empty.cur,null); assert.equal(empty.itemRows.find(r=>r.key==='def').d,4);
  q.S.equip.body='leather_vest'; const same=q.compareItem('leather_vest');
  assert.equal(same.same,true); assert.ok(same.itemRows.every(r=>r.d===0));
});
test('inventory sales are source limited and keep equipped copies', () => {
  const {q}=harness(); q.S.inv.bronze_sword=2; q.S.bank.bronze_sword=3;
  const coins=q.S.coins, value=q.data.ITEMS.bronze_sword.val;
  assert.equal(q.sell('bronze_sword',99,'pack'),2*value);
  assert.equal(q.S.inv.bronze_sword,undefined); assert.equal(q.S.bank.bronze_sword,3);
  assert.equal(q.S.equip.weapon,'bronze_sword'); assert.equal(q.S.coins,coins+2*value);
  assert.equal(q.sell('bronze_sword',1,'bank'),value); assert.equal(q.S.bank.bronze_sword,2);
});
test('zero value items can be sold and invalid quantities do not change inventory', () => {
  const {q}=harness(); q.S.inv.burnt=4; const coins=q.S.coins;
  for(const n of [0,-1,NaN,Infinity]) assert.equal(q.sell('burnt',n,'pack'),undefined);
  assert.equal(q.S.inv.burnt,4); assert.equal(q.sell('burnt',99,'pack'),0);
  assert.equal(q.S.inv.burnt,undefined); assert.equal(q.S.coins,coins);
});
test('an item discovery is announced once and remains quiet thereafter',()=>{
  const {q}=harness();const sounds=[],toasts=[],notes=[];q.sfx=x=>sounds.push(x);q.toast=x=>toasts.push(x);q.notify=x=>notes.push(x);
  q.grant('feather');q.take('feather');q.grant('feather');
  assert.deepEqual(sounds,['discover']);assert.equal(toasts.length,1);assert.equal(notes.filter(n=>n.kind==='discovery').length,1);assert.equal(q.S.seen.items.feather,1);
});
test('a village project pin persists, replaces the previous pin and can be removed', () => {
  const {q}=harness(); assert.equal(q.S.pinnedProject,null);
  assert.equal(q.pinProject('well'),true); const saved=q.exportSave();
  assert.equal(q.pinProject('inn'),true); assert.equal(q.S.pinnedProject,'inn');
  assert.equal(q.pinProject('inn'),true); assert.equal(q.S.pinnedProject,null);
  assert.equal(q.importSave(saved),true); assert.equal(q.S.pinnedProject,'well');
  assert.equal(q.pinProject('missing'),false); assert.equal(q.S.pinnedProject,'well');
});
test('legacy saves gain the project pin field and an unknown pin is cleared without rejecting the hero', () => {
  const {q}=harness(); const legacy=q.newState(); delete legacy.pinnedProject;
  assert.equal(q.importSave(encode(legacy)),true); assert.equal(q.S.pinnedProject,null);
  const invalid=q.newState(); invalid.pinnedProject='missing'; invalid.coins=321;
  assert.equal(q.importSave(encode(invalid)),true); assert.equal(q.S.pinnedProject,null); assert.equal(q.S.coins,321);
  const broken=q.newState(); broken.pinnedProject={nested:true};
  assert.equal(q.importSave(encode(broken)),true,'a malformed pin is cleared too'); assert.equal(q.S.pinnedProject,null);
});
test('new players receive one persistent lesson per unlocked skill', () => {
  const {q}=harness(); assert.equal(q.lessonForPage('woodcutting').id,'woodcutting');
  assert.equal(q.lessonForPage('cooking'),null);
  assert.equal(q.acknowledgeLesson('woodcutting'),true); assert.equal(q.lessonForPage('woodcutting'),null);
  const saved=q.exportSave(); assert.equal(q.importSave(saved),true); assert.equal(q.lessonForPage('woodcutting'),null);
  q.S.xp.fishing=q.data.advReq(4);q.S.stats.catch=5;q.S.stats.chop=5; assert.equal(q.lessonForPage('cooking').id,'cooking');
  assert.equal(q.acknowledgeLesson('missing'),false);
});
test('existing saves skip lessons for used skills but introduce untouched skills', () => {
  const {q}=harness(); q.S.xp.woodcutting=q.data.XPF[12]; q.initGuides();
  assert.equal(q.lessonForPage('woodcutting'),null); assert.equal(q.S.tut.done.intro,true);
  assert.equal(q.lessonForPage('fishing').id,'fishing');
  q.S.tut.hidden=true; assert.equal(q.lessonForPage('fishing'),null);
});
test('a fresh save with a few startup ticks still gets the introduction', () => {
  const {q}=harness(); q.S.playtime=500; q.initGuides(); assert.equal(q.S.tut.done.intro,undefined);
});
test('skill introductions describe both the activity and its progression purpose', () => {
  const {q}=harness();
  for(const lesson of Object.values(q.skillLessons)) { assert.ok(lesson.text.length>5); assert.ok(lesson.towards.length>5); assert.ok(lesson.goal.length>5); }
  assert.match(q.skillLessons.woodcutting.towards,/restoring/);
  assert.match(q.skillLessons.mining.towards,/Smithing/);
});


test('action skills unlock from lifetime actions and enchanting consumes real gem items',()=>{
 const {q,load}=harness();load('skill_expansion_data');q.S=q.newState();load('skill_expansion');
 const notes=[];q.notify=n=>notes.push(n);
 for(const sk of ['hunting','exploration','herbalism','enchanting'])assert.equal(q.skillUnlocked(sk),false);
 q.S.stats.kill=10;q.S.stats.catch=25;q.S.stats.chop=25;q.S.stats.harvest=20;q.S.stats.craft=30;q.S.stats.smith=20;
 q.checkActionUnlocks();
 for(const sk of ['hunting','exploration','herbalism','enchanting']){assert.equal(q.S.unlocked[sk],true);assert.ok(notes.some(n=>n.key==='unlock:'+sk));assert.doesNotMatch(q.unlockHow(sk),/99/);}
 q.S.inv.rune=5;q.S.inv.gem_sapphire=1;
 assert.equal(q.enchant('bronze_sword'),true);assert.equal(q.S.enchants.bronze_sword,1);assert.equal(q.have('gem_sapphire'),0);assert.equal(q.have('rune'),0);
 const bonus=q.bonus();assert.equal(bonus.atk,q.data.ITEMS.bronze_sword.b.atk+1);
});
test('combat interval improves with combat level and preserves weapon differences',()=>{
 const {q}=harness();const sword=q.combatInterval();
 q.S.equip.weapon='bronze_dagger';assert.ok(q.combatInterval()<sword);
 q.S.equip.weapon='bronze_hammer';assert.ok(q.combatInterval()>sword);
 q.S.equip.weapon='bronze_sword';for(const sk of ['attack','strength','defence','hitpoints'])q.S.xp[sk]=q.data.XPF[99];
 assert.ok(q.combatInterval()<sword);assert.ok(q.combatInterval()>=q.data.WTYPES.sword.speed*.76);
});

test('Scholarship credits legacy discoveries once and preserves existing coins',()=>{
 const {q}=harness();const old=JSON.parse(JSON.stringify(q.S));delete old.xp.research;old.research.done.sharper1=1;old.coins=40000;
 assert.equal(q.importSave(encode(old)),true);const xp=q.researchXp(q.data.TECH.sharper1);assert.equal(q.S.xp.research,xp);assert.equal(q.S.coins,40000);
 assert.equal(q.importSave(q.exportSave()),true);assert.equal(q.S.xp.research,xp);
});
test('Scholarship projects award XP once and field notes can repeat',()=>{
 const {q}=harness();q.S.xp.fishing=q.data.XPF[70];q.S.unlocked.research=true;q.S.coins=1000;q.S.inv.feather=10;
 assert.equal(q.startResearch('field_notes'),true);assert.equal(q.S.coins,975);assert.equal(q.have('feather'),8);
 q.researchTick(300000);const xp=q.S.xp.research;assert.ok(xp>0);assert.equal(q.techDone('field_notes'),false);
 q.researchTick(300000);assert.equal(q.S.xp.research,xp);assert.equal(q.startResearch('field_notes'),true);q.researchTick(300000);assert.ok(q.S.xp.research>xp);
});
test('Scholarship gates tiers by skill level and retains legacy second slots',()=>{
 const {q}=harness();q.S.xp.fishing=q.data.XPF[70];q.S.unlocked.research=true;const t=q.data.TECHS.find(t=>t.tier===2);
 assert.match(q.techReason(t),/Scholarship 10/);q.S.xp.research=q.data.XPF[10];for(const id of t.req)q.S.research.done[id]=1;assert.equal(q.techReason(t),'');
 assert.equal(q.researchSlots(),2);q.S.xp.fishing=0;q.S.xp.research=q.data.XPF[20];assert.equal(q.researchSlots(),2);
});
test('reward tuning covers every town and 32-hour absences keep the existing cap',()=>{
 const {q}=harness();assert.equal(q.offlineEff(32*3600000),5*3600000);
 assert.equal(q.data.ECONOMY.gatherTownScale.length,q.data.TOWNS.length);
 assert.ok(q.data.ECONOMY.gatherTownScale.every(Number.isFinite));assert.equal(q.data.ECONOMY.mineGemChance,.004);
 for(const m of q.data.MONLIST)assert.ok(m.coins.every(n=>Number.isFinite(n)&&n>=0));
});

test('battle forecasts emit no live UI events, including equipment comparisons',()=>{
 const {q}=harness();q.S.xp.attack=q.data.XPF[40];q.S.xp.strength=q.data.XPF[40];q.S.hp=q.maxHp();q.S.inv.iron_sword=1;q.S.inv.bread=50;
 const events=[];for(const event of ['act','quests','lvl','travelunlock','encounter','log','shop','equip'])q.on(event,()=>events.push(event));
 q.forecast('grubnash');q.forecast('grubnash','iron_sword');assert.deepEqual(events,[]);
 q.emit('act');assert.deepEqual(events,['act'],'Live events must resume after the forecast');
});
test('regional projects follow the current town and grant their benefit only once',()=>{
 const {q,load}=harness();load('fx');q.S.coins=100000;q.S.inv.log_normal=1000;q.S.inv.crop_potato=50;
 assert.equal(q.finishProject('market'),false);q.S.town='mossbarrow';assert.equal(q.noticeCount('projects'),1);
 const coins=q.S.coins,regen=q.fx().regen;assert.equal(q.finishProject('market'),true);assert.equal(q.S.coins,coins-150);assert.ok(Math.abs(q.fx().regen-regen-.02)<1e-9);
 assert.equal(q.finishProject('market'),false);assert.equal(q.noticeCount('projects'),0);
 assert.equal(q.journeyNext('well').a,'willowbrook');
 for(const town of q.data.TOWNS)assert.ok(q.projectsForTown(town.id).length>0);
 const save=q.exportSave();assert.equal(q.importSave(save),true);assert.equal(q.S.projects.market,true);
});
test('exploration summaries use town-specific saved discoveries and quest progress',()=>{
 const {q,load}=harness();load('skill_expansion_data');load('skill_expansion');q.S.beast.kills.chicken=1;q.S.q.first_steps={s:'done'};
 const willow=q.explorationSummary('willowbrook'),moss=q.explorationSummary('mossbarrow');assert.equal(willow.found.length,1);assert.equal(moss.found.length,0);assert.ok(willow.completed.some(q=>q.id==='first_steps'));assert.equal(moss.completed.length,0);
});
test('forecast-time save attempts cannot persist trial progression',()=>{
 const {q,storage}=harness();q.save();const before=[...storage.entries()];q.forecasting=true;q.S.coins+=99999;assert.equal(q.save(),false);assert.deepEqual([...storage.entries()],before);
});
test('auto-replant plants the chosen seed, falls back to the harvested crop, and the choice survives a save',()=>{
 const {q}=harness();const S=q.S,D=q.data,crops=()=>[...S.farm.plots.map(p=>p.crop)];S.unlocked.farming=true;S.xp.farming=D.XPF[20];S.inv.seed_potato=6;S.inv.seed_onion=3;S.farm.autoReplant=true;
 assert.equal(q.plantAll('potato'),3);S.farm.next='onion';S.farm.plots.forEach(p=>p.at-=1e12);q.harvestAll();
 assert.deepEqual(crops(),['onion','onion','onion'],'the chosen seed is replanted');
 assert.equal(q.have('seed_onion'),0);S.farm.plots.forEach(p=>p.crop=null);S.inv.seed_potato=6;q.plantAll('potato');S.farm.plots.forEach(p=>p.at-=1e12);q.harvestAll();
 assert.deepEqual(crops(),['potato','potato','potato'],'with no chosen seeds left, each plot replants what it grew');
 const save=q.exportSave();assert.equal(q.importSave(save),true);assert.equal(q.S.farm.next,'onion');
});
test('without a chosen seed, auto-replant keeps the harvested crop and older saves gain the field safely',()=>{
 const {q}=harness();const S=q.S,D=q.data;S.unlocked.farming=true;S.xp.farming=D.XPF[5];S.inv.seed_potato=6;delete S.farm.next;
 const save=q.exportSave();assert.equal(q.importSave(save),true);assert.equal(q.S.farm.next,null);
 q.S.unlocked.farming=true;q.S.xp.farming=D.XPF[20];q.S.inv.seed_potato=6;q.plantAll('potato');q.S.farm.plots.forEach(p=>p.at-=1e12);q.harvestAll();
 assert.ok([...q.S.farm.plots].every(p=>p.crop==='potato'));
});
test('starting a First Steps task accepts the quest so the first catches count, once',()=>{
 const {q}=harness();assert.equal(q.questState(q.data.QM.first_steps),'new');
 q.startAct('fish','shrimp',{quiet:true});assert.equal(q.questState(q.data.QM.first_steps),'active');
 q.stopAct(true);q.startAct('wood','normal',{quiet:true});assert.equal(q.questState(q.data.QM.first_steps),'active');
 const {q:q2}=harness();q2.forecasting=true;q2.startAct('fish','shrimp',{quiet:true});q2.forecasting=false;assert.equal(q2.questState(q2.data.QM.first_steps),'new','forecasts never accept quests');
});
test('contextual routes find where each kind of item comes from',()=>{
 const {q,load}=harness();q.ui.taskChoice={};load('routes');
 const src=id=>{const r=q.sourceOf(id);return r&&r.kind+':'+(r.id||r.page);};
 assert.equal(src('raw_shrimp'),'fish:shrimp');assert.equal(src('log_oak'),'wood:oak');assert.equal(src('ore_copper'),'mine:copper');
 assert.equal(src('crop_potato'),'farm:farming');assert.equal(src('seed_potato'),'shop:shop');
 assert.match(src('bar_bronze'),/^recipe:/);assert.equal(q.sourceOf('bar_bronze').page,'smithing');
 assert.equal(q.sourceOf('no_such_item'),null);
 const visited=[];q.go=p=>{visited.push(p);q.ui.view=p;};q.ui.view='projects';q.ui.DO.route('log_oak');
 assert.deepEqual([...visited],['woodcutting']);assert.equal(q.ui.taskChoice.woodcutting,'oak');assert.equal(q.ui.returnTo.page,'projects');
});
test('boss preparation follows the battle forecast and caches it',()=>{
 const {q}=harness();const S=q.S,D=q.data;S.q.first_steps={s:'done',p:[5,5]};
 for(const k of ['attack','strength','defence','hitpoints'])S.xp[k]=D.XPF[30];S.unlocked.cooking=true;S.xp.cooking=D.XPF[10];S.hp=q.maxHp();S.inv.bread=40;
 const boss=D.QUESTS.find(x=>x.obj.some(o=>o.ev==='boss'&&o.key==='grubnash'));if(boss)S.q[boss.id]={s:'active',p:boss.obj.map(()=>0)};
 S.journey='boss';const a=q.bossForecast('grubnash'),b=q.bossForecast('grubnash');assert.ok(a&&a===b,'second call uses the cache');
 const next=q.journeyNext();assert.ok(a.winRate>=.75?next.title==='Challenge Grubnash':/food|stronger|provisions|armour|buy|equip|rest|switch|save/i.test(next.title),next.title);
 q.forecasting=true;assert.equal(q.bossForecast('grubnash'),null,'never nests inside another forecast');q.forecasting=false;
});
test('first boss: reachable gate and honest preparation advice from the real save',()=>{
 const {q}=harness();const S=q.S,D=q.data,m=D.MON.grubnash;
 assert.equal(m.boss.req,8,'Grubnash opens at combat 8 (scripts/sim-opening.cjs)');assert.ok(m.hp<=24&&m.max<=3,'first boss stays a beginner fight');
 assert.match(D.QM.chiefs_end.blurb||D.QUESTS.find(x=>x.id==='chiefs_end').blurb||'',/combat level 8/);
 for(const k of ['attack','strength','defence'])S.xp[k]=D.XPF[8];S.xp.hitpoints=D.XPF[11];S.hp=4;S.coins=100;q.fxDirty();
 let adv=q.prepAdvice('grubnash');assert.equal(adv[0].key,'rest','low health comes first');
 const buy=adv.find(x=>x.key==='buy');assert.ok(buy&&buy.afford===false&&!/^Buy armour for your empty/.test(buy.title),'never claims an unaffordable set is affordable');
 S.coins=1000;S.hp=q.maxHp();adv=q.prepAdvice('grubnash');assert.ok(adv.find(x=>x.key==='buy').afford,'affordable once coins cover it');
 assert.ok(adv.some(x=>x.key==='weak'),'suggests his weakness (crush)');
 const before=JSON.stringify(S);q.prepAdvice('grubnash');assert.equal(JSON.stringify(S),before,'advice never changes the save');
});
test('slayer goals: titles and boss trophies are earned at their milestones and survive a save round trip',()=>{
 const {q,load}=harness();load('lore');load('bestiary');const S=q.S,D=q.data;
 assert.ok(q.slayerGoals,'bestiary module loaded');
 const g=q.slayerGoals(D.MON.goblin);assert.equal(JSON.stringify(g.map(x=>x.n)),'[10,50,250]');assert.ok(g[2].title&&/Goblin Slayer/.test(g[2].reward),'regular title at 250, named up front');
 assert.equal(q.beastTitleEarned('goblin'),false);S.beast.kills.goblin=250;assert.equal(q.beastTitleEarned('goblin'),true);
 q.setTitle('beast:goblin');assert.equal(q.heroTitle(),'Goblin Slayer');
 q.setTitle('beast:rat');assert.equal(S.title,null,'cannot wear an unearned title');
 S.beast.kills.grubnash=9;assert.equal(q.trophyEarned('grubnash'),false);S.beast.kills.grubnash=10;assert.equal(q.trophyEarned('grubnash'),true);
 S.house.owned=true;assert.ok(q.toggleTrophy('grubnash'));assert.equal(JSON.stringify(S.house.wall),'["grubnash"]');assert.equal(q.toggleTrophy('oldtusk'),false,'unearned trophies cannot be hung');
 const back=q.validateSave(JSON.parse(JSON.stringify(S)));assert.equal(JSON.stringify(back.house.wall),'["grubnash"]');
 const old=JSON.parse(JSON.stringify(S));delete old.house.wall;assert.ok(Array.isArray(q.validateSave(old).house.wall),'older saves get an empty wall');
});
test('companion tricks: halved passives, tricks fire through the real engine, forecasts stay pure',()=>{
 const {q,load}=harness();load('lore');load('bestiary');load('companions');const S=q.S,D=q.data;
 assert.equal(D.PET.gobbo.bonus.dmg,.015,'passive halved');assert.match(D.PET.gobbo.text,/Heckle/);assert.equal(Object.keys(D.TRICKS).length,17);
 const own=id=>{S.pets.owned[id]={aff:0,found:1};q.setPet(id);};
 own('bubbles');assert.ok(q.trick('school'));assert.ok(!q.trick('heckle'));
 const catchN=()=>{S.inv={};q.startAct('fish','shrimp',{quiet:true});q.simulate(30*60000);return q.have('raw_shrimp');};
 const withTrick=catchN();q.setPet(null);const without=catchN();assert.ok(withTrick>without,`school spotter adds catches (${withTrick} vs ${without})`);
 own('stormchick');const a={kind:'fish',id:'shrimp',pace:'steady',count:0},b={...a,count:10};assert.ok(q.actDur(a)<q.actDur(b),'tailwind speeds the first ten actions');
 own('toast');q.fxDirty();const g1=q.fx().grow;q.fx();assert.equal(q.fx().grow,g1,'fx trick applied once per recompute');q.setPet(null);q.fxDirty();assert.ok(q.fx().grow<g1);
 own('bogwisp');S.beast.kills.goblin=1;const r=q.research(D.MON.goblin);q.setPet(null);assert.equal(r.rank,q.research(D.MON.goblin).rank+1,'wisp reveals one stage early');
 for(const k of ['attack','strength','defence','hitpoints'])S.xp[k]=D.XPF[20];own('gobbo');S.hp=q.maxHp();const before=JSON.stringify(S);q.forecast('goblin');assert.equal(JSON.stringify(S),before,'forecast with a trick leaves the save untouched');
});
test('combat progress bar follows the trained skill and agrees with the XP it names',()=>{
 const {q}=harness();const S=q.S,D=q.data;
 assert.equal(q.combatLvl(),3);assert.equal(Math.round(q.combatProgress().pct),0,'fresh hero starts at 0%');
 /* Melee replaced Attack and Strength: Defence 2, Health 10, Melee 5 almost at 6 while training Accurate */
 const lv=(k,l,f=0)=>S.xp[k]=Math.round(D.XPF[l]+(D.XPF[l+1]-D.XPF[l])*f);
 lv('defence',2,.5);lv('hitpoints',10);lv('melee',5,.9);S.style.melee='accurate';
 const c=q.combatProgress();assert.equal(c.lvl,q.combatLvl());assert.equal(c.route.skill,'melee','follows the skill being trained');
 const pct=(S.xp.melee-c.route.from)/(c.route.to-c.route.from)*100;assert.ok(Math.abs(c.pct-pct)<1e-9&&c.pct<99,`bar ${c.pct.toFixed(0)}% matches the ${c.route.xp} XP still needed`);
 assert.equal(c.route.xp,c.route.to-S.xp.melee);
 const l0=q.combatLvl();S.xp.melee=c.route.to-1;assert.ok(q.combatProgress().pct>90);S.xp.melee=c.route.to;assert.equal(q.combatLvl(),l0+1,'filling the bar raises the combat level');
 assert.equal(S.xp.attack,S.xp.melee,'old ids read Melee');
});
test('Attack and Strength merge into Melee without losing Hero level',()=>{
 const {q}=harness();const D=q.data;const before=q.newState('Old');before.xp.attack=D.XPF[30];before.xp.strength=D.XPF[40];delete before.xp.melee;
 const heroBefore=(()=>{const t=D.XPF[30]+D.XPF[40]+D.XPF[10]-D.XPF[10];let l=1;while(l<99&&t>=D.advReq(l+1))l++;return l;})();
 assert.equal(q.importSave(Buffer.from(JSON.stringify(before),'utf8').toString('base64')),true,'old save loads');
 assert.equal(q.lvl('melee'),40,'Melee takes the higher of the two');assert.equal(q.lvl('attack'),40);assert.equal(q.advLvl(),heroBefore,'Hero level unchanged');
 assert.ok(!('attack' in JSON.parse(Buffer.from(q.exportSave(),'base64').toString('utf8')).xp),'only Melee is saved');assert.equal(q.advLvl(),heroBefore);
 assert.ok(q.skillUnlocked('ranged')&&q.skillUnlocked('magic'),'bow and staff are open from the start');
});
test('early levels are slower for non-combat skills and full speed from level 20; combat keeps its own pace',()=>{
 const {q}=harness();const S=q.S,D=q.data;
 assert.ok(Math.abs(q.earlyPace('fishing')-.3)<1e-9,'level 1 learns at 30%');
 S.xp.fishing=D.XPF[10];assert.ok(q.earlyPace('fishing')>.6&&q.earlyPace('fishing')<.7);
 S.xp.fishing=D.XPF[20];assert.equal(q.earlyPace('fishing'),1);
 assert.equal(q.earlyPace('attack'),1);assert.equal(q.earlyPace('hitpoints'),1);
});
test('every town keeps a quest within reach from its first quest to its boss, and every objective points at something real',()=>{
 const {q,load}=harness();load('creatures_expanded');try{load('routes');load('adventures');}catch(e){}const D=q.data;
 const outs=new Set(Object.values(D.RLIST).flat().flatMap(r=>[...Object.keys(r.out||{}),r.evKey].filter(Boolean)));
 const node={catch:'fish',chop:'wood',mine:'mine',thieve:'thieve'};
 for(const x of D.QUESTS)for(const o of x.obj){if(o.key==='*')continue;const ok=o.ev==='kill'||o.ev==='boss'||o.ev==='guide'?!!D.MON[o.key]:node[o.ev]?D.NODES[node[o.ev]].some(n=>n.id===o.key):['cook','smith','smelt','craft'].includes(o.ev)?outs.has(o.key):o.ev==='harvest'?D.CROPS.some(c=>c.id===o.key):o.ev==='visit'?!!D.TOWN[o.key]:['deliver','collect'].includes(o.ev)?!!D.ITEMS[o.key]:true;assert.ok(ok,`${x.id}: ${o.ev} ${o.key} does not exist`);
  if(x.req)assert.ok(D.QM[x.req],`${x.id} requires missing ${x.req}`);}
 for(const t of D.TOWNS){const adv=D.QUESTS.filter(x=>x.town===t.id&&!x.secret).map(x=>x.adv).sort((a,b)=>a-b);
  for(let i=1;i<adv.length;i++)assert.ok(adv[i]-adv[i-1]<=6,`${t.id}: no quest between Hero ${adv[i-1]} and ${adv[i]}`);
  assert.ok(adv.length>=5,`${t.id} has ${adv.length} quests`);}
 assert.equal(new Set(D.QUESTS.map(x=>x.id)).size,D.QUESTS.length,'quest ids are unique');
});
test('a chosen boss goal completes when that boss falls and is never silently replaced',()=>{
 const {q}=harness();const S=q.S;q.ui.DO.destination&&0;
 S.journey='boss';delete S.journeyTarget;assert.equal(q.goalTarget().id,'grubnash');assert.equal(q.goalDone(),false);
 S.towns.willowbrook.boss=true;assert.equal(q.goalTarget().id,'grubnash','still the boss you chose');assert.equal(q.goalDone(),true);
 S.journeyTarget=null;assert.equal(q.goalTarget().id,'oldtusk','an older save adopts the next undefeated boss');assert.equal(q.goalDone(),false);
 S.journey='house';S.house.owned=false;assert.equal(q.goalDone('house'),false);S.house.owned=true;assert.equal(q.goalDone('house'),true);
});
test('ordinary gathering works from any visited town; thieving and signature resources stay regional',()=>{
 const {q}=harness();const S=q.S,D=q.data;S.unlocked.fishing=true;
 const herring=D.NODE['fish:herring'],carp=D.NODE['fish:carp'],farmer=D.NODE['thieve:farmer'];
 S.town='mossbarrow';S.towns.mossbarrow={visited:true};S.towns.willowbrook.visited=true;
 assert.ok(q.nodeHere(herring),'Willowbrook herring can be fished from Mossbarrow once discovered');
 S.town='willowbrook';delete S.towns.mossbarrow;assert.ok(!q.nodeHere(carp),'Mossbarrow carp needs one visit first');
 S.towns.mossbarrow={visited:true};assert.ok(q.nodeHere(carp));
 S.town='mossbarrow';assert.ok(!q.nodeHere(farmer),'thieving targets are local people');
 S.towns.skyreach={visited:true};assert.ok(!q.nodeHere(D.NODE['fish:skyfin']),'signature fish stays in Skyreach');
 S.xp.fishing=D.XPF[5];assert.equal(q.startAct('fish','sardine',{quiet:true}),true,'starts a Willowbrook spot from Mossbarrow');q.stopAct&&q.stopAct(true);
});
test('practical skill unlocks: requirements, routes, consumption, no cycles, older saves keep their skills',()=>{
 const {q,load}=harness();load('skill_expansion');const S=q.S,D=q.data;
 assert.equal(q.skillUnlocked('cooking'),false);S.stats.catch=5;S.stats.chop=5;assert.equal(q.skillUnlocked('cooking'),true,'cooking from catching and chopping');
 assert.equal(q.skillUnlocked('mining'),false);S.inv.tool_pick_1=1;assert.equal(q.skillUnlocked('mining'),true,'a pickaxe, kept');assert.equal(q.have('tool_pick_1'),1);
 assert.ok(D.SHOPS.willowbrook.includes('tool_pick_1'),'the pickaxe is sold in Willowbrook');assert.ok(!D.QM.miners_pick.obj.some(o=>o.ev==='mine'),'the pickaxe quest does not need Mining');
 S.xp.fishing=D.advReq(5);S.stats.chop=15;S.inv.seed_potato=7;assert.equal(q.skillUnlocked('farming'),false,'consumed requirements wait for the learning moment');
 q.checkActionUnlocks();assert.equal(S.unlocked.farming,true);assert.equal(q.have('seed_potato'),2,'five seeds planted');
 assert.ok(D.RECIPES.craft_string.in.cowhide&&D.RECIPES.craft_trap.in.string,'traps need string, string needs a cowhide');
 assert.ok(D.RECIPES.craft_string.lvl<=1&&D.RECIPES.craft_trap.lvl<=2,'traps are made at Crafting 1-2');
 /* prerequisite graph: no skill needs itself through skills or the recipes of required items */
 const needs=sk=>{const out=new Set();for(const st of Object.keys(D.SK[sk].actionReq||{})){const [k,a]=st.split(':');if(k==='skill')out.add(a);if(k==='own'||k==='use'){const r=Object.values(D.RECIPES).find(r=>r.out[a]);if(r)out.add(r.skill);}}if(D.SK[sk].quest)for(const o of D.QM[D.SK[sk].quest].obj){const m={catch:'fishing',chop:'woodcutting',mine:'mining',smelt:'smithing',smith:'smithing',craft:'crafting',cook:'cooking',harvest:'farming'}[o.ev];if(m)out.add(m);}return out;};
 const seen=new Set(),walk=(sk,path)=>{assert.ok(!path.includes(sk),'cycle: '+[...path,sk].join(' > '));for(const n of needs(sk))walk(n,[...path,sk]);};for(const s of D.SKILLS)walk(s.id,[]);
 /* older save at Hero 7 with no pickaxe keeps Mining and Cooking; the migration runs once */
 const {q:o}=harness();
 const st=o.S;st.xp.fishing=o.data.advReq(7);delete st.unlockRules;st.unlocked={};const raw=JSON.stringify(st);const back=o.validateSave(JSON.parse(raw));
 assert.equal(back.unlocked.mining,true);assert.equal(back.unlocked.cooking,true);assert.equal(back.unlockRules,2);
 const fresh=o.newState('Fresh');fresh.xp.fishing=o.data.advReq(7);const again=o.validateSave(JSON.parse(JSON.stringify(fresh)));assert.ok(!again.unlocked.mining,'new-rule heroes are not given Mining by Hero level');
});
test('every unlock has one source of truth: once a skill says it is learned, its page and content open',()=>{
 const {q,load}=harness();load('skill_expansion');const S=q.S,D=q.data;
 /* the reported case: Scholarship learned at Hero 12 with 8 creatures studied must open the Research hall, not ask for Hero 16 */
 S.xp.fishing=D.advReq(12);['chicken','rat','goblin','cow','brambleback','lanternmoth','rilljaw','tattercap'].forEach(m=>S.beast.kills[m]=1);
 q.checkActionUnlocks();assert.equal(q.skillUnlocked('research'),true);assert.ok(q.advLvl()<16);
 const t1=D.TECHS.find(t=>t.tier===1&&!(t.req||[]).length);assert.notEqual(q.techReason(t1),'Learn Scholarship first');assert.ok(!/Hero level/.test(String(q.techReason(t1))),'no stale Hero 16 gate');
 assert.equal(q.lessonForPage('research')&&q.lessonForPage('research').id,'research','its guide is offered once it is learned');
 /* while locked, every description points at the same requirements */
 const {q:r,load:l2}=harness();l2('skill_expansion');assert.equal(r.skillUnlocked('research'),false);assert.equal(r.techReason(t1),'Learn Scholarship first');assert.equal(r.lessonForPage('research'),null);
 for(const s of D.SKILLS){const how=r.unlockHow(s.id),teach=r.skillTeacher(s.id);if(!r.skillUnlocked(s.id)){assert.ok(how&&how.length>3,s.id+' explains its unlock');assert.ok(!/Hero level 16|Hero 16/.test(how+teach),s.id+' quotes no stale gate');}}
});
test('unique gear: effects are real, first copies have a bad-luck guarantee, stats stay modest',()=>{
 const {q}=harness();const S=q.S,D=q.data;
 const uniques=Object.values(D.ITEMS).filter(it=>it.unique);assert.ok(uniques.length>=19,'11 new uniques plus 8 boss trophies with effects');
 const fresh=uniques.filter(it=>!['chief_helm','tusk_charm','barnacle_cutlass','frostmaw_pendant','witch_staff','emberfang_bow','storm_feather','hollow_crown'].includes(it.id));assert.ok(fresh.length>=10&&fresh.length<=15);
 assert.ok(D.ITEMS.vipers_kiss.b.atk<D.ITEMS.steel_sword.b.atk,'a unique is not simply a bigger number');
 for(const it of fresh.filter(x=>!['wardens_greathelm','smugglers_knot'].includes(x.id)))assert.ok(D.MONLIST.some(m=>m.drops.some(d=>d[0]===it.id)),'drop source for '+it.id);
 /* lifesteal: a fight with Leechfang ends with more health than with an iron dagger */
 for(const k of ['attack','strength','defence','hitpoints'])S.xp[k]=D.XPF[14];S.town='mossbarrow';S.towns.mossbarrow={visited:true,boss:false};S.settings.autoEat=false;
 const heals=id=>{S.equip.weapon=id;S.hp=q.maxHp()-6;q.fxDirty();q.effectHits={};q.startAct('fight','boar',{quiet:true});q.simulate(60000);q.stopAct(true);return (q.effectHits||{}).lifesteal||0;};
 assert.ok(heals('leechfang')>0,'Leech heals during the fight');assert.equal(heals('iron_dagger'),0,'and an ordinary dagger does not');
 /* swift and fortune */
 S.equip.weapon='bronze_sword';const base=q.combatInterval();S.equip.ring='storm_feather';assert.ok(q.combatInterval()<base,'Gale: faster attacks');
 S.equip.ring='smugglers_knot';q.fxDirty();assert.ok(q.coinMult()>1.04,"Smuggler's luck: +5% coins");delete S.equip.ring;
 /* bad-luck guarantee: the first Leechfang drops by 2.5x the expected defeats */
 S.equip.weapon='iron_sword';S.hp=q.maxHp();S.inv.trout=500;S.settings.autoEat=true;q.fxDirty();q.startAct('fight','wolf',{quiet:true});
 let n=0;while(!q.have('leechfang')&&n<400){q.simulate(60000);n++;}assert.ok(q.have('leechfang')>=1,'pity guarantees the first copy');assert.ok(S.uniqFound.leechfang&&(S.beast.kills.wolf||0)<=Math.ceil(2.5*150),'within the guarantee');
});
test('The Silent Bells: a six-chapter midgame story whose decision and earlier choices change what comes later',()=>{
 const {q,load}=harness();load('adventures');const S=q.S,D=q.data;
 const ch=D.QUESTS.filter(x=>x.adventure==='bells').sort((a,b)=>a.stage-b.stage);assert.equal(ch.length,6);
 assert.ok(ch[0].adv===18&&ch[5].adv<=30,'spans Hero 18-28');assert.ok(ch.every((x,i)=>!i||x.req===ch[i-1].id),'chained');
 const finish=id=>{S.q[id]={s:'ready',p:D.QM[id].obj.map(o=>o.n)};};
 /* earlier choices echo */
 S.disc.lost_traveller={choice:'share'};assert.match(D.QM.bl_road.blurb,/fed my niece/);assert.equal(D.QM.bl_road.reward.coins,1200);
 S.disc.goblin_satchel={choice:'buckle'};assert.match(D.QM.bl_orrin.blurb,/buckle/);
 /* the ledger decision */
 for(const id of ['bl_silence','bl_road']){finish(id);q.claimQuest(id);}
 finish('bl_ledger');q.claimQuest('bl_ledger','silt');assert.equal(q.choiceOf('bl_ledger'),'silt');assert.equal(S.q.bl_ledger.s,'done');
 assert.equal(D.QM.bl_tide.giver,'Mother Silt');assert.ok(D.QM.bl_tide.reward.items.smugglers_knot,'Silt path rewards the knot');
 S.choices.bl_ledger='ilsa';assert.equal(D.QM.bl_tide.giver,'Harbourmaster Ilsa');assert.ok(D.QM.bl_tide.reward.items.wardens_greathelm);
 /* a programmatic claim without a choice still resolves (first option), never blocks */
 const {q:q2,load:l2}=harness();l2('adventures');q2.S.q.bl_ledger={s:'ready',p:[25,10]};q2.claimQuest('bl_ledger');assert.equal(q2.choiceOf('bl_ledger'),'ilsa');
 /* late storytelling remembers the bells */
 for(const id of ['bl_orrin','bl_tide','bl_ring'])S.q[id]={s:'done',p:[]};assert.match(D.QM.crownfall.thanks,/Mossbarrow/);
 S.disc.ashen_anvil={choice:'quench'};assert.ok(D.QM.wyrm_slayer.reward.items.ember_core===3);
});
test('adventure journal: records the moments that matter, backfills older saves, stays capped and quiet',()=>{
 const {q,load}=harness();load('adventures');load('journal');const S=q.S,D=q.data;
 /* an older save with progress gets one opening entry */
 delete S.journal;S.q.first_steps={s:'done',p:[5,5]};S.towns.willowbrook.boss=true;q.journalBackfill();
 assert.equal(S.journal.length,1);assert.match(S.journal[0].text,/story so far.*Grubnash/i);
 /* events */
 q.notify({kind:'boss',key:'boss:grubnash',title:'Grubnash is defeated',text:'The road to Mossbarrow is open.'});
 q.makeDiscovery('goblin_satchel');q.chooseDiscovery('goblin_satchel','buckle');
 const kinds=S.journal.map(e=>e.kind);for(const k of ['boss','find','choice'])assert.ok(kinds.includes(k),k);
 /* forecasts never write; duplicates collapse; the cap holds */
 const n=S.journal.length;q.forecasting=true;q.journal('boss','x');q.forecasting=false;assert.equal(S.journal.length,n);
 q.journal('rest','same');q.journal('rest','same');assert.equal(S.journal.length,n+1);
 for(let i=0;i<260;i++)q.journal('rest','entry '+i);assert.ok(S.journal.length<=200);
});
test('nice touches: clock-based time of day, one title nod per villager, quiet memories, occasional door notes',()=>{
 const {q,load}=harness();load('adventures');load('lore');load('bestiary');load('journal');load('companions');load('touches');const S=q.S,D=q.data;
 assert.equal(q.timeOfDay(6),'dawn');assert.equal(q.timeOfDay(12),'day');assert.equal(q.timeOfDay(19),'dusk');assert.equal(q.timeOfDay(23),'night');
 S.beast.kills.goblin=250;q.setTitle('beast:goblin');assert.match(q.titleNod(D.QM.first_steps),/Goblin Slayer/);assert.equal(q.titleNod(D.QM.first_steps),'','only once per villager');
 S.journal=[];S.beast.kills.rat=99;q.recordKill(D.MON.rat,[]);assert.ok(S.journal.some(e=>e.kind==='memory'&&/100th giant rat/.test(e.text)));
 const n=S.journal.length;q.recordKill(D.MON.rat,[]);assert.equal(S.journal.length,n,'a memory is written once');
 const short=q.ui.returnExtras({real:3600e3,items:{}});assert.ok(!/door-note/.test(short),'no note after a short absence');
});
test('combat guidance is derived from the shared damage-type rule and the real save',()=>{
 const {q}=harness();const S=q.S,D=q.data,R=D.TYPE_RULES;
 /* text matches the multipliers the engine applies */
 assert.equal(q.typeMult(D.MON.oldtusk,'weak'),R.boss.weak);assert.equal(q.typeMult(D.MON.boar,'weak'),R.normal.weak);
 assert.match(q.typeRuleText(D.MON.oldtusk),new RegExp(`\\+${Math.round((R.boss.weak-1)*100)}%.*${Math.round(R.boss.resist*100)}%`));
 assert.match(q.typeRuleText(D.MON.boar),new RegExp(`\\+${Math.round((R.normal.weak-1)*100)}%.*${Math.round(R.normal.resist*100)}%`));
 assert.match(D.AB.focus.text,new RegExp(`${R.boss.focus}×`));
 /* Old Tusk is weak to pierce: with no bow yet, the advice offers the shop's shortbow and arrows */
 S.town='mossbarrow';S.towns.mossbarrow={visited:true,boss:false};S.coins=1e5;for(const k of ['attack','strength','defence','hitpoints'])S.xp[k]=D.XPF[20];S.hp=q.maxHp();
 let adv=q.prepAdvice('oldtusk');let w=adv.find(x=>x.key==='weak');assert.ok(w&&/shortbow/i.test(w.title)&&/arrows/.test(w.text),'bows are open from the start: the advice offers one '+JSON.stringify(w));
 /* Ranged learned and a bow owned but no arrows: switch, and the advice names the missing arrows */
 S.unlocked.ranged=true;S.xp.ranged=D.XPF[20];S.inv.bow_oak=1;adv=q.prepAdvice('oldtusk');w=adv.find(x=>x.key==='weak');
 assert.match(w.title,/Switch to your oak shortbow/i);assert.match(w.text,/arrows/);
 S.inv.arrow_iron=100;adv=q.prepAdvice('oldtusk');assert.doesNotMatch(adv.find(x=>x.key==='weak').text,/also need arrows/);
 /* never suggests buying armour the player already owns */
 S.inv.iron_body=1;adv=q.prepAdvice('oldtusk');assert.ok(adv.some(x=>x.key==='equip:body'));assert.ok(!(adv.find(x=>x.key==='buy')||{items:[]}).items.includes('iron_body'));
 /* food: names the raw fish actually held */
 S.unlocked.cooking=true;S.xp.cooking=D.XPF[30];S.inv.raw_trout=12;adv=q.prepAdvice('oldtusk');assert.match(adv.find(x=>x.key==='food').text,/12 raw trout/);
});
test('preparation advice covers ability slots and boss specials',()=>{
 const {q}=harness();const S=q.S,D=q.data;
 S.town='ironpeak';S.towns.ironpeak={visited:true,boss:false};for(const k of ['attack','strength','defence','hitpoints'])S.xp[k]=D.XPF[44];S.hp=q.maxHp();S.inv.rune_sword=1;q.equipItem('rune_sword');S.abilities=[];
 let a=q.prepAdvice('frostmaw').find(x=>x.key==='abil');assert.ok(a&&/^Slot (Brace|Shield Bash)/.test(a.title),'empty slots: suggests answering the special first');
 S.abilities=['aimed'];a=q.prepAdvice('frostmaw').find(x=>x.key==='abil');assert.match(a.title,/Aimed Shot does nothing/);
 S.abilities=['power','second','execute'];a=q.prepAdvice('frostmaw').find(x=>x.key==='abil');assert.ok(a&&/Swap in (Brace|Shield Bash)/.test(a.title),'full slots that ignore the special: suggests a swap');
 S.abilities=['brace','power','second'];assert.ok(!q.prepAdvice('frostmaw').some(x=>x.key==='abil'),'nothing to say when the special is answered');
});
test('Herbalism and Enchanting: a named first goal, honest materials, and advice only when it helps',()=>{
 const {q,load}=harness();load('skill_expansion_data');load('lore');load('hunting');load('bestiary');load('skill_expansion');const S=q.S,D=q.data;
 for(const k of ['attack','strength','defence','hitpoints'])S.xp[k]=D.XPF[44];S.stats.craft=30;S.stats.smith=20;q.checkActionUnlocks&&q.checkActionUnlocks();S.unlocked.enchanting=true;S.xp.enchanting=D.XPF[10];
 S.inv.bronze_sword=1;S.inv.steel_body=1;q.equipItem('bronze_sword');q.equipItem('steel_body');
 const plan=q.enchantPlan();assert.equal(plan[0].id,'bronze_sword','the item that gains the biggest share comes first');assert.ok(plan[0].gain>plan[1].gain);
 assert.equal(plan[0].ready,false,'not ready without runes and a gem');S.inv.rune=20;S.inv.gem_sapphire=1;assert.equal(q.enchantPlan()[0].ready,true);
 /* advice: only for a boss you are likely to struggle with */
 S.town='ironpeak';S.towns.ironpeak={visited:true,boss:false};S.hp=q.maxHp();S.inv.potion_might=1;
 assert.ok(q.prepAdvice('frostmaw',{winRate:.4,wins:10,foodPerKill:5}).some(x=>x.key==='potion'),'Might offered when struggling');
 assert.ok(!q.prepAdvice('frostmaw',{winRate:.95,wins:23,foodPerKill:2}).some(x=>x.key==='potion'||x.key==='enchant'),'not pushed when already favoured');
assert.ok(q.prepAdvice('frostmaw',{winRate:.4,wins:10,foodPerKill:5}).some(x=>x.key==='enchant'),'a ready enchantment is offered');
 assert.ok(!q.prepAdvice('troll').some(x=>x.key==='potion'),'not for ordinary creatures');
});
test('Home leads with one next step that says how you will know it is done',()=>{
 const {q}=harness();const S=q.S,D=q.data;
 let next=q.journeyNext();assert.equal(next.action,'qstart');assert.match(q.journeyDoneWhen(next),/5 shrimp and 5 logs/);assert.doesNotMatch(q.journeyDoneWhen(next),/combat level/);
 q.startQuest('first_steps');S.q.first_steps.p=[3,0];next=q.journeyNext();assert.match(q.journeyDoneWhen(next),/3\/5 shrimp and 0\/5 logs/);
 S.q.first_steps={s:'done',p:[5,5]};S.unlocked.cooking=true;S.xp.cooking=D.XPF[3];const boss=D.QUESTS.find(x=>x.obj.some(o=>o.ev==='boss'));S.q[boss.id]={s:'active',p:[0]};
 next=q.journeyNext();if(/^Train for Grubnash/.test(next.title))assert.match(q.journeyDoneWhen(next),/combat level reaches 8/);
});
test('every boss requirement can be met by any single combat style',()=>{
 const {q}=harness();const S=q.S,D=q.data;
 for(const style of ['attack','ranged','magic']){for(const k of ['defence','hitpoints',style,...(style==='attack'?['strength']:[])])S.xp[k]=D.XPF[99];
  const top=q.combatLvl();for(const m of D.MONLIST.filter(x=>x.boss))assert.ok(top>=m.boss.req,`${style}-only (combat ${top}) can face ${m.id} (needs ${m.boss.req})`);
  for(const k of ['attack','strength','ranged','magic'])S.xp[k]=0;}
});
test('bestiary understanding: optional objectives with a fair alternative, rewarded with the next entry early',()=>{
 const {q,load}=harness();load('lore');load('bestiary');const S=q.S,D=q.data,m=D.MON.goblin,b=D.MON.frostmaw;
 S.beast.kills.goblin=5;const r0=q.research(m).rank;assert.equal(q.understanding(m).done,false);
 S.beast.weakWins={goblin:10};assert.ok(q.understanding(m).done,'10 weak-point wins');assert.equal(q.research(m).rank,r0+1,'next entry early');
 S.beast.weakWins={};const alt=q.understanding(m).altNeed;S.beast.kills.goblin=alt;assert.ok(q.understanding(m).done,'fair alternative: more defeats, any style');
 S.beast.kills.frostmaw=1;S.beast.answered={frostmaw:4};assert.equal(q.understanding(b).done,false);S.beast.answered.frostmaw=5;assert.ok(q.understood('frostmaw'));
 S.beast.answered={};S.beast.kills.frostmaw=3;assert.ok(q.understood('frostmaw'),'or three victories');
 const o=JSON.parse(JSON.stringify(S));delete o.beast.weakWins;delete o.beast.answered;assert.ok(q.validateSave(o),'older saves without the counters load');
});
test('style parity: at the same level a fighter and an archer have the same combat level and hit about as hard',()=>{
 const {q}=harness();const S=q.S,D=q.data;assert.ok(Math.abs(D.STYLE_TUNE.meleeLevel-4/3)<1e-9);
 const at=(style,L)=>{for(const k of Object.keys(S.xp))S.xp[k]=0;S.xp.defence=D.XPF[L];S.xp.hitpoints=D.XPF[L];S.equip={};S.ammo={id:null,n:0};
  if(style==='melee'){S.xp.attack=D.XPF[L];S.xp.strength=D.XPF[L];S.inv.mithril_sword=1;q.equipItem('mithril_sword');}
  else{S.unlocked.ranged=true;S.xp.ranged=D.XPF[L];S.inv.bow_maple=1;q.equipItem('bow_maple');S.inv.arrow_mithril=50;q.equipItem('arrow_mithril');}
  q.fxDirty();return {cl:q.combatLvl(),ps:q.pstats()};};
 const m=at('melee',45),r=at('ranged',45);assert.equal(m.cl,r.cl,'same combat level');assert.ok(Math.abs(D.STYLE_TUNE.level-4/3)<1e-9);
 const ratio=(m.ps.max*m.ps.acc)/(r.ps.max*r.ps.acc);assert.ok(ratio>.75&&ratio<1.35,`melee/ranged max*accuracy ratio ${ratio.toFixed(2)}`);
});
test('saved preparations: items conserved, missing and locked shown honestly, previous restored, build text private',()=>{
 const {q,load}=harness();load('skill_expansion_data');load('companions');load('loadouts');const S=q.S,D=q.data;
 for(const k of ['attack','strength','defence','hitpoints'])S.xp[k]=D.XPF[30];S.name='Secret Name';S.coins=987654;
 const count=()=>{const t={};for(const src of [S.inv,S.bank])for(const [k,n] of Object.entries(src))t[k]=(t[k]||0)+n;for(const [sl,id] of Object.entries(S.equip))if(sl!=='ammo')t[id]=(t[id]||0)+1;if(S.ammo.id)t[S.ammo.id]=(t[S.ammo.id]||0)+S.ammo.n;return JSON.stringify(Object.keys(t).sort().map(k=>[k,t[k]]));};
 for(const id of ['iron_sword','iron_helm','mithril_hammer','steel_shield'])S.inv[id]=1;S.bank.vipers_kiss=1;
 q.equipItem('iron_sword');q.equipItem('iron_helm');S.abilities=['power'];q.loadoutSave('Sword');
 q.equipItem('mithril_hammer');q.unequip('head');S.abilities=['power','brace'];q.loadoutSave('Hammer');
 const before=count();
 let p=q.loadoutPlan(q.loadouts()[0]);assert.ok(p.rows.some(r=>r.slot==='weapon'&&r.status==='equip'));assert.ok(p.rows.some(r=>r.slot==='head'&&r.status==='equip'));
 q.loadoutApply(q.loadouts()[0]);assert.equal(S.equip.weapon,'iron_sword');assert.equal(S.equip.head,'iron_helm');assert.equal(JSON.stringify(S.abilities),'["power"]');assert.equal(count(),before,'items conserved');
 q.loadoutApply(S.loadoutPrev);assert.equal(S.equip.weapon,'mithril_hammer','return to previous');assert.equal(count(),before);
 /* from the bank, missing and locked */
 const lo={name:'Test',equip:{weapon:'vipers_kiss',ring:'storm_feather',body:'rune_body'},abilities:['brace','ward'],spell:null,pet:'gobbo'};
 p=q.loadoutPlan(lo);const st=sl=>p.rows.find(r=>r.slot===sl).status;assert.equal(st('weapon'),'bank');assert.equal(st('ring'),'missing');assert.equal(st('body'),'locked');assert.ok(p.petMissing);
 const r=q.loadoutApply(lo);assert.equal(S.equip.weapon,'vipers_kiss','taken from the bank');assert.ok(!S.equip.ring,'nothing invented');assert.ok(r.skipped.some(x=>/Storm feather/i.test(x)));assert.equal(count(),before,'items conserved through the bank');
 /* the shared text carries the build, not the save */
 const t=q.buildText();assert.match(t,/combat \d+/);assert.match(t,/Venom/);assert.doesNotMatch(t,/Secret Name|987654|dashboard-quest/);
 const o=JSON.parse(JSON.stringify(S));delete o.loadouts;delete o.loadoutPrev;assert.ok(q.validateSave(o),'older saves load');
});
test('unique finds suggest a plan: honest source, guarantee progress, what it is good for, mystery kept',()=>{
 const {q,load}=harness();load('lore');load('bestiary');const S=q.S,D=q.data;
 for(const it of Object.values(D.ITEMS).filter(x=>x.unique))assert.ok(D.UNIQUE_USE[it.unique.key],'good-for text for '+it.id);
 let src=q.uniqueSource('leechfang');assert.match(src.text,/somewhere in Mossbarrow/,'mystery kept until the creature is met');assert.doesNotMatch(src.text,/wolf/i);
 S.beast.kills.wolf=3;S.upity={leechfang:40};src=q.uniqueSource('leechfang');assert.match(src.text,/Grey wolf/);assert.match(src.text,/guaranteed within 375 defeats \(40 so far\)/);
 S.uniqFound={leechfang:1};assert.doesNotMatch(q.uniqueSource('leechfang').text,/guaranteed/,'quiet once found');
 assert.match(q.uniqueSource('chief_helm').text,/first time you defeat/);
});
test('later regions: the destination follows the next boss and optional goals come from existing content',()=>{
 const {q,load}=harness();load('lore');load('bestiary');const S=q.S,D=q.data;
 for(const t of ['willowbrook','mossbarrow','saltmere'])S.towns[t]={visited:true,boss:true};S.towns.ironpeak={visited:true,boss:false};S.q.first_steps={s:'done',p:[5,5]};
 S.town='saltmere';assert.equal(q.journeyNext().a,'ironpeak','travel to the next boss region');
 S.town='ironpeak';for(const k of ['attack','strength','defence','hitpoints'])S.xp[k]=D.XPF[36];
 const fq=D.QUESTS.find(x=>x.obj.some(o=>o.ev==='boss'&&o.key==='frostmaw'));if(fq)S.q[fq.id]={s:'active',p:[0]};
 const n=q.journeyNext();assert.match(n.title,/Train for Frostmaw/);assert.match(q.journeyDoneWhen(n),/combat level reaches 45/);
 S.beast.kills.troll=5;const g=q.optionalGoals();assert.ok(g.length>=1&&g.length<=3);assert.ok(g.some(x=>/Thunderclap maul/.test(x.text)),'a unique to chase, with honest guarantee progress');
});
test('return and sharing: what changed while away, a boss victory remembered, a story without save data',()=>{
 const {q,load}=harness();load('adventures');load('lore');load('bestiary');load('journal');load('companions');load('loadouts');load('touches');const S=q.S,D=q.data;
 S.name='Tess';S.coins=123456;S.towns.willowbrook.boss=true;
 for(const id of Object.keys(D.BOSS_VOICES))assert.ok(D.MON[id]&&D.BOSS_VOICES[id].length===3,'voice and later note for '+id);
 S.journal=[];q.journal('boss','Grubnash is defeated.','skull');const h=q.ui.returnExtras({real:6*3600e3,items:{}});assert.match(h,/Since you left/);assert.match(h,/Grubnash is defeated/);
 const t=q.storyText();assert.match(t,/Tess · Hero level/);assert.match(t,/Bosses defeated: Grubnash/);assert.doesNotMatch(t,/123456|dashboard-quest|"inv"/);
});
test('restoration: new Willowbrook projects, regional materials, villager voices and legacy bonuses',()=>{
 const {q,load}=harness();load('fx');load('routes');const S=q.S,D=q.data;S.coins=1e6;
 const wb=q.projectsForTown('willowbrook').map(([id])=>id);for(const id of ['well','inn','forge','garden','library','watchtower'])assert.ok(wb.includes(id),id);
 for(const [id,p] of Object.entries(D.PROJECTS)){assert.ok(D.PROJECT_VOICES[id],'voice for '+id);for(const item of Object.keys(p.cost))assert.ok(item==='coins'||D.ITEMS[item],id+' cost item '+item);}
 // a skill-specific bonus applies once and never produces NaN
 S.inv.bar_bronze=10;S.inv.log_oak=15;const before=q.fx().speed.smithing||0;assert.equal(q.finishProject('forge'),true);
 assert.ok(Math.abs((q.fx().speed.smithing||0)-before-.05)<1e-9);assert.ok(Object.values(q.fx()).every(v=>typeof v==='object'||Number.isFinite(v)));
 // a save that finished a regional project before this update keeps +2% regen and gains the new reward
 const regen0=q.fx().regen,coin0=q.fx().coin;S.projects.jetty=true;q.fxDirty();
 assert.ok(Math.abs(q.fx().regen-regen0-.02)<1e-9);assert.ok(Math.abs((q.fx().speed.fishing||0)-.05)<1e-9);assert.equal(q.fx().coin,coin0);
 const save=q.exportSave();assert.equal(q.importSave(save),true);assert.equal(q.S.projects.forge,true);assert.equal(q.S.projects.jetty,true);
});
test('the Restore Willowbrook destination follows the next unfinished project and routes missing materials',()=>{
 const {q,load}=harness();load('routes');const S=q.S;S.journey='village';S.projects.well=true;S.projects.inn=true;
 const step=q.journeyNext('village');assert.ok(/smithing|bronze/i.test(step.title+step.detail),step.title);
 S.unlocked.smithing=true;S.xp.smithing=q.data.XPF[5];S.xp.fishing=q.data.XPF[40];const s2=q.journeyNext('forge');assert.equal(s2.action,'journeytask');assert.equal(s2.a,'recipe');
 for(const id of Object.keys(q.data.PROJECTS))if(q.data.PROJECTS[id].town==='willowbrook')S.projects[id]=true;
 assert.equal(q.journeyNext('village').title,'Willowbrook is restored');
});
test('discoveries are rare, once only, hidden until found, and never fire in forecasts',()=>{
 const {q,load}=harness();load('routes');load('adventures');const S=q.S,D=q.data;
 const first=D.QM.am_map;assert.equal(q.questState(first),'locked');assert.equal(q.questHidden(first),true);
 S.xp.woodcutting=D.XPF[20];S.town='willowbrook';
 q.forecasting=true;q.qev('chop','oak',5000);q.forecasting=false;assert.equal(q.discovered('weathered_map'),false,'forecasts never discover');
 q.qev('chop','oak',D.DISCOVERIES.weathered_map.pity);assert.equal(q.discovered('weathered_map'),true,'the pity counter guarantees it');
 assert.equal(q.have('weathered_map'),1);assert.equal(q.questState(first),'new');assert.equal(q.questHidden(first),false);
 assert.equal(q.makeDiscovery('weathered_map'),false);q.qev('chop','oak',5000);assert.equal(q.have('weathered_map'),1,'never granted twice');
 const save=q.exportSave();assert.equal(q.importSave(save),true);assert.equal(q.discovered('weathered_map'),true);
});
test('discoveries made while away are recorded for the welcome summary without live alerts',()=>{
 const {q,load}=harness();load('adventures');const S=q.S,D=q.data;S.town='gloomfen';S.towns.gloomfen={visited:true,boss:false};
 const coins=S.coins,live=q.sim;q.sim={on:true,xp:{},items:{},coins:0,kills:0,levels:[],notes:[],eaten:0,died:false};q.qev('kill','zombie',D.DISCOVERIES.forgotten_shrine.pity);q.sim=live;
 assert.equal(q.discovered('forgotten_shrine'),true);assert.equal(S.disc.forgotten_shrine.away,true);assert.deepEqual([...q.awayFinds],['forgotten_shrine']);
 assert.ok(S.coins>=coins+800,'the shrine reward is paid');const after=S.coins;q.makeDiscovery('forgotten_shrine');assert.equal(S.coins,after,'only once');
});
test('the lost traveller choice needs real meals and pays out once',()=>{
 const {q,load}=harness();load('adventures');const S=q.S;q.makeDiscovery('lost_traveller');
 S.inv={};assert.equal(q.chooseDiscovery('lost_traveller','share'),false,'cannot share without meals');
 S.inv.shrimp=7;const xp=S.xp.fishing;assert.equal(q.chooseDiscovery('lost_traveller','share'),true);assert.equal(q.have('shrimp'),2);
 assert.ok(S.xp.fishing>xp);assert.equal(q.chooseDiscovery('lost_traveller','directions'),false,'one choice only');
});
test('an adventure chains quests across skills and ends in a village relic project',()=>{
 const {q,load}=harness();load('routes');load('adventures');const S=q.S,D=q.data;S.coins=10000;
 q.makeDiscovery('weathered_map');q.startQuest('am_map');S.inv.shrimp=8;q.qev('chop','oak',15);
 assert.equal(q.questState(D.QM.am_map),'ready');q.claimQuest('am_map');assert.equal(q.questState(D.QM.am_map),'done');
 assert.equal(q.questState(D.QM.am_mill),'locked','needs Mossbarrow');S.towns.mossbarrow={visited:true,boss:false};assert.equal(q.questState(D.QM.am_mill),'new');
 q.startQuest('am_mill');q.qev('guide','scarecrow');q.qev('kill','scarecrow',8);q.claimQuest('am_mill');
 q.startQuest('am_box');q.qev('smelt','bar_bronze',5);q.qev('harvest','potato',5);q.claimQuest('am_box');
 assert.equal(q.have('millers_bell'),1);assert.ok(q.projectsForTown('willowbrook').some(([id])=>id==='bell'),'relic project appears with its artefact');
 const coin=q.fx().coin;S.town='willowbrook';assert.equal(q.finishProject('bell'),true);assert.equal(q.have('millers_bell'),0);assert.ok(Math.abs(q.fx().coin-coin-.03)<1e-9);
 assert.ok(q.projectsForTown('willowbrook').some(([id])=>id==='bell'),'a displayed relic stays listed');
 const {q:q2,load:l2}=harness();l2('adventures');assert.ok(!q2.projectsForTown('willowbrook').some(([id])=>id==='bell'),'hidden without the artefact');
});
test('a save from before this update loads with safe defaults, keeps its progress and plays on',()=>{
 const {q,load}=harness();load('routes');load('adventures');load('feel');const D=q.data;
 const old=q.newState();delete old.farm.next;delete old.disc;delete old.settings.masterVol;delete old.settings.ambience;delete old.settings.ambVol;
 old.projects={well:true,market:true};old.towns.mossbarrow={visited:true,boss:false};old.coins=777;old.xp.fishing=D.XPF[20];old.q.first_steps={s:'done',p:[5,5]};old.inv={raw_shrimp:12};
 const save=Buffer.from(JSON.stringify(old)).toString('base64');assert.equal(q.importSave(save),true);const S=q.S;
 assert.equal(S.farm.next,null);assert.deepEqual({...S.disc},{});assert.equal(S.settings.masterVol,1);assert.equal(S.settings.ambience,true);
 assert.equal(S.coins,777);assert.equal(S.inv.raw_shrimp,12);assert.equal(S.projects.market,true);assert.equal(q.questState(D.QM.first_steps),'done');
 assert.ok(q.fx().regen>=.12&&q.fx().coin>=.03,'legacy +2% recovery and the new market reward both apply');
 assert.equal(q.questHidden(D.QM.am_map),true);assert.ok(q.journeyNext());
 q.startAct('fish','shrimp',{quiet:true});const sum=q.simulate(2*3600000);assert.ok(sum&&Object.keys(sum.xp).length,'offline progress runs');assert.ok(Number.isFinite(S.coins));
});
test('combat level shows its progress and catches up when it trails the Hero level',()=>{
  const {q}=harness(),S=q.S,D=q.data;
  const c0=q.combatProgress();assert.equal(c0.lvl,q.combatLvl());assert.equal(c0.next,c0.lvl+1);assert.ok(c0.pct>=0&&c0.pct<100);assert.ok(c0.best&&c0.best.xp>0,'a cheapest route to the next combat level');
  /* following the suggested route really raises the combat level */
  S.xp[c0.best.skill]+=c0.best.xp;assert.equal(q.combatLvl(),c0.next);
  /* no bonus while combat keeps pace; +15% per level behind, capped */
  const base=q.xpMult('strength');assert.equal(q.combatCatchUp(),0);
  S.xp.fishing=D.XPF[40];S.xp.woodcutting=D.XPF[40];const behind=q.advLvl()-q.combatLvl();assert.ok(behind>0);
  assert.ok(Math.abs(q.combatCatchUp()-Math.min(2,.15*(q.advLvl()-q.combatExact())))<1e-9);
  /* the chip's permanent bonus never includes catch-up, and no percentage shown for progress exceeds 100 */
  assert.ok(q.xpBonusBase('strength')<q.xpMult('strength'));assert.ok(Math.abs(q.xpBonusBase('fishing')-q.xpMult('fishing'))<1e-12);
  for(const sk of ['attack','strength','defence','hitpoints']){const p=q.pctNext(sk);assert.ok(p>=0&&p<=100);}
  const cp=q.combatProgress();assert.ok(cp.pct>=0&&cp.pct<100);
  /* catch-up eases off smoothly: a little combat XP lowers it a little, never in a jump */
  const before=q.combatCatchUp();S.xp.strength+=50;const after=q.combatCatchUp();assert.ok(after<=before&&before-after<.05);assert.ok(q.xpMult('strength')>base*1.5,'combat skills learn faster while behind');
  const fish=q.xpMult('fishing');assert.ok(Math.abs(fish-(1+.005*(q.lvl('fishing')-1))*(1+.0025*(q.advLvl()-1)))<1e-9,'gathering skills are unaffected');
});
test('every pinnable project survives save, reload, export and import (browser and desktop storage)',()=>{
  for(const desktop of [false,true]){
    const files=new Map(),bridge=desktop?{getItem:k=>files.get(k)||null,setItem:(k,v)=>files.set(k,v),removeItem:k=>files.delete(k)}:undefined;
    const {q,load}=harness(bridge);load('routes');load('adventures');const D=q.data,ids=Object.keys(D.PROJECTS);
    assert.ok(ids.length>=16&&['forge','garden','library','watchtower','bell','lamps','star'].every(id=>ids.includes(id)),'village, regional and relic projects are all defined');
    for(const id of ids){
      q.S.pinnedProject=null;assert.equal(q.pinProject(id),true);assert.equal(q.S.pinnedProject,id);
      q.S.xp.fishing=1234;assert.ok(q.save(),id+' saves');
      q.S=q.newState();assert.equal(q.load(),true,id+' pin reloads');assert.equal(q.S.pinnedProject,id);assert.equal(q.S.xp.fishing,1234,'progress kept');
      const code=q.exportSave();q.S=q.newState();assert.equal(q.importSave(code),true,id+' pin imports');assert.equal(q.S.pinnedProject,id);
    }
  }
});
test('a save rejected by the old well/inn-only pin rule loads, and an unknown pin is cleared without losing the hero',()=>{
  const {q,storage}=harness();const S=q.S;S.xp.woodcutting=5000;S.coins=777;S.pinnedProject='forge';
  storage.set('dashboard-quest-save-v2',JSON.stringify(S));q.S=q.newState();
  assert.equal(q.load(),true);assert.equal(q.S.pinnedProject,'forge');assert.equal(q.S.coins,777);
  for(const bad of ['obsolete_project',42,{x:1},'__proto__']){
    const o=JSON.parse(JSON.stringify(S));o.pinnedProject=bad;storage.set('dashboard-quest-save-v2',JSON.stringify(o));q.S=q.newState();
    let ok;try{ok=q.load();}catch(e){ok=false;}
    if(typeof bad==='string'&&bad!=='__proto__'){assert.equal(ok,true,'obsolete pin does not reject the hero');assert.equal(q.S.pinnedProject,null);assert.equal(q.S.xp.woodcutting,5000);}
    else if(ok)assert.equal(q.S.pinnedProject,null,'malformed pin never survives');
  }
});
test('keepsake relics cannot be sold from any path, ordinary zero-value items still can',()=>{
  const {q,load}=harness();load('routes');load('adventures');const S=q.S,D=q.data;
  const relics=Object.keys(D.ITEMS).filter(id=>D.ITEMS[id].type==='relic');assert.equal(relics.length,6);
  for(const id of relics){
    S.inv[id]=1;S.bank[id]=1;const coins=S.coins;
    for(const from of ['pack','bank',undefined])assert.equal(q.sell(id,1,from),undefined,id+' refused from '+from);
    assert.equal(S.inv[id],1);assert.equal(S.bank[id],1);assert.equal(S.coins,coins);assert.equal(q.sellable(id),false);
    delete S.inv[id];delete S.bank[id];
  }
  S.inv.burnt=3;S.inv.feather=4;q.sellJunk();assert.ok(!S.inv.burnt,'junk (zero value) still sells in bulk');
  assert.equal(q.sell('feather',2,'pack'),2*D.ITEMS.feather.val);assert.equal(S.inv.feather,2);
});
test('each relic is recovered once if lost before the keepsake rule, never after its quest or project used it',()=>{
  const {q,load}=harness();load('routes');load('adventures');const S=q.S;
  const lose=id=>{delete S.inv[id];delete S.bank[id];};
  /* discovery keepsakes */
  for(const d of ['weathered_map','rusted_lantern','star_shard']){
    assert.deepEqual([...q.recoverRelics()],[],'nothing owed before the discovery');
    q.makeDiscovery(d);assert.equal(q.have(d),1);lose(d);
    assert.deepEqual([...q.recoverRelics()],[d]);assert.equal(q.have(d),1);
    assert.deepEqual([...q.recoverRelics()],[],'no duplicate on a second pass');assert.equal(q.have(d),1);
  }
  /* the star shard is consumed by its final delivery and is not owed afterwards */
  S.q.af_home={s:'done',p:[0,0]};lose('star_shard');S.inv.star_heart=1;
  assert.ok(!q.recoverRelics().includes('star_shard'));assert.equal(q.have('star_shard'),0);
  /* finale relics: owed after their quest, until their project displays them */
  for(const [quest,relic,project] of [['am_box','millers_bell','bell'],['al_rest','lamplighter_lens','lamps'],['af_home','star_heart','star']]){
    S.q[quest]={s:'done',p:[0,0]};lose(relic);
    assert.deepEqual([...q.recoverRelics()],[relic],relic+' restored after an accidental loss');
    assert.equal(q.have(relic),1);const xp=JSON.stringify(S.xp),coins=S.coins;
    assert.deepEqual([...q.recoverRelics()],[]);assert.equal(JSON.stringify(S.xp),xp,'no quest reward repeats');assert.equal(S.coins,coins);
    S.town='willowbrook';S.coins+=1e6;assert.equal(q.finishProject(project),true,project+' can be completed with the recovered relic');
    assert.equal(q.have(relic),0,'the project consumes it');assert.deepEqual([...q.recoverRelics()],[],'not owed once displayed');
  }
});
test('a legacy save that sold a quest relic loads with it restored, and the restoration can still be finished',()=>{
  const {q,load,storage}=harness();load('routes');load('adventures');const S=q.S;
  S.disc.star_shard={at:1,town:'skyreach'};S.q.af_star={s:'done',p:[15,8]};S.q.af_fall={s:'done',p:[1,15,6]};S.q.af_home={s:'active',p:[10,0]};
  S.q.am_box={s:'done',p:[5,5]};
  storage.set('dashboard-quest-save-v2',JSON.stringify(S));q.S=q.newState();
  assert.equal(q.load(),true);assert.equal(q.have('star_shard'),1,'final delivery possible again');assert.equal(q.have('millers_bell'),1);
  assert.ok(q.projectsForTown('willowbrook').some(([id])=>id==='bell'),'the bell project is visible again');
  const again=q.exportSave();q.S=q.newState();assert.equal(q.importSave(again),true);assert.equal(q.have('star_shard'),1,'import does not duplicate');assert.equal(q.have('millers_bell'),1);
});
test('Emberfall has a discovery: the ashen anvil is found by mining there and its choice spends one ember core once',()=>{
  const {q,load}=harness();load('routes');load('adventures');const S=q.S,D=q.data;
  assert.equal(D.DISCOVERIES.ashen_anvil.place,'emberfall');
  S.town='emberfall';S.towns.emberfall={visited:true,boss:false};for(let i=0;i<900&&!q.discovered('ashen_anvil');i++)q.qev('mine','runite');
  assert.ok(q.discovered('ashen_anvil'),'found within its pity limit while mining in Emberfall');
  S.town='willowbrook';assert.equal(q.chooseDiscovery('ashen_anvil','quench'),false,'needs an ember core');
  S.unlocked.smithing=true;S.inv.ember_core=2;const xp=S.xp.smithing;assert.equal(q.chooseDiscovery('ashen_anvil','quench'),true);
  assert.equal(S.inv.ember_core,1,'exactly one core spent');assert.ok(S.xp.smithing>xp);
  assert.equal(q.chooseDiscovery('ashen_anvil','citadel'),false,'the choice is made once');assert.equal(S.inv.ember_core,1);
});
test('every recipe, gathering spot and item requirement is reachable within the level cap',()=>{
  const {q,load}=harness();load('routes');load('adventures');const D=q.data,cap=D.XPF.length-1;
  assert.deepEqual(Object.values(D.RECIPES).filter(r=>r.lvl>cap).map(r=>r.id),[]);
  assert.deepEqual(Object.values(D.NODES).flat().filter(n=>n.lvl>cap).map(n=>n.id),[]);
  assert.deepEqual(Object.values(D.ITEMS).filter(it=>it.req&&Object.values(it.req).some(v=>v>cap)).map(it=>it.id),[]);
});
test('progression gates are sensible: basic leather, the Ranged quest, shop stock and unlock chains',()=>{
  const {q,load}=harness();load('routes');load('adventures');const S=q.S,D=q.data;
  /* basic leather is wearable without Ranged; finer hides still need it */
  S.inv.leather_vest=1;assert.equal(q.skillUnlocked('ranged'),true,'bows are open from the start (Nov 2026)');assert.equal(q.equipItem('leather_vest').ok,true,'leather body wearable at Defence 1');
  S.inv.frost_vest=1;assert.equal(q.equipItem('frost_vest').ok,false);
  /* the Ranged quest needs only Mossbarrow and Hero 18, not an unrelated side quest */
  S.towns.mossbarrow={visited:true,boss:false};S.towns.willowbrook.boss=true;while(q.advLvl()<18)S.xp.fishing+=2000;
  assert.equal(q.questState(D.QM.mq_ranged),'new','A Hunter’s Bow is available at Hero 18 in Mossbarrow');
  /* every fighting style is open from the start: a staff can be bought and worn straight away */
  S.coins=5000;assert.ok(!q.lockedSkillFor('staff_normal'));q.buy('staff_normal');assert.ok(S.inv.staff_normal>=1);assert.equal(q.equipItem('staff_normal').ok,true);q.equipItem('bronze_sword');
  /* bows and staves never drop before their skill is learned */
  S.town='willowbrook';S.xp.attack=S.xp.strength=S.xp.defence=S.xp.hitpoints=D.XPF[40];S.inv.bread=5000;const kills=S.stats.kill;
  q.startAct('fight','goblin',{quiet:true});q.simulate(6*3600000);assert.ok(S.stats.kill-kills>2000,'thousands of goblins fought');
  /* every skill-teaching quest is reachable: its requirement chain never needs the skill it teaches, and every link exists */
  for(const mq of D.QUESTS.filter(x=>x.main)){const seen=new Set();let cur=mq;
    while(cur&&cur.req){assert.ok(D.QM[cur.req],mq.id+' requires a missing quest '+cur.req);assert.ok(!seen.has(cur.req),mq.id+' has a circular requirement');seen.add(cur.req);cur=D.QM[cur.req];
      assert.ok(!cur.main||cur.unlocks!==mq.unlocks);}
    for(const o of mq.obj){if(o.ev==='kill'||o.ev==='boss')assert.ok(D.MON[o.key],mq.id+' targets a real creature');if(o.ev==='deliver')assert.ok(D.ITEMS[o.key],mq.id+' delivers a real item');}
  }
});
test('combat balance review: empty ability slots fill for a fight, the final boss has a route for every style, Fury is always on, and advice names clear upgrades',()=>{
  const {q}=harness();const D=q.data,S=q.S;
  /* empty slots fill with abilities you have (Brace first), never replacing a choice; removing one turns it off */
  for(const k of ['attack','strength','defence','hitpoints'])S.xp[k]=D.XPF[30];q.fxDirty();
  S.abilities=[];const added=q.fillAbilities();assert.deepEqual(S.abilities,['brace','power']);assert.equal(added.length,2);
  S.abilities=['second'];q.fillAbilities();assert.deepEqual(S.abilities,['second','brace'],'a chosen ability stays');
  q.toggleAbility('second');assert.equal(S.settings.autoAbil,false);S.abilities=[];q.fillAbilities();assert.deepEqual(S.abilities,[],'removing an ability yourself turns auto-fill off');
  S.settings.autoAbil=true;S.abilities=[];
  /* the Hollow King: each of melee (crush), magic (aether) and ranged (pierce) has a weak phase and a phase it is not resisted in */
  const P=D.HOLLOW_PHASES;for(const t of ['crush','aether','pierce']){assert.ok(P.some(p=>p.weak.includes(t)),t+' has a weak phase');assert.ok(P.some(p=>!p.resist.includes(t)),t+' is not resisted in every phase');}
  /* Fury is noticeable at full health */
  assert.match(D.ITEMS.berserkers_torc.unique.text,/\+10% damage/);
  /* advice names a clearly better owned piece */
  S.inv.bronze_body=1;q.equipItem('bronze_body');S.inv.steel_body=1;S.hp=q.maxHp();const steelOk=q.canEquip('steel_body').ok;
  const adv=q.prepAdvice('goblin');if(steelOk)assert.ok(adv.some(a=>a.key==='upgrade'&&/steel/.test(a.title)),'advice: '+JSON.stringify(adv.map(a=>a.title)));
});
test('first-hour polish: combat XP stops at the creature\'s health, and a first boss victory ends the fight',()=>{
  const {q}=harness();const D=q.data,S=q.S;
  for(const k of ['attack','strength','defence','hitpoints'])S.xp[k]=D.XPF[60];q.fxDirty();S.hp=q.maxHp();S.inv.shrimp=50;
  const m=D.MON.chicken,split=q.xpSplit('melee').reduce((n,[,per])=>n+per,0),before=S.xp.melee+S.xp.defence;
  q.startAct('fight','chicken',{quiet:true});const k0=S.stats.kill||0;q.advanceTime(120000,120000,0);const kills=(S.stats.kill||0)-k0;
  const gained=S.xp.melee+S.xp.defence-before,cap=kills*m.hp*split*q.xpMult('melee')*1.05+1;
  assert.ok(kills>0,'the hero fights');assert.ok(gained<=cap,`XP per kill is capped by the chicken's health: ${gained} <= ${cap}`);
  q.stopAct(true);
  /* Grubnash, first time: the fight stops after the victory instead of an instant rematch */
  S.town='willowbrook';S.towns.willowbrook={visited:true,boss:false};S.hp=q.maxHp();q.startAct('fight','grubnash',{quiet:true});
  let t=0;while(q.act&&t<600000&&!S.towns.willowbrook.boss){q.advanceTime(2000,2000,q.act?q.act.progress||0:0);t+=2000;}
  assert.equal(S.towns.willowbrook.boss,true,'Grubnash falls');assert.equal(q.act,null,'and the fight ends there');
});
test('gear arrows follow the stat table: gains outweighing losses are green, the reverse red, for every slot', () => {
  const {q}=harness();const D=q.data,S=q.S;for(const k of Object.keys(S.xp))S.xp[k]=D.XPF[99];q.fxDirty();
  S.equip.weapon='bronze_dagger';assert.equal(q.gearVerdict('iron_sword'),'up','Soldier\'s Blade beats the Bronze Knife on Attack and Strength, even though it swings slower');
  const gear=Object.values(D.ITEMS).filter(i=>i.slot&&i.slot!=='ammo'&&i.type!=='tool');let n=0;
  for(const it of gear){const others=gear.filter(g=>g.slot===it.slot&&g.id!==it.id);S.equip[it.slot]=others[0]&&others[0].id;if(!S.equip[it.slot])continue;
    const v=q.gearVerdict(it.id),net=q.gearNet(it.id);if(v==null&&!q.canEquip(it.id).ok)continue;n++;
    if(net>0)assert.equal(v,'up',it.id);else if(net<0)assert.ok(v==='down'||v==='unique',it.id);else assert.notEqual(v,'up',it.id);S.equip[it.slot]=null;}
  assert.ok(n>60,'audited '+n+' items');
});
test('quests recommend a Hero, Combat and skill level worked out from their objectives', () => {
  const {q}=harness();const D=q.data;
  assert.deepEqual({...q.questRec(D.QM.goblin_menace)},{hero:1,combat:D.MON.goblin?D.MON[D.QM.goblin_menace.obj.find(o=>o.ev==='kill'||o.ev==='boss').key].cl:5,skill:null});
  const deep=q.questRec(D.QM.deep_vein);assert.equal(deep.skill.sk,'mining');assert.ok(deep.skill.lvl>1);
  for(const x of D.QUESTS){const r=q.questRec(x);assert.ok(r.hero>=1&&Number.isFinite(r.combat),x.id);if(x.town!=='willowbrook')assert.ok(r.hero>1,x.id+' (adventures take their region\'s Hero level)');}
  assert.ok(q.questRecScore(D.QM.crownfall)>q.questRecScore(D.QM.first_steps),'late quests sort after early ones');
});
test('projects are built in deliveries: stages rise, saves keep partial work, completion grants the benefit', () => {
  const {q}=harness();const S=q.S;S.town='willowbrook';S.inv.log_normal=12;S.coins=0;
  assert.equal(q.projectStage('well'),0);assert.ok(q.projectGive('well','log_normal')>0);assert.equal(S.inv.log_normal||0,0,'logs handed over');
  assert.equal(S.projectGiven.well.log_normal,12);assert.ok(q.projectStage('well')>=1&&q.projectStage('well')<4,'partly built');
  assert.equal(q.projectNeed('well').log_normal,8);
  const loaded=q.validateSave?q.validateSave(JSON.parse(JSON.stringify(S))):null;if(loaded)assert.equal(loaded.projectGiven.well.log_normal,12,'partial deliveries survive a save');
  S.inv.log_normal=8;S.coins=25;assert.equal(q.finishProject('well'),true);assert.equal(S.projects.well,true);assert.ok(!S.projectGiven.well);assert.equal(q.projectStage('well'),4);
  S.town='mossbarrow';S.inv.log_hazel=30;assert.equal(q.projectGive('moss_windmill','log_hazel'),30);assert.equal(q.projectStage('moss_windmill'),2,'one of three materials in: a third built');
});
test('cook any fish you hold (level sets the burn), gentler burning, thieving shop prices and chests, selling animals', () => {
  const {q}=harness();const D=q.data,S=q.S;S.unlocked.cooking=true;S.xp.cooking=D.XPF[5];
  const lob=D.RECIPES.cook_lobster;assert.equal(q.recipeLvlOk(lob),false,'not without the raw fish');S.inv.raw_lobster=3;assert.equal(q.recipeLvlOk(lob),true,'a caught fish can always be cooked');
  assert.ok(q.burnChance(lob)>.6,'far below the recipe level it mostly burns');assert.ok(q.burnChance(D.RECIPES.cook_shrimp)<=.3,'at or above level the burn chance starts at 30% or less');
  S.xp.cooking=D.XPF[99];assert.ok(q.burnChance(lob)<=.02);
  assert.equal(q.buyPrice('bronze_sword'),D.ITEMS.bronze_sword.buy,'no thieving, no discount');S.unlocked.thieving=true;S.xp.thieving=D.XPF[99];
  assert.ok(q.buyPrice('iron_sword')<D.ITEMS.iron_sword.buy&&q.sellPrice('iron_sword')>D.ITEMS.iron_sword.val,'a trained thief haggles both ways');
  S.towns.mossbarrow={visited:true,boss:false};S.unlocked.farming=true;S.xp.farming=D.XPF[30];S.coins=99999;S.farm.pensBought=Math.max(1,S.farm.pensBought);const A=D.ANIMALS[0];q.buyAnimal(A.id);
  const c=S.coins;assert.equal(q.sellAnimal(0),true);assert.equal(S.farm.animals.length,0,'the pen is free');assert.equal(S.coins-c,Math.floor(A.price/2));
});
test('owned tools are equipped: they keep working but take no backpack slot', () => {
  const {q}=harness();const D=q.data,S=q.S;const pick=Object.keys(D.ITEMS).find(id=>D.ITEMS[id].type==='tool'&&/pick/.test(id))||Object.keys(D.ITEMS).find(id=>D.ITEMS[id].type==='tool');
  const before=q.packSlots();S.inv[pick]=1;assert.equal(q.packSlots(),before,'a tool does not use a backpack slot');assert.ok(q.have(pick)>0,'and is still owned');
});
test('Carpentry, Sailing and Beastmastery: planks and boats, voyages that need a big enough boat, companion training', () => {
  const {q,load}=harness();load('skills_new_data');load('skills_new');const D=q.data,S=q.S;for(const k of ['carpentry','sailing','beastmastery'])S.xp[k]=S.xp[k]||0;
  for(const k of ['woodcutting','hunting'])S.xp[k]=D.XPF[20];S.unlocked.carpentry=true;
  S.inv.log_normal=40;S.inv.string=8;assert.ok(q.startAct('recipe','saw_normal',{quiet:true}));q.simulate(60000);q.stopAct(true);assert.ok(q.have('plank_normal')>=12,'planks sawn');
  S.xp.carpentry=D.XPF[10];assert.ok(q.startAct('recipe','build_skiff',{quiet:true}));q.simulate(30000);q.stopAct(true);assert.ok(q.have('boat_skiff')>=1,'a skiff built');
  assert.equal(q.isTool('boat_skiff'),true,'boats are moored, not carried');
  S.unlocked.sailing=true;assert.equal(q.startAct('sail','smugglers_cay',{quiet:true}),false,'a skiff cannot reach Smugglers’ Cay');
  assert.ok(q.startAct('sail','gull_rock',{quiet:true}));const c=S.coins;q.simulate(120000);q.stopAct(true);assert.ok(S.stats.voyage>=4&&S.coins>c&&S.xp.sailing>0,'voyages pay out');
  const pet=D.PETS[0].id;S.pets.owned[pet]={aff:0,found:1};S.unlocked.beastmastery=true;assert.ok(q.startAct('train',pet,{quiet:true}));q.simulate(180000);q.stopAct(true);
  assert.ok(q.petLevel(pet)>=2&&S.xp.beastmastery>0,'training raises the companion');S.xp.beastmastery=D.XPF[50];assert.ok(Math.abs(q.beastMult()-1.25)<.01,'Beastmastery 50: companion bonuses x1.25');
});
test('the new skills unlock from things you make, and each has a purpose: planks in projects and furniture, sea legs, befriending with traps', () => {
  const {q,load}=harness();load('creatures_expanded');load('lore');load('hunting');load('skills_new_data');load('skills_new');const D=q.data,S=q.S;for(const k of ['carpentry','sailing','beastmastery'])S.xp[k]=S.xp[k]||0;
  assert.equal(q.skillUnlocked('carpentry'),false);S.inv.tool_handsaw=1;assert.equal(q.skillUnlocked('carpentry'),true,'a smithed handsaw opens Carpentry');
  assert.equal(q.skillUnlocked('beastmastery'),false);S.inv.wooden_trap=3;for(const k of ['attack','strength','defence','hitpoints'])S.xp[k]=D.XPF[12];q.fxDirty();assert.equal(q.skillUnlocked('beastmastery'),true,'three traps and Combat 10 open Beastmastery');
  assert.ok(D.RECIPES.smith_handsaw&&D.RECIPES.smith_handsaw.lvl<=5,'the handsaw is an early smithing recipe');
  const tiers=D.ROOMS.flatMap(r=>r.furn).flatMap(f=>f.costs.slice(1));assert.ok(tiers.some(c=>Object.keys(c).some(k=>k.startsWith('plank_'))),'furniture upgrades ask for planks');
  S.xp.sailing=D.XPF[40];S.unlocked.sailing=true;const fs=q.extraSpeed('fishing');S.unlocked.sailing=false;assert.ok(fs-q.extraSpeed('fishing')>.1,'sea legs: Sailing 40 makes Fishing 12% faster');
  S.unlocked.beastmastery=true;const town='willowbrook',sig=q.signatureOf(town);assert.ok(sig,'each region has a signature companion to befriend');
  S.inv.wooden_trap=200;assert.ok(q.startAct('train','lure:'+town,{quiet:true}));q.simulate(60*60000);q.stopAct(true);
  assert.ok(S.pets.owned[sig.id],'an hour of traps befriends the region’s companion');assert.ok(S.inv.wooden_trap<200,'traps wear out');
});
test('field-guide entries: counts fill them, each makes that one task faster, and the save keeps them',()=>{
  const {q}=harness();const S=q.S,D=q.data;
  assert.equal(q.mastStars('fish','shrimp'),0);const d0=q.durFor('fish','shrimp');
  S.mast={'fish:shrimp':25};assert.equal(q.mastStars('fish','shrimp'),1);assert.ok(q.durFor('fish','shrimp')<d0,'one entry: faster');
  S.mast['fish:shrimp']=1500;assert.equal(q.mastStars('fish','shrimp'),5);assert.equal(q.mastExtra('fish','shrimp'),.1);assert.ok(Math.abs(q.durFor('fish','shrimp')/d0-.9)<.02,'five entries: 10% faster');
  assert.equal(q.mastSpeed('brew','potion_might'),0,'potions have no timer');S.mast['brew:potion_might']=100;assert.equal(q.mastExtra('brew','potion_might'),.04);
  /* doing the task counts it; a fight does not */
  S.mast={};assert.ok(q.startAct('fish','shrimp',{quiet:true}));q.simulate(5*60000);q.stopAct(true);assert.ok(S.mast['fish:shrimp']>10,'catches are counted');
  assert.equal(Object.keys(S.mast).some(k=>k.startsWith('fight:')),false);
  /* crops count on harvest and then grow faster */
  S.unlocked.farming=true;S.xp.farming=D.XPF[10];const c=D.CROPS[0],g0=q.growDur(c);S.mast['crop:'+c.id]=300;assert.ok(q.growDur(c)<g0,'studied crops grow faster');
  /* round trip */
  S.mast['wood:oak']=42;const snap=q.exportSave();S.mast={};assert.ok(q.importSave(snap));assert.equal(q.S.mast['wood:oak'],42,'entries survive export and import');
  const old=JSON.parse(JSON.stringify(q.S));delete old.mast;assert.ok(q.validateSave(old),'saves from before the field guide load');q.S=old;assert.equal(q.mastStars('wood','oak'),0);
});
test('queue: the next task starts by itself, also while away, and the save keeps the queue',()=>{
  const {q}=harness();const S=q.S,D=q.data;S.xp.woodcutting=D.XPF[20];S.xp.fishing=D.XPF[20];for(const k of Object.keys(S.xp))S.xp[k]=Math.max(S.xp[k],D.XPF[12]);
  assert.ok(q.planUnlocked(),'the queue is open by Hero 3');
  assert.ok(q.startAct('fish','shrimp',{quiet:true,rule:'count:5'}));q.queueAdd('wood','normal','count:5');assert.equal(S.queue.length,1);
  const snap=q.exportSave();
  q.simulate(10*60000);assert.equal(S.queue.length,0,'the queued task was taken');assert.ok((S.stats.chop||0)>=5,'and it ran');
  assert.ok(q.importSave(snap));assert.equal(q.S.queue.length,1,'a saved queue comes back');assert.equal(q.S.queue[0].kind,'wood');
});
test('eggs: a beast arrives as an egg, hatches once its time has passed, and saves with or without eggs load',()=>{
  const {q,load}=harness();load('eggs');const S=q.S,D=q.data;
  assert.equal(q.awardPet('bubbles'),true);assert.ok(!S.pets.owned.bubbles,'not owned yet');assert.equal(S.pets.eggs.length,1);assert.equal(q.awardPet('bubbles'),false,'no second egg for the same beast');
  assert.equal(q.eggKind('gobbo').k,'royal');assert.equal(q.eggKind('wild_thimblefox').k,'wild');assert.equal(q.eggKind('bubbles').k,'speckled');
  assert.equal(q.hatchDue(),0,'not before its time');
  const snap=q.exportSave();assert.ok(q.importSave(snap),'a save with an egg loads');assert.equal(q.S.pets.eggs.length,1);
  q.S.pets.eggs[0].due=Date.now()-1;assert.equal(q.hatchDue(),1);assert.ok(q.S.pets.owned.bubbles,'hatched');assert.equal(q.S.pets.eggs.length,0);assert.ok(q.S.pets.owned.bubbles.egg.hatched,'its journey is remembered');
  assert.equal(q.awardPet('biscuit',{hatched:true}),true);assert.ok(q.S.pets.owned.biscuit,'fixtures can skip the egg');
  const old=JSON.parse(JSON.stringify(q.S));delete old.pets.eggs;assert.ok(q.validateSave(old),'saves from before eggs load');q.S=old;assert.equal(q.eggs().length,0);
});
console.log(tests+' regression checks passed');
