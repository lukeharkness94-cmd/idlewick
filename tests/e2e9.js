const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
  const errs = []; p.on('pageerror', e => errs.push('PAGEERR ' + e.message)); p.on('console', m => { if (m.type()==='error' && !/fonts|ERR_|net::/.test(m.text())) errs.push('CONSOLE ' + m.text()); });
  await p.goto('file:///tmp/claude-0/-home-user/86605f0b-afe5-5be4-abf8-bc0a57b0d89f/scratchpad/app/index.html'); await p.waitForTimeout(400);
  await p.click('#t-new'); await p.fill('#crname','Robin'); await p.click('#cr-go'); await p.waitForTimeout(900);
  await p.screenshot({ path: '/tmp/claude-0/-home-user/86605f0b-afe5-5be4-abf8-bc0a57b0d89f/scratchpad/r_ov.png' });
  await p.click('.pin [data-do="qstart"]').catch(()=>{}); await p.waitForTimeout(300);
  await p.evaluate(()=>DQ.go('fishing')); await p.click('.card[data-b="shrimp"]'); await p.waitForTimeout(500);
  await p.evaluate(()=>{ DQ.S.xp.fishing = DQ.data.XPF[2]-1; }); await p.waitForTimeout(6000);
  await p.screenshot({ path: '/tmp/claude-0/-home-user/86605f0b-afe5-5be4-abf8-bc0a57b0d89f/scratchpad/r_fish.png' });
  await p.evaluate(()=>{ DQ.S.hp=1; DQ.go('combat'); }); await p.click('.card[data-b="cow"]'); await p.waitForTimeout(5000);
  await p.screenshot({ path: '/tmp/claude-0/-home-user/86605f0b-afe5-5be4-abf8-bc0a57b0d89f/scratchpad/r_death.png' });
  console.log('death note actions', await p.evaluate(()=>[...document.querySelectorAll('.note[data-key="death"] .n-act')].map(b=>b.textContent).join('|')));
  console.log('notes w/o actions', await p.evaluate(()=>[...document.querySelectorAll('.note')].filter(n=>!n.querySelector('.n-act')).map(n=>n.querySelector('b').textContent).join('|')));
  await p.evaluate(()=>DQ.go('quests')); await p.waitForTimeout(400); await p.screenshot({ path: '/tmp/claude-0/-home-user/86605f0b-afe5-5be4-abf8-bc0a57b0d89f/scratchpad/r_quests.png' });
  await p.setViewportSize({ width: 390, height: 844 }); for (const pg of ['overview','fishing','quests','combat']) { await p.evaluate(id=>DQ.go(id), pg); await p.waitForTimeout(250); const o=await p.evaluate(()=>document.documentElement.scrollWidth - innerWidth); if (o>0) console.log('overflow', pg, o); }
  console.log('errors:', JSON.stringify(errs)); await b.close();
})();
