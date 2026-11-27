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
/* the hunting ground: animals, locked by Hunting level, for Hunting XP and materials (moved here from Hunting → Quarry) */
const huntTile = x => { const m = x.monster, k = met(x.id), ok = DQ.canHunt ? DQ.canHunt(m) : true, nm = k ? m.name : '???';
  return `<div class="cw-mon ${ok ? '' : 'cw-locked'}"><button type="button" class="cw-mon-art" data-do="guide" data-a="${x.id}" aria-label="${esc(k ? m.name : 'Unknown creature')}, ${ok ? `level ${m.cl}, ${x.pct}% of encounters` : `needs Hunting ${m.hl}`}. Open its field entry." data-tip="text:${esc(k ? m.name : 'Unknown creature')} · ${ok ? `Lv ${m.cl} · ${x.pct}%` : `Hunting ${m.hl}`}">${DQ.monSprite(m, 40, k && ok ? '' : 'sil')}</button><b>${esc(ok ? nm : '???')}</b><small>${ok ? `Lv ${m.cl} · ${x.pct}%` : `Hunting ${m.hl}`}</small>${ok ? `<button type="button" class="btn sm" data-do="hunttrack" data-a="${x.id}" aria-label="Track ${esc(k ? m.name : 'unknown creature')}">${ico('paw')}Track</button>` : `<button type="button" class="btn sm" disabled>${ico('lock')}Lv ${m.hl}</button>`}</div>`; };
const huntCard = g => { if (!DQ.skillUnlocked('hunting')) return `<article class="cw-area cw-hunt-locked"><div class="cw-area-h"><div><b>${esc(g.name)}</b><small>Learn Hunting to hunt animals here</small></div><button type="button" class="btn" data-do="go" data-a="hunting">${ico('paw')}Hunting</button></div><div class="cw-mons">${DQ.encounterOdds(g).map(x => `<div class="cw-mon cw-locked"><span class="cw-mon-art">${DQ.monSprite(x.monster, 40, 'sil')}</span><b>???</b><small>Hunting ${x.monster.hl}</small></div>`).join('')}</div></article>`;
  const odds = DQ.encounterOdds(g), open = odds.filter(x => DQ.canHunt ? DQ.canHunt(x.monster) : true);
  return `<article class="cw-area cw-hunt"><div class="cw-area-h"><div><b>${esc(g.name)}</b><small>Hunting ${DQ.huntLevel ? DQ.huntLevel() : DQ.lvl('hunting')} · animals for hides, feathers and meat</small></div><button type="button" class="btn primary" data-do="huntarea" data-a="${g.id}" ${open.length ? '' : 'disabled'}>${ico('paw')}Hunt</button></div><div class="cw-mons">${odds.map(huntTile).join('')}</div></article>`; };
UI.fightSupplyEntry = () => {
  const need = DQ.fightSupplyNeed();
  if (!need) return '';
  const name = D.ITEMS[need.item].name;
  return `<div class="fight-supply" role="status"><span>${esc(need.reason)}</span><button type="button" class="btn sm" data-do="${need.equip ? 'combatequip' : 'route'}" data-a="${need.item}">${need.equip ? 'Equip ' + esc(name.toLowerCase()) : 'Find ' + (need.item === 'rune' ? 'runes' : 'arrows')}</button></div>`;
};
UI.DO.routefight = id => {
  const route = UI.routeSource, m = D.MON[id];
  if (!m || route?.id !== id || m.town !== S().town) return;
  if (DQ.act?.kind === 'fight' && DQ.act.id === id) return DQ.stopAct();
  if (route.quest && !DQ.questWantsKill(id, route.quest) && !m.boss) return;
  if (m.boss || m.mini) DQ.startAct('fight', id);
  else if (route.quest) UI.DO.huntquest(id);
  else UI.DO.hunttrack(id);
};
const routedFight = () => {
  const route = UI.routeSource;
  const m = route?.kind === 'fight' && D.MON[route.id];
  if (!m || (route.quest && !m.boss && !DQ.questWantsKill(m.id, route.quest))) return null;
  return { m, route };
};
const routedFightHtml = ({ m, route }) => {
  const kind = route.quest ? 'Quest objective' : D.ITEMS[route.item]?.name || 'Ingredient source';
  const label = route.quest ? m.name : DQ.monName(m);
  const locked = DQ.openingCombatNeed?.() || DQ.fightSupplyNeed() || DQ.combatLvl() < (m.boss?.req || m.mini?.req || 0);
  return `<div class="cw-quest cw-route-fight"><span><small>${esc(kind)}</small><b>${esc(label)}</b></span>${m.town === S().town ? `<button class="btn sm" data-do="routefight" data-a="${m.id}" ${locked ? 'disabled' : ''}>${route.quest ? 'Fight' : 'Track'}</button>` : ''}</div>`;
};
const windowHtml = () => {
  const town = S().town, ground = DQ.huntGround ? DQ.huntGround(town) : null; if (!ground) UI.cwTab = 'areas';
  const areas = (DQ.combatAreas ? DQ.combatAreas(town) : D.AREAS[town] || []), qt = questMon(), qm = qt && D.MON[qt];
  /* animals are hunted on the Hunting page (hunt_stalk.js); the window keeps a way there */
  const wtabs = ground && DQ.skillUnlocked('hunting') ? `<div class="cw-tabs"><button type="button" class="btn sm" data-do="huntground" data-tip="text:Hunt animals on the Hunting page">${ico('paw')}Hunting ground</button></div>` : '';
  if (UI.cwTab === 'hunt' && ground) return `<div class="cw-window cw-window-hunt" role="region" aria-label="Hunting ground"><div class="cw-head"><small>${esc(D.TOWN[town].name)} · your Hunting level ${DQ.huntLevel ? DQ.huntLevel() : DQ.lvl('hunting')}</small>${wtabs}</div><div class="cw-areas">${huntCard(ground)}</div></div>`;
  const cards = areas.map(a => { const odds = DQ.encounterOdds(a), lv = odds.map(x => x.monster.cl), lo = Math.min(...lv), hi = Math.max(...lv);
    return `<article class="cw-area"><div class="cw-area-h"><div><b>${esc(a.name)}</b><small class="${tone(lo, hi)}">Combat ${lo}–${hi} recommended</small></div><button type="button" class="btn primary" data-do="huntarea" data-a="${a.id}">${ico('attack')}Explore</button></div><div class="cw-mons">${odds.map(x => monTile(x, qt)).join('')}</div></article>`; }).join('');
  const route = routedFight(), needsSupply = !!(DQ.openingCombatNeed?.() || DQ.fightSupplyNeed());
  const quest = route ? routedFightHtml(route) : qm ? `<button type="button" class="cw-quest" data-do="huntquest" data-a="${qt}" ${needsSupply && !(DQ.isAnimal?.(qt) && DQ.skillUnlocked('hunting')) ? 'disabled' : ''}>${DQ.monSprite(qm, 32)}<span><small>Quest${qm.mini ? ' · challenge' : ''}</small><b>${esc(qm.name)}</b></span></button>` : '';
  return `<div class="cw-window" role="region" aria-label="Where to fight"><div class="cw-head"><small>${esc(D.TOWN[town].name)} · your combat level ${DQ.combatLvl()}</small>${quest}${wtabs}</div>${UI.fightSupplyEntry()}<div class="cw-areas">${cards}</div></div>`;
};
const foeHtml = () => {
  const f = DQ.fight, act = fightAct(); if (!f || !act) return '';
  const m = D.MON[f.id]; if (!m) return '';
  /* damage types say what deals them (hover) and which one is yours, so "Weak to Slash" leads somewhere */
  const mine = DQ.myDtype ? DQ.myDtype() : null;
  const w = DQ.weakOf ? DQ.weakOf(m, f) : { weak: [], resist: [] }, dt = k => D.DTYPES[k] ? `<span class="cw-dt ${k === mine ? 'mine' : ''}" style="--c:${D.DTYPES[k].col}" data-tip="text:${esc(DQ.dtypeSources(k))}">${k === mine ? '✓ ' : ''}${esc(D.DTYPES[k].name)}</span>` : '';
  const seen = (S().seen && S().seen.items) || {}, drops = (m.drops || []).map(d => d[0]).filter((id, i, a) => D.ITEMS[id] && a.indexOf(id) === i), known = drops.filter(id => seen[id]), unknown = drops.length - known.length;
  const area = act.area && Object.values(D.AREAS || {}).flat().find(a => a.id === act.area);
  const tracking = act.track ? `<div class="cw-trackline">${ico('paw')}<span>Tracking</span><button type="button" class="linkish" data-do="huntexplore" data-a="${act.area || ''}">Explore instead</button></div>` : '';
  const place = m.boss ? 'Boss' : m.mini ? 'Challenge' : (area ? area.name : '');
  const chip = (icon, label, val, tip) => `<span class="cw-chip" data-tip="text:${esc(tip)}">${icon ? ico(icon) : ''}<span class="cw-chip-k">${label}</span><b>${val}</b></span>`;
  const chips = [chip('clock', 'Attacks', ((m.attackMs || 2000) / 1000).toFixed(1) + 's', 'Time between its attacks'), chip('attack', 'Max hit', m.max, 'Its biggest possible hit')];
  if (mine && D.DTYPES[mine]) { const st = w.weak.includes(mine) ? 'good' : w.resist.includes(mine) ? 'bad' : ''; chips.unshift(`<span class="cw-chip cw-you ${st}" data-tip="text:${esc(st === 'good' ? 'It is weak to your hits: more damage and accuracy.' : st === 'bad' ? 'It resists your hits: less damage.' : 'Neither weak nor resistant to your hits.')} ${esc(DQ.dtypeSources(mine))}"><span class="cw-chip-k">You deal</span><span class="cw-dt mine" style="--c:${D.DTYPES[mine].col}">${esc(D.DTYPES[mine].name)}</span></span>`); }
  if (w.weak.length) chips.push(`<span class="cw-chip"><span class="cw-chip-k">Weak to</span>${w.weak.map(dt).join('')}</span>`);
  if (w.resist.length) chips.push(`<span class="cw-chip"><span class="cw-chip-k">Resists</span>${w.resist.map(dt).join('')}</span>`);
  /* one row each: who it is, its health, how it fights, what it drops; the portrait opens its field entry */
  return `<section class="panel cw-foe" aria-label="The creature you are fighting"><div class="cw-foe-h"><button type="button" class="cw-foe-pic" data-do="guide" data-a="${m.id}" aria-label="${esc(m.name)}: open its field entry" data-tip="text:Field guide">${DQ.monSprite(m, 64)}</button><div class="cw-foe-id"><b>${esc(m.name)}</b><small>Lv ${m.cl}${place ? ' · ' + esc(place) : ''}</small><div class="cw-hp"><span class="bar"><i data-b="cwfoehp"></i></span><small class="mono" data-b="cwfoehptxt"></small></div></div></div>
    <div class="cw-chips">${chips.join('')}</div>
    ${drops.length ? `<div class="cw-drops"><span class="k">Drops</span><div>${known.map(id => `<span class="cw-drop" data-tip="item:${id}">${DQ.itemIco(D.ITEMS[id])}</span>`).join('')}${unknown ? `<span class="cw-drop unknown" data-tip="text:${unknown} not found yet">?<b>${unknown}</b></span>` : ''}</div></div>` : ''}${tracking}</section>`;
};
UI.B.cwfoehp = e => { const f = DQ.fight, m = f && D.MON[f.id]; e.style.width = m ? Math.max(0, Math.round(f.hp / m.hp * 100)) + '%' : '0%'; };
UI.B.cwfoehptxt = e => { const f = DQ.fight, m = f && D.MON[f.id]; UI.set(e, m ? `${Math.max(0, Math.ceil(f.hp))} / ${m.hp}` : ''); };
UI.DO.cwtab = t => { UI.cwTab = t === 'hunt' ? 'hunt' : 'areas'; document.querySelector('#view .cw-window')?.remove(); UI.render(false); };
UI.DO.huntground = () => { UI.cwTab = 'hunt'; document.querySelector('#view .cw-window')?.remove(); if (UI.view === 'combat') UI.render(false); else DQ.go('combat'); };
UI.DO.hunttrack = id => {
  const a = DQ.areaForMonster && DQ.areaForMonster(id); if (!a || a.town !== S().town) return;
  if (!DQ.startHunt(a.id, id, false)) return;
  DQ.act.track = true; S().act.track = true; if (DQ.fight) DQ.fight.tracking = DQ.trackRounds(); DQ.save(); UI.render(false);
};
/* Where everything sits (owner, 22 Nov 2026: "it should really feel logical"):
   left column, YOUR FIGHTER: what you wear, how you fight (weapon, art, training focus) and your abilities;
   the stage: WHERE TO FIGHT, or the fight itself;
   the row under it, THIS FIGHT: the foe you are facing (in a fight) or the boss and challenges you could take on next,
   beside your food. Built from the same panels, moved into place after each render. */
const shape = () => {
  const x = document.querySelector('#view .combat-x'); if (!x) return;
  const col = x.querySelector('.combat-targets'), arena = x.querySelector('.encounter-arena'), hud = x.querySelector('.combat-hud'), act = fightAct();
  if (!col) return;
  x.classList.add('cw-reorg'); x.classList.toggle('cw-fighting', !!act); x.classList.toggle('cw-idle', !act);
  const where = x.querySelector('.where'), boss = x.querySelector('.boss-foot');
  if (where) { where.querySelector('.wh-areas')?.remove(); where.querySelector('.wh-quest')?.remove(); where.querySelector('.phead')?.remove(); where.querySelector('.wh-minis-h')?.remove(); }
  /* the fight row's first panel: foe, or what to take on next */
  let next = hud && hud.querySelector('.cw-next');
  if (hud && !next) { hud.insertAdjacentHTML('afterbegin', '<section class="panel cw-next" aria-live="polite"><div class="kit-head"><span class="k"></span></div><div class="cw-next-body"></div></section>'); next = hud.querySelector('.cw-next'); }
  const body = next && next.querySelector('.cw-next-body'), label = next && next.querySelector('.kit-head .k');
  if (act) {
    if (where) where.remove();
    if (label) label.textContent = 'Your foe';
    const old = x.querySelector('.cw-foe'), html = foeHtml(), sig = act.id + ':' + !!act.track;
    if (!old || old.dataset.sig !== sig || !body.contains(old)) { if (old) old.remove(); if (html && body) { body.insertAdjacentHTML('afterbegin', html); const n = body.querySelector('.cw-foe'); if (n) n.dataset.sig = sig; } }
    const route = routedFight(), previousRoute = body?.querySelector('.cw-route-fight');
    if (route && route.m.id !== act.id && route.m.town === S().town) {
      if (!previousRoute) body?.insertAdjacentHTML('afterbegin', routedFightHtml(route));
    } else previousRoute?.remove();
    arena && arena.querySelector('.cw-window')?.remove();
  } else {
    x.querySelector('.cw-foe')?.remove();
    body?.querySelector('.cw-route-fight')?.remove();
    if (label) label.textContent = x.querySelector('.wh-mini') ? 'Challenges and boss' : 'Next boss';
    if (where && body && !body.contains(where)) { if (where.querySelector('.wh-minis')) body.prepend(where); else where.remove(); }
    if (arena && !arena.querySelector('.cw-window')) arena.insertAdjacentHTML('beforeend', windowHtml());
    const title = x.querySelector('.cx-title'); if (title) title.innerHTML = `<small>${esc(D.TOWN[S().town].name)}</small><b>${UI.cwTab === 'hunt' ? 'Hunting ground' : 'Where to fight'}</b>`;
    x.querySelector('.cx-go')?.remove();
  }
  if (boss && body && !body.contains(boss)) body.append(boss);
  if (!act && (DQ.openingCombatNeed?.() || DQ.fightSupplyNeed())) {
    for (const button of x.querySelectorAll('.cw-window [data-do="hunttrack"], .cw-window [data-do="huntarea"], .wh-mini [data-do="act"]')) button.disabled = true;
  }
  /* the left column: your fighter */
  const stepH = col.querySelector('.step-h'); if (stepH) stepH.textContent = 'Your fighter';
  const eq = col.querySelector('.combat-equipped'), train = hud && hud.querySelector('.hud-train'), abils = hud && hud.querySelector('.combat-abils');
  if (train) (eq || stepH || col.lastElementChild) ? (eq ? eq.after(train) : col.append(train)) : col.append(train);
  if (abils) (train && col.contains(train)) ? train.after(abils) : col.append(abils);
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
/* starting a fight from a pop-up (the Boss card's Challenge, a field guide's Fight it) closes the pop-up first, so the
   fight itself is what you see (27 Nov 2026 audit: the boss, its special and the victory all played behind it) */
(() => { const UI = DQ.ui, act0 = UI.DO.act; if (!act0 || act0._closesModal) return;
  UI.DO.act = (k, ...r) => { if (k === 'fight' && document.querySelector('.modal')) DQ.closeModal(); return act0(k, ...r); }; UI.DO.act._closesModal = true; })();
