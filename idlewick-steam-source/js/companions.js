/* Idlewick: companion signature tricks (approved Nov 2026, docs/companion-effects.md).
   Each curated companion keeps half of its old passive and gains one visible trick. The engine asks DQ.trick(key) at
   the moment a trick can fire; tricks run in live play, offline catch-up and forecasts alike (so forecasts stay honest),
   but only live play shows their floating text. Loaded after bestiary.js, before pixel_runtime.js. */
(() => {
const DQ = window.DQ, D = DQ.data, UI = DQ.ui, S = () => DQ.S;
D.TRICKS = {
  biscuit: { key: 'fetch', name: 'Fetch', text: '1 in 40 gathering actions brings back an extra resource' },
  toast: { key: 'riser', name: 'Early riser', text: 'crops ripen 10% sooner' },
  bubbles: { key: 'school', name: 'School spotter', text: '1 in 12 catches is doubled' },
  acorn: { key: 'nuts', name: 'Nut stash', text: "bird's nests are twice as common" },
  nugget: { key: 'seam', name: 'Seam sense', text: 'gems from mining are twice as common' },
  whiskers: { key: 'paws', name: 'Light paws', text: 'the first failed pickpocket each minute does no damage' },
  cinder: { key: 'bellows', name: 'Bellows', text: '1 in 10 smelts makes a second bar' },
  quill: { key: 'night', name: 'Night study', text: 'research progresses 10% faster' },
  pudding: { key: 'taster', name: 'Taster', text: 'never burns the first dish of a cooking session, and burns are 25% rarer' },
  gobbo: { key: 'heckle', name: 'Heckle', text: 'once per fight, makes the enemy lose its second attack' },
  tusky: { key: 'charge', name: 'Charge', text: 'opens every fight with a free hit for half your max hit' },
  bill: { key: 'comb', name: 'Beachcomber', text: 'coin pouches from fishing and fighting are 50% larger' },
  frostling: { key: 'cold', name: 'Cold shoulder', text: 'boss special attacks hit 20% softer' },
  bogwisp: { key: 'wisp', name: "Will-o'-wisp", text: 'every bestiary entry reveals one stage early' },
  wyrmling: { key: 'ember', name: 'Ember breath', text: 'every 6th attack adds a small fire hit' },
  stormchick: { key: 'tailwind', name: 'Tailwind', text: 'the first 10 actions of each non-combat task are 25% faster' },
  hollowling: { key: 'echo', name: 'Echo', text: '1 in 20 gathering, crafting or thieving actions repeats for free' }
};
/* half of the old passive, described in words */
const pct = v => `${Math.round(v * 1000) / 10}%`;
const describe = b => [b.xpAll && `+${pct(b.xpAll)} XP to every skill`, ...Object.entries(b.xp || {}).map(([k, v]) => `+${pct(v)} ${D.SK[k] ? D.SK[k].name : k} XP`), b.coin && `+${pct(b.coin)} coins`, b.dmg && `+${pct(b.dmg)} damage`, b.dr && `${pct(b.dr)} less damage taken`, b.heal && `food heals ${pct(b.heal)} more`, b.speed && `every task ${pct(b.speed)} faster`].filter(Boolean).join(', ');
for (const [id, t] of Object.entries(D.TRICKS)) {
  const p = D.PET[id]; if (!p || p.trickDone) continue;
  const half = {}; for (const [k, v] of Object.entries(p.bonus)) half[k] = typeof v === 'number' ? v / 2 : Object.fromEntries(Object.entries(v).map(([s, x]) => [s, x / 2]));
  p.bonus = half; p.trick = t; p.trickDone = true;
  p.text = `${t.name}: ${t.text}. Also ${describe(half)}`;
}
DQ.trick = key => { const id = S() && S().pets && S().pets.active, t = id && D.TRICKS[id]; return !!t && t.key === key && !!D.PET[id]; };
DQ.trickNote = (text, where) => {
  if ((DQ.sim && DQ.sim.on) || DQ.forecasting) return;
  const id = S().pets.active, p = D.PET[id]; if (!p) return;
  DQ.floatAt(where || document.querySelector('.card.active') || document.querySelector('.hud-pet') || document.querySelector('.nowp'), `${p.name}: ${text}`, p.col);
};
/* fx-based tricks (added once per recompute of the cached effects) */
const fx0 = DQ.fx;
DQ.fx = () => { const f = fx0(); if (!f._tricks) { f._tricks = true; if (DQ.trick('riser')) f.grow += .1; } return f; };
/* research speed */
const rt0 = DQ.researchTick;
if (rt0) DQ.researchTick = dt => rt0(DQ.trick('night') ? dt * 1.1 : dt);
/* bestiary: one stage early once you have met the creature */
const research0 = DQ.research;
if (research0) DQ.research = m => {
  const r = research0(m); if (!DQ.trick('wisp') || r.kills < 1 || r.rank >= r.T.length) return r;
  const rank = r.rank + 1; return Object.assign({}, r, { rank, next: rank < r.T.length ? r.T[rank] : null, need: rank < r.T.length ? Math.max(0, r.T[rank] - r.kills) : 0 });
};
/* tailwind: the first ten actions of a non-combat task */
const dur0 = DQ.actDur;
DQ.actDur = a => { const d = dur0(a); return a && a.kind !== 'fight' && (a.count || 0) < 10 && DQ.trick('tailwind') ? Math.round(d * .8) : d; };
})();
