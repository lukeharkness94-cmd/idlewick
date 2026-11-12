const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
  const errs = []; p.on('pageerror', e => errs.push('PAGEERR ' + e.message)); p.on('console', m => { if (m.type()==='error' && !/fonts|ERR_|net::/.test(m.text())) errs.push('CONSOLE ' + m.text()); });
  await p.goto('file:///tmp/claude-0/-home-user/86605f0b-afe5-5be4-abf8-bc0a57b0d89f/scratchpad/app/index.html'); await p.waitForTimeout(500);
  await p.click('#t-new'); await p.fill('#crname','Brenna'); await p.click('#cr-go'); await p.waitForTimeout(1000);
  // mid-game state
  await p.evaluate(() => { const S=DQ.S, D=DQ.data;
    ['fishing','woodcutting','mining','cooking','smithing','crafting','thieving','attack','strength','defence','hitpoints','ranged','magic'].forEach(k=>S.xp[k]=D.XPF[k==='hitpoints'?40:32]);
    S.coins=5000; Object.assign(S.unlocked,{smithing:true,crafting:true,thieving:true,magic:true,ranged:true}); S.towns.saltmere={visited:false,boss:true}; S.towns.willowbrook.boss=true;
    DQ.give('ore_copper',40);DQ.give('ore_tin',40);DQ.give('log_normal',30);DQ.give('rune',50);DQ.give('feather',100);DQ.give('bar_bronze',20);DQ.give('raw_shrimp',30);DQ.give('gem_ruby',3);DQ.give('bar_gold',3);DQ.give('burnt',4);DQ.give('cowhide',20);
    DQ.emit('lvl'); DQ.ui.renderRail(); DQ.ui.renderHud(); });
  const shots = { smithing:'s_smith', crafting:'s_craft', magic:'s_magic', shop:'s_shop', bank:'s_bank', achievements:'s_ach', settings:'s_set', overview:'s_ov2' };
  for (const [pg, f] of Object.entries(shots)) { await p.evaluate(id => DQ.go(id), pg); await p.waitForTimeout(600); await p.screenshot({ path: '/tmp/claude-0/-home-user/86605f0b-afe5-5be4-abf8-bc0a57b0d89f/scratchpad/'+f+'.png' }); }
  // flows: smelt, buy, equip, quest accept
  await p.evaluate(()=>DQ.go('smithing')); await p.click('.card[data-b="smelt_bronze"]'); await p.waitForTimeout(3200);
  console.log('bronze bars', await p.evaluate(()=>DQ.have('bar_bronze')));
  await p.evaluate(()=>DQ.stopAct(true));
  await p.evaluate(()=>{ DQ.go('shop'); }); await p.click('[data-do="buy"][data-a="bronze_helm"]'); await p.waitForTimeout(200);
  console.log('have helm', await p.evaluate(()=>DQ.have('bronze_helm')));
  await p.evaluate(()=>{ DQ.go('character'); }); await p.click('.slot[data-a="bronze_helm"]'); await p.click('[data-do="equip"]'); await p.waitForTimeout(200);
  console.log('equipped', await p.evaluate(()=>JSON.stringify(DQ.S.equip)));
  await p.evaluate(()=>DQ.go('quests')); await p.click('.tab[data-a="available"]'); await p.waitForTimeout(200); await p.click('[data-do="qstart"]'); await p.waitForTimeout(300);
  console.log('quests', await p.evaluate(()=>JSON.stringify(DQ.S.q)));
  await p.evaluate(()=>DQ.go('quests')); await p.waitForTimeout(300); await p.screenshot({ path: '/tmp/claude-0/-home-user/86605f0b-afe5-5be4-abf8-bc0a57b0d89f/scratchpad/s_q2.png' });
  // travel
  await p.evaluate(()=>DQ.go('map')); await p.click('.mt[data-a="saltmere"]'); await p.waitForTimeout(300); await p.click('[data-do="travel"]'); await p.waitForTimeout(1600);
  console.log('town', await p.evaluate(()=>DQ.S.town)); await p.screenshot({ path: '/tmp/claude-0/-home-user/86605f0b-afe5-5be4-abf8-bc0a57b0d89f/scratchpad/s_map2.png' });
  // offline: pretend 3h away with fishing
  await p.evaluate(()=>{ DQ.go('fishing'); });
  await p.evaluate(()=>{ DQ.startAct('fish','trout'); DQ.S.lastSeen = Date.now()-3*3600*1000; DQ.save(); });
  await p.reload(); await p.waitForTimeout(600); await p.click('#t-cont'); await p.waitForTimeout(900); await p.screenshot({ path: '/tmp/claude-0/-home-user/86605f0b-afe5-5be4-abf8-bc0a57b0d89f/scratchpad/s_welcome.png' });
  console.log('modal?', await p.evaluate(()=>!!document.querySelector('.modal')), 'trout xp', await p.evaluate(()=>DQ.S.xp.fishing));
  console.log('errors:', JSON.stringify(errs));
  await b.close();
})();
