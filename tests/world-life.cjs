/* World Life in the real page: the full-screen event scene and its waiting inbox entry (owner, 26 Nov 2026), a raid and its repair, the tower and museum pages,
   hidden recipes in the crafting menu, and the audio engine through fights and travel (no stacking).
   Needs a preview server: IDLEWICK_URL=http://127.0.0.1:8765/index.html node tests/world-life.cjs */
const assert=require('node:assert/strict');const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||undefined});const p=await b.newPage({viewport:{width:1440,height:900}});const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.goto(process.env.IDLEWICK_URL||'http://127.0.0.1:8765/index.html');await p.locator('#t-new').click();await p.locator('#crname').fill('World');await p.locator('#cr-go').click();await p.waitForTimeout(800);
await p.evaluate(()=>{const S=DQ.S,D=DQ.data;S.tut.prepareCombat=false;for(const k of Object.keys(S.xp))S.xp[k]=D.XPF[50];for(const s of D.SKILLS)S.unlocked[s.id]=true;S.coins=20000;S.hp=DQ.maxHp();S.inv.shrimp=60;S.inv.log_normal=60;S.settings.notify=false;for(const [id,pr] of Object.entries(D.PROJECTS))if(pr.town==='willowbrook')S.projects[id]=true;DQ.fxDirty();DQ.closeModal&&DQ.closeModal();});
const close=()=>p.evaluate(()=>{for(let i=0;i<4;i++)if(DQ.closeModal&&document.querySelector('.modal'))DQ.closeModal();});
/* the event (owner, 26 Nov 2026): a full-screen scene; Decide later leaves it waiting in the inbox; a choice shows the outcome in place and writes the journal */
await close();await p.evaluate(()=>DQ.worldFire('bard'));await p.waitForTimeout(300);
assert.equal(await p.locator('.modal.event-fullscreen.world-moment').count(),1,'full-screen event scene shown');assert.equal(await p.locator('#worldcard .wc').count(),0,'no small card any more');
await p.locator('.world-moment .m-act button',{hasText:'Decide later'}).click();await p.waitForTimeout(150);assert.equal(await p.locator('.modal').count(),0,'Decide later closes it');
assert.equal(await p.evaluate(()=>DQ.S.inbox.filter(e=>e.type==='world').length),1,'and it waits in the inbox');
await p.evaluate(()=>DQ.ui.DO.worldopen());await p.locator('.world-moment').waitFor();
const coins=await p.evaluate(()=>DQ.S.coins);await p.locator('.world-moment [data-do="decide"][data-b="pay"]').click();await p.waitForTimeout(200);
{const r=await p.evaluate(c=>[DQ.S.coins,c,DQ.buffs().map(x=>x.name),DQ.S.inbox.length],coins);assert.ok(r[2].some(n=>/bard/i.test(n))&&r[0]<r[1]&&r[3]===0,'paid, buff running, settled '+JSON.stringify(r));}assert.match(await p.locator('.world-moment .ev-result').innerText(),/tune/i,'the outcome is shown');
assert.ok(await p.evaluate(()=>DQ.S.journal.some(e=>/wandering bard/i.test(e.text))),'journal entry');await close();
/* a raid ignored on purpose: buildings damaged, a Repair button on the Village page puts them back */
await p.evaluate(()=>{DQ.worldState.result=null;DQ.worldFire('raid');DQ.worldChoose('hide');DQ.closeModal();DQ.go('projects');});await p.waitForTimeout(400);await close();
const dmg=await p.locator('.damaged-row [data-do="repair"]').count();assert.ok(dmg>=2&&dmg<=3,'damaged buildings listed');
for(let i=0;i<dmg;i++){await p.locator('.damaged-row [data-do="repair"]').first().click();await p.waitForTimeout(150);}assert.equal(await p.locator('.damaged-row').count(),0,'all repaired');assert.equal(await p.evaluate(()=>Object.keys(DQ.S.damaged).length),0);
/* an event fight: chosen in the scene it starts the fight, a pill shows it under way, the win resolves it */
await p.evaluate(()=>{DQ.worldState.result=null;DQ.worldFire('bandits');});await p.locator('.world-moment [data-do="decide"][data-b="fight"]').click();await p.waitForTimeout(300);
assert.equal(await p.locator('.modal').count(),0,'the scene closes for the fight');assert.equal(await p.locator('#worldcard .wc-pill').count(),1,'a pill shows it under way');
assert.equal(await p.evaluate(()=>DQ.ui.view),'combat');assert.equal(await p.evaluate(()=>DQ.act&&DQ.act.id),'ev_bandits');
await p.evaluate(()=>{for(let i=0;i<600&&DQ.worldState.active;i++)DQ.advanceTime(1000,1000,DQ.act?DQ.act.progress||0:0);});await p.waitForTimeout(300);
assert.equal(await p.evaluate(()=>!!DQ.worldState.active),false,'the fight settled the event');assert.ok(await p.evaluate(()=>DQ.S.journal.some(e=>/Bandits on the road/.test(e.text))));
/* museum and tower pages; a rumoured recipe is ??? and a learned one is makeable */
await p.evaluate(()=>{DQ.stopAct(true);DQ.worldState.result=null;DQ.go('museum');});await p.waitForTimeout(400);await close();
assert.ok(await p.locator('.mu-wing').count()>=5,'five wings');assert.ok(await p.locator('.mu-wing .tag').first().innerText(),'wing bonus labelled');
await p.evaluate(()=>DQ.go('tower'));await p.waitForTimeout(400);assert.ok(await p.locator('.tw-floor').count()>=5);assert.match(await p.locator('.tw-main .tag').innerText(),/combat \d+/i,'recommended strength shown');
await p.locator('.tw-floor.next [data-do="towerselect"]').click();await p.locator('.tc-action [data-do="towerfight"]').click();await p.waitForTimeout(400);assert.equal(await p.evaluate(()=>DQ.ui.view),'combat');assert.ok(await p.evaluate(()=>DQ.data.MON[DQ.act.id].tower.floor===1));
await p.evaluate(()=>{DQ.stopAct(true);DQ.hearRecipe('stonebread');DQ.ui.tab.cooking='Discovered recipes';DQ.go('cooking');});await p.waitForTimeout(500);await close();
assert.ok(await p.locator('.illustrated-card.locked[data-task-id="secret_stonebread"]').count()===1,'a rumour shows as a locked ??? card');assert.equal(await p.locator('[data-task-id="secret_hunters_feast"]').count(),0,'an unheard recipe is not listed');
await p.evaluate(()=>{DQ.learnRecipe('stonebread');DQ.grant('bread',2);DQ.grant('ore_coal',1);DQ.ui.render(false);});await p.waitForTimeout(300);await close();assert.equal(await p.locator('.illustrated-card.locked[data-task-id="secret_stonebread"]').count(),0,'once learned with discovered ingredients it is an ordinary recipe');
/* audio: start it, then fights, travel and tier changes; one bed at a time, timers bounded */
await p.evaluate(()=>{DQ.S.settings.music=true;DQ.S.settings.sfx=true;DQ.S.settings.ambience=true;DQ.musicStart();});await p.waitForTimeout(400);
const st=()=>p.evaluate(()=>Object.assign(DQ.audioStats(),{mode:DQ.audioState().mode,tier:DQ.audioState().tier}));
let a=await st();if(a.state!=='none'){assert.equal(a.town,'willowbrook');assert.equal(a.tier,'restored');const nodes=a.ambienceNodes;
 for(let i=0;i<4;i++){await p.evaluate(()=>{DQ.startAct('fight','chicken',{quiet:true});DQ.ambienceRefresh();});assert.equal((await st()).mode,'combat');await p.evaluate(()=>{DQ.stopAct(true);DQ.ambienceRefresh();});}
 a=await st();assert.equal(a.mode,'village');assert.equal(a.ambienceNodes,nodes,'fights never add or restart the bed');
 await p.evaluate(()=>{DQ.S.damaged={well:1,inn:1,forge:1,garden:1,library:1};DQ.ambienceRefresh();});a=await st();assert.notEqual(a.tier,'restored');assert.ok(a.ambienceNodes<=nodes,'a new tier replaces the old layers');
 await p.evaluate(()=>{DQ.S.damaged={};DQ.S.towns.mossbarrow={visited:true,boss:false};DQ.S.town='mossbarrow';DQ.ambienceRefresh();});a=await st();assert.equal(a.town,'mossbarrow');assert.ok(a.ambienceNodes<=nodes+2&&a.ambienceTimers<20,'travel crossfades without stacking');
 await p.evaluate(()=>{DQ.S.settings.ambience=false;DQ.ambienceRefresh();});assert.equal((await st()).ambienceNodes,0,'ambience off stops everything');}
assert.deepEqual(errs,[]);console.log('World Life browser checks passed');await b.close();})().catch(e=>{console.error(e);process.exit(1);});
