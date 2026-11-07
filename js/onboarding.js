/* First-time lessons stay in the page. No overlays, blocked controls or repeated popups. */
(() => {
const DQ=window.DQ,D=DQ.data,UI=DQ.ui,{esc,ico}=DQ;
const S=()=>DQ.S;
const lessons={
  fishing:{title:'Fishing',text:'Higher spots need more level and give better fish.',towards:'Raw fish → Cooking → food that keeps you alive in combat.',goal:'Catch five shrimp for Elder Wren’s First Steps quest.',art:['fish','shrimp']},
  woodcutting:{title:'Woodcutting',text:'Each tree gives its own logs; better trees need more level.',towards:'Logs → bows and staves, home furniture, and restoring the village.',goal:'Gather five logs for First Steps, then save 20 for the village well.',art:['wood','normal']},
  mining:{title:'Mining',text:'Better tools and levels make gathering faster.',towards:'Ore → smelted bars → weapons, armour and arrows through Smithing.',goal:'Gather copper and tin; together they make bronze bars.',art:['mine','copper']},
  thieving:{title:'Thieving',text:'A failed attempt costs health, so keep food in your pack.',towards:'Coins → better tools, equipment, your home and village projects.',goal:'Start with a low-level target and keep an eye on your health.',art:['thieve','villager']},
  farming:{title:'Farming',text:'Crops grow alongside your main task and while you are away.',towards:'Crops and animal produce → cooked meals, potion ingredients and crafting materials.',goal:'Plant potatoes, harvest them when ripe, then try Cooking.',art:['item','seed_potato']},
  cooking:{title:'Cooking',text:'Higher Cooking levels burn less.',towards:'Raw fish and crops → healing food → longer fights, quests and a reopened village inn.',goal:'Cook your raw shrimp. Food in your backpack or bank can be eaten automatically in combat.',art:['item','shrimp']},
  smithing:{title:'Smithing',text:'Start with Smelting to turn ore into bars. Then pick a metal and choose its Weapons or Armour. Tools lets you forge your own pickaxe, axe and hoe.',towards:'Copper + tin → bronze bars → equipment for tougher enemies.',goal:'Smelt a bronze bar, then make a weapon or armour piece and compare it in Inventory.',art:['item','bar_bronze']},
  crafting:{title:'Crafting',text:'Start with Basics: cut leather string from a cowhide. Armour is grouped by hide, Wood by bows, staves and shields; Charms help your other skills.',towards:'Hides, logs, minerals and gems → armour, bows, staves, shields, charms and tools.',goal:'Use cowhide for leather gear, or logs for your first bow.',art:['item','leather_vest']},
  magic:{title:'Magic',text:'Equip a staff to cast spells during combat. Alchemy turns spare items into coins; both use Arcane runes.',towards:'Runes and staves → elemental attacks and stronger combat options; Alchemy → coins.',goal:'Check your runes before casting, and choose a spell suited to the enemy.',art:['item','rune']},
  combat:{title:'Combat',text:'Creatures appear at the listed rates.',towards:'Encounters → combat skills, creature discoveries, companions and loot → bosses that open new towns.',goal:'Explore the Meadow Path. Bring food, choose a training focus, and watch for a creature that might join you.',art:['creature','chicken']},
  ranged:{title:'Ranged combat',text:'Bows use equipped arrows. Ranged accuracy and arrow strength work together; both appear in gear comparisons.',towards:'Crafted bows + arrows → safer preparation for enemies weak to ranged attacks.',goal:'Equip a bow and arrows in Inventory, then choose an easy opponent.',art:['item','bow_normal']}
};
Object.assign(lessons,{
 hunting:{title:'Hunting',text:'Every creature you meet adds to your field knowledge.',towards:'Victories → Hunting XP, field knowledge and signature companion encounters.',goal:'Explore the Meadow Path and study the creatures you meet.',art:['skill','hunting']},
 exploration:{title:'Exploration',text:'Visit new regions and discover creatures to earn Exploration XP.',towards:'New towns and creature discoveries → a more complete realm guide.',goal:'Open the map and work toward the next town road.',art:['skill','exploration']},
 herbalism:{title:'Herbalism',text:'Brew remedies and potions from plants and other ingredients.',towards:'Harvests → potions → healing and timed boosts.',goal:'Research a remedy, then brew your first potion.',art:['skill','herbalism']},
 enchanting:{title:'Enchanting',text:'Use runes and gems to strengthen equipped gear.',towards:'Enchantment ranks → stronger existing combat bonuses.',goal:'Equip an item and collect the materials for its first enchantment.',art:['skill','enchanting']}
});
Object.assign(lessons,{
 house:{towards:'Furniture gives lasting bonuses to your whole adventure.',title:'Your home',text:'Buy a home, then add rooms and furniture for permanent bonuses.',goal:'Save the purchase price, then start with a storage chest for backpack space.',art:['skill','woodcutting']},
 hirelings:{towards:'Worker materials support crafting and village restoration.',title:'Workers',text:'Hire a worker, choose their job and keep coins available for wages.',goal:'Hire one worker whose materials you need. Their work continues while you are away.',art:['skill','farming']},
 research:{towards:'Projects unlock permanent bonuses and potion recipes.',title:'Scholarship',text:'Complete research projects to earn Scholarship XP, open higher study tiers and gain permanent benefits. Existing discoveries keep their bonuses.',goal:'Start an affordable project.',art:['item','rune']},
 bestiary:{towards:'Research reveals counters, loot and creature legends.',title:'Your field guide',text:'Every victory reveals more: weaknesses, drops, field notes and legends.',goal:'Complete one creature entry. Select its card to see the next research target.',art:['creature','lanternmoth']}
});
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
  DQ.initGuides();
  const skill=page==='combat'&&DQ.weaponStyle()==='ranged'?'ranged':page==='brewery'?'herbalism':page;
  if(!lessons[skill]||S().tut.done['lesson:'+skill])return null;
  if(S().tut.hidden&&!S().seen['tutorial:'+skill])return null;
  if(D.SK[skill]&&!DQ.skillUnlocked(skill))return null;
  if(skill==='house'&&DQ.advLvl()<D.HOUSE.adv||skill==='hirelings'&&DQ.advLvl()<D.HIRE.adv||skill==='research'&&!DQ.skillUnlocked('research'))return null;
  return {id:skill,...lessons[skill]};
};
DQ.lessonInfo=id=>{DQ.initGuides();return lessons[id]||null;};
DQ.acknowledgeLesson=id=>{DQ.initGuides();if(!lessons[id])return false;S().tut.done['lesson:'+id]=true;delete S().seen['tutorial:'+id];DQ.save();return true;};
const intro=()=>`<section class="panel first-play-guide"><div class="first-play-art">${DQ.monSprite(D.MON.chicken,96)}</div><div><span class="k">A short introduction</span><h2>Welcome to Willowbrook</h2><p>Gather supplies, turn them into useful things, and help your village grow. Pick one task at a time; it keeps working while you explore or close the game.</p><div class="first-play-path"><span>Gather</span> → <span>Make &amp; equip</span> → <span>Fight &amp; restore</span></div><div class="btnrow wrap"><button class="btn primary" data-do="introstart">${S().q.first_steps?.s==='done'?'Explore activities':'Start First Steps'}</button><button class="btn sm" data-do="introskip">Skip introduction</button></div></div></section>`;
const coachHtml=l=>`<div class="skill-coach pop" aria-label="First-time ${esc(l.title)} guide"><span class="coach-art">${DQ.artImage(l.art[0],l.art[1],96,'',l.title)}</span><div><p>${esc(l.text)}</p>${l.towards?`<p class="lesson-towards">${esc(l.towards)}</p>`:''}<p class="lesson-goal"><strong>Try this:</strong> ${esc(l.goal)}</p></div></div>`;
let current=null,lastPage=null,lastState=null;
const render=UI.render;
UI.render=fresh=>{
  DQ.initGuides();
  if(lastPage!==UI.view||lastState!==S()){current=null;lastPage=UI.view;lastState=S();}
  if(!current){const l=DQ.lessonForPage(UI.view);if(l){current=l;}}
  render(fresh);
  const view=document.getElementById('view');if(!view)return;
  /* the introduction now lives in Home's Next step card (one clear action); the panel stays for anyone who restarts the guides */
  if(UI.view==='overview'&&!S().tut.hidden&&!S().tut.done.intro&&S().tut.restarted)view.insertAdjacentHTML('afterbegin',intro());
  /* the skill's quick guide is a pop-up the first time you open its page (Nov 2026). It counts as seen however it is
     closed, waits while another dialog is open, and never repeats: a guide, not a forced tour. */
  if(current&&!document.querySelector('.modal')&&!(DQ.sim&&DQ.sim.on)){const l=current;current=null;DQ.acknowledgeLesson(l.id);
    DQ.modal({title:`${l.title}: getting started`,body:coachHtml(l),actions:[{label:'Got it',primary:true}]});}
};
Object.assign(UI.DO,{
  lessonclose:id=>{DQ.acknowledgeLesson(id);current=null;UI.render(false);},
  introskip:()=>{S().tut.done.intro=true;DQ.save();UI.render(false);},
  introstart:()=>{S().tut.done.intro=true;DQ.save();if(DQ.questState(D.QM.first_steps)==='new')DQ.startQuest('first_steps');DQ.go('fishing');},
  resetguides:()=>{S().tut={done:{},hidden:false,version:1,restarted:true};current=null;DQ.save();DQ.go('overview');UI.render(false);},
  toggleguides:()=>{S().tut.hidden=!S().tut.hidden;current=null;DQ.save();UI.render(false);}
});
if(UI.V.settings){const settings=UI.V.settings;UI.V.settings=()=>settings()+`<section class="panel"><div class="phead"><h2>Help &amp; learning</h2></div><p>Short inline lessons introduce a skill the first time you open it. They never interrupt a running task.</p><div class="btnrow wrap"><button class="btn" data-do="toggleguides">${S().tut.hidden?'Enable':'Hide'} first-time guides</button><button class="btn" data-do="resetguides">Restart introduction &amp; skill guides</button></div></section>`;}
})();
