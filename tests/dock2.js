const { chromium } = require('playwright');
const U='file:///tmp/claude-0/-home-user/86605f0b-afe5-5be4-abf8-bc0a57b0d89f/scratchpad/app/index.html';
(async () => {
  const b = await chromium.launch();
  for (const [w,h] of [[1500,900],[1180,900],[1100,860],[900,900],[820,900],[700,900]]) {
    const p = await b.newPage({ viewport:{width:1300,height:900} }); const errs=[]; p.on('pageerror',e=>errs.push(e.message));
    await p.goto(U); await p.waitForTimeout(400); await p.click('#t-new'); await p.click('#cr-go'); await p.waitForTimeout(700);
    await p.evaluate(()=>{ const S=DQ.S; S.settings.notify=false; S.name='Luke'; S.xp.fishing=DQ.data.XPF[30]; S.pets.owned={biscuit:{aff:5}}; S.pets.active='biscuit'; S.lastAct={kind:'fish',id:'shrimp'}; S.coins=2804; DQ.stopAct&&DQ.stopAct(true); DQ.ui.renderHud(); DQ.go('overview'); });
    await p.setViewportSize({width:w,height:h}); await p.waitForTimeout(700);
    const r = await p.evaluate(()=>{ const hs=[...document.querySelectorAll('#hud > *')].map(e=>({n:e.className.slice(0,10),r:e.getBoundingClientRect()})); const bad=[]; for(let i=0;i<hs.length;i++)for(let j=i+1;j<hs.length;j++){ const a=hs[i].r,b=hs[j].r; if(a.width&&b.width&&a.left<b.right-2&&b.left<a.right-2&&a.top<b.bottom-2&&b.top<a.bottom-2) bad.push(hs[i].n+'x'+hs[j].n); }
      const inner=[...document.querySelectorAll('.h-task *')].some(e=>{const a=e.getBoundingClientRect(),t=document.querySelector('.h-task').getBoundingClientRect(); return a.width&&(a.right>t.right+1||a.left<t.left-1)}); return {overlaps:bad, taskOverflow:inner, hudH:Math.round(document.getElementById('hud').getBoundingClientRect().height), page:document.documentElement.scrollWidth-innerWidth}; });
    console.log(w+'x'+h, JSON.stringify(r), errs); if (w===900) await p.screenshot({path:'hud_900.png', clip:{x:0,y:0,width:900,height:300}}); await p.close();
  }
  const p = await b.newPage({ viewport:{width:1300,height:900} });
  await p.goto(U); await p.waitForTimeout(400); await p.click('#t-new'); await p.click('#cr-go'); await p.waitForTimeout(700);
  await p.evaluate(()=>{ DQ.S.settings.notify=false; ['iron_sword','steel_helm','mithril_body','rune_shield','bow_yew','staff_magic','adamant_legs','astral_dagger','ring_ruby','amulet_emerald','potion_heal'].forEach(i=>DQ.give(i,1)); DQ.S.equip.body='steel_body'; DQ.S.equip.head='bronze_helm'; DQ.go('character'); }); await p.waitForTimeout(700);
  await p.screenshot({path:'gear_inv.png'}); await b.close();
})();
