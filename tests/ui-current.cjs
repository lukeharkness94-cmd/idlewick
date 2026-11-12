/* Optional current UI checks: start scripts/preview.py, then node tests/ui-current.cjs.
   Uses an isolated browser context; no personal save files are read or written. */
const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs');
(async()=>{
 const browser=await chromium.launch({headless:true,args:['--no-sandbox'],...(fs.existsSync('/usr/bin/chromium')?{executablePath:'/usr/bin/chromium'}:{})});
 try {
  const page=await browser.newPage(), errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto(process.env.IDLEWICK_URL||'http://127.0.0.1:8765/');
  await page.locator('#t-new').click();
  await page.locator('#crname').fill('Luke');
  for(const width of [390,738,1440])for(const theme of ['dark','light']){
   await page.setViewportSize({width,height:800});
   await page.evaluate(theme=>{DQ.S.settings.theme=theme;DQ.applyTheme();},theme);
   const entrance=await page.evaluate(()=>{
    const style=selector=>getComputedStyle(document.querySelector(selector));
    return {name:style('#crname').color,back:style('#cr-back').color,begin:style('#cr-go').color,form:style('#crname').fontFamily,logo:style('.logo h1').fontFamily,overflow:document.documentElement.scrollWidth>innerWidth};
   });
   assert.equal(entrance.name,'rgb(233, 228, 213)',`${theme} entrance name contrast`);
   assert.equal(entrance.back,'rgb(233, 228, 213)',`${theme} entrance Back contrast`);
   assert.equal(entrance.begin,'rgb(27, 20, 5)',`${theme} primary button contrast`);
   assert.match(entrance.form,/Alegreya/); /* Storybook lettering (default) uses the Alegreya book serif */assert.match(entrance.logo,/Pixelify Sans/);
   assert.equal(entrance.overflow,false);
  }
  if(process.env.ENTRANCE_PREVIEW){await page.setViewportSize({width:738,height:800});await page.screenshot({path:process.env.ENTRANCE_PREVIEW});}
  await page.locator('#cr-go').click();await page.waitForTimeout(1000);
  await page.evaluate(()=>{DQ.S.tut.hidden=true;DQ.go('overview');DQ.ui.render(false);document.querySelectorAll('.note').forEach(el=>el.remove());});
  const roadmap=await page.locator('.unlock-roadmap').innerText();
  assert.match(roadmap,/Cooking/);assert.match(roadmap,/0\/5\s*Fish caught/i);assert.match(roadmap,/0\/5\s*Logs chopped/i);
  await page.evaluate(()=>{DQ.S.stats.catch=5;DQ.S.stats.chop=5;DQ.checkActionUnlocks();});
  assert.equal(await page.evaluate(()=>DQ.skillUnlocked('cooking')&&DQ.S.unlocked.cooking),true);
  await page.evaluate(()=>{DQ.closeModal();document.querySelectorAll('.note').forEach(el=>el.remove());});
  await page.evaluate(()=>{
   DQ.S.settings.muted=true;DQ.S.settings.notify=false;DQ.S.tut.hidden=true;
   for(const sk of Object.keys(DQ.S.xp)){DQ.S.xp[sk]=300000;DQ.S.unlocked[sk]=true;}
   DQ.S.research.done.herbalism=true;
   DQ.fxDirty();DQ.ui.renderHud();DQ.ui.renderRail();
   document.querySelectorAll('.note').forEach(el=>el.remove());
  });
  const hubs={overview:'home',activity:'home',shop:'shop',map:'world',projects:'village',achievements:'hero',bestiary:'combat',skillsummary:'hero',mastery:'hero',brewery:'skills',bank:'hero',house:'village',hirelings:'village',people:'quests',research:'skills',settings:'settings',fishing:'skills',woodcutting:'skills',character:'hero',quests:'quests',combat:'combat',mining:'skills',thieving:'skills',cooking:'skills',smithing:'skills',crafting:'skills',magic:'skills',farming:'skills',hunting:'skills',enchanting:'skills',exploration:'world'};
  for(const width of [390,1440,1920,2560,3440])for(const theme of ['dark','light']){
   await page.setViewportSize({width,height:1000});
   await page.evaluate(theme=>{DQ.S.settings.theme=theme;DQ.applyTheme();},theme);
   await page.evaluate(()=>DQ.go('fishing'));
   if(width>860)assert.equal(await page.locator('#subnav .stab').count(),0);
   await page.evaluate(()=>DQ.go('brewery'));
   assert.equal(await page.evaluate(()=>DQ.ui.view),'brewery');
   for(const [id,hub] of Object.entries(hubs)){
    await page.evaluate(id=>DQ.go(id),id);
    assert.equal(await page.evaluate(()=>DQ.ui.hubOf(DQ.ui.view).id),hub);
    assert.equal((await page.locator('#view').innerText()).includes('Something went wrong'),false,id);
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,`${width} ${theme} ${id} overflow`);
    if(['fishing','woodcutting','mining','thieving','cooking','smithing','crafting','farming'].includes(id)&&width<=860&&await page.locator('.workspace-focus .skillhero').count()){
     const layout=await page.evaluate(()=>{const focus=document.querySelector('.workspace-focus'),progress=focus.querySelector('.skillhero'),stage=focus.querySelector('.activity-stage,.farm-task');return {before:!!(progress.compareDocumentPosition(stage)&Node.DOCUMENT_POSITION_FOLLOWING),width:progress.getBoundingClientRect().width,bar:progress.querySelector('.sk-main > .bar').getBoundingClientRect().width,main:progress.querySelector('.sk-main').getBoundingClientRect().width};});
     assert.ok(layout.before,`${id} progress precedes action`);assert.ok(Math.abs(layout.bar-layout.main)<2,`${id} XP bar fills its status card`);if(width>=1100)assert.ok(layout.width<=482,`${id} progress has a useful card width`);
     if(width>=1100)assert.ok(await page.locator('#view').evaluate(el=>el.getBoundingClientRect().width>700),`${id} main workspace does not collapse`);
    }
    if(id==='combat'){
     assert.match(await page.locator('.ftr-weapon').textContent(),/s per attack/);
     assert.ok(await page.locator('.encounter-arena').evaluate(el=>getComputedStyle(el).backgroundRepeat.split(',').every(value=>value.trim()==='no-repeat')));
     assert.equal(await page.locator('.combat-col .combat-supplies').count(),1);assert.equal(await page.locator('.combat-col .fighter .ftr-row').count()>=4,true);assert.equal(await page.locator('.combat-side .battle-brief').count(),1);assert.equal(await page.locator('.tiledesc').count(),0);
     assert.equal(await page.locator('.combat-live .lootp').count(),0);if(width===1440&&theme==='dark'){await page.evaluate(()=>{for(let i=0;i<3;i++)DQ.closeModal();});await page.locator('.encounter-list .enc-row').first().click();assert.match(await page.locator('.modal').innerText(),/Field guide/);await page.evaluate(()=>DQ.closeModal());}
    }
   }
   assert.ok(await page.locator('#hud [aria-label="Settings"]').isVisible());
  }
  // A newly unlocked skill wears "New" in the rail until its page is opened; work scenes show the tool, never the weapon.
  {const r=await page.evaluate(()=>{const S=DQ.S,D=DQ.data;delete (S.newSkills||{}).herbalism;S.stats.harvest=20;S.unlocked.herbalism=true;DQ.notify({kind:'unlock',key:'unlock:herbalism',title:'Herbalism unlocked',text:'',icon:'herbalism'});DQ.ui.renderDock();
    const badge=!!document.querySelector('#skilldock .dk[data-a="'+D.SK.herbalism.page+'"] .dk-new');DQ.go(D.SK.herbalism.page);DQ.ui.renderDock();const after=!!document.querySelector('#skilldock .dk[data-a="'+D.SK.herbalism.page+'"] .dk-new');
    S.inv.bronze_sword=1;DQ.equipItem('bronze_sword');DQ.go('fishing');DQ.startAct('fish','shrimp',{quiet:true});DQ.ui.render(true);const gear=document.querySelectorAll('.activity-scene .scene-gear').length;DQ.stopAct();
    DQ.ui.tab.quests='available';DQ.go('quests');const card=document.querySelector('.quest');const order=card?['.phead','.quest-story','.rewards','.quest-actions'].map(k=>{const e=card.querySelector(k);return e?[...card.querySelectorAll('*')].indexOf(e):-1;}):[];
    DQ.go('map');const left=document.querySelector('.explore-left')?.innerText||'';for(let i=0;i<5;i++)DQ.closeModal&&DQ.closeModal();document.querySelectorAll('.note').forEach(n=>n.remove());return {badge,after,gear,order,left};});
   assert.ok(r.badge,'New badge shows after an unlock');assert.ok(!r.after,'New badge clears once the page is opened');assert.equal(r.gear,0,'no weapon in work scenes');
   assert.ok(r.order.every((v,i,a)=>v>=0&&(!i||v>a[i-1])),'quest card reads name, story, rewards, action: '+r.order);assert.match(r.left,/quests/);assert.match(r.left,/Exploration/);}
  // Combat: the preview, the preparation brief and the start control describe the same encounter; the eat stepper works.
  {const r=await page.evaluate(()=>{const S=DQ.S;S.beast.kills.goblin=1;DQ.ui.taskChoice.combat='goblin';DQ.go('combat');DQ.ui.render(true);
    const nm=document.querySelector('#av-foe')?.closest('.side')?.querySelector('.nm')?.innerText||'',brief=document.querySelector('.battle-brief h3')?.innerText||'',ctl=document.querySelector('.arena-ctl')?.innerText||'',danger=document.querySelector('.battle-brief .danger')?.innerText||'';
    const at=S.settings.eatAt;DQ.ui.DO.eatstep('10');const after=S.settings.eatAt;S.settings.eatAt=at;
    S.journey='boss';S.journeyTarget='grubnash';const was=S.towns.willowbrook.boss;S.towns.willowbrook.boss=true;DQ.go('overview');DQ.ui.render(true);const home=document.querySelector('.journey')?.innerText||'';S.towns.willowbrook.boss=was;
    return {nm,brief,ctl,danger,at,after,home};});
   assert.match(r.nm,/Goblin/);assert.match(r.brief,/Goblin/);assert.match(r.ctl,/Goblin/);assert.match(r.danger,/danger/i);assert.equal(r.after,Math.min(70,r.at+10));
   assert.match(r.home,/Goal complete/i);assert.match(r.home,/Choose another goal/);}
  // Viewing combat must never display another activity's progress as an attack timer.
  await page.evaluate(()=>{DQ.paused=true;DQ.startAct('fish','shrimp',{quiet:true});DQ.act.t0=Date.now()-DQ.act.dur/2;DQ.go('combat');DQ.ui.render(false);});
  assert.equal(await page.evaluate(()=>DQ.act.kind),'fish');
  assert.equal(await page.locator('.encounter-arena [data-prog]').count(),0);
  assert.ok((await page.locator('.encounter-arena .mid').innerText()).includes('Preview'));
  assert.ok(await page.locator('#hud [data-prog="@"]').count());
  await page.evaluate(()=>{DQ.startAct('fight','chicken',{quiet:true});DQ.act.t0=Date.now()-DQ.act.dur/2;DQ.ui.render(false);});
  assert.equal(await page.locator('.encounter-arena [data-prog="fight:chicken"]').count(),1);
  assert.equal(await page.locator('.encounter-arena [data-prog="@"]').count(),0);
  await page.evaluate(()=>{DQ.stopAct(true);DQ.ui.render(false);});
  assert.equal(await page.locator('.encounter-arena [data-prog]').count(),0);
  await page.evaluate(()=>{DQ.ui.questTab='available';DQ.go('quests');DQ.ui.render(false);});
  for(let i=0;i<2;i++){
   const accept=page.locator('#view [data-do="qstart"]').first();
   const id=await accept.getAttribute('data-a');await accept.click();await page.evaluate(()=>{for(let k=0;k<4;k++)DQ.closeModal&&DQ.closeModal();}); /* accepting a main quest opens its skippable story scene */
   assert.equal(await page.evaluate(()=>DQ.ui.questTab),'available');
   assert.ok(await page.evaluate(id=>['active','ready'].includes(DQ.questState(DQ.data.QM[id])),id));
  }
  await page.evaluate(()=>{DQ.go('research');});
  assert.ok(await page.evaluate(()=>document.querySelector('#active-research').compareDocumentPosition(document.querySelector('.scholarship-grid'))&Node.DOCUMENT_POSITION_FOLLOWING));
  assert.ok(await page.evaluate(()=>DQ.data.MONLIST.every(m=>{
   const template=document.createElement('template');template.innerHTML=DQ.battleFoe(m);
   /* every creature is a code-drawn pixel sprite that moves as a whole */
   return !!template.content.querySelector('.px-foe img.pxa[src^="data:image/png"]');
  })),'every enemy has a battle-ready model');
  await page.evaluate(()=>DQ.go('combat'));
  assert.ok(await page.locator('.area-card').count()>=2,'combat offers town areas');
  assert.ok((await page.locator('.hunt-areas').innerText()).includes('Common'),'areas expose encounter rarity');
  await page.locator('.area-card [data-do="huntarea"]').first().click();
  assert.equal(await page.evaluate(()=>DQ.act?.kind),'fight');
  assert.ok(await page.evaluate(()=>!!DQ.act?.area),'expedition persists its selected area');
  await page.evaluate(()=>DQ.stopAct(true));
  // Render the complete live catalogue, including research-added potions.
  assert.equal(await page.evaluate(()=>{
   const sprites=Object.values(DQ.data.ITEMS).map(it=>DQ.gearIconUrl(it.id)||DQ.artUrl('item',it.id));
   return new Set(sprites).size===sprites.length;
  }),true);
  await page.evaluate(()=>{document.querySelectorAll('#notes .note').forEach(n=>n.remove());DQ.S.settings.notify=true;DQ.go('mining');DQ.notify({kind:'unlock',key:'unlock:mining',title:'Mining unlocked',text:'Try mining',page:'mining',sound:false});});
  /* a new skill is a big moment: it gets the full reveal dialog (owner request, Nov 2026) */
  assert.equal(await page.locator('.modal .lr-unlock').count(),1);
  assert.ok((await page.locator('.modal').innerText()).includes('Mining'));
  await page.evaluate(()=>DQ.closeModal());
  await page.evaluate(()=>{DQ.notify({kind:'ach',key:'ach:quiet',title:'Routine achievement',sound:false});DQ.openBell();});
  assert.ok((await page.locator('.modal').innerText()).includes('Routine achievement'));
  assert.ok(!(await page.locator('.modal').innerText()).includes('Mining unlocked'));
  await page.evaluate(()=>{
   DQ.closeModal();document.querySelector('.note:not(.out) .n-x')?.click();
   DQ.S.xp.fishing=DQ.data.XPF[5]-1;DQ.fxDirty();DQ.go('fishing');
  });
  await page.waitForTimeout(400);
  await page.evaluate(()=>DQ.addXp('fishing',1,{raw:true}));
  const level=page.locator('#notes .note.level');
  assert.equal(await level.count(),1);assert.ok((await level.innerText()).includes('Sardine'));
  assert.equal(await page.locator('.modal').count(),0);
  await level.locator('.n-x').click();
  // A completed work event produces local feedback, with no particle buildup.
  await page.evaluate(()=>{DQ.S.settings.notify=false;DQ.paused=true;DQ.go('woodcutting');DQ.startAct('wood','normal',{quiet:true});DQ.ui.render(false);});
  assert.ok(await page.locator('.scene-worker').isVisible());
  assert.equal(await page.evaluate(()=>DQ.S.equip.weapon),'bronze_sword');
  assert.notEqual(await page.evaluate(()=>DQ.heroWorkFigureUrl(DQ.S.look)),await page.evaluate(()=>DQ.heroFigureUrl(DQ.S.look)));
  await page.waitForTimeout(300);
  await page.evaluate(()=>DQ.emit('workcycle',{kind:'wood',id:'normal',quantity:1}));
  assert.ok(await page.locator('.work-result').count());
  /* effects remove themselves when their animation finishes; allow for a busy machine, but never leave one behind */
  await page.waitForFunction(()=>!document.querySelector('.scene-effect'),null,{timeout:2500});assert.equal(await page.locator('.scene-effect').count(),0);
  await page.evaluate(()=>{DQ.go('combat');DQ.startAct('fight','chicken',{quiet:true});DQ.ui.render(false);});
  await page.waitForTimeout(300);await page.evaluate(()=>DQ.splat('foe',2,'hit',0));
  await page.waitForTimeout(260);assert.ok(await page.locator('.combat-slash').count());
  /* pixel sprites move as a whole */
  assert.ok(await page.locator('#av-you .px-hero').count());
  assert.ok(await page.locator('#av-foe .px-foe').count());
  await page.evaluate(()=>DQ.splat('foe',2,'hit',0));await page.waitForTimeout(40);
  assert.ok(await page.evaluate(()=>{
   /* the scripted attack swing, not the gentle CSS idle bob */
   const bone=document.querySelector('#av-you .px-hero'),all=bone?bone.getAnimations():[],animation=all.find(a=>!(typeof CSSAnimation!=='undefined'&&a instanceof CSSAnimation))||all[0];
   if(!animation)return false;
   animation.pause();const poses=new Set();
   const span=Math.min(1000*80/120,Number(animation.effect.getTiming().duration)||666);
   for(let frame=0;frame<80;frame++){animation.currentTime=frame*span/80;poses.add(getComputedStyle(bone).transform);}
   animation.play();return poses.size>70;
  }),'attack poses interpolate at 120 samples per second');
  await page.waitForTimeout(900);
  for(const [weapon,style] of [['bow_normal','ranged'],['staff_normal','magic']]){
   await page.evaluate(weapon=>{DQ.stopAct(true);DQ.S.equip.weapon=weapon;DQ.fxDirty();DQ.ui.render(false);},weapon);
   await page.waitForTimeout(300);await page.evaluate(()=>DQ.splat('foe',2,'hit',0));
   await page.waitForTimeout(260);assert.ok(await page.locator('.combat-projectile.'+style).count());
   await page.waitForTimeout(900);
  }
  await page.evaluate(()=>{DQ.S.settings.reduceFx=true;DQ.ui.render(false);DQ.splat('foe',2,'hit',0);});
  assert.equal(await page.locator('.scene-effect').count(),0);
  await page.emulateMedia({reducedMotion:'reduce'});
  await page.evaluate(()=>{DQ.S.settings.reduceFx=false;DQ.go('woodcutting');DQ.startAct('wood','normal',{quiet:true});DQ.ui.render(false);DQ.emit('workcycle',{kind:'wood',id:'normal',quantity:1});});
  assert.equal(await page.locator('.scene-effect').count(),0);
  assert.equal(await page.locator('.scene-worker').evaluate(el=>getComputedStyle(el).animationName),'none');
  await page.emulateMedia({reducedMotion:'no-preference'});
  await page.evaluate(()=>{DQ.stopAct(true);DQ.go('woodcutting');});
  await page.locator('#hud [aria-label="Settings"]').click();
  assert.equal(await page.evaluate(()=>DQ.ui.view),'settings');
  /* towns to one scale: every town draws at 640 x 360 with each restoration site inside it, every skill's district
     draws for every town, the hero and the target stand at 3x on the district's ground line */
  const scale=await page.evaluate(()=>{const A=DQ.pixelArt,D=DQ.data,out=[];for(const t of Object.keys(A.TOWN_STYLE)){const c=A.sceneFor(t,{},{boats:[1,5],traps:true,farm:true});if(c.width!==640||c.height!==360)out.push(t+' size');for(const s of A.siteLayout(t))if(s.X<0||s.X+32>640||s.Y<0||s.Y+32>360)out.push(t+' site '+s.id);
    for(const [k,key] of [['wood','woodcutting'],['mine','mining'],['fish','fishing'],['thieve','thieving'],['recipe','cooking'],['recipe','smithing'],['recipe','crafting'],['recipe','carpentry'],['alch','magic'],['sail','sailing'],['train','beastmastery']]){const d=A.districtFor(t,k,key,{island:'gull_rock',tier:2});if(d.width!==240||d.height!==100)out.push(t+' '+k);}}return out;});
  assert.deepEqual(scale,[],'town and district scenes');
  await page.evaluate(()=>{DQ.go('woodcutting');DQ.startAct('wood','normal',{quiet:true});DQ.ui.render(false);});await page.waitForTimeout(200);
  const fig=await page.evaluate(()=>{const w=document.querySelector('.scene-worker img'),t=document.querySelector('.scene-target img'),sc=document.querySelector('.activity-scene');return {w:[w.offsetWidth,w.offsetHeight],t:[t.offsetWidth,t.offsetHeight],bg:getComputedStyle(sc).backgroundSize};});
  assert.deepEqual(fig,{w:[72,96],t:[96,144],bg:'720px 300px'},'hero, tree and district share one 3x scale');
  await page.evaluate(()=>{DQ.stopAct(true);});
  assert.deepEqual(errors,[]);
  if(process.env.UI_PREVIEW){await page.setViewportSize({width:1440,height:1000});await page.evaluate(()=>{DQ.go('woodcutting');DQ.startAct('wood','normal',{quiet:true});DQ.ui.render(false);});await page.waitForTimeout(800);await page.screenshot({path:process.env.UI_PREVIEW,fullPage:true});}
  console.log('PASS current UI: navigation, both themes at 390/1440/1920/2560/3440, batch quest acceptance, research ordering, distinct live inventory art, same-page levels with unlock details, quiet bell history, work/combat effects, cleanup and reduced motion.');
 } finally {await browser.close();}
})().catch(e=>{console.error(e);process.exit(1)});
