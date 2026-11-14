/* Story scenes reuse quests, discoveries, choices, villagers and restored towns. No separate progression track. */
(() => {
const Q=window.DQ,D=Q.data,S=()=>Q.S,scenes=D.STORY_SCENES={};
const done=id=>S().q[id]?.s==='done',accepted=id=>['active','ready','done'].includes(Q.questState(D.QM[id]));
const add=(id,o)=>scenes[id]={id,...o};
add('willowbrook_welcome',{title:'The broken bucket',town:'willowbrook',quest:'first_steps',eligible:()=>accepted('first_steps'),frames:()=>[
 {speaker:'Elder Wren',shot:'well',text:'That rope used to wake the whole village. Now we hear the bucket knock against the stones, and nobody comes for water.'},
 {speaker:'Elder Wren',shot:'gate',text:'Goblins broke the winch and took the bucket. Orrin wants to chase them. Mabel wants everyone fed first. For once, they are both right.'},
 {speaker:'Elder Wren',shot:'well',text:'Bring five shrimp and five logs. We will start with a meal and sound timber. The full well repair is a village project; this first job gets you ready to help.'}
]});
add('willowbrook_promise',{title:'A place to start',town:'willowbrook',eligible:()=>done('first_steps'),choiceKey:'story_willowbrook',frames:()=>[
 {speaker:'Mabel the Cook',shot:'kitchen',text:'You cannot eat a promise, so I have put the kettle on. Bring your catch to the fire. A full stomach makes even Orrin slightly less cross.'},
 {speaker:'Elder Wren',shot:'well',text:S().projects.well?'The well turns again. You have given us somewhere to begin. What will you put your hands to next?':'We have a start, not a working well yet. The builders still need the rest of the timber and funds. Will you help here first, or take the road to Orrin?'}
],choices:[
 {id:'village',label:'Help Willowbrook first',effect:'Sets your next goal to the well, or the remaining village projects. The road stays open.',goal:()=>S().projects.well?'village':'well',response:'Then we will put that promise to work. When you hear the bucket rise again, you will know what your timber became.'},
 {id:'road',label:'Deal with the goblin threat first',effect:'Keeps the goblin chief as your goal. Village projects remain available.',goal:()=> 'boss',response:'Find Orrin by the east gate. I will keep your place by the well. You do not have to do everything today.'}
]});
add('mabel_supper',{title:'An extra place at the table',town:'willowbrook',quest:'hungry_cook',eligible:()=>accepted('hungry_cook'),frames:()=>[
 {speaker:'Mabel the Cook',shot:'kitchen',text:'The banquet is for the families whose fields were raided. Nobody is in much of a celebrating mood. That is why we are having it.'},
 {speaker:'Mabel the Cook',shot:'kitchen',text:'Eight properly cooked shrimp. Keep the rest for your own journey. Bring me something warm, and I will make sure there is a place for everyone.'}
]});
add('orrin_gate',{title:'The notches on the gate',town:'willowbrook',quest:'goblin_menace',eligible:()=>accepted('goblin_menace'),frames:()=>[
 {speaker:'Sergeant Orrin',shot:'gate',text:'One notch for every raid. I have nearly run out of gate. They take grain, hens, washing. Grubnash calls it a kingdom.'},
 {speaker:'Sergeant Orrin',shot:'gate',text:'Drive six goblins off the east farms. Prepare first; the patrols will still be there. If you find orders from their chief, bring them to me before Mabel wraps fish in them.'}
]});
add('hillfort_orders',{title:'Before the hill fort',town:'willowbrook',quest:'chiefs_end',eligible:()=>accepted('chiefs_end'),frames:()=>[
 {speaker:'Sergeant Orrin',shot:'gate',text:Q.choiceOf('goblin_satchel')==='orrin'?'That note you brought me was worth more than a sharpened sword. A deep breath, a stamp, then the war cry. Watch the order.':Q.choiceOf('goblin_satchel')==='buckle'?'I heard you sold a goblin buckle. Fair enough. Spend it on something between you and Grubnash’s axe.':'Grubnash has a hill fort and an audience. His war cry is meant to frighten you into a mistake. Read the field guide and take food.'},
 {speaker:'Sergeant Orrin',shot:'gate',text:'I lost to him once. That is not an order to avenge me. Come back alive, and we will call it a better ending.'}
]});
add('well_water',{title:'The sound of water',town:'willowbrook',project:'well',eligible:()=>!!S().projects.well,frames:()=>[
 {speaker:'Elder Wren',shot:'well',text:'The winch turns. Someone cheers when the first bucket comes up, then someone else cheers louder, and now it’s a competition.'},
 {speaker:'Mabel the Cook',shot:'well',text:Q.choiceOf('story_willowbrook')==='village'?'You said you would start here. Tomorrow I will not have to send the children down to the stream. That is what keeping a promise looks like.':'You came back to it. The road is a fine thing, but it is good to have somewhere to come home to.'}
]});
add('inn_lights',{title:'A light left on',town:'willowbrook',project:'inn',eligible:()=>!!S().projects.inn,frames:()=>[
 {speaker:'Mabel the Cook',shot:'kitchen',text:'The tables are scrubbed, the fire is lit and the door sticks exactly as it always did. It feels like ours again.'},
 {speaker:'Elder Wren',shot:'wide',text:'A traveller asked whether the village was safe. For the first time in a while, I could offer a room instead of an apology.'}
]});
const regions={
 mossbarrow:['Granny Bramble','The missing sound','You hear the sheep, the wind and a wheel turning somewhere behind the farms. Granny Bramble waits until you notice what is missing.','Our chapel bell used to carry all the way to the wood. Now the only thing that carries is Farmer Cobb, and only when he’s shouting. Help the farms, dear. When you’ve found your feet, ask me about the bells.'],
 saltmere:['Harbourmaster Ilsa','Everything leaves a wake','Saltmere smells of salt, pitch and dinners eaten in a hurry. Ilsa watches an empty berth while the tide pulls at its ropes.','Bells are heavy cargo. Whoever moved yours needed a cart, a crew and someone looking away. Barnacle has made a business of all three.'],
 ironpeak:['Captain Hrod','What the mountain keeps','The pass narrows until the sky is a strip of white. Hrod taps the ice from his beard and holds the gate for you.','A troll can close a road. A troll being paid to keep it closed is another matter. Get warm first. Your eyebrows have frozen.'],
 gloomfen:['Gravewarden Lysa','Lanterns over the water','Each lantern has a name scratched into its handle. Lysa straightens one that the wind has turned towards the marsh.','People think the dead need silence. They need remembering, and a lid that stays on. Morwenna has forgotten both. Walk carefully, and don’t answer if the water says your name.'],
 emberfall:['Warden Ignis','A city still standing','Ash falls on a banner that has been mended so often there is hardly any original cloth left. Ignis brushes it clean.','Pyrrhax can burn a roof in a breath. We put another one up. That is the argument we have been having. I would like your help ending it.'],
 skyreach:['Abbot Seren','The bridges between','A bell rope moves in the wind without making a sound. Across the ravine, a bridge waits for its missing middle.','We used to think the storms were angry with us. Now I think they’re running from something. Also, mind the third plank on every bridge. Nobody knows why it’s always the third.'],
 hollow:['The Last Herald','Where the bells went','No birds up here. Even your footsteps seem to arrive a moment late, as if they had to think about it. The Herald opens the last gate.','He bought bells because he could not bear the sound of a world carrying on without him. Remember the people who sent you. This is still their story.']
};
for(const [town,[speaker,title,text,reply]]of Object.entries(regions))add('arrival_'+town,{town,title,arrival:town,eligible:()=>!!S().towns[town]?.visited,frames:()=>[{speaker:'Narrator',shot:'wide',text},{speaker,shot:'gate',text:reply}]});
for(const m of D.MONLIST.filter(m=>m.boss)){
 const voice=D.BOSS_VOICES[m.id];if(!voice)continue;
 add('victory_'+m.id,{title:m.id==='grubnash'?'The green is quiet':m.id==='hollowking'?'A world that answers':'After '+m.name,town:m.town,boss:m.id,eligible:()=>!!S().towns[m.town]?.boss,frames:()=>[
  {speaker:voice[0],shot:'wide',text:voice[1]},
  {speaker:voice[0],shot:m.id==='grubnash'?'well':'gate',text:m.id==='grubnash'?(S().projects.well?'The bucket is rising and children are crossing the green again. Beyond the gate, Mossbarrow’s fields lie under a strangely quiet sky.':'The hill fort is quiet. The well still needs its builders. Beyond the gate lies Mossbarrow; nobody will blame you for taking a moment here first.'):voice[2]}
 ],...(m.id==='grubnash'?{choiceKey:'story_after_grubnash',choices:[
  {id:'home',label:'Stay and help the village',effect:'Makes Willowbrook’s remaining projects your next goal. No road or quest is lost.',goal:()=> 'village',response:'Wren puts the kettle back on. The builders are waiting for a pair of hands, and now the road can wait for yours.'},
  {id:'road',label:'Follow the road to Mossbarrow',effect:'Makes the next regional challenge your goal. Travel begins only when you choose it.',goal:()=> 'boss',response:'Orrin walks with you as far as the gate. “Bramble will feed you,” he says. “Try not to let her give you every job in the valley.”'}
 ]}:{})});
}
for(const [id,p]of Object.entries(D.PROJECTS)){
 const existing=Object.values(scenes).find(s=>s.project===id),voice=D.PROJECT_VOICES[id],speaker=voice?.[0]||'Narrator';
 if(existing){const frames=existing.frames;existing.frames=()=>[...frames(),{speaker,shot:'wide',text:`${p.reward} This benefit is now permanent.`}];continue;}
 add('restore_'+id,{title:p.name,town:p.town,project:id,eligible:()=>!!S().projects[id],frames:()=>[{speaker,shot:'wide',text:p.story},{speaker,shot:'wide',text:(voice?voice[1]+' ':'')+p.reward+' This benefit is now permanent.'}]});
}
/* Existing authored adventures become voiced storyboards; their objectives, gates and rewards stay authoritative. */
for(const q of D.QUESTS.filter(q=>q.adventure))add('quest_'+q.id,{title:q.name,town:q.town,quest:q.id,eligible:()=>accepted(q.id),frames:()=>[{speaker:q.giver,shot:'wide',text:q.blurb},{speaker:q.giver,shot:'gate',text:q.choices?'There will be a decision to make when the work is done. Hear both sides before you give your answer.':q.obj.map(o=>o.label).join(' · ')}]});
})();
