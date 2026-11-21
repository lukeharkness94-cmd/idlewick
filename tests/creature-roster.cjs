/* Creature roster (21 Nov 2026): combat areas hold hostile creatures only, each town has a hunting ground of animals
   gated by Hunting level, no quest target or material source was lost, and the screens behave. Isolated fixtures. */
const{chromium}=require('playwright'),assert=require('node:assert/strict');
(async()=>{const b=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||undefined,args:['--no-sandbox'],headless:true});try{
const p=await b.newPage({viewport:{width:1440,height:900}}),errors=[];p.on('pageerror',e=>errors.push(e.stack));
await p.goto(process.env.IDLEWICK_URL||'http://127.0.0.1:8765/index.html');await p.waitForTimeout(1200);
const data=await p.evaluate(()=>{const D=DQ.data,bad=[];
 for(const[t,as]of Object.entries(D.AREAS)){const hunt=as.filter(a=>a.hunt);if(hunt.length!==1)bad.push(t+' has '+hunt.length+' hunting grounds');
  for(const a of as)for(const e of a.monsters){const m=D.MON[e.id];if(!m)bad.push('missing '+e.id);else if(a.hunt&&!m.hl)bad.push('animal without Hunting level '+e.id);else if(!a.hunt&&m.hl)bad.push('animal in a combat area '+e.id);}
  if(DQ.combatAreas(t).length<2)bad.push(t+' combat areas');}
 /* every ordinary creature lives somewhere; every kill objective's target can be reached */
 for(const m of D.MONLIST.filter(m=>!m.boss&&!m.mini&&!m.tower))if(!DQ.areaForMonster(m.id))bad.push('homeless '+m.id);
 for(const q of D.QUESTS)for(const o of q.obj)if(o.ev==='kill'&&D.MON[o.key]&&!D.MON[o.key].boss&&!D.MON[o.key].mini&&!D.MON[o.key].tower&&!DQ.areaForMonster(o.key))bad.push('quest '+q.id+' target '+o.key);
 /* materials that recipes or projects use still drop somewhere */
 for(const id of ['feather','cowhide','wolf_pelt','frost_pelt','bogscale','drakehide','wyrm_scale','egg','wool','raw_game','string','old_bone'])if(!D.MONLIST.some(m=>m.drops.some(d=>d[0]===id)))bad.push('no source '+id);
 /* animals carry no weapons; villains keep their town loot */
 for(const as of Object.values(D.AREAS))for(const a of as)for(const e of a.monsters){const m=D.MON[e.id];if(a.hunt&&m.drops.some(d=>D.ITEMS[d[0]]?.slot&&!D.ITEMS[d[0]]?.unique))bad.push('armed animal '+m.id);}
 const sprites=D.MONLIST.filter(m=>!DQ.pixelArt.hasCreature(m.id)).map(m=>m.id);if(sprites.length)bad.push('no sprite '+sprites);
 return {bad,count:D.MONLIST.length,cook:!!D.RECIPES.cook_roast_game};});
assert.deepEqual(data.bad,[]);assert.ok(data.count>=175,'roster size '+data.count);assert.ok(data.cook,'roast game recipe');
await p.locator('#t-new').click();await p.locator('#cr-go').click();await p.waitForTimeout(800);
const r=await p.evaluate(()=>{const S=DQ.S,D=DQ.data;S.settings.notify=false;for(let i=0;i<12;i++)DQ.closeModal();
 const out={};S.unlocked.hunting=true;S.xp.hunting=0;
 /* Hunting 1: only the chicken; a cow cannot be tracked, a quest target can */
 out.cowBlocked=!DQ.startHunt('willowbrook:hunt','cow');out.chickenOk=DQ.startHunt('willowbrook:hunt','chicken');DQ.stopAct();
 out.picks=new Set(Array.from({length:60},()=>DQ.pickEncounter(DQ.huntGround('willowbrook'),null)?.id)).size;
 S.xp.hunting=D.XPF[10];out.picksLater=new Set(Array.from({length:200},()=>DQ.pickEncounter(DQ.huntGround('willowbrook'),null)?.id)).size;
 /* the combat window lists combat areas only, never the hunting ground */
 DQ.go('combat');const names=[...document.querySelectorAll('#view .cw-area-h b')].map(b=>b.textContent);out.window=names;
 /* hunting page lists the ground and locks what is above your level */
 S.xp.hunting=0;DQ.ui.DO.huntground();out.locks=document.querySelectorAll('#view .activity-choices .locked, #view .activity-choices [aria-disabled="true"], #view .activity-choices .blackout').length;
 /* a hunt is its own activity (hunt_stalk.js): a catch pays Hunting; an ordinary fight pays no Hunting at all */
 let before=S.xp.hunting;DQ.startHunt('willowbrook:hunt','chicken');out.huntKind=DQ.act&&DQ.act.kind;const rnd=Math.random;Math.random=()=>.01;DQ.KIND_EXT.hunt.done(DQ.act);Math.random=rnd;out.huntXp=S.xp.hunting-before;DQ.stopAct();before=S.xp.hunting;DQ.startHunt('willowbrook:0','mudling');DQ.nextEncounter(D.MON.mudling);out.fightXp=S.xp.hunting-before;DQ.stopAct();
 return out;});
assert.ok(r.cowBlocked,'cow needs Hunting 7');assert.ok(r.chickenOk,'chicken huntable at 1');assert.equal(r.picks,1,'only the chicken at Hunting 1');assert.ok(r.picksLater>=5,'all farm animals at Hunting 10');
assert.deepEqual(r.window,['Meadow Path','Goblin Thicket']);assert.ok(r.locks>=3,'locked animals shown locked');assert.equal(r.huntKind,'hunt','animals are hunted, not fought');assert.ok(r.huntXp>0&&r.huntXp>r.fightXp,'a catch pays Hunting '+r.huntXp+' vs '+r.fightXp);
assert.deepEqual(errors,[]);console.log('PASS creature roster: hostile combat areas, hunting grounds by Hunting level, sources and quests intact');
}finally{await b.close();}})().catch(e=>{console.error(e);process.exit(1);});
