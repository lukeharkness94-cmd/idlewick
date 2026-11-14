/* World Life pages (Dec 2026): the Museum (Guide → Museum) and the Trial tower (Combat → Trial tower). Rules live in
   js/museum.js and js/towers.js; this file only draws them. */
(() => {
const Q = window.DQ, D = Q.data, UI = Q.ui, S = () => Q.S, { esc, ico, fmt } = Q;
/* ---------- Museum: wings as rows of picture tiles; a finished wing shows its bonus as earned ---------- */
const art = (e, known) => { try { if (e.mon) return Q.monSprite(D.MON[e.mon], 48, known ? '' : 'sil'); if (e.pet) return known ? (e.evolved && Q.pixelArt && Q.pixelArt.hasCreature('evolved:' + e.pet) ? Q.artImage('creature', 'evolved:' + e.pet, 48, '', e.name) : Q.petSprite(D.PET[e.pet], 48)) : `<span class="col-unk">${Q.eggImg ? Q.eggImg(e.pet, 48) : ''}</span>`; if (e.item) return `<span class="activity-item-art ${known ? '' : 'blackout'}" style="--art-size:32px">${Q.itemIco(D.ITEMS[e.item])}</span>`; } catch (x) {} return `<span class="mu-ic ${known ? '' : 'unk'}">${ico(e.ic || 'star')}</span>`; };
UI.museumSel = null;
UI.V.museum = () => { if (!Q.museumProgress) return ''; Q.museumScan({ quiet: true });
  const P = Q.museumProgress(), tot = P.reduce((n, p) => n + p.got, 0), all = P.reduce((n, p) => n + p.total, 0);
  let sel = null; for (const p of P) for (const e of p.list) if (e.key === UI.museumSel) sel = { e, p };
  const wings = P.map(p => `<section class="mu-wing ${p.done ? 'done' : ''}"><div class="mu-head"><h3>${esc(p.wing.name)}</h3><span class="mono">${p.got} / ${p.total}</span><span class="bar"><i style="width:${p.total ? p.got / p.total * 100 : 0}%"></i></span><span class="tag ${p.done ? 'ok' : ''}" data-tip="text:Permanent bonus for completing this wing">${p.done ? '✓ ' : ''}${esc(p.wing.gives)}</span></div>
    <div class="mu-tiles">${p.list.map(e => { const k = Q.museumHas(e.key); return `<button class="mu-t ${k ? 'on' : ''} ${sel && sel.e.key === e.key ? 'sel' : ''}" data-do="museumpick" data-a="${esc(e.key)}" aria-label="${k ? esc(e.name) : 'Not found yet'}">${art(e, k)}</button>`; }).join('')}</div></section>`).join('');
  const card = sel ? (() => { const k = Q.museumHas(sel.e.key), when = (S().museum.got || {})[sel.e.key]; return `<aside class="panel mu-card"><span class="mu-big">${art(sel.e, k)}</span><span class="k">${esc(sel.p.wing.name)}</span><h2>${k ? esc(sel.e.name) : '???'}</h2><p>${k ? esc(sel.e.text || '') : 'Not found yet.'}</p>${k && when > 1e11 ? `<small class="dim">Added ${new Date(when).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}</small>` : ''}</aside>`; })()
    : `<aside class="panel mu-card"><span class="k">Museum</span><h2>${tot} of ${all}</h2><p>Everything you have met, hatched, found and beaten. A finished wing gives its bonus for good.</p></aside>`;
  return `<div class="museum"><section class="panel mu-main">${wings}</section>${card}</div>`; };
UI.DO.museumpick = a => { UI.museumSel = UI.museumSel === a ? null : a; UI.render(false); };
/* ---------- Trial tower: the floors as a ladder, the boss and its prize at the top ---------- */
UI.V.tower = () => { const town = S().town, T = (D.TOWERS || {})[town]; if (!T) return `<section class="panel"><h2>No tower here</h2></section>`;
  const cleared = Q.towerFloor(town), next = Q.towerNext(town), boss = D.MON[T.floors[T.floors.length - 1]], prize = D.ITEMS[T.prize], cl = Q.combatLvl(), fighting = Q.act && Q.act.kind === 'fight' && D.MON[Q.act.id] && D.MON[Q.act.id].tower;
  const tone = cl >= T.rec ? 'ok' : cl >= T.rec - 6 ? 'warn' : 'bad';
  const rows = T.floors.map((id, i) => { const m = D.MON[id], done = i < cleared, cur = i === cleared, top = i === T.floors.length - 1;
    return `<li class="tw-floor ${done ? 'done' : cur ? 'next' : 'later'} ${top ? 'top' : ''}"><span class="tw-n">${done ? '✓' : i + 1}</span><span class="tw-art">${Q.monSprite(m, 48, done || cur ? '' : 'sil')}</span><div><b>${done || cur ? esc(m.name) : '???'}</b><small>Lv ${m.cl}${top ? ' · boss' : ''}</small></div>${cur ? `<button class="btn primary" data-do="towerfight" data-a="${id}">${fighting && Q.act.id === id ? 'Fighting…' : top ? 'Challenge' : 'Climb'}</button>` : done ? `<button class="btn sm" data-do="towerfight" data-a="${id}">Again</button>` : ''}</li>`; }).reverse().join('');
  return `<div class="tower-page"><section class="panel tw-main"><div class="phead"><div><span class="k">Trial tower · ${esc(D.TOWN[town].name)}</span><h2>${esc(T.name)}</h2></div><span class="tag ${tone}" data-tip="text:Optional. Recommended Combat ${T.rec}; yours is ${cl}.">Combat ${T.rec} · you ${cl}</span></div><ol class="tw-ladder">${rows}</ol><p class="hint">Optional · progress is kept · losing costs nothing</p></section>
    <aside class="panel tw-side"><span class="k">At the top</span><span class="tw-boss">${Q.monSprite(boss, 96, cleared >= T.floors.length - 1 ? '' : 'sil')}</span><h3>${cleared >= T.floors.length - 1 ? esc(boss.name) : '???'}</h3>
      <div class="tw-prize ${Q.towerDone(town) ? 'got' : ''}" data-tip="item:${T.prize}"><span class="activity-item-art" style="--art-size:48px">${Q.itemIco(prize)}</span><div><b>${esc(prize.name)}</b><small>${esc(prize.unique.text)}</small><small class="dim">${Q.towerDone(town) ? '✓ Won' : 'First victory'}</small></div></div>
      <div class="tw-all">${Object.values(D.TOWERS).map(x => `<span class="tw-dot ${Q.towerDone(x.town) ? 'on' : Q.towerFloor(x.town) ? 'part' : ''}" data-tip="text:${esc(D.TOWN[x.town].name)}: ${Q.towerFloor(x.town)}/${x.floors.length}"></span>`).join('')}</div></aside></div>`; };
/* ---------- the event card: a small card over the page (never a modal), choices as buttons, "Later" tucks it away ---------- */
const WS = () => Q.worldState; let tucked = false;
const cardHost = () => { let el = document.getElementById('worldcard'); if (!el) { el = document.createElement('div'); el.id = 'worldcard'; el.setAttribute('aria-live', 'polite'); document.body.appendChild(el); } return el; };
UI.worldCard = () => { if (typeof document === 'undefined' || !Q.S) return; const el = cardHost(), W = WS(), ev = W.active, r = W.result, dm = damageHtml();
  if (!ev && !r) { el.innerHTML = dm; el.className = dm ? 'show' : ''; tucked = false; return; }
  if (r && !ev) { el.className = 'show result'; el.innerHTML = dm + `<div class="wc" style="--c:${r.col}"><span class="wc-ic">${ico(r.ic)}</span><div class="wc-b"><b>${esc(r.title)}</b><p>${esc(r.msg)}</p></div><button class="wc-x" data-do="worldclose" aria-label="Close">×</button></div>`; return; }
  if (tucked || ev.doing) { const d = ev.doing; el.className = 'show pill'; el.innerHTML = dm + `<button class="wc-pill" style="--c:${ev.def.col}" data-do="${d ? (d.fight ? 'go' : d.go ? 'go' : 'worldopen') : 'worldopen'}" data-a="${d ? (d.fight ? 'combat' : d.go || '') : ''}">${ico(ev.def.ic)}<b>${esc(ev.title)}</b>${d && d.need ? `<span class="mono">${ev.count}/${d.need}</span>` : d ? '<span>under way</span>' : '<span>waiting</span>'}</button>`; return; }
  el.className = 'show'; el.innerHTML = dm + `<div class="wc" style="--c:${ev.def.col}"><span class="wc-ic">${ico(ev.def.ic)}</span><div class="wc-b"><b>${esc(ev.title)}</b><p>${esc(ev.text)}</p><div class="wc-ch">${Q.worldChoices().map(c => `<button class="btn ${c.can && !c.can() ? '' : 'primary'}" data-do="worldchoose" data-a="${c.id}" ${c.can && !c.can() ? 'disabled' : ''}>${esc(c.label)}${c.sub ? `<small>${esc(c.sub)}</small>` : ''}</button>`).join('')}<button class="linkish" data-do="worldlater">Later</button></div></div></div>`; };
UI.DO.worldchoose = a => { Q.worldChoose(a); UI.worldCard(); UI.render && UI.render(false); };
UI.DO.worldlater = () => { tucked = true; UI.worldCard(); };
UI.DO.worldopen = () => { tucked = false; UI.worldCard(); };
UI.DO.worldclose = () => { WS().result = null; UI.worldCard(); };
Q.on('world', () => { if (WS().active && !WS().active.doing && !WS().result) tucked = tucked && !!WS().active; UI.worldCard(); });
/* ---------- damaged buildings: on the Village page only, as a card over the page (it moves nothing), one Repair each ---------- */
const damageHtml = () => { if (UI.view !== 'projects' || !Q.S) return ''; const dmg = Object.keys(S().damaged || {}).filter(id => D.PROJECTS[id] && D.PROJECTS[id].town === S().town); if (!dmg.length) return '';
  return `<div class="wc damaged-row" style="--c:#e5b04a"><span class="wc-ic">${ico('house')}</span><div class="wc-b"><b>Damaged</b><p>No bonus until repaired.</p><div class="wc-ch">${dmg.map(id => `<button class="btn ${S().coins >= Q.repairCost(id) ? 'primary' : ''}" data-do="repair" data-a="${id}">${esc(D.PROJECTS[id].name.replace(/^\w+ the /, '').replace(/^./, c => c.toUpperCase()))}<small>${fmt(Q.repairCost(id))} coins</small></button>`).join('')}</div></div></div>`; };
UI.DO.repair = id => { Q.repair(id); UI.render(false); };
const render0 = UI.render; UI.render = f => { render0(f); try { UI.worldCard(); } catch (e) {} };
/* ---------- welcome back: new museum entries from the time away, as one line ---------- */
const wb0 = UI.welcomeBody;
if (wb0) UI.welcomeBody = (sum, gap) => { const fresh = Q.museumScan ? Q.museumScan({ quiet: true }) : [], h = wb0(sum, gap); if (!fresh.length) return h;
  const line = `<div class="wb-sec wb-museum"><span class="k">Museum</span><p>${ico('book')} ${fresh.length} new ${fresh.length === 1 ? 'entry' : 'entries'}: ${fresh.slice(0, 3).map(f => esc(f.entry.name)).join(', ')}${fresh.length > 3 ? '…' : ''}</p></div>`;
  return h.includes('<div class="wb-sec wb-decide') ? h.replace('<div class="wb-sec wb-decide', line + '<div class="wb-sec wb-decide') : h + line; };
/* the Moonlit Hart: its own drawing */
const A = Q.pixelArt;
if (A && A.CREATURE_SPECS) A.CREATURE_SPECS.ev_hart = () => { const s = A.Spr(32, 32), c = A.ramp('#e8f0ff'), dk = A.ramp('#a8b8d8'), ant = A.ramp('#f4e8c0');
  for (const x of [8, 12, 19, 23]) { s.rect(x, 21, 2, 8, x > 15 ? dk : c); s.fix(x, 29, '#6a7890'); s.fix(x + 1, 29, '#6a7890'); }
  s.ell(15, 18, 9, 4.6, c); s.ell(13, 16, 6, 2, A.ramp('#ffffff')); s.poly([[21, 16], [24, 8], [27, 9], [25, 18]], c); s.ell(26, 8, 3.4, 2.6, c); s.poly([[28, 8], [32, 10], [28, 11]], c); s.fix(31, 10, '#3a4a6a'); s.fix(27, 7, '#3a5a9a');
  for (const [a, b, e, f] of [[25, 6, 23, 0], [23, 3, 20, 1], [27, 6, 29, 0], [29, 3, 32, 1], [24, 2, 25, 0]]) s.line(a, b, e, f, null, '#f4e8c0'); s.poly([[6, 16], [3, 13], [5, 18]], c);
  for (const [x, y] of [[4, 8], [10, 5], [18, 6], [2, 22]]) s.fix(x, y, '#ffffff'); return s; };
UI.DO.towerfight = id => { if (Q.startAct('fight', id)) { UI.taskChoice.combat = id; Q.go('combat'); } else UI.render(false); };
})();
