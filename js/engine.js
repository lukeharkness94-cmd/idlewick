/* Idlewick: the rules. Activities, combat, quests, achievements, offline progress. */
(() => {
const DQ = window.DQ, D = DQ.data, { rnd, pick, chance, clamp, ico, fmt } = DQ;
const S = () => DQ.S;
const OFFLINE_CAP = 24 * 3600 * 1000;
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
/* a recipe renamed or moved by a later data file drops its old name, so a level never lists one thing twice (20 Nov) */
(D.UNL_SEED || []).forEach(([skill, level, name, id]) => { const r = D.RECIPES[id], list = D.UNL[skill] && D.UNL[skill][level]; if (list && (!r || r.name !== name || r.lvl !== level || r.skill !== skill)) { const i = list.indexOf(name); if (i >= 0) list.splice(i, 1); } });
Object.values(D.NODE).forEach(n => indexUnlock(n.skill, n.lvl, n.name));
Object.values(D.RECIPES).forEach(r => indexUnlock(r.skill, r.lvl, r.name));
/* batch sizes belong on the card, not in a level-up list: "Bronze arrows (12)" reads "Bronze arrows" */
for (const levels of Object.values(D.UNL)) for (const [l, names] of Object.entries(levels)) levels[l] = [...new Set(names.map(n => typeof n === 'string' ? n.replace(/\s*\(\d+\)$/, '') : n))];
Object.values(D.ITEMS).filter(it => ['gear','ammo'].includes(it.type)).forEach(it => Object.entries(it.req || {}).forEach(([sk, level]) => indexUnlock(sk, level, 'Equip: ' + it.name)));
(D.CROPS || []).forEach(c => indexUnlock('farming', c.lvl, 'Grow ' + c.name));
(D.ANIMALS || []).forEach(a => indexUnlock('farming', a.lvl, 'Keep ' + a.name));

/* ---------- Experience and levels ---------- */
/* a fighting style behind your best one learns three times as fast until it reaches 70% of it, so picking up a bow or a
   staff later in the game becomes useful within a session (Nov 2026) */
DQ.catchUp = sk => { if (!['melee', 'ranged', 'magic'].includes(sk)) return 1; const best = Math.max(DQ.lvl('melee'), DQ.lvl('ranged'), DQ.lvl('magic')); return DQ.lvl(sk) < Math.floor(best * .7) ? 3 : 1; };
DQ.addXp = (sk, base, o = {}) => {
  sk = DQ.skId(sk); if (!DQ.skillUnlocked(sk)) return 0;
  const amt = (o.raw ? base : base * DQ.xpMult(sk)) * DQ.catchUp(sk), before = DQ.lvl(sk), advB = DQ.advLvl();
  S().xp[sk] = Math.min(2e8, S().xp[sk] + amt);
  if (!DQ.sim.on) DQ.hist[DQ.hist.length - 1][sk] = (DQ.hist[DQ.hist.length - 1][sk] || 0) + amt;
  if (DQ.sim.on) {
    DQ.sim.xp[sk] = (DQ.sim.xp[sk] || 0) + amt;
    const card = DQ.sim.activeSummary;
    if (card) {
      card.xp[sk] = (card.xp[sk] || 0) + amt;
      card.levels[sk] ||= { from: before, to: before };
      card.levels[sk].to = DQ.lvl(sk);
    }
  } else DQ.pulse(`[data-skill="${sk}"]`);
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
  if(DQ.xpSource)details.unshift(DQ.xpSource+'.');
  const growth=DQ.combatGrowth?.(sk,from);if(growth)details.push(growth);
  const unlockedDetails = details.slice();
  if (!details.length) {
    const next = Object.keys(D.UNL[sk] || {}).map(Number).filter(level => level > to).sort((a,b) => a-b)[0];
    /* the same figure as the skill's "+N% XP" chip: the opening's slower pace is not a penalty to report (27 Nov 2026
       audit: a fresh hero read "Experience bonus is now +-66%") */
    const bon = Math.round(((DQ.xpBonusBase ? DQ.xpBonusBase(sk) : DQ.xpMult(sk)) / (DQ.earlyPace ? DQ.earlyPace(sk) : 1) - 1) * 100);
    if (bon > 0) details.push(`Experience bonus is now +${bon}%.`);
    if (next) { const short = DQ.ui && DQ.ui.unlockShort ? DQ.ui.unlockShort({ what: D.UNL[sk][next].join(', ') }) : ''; if (short) details.push(`Next at level ${next}: ${short}.`); }
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
  if (fresh) { seen[id] = 1; if (!DQ.sim.on && !DQ.forecasting) { if (S().settings.digest?.discoveries !== false) DQ.sfx('discover'); DQ.notify({ kind: 'discovery', key: 'discovery:' + id, icon: it.ic, col: it.col, title: 'New item discovered', text: it.name, sound: false }); } }
  if (DQ.sim.on) {
    DQ.sim.items[id] = (DQ.sim.items[id] || 0) + n;
    const card = DQ.sim.activeSummary;
    if (card) card.items[id] = (card.items[id] || 0) + n;
  }
  if (!DQ.sim.on && !DQ.forecasting) DQ.noteItemGain?.(id, n);
  if (it.rare) S().stats.rare++;
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
  fresh.filter(q => q.main && D.SK[q.unlocks]).forEach(q => { const s = D.SK[q.unlocks]; DQ.notify({ kind: 'unlock', key: 'mq:' + q.id, icon: q.unlocks, col: s.col, title: `Main quest: ${q.name}`, text: `Learn ${s.name}. Speak to ${q.giver} in ${D.TOWN[q.town].name}.`, action: { label: 'View quest', fn: () => { DQ.ui.questTab = 'available'; DQ.go('quests'); } }, sound: 'unlock', ttl: 14000, burst: true }); });
  fresh = fresh.filter(q => !q.main); if (!fresh.length) { DQ.emit('quests'); return; }
  DQ.notify({ kind: 'quest', key: 'qnew', icon: 'quest', col: '#d8a64a', title: fresh.length === 1 ? 'New quest available' : `${fresh.length} new quests available`, text: fresh.length === 1 ? `${fresh[0].name}, from ${fresh[0].giver}.` : fresh.slice(0, 2).map(q => q.name).join(', ') + (fresh.length > 2 ? '…' : ''), action: { label: 'View quests', fn: () => DQ.go('quests') }, sound: 'notify', ttl: 10000 });
  DQ.emit('quests');
}
DQ.startQuest = id => {
  const q = D.QM[id]; if (DQ.questState(q) !== 'new') return;
  S().q[id] = { s: 'active', p: q.obj.map(() => 0) }; DQ.sfx('quill'); /* the quill signs you up (27 Nov 2026) */
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
  if (q.unlocks && !S().unlocked[q.unlocks]) { const s = D.SK[q.unlocks]; S().unlocked[q.unlocks] = true; DQ.sfx('unlock'); DQ.notify({ kind: 'unlock', key: 'unlock:' + s.id, icon: s.id, col: s.col, title: `${s.name} unlocked!`, text: `${q.giver} has taught you ${s.name.toLowerCase()}. ${s.blurb}`, action: { label: `Open ${s.name}`, fn: () => DQ.go(s.page) }, sound: false, ttl: 14000, burst: true }); DQ.emit('lvl'); }
  const xpSource=DQ.xpSource;DQ.xpSource='Quest reward: '+q.name;
  try{Object.entries(r.xp || {}).forEach(([k, v]) => DQ.addXp(k, v, { raw: true }));}finally{DQ.xpSource=xpSource;}
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
/* Activity kinds added by later skills (Sailing's voyages, Beastmastery's training): each registers
   { skill, page, label(a), dur(id), check(id) -> refusal text or '', done(a) } here (Nov 2026). */
const EXT = DQ.KIND_EXT = DQ.KIND_EXT || {};
DQ.actKey = a => a ? a.kind + ':' + a.id : '';
DQ.actSkill = a => { a = a || DQ.act; if (!a) return null; if (EXT[a.kind]) return EXT[a.kind].skillFor?.(a.id) || EXT[a.kind].skill; if (a.kind === 'recipe') return D.RECIPES[a.id].skill; if (a.kind === 'fight') { const st = DQ.weaponStyle(); return st === 'ranged' ? 'ranged' : st === 'magic' ? 'magic' : D.SK[meleeSkill()].id; } return KIND_SKILL[a.kind]; };
DQ.actLabel = a => {
  a = a || DQ.act; if (!a) return ''; if (EXT[a.kind]) return EXT[a.kind].label(a);
  if (a.kind === 'fish') return `Fishing ${D.NODE['fish:' + a.id].name.toLowerCase()}`;
  if (a.kind === 'wood') return `Cutting ${D.NODE['wood:' + a.id].name.toLowerCase()}`;
  if (a.kind === 'mine') return `Mining ${D.NODE['mine:' + a.id].name.toLowerCase()}`;
  if (a.kind === 'thieve') return `Pickpocketing: ${D.NODE['thieve:' + a.id].name.toLowerCase()}`;
  if (a.kind === 'alch') return `Alchemy on ${itemName(a.id).toLowerCase()}`;
  if (a.kind === 'fight') return `${D.MON[a.id].boss ? 'Challenging' : 'Fighting'} ${D.MON[a.id].name}`;
  const r = D.RECIPES[a.id]; return { cooking: 'Cooking', smithing: 'Making', crafting: 'Crafting' }[r.skill] + ' ' + r.name.toLowerCase();
};
const baseDur = (kind, id) => kind === 'recipe' ? D.RECIPES[id].t : kind === 'alch' ? 2600 : kind === 'fight' ? 2000 : D.NODE[kind + ':' + id].t;
DQ.durFor = (kind, id) => { if (EXT[kind]) return Math.round(EXT[kind].dur(id) * DQ.speedMult(EXT[kind].skillFor?.(id) || EXT[kind].skill)); const sk = kind === 'recipe' ? D.RECIPES[id].skill : KIND_SKILL[kind]; return Math.round(baseDur(kind, id) * (sk ? DQ.speedMult(sk) : 1)); };
DQ.successChance = (kind, n) => {
  const L = DQ.lvl(n.skill);
  return kind === 'thieve' ? clamp(.5 + (L - n.lvl) * .016, .4, .95) : clamp(.58 + (L - n.lvl) * .012, .55, .96);
};
/* Cooking (Nov 2026): any fish you hold raw can be cooked, whatever your level; your Cooking level sets how often it
   burns. At the recipe's level 30%, falling 2.5% per level above it to 1%; below the recipe's level 4% more per level
   short, up to 85%. (Was 55% at level, falling 2% per level.) */
/* Cooking discovers fish through actual acquisition/history, never through Cooking level alone. */
DQ.rememberItem = id => {if(D.ITEMS[id]){const seen=S().seen.items||(S().seen.items={}),fresh=!seen[id];seen[id]=1;if(fresh&&!DQ.forecasting&&!DQ.sim.on)DQ.emit('itemfound',id);}};
DQ.rememberFish = id => {if((D.NODES.fish||[]).some(n=>n.item===id||n.item==='raw_'+id))DQ.rememberItem(id);};
DQ.itemDiscovered = id => {
 if(id==='coins')return true;
 if(S().seen.items?.[id]||DQ.have(id)>0||Object.values(S().equip).includes(id))return true;
 if(S().workers.some(w=>(w.made?.[id]||0)>0))return true;
 return Object.entries(S().mast||{}).some(([key,n])=>{if(n<=0)return false;const sep=key.indexOf(':'),kind=key.slice(0,sep),k=key.slice(sep+1);return D.NODE[kind+':'+k]?.item===id||kind==='recipe'&&!!(D.RECIPES[k]?.out[id]||D.RECIPES[k]?.in[id])||kind==='crop'&&id==='crop_'+k||kind==='animal'&&D.ANIMAL[k]?.prod===id||kind==='brew'&&k===id;});
};
DQ.ingredientDiscovery = id => {
 const node=Object.values(D.NODE).filter(n=>n.item===id).sort((a,b)=>a.lvl-b.lvl)[0];
 if(node)return {skill:node.skill,level:node.lvl,page:D.SK[node.skill].page,kind:node.kind,id:node.id,label:`${D.SK[node.skill].name} ${node.lvl}`};
 const crop=D.CROPS?.find(c=>'crop_'+c.id===id);if(crop)return {skill:'farming',level:crop.lvl,page:'farming',label:`Farming ${crop.lvl}`};
 const animal=D.ANIMALS?.find(a=>a.prod===id);if(animal)return {skill:'farming',level:animal.lvl,page:'farming',label:`Farming ${animal.lvl}`};
 const recipe=Object.values(D.RECIPES).filter(r=>Object.keys(r.out||{})[0]===id&&(!r.secret||DQ.recipeUsable?.(r))).sort((a,b)=>a.lvl-b.lvl)[0];
 if(recipe)return {skill:recipe.skill,level:recipe.lvl,page:D.SK[recipe.skill].page,kind:'recipe',id:recipe.id,label:`${D.SK[recipe.skill].name} ${recipe.lvl}`};
 if(D.ITEMS[id]?.type==='gem')return {skill:'mining',level:1,page:'mining',label:'Mining 1 · rare find'};
 const shop=Object.entries(D.SHOPS||{}).find(([town,items])=>items.includes(id)&&DQ.townUnlocked(town))||Object.entries(D.SHOPS||{}).find(([,items])=>items.includes(id));
 if(shop)return {page:'shop',label:`Shop · ${DQ.townUnlocked(shop[0])?D.TOWN[shop[0]].name:'reach a later town'}`};
 const drop=D.MONLIST.find(m=>m.drops?.some(d=>d[0]===id));if(drop)return {page:'combat',label:(drop.boss||drop.mini)?.req?`Combat ${(drop.boss||drop.mini).req} · creature drop`:'Combat · creature drop'};
 return {page:'bestiary',label:'Guide · discover its source'};
};
DQ.recipeDiscovery = r => {if(!r)return null;const fish=DQ.cookingDiscovery(r);if(fish&&!fish.known)return {...fish,item:fish.node.item,source:DQ.ingredientDiscovery(fish.node.item)};const item=Object.keys(r.in||{}).find(id=>!DQ.itemDiscovered(id)&&!(fish?.known&&(D.NODES.fish||[]).some(n=>n.item===id||n.item.replace(/^raw_/,'')===id)));if(!item)return null;const source=DQ.ingredientDiscovery(item);return {known:false,item,source,reason:`Find ${D.ITEMS[item].name} first · ${source.label}`};};
DQ.cookingDiscovery = r => {
 if(!r||r.skill!=='cooking')return null;
 const inputs=Object.keys(r.in||{}),nodes=(D.NODES.fish||[]).filter(n=>inputs.includes(n.item)||inputs.includes(n.item.replace(/^raw_/,'')));
 if(!nodes.length)return null;
 const known=n=>{const raw=n.item,cooked=raw.replace(/^raw_/,''),seen=S().seen.items||{};return !!(seen[raw]||seen[cooked]||DQ.have(raw)||DQ.have(cooked)||(S().mast||{})['fish:'+n.id]||Object.entries(S().mast||{}).some(([k,count])=>count>0&&k.startsWith('recipe:')&&D.RECIPES[k.slice(7)]?.in[raw])||S().workers.some(w=>(w.made?.[raw]||0)>0));};
 const node=nodes.find(n=>!known(n))||nodes[0];
 return {known:nodes.every(known),node,reason:`Catch ${D.ITEMS[node.item].name} first · Fishing ${node.lvl}`};
};
DQ.recipeDiscovered = r => !DQ.recipeDiscovery(r);
DQ.recipeLvlOk = r => !!r && (DQ.lvl(r.skill) >= r.lvl || (r.skill === 'cooking' && !!r.burn && Object.keys(r.in || {}).some(k => /^raw_/.test(k) && DQ.have(k) > 0)));
DQ.burnChance = r => { const gap = DQ.lvl('cooking') - r.lvl; return gap >= 0 ? clamp(.30 - gap * .025 - DQ.fx().burn, .01, .30) : clamp(.30 - gap * .04 - DQ.fx().burn, .01, .85); };
DQ.canMake = r => !(DQ.recipeGate&&DQ.recipeGate(r)) && Object.entries(r.in).every(([k, n]) => DQ.have(k) >= n);
const meleeSkill = () => ({ accurate: 'melee', aggressive: 'melee', defensive: 'defence' }[S().style.melee]);

DQ.startAct = (kind, id, o = {}) => {
  if (DQ.act && DQ.act.kind === kind && DQ.act.id === id && !o.quiet) return DQ.stopAct();
  const bad = m => { if (!o.quiet) DQ.toast(m, true); return false; };
  if (kind === 'recipe') {
    const r = D.RECIPES[id]; if(!r)return bad('Unknown recipe');const gate=DQ.recipeGate&&DQ.recipeGate(r);if(gate)return bad(gate);if (!DQ.skillUnlocked(r.skill)) return bad(`${D.SK[r.skill].name} is not unlocked yet`);
    if (!DQ.recipeLvlOk(r)) return bad(`Requires ${D.SK[r.skill].name} ${r.lvl}`);
    if (DQ.recipeUsable && !DQ.recipeUsable(r)) return bad('You have not found this recipe');
    const discovery=DQ.recipeDiscovery(r);if(discovery)return bad(discovery.reason);
    if (!DQ.canMake(r)) return bad('You are missing materials');
  } else if (kind === 'alch') {
    if (!DQ.skillUnlocked('magic') || DQ.lvl('magic') < D.ALCH[0].lvl) return bad(`Alchemy needs Magic ${D.ALCH[0].lvl}`);
    if (DQ.have('rune') < 2) return bad('You need Arcane runes. The shop sells them.');
  } else if (kind === 'fight') {
    const preparation = DQ.openingCombatNeed?.();
    if (preparation) return bad(preparation.detail);
    const m = D.MON[id];
    if (m.town !== S().town) return bad(`${m.name} lives in ${D.TOWN[m.town].name}`);
    if (m.boss && DQ.combatLvl() < m.boss.req) return bad(`You need combat level ${m.boss.req} to challenge ${m.boss.short}`);
    if (m.mini && DQ.combatLvl() < m.mini.req) return bad(`You need combat level ${m.mini.req} to challenge ${m.mini.short}`);
    const supply = DQ.fightSupplyNeed();
    if (supply) return bad(supply.reason);
    DQ.fight = { id, hp: m.hp, round: 0, mt: 0, ma: 0, pa: 0, phase: 0 };
  } else if (EXT[kind]) {
    const skill = EXT[kind].skillFor?.(id) || EXT[kind].skill;
    if (!DQ.skillUnlocked(skill)) return bad(`${D.SK[skill].name} is not unlocked yet`);
    const why = EXT[kind].check(id); if (why) return bad(why);
  } else {
    const n = D.NODE[kind + ':' + id];
    if (!DQ.nodeHere(n)) return bad(DQ.nodeRegional(n) ? `That is only found in ${D.TOWN[n.town].name}` : `Reach ${D.TOWN[n.town].name} once to discover it`);
    if (!DQ.skillUnlocked(n.skill)) return bad(`${D.SK[n.skill].name} is not unlocked yet`);
    if (DQ.lvl(n.skill) < n.lvl) return bad(`Requires ${D.SK[n.skill].name} ${n.lvl}`);
  }
  if (DQ.act) { DQ.act = null; DQ.fight = kind === 'fight' ? DQ.fight : null; }
  const pace = o.pace || S().defPace || 'steady', rule = o.rule || 'none';
  DQ.act = { kind, id, t0: Date.now(), pace, rule, count: 0, elapsed: 0, progress: 0, limit: o.limit || 0 }; DQ.act.dur = DQ.actDur(DQ.act);
  const sk = DQ.actSkill(DQ.act); DQ.act.lvlTarget = sk ? Math.min(99, DQ.lvl(sk) + 1) : 0;
  S().act = { kind, id, pace, rule, count: 0, elapsed: 0, lvlTarget: DQ.act.lvlTarget, limit: o.limit || 0 }; S().lastPace = pace;
  if (!DQ.forecasting) delete S().lastPlannedStop;
  if (!DQ.forecasting) { S().seen.firstTask = true; DQ.sfx('start'); DQ.log(DQ.actLabel() + '.'); DQ.emit('act'); } return true;
};
DQ.combatInterval = () => {
  const W=D.WTYPES[D.weaponType()]||D.WTYPES.sword;
  return Math.round(W.speed*(1-Math.min(.24,Math.max(0,DQ.combatLvl()-1)*.003))*(DQ.uniqueFx&&DQ.uniqueFx().swift?.9:1)*(DQ.rareFx&&DQ.rareFx()&&DQ.rareFx().fx==='quick'?1-DQ.rareFx().spd:1));
};
DQ.combatSpeedText = () => { const W=D.WTYPES[D.weaponType()]||D.WTYPES.sword,ms=DQ.combatInterval(),lv=Math.round(Math.min(.24,Math.max(0,DQ.combatLvl()-1)*.003)*100),gale=DQ.uniqueFx&&DQ.uniqueFx().swift,RX=DQ.rareFx&&DQ.rareFx(),quick=RX&&RX.fx==='quick'; return `${W.name}: ${(ms/1000).toFixed(2)}s per attack · ${lv}% faster from Combat level${gale?' · 10% faster from Gale':''}${quick?` · ${Math.round(RX.spd*100)}% faster from ${RX.name}`:''}`; };
DQ.actDur = a => {
  let d = DQ.durFor(a.kind, a.id);
  if (a.kind === 'fight') d = DQ.combatInterval();
  return Math.round(d / D.PACE[a.pace || 'steady'].speed * DQ.buffMult('slow'));
};
DQ.stopAct = (silent, why, done) => { /* done: a batch finished as planned, shown as good news, not a warning */
  if (!DQ.act) return;
  const stopped = DQ.act, stoppedPage = EXT[stopped.kind] ? (EXT[stopped.kind].pageFor?.(stopped.id) || EXT[stopped.kind].page) : stopped.kind === 'recipe' ? D.RECIPES[stopped.id].skill : stopped.kind === 'fight' ? 'combat' : stopped.kind === 'alch' ? 'magic' : KIND_SKILL[stopped.kind];
  if (why && !DQ.forecasting) S().lastPlannedStop = why;
  if (DQ.sim.on && DQ.sim.activities) {
    DQ.sim.stop = { after: DQ.sim.elapsed, reason: why || (DQ.sim.died ? 'defeated in combat' : 'activity finished') };
  }
  DQ.act = null; DQ.fight = null; S().act = null;
  /* while catching up on time away the next queued task starts at once; live, it waits for the current call to finish */
  if (why && !DQ.forecasting) { if (DQ.sim.on) { if (!DQ.act && DQ.advanceQueue) DQ.advanceQueue(); } else setTimeout(() => { if (!DQ.act) DQ.advanceQueue(); }, 0); }
  if (!DQ.sim.on) { if (!silent) { DQ.log('You stop what you were doing.'); DQ.sfx('stop'); } if (why && (S().queue || []).length) why += ' Moving on to your next queued task.'; if (why) DQ.notify(done ? { kind: 'info', key: 'stopped', page: stoppedPage, icon: 'check', col: '#5cc08a', title: 'Batch complete', text: why, sound: 'perk', ttl: 7000 } : { kind: 'warn', key: 'stopped', page: stoppedPage, icon: 'info', col: '#e5b04a', title: 'Task stopped', text: why, sound: 'stop', ttl: 9000 }); }
  if (!DQ.forecasting) DQ.emit('act');
};

const extraCoins = () => D.ECONOMY.gatherCoinScale * (D.ECONOMY.gatherTownScale[townIdx()] || 1);
function floatItem(id, n) { const it = D.ITEMS[id]; DQ.floatAt(document.querySelector('.card.active .own') || document.querySelector('.card.active') || document.querySelector('.nowp'), `${DQ.ico(it.ic)}+${n} ${it.name.toLowerCase()}`, it.col); }
function floatXp(sk, x) { DQ.floatAt(document.querySelector('.card.active') || document.querySelector('.arena') || document.querySelector('.nowp'), `${DQ.ico(sk)}+${fmt(x)} XP`, D.SK[sk].col); }

function gatherDone(kind, n) {
  const sk = n.skill;
  /* Gathering completes through effort rather than an accuracy roll. */
  const qty = 1 + (chance(DQ.dblChance(sk)) ? 1 : 0) + (DQ.mastExtra && chance(DQ.mastExtra(kind, n.id)) ? 1 : 0);
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
    if (chance(D.ECONOMY.fishChestChance * (1 + DQ.fx().find))) {
      const coins = Math.max(1, Math.round(rnd(120, 260) * k));
      const gem = DQ.weighted(D.GEM_WEIGHTS);
      DQ.addCoins(coins);
      DQ.grant(gem);
      S().stats.rare++;
      DQ.log(`You haul up a sunken chest with ${coins} coins and ${itemName(gem).toLowerCase()}.`, 'good');
    }
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
    if (n.loot && chance(Math.min(n.loot[1] * 2, n.loot[1] * (1 + Math.max(0, DQ.lvl('thieving') - n.lvl) * .02)))) { DQ.grant(n.loot[0]); DQ.log(`You also lift ${itemName(n.loot[0]).toLowerCase()}.`, 'good'); }
  } else {
    if (DQ.trick && DQ.trick('paws') && (S().gameTime || 0) - (S().pets.paws ?? -1e12) >= 60000) { S().pets.paws = S().gameTime || 0; fxHit('paws'); DQ.trickNote('covered for you!'); return; }
    const d = Math.max(1, Math.round(rnd(1, n.dmg) * DQ.pace().risk)); S().hp -= d; DQ.sfx('hurt');
    DQ.log(`You are caught! (${d} damage)`, 'bad'); DQ.floatAt(document.querySelector('.hud .hp'), `-${d} health`, '#e2574c');
    if (S().hp <= 0) return die(); autoEat();
  }
}
const missingRecipeInput = r => Object.entries(r.in).find(([id, n]) => DQ.have(id) < n)?.[0];
function recipeDone(r) {
  if (!DQ.canMake(r)) {
    const missing = missingRecipeInput(r);
    return DQ.stopAct(false, missing ? `Out of ${itemName(missing).toLowerCase()}.` : 'Recipe requirements changed.');
  }
  Object.entries(r.in).forEach(([k, n]) => DQ.take(k, n));
  const outId = Object.keys(r.out)[0];
  if (DQ.act) DQ.act.count++;
  const taster = DQ.trick && DQ.trick('taster'); if (taster && r.burn && DQ.act && DQ.act.count === 1) fxHit('taster');
  if (r.burn && !(taster && DQ.act && DQ.act.count === 1) && chance(Math.min(.92, DQ.burnChance(r) * DQ.pace().risk * (taster ? .75 : 1)))) { DQ.grant('burnt'); S().stats.burn++; DQ.floatAt(document.querySelector('.card.active'), 'Burnt!', '#e2574c'); DQ.sfx('hurt'); }
  else {
    const dbl = !r.once && chance(DQ.dblChance(r.skill) + (DQ.mastExtra ? DQ.mastExtra('recipe', r.id) : 0)) ? 2 : 1;
    Object.entries(r.out).forEach(([k, n]) => DQ.grant(k, n * dbl));
    if (DQ.trick && DQ.trick('bellows') && r.skill === 'smithing' && r.tab === 'Bars' && chance(.1)) { fxHit('bellows'); Object.entries(r.out).forEach(([k, n]) => DQ.grant(k, n)); DQ.trickNote('an extra bar!'); }
    if (!r.once && DQ.trick && DQ.trick('echo') && chance(1 / 20)) { fxHit('echo'); Object.entries(r.out).forEach(([k, n]) => DQ.grant(k, n)); DQ.trickNote('echo! a free one'); }
    const x = DQ.addXp(r.skill, r.xp); floatXp(r.skill, x); floatItem(outId, r.out[outId] * dbl);
    S().stats[r.ev] = (S().stats[r.ev]||0)+1; DQ.qev(r.ev, outId, 1); DQ.petRoll('skill', r.skill); DQ.sfx({ cooking: 'sizzle', smithing: 'anvil', crafting: 'stitch', herbalism:'sizzle', enchanting:'cast', exploration:'start', carpentry:'wood' }[r.skill]);
  }
  const made = DQ.act ? DQ.act.count : 0;
  if (DQ.act && DQ.act.limit && made >= DQ.act.limit) DQ.stopAct(false, `${made} ${r.name.toLowerCase()} made, as planned. Your pack is ready.`, true);
  else if (!DQ.canMake(r)) {
    const missing = missingRecipeInput(r);
    DQ.stopAct(false, missing ? `Out of ${itemName(missing).toLowerCase()}.` : 'Recipe requirements changed.', true);
  }
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
DQ.fightSupplyNeed = () => {
  const style = DQ.weaponStyle(), { id, n } = S().ammo;
  if (style === 'ranged' && !(id && (n > 0 || DQ.have(id)))) {
    const arrows = Object.keys({ ...S().inv, ...S().bank }).find(item =>
      D.ITEMS[item]?.slot === 'ammo' && DQ.have(item) && DQ.canEquip(item).ok);
    const stocked = (D.SHOPS[S().town] || []).find(item =>
      D.ITEMS[item]?.slot === 'ammo' && DQ.canEquip(item).ok);
    return { reason: 'Equip some arrows first', item: arrows || stocked || 'arrow_bronze', equip: !!arrows };
  }
  if (style === 'magic' && !pickSpell()) return { reason: 'You need more Arcane runes for a spell', item: 'rune' };
  return null;
};
DQ.pstats = () => {
  const st = DQ.weaponStyle(), b = DQ.bonus(), L = DQ.lvl, sty = S().style;
  const defStance = (st === 'melee' && sty.melee === 'defensive') || (st !== 'melee' && sty[st] === 'defensive');
  const defRoll = (L('defence') + 8 + (defStance ? 3 : 0)) * (64 + b.def);
  let acc, max, sp = null; const KS = (D.STYLE_TUNE && D.STYLE_TUNE.level) || 1;
  if (st === 'ranged') { const e = L('ranged') * KS + 8; acc = e * (64 + b.rng); max = Math.floor(2 + e * (64 + b.rngStr) / DMG_DIV); }
  else if (st === 'magic') { sp = pickSpell() || D.SPELLS[0]; const e = L('magic') * KS + 8; acc = e * (64 + b.mag); max = sp.max + Math.floor(L('magic') * KS / 10) + Math.floor(b.mag / 12); }
  else { const k = (D.STYLE_TUNE && D.STYLE_TUNE.meleeLevel) || 1, e = L('attack') * k + 8 + (sty.melee === 'accurate' ? 3 : 0), es = L('strength') * k + 8 + (sty.melee === 'aggressive' ? 3 : 0); acc = e * (64 + b.atk); max = Math.floor(2 + es * (64 + b.str) / DMG_DIV); }
  const T = DQ.tech ? DQ.tech(st) : { dmg: 0, acc: 0, dr: 0, special: 0, free: 0 }; acc *= 1 + T.acc;
  const f = DQ.fx(), raw = max * (1 + f.dmg + T.dmg) * DQ.buffMult('weak'); max = Math.max(1, Math.round(raw));
  return { style: st, acc, max, maxRaw: raw, defRoll, red: Math.min(.75, b.def / (b.def + 320) + f.dr + T.dr), spell: sp, tech: T };
};
const hitChance = (acc, def) => clamp(acc > def ? 1 - (def + 2) / (2 * (acc + 1)) : acc / (2 * (def + 1)), .05, .95);
DQ.xpSplit = st => {
  const sty = S().style;
  if (st === 'melee') return S().style.melee === 'defensive' ? [['defence', 4]] : [['melee', 2]]; /* one Melee skill now does the work Attack and Strength shared, so it takes half the XP per hit: the same pace as before */
  const main = st === 'ranged' ? 'ranged' : 'magic';
  return sty[st] === 'defensive' ? [['defence', 4]] : [[main, 2]]; /* the same pace as Melee */
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
  if (!DQ.forecasting) S().lastPlannedStop = 'Stopped after a combat defeat.';
  DQ.stopAct(true); S().hp = DQ.maxHp(); S().stats.deaths++; DQ.achDirty = true;
  if (!DQ.sim.on) { DQ.log('Oh dear, you are dead! You wake by the campfire.', 'bad'); DQ.sfx('death'); }
  else DQ.sim.died = true;
  DQ.notify({ kind: 'death', key: 'death', icon: 'skull', col: '#e2574c', title: 'You were defeated', text: `You wake by the campfire. Check your gear and abilities, and bring more food.${(S().queue || []).length ? ' Your queue is paused.' : ''}`, sound: false, ttl: 10000 });
}
DQ.splat = (side, text, kind, delay) => { if (!DQ.sim.on) DQ.emit('splat', side, text, kind, delay); };

/* Tracking (20 Nov 2026, owner): a tracked creature takes a few seconds to find before each fight. Those rounds
   pass with no attacks either way, so a chosen target costs some kill rate, live and away alike. */
DQ.TRACK_MS = 4000;
DQ.trackRounds = () => Math.max(1, Math.round(DQ.TRACK_MS / Math.max(600, DQ.combatInterval())));
function combatRound() {
  if (DQ.fight && DQ.fight.tracking > 0) { DQ.fight.tracking--; return; }
  const f = DQ.fight, m = D.MON[f.id], ps = DQ.pstats(), A = DQ.ability, U = DQ.uniqueFx(), RX = DQ.rareFx(), rx = k => RX && RX.fx === k; DQ.lastFoe = f.id; f.round++; f.pa = (f.pa || 0) + 1;
  const sty = ps.style, W = D.WTYPES[D.weaponType()], mhp = m.hp;
  if (sty === 'ranged') {
    if (S().ammo.n <= 0 && S().ammo.id && DQ.have(S().ammo.id)) { const n = Math.min(DQ.have(S().ammo.id), 500); DQ.take(S().ammo.id, n); S().ammo.n += n; }
    if (S().ammo.n <= 0) return DQ.stopAct(false, 'Out of arrows. Craft or buy more.');
    if (!(ps.tech && ps.tech.free && chance(ps.tech.free))) S().ammo.n--; if (S().ammo.n <= 0 && !DQ.have(S().ammo.id)) { S().ammo = { id: null, n: 0 }; delete S().equip.ammo; }
  } else if (sty === 'magic') {
    const sp = pickSpell(); if (!sp) return DQ.stopAct(false, 'Out of Arcane runes. Buy more from the shop.');
    ps.spell = sp; ps.max = Math.round((sp.max + Math.floor(DQ.lvl('magic') * ((D.STYLE_TUNE && D.STYLE_TUNE.level) || 1) / 10) + Math.floor(DQ.bonus().mag / 12)) * (1 + DQ.fx().dmg + (ps.tech ? ps.tech.dmg : 0)) * DQ.buffMult('weak') * (rx('runesave') ? 1 + RX.dmg : 1)); if (!(ps.tech && ps.tech.free && chance(ps.tech.free)) && !(rx('runesave') && chance(RX.p) && (fxHit(RX.key), true))) DQ.take('rune', sp.runes);
  }
  const dtype = sty === 'magic' ? D.SPELL_EL[ps.spell.id] : (ps.dtype || W.dtype); f.lastEl = dtype; /* a combat art can change the damage type (combat_arts.js) */
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
    let acc = ps.acc * W.acc * (weak ? 1.1 : 1), max = ps.max * W.dmg * mult * (1 + DQ.beastBonus(m.id)) * (m.boss || m.mini ? DQ.buffMult('boss') : 1), sure = false;
    if (A('aimed') && f.pa % 3 === 0) { sure = true; max *= 1.5; }
    if (A('power') && f.pa % 4 === 0) { max *= 2; tag = 'power'; }
    if (A('execute') && f.hp < mhp * .3) max *= 1.5;
    if (A('overcharge') && f.pa % 5 === 0) { max *= 2; tag = 'power'; }
    if (A('bloodlust')) max *= 1 + .05 * Math.min(5, f.streak || 0);
    /* unique gear (data.js unique.key) */
    if (U.marked && f.pa <= 3) { sure = true; max *= 1.5; fxHit('marked'); }
    if (U.fury) { max *= 1.1 + .3 * (1 - clamp(S().hp / DQ.maxHp(), 0, 1)); fxHit('fury'); } /* always +10%, up to +40% as health falls */
    /* named weapons (js/rare_weapons.js): each applies its own signature with its own numbers */
    let everyNow = false;
    if (RX) {
      if (rx('opener') && f.pa <= RX.n) { sure = true; max *= RX.m; fxHit(RX.key); }
      if (rx('every') && f.pa % RX.n === 0) { everyNow = true; if (RX.sure) sure = true; max *= RX.m; if (RX.pierce && mult < 1) max /= mult; fxHit(RX.key); }
      if (rx('reap') && f.hp < mhp * RX.below) { max *= RX.m; fxHit(RX.key); }
      if (rx('momentum') && f.streak) { max *= 1 + Math.min(RX.cap, RX.step * f.streak); fxHit(RX.key); }
      if (rx('snowball') && f.landed) { max *= 1 + Math.min(RX.cap, RX.step * f.landed); fxHit(RX.key); }
      if (rx('quick')) { max *= 1 - RX.dmg; fxHit(RX.key); }
      if (rx('stunplus') && f.stunBonus) { max *= 1 + RX.bonus; f.stunBonus = 0; }
    }
    const defCut = Math.min(.6, (rx('breach') ? RX.d : 0) + (rx('sunder') ? f.sunder || 0 : 0)), effDef = m.def * (1 - defCut); if (defCut && rx('breach')) fxHit(RX.key);
    const mDef = (effDef + 8) * (64 + effDef);
    if (sure || Math.random() < hitChance(acc, mDef)) dealt = rnd(1, Math.max(1, Math.round(max)));
    if (dealt && A('deadeye')) dealt = Math.max(dealt, Math.ceil(max / 2));
    f.streak = dealt ? (f.streak || 0) + 1 : 0;
    if (dealt && ((A('cleave') && f.pa % 5 === 0) || (A('volley') && f.pa % 4 === 0))) { dealt += rnd(1, Math.max(1, Math.round(max))); tag += ' twin'; DQ.splat('foe', A('cleave') ? 'Cleave' : 'Volley', 'hit', 180); }
    if (dealt && A('echo') && chance(.2)) { dealt += Math.max(1, Math.round(dealt * .5)); DQ.splat('foe', 'Echo', 'hit', 180); }
    if (dealt && A('pin')) f.pinned = 2;
    if (dealt && RX) {
      if (rx('floor')) { const lo = Math.ceil(max * RX.f); if (dealt < lo) { dealt = lo; fxHit(RX.key); } }
      if (rx('crit') && chance(RX.p)) { dealt = Math.max(1, Math.round(dealt * RX.m)); tag += ' power'; fxHit(RX.key); DQ.splat('foe', RX.name, 'hit', 150); }
      if (rx('double') && chance(RX.p)) { dealt += rnd(1, Math.max(1, Math.round(max * RX.m))); tag += ' twin'; fxHit(RX.key); DQ.splat('foe', RX.name, 'hit', 180); }
      if (rx('volley') && f.pa % RX.every === 0) { for (let i = 0; i < RX.n; i++) dealt += rnd(1, Math.max(1, Math.round(max * RX.m))); tag += ' twin'; fxHit(RX.key); DQ.splat('foe', RX.name, 'hit', 180); }
      if (rx('spellshot') && chance(RX.p)) { const best = (D.SPELLS || []).filter(x => DQ.lvl('magic') >= x.lvl).pop() || (D.SPELLS || [])[0], el = best && D.SPELL_EL[best.id], wr2 = DQ.weakOf(m, f); let e = rnd(1, Math.max(1, Math.round(ps.max * RX.f))); if (el && wr2.weak.includes(el)) e = Math.round(e * 1.5); else if (el && wr2.resist.includes(el)) e = Math.max(1, Math.round(e * .5)); dealt += e; fxHit(RX.key); DQ.splat('foe', RX.name, 'hit', 200); }
      if (rx('chill') && chance(RX.p)) { f.chill = RX.n; fxHit(RX.key); }
      if (rx('stunplus') && chance(RX.p)) { f.stun = 1; f.stunBonus = 1; fxHit(RX.key); }
      if (everyNow && RX.stun) f.stun = 1;
      if (rx('sunder')) { f.sunder = Math.min(RX.cap, (f.sunder || 0) + RX.step); fxHit(RX.key); }
      if (rx('dot')) f.dot = Math.min(RX.max, (f.dot || 0) + 1);
    }
    if (dealt) f.landed = (f.landed || 0) + 1;
    if (dealt && U.twin && chance(.2)) { dealt += rnd(1, Math.max(1, Math.round(max))); tag += ' twin'; fxHit('twin'); DQ.splat('foe', 'Twin cut', 'hit', 180); }
    if (dealt && U.arc && sty === 'magic' && chance(.2)) { dealt += Math.max(1, Math.round(dealt * .5)); fxHit('arc'); DQ.splat('foe', 'Arc', 'hit', 180); }
    if (dealt && U.stun && chance(.12)) { f.stun = 1; fxHit('stun'); }
    if (dealt && U.poison) { f.poison = Math.min(3, (f.poison || 0) + 1); fxHit('poison'); }
    if (dealt && U.curse && sty === 'magic') { f.curse = Math.min(3, (f.curse || 0) + 1); fxHit('curse'); }
    if (dealt && DQ.artHit) dealt = DQ.artHit(ps, dealt, m, f, max);
    if (DQ.beastHeroHit) dealt = DQ.beastHeroHit(dealt, m, f);
  }
  /* XP counts the damage the creature could actually take: overkill on weak creatures teaches nothing extra */
  const xpDealt = Math.min(dealt, Math.max(0, f.hp)) * (rx('scholar') ? RX.m : 1); if (xpDealt && rx('scholar')) fxHit(RX.key);
  f.hp -= dealt; DQ.splat('foe', dealt, dealt ? 'hit ' + tag : 'miss', 0);
  if (dealt && (U.lifesteal || U.sovereign)) { const before = S().hp; S().hp = Math.min(DQ.maxHp(), S().hp + Math.max(1, Math.round(dealt * (U.lifesteal ? .2 : .08)))); const h = Math.round(S().hp - before); if (h > 0) { fxHit(U.lifesteal ? 'lifesteal' : 'sovereign'); DQ.splat('you', '+' + h, 'heal', 300); } }
  if (dealt && rx('drain') && f.hp + dealt < mhp * RX.below) { const before = S().hp; S().hp = Math.min(DQ.maxHp(), S().hp + Math.max(1, Math.round(dealt * RX.p))); const h = Math.round(S().hp - before); if (h > 0) { fxHit(RX.key); DQ.splat('you', '+' + h, 'heal', 300); } }
  if (dealt && rx('dawn') && f.pa % RX.n === 0) { const before = S().hp; S().hp = Math.min(DQ.maxHp(), S().hp + dealt); const h = Math.round(S().hp - before); if (h > 0) { fxHit(RX.key); DQ.splat('you', '+' + h, 'heal', 300); } }
  if (rx('blaze') && sty === 'magic' && dealt) { const wr = DQ.weakOf(m, f); let e = rnd(1, Math.max(2, Math.round(ps.max * RX.f))); if (wr.weak.includes('fire')) e = Math.round(e * 1.5); else if (wr.resist.includes('fire')) e = Math.max(1, Math.round(e * .5)); f.hp -= e; DQ.splat('foe', e, 'hit weak', 300); fxHit(RX.key); }
  if (U.ember && sty === 'ranged') { const wr = DQ.weakOf(m, f); let e = rnd(1, Math.max(2, Math.round(ps.max * .25))); if (wr.weak.includes('fire')) e = Math.round(e * 1.5); else if (wr.resist.includes('fire')) e = Math.max(1, Math.round(e * .5)); f.hp -= e; DQ.splat('foe', e, 'hit weak', 300); fxHit('ember'); }
  if (DQ.trick && DQ.trick('charge') && f.round === 1) { fxHit('charge'); const c = Math.max(1, Math.round(ps.max * W.dmg * .5)); f.hp -= c; DQ.splat('foe', c, 'hit power', 250); }
  if (DQ.trick && DQ.trick('ember') && f.pa % 6 === 0) { fxHit('trickember'); const wr = DQ.weakOf(m, f); let e = rnd(1, Math.max(1, Math.round(ps.max * .5))); if (wr.weak.includes('fire')) e = Math.round(e * 1.5); else if (wr.resist.includes('fire')) e = Math.max(1, Math.round(e * .5)); f.hp -= e; DQ.splat('foe', e, 'hit weak', 320); }
  DQ.sfx(sty === 'ranged' ? 'bow' : sty === 'magic' ? 'cast' : dealt ? 'hit' : 'miss');
  if (xpDealt) {
    let first = null;
    DQ.xpSplit(sty).forEach(([sk, per], i) => { const x = DQ.addXp(sk, xpDealt * per); f.heroXp = (f.heroXp || 0) + x; if (!i) first = [sk, x]; });
    f.heroXp = (f.heroXp || 0) + DQ.addXp('hitpoints', xpDealt * 1.33);
    /* the XP shows when the blow visibly lands, not while the arrow or spell is still in flight (27 Nov 2026 audit) */
    if (first) { const fl = () => DQ.floatAt(document.getElementById('av-foe'), `${ico(first[0])}+${fmt(first[1])} XP`, D.SK[first[0]].col); if (DQ.ui && DQ.ui.afterImpact && !DQ.sim.on && !DQ.forecasting) DQ.ui.afterImpact(fl, DQ.battleTiming?.impact || 390); else fl(); }
  }
  if (f.hp <= 0) return kill(m);
  if (DQ.beastAttack) { f.hp -= DQ.beastAttack(f, m); if (f.hp <= 0) return kill(m); }
  /* the monster attacks on its own clock: faster weapons get more swings in between */
  f.mt = (f.mt || 0) + (DQ.act ? DQ.act.dur * D.PACE[DQ.act.pace || 'steady'].speed : 2000);
  const clock = (m.attackMs || 2000) * (U.slow ? 1.15 : 1) * (f.chill > 0 && rx('chill') ? 1 + RX.slow : 1); if (U.slow) fxHit('slow');
  while (f.mt >= clock && DQ.fight) { f.mt -= clock; if (monsterAttack(f, m, ps, sty) === 'dead') return; }
}
function monsterAttack(f, m, ps, sty) {
  const A = DQ.ability, U = DQ.uniqueFx(), RX = DQ.rareFx(), rx = k => RX && RX.fx === k; f.ma = (f.ma || 0) + 1;
  if (f.chill > 0) f.chill--;
  if (f.dot && rx('dot')) { const pd = f.dot * Math.max(1, Math.round(ps.max * RX.per)); f.hp -= pd; DQ.splat('foe', pd, 'hit poison', 300); fxHit(RX.key); if (f.hp <= 0) { kill(m); return 'dead'; } }
  if (f.poison) { const pd = f.poison * Math.max(1, Math.round(ps.max * .12)); f.hp -= pd; DQ.splat('foe', pd, 'hit poison', 300); fxHit('poisontick'); if (f.hp <= 0) { kill(m); return 'dead'; } }
  if (f.stun) { f.stun = 0; DQ.splat('foe', 'Stunned', 'miss', 600); return; }
  if (U.roar && !f.roared) { f.roared = 1; fxHit('roar'); DQ.splat('you', 'Roar!', 'miss', 600); return; }
  const bm = m.boss || m.mini, special = bm && bm.special && f.ma % bm.special.every === 0, sp = special && bm.special;
  if (special && A('bash') && f.ma - (f.lastBash || -99) >= 8) { f.lastBash = f.ma; if (!DQ.forecasting) beastNote('answered', m.id); DQ.splat('you', 'Bash!', 'miss', 600); if (!DQ.sim.on) DQ.log(`Your shield bash interrupts ${sp.name}!`, 'good'); return; }
  if (special && A('ward') && f.ma - (f.lastWard || -99) >= 6) { f.lastWard = f.ma; if (!DQ.forecasting) beastNote('answered', m.id); DQ.splat('you', 'Ward', 'miss', 600); if (!DQ.sim.on) DQ.log(`Your ward absorbs ${sp.name}.`, 'good'); return; }
  if (DQ.trick && DQ.trick('heckle') && !f.heckled && f.ma >= 2) { f.heckled = 1; fxHit('heckle'); DQ.splat('you', 'Oi!', 'miss', 600); if (!DQ.sim.on) DQ.trickNote('heckled it into missing!', document.getElementById('av-foe')); return; }
  if (!special && rx('parry') && chance(RX.p)) { fxHit(RX.key); DQ.splat('you', RX.name, 'miss', 600); return; }
  let acc = hitChance((m.att + 8) * (64 + m.att), ps.defRoll); if (f.pinned > 0) { acc *= .75; f.pinned--; }
  let taken = 0;
  if (special || Math.random() < acc) {
    taken = special ? m.max * sp.mult : rnd(1, m.max);
    if (m.id === 'grubnash' && f.hp < m.hp * .5) taken *= 1.25;
    if (special) {
      taken *= DQ.buffMult('specialGuard');
      if (m.id === 'oldtusk' && sty === 'ranged') taken *= .5;
      if (m.id === 'pyrrhax' && f.lastEl === 'frost') taken *= .5;
      if (A('brace')) taken *= .5;
      if (ps.tech && ps.tech.special) taken *= 1 - ps.tech.special;
      if (U.bulwark) { taken *= .65; fxHit('bulwark'); } else if (U.sovereign) { taken *= .8; fxHit('sovereign'); }
      if (DQ.trick && DQ.trick('cold')) { const saved=taken*.2;taken *= .8;fxHit('cold');f.companionGuard=(f.companionGuard||0)+saved;if(!f.guardShown&&!DQ.sim.on&&!DQ.forecasting){f.guardShown=true;DQ.log(`${D.PET[S().pets.active].name} softens the special attack.`, 'good');} }
      if(sp.frostMult&&f.lastEl==='frost')taken*=sp.frostMult;
      if(sp.rangedMult&&sty==='ranged')taken*=sp.rangedMult;
      if(sp.freeze)f.frozen=sp.freeze;
      if(sp.hex)f.hex=sp.hex;
      if (m.id === 'frostmaw') f.frozen = 1;
      if (m.id === 'morwenna') f.hex = 4;
    } else { if (A('kite')) taken *= .7; if (A('fortress')) taken *= .85; if (U.hide) { taken *= .85; fxHit('hide'); } }
    if (f.curse) { taken *= 1 - .05 * f.curse; fxHit('cursed'); }
    if (rx('guard') && (f.guarded || 0) < RX.n) { f.guarded = (f.guarded || 0) + 1; taken *= 1 - RX.red; fxHit(RX.key); }
    if (rx('rally') && S().hp < DQ.maxHp() * RX.below) { taken *= 1 - RX.red; fxHit(RX.key); }
    if (rx('dot') && RX.weaken && f.dot) taken *= 1 - RX.weaken * f.dot;
    taken *= DQ.buffMult('guard');
    taken = Math.max(1, Math.round(taken * (1 - ps.red) * ({ careful: .85, steady: 1, push: 1.25 }[(DQ.act && DQ.act.pace) || 'steady'])));
  }
  if (f.hex > 0) { f.hex--; taken += Math.max(1, Math.round(m.max * .25)); }
  if (taken && U.thorns) { const t = Math.max(1, Math.round(taken * .35)); f.hp -= t; fxHit('thorns'); DQ.splat('foe', t, 'hit', 650); }
  if (taken && U.riposte && chance(.2)) { const r = rnd(1, Math.max(1, ps.max)); f.hp -= r; fxHit('riposte'); DQ.splat('foe', r, 'hit', 700); }
  S().hp -= taken; DQ.splat('you', special ? taken + '!' : taken, taken ? 'hit' : 'miss', 900);
  if (S().hp <= 0 && A('unbreakable') && !f.unbroken) { f.unbroken = 1; S().hp = 1; DQ.splat('you', 'Unbreakable!', 'miss', 1000); }
  if (S().hp <= 0 && U.laststand && !f.last) { f.last = 1; S().hp = 1; fxHit('laststand'); DQ.splat('you', 'Last stand!', 'miss', 1000); }
  /* never from a forecast or simulation: the delayed call used to fire after the forecast flag was cleared, so the
     hero "got hurt" out loud while untouched (27 Nov 2026 audit) */
  if (taken && !DQ.sim.on && !DQ.forecasting) setTimeout(() => DQ.sfx('hurt'), 900);
  if (special && !DQ.sim.on) { DQ.log(`${m.name} unleashes ${sp.name}!`, 'bad'); DQ.emit('bossSpecial', m); }
  if (!DQ.sim.on && (m.boss || m.mini) && (m.boss || m.mini).special) DQ.emit('bossTell', m, (f.ma + 1) % (m.boss || m.mini).special.every === 0);
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
  if (DQ.beastVictory) DQ.beastVictory(f, m);
  if (!DQ.sim.on && !DQ.forecasting) DQ.emit('foedefeated', m);
  if (f && !DQ.forecasting) { const wr = DQ.weakOf(m, f); if (f.lastEl && wr.weak.includes(f.lastEl)) beastNote('weakWins', m.id); } S().stats.kill++; if (DQ.act) DQ.act.count++;
  const RX = DQ.rareFx(), rx = k => RX && RX.fx === k;
  const c = Math.round(rnd(m.coins[0], m.coins[1]) * DQ.coinMult() * (rx('steal') ? 1 + RX.coin : 1)); DQ.addCoins(c); if (rx('steal') && c) fxHit(RX.key);
  if (rx('steal') && D.ITEMS.coin_pouch && chance(RX.pouch)) DQ.give('coin_pouch', 1);
  if (rx('feast')) { const before = S().hp; S().hp = Math.min(DQ.maxHp(), S().hp + Math.round(DQ.maxHp() * RX.heal)); if (S().hp > before) { fxHit(RX.key); DQ.splat('you', '+' + Math.round(S().hp - before), 'heal', 300); } }
  const loot = c ? [`${fmt(c)} coins`] : [], got = [], drops = [];
  const first = m.boss && !(S().towns[m.town] && S().towns[m.town].boss), firstMini = m.mini && !(S().minis && S().minis[m.id]);
  if (DQ.uniqueFx().fortune) fxHit('fortune');
  let extraCoins = 0;
  for (const [id, [a, b], p] of m.drops) {
    const guaranteed = (first && m.boss.first === id) || (firstMini && m.mini.first === id);
    /* weapons and armour for a skill you have not learned yet (bows before Ranged, staves before Magic) do not drop */
    if (!guaranteed && D.ITEMS[id] && (D.ITEMS[id].type === 'gear' || D.ITEMS[id].type === 'ammo') && DQ.lockedSkillFor(id)) continue;
    const uniq = !m.boss && D.ITEMS[id] && D.ITEMS[id].unique, found = S().uniqFound = S().uniqFound || {};
    let pity = false;
    if (uniq && !guaranteed && !found[id]) { const P = S().upity = S().upity || {}; P[id] = (P[id] || 0) + 1; pity = P[id] >= Math.ceil(2.5 / p); }
    if (!(guaranteed || pity || chance(Math.min(1, p * DQ.buffMult('luck') * (DQ.uniqueFx().fortune ? 1.25 : 1))))) continue;
    if (uniq) { const firstCopy = !found[id]; found[id] = 1; if (S().upity) delete S().upity[id];
      if (firstCopy && !DQ.forecasting) { DQ.notify({ kind: 'unlock', key: 'unique:' + id, icon: D.ITEMS[id].ic, col: D.ITEMS[id].col, title: `Unique find: ${D.ITEMS[id].name}`, text: `${D.ITEMS[id].unique.name}: ${D.ITEMS[id].unique.text}${D.UNIQUE_USE && D.UNIQUE_USE[D.ITEMS[id].unique.key] ? ` Good for ${D.UNIQUE_USE[D.ITEMS[id].unique.key]}.` : ''}`, action: { label: 'Compare equipment', fn: () => { DQ.ui.sel = id; DQ.ui.selFrom = 'pack'; DQ.go('character'); DQ.ui.render(false); } }, sound: 'unique', burst: true, ttl: 14000 }); S().freshUnique = id; if (DQ.journal) DQ.journal('loot', `${m.name} dropped ${D.ITEMS[id].name}. ${D.ITEMS[id].unique.name}: ${D.ITEMS[id].unique.text}`, D.ITEMS[id].ic); } }
    const n = rnd(a, b), rar = D.rarityOf(guaranteed ? 0 : p); got.push(id);
    if (id === 'coin_pouch') { const cc = Math.round(rnd(m.coins[0] + 5, m.coins[1] * 3 + 10) * DQ.coinMult() * (DQ.trick && DQ.trick('comb') ? 1.5 : 1)); if (DQ.trick && DQ.trick('comb')) fxHit('comb'); extraCoins += cc; drops.push({ id, n: cc, rar, coins: true }); loot.push(`a pouch of ${fmt(cc)} coins`); continue; }
    if (id === 'treasure_chest') {
      const cc = Math.round((rnd(m.coins[1] * 5, m.coins[1] * 12) + 50) * DQ.coinMult() * (1 + .01 * DQ.thiefLvl())); extraCoins += cc; const gem = DQ.weighted(D.GEM_WEIGHTS); DQ.grant(gem); S().stats.rare++;
      if (DQ.thiefLvl() >= 30) { const g2 = DQ.weighted(D.GEM_WEIGHTS); DQ.grant(g2); drops.push({ id: g2, n: 1, rar: D.RARITY[2] }); }
      const gl = (D.TOWN_GEAR[m.town] || []).filter(g => !DQ.lockedSkillFor(g)), gi = gl.length && chance(.35) ? DQ.pick(gl) : null; if (gi) DQ.grant(gi);
      drops.push({ id, n: cc, rar, coins: true }, { id: gem, n: 1, rar: D.RARITY[2] }); if (gi) drops.push({ id: gi, n: 1, rar: D.RARITY[3] });
      loot.push(`a treasure chest (${fmt(cc)} coins, ${itemName(gem).toLowerCase()}${gi ? ', ' + itemName(gi).toLowerCase() : ''})`);
      continue;
    }
    DQ.grant(id, n); drops.push({ id, n, rar }); loot.push(`${n > 1 ? n + ' ' : ''}${itemName(id).toLowerCase()}`);
  }
  if (extraCoins) DQ.addCoins(extraCoins);
  if (!DQ.sim.on) DQ.emit('loot', m, drops, c);
  if (!DQ.sim.on) { DQ.log(`You defeat ${m.boss ? '' : 'the '}${m.name}.${loot.length ? ' ' + loot.join(', ') : ''}`, 'good'); DQ.floatAt(document.getElementById('av-foe'), loot.slice(0, 2).join(' · ') || 'Defeated', '#f3d58a'); DQ.emit('slain'); }
  else DQ.sim.kills++;
  DQ.qev('kill', m.id); DQ.recordKill(m, got);
  /* World Life hooks (hidden recipes, towers, the museum, events): never in forecasts */
  if (!DQ.forecasting) { for (const h of DQ.killHooks || []) h(m); if (DQ.recipeOnKill) DQ.recipeOnKill(m); if (DQ.museumScan && (m.boss || m.mini || (S().beast.kills[m.id] || 0) <= 1)) DQ.museumScan(); }
  if (m.boss) {
    DQ.qev('boss', m.id); DQ.petRoll('boss', m.id);
    if (first) {
      const t = S().towns[m.town] || (S().towns[m.town] = { visited: true, boss: false }); t.boss = true; const next = D.TOWNS[D.TOWN[m.town].idx + 1];
      if (next && !S().towns[next.id]) S().towns[next.id] = { visited: false, boss: false };
      DQ.sfx('boss');
      DQ.notify({ kind: 'boss', key: 'boss:' + m.id, icon: 'skull', col: '#f3d58a', title: `${m.boss.short} is defeated`, text: (next ? `The road to ${next.name} is open.` : 'The realm is safe. For now.') + (D.BOSS_VOICES && D.BOSS_VOICES[m.id] ? ` ${D.BOSS_VOICES[m.id][0]}: “${D.BOSS_VOICES[m.id][1]}”` : ''), action: next ? { label: 'Open the map', fn: () => DQ.go('map') } : null, sound: false, burst: true, ttl: 15000 });
      DQ.log(`${m.name} falls. ${next ? 'The road to ' + next.name + ' opens.' : ''}`, 'quest');
      DQ.achDirty = true; DQ.fxDirty(); DQ.emit('travelunlock');
      /* a first victory ends the fight: no instant rematch at whatever health is left (repeat fights for loot continue) */
      if (!DQ.forecasting) { if (DQ.creatureGainXp) DQ.creatureGainXp(m); DQ.stopAct(true); return; }
    }
  }
  /* a mini-boss: the first victory is recorded and noted, and ends the fight like a boss's */
  if (firstMini) {
    S().minis = S().minis || {}; S().minis[m.id] = true;
    if (!DQ.sim.on && !DQ.forecasting) { DQ.sfx('boss'); DQ.notify({ kind: 'boss', key: 'mini:' + m.id, icon: 'skull', col: '#f3d58a', title: `${m.mini.short} is defeated`, text: m.mini.won || `${D.TOWN[m.town].name} breathes a little easier.`, burst: true }); DQ.log(`${m.name} falls.`, 'quest'); }
    DQ.achDirty = true;
    if (!DQ.forecasting) { if (DQ.creatureGainXp) DQ.creatureGainXp(m); DQ.stopAct(true); return; }
  }
  if (DQ.creatureGainXp) DQ.creatureGainXp(m);
  const next = DQ.nextEncounter && DQ.nextEncounter(m);
  if (next) {
    DQ.act.id = next.id; S().act.id = next.id; f.id = next.id; f.hp = next.hp; if (DQ.act.track) f.tracking = DQ.trackRounds();
    if (!DQ.sim.on) { DQ.log(`You encounter ${/^[AEIOU]/.test(next.name) ? 'an' : 'a'} ${next.name.toLowerCase()}.`); DQ.emit('encounter', next); }
  } else f.hp = m.hp;
  f.round = 0;
  f.heroXp = 0; // Keep the companion cadence across consecutive encounters.
}

/* ---------- Dispatch ---------- */
function complete() {
  const a = DQ.act; if (!a) return;
  const beforeCount = a.count;
  if (a.kind === 'recipe') recipeDone(D.RECIPES[a.id]);
  else if (a.kind === 'alch') alchDone(a.id);
  else if (a.kind === 'fight') combatRound();
  else if (a.kind === 'thieve') thieveDone(D.NODE['thieve:' + a.id]);
  else if (EXT[a.kind]) EXT[a.kind].done(a);
  else gatherDone(a.kind, D.NODE[a.kind + ':' + a.id]);
  if (a.count > beforeCount && DQ.mastTick) DQ.mastTick(a);
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
/* Thieving's purpose (Nov 2026). A trained thief haggles, picks locks and knows where the good stuff is:
   - Silver tongue: every shop sells to you 0.15% cheaper and buys from you 0.2% dearer per Thieving level
     (about 15% off and 20% more at 99);
   - Lockpicking: treasure chests from creatures hold 1% more coins per Thieving level, with a second gem from 30,
     and locked chests found while away can be picked safely (DQ.pickChance);
   - Signature hauls: each target's special item turns up more often the further your level is above the target. */
DQ.thiefLvl = () => DQ.skillUnlocked && DQ.skillUnlocked('thieving') ? DQ.lvl('thieving') : 0;
DQ.buyPrice = id => { const it = D.ITEMS[id]; return it ? Math.max(1, Math.round(it.buy * (1 - .0015 * DQ.thiefLvl()))) : 0; };
DQ.sellPrice = id => { const it = D.ITEMS[id]; return it ? Math.round((it.val || 0) * (1 + .002 * DQ.thiefLvl())) : 0; };
DQ.pickChance = () => clamp(.45 + DQ.thiefLvl() * .01, .45, .97);
DQ.buy = (id, qty = 1) => {
  const it = D.ITEMS[id]; let price = DQ.buyPrice(id) * qty;
  const lock = DQ.lockedSkillFor(id); if (lock) return DQ.toast(`Learn ${D.SK[lock].name} first. ${DQ.skillTeacher(lock)}.`, true);
  if (it.type === 'tool') { if (DQ.have(id)) return DQ.toast('You already own that', true); qty = 1; price = DQ.buyPrice(id); }
  if (S().coins < price) return DQ.toast('Not enough coins', true);
  S().coins -= price; DQ.give(id, qty); S().stats.bought += qty; if (it.type === 'tool') S().stats.tools++;
  DQ.sfx('buy'); DQ.achDirty = true; DQ.emit('shop'); return true;
};
/* Keepsakes (adventure relics and anything marked keepsake) belong to a story and can never be sold, from any screen. */
DQ.sellable = id => { const it = D.ITEMS[id]; return !!it && it.type !== 'relic' && !it.keepsake; };
DQ.KEEPSAKE_NOTE = 'Keepsake · part of an adventure.';
DQ.sell = (id, qty, from) => {
  const it = D.ITEMS[id], store = from === 'pack' ? S().inv : from === 'bank' ? S().bank : null;
  if (!it || !Number.isFinite(qty) || qty <= 0) return;
  if (!DQ.sellable(id)) { if (DQ.toast) DQ.toast(`${it.name} is a keepsake and cannot be sold`, true); return; }
  qty = Math.min(Math.floor(qty), store ? store[id] || 0 : DQ.have(id));
  if (!qty) return;
  if (store) { store[id] -= qty; if (!store[id]) delete store[id]; DQ.invDirty = true; }
  else DQ.take(id, qty);
  const coins = DQ.sellPrice(id) * qty;
  DQ.addCoins(coins); S().stats.sold += qty; DQ.sfx('sell'); DQ.achDirty = true; DQ.emit('shop'); return coins;
};
DQ.junkSale = () => {
  const required = new Set();
  for (const quest of D.QUESTS.filter(q => ['active', 'ready'].includes(DQ.questState(q)))) {
    for (const objective of quest.obj) {
      if (objective.ev === 'deliver') required.add(objective.key);
      for (const task of DQ.questObjectiveTasks?.(objective) || []) {
        if (task.kind === 'recipe') for (const input of Object.keys(D.RECIPES[task.id]?.in || {})) required.add(input);
      }
    }
  }
  const equipped = new Set([...Object.values(S().equip), S().ammo.id]);
  const entries = Object.keys({ ...S().inv, ...S().bank }).filter(id => D.ITEMS[id]?.type === 'junk' && DQ.sellable(id) &&
    !equipped.has(id) && !required.has(id) && !(DQ.bundleNeeds?.(id).length) &&
    !Object.keys(D.PROJECTS || {}).some(project => DQ.projectNeed(project)[id] > 0)).map(id => [id, DQ.have(id)]);
  return { entries, quantity: entries.reduce((sum, [, n]) => sum + n, 0),
    coins: entries.reduce((sum, [id, n]) => sum + n * DQ.sellPrice(id), 0) };
};
DQ.sellJunk = () => DQ.junkSale().entries.reduce((total, [id, n]) => total + (DQ.sell(id, n) || 0), 0);

DQ.buyMax = id => {
  const item = D.ITEMS[id];
  if (!item || !Number.isFinite(item.buy) || item.buy <= 0 || DQ.shopBuyLock(id)) return 0;
  const materials = Object.entries(DQ.shopMaterialCost?.(id) || {}).map(([key, n]) => Math.floor(DQ.have(key) / n));
  // Normal stacks can overflow to the bank. Explicit item limits still bound the purchase.
  const cap = Number.isFinite(item.stackLimit) ? Math.max(0, item.stackLimit - DQ.have(id)) : Number.MAX_SAFE_INTEGER;
  return Math.max(0, Math.min(cap, item.type === 'tool' ? DQ.have(id) ? 0 : 1 : cap,
    Math.floor(S().coins / DQ.buyPrice(id)), ...materials));
};
DQ.shopBuyLock = id => {
  const item = D.ITEMS[id], locked = DQ.lockedSkillFor(id);
  if (!item) return 'Unavailable';
  if (locked) return `Learn ${D.SK[locked].name}`;
  if (item.slot && item.slot !== 'ammo') {
    const requirement = Object.entries(item.req || {}).find(([skill, level]) => D.SK[skill] && DQ.lvl(skill) < level);
    if (requirement) return `${D.SK[requirement[0]].name} ${requirement[1]}`;
  }
  return '';
};


/* ---------- Offline and catch-up simulation ---------- */
/* Count one elapsed budget at the live rate, up to the published cap. */
DQ.OFFLINE_CAP = OFFLINE_CAP;
DQ.offlineEff = gap => Math.round(Math.min(Math.max(0, gap), OFFLINE_CAP));
DQ.offlinePolicy = () => `Up to ${OFFLINE_CAP / 3600000} hours at full speed while away.`;
const activitySummary = a => {
  const key = a.kind + ':' + (a.area || a.id);
  if (!DQ.sim.activities[key]) {
    DQ.sim.activities[key] = { label: DQ.actLabel(a), worked: 0, xp: {}, levels: {}, items: {} };
  }
  return DQ.sim.activities[key];
};
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
    const card = DQ.sim.on && DQ.sim.activities && a ? activitySummary(a) : null;
    if (DQ.sim.on && DQ.sim.activities) DQ.sim.elapsed += step;
    if (card) card.worked += worked;
    DQ.advanceWorld(step);
    realLeft = Math.max(0, realLeft - step);
    effectiveLeft = Math.max(0, effectiveLeft - worked);
    if (a && DQ.act === a && progress + .001 >= duration) {
      a.dur = duration;
      if (card) DQ.sim.activeSummary = card;
      try { complete(); } finally { if (card) DQ.sim.activeSummary = null; }
      actions++;
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
DQ.simulate = (ms, real = ms, { report = false } = {}) => {
  const sim = DQ.sim = { on: true, xp: {}, items: {}, coins: 0, kills: 0, levels: [], notes: [], adv: null, ms, real, advFrom: DQ.advLvl(), eaten: 0, died: false, label: DQ.act ? DQ.actLabel() : '' };
  if (report) { sim.activities = {}; sim.elapsed = 0; }
  try {
    const partial = DQ.act ? DQ.act.progress || 0 : 0;
    sim.actions = DQ.advanceTime(ms, real, partial);
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
  if (!DQ.forecasting && !report) setTimeout(() => keep.forEach((n, i) => setTimeout(() => DQ.notify(Object.assign({}, n, { burst: false })), i * 700)), 900);
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
    const sum = DQ.simulate(eff, real, { report: gap > 30000 }); DQ.makeAwayEvents(sum, gap); if (gap > 30000) DQ.emit('welcome', sum, gap); return;
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
      if (k === 'recipe') ok = !!D.RECIPES[s.id]; else if (k === 'alch') ok = !!D.ITEMS[s.id]; else if (k === 'fight') ok = !!D.MON[s.id] && D.MON[s.id].town === S().town && (!DQ.isAnimal?.(s.id) || DQ.questWantsAnimal(s.id)); else if (EXT[k]) ok = !EXT[k].check(s.id); else ok = !!D.NODE[k + ':' + s.id] && DQ.nodeHere(D.NODE[k + ':' + s.id]);
      if (ok) { DQ.act = { kind: k, id: s.id, area: s.area || null, target: s.target || null, questTarget: !!s.questTarget, track: !!s.track, t0: Date.now(), pace: s.pace || 'steady', rule: s.rule || 'none', count: s.count || 0, limit: s.limit || 0, elapsed: s.elapsed || 0, lvlTarget: s.lvlTarget || 0, progress: s.progress || 0 }; DQ.act.dur = DQ.actDur(DQ.act); DQ.act.t0 -= DQ.act.progress; if (k === 'fight') DQ.fight = { id: s.id, hp: D.MON[s.id].hp, round: 0, mt: 0, ma: 0, pa: 0, phase: 0, tracking: s.track ? DQ.trackRounds() : 0 }; }
    } catch (e) {}
    if (!DQ.act) S().act = null;
  }
  lastTick = Date.now();
};
DQ.startLoop = () => { lastTick = Date.now(); setInterval(DQ.tick, 100); addEventListener('pagehide', DQ.save); document.addEventListener('visibilitychange', () => { if (document.hidden) DQ.save(); }); };
D.FISH_IDS = D.NODES.fish.map(n => n.id);
})();
