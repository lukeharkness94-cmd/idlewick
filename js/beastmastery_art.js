/* Original 32px beast silhouettes and structural evolved forms, in the shared pixel palette. */
(() => {
const Q=window.DQ,A=Q.pixelArt,D=Q.data;if(!A)return;
const {Spr,ramp,R}=A,eye=(s,x,y)=>{s.fix(x,y,'#291d2b');s.fix(x,y-1,'#fff3cf');};
const draw=(kind,evolved=false)=>{
 const s=Spr(32,32),fur=ramp({wolf:'#98aab6',boar:'#986b4b',owl:'#9583ad',bear:'#b7844d'}[kind]),dark=ramp('#574257'),cream=ramp('#e8d4a4'),gold=R.gold;
 if(kind==='owl'){
  if(evolved){s.poly([[12,18],[1,11],[3,23],[12,25]],fur);s.poly([[20,18],[30,10],[28,24],[20,26]],fur);}
  s.ell(16,20,8,10,fur);s.ell(16,12,9,8,fur);s.poly([[8,8],[6,2],[13,6]],fur);s.poly([[19,6],[26,2],[24,10]],fur);
  s.ell(12,12,4,5,cream);s.ell(20,12,4,5,cream);eye(s,12,12);eye(s,20,12);s.poly([[15,15],[18,15],[16,18]],gold);
  for(let y=20;y<28;y+=3){s.fix(13,y,dark.base);s.fix(18,y+1,dark.base);}s.rect(10,29,5,2,gold);s.rect(18,29,5,2,gold);
  if(evolved){s.poly([[11,5],[16,0],[21,5],[16,7]],gold);s.fix(16,3,'#e8f4ff');}
 }else{
  const bear=kind==='bear',boar=kind==='boar';
  s.ell(17,bear?20:21,bear?10:11,bear?9:7,fur);
  for(const x of bear?[8,22]:[9,22])s.rect(x,24,bear?5:3,7,dark);
  if(kind==='wolf'){s.poly([[24,20],[31,13],[30,24],[25,27]],fur);s.poly([[10,11],[6,2],[4,14]],fur);s.poly([[16,11],[15,3],[20,13]],fur);}
  if(boar){s.poly([[23,17],[29,12],[30,18],[26,21]],dark);for(let x=11;x<25;x+=3)s.poly([[x,16],[x-1,evolved?7:12],[x+3,16]],dark);}
  if(bear){s.ell(9,8,4,4,fur);s.ell(21,8,4,4,fur);s.ell(9,8,2,2,dark);s.ell(21,8,2,2,dark);}
  s.ell(13,15,bear?9:8,bear?8:7,fur);s.ell(boar?6:8,19,boar?5:4,3,cream);s.fix(boar?3:5,18,dark.out);eye(s,10,13);eye(s,17,13);
  if(boar){s.poly([[5,23],[1,evolved?13:17],[3,23]],cream);s.poly([[11,24],[13,evolved?15:19],[14,24]],cream);}
  if(evolved&&kind==='wolf'){s.poly([[18,13],[25,9],[23,16],[28,18],[23,22],[26,26],[18,25]],cream);s.ell(14,23,3,3,gold);}
  if(evolved&&bear){s.poly([[5,21],[1,15],[8,18]],cream);s.poly([[23,18],[30,14],[28,23]],cream);s.ell(17,24,5,3,gold);s.fix(17,23,'#fff3cf');}
 }
 return s;
};
for(const [id,k]of [['bond_wolf','wolf'],['bond_boar','boar'],['bond_owl','owl'],['bond_bear','bear']]){A.PET_SPECS[id]=()=>draw(k);A.PET_SPECS['evolved:'+id]=()=>draw(k,true);}
/* Legacy companions retain their anatomy and acquire a visible bonded mantle, crest or flight feathers. */
Q.registerBondArt=()=>{for(const p of D.PETS){if(D.BEAST_SPECIES[p.id]||A.PET_SPECS['evolved:'+p.id])continue;const id=p.id,base=()=>A.creatureSprite(A.hasCreature(id)?id:p.mon);A.PET_SPECS['evolved:'+id]=()=>{const s=base();if(!s)return null;const g=R.gold;const bird=/owl|bird|moth|kite|chick/i.test(p.kind+' '+p.name);if(bird){s.poly([[3,17],[0,9],[7,15]],g);s.poly([[25,15],[31,8],[29,20]],g);}else{s.poly([[9,24],[6,16],[12,20],[16,18],[22,21],[25,16],[23,25]],g);}s.fix(16,20,'#fff3cf');return s;};}};Q.registerBondArt();
const item0=A.itemSprite;
A.itemSprite=id=>{if(id!=='rune_trap')return item0(id);const s=Spr(16,16),iron=ramp('#708c9b'),blue=ramp('#6ad2d5');s.poly([[2,7],[7,3],[14,7],[14,13],[7,15],[2,12]],iron);for(const x of [4,7,10,13])s.line(x,7,x,12,blue);s.poly([[5,2],[8,0],[11,2],[8,5]],blue);s.fix(8,2,'#fff3cf');s.line(2,8,13,8,null,R.gold.base);return s;};
A.itemUrl=id=>A.url('item:'+id,()=>A.itemSprite(id));
})();
