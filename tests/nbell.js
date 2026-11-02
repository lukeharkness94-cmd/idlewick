const { chromium } = require('playwright');
const U='file:///tmp/claude-0/-home-user/86605f0b-afe5-5be4-abf8-bc0a57b0d89f/scratchpad/app/index.html';
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport:{width:390,height:844} });
  const errs=[]; p.on('pageerror',e=>errs.push(e.message));
  await p.goto(U); await p.waitForTimeout(400); await p.click('#t-new'); await p.click('#cr-go'); await p.waitForTimeout(600);
  await p.click('.startp .btn');
  await p.evaluate(()=>{ DQ.addXp('fishing',2000); DQ.addXp('woodcutting',900); }); await p.waitForTimeout(2600);
  console.log('digest rows', await p.evaluate(()=>document.querySelectorAll('.note.digest .dg-row').length));
  await p.screenshot({path:'nb_phone.png'});
  // click first row -> navigates and dismisses
  await p.click('.note.digest .dg-row'); await p.waitForTimeout(500);
  console.log('after click view', await p.evaluate(()=>DQ.ui.view), 'digest left', await p.evaluate(()=>document.querySelectorAll('.note.digest:not(.out)').length));
  // death/warn immediate card still works
  await p.evaluate(()=>DQ.notify({kind:'warn',key:'stopped',icon:'info',title:'Task stopped',text:'You ran out of food or health.'})); await p.waitForTimeout(400);
  console.log('warn card', await p.evaluate(()=>[...document.querySelectorAll('.note:not(.out)')].map(n=>n.className+' | '+n.querySelector('b').innerText)));
  // bell
  await p.click('.bellb'); await p.waitForTimeout(400);
  console.log('bell rows', await p.evaluate(()=>document.querySelectorAll('.bell-row').length), 'dot after', await p.evaluate(()=>{const d=document.querySelector('.belldot'); return d&&!d.hidden}));
  await p.screenshot({path:'nb_bell.png'});
  await p.click('.bell-row .btn'); await p.waitForTimeout(400); console.log('bell action went to', await p.evaluate(()=>DQ.ui.view));
  console.log('overflow', await p.evaluate(()=>document.documentElement.scrollWidth-innerWidth), 'errors', errs); await b.close();
})();
