/* Idlewick: the Bestiary as a field guide. Defeating a monster again and again teaches you more about it:
   sighting, weak points, vitals, its full drop table, field notes and finally its legend. */
(() => {
const DQ = window.DQ, D = DQ.data, UI = DQ.ui, { $, $$, ico, fmt, esc } = DQ;
const S = () => DQ.S;
const RANKS = D.RESEARCH.ranks, KEYS = RANKS.map(r => r[0]);

/* ---------- research state ---------- */
DQ.killsOf = m => Math.floor((S().beast.kills[m.id] || 0) * (1 + (DQ.fx ? DQ.fx().study : 0)));
DQ.researchAt = m => m.boss ? D.RESEARCH.boss : D.RESEARCH.regular;
/* Understanding (approved Nov 2026): one optional objective per creature that shows you learned it, with a fair
   alternative route so no style is forced. Ordinary creatures: 10 wins whose finishing blow used a weak point, or 25
   more defeats after its weak point is known. Bosses: answer its special 5 times (Brace, Shield Bash, Arcane Ward, or
   simply survive it), or defeat it 3 times. Reward: the next research stage early (its usual coins) and, for bosses,
   a gold rim on the trophy. */
DQ.understanding = m => {
  const B = S().beast, T = DQ.researchAt(m), k = B.kills[m.id] || 0;
  if (m.boss) { const a = (B.answered || {})[m.id] || 0; return { main: 'Answer its special 5 times (Brace, Shield Bash, Arcane Ward, or survive it)', have: Math.min(5, a), need: 5, alt: 'or defeat it 3 times', altHave: Math.min(3, k), altNeed: 3, done: a >= 5 || k >= 3 }; }
  const w = (B.weakWins || {})[m.id] || 0, altNeed = (T[1] || 1) + 25;
  return { main: 'Win 10 times using its weak point', have: Math.min(10, w), need: 10, alt: `or reach ${altNeed} defeats`, altHave: Math.min(altNeed, k), altNeed, done: w >= 10 || k >= altNeed };
};
DQ.understood = id => { const m = D.MON[id]; return !!m && DQ.understanding(m).done; };
DQ.research = m => {
  const k = DQ.killsOf(m), T = DQ.researchAt(m); let rank = 0; T.forEach(t => { if (k >= t) rank++; });
  if (rank >= 1 && rank < T.length && DQ.understanding(m).done) rank++;
  return { kills: k, rank, next: rank < T.length ? T[rank] : null, need: rank < T.length ? T[rank] - k : 0, T };
};
DQ.knows = (m, key) => DQ.research(m).rank >= KEYS.indexOf(key) + 1;
DQ.weakKnown = m => m.boss || DQ.knows(m, 'weak');
DQ.researchTotals = () => { const t = { sighted: 0, done: 0, ranks: 0, byRank: [0, 0, 0, 0, 0, 0, 0] }; D.MONLIST.forEach(m => { const r = DQ.research(m); if (r.rank >= 1) t.sighted++; if (r.rank >= 6) t.done++; t.ranks += r.rank; for (let i = 1; i <= r.rank; i++) t.byRank[i]++; }); return t; };

/* ---------- every new rank pays a little, and says so (not while you are away) ---------- */
const recordKill = DQ.recordKill;
DQ.recordKill = (m, drops) => {
  const before = DQ.research(m).rank; recordKill(m, drops); const after = DQ.research(m).rank;
  for (let r = before + 1; r <= after; r++) {
    const coins = r >= 2 ? Math.round(40 * Math.pow(D.TOWN[m.town].idx + 1, 1.35) * r) : 0;
    if (coins) DQ.addCoins(coins, { noStat: true });
    if (!DQ.sim.on && !DQ.forecasting) DQ.notify({ kind: 'info', key: 'research:' + m.id, icon: 'book', col: '#d8a64a', title: `Bestiary: ${m.name}`, text: `New entry: ${RANKS[r - 1][1]}. ${RANKS[r - 1][2]}.${coins ? ` +${fmt(coins)} coins.` : ''}`, action: { label: 'Open field guide', fn: () => UI.openGuide(m.id) }, sound: 'perk', ttl: 9000 });
  }
};

/* ---------- achievements ---------- */
const cnt = rank => () => DQ.researchTotals().byRank[rank];
[['field_notes', 'Field Notes', 'Learn the vitals of 5 monsters.', 5, cnt(3), 400], ['naturalist', 'Naturalist', 'Learn the full drop table of 10 monsters.', 10, cnt(4), 1500],
 ['lorekeeper', 'Lorekeeper', 'Write up the field notes of 10 monsters.', 10, cnt(5), 6000], ['legend_hunter', 'Legend Hunter', 'Uncover the legend of 5 monsters.', 5, cnt(6), 20000],
 ['beast_master', 'Beast Master', 'Uncover the legend of every monster in the realm.', D.MONLIST.length, cnt(6), 150000]]
  .forEach(([id, name, desc, goal, val, coins]) => D.ACH.push({ id, name, desc, goal, val, coins, ic: 'book' }));

/* ---------- the monsters page, as a field guide ---------- */
const pips = r => `<span class="rpips" aria-label="Research ${r.rank} of 6">${[1, 2, 3, 4, 5, 6].map(i => `<i class="${i <= r.rank ? 'on' : ''}"></i>`).join('')}</span>`;
const nextLine = (m, r) => r.next == null ? 'Fully researched' : `${r.need} more defeat${r.need > 1 ? 's' : ''}: ${RANKS[r.rank][1]}`;
const origBest = UI.V.bestiary;
UI.V.bestiary = () => {
  if (UI.beastTab !== 'monsters') return origBest();
  const B = S().beast, tot = DQ.researchTotals(), stars = id => '★'.repeat(DQ.beastStars(id)) + '☆'.repeat(3 - DQ.beastStars(id));
  const groups = D.TOWNS.map(t => `<div class="sgroup"><div class="k">${DQ.townUnlocked(t.id) ? esc(t.name) : '???'}</div><div class="beasts">${D.MONLIST.filter(m => m.town === t.id).map(m => {
    const r = DQ.research(m), seen = r.rank >= 1;
    return `<button class="beast ${seen ? '' : 'unk'} ${m.boss ? 'bossb' : ''}" style="--c:${m.col}" data-do="guide" data-a="${m.id}">${DQ.monSprite(m, 72, seen ? 'bob' : 'sil')}<div><b>${seen ? esc(m.name) : '???'}</b>${pips(r)}<small>${seen ? `Lv ${m.cl} · ${fmt(r.kills)} defeated · <span class="stars" data-tip="text:Slayer goals at 10, 50 and 250 defeats: each adds 4% damage against this monster, and the last earns a title (bosses: a trophy at 10, a title at 50).">${stars(m.id)}</span>` : 'Defeat it to add it to the guide'}</small><small class="dim">${seen ? nextLine(m, r) : ''}</small></div></button>`;
  }).join('')}</div></div>`).join('');
  const ladder = RANKS.map((x, i) => `<span class="lad" data-tip="text:${esc(x[2])}"><b>${i + 1}</b>${x[1]}<small>${D.RESEARCH.regular[i]} defeat${D.RESEARCH.regular[i] > 1 ? 's' : ''}</small></span>`).join('');
  return `<section class="panel shophead"><div><span class="k">Bestiary</span><h2>${tot.sighted} of ${D.MONLIST.length} monsters met · ${tot.done} fully researched</h2></div><div class="tabs">${[['monsters', 'Field guide'], ['pets', 'Creatures']].map(([k, n]) => `<button class="tab ${UI.beastTab === k ? 'on' : ''}" data-do="beasttab" data-a="${k}">${n}</button>`).join('')}</div></section>
    <section class="panel"><div class="phead"><h2>Field guide</h2></div>${groups}
      <div class="ladder"><div class="k">How research works</div><p class="sm dim" style="margin:4px 0 8px">Each new entry pays a few coins. Bosses are studied faster.</p><div class="lads">${ladder}</div></div></section>`;
};

/* ---------- one monster's entry ---------- */
const RAR_COL = { common: '#c9c3b3', uncommon: '#5cc08a', rare: '#5f9bff', epic: '#c07aff' };
UI.openGuide = id => {
  const m = D.MON[id]; if (!m) return; const r = DQ.research(m), seen = r.rank >= 1, B = S().beast, T = r.T, lore = D.LORE[id] || {};
  const lock = i => `<div class="gsec locked"><div class="gh">${ico('lock')}<b>${RANKS[i][1]}</b><small>${RANKS[i][2]}</small></div><p class="dim">Defeat it ${T[i] - r.kills} more time${T[i] - r.kills > 1 ? 's' : ''} to learn this.</p></div>`;
  const sec = (i, body) => r.rank > i ? `<div class="gsec"><div class="gh"><b>${RANKS[i][1]}</b><small>${RANKS[i][2]}</small></div>${body}</div>` : lock(i);
  const drops = (() => {
    const all = DQ.knows(m, 'drops'); const rows = m.drops.slice().sort((a, b) => b[2] - a[2]).map(([item, , p]) => {
      const found = !!B.drops[id + ':' + item], rar = D.rarityOf(p), it = D.ITEMS[item];
      if (!all && !found) return ''; return `<div class="gdrop ${found ? 'got' : ''}"><span class="itm sm" style="--c:${it.col}">${ico(it.ic)}</span><b style="color:${RAR_COL[rar[0]]}">${esc(it.name)}</b>${it.unique ? ` <span class="tag" data-tip="text:${esc(it.unique.name + ': ' + it.unique.text)}">Unique</span>` : ''}<small>${it.unique && !m.boss && !(S().uniqFound || {})[item] ? `first copy guaranteed within ${Math.ceil(2.5 / p)} defeats (${Math.min((S().upity || {})[item] || 0, Math.ceil(2.5 / p))} so far) · ` : ''}${rar[1]}${DQ.knows(m, 'legend') ? ` · about 1 in ${fmt(Math.round(1 / p))}` : ''}</small><span class="gmark">${found ? 'Found' : 'Not found yet'}</span></div>`;
    }).join('');
    const hidden = all ? 0 : m.drops.filter(d => !B.drops[id + ':' + d[0]]).length;
    return `${rows}${hidden ? `<p class="dim" style="margin:6px 0 0">${hidden} more item${hidden > 1 ? 's' : ''} you have not found yet. Reach the <b>Drop table</b> entry${r.rank <= 3 ? ` (${fmt(T[3] - r.kills)} more defeat${T[3] - r.kills > 1 ? 's' : ''})` : ''} to see them all.</p>` : ''}`;
  })();
  const dr = r.rank > 3 ? drops : (drops || '<p class="dim" style="margin:0">Nothing found yet.</p>');
  const body = `<div class="ghead" style="--c:${m.col}"><div class="gsprite">${DQ.monSprite(m, 96, seen ? 'bob' : 'sil')}</div><div class="gtitle"><h3>${seen ? esc(m.name) : '???'}</h3><small>${seen ? `${m.boss ? 'Boss · ' : ''}${esc(D.TOWN[m.town].name)} · Level ${m.cl}` : 'You have not met this monster yet'}</small>
      <div class="gprog"><span class="bar"><i style="width:${r.next == null ? 100 : Math.round((r.kills - (r.rank ? T[r.rank - 1] : 0)) / (T[r.rank] - (r.rank ? T[r.rank - 1] : 0)) * 100)}%"></i></span><small class="mono">${fmt(r.kills)} defeated · ${nextLine(m, r)}</small></div></div></div>
    <ol class="gladder" aria-label="What each entry needs">${RANKS.map((x, i) => { const left = T[i] - r.kills; return `<li class="${left <= 0 ? 'on' : ''}">${ico(left <= 0 ? 'check' : 'lock')}<b>${x[1]}</b><small>${left <= 0 ? 'Unlocked' : `${fmt(left)} more defeat${left > 1 ? 's' : ''}`}</small></li>`; }).join('')}</ol>
    ${seen ? sec(0, `<p>Found around ${esc(D.TOWN[m.town].name)}. Level ${m.cl}${m.boss ? `, and it guards the road onward` : ''}.</p>`) : lock(0)}
    ${sec(1, `<div class="chips">${UI.weakChips(m)}</div><p class="sm dim" style="margin:6px 0 0">${esc(DQ.typeRuleText(m))}</p>`)}
    ${sec(2, `<p>Health <b class="mono">${m.hp}</b> · Hits up to <b class="mono">${m.max}</b> · Carries <b class="mono">${m.coins[1] ? `${m.coins[0]}-${m.coins[1]}` : 'no'}</b> coins</p>`)}
    <div class="gsec ${r.rank > 3 ? '' : 'part'}"><div class="gh"><b>${RANKS[3][1]}</b><small>${RANKS[3][2]}</small></div>${dr}</div>
    ${sec(4, `<p>${esc(lore.note || 'No notes yet.')}</p>`)}
    ${sec(5, `<p class="legend">${esc(lore.legend || '')}</p>`)}
    ${seen ? UI.slayerHtml(m) : ''}<p class="sm dim gstars">Slayer stars: <span class="stars">${'★'.repeat(DQ.beastStars(id))}${'☆'.repeat(3 - DQ.beastStars(id))}</span> (+${DQ.beastStars(id) * 4}% damage against it)</p>`; UI.guideOpen = id;
  DQ.modal({ title: 'Field guide', wide: true, body, actions: [{ label: 'Close' }, ...(m.town === S().town && !m.boss ? [{ label: 'Prepare for it', fn: () => { UI.taskChoice.combat = id; DQ.go('combat'); } }] : []), ...(m.town === S().town ? [{ label: 'Fight it', primary: true, fn: () => { UI.taskChoice.combat = id; DQ.go('combat'); DQ.startAct('fight', id); } }] : [])] });
};
Object.assign(UI.DO, { guide: a => UI.openGuide(a) });

/* ---------- the Combat page and tooltips follow the same rules ---------- */
const origTip = DQ.tips.mon;
DQ.tips.mon = id => {
  const m = D.MON[id], r = DQ.research(m); let h = origTip(id);
  h += `<div class="dim">Research ${r.rank}/6${r.next != null ? ` · ${r.need} more defeat${r.need > 1 ? 's' : ''}: ${RANKS[r.rank][1]}` : ' · complete'}</div>`;
  return h;
};

/* ---------- Slayer goals (approved Nov 2026): three milestones per creature, rewards shown before you start ----------
   Every milestone keeps its slayer star (+4% damage against that creature). Regular creatures award a title at 250
   defeats. Bosses award a trophy for the cottage wall at 10 defeats and a title at 50. Titles and trophies are cosmetic. */
const titleCase = t => t.replace(/(^|\s)\S/g, c => c.toUpperCase());
DQ.slayerGoals = m => {
  const k = S().beast.kills[m.id] || 0, who = m.boss ? (m.boss.short || m.name) : m.name;
  const goals = [
    { n: 10, reward: `★ +4% damage${m.boss ? ' · a trophy for your cottage' : ''}`, trophy: !!m.boss },
    { n: 50, reward: `★★ +8% damage${m.boss ? ` · the title “${DQ.beastTitleName(m)}”` : ''}`, title: !!m.boss },
    { n: 250, reward: `★★★ +12% damage${m.boss ? '' : ` · the title “${DQ.beastTitleName(m)}”`}`, title: !m.boss }
  ];
  return goals.map(g => Object.assign(g, { done: k >= g.n, left: Math.max(0, g.n - k), who }));
};
DQ.beastTitleName = m => m.boss ? `Bane of ${m.boss.short || m.name}` : `${titleCase(m.name)} Slayer`;
DQ.beastTitleEarned = id => { const m = D.MON[id]; return !!m && (S().beast.kills[id] || 0) >= (m.boss ? 50 : 250); };
DQ.trophyEarned = id => { const m = D.MON[id]; return !!(m && m.boss) && (S().beast.kills[id] || 0) >= 10; };
DQ.beastTitles = () => D.MONLIST.filter(m => DQ.beastTitleEarned(m.id));
const setTitle0 = DQ.setTitle, heroTitle0 = DQ.heroTitle;
DQ.setTitle = t => { if (typeof t === 'string' && t.startsWith('beast:')) { S().title = DQ.beastTitleEarned(t.slice(6)) ? t : null; DQ.emit('title'); return; } return setTitle0(t); };
DQ.heroTitle = () => { const t = S().title; if (typeof t === 'string' && t.startsWith('beast:')) { const id = t.slice(6); return DQ.beastTitleEarned(id) ? DQ.beastTitleName(D.MON[id]) : ''; } return heroTitle0(); };
/* the trophy wall: earned boss trophies can be hung in the cottage (S().house.wall, a list of boss ids) */
DQ.toggleTrophy = id => {
  if (!DQ.trophyEarned(id) || !S().house.owned) return false;
  const W = S().house.wall = Array.isArray(S().house.wall) ? S().house.wall.filter(x => D.MON[x]) : [];
  const i = W.indexOf(id); if (i >= 0) W.splice(i, 1); else W.push(id);
  DQ.save && DQ.save(); return true;
};
/* reaching a title or trophy is announced (kept in offline summaries); stars stay quiet */
const recordKill1 = DQ.recordKill;
DQ.recordKill = (m, drops) => {
  const before = S().beast.kills[m.id] || 0, knew = DQ.understanding(m).done; recordKill1(m, drops); const after = S().beast.kills[m.id] || 0;
  if (!knew && DQ.understanding(m).done && !DQ.forecasting && DQ.journal) DQ.journal('title', `You understand ${m.name} now. The field guide fills in its next entry${m.boss ? ', and its trophy gains a gold rim' : ''}.`, 'book');
  if (DQ.forecasting) return;
  const crossed = n => before < n && after >= n;
  if (m.boss && crossed(10)) DQ.notify({ kind: 'unlock', key: 'slayer:trophy:' + m.id, icon: 'trophy', col: '#d8a64a', title: `Trophy earned: ${m.boss.short || m.name}`, text: `Ten victories over ${m.name}. ${S().house.owned ? 'Hang it on your cottage wall.' : 'It will wait for you until you own a cottage.'}`, action: { label: 'Open the field guide', fn: () => UI.openGuide(m.id) }, sound: 'quest', ttl: 12000 });
  const tn = m.boss ? 50 : 250;
  if (crossed(tn)) DQ.notify({ kind: 'unlock', key: 'slayer:title:' + m.id, icon: 'star', col: '#d8a64a', title: `Title earned: ${DQ.beastTitleName(m)}`, text: `${fmt(tn)} victories over ${m.name}. Wear it from the field guide.`, action: { label: 'Wear title', fn: () => { DQ.setTitle('beast:' + m.id); UI.renderHud && UI.renderHud(); } }, sound: 'quest', ttl: 12000 });
};
UI.slayerHtml = m => {
  const goals = DQ.slayerGoals(m), wearing = S().title === 'beast:' + m.id, hung = (S().house.wall || []).includes(m.id);
  const rows = goals.map(g => `<li class="${g.done ? 'on' : ''}">${ico(g.done ? 'check' : 'lock')}<b>${fmt(g.n)} defeats</b><small>${esc(g.reward)}${g.done ? '' : ` · ${fmt(g.left)} more`}</small>${g.done && g.title ? `<button class="btn sm" data-do="beasttitle" data-a="${wearing ? '' : 'beast:' + m.id}">${wearing ? 'Remove title' : 'Wear title'}</button>` : ''}${g.done && g.trophy ? (S().house.owned ? `<button class="btn sm" data-do="trophy" data-a="${m.id}">${hung ? 'Take down' : 'Hang in cottage'}</button>` : '<small class="dim">Hang it once you own a cottage</small>') : ''}</li>`).join('');
  const u = DQ.understanding(m);
  const under = `<div class="understanding ${u.done ? 'done' : ''}">${ico(u.done ? 'check' : 'book')}<span><b>Understanding</b><small>${esc(u.main)}: ${u.have}/${u.need} · ${esc(u.alt)}: ${u.altHave}/${u.altNeed}</small><small class="dim">Reward: the next field-guide entry early${m.boss ? ' and a gold rim on its trophy' : ''}.</small></span></div>`;
  return `<div class="gsec slayer">${under}<div class="gh">${m.boss && DQ.trophyArt ? `<span class="slayer-trophy ${DQ.trophyEarned(m.id) ? '' : 'tro-locked'}">${DQ.trophyArt(m.id, 88)}</span>` : ico('trophy')}<b>Slayer goals</b><small>Rewards for repeated victories</small></div><ol class="slayer-goals">${rows}</ol></div>`;
};
UI.trophyWallHtml = () => {
  const bosses = D.MONLIST.filter(m => m.boss), W = S().house.wall || [];
  return `<section class="panel trophy-wall"><div class="phead"><h2>${ico('trophy')} Trophy wall</h2><small>${W.length} of ${bosses.length} hung</small></div><div class="trophies">${bosses.map(m => { const got = DQ.trophyEarned(m.id), on = W.includes(m.id), k = S().beast.kills[m.id] || 0;
    return `<div class="trophy ${got ? '' : 'tro-locked'} ${on ? 'hung' : ''}">${DQ.trophyArt ? DQ.trophyArt(m.id, 88) : ''}<b>${got || k ? esc(m.boss.short || m.name) : '???'}</b>${got ? `<button class="btn sm ${on ? '' : 'primary'}" data-do="trophy" data-a="${m.id}">${on ? 'Take down' : 'Hang'}</button>` : `<small>${k ? `${fmt(10 - k)} more victories` : 'Defeat this boss 10 times'}</small>`}</div>`; }).join('')}</div></section>`;
};
Object.assign(UI.DO, {
  beasttitle: a => { DQ.setTitle(a || null); UI.renderHud && UI.renderHud(); if (UI.guideOpen && document.querySelector('.gladder')) UI.openGuide(UI.guideOpen); },
  trophy: a => { if (DQ.toggleTrophy(a)) { if (UI.view === 'house') UI.render(false); if (UI.guideOpen && document.querySelector('.gladder')) UI.openGuide(UI.guideOpen); } }
});
const house0 = UI.V.house;
if (house0) UI.V.house = () => house0() + (S().house.owned ? UI.trophyWallHtml() : '');
/* where a unique comes from (shown with the item, in tooltips, the comparison and the field guide) */
DQ.uniqueSource = id => {
  const m = D.MONLIST.find(x => !x.boss && (x.drops || []).some(d => d[0] === id)), b = D.MONLIST.find(x => x.boss && x.boss.first === id);
  if (b) return { boss: b, text: `Always dropped by ${b.name} the first time you defeat it.` };
  if (!m) return null; const p = m.drops.find(d => d[0] === id)[2], need = Math.ceil(2.5 / p), have = (S().upity || {})[id] || 0, met = (S().beast.kills[m.id] || 0) > 0, found = (S().uniqFound || {})[id];
  return { mon: m, need, have, met, found, text: met ? `Dropped by ${m.name} in ${D.TOWN[m.town].name}, rarely.${found ? '' : ` Your first copy is guaranteed within ${need} defeats (${Math.min(have, need)} so far).`}` : `Found somewhere in ${D.TOWN[m.town].name}.` };
};
})();
