/* Idlewick: player state, saving and derived stats. */
(() => {
const DQ = window.DQ, D = DQ.data, { clamp } = DQ;
const SAVE_KEY = 'dashboard-quest-save-v2';
// Steam desktop supplies durable, account-scoped files through a narrow bridge.
// Browser builds retain their existing save key and localStorage behavior.
const store = DQ.storage = window.idlewickDesktop?.storage || {
  getItem:key=>localStorage.getItem(key),
  setItem:(key,value)=>localStorage.setItem(key,value),
  removeItem:key=>localStorage.removeItem(key)
};
const PACK_SLOTS = 40;
DQ.PACK_SLOTS = PACK_SLOTS;
DQ.SLOTS = ['head', 'body', 'legs', 'weapon', 'shield', 'ring', 'amulet', 'ammo'];
DQ.SLOT_NAMES = { head: 'Head', body: 'Body', legs: 'Legs', weapon: 'Weapon', shield: 'Shield', ring: 'Ring', amulet: 'Amulet', ammo: 'Ammo' };
DQ.invDirty = false;

DQ.newState = (name = 'Adventurer', look) => {
  const xp = {}; D.SKILLS.forEach(s => xp[s.id] = 0); xp.hitpoints = D.XPF[10];
  return {
    journey: 'boss', projects: {}, pinnedProject: null, noticeBadges: {},
    v: 2, name, look: look || { skin: D.LOOKS.skin[0], hair: D.LOOKS.hair[1], tunic: D.LOOKS.tunic[0], face: 'bright' },
    created: Date.now(), lastSeen: Date.now(), playtime: 0, awayMs: 0, awayEff: 0, tele: { adv: {}, skill: {}, first: {}, away: [], sessions: 0 }, seenTabs: {}, disc: {}, lastAway: null, exportedAt: 0, snoozeBk: 0, title: null, research: { done: {}, active: [] },
    xp, coins: 25, hp: 10, inv: { bread: 5 }, bank: {}, equip: { weapon: 'bronze_sword' }, ammo: { id: null, n: 0 },
    town: 'willowbrook', towns: { willowbrook: { visited: true, boss: false } },
    q: {}, ach: {}, seen: {}, unlocked: {},
    stats: { harvest: 0, collect: 0, pets: 0, furnish: 0, hired: 0, catch: 0, chop: 0, mine: 0, thieve: 0, cook: 0, burn: 0, smelt: 0, smith: 0, craft: 0, alch: 0, brew: 0, enchant: 0, kill: 0, earned: 0, deaths: 0, bought: 0, sold: 0, equipped: 0, tools: 0, rare: 0 },
    settings: { masterVol: 1, ambience: true, ambVol: .45, theme: 'dark', snd: { ui: true, combat: true, rewards: true }, haptics: true, dev: false, sfx: true, music: true, muted: false, vol: .7, musicVol: .4, taskSounds: 'varied', notify: true, reduceFx: false, autoEat: true, eatAt: 50, tips: true },
    style: { melee: 'aggressive', ranged: 'offense', magic: 'offense' }, spell: 'spark',
    act: null, log: [], tut: { done: {}, hidden: false },
    gameTime: 0, farm: { plots: [{ crop: null }, { crop: null }, { crop: null }], plotsBought: 3, animals: [], pensBought: 2, feed: 0, autoReplant: true, last: 'potato', next: null },
    pets: { owned: {}, active: null }, hunt: { area: null, target: null, encounters: 0 }, enchants: {}, house: { owned: false, rooms: {}, furn: {} }, workers: [], hire: { cands: [], at: -1e9 }, beast: { kills: {}, drops: {} },
  };
};
DQ.S = DQ.newState();

const merge = (base, over) => {
  if (!over || typeof over !== 'object') return base;
  for (const k of Object.keys(over)) {
    if (['__proto__', 'constructor', 'prototype'].includes(k)) throw new Error('Invalid save key');
    if (base[k] && typeof base[k] === 'object' && !Array.isArray(base[k]) && typeof over[k] === 'object' && over[k] !== null) merge(base[k], over[k]);
    else base[k] = over[k];
  }
  return base;
};
const record = value => value && typeof value === 'object' && !Array.isArray(value);
function candidateState(o) {
  if (!record(o) || o.v !== 2 || !record(o.xp)) throw new Error('Unsupported save');
  const base = DQ.newState(); base.equip = {}; base.inv = {};
  function checkShape(value, expected) {
    if (record(expected)) {
      if (!record(value)) throw new Error('Invalid save structure');
      for (const key of Object.keys(value)) {
        if (['__proto__', 'constructor', 'prototype'].includes(key)) throw new Error('Invalid save key');
        if (key in expected && expected[key] !== null) checkShape(value[key], expected[key]);
      }
    } else if (Array.isArray(expected) && !Array.isArray(value)) throw new Error('Invalid save list');
    else if (typeof expected === 'number' && (!Number.isFinite(value) || (expected >= 0 && value < 0))) throw new Error('Invalid save number');
    else if (typeof expected === 'string' && typeof value !== 'string') throw new Error('Invalid save text');
    else if (typeof expected === 'boolean' && typeof value !== 'boolean') throw new Error('Invalid save option');
  }
  checkShape(o, base);
  for (const [values, definitions] of [[o.xp, D.SK], [o.inv || {}, D.ITEMS], [o.bank || {}, D.ITEMS]]) {
    for (const [id, n] of Object.entries(values)) {
      if (!(id in definitions)) throw new Error('Unknown item or skill');
      if (!Number.isFinite(n) || n < 0) throw new Error('Invalid quantity');
    }
  }
  const result = merge(base, o);
  if (!Object.prototype.hasOwnProperty.call(o.xp,'research') && DQ.researchXp) {
    result.xp.research = Object.keys(result.research.done).reduce((sum,id)=>sum+(result.research.done[id]&&D.TECH[id]?DQ.researchXp(D.TECH[id]):0),0);
  }
  /* A pin is only a display preference: any defined project (village, regional or relic) is kept; an unknown or obsolete
     one is cleared rather than rejecting an otherwise valid hero. Saves rejected by the old well/inn-only rule now load. */
  if (result.pinnedProject !== null && !(typeof result.pinnedProject === 'string' && Object.prototype.hasOwnProperty.call(D.PROJECTS || {}, result.pinnedProject))) result.pinnedProject = null;
  if (!D.TOWN[result.town]) throw new Error('Unknown town');
  if (Object.values(result.equip).some(id => id && !D.ITEMS[id])) throw new Error('Unknown equipment');
  if (result.workers.some(w => !record(w)) || result.farm.animals.some(a => !record(a) || !D.ANIMAL[a.id])) throw new Error('Invalid worker or animal');
  if (result.farm.plots.some(p => !record(p) || (p.crop && !D.CROP[p.crop]))) throw new Error('Invalid plot');
  if (result.log.some(l => !record(l) || typeof l.m !== 'string')) throw new Error('Invalid log');
  for (const key of ['queue', 'buffs', 'abilities', 'inbox']) {
    if (result[key] !== undefined && !Array.isArray(result[key])) throw new Error('Invalid save list');
  }
  const validAction = a => {
    if (!record(a)) return false;
    const known = a.kind === 'recipe' ? D.RECIPES[a.id] : a.kind === 'fight' ? D.MON[a.id] : a.kind === 'alch' ? D.ITEMS[a.id] : D.NODE[a.kind + ':' + a.id];
    return !!known && (!a.pace || !!D.PACE[a.pace]) && ['count', 'elapsed', 'progress', 'lvlTarget'].every(k => a[k] === undefined || (Number.isFinite(a[k]) && a[k] >= 0));
  };
  if (result.act && !validAction(result.act)) throw new Error('Invalid active task');
  if (result.queue && result.queue.some(a => !validAction(a))) throw new Error('Invalid queue');
  if (result.buffs && result.buffs.some(b => !record(b) || !Number.isFinite(b.until) || !Number.isFinite(b.mult) || b.mult <= 0)) throw new Error('Invalid buff');
  migrate(result);
  return result;
}
DQ.validateSave = candidateState;
DQ.hasSave = () => { try { return !!store.getItem(SAVE_KEY); } catch (e) { return false; } };
DQ.load = () => {
  try {
    const raw = store.getItem(SAVE_KEY); if (!raw) return false;
    const next = candidateState(JSON.parse(raw));
    DQ.S = next; observedSave = raw; return true;
  } catch (e) { DQ.saveHealth = 'The saved hero could not be loaded. Keep a copy before starting again.'; return false; }
};
function migrate(S) {
  /* Mossbarrow was added between Willowbrook and Saltmere: keep later roads open for older saves */
  const ids = D.TOWNS.map(t => t.id); let last = -1; ids.forEach((id, i) => { if (S.towns[id]) last = i; });
  for (let i = 0; i < last; i++) if (!S.towns[ids[i]]) S.towns[ids[i]] = { visited: false, boss: false };
  if (!Array.isArray(S.farm.plots)) S.farm.plots = [];
}
DQ.saveHealth = '';
let observedSave;
try { observedSave = store.getItem(SAVE_KEY); } catch (e) {}
DQ.save = () => {
  if (DQ.forecasting) return false; // Trial progression must never reach the real save.
  try {
    const current = store.getItem(SAVE_KEY);
    if (observedSave !== undefined && current !== observedSave) {
      DQ.paused = true;
      DQ.saveHealth = 'Another tab changed this hero. This tab is paused. Export a backup, then reload to continue the latest save.';
      return false;
    }
    const next = JSON.stringify({ ...DQ.S, lastSeen: Date.now() });
    store.setItem(SAVE_KEY, next);
    observedSave = next; DQ.S.lastSeen = JSON.parse(next).lastSeen; DQ.saveHealth = '';
    return true;
  } catch (e) {
    DQ.saveHealth = 'Progress could not be saved on this device. Download a backup before closing.';
    return false;
  }
};
window.idlewickDesktop?.onBeforeClose?.(() => !DQ.started || DQ.save());
DQ.eraseSave = () => { try { store.removeItem(SAVE_KEY); observedSave = null; } catch (e) {} };
DQ.exportSave = () => btoa(unescape(encodeURIComponent(JSON.stringify(DQ.S))));
DQ.importSave = text => {
  try {
    const next = candidateState(JSON.parse(decodeURIComponent(escape(atob(text.trim())))));
    const current = store.getItem(SAVE_KEY);
    if (observedSave !== undefined && current !== observedSave) return false;
    const raw = JSON.stringify({ ...next, lastSeen: Date.now() });
    store.setItem(SAVE_KEY, raw);
    observedSave = raw; DQ.S = next; DQ.S.lastSeen = JSON.parse(raw).lastSeen; DQ.saveHealth = ''; return true;
  } catch (e) { return false; }
};
addEventListener('storage', e => {
  if (window.idlewickDesktop) return;
  if (e.key === SAVE_KEY && e.newValue !== observedSave) {
    DQ.paused = true;
    DQ.saveHealth = 'Another tab changed this hero. Export a backup from this tab, then reload to continue the latest save.';
  }
});

/* ---------- Levels ---------- */
DQ.lvl = sk => D.lvlOf(DQ.S.xp[sk] || 0);
DQ.maxLvl = () => Math.max(...D.SKILLS.map(s => DQ.lvl(s.id)));
DQ.totalLvl = () => D.SKILLS.reduce((a, s) => a + DQ.lvl(s.id), 0);
DQ.totalXp = () => D.SKILLS.reduce((a, s) => a + (DQ.S.xp[s.id] || 0), 0) - D.XPF[10];
DQ.advLvl = () => { const t = DQ.totalXp(); let l = 1; while (l < 99 && t >= D.advReq(l + 1)) l++; return l; };
DQ.advProgress = () => {
  const l = DQ.advLvl(), t = DQ.totalXp(); if (l >= 99) return { pct: 100, cur: t, next: t, need: 0 };
  const a = D.advReq(l), b = D.advReq(l + 1);
  return { pct: clamp((t - a) / (b - a) * 100, 0, 100), cur: t - a, next: b - a, need: b - t };
};
const COMBAT_SKILLS = new Set(['attack', 'strength', 'defence', 'hitpoints', 'ranged', 'magic']);
DQ.xpMult = sk => (1 + .005 * (DQ.lvl(sk) - 1)) * (1 + .0025 * (DQ.advLvl() - 1)) * (COMBAT_SKILLS.has(sk) ? 1 + DQ.combatCatchUp() : 1) * (DQ.extraXp ? DQ.extraXp(sk) : 1) * (DQ.buffMult ? DQ.buffMult('xp') : 1);
DQ.actionProgress = sk => Object.entries(D.SK[sk]?.actionReq || {}).map(([stat,need])=>({stat,need,have:DQ.S.stats[stat]||0}));
DQ.skillUnlocked = sk => { const s=D.SK[sk]; if(!s)return false; if(s.actionReq)return !!DQ.S.unlocked[sk]||DQ.actionProgress(sk).every(r=>r.have>=r.need); return s.quest?!!DQ.S.unlocked[sk]:s.unlock<=DQ.advLvl(); };
const actionNames={kill:'combat victories',catch:'fish caught',chop:'logs chopped',harvest:'crops harvested',craft:'items crafted',smith:'smithing actions'};
DQ.unlockHow = sk => { const s=D.SK[sk]; if(s.actionReq)return DQ.actionProgress(sk).map(r=>`${Math.min(r.have,r.need)}/${r.need} ${actionNames[r.stat]||r.stat}`).join(' and '); return s.quest?`Complete the main quest “${s.questName}”`:`Reach Hero level ${s.unlock}`; };
DQ.maxHp = () => DQ.lvl('hitpoints');
DQ.combatLvl = () => {
  const L = DQ.lvl, base = .25 * (L('defence') + L('hitpoints'));
  const m = .325 * (L('attack') + L('strength')), r = .325 * Math.floor(1.5 * L('ranged')), g = .325 * Math.floor(1.5 * L('magic'));
  return Math.floor(base + Math.max(m, r, g));
};
/* Progress towards the next combat level: the formula evaluated with fractional skill levels, plus the cheapest single-skill route. */
const combatFrom = L => { const base = .25 * (L.defence + L.hitpoints); return base + Math.max(.325 * (L.attack + L.strength), .325 * Math.floor(1.5 * L.ranged), .325 * Math.floor(1.5 * L.magic)); };
DQ.combatProgress = () => {
  const ids = ['attack', 'strength', 'defence', 'hitpoints', 'ranged', 'magic'], L = {}, F = {};
  ids.forEach(k => { L[k] = DQ.lvl(k); F[k] = L[k] + (L[k] >= 99 ? 0 : DQ.pctNext(k) / 100); });
  const lvl = DQ.combatLvl(), next = lvl + 1, cont = Math.max(lvl, combatFrom(F)), pct = lvl >= 126 ? 100 : Math.min(99, Math.max(0, (cont - lvl) * 100));
  const routes = ids.filter(k => DQ.skillUnlocked(k)).map(k => { const T = { ...L }; while (T[k] < 99 && Math.floor(combatFrom(T)) < next) T[k]++; return Math.floor(combatFrom(T)) >= next ? { skill: k, xp: Math.max(0, D.XPF[T[k]] - DQ.S.xp[k]) } : null; }).filter(Boolean).sort((a, b) => a.xp - b.xp);
  return { lvl, next, pct, best: routes[0] || null, routes };
};
/* Catch-up: while your combat level trails your Hero level, combat skills learn faster (+15% per level behind, up to +200%). */
/* fractional combat level (skills' progress counted), so the catch-up bonus eases off smoothly instead of in steps */
DQ.combatExact = () => { const L = {}; ['attack', 'strength', 'defence', 'hitpoints', 'ranged', 'magic'].forEach(k => { L[k] = DQ.lvl(k) + (DQ.lvl(k) >= 99 ? 0 : DQ.pctNext(k) / 100); }); return combatFrom(L); };
DQ.combatCatchUp = () => Math.min(2, .15 * Math.max(0, DQ.advLvl() - DQ.combatExact()));
/* the permanent XP bonus (skill and Hero levels, buffs), shown on skill chips; catch-up is shown on its own */
DQ.xpBonusBase = sk => DQ.xpMult(sk) / (COMBAT_SKILLS.has(sk) ? 1 + DQ.combatCatchUp() : 1);
DQ.pctNext = sk => { const l = DQ.lvl(sk); if (l >= 99) return 100; const a = D.XPF[l], b = D.XPF[l + 1]; return clamp((DQ.S.xp[sk] - a) / (b - a) * 100, 0, 100); };

/* ---------- Items ---------- */
DQ.pack = id => DQ.S.inv[id] || 0;
DQ.have = id => (DQ.S.inv[id] || 0) + (DQ.S.bank[id] || 0);
DQ.packSlots = () => Object.keys(DQ.S.inv).length;
DQ.give = (id, n = 1) => {
  const S = DQ.S; if (n <= 0) return;
  if (S.inv[id]) S.inv[id] += n;
  else if (DQ.packSlots() < DQ.packMax()) S.inv[id] = n;
  else { S.bank[id] = (S.bank[id] || 0) + n; DQ.emit('overflow', id); }
  DQ.invDirty = true;
};
DQ.take = (id, n = 1) => {
  const S = DQ.S; if (DQ.have(id) < n) return false;
  const fromPack = Math.min(n, S.inv[id] || 0);
  if (fromPack) { S.inv[id] -= fromPack; if (!S.inv[id]) delete S.inv[id]; }
  const rest = n - fromPack;
  if (rest) { S.bank[id] -= rest; if (!S.bank[id]) delete S.bank[id]; }
  DQ.invDirty = true; return true;
};
DQ.deposit = (id, n) => { const S = DQ.S; n = Math.min(n, S.inv[id] || 0); if (!n) return; S.inv[id] -= n; if (!S.inv[id]) delete S.inv[id]; S.bank[id] = (S.bank[id] || 0) + n; DQ.invDirty = true; };
DQ.withdraw = (id, n) => {
  const S = DQ.S; n = Math.min(n, S.bank[id] || 0); if (!n) return 0;
  if (!S.inv[id] && DQ.packSlots() >= DQ.packMax()) return -1;
  S.bank[id] -= n; if (!S.bank[id]) delete S.bank[id]; S.inv[id] = (S.inv[id] || 0) + n; DQ.invDirty = true; return n;
};

/* ---------- Equipment ---------- */
DQ.canEquip = id => {
  const it = D.ITEMS[id]; if (!it || !it.slot) return { ok: false, why: 'Cannot be worn' };
  if (it.slot !== 'ammo' && DQ.S.equip[it.slot] === id) return { ok: false, equipped: true, why: 'Already equipped. This is a spare copy.' };
  for (const [sk, l] of Object.entries(it.req || {})) {
    if (!DQ.skillUnlocked(sk)) return { ok: false, why: `${D.SK[sk].name} is locked. ${DQ.unlockHow(sk)}.` };
    if (DQ.lvl(sk) < l) return { ok: false, why: `Requires ${D.SK[sk].name} ${l}` };
  }
  return { ok: true };
};
DQ.equipItem = id => {
  const S = DQ.S, it = D.ITEMS[id], c = DQ.canEquip(id); if (!c.ok) return c;
  if (it.slot === 'ammo') {
    const n = DQ.have(id); if (!n) return { ok: false, why: 'None left' };
    if (S.ammo.id && S.ammo.id !== id) DQ.give(S.ammo.id, S.ammo.n);
    const take = S.ammo.id === id ? 0 : n;
    if (take) { DQ.take(id, take); S.ammo = { id, n: take }; } else { const more = DQ.have(id); DQ.take(id, more); S.ammo.n += more; }
    S.equip.ammo = id; DQ.invDirty = true; S.stats.equipped++; return { ok: true };
  }
  if (!DQ.take(id, 1)) return { ok: false, why: 'You do not have that' };
  const old = S.equip[it.slot]; if (old) DQ.give(old, 1);
  S.equip[it.slot] = id; S.stats.equipped++; DQ.invDirty = true; return { ok: true };
};
DQ.unequip = slot => {
  const S = DQ.S;
  if (slot === 'ammo') { if (S.ammo.id && S.ammo.n) DQ.give(S.ammo.id, S.ammo.n); S.ammo = { id: null, n: 0 }; delete S.equip.ammo; DQ.invDirty = true; return true; }
  const id = S.equip[slot]; if (!id) return false;
  delete S.equip[slot]; DQ.give(id, 1); DQ.invDirty = true; return true;
};
DQ.bonus = () => {
  const out = { atk: 0, str: 0, def: 0, rng: 0, rngStr: 0, mag: 0 };
  const add = id => { const b = D.ITEMS[id] && D.ITEMS[id].b; if (b) for (const k in b) out[k] += b[k]; };
  Object.entries(DQ.S.equip).forEach(([slot, id]) => { if (slot !== 'ammo') add(id); });
  if (DQ.S.ammo.id && DQ.S.ammo.n > 0) add(DQ.S.ammo.id);
  return out;
};
DQ.weaponStyle = () => { const w = D.ITEMS[DQ.S.equip.weapon]; return (w && w.style) || 'melee'; };

/* ---------- Tools and perks ---------- */
DQ.toolKey = sk => { const t = D.TOOLS.find(t => t[1] === sk); return t && t[0]; };
DQ.toolTier = sk => { const k = DQ.toolKey(sk); if (!k) return 0; for (let t = 5; t >= 1; t--) if (DQ.have(`tool_${k}_${t}`)) return t; return 0; };
DQ.perkSpeed = sk => { const l = DQ.lvl(sk); return D.PERKS.reduce((a, p) => a + (p.speed && l >= p.lvl ? p.speed : 0), 0); };
DQ.speedMult = sk => clamp(1 - D.TOOL_SPEED[DQ.toolTier(sk)] - DQ.perkSpeed(sk) - (DQ.extraSpeed ? DQ.extraSpeed(sk) : 0), .3, 1);
DQ.dblChance = sk => (DQ.lvl(sk) >= 99 ? .1 : 0) + ((DQ.fx && DQ.fx().dbl) || 0);
})();
