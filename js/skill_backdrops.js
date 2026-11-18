/* Original code-drawn workplaces. Quiet scenery follows the page, never an unrelated running task. */
(() => {
const Q=window.DQ,D=Q.data;
const scenes={
 fishing:['#183445','#406d78','#7b9c86','waves','reeds','pond'],
 woodcutting:['#24333e','#4b7056','#a1a271','pines','hills','logs'],
 mining:['#151925','#303447','#504f63','stalactites','rocks','mine'],
 thieving:['#232337','#4d485a','#867561','ruins','flats','alley'],
 farming:['#3a6577','#7da69a','#c5c28a','hills','fields','barn'],
 cooking:['#2a2026','#5e4540','#956945','hills','flats','hearth'],
 smithing:['#1e2530','#41434c','#7c6656','rocks','flats','forge'],
 crafting:['#282f35','#53605b','#a29570','hills','flats','bench'],
 magic:['#131c3b','#36396a','#787495','peaks','hills','observatory'],
 research:['#292735','#5c5261','#9a8467','ruins','flats','books'],
 hunting:['#1e3332','#4d7056','#8b9362','pines','reeds','trail'],
 exploration:['#243b57','#6b8c98','#cfbc91','peaks','hills','cairn'],
 brewery:['#263b3d','#557b6c','#9ca581','hills','fields','herbs'],
 enchanting:['#241b40','#51436b','#9a7e9f','spires','rocks','sigil'],
 carpentry:['#2e373a','#6b796d','#b2a487','pines','flats','timber'],
 sailing:['#1a3b54','#527f96','#acb8b1','waves','waves','harbour'],
 beastmastery:['#2d3449','#6b7f78','#b6ae89','hills','fields','ranch']
};
const wood='#664c3c',light='#b59a6e',shade='#302c34',stone='#6d747c',leaf='#71905d';
for(const[page,[a,b,c,back,front,motif]]of Object.entries(scenes)){
 Q.registerBackdrop('skill:'+page,{sky:[a,b,c],layers:[[back,175,b,65],[front,227,a,15]],detail:({px,pine})=>{
  const roof=(x,y,w)=>{for(let i=0;i<20;i++)px(x+i,y-i,w-2*i,1,wood);px(x+4,y+1,w-8,29,light);px(x+w/2-5,y+10,10,20,shade);};
  const table=(x,y,w)=>{px(x,y,w,5,light);px(x+3,y+5,4,24,wood);px(x+w-7,y+5,4,24,wood);px(x,y+4,w,2,wood);};
  const fence=(x,y,w)=>{for(let n=0;n<w;n+=15)px(x+n,y,3,28,light);px(x,y+7,w,2,wood);px(x,y+18,w,2,wood);};
  if(motif==='pond'){px(80,219,300,34,'#416b80');for(let x=70;x<410;x+=19){px(x,211-x%7,2,25,leaf);px(x-3,210-x%7,8,3,leaf);}px(175,220,70,5,wood);px(181,225,4,21,shade);px(235,225,4,21,shade);}
  if(motif==='logs'){for(const[x,y,w]of[[100,229,80],[125,218,58],[295,237,70]]){px(x,y,w,13,wood);px(x,y,w,3,light);px(x+w-8,y+2,8,9,light);px(x+w-6,y+4,4,5,wood);}px(247,220,26,25,wood);px(245,218,30,5,light);}
  if(motif==='mine'){px(163,158,150,95,shade);px(156,153,9,100,wood);px(312,153,9,100,wood);px(152,151,173,9,light);for(let y=160;y<253;y+=14)px(157,y,8,2,light);for(let i=0;i<5;i++){px(330+i*7,221-i*3,4,20,'#7fa5b2');}px(200,239,70,3,stone);}
  if(motif==='alley'){roof(48,177,100);roof(345,158,90);px(352,191,18,18,'#d6b16d');px(98,207,28,33,wood);px(95,213,34,2,light);px(380,210,4,45,wood);px(372,207,20,20,shade);px(376,211,12,10,'#ceb56b');}
  if(motif==='barn'){roof(95,189,100);fence(225,220,150);for(let y=231;y<267;y+=8)for(let x=50;x<180;x+=15){px(x,y,11,2,wood);px(x+3,y-5,3,5,leaf);}}
  if(motif==='hearth'||motif==='forge'){px(170,139,130,112,stone);for(let y=145;y<247;y+=10)px(170,y,130,2,shade);px(190,177,90,74,shade);for(let i=0;i<9;i++)px(195+i*9,230-i%3*8,8,21,'#b6794a');if(motif==='hearth'){table(60,217,90);px(93,202,27,15,shade);}else{px(337,216,57,10,stone);px(350,226,24,23,shade);px(331,210,72,8,light);}}
  if(motif==='bench'){table(117,215,235);px(142,197,49,16,wood);px(216,203,70,4,stone);px(263,193,5,27,light);px(316,198,18,15,leaf);}
  if(motif==='observatory'){roof(180,177,110);px(220,162,30,7,stone);px(240,150,55,9,light);px(291,146,7,17,stone);px(241,159,4,38,wood);for(let x=50;x<420;x+=45)px(x,58+x%38,2,2,light);}
  if(motif==='books'){for(let x=65;x<420;x+=120){px(x,145,90,105,wood);for(let y=154;y<244;y+=26){px(x+3,y+19,84,3,light);for(let n=0;n<10;n++)px(x+6+n*8,y+(n%3)*2,5,17-(n%3)*2,[leaf,stone,'#a37562'][n%3]);}}}
  if(motif==='trail'){fence(55,224,100);px(270,224,110,4,light);px(278,228,6,22,wood);px(366,228,6,22,wood);for(let i=0;i<20;i++)px(170+i*6,221+i*2,10,3,'#9d936e');}
  if(motif==='cairn'){for(let i=0;i<5;i++)px(210+i*4,243-i*8,60-i*8,7,i%2?stone:light);px(92,189,5,65,wood);px(81,187,54,12,light);px(84,204,41,10,wood);}
  if(motif==='herbs'){table(80,224,320);for(let x=93;x<390;x+=33){px(x,207,20,17,wood);px(x+8,190,3,18,leaf);px(x+2,196,17,3,leaf);}px(100,152,280,3,light);for(let x=120;x<380;x+=32){px(x,155,2,17,wood);px(x-3,170,9,15,leaf);}}
  if(motif==='sigil'){px(157,221,166,17,stone);px(177,213,126,8,light);for(let i=0;i<12;i++){const t=i*Math.PI/6;px(239+Math.cos(t)*55,159+Math.sin(t)*41,4,4,'#b299bb');}px(231,150,20,20,'#7d93a5');px(237,144,8,32,'#b2c1bd');}
  if(motif==='timber'){table(90,222,300);for(let i=0;i<5;i++){px(105+i*8,191-i*5,246-i*12,5,i%2?wood:light);}px(55,194,9,57,wood);px(43,192,35,6,stone);}
  if(motif==='harbour'){px(70,225,330,6,wood);for(let x=75;x<400;x+=38)px(x,231,5,25,shade);px(255,172,4,53,wood);for(let i=0;i<37;i++)px(259,174+i,40-i,1,light);px(222,218,81,10,shade);}
  if(motif==='ranch'){roof(88,187,100);fence(211,216,190);px(270,232,48,13,wood);px(270,232,48,2,light);px(347,192,33,15,light);px(359,181,8,12,leaf);}
 }});
}
Q.skillBackdropKey=page=>scenes[page]?'skill:'+page:null;
})();
