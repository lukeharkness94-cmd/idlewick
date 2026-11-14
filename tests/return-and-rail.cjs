/* Two checks from player reports (Dec 2026): the welcome-back summary opens at its top (it used to scroll to the
   button near its bottom), and the skill column on the left fills the window's height at common desktop sizes.
   Needs a preview server: IDLEWICK_URL=http://127.0.0.1:8765/index.html node tests/return-and-rail.cjs */
const assert=require('node:assert/strict');const {chromium}=require('playwright');const URL=process.env.IDLEWICK_URL||'http://127.0.0.1:8765/index.html';
(async()=>{const b=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||undefined});
for(const [w,h] of [[1280,720],[1440,900],[1920,1080],[2560,1440],[390,844]]){const ctx=await b.newContext({viewport:{width:w,height:h}});const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
 await p.goto(URL);await p.locator('#t-new').click();await p.locator('#crname').fill('Back');await p.locator('#cr-go').click();await p.waitForTimeout(700);
 await p.evaluate(()=>{const S=DQ.S,D=DQ.data;for(const k of Object.keys(S.xp))S.xp[k]=D.XPF[30];for(const s of D.SKILLS)S.unlocked[s.id]=true;S.inv.shrimp=30;for(let i=0;i<4;i++)DQ.closeModal&&DQ.closeModal();DQ.go('woodcutting');DQ.startAct('wood','normal');DQ.save();});
 if(w>860){const r=await p.evaluate(()=>{const el=document.getElementById('skilldock'),rows=[...el.querySelectorAll('.dk')],last=rows[rows.length-1].getBoundingClientRect();return {gap:innerHeight-last.bottom,scroll:el.scrollHeight>el.clientHeight+2,rowH:rows[0].getBoundingClientRect().height/(DQ.zoom||1)};});
  assert.ok(r.gap>=0&&r.gap<=60,`${w}x${h}: the skill column reaches the bottom of the window (gap ${Math.round(r.gap)}px)`);assert.equal(r.scroll,false,`${w}x${h}: no scrolling`);assert.ok(r.rowH>=31&&r.rowH<=65,`${w}x${h}: row height ${r.rowH}`);}
 await p.evaluate(()=>{const k='dashboard-quest-save-v2',o=JSON.parse(localStorage.getItem(k));o.lastSeen-=3*3600e3;localStorage.setItem(k,JSON.stringify(o));});await p.close();
 const q=await ctx.newPage();await q.goto(URL);await q.locator('#t-cont').click();await q.waitForTimeout(3500);
 const m=await q.evaluate(()=>{const c=document.querySelector('.modal .m-card');return c?{top:c.scrollTop,tall:c.scrollHeight>c.clientHeight,win:scrollY}:null;});
 assert.ok(m,`${w}x${h}: welcome back shown`);assert.equal(m.top,0,`${w}x${h}: welcome back opens at its top`);assert.equal(m.win,0);
 assert.deepEqual(errs,[]);await ctx.close();}
console.log('return and rail checks passed');await b.close();})().catch(e=>{console.error(e);process.exit(1);});
