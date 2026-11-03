/* Idlewick: UI pages (map, shop, quests, character, bank, achievements, settings) and wiring. */
(() => {
const DQ = window.DQ, D = DQ.data, UI = DQ.ui, { $, $$, ico, fmt, fmtK, esc, clamp } = DQ;
const S = () => DQ.S, { itm } = UI;
Object.assign(UI, { mapSel: null, shopTab: 'buy', shopQty: 1, bankFilter: 'all', bankQ: '', questTab: null, achFilter: 'todo', selFrom: 'pack', traveling: false });
const CAT = { all: 'All', armour: 'Armour', weapon: 'Weapons', jewel: 'Jewellery', tool: 'Tools', food: 'Food', potion: 'Potions', resource: 'Materials', craft: 'Crafting items', gem: 'Gems', farm: 'Farming', other: 'Other' };
const CAT_ORDER = Object.keys(CAT);
const ING = new Set(); Object.values(D.RECIPES).forEach(r => Object.keys(r.in).forEach(k => ING.add(k)));
const catOf = it => it.type === 'tool' ? 'tool' : it.type === 'ammo' ? 'weapon' : it.type === 'gear' ? ({ weapon: 'weapon', ring: 'jewel', amulet: 'jewel' }[it.slot] || 'armour') : it.type === 'potion' ? 'potion' : it.type === 'food' || it.type === 'raw' ? 'food' : it.type === 'gem' ? 'gem' : it.type === 'resource' ? 'resource' : ['seed', 'crop', 'produce', 'supply'].includes(it.type) ? 'farm' : 'other';
/* "Crafting items" is a lens, not a box: anything that some recipe uses, wherever it also sits (ores, logs, bars, fish, crops …) */
const inCat = (id, f) => f === 'all' || (f === 'craft' ? ING.has(id) : catOf(D.ITEMS[id]) === f);
const byCat = (a, b) => CAT_ORDER.indexOf(catOf(D.ITEMS[a])) - CAT_ORDER.indexOf(catOf(D.ITEMS[b])) || D.ITEMS[a].name.localeCompare(D.ITEMS[b].name);
UI.catTabs = (store, cur, act) => `${UI.choiceButtons(`<select id="${act}-select" data-in="itemfilter" data-a="${act}" aria-label="${act === 'packfilter' ? 'Backpack' : 'Bank'} category">${Object.entries(CAT).filter(([k]) => k === 'all' || k === cur || Object.keys(store).some(id => inCat(id, k))).map(([k, n]) => `<option value="${k}" ${cur === k ? 'selected' : ''}>${n} (${k === 'all' ? Object.keys(store).length : Object.keys(store).filter(id => inCat(id, k)).length})</option>`).join('')}</select>`)}`;

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
  return `<section class="panel travel-controls"><div class="phead"><h2>World</h2><small>Currently ${D.TOWN[S().town].name}</small></div><div class="task-controls"><label for="travel-town">Destination${UI.choiceButtons(`<select id="travel-town" data-in="travel-town">${D.TOWNS.map(town => `<option value="${town.id}" ${town.id === sel ? 'selected' : ''} ${DQ.townUnlocked(town.id) ? '' : 'disabled'}>${town.name}${DQ.townUnlocked(town.id) ? '' : ' · Locked'}</option>`).join('')}</select>`)}</label><button class="btn primary" data-do="${here ? 'go' : 'travel'}" data-a="${here ? 'combat' : sel}" ${open ? '' : 'disabled'}>${here ? 'Explore combat' : 'Travel'}</button></div></section><div class="mapw"><section class="panel mappanel fancy">${UI.mapSVG(sel)}<div class="maplegend"><span><i class="lg c"></i> You are here</span><span>Click a town for details</span></div></section>
    <section class="panel towninfo" style="--c:${t.col}">${open ? UI.scene(t.id) : `<div class="scene fog">${ico('lock')}</div>`}
      <div class="ti-body"><span class="k">${here ? 'Current location' : open ? 'Open road' : 'Locked'}</span><h2>${open ? t.name : 'Unknown lands'}</h2><p class="dim">${open ? t.tag : 'The road is closed.'}</p>
      ${open ? `<p>${t.blurb}</p><div class="rws">${counts}<span class="rw" style="--c:#8a9bff">${ico('attack')}Monsters Lv ${mons[0].cl}-${mons[mons.length - 1].cl}</span><span class="rw" style="--c:#d8a64a">${ico('shop')}Shop</span><span class="rw" style="--c:#d8a64a">${ico('quest')}${qn.length} quests</span></div>
        <div class="bossrow ${done ? 'done' : ''}"><div class="avatar boss sm" style="--c:${boss.col}">${DQ.monSprite(boss, 40)}</div><div><b>${esc(boss.name)}</b><small>${done ? 'Defeated' : `Combat level ${boss.boss.req} to challenge`}</small></div></div>`
        : `<p>${prev ? `Defeat <b>${esc(D.MON[prev.boss].name)}</b> in ${prev.name} to open this road.` : ''}</p>${prev && DQ.townUnlocked(prev.id) ? `<p class="sm dim">You need combat level ${D.MON[prev.boss].boss.req} to face them. You are ${DQ.combatLvl()}.</p>` : ''}`}
      </div></section></div>`;
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
UI.itemSub = it => { const b = UI.statLine(it.b), r = Object.entries(it.req || {}).map(([sk, l]) => `<span class="${DQ.skillUnlocked(sk) && DQ.lvl(sk) >= l ? 'ok' : 'bad'}">${D.SK[sk].name} ${l}</span>`).join(' '); return [it.heal ? `Heals ${it.heal}` : '', it.type === 'tool' ? `${Math.round(D.TOOL_SPEED[it.tier] * 100)}% faster ${D.SK[it.toolSkill].name.toLowerCase()}` : '', b, r].filter(Boolean).join(' · '); };
UI.shopSelected = {};
UI.shopTabs = tab => `<div class="tabs">${[['buy','Buy'], ['rare','Rare wares'], ['sell','Sell']].map(([value, label]) => `<button class="tab ${tab === value ? 'on' : ''}" data-do="shoptab" data-a="${value}">${label}</button>`).join('')}</div>`;
UI.shopPreview = id => {
  const it = D.ITEMS[id];
  return `<div class="shop-item-preview"><span class="shop-item-art">${DQ.itemIco(it)}</span><div><h3>${esc(it.name)}</h3><p class="item-base-stats">${UI.statLine(it.b) || UI.itemSub(it)}</p><small>${DQ.have(id)} owned${it.slot ? ' · ' + DQ.SLOT_NAMES[it.slot] : ''}</small></div></div>`;
};
UI.V.shop = () => {
  const tab = UI.shopTab, buying = tab === 'buy', qty = UI.shopQty;
  const ids = buying ? D.SHOPS[S().town] : Object.keys({ ...S().inv, ...S().bank });
  const id = ids.includes(UI.shopSelected[tab]) ? UI.shopSelected[tab] : ids[0], it = id && D.ITEMS[id];
  UI.shopSelected[tab] = id;
  const owned = it ? DQ.have(id) : 0, tool = it && it.type === 'tool', count = tool ? 1 : qty;
  const cost = it ? (buying ? it.buy * count : it.val * Math.min(count, owned)) : 0;
  const disabled = !it || (buying && (S().coins < cost || (tool && owned)));
  return `<div class="visual-shop"><section class="panel shop-stock"><div class="phead"><h2>Shop</h2><small>${D.TOWN[S().town].name}</small></div>${UI.shopTabs(tab)}<div class="illustrated-choices">${ids.map(item=>`<button class="illustrated-card ${item===id?'selected':''}" data-do="shopselect" data-a="${item}" aria-pressed="${item===id}"><span class="choice-art">${DQ.itemIco(D.ITEMS[item])}</span><b>${esc(D.ITEMS[item].name)}</b><span class="stock-price">${UI.money(buying?D.ITEMS[item].buy:D.ITEMS[item].val)}</span>${buying?'':'<small>'+DQ.have(item)+' held</small>'}</button>`).join('')}</div></section><section class="panel shop-task"><div class="phead"><h2>${buying?'Buy':'Sell'} selected item</h2></div>
    ${it ? `<div class="shop-workspace"><div class="shop-purchase">${UI.shopPreview(id)}<div class="shop-controls"><label for="shop-quantity">Quantity${UI.choiceButtons(`<select id="shop-quantity" data-in="shop-quantity" ${tool ? 'disabled' : ''}>${[1,10,100].map(n=>`<option value="${n}" ${count === n ? 'selected' : ''}>${n}</option>`).join('')}</select>`)}</label></div>
      <div class="btnrow wrap shop-action"><button class="btn primary" data-do="${buying ? 'buy' : 'sell'}" data-a="${id}" ${buying ? '' : `data-b="${count}"`} ${disabled ? 'disabled' : ''}>${tool && owned && buying ? 'Already owned' : (buying ? 'Buy' : 'Sell')+' ×'+(buying?count:Math.min(count,owned))} ${tool && owned && buying ? '' : UI.money(cost)}</button>${!buying ? `<button class="btn" data-do="sell" data-a="${id}" data-b="all">Sell all ${UI.money(it.val * owned)}</button>` : ''}</div>
      ${buying && S().coins < cost ? `<p class="bad">Need ${UI.money(cost - S().coins)} more.</p>` : ''}
      </div><div class="shop-comparison">${UI.compareHtml ? UI.compareHtml(id) : ''}</div></div>` : '<p>Nothing to sell. Gather resources or visit your bank.</p>'}
    <section data-reference="true" class="shop-help"><h3>About this shop</h3><p>Tools work automatically. Equipment must be equipped from Inventory after buying. Selling draws from your backpack first, then the bank. Equipped items are kept.</p></section></section></div>`;
};

/* ---------- Quests ---------- */
UI.V.quests = () => {
  const st = q => DQ.questState(q), groups = { active: q => ['active', 'ready'].includes(st(q)), available: q => st(q) === 'new', upcoming: q => st(q) === 'locked' && (DQ.townUnlocked(q.town) || q.main), done: q => st(q) === 'done' };
  const names = { active: 'Active', available: 'Available', upcoming: 'Upcoming', done: 'Completed' };
  const tab = UI.questTab = groups[UI.questTab] ? UI.questTab : D.QUESTS.some(groups.active) ? 'active' : 'available';
  const list = D.QUESTS.filter(groups[tab]).sort((a, b) => (b.main ? 1 : 0) - (a.main ? 1 : 0) || (st(a) === 'ready' ? -1 : 0) - (st(b) === 'ready' ? -1 : 0) || a.adv - b.adv);
  const selected = list.find(q => q.id === UI.tab.questSelected) || list[0];
  UI.tab.questSelected = selected && selected.id;
  const cards = list.length ? list.map((q, i) => {
    const s = st(q), p = S().q[q.id], t = D.TOWN[q.town];
    const objs = q.obj.map((o, j) => { const pr = DQ.objProg(q, p, j), ok = pr >= o.n; return `<div class="obj ${ok ? 'ok' : ''}"><span>${ok ? ico('check') : ''}${o.label}</span><span class="mono" ${p ? `data-b="qtxt:${q.id}:${j}"` : ''}>${p ? '' : `0 / ${fmt(o.n)}`}</span><span class="bar"><i ${p ? `data-b="qbar:${q.id}:${j}"` : ''}></i></span></div>`; }).join('');
    const prevQ = q.req ? D.QM[q.req] : null;
    const blk = DQ.questBlockers(q);
    const req = s === 'locked' && q.main ? `<div class="reqs">${blk.map(b => `<div class="bad">✗ ${b}</div>`).join('')}</div>` : s === 'locked' ? `<div class="reqs bad">${DQ.advLvl() < q.adv ? `Hero level ${q.adv} <span class="mono">(you: ${DQ.advLvl()})</span>` : ''}${prevQ && !(S().q[q.req] && S().q[q.req].s === 'done') ? ` Finish “${prevQ.name}” first` : ''}</div>` : '';
    const sk = q.main && D.SK[q.unlocks];
    return `<section class="panel quest ${s} ${q.main ? 'main' : ''}" style="--i:${i};${sk ? `--c:${sk.col}` : ''}" id="q-${q.id}">${sk ? `<span class="mq-ribbon">${ico('star')} Main quest · Unlocks ${sk.name}</span>` : ''}<div class="phead" style="margin:0"><div><h2>${q.name}</h2><small>${q.giver} · ${t.name}</small></div><span class="state ${s}">${{ new: 'Available', locked: 'Locked', active: 'In progress', ready: 'Ready', done: 'Complete' }[s]}</span></div>
      ${DQ.questImpact && DQ.questImpact(q.id) ? `<p class="quest-impact">Town change · ${esc(DQ.questImpact(q.id))}</p>` : ''}${req}<div class="quest-actions">${s === 'new' ? `<button class="btn primary" data-do="qstart" data-a="${q.id}">Accept quest</button>` : s === 'ready' ? `<button class="btn primary" data-do="qclaim" data-a="${q.id}">Claim reward</button>` : s === 'active' ? `<button class="btn primary" data-do="questcontinue" data-a="${q.id}">Continue quest</button>` : ''}</div>${s === 'locked' ? '' : objs}<section data-reference="true" class="quest-story" id="quest-story-${q.id}"><h3>Story &amp; rewards</h3><p class="blurb">${q.blurb}</p><div class="rewards"><span class="k">Rewards</span><div class="rws">${sk ? `<span class="rw unlockrw" style="--c:${sk.col}">${ico(q.unlocks)}Learn ${sk.name}</span>` : ''}${UI.rewards(q.reward)}</div></div>
      </section></section>`;
  }).join('') : '';
  const done = D.QUESTS.filter(groups.done).length;
  return `<section class="panel shophead"><div><span class="k">Quest log</span><h2>${done} of ${D.QUESTS.length} complete</h2></div><div class="tabs">${Object.entries(names).map(([k, n]) => `<button class="tab ${tab === k ? 'on' : ''}" data-do="qtab" data-a="${k}">${n} <b class="mono">${D.QUESTS.filter(groups[k]).length}</b></button>`).join('')}</div></section>
    ${list.length ? `<div class="qgrid">${cards}</div>` : `<section class="panel"><p class="dim" style="margin:0">${{ active: 'No active quests. Check the Available tab.', available: 'Nothing new right now. Level up or travel to find more.', upcoming: 'No upcoming quests in the towns you have opened.', done: 'You have not finished any quests yet.' }[tab]}</p></section>`}`;
};

/* ---------- Character ---------- */
const SLOT_LAYOUT = ['head', 'amulet', 'body', 'shield', 'weapon', 'ring', 'legs', 'ammo'];
const equipCell = slot => {
  const id = slot === 'ammo' ? S().ammo.id : S().equip[slot];
  if (!id) return `<div class="eq empty" role="img" aria-label="${DQ.SLOT_NAMES[slot]} slot, empty" data-tip="text:${DQ.SLOT_NAMES[slot]} slot (empty)">${ico({ head: 'helm', amulet: 'amulet', weapon: 'sword', body: 'body', shield: 'shield', legs: 'legs', ring: 'ring', ammo: 'arrow_ammo' }[slot])}<small>${DQ.SLOT_NAMES[slot]}</small></div>`;
  const it = D.ITEMS[id];
  return `<button class="eq" style="--c:${it.col}" data-do="unequip" data-a="${slot}" aria-label="${DQ.SLOT_NAMES[slot]}: ${esc(it.name)}. Unequip" data-tip="item:${id}">${DQ.itemIco(it)}${slot === 'ammo' ? `<b class="mono">${fmtK(S().ammo.n)}</b>` : ''}<small>${DQ.SLOT_NAMES[slot]}</small></button>`;
};
UI.packSorted = () => Object.keys(S().inv).sort(byCat);
UI.packFilter = 'all'; UI.packQ = '';
UI.packVisible = () => UI.packSorted().filter(id => inCat(id, UI.packFilter) && D.ITEMS[id].name.toLowerCase().includes(UI.packQ.toLowerCase()));
/* Item cards already provide the complete visible inventory selector. */
UI.inventoryPicker = () => '';
UI.packGrid = () => {
  const ids = UI.packVisible();
  if (!ids.length) return `<p class="dim" style="grid-column:1/-1;margin:6px 0">${Object.keys(S().inv).length ? 'Nothing in your backpack matches. Try another filter, or look in the bank.' : 'Your backpack is empty.'}</p>`;
  return ids.map(id => { const spare = D.ITEMS[id].slot !== 'ammo' && S().equip[D.ITEMS[id].slot] === id; return `<button class="slot ${UI.sel === id && UI.selFrom === 'pack' ? 'sel' : ''}" style="--c:${D.ITEMS[id].col}" data-do="sel" data-a="${id}" data-b="pack" data-tip="item:${id}" aria-label="${esc(D.ITEMS[id].name)}, ${S().inv[id]} ${spare ? 'spare copies' : 'in backpack'}">${DQ.itemIco(D.ITEMS[id])}<span class="n mono">${fmtK(S().inv[id])}</span>${spare ? '<span class="spare-tag">Spare</span>' : ''}</button>`; }).join('');
};
UI.detail = (id, from) => {
  if (!id || !DQ.have(id)) return `<p class="dim" style="margin:0">Select an item to see what you can do with it.</p>`;
  const it = D.ITEMS[id], n = from === 'bank' ? (S().bank[id] || 0) : (S().inv[id] || 0), can = it.slot ? DQ.canEquip(id) : null;
  const btns = [];
  if (it.slot) btns.push(can.equipped ? '<span class="spare-explanation">Already equipped · this is a spare copy</span>' : `<button class="btn ${can.ok ? 'primary' : ''}" data-do="equip" data-a="${id}" ${can.ok ? '' : `data-tip="text:${esc(can.why)}"`}>Equip${can.ok ? '' : ' (locked)'}</button>`);
  if (it.heal) btns.push(`<button class="btn" data-do="eat" data-a="${id}">Eat (+${it.heal})</button>`);
  if (from === 'bank') btns.push(`<button class="btn" data-do="withdraw" data-a="${id}" data-b="1">Take 1</button>${n > 1 ? `<button class="btn" data-do="withdraw" data-a="${id}" data-b="10">Take 10</button><button class="btn" data-do="withdraw" data-a="${id}" data-b="all">Take all</button>` : ''}`);
  else btns.push(`<button class="btn" data-do="deposit" data-a="${id}" data-b="all">Bank</button>`);
  btns.push(`<button class="btn" data-do="sell" data-a="${id}" data-b="1" data-from="${from}">Sell 1 ${UI.money(it.val)}</button>${n > 1 ? `<button class="btn" data-do="sell" data-a="${id}" data-b="all" data-from="${from}">Sell all ${UI.money(it.val * n)}</button>` : ''}`);
  return `<div class="detail"><div class="dt-h">${itm(id)}<div><b style="color:${it.col}">${esc(it.name)}</b><small>${fmt(n)} in ${from === 'bank' ? 'bank' : 'pack'}</small></div></div><p class="sm">${UI.itemSub(it) || (it.type === 'junk' ? 'Junk. Good only for selling.' : DQ.cap(it.type))}</p><div class="btnrow wrap">${btns.join('')}</div></div>`;
};
UI.V.character = () => {
  const s = S(), b = DQ.bonus(), ps = DQ.pstats(), marks = DQ.heroMarks();
  return `<div class="tabs character-mobile-tabs"><button class="tab ${UI.tab.characterPanel === 'equipment' ? '' : 'on'}" data-do="tab" data-a="characterPanel" data-b="pack">Backpack</button><button class="tab ${UI.tab.characterPanel === 'equipment' ? 'on' : ''}" data-do="tab" data-a="characterPanel" data-b="equipment">Equipment</button></div><div class="chargrid character-layout ${UI.tab.characterPanel === 'equipment' ? 'show-equipment' : ''}"><section class="panel paper"><div class="phead"><h2>Equipment</h2><small class="mono">Hero ${DQ.advLvl()} · Combat ${DQ.combatLvl()}</small></div>
      <div class="doll paper-doll" role="group" aria-label="Equipment around your hero"><div class="dollc">${UI.heroFigure()}</div>${SLOT_LAYOUT.map(sl => `<div class="ds ds-${sl}">${equipCell(sl)}</div>`).join('')}</div>
      <section data-reference="true" class="equipment-stats" id="equipment-stats"><h3 id="equipment-stats-toggle">Combat stats <span class="mono">Max hit ${ps.max}</span></h3>
        <div class="bonuses">${[['Attack', b.atk, 'attack'], ['Strength', b.str, 'strength'], ['Defence', b.def, 'defence'], ['Ranged', b.rng, 'ranged'], ['Arrows', b.rngStr, 'ranged'], ['Magic', b.mag, 'magic']].map(([n, v, sk]) => `<div style="--c:${D.SK[sk].col}">${ico(sk)}<span>${n}</span><b class="mono">+${v}</b></div>`).join('')}</div>
        <div class="statlist"><div><span>Fighting style</span><b>${DQ.cap(ps.style)}</b></div><div><span>Damage reduction</span><b class="mono">${Math.round(ps.red * 100)}%</b></div><div><span>Total level</span><b class="mono" data-b="totlvl"></b></div></div>
      </section>
      <section data-reference="true" class="equipment-appearance" id="equipment-appearance"><h3 id="equipment-appearance-toggle">Appearance &amp; sharing</h3>${marks.length ? `<div class="fig-marks">${marks.map(mark => `<span class="fig-mark" data-tip="text:${esc(mark.sub)}">${ico(mark.ic)}${esc(mark.t)}</span>`).join('')}</div>` : ''}<p class="hint">Gear changes how your hero looks. Skill capes appear at levels 30, 60 and 99. Medals appear at Hero levels 10, 25, 50 and 75.</p><button class="btn sm" data-do="share">${ico('star')}Share hero</button></section></section>
    <div class="col"><section class="panel"><div class="phead"><h2>Backpack</h2><span><small class="mono" data-b="packn"></small> <button class="btn sm" data-do="go" data-a="bank">${ico('bank')}Bank (${Object.keys(S().bank).length})</button> <button class="btn sm" data-do="depositall">Bank all</button></span></div><div class="filtbar"><div class="tabs">${UI.catTabs(s.inv, UI.packFilter, 'packfilter')}</div><input id="packq" class="search" data-in="packq" placeholder="Search backpack" value="${esc(UI.packQ)}" aria-label="Search backpack"></div>${UI.inventoryPicker('pack')}<div class="slots" id="packgrid">${UI.packGrid()}</div><p class="hint">The backpack holds ${DQ.packMax()} kinds of item. When it is full, new kinds go straight to your <b>bank</b>. A storage chest in your house adds more space.</p></section>
    <section class="panel" id="detailbox">${UI.detail(UI.sel, UI.selFrom)}</section></div></div>`;
};

/* ---------- Bank ---------- */
const bankIds = () => Object.keys(S().bank).filter(id => inCat(id, UI.bankFilter) && D.ITEMS[id].name.toLowerCase().includes(UI.bankQ.toLowerCase())).sort(byCat);
UI.bankGrid = () => { const ids = bankIds(); return ids.length ? ids.map(id => `<button class="slot ${UI.sel === id && UI.selFrom === 'bank' ? 'sel' : ''}" style="--c:${D.ITEMS[id].col}" data-do="sel" data-a="${id}" data-b="bank" data-tip="item:${id}" aria-label="${esc(D.ITEMS[id].name)}, ${S().bank[id]} in bank">${DQ.itemIco(D.ITEMS[id])}<span class="n mono">${fmtK(S().bank[id])}</span></button>`).join('') : `<p class="dim" style="grid-column:1/-1">${Object.keys(S().bank).length ? 'Nothing matches that filter.' : 'Your bank is empty. Overflow and deposits end up here.'}</p>`; };
UI.V.bank = () => `<section class="panel shophead"><div><h2>Bank</h2><small class="dim">${Object.keys(S().bank).length} item types · Used automatically by tasks</small></div><button class="btn" data-do="depositall">${ico('bank')}Deposit backpack</button></section>
  <div class="chargrid"><section class="panel"><div class="phead bank-filters"><div class="tabs">${UI.catTabs(S().bank, UI.bankFilter, 'bankfilter')}</div><input id="bankq" class="search" data-in="bankq" placeholder="Search" value="${esc(UI.bankQ)}" aria-label="Search bank"></div>${UI.inventoryPicker('bank')}<div class="slots big" id="bankgrid">${UI.bankGrid()}</div></section>
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
    <section class="panel"><div class="phead"><h2>Interface</h2></div><div class="stack">${tog('notify', 'Notifications', 'Show level-ups, unlocks and important alerts. Routine finds and achievements stay in the bell.')}${tog('tips', 'Tooltips')}${tog('reduceFx', 'Reduce effects', 'Turns off click ripples, particles and bouncy animations')}
      <label class="nameedit"><span class="k">Hero name</span><input id="heroname" data-in="name" maxlength="20" value="${esc(S().name)}"></label></div></section>
    <section class="panel"><div class="phead"><h2>Gameplay</h2></div><div class="stack">${tog('autoEat', 'Eat automatically in combat', `Eats at ${s.eatAt}% health. Change it on the Combat page.`)}<p class="sm dim">You can close the game at any time. Your current task, your crops, animals and workers keep going while you are away (full speed for 2 hours, then half speed, up to 8 hours), and you get a summary when you come back.</p></div></section>
    <section class="panel"><div class="phead"><h2>Save data</h2><small class="mono">Autosaves every 10s</small></div><div class="stack"><div class="btnrow wrap"><button class="btn" data-do="export">${ico('save')}Export save</button><button class="btn" data-do="import">Import save</button><button class="btn" data-do="savenow">Save now</button></div>
      <button class="btn danger" data-do="newgame">Erase and start a new game</button></div></section>
    <section class="panel"><div class="phead"><h2>Shortcuts</h2></div><dl class="keys">${[['Space', 'Stop or resume your task'], ['M', 'Mute or unmute'], ['1 – 9, 0', 'Home, Fishing … Combat'], ['T', 'Map'], ['S', 'Shop'], ['Q', 'Quests'], ['F', 'Farm'], ['H', 'House'], ['C', 'Inventory'], ['B', 'Bank'], ['Esc', 'Close dialogs']].map(([k, d]) => `<dt><kbd>${k}</kbd></dt><dd>${d}</dd>`).join('')}</dl></section>
    <section class="panel"><div class="phead"><h2>About</h2></div><p class="sm">Idlewick, a single-player idle adventure. Everything is a dashboard: pick a task, watch the numbers climb, and push on to the next town.</p><p class="sm dim">Version 0.4 · All sounds and music are generated live.</p></section></div>`;
};

/* ---------- Welcome back ---------- */
function welcome(sum, gap) {

  const xp = Object.entries(sum.xp).sort((a, b) => b[1] - a[1]), items = Object.entries(sum.items).sort((a, b) => D.ITEMS[b[0]].val * b[1] - D.ITEMS[a[0]].val * a[1]).slice(0, 8);
  const capped = gap > DQ.OFFLINE_CAP, eff = DQ.offlineEff(gap), taper = eff < Math.min(gap, DQ.OFFLINE_CAP);
  const body = (UI.returnPlan ? UI.returnPlan(sum) : '') + `<p class="sm dim">You were away for <b>${DQ.fmtTime(gap)}</b>${taper || capped ? `, which counted as <b>${DQ.fmtTime(eff)}</b> of work (full speed for the first 2 hours, half speed after that${capped ? ', and nothing past 8 hours' : ''})` : ''}. ${sum.label ? `You were: <b>${sum.label.toLowerCase()}</b>.` : ''} ${sum.stopped ? '<b>Your task stopped early:</b> you ran out of materials, food or health.' : ''} ${sum.died ? 'You were defeated.' : ''}</p>
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
  taskselect: (kind, id, el) => { UI.taskChoice[el.dataset.page] = id; UI.render(false); if (innerWidth <= 700) document.querySelector(kind === 'fight' ? '.encounter-controls' : '.activity-stage')?.scrollIntoView({ block: 'start', behavior: 'smooth' }); },
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
  qstart: a => { DQ.startQuest(a); if (UI.view === 'quests') UI.render(false); },
  qclaim: a => { DQ.claimQuest(a); if (UI.view === 'quests') { UI.questTab = null; UI.render(false); } },
  qtab: a => { UI.questTab = a; UI.render(false); },
  questcontinue: id => {
    const q = D.QM[id], progress = S().q[id];
    const objective = q.obj.find((o, j) => DQ.objProg(q, progress, j) < o.n) || q.obj[0];
    const page = DQ.objPage(q, objective);
    if (page === 'combat' && D.MON[objective.key]) UI.taskChoice.combat = objective.key;
    if (page === 'map') UI.mapSel = objective.ev === 'visit' ? objective.key : q.town;
    const kind = { catch: 'fish', chop: 'wood', mine: 'mine', thieve: 'thieve' }[objective.ev];
    if (kind && D.NODE[kind + ':' + objective.key]) UI.taskChoice[page] = objective.key;
    const recipe = Object.values(D.RECIPES).find(r => r.skill === page && (r.out[objective.key] || r.evKey === objective.key));
    if (recipe) UI.taskChoice[page] = recipe.id;
    DQ.go(page);
  },
  mapsel: a => { UI.mapSel = a; DQ.sfx('tab'); UI.render(false); },
  travel: a => UI.travelAnim(a),
  shopselect: a => { UI.shopSelected[UI.shopTab] = a; UI.render(false); if (innerWidth <= 860) document.querySelector('.shop-task')?.scrollIntoView({ block: 'start', behavior: 'smooth' }); },
  rareselect: a => { UI.tab.rareChoice = a; UI.render(false); if (innerWidth <= 860) document.querySelector('.shop-task')?.scrollIntoView({ block: 'start', behavior: 'smooth' }); },
  shoptab: a => { UI.shopTab = a; UI.render(false); }, shopqty: a => { UI.shopQty = +a; UI.render(false); },
  buy: a => { const it = D.ITEMS[a]; if (DQ.buy(a, it.type === 'tool' ? 1 : UI.shopQty)) { DQ.log(`You buy ${it.type === 'tool' ? '' : UI.shopQty + '× '}${it.name.toLowerCase()}.`); UI.render(false); } },
  sell: (a, b, el) => {
    const from = el && el.dataset.from, store = from === 'pack' ? S().inv : from === 'bank' ? S().bank : null;
    const available = store ? store[a] || 0 : DQ.have(a), n = Math.min(b === 'all' ? available : +b, available);
    const coins = DQ.sell(a, n, from);
    if (coins !== undefined) DQ.log(`You sell ${n}× ${D.ITEMS[a].name.toLowerCase()} for ${fmt(coins)} coins.`, 'good');
    if (!(store ? store[a] : DQ.have(a)) && UI.sel === a) UI.sel = null;
    UI.render(false);
  },
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
DO.choose = (a, b, button) => {
  const group = button.closest('.choice-buttons');
  group.querySelectorAll('button').forEach(el => { el.classList.toggle('on', el === button); el.setAttribute('aria-pressed', String(el === button)); });
  button.dispatchEvent(new Event('change', { bubbles: true }));
};
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
document.addEventListener('change', e => {
  const t = e.target, input = t.dataset && t.dataset.in;
  if (input === 'vol') DQ.sfx('coin');
  if (input === 'page') DQ.go(t.value);
  if (input === 'travel-town') UI.DO.mapsel(t.value);
  if (input === 'shop-item') { UI.shopSelected[UI.shopTab] = t.value; UI.render(false); }
  if (input === 'shop-quantity') UI.DO.shopqty(t.value);
  if (input === 'rare-choice') { UI.tab.rareChoice = t.value; UI.render(false); }
  if (input === 'task-choice') { UI.taskChoice[t.dataset.a] = t.value; UI.render(false); }
  if (input === 'training-focus') UI.DO.style(t.dataset.a, t.value);
  if (input === 'eat-threshold') UI.DO.eatat(t.value);
  if (input === 'town-project') { UI.tab.projectChoice = t.value; UI.render(false); }
  if (input === 'combat-spell') UI.DO.spell(t.value);
  if (input === 'potion-choice') { UI.tab.potionChoice = t.value; UI.render(false); }
  if (input === 'itemfilter') UI.DO[t.dataset.a](t.value);
  if (input === 'inventory-item') { if (t.value) UI.DO.sel(t.value, t.dataset.a); else UI.DO.desel(); }
  if (input === 'quest-choice') { UI.tab.questSelected = t.value; UI.render(false); }
  if (input === 'mastery-skill') { UI.tab.masterySkill = t.value; UI.render(false); }
  if (input === 'research-choice') { UI.tab.researchChoice = t.value; UI.render(false); }
  if (input === 'farm-seed') UI.DO.seed(t.value);
  if (input === 'house-furniture') { UI.tab.houseFurniture = t.value; UI.render(false); }
  if (input === 'hire-choice') { UI.tab.hireChoice = +t.value; UI.render(false); }
  if (input === 'settings-category') { UI.tab.settingsPanel = t.value; UI.render(false); }
  if (input === 'house-room') { UI.tab.houseRoom = t.value; UI.render(false); }
  if (input === 'worker-choice') { UI.tab.workerChoice = t.value; UI.render(false); }
  if (input === 'worker-task') UI.DO.assign(t.dataset.a, t.value);
  if (input === 'pet-choice') { UI.tab.petChoice = t.value; UI.render(false); }
});

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
UI.renderPageNotice = () => {
  const view = $('#view'); if (!view) return;
  const old = view.querySelector('.page-notice'); if (old) old.remove();
  const notice = UI.pageNotice;
  if (notice && notice.page === UI.view) view.insertAdjacentHTML('afterbegin', `<section class="panel page-notice" role="status"><div class="phead"><h2>${esc(notice.title)}</h2><button class="btn sm" data-do="dismissnotice">Dismiss</button></div><p>${esc(notice.text)}</p></section>`);
};
UI.DO.dismissnotice = () => { UI.pageNotice = null; UI.renderPageNotice(); };
UI.render = fresh => {
  if (DQ.markNoticesRead) DQ.markNoticesRead(UI.view);
  const focus = document.activeElement, focusKey = focus && focus.dataset ? { do: focus.dataset.do, a: focus.dataset.a, b: focus.dataset.b } : null;
  const focusId = focus && focus.closest('#view') ? focus.id : null;
  const y = scrollY; DQ.hideTip && DQ.hideTip();
  const id = UI.view; let html;
  try {
    if (D.SK[id] && !DQ.skillUnlocked(id)) html = UI.lockedPage(id);
    else if (['fishing', 'woodcutting', 'mining', 'thieving'].includes(id)) html = UI.V.gather(id);
    else if (['cooking', 'smithing', 'crafting'].includes(id)) html = UI.V.recipes(id);
    else html = UI.V[id]();
  } catch (e) { console.error(e); html = `<section class="panel"><h2>Something went wrong</h2><p class="dim">This page could not be drawn. Your progress is safe.</p></section>`; }
  const v = $('#view'); v.innerHTML = html; UI.renderPageNotice(); if (fresh) { v.classList.add('enter'); clearTimeout(UI._et); UI._et = setTimeout(() => v.classList.remove('enter'), 800); }
  [...v.children].forEach((el, i) => el.style.setProperty('--i', i));
  UI.collectProg(); UI.renderLog(); UI.upd(); if (id === 'activity') UI.chart();
  $$('.nav').forEach(n => n.classList.toggle('on', n.dataset.a === id));
  if (UI.after[id]) UI.after[id](); document.body.dataset.page = id;
  if (!fresh && focusId && document.getElementById(focusId)) {
    document.getElementById(focusId).focus({ preventScroll: true });
  } else if (!fresh && focusKey && focusKey.do) {
    const replacement = [...v.querySelectorAll('[data-do]')].find(el => el.dataset.do === focusKey.do && el.dataset.a === focusKey.a && el.dataset.b === focusKey.b);
    if (replacement) replacement.focus({ preventScroll: true });
  }
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
    if (DQ.invDirty) { DQ.invDirty = false; const ae = document.activeElement; /* keep typing in a search box undisturbed while loot arrives */ if (ae && (ae.id === 'packq' || ae.id === 'bankq')) { const g = $(ae.id === 'packq' ? '#packgrid' : '#bankgrid'); if (g) g.innerHTML = ae.id === 'packq' ? UI.packGrid() : UI.bankGrid(); } else if (['character', 'bank', 'shop', 'magic', 'cooking', 'smithing', 'crafting'].includes(UI.view)) refresh(); }
    if (UI.view === 'combat') { const s = sig(); if (s !== foodSig) { foodSig = s; const f = $('#foodbox'); if (f) { f.innerHTML = UI.foodChips(); UI.upd(); } } }
    if (UI.view === 'activity' && ++slow % 4 === 0) UI.chart();
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
    const el = document.createElement('div'); el.className = 'splat ' + kind; el.textContent = text; const impact = Math.max(0,(delay||0)-180) + (DQ.battleTiming?.impact||390); el.style.animationDelay = impact + 'ms'; box.appendChild(el); setTimeout(() => el.remove(), 1400 + impact);
  });
  DQ.on('slain', () => { const foe=$('#av-foe');setTimeout(()=>{if(foe?.isConnected)DQ.flash(foe,'slain');},DQ.battleTiming?.impact||390); });
  THEME(); UI.renderHud(); UI.renderRail(); UI.render(true); requestAnimationFrame(UI.frame);
};
})();
