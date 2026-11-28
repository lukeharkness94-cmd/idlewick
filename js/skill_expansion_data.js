/* Action-earned skills. */
(() => {
const D=window.DQ.data;
for(const s of [
 {id:'hunting',name:'Hunting',col:'#c47a45',group:'gather',page:'hunting',actionReq:{kill:10},blurb:'Lay a lure on the hunting ground and take real game for its meat, hides, feathers and horn.'},
 {id:'exploration',name:'Exploration',col:'#55a99a',group:'gather',page:'exploration',actionReq:{catch:25,chop:25},blurb:'Map roads, habitats and hidden places up and down the old road.'},
 {id:'herbalism',name:'Herbalism',col:'#70ad62',group:'artisan',page:'brewery',actionReq:{harvest:20},blurb:'Turn gathered plants into remedies and powerful potions.'},
 {id:'enchanting',name:'Enchanting',col:'#a77be8',group:'artisan',page:'enchanting',actionReq:{craft:30,smith:20},blurb:'Bind runes and gems into equipment to strengthen its bonuses.'}
]){D.SKILLS.push(s);D.SK[s.id]=s;}
})();
