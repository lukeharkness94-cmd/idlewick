/* Optional browser check for live crop growth: start scripts/preview.py, then node tests/ui-farming.cjs.
   A planted crop must move soil -> sprout -> young plant -> mature on the open Farming page (no navigation), with the
   artwork, accessible label, timer text and harvestability agreeing at every step; harvest auto-replants the chosen
   crop, offline catch-up ripens it, and an empty plot shows soil. */
const assert=require('node:assert/strict');
let chromium;try{({chromium}=require('playwright'));}catch(e){console.log('SKIP ui-farming: playwright is not installed');process.exit(0);}
(async()=>{
 const browser=await chromium.launch(require('node:fs').existsSync('/opt/pw-browsers/chromium')?{}:{});
 try{
  const page=await browser.newPage({viewport:{width:1300,height:900}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(process.env.IDLEWICK_URL||'http://127.0.0.1:8765/');
  await page.locator('#t-new').click();await page.locator('#crname').fill('Grower');await page.locator('#cr-go').click();await page.waitForTimeout(600);await page.keyboard.press('Escape');
  await page.evaluate(()=>{DQ.closeModal&&DQ.closeModal();const S=DQ.S;while(DQ.advLvl()<10)S.xp.fishing+=3000;S.xp.farming=Math.max(S.xp.farming,DQ.data.XPF[10]);S.inv.seed_onion=3;DQ.ui.seed='onion';S.farm.next='onion';DQ.go('farming');});
  assert.equal(await page.evaluate(()=>DQ.plant(0,'onion')),true);
  const read=()=>page.evaluate(()=>{const e=document.querySelector('.plot[data-a="0"]'),i=e.querySelector('.pspr img');return {label:e.getAttribute('aria-label'),alt:i&&i.alt,src:i&&i.src,time:e.querySelector('.ptime').textContent,ripe:e.classList.contains('ripe'),harvestable:DQ.plotRipe(DQ.S.farm.plots[0])};});
  const at=f=>page.evaluate(f=>{const P=DQ.S.farm.plots[0];P.at=(DQ.S.gameTime||0)-P.dur*f;},f);
  const seen=[];
  for(const [f,alt] of [[.01,'just sown'],[.2,'growing'],[.6,'growing'],[1.01,'ready to harvest']]){
   await at(f);await page.waitForTimeout(1300);const r=await read();seen.push(r.src);
   assert.match(r.alt,new RegExp(alt),'artwork describes the stage at '+f);
   assert.equal(r.ripe,f>=1);assert.equal(r.harvestable,f>=1);
   assert.match(r.label,f>=1?/ready to harvest/:/growing/);assert.equal(r.time==='Ready to harvest',f>=1);
  }
  assert.equal(new Set(seen).size,4,'each growth stage shows different artwork without leaving the page');
  await page.evaluate(()=>DQ.ui.DO.plot('0'));await page.waitForTimeout(1300);
  let r=await read();assert.match(r.label,/Onion: growing/,'harvest auto-replants the chosen crop');assert.equal(r.src,seen[0],'and the art returns to freshly sown');
  assert.equal(await page.evaluate(()=>DQ.S.farm.next),'onion','the chosen next crop is kept');
  await page.evaluate(()=>DQ.simulate(DQ.S.farm.plots[0].dur*1.1));await page.waitForTimeout(1300);
  r=await read();assert.equal(r.ripe,true,'offline catch-up ripens the plot on screen');assert.equal(r.src,seen[3]);
  await page.evaluate(()=>{delete DQ.S.inv.seed_onion;DQ.ui.DO.plot('0');});await page.waitForTimeout(1300);
  r=await read();assert.match(r.label,/Empty plot/);assert.equal(r.alt,'Empty soil');assert.equal(r.time,'Empty');
  assert.deepEqual(errors,[]);
  console.log('PASS live crop growth: four stages on screen, labels and harvestability agree, auto-replant, offline catch-up and empty soil.');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1);});
