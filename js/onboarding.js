/* First-time lessons stay in the page. No overlays, blocked controls or repeated popups. */
(() => {
const DQ=window.DQ,D=DQ.data,UI=DQ.ui,{esc,ico}=DQ;
const S=()=>DQ.S;
const lessons={
  fishing:{title:'Fishing',text:'Higher spots need more level and give better fish.',towards:'Raw fish → Cooking → food that keeps you alive in combat.',goal:'Catch five shrimp for Elder Wren’s First Steps quest.',art:['fish','shrimp']},
  woodcutting:{title:'Woodcutting',text:'Each tree gives its own logs; better trees need more level.',towards:'Logs → bows and staves, home furniture, and restoring the village.',goal:'Gather five logs for First Steps, then save 20 for the village well.',art:['wood','normal']},
  mining:{title:'Mining',text:'Tools and levels: faster mining.',towards:'Ore → Smithing → gear and arrows.',goal:'Mine copper and tin for bronze.',art:['mine','copper']},
  thieving:{title:'Thieving',text:'Failing costs health. Bring food.',towards:'Coins and special hauls · cheaper shops · lockpicking at 20.',goal:'Start with an easy target.',art:['thieve','villager']},
  farming:{title:'Farming',text:'Crops grow in the background, online or off.',towards:'Crops and produce → food, potions, materials.',goal:'Plant potatoes, harvest, cook.',art:['item','seed_potato']},
  cooking:{title:'Cooking',text:'Higher level: fewer burns.',towards:'Raw fish and crops → healing food.',goal:'Cook your shrimp. Auto-eat uses food from pack or bank.',art:['item','shrimp']},
  smithing:{title:'Smithing',text:'Smelt ore into bars, then forge weapons, armour or tools.',towards:'Copper + tin → bronze → gear.',goal:'Smelt a bronze bar and forge something.',art:['item','bar_bronze']},
  crafting:{title:'Crafting',text:'Leather armour, bows, staves, shields, jewellery and charms.',towards:'Hides, logs and gems → gear.',goal:'Make leather gear or a bow.',art:['item','leather_vest']},
  magic:{title:'Magic',text:'Equip a staff to cast. Alchemy turns items into coins. Both use Arcane runes.',towards:'Elements hit weaknesses.',goal:'Stock runes and pick a spell.',art:['item','rune']},
  combat:{title:'Combat',text:'Explore an area: creatures appear at the listed odds.',towards:'XP, loot, eggs → bosses open new towns.',goal:'Bring food and explore the Meadow Path.',art:['creature','chicken']},
  ranged:{title:'Ranged combat',text:'Bows use equipped arrows.',towards:'Pierce damage for enemies weak to it.',goal:'Equip a bow and arrows.',art:['item','bow_normal']}
};
Object.assign(lessons,{
 hunting:{title:'Hunting',text:'Defeating creatures fills the field guide.',towards:'Hunting XP, field guide entries, wild eggs.',goal:'Explore the Meadow Path.',art:['skill','hunting']},
 exploration:{title:'Exploration',text:'XP for new regions and creatures.',towards:'A complete map and field guide.',goal:'Work toward the next town.',art:['skill','exploration']},
 herbalism:{title:'Herbalism',text:'Brew potions.',towards:'Healing and timed buffs.',goal:'Research a recipe and brew it.',art:['skill','herbalism']},
 enchanting:{title:'Enchanting',text:'Runes + gems: +1 to an item’s bonuses per rank.',towards:'Stronger gear.',goal:'Enchant something you wear.',art:['skill','enchanting']},
 carpentry:{title:'Carpentry',text:'Saw logs into planks.',towards:'Furniture, town projects, boats.',goal:'Build a skiff (12 planks, 4 string) to unlock Sailing.',art:['skill','carpentry']},
 sailing:{title:'Sailing',text:'Voyages to islands. Bigger boats reach farther. Each level: faster Fishing.',towards:'Cloth, gems, seeds, ores.',goal:'Sail to Gull Rock.',art:['skill','sailing']},
 beastmastery:{title:'Beastmastery',text:'Every beast starts as an egg and hatches at the ranch. Feed to train; wins share XP.',towards:'Eggs → companions → bonds to 10.',goal:'Send a trap for your first egg.',art:['skill','beastmastery']}
});
Object.assign(lessons,{
 house:{towards:'Permanent bonuses.',title:'Your home',text:'Buy a home, add rooms and furniture.',goal:'Start with a storage chest.',art:['skill','woodcutting']},
 hirelings:{towards:'Steady materials, online or off.',title:'Workers',text:'Hire workers and pay wages.',goal:'Hire one for a material you need.',art:['skill','farming']},
 research:{towards:'Permanent bonuses and recipes.',title:'Scholarship',text:'Fund research projects.',goal:'Start one you can afford.',art:['item','rune']},
 bestiary:{towards:'Research reveals counters, loot and creature legends.',title:'Your field guide',text:'Every victory reveals more: weaknesses, drops, field notes and legends.',goal:'Complete one creature entry. Select its card to see the next research target.',art:['creature','lanternmoth']}
});
DQ.skillLessons=lessons;
DQ.initGuides=()=>{
  const t=S().tut||(S().tut={done:{},hidden:false});t.done=t.done||{};
  if(t.version===1)return;
  // Existing saves keep the lessons for skills they have not used yet.
  for(const skill of Object.keys(lessons)){
    const used=skill==='combat'?['melee','defence','ranged','magic'].some(sk=>S().xp[sk]>0):S().xp[skill]>0;
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
