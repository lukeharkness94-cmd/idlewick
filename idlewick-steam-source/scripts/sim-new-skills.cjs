/* Evidence for Carpentry, Sailing and Beastmastery (node scripts/sim-new-skills.cjs).
   Loads the game's real data and compares, per hour at each unlock level: XP, and the coin value of what you bring
   home (coins plus the sale value of items), against Fishing at the same level. Changes nothing. */
const fs = require('node:fs'), vm = require('node:vm'), path = require('node:path');
const root = path.join(__dirname, '..', 'js');
const ctx = vm.createContext({ console, Math, Date, JSON, window: null, document: { querySelector: () => null, querySelectorAll: () => [], createElement: () => ({}) } }); ctx.window = ctx;
for (const n of ['util', 'data', 'creatures_expanded', 'skill_expansion_data', 'data2', 'data3', 'economy', 'skills_new_data']) vm.runInContext(fs.readFileSync(path.join(root, n + '.js'), 'utf8'), ctx, { filename: n });
const D = ctx.DQ.data, XPM = .3;
const val = id => (D.ITEMS[id] || {}).val || 0;
console.log('Sailing voyages (per hour, before speed bonuses)');
console.log('island           lvl boat  XP/h     coin value/h   fishing at same level: XP/h  value/h');
for (const v of D.VOYAGES) {
  const n = 3600000 / v.t, coins = (v.coins[0] + v.coins[1]) / 2, loot = v.loot.reduce((t, [k, [a, b], p]) => t + p * (a + b) / 2 * val(k), 0);
  const f = D.NODES.fish.filter(x => x.lvl <= v.lvl).sort((a, b) => b.lvl - a.lvl)[0], fn = 3600000 / f.t;
  console.log(`${v.name.padEnd(16)} ${String(v.lvl).padEnd(3)} ${String(v.boat).padEnd(5)} ${String(Math.round(n * v.xp * XPM)).padEnd(8)} ${String(Math.round(n * (coins + loot))).padEnd(14)} ${String(Math.round(fn * f.xp * XPM)).padEnd(28)} ${Math.round(fn * val(f.item))}`);
}
console.log('\nCarpentry planks (per hour): XP and value added over selling the logs');
for (const r of D.RLIST.carpentry.filter(r => r.tab === 'Planks')) { const n = 3600000 / r.t, log = Object.keys(r.in)[0], pl = Object.keys(r.out)[0];
  console.log(`${r.name.padEnd(16)} lvl ${String(r.lvl).padEnd(3)} XP/h ${String(Math.round(n * r.xp * XPM)).padEnd(7)} value added/h ${Math.round(n * (val(pl) - val(log)))}`); }
console.log('\nBoats: materials value vs. the boat');
for (const b of D.BOATS) console.log(`${b[1].padEnd(9)} carpentry ${String(b[3]).padEnd(3)} reaches tier ${b[2]} islands · materials worth ${Object.entries(b[5]).reduce((t, [k, n]) => t + val(k) * n, 0)} coins`);
