/* Eight tower identities, using the existing enemy clock, specials, weaknesses and status effects. */
(() => {
const Q=window.DQ,D=Q.data,UI=Q.ui,{esc}=Q;
const profiles={
 willowbrook:{clock:1500,every:5,mult:.9,weak:['crush'],resist:[],threat:'A swarm of quick ordinary bites; the fifth attack calls the swarm.',answer:'Defence, ordinary-hit protection or reflecting damage help. Food and a fast weapon also work.'},
 mossbarrow:{clock:2400,every:4,mult:1.75,weak:['fire','crush'],resist:['stab'],threat:'A slow duel with a heavy cleave every fourth attack.',answer:'Brace, a shield response or special protection soften the cleave. Fire or a hammer shortens the duel.'},
 saltmere:{clock:2100,every:4,mult:1.15,freeze:1,weak:['storm'],resist:['fire'],threat:'Every fourth beam costs you your next attack unless interrupted.',answer:'Shield Bash or Arcane Ward can stop a beam; steady food or storm damage keeps you in the fight.'},
 ironpeak:{clock:2400,every:5,mult:1.8,weak:['fire'],resist:['frost'],threat:'A long build-up, then an avalanche every fifth attack.',answer:'Brace or special protection helps most. Fire, healing and a stronger defence are viable preparations too.'},
 gloomfen:{clock:2300,every:4,mult:1.05,hex:3,weak:['fire','slash'],resist:['aether'],threat:'Every fourth rite leaves three attacks of lingering damage.',answer:'Interrupting or absorbing the rite prevents the curse. Sustained food, healing or a quick finish can carry you through.'},
 emberfall:{clock:1900,every:3,mult:1.35,weak:['frost'],resist:['fire'],threat:'Frequent quenching blows; frost dampens their heat.',answer:'Frost cuts special damage. Brace, a special-guarding companion or sufficient meals are alternatives.',frostMult:.65},
 skyreach:{clock:1900,every:4,mult:1.2,weak:['stab','storm'],resist:['crush'],threat:'Fast ordinary attacks and a great peal every fourth blow.',answer:'Ranged positioning softens the peal; ordinary-hit protection, defence and Brace offer other approaches.',rangedMult:.65},
 hollow:{clock:2000,every:3,mult:1.4,weak:['aether'],resist:['slash'],threat:'A long fight with an eclipse every third blow.',answer:'Sustained healing and special responses matter. Aether, lifesteal or a general-purpose strong build can finish it.'}
};
D.TOWER_PROFILES=profiles;
for(const [town,p]of Object.entries(profiles)){
 const T=D.TOWERS[town];if(!T)continue;T.threat=p.threat;T.preparation=p.answer;
 for(const [i,id]of T.floors.entries()){const m=D.MON[id];m.attackMs=i===T.floors.length-1?p.clock:Math.round((2000+p.clock)/2);m.preparation=p.answer;
 if(i===T.floors.length-1){Object.assign(m.mini.special,{every:p.every,mult:p.mult,freeze:p.freeze||0,hex:p.hex||0,frostMult:p.frostMult||1,rangedMult:p.rangedMult||1});D.WEAK[id]={weak:p.weak,resist:p.resist};D.LORE[id].note=p.threat+' '+p.answer;}
 }
}
/* More distinctive support roles trade some direct support damage for an existing signature behaviour. */
D.BEAST_ROLES={
 bond_wolf:{role:'Striker',key:null,support:1,text:'Critical hits and the strongest direct support. A useful everyday companion.'},
 bond_boar:{role:'Disruptor',key:'heckle',support:.7,text:'Enemy skips its second attack each fight. Keeps its coin bonus; less direct support than the chimera.'},
 bond_owl:{role:'Research partner',key:'night',support:.7,text:'Research runs 10% faster while assigned. Keeps its XP bonus and offers modest combat support.'},
 bond_bear:{role:'Special guard',key:'cold',support:.65,text:'Special attacks deal 20% less damage. Keeps its boss-damage bonus; lower direct support.'}
};
for(const [id,r]of Object.entries(D.BEAST_ROLES)){
 if(r.key&&D.PET[id])D.TRICKS[id]={key:r.key,name:r.role,text:r.text};
 if(D.PET[id])D.PET[id].text=r.text;
}
const job0=Q.beastJob;if(job0)Q.beastJob=id=>D.BEAST_ROLES[id]?{...job0(id),role:D.BEAST_ROLES[id].role,fit:D.BEAST_ROLES[id].text}:job0(id);
const text0=Q.beastPassiveText;if(text0)Q.beastPassiveText=id=>text0(id)+(D.BEAST_ROLES[id]?' · '+D.BEAST_ROLES[id].text:'');
const page0=UI.V.tower;UI.V.tower=()=>{const h=page0(),T=D.TOWERS[Q.S.town];return T?h.replace('<ol class="tw-ladder">',`<div class="tower-preparation"><b>${esc(T.threat)}</b><p>${esc(T.preparation)}</p></div><ol class="tw-ladder">`):h;};
})();
