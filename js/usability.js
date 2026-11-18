/* Long-session presentation: retain existing actions, comparisons and sound settings. */
(() => {
const Q=window.DQ,U=Q.ui,D=Q.data,{esc}=Q;
U.gearPurpose=(it,full=true)=>{
 if(!it?.slot)return '';
 const type=it.style==='ranged'?'bow':it.style==='magic'?'staff':it.wtype;
 const w=D.WTYPES[type];
 return `${it.unique?U.uniqueLine(it,'gear-special',full):''}${w?`<small class="gear-purpose">${esc(w.note)} · ${(w.speed/1000).toFixed(2)}s base attack${w.dtype?' · '+esc(w.dtype):''}</small>`:''}`;
};
const compare=U.compareHtml;
U.compareHtml=id=>{const html=compare(id),it=D.ITEMS[id];return html&&it?.slot?U.gearPurpose(it)+html:html;};
const tip=Q.tips.item;
Q.tips.item=id=>{
 let html=tip(id);const it=D.ITEMS[id];if(!html||!it?.slot)return html;
 // The exceptional property leads the choice instead of following value and ordinary stats.
 if(it.unique)html=html.replace(/<div class="unique-fx [^"]*">[\s\S]*?<\/div>/,'');
 return U.gearPurpose(it)+html;
};
// Protect clicks across a synchronous redraw too: a second click must not buy the next shelf item.
let purchaseAt=-Infinity, claimAt=-Infinity;
document.addEventListener('click',e=>{const el=e.target.closest?.('[data-do]');if(!el||el.disabled)return;const k=el.dataset.do,now=performance.now();if(['buy','buyupgrade','localbuy','rarebuy'].includes(k)){if(now-purchaseAt<350){e.preventDefault();e.stopImmediatePropagation();return;}purchaseAt=now;}if(k==='qclaim'){if(now-claimAt<350){e.preventDefault();e.stopImmediatePropagation();return;}claimAt=now;}},true);
const render=U.render;
U.render=(...a)=>{const r=render(...a);Q.prepareTips?.(document.getElementById('view'));return r;};
const modal=Q.modal;
Q.modal=(...a)=>{const r=modal(...a);Q.prepareTips?.(document.querySelector('.modal'));return r;};
})();
