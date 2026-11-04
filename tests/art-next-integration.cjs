/* Headless renderer checks using the same optional canvas dependency as art-completion.cjs. */
const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path'),assert=require('node:assert/strict');
const {createCanvas,Image}=require('@napi-rs/canvas');
const root=path.resolve(__dirname,'..'),manifest=JSON.parse(fs.readFileSync(path.join(root,'docs/art-completion/manifest.json')));
const relics=manifest.sets.find(s=>s.id==='relics').entries.map(e=>e.id);
const cropIds=['potato','onion','cabbage','wheat','strawberry','pumpkin','goldleaf','sunbloom','moonmelon','starfruit'];
const projects=['well','inn','forge','garden','library','watchtower','bell','lamps','star'];
const blobs=[];
const Q={data:{ITEMS:Object.fromEntries(relics.map(id=>[id,{id,name:id}])),CROPS:cropIds.map((id,col)=>({id,name:id,col})),PROJECTS:Object.fromEntries(projects.map(id=>[id,{town:'willowbrook'}]))},ui:{},S:{projects:{}},ICONS:{},esc:s=>s,itemIco:()=> 'fallback',artImage:()=> 'fallback',plantSprite:()=> 'fallback',animalSprite:()=> 'fallback',ico:()=> 'fallback',sceneUrl:()=> 'fallback'};
class LocalImage extends Image {set src(v){super.src=path.join(root,v)}get src(){return super.src}}
const context=vm.createContext({window:{DQ:Q},document:{createElement:tag=>tag==='canvas'?createCanvas(1,1):{},head:{appendChild(){}}},Image:LocalImage,setTimeout:()=>1,URL:{createObjectURL:b=>{blobs.push(b);return 'blob:test-'+blobs.length}},Blob,Uint8Array,atob});
for(const f of ['art_completion_map','art_completion'])vm.runInContext(fs.readFileSync(path.join(root,'js/'+f+'.js'),'utf8'),context);
async function loaded(sheet,trigger){trigger();for(let i=0;i<100&&!Q.artCompletionReady(sheet);i++)await new Promise(r=>setTimeout(r,20));assert(Q.artCompletionReady(sheet),sheet+' loaded');}
(async()=>{
 await loaded('workers',()=>Q.workerArt('woodcutting'));
 assert.match(Q.workerArt('woodcutting'),/data:image\/png/);assert.match(Q.workerArt('woodcutting'),/woodcutting worker/);
 await loaded('relics',()=>Q.itemIco(Q.data.ITEMS.weathered_map));for(const id of relics){assert.equal(Q.completionItemSheet(id),'relics');assert.match(Q.itemIco(Q.data.ITEMS[id]),/data:image\/png/);}
 await loaded('farm-growth',()=>Q.plantSprite(0,0));for(let col=0;col<10;col++)for(let stage=0;stage<3;stage++)assert.match(Q.plantSprite(stage,col),/data:image\/png/);
 await loaded('landscapes',()=>Q.sceneUrl('willowbrook'));await loaded('restoration',()=>{});await loaded('restoration-willowbrook',()=>{});
 const before=Q.sceneUrl('willowbrook');Q.S.projects=Object.fromEntries(projects.map(id=>[id,true]));const after=Q.sceneUrl('willowbrook');assert.notEqual(before,after);assert.equal(after,Q.sceneUrl('willowbrook'));
 const pieces=manifest.sets.find(s=>s.id==='restoration-willowbrook').entries;
 for(const e of pieces){const p=e.place,[,,w,h]=e.rect;const half=w/h*p.h/6;assert(p.x-half>=0&&p.x+half<=1,e.id+' inside landscape');assert(p.base<=.72||p.x+half<=.30||p.x-half>=.70,e.id+' leaves action area clear');}
 if(process.env.ART_NEXT_PREVIEW){fs.mkdirSync(process.env.ART_NEXT_PREVIEW,{recursive:true});for(const [label,url]of [['before',before],['after',after]])fs.writeFileSync(path.join(process.env.ART_NEXT_PREVIEW,'willowbrook-'+label+'.jpg'),Buffer.from(await blobs[Number(url.split('-').pop())-1].arrayBuffer()));}
 console.log('PASS new worker lookup, six relics, 30 growth render cases, restoration cache/state and action-area placement');
})().catch(e=>{console.error(e);process.exitCode=1});
