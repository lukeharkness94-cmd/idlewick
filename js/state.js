/* Idlewick: player state, saving and derived stats. */
(() => {
const DQ = window.DQ, D = DQ.data, { clamp } = DQ;
const SAVE_KEY = 'dashboard-quest-save-v2';
const RECOVERY_KEY = SAVE_KEY + '-previous';
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

DQ.newState = (name = 'Adventurer', look, starter = 'sword') => {
  const kit=D.STARTER_KITS?.[starter]||{weapon:'bronze_sword'};
  const xp = {}; D.SKILLS.forEach(s => xp[s.id] = 0); xp.hitpoints = D.XPF[10];
  return {
    restorationVersion: 1, legacyRestoration: {},
    journey: 'boss', projects: {}, projectGiven: {}, minis: {}, pinnedProject: null, noticeBadges: {},
    v: 2, name, look: look || { skin: D.LOOKS.skin[0], hair: D.LOOKS.hair[1], tunic: D.LOOKS.tunic[0], face: 'bright' },
    created: Date.now(), lastSeen: Date.now(), playtime: 0, awayMs: 0, awayEff: 0, tele: { adv: {}, skill: {}, first: {}, away: [], sessions: 0 }, seenTabs: {}, disc: {}, lastAway: null, exportedAt: 0, snoozeBk: 0, title: null, research: { done: {}, active: [] },
    xp, coins: 25, hp: 10, inv: { bread: 5, ...(kit.runes?{rune:kit.runes}:{}) }, bank: {}, equip: { weapon: kit.weapon, ...(kit.ammo?{ammo:kit.ammo}:{}) }, ammo: { id: kit.ammo||null, n: kit.quantity||0 },
    town: 'willowbrook', towns: { willowbrook: { visited: true, boss: false } },
    q: {}, ach: {}, seen: {}, unlocked: {}, toolUpgrades: {}, skillUpgrades: {},
    unlockRules: 2,
    stats: { carve: 0, voyage: 0, train: 0, harvest: 0, collect: 0, pets: 0, furnish: 0, hired: 0, catch: 0, chop: 0, mine: 0, thieve: 0, cook: 0, burn: 0, smelt: 0, smith: 0, craft: 0, alch: 0, brew: 0, enchant: 0, kill: 0, earned: 0, deaths: 0, bought: 0, sold: 0, equipped: 0, tools: 0, rare: 0 },
    settings: { masterVol: 1, ambience: true, ambVol: .45, theme: 'light', lettering: 'hearthside', snd: { ui: true, combat: true, rewards: true }, haptics: true, dev: false, sfx: true, music: true, muted: false, vol: .7, musicVol: .4, taskSounds: 'varied', notify: true, unlockReveals: undefined, digest: { loot: true, levels: true, discoveries: true, achievements: true, folk: true }, storyScenes: true, reduceFx: false, autoEat: true, eatAt: 50, tips: true },
    style: { melee: 'aggressive', ranged: 'offense', magic: 'offense' }, spell: 'spark',
    act: null, log: [], tut: { done: {}, hidden: false },
    gameTime: 0, farm: { plots: [{ crop: null }, { crop: null }, { crop: null }], plotsBought: 3, animals: [], pensBought: 2, feed: 0, autoReplant: true, last: 'potato', next: null },
    pets: { owned: {}, active: null, tracks: {}, events: [], expedition: null, bondVersion: 1 }, hunt: { area: null, target: null, encounters: 0, fieldFocus: null, loopVersion: 1, legacyFieldLevel: 0 }, enchants: {}, house: { owned: false, rooms: {}, furn: {}, wall: [] }, workers: [], hire: { cands: [], at: -1e9 }, beast: { kills: {}, drops: {} },
  };
};
{ let cur = DQ.newState(); Object.defineProperty(DQ, 'S', { get: () => cur, set: v => { cur = v; if (DQ.xpAliases) DQ.xpAliases(v); }, configurable: true, enumerable: true }); }

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
function migrateQuarryIds(state) {
  const names = { wild_goat: 'hill_goat', wild_turkey: 'turkey' };
  const rename = id => Object.hasOwn(names, id) ? names[id] : id;
  const migrateAction = action => {
    if (!record(action) || !['hunt', 'fight'].includes(action.kind)) return action;
    const id = rename(action.id), target = rename(action.target);
    return { ...action, id, ...(target !== undefined ? { target } : {}) };
  };
  state.act = migrateAction(state.act);
  state.lastAct = migrateAction(state.lastAct);
  if (state.queue) state.queue = state.queue.map(migrateAction);
  if (state.hunt.target) state.hunt.target = rename(state.hunt.target);
  for (const [oldId, newId] of Object.entries(names)) {
    for (const key of ['kills', 'weakWins', 'answered']) {
      const counts = state.beast[key];
      if (!record(counts) || !Object.hasOwn(counts, oldId)) continue;
      const data = state.beast[key] = { ...counts };
      data[newId] = (data[newId] || 0) + data[oldId];
      delete data[oldId];
    }
    for (const key of Object.keys(state.beast.drops)) {
      if (!key.startsWith(oldId + ':')) continue;
      const target = newId + key.slice(oldId.length);
      state.beast.drops[target] ||= state.beast.drops[key];
      delete state.beast.drops[key];
    }
    if (state.title === 'beast:' + oldId) state.title = 'beast:' + newId;
  }
}
function candidateState(o) {
  if (DQ.prepareBeastSave) o = DQ.prepareBeastSave(o);
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
  const daily = result.dailyErrands;
  if (daily && (!Number.isSafeInteger(daily.day) || daily.day < 0 || !Array.isArray(daily.rows) || daily.rows.length !== 3 ||
    new Set(daily.rows.map(row => row?.event)).size !== 3 ||
    daily.rows.some(row => !record(row) || !['catch', 'chop', 'cook', 'mine', 'kill'].includes(row.event) ||
      !Number.isSafeInteger(row.have) || row.have < 0 || row.have > 8 || typeof row.paid !== 'boolean'))) delete result.dailyErrands;
  if (!Object.prototype.hasOwnProperty.call(o.xp,'research') && DQ.researchXp) {
    result.xp.research = Object.keys(result.research.done).reduce((sum,id)=>sum+(result.research.done[id]&&D.TECH[id]?DQ.researchXp(D.TECH[id]):0),0);
  }
  /* A pin is only a display preference: any defined project (village, regional or relic) is kept; an unknown or obsolete
     one is cleared rather than rejecting an otherwise valid hero. Saves rejected by the old well/inn-only rule now load. */
  if (result.pinnedProject !== null && !(typeof result.pinnedProject === 'string' && Object.prototype.hasOwnProperty.call(D.PROJECTS || {}, result.pinnedProject))) result.pinnedProject = null;
  /* partial deliveries to projects: unknown projects or items are dropped, quantities must be whole and non-negative */
  if (!result.projectGiven || typeof result.projectGiven !== 'object' || Array.isArray(result.projectGiven)) result.projectGiven = {};
  for (const [id, before, after, oldCap, newCap] of [['market', 'crop_potato', 'flax', 15, 6], ['jetty', 'plank_oak', 'log_normal', 40, 16], ['jetty', 'log_oak', 'log_normal', 40, 16]]) {
    const delivery = result.projectGiven[id];
    if (delivery && Number.isFinite(delivery[before]) && delivery[before] > 0) {
      delivery[after] = (Number.isFinite(delivery[after]) ? delivery[after] : 0) +
        Math.ceil(Math.min(delivery[before], oldCap) / oldCap * newCap);
      delete delivery[before];
    }
  }
  for (const [pid, g] of Object.entries(result.projectGiven)) { const pj = (D.PROJECTS || {})[pid];
    if (!pj || !g || typeof g !== 'object' || result.projects[pid]) { delete result.projectGiven[pid]; continue; }
    for (const [k, n] of Object.entries(g)) { if (!(k in pj.cost) && k.startsWith('log_') && ('plank_' + k.slice(4)) in pj.cost && Number.isFinite(n)) { g['plank_' + k.slice(4)] = (g['plank_' + k.slice(4)] || 0) + n; delete g[k]; continue; }
      if (!(k in pj.cost) || !Number.isFinite(n) || n < 0) delete g[k]; else g[k] = Math.min(Math.floor(n), pj.cost[k]); }
    for (const [k, n] of Object.entries(g)) if (k in pj.cost) g[k] = Math.min(Math.floor(n), pj.cost[k]); }
  if (!D.TOWN[result.town]) throw new Error('Unknown town');
  if (Object.values(result.equip).some(id => id && !D.ITEMS[id])) throw new Error('Unknown equipment');
  if (result.workers.some(w => !record(w)) || result.farm.animals.some(a => !record(a) || !D.ANIMAL[a.id])) throw new Error('Invalid worker or animal');
  if (result.farm.plots.some(p => !record(p) || (p.crop && !D.CROP[p.crop]))) throw new Error('Invalid plot');
  if (result.log.some(l => !record(l) || typeof l.m !== 'string')) throw new Error('Invalid log');
  for (const key of ['queue', 'buffs', 'abilities', 'inbox']) {
    if (result[key] !== undefined && !Array.isArray(result[key])) throw new Error('Invalid save list');
  }
  migrateQuarryIds(result);
  const validAction = a => {
    if (!record(a)) return false;
    const known = a.kind === 'recipe' ? D.RECIPES[a.id] : a.kind === 'fight' ? D.MON[a.id] : a.kind === 'alch' ? D.ITEMS[a.id] : a.kind === 'sail' ? D.VOYAGE?.[a.id] : a.kind === 'train' ? (D.PET[a.id] || (String(a.id).startsWith('lure:') && D.TOWN[String(a.id).slice(5)])) : DQ.KIND_EXT?.[a.kind]?.valid?.(a.id) || D.NODE[a.kind + ':' + a.id];
    return !!known && (!a.pace || !!D.PACE[a.pace]) && ['count', 'elapsed', 'progress', 'lvlTarget'].every(k => a[k] === undefined || (Number.isFinite(a[k]) && a[k] >= 0));
  };
  if(result.farm?.plots?.some(p=>p.nextCrop!=null&&!D.CROP[p.nextCrop]))throw new Error('Invalid plot planting plan');
  if (result.act && !validAction(result.act)) throw new Error('Invalid active task');
  if (result.queue && result.queue.some(a => !validAction(a))) throw new Error('Invalid queue');
  if (result.buffs && result.buffs.some(b => !record(b) || !Number.isFinite(b.until) || !Number.isFinite(b.mult) || b.mult <= 0)) throw new Error('Invalid buff');
  if (!o || o.unlockRules === undefined) delete result.unlockRules; /* older saves: migrate their unlocks once */
  if(o.restorationVersion===undefined)delete result.restorationVersion;
  if(DQ.migrateRestoration)DQ.migrateRestoration(result);
  if(DQ.migrateDiscoveries)DQ.migrateDiscoveries(result);
  for(const w of result.workers)for(const field of ['job','jobComplete'])if(w[field]!=null){const j=w[field];if(!record(j)||!D.ITEMS[j.item]||!Number.isSafeInteger(j.target)||j.target<1||j.target>1000000||!Number.isSafeInteger(j.done)||j.done<0||j.done>1000010||typeof j.label!=='string')throw new Error('Invalid worker target');if(field==='job'&&(!D.NODE[w.task]||D.NODE[w.task].item!==j.item||D.NODE[w.task].skill!==w.skill))throw new Error('Invalid worker target task');}
  if(result.restorationVersion!==1)throw new Error('Unsupported restoration version');
  if(!record(result.legacyRestoration)||Object.entries(result.legacyRestoration).some(([id,v])=>!D.PROJECTS[id]||v!==true||!result.projects[id]))throw new Error('Invalid legacy restoration');
  if(o.hunt?.loopVersion===undefined)delete result.hunt.loopVersion;
  if(DQ.migrateHuntingLoop)DQ.migrateHuntingLoop(result);
  if(DQ.migrateToolUpgrades)DQ.migrateToolUpgrades(result);
  if(!record(result.skillUpgrades)||Object.entries(result.skillUpgrades).some(([sk,v])=>!D.SK[sk]||!Number.isInteger(v)||v<0||v>3))throw new Error('Invalid skill upgrades');
  if(!record(result.toolUpgrades)||Object.entries(result.toolUpgrades).some(([id,v])=>!D.ITEMS[id]?.toolSkill||!D.ITEMS[id]?.tier||v!==true))throw new Error('Invalid tool upgrades');
  if(!Number.isSafeInteger(result.hunt.legacyFieldLevel)||result.hunt.legacyFieldLevel<0||result.hunt.legacyFieldLevel>99)throw new Error('Invalid legacy hunting access');
  if(result.hunt.loopVersion!==undefined&&result.hunt.loopVersion!==1)throw new Error('Unsupported hunting loop');
  if(result.hunt.fieldFocus!=null&&(typeof result.hunt.fieldFocus!=='string'||!D.ITEMS[result.hunt.fieldFocus]))throw new Error('Invalid hunting focus');
  migrate(result);
  if (!Number.isSafeInteger(result.villageProceedsAt) || result.villageProceedsAt <= 0) {
    delete result.villageProceedsAt;
    if (Object.keys(result.projects).some(id => result.projects[id] && D.PROJECTS[id] && !D.PROJECTS[id].relic)) {
      result.villageProceedsAt = Number.isSafeInteger(result.lastSeen) && result.lastSeen > 0 ? Math.min(result.lastSeen, Date.now()) : Date.now();
    }
  }
  DQ.reconcileMainQuests?.(result);
  /* modules that keep records in shared lists (e.g. waiting world events in inbox) check their own rows */
  for (const check of DQ.saveChecks || []) check(result);
  return result;
}
DQ.validateSave = candidateState;
DQ.hasSave = () => { try { return !!store.getItem(SAVE_KEY); } catch (e) { return false; } };
DQ.load = () => {
  let raw;
  try {
    raw = store.getItem(SAVE_KEY); if (!raw) return false;
    const next = candidateState(JSON.parse(raw));
    DQ.S = next; observedSave = raw; return true;
  } catch (e) {
    if (!window.idlewickDesktop) {
      try {
        const previous = store.getItem(RECOVERY_KEY);
        if (previous) {
          DQ.S = candidateState(JSON.parse(previous));
          observedSave = raw;
          recoveredSave = true;
          DQ.saveHealth = 'Opened the previous verified save.';
          return true;
        }
      } catch (backupError) {}
    }
    DQ.saveHealth = 'The saved hero could not be loaded. Keep a copy before starting again.';
    return false;
  }
};
function migrate(S) {
  /* Attack + Strength became Melee (Nov 2026): Melee takes the higher of the two; the lower still counts towards Hero level */
  if (S.xp && (Object.prototype.hasOwnProperty.call(S.xp, 'attack') || Object.prototype.hasOwnProperty.call(S.xp, 'strength')) && !S.meleeMerged) {
    const a = +S.xp.attack || 0, b = +S.xp.strength || 0; S.xp.melee = Math.max(+S.xp.melee || 0, a, b); S.xpLegacy = (S.xpLegacy || 0) + Math.min(a, b);
    S.xpOld = { attack: a, strength: b }; delete S.xp.attack; delete S.xp.strength; S.meleeMerged = 1;
  }
  DQ.xpAliases(S);
  if (DQ.migrateBeasts) DQ.migrateBeasts(S);
  // A rule change must preserve skills the player has already trained.
  for (const skill of D.SKILLS) {
    if ((skill.actionReq || skill.quest) && S.xp[skill.id] > 0) S.unlocked[skill.id] = true;
  }
  /* Mossbarrow was added between Willowbrook and Saltmere: keep later roads open for older saves */
  const ids = D.TOWNS.map(t => t.id); let last = -1; ids.forEach((id, i) => { if (S.towns[id]) last = i; });
  for (let i = 0; i < last; i++) if (!S.towns[ids[i]]) S.towns[ids[i]] = { visited: false, boss: false };
  if (!Array.isArray(S.farm.plots)) S.farm.plots = [];
  /* practical unlocks (Nov 2026): keep every skill an older save had already earned under the earlier rules. Runs once. */
  if (!S.unlockRules) {
  const xpTotal = D.SKILLS.reduce((a, s) => a + ((S.xp || {})[s.id] || 0), 0) + (S.xpLegacy || 0) - D.XPF[10]; let hero = 1; while (hero < 99 && xpTotal >= D.advReq(hero + 1)) hero++;
  for (const [sk, before] of Object.entries(D.UNLOCK_BEFORE || {})) {
    if (S.unlocked[sk]) continue;
    const had = before.hero ? hero >= before.hero : Object.entries(before).every(([k, n]) => ((S.stats || {})[k] || 0) >= n);
    if (had || (S.xp && S.xp[sk] > 0)) S.unlocked[sk] = true;
  }
  S.unlockRules = 2;
  }
}
DQ.saveHealth = '';
DQ.saveLocation = () => window.idlewickDesktop?.storage ? 'desktop' : window.self !== window.top ? 'preview' : 'browser';
let observedSave, recoveredSave = false;
try { observedSave = store.getItem(SAVE_KEY); } catch (e) {}
const writeSave = (current, next) => {
  if (current && !recoveredSave && !window.idlewickDesktop) {
    try { store.setItem(RECOVERY_KEY, current); } catch (error) {
      // The browser commits each key atomically. A full recovery slot should not prevent saving.
      if (error?.name !== 'QuotaExceededError') throw error;
    }
  }
  store.setItem(SAVE_KEY, next);
  if (store.getItem(SAVE_KEY) !== next) throw new Error('Save write could not be verified');
  recoveredSave = false;
};
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
    writeSave(current, next);
    observedSave = next; DQ.S.lastSeen = JSON.parse(next).lastSeen; DQ.saveHealth = '';
    return true;
  } catch (e) {
    DQ.saveHealth = 'Progress could not be saved on this device. Download a backup before closing.';
    return false;
  }
};
window.idlewickDesktop?.onBeforeClose?.(() => !DQ.started || DQ.save());
DQ.eraseSave = () => { try { if (!window.idlewickDesktop) store.removeItem(RECOVERY_KEY); store.removeItem(SAVE_KEY); observedSave = null; recoveredSave = false; } catch (e) {} };
DQ.exportSave = () => btoa(unescape(encodeURIComponent(JSON.stringify(DQ.S))));
DQ.importSave = text => {
  try {
    const next = candidateState(JSON.parse(decodeURIComponent(escape(atob(text.trim())))));
    const current = store.getItem(SAVE_KEY);
    if (observedSave !== undefined && current !== observedSave) return false;
    const raw = JSON.stringify({ ...next, lastSeen: Date.now() });
    writeSave(current, raw);
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
DQ.skId = sk => (D.SKILL_ALIAS && D.SKILL_ALIAS[sk]) || sk;
DQ.lvl = sk => D.lvlOf(DQ.S.xp[DQ.skId(sk)] || 0);
/* old saves and code that still read xp.attack / xp.strength see Melee; the accessors are not saved */
DQ.xpAliases = S => { if (!S || !S.xp) return; for (const k of ['attack', 'strength']) if (!Object.getOwnPropertyDescriptor(S.xp, k) || Object.getOwnPropertyDescriptor(S.xp, k).enumerable) {
  if (Object.prototype.hasOwnProperty.call(S.xp, k)) delete S.xp[k];
  Object.defineProperty(S.xp, k, { get() { return this.melee || 0; }, set(v) { this.melee = v; }, enumerable: false, configurable: true }); } };
DQ.xpAliases(DQ.S);
DQ.maxLvl = () => Math.max(...D.SKILLS.map(s => DQ.lvl(s.id)));
DQ.totalLvl = () => D.SKILLS.reduce((a, s) => a + DQ.lvl(s.id), 0);
DQ.totalXp = () => D.SKILLS.reduce((a, s) => a + (DQ.S.xp[s.id] || 0), 0) + (DQ.S.xpLegacy || 0) - D.XPF[10]; /* xpLegacy: the lower of an old save's Attack and Strength, so Hero level never drops */
DQ.advLvl = () => { const t = DQ.totalXp(); let l = 1; while (l < 99 && t >= D.advReq(l + 1)) l++; return l; };
DQ.advProgress = () => {
  const l = DQ.advLvl(), t = DQ.totalXp(); if (l >= 99) return { pct: 100, cur: t, next: t, need: 0 };
  const a = D.advReq(l), b = D.advReq(l + 1);
  return { pct: clamp((t - a) / (b - a) * 100, 0, 100), cur: t - a, next: b - a, need: b - t };
};
const COMBAT_SKILLS = new Set(['melee', 'attack', 'strength', 'defence', 'hitpoints', 'ranged', 'magic']);
/* Early pace (Nov 2026 playtest: "level 6 after 4 minutes"): non-combat skills learn at 30% at level 1, rising evenly to
   the full rate at level 20. Combat keeps its own tuned opening (combat 8 at about 22 minutes, sim-opening.cjs). */
D.EARLY_PACE = { from: .3, until: 20 };
DQ.earlyPace = sk => { const E = D.EARLY_PACE, l = DQ.lvl(sk); return !E || COMBAT_SKILLS.has(sk) || l >= E.until ? 1 : E.from + (1 - E.from) * (l - 1) / (E.until - 1); };
DQ.xpMult = sk => DQ.earlyPace(sk) * (1 + .005 * (DQ.lvl(sk) - 1)) * (1 + .0025 * (DQ.advLvl() - 1)) * (COMBAT_SKILLS.has(sk) ? 1 + DQ.combatCatchUp() : 1) * (DQ.extraXp ? DQ.extraXp(sk) : 1) * (DQ.buffMult ? DQ.buffMult('xp') : 1);
/* Each unlock requirement with live progress. kind says how an item is treated: 'record' (a personal action count),
   'checked' (must be held, kept), 'consumed' (taken when you learn the skill) or 'level'. */
DQ.reqProgress = (stat, need) => {
  const S = DQ.S, [k, a] = stat.includes(':') ? stat.split(':') : [stat, null];
  if (k === 'hero') return { stat, need, have: DQ.advLvl(), kind: 'level' };
  if (k === 'combat') return { stat, need, have: DQ.combatLvl(), kind: 'level' };
  if (k === 'skill') return { stat, need, have: DQ.lvl(a), kind: 'level', skill: a };
  if (k === 'tool') return { stat, need, have: DQ.toolTier(a) > 0 ? 1 : 0, kind: 'checked', skill: a };
  if (k === 'own' || k === 'use') return { stat, need, have: DQ.have(a), kind: k === 'own' ? 'checked' : 'consumed', item: a };
  if (k === 'visit') return { stat, need, have: S.towns[a] && S.towns[a].visited ? 1 : 0, kind: 'record', town: a };
  if (k === 'beasts') return { stat, need, have: Object.values(S.beast && S.beast.kills || {}).filter(n => n > 0).length, kind: 'record' };
  return { stat, need, have: S.stats[stat] || 0, kind: 'record' };
};
DQ.actionProgress = sk => Object.entries(D.SK[sk]?.actionReq || {}).map(([stat, need]) => DQ.reqProgress(stat, need));
DQ.skillUnlocked = sk => { const s=D.SK[sk]; if(!s)return false; if(DQ.S.unlocked[sk])return true; if(s.actionReq){const r=DQ.actionProgress(sk);return !r.some(x=>x.kind==='consumed')&&r.every(x=>x.have>=x.need);} return s.quest?false:s.unlock<=DQ.advLvl(); };
const actionNames={kill:'combat victories',catch:'fish caught',chop:'logs chopped',harvest:'crops harvested',craft:'items crafted',smith:'smithing actions'};
DQ.reqLabel = r => { const [k, a] = r.stat.includes(':') ? r.stat.split(':') : [r.stat, null], I = a && D.ITEMS[a];
  return k === 'hero' ? `Hero level ${r.need}` : k === 'combat' ? `Combat level ${r.need}` : k === 'skill' ? `${D.SK[a].name} level ${r.need}` : k === 'tool' ? `Own a ${({ mining: 'pickaxe', fishing: 'fishing rod', woodcutting: 'axe', thieving: 'pair of thief gloves', farming: 'hoe' })[a] || 'tool'} (kept)` : k === 'own' ? `Hold ${r.need} ${I ? I.name.toLowerCase() + (r.need > 1 && !/s$/.test(I.name) ? 's' : '') : a} (kept)` : k === 'use' ? `${r.need} ${I ? I.name.toLowerCase() : a} (used when you learn it)` : k === 'visit' ? `Visit ${D.TOWN[a] ? D.TOWN[a].name : a}` : k === 'beasts' ? `Different creatures studied` : `${DQ.cap ? DQ.cap(actionNames[r.stat] || r.stat) : (actionNames[r.stat] || r.stat)}`; };
DQ.unlockHow = sk => { const s=D.SK[sk]; if(s.actionReq)return DQ.actionProgress(sk).map(r=>`${DQ.reqLabel(r)} (${r.kind === 'level' ? `now ${r.have}` : `${Math.min(r.have,r.need)}/${r.need}`})`).join(', '); if (s.quest) {
  const quest = D.QM[s.quest];
  const goals = quest?.obj?.map(o => o.label).filter(Boolean).join(' · ');
  return `Complete “${quest?.name || s.questName}”${goals ? ': ' + goals : ''}`;
} return `Reach Hero level ${s.unlock}`; };
DQ.maxHp = () => DQ.lvl('hitpoints');
DQ.combatLvl = () => {
  const L = DQ.lvl, base = .25 * (L('defence') + L('hitpoints'));
  return Math.floor(base + .65 * Math.max(L('melee'), L('ranged'), L('magic'))); /* every fighting style counts the same */
};
/* Progress towards the next combat level: the formula evaluated with fractional skill levels, plus the cheapest single-skill route. */
const combatFrom = L => { const base = .25 * (L.defence + L.hitpoints); return base + .65 * Math.max(L.melee, L.ranged, L.magic); };
DQ.combatProgress = () => {
  const ids = ['melee', 'defence', 'hitpoints', 'ranged', 'magic'], L = {}, F = {};
  ids.forEach(k => { L[k] = DQ.lvl(k); F[k] = L[k] + (L[k] >= 99 ? 0 : DQ.pctNext(k) / 100); });
  /* The bar follows the skill you are training (or else the cheapest route): how far that skill has come towards the XP
     that tips the combat level over, so the percentage and "N XP reaches combat X" always describe the same thing. Combat
     level only changes on whole skill levels, so the earlier fractional-formula bar could read 99% with a level to go. */
  const lvl = DQ.combatLvl(), next = lvl + 1;
  const routes = ids.filter(k => DQ.skillUnlocked(k)).map(k => { const T = { ...L }; while (T[k] < 99 && Math.floor(combatFrom(T)) < next) T[k]++; return Math.floor(combatFrom(T)) >= next ? { skill: k, xp: Math.max(0, D.XPF[T[k]] - DQ.S.xp[k]), from: D.XPF[L[k]], to: D.XPF[T[k]] } : null; }).filter(Boolean).sort((a, b) => a.xp - b.xp);
  const st = DQ.weaponStyle ? DQ.weaponStyle() : 'melee', focus = { accurate: 'attack', aggressive: 'strength', defensive: 'defence', offense: st }[(DQ.S.style || {})[st]];
  const route = routes.find(r => r.skill === focus) || routes[0] || null;
  const pct = lvl >= 126 || !route ? 100 : Math.min(99, Math.max(0, (DQ.S.xp[route.skill] - route.from) / Math.max(1, route.to - route.from) * 100));
  return { lvl, next, pct, best: routes[0] || null, route, routes };
};
/* Catch-up: while your combat level trails your Hero level, combat skills learn faster (+15% per level behind, up to +200%). */
/* fractional combat level (skills' progress counted), so the catch-up bonus eases off smoothly instead of in steps */
DQ.combatExact = () => { const L = {}; ['melee', 'defence', 'hitpoints', 'ranged', 'magic'].forEach(k => { L[k] = DQ.lvl(k) + (DQ.lvl(k) >= 99 ? 0 : DQ.pctNext(k) / 100); }); return combatFrom(L); };
DQ.combatCatchUp = () => Math.min(2, .15 * Math.max(0, DQ.advLvl() - DQ.combatExact()));
/* the permanent XP bonus (skill and Hero levels, buffs), shown on skill chips; catch-up is shown on its own */
DQ.xpBonusBase = sk => DQ.xpMult(sk) / (COMBAT_SKILLS.has(sk) ? 1 + DQ.combatCatchUp() : 1);
DQ.pctNext = sk => { sk = DQ.skId(sk); const l = DQ.lvl(sk); if (l >= 99) return 100; const a = D.XPF[l], b = D.XPF[l + 1]; return clamp((DQ.S.xp[sk] - a) / (b - a) * 100, 0, 100); };

/* ---------- Items ---------- */
DQ.pack = id => DQ.S.inv[id] || 0;
DQ.have = id => (DQ.S.inv[id] || 0) + (DQ.S.bank[id] || 0);
/* Tools (pickaxes, axes, rods, gloves …) are equipped the moment you own them: they are kept with your things for old
   saves' sake but never take a backpack slot and are not shown in the backpack or bank (the Tools tab lists them). */
DQ.isTool = id => !!(DQ.data.ITEMS[id] && DQ.data.ITEMS[id].type === 'tool');
DQ.packSlots = () => Object.keys(DQ.S.inv).filter(id => !DQ.isTool(id)).length;
DQ.give = (id, n = 1) => {
  /* an id that is not an item never enters the pack: it would leave a nameless tile that breaks the backpack and combat lists */
  if (!DQ.data.ITEMS[id]) { if (window.console) console.warn('DQ.give: no such item', id); return; }
  if(n>0&&DQ.rememberItem)DQ.rememberItem(id);
  const S = DQ.S; if (n <= 0) return;
  if (S.inv[id]) S.inv[id] += n;
  else if (DQ.packSlots() < DQ.packMax()) S.inv[id] = n;
  else { S.bank[id] = (S.bank[id] || 0) + n; DQ.emit('overflow', id); }
  DQ.invDirty = true;
};
DQ.take = (id, n = 1) => {
  const S = DQ.S; if (DQ.have(id) < n) return false;
  if(n>0&&DQ.rememberItem)DQ.rememberItem(id);
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
/* keys of the unique effects on equipped gear (data.js `unique`) */
DQ.uniqueFx = () => { const o = {}; for (const [slot, id] of Object.entries(DQ.S.equip || {})) { const u = slot !== 'ammo' && D.ITEMS[id] && D.ITEMS[id].unique; if (u) o[u.key] = u; } return o; };
/* the equipped named weapon's signature (js/rare_weapons.js): { key, fx, ...its own numbers }, or null. Only the weapon
   slot carries these, so at most one is active. */
DQ.rareFx = () => { const id = DQ.S.equip && DQ.S.equip.weapon, u = id && D.ITEMS[id] && D.ITEMS[id].unique; return u && u.fx ? u : null; };
DQ.bonus = () => {
  const out = { atk: 0, str: 0, def: 0, rng: 0, rngStr: 0, mag: 0 };
  const add = id => { const b = D.ITEMS[id] && D.ITEMS[id].b; if (b) for (const k in b) out[k] += b[k]; };
  Object.entries(DQ.S.equip).forEach(([slot, id]) => { if (slot !== 'ammo') add(id); });
  if (DQ.S.ammo.id && DQ.S.ammo.n > 0) add(DQ.S.ammo.id);
  return out;
};
DQ.weaponStyle = () => { const w = D.ITEMS[DQ.S.equip.weapon]; return (w && w.style) || 'melee'; };

/* ---------- Tools and perks ---------- */
/* Ordinary gathering is not tied to where you stand (Nov 2026 brief): once you have reached a resource's home town,
   that fishing spot, tree or ore can be worked from any town through its skill page. Levels and tools still apply.
   Exceptions stay regional: thieving targets (they are people in that town) and the signature resources below.
   Discoveries and adventures still depend on where you actually are. Revert: make nodeHere return n.town === S().town. */
D.SIGNATURE_NODES = new Set(['skyfin', 'voideel', 'elder', 'gloomwood', 'astralite', 'voidstone']);
/* 26 Nov 2026 (owner: "Once I've unlocked that town, I can do that thing ... at any time across all skills. The towns
   should only really be part of the town projects, combat etc"): no gathering spot is regional any more, thieving
   targets and signature resources included, and a spot is yours once its town is unlocked, visited or not. */
DQ.nodeRegional = () => false;
DQ.nodeDiscovered = n => !!n && (n.town === DQ.S.town || DQ.townUnlocked(n.town) || !!(DQ.S.towns[n.town] && DQ.S.towns[n.town].visited));
DQ.nodeHere = n => !!n && (n.town === DQ.S.town || (!DQ.nodeRegional(n) && DQ.nodeDiscovered(n)));
DQ.toolKey = sk => { const t = D.TOOLS.find(t => t[1] === sk); return t && t[0]; };
DQ.toolTier = sk => { const k = DQ.toolKey(sk); if (!k) return 0; for (const t of [...D.TOOL_ORDER].reverse()) if (DQ.have(`tool_${k}_${t}`)) return t; return 0; };
DQ.perkSpeed = sk => { const l = DQ.lvl(sk); return D.PERKS.reduce((a, p) => a + (p.speed && l >= p.lvl ? p.speed : 0), 0); };
DQ.speedMult = sk => clamp(1 - D.TOOL_SPEED[DQ.toolTier(sk)] - DQ.perkSpeed(sk) - (DQ.extraSpeed ? DQ.extraSpeed(sk) : 0), .3, 1);
DQ.dblChance = sk => (DQ.lvl(sk) >= 99 ? .1 : 0) + ((DQ.fx && DQ.fx().dbl) || 0);
})();
