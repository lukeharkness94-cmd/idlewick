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
    assert.equal(m.listScroll,'auto');assert.ok(m.list,`${w}x${h} the long list of choices scrolls inside its panel`);
    const before=m.stageTop;await p.locator('.illustrated-choices').evaluate(e=>e.scrollTop=e.scrollHeight);
    assert.equal(await p.locator('.workspace-focus').evaluate(e=>e.getBoundingClientRect().top),before,'the action panel stays still while the list scrolls');
   }
  }
  assert.deepEqual(errors,[]);
  console.log('PASS one-screen fit: every skill visible at laptop heights; activity pages scroll only their list of choices.');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1);});
