const { chromium } = require('playwright');
const U='file:///tmp/claude-0/-home-user/86605f0b-afe5-5be4-abf8-bc0a57b0d89f/scratchpad/app/index.html';
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport:{width:390,height:844} });
  const errs=[]; p.on('pageerror',e=>errs.push(e.message));
  await p.goto(U); await p.waitForTimeout(400); await p.click('#t-new'); await p.click('#cr-go'); await p.waitForTimeout(700);
  await p.evaluate(()=>{ DQ.S.settings.notify=false; DQ.S.settings.dev=true; DQ.startAct('fish','shrimp',{quiet:true}); DQ.S.xp.fishing=DQ.data.XPF[12]; DQ.S.exportedAt=0; });
  await p.waitForTimeout(1500);
  for (const pg of ['overview','house','hirelings','achievements','mastery','settings','balance','farming','character','research']) {
    await p.evaluate(id=>DQ.go(id), pg); await p.waitForTimeout(350);
    console.log(pg.padEnd(13),'overflow', await p.evaluate(()=>document.documentElement.scrollWidth-innerWidth), 'h', await p.evaluate(()=>document.documentElement.scrollHeight));
    if(['overview','settings','balance'].includes(pg)) await p.screenshot({path:`pol_ph_${pg}.png`, fullPage:pg!=='overview'});
  }
  console.log('errors',JSON.stringify(errs)); await b.close();
})();
