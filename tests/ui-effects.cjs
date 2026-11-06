/* Every unique gear effect and companion trick, exercised in the real game page (the shipped script order), not an
   isolated copy of a function. For each: equip/activate → it fires in live play, offline catch-up and a forecast;
   remove it → it stops. Also checks advertised magnitudes that can be measured directly, and that equipment and the
   active companion survive save and reload. Start a server (scripts/preview.py), then node tests/ui-effects.cjs. */
const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs');
(async()=>{
 const browser=await chromium.launch({headless:true,args:['--no-sandbox'],...(fs.existsSync('/usr/bin/chromium')?{executablePath:'/usr/bin/chromium'}:{})});
 try{
  const page=await browser.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(process.env.IDLEWICK_URL||'http://127.0.0.1:8765/');
  await page.locator('#t-new').click();await page.locator('#crname').fill('Effects');await page.locator('#cr-go').click();await page.waitForTimeout(800);
  await page.evaluate(()=>{
   const S=DQ.S,D=DQ.data;S.settings.notify=false;S.settings.muted=true;S.tut.hidden=true;DQ.paused=true;
   for(const k of Object.keys(S.xp))S.xp[k]=D.XPF[90];for(const k of Object.keys(D.SK))S.unlocked[k]=true;
   D.TOWNS.forEach(t=>S.towns[t.id]={visited:true,boss:false});S.coins=1e7;DQ.fxDirty();
   /* deterministic randomness for the whole check */
   let seed=99;Math.random=()=>{seed=(seed*16807)%2147483647;return(seed-1)/2147483646;};
   window.__setup=(town,gear,pet,extra)=>{const S=DQ.S;S.town=town;S.equip={};S.ammo={id:null,n:0};S.inv={shrimp:0};S.pets.active=null;DQ.act=null;DQ.fight=null;S.act=null;
    for(const id of gear){S.inv[id]=(S.inv[id]||0)+(id.startsWith('arrow')?5000:1);const r=DQ.equipItem(id);if(r&&r.ok===false)throw new Error('cannot equip '+id+': '+r.why);}
    if(pet){S.pets.owned[pet]=S.pets.owned[pet]||{aff:0,found:1};DQ.setPet(pet);}
    S.inv.rune=99999;S.inv.shark=500;S.settings.autoEat=true;S.hp=DQ.maxHp();DQ.fxDirty();DQ.effectHits={};if(extra)extra(S,D);};
   window.__hits=()=>Object.assign({},DQ.effectHits||{});
  });
  /* key → [town, gear, task, target, needs] ; the effect counter name defaults to the key */
  const melee=['rune_helm','rune_body','rune_legs'];
  const U={
   lifesteal:['mossbarrow',[...melee,'leechfang'],'fight','wolf'],
   marked:['mossbarrow',[...melee,'wyrdwood_bow','arrow_rune'],'fight','wolf'],
   thorns:['saltmere',[...melee,'rune_sword','thornback_buckler'],'fight','pirate'],
   poison:['saltmere',[...melee,'vipers_kiss'],'fight','pirate'],
   twin:['saltmere',[...melee,'gale_sabre'],'fight','pirate'],
   stun:['ironpeak',[...melee,'thunderclap_maul'],'fight','troll'],
   arc:['ironpeak',[...melee,'stormcaller_staff'],'fight','troll'],
   fury:['ironpeak',[...melee,'rune_sword','berserkers_torc'],'fight','troll'],
   roar:['ironpeak',[...melee,'rune_sword','chief_helm'],'fight','troll'],
   hide:['ironpeak',[...melee,'rune_sword','tusk_charm'],'fight','troll'],
   riposte:['ironpeak',[...melee,'barnacle_cutlass'],'fight','troll'],
   slow:['ironpeak',[...melee,'rune_sword','frostmaw_pendant'],'fight','troll'],
   curse:['ironpeak',[...melee,'witch_staff'],'fight','troll'],
   ember:['ironpeak',[...melee,'emberfang_bow','arrow_rune'],'fight','troll'],
   bulwark:['ironpeak',['rune_body','rune_legs','rune_sword','wardens_greathelm'],'fight','frostmaw'],
   sovereign:['ironpeak',['rune_body','rune_legs','rune_sword','hollow_crown'],'fight','frostmaw'],
   fortune:['saltmere',[...melee,'rune_sword','smugglers_knot'],'fight','pirate'],
   laststand:['ironpeak',['salamander_coat','bronze_sword'],'fight','frostmaw']
  };
  for(const [key,[town,gear,kind,id]] of Object.entries(U)){
   const r=await page.evaluate(([town,gear,kind,id,key])=>{
    const S=DQ.S,run=mode=>{window.__setup(town,gear,null,key==='laststand'?(S)=>{S.settings.autoEat=false;}:null);
     if(mode==='forecast'){let f=null;/* chance effects (riposte) can miss in one short forecast now melee wins quickly: up to four forecasts */for(let i=0;i<4;i++){S.hp=Math.ceil(DQ.maxHp()/2);f=DQ.forecast(id);const h=window.__hits();if(!f||f.blocked||(h[key]||0)>0)break;}return {hits:window.__hits(),blocked:!f||f.blocked};}
     if(!DQ.startAct(kind,id,{quiet:true}))return {hits:{},blocked:true};
     if(mode==='live'){for(let i=0;i<600;i++)DQ.advanceTime(1000,1000,DQ.act?DQ.act.progress||0:0);}else DQ.simulate(DQ.offlineEff(3*3600e3),3*3600e3);
     const h=window.__hits();DQ.stopAct(true);return {hits:h};};
    const live=run('live'),off=run('offline'),fc=run('forecast');
    /* removed: the same fight without the unique item */
    const base=gear.filter(g=>!DQ.data.ITEMS[g].unique);window.__setup(town,base.length?base:['rune_sword'],null);DQ.startAct(kind,id,{quiet:true});for(let i=0;i<300;i++)DQ.advanceTime(1000,1000,DQ.act?DQ.act.progress||0:0);const without=window.__hits();DQ.stopAct(true);
    return {live,off,fc,without};
   },[town,gear,kind,id,key]);
   const n=k=>r[k].hits[key]||0;
   assert.ok(!r.live.blocked&&n('live')>0,`${key}: fires in live play ${JSON.stringify(r.live)}`);
   assert.ok(n('off')>0,`${key}: fires during offline catch-up`);
   if(key!=='fortune')assert.ok(r.fc.blocked||n('fc')>0,`${key}: fires inside a forecast`);
   assert.equal(r.without[key]||0,0,`${key}: stops when the item is removed`);
  }
  /* Healing draught: drunk once, automatically, when food is gone and health is low */
  const draught=await page.evaluate(()=>{window.__setup('ironpeak',['bronze_sword'],null,S=>{S.inv={potion_heal:3};S.settings.autoEat=true;});DQ.S.inv.shark=0;DQ.startAct('fight','frostmaw',{quiet:true});for(let i=0;i<120&&DQ.act;i++)DQ.advanceTime(1000,1000,DQ.act?DQ.act.progress||0:0);const h=window.__hits().draught||0;const left=DQ.have('potion_heal');DQ.stopAct(true);return {h,left};});
  assert.equal(draught.h,1,'the draught is drunk once in the fight');assert.equal(draught.left,2,'exactly one draught used');
  /* field-guide understanding is recorded by real fights: weak-point wins (goblins are weak to slash) and answered boss specials */
  const under=await page.evaluate(()=>{window.__setup('willowbrook',['rune_sword','rune_helm','rune_body','rune_legs'],null);const B=DQ.S.beast;B.weakWins={};B.answered={};
   DQ.startAct('fight','goblin',{quiet:true});for(let i=0;i<120;i++)DQ.advanceTime(1000,1000,DQ.act?DQ.act.progress||0:0);DQ.stopAct(true);
   window.__setup('ironpeak',['rune_sword','rune_helm','rune_body','rune_legs'],null);DQ.S.beast.answered={};DQ.startAct('fight','frostmaw',{quiet:true});for(let i=0;i<300;i++)DQ.advanceTime(1000,1000,DQ.act?DQ.act.progress||0:0);DQ.stopAct(true);
   return {weak:(DQ.S.beast.weakWins||{}).goblin||0,answered:(DQ.S.beast.answered||{}).frostmaw||0};});
  assert.ok(under.weak>0,'weak-point wins are recorded');assert.ok(under.answered>0,'answered specials are recorded');
  /* Gale: the advertised 10% faster attacks reach the live attack interval (regression for the overridden combatInterval) */
  const gale=await page.evaluate(()=>{window.__setup('willowbrook',['rune_sword'],null);const a=DQ.combatInterval();window.__setup('willowbrook',['rune_sword','storm_feather'],null);const b=DQ.combatInterval();
   DQ.startAct('fight','goblin',{quiet:true});const live=DQ.act.dur;DQ.stopAct(true);return {a,b,live,text:DQ.combatSpeedText()};});
  assert.ok(Math.abs(gale.b/gale.a-.9)<.01,`Gale: ${gale.a}ms → ${gale.b}ms`);assert.equal(gale.live,gale.b,'the running fight uses the faster interval');assert.match(gale.text,/Gale/);
  /* Smuggler's luck: +5% coins on the real coin multiplier */
  const coin=await page.evaluate(()=>{window.__setup('willowbrook',['rune_sword'],null);const a=DQ.coinMult();window.__setup('willowbrook',['rune_sword','smugglers_knot'],null);return [a,DQ.coinMult()];});
  assert.ok(Math.abs(coin[1]-coin[0]-.05)<1e-9,'Smuggler’s luck: +5% coins');

  /* companion tricks: activate → fires; switch to another companion → stops */
  const T={
   fetch:['willowbrook','fish','shrimp','biscuit'],school:['willowbrook','fish','shrimp','bubbles'],echo:['willowbrook','fish','shrimp','hollowling'],
   nuts:['willowbrook','wood','normal','acorn'],seam:['willowbrook','mine','copper','nugget'],paws:['saltmere','thieve','merchant','whiskers'],
   bellows:['willowbrook','recipe','smelt_bronze','cinder'],taster:['willowbrook','recipe','cook_shrimp','pudding'],comb:['willowbrook','fish','shrimp','bill'],
   heckle:['ironpeak','fight','troll','gobbo'],charge:['ironpeak','fight','troll','tusky'],trickember:['ironpeak','fight','troll','wyrmling'],cold:['ironpeak','fight','frostmaw','frostling']
  };
  for(const [key,[town,kind,id,pet]] of Object.entries(T)){
   const r=await page.evaluate(([town,kind,id,pet,key])=>{
    const S=DQ.S,D=DQ.data,stock=S=>{S.inv.raw_shrimp=4000;S.inv.ore_copper=4000;S.inv.ore_tin=4000;S.xp.thieving=D.XPF[30];};
    const go=(p,mode)=>{window.__setup(town,['rune_sword','rune_helm','rune_body','rune_legs'],p,stock);if(!DQ.startAct(kind,id,{quiet:true}))return {blocked:true};
     if(mode==='offline')DQ.simulate(DQ.offlineEff(3*3600e3),3*3600e3);else for(let i=0;i<1800;i++)DQ.advanceTime(1000,1000,DQ.act?DQ.act.progress||0:0);
     const h=window.__hits();DQ.stopAct(true);return h;};
    return {on:go(pet,'live'),off:go(pet,'offline'),other:go(pet==='biscuit'?'acorn':'biscuit','live')};
   },[town,kind,id,pet,key]);
   assert.ok(!r.on.blocked&&(r.on[key]||0)>0,`${key}: trick fires (${JSON.stringify(r.on)})`);
   assert.ok((r.off[key]||0)>0,`${key}: trick fires offline`);
   assert.equal(r.other[key]||0,0,`${key}: stops after switching companion`);
  }
  /* rate tricks that change a value rather than fire: measured directly */
  const rates=await page.evaluate(()=>{
   const S=DQ.S,D=DQ.data,crop=D.CROPS[0];window.__setup('willowbrook',['rune_sword'],null);const g0=DQ.growDur(crop),a={kind:'fish',id:'shrimp',pace:'steady',count:0},d0=DQ.actDur(a);
   window.__setup('willowbrook',['rune_sword'],'toast');const g1=DQ.growDur(crop);window.__setup('willowbrook',['rune_sword'],'stormchick');const d1=DQ.actDur(a),d2=DQ.actDur(Object.assign({},a,{count:10}));
   window.__setup('willowbrook',['rune_sword'],null);S.beast.kills.goblin=1;const r0=DQ.research(D.MON.goblin).rank;window.__setup('willowbrook',['rune_sword'],'bogwisp');const r1=DQ.research(D.MON.goblin).rank;
   /* Night study: research progresses 10% faster through the live research tick */
   const T=D.TECHS.find(t=>!t.repeatable&&t.tier===1),run=pet=>{window.__setup('willowbrook',['rune_sword'],pet);S.research.active=[{id:T.id,left:T.mins*60000}];S.research.done={};for(let i=0;i<60;i++)DQ.advanceWorld(1000);return T.mins*60000-S.research.active[0].left;};
   const n0=run(null),n1=run('quill');
   return {g0,g1,d0,d1,d2,r0,r1,n0,n1};});
  assert.ok(Math.abs(rates.n1/rates.n0-1.1)<.01,`Night study: research 10% faster (${rates.n0} → ${rates.n1})`);
  assert.ok(Math.abs(rates.g1/rates.g0-.9)<.02,'Early riser: crops ripen 10% sooner');
  assert.ok(rates.d1<rates.d0&&rates.d2>rates.d1,'Tailwind: first ten actions faster, then normal');
  assert.equal(rates.r1,rates.r0+1,"Will-o'-wisp: one stage early");

  /* save and reload keep the equipment and companion behaviour */
  await page.evaluate(()=>{window.__setup('willowbrook',['rune_sword','storm_feather'],'bubbles');DQ.paused=false;DQ.save();});
  await page.reload();await page.locator('#t-cont').click();await page.waitForTimeout(600);
  const after=await page.evaluate(()=>({swift:!!DQ.uniqueFx().swift,trick:DQ.trick('school'),ring:DQ.S.equip.ring}));
  assert.deepEqual(after,{swift:true,trick:true,ring:'storm_feather'});
  assert.deepEqual(errors,[]);
  console.log(`PASS unique effects and companion tricks: ${Object.keys(U).length} effects and ${Object.keys(T).length + 3} tricks fire in live play, offline and forecasts, stop when removed, match advertised magnitudes, and survive save and reload.`);
 } finally { await browser.close(); }
})().catch(e=>{console.error(e);process.exit(1);});
