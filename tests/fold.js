const { chromium } = require('playwright');
const JOBS = {
  overview: ['.goal', 'see what to do next'],
  quests: ['.quest', 'accept / claim a quest'],
  fishing: ['.cards .card', 'pick a fishing spot'], woodcutting: ['.cards .card', 'pick a tree'], mining: ['.cards .card', 'pick a rock'], thieving: ['.cards .card', 'pick a target'],
  farming: ['.plot', 'plant / harvest'], cooking: ['.cards .card', 'cook something'], smithing: ['.cards .card', 'smith something'], crafting: ['.cards .card', 'craft something'], magic: ['.cards .card, .tabs', 'cast alchemy'],
  combat: ['.cards .card', 'pick a monster'], bestiary: ['.card, .bcard, .beast', 'browse monsters'],
  map: ['.mappanel', 'travel'], shop: ['.srow', 'buy something'], bank: ['#bankgrid .slot', 'deposit / withdraw'],
  character: ['#packgrid .slot', 'equip / manage gear'], house: ['.room', 'build / furnish'], hirelings: ['.cand, .worker', 'hire / assign'],
  mastery: ['.msk', 'see mastery'], achievements: ['.ach', 'browse achievements'], settings: ['.tog', 'change a setting'],
};
(async () => {
  const b = await chromium.launch(); const rows=[];
  for (const vp of [{width:1300,height:800,n:'desk',lim:430},{width:390,height:844,n:'phone',lim:560}]) {
    const p = await b.newPage({ viewport: vp, hasTouch: vp.width<500 });
    await p.goto('file:///tmp/claude-0/-home-user/86605f0b-afe5-5be4-abf8-bc0a57b0d89f/scratchpad/app/index.html'); await p.evaluate(()=>document.fonts.ready); await p.waitForTimeout(500); await p.click('#t-new'); await p.click('#cr-go'); await p.waitForTimeout(900);
    await p.evaluate(()=>{ DQ.S.settings.notify=false; const X=DQ.data.XPF; Object.keys(DQ.data.SK).forEach(k=>{DQ.S.unlocked[k]=true; DQ.S.xp[k]=Math.max(DQ.S.xp[k]||0,X[20]);}); DQ.S.coins=50000; DQ.S.house.owned=true; DQ.S.house.rooms={parlour:true}; DQ.S.towns.mossbarrow={visited:true,boss:false}; DQ.S.inv.iron_sword=1; DQ.S.bank.log_normal=5; DQ.startAct('fish','shrimp',{quiet:true}); });
    for (const [v,[sel,job]] of Object.entries(JOBS)) { await p.evaluate(v=>DQ.go(v), v); await p.waitForTimeout(350);
      const r = await p.evaluate(sel=>{ const el=[...document.querySelectorAll('#view '+sel.split(',').join(', #view '))].find(e=>e.offsetParent); const hudB=document.querySelector('#hud').getBoundingClientRect().bottom; const sub=document.querySelector('#subnav'); return el?{top:Math.round(el.getBoundingClientRect().top+scrollY), chrome:Math.round(Math.max(hudB, sub&&sub.offsetHeight?sub.getBoundingClientRect().bottom:0))}:null; }, sel);
      rows.push([vp.n, v, job, r? r.top : -1, vp.lim]); }
    await p.close();
  }
  await b.close();
  for (const vpn of ['desk','phone']) { console.log('\n== '+vpn+' (first primary element, px from top of page; target < '+(vpn==='desk'?430:560)+')'); rows.filter(r=>r[0]===vpn).forEach(r=>console.log((r[3]>r[4]||r[3]<0?'  SLOW ':'  ok   ')+r[1].padEnd(12)+String(r[3]).padStart(5)+'  '+r[2])); }
})();
