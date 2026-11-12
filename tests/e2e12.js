const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
  const errs = []; p.on('pageerror', e => errs.push('PAGEERR ' + e.message)); p.on('console', m => { if (m.type()==='error' && !/fonts|ERR_|net::/.test(m.text())) errs.push('CONSOLE ' + m.text()); });
  await p.goto('file:///tmp/claude-0/-home-user/86605f0b-afe5-5be4-abf8-bc0a57b0d89f/scratchpad/app/index.html'); await p.waitForTimeout(400); await p.click('#t-new'); await p.click('#cr-go'); await p.waitForTimeout(900);
  await p.evaluate(()=>{ const S=DQ.S,D=DQ.data; S.settings.notify=false; document.querySelectorAll('.note').forEach(n=>n.remove()); S.towns.willowbrook.boss=true; S.towns.mossbarrow={visited:true,boss:true}; S.towns.saltmere={visited:false,boss:false}; S.xp.farming=D.XPF[40]; DQ.give('seed_strawberry',10); DQ.give('seed_potato',10); });
  await p.screenshot({ path: '/tmp/claude-0/-home-user/86605f0b-afe5-5be4-abf8-bc0a57b0d89f/scratchpad/g_ov.png' });
  await p.evaluate(()=>DQ.go('map')); await p.waitForTimeout(600); await p.screenshot({ path: '/tmp/claude-0/-home-user/86605f0b-afe5-5be4-abf8-bc0a57b0d89f/scratchpad/g_map.png' });
  await p.evaluate(()=>{ DQ.go('farming'); DQ.plant(0,'strawberry'); DQ.plant(1,'potato'); DQ.S.farm.plots[0].at -= 999999; DQ.S.farm.plots[1].at -= DQ.S.farm.plots[1].dur*.5; DQ.emit('farm'); }); await p.waitForTimeout(600); await p.screenshot({ path: '/tmp/claude-0/-home-user/86605f0b-afe5-5be4-abf8-bc0a57b0d89f/scratchpad/g_farm.png' });
  await p.evaluate(()=>{ DQ.give('bronze_helm',1); DQ.equipItem('bronze_helm'); DQ.go('character'); }); await p.waitForTimeout(500); await p.screenshot({ path: '/tmp/claude-0/-home-user/86605f0b-afe5-5be4-abf8-bc0a57b0d89f/scratchpad/g_char.png' });
  console.log('errors:', JSON.stringify(errs)); await b.close();
})();
