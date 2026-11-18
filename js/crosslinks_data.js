/* Optional cross-skill projects. Existing ingredients, tasks, research, buffs and acquisition history. */
(() => {
const D=window.DQ.data;
const item=(id,name,ic,col,type='resource',extra={})=>D.ITEMS[id]={id,name,ic,col,type,val:1,crossArt:true,...extra};
const recipe=(id,skill,lvl,input,output,extra={})=>{const r={id,skill,lvl,in:input,out:output,name:D.ITEMS[Object.keys(output)[0]].name,tab:skill==='cooking'?'Farmhouse':skill==='carpentry'?'Workshop':'Field supplies',xp:20+lvl*2,t:4000,ev:skill==='herbalism'?'brew':skill==='exploration'?'survey':skill==='carpentry'?'carve':skill==='cooking'?'cook':'craft',cross:true,...extra};if(extra.note&&D.ITEMS[Object.keys(output)[0]].type==='tool')D.ITEMS[Object.keys(output)[0]].sub=extra.note;D.RECIPES[id]=r;(D.RLIST[skill]||(D.RLIST[skill]=[])).push(r);return r;};
const potion=(id,name,ic,col,buff,mult,text)=>item(id,name,ic,col,'potion',{drink:{buff,mult,mins:20,name,text}});
item('survey_frame','Birch survey frame','book','#c2aa77','tool');
item('training_frame','Ash training frame','paw','#a77c55','tool');
item('irrigation_frame','Cedar irrigation frame','hoe','#689e9d','tool');
item('workshop_jig','Gloomwood fitting jig','hammer','#716c9d','tool');
potion('reed_bait','Reed bait','fish','#87a46a','fishingBait',1.08,'8% extra-catch chance while Fishing for 20 minutes');
potion('trap_blend','Trail scent blend','paw','#b6a66c','trapCare',.8,'Field traps break 20% less often for 20 minutes; egg odds unchanged');
potion('calming_draught','Calming draught','bottle','#90bfa5','bondTraining',1.25,'Deliberate companion training gives 25% more bond XP for 20 minutes');
potion('field_ward','Field ward','shield','#a4a8d4','specialGuard',.9,'Boss and tower specials deal 10% less damage for 20 minutes');
potion('trail_ration','Packed fish supper','food','#c59a65','sailingCargo',1.25,'Voyage cargo has a 25% chance to return an extra stack for 20 minutes');
recipe('craft_runes','crafting',8,{ore_quartz:3,log_normal:4},{rune:16},{xp:24,note:'A player-made alternative to shop runes. Quartz is inscribed with ordinary timber as fuel. No runes are needed to make the first batch.'});
recipe('inscribe_runes','enchanting',25,{ore_quartz:2,ore_moonstone:1},{rune:60},{xp:90,study:'rune_patterns',note:'An advanced batch unlocked by a practical Scholarship study.'});
recipe('cook_feed','cooking',1,{crop_potato:2,crop_onion:1},{feed:12},{xp:18});
recipe('cook_grain_feed','cooking',15,{crop_wheat:2},{feed:12},{xp:30});
recipe('craft_survey_frame','carpentry',5,{log_birch:6,string:2,bar_bronze:1},{survey_frame:1},{once:true,note:'Kept permanently. Regional surveys finish 25% faster.'});
recipe('craft_training_frame','carpentry',22,{log_ash:6,string:4,bar_iron:2},{training_frame:1},{once:true,note:'Kept permanently. Deliberate training gives 20% more bond XP; the cooldown stays unchanged.'});
recipe('craft_irrigation','carpentry',35,{log_cedar:8,bar_steel:3,string:2},{irrigation_frame:1},{once:true,note:'Kept permanently. Unlocks a saved planting plan for each plot. Choose its next crop with the plot’s plan icon; seeds are spent only when replanting.'});
recipe('craft_fitting_jig','carpentry',55,{log_gloomwood:8,bar_mithril:3},{workshop_jig:1},{once:true,note:'Kept permanently. Unlocks precise wood-and-metal field fittings, not an extra bonus on every recipe.'});
recipe('blend_reed_bait','herbalism',1,{crop_onion:1,bread:1},{reed_bait:3},{xp:25});
recipe('blend_trail_scent','herbalism',15,{crop_cabbage:2,feather:2},{trap_blend:2},{xp:50});
recipe('brew_calming','herbalism',25,{crop_goldleaf:2,milk:1},{calming_draught:2},{xp:70});
recipe('brew_field_ward','herbalism',35,{crop_sunbloom:2,ore_quartz:1},{field_ward:2},{xp:95});
recipe('cook_packed_supper','cooking',20,{herring:2,crop_potato:2,milk:1},{trail_ration:2},{xp:80});
// Stronger known-material fieldwork already exists; this is an alternative precision-trap assembly.
recipe('fit_precision_trap','crafting',35,{log_gloomwood:1,bar_steel:4,string:4},{precision_trap:4},{name:'Precision trap fitting batch',facility:'workshop_jig',note:'Four traps from one piece of specialist timber. Use the fitting jig or your home’s tool rack; the ordinary precision recipe remains available.'});
D.SURVEYS=D.TOWNS.map((t,i)=>{
 const id='chart_'+t.id,lvl=[1,8,15,25,35,45,55,65][i],material=['ore_quartz','log_ash','ore_silver','log_cedar','log_gloomwood','ore_obsidian','ore_skyglass','ore_voidstone'][i];
 item(id,t.name+' field chart','map',t.col||'#b6a579','tool');
 recipe('survey_'+t.id,'exploration',lvl,{bread:1,feather:2},{[id]:1},{once:true,t:30000,xp:100+i*40,town:t.id,tab:'Surveys',note:'One survey, kept in your journal. Opens repeatable local observations and known-material fieldwork focus; roads still require their bosses.'});
 recipe('observe_'+t.id,'exploration',lvl,{bread:1},{[material]:2,feather:1},{t:20000,xp:Math.round(20*(6+lvl*.42)),town:t.id,chart:id,tab:'Observations',name:t.name+' observations',note:'A repeatable local survey walk. Food is consumed; materials return to your pack.'});
 return{id,town:t.id,lvl,material};
});
for(const [id,base,town,chart,lvl]of [['reed_inlet','gull_rock','saltmere','chart_saltmere',18],['cloud_shoal','storm_spire','skyreach','chart_skyreach',68]]){
 const v={...D.VOYAGE[base],id,name:id==='reed_inlet'?'Reed Inlet':'Cloud Shoal',lvl,chart,loot:D.VOYAGE[base].loot.map(x=>[x[0],[...x[1]],x[2]]),blurb:'An optional charted route. Your existing boats and voyage rules apply.'};v.xp=Math.round(v.t/1000*(6+lvl*.42));
 v.loot=id==='reed_inlet'?[['ore_quartz',[2,4],1],['log_birch',[2,4],.8],['cloth',[1,2],.2]]:[['ore_moonstone',[2,4],.8],['ore_skyglass',[1,2],.5],['cloth',[2,4],.8]];
 v.blurb=id==='reed_inlet'?'Quartz banks and birch driftwood supply inscriptions and light frames.':'Moonstone, skyglass and sailcloth for advanced inscriptions and fittings.';
 D.VOYAGES.push(v);D.VOYAGE[id]=v;
}
recipe('cook_curators_picnic','cooking',20,{sardine:2,crop_onion:1,milk:1},{trail_ration:3},{lead:'museum',name:'Curator’s picnic',note:'Optional alternative: finish any museum wing OR survey three regions.'});
recipe('cook_tower_provisions','cooking',30,{salmon:2,crop_potato:1},{trail_ration:3},{lead:'tower',name:'Lighthouse provisions',note:'Optional alternative: clear Saltmere tower floor 3 OR complete the coastal survey.'});
recipe('craft_route_supplies','crafting',15,{log_birch:2,ore_quartz:1},{rune:20},{lead:'plans',name:'Traveller’s inscription plan',note:'Optional plan: 25 merchant pickpockets OR the Mossbarrow survey. No theft is required.'});
recipe('guild_rune_batch','enchanting',99,{ore_quartz:4,ore_moonstone:1},{rune:80},{lead:'guild',name:'Guild inscription batch',note:'Optional specialist batch after completing the Enchanting guild pursuit.'});
})();

(() => {
const D=window.DQ.data;
for(const r of [
 {id:'forge_supply_batch',skill:'smithing',lvl:6,name:'Village forge batch',project:'forge',in:{ore_copper:4,ore_tin:4,log_normal:2},out:{bar_bronze:5},xp:40,ev:'smelt'},
 {id:'inn_packed_lunch',skill:'cooking',lvl:8,name:'Inn packed lunches',project:'inn',in:{shrimp:2,crop_potato:1},out:{trail_ration:2},xp:40,ev:'cook'},
 {id:'boathouse_provisions',skill:'cooking',lvl:20,name:'Boathouse provisions',project:'salt_boathouse',in:{raw_mackerel:3,crop_onion:2},out:{trail_ration:3},xp:75,ev:'cook'}
]){Object.assign(r,{t:6000,tab:r.skill==='smithing'?'Bars':'Farmhouse',cross:true,note:'Optional restored-building commission. Ordinary production remains available.'});D.RECIPES[r.id]=r;D.RLIST[r.skill].push(r);}
})();
