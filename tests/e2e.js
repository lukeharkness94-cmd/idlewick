const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
  const errs = []; p.on('pageerror', e => errs.push('PAGEERR ' + e.message)); p.on('console', m => { if (m.type()==='error' && !/fonts|ERR_|net::/.test(m.text())) errs.push('CONSOLE ' + m.text()); });
  await p.goto('file:///tmp/claude-0/-home-user/86605f0b-afe5-5be4-abf8-bc0a57b0d89f/scratchpad/app/index.html'); await p.waitForTimeout(800);
  await p.screenshot({ path: '/tmp/claude-0/-home-user/86605f0b-afe5-5be4-abf8-bc0a57b0d89f/scratchpad/s_title.png' });
  await p.click('#t-new'); await p.waitForTimeout(300); await p.fill('#crname','Aldric'); await p.click('.swatch[data-k="tunic"]:nth-child(3)');
  await p.screenshot({ path: '/tmp/claude-0/-home-user/86605f0b-afe5-5be4-abf8-bc0a57b0d89f/scratchpad/s_create.png' });
  await p.click('#cr-go'); await p.waitForTimeout(1200);
  await p.evaluate(()=>DQ.go('fishing')); await p.waitForTimeout(400);
  await p.click('.card[data-b="shrimp"]'); await p.waitForTimeout(5000);
  await p.screenshot({ path: '/tmp/claude-0/-home-user/86605f0b-afe5-5be4-abf8-bc0a57b0d89f/scratchpad/s_fishing.png' });
  const pages = ['overview','woodcutting','mining','thieving','cooking','smithing','crafting','magic','combat','map','shop','quests','character','bank','achievements','settings'];
  for (const pg of pages) { await p.evaluate(id => DQ.go(id), pg); await p.waitForTimeout(250); const txt = await p.evaluate(()=>document.querySelector('#view').innerText.length); if (txt < 40) errs.push('EMPTY PAGE ' + pg); }
  await p.evaluate(()=>DQ.go('overview')); await p.waitForTimeout(500);
  await p.screenshot({ path: '/tmp/claude-0/-home-user/86605f0b-afe5-5be4-abf8-bc0a57b0d89f/scratchpad/s_overview.png' });
  await p.evaluate(()=>DQ.go('combat')); await p.click('.card[data-b="chicken"]'); await p.waitForTimeout(6500);
  await p.screenshot({ path: '/tmp/claude-0/-home-user/86605f0b-afe5-5be4-abf8-bc0a57b0d89f/scratchpad/s_combat.png' });
  await p.evaluate(()=>DQ.go('map')); await p.waitForTimeout(600); await p.screenshot({ path: '/tmp/claude-0/-home-user/86605f0b-afe5-5be4-abf8-bc0a57b0d89f/scratchpad/s_map.png' });
  await p.evaluate(()=>DQ.go('quests')); await p.waitForTimeout(400); await p.screenshot({ path: '/tmp/claude-0/-home-user/86605f0b-afe5-5be4-abf8-bc0a57b0d89f/scratchpad/s_quests.png' });
  await p.evaluate(()=>DQ.go('character')); await p.waitForTimeout(400); await p.screenshot({ path: '/tmp/claude-0/-home-user/86605f0b-afe5-5be4-abf8-bc0a57b0d89f/scratchpad/s_char.png' });
  console.log('xp', await p.evaluate(()=>JSON.stringify(DQ.S.xp)));
  console.log('errors:', JSON.stringify(errs, null, 1));
  await b.close();
})();
