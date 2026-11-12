/* Economy pacing simulator: node scripts/sim-economy.cjs [hours] [--no-economy]
   A steady, sensible player: rotates the gathering skills every 15 minutes on the best node in the current town,
   sells everything it gathers every 30 minutes, and reaches new towns at Hero-level checkpoints (a stand-in for
   combat progress, which this bot does not simulate). Reports coins against the game's real prices.
   Deterministic (seeded random). No browser, no dependencies. Evidence for balancing only; it changes nothing. */
const fs = require('node:fs'), vm = require('node:vm'), path = require('node:path');
const hours = Number(process.argv.find(a => /^\d+(\.\d+)?$/.test(a)) || 24), noEconomy = process.argv.includes('--no-economy');
const root = path.join(__dirname, '..', 'js');
function boot() {
  let seed = 11; const math = Object.create(Math); math.random = () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };
  const el = () => ({ setAttribute() {}, classList: { add() {}, remove() {}, toggle() {} }, appendChild() {}, style: {}, querySelector() {}, querySelectorAll: () => [], addEventListener() {} });
  const store = new Map();
  const ctx = vm.createContext({ console, Math: math, Date, JSON, performance: { now: () => 0 }, setTimeout: () => 0, setInterval: () => 0, clearTimeout() {}, addEventListener() {}, matchMedia: () => ({ matches: false }), innerWidth: 1200, innerHeight: 800,
    btoa: s => Buffer.from(s, 'binary').toString('base64'), atob: s => Buffer.from(s, 'base64').toString('binary'), escape, unescape,
    localStorage: { getItem: k => store.get(k) || null, setItem: (k, v) => store.set(k, v), removeItem: k => store.delete(k) },
    document: { querySelector: () => null, querySelectorAll: () => [], getElementById: () => null, createElement: el, body: el(), addEventListener() {} } });
  ctx.window = ctx;
  const load = n => vm.runInContext(fs.readFileSync(path.join(root, n + '.js'), 'utf8'), ctx, { filename: n });
  ['util', 'data', 'creatures_expanded', 'skill_expansion_data', 'data2', 'data3', ...(noEconomy ? [] : ['economy']), 'state', 'audio'].forEach(load);
  /* pre-tuning comparison: the engine still reads D.ECONOMY, so supply the original gathering values */
  if (noEconomy) ctx.DQ.data.ECONOMY = { version: 0, gatherCoinScale: 1, gatherTownScale: [1, 3, 8, 20, 50, 50, 50, 50], fishPouchChance: .008, fishChestChance: .001, woodNestChance: .008, mineGemChance: .04, mineCoinChance: .004 };
  const q = ctx.DQ; q.notify = q.pulse = q.floatAt = q.flash = q.burstAt = q.burstEl = q.toast = q.go = () => {};
  ['engine', 'systems', 'plan', 'meta'].forEach(load);
  q.ui = { V: {}, DO: {}, B: {}, homeSections: [], render() {}, tabState: () => null }; q.tips = { item: () => '' }; q.goals = () => [];
  ['research', 'journey'].forEach(load);
  q.S = q.newState(); q.fxDirty(); return q;
}
const q = boot(), D = q.data, S = q.S; S.settings.notify = false;
const TOWN_AT = { willowbrook: 1, mossbarrow: 12, saltmere: 22, ironpeak: 38, gloomfen: 52, emberfall: 66, skyreach: 84, hollow: 96 };
const KIND = { fishing: 'fish', woodcutting: 'wood', mining: 'mine' };
let earned = 0; const sellAll = () => { for (const [id, n] of Object.entries({ ...S.inv })) { const it = D.ITEMS[id]; if (it && it.val > 0 && n > 0 && it.type !== 'tool') { const c = S.coins; q.sell(id, n, 'pack'); earned += S.coins - c; } } };
const rows = [], marks = [0.5, 1, 2, 4, 8, 12, 16, 24, 36, 48].filter(h => h <= hours);
let last = { t: 0, coins: 0 };
for (let m = 1; m <= hours * 60; m++) {
  const hero = q.advLvl();
  for (const [t, lv] of Object.entries(TOWN_AT)) if (hero >= lv && !S.towns[t]) { S.towns[t] = { visited: true, boss: false }; const prev = D.TOWNS[D.TOWN[t].idx - 1]; if (prev && S.towns[prev.id]) S.towns[prev.id].boss = true; }
  S.town = D.TOWNS.filter(t => S.towns[t.id]).pop().id;
  if (!q.act || m % 15 === 1) {
    const skills = ['fishing', 'woodcutting', 'mining'].filter(s => q.skillUnlocked(s)), sk = skills[Math.floor(m / 15) % skills.length], kind = KIND[sk];
    const nodes = D.NODES[kind].filter(n => n.lvl <= q.lvl(sk)), here = nodes.filter(n => n.town === S.town).sort((a, b) => b.lvl - a.lvl)[0] || nodes.sort((a, b) => b.lvl - a.lvl)[0];
    if (here) { S.town = here.town; q.startAct(kind, here.id, { quiet: true }); }
  }
  q.simulate(60000);
  if (m % 30 === 0) sellAll();
  const h = m / 60;
  if (marks.includes(h)) { rows.push({ h, hero: q.advLvl(), town: S.town, coins: Math.round(S.coins), perHour: Math.round((S.coins - last.coins) / (h - last.t)) }); last = { t: h, coins: S.coins }; }
}
const price = id => D.ITEMS[id] && D.ITEMS[id].buy;
const reach = c => { const r = rows.find(x => x.coins >= c); return r ? r.h + 'h' : '> ' + hours + 'h'; };
console.log(`Idlewick economy simulation · ${hours}h active play · reward cuts ${noEconomy ? 'OFF (pre-tuning values)' : 'ON (current)'}`);
console.log('hour  hero  town         coins     coins/hr');
for (const r of rows) console.log(String(r.h).padEnd(6) + String(r.hero).padEnd(6) + r.town.padEnd(13) + String(r.coins).padEnd(10) + r.perHour);
const goals = [
  ['Tier 2 tool', price('tool_axe_2')], ['Tier 3 tool', price('tool_axe_3')], ['Tier 4 tool', price('tool_axe_4')], ['Cottage', D.HOUSE.price],
  ['Kitchen', (D.ROOMS.find(r => r.id === 'kitchen') || {}).price], ['Workshop', (D.ROOMS.find(r => r.id === 'workshop') || {}).price],
  ...Object.entries(D.PROJECTS).filter(([, p]) => p.cost.coins >= 1000).map(([id, p]) => ['Project: ' + p.name, p.cost.coins]),
  ['Scholarship tier III project (typical)', Math.round((D.TECHS.filter(t => t.tier === 3 && t.cost.coins).map(t => t.cost.coins).sort((a, b) => a - b)[2]) || 0)]
].filter(g => g[1]);
console.log('\nFirst time the purse covers each price (spending nothing):');
for (const [name, c] of goals) console.log('  ' + name.padEnd(46) + String(c).padStart(7) + '  ' + reach(c));
