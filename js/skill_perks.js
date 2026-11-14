/* Idlewick: every level of every skill matters (Nov 2026).
   1. Signature perks: each skill has its own ranked perks, placed so that no skill goes more than five
      levels without something new, and a capstone at 99. They show in the level-up note, Skill levels,
      Home's "Nearly there" and the skill page, because they are written into D.UNL like any other unlock.
   2. Flourishes: every hands-on action has a small chance of a named lucky moment ("Big one!",
      "Masterwork!") that repeats its experience and its output. Perks raise the chance.
   Effects are small and data-driven: add rows to LINES, not code. Economy evidence: docs/economy-evidence.md. */
(() => {
const DQ = window.DQ, D = DQ.data, UI = DQ.ui || {}, S = () => DQ.S;
const chance = p => Math.random() < p;

/* ---------- signature perks: [name, effect per rank] lines, ranks placed in turn ---------- */
const LINES = {
  fishing:      [['Patient angler', { dbl: .01 }], ['Sharp eye', { find: .05 }], ['Lucky line', { fl: .005 }]],
  woodcutting:  [['Clean cuts', { dbl: .01 }], ['Nest finder', { find: .05 }], ['Woodsman’s rhythm', { speed: .01 }]],
  mining:       [['Rich seams', { dbl: .01 }], ['Gem sense', { find: .05 }], ['Miner’s luck', { fl: .005 }]],
  thieving:     [['Deep pockets', { coin: .01 }], ['Quick fingers', { speed: .01 }], ['Clean lifts', { fl: .005 }]],
  farming:      [['Green thumb', { grow: .02 }], ['Herdsman', { animal: .02 }], ['Good soil', { xp: .02 }]],
  cooking:      [['Steady flame', { burn: .01 }], ['Hearty portions', { heal: .02 }], ['Chef’s touch', { fl: .005 }]],
  smithing:     [['Hot forge', { speed: .01 }], ['Thrifty hammer', { dbl: .01 }], ['Masterwork', { fl: .005 }]],
  crafting:     [['Nimble needle', { speed: .01 }], ['Spare scraps', { dbl: .01 }], ['Inspiration', { fl: .005 }]],
  magic:        [['Arcane focus', { xp: .01 }]],
  research:     [['Quick study', { rate: .02 }], ['Broad learning', { xpAll: .005 }]],
  melee:        [['Weapon drill', { xp: .01 }]],
  defence:      [['Guard drill', { xp: .01 }]],
  ranged:       [['Eagle eye', { xp: .01 }]],
  hitpoints:    [['Vigour', { regen: .05 }], ['Hardy', { xp: .01 }]],
  hunting:      [['Tracker', { study: .05 }], ['Keen hunter', { xp: .02 }], ['Field dressing', { coin: .003 }]],
  exploration:  [['Wayfinder', { find: .03 }], ['Curious mind', { xpAll: .003 }], ['Fortune’s road', { coin: .003 }]],
  herbalism:    [['Steady pour', { brew: .03 }], ['Herb lore', { grow: .01 }], ['Apothecary', { xp: .02 }]],
  enchanting:   [['Runic edge', { dmg: .002 }], ['Warding', { dr: .002 }]],
  carpentry:    [['True grain', { dbl: .01 }], ['Sharp plane', { speed: .01 }], ['Joiner’s luck', { fl: .005 }]],
  sailing:      [['Fair winds', { speed: .01 }], ['Salvager', { coin: .005 }], ['Sea legs', { fl: .005 }]],
  beastmastery: [['Gentle hands', { xp: .02 }], ['Herd sense', { animal: .01 }], ['Kindred', { fl: .005 }]]
};
/* the flourish each hands-on skill can roll, and the word it shows */
D.FLOURISH = { fishing: 'Big one!', woodcutting: 'Clean fell!', mining: 'Rich vein!', thieving: 'Clean lift!', cooking: 'Perfect dish!', smithing: 'Masterwork!', crafting: 'Inspired!', magic: 'Surge!', carpentry: 'True grain!', sailing: 'Fair wind!', beastmastery: 'Breakthrough!' };
D.FLOURISH_BASE = .02;
const GAP = 5, ROMAN = ['', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X'];
const pct = v => { const n = Math.round(v * 1000) / 10; return (Number.isInteger(n) ? n : n.toFixed(1)) + '%'; };
DQ.perkText = (fx, sk) => Object.entries(fx).map(([k, v]) => {
  const n = D.SK[sk] ? D.SK[sk].name : '';
  return { xp: `+${pct(v)} ${n} XP`, speed: `+${pct(v)} ${n} speed`, dbl: `+${pct(v)} double yield`, fl: `+${pct(v)} flourish`, find: `+${pct(v)} lucky finds`, coin: `+${pct(v)} coins`, grow: `+${pct(v)} crop growth`, animal: `+${pct(v)} livestock`, burn: `−${pct(v)} burn`, heal: `+${pct(v)} food healing`, regen: `+${pct(v)} health regen`, dr: `+${pct(v)} damage reduction`, dmg: `+${pct(v)} damage`, study: `+${pct(v)} creature study`, xpAll: `+${pct(v)} all XP`, rate: `+${pct(v)} research speed`, brew: `+${pct(v)} double brew` }[k] || `${k} +${pct(v)}`;
}).join(', ');

/* Scholarship's real level gates belong in its unlock list too */
const unl = (sk, l, name) => { const lv = D.UNL[sk] = D.UNL[sk] || {}; (lv[l] = lv[l] || []).includes(name) || lv[l].push(name); };
(D.SCHOLAR_TIER || []).forEach((l, i) => { if (l > 1) unl('research', l, `Tier ${['', 'I', 'II', 'III', 'IV'][i]} studies`); });
unl('research', 20, 'Second study slot');

/* place each skill's ranks so no stretch is longer than GAP levels, then a capstone at 99 */
D.SKILL_PERKS = {};
const STYLES = ['melee', 'ranged', 'magic'], levelsOf = k => new Set(Object.keys(D.UNL[k] || {}).map(Number));
const STYLE_BASE = new Set([...levelsOf('melee')].filter(l => STYLES.every(k => levelsOf(k).has(l))));
for (const [sk, lines] of Object.entries(LINES)) {
  if (!D.SK[sk]) continue;
  /* Melee, Ranged and Magic share one scale: their perks sit at the same levels (where any of the three is quiet) */
  const had = STYLES.includes(sk) ? STYLE_BASE : levelsOf(sk), list = [], ranks = lines.map(() => 0);
  let last = 1, turn = 0;
  for (let l = 2; l <= 98; l++) {
    if (had.has(l)) { last = l; continue; }
    if (l - last >= GAP) { const i = turn++ % lines.length; ranks[i]++; list.push({ lvl: l, line: i, name: `${lines[i][0]} ${ROMAN[ranks[i]] || ranks[i]}`, fx: lines[i][1] }); last = l; }
  }
  const cap = {}; Object.entries(lines[0][1]).forEach(([k, v]) => cap[k] = v * 3);
  list.push({ lvl: 99, line: 0, name: `${D.SK[sk].name} mastery`, fx: cap, cap: true });
  D.SKILL_PERKS[sk] = list;
  list.forEach(p => unl(sk, p.lvl, `${p.name} (${DQ.perkText(p.fx, sk)})`));
}

/* the sum of a skill's perks at its current level; cached by level */
const cache = {};
DQ.skillPerkFx = sk => {
  const L = DQ.skillUnlocked && !DQ.skillUnlocked(sk) ? 0 : DQ.lvl(sk), c = cache[sk];
  if (c && c.L === L) return c.fx;
  const fx = {}; (D.SKILL_PERKS[sk] || []).forEach(p => { if (L >= p.lvl) Object.entries(p.fx).forEach(([k, v]) => fx[k] = (fx[k] || 0) + v); });
  cache[sk] = { L, fx }; return fx;
};
const own = (sk, k) => DQ.skillPerkFx(sk)[k] || 0;
const GLOBAL = ['find', 'coin', 'grow', 'animal', 'burn', 'heal', 'regen', 'dr', 'dmg', 'study', 'xpAll'];

/* plug into the existing effect hooks */
const xp0 = DQ.extraXp; DQ.extraXp = sk => (xp0 ? xp0(sk) : 1) + own(sk, 'xp');
const sp0 = DQ.extraSpeed; DQ.extraSpeed = sk => (sp0 ? sp0(sk) : 0) + own(sk, 'speed');
const dbl0 = DQ.dblChance; DQ.dblChance = sk => dbl0(sk) + own(sk, 'dbl');
const fx0 = DQ.fx;
DQ.fx = () => { const f = fx0(); if (!f._skillPerks) { f._skillPerks = true; for (const sk of Object.keys(D.SKILL_PERKS)) { const p = DQ.skillPerkFx(sk); for (const k of GLOBAL) if (p[k]) f[k] = (f[k] || 0) + p[k]; } } return f; };
DQ.on && DQ.on('lvl', () => DQ.fxDirty && DQ.fxDirty());
DQ.researchRate = () => 1 + own('research', 'rate');
const brew0 = DQ.brew;
if (brew0) DQ.brew = id => { const ok = brew0(id); if (ok && chance(own('herbalism', 'brew'))) { DQ.give(id, 1); if (!DQ.sim.on) DQ.toast(`Steady pour: a second ${(D.ITEMS[id] || { name: 'potion' }).name.toLowerCase()}`); } return ok; };

/* ---------- flourishes ---------- */
DQ.flourishChance = sk => D.FLOURISH[sk] ? D.FLOURISH_BASE + own(sk, 'fl') : 0;
let lastXp = null, seq = 0, seenSeq = 0;
const add0 = DQ.addXp; DQ.addXp = (sk, base, o) => { const amt = add0(sk, base, o); lastXp = { sk: DQ.skId ? DQ.skId(sk) : sk, amt, seq: ++seq }; return amt; };
const calm = () => (S().settings && S().settings.reduceFx) || (typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches);
const card = () => document.querySelector('.card.active') || document.querySelector('.activity-stage') || document.querySelector('.nowp');
const extraOutput = a => {
  if (['fish', 'wood', 'mine'].includes(a.kind)) { const n = D.NODE[a.kind + ':' + a.id]; if (n && n.item) { DQ.grant(n.item, 1); return `+1 ${D.ITEMS[n.item].name.toLowerCase()}`; } }
  if (a.kind === 'recipe') { const r = D.RECIPES[a.id]; if (r && r.out) { Object.entries(r.out).forEach(([k, n]) => DQ.grant(k, n)); const k = Object.keys(r.out)[0]; return `+${r.out[k]} ${D.ITEMS[k].name.toLowerCase()}`; } }
  if (a.kind === 'thieve') { const n = D.NODE['thieve:' + a.id]; if (n) { const c = Math.round((n.cmin + Math.random() * (n.cmax - n.cmin)) * DQ.coinMult()); DQ.addCoins(c); return `+${c} coins`; } }
  if (a.kind === 'sail' && D.VOYAGE && D.VOYAGE[a.id]) { const v = D.VOYAGE[a.id], c = Math.round((v.coins[0] + Math.random() * (v.coins[1] - v.coins[0])) * DQ.coinMult()); DQ.addCoins(c); return `+${c} coins`; }
  return '';
};
DQ.flourish = a => {
  const sk = DQ.actSkill(a); if (!sk || !D.FLOURISH[sk] || !lastXp || lastXp.sk !== sk || !(lastXp.amt > 0) || lastXp.seq <= seenSeq) return false;
  const base = lastXp.amt; lastXp = null;
  const x = add0(sk, base, { raw: true }), gift = extraOutput(a);
  const F = S().flourish = S().flourish || {}; F[sk] = (F[sk] || 0) + 1;
  if (!DQ.sim.on) {
    const el = card(); DQ.floatAt(el, `✦ ${D.FLOURISH[sk]} ${gift ? gift + ' · ' : ''}+${DQ.fmt(x)} XP`, '#f3d58a');
    if (el && !calm() && DQ.burstEl) DQ.burstEl(el, '#f3d58a', 18);
    DQ.sfx && DQ.sfx('gem'); DQ.emit && DQ.emit('flourish', sk);
  }
  return true;
};
const tick0 = DQ.mastTick;
/* only XP earned since the last finished action counts, so a burnt dish never flourishes */
DQ.mastTick = (a, ...rest) => { const r = tick0 ? tick0(a, ...rest) : undefined; if (a && a.kind !== 'fight' && !DQ.forecasting && chance(DQ.flourishChance(DQ.actSkill(a)))) DQ.flourish(a); seenSeq = seq; return r; };

/* ---------- the skill page says what is next ---------- */
UI.floLine = sk => D.FLOURISH[sk] ? ` · <span class="flo-chance" title="${DQ.esc(`${(DQ.flourishChance(sk) * 100).toFixed(1)}% chance each action of “${D.FLOURISH[sk]}”: its XP and output again`)}">✦ ${(DQ.flourishChance(sk) * 100).toFixed(1)}%</span>` : '';
UI.goalLine = sk => { const nx = UI.nextUnlock && UI.nextUnlock(sk); if (!nx) return ''; const short = UI.unlockShort ? UI.unlockShort(nx) : nx.what;
  return `<button class="sk-goal" data-do="perktrack" data-a="${sk}" title="${DQ.esc(`${D.SK[sk].name} Lv ${nx.lvl}: ${short} · every perk`)}"><span>Next · Lv ${nx.lvl}</span> <b>${DQ.esc(short)}</b></button>`; };
/* the whole ladder of a skill's perks: earned, next and ahead (reference detail, so it lives in a pop-up) */
UI.DO = UI.DO || {};
UI.DO.perktrack = sk => {
  const s = D.SK[sk], L = DQ.lvl(sk), list = D.SKILL_PERKS[sk] || [], now = DQ.skillPerkFx(sk), next = list.find(p => p.lvl > L);
  const rows = list.map(p => `<li class="pk ${L >= p.lvl ? 'got' : p === next ? 'next' : ''}"><b class="mono">Lv ${p.lvl}</b><span>${DQ.esc(p.name)}</span><small>${DQ.esc(DQ.perkText(p.fx, sk))}</small></li>`).join('');
  const fl = D.FLOURISH[sk] ? `<p class="pk-flo">✦ <b>${DQ.esc(D.FLOURISH[sk])}</b> ${(DQ.flourishChance(sk) * 100).toFixed(1)}% each action: its XP and output again${(S().flourish || {})[sk] ? ` · ${DQ.fmt(S().flourish[sk])} so far` : ''}</p>` : '';
  DQ.modal({ title: `${s.name} perks`, wide: true, body: `<p class="pk-now">${Object.keys(now).length ? `Now: ${DQ.esc(DQ.perkText(now, sk))}` : 'None yet'}</p>${fl}<ol class="pk-list">${rows}</ol>` });
};
if (UI && UI.skillHero) {
  const hero0 = UI.skillHero;
  UI.skillHero = (sk, extra = '') => {
    const h = hero0(sk, extra), i = h.lastIndexOf('</section>'), nx = UI.nextUnlock && UI.nextUnlock(sk), fl = (S().flourish || {})[sk] || 0;
    if (i < 0 || (!nx && !D.FLOURISH[sk])) return h;
    const next = nx ? `<button class="sh-next-btn" data-do="perktrack" data-a="${sk}"><span class="sh-next-k">Next · Lv ${nx.lvl}</span> <b>${DQ.esc(UI.unlockShort ? UI.unlockShort(nx) : nx.what)}</b></button>` : '';
    const flo = D.FLOURISH[sk] ? `<span class="sh-flo" title="${DQ.esc(`Each action: ${(DQ.flourishChance(sk) * 100).toFixed(1)}% chance of “${D.FLOURISH[sk]}”, which repeats its XP and output`)}">✦ ${(DQ.flourishChance(sk) * 100).toFixed(1)}%${fl ? ` · ${DQ.fmt(fl)}` : ''}</span>` : '';
    return h.slice(0, i) + `<div class="sh-next">${next}${flo}</div>` + h.slice(i);
  };
}
})();
