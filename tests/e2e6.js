const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
  const errs = []; p.on('pageerror', e => errs.push('PAGEERR ' + e.message)); p.on('console', m => { if (m.type()==='error' && !/fonts|ERR_|net::/.test(m.text())) errs.push('CONSOLE ' + m.text()); });
  await p.goto('file:///tmp/claude-0/-home-user/86605f0b-afe5-5be4-abf8-bc0a57b0d89f/scratchpad/app/index.html'); await p.waitForTimeout(400);
  await p.click('#t-new'); await p.fill('#crname','Wren'); await p.click('#cr-go'); await p.waitForTimeout(800);
  await p.evaluate(()=>{ const S=DQ.S; S.xp.fishing=DQ.data.XPF[30]; S.xp.mining=3000; S.q.miners_pick={s:'done',p:[6,6]}; DQ.give('log_normal',12); document.querySelectorAll('.note').forEach(n=>n.remove()); });
  await p.waitForTimeout(1800);
  await p.evaluate(()=>DQ.go('smithing')); await p.waitForTimeout(400); await p.screenshot({ path: '/tmp/claude-0/-home-user/86605f0b-afe5-5be4-abf8-bc0a57b0d89f/scratchpad/m_locked.png' });
  await p.click('[data-do="qstart"]'); await p.waitForTimeout(300);
  await p.evaluate(()=>{ DQ.ui.questTab='active'; DQ.go('quests'); }); await p.waitForTimeout(400); await p.screenshot({ path: '/tmp/claude-0/-home-user/86605f0b-afe5-5be4-abf8-bc0a57b0d89f/scratchpad/m_quests.png' });
  await p.click('.tab[data-a="upcoming"]'); await p.waitForTimeout(300); await p.screenshot({ path: '/tmp/claude-0/-home-user/86605f0b-afe5-5be4-abf8-bc0a57b0d89f/scratchpad/m_upcoming.png' });
  await p.evaluate(()=>DQ.go('overview')); await p.waitForTimeout(400); await p.screenshot({ path: '/tmp/claude-0/-home-user/86605f0b-afe5-5be4-abf8-bc0a57b0d89f/scratchpad/m_ov.png' });
  console.log('errors:', JSON.stringify(errs)); await b.close();
})();
