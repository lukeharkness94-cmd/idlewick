/* Quest journal navigation uses the existing quest, pin and contextual-route systems. */
(() => {
const Q=window.DQ,D=Q.data,UI=Q.ui,S=()=>Q.S;
UI.B.qstate=(e,id)=>{const q=D.QM[id];if(!q)return;const p=UI.questProgress(q);e.textContent={new:'New',locked:'Locked',active:p.pct+'%',ready:'✓ Return',done:'✓ Done'}[p.state];};
UI.B.qsteps=(e,id)=>{const q=D.QM[id];if(q)e.textContent=`${UI.questProgress(q).complete}/${q.obj.length} objectives complete`;};
const txt=UI.B.qtxt;
UI.B.qtxt=(e,id,j)=>{txt(e,id,j);const q=D.QM[id];if(q)e.closest('.obj')?.classList.toggle('ok',Q.objProg(q,S().q[id],+j)>=q.obj[j].n);};
const continue0=UI.DO.questcontinue;
UI.DO.questcontinue=id=>{
 const q=D.QM[id];if(!q)return;
 if(Q.questState(q)!=='active')return UI.DO.openquest(id);
 const o=q.obj.find((o,j)=>Q.objProg(q,S().q[id],j)<o.n);if(!o)return UI.DO.openquest(id);
 if(UI.view==='quests')UI.returnTo={page:'quests',label:q.name};
 if(o.ev==='deliver'&&D.ITEMS[o.key]&&D.ITEMS[o.key].type!=='relic')return UI.DO.route(o.key);
 const kind={catch:'fish',chop:'wood',mine:'mine',thieve:'thieve'}[o.ev];
 if(kind){const node=o.key==='*'?D.NODES[kind].find(n=>Q.nodeHere(n)&&Q.lvl(n.skill)>=n.lvl)||D.NODES[kind][0]:D.NODE[kind+':'+o.key];if(node)return UI.focusTask(D.SK[node.skill].page,node.id,null,node.skill);}
 const skill={cook:'cooking',smelt:'smithing',smith:'smithing',craft:'crafting'}[o.ev];
 if(skill){const candidates=Q.questRecipeCandidates?Q.questRecipeCandidates(o):Object.values(D.RECIPES).filter(r=>r.ev===o.ev&&(o.key==='*'||Object.keys(r.out)[0]===o.key));const r=candidates.find(r=>Q.skillUnlocked(r.skill)&&Q.lvl(r.skill)>=r.lvl&&Q.recipeDiscovered(r)&&!Q.recipeGate?.(r))||candidates[0];if(r)return UI.focusTask(D.SK[r.skill].page,r.id,r.tab,r.skill);}
 if(o.ev==='harvest'&&o.key!=='*'&&D.ITEMS['crop_'+o.key])return UI.DO.route('crop_'+o.key);
 return continue0(id);
};
})();
