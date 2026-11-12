/* The Beastmastery ranch: pens for owned beasts, a food shelf, feeding that trains, and the shed/field tabs. */
const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('fs');
(async()=>{const b=await chromium.launch({...(fs.existsSync(process.env.CHROMIUM_PATH||'/usr/bin/chromium')?{executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium'}:{}),headless:true,args:['--no-sandbox']});
const p=await b.newPage({viewport:{width:1440,height:900}}),errors=[];p.on('pageerror',e=>errors.push(e.message));
await p.goto(process.env.IDLEWICK_URL||'http://127.0.0.1:8765/index.html');await p.locator('#t-new').click();await p.locator('#crname').fill('Ranch QA');await p.locator('#cr-go').click();await p.waitForTimeout(1200);
await p.evaluate(()=>{const Q=DQ,D=Q.data,S=Q.S;S.tut.hidden=true;for(const k of Object.keys(Q.skillLessons))S.tut.done['lesson:'+k]=true;S.settings.notify=false;S.settings.muted=true;S.settings.calm=true;for(const sk of D.SKILLS){S.unlocked[sk.id]=true;S.xp[sk.id]=D.XPF[35]+20;}S.coins=100000;S.inv={bread:30,cooked_herring:10};S.pets.owned.bond_wolf={bondXp:0,evolved:false,trainingUntil:0};S.pets.owned.bond_owl={bondXp:300,evolved:false,trainingUntil:0};Q.setPet('bond_wolf');Q.fxDirty();});
await p.waitForTimeout(3000);await p.evaluate(()=>{for(let i=0;i<10;i++)DQ.closeModal();});
await p.evaluate(()=>{DQ.ui.beastMode='beasts';DQ.go('beastmastery');DQ.ui.render(false);});await p.waitForTimeout(400);
assert.equal(await p.locator('.pen:not(.empty)').count(),2,'one pen per owned beast');
assert.ok(await p.locator('.pen.empty').count()>=1,'empty pens wait for more beasts');
assert.ok(await p.locator('.shelf-food').count()>=1,'food shelf lists what you carry');
assert.ok(await p.locator('.pen-flag').isVisible(),'companion pen is flagged');
const s0=await p.evaluate(()=>({xp:DQ.S.pets.owned.bond_wolf.bondXp,coins:DQ.S.coins,food:Object.values(DQ.S.inv).reduce((a,b)=>a+b,0)}));
await p.locator('.pen[data-id="bond_wolf"]').click();await p.waitForTimeout(200);
await p.locator('[data-do="beastfeed"]').click();await p.waitForTimeout(500);
const s1=await p.evaluate(()=>({xp:DQ.S.pets.owned.bond_wolf.bondXp,coins:DQ.S.coins,food:Object.values(DQ.S.inv).reduce((a,b)=>a+b,0),until:DQ.S.pets.owned.bond_wolf.trainingUntil}));
assert.ok(s1.xp>s0.xp,'feeding raises bond XP');assert.ok(s1.coins<s0.coins,'training costs coins');assert.equal(s1.food,s0.food-2,'feeding uses two food');assert.ok(s1.until>Date.now(),'the beast naps afterwards');
assert.ok(await p.locator('.pen.ps-nap[data-id="bond_wolf"]').count()===1,'pen shows napping');
assert.ok(await p.locator('[data-do="beastfeed"]').isDisabled(),'cannot feed a napping beast again');
for(const [mode,sel] of [['shed','.beast-subpage.mode-shed'],['field','.beast-subpage.mode-field']]){await p.locator(`.ranch-tabs [data-a="${mode}"]`).click();await p.waitForTimeout(300);assert.ok(await p.locator(sel).isVisible(),mode+' tab opens');}
await p.locator('.ranch-tabs [data-a="ranch"]').click();await p.waitForTimeout(300);assert.ok(await p.locator('.pen-grid').isVisible(),'ranch tab returns');
assert.deepEqual(errors,[]);await b.close();console.log('PASS ranch: pens, shelf, feeding trains and naps, shed and field tabs');})();
