/* 22 Nov 2026 feedback: combat arts for Melee/Ranged and a 12-spell book, Smithing anvils and hammers, every tool tier
   needs its metal (copper ore sold in Willowbrook), and the labelled field-guide line with verbs. Isolated fixtures. */
const{chromium}=require('playwright'),assert=require('node:assert/strict');
(async()=>{const b=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||undefined,args:['--no-sandbox'],headless:true});try{
const p=await b.newPage({viewport:{width:1440,height:900}}),errors=[];p.on('pageerror',e=>errors.push(e.stack));
await p.goto(process.env.IDLEWICK_URL||'http://127.0.0.1:8765/index.html');await p.locator('#t-new').click();await p.locator('#cr-go').click();await p.waitForTimeout(900);
const r=await p.evaluate(()=>{const S=DQ.S,D=DQ.data,o={};S.settings.notify=false;for(const k of Object.keys(DQ.skillLessons))S.tut.done['lesson:'+k]=true;for(let i=0;i<9;i++)DQ.closeModal();
 o.books=[D.ARTS.melee.length,D.ARTS.ranged.length,D.SPELLS.length];o.spellEl=D.SPELLS.every(s=>D.DTYPES[D.SPELL_EL[s.id]]);
 o.lockedRefused=!DQ.setArt('melee','whirl');S.xp.melee=D.XPF[40];const base=DQ.pstats();o.set=DQ.setArt('melee','heavy');const heavy=DQ.pstats();o.heavyUp=heavy.max>base.max&&heavy.acc<base.acc;
 DQ.setArt('melee','thrust');o.dtype=DQ.myDtype()==='stab'&&DQ.pstats().dtype==='stab';
 const x=DQ.exportSave();DQ.importSave(x);o.saved=DQ.S.arts&&DQ.S.arts.melee==='thrust';
 /* tools: every tier names its metal, and copper ore is on the first shelf */
 o.everyTool=Object.keys(D.ITEMS).filter(k=>/^tool_/.test(k)&&D.TOOL_COSTS[k]).every(k=>Object.keys(DQ.shopMaterialCost(k)).some(m=>/^(ore_|bar_)/.test(m)));
 o.copperSold=D.SHOPS.willowbrook.includes('ore_copper');
 /* smithing gear */
 const s=DQ.S;s.unlocked.smithing=true;s.xp.smithing=D.XPF[20];s.coins=5000;o.noBars=!DQ.buySmithGear('anvil');DQ.give('bar_bronze',20);DQ.give('log_normal',5);o.anvil=DQ.buySmithGear('anvil');o.hammer=DQ.buySmithGear('hammer');o.fx=[DQ.extraSpeed('smithing')>=.04,DQ.dblChance('smithing')>=.03];o.ironLocked=!DQ.buySmithGear('anvil');
 /* field guide line */
 DQ.go('fishing');const line=document.querySelector('#view .mast-line');o.guide=line&&/Field guide/.test(line.textContent)&&/Catch \d+ more/.test(line.textContent);o.verbs=[DQ.mastVerb('mine','copper'),DQ.mastVerb('wood','normal'),DQ.mastVerb('recipe','cook_shrimp')];
 DQ.go('arts');o.page=!!document.querySelector('#view .arts-grid .art-card');return o;});
assert.deepEqual(r.books,[10,10,12]);assert.ok(r.spellEl);assert.ok(r.lockedRefused,'a locked art cannot be chosen');assert.ok(r.set&&r.heavyUp,'Heavy Swing trades accuracy for damage');assert.ok(r.dtype,'Piercing Thrust stabs');assert.ok(r.saved,'the chosen art is saved');
assert.ok(r.everyTool,'every tool tier needs ore or bars');assert.ok(r.copperSold,'Willowbrook sells copper ore');
assert.ok(r.noBars&&r.anvil&&r.hammer,'anvils and hammers need bars');assert.deepEqual(r.fx,[true,true]);assert.ok(r.ironLocked,'the iron anvil waits for its level and bars');
assert.ok(r.guide,'the field-guide line is labelled and says what to do');assert.deepEqual(r.verbs,['Mine','Chop','Cook']);assert.ok(r.page);
assert.deepEqual(errors,[]);console.log('PASS combat arts and spellbook, smithing anvils and hammers, metal on every tool, field-guide verbs');
}finally{await b.close();}})().catch(e=>{console.error(e);process.exit(1);});
