/* Idlewick: building takes materials as well as coins (owner, 28 Nov 2026: "building anything in the game should require
   resources as well as money (pens, chicken coops etc)"; answer: materials matched to tier, coins roughly halved).
   Farm plots, livestock pens (the coops, sties and byres the farm animals live in), the cottage and its rooms now cost
   logs, planks and bars as well as coins, each tier from the materials a hero has at that stage: the first builds
   logs and bronze, then oak, iron, willow, steel, maple and mithril. Furniture, workshop ranks, the smithy's anvils and
   hammers, boats and restorations already took materials and are unchanged.
   Every build shows its needs as named held / required counts with a route to the source (needs.js), refuses with a
   plain reason when anything is short, spends atomically and puts everything back if the save fails. Prices inside
   the buttons use UI.money, so a big build keeps the hold-to-confirm (ui_feel.js DQ.bigSpend). */
(() => {
const Q = window.DQ, D = Q.data, UI = Q.ui || {}, S = () => Q.S, { fmt } = Q;
D.BUILD = {
  /* the first three plots and two pens come with the farm */
  plot: [null, null, null,
    { coins: 300, log_normal: 15 },
    { coins: 1250, log_normal: 25, bar_bronze: 5 },
    { coins: 4500, plank_oak: 20, bar_iron: 10 },
    { coins: 15000, plank_willow: 30, bar_steel: 10 },
    { coins: 45000, plank_maple: 40, bar_mithril: 10 }],
  pen: [null, null,
    { coins: 750, log_normal: 20, bar_bronze: 4 },
    { coins: 3000, plank_oak: 20, bar_iron: 8 },
    { coins: 10000, plank_willow: 30, bar_steel: 10 },
    { coins: 30000, plank_maple: 40, bar_mithril: 12 }],
  house: { coins: 1250, log_normal: 40, bar_bronze: 5 },
  room: {
    parlour: {},
    kitchen: { coins: 2000, log_oak: 20, bar_bronze: 10 },
    bedroom: { coins: 3500, log_oak: 30, bar_iron: 8 },
    garden: { coins: 4500, log_normal: 40, log_oak: 20 },
    workshop: { coins: 6000, plank_oak: 20, bar_iron: 15 },
    quarters: { coins: 10000, plank_willow: 25, bar_iron: 20 },
    trophy: { coins: 20000, plank_maple: 30, bar_steel: 15 }
  }
};
/* every older reader of the coin prices sees the halved coins */
D.BUILD.plot.forEach((c, i) => { if (c && i < D.PLOT_PRICES.length) D.PLOT_PRICES[i] = c.coins; });
D.BUILD.pen.forEach((c, i) => { if (c && i < D.PEN_PRICES.length) D.PEN_PRICES[i] = c.coins; });
D.HOUSE.price = D.BUILD.house.coins;
for (const r of D.ROOMS) { const c = D.BUILD.room[r.id]; if (c) r.price = c.coins || 0; }
/* the cost of the next build of a kind: 'plot', 'pen', 'house', or a room id */
Q.buildCost = (kind, id) => { const F = S().farm;
  if (kind === 'plot') return D.PLOT_PRICES[F.plotsBought] === undefined ? null : (D.BUILD.plot[F.plotsBought] || { coins: D.PLOT_PRICES[F.plotsBought] });
  if (kind === 'pen') return D.PEN_PRICES[F.pensBought] === undefined ? null : (D.BUILD.pen[F.pensBought] || { coins: D.PEN_PRICES[F.pensBought] });
  if (kind === 'house') return D.BUILD.house;
  if (kind === 'room') { const r = D.ROOMS.find(x => x.id === id); return r ? (D.BUILD.room[id] || { coins: r.price || 0 }) : null; }
  return null; };
const held = k => k === 'coins' ? S().coins : Q.have(k);
Q.buildShort = cost => Object.entries(cost || {}).filter(([k, n]) => n > 0 && held(k) < n).map(([k, n]) => ({ id: k, need: n - held(k) }));
/* one plain sentence: "You need 12 more oak logs and 300 more coins." */
Q.buildReason = cost => { const s = Q.buildShort(cost); if (!s.length) return '';
  const part = x => x.id === 'coins' ? `${fmt(x.need)} more coins` : `${fmt(x.need)} more ${(D.ITEMS[x.id] ? D.ITEMS[x.id].name : x.id).toLowerCase()}`;
  const list = s.map(part); return `You need ${list.length > 1 ? list.slice(0, -1).join(', ') + ' and ' + list[list.length - 1] : list[0]}.`; };
/* spend and apply in one step; nothing changes unless the save succeeds */
const build = (cost, apply) => {
  if (Q.forecasting || (Q.sim && Q.sim.on)) return false;
  const why = Q.buildReason(cost); if (why) { Q.toast(why, true); return false; }
  const before = JSON.parse(JSON.stringify(S()));
  for (const [k, n] of Object.entries(cost)) { if (!n) continue; if (k === 'coins') S().coins -= n; else Q.take(k, n); }
  apply();
  if (Q.save && !Q.save()) { Q.S = before; if (Q.xpAliases) Q.xpAliases(Q.S); if (Q.fxDirty) Q.fxDirty(); Q.toast('The build could not be saved, so nothing was spent.', true); Q.emit('farm'); Q.emit('house'); return false; }
  return true; };
Q.buyPlot = () => { const F = S().farm, cost = Q.buildCost('plot'); if (!cost) return Q.toast('No more land to buy', true);
  if (!build(cost, () => { F.plotsBought++; Q.syncPlots(); })) return false;
  Q.sfx('buy'); Q.log(`You fence and dig a new plot.`); Q.emit('farm'); return true; };
Q.buyPen = () => { const F = S().farm, cost = Q.buildCost('pen'); if (!cost) return Q.toast('Your barn is as big as it gets', true);
  if (!build(cost, () => { F.pensBought++; })) return false;
  Q.sfx('buy'); Q.log(`You build a new pen.`); Q.emit('farm'); return true; };
Q.buyHouse = () => { const H = S().house; if (H.owned) return false;
  if (Q.advLvl() < D.HOUSE.adv) return Q.toast(`You can buy a house at Hero level ${D.HOUSE.adv}`, true);
  if (!build(Q.buildCost('house'), () => { H.owned = true; H.rooms = { parlour: true }; })) return false;
  Q.sfx('quest');
  Q.notify({ kind: 'quest', key: 'house', icon: 'house', col: '#d8a64a', title: 'You own a house!', text: `${D.HOUSE.where[0].toUpperCase() + D.HOUSE.where.slice(1)}. Furnish it for permanent bonuses.`, sound: false, burst: true });
  Q.achDirty = true; Q.emit('house'); return true; };
Q.buildRoom = id => { const H = S().house, r = D.ROOMS.find(x => x.id === id); if (!r || !H.owned || H.rooms[id]) return false;
  if (!build(Q.buildCost('room', id), () => { H.rooms[id] = true; })) return false;
  Q.sfx('anvil'); Q.log(`You build a ${r.name.toLowerCase()}.`, 'quest'); Q.achDirty = true; Q.emit('house'); return true; };
/* ---------- on the page: the coins inside the button (UI.money, so a big build holds to confirm), the materials as
   named held / required counts with a route to each source ---------- */
UI.buildMats = (cost, o = {}) => { const mats = Object.fromEntries(Object.entries(cost || {}).filter(([k, n]) => k !== 'coins' && n > 0)); return Object.keys(mats).length && UI.needTiles ? UI.needTiles(mats, { compact: !!o.compact, live: true }) : ''; };
UI.buildPrice = cost => cost && cost.coins ? UI.money(cost.coins) : 'Free';
UI.buildLine = cost => !cost ? '' : `<span class="build-cost">${UI.buildPrice(cost)}${UI.buildMats(cost, { compact: true })}</span>`;
/* the guidance reads the same cost: Next step and the Home goals say what is missing, not only the coins */
const goals0 = Q.goals;
if (goals0) Q.goals = (...a) => { const out = goals0(...a); for (const g of out || []) {
  const cost = g.id === 'house' ? Q.buildCost('house') : g.id === 'plot' ? Q.buildCost('plot') : null; if (!cost) continue;
  const why = Q.buildReason(cost); g.ready = !why; if (why) g.sub = why; }
  return out; };
})();
