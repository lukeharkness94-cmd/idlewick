/* Idlewick: UI pages (map, shop, quests, character, bank, achievements, settings) and wiring. */
(() => {
const DQ = window.DQ, D = DQ.data, UI = DQ.ui, { $, $$, ico, fmt, fmtK, esc, clamp } = DQ;
const S = () => DQ.S, { itm } = UI;
Object.assign(UI, { mapSel: null, shopTab: 'buy', shopQty: 1, bankFilter: 'all', bankQ: '', questTab: 'active', achFilter: 'todo', selFrom: 'pack', traveling: false });
const CAT = { all: 'All', armour: 'Armour', weapon: 'Weapons', jewel: 'Jewellery', tool: 'Tools', food: 'Food', potion: 'Potions', resource: 'Materials', craft: 'Crafting items', gem: 'Gems', farm: 'Farming', other: 'Other' };
const CAT_ORDER = Object.keys(CAT);
const ING = new Set(); Object.values(D.RECIPES).forEach(r => Object.keys(r.in).forEach(k => ING.add(k)));
const catOf = it => it.type === 'tool' ? 'tool' : it.type === 'ammo' ? 'weapon' : it.type === 'gear' ? ({ weapon: 'weapon', ring: 'jewel', amulet: 'jewel' }[it.slot] || 'armour') : it.type === 'potion' ? 'potion' : it.type === 'food' || it.type === 'raw' ? 'food' : it.type === 'gem' ? 'gem' : it.type === 'resource' ? 'resource' : ['seed', 'crop', 'produce', 'supply'].includes(it.type) ? 'farm' : 'other';
/* "Crafting items" is a lens, not a box: anything that some recipe uses, wherever it also sits (ores, logs, bars, fish, crops …) */
const inCat = (id, f) => f === 'all' || (f === 'craft' ? ING.has(id) : catOf(D.ITEMS[id]) === f);
const byCat = (a, b) => CAT_ORDER.indexOf(catOf(D.ITEMS[a])) - CAT_ORDER.indexOf(catOf(D.ITEMS[b])) || D.ITEMS[a].name.localeCompare(D.ITEMS[b].name);
UI.catTabs = (store, cur, act) => Object.entries(CAT).filter(([k]) => k === 'all' || k === cur || Object.keys(store).some(id => inCat(id, k))).map(([k, n]) => `<button class="tab ${cur === k ? 'on' : ''}" data-do="${act}" data-a="${k}">${n} <b class="mono">${k === 'all' ? Object.keys(store).length : Object.keys(store).filter(id => inCat(id, k)).length}</b></button>`).join('');

/* ---------- Map ---------- */
const MAP_LAND = 'M40 330C50 210 170 130 320 110C470 90 590 56 760 70C900 82 950 190 944 300C938 404 884 462 760 452C640 470 520 430 400 450C280 480 140 470 80 420C52 394 40 362 40 330Z';
const seg = i => { const a = D.TOWNS[i], b = D.TOWNS[i + 1], dx = (b.x - a.x) * .55; return `M${a.x} ${a.y}C${a.x + dx} ${a.y} ${b.x - dx} ${b.y} ${b.x} ${b.y}`; };
function mapSVG(sel) {
  const cur = S().town;
  const roads = D.TOWNS.slice(0, -1).map((t, i) => { const open = DQ.townUnlocked(D.TOWNS[i + 1].id); return `<path id="seg${i}" d="${seg(i)}" fill="none" stroke="${open ? '#8a5a2e' : '#8a5a2e66'}" stroke-width="${open ? 4 : 3}" stroke-dasharray="${open ? '2 8' : '1 9'}" stroke-linecap="round"/>`; }).join('');
  const decor = `<g opacity=".55" fill="#4a7a3a"><circle cx="86" cy="330" r="9"/><circle cx="100" cy="346" r="7"/><circle cx="72" cy="352" r="7"/><circle cx="170" cy="420" r="8"/><circle cx="188" cy="432" r="6"/><circle cx="210" cy="300" r="8"/></g>
    <g fill="none" stroke="#2f7a9a" stroke-width="2" opacity=".6" stroke-linecap="round"><path d="M250 466q8-6 16 0t16 0"/><path d="M330 480q8-6 16 0t16 0"/><path d="M400 120q8-6 16 0t16 0"/><path d="M480 96q8-6 16 0t16 0"/></g>
    <g fill="#7a8794" stroke="#4a5560"><path d="M520 300l26-46 22 34 18-24 28 36z"/><path d="M590 360l18-30 16 22 14-16 20 24z"/></g><g fill="#f4f7fa"><path d="M546 254l-8 12 8-3 6 4zM611 322l-6 8 6-2 4 3z"/></g>
    <g stroke="#2a2438" stroke-width="3" fill="none" stroke-linecap="round" opacity=".8"><path d="M650 200v-30M650 188l-9-8M650 180l8-6"/><path d="M742 150v-26M742 140l-8-7M742 132l7-5"/><path d="M690 120v-22"/></g>
    <path d="M800 400l32-70 26 40 24-34 30 64z" fill="#4a2a22" stroke="#2a1512"/><path d="M846 340q8 18-2 36" stroke="#ff7a2a" stroke-width="3" fill="none"/><circle cx="852" cy="326" r="12" fill="#ff7a2a" opacity=".3"/>
    <g transform="translate(900 430)" opacity=".7"><circle r="22" fill="none" stroke="#6a4a2a" stroke-width="1.5"/><path d="M0-26L5 0 0 26-5 0zM-26 0L0-5 26 0 0 5z" fill="#6a4a2a"/><text y="-30" text-anchor="middle" font-size="11" fill="#6a4a2a" font-family="serif">N</text></g>`;
  const towns = D.TOWNS.map((t, i) => {
    const open = DQ.townUnlocked(t.id), boss = S().towns[t.id] && S().towns[t.id].boss, isCur = t.id === cur, isSel = t.id === sel;
    return `<g class="mt ${open ? '' : 'locked'} ${isSel ? 'sel' : ''}" transform="translate(${t.x} ${t.y})" data-do="mapsel" data-a="${t.id}" tabindex="0" role="button" aria-label="${t.name}${open ? '' : ', locked'}">
      ${open ? '' : `<circle r="64" fill="#0d1215" opacity=".5" style="filter:blur(14px)"/>`}
      ${isSel ? `<circle r="34" fill="none" stroke="#f3d58a" stroke-width="2" stroke-dasharray="4 4" class="selring"/>` : ''}
      <circle r="24" fill="${open ? t.col : '#55606a'}" stroke="#2a2418" stroke-width="3"/><circle r="24" fill="none" stroke="#f3e6c0" stroke-width="1.5" opacity=".6"/>
      <g style="color:#1b1405"><use href="#i-${open ? 'town' : 'lock'}" x="-13" y="-13" width="26" height="26"/></g>
      <text y="44" text-anchor="middle" class="ml">${t.name}</text>
      <text y="59" text-anchor="middle" class="ms">${open ? (boss ? 'Boss defeated' : 'Boss awaits') : 'Unknown road'}</text>
      ${isCur ? `<circle r="30" fill="none" stroke="#f3d58a" stroke-width="2" class="pulsering"/>` : ''}</g>`;
  }).join('');
  const ct = D.TOWN[cur];
  return `<svg class="map" viewBox="0 0 980 500" role="group" aria-label="World map"><defs><filter id="paper"><feTurbulence type="fractalNoise" baseFrequency=".9" numOctaves="2" seed="3"/><feColorMatrix values="0 0 0 0 .35  0 0 0 0 .25  0 0 0 0 .1  0 0 0 .22 0"/></filter><linearGradient id="sea" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#173843"/><stop offset="1" stop-color="#0f2630"/></linearGradient><radialGradient id="land" cx="50%" cy="45%" r="70%"><stop offset="0" stop-color="#e9d9ac"/><stop offset="1" stop-color="#c9b17c"/></radialGradient></defs>
    <rect width="980" height="500" fill="url(#sea)"/><path d="${MAP_LAND}" fill="#00000040" transform="translate(5 8)"/><path d="${MAP_LAND}" fill="url(#land)" stroke="#6a4a2a" stroke-width="3"/><path d="${MAP_LAND}" filter="url(#paper)" fill="#fff"/>
    ${decor}${roads}${towns}<g id="hero-pin" transform="translate(${ct.x} ${ct.y - 40})" class="pin"><path d="M0 22C-14 4-14-14 0-14S14 4 0 22z" fill="#d8a64a" stroke="#2a2418" stroke-width="2"/><circle cy="-2" r="5" fill="#2a2418"/></g></svg>`;
}
UI.MAP_LAND = MAP_LAND; UI.mapSVG = mapSVG;
UI.V.map = () => {
  const sel = UI.mapSel = UI.mapSel || S().town, t = D.TOWN[sel], open = DQ.townUnlocked(t.id), here = S().town === sel, boss = D.MON[t.boss], done = S().towns[sel] && S().towns[sel].boss;
  const prev = D.TOWNS[t.idx - 1], counts = [['fishing', 'fish', 'fishing spot'], ['woodcutting', 'wood', 'tree type'], ['mining', 'mine', 'ore'], ['thieving', 'thieve', 'target']].map(([sk, k, w]) => { const n = D.NODES[k].filter(x => x.town === sel).length; return n ? `<span class="rw" style="--c:${D.SK[sk].col}">${ico(sk)}${n} ${w}${n > 1 ? 's' : ''}</span>` : ''; }).join('');
  const mons = D.MONLIST.filter(m => m.town === sel && !m.boss), qn = D.QUESTS.filter(q => q.town === sel);
  return `<div class="mapw"><section class="panel mappanel fancy">${UI.mapSVG(sel)}<div class="maplegend"><span><i class="lg c"></i> You are here</span><span>Click a town for details</span></div></section>
    <section class="panel towninfo" style="--c:${t.col}">${open ? UI.scene(t.id) : `<div class="scene fog">${ico('lock')}</div>`}
      <div class="ti-body"><span class="k">${here ? 'Current location' : open ? 'Open road' : 'Locked'}</span><h2>${open ? t.name : 'Unknown lands'}</h2><p class="dim">${open ? t.tag : 'The road is closed.'}</p>
      ${open ? `<p>${t.blurb}</p><div class="rws">${counts}<span class="rw" style="--c:#8a9bff">${ico('attack')}Monsters Lv ${mons[0].cl}-${mons[mons.length - 1].cl}</span><span class="rw" style="--c:#d8a64a">${ico('shop')}Shop</span><span class="rw" style="--c:#d8a64a">${ico('quest')}${qn.length} quests</span></div>
        <div class="bossrow ${done ? 'done' : ''}"><div class="avatar boss sm" style="--c:${boss.col}">${DQ.monSprite(boss, 40)}</div><div><b>${esc(boss.name)}</b><small>${done ? 'Defeated' : `Combat level ${boss.boss.req} to challenge`}</small></div></div>`
        : `<p>${prev ? `Defeat <b>${esc(D.MON[prev.boss].name)}</b> in ${prev.name} to open this road.` : ''}</p>${prev && DQ.townUnlocked(prev.id) ? `<p class="sm dim">You need combat level ${D.MON[prev.boss].boss.req} to face them. You are ${DQ.combatLvl()}.</p>` : ''}`}
      <div class="ti-act">${open ? (here ? `<button class="btn" disabled>You are here</button><button class="btn" data-do="go" data-a="combat">Go to combat</button>` : `<button class="btn primary" data-do="travel" data-a="${sel}">${ico('pin')}Travel to ${t.name}</button>`) : `<button class="btn" disabled>${ico('lock')}Locked</button>`}</div></div></section></div>`;
};
UI.after.map = () => {
  const pin = $('#hero-pin'); if (pin) UI.pinAt = pin;
};
UI.travelAnim = to => {
  if (UI.traveling) return; const from = S().town; if (from === to) return;
  const a = D.TOWN[from].idx, b = D.TOWN[to].idx, step = a < b ? 1 : -1, path = []; for (let i = a; i !== b; i += step) path.push(step > 0 ? [i, false] : [i - 1, true]);
  const pin = $('#hero-pin'); if (!pin || DQ.S.settings.reduceFx) return DQ.travel(to);
  UI.traveling = true; DQ.sfx('travel'); let k = 0, t0 = performance.now(); const per = 650;
  const go = () => {
    const [si, rev] = path[k], p = $('#seg' + si), len = p.getTotalLength(), f = clamp((performance.now() - t0) / per, 0, 1), e = f * f * (3 - 2 * f), pt = p.getPointAtLength((rev ? 1 - e : e) * len);
    pin.setAttribute('transform', `translate(${pt.x} ${pt.y - 40 - Math.sin(f * Math.PI) * 10})`);
    if (f >= 1) { k++; t0 = performance.now(); }
    if (k < path.length) requestAnimationFrame(go); else { UI.traveling = false; DQ.travel(to); }
  };
  requestAnimationFrame(go);
};

/* ---------- Shop ---------- */
const shopCats = () => {
  const ids = D.SHOPS[S().town], cats = { Supplies: [], Tools: [], Weapons: [], Armour: [], Ammunition: [] };
  ids.forEach(id => { const it = D.ITEMS[id]; (it.type === 'food' || it.type === 'supply' || it.type === 'resource' ? cats.Supplies : it.type === 'tool' ? cats.Tools : it.type === 'ammo' ? cats.Ammunition : it.slot === 'weapon' ? cats.Weapons : cats.Armour).push(id); });
  return cats;
};
UI.itemSub = it => { const b = UI.statLine(it.b), r = Object.entries(it.req || {}).map(([sk, l]) => `<span class="${DQ.skillUnlocked(sk) && DQ.lvl(sk) >= l ? 'ok' : 'bad'}">${D.SK[sk].name} ${l}</span>`).join(' '); return [it.heal ? `Heals ${it.heal}` : '', it.type === 'tool' ? `${Math.round(D.TOOL_SPEED[it.tier] * 100)}% faster ${D.SK[it.toolSkill].name.toLowerCase()}` : '', b, r].filter(Boolean).join(' · '); };
UI.V.shop = () => {
  const t = D.TOWN[S().town], tab = UI.shopTab, qty = UI.shopQty;
  let body = '';
  if (tab === 'buy') {
    body = Object.entries(shopCats()).filter(([, l]) => l.length).map(([c, ids]) => `<div class="shopcat"><div class="k">${c}</div><div class="srows">${ids.map(id => {
      const it = D.ITEMS[id], isTool = it.type === 'tool', own = isTool && DQ.have(id), cost = it.buy * (isTool ? 1 : qty), can = S().coins >= cost;
      return `<div class="srow ${can && !own ? '' : 'cant'}">${itm(id)}<div class="sr-t"><b>${it.name}</b><small>${UI.itemSub(it)}</small></div><span class="price mono ${can ? '' : 'bad'}">${ico('coin')}${fmt(cost)}</span><button class="btn sm ${can && !own ? 'primary' : ''}" data-do="buy" data-a="${id}" ${own ? 'disabled' : ''}>${own ? 'Owned' : isTool ? 'Buy' : `Buy ${qty > 1 ? '×' + qty : ''}`}</button></div>`;
    }).join('')}</div></div>`).join('');
  } else {
    const ids = Object.keys({ ...S().inv, ...S().bank }).filter(id => D.ITEMS[id].val > 0 || D.ITEMS[id].type === 'junk').sort((a, b) => D.ITEMS[b].val * DQ.have(b) - D.ITEMS[a].val * DQ.have(a));
    const junk = ids.filter(id => D.ITEMS[id].type === 'junk').reduce((a, id) => a + D.ITEMS[id].val * DQ.have(id), 0);
    body = `<div class="phead" style="margin-top:0"><small>Sells from your backpack first, then the bank. Equipped gear is never sold.</small><button class="btn sm" data-do="sellall" ${ids.some(id => D.ITEMS[id].type === 'junk') ? '' : 'disabled'}>Sell all junk${junk ? ` (${fmt(junk)})` : ''}</button></div><div class="srows">${ids.length ? ids.map(id => {
      const it = D.ITEMS[id], n = DQ.have(id);
      return `<div class="srow">${itm(id, n)}<div class="sr-t"><b>${it.name}</b><small>${fmt(n)} owned</small></div><span class="price mono">${ico('coin')}${fmt(it.val)}</span><span class="btnrow"><button class="btn sm" data-do="sell" data-a="${id}" data-b="1">Sell 1</button><button class="btn sm primary" data-do="sell" data-a="${id}" data-b="all">All (${fmt(it.val * n)})</button></span></div>`;
    }).join('') : '<p class="dim">You have nothing to sell.</p>'}</div>`;
  }
  return `<section class="panel shophead fancy" style="--c:${t.col}"><div><span class="k">Shop</span><h2>${t.name} general store</h2></div><div class="sh-coins"><span class="k">Your coins</span><b class="mono">${ico('coin')} <span data-b="coins"></span></b></div></section>
    <section class="panel"><div class="phead"><div class="tabs">${[['buy', 'Buy'], ['sell', 'Sell']].map(([k, n]) => `<button class="tab ${tab === k ? 'on' : ''}" data-do="shoptab" data-a="${k}">${n}</button>`).join('')}</div>
    ${tab === 'buy' ? `<div class="seg qty">${[1, 10, 100].map(q => `<button class="${qty === q ? 'on' : ''}" data-do="shopqty" data-a="${q}">×${q}</button>`).join('')}</div>` : ''}</div>${body}
    ${tab === 'buy' ? `<p class="hint">Each town stocks better gear. Tools last forever and make every task of that kind faster.</p>` : ''}</section>`;
};

/* ---------- Quests ---------- */
UI.V.quests = () => {
  const st = q => DQ.questState(q), groups = { active: q => ['active', 'ready'].includes(st(q)), available: q => st(q) === 'new', upcoming: q => st(q) === 'locked' && (DQ.townUnlocked(q.town) || q.main), done: q => st(q) === 'done' };
  const names = { active: 'Active', available: 'Available', upcoming: 'Upcoming', done: 'Completed' };
  const tab = UI.questTab = groups[UI.questTab] ? UI.questTab : 'active';
  const list = D.QUESTS.filter(groups[tab]).sort((a, b) => (b.main ? 1 : 0) - (a.main ? 1 : 0) || (st(a) === 'ready' ? -1 : 0) - (st(b) === 'ready' ? -1 : 0) || a.adv - b.adv);
  const cards = list.map((q, i) => {
    const s = st(q), p = S().q[q.id], t = D.TOWN[q.town];
    const objs = q.obj.map((o, j) => { const pr = DQ.objProg(q, p, j), ok = pr >= o.n; return `<div class="obj ${ok ? 'ok' : ''}"><span>${ok ? ico('check') : ''}${o.label}</span><span class="mono" ${p ? `data-b="qtxt:${q.id}:${j}"` : ''}>${p ? '' : `0 / ${fmt(o.n)}`}</span><span class="bar"><i ${p ? `data-b="qbar:${q.id}:${j}"` : ''}></i></span></div>`; }).join('');
    const prevQ = q.req ? D.QM[q.req] : null;
    const blk = DQ.questBlockers(q);
    const req = s === 'locked' && q.main ? `<div class="reqs">${blk.map(b => `<div class="bad">✗ ${b}</div>`).join('')}</div>` : s === 'locked' ? `<div class="reqs bad">${DQ.advLvl() < q.adv ? `Hero level ${q.adv} <span class="mono">(you: ${DQ.advLvl()})</span>` : ''}${prevQ && !(S().q[q.req] && S().q[q.req].s === 'done') ? ` Finish “${prevQ.name}” first` : ''}</div>` : '';
    const sk = q.main && D.SK[q.unlocks];
    return `<section class="panel quest ${s} ${q.main ? 'main' : ''}" style="--i:${i};${sk ? `--c:${sk.col}` : ''}" id="q-${q.id}">${sk ? `<span class="mq-ribbon">${ico('star')} Main quest · Unlocks ${sk.name}</span>` : ''}<div class="phead" style="margin:0"><div><h2>${q.name}</h2><small>${q.giver} · ${t.name}</small></div><span class="state ${s}">${{ new: 'Available', locked: 'Locked', active: 'In progress', ready: 'Ready', done: 'Complete' }[s]}</span></div>
      <p class="blurb">${q.blurb}</p>${s === 'locked' ? '' : objs}${req}<div class="rewards"><span class="k">Rewards</span><div class="rws">${sk ? `<span class="rw unlockrw" style="--c:${sk.col}">${ico(q.unlocks)}Learn ${sk.name}</span>` : ''}${UI.rewards(q.reward)}</div></div>
      ${s === 'new' ? `<button class="btn primary" data-do="qstart" data-a="${q.id}">Accept quest</button>` : s === 'ready' ? `<button class="btn primary" data-do="qclaim" data-a="${q.id}">Claim rewards</button>` : ''}</section>`;
  }).join('');
  const done = D.QUESTS.filter(groups.done).length;
  return `<section class="panel shophead"><div><span class="k">Quest log</span><h2>${done} of ${D.QUESTS.length} complete</h2></div><div class="tabs">${Object.entries(names).map(([k, n]) => `<button class="tab ${tab === k ? 'on' : ''}" data-do="qtab" data-a="${k}">${n} <b class="mono">${D.QUESTS.filter(groups[k]).length}</b></button>`).join('')}</div></section>
    ${list.length ? `<div class="qgrid">${cards}</div>` : `<section class="panel"><p class="dim" style="margin:0">${{ active: 'No active quests. Check the Available tab.', available: 'Nothing new right now. Level up or travel to find more.', upcoming: 'No upcoming quests in the towns you have opened.', done: 'You have not finished any quests yet.' }[tab]}</p></section>`}`;
};

/* ---------- Character ---------- */
const SLOT_LAYOUT = ['head', 'amulet', 'weapon', 'body', 'shield', 'legs', 'ring', 'ammo'];
const equipCell = slot => {
  const id = slot === 'ammo' ? S().ammo.id : S().equip[slot];
  if (!id) return `<div class="eq empty" data-tip="text:${DQ.SLOT_NAMES[slot]} slot (empty)">${ico({ head: 'helm', amulet: 'amulet', weapon: 'sword', body: 'body', shield: 'shield', legs: 'legs', ring: 'ring', ammo: 'arrow_ammo' }[slot])}<small>${DQ.SLOT_NAMES[slot]}</small></div>`;
  const it = D.ITEMS[id];
  return `<button class="eq" style="--c:${it.col}" data-do="unequip" data-a="${slot}" data-tip="item:${id}">${DQ.itemIco(it)}${slot === 'ammo' ? `<b class="mono">${fmtK(S().ammo.n)}</b>` : ''}<small>${DQ.SLOT_NAMES[slot]}</small></button>`;
};
UI.packSorted = () => Object.keys(S().inv).sort(byCat);
UI.packFilter = 'all'; UI.packQ = '';
UI.packVisible = () => UI.packSorted().filter(id => inCat(id, UI.packFilter) && D.ITEMS[id].name.toLowerCase().includes(UI.packQ.toLowerCase()));
UI.packGrid = () => {
  const ids = UI.packVisible(), all = UI.packFilter === 'all' && !UI.packQ, n = all ? DQ.packMax() : ids.length, cells = [];
  for (let i = 0; i < n; i++) { const id = ids[i]; cells.push(id ? `<button class="slot ${UI.sel === id && UI.selFrom === 'pack' ? 'sel' : ''}" style="--c:${D.ITEMS[id].col}" data-do="sel" data-a="${id}" data-b="pack" data-tip="item:${id}">${DQ.itemIco(D.ITEMS[id])}<span class="n mono">${fmtK(S().inv[id])}</span></button>` : `<div class="slot blank"></div>`); }
  return cells.length ? cells.join('') : `<p class="dim" style="grid-column:1/-1;margin:6px 0">${Object.keys(S().inv).length ? 'Nothing in your backpack matches. Try another filter, or look in the bank.' : 'Your backpack is empty.'}</p>`;
};
UI.detail = (id, from) => {
  if (!id || !DQ.have(id)) return `<p class="dim" style="margin:0">Select an item to see what you can do with it.</p>`;
  const it = D.ITEMS[id], n = from === 'bank' ? (S().bank[id] || 0) : (S().inv[id] || 0), can = it.slot ? DQ.canEquip(id) : null;
  const btns = [];
  if (it.slot) btns.push(`<button class="btn ${can.ok ? 'primary' : ''}" data-do="equip" data-a="${id}" ${can.ok ? '' : `data-tip="text:${esc(can.why)}"`}>Equip${can.ok ? '' : ' (locked)'}</button>`);
  if (it.heal) btns.push(`<button class="btn" data-do="eat" data-a="${id}">Eat (+${it.heal})</button>`);
  if (from === 'bank') btns.push(`<button class="btn" data-do="withdraw" data-a="${id}" data-b="1">Take 1</button>${n > 1 ? `<button class="btn" data-do="withdraw" data-a="${id}" data-b="10">Take 10</button><button class="btn" data-do="withdraw" data-a="${id}" data-b="all">Take all</button>` : ''}`);
  else btns.push(`<button class="btn" data-do="deposit" data-a="${id}" data-b="all">Bank</button>`);
  if (it.val > 0 || it.type === 'junk') btns.push(`<button class="btn" data-do="sell" data-a="${id}" data-b="1">Sell 1 (${fmt(it.val)})</button>${n > 1 ? `<button class="btn" data-do="sell" data-a="${id}" data-b="all">Sell all</button>` : ''}`);
  return `<div class="detail"><div class="dt-h">${itm(id)}<div><b style="color:${it.col}">${esc(it.name)}</b><small>${fmt(n)} in ${from === 'bank' ? 'bank' : 'pack'}</small></div></div><p class="sm">${UI.itemSub(it) || (it.type === 'junk' ? 'Junk. Good only for selling.' : DQ.cap(it.type))}</p><div class="btnrow wrap">${btns.join('')}</div></div>`;
};
UI.V.character = () => {
  const s = S(), b = DQ.bonus(), ps = DQ.pstats();
  return `<div class="chargrid"><section class="panel paper fancy"><div class="phead"><h2>Equipped</h2><span><small class="mono">Hero ${DQ.advLvl()} · Combat ${DQ.combatLvl()}</small> <button class="btn sm" data-do="share">${ico('star')}Share hero</button></span></div>
      <div class="doll"><div class="dollc">${UI.heroFigure()}</div>${SLOT_LAYOUT.map(sl => `<div class="ds ds-${sl}">${equipCell(sl)}</div>`).join('')}</div>
      <div class="bonuses">${[['Attack', b.atk, 'attack'], ['Strength', b.str, 'strength'], ['Defence', b.def, 'defence'], ['Ranged', b.rng, 'ranged'], ['Arrows', b.rngStr, 'ranged'], ['Magic', b.mag, 'magic']].map(([n, v, sk]) => `<div style="--c:${D.SK[sk].col}">${ico(sk)}<span>${n}</span><b class="mono">+${v}</b></div>`).join('')}</div>
      <div class="statlist"><div><span>Fighting style</span><b>${DQ.cap(ps.style)}</b></div><div><span>Max hit</span><b class="mono">${ps.max}</b></div><div><span>Damage reduction</span><b class="mono">${Math.round(ps.red * 100)}%</b></div><div><span>Total level</span><b class="mono" data-b="totlvl"></b></div></div></section>
    <div class="col"><section class="panel"><div class="phead"><h2>Backpack</h2><span><small class="mono" data-b="packn"></small> <button class="btn sm" data-do="go" data-a="bank">${ico('bank')}Bank (${Object.keys(S().bank).length})</button> <button class="btn sm" data-do="depositall">Bank all</button></span></div><div class="filtbar"><div class="tabs">${UI.catTabs(s.inv, UI.packFilter, 'packfilter')}</div><input id="packq" class="search" data-in="packq" placeholder="Search backpack" value="${esc(UI.packQ)}" aria-label="Search backpack"></div><div class="slots" id="packgrid">${UI.packGrid()}</div><p class="hint">The backpack holds ${DQ.packMax()} kinds of item. When it is full, new kinds go straight to your <b>bank</b>. A storage chest in your house adds more space.</p></section>
    <section class="panel" id="detailbox">${UI.detail(UI.sel, UI.selFrom)}</section></div></div>`;
};

/* ---------- Bank ---------- */
const bankIds = () => Object.keys(S().bank).filter(id => inCat(id, UI.bankFilter) && D.ITEMS[id].name.toLowerCase().includes(UI.bankQ.toLowerCase())).sort(byCat);
UI.bankGrid = () => { const ids = bankIds(); return ids.length ? ids.map(id => `<button class="slot ${UI.sel === id && UI.selFrom === 'bank' ? 'sel' : ''}" style="--c:${D.ITEMS[id].col}" data-do="sel" data-a="${id}" data-b="bank" data-tip="item:${id}">${DQ.itemIco(D.ITEMS[id])}<span class="n mono">${fmtK(S().bank[id])}</span></button>`).join('') : `<p class="dim" style="grid-column:1/-1">${Object.keys(S().bank).length ? 'Nothing matches that filter.' : 'Your bank is empty. Overflow and deposits end up here.'}</p>`; };
UI.V.bank = () => `<section class="panel shophead"><div><span class="k">Bank</span><h2>${Object.keys(S().bank).length} item types stored</h2><small class="dim">Tasks use bank items automatically when your backpack runs out.</small></div><button class="btn" data-do="depositall">${ico('bank')}Deposit backpack</button></section>
  <div class="chargrid"><section class="panel"><div class="phead"><div class="tabs">${UI.catTabs(S().bank, UI.bankFilter, 'bankfilter')}</div><input id="bankq" class="search" data-in="bankq" placeholder="Search" value="${esc(UI.bankQ)}" aria-label="Search bank"></div><div class="slots big" id="bankgrid">${UI.bankGrid()}</div></section>
  <section class="panel" id="detailbox">${UI.detail(UI.sel, UI.selFrom)}</section></div>`;

/* ---------- Achievements ---------- */
UI.V.achievements = () => {
  const f = UI.achFilter || 'todo', done = D.ACH.filter(a => S().ach[a.id]).length;
  const list = D.ACH.filter(a => f === 'all' || (f === 'done' ? S().ach[a.id] : !S().ach[a.id])).sort((a, b) => (!!S().ach[b.id] - !!S().ach[a.id]) || (Math.min(1, b.val() / b.goal) - Math.min(1, a.val() / a.goal)));
  const cut = f === 'todo' && !UI.achAll && list.length > 12, shown = cut ? list.slice(0, 12) : list;
  return `<section class="panel shophead"><div><span class="k">Achievements</span><h2>${done} of ${D.ACH.length} earned</h2></div><div class="tabs">${[['all', 'All'], ['todo', 'In progress'], ['done', 'Earned']].map(([k, n]) => `<button class="tab ${f === k ? 'on' : ''}" data-do="achfilter" data-a="${k}">${n}</button>`).join('')}</div></section>
    <div class="achgrid">${shown.map(a => { const v = Math.min(a.goal, a.val() || 0), ok = !!S().ach[a.id]; return `<div class="ach ${ok ? 'ok' : ''}"><span class="ai">${ico(ok ? a.ic : a.ic)}</span><div><b>${a.name}</b><small>${a.desc}</small><span class="bar"><i style="width:${v / a.goal * 100}%"></i></span><small class="mono">${ok ? 'Earned' : `${fmtK(v)} / ${fmtK(a.goal)}`} · ${ico('coin')}${fmt(a.coins)}</small></div></div>`; }).join('')}</div>${cut ? `<div class="btnrow" style="justify-content:center;margin-top:12px"><button class="btn" data-do="achall">Show all ${list.length} in progress</button></div>` : ''}`;
};

/* ---------- Settings ---------- */
const tog = (k, label, sub) => `<button class="tog ${S().settings[k] ? 'on' : ''}" data-do="set" data-a="${k}"><span class="sw"></span><span><b>${label}</b>${sub ? `<small>${sub}</small>` : ''}</span></button>`;
const slider = (k, label) => `<label class="slide"><span>${label}</span><input type="range" min="0" max="100" value="${Math.round(S().settings[k] * 100)}" data-in="${k}" aria-label="${label}"><b class="mono">${Math.round(S().settings[k] * 100)}%</b></label>`;
UI.V.settings = () => {
  const s = S().settings;
  return `<div class="setgrid"><section class="panel"><div class="phead"><h2>Audio</h2></div><div class="stack">${tog('muted', 'Mute everything', 'Shortcut: M')}${tog('sfx', 'Sound effects')}${slider('vol', 'Effects volume')}${tog('music', 'Ambient music', 'A slow, generated score that changes with each town')}${slider('musicVol', 'Music volume')}
      <div><div class="k" style="margin-bottom:6px">Task sounds</div><div class="seg">${[['off', 'Off'], ['calm', 'Calm'], ['varied', 'Varied']].map(([k, n]) => `<button class="${s.taskSounds === k ? 'on' : ''}" data-do="tasksound" data-a="${k}">${n}</button>`).join('')}</div><small class="dim">Controls how often finished tasks make a sound. Sounds are always varied so they do not repeat exactly.</small></div></div></section>
    <section class="panel"><div class="phead"><h2>Interface</h2></div><div class="stack">${tog('notify', 'Notifications', 'Level-ups, unlocks and loot, grouped into one card. The bell keeps everything')}${tog('tips', 'Tooltips')}${tog('reduceFx', 'Reduce effects', 'Turns off click ripples, particles and bouncy animations')}
      <label class="nameedit"><span class="k">Hero name</span><input id="heroname" data-in="name" maxlength="20" value="${esc(S().name)}"></label></div></section>
    <section class="panel"><div class="phead"><h2>Gameplay</h2></div><div class="stack">${tog('autoEat', 'Eat automatically in combat', `Eats at ${s.eatAt}% health. Change it on the Combat page.`)}<p class="sm dim">You can close the game at any time. Your current task, your crops, animals and workers keep going while you are away (full speed for 2 hours, then half speed, up to 8 hours), and you get a summary when you come back.</p></div></section>
    <section class="panel"><div class="phead"><h2>Save data</h2><small class="mono">Autosaves every 10s</small></div><div class="stack"><div class="btnrow wrap"><button class="btn" data-do="export">${ico('save')}Export save</button><button class="btn" data-do="import">Import save</button><button class="btn" data-do="savenow">Save now</button></div>
      <button class="btn danger" data-do="newgame">Erase and start a new game</button></div></section>
    <section class="panel"><div class="phead"><h2>Shortcuts</h2></div><dl class="keys">${[['Space', 'Stop or resume your task'], ['M', 'Mute or unmute'], ['1 – 9, 0', 'Home, Fishing … Combat'], ['T', 'Map'], ['S', 'Shop'], ['Q', 'Quests'], ['F', 'Farm'], ['H', 'House'], ['C', 'Inventory'], ['B', 'Bank'], ['Esc', 'Close dialogs']].map(([k, d]) => `<dt><kbd>${k}</kbd></dt><dd>${d}</dd>`).join('')}</dl></section>
    <section class="panel"><div class="phead"><h2>About</h2></div><p class="sm">Idlewick, a single-player idle adventure. Everything is a dashboard: pick a task, watch the numbers climb, and push on to the next town.</p><p class="sm dim">Version 0.4 · All sounds and music are generated live.</p></section></div>`;
};

/* ---------- Welcome back ---------- */
function welcome(sum, gap) {
  if (!Object.keys(sum.xp).length && !Object.keys(sum.items).length && !sum.coins && !(S().inbox || []).length) return;
  const xp = Object.entries(sum.xp).sort((a, b) => b[1] - a[1]), items = Object.entries(sum.items).sort((a, b) => D.ITEMS[b[0]].val * b[1] - D.ITEMS[a[0]].val * a[1]).slice(0, 8);
  const capped = gap > DQ.OFFLINE_CAP, eff = DQ.offlineEff(gap), taper = eff < Math.min(gap, DQ.OFFLINE_CAP);
  const body = `<p class="sm dim">You were away for <b>${DQ.fmtTime(gap)}</b>${taper || capped ? `, which counted as <b>${DQ.fmtTime(eff)}</b> of work (full speed for the first 2 hours, half speed after that${capped ? ', and nothing past 8 hours' : ''})` : ''}. ${sum.label ? `You were: <b>${sum.label.toLowerCase()}</b>.` : ''} ${sum.stopped ? '<b>Your task stopped early:</b> you ran out of materials, food or health.' : ''} ${sum.died ? 'You were defeated.' : ''}</p>
    ${xp.length ? `<div class="rws">${xp.map(([k, v]) => `<span class="rw" style="--c:${D.SK[k].col}">${ico(k)}${fmt(v)} XP</span>`).join('')}${sum.coins ? `<span class="rw" style="--c:#f3d58a">${ico('coin')}${fmt(sum.coins)} coins</span>` : ''}${sum.kills ? `<span class="rw" style="--c:#e0564f">${ico('attack')}${fmt(sum.kills)} defeated</span>` : ''}</div>` : '<p class="dim">Nothing happened while you were away. Start a task before you leave and it will keep going.</p>'}
    ${items.length ? `<div class="k" style="margin:12px 0 6px">Gained</div><div class="rws">${items.map(([id, n]) => `<span class="rw" style="--c:${D.ITEMS[id].col}">${ico(D.ITEMS[id].ic)}${fmt(n)}× ${D.ITEMS[id].name}</span>`).join('')}</div>` : ''}
    ${sum.levels.length ? `<div class="k" style="margin:12px 0 6px">Level-ups</div><div class="rws">${Object.entries(sum.levels.reduce((a, [k, l]) => (a[k] = l, a), {})).map(([k, l]) => `<span class="rw" style="--c:${D.SK[k].col}">${ico(k)}${D.SK[k].name} ${l}</span>`).join('')}</div>` : ''}`;
  DQ.modal({ title: 'Welcome back', wide: true, body: body + UI.returnExtras(sum), actions: [{ label: 'Continue', primary: true }] });
}

/* ---------- Actions ---------- */
const refresh = () => { if (UI._rt) return; UI._rt = setTimeout(() => { UI._rt = 0; UI.render(false); }, 120); };
UI.refresh = refresh;
const DO = {
  achall: () => { UI.achAll = true; UI.render(false); },
  noop: () => {}, go: a => DQ.go(a),
  act: (a, b) => { DQ.startAct(a, b); },
  stop: () => DQ.stopAct(),
  resume: () => { const l = S().lastAct; if (l) DQ.startAct(l.kind, l.id); },
  mute: () => { DQ.audioInit(); DQ.setMuted(!S().settings.muted); },
  tab: (a, b) => { UI.tab[a] = b; UI.render(false); },
  readyonly: a => { UI.tab[a + 'ready'] = !UI.tab[a + 'ready']; UI.render(false); },
  style: (a, b) => { if (a === 'melee' || a === 'ranged' || a === 'magic') { S().style[a] = b; UI.render(false); } },
  autoeat: () => { S().settings.autoEat = !S().settings.autoEat; UI.render(false); },
  eatat: a => { S().settings.eatAt = +a; UI.render(false); },
  eat: a => { DQ.eat(a); UI.upd(); },
  spell: a => { S().spell = a; UI.render(false); },
  qstart: a => DQ.startQuest(a), qclaim: a => DQ.claimQuest(a), qtab: a => { UI.questTab = a; UI.render(false); },
  mapsel: a => { UI.mapSel = a; DQ.sfx('tab'); UI.render(false); },
  travel: a => UI.travelAnim(a),
  shoptab: a => { UI.shopTab = a; UI.render(false); }, shopqty: a => { UI.shopQty = +a; UI.render(false); },
  buy: a => { const it = D.ITEMS[a]; if (DQ.buy(a, it.type === 'tool' ? 1 : UI.shopQty)) { DQ.log(`You buy ${it.type === 'tool' ? '' : UI.shopQty + '× '}${it.name.toLowerCase()}.`); UI.render(false); } },
  sell: (a, b) => { const n = b === 'all' ? DQ.have(a) : +b; const c = DQ.sell(a, n); if (c) DQ.log(`You sell ${n}× ${D.ITEMS[a].name.toLowerCase()} for ${fmt(c)} coins.`, 'good'); if (!DQ.have(a) && UI.sel === a) UI.sel = null; UI.render(false); },
  sellall: () => { const c = DQ.sellJunk(); if (c) DQ.log(`You sell your junk for ${fmt(c)} coins.`, 'good'); UI.render(false); },
  sel: (a, b) => { UI.sel = a; UI.selFrom = b || 'pack'; DQ.sfx('tab'); $$('.slot.sel').forEach(e => e.classList.remove('sel')); const el = $(`.slot[data-a="${a}"][data-b="${UI.selFrom}"]`); if (el) el.classList.add('sel'); const d = $('#detailbox'); if (d) d.innerHTML = UI.detail(a, UI.selFrom); },
  equip: a => { const r = DQ.equipItem(a); if (!r.ok) return DQ.toast(r.why, true); DQ.sfx('equip'); DQ.log(`You equip ${D.ITEMS[a].name.toLowerCase()}.`); UI.sel = null; UI.renderHud(); UI.render(false); },
  unequip: a => { if (DQ.unequip(a)) { DQ.sfx('equip'); UI.renderHud(); UI.render(false); } },
  deposit: (a, b) => { DQ.deposit(a, b === 'all' ? S().inv[a] : +b); DQ.sfx('tab'); UI.sel = null; UI.render(false); },
  withdraw: (a, b) => { const r = DQ.withdraw(a, b === 'all' ? S().bank[a] : +b); if (r < 0) DQ.toast('Your backpack is full', true); else DQ.sfx('tab'); if (!S().bank[a]) UI.sel = null; UI.render(false); },
  depositall: () => { Object.keys(S().inv).forEach(id => DQ.deposit(id, S().inv[id])); DQ.sfx('tab'); UI.sel = null; UI.render(false); },
  bankfilter: a => { UI.bankFilter = a; UI.render(false); },
  packfilter: a => { UI.packFilter = a; UI.render(false); },
  achfilter: a => { UI.achFilter = a; UI.render(false); },
  hidetut: () => { S().tut.hidden = true; UI.render(false); },
  set: a => { const s = S().settings; s[a] = !s[a]; DQ.audioApply(); DQ.musicRefresh(); UI.renderHud(); UI.render(false); },
  tasksound: a => { S().settings.taskSounds = a; DQ.audioInit(); UI.render(false); },
  savenow: () => { DQ.save(); DQ.toast('Game saved'); },
  export: () => DQ.modal({ title: 'Export save', wide: true, body: `<p class="sm dim">Copy this text somewhere safe. You can paste it into Import save on any device.</p><textarea id="expta" readonly rows="6">${DQ.exportSave()}</textarea>`, actions: [{ label: 'Copy', primary: true, fn: () => { const t = $('#expta'); t.select(); try { navigator.clipboard.writeText(t.value).then(() => DQ.toast('Copied to clipboard')).catch(() => DQ.toast('Press Ctrl+C to copy')); } catch (e) { DQ.toast('Press Ctrl+C to copy'); } return false; } }, { label: 'Close' }] }),
  import: () => DQ.modal({ title: 'Import save', wide: true, body: `<p class="sm dim">Paste an exported save below. This replaces your current game.</p><textarea id="impta" rows="6" placeholder="Paste save text here"></textarea>`, actions: [{ label: 'Load save', primary: true, fn: () => { if (DQ.importSave($('#impta').value)) { DQ.act = null; location.reload(); } else { DQ.toast('That does not look like a valid save', true); return false; } } }, { label: 'Cancel' }] }),
  newgame: () => DQ.modal({ title: 'Erase everything?', body: '<p>This permanently deletes your hero, items and progress and returns you to the title screen. Export your save first if you might want it back.</p>', actions: [{ label: 'Erase and restart', primary: true, fn: () => { DQ.act = null; DQ.eraseSave(); DQ.paused = true; location.reload(); } }, { label: 'Keep playing' }] }),
};
UI.DO = DO;
document.addEventListener('click', e => {
  const t = e.target.closest('[data-do]'); if (!t || t.disabled) return;
  if (t.classList.contains('card')) DQ.flash(t, 'bump');
  DQ.audioInit(); const f = DO[t.dataset.do]; if (f) f(t.dataset.a, t.dataset.b, t);
});
document.addEventListener('keydown', e => { const t = e.target.closest && e.target.closest('[data-do][tabindex]'); if (t && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); t.dispatchEvent(new MouseEvent('click', { bubbles: true })); } });
document.addEventListener('input', e => {
  const t = e.target, k = t.dataset && t.dataset.in; if (!k) return;
  if (k === 'vol' || k === 'musicVol') { S().settings[k] = t.value / 100; DQ.audioInit(); DQ.audioApply(); t.nextElementSibling.textContent = t.value + '%'; if (k === 'vol') DQ.sfx('coin'); }
  else if (k === 'packq') { UI.packQ = t.value; const g = $('#packgrid'); if (g) g.innerHTML = UI.packGrid(); }
  else if (k === 'bankq') { UI.bankQ = t.value; const g = $('#bankgrid'); if (g) g.innerHTML = UI.bankGrid(); }
  else if (k === 'name') { S().name = t.value.trim().slice(0, 20) || 'Adventurer'; UI.renderHud(); }
});
document.addEventListener('change', e => { if (e.target.dataset && e.target.dataset.in === 'vol') DQ.sfx('coin'); });

/* ---------- Keyboard ---------- */
const KEYS = { m: 'mute', t: 'map', s: 'shop', q: 'quests', c: 'character', b: 'bank', f: 'farming', h: 'house' };
const NUM = ['overview', 'fishing', 'woodcutting', 'mining', 'thieving', 'cooking', 'smithing', 'crafting', 'magic', 'combat'];
addEventListener('keydown', e => {
  if (e.ctrlKey || e.metaKey || e.altKey || /^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName) || !DQ.started) return;
  const k = e.key.toLowerCase();
  if (k === ' ' && !e.target.closest('button')) { e.preventDefault(); DQ.act ? DQ.stopAct() : DO.resume(); }
  else if (k === 'm') DO.mute();
  else if (KEYS[k]) DQ.go(KEYS[k]);
  else if (/^[0-9]$/.test(k)) DQ.go(NUM[(+k + 9) % 10]);
});

/* ---------- Render and navigation ---------- */
UI.render = fresh => {
  const y = scrollY; DQ.hideTip && DQ.hideTip();
  const id = UI.view; let html;
  try {
    if (D.SK[id] && !DQ.skillUnlocked(id)) html = UI.lockedPage(id);
    else if (['fishing', 'woodcutting', 'mining', 'thieving'].includes(id)) html = UI.V.gather(id);
    else if (['cooking', 'smithing', 'crafting'].includes(id)) html = UI.V.recipes(id);
    else html = UI.V[id]();
  } catch (e) { console.error(e); html = `<section class="panel"><h2>Something went wrong</h2><p class="dim">This page could not be drawn. Your progress is safe.</p></section>`; }
  const v = $('#view'); v.innerHTML = html; if (fresh) { v.classList.add('enter'); clearTimeout(UI._et); UI._et = setTimeout(() => v.classList.remove('enter'), 800); }
  [...v.children].forEach((el, i) => el.style.setProperty('--i', i));
  UI.collectProg(); UI.renderLog(); UI.upd(); if (id === 'overview') UI.chart();
  $$('.nav').forEach(n => n.classList.toggle('on', n.dataset.a === id));
  if (UI.after[id]) UI.after[id](); document.body.dataset.page = id;
  scrollTo(0, fresh ? 0 : y);
};
DQ.go = id => {
  if (!UI.V[id] && !D.SK[id]) return; if (id === UI.view) return;
  UI.view = id; try { location.hash = id; } catch (e) {} DQ.sfx('tab'); UI.render(true);
};
addEventListener('hashchange', () => { const h = location.hash.slice(1); if (h && (UI.V[h] || D.SK[h]) && h !== UI.view && DQ.started) { UI.view = h; UI.render(true); } });
const THEME = () => { document.body.dataset.town = S().town; };
const sig = () => DQ.foods().map(id => id + DQ.have(id)).join();
let foodSig = '', slow = 0;
UI.init = () => {
  DQ.on('act', () => { if (DQ.act) S().lastAct = { kind: DQ.act.kind, id: DQ.act.id }; UI.renderHud(); UI.renderRail(); UI.render(false); });
  DQ.on('ui', () => {
    UI.upd();
    if (DQ.invDirty) { DQ.invDirty = false; const ae = document.activeElement; /* keep typing in a search box undisturbed while loot arrives */ if (ae && (ae.id === 'packq' || ae.id === 'bankq')) { const g = $(ae.id === 'packq' ? '#packgrid' : '#bankgrid'); if (g) g.innerHTML = ae.id === 'packq' ? UI.packGrid() : UI.bankGrid(); } else if (['character', 'bank', 'shop', 'magic'].includes(UI.view)) refresh(); }
    if (UI.view === 'combat') { const s = sig(); if (s !== foodSig) { foodSig = s; const f = $('#foodbox'); if (f) { f.innerHTML = UI.foodChips(); UI.upd(); } } }
    if (UI.view === 'overview' && ++slow % 4 === 0) UI.chart();
  });
  DQ.on('log', UI.renderLog);
  DQ.on('lvl', () => { UI.renderRail(); refresh(); UI.renderHud(); });
  DQ.on('quests', refresh); DQ.on('ach', () => { if (UI.view === 'achievements') refresh(); });
  DQ.on('shop', () => { UI.renderHud(); });
  DQ.on('travelunlock', () => { if (UI.view === 'map') refresh(); });
  DQ.on('travel', () => { THEME(); UI.mapSel = S().town; UI.renderHud(); UI.renderRail(); UI.render(true); DQ.burstAt(innerWidth / 2, innerHeight / 3, D.TOWN[S().town].col, 24); });
  DQ.on('settings', () => { UI.renderHud(); if (UI.view === 'settings') UI.render(false); });
  DQ.on('welcome', welcome);
  DQ.on('splat', (side, text, kind, delay) => {
    const box = $(side === 'you' ? '#sp-you' : '#sp-foe'); if (!box || document.hidden) return;
    const el = document.createElement('div'); el.className = 'splat ' + kind; el.textContent = text; el.style.animationDelay = delay + 'ms'; box.appendChild(el); setTimeout(() => el.remove(), 1400 + delay);
    const av = $(side === 'you' ? '#av-you' : '#av-foe'); if (av) setTimeout(() => DQ.flash(av, 'hit'), delay);
  });
  DQ.on('slain', () => DQ.flash($('#av-foe'), 'slain'));
  THEME(); UI.renderHud(); UI.renderRail(); UI.render(true); requestAnimationFrame(UI.frame);
};
})();
