/* Story scenes reuse quests, discoveries, choices, villagers and restored towns. No separate progression track. */
(() => {
const Q=window.DQ,D=Q.data,S=()=>Q.S,scenes=D.STORY_SCENES={};
const done=id=>S().q[id]?.s==='done',accepted=id=>['active','ready','done'].includes(Q.questState(D.QM[id]));
const add=(id,o)=>scenes[id]={id,...o};
add('willowbrook_welcome',{title:'The broken bucket',town:'willowbrook',quest:'first_steps',eligible:()=>accepted('first_steps'),frames:()=>[
 {speaker:'Elder Wren',shot:'well',text:'We used to meet here every morning, pet. Someone would draw water while the rest of us caught up on the village news. Since the goblins broke the well, everyone has had to carry water from the stream.'},
 {speaker:'Elder Wren',shot:'gate',text:'Goblins broke the winch and took the bucket. Orrin wants to chase them. Mabel wants everyone fed first. For once, they are both right.'},
 {speaker:'Elder Wren',shot:'well',text:'Bring five shrimp and five logs. We will start with a meal and sound timber. The full well repair is a village project; this first job gets you ready to help.'}
]});
add('willowbrook_promise',{title:'A place to start',town:'willowbrook',quest:'first_steps',eligible:()=>done('first_steps'),choiceKey:'story_willowbrook',frames:()=>[
 {speaker:'Mabel the Cook',shot:'kitchen',text:'You’ve brought us fish and timber, love. That’s more use than another worried meeting. Bring your catch over to the fire and we’ll start with a meal. Even Orrin is easier to reason with once he’s eaten.'},
 {speaker:'Elder Wren',shot:'well',text:S().projects.well?'The well turns again. You have given us somewhere to begin. What will you put your hands to next?':'We have a start, not a working well yet. The builders still need the rest of the timber and funds. Will you help here first, or take the road to Orrin?'}
],choices:[
 {id:'village',label:'Help Willowbrook first',effect:'Sets your next goal to the well, or the remaining village projects. The road stays open.',goal:()=>S().projects.well?'village':'well',response:'Then we will put that promise to work. When you hear the bucket rise again, you will know what your timber became.'},
 {id:'road',label:'Deal with the goblin threat first',effect:'Keeps the goblin chief as your goal. Village projects remain available.',goal:()=> 'boss',response:'Find Orrin by the east gate. I will keep your place by the well. You do not have to do everything today.'}
]});
add('mabel_supper',{title:'An extra place at the table',town:'willowbrook',quest:'hungry_cook',eligible:()=>accepted('hungry_cook'),frames:()=>[
 {speaker:'Mabel the Cook',shot:'kitchen',text:'The banquet is for the families whose fields were raided. Nobody is in much of a celebrating mood. That is why we are having it.'},
 {speaker:'Mabel the Cook',shot:'kitchen',text:'Would you cook eight shrimp for me? The neighbours are bringing bread and potatoes, so we’ll have enough between us. Keep some food for your own journey as well. Helping everyone else is no excuse for forgetting your supper.'}
]});
add('orrin_gate',{title:'The notches on the gate',town:'willowbrook',quest:'goblin_menace',eligible:()=>accepted('goblin_menace'),frames:()=>[
 {speaker:'Sergeant Orrin',shot:'gate',text:'See the marks on this gatepost? I cut a notch every time the goblins raid a farm, and I’m running out of room. This week they’ve stolen grain, two hens and somebody’s washing. Their chief, Grubnash, calls himself a king. As far as I can tell, his kingdom consists of our missing laundry.'},
 {speaker:'Sergeant Orrin',shot:'gate',text:'I need you to drive six goblins away from the east farms. Get food and equipment ready before you go; we can hold the gate while you prepare. If you find any orders from Grubnash, bring them straight to me. They might tell us what he’s planning.'}
]});
add('hillfort_orders',{title:'Before the hill fort',town:'willowbrook',quest:'chiefs_end',eligible:()=>accepted('chiefs_end'),frames:()=>[
 {speaker:'Sergeant Orrin',shot:'gate',text:Q.choiceOf('goblin_satchel')==='orrin'?'That note you brought me helped us understand his war cry. He takes a deep breath, stamps his foot and then shouts. Watch for that sequence so the special attack doesn’t catch you by surprise.':Q.choiceOf('goblin_satchel')==='buckle'?'I heard you sold that goblin’s brass buckle. Fair enough; the coins may buy you useful armour. Read Grubnash’s field-guide entry before you go, though. Good equipment helps more when you know what you’re facing.':'Grubnash has a hill fort and an audience. His war cry is meant to frighten you into a mistake. Read the field guide and take food.'},
 {speaker:'Sergeant Orrin',shot:'gate',text:'I fought Grubnash once, years ago. I lost. I’m telling you so you know he’s dangerous, not because I expect you to settle it for me. Come back alive. That matters more to me than revenge.'}
]});
add('well_water',{title:'The sound of water',town:'willowbrook',project:'well',eligible:()=>!!S().projects.well,frames:()=>[
 {speaker:'Elder Wren',shot:'well',text:'Look at that—the first bucket is coming up. I haven’t heard people cheer by this well in months. Thank you, pet. That’s a long walk to the stream we won’t have to make tomorrow.'},
 {speaker:'Mabel the Cook',shot:'well',text:Q.choiceOf('story_willowbrook')==='village'?'You said you would start here. Tomorrow I will not have to send the children down to the stream. That is what keeping a promise looks like.':'You came back to it. The road is a fine thing, but it is good to have somewhere to come home to.'}
]});
add('inn_lights',{title:'A light left on',town:'willowbrook',project:'inn',eligible:()=>!!S().projects.inn,frames:()=>[
 {speaker:'Mabel the Cook',shot:'kitchen',text:'The tables are scrubbed, the fire is lit and the door sticks exactly as it always did. It feels like ours again.'},
 {speaker:'Elder Wren',shot:'wide',text:'A traveller asked whether the village was safe. For the first time in a while, I could offer a room instead of an apology.'}
]});
const regions={
 mossbarrow:['Granny Bramble','The missing sound','You hear the sheep, the wind and a wheel turning somewhere behind the farms. Granny Bramble waits until you notice what is missing.','Our chapel bell used to be heard right out in the wood. Now we have to send someone round the farms whenever there’s news, and Farmer Cobb shouts himself hoarse about it. Help where you can, dear. When you’ve settled in, I’d like to talk to you about the missing bell.'],
 saltmere:['Harbourmaster Ilsa','Everything leaves a wake','Saltmere smells of salt, pitch and dinners eaten in a hurry. Ilsa watches an empty berth while the tide pulls at its ropes.','Bells are heavy cargo. Whoever moved yours needed a cart, a crew and someone looking away. Barnacle has made a business of all three.'],
 ironpeak:['Captain Hrod','What the mountain keeps','The pass narrows until the sky is a strip of white. Hrod taps the ice from his beard and holds the gate for you.','A troll can close a road. A troll being paid to keep it closed is another matter. Get warm first. Your eyebrows have frozen.'],
 gloomfen:['Gravewarden Lysa','Lanterns over the water','Each lantern has a name scratched into its handle. Lysa straightens one that the wind has turned towards the marsh.','People think the dead need silence. They need remembering, and a lid that stays on. Morwenna has forgotten both. Walk carefully, and don’t answer if the water says your name.'],
 emberfall:['Warden Ignis','A city still standing','Ash falls on a banner that has been mended so often there is hardly any original cloth left. Ignis brushes it clean.','Pyrrhax can burn a roof in a breath. We put another one up. That is the argument we have been having. I would like your help ending it.'],
 skyreach:['Abbot Seren','The bridges between','A bell rope moves in the wind without making a sound. Across the ravine, a bridge waits for its missing middle.','The storms have been changing direction as though something is driving them away from the Hollow Crown. I don’t know what it is yet. Until we do, please take care on the bridges. There are repairs I would rather have finished before welcoming another traveller.'],
 hollow:['The Last Herald','Where the bells went','No birds up here. Even your footsteps seem to arrive a moment late, as if they had to think about it. The Herald opens the last gate.','The King could hear the towns’ bells from his court. He could not bear that people beyond these walls were carrying on without him, so he paid to have the bells taken away. Remember the people who sent you here. They’re the ones who need them back.']
};
for(const [town,[speaker,title,text,reply]]of Object.entries(regions))add('arrival_'+town,{town,title,arrival:town,eligible:()=>!!S().towns[town]?.visited,frames:()=>[{speaker:'Narrator',shot:'wide',text},{speaker,shot:'gate',text:reply}]});
for(const m of D.MONLIST.filter(m=>m.boss)){
 const voice=D.BOSS_VOICES[m.id];if(!voice)continue;
 add('victory_'+m.id,{title:m.id==='grubnash'?'The green is quiet':m.id==='hollowking'?'A world that answers':'After '+m.name,town:m.town,boss:m.id,eligible:()=>!!S().towns[m.town]?.boss,frames:()=>[
  {speaker:voice[0],shot:'wide',text:voice[1]},
  {speaker:voice[0],shot:m.id==='grubnash'?'well':'gate',text:m.id==='grubnash'?(S().projects.well?'The bucket is rising and children are crossing the green again. Beyond the gate, Mossbarrow’s fields lie under a strangely quiet sky.':'The hill fort is quiet. The well still needs its builders. Beyond the gate lies Mossbarrow; nobody will blame you for taking a moment here first.'):voice[2]}
 ],...(m.id==='grubnash'?{choiceKey:'story_after_grubnash',choices:[
  {id:'home',label:'Stay and help the village',effect:'Makes Willowbrook’s remaining projects your next goal. No road or quest is lost.',goal:()=> 'village',response:'Wren puts the kettle back on. “The builders will be glad of your help, pet. We’ll see what they still need, then give you a chance to put your feet up.”'},
  {id:'road',label:'Follow the road to Mossbarrow',effect:'Makes the next regional challenge your goal. Travel begins only when you choose it.',goal:()=> 'boss',response:'Orrin walks with you as far as the gate. “Ask for Granny Bramble when you reach Mossbarrow,” he says. “She’ll give you a meal and tell you what’s been happening. Probably several other jobs as well, but you can decide which to take.”'}
 ]}:{})});
}
for(const [id,p]of Object.entries(D.PROJECTS)){
 const existing=Object.values(scenes).find(s=>s.project===id),voice=D.PROJECT_VOICES[id],speaker=voice?.[0]||'Narrator';
 if(existing){const frames=existing.frames;existing.frames=()=>[...frames(),{speaker:'Narrator',shot:'wide',text:p.reward}];continue;}
 add('restore_'+id,{title:p.name,town:p.town,project:id,eligible:()=>!!S().projects[id],frames:()=>[{speaker:'Narrator',shot:'wide',text:p.story},...(voice?[{speaker,shot:'wide',text:voice[1]}]:[]),{speaker:'Narrator',shot:'wide',text:p.reward}]});
}
/* The opening's last scene (js/intro.js, owner 28 Nov 2026): Wren meets the hero at the broken well. One reply, flavour
   only, kept in S.choices.story_opening; the plain goal comes just before it. It moves on by itself inside the opening;
   after the opening it can be replayed from Story so far, and an unanswered reply can be given there. */
add('opening_home',{title:'Home again',town:'willowbrook',cinematic:true,choiceKey:'story_opening',ask:'What do you say?',doneLabel:'Continue',eligible:()=>!!((Q.introLive&&Q.introLive())||(Q.introSeen&&Q.introSeen())),frames:()=>[
 {speaker:'Elder Wren',shot:'well',text:'There you are, pet. And in boots. I knew you’d read the whole letter.'},
 {speaker:'Elder Wren',shot:'well',text:'That’s the well. Goblins broke the winch, and the bucket went wherever buckets go. Half the green packed up after the bell went.'},
 {speaker:'Elder Wren',shot:'well',text:'Here’s how it works, as far as I can tell. Get a town back on its feet, see off whatever is blocking its road, and the next town opens up.'},
 {speaker:'Elder Wren',shot:'well',text:'Somewhere at the end of that road is whoever has the bells.'}
],choices:[
 {id:'kettle',label:'Kettle on, then',effect:'The polite answer.',response:'It’s been on since Tuesday, pet. I wasn’t sure which Tuesday you meant. Come in and get warm.'},
 {id:'word',label:'I’d like a word with them',effect:'The honest answer.',response:'So would I. You’ll have to queue behind Mabel. Start with the well; the road will keep.'},
 {id:'boots',label:'I brought boots',effect:'The practical answer.',response:'Good. Mind the third stair, then the goblins. In that order.'}
]});
/* Existing authored adventures become voiced storyboards; their objectives, gates and rewards stay authoritative. */
for(const q of D.QUESTS.filter(q=>q.adventure))add('quest_'+q.id,{title:q.name,town:q.town,quest:q.id,eligible:()=>accepted(q.id),frames:()=>[{speaker:q.giver,shot:'wide',text:q.blurb},{speaker:q.giver,shot:'gate',text:q.choices?'When you’ve finished, we’ll need to decide what to do next. I’ll explain the options before you choose.':'The tasks are written in your quest journal, so you can check what’s left whenever you need to. Come back when you’ve finished, and we’ll take it from there.'}]});
})();
