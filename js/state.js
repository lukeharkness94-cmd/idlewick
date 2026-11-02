/* Idlewick: player state, saving and derived stats. */
(() => {
const DQ = window.DQ, D = DQ.data, { clamp } = DQ;
const SAVE_KEY = 'dashboard-quest-save-v2';
const PACK_SLOTS = 40;
DQ.PACK_SLOTS = PACK_SLOTS;
DQ.SLOTS = ['head', 'body', 'legs', 'weapon', 'shield', 'ring', 'amulet', 'ammo'];
DQ.SLOT_NAMES = { head: 'Head', body: 'Body', legs: 'Legs', weapon: 'Weapon', shield: 'Shield', ring: 'Ring', amulet: 'Amulet', ammo: 'Ammo' };
DQ.invDirty = false;

DQ.newState = (name = 'Adventurer', look) => {
  const xp = {}; D.SKILLS.forEach(s => xp[s.id] = 0); xp.hitpoints = D.XPF[10];
  return {
    v: 2, name, look: look || { skin: D.LOOKS.skin[0], hair: D.LOOKS.hair[1], tunic: D.LOOKS.tunic[0] },
    created: Date.now(), lastSeen: Date.now(), playtime: 0, awayMs: 0, awayEff: 0, tele: { adv: {}, skill: {}, first: {}, away: [], sessions: 0 }, seenTabs: {}, lastAway: null, exportedAt: 0, snoozeBk: 0, title: null, research: { done: {}, active: [] },
    xp, coins: 25, hp: 10, inv: { bread: 5 }, bank: {}, equip: { weapon: 'bronze_sword' }, ammo: { id: null, n: 0 },
    town: 'willowbrook', towns: { willowbrook: { visited: true, boss: false } },
    q: {}, ach: {}, seen: {}, unlocked: {},
    stats: { harvest: 0, collect: 0, pets: 0, furnish: 0, hired: 0, catch: 0, chop: 0, mine: 0, thieve: 0, cook: 0, burn: 0, smelt: 0, smith: 0, craft: 0, alch: 0, kill: 0, earned: 0, deaths: 0, bought: 0, sold: 0, equipped: 0, tools: 0, rare: 0 },
    settings: { theme: 'dark', snd: { ui: true, combat: true, rewards: true }, haptics: true, dev: false, sfx: true, music: true, muted: false, vol: .7, musicVol: .4, taskSounds: 'varied', notify: true, reduceFx: false, autoEat: true, eatAt: 50, tips: true },
    style: { melee: 'aggressive', ranged: 'offense', magic: 'offense' }, spell: 'spark',
    act: null, log: [], tut: { done: {}, hidden: false },
    gameTime: 0, farm: { plots: [{ crop: null }, { crop: null }, { crop: null }], plotsBought: 3, animals: [], pensBought: 2, feed: 0, autoReplant: true, last: 'potato' },
    pets: { owned: {}, active: null }, house: { owned: false, rooms: {}, furn: {} }, workers: [], hire: { cands: [], at: -1e9 }, beast: { kills: {}, drops: {} },
  };
};
DQ.S = DQ.newState();

const merge = (base, over) => {
  if (!over || typeof over !== 'object') return base;
  for (const k of Object.keys(over)) {
    if (base[k] && typeof base[k] === 'object' && !Array.isArray(base[k]) && typeof over[k] === 'object' && over[k] !== null) merge(base[k], over[k]);
    else base[k] = over[k];
  }
  return base;
};
DQ.hasSave = () => { try { return !!localStorage.getItem(SAVE_KEY); } catch (e) { return false; } };
DQ.load = () => {
  try {
    const raw = localStorage.getItem(SAVE_KEY); if (!raw) return false;
    const o = JSON.parse(raw); if (!o || o.v !== 2) return false;
    const base = DQ.newState(); base.equip = {}; base.inv = {};
    DQ.S = merge(base, o); migrate(DQ.S); return true;
  } catch (e) { return false; }
};
function migrate(S) {
  /* Mossbarrow was added between Willowbrook and Saltmere: keep later roads open for older saves */
  const ids = D.TOWNS.map(t => t.id); let last = -1; ids.forEach((id, i) => { if (S.towns[id]) last = i; });
  for (let i = 0; i < last; i++) if (!S.towns[ids[i]]) S.towns[ids[i]] = { visited: false, boss: false };
  if (!Array.isArray(S.farm.plots)) S.farm.plots = [];
}
DQ.save = () => {
  try { DQ.S.lastSeen = Date.now(); localStorage.setItem(SAVE_KEY, JSON.stringify(DQ.S)); return true; } catch (e) { return false; }
};
DQ.eraseSave = () => { try { localStorage.removeItem(SAVE_KEY); } catch (e) {} };
DQ.exportSave = () => btoa(unescape(encodeURIComponent(JSON.stringify(DQ.S))));
DQ.importSave = text => {
  try {
    const o = JSON.parse(decodeURIComponent(escape(atob(text.trim()))));
    if (!o || o.v !== 2 || !o.xp) return false;
    const base = DQ.newState(); base.equip = {}; base.inv = {};
    DQ.S = merge(base, o); migrate(DQ.S); DQ.save(); return true;
  } catch (e) { return false; }
};

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
DQ.xpMult = sk => (1 + .005 * (DQ.lvl(sk) - 1)) * (1 + .0025 * (DQ.advLvl() - 1)) * (DQ.extraXp ? DQ.extraXp(sk) : 1) * (DQ.buffMult ? DQ.buffMult('xp') : 1);
DQ.skillUnlocked = sk => { const s = D.SK[sk]; return s.quest ? !!DQ.S.unlocked[sk] : s.unlock <= DQ.advLvl(); };
DQ.unlockHow = sk => { const s = D.SK[sk]; return s.quest ? `Complete the main quest “${s.questName}”` : `Reach Hero level ${s.unlock}`; };
DQ.maxHp = () => DQ.lvl('hitpoints');
DQ.combatLvl = () => {
  const L = DQ.lvl, base = .25 * (L('defence') + L('hitpoints'));
  const m = .325 * (L('attack') + L('strength')), r = .325 * Math.floor(1.5 * L('ranged')), g = .325 * Math.floor(1.5 * L('magic'));
  return Math.floor(base + Math.max(m, r, g));
};
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
