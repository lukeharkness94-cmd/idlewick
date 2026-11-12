/* Choosing a companion for what it does for you (Nov 2026). Before capture the screen led with rarity, odds and timers.
   Now the selected beast is previewed by job (striker, provider, scholar, bossbreaker): what it gives at Bond 1 and at
   Bond 10, whether it fits how you play, how it compares with the companion with you, and how fieldwork differs from
   expeditions. When an expedition brings a beast home, a pop-up compares it with your current companion and offers
   "Bring along". Numbers come straight from the beast data. */
(() => {
const Q = window.DQ, D = Q.data, UI = Q.ui, S = () => Q.S, { esc, ico, fmt } = Q;
if (!D.BEAST_SPECIES) return;
const JOBS = {
  crit: { role: 'Striker', what: 'critical hits', short: 'more critical hits', fit: 'Best when you fight steadily with a sword, bow or staff: every fight lands a few more heavy hits.' },
  coin: { role: 'Provider', what: 'coins from kills', short: 'more coins from kills', fit: 'Best when coins are your bottleneck: shop gear, restorations and boats all cost them.' },
  xpAll: { role: 'Scholar', what: 'XP from everything', short: 'more XP from everything', fit: 'Best for long sessions: it speeds every skill, not just combat.' },
  boss: { role: 'Bossbreaker', what: 'damage against bosses', short: 'more damage against bosses', fit: 'Best before a boss: it only helps in boss fights, so train something else with a different companion.' }
};
const pct = v => `${+(v * 100).toFixed(1)}%`;
Q.beastJob = id => { const sp = Q.beastSpec(id); return sp && JOBS[sp.passive] ? JOBS[sp.passive] : null; };
/* what a species gives at bond 1 and bond 10 (milestones add up to 3 percentage points) */
const gives = id => { const sp = Q.beastSpec(id), j = Q.beastJob(id); if (!sp || !j) return null; return { now: sp.base, max: sp.base + .03, job: j, sp }; };
const same = (a, b) => a && b && a === b;
Q.beastCompare = id => { const g = gives(id), cur = S().pets.active, cg = cur && cur !== id ? gives(cur) : null; if (!g) return '';
  if (!cg) return cur === id ? 'This is the companion with you now.' : cur ? `${esc(D.PET[cur] ? D.PET[cur].name : 'Your companion')} is with you. This beast would replace it.` : 'You have no companion with you yet, so it would start helping at once.';
  return same(g.job.role, cg.job.role) ? `Same job as your ${esc(D.PET[cur].name)} (${esc(cg.job.role)}): ${pct(g.max)} at Bond 10 against ${pct(cg.max)}. Only one companion helps at a time.`
    : `Different job from your ${esc(D.PET[cur].name)}: a ${esc(g.job.role.toLowerCase())} (${pct(g.now)} ${esc(g.job.what)}) instead of a ${esc(cg.job.role.toLowerCase())} (${pct(cg.now)} ${esc(cg.job.what)}). Swap whenever your goal changes.`; };
const previewHtml = id => { const g = gives(id), got = !!S().pets.owned[id]; if (!g) return '';
  const p = D.PET[id], tr = S().pets.tracks[id] || 0;
  return `<section class="panel beast-preview"><div class="bp-head"><span class="bp-art ${got ? '' : 'blackout'}">${Q.petSprite(p, 64, got ? '' : 'sil')}</span><div><span class="k">${got ? 'Your companion' : 'Why choose it'} · ${esc(g.job.role)}</span><h3>${esc(p.name)}</h3></div></div>
    <p class="bp-line"><b>${pct(g.now)} ${esc(g.job.what)}</b> at Bond 1, growing to <b>${pct(g.max)}</b> at Bond 10${g.sp.evolution ? `, when it evolves into the ${esc(g.sp.evolution)}` : ''}.</p>
    <p class="bp-fit">${esc(g.job.fit)}</p><p class="bp-cmp">${Q.beastCompare(id)}</p>
    <p class="sm dim">Found around ${esc(D.TOWN[g.sp.town].name)} from Hero ${g.sp.hero}${got ? '' : ` · ${tr}/5 tracks toward a certain capture`}.</p></section>`; };
const howto = `<p class="beast-howto-line"><b>Expeditions</b> run for hours while you do something else. <b>Fieldwork</b> lays wooden traps as your own task and finds each region's signature companion.</p>`;
const page0 = UI.V.beastmastery;
UI.V.beastmastery = () => { let h = page0(); if (!Q.skillUnlocked('beastmastery') || UI.beastMode === 'field' || UI.beastMode === 'collection') return h;
  const targets = Q.beastTargets(), sel = targets.find(p => p.id === UI.beastTarget) || targets.find(p => !S().pets.owned[p.id]) || targets[0];
  /* on phones the preview goes after the lists so every control stays within the first screen */
  if (sel) h = innerWidth <= 860 ? h + previewHtml(sel.id) : h.replace('<section class="panel beast-expedition">', `${previewHtml(sel.id)}<section class="panel beast-expedition">`);
  return h.replace('<div class="beast-workspace"', `${howto}<div class="beast-workspace"`); };
/* target cards say what the beast does, not just rarity */
const r0 = UI.render;
UI.render = function (...a) { const r = r0.apply(this, a);
  try { if (UI.view === 'beastmastery') document.querySelectorAll('.beast-targets .beast-choice').forEach(b => { if (b.querySelector('.bc-job')) return; const j = Q.beastJob(b.dataset.a); if (j) b.querySelector('small').insertAdjacentHTML('beforebegin', `<em class="bc-job">${esc(j.role)}</em>`); }); } catch (e) { /* cosmetic */ }
  return r; };
/* a beast comes home: compare it with the companion you have and offer to bring it along */
const resolve0 = Q.resolveBeastTrap;
Q.resolveBeastTrap = function (...a) { const before = new Set(Object.keys(S().pets.owned)), r = resolve0.apply(this, a);
  if (r && !Q.forecasting) for (const id of Object.keys(S().pets.owned)) if (!before.has(id) && Q.beastJob(id) && Q.popupQueue) {
    const p = D.PET[id], cur = S().pets.active;
    Q.popupQueue({ title: 'A new companion', body: `<div class="beast-arrival"><div class="ba-art">${Q.petSprite(p, 96)}</div><div><h3>${esc(p.name)} · ${esc(Q.beastJob(id).role)}</h3><p>${esc(D.PET[id].text || '')}</p><p>${Q.beastCompare(id)}</p></div></div>`,
      actions: [{ label: cur && cur !== id ? `Keep ${D.PET[cur] ? D.PET[cur].name : 'current'}` : 'Later' }, { label: 'Bring along', primary: true, fn: () => Q.setPet(id) }] }); }
  return r; };
})();
