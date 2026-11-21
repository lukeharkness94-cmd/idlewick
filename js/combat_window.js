/* Idlewick: where to fight, and who you are fighting (20 Nov 2026, owner feedback).
   Out of combat, the stage becomes a "Where to fight" window: each hunting area with the combat level it suits, the
   creatures you can meet there (portrait opens the field entry, odds beneath) and a Track button for each, plus
   Explore for the area as a whole. Tracking always finds that creature but takes a few seconds before each fight
   (DQ.trackRounds in engine.js). In combat the stage is the fight, and the left column swaps the area list for the
   creature you are fighting (level, health, speed, max hit, weaknesses, drops you have found) above the next boss.
   Challenges stay in the left column out of combat, so the window fits a 1280 x 720 laptop without scrolling. */
(() => {
const DQ = window.DQ, D = DQ.data, UI = DQ.ui, S = () => DQ.S, { esc, ico } = DQ;
/* a hunting ground fights on its town's first area backdrop */
const bd0 = DQ.backdropUrl; if (bd0) DQ.backdropUrl = k => bd0(/:(hunt|farm)$/.test(String(k)) ? String(k).split(':')[0] + ':0' : k);
const fightAct = () => DQ.act && DQ.act.kind === 'fight' ? DQ.act : null;
const met = id => (S().beast.kills[id] || 0) > 0;
const questMon = () => { const id = DQ.questHuntTarget ? DQ.questHuntTarget() : null, m = id && D.MON[id]; return m && m.town === S().town && !m.boss ? id : null; };
const tone = (lo, hi) => { const c = DQ.combatLvl(); return c >= hi ? 'ok' : c >= lo ? 'warn' : 'bad'; };
const monTile = (x, qt) => { const m = x.monster, k = met(x.id), nm = k ? m.name : '???';
  return `<div class="cw-mon ${qt === x.id ? 'quest' : ''}"><button type="button" class="cw-mon-art" data-do="guide" data-a="${x.id}" aria-label="${esc(k ? m.name : 'Unknown creature')}, level ${m.cl}, ${x.pct >= 45 ? 'Common' : x.pct >= 20 ? 'Uncommon' : 'Rare'}, ${x.pct}% of encounters. Open its field entry." data-tip="text:${esc(k ? m.name : 'Unknown creature')} · Lv ${m.cl} · ${x.pct}% of encounters">${DQ.monSprite(m, 40, k ? '' : 'sil')}</button><b>${esc(nm)}</b><small>Lv ${m.cl} · ${x.pct}%</small><button type="button" class="btn sm" data-do="hunttrack" data-a="${x.id}" aria-label="Track ${esc(k ? m.name : 'unknown creature')}">${ico('paw')}Track</button></div>`; };
const windowHtml = () => {
  const town = S().town, areas = (DQ.combatAreas ? DQ.combatAreas(town) : D.AREAS[town] || []), qt = questMon(), qm = qt && D.MON[qt];
  const cards = areas.map(a => { const odds = DQ.encounterOdds(a), lv = odds.map(x => x.monster.cl), lo = Math.min(...lv), hi = Math.max(...lv);
    return `<article class="cw-area"><div class="cw-area-h"><div><b>${esc(a.name)}</b><small class="${tone(lo, hi)}">Combat ${lo}–${hi} recommended</small></div><button type="button" class="btn primary" data-do="huntarea" data-a="${a.id}">${ico('attack')}Explore</button></div><div class="cw-mons">${odds.map(x => monTile(x, qt)).join('')}</div></article>`; }).join('');
  const quest = qm ? `<button type="button" class="cw-quest" data-do="huntquest" data-a="${qt}">${DQ.monSprite(qm, 32)}<span><small>Quest${qm.mini ? ' · challenge' : ''}</small><b>${esc(qm.name)}</b></span></button>` : '';
  return `<div class="cw-window" role="region" aria-label="Where to fight"><div class="cw-head"><small>${esc(D.TOWN[town].name)} · your combat level ${DQ.combatLvl()}</small>${quest}</div><div class="cw-areas">${cards}</div></div>`;
};
const foeHtml = () => {
  const f = DQ.fight, act = fightAct(); if (!f || !act) return '';
  const m = D.MON[f.id]; if (!m) return '';
  const w = DQ.weakOf ? DQ.weakOf(m, f) : { weak: [], resist: [] }, dt = k => D.DTYPES[k] ? `<span class="cw-dt" style="--c:${D.DTYPES[k].col}">${esc(D.DTYPES[k].name)}</span>` : '';
  const seen = (S().seen && S().seen.items) || {}, drops = (m.drops || []).map(d => d[0]).filter((id, i, a) => D.ITEMS[id] && a.indexOf(id) === i), known = drops.filter(id => seen[id]), unknown = drops.length - known.length;
  const area = act.area && Object.values(D.AREAS || {}).flat().find(a => a.id === act.area);
  const tracking = act.track ? `<div class="cw-trackline">${ico('paw')}<span>Tracking</span><button type="button" class="linkish" data-do="huntarea" data-a="${act.area || ''}">Explore instead</button></div>` : '';
  return `<section class="panel cw-foe" aria-label="The creature you are fighting"><div class="cw-foe-h">${DQ.monSprite(m, 64)}<div><span class="k">${m.boss ? 'Boss' : m.mini ? 'Challenge' : esc(area ? area.name : 'Fighting')}</span><b>${esc(m.name)}</b><small>Lv ${m.cl}</small></div><button type="button" class="btn sm route-icon" data-do="guide" data-a="${m.id}" aria-label="Open its field entry" data-tip="text:Field guide">${ico('book')}</button></div>
    <div class="cw-hp"><span class="bar"><i data-b="cwfoehp"></i></span><small class="mono" data-b="cwfoehptxt"></small></div>
    <dl class="cw-stats"><div><dt>Attacks every</dt><dd>${((m.attackMs || 2000) / 1000).toFixed(1)}s</dd></div><div><dt>Max hit</dt><dd>${m.max}</dd></div>${w.weak.length ? `<div><dt>Weak to</dt><dd>${w.weak.map(dt).join('')}</dd></div>` : ''}${w.resist.length ? `<div><dt>Resists</dt><dd>${w.resist.map(dt).join('')}</dd></div>` : ''}</dl>
    ${drops.length ? `<div class="cw-drops"><span class="k">Drops</span><div>${known.map(id => `<span class="cw-drop" data-tip="item:${id}">${DQ.itemIco(D.ITEMS[id])}</span>`).join('')}${unknown ? `<span class="cw-drop unknown" data-tip="text:${unknown} not found yet">?<b>${unknown}</b></span>` : ''}</div></div>` : ''}${tracking}</section>`;
};
UI.B.cwfoehp = e => { const f = DQ.fight, m = f && D.MON[f.id]; e.style.width = m ? Math.max(0, Math.round(f.hp / m.hp * 100)) + '%' : '0%'; };
UI.B.cwfoehptxt = e => { const f = DQ.fight, m = f && D.MON[f.id]; UI.set(e, m ? `${Math.max(0, Math.ceil(f.hp))} / ${m.hp}` : ''); };
UI.DO.hunttrack = id => {
  const a = DQ.areaForMonster && DQ.areaForMonster(id); if (!a || a.town !== S().town) return;
  if (!DQ.startHunt(a.id, id, false)) return;
  DQ.act.track = true; S().act.track = true; if (DQ.fight) DQ.fight.tracking = DQ.trackRounds(); DQ.save(); UI.render(false);
};
/* a plain Explore clears tracking */
const area0 = UI.DO.huntarea;
if (area0) UI.DO.huntarea = (id, ...r) => { const res = area0(id, ...r); if (DQ.act && DQ.act.kind === 'fight') { DQ.act.track = false; if (S().act) S().act.track = false; if (DQ.fight) DQ.fight.tracking = 0; } return res; };
const shape = () => {
  const x = document.querySelector('#view .combat-x'); if (!x) return;
  const col = x.querySelector('.combat-targets'), where = col && col.querySelector('.where'), boss = col && col.querySelector('.boss-foot'), arena = x.querySelector('.encounter-arena'), act = fightAct(), head = col && col.querySelector('.step-h');
  if (!col) return;
  if (boss && where && where.contains(boss)) where.after(boss);
  x.classList.toggle('cw-fighting', !!act); x.classList.toggle('cw-idle', !act);
  if (act) {
    if (where) where.remove();
    if (head) head.textContent = 'Your foe';
    const old = col.querySelector('.cw-foe'), html = foeHtml(), sig = act.id + ':' + !!act.track;
    if (!old || old.dataset.sig !== sig) { if (old) old.remove(); if (html) { if (head) head.insertAdjacentHTML('afterend', html); else col.insertAdjacentHTML('afterbegin', html); const n = col.querySelector('.cw-foe'); if (n) n.dataset.sig = sig; } }
    arena && arena.querySelector('.cw-window')?.remove();
  } else {
    col.querySelector('.cw-foe')?.remove();
    if (where) { where.querySelector('.wh-areas')?.remove(); where.querySelector('.wh-quest')?.remove(); where.querySelector('.phead')?.remove(); where.querySelector('.wh-minis-h')?.remove(); if (!where.querySelector('.wh-minis')) where.remove(); }
    if (head) head.textContent = col.querySelector('.wh-minis') ? 'Challenges' : 'Next boss';
    if (arena && !arena.querySelector('.cw-window')) arena.insertAdjacentHTML('beforeend', windowHtml());
    const title = x.querySelector('.cx-title'); if (title) title.innerHTML = `<small>${esc(D.TOWN[S().town].name)}</small><b>Where to fight</b>`;
    x.querySelector('.cx-go')?.remove();
  }
  if (UI.upd) UI.upd();
};
/* the stage tells you when it is still tracking */
DQ.on('ui', () => { const arena = document.querySelector('#view .combat-x .encounter-arena'); if (!arena) return; const on = !!(DQ.fight && DQ.fight.tracking > 0 && fightAct()); arena.classList.toggle('cw-tracking', on);
  let msg = arena.querySelector('.cw-trackmsg'); if (on && !msg) { arena.insertAdjacentHTML('beforeend', `<div class="cw-trackmsg" role="status">${ico('paw')}Tracking…</div>`); } else if (!on && msg) msg.remove(); });
const render0 = UI.render;
UI.render = (...a) => { const r = render0(...a); try { if (UI.view === 'combat') shape(); } catch (e) { console.error(e); } return r; };
/* in-place combat refreshes (UI.updateEncounter, player_feedback.js) redraw the column and header from the plain combat
   page, so reshape after them too; wrapped once everything has loaded */
const wrapUpdate = () => { const u0 = UI.updateEncounter; if (!u0 || u0._cw) return; UI.updateEncounter = (...a) => { const r = u0(...a); try { if (UI.view === 'combat') shape(); } catch (e) {} return r; }; UI.updateEncounter._cw = true; };
setTimeout(wrapUpdate, 0);
DQ.on('act', () => { if (UI.view === 'combat') setTimeout(() => { try { shape(); } catch (e) {} }, 0); });
DQ.on('encounter', () => { if (UI.view === 'combat') setTimeout(() => { try { shape(); } catch (e) {} }, 0); });
})();
