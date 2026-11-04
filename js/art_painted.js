/* Painted atlases. Images are referenced once, rather than repeated in every card. */
(() => {
const Q=window.DQ,D=Q.data,base=Q.artImage;
const sheets={
 fish:{url:'assets/painted/fish-atlas.png',cols:5,rows:3,ids:'shrimp sardine herring trout salmon tuna lobster swordfish monkfish shark anglerfish carp pike skyfin voideel'.split(' ')},
 wood:{url:'assets/painted/tree-atlas.png',cols:3,rows:3,ids:'normal oak willow maple yew magic birch elder gloomwood'.split(' ')},
 creatures:{url:'assets/painted/creatures-atlas.png',cols:6,rows:7,ids:D.MONLIST.filter(m=>!D.EXTRA_CREATURES[m.id]).map(m=>m.id)},
 wildlife:{url:'assets/painted/wildlife-atlas.png',cols:4,rows:8,ids:Object.keys(D.EXTRA_CREATURES)},
 companions:{url:'assets/painted/companions-atlas.png',cols:5,rows:4,ids:'biscuit toast bubbles acorn nugget whiskers cinder quill pudding gobbo tusky bill frostling bogwisp wyrmling stormchick hollowling sheep goat hen'.split(' ')},
 tools:{url:'assets/painted/tools-atlas.png',cols:5,rows:5,ids:['rod','axe','pick','gloves','hoe'].flatMap(k=>[1,2,3,4,5].map(t=>`tool_${k}_${t}`))},
 menu:{url:'assets/painted/menu-atlas.png',cols:5,rows:5,ids:'fishing woodcutting mining thieving farming cooking smithing crafting magic hunting exploration herbalism enchanting attack home quest map shop bag gear bell coin sound pin clock'.split(' ')},
 equipment:{url:'assets/painted/equipment-atlas.png',cols:5,rows:5,ids:[]},
 townsfolk:{url:'assets/painted/townsfolk-atlas.png',cols:4,rows:4,ids:'villager farmer dockhand merchant dwarf armoury cultist witch fireguard hoard farmhand market monk vault sheep pig'.split(' ')}
};
// Browsers limit custom-property token size. Embedded PNGs become short local blob URLs.
for(const s of Object.values(sheets))if(s.url.startsWith('data:')){
 const bytes=Uint8Array.from(atob(s.url.slice(s.url.indexOf(',')+1)),ch=>ch.charCodeAt(0));
 s.url=URL.createObjectURL(new Blob([bytes],{type:'image/png'}));
}
Q.paintedSheets=sheets;
const menuAliases={research:'quest',book:'quest',rune:'enchanting',sword:'attack',strength:'attack',defence:'attack',ranged:'hunting',rod:'fishing',glove:'thieving',hoe:'farming',hammer:'smithing',bottle:'herbalism',mute:'sound',house:'home',bank:'bag',scroll:'quest',compass:'exploration',users:'bag',paw:'hunting'};
Q.ICONS.research=Q.ICONS.book;
Q.paintedGearIndex=id=>{
 const it=D.ITEMS[id];if(!it||it.type!=='gear')return -1;
 if(id==='bronze_sword')return 0;
 if(it.slot==='weapon'){if(it.style==='magic')return 9;if(it.style==='ranged')return /normal|oak/.test(id)?7:8;return /dagger/.test(id)?2:/hammer/.test(id)?4:/bronze/.test(id)?1:3;}
 if(it.slot==='shield')return /wood|bronze/.test(id)?5:6;
 if(it.slot==='ring')return 20;if(it.slot==='amulet')return 21;
 const robe=/robe|mystic|mage/.test(id),leather=/leather|frost|bog|drake/.test(id);
 return it.slot==='head'?(robe?17:leather?14:10):it.slot==='body'?(robe?18:leather?15:/chain/.test(id)?11:12):it.slot==='legs'?(robe?19:leather?16:13):-1;
};
Q.paintedRef=(kind,id)=>{
 if(kind==='creature'){id=id.replace(/^wild_/,'');for(const name of ['creatures','wildlife','companions','townsfolk']){const i=sheets[name].ids.indexOf(id);if(i>=0)return {name,index:i};}}
 if(kind==='thieve'){const i=sheets.townsfolk.ids.indexOf(id);if(i>=0)return {name:'townsfolk',index:i};}
 if(kind==='skill'||kind==='icon'){const i=sheets.menu.ids.indexOf(menuAliases[id]||id);if(i>=0)return {name:'menu',index:i};}
 if(kind==='item'){if(id.startsWith('raw_'))return Q.paintedRef('fish',id.slice(4));const i=sheets.tools.ids.indexOf(id);if(i>=0)return {name:'tools',index:i};const g=Q.paintedGearIndex(id);if(g>=0)return {name:'equipment',index:g};}
 if(sheets[kind]){const i=sheets[kind].ids.indexOf(id);if(i>=0)return {name:kind,index:i};}
 return null;
};
const sprite=(ref,size,cls,alt)=>{const s=sheets[ref.name],i=ref.index;return `<span class="painted-sprite ${cls}" role="img" aria-label="${Q.esc(alt)}" style="width:${size}px;height:${size}px;background-image:var(--atlas-${ref.name});background-size:${s.cols*100}% ${s.rows*100}%;background-position:${i%s.cols*100/(s.cols-1)}% ${Math.floor(i/s.cols)*100/(s.rows-1)}%"></span>`;};
Q.artImage=(kind,id,size=96,cls='',alt='')=>{const ref=Q.paintedRef(kind,id);return ref?sprite(ref,size,cls,alt||id):base(kind,id,size,cls,alt);};
const oldItem=Q.itemIco;Q.itemIco=it=>it&&Q.paintedRef('item',it.id)?Q.artImage('item',it.id,48,'item-art',it.name):oldItem(it);
const oldGear=Q.gearIco;Q.gearIco=(id,cls='')=>Q.paintedGearIndex(id)>=0?Q.artImage('item',id,48,'gico '+cls,D.ITEMS[id].name):oldGear(id,cls);
const style=document.createElement('style');
style.textContent=':root{'+Object.entries(sheets).map(([name,s])=>`--atlas-${name}:url('${s.url}');`).join('')+'}'+Object.keys(Q.ICONS).map(id=>{const ref=Q.paintedRef('icon',id);if(!ref)return '';const s=sheets[ref.name],i=ref.index;return `.pxi-${id}{background-image:var(--atlas-${ref.name})!important;background-size:${s.cols*100}% ${s.rows*100}%!important;background-position:${i%s.cols*100/(s.cols-1)}% ${Math.floor(i/s.cols)*100/(s.rows-1)}%!important;image-rendering:auto!important}`;}).join('');document.head.appendChild(style);
const images={},cache=new Map();
Q.paintedCanvas=(name,index)=>{
 const key=name+':'+index;if(cache.has(key))return cache.get(key);const s=sheets[name],im=images[name];if(!im?.complete||!im.naturalWidth)return null;
 const c=document.createElement('canvas');c.width=c.height=256;const x=c.getContext('2d'),w=im.width/s.cols,h=im.height/s.rows;
 x.drawImage(im,index%s.cols*w,Math.floor(index/s.cols)*h,w,h,0,0,256,256);cache.set(key,c);return c;
};
Q.paintedReady=Promise.all(Object.entries(sheets).map(([name,s])=>new Promise(resolve=>{const im=images[name]=new Image();im.onload=()=>resolve(true);im.onerror=()=>resolve(false);im.src=s.url;})));
})();
