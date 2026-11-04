/* High-resolution painted hero compositing and smooth battle silhouettes. */
(() => {
const Q=window.DQ,D=Q.data,UI=Q.ui;
const hero=new Image(),heroCache=new Map(),gearCache=new Map();let loaded=false;
const oldCanvas=Q.heroCanvas,oldHero=Q.heroFigureUrl,oldWork=Q.heroWorkFigureUrl,oldBust=Q.heroBustUrl,oldFoe=Q.battleFoe,oldBattle=Q.battleHero,oldPose=Q.poseBattle,oldGear=Q.gearIconUrl;
const rgb=hex=>[1,3,5].map(i=>parseInt((hex||'#b2a68f').slice(i,i+2),16));
function tinted(source,colour,strength=.45){const c=document.createElement('canvas');c.width=source.width;c.height=source.height;const x=c.getContext('2d');x.drawImage(source,0,0);const im=x.getImageData(0,0,c.width,c.height),v=rgb(colour),mean=(v[0]+v[1]+v[2])/3;for(let i=0;i<im.data.length;i+=4){if(!im.data[i+3])continue;const l=(im.data[i]+im.data[i+1]+im.data[i+2])/3;for(let k=0;k<3;k++)im.data[i+k]=im.data[i+k]*(1-strength)+Math.min(255,l*v[k]/Math.max(40,mean))*strength;}x.putImageData(im,0,0);return c;}
function gear(id){if(gearCache.has(id))return gearCache.get(id);const it=D.ITEMS[id],index=Q.paintedGearIndex(id);if(index<0)return null;const raw=Q.paintedCanvas('equipment',index);if(!raw)return null;const c=tinted(raw,it.col);gearCache.set(id,c);return c;}
Q.gearIconUrl=id=>gear(id)?.toDataURL()||oldGear(id);
const draw=Q.artImage;Q.artImage=(kind,id,size=96,cls='',alt='')=>{const c=kind==='item'&&gear(id);return c?`<img class="painted-image ${cls}" src="${Q.gearIconUrl(id)}" width="${size}" height="${size}" alt="${Q.esc(alt||D.ITEMS[id].name)}" draggable="false">`:draw(kind,id,size,cls,alt);};
/* Fitted armour: Codex's painted head/body/leg layers, drawn onto the hero's own pose instead of inventory icons.
   Metal tiers share a band (bronze/iron, steel/mithril, adamant/runite, astral) and keep their own colour through a light tint;
   every coif uses the leather hood. Robes, leather bodies and legs, and unique pieces keep the earlier painted equipment. */
const BAND={bronze:'bronze-iron',iron:'bronze-iron',steel:'steel-mithril',mithril:'steel-mithril',adamant:'adamant-rune',rune:'adamant-rune',astral:'astral'};
const FIT_SHEET={head:'hero-head-layers',body:'hero-body-layers',legs:'hero-leg-layers'};
const fitId=(slot,id)=>{if(!id)return null;const m=/^([a-z]+)_(helm|body|legs)$/.exec(id);if(m&&BAND[m[1]])return slot+'-'+BAND[m[1]];return slot==='head'&&/_coif$/.test(id)?'head-leather':null;};
const layerCache=new Map();
/* trimmed, tinted layer plus its measurements: alpha bounds and, for helmets, the brim row and face opening */
function layer(slot,id){
 const fid=fitId(slot,id);if(!fid||!Q.completionCrop)return null;const key=fid+':'+id;if(layerCache.has(key))return layerCache.get(key);
 const raw=Q.completionCrop(FIT_SHEET[slot],fid);if(!raw)return null;
 const W=raw.width,H=raw.height,a=raw.getContext('2d').getImageData(0,0,W,H).data,on=(x,y)=>a[(y*W+x)*4+3]>60;
 let x0=W,x1=0,y0=H,y1=0;for(let y=0;y<H;y++)for(let x=0;x<W;x++)if(on(x,y)){if(x<x0)x0=x;if(x>x1)x1=x;if(y<y0)y0=y;if(y>y1)y1=y;}
 const c=document.createElement('canvas');c.width=x1-x0+1;c.height=y1-y0+1;c.getContext('2d').drawImage(raw,x0,y0,c.width,c.height,0,0,c.width,c.height);
 const L={c:tinted(c,D.ITEMS[id].col,.3),w:c.width,h:c.height};
 if(slot==='head'){
  /* the brim is the first row, below the widest part of the dome, where the face opening appears */
  const runs=y=>{const r=[];let s=-1;for(let x=x0;x<=x1+1;x++){const v=x<=x1&&on(x,y);if(v&&s<0)s=x;if(!v&&s>=0){if(x-s>3)r.push([s,x-1]);s=-1;}}return r;};
  let brim=-1;for(let y=y0+Math.round((y1-y0)*.2);y<y1;y++){const r=runs(y);if(r.length>=2&&r[r.length-1][0]-r[0][1]>(x1-x0)*.25){brim=y;break;}}
  if(brim<0)brim=y0+Math.round((y1-y0)*.45);
  const r=runs(brim),gapL=r[0][1],gapR=r[r.length-1][0];L.brim=brim-y0;L.outer=r[r.length-1][1]-r[0][0];L.gapC=(gapL+gapR)/2-x0;L.left=r[0][0]-x0;
 }
 layerCache.set(key,L);return L;
}
/* helmet: about 108px across at the brim, brim just above the eyes, face opening centred on the face, dome kept on the canvas */
function fitHead(x,L){const sx=108/L.outer,sy=Math.min(sx,49/Math.max(1,L.brim)),w=L.w*sx,h=L.h*sy;x.drawImage(L.c,189-L.gapC*sx,50-L.brim*sy,w,h);}
function fitBody(x,L){x.drawImage(L.c,93,104,198,226);}
/* legs: the painted stance is wider than the hero's, so columns are remapped piecewise to bring each leg over the hero's */
function fitLegs(x,L){const k=[[0,102],[.452,184],[.541,196],[1,281]],top=300,h=274;
 for(let dx=102;dx<281;dx++){let i=0;while(i<k.length-2&&dx>=k[i+1][1])i++;const [s0,d0]=k[i],[s1,d1]=k[i+1],sx=(s0+(dx+.5-d0)/(d1-d0)*(s1-s0))*L.w;x.drawImage(L.c,Math.min(L.w-1,Math.max(0,sx)),0,1,L.h,dx,top,1,h);}}
function figure(look,work=false){
 if(!loaded)return null;const o=Q.heroLook(look||Q.S.look),fit={},eq0=o.eq||{};for(const slot of ['legs','body','head'])if(eq0[slot]&&layer(slot,eq0[slot]))fit[slot]=layer(slot,eq0[slot]);const key=JSON.stringify([o,work,Object.keys(fit)]);if(heroCache.has(key))return heroCache.get(key);
 const c=document.createElement('canvas');c.width=384;c.height=576;const x=c.getContext('2d'),eq={...o.eq};if(work){delete eq.weapon;delete eq.shield;}
 if(o.cape&&!work){const cape=Q.paintedCanvas('equipment',22);if(cape)x.drawImage(tinted(cape,o.cape.col),77,105,230,375);}
 const body=document.createElement('canvas');body.width=384;body.height=576;const b=body.getContext('2d');b.drawImage(hero,0,0,384,576);
 /* Worn, not stacked: under armour the tunic becomes a dark padded layer, trousers under greaves likewise, and a helmet hides the hair. */
 const under=(hex,dark,t)=>{const a=rgb(hex);return a.map((v,i)=>Math.round(v*(1-t)+dark[i]*t));};
 const handPx=[],im=b.getImageData(0,0,384,576),shirt=eq.body?under(D.ITEMS[eq.body].col,[46,40,36],.68):rgb(o.tunic),skin=rgb(o.skin),hair=rgb(o.hair),legsUnder=eq.legs?under(D.ITEMS[eq.legs].col,[42,36,32],.7):null,fullHelm=!fit.head&&!!eq.head&&Q.paintedGearIndex(eq.head)===10,lining=[38,33,30]; /* a fitted helmet or hood turns the hair into its dark lining; old full helms hide it; other hoods keep it */
 for(let y=0;y<576;y++)for(let xx=0;xx<384;xx++){const i=(y*384+xx)*4;if(!im.data[i+3])continue;const r=im.data[i],g=im.data[i+1],bl=im.data[i+2];let colour=null,base=1;
  if(y>115&&y<325&&bl>r*1.08&&bl>g*.98){colour=shirt;base=125;}
  else if(y<71&&xx>130&&xx<250&&r>g*1.1&&r<150){if(fullHelm){im.data[i+3]=0;continue;}colour=fit.head&&!(xx>158&&xx<224&&y>40)?lining:hair;base=96;}
  else if(((y>45&&y<140&&xx>144&&xx<237)||(y>185&&y<342&&(xx<132||xx>250)))&&r>g*1.12&&g>bl*1.12){colour=skin;base=180;}
  else if(legsUnder&&y>=322&&y<=(fit.legs?572:500)&&xx>105&&xx<280&&r>g*1.2&&g>bl*1.1){colour=legsUnder;base=110;}
  if(colour){const lum=(r*.3+g*.5+bl*.2)/base;for(let k=0;k<3;k++)im.data[i+k]=Math.min(255,colour[k]*lum);}
  if(colour===skin&&y>250)handPx.push(i);
 }
 b.putImageData(im,0,0);x.drawImage(body,0,0);
 const wear=(slot,left,top,w,h)=>{const a=eq[slot]&&gear(eq[slot]);if(a)x.drawImage(a,left,top,w,h);};
 if(fit.legs)fitLegs(x,fit.legs);else wear('legs',114,305,156,218);
 if(fit.body){fitBody(x,fit.body);
  /* hands stay in front of the painted sleeves and skirt */
  const hands=document.createElement('canvas');hands.width=384;hands.height=576;const hx=hands.getContext('2d'),hd=hx.createImageData(384,576);for(const i of handPx)for(let k=0;k<4;k++)hd.data[i+k]=im.data[i+k];hx.putImageData(hd,0,0);x.drawImage(hands,0,0);}
 else wear('body',104,107,176,217);
 if(fit.head)fitHead(x,fit.head);
 else{wear('head',139,12,108,105);
  // Keep the actual face visible inside the older open helmets and hoods.
  if(eq.head)x.drawImage(body,163,49,60,48,163,49,60,48);}
 wear('shield',60,215,108,139);wear('weapon',233,169,130,204);
 if(o.heroLvl>=10&&!work){x.fillStyle=o.heroLvl>=50?'#ddbd6c':'#af804b';x.beginPath();x.arc(191,163,5,0,Math.PI*2);x.fill();}
 heroCache.set(key,c);if(heroCache.size>80)heroCache.delete(heroCache.keys().next().value);return c;
}
Q.heroCanvas=(look,scale=1)=>{const f=figure(look);if(!f)return oldCanvas(look,scale);const c=document.createElement('canvas');c.width=48*scale;c.height=68*scale;c.getContext('2d').drawImage(f,0,0,c.width,c.height);return c;};
Q.heroFigureUrl=look=>figure(look)?.toDataURL()||oldHero(look);
Q.heroWorkFigureUrl=look=>figure(look,true)?.toDataURL()||oldWork(look);
Q.heroBustUrl=look=>{const f=figure(look);if(!f)return oldBust(look);const c=document.createElement('canvas');c.width=c.height=128;c.getContext('2d').drawImage(f,125,10,135,135,0,0,128,128);return c.toDataURL();};
Q.heroUrl=Q.heroBustUrl;
UI.portrait=(size=48,cls='')=>`<span class="portrait painted-portrait ${cls}" style="width:${size}px;height:${size}px"><img src="${Q.heroBustUrl(Q.S.look)}" width="${size}" height="${size}" alt="Your hero"></span>`;
Q.battleHero=()=>loaded?`<span class="battle-rig hero-rig painted-hero encounter-hero rig-${Q.weaponStyle()}" role="img" aria-label="Your equipped hero"><span class="rig-torso"><img src="${Q.heroFigureUrl(Q.S.look)}" alt="" draggable="false"></span></span>`:oldBattle();
Q.battleFoe=m=>Q.paintedRef('creature',m.id)?`<span class="battle-rig foe-rig painted-foe" role="img" aria-label="${Q.esc(m.name)} ready for battle" data-creature="${m.id}" data-body="${D.EXTRA_CREATURES[m.id]?.body||'beast'}"><span class="foe-torso">${Q.artImage('creature',m.id,192,'',m.name)}</span></span>`:oldFoe(m);
Q.poseBattle=(avatar,style,phase,animate)=>{const root=avatar?.querySelector('.painted-hero');if(!root)return oldPose(avatar,style,phase,animate);if(Q.S.settings.reduceFx)return true;const attack=phase==='attack',direction=attack?1:-1;animate(root,[{transform:'translateX(0) rotate(0)'},{transform:`translateX(${-direction*5}px) rotate(${-direction*3}deg)`,offset:.25},{transform:`translateX(${direction*13}px) rotate(${direction*4}deg)`,offset:.54},{transform:'translateX(0) rotate(0)'}],{duration:attack?Q.battleTiming.duration:340,easing:'ease-in-out'});return true;};
const source='assets/painted/hero-atlas.png';
const ready=new Promise(resolve=>{hero.onload=()=>{loaded=true;resolve();};hero.onerror=resolve;hero.src=source;});
Promise.all([ready,Q.paintedReady]).then(()=>{if(Q.started){UI.renderHud();UI.render(false);}});
})();
