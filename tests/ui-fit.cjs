/* One-screen fit: at laptop sizes (MacBook Air browser windows included) the left column shows every skill without
   scrolling, and activity pages keep the action panel still while only the list of choices scrolls.
   Start a local server, then: IDLEWICK_URL=http://127.0.0.1:8765/index.html node tests/ui-fit.cjs */
const {chromium}=require('playwright');
const assert=require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 try{
  const p=await browser.newPage({viewport:{width:1440,height:900}}),errors=[];p.on('pageerror',e=>errors.push(e.message));
  await p.goto(process.env.IDLEWICK_URL||'http://127.0.0.1:8765/index.html');
  await p.locator('#t-new').click();await p.locator('#crname').fill('Fit');await p.locator('#cr-go').click();await p.waitForTimeout(700);
  await p.evaluate(()=>{for(const sk of Object.keys(DQ.S.xp)){DQ.S.xp[sk]=30000;DQ.S.unlocked[sk]=true;}DQ.S.tut.hidden=true;DQ.S.settings.notify=false;DQ.fxDirty();DQ.ui.renderDock();DQ.closeModal&&DQ.closeModal();});
  for(const [w,h] of [[1440,900],[1470,820],[1440,780],[1280,800],[1280,720]]){
   await p.setViewportSize({width:w,height:h});
   for(const running of [false,true]){
    await p.evaluate(r=>{DQ.go('mining');DQ.closeModal&&DQ.closeModal();if(r&&!DQ.act){const b=document.querySelector('#view [data-do="act"]');b&&b.click();}if(!r&&DQ.act)DQ.stopAct();DQ.ui.renderHud();},running);
    await p.waitForTimeout(1300);
    const m=await p.evaluate(()=>{const sb=document.querySelector('.sidebar'),list=document.querySelector('.illustrated-choices'),stage=document.querySelector('.workspace-focus');
     return {rows:document.querySelectorAll('#skilldock .dk').length,side:sb.scrollHeight<=sb.clientHeight+1,doc:document.documentElement.scrollHeight<=innerHeight+1,list:list.scrollHeight>list.clientHeight,listScroll:getComputedStyle(list).overflowY,stageTop:stage.getBoundingClientRect().top};});
    assert.equal(m.rows,14,'every skill in the left column');
    if(h>=720)assert.ok(m.side,`${w}x${h} left column fits without scrolling (running=${running})`);
    assert.ok(m.doc,`${w}x${h} the page itself does not scroll on an activity page`);
    assert.equal(m.listScroll,'auto',`${w}x${h} the list of choices scrolls inside its panel when it is long`);
    const before=m.stageTop;await p.locator('.illustrated-choices').evaluate(e=>e.scrollTop=e.scrollHeight);
    assert.equal(await p.locator('.workspace-focus').evaluate(e=>e.getBoundingClientRect().top),before,'the action panel stays still while the list scrolls');
   }
  }
  /* every desktop page: the window itself never scrolls; Quests is a list beside the selected quest */
  await p.setViewportSize({width:1440,height:780});
  for(const page of ['overview','activity','journal','quests','combat','bestiary','map','exploration','projects','house','hirelings','character','tools','bank','skillsummary','mastery','achievements','shop','hunting','magic','brewery','enchanting','research','settings']){
   await p.evaluate(v=>{DQ.go(v);DQ.closeModal&&DQ.closeModal();},page);
   assert.ok(await p.evaluate(()=>document.documentElement.scrollHeight<=innerHeight+1),`${page}: the window does not scroll`);
  }
  /* Combat: the fight, the fighting style and the creatures stay on screen; everything else scrolls beneath */
  await p.evaluate(()=>{DQ.go('combat');DQ.closeModal&&DQ.closeModal();});await p.waitForTimeout(1300);
  const vis=sel=>p.locator(sel).first().evaluate(e=>{const r=e.getBoundingClientRect();return r.top>=0&&r.top<innerHeight-30&&r.height>20;});
  for(const sel of ['.encounter-arena','.style-strip','.combat-targets','.combat-tools'])assert.ok(await vis(sel),`combat: ${sel} on screen`);
  assert.equal(await p.locator('.combat-col').evaluate(e=>getComputedStyle(e).display),'none','combat skills, abilities and food live in pop-ups');
  assert.equal(await p.locator('.combat-side').evaluate(e=>getComputedStyle(e).display),'none','preparation, boss and loot live in pop-ups');
  for(const key of ['skills','abilities','food','prep','boss','loot']){await p.locator(`.combat-tools [data-a="${key}"]`).click();assert.equal(await p.locator('.modal .combat-pop .panel, .modal .combat-pop .intel').count()>0,true,`${key} pop-up`);await p.evaluate(()=>DQ.closeModal());}
  await p.evaluate(()=>{DQ.ui.questTab='upcoming';DQ.go('quests');});
  assert.ok(await p.locator('.qlist .qrow').count()>1,'quest list rows');assert.equal(await p.locator('.qdetail .quest').count(),1,'one quest in full');
  assert.deepEqual(errors,[]);
  console.log('PASS one-screen fit: every skill visible at laptop heights; activity pages scroll only their list of choices; no desktop page scrolls the window; Quests is list + detail; Combat shows only the fight, style and creatures, with the rest in pop-ups.');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1);});
