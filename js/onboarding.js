/* First-time lessons stay in the page. No overlays, blocked controls or repeated popups. */
(() => {
const DQ=window.DQ,D=DQ.data,UI=DQ.ui,{esc,ico}=DQ;
const S=()=>DQ.S;
const lessons={
  fishing:{title:'Fishing',text:'Choose an illustrated fishing spot and press Fish. Catches arrive in your backpack while the task runs.',towards:'Raw fish → Cooking → food that keeps you alive in combat.',goal:'Catch five shrimp for Elder Wren’s First Steps quest.',art:['fish','shrimp']},
  woodcutting:{title:'Woodcutting',text:'Select a tree and press Chop. You can see the tree you are working on and the logs it produces.',towards:'Logs → bows and staves, home furniture, and restoring the village.',goal:'Gather five logs for First Steps, then save 20 for the village well.',art:['wood','normal']},
  mining:{title:'Mining',text:'Choose an ore-bearing rock and press Mine. Better tools and levels make gathering faster.',towards:'Ore → smelted bars → weapons, armour and arrows through Smithing.',goal:'Gather copper and tin; together they make bronze bars.',art:['mine','copper']},
  thieving:{title:'Thieving',text:'Pick a target and start pickpocketing for coins and supplies. A failed attempt can hurt you.',towards:'Coins → better tools, equipment, your home and village projects.',goal:'Start with a low-level target and keep an eye on your health.',art:['thieve','villager']},
  farming:{title:'Farming',text:'Select a seed, then plant empty plots. Crops grow alongside your main task and while you are away.',towards:'Crops and animal produce → cooked meals, potion ingredients and crafting materials.',goal:'Plant potatoes, harvest them when ripe, then try Cooking.',art:['item','seed_potato']},
  cooking:{title:'Cooking',text:'Pick an illustrated recipe. Its ingredient counts show what you have and what each attempt uses.',towards:'Raw fish and crops → healing food → longer fights, quests and a reopened village inn.',goal:'Cook your raw shrimp. Food in your backpack or bank can be eaten automatically in combat.',art:['item','shrimp']},
  smithing:{title:'Smithing',text:'Start with the Bars category to smelt ore. Then choose Weapons or Armour to use those bars.',towards:'Copper + tin → bronze bars → equipment for tougher enemies.',goal:'Smelt a bronze bar, then make a weapon or armour piece and compare it in Inventory.',art:['item','bar_bronze']},
  crafting:{title:'Crafting',text:'Choose a category and an illustrated recipe. Materials come from gathering, monsters and your farm.',towards:'Hides, logs and gems → ranged gear, bows, staves and jewellery.',goal:'Use cowhide for leather gear, or logs for your first bow.',art:['item','leather_vest']},
  magic:{title:'Magic',text:'Equip a staff to cast spells during combat. Alchemy turns spare items into coins; both use Arcane runes.',towards:'Runes and staves → elemental attacks and stronger combat options; Alchemy → coins.',goal:'Check your runes before casting, and choose a spell suited to the enemy.',art:['item','rune']},
  combat:{title:'Combat',text:'Select an illustrated opponent and press Fight. The battle shows the actual enemy, your hero and both health bars.',towards:'Fights → combat skills, loot and quests → bosses that open the road to new towns.',goal:'Start with chickens. Choose which skill to train and keep auto-eat on with food available.',art:['creature','chicken']},
  ranged:{title:'Ranged combat',text:'Bows use equipped arrows. Ranged accuracy and arrow strength work together; both appear in gear comparisons.',towards:'Crafted bows + arrows → safer preparation for enemies weak to ranged attacks.',goal:'Equip a bow and arrows in Inventory, then choose an easy opponent.',art:['item','bow_normal']}
};
DQ.skillLessons=lessons;
DQ.initGuides=()=>{
  const t=S().tut||(S().tut={done:{},hidden:false});t.done=t.done||{};
  if(t.version===1)return;
  // Existing saves keep the lessons for skills they have not used yet.
  for(const skill of Object.keys(lessons)){
    const used=skill==='combat'?['attack','strength','defence','ranged'].some(sk=>S().xp[sk]>0):S().xp[skill]>0;
    if(used)t.done['lesson:'+skill]=true;
  }
  if(DQ.totalXp()>0||S().playtime>60000)t.done.intro=true;
  t.version=1;
};
DQ.lessonForPage=page=>{
  DQ.initGuides();if(S().tut.hidden)return null;
  const skill=page==='combat'&&DQ.weaponStyle()==='ranged'?'ranged':page;
  if(!lessons[skill]||S().tut.done['lesson:'+skill])return null;
  if(D.SK[skill]&&!DQ.skillUnlocked(skill))return null;
  return {id:skill,...lessons[skill]};
};
DQ.acknowledgeLesson=id=>{DQ.initGuides();if(!lessons[id])return false;S().tut.done['lesson:'+id]=true;DQ.save();return true;};
const intro=()=>`<section class="panel first-play-guide"><div class="first-play-art">${DQ.monSprite(D.MON.chicken,96)}</div><div><span class="k">A short introduction</span><h2>Welcome to Willowbrook</h2><p>Gather supplies, turn them into useful things, and help your village grow. Pick one task at a time; it keeps working while you explore or close the game.</p><div class="first-play-path"><span>Gather</span> → <span>Make &amp; equip</span> → <span>Fight &amp; restore</span></div><div class="btnrow wrap"><button class="btn primary" data-do="introstart">${S().q.first_steps?.s==='done'?'Explore activities':'Start First Steps'}</button><button class="btn sm" data-do="introskip">Skip introduction</button></div></div></section>`;
const coachHtml=l=>`<aside class="skill-coach" aria-label="First-time ${esc(l.title)} guide"><span class="coach-art">${DQ.artImage(l.art[0],l.art[1],64,'',l.title)}</span><div><b>${esc(l.title)} · getting started</b><p>${esc(l.text)}</p><p><strong>Leads to:</strong> ${esc(l.towards)}</p><section data-reference="true"><h3>A useful first goal</h3><p>${esc(l.goal)}</p></section></div><button class="btn sm" data-do="lessonclose" data-a="${l.id}">Got it</button></aside>`;
let current=null,lastPage=null,lastState=null;
const render=UI.render;
UI.render=fresh=>{
  DQ.initGuides();
  if(lastPage!==UI.view||lastState!==S()){current=null;lastPage=UI.view;lastState=S();}
  if(!current){const l=DQ.lessonForPage(UI.view);if(l){current=l;DQ.acknowledgeLesson(l.id);}}
  render(fresh);
  const view=document.getElementById('view');if(!view)return;
  if(UI.view==='overview'&&!S().tut.hidden&&!S().tut.done.intro)view.insertAdjacentHTML('afterbegin',intro());
  if(current&&!S().tut.hidden)view.insertAdjacentHTML('afterbegin',coachHtml(current));
};
Object.assign(UI.DO,{
  lessonclose:id=>{DQ.acknowledgeLesson(id);current=null;UI.render(false);},
  introskip:()=>{S().tut.done.intro=true;DQ.save();UI.render(false);},
  introstart:()=>{S().tut.done.intro=true;DQ.save();if(DQ.questState(D.QM.first_steps)==='new')DQ.startQuest('first_steps');DQ.go('fishing');},
  resetguides:()=>{S().tut={done:{},hidden:false,version:1};current=null;DQ.save();DQ.go('overview');UI.render(false);},
  toggleguides:()=>{S().tut.hidden=!S().tut.hidden;current=null;DQ.save();UI.render(false);}
});
if(UI.V.settings){const settings=UI.V.settings;UI.V.settings=()=>settings()+`<section class="panel"><div class="phead"><h2>Help &amp; learning</h2></div><p>Short inline lessons introduce a skill the first time you open it. They never interrupt a running task.</p><div class="btnrow wrap"><button class="btn" data-do="toggleguides">${S().tut.hidden?'Enable':'Hide'} first-time guides</button><button class="btn" data-do="resetguides">Restart introduction &amp; skill guides</button></div></section>`;}
})();
