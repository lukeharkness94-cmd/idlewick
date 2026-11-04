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
test('legacy saves gain the project pin field and invalid pins are rejected atomically', () => {
  const {q}=harness(); const legacy=q.newState(); delete legacy.pinnedProject;
  assert.equal(q.importSave(encode(legacy)),true); assert.equal(q.S.pinnedProject,null);
  const before=q.exportSave(), invalid=q.newState(); invalid.pinnedProject='missing';
  assert.equal(q.importSave(encode(invalid)),false); assert.equal(q.exportSave(),before);
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
 const {q,load}=harness();load('fx');q.S.coins=100000;q.S.inv.log_normal=1000;
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
 const next=q.journeyNext();assert.ok(a.winRate>=.75?next.title==='Challenge Grubnash':/food|stronger|provisions/i.test(next.title),next.title);
 q.forecasting=true;assert.equal(q.bossForecast('grubnash'),null,'never nests inside another forecast');q.forecasting=false;
});
console.log(tests+' regression checks passed');
