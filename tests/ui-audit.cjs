/* All-page experience audit. Uses a fresh isolated browser profile. */
const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs');
(async()=>{
 const b=await chromium.launch({headless:true,args:['--no-sandbox'],...(fs.existsSync('/usr/bin/chromium')?{executablePath:'/usr/bin/chromium'}:{})});
 try{
 const p=await b.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));
 await p.goto(process.env.IDLEWICK_URL||'http://127.0.0.1:8765/');await p.locator('#t-new').click();await p.locator('#crname').fill('Audit');await p.locator('#cr-go').click();
 await p.evaluate(()=>{DQ.paused=true;DQ.S.settings.muted=true;DQ.S.tut.hidden=true;});
 const pages=await p.evaluate(()=>[...new Set([...Object.keys(DQ.ui.V).filter(k=>!['gather','recipes','balance'].includes(k)),...DQ.data.SKILLS.map(s=>s.page)])]);
 let count=0;
 for(const progressed of [false,true]){
 if(progressed)await p.evaluate(()=>{for(const sk of DQ.data.SKILLS){DQ.S.xp[sk.id]=300000;DQ.S.unlocked[sk.id]=true;}DQ.S.coins=100000;DQ.fxDirty();});
 for(const [width,height]of [[390,844],[1440,720],[1920,1080],[2560,1440],[3440,1440]])for(const theme of ['dark','light']){
 await p.setViewportSize({width,height});await p.evaluate(t=>{DQ.S.settings.theme=t;DQ.applyTheme();},theme);
 for(const page of pages){
 await p.evaluate(id=>DQ.go(id),page);
 const state=await p.evaluate(()=>({error:document.querySelector('#view').textContent.includes('Something went wrong'),overflow:document.documentElement.scrollWidth>innerWidth,duplicate:[...document.querySelectorAll('#subnav [data-do="go"]')].some(e=>DQ.data.SK[e.dataset.a]||e.dataset.a==='brewery'),sidebar:[...document.querySelectorAll('.dk')].map(e=>{const r=e.getBoundingClientRect();return {top:r.top,bottom:r.bottom,text:e.querySelector('.dk-n').getBoundingClientRect().bottom,inner:e.querySelector('.dk-info').getBoundingClientRect().bottom};}),dockBottom:document.querySelector('.dock').getBoundingClientRect().bottom,dockScroll:getComputedStyle(document.querySelector('.dock')).overflowY,rail:document.querySelector('.rail').getBoundingClientRect().top}));
 assert.equal(state.error,false,`${page} render`);assert.equal(state.overflow,false,`${page} ${width} ${theme} overflow`);
 if(width>860){assert.equal(state.duplicate,false,`${page} duplicate skill nav`);assert.ok(state.dockBottom<=state.rail+2,`${page} sidebar exceeds navigation`);assert.equal(state.dockScroll,'auto',`${page} shorter windows must allow skill scrolling`);for(const row of state.sidebar){assert.ok(row.inner<=row.bottom-3,`${page} sidebar content lacks padding`);}}
 if(!progressed&&['hunting','exploration','enchanting','brewery'].includes(page))assert.doesNotMatch(await p.locator('#view').innerText(),/Hero level 99/);
 count++;
 }
 }
 }
 await p.setViewportSize({width:1440,height:900});await p.evaluate(()=>{DQ.S.settings.theme='dark';DQ.applyTheme();DQ.go('fishing');});await p.waitForTimeout(900);await p.screenshot({path:'/tmp/idlewick-audit-skills.png'});
 await p.evaluate(()=>{DQ.ui.beastTab='monsters';DQ.go('bestiary');});await p.waitForTimeout(900);await p.screenshot({path:'/tmp/idlewick-audit-guide.png'});
 await p.evaluate(()=>DQ.go('combat'));await p.waitForTimeout(900);await p.screenshot({path:'/tmp/idlewick-audit-combat.png'});
 // Real unlock path and a persistent first-use lesson.
 await p.evaluate(()=>{DQ.S=DQ.newState('Unlock');DQ.S.settings.muted=true;DQ.S.settings.notify=false;DQ.S.stats.chop=20;DQ.S.inv.wooden_trap=3;for(const k of ['attack','strength','defence','hitpoints'])DQ.S.xp[k]=DQ.data.XPF[10];DQ.checkActionUnlocks();DQ.closeModal();DQ.go('hunting');});
 assert.equal(await p.locator('.skill-coach').count(),1);assert.match(await p.locator('.skill-coach').innerText(),/Try this/);
 await p.evaluate(()=>{DQ.go('overview');DQ.go('hunting');});assert.equal(await p.locator('.skill-coach').count(),1);
 await p.locator('[data-do="lessonclose"]').click();await p.evaluate(()=>{DQ.go('overview');DQ.go('hunting');});assert.equal(await p.locator('.skill-coach').count(),0);
 assert.deepEqual(errors,[]);console.log(`PASS ${count} page/state/theme/viewport combinations; sidebar fit, unlocks and persistent tutorials.`);
 }finally{await b.close();}
})().catch(e=>{console.error(e);process.exit(1)});
