const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
  const errs = []; p.on('pageerror', e => errs.push('PAGEERR ' + e.message)); p.on('console', m => { if (m.type()==='error' && !/fonts|ERR_|net::/.test(m.text())) errs.push('CONSOLE ' + m.text()); });
  await p.goto('file:///tmp/claude-0/-home-user/86605f0b-afe5-5be4-abf8-bc0a57b0d89f/scratchpad/app/index.html'); await p.waitForTimeout(400);
  await p.click('#t-new'); await p.fill('#crname','Wren'); await p.click('#cr-go'); await p.waitForTimeout(800);
  await p.evaluate(()=>{ const S=DQ.S,D=DQ.data; S.towns.willowbrook.boss=true; S.towns.mossbarrow={visited:false,boss:false}; ['attack','strength','defence'].forEach(k=>S.xp[k]=D.XPF[20]); DQ.give('shrimp',100); document.querySelectorAll('.note').forEach(n=>n.remove()); S.settings.notify=false; });
  await p.evaluate(()=>DQ.go('map')); await p.waitForTimeout(600); await p.screenshot({ path: '/tmp/claude-0/-home-user/86605f0b-afe5-5be4-abf8-bc0a57b0d89f/scratchpad/p_map.png' });
  await p.click('.mt[data-a="mossbarrow"]'); await p.waitForTimeout(200); await p.click('[data-do="travel"]'); await p.waitForTimeout(1800);
  console.log('town', await p.evaluate(()=>DQ.S.town)); await p.waitForTimeout(800); await p.screenshot({ path: '/tmp/claude-0/-home-user/86605f0b-afe5-5be4-abf8-bc0a57b0d89f/scratchpad/p_map2.png' });
  await p.evaluate(()=>{ DQ.go('combat'); DQ.data.MON.boar.drops.forEach(d=>d[2]=Math.max(d[2],.35)); }); await p.click('.card[data-b="boar"]'); await p.waitForTimeout(7000);
  await p.screenshot({ path: '/tmp/claude-0/-home-user/86605f0b-afe5-5be4-abf8-bc0a57b0d89f/scratchpad/p_combat.png' });
  await p.hover('.card[data-b="wolf"]'); await p.waitForTimeout(500); await p.screenshot({ path: '/tmp/claude-0/-home-user/86605f0b-afe5-5be4-abf8-bc0a57b0d89f/scratchpad/p_tip.png' });
  await p.setViewportSize({ width: 390, height: 844 }); await p.evaluate(()=>DQ.go('map')); await p.waitForTimeout(400);
  console.log('overflow', await p.evaluate(()=>document.documentElement.scrollWidth - innerWidth));
  console.log('errors:', JSON.stringify(errs)); await b.close();
})();
