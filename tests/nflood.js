const { chromium } = require('playwright');
const U='file:///tmp/claude-0/-home-user/86605f0b-afe5-5be4-abf8-bc0a57b0d89f/scratchpad/app/index.html';
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport:{width:1300,height:900} });
  const errs=[]; p.on('pageerror',e=>errs.push(e.message));
  await p.goto(U); await p.waitForTimeout(400); await p.click('#t-new'); await p.click('#cr-go'); await p.waitForTimeout(600);
  const t0 = Date.now();
  await p.evaluate(()=>{ window.__n=[]; window.__cards=[]; new MutationObserver(ms=>ms.forEach(m=>m.addedNodes.forEach(n=>{ if(n.classList&&n.classList.contains('note')) setTimeout(()=>window.__cards.push((n.classList.contains('digest')?'DIGEST: ':'card: ')+n.innerText.replace(/\n+/g,' / ').slice(0,150)),50); }))).observe(document.getElementById('notes'),{childList:true}); const o=DQ.notify; DQ.notify=function(x){ window.__n.push([Math.round(performance.now()/100)/10, x.kind, x.key||'', String(x.title).slice(0,40)]); return o.apply(this,arguments); }; });
  await p.click('.startp .btn');
  const steps = [ ['fishing',60],['fishing',120],['woodcutting',100],['fishing',300],['woodcutting',300],['attack',150],['strength',150],['fishing',600],['woodcutting',700],['fishing',900],['cooking',0],['woodcutting',1200],['fishing',1500],['attack',400] ];
  let max=0; const vis=[];
  for (const [sk,x] of steps) { await p.evaluate(([s,x])=>{ DQ.addXp(s,x*3); }, [sk,x]); await p.waitForTimeout(900); if(sk==='cooking'||sk==='woodcutting'&&x===300) await p.screenshot({path:'nf_'+sk+x+'.png'}); vis.push(await p.evaluate(()=>document.querySelectorAll('.note:not(.out)').length)); }
  await p.waitForTimeout(1500);
  console.log('cards shown', JSON.stringify(await p.evaluate(()=>window.__cards),null,1));
  const n = await p.evaluate(()=>window.__n); console.log('notify calls', n.length); n.forEach(r=>console.log(r.join(' · ')));
  console.log('visible cards over time', vis.join(','), 'queue max', Math.max(...vis));
  console.log('errors', errs); await b.close();
})();
