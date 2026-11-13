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
DQ.abilSlots = () => DQ.combatLvl() >= 70 ? 4 : DQ.combatLvl() >= 40 ? 3 : 2;
/* techniques (data3 D.TECH): passives learned by level, summed for a fighting style */
DQ.tech = sty => { const o = { dmg: 0, acc: 0, dr: 0, special: 0, free: 0 }; for (const t of D.TECHNIQUES || []) { if (DQ.lvl(t.skill) < t.lvl) continue; if (t.skill !== 'defence' && t.skill !== sty) continue; for (const k in t.fx) o[k] += t.fx[k]; } return o; };
DQ.abilUnlocked = a => DQ.skillUnlocked(a.skill) && DQ.lvl(a.skill) >= a.lvl;
DQ.ability = id => {
  const a = D.AB[id]; if (!a || !(S().abilities || []).includes(id) || !DQ.abilUnlocked(a)) return false;
  if (a.style && a.style !== DQ.weaponStyle()) return false;
  if (a.needShield && !S().equip.shield) return false;
  return true;
};
DQ.toggleAbility = id => {
  const L = S().abilities = S().abilities || [], a = D.AB[id];
  if (L.includes(id)) { L.splice(L.indexOf(id), 1); S().settings.autoAbil = false; return true; }
  if (!DQ.abilUnlocked(a)) return DQ.toast(`Requires ${D.SK[a.skill].name} ${a.lvl}`, true);
  if (L.length >= DQ.abilSlots()) return DQ.toast(`All ${DQ.abilSlots()} ability slots are full. Remove one first.`, true);
  L.push(id); return true;
};
/* Empty ability slots fill themselves when a fight starts, with abilities you already have (Brace first: later bosses'
   special attacks are built around it). Never replaces a choice; removing an ability yourself turns this off. */
DQ.fillAbilities = () => {
  const st = S(), on = st.abilities = st.abilities || [], free = DQ.abilSlots() - on.length; if (free <= 0 || st.settings.autoAbil === false) return [];
  const sty = DQ.weaponStyle(), order = ['brace', sty === 'melee' ? 'power' : sty === 'ranged' ? 'aimed' : 'focus', sty === 'melee' && st.equip.shield ? 'bash' : null, 'second', sty === 'ranged' ? 'pin' : sty === 'magic' ? 'ward' : 'execute', sty === 'ranged' ? 'kite' : null, sty === 'melee' ? 'cleave' : sty === 'ranged' ? 'volley' : 'overcharge', 'fortress', sty === 'melee' ? 'bloodlust' : sty === 'ranged' ? 'deadeye' : 'echo', 'unbreakable'];
  const added = [];
  for (const id of order) { if (added.length >= free) break; const a = id && D.AB[id]; if (!a || on.includes(id) || !DQ.abilUnlocked(a) || (a.style && a.style !== sty)) continue; on.push(id); added.push(a.name); }
  return added;
};
DQ.weakKnown = m => m.boss || (S().beast.kills[m.id] || 0) >= D.STUDY_KILLS;
DQ.weakOf = (m, f) => {
  if (m.id === 'hollowking') { const ph = f ? f.phase || 0 : 0; return D.HOLLOW_PHASES[ph]; }
  return D.WEAK[m.id] || { weak: [], resist: [] };
};
DQ.myDtype = () => { const wt = D.weaponType(); if (wt === 'staff') { const sp = D.SPELLS.find(s => s.id === S().spell) || D.SPELLS[0]; return D.SPELL_EL[sp.id]; } return D.WTYPES[wt].dtype; };
/* the shared damage-type rule (data3.js D.TYPE_RULES): what the engine applies and what every hint says */
DQ.typeMult = (m, kind) => { const R = D.TYPE_RULES[m && m.boss ? 'boss' : 'normal']; return kind === 'resist' ? R.resist : DQ.ability && DQ.ability('focus') ? R.focus : R.weak; };
const pctUp = x => `+${Math.round((x - 1) * 100)}%`;
DQ.typeRuleText = m => { const R = D.TYPE_RULES[m && m.boss ? 'boss' : 'normal']; return `Weak points take ${pctUp(R.weak)} damage (${pctUp(R.focus)} for spells with Elemental Focus); resisted types deal ${Math.round(R.resist * 100)}%.${m && m.boss ? ' Bosses shrug off weaknesses and resistances more than ordinary creatures.' : ''}`; };
/* How your current build matches up against a monster: used by the boss intel panel */
DQ.matchup = m => {
  const dt = DQ.myDtype(), wr = DQ.weakOf(m), out = [];
  if (m.id === 'hollowking') out.push(['info', 'His weakness changes with each phase. No single weapon is best for the whole fight.']);
  else if (wr.weak.includes(dt)) out.push(['good', `Your ${D.DTYPES[dt].name.toLowerCase()} damage hits its weakness (${pctUp(DQ.typeMult(m, 'weak'))}).`]);
  else if (wr.resist.includes(dt)) out.push(['bad', `It resists your ${D.DTYPES[dt].name.toLowerCase()} damage (you deal ${Math.round(DQ.typeMult(m, 'resist') * 100)}%).`]);
  else out.push(['info', `Your ${D.DTYPES[dt].name.toLowerCase()} damage is neutral against it.`]);
  if (m.boss) {
    const mech = D.BOSSMECH[m.id] && D.BOSSMECH[m.id].mech, st = DQ.weaponStyle();
    const A = id => (S().abilities || []).includes(id);
    if (A('brace')) out.push(['good', 'Brace halves its special attack.']); else out.push(['bad', 'No Brace: its special attack will hit at full strength.']);
    if (mech === 'charge') out.push(st === 'ranged' ? ['good', 'Fighting at range halves the charge.'] : ['bad', 'Up close, the charge hits at full strength.']);
    if (mech === 'freeze') out.push(dt === 'fire' ? ['good', 'Your fire breaks the freeze.'] : ['bad', 'Each slam freezes you for one attack.']);
    if (mech === 'hex') out.push(A('ward') && st === 'magic' ? ['good', 'Arcane Ward can absorb the Hex.'] : ['bad', 'Nothing blocks the Hex: bring food.']);
    if (mech === 'flames') out.push(dt === 'frost' ? ['good', 'Frost dampens Wyrmfire by half.'] : ['bad', 'Wyrmfire burns at full strength.']);
    if (mech === 'airborne') out.push(st === 'ranged' && A('pin') ? ['good', 'Pin Down grounds it.'] : st === 'melee' ? ['bad', 'Melee only reaches it when it is pinned.'] : ['info', `Pin Down (Ranged ${D.AB.pin.lvl}) would ground it.`]);
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

/* ---------- Preparation advice: concrete next steps from the real save (health, owned gear, shop stock, coins, food) ----------
   Ordered by how much each step usually changes a fight. Never claims a purchase is affordable when it is not. */
DQ.prepAdvice = (monId, fc) => {
  const m = D.MON[monId]; if (!m) return [];
  const out = [], max = DQ.maxHp(), hp = Math.ceil(S().hp), town = S().town, coins = S().coins;
  const owned = id => DQ.have(id) || (S().bank && S().bank[id]);
  if (hp < max * (DQ.act && DQ.act.kind === 'fight' && DQ.act.id !== monId ? .6 : .9)) { const per = Math.ceil(max / 50) * (1 + DQ.fx().regen), secs = Math.ceil((max - hp) / per * 3); out.push({ key: 'rest', title: 'Rest to full health first', text: `Health ${hp} / ${max}. You recover about ${secs}s outside combat, for example while fishing or cooking.`, action: 'go', a: 'fishing' }); }
  const stock = (D.SHOPS[town] || []).filter(id => !DQ.lockedSkillFor(id)), buys = [], who = (m.boss && m.boss.short) || m.name;
  /* abilities: an empty slot, or a boss special nothing in your slots answers, or a slotted ability your weapon cannot use */
  { const L = S().abilities || [], slots = DQ.abilSlots(), style = DQ.weaponStyle();
    const usable = a => DQ.abilUnlocked(a) && (!a.style || a.style === style) && (!a.needShield || S().equip.shield);
    const pref = m.boss && m.boss.special ? ['brace', 'bash', 'ward', 'second', 'power', 'aimed', 'focus', 'pin', 'execute', 'kite'] : ['power', 'aimed', 'focus', 'second', 'execute', 'pin', 'kite', 'brace', 'bash', 'ward'];
    const best = pref.map(id => D.AB[id]).filter(a => a && usable(a) && !L.includes(a.id));
    const idle = L.map(id => D.AB[id]).filter(a => a && !DQ.ability(a.id));
    const answers = L.some(id => ['brace', 'bash', 'ward'].includes(id) && DQ.ability(id));
    if (idle.length) out.push({ key: 'abil', title: `${idle[0].name} does nothing with this weapon`, text: `${idle[0].style ? `It needs a ${idle[0].style} weapon.` : 'It needs a shield.'}${best[0] ? ` Swap in ${best[0].name}: ${best[0].text}` : ''}`, action: 'go', a: 'combat' });
    else if (L.length < slots && best[0]) out.push({ key: 'abil', title: `Slot ${best[0].name}`, text: `${L.length} of ${slots} ability slots used. ${best[0].text}`, action: 'abil', a: best[0].id });
    else if (m.boss && m.boss.special && !answers && best[0] && ['brace', 'bash', 'ward'].includes(best[0].id)) out.push({ key: 'abil', title: `Swap in ${best[0].name}`, text: `Nothing in your slots answers ${m.boss.special.name}. ${best[0].text}`, action: 'go', a: 'combat' });
  }
  for (const slot of ['body', 'legs', 'head', 'shield']) {
    if (S().equip[slot]) continue;
    if (slot === 'shield' && S().equip.weapon && D.ITEMS[S().equip.weapon].two) continue;
    const def = id => (D.ITEMS[id].b || {}).def || 0;
    const mine = Object.keys({ ...S().inv, ...(S().bank || {}) }).filter(id => D.ITEMS[id] && D.ITEMS[id].slot === slot && owned(id) && DQ.canEquip(id).ok).sort((a, b) => def(b) - def(a))[0];
    if (mine) { out.push({ key: 'equip:' + slot, title: `Equip your ${D.ITEMS[mine].name.toLowerCase()}`, text: `Your ${slot === 'shield' ? 'off hand' : slot} slot is empty and you already own one.`, action: DQ.have(mine) ? 'equip' : 'go', a: DQ.have(mine) ? mine : 'bank' }); continue; }
    const buy = stock.filter(id => D.ITEMS[id].slot === slot && D.ITEMS[id].buy && DQ.canEquip(id).ok).sort((a, b) => def(b) - def(a))[0];
    if (buy) buys.push(buy);
  }
  if (buys.length) {
    const price = buys.reduce((n, id) => n + D.ITEMS[id].buy, 0), names = buys.map(id => D.ITEMS[id].name.toLowerCase());
    const list = names.length > 1 ? names.slice(0, -1).join(', ') + ' and ' + names[names.length - 1] : names[0];
    const cheapest = Math.min(...buys.map(id => D.ITEMS[id].buy));
    out.push({ key: 'buy', title: coins >= price ? `Buy armour for your empty slots (${fmt(price)} coins)` : coins >= cheapest ? 'Buy what armour you can afford' : 'Save for armour', text: `The shop here sells ${list}. ${coins >= price ? `You have ${fmt(coins)} coins, enough for all of it.` : `You have ${fmt(coins)} of the ${fmt(price)} coins for the full set.`} Armour makes every hit you take smaller or rarer.`, action: 'go', a: 'shop', afford: coins >= price, items: buys });
  }
  /* upgrades: a clearly better weapon or armour piece (20% or more) that you already own, or that the shop here sells */
  { const score = id => { const it = D.ITEMS[id], b = it.b || {}; return it.slot === 'weapon' ? (b.atk || 0) + (b.str || 0) + (b.rng || 0) + (b.mag || 0) : (b.def || 0); };
    const nm = id => D.ITEMS[id].name.toLowerCase(), ups = []; let own = null;
    for (const slot of ['weapon', 'body', 'legs', 'head', 'shield']) {
      const cur = S().equip[slot]; if (!cur || !D.ITEMS[cur]) continue; const cs = score(cur), cstyle = D.ITEMS[cur].style || 'melee';
      const better = id => { const it = D.ITEMS[id]; return it && it.slot === slot && !it.unique && DQ.canEquip(id).ok && (slot !== 'weapon' || (it.style || 'melee') === cstyle) && score(id) >= Math.max(cs * 1.2, cs + 3); };
      const o = Object.keys({ ...S().inv, ...(S().bank || {}) }).filter(id => owned(id) && better(id)).sort((a, b) => score(b) - score(a))[0];
      if (o) { if (!own) own = [o, cur]; continue; }
      const b = stock.filter(id => D.ITEMS[id].buy && better(id)).sort((a, b) => score(b) - score(a))[0]; if (b) ups.push(b);
    }
    if (own) out.push({ key: 'upgrade', title: `Wear your ${nm(own[0])}`, text: `It is clearly stronger than the ${nm(own[1])} you have on, and you already own it.`, action: DQ.have(own[0]) ? 'equip' : 'go', a: DQ.have(own[0]) ? own[0] : 'bank' });
    else if (ups.length) { const price = ups.reduce((n, id) => n + D.ITEMS[id].buy, 0), names = ups.slice(0, 3).map(nm), list = names.length > 1 ? names.slice(0, -1).join(', ') + ' and ' + names[names.length - 1] : names[0];
      out.push({ key: 'upgrade', title: coins >= price ? `Upgrade your gear (${fmt(price)} coins)` : 'Save for better gear', text: `The shop here sells ${list}${ups.length > 3 ? ' and more' : ''}, clearly stronger than what you wear. ${coins >= price ? `You have ${fmt(coins)} coins.` : `You have ${fmt(coins)} of ${fmt(price)} coins.`}`, action: 'go', a: 'shop' }); }
  }
  if (DQ.weakKnown(m)) {
    const weak = DQ.weakOf(m).weak, mine = DQ.myDtype();
    if (weak.length && !weak.includes(mine)) {
      /* a weapon's damage type: bows pierce; melee weapons use their weapon type; staves are handled as spells below */
      const dtypeOf = it => it.style === 'ranged' ? 'pierce' : it.wtype && D.WTYPES[it.wtype] && it.style !== 'magic' ? D.WTYPES[it.wtype].dtype : null;
      const fits = id => { const it = D.ITEMS[id]; return it && it.slot === 'weapon' && weak.includes(dtypeOf(it)) && DQ.canEquip(id).ok; };
      /* a bow is only useful with arrows: say so, and where they come from */
      const arrowsFor = id => { if (D.ITEMS[id].style !== 'ranged') return ''; const hasArrows = (S().ammo.id && S().ammo.n > 0) || Object.keys({ ...S().inv, ...(S().bank || {}) }).some(a => owned(a) && D.ITEMS[a] && D.ITEMS[a].slot === 'ammo' && DQ.canEquip(a).ok); if (hasArrows) return ''; const ar = stock.filter(a => D.ITEMS[a].slot === 'ammo' && DQ.canEquip(a).ok).pop(); return ar ? ` You also need arrows: the shop sells ${D.ITEMS[ar].name.toLowerCase()} (${fmt(D.ITEMS[ar].buy)} coins each).` : ' You also need arrows (Crafting or a shop).'; };
      const have = Object.keys({ ...S().inv, ...(S().bank || {}) }).find(id => owned(id) && fits(id)), shop = stock.find(fits);
      const name = D.DTYPES[weak[0]] ? D.DTYPES[weak[0]].name.toLowerCase() : weak[0];
      /* elemental weaknesses are met with a spell: say which one, and what is missing (staff, runes or Magic level) */
      let spellFix = null; const sp = DQ.skillUnlocked('magic') && (D.SPELLS || []).filter(x => weak.includes(D.SPELL_EL[x.id])).sort((a, b) => a.lvl - b.lvl)[0];
      if (sp && !(D.WTYPES[D.weaponType()] && D.weaponType() === 'staff' && weak.includes(mine))) {
        const el = D.DTYPES[D.SPELL_EL[sp.id]].name.toLowerCase(), staff = Object.keys({ ...S().inv, ...(S().bank || {}) }).find(id => owned(id) && D.ITEMS[id] && D.ITEMS[id].wtype === 'staff' && DQ.canEquip(id).ok);
        spellFix = DQ.lvl('magic') < sp.lvl ? { key: 'weak', title: `Train Magic to ${sp.lvl} for ${sp.name}`, text: `${who} is weak to ${el}. Magic ${DQ.lvl('magic')} / ${sp.lvl}.`, action: 'go', a: 'magic' }
          : !staff ? { key: 'weak', title: `Get a staff to cast ${sp.name}`, text: `${who} is weak to ${el}, and you know ${sp.name}. A staff from the shop lets you cast it.`, action: 'go', a: 'shop' }
          : { key: 'weak', title: `Equip your ${D.ITEMS[staff].name.toLowerCase()} and cast ${sp.name}`, text: `${who} is weak to ${el}. ${DQ.have('rune') >= sp.runes * 30 ? `You have ${fmt(DQ.have('rune'))} runes (${sp.runes} per cast).` : `You have ${fmt(DQ.have('rune'))} runes; a long fight can use ${fmt(sp.runes * 30)} or more (${sp.runes} per cast). The shop sells Arcane runes.`}`, action: 'go', a: DQ.have('rune') >= sp.runes * 30 ? 'character' : 'shop' };
      }
      if (have) out.push({ key: 'weak', title: `Switch to your ${D.ITEMS[have].name.toLowerCase()}`, text: `${who} is weak to ${name}: ${pctUp(DQ.typeMult(m, 'weak'))} damage per hit.${arrowsFor(have)}`, action: DQ.have(have) ? 'equip' : 'go', a: DQ.have(have) ? have : 'bank' });
      else if (spellFix) out.push(spellFix);
      else if (!shop && weak.includes('pierce') && !DQ.skillUnlocked('ranged')) out.push({ key: 'weak', info: true, title: `${who} is weak to arrows`, text: `Ranged is not learned yet. ${DQ.skillTeacher ? DQ.skillTeacher('ranged') : ''}.` });
      else if (shop) out.push({ key: 'weak', title: coins >= D.ITEMS[shop].buy ? `Buy the ${D.ITEMS[shop].name.toLowerCase()} (${fmt(D.ITEMS[shop].buy)} coins)` : `Save for the ${D.ITEMS[shop].name.toLowerCase()}`, text: `${who} is weak to ${name}. ${coins >= D.ITEMS[shop].buy ? 'The shop here sells one.' : `${fmt(coins)} / ${fmt(D.ITEMS[shop].buy)} coins.`}`, action: 'go', a: 'shop', afford: coins >= D.ITEMS[shop].buy }); if (out.length && out[out.length - 1].key === 'weak' && shop) out[out.length - 1].text += arrowsFor(shop);
    }
  }
  const heal = DQ.foods().reduce((t, id) => t + D.ITEMS[id].heal * DQ.have(id), 0);
  const need = fc && fc.foodPerKill != null && fc.wins ? Math.ceil(fc.foodPerKill * 1.5) * 3 : Math.round(max * (m.boss ? 2.5 : 1));
  const rawFish = (D.FISH_IDS || []).map(id => 'raw_' + id).find(r => DQ.have(r) && D.RECIPES['cook_' + r.slice(4)] && DQ.skillUnlocked('cooking') && DQ.lvl('cooking') >= D.RECIPES['cook_' + r.slice(4)].lvl);
  if (heal < need) out.push({ key: 'food', title: heal ? 'Bring more food' : 'Bring food', text: `Your food restores ${fmt(heal)} health; aim for about ${fmt(need)}.${rawFish ? ` You have ${fmt(DQ.have(rawFish))} ${D.ITEMS[rawFish].name.toLowerCase()} to cook.` : ''}`, action: 'go', a: rawFish ? 'cooking' : 'fishing' });
  /* potions and enchantments: offered only for a boss you are likely to struggle with (or have no forecast for yet) */
  const struggling = m.boss && (!fc || fc.winRate < .8);
  if (struggling) {
    const active = t => DQ.buffs().some(b => b.type === t);
    if (DQ.have('potion_might') && !active('weak')) out.push({ key: 'potion', title: 'Drink a Potion of Might before the fight', text: 'You hit 15% harder for 20 minutes. You have ' + DQ.have('potion_might') + '.', action: 'go', a: 'character' });
    else if (!DQ.have('potion_might') && DQ.skillUnlocked('herbalism') && DQ.techDone && DQ.techDone('warbrew')) { const r = D.POTION_RECIPES.find(x => x.id === 'potion_might'), ok = Object.entries(r.in).every(([k, n]) => DQ.have(k) >= n) && S().coins >= r.coins; out.push({ key: 'potion', title: ok ? 'Brew a Potion of Might' : 'Gather for a Potion of Might', text: `+15% damage for 20 minutes. ${Object.entries(r.in).map(([k, n]) => `${DQ.have(k)}/${n} ${D.ITEMS[k].name.toLowerCase()}`).join(', ')}, ${fmt(r.coins)} coins.`, action: 'go', a: 'brewery' }); }
    if (DQ.have('potion_haste') && !active('slow')) out.push({ key: 'potion', title: 'Drink a Potion of Haste', text: 'You attack 15% faster for 20 minutes. You have ' + DQ.have('potion_haste') + '.', action: 'go', a: 'character' });
    if (DQ.skillUnlocked('enchanting') && DQ.enchantPlan) { const e = DQ.enchantPlan().find(p => p.ready); if (e) out.push({ key: 'enchant', title: `Enchant your ${e.it.name.toLowerCase()}`, text: `+1 to each of its bonuses (about +${Math.round(e.gain * 100)}% of its bonus) for ${e.runes} runes and a ${D.ITEMS[e.need].name.toLowerCase()} you already hold.`, action: 'go', a: 'enchanting' }); }
  }
  if (S().hp < max * .9 && DQ.have('potion_heal')) { const r = out.find(x => x.key === 'rest'); if (r) r.text += ` Or drink a Healing draught for 40% at once (you have ${DQ.have('potion_heal')}).`; }
  if (m.boss && DQ.combatLvl() < m.boss.req) out.unshift({ key: 'level', title: `Reach combat ${m.boss.req}`, text: `Combat ${DQ.combatLvl()} / ${m.boss.req}.`, action: 'go', a: 'combat' });
  return out;
};

/* a defeat names the most useful change for next time, from the same advice as the boss card */
const notifyPrep0 = DQ.notify;
DQ.notify = o => { if (o && o.kind === 'death' && DQ.lastFoe && !DQ.forecasting) { const m = D.MON[DQ.lastFoe], tip = m && DQ.prepAdvice(m.id).find(x => x.key !== 'rest'); if (tip) o = Object.assign({}, o, { text: `${m.name} won this time. Most useful change: ${tip.title.charAt(0).toLowerCase() + tip.title.slice(1)}.` }); } return notifyPrep0(o); };

/* ---------- Away events: things that happened while you were gone, each with a choice ---------- */
const tIdx = () => D.TOWN[S().town].idx;
const EVENTS = {
  trader: { w: 3, ok: ctx => ctx.topItem, make: ctx => { const it = D.ITEMS[ctx.topItem], n = Math.max(1, Math.floor(DQ.have(ctx.topItem) / 2)); return { item: ctx.topItem, n, title: 'A travelling trader', ic: 'shop', col: '#f3d58a', text: `A trader saw your stack of ${it.name.toLowerCase()} and offers ${fmt(Math.round(it.val * 1.5 * n))} coins for ${fmt(n)} of them, 1.5x their value.`, opts: [['sell', 'Sell', 'Take the offer'], ['haggle', 'Haggle', '50/50: 2.2x, or they walk away'], ['no', 'Decline', 'Keep everything']] }; } },
  chest: { w: 3, ok: () => true, make: () => { const cost = Math.round(80 * Math.pow(tIdx() + 1, 1.6)); return { cost, title: 'A locked chest', ic: 'pouch', col: '#ffb84a', text: 'You turned up an old iron-bound chest. It might be trapped.', opts: [...(DQ.thiefLvl() >= 25 ? [['pick', `Pick the lock`, `Thieving: ${Math.round(DQ.pickChance() * 100)}% safe open, coins and a gem`]] : []), ['force', 'Force it open', '65%: coins and a gem. 35%: a trap stings you'], ['smith', `Pay a locksmith (${fmt(cost)})`, 'Safe: a gem and some coins'], ['no', 'Leave it', '']] }; } },
  injury: { w: 4, ok: ctx => ctx.pushed || ctx.died, make: () => { const cost = 60 * (tIdx() + 1); return { cost, title: 'A nasty injury', ic: 'heart', col: '#e2574c', text: 'Pushing hard while you were away, you twisted something. It will slow you down unless it is seen to.', opts: [['rest', 'Rest it off', 'Free: tasks 30% slower for 15 minutes'], ['heal', `Pay a healer (${fmt(cost)})`, 'No penalty'], ['tough', 'Tough it out', 'Free: 20% less damage dealt for 20 minutes']] }; } },
  raise: { w: 2, ok: () => S().workers.length > 0, make: () => { const w = pick(S().workers); return { wid: w.id, title: `${w.name} wants a raise`, ic: 'users', col: '#8fc7ff', text: `${w.name} has been working hard and asks for 30% more pay.`, opts: [['yes', 'Agree', '+30% wage, works 10% faster for good'], ['no', 'Refuse', 'Works 25% slower for 30 minutes while sulking']] }; } },
  crows: { w: 2, ok: () => S().farm.plots.some(p => p.crop && !DQ.plotRipe(p)), make: () => { const cost = 120 * (tIdx() + 1); return { cost, title: 'Crows over the fields', ic: 'crop', col: '#b8864f', text: 'A flock of crows is circling your growing crops.', opts: [['guard', `Hire a lad to watch (${fmt(cost)})`, 'All crops safe'], ['shoo', 'Shoo them yourself', '50% chance they eat one plot'], ['no', 'Ignore them', 'They eat one plot']] }; } },
  duel: { w: 2, ok: () => DQ.combatLvl() >= 10, make: () => { const k = DQ.combatLvl() + rnd(-6, 8), prize = Math.round(150 * Math.pow(tIdx() + 1, 1.5)); return { k, prize, title: 'A wandering knight', ic: 'sword', col: '#d8503f', text: `Sir Halden (combat ${k}) challenges you to a duel for ${fmt(prize)} coins.`, opts: [['fight', 'Accept', `Win chance about ${Math.round(clamp(.5 + (DQ.combatLvl() - k) * .04, .1, .9) * 100)}%. Lose: 25% health and ${fmt(Math.round(prize / 3))} coins`], ['no', 'Decline', '']] }; } },
  rare: { w: 2, ok: () => DQ.advLvl() >= 8, make: () => { const nx = D.TOWNS[Math.min(D.TOWNS.length - 1, tIdx() + 1)].id, id = pick(D.TOWN_GEAR[nx] || D.TOWN_GEAR.willowbrook), price = D.ITEMS[id].val * 3; return { item: id, price, title: 'A pedlar with rare stock', ic: 'gem', col: '#c07aff', text: `A pedlar offers ${D.ITEMS[id].name}, gear you would normally find further down the road, for ${fmt(price)} coins.`, opts: [['buy', 'Buy it', ''], ['no', 'Pass', '']] }; } },
};
DQ.makeAwayEvents = (sum, away) => {
  if (away < 20 * 60000) return;
  const top = Object.entries(sum.items || {}).filter(([id]) => D.ITEMS[id].val > 0).sort((a, b) => D.ITEMS[b[0]].val * b[1] - D.ITEMS[a[0]].val * a[1])[0];
  const ctx = { topItem: top && DQ.sellable(top[0]) && D.ITEMS[top[0]].val * top[1] >= 40 ? top[0] : null, pushed: (S().lastPace === 'push'), died: sum.died };
  const n = Math.min(3, Math.max(1, Math.floor(away / (40 * 60000)))), pool = Object.entries(EVENTS).filter(([, e]) => e.ok(ctx)), out = [];
  if (ctx.pushed && EVENTS.injury.ok(ctx) && chance(.6)) { out.push('injury'); }
  while (out.length < n && pool.length) { const left = pool.filter(([k]) => !out.includes(k)); if (!left.length) break; const k = DQ.weighted(left.map(([k, e]) => [k, e.w])); if (!k || out.includes(k)) break; out.push(k); }
  S().inbox = S().inbox || [];
  out.forEach(k => S().inbox.push(Object.assign({ id: Date.now() + k, type: k, at: Date.now() }, EVENTS[k].make(ctx))));
  if (S().inbox.length > 6) S().inbox.splice(0, S().inbox.length - 6);
};
DQ.resolveEvent = (id, opt) => {
  const L = S().inbox || [], i = L.findIndex(e => e.id === id); if (i < 0) return; const e = L[i]; let msg = '', bad = false;
  /* what the choice actually did, measured rather than described: coins, health, items and effects before and after */
  const snap = () => ({ coins: S().coins, hp: S().hp, items: Object.assign({}, S().inv, ...Object.entries(S().bank || {}).map(([k, n]) => ({ [k]: (S().inv[k] || 0) + n }))), buffs: DQ.buffs().map(b => b.name) });
  const before = snap(), shown = !!document.querySelector('#inboxbox'), toast0 = DQ.toast; if (shown) DQ.toast = () => {};
  const coins = n => { DQ.addCoins(n); }, pay = n => { if (S().coins < n) { DQ.toast = toast0; toast0('Not enough coins', true); return false; } S().coins -= n; return true; };
  const it = e.item && D.ITEMS[e.item];
  switch (e.type + ':' + opt) {
    case 'trader:sell': { const n = Math.min(e.n, DQ.have(e.item)); DQ.take(e.item, n); const c = Math.round(it.val * 1.5 * n); coins(c); msg = `Sold ${fmt(n)} for ${fmt(c)} coins.`; break; }
    case 'trader:haggle': if (chance(.5)) { const n = Math.min(e.n, DQ.have(e.item)); DQ.take(e.item, n); const c = Math.round(it.val * 2.2 * n); coins(c); msg = `Haggled hard: ${fmt(c)} coins!`; } else { msg = 'The trader shrugs and leaves.'; bad = true; } break;
    case 'chest:force': if (chance(.65)) { const c = rnd(60, 160) * (tIdx() + 1); coins(c); DQ.grant(DQ.weighted(D.GEM_WEIGHTS)); msg = `It opens: ${fmt(c)} coins and a gem.`; } else { const d = Math.ceil(DQ.maxHp() * .35); S().hp = Math.max(1, S().hp - d); msg = `A needle trap! You lose ${d} health.`; bad = true; } break;
    case 'chest:pick': if (chance(DQ.pickChance())) { const c = rnd(80, 180) * (tIdx() + 1); coins(c); DQ.grant(DQ.weighted(D.GEM_WEIGHTS)); DQ.addXp('thieving', 25 * (tIdx() + 1)); msg = `Click. The lock gives: ${fmt(c)} coins and a gem.`; } else { msg = 'The lock jams. The chest stays shut.'; bad = true; } break;
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
  DQ.toast = toast0; L.splice(i, 1); DQ.sfx(bad ? 'hurt' : 'coin');
  const after = snap(), items = {};
  for (const k of new Set([...Object.keys(before.items), ...Object.keys(after.items)])) { const d = (after.items[k] || 0) - (before.items[k] || 0); if (d && D.ITEMS[k]) items[k] = d; }
  const opt0 = (e.opts || []).find(o => o[0] === opt);
  DQ.eventResults = [{ id: e.id, title: e.title, ic: e.ic, col: e.col, chose: opt0 ? opt0[1] : '', msg, bad, coins: after.coins - before.coins, hp: after.hp - before.hp, items, buffs: after.buffs.filter(b => !before.buffs.includes(b)) }].concat(DQ.eventResults || []).slice(0, 6);
  /* the result is shown where the choice was made; a short message only when that place is not on screen */
  if (!shown) DQ.toast(msg, bad);
  DQ.log(`${e.title}: ${msg}`, bad ? 'bad' : 'good'); DQ.emit('inbox');
};
})();

{ const start0 = DQ.startAct; DQ.startAct = (kind, id, o = {}) => { if (kind === 'fight') { const add = DQ.fillAbilities(); if (add.length && !DQ.sim.on) DQ.log(`Ready for the fight: ${add.join(' and ')} slotted into your empty ability slots. Change them under Abilities.`); } return start0(kind, id, o); }; }
