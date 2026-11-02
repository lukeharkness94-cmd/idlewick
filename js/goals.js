/* Idlewick: "what can I reach next?" Ranks every upcoming unlock by how close it is. */
(() => {
const DQ = window.DQ, D = DQ.data, { fmt, clamp } = DQ;
const S = () => DQ.S;

/* Rates from recent play, so estimates follow how you are actually playing */
const coinHist = [];
DQ.on('ui', () => { const now = Date.now(); if (!coinHist.length || now - coinHist[coinHist.length - 1][0] >= 5000) { coinHist.push([now, S().stats.earned]); if (coinHist.length > 72) coinHist.shift(); } });
DQ.xpRate = sk => { const n = Math.min(24, DQ.hist.length); if (!n) return 0; return DQ.hist.slice(-n).reduce((a, b) => a + (b[sk] || 0), 0) / (n * 5000); };
DQ.coinRate = () => coinHist.length < 2 ? 0 : (coinHist[coinHist.length - 1][1] - coinHist[0][1]) / (coinHist[coinHist.length - 1][0] - coinHist[0][0]);
const totalRate = () => D.SKILLS.reduce((a, s) => a + DQ.xpRate(s.id), 0);
const etaXp = (sk, need) => { const r = DQ.xpRate(sk); return r > 0 && need > 0 ? need / r : null; };
const etaCoins = need => { const r = DQ.coinRate(); return need <= 0 ? 0 : r > 0 ? need / r : null; };

/* Progress between levels, measured in xp so multi-level gaps read honestly */
const lvlProg = (sk, target) => {
  const L = DQ.lvl(sk), a = D.XPF[L], b = D.XPF[Math.min(99, target)], x = S().xp[sk];
  return { pct: target <= L ? 1 : clamp((x - a) / (b - a), 0, 1), need: Math.max(0, b - x), cur: L, target };
};

DQ.goals = () => {
  const out = [], add = g => out.push(Object.assign({ eta: null }, g));
  const where = n => n && n.town && !DQ.townUnlocked(n.town) ? ` (in ${D.TOWN[n.town].name}, not yet reached)` : n && n.town && n.town !== S().town ? ` (in ${D.TOWN[n.town].name})` : '';

  /* 1. Next unlock in each skill you can train */
  D.SKILLS.forEach(s => {
    if (!DQ.skillUnlocked(s.id) || s.group === 'combat') return;
    const L = DQ.lvl(s.id), U = D.UNL[s.id] || {}, next = Object.keys(U).map(Number).filter(l => l > L).sort((a, b) => a - b)[0];
    if (next) {
      const p = lvlProg(s.id, next), names = U[next], node = Object.values(D.NODE).find(n => n.skill === s.id && n.lvl === next);
      add({ id: 'unl:' + s.id, cat: 'Skills', icon: s.id, col: s.col, title: names[0].replace(/^Equip: /, '') + (names.length > 1 ? ` +${names.length - 1}` : ''), sub: `${s.name} ${L} → ${next}${where(node)}`, pct: p.pct, eta: etaXp(s.id, p.need), go: s.page, big: true, hint: `Train ${s.name} to see how long` });
    }
    const perk = D.GATHER_SKILLS.includes(s.id) && D.PERKS.find(pk => pk.lvl > L);
    if (perk) { const p = lvlProg(s.id, perk.lvl); add({ id: 'perk:' + s.id, cat: 'Skills', icon: 'star', col: s.col, title: `Perk: ${perk.name}`, sub: `${s.name} ${perk.lvl} · ${perk.speed ? Math.round(perk.speed * 100) + '% faster' : Math.round(perk.dbl * 100) + '% double yield'}`, pct: p.pct, eta: etaXp(s.id, p.need), go: s.page, minor: true, hint: `Train ${s.name} to see how long` }); }
  });
  /* 2. Combat: next weapon and armour tier you can equip, and the boss of your frontier town */
  const att = DQ.lvl('attack'), def = DQ.lvl('defence');
  const nt = D.TIERS.find(t => t.equip > att), na = D.TIERS.find(t => t.equip > def);
  if (nt) { const p = lvlProg('attack', nt.equip); add({ id: 'gear:atk', cat: 'Combat', icon: 'sword', col: nt.col, title: `${nt.name} weapons`, sub: `Attack ${att} → ${nt.equip}`, pct: p.pct, eta: etaXp('attack', p.need), go: 'combat' }); }
  if (na) { const p = lvlProg('defence', na.equip); add({ id: 'gear:def', cat: 'Combat', icon: 'shield', col: na.col, title: `${na.name} armour`, sub: `Defence ${def} → ${na.equip}`, pct: p.pct, eta: etaXp('defence', p.need), go: 'combat' }); }
  const front = D.TOWNS.find(t => DQ.townUnlocked(t.id) && !(S().towns[t.id] && S().towns[t.id].boss));
  if (front) {
    const m = D.MON[front.boss], cb = DQ.combatLvl(), next = D.TOWNS[front.idx + 1], ok = cb >= m.boss.req;
    add({ id: 'boss:' + m.id, cat: 'Combat', sprite: m, col: m.col, title: ok ? `Defeat ${m.boss.short}` : `Face ${m.boss.short}`, sub: ok ? `Ready to challenge${next ? ` · opens ${next.name}` : ''}${front.id !== S().town ? ` · travel to ${front.name}` : ''}` : `Combat level ${cb} → ${m.boss.req}${next ? ` · opens ${next.name}` : ''}`, pct: ok ? 1 : clamp(cb / m.boss.req, 0, 1), go: front.id === S().town ? 'combat' : 'map', big: true, ready: ok });
  }
  /* 3. Hero level: skills, house, workers, queue slots */
  const adv = DQ.advLvl(), hp = DQ.advProgress();
  const advUnl = [...D.SKILLS.filter(s => !s.quest && s.unlock > adv).map(s => [s.unlock, `${s.name} skill`, s.id]), [D.HOUSE.adv, 'Buy a house', 'house'], [D.HIRE.adv, 'Hire workers', 'users'], [20, 'Third queue slot', 'clock'], [40, 'Fourth queue slot', 'clock']].filter(x => x[0] > adv).sort((a, b) => a[0] - b[0]);
  if (advUnl.length) {
    const [lvl, what, ic] = advUnl[0], need = D.advReq(lvl) - DQ.totalXp(), span = D.advReq(lvl) - D.advReq(adv);
    const r = totalRate();
    add({ id: 'adv', cat: 'Hero', icon: ic in DQ.ICONS ? ic : 'star', col: '#d8a64a', title: what, sub: `Hero level ${adv} → ${lvl}`, pct: clamp(1 - need / span, 0, 1), eta: r > 0 ? need / r : null, go: 'overview' });
  }
  /* 4. Main quests: the next skill to learn */
  const mq = D.QUESTS.filter(q => q.main && DQ.questState(q) !== 'done');
  mq.slice(0, 2).forEach(q => {
    const st = DQ.questState(q), sk = D.SK[q.unlocks], p = S().q[q.id];
    if (st === 'locked') { const b = DQ.questBlockers(q); const advBlock = DQ.advLvl() < q.adv && b.length === 1; add({ id: 'mq:' + q.id, cat: 'Quests', icon: q.unlocks, col: sk.col, title: `Learn ${sk.name}`, sub: b[0], pct: advBlock ? clamp(DQ.totalXp() / D.advReq(q.adv), 0, 1) : .1, go: 'quests', minor: !advBlock }); }
    else if (st === 'new') add({ id: 'mq:' + q.id, cat: 'Quests', icon: q.unlocks, col: sk.col, title: `Learn ${sk.name}`, sub: `Accept “${q.name}” from ${q.giver}`, pct: 1, go: 'quests', ready: true, big: true, act: { label: 'Accept', do: 'qstart', a: q.id } });
    else { const tot = q.obj.reduce((a, o, i) => a + Math.min(1, DQ.objProg(q, p, i) / o.n), 0) / q.obj.length; add({ id: 'mq:' + q.id, cat: 'Quests', icon: q.unlocks, col: sk.col, title: `Learn ${sk.name}`, sub: st === 'ready' ? 'Quest complete: claim it!' : q.obj.find((o, i) => DQ.objProg(q, p, i) < o.n).label, pct: st === 'ready' ? 1 : tot, go: 'quests', ready: st === 'ready', big: true, act: st === 'ready' ? { label: 'Claim', do: 'qclaim', a: q.id } : null }); }
  });
  /* 5. Tools for skills you have been training */
  D.TOOLS.forEach(([k, sk]) => {
    if (!DQ.skillUnlocked(sk) || DQ.lvl(sk) < 2) return; const t = DQ.toolTier(sk); if (t >= 5) return;
    const it = D.ITEMS[`tool_${k}_${t + 1}`], sold = Object.values(D.SHOPS).some(l => l.includes(it.id));
    add({ id: 'tool:' + k, cat: 'Gear', icon: it.ic, col: it.col, title: it.name, sub: `${Math.round(D.TOOL_SPEED[t + 1] * 100)}% faster ${D.SK[sk].name.toLowerCase()} · ${fmt(S().coins)} / ${fmt(it.buy)} coins`, pct: clamp(S().coins / it.buy, 0, 1), eta: etaCoins(it.buy - S().coins), go: 'shop', ready: S().coins >= it.buy && sold, minor: DQ.xpRate(sk) <= 0 });
  });
  /* 6. Home: house, furniture, plots */
  if (!S().house.owned) { if (adv >= D.HOUSE.adv) add({ id: 'house', cat: 'Home', icon: 'house', col: '#d8a64a', title: 'Buy a house', sub: `${fmt(S().coins)} / ${fmt(D.HOUSE.price)} coins`, pct: clamp(S().coins / D.HOUSE.price, 0, 1), eta: etaCoins(D.HOUSE.price - S().coins), go: 'house', ready: S().coins >= D.HOUSE.price }); }
  else {
    const H = S().house, opts = [];
    D.ROOMS.forEach(r => { if (!H.rooms[r.id]) opts.push({ name: `Build the ${r.name.toLowerCase()}`, coins: r.price, ok: true }); else r.furn.forEach(f => { const t = H.furn[f.id] || 0; if (t < 3) { const c = f.costs[t]; opts.push({ name: `${t ? 'Upgrade' : 'Place'} ${f.name.toLowerCase()}`, coins: c.coins, ok: DQ.canAfford(c), what: f.label(Object.values(f.fx)[0][t]) }); } }); });
    opts.sort((a, b) => a.coins - b.coins); const o = opts[0];
    if (o) add({ id: 'furn', cat: 'Home', icon: 'house', col: '#d8a64a', title: DQ.cap(o.name), sub: `${o.what ? o.what + ' · ' : ''}${fmt(Math.min(S().coins, o.coins))} / ${fmt(o.coins)} coins`, pct: clamp(S().coins / o.coins, 0, 1), eta: etaCoins(o.coins - S().coins), go: 'house', ready: o.ok && S().coins >= o.coins });
  }
  if (DQ.skillUnlocked('farming')) { const pr = D.PLOT_PRICES[S().farm.plotsBought]; if (pr) add({ id: 'plot', cat: 'Home', icon: 'crop', col: '#b8864f', title: 'Another farm plot', sub: `${fmt(Math.min(S().coins, pr))} / ${fmt(pr)} coins`, pct: clamp(S().coins / pr, 0, 1), eta: etaCoins(pr - S().coins), go: 'farming', ready: S().coins >= pr, minor: true }); }
  /* 7. Collection: nearly-finished achievements, bestiary stars, pet bond */
  D.ACH.filter(a => !S().ach[a.id]).map(a => ({ a, p: (a.val() || 0) / a.goal })).filter(x => x.p >= .4 && x.p < 1).sort((x, y) => y.p - x.p).slice(0, 2)
    .forEach(({ a, p }) => add({ id: 'ach:' + a.id, cat: 'Collection', icon: a.ic in DQ.ICONS ? a.ic : 'trophy', col: '#f3d58a', title: a.name, sub: `${a.desc} · +${fmt(a.coins)} coins`, pct: p, go: 'achievements', minor: true }));
  const fm = DQ.act && DQ.act.kind === 'fight' && D.MON[DQ.act.id];
  if (fm) { const k = S().beast.kills[fm.id] || 0, nx = [10, 50, 250].find(x => x > k); if (nx) add({ id: 'beast', cat: 'Collection', sprite: fm, col: fm.col, title: `${fm.name} ${'★'.repeat(DQ.beastStars(fm.id) + 1)}`, sub: `${k} / ${nx} defeated · +4% damage against them`, pct: k / nx, go: 'bestiary' }); }
  const ap = S().pets.active && D.PET[S().pets.active];
  if (ap) { const lv = DQ.petLevel(ap.id), nx = D.PET_LEVELS[lv]; if (nx !== undefined) { const m = S().pets.owned[ap.id].aff || 0; add({ id: 'pet', cat: 'Collection', sprite: ap, pet: true, col: ap.col, title: `${ap.name}: bond ${lv + 1}`, sub: `${Math.floor(m)} / ${nx} minutes together · stronger bonus`, pct: m / nx, eta: (nx - m) * 60000, go: 'bestiary', minor: true }); } }

  /* Rank: ready first, then closest. Small goals sink below big ones at the same progress. */
  out.forEach(g => { if (!g.hint) g.hint = /coins/.test(g.sub) ? 'Earn coins to see how long' : g.cat === 'Combat' ? 'Train combat to see how long' : ''; });
  out.forEach(g => { g.score = (g.ready ? 2 : 0) + g.pct + (g.big ? .15 : 0) - (g.minor ? .2 : 0) + (g.eta != null && g.eta < 10 * 60000 ? .25 : 0); });
  return out.sort((a, b) => b.score - a.score);
};
})();
