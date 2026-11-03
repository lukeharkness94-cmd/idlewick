/* node tests/regression.cjs — deterministic engine and persistence regression checks. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
function harness() {
  const storage = new Map(), listeners = {}, ui = { V: {}, DO: {}, B: {}, homeSections: [], homeAfterCurrent: [], tabState: () => null, render() {}, detail() {}, selbarHtml() {} };
  let denied = false, seed = 7;
  const math = Object.create(Math);
  math.random = () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };
  const element = () => ({ setAttribute() {}, classList: { add() {}, remove() {}, toggle() {} }, appendChild() {}, style: {}, querySelector() {}, querySelectorAll: () => [], addEventListener() {} });
  const context = vm.createContext({
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
  ['util', 'data', 'data2', 'data3', 'state', 'audio'].forEach(load);
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
test('routine progress uses badges and history instead of popups', () => {
  const {q,load}=harness();load('fx');q.ui.view='quests';
  for(const o of [{kind:'level',key:'lvl:mining',title:'Mining level 2'}, {kind:'unlock',key:'unlock:cooking',title:'Cooking unlocked'}, {kind:'ach',key:'ach:first',title:'First achievement'}, {kind:'loot',key:'rare:gem_sapphire',title:'Rare find'}])q.notify(o);
  assert.equal(q.noteLog.length,4);assert.equal(q.noticeCount('mining'),1);assert.equal(q.noticeCount('cooking'),1);
  assert.equal(q.notificationTier({kind:'level'}),'quiet');assert.equal(q.notificationTier({kind:'loot'}),'quiet');
});
test('same-page levels stay quiet and do not create unread counts', () => {
  const {q,load}=harness();load('fx');q.ui.view='mining';q.notify({kind:'level',key:'lvl:mining',title:'Mining level 2'});
  assert.equal(q.noteLog.length,1);assert.equal(q.noticeCount('mining'),0);assert.equal(q.noteMissed,0);
});
test('badges deduplicate and clear only on visiting their page', () => {
  const {q,load}=harness();load('fx');q.ui.view='quests';
  q.notify({kind:'level',key:'lvl:mining',title:'Mining level 2'});q.notify({kind:'level',key:'lvl:mining',title:'Mining level 3'});
  q.notify({kind:'level',key:'lvl:fishing',title:'Fishing level 2'});
  assert.equal(q.noticeCount(['mining','fishing']),2);
  q.markNoticesRead('mining');assert.equal(q.noticeCount('mining'),0);assert.equal(q.noticeCount('fishing'),1);
});
test('same-page warnings become inline status and critical alerts retain priority', () => {
  const {q,load}=harness();load('fx');q.ui.view='mining';let rendered=0;q.ui.renderPageNotice=()=>rendered++;
  q.notify({kind:'warn',key:'stopped',page:'mining',title:'Task stopped',text:'Missing supplies'});
  assert.equal(rendered,1);assert.equal(q.ui.pageNotice.text,'Missing supplies');assert.equal(q.noteMissed,0);
  for(const kind of ['death','warn','boss'])assert.equal(q.notificationTier({kind}),'now');
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
console.log(tests+' regression checks passed');
