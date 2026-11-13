/* The field guide as an album (Dec 2026, from the player: everything you work with, easy to navigate, a place to come
   back to and check your unlocks). Three parts side by side: an index of topics with how full each is, an album of
   picture tiles (the ones closest to a new entry first), and the selected page as a ladder of entries showing what
   each one gives and how far the next is. Creatures keep their six entries and full pages (js/bestiary.js); fish,
   trees, ores, pockets and recipes have five, filled in by doing them (js/mastery.js). Nothing here changes a rule. */
(() => {
const Q = window.DQ, D = Q.data, UI = Q.ui, S = () => Q.S, { esc, ico, fmt } = Q;
if (!Q.mastInfo) return;
const NODE_SK = { fish: 'fishing', wood: 'woodcutting', mine: 'mining', thieve: 'thieving' }, VERB = { fish: 'caught', wood: 'cut', mine: 'mined', thieve: 'picked', recipe: 'made', crop: 'harvested', animal: 'collected', brew: 'brewed', sail: 'voyages', train: 'traps laid' };
const PAGE = { crop: 'farming', animal: 'farming', brew: 'brewery', sail: 'sailing', train: 'beastmastery' };
const studyQ = m => D.QUESTS.find(q => S().q[q.id] && ['active', 'new'].includes(S().q[q.id].s) && q.obj.some((o, j) => o.ev === 'guide' && o.key === m.id && Q.objProg(q, S().q[q.id], j) < o.n));
/* ---------- one shape for everything in the book ---------- */
const creature = m => { const r = Q.research(m), R = D.RESEARCH.ranks, seen = r.rank > 0, sq = studyQ(m), prev = r.rank ? r.T[Math.min(r.rank, r.T.length) - 1] : 0;
  return { key: m.id, kind: 'creature', name: seen || sq ? m.name : '???', known: seen, quest: sq, filled: r.rank, total: R.length, n: r.kills, pct: r.next ? Math.max(0, Math.min(100, (r.kills - prev) / Math.max(1, r.next - prev) * 100)) : 100, left: r.next ? r.need : 0,
    art: size => Q.monSprite(m, size, seen || sq ? '' : 'sil'), sub: seen ? `Level ${m.cl}${m.boss ? ' boss' : m.mini ? ' challenge' : ''} · ${fmt(r.kills)} defeated` : `${D.TOWN[m.town].name}`,
    ladder: R.map((x, i) => ({ name: x[1], text: x[2], at: r.T[i], done: r.rank > i })), unit: 'defeated', m }; };
const material = (kind, x, sk, o = {}) => { const m = Q.mastInfo(kind, x.id), lvl = o.lvl != null ? o.lvl : x.lvl, open = (o.open != null ? o.open : Q.lvl(sk) >= lvl) || m.n > 0, itemId = o.itemId || (kind === 'recipe' ? Object.keys(x.out)[0] : x.item), it = D.ITEMS[itemId], need = o.need || `${D.SK[sk].name} ${lvl}`;
  const art = size => { try { if (o.art) return `<span class="${open ? '' : 'blackout'}">${o.art(size)}</span>`; if (kind === 'wood' || kind === 'mine' || kind === 'thieve') return `<span class="${open ? '' : 'blackout'}">${Q.artImage(kind, x.id, size, open ? '' : 'sil', x.name)}</span>`; } catch (e) {} return `<span class="activity-item-art guide-item ${open ? '' : 'blackout'}" style="--art-size:${size >= 96 ? 64 : size >= 64 ? 48 : 32}px">${it ? Q.itemIco(it) : ico('book')}</span>`; };
  return { key: x.id, kind, sk, name: open ? (o.name || x.name) : '???', known: m.n > 0, locked: !open, need, filled: m.stars, total: 5, n: m.n, pct: m.pct, left: m.next ? m.next - m.n : 0, art,
    sub: `${need}${m.n ? ` · ${fmt(m.n)} ${VERB[kind]}` : ''}`, itemId,
    ladder: Q.ENTRY_NAMES.map((nm, i) => ({ name: nm, text: Q.entryPerk(kind, i + 1), at: D.MASTERY_STEPS[i], done: m.stars > i })), unit: VERB[kind] }; };
const topics = () => { const t = [];
  for (const town of D.TOWNS) if (S().towns[town.id] && S().towns[town.id].visited) t.push({ id: 'c:' + town.id, group: 'Creatures', name: town.name, ic: 'attack', items: () => D.MONLIST.filter(m => m.town === town.id).sort((a, b) => a.cl - b.cl).map(creature) });
  for (const [kind, sk] of Object.entries(NODE_SK)) if ((D.NODES[kind] || []).length && Q.skillUnlocked(sk)) t.push({ id: kind, group: 'Gathering', name: D.SK[sk].name, ic: sk, items: () => [...D.NODES[kind]].sort((a, b) => a.lvl - b.lvl).map(x => material(kind, x, sk)) });
  const seen = new Set(); for (const r of Object.values(D.RECIPES)) if (!seen.has(r.skill) && D.SK[r.skill] && Q.skillUnlocked(r.skill)) { seen.add(r.skill); const sk = r.skill; t.push({ id: 'recipe:' + sk, group: 'Making', name: D.SK[sk].name, ic: sk, items: () => Object.values(D.RECIPES).filter(x => x.skill === sk).sort((a, b) => a.lvl - b.lvl).map(x => material('recipe', x, sk)) }); }
  /* everything else you repeat: crops, livestock, potions, voyages and trap lines */
  if (Q.skillUnlocked('farming')) { t.push({ id: 'crop', group: 'Growing', name: 'Crops', ic: 'farming', items: () => [...D.CROPS].sort((a, b) => a.lvl - b.lvl).map(c => material('crop', c, 'farming', { itemId: 'crop_' + c.id })) });
    t.push({ id: 'animal', group: 'Growing', name: 'Livestock', ic: 'farming', items: () => [...D.ANIMALS].sort((a, b) => a.lvl - b.lvl).map(a => material('animal', a, 'farming', { itemId: a.prod })) }); }
  if (D.POTION_RECIPES && Q.skillUnlocked('herbalism')) t.push({ id: 'brew', group: 'Making', name: 'Potions', ic: 'herbalism', items: () => D.POTION_RECIPES.map(r => material('brew', { id: r.id, name: (D.ITEMS[r.id] || {}).name || r.id }, 'herbalism', { itemId: r.id, lvl: 1, open: !!(Q.canBrew && Q.canBrew(r)), need: 'Research its recipe' })) });
  if (D.VOYAGES && Q.skillUnlocked('sailing')) t.push({ id: 'sail', group: 'Gathering', name: 'Sailing', ic: 'sailing', items: () => [...D.VOYAGES].sort((a, b) => a.lvl - b.lvl).map(v => material('sail', v, 'sailing', { art: size => Q.artImage('skill', 'sailing', Math.min(64, size), '', v.name) })) });
  if (Q.lureLvl && Q.skillUnlocked('beastmastery')) t.push({ id: 'train', group: 'Gathering', name: 'Trap lines', ic: 'beastmastery', items: () => D.TOWNS.map(tw => material('train', { id: 'lure:' + tw.id, name: tw.name }, 'beastmastery', { lvl: Q.lureLvl(tw.id), open: Q.lvl('beastmastery') >= Q.lureLvl(tw.id) && !!(S().towns[tw.id] && S().towns[tw.id].visited), art: size => Q.artImage('skill', 'beastmastery', Math.min(64, size), '', tw.name) })) });
  const order = ['Creatures', 'Gathering', 'Growing', 'Making']; t.sort((x, y) => order.indexOf(x.group) - order.indexOf(y.group));
  return t; };
/* ---------- the three parts ---------- */
const tile = (e, sel, big) => `<button class="gt ${sel ? 'on' : ''} ${e.filled >= e.total ? 'full' : ''} ${e.known ? '' : 'unk'} ${e.quest ? 'quest' : ''}" data-do="guidepick" data-a="${esc(e.key)}" aria-pressed="${!!sel}" ${e.locked ? `data-tip="text:${esc(e.need)}"` : ''} aria-label="${esc(e.name)}, ${e.filled} of ${e.total} entries">${e.quest ? `<i class="gt-q">${ico('quest')}</i>` : ''}<span class="gt-art">${e.art(big ? 64 : 48)}</span><b>${esc(e.name)}</b>${e.known ? Q.studyBar(e.filled >= e.total ? 100 : e.pct, e.filled >= e.total) : ''}<span class="gt-pips" aria-hidden="true">${Array.from({ length: e.total }, (_, i) => `<i class="${i < e.filled ? 'on' : ''}"></i>`).join('')}</span></button>`;
const pageOf = e => { const nextI = e.ladder.findIndex(l => !l.done), sq = e.quest;
  const rows = e.ladder.map((l, i) => `<li class="${l.done ? 'done' : i === nextI ? 'next' : 'later'}"><span class="gl-dot" aria-hidden="true">${l.done ? '✓' : i + 1}</span><div><b>${l.done || i === nextI ? esc(l.name) : '???'}</b>${l.done || i === nextI ? `<small>${esc(l.text)}</small>` : ''}${i === nextI && e.known ? `<span class="gl-prog"><span class="bar"><i style="width:${e.pct}%"></i></span><em class="mono">${fmt(e.n)} / ${fmt(l.at)}</em></span>` : ''}</div>${l.done || (i === nextI && e.known) ? '' : `<em class="gl-at mono">${fmt(l.at)}</em>`}</li>`).join('');
  const act = e.kind === 'creature' ? `<button class="btn primary" data-do="guide" data-a="${e.key}">${sq ? `Read it for ${esc(sq.giver)}` : 'Read the full page'}</button>` : e.locked ? `<span class="tag">${ico('lock')} ${esc(e.need)}</span>` : `<button class="btn primary" data-do="guidemat" data-a="${e.kind}" data-b="${esc(e.key)}">Go there</button>`;
  return `<section class="panel guide-page ${e.filled >= e.total ? 'full' : ''}"><div class="gp-head"><span class="gp-art">${e.art(96)}</span><div><span class="k">${e.filled} of ${e.total} entries</span><h2>${esc(e.name)}</h2><small>${esc(e.sub)}</small></div></div>${sq ? `<p class="study-tag">${ico('quest')}${esc(sq.giver)} asks you to read this</p>` : ''}<ol class="guide-ladder">${rows}</ol><div class="btnrow">${act}</div></section>`; };
const page0 = UI.V.bestiary;
UI.guideSel = {};
UI.V.bestiary = () => { if (UI.beastTab === 'pets') return page0();
  const T = topics(); let topic = T.find(t => t.id === UI.guideTopic) || T.find(t => t.id === 'c:' + S().town) || T[0]; if (!topic) return page0(); UI.guideTopic = topic.id;
  const items = topic.items(), near = items.filter(e => e.known && e.filled < e.total).sort((a, b) => b.pct - a.pct).slice(0, 4);
  const sel = items.find(e => e.key === UI.guideSel[topic.id]) || items.find(e => e.quest) || near[0] || items.find(e => !e.locked) || items[0];
  const fill = t => { const it = t.items(); return [it.reduce((n, e) => n + e.filled, 0), it.reduce((n, e) => n + e.total, 0)]; };
  let group = ''; const index = T.map(t => { const [a, b] = fill(t), head = t.group !== group ? `<span class="gi-group">${group = t.group}</span>` : ''; return `${head}<button class="gi ${t.id === topic.id ? 'on' : ''}" data-do="guidetopic" data-a="${t.id}" aria-pressed="${t.id === topic.id}">${ico(t.ic)}<b>${esc(t.name)}</b><em class="mono">${a}/${b}</em><span class="bar"><i style="width:${b ? a / b * 100 : 0}%"></i></span></button>`; }).join('');
  const [a, b] = fill(topic), rest = items.filter(e => !near.includes(e));
  return `<div class="guide-book"><nav class="panel guide-index" aria-label="Field guide topics"><span class="k">Field guide</span>${index}<button class="btn sm gi-eggs" data-do="go" data-a="collection">Beast eggs</button></nav>
    <section class="panel guide-album"><div class="phead"><div><span class="k">${esc(topic.group)}</span><h2>${esc(topic.name)}</h2></div><small class="mono">${a} of ${b} entries</small></div>
      ${near.length ? `<div class="k ga-k">Closest to a new entry</div><div class="ga-near">${near.map(e => tile(e, e === sel, true)).join('')}</div><div class="k ga-k">Everything else</div>` : ''}<div class="ga-all">${rest.map(e => tile(e, e === sel)).join('')}</div></section>
    ${sel ? pageOf(sel) : ''}</div>`; };
UI.DO.guidetopic = a => { UI.guideTopic = a; UI.beastTab = null; UI.render(false); };
UI.DO.guidepick = a => { UI.guideSel[UI.guideTopic] = a; UI.render(false); };
/* older links that named a region still land on it */
UI.DO.guidetown = id => { UI.guideTopic = 'c:' + id; UI.render(false); };
/* a material's page takes you to it, selected, like any other route */
UI.DO.guidemat = (kind, id) => { if (PAGE[kind]) { if (kind === 'animal' && UI.tab) UI.tab.farmSection = 'livestock'; return Q.go(PAGE[kind]); } const sk = kind === 'recipe' ? D.RECIPES[id].skill : NODE_SK[kind]; if (!sk) return; UI.taskChoice[sk] = id; Q.go(D.SK[sk].page || sk); };
/* brewing fills a potion's page; its entries are a chance of a second bottle */
const brew0 = Q.brew; if (brew0) Q.brew = id => { const ok = brew0(id); if (ok) { Q.mastTick({ kind: 'brew', id }); if (Q.chance(Q.mastExtra('brew', id))) { Q.give(id, 1); Q.toast && Q.toast('A second bottle!'); } } return ok; };
})();
