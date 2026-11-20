const {chromium}=require('playwright'),assert=require('node:assert/strict');
(async()=>{const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||undefined,headless:true,args:['--no-sandbox']});try{
 const context=await browser.newContext(),page=await context.newPage(),url=process.env.IDLEWICK_URL||'http://127.0.0.1:8765/index.html';
 await page.goto(url);await page.locator('#t-new').click();await page.locator('#crname').fill('Save QA');await page.locator('#cr-go').click();await page.waitForTimeout(600);
 await page.evaluate(()=>{DQ.paused=true;DQ.S.coins=1234;DQ.S.xp.fishing=1000;if(!DQ.save())throw Error(DQ.saveHealth);});
 await page.reload();await page.waitForFunction(()=>window.DQ?.S?.name==='Save QA');assert.equal(await page.evaluate(()=>DQ.S.coins),1234);assert.equal(await page.evaluate(()=>DQ.S.xp.fishing),1000);
 // Reopen with the same browser storage, as a retained browser profile would.
 const state=await context.storageState(),reopened=await browser.newContext({storageState:state}),p=await reopened.newPage();await p.goto(url);await p.waitForFunction(()=>window.DQ?.S?.name==='Save QA');assert.equal(await p.evaluate(()=>DQ.S.coins),1234);
 // A new preview storage context has no access to the previous preview's hero.
 const fresh=await browser.newContext(),empty=await fresh.newPage();await empty.goto(url);await empty.waitForFunction(()=>!!window.DQ);assert.equal(await empty.evaluate(()=>DQ.hasSave()),false);
 const feedback=await p.evaluate(()=>{const messages=[];DQ.toast=(text,error)=>messages.push({text,error});const set=Storage.prototype.setItem;Storage.prototype.setItem=()=>{throw Error('quota');};try{DQ.ui.DO.savenow();return {messages,health:DQ.saveHealth};}finally{Storage.prototype.setItem=set;}});assert.equal(feedback.messages[0].error,true);assert.match(feedback.messages[0].text,/could not be saved/);
 const success=await p.evaluate(()=>{let result;DQ.toast=(text,error)=>result={text,error};DQ.ui.DO.savenow();return result;});assert.equal(success.error,false);assert.match(success.text,/browser location/);
 await p.locator('#t-cont').click();await p.evaluate(()=>{DQ.paused=true;for(let i=0;i<12;i++)DQ.closeModal();DQ.ui.tab.settingsPanel='saves';DQ.go('settings');});assert.match(await p.locator('#view').innerText(),/do not sync with your ChatGPT account/);assert.ok(await p.locator('[data-do="dlsave"]').isVisible());
 console.log('PASS retained storage reload/reopen, isolated preview storage, failed/successful Save now feedback, and backup guidance.');
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exit(1);});
