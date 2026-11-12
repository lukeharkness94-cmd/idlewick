/* Unique gear check: node scripts/sim-uniques.cjs (loader shared with sim-bosses.cjs)
   Boss ladder loader below:
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
/* the same gameplay systems the shipped page composes on top: field guide, enchantments, adventures, companion tricks */
for (const n of ['lore', 'hunting', 'bestiary', 'skill_expansion', 'adventures', 'companions']) { try { load(n); } catch (e) { console.error('sim-bosses: could not load ' + n + ': ' + e.message); process.exit(1); } }
const D = q.data;
/* For every unique item: a hero at the level of the region where it drops (the boss requirement there), wearing the
   region's best ordinary gear, abilities and 15 food. Compare that baseline with the same hero swapping the unique into
   its slot, against the region's toughest ordinary monster (seconds per kill, food per kill) and its boss (win rate).
   The unique should be a noticeable, situational choice: better somewhere, not strictly better everywhere. */
const uniques = Object.keys(D.ITEMS).filter(id => D.ITEMS[id].unique);
const dropTown = id => { const m = D.MONLIST.find(m => (m.drops || []).some(d => d[0] === id)) || D.MONLIST.find(m => m.boss && (m.boss.trophy === id || (m.drops || []).some(d => d[0] === id))); return m ? m.town : null; };
const trophyTown = id => { const b = D.MONLIST.find(m => m.boss && JSON.stringify(m).includes('"' + id + '"')); return b ? b.town : null; };
const fight = (monId, n = 4) => { const fs = [...Array(n)].map(() => q.forecast(monId)).filter(Boolean); const w = fs.reduce((a, x) => a + x.wins, 0), ms = fs.reduce((a, x) => a + x.ms, 0), e = fs.reduce((a, x) => a + x.eaten, 0), t = fs.reduce((a, x) => a + x.trials, 0); return { win: Math.round(w / t * 100), s: w ? Math.round(ms / w / 1000) : null, food: w ? (e / w).toFixed(1) : '-' }; };
const setup = (town, style, uniq, reqOf = uniq) => {
  q.S = q.newState(); const S = q.S; S.settings.notify = false; S.town = town; const tier = D.TOWN[town].idx;
  D.TOWNS.slice(0, tier + 1).forEach(t => { S.towns[t.id] = { visited: true, boss: t.id !== town }; });
  const boss = D.MONLIST.find(m => m.boss && m.town === town), req = boss.boss.req;
  let L = 10; const set = n => { S.xp.defence = D.XPF[n]; S.xp.hitpoints = D.XPF[n]; if (style === 'melee') { S.xp.attack = D.XPF[n]; S.xp.strength = D.XPF[n]; } else { S.unlocked[style] = true; S.xp[style] = D.XPF[Math.min(99, Math.round(n * 4 / 3))]; } };
  while (L < 99) { set(L); q.fxDirty(); if (q.combatLvl() >= req) break; L++; }
  const it = reqOf && D.ITEMS[reqOf]; if (it && it.req) for (const [k, v] of Object.entries(it.req)) { S.unlocked[k] = true; if (q.lvl(k) < v) S.xp[k] = D.XPF[v]; }
  const region = new Set([...(D.TOWN_GEAR[town] || []), ...(D.TOWN_GEAR[D.TOWNS[Math.max(0, tier - 1)].id] || []), ...['arrow_bronze', 'arrow_iron', 'arrow_steel', 'arrow_mithril', 'arrow_adamant', 'arrow_rune', 'arrow_astral'].slice(0, tier + 1)]);
  const pick = re => Object.keys(D.ITEMS).filter(id => re.test(id) && region.has(id)).map(id => { S.inv[id] = 1; const ok = q.canEquip(id).ok; delete S.inv[id]; return ok ? id : null; }).filter(Boolean);
  for (const slot of ['head', 'body', 'legs']) { const best = pick(new RegExp(`_${({ head: 'helm', body: 'body', legs: 'legs' })[slot]}$`)).filter(id => !/robe_/.test(id)).sort((a, b) => (D.ITEMS[b].b.def || 0) - (D.ITEMS[a].b.def || 0))[0]; if (best) { S.inv[best] = 1; q.equipItem(best); } }
  let wpn; if (style === 'melee') wpn = pick(/^(bronze|iron|steel|mithril|adamant|rune|astral)_(sword|hammer)$/).sort((a, b) => (D.ITEMS[b].b.atk + D.ITEMS[b].b.str) - (D.ITEMS[a].b.atk + D.ITEMS[a].b.str))[0];
  if (style === 'ranged') { wpn = pick(/^bow_/).pop(); const ar = pick(/^arrow_/).pop(); S.inv[ar] = 5000; q.equipItem(ar); }
  if (style === 'magic') { wpn = pick(/^staff_/).pop(); S.inv.rune = 99999; const sp = D.SPELLS.filter(x => q.lvl('magic') >= x.lvl).pop(); S.spell = sp.id; }
  S.inv[wpn] = 1; q.equipItem(wpn);
  if (style === 'melee') { const sh = pick(/_shield$/).sort((a, b) => D.ITEMS[b].b.def - D.ITEMS[a].b.def)[0]; if (sh) { S.inv[sh] = 1; q.equipItem(sh); } }
  const base = Object.assign({}, S.equip);
  if (uniq) { S.inv[uniq] = 1; const r = q.equipItem(uniq); if (r && r.ok === false) return { err: r.why }; }
  S.abilities = (style === 'melee' ? ['power', 'brace', 'bash', 'second'] : style === 'ranged' ? ['brace', 'aimed', 'pin', 'kite'] : ['brace', 'ward', 'focus', 'second']).filter(a => q.abilUnlocked(D.AB[a])).slice(0, q.abilSlots());
  const f = D.FISH_IDS.filter(id => { const r = Object.values(D.RECIPES).find(r => r.out && r.out[id]); return !r || r.lvl <= L; }).sort((a, b) => D.ITEMS[b].heal - D.ITEMS[a].heal)[0]; S.inv[f] = 15; S.hp = q.maxHp(); q.fxDirty();
  return { boss, base, L };
};
console.log('unique                 slot     region       vs toughest regular (s/kill, food/kill)        vs boss (win%)');
for (const id of uniques) {
  const it = D.ITEMS[id], town = dropTown(id) || trophyTown(id); if (!town) { console.log(id, 'no source town'); continue; }
  const style = it.style || (it.slot === 'weapon' ? 'melee' : 'melee');
  const mon = D.MONLIST.filter(m => m.town === town && !m.boss).sort((a, b) => b.cl - a.cl)[0];
  const a = setup(town, style, null, id); if (a.err) { console.log(id, a.err); continue; } const ra = fight(mon.id), ba = fight(a.boss.id);
  const b = setup(town, style, id); if (b.err) { console.log(id, 'cannot equip: ' + b.err); continue; } const rb = fight(mon.id), bb = fight(b.boss.id);
  const d = (x, y) => x == null || y == null ? '' : (y < x ? `${Math.round((1 - y / x) * 100)}% faster` : y > x ? `${Math.round((y / x - 1) * 100)}% slower` : 'same');
  console.log(`${id.padEnd(22)} ${it.slot.padEnd(8)} ${town.padEnd(12)} ${mon.id.padEnd(10)} ${String(ra.s).padStart(4)}s ${ra.food.padStart(4)} -> ${String(rb.s).padStart(4)}s ${rb.food.padStart(4)} (${d(ra.s, rb.s)})   ${a.boss.id.padEnd(11)} ${String(ba.win).padStart(3)}% -> ${String(bb.win).padStart(3)}%  food ${ba.food}->${bb.food}`);
}
