/* Idlewick: weighted moments, the rules (polish stage 1, owner 28 Nov 2026: "Every action answered"; docs/polish-pass.md).
   Bigger moments feel bigger: a milestone level, a rare find, a big sale and a heavy blow are answered with more weight
   than the ordinary ones. This file is only the timings table and the decisions, as pure functions (no DOM, no audio,
   no randomness, nothing read from or written to the save), so Node can test them (tests/polish-weight.cjs).
   js/weight.js draws and plays what these decide; js/audio.js holds the sounds they name. */
(() => {
const DQ = window.DQ, D = DQ.data || {};

/* ---------- the timings, in seconds: the picture and the sound both read these ---------- */
const T = {
  /* an ordinary level: the rail row's glow (shell.js) and a small chime that starts with it */
  level: { chime: 0 },
  /* a title moment (a milestone level or the rarest find): rises in, holds, fades; the chord starts as it rises.
     hold is per milestone rank (10, 25, 50, 75, 90, 99), so a bigger mark stays a little longer: 1.85 s to 2.5 s */
  title: { in: .25, out: .3, chord: 0, hold: [1.3, 1.4, 1.5, 1.6, 1.75, 1.95], findHold: 1.45 },
  /* a find: the flight to the backpack (js/ui_feel.js) with its glint, the light in the scene, the chime */
  find: { flight: .76, glint: .76, light: .9, lightPeak: .18, chime: 0 },
  /* a sale: coins lift from where you sold, drop into the purse one after another; the clunk lands with the first */
  sale: { flight: .5, stagger: .06, clunk: .5, take: .25 },
  /* a blow: the hit-stop on the stage sprites (under 80 ms) and how long the creature staggers */
  hit: { stop: { crit: .05, kill: .065, boss: .075 }, stagger: { normal: .36, big: .46, crit: .52, kill: .56, boss: .56 } },
  /* queued titles (behind a pop-up or a fight on screen) wait at most this long before they are let go: a find seen
     minutes later means nothing; a milestone level always gets its moment */
  queue: { find: 60, level: Infinity },
  /* interface motion: ease-out, about a quarter of a second, no bounce */
  ui: .25
};

/* ---------- levels ---------- */
const MARKS = [10, 25, 50, 75, 90, 99];
/* rank 1..6 at a milestone (0 otherwise); band = how many marks are behind you, which pitches the ordinary chime */
const levelTier = level => {
  const n = Math.max(1, Math.floor(+level || 1)), rank = MARKS.indexOf(n) + 1, band = MARKS.filter(m => n >= m).length;
  return { level: n, rank, band, milestone: rank > 0, grand: rank === MARKS.length };
};
/* several level-ups at once become one moment for the biggest: a higher milestone first, then the higher level, then a
   Hero level over a skill's (it counts everything) */
const score = e => { const t = levelTier(e.level); return t.rank * 1000 + t.level * 2 + (e.who === 'hero' ? 1 : 0); };
const levelMoment = list => {
  const L = (list || []).filter(e => e && e.level > 0); if (!L.length) return null;
  const top = L.slice().sort((a, b) => score(b) - score(a))[0], t = levelTier(top.level);
  return { type: 'level', who: top.who === 'hero' ? 'hero' : 'skill', id: top.id || null, level: t.level, rank: t.rank, band: t.band,
    title: t.milestone, sound: t.milestone ? 'milestone' + t.rank : 'lvchime' + Math.min(5, t.band), times: t.milestone ? titleTimes(t.rank) : null };
};
const titleTimes = rank => { const hold = rank > 0 ? T.title.hold[Math.min(T.title.hold.length, rank) - 1] : T.title.findHold;
  return { in: T.title.in, hold, out: T.title.out, total: +(T.title.in + hold + T.title.out).toFixed(3) }; };

/* ---------- finds ---------- */
const bands = () => (D.RARITY && D.RARITY.length ? D.RARITY : [['common', 'Common', '#c9c3b3', .1], ['uncommon', 'Uncommon', '#5cc08a', .02], ['rare', 'Rare', '#5f9bff', .005], ['epic', 'Epic', '#c07aff', 0]]);
/* a find's weight from its own chance, by the D.RARITY bands (the same bands as the labels): common keeps today's
   flight; uncommon and up glint and chime longer; rare and up light the scene; the rarest gets a short title */
const findTier = (chance, o = {}) => {
  const B = bands(); let i = o.unique ? B.length - 1 : B.findIndex(r => chance >= r[3]);
  if (i < 0) i = B.length - 1; if (!(chance >= 0) && !o.unique) return null;
  return { band: i, id: B[i][0], label: B[i][1], col: B[i][2], glint: i >= 1, light: i >= 2, title: i >= B.length - 1, sound: i >= 1 ? 'find' + i : null };
};
/* the base chance of an item found during work, beside the action's own output (null: not a find, the action's own
   yield). Uses the data's base chances, never the boosted ones, as the rarity labels do. */
const workFindChance = ({ kind, item, main, loot, data = D } = {}) => {
  if (!item || item === main) return null;
  const E = data.ECONOMY || {}, W = data.GEM_WEIGHTS || [], total = W.reduce((a, w) => a + w[1], 0), gem = W.find(w => w[0] === item);
  if (gem && total) { const share = gem[1] / total, src = kind === 'mine' ? E.mineGemChance : kind === 'wood' ? (E.woodNestChance || 0) * .5 : kind === 'fish' ? E.fishChestChance : null;
    if (src != null) return src * share; }
  if (loot && loot[0] === item) return loot[1];
  return null;
};
/* the biggest find in one batch: [{ id, chance, unique }] */
const biggestFind = list => { let best = null;
  for (const f of list || []) { const t = findTier(f.chance, f); if (t && (!best || t.band > best.tier.band || (t.band === best.tier.band && f.chance < best.chance))) best = { ...f, tier: t }; }
  return best; };

/* ---------- sales ---------- */
const SALE = [[0, 1], [100, 3], [1000, 5], [10000, 8]]; /* from this many coins, this many coins drop */
const saleBand = coins => { const c = Math.max(0, +coins || 0); if (!c) return null; let b = 0; SALE.forEach(([min], i) => { if (c >= min) b = i; });
  return { band: b, coins: SALE[b][1], sound: 'sale' + b }; };

/* ---------- blows ---------- */
/* a landed blow on the creature: crits (a power hit, or a third of its health in one go) and killing blows land
   harder; a boss's or mini-boss's first defeat keeps its story (no extra sound, only the hit-stop) */
const hitTier = ({ dealt = 0, kind = '', foeMax = 0, killing = false, boss = false } = {}) => {
  if (!(dealt > 0) || String(kind).includes('miss')) return null;
  const share = foeMax > 0 ? dealt / foeMax : 0, power = /\bpower\b/.test(kind);
  const tier = killing ? (boss ? 'boss' : 'kill') : power || share >= .35 ? 'crit' : share >= .2 ? 'big' : 'normal';
  const k = { normal: 1, big: 1.6, crit: 2.2, kill: 2.4, boss: 2.4 }[tier];
  return { tier, stagger: k, staggerS: T.hit.stagger[tier], stop: T.hit.stop[tier] || 0, sound: tier === 'crit' ? 'crit' : tier === 'kill' ? 'killblow' : null };
};

/* ---------- when a moment may show ---------- */
/* drop: nothing at all (a simulation, a forecast, time away, a hidden window); queue: wait (a pop-up or a fight on the
   combat stage); still: show the end state without motion (Reduce effects / reduced motion); show: play it */
const gate = ({ sim = false, forecasting = false, hidden = false, offline = false, calm = false, popup = false, fight = false, title = false } = {}) => {
  if (sim || forecasting || hidden || offline) return 'drop';
  if (title && (popup || fight)) return 'queue';
  return calm ? 'still' : 'show';
};
/* the waiting title: at most one per type; a bigger one replaces a smaller; a find too old is let go */
const queueAdd = (queue, m, now) => {
  const q = (queue || []).filter(x => x.type !== m.type || weightOf(x) > weightOf(m)), has = q.some(x => x.type === m.type);
  if (!has) q.push({ ...m, at: now }); return q;
};
const weightOf = m => m.type === 'level' ? (m.rank || 0) * 1000 + (m.level || 0) : (m.band || 0) * 10;
const queueReady = (queue, now) => (queue || []).filter(x => (now - (x.at || 0)) / 1000 <= (T.queue[x.type] ?? Infinity));

DQ.WEIGHT = { T, MARKS, SALE, levelTier, levelMoment, titleTimes, findTier, workFindChance, biggestFind, saleBand, hitTier, gate, queueAdd, queueReady };
})();
