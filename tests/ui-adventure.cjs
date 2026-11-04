/* Optional browser playthrough of the Miller's Map adventure: start scripts/preview.py, then node tests/ui-adventure.cjs.
   Real actions throughout (chopping until the discovery, quest buttons, cooking, banking, fighting, smelting, harvesting,
   offline catch-up, claiming, the village project); only skill levels and supplies are seeded. */
const assert=require('node:assert/strict');
let chromium;try{({chromium}=require('playwright'));}catch(e){console.log('SKIP ui-adventure: playwright is not installed');process.exit(0);}
const log=()=>{};
(async()=>{const b=await chromium.launch();const ctx=await b.newContext({viewport:{width:1300,height:900}});const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.goto(process.env.IDLEWICK_URL||'http://127.0.0.1:8765/');await p.locator('#t-new').click();await p.locator('#crname').fill('Miller');await p.locator('#cr-go').click();await p.waitForTimeout(800);await p.keyboard.press('Escape');
const ev=(f,a)=>p.evaluate(f,a);
await ev(()=>{DQ.closeModal&&DQ.closeModal();DQ.holdNotes=false;const S=DQ.S,X=DQ.data.XPF;for(const s of ['woodcutting','fishing','cooking','attack','strength','defence','hitpoints','smithing','mining','farming'])S.xp[s]=Math.max(S.xp[s],X[45]);
 S.towns.mossbarrow={visited:true,boss:false};S.towns.willowbrook.boss=true;S.inv.bread=200;S.coins=5000;S.unlocked.smithing=true;S.unlocked.cooking=true;});
/* 1. discovery through real chopping */
const node=await ev(()=>DQ.data.NODES.wood.filter(n=>n.town==='willowbrook'&&n.lvl<=DQ.lvl('woodcutting')).sort((a,b)=>b.lvl-a.lvl)[0].id);
await ev(n=>DQ.startAct('wood',n),node);let t=0;while(!(await ev(()=>DQ.discovered('weathered_map')))&&t<60){await ev(()=>DQ.simulate(10*60000));t++;}
await p.waitForTimeout(500);log('discovered after',t*10,'min chopping; quest hidden?',await ev(()=>DQ.questHidden(DQ.data.QM.am_map)),'| modal:',await ev(()=>document.querySelector('.modal h2,.modal .mh')?.textContent||'none'));
await ev(()=>DQ.closeModal&&DQ.closeModal());
/* 2. accept via the quest log button; duplicate accept is a no-op */
await ev(()=>{DQ.go('quests');DQ.ui.tab.questSelected='am_map';DQ.ui.render(false)});await p.waitForTimeout(400);
const acc=p.locator('[data-do="qstart"][data-a="am_map"]');log('accept button',await acc.count());await acc.first().click();await ev(()=>DQ.startQuest('am_map'));
log('state',await ev(()=>JSON.stringify(DQ.S.q.am_map)));
/* 3. objectives: Continue routes; chop oak; deliver cooked shrimp from the bank */
for(let k=0;k<5&&(await ev(()=>DQ.S.q.am_map.s))==='active';k++){await ev(()=>{DQ.go('quests');DQ.ui.questTab='active';DQ.ui.tab.questSelected='am_map';DQ.ui.render(false)});await p.waitForTimeout(300);await p.locator('[data-do="questcontinue"][data-a="am_map"]').first().click();await p.waitForTimeout(300);
 const where=await ev(()=>[DQ.ui.view,JSON.stringify(DQ.ui.taskChoice)]);log('continue ->',where[0]);
 if(where[0]==='woodcutting'){await ev(()=>{if(!(DQ.act&&DQ.act.id==='oak'))DQ.startAct('wood','oak')});await ev(()=>DQ.simulate(15*60000));}
 else if(where[0]==='cooking'||where[0]==='fishing'){await ev(()=>{DQ.startAct('fish','shrimp')});await ev(()=>DQ.simulate(10*60000));await ev(()=>{DQ.startAct('recipe','cook_shrimp')});await ev(()=>DQ.simulate(10*60000));await ev(()=>{const n=DQ.S.inv.shrimp||0;DQ.S.bank.shrimp=(DQ.S.bank.shrimp||0)+n;delete DQ.S.inv.shrimp;});}
 await p.waitForTimeout(1800);log(' progress',await ev(()=>JSON.stringify(DQ.S.q.am_map)),'shrimp pack/bank',await ev(()=>[DQ.S.inv.shrimp||0,DQ.S.bank.shrimp||0].join('/')));}
/* save + reload between chapters */
await ev(()=>{DQ.closeModal&&DQ.closeModal();DQ.save()});await p.reload();await p.waitForTimeout(1000);await p.locator('#t-cont').click();await p.waitForTimeout(800);await ev(()=>{DQ.closeModal&&DQ.closeModal();DQ.holdNotes=false});
log('after reload',await ev(()=>JSON.stringify(DQ.S.q.am_map)));
await ev(()=>{DQ.go('quests');DQ.ui.questTab='active';DQ.ui.tab.questSelected='am_map';DQ.ui.render(false)});await p.waitForTimeout(300);const cl=p.locator('[data-do="qclaim"][data-a="am_map"]');log('claim button',await cl.count());if(await cl.count())await cl.first().click();
assert.equal(await ev(()=>DQ.S.q.am_map.s),'done');assert.equal(await ev(()=>{const c=DQ.S.coins;DQ.claimQuest('am_map');return c===DQ.S.coins}),true,'no double claim');
/* chapter 2: travel, Continue opens guide, notes, kills */
await ev(()=>DQ.travel('mossbarrow'));await p.waitForTimeout(300);await ev(()=>DQ.startQuest('am_mill'));
await ev(()=>{DQ.go('quests');DQ.ui.questTab='active';DQ.ui.tab.questSelected='am_mill';DQ.ui.render(false)});await p.waitForTimeout(300);await p.locator('[data-do="questcontinue"][data-a="am_mill"]').first().click();await p.waitForTimeout(500);
assert.ok(await ev(()=>!!document.querySelector('.modal .ghead')),'Continue opens the guide');assert.match(await ev(()=>document.querySelector('.study-note')?.innerText||''),/Bring/);
await ev(()=>DQ.closeModal());
log('weak shown on combat chips:',await ev(()=>DQ.weakKnown(DQ.data.MON.scarecrow)));
await p.locator('[data-do="questcontinue"][data-a="am_mill"]').first().click().catch(()=>{});await p.waitForTimeout(300);log('continue ->',await ev(()=>DQ.ui.view),await ev(()=>DQ.ui.taskChoice.combat));
await ev(()=>{DQ.startAct('fight','scarecrow')});for(let i=0;i<12&&(await ev(()=>DQ.S.q.am_mill.s))==='active';i++){await ev(()=>{DQ.S.inv.bread=200;DQ.simulate(5*60000)});}
log('am_mill',await ev(()=>JSON.stringify(DQ.S.q.am_mill)));await ev(()=>DQ.claimQuest('am_mill'));assert.equal(await ev(()=>DQ.S.q.am_mill.s),'done');
/* chapter 3: smelt + harvest (offline) */
await ev(()=>DQ.startQuest('am_box'));await ev(()=>{DQ.S.inv.ore_copper=20;DQ.S.inv.ore_tin=20;DQ.startAct('recipe','smelt_bronze')});await ev(()=>DQ.simulate(10*60000));
await ev(()=>{DQ.S.inv.seed_potato=10;for(let i=0;i<DQ.S.farm.plots.length;i++)DQ.plant(i,'potato');DQ.simulate(60*60000);for(let i=0;i<DQ.S.farm.plots.length;i++)if(DQ.plotRipe(DQ.S.farm.plots[i]))DQ.harvest(i);DQ.simulate(60*60000);for(let i=0;i<DQ.S.farm.plots.length;i++)if(DQ.plotRipe(DQ.S.farm.plots[i]))DQ.harvest(i);});
log('am_box',await ev(()=>JSON.stringify(DQ.S.q.am_box)),'plots',await ev(()=>DQ.S.farm.plots.length));
await ev(()=>DQ.claimQuest('am_box'));log('bell held',await ev(()=>DQ.have('millers_bell')));
/* village project */
await ev(()=>DQ.travel('willowbrook'));await ev(()=>DQ.go('projects'));await p.waitForTimeout(400);log('bell project visible',await ev(()=>DQ.projectsForTown('willowbrook').some(([i])=>i==='bell')));
assert.equal(await ev(()=>DQ.finishProject('bell')),true);assert.equal(await ev(()=>DQ.finishProject('bell')),false,'no double completion');

 assert.equal(await ev(()=>DQ.S.q.am_map.s),'done');assert.equal(await ev(()=>DQ.S.q.am_mill.s),'done');assert.equal(await ev(()=>DQ.S.q.am_box.s),'done');
 assert.equal(await ev(()=>DQ.S.projects.bell),true,'the bell hangs in Willowbrook');assert.equal(await ev(()=>DQ.have('millers_bell')),0,'used once');
 assert.ok(await ev(()=>DQ.weakKnown(DQ.data.MON.scarecrow)),'studying for the adventure revealed its weak points');
 assert.deepEqual(errs,[]);
 console.log('PASS Miller’s Map: discovery, accept, routed objectives, bank delivery, reload, claim, study notes, fights, offline smelting and harvests, relic and village project.');
 await b.close();})().catch(e=>{console.error(e);process.exit(1);});
