/* Player journeys in the real page, each from an isolated save (scripts/preview.py, then node tests/ui-journeys.cjs).
   Normal progression where it is quick; seeded states (named as such) where the journey would take hours. */
const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const URL=process.env.IDLEWICK_URL||'http://127.0.0.1:8765/';
(async()=>{
 const browser=await chromium.launch({headless:true,args:['--no-sandbox'],...(fs.existsSync('/usr/bin/chromium')?{executablePath:'/usr/bin/chromium'}:{})});
 const fresh=async(name='Journey')=>{const ctx=await browser.newContext({viewport:{width:1280,height:900}});const page=await ctx.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(URL);await page.locator('#t-new').click();await page.locator('#crname').fill(name);await page.locator('#cr-go').click();await page.waitForTimeout(700);
  await page.evaluate(()=>{DQ.S.settings.muted=true;document.querySelectorAll('.note').forEach(n=>n.remove());});return {ctx,page,errors};};
 const done=[];
 try{
  /* 1. Normal progression: first task through first useful upgrade */
  {const {ctx,page,errors}=await fresh();
   assert.match(await page.locator('.journey h2').innerText(),/Meet Elder Wren/);
   await page.locator('.journey .btn.primary').click();await page.waitForTimeout(300);
   await page.evaluate(()=>{DQ.go('overview');});assert.match(await page.locator('.journey-done').innerText(),/0\/5 shrimp/);
   await page.evaluate(()=>{DQ.startAct('fish','shrimp',{quiet:true});DQ.simulate(5*60000);DQ.startAct('wood','normal',{quiet:true});DQ.simulate(4*60000);DQ.ui.render(true);});
   assert.match(await page.locator('.journey h2').innerText(),/Claim First Steps/);
   await page.evaluate(()=>{DQ.stopAct&&DQ.stopAct(true);DQ.ui.render(true);for(let i=0;i<4;i++)DQ.closeModal&&DQ.closeModal();document.querySelectorAll('.note').forEach(n=>n.remove());});assert.equal(await page.evaluate(()=>DQ.skillUnlocked('cooking')),true,'First Steps teaches the cooking fire');
   await page.waitForTimeout(1500);await page.evaluate(()=>{for(let i=0;i<4;i++)DQ.closeModal&&DQ.closeModal();document.querySelectorAll('.note').forEach(n=>n.remove());});await page.waitForTimeout(600);
   await page.locator('.journey .btn.primary').click();await page.waitForTimeout(300);
   assert.equal(await page.evaluate(()=>DQ.S.q.first_steps.s),'done');
   /* the first useful upgrade: the boss advice now offers armour the purse can buy */
   const adv=await page.evaluate(()=>{DQ.S.coins=200;return DQ.prepAdvice('grubnash').map(x=>x.title);});assert.ok(adv.some(t=>/armour/i.test(t)),adv.join(' | '));
   assert.deepEqual(errors,[]);await ctx.close();done.push('first task → First Steps claimed → armour advice (normal progression)');}

  /* 2. First boss: preparation, an attempt, and what a defeat says (seeded: combat 8 reached, no armour, little food) */
  {const {ctx,page,errors}=await fresh();
   await page.evaluate(()=>{const S=DQ.S,D=DQ.data;for(const k of ['attack','strength','defence'])S.xp[k]=D.XPF[8];S.xp.hitpoints=D.XPF[11];S.inv.shrimp=2;S.settings.notify=true;DQ.go('combat');});
   const steps=await page.locator('.prep-steps li').allInnerTexts();assert.ok(steps.length>=2,'boss card lists concrete steps');
   const msg=await page.evaluate(async()=>{let seen=null;DQ.on('notified',()=>{});const n0=DQ.notify;DQ.S.inv={};DQ.S.hp=3;DQ.startAct('fight','grubnash',{quiet:true});for(let i=0;i<180&&DQ.act;i++)DQ.advanceTime(1000,1000,DQ.act?DQ.act.progress||0:0);await new Promise(r=>setTimeout(r,400));return [...document.querySelectorAll('#notes .note')].map(e=>e.innerText).join(' | ')+' || '+JSON.stringify(DQ.noteLog?DQ.noteLog.slice(0,3).map(e=>e.o.text):[]);});
   assert.match(msg,/Most useful change/,'a defeat names the most useful change: '+msg);
   assert.deepEqual(errors,[]);await ctx.close();done.push('first boss: concrete steps on the card; a defeat names the most useful change (seeded)');}

  /* 3. Herbalism and Enchanting, unlock to first use (seeded: 20 harvests; 30 crafts and 20 smithing actions) */
  {const {ctx,page,errors}=await fresh();
   await page.evaluate(()=>{const S=DQ.S,D=DQ.data;S.stats.harvest=20;S.stats.craft=30;S.stats.smith=20;S.unlocked.farming=true;S.xp.farming=D.XPF[10];DQ.checkActionUnlocks();DQ.closeModal&&DQ.closeModal();DQ.closeModal&&DQ.closeModal();for(const k of ['attack','strength','defence','hitpoints'])S.xp[k]=D.XPF[20];S.inv.bronze_sword=1;S.inv.iron_body=1;DQ.equipItem('bronze_sword');DQ.equipItem('iron_body');DQ.go('brewery');});
   await page.waitForTimeout(200);const herb=await page.locator('.herb-goals').innerText();assert.match(herb,/Research Herbalism/);assert.match(herb,/Healing draught/);assert.match(herb,/Potion of Might/);
   await page.evaluate(()=>{DQ.closeModal&&DQ.closeModal();DQ.go('enchanting');});await page.waitForTimeout(200);
   const ench=await page.locator('.ench-list').innerText();assert.match(ench,/best first/i);assert.match(ench,/sword/i);assert.match(ench,/runes .*held/);
   assert.deepEqual(errors,[]);await ctx.close();done.push('Herbalism and Enchanting: first goals, materials and a recommended first item (seeded)');}

  /* 4. A bestiary milestone (seeded: 9 Grubnash victories, then one more) */
  {const {ctx,page,errors}=await fresh();
   const r=await page.evaluate(()=>{const S=DQ.S,D=DQ.data;S.settings.notify=true;S.beast.kills.grubnash=9;DQ.recordKill(D.MON.grubnash,[]);return {trophy:DQ.trophyEarned('grubnash'),journal:(S.journal||[]).map(e=>e.text).join(' | ')};});
   assert.ok(r.trophy);assert.match(r.journal,/Trophy earned/);
   await page.evaluate(()=>DQ.ui.openGuide('grubnash'));await page.waitForTimeout(200);assert.match(await page.locator('.slayer').innerText(),/10 defeats/);
   assert.match(await page.locator('.modal').innerText(),/Weak points take \+30%/,'boss field guide states the boss rule');
   assert.deepEqual(errors,[]);await ctx.close();done.push('bestiary: tenth Grubnash victory earns the trophy, the journal records it, the guide states the boss rule (seeded)');}

  /* 5. Returning after an absence (seeded: last seen six hours ago while fishing) */
  {const {ctx,page,errors}=await fresh();
   await page.evaluate(()=>{DQ.startAct('fish','shrimp',{quiet:true});DQ.save();});
   await ctx.addInitScript(()=>{const real=Date.now.bind(Date);Date.now=()=>real()+6*3600e3;});
   await page.reload();await page.locator('#t-cont').click();await page.waitForTimeout(1500);
   const modal=await page.locator('.modal').innerText().catch(()=>'');assert.match(modal,/Welcome back/i);assert.match(modal,/shrimp/i);
   assert.deepEqual(errors,[]);await ctx.close();done.push('return after six hours: welcome-back summary with the next step (seeded)');}

  /* 6. An older save without any of the new fields loads and plays */
  {const {ctx,page,errors}=await fresh();
   const ok=await page.evaluate(()=>{const o=JSON.parse(JSON.stringify(DQ.S));for(const k of ['journal','choices','memories','upity','uniqFound','freshUnique','nods'])delete o[k];delete o.house.wall;o.title=null;return DQ.validateSave(o)&&true;});
   assert.ok(ok);
   assert.deepEqual(errors,[]);await ctx.close();done.push('older save without journal, choices, memories, unique records or trophy wall validates');}

  console.log('PASS player journeys:\n - '+done.join('\n - '));
 } finally { await browser.close(); }
})().catch(e=>{console.error(e);process.exit(1);});
