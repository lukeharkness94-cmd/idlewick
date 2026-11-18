/* Finite assignments count additional actual output, never current inventory. */
(() => {
const Q=window.DQ,D=Q.data,UI=Q.ui,S=()=>Q.S,{esc,fmt}=Q;
Q.workerSource=(w,item)=>Object.values(D.NODE).find(n=>n.item===item&&Q.workerCanGather(w,n.kind+':'+n.id));
Q.assignWorkerNeed=(wid,type,id,item)=>{
 const w=S().workers.find(w=>w.id===wid),src=w&&Q.workerSource(w,item);if(!src)return false;
 const required=type==='project'?Q.projectNeed(id)[item]:(D.RECIPES[id]?.in[item]||0)*(UI.workerBatches||1);
 const amount=Math.max(0,(required||0)-Q.have(item));if(!amount)return false;
 return Q.assign(wid,src.kind+':'+src.id,amount,type==='project'?D.PROJECTS[id].name:D.RECIPES[id].name);
};
UI.workerNeedButton=(type,id,item)=>S().workers.some(w=>Q.workerSource(w,item))?`<button class="btn sm worker-need" data-do="workerrequest" data-a="${type}|${id}|${item}">Worker · ${esc(Q.itemDiscovered(item)?D.ITEMS[item].name:Q.ingredientDiscovery(item).label)}</button>`:'';
const jobs0=UI.V.hirelings;
UI.V.hirelings=()=>{
 const h=jobs0(),w=S().workers.find(w=>w.id===UI.tab.workerChoice)||S().workers[0];if(!w)return h;
 const req=UI.workerRequest,src=req&&Q.workerSource(w,req.item),need=req&&(req.type==='project'?Q.projectNeed(req.id)[req.item]:(D.RECIPES[req.id]?.in[req.item]||0)*(UI.workerBatches||1)),missing=Math.max(0,(need||0)-(req?Q.have(req.item):0));
 const request=req?`<div class="worker-request">${req.type==='recipe'?`<div class="btnrow"><span>Recipe batches</span>${[1,5,10].map(n=>`<button class="btn sm ${(UI.workerBatches||1)===n?'on':''}" data-do="workerbatches" data-a="${n}">${n}</button>`).join('')}</div>`:''}<b>${esc(Q.itemDiscovered(req.item)?D.ITEMS[req.item]?.name:'Undiscovered ingredient')} · ${missing} more needed</b><small>${esc(req.type==='project'?D.PROJECTS[req.id]?.name:D.RECIPES[req.id]?.name)}</small>${src&&missing?`<button class="btn primary" data-do="workerfill" data-a="${w.id}" data-b="${req.type}|${req.id}|${req.item}">Gather ${missing} more</button>`:`<span>${missing?'Choose a worker who can gather this material.':'You already have enough.'}</span>`}</div>`:'';
 const job=w.job||w.jobComplete,status=job?`<p data-b="workerjob:${w.id}" class="worker-job-status ${w.jobComplete?'ok':''}" role="status">${w.jobComplete?'✓ Complete · wages stopped':'Finite job'}: ${fmt(job.done)} / ${fmt(job.target)} ${esc(D.ITEMS[job.item].name)}${job.label?` · ${esc(job.label)}`:''}</p>`:'';
 const controls=w.skill==='farming'?'<small class="worker-guide-rate">Farmhands earn ¼ Guide progress from harvests and produce; personal Farming XP is unchanged.</small>':`<div class="worker-job-controls"><label for="worker-quantity">Additional quantity</label><input id="worker-quantity" type="number" min="1" max="1000000" step="1" value="${UI.workerQuantity||25}" aria-label="Additional worker quantity"><button class="btn" data-do="workerfinite" data-a="${w.id}" ${w.task?'':'disabled'}>Gather this much, then rest</button>${w.job?`<button class="btn sm" data-do="workerendless" data-a="${w.id}">Switch to unrestricted</button>`:''}</div><small>Choose an assignment, then set a fixed extra quantity. Bonus output counts; later spending does not extend it. Output goes to the bank.</small>`;
 const box=document.createElement('template');box.innerHTML=h;
 if(innerWidth>860){const board=box.content.querySelector('.worker-board'),support=document.createElement('div');support.className='worker-support';support.innerHTML=`<section class="panel worker-planner"><h3>${esc(w.name)} · job target</h3>${status}${request}${controls}</section>`;if(board){board.before(support);support.appendChild(board);}}
 else box.content.querySelector('.worker')?.insertAdjacentHTML('beforeend',status+request+controls);
 return box.innerHTML;
};
UI.B.workerjob=(el,id)=>{const w=S().workers.find(w=>w.id===id),j=w?.job||w?.jobComplete;if(j){el.textContent=`${w.jobComplete?'✓ Complete · wages stopped':'Finite job'}: ${fmt(j.done)} / ${fmt(j.target)} ${D.ITEMS[j.item].name}${j.label?' · '+j.label:''}`;el.classList.toggle('ok',!!w.jobComplete);}};
document.addEventListener('input',e=>{if(e.target.id==='worker-quantity')UI.workerQuantity=+e.target.value;});
Object.assign(UI.DO,{
 workerfinite:id=>{const w=S().workers.find(w=>w.id===id),input=document.getElementById('worker-quantity'),n=Number(input?input.value:UI.workerQuantity||25);if(!Number.isSafeInteger(n)||n<1||n>1000000)return Q.toast('Enter a whole quantity from 1 to 1,000,000.',true);if(w?.task&&Q.assign(id,w.task,n))UI.render(false);},
 workerendless:id=>{const w=S().workers.find(w=>w.id===id);if(w?.task)Q.assign(id,w.task);UI.render(false);},
 workerrequest:a=>{const [type,id,item]=a.split('|');UI.workerRequest={type,id,item};const w=S().workers.find(w=>Q.workerSource(w,item));if(w)UI.tab.workerChoice=w.id;Q.go('hirelings');},
 workerbatches:n=>{if([1,5,10].includes(+n)){UI.workerBatches=+n;UI.render(false);}},
 workerfill:(wid,a)=>{const [type,id,item]=a.split('|');Q.assignWorkerNeed(wid,type,id,item);UI.render(false);}
});
const projects0=UI.projectsPanel;UI.projectsPanel=()=>{const h=projects0(),id=UI.tab.projectChoice;if(!D.PROJECTS[id]||S().projects[id])return h;const buttons=Object.entries(Q.projectNeed(id)).filter(([k,n])=>k!=='coins'&&n>Q.have(k)).map(([k])=>UI.workerNeedButton('project',id,k)).join('');return h.replace('<div class="proj-lines">',buttons+'<div class="proj-lines">');};
const tasks0=UI.taskPanel;UI.taskPanel=(key,title,kind,choices,verb)=>{const h=tasks0(key,title,kind,choices,verb),r=kind==='recipe'&&D.RECIPES[UI.taskChoice[key]];if(!r)return h;const buttons=Object.entries(r.in).filter(([k,n])=>n>Q.have(k)).map(([k])=>UI.workerNeedButton('recipe',r.id,k)).join('');return buttons?h.replace('<div class="task-summary">','<div class="task-summary"><div class="worker-ingredients">'+buttons+'</div>'):h;};
})();
