const fs=require('fs'),vm=require('vm'),assert=require('assert/strict');
const {createCanvas,ImageData,loadImage}=require('@napi-rs/canvas');
const root=require('path').resolve(__dirname,'..')+'/';
const q=require(root+'tests/harness.js');q.S=q.newState();
const ctx=vm.createContext({window:{DQ:q},document:{createElement:()=>createCanvas(1,1)},ImageData,console});
for(const f of['gear','pixel','sprites24','herogear','art48'])vm.runInContext(fs.readFileSync(root+'js/'+f+'.js','utf8'),ctx,{filename:f});
async function run(){
const cases=[['wood','normal'],['wood','oak'],['wood','willow'],['wood','maple'],['mine','copper'],['mine','tin'],['fish','shrimp'],['fish','trout'],...['chicken','rat','goblin','cow','grubnash','wolf','crab','drake','skeleton','morwenna','acorn','quill'].map(id=>['creature',id])];
const canvas=createCanvas(1000,Math.ceil((cases.length+5)/5)*200),x=canvas.getContext('2d');x.fillStyle='#ede6d3';x.fillRect(0,0,canvas.width,canvas.height);x.imageSmoothingEnabled=false;
for(const [i,[kind,id]]of cases.entries()){const c=q.artCanvas(kind,id);assert.equal(c.width,48);assert.equal(c.height,48);const ox=i%5*200,oy=Math.floor(i/5)*200;x.drawImage(c,ox+28,oy+8,144,144);x.fillStyle='#342f27';x.font='16px sans-serif';x.fillText(id,ox+20,oy+180);}
for(const [j,id]of['bronze_sword','iron_body','bow_oak','ring_sapphire'].entries()){const i=cases.length+j;const u=q.gearIconUrl(id);assert.ok(u);const image=await loadImage(Buffer.from(u.split(',')[1],'base64'));assert.equal(image.width,64);x.drawImage(image,i%5*200+36,Math.floor(i/5)*200+10,128,128);x.fillText(id,i%5*200+12,Math.floor(i/5)*200+180);}
if(process.env.ART_PREVIEW)fs.writeFileSync(process.env.ART_PREVIEW,canvas.toBuffer('image/png'));
for(const m of q.data.MONLIST)assert.ok(q.artUrl('creature',m.id));
for(const [kind,nodes]of Object.entries(q.data.NODES))for(const n of nodes)assert.ok(q.artUrl(kind,n.id));
for(const it of Object.values(q.data.ITEMS))assert.ok(q.itemIco(it));
console.log('All creatures, resource nodes and items render; native 48px art and 64px equipment verified.');

const hero=q.heroCanvas(q.S.look);assert.equal(hero.width,48);assert.equal(hero.height,68);
}
run().catch(e=>{console.error(e);process.exitCode=1;});
