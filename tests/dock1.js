const { chromium } = require('playwright');
const U='file:///tmp/claude-0/-home-user/86605f0b-afe5-5be4-abf8-bc0a57b0d89f/scratchpad/app/index.html';
(async () => {
  const b = await chromium.launch();
  for (const [w,h] of [[1400,900],[1000,760],[900,900],[390,844]]) {
    const p = await b.newPage({ viewport:{width:w,height:h} }); const errs=[]; p.on('pageerror',e=>errs.push(e.message));
    await p.goto(U); await p.waitForTimeout(400); await p.setViewportSize({width:w,height:900}); await p.click('#t-new'); await p.click('#cr-go'); await p.setViewportSize({width:w,height:h}); await p.waitForTimeout(900);
    await p.evaluate(()=>{ DQ.S.settings.notify=false; DQ.S.xp.fishing=DQ.data.XPF[30]; DQ.S.xp.woodcutting=DQ.data.XPF[30]; DQ.S.xp.mining=DQ.data.XPF[12]; DQ.S.pets.active=null; DQ.go('fishing'); }); await p.waitForTimeout(700);
    const r = await p.evaluate(()=>{ const hs=[...document.querySelectorAll('#hud > *')].map(e=>e.getBoundingClientRect()); let ov=0; for(let i=0;i<hs.length;i++)for(let j=i+1;j<hs.length;j++){ const a=hs[i],b=hs[j]; if(a.width&&b.width&&a.left<b.right-2&&b.left<a.right-2&&a.top<b.bottom-2&&b.top<a.bottom-2) ov++; }
      const sub=document.querySelector('.subnav'); const dk=document.getElementById('skilldock');
      return {hudOverlaps:ov, hudH:Math.round(document.getElementById('hud').getBoundingClientRect().height), dockVisible: dk.offsetParent!==null, dockTiles:dk.querySelectorAll('.dk').length, dockH: Math.round(dk.scrollHeight), dockClient:Math.round(dk.clientHeight), subnavVisible: sub? sub.offsetParent!==null:false, subnavScrollable: sub? sub.scrollWidth>sub.clientWidth+1:null, pageOverflow: document.documentElement.scrollWidth-innerWidth}; });
    console.log(w+'x'+h, JSON.stringify(r), errs);
    await p.screenshot({path:`dock_${w}.png`}); await p.close();
  }
  await b.close();
})();
