/* Mastery of each thing you do (Nov 2026): every tree, fish, ore, target, recipe and other repeatable task has its own
   five stars, earned by doing it. Each star makes that one task 2% faster; the third and fifth stars add a 5% and 10%
   chance of an extra item (gathering and recipes). Counts live in S.mast under "kind:id". Fights are excluded: creatures
   have the field guide. Rules only; forecasts run on a snapshot, so nothing here needs to guard against them. */
(() => {
const DQ = window.DQ, D = DQ.data, S = () => DQ.S;
const STEPS = D.MASTERY_STEPS = [25, 100, 300, 750, 1500];
const YIELD_KINDS = ['fish', 'wood', 'mine', 'recipe'];
const key = (kind, id) => kind + ':' + id;
DQ.mastCount = (kind, id) => ((S().mast || {})[key(kind, id)]) || 0;
DQ.mastStars = (kind, id) => { const n = DQ.mastCount(kind, id); let s = 0; while (s < STEPS.length && n >= STEPS[s]) s++; return s; };
DQ.mastSpeed = (kind, id) => kind === 'fight' ? 0 : .02 * DQ.mastStars(kind, id);
DQ.mastExtra = (kind, id) => { if (!YIELD_KINDS.includes(kind)) return 0; const s = DQ.mastStars(kind, id); return s >= 5 ? .1 : s >= 3 ? .05 : 0; };
DQ.mastInfo = (kind, id) => { const n = DQ.mastCount(kind, id), stars = DQ.mastStars(kind, id), next = STEPS[stars] || null, prev = stars ? STEPS[stars - 1] : 0;
  return { n, stars, next, pct: next ? Math.round((n - prev) / (next - prev) * 100) : 100, speed: Math.round(DQ.mastSpeed(kind, id) * 100), extra: Math.round(DQ.mastExtra(kind, id) * 100), yields: YIELD_KINDS.includes(kind) }; };
DQ.mastPerk = (kind, star) => star === 3 && YIELD_KINDS.includes(kind) ? '2% faster and a 5% chance of an extra one' : star === 5 && YIELD_KINDS.includes(kind) ? '2% faster and a 10% chance of an extra one' : '2% faster';
DQ.mastTotal = () => Object.keys(S().mast || {}).reduce((t, k) => { const i = k.indexOf(':'); return t + DQ.mastStars(k.slice(0, i), k.slice(i + 1)); }, 0);
DQ.mastTick = a => {
  if (!a || a.kind === 'fight' || a.kind === 'alch') return;
  const M = S().mast = S().mast || {}, k = key(a.kind, a.id), before = DQ.mastStars(a.kind, a.id);
  M[k] = (M[k] || 0) + 1;
  const after = DQ.mastStars(a.kind, a.id);
  if (after > before && !DQ.sim.on && !DQ.forecasting) {
    const name = DQ.actLabel ? DQ.actLabel({ kind: a.kind, id: a.id }) : a.id;
    DQ.sfx && DQ.sfx('perk');
    DQ.notify({ kind: 'info', key: 'mast:' + k, icon: 'book', col: '#f3d58a', title: `Field guide: ${name}`, text: `Entry ${after} of ${STEPS.length}, ${DQ.ENTRY_NAMES[after - 1]}: ${DQ.entryPerk(a.kind, after)}.`, sound: false, ttl: 7000, action: { label: 'Open the page', fn: () => { DQ.ui.guideTopic = a.kind === 'recipe' ? 'recipe:' + D.RECIPES[a.id].skill : a.kind; DQ.go('bestiary'); } } });
  }
};
/* ---------- how it shows (Dec 2026, from the player: visible without more text, systems or colours) ----------
   One thin bar, in the brass the game already uses, along the bottom of the thing you are working on: its fill is the
   progress to the next field-guide entry. The selected task also shows five pips. Details live in the tooltip and on
   the field guide page. DQ.studyBar is shared with creatures (js/where.js). */
DQ.ENTRY_NAMES = ['Notes', 'Quicker hands', 'Keen eye', 'Second nature', 'Mastered'];
DQ.entryPerk = (kind, star) => { const y = YIELD_KINDS.includes(kind); return star === 1 ? 'what it is for, and 2% faster' : star === 3 && y ? '6% faster and a 5% chance of an extra one' : star === 5 && y ? '10% faster and a 10% chance of an extra one' : `${star * 2}% faster`; };
DQ.studyBar = (pct, full, tip) => `<i class="study-bar ${full ? 'full' : ''}" style="--p:${Math.max(0, Math.min(100, Math.round(pct)))}%" ${tip ? `data-tip="text:${DQ.esc(tip)}"` : ''} aria-hidden="true"></i>`;
DQ.mastTip = (kind, id) => { const m = DQ.mastInfo(kind, id); return m.next ? `Field guide: entry ${m.stars} of ${STEPS.length}. Next, ${DQ.ENTRY_NAMES[m.stars]} (${DQ.entryPerk(kind, m.stars + 1)}), after ${DQ.fmt(m.next - m.n)} more.` : `Field guide: every entry filled in. ${m.speed}% faster${m.extra ? `, ${m.extra}% chance of an extra one` : ''}.`; };
DQ.mastBadge = (kind, id) => { if (kind === 'fight' || kind === 'alch') return ''; const m = DQ.mastInfo(kind, id); return m.n ? DQ.studyBar(m.pct, !m.next) : ''; };
DQ.mastLine = (kind, id) => { if (kind === 'fight' || kind === 'alch') return ''; const m = DQ.mastInfo(kind, id);
  return `<div class="mast-line ${m.next ? '' : 'max'}" data-tip="text:${DQ.esc(DQ.mastTip(kind, id))}" role="img" aria-label="${DQ.esc(DQ.mastTip(kind, id))}"><span class="mast-pips">${Array.from({ length: STEPS.length }, (_, i) => `<i class="${i < m.stars ? 'on' : ''}"></i>`).join('')}</span><span class="bar"><i style="width:${m.pct}%"></i></span></div>`; };
/* the task itself gets faster */
const dur0 = DQ.durFor;
DQ.durFor = (kind, id) => { const d = dur0(kind, id), s = DQ.mastSpeed(kind, id); return s ? Math.max(200, Math.round(d * (1 - s))) : d; };
})();
