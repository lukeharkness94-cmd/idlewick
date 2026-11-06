/* Boss ladder check: node scripts/sim-bosses.cjs
   For each region boss, builds a hero standing exactly at the boss's combat requirement (even melee levels), wearing
   the best melee set they can equip that drops in the region, carrying 15 of the best food they could cook, then runs
   the game's own fight forecast. A second row adds 3 levels. Spikes show up as a sudden drop in the win rate.
   Deterministic (seeded). Evidence for balancing only; it changes nothing. */
const fs = require('node:fs'), vm = require('node:vm'), path = require('node:path');
const root = path.join(__dirname, '..', 'js');
let seed = 7; const math = Object.create(Math); math.random = () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };
const el = () => ({ setAttribute() {}, classList: { add() {}, remove() {}, toggle() {} }, appendChild() {}, style: {}, querySelector() {}, querySelectorAll: () => [], addEventListener() {} });
const store = new Map();
const ctx = vm.createContext({ console, Math: math, Date, JSON, performance: { now: () => 0 }, setTimeout: () => 0, setInterval: () => 0, clearTimeout() {}, addEventListener() {}, matchMedia: () => ({ matches: false }), innerWidth: 1200, innerHeight: 800,
  btoa: s => Buffer.from(s, 'binary').toString('base64'), atob: s => Buffer.from(s, 'base64').toString('binary'), escape, unescape,
  localStorage: { getItem: k => store.get(k) || null, setItem: (k, v) => store.set(k, v), removeItem: k => store.delete(k) },
  document: { querySelector: () => null, querySelectorAll: () => [], getElementById: () => null, createElement: el, body: el(), addEventListener() {} } });
ctx.window = ctx;
const load = n => vm.runInContext(fs.readFileSync(path.join(root, n + '.js'), 'utf8'), ctx, { filename: n });
['util', 'data', 'creatures_expanded', 'skill_expansion_data', 'data2', 'data3', 'economy', 'state', 'audio'].forEach(load);
const q = ctx.DQ; q.notify = q.pulse = q.floatAt = q.flash = q.burstAt = q.burstEl = q.toast = q.go = q.splat = () => {};
['engine', 'systems', 'plan', 'meta'].forEach(load);
q.ui = { V: {}, DO: {}, B: {}, homeSections: [], render() {}, tabState: () => null }; q.tips = { item: () => '' }; q.goals = () => [];
['research', 'journey'].forEach(load);
const D = q.data;
const cookLvl = id => { const r = Object.values(D.RECIPES).find(r => r.out && r.out[id]); return r ? r.lvl : 1; };
const run = (boss, extra) => {
  q.S = q.newState(); const S = q.S; S.settings.notify = false; q.fxDirty();
  const req = boss.boss.req + extra; let L = 1;
  const setL = n => ['attack', 'strength', 'defence', 'hitpoints'].forEach(k => { S.xp[k] = D.XPF[Math.max(10, n)] || 0; });
  while (L < 99) { setL(L); if (q.combatLvl() >= req) break; L++; }
  if (q.lvl('hitpoints') < 10) S.xp.hitpoints = D.XPF[10];
  if (process.env.MAGIC) { S.unlocked.magic = true; S.xp.magic = D.XPF[+process.env.MAGIC]; }
  S.town = boss.town; D.TOWNS.slice(0, D.TOWN[boss.town].idx + 1).forEach(t => { S.towns[t.id] = { visited: true, boss: t.id !== boss.town }; });
  const gear = (D.TOWN_GEAR[boss.town] || []).concat(D.TOWN_GEAR[D.TOWNS[Math.max(0, D.TOWN[boss.town].idx - 1)].id] || []);
  const slots = {};
  for (const id of gear) { const it = D.ITEMS[id]; if (!it || new RegExp(process.env.SKIP || "bow_|staff_|_dagger").test(id)) continue; S.inv[id] = (S.inv[id] || 0) + 1; if (!q.canEquip(id).ok) { delete S.inv[id]; continue; } const sc = (it.atk || 0) + (it.str || 0) + (it.def || 0); if (!slots[it.slot] || sc > slots[it.slot][1]) slots[it.slot] = [id, sc]; }
  Object.values(slots).forEach(([id]) => q.equipItem(id));
  const food = D.FISH_IDS.filter(id => cookLvl(id) <= L).sort((a, b) => D.ITEMS[b].heal - D.ITEMS[a].heal)[0] || 'shrimp';
  S.inv[food] = 15; S.hp = q.maxHp(); q.fxDirty();
  const f = q.forecast(boss.id);
  if (process.env.ADVICE === boss.id && !extra) { q.S.hp = Math.ceil(q.maxHp() * .6); console.log(JSON.stringify(q.prepAdvice(boss.id, f).map(x => x.title + ' — ' + x.text), null, 1)); q.S.hp = q.maxHp(); }
  return { combat: q.combatLvl(), L, hp: q.maxHp(), food, heal: D.ITEMS[food].heal, win: f ? Math.round(f.wins / f.trials * 100) : null, fpk: f && f.foodPerKill != null ? f.foodPerKill.toFixed(1) : '-', t: f && f.avgMs ? Math.round(f.avgMs / 1000) + 's' : '-', gear: Object.values(slots).map(x => x[0]).join(' ') };
};
if (process.env.BOSS) Object.assign(D.MON.grubnash, JSON.parse(process.env.BOSS));
console.log('boss          req  combat lv  hp  food (heal)          win%  food/kill  time   +3 levels');
for (const b of D.MONLIST.filter(m => m.boss)) {
  const a = run(b, 0), c = run(b, 3);
  console.log(`${b.id.padEnd(13)} ${String(b.boss.req).padEnd(4)} ${String(a.combat).padEnd(6)} ${String(a.L).padEnd(3)} ${String(a.hp).padEnd(3)} ${(a.food + ' (' + a.heal + ')').padEnd(20)} ${String(a.win).padEnd(5)} ${String(a.fpk).padEnd(10)} ${a.t.padEnd(6)} ${c.win}%  ${process.env.GEAR ? a.gear : ""}`);
}
