/* Shared requirements: named input, held / required, optional source icon. */
(() => {
const DQ=window.DQ,D=DQ.data,UI=DQ.ui,{esc,fmt,ico}=DQ;
const count=n=>n>=1e4?(n/1e3).toFixed(n>=1e5?0:1)+'k':fmt(n);
UI.needTile=(id,n,o={})=>{
 const coins=id==='coins',it=coins?null:D.ITEMS[id];if(!coins&&!it)return '';
 const have=coins?DQ.S.coins:DQ.have(id),ok=have>=n,name=coins?'Coins':it.name;
 const source=!coins&&DQ.ingredientDiscovery?DQ.ingredientDiscovery(id):null;
 const tip=coins?`${name}: ${fmt(have)} / ${fmt(n)}`:`${name}: ${fmt(have)} / ${fmt(n)}${source?.label?' · '+source.label:''}`;
 const held=o.live&&!coins?`<b data-b="count:${id}">${count(have)}</b>`:count(have);
 const route=ok||coins||o.noRoute||!UI.routeChip?'':UI.routeChip(id);
 return `<span class="need-tile ${ok?'ok':'short'} ${o.compact?'compact':''}" data-tip="${coins?'text:'+esc(tip):'item:'+id}" aria-label="${esc(tip)}"><span class="nt-art">${coins?ico('coin'):DQ.itemIco(it)}</span><span class="nt-t">${o.compact?'':`<b>${esc(name)}</b>`}<small class="nt-c">${held} / ${count(n)}</small></span>${route}</span>`;
};
UI.needTiles=(cost,o)=>`<span class="need-tiles">${Object.entries(cost||{}).map(([id,n])=>UI.needTile(id,n,o)).join('')}</span>`;
})();
