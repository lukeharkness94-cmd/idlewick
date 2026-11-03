/* Idlewick: planning layer. Task queue, stop rules, pace, combat abilities, weaknesses, battle forecast and away events. */
(() => {
const DQ = window.DQ, D = DQ.data, { rnd, chance, clamp, fmt, pick } = DQ;
const S = () => DQ.S;
const GT = () => S().gameTime || 0;

/* ---------- Pace ---------- */
DQ.pace = () => D.PACE[(DQ.act && DQ.act.pace) || 'steady'];
DQ.riskFail = p => clamp(1 - (1 - p) * DQ.pace().risk, .05, .99);   // success chance after pace
DQ.buffs = () => (S().buffs || []).filter(b => b.until > GT());
DQ.buffMult = type => DQ.buffs().filter(b => b.type === type).reduce((a, b) => a * b.mult, 1);

/* ---------- Abilities and weaknesses ---------- */
DQ.abilSlots = () => DQ.combatLvl() >= 40 ? 3 : 2;
DQ.abilUnlocked = a => DQ.skillUnlocked(a.skill) && DQ.lvl(a.skill) >= a.lvl;
DQ.ability = id => {
  const a = D.AB[id]; if (!a || !(S().abilities || []).includes(id) || !DQ.abilUnlocked(a)) return false;
  if (a.style && a.style !== DQ.weaponStyle()) return false;
  if (a.needShield && !S().equip.shield) return false;
  return true;
};
DQ.toggleAbility = id => {
  const L = S().abilities = S().abilities || [], a = D.AB[id];
  if (L.includes(id)) { L.splice(L.indexOf(id), 1); return true; }
  if (!DQ.abilUnlocked(a)) return DQ.toast(`Requires ${D.SK[a.skill].name} ${a.lvl}`, true);
  if (L.length >= DQ.abilSlots()) return DQ.toast(`All ${DQ.abilSlots()} ability slots are full. Remove one first.`, true);
  L.push(id); return true;
};
DQ.weakKnown = m => m.boss || (S().beast.kills[m.id] || 0) >= D.STUDY_KILLS;
DQ.weakOf = (m, f) => {
  if (m.id === 'hollowking') { const ph = f ? f.phase || 0 : 0; return D.HOLLOW_PHASES[ph]; }
  return D.WEAK[m.id] || { weak: [], resist: [] };
};
DQ.myDtype = () => { const wt = D.weaponType(); if (wt === 'staff') { const sp = D.SPELLS.find(s => s.id === S().spell) || D.SPELLS[0]; return D.SPELL_EL[sp.id]; } return D.WTYPES[wt].dtype; };
/* How your current build matches up against a monster: used by the boss intel panel */
DQ.matchup = m => {
  const dt = DQ.myDtype(), wr = DQ.weakOf(m), out = [];
  if (m.id === 'hollowking') out.push(['info', 'His weakness changes with each phase. No single weapon is best for the whole fight.']);
  else if (wr.weak.includes(dt)) out.push(['good', `Your ${D.DTYPES[dt].name.toLowerCase()} damage hits its weakness (1.5x).`]);
  else if (wr.resist.includes(dt)) out.push(['bad', `It resists your ${D.DTYPES[dt].name.toLowerCase()} damage (half damage).`]);
  else out.push(['info', `Your ${D.DTYPES[dt].name.toLowerCase()} damage is neutral against it.`]);
  if (m.boss) {
    const mech = D.BOSSMECH[m.id] && D.BOSSMECH[m.id].mech, st = DQ.weaponStyle();
    const A = id => (S().abilities || []).includes(id);
    if (A('brace')) out.push(['good', 'Brace halves its special attack.']); else out.push(['bad', 'No Brace: its special attack will hit at full strength.']);
    if (mech === 'charge') out.push(st === 'ranged' ? ['good', 'Fighting at range halves the charge.'] : ['bad', 'Up close, the charge hits at full strength.']);
    if (mech === 'freeze') out.push(dt === 'fire' ? ['good', 'Your fire breaks the freeze.'] : ['bad', 'Each slam freezes you for one attack.']);
    if (mech === 'hex') out.push(A('ward') && st === 'magic' ? ['good', 'Arcane Ward can absorb the Hex.'] : ['bad', 'Nothing blocks the Hex: bring food.']);
    if (mech === 'flames') out.push(dt === 'frost' ? ['good', 'Frost dampens Wyrmfire by half.'] : ['bad', 'Wyrmfire burns at full strength.']);
    if (mech === 'airborne') out.push(st === 'ranged' && A('pin') ? ['good', 'Pin Down grounds it.'] : st === 'melee' ? ['bad', 'Melee only reaches it when it is pinned.'] : ['info', 'Pin Down (Ranged 25) would ground it.']);
    if (mech === 'enrage') out.push(['info', 'It enrages below half health. Finish it fast or Brace.']);
    if (A('bash') && st === 'melee' && S().equip.shield) out.push(['good', 'Shield Bash interrupts a special every 8 attacks.']);
    if (A('ward') && st === 'magic' && mech !== 'hex') out.push(['good', 'Arcane Ward absorbs a special every 6 attacks.']);
  }
  return out;
};

/* ---------- Stop rules and queue ---------- */
DQ.queueSlots = () => 2 + (DQ.advLvl() >= 20 ? 1 : 0) + (DQ.advLvl() >= 40 ? 1 : 0);
DQ.parseRule = r => { if (!r || r === 'none') return { type: 'none' }; const [t, n] = r.split(':'); return { type: t, n: +n || 0 }; };
DQ.ruleText = (r, a) => {
  const R = DQ.parseRule(r); if (R.type === 'none') return 'until you stop it';
  if (R.type === 'time') return `for ${R.n >= 60 ? R.n / 60 + ' hour' + (R.n > 60 ? 's' : '') : R.n + ' minutes'}`;
  if (R.type === 'count') return `until ${fmt(R.n)} done`;
  return a && a.lvlTarget ? `until level ${a.lvlTarget}` : 'until the next level';
};
DQ.ruleProgress = a => {
  const R = DQ.parseRule(a.rule); if (R.type === 'none') return null;
  if (R.type === 'time') return [Math.min(a.elapsed / 60000, R.n), R.n, 'min'];
  if (R.type === 'count') return [Math.min(a.count, R.n), R.n, ''];
  const sk = DQ.actSkill(a); return sk ? [DQ.lvl(sk), a.lvlTarget, 'lvl'] : null;
};
DQ.checkRule = () => {
  const a = DQ.act; if (!a) return;
  const R = DQ.parseRule(a.rule); let done = false;
  if (R.type === 'time') done = a.elapsed >= R.n * 60000;
  else if (R.type === 'count') done = a.count >= R.n;
  else if (R.type === 'level') { const sk = DQ.actSkill(a); done = sk && DQ.lvl(sk) >= a.lvlTarget; }
  if (done) { const label = DQ.actLabel(); DQ.stopAct(true); DQ.notify({ kind: 'info', key: 'taskdone', icon: 'check', col: '#5cc08a', title: 'Task finished', text: `${label}: ${DQ.ruleText(a.rule, a)}, done.`, sound: 'perk', ttl: 6000 }); DQ.log(`Finished: ${label.toLowerCase()}.`, 'good'); DQ.advanceQueue(); }
};
DQ.queueAdd = (kind, id, rule = 'time:30', pace) => {
  const Q = S().queue = S().queue || [];
  if (Q.length >= DQ.queueSlots()) return DQ.toast(`Your queue is full (${DQ.queueSlots()} tasks). More slots at Hero level 20 and 40.`, true);
  Q.push({ kind, id, rule, pace: pace || S().defPace || 'steady' });
  DQ.sfx('tab'); DQ.toast(`Queued: ${DQ.actLabel({ kind, id })}`); DQ.emit('queue');
  if (!DQ.act) DQ.advanceQueue();
};
DQ.advanceQueue = () => {
  const Q = S().queue || [];
  while (Q.length && !DQ.act) {
    const t = Q.shift();
    if (DQ.startAct(t.kind, t.id, { pace: t.pace, rule: t.rule, quiet: true })) { if (!DQ.sim.on) DQ.notify({ kind: 'info', key: 'qnext', icon: 'arrow', col: '#8fc7ff', title: 'Next task in your queue', text: `${DQ.actLabel()} ${DQ.ruleText(t.rule, DQ.act)}.`, sound: false, ttl: 5000 }); }
    else if (!DQ.sim.on) DQ.notify({ kind: 'warn', key: 'qskip', icon: 'info', col: '#e5b04a', title: 'Skipped a queued task', text: `Could not start ${DQ.actLabel(t).toLowerCase()}. Check levels, location and supplies.`, sound: false });
  }
  DQ.emit('queue');
};

/* ---------- Supplies: how long until a task runs dry ---------- */
DQ.supplyInfo = a => {
  a = a || DQ.act; if (!a) return null;
  if (a.kind === 'recipe') { const r = D.RECIPES[a.id]; const n = Math.min(...Object.entries(r.in).map(([k, q]) => Math.floor(DQ.have(k) / q))); return { n, label: `materials for ${fmt(n)} more`, ms: n * (a.dur || DQ.durFor('recipe', a.id)) }; }
  if (a.kind === 'alch') { const al = DQ.alchSpell(); const n = al ? Math.min(DQ.have(a.id), Math.floor(DQ.have('rune') / al.runes)) : 0; return { n, label: `${fmt(n)} casts left`, ms: n * (a.dur || 2600) }; }
  if (a.kind === 'fight' || a.kind === 'thieve') {
    const heal = DQ.foods().reduce((t, id) => t + D.ITEMS[id].heal * DQ.have(id), 0);
    const st = DQ.weaponStyle(); let extra = '';
    if (a.kind === 'fight' && st === 'ranged') extra = ` · ${fmt(S().ammo.n + (S().ammo.id ? DQ.have(S().ammo.id) : 0))} arrows`;
    if (a.kind === 'fight' && st === 'magic') extra = ` · ${fmt(DQ.have('rune'))} runes`;
    return { n: heal, label: `${fmt(heal)} health of food${extra}` };
  }
  return null;
};

/* ---------- Battle forecast: a quick dry run against a monster, then everything is put back ---------- */
DQ.forecast = (monId, gearId) => {
  const snap = JSON.stringify(S()), act = DQ.act, fight = DQ.fight, hist = JSON.stringify(DQ.hist), m = D.MON[monId];
  if (!m || m.town !== S().town) return null;
  if (gearId && (!DQ.have(gearId) || !DQ.canEquip(gearId).ok || D.ITEMS[gearId].slot === 'ammo')) return null;
  const awayDone = DQ.awayDone;
  DQ.forecasting = true; const res = { trials: 24, wins: 0, deaths: 0, ms: 0, eaten: 0 };
  try {
    for (let t = 0; t < res.trials; t++) {
      DQ.S = JSON.parse(snap); DQ.S.queue = [];
      if (gearId) DQ.equipItem(gearId);
      DQ.fxDirty(); DQ.act = null; DQ.fight = null;
      if (!DQ.startAct('fight', monId, { quiet: true })) { res.blocked = true; break; }
      const k0 = DQ.S.stats.kill; let ms = 0, eaten = 0, died = false;
      while (ms < 20 * 60000) { const sum = DQ.simulate(4000); ms += 4000; eaten += sum.eaten || 0; if (sum.died || !DQ.act) { died = !!sum.died; break; } if (DQ.S.stats.kill > k0) break; }
      if (DQ.S.stats.kill > k0) { res.wins++; res.ms += ms; res.eaten += eaten; } else res.deaths++;
    }
  } finally { DQ.S = JSON.parse(snap); DQ.act = act; DQ.fight = fight; DQ.hist = JSON.parse(hist); DQ.forecasting = false; DQ.awayDone = awayDone; DQ.fxDirty(); }
  res.winRate = res.wins / res.trials; res.avgMs = res.wins ? res.ms / res.wins : null; res.foodPerKill = res.wins ? res.eaten / res.wins : null;
  return res;
};

/* ---------- Away events: things that happened while you were gone, each with a choice ---------- */
const tIdx = () => D.TOWN[S().town].idx;
const EVENTS = {
  trader: { w: 3, ok: ctx => ctx.topItem, make: ctx => { const it = D.ITEMS[ctx.topItem], n = Math.max(1, Math.floor(DQ.have(ctx.topItem) / 2)); return { item: ctx.topItem, n, title: 'A travelling trader', ic: 'shop', col: '#f3d58a', text: `A trader saw your stack of ${it.name.toLowerCase()} and offers ${fmt(Math.round(it.val * 1.5 * n))} coins for ${fmt(n)} of them, 1.5x their value.`, opts: [['sell', 'Sell', 'Take the offer'], ['haggle', 'Haggle', '50/50: 2.2x, or they walk away'], ['no', 'Decline', 'Keep everything']] }; } },
  chest: { w: 3, ok: () => true, make: () => { const cost = Math.round(80 * Math.pow(tIdx() + 1, 1.6)); return { cost, title: 'A locked chest', ic: 'pouch', col: '#ffb84a', text: 'You turned up an old iron-bound chest. It might be trapped.', opts: [['force', 'Force it open', '65%: coins and a gem. 35%: a trap stings you'], ['smith', `Pay a locksmith (${fmt(cost)})`, 'Safe: a gem and some coins'], ['no', 'Leave it', '']] }; } },
  injury: { w: 4, ok: ctx => ctx.pushed || ctx.died, make: () => { const cost = 60 * (tIdx() + 1); return { cost, title: 'A nasty injury', ic: 'heart', col: '#e2574c', text: 'Pushing hard while you were away, you twisted something. It will slow you down unless it is seen to.', opts: [['rest', 'Rest it off', 'Free: tasks 30% slower for 15 minutes'], ['heal', `Pay a healer (${fmt(cost)})`, 'No penalty'], ['tough', 'Tough it out', 'Free: 20% less damage dealt for 20 minutes']] }; } },
  raise: { w: 2, ok: () => S().workers.length > 0, make: () => { const w = pick(S().workers); return { wid: w.id, title: `${w.name} wants a raise`, ic: 'users', col: '#8fc7ff', text: `${w.name} has been working hard and asks for 30% more pay.`, opts: [['yes', 'Agree', '+30% wage, works 10% faster for good'], ['no', 'Refuse', 'Works 25% slower for 30 minutes while sulking']] }; } },
  crows: { w: 2, ok: () => S().farm.plots.some(p => p.crop && !DQ.plotRipe(p)), make: () => { const cost = 120 * (tIdx() + 1); return { cost, title: 'Crows over the fields', ic: 'crop', col: '#b8864f', text: 'A flock of crows is circling your growing crops.', opts: [['guard', `Hire a lad to watch (${fmt(cost)})`, 'All crops safe'], ['shoo', 'Shoo them yourself', '50% chance they eat one plot'], ['no', 'Ignore them', 'They eat one plot']] }; } },
  duel: { w: 2, ok: () => DQ.combatLvl() >= 10, make: () => { const k = DQ.combatLvl() + rnd(-6, 8), prize = Math.round(150 * Math.pow(tIdx() + 1, 1.5)); return { k, prize, title: 'A wandering knight', ic: 'sword', col: '#d8503f', text: `Sir Halden (combat ${k}) challenges you to a duel for ${fmt(prize)} coins.`, opts: [['fight', 'Accept', `Win chance about ${Math.round(clamp(.5 + (DQ.combatLvl() - k) * .04, .1, .9) * 100)}%. Lose: 25% health and ${fmt(Math.round(prize / 3))} coins`], ['no', 'Decline', '']] }; } },
  rare: { w: 2, ok: () => DQ.advLvl() >= 8, make: () => { const nx = D.TOWNS[Math.min(D.TOWNS.length - 1, tIdx() + 1)].id, id = pick(D.TOWN_GEAR[nx] || D.TOWN_GEAR.willowbrook), price = D.ITEMS[id].val * 3; return { item: id, price, title: 'A pedlar with rare stock', ic: 'gem', col: '#c07aff', text: `A pedlar offers ${D.ITEMS[id].name}, gear you would normally find further down the road, for ${fmt(price)} coins.`, opts: [['buy', 'Buy it', ''], ['no', 'Pass', '']] }; } },
};
DQ.makeAwayEvents = (sum, away) => {
  if (away < 20 * 60000) return;
  const top = Object.entries(sum.items || {}).filter(([id]) => D.ITEMS[id].val > 0).sort((a, b) => D.ITEMS[b[0]].val * b[1] - D.ITEMS[a[0]].val * a[1])[0];
  const ctx = { topItem: top && D.ITEMS[top[0]].val * top[1] >= 40 ? top[0] : null, pushed: (S().lastPace === 'push'), died: sum.died };
  const n = Math.min(3, Math.max(1, Math.floor(away / (40 * 60000)))), pool = Object.entries(EVENTS).filter(([, e]) => e.ok(ctx)), out = [];
  if (ctx.pushed && EVENTS.injury.ok(ctx) && chance(.6)) { out.push('injury'); }
  while (out.length < n && pool.length) { const k = DQ.weighted(pool.filter(([k]) => !out.includes(k)).map(([k, e]) => [k, e.w])); if (!k || out.includes(k)) break; out.push(k); }
  S().inbox = S().inbox || [];
  out.forEach(k => S().inbox.push(Object.assign({ id: Date.now() + k, type: k, at: Date.now() }, EVENTS[k].make(ctx))));
  if (S().inbox.length > 6) S().inbox.splice(0, S().inbox.length - 6);
};
DQ.resolveEvent = (id, opt) => {
  const L = S().inbox || [], i = L.findIndex(e => e.id === id); if (i < 0) return; const e = L[i]; let msg = '', bad = false;
  const coins = n => { DQ.addCoins(n); }, pay = n => { if (S().coins < n) { DQ.toast('Not enough coins', true); return false; } S().coins -= n; return true; };
  const it = e.item && D.ITEMS[e.item];
  switch (e.type + ':' + opt) {
    case 'trader:sell': { const n = Math.min(e.n, DQ.have(e.item)); DQ.take(e.item, n); const c = Math.round(it.val * 1.5 * n); coins(c); msg = `Sold ${fmt(n)} for ${fmt(c)} coins.`; break; }
    case 'trader:haggle': if (chance(.5)) { const n = Math.min(e.n, DQ.have(e.item)); DQ.take(e.item, n); const c = Math.round(it.val * 2.2 * n); coins(c); msg = `Haggled hard: ${fmt(c)} coins!`; } else { msg = 'The trader shrugs and leaves.'; bad = true; } break;
    case 'chest:force': if (chance(.65)) { const c = rnd(60, 160) * (tIdx() + 1); coins(c); DQ.grant(DQ.weighted(D.GEM_WEIGHTS)); msg = `It opens: ${fmt(c)} coins and a gem.`; } else { const d = Math.ceil(DQ.maxHp() * .35); S().hp = Math.max(1, S().hp - d); msg = `A needle trap! You lose ${d} health.`; bad = true; } break;
    case 'chest:smith': if (!pay(e.cost)) return; DQ.grant(DQ.weighted(D.GEM_WEIGHTS)); coins(rnd(30, 80) * (tIdx() + 1)); msg = 'The locksmith opens it safely: a gem and some coins.'; break;
    case 'injury:rest': S().buffs = DQ.buffs().concat({ type: 'slow', mult: 1.3, until: GT() + 15 * 60000, name: 'Resting an injury' }); msg = 'Tasks are 30% slower for 15 minutes.'; break;
    case 'injury:heal': if (!pay(e.cost)) return; msg = 'Patched up. Good as new.'; break;
    case 'injury:tough': S().buffs = DQ.buffs().concat({ type: 'weak', mult: .8, until: GT() + 20 * 60000, name: 'Nursing an injury' }); msg = 'You deal 20% less damage for 20 minutes.'; break;
    case 'raise:yes': { const w = S().workers.find(x => x.id === e.wid); if (w) { w.wage = +(w.wage * 1.3).toFixed(1); w.boost = (w.boost || 0) + .1; } msg = 'They thank you and pick up the pace.'; break; }
    case 'raise:no': { const w = S().workers.find(x => x.id === e.wid); if (w) w.sulk = GT() + 30 * 60000; msg = 'They grumble and slow down for a while.'; bad = true; break; }
    case 'crows:guard': if (!pay(e.cost)) return; msg = 'The lad waves a stick and the crows give up.'; break;
    case 'crows:shoo': if (chance(.5)) { msg = 'You flap your arms. The crows leave.'; break; } /* falls through */
    case 'crows:no': { const g = S().farm.plots.filter(p => p.crop && !DQ.plotRipe(p)); if (g.length) { const p = pick(g); msg = `The crows ate your ${D.CROP[p.crop].name.toLowerCase()}.`; p.crop = null; bad = true; } else msg = 'The crows found nothing.'; DQ.emit('farm'); break; }
    case 'duel:fight': if (chance(clamp(.5 + (DQ.combatLvl() - e.k) * .04, .1, .9))) { coins(e.prize); DQ.addXp('attack', 20 * (tIdx() + 1)); msg = `Victory! ${fmt(e.prize)} coins.`; } else { S().hp = Math.max(1, Math.round(S().hp - DQ.maxHp() * .25)); S().coins = Math.max(0, S().coins - Math.round(e.prize / 3)); msg = 'Sir Halden wins. Your pride and purse are lighter.'; bad = true; } break;
    case 'rare:buy': if (!pay(e.price)) return; DQ.give(e.item, 1); msg = `You buy the ${it.name}.`; break;
    default: msg = 'You let it go.';
  }
  L.splice(i, 1); DQ.sfx(bad ? 'hurt' : 'coin'); DQ.toast(msg, bad); DQ.log(`${e.title}: ${msg}`, bad ? 'bad' : 'good'); DQ.emit('inbox');
};
})();
