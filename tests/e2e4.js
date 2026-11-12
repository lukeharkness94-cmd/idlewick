const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } }); const p = await ctx.newPage();
  const errs = []; p.on('pageerror', e => errs.push('PAGEERR ' + e.message)); p.on('console', m => { if (m.type()==='error' && !/fonts|ERR_|net::/.test(m.text())) errs.push('CONSOLE ' + m.text()); });
  await p.goto('file:///tmp/claude-0/-home-user/86605f0b-afe5-5be4-abf8-bc0a57b0d89f/scratchpad/app/index.html'); await p.waitForTimeout(400);
  await p.click('#t-new'); await p.fill('#crname','Tess'); await p.click('#cr-go'); await p.waitForTimeout(800);
  // Boss unlock flow
  await p.evaluate(() => { const S=DQ.S, D=DQ.data; ['attack','strength','defence'].forEach(k=>S.xp[k]=D.XPF[22]); S.xp.hitpoints=D.XPF[30];
    DQ.give('shrimp',60); S.equip.weapon='iron_sword'; S.equip.head='iron_helm'; S.equip.body='iron_body'; S.equip.legs='iron_legs'; S.equip.shield='iron_shield'; DQ.go('combat'); });
  await p.waitForTimeout(300);
  console.log('cb', await p.evaluate(()=>DQ.combatLvl()));
  await p.click('.bosscard .btn'); await p.waitForTimeout(500);
  console.log('fighting', await p.evaluate(()=>DQ.actLabel()));
  // fast-forward via simulate
  const r = await p.evaluate(()=>{ const s=DQ.simulate(20*60*1000); return {kills:s.kills, stopped:s.stopped, boss:DQ.S.towns.willowbrook.boss, sal:!!DQ.S.towns.saltmere, died:s.died}; });
  console.log('sim', JSON.stringify(r));
  await p.evaluate(()=>DQ.go('map')); await p.waitForTimeout(500); await p.screenshot({ path: '/tmp/claude-0/-home-user/86605f0b-afe5-5be4-abf8-bc0a57b0d89f/scratchpad/s_map3.png' });
  // ranged
  await p.evaluate(()=>{ const S=DQ.S,D=DQ.data; S.xp.ranged=D.XPF[20]; S.xp.magic=D.XPF[20]; DQ.S.xp.thieving=0; DQ.advLvl(); DQ.give('bow_normal',1); DQ.give('arrow_bronze',300); DQ.give('rune',200); DQ.give('staff_normal',1); DQ.stopAct(true); });
  const rr = await p.evaluate(()=>{ DQ.S.xp.ranged=DQ.data.XPF[20]; DQ.S.xp.magic=DQ.data.XPF[20]; const ok=[]; ok.push(JSON.stringify(DQ.equipItem('bow_normal'))); ok.push(JSON.stringify(DQ.equipItem('arrow_bronze'))); DQ.startAct('fight','cow'); const s=DQ.simulate(5*60*1000); return {ok, style:DQ.weaponStyle(), kills:s.kills, xp:Object.fromEntries(Object.entries(s.xp).map(([k,v])=>[k,Math.round(v)])), ammo:DQ.S.ammo.n}; });
  console.log('ranged', JSON.stringify(rr));
  const mm = await p.evaluate(()=>{ DQ.stopAct(true); const ok=[JSON.stringify(DQ.equipItem('staff_normal'))]; DQ.startAct('fight','cow'); const s=DQ.simulate(5*60*1000); return {ok, style:DQ.weaponStyle(), kills:s.kills, xp:Object.fromEntries(Object.entries(s.xp).map(([k,v])=>[k,Math.round(v)])), runes:DQ.have('rune')}; });
  console.log('magic', JSON.stringify(mm));
  // alchemy
  const al = await p.evaluate(()=>{ DQ.stopAct(true); DQ.give('gem_ruby',3); const ok=DQ.startAct('alch','gem_ruby'); const s=DQ.simulate(60*1000); return {ok, coins:s.coins, xp:Math.round(s.xp.magic||0)}; });
  console.log('alch', JSON.stringify(al));
  // phone layout
  await p.setViewportSize({ width: 390, height: 844 }); await p.evaluate(()=>DQ.go('overview')); await p.waitForTimeout(500);
  console.log('overflowX', await p.evaluate(()=>document.documentElement.scrollWidth - innerWidth));
  await p.screenshot({ path: '/tmp/claude-0/-home-user/86605f0b-afe5-5be4-abf8-bc0a57b0d89f/scratchpad/s_phone.png' });
  for (const pg of ['combat','map','shop','character','quests','smithing']) { await p.evaluate(id=>DQ.go(id), pg); await p.waitForTimeout(250); const o=await p.evaluate(()=>document.documentElement.scrollWidth - innerWidth); if (o>0) console.log('overflow on', pg, o); }
  console.log('errors:', JSON.stringify(errs));
  await b.close();
})();
