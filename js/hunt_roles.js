/* Hunting and Exploration with roles of their own (Nov 2026). Combat is where you fight now. Hunting now leads with one
   quarry and its habitat, chosen from your real save (a quest target, a creature whose drops you need, how close its
   next field-guide entry is, a creature you have not met) and lets you start that exact hunt. Exploration leads with
   the most worthwhile reachable discovery (an adventure chapter under way, an unvisited town, creatures still to be
   found nearby) and keeps the town table as short reference with the duplicate creature art removed. */
(() => {
const Q = window.DQ, D = Q.data, UI = Q.ui, S = () => Q.S, { esc, ico, fmt } = Q;
const hero = sk => UI.skillHero ? UI.skillHero(sk) : `<section class="panel"><h2>${D.SK[sk].name}</h2></section>`;
const met = m => (S().beast.kills[m.id] || 0) > 0 || (Q.act && Q.act.kind === 'fight' && Q.act.id === m.id);
const areaOf = m => (D.AREAS[S().town] || []).find(a => a.monsters.some(e => e.id === m.id));
/* every creature you can hunt here, with the reasons it is worth hunting, best first */
Q.huntCandidates = () => {
  const out = [], qt = Q.questHuntTarget && Q.questHuntTarget();
  for (const m of D.MONLIST.filter(m => m.town === S().town && !m.boss)) {
    const area = areaOf(m); if (!area) continue; const why = []; let score = 0, r = Q.research(m);
    if (qt === m.id) { why.push({ t: 'Your active quest needs it', k: 'quest' }); score += 100; }
    const seen = met(m);
    if (!seen) { why.push({ t: 'Not met yet: your first sighting starts its field-guide entry', k: 'new' }); score += 45; }
    const drop = seen || r.rank > 3 ? (m.drops || []).map(d => ({ id: d[0], u: Q.usesOf ? Q.usesOf(d[0]) : [] })).find(d => d.u.length) : null;
    if (drop) { why.push({ t: `Drops ${D.ITEMS[drop.id].name.toLowerCase()}: ${drop.u[0].text.charAt(0).toLowerCase() + drop.u[0].text.slice(1)}`, k: 'drop' }); score += 60; }
    if (seen && r.next != null && r.need > 0) { why.push({ t: `${fmt(r.need)} more ${r.need > 1 ? 'defeats' : 'defeat'} for its next field-guide entry`, k: 'research' }); score += Math.max(10, 40 - r.need * 2); }
    if (!why.length) { why.push({ t: 'Good steady training for your level', k: 'train' }); }
    const odds = Q.encounterOdds(area).find(e => e.id === m.id);
    out.push({ m, area, why, score, seen, pct: odds ? odds.pct : 0, danger: Q.dangerOf ? Q.dangerOf(m) : null });
  }
  return out.sort((a, b) => b.score - a.score || a.m.cl - b.m.cl);
};
const dangerChip = d => d ? `<span class="chip-d tone-${d.key === 'easy' ? 'ok' : d.key === 'fair' ? 'warn' : 'bad'}">${esc(d.label)}</span>` : '';
const huntinging = c => Q.act && Q.act.kind === 'fight' && Q.act.id === c.m.id;
UI.V.hunting = () => {
  const list = Q.huntCandidates(), top = list[0], known = list.slice(1).filter(c => c.seen || c.score > 45), unmet = list.slice(1).filter(c => !(c.seen || c.score > 45)), rest = known.slice(0, 5).concat(unmet.slice(0, 1)), moreUnmet = unmet.length - Math.min(1, unmet.length);
  if (!top) return `${hero('hunting')}<section class="panel"><p>Nothing to hunt around ${esc(D.TOWN[S().town].name)} yet. Travel on from the world map.</p><div class="btnrow"><button class="btn primary" data-do="go" data-a="map">World map</button></div></section>`;
  const nm = c => c.seen ? esc(c.m.name) : 'Unknown creature';
  const lead = `<section class="panel hunt-lead"><div class="hl-art ${top.seen ? '' : 'blackout'}">${Q.monSprite(top.m, 96, top.seen ? 'bob' : 'sil')}</div>
    <div class="hl-body"><span class="k">Today's hunt</span><h2>${nm(top)}</h2>
      <p class="hl-habitat">${ico('map')} <b>${esc(top.area.name)}</b> · ${esc(D.TOWN[S().town].name)} · level ${top.m.cl} · you meet it <b>${top.pct}%</b> of the time ${dangerChip(top.danger)}</p>
      <ul class="hl-why">${top.why.slice(0, 3).map(w => `<li class="w-${w.k}">${esc(w.t)}</li>`).join('')}</ul>
      <div class="btnrow"><button class="btn primary" data-do="huntgo" data-a="${esc(top.area.id)}|${esc(top.m.id)}">${huntinging(top) ? 'Stop hunting' : `Hunt ${nm(top)}`}</button><button class="btn" data-do="go" data-a="combat">Prepare in Combat</button>${top.seen ? `<button class="btn" data-do="guide" data-a="${esc(top.m.id)}">Field guide</button>` : ''}</div></div></section>`;
  const others = rest.length ? `<section class="panel hunt-others"><div class="phead"><h2>Other quarry</h2><small>${esc(D.TOWN[S().town].name)}</small></div><div class="hunt-rows">${rest.map(c => `<div class="hunt-row"><span class="hr-art ${c.seen ? '' : 'blackout'}">${Q.monSprite(c.m, 48, c.seen ? '' : 'sil')}</span><span class="hr-t"><b>${nm(c)}</b><small>${esc(c.why[0].t)} · ${esc(c.area.name)} · ${c.pct}%</small></span>${dangerChip(c.danger)}<button class="btn sm" data-do="huntgo" data-a="${esc(c.area.id)}|${esc(c.m.id)}">${huntinging(c) ? 'Stop' : 'Hunt'}</button></div>`).join('')}</div>${moreUnmet > 0 ? `<p class="sm dim">${moreUnmet} more ${moreUnmet > 1 ? 'creatures' : 'creature'} around here you have not met. Hunt in the other habitat to find them.</p>` : ''}</section>` : '';
  return `${hero('hunting')}<div class="hunt-page">${lead}${others}</div>`;
};
UI.DO.huntgo = a => { const [area, id] = String(a).split('|'); if (Q.act && Q.act.kind === 'fight' && Q.act.id === id) Q.stopAct(); else Q.startHunt(area, id); UI.render(false); };

/* ---------- Exploration ---------- */
const discoveriesLeft = t => { const r = Q.explorationSummary(t); return r.creatures.length - r.found.length; };
Q.exploreLead = () => {
  /* 1 an adventure chapter you have started */
  const adv = D.QUESTS.find(q => q.adventure && ['active', 'ready'].includes(Q.questState(q)));
  if (adv) { const st = S().q[adv.id], o = adv.obj.find((o, i) => Q.objProg(adv, st, i) < o.n);
    return { k: 'adventure', title: `Continue: ${adv.name}`, text: o ? o.label : 'This chapter is ready to be handed in.', art: Q.folkPortrait ? Q.folkPortrait(adv.giver, 64, '') : ico('quest'), btn: ['questcontinue', adv.id, 'Continue the adventure'] }; }
  /* 2 a town you can reach but have never visited */
  const next = D.TOWNS.find(t => t.id !== S().town && Q.townUnlocked(t.id) && !S().towns[t.id]?.visited);
  if (next) { const n = Q.explorationSummary(next.id); return { k: 'town', title: `Visit ${next.name}`, text: `${n.creatures.length} creatures to find and ${n.quests.length} quests wait there. New places also teach Exploration.`, art: ico('map'), btn: ['travelto', next.id, `Travel to ${next.name}`] }; }
  /* 3 creatures still unmet where you are */
  const here = discoveriesLeft(S().town); if (here > 0) return { k: 'creatures', title: `Find ${here} more ${here > 1 ? 'creatures' : 'creature'} around ${D.TOWN[S().town].name}`, text: 'Each first sighting starts a field-guide entry and pays Exploration XP.', art: ico('paw'), btn: ['go', 'hunting', 'Open Hunting'] };
  /* 4 another town with more to find */
  const far = D.TOWNS.filter(t => t.id !== S().town && Q.townUnlocked(t.id)).sort((a, b) => discoveriesLeft(b.id) - discoveriesLeft(a.id))[0];
  if (far && discoveriesLeft(far.id) > 0) return { k: 'far', title: `Return to ${far.name}`, text: `${discoveriesLeft(far.id)} creatures there are still undiscovered.`, art: ico('map'), btn: ['travelto', far.id, `Travel to ${far.name}`] };
  return { k: 'done', title: 'Everything within reach is explored', text: 'Defeat the next boss to open the road onward.', art: ico('trophy'), btn: ['go', 'map', 'World map'] };
};
UI.DO.travelto = id => { if (Q.travel) Q.travel(id); };
const explore0 = UI.V.exploration;
UI.V.exploration = () => {
  const lead = Q.exploreLead(), visited = D.TOWNS.filter(t => S().towns[t.id]?.visited).length;
  const leadHtml = `<section class="panel explore-lead"><div class="el-art">${lead.art}</div><div class="el-body"><span class="k">Next worthwhile discovery</span><h2>${esc(lead.title)}</h2><p>${esc(lead.text)}</p><div class="btnrow"><button class="btn primary" data-do="${lead.btn[0]}" data-a="${esc(lead.btn[1])}">${esc(lead.btn[2])}</button></div></div></section>`;
  const unseenTowns = D.TOWNS.filter(t => !S().towns[t.id]?.visited).length; const rows = D.TOWNS.filter(t => S().towns[t.id]?.visited).map(t => { const r = Q.explorationSummary(t.id), pct = r.creatures.length ? r.found.length / r.creatures.length * 100 : 0;
    return `<div class="explore-row ${r.visited ? '' : 'unseen'} ${t.id === S().town ? 'here' : ''}"><b>${r.visited ? esc(t.name) : '???'}</b><span class="er-bar"><span class="bar"><i style="width:${pct}%"></i></span></span><small>${r.visited ? `${r.found.length}/${r.creatures.length} creatures · ${r.completed.length}/${r.quests.length} quests${r.boss ? ' · boss ✓' : ''}` : 'Not visited'}</small></div>`; }).join('');
  const table = `<section class="panel explore-table"><div class="phead"><h2>Realm progress</h2><small>${visited}/${D.TOWNS.length} towns visited</small></div><div class="explore-rows">${rows}</div>${unseenTowns ? `<p class="sm dim">${unseenTowns} more ${unseenTowns > 1 ? 'regions lie' : 'region lies'} beyond the road. They appear here once you reach them.</p>` : ''}<div class="btnrow"><button class="btn" data-do="go" data-a="map">World map</button></div></section>`;
  return `${hero('exploration')}<div class="explore-page">${leadHtml}${table}</div>${UI.discoveriesPanel ? UI.discoveriesPanel() : ''}`;
};
})();
