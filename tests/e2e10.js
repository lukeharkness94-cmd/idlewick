const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
  const errs = []; p.on('pageerror', e => errs.push('PAGEERR ' + e.message));
  await p.goto('file:///tmp/claude-0/-home-user/86605f0b-afe5-5be4-abf8-bc0a57b0d89f/scratchpad/app/index.html'); await p.waitForTimeout(400); await p.click('#t-new'); await p.click('#cr-go'); await p.waitForTimeout(800);
  await p.evaluate(()=>{ document.querySelectorAll('.note').forEach(n=>n.remove()); ['death','stopped','overflow','ach:x','beast:cow','furn:bed','w:1','taskdone'].forEach((k,i)=>setTimeout(()=>DQ.notify({key:k,title:'T '+k,text: k==='stopped'?'Out of arrows.':'x', ttl:20000}), i*10)); });
  await p.waitForTimeout(2500);
  console.log(await p.evaluate(()=>[...document.querySelectorAll('.note')].map(n=>n.dataset.key+'=>'+[...n.querySelectorAll('.n-act')].map(b=>b.textContent).join('/')).join('  ')));
  await p.click('.note[data-key="death"] .n-act'); await p.waitForTimeout(300); console.log('view after click', await p.evaluate(()=>DQ.ui.view));
  console.log('errors', JSON.stringify(errs)); await b.close();
})();
