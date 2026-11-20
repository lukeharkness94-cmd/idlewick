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
  /* decisions straight after what you earned: they need an answer, everything below is optional */
  const nDec = (S().inbox || []).length, decide = nDec || (DQ.eventResults || []).length ? `<div class="wb-sec wb-decide"><div class="wb-decide-h"><span class="k">${nDec ? `Decide · ${nDec} thing${nDec > 1 ? 's' : ''} happened while you were away` : 'Decided'}</span></div><div class="events" id="inboxbox">${UI.inboxHtml()}</div></div>` : '';
  const extras = UI.returnExtras(sum);
  /* 20 Nov (owner): decisions first, then clear "what next" actions, then three more things to do, then what you earned */
  const act = (label, title, detail, btn, doAct, a = '', b = '', primary = false) => `<div class="wb-do"><span class="wb-do-k">${esc(label)}</span><div><b>${esc(title)}</b>${detail ? `<small>${esc(detail)}</small>` : ''}</div><button class="btn ${primary ? 'primary' : ''}" data-do="returnpick" data-a="${doAct}" data-b="${esc(String(a))}"${b ? ` data-c="${esc(String(b))}"` : ''}>${esc(btn)}</button></div>`;
  const readyQ = D.QUESTS.filter(q => DQ.questState(q) === 'ready'), rows = [];
  if (readyQ.length) rows.push(act('Claim', readyQ.length > 1 ? `${readyQ.length} quest rewards are ready` : `“${readyQ[0].name}” is ready`, readyQ.length > 1 ? readyQ.slice(0, 3).map(q => q.name).join(', ') : `Return to ${readyQ[0].giver}`, readyQ.length > 1 ? 'Claim rewards' : 'Claim reward', 'openquest', readyQ[0].id, '', true));
  if (DQ.act) rows.push(act('Continue', DQ.actLabel(), 'Still going', 'Watch', 'go', DQ.actPage() || 'overview'));
  else if (S().lastAct) rows.push(act('Continue', `Your last task: ${DQ.actLabel(S().lastAct) || 'carry on'}`, sum.stopped ? 'It stopped while you were away' : '', 'Start again', 'resume', '', '', !readyQ.length));
  rows.push(act('Your quest', next.title, `${goal} · ${next.detail}`, next.title.length > 22 ? 'Go' : next.title, next.action, next.a || '', next.b || '', !readyQ.length && !!DQ.act));
  const whatNext = `<div class="wb-sec"><span class="k">What next</span><div class="wb-dos">${rows.join('')}</div></div>`;
  /* three more things: closest restoration, a skill about to level, the nearest quest, or one not started yet */
  const more = (DQ.returnChoices ? DQ.returnChoices() : []).map(x => ({ ...x }));
  const journeyQ = S().journey && D.QM[S().journey] ? S().journey : null;
  const named = `${next.title} ${next.detail}`, activeQ = D.QUESTS.filter(q => DQ.questState(q) === 'active' && q.id !== journeyQ && !named.includes(q.name)).map(q => ({ q, pct: UI.questProgress ? UI.questProgress(q).pct : 0 })).sort((a, b) => b.pct - a.pct)[0];
  if (activeQ) more.push({ title: `Nearly there: ${activeQ.q.name}`, text: `${Math.round(activeQ.pct)}% done · ${activeQ.q.giver}`, action: 'openquest', a: activeQ.q.id, art: 'quest' });
  const newQ = D.QUESTS.find(q => DQ.questState(q) === 'new' && q.town === S().town && !named.includes(q.name));
  if (newQ) more.push({ title: `New: ${newQ.name}`, text: `${newQ.giver} has a job for you`, action: 'openquest', a: newQ.id, art: 'quest' });
  const opt3 = more.slice(0, 3).map(x => { const [kind, id] = String(x.art || '').split(':');
    const art = kind === 'skill' ? skillArt(id) : kind === 'project' && DQ.pixelArt && DQ.pixelArt.stagePiece ? DQ.pixelArt.img(DQ.pixelArt.url('wb-site:' + id + ':' + (DQ.projectStage ? DQ.projectStage(id) : 0), () => DQ.pixelArt.stagePiece((D.PROJECTS[id] || {}).art || id, DQ.projectStage ? DQ.projectStage(id) : 0)), 32, 32, 64, '', '') : ico(kind === 'quest' ? 'quest' : 'star');
    return `<button class="wb-opt" data-do="returnpick" data-a="${x.action}" data-b="${x.a}"><span class="wb-art">${art}</span><span><b>${esc(x.title)}</b><small>${esc(x.text)}</small></span></button>`; }).join('');
  const research_ = research.length ? `<div class="wb-chips"><span class="wb-chip">${ico('research')}Research finished: ${research.map(esc).join(', ')}</span></div>` : '';
  return `<div class="wb">${banner}${decide}${whatNext}${opt3 ? `<div class="wb-sec"><span class="k">More to do</span><div class="wb-opts">${opt3}</div></div>` : ''}${research_}${earned}${extras}${capped ? `<p class="sm dim wb-fine">Full speed for the first 2 hours away, half speed after that, and nothing past 8 hours.</p>` : ''}</div>`;
};
})();
