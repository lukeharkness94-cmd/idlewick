/* Idlewick: UI for task plans (pace, stop rules, queue), away decisions and combat builds. */
(() => {
const DQ = window.DQ, D = DQ.data, UI = DQ.ui, { $, $$, ico, fmt, fmtK, esc } = DQ;
const S = () => DQ.S;

/* ---------- Plan window ---------- */
const paceSeg = (cur, act) => `<div class="seg pace">${Object.entries(D.PACE).map(([k, p]) => `<button class="${cur === k ? 'on' : ''}" data-do="${act}" data-a="${k}" data-tip="text:${p.name}: ${esc(p.text)}">${p.name}</button>`).join('')}</div>`;
const ruleChips = (cur, act, extra = '') => `<div class="chips rules">${D.STOP_RULES.map(([k, n]) => `<button class="chip ${cur === k ? 'on' : ''}" data-do="${act}" data-a="${k}" ${extra}>${n}</button>`).join('')}</div>`;
UI.planHtml = () => {
  const a = DQ.act, Q = S().queue || [], slots = DQ.queueSlots();
  const prog = a && DQ.ruleProgress(a), sup = a && DQ.supplyInfo(a);
  const cur = a ? `<div class="plan-cur"><div class="k">Now</div><h3>${DQ.actLabel()}</h3>
      <div class="plan-row"><span class="k">Pace</span>${paceSeg(a.pace || 'steady', 'setpace')}</div><p class="sm dim">${D.PACE[a.pace || 'steady'].text}</p>
      <div class="plan-row"><span class="k">Stop</span>${ruleChips(a.rule || 'none', 'setrule')}</div>
      ${prog ? `<div class="sm">Progress: <b class="mono">${fmt(prog[0])} / ${fmt(prog[1])} ${prog[2]}</b></div>` : ''}
      ${sup ? `<div class="sm ${sup.n ? '' : 'bad'}">${ico('bag')} Supplies: ${sup.label}${sup.ms ? ` (about ${DQ.fmtTime(sup.ms)})` : ''}</div>` : ''}</div>`
    : `<p class="dim">Nothing is running. Queue a task with the <b>+</b> button on any card, or just click a card to start it.</p>`;
  const rows = Q.map((t, i) => `<div class="qitem"><span class="qn mono">${i + 1}</span><div class="qbody"><b>${DQ.actLabel(t)}</b>
      <div class="qctl"><select data-in="qrule" data-i="${i}" aria-label="Stop rule">${D.STOP_RULES.filter(r => r[0] !== 'none').map(([k, n]) => `<option value="${k}" ${t.rule === k ? 'selected' : ''}>${n}</option>`).join('')}</select>
      <select data-in="qpace" data-i="${i}" aria-label="Pace">${Object.entries(D.PACE).map(([k, p]) => `<option value="${k}" ${t.pace === k ? 'selected' : ''}>${p.name}</option>`).join('')}</select></div></div>
      <div class="qbtns"><button class="iconb sm" data-do="qup" data-a="${i}" aria-label="Move up" ${i ? '' : 'disabled'}>${ico('chevron', 'up')}</button><button class="iconb sm" data-do="qdel" data-a="${i}" aria-label="Remove">${ico('close')}</button></div></div>`).join('');
  return `${cur}<div class="plan-q"><div class="phead" style="margin:14px 0 8px"><h3>Queue <small class="mono">${Q.length} / ${slots}</small></h3>${Q.length ? '<button class="linkbtn" data-do="qclear">Clear</button>' : ''}</div>
    ${rows || '<p class="sm dim" style="margin:0">Empty. When the current task finishes or runs out of supplies, the next one starts by itself, even while you are away.</p>'}
    <p class="hint">New tasks start at <b>${D.PACE[S().defPace || 'steady'].name}</b> pace. ${paceSeg(S().defPace || 'steady', 'defpace')}</p></div>`;
};
UI.openPlan = () => { const m = DQ.modal({ title: 'Task plan', wide: true, body: `<div id="planbody">${UI.planHtml()}</div>`, actions: [{ label: 'Done', primary: true }] }); m.classList.add('planmodal'); };
const replan = () => { const b = $('#planbody'); if (b) b.innerHTML = UI.planHtml(); UI.renderHud(); if (UI.view === 'overview') UI.refresh(); };
DQ.on('queue', replan);

/* ---------- Now playing: compact plan summary on the overview ---------- */
UI.planSummary = () => {
  const a = DQ.act, Q = S().queue || []; if (!a && !Q.length) return '';
  const prog = a && DQ.ruleProgress(a), sup = a && DQ.supplyInfo(a);
  return `<div class="plansum">${a ? `<span class="tag">${D.PACE[a.pace || 'steady'].name}</span> <span class="sm">${DQ.ruleText(a.rule, a)}${prog ? ` · <span class="mono">${fmt(prog[0])}/${fmt(prog[1])}</span>` : ''}</span>` : ''}
    ${sup ? `<div class="sm dim">${ico('bag')} ${sup.label}</div>` : ''}${Q.length ? `<div class="sm dim">Up next: ${Q.slice(0, 2).map(t => DQ.actLabel(t)).join(', ')}${Q.length > 2 ? '…' : ''}</div>` : ''}
    <button class="btn sm" data-do="plan">${ico('clock')} Plan and queue</button></div>`;
};

/* ---------- Decisions from time away ---------- */
UI.inboxHtml = () => { const L = S().inbox || []; return L.map(e => `<div class="event" style="--c:${e.col}"><span class="ev-ic">${ico(e.ic)}</span><div class="ev-b"><b>${esc(e.title)}</b><p class="sm">${esc(e.text)}</p><div class="ev-opts">${e.opts.map(([k, l, sub], i) => `<button class="btn sm ${i ? '' : 'primary'}" data-do="decide" data-a="${e.id}" data-b="${k}" ${sub ? `data-tip="text:${esc(sub)}"` : ''}>${esc(l)}</button>`).join('')}</div>${e.opts.some(o => o[2]) ? `<small class="dim">${e.opts.filter(o => o[2]).map(o => `${esc(o[1])}: ${esc(o[2])}`).join(' · ')}</small>` : ''}</div></div>`).join(''); };
UI.inboxPanel = () => (S().inbox || []).length ? `<section class="panel inboxp fancy"><div class="phead"><h2>Decisions waiting</h2><small>From your time away</small></div><div class="events" id="inboxbox">${UI.inboxHtml()}</div></section>` : '';
UI.returnExtras = sum => {
  const L = S().inbox || [], tips = [];
  const raw = Object.keys(sum.items || {}).filter(id => id.startsWith('raw_') && DQ.have(id));
  if (raw.length && DQ.skillUnlocked('cooking')) { const id = raw.sort((a, b) => DQ.have(b) - DQ.have(a))[0], r = D.RECIPES['cook_' + id.slice(4)]; if (r && DQ.lvl('cooking') >= r.lvl) tips.push(`<button class="btn sm" data-do="qquick" data-a="recipe" data-b="${r.id}">${ico('cooking')} Queue cooking ${fmt(DQ.have(id))} ${D.ITEMS[id].name.toLowerCase()}</button>`); }
  const ore = Object.keys(sum.items || {}).find(id => id.startsWith('ore_')), sr = ore && D.RLIST.smithing.find(r => r.tab === 'Bars' && r.in[ore] && DQ.canMake(r) && DQ.lvl('smithing') >= r.lvl);
  if (sr && DQ.skillUnlocked('smithing')) tips.push(`<button class="btn sm" data-do="qquick" data-a="recipe" data-b="${sr.id}">${ico('smithing')} Queue smelting ${sr.name.toLowerCase()}</button>`);
  if (Object.keys({ ...S().inv, ...S().bank }).some(id => D.ITEMS[id].type === 'junk')) tips.push(`<button class="btn sm" data-do="sellall">${ico('coin')} Sell all junk</button>`);
  return (L.length ? `<div class="k" style="margin:16px 0 8px">Decisions</div><div class="events" id="inboxbox">${UI.inboxHtml()}</div>` : '') + (tips.length ? `<div class="k" style="margin:16px 0 8px">What next?</div><div class="btnrow wrap">${tips.join('')}</div>` : '');
};
DQ.on('inbox', () => { $$('#inboxbox').forEach(b => b.innerHTML = UI.inboxHtml() || '<p class="sm dim" style="margin:0">All settled.</p>'); UI.renderHud(); if (UI.view === 'overview' && !(S().inbox || []).length) UI.refresh(); });

/* ---------- Combat build pieces ---------- */
const dchip = (t, cls) => { const d = D.DTYPES[t]; return `<span class="dchip ${cls}" style="--c:${d.col}" data-tip="text:${d.name}">${ico(d.ic)}${d.name}</span>`; };
UI.weakChips = m => {
  if (!DQ.weakKnown(m)) return `<span class="dchip unk" data-tip="text:Defeat ${D.STUDY_KILLS} to learn its weaknesses">? weakness</span>`;
  const w = DQ.weakOf(m); return w.weak.map(t => dchip(t, 'weak')).join('') + w.resist.slice(0, 2).map(t => dchip(t, 'res')).join('');
};
UI.weaponLine = () => {
  const wt = D.weaponType(), W = D.WTYPES[wt], dt = DQ.myDtype();
  const spells = wt === 'staff' ? `<div class="chips spellpick">${D.SPELLS.filter(sp => DQ.lvl('magic') >= sp.lvl).map(sp => { const el = D.DTYPES[D.SPELL_EL[sp.id]]; return `<button class="chip ${S().spell === sp.id ? 'on' : ''}" style="--c:${el.col}" data-do="spell" data-a="${sp.id}">${ico(el.ic)}${sp.name}<small>${el.name}</small></button>`; }).join('')}</div>` : '';
  return `<div class="wline"><span class="tag">${W.name}</span> ${dt ? dchip(dt, '') : ''} <small class="mono">${(W.speed / 1000).toFixed(1)}s per attack</small></div><small class="dim">${W.note}.${wt === 'staff' ? ' Pick the element for your spells:' : ' Change weapons on the Inventory page.'}</small>${spells}`;
};
UI.abilityPanel = () => {
  const on = S().abilities || [], slots = DQ.abilSlots();
  return `<section class="panel"><div class="phead"><h2>Abilities</h2><small class="mono">${on.length} / ${slots} slots</small></div><div class="abils">${D.ABIL.map(a => {
    const unl = DQ.abilUnlocked(a), sel = on.includes(a.id), active = DQ.ability(a.id), why = !unl ? `${D.SK[a.skill].name} ${a.lvl}` : sel && !active ? (a.needShield && !S().equip.shield ? 'needs a shield' : `${a.style} only`) : '';
    return `<button class="abil ${sel ? 'on' : ''} ${unl ? '' : 'locked'} ${sel && !active ? 'idle' : ''}" data-do="abil" data-a="${a.id}" data-tip="text:${esc(a.name)}: ${esc(a.text)}">${ico(unl ? a.ic : 'lock')}<span><b>${a.name}</b><small>${why || (a.style ? DQ.cap(a.style) : 'Any style')}</small></span></button>`;
  }).join('')}</div><p class="hint">Abilities trigger on their own. Slot the ones that counter what you are fighting. A third slot opens at combat level 40.</p></section>`;
};
UI.bossIntel = m => {
  const B = D.BOSSMECH[m.id]; if (!B) return '';
  const w = DQ.weakOf(m), mu = DQ.matchup(m);
  const alternatives = Object.keys({ ...S().inv, ...S().bank }).filter(id => D.ITEMS[id].slot && D.ITEMS[id].slot !== 'ammo' && DQ.canEquip(id).ok && S().equip[D.ITEMS[id].slot] !== id);
  const compare = alternatives.length ? `<details><summary>Compare an equipment change</summary><p class="sm">Simulate your current build and one item you own, using your current health and food. Results are estimates from separate trial fights.</p><div class="btnrow wrap">${alternatives.map(id => `<button class="btn sm" data-do="comparegear" data-a="${m.id}" data-b="${id}">${esc(D.ITEMS[id].name)}</button>`).join('')}</div></details>` : '';
  return `<div class="intel"><div class="k">Prepare for this fight</div><p class="sm">Health ${Math.ceil(S().hp)} / ${DQ.maxHp()} · ${DQ.supplyInfo({kind:'fight'})?.label || 'No supplies'}. Auto-eat ${S().settings.autoEat ? 'on' : 'off'}.</p><div class="btnrow wrap"><button class="btn sm" data-do="go" data-a="character">Review equipment</button><button class="btn sm" data-do="go" data-a="cooking">Prepare food</button></div><p class="sm">${B.text}</p>
    ${m.id === 'hollowking' ? '' : `<div class="chips">${w.weak.map(t => dchip(t, 'weak')).join('')}${w.resist.map(t => dchip(t, 'res')).join('')}</div>`}
    <div class="sm"><b>Counters:</b> ${B.counters.join(' · ')}</div>
    <div class="match">${mu.map(([k, t]) => `<div class="${k === 'good' ? 'ok' : k === 'bad' ? 'bad' : 'dim'}">${k === 'good' ? '✓' : k === 'bad' ? '✗' : '•'} ${t}</div>`).join('')}</div>
    <div class="btnrow"><button class="btn sm" data-do="forecast" data-a="${m.id}">${ico('clock')} Battle forecast</button><span id="fc-${m.id}" class="sm" aria-live="polite"></span></div>${compare}</div>`;
};
DQ.tips.mon = (orig => id => { const m = D.MON[id]; let h = orig ? orig(id) : ''; if (DQ.weakKnown(m)) { const w = DQ.weakOf(m); h += `<div>Weak: ${w.weak.map(t => D.DTYPES[t].name).join(', ') || 'nothing'}</div><div class="dim">Resists: ${w.resist.map(t => D.DTYPES[t].name).join(', ') || 'nothing'}</div>`; } else h += `<div class="dim">Defeat ${D.STUDY_KILLS} to learn its weaknesses.</div>`; return h; })(DQ.tips.mon);

/* ---------- Queue buttons on every task card ---------- */
const origRender = UI.render;
UI.render = fresh => {
  origRender(fresh);
  $$('#view .card[data-do="act"]:not(.locked)').forEach(c => { const s = document.createElement('span'); s.className = 'qadd'; s.setAttribute('role', 'button'); s.dataset.do = 'queueadd'; s.dataset.a = c.dataset.a; s.dataset.b = c.dataset.b; s.dataset.tip = 'text:Add to your queue'; s.innerHTML = ico('arrow'); c.appendChild(s); });
};

/* ---------- Actions ---------- */
Object.assign(UI.DO, {
  plan: () => UI.openPlan(),
  setpace: a => { if (!DQ.act) return; DQ.act.pace = a; S().act.pace = a; S().lastPace = a; DQ.act.dur = DQ.actDur(DQ.act); DQ.sfx('tab'); replan(); },
  setrule: a => { if (!DQ.act) return; DQ.act.rule = a; S().act.rule = a; DQ.act.count = 0; DQ.act.elapsed = 0; const sk = DQ.actSkill(DQ.act); DQ.act.lvlTarget = sk ? DQ.lvl(sk) + 1 : 0; S().act.lvlTarget = DQ.act.lvlTarget; DQ.sfx('tab'); replan(); },
  defpace: a => { S().defPace = a; DQ.sfx('tab'); replan(); },
  queueadd: (a, b) => DQ.queueAdd(a, b, 'time:30'),
  qquick: (a, b) => { DQ.queueAdd(a, b, 'none'); DQ.closeModal(); },
  qdel: a => { S().queue.splice(+a, 1); DQ.emit('queue'); },
  qup: a => { const Q = S().queue, i = +a; if (i > 0) { [Q[i - 1], Q[i]] = [Q[i], Q[i - 1]]; DQ.emit('queue'); } },
  qclear: () => { S().queue = []; DQ.emit('queue'); },
  decide: (a, b) => DQ.resolveEvent(a, b),
  abil: a => { if (DQ.toggleAbility(a)) { DQ.sfx('equip'); UI.render(false); } },
  comparegear: (a, b) => {
    const el = document.getElementById('fc-' + a); if (!el) return;
    el.textContent = 'Comparing builds…';
    setTimeout(() => {
      const current = DQ.forecast(a), candidate = DQ.forecast(a, b);
      if (!current || !candidate || current.blocked || candidate.blocked) { el.textContent = 'This build cannot start the fight. Check level, location and ammunition.'; return; }
      el.textContent = `Current build: ${current.wins}/${current.trials} wins. With ${D.ITEMS[b].name}: ${candidate.wins}/${candidate.trials} wins. Current health and available food; equipment stays as equipped.`;
    }, 30);
  },
  forecast: a => { const el = document.getElementById('fc-' + a); if (el) el.textContent = 'Simulating…'; setTimeout(() => { const r = DQ.forecast(a); if (!el) return; if (!r || r.blocked) { el.innerHTML = '<span class="bad">Cannot fight it right now.</span>'; return; } const pct = Math.round(r.winRate * 100); el.innerHTML = `<b class="${pct >= 80 ? 'ok' : pct >= 40 ? '' : 'bad'}">${pct >= 80 ? 'Favourable' : pct >= 40 ? 'Uncertain' : 'Dangerous'}</b> · ${r.wins}/${r.trials} simulated wins at your current health, with your available food${r.wins ? ` · about ${Math.round(r.avgMs / 1000)}s · ${r.foodPerKill.toFixed(1)} food` : ''}`; }, 30); },
});
document.addEventListener('change', e => {
  const t = e.target, k = t.dataset && t.dataset.in; if (k !== 'qrule' && k !== 'qpace') return;
  const q = S().queue[+t.dataset.i]; if (!q) return; if (k === 'qrule') q.rule = t.value; else q.pace = t.value; DQ.emit('queue');
});
})();
