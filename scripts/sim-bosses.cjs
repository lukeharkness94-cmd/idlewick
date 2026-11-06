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
/* the same gameplay systems the shipped page composes on top: field guide, enchantments, adventures, companion tricks */
for (const n of ['lore', 'hunting', 'bestiary', 'skill_expansion', 'adventures', 'companions']) { try { load(n); } catch (e) { console.error('sim-bosses: could not load ' + n + ': ' + e.message); process.exit(1); } }
const D = q.data;
const cookLvl = id => { const r = Object.values(D.RECIPES).find(r => r.out && r.out[id]); return r ? r.lvl : 1; };
const run = (boss, extra, useCounter) => {
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
  S.inv[food] = 15; const how = useCounter ? counter(boss) : 'melee'; if (process.env.NOABIL) S.abilities = []; S.abilities = (S.abilities || []).filter(a => q.abilUnlocked(D.AB[a])).slice(0, q.abilSlots()); S.hp = q.maxHp(); q.fxDirty();
  const fs4 = [0, 1, 2, 3].map(() => q.forecast(boss.id)), f = fs4[0] && { trials: 96, wins: fs4.reduce((n, x) => n + x.wins, 0), ms: fs4.reduce((n, x) => n + x.ms, 0), eaten: fs4.reduce((n, x) => n + x.eaten, 0) };
  if (f) { f.winRate = f.wins / f.trials; f.avgMs = f.wins ? f.ms / f.wins : null; f.foodPerKill = f.wins ? f.eaten / f.wins : null; }
  if (process.env.ADVICE === boss.id && !extra) { q.S.hp = Math.ceil(q.maxHp() * .6); console.log(JSON.stringify(q.prepAdvice(boss.id, f).map(x => x.title + ' — ' + x.text), null, 1)); q.S.hp = q.maxHp(); }
  return { how, combat: q.combatLvl(), L, hp: q.maxHp(), food, heal: D.ITEMS[food].heal, win: f ? Math.round(f.wins / f.trials * 100) : null, fpk: f && f.foodPerKill != null ? f.foodPerKill.toFixed(1) : '-', t: f && f.avgMs ? Math.round(f.avgMs / 1000) + 's' : '-', gear: Object.values(slots).map(x => x[0]).join(' ') };
};
/* Counter loadout: what the boss's field guide recommends. Elemental weakness -> staff and that spell; pierce -> bow and
   arrows; a melee type -> the matching weapon; Hollow King (changes form) -> magic. The counter skill is set so combat
   level stays at the requirement (1.33x the melee level, as the combat formula weighs it), and fitting abilities are slotted. */
const counter = boss => {
  const S = q.S, w = D.WEAK[boss.id] || { weak: [] }, tier = D.TOWN[boss.town].idx;
  const el = w.weak.find(t => Object.values(D.SPELL_EL).includes(t)) || (boss.id === 'hollowking' ? 'aether' : null);
  const L = q.lvl('attack'), C = Math.min(99, Math.round(L * (+process.env.CSCALE || 1)));
  const region = new Set([...(D.TOWN_GEAR[boss.town] || []), ...(D.TOWN_GEAR[D.TOWNS[Math.max(0, tier - 1)].id] || []), ...['arrow_bronze', 'arrow_iron', 'arrow_steel', 'arrow_mithril', 'arrow_adamant', 'arrow_rune', 'arrow_astral'].slice(0, tier + 1)]);
  const pick = re => Object.keys(D.ITEMS).filter(id => re.test(id) && region.has(id)).map(id => { S.inv[id] = 1; const ok = q.canEquip(id).ok; delete S.inv[id]; return ok ? id : null; }).filter(Boolean).pop();
  if (el && !w.weak.includes('pierce') || boss.id === 'hollowking') {
    S.unlocked.magic = true; S.xp.magic = D.XPF[C]; q.fxDirty();
    const sp = D.SPELLS.filter(x => D.SPELL_EL[x.id] === el && q.lvl('magic') >= x.lvl).pop() || D.SPELLS.filter(x => q.lvl('magic') >= x.lvl).pop();
    const staff = pick(/^staff_/); S.inv[staff] = 1; q.equipItem(staff); S.spell = sp.id; S.inv.rune = 5000; S.abilities = ['focus', 'ward'];
    return `magic, ${staff}, ${sp.name}`;
  }
  if (w.weak.includes('pierce')) {
    S.unlocked.ranged = true; S.xp.ranged = D.XPF[C]; q.fxDirty();
    const bow = pick(/^bow_/), arrow = pick(/^arrow_/); S.inv[bow] = 1; q.equipItem(bow); S.inv[arrow] = 3000; q.equipItem(arrow); S.abilities = ['pin', 'aimed', 'kite'];
    return `ranged, ${bow}, ${arrow}`;
  }
  const want = w.weak.includes('crush') ? /_hammer$/ : w.weak.includes('stab') ? /_dagger$/ : /_sword$/, wpn = pick(new RegExp('^(bronze|iron|steel|mithril|adamant|rune)' + want.source));
  if (wpn) { S.inv[wpn] = 1; q.equipItem(wpn); } S.abilities = ['power', 'bash', 'brace'];
  return `melee, ${wpn || S.equip.weapon}`;
};
if (process.env.BOSS) Object.assign(D.MON.grubnash, JSON.parse(process.env.BOSS));
/* BOSSES='{"oldtusk":{"max":8}}' overrides any boss's stats for tuning experiments */
if (process.env.BOSSES) for (const [id, o] of Object.entries(JSON.parse(process.env.BOSSES))) { if (o.mult) { D.MON[id].boss.special.mult = o.mult; delete o.mult; } if (o.every) { D.MON[id].boss.special.every = o.every; delete o.every; } Object.assign(D.MON[id], o); }
/* COMPARE=1: is preparation a real choice? For each boss, four builds at the requirement (96 forecast fights each):
   general  - region melee gear, the melee abilities you would have, 15 food
   counter  - the field guide's recommendation (see counter())
   alt      - general, plus what a melee player can prepare without a new style: Potion of Might and Haste, +3 enchantments
              on weapon and body armour, a defensive unique (Warden's greathelm once The Silent Bells is possible), the
              Gobbo companion's heckle, and 25 food
   over     - general at +5 levels in every melee skill
   Preparation cost is estimated from the game's own numbers: XP to train, shop prices, gems, food. */
const xpRate = (boss, setup, sk) => { q.S = q.newState(); const S = q.S; S.settings.notify = false; setup(S); q.fxDirty(); const reg = D.MONLIST.filter(m => m.town === boss.town && !m.boss).sort((a, b) => b.cl - a.cl)[0]; S.town = boss.town; D.TOWNS.slice(0, D.TOWN[boss.town].idx + 1).forEach(t => { S.towns[t.id] = { visited: true, boss: t.id !== boss.town }; }); S.inv.shark = 500; S.hp = q.maxHp(); const x0 = S.xp[sk]; if (!q.startAct('fight', reg.id, { quiet: true })) return 0; q.simulate(20 * 60000); return (S.xp[sk] - x0) * 3; };
const compare = boss => {
  const rows = [], base = run(boss, 0, false);
  const L = q.lvl('attack');
  const lv0 = Math.max(10, base.L), general = (S2, extraLv = 0) => { for (const k of ['attack', 'strength', 'defence', 'hitpoints']) S2.xp[k] = D.XPF[Math.min(99, lv0 + extraLv)] || 0; };
  const res = (label, setupFn, costText) => {
    q.S = q.newState(); const S = q.S; S.settings.notify = false; q.fxDirty(); setupFn(S);
    S.hp = q.maxHp(); q.fxDirty(); const fs4 = [0, 1, 2, 3].map(() => q.forecast(boss.id)); const w = fs4.reduce((n, x) => n + (x ? x.wins : 0), 0), e = fs4.reduce((n, x) => n + (x ? x.eaten : 0), 0);
    rows.push(`    ${label.padEnd(9)} win ${String(Math.round(w / 96 * 100)).padStart(3)}%  food/win ${w ? (e / w).toFixed(1) : '-'}  | ${costText}`);
  };
  const town = S => { S.town = boss.town; D.TOWNS.slice(0, D.TOWN[boss.town].idx + 1).forEach(t => { S.towns[t.id] = { visited: true, boss: t.id !== boss.town }; }); };
  const gearUp = (S, extraIds = []) => {
    const gear = (D.TOWN_GEAR[boss.town] || []).concat(D.TOWN_GEAR[D.TOWNS[Math.max(0, D.TOWN[boss.town].idx - 1)].id] || []), slots = {};
    for (const id of gear) { const it = D.ITEMS[id]; if (!it || /bow_|staff_|_dagger/.test(id)) continue; S.inv[id] = 1; if (!q.canEquip(id).ok) { delete S.inv[id]; continue; } const sc = (it.b.atk || 0) + (it.b.str || 0) + (it.b.def || 0); if (!slots[it.slot] || sc > slots[it.slot][1]) slots[it.slot] = [id, sc]; }
    Object.values(slots).forEach(([id]) => q.equipItem(id)); for (const id of extraIds) { S.inv[id] = 1; q.equipItem(id); }
    S.abilities = ['power', 'brace', 'bash', 'second'].filter(a => q.abilUnlocked(D.AB[a])).slice(0, q.abilSlots());
  };
  const foodFor = (S, n) => { const ck = id => { const r = Object.values(D.RECIPES).find(r => r.out && r.out[id]); return r ? r.lvl : 1; }; const f = D.FISH_IDS.filter(id => ck(id) <= lv0).sort((a, b) => D.ITEMS[b].heal - D.ITEMS[a].heal)[0] || 'shrimp'; S.inv[f] = n; return f; };
  res('general', S => { general(S); town(S); gearUp(S); foodFor(S, 15); }, 'region gear and 15 food: no extra preparation');
  /* the counter (reuses the simulator's own counter loadout at the same level) */
  { const c = run(boss, 0, true); rows.push(`    ${'counter'.padEnd(9)} win ${String(c.win).padStart(3)}%  food/win ${c.fpk}  | ${c.how}; train the style to ${lv0} (${Math.round(D.XPF[lv0] / 1000)}k XP from scratch)`); }
  const helm = D.TOWN[boss.town].idx >= 2 ? ['wardens_greathelm'] : [];
  res('alt', S => { general(S); town(S); S.unlocked.enchanting = true; S.xp.enchanting = D.XPF[40]; gearUp(S, helm); foodFor(S, 25);
    for (const id of [S.equip.weapon, S.equip.body].filter(Boolean)) S.enchants[id] = 3;
    S.gameTime = S.gameTime || 0; S.buffs = [{ type: 'weak', mult: 1.15, until: S.gameTime + 20 * 60000, name: 'Might' }, { type: 'slow', mult: .85, until: S.gameTime + 20 * 60000, name: 'Haste' }];
    S.pets.owned.gobbo = { aff: 0, found: 1 }; S.pets.active = 'gobbo'; },
    `Might + Haste (${D.ITEMS.potion_might.val + D.ITEMS.potion_haste.val} coins of potions), +3 enchants (2 sapphires, 2 emeralds, 2 rubies), ${helm.length ? "Warden's greathelm (The Silent Bells), " : ''}Gobbo, 25 food`);
  if (process.env.PARTS) {
    res('+potions', S => { general(S); town(S); gearUp(S); foodFor(S, 15); S.gameTime = S.gameTime || 0; S.buffs = [{ type: 'weak', mult: 1.15, until: S.gameTime + 20 * 60000, name: 'Might' }, { type: 'slow', mult: .85, until: S.gameTime + 20 * 60000, name: 'Haste' }]; }, 'Might + Haste only');
    res('+enchant', S => { general(S); town(S); S.unlocked.enchanting = true; S.xp.enchanting = D.XPF[40]; gearUp(S); foodFor(S, 15); for (const id of [S.equip.weapon, S.equip.body].filter(Boolean)) S.enchants[id] = 3; }, '+3 enchants only');
    if (helm.length) res('+helm', S => { general(S); town(S); gearUp(S, helm); foodFor(S, 15); }, "Warden's greathelm only");
    res('+food', S => { general(S); town(S); gearUp(S); foodFor(S, 25); }, '25 food only');
    res('+gobbo', S => { general(S); town(S); gearUp(S); foodFor(S, 15); S.pets.owned.gobbo = { aff: 0, found: 1 }; S.pets.active = 'gobbo'; }, 'Gobbo only');
    res('noabil', S => { general(S); town(S); gearUp(S); foodFor(S, 15); S.abilities = []; }, 'general without any abilities (the old "plain melee")');
  }
  res('over', S => { general(S, 5); town(S); gearUp(S); foodFor(S, 15); }, `+5 levels in 4 skills (${Math.round(4 * ((D.XPF[Math.min(99, lv0 + 5)] || 0) - (D.XPF[lv0] || 0)) / 1000)}k XP)`);
  return rows.join('\n');
};
if (process.env.COMPARE) {
  console.log('Preparation choices at each boss requirement (96 forecast fights per row):');
  for (const b of D.MONLIST.filter(m => m.boss && (!process.env.ONLY || process.env.ONLY.split(',').includes(m.id)))) { console.log(`  ${b.id} (combat ${b.boss.req})`); console.log(compare(b)); }
  process.exit(0);
}
if (process.env.COUNTER) {
  console.log('Counter loadouts (field-guide advice), at the requirement and +3 levels:');
  for (const b of D.MONLIST.filter(m => m.boss && (!process.env.ONLY || process.env.ONLY.split(',').includes(m.id)))) { const a = run(b, 0, true), c = run(b, 3, true), p = run(b, 0, false); console.log(`  ${b.id.padEnd(12)} combat ${String(a.combat).padEnd(4)} ${a.how.padEnd(44)} win ${String(a.win).padStart(3)}%  food/kill ${String(a.fpk).padEnd(5)} +3: ${String(c.win).padStart(3)}%  | plain melee ${p.win}%  (hp ${b.hp}, max ${b.max})`); }
  process.exit(0);
}
console.log('boss          req  combat lv  hp  food (heal)          win%  food/kill  time   +3 levels');
for (const b of D.MONLIST.filter(m => m.boss)) {
  const a = run(b, 0), c = run(b, 3);
  console.log(`${b.id.padEnd(13)} ${String(b.boss.req).padEnd(4)} ${String(a.combat).padEnd(6)} ${String(a.L).padEnd(3)} ${String(a.hp).padEnd(3)} ${(a.food + ' (' + a.heal + ')').padEnd(20)} ${String(a.win).padEnd(5)} ${String(a.fpk).padEnd(10)} ${a.t.padEnd(6)} ${c.win}%  ${process.env.GEAR ? a.gear : ""}`);
}
