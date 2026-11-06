/* Idlewick: the rules. Activities, combat, quests, achievements, offline progress. */
(() => {
const DQ = window.DQ, D = DQ.data, { rnd, pick, chance, clamp, ico, fmt } = DQ;
const S = () => DQ.S;
const OFFLINE_CAP = 8 * 3600 * 1000;
const DMG_DIV = 400;
DQ.act = null; DQ.fight = null; DQ.hist = [{}];

DQ.log = (m, k = '') => { if (DQ.sim.on) return; const L = S().log; L.unshift({ t: Date.now(), m, k }); if (L.length > 40) L.length = 40; DQ.emit('log'); };
const townIdx = () => D.TOWN[S().town].idx;
const itemName = id => D.ITEMS[id].name;

/* Include content added by later data files, especially farming and recipes. */
const indexUnlock = (skill, level, label) => {
  if (!skill || level <= 1) return;
  const levels = D.UNL[skill] = D.UNL[skill] || {}, names = levels[level] = levels[level] || [];
  if (!names.includes(label)) names.push(label);
};
Object.values(D.NODE).forEach(n => indexUnlock(n.skill, n.lvl, n.name));
Object.values(D.RECIPES).forEach(r => indexUnlock(r.skill, r.lvl, r.name));
Object.values(D.ITEMS).filter(it => ['gear','ammo'].includes(it.type)).forEach(it => Object.entries(it.req || {}).forEach(([sk, level]) => indexUnlock(sk, level, 'Equip: ' + it.name)));
(D.CROPS || []).forEach(c => indexUnlock('farming', c.lvl, 'Grow ' + c.name));
(D.ANIMALS || []).forEach(a => indexUnlock('farming', a.lvl, 'Keep ' + a.name));

/* ---------- Experience and levels ---------- */
DQ.addXp = (sk, base, o = {}) => {
  if (!DQ.skillUnlocked(sk)) return 0;
  const amt = o.raw ? base : base * DQ.xpMult(sk), before = DQ.lvl(sk), advB = DQ.advLvl();
  S().xp[sk] = Math.min(2e8, S().xp[sk] + amt);
  if (!DQ.sim.on) DQ.hist[DQ.hist.length - 1][sk] = (DQ.hist[DQ.hist.length - 1][sk] || 0) + amt;
  if (DQ.sim.on) DQ.sim.xp[sk] = (DQ.sim.xp[sk] || 0) + amt; else DQ.pulse(`[data-skill="${sk}"]`);
  const after = DQ.lvl(sk);
  if (after > before) onLevel(sk, before, after);
  const advA = DQ.advLvl(); if (advA > advB) onAdv(advB, advA);
  return amt;
};
function unlockText(sk, from, to) {
  const list = []; for (let l = from + 1; l <= to; l++) ((D.UNL[sk] || {})[l] || []).forEach(n => list.push(n));
  return list.length ? 'Unlocked: ' + list.join(', ') + '.' : '';
}
/* a level-up note opens what it unlocked: the new recipe in its own category, or the new gathering spot, highlighted */
function levelAction(sk, from, to) {
  const sd = D.SK[sk], recipe = (D.RLIST[sk] || []).filter(r => r.lvl > from && r.lvl <= to).sort((a, b) => b.lvl - a.lvl)[0];
  const node = !recipe && Object.values(D.NODES || {}).flat().filter(n => n.skill === sk && n.lvl > from && n.lvl <= to && DQ.nodeHere(n)).sort((a, b) => b.lvl - a.lvl)[0];
  const target = recipe || node;
  if (target && DQ.ui && DQ.ui.focusTask) return { label: `Open ${target.name}`, fn: () => DQ.ui.focusTask(sd.page, target.id, recipe ? recipe.tab : null, sk) };
  return { label: `Open ${sd.name}`, fn: () => DQ.go(sd.page) };
}
function onLevel(sk, from, to) {
  const sd = D.SK[sk];
  if (sk === 'hitpoints') S().hp += to - from;
  const perks = D.PERKS.filter(p => p.lvl > from && p.lvl <= to);
  const details = [unlockText(sk, from, to), ...perks.map(p => `${p.name}: ${p.speed ? `${Math.round(p.speed * 100)}% faster actions` : `${Math.round(p.dbl * 100)}% chance of double yield`}.`) ].filter(Boolean);
  const unlockedDetails = details.slice();
  if (!details.length) {
    const next = Object.keys(D.UNL[sk] || {}).map(Number).filter(level => level > to).sort((a,b) => a-b)[0];
    details.push(`Experience bonus is now +${Math.round(((DQ.xpBonusBase ? DQ.xpBonusBase(sk) : DQ.xpMult(sk)) - 1) * 100)}%.`);
    if (next) details.push(`Next at level ${next}: ${D.UNL[sk][next].join(', ')}.`);
  }
  if (DQ.sim.on) DQ.sim.levels.push([sk, to]);
  else { DQ.log(`${sd.name} level ${to} reached.`, 'quest'); DQ.emit('levelup', sk, to); }
  DQ.notify({ kind: 'level', key: 'lvl:' + sk, page: sd.page, skill: sk, from, to, unlocks: unlockedDetails, icon: sk, col: sd.col, title: `${sd.name} level ${to}!`, text: details.join(' '), action: levelAction(sk, from, to), sound: 'level', ttl: 14000, burst: true });
  DQ.achDirty = true; checkQuests(); DQ.emit('lvl');
}
function onAdv(from, to) {
  const gains = [];
  if (DQ.sim.on) DQ.sim.adv = to;
  D.SKILLS.forEach(s => {
    if (!s.quest && !s.actionReq && s.unlock > from && s.unlock <= to) {
      S().unlocked[s.id] = true; gains.push(s.name);
      DQ.notify({ kind: 'unlock', key: 'unlock:' + s.id, icon: s.id, col: s.col, title: `${s.name} unlocked`, text: s.blurb, action: { label: `Open ${s.name}`, fn: () => DQ.go(s.page) }, sound: 'unlock', ttl: 12000, burst: true });
    }
  });
  for (const [page, level, title, icon] of [
    ['house', D.HOUSE.adv, 'Housing', 'house'],
    ['hirelings', D.HIRE.adv, 'Workers', 'users']
  ]) if (level > from && level <= to) { gains.push(title); DQ.notify({ kind: 'unlock', key: 'feature:' + page, page, icon, title: `${title} unlocked`, text: `You can now explore ${title.toLowerCase()} in World.`, action: { label: `Open ${title}`, fn: () => DQ.go(page) }, sound: 'unlock', ttl: 12000 }); }
  if (!DQ.sim.on) {
    DQ.log(`Hero level ${to} reached.`, 'quest');
  }
  DQ.notify({ kind: 'adv', key: 'adv', icon: 'star', col: '#d8a64a', title: `Hero level ${to}!`, text: (gains.length ? `Unlocked: ${gains.join(', ')}. ` : '') + `All experience now earns +${((to - 1) * .25).toFixed(1).replace(".0", "")}% bonus.`, sound: 'level', ttl: 14000, burst: true, from, to, gains: gains.slice() });
  DQ.achDirty = true; checkQuests(); DQ.emit('lvl');
}
DQ.addCoins = (n, o = {}) => {
  if (n <= 0) return; S().coins += n; if (!o.noStat) S().stats.earned += n;
  if (DQ.sim.on) DQ.sim.coins += n; else DQ.pulse('.stat.coins');
};
DQ.grant = (id, n = 1) => {
  const it = D.ITEMS[id], seen = S().seen.items || (S().seen.items = {});
  if (!Object.keys(seen).length) Object.keys({ ...S().inv, ...S().bank, ...S().equip }).forEach(k => { if (D.ITEMS[k]) seen[k] = 1; });
  const fresh = !seen[id] && DQ.have(id) === 0; DQ.give(id, n);
  if (fresh) { seen[id] = 1; if (!DQ.sim.on && !DQ.forecasting) { DQ.sfx('discover'); DQ.toast(`New item discovered: ${it.name}`); DQ.notify({ kind: 'discovery', key: 'discovery:' + id, icon: it.ic, col: it.col, title: 'New item discovered', text: it.name, sound: false }); } }
  if (DQ.sim.on) DQ.sim.items[id] = (DQ.sim.items[id] || 0) + n;
  if (it.rare) { S().stats.rare++; DQ.notify({ kind: 'loot', key: 'rare:' + id, icon: it.ic, col: it.col, title: 'Rare find', text: `You found ${it.name}.`, sound: 'gem', burst: true, ttl: 9000 }); }
  return it;
};
DQ.on('overflow', () => DQ.notify({ kind: 'info', key: 'overflow', icon: 'bank', col: '#8fa09e', title: 'Your backpack is full', text: 'New kinds of item now go straight to your bank. Sell or bank things to make room.', sound: 'notify', ttl: 10000 }));

/* ---------- Quests ---------- */
DQ.townUnlocked = id => !!S().towns[id];
DQ.questUnlocked = q => DQ.townUnlocked(q.town) && DQ.advLvl() >= q.adv && (!q.req || (S().q[q.req] && S().q[q.req].s === 'done'));
DQ.questState = q => { const s = S().q[q.id]; return s ? s.s : DQ.questUnlocked(q) ? 'new' : 'locked'; };
DQ.objProg = (q, st, i) => { const o = q.obj[i]; if (o.ev === 'level') return Math.min(DQ.lvl(o.key), o.n); if (!st) return 0; if (o.ev === 'deliver') return Math.min(DQ.have(o.key), o.n); if (o.ev === 'visit') return S().towns[o.key] && S().towns[o.key].visited ? 1 : 0; return st.p[i]; };
DQ.questBlockers = q => { const out = []; if (!DQ.townUnlocked(q.town)) { const t = D.TOWN[q.town], prev = D.TOWNS[t.idx - 1]; out.push(`Reach ${t.name}${prev ? ` (defeat ${D.MON[prev.boss].boss.short} in ${prev.name})` : ''}`); } if (DQ.advLvl() < q.adv) out.push(`Hero level ${q.adv} (you: ${DQ.advLvl()})`); if (q.req && !(S().q[q.req] && S().q[q.req].s === 'done')) out.push(`Finish “${D.QM[q.req].name}”`); return out; };

/* One part of a multi-part quest is finished: say so and offer the next part (otherwise players keep repeating the finished one) */
const OBJ_KIND = { catch: 'fish', chop: 'wood', mine: 'mine' };
function objDone(q, st, i) {
  if (DQ.sim.on || DQ.forecasting) return;
  const next = q.obj.findIndex((o, j) => j !== i && DQ.objProg(q, st, j) < o.n);
  if (next < 0) return; /* whole quest done: the 'ready to claim' notice covers it */
  const o = q.obj[next], kind = OBJ_KIND[o.ev], node = kind && D.NODE[kind + ':' + o.key];
  const go = node && DQ.nodeHere(node) && DQ.skillUnlocked(node.skill) && DQ.lvl(node.skill) >= node.lvl;
  const act = go ? { label: 'Start ' + (kind === 'mine' ? 'mining' : kind === 'wood' ? 'chopping' : 'fishing'), fn: () => DQ.startAct(kind, o.key) } : { label: 'View quest', fn: () => DQ.go('quests') };
  DQ.notify({ kind: 'quest', key: 'qo:' + q.id + ':' + i, icon: 'quest', col: '#d8a64a', title: `${q.name}: part done`, text: `${q.obj[i].label} is finished. Next: ${o.label}.`, action: act, sound: 'quest', ttl: 12000 });
}
DQ.qev = (ev, key, n = 1) => {
  let ch = false; const doneObj = [];
  for (const q of D.QUESTS) {
    const st = S().q[q.id]; if (!st || st.s !== 'active') continue;
    q.obj.forEach((o, i) => { if (o.ev === ev && (o.key === '*' || o.key === key) && st.p[i] < o.n) { st.p[i] = Math.min(o.n, st.p[i] + n); ch = true; if (st.p[i] >= o.n) doneObj.push([q, st, i]); } });
  }
  doneObj.forEach(([q, st, i]) => objDone(q, st, i));
  if (ch) checkQuests();
};
function checkQuests() {
  for (const q of D.QUESTS) {
    const st = S().q[q.id];
    if (st && st.s === 'active' && q.obj.every((o, i) => DQ.objProg(q, st, i) >= o.n)) {
      st.s = 'ready';
      DQ.log(`Quest ready: ${q.name}.`, 'quest');
      DQ.notify({ kind: 'quest', key: 'qr:' + q.id, icon: 'quest', col: '#d8a64a', title: 'Quest ready to claim', text: q.name, action: { label: 'Claim reward', fn: () => DQ.go('quests') }, sound: 'quest', ttl: 12000 });
      DQ.emit('quests');
    }
  }
  announceQuests();
}
function announceQuests() {
  if (DQ.sim.on) return;
  let fresh = D.QUESTS.filter(q => DQ.questState(q) === 'new' && !S().seen['q:' + q.id]);
  if (!fresh.length) return;
  fresh.forEach(q => S().seen['q:' + q.id] = 1);
  if (DQ.firstRun) return;
  fresh.filter(q => q.main).forEach(q => { const s = D.SK[q.unlocks]; DQ.notify({ kind: 'unlock', key: 'mq:' + q.id, icon: q.unlocks, col: s.col, title: `Main quest: ${q.name}`, text: `Learn ${s.name}. Speak to ${q.giver} in ${D.TOWN[q.town].name}.`, action: { label: 'View quest', fn: () => { DQ.ui.questTab = 'available'; DQ.go('quests'); } }, sound: 'unlock', ttl: 14000, burst: true }); });
  fresh = fresh.filter(q => !q.main); if (!fresh.length) { DQ.emit('quests'); return; }
  DQ.notify({ kind: 'quest', key: 'qnew', icon: 'quest', col: '#d8a64a', title: fresh.length === 1 ? 'New quest available' : `${fresh.length} new quests available`, text: fresh.length === 1 ? `${fresh[0].name}, from ${fresh[0].giver}.` : fresh.slice(0, 2).map(q => q.name).join(', ') + (fresh.length > 2 ? '…' : ''), action: { label: 'View quests', fn: () => DQ.go('quests') }, sound: 'notify', ttl: 10000 });
  DQ.emit('quests');
}
DQ.startQuest = id => {
  const q = D.QM[id]; if (DQ.questState(q) !== 'new') return;
  S().q[id] = { s: 'active', p: q.obj.map(() => 0) }; DQ.sfx('start');
  const P = S().pins = S().pins || []; if (!P.includes(id)) { P.unshift(id); if (P.length > 3) P.pop(); } DQ.log(`Quest started: ${q.name}.`, 'quest');
  checkQuests(); DQ.emit('quests');
};
DQ.rewardText = (r, q) => [q && q.unlocks ? `Unlocks ${D.SK[q.unlocks].name}` : '', ...Object.entries(r.xp || {}).map(([k, v]) => `${fmt(v)} ${D.SK[k].name} XP`), r.coins ? `${fmt(r.coins)} coins` : '', ...Object.entries(r.items || {}).map(([k, v]) => `${v > 1 ? v + ' ' : ''}${itemName(k)}`)].filter(Boolean);
DQ.claimQuest = id => {
  const q = D.QM[id], st = S().q[id]; if (!st || st.s !== 'ready') return;
  const short = q.obj.find(o => o.ev === 'deliver' && DQ.have(o.key) < o.n);
  if (short) { st.s = 'active'; DQ.emit('quests'); return DQ.toast(`You need ${short.n} ${itemName(short.key).toLowerCase()} to hand in`, true); }
  q.obj.forEach(o => { if (o.ev === 'deliver') DQ.take(o.key, o.n); });
  st.s = 'done'; const r = q.reward;
  if (q.unlocks) { const s = D.SK[q.unlocks]; S().unlocked[q.unlocks] = true; DQ.sfx('unlock'); DQ.notify({ kind: 'unlock', key: 'unlock:' + s.id, icon: s.id, col: s.col, title: `${s.name} unlocked!`, text: `${q.giver} has taught you ${s.name.toLowerCase()}. ${s.blurb}`, action: { label: `Open ${s.name}`, fn: () => DQ.go(s.page) }, sound: false, ttl: 14000, burst: true }); DQ.emit('lvl'); }
  Object.entries(r.xp || {}).forEach(([k, v]) => DQ.addXp(k, v, { raw: true }));
  DQ.addCoins(r.coins || 0); Object.entries(r.items || {}).forEach(([k, v]) => DQ.grant(k, v));
  DQ.log(`Quest complete: ${q.name}.`, 'quest');
  DQ.notify({ kind: 'quest', key: 'qd:' + id, icon: 'quest', col: '#f3d58a', title: `Quest complete: ${q.name}`, thanks: !!q.thanks, text: (q.thanks ? `${q.giver}: “${q.thanks}” ` : '') + (DQ.titleNod ? DQ.titleNod(q) : '') + 'Rewards: ' + DQ.rewardText(r, q).join(' · '), sound: 'quest', burst: true, ttl: 10000 });
  DQ.achDirty = true; checkQuests(); DQ.emit('quests');
};

/* ---------- Achievements ---------- */
DQ.checkAch = () => {
  const fresh = [];
  for (const a of D.ACH) {
    if (S().ach[a.id]) continue;
    if ((a.val() || 0) >= a.goal) {
      S().ach[a.id] = Date.now(); DQ.addCoins(a.coins, { noStat: true }); fresh.push(a);
      try { window.dqNative && window.dqNative.achievement(a.id); } catch (e) {}
    }
  }
  if (fresh.length === 1) { const a = fresh[0]; DQ.notify({ kind: 'ach', key: 'ach:' + a.id, icon: a.ic, col: '#f3d58a', title: `Achievement: ${a.name}`, text: `${a.desc} +${fmt(a.coins)} coins.`, sound: 'ach', ttl: 8000 }); }
  else if (fresh.length > 1) DQ.notify({ kind: 'ach', key: 'ach:multi', icon: 'trophy', col: '#f3d58a', title: `${fresh.length} achievements earned`, text: fresh.slice(0, 3).map(a => a.name).join(', ') + (fresh.length > 3 ? ` +${fresh.length - 3} more` : '') + `. +${fmt(fresh.reduce((t, a) => t + a.coins, 0))} coins.`, action: { label: 'View achievements', fn: () => DQ.go('achievements') }, sound: 'ach', ttl: 9000 });
  if (fresh.length) DQ.emit('ach');
  DQ.achDirty = false;
};

/* ---------- Activities ---------- */
const KIND_SKILL = { fish: 'fishing', wood: 'woodcutting', mine: 'mining', thieve: 'thieving', alch: 'magic' };
DQ.actKey = a => a ? a.kind + ':' + a.id : '';
DQ.actSkill = a => { a = a || DQ.act; if (!a) return null; if (a.kind === 'recipe') return D.RECIPES[a.id].skill; if (a.kind === 'fight') { const st = DQ.weaponStyle(); return st === 'ranged' ? 'ranged' : st === 'magic' ? 'magic' : D.SK[meleeSkill()].id; } return KIND_SKILL[a.kind]; };
DQ.actLabel = a => {
  a = a || DQ.act; if (!a) return '';
  if (a.kind === 'fish') return `Fishing ${D.NODE['fish:' + a.id].name.toLowerCase()}`;
  if (a.kind === 'wood') return `Cutting ${D.NODE['wood:' + a.id].name.toLowerCase()}`;
  if (a.kind === 'mine') return `Mining ${D.NODE['mine:' + a.id].name.toLowerCase()}`;
  if (a.kind === 'thieve') return `Pickpocketing: ${D.NODE['thieve:' + a.id].name.toLowerCase()}`;
  if (a.kind === 'alch') return `Alchemy on ${itemName(a.id).toLowerCase()}`;
  if (a.kind === 'fight') return `${D.MON[a.id].boss ? 'Challenging' : 'Fighting'} ${D.MON[a.id].name}`;
  const r = D.RECIPES[a.id]; return { cooking: 'Cooking', smithing: 'Making', crafting: 'Crafting' }[r.skill] + ' ' + r.name.toLowerCase();
};
const baseDur = (kind, id) => kind === 'recipe' ? D.RECIPES[id].t : kind === 'alch' ? 2600 : kind === 'fight' ? 2000 : D.NODE[kind + ':' + id].t;
DQ.durFor = (kind, id) => { const sk = kind === 'recipe' ? D.RECIPES[id].skill : KIND_SKILL[kind]; return Math.round(baseDur(kind, id) * (sk ? DQ.speedMult(sk) : 1)); };
DQ.successChance = (kind, n) => {
  const L = DQ.lvl(n.skill);
  return kind === 'thieve' ? clamp(.5 + (L - n.lvl) * .016, .4, .95) : clamp(.58 + (L - n.lvl) * .012, .55, .96);
};
DQ.burnChance = r => clamp(.55 - (DQ.lvl('cooking') - r.lvl) * .02 - DQ.fx().burn, .01, .55);
DQ.canMake = r => Object.entries(r.in).every(([k, n]) => DQ.have(k) >= n);
const meleeSkill = () => ({ accurate: 'attack', aggressive: 'strength', defensive: 'defence' }[S().style.melee]);

DQ.startAct = (kind, id, o = {}) => {
  if (DQ.act && DQ.act.kind === kind && DQ.act.id === id && !o.quiet) return DQ.stopAct();
  const bad = m => { if (!o.quiet) DQ.toast(m, true); return false; };
  if (kind === 'recipe') {
    const r = D.RECIPES[id]; if (!DQ.skillUnlocked(r.skill)) return bad(`${D.SK[r.skill].name} is not unlocked yet`);
    if (DQ.lvl(r.skill) < r.lvl) return bad(`Requires ${D.SK[r.skill].name} ${r.lvl}`);
    if (!DQ.canMake(r)) return bad('You are missing materials');
  } else if (kind === 'alch') {
    if (!DQ.skillUnlocked('magic') || DQ.lvl('magic') < D.ALCH[0].lvl) return bad(`Alchemy needs Magic ${D.ALCH[0].lvl}`);
    if (DQ.have('rune') < 2) return bad('You need Arcane runes. The shop sells them.');
  } else if (kind === 'fight') {
    const m = D.MON[id];
    if (m.town !== S().town) return bad(`${m.name} lives in ${D.TOWN[m.town].name}`);
    if (m.boss && DQ.combatLvl() < m.boss.req) return bad(`You need combat level ${m.boss.req} to challenge ${m.boss.short}`);
    const st = DQ.weaponStyle();
    if (st === 'ranged' && !(S().ammo.id && (S().ammo.n > 0 || DQ.have(S().ammo.id)))) return bad('Equip some arrows first');
    if (st === 'magic' && !pickSpell()) return bad('You need more Arcane runes for a spell');
    DQ.fight = { id, hp: m.hp, round: 0, mt: 0, ma: 0, pa: 0, phase: 0 };
  } else {
    const n = D.NODE[kind + ':' + id];
    if (!DQ.nodeHere(n)) return bad(DQ.nodeRegional(n) ? `That is only found in ${D.TOWN[n.town].name}` : `Reach ${D.TOWN[n.town].name} once to discover it`);
    if (!DQ.skillUnlocked(n.skill)) return bad(`${D.SK[n.skill].name} is not unlocked yet`);
    if (DQ.lvl(n.skill) < n.lvl) return bad(`Requires ${D.SK[n.skill].name} ${n.lvl}`);
  }
  if (DQ.act) { DQ.act = null; DQ.fight = kind === 'fight' ? DQ.fight : null; }
  const pace = o.pace || S().defPace || 'steady', rule = o.rule || 'none';
  DQ.act = { kind, id, t0: Date.now(), pace, rule, count: 0, elapsed: 0, progress: 0 }; DQ.act.dur = DQ.actDur(DQ.act);
  const sk = DQ.actSkill(DQ.act); DQ.act.lvlTarget = sk ? Math.min(99, DQ.lvl(sk) + 1) : 0;
  S().act = { kind, id, pace, rule, count: 0, elapsed: 0, lvlTarget: DQ.act.lvlTarget }; S().lastPace = pace;
  if (!DQ.forecasting) { S().seen.firstTask = true; DQ.sfx('start'); DQ.log(DQ.actLabel() + '.'); DQ.emit('act'); } return true;
};
DQ.combatInterval = () => {
  const W=D.WTYPES[D.weaponType()]||D.WTYPES.sword;
  return Math.round(W.speed*(1-Math.min(.24,Math.max(0,DQ.combatLvl()-1)*.003))*(DQ.uniqueFx&&DQ.uniqueFx().swift?.9:1));
};
DQ.combatSpeedText = () => { const W=D.WTYPES[D.weaponType()]||D.WTYPES.sword,ms=DQ.combatInterval(),lv=Math.round(Math.min(.24,Math.max(0,DQ.combatLvl()-1)*.003)*100),gale=DQ.uniqueFx&&DQ.uniqueFx().swift; return `${W.name}: ${(ms/1000).toFixed(2)}s per attack · ${lv}% faster from Combat level${gale?' · 10% faster from Gale':''}`; };
DQ.actDur = a => {
  let d = DQ.durFor(a.kind, a.id);
  if (a.kind === 'fight') d = DQ.combatInterval();
  return Math.round(d / D.PACE[a.pace || 'steady'].speed * DQ.buffMult('slow'));
};
DQ.stopAct = (silent, why) => {
  if (!DQ.act) return;
  const stopped = DQ.act, stoppedPage = stopped.kind === 'recipe' ? D.RECIPES[stopped.id].skill : stopped.kind === 'fight' ? 'combat' : stopped.kind === 'alch' ? 'magic' : KIND_SKILL[stopped.kind];
  DQ.act = null; DQ.fight = null; S().act = null;
  if (why && !DQ.forecasting) setTimeout(() => { if (!DQ.act) DQ.advanceQueue(); }, 0);
  if (!DQ.sim.on) { if (!silent) { DQ.log('You stop what you were doing.'); DQ.sfx('stop'); } if (why && (S().queue || []).length) why += ' Moving on to your next queued task.'; if (why) DQ.notify({ kind: 'warn', key: 'stopped', page: stoppedPage, icon: 'info', col: '#e5b04a', title: 'Task stopped', text: why, sound: 'stop', ttl: 9000 }); }
  if (!DQ.forecasting) DQ.emit('act');
};

const extraCoins = () => D.ECONOMY.gatherCoinScale * (D.ECONOMY.gatherTownScale[townIdx()] || 1);
function floatItem(id, n) { const it = D.ITEMS[id]; DQ.floatAt(document.querySelector('.card.active .own') || document.querySelector('.card.active') || document.querySelector('.nowp'), `${DQ.ico(it.ic)}+${n} ${it.name.toLowerCase()}`, it.col); }
function floatXp(sk, x) { DQ.floatAt(document.querySelector('.card.active') || document.querySelector('.arena') || document.querySelector('.nowp'), `${DQ.ico(sk)}+${fmt(x)} XP`, D.SK[sk].col); }

function gatherDone(kind, n) {
  const sk = n.skill;
  /* Gathering completes through effort rather than an accuracy roll. */
  const qty = 1 + (chance(DQ.dblChance(sk)) ? 1 : 0);
  DQ.grant(n.item, qty);
  const x = DQ.addXp(sk, n.xp); floatXp(sk, x); floatItem(n.item, qty); if (DQ.act) DQ.act.count += qty;
  const ev = { fish: 'catch', wood: 'chop', mine: 'mine' }[kind]; S().stats[ev] += qty; DQ.qev(ev, n.id, qty);
  /* companion tricks (js/companions.js) */
  const T = k => DQ.trick && DQ.trick(k);
  if (T('fetch') && chance(1 / 40)) { fxHit('fetch'); DQ.grant(n.item, 1); DQ.trickNote(`fetched ${itemName(n.item).toLowerCase()}!`); }
  if (kind === 'fish' && T('school') && chance(1 / 12)) { fxHit('school'); DQ.grant(n.item, 1); DQ.trickNote('spotted a school! +1'); }
  if (T('echo') && chance(1 / 20)) { fxHit('echo'); DQ.grant(n.item, qty); DQ.trickNote('echo! +' + qty); }
  DQ.sfx(kind); DQ.petRoll('skill', sk); const k = extraCoins() * DQ.coinMult();
  if (kind === 'fish') {
    if (chance(D.ECONOMY.fishPouchChance * (1 + DQ.fx().find))) { const c = Math.max(1, Math.round(rnd(8, 25) * k * (T('comb') ? 1.5 : 1))); if (T('comb')) fxHit('comb'); DQ.addCoins(c); DQ.floatAt(document.querySelector('.card.active'), `${ico('pouch')}+${c} coins`, '#f3d58a'); DQ.log(`You fish up a sodden coin pouch (${c} coins).`, 'good'); DQ.sfx('coin'); }
    if (chance(D.ECONOMY.fishChestChance * (1 + DQ.fx().find))) { const c = Math.max(1, Math.round(rnd(120, 260) * k)); DQ.addCoins(c); DQ.grant(DQ.weighted(D.GEM_WEIGHTS)); S().stats.rare++; DQ.log(`You haul up a sunken chest! ${c} coins and a gem.`, 'good'); DQ.notify({ kind: 'loot', key: 'chest', icon: 'pouch', col: '#f3d58a', title: 'Sunken chest', text: `You found ${c} coins and a gem.`, sound: 'gem', burst: true }); }
  } else if (kind === 'wood') {
    if (chance(D.ECONOMY.woodNestChance * (1 + DQ.fx().find) * (T('nuts') ? 2 : 1))) { if (T('nuts')) fxHit('nuts');
      if (chance(.5)) { const c = Math.max(1, Math.round(rnd(15, 45) * k)); DQ.addCoins(c); DQ.log(`A bird's nest holds ${c} coins.`, 'good'); DQ.floatAt(document.querySelector('.card.active'), `${ico('nest')}+${c} coins`, '#f3d58a'); DQ.sfx('coin'); }
      else { const g = DQ.weighted(D.GEM_WEIGHTS); DQ.grant(g); DQ.log(`A bird's nest holds a ${itemName(g).toLowerCase()}.`, 'good'); DQ.sfx('gem'); }
    }
  } else if (kind === 'mine') {
    if (chance(D.ECONOMY.mineGemChance * (1 + DQ.fx().find) * (T('seam') ? 2 : 1))) { if (T('seam')) fxHit('seam'); const g = DQ.weighted(D.GEM_WEIGHTS); DQ.grant(g); DQ.log(`You find an uncut ${itemName(g).toLowerCase()}!`, 'good'); DQ.floatAt(document.querySelector('.card.active .own'), `${ico('gem')}${itemName(g)}`, D.ITEMS[g].col); DQ.sfx('gem'); }
    if (chance(D.ECONOMY.mineCoinChance * (1 + DQ.fx().find))) { const c = Math.max(1, Math.round(rnd(10, 30) * k)); DQ.addCoins(c); DQ.log(`You unearth old coins (${c}).`, 'good'); }
  }
}
function thieveDone(n) {
  if (chance(DQ.riskFail(DQ.successChance('thieve', n)))) { if (DQ.act) DQ.act.count++;
    const c = Math.round(rnd(n.cmin, n.cmax) * DQ.coinMult()); DQ.addCoins(c); DQ.petRoll('skill', 'thieving');
    const x = DQ.addXp('thieving', n.xp); floatXp('thieving', x);
    DQ.floatAt(document.querySelector('.card.active .own') || document.querySelector('.card.active'), `${ico('coin')}+${c} coins`, '#f3d58a');
    S().stats.thieve++; DQ.qev('thieve', n.id); DQ.sfx('thieve');
    if (DQ.trick && DQ.trick('echo') && chance(1 / 20)) { fxHit('echo'); DQ.addCoins(c); DQ.trickNote(`echo! +${c} coins`); }
    if (n.loot && chance(n.loot[1])) { DQ.grant(n.loot[0]); DQ.log(`You also lift ${itemName(n.loot[0]).toLowerCase()}.`, 'good'); }
  } else {
    if (DQ.trick && DQ.trick('paws') && (S().gameTime || 0) - (S().pets.paws ?? -1e12) >= 60000) { S().pets.paws = S().gameTime || 0; fxHit('paws'); DQ.trickNote('covered for you!'); return; }
    const d = Math.max(1, Math.round(rnd(1, n.dmg) * DQ.pace().risk)); S().hp -= d; DQ.sfx('hurt');
    DQ.log(`You are caught! (${d} damage)`, 'bad'); DQ.floatAt(document.querySelector('.hud .hp'), `-${d} health`, '#e2574c');
    if (S().hp <= 0) return die(); autoEat();
  }
}
function recipeDone(r) {
  if (!DQ.canMake(r)) return DQ.stopAct(false, `Out of materials for ${r.name.toLowerCase()}. Restock from the bank or shop.`);
  Object.entries(r.in).forEach(([k, n]) => DQ.take(k, n));
  const outId = Object.keys(r.out)[0];
  if (DQ.act) DQ.act.count++;
  const taster = DQ.trick && DQ.trick('taster'); if (taster && r.burn && DQ.act && DQ.act.count === 1) fxHit('taster');
  if (r.burn && !(taster && DQ.act && DQ.act.count === 1) && chance(Math.min(.9, DQ.burnChance(r) * DQ.pace().risk * (taster ? .75 : 1)))) { DQ.grant('burnt'); S().stats.burn++; DQ.floatAt(document.querySelector('.card.active'), 'Burnt!', '#e2574c'); DQ.sfx('hurt'); }
  else {
    const dbl = chance(DQ.dblChance(r.skill)) ? 2 : 1;
    Object.entries(r.out).forEach(([k, n]) => DQ.grant(k, n * dbl));
    if (DQ.trick && DQ.trick('bellows') && r.skill === 'smithing' && r.tab === 'Bars' && chance(.1)) { fxHit('bellows'); Object.entries(r.out).forEach(([k, n]) => DQ.grant(k, n)); DQ.trickNote('an extra bar!'); }
    if (DQ.trick && DQ.trick('echo') && chance(1 / 20)) { fxHit('echo'); Object.entries(r.out).forEach(([k, n]) => DQ.grant(k, n)); DQ.trickNote('echo! a free one'); }
    const x = DQ.addXp(r.skill, r.xp); floatXp(r.skill, x); floatItem(outId, r.out[outId] * dbl);
    S().stats[r.ev] += 1; DQ.qev(r.ev, outId, 1); DQ.petRoll('skill', r.skill); DQ.sfx({ cooking: 'sizzle', smithing: 'anvil', crafting: 'stitch' }[r.skill]);
  }
  if (!DQ.canMake(r)) DQ.stopAct(false, `Finished: out of materials for ${r.name.toLowerCase()}.`);
}
DQ.alchSpell = () => [...D.ALCH].reverse().find(a => DQ.lvl('magic') >= a.lvl);
function alchDone(id) {
  const a = DQ.alchSpell(), it = D.ITEMS[id];
  if (!a || DQ.have(id) < 1 || DQ.have('rune') < a.runes || DQ.isEquipped(id)) return DQ.stopAct(false, DQ.have(id) < 1 ? `No ${it.name.toLowerCase()} left to transmute.` : 'Out of Arcane runes.');
  DQ.take(id, 1); DQ.take('rune', a.runes);
  const c = Math.round(it.val * a.mult); DQ.addCoins(c);
  const x = DQ.addXp('magic', a.xp); floatXp('magic', x); DQ.floatAt(document.querySelector('.card.active'), `${ico('coin')}+${c} coins`, '#f3d58a');
  S().stats.alch++; DQ.sfx('cast'); if (DQ.act) DQ.act.count++;
  if (DQ.have(id) < 1 || DQ.have('rune') < a.runes) DQ.stopAct(false, DQ.have(id) < 1 ? `Finished: no ${it.name.toLowerCase()} left.` : 'Out of Arcane runes.');
}
DQ.isEquipped = id => Object.values(S().equip).includes(id);

/* ---------- Combat ---------- */
/* every unique effect and companion trick counts its triggers here (transient, never saved): tests prove each one
   fires in live play, offline catch-up and forecasts, and the arena shows the moment it happens */
const fxHit = (k, n = 1) => { const H = DQ.effectHits = DQ.effectHits || {}; H[k] = (H[k] || 0) + n; };
DQ.fxHit = fxHit;
const pickSpell = () => {
  const sp = D.SPELLS.find(s => s.id === S().spell);
  const ok = s => s && DQ.lvl('magic') >= s.lvl && DQ.have('rune') >= s.runes;
  if (ok(sp)) return sp;
  return [...D.SPELLS].reverse().find(ok) || null;
};
DQ.pstats = () => {
  const st = DQ.weaponStyle(), b = DQ.bonus(), L = DQ.lvl, sty = S().style;
  const defStance = (st === 'melee' && sty.melee === 'defensive') || (st !== 'melee' && sty[st] === 'defensive');
  const defRoll = (L('defence') + 8 + (defStance ? 3 : 0)) * (64 + b.def);
  let acc, max, sp = null;
  if (st === 'ranged') { const e = L('ranged') + 8; acc = e * (64 + b.rng); max = Math.floor(2 + e * (64 + b.rngStr) / DMG_DIV); }
  else if (st === 'magic') { sp = pickSpell() || D.SPELLS[0]; const e = L('magic') + 8; acc = e * (64 + b.mag); max = sp.max + Math.floor(L('magic') / 10) + Math.floor(b.mag / 12); }
  else { const k = (D.STYLE_TUNE && D.STYLE_TUNE.meleeLevel) || 1, e = L('attack') * k + 8 + (sty.melee === 'accurate' ? 3 : 0), es = L('strength') * k + 8 + (sty.melee === 'aggressive' ? 3 : 0); acc = e * (64 + b.atk); max = Math.floor(2 + es * (64 + b.str) / DMG_DIV); }
  const f = DQ.fx(), raw = max * (1 + f.dmg) * DQ.buffMult('weak'); max = Math.max(1, Math.round(raw));
  return { style: st, acc, max, maxRaw: raw, defRoll, red: Math.min(.75, b.def / (b.def + 320) + f.dr), spell: sp };
};
const hitChance = (acc, def) => clamp(acc > def ? 1 - (def + 2) / (2 * (acc + 1)) : acc / (2 * (def + 1)), .05, .95);
DQ.xpSplit = st => {
  const sty = S().style;
  if (st === 'melee') return [[meleeSkill(), 4]];
  const main = st === 'ranged' ? 'ranged' : 'magic';
  return sty[st] === 'defensive' ? [[main, 2], ['defence', 2]] : [[main, 4]];
};
DQ.foods = () => D.FISH_IDS.filter(id => DQ.have(id)).concat(DQ.have('bread') ? ['bread'] : []).sort((a, b) => D.ITEMS[a].heal - D.ITEMS[b].heal);
DQ.eat = (id, auto) => {
  const it = D.ITEMS[id]; if (!it || !it.heal || !DQ.have(id)) return false;
  if (S().hp >= DQ.maxHp() && !auto) { DQ.toast('You are already at full health'); return false; }
  DQ.take(id, 1); const h = Math.min(Math.round(it.heal * (1 + DQ.fx().heal)), DQ.maxHp() - S().hp); S().hp += h;
  DQ.floatAt(document.querySelector('.hud .hp'), `${ico('heart')}+${h} health`, '#5cc08a'); DQ.sfx('eat');
  if (DQ.sim.on) DQ.sim.eaten = (DQ.sim.eaten || 0) + 1; else DQ.log(`You eat the ${it.name.toLowerCase()} and recover ${h} hitpoints.`, 'good');
  return true;
};
function autoEat() {
  const s = S().settings; if (!s.autoEat) return;
  const max = DQ.maxHp(); if (S().hp > max * s.eatAt / 100) return;
  const foods = DQ.foods(); if (!foods.length) return;
  const miss = max - S().hp, fit = foods.filter(f => D.ITEMS[f].heal <= miss).pop() || foods[0];
  DQ.eat(fit, true);
}
function die() {
  DQ.stopAct(true); S().hp = DQ.maxHp(); S().stats.deaths++; DQ.achDirty = true;
  if (!DQ.sim.on) { DQ.log('Oh dear, you are dead! You wake by the campfire.', 'bad'); DQ.sfx('death'); }
  else DQ.sim.died = true;
  DQ.notify({ kind: 'death', key: 'death', icon: 'skull', col: '#e2574c', title: 'You were defeated', text: `You wake by the campfire. Check your gear and abilities, and bring more food.${(S().queue || []).length ? ' Your queue is paused.' : ''}`, sound: false, ttl: 10000 });
}
DQ.splat = (side, text, kind, delay) => { if (!DQ.sim.on) DQ.emit('splat', side, text, kind, delay); };

function combatRound() {
  const f = DQ.fight, m = D.MON[f.id], ps = DQ.pstats(), A = DQ.ability, U = DQ.uniqueFx(); DQ.lastFoe = f.id; f.round++; f.pa = (f.pa || 0) + 1;
  const sty = ps.style, W = D.WTYPES[D.weaponType()], mhp = m.hp;
  if (sty === 'ranged') {
    if (S().ammo.n <= 0 && S().ammo.id && DQ.have(S().ammo.id)) { const n = Math.min(DQ.have(S().ammo.id), 500); DQ.take(S().ammo.id, n); S().ammo.n += n; }
    if (S().ammo.n <= 0) return DQ.stopAct(false, 'Out of arrows. Craft or buy more.');
    S().ammo.n--; if (S().ammo.n <= 0 && !DQ.have(S().ammo.id)) { S().ammo = { id: null, n: 0 }; delete S().equip.ammo; }
  } else if (sty === 'magic') {
    const sp = pickSpell(); if (!sp) return DQ.stopAct(false, 'Out of Arcane runes. Buy more from the shop.');
    ps.spell = sp; ps.max = Math.round((sp.max + Math.floor(DQ.lvl('magic') / 10) + Math.floor(DQ.bonus().mag / 12)) * (1 + DQ.fx().dmg) * DQ.buffMult('weak')); DQ.take('rune', sp.runes);
  }
  const dtype = sty === 'magic' ? D.SPELL_EL[ps.spell.id] : W.dtype; f.lastEl = dtype;
  /* Hollow King changes form */
  if (m.id === 'hollowking') { const ph = f.hp > mhp * 2 / 3 ? 0 : f.hp > mhp / 3 ? 1 : 2; if (ph !== f.phase) { f.phase = ph; if (!DQ.sim.on) DQ.log(`The Hollow King changes form! Now weak to ${D.HOLLOW_PHASES[ph].weak.join(' and ')}.`, 'bad'); } }
  let dealt = 0, tag = '';
  if (f.frozen && dtype !== 'fire') { f.frozen = 0; DQ.splat('you', 'Frozen', 'miss', 0); if (!DQ.sim.on) DQ.log('You are frozen solid and lose your attack.', 'bad'); }
  else {
    f.frozen = 0;
    const wr = DQ.weakOf(m, f), grounded = m.id === 'zephyrion' && f.pinned > 0;
    const weak = wr.weak.includes(dtype), resist = wr.resist.includes(dtype) && !(grounded && D.PHYSICAL.includes(dtype));
    /* bosses are counter checks, not locks: a weakness helps a lot and a resistance hurts, but less than on ordinary
       monsters, so preparation matters without guaranteeing the fight (scripts/sim-bosses.cjs COUNTER=1) */
    let mult = weak ? DQ.typeMult(m, 'weak') : resist ? DQ.typeMult(m, 'resist') : 1; tag = weak ? 'weak' : resist ? 'resist' : '';
    let acc = ps.acc * W.acc * (weak ? 1.1 : 1), max = ps.max * W.dmg * mult * (1 + DQ.beastBonus(m.id)), sure = false;
    if (A('aimed') && f.pa % 3 === 0) { sure = true; max *= 1.5; }
    if (A('power') && f.pa % 4 === 0) { max *= 2; tag = 'power'; }
    if (A('execute') && f.hp < mhp * .3) max *= 1.5;
    /* unique gear (data.js unique.key) */
    if (U.marked && f.pa <= 3) { sure = true; max *= 1.5; fxHit('marked'); }
    if (U.fury) { max *= 1 + .35 * (1 - clamp(S().hp / DQ.maxHp(), 0, 1)); if (S().hp < DQ.maxHp()) fxHit('fury'); }
    const mDef = (m.def + 8) * (64 + m.def);
    if (sure || Math.random() < hitChance(acc, mDef)) dealt = rnd(1, Math.max(1, Math.round(max)));
    if (dealt && A('pin')) f.pinned = 2;
    if (dealt && U.twin && chance(.2)) { dealt += rnd(1, Math.max(1, Math.round(max))); tag += ' twin'; fxHit('twin'); DQ.splat('foe', 'Twin cut', 'hit', 180); }
    if (dealt && U.arc && sty === 'magic' && chance(.2)) { dealt += Math.max(1, Math.round(dealt * .5)); fxHit('arc'); DQ.splat('foe', 'Arc', 'hit', 180); }
    if (dealt && U.stun && chance(.12)) { f.stun = 1; fxHit('stun'); }
    if (dealt && U.poison) { f.poison = Math.min(3, (f.poison || 0) + 1); fxHit('poison'); }
    if (dealt && U.curse && sty === 'magic') { f.curse = Math.min(3, (f.curse || 0) + 1); fxHit('curse'); }
  }
  f.hp -= dealt; DQ.splat('foe', dealt, dealt ? 'hit ' + tag : 'miss', 0);
  if (dealt && (U.lifesteal || U.sovereign)) { const before = S().hp; S().hp = Math.min(DQ.maxHp(), S().hp + Math.max(1, Math.round(dealt * (U.lifesteal ? .2 : .08)))); const h = Math.round(S().hp - before); if (h > 0) { fxHit(U.lifesteal ? 'lifesteal' : 'sovereign'); DQ.splat('you', '+' + h, 'heal', 300); } }
  if (U.ember && sty === 'ranged') { const wr = DQ.weakOf(m, f); let e = rnd(1, Math.max(2, Math.round(ps.max * .25))); if (wr.weak.includes('fire')) e = Math.round(e * 1.5); else if (wr.resist.includes('fire')) e = Math.max(1, Math.round(e * .5)); f.hp -= e; DQ.splat('foe', e, 'hit weak', 300); fxHit('ember'); }
  if (DQ.trick && DQ.trick('charge') && f.round === 1) { fxHit('charge'); const c = Math.max(1, Math.round(ps.max * W.dmg * .5)); f.hp -= c; DQ.splat('foe', c, 'hit power', 250); }
  if (DQ.trick && DQ.trick('ember') && f.pa % 6 === 0) { fxHit('trickember'); const wr = DQ.weakOf(m, f); let e = rnd(1, Math.max(1, Math.round(ps.max * .5))); if (wr.weak.includes('fire')) e = Math.round(e * 1.5); else if (wr.resist.includes('fire')) e = Math.max(1, Math.round(e * .5)); f.hp -= e; DQ.splat('foe', e, 'hit weak', 320); }
  DQ.sfx(sty === 'ranged' ? 'bow' : sty === 'magic' ? 'cast' : dealt ? 'hit' : 'miss');
  if (dealt) {
    let first = null;
    DQ.xpSplit(sty).forEach(([sk, per], i) => { const x = DQ.addXp(sk, dealt * per); if (!i) first = [sk, x]; });
    DQ.addXp('hitpoints', dealt * 1.33);
    if (first) DQ.floatAt(document.getElementById('av-foe'), `${ico(first[0])}+${fmt(first[1])} XP`, D.SK[first[0]].col);
  }
  if (f.hp <= 0) return kill(m);
  /* the monster attacks on its own clock: faster weapons get more swings in between */
  f.mt = (f.mt || 0) + (DQ.act ? DQ.act.dur * D.PACE[DQ.act.pace || 'steady'].speed : 2000);
  const clock = U.slow ? 2300 : 2000; if (U.slow) fxHit('slow');
  while (f.mt >= clock && DQ.fight) { f.mt -= clock; if (monsterAttack(f, m, ps, sty) === 'dead') return; }
}
function monsterAttack(f, m, ps, sty) {
  const A = DQ.ability, U = DQ.uniqueFx(); f.ma = (f.ma || 0) + 1;
  if (f.poison) { const pd = f.poison * Math.max(1, Math.round(ps.max * .12)); f.hp -= pd; DQ.splat('foe', pd, 'hit poison', 300); fxHit('poisontick'); if (f.hp <= 0) { kill(m); return 'dead'; } }
  if (f.stun) { f.stun = 0; DQ.splat('foe', 'Stunned', 'miss', 600); return; }
  if (U.roar && !f.roared) { f.roared = 1; fxHit('roar'); DQ.splat('you', 'Roar!', 'miss', 600); return; }
  const special = m.boss && m.boss.special && f.ma % m.boss.special.every === 0, sp = special && m.boss.special;
  if (special && A('bash') && f.ma - (f.lastBash || -99) >= 8) { f.lastBash = f.ma; if (!DQ.forecasting) beastNote('answered', m.id); DQ.splat('you', 'Bash!', 'miss', 600); if (!DQ.sim.on) DQ.log(`Your shield bash interrupts ${sp.name}!`, 'good'); return; }
  if (special && A('ward') && f.ma - (f.lastWard || -99) >= 6) { f.lastWard = f.ma; if (!DQ.forecasting) beastNote('answered', m.id); DQ.splat('you', 'Ward', 'miss', 600); if (!DQ.sim.on) DQ.log(`Your ward absorbs ${sp.name}.`, 'good'); return; }
  if (DQ.trick && DQ.trick('heckle') && !f.heckled && f.ma >= 2) { f.heckled = 1; fxHit('heckle'); DQ.splat('you', 'Oi!', 'miss', 600); if (!DQ.sim.on) DQ.trickNote('heckled it into missing!', document.getElementById('av-foe')); return; }
  let acc = hitChance((m.att + 8) * (64 + m.att), ps.defRoll); if (f.pinned > 0) { acc *= .75; f.pinned--; }
  let taken = 0;
  if (special || Math.random() < acc) {
    taken = special ? m.max * sp.mult : rnd(1, m.max);
    if (m.id === 'grubnash' && f.hp < m.hp * .5) taken *= 1.25;
    if (special) {
      if (m.id === 'oldtusk' && sty === 'ranged') taken *= .5;
      if (m.id === 'pyrrhax' && f.lastEl === 'frost') taken *= .5;
      if (A('brace')) taken *= .5;
      if (U.bulwark) { taken *= .65; fxHit('bulwark'); } else if (U.sovereign) { taken *= .8; fxHit('sovereign'); }
      if (DQ.trick && DQ.trick('cold')) { taken *= .8; fxHit('cold'); }
      if (m.id === 'frostmaw') f.frozen = 1;
      if (m.id === 'morwenna') f.hex = 4;
    } else { if (A('kite')) taken *= .7; if (U.hide) { taken *= .85; fxHit('hide'); } }
    if (f.curse) { taken *= 1 - .05 * f.curse; fxHit('cursed'); }
    taken = Math.max(1, Math.round(taken * (1 - ps.red) * ({ careful: .85, steady: 1, push: 1.25 }[(DQ.act && DQ.act.pace) || 'steady'])));
  }
  if (f.hex > 0) { f.hex--; taken += Math.max(1, Math.round(m.max * .25)); }
  if (taken && U.thorns) { const t = Math.max(1, Math.round(taken * .35)); f.hp -= t; fxHit('thorns'); DQ.splat('foe', t, 'hit', 650); }
  if (taken && U.riposte && chance(.2)) { const r = rnd(1, Math.max(1, ps.max)); f.hp -= r; fxHit('riposte'); DQ.splat('foe', r, 'hit', 700); }
  S().hp -= taken; DQ.splat('you', special ? taken + '!' : taken, taken ? 'hit' : 'miss', 900);
  if (S().hp <= 0 && U.laststand && !f.last) { f.last = 1; S().hp = 1; fxHit('laststand'); DQ.splat('you', 'Last stand!', 'miss', 1000); }
  if (taken) setTimeout(() => DQ.sfx('hurt'), 900);
  if (special && !DQ.sim.on) { DQ.log(`${m.name} unleashes ${sp.name}!`, 'bad'); DQ.emit('bossSpecial', m); }
  if (!DQ.sim.on && m.boss && m.boss.special) DQ.emit('bossTell', m, (f.ma + 1) % m.boss.special.every === 0);
  if (S().hp <= 0) { die(); return 'dead'; }
  if (special && !DQ.forecasting) beastNote('answered', m.id);
  if (f.hp <= 0) { kill(m); return 'dead'; }
  if (A('second') && !f.sw && S().hp < DQ.maxHp() * .3) { f.sw = 1; const h = Math.round(DQ.maxHp() * .3); S().hp += h; DQ.floatAt(document.querySelector('.hud .hp'), `Second wind +${h}`, '#5cc08a'); }
  autoEat();
  /* Healing draught: an emergency drink once the food is gone and health is low, at most once per fight */
  if (S().settings.autoEat && !f.drank && !DQ.foods().length && S().hp < DQ.maxHp() * .25 && DQ.have('potion_heal')) {
    f.drank = 1; DQ.take('potion_heal', 1); const h = Math.min(Math.round(DQ.maxHp() * .4), DQ.maxHp() - S().hp); S().hp += h; fxHit('draught'); DQ.splat('you', 'Draught +' + h, 'heal', 950);
  }
  if (DQ.act && DQ.act.pace === 'careful' && S().hp < DQ.maxHp() * .35 && !DQ.foods().length) { DQ.stopAct(false, 'You retreated at low health with no food left (Careful pace).'); return 'dead'; }
}
/* field-guide understanding (bestiary.js): wins whose finishing blow used a weak point, and boss specials you answered */
const beastNote = (key, id) => { const B = S().beast; const T = B[key] = B[key] || {}; T[id] = (T[id] || 0) + 1; };
function kill(m) {
  const f = DQ.fight;
  if (f && !DQ.forecasting) { const wr = DQ.weakOf(m, f); if (f.lastEl && wr.weak.includes(f.lastEl)) beastNote('weakWins', m.id); } S().stats.kill++; if (DQ.act) DQ.act.count++;
  const c = Math.round(rnd(m.coins[0], m.coins[1]) * DQ.coinMult()); DQ.addCoins(c);
  const loot = c ? [`${fmt(c)} coins`] : [], got = [], drops = [];
  const first = m.boss && !(S().towns[m.town] && S().towns[m.town].boss);
  if (DQ.uniqueFx().fortune) fxHit('fortune');
  let extraCoins = 0;
  for (const [id, [a, b], p] of m.drops) {
    const guaranteed = first && m.boss.first === id;
    /* weapons and armour for a skill you have not learned yet (bows before Ranged, staves before Magic) do not drop */
    if (!guaranteed && D.ITEMS[id] && (D.ITEMS[id].type === 'gear' || D.ITEMS[id].type === 'ammo') && DQ.lockedSkillFor(id)) continue;
    const uniq = !m.boss && D.ITEMS[id] && D.ITEMS[id].unique, found = S().uniqFound = S().uniqFound || {};
    let pity = false;
    if (uniq && !guaranteed && !found[id]) { const P = S().upity = S().upity || {}; P[id] = (P[id] || 0) + 1; pity = P[id] >= Math.ceil(2.5 / p); }
    if (!(guaranteed || pity || chance(Math.min(1, p * DQ.buffMult('luck') * (DQ.uniqueFx().fortune ? 1.25 : 1))))) continue;
    if (uniq) { const firstCopy = !found[id]; found[id] = 1; if (S().upity) delete S().upity[id];
      if (firstCopy && !DQ.forecasting) { DQ.notify({ kind: 'unlock', key: 'unique:' + id, icon: D.ITEMS[id].ic, col: D.ITEMS[id].col, title: `Unique find: ${D.ITEMS[id].name}`, text: `${D.ITEMS[id].unique.name}: ${D.ITEMS[id].unique.text}${D.UNIQUE_USE && D.UNIQUE_USE[D.ITEMS[id].unique.key] ? ` Good for ${D.UNIQUE_USE[D.ITEMS[id].unique.key]}.` : ''}`, action: { label: 'Inspect', fn: () => { DQ.ui.sel = id; DQ.ui.selFrom = 'pack'; DQ.go('character'); DQ.ui.render(false); } }, sound: 'unique', burst: true, ttl: 14000 }); S().freshUnique = id; if (DQ.journal) DQ.journal('loot', `${m.name} dropped ${D.ITEMS[id].name}. ${D.ITEMS[id].unique.name}: ${D.ITEMS[id].unique.text}`, D.ITEMS[id].ic); } }
    const n = rnd(a, b), rar = D.rarityOf(guaranteed ? 0 : p); got.push(id);
    if (id === 'coin_pouch') { const cc = Math.round(rnd(m.coins[0] + 5, m.coins[1] * 3 + 10) * DQ.coinMult() * (DQ.trick && DQ.trick('comb') ? 1.5 : 1)); if (DQ.trick && DQ.trick('comb')) fxHit('comb'); extraCoins += cc; drops.push({ id, n: cc, rar, coins: true }); loot.push(`a pouch of ${fmt(cc)} coins`); continue; }
    if (id === 'treasure_chest') {
      const cc = Math.round((rnd(m.coins[1] * 5, m.coins[1] * 12) + 50) * DQ.coinMult()); extraCoins += cc; const gem = DQ.weighted(D.GEM_WEIGHTS); DQ.grant(gem); S().stats.rare++;
      const gl = (D.TOWN_GEAR[m.town] || []).filter(g => !DQ.lockedSkillFor(g)), gi = gl.length && chance(.35) ? DQ.pick(gl) : null; if (gi) DQ.grant(gi);
      drops.push({ id, n: cc, rar, coins: true }, { id: gem, n: 1, rar: D.RARITY[2] }); if (gi) drops.push({ id: gi, n: 1, rar: D.RARITY[3] });
      loot.push(`a treasure chest (${fmt(cc)} coins, ${itemName(gem).toLowerCase()}${gi ? ', ' + itemName(gi).toLowerCase() : ''})`);
      DQ.notify({ kind: 'loot', key: 'chest', icon: 'pouch', col: '#ffb84a', title: 'Treasure chest!', text: `${fmt(cc)} coins, a ${itemName(gem).toLowerCase()}${gi ? ' and ' + itemName(gi) : ''}.`, sound: 'gem', burst: true });
      continue;
    }
    const it = DQ.grant(id, n); drops.push({ id, n, rar }); loot.push(`${n > 1 ? n + ' ' : ''}${itemName(id).toLowerCase()}`);
    if (!it.rare && (rar[0] === 'rare' || rar[0] === 'epic')) DQ.notify({ kind: 'loot', key: 'drop:' + id, icon: it.ic, col: rar[2], title: `${rar[1]} drop!`, text: `${m.name} dropped ${n > 1 ? n + ' ' : 'a '}${it.name.toLowerCase()}.`, sound: 'gem', burst: rar[0] === 'epic' });
  }
  if (extraCoins) DQ.addCoins(extraCoins);
  if (!DQ.sim.on) DQ.emit('loot', m, drops, c);
  if (!DQ.sim.on) { DQ.log(`You defeat ${m.boss ? '' : 'the '}${m.name}.${loot.length ? ' ' + loot.join(', ') : ''}`, 'good'); DQ.floatAt(document.getElementById('av-foe'), loot.slice(0, 2).join(' · ') || 'Defeated', '#f3d58a'); DQ.emit('slain'); }
  else DQ.sim.kills++;
  DQ.qev('kill', m.id); DQ.recordKill(m, got);
  if (m.boss) {
    DQ.qev('boss', m.id); DQ.petRoll('boss', m.id);
    if (first) {
      const t = S().towns[m.town] || (S().towns[m.town] = { visited: true, boss: false }); t.boss = true; const next = D.TOWNS[D.TOWN[m.town].idx + 1];
      if (next && !S().towns[next.id]) S().towns[next.id] = { visited: false, boss: false };
      DQ.sfx('boss');
      DQ.notify({ kind: 'boss', key: 'boss:' + m.id, icon: 'skull', col: '#f3d58a', title: `${m.boss.short} is defeated`, text: (next ? `The road to ${next.name} is open.` : 'The realm is safe. For now.') + (D.BOSS_VOICES && D.BOSS_VOICES[m.id] ? ` ${D.BOSS_VOICES[m.id][0]}: “${D.BOSS_VOICES[m.id][1]}”` : ''), action: next ? { label: 'Open the map', fn: () => DQ.go('map') } : null, sound: false, burst: true, ttl: 15000 });
      DQ.log(`${m.name} falls. ${next ? 'The road to ' + next.name + ' opens.' : ''}`, 'quest');
      DQ.achDirty = true; DQ.fxDirty(); DQ.emit('travelunlock');
    }
  }
  if (DQ.creatureGainXp) DQ.creatureGainXp(m);
  const next = DQ.nextEncounter && DQ.nextEncounter(m);
  if (next) {
    DQ.act.id = next.id; S().act.id = next.id; f.id = next.id; f.hp = next.hp;
    if (!DQ.sim.on) { DQ.log(`You encounter ${/^[AEIOU]/.test(next.name) ? 'an' : 'a'} ${next.name.toLowerCase()}.`); DQ.emit('encounter', next); }
  } else f.hp = m.hp;
  f.round = 0;
}

/* ---------- Dispatch ---------- */
function complete() {
  const a = DQ.act; if (!a) return;
  const beforeCount = a.count;
  if (a.kind === 'recipe') recipeDone(D.RECIPES[a.id]);
  else if (a.kind === 'alch') alchDone(a.id);
  else if (a.kind === 'fight') combatRound();
  else if (a.kind === 'thieve') thieveDone(D.NODE['thieve:' + a.id]);
  else gatherDone(a.kind, D.NODE[a.kind + ':' + a.id]);
  DQ.checkActionUnlocks?.();
  if (!DQ.sim.on && a.kind !== 'fight') DQ.emit('workcycle', { kind: a.kind, id: a.id, quantity: a.count - beforeCount });
  if (DQ.act === a) { a.elapsed += a.dur; S().act && Object.assign(S().act, { count: a.count, elapsed: a.elapsed }); a.dur = DQ.actDur(a); DQ.checkRule(); }
}

/* ---------- Travel ---------- */
DQ.travel = id => {
  if (!DQ.townUnlocked(id)) return DQ.toast('That road is not open yet', true);
  if (S().town === id) return DQ.toast('You are already here');
  const from = S().town; DQ.stopAct(true); S().town = id; S().towns[id].visited = true;
  DQ.sfx('travel'); DQ.log(`You travel to ${D.TOWN[id].name}.`); DQ.musicMode(id); DQ.achDirty = true; announceQuests(); DQ.emit('travel', from, id);
};

/* ---------- Shop ---------- */
/* gear for a skill you have not learned yet (Ranged, Magic) is not sold until you can use it */
DQ.lockedSkillFor = id => { const it = D.ITEMS[id]; return it && it.req ? Object.keys(it.req).find(k => D.SK[k] && !DQ.skillUnlocked(k)) || null : null; };
DQ.skillTeacher = sk => { const s = D.SK[sk]; if (!s) return ''; const q = s.quest && D.QM[s.quest];
  return q ? `${q.giver} in ${D.TOWN[q.town].name} teaches it (“${q.name}”, from Hero ${q.adv})` : s.actionReq ? DQ.unlockHow(sk) : `It unlocks at Hero level ${s.unlock}`; };
DQ.buy = (id, qty = 1) => {
  const it = D.ITEMS[id]; let price = it.buy * qty;
  const lock = DQ.lockedSkillFor(id); if (lock) return DQ.toast(`Learn ${D.SK[lock].name} first. ${DQ.skillTeacher(lock)}.`, true);
  if (it.type === 'tool') { if (DQ.have(id)) return DQ.toast('You already own that', true); qty = 1; price = it.buy; }
  if (S().coins < price) return DQ.toast('Not enough coins', true);
  S().coins -= price; DQ.give(id, qty); S().stats.bought += qty; if (it.type === 'tool') S().stats.tools++;
  DQ.sfx('buy'); DQ.achDirty = true; DQ.emit('shop'); return true;
};
/* Keepsakes (adventure relics and anything marked keepsake) belong to a story and can never be sold, from any screen. */
DQ.sellable = id => { const it = D.ITEMS[id]; return !!it && it.type !== 'relic' && !it.keepsake; };
DQ.KEEPSAKE_NOTE = 'Keepsake: part of an adventure, so it cannot be sold. It stays safe in your pack or bank.';
DQ.sell = (id, qty, from) => {
  const it = D.ITEMS[id], store = from === 'pack' ? S().inv : from === 'bank' ? S().bank : null;
  if (!it || !Number.isFinite(qty) || qty <= 0) return;
  if (!DQ.sellable(id)) { if (DQ.toast) DQ.toast(`${it.name} is a keepsake and cannot be sold`, true); return; }
  qty = Math.min(Math.floor(qty), store ? store[id] || 0 : DQ.have(id));
  if (!qty) return;
  if (store) { store[id] -= qty; if (!store[id]) delete store[id]; DQ.invDirty = true; }
  else DQ.take(id, qty);
  const coins = (it.val || 0) * qty;
  DQ.addCoins(coins); S().stats.sold += qty; DQ.sfx('sell'); DQ.achDirty = true; DQ.emit('shop'); return coins;
};
DQ.sellJunk = () => { let c = 0; Object.keys({ ...S().inv, ...S().bank }).forEach(id => { if (D.ITEMS[id] && D.ITEMS[id].type === 'junk' && DQ.sellable(id)) c += DQ.sell(id, DQ.have(id)) || 0; }); return c; };

/* ---------- Offline and catch-up simulation ---------- */
/* Time away: full speed for the first two hours, half speed after that, capped at 8 hours */
const OFFLINE_FULL = 2 * 3600 * 1000, OFFLINE_RATE = .5;
DQ.OFFLINE_CAP = OFFLINE_CAP; DQ.OFFLINE_FULL = OFFLINE_FULL; DQ.OFFLINE_RATE = OFFLINE_RATE;
DQ.offlineEff = gap => { const c = Math.min(gap, OFFLINE_CAP); return Math.round(Math.min(c, OFFLINE_FULL) + Math.max(0, c - OFFLINE_FULL) * OFFLINE_RATE); };
/* Count time spent outside the app (every absence over 5 seconds), and remember the last few for the playtest report */
DQ.noteAway = (gap, eff) => {
  const st = S(); st.awayMs = (st.awayMs || 0) + gap; st.awayEff = (st.awayEff || 0) + eff;
  const t = st.tele = st.tele || { adv: {}, skill: {}, first: {}, away: [], sessions: 0 };
  t.away.push({ at: Date.now(), gap, eff }); if (t.away.length > 20) t.away.shift();
};
/* One elapsed-time budget drives live play, forecasts and offline catch-up. */
DQ.advanceTime = (effectiveMs, realMs = effectiveMs, partial = 0) => {
  let realLeft = Math.max(0, realMs), effectiveLeft = Math.max(0, effectiveMs), actions = 0;
  let progress = DQ.act ? partial : 0;
  while (realLeft > .001) {
    const a = DQ.act, duration = a ? Math.max(1, DQ.actDur(a)) : Infinity;
    const ratio = effectiveLeft / realLeft;
    let step = Math.min(1000, realLeft);
    if (a && ratio > 0) step = Math.min(step, Math.max(0, duration - progress) / ratio);
    for (const buff of DQ.buffs ? DQ.buffs() : []) step = Math.min(step, buff.until - S().gameTime);
    for (const research of S().research.active) step = Math.min(step, research.left);
    step = Math.max(.001, step);
    const worked = Math.min(effectiveLeft, step * ratio);
    if (!a || a.kind !== 'fight') {
      S().hp = Math.min(DQ.maxHp(), S().hp + Math.ceil(DQ.maxHp() / 50) * (1 + DQ.fx().regen) * worked / 3000);
    }
    progress += a ? worked : 0;
    DQ.advanceWorld(step);
    realLeft = Math.max(0, realLeft - step);
    effectiveLeft = Math.max(0, effectiveLeft - worked);
    if (a && DQ.act === a && progress + .001 >= duration) {
      a.dur = duration;
      complete(); actions++;
      progress = 0;
    }
    if (DQ.act !== a) progress = 0;
    if (DQ.act) DQ.act.dur = DQ.actDur(DQ.act);
  }
  if (DQ.act) {
    DQ.act.progress = progress;
    DQ.act.t0 = Date.now() - progress;
    if (S().act) S().act.progress = progress;
  }
  return actions;
};
DQ.simulate = (ms, real = ms) => {
  const sim = DQ.sim = { on: true, xp: {}, items: {}, coins: 0, kills: 0, levels: [], notes: [], adv: null, ms, real, advFrom: DQ.advLvl(), eaten: 0, died: false, label: DQ.act ? DQ.actLabel() : '' };
  try {
    const partial = DQ.act ? DQ.act.progress || 0 : 0;
    /* Real absences use the same two-hour taper shown to the player. */
    if (real > OFFLINE_FULL && ms === DQ.offlineEff(real)) {
      sim.actions = DQ.advanceTime(OFFLINE_FULL, OFFLINE_FULL, partial);
      sim.actions += DQ.advanceTime(ms - OFFLINE_FULL, real - OFFLINE_FULL, DQ.act ? DQ.act.progress || 0 : 0);
    } else sim.actions = DQ.advanceTime(ms, real, partial);
    sim.stopped = !DQ.act;
  } finally { sim.on = false; }
  if (!DQ.forecasting) DQ.checkAch();
  const summaries = new Map();
  for (const note of sim.notes.filter(n => ['level', 'adv', 'unlock', 'boss'].includes(n.kind))) {
    let n = { ...note };
    const key = n.key || n.title, previous = summaries.get(key);
    if (previous && n.kind === 'level') {
      n.from = previous.from;
      n.unlocks = [...new Set([...(previous.unlocks || []), ...(n.unlocks || [])])];
      n.title = `${D.SK[n.skill].name} levels ${n.from + 1}–${n.to}!`;
      if (n.unlocks.length) n.text = n.unlocks.join(' ');
    }
    /* several Hero levels while away become one card that still lists everything they unlocked */
    if (previous && n.kind === 'adv') {
      n.gains = [...new Set([...(previous.gains || []), ...(n.gains || [])])]; n.from = Number.isFinite(previous.from) ? previous.from : previous.to - 1;
      n.title = `Hero levels ${n.from + 1}–${n.to}!`;
      n.text = (n.gains.length ? `Unlocked: ${n.gains.join(', ')}. ` : '') + n.text.replace(/^Unlocked: [^.]*\. /, '');
    }
    summaries.set(key, n);
  }
  const keep = [...summaries.values()];
  if (!DQ.forecasting) setTimeout(() => keep.forEach((n, i) => setTimeout(() => DQ.notify(Object.assign({}, n, { burst: false })), i * 700)), 900);
  if (!DQ.forecasting) DQ.emit('act'); return sim;
};

/* ---------- Main loop ---------- */
/* Errors inside the game loop must never freeze the game quietly: keep a record, tell the player once */
let errRun = 0, errShown = '';
DQ.errors = DQ.errors || [];
function softFail(e) {
  const msg = String(e && e.stack ? e.stack.split('\n').slice(0, 3).join(' < ') : e).slice(0, 400);
  DQ.errors.push({ at: Date.now(), msg }); if (DQ.errors.length > 20) DQ.errors.shift();
  if (errShown !== msg && !DQ.forecasting) { errShown = msg; try { console.error('[Idlewick]', msg); DQ.toast('Game hiccup: ' + msg.slice(0, 140), true); } catch (x) {} }
}
let lastTick = Date.now(), regenAcc = 0, uiAcc = 0, histAcc = 0, saveAcc = 0, achAcc = 0;
DQ.tick = () => {
  const now = Date.now(), gap = now - lastTick; lastTick = now;
  if (DQ.paused) return;
  if (gap > 5000) {
    const real = Math.min(gap, OFFLINE_CAP), eff = DQ.offlineEff(gap); DQ.noteAway(gap, eff);
    const sum = DQ.simulate(eff, real); DQ.makeAwayEvents(sum, gap); if (gap > 30000) DQ.emit('welcome', sum, gap); return;
  }
  S().playtime += gap; DQ.sessMs = (DQ.sessMs || 0) + gap;
  try { DQ.advanceTime(gap, gap, DQ.act ? DQ.act.progress || 0 : 0); errRun = 0; }
  catch (e) { softFail(e); if (++errRun >= 3) DQ.stopAct(true, 'This task stopped after an error. Your hero is safe.'); }
  if ((uiAcc += gap) >= 250) { uiAcc = 0; DQ.emit('ui'); }
  if ((histAcc += gap) >= 5000) { histAcc = 0; DQ.hist.push({}); if (DQ.hist.length > 60) DQ.hist.shift(); }
  if ((achAcc += gap) >= 1500) { achAcc = 0; DQ.checkAch(); checkQuests(); }
  if ((saveAcc += gap) >= 10000) { saveAcc = 0; DQ.save(); }
};
DQ.resumeAfterLoad = () => {
  const s = S().act; DQ.act = null;
  if (s) {
    try {
      let ok = false; const k = s.kind;
      if (k === 'recipe') ok = !!D.RECIPES[s.id]; else if (k === 'alch') ok = !!D.ITEMS[s.id]; else if (k === 'fight') ok = !!D.MON[s.id] && D.MON[s.id].town === S().town; else ok = !!D.NODE[k + ':' + s.id] && DQ.nodeHere(D.NODE[k + ':' + s.id]);
      if (ok) { DQ.act = { kind: k, id: s.id, area: s.area || null, target: s.target || null, questTarget: !!s.questTarget, t0: Date.now(), pace: s.pace || 'steady', rule: s.rule || 'none', count: s.count || 0, elapsed: s.elapsed || 0, lvlTarget: s.lvlTarget || 0, progress: s.progress || 0 }; DQ.act.dur = DQ.actDur(DQ.act); DQ.act.t0 -= DQ.act.progress; if (k === 'fight') DQ.fight = { id: s.id, hp: D.MON[s.id].hp, round: 0, mt: 0, ma: 0, pa: 0, phase: 0 }; }
    } catch (e) {}
    if (!DQ.act) S().act = null;
  }
  lastTick = Date.now();
};
DQ.startLoop = () => { lastTick = Date.now(); setInterval(DQ.tick, 100); addEventListener('pagehide', DQ.save); document.addEventListener('visibilitychange', () => { if (document.hidden) DQ.save(); }); };
D.FISH_IDS = D.NODES.fish.map(n => n.id);
})();
