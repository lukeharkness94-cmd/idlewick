/* First-hour walkthrough: a guided beginner in the real page (Playwright), following Home's Next step, closing pop-ups
   and logging every pop-up, notification, task stop and Next-step change. Automated evidence only: it is not player
   feedback. Start a server (python3 -m http.server 8765), then: MIN=60 node scripts/play-first-hour.cjs */
const { chromium } = require('playwright');
const { writeFileSync } = require('node:fs');
const MIN=+(process.env.MIN||60);
/* Next-step actions a guided player follows (Part C Task 17 audit, 26 Nov 2026). Added to the old list:
   huntquest ("Patrol the east farms" and other exact patrols), questcontinue (a quest's Continue), journeytravel
   ("Travel to Mossbarrow"), journeysupply (buy the arrows/runes/food the next step names), journeysell (sell junk for
   a named purchase), route (go to the source of a named material), projectfinish (finish a ready restoration) and
   openproject (open a restoration whose bundles can be delivered; the harness then presses Deliver all I can).
   Deliberately left out: 'go' (plain navigation to a page where the player still has to choose what to buy or do) and
   'guide' (opens a Field Guide page; nothing to act on). */
const ALLOW_LIST=['journeytask','qstart','qclaim','act','huntarea','journeyfight','journeytrain','finishstarter','equip','abil','huntquest','questcontinue','journeytravel','journeysupply','journeysell','route','projectfinish','openproject','bossabil','bossautoeat','bossprepskip','abilswap'];
(async()=>{const b=await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });
try {const p=await b.newPage({viewport:{width:1920,height:1080}});const errs=[];p.on('pageerror',e=>errs.push('page: '+e.message));p.on('console',m=>{if(m.type()==='error')errs.push('console: '+m.text());});
await p.goto(process.env.IDLEWICK_URL||'http://127.0.0.1:8765/index.html');await p.locator('#t-new').click();await p.locator('#crname').fill('Luke');await p.locator('#cr-go').click();await p.waitForTimeout(800);
if(process.env.SEED)await p.evaluate(seed=>{let x=(+seed>>>0)||1;Math.random=()=>{x^=x<<13;x>>>=0;x^=x>>>17;x^=x<<5;x>>>=0;return x/4294967296;};},process.env.SEED);
await p.evaluate(()=>{window.TIERS={};window.TIER_ITEMS={};DQ.on('loot',(m,drops)=>{if(DQ.sim.on||DQ.forecasting)return;for(const d of drops||[]){const k=d.rar?d.rar[0]:'none';TIERS[k]=(TIERS[k]||0)+1;(TIER_ITEMS[k]=TIER_ITEMS[k]||{})[d.id]=(TIER_ITEMS[k][d.id]||0)+(d.n||1);}});window.KILLS={};DQ.on('loot',m=>{if(!DQ.sim.on&&!DQ.forecasting)KILLS[m.id]=(KILLS[m.id]||0)+1;});});
await p.evaluate(ALLOW=>{window.ALLOW=ALLOW;window.LOG=[];window.T0=0;const n0=DQ.notify;DQ.notify=o=>{if(!DQ.sim.on&&!DQ.forecasting)LOG.push({t:+(DQ.S.playtime/60000).toFixed(1),k:'note:'+o.kind+(DQ.notificationTier?':'+DQ.notificationTier(o):''),s:o.title});return n0(o);};
 const m0=DQ.modal;DQ.modal=o=>{LOG.push({t:+(DQ.S.playtime/60000).toFixed(1),k:'MODAL',s:o.title});return m0(o);};
 const sa=DQ.stopAct;DQ.stopAct=(...a)=>{if(!DQ.sim.on&&!DQ.forecasting)LOG.push({t:+(DQ.S.playtime/60000).toFixed(1),k:'STOP',s:JSON.stringify(a).slice(0,80)+' act '+(DQ.act?DQ.act.kind+':'+DQ.act.id:'-')+' '+(new Error().stack.split('\n').slice(2,5).map(l=>l.trim().replace(/http:.*\/js\//,'')).join(' < '))+' hp '+Math.round(DQ.S.hp)+'/'+DQ.maxHp()+' food '+(DQ.foods?DQ.foods().reduce((n,id)=>n+DQ.have(id),0):'?')});return sa(...a);};
 const st0=DQ.startAct;DQ.startAct=(k,i,o)=>{if(k==='fight'&&i==='grubnash'&&!DQ.forecasting)LOG.push({t:+(DQ.S.playtime/60000).toFixed(1),k:'START',s:new Error().stack.split('\n').slice(2,7).map(l=>l.trim().replace(/http:.*\/js\//,'')).join(' < ')+' hp '+Math.round(DQ.S.hp)});return st0(k,i,o);};
 window.step=()=>{const before=document.querySelector('.modal');if(before&&before.classList.contains('story-modal')){const sk=before.querySelector('[data-do="storyskip"]')||before;sk.click();if(document.querySelector('.story-modal')&&DQ.closeModal)DQ.closeModal();return 'skipped story scene';}if(before){const btn=before.querySelector('.m-act .btn.primary')||before.querySelector('.m-act .btn');btn&&btn.click();return 'closed modal';}
  {DQ.go('overview');const j0=document.querySelector('#view .journey [data-do].btn.primary, #view .journey .btn.primary, #view [data-do].btn.primary');if(DQ.act&&j0&&j0.dataset.do==='journeytask'&&DQ.act.kind===j0.dataset.a&&DQ.act.id===j0.dataset.b)return null;if(DQ.act&&j0&&j0.dataset.do==='huntquest'&&(DQ.act.id===j0.dataset.a||DQ.act.target===j0.dataset.a))return null;const skip=document.querySelector('#view [data-do="bossprepskip"]');if(j0&&!ALLOW.includes(j0.dataset.do)&&skip){skip.click();return 'click bossprepskip (the remaining check opens the shop or cooking; a scripted player skips it)';}if(DQ.act&&(!j0||!ALLOW.includes(j0.dataset.do)))return null;const j=document.querySelector('#view .journey [data-do].btn.primary, #view .journey .btn.primary, #view [data-do].btn.primary');if(j){const d=j.dataset.do+' '+(j.dataset.a||'')+' "'+j.textContent.trim().slice(0,40)+'"';j.click();
    if(!DQ.act&&!document.querySelector('.modal')){const c=document.querySelector('#view [data-do="projectgive"]:not([disabled]), #view .task-primary:not([disabled]), #view [data-do="huntarea"], #view [data-do="qstart"]');if(c){c.click();return 'click '+d+' then '+c.textContent.trim().slice(0,30);}}
    return 'click '+d;}}
  return null;};
 window.run=sec=>{for(let i=0;i<sec;i++){DQ.S.playtime+=1000;DQ.advanceTime(1000,1000,DQ.act?DQ.act.progress||0:0);if(i%10===0)DQ.emit('ui');}};},ALLOW_LIST);
const readState = () => p.evaluate(() => ({
  hero: DQ.advLvl(), combat: DQ.combatLvl(), coins: DQ.S.coins,
  hp: [Math.round(DQ.S.hp), DQ.maxHp()], inventorySlots: Object.keys(DQ.S.inv).length,
  inventory: DQ.S.inv, activity: DQ.act ? { kind: DQ.act.kind, id: DQ.act.id } : null,
  lv: Object.fromEntries(Object.keys(DQ.S.xp).filter(k => DQ.S.xp[k] > 0).map(k => [k, DQ.lvl(k)])),
  quests: DQ.S.q, stats: DQ.S.stats, next: DQ.journeyNext(),
}));
const initial = await readState();
let lastNext='';const acts=[], snapshots=[];
for(let m=0;m<MIN*2;m++){ // half-minute steps
 for(let k=0;k<3;k++){const r=await p.evaluate(()=>step());if(r){acts.push((m/2).toFixed(1)+'m '+r);await p.waitForTimeout(150);}else break;}
 await p.evaluate(()=>run(30));
 const nx=await p.evaluate(()=>{DQ.go('overview');const h=document.querySelector('#view .journey h2, #view .journey h3, #view h2');return (h?h.textContent.trim():'')+' | act: '+(DQ.act?DQ.actLabel():'none');});
 const minute=(m+1)/2;
 if ([5, 15, 30, 45, 60, MIN].includes(minute)) snapshots.push({ minute, ...await readState() });
 if(nx!==lastNext){acts.push((m/2).toFixed(1)+'m NEXT: '+nx);lastNext=nx;}
}
const log=await p.evaluate(()=>LOG);const st=await p.evaluate(()=>({hero:DQ.advLvl(),combat:DQ.combatLvl(),coins:DQ.S.coins,lv:Object.fromEntries(Object.keys(DQ.S.xp).filter(k=>DQ.S.xp[k]>0).map(k=>[k,DQ.lvl(k)])),q:Object.entries(DQ.S.q).map(([k,v])=>k+':'+v.s).join(' ')}));
console.log('== ACTIONS');acts.forEach(a=>console.log(a));console.log('== LOG');log.forEach(l=>console.log(l.t+'m',l.k,l.s));console.log('== STATE',JSON.stringify(st));const tiers=await p.evaluate(()=>({TIERS,TIER_ITEMS,KILLS}));console.log('== LOOT TIERS',JSON.stringify(tiers));console.log('errors',errs);
if (process.env.EVIDENCE) {
 const events = log.filter(e => e.k === 'MODAL' || e.k.startsWith('note:'));
 const counts = windows => {
  const result={};
  for (const e of events.filter(windows)) {
   const key=e.k === 'MODAL' ? 'modal' : e.k.split(':')[1];
   result[key]=(result[key] || 0)+1;
  }
  return result;
 };
 const windows = [[0, 5], [5, 15], [15, 30], [30, Infinity]].map(([start, end]) => ({
  start, end: Math.min(end, MIN), counts: counts(e => e.t >= start && e.t < end),
 })).filter(w => w.start < MIN);
 writeFileSync(process.env.EVIDENCE, JSON.stringify({ initial, snapshots, actions: acts, log, events: events.length,
  counts: counts(() => true), windows, lootTiers: tiers, errors: errs }, null, 2) + '\n');
}
if (errs.length) process.exitCode=1;
} finally { await b.close(); }
})().catch(error => { console.error(error); process.exitCode=1; });
