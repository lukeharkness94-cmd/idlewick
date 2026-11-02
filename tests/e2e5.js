const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
  const errs = []; p.on('pageerror', e => errs.push('PAGEERR ' + e.message)); p.on('console', m => { if (m.type()==='error' && !/fonts|ERR_|net::/.test(m.text())) errs.push('CONSOLE ' + m.text()); });
  await p.goto('file:///tmp/claude-0/-home-user/86605f0b-afe5-5be4-abf8-bc0a57b0d89f/scratchpad/app/index.html'); await p.waitForTimeout(400);
  await p.click('#t-new'); await p.fill('#crname','Rowan'); await p.click('#cr-go'); await p.waitForTimeout(800);
  await p.evaluate(()=>DQ.go('fishing')); await p.click('.card[data-b="shrimp"]'); await p.waitForTimeout(3000);
  console.log('offline tip shown', await p.evaluate(()=>!!document.querySelector('.note[data-key="offline"]')));
  await p.screenshot({ path: '/tmp/claude-0/-home-user/86605f0b-afe5-5be4-abf8-bc0a57b0d89f/scratchpad/n_fish.png' });
  for (const pg of ['overview','farming','house','hirelings','bestiary','map','combat']) { await p.evaluate(id=>DQ.go(id), pg); await p.waitForTimeout(200); }
  await p.evaluate(() => { const S=DQ.S, D=DQ.data; DQ.stopAct(true);
    ['fishing','woodcutting','mining','cooking','smithing','crafting','thieving','attack','strength','defence','hitpoints','ranged','magic','farming'].forEach(k=>S.xp[k]=D.XPF[k==='hitpoints'?40:32]);
    S.coins=60000; S.towns.mossbarrow={visited:true,boss:true}; S.towns.willowbrook.boss=true; S.towns.saltmere={visited:false,boss:false}; S.town='mossbarrow';
    DQ.give('seed_potato',20); DQ.give('seed_strawberry',10); DQ.give('feed',40); DQ.give('log_oak',100); DQ.give('log_normal',100); DQ.give('cowhide',20);
    DQ.awardPet('biscuit'); DQ.awardPet('toast'); S.beast.kills={chicken:12, goblin:60, cow:3}; S.beast.drops={'chicken:feather':1};
    DQ.emit('lvl'); DQ.ui.renderHud(); });
  await p.evaluate(()=>DQ.go('farming')); await p.waitForTimeout(300);
  await p.click('.chip[data-a="potato"]'); await p.click('[data-do="plantall"]'); await p.click('[data-do="buyanimal"][data-a="hen"]'); await p.click('[data-do="buyanimal"][data-a="cow"]'); await p.click('[data-do="filltrough"]');
  await p.evaluate(()=>{ DQ.advanceWorld(70000); DQ.emit('farm'); }); await p.waitForTimeout(500);
  await p.screenshot({ path: '/tmp/claude-0/-home-user/86605f0b-afe5-5be4-abf8-bc0a57b0d89f/scratchpad/n_farm.png', fullPage: true });
  await p.click('[data-do="harvestall"]'); await p.waitForTimeout(300);
  console.log('potatoes', await p.evaluate(()=>DQ.have('crop_potato')), 'eggs stored', await p.evaluate(()=>DQ.S.farm.animals.map(a=>a.stored)));
  await p.evaluate(()=>DQ.go('house')); await p.click('[data-do="buyhouse"]'); await p.waitForTimeout(300); await p.click('[data-do="furnish"][data-a="fireplace"]'); await p.waitForTimeout(300);
  await p.screenshot({ path: '/tmp/claude-0/-home-user/86605f0b-afe5-5be4-abf8-bc0a57b0d89f/scratchpad/n_house.png' });
  await p.evaluate(()=>DQ.go('hirelings')); await p.waitForTimeout(300); await p.click('[data-do="hire"][data-a="0"]'); await p.waitForTimeout(300);
  await p.evaluate(()=>{ const w=DQ.S.workers[0]; if(w && w.skill!=='farming'){ const n=Object.values(DQ.data.NODE).find(n=>n.skill===w.skill && n.lvl<=1); DQ.assign(w.id, n.kind+':'+n.id);} else if (w) DQ.assign(w.id,'farm'); });
  await p.waitForTimeout(1200); await p.screenshot({ path: '/tmp/claude-0/-home-user/86605f0b-afe5-5be4-abf8-bc0a57b0d89f/scratchpad/n_hire.png' });
  await p.evaluate(()=>DQ.go('bestiary')); await p.waitForTimeout(300); await p.screenshot({ path: '/tmp/claude-0/-home-user/86605f0b-afe5-5be4-abf8-bc0a57b0d89f/scratchpad/n_beast.png' });
  await p.click('[data-do="beasttab"][data-a="pets"]'); await p.waitForTimeout(300); await p.screenshot({ path: '/tmp/claude-0/-home-user/86605f0b-afe5-5be4-abf8-bc0a57b0d89f/scratchpad/n_pets.png' });
  await p.evaluate(()=>DQ.go('combat')); await p.click('.card[data-b="boar"]'); await p.waitForTimeout(3500); await p.screenshot({ path: '/tmp/claude-0/-home-user/86605f0b-afe5-5be4-abf8-bc0a57b0d89f/scratchpad/n_combat.png' });
  await p.evaluate(()=>DQ.go('map')); await p.waitForTimeout(400); await p.screenshot({ path: '/tmp/claude-0/-home-user/86605f0b-afe5-5be4-abf8-bc0a57b0d89f/scratchpad/n_map.png' });
  await p.evaluate(()=>DQ.go('overview')); await p.waitForTimeout(400); await p.screenshot({ path: '/tmp/claude-0/-home-user/86605f0b-afe5-5be4-abf8-bc0a57b0d89f/scratchpad/n_ov.png' });
  await p.setViewportSize({ width: 390, height: 844 });
  for (const pg of ['overview','farming','house','hirelings','bestiary','combat','map']) { await p.evaluate(id=>DQ.go(id), pg); await p.waitForTimeout(250); const o=await p.evaluate(()=>document.documentElement.scrollWidth - innerWidth); if (o>0) console.log('overflow', pg, o); }
  await p.evaluate(()=>DQ.go('farming')); await p.waitForTimeout(300); await p.screenshot({ path: '/tmp/claude-0/-home-user/86605f0b-afe5-5be4-abf8-bc0a57b0d89f/scratchpad/n_phone_farm.png' });
  console.log('errors:', JSON.stringify(errs));
  await b.close();
})();
