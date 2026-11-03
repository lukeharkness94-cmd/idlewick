const fs=require('fs'),vm=require('vm'),assert=require('assert/strict');
const {createCanvas,ImageData,loadImage}=require('@napi-rs/canvas');
const root=require('path').resolve(__dirname,'..')+'/';
const q=require(root+'tests/harness.js');q.S=q.newState();
const ctx=vm.createContext({window:{DQ:q},document:{createElement:()=>createCanvas(1,1)},ImageData,console});
vm.runInContext(fs.readFileSync(root+'js/creatures_expanded.js','utf8'),ctx,{filename:'creatures_expanded'});
for(const f of['gear','pixel','sprites24','herogear','art48','art_identity','icons48'])vm.runInContext(fs.readFileSync(root+'js/'+f+'.js','utf8'),ctx,{filename:f});
q.ui={V:{},B:{},DO:{},tab:{},tabState:()=>null,render(){},detail(){return '';},selbarHtml(){return '';}};
q.tips={item:()=>''};q.goals=()=>[];
vm.runInContext(fs.readFileSync(root+'js/research.js','utf8'),ctx,{filename:'research'});
async function run(){
const originalCases=[['wood','normal'],['wood','oak'],['wood','willow'],['wood','maple'],['mine','copper'],['mine','tin'],['fish','shrimp'],['fish','trout'],...['chicken','rat','goblin','cow','grubnash','wolf','crab','drake','skeleton','morwenna','acorn','quill'].map(id=>['creature',id])];
const cases=[...q.data.NODES.fish.map(n=>['fish',n.id]),...q.data.NODES.wood.map(n=>['wood',n.id]),...q.data.SKILLS.map(n=>['skill',n.id]),...Object.values(q.data.ITEMS).filter(it=>it.type==='tool'||it.type==='potion'||it.type==='crop'||['bread','veg_stew','omelette','egg','milk','wool','honey'].includes(it.id)).map(it=>['item',it.id]),...originalCases.filter(([kind])=>kind==='creature')];
const canvas=createCanvas(1000,Math.ceil((cases.length+5)/5)*200),x=canvas.getContext('2d');x.fillStyle='#ede6d3';x.fillRect(0,0,canvas.width,canvas.height);x.imageSmoothingEnabled=false;
for(const [i,[kind,id]]of cases.entries()){const c=q.artCanvas(kind,id);assert.equal(c.width,48);assert.equal(c.height,48);const ox=i%5*200,oy=Math.floor(i/5)*200;x.drawImage(c,ox+28,oy+8,144,144);x.fillStyle='#342f27';x.font='16px sans-serif';x.fillText(id,ox+20,oy+180);}
for(const [j,id]of['bronze_sword','iron_body','bow_oak','ring_sapphire'].entries()){const i=cases.length+j;const u=q.gearIconUrl(id);assert.ok(u);const image=await loadImage(Buffer.from(u.split(',')[1],'base64'));assert.equal(image.width,64);x.drawImage(image,i%5*200+36,Math.floor(i/5)*200+10,128,128);x.fillText(id,i%5*200+12,Math.floor(i/5)*200+180);}
if(process.env.ART_PREVIEW)fs.writeFileSync(process.env.ART_PREVIEW,canvas.toBuffer('image/png'));
for(const m of q.data.MONLIST)assert.ok(q.artUrl('creature',m.id));
for(const [kind,nodes]of Object.entries(q.data.NODES))for(const n of nodes)assert.ok(q.artUrl(kind,n.id));
const drawings=new Map();
for(const it of Object.values(q.data.ITEMS)){
 assert.ok(q.itemIco(it));
 const url=q.gearIconUrl(it.id)||q.artUrl('item',it.id);
 assert.ok(!drawings.has(url),`${it.id} shares its drawing with ${drawings.get(url)}`);
 drawings.set(url,it.id);
}
for(const kind of ['fish','wood','mine','thieve']){
 const silhouettes=new Map();
 for(const n of q.data.NODES[kind]){
  const cv=q.artCanvas(kind,n.id),rgba=cv.getContext('2d').getImageData(0,0,48,48).data;
  const silhouette=Array.from({length:48*48},(_,i)=>rgba[i*4+3]?'1':'0').join('');
  assert.ok(!silhouettes.has(silhouette),`${kind} ${n.id} shares a silhouette with ${silhouettes.get(silhouette)}`);
  silhouettes.set(silhouette,n.id);
 }
}
const iconImages=new Map();
for(const name of Object.keys(q.ICONS)){
 const icon=q.uiIconCanvas(name);assert.ok(!iconImages.has(icon.toDataURL()),`${name} repeats ${iconImages.get(icon.toDataURL())}`);iconImages.set(icon.toDataURL(),name);assert.equal(icon.width,48,`${name} icon width`);assert.equal(icon.height,48);
 const data=icon.getContext('2d').getImageData(0,0,48,48).data;
 assert.ok(data.some((value,i)=>i%4===3&&value>0),`${name} icon is empty`);
}
if(process.env.ICON_PREVIEW){
 const sheet=createCanvas(960,Math.ceil(iconImages.size/8)*100),cx=sheet.getContext('2d');
 cx.fillStyle='#eee6d2';cx.fillRect(0,0,sheet.width,sheet.height);cx.imageSmoothingEnabled=false;
 Object.keys(q.ICONS).forEach((name,i)=>{const x=i%8*120,y=Math.floor(i/8)*100;cx.drawImage(q.uiIconCanvas(name),x+36,y+8,48,48);cx.fillStyle='#342f27';cx.font='12px sans-serif';cx.fillText(name,x+8,y+78);});
 fs.writeFileSync(process.env.ICON_PREVIEW,sheet.toBuffer('image/png'));
}
console.log(`${Object.keys(q.ICONS).length} native 48px UI icons render without fallback drawings.`);
const creatures=new Map();
for(const id of new Set([...q.data.MONLIST,...q.data.PETS,...q.data.ANIMALS].map(x=>x.id))){
 const url=q.artUrl('creature',id);
 assert.ok(!creatures.has(url),`${id} shares a drawing with ${creatures.get(url)}`);creatures.set(url,id);
}
console.log(`${drawings.size} inventory items have distinct drawings; fish, trees, ores and thieving targets have distinct silhouettes.`);
console.log('All creatures, resource nodes and items render; native 48px art and 64px equipment verified.');

const hero=q.heroCanvas(q.S.look);assert.equal(hero.width,48);assert.equal(hero.height,68);
}
run().catch(e=>{console.error(e);process.exitCode=1;});
