/* One-screen fit: at laptop sizes (MacBook Air browser windows included) the left column shows every skill without
   scrolling, and activity pages keep the action panel still while only the list of choices scrolls.
   Start a local server, then: IDLEWICK_URL=http://127.0.0.1:8765/index.html node tests/ui-fit.cjs */
const {chromium}=require('playwright');
const assert=require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch({headless:true,...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{}),args:['--no-sandbox']});
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
    assert.equal(m.rows,17,'every skill in the left column');
    if(h>=720)assert.ok(m.side,`${w}x${h} left column fits without scrolling (running=${running})`);
    assert.ok(m.doc,`${w}x${h} the page itself does not scroll on an activity page`);
    assert.equal(m.listScroll,'auto',`${w}x${h} the list of choices scrolls inside its panel when it is long`);
    const before=m.stageTop;await p.locator('.illustrated-choices').evaluate(e=>e.scrollTop=e.scrollHeight);
    assert.equal(await p.locator('.workspace-focus').evaluate(e=>e.getBoundingClientRect().top),before,'the action panel stays still while the list scrolls');
   }
  }
  /* every desktop page: the window itself never scrolls; Quests is a list beside the selected quest */
  await p.setViewportSize({width:1440,height:780});
  for(const page of ['overview','activity','journal','quests','people','combat','bestiary','map','exploration','projects','house','hirelings','character','tools','bank','skillsummary','mastery','achievements','shop','hunting','magic','brewery','enchanting','research','settings']){
   await p.evaluate(v=>{DQ.go(v);DQ.closeModal&&DQ.closeModal();},page);
   assert.ok(await p.evaluate(()=>document.documentElement.scrollHeight<=innerHeight+1),`${page}: the window does not scroll`);
  }
  /* Combat: the fight, the fighting style and the creatures stay on screen; everything else scrolls beneath */
  await p.evaluate(()=>{DQ.go('combat');DQ.closeModal&&DQ.closeModal();});await p.waitForTimeout(1300);
  const vis=sel=>p.locator(sel).first().evaluate(e=>{const r=e.getBoundingClientRect();return r.top>=0&&r.top<innerHeight-30&&r.height>20;});
  for(const sel of ['.ready-line','.encounter-arena','.combat-hud .style-strip','.combat-targets','.combat-abils','.combat-food'])assert.ok(await vis(sel),`combat: ${sel} on screen`);
  /* what you act on is on screen: each combat skill's level on the style strip, ability slots and food beneath it */
  assert.ok(await p.locator('.style-strip [data-b="lvl:attack"], .style-strip [data-b^="lvl:"]').count()>=3,'combat skill levels on the style strip');
  assert.ok(await p.locator('.combat-abils .ab-tile').count()>=1,'ability slots on screen');assert.ok(await p.locator('.combat-food [data-do="autoeat"]').count()===1,'food settings on screen');
  assert.equal(await p.locator('.combat-col').evaluate(e=>getComputedStyle(e).display),'none','the full combat panels stay as pop-up sources');
  assert.equal(await p.locator('.combat-side').evaluate(e=>getComputedStyle(e).display),'none','preparation, boss and loot live in pop-ups');
  for(const key of ['skills','abilities','prep','boss','loot']){await p.locator(`[data-do="combatmore"][data-a="${key}"]`).first().click();assert.equal(await p.locator('.modal .combat-pop .panel, .modal .combat-pop .intel').count()>0,true,`${key} pop-up`);await p.evaluate(()=>DQ.closeModal());}
  await p.evaluate(()=>{DQ.ui.questTab='upcoming';DQ.go('quests');});
  assert.ok(await p.locator('.qlist .qrow').count()>1,'quest list rows');assert.equal(await p.locator('.qdetail .quest').count(),1,'one quest in full');
  /* readability floor: desktop scaling never drops below 85%, and no visible text renders under 11 screen pixels */
  await p.setViewportSize({width:1280,height:720});
  assert.ok(await p.evaluate(()=>DQ.zoom>=0.85),'desktop zoom keeps a readability floor');
  for(const page of ['overview','quests','people','combat','fishing','smithing','character','shop','house','research']){
   await p.evaluate(v=>{DQ.go(v);DQ.closeModal&&DQ.closeModal();},page);await p.waitForTimeout(120);
   const small=await p.evaluate(()=>{for(const el of document.querySelectorAll('#app *')){if(el.closest('svg'))continue;if(![...el.childNodes].some(n=>n.nodeType===3&&n.textContent.trim().length>1))continue;const r=el.getBoundingClientRect();if(!r.width||r.bottom<0||r.top>innerHeight)continue;const fs=parseFloat(getComputedStyle(el).fontSize)*DQ.zoom;if(fs<10.9)return (el.className||el.tagName)+' '+fs.toFixed(1)+'px: '+el.textContent.trim().slice(0,30);}return '';});
   assert.equal(small,'',`${page}: readable text at 1280x720`);
  }
  await p.evaluate(()=>{DQ.go('combat');DQ.closeModal&&DQ.closeModal();});
  assert.ok(await p.locator('.ready-line .rl-i').count()>=2,'the ready line shows danger, food and gear at a glance');
  /* with every ability unlocked, the ability panel, the fighting style and food are whole on screen at 1280x720: nothing to act on sits in a scroll */
  const fitAll=await p.evaluate(async()=>{const D=DQ.data;for(const k of ['attack','strength','defence','hitpoints','ranged','magic'])DQ.S.xp[k]=D.XPF[70];DQ.S.inv.shrimp=5;DQ.S.inv.bread=5;DQ.ui.render(true);await new Promise(r=>setTimeout(r,200));
    const ar=document.querySelector('.encounter-arena').getBoundingClientRect(),inside=[...document.querySelectorAll('#av-you img,#av-foe img')].every(i=>{const r=i.getBoundingClientRect();return r.top>=ar.top-1&&r.bottom<=ar.bottom+1;});if(!inside)return ['fighters outside the stage rl'+Math.round(document.querySelector('.ready-line').getBoundingClientRect().height)+' hud'+Math.round(document.querySelector('.combat-hud').getBoundingClientRect().height)+' abil'+Math.round(document.querySelector('.combat-abils').scrollHeight)+' train'+Math.round(document.querySelector('.hud-train').scrollHeight)+' food'+Math.round(document.querySelector('.combat-food').scrollHeight)+' '+Math.round(ar.top)+'-'+Math.round(ar.bottom)+' '+[...document.querySelectorAll('#av-you img,#av-foe img')].map(i=>{const r=i.getBoundingClientRect();return Math.round(r.top)+'-'+Math.round(r.bottom)}).join(',')];
    return ['.combat-abils','.style-strip','.combat-food','.ready-line'].map(s=>{const e=document.querySelector(s),r=e.getBoundingClientRect();return r.bottom<=innerHeight+1&&e.scrollHeight<=e.clientHeight+2?'':s+' '+Math.round(r.bottom)+'/'+innerHeight+' sh'+e.scrollHeight+'/'+e.clientHeight;}).filter(Boolean);});
  assert.deepEqual(fitAll,[],'combat actions fully on screen at 1280x720: '+fitAll.join('; '));
  assert.deepEqual(errors,[]);
  /* wide and ultrawide screens: the world map (legend and region list included), Inventory with its preparations and
     the clickable village all sit inside the window */
  for(const [w,h] of [[1920,1080],[2560,1080],[3440,1440]]){
   await p.setViewportSize({width:w,height:h});
   for(const [page,sel] of [['map','.mappanel .region-list'],['character','.loadouts'],['projects','.village-scene']]){
    await p.evaluate(g=>{DQ.closeModal&&DQ.closeModal();DQ.go(g);},page);await p.waitForTimeout(800); // Let staggered page-entry transforms finish before measuring scroll bounds.
    const r=await p.evaluate(s=>{const e=document.querySelector(s);if(!e)return null;const b=e.getBoundingClientRect(),v=document.getElementById('view');return {bottom:b.bottom,vh:innerHeight,doc:document.documentElement.scrollHeight<=innerHeight+1,viewOver:v.scrollHeight-v.clientHeight};},sel);
    assert.ok(r,`${page}: ${sel} present at ${w}x${h}`);assert.ok(r.doc,`${page}: window does not scroll at ${w}x${h}`);
    assert.ok(r.bottom<=r.vh+1&&r.viewOver<=8,`${page}: ${sel} fully on screen at ${w}x${h} (bottom ${Math.round(r.bottom)} of ${r.vh}, overflow ${r.viewOver})`);
   }
  }
  /* the top menu never runs into the coins, backpack and settings, from small laptop windows up */
  for(const w of [1000,1100,1180,1280,1366,1440,1600,1920]){
   await p.setViewportSize({width:w,height:760});await p.evaluate(()=>{DQ.closeModal&&DQ.closeModal();DQ.go('overview');});await p.waitForTimeout(250);
   const t=await p.evaluate(()=>{const n=[...document.querySelectorAll('#topnav .tnav')].map(e=>e.getBoundingClientRect()),st=document.querySelector('#hud .h-stats').getBoundingClientRect(),hn=document.querySelector('#hud .h-name').getBoundingClientRect();return {navR:Math.max(...n.map(r=>r.right)),navL:Math.min(...n.map(r=>r.left)),stats:st.left,name:hn.right};});
   assert.ok(t.navR<=t.stats-4&&t.navL>=t.name,`top menu fits between the hero and the counters at ${w}px (${JSON.stringify(t)})`);
  }
  console.log('PASS one-screen fit: every skill visible at laptop heights; activity pages scroll only their list of choices; no desktop page scrolls the window; Quests is list + detail; Combat is choose, ready, fight and one action bar (train, abilities, food) with nothing actionable in a scroll; readable text at 1280x720; the map, Inventory and village fit at 1920x1080, 2560x1080 and 3440x1440; the top menu fits from 1000px windows up.');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1);});
