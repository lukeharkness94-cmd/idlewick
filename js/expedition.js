/* Food for an expedition, not for the next fight (Nov 2026). Small restocks used to interrupt combat again and again
   (eight fishing starts and nine cooking starts in one simulated hour). Instead the Ready line says how long your food
   lasts against the creature you are about to fight, using your real gear and a dry-run forecast, and "Plan food"
   works out what a 30 minute, 1 hour, 2 hour or overnight trip needs and starts one batch that stops when it is done
   ("Batch complete"), not a warning. */
(() => {
const Q = window.DQ, D = Q.data, UI = Q.ui, S = () => Q.S, { esc, ico, fmt } = Q;
const meals = () => (Q.foods ? Q.foods() : []).reduce((n, f) => n + Q.have(f), 0);
const LENGTHS = [[30, '30 minutes'], [60, '1 hour'], [120, '2 hours'], [240, 'Overnight · 4 hours']];
const span = min => !isFinite(min) ? 'all day' : min < 1 ? 'under a minute' : min < 90 ? `${Math.round(min)} min` : `${(min / 60).toFixed(min < 600 ? 1 : 0).replace(/\.0$/, '')} h`;
Q.expeditionSpan = span;
/* how fast the creature in front of you eats your food: a ten minute dry run with your own gear and an endless pack,
   counting the meals that auto-eat uses (a single fight rarely triggers one, so a per-kill count would say "none") */
const rateCache = { key: '', at: 0, res: null };
const dryRun = monId => {
  const snap = JSON.stringify(S()), act = Q.act, fight = Q.fight, hist = JSON.stringify(Q.hist), awayDone = Q.awayDone, res = { eaten: 0, ms: 0, died: false };
  Q.forecasting = true; const orig = Q.S; /* run on a copy and put the original object back: code that holds the save by reference stays valid */
  try {
    Q.S = JSON.parse(snap); Q.S.queue = []; Q.S.settings.autoEat = true;
    const carried = (Q.foods ? Q.foods() : []); for (const f of (carried.length ? carried : ['shrimp'])) if (D.ITEMS[f]) Q.S.inv[f] = (Q.S.inv[f] || 0) + 999;
    Q.S.hp = Q.maxHp(); Q.fxDirty(); Q.act = null; Q.fight = null;
    if (!Q.startAct('fight', monId, { quiet: true })) { res.blocked = true; } else {
      while (res.ms < 10 * 60000) { const sum = Q.simulate(5000); res.ms += 5000; res.eaten += sum.eaten || 0; if (sum.died) { res.died = true; break; } if (!Q.act) break; } }
  } finally { Q.S = orig; Q.act = act; Q.fight = fight; Q.hist = JSON.parse(hist); Q.forecasting = false; Q.awayDone = awayDone; Q.fxDirty(); }
  return res;
};
Q.expedition = () => {
  const m = Q.combatFocus && Q.combatFocus(); if (!m || m.town !== S().town || Q.forecasting) return null;
  const have = meals(), key = JSON.stringify([m.id, Q.combatLvl(), S().equip, Q.maxHp(), S().abilities, S().style, S().town]);
  let r = rateCache.res;
  if (rateCache.key !== key && (Date.now() - rateCache.at > 2500 || !r)) { rateCache.key = key; rateCache.at = Date.now(); try { r = rateCache.res = dryRun(m.id); } catch (e) { r = rateCache.res = null; } }
  if (!r || r.blocked || !r.ms) return { m, have, unknown: true };
  const perMin = r.eaten / (r.ms / 60000);
  return { m, have, perMin, minutes: perMin > .01 ? have / perMin : Infinity, died: r.died };
};
/* the best food you could make from a fish you can catch here, or already hold */
const source = () => {
  const options = Object.values(D.RECIPES).filter(r => r.skill === 'cooking' && Q.skillUnlocked('cooking') && Q.recipeLvlOk(r) && Object.keys(r.in || {}).length === 1).map(r => {
    const raw = Object.keys(r.in)[0], per = r.in[raw], out = Object.keys(r.out)[0], node = (D.NODES.fish || []).find(n => n.item === raw && n.lvl <= Q.lvl('fishing') && Q.nodeHere(n));
    return D.ITEMS[out] && D.ITEMS[out].heal ? { r, raw, per, out, node, heal: D.ITEMS[out].heal, held: Q.have(raw) } : null; }).filter(Boolean);
  return options.filter(o => o.held > 0 || o.node).sort((a, b) => (b.held > 0) - (a.held > 0) || b.heal - a.heal)[0] || null;
};
UI.DO.planfood = len => {
  const e = Q.expedition(); if (!e) return; const min = +len || 60;
  const need = e.unknown ? null : Math.ceil(e.perMin * min), short = need == null ? 0 : Math.max(0, need - e.have), src = source();
  const chips = LENGTHS.map(([m, l]) => `<button class="chip ${m === min ? 'on' : ''}" data-do="planfood" data-a="${m}" aria-pressed="${m === min}">${esc(l)}</button>`).join('');
  const verdict = e.unknown ? `<p>No estimate yet: pick a creature in this area and the plan will use your real gear.</p>`
    : need === 0 ? `<p class="ok">${esc(DQ.monName(e.m))} barely scratches you. Your food is not a concern for ${esc(span(min))}.</p>`
    : short === 0 ? `<p class="ok">You carry <b>${fmt(e.have)}</b> meals; ${esc(span(min))} of ${esc(DQ.monName(e.m))} needs about <b>${fmt(need)}</b>. You are ready.</p>`
    : `<p>${esc(span(min))} of ${esc(DQ.monName(e.m))} needs about <b>${fmt(need)}</b> meals. You carry <b>${fmt(e.have)}</b>: <b>${fmt(short)} more</b> to be safe.</p>`;
  let act = '';
  if (short > 0 && src) {
    const can = Math.floor(src.held / src.per), n = Math.min(short, can), name = D.ITEMS[src.out].name.toLowerCase();
    act = n > 0 ? `<div class="btnrow"><button class="btn primary" data-do="planfoodgo" data-a="${src.r.id}|${n}">Cook ${fmt(n)} ${esc(name)}${n < short ? ` (you hold fish for ${fmt(can)})` : ''}</button></div><p class="sm dim">One batch: it stops by itself when done and tells you it is complete.</p>`
      : src.node ? `<div class="btnrow"><button class="btn primary" data-do="planfoodfish" data-a="${src.node.id}">Catch ${esc(D.ITEMS[src.raw].name.toLowerCase())}</button></div><p class="sm dim">Catch about ${fmt(short * src.per)}, then plan again to cook them as one batch.</p>` : '';
  } else if (short > 0) act = `<p class="sm dim">Nothing you can cook here yet. The shop sells bread.</p>`;
  Q.closeModal && Q.closeModal();
  Q.modal({ title: 'Plan your food', body: `<div class="chips" role="group" aria-label="Expedition length">${chips}</div><div class="plan-food">${verdict}${act}</div>`, actions: [{ label: 'Close' }] });
};
Object.assign(UI.DO, {
  planfoodgo: a => { const [id, n] = String(a).split('|'); Q.closeModal && Q.closeModal(); if (Q.startAct('recipe', id, { limit: +n })) { Q.go(D.RECIPES[id].skill); } },
  planfoodfish: a => { Q.closeModal && Q.closeModal(); if (Q.startAct('fish', a)) Q.go('fishing'); }
});
})();
