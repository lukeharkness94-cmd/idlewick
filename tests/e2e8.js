const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } }); const p = await ctx.newPage();
  const errs = []; p.on('pageerror', e => errs.push('PAGEERR ' + e.message)); p.on('console', m => { if (m.type()==='error' && !/fonts|ERR_|net::/.test(m.text())) errs.push('CONSOLE ' + m.text()); });
  await p.goto('file:///tmp/claude-0/-home-user/86605f0b-afe5-5be4-abf8-bc0a57b0d89f/scratchpad/app/index.html'); await p.waitForTimeout(400);
  await p.click('#t-new'); await p.fill('#crname','Tess'); await p.click('#cr-go'); await p.waitForTimeout(800);
  await p.evaluate(()=>{ const S=DQ.S,D=DQ.data; S.settings.notify=false; document.querySelectorAll('.note').forEach(n=>n.remove()); ['attack','strength','defence'].forEach(k=>S.xp[k]=D.XPF[14]); S.xp.hitpoints=D.XPF[20]; DQ.give('herring',60); DQ.give('bronze_hammer',1); });
  await p.evaluate(()=>DQ.go('fishing')); await p.hover('.card[data-b="shrimp"]'); await p.click('.card[data-b="shrimp"] .qadd'); await p.waitForTimeout(300);
  await p.evaluate(()=>DQ.go('woodcutting')); await p.hover('.card[data-b="normal"]'); await p.click('.card[data-b="normal"] .qadd'); await p.waitForTimeout(300);
  console.log('act', await p.evaluate(()=>DQ.actLabel()), 'queue', await p.evaluate(()=>JSON.stringify(DQ.S.queue)));
  await p.click('.h-tb'); await p.waitForTimeout(300); await p.click('[data-do="setpace"][data-a="push"]'); await p.click('[data-do="setrule"][data-a="count:50"]'); await p.waitForTimeout(200);
  await p.screenshot({ path: '/tmp/claude-0/-home-user/86605f0b-afe5-5be4-abf8-bc0a57b0d89f/scratchpad/q_plan.png' });
  console.log('pace/rule', await p.evaluate(()=>DQ.act.pace+' '+DQ.act.rule));
  await p.click('.m-act .btn'); await p.waitForTimeout(300);
  await p.evaluate(()=>{ DQ.stopAct(true); DQ.S.queue=[]; DQ.equipItem('bronze_hammer'); DQ.go('combat'); }); await p.waitForTimeout(300);
  await p.click('[data-do="abil"][data-a="power"]'); await p.waitForTimeout(200);
  await p.click('[data-do="forecast"]'); await p.waitForTimeout(2500);
  console.log('forecast', await p.evaluate(()=>document.querySelector('[id^="fc-"]').textContent));
  await p.screenshot({ path: '/tmp/claude-0/-home-user/86605f0b-afe5-5be4-abf8-bc0a57b0d89f/scratchpad/q_combat.png', fullPage: true });
  // away events
  await p.evaluate(()=>{ DQ.startAct('fish','shrimp',{pace:'push'}); DQ.save(); });
  await p.addInitScript(()=>{ try{ const k='dashboard-quest-save-v2', r=localStorage.getItem(k); if(r){ const o=JSON.parse(r); o.lastSeen=Date.now()-2.5*3600*1000; localStorage.setItem(k, JSON.stringify(o)); } }catch(e){} });
  await p.reload(); await p.waitForTimeout(600); await p.click('#t-cont', {timeout:3000}); await p.waitForTimeout(1200);
  await p.screenshot({ path: '/tmp/claude-0/-home-user/86605f0b-afe5-5be4-abf8-bc0a57b0d89f/scratchpad/q_return.png' });
  console.log('inbox', await p.evaluate(()=>(DQ.S.inbox||[]).map(e=>e.type).join(',')));
  const btn = await p.$('.modal [data-do="decide"]'); if (btn) { await btn.click(); await p.waitForTimeout(300); }
  console.log('inbox after', await p.evaluate(()=>(DQ.S.inbox||[]).length));
  console.log('errors:', JSON.stringify(errs)); await b.close();
})();
