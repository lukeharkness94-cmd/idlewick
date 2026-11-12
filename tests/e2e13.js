const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
  const errs = []; p.on('pageerror', e => errs.push('PAGEERR ' + e.message + ' ' + (e.stack||'').split('\n')[1])); p.on('console', m => { if (m.type()==='error' && !/fonts|ERR_|net::/.test(m.text())) errs.push('CONSOLE ' + m.text()); });
  await p.goto('file:///tmp/claude-0/-home-user/86605f0b-afe5-5be4-abf8-bc0a57b0d89f/scratchpad/app/index.html'); await p.waitForTimeout(400); await p.click('#t-new'); await p.click('#cr-go'); await p.waitForTimeout(900);
  await p.evaluate(()=>{ DQ.S.settings.notify=false; document.querySelectorAll('.note').forEach(n=>n.remove()); });
  await p.screenshot({ path: '/tmp/claude-0/-home-user/86605f0b-afe5-5be4-abf8-bc0a57b0d89f/scratchpad/v_home0.png' });
  await p.click('.startp .btn'); await p.waitForTimeout(400);
  await p.evaluate(()=>{ const S=DQ.S,D=DQ.data; S.xp.fishing=D.XPF[8]; S.xp.woodcutting=D.XPF[6]; S.xp.attack=D.XPF[7]; S.coins=90; });
  await p.waitForTimeout(6000); await p.evaluate(()=>DQ.ui.render(false)); await p.waitForTimeout(500);
  await p.screenshot({ path: '/tmp/claude-0/-home-user/86605f0b-afe5-5be4-abf8-bc0a57b0d89f/scratchpad/v_home1.png', fullPage: true });
  await p.click('#skilldock .dk'); await p.waitForTimeout(400); await p.screenshot({ path: '/tmp/claude-0/-home-user/86605f0b-afe5-5be4-abf8-bc0a57b0d89f/scratchpad/v_skills.png' });
  for (const h of ['combat','world','hero','home']) { await p.click('.hub[data-a="'+h+'"]'); await p.waitForTimeout(300); console.log(h, '->', await p.evaluate(()=>DQ.ui.view)); }
  await p.click('.hub[data-a="quests"]'); await p.waitForTimeout(300); await p.screenshot({ path: '/tmp/claude-0/-home-user/86605f0b-afe5-5be4-abf8-bc0a57b0d89f/scratchpad/v_world.png' });
  await p.setViewportSize({ width: 390, height: 844 }); await p.click('.hub[data-a="home"]'); await p.waitForTimeout(500);
  console.log('overflow', await p.evaluate(()=>document.documentElement.scrollWidth - innerWidth)); await p.screenshot({ path: '/tmp/claude-0/-home-user/86605f0b-afe5-5be4-abf8-bc0a57b0d89f/scratchpad/v_phone.png' });
  for (const pg of ['fishing','combat','map','character','quests','farming','house']) { await p.evaluate(id=>DQ.go(id), pg); await p.waitForTimeout(250); const o=await p.evaluate(()=>document.documentElement.scrollWidth - innerWidth); if (o>0) console.log('overflow', pg, o); }
  console.log('errors:', JSON.stringify(errs)); await b.close();
})();
