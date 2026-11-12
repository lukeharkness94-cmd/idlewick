/* First-hour walkthrough: a guided beginner in the real page (Playwright), following Home's Next step, closing pop-ups
   and logging every pop-up, notification, task stop and Next-step change. Automated evidence only: it is not player
   feedback. Start a server (python3 -m http.server 8765), then: MIN=60 node scripts/play-first-hour.cjs */
const MIN=+(process.env.MIN||60);
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:1920,height:1080}});const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.goto(process.env.IDLEWICK_URL||'http://127.0.0.1:8765/index.html');await p.locator('#t-new').click();await p.locator('#crname').fill('Luke');await p.locator('#cr-go').click();await p.waitForTimeout(800);
await p.evaluate(()=>{window.LOG=[];window.T0=0;const n0=DQ.notify;DQ.notify=o=>{if(!DQ.sim.on&&!DQ.forecasting)LOG.push({t:+(DQ.S.playtime/60000).toFixed(1),k:'note:'+o.kind+(DQ.notificationTier?':'+DQ.notificationTier(o):''),s:o.title});return n0(o);};
 const m0=DQ.modal;DQ.modal=o=>{LOG.push({t:+(DQ.S.playtime/60000).toFixed(1),k:'MODAL',s:o.title});return m0(o);};
 const sa=DQ.stopAct;DQ.stopAct=(...a)=>{if(!DQ.sim.on&&!DQ.forecasting)LOG.push({t:+(DQ.S.playtime/60000).toFixed(1),k:'STOP',s:JSON.stringify(a).slice(0,80)+' act '+(DQ.act?DQ.act.kind+':'+DQ.act.id:'-')+' '+(new Error().stack.split('\n').slice(2,5).map(l=>l.trim().replace(/http:.*\/js\//,'')).join(' < '))+' hp '+Math.round(DQ.S.hp)+'/'+DQ.maxHp()+' food '+(DQ.foods?DQ.foods().reduce((n,id)=>n+DQ.have(id),0):'?')});return sa(...a);};
 const st0=DQ.startAct;DQ.startAct=(k,i,o)=>{if(k==='fight'&&i==='grubnash'&&!DQ.forecasting)LOG.push({t:+(DQ.S.playtime/60000).toFixed(1),k:'START',s:new Error().stack.split('\n').slice(2,7).map(l=>l.trim().replace(/http:.*\/js\//,'')).join(' < ')+' hp '+Math.round(DQ.S.hp)});return st0(k,i,o);};
 window.step=()=>{const before=document.querySelector('.modal');if(before){const btn=before.querySelector('.m-act .btn.primary')||before.querySelector('.m-act .btn');btn&&btn.click();return 'closed modal';}
  {DQ.go('overview');const j0=document.querySelector('#view .journey [data-do].btn.primary, #view .journey .btn.primary, #view [data-do].btn.primary');if(DQ.act&&j0&&j0.dataset.do==='journeytask'&&DQ.act.kind===j0.dataset.a&&DQ.act.id===j0.dataset.b)return null;if(DQ.act&&(!j0||!['journeytask','qstart','qclaim','act','huntarea','journeyfight','journeytrain','equip','abil'].includes(j0.dataset.do)))return null;const j=document.querySelector('#view .journey [data-do].btn.primary, #view .journey .btn.primary, #view [data-do].btn.primary');if(j){const d=j.dataset.do+' '+(j.dataset.a||'')+' "'+j.textContent.trim().slice(0,40)+'"';j.click();
    if(!DQ.act&&!document.querySelector('.modal')){const c=document.querySelector('#view .task-primary:not([disabled]), #view [data-do="huntarea"], #view [data-do="qstart"]');if(c){c.click();return 'click '+d+' then '+c.textContent.trim().slice(0,30);}}
    return 'click '+d;}}
  return null;};
 window.run=sec=>{for(let i=0;i<sec;i++){DQ.S.playtime+=1000;DQ.advanceTime(1000,1000,DQ.act?DQ.act.progress||0:0);if(i%10===0)DQ.emit('ui');}};});
let lastNext='';const acts=[];
for(let m=0;m<MIN*2;m++){ // half-minute steps
 for(let k=0;k<3;k++){const r=await p.evaluate(()=>step());if(r){acts.push((m/2).toFixed(1)+'m '+r);await p.waitForTimeout(150);}else break;}
 await p.evaluate(()=>run(30));
 const nx=await p.evaluate(()=>{DQ.go('overview');const h=document.querySelector('#view .journey h2, #view .journey h3, #view h2');return (h?h.textContent.trim():'')+' | act: '+(DQ.act?DQ.actLabel():'none');});
 if(nx!==lastNext){acts.push((m/2).toFixed(1)+'m NEXT: '+nx);lastNext=nx;}
}
const log=await p.evaluate(()=>LOG);const st=await p.evaluate(()=>({hero:DQ.advLvl(),combat:DQ.combatLvl(),coins:DQ.S.coins,lv:Object.fromEntries(Object.keys(DQ.S.xp).filter(k=>DQ.S.xp[k]>0).map(k=>[k,DQ.lvl(k)])),q:Object.entries(DQ.S.q).map(([k,v])=>k+':'+v.s).join(' ')}));
console.log('== ACTIONS');acts.forEach(a=>console.log(a));console.log('== LOG');log.forEach(l=>console.log(l.t+'m',l.k,l.s));console.log('== STATE',JSON.stringify(st));console.log('errors',errs);
await p.evaluate(()=>DQ.save&&DQ.save());await b.close();})();
