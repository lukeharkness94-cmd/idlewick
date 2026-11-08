/* Native 48px interface symbols. Detailed imagery at the existing UI sizes. */
(() => {
const Q=window.DQ,INK='#29343b',PAPER='#e8d9b2',GOLD='#d8b66b',STEEL='#a9bec4',WOOD='#a68358',BLUE='#77a9c2',GREEN='#85b18a',RED='#ce8277';
Q.artResolution.uiIcons=48;
Q.ICONS.farming='M12 21V8 M5 12l7 4 7-4';
const refs={fish:['fish','salmon'],log:['item','log_oak'],ore:['item','ore_iron'],bar:['item','bar_steel'],gem:['item','gem_diamond'],hide:['item','cowhide'],bone:['item','old_bone'],pouch:['item','coin_pouch'],food:['item','bread'],rune:['item','rune'],rod:['item','tool_rod_3'],glove:['item','tool_gloves_3'],seed:['item','seed_wheat'],crop:['item','crop_wheat'],egg:['item','egg'],bottle:['item','potion_heal'],hoe:['item','tool_hoe_3']};
const cache=new Map();
function draw(id){
 if(Q.data.SK[id])return Q.artCanvas('skill',id);
 if(refs[id])return Q.artCanvas(...refs[id]);
 const p=Q.pixelPainter(),r=(x,y,w,h,c)=>p.rect(x,y,w,h,c),line=(x,y,a,b,c)=>p.line(x,y,a,b,c),poly=(pts,c)=>p.poly(pts,c),oval=(x,y,a,b,c)=>p.ellipse(x,y,a,b,c);
 const paper=()=>{poly([[10,5],[34,5],[39,11],[39,42],[10,42]],PAPER);r(13,7,3,33,'#c8b487');line(20,15,33,15,'#9d8a66');line(20,21,33,21,'#9d8a66');line(20,27,30,27,'#9d8a66');};
 const roof=(x=4,y=19,w=39)=>{poly([[x,y],[x+w/2,4],[x+w,y],[x+w-4,y+3],[x+w/2,10],[x+4,y+3]],'#bb8068');line(x+5,y-1,x+w/2,8,'#e2ae86');};
 const book=()=>{poly([[4,9],[17,7],[24,12],[31,7],[44,9],[44,40],[32,38],[24,43],[16,38],[4,40]],'#826e53');poly([[7,11],[17,10],[22,14],[22,38],[16,34],[7,35]],PAPER);poly([[26,14],[32,10],[41,11],[41,35],[32,34],[26,38]],'#d1c49f');for(const y of [19,25,31]){line(10,y,18,y+1,'#9b8e6c');line(30,y,37,y-1,'#9b8e6c');}};
 switch(id){
 case 'home': roof();r(9,21,29,22,'#bcad8b');r(21,29,9,14,'#78644b');r(12,24,6,7,BLUE);r(31,24,4,7,BLUE);r(33,8,5,10,'#9c7a5b');break;
 case 'house': roof(3,20,41);r(8,22,31,21,'#b5b08f');r(20,28,10,15,WOOD);r(11,26,6,7,BLUE);r(32,25,5,7,BLUE);line(9,36,16,36,'#79875e');break;
 case 'map':poly([[3,11],[16,5],[31,11],[44,5],[44,37],[31,43],[16,37],[3,43]],PAPER);poly([[16,5],[31,11],[31,43],[16,37]],'#c3c49b');line(16,8,16,34,'#a99f7a');line(31,14,31,39,'#a99f7a');for(const [x,y]of [[9,30],[17,25],[24,28],[32,20]])r(x,y,3,2,'#b28661');poly([[32,14],[36,9],[40,14],[36,24]],RED);oval(36,14,1,2,PAPER);break;
 case 'shop':r(7,19,34,24,WOOD);r(13,26,9,17,'#635b49');r(27,26,10,9,PAPER);poly([[4,18],[9,6],[39,6],[44,18]],'#789c8a');for(const x of [7,19,31])poly([[x,8],[x+5,8],[x+7,21],[x-1,21]],PAPER);r(5,20,38,3,'#a5baa0');r(25,34,15,4,'#c3a66f');break;
 case 'quest':paper();r(23,11,5,13,'#ad654e');r(23,27,5,5,'#ad654e');oval(34,37,6,6,'#aa6553');line(33,39,37,45,'#ac7e58');break;
 case 'scroll':paper();oval(12,7,5,4,'#f0e2bf');oval(34,40,6,4,'#bdab83');r(27,30,8,7,'#829e9c');break;
 case 'bag':poly([[10,16],[36,16],[41,43],[7,43]],'#9c7a52');line(16,16,17,7,GOLD);line(17,7,29,7,GOLD);line(29,7,31,16,GOLD);r(12,22,24,5,'#c2a276');r(16,31,15,9,'#856848');r(22,25,5,7,GOLD);break;
 case 'bank':poly([[3,14],[24,3],[45,14]],STEEL);r(5,15,38,4,'#d1d6bd');for(const x of [9,21,33]){r(x,21,5,18,STEEL);r(x,21,2,18,'#d0dbd1');}r(5,39,38,4,'#80989f');r(2,44,44,2,'#acbdba');break;
 case 'trophy':r(15,6,18,13,GOLD);oval(24,18,9,9,GOLD);r(8,9,7,4,GOLD);r(6,12,4,9,GOLD);line(8,23,16,27,GOLD);r(34,9,7,4,GOLD);r(38,12,4,9,GOLD);line(39,23,31,27,GOLD);r(22,26,5,11,'#bd9252');r(13,37,22,6,WOOD);line(18,9,18,18,'#f5dfa3');break;
 case 'gear':for(const [x,y,w,h]of [[19,2,10,7],[19,39,10,7],[2,19,7,10],[39,19,7,10],[8,7,8,8],[33,7,8,8],[8,33,8,8],[33,33,8,8]])r(x,y,w,h,STEEL);oval(24,24,18,18,STEEL);oval(24,24,10,10,INK);oval(24,24,6,6,GOLD);line(13,15,19,10,'#e0e6d8');break;
 case 'sound': case 'mute':r(5,19,8,12,GOLD);poly([[12,19],[25,8],[25,41],[12,31]],STEEL);line(14,20,22,14,'#dce6d6');if(id==='mute'){line(32,17,43,33,RED);line(33,17,44,33,RED);line(43,17,32,33,RED);}else{line(31,16,35,21,GOLD);line(35,21,35,28,GOLD);line(35,28,31,33,GOLD);line(38,10,44,20,GOLD);line(44,20,44,29,GOLD);line(44,29,38,39,GOLD);}break;
 case 'sun':for(let i=0;i<8;i++){const a=i*Math.PI/4;line(24+Math.cos(a)*16,24+Math.sin(a)*16,24+Math.cos(a)*21,24+Math.sin(a)*21,GOLD);}oval(24,24,11,11,'#e5be69');oval(21,21,6,6,'#f4dca0');break;
 case 'moon':oval(24,23,18,19,BLUE);oval(31,16,15,16,null);line(13,15,15,10,'#b3d3d9');r(13,30,3,3,'#5d8a9f');r(24,35,3,2,'#5d8a9f');break;
 case 'music':line(17,11,37,5,GOLD);line(17,12,37,7,GOLD);r(16,11,3,25,GOLD);r(35,7,3,24,GOLD);oval(11,36,7,5,BLUE);oval(30,31,7,5,BLUE);break;
 case 'lock':oval(24,18,11,14,STEEL);oval(24,18,6,9,null);r(10,22,28,21,GOLD);line(13,25,34,25,'#efdaa0');oval(24,31,3,3,INK);r(23,33,3,5,INK);break;
 case 'close':poly([[8,5],[24,20],[40,5],[44,10],[28,25],[44,40],[39,44],[24,29],[9,44],[4,39],[19,25],[4,10]],'#bcc5bd');line(9,8,24,23,'#edf0d9');break;
 case 'check':poly([[4,24],[10,18],[20,28],[37,7],[44,13],[20,42]],GREEN);line(9,23,20,34,'#c4dcb1');break;
 case 'chevron':poly([[13,6],[20,6],[37,24],[20,42],[13,42],[28,24]],STEEL);line(17,8,32,24,'#e0e5cf');break;
 case 'arrow':r(4,20,27,7,STEEL);poly([[26,7],[44,24],[26,41]],STEEL);line(7,21,29,21,'#dce8d7');line(29,12,40,24,'#dce8d7');break;
 case 'bell':oval(24,18,11,11,GOLD);poly([[13,18],[35,18],[36,32],[42,37],[6,37],[12,32]],GOLD);r(9,37,30,3,'#ae814b');oval(24,43,4,3,'#d7b675');r(22,3,5,5,STEEL);line(17,15,16,28,'#f0d69a');break;
 case 'star':poly([[24,3],[30,17],[45,18],[34,28],[37,44],[24,35],[10,44],[14,28],[3,18],[18,17]],GOLD);poly([[24,8],[24,29],[9,20],[20,20]],'#f4dda4');break;
 case 'skull':oval(24,20,16,16,'#ddd9bd');r(14,29,20,12,'#ddd9bd');oval(17,21,5,5,INK);oval(31,21,5,5,INK);poly([[24,26],[21,31],[27,31]],'#8b8f82');for(const x of [19,25,31])line(x,35,x,40,'#8b8f82');break;
 case 'coin':oval(24,25,18,18,'#ac8547');oval(23,23,17,17,GOLD);oval(23,23,13,13,'#e2c37e');oval(23,23,10,10,'#bb934e');line(22,14,22,32,'#f5dfac');line(17,18,27,18,'#f5dfac');line(18,26,28,26,'#f5dfac');line(11,17,15,11,'#f5dfac');break;
 case 'pin':oval(24,18,13,14,RED);poly([[12,23],[36,23],[24,45]],RED);oval(24,17,6,6,PAPER);line(16,11,20,8,'#efc5a4');break;
 case 'town':for(const [x,y,w,h]of [[3,21,13,22],[19,11,14,32],[36,24,9,19]]){r(x,y,w,h,'#aab3a1');poly([[x-1,y],[x+w/2,y-8],[x+w+1,y]],'#927d6b');r(x+4,y+7,4,5,BLUE);}r(24,31,5,12,WOOD);break;
 case 'info':oval(24,24,20,20,BLUE);oval(24,24,16,16,'#91b9c7');r(22,12,5,5,PAPER);r(22,22,5,13,PAPER);r(19,33,11,3,PAPER);break;
 case 'bit':poly([[24,4],[38,22],[34,38],[24,45],[13,37],[10,22]],GREEN);line(24,12,24,38,'#d4dba9');line(24,25,16,19,'#d4dba9');line(24,31,32,24,'#d4dba9');break;
 case 'arrow_ammo':line(8,40,39,9,WOOD);line(9,41,40,10,WOOD);poly([[32,5],[44,4],[43,17]],STEEL);poly([[7,31],[4,41],[15,43],[13,36]],'#bf9b76');break;
 case 'helm':poly([[8,25],[12,12],[24,5],[36,12],[41,25],[38,42],[28,45],[18,45],[9,40]],STEEL);r(12,25,25,8,INK);r(22,23,5,18,'#c7d3cb');line(15,17,21,12,'#e4e8d4');break;
 case 'body':poly([[3,17],[15,7],[22,12],[27,12],[34,7],[44,17],[41,28],[35,26],[36,43],[12,43],[13,26],[6,28]],STEEL);line(16,12,24,18,'#e2e5d1');line(24,18,32,12,'#e2e5d1');r(23,20,3,17,'#728d9a');r(13,35,22,4,WOOD);r(22,34,5,6,GOLD);break;
 case 'legs':r(11,5,27,7,WOOD);poly([[11,12],[23,12],[22,43],[9,43]],STEEL);poly([[26,12],[38,12],[40,43],[27,43]],STEEL);oval(16,25,6,5,'#d0d7c9');oval(33,25,6,5,'#d0d7c9');r(9,39,12,5,'#708896');r(28,39,12,5,'#708896');break;
 case 'shield':poly([[6,9],[24,3],[42,9],[38,32],[24,45],[10,32]],GOLD);poly([[11,13],[24,8],[37,13],[33,30],[24,38],[15,30]],BLUE);r(22,12,4,22,PAPER);r(14,21,20,4,PAPER);break;
 case 'staff':line(9,43,31,15,WOOD);line(10,44,32,16,WOOD);oval(34,11,9,9,GOLD);oval(34,10,6,6,'#b39bc7');line(31,7,34,5,'#eedbc6');break;
 case 'ring':oval(24,29,14,14,GOLD);oval(24,29,9,9,null);poly([[24,3],[33,11],[24,20],[15,11]],BLUE);line(18,11,24,6,'#d1e2d9');break;
 case 'amulet':line(8,4,13,24,GOLD);line(13,24,24,34,GOLD);line(40,4,35,24,GOLD);line(35,24,24,34,GOLD);poly([[24,25],[34,34],[24,45],[14,34]],'#9e87bc');line(19,33,24,28,'#e0cfe7');break;
 case 'nest':for(const [x,y]of [[8,28],[17,31],[27,29],[36,26],[12,35]])line(x,y,x+7,y+5,WOOD);oval(24,32,19,9,'#a48859');oval(24,28,15,6,'#6f674b');oval(18,24,5,7,'#e8ddbd');oval(29,23,5,7,'#d6cda9');line(9,34,37,34,'#c3a66d');break;
 case 'ring_logo':oval(24,24,20,20,GOLD);oval(24,24,13,13,null);for(const [x,y]of [[24,4],[44,24],[24,44],[4,24]])oval(x,y,3,3,BLUE);break;
 case 'sword':poly([[9,36],[33,7],[41,3],[40,14],[15,42]],STEEL);line(17,32,36,9,'#e9ead4');line(7,31,24,43,GOLD);line(9,41,4,46,WOOD);break;
 case 'bow':poly([[12,4],[26,9],[35,24],[27,39],[12,44],[20,35],[27,24],[20,13]],WOOD);line(12,5,12,43,PAPER);line(7,24,42,24,STEEL);poly([[43,24],[36,20],[36,28]],STEEL);break;
 case 'hammer':line(10,43,30,16,WOOD);line(11,44,31,17,WOOD);poly([[20,8],[28,3],[44,18],[38,25]],STEEL);line(25,8,40,20,'#e2e6d3');r(18,35,4,4,GOLD);break;
 case 'clock':oval(24,25,20,20,WOOD);oval(24,24,17,17,PAPER);for(const [x,y]of [[23,9],[36,23],[23,36],[10,23]])r(x,y,3,3,'#9d8c69');line(24,24,24,13,INK);line(24,24,33,29,INK);oval(24,24,2,2,GOLD);break;
 case 'heart':poly([[24,12],[17,5],[9,6],[3,14],[5,25],[24,44],[43,25],[45,14],[37,6],[30,5]],RED);line(10,14,15,10,'#f0c2aa');line(8,18,8,22,'#f0c2aa');break;
 case 'save':poly([[7,4],[34,4],[42,12],[42,44],[7,44]],BLUE);r(13,5,20,13,INK);r(25,7,5,9,STEEL);r(13,27,23,16,PAPER);for(const y of [31,36])line(17,y,31,y,'#ae9d7b');break;
 case 'flag':r(8,4,3,41,STEEL);poly([[12,6],[41,7],[34,16],[41,26],[12,25]],RED);line(14,9,32,10,'#e9b592');r(5,44,10,2,GOLD);break;
 case 'paw':for(const [x,y,rx,ry]of [[9,20,5,6],[18,10,5,6],[31,10,5,6],[40,20,5,6]])oval(x,y,rx,ry,WOOD);poly([[10,36],[14,27],[24,22],[34,27],[38,36],[33,42],[24,39],[15,42]],'#ba9973');line(17,29,23,26,'#dec7a0');break;
 case 'users':oval(17,13,8,9,'#cda984');oval(34,17,7,8,'#b79573');poly([[3,42],[5,30],[17,24],[28,30],[31,42]],'#8aa79c');poly([[28,41],[28,30],[35,26],[44,32],[46,41]],'#9aa8c1');line(10,32,15,28,'#cad5b8');break;
 case 'book':book();break;
 case 'barn':roof(3,19,42);r(7,21,34,23,'#a8775d');r(17,28,16,16,'#735a44');line(18,29,31,42,PAPER);line(31,29,18,42,PAPER);r(20,15,9,7,PAPER);break;
 case 'dagger':poly([[17,31],[30,8],[39,4],[37,15],[23,36]],STEEL);line(23,27,34,12,'#e5e6d1');line(12,27,29,39,GOLD);line(16,36,7,45,WOOD);break;
 case 'candle':oval(24,41,19,5,GOLD);r(17,18,14,22,PAPER);poly([[19,18],[22,22],[26,19],[29,26],[31,18]],'#f2e4bd');line(24,18,24,12,INK);poly([[24,2],[31,10],[28,16],[21,16],[18,11]],'#e4af5d');poly([[24,7],[27,12],[24,15],[22,12]],'#f7dfa0');break;
 case 'fire':poly([[8,33],[11,20],[18,25],[24,4],[31,16],[38,12],[42,31],[36,42],[16,44]],'#cd7853');poly([[16,34],[21,21],[25,27],[29,16],[35,34],[29,41],[20,41]],'#ecc16c');poly([[22,37],[26,29],[29,37],[25,41]],'#f4e0a5');break;
 default: oval(24,24,12,12,GOLD);break; /* newer icons are drawn by the pixel-art runtime, which replaces this */
 }
 return p.canvas();
}
Q.uiIconCanvas=id=>{if(!cache.has(id))cache.set(id,draw(id));return cache.get(id);};
Q.uiIconUrl=id=>Q.uiIconCanvas(id).toDataURL();
})();
