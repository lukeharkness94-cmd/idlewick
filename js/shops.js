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

/* ---------- Page: a third tab on the shop ---------- */
const RAR = { rare: '#5f9bff', epic: '#c07aff', uncommon: '#5cc08a' };
const row = (id, price, btn, sub) => { const it = D.ITEMS[id], can = S().coins >= price; return `<div class="srow ${can ? '' : 'cant'}">${UI.itm(id)}<div class="sr-t"><b>${esc(it.name)}</b><small>${sub || UI.itemSub(it)}</small></div><span class="price mono ${can ? '' : 'bad'}">${ico('coin')}${fmt(price)}</span>${btn}</div>`; };
const specialsLine = town => { const sp = (D.TOWN_SPECIALS[town] || []).filter(have).map(i => D.ITEMS[i].name); return sp.join(', '); };
UI.rarePage = () => {
  const t = D.TOWN[S().town], O = DQ.rareOffers(), qty = UI.shopQty, luck = DQ.luckLeft();
  const gear = O.gear.length ? O.gear.map(g => { const sold = DQ.rareSold(g.id), can = S().coins >= g.price; return row(g.id, g.price, sold ? '<span class="max">Owned</span>' : g.locked ? '<button class="btn sm" disabled>Locked</button>' : `<button class="btn sm ${can ? 'primary' : ''}" data-do="rarebuy" data-a="gear:${g.id}">Buy</button>`, g.trophy ? (g.locked ? `<span class="bad">Boss trophy. Defeat the boss of ${esc(D.TOWN[S().town].name)} to unlock.</span>` : 'Boss trophy. A replacement for one you never found.') : null); }).join('') : '<p class="dim">Nothing special from the smiths here.</p>';
  const mats = O.mats.map(m => row(m.id, m.price * qty, `<button class="btn sm ${S().coins >= m.price * qty ? 'primary' : ''}" data-do="rarebuy" data-a="mat:${m.id}">Buy ×${qty}</button>`, `${esc(DQ.cap(D.ITEMS[m.id].type))} · You have ${fmt(DQ.have(m.id))}`)).join('');
  const cache = c => `<div class="cache ${c.open ? '' : 'locked'}"><span class="cache-ic">${ico('pouch')}</span><div class="sr-t"><b>${c.name}</b><small>${c.open ? `Coins back, ${c.k === 'grand' ? '2 gems, a good chance of local gear and rare materials' : 'a gem, and a chance at local gear'}. Worth a gamble.` : `Sold in ${c.need}`}</small></div><span class="price mono">${ico('coin')}${fmt(c.price)}</span><button class="btn sm ${c.open && S().coins >= c.price ? 'primary' : ''}" ${c.open ? `data-do="rarebuy" data-a="cache:${c.k}"` : 'disabled'}>Open</button></div>`;
  const tonic = `<div class="cache ${O.tonic.open ? '' : 'locked'}"><span class="cache-ic">${ico('bottle')}</span><div class="sr-t"><b>Fortune tonic</b><small>${O.tonic.open ? `Rare drops are 50% more likely for 30 minutes (stacks up to 2 hours). ${luck > 0 ? `<b class="ok">Active: ${DQ.fmtTime(luck)} left.</b>` : ''}` : `Sold in ${O.tonic.need}`}</small></div><span class="price mono">${ico('coin')}${fmt(O.tonic.price)}</span><button class="btn sm ${O.tonic.open && S().coins >= O.tonic.price ? 'primary' : ''}" ${O.tonic.open ? 'data-do="rarebuy" data-a="tonic:luck"' : 'disabled'}>${luck > 0 ? 'Extend' : 'Drink'}</button></div>`;
  const elsewhere = D.TOWNS.filter(x => x.id !== S().town).map(x => { const known = DQ.townUnlocked(x.id); return `<div class="else ${known ? '' : 'locked'}"><b>${esc(x.name)}</b><small>${known ? esc(specialsLine(x.id)) || 'Local goods' : 'Reach this town to find out'}</small></div>`; }).join('');
  return `<section class="panel shophead fancy" style="--c:${t.col}"><div><span class="k">Rare wares</span><h2>${esc(t.name)} specialists</h2><small class="dim">What the locals sell that no general store stocks. Every town has different goods.</small></div><div class="sh-coins"><span class="k">Your coins</span><b class="mono">${ico('coin')} <span data-b="coins"></span></b></div></section>
    <section class="panel"><div class="phead"><div class="tabs">${[['buy', 'Buy'], ['rare', 'Rare wares'], ['sell', 'Sell']].map(([k, n]) => `<button class="tab ${k === 'rare' ? 'on' : ''}" data-do="shoptab" data-a="${k}">${n}</button>`).join('')}</div><div class="seg qty">${[1, 10, 100].map(q => `<button class="${qty === q ? 'on' : ''}" data-do="shopqty" data-a="${q}">×${q}</button>`).join('')}</div></div>
      <div class="shopcat"><div class="k">Jewellery, outfits and trophies · one of each</div><div class="srows">${gear}</div></div>
      <div class="shopcat"><div class="k">Rare materials</div><div class="srows">${mats}</div></div>
      <div class="shopcat"><div class="k">Caches and tonics</div><div class="srows">${cache(O.caches[0])}${cache(O.caches[1])}${tonic}</div></div>
      <div class="shopcat"><div class="k">Sold in other towns</div><div class="elsewhere">${elsewhere}</div></div></section>`;
};
const origShop = UI.V.shop;
UI.V.shop = () => {
  if (UI.shopTab === 'rare') return UI.rarePage();
  const h = origShop(), O = DQ.rareOffers(), n = O.gear.filter(g => !DQ.rareSold(g.id)).length;
  const teaser = `<button class="rare-teaser" data-do="shoptab" data-a="rare">${ico('star')}<span><b>Rare wares in ${esc(D.TOWN[S().town].name)}</b><small>${n ? `${n} rare piece${n > 1 ? 's' : ''} of gear, ` : ''}${esc(specialsLine(S().town))}, loot caches${O.tonic.open ? ' and a Fortune tonic' : ''}</small></span>${ico('arrow')}</button>`;
  return h.replace('data-do="shoptab" data-a="sell">Sell</button>', 'data-do="shoptab" data-a="sell">Sell</button><button class="tab" data-do="shoptab" data-a="rare">Rare wares</button>').replace('<div class="shopcat">', teaser + '<div class="shopcat">');
};
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
