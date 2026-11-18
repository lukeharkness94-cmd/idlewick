const {chromium}=require('playwright'),assert=require('node:assert/strict');
(async()=>{const browser=await chromium.launch({executablePath:'/usr/bin/chromium',headless:true,args:['--no-sandbox']});try{
const p=await browser.newPage();await p.goto(process.env.IDLEWICK_URL||'http://127.0.0.1:8774/index.html');await p.waitForFunction(()=>!!window.DQ?.applyScale);let cases=0;
for(const [width,height]of [[1280,720],[1920,1080],[3440,1440],[390,844]])for(const scale of [.9,1,1.15]){
 await p.setViewportSize({width,height});await p.evaluate(scale=>{DQ.S.settings.uiScale=scale;DQ.S.settings.reduceFx=false;DQ.applyScale();document.querySelectorAll('.tap-fx').forEach(n=>n.remove());},scale);
 const target={x:Math.floor(width*.71),y:Math.floor(height*.67)};await p.mouse.click(target.x,target.y);
 const checks=await p.evaluate(()=>[...document.querySelectorAll('.tap-ring')].map(n=>{const a=n.getAnimations()[0];a.pause();a.currentTime=100;const r=n.getBoundingClientRect(),before=getComputedStyle(n).transform;a.currentTime=104;return {x:r.x+r.width/2,y:r.y+r.height/2,before,after:getComputedStyle(n).transform,easing:a.effect.getTiming().easing};}));
 assert.equal(checks.length,2);for(const c of checks){assert.ok(Math.abs(c.x-target.x)<1&&Math.abs(c.y-target.y)<1,JSON.stringify({width,scale,target,c}));assert.notEqual(c.before,c.after,'motion interpolates within a 120 Hz frame rather than stepping');assert.doesNotMatch(c.easing,/steps/);}cases++;
}
const sparks=await p.evaluate(()=>{document.querySelectorAll('.tap-fx').forEach(n=>n.remove());const b=document.createElement('button');document.body.appendChild(b);b.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true,clientX:220,clientY:320,button:0}));b.remove();return [...document.querySelectorAll('.tap-spark')].map(n=>{const a=n.getAnimations()[0];a.pause();a.currentTime=0;const r=n.getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2};});});assert.equal(sparks.length,4);for(const s of sparks)assert.ok(Math.abs(s.x-220)<1&&Math.abs(s.y-320)<1);
await p.evaluate(()=>{document.querySelectorAll('.tap-fx').forEach(n=>n.remove());DQ.S.settings.reduceFx=true;});await p.mouse.click(200,300);assert.equal(await p.locator('.tap-fx').count(),0);
await p.evaluate(()=>{DQ.S.settings.reduceFx=false;});await p.emulateMedia({reducedMotion:'reduce'}); // OS preference is read at initialization.
await p.reload();await p.waitForFunction(()=>!!window.DQ?.fxInit);await p.mouse.click(200,300);assert.equal(await p.locator('.tap-fx').count(),0);
await p.emulateMedia({reducedMotion:'no-preference'});await p.reload();await p.waitForFunction(()=>!!window.DQ?.fxInit);await p.mouse.click(200,300);await p.waitForTimeout(700);assert.equal(await p.locator('.tap-fx').count(),0,'effects are cleaned up');
console.log(`PASS ${cases} tap alignment/continuous interpolation cases, reduced-effects/OS motion preferences, and cleanup.`);
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exit(1);});
