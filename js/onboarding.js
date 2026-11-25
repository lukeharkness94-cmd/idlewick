/* First-time lessons stay in the page. No overlays, blocked controls or repeated popups. */
(() => {
const DQ=window.DQ,D=DQ.data,UI=DQ.ui,{esc,ico}=DQ;
const S=()=>DQ.S;
const lessons={
  fishing:{title:'Fishing',text:'Choose a fishing spot and your character will keep fishing until you stop or set a stopping rule. Higher Fishing levels open new catches.',towards:'Raw fish can be cooked into food for your journeys and fights.',goal:'Start with the five shrimp Elder Wren asks for in First Steps.',art:['fish','shrimp']},
  woodcutting:{title:'Woodcutting',text:'Choose a tree to start cutting. Each type gives its own timber, and you’ll be able to work with more types as your Woodcutting level rises.',towards:'You’ll use logs for equipment, planks, furniture and restoring village buildings, so it’s worth keeping some.',goal:'Cut five logs for First Steps, then check the village well to see what the builders still need.',art:['wood','normal']},
  mining:{title:'Mining',text:'Choose an ore deposit and your character will keep mining it. Better pickaxes make the work faster; higher Mining levels let you work new deposits.',towards:'Smithing turns ore into metal bars, which you can use for equipment, tools and other projects.',goal:'Copper and tin are a useful start: smelt them together to make bronze.',art:['mine','copper']},
  thieving:{title:'Thieving',text:'Choose someone to steal from and your character will keep making attempts. A failed attempt costs health, so keep food available and start with an easier target.',towards:'You can find coins and materials. As you improve, you’ll also get better shop prices and learn to pick locks.',goal:'Try an easy target first and watch how often the attempts succeed before moving on.',art:['thieve','villager']},
  farming:{title:'Farming',text:'Plant seeds in a field and they’ll grow while you do something else, including while you’re away. Livestock live in the separate pasture and produce supplies of their own.',towards:'Your crops and animal produce can become meals, potions and crafting materials.',goal:'Start with potatoes. Check which seeds you have, plant a field and return when the crop is ready.',art:['item','seed_potato']},
  cooking:{title:'Cooking',text:'Choose a recipe and your character will keep cooking while the ingredients last. Food can burn, but a higher Cooking level makes that less likely.',towards:'Cooked food restores health. Auto-eat can use food from your backpack or bank during a fight.',goal:'Cook some of the shrimp you’ve caught, then check your food supply before going into combat.',art:['item','shrimp']},
  smithing:{title:'Smithing',text:'Smelt ore into bars first, then choose a recipe to forge those bars into equipment or tools. The material tiles show what each recipe still needs.',towards:'Smithing supplies weapons, armour, tools and fittings used by several other skills.',goal:'Try smelting bronze from copper and tin, then look for a useful item you can make with it.',art:['item','bar_bronze']},
  crafting:{title:'Crafting',text:'Crafting lets you work hides, wood, cloth and gems into useful equipment. Choose a recipe and gather its ingredients; the work repeats while you have enough supplies.',towards:'You can make bows, staves, armour, jewellery and traps. Several of these help you unlock or improve other skills.',goal:'Try making string from cowhide, then use string and logs to make wooden traps.',art:['item','leather_vest']},
  magic:{title:'Magic',text:'Equip a staff and choose a spell in Spellbook to cast automatically in combat. Runes lets you make casting supplies from copper and logs at Magic 1; Alchemy turns spare items into coins from Magic 16.',towards:'Spells deal different types of damage. A creature’s field guide can help you choose a spell that suits the fight.',goal:'Once you have a mining pick, gather 2 copper ore and 2 logs for a Copper rune batch. Choose a spell you can cast, then prepare for a suitable fight.',art:['item','rune']},
  combat:{title:'Combat',text:'Choose an area to explore. You’ll encounter its creatures at the odds shown, and your character will fight automatically until you retreat or a stopping rule applies.',towards:'Fights build your combat skills and provide loot. Defeating the regional boss opens the road to the next town.',goal:'Prepare food and equipment, then try the Meadow Path. You can retreat if you need more supplies.',art:['creature','goblin']},
  ranged:{title:'Ranged combat',text:'Equip a bow and arrows to fight at range. Arrows are used as you attack, so remember to check the quiver before setting out.',towards:'Bows deal piercing damage, which is useful against creatures with that weakness.',goal:'Equip a bow and matching arrows, then choose a fight that suits your current strength.',art:['item','bow_normal']}
};
Object.assign(lessons,{
 hunting:{title:'Hunting',text:'Craft a field trap, choose a habitat and start fieldwork. Setting, waiting and checking repeat automatically; the best usable trap you own is chosen for you.',towards:'Fieldwork brings back useful materials. Reinforced traps last longer, and precision traps let you favour a material you’ve already discovered.',goal:'Begin with wooden traps in Willowbrook. You can still use the Quarry tab to find suitable combat targets.',art:['skill','hunting']},
 exploration:{title:'Exploration',text:'Visiting a new region and discovering its creatures earns Exploration XP. Check this page when you want to see what you haven’t explored yet.',towards:'Exploration helps you keep track of the places and discoveries still waiting beyond your current route.',goal:'Look at the next region on the map and check what you need to open the road.',art:['skill','exploration']},
 herbalism:{title:'Herbalism',text:'Research a potion recipe in Scholarship, then bring its ingredients here to brew it. Each recipe shows what it makes and what supplies it needs.',towards:'Some potions restore health; others give a useful effect for a limited time. Read the effect before choosing one for your plans.',goal:'Find a potion recipe you can research, gather its ingredients and brew your first batch.',art:['skill','herbalism']},
 enchanting:{title:'Enchanting',text:'Choose an item you own, then use runes and a suitable gem to enchant it. Each rank adds to the item’s equipment bonuses.',towards:'Enchanting improves equipment you want to keep using, rather than replacing it with a different item.',goal:'Start with an item you use regularly and check the cost of its next enchantment.',art:['skill','enchanting']},
 carpentry:{title:'Carpentry',text:'Saw logs into planks, then use those planks to make useful things. Recipes become available as your Carpentry level grows.',towards:'Planks are needed for furniture, village projects, traps and boats.',goal:'To begin Sailing, build a skiff. Its recipe needs twelve ordinary planks and four lengths of string.',art:['skill','carpentry']},
 sailing:{title:'Sailing',text:'Choose an island and send your boat on a voyage. It will return with supplies, then repeat the route while you leave the activity running. Larger boats can reach more distant islands.',towards:'Voyages can supply cloth, gems, seeds and ore. Developing Sailing also improves your Fishing speed.',goal:'A skiff can reach Gull Rock. Try that route first and see what comes back.',art:['skill','sailing']},
 beastmastery:{title:'Beastmastery',text:'Your beasts hatch from eggs at the ranch. You can send an expedition to look for an egg, care for beasts you own and choose one to accompany you.',towards:'An assigned companion gains bond XP when you win fights. Deliberate training uses food and coins, and bonds unlock stronger benefits as they grow.',goal:'Choose a species and a trap at the Trapper, then send your first egg expedition. It returns by itself while you do other things.',art:['skill','beastmastery']}
});
Object.assign(lessons,{
 house:{towards:'Your home provides lasting benefits and a place to display things you’ve earned.',title:'Your home',text:'Buy a home, then add rooms and furniture as you gather the materials. Each improvement shows its cost and the benefit it gives you.',goal:'A storage chest is a useful early improvement if you need more backpack space.',art:['skill','woodcutting']},
 hirelings:{towards:'A finite job can collect a quantity you need and stop when it’s finished, without spending the output for you.',title:'Workers',text:'Hire a worker and assign a job. Workers gather supplies while you do other things, but they need wages to keep working.',goal:'Choose a material you’re short of, check the wage and assign a worker to gather it.',art:['skill','farming']},
 research:{towards:'Completed studies can unlock recipes or give lasting improvements. Each project explains what changes before you commit the supplies.',title:'Scholarship',text:'Choose a research project and provide its cost to begin studying it. Available research slots limit how many projects can run at once.',goal:'Start with a useful study you can afford, then carry on with another activity while it progresses.',art:['item','rune']},
 bestiary:{towards:'Research reveals weaknesses, loot, behaviour and creature stories, so it can help you prepare for later encounters.',title:'Your field guide',text:'Every victory helps you learn about the creature you fought. Select its field-guide entry to see what you know and what the next research stage will reveal.',goal:'Choose a creature you’ve met and check how close you are to its next entry.',art:['creature','lanternmoth']}
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
const intro=()=>`<section class="panel first-play-guide"><div class="first-play-art">${DQ.monSprite(D.MON.mudling||D.MON.chicken,96)}</div><div><span class="k">A short introduction</span><h2>Welcome to Willowbrook</h2><p>Gather supplies, turn them into useful things, and help your village grow. Pick one task at a time; it keeps working while you explore or close the game.</p><div class="first-play-path"><span>Gather</span> → <span>Make &amp; equip</span> → <span>Fight &amp; restore</span></div><div class="btnrow wrap"><button class="btn primary" data-do="introstart">${S().q.first_steps?.s==='done'?'Explore activities':'Start First Steps'}</button><button class="btn sm" data-do="introskip">Skip introduction</button></div></div></section>`;
const render=UI.render;
UI.render=fresh=>{
  DQ.initGuides();
  render(fresh);
  const view=document.getElementById('view');if(!view)return;
  if(UI.view==='overview'&&!S().tut.hidden&&!S().tut.done.intro&&S().tut.restarted)view.insertAdjacentHTML('afterbegin',intro());
};
Object.assign(UI.DO,{
  introskip:()=>{S().tut.done.intro=true;DQ.save();UI.render(false);},
  introstart:()=>{S().tut.done.intro=true;DQ.save();if(DQ.questState(D.QM.first_steps)==='new')DQ.startQuest('first_steps');DQ.go('fishing');},
  resetguides:()=>{S().tut={...S().tut,done:{},hidden:false,version:1,restarted:true};DQ.save();DQ.go('overview');UI.render(false);},
  toggleguides:()=>{S().tut.hidden=!S().tut.hidden;DQ.save();UI.render(false);}
});
if(UI.V.settings){const settings=UI.V.settings;UI.V.settings=()=>settings()+`<section class="panel"><div class="phead"><h2>Help &amp; learning</h2></div><p>Each skill has a quick guide you can open whenever you need it.</p><div class="btnrow wrap"><button class="btn" data-do="toggleguides">${S().tut.hidden?'Enable':'Hide'} the introduction</button><button class="btn" data-do="resetguides">Restart introduction</button></div></section>`;}
})();
