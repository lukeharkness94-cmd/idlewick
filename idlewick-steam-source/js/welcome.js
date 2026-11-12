/* Welcome back, at a glance (Nov 2026): a banner with your hero, how long you were away and how the task ended; a row
   of picture tiles for what you earned (skills, coins, creatures, items, level-ups) with big pixel numbers; one card
   for the next step; picture cards for other good options; your decisions; chips for anything waiting (quest
   rewards, research). Sentences only where a sentence helps. */
(() => {
const DQ = window.DQ, D = DQ.data, UI = DQ.ui, S = () => DQ.S, { esc, fmt, ico } = DQ;
const num = n => (n = Math.round(n), n >= 1e6 ? (n / 1e6).toFixed(n >= 1e7 ? 0 : 1) + 'M' : n >= 1e4 ? (n / 1e3).toFixed(n >= 1e5 ? 0 : 1) + 'k' : fmt(n));
const tile = (art, value, label, col, cls = '') => `<div class="wb-tile ${cls}" style="--c:${col}"><span class="wb-art">${art}</span><b class="wb-num">${value}</b><small>${esc(label)}</small></div>`;
const skillArt = k => DQ.artImage ? DQ.artImage('skill', k, 64) || ico(k) : ico(k);
UI.welcomeBody = (sum, gap) => {
  UI.welcomeOwnsChips = true;
  const eff = DQ.offlineEff(gap), capped = gap > DQ.OFFLINE_CAP, taper = eff < Math.min(gap, DQ.OFFLINE_CAP);
  const status = sum.died ? ['bad', 'skull', 'You were defeated'] : sum.stopped ? ['warn', 'clock', 'Your task stopped early'] : DQ.act ? ['ok', 'check', `${DQ.actLabel()} · still going`] : ['', 'clock', sum.label ? `You were ${sum.label.toLowerCase()}` : 'Nothing was running'];
  const banner = `<div class="wb-banner"><span class="wb-face">${UI.portrait ? UI.portrait(72) : ''}</span><div class="wb-hello"><span class="k">${esc(S().name || 'Hero')} · Hero ${DQ.advLvl()}</span><div class="wb-time">${esc(DQ.fmtTime(gap))}<small>away</small></div>${taper || capped ? `<small class="dim">counted as ${esc(DQ.fmtTime(eff))} of work</small>` : ''}</div><span class="wb-status ${status[0]}">${ico(status[1])}${esc(status[2])}</span></div>`;
  /* what you earned, as tiles */
  const xp = Object.entries(sum.xp || {}).sort((a, b) => b[1] - a[1]), items = Object.entries(sum.items || {}).filter(([id]) => D.ITEMS[id]).sort((a, b) => D.ITEMS[b[0]].val * b[1] - D.ITEMS[a[0]].val * a[1]).slice(0, 8);
  const levels = Object.entries((sum.levels || []).reduce((a, [k, l]) => (a[k] = l, a), {}));
  const tiles = [...levels.map(([k, l]) => tile(skillArt(k), `Lv ${l}`, `${D.SK[k].name} level up`, D.SK[k].col, 'level')),
    ...xp.map(([k, v]) => tile(skillArt(k), '+' + num(v), `${D.SK[k].name} XP`, D.SK[k].col)),
    sum.coins ? tile(`<span class="wb-coin">${ico('coin')}</span>`, '+' + num(sum.coins), 'coins', '#f3d58a') : '',
    sum.kills ? tile(`<span class="wb-coin">${ico('attack')}</span>`, num(sum.kills), 'defeated', '#e0564f') : '',
    ...items.map(([id, n]) => tile(DQ.itemIco(D.ITEMS[id]), '×' + num(n), D.ITEMS[id].name, D.ITEMS[id].col || '#c8b890'))].filter(Boolean);
  const earned = tiles.length ? `<div class="wb-sec"><span class="k">While you were away</span><div class="wb-tiles">${tiles.join('')}</div></div>`
    : `<div class="wb-sec"><div class="wb-empty">${ico('clock')}<span><b>Nothing happened.</b> Start a task before you leave and it keeps going.</span></div></div>`;
  /* the next step */
  const next = DQ.journeyNext();
  const goal = DQ.destLabel ? DQ.destLabel(S().journey) : 'Your goal';
  const nextCard = `<div class="wb-next"><span class="wb-next-ic">${ico('star')}</span><div><span class="k">${esc(goal)}</span><b>${esc(next.title)}</b><small>${esc(next.detail)}</small></div><button class="btn primary" data-do="${next.action}" data-a="${next.a || ''}" data-b="${next.b || ''}">${esc(next.title.length > 22 ? 'Go' : next.title)}</button></div>`;
  /* other good options, each with a picture */
  const opts = (DQ.returnChoices ? DQ.returnChoices() : []).map(x => { const [kind, id] = String(x.art || '').split(':');
    const art = kind === 'skill' ? skillArt(id) : kind === 'project' && DQ.pixelArt && DQ.pixelArt.stagePiece ? DQ.pixelArt.img(DQ.pixelArt.url('wb-site:' + id + ':' + (DQ.projectStage ? DQ.projectStage(id) : 0), () => DQ.pixelArt.stagePiece((D.PROJECTS[id] || {}).art || id, DQ.projectStage ? DQ.projectStage(id) : 0)), 32, 32, 64, '', '') : ico('star');
    return `<button class="wb-opt" data-do="returnpick" data-a="${x.action}" data-b="${x.a}"><span class="wb-art">${art}</span><span><b>${esc(x.title)}</b><small>${esc(x.text)}</small></span></button>`; }).join('');
  /* anything waiting for you */
  const ready = D.QUESTS.filter(q => DQ.questState(q) === 'ready').length, research = DQ.awayDone || [];
  const chips = [ready ? `<button class="wb-chip" data-do="returnpick" data-a="go" data-b="quests">${ico('quest')}<b class="wb-num">${ready}</b> quest reward${ready > 1 ? 's' : ''} to claim</button>` : '', research.length ? `<span class="wb-chip">${ico('research')}Research finished: ${research.map(esc).join(', ')}</span>` : ''].filter(Boolean).join('');
  const extras = UI.returnExtras(sum);
  return `<div class="wb">${banner}${earned}${chips ? `<div class="wb-chips">${chips}</div>` : ''}${nextCard}${opts ? `<div class="wb-sec"><span class="k">Other good options</span><div class="wb-opts">${opts}</div></div>` : ''}${extras}${capped ? `<p class="sm dim wb-fine">Full speed for the first 2 hours away, half speed after that, and nothing past 8 hours.</p>` : ''}</div>`;
};
})();
