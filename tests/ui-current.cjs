/* Optional current UI checks: start scripts/preview.py, then node tests/ui-current.cjs.
   Uses an isolated browser context; no personal save files are read or written. */
const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs');
(async()=>{
 const browser=await chromium.launch({headless:true,args:['--no-sandbox'],...(fs.existsSync('/usr/bin/chromium')?{executablePath:process.env.CHROMIUM_PATH||undefined}:{})});
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
    return {name:style('#crname').color,nameBg:style('#crname').backgroundColor,back:style('#cr-back').color,backBg:style('#cr-back').backgroundColor,begin:style('#tmenu .tbtn.primary').color,primary:getComputedStyle(document.documentElement).getPropertyValue('--brass').trim(),form:style('#crname').fontFamily,logo:style('.logo h1').fontFamily,overflow:document.documentElement.scrollWidth>innerWidth};
   });
   const rgb=c=>c.startsWith('#')?c.slice(1).match(/../g).map(x=>parseInt(x,16)):c.startsWith('color(')?c.match(/[\d.]+/g).slice(0,3).map(x=>Number(x)*255):c.match(/[\d.]+/g).slice(0,3).map(Number); /* color(srgb r g b) from color-mix() is 0-1 */
   const lum=c=>rgb(c).map(x=>{x/=255;return x<=.04045?x/12.92:((x+.055)/1.055)**2.4;}).reduce((a,x,i)=>a+x*[.2126,.7152,.0722][i],0);
   const contrast=(a,b)=>{const x=lum(a),y=lum(b);return(Math.max(x,y)+.05)/(Math.min(x,y)+.05);};
   assert.ok(contrast(entrance.name,entrance.nameBg)>=4.5,`${theme} entrance name contrast`);
   assert.ok(contrast(entrance.back,entrance.backBg)>=4.5,`${theme} entrance Back contrast`);
   assert.ok(contrast(entrance.begin,entrance.primary)>=4.5,`${theme} primary button contrast`);
   assert.match(entrance.form,/Alegreya/); /* Hearthside uses the bundled Alegreya Sans reading face. */assert.match(entrance.logo,/Pixelify Sans/);
   assert.equal(entrance.overflow,false);
  }
  if(process.env.ENTRANCE_PREVIEW){await page.setViewportSize({width:738,height:800});await page.screenshot({path:process.env.ENTRANCE_PREVIEW});}
  await page.locator('#cr-go').click();await page.waitForTimeout(1000);
  await page.evaluate(()=>{DQ.S.tut.hidden=true;DQ.go('overview');DQ.ui.render(false);document.querySelectorAll('.note').forEach(el=>el.remove());});
  /* Part B: Home is the compact glance (one goal, one action); the unlock roadmap sits on Activity & goals, and Cooking is a starter skill (the first fight needs a cooked meal) */
  assert.equal(await page.locator('.home-glance').count(),1);assert.equal(await page.locator('#view .unlock-roadmap').count(),0);
  assert.equal(await page.evaluate(()=>DQ.skillUnlocked('cooking')),true,'Cooking is open from the start');
  await page.locator('.home-next [data-do="go"][data-a="activity"]').click();assert.equal(await page.evaluate(()=>DQ.ui.view),'activity');
  const roadmap=await page.locator('.unlock-roadmap').innerText();
  assert.doesNotMatch(roadmap,/Cooking/);assert.match(roadmap,/Mining/);assert.match(roadmap,/0\/10\s*Gathering actions/i);
  await page.evaluate(()=>{DQ.S.stats.chop=10;DQ.give('tool_'+DQ.toolKey('mining')+'_'+DQ.data.TOOL_ORDER[0],1);DQ.checkActionUnlocks();});
  assert.equal(await page.evaluate(()=>DQ.skillUnlocked('mining')&&DQ.S.unlocked.mining),true);
  await page.evaluate(()=>{DQ.closeModal();document.querySelectorAll('.note').forEach(el=>el.remove());});
  await page.evaluate(()=>{
   DQ.S.settings.muted=true;DQ.S.settings.notify=false;DQ.S.tut.hidden=true;
   DQ.S.tut.prepareCombat=false; /* granted late-game fixture: the fresh hero's first-fight preparation (Part B) is covered by tests/opening-skill-gates.cjs */
   for(const sk of Object.keys(DQ.S.xp)){DQ.S.xp[sk]=300000;DQ.S.unlocked[sk]=true;}
   DQ.S.research.done.herbalism=true;
   DQ.fxDirty();DQ.ui.renderHud();DQ.ui.renderRail();
   document.querySelectorAll('.note').forEach(el=>el.remove());
  });
  const hubs={overview:'home',activity:'home',shop:'town',map:'town',projects:'town',achievements:'journal',bestiary:'journal',skillsummary:'journal',mastery:'journal',brewery:'skills',bank:'hero',house:'town',hirelings:'town',people:'quests',research:'skills',settings:'hero',fishing:'skills',woodcutting:'skills',character:'hero',quests:'quests',combat:'combat',mining:'skills',thieving:'skills',cooking:'skills',smithing:'skills',crafting:'skills',magic:'combat',farming:'skills',hunting:'skills',enchanting:'skills',exploration:'skills'};
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
     assert.equal(await page.locator('.combat-live .lootp').count(),0);if(width===1440&&theme==='dark'){await page.evaluate(()=>{for(let i=0;i<3;i++)DQ.closeModal();});const head=page.locator('.cw-mon .cw-mon-art').nth(1),hid=await head.getAttribute('data-a');await head.click();assert.match(await page.locator('.modal').innerText(),/Field guide/);await page.evaluate(()=>DQ.closeModal());await page.locator('.ready-line [data-do="guide"], [data-do="guide"]').first().click();assert.match(await page.locator('.modal').innerText(),/Field guide/);await page.evaluate(()=>DQ.closeModal());}
    }
   }
   /* five places (owner, 27 Nov 2026): Settings is the gear in the desktop header, and on phones a tab of Hero (the portrait) */
   if(width>860)assert.ok(await page.locator('#hud [aria-label="Settings"]').isVisible());
   else{await page.evaluate(()=>DQ.go('character'));assert.ok(await page.locator('#subnav [data-a="settings"]').isVisible(),'Settings tab on the Hero page');}
  }
  // A newly unlocked skill wears "New" in the rail until its page is opened; work scenes show the tool, never the weapon.
  {const r=await page.evaluate(()=>{const S=DQ.S,D=DQ.data;delete (S.newSkills||{}).herbalism;S.stats.harvest=20;S.unlocked.herbalism=true;DQ.notify({kind:'unlock',key:'unlock:herbalism',title:'Herbalism unlocked',text:'',icon:'herbalism'});DQ.ui.renderDock();
    const badge=!!document.querySelector('#skilldock .dk[data-a="'+D.SK.herbalism.page+'"] .dk-new');DQ.go(D.SK.herbalism.page);DQ.ui.renderDock();const after=!!document.querySelector('#skilldock .dk[data-a="'+D.SK.herbalism.page+'"] .dk-new');
    S.inv.bronze_sword=1;DQ.equipItem('bronze_sword');DQ.go('fishing');DQ.startAct('fish','shrimp',{quiet:true});DQ.ui.render(true);const gear=document.querySelectorAll('.activity-scene .scene-gear').length;DQ.stopAct();
    DQ.ui.tab.quests='available';DQ.go('quests');const card=document.querySelector('.quest');const order=card?[':scope > h2','.quest-story','.rewards','.quest-actions'].map(k=>{const e=card.querySelector(k);return e?[...card.querySelectorAll('*')].indexOf(e):-1;}):[];
    DQ.go('map');const left=document.querySelector('.explore-left')?.innerText||'';for(let i=0;i<5;i++)DQ.closeModal&&DQ.closeModal();document.querySelectorAll('.note').forEach(n=>n.remove());return {badge,after,gear,order,left};});
   assert.ok(r.badge,'New badge shows after an unlock');assert.ok(!r.after,'New badge clears once the page is opened');assert.equal(r.gear,0,'no weapon in work scenes');
   assert.ok(r.order.every((v,i,a)=>v>=0&&(!i||v>a[i-1])),'quest card reads name, story, rewards, action: '+r.order);assert.match(r.left,/quests/);assert.match(r.left,/Exploration/);}
  // Combat: the preview, the preparation brief and the start control describe the same encounter; the eat stepper works.
  {const r=await page.evaluate(()=>{const S=DQ.S;S.beast.kills.goblin=1;/* out of combat the stage is the Where to fight window (20 Nov), so check the three agree during a fight */S.town='willowbrook';DQ.startAct('fight','goblin',{quiet:true});DQ.go('combat');DQ.ui.render(true);
    const nm=document.querySelector('#av-foe')?.closest('.side')?.querySelector('.nm')?.innerText||'',brief=document.querySelector('.battle-brief h3')?.innerText||'',ctl=document.querySelector('.arena-ctl')?.innerText||'',danger=document.querySelector('.battle-brief .danger')?.innerText||'';
    const at=S.settings.eatAt;DQ.ui.DO.eatstep('10');const after=S.settings.eatAt;S.settings.eatAt=at;
    S.journey='boss';S.journeyTarget='grubnash';const was=S.towns.willowbrook.boss;S.towns.willowbrook.boss=true;/* Part B: the goal panel moved from the compact Home to Activity & goals */DQ.go('activity');DQ.ui.render(true);const home=document.querySelector('.home-activity-details .journey')?.innerText||'';S.towns.willowbrook.boss=was;DQ.stopAct(true);
    return {nm,brief,ctl,danger,at,after,home};});
   assert.match(r.nm,/Goblin/);assert.match(r.brief,/Goblin/);assert.match(r.ctl,/Goblin/);assert.match(r.danger,/danger/i);assert.equal(r.after,Math.min(70,r.at+10));
   assert.match(r.home,/Goal complete/i);assert.match(r.home,/Choose another goal/);}
  // Viewing combat must never display another activity's progress as an attack timer.
  await page.evaluate(()=>{DQ.paused=true;DQ.startAct('fish','shrimp',{quiet:true});DQ.act.t0=Date.now()-DQ.act.dur/2;DQ.go('combat');DQ.ui.render(false);});
  assert.equal(await page.evaluate(()=>DQ.act.kind),'fish');
  assert.equal(await page.locator('.encounter-arena [data-prog]').count(),0);
  assert.equal(await page.locator('.encounter-arena .cw-window').count(),1,'another activity running: the stage offers where to fight (20 Nov)');
  assert.ok(await page.locator('#hud [data-prog="@"]').count());
  await page.evaluate(()=>{DQ.startAct('fight','chicken',{quiet:true});DQ.act.t0=Date.now()-DQ.act.dur/2;DQ.ui.render(false);});
  assert.equal(await page.locator('.encounter-arena [data-prog="fight:chicken"]').count(),1);
  assert.equal(await page.locator('.encounter-arena [data-prog="@"]').count(),0);
  await page.evaluate(()=>{DQ.stopAct(true);DQ.ui.render(false);});
  assert.equal(await page.locator('.encounter-arena [data-prog]').count(),0);
  await page.evaluate(()=>{DQ.ui.questTab='available';DQ.go('quests');DQ.ui.render(false);});
  for(let i=0;i<2;i++){
   await page.evaluate(()=>{for(let k=0;k<4;k++)DQ.closeModal&&DQ.closeModal();/* Part B: one active main chapter (js/campaign.js), so pick an offer that can be accepted now */const q=DQ.data.QUESTS.find(q=>DQ.questState(q)==='new'&&!(q.main&&DQ.currentMainQuest()));DQ.ui.tab.questSelected=q&&q.id;DQ.ui.render(false);}); /* a story scene may still be open from earlier steps; Current lists quests under way first, so pick a new offer */
   const accept=page.locator('#view [data-do="qstart"]').first();
   const id=await accept.getAttribute('data-a');await accept.click();await page.evaluate(()=>{for(let k=0;k<4;k++)DQ.closeModal&&DQ.closeModal();}); /* accepting a main quest opens its skippable story scene */
   assert.equal(await page.evaluate(()=>DQ.ui.questTab),'current');
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
  /* 20 Nov: the areas live in the stage's Where to fight window */
  assert.ok(await page.locator('.cw-area').count()>=2,'combat offers town areas');
  assert.match(await page.locator('.cw-window').innerText(),/\d+%/,'areas expose encounter odds');assert.match(await page.locator('.cw-mon-art').first().getAttribute('aria-label'),/Common|Uncommon|Rare/,'and name the rarity');
  await page.locator('.cw-area [data-do="huntarea"]').first().click();
  assert.equal(await page.evaluate(()=>DQ.act?.kind),'fight');
  assert.ok(await page.evaluate(()=>!!DQ.act?.area),'expedition persists its selected area');
  await page.evaluate(()=>DQ.stopAct(true));
  // Render the complete live catalogue, including research-added potions.
  assert.equal(await page.evaluate(()=>{
   const sprites=Object.values(DQ.data.ITEMS).map(it=>DQ.gearIconUrl(it.id)||DQ.artUrl('item',it.id));
   return new Set(sprites).size===sprites.length;
  }),true);
  await page.evaluate(()=>{document.querySelectorAll('#notes .note').forEach(n=>n.remove());for(let i=0;i<4;i++)DQ.closeModal();DQ.S.settings.notify=true;DQ.S.settings.unlockReveals=false;DQ.go('mining');DQ.notify({kind:'unlock',key:'unlock:mining',title:'Mining unlocked',text:'Try mining',page:'mining',sound:false});});
  /* Part B (Task 12): reveals are opt-in; by default a new skill does not take over the screen */
  assert.equal(await page.locator('.modal').count(),0);
  await page.evaluate(()=>{DQ.S.settings.unlockReveals=true;DQ.notify({kind:'unlock',key:'unlock:mining',title:'Mining unlocked',text:'Try mining',page:'mining',sound:false});});
  /* a new skill is a big moment: with Celebrate new systems on it gets the full reveal dialog (owner request, Nov 2026) */
  assert.equal(await page.locator('.modal .lr-unlock').count(),1);
  assert.ok((await page.locator('.modal').innerText()).includes('Mining'));
  await page.evaluate(()=>DQ.closeModal());
  await page.evaluate(()=>{DQ.notify({kind:'ach',key:'ach:quiet',title:'Routine achievement',sound:false});DQ.openBell();});
  assert.ok((await page.locator('.modal').innerText()).includes('Routine achievement'));
  /* Part B: new skills and systems are always listed in the bell too (Settings → Celebrate new systems hint) */
  assert.ok((await page.locator('.modal').innerText()).includes('Mining unlocked'));
  await page.evaluate(()=>{
   DQ.closeModal();document.querySelector('.note:not(.out) .n-x')?.click();
   DQ.S.xp.fishing=DQ.data.XPF[5]-1;DQ.fxDirty();DQ.go('fishing');
  });
  await page.waitForTimeout(400);
  await page.evaluate(()=>DQ.addXp('fishing',1,{raw:true}));
  /* Part B (Task 12): level-ups are routine, so they go to the bell's quiet digest instead of a live note, still naming what the level opens */
  assert.equal(await page.locator('#notes .note.level').count(),0);
  assert.equal(await page.locator('.modal').count(),0);
  const levelNote=await page.evaluate(()=>{const e=DQ.noteLog.find(e=>e.o.key==='lvl:fishing');return e?{title:e.o.title,text:e.o.text||''}:null;});
  assert.ok(levelNote,'the level-up is recorded in the bell');assert.ok((levelNote.title+' '+levelNote.text).includes('Sardine'),JSON.stringify(levelNote));
  await page.evaluate(()=>DQ.openBell());assert.ok((await page.locator('.modal .bell-list').innerText()).includes(levelNote.title));await page.evaluate(()=>DQ.closeModal());
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
  await page.waitForTimeout(300);assert.ok(await page.evaluate(()=>new Promise(resolve=>{const ob=new MutationObserver(()=>{if(document.querySelector('.combat-slash')){ob.disconnect();clearTimeout(timer);resolve(true);}});ob.observe(document.querySelector('.encounter-arena'),{childList:true,subtree:true});const timer=setTimeout(()=>{ob.disconnect();resolve(false);},2500);DQ.splat('foe',2,'hit',0);})));
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
   await page.waitForTimeout(300);assert.ok(await page.evaluate(style=>new Promise(resolve=>{const ob=new MutationObserver(()=>{if(document.querySelector('.combat-projectile.'+style)){ob.disconnect();clearTimeout(timer);resolve(true);}});ob.observe(document.querySelector('.encounter-arena'),{childList:true,subtree:true});const timer=setTimeout(()=>{ob.disconnect();resolve(false);},2500);DQ.splat('foe',2,'hit',0);}),style));
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
