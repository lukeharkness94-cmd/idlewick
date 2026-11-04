/* Optional image QA: npm install --no-save @napi-rs/canvas; node tests/art-completion.cjs */
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const {createCanvas,loadImage}=require('@napi-rs/canvas');
const root=path.resolve(__dirname,'..');
const manifest=JSON.parse(fs.readFileSync(path.join(root,'docs/art-completion/manifest.json')));
(async()=>{
 let total=0; const names=new Set();
 for(const s of manifest.sets){
  assert(!names.has(s.id));names.add(s.id);
  assert(s.file.startsWith('assets/art-completion/')&&!s.file.includes('..'));
  const bytes=fs.readFileSync(path.join(root,s.file));
  assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'),s.sha256,s.id+' checksum');
  const im=await loadImage(path.join(root,s.file)),cv=createCanvas(im.width,im.height),ctx=cv.getContext('2d');ctx.drawImage(im,0,0);
  assert.equal(im.width,s.width);assert.equal(im.height,s.height);
  assert(s.entries.length<=s.cols*s.rows);assert.equal(new Set(s.entries.map(e=>e.id)).size,s.entries.length);
  const cellW=im.width/s.cols,cellH=im.height/s.rows;
  assert(Math.abs(cellW/cellH-(s.cellAspect||(s.transparent?1:3)))<0.06,s.id+' cell aspect');
  const preview=createCanvas(s.cols*160,s.rows*190),p=preview.getContext('2d');
  for(let i=0;i<s.entries.length;i++){
   const [x,y,rw,rh]=s.entries[i].rect;
   assert(x>=0&&y>=0&&x+rw<=im.width&&y+rh<=im.height);
   const pixels=ctx.getImageData(x,y,rw,rh).data;
   let visible=0,clear=0;for(let a=3;a<pixels.length;a+=4){if(pixels[a]>32)visible++;if(pixels[a]<8)clear++;}
   assert(visible>100,s.id+'/'+s.entries[i].id+' empty');
   if(s.transparent)assert(clear>pixels.length/4*.05,s.id+' transparency');
   const px=i%s.cols*160,py=Math.floor(i/s.cols)*190;
   p.fillStyle=i%2?'#18272d':'#eee7d7';p.fillRect(px,py,160,190);
   p.drawImage(im,x,y,rw,rh,px+16,py+8,128,s.transparent?128:128/3);
   p.fillStyle=i%2?'#eee7d7':'#302d26';p.font='12px sans-serif';p.fillText(s.entries[i].id,px+6,py+158,148);
  }
  if(process.env.ART_PACK_PREVIEW){fs.mkdirSync(process.env.ART_PACK_PREVIEW,{recursive:true});fs.writeFileSync(path.join(process.env.ART_PACK_PREVIEW,s.id+'.png'),preview.toBuffer('image/png'));}
  total+=s.entries.length;console.log('PASS',s.id,s.entries.length);
 }
 assert.equal(total,285);assert.equal(names.size,17);console.log('PASS 285 assets: decode, checksum, grid, identity and alpha checks');
})().catch(e=>{console.error(e);process.exitCode=1});
