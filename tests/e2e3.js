const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } }); const p = await ctx.newPage();
  const errs = []; p.on('pageerror', e => errs.push('PAGEERR ' + e.message)); p.on('console', m => { if (m.type()==='error' && !/fonts|ERR_|net::/.test(m.text())) errs.push('CONSOLE ' + m.text()); });
  await p.goto('file:///tmp/claude-0/-home-user/86605f0b-afe5-5be4-abf8-bc0a57b0d89f/scratchpad/app/index.html'); await p.waitForTimeout(400);
  await p.click('#t-new'); await p.fill('#crname','Brenna'); await p.click('#cr-go'); await p.waitForTimeout(800);
  await p.evaluate(() => { const S=DQ.S, D=DQ.data;
    ['fishing','woodcutting','mining','cooking','smithing','crafting','thieving','attack','strength','defence','hitpoints','ranged','magic'].forEach(k=>S.xp[k]=D.XPF[k==='hitpoints'?40:32]);
    S.towns.saltmere={visited:true,boss:false}; S.town='saltmere'; DQ.give('raw_trout',200); DQ.startAct('fish','trout'); DQ.save(); });
  await p.waitForTimeout(500);
  await p.addInitScript(()=>{ try{ const k='dashboard-quest-save-v2', r=localStorage.getItem(k); if(r){ const o=JSON.parse(r); o.lastSeen=Date.now()-3*3600*1000; localStorage.setItem(k, JSON.stringify(o)); } }catch(e){} });
  await p.reload(); await p.waitForTimeout(500); await p.click('#t-cont'); await p.waitForTimeout(1200);
  await p.screenshot({ path: '/tmp/claude-0/-home-user/86605f0b-afe5-5be4-abf8-bc0a57b0d89f/scratchpad/s_welcome.png' });
  console.log('modal?', await p.evaluate(()=>!!document.querySelector('.modal')), 'fishing xp', await p.evaluate(()=>Math.round(DQ.S.xp.fishing)), 'notes', await p.evaluate(()=>document.querySelectorAll('.note').length));
  await p.click('.m-act .btn'); await p.waitForTimeout(800); await p.screenshot({ path: '/tmp/claude-0/-home-user/86605f0b-afe5-5be4-abf8-bc0a57b0d89f/scratchpad/s_after.png' });
  console.log('errors:', JSON.stringify(errs));
  await b.close();
})();
