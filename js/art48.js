/* Native pixel drawings: 48px creatures/resources and 64px equipment.
   Shapes are rasterised directly on the new grid; no sprite enlargement filter is used. */
(() => {
const DQ = window.DQ, D = DQ.data;
const INK = '#252424', CREAM = '#fff0cf';
const mix = (a, b, t) => {
  const rgb = s => [1,3,5].map(i => parseInt(s.slice(i,i+2),16));
  const A=rgb(a), B=rgb(b);
  return '#' + A.map((v,i)=>Math.round(v+(B[i]-v)*t).toString(16).padStart(2,'0')).join('');
};
const light = (c,t=.25)=>mix(c,'#ffffff',t), dark=(c,t=.25)=>mix(c,'#172327',t);
function painter(w=48,h=48) {
  const pixels=Array(w*h).fill(null);
  const p={w,h,pixels,
    dot(x,y,c) { x=Math.round(x); y=Math.round(y); if(x>=0&&y>=0&&x<w&&y<h) pixels[y*w+x]=c; },
    get(x,y) { return x>=0&&y>=0&&x<w&&y<h ? pixels[y*w+x] : null; },
    rect(x,y,rw,rh,c) { for(let j=0;j<rh;j++)for(let i=0;i<rw;i++)p.dot(x+i,y+j,c); },
    line(x,y,xx,yy,c) { const n=Math.max(Math.abs(xx-x),Math.abs(yy-y),1); for(let i=0;i<=n;i++)p.dot(x+(xx-x)*i/n,y+(yy-y)*i/n,c); },
    ellipse(x,y,rx,ry,c) { for(let j=-Math.ceil(ry);j<=ry;j++)for(let i=-Math.ceil(rx);i<=rx;i++)if(i*i/(rx*rx)+j*j/(ry*ry)<=1)p.dot(x+i,y+j,c); },
    poly(pts,c) {
      const minY=Math.floor(Math.min(...pts.map(p=>p[1]))),maxY=Math.ceil(Math.max(...pts.map(p=>p[1])));
      for(let y=minY;y<=maxY;y++) { const xs=[];
        for(let i=0;i<pts.length;i++){const a=pts[i],b=pts[(i+1)%pts.length];if((a[1]<=y+.5&&b[1]>y+.5)||(b[1]<=y+.5&&a[1]>y+.5))xs.push(a[0]+(y+.5-a[1])/(b[1]-a[1])*(b[0]-a[0]));}
        xs.sort((a,b)=>a-b);for(let i=0;i+1<xs.length;i+=2)for(let x=Math.ceil(xs[i]);x<xs[i+1];x++)p.dot(x,y,c);
      }
    },
    canvas(outline=true) {
      const cv=document.createElement('canvas');cv.width=w;cv.height=h;const cx=cv.getContext('2d');
      for(let y=0;y<h;y++)for(let x=0;x<w;x++){let c=p.get(x,y);if(!c&&outline&&[[1,0],[-1,0],[0,1],[0,-1]].some(([a,b])=>p.get(x+a,y+b)))c=INK;if(c){cx.fillStyle=c;cx.fillRect(x,y,1,1);}}
      return cv;
    }
  };return p;
}
DQ.pixelPainter=painter;
const palettes = {
  normal:['#497b3f','#72a34b','#a3bd67'],oak:['#35633a','#568848','#96ac5b'],willow:['#507958','#7aa66b','#a4c58a'],
  birch:['#6d9452','#9bb362','#c8cc86'],maple:['#ad5138','#d17745','#edac62'],yew:['#2d6653','#4f8d63','#8bb37d'],
  magic:['#5d4e96','#8c76be','#c4b2e2'],elder:['#3e7863','#73a995','#c0d5a8'],gloomwood:['#3f345b','#68527e','#a28aaf']
};
function tree(p,id) {
  const colors=palettes[id]||palettes.normal, bark=id==='birch'?'#e0d7b9':'#8b5b3d';
  p.poly([[20,18],[27,16],[28,38],[34,43],[25,42],[20,44],[13,43],[20,37]],dark(bark));
  p.poly([[21,19],[25,18],[25,37],[28,41],[22,40]],bark);
  p.line(23,28,13,18,bark);p.line(25,30,35,17,bark);
  p.line(22,29,22,36,light(bark,.32));p.line(25,33,25,38,dark(bark,.45));
  p.ellipse(24,32,2,3,dark(bark,.5));p.dot(23,31,light(bark,.3));
  if(id==='birch')for(let y=25;y<39;y+=4)p.rect(21,y,4,1,'#635448');
  const lumps=id==='willow'?[[13,14,10,10],[24,9,12,9],[35,15,9,11],[23,19,14,10]]:[[12,18,9,7],[19,10,10,8],[30,10,10,8],[36,18,8,8],[25,19,13,9]];
  for(const [x,y,rx,ry]of lumps)p.ellipse(x,y,rx,ry,colors[0]);
  for(const [x,y,rx,ry]of lumps)p.ellipse(x-2,y-2,Math.max(3,rx-2),Math.max(3,ry-2),colors[1]);
  for(let i=0;i<27;i++){const x=7+(i*13)%34,y=5+(i*7)%20;if(p.get(x,y)&&p.get(x,y)!==bark&&p.get(x,y)!==dark(bark)){p.rect(x,y,2,1,i%3?colors[1]:colors[2]);}}
  // Leaf clusters use the finer grid for lit edges, folded leaves and gaps.
  for(const [x,y]of [[12,11],[22,7],[31,10],[8,18],[18,18],[30,19],[36,17],[24,24]]) {
    p.ellipse(x,y,4,2,colors[0]);p.line(x-3,y-1,x,y-2,colors[2]);p.line(x,y-1,x+3,y-1,colors[1]);p.dot(x+2,y,colors[2]);
  }
  p.line(14,8,19,6,colors[2]);p.rect(27,5,4,1,colors[2]);p.rect(7,15,3,1,colors[2]);
  if(id==='willow')for(const [x,y]of[[5,19],[10,23],[34,22],[40,19]]){p.line(x,y,x-1,y+10,colors[0]);p.line(x+1,y+1,x,y+7,colors[1]);}
  if(['magic','gloomwood'].includes(id))for(const [x,y]of[[9,10],[32,13],[21,6]]){p.dot(x,y,CREAM);p.line(x-1,y+1,x+1,y+1,colors[2]);}
  p.line(21,34,21,39,light(bark,.5));p.line(26,25,27,30,dark(bark,.5));p.dot(24,27,light(bark,.35));
  p.line(14,44,17,40,'#8aa75a');p.line(33,44,36,41,'#b1b66f');
}
function log(p,col='#97663e') {
  p.poly([[7,17],[28,7],[41,22],[20,34]],dark(col));
  p.poly([[8,17],[28,9],[38,20],[20,29]],col);
  p.line(11,17,28,11,light(col));p.line(16,21,32,14,dark(col));p.line(23,24,35,18,dark(col));
  p.ellipse(17,29,11,10,'#6d452d');p.ellipse(17,28,9,8,'#deb578');p.ellipse(17,28,6,5,'#a77946');p.ellipse(17,28,4,3,'#ecc68d');p.ellipse(17,28,1,1,'#9c693c');p.line(19,31,23,34,'#865934');
}
function rock(p,col='#b5b7b7',ore=true) {
  p.poly([[5,36],[9,21],[19,15],[31,17],[42,30],[40,40],[14,42]],'#59666a');
  p.poly([[10,22],[20,16],[28,19],[22,30],[6,35]],'#8d9893');
  p.poly([[23,30],[29,19],[41,30],[36,37]],'#707d7d');
  p.poly([[8,36],[21,31],[36,38],[15,40]],'#46575a');
  p.line(20,17,19,22,'#b1b7a8');p.line(23,29,19,33,'#33484a');
  if(ore)for(const [x,y]of[[13,26],[26,23],[32,32],[20,35]]){p.poly([[x,y-3],[x+4,y-1],[x+3,y+3],[x-2,y+1]],dark(col,.25));p.rect(x,y-1,3,3,col);p.dot(x,y-2,light(col,.55));}
  else {p.poly([[14,27],[23,19],[31,24],[28,35],[18,38],[11,33]],col);p.line(15,27,22,21,light(col));p.line(18,35,27,32,dark(col));}
}
function fish(p,id,col='#9cafb5') {
  if(id.includes('shrimp')) {
    p.poly([[34,13],[26,10],[18,14],[14,22],[16,31],[23,35],[32,32],[36,25],[31,25],[27,29],[22,28],[21,23],[25,19],[33,20]],'#af644b');
    p.poly([[32,14],[26,13],[20,17],[18,24],[20,29],[25,32],[31,29],[28,28],[24,30],[21,26],[22,21],[28,18],[33,18]],'#eea67a');
    p.line(18,20,23,22,'#f6c39a');p.line(18,25,22,27,'#f6c39a');p.line(22,30,24,33,'#824f3d');p.line(28,17,41,9,'#b16d50');p.line(29,18,42,15,'#b16d50');p.dot(32,15,'#211d1a');p.poly([[33,27],[41,26],[37,34],[31,34]],'#cf7757');
    return;
  }
  const long=/eel|pike|shark|sword/.test(id);
  p.poly([[5,23],[1,16],[3,31],[11,28]],dark(col));
  p.ellipse(25,24,long?18:15,long?6:9,dark(col));p.ellipse(25,22,long?16:13,long?5:7,col);
  p.poly([[19,16],[23,9],[28,17]],dark(col));p.poly([[22,29],[28,35],[30,28]],dark(col));
  p.line(15,19,31,17,light(col,.45));p.line(34,21,33,27,dark(col));p.dot(37,21,INK);p.dot(36,20,'#f8f5d9');
  for(let y=22;y<28;y+=2)for(let x=15;x<31;x+=4)if(p.get(x,y))p.dot(x+(y%4),y,light(col,.3));
  if(id==='swordfish')p.line(39,24,47,22,col);
}
function bird(p,id,col) {
  const chicken=id==='chicken', small=['toast','stormchick'].includes(id), owl=['quill'].includes(id);
  if(owl){
    p.poly([[13,20],[11,7],[20,12],[29,12],[38,7],[35,26]],dark(col));p.ellipse(24,29,13,14,col);p.ellipse(24,20,14,12,col);
    for(const x of[18,30]){p.ellipse(x,19,6,7,'#e9daba');p.ellipse(x,19,3,4,'#514b3a');p.dot(x-1,17,CREAM);}p.poly([[22,24],[26,24],[24,29]],'#bc944d');
    for(let y=30;y<39;y+=3)for(let x=17;x<33;x+=4)p.line(x,y,x+1,y+1,dark(col,.3));p.line(13,29,16,38,light(col));p.line(35,29,32,38,dark(col));p.rect(17,42,5,2,'#ad884d');p.rect(28,42,5,2,'#ad884d');return;
  }
  const c=chicken?'#eee5cf':col;
  p.poly([[29,25],[39,12],[43,13],[42,24],[35,30]],dark(c));
  p.poly([[29,24],[38,14],[40,16],[36,25]],light(c,.22));
  p.ellipse(23,28,14,11,dark(c));p.ellipse(21,26,13,10,c);
  p.ellipse(14,15,7,9,c);p.ellipse(13,13,5,6,light(c,.3));
  p.ellipse(23,28,7,6,dark(c,.2));for(let i=0;i<4;i++)p.line(19+i*3,26,21+i*2,31,light(c,.28));
  p.poly([[9,15],[3,18],[9,20]],'#df9d38');p.dot(12,13,INK);p.dot(11,12,'#ffffff');
  p.rect(17,37,2,6,'#cc8b39');p.rect(29,37,2,6,'#cc8b39');p.line(14,43,21,43,'#d9a653');p.line(27,43,34,43,'#d9a653');
  if(chicken){p.ellipse(13,5,2,3,'#d4563f');p.ellipse(17,6,2,3,'#df6551');p.ellipse(11,22,2,3,'#bc4539');}
  if(owl){p.ellipse(13,14,6,5,'#eee2b8');p.dot(11,14,INK);p.dot(16,14,INK);p.poly([[7,7],[10,3],[13,8]],dark(c));}
  if(id==='hawk'||id==='zephyrion'){p.poly([[17,21],[38,4],[43,6],[32,25]],c);p.line(27,14,39,8,light(c));}
  if(small){p.ellipse(22,28,10,9,light(col,.18));p.ellipse(15,17,8,8,col);p.dot(13,16,INK);p.poly([[9,18],[3,20],[9,22]],'#d68731');}
  if(id==='zephyrion'||id==='stormchick'){p.line(20,7,26,2,'#f2dc6b');p.line(26,2,23,10,'#f2dc6b');}
}
function quad(p,id,col) {
  const cow=id==='cow', sheep=id==='sheep', pig=id==='pig', tusks=['boar','oldtusk'].includes(id), wolf=['wolf','icewolf','hound','biscuit','whiskers'].includes(id);
  const base=cow?'#e5dfcc':sheep?'#e9e3d3':col;
  p.ellipse(27,26,16,10,dark(base));p.ellipse(26,23,15,9,base);p.ellipse(24,21,11,6,light(base,.16));
  for(const [x,y]of[[17,30],[30,31],[37,29]]){p.rect(x,y,4,12,dark(base,.12));p.rect(x,40,5,3,wolf?'#534738':'#3b3330');p.line(x,y+2,x,38,light(base,.15));}
  p.poly([[14,11],[6,11],[3,18],[3,27],[12,29],[18,22],[17,16]],base);
  p.poly([[6,12],[4,5],[10,10]],dark(base));p.poly([[13,12],[15,6],[18,15]],dark(base));
  p.dot(7,18,INK);p.dot(7,17,CREAM);p.rect(2,24,8,4,pig||cow?'#d89088':dark(base,.45));
  p.line(40,24,44,14,dark(base));p.dot(44,13,dark(base));
  if(cow){for(const [x,y]of[[20,19],[30,23],[35,26]])p.ellipse(x,y,3,3,'#51483f');p.line(5,10,3,6,'#e5cfa7');p.line(13,10,16,6,'#e5cfa7');p.rect(24,32,6,3,'#d89088');}
  if(sheep)for(let i=0;i<13;i++)p.ellipse(15+(i*7)%25,18+(i*3)%12,3,3,i%3?'#f4f0df':'#d0ccbc');
  if(tusks){p.poly([[5,27],[2,31],[1,22]],'#eee0ba');p.poly([[11,28],[8,32],[6,24]],'#eee0ba');for(let x=17;x<37;x+=4)p.poly([[x,16],[x+1,11],[x+3,16]],dark(base,.35));}
  if(id==='goat'){p.line(5,10,7,3,'#ad936d');p.line(12,10,14,2,'#ad936d');p.poly([[4,28],[6,35],[9,27]],'#ab9470');}
  if(wolf){
    p.poly([[3,19],[0,21],[0,24],[9,27],[12,21]],base);p.rect(0,22,3,2,'#3b3730');
    for(const [x,y]of [[18,20],[24,21],[29,22],[34,24],[26,28],[20,29]])p.line(x,y,x+2,y+1,light(base,.3));
    p.poly([[8,25],[14,30],[15,20]],light(base,.5));p.line(20,18,31,18,light(base,.35));}
  if(id==='whiskers'){p.line(2,25,0,23,'#eee1cf');p.line(3,26,0,28,'#eee1cf');}
  if(id==='oldtusk'){p.poly([[20,13],[21,7],[25,11],[29,7],[31,15]],'#d5aa4a');p.ellipse(8,20,2,1,'#e7ac4b');}
}
function humanoid(p,id,col) {
  const goblin=['goblin','grubnash','gobbo'].includes(id), brute=['grubnash','troll','frostmaw','golem','emberlord','voidknight','hollowking'].includes(id);
  const skin=id==='golem'?col:goblin?'#7aa45f':id==='zombie'?'#96aa80':['troll','frostmaw'].includes(id)?col:'#d8ad86';
  const robe=['morwenna','cultist','monk'].includes(id), armor=['raider','voidknight','emberlord','hollowking','armoury','fireguard'].includes(id);
  const cloth=armor?col:robe?dark(col):'#856644';
  p.rect(16,33,6,10,dark(cloth));p.rect(27,33,6,10,dark(cloth));p.rect(13,41,9,3,'#514035');p.rect(27,41,9,3,'#514035');
  p.poly([[15,21],[32,21],[35,33],[29,37],[16,35],[12,28]],cloth);
  p.poly([[13,23],[8,25],[7,35],[11,36],[16,28]],skin);p.poly([[33,23],[38,25],[40,35],[36,36],[31,28]],dark(skin,.15));
  p.ellipse(24,14,brute?11:8,10,skin);p.ellipse(21,12,brute?8:6,7,light(skin,.12));
  if(goblin){p.poly([[16,9],[6,7],[10,16],[17,18]],skin);p.poly([[32,9],[42,7],[38,16],[31,18]],skin);p.line(10,10,14,13,dark(skin));}
  else{p.poly([[15,8],[19,3],[30,4],[34,12],[28,9],[23,7],[16,11]],'#654b36');p.rect(15,10,2,4,'#654b36');}
  p.rect(18,13,3,2,'#2f3029');p.rect(27,13,3,2,'#2f3029');p.dot(18,13,CREAM);p.dot(27,13,CREAM);
  p.line(24,14,23,18,dark(skin,.24));p.line(20,20,27,20,'#714c3c');
  if(goblin||brute){p.dot(21,20,CREAM);p.dot(26,20,CREAM);}
  p.line(18,25,18,30,light(cloth,.2));p.rect(15,31,18,3,'#514333');p.rect(24,31,3,3,'#ccaa5b');
  if(armor){p.poly([[15,24],[24,21],[33,24],[30,31],[18,31]],light(col,.2));p.line(24,23,24,30,dark(col));for(const x of[18,30])p.dot(x,25,CREAM);}
  if(robe){p.poly([[17,29],[32,29],[37,43],[11,43]],cloth);p.line(21,32,18,41,light(cloth));p.line(29,32,32,41,dark(cloth));p.line(6,17,6,43,'#88613e');p.ellipse(6,16,3,3,'#aebdba');}
  if(['morwenna','cultist','monk'].includes(id))p.poly([[12,8],[24,0],[35,10],[28,8],[19,7]],cloth);
  if(id==='scarecrow'){p.rect(2,25,44,3,'#8c6642');p.poly([[10,9],[14,6],[17,2],[29,2],[33,9]],'#b99a53');p.rect(10,9,25,3,'#ba9b54');p.rect(20,18,8,2,'#60422e');for(let x=20;x<29;x+=3)p.line(x,17,x,21,INK);}
  if(id==='grubnash'||id==='hollowking'){p.poly([[14,8],[12,1],[19,5],[24,0],[28,5],[35,1],[33,9]],'#ceb05e');p.dot(24,4,'#d77251');}
  if(brute){p.rect(37,24,3,19,'#846246');p.poly([[34,23],[36,13],[43,16],[43,24]],armor?'#bbc3c0':'#958d7c');p.line(35,22,40,17,'#e3dcc0');}
  if(id==='frostmaw'){p.line(14,6,11,0,'#bdedee');p.line(34,6,38,0,'#bdedee');p.rect(15,21,18,5,'#dee8df');}
  if(id==='emberlord'){p.poly([[15,7],[12,0],[20,5],[24,0],[30,6],[36,1],[34,12]],'#eb9d4c');}
  if(id==='golem'){for(const [x,y]of[[16,25],[26,28],[19,37]])p.line(x,y,x+3,y+3,dark(col,.5));p.rect(18,14,3,2,'#c5e1a1');p.rect(27,14,3,2,'#c5e1a1');}
}
function dragon(p,id,col) {
  p.poly([[19,24],[4,4],[2,25],[15,20],[17,33]],dark(col));p.poly([[19,23],[7,10],[7,23],[15,19]],light(col,.2));
  p.poly([[25,26],[39,7],[46,29],[36,24],[29,35]],dark(col));p.line(39,10,36,24,light(col,.2));
  p.ellipse(25,32,11,9,col);p.ellipse(26,32,6,7,light(col,.25));
  p.line(15,35,5,39,col);p.line(5,39,1,35,col);
  p.poly([[25,30],[27,17],[35,10],[42,13],[44,19],[37,23],[33,33]],col);p.poly([[34,20],[44,20],[41,24],[35,23]],dark(col));
  p.dot(36,14,CREAM);p.dot(37,14,INK);p.poly([[32,11],[32,4],[36,10]],'#e3ca99');
  p.line(18,38,13,44,dark(col));p.line(30,38,36,44,dark(col));p.rect(10,43,8,2,'#d7c79b');p.rect(33,43,8,2,'#d7c79b');
  for(const [x,y]of[[20,27],[22,23],[25,19],[27,15]])p.poly([[x,y],[x-2,y-4],[x+3,y-2]],light(col,.4));
  for(let y=28;y<37;y+=3)p.line(23,y,28,y,dark(col,.2));
}
function smallCreature(p,id,col) {
  if(['rat','acorn','nugget'].includes(id)){
    if(id==='acorn'){p.ellipse(37,20,8,14,dark(col));p.ellipse(36,16,5,9,light(col));p.ellipse(38,18,2,5,col);}
    else {p.line(36,34,44,36,'#cf9b97');p.line(44,36,46,30,'#cf9b97');}
    p.ellipse(24,31,14,8,col);p.ellipse(21,28,9,6,light(col,.18));p.ellipse(13,24,7,7,col);p.ellipse(13,18,4,4,dark(col));p.ellipse(13,18,2,2,'#cb9a87');p.dot(9,24,INK);p.dot(9,23,CREAM);p.rect(5,28,4,2,'#c1817e');p.line(6,29,1,27,'#e0c6af');p.rect(13,38,6,3,'#b49176');p.rect(30,37,6,3,'#b49176');return;
  }
  if(['bat','imp'].includes(id)){
    p.poly([[23,21],[8,10],[2,17],[1,31],[8,26],[13,32],[18,28],[23,35]],col);p.poly([[25,21],[40,10],[46,17],[47,31],[40,26],[35,32],[30,28],[25,35]],col);
    p.line(7,14,18,27,light(col,.25));p.line(41,14,30,27,light(col,.25));p.ellipse(24,26,6,10,dark(col));p.ellipse(24,18,7,7,col);p.poly([[17,16],[17,7],[22,13]],col);p.poly([[26,13],[31,7],[31,16]],col);p.dot(21,18,'#efcf7b');p.dot(27,18,'#efcf7b');p.dot(22,23,CREAM);p.dot(26,23,CREAM);return;
  }
  if(id==='crab'||id==='horror'){
    for(const sx of[-1,1]){for(let i=0;i<3;i++){p.line(24+sx*12,28+i*3,24+sx*(20+i),30+i*5,dark(col));}p.line(24+sx*13,24,24+sx*18,14,col);p.ellipse(24+sx*18,11,4,7,col);p.line(24+sx*18,5,24+sx*17,12,dark(col));}
    p.ellipse(24,29,15,9,dark(col));p.ellipse(23,26,14,7,col);p.line(17,22,16,16,dark(col));p.line(30,22,31,16,dark(col));p.dot(16,15,CREAM);p.dot(31,15,CREAM);p.dot(16,16,INK);p.dot(31,16,INK);p.line(17,25,27,23,light(col,.4));return;
  }
  p.poly([[11,39],[11,16],[15,8],[24,5],[33,10],[38,20],[36,39],[30,35],[25,41],[20,36],[14,41]],col);
  p.poly([[14,17],[19,9],[26,8],[19,19],[17,32],[13,36]],light(col,.35));p.ellipse(20,20,2,3,INK);p.ellipse(29,20,2,3,INK);p.ellipse(25,29,3,4,dark(col,.5));
  if(id==='cinder')p.poly([[15,15],[13,3],[20,9],[26,1],[30,12],[38,7],[36,23]],'#f0bd65');
}
function skeleton(p) {
  const bone='#ded5ba',shade='#a79b7f';
  p.ellipse(24,12,10,9,bone);p.ellipse(20,12,3,4,'#343331');p.ellipse(29,12,3,4,'#343331');p.poly([[24,15],[22,18],[25,18]],'#6a604f');
  p.rect(19,19,12,4,bone);for(let x=21;x<31;x+=3)p.line(x,19,x,22,'#796e59');
  p.rect(23,24,3,14,bone);for(let y=26;y<35;y+=3){p.line(15,y,33,y,bone);p.dot(15,y+1,shade);p.dot(33,y+1,shade);}
  p.line(14,26,9,35,bone);p.line(9,35,8,40,bone);p.line(34,26,39,35,bone);p.line(39,35,40,40,bone);p.rect(17,37,15,3,bone);
  p.line(19,40,17,46,bone);p.line(29,40,31,46,bone);p.rect(13,46,6,1,bone);p.rect(30,46,6,1,bone);
}
function chest(p,col) {p.rect(7,23,34,18,'#724e35');p.poly([[7,22],[9,13],[38,13],[41,23]],col);p.rect(9,24,30,13,col);p.rect(12,14,3,26,'#d8b465');p.rect(33,14,3,26,'#d8b465');p.rect(21,22,7,8,'#e1bc6b');p.rect(24,25,2,3,INK);p.line(9,17,37,17,light(col));}
function item(p,it) {
  const id=it.id,c=it.col||'#b49b6c';
  if(id.startsWith('log_'))return log(p,c);
  if(id.startsWith('ore_'))return rock(p,c,false);
  if(id.startsWith('bar_')){p.poly([[7,23],[27,15],[41,25],[21,34]],light(c,.2));p.poly([[7,23],[21,30],[21,37],[7,30]],dark(c));p.poly([[21,30],[41,23],[41,30],[21,37]],c);p.line(10,23,25,18,light(c,.5));return;}
  if(id.startsWith('raw_')||it.type==='raw'||D.FISH_IDS.includes(id))return fish(p,id,c);
  if(it.type==='food'){p.ellipse(24,35,19,7,'#c0b49a');p.ellipse(24,33,17,6,'#ece0be');if(id==='bread'){p.ellipse(24,24,14,9,'#a96c35');p.ellipse(23,21,14,8,'#d6a85c');for(let x=15;x<34;x+=7)p.line(x,16,x-2,24,'#f5d79b');}else{fish(p,id,c);p.line(17,22,22,26,'#dbbb81');}return;}
  if(it.type==='gem'){p.poly([[10,14],[19,8],[32,8],[39,16],[24,40]],dark(c));p.poly([[11,14],[19,10],[25,17],[24,35]],light(c,.4));p.poly([[25,17],[32,10],[37,16],[24,35]],c);p.line(11,16,36,16,light(c,.6));p.dot(17,13,'#ffffff');return;}
  if(it.type==='container'||id.includes('chest'))return chest(p,c);
  if(it.type==='potion'||id==='rune'){p.rect(20,6,8,5,'#8c6947');p.rect(19,11,10,7,'#b9d6cc');p.ellipse(24,30,13,12,'#abc6be');p.ellipse(24,32,10,8,c);p.line(17,24,16,32,'#f8f0cd');p.rect(22,8,5,1,light(c));return;}
  if(it.type==='seed'||it.type==='supply'){p.poly([[14,15],[33,15],[38,38],[33,42],[14,42],[9,37]],'#ba9960');p.rect(16,11,15,6,'#e0c58c');p.line(18,13,31,13,'#755b3c');p.ellipse(24,29,6,8,c);p.line(24,24,24,34,dark(c));return;}
  if(it.type==='crop'||it.type==='produce'){p.ellipse(23,29,11,11,c);p.ellipse(20,26,7,7,light(c,.2));p.line(24,20,25,9,'#5e8249');p.ellipse(19,14,6,3,'#8aa359');p.ellipse(29,12,5,3,'#597d48');return;}
  if(id.includes('hide')||id.includes('pelt')||id==='leather'){p.poly([[11,10],[19,13],[29,10],[37,13],[33,21],[39,30],[30,37],[26,43],[17,39],[11,31],[7,25],[14,18]],c);p.line(16,19,19,31,light(c));p.line(27,16,30,30,dark(c));return;}
  if(it.type==='tool'){p.line(12,40,32,13,'#9a7044');p.line(13,40,33,13,'#c29a5d');p.poly([[23,10],[31,8],[42,19],[38,24],[29,18]],'#9faeaf');p.line(25,10,39,20,'#d9ded1');return;}
  if(id==='feather'){p.poly([[12,38],[15,16],[29,7],[36,9],[33,22],[20,34]],'#d7d4ba');p.line(12,42,31,12,'#9c947b');for(let y=18;y<32;y+=4)p.line(17,y,26,y-3,'#f3eacb');return;}
  p.ellipse(24,27,12,13,c);p.ellipse(21,23,8,8,light(c));p.line(18,18,25,19,light(c,.5));p.line(27,31,30,27,dark(c));
}
const birdIds=new Set(['chicken','hawk','zephyrion','toast','stormchick','quill']);
const quadIds=new Set(['cow','boar','wolf','oldtusk','icewolf','hound','biscuit','whiskers','sheep','pig','goat']);
const dragonIds=new Set(['bogsnapper','drake','pyrrhax','wyvern']);
const smallIds=new Set(['rat','acorn','nugget','bat','imp','crab','horror','wraith','shade','bogwisp','cinder','hollowling']);
const canvases=new Map(),urls=new Map();
function creature(id,col) {
  const p=painter();
  if(birdIds.has(id))bird(p,id,col);
  else if(quadIds.has(id))quad(p,id,col);
  else if(dragonIds.has(id))dragon(p,id,col);
  else if(id==='skeleton')skeleton(p);
  else if(id==='bubbles')fish(p,id,col);
  else if(smallIds.has(id))smallCreature(p,id,col);
  else if(id==='bees'){p.ellipse(24,28,13,15,'#d8ad58');for(let y=18;y<40;y+=5)p.line(13,y,35,y,'#8d6434');p.ellipse(24,31,4,5,'#493e2b');for(const[x,y]of[[9,10],[35,8]]){p.ellipse(x,y-2,3,2,'#d9e5dc');p.ellipse(x,y+1,3,2,'#e2ba4b');p.dot(x,y+1,INK);}}
  else humanoid(p,id,col);
  return p.canvas();
}
DQ.artCanvas = (kind,id) => {
  const key=kind+':'+id;if(canvases.has(key))return canvases.get(key);
  const p=painter();let cv;
  if(kind==='creature'){const m=D.MON[id]||D.PET[id]||D.ANIMAL[id];cv=creature(id,m?.col||'#889b73');}
  else if(kind==='wood'){tree(p,id);cv=p.canvas();}
  else if(kind==='mine'){const n=D.NODE['mine:'+id];rock(p,n?.col||'#aab9ba');cv=p.canvas();}
  else if(kind==='fish'){const n=D.NODE['fish:'+id];fish(p,id,n?.col||D.ITEMS['raw_'+id]?.col||'#91a9af');cv=p.canvas();}
  else if(kind==='thieve'){if(['hoard','vault','market','merchant','witch'].includes(id))chest(p,'#a18052');else humanoid(p,id,'#6b8c8b');cv=p.canvas();}
  else if(kind==='plant'){const [stage,color]=id.split('|'),c=color||'#b5bc66';p.ellipse(24,41,18,4,'#72563e');p.line(24,40,24,30-Number(stage)*6,'#5d8146');for(let i=0;i<Number(stage);i++){p.ellipse(18,34-i*6,7,3,'#83a05b');p.ellipse(30,31-i*6,7,3,'#547a43');}if(Number(stage)===3)for(const[x,y]of[[18,23],[30,28],[24,15]])p.ellipse(x,y,4,5,c);cv=p.canvas();}
  else {const it=D.ITEMS[id];if(it)item(p,it);cv=p.canvas();}
  canvases.set(key,cv);return cv;
};
DQ.artUrl=(kind,id)=>{const key=kind+':'+id;if(!urls.has(key))urls.set(key,DQ.artCanvas(kind,id).toDataURL());return urls.get(key);};
DQ.artImage=(kind,id,size=96,cls='',alt='')=>`<img class="px art-sprite ${cls}" src="${DQ.artUrl(kind,id)}" width="${size}" height="${size}" alt="${DQ.esc(alt)}" data-native-pixels="48" draggable="false">`;
DQ.monSprite=(m,size=96,cls='')=>DQ.artImage('creature',m.id,size,cls,m.name);
DQ.petSprite=(p,size=48,cls='')=>DQ.artImage('creature',p.id,size,cls,p.name);
DQ.animalSprite=(a,size=96,cls='')=>DQ.artImage('creature',a.id==='hen'?'chicken':a.id,size,cls,a.name);
DQ.plantSprite=(stage,col,size=96,cls='')=>DQ.artImage('plant',stage+'|'+col,size,cls,'Crop growth stage '+stage);
/* Unique drops and later armour sets also receive full-colour 64px icons. */
const originalGear=DQ.gearIconUrl,extraGear=new Map();
DQ.gearIconUrl=id=>{
  const known=originalGear(id);if(known)return known;
  const it=D.ITEMS[id];if(!it?.slot)return null;if(extraGear.has(id))return extraGear.get(id);
  const p=painter(64,64),c=it.col||'#a7b6b0',hi=light(c,.35),lo=dark(c,.3),gold='#d7b86e';
  if(it.slot==='weapon'){
    if(it.style==='magic'){p.poly([[15,56],[19,58],[45,14],[41,12]],'#8c6743');p.ellipse(44,12,9,10,gold);p.ellipse(44,11,6,7,c);p.dot(42,8,CREAM);p.line(40,20,48,18,gold);}
    else if(it.style==='ranged'){p.poly([[16,7],[23,10],[35,24],[36,37],[24,53],[15,57],[20,50],[29,34],[27,23],[19,12]],c);p.line(15,8,15,56,'#ddd7bd');p.rect(26,27,5,11,gold);p.line(14,32,47,32,'#98764d');p.poly([[48,32],[41,28],[41,36]],hi);}
    else {p.poly([[17,45],[43,9],[52,6],[51,17],[26,51]],c);p.line(24,42,47,12,hi);p.line(27,47,50,17,lo);p.poly([[13,38],[17,36],[35,50],[32,54]],gold);p.line(13,53,22,44,'#957044');p.line(14,55,23,46,'#c99f5b');p.ellipse(11,57,3,3,gold);}
  }else if(it.slot==='body'){
    p.poly([[10,14],[24,8],[40,8],[54,14],[58,28],[49,32],[47,56],[17,56],[15,32],[6,28]],lo);
    p.poly([[14,15],[23,12],[28,19],[36,19],[42,12],[50,16],[45,30],[44,53],[20,53],[19,30]],c);
    p.line(24,14,29,20,hi);p.line(36,20,41,14,hi);p.line(32,22,32,46,lo);p.rect(18,43,28,4,gold);p.rect(29,42,7,6,lo);
    if(id.startsWith('robe')){p.poly([[22,33],[42,33],[48,57],[16,57]],c);p.line(25,36,21,54,hi);p.line(39,36,43,54,lo);}else{p.line(22,23,27,30,hi);p.line(40,23,35,30,hi);for(const[x,y]of[[19,17],[45,17],[22,48],[42,48]])p.dot(x,y,CREAM);}
  }else if(it.slot==='legs'){
    p.poly([[16,9],[48,9],[49,27],[43,57],[33,57],[32,29],[29,57],[17,57],[14,27]],lo);p.rect(18,12,12,14,c);p.rect(34,12,11,14,c);p.poly([[19,28],[28,27],[25,54],[18,54]],c);p.poly([[35,28],[44,27],[41,54],[35,54]],c);p.line(21,15,21,24,hi);p.line(38,15,38,24,hi);p.rect(16,10,32,3,gold);
  }else if(it.slot==='head'){
    p.poly([[12,25],[15,13],[25,6],[39,6],[49,15],[53,29],[48,48],[38,55],[25,55],[14,47]],lo);p.poly([[17,24],[20,14],[28,10],[37,10],[44,17],[48,29],[42,34],[22,34]],c);p.line(22,18,28,13,hi);p.rect(21,29,22,8,'#3c3b38');p.rect(30,27,4,20,c);p.line(16,43,24,50,hi);p.line(40,50,48,42,lo);p.dot(32,17,CREAM);
  }else if(it.slot==='shield'){
    p.poly([[8,12],[32,4],[56,12],[51,42],[32,59],[13,42]],gold);p.poly([[12,16],[32,9],[51,16],[47,39],[32,53],[17,39]],c);p.line(32,13,32,48,hi);p.line(17,27,47,27,gold);p.ellipse(32,27,4,4,lo);
  }else {p.ellipse(32,35,14,17,gold);p.ellipse(32,35,10,13,null);p.poly([[32,7],[44,18],[32,29],[20,18]],c);p.line(24,17,32,10,hi);p.line(32,20,40,18,lo);p.dot(29,14,CREAM);}
  const url=p.canvas().toDataURL();extraGear.set(id,url);return url;
};

const oldItem=DQ.itemIco;
DQ.itemIco=it=>it ? (DQ.gearIco(it.id)||DQ.artImage('item',it.id,48,'item-art',it.name)) : oldItem(it);
DQ.artResolution={creatures:48,resources:48,equipment:64};
/* Full figure redrawn on a 48 × 68 grid, including equipped armour and weapons. */
const heroCache=new Map();
function heroFigure(look) {
  const o=DQ.heroLook(look||DQ.S.look), key=JSON.stringify(o);if(heroCache.has(key))return heroCache.get(key);
  const p=painter(48,68), eq=o.eq,skin=o.skin||'#ddb38e',hair=o.hair||'#785538';
  const body=eq.body?D.ITEMS[eq.body].col:o.tunic||'#528eab', legs=eq.legs?D.ITEMS[eq.legs].col:'#655545';
  if(o.aura)for(const[x,y]of[[4,19],[43,28],[8,53],[39,58]]){p.dot(x,y,'#e7d187');p.dot(x+1,y+1,'#fff0c2');}
  if(o.cape){const c=o.cape.col||'#738451';p.poly([[13,25],[35,25],[41,59],[9,59]],dark(c));p.line(10,58,39,58,'#dcb866');}
  p.rect(13,45,9,18,legs);p.rect(26,45,9,18,dark(legs,.13));p.line(15,47,15,60,light(legs,.2));p.line(29,48,29,61,light(legs,.12));
  p.rect(10,61,13,4,'#4a3d30');p.rect(26,61,13,4,'#4a3d30');p.rect(11,61,10,1,'#8d7652');p.rect(27,61,10,1,'#8d7652');
  p.poly([[13,25],[34,25],[38,44],[31,48],[15,48],[10,42]],body);p.poly([[13,26],[9,26],[5,35],[8,39],[13,34]],light(body,.17));p.poly([[34,26],[38,26],[42,35],[39,40],[34,34]],dark(body,.16));
  p.rect(6,37,5,7,skin);p.rect(37,37,5,7,dark(skin,.1));p.line(7,40,7,42,light(skin,.25));
  p.line(16,30,16,42,light(body,.22));p.line(31,29,33,43,dark(body));p.rect(13,44,22,3,'#6c5035');p.rect(23,44,4,3,'#d4ad5a');
  if(eq.body){p.poly([[16,28],[24,25],[32,28],[31,35],[18,35]],light(body,.15));p.line(24,27,24,35,dark(body));for(const x of[18,30])p.dot(x,29,CREAM);p.line(18,39,30,39,light(body));}
  else{p.line(22,27,24,31,light(body,.6));p.line(24,31,27,27,light(body,.6));p.rect(17,35,3,3,dark(body,.1));}
  p.rect(20,21,9,6,skin);p.ellipse(24,15,11,11,skin);p.ellipse(21,13,8,8,light(skin,.12));p.ellipse(13,16,2,4,skin);p.ellipse(35,16,2,4,dark(skin,.14));
  p.poly([[13,11],[13,6],[20,2],[30,3],[35,8],[35,14],[31,10],[25,7],[18,9],[16,14]],hair);p.line(17,6,23,4,light(hair,.35));p.line(27,5,32,8,light(hair,.2));
  p.rect(17,13,4,3,'#f6e9d3');p.rect(27,13,4,3,'#f6e9d3');p.rect(19,14,2,2,'#2e2923');p.rect(27,14,2,2,'#2e2923');p.dot(18,13,'#ffffff');p.dot(27,13,'#ffffff');
  p.line(24,15,23,19,dark(skin,.16));p.rect(21,22,7,1,'#a86251');p.line(19,24,29,24,dark(skin,.1));
  if(eq.head){const c=D.ITEMS[eq.head].col;p.poly([[13,11],[14,6],[20,2],[29,2],[34,6],[35,12]],c);p.line(16,6,22,3,light(c,.6));p.line(14,11,34,11,dark(c,.4));p.rect(13,12,2,8,c);p.rect(33,12,2,8,dark(c));p.dot(24,5,light(c,.6));}
  if(eq.shield){const c=D.ITEMS[eq.shield].col;p.poly([[1,34],[11,31],[17,36],[14,48],[7,53],[1,46]],c);p.poly([[3,36],[10,34],[14,37],[12,46],[7,50],[3,45]],light(c,.18));p.line(8,35,8,47,dark(c));p.dot(7,39,CREAM);}
  if(eq.weapon){const it=D.ITEMS[eq.weapon],c=it.col||'#bbc4c5';
    if(it.style==='ranged'){p.line(41,18,45,25,'#a77c4d');p.line(45,25,46,35,'#a77c4d');p.line(46,35,41,48,'#a77c4d');p.line(41,18,41,48,'#d5cfb1');}
    else if(it.style==='magic'){p.rect(42,17,2,35,'#8c6743');p.ellipse(43,14,4,5,c);p.dot(42,12,CREAM);}
    else {p.poly([[42,16],[45,11],[46,39],[42,40]],c);p.line(44,17,44,37,light(c,.45));p.rect(39,40,8,2,'#c4a15d');p.rect(42,42,3,8,'#755039');p.rect(42,49,3,2,'#c4a15d');}}
  if(o.heroLvl>=10){p.line(20,28,24,33,'#c6ab65');p.line(29,28,24,33,'#c6ab65');p.ellipse(24,34,2,3,o.heroLvl>=50?'#e4c968':'#c39c62');p.dot(24,33,CREAM);}
  const cv=p.canvas();heroCache.set(key,cv);return cv;
}
DQ.heroFigureUrl=look=>heroFigure(look).toDataURL();
DQ.heroBustUrl=look=>{const c=document.createElement('canvas');c.width=c.height=48;c.getContext('2d').drawImage(heroFigure(look),0,0);return c.toDataURL();};
DQ.heroUrl=look=>DQ.heroBustUrl(look);
DQ.heroCanvas=(look,scale=1)=>{const c=document.createElement('canvas');c.width=48*scale;c.height=68*scale;const x=c.getContext('2d');x.imageSmoothingEnabled=false;x.drawImage(heroFigure(look),0,0,c.width,c.height);return c;};

})();
