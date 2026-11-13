/* Codex's seven recommendations (Nov 2026), checked in the real page:
   1 cutscenes only for main quests · 2 clear town-project states · 3 restoration payoff in the village
   4 expedition food plan and "Batch complete" · 5 Hunting and Exploration roles · 6 companion choice by job
   7 truthful "why you need it" uses. */
const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs');
(async()=>{const b=await chromium.launch({headless:true,args:['--no-sandbox'],...(fs.existsSync('/usr/bin/chromium')?{executablePath:'/usr/bin/chromium'}:{})});
try{const p=await b.newPage({viewport:{width:1440,height:790}}),errors=[];p.on('pageerror',e=>errors.push(e.message));
await p.goto(process.env.IDLEWICK_URL||'http://127.0.0.1:8765/index.html');await p.locator('#t-new').click();await p.locator('#cr-go').click();await p.waitForTimeout(900);
await p.evaluate(()=>{const S=DQ.S,D=DQ.data;S.settings.muted=true;S.tut.hidden=true;S.settings.notify=false;for(const k of ['attack','strength','defence','hitpoints'])S.xp[k]=D.XPF[6];for(const k of ['cooking','fishing','hunting','exploration'])S.xp[k]=D.XPF[12];S.unlocked.cooking=S.unlocked.hunting=S.unlocked.exploration=true;for(let i=0;i<8;i++)DQ.closeModal();});
/* 1 */
const c=await p.evaluate(()=>{const all=Object.values(DQ.data.STORY_SCENES),side=all.filter(s=>!DQ.storyCinematic(s));let modals=0;for(const s of side.slice(0,12)){DQ.S.settings.storyScenes=true;try{DQ.openStory(s.id);}catch(e){}modals+=document.querySelectorAll('.story-modal').length;for(let i=0;i<4;i++)DQ.closeModal();}return {cin:all.length-side.length,side:side.length,modals};});
assert.ok(c.cin<=16&&c.side>40,'only main-quest and boss scenes are cutscenes: '+JSON.stringify(c));assert.equal(c.modals,0,'side scenes never open a cutscene');
/* 2 + 3 */
const v=await p.evaluate(()=>{const S=DQ.S,D=DQ.data,ids=Object.keys(D.PROJECTS).filter(k=>D.PROJECTS[k].town==='willowbrook'&&!D.PROJECTS[k].relic),c0=D.PROJECTS[ids[0]].cost;S.coins=2000;for(const[k,n]of Object.entries(c0))if(k!=='coins')S.inv[k]=n+2;let alt=null;for(const id of ids.slice(1)){const f=Object.keys(D.PROJECTS[id].cost).find(k=>k!=='coins'&&!(k in c0));if(f){S.inv[f]=2;alt=id;break;}}DQ.go('projects');DQ.ui.tab.projectChoice=ids[0];DQ.ui.render(false);return {ids,alt,states:Object.fromEntries(ids.map(i=>[i,DQ.projectState(i)]))};});
assert.equal(v.states[v.ids[0]],'ready');assert.equal(v.states[v.alt],'can');assert.ok(Object.values(v.states).includes('needs'),'some site still needs supplies');
assert.equal(await p.locator('.site-spot.ps-ready').count(),1);assert.ok(await p.locator('.site-spot.ps-needs').count()>=1);assert.equal(await p.locator('.site-legend .sl').count(),3);assert.match(await p.locator('.site-now').innerText(),/Ready to finish|Can contribute|Needs supplies/);
assert.match(await p.locator('.site-spot.ps-ready').getAttribute('data-tip'),/Ready to finish/);
await p.evaluate(()=>DQ.ui.DO.projectfinish(DQ.ui.tab.projectChoice));await p.locator('.restoration-feedback').waitFor({state:'visible'});const fb=await p.locator('.restoration-feedback').innerText();assert.match(fb,/restored/i);assert.match(fb,/Active now/);assert.equal(await p.locator('.story-modal').count(),0,'restoration shows in the village, not a cutscene');
/* 4 */
const e=await p.evaluate(async()=>{const S=DQ.S;S.inv.shrimp=2;S.inv.raw_shrimp=12;S.town='willowbrook';DQ.ui.taskChoice.combat='goblin';DQ.go('combat');await new Promise(r=>setTimeout(r,1500));const x=DQ.expedition();return {unknown:!!x.unknown,perMin:x.perMin,minutes:x.minutes,pill:document.querySelector('.ready-line [data-do="planfood"]')&&document.querySelector('.ready-line [data-do="planfood"]').textContent};});
assert.ok(!e.unknown&&e.perMin>0&&isFinite(e.minutes),'food lasts is estimated from a dry run: '+JSON.stringify(e));assert.match(e.pill,/Food/);
await p.locator('.ready-line [data-do="planfood"]').click();assert.match(await p.locator('.modal').innerText(),/plan your food/i);await p.locator('[data-do="planfood"][data-a="120"]').click();assert.match(await p.locator('.modal').innerText(),/2 hours/);
await p.locator('[data-do="planfoodgo"]').click();const lim=await p.evaluate(()=>DQ.act&&{k:DQ.act.kind,limit:DQ.act.limit});assert.equal(lim.k,'recipe');assert.ok(lim.limit>0);
const done=await p.evaluate(async()=>{DQ.S.settings.notify=true;DQ.act.limit=2;for(let i=0;i<30&&DQ.act;i++)DQ.advanceTime(4000,4000,0);await new Promise(r=>setTimeout(r,300));return {stopped:!DQ.act,made:DQ.have('shrimp'),note:(DQ.noteLog||[]).slice(0,3).map(n=>n.o?n.o.title:'').join('|')+[...document.querySelectorAll('#notes .note')].map(n=>n.innerText.slice(0,40)).join('|')};});
assert.ok(done.stopped,'the batch stops by itself');assert.match(done.note,/Batch complete/);
/* 5 */
await p.evaluate(()=>{DQ.S.beast.kills.chicken=3;DQ.go('hunting');});assert.match(await p.locator('.hunt-lead').innerText(),/today.s hunt/i);assert.ok(await p.locator('[data-do="huntgo"]').count()>=1);
await p.evaluate(()=>DQ.go('exploration'));assert.match(await p.locator('.explore-lead').innerText(),/next worthwhile discovery/i);assert.equal(await p.locator('.discoveries').count(),1,'discoveries panel shown once');
/* 7 */
const u=await p.evaluate(()=>{const S=DQ.S,D=DQ.data;S.pinnedProject=Object.keys(D.PROJECTS).find(k=>D.PROJECTS[k].town===S.town&&!S.projects[k]&&D.PROJECTS[k].cost.log_normal);return {log:DQ.usesOf('log_normal').map(x=>x.text),boat:DQ.usesOf('plank_normal').map(x=>x.text),tip:DQ.tips.item('log_normal')};});
assert.ok(u.log.some(t=>/restoration/.test(t)),'logs: '+u.log.join('|'));assert.ok(u.boat.some(t=>/next boat/.test(t)));assert.match(u.tip,/Why you need it/);
/* 6 */
await p.evaluate(()=>{const S=DQ.S,D=DQ.data;for(const k of Object.keys(S.xp))S.xp[k]=D.XPF[30];for(const s of D.SKILLS)S.unlocked[s.id]=true;S.coins=9000;S.towns.mossbarrow={visited:true,boss:true};DQ.awardPet('bond_wolf',{quiet:true,hatched:true});DQ.setPet('bond_wolf');DQ.ui.beastMode='shed';DQ.go('beastmastery');});await p.waitForTimeout(800);
assert.match(await p.locator('.beast-preview').innerText(),/why choose it/i);assert.ok(await p.locator('.beast-targets .bc-job').count()>=2,'targets name their job');
const arr=await p.evaluate(async()=>{DQ.sendBeastTrap('bond_boar','basic');const j=DQ.S.pets.expedition;j.roll=0;j.due=Date.now()-1;DQ.resolveBeastTrap();await new Promise(r=>setTimeout(r,700));if(!DQ.eggOf('bond_boar'))return 'no egg';if(!/egg/i.test((document.querySelector('.modal')||{}).innerText||''))return 'no egg pop-up';DQ.closeModal();DQ.eggOf('bond_boar').due=Date.now()-1;DQ.hatchDue();await new Promise(r=>setTimeout(r,1200));return document.querySelector('.modal')&&document.querySelector('.modal').innerText;});
assert.match(arr,/Provider/);assert.match(arr,/Different job from your Hearthwolf/);assert.match(arr,/Bring along/);await p.getByRole('button',{name:'Bring along'}).click();assert.equal(await p.evaluate(()=>DQ.S.pets.active),'bond_boar');
assert.deepEqual(errors,[]);console.log("PASS Codex's seven recommendations: main-quest cutscenes only, three project states, restoration in the village, expedition food plan with Batch complete, Hunting and Exploration roles, companion choice by job, truthful uses.");
}finally{await b.close();}})();
