/* Idlewick: rare wares. Every town's shop has a second shelf with things you will not find on the main one:
   masterwork gear (one of each, made by local smiths), rare materials, sealed loot caches and a Fortune tonic. */
(() => {
const DQ = window.DQ, D = DQ.data, UI = DQ.ui, { $, $$, ico, fmt, esc, rnd, chance, pick } = DQ;
const S = () => DQ.S, GT = () => S().gameTime || 0;
const have = id => !!D.ITEMS[id];

/* ---------- what each town sells that the others do not ---------- */
D.TOWN_SPECIALS = {
  willowbrook: ['gem_sapphire'],
  mossbarrow: ['gem_sapphire', 'wool', 'cowhide'],
  saltmere: ['gem_emerald', 'ore_coal'],
  ironpeak: ['gem_ruby', 'ore_gold'],
  gloomfen: ['gem_diamond', 'rune'],
  emberfall: ['ember_core', 'gem_diamond'],
  skyreach: ['gem_diamond', 'seed_starfruit'],
  hollow: ['ore_voidstone', 'gem_diamond'],
};
/* Gear you cannot buy on the normal shelf: jewellery, ranger sets and (after the boss falls) its trophy */
D.TOWN_RARE_GEAR = {
  willowbrook: ['ring_sapphire', 'leather_vest', 'leather_coif'],
  mossbarrow: ['amulet_sapphire', 'leather_chaps', 'leather_vest'],
  saltmere: ['ring_emerald', 'amulet_emerald', 'frost_coif'],
  ironpeak: ['ring_ruby', 'frost_vest', 'frost_chaps'],
  gloomfen: ['amulet_ruby', 'bog_coif', 'bog_vest', 'bog_chaps'],
  emberfall: ['ring_diamond', 'drake_coif', 'drake_vest', 'drake_chaps'],
  skyreach: ['amulet_diamond', 'drake_vest'],
  hollow: ['ring_diamond', 'amulet_diamond'],
};
D.TOWN_TROPHY = { willowbrook: 'chief_helm', mossbarrow: 'tusk_charm', saltmere: 'barnacle_cutlass', ironpeak: 'frostmaw_pendant', gloomfen: 'witch_staff', emberfall: 'emberfang_bow', skyreach: 'storm_feather', hollow: 'hollow_crown' };
const idx = town => D.TOWN[town].idx;
DQ.cachePrice = (town, grand) => Math.round(300 * Math.pow(idx(town) + 1, 1.7) * (grand ? 4 : 1) / 10) * 10;
DQ.tonicPrice = town => Math.round(DQ.cachePrice(town, false) * .6 / 10) * 10;
DQ.rareOffers = (town = S().town) => {
  const gear = (D.TOWN_RARE_GEAR[town] || []).filter(have).map(id => ({ id, price: Math.round(D.ITEMS[id].val * 6) }));
  const tid = D.TOWN_TROPHY[town], beaten = !!(S().towns[town] && S().towns[town].boss);
  if (tid && have(tid)) gear.push({ id: tid, price: Math.round(D.ITEMS[tid].val * 4), trophy: true, locked: !beaten });
  return {
    gear,
    mats: (D.TOWN_SPECIALS[town] || []).filter(have).map(id => ({ id, price: Math.max(5, Math.round(D.ITEMS[id].val * 5)) })),
    caches: [{ k: 'fine', name: 'Fine cache', price: DQ.cachePrice(town, false), open: true }, { k: 'grand', name: 'Grand cache', price: DQ.cachePrice(town, true), open: idx(town) >= 2, need: 'Saltmere and beyond' }],
    tonic: { price: DQ.tonicPrice(town), open: idx(town) >= 1, need: 'Mossbarrow and beyond' },
  };
};
DQ.owns = id => DQ.have(id) > 0 || Object.values(S().equip).includes(id);
DQ.rareSold = id => !!(S().shopSold && S().shopSold[id]) || DQ.owns(id);

/* ---------- Fortune tonic: rare drops are 50% more likely for a while ---------- */
const TONIC_MS = 30 * 60000, TONIC_MAX = 120 * 60000;
DQ.luckLeft = () => { const b = DQ.buffs().find(x => x.type === 'luck'); return b ? b.until - GT() : 0; };
DQ.buyTonic = () => {
  const o = DQ.rareOffers().tonic; if (!o.open) return DQ.toast(`Fortune tonic is sold in ${o.need}`, true);
  if (S().coins < o.price) return DQ.toast('Not enough coins', true);
  const left = DQ.luckLeft(); if (left >= TONIC_MAX - 1000) return DQ.toast('You are as fortunate as you can be for now', true);
  S().coins -= o.price; const until = GT() + Math.min(TONIC_MAX, left + TONIC_MS);
  S().buffs = DQ.buffs().filter(b => b.type !== 'luck').concat({ type: 'luck', mult: 1.5, until, name: 'Fortune' }); DQ.sfx('buy'); DQ.emit('shop'); return true;
};

/* ---------- Caches: sealed, local, and a gamble ---------- */
DQ.openCache = grand => {
  const town = S().town, o = DQ.rareOffers(town).caches[grand ? 1 : 0];
  if (!o.open) return DQ.toast(`Grand caches are sold in ${o.need}`, true);
  if (S().coins < o.price) return DQ.toast('Not enough coins', true);
  S().coins -= o.price; DQ.sfx('buy');
  const out = [], coins = Math.round(o.price * (grand ? .45 + Math.random() * .5 : .25 + Math.random() * .45) * DQ.coinMult());
  DQ.addCoins(coins, { noStat: true }); out.push({ coins });
  for (let i = 0; i < (grand ? 2 : 1); i++) { const gem = DQ.weighted(D.GEM_WEIGHTS); DQ.grant(gem); out.push({ id: gem, n: 1, tag: 'rare' }); }
  const gl = (D.TOWN_GEAR[town] || []).concat(D.TOWN_RARE_GEAR[town] || []).filter(have);
  if (gl.length && chance(grand ? .8 : .35)) { const g = pick(gl); DQ.grant(g); out.push({ id: g, n: 1, tag: 'epic' }); }
  const sp = (D.TOWN_SPECIALS[town] || []).filter(have).filter(i => !/^gem_/.test(i)); if (sp.length && chance(grand ? .7 : .3)) { const s = pick(sp), n = rnd(2, grand ? 8 : 4); DQ.grant(s, n); out.push({ id: s, n, tag: 'uncommon' }); }
  S().stats.rare = (S().stats.rare || 0) + 1; S().stats.bought = (S().stats.bought || 0) + 1; DQ.achDirty = true; DQ.emit('shop');
  return { grand, out, price: o.price };
};

/* ---------- The selected rare offer uses the same controls as the shop. ---------- */
const RAR = { rare: '#5f9bff', epic: '#c07aff', uncommon: '#5cc08a' };
UI.rarePage = () => {
  const offers = DQ.rareOffers(), qty = UI.shopQty;
  const choices = [
    ...offers.gear.map(g => ({ ...g, key: 'gear:' + g.id, name: D.ITEMS[g.id].name, owned: DQ.rareSold(g.id), text: g.trophy ? 'A replacement boss trophy. Defeat the town boss to unlock it.' : 'Local masterwork · one of each', count: 1 })),
    ...offers.mats.map(m => ({ ...m, key: 'mat:' + m.id, name: D.ITEMS[m.id].name, count: qty })),
    ...offers.caches.map(c => ({ key: 'cache:' + c.k, name: c.name, price: c.price, locked: !c.open, text: c.open ? 'Contains coins, gems and a chance of local gear. Contents vary.' : 'Sold in ' + c.need, count: 1 })),
    { key: 'tonic:luck', name: 'Fortune tonic', price: offers.tonic.price, locked: !offers.tonic.open, text: offers.tonic.open ? 'Rare drops are 50% more likely for 30 minutes. Stacks up to two hours.' : 'Sold in ' + offers.tonic.need, count: 1 }
  ];
  const selected = choices.find(c => c.key === UI.tab.rareChoice) || choices[0];
  const cost = selected.price * selected.count, affordable = S().coins >= cost;
  const disabled = selected.locked || selected.owned || !affordable;
  return `<div class="visual-shop"><section class="panel shop-stock"><div class="phead"><h2>Shop</h2><small>${esc(D.TOWN[S().town].name)}</small></div>${UI.shopTabs('rare')}<div class="illustrated-choices">${choices.map(c=>`<button class="illustrated-card ${c===selected?'selected':''}" data-do="rareselect" data-a="${c.key}" aria-pressed="${c===selected}"><span class="choice-art">${DQ.itemIco(D.ITEMS[c.id||(c.key.startsWith('cache:')?'treasure_chest':'potion_fortune')])}</span><b>${esc(c.name)}</b><span class="stock-price">${UI.money(c.price)}</span>${c.owned||c.locked?'<small>'+(c.owned?'Owned':'Locked')+'</small>':''}</button>`).join('')}</div></section><section class="panel shop-task"><div class="phead"><h2>Rare item</h2></div>
    <div class="shop-workspace"><div class="shop-purchase">${selected.id ? UI.shopPreview(selected.id) : `<h3>${esc(selected.name)}</h3>`}<div class="shop-controls"><label for="shop-quantity">Quantity${UI.choiceButtons(`<select id="shop-quantity" data-in="shop-quantity" ${selected.key.startsWith('mat:') ? '' : 'disabled'}>${[1,10,100].map(n => `<option value="${n}" ${selected.count === n ? 'selected' : ''}>${n}</option>`).join('')}</select>`)}</label></div>
    <div class="shop-action"><button class="btn primary" data-do="rarebuy" data-a="${selected.key}" ${disabled ? 'disabled' : ''}>${selected.owned ? 'Owned' : selected.locked ? 'Locked' : selected.key.startsWith('cache:') ? 'Open' : selected.key.startsWith('tonic:') ? 'Drink' : 'Buy'}${selected.key.startsWith('mat:')?' ×'+selected.count:''} ${UI.money(cost)}</button></div>
    ${selected.text ? `<p class="sm">${esc(selected.text)}</p>` : ''}${!affordable ? `<p class="bad sm">Need ${UI.money(cost - S().coins)} more.</p>` : ''}
    </div><div class="shop-comparison">${selected.id ? UI.compareHtml(selected.id) : ''}</div></div></section></div>`;
};
const origShop = UI.V.shop;
UI.V.shop = () => UI.shopTab === 'rare' ? UI.rarePage() : origShop();
Object.assign(UI.DO, {
  rarebuy: a => {
    const [kind, id] = a.split(':');
    if (kind === 'gear') { const o = DQ.rareOffers().gear.find(g => g.id === id); if (!o || DQ.rareSold(id)) return; if (S().coins < o.price) return DQ.toast('Not enough coins', true); S().coins -= o.price; DQ.give(id, 1); S().shopSold = S().shopSold || {}; S().shopSold[id] = 1; S().stats.bought++; DQ.sfx('buy'); DQ.log(`You buy the ${D.ITEMS[id].name.toLowerCase()}, made by local smiths.`); DQ.emit('shop'); }
    else if (kind === 'mat') { const o = DQ.rareOffers().mats.find(m => m.id === id), q = UI.shopQty; if (!o) return; if (S().coins < o.price * q) return DQ.toast('Not enough coins', true); S().coins -= o.price * q; DQ.give(id, q); S().stats.bought += q; DQ.sfx('buy'); DQ.emit('shop'); }
    else if (kind === 'tonic') { if (DQ.buyTonic()) DQ.toast('You feel lucky. Rare drops are more likely.'); }
    else if (kind === 'cache') { const r = DQ.openCache(id === 'grand'); if (r) UI.showCache(r); }
    UI.renderHud(); UI.render(false);
  }
});
UI.showCache = r => {
  const chips = r.out.map(o => o.coins ? `<span class="rw" style="--c:#f3d58a">${ico('coin')}${fmt(o.coins)} coins</span>` : `<span class="rw" style="--c:${RAR[o.tag] || D.ITEMS[o.id].col}">${ico(D.ITEMS[o.id].ic)}${o.n > 1 ? o.n + '× ' : ''}${esc(D.ITEMS[o.id].name)}</span>`).join('');
  const rare = r.out.some(o => o.tag === 'epic');
  DQ.modal({ title: `${r.grand ? 'Grand' : 'Fine'} cache opened`, body: `<p class="sm dim">${rare ? 'A piece of local masterwork was inside!' : 'The seal cracks open.'}</p><div class="rws">${chips}</div>`, actions: [{ label: 'Lovely', primary: true }] });
  if (rare) DQ.sfx('gem');
};

/* the tonic's effect on loot, and a small chip in the top bar for any active effect */
UI.B.hudbuff = e => { const L = DQ.buffs(), b = L[0]; e.hidden = !b; if (b) { UI.set(e, `${b.name} ${DQ.fmtTime(b.until - GT())}${L.length > 1 ? ` +${L.length - 1}` : ''}`); e.dataset.tip = 'text:' + L.map(x => `${x.name}: ${x.text || (x.type === 'luck' ? 'rare drops 50% more likely' : x.type === 'slow' ? 'tasks are slower' : 'damage is lower')} (${DQ.fmtTime(x.until - GT())} left)`).join('. '); } };
})();
