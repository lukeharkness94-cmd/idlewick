/* Quest rewards, shown where you claimed them (Nov 2026): after Claim reward on the Quests page, the quest's own card
   turns into a short reveal. The giver thanks you, then each reward pops in one after another (skills, coins, items,
   anything learned) with its amount counting up. It stays in the quest window until you continue. Elapsed-time
   animation (no frame-locked steps); with reduced effects everything simply appears. */
(() => {
const DQ = window.DQ, D = DQ.data, UI = DQ.ui, S = () => DQ.S, { esc, fmt, ico } = DQ;
let reveal = null;
const claim0 = UI.DO.qclaim;
UI.DO.qclaim = (a, choice) => {
  const q = D.QM[a], ready = q && DQ.questState(q) === 'ready';
  if (!ready || UI.view !== 'quests') return claim0(a, choice);
  const card = document.querySelector('.qdetail > .quest'), rect = card && card.getBoundingClientRect(), tab = UI.questTab, selected = UI.tab.questSelected;
  const render = UI.render;
  // Claim updates state and HUD, but the surrounding quest list and selected card keep their identity.
  UI.render = () => { UI.renderHud(); UI.renderRail(); };
  try { claim0(a, choice); } finally { UI.render = render; UI.questTab = tab; UI.tab.questSelected = selected; }
  if (DQ.questState(q) === 'done') {
    // Quest/level events enqueue a redraw; this claim has already updated the surrounding UI in place.
    if (UI._rt) { clearTimeout(UI._rt); UI._rt = 0; }
    reveal = { id: a, at: 0, sel: selected, tab, height: rect ? rect.height / (DQ.zoom || 1) : 0 };
    UI.pageNotice = null;
    if (card) { const t = document.createElement('template'); t.innerHTML = html(); card.replaceWith(t.content.firstElementChild); }
    else UI.render(false);
    const row = document.querySelector('.qrow[data-a="' + a + '"]');
    if (row) { row.classList.remove('ready'); row.classList.add('done'); const state = row.querySelector('.state'); if (state) { state.textContent = '✓ Completed'; state.className = 'state done'; } }
    if (UI.renderPageNotice) UI.renderPageNotice(); animate();
  }
};
UI.DO.qrevealdone = () => { reveal = null; UI.render(false); };
const tiles = q => {
  const r = q.reward || {}, out = [];
  if (q.unlocks && D.SK[q.unlocks]) out.push({ cls: 'unlock', art: DQ.artImage ? DQ.artImage('skill', q.unlocks, 64) : ico(q.unlocks), n: 0, label: `Learned ${D.SK[q.unlocks].name}`, col: D.SK[q.unlocks].col });
  for (const [k, v] of Object.entries(r.xp || {})) if (D.SK[k]) out.push({ art: DQ.artImage ? DQ.artImage('skill', k, 64) : ico(k), n: v, unit: ' XP', label: D.SK[k].name, col: D.SK[k].col });
  if (r.coins) out.push({ art: `<span class="qr-coin">${ico('coin')}</span>`, n: r.coins, unit: '', label: 'coins', col: '#f3d58a' });
  for (const [k, v] of Object.entries(r.items || {})) if (D.ITEMS[k]) out.push({ art: DQ.itemIco(D.ITEMS[k]), n: v, unit: '×', pre: true, label: D.ITEMS[k].name, col: D.ITEMS[k].col || '#c8b890' });
  return out;
};
const html = () => {
  const q = D.QM[reveal.id]; if (!q) return '';
  const list = tiles(q), calm = S().settings.reduceFx;
  return `<section style="${reveal.height ? `height:${reveal.height}px;min-height:${reveal.height}px` : ''}" class="panel quest-reveal ${calm ? 'calm' : ''}" aria-live="polite"><div class="qrv-head">${DQ.folkPortrait ? DQ.folkPortrait(q.giver, 96, 'qrv-face') : ''}<div><span class="k">Quest complete</span><h2>${esc(q.name)}</h2>${q.thanks ? `<p class="qrv-thanks">${esc(q.giver)}: “${esc(q.thanks)}”</p>` : `<p class="qrv-thanks">${esc(q.giver)} thanks you.</p>`}</div></div>
    <div class="qrv-tiles">${list.map((t, i) => `<div class="qrv-tile ${t.cls || ''}" style="--c:${t.col};--i:${i}"><span class="qrv-art">${t.art}</span><b class="mono" ${t.n ? `data-count="${t.n}" data-unit="${esc(t.unit || '')}" data-pre="${t.pre ? 1 : ''}"` : ''}>${t.n ? (calm ? (t.pre ? fmt(t.n) + t.unit : fmt(t.n) + t.unit) : (t.pre ? '0' + t.unit : '0' + t.unit)) : '✦'}</b><small>${esc(t.label)}</small></div>`).join('')}</div>
    <div class="quest-actions"><button class="btn primary" data-do="qrevealdone">Continue</button></div></section>`;
};
/* amounts count up after each tile has popped in; driven by elapsed time */
const animate = () => {
  if (S().settings.reduceFx) return;
  const start = performance.now(), STAGGER = 160, POP = 260, COUNT = 700;
  const step = now => {
    const els = document.querySelectorAll('.quest-reveal [data-count]'); if (!els.length || !reveal) return;
    let busy = false;
    els.forEach(el => { const i = +el.closest('.qrv-tile').style.getPropertyValue('--i') || 0, t = (now - start - i * STAGGER - POP) / COUNT, k = Math.max(0, Math.min(1, t)), e = 1 - Math.pow(1 - k, 3), n = Math.round(+el.dataset.count * e), u = el.dataset.unit;
      el.textContent = el.dataset.pre ? fmt(n) + u : fmt(n) + u; if (k < 1) busy = true; });
    if (busy) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
};
const view0 = UI.V.quests;
UI.V.quests = () => {
  /* a different quest or tab chosen since the reveal opened (by any route) ends it */
  if (reveal && reveal.sel !== undefined && (UI.tab.questSelected !== reveal.sel || UI.questTab !== reveal.tab)) reveal = null;
  const h = view0(); if (reveal) { reveal.sel = UI.tab.questSelected; reveal.tab = UI.questTab; }
  if (!reveal) return h;
  const box = html(), i = h.indexOf('<div class="qdetail">');
  if (i < 0) return h.replace('</section>', '</section>' + box);
  const j = i + '<div class="qdetail">'.length, end = h.lastIndexOf('</div></div>');
  return h.slice(0, j) + box + h.slice(end);
};
/* choosing another quest or leaving the page ends the reveal */
const sel0 = UI.DO.qselect; if (sel0) UI.DO.qselect = a => { reveal = null; sel0(a); };
const go0 = DQ.go; DQ.go = (...a) => { if (a[0] !== 'quests') reveal = null; return go0(...a); };
})();
