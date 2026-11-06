/* Opening-journey simulator: node scripts/sim-opening.cjs
   A purposeful beginner, played through the real engine (no granted resources): accepts First Steps and Goblin
   Menace, fishes and chops for First Steps, cooks the catch for food, then fights the best Willowbrook target
   (switching training style every few minutes like a player using the Train buttons), claiming quests as they become
   ready. Reports the minutes to each combat level and a forecast win rate against Grubnash at each stage, using
   the game's own fight forecast. Deterministic (seeded). Evidence for balancing only. */
const fs = require('node:fs'), vm = require('node:vm'), path = require('node:path');
const root = path.join(__dirname, '..', 'js');
let seed = 13; const math = Object.create(Math); math.random = () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };
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
q.S = q.newState(); q.fxDirty(); const S = q.S, D = q.data; S.settings.notify = false;

if (process.env.BOSS) Object.assign(D.MON.grubnash, JSON.parse(process.env.BOSS));
if (process.env.REQ) D.MON.grubnash.boss.req = +process.env.REQ;
const boss = D.MON.grubnash, req = boss.boss.req;
let minute = 0; const log = [];
const step = (min, fn) => { for (let i = 0; i < min; i++) { fn && fn(); q.simulate(60000); minute++; claim(); } };
const claim = () => { for (const id of Object.keys(S.q)) if (S.q[id].s === 'ready') q.claimQuest(id); };
const accept = id => { if (q.questState(D.QM[id]) === 'new') q.startQuest(id); };
const forecast = () => { const prevTown = S.town; const f = q.forecast('grubnash'); return f ? Math.round(f.wins / f.trials * 100) : null; };

accept('first_steps'); accept('goblin_menace');
q.startAct('fish', 'shrimp', { quiet: true }); step(4);
q.startAct('wood', 'normal', { quiet: true }); step(2);
if (q.skillUnlocked('cooking')) { q.startAct('recipe', 'cook_shrimp', { quiet: true }); step(2); }
accept('hungry_cook');
const styles = ['aggressive', 'accurate', 'defensive'];
const marks = {}; const fightMin = { start: minute };
for (let m = 0; m < 120 && q.combatLvl() < req; m++) {
  const best = D.MONLIST.filter(x => x.town === 'willowbrook' && !x.boss && x.cl <= q.combatLvl() + 2).sort((a, b) => b.cl - a.cl)[0] || D.MON.chicken;
  if (!q.act || q.act.id !== best.id) q.startAct('fight', best.id, { quiet: true });
  S.style.melee = styles[Math.floor(m / 4) % 3];
  if ((S.inv.shrimp || 0) < 3 && (S.inv.raw_shrimp || 0) > 0 && q.skillUnlocked('cooking')) { q.startAct('recipe', 'cook_shrimp', { quiet: true }); step(1); continue; }
  if (!q.foods().length) { q.startAct('fish', 'shrimp', { quiet: true }); step(2); continue; }
  step(1);
  const cl = q.combatLvl(); if (!marks[cl]) { marks[cl] = minute; log.push(`  combat ${cl} at ${minute} min (hero ${q.advLvl()}, attack ${q.lvl('attack')}, strength ${q.lvl('strength')}, defence ${q.lvl('defence')}, health ${q.lvl('hitpoints')})`); }
}
console.log(`Opening journey · Grubnash requires combat ${req} · boss level ${boss.cl}, health ${boss.hp}, max hit ${boss.max}`);
console.log(log.join('\n'));
console.log(`Reached the boss requirement after ${minute} minutes (${minute - fightMin.start} of them fighting). Quests: ${Object.entries(S.q).map(([k, v]) => k + ':' + v.s).join(', ')}`);
S.town = 'willowbrook'; const food = q.foods().reduce((n, f) => n + q.have(f), 0);
console.log(`Food in pack: ${food}. Forecast win rate vs Grubnash now: ${forecast()}%`);
const f = q.forecast('grubnash'); console.log('forecast detail:', JSON.stringify(f), '| hero max hit', q.pstats().max, 'hp', q.maxHp(), 'weapon', S.equip.weapon, 'foods', JSON.stringify(q.foods().map(x => [x, q.have(x), D.ITEMS[x].heal])));
/* what preparation would a beginner reasonably have? scenarios on top of the state reached above */
S.hp = q.maxHp(); /* a player rests to full before a boss */
const base = JSON.stringify(S), price = id => D.ITEMS[id].buy;
console.log('coins', S.coins, '| shop bronze: helm', price('bronze_helm'), 'body', price('bronze_body'), 'legs', price('bronze_legs'), 'shield', price('bronze_shield'));
const scen = (label, fn) => { q.S = JSON.parse(base); q.fxDirty(); fn(q.S); const rs = [0, 1, 2, 3].map(() => q.forecast('grubnash')), r = { trials: 96, wins: rs.reduce((n, x) => n + x.wins, 0), avgMs: rs.reduce((n, x) => n + x.ms, 0) / Math.max(1, rs.reduce((n, x) => n + x.wins, 0)), foodPerKill: +(rs.reduce((n, x) => n + x.eaten, 0) / Math.max(1, rs.reduce((n, x) => n + x.wins, 0))).toFixed(1) }; console.log(`  ${label.padEnd(54)} win ${Math.round(r.wins / r.trials * 100)}%  food/kill ${r.foodPerKill ?? '-'}  time ${r.avgMs ? Math.round(r.avgMs / 1000) + 's' : '-'}`); };
const gear = (S2, ids) => ids.forEach(id => { S2.inv[id] = (S2.inv[id] || 0) + 1; q.equipItem(id); });
scen('as reached', () => {});
scen('+15 cooked shrimp', S2 => { S2.inv.shrimp = (S2.inv.shrimp || 0) + 15; });
scen('bronze helm+body+legs+shield, +15 shrimp', S2 => { gear(S2, ['bronze_helm', 'bronze_body', 'bronze_legs', 'bronze_shield']); S2.inv.shrimp = (S2.inv.shrimp || 0) + 15; });
scen('follows the advice: bronze set + hammer, +15 shrimp', S2 => { gear(S2, ['bronze_helm', 'bronze_body', 'bronze_legs', 'bronze_shield', 'bronze_hammer']); S2.inv.shrimp = (S2.inv.shrimp || 0) + 15; });
scen('full bronze, +15 shrimp, +3 combat levels', S2 => { gear(S2, ['bronze_helm', 'bronze_body', 'bronze_legs', 'bronze_shield']); S2.inv.shrimp = (S2.inv.shrimp || 0) + 15; S2.xp.attack = D.XPF[q.lvl('attack') + 3]; S2.xp.strength = D.XPF[q.lvl('strength') + 3]; S2.xp.defence = D.XPF[q.lvl('defence') + 3]; });
if (process.env.TRACE) { q.S = JSON.parse(base); q.fxDirty(); const S3 = q.S; console.log('hp at start', S3.hp, '/', q.maxHp(), 'eatAt', S3.settings.autoEat, S3.settings.eatAt);
  q.startAct('fight', 'grubnash', { quiet: true }); let t = 0; while (q.act && t < 120000) { const r = q.simulate(2000); t += 2000; console.log(t / 1000 + 's', 'hero', q.S.hp, 'boss', q.fight && q.fight.hp, 'eaten', r.eaten, 'died', r.died, 'food', q.have('shrimp')); if (r.died) break; } }
if (process.env.ADVICE) { q.S = JSON.parse(base); q.S.hp = 4; q.fxDirty(); console.log(JSON.stringify(q.prepAdvice('grubnash', q.forecast('grubnash')), null, 1)); }
