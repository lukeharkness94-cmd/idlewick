/* Idlewick: town expeditions, weighted encounters and collectible creatures. */
(() => {
const DQ=window.DQ,D=DQ.data,UI=DQ.ui,{esc,fmt,chance}=DQ,S=()=>DQ.S;
const names={
 willowbrook:['Meadow Path','Goblin Thicket'],mossbarrow:['Old Farmland','Whispering Wood'],
 saltmere:['Rocky Shore','Smuggler Coves'],ironpeak:['Lower Caverns','Frozen Pass'],
 gloomfen:['Sunken Road','Witchfen'],emberfall:['Cinder Flats','Wyrm Crags'],
 skyreach:['Cloud Gardens','Thunder Peaks'],hollow:['Ruined Causeway','Shadow Court']
};
D.AREAS={};
for(const town of D.TOWNS){
  const mons=D.MONLIST.filter(m=>m.town===town.id&&!m.boss), cut=Math.max(1,Math.ceil(mons.length/2));
  const groups=[mons.slice(0,Math.min(mons.length,cut+1)),mons.slice(Math.max(0,cut-1))];
  D.AREAS[town.id]=groups.map((list,i)=>({id:`${town.id}:${i}`,town:town.id,name:(names[town.id]||['Outskirts','Wilds'])[i],monsters:list.map((m,j)=>({id:m.id,weight:[58,28,14,8][j]||6}))}));
}
DQ.areaForMonster=id=>Object.values(D.AREAS).flat().find(a=>a.monsters.some(e=>e.id===id));
const questTarget=()=>{
  for(const q of D.QUESTS){const p=S().q[q.id];if(!p||p.s!=='active'||q.town!==S().town)continue;
    const o=q.obj.find((o,i)=>o.ev==='kill'&&DQ.objProg(q,p,i)<o.n&&D.MON[o.key]);if(o)return o.key;
  } return null;
};
DQ.questHuntTarget=questTarget;
DQ.encounterOdds=area=>{const total=area.monsters.reduce((n,e)=>n+e.weight,0);return area.monsters.map(e=>({...e,pct:Math.round(e.weight/total*100),monster:D.MON[e.id]}));};
DQ.pickEncounter=(area,target)=>{
  if(target&&area.monsters.some(e=>e.id===target))return D.MON[target];
  const total=area.monsters.reduce((n,e)=>n+e.weight,0);let roll=Math.random()*total;
  for(const e of area.monsters){roll-=e.weight;if(roll<=0)return D.MON[e.id];}return D.MON[area.monsters[0].id];
};
DQ.startHunt=(areaId,target=null,forQuest=false)=>{
  const area=Object.values(D.AREAS).flat().find(a=>a.id===areaId&&a.town===S().town);if(!area)return false;
  if(target&&!area.monsters.some(e=>e.id===target))target=null;
  const m=DQ.pickEncounter(area,target);if(!DQ.startAct('fight',m.id))return false;
  DQ.act.area=area.id;DQ.act.target=target;DQ.act.questTarget=!!forQuest;S().act.area=area.id;S().act.target=target;S().act.questTarget=!!forQuest;S().hunt.area=area.id;S().hunt.target=target;DQ.save();DQ.emit('encounter',m);return true;
};
DQ.nextEncounter=defeated=>{
  if(!DQ.act?.area)return null;
  const area=Object.values(D.AREAS).flat().find(a=>a.id===DQ.act.area);if(!area)return null;
  S().hunt.encounters=(S().hunt.encounters||0)+1;
  if(DQ.act.questTarget&&questTarget()!==DQ.act.target){DQ.act.target=null;DQ.act.questTarget=false;if(S().act){S().act.target=null;S().act.questTarget=false;}S().hunt.target=null;}
  const cid='wild_'+defeated.id, pet=D.PET[cid];
  if(pet?.collectible&&!S().pets.owned[cid]&&chance(Math.max(.008,.05-defeated.cl*.00035)))DQ.awardPet(cid);
  return DQ.pickEncounter(area,DQ.act.target);
};

/* Every ordinary enemy can become a companion. Existing pets remain valid creatures. */
D.CREATURE_LEVELS=[0,25,100,300,750];
const bonusKinds=[['dmg',.02],['dr',.02],['coin',.03],['xpAll',.02],['speed',.02]];
/* Hunting studies every enemy. Collecting has one signature wild companion
   per region, selected for a clearly different silhouette and anatomy. */
const collectibleWild=new Set(['lanternmoth','thimblefox','tideglass','snowcoil','candletoad','cinderloom','prismkite','nullbloom']);
D.PETS.forEach(p=>p.collectible=true);
D.MONLIST.filter(m=>!m.boss).forEach((m,i)=>{
  const id='wild_'+m.id;if(D.PET[id])return;const [key,val]=bonusKinds[i%bonusKinds.length],bonus={[key]:val};
  const p={id,name:m.name,kind:'Wild beast',spr:'quad',mon:m.id,col:m.col,collectible:collectibleWild.has(m.id),src:{type:'hunt',mon:m.id},bonus,text:key==='dmg'?'+2% damage':key==='dr'?'−2% damage taken':key==='coin'?'+3% coins':key==='xpAll'?'+2% XP':'+2% task speed'};
  D.PETS.push(p);D.PET[id]=p;
});
DQ.collectiblePets=()=>D.PETS.filter(p=>p.collectible||S().pets.owned[p.id]);
const oldPetSprite=DQ.petSprite;DQ.petSprite=(p,size=48,cls='')=>p?.mon?DQ.artImage('creature',p.mon,size,cls,p.name):oldPetSprite(p,size,cls);
DQ.creatureAbilities=(id)=>{const p=D.PET[id],lv=DQ.petLevel(id);return [
  {lv:2,name:'Keen senses',text:'Its passive bonus becomes 25% stronger.'},
  {lv:3,name:'Battle instinct',text:'Its passive bonus becomes 50% stronger.'},
  {lv:5,name:'True bond',text:'Its passive bonus is doubled.'}
].map(a=>({...a,open:lv>=a.lv,creature:p}));};
DQ.creatureGainXp=m=>{const id=S().pets.active,o=id&&S().pets.owned[id],p=id&&D.PET[id];if(!o||!p)return;
  const before=DQ.petLevel(id);if(!Number.isFinite(o.xp))o.xp=D.CREATURE_LEVELS[Math.max(0,before-1)]||0;o.xp+=Math.max(1,1+m.cl/8);const after=DQ.petLevel(id);
  if(after>before){DQ.fxDirty();const unlocked=DQ.creatureAbilities(id).filter(a=>a.lv===after)[0];DQ.notify({kind:'unlock',key:'creature:'+id,title:`${p.name} reached level ${after}!`,text:unlocked?`Ability unlocked: ${unlocked.name} — ${unlocked.text}`:'Their companion bonus is stronger.',icon:'paw',col:p.col,sound:'perk',burst:true});DQ.emit('pets');}
};

UI.areaPanel=town=>{
  const active=DQ.act?.kind==='fight'&&DQ.act.area,qt=questTarget(),areas=D.AREAS[town]||[];
  return `<section class="panel activity-choices hunt-areas"><div class="phead"><div><span class="k">Hunting</span><h2>Choose an area</h2></div><small>${esc(D.TOWN[town].name)}</small></div>
    
    ${qt?`<div class="quest-hunt"><button type="button" class="enc-art" data-do="guide" data-a="${qt}" aria-label="${esc(D.MON[qt].name)}: open its field guide">${DQ.artImage('creature',qt,48,'',D.MON[qt].name)}</button><span><b>Quest target: ${esc(D.MON[qt].name)}</b></span><button class="btn primary" data-do="huntquest" data-a="${qt}">Track target</button></div>`:''}
    <div class="area-grid">${areas.map(a=>{const odds=DQ.encounterOdds(a),on=active===a.id;return `<article class="area-card ${on?'selected':''}"><div class="area-head"><div><b>${esc(a.name)}</b><small>Level ${Math.min(...odds.map(x=>x.monster.cl))}–${Math.max(...odds.map(x=>x.monster.cl))}</small></div><button class="btn ${on?'':'primary'}" data-do="huntarea" data-a="${a.id}">${on?'Retreat':'Explore'}</button></div><div class="encounter-list">${odds.map(x=>{const met=(S().beast.kills[x.id]||0)>0,nm=met?esc(x.monster.name):'Unknown creature';return `<button type="button" class="enc-row" data-do="guide" data-a="${x.id}" data-tip="text:${nm} · open its field guide" aria-label="${nm}: open its field guide">${DQ.monSprite(x.monster,64,met?'':'sil')}<span><b>${nm}</b><small>${x.pct>=45?'Common':x.pct>=20?'Uncommon':'Rare'} · ${x.pct}%</small></span></button>`;}).join('')}</div></article>`}).join('')}</div>
    <section data-reference="true"><h3>Hunting and creature collecting</h3><p>Hunt any enemy for field research. Each region has one signature wild companion to bond with.</p></section></section>`;
};
Object.assign(UI.DO,{
 huntarea:id=>{if(DQ.act?.kind==='fight'&&DQ.act.area===id)DQ.stopAct();else DQ.startHunt(id);UI.render(false);},
 huntquest:id=>{const a=DQ.areaForMonster(id);if(a)DQ.startHunt(a.id,id,true);UI.render(false);}
});
DQ.on('encounter',()=>{UI.renderHud();if(UI.view==='combat')UI.render(false);});
})();
