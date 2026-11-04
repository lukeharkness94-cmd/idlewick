/* Reward balance. Prices remain stable; existing purses and items are never rewritten. */
(() => {
const D=window.DQ.data;
D.ECONOMY={version:1,gatherCoinScale:.3,gatherTownScale:[1,1.4,2,3,4.5,6,8,10],fishPouchChance:.008,fishChestChance:.001,woodNestChance:.008,mineGemChance:.004,mineCoinChance:.004};
for(const m of D.MONLIST)m.coins=m.coins.map(n=>Math.round(n*(m.boss?.2:.35)));
for(const n of D.NODES.thieve){n.cmin=Math.max(1,Math.round(n.cmin*.3));n.cmax=Math.max(n.cmin,Math.round(n.cmax*.3));}
for(const it of Object.values(D.ITEMS)){
  // Consumables and manufactured goods retain their uses; selling is secondary income.
  if(it.val>0&&it.type!=='tool')it.val=Math.max(1,Math.round(it.val*.5));
}
for(const q of D.QUESTS||Object.values(D.QM))if(q.id!=='first_steps'&&q.reward?.coins)q.reward.coins=Math.round(q.reward.coins*.65);
for(const a of D.ACH||[])a.coins=Math.round(a.coins*.35);
})();
