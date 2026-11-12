/* A playable farm, composed from the existing plot/animal controls and original code-drawn scenery. */
(() => {
const Q=window.DQ,D=Q.data,UI=Q.ui,A=Q.pixelArt,{esc,ico}=Q;
if(A){A.farmEstateSprite=()=>{const s=A.Spr(320,180),grass=A.ramp('#6e9856'),soil=A.ramp('#775137'),path=A.ramp('#baa06c'),wood=A.R.wood;
 s.rect(0,0,320,180,grass);s.rect(0,64,320,14,path);s.rect(150,60,16,120,path);
 s.rect(12,90,126,78,soil);for(let y=96;y<168;y+=9)s.line(18,y,132,y,null,'#966845');
 s.rect(179,89,127,78,A.ramp('#85a663'));for(let x=176;x<310;x+=12){s.rect(x,84,3,10,wood);s.rect(x,164,3,10,wood);}s.rect(176,89,134,2,wood);s.rect(176,168,134,2,wood);
 s.rect(32,23,46,39,A.ramp('#b89365'));s.poly([[25,27],[55,5],[85,27]],A.ramp('#a4503d'));s.rect(47,40,15,22,wood);s.rect(37,33,6,7,A.ramp('#dfd4a4'));s.rect(67,33,6,7,A.ramp('#dfd4a4'));
 s.ell(261,36,31,13,A.ramp('#689fa8'));s.ell(258,34,22,7,A.ramp('#82b5bd'));for(const x of [100,125,174,204]){s.rect(x,36,3,24,wood);s.ell(x+1,32,12,14,A.ramp('#56804b'));}return s;};}
const original=UI.V.farming;UI.estateTab='seeds';UI.estateSection='fields';UI.estateFieldPage=0;UI.estatePenPage=0;
UI.V.farming=()=>{
 const h=original();if(!h.includes('farm-workspace'))return h;const tmp=document.createElement('template');tmp.innerHTML=h;
 const fields=tmp.content.querySelector('.farm-task'),animals=tmp.content.querySelector('.farm-animals');if(!fields||!animals)return h;
 const plots=fields.querySelector('.plots'),pens=animals.querySelector('.pens'),seeds=fields.querySelector('.seed-choices'),market=animals.querySelector('#livestock-market'),settings=fields.querySelector('#farm-settings');
 const page=(list,index,size)=>{const items=[...list.children],pages=Math.max(1,Math.ceil(items.length/size)),p=Math.min(index,pages-1);items.forEach((e,i)=>{e.hidden=Math.floor(i/size)!==p;});return {p,pages};};
 const buyPlot=plots.querySelector('.buyplot'),buyPen=pens.querySelector('.buypen');for(const b of [buyPlot,buyPen])if(b){b.remove();b.className='btn sm estate-expand';}
 const fp=page(plots,UI.estateFieldPage,innerWidth<=860?4:innerWidth<=1440?6:12),pp=page(pens,UI.estatePenPage,innerWidth<=860?2:innerWidth<=1440?4:6);

 const marketItems=[...(market?.querySelectorAll('.srow')||[])],mp=Math.min(UI.estateMarketPage||0,Math.max(0,Math.ceil(marketItems.length/(innerWidth<=860?3:4))-1));marketItems.forEach((e,i)=>e.hidden=Math.floor(i/(innerWidth<=860?3:4))!==mp);
 const pager=(kind,p,n)=>n>1?`<div class="estate-pages" role="group" aria-label="${kind} pages"><button class="btn sm" data-do="estatepage" data-a="${kind}" data-b="${p-1}" ${p?'':'disabled'} aria-label="Previous ${kind} page">Prev</button><span>${p+1} / ${n}</span><button class="btn sm" data-do="estatepage" data-a="${kind}" data-b="${p+1}" ${p+1<n?'':'disabled'} aria-label="Next ${kind} page">Next</button></div>`:'';
 const actionRows=[...fields.querySelectorAll('.farm-actions'),...animals.querySelectorAll('.farm-actions')].map((e,i)=>`<div class="estate-action-group" data-zone="${i?'pens':'fields'}">${e.outerHTML}</div>`).join('');
 const trough=animals.querySelector('[data-b="trough"]')?.parentElement.outerHTML||'';
 const routeCrop=D.CROP[UI.farmRoute],routeSeed=routeCrop&&!Q.have('seed_'+routeCrop.id)?`<div class="estate-route-target" data-farm-target="${routeCrop.id}">${Q.itemIco(D.ITEMS['crop_'+routeCrop.id])}<b>${esc(routeCrop.name)}</b><small>Farming ${routeCrop.lvl} · needs seeds before planting</small><button class="btn" data-do="route" data-a="seed_${routeCrop.id}">Get ${esc(routeCrop.name.toLowerCase())} seeds</button></div>`:'';
 const bg=A?A.url('farm-estate',A.farmEstateSprite):'';
 return `<div class="farm-estate" data-section="${UI.estateSection}"><section class="panel estate-controls"><div class="phead"><h2>Your farm</h2><small>Farming <b data-b="lvl:farming"></b></small></div><div class="estate-section-tabs btnrow"><button class="btn ${['fields','seeds'].includes(UI.estateSection)?'on':''}" data-do="estatesection" data-a="fields" aria-pressed="${['fields','seeds'].includes(UI.estateSection)}">${Q.itemIco(D.ITEMS.crop_wheat)}<span><b>Crops & fields</b><small>Sow · grow · harvest</small></span></button><button class="btn ${['pens','animals'].includes(UI.estateSection)?'on':''}" data-do="estatesection" data-a="pens" aria-pressed="${['pens','animals'].includes(UI.estateSection)}">${Q.animalSprite(D.ANIMAL.cow,32)}<span><b>Livestock & pasture</b><small>Feed · care · collect</small></span></button></div><div class="estate-mobile-tabs btnrow">${['fields','pens','seeds','animals'].map(k=>`<button class="btn sm ${UI.estateSection===k?'on':''}" data-do="estatesection" data-a="${k}" aria-pressed="${UI.estateSection===k}">${k==='animals'?Q.animalSprite(D.ANIMAL.cow,32):ico(({fields:'crop',pens:'barn',seeds:'seed'})[k])}${({fields:'Fields',pens:'Pens',seeds:'Seeds',animals:'Livestock'})[k]}</button>`).join('')}</div><div class="estate-actions">${actionRows}</div><div class="estate-trough" data-zone="pens">${trough}</div></section><div class="estate-layout"><section class="panel estate-land"><div class="estate-scenery" style="background-image:url('${bg}')" role="img" aria-label="Farmhouse, pond, tilled fields and fenced pasture"></div><div class="estate-zones"><div class="estate-fields"><h3><span>Fields · ${Q.S.farm.plots.length} plots</span>${pager('fields',fp.p,fp.pages)}${buyPlot?.outerHTML||''}</h3>${plots.outerHTML}</div><div class="estate-pasture"><h3><span>Pasture · ${Q.S.farm.pensBought} pens</span>${pager('pens',pp.p,pp.pages)}${buyPen?.outerHTML||''}</h3>${pens.outerHTML}</div></div></section><section class="panel estate-supplies"><h3 class="estate-supply-title">${UI.estateTab==='seeds'?'Seeds & planting':'Livestock market'}</h3><div class="btnrow estate-supply-tabs"><button class="btn ${UI.estateTab==='seeds'?'on':''}" data-do="estatetab" data-a="seeds">Seeds & planting</button><button class="btn ${UI.estateTab==='animals'?'on':''}" data-do="estatetab" data-a="animals">Livestock</button></div>${UI.estateTab==='seeds'?`${routeSeed}${seeds?.outerHTML||'<p>Buy seeds in the shop.</p>'}${settings?.outerHTML||''}<button class="btn" data-do="go" data-a="shop">Buy seeds</button>`:`${market?.outerHTML||''}${pager('market',mp,Math.ceil(marketItems.length/(innerWidth<=860?3:4)))}`}</section></div></div>`;
};
/* Only the changing workspace transitions; task progress and the surrounding HUD keep running. */
const switchSection=a=>{
 if(!['fields','pens','seeds','animals'].includes(a))return;
 const previous=UI.estateSection,calm=Q.S.settings.reduceFx||matchMedia('(prefers-reduced-motion: reduce)').matches;
 const render=()=>{UI.estateSection=a;UI.estateTab=(a==='pens'||a==='animals')?'animals':'seeds';UI.render(false);const phone=innerWidth<=860,tabs=phone?'.estate-mobile-tabs':'.estate-section-tabs',focusTab=phone?a:(a==='pens'||a==='animals'?'pens':'fields');document.querySelector(tabs+' [data-a="'+focusTab+'"]')?.focus({preventScroll:true});};
 UI.estateTransition?.skipTransition();
 if(previous===a||calm||UI.view!=='farming'||document.hidden)return render();
 document.documentElement.style.setProperty('--estate-enter-x',(a==='pens'||a==='animals'?'16px':'-16px'));
 if(document.startViewTransition){
  const t=document.startViewTransition(render);UI.estateTransition=t;
  t.ready.catch(()=>{});t.finished.then(()=>{if(UI.estateTransition===t)UI.estateTransition=null;},()=>{if(UI.estateTransition===t)UI.estateTransition=null;});
  return t.updateCallbackDone.catch(()=>{});
 }
 render();document.querySelector('.estate-layout')?.animate([{opacity:0,transform:'translateX('+(a==='pens'||a==='animals'?16:-16)+'px)'},{opacity:1,transform:'translateX(0)'}],{duration:300,easing:'cubic-bezier(.2,.7,.3,1)'});
};
Object.assign(UI.DO,{
 farmmarket:a=>{if(!Q.townUnlocked('mossbarrow'))return Q.toast('The livestock trader is in Mossbarrow, past Grubnash',true);UI.estateMarketPage=Math.max(0,Math.floor(D.ANIMALS.findIndex(v=>v.id===(a||'hen'))/(innerWidth<=860?3:4)));return switchSection('animals');},
 estatesection:switchSection,estatetab:a=>switchSection(a==='animals'?'pens':'fields'),
 estatepage:(a,b)=>{const key={fields:'estateFieldPage',pens:'estatePenPage',market:'estateMarketPage'}[a];if(key)UI[key]=+b;UI.render(false);}
});
})();
