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
function figure(look,work=false){
 if(!loaded)return null;const o=Q.heroLook(look||Q.S.look),key=JSON.stringify([o,work]);if(heroCache.has(key))return heroCache.get(key);
 const c=document.createElement('canvas');c.width=384;c.height=576;const x=c.getContext('2d'),eq={...o.eq};if(work){delete eq.weapon;delete eq.shield;}
 if(o.cape&&!work){const cape=Q.paintedCanvas('equipment',22);if(cape)x.drawImage(tinted(cape,o.cape.col),77,105,230,375);}
 const body=document.createElement('canvas');body.width=384;body.height=576;const b=body.getContext('2d');b.drawImage(hero,0,0,384,576);
 const im=b.getImageData(0,0,384,576),shirt=rgb(eq.body?D.ITEMS[eq.body].col:o.tunic),skin=rgb(o.skin),hair=rgb(o.hair);
 for(let y=0;y<576;y++)for(let xx=0;xx<384;xx++){const i=(y*384+xx)*4;if(!im.data[i+3])continue;const r=im.data[i],g=im.data[i+1],bl=im.data[i+2];let colour=null,base=1;
  if(y>115&&y<325&&bl>r*1.08&&bl>g*.98){colour=shirt;base=125;}
  else if(y<71&&xx>130&&xx<250&&r>g*1.1&&r<150){colour=hair;base=96;}
  else if(((y>45&&y<112&&xx>144&&xx<237)||(y>185&&y<342&&(xx<132||xx>250)))&&r>g*1.12&&g>bl*1.12){colour=skin;base=180;}
  if(colour){const lum=(r*.3+g*.5+bl*.2)/base;for(let k=0;k<3;k++)im.data[i+k]=Math.min(255,colour[k]*lum);}
 }
 b.putImageData(im,0,0);x.drawImage(body,0,0);
 const wear=(slot,left,top,w,h)=>{const a=eq[slot]&&gear(eq[slot]);if(a)x.drawImage(a,left,top,w,h);};
 wear('legs',114,305,156,218);wear('body',104,107,176,217);wear('head',139,12,108,105);
 // Keep the actual face visible inside open helmets and coifs.
 if(eq.head)x.drawImage(body,163,49,60,48,163,49,60,48);
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
