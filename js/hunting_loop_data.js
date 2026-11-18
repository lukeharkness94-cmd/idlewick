/* A small, automatic trap ladder: craft once, best owned field trap is used; choose a material focus only if wanted. */
(() => {
const D=window.DQ.data;
D.UNL.hunting=D.UNL.hunting||{};
for(const [level,names]of Object.entries(D.UNL.beastmastery||{})){const moved=names.filter(n=>n.startsWith('Lay traps in '));D.UNL.beastmastery[level]=names.filter(n=>!n.startsWith('Lay traps in '));if(moved.length)(D.UNL.hunting[level]=D.UNL.hunting[level]||[]).push(...moved.map(n=>n.replace('Lay traps in ','Fieldwork in ')));}
const add=(id,name,lvl,cost,val,sub)=>{D.ITEMS[id]={id,name,type:'craft',ic:'beastmastery',col:id==='live_trap'?'#b08d79':id==='precision_trap'?'#86a8b5':'#a6a3a0',val,trap:true,sub};const r={id:'craft_'+id,name,skill:'crafting',tab:'Tools',lvl,xp:lvl*5,t:3000,in:cost,out:{[id]:1},ev:'craft'};D.RECIPES[r.id]=r;(D.RLIST.crafting=D.RLIST.crafting||[]).push(r);};
add('reinforced_trap','Reinforced field trap',12,{plank_oak:2,bar_iron:2,string:1},45,'Hunting 15. Automatically used for fieldwork; 8% break chance instead of 25%.');
add('precision_trap','Precision field trap',35,{plank_maple:2,bar_steel:2,string:2},110,'Hunting 35. Automatically used for fieldwork; 2% break chance and an optional material focus.');
add('live_trap','Padded live trap',20,{plank_oak:2,cloth:2,string:2},55,'Send from the Trapper for an egg: one hour, 55% common or 20% rare capture. One crate per expedition.');
const rune={id:'craft_rune_trap',name:'Rune trap',skill:'crafting',tab:'Tools',lvl:55,xp:300,t:4000,in:{plank_magic:2,bar_rune:1,gem_sapphire:1,rune:10},out:{rune_trap:1},ev:'craft'};D.RECIPES[rune.id]=rune;D.RLIST.crafting.push(rune);
D.BEAST_TRAPS.padded={name:'Padded live trap',item:'live_trap',hours:1,common:.55,rare:.2,consolation:10};
D.FIELD_TRAPS=[{id:'wooden_trap',lvl:1,break:.25},{id:'reinforced_trap',lvl:15,break:.08},{id:'precision_trap',lvl:35,break:.02,focus:true}];
D.ITEMS.wooden_trap.sub='Crafted starter fieldwork gear. 25% break chance; up to three held also add Hunting XP.';
D.ITEMS.rune_trap.sub='Craft at Crafting 55 or find from regional bosses. Four-hour egg expedition; 80% common or 60% rare capture.';
for(const[sk,l,what]of [['crafting',12,'Reinforced field trap'],['hunting',15,'Reinforced field trap'],['crafting',20,'Padded live trap'],['crafting',35,'Precision field trap'],['hunting',35,'Material focus'],['crafting',55,'Rune trap']]){const u=(D.UNL[sk]=D.UNL[sk]||{});(u[l]=u[l]||[]).push(what);}
})();
