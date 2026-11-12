/* Context-preserving navigation and compact, illustrated UI refinements. */
(() => {
const Q=window.DQ,D=Q.data,UI=Q.ui,S=()=>Q.S,{esc,ico,fmt}=Q;
const pagePx=v=>Q.toPage?Q.toPage(v):v;
const calm=()=>S().settings.reduceFx||matchMedia('(prefers-reduced-motion: reduce)').matches;
/* Configure both recipe category axes before navigation; never start or unlock an activity implicitly. */
const focus0=UI.focusTask;
UI.focusTask=(page,id,tab,sk)=>{const r=D.RECIPES[id];if(r){const g=Q.recipeGroup(r);sk=r.skill;tab=g.g;UI.tab[sk+'sub']=g.s||null;UI.tab[sk+'ready']=false;}
 UI.routePreview={page,id,skill:sk||D.NODE[(Object.keys(D.NODES).find(k=>D.NODE[k+':'+id])||'')+':'+id]?.skill};return focus0(page,id,tab,sk);};
const locked0=UI.lockedPage;
UI.lockedPage=sk=>{const h=locked0(sk),r=UI.routePreview;if(!r||r.skill!==sk||r.page!==UI.view)return h;
 const recipe=D.RECIPES[r.id],node=Object.values(D.NODE).find(n=>n.id===r.id&&n.skill===sk);if(!recipe&&!node)return h;
 const name=recipe?.name||node.name,art=recipe?Q.itemIco(D.ITEMS[Object.keys(recipe.out)[0]]):Q.artImage(node.kind||({fishing:'fish',mining:'mine',woodcutting:'wood',thieving:'thieve'}[sk]),r.id,64);
 return h+`<section class="panel routed-locked" data-routed-task="${r.id}"><h3>${esc(name)}</h3>${art}<p>${esc(Q.unlockHow(sk))}</p><button class="btn" disabled>${esc(name)} · learn ${D.SK[sk].name} first</button></section>`;};
UI.DO.route=id=>{const src=Q.sourceOf(id);if(!src)return;if(UI.view!==src.page)UI.returnTo={page:UI.view,label:({projects:'Town projects',quests:'Quests',character:'Inventory'})[UI.view]||D.SK[UI.view]?.name||'previous task'};
 if(src.kind==='shop'){UI.shopSelected.buy=id;UI.shopTab='buy';UI.sel=id;UI.routeShopItem=id;}
 if(src.kind==='farm'){UI.seed=id.replace(/^crop_|^seed_/,'');UI.farmRoute=UI.seed;UI.estateTab='seeds';UI.estateSection='seeds';const seeds=D.CROPS.filter(c=>Q.have('seed_'+c.id));UI.estateSeedPage=Math.max(0,Math.floor(seeds.findIndex(c=>c.id===UI.seed)/(innerWidth<=860?4:6)));}
 if(src.kind==='animal'){UI.farmAnimal=D.ANIMALS.find(a=>a.prod===id)?.id;UI.estateTab='animals';UI.estateSection='animals';UI.estateMarketPage=Math.max(0,Math.floor(D.ANIMALS.findIndex(a=>a.id===UI.farmAnimal)/(innerWidth<=860?3:4)));}
 if(src.id)UI.focusTask(src.page,src.id,D.RECIPES[src.id]?.tab,src.skill);else Q.go(src.page);
 UI.routeSource={...src,item:id};UI.render(false);
};
/* Travel is explicit and visible. Once it completes, return to the selected task without starting it. */
UI.DO.routetravel=town=>{const src=UI.routeSource;if(!src||!Q.townUnlocked(town))return;UI.travelReturn={...src};Q.go('map');UI.travelAnim(town);};
const travel0=Q.travel;
Q.travel=town=>{const out=travel0(town),r=UI.travelReturn;if(r&&S().town===town){UI.travelReturn=null;if(r.kind==='shop'){UI.shopSelected.buy=r.item;UI.shopTab='buy';UI.sel=r.item;}if(r.id)UI.focusTask(r.page,r.id,D.RECIPES[r.id]?.tab,r.skill);else Q.go(r.page);UI.routeSource=r;}return out;};
const taskmap0=UI.DO.taskmap;
UI.DO.taskmap=town=>{const page=UI.view,id=UI.taskChoice[page],node=Object.values(D.NODE).find(n=>n.id===id&&n.skill===page);UI.routeSource={page,id,skill:page,town,kind:node?.kind};if(Q.townUnlocked(town))return UI.DO.routetravel(town);return taskmap0(town);};
/* A defeated creature has a short exit before the next silhouette arrives; no combat timing changes. */
Q.on('beaststrike',()=>{const el=document.querySelector('.battle-companion');if(el&&!calm())el.animate([{transform:'translateX(0)'},{transform:'translateX(12px)',offset:.4},{transform:'translateX(0)'}],{duration:400});});
Q.on('foedefeated',m=>{if(UI.view!=='combat'||Q.sim.on)return;const foe=document.getElementById('av-foe');if(!foe)return;const rect=foe.getBoundingClientRect(),layer=document.getElementById('toastlayer')||document.body;
 const label=document.createElement('div');label.className='defeat-caption';label.textContent=m.name+' defeated';label.setAttribute('role','status');label.style.left=pagePx(rect.left+rect.width/2)+'px';label.style.top=pagePx(Math.max(120,rect.top-24))+'px';layer.appendChild(label);setTimeout(()=>label.remove(),1100);
 if(calm())return;const ghost=foe.cloneNode(true);ghost.removeAttribute('id');ghost.querySelectorAll('[id]').forEach(e=>e.removeAttribute('id'));ghost.className='foe-death-ghost';Object.assign(ghost.style,{left:pagePx(rect.left)+'px',top:pagePx(rect.top)+'px',width:pagePx(rect.width)+'px',height:pagePx(rect.height)+'px'});layer.appendChild(ghost);ghost.animate([{opacity:1,transform:'translateY(0)'},{opacity:0,transform:'translateY(22px) rotate(8deg)'}],{duration:480,easing:'ease-in',fill:'forwards'});setTimeout(()=>ghost.remove(),510);
 requestAnimationFrame(()=>{const next=document.getElementById('av-foe');if(next)next.animate([{opacity:0},{opacity:0,offset:.35},{opacity:1}],{duration:650});});
});
/* One Scholarship family card, with visible rank buttons and the selected rank's unchanged cost/action. */
const research0=UI.V.research;UI.researchRanks={};
UI.V.research=()=>{const h=research0();if(!h.includes('scholarship-grid'))return h;const box=document.createElement('template');box.innerHTML=h;const grid=box.content.querySelector('.scholarship-grid');if(!grid)return h;
 const cards=[...grid.children],groups=new Map();D.TECHS.forEach((t,i)=>{const base=t.name.replace(/\s+(I|II|III|IV)$/,'');const key=t.br+':'+base;if(!groups.has(key))groups.set(key,[]);groups.get(key).push({t,card:cards[i]});});
 grid.innerHTML='';for(const [key,rows]of groups){if(rows.length===1){if(rows[0].card)grid.appendChild(rows[0].card);continue;}
 const selected=rows.find(x=>x.t.id===UI.researchRanks[key])||rows.find(x=>S().research.active.some(a=>a.id===x.t.id))||rows.find(x=>!Q.techDone(x.t.id))||rows[rows.length-1];const family=document.createElement('section');family.className='tech-family';family.innerHTML=`<div class="tech-ranks" role="group" aria-label="${esc(key.split(':')[1])} ranks">${rows.map(({t})=>`<button class="btn sm ${t.id===selected.t.id?'on':''}" data-do="researchrank" data-a="${esc(key)}" data-b="${t.id}">${Q.techDone(t.id)?'✓ ':''}${esc(t.name.match(/\b(I|II|III|IV)$/)?.[1]||t.name)} · Tier ${t.tier}</button>`).join('')}</div>`;if(selected.card)family.appendChild(selected.card);grid.appendChild(family);}
 if(innerWidth<=860){const children=[...grid.children],page=Math.max(0,Math.min(UI.researchPhonePage||0,children.length-1));children.forEach((e,i)=>{e.hidden=i!==page;});const nav=document.createElement('div');nav.className='scholarship-phone-controls';nav.dataset.mode=UI.researchPhoneMode||'projects';nav.innerHTML=`<div class="btnrow"><button class="btn sm" data-do="researchphonemode" data-a="projects">Discoveries · Lv ${Q.lvl('research')}</button><button class="btn sm" data-do="researchphonemode" data-a="slots">Study slots ${S().research.active.length}/${Q.researchSlots()}</button></div><div class="btnrow"><button class="btn sm" data-do="researchphonepage" data-a="${page-1}" ${page?'':'disabled'}>Previous</button><span>${page+1} / ${children.length}</span><button class="btn sm" data-do="researchphonepage" data-a="${page+1}" ${page+1<children.length?'':'disabled'}>Next</button></div>`;grid.before(nav);}
 return box.innerHTML;};
UI.DO.skillpicker=()=>Q.modal({title:'Choose a skill',body:`<div class="phone-skill-picker">${D.SKILLS.filter(s=>s.group!=='combat').map(s=>`<button class="btn" data-do="pickphoneskill" data-a="${s.page}">${Q.artImage('skill',s.id,32)}<span>${esc(s.name)}</span></button>`).join('')}</div>`,actions:[{label:'Close'}]});UI.DO.pickphoneskill=page=>{Q.closeModal();Q.go(page);};
UI.DO.researchphonemode=a=>{UI.researchPhoneMode=a;UI.render(false);};UI.DO.researchphonepage=a=>{UI.researchPhonePage=Math.max(0,+a);UI.render(false);};
UI.DO.researchrank=(key,id)=>{UI.researchRanks[key]=id;UI.render(false);};
/* Existing item requirement chips become direct routes, not dead text. */
const render0=UI.render;
UI.render=fresh=>{render0(fresh);document.documentElement.classList.toggle('compact-skill-navigation',innerWidth<=860&&UI.hubOf(UI.view).id==='skills');const view=document.getElementById('view');if(!view)return;
 if(innerWidth<=860&&UI.hubOf(UI.view).id==='skills'){const bar=document.getElementById('routebar')||view;const btn=document.createElement('button');btn.className='btn sm mobile-skill-switch';btn.dataset.do='skillpicker';btn.textContent='Choose skill';bar.appendChild(btn);const combat=document.createElement('button');combat.className='btn sm mobile-combat-switch';combat.dataset.do='go';combat.dataset.a='combat';combat.textContent='Combat';bar.appendChild(combat);}
 const yieldBox=view.querySelector('.scene-yield');if(yieldBox){yieldBox.closest('.activity-stage')?.appendChild(yieldBox);yieldBox.classList.add('yield-tray');}
 if(UI.view==='combat'&&Q.beastActive()){const arena=view.querySelector('.encounter-arena');if(arena&&!arena.querySelector('.battle-companion')){const el=document.createElement('span'),id=Q.beastActive();el.className='battle-companion';el.innerHTML=Q.petSprite(D.PET[id],48)+`<small>${esc(D.PET[id].name)} · Bond ${Q.petLevel(id)}</small>`;arena.appendChild(el);}}
 const src=UI.routeSource;if(src&&src.page===UI.view){const n=D.NODE[src.kind+':'+src.id],needs=src.town&&src.town!==S().town&&(src.kind==='shop'||src.kind==='fight'||(n&&!Q.nodeHere(n)));if(needs&&!view.querySelector('.route-travel')){const row=document.createElement('div');row.className='route-travel';row.innerHTML=`<span>${esc(D.ITEMS[src.item]?.name||src.name||'This activity')} · ${esc(D.TOWN[src.town].name)}</span><button class="btn primary" data-do="routetravel" data-a="${src.town}" ${Q.townUnlocked(src.town)?'':'disabled'}>${Q.townUnlocked(src.town)?'Travel & return to this task':'Road not open yet'}</button>`;view.prepend(row);}}
 for(const e of view.querySelectorAll('[data-tip^="item:"]')){if(e.closest('button,a')||e.querySelector('button,a')||e.matches('input'))continue;const id=e.dataset.tip.slice(5);if(!Q.sourceOf(id))continue;e.classList.add('requirement-route');e.setAttribute('role','button');e.tabIndex=0;e.dataset.do='route';e.dataset.a=id;e.setAttribute('aria-label',`Obtain ${D.ITEMS[id]?.name||id}`);}
 if(UI.view==='shop'&&UI.routeShopItem){UI.shopSelected.buy=UI.routeShopItem;UI.sel=UI.routeShopItem;}
};
})();
