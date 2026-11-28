/* Original 32px beast silhouettes and structural evolved forms, in the shared pixel palette. */
(() => {
const Q=window.DQ,A=Q.pixelArt,D=Q.data;if(!A)return;
const {Spr,ramp,R}=A,eye=(s,x,y)=>{s.fix(x,y,'#291d2b');s.fix(x,y-1,'#fff3cf');};
/* The four bond species are mythical since 28 Nov 2026 (owner: companions are mythical, no animal in both skills): a
   chimera cub, a briar fae, a dusk sylph and an amber golem, drawn with pixel_creatures.js's builders so each has a
   front and a side view; the evolved form adds its own crest, wings or crown so its silhouette changes too. */
const B=A.BUILD||{},gold=()=>R.gold;
const BOND={
 bond_wolf:ev=>{const s=B.quad({fur:ev?'#e8a050':'#c8603a',dark:'#7a2a1e',mane:true,horns:true,hornCol:'#efe2c4',tail:'thin',ears:'pointy',glow:'#ffd060',big:ev,plates:'#8a3a2a',cloud:ev});if(ev){s.poly([[9,6],[13,0],[15,6]],gold());s.poly([[17,5],[21,0],[22,6]],gold());}return s;},
 bond_boar:ev=>{const s=B.treant({col:ev?'#5a4a2a':'#4a3a22',leaf:ev?'#a8d060':'#6a9a3a',glow:'#ff8ab0'});if(ev){s.poly([[2,12],[0,2],[7,9]],gold());s.poly([[30,12],[31,2],[25,9]],gold());}return s;},
 bond_owl:ev=>{const s=B.spectral({col:ev?'#c8b8f0':'#8a7ab8',eyes:'#fff6c0'});if(ev){s.poly([[8,14],[0,6],[3,20]],gold());s.poly([[24,14],[31,6],[29,20]],gold());s.poly([[12,4],[16,0],[20,4]],gold());}return s;},
 bond_bear:ev=>{const s=B.golem({col:ev?'#f0b840':'#d8a040'});if(ev){s.poly([[11,3],[13,0],[16,2],[19,0],[21,3]],gold());s.ell(16,15,2,2,ramp('#fff3cf'));}return s;}
};
for(const [id,f]of Object.entries(BOND)){A.PET_SPECS[id]=()=>f(false);A.PET_SPECS['evolved:'+id]=()=>f(true);}
/* Legacy companions retain their anatomy and acquire a visible bonded mantle, crest or flight feathers. */
Q.registerBondArt=()=>{for(const p of D.PETS){if(D.BEAST_SPECIES[p.id]||A.PET_SPECS['evolved:'+p.id])continue;const id=p.id,base=()=>A.creatureSprite(A.hasCreature(id)?id:p.mon);A.PET_SPECS['evolved:'+id]=()=>{const s=base();if(!s)return null;const g=R.gold;const bird=/owl|bird|moth|kite|chick/i.test(p.kind+' '+p.name);if(bird){s.poly([[3,17],[0,9],[7,15]],g);s.poly([[25,15],[31,8],[29,20]],g);}else{s.poly([[9,24],[6,16],[12,20],[16,18],[22,21],[25,16],[23,25]],g);}s.fix(16,20,'#fff3cf');return s;};}};Q.registerBondArt();
const item0=A.itemSprite;
A.itemSprite=id=>{if(id!=='rune_trap')return item0(id);const s=Spr(16,16),iron=ramp('#708c9b'),blue=ramp('#6ad2d5');s.poly([[2,7],[7,3],[14,7],[14,13],[7,15],[2,12]],iron);for(const x of [4,7,10,13])s.line(x,7,x,12,blue);s.poly([[5,2],[8,0],[11,2],[8,5]],blue);s.fix(8,2,'#fff3cf');s.line(2,8,13,8,null,R.gold.base);return s;};
A.itemUrl=id=>A.url('item:'+id,()=>A.itemSprite(id));
})();
