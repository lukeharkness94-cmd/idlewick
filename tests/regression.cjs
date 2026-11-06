/* node tests/regression.cjs — deterministic engine and persistence regression checks. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
function harness(desktopStorage) {
  const storage = new Map(), listeners = {}, ui = { V: {}, DO: {}, B: {}, homeSections: [], homeAfterCurrent: [], tabState: () => null, render() {}, detail() {}, selbarHtml() {} };
  let denied = false, seed = 7;
  const math = Object.create(Math);
  math.random = () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };
  const element = () => ({ setAttribute() {}, classList: { add() {}, remove() {}, toggle() {} }, appendChild() {}, style: {}, querySelector() {}, querySelectorAll: () => [], addEventListener() {} });
  const context = vm.createContext({
    idlewickDesktop: desktopStorage ? {storage:desktopStorage} : undefined,
    console, Math: math, Date, JSON, performance: { now: () => 0 },
    setTimeout: () => 0, setInterval: () => 0, clearTimeout() {},
    addEventListener: (name, fn) => { listeners[name] = fn; },
    matchMedia: () => ({ matches: false }), innerWidth: 1200, innerHeight: 800,
    btoa: s => Buffer.from(s, 'binary').toString('base64'), atob: s => Buffer.from(s, 'base64').toString('binary'),
    escape, unescape,
    localStorage: {
      getItem: k => { if (denied) throw Error('denied'); return storage.get(k) || null; },
      setItem: (k, v) => { if (denied) throw Error('denied'); storage.set(k, v); },
      removeItem: k => storage.delete(k)
    },
    document: { querySelector: () => null, querySelectorAll: () => [], getElementById: () => null, createElement: element, body: element(), addEventListener() {} }
  });
  context.window = context;
  const load = name => vm.runInContext(fs.readFileSync(path.join(__dirname, '../js', name + '.js'), 'utf8'), context, { filename: name });
  ['util', 'data', 'data2', 'data3', 'economy', 'state', 'audio'].forEach(load);
  const q = context.DQ;
  q.notify = q.pulse = q.floatAt = q.flash = q.burstAt = q.burstEl = q.toast = q.go = () => {};
  ['engine', 'systems', 'plan', 'meta'].forEach(load);
  q.ui = ui; q.tips = { item: () => '' }; q.goals = () => [];
  ['research', 'journey', 'onboarding'].forEach(load);
  q.S = q.newState(); q.fxDirty();
  return { q, load, storage, listeners, deny: value => { denied = value; } };
}
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
  assert.equal(q.journeyNext().a,'map');
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
  const {q}=harness();q.S.xp.fishing=q.data.advReq(4);q.S.inv.raw_shrimp=1;
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
  q.S.coins=0;assert.equal(q.noticeCount('projects'),0);
  q.S.coins=1e8;for(const sk of Object.keys(q.S.xp))q.S.xp[sk]=100000;
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
  q.S.xp.fishing=q.data.advReq(4); assert.equal(q.lessonForPage('cooking').id,'cooking');
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
  for(const lesson of Object.values(q.skillLessons)) { assert.ok(lesson.text.length>30); assert.ok(lesson.towards.length>30); assert.ok(lesson.goal.length>20); }
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
 const {q}=harness();q.S.xp.fishing=q.data.XPF[70];q.S.coins=1000;q.S.inv.feather=10;
 assert.equal(q.startResearch('field_notes'),true);assert.equal(q.S.coins,975);assert.equal(q.have('feather'),8);
 q.researchTick(300000);const xp=q.S.xp.research;assert.ok(xp>0);assert.equal(q.techDone('field_notes'),false);
 q.researchTick(300000);assert.equal(q.S.xp.research,xp);assert.equal(q.startResearch('field_notes'),true);q.researchTick(300000);assert.ok(q.S.xp.research>xp);
});
test('Scholarship gates tiers by skill level and retains legacy second slots',()=>{
 const {q}=harness();q.S.xp.fishing=q.data.XPF[70];const t=q.data.TECHS.find(t=>t.tier===2);
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
  S.inv.leather_vest=1;assert.equal(q.skillUnlocked('ranged'),false);assert.equal(q.equipItem('leather_vest').ok,true,'leather body wearable at Defence 1');
  S.inv.frost_vest=1;assert.equal(q.equipItem('frost_vest').ok,false);
  /* the Ranged quest needs only Mossbarrow and Hero 18, not an unrelated side quest */
  S.towns.mossbarrow={visited:true,boss:false};S.towns.willowbrook.boss=true;while(q.advLvl()<18)S.xp.fishing+=2000;
  assert.equal(q.questState(D.QM.mq_ranged),'new','A Hunter’s Bow is available at Hero 18 in Mossbarrow');
  /* gear for a skill you cannot use is not sold, with a clear reason */
  const coins=S.coins=5000;assert.equal(q.lockedSkillFor('staff_normal'),'magic');q.buy('staff_normal');assert.equal(S.coins,coins);assert.ok(!S.inv.staff_normal);
  assert.match(q.skillTeacher('magic'),/Archivist Merrow in Saltmere/);
  /* bows and staves never drop before their skill is learned */
  S.town='willowbrook';S.xp.attack=S.xp.strength=S.xp.defence=S.xp.hitpoints=D.XPF[40];S.inv.bread=5000;const kills=S.stats.kill;
  q.startAct('fight','goblin',{quiet:true});q.simulate(6*3600000);assert.ok(S.stats.kill-kills>2000,'thousands of goblins fought');
  assert.ok(!q.have('staff_normal')&&!q.have('bow_normal'),'no bows or staves drop before Ranged or Magic is learned');
  /* every skill-teaching quest is reachable: its requirement chain never needs the skill it teaches, and every link exists */
  for(const mq of D.QUESTS.filter(x=>x.main)){const seen=new Set();let cur=mq;
    while(cur&&cur.req){assert.ok(D.QM[cur.req],mq.id+' requires a missing quest '+cur.req);assert.ok(!seen.has(cur.req),mq.id+' has a circular requirement');seen.add(cur.req);cur=D.QM[cur.req];
      assert.ok(!cur.main||cur.unlocks!==mq.unlocks);}
    for(const o of mq.obj){if(o.ev==='kill'||o.ev==='boss')assert.ok(D.MON[o.key],mq.id+' targets a real creature');if(o.ev==='deliver')assert.ok(D.ITEMS[o.key],mq.id+' delivers a real item');}
  }
});
console.log(tests+' regression checks passed');
