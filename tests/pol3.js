const { chromium } = require('playwright'); const fs=require('fs');
const U='file:///tmp/claude-0/-home-user/86605f0b-afe5-5be4-abf8-bc0a57b0d89f/scratchpad/app/index.html';
(async () => {
  const b = await chromium.launch(); const ctx = await b.newContext({ viewport:{width:1300,height:900}, acceptDownloads:true }); const p = await ctx.newPage();
  const errs=[]; p.on('pageerror',e=>errs.push('PAGEERR '+e.message+' '+(e.stack||'').split('\n')[1]));
  await p.goto(U); await p.waitForTimeout(500); await p.click('#t-new'); await p.click('#cr-go'); await p.waitForTimeout(800);
  await p.evaluate(()=>{ DQ.S.settings.notify=false; DQ.startAct('fish','shrimp',{quiet:true}); DQ.S.xp.fishing=DQ.data.XPF[10]; });
  await p.evaluate(()=>{ DQ.save(); });
  const raw = await p.evaluate(()=>{ const k='dashboard-quest-save-v2', o=JSON.parse(localStorage.getItem(k)); o.lastSeen=Date.now()-3*3600e3; return JSON.stringify(o); });
  await p.goto(U); await p.evaluate(r=>localStorage.setItem('dashboard-quest-save-v2', r), raw);
  await p.goto(U, {waitUntil:'load'}); await p.evaluate(r=>localStorage.setItem('dashboard-quest-save-v2', r), raw); await p.waitForTimeout(300);
  await p.click('#t-cont'); await p.waitForTimeout(1200);
  console.log('modal', await p.evaluate(()=>{const m=document.querySelector('.modal .m-body'); return m? m.innerText.replace(/\n+/g,' | ').slice(0,300):'none'}));
  await p.keyboard.press('Escape'); await p.waitForTimeout(300);
  await p.evaluate(()=>DQ.go('overview')); await p.waitForTimeout(300);
  console.log('away card', await p.evaluate(()=>{const a=document.querySelector('.awaycard'); return a? a.innerText.replace(/\n+/g,' | ').slice(0,300):'none'}));
  await p.screenshot({path:'pol_away.png'});
  await p.click('[data-do="awaydismiss"]'); await p.waitForTimeout(300);
  console.log('after dismiss', await p.evaluate(()=>!!document.querySelector('.awaycard')));
  // download + upload
  await p.evaluate(()=>DQ.go('settings')); await p.waitForTimeout(300);
  const [dl] = await Promise.all([p.waitForEvent('download'), p.click('[data-do="dlsave"]')]);
  const path = await dl.path(); const txt = fs.readFileSync(path,'utf8'); console.log('download', dl.suggestedFilename(), txt.length);
  await p.waitForTimeout(300);
  console.log('exportedAt set', await p.evaluate(()=>DQ.S.exportedAt>0));
  // change state, then import file
  await p.evaluate(()=>{ DQ.S.coins=123456; DQ.save(); });
  await p.evaluate(()=>DQ.go('settings')); await p.waitForTimeout(200);
  fs.writeFileSync('/tmp/imp.txt', txt);
  await Promise.all([p.waitForNavigation({waitUntil:'load'}).catch(()=>{}), p.setInputFiles('#impfile','/tmp/imp.txt')]);
  await p.waitForTimeout(800);
  console.log('after import coins', await p.evaluate(()=>{ return JSON.parse(localStorage.getItem('dashboard-quest-save-v2')).coins; }));
  console.log('backups', await p.evaluate(()=>JSON.stringify(JSON.parse(localStorage.getItem('dashboard-quest-backups')||'[]').map(b=>b.reason))));
  console.log('errors', JSON.stringify(errs)); await b.close();
})();
