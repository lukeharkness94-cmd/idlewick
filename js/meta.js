/* Idlewick: the long game and the testing tools.
   - Mastery: what happens after level 99 (ranks, titles, a small coin bonus)
   - Plan unlock: pace, stop rules and the queue arrive at Hero level 8
   - Time tracking: in-game, away and total
   - Playtest telemetry and the copyable playtest report */
(() => {
const DQ = window.DQ, D = DQ.data, S = () => DQ.S, { fmt } = DQ;

/* ---------- Mastery ---------- */
const MAX_XP = 2e8, MASTERY_RANKS = 10;
D.MASTERY_TITLES = ['Adept', 'Veteran', 'Expert', 'Master', 'Grandmaster', 'Champion', 'Paragon', 'Legend', 'Mythic', 'Eternal'];
DQ.masteryStep = () => (MAX_XP - D.XPF[99]) / MASTERY_RANKS;
DQ.masteryXp = sk => Math.max(0, (S().xp[sk] || 0) - D.XPF[99]);
DQ.masteryRank = sk => Math.min(MASTERY_RANKS, Math.floor(DQ.masteryXp(sk) / DQ.masteryStep()));
DQ.masteryTotal = () => D.SKILLS.reduce((a, s) => a + DQ.masteryRank(s.id), 0);
DQ.masteryCoin = () => DQ.masteryTotal() * .01;
DQ.masteryTitle = sk => { const r = DQ.masteryRank(sk); return r ? `${D.SK[sk].name} ${D.MASTERY_TITLES[r - 1]}` : ''; };
/* the coin bonus joins the normal coin multiplier */
const baseCoin = DQ.coinMult; DQ.coinMult = () => baseCoin() + DQ.masteryCoin();
DQ.setTitle = sk => { S().title = sk && DQ.masteryRank(sk) ? sk : null; DQ.emit('title'); };
DQ.heroTitle = () => { const sk = S().title; return sk && DQ.masteryRank(sk) ? DQ.masteryTitle(sk) : ''; };

/* ---------- Plan unlock (pace, stop rules, queue) ---------- */
D.PLAN_ADV = 8;
DQ.planUnlocked = () => DQ.advLvl() >= D.PLAN_ADV;
const addQ = DQ.queueAdd;
DQ.queueAdd = (...a) => {
  if (!DQ.planUnlocked()) return DQ.toast(`The task queue unlocks at Hero level ${D.PLAN_ADV}`, true);
  S().tele.first.queue = S().tele.first.queue || S().playtime;
  return addQ(...a);
};

/* ---------- Time ---------- */
DQ.timeStats = () => {
  const st = S(), play = st.playtime || 0, away = st.awayMs || 0, total = play + away;
  return { play, away, total, sess: DQ.sessMs || 0, awayEff: st.awayEff || 0, awayPct: total ? away / total : 0, playPct: total ? play / total : 1, sessions: (st.tele && st.tele.sessions) || 0 };
};

/* ---------- Telemetry: first time each milestone was reached, in in-game time ---------- */
const FEATURES = {
  quest: () => D.QUESTS.some(q => DQ.questState(q) === 'done'),
  boss: () => Object.values(S().towns).some(t => t.boss),
  house: () => S().house.owned,
  furnish: () => S().stats.furnish > 0,
  worker: () => S().workers.length > 0,
  pet: () => Object.keys(S().pets.owned).length > 0,
  farm: () => S().stats.harvest > 0,
  gear: () => S().stats.equipped > 0,
  death: () => S().stats.deaths > 0,
  smithing: () => !!S().unlocked.smithing,
  magic: () => !!S().unlocked.magic,
  mastery: () => DQ.masteryTotal() > 0
};
let acc = 0, lastMastery = -1;
const sample = () => {
  const st = S(), t = st.tele; if (!t) return;
  const now = st.playtime, adv = DQ.advLvl();
  for (let l = 2; l <= adv; l++) if (t.adv[l] == null) t.adv[l] = now;
  D.SKILLS.forEach(s => { if (!DQ.skillUnlocked(s.id)) return; const L = DQ.lvl(s.id); for (let l = 2; l <= L; l++) if ((l === 2 || l % 5 === 0) && t.skill[s.id + ':' + l] == null) t.skill[s.id + ':' + l] = now; });
  Object.entries(FEATURES).forEach(([k, f]) => { if (t.first[k] == null) { try { if (f()) t.first[k] = now; } catch (e) {} } });
  const m = DQ.masteryTotal();
  if (lastMastery >= 0 && m > lastMastery) DQ.notify({ kind: 'unlock', key: 'mastery', icon: 'trophy', col: '#f3d58a', title: 'Mastery rank up', text: 'You pushed a skill past level 99 and earned a new rank, a title and a little more coin from everything you sell and find.', action: { label: 'Open Mastery', fn: () => DQ.go('mastery') }, sound: 'perk', burst: true });
  lastMastery = m;
};
DQ.on('ui', () => { if (!DQ.started || ++acc % 20) return; sample(); });




/* ---------- Theme: dark (default), light, or follow the device ---------- */
const mq = typeof matchMedia === 'function' ? matchMedia('(prefers-color-scheme: light)') : null;
DQ.resolveTheme = () => { const t = (S().settings && S().settings.theme) || 'dark'; return t === 'auto' ? (mq && mq.matches ? 'light' : 'dark') : t === 'light' ? 'light' : 'dark'; };
DQ.applyTheme = () => { document.documentElement.dataset.theme = DQ.resolveTheme(); DQ.emit('theme'); };
DQ.setTheme = t => { S().settings.theme = t; DQ.applyTheme(); DQ.save(); };
DQ.toggleTheme = () => DQ.setTheme(DQ.resolveTheme() === 'light' ? 'dark' : 'light');
if (mq && mq.addEventListener) mq.addEventListener('change', () => { if ((S().settings || {}).theme === 'auto') DQ.applyTheme(); });

/* ---------- Which active quests does this task advance? ---------- */
const KIND_EV = { fish: 'catch', wood: 'chop', mine: 'mine', thieve: 'thieve' };
DQ.questLinks = (kind, id) => {
  const evs = []; let skill = null, item = null;
  if (KIND_EV[kind]) { const n = D.NODE[kind + ':' + id]; if (!n) return []; evs.push([KIND_EV[kind], id]); skill = n.skill; item = n.item; }
  else if (kind === 'recipe') { const r = D.RECIPES[id]; if (!r) return []; const out = Object.keys(r.out)[0]; evs.push([r.ev, out]); skill = r.skill; item = out; }
  else if (kind === 'fight') { const mo = D.MON[id]; if (!mo) return []; evs.push(['kill', id]); if (mo.boss) evs.push(['boss', id]); }
  else return [];
  const out = [];
  D.QUESTS.forEach(q => {
    const st = S().q[q.id]; if (!st || st.s !== 'active') return;
    q.obj.forEach((o, i) => {
      const pr = DQ.objProg(q, st, i); if (pr >= o.n) return;
      if (evs.some(([ev, key]) => o.ev === ev && (o.key === '*' || o.key === key)) || (o.ev === 'deliver' && item && o.key === item) || (o.ev === 'level' && skill && o.key === skill)) out.push({ q, i, o, pr });
    });
  });
  return out;
};

/* ---------- Item comparison: what changes if you equip this? ---------- */
const BONUS_NAMES = { atk: 'Attack', str: 'Strength', def: 'Defence', rng: 'Ranged', rngStr: 'Arrow strength', mag: 'Magic' };
DQ.compareItem = id => {
  const it = D.ITEMS[id]; if (!it) return null; const st = S();
  if (it.type === 'tool') {
    const k = it.toolSkill, now = DQ.toolTier(k), cur = now ? D.ITEMS[`tool_${DQ.toolKey(k)}_${now}`] : null;
    if (it.tier <= now) return { tool: true, better: false, cur, rows: [] };
    return { tool: true, better: true, cur, rows: [{ n: `${D.SK[k].name} speed`, a: Math.round(D.TOOL_SPEED[now] * 100), b: Math.round(D.TOOL_SPEED[it.tier] * 100), unit: '% faster', d: Math.round((D.TOOL_SPEED[it.tier] - D.TOOL_SPEED[now]) * 100) }] };
  }
  if (!it.slot) return null;
  const slot = it.slot, curId = slot === 'ammo' ? st.ammo.id : st.equip[slot], saved = { equip: Object.assign({}, st.equip), ammo: Object.assign({}, st.ammo) };
  const current = curId ? D.ITEMS[curId] : null;
  const itemRows = Object.keys(BONUS_NAMES).filter(k => (it.b && it.b[k]) || (current && current.b && current.b[k])).map(k => ({
    key: k, n: BONUS_NAMES[k], a: (current && current.b && current.b[k]) || 0, b: (it.b && it.b[k]) || 0,
    d: ((it.b && it.b[k]) || 0) - ((current && current.b && current.b[k]) || 0)
  }));
  if (curId === id) return { same: true, slot, cur: it, rows: [], itemRows };
  const read = () => ({ b: Object.assign({}, DQ.bonus()), p: DQ.pstats(), style: DQ.weaponStyle(), speed: (D.WTYPES[D.weaponType()] || { speed: 2000 }).speed });
  let A, B;
  try {
    A = read();
    if (slot === 'ammo') st.ammo = { id, n: Math.max(1, DQ.have(id)) }; st.equip[slot] = id;
    B = read();
  } finally { st.equip = saved.equip; st.ammo = saved.ammo; }
  const rows = [];
  Object.keys(BONUS_NAMES).forEach(k => { if (A.b[k] || B.b[k]) rows.push({ n: BONUS_NAMES[k], a: A.b[k], b: B.b[k], d: B.b[k] - A.b[k], plus: true }); });
  rows.push({ n: 'Max hit', a: A.p.max, b: B.p.max, d: B.p.max - A.p.max, key: true });
  rows.push({ n: 'Damage blocked', a: Math.round(A.p.red * 100), b: Math.round(B.p.red * 100), unit: '%', d: Math.round(B.p.red * 100) - Math.round(A.p.red * 100), key: true });
  const accD = Math.round((B.p.acc / A.p.acc - 1) * 100); rows.push({ n: 'Accuracy', a: 0, b: accD, d: accD, delta: true, unit: '%', key: true });
  /* damage per second: how hard it hits, how often it lands, how fast you swing (a rough guide that ignores the enemy) */
  const dps = x => x.p.maxRaw * x.p.acc / x.speed, dpsD = Math.round((dps(B) / dps(A) - 1) * 100); rows.push({ n: 'Damage per second', a: 0, b: dpsD, d: dpsD, delta: true, unit: '%', key: true, main: true });
  const need = [];
  if (slot === 'weapon' && B.style === 'ranged' && !(st.ammo.id && (st.ammo.n > 0 || DQ.have(st.ammo.id)))) need.push('Needs arrows equipped');
  if (slot === 'weapon' && B.style === 'magic' && DQ.have('rune') < 1) need.push('Needs Arcane runes');
  const can = DQ.canEquip(id);
  return { slot, cur: current, rows, itemRows, styleChange: A.style !== B.style ? [A.style, B.style] : null, need, unmet: can.ok ? '' : can.why };
};

/* Upgrade marker for inventory and bank cards: better or worse than what is worn in that slot.
   Weapons compare damage per second; armour and jewellery compare their total bonuses. Uniques whose stats are lower
   show their effect marker instead of a down arrow, because the effect is the point. */
DQ.gearVerdict = id => {
  const it = D.ITEMS[id]; if (!it || !it.slot || it.slot === 'ammo' || it.type === 'tool') return null;
  if (S().equip[it.slot] === id || !DQ.canEquip(id).ok) return null;
  const c = DQ.compareItem(id); if (!c || c.same) return null;
  let d;
  if (it.slot === 'weapon') { const r = c.rows.find(x => x.main); d = r ? r.d : 0; }
  else d = c.cur ? c.itemRows.reduce((n, r) => n + r.d, 0) : 1;
  if (d > 0) return 'up';
  if (d < 0) return it.unique ? 'unique' : 'down';
  return it.unique && !(c.cur && c.cur.unique) ? 'unique' : null;
};
DQ.gearMark = id => { const v = DQ.gearVerdict(id); return v ? `<span class="gear-cmp ${v}" aria-label="${v === 'up' ? 'Better than equipped' : v === 'down' ? 'Worse than equipped' : 'Unique effect'}">${v === 'up' ? '▲' : v === 'down' ? '▼' : '✦'}</span>` : ''; };

/* ---------- The playtest report: plain text, easy to paste ---------- */
const hm = ms => { ms = Math.max(0, ms); const m = Math.round(ms / 60000); return m < 60 ? `${m}m` : `${Math.floor(m / 60)}h ${m % 60}m`; };
DQ.playtestReport = () => {
  sample();
  const st = S(), t = st.tele, ts = DQ.timeStats(), L = [];
  L.push(`IDLEWICK PLAYTEST REPORT · version 0.4 · ${new Date().toISOString().slice(0, 16).replace('T', ' ')}`);
  L.push(`Hero: ${st.name} · Hero level ${DQ.advLvl()} · combat ${DQ.combatLvl()} · town ${D.TOWN[st.town].name} · coins ${fmt(st.coins)}`);
  L.push('');
  L.push('TIME');
  L.push(`  In game: ${hm(ts.play)} · Away: ${hm(ts.away)} (counted as ${hm(ts.awayEff)} of work) · Total: ${hm(ts.total)} · Sessions: ${ts.sessions}`);
  L.push(`  Since the hero was created: ${hm(Date.now() - st.created)}`);
  L.push('');
  L.push('HERO LEVEL TIMELINE (in-game time when each level was reached)');
  const lv = Object.keys(t.adv).map(Number).sort((a, b) => a - b);
  const shown = lv.filter(l => l <= 10 || l % 5 === 0 || l === lv[lv.length - 1]);
  L.push('  ' + (shown.length ? shown.map(l => `L${l} ${hm(t.adv[l])}`).join(' · ') : 'none yet'));
  L.push('');
  L.push('SKILLS (level · first reached 2, 5, 10, 15 …)');
  D.SKILLS.forEach(s => { if (!DQ.skillUnlocked(s.id)) { L.push(`  ${s.name}: locked`); return; } const marks = Object.keys(t.skill).filter(k => k.startsWith(s.id + ':')).map(k => ({ l: +k.split(':')[1], at: t.skill[k] })).sort((a, b) => a.l - b.l); L.push(`  ${s.name} ${DQ.lvl(s.id)}${DQ.masteryRank(s.id) ? ` (mastery ${DQ.masteryRank(s.id)})` : ''}: ${marks.map(m => `L${m.l} ${hm(m.at)}`).join(' · ')}`); });
  L.push('');
  L.push('FIRST TIME EACH SYSTEM WAS USED (in-game time)');
  L.push('  ' + Object.keys(FEATURES).map(k => `${k} ${t.first[k] != null ? hm(t.first[k]) : 'not yet'}`).join(' · '));
  L.push('');
  L.push('COUNTS');
  const x = st.stats; L.push(`  defeated ${x.kill} · deaths ${x.deaths} · catches ${x.catch} · logs ${x.chop} · ores ${x.mine} · cooked ${x.cook} · burnt ${x.burn} · smithed ${x.smith} · crafted ${x.craft} · harvested ${x.harvest} · rare finds ${x.rare}`);
  L.push(`  bosses beaten ${Object.values(st.towns).filter(q => q.boss).length} · towns visited ${Object.values(st.towns).filter(q => q.visited).length} · quests done ${D.QUESTS.filter(q => DQ.questState(q) === 'done').length}/${D.QUESTS.length} · pets ${Object.keys(st.pets.owned).length} · workers ${st.workers.length}`);
  L.push(`  backpack ${DQ.packSlots()}/${DQ.packMax()} · bank item types ${Object.keys(st.bank).length} · queue ${(st.queue || []).length} · default pace ${st.defPace || 'steady'}`);
  L.push('');
  L.push('LAST ABSENCES (real time → counted)');
  L.push('  ' + (t.away.length ? t.away.slice(-10).map(a => `${hm(a.gap)} → ${hm(a.eff)}`).join(' · ') : 'none'));
  if (DQ.errors && DQ.errors.length) { L.push(''); L.push('ERRORS'); DQ.errors.slice(-5).forEach(e => L.push('  ' + e.msg.slice(0, 200))); }
  L.push('');
  L.push('NOTES FOR THE TESTER: what felt too slow, too fast, confusing or boring?');
  return L.join('\n');
};
})();
