const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
  const errs = []; p.on('pageerror', e => errs.push('PAGEERR ' + e.message)); p.on('console', m => { if (m.type()==='error' && !/fonts|ERR_|net::/.test(m.text())) errs.push('CONSOLE ' + m.text()); });
  await p.goto('file:///tmp/claude-0/-home-user/86605f0b-afe5-5be4-abf8-bc0a57b0d89f/scratchpad/app/index.html'); await p.waitForTimeout(400); await p.click('#t-new'); await p.click('#cr-go'); await p.waitForTimeout(800);
  await p.evaluate(()=>{ const S=DQ.S,D=DQ.data; S.settings.notify=false; document.querySelectorAll('.note').forEach(n=>n.remove()); D.MONLIST.forEach(m=>S.beast.kills[m.id]=12); D.PETS.forEach(pp=>DQ.awardPet(pp.id)); S.towns.mossbarrow={visited:true,boss:false}; S.xp.farming=D.XPF[60]; S.coins=99999; });
  await p.evaluate(()=>DQ.go('combat')); await p.click('.card[data-b="goblin"]'); await p.waitForTimeout(2500); await p.screenshot({ path: '/tmp/claude-0/-home-user/86605f0b-afe5-5be4-abf8-bc0a57b0d89f/scratchpad/s24_combat.png' });
  await p.evaluate(()=>{ DQ.stopAct(true); DQ.go('bestiary'); }); await p.waitForTimeout(400); await p.screenshot({ path: '/tmp/claude-0/-home-user/86605f0b-afe5-5be4-abf8-bc0a57b0d89f/scratchpad/s24_beast.png' });
  await p.click('[data-do="beasttab"][data-a="pets"]'); await p.waitForTimeout(400); await p.screenshot({ path: '/tmp/claude-0/-home-user/86605f0b-afe5-5be4-abf8-bc0a57b0d89f/scratchpad/s24_pets.png' });
  await p.evaluate(()=>{ ['hen','cow','sheep','pig'].forEach(a=>{DQ.S.farm.pensBought=6; DQ.buyAnimal(a);}); DQ.go('farming'); }); await p.waitForTimeout(400);
  await p.evaluate(()=>document.querySelector('.pens').scrollIntoView()); await p.screenshot({ path: '/tmp/claude-0/-home-user/86605f0b-afe5-5be4-abf8-bc0a57b0d89f/scratchpad/s24_farm.png' });
  console.log('errors:', JSON.stringify(errs)); await b.close();
})();
