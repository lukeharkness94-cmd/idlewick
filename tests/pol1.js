const { chromium } = require('playwright');
const U='file:///tmp/claude-0/-home-user/86605f0b-afe5-5be4-abf8-bc0a57b0d89f/scratchpad/app/index.html';
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1300, height: 900 } });
  const errs=[]; p.on('pageerror',e=>errs.push('PAGEERR '+e.message+' '+(e.stack||'').split('\n')[1])); p.on('console',m=>{ if(m.type()==='error'&&!/fonts|ERR_|net::/.test(m.text())) errs.push('CONSOLE '+m.text()); });
  await p.goto(U); await p.waitForTimeout(500); await p.click('#t-new'); await p.click('#cr-go'); await p.waitForTimeout(800);
  await p.evaluate(()=>{ DQ.S.settings.notify=false; });
  console.log('fresh home guide?', await p.evaluate(()=>!!document.querySelector('.guide')));
  await p.click('.startp .btn'); await p.waitForTimeout(1500);
  await p.evaluate(()=>{ DQ.S.xp.fishing=DQ.data.XPF[3]; }); await p.waitForTimeout(500);
  await p.evaluate(()=>DQ.go('overview')); await p.waitForTimeout(400);
  console.log('guide:', await p.evaluate(()=>{const g=document.querySelector('.guide'); return g? g.innerText.replace(/\n+/g,' | '):'none';}));
  console.log('nudge dots:', await p.evaluate(()=>[...document.querySelectorAll('.hubdot.nudge')].map(e=>e.parentNode.dataset.a)));
  console.log('upnext count:', await p.evaluate(()=>document.querySelectorAll('#goalbox .goal').length));
  await p.screenshot({path:'pol_home.png'});
  await p.evaluate(()=>{DQ.S.xp.fishing=DQ.data.XPF[40]; DQ.S.xp.woodcutting=DQ.data.XPF[40];}); await p.waitForTimeout(300);
  await p.click('.hub[data-a="hero"]'); await p.waitForTimeout(400);
  console.log('hero tabs:', await p.evaluate(()=>[...document.querySelectorAll('#subnav .stab')].map(e=>e.innerText.replace(/\n/g,' '))));
  for (const pg of ['house','hirelings','achievements','mastery','settings','balance','research']) {
    await p.evaluate(id=>DQ.go(id), pg); await p.waitForTimeout(300);
    console.log(pg, 'seg:', await p.evaluate(()=>{const s=document.querySelector('.groupseg'); return s? s.innerText.replace(/\n/g,' / '):'-'}), 'on tab:', await p.evaluate(()=>{const o=document.querySelector('#subnav .stab.on'); return o?o.innerText.replace(/\n/g,' '):'none'}));
  }
  await p.evaluate(()=>{ DQ.S.settings.dev=true; DQ.go('settings'); }); await p.waitForTimeout(300);
  console.log('settings seg', await p.evaluate(()=>document.querySelector('.groupseg').innerText.replace(/\n/g,' / ')));
  await p.screenshot({path:'pol_settings.png', fullPage:true});
  await p.evaluate(()=>DQ.go('balance')); await p.waitForTimeout(300); await p.screenshot({path:'pol_balance.png', fullPage:true});
  console.log('balance rows', await p.evaluate(()=>document.querySelectorAll('.baltab tbody tr').length));
  console.log('backup ok', await p.evaluate(()=>{ DQ.backup('test'); return JSON.stringify(DQ.backups()); }));
  await p.evaluate(()=>DQ.go('settings')); await p.waitForTimeout(200);
  console.log('bk rows', await p.evaluate(()=>document.querySelectorAll('.bkrow').length));
  console.log('errors', JSON.stringify(errs)); await b.close();
})();
