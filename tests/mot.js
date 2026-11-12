const { chromium } = require('playwright');
const U='file:///tmp/claude-0/-home-user/86605f0b-afe5-5be4-abf8-bc0a57b0d89f/scratchpad/app/index.html';
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport:{width:1300,height:900} });
  const errs=[]; p.on('pageerror',e=>errs.push(e.message)); p.on('console',m=>{if(m.type()==='error'&&!/fonts|net::|ERR_/.test(m.text()))errs.push(m.text())});
  await p.goto(U); await p.waitForTimeout(400); await p.click('#t-new'); await p.click('#cr-go'); await p.waitForTimeout(900);
  await p.evaluate(()=>{ DQ.S.settings.notify=false; }); await p.click('.startp .btn'); await p.waitForTimeout(1500);
  console.log('spring token', await p.evaluate(()=>getComputedStyle(document.documentElement).getPropertyValue('--spring').slice(0,40)));
  // navigation pop
  await p.click('#skilldock .dk'); await p.waitForTimeout(120);
  console.log('pop on nav', await p.evaluate(()=>[...document.querySelectorAll('.hub.pop,.stab.pop')].map(e=>e.className.slice(0,20))), 'enter anims', await p.evaluate(()=>document.getAnimations().length));
  await p.waitForTimeout(1100);
  console.log('settled anims', await p.evaluate(()=>document.getAnimations().filter(a=>a.playState==='running'&&a.effect&&a.effect.getTiming().iterations!==Infinity).length));
  // quiet refresh must not replay entrances
  await p.evaluate(()=>DQ.ui.render(false)); await p.waitForTimeout(80);
  console.log('anims after quiet render (non-infinite running)', await p.evaluate(()=>document.getAnimations().filter(a=>a.playState==='running'&&a.effect&&a.effect.getTiming().iterations!==Infinity).map(a=>a.animationName||a.constructor.name).join(',')||'none'));
  // value tick
  await p.evaluate(()=>{ DQ.addCoins(500); }); await p.waitForTimeout(250);
  console.log('tickable coin els', await p.evaluate(()=>document.querySelectorAll('.tickable').length), 'WAAPI anims', await p.evaluate(()=>document.getAnimations().filter(a=>!a.animationName&&a.constructor.name==='Animation').length));
  // modal + button press
  await p.evaluate(()=>DQ.modal({title:'Hi',body:'<p>x</p>',actions:[{label:'A'},{label:'B',primary:true}]})); await p.waitForTimeout(900);
  console.log('modal visible', await p.evaluate(()=>{const c=document.querySelector('.m-card'); const r=c.getBoundingClientRect(); return [Math.round(r.width),Math.round(r.height), getComputedStyle(c).opacity]}));
  await p.keyboard.press('Escape'); await p.waitForTimeout(400);
  // calm mode
  await p.evaluate(()=>{ DQ.S.settings.reduceFx=true; DQ.ui.render(false); }); await p.waitForTimeout(100);
  console.log('calm class', await p.evaluate(()=>document.documentElement.classList.contains('calm')), 'view running anims', await p.evaluate(()=>{ document.getAnimations().forEach(a=>{}); return getComputedStyle(document.querySelector('.fig-img')||document.body).animationDuration; }));
  await p.evaluate(()=>{ DQ.S.settings.reduceFx=false; DQ.ui.render(false); });
  console.log('errors', errs); await b.close();
})();
