/* Distinct silhouettes and materials for every resource and inventory item.
   Related items share a visual language, never an interchangeable drawing. */
(() => {
const Q=window.DQ,D=Q.data,INK='#252424',CREAM='#fff0cf';
const mix=(a,b,t)=>'#'+[1,3,5].map(i=>Math.round(parseInt(a.slice(i,i+2),16)*(1-t)+parseInt(b.slice(i,i+2),16)*t).toString(16).padStart(2,'0')).join('');
const hi=c=>mix(c,'#ffffff',.35),lo=c=>mix(c,'#172327',.35);
const star=(p,x,y,c,r=3)=>{p.line(x-r,y,x+r,y,c);p.line(x,y-r,x,y+r,c);p.dot(x-1,y-1,c);};
const eye=(p,x,y)=>{p.rect(x,y,2,2,INK);p.dot(x,y,CREAM);};
const woods=['normal','oak','willow','maple','yew','magic','birch','elder','gloomwood'];
const leaves={normal:['#416d3b','#79a54c'],oak:['#345b35','#6e9345'],willow:['#4d7759','#9cba78'],maple:['#a94533','#ec9b43'],yew:['#234e45','#4d8b66'],magic:['#614993','#b49bdf'],birch:['#76964b','#c0ca78'],elder:['#3b7464','#90c5ae'],gloomwood:['#3e3557','#877393']};
function tree(p,id){
 const [shade,c]=leaves[id]||leaves.normal,bark=id==='birch'?'#e1d7bc':id==='gloomwood'?'#514654':id==='elder'?'#7f8a73':'#8b5b3d';
 const trunk=(x,w,top)=>{p.poly([[x,top],[x+w,top-1],[x+w,37],[x+w+5,43],[x+2,42],[x-6,44],[x,36]],lo(bark));p.rect(x+1,top,w-2,39-top,bark);p.line(x+1,top+3,x+1,37,hi(bark));};
 const tuft=(x,y,rx,ry)=>{p.ellipse(x,y,rx,ry,shade);p.ellipse(x-1,y-2,rx-2,ry-2,c);p.line(x-rx+3,y-3,x-2,y-ry+2,hi(c));};
 if(id==='normal'){trunk(21,6,17);p.line(23,27,12,17,bark);p.line(25,25,33,13,bark);for(const a of [[13,20,9,7],[19,11,9,8],[30,13,10,8],[31,23,10,7]])tuft(...a);}
 if(id==='oak'){trunk(18,12,17);p.line(20,30,10,17,bark);p.line(27,30,38,18,bark);for(const a of [[10,20,8,8],[12,12,9,7],[24,8,11,7],[36,13,9,8],[36,23,9,7],[23,20,12,10]])tuft(...a);p.ellipse(24,33,3,4,lo(bark));for(const x of [12,33]){p.ellipse(x,24,2,3,'#b68b47');p.rect(x-2,21,5,2,'#725735');}}
 if(id==='willow'){trunk(22,5,16);p.line(23,25,9,12,bark);p.line(25,26,38,13,bark);for(const a of [[13,13,10,7],[24,8,12,6],[36,14,9,7]])tuft(...a);for(const [x,y,len]of [[4,14,20],[9,17,21],[15,18,14],[32,16,22],[38,15,22],[43,16,16]]){p.line(x,y,x-1,y+len,shade);for(let j=0;j<len;j+=4){p.line(x,y+j,x+2,y+j+3,c);p.dot(x-2,y+j+2,hi(c));}}}
 if(id==='maple'){trunk(21,7,17);for(const [x,y]of [[12,15],[23,8],[35,14],[14,25],[32,25]]){p.poly([[x,y-7],[x+3,y-3],[x+7,y-4],[x+5,y],[x+8,y+3],[x+2,y+5],[x,y+8],[x-3,y+4],[x-8,y+2],[x-5,y-1],[x-6,y-5],[x-2,y-3]],shade);p.poly([[x,y-5],[x+2,y],[x+5,y+2],[x,y+5],[x-5,y+1],[x-2,y]],c);p.line(x,y,x,y+5,hi(c));}p.poly([[36,40],[41,38],[40,44],[35,43]],c);}
 if(id==='yew'){trunk(21,7,11);for(const [y,w]of [[5,8],[13,13],[22,18]]){p.poly([[24,y-4],[24+w,y+10],[24-w,y+10]],shade);p.poly([[24,y-2],[24+w-4,y+7],[24-w+2,y+7]],c);p.line(24-w+3,y+7,24-2,y+5,hi(c));}for(const [x,y]of [[13,25],[32,28],[26,16],[19,22]]){p.ellipse(x,y,2,2,'#be5149');p.dot(x,y,'#efd2a0');}}
 if(id==='birch'){trunk(16,4,10);trunk(28,4,8);p.line(19,25,11,16,bark);p.line(30,22,38,12,bark);for(const a of [[11,13,6,7],[19,7,6,6],[29,7,6,6],[37,13,6,7],[23,17,7,6]])tuft(...a);for(const x of [17,29])for(let y=22;y<39;y+=5)p.rect(x,y,3,1,'#625b4b');}
 if(id==='magic'){trunk(21,6,17);p.line(23,31,12,22,bark);p.line(25,24,35,15,bark);for(const a of [[12,18,8,7],[22,10,8,7],[34,16,8,7],[24,22,10,7]])tuft(...a);for(const [x,y]of [[10,17],[23,7],[35,14]]){p.poly([[x,y-5],[x+3,y],[x,y+7],[x-3,y]],'#c5b3f0');p.line(x,y-3,x,y+3,CREAM);}star(p,38,4,CREAM,2);p.line(24,29,22,32,'#c5b3f0');p.line(22,32,25,35,'#c5b3f0');}
 if(id==='elder'){trunk(18,11,14);p.line(20,25,6,12,bark);p.line(26,25,41,12,bark);for(const a of [[8,14,6,6],[17,8,8,6],[30,8,8,6],[40,16,6,6],[24,18,11,7]])tuft(...a);for(const [x,y]of [[9,12],[19,6],[34,11],[29,20]]){for(const dx of [-2,0,2])p.ellipse(x+dx,y+dx%3,1,1,CREAM);}p.poly([[19,32],[14,40],[9,43],[19,42],[24,36],[30,43],[39,42],[30,37],[28,30]],bark);p.line(22,22,21,29,hi(bark));}
 if(id==='gloomwood'){p.poly([[17,44],[23,31],[19,25],[21,15],[16,8],[23,13],[26,4],[28,15],[36,9],[31,21],[28,31],[34,43],[26,40],[24,44]],bark);p.line(24,32,25,18,hi(bark));for(const a of [[11,17,7,6],[21,8,7,5],[34,15,8,6],[35,26,6,5]])tuft(...a);p.ellipse(24,28,3,4,'#221e31');p.dot(22,27,'#b6a7d6');p.dot(26,27,'#b6a7d6');for(const [x,y]of [[7,39],[38,40]]){p.rect(x,y,2,4,'#a5a38b');p.ellipse(x+1,y,4,2,'#8d689c');}}
 p.line(12,44,15,41,'#92a860');p.line(34,44,37,42,'#92a860');
}
const fishDesign={
 sardine:{body:[[9,24],[18,19],[34,20],[41,24],[34,28],[17,28]],tail:[[12,24],[3,17],[4,31]],c:'#83b3c1',belly:'#e0e9ce',fin:[[23,20],[26,15],[30,20]],pattern:'stripe'},
 herring:{body:[[9,24],[17,17],[32,17],[42,24],[34,31],[18,31]],tail:[[12,24],[2,15],[3,33]],c:'#77999b',belly:'#cdd6ad',fin:[[19,18],[23,12],[29,17]],pattern:'gills'},
 trout:{body:[[9,25],[17,18],[34,18],[42,23],[38,29],[20,32]],tail:[[12,25],[3,20],[2,34]],c:'#819b67',belly:'#d6c798',fin:[[19,19],[22,12],[28,18]],pattern:'spots'},
 salmon:{body:[[8,27],[15,19],[27,15],[36,19],[43,22],[40,29],[19,33]],tail:[[12,27],[2,21],[2,36]],c:'#8fa3aa',belly:'#d5b1a1',fin:[[21,17],[26,10],[31,17]],pattern:'pink'},
 tuna:{body:[[9,25],[18,14],[32,14],[43,23],[39,30],[23,35]],tail:[[12,25],[4,12],[6,25],[2,39]],c:'#527f9d',belly:'#c6d4ce',fin:[[24,15],[29,4],[32,16]],pattern:'yellow'},
 swordfish:{body:[[8,26],[19,20],[31,19],[36,22],[47,20],[37,25],[30,29],[17,31]],tail:[[12,26],[3,17],[5,27],[2,36]],c:'#598da6',belly:'#b9d0d1',fin:[[18,21],[24,8],[26,20]],pattern:'sword'},
 monkfish:{body:[[10,28],[14,19],[25,14],[37,18],[43,29],[38,36],[22,37]],tail:[[16,28],[2,22],[5,34]],c:'#aa9170',belly:'#d3bf8c',fin:[[17,21],[15,11],[27,17]],pattern:'mouth'},
 shark:{body:[[7,26],[18,21],[29,20],[40,24],[43,29],[34,31],[18,31]],tail:[[12,26],[3,10],[6,26],[1,38]],c:'#728e9b',belly:'#d6d9c6',fin:[[21,21],[29,7],[30,22]],pattern:'shark'},
 anglerfish:{body:[[11,27],[15,17],[28,14],[39,20],[43,29],[37,39],[20,38]],tail:[[15,28],[3,22],[5,36]],c:'#665278',belly:'#bba19b',fin:[[18,20],[14,12],[26,16]],pattern:'lure'},
 carp:{body:[[10,25],[17,14],[31,13],[41,22],[39,31],[28,37],[16,33]],tail:[[13,26],[3,18],[5,32]],c:'#be974e',belly:'#e1cb8e',fin:[[16,16],[20,9],[33,12],[34,18]],pattern:'scales'},
 pike:{body:[[7,26],[17,22],[33,21],[44,24],[45,27],[34,30],[15,31]],tail:[[11,27],[2,19],[3,35]],c:'#64886a',belly:'#c9c79b',fin:[[14,23],[17,15],[23,22]],pattern:'bars'},
 skyfin:{body:[[10,25],[21,20],[33,21],[41,25],[31,31],[18,29]],tail:[[14,25],[4,20],[2,30]],c:'#86c6de',belly:'#e8e9cf',fin:[[18,22],[11,4],[23,9],[30,22]],pattern:'wings'}
};
/* Cooking adds warm highlights and grill marks without erasing the species palette. */
const cookedFish={
 shrimp:'#d97955',lobster:'#b9483d',voideel:'#75537e',sardine:'#7198a3',herring:'#718889',
 trout:'#8b8757',salmon:'#b77d78',tuna:'#526f86',swordfish:'#557f90',monkfish:'#9a7858',
 shark:'#687f88',anglerfish:'#70576b',carp:'#ad843d',pike:'#637b55',skyfin:'#75a9ba'
};
function fish(p,id,cooked=false){
 id=id.replace(/^raw_/,'');const warm=cooked?cookedFish[id]:null;
 if(id==='shrimp'){const c=warm||'#dca28b';p.poly([[35,12],[27,9],[18,14],[13,24],[18,34],[28,37],[36,30],[30,27],[26,31],[21,27],[22,21],[28,17],[35,19]],lo(c));p.poly([[33,13],[26,12],[20,17],[17,24],[21,31],[27,33],[31,30],[26,28],[23,29],[20,24],[24,19],[33,17]],c);for(const [x,y]of [[18,21],[18,26],[22,31]])p.line(x,y,x+5,y+2,hi(c));p.line(30,15,42,7,c);p.line(32,16,44,13,c);p.poly([[33,28],[42,28],[38,36],[31,34]],c);eye(p,31,14);return;}
 if(id==='lobster'){const c=warm||'#846a84';p.ellipse(25,27,7,11,lo(c));p.ellipse(24,25,6,10,c);p.poly([[20,33],[28,33],[32,42],[25,40],[19,43],[17,39]],c);for(const sx of [-1,1]){p.line(24+sx*5,24,24+sx*11,15,c);p.ellipse(24+sx*13,11,5,8,c);p.line(24+sx*13,4,24+sx*12,12,lo(c));for(let j=0;j<3;j++)p.line(24+sx*6,25+j*4,24+sx*13,28+j*4,c);}for(let y=27;y<37;y+=3)p.line(20,y,28,y,hi(c));p.line(22,17,19,6,c);p.line(27,17,30,6,c);eye(p,21,17);eye(p,27,17);return;}
 if(id==='voideel'){const c=warm||'#615180';p.poly([[3,32],[9,20],[17,16],[26,23],[32,25],[39,19],[44,22],[43,28],[34,33],[24,31],[16,24],[12,25],[9,35],[3,41]],lo(c));p.poly([[5,33],[11,21],[16,19],[25,26],[33,29],[40,23],[42,25],[34,31],[25,29],[16,22],[11,24],[8,35],[4,38]],c);for(const [x,y]of [[14,20],[23,26],[33,29]])p.dot(x,y,'#bfa5ec');eye(p,40,23);p.line(12,18,17,13,'#ac9bce');return;}
 const d=fishDesign[id]||fishDesign.sardine,c=warm||d.c;
 p.poly(d.tail,lo(c));p.poly(d.fin,lo(c));p.poly(d.body,c);
 p.line(16,27,33,28,cooked?'#e6b779':d.belly);p.line(17,22,31,20,hi(c));
 p.poly([[24,28],[28,36],[31,28]],lo(c));
 const e=id==='monkfish'||id==='anglerfish'?30:36;eye(p,e,id==='pike'?24:22);
 p.line(e-3,25,e-4,29,lo(c));
 if(d.pattern==='stripe')p.line(12,25,33,24,'#394f6c');
 if(d.pattern==='gills')for(let x=17;x<29;x+=4)p.line(x,20,x-2,27,hi(c));
 if(d.pattern==='spots')for(const [x,y]of [[17,23],[23,21],[28,25],[19,28],[31,22]]){p.dot(x,y,'#4b4e39');p.dot(x+1,y+1,'#df9c83');}
 if(d.pattern==='pink')p.line(14,26,33,23,'#d59191');
 if(d.pattern==='yellow'){p.line(17,17,12,10,'#d9b44e');for(let x=12;x<22;x+=3)p.dot(x,30,'#e3c568');}
 if(d.pattern==='shark'){for(let x=29;x<35;x+=2)p.line(x,23,x-1,27,lo(c));p.line(36,29,41,28,INK);}
 if(d.pattern==='mouth'||d.pattern==='lure'){p.poly([[29,27],[40,26],[36,34],[28,33]],INK);for(let x=30;x<39;x+=3)p.line(x,27,x+1,30,CREAM);}
 if(d.pattern==='lure'){p.line(24,16,23,6,'#9e8baa');p.line(23,6,34,4,'#9e8baa');p.line(34,4,37,9,'#9e8baa');p.ellipse(37,10,3,3,'#e7dc91');}
 if(d.pattern==='scales'){for(let y=21;y<31;y+=4)for(let x=16;x<31;x+=5)p.line(x,y,x+2,y+1,hi(c));p.line(39,27,44,32,'#a38859');p.line(37,29,40,34,'#a38859');}
 if(d.pattern==='bars')for(let x=15;x<32;x+=5)p.line(x,24,x+1,28,'#c1c797');
 if(d.pattern==='wings'){p.poly([[20,25],[7,37],[19,40],[30,28]],'#b9dce0');p.line(20,28,12,36,'#7baac5');p.line(20,17,17,8,CREAM);star(p,40,11,'#e2e6be',2);}
 if(cooked)for(const x of [18,24,30])p.line(x,23,x+2,27,'#674432');
}
function log(p,id){
 const n=woods.indexOf(id),c=id==='birch'?'#ded5b5':id==='magic'?'#8874aa':id==='gloomwood'?'#62536d':id==='elder'?'#799b84':['#9d7548','#785436','#9c9170','#b3794d','#775848'][n]||'#8a6848';
 const w=[9,13,7,10,8,9,6,12,10][n]||9;
 p.poly([[7,22],[28,9],[41,19],[20,33]],lo(c));p.poly([[8,21],[28,10],[40,19],[19,30]],c);p.ellipse(18,31,w,w-2,lo(c));p.ellipse(17,30,w-2,w-4,'#d7b980');p.ellipse(17,30,w-5,Math.max(1,w-7),'#9e794e');p.dot(17,30,'#e8cda0');
 p.line(12,22,29,12,hi(c));p.line(23,25,35,18,lo(c));
 if(id==='oak'){p.line(28,16,30,6,c);p.ellipse(30,6,4,2,'#d7b980');p.line(16,29,21,34,'#7b5b3f');}
 if(id==='willow'){p.poly([[29,14],[39,8],[42,10],[34,20]],c);p.line(11,22,31,13,lo(c));}
 if(id==='birch')for(const [x,y]of [[17,17],[28,13],[32,21]])p.line(x,y,x+5,y+1,'#514c42');
 if(id==='maple'){p.line(29,14,35,7,c);p.poly([[34,6],[38,3],[41,8],[37,11]],'#dc8050');}
 if(id==='yew'){p.ellipse(30,18,3,2,'#4b4033');p.line(25,13,31,9,'#4e805b');}
 if(id==='magic'){p.line(26,17,29,17,'#d9c5f1');p.line(29,17,27,22,'#d9c5f1');star(p,37,9,'#e5d4ff',2);}
 if(id==='elder'){p.ellipse(26,15,4,2,'#a4b46f');p.line(17,30,20,27,'#f5dfa3');p.ellipse(35,20,3,2,'#c4cf90');}
 if(id==='gloomwood'){p.line(23,20,30,13,'#332c43');p.line(30,13,31,18,'#332c43');p.ellipse(26,21,2,1,'#b2a5cf');p.poly([[37,16],[43,12],[41,21]],c);}
}
const oreIds=['copper','tin','iron','coal','gold','mithril','adamant','runite','silver','astralite','voidstone'];
function ore(p,id,node=false){
 const n=oreIds.indexOf(id),c=D.ITEMS['ore_'+id]?.col||'#879da1';
 const shapes=[[[6,33],[12,18],[26,13],[40,25],[36,39],[17,41]],[[9,34],[8,20],[23,12],[35,16],[42,34],[29,41]],[[5,36],[15,13],[30,15],[42,36],[28,41]],[[6,36],[10,22],[17,13],[24,19],[31,12],[41,27],[38,40]],[[7,34],[16,22],[17,11],[30,15],[41,32],[31,40]],[[7,34],[13,16],[23,23],[32,8],[39,31],[32,40]],[[5,36],[10,21],[20,10],[31,20],[41,18],[38,40]],[[8,38],[7,20],[18,14],[27,20],[36,12],[43,34],[29,42]],[[7,35],[13,19],[30,10],[39,23],[34,38]],[[7,37],[15,25],[13,12],[23,19],[29,5],[35,24],[43,36]],[[8,35],[13,17],[25,10],[38,19],[40,37],[24,43]]];
 const pts=shapes[n]||shapes[0],base=node?'#677478':c;
 p.poly(pts,lo(base));p.poly(pts.map(([x,y])=>[24+(x-24)*.8,26+(y-26)*.8-2]),base);p.line(pts[1][0],pts[1][1],pts[2][0],pts[2][1],hi(base));
 if(node){for(const [j,[x,y]]of [[15,27],[27,22],[32,33]].entries()){const r=3+(n+j)%3;p.poly([[x,y-r],[x+r,y],[x+1,y+r],[x-r,y+1]],c);p.line(x-r+1,y,x,y-r+1,hi(c));}}
 else {p.poly([[14,24],[23,17],[27,28],[18,35]],hi(c));p.line(24,21,31,32,lo(c));}
 if(id==='coal')for(const [x,y]of [[14,27],[24,22],[29,35]])p.line(x,y,x+3,y+1,'#858994');
 if(id==='gold'){p.ellipse(24,29,5,3,'#e9ba53');p.dot(22,27,CREAM);}
 if(id==='astralite')for(const [x,y]of [[17,15],[29,9],[35,30]])star(p,x,y,'#e8e3ff',2);
 if(id==='voidstone'){p.line(19,15,25,25,'#c6a0e2');p.line(25,25,21,34,'#c6a0e2');p.line(25,25,34,29,'#9b7cc7');}
}
function crop(p,id){
 const c=D.ITEMS['crop_'+id]?.col||'#93a75b';
 if(id==='potato'){for(const [x,y,r]of [[17,31,10],[31,25,9]]){p.ellipse(x,y,r,r-3,lo(c));p.ellipse(x-1,y-2,r-1,r-4,c);for(let j=0;j<3;j++)p.dot(x-4+j*4,y+j%2,lo(c));}return;}
 if(id==='onion'){p.poly([[24,9],[28,19],[35,26],[35,35],[28,41],[17,40],[11,33],[13,25],[21,18]],c);p.line(23,19,20,36,hi(c));p.line(27,20,30,35,lo(c));p.line(23,17,18,5,'#62884a');p.line(25,16,30,5,'#7b9b4f');p.line(22,41,19,44,'#b5a27e');return;}
 if(id==='cabbage'){p.ellipse(24,28,16,14,lo(c));for(const [x,y]of [[16,28],[24,22],[32,28],[24,33]]){p.ellipse(x,y,8,8,c);p.line(x-4,y-3,x+3,y+4,hi(c));}p.ellipse(24,25,6,6,hi(c));p.line(22,22,25,28,lo(c));return;}
 if(id==='wheat'){for(const [x,y]of [[16,13],[25,7],[34,16]]){p.line(x,y,x-7,42,'#ab8b47');for(let i=0;i<4;i++){p.ellipse(x-i,y+3*i,3,2,'#ddbc64');p.line(x-i-2,y+3*i,x-i-5,y+3*i-4,'#ead08a');}}p.rect(13,33,13,3,'#8d6441');return;}
 if(id==='strawberry'){p.poly([[10,20],[18,14],[31,14],[39,21],[34,34],[24,43],[14,33]],c);p.poly([[24,18],[12,14],[20,13],[23,7],[27,13],[36,12],[31,19]],'#628649');p.line(16,22,14,27,hi(c));for(const [x,y]of [[21,24],[29,23],[18,30],[27,32],[24,37]])p.dot(x,y,'#e9cd7a');return;}
 if(id==='pumpkin'){for(const [x,rx]of [[13,7],[34,7],[19,8],[28,8],[24,7]]){p.ellipse(x,29,rx,13,lo(c));p.ellipse(x,27,rx-1,11,c);}p.line(23,17,25,7,'#6e8049');p.line(25,7,31,9,'#6e8049');p.line(20,19,18,31,hi(c));return;}
 if(id==='goldleaf'){for(const [x,y]of [[16,26],[30,17],[30,34]]){p.poly([[24,39],[x-7,y],[x+3,y-9],[x+7,y],[24,39]],c);p.line(24,39,x,y-4,'#f3dc83');}p.line(24,42,24,13,'#8e7b46');return;}
 if(id==='sunbloom'){p.rect(23,24,3,19,'#5b8248');p.ellipse(16,34,7,3,'#7b9c4e');for(let i=0;i<8;i++){const a=i*Math.PI/4;p.ellipse(25+Math.cos(a)*10,17+Math.sin(a)*10,4,4,c);}p.ellipse(25,17,7,7,'#806441');p.ellipse(24,16,4,4,'#b99145');return;}
 if(id==='moonmelon'){p.ellipse(24,28,17,14,c);for(const x of [14,22,30])p.line(x,17,x-3,37,lo(c));p.ellipse(30,24,7,8,'#d8e4b9');p.ellipse(33,21,6,7,c);p.line(23,15,29,8,'#698653');return;}
 if(id==='starfruit'){p.poly([[24,6],[29,19],[44,19],[33,28],[37,42],[24,34],[11,42],[15,28],[4,19],[19,19]],c);p.poly([[24,10],[24,29],[9,21],[21,21]],hi(c));p.line(24,29,35,37,lo(c));p.dot(24,24,CREAM);return;}
}
function food(p,id){
 p.ellipse(24,37,20,6,'#a59b85');p.ellipse(24,35,18,5,'#e4dab8');
 if(D.FISH_IDS.includes(id)){fish(p,id,true);return;}
 if(id==='bread'){p.poly([[8,29],[9,21],[16,14],[31,12],[39,20],[40,31],[27,36],[12,35]],'#a9703e');p.ellipse(24,23,15,10,'#d6a45f');for(const x of [15,23,31])p.line(x,17,x-3,24,'#f5d49b');return;}
 if(id==='baked_potato'){p.ellipse(24,26,16,10,'#9b784e');p.poly([[12,24],[23,19],[36,24],[25,29]],'#e9cf8e');p.rect(21,21,8,5,'#efd781');p.line(18,24,31,25,'#fff0bc');p.dot(17,26,'#6c944f');return;}
 if(id==='veg_stew'){p.poly([[7,25],[41,25],[36,38],[14,38]],'#916c49');p.ellipse(24,25,17,7,'#b47c43');for(const [x,y,c]of [[16,24,'#de9a53'],[27,22,'#87a253'],[32,27,'#ddbc7c'],[22,29,'#a2aa67']])p.rect(x,y,5,3,c);p.line(13,15,14,8,'#c4bda5');p.line(29,14,30,7,'#c4bda5');return;}
 if(id==='omelette'){p.poly([[8,30],[11,18],[22,15],[37,21],[41,31],[28,34]],'#e4bb5e');p.poly([[11,28],[21,18],[36,23],[39,29],[25,31]],'#f0d486');for(const [x,y]of [[18,23],[28,25],[23,28]])p.rect(x,y,3,2,'#839655');return;}
 if(id==='honey_roast'){p.ellipse(23,26,14,10,'#a35b38');p.ellipse(22,24,11,8,'#c98a4e');p.line(29,28,39,20,'#e9d7a6');p.ellipse(39,19,3,3,'#e9d7a6');p.line(15,22,26,19,'#e7b960');p.line(26,19,29,25,'#e7b960');return;}
 if(id==='berry_cake'){p.rect(11,23,27,12,'#a57872');p.rect(11,24,27,4,'#f1d8b2');p.ellipse(24,22,14,5,'#eddbc5');for(const [x,y]of [[16,20],[25,19],[33,22]])p.ellipse(x,y,3,2,'#a54d6b');p.rect(11,31,27,3,'#e1b49b');return;}
 const pumpkin=id==='pumpkin_pie',c=pumpkin?'#d59346':'#e2c66e';p.poly([[8,27],[22,15],[40,24],[37,35],[10,35]],'#b1804e');p.poly([[9,26],[23,17],[39,24],[33,29]],c);p.line(11,29,36,30,'#efd394');if(pumpkin){p.line(16,24,29,23,'#a36f38');p.line(22,19,29,28,'#a36f38');}else for(const [x,y]of [[17,25],[27,22],[30,27]])p.ellipse(x,y,2,1,'#bd9d51');
}
function tool(p,it){
 const [,kind,tierText]=it.id.match(/^tool_(\w+)_(\d)$/),t=Number(tierText),c=['','#a58d70','#9ca9b0','#83b2ae','#8c8bc3','#c5b36c'][t];
 if(kind==='gloves'){for(const x of [9,27]){p.poly([[x,24],[x,16],[x+3,15],[x+4,9],[x+7,9],[x+8,13],[x+11,12],[x+12,28],[x+8,35],[x+2,34]],c);p.rect(x+1,33,10,5+t,lo(c));if(t>1)p.rect(x-1,22,14,3,hi(c));if(t>3)p.poly([[x+10,28],[x+15,22],[x+13,34]],c);for(let j=0;j<t;j++)p.dot(x+2+j*2,36,CREAM);}return;}
 p.line(11,42,32,12,'#866340');p.line(12,42,33,12,'#c09b62');p.rect(10,38,5,4,lo(c));
 if(kind==='rod'){p.line(32,12,38,5,c);p.line(38,5,43,13,hi(c));p.line(43,13,41,35,'#c5c6b1');p.line(41,35,37,38,c);p.line(37,38,35,35,c);if(t>1){p.ellipse(20,32,2+t/2,2+t/2,lo(c));p.ellipse(20,32,2,2,hi(c));}if(t>2)p.ellipse(34,10,3,3,hi(c));if(t>3)p.poly([[34,5],[37,0],[40,6]],c);if(t===5)star(p,30,6,'#e6d4a0',3);}
 if(kind==='axe'){p.poly([[25,13],[31,10-t],[37+t,10],[40+t,20],[36+t,25+t%2],[29,22]],lo(c));p.poly([[29,12],[34+t,12],[38+t,20],[35+t,23],[31,20]],c);p.line(41,17,42,22,hi(c));if(t>2)p.poly([[26,12],[19,15],[21,22],[27,20]],c);}
 if(kind==='pick'){p.poly([[20-t,12],[29,8-t/2],[36+t,9],[40+t,18+t],[35,14],[28,12],[18-t,16+t]],c);p.line(19,12,29,8,hi(c));if(t>3)p.line(28,8,30,3,hi(c));}
 if(kind==='hoe'){p.poly([[23,12],[29,8],[37+t,18],[33+t/2,24+t],[29,24],[32,19]],c);p.line(35,24,40,18,hi(c));if(t>2)p.line(25,14,32,19,lo(c));}
 for(let j=0;j<t;j++)p.line(15+j*2,34-j*3,18+j*2,35-j*3,t===5?'#f5d781':hi(c));
}
function gem(p,id,c){
 const shapes={gem_sapphire:[[14,10],[32,10],[39,20],[32,36],[15,36],[8,20]],gem_emerald:[[16,7],[32,7],[37,13],[37,34],[31,40],[16,40],[11,34],[11,13]],gem_ruby:[[24,6],[40,23],[24,42],[8,23]],gem_diamond:[[8,17],[17,8],[32,8],[41,17],[24,42]],ember_core:[[24,4],[29,16],[38,11],[36,23],[43,29],[35,40],[15,40],[8,29],[15,15],[19,22]]};
 p.poly(shapes[id],lo(c));p.poly(shapes[id].map(([x,y])=>[24+(x-24)*.78,24+(y-24)*.78]),c);p.line(16,16,24,12,hi(c));p.line(24,12,27,29,hi(c));p.line(12,22,35,22,hi(c));if(id==='ember_core'){p.poly([[22,18],[28,29],[25,36],[18,31]],'#f8d47a');star(p,39,7,'#f0b76c',2);}
}
function misc(p,it){
 const id=it.id,c=it.col||'#b49b6c';
 if(id==='rune'){p.poly([[13,12],[30,8],[39,22],[33,39],[15,40],[8,26]],'#9badb0');p.line(22,16,29,24,'#d4e6d5');p.line(29,24,21,32,'#d4e6d5');p.line(21,19,21,32,'#d4e6d5');return;}
 if(id==='cloth'){p.poly([[9,14],[34,10],[40,33],[15,40]],c);p.poly([[9,14],[16,17],[15,40],[8,34]],lo(c));p.line(17,18,33,15,hi(c));p.line(19,23,34,20,hi(c));p.line(22,29,36,26,lo(c));return;}
 if(id==='burnt'){p.poly([[10,30],[12,19],[24,14],[37,23],[35,36],[19,39]],'#45413b');p.line(15,25,29,20,'#776d58');p.line(22,33,31,29,'#272929');p.line(20,10,17,6,'#a5a394');return;}
 if(id==='old_bone'||id==='troll_bone'){const big=id==='troll_bone';p.line(12,36,35,13,c);p.line(13,37,36,14,c);for(const [x,y]of [[10,35],[14,39],[34,10],[39,14]])p.ellipse(x,y,big?6:4,big?5:3,c);p.line(18,31,30,19,hi(c));if(big)p.line(25,23,23,18,lo(c));return;}
 if(id==='boar_tusk'){p.poly([[13,10],[25,12],[28,26],[34,32],[40,31],[35,39],[24,37],[17,27]],'#e5d1a5');p.poly([[15,14],[21,15],[24,29],[30,34],[24,32],[20,25]],'#baaa85');return;}
 if(id==='wyrm_scale'||id==='bogscale'){p.poly([[24,6],[38,16],[35,31],[24,42],[12,32],[10,17]],c);p.poly([[24,10],[24,35],[14,28],[14,18]],hi(c));p.line(24,13,31,27,lo(c));if(id==='wyrm_scale')p.poly([[22,9],[24,1],[28,11]],c);return;}
 if(id==='egg'){p.ellipse(24,28,11,15,c);p.ellipse(21,23,6,9,hi(c));return;}
 if(id==='milk'){p.rect(17,8,14,5,'#a88254');p.poly([[18,13],[30,13],[30,19],[35,25],[35,40],[13,40],[13,25],[18,19]],'#bed0c6');p.rect(16,26,16,11,'#f1e7cc');p.line(17,17,16,24,CREAM);return;}
 if(id==='wool'){for(const [x,y,r]of [[15,27,8],[22,19,9],[32,23,9],[31,34,8],[19,35,9]]){p.ellipse(x,y,r,r,lo(c));p.ellipse(x,y-2,r-1,r-1,c);p.line(x-3,y-3,x+2,y-4,hi(c));}return;}
 if(id==='truffle'){p.poly([[10,31],[14,18],[26,14],[36,21],[39,32],[28,40],[16,38]],c);for(const [x,y]of [[17,25],[24,20],[30,29],[20,34]]){p.ellipse(x,y,3,2,lo(c));p.dot(x,y,hi(c));}return;}
 if(id==='cheese'){p.poly([[9,23],[31,12],[40,25],[40,37],[9,37]],'#c5a454');p.poly([[9,23],[31,12],[40,25]],'#eed58b');p.rect(11,26,28,9,c);for(const [x,y,r]of [[17,29,3],[30,32,2],[28,20,2]])p.ellipse(x,y,r,r,'#b08b46');return;}
 if(id==='honey'){p.rect(12,12,24,5,'#9b7447');p.poly([[14,18],[34,18],[38,25],[36,40],[12,40],[10,25]],'#b5b98d');p.rect(14,25,20,12,'#d5a34e');p.rect(17,27,14,7,'#f0d38c');p.line(22,20,23,29,'#e6bc65');p.line(38,9,41,16,'#a27d46');p.rect(35,6,7,6,'#cb9b54');return;}
 if(id==='coin_pouch'){p.poly([[17,12],[31,12],[28,21],[37,29],[35,39],[24,43],[12,38],[11,28],[20,21]],'#ae8753');p.rect(17,19,14,3,'#d4b96f');p.ellipse(25,31,6,6,'#ddbc62');p.line(25,27,25,35,'#97723e');return;}
 return false;
}
function skill(p,id){
 const c=D.SK[id]?.col||'#d8b063';
 if(id==='hunting'){p.line(8,42,35,8,'#9b7148');p.poly([[34,7],[44,4],[40,14]],'#c9a86b');p.line(12,37,6,27,'#c9a86b');p.ellipse(31,31,7,6,c);for(const [x,y]of [[22,22],[31,18],[40,22]])p.ellipse(x,y,3,4,c);return;}
 if(id==='exploration'){p.poly([[5,11],[17,6],[31,11],[43,5],[41,38],[29,43],[17,38],[6,43]],'#d7c78f');p.line(17,7,17,38,'#8e7657');p.line(30,11,29,42,'#8e7657');p.line(9,31,37,15,c);star(p,36,14,'#f2df9d',5);return;}
 if(id==='herbalism'){p.ellipse(24,34,13,8,'#9f7254');p.rect(15,20,18,15,'#b9c2a4');p.rect(18,16,12,5,'#7b985c');for(const [x,y]of [[11,17],[23,9],[36,15]]){p.line(23,23,x,y,'#66834c');p.ellipse(x,y,6,3,c);}return;}
 if(id==='enchanting'){gem(p,'gem_sapphire',c);for(const [x,y]of [[7,10],[38,9],[40,36],[9,38]])star(p,x,y,'#eadb9c',3);p.ellipse(24,24,20,20,'#b79be1');p.ellipse(24,24,17,17,null);return;}
 if(id==='fishing'){fish(p,'trout');p.line(4,5,20,14,'#c3a16c');p.line(20,14,16,32,'#ddd2ad');return;}
 if(id==='woodcutting')return tool(p,{id:'tool_axe_3'});
 if(id==='mining')return tool(p,{id:'tool_pick_3'});
 if(id==='farming'){crop(p,'wheat');p.line(32,40,32,22,'#789853');p.ellipse(36,26,6,3,'#9ab16c');return;}
 if(id==='cooking')return food(p,'veg_stew');
 if(id==='crafting'){gem(p,'gem_ruby','#c97575');p.line(9,42,37,10,'#bb9865');p.line(35,8,41,13,'#d7d0b4');return;}
 if(id==='smithing'){p.poly([[5,20],[43,20],[38,28],[28,29],[28,36],[36,40],[11,40],[18,35],[18,29],[10,27]],'#829494');p.line(7,21,38,21,'#c4d0c0');p.rect(24,8,4,14,'#9b7247');p.rect(17,5,17,8,'#b6bdb1');return;}
 if(id==='magic'){p.line(10,41,30,16,'#b091ce');star(p,33,12,'#ddc3f0',8);star(p,12,13,'#e6d6a5',3);return;}
 if(id==='attack'){p.poly([[9,38],[32,6],[40,3],[40,12],[15,43]],'#b7c4c3');p.line(16,34,35,10,'#f5efcf');p.line(8,31,24,43,'#c9a364');p.line(9,42,5,46,'#8b6443');return;}
 if(id==='strength'){p.poly([[9,19],[14,8],[22,7],[28,14],[34,14],[39,21],[37,35],[28,41],[13,37],[7,28]],'#bd8e65');p.line(14,17,19,12,'#e2b58a');p.line(20,20,29,19,'#825b43');p.line(16,25,29,26,'#825b43');p.rect(13,36,19,7,'#927442');return;}
 if(id==='defence'){p.poly([[6,10],[24,4],[42,10],[38,32],[24,44],[10,32]],'#c2a767');p.poly([[10,14],[24,9],[37,14],[34,30],[24,38],[14,30]],'#638d9b');p.line(24,11,24,36,'#d8c38b');p.line(13,23,35,23,'#d8c38b');return;}
 if(id==='ranged'){p.line(12,6,12,42,'#e3d8b4');p.poly([[12,4],[23,9],[32,24],[24,40],[12,44],[18,37],[25,24],[19,12]],'#a0784a');p.line(8,25,42,25,'#bca573');p.poly([[43,25],[36,21],[36,29]],'#a3bcc2');return;}
 if(id==='hitpoints'){p.poly([[24,14],[17,7],[9,7],[4,14],[5,24],[24,43],[43,24],[44,14],[37,7],[30,7]],'#bb5c59');p.line(10,18,18,18,'#f0cba8');p.line(18,18,22,13,'#f0cba8');p.line(22,13,26,29,'#f0cba8');p.line(26,29,30,21,'#f0cba8');p.line(30,21,38,21,'#f0cba8');return;}
 if(id==='thieving'){p.poly([[7,17],[14,9],[24,14],[34,9],[41,17],[37,31],[28,36],[24,29],[20,36],[11,31]],'#716286');for(const x of [14,29]){p.poly([[x-4,19],[x+5,20],[x+2,24],[x-3,23]],INK);p.dot(x,21,'#d4d1a8');}p.line(12,13,20,16,'#a995b8');return;}
}
function thieve(p,id){
 const c={villager:'#a28363',farmer:'#9aab6a',dockhand:'#789ca2',merchant:'#bca363',dwarf:'#919a9d',armoury:'#b1bac0',cultist:'#9a75b7',witch:'#937fa8',fireguard:'#b8754e',hoard:'#d8b35f',farmhand:'#a6aa73',market:'#ba936c',monk:'#b3a17d',vault:'#8d99a6'}[id]||'#9a8e79';
 if(['hoard','vault','armoury','market','merchant'].includes(id)){
  if(id==='hoard'){for(const [x,y]of [[9,35],[19,30],[31,33],[24,39],[38,39]]){p.ellipse(x,y,7,3,c);p.line(x-4,y-1,x+3,y-1,hi(c));}p.poly([[24,25],[20,15],[26,9],[32,16]],'#b98dba');return;}
  if(id==='market'){p.rect(7,24,34,17,'#896443');p.rect(5,13,38,5,c);for(let x=7;x<42;x+=9)p.rect(x,14,4,7,'#e2cca0');p.line(9,12,13,5,'#8c6d4b');p.line(13,5,36,5,'#8c6d4b');p.line(36,5,40,12,'#8c6d4b');crop(p,'onion');return;}
  if(id==='armoury'){p.rect(8,8,4,35,'#93734d');p.rect(38,8,4,35,'#93734d');p.rect(8,10,33,4,'#93734d');for(const x of [19,31]){p.rect(x,16,3,21,c);p.line(x-3,31,x+6,31,'#c8ad67');}return;}
  if(id==='vault'){p.rect(6,8,36,35,lo(c));p.rect(10,12,28,27,c);p.ellipse(25,26,10,10,lo(c));p.ellipse(25,26,6,6,hi(c));for(const [x,y]of [[25,16],[35,26],[25,36],[15,26]])p.line(25,26,x,y,'#d6bd82');return;}
  p.poly([[8,17],[34,12],[42,24],[38,40],[12,40]],c);p.rect(18,9,14,8,lo(c));p.rect(16,20,5,20,'#d4b574');p.rect(31,16,4,24,'#d4b574');p.rect(22,26,7,7,'#e1c98c');return;
 }
 p.poly([[12,42],[14,24],[24,19],[35,24],[39,42]],lo(c));p.ellipse(24,14,9,10,'#caa17e');p.rect(15,10,18,4,c);p.line(17,28,31,28,hi(c));eye(p,19,15);eye(p,28,15);
 if(id==='villager'){p.rect(16,31,9,7,c);p.rect(19,30,4,3,'#d8b76f');}
 if(id==='farmer'){p.rect(11,7,26,4,'#ccb475');p.rect(18,2,13,6,'#a9925e');p.line(39,20,39,42,'#927447');for(const x of [36,39,42])p.line(x,15,x,24,'#b7b9a1');}
 if(id==='farmhand'){p.rect(21,24,10,16,c);p.line(37,27,42,12,'#a58553');p.poly([[37,12],[44,10],[43,17]],'#9aa995');}
 if(id==='dockhand'){p.rect(15,5,18,5,c);p.line(10,29,9,39,'#d9c28c');p.ellipse(10,35,6,7,'#d9c28c');p.ellipse(10,35,3,4,lo(c));}
 if(id==='dwarf'){p.poly([[14,18],[34,18],[31,35],[24,40],[17,33]],'#c3b598');p.rect(14,7,21,5,c);p.rect(21,5,6,5,'#e8ce7e');}
 if(id==='cultist'){p.poly([[10,19],[24,1],[38,19],[31,12],[17,12]],c);p.ellipse(24,30,6,6,'#c5a6df');p.line(20,30,28,30,INK);}
 if(id==='witch'){p.poly([[6,12],[19,9],[27,0],[31,10],[42,13]],c);p.line(7,20,7,43,'#ac9167');p.ellipse(7,20,3,3,'#c7b5df');}
 if(id==='fireguard'){p.poly([[12,14],[15,4],[32,3],[36,15]],c);p.rect(15,14,19,4,INK);p.rect(14,26,21,8,c);p.line(24,27,24,34,'#dfb56b');p.line(41,9,41,43,'#a08c6e');p.poly([[41,4],[45,13],[37,13]],'#c4b6a0');}
 if(id==='monk'){p.poly([[11,42],[16,26],[24,32],[33,24],[39,43]],c);p.line(18,27,30,38,'#e0d2a6');p.ellipse(24,7,5,2,'#caa17e');p.rect(16,9,17,2,'#706048');}
}
function item(p,it){
 const id=it.id,c=it.col||'#b49b6c';
 if(id.startsWith('raw_'))return fish(p,id);
 if(it.type==='food')return food(p,id);
 if(id.startsWith('log_'))return log(p,id.slice(4));
 if(id.startsWith('ore_'))return ore(p,id.slice(4));
 if(it.type==='tool')return tool(p,it);
 if(it.type==='crop')return crop(p,id.slice(5));
 if(it.type==='seed'){const cid=id.slice(5);p.poly([[10,15],[33,12],[38,38],[15,43],[9,37]],'#aa8654');p.rect(13,10,19,6,'#d0b37a');p.line(16,13,29,12,'#775737');const small=Q.pixelPainter();crop(small,cid);for(let y=0;y<48;y++)for(let x=0;x<48;x++){const col=small.get(x,y);if(col)p.dot(13+Math.floor(x*.5),18+Math.floor(y*.5),col);}return;}
 if(it.type==='gem')return gem(p,id,c);
 if(it.type==='potion'){
  const n=['heal','haste','might','fortune','scholar'].indexOf(id.slice(7));
  const shapes=[[[16,18],[32,18],[37,27],[35,40],[13,40],[11,27]],[[21,12],[28,12],[28,25],[32,37],[27,43],[20,41],[17,36],[21,25]],[[14,20],[34,20],[39,27],[39,40],[9,40],[9,27]],[[19,16],[29,16],[38,32],[32,41],[16,41],[10,32]],[[15,20],[33,20],[35,40],[13,40]]];
  p.poly(shapes[n], '#b4c9c3');p.poly(shapes[n].map(([x,y])=>[24+(x-24)*.75,Math.max(26,y-2)]),c);p.rect(20,n===1?7:11,9,6,'#94734f');p.line(15,28,15,34,CREAM);
  if(n===0){p.rect(22,27,4,10,CREAM);p.rect(19,30,10,4,CREAM);}
  if(n===1)p.line(23,28,26,35,CREAM);
  if(n===2)p.poly([[19,34],[20,28],[26,27],[29,34]],CREAM);
  if(n===3)for(const [x,y]of [[21,29],[27,29],[21,35],[27,35]])p.ellipse(x,y,3,3,'#cee9a2');
  if(n===4){p.rect(18,29,13,8,'#e7d6af');p.line(24,29,24,37,'#8c6b91');}return;
 }
 if(id==='feed'){p.poly([[10,16],[34,14],[39,38],[31,43],[13,41]],'#b79a63');p.rect(13,11,21,7,'#d3bd83');for(const [x,y]of [[17,28],[24,25],[30,31],[22,35]])p.ellipse(x,y,3,2,'#e5ce87');return;}
 if(/hide|pelt/.test(id)||id==='leather'){
  const fur=id.includes('pelt'),frost=id==='frost_pelt',drake=id==='drakehide';
  p.poly([[11,9],[20,13],[29,9],[37,13],[33,23],[40,33],[31,36],[25,44],[18,39],[10,34],[7,23],[14,19]],c);
  if(fur)for(const [x,y]of [[13,14],[30,16],[16,28],[28,33],[20,38]])p.line(x,y,x-3,y+4,hi(c));
  if(frost)for(const x of [15,22,29])p.poly([[x,17],[x+4,22],[x+2,29],[x-2,23]],'#dce3d3');
  else if(drake)for(let y=18;y<35;y+=7)for(let x=16;x<33;x+=7)p.poly([[x,y],[x+4,y+3],[x,y+6],[x-3,y+3]],lo(c));
  else if(id==='cowhide'){p.ellipse(17,20,4,5,'#675645');p.ellipse(29,29,5,4,'#675645');}
  else {p.line(18,20,25,35,lo(c));p.line(27,17,31,29,hi(c));}return;
 }
 if(id.startsWith('bar_')){const n=['bronze','iron','steel','mithril','adamant','rune','astral','gold'].indexOf(id.slice(4));const w=10+n%3*2;p.poly([[7,23],[27,12-n%2],[42,23],[22,35]],hi(c));p.poly([[7,23],[22,30],[22,38],[7,31]],lo(c));p.poly([[22,30],[42,23],[42,31],[22,38]],c);for(let j=0;j<=n%4;j++)p.line(23+j*3,30-j,23+j*3,34-j,lo(c));p.poly([[22,20],[22+w/2,17],[22+w,20],[22+w/2,23]],lo(c));if(n>=5)star(p,31,20,CREAM,2);return;}
 if(misc(p,it)!==false)return;
 return false;
}
function moreCreatures(p,id){
 const c=(D.MON[id]||D.PET[id]||D.ANIMAL[id])?.col||'#9d9b78';
 const ex=D.EXTRA_CREATURES&&D.EXTRA_CREATURES[id];
 if(ex){
  const a=hi(c),d=lo(c),k=ex.index%5;
  if(ex.body==='beast'){
   p.ellipse(27,31,15,10,d);p.ellipse(27,29,14,9,c);p.ellipse(13,25,9,8,a);p.rect(18,36,5,8,d);p.rect(34,36,5,8,d);eye(p,10,24);
   if(ex.mark==='antler'){p.line(10,18,6,5,d);p.line(10,14,17,5,d);p.line(6,9,2,7,d);p.line(15,9,20,7,d);}
   if(ex.mark==='tail'){p.poly([[38,27],[47,15],[45,31],[38,36]],a);p.line(42,25,47,21,CREAM);}
   if(ex.mark==='ears'){p.poly([[8,19],[5,3],[14,17]],c);p.poly([[15,18],[19,2],[20,20]],a);}
   if(ex.mark==='horn'){p.poly([[6,21],[1,12],[11,18]],CREAM);p.poly([[15,18],[21,8],[20,23]],CREAM);}
   if(ex.mark==='candle'){p.ellipse(14,14,5,9,'#d9ad53');p.poly([[14,2],[19,11],[14,16],[10,10]],'#f1cb62');}
   if(ex.mark==='plates'||ex.mark==='glass')for(let x=19;x<39;x+=6)p.poly([[x,23],[x+3,15-k],[x+6,24]],ex.mark==='glass'?'#c9d3c8':a);
   if(ex.mark==='cloud')for(const [x,y]of [[19,23],[27,20],[36,25]])p.ellipse(x,y,8,6,'#dce4d9');
   if(ex.mark==='thorn')for(const x of [18,25,32,39])p.poly([[x,23],[x+2,15-k],[x+5,24]],'#9bb65e');
  }else if(ex.body==='winged'){
   p.poly([[20,29],[3,11-k],[8,34],[20,37]],d);p.poly([[29,29],[45,8+k],[42,35],[29,37]],a);p.ellipse(25,31,9,11,c);p.ellipse(24,19,8,8,a);eye(p,20,18);p.rect(19,39,4,6,d);p.rect(29,39,4,6,d);
   if(ex.mark==='lamp'){p.ellipse(24,28,5,7,'#efd46e');star(p,24,28,CREAM,2);}
   if(ex.mark==='ice')for(const [x,y]of [[8,17],[40,16],[24,31]])p.poly([[x,y-6],[x+4,y],[x,y+7],[x-3,y]],'#dceaf0');
   if(ex.mark==='prism')for(const [x,y,z]of [[8,18,'#e58b9c'],[39,17,'#80c8c2'],[25,29,'#d9c56e']])p.poly([[x,y-5],[x+5,y],[x,y+6],[x-4,y]],z);
  }else if(ex.body==='humanoid'){
   p.rect(16,31,6,13,d);p.rect(28,31,6,13,d);p.poly([[13,21],[34,21],[38,35],[10,35]],c);p.ellipse(24,14,9,10,a);p.rect(7,23,7,13,a);p.rect(34,23,7,13,a);eye(p,19,14);eye(p,28,14);
   if(ex.mark==='cap'){p.ellipse(24,8,15,7,'#b981a8');p.rect(20,8,9,5,'#d2a8bd');}
   if(ex.mark==='root'||ex.mark==='reeds'){for(const x of [12,20,28,36]){p.line(x,35,x+(x%3-1)*6,45,d);p.line(x,22,x-3,6,ex.mark==='reeds'?'#87a56e':d);}}
   if(ex.mark==='wreck'){p.rect(8,18,31,5,'#75604d');p.line(11,17,36,5,'#b79b6b');p.rect(31,3,4,20,'#8e6f4f');}
   if(ex.mark==='strings'){for(const x of [10,20,30,39])p.line(x,0,x,22,'#c4afcf');p.line(8,4,41,4,'#7c6386');}
   if(ex.mark==='kite'){p.poly([[36,23],[46,12],[45,28]],'#d6c985');p.line(38,25,46,39,'#b8a76c');}
   if(ex.mark==='echo'){p.ellipse(24,14,14,12,'#4a405e');p.ellipse(24,14,10,8,null);}
   if(ex.mark==='halo'){p.ellipse(24,4,12,4,'#d8c985');p.ellipse(24,4,8,2,null);for(const x of [14,24,34])p.line(x,21,x-2,42,'#c9b9c4');}
  }else if(ex.body==='clawed'){
   p.ellipse(24,29,13,11,c);for(const sx of [-1,1]){p.line(24+sx*9,29,24+sx*18,20,d);p.ellipse(24+sx*18,18,5,6,a);p.line(24+sx*8,34,24+sx*17,42,d);}eye(p,20,24);eye(p,28,24);
   if(ex.mark==='fin')p.poly([[19,22],[24,5],[30,23]],'#7bc2b4');
   if(ex.mark==='shell')for(let r=4;r<12;r+=3)p.ellipse(24,29,r,r-2,r%2?d:a);
   if(ex.mark==='stones')for(const [x,y]of [[15,27],[24,20],[32,27],[22,35]])p.poly([[x-5,y],[x,y-5],[x+5,y],[x,y+5]],'#aaa99d');
   if(ex.mark==='loom')for(const x of [14,20,28,34]){p.line(x,20,24,39,'#e1a269');p.dot(x,20,CREAM);}
   if(ex.mark==='storm'){p.line(10,12,21,19,'#c8e8ef');p.line(21,19,16,29,'#77b7cf');p.line(33,7,27,19,'#d7eff0');}
   if(ex.mark==='furnace'){p.rect(17,22,14,13,'#6e5141');p.rect(20,25,8,7,'#f1a14f');p.line(22,26,27,30,CREAM);}
   if(ex.mark==='bloom')for(let i=0;i<6;i++){const t=i*Math.PI/3;p.ellipse(24+Math.cos(t)*10,25+Math.sin(t)*10,5,7,i%2?a:d);}
  }else{
   p.poly([[10,39],[15,22],[13,14],[24,5],[35,14],[33,25],[39,39],[29,36],[24,44],[18,36]],c);p.ellipse(20,22,2,3,CREAM);p.ellipse(29,22,2,3,CREAM);
   if(ex.mark==='fronds')for(const x of [12,19,27,35])p.line(x,18,x+(x%2?8:-8),3,'#8cbf83');
   if(ex.mark==='coil')p.line(13,38,42,42,a);p.line(42,42,35,35,a);
   if(ex.mark==='bell')p.poly([[9,34],[16,15],[32,15],[40,34]],'#8a9a66');p.ellipse(24,36,4,5,'#d5b665');
   if(ex.mark==='veil')for(const x of [14,20,27,34])p.line(x,18,x-3,43,'#d29376');
   if(ex.mark==='orbit'){p.ellipse(24,23,18,7,'#c6bbd4');p.ellipse(24,23,13,4,null);star(p,42,13,CREAM,2);}
  }
  return true;
 }
 if(id==='pudding'){p.ellipse(27,30,14,10,'#d4a29b');p.ellipse(14,25,10,10,'#e4b6a8');p.poly([[8,19],[5,12],[15,17]],'#c78e88');p.poly([[18,18],[24,12],[22,23]],'#c78e88');p.ellipse(9,28,7,5,'#bf8584');p.dot(6,28,INK);p.dot(11,28,INK);eye(p,12,21);p.rect(19,37,4,7,'#a67672');p.rect(34,37,4,7,'#a67672');p.line(40,28,45,25,'#c78e88');p.line(45,25,45,30,'#c78e88');return true;}
 if(id==='bill'){for(const sx of [-1,1]){p.line(23+sx*8,34,23+sx*15,40,'#c38c67');p.line(23+sx*7,31,23+sx*16,33,'#c38c67');p.ellipse(23+sx*15,29,4,4,'#dbab7d');}p.ellipse(27,24,13,14,'#bea38c');p.ellipse(28,23,8,9,'#8f7d76');p.ellipse(27,22,5,6,'#d6bda1');p.ellipse(27,23,2,3,'#8f7d76');p.ellipse(18,34,8,6,'#cb9870');eye(p,13,31);eye(p,20,31);return true;}
 if(id==='frostling'){p.ellipse(24,31,11,10,'#94bbc5');p.ellipse(23,18,11,11,'#b3d5d6');p.poly([[14,11],[12,4],[20,10]],'#ecdfb6');p.poly([[28,10],[34,4],[33,15]],'#ecdfb6');p.ellipse(17,32,6,5,'#b3d5d6');p.ellipse(33,32,6,5,'#94bbc5');p.rect(15,39,7,6,'#7f9da7');p.rect(28,39,7,6,'#7f9da7');eye(p,17,18);eye(p,27,18);p.rect(20,25,8,3,'#668a96');p.dot(21,25,CREAM);p.dot(26,25,CREAM);return true;}
 if(id==='nugget'){p.ellipse(26,30,15,11,'#91827a');p.ellipse(16,25,10,9,'#a79486');p.ellipse(9,28,5,3,'#ca9c96');p.ellipse(14,20,3,2,'#665c58');p.rect(12,35,10,6,'#c7aca0');p.rect(31,35,10,6,'#c7aca0');for(const x of [13,17,21,32,36,40])p.line(x,38,x-2,43,'#e0d0ba');p.line(20,23,32,22,'#b2a397');return true;}
 if(id==='bubbles'){fish(p,'carp');p.poly([[20,17],[14,5],[25,10],[31,17]],'#dca55d');p.poly([[13,24],[1,13],[4,27],[1,39]],'#e8b966');p.ellipse(21,24,9,6,'#e6b65e');eye(p,36,22);return true;}
 if(id==='gobbo'){p.ellipse(24,31,8,10,'#8caa67');p.ellipse(23,18,10,10,'#9fbc7b');p.poly([[14,13],[5,10],[10,20],[17,21]],'#9fbc7b');p.poly([[31,13],[41,10],[36,20],[30,22]],'#9fbc7b');p.rect(16,32,16,8,'#8b6a49');p.rect(16,39,6,5,'#65533c');p.rect(27,39,6,5,'#65533c');eye(p,17,17);eye(p,27,17);p.line(20,25,27,25,'#61784c');p.rect(17,27,15,3,'#bf8c66');return true;}
 if(id==='bogwisp'){p.poly([[10,34],[16,24],[14,14],[24,3],[35,13],[32,22],[38,32],[27,41],[15,44],[20,37]],'#7ea99b');p.poly([[17,29],[20,19],[24,11],[29,19],[27,31],[22,37]],'#cee5b2');p.ellipse(22,25,2,2,'#497968');p.ellipse(29,24,2,2,'#497968');star(p,8,14,'#d5dfaa',2);return true;}
 if(id==='hollowling'){p.poly([[12,42],[15,20],[24,12],[34,20],[37,42],[29,38],[23,44],[17,39]],'#7d6c98');p.ellipse(20,26,2,3,'#e9dec3');p.ellipse(29,26,2,3,'#e9dec3');p.poly([[14,17],[12,6],[20,10],[24,2],[29,10],[36,6],[34,17]],'#c4af72');p.dot(24,11,'#b89bcf');return true;}
 if(id==='hen'){p.ellipse(24,32,17,11,'#e3dcc4');p.ellipse(15,19,8,10,'#efead7');p.poly([[8,20],[1,23],[9,25]],'#cf9a4e');p.ellipse(15,9,3,3,'#b7584c');p.ellipse(28,31,9,6,'#bcb9a6');p.poly([[34,28],[45,19],[43,34]],'#e5dfca');eye(p,12,18);return true;}
 if(['bandit','smuggler','pirate','barnacle'].includes(id)){
  p.rect(15,31,6,12,'#655849');p.rect(28,31,6,12,'#655849');p.poly([[14,22],[32,22],[36,35],[11,35]],c);p.ellipse(23,14,9,10,'#cea582');p.rect(9,25,6,11,'#cea582');p.rect(34,25,6,11,'#b78b70');eye(p,18,14);eye(p,27,14);p.rect(13,32,21,3,'#534b3b');
  if(id==='bandit'){p.poly([[12,11],[19,2],[29,4],[34,12]],'#68645a');p.rect(14,17,18,6,'#5c5650');p.line(38,29,43,18,'#b5c4bd');p.line(36,29,41,31,'#ad9963');}
  if(id==='smuggler'){p.rect(13,7,20,6,'#6e8993');p.line(15,9,31,9,'#bdb9a1');p.rect(17,26,12,4,'#c4bb9b');p.ellipse(39,34,6,8,'#a48b5e');p.rect(36,27,5,3,'#d4bc7f');}
  if(id==='pirate'){p.rect(13,7,20,5,'#a76963');p.poly([[30,8],[40,15],[31,13]],'#a76963');p.rect(24,14,9,3,INK);p.line(16,9,33,19,INK);p.line(37,34,44,23,'#b9c4bf');p.line(36,34,42,37,'#ccb16e');}
  if(id==='barnacle'){p.poly([[6,12],[16,8],[22,2],[31,3],[36,9],[44,12]],'#555c60');p.rect(14,11,24,3,'#c5ab72');p.ellipse(23,22,5,4,'#7d7364');p.line(18,26,16,32,'#cfb67b');p.line(30,25,32,32,'#cfb67b');p.ellipse(41,33,4,5,'#c1bca0');p.ellipse(41,31,2,3,null);p.rect(29,39,3,7,'#95774e');}
  return true;
 }
 if(id==='imp'){p.poly([[17,26],[5,12],[6,30],[14,24]],'#b97b61');p.poly([[31,26],[43,12],[42,30],[34,24]],'#b97b61');p.ellipse(24,30,8,11,c);p.ellipse(24,17,9,9,c);p.poly([[17,12],[15,3],[22,10]],'#dac493');p.poly([[27,10],[34,3],[32,14]],'#dac493');eye(p,19,17);eye(p,27,17);p.line(30,38,43,41,c);p.poly([[43,41],[44,34],[39,38]],c);p.rect(17,38,5,7,lo(c));p.rect(27,38,5,7,lo(c));return true;}
 if(id==='bogsnapper'){p.poly([[6,31],[12,22],[29,20],[40,27],[45,29],[42,35],[29,36],[16,34]],c);p.poly([[30,21],[38,18],[44,20],[46,28],[31,29]],c);p.line(34,28,45,28,'#4c6350');p.poly([[15,29],[2,20],[3,29],[10,35]],c);for(const x of [13,20,27])p.poly([[x,23],[x+2,17],[x+5,22]],lo(c));p.rect(15,33,5,9,lo(c));p.rect(30,34,5,8,lo(c));eye(p,37,22);return true;}
 return false;
}

function companion(p,id){



 if(id==='wyrmling'){p.poly([[17,27],[4,11],[6,31],[16,25]],'#d18b62');p.poly([[29,26],[41,10],[44,30],[33,26]],'#d18b62');p.ellipse(24,32,10,11,'#a76b4c');p.ellipse(24,21,10,10,'#c88d63');p.poly([[15,16],[15,7],[21,13]],'#e1c48c');p.poly([[27,13],[33,6],[32,18]],'#e1c48c');p.ellipse(24,36,5,6,'#e0bc84');eye(p,19,20);eye(p,28,20);p.line(31,39,43,36,'#a76b4c');return true;}
 if(id==='tusky'){p.ellipse(27,31,14,9,'#9c735c');p.ellipse(14,29,10,10,'#bd8c71');p.poly([[8,23],[8,13],[16,22]],'#9c735c');p.ellipse(10,33,6,4,'#c99e86');p.poly([[5,34],[3,28],[8,35]],CREAM);eye(p,10,26);p.rect(20,38,4,6,'#6f5447');p.rect(34,38,4,6,'#6f5447');return true;}
 if(id==='whiskers'){p.poly([[33,36],[43,30],[43,15],[39,12],[37,17],[39,27],[31,30]],'#ba986e');p.ellipse(24,33,11,9,'#ba986e');p.ellipse(16,22,10,9,'#d4b78b');p.poly([[7,19],[7,7],[16,16]],'#ba986e');p.poly([[19,16],[25,7],[25,21]],'#ba986e');eye(p,11,22);eye(p,20,22);p.dot(16,27,'#9c6e62');for(const y of [27,30]){p.line(10,y,3,y-1,CREAM);p.line(21,y,29,y-1,CREAM);}p.rect(15,38,6,5,'#dbc09a');p.rect(27,38,6,5,'#dbc09a');return true;}
 return false;
}

const base=Q.artCanvas,cache=new Map();
Q.artCanvas=(kind,id)=>{
 const key=kind+':'+id;if(cache.has(key))return cache.get(key);const p=Q.pixelPainter();let drawn=true;
 if(kind==='creature')drawn=moreCreatures(p,id)||companion(p,id);
 else if(kind==='wood')tree(p,id);
 else if(kind==='fish')fish(p,id);
 else if(kind==='mine')ore(p,id,true);
 else if(kind==='skill')skill(p,id);
 else if(kind==='thieve')thieve(p,id);
 else if(kind==='item'&&D.ITEMS[id])drawn=item(p,D.ITEMS[id])!==false;
 else drawn=false;
 const cv=drawn?p.canvas():base(kind,id);cache.set(key,cv);return cv;
};
Q.plantSprite=(stage,col,size=96,cls='')=>{
 const plant=D.CROPS.find(c=>c.col===col);
 if(stage===3&&plant)return Q.artImage('item','crop_'+plant.id,size,cls,plant.name+' ready to harvest');
 return Q.artImage('plant',stage+'|'+col,size,cls,'Crop growth stage '+stage);
};
/* Leather is stitched and fur-lined, rather than sharing metal armour sprites. */
const baseGear=Q.gearIconUrl,gearCache=new Map();
Q.gearIconUrl=id=>{
 if(gearCache.has(id))return gearCache.get(id);
 const special=new Set(['tusk_charm','storm_feather','hollow_crown','chief_helm','barnacle_cutlass','frostmaw_pendant','witch_staff','emberfang_bow']);
 if(/^(ring|amulet)_/.test(id)||id.startsWith('robe_')||special.has(id)){
  const p=Q.pixelPainter(64,64),it=D.ITEMS[id],c=it.col,gold='#d6b572';
  const inlay=(name,x,y,scale=.6)=>{const g=Q.pixelPainter();gem(g,'gem_'+name,c);for(let j=0;j<48;j++)for(let i=0;i<48;i++){const v=g.get(i,j);if(v)p.dot(x+Math.floor(i*scale),y+Math.floor(j*scale),v);}};
  if(id.startsWith('ring_')){p.ellipse(32,39,17,18,gold);p.ellipse(32,39,12,13,null);p.line(20,45,24,50,hi(gold));inlay(id.slice(5),17,0);}
  else if(id.startsWith('amulet_')){p.line(13,5,17,30,gold);p.line(17,30,32,42,gold);p.line(51,5,47,30,gold);p.line(47,30,32,42,gold);inlay(id.slice(7),13,21,.8);}
  else if(id.startsWith('robe_')){
   const rank=['apprentice','adept','mystic','archmage'].findIndex(r=>id.includes(r)),part=id.split('_').pop();
   if(part==='head'){p.poly([[7,43],[17,37],[23,14-rank*2],[33+rank*3,3],[37,34],[54,43]],lo(c));p.poly([[17,37],[26,16],[32+rank*2,9],[33,36],[44,40]],c);p.line(19,34,37,34,gold);if(rank>1)star(p,30,24,'#e6d9a7',3);}
   else if(part==='body'){p.poly([[8,16],[22,9],[31,20],[41,9],[56,17],[57,36],[46,34],[48,56],[16,56],[18,33],[6,35]],lo(c));p.poly([[21,16],[31,24],[41,16],[41,49],[22,49]],c);p.line(22,16,32,45,gold);p.line(41,16,32,45,gold);p.rect(19,44,26,4,gold);}
   else {p.poly([[19,9],[43,9],[49+rank,56],[10-rank,56]],lo(c));p.poly([[22,12],[39,12],[44,51],[17,51]],c);p.line(27,18,23,47,gold);p.line(36,18,39,47,gold);}
   for(let i=0;i<=rank;i++)star(p,21+i*7,part==='head'?43:52,hi(c),1);
  }
  else if(id==='hollow_crown'){p.poly([[9,21],[18,29],[24,11],[32,28],[42,7],[47,29],[57,17],[52,48],[13,48]],c);p.rect(14,40,37,7,gold);p.ellipse(32,39,4,6,'#b0a1d6');}
  else if(id==='chief_helm'){p.poly([[10,40],[14,18],[25,11],[41,13],[51,26],[51,46],[39,55],[22,54]],c);p.rect(17,30,29,9,INK);p.rect(29,25,5,22,gold);p.poly([[14,19],[8,5],[20,13]],'#dbcb9f');p.poly([[41,15],[52,4],[49,24]],'#dbcb9f');}
  else if(id==='barnacle_cutlass'){p.poly([[13,47],[33,17],[50,7],[45,24],[23,52]],c);p.line(22,44,44,19,hi(c));p.ellipse(17,46,10,9,gold);p.ellipse(18,45,6,5,null);p.line(11,52,6,59,'#876b4b');for(const [x,y]of [[33,27],[38,22],[29,33]])p.ellipse(x,y,2,2,'#cac4a5');}
  else if(id==='witch_staff'){p.line(17,58,37,17,'#8c7156');p.line(18,58,38,17,'#b29a6a');p.line(37,18,29,8,'#8c7156');p.line(37,18,49,8,'#8c7156');p.ellipse(39,12,7,9,c);star(p,39,12,'#e1d2ed',4);p.line(21,45,32,43,'#8fba8b');}
  else if(id==='emberfang_bow'){p.poly([[13,7],[29,12],[43,27],[42,39],[25,55],[13,57],[21,45],[32,31],[25,21]],c);p.line(13,7,13,57,'#e6c89a');for(const [x,y]of [[26,17],[35,29],[27,45]])p.poly([[x,y],[x+8,y-5],[x+4,y+5]],'#edba69');}
  else if(id==='storm_feather'){p.line(17,57,40,11,gold);p.poly([[18,49],[16,25],[32,6],[47,7],[48,20],[35,40]],c);p.line(18,49,42,13,hi(c));for(let j=0;j<5;j++)p.line(22+j*3,38-j*5,36+j*2,30-j*4,lo(c));star(p,48,39,'#e4d685',4);}
  else {p.line(15,5,19,29,gold);p.line(49,5,45,29,gold);p.line(19,29,32,36,gold);p.line(45,29,32,36,gold);
   if(id==='tusk_charm')p.poly([[25,30],[36,32],[38,44],[33,55],[23,58],[28,47]],'#e1cfa4');
   else {p.poly([[32,29],[44,41],[32,59],[20,41]],'#a5d1d6');p.line(32,33,32,53,CREAM);star(p,32,42,CREAM,6);}}
  const url=p.canvas().toDataURL();gearCache.set(id,url);return url;
 }
 const m=id.match(/^(leather|frost|bog|drake)_(coif|vest|chaps)$/);if(!m)return baseGear(id);
 const p=Q.pixelPainter(64,64),c=D.ITEMS[id].col,trim=m[1]==='frost'?'#e4e5d8':m[1]==='bog'?'#a5b883':m[1]==='drake'?'#d6a16c':'#ceb18a';
 if(m[2]==='coif'){p.poly([[12,46],[13,20],[23,8],[37,8],[49,21],[51,47],[43,56],[35,46],[29,46],[21,55]],lo(c));p.poly([[17,42],[18,21],[25,14],[36,14],[44,23],[45,42],[37,38],[25,38]],c);p.ellipse(31,32,10,13,INK);p.line(18,23,24,16,trim);p.line(42,24,44,40,trim);}
 if(m[2]==='vest'){p.poly([[9,16],[23,9],[29,19],[35,19],[41,9],[55,17],[50,30],[45,29],[46,55],[18,55],[19,29],[13,31]],lo(c));p.poly([[20,16],[26,22],[37,22],[43,16],[41,50],[22,50]],c);p.line(30,24,30,48,trim);for(let y=26;y<44;y+=5){p.line(27,y,34,y+3,trim);p.line(34,y,27,y+3,trim);}p.rect(20,44,24,4,'#806144');}
 if(m[2]==='chaps'){p.rect(16,10,32,7,'#76583c');p.poly([[17,17],[29,17],[29,32],[26,56],[15,56]],c);p.poly([[35,17],[47,17],[49,56],[38,56],[35,32]],c);p.line(19,20,18,49,trim);p.line(44,20,46,49,trim);p.rect(15,51,12,5,lo(c));p.rect(37,51,12,5,lo(c));}
 if(m[1]==='frost'){for(const x of [17,23,39,45])p.line(x,17,x+2,23,trim);}
 if(m[1]==='bog'){for(const [x,y]of [[23,27],[40,30],[25,44]]){p.line(x,y,x+4,y+3,trim);p.line(x+4,y+3,x+7,y,trim);}}
 if(m[1]==='drake'){for(const [x,y]of [[18,23],[37,21],[21,39],[40,42]])p.poly([[x,y],[x+5,y-4],[x+9,y],[x+4,y+5]],trim);}
 const url=p.canvas().toDataURL();gearCache.set(id,url);return url;
};
})();
