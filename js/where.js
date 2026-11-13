/* Where to fight (Nov 2026, from the player: the place you fight matters more than abilities, on one screen, no scroll).
   Every destination in the town is one compact card: the two hunting areas with the creatures you can meet there as
   portraits (their odds beneath; click one to see it on the stage before you go), the challenges as picture tiles,
   and a single quest row. Nothing here scrolls: tests/ui-fit.cjs checks the column at 1280 x 720. */
(() => {
const DQ = window.DQ, D = DQ.data, UI = DQ.ui, { esc, ico } = DQ, S = () => DQ.S;
const fighting = () => DQ.act && DQ.act.kind === 'fight' ? DQ.act : null;
const questMon = () => { const id = DQ.questHuntTarget ? DQ.questHuntTarget() : null, m = id && D.MON[id]; return m && m.town === S().town && !m.boss ? id : null; };
const rarity = pct => pct >= 45 ? 'Common' : pct >= 20 ? 'Uncommon' : 'Rare';
UI.areaPanel = town => {
  const f = fighting(), active = f && f.area, qt = questMon(), areas = D.AREAS[town] || [], focus = DQ.combatFocus ? DQ.combatFocus() : null;
  const minis = D.MONLIST.filter(m => m.mini && m.town === town), qm = qt && D.MON[qt];
  const quest = qm ? `<div class="wh-quest"><span class="wh-q-art">${DQ.monSprite(qm, 32)}</span><span><small>Quest target</small><b>${esc(qm.name)}</b></span><button class="btn sm primary" data-do="huntquest" data-a="${qt}">${qm.mini ? 'Challenge' : 'Track'}</button></div>` : '';
  const head = (x) => { const m = x.monster, met = (S().beast.kills[x.id] || 0) > 0, nm = met ? m.name : 'Unknown creature', on = focus && focus.id === x.id;
    return `<button type="button" class="wh-head enc-row ${on ? 'on' : ''} ${qt === x.id ? 'quest' : ''}" data-do="huntpreview" data-a="${x.id}" aria-pressed="${!!on}" aria-label="${esc(nm)}, level ${m.cl}, ${rarity(x.pct)}, ${x.pct}% of encounters. Show it on the stage." data-tip="text:${esc(nm)} · level ${m.cl} · ${rarity(x.pct)} (${x.pct}%)${qt === x.id ? ' · quest target' : ''}${met ? (r => ` · field guide ${r.rank}/${r.T.length}${r.next ? `, next entry after ${r.need} more` : ''}`)(DQ.research(m)) : ''}">${DQ.monSprite(m, 32, met ? '' : 'sil')}<small>${x.pct}%</small>${(() => { if (!met || !DQ.studyBar) return ''; const r = DQ.research(m), prev = r.rank ? r.T[Math.min(r.rank, r.T.length) - 1] : 0; return DQ.studyBar(r.next ? (r.kills - prev) / Math.max(1, r.next - prev) * 100 : 100, !r.next); })()}</button>`; };
  const cards = areas.map(a => { const odds = DQ.encounterOdds(a), on = active === a.id, lv = odds.map(x => x.monster.cl);
    return `<article class="area-card wh-area ${on ? 'selected' : ''}"><div class="wh-area-h"><div><b>${esc(a.name)}</b><small>Level ${Math.min(...lv)}–${Math.max(...lv)}${on ? ' · exploring' : ''}</small></div><button class="btn sm ${on ? '' : 'primary'}" data-do="huntarea" data-a="${a.id}">${on ? 'Retreat' : 'Explore'}</button></div><div class="wh-heads encounter-list" role="group" aria-label="Creatures in ${esc(a.name)}">${odds.map(head).join('')}</div></article>`; }).join('');
  const tiles = minis.map(m => { const ok = DQ.combatLvl() >= m.mini.req, done = S().minis && S().minis[m.id], on = f && f.id === m.id, d = DQ.dangerOf ? DQ.dangerOf(m) : null;
    return `<article class="wh-mini ${done ? 'done' : ''} ${on ? 'on' : ''} ${qt === m.id ? 'quest' : ''}" style="--c:${m.col}"><button type="button" class="wh-mini-art" data-do="huntpreview" data-a="${m.id}" aria-label="${esc(m.name)}: show it on the stage" data-tip="text:${esc(m.name)} · level ${m.cl}${d ? ' · ' + esc(d.label) : ''}">${DQ.monSprite(m, 48)}</button><b>${esc(m.name)}</b><small class="${ok ? 'ok' : 'bad'}">${done ? '✓ Defeated' : ok ? `Level ${m.cl}` : `Needs combat ${m.mini.req}`}</small><button class="btn sm ${ok && !on && !done ? 'primary' : ''}" ${ok ? `data-do="act" data-a="fight" data-b="${m.id}"` : 'disabled'}>${on ? 'Retreat' : done ? 'Again' : 'Challenge'}</button></article>`; }).join('');
  return `<section class="panel activity-choices hunt-areas where"><div class="phead"><div><span class="k">Hunting</span><h2>Choose an area</h2></div><small>${esc(D.TOWN[town].name)}</small></div>
    ${quest}<div class="wh-areas">${cards}</div>${tiles ? `<div class="wh-minis-h k">Challenges</div><div class="wh-minis">${tiles}</div>` : ''}</section>`;
};
UI.DO.huntpreview = id => { if (!D.MON[id]) return; UI.taskChoice.combat = id; UI.render(false); };
})();
