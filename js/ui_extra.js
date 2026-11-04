/* Idlewick: UI for farming, house, hirelings, bestiary and pets. */
(() => {
const DQ = window.DQ, D = DQ.data, UI = DQ.ui, { $, $$, ico, fmt, fmtK, esc, clamp } = DQ;
const S = () => DQ.S, set = UI.set;
Object.assign(UI, { seed: null, beastTab: 'monsters' });
const GT = () => S().gameTime || 0;
const left = ms => { const s = Math.max(0, Math.ceil(ms / 1000)); return s >= 60 ? `${Math.floor(s / 60)}m ${s % 60}s` : `${s}s`; };
const plotArt = (p, st) => { const c = p.crop && D.CROP[p.crop]; return c ? DQ.plantSprite(Math.max(0, st), c.col, 64) : DQ.plantSprite(0, '#000', 64); };
const plotLabel = (p, st) => { const c = p.crop && D.CROP[p.crop]; return !c ? 'Empty plot: plant a seed' : st === 3 ? `${c.name}: ready to harvest` : `${c.name}: growing, ${Math.floor(DQ.plotPct(p) * 100)}%`; };
const stageOf = p => !p.crop ? -1 : DQ.plotRipe(p) ? 3 : DQ.plotPct(p) < .08 ? 0 : DQ.plotPct(p) < .45 ? 1 : 2;
const costChips = cost => Object.entries(cost).map(([k, n]) => k === 'coins' ? `<span class="rw ${S().coins >= n ? '' : 'short'}" style="--c:#f3d58a">${ico('coin')}${fmt(n)}</span>` : `<span class="rw ${DQ.have(k) >= n ? '' : 'short'}" style="--c:${D.ITEMS[k].col}" data-tip="item:${k}">${ico(D.ITEMS[k].ic)}${fmtK(DQ.have(k))}/${n} ${D.ITEMS[k].name.toLowerCase()}</span>`).join('');

/* ---------- Live binders for the new pages ---------- */
Object.assign(UI.B, {
  plot: (e, a) => {
    const p = S().farm.plots[a]; if (!p) return; const st = stageOf(p), c = p.crop && D.CROP[p.crop];
    /* live growth: re-render through the shared plant renderer (painted or fallback) whenever the crop or its stage changes */
    const key = (p.crop || '') + ':' + st + ':' + (DQ.artCompletionReady && DQ.artCompletionReady('farm-growth') ? 1 : 0);
    if (e._st !== key) {
      e._st = key; e.classList.toggle('ripe', st === 3); e.classList.toggle('empty', !c);
      const spr = $('.pspr', e); if (spr) spr.innerHTML = plotArt(p, st);
      const name = $('b', e); if (name) set(name, c ? c.name : 'Empty plot');
      e.setAttribute('aria-label', plotLabel(p, st));
    }
    const bar = $('.pbar i', e); if (bar) bar.style.width = (DQ.plotPct(p) * 100) + '%';
    const t = $('.ptime', e); if (t) set(t, !c ? 'Empty' : st === 3 ? 'Ready to harvest' : left(p.at + p.dur - GT()));
  },
  pen: (e, a) => {
    const an = S().farm.animals[a]; if (!an) return; const per = DQ.animalPeriod(an);
    const bar = $('.pbar i', e); if (bar) bar.style.width = (an.stored >= 5 ? 100 : clamp(an.t / per, 0, 1) * 100) + '%';
    const t = $('.pst', e); if (t) set(t, `${an.stored} / 5`);
    e.classList.toggle('hungry', !!an.hungry && an.stored < 5); e.classList.toggle('happy', an.happy > GT()); e.classList.toggle('full', an.stored >= 5);
  },
  trough: e => set(e, fmt(S().farm.feed)),
  wk: (e, a) => {
    const w = S().workers.find(x => x.id === a); if (!w) return; const d = DQ.workerDur(w);
    const bar = $('.pbar i', e); if (bar) bar.style.width = (w.task && d && !w.unpaid ? clamp(w.t / d, 0, 1) * 100 : 0) + '%';
    const l = $('.wlv', e); if (l) set(l, D.lvlOf(w.xp));
  },
  hirewait: e => { const ms = 600000 - (GT() - S().hire.at); set(e, ms > 0 ? `Free refresh in ${left(ms)}` : 'Free refresh ready'); },
});

/* ---------- Farm ---------- */
UI.V.farming = () => {
  const F = S().farm; DQ.syncPlots();
  const seedIds = D.CROPS.filter(c => DQ.have('seed_' + c.id));
  if (!UI.seed || !DQ.have('seed_' + UI.seed)) UI.seed = (seedIds.find(c => c.id === F.next) || seedIds.find(c => c.id === F.last) || seedIds[0] || {}).id || null;
  const plots = F.plots.map((p, i) => {
    const c = p.crop && D.CROP[p.crop], st = stageOf(p);
    return `<button class="plot ${c ? '' : 'empty'} ${st === 3 ? 'ripe' : ''}" data-i="${i}" data-b="plot:${i}" data-do="plot" data-a="${i}" aria-label="${esc(plotLabel(p, st))}" style="--c:${c ? c.col : '#7a5230'}">
      <span class="pspr">${plotArt(p, st)}</span>
      <b>${c ? c.name : 'Empty plot'}</b><small class="ptime mono"></small><span class="bar pbar"><i></i></span></button>`;
  }).join('');
  const nextPlot = D.PLOT_PRICES[F.plotsBought];

  const pens = Array.from({ length: F.pensBought }, (_, i) => {
    const an = F.animals[i]; if (!an) return `<button class="pen emptypen" data-do="farmmarket" data-a="hen"><span>${ico('barn')}</span><b>Empty pen</b><small>${DQ.townUnlocked('mossbarrow') ? 'Buy an animal below' : 'The livestock trader is in Mossbarrow'}</small></button>`;
    const A = D.ANIMAL[an.id], pr = D.ITEMS[A.prod];
    return `<div class="pen" data-i="${i}" data-b="pen:${i}" style="--c:${A.col}"><button class="pspr" data-do="petanimal" data-a="${i}" data-tip="text:Pet ${esc(an.name)}: makes them work 25% faster for 3 minutes">${DQ.animalSprite(A, 64, 'bob')}</button>
      <div class="pen-t"><b>${esc(an.name)}</b><small>${A.name} · makes ${pr.name.toLowerCase()} every ${left(DQ.animalPeriod(an))}</small><span class="bar pbar"><i></i></span><small><span class="pst mono"></span> ${pr.name.toLowerCase()} ready <span class="tag hungrytag">Hungry</span><span class="tag happytag">Happy</span></small></div>
      <button class="btn sm" data-do="collect" data-a="${i}">Collect</button></div>`;
  }).join('');
  const nextPen = D.PEN_PRICES[F.pensBought], mossOpen = DQ.townUnlocked('mossbarrow');
  const market = D.ANIMALS.map(a => { const lock = DQ.lvl('farming') < a.lvl; return `<div class="srow ${lock || S().coins < a.price ? 'cant' : ''}" id="buy-${a.id}"><span class="mini">${DQ.animalSprite(a, 40)}</span><div class="sr-t"><b>${a.name}</b><small>Makes ${D.ITEMS[a.prod].name.toLowerCase()} (${fmt(D.ITEMS[a.prod].val)} coins) · <span class="${lock ? 'bad' : 'ok'}">Farming ${a.lvl}</span></small></div><span class="price mono">${ico('coin')}${fmt(a.price)}</span><button class="btn sm ${lock ? '' : 'primary'}" data-do="buyanimal" data-a="${a.id}" ${lock ? 'disabled' : ''}>Buy</button></div>`; }).join('');
  return `<div class="farm-workspace"><section class="panel farm-task"><div class="phead"><h2>Fields</h2><small>Farming level <b data-b="lvl:farming"></b></small></div>
    <div class="seed-choices" role="group" aria-label="Choose a seed">${D.CROPS.filter(c=>DQ.have('seed_'+c.id)).map(c=>`<button class="seed-choice ${UI.seed===c.id?'on':''}" data-do="seed" data-a="${c.id}" aria-pressed="${UI.seed===c.id}" ${DQ.lvl('farming')<c.lvl?'disabled':''}>${DQ.itemIco(D.ITEMS['seed_'+c.id])}<span>${c.name}<small>${DQ.have('seed_'+c.id)} seeds · ${DQ.lvl('farming')<c.lvl?`Needs Farming ${c.lvl}`:`Level ${c.lvl}`}</small></span></button>`).join('')}</div>
        <div class="btnrow wrap farm-actions"><button class="btn primary" data-do="harvestall">Harvest ripe crops</button><button class="btn" data-do="plantall" ${UI.seed ? '' : 'disabled'}>Plant empty plots</button></div>${UI.seed ? `<p>Grows in ${left(DQ.growDur(D.CROP[UI.seed]))}. Crops keep growing while you are away.</p>` : '<p>No seeds available. Buy seeds in the shop.</p>'}
        <div class="plots">${plots}${nextPlot !== undefined ? `<button class="plot buyplot" data-do="buyplot"><span>${ico('crop')}</span><b>Buy a plot</b><small>${fmt(nextPlot)} coins</small></button>` : ''}</div>
        <section data-reference="true" id="farm-settings"><h3>Planting settings</h3><button class="tog ${F.autoReplant ? 'on' : ''}" data-do="autoreplant"><span class="sw"></span>Replant after harvest</button></section></section><section class="panel farm-animals"><div class="phead"><h2>Animals</h2></div><div class="btnrow wrap farm-actions"><button class="btn primary" data-do="collectall">Collect all produce</button><button class="btn" data-do="filltrough">Fill feed trough</button><button class="btn" data-do="makefeed">Make feed</button></div><p>Trough <b class="mono" data-b="trough"></b> feed · ${fmtK(DQ.have('feed'))} feed in storage</p>
      ${!F.animals.some(Boolean) ? `<div class="first-animal" role="note"><span class="fa-art">${DQ.animalSprite(D.ANIMAL.hen, 48)}</span><div><b>Your pens are empty</b><small>${mossOpen ? `A hen is the easiest start: ${fmt(D.ANIMAL.hen.price)} coins, and she lays eggs while you do other things.` : 'Defeat Grubnash and travel to Mossbarrow to meet the livestock trader.'}</small></div>${mossOpen ? `<button class="btn sm primary" data-do="farmmarket" data-a="hen">Find a hen</button>` : ''}</div>` : ''}<div class="pens">${pens}${nextPen !== undefined ? `<button class="pen buypen" data-do="buypen">Build a pen · ${fmt(nextPen)} coins</button>` : ''}</div>
      <section data-reference="true" id="livestock-market"><h3>Buy animals</h3>${mossOpen ? `<div class="srows">${market}</div>` : '<p>Defeat Grubnash to reach the livestock trader in Mossbarrow.</p>'}</section></section></div>
    <section data-reference="true" class="panel reference-panel" id="farming-progress"><h3>Skill progress &amp; tools</h3>${UI.skillHero('farming', UI.toolLine('farming'))}</section>`;
};

/* ---------- House ---------- */
const houseArt = () => `<svg class="houseart" viewBox="0 0 320 150" aria-hidden="true"><rect width="320" height="150" fill="#2a4a5a"/><circle cx="270" cy="32" r="14" fill="#f3e6b0"/><path d="M0 120q80-30 160-10t160-6v46H0z" fill="#3f6a3a"/><rect x="110" y="70" width="100" height="58" fill="#d9c9a0"/><path d="M100 72l60-40 60 40z" fill="#8a3f30"/><rect x="150" y="96" width="20" height="32" fill="#6a4a30"/><rect x="122" y="86" width="18" height="16" fill="#f3d58a"/><rect x="180" y="86" width="18" height="16" fill="#f3d58a"/><rect x="188" y="40" width="10" height="22" fill="#5a3a2a"/></svg>`;
UI.V.house = () => {
  const H = S().house;
  if (!H.owned) {
    const ok = DQ.advLvl() >= D.HOUSE.adv;
    return `<section class="panel housebuy fancy">${(DQ.cottageArt && DQ.cottageArt()) || houseArt()}<div><span class="k">For sale</span><h2>A cottage of your own</h2><p>${DQ.cap(D.HOUSE.where)}. Fill it with furniture for bonuses that last forever: faster regeneration, more XP, extra pack space, more farm plots and beds for workers.</p>
      <div class="bc-req ${ok ? 'ok' : 'bad'}">${ok ? '✓' : '✗'} Hero level ${D.HOUSE.adv} <span class="mono">(you: ${DQ.advLvl()})</span></div><div class="quick"><button class="btn primary" data-do="buyhouse" ${ok ? '' : 'disabled'}>${ico('coin')} Buy for ${fmt(D.HOUSE.price)} coins</button></div></div></section>`;
  }
  const f = DQ.fx(), sum = [['xpAll', v => `+${Math.round(v * 100)}% XP`], ['coin', v => `+${Math.round(v * 100)}% coins`], ['regen', v => `+${Math.round(v * 100)}% regeneration`], ['pack', v => `+${v} backpack slots`], ['dr', v => `${Math.round(v * 100)}% less damage`], ['plots', v => `+${v} plots`], ['workers', v => `+${v} worker beds`], ['dmg', v => `+${Math.round(v * 100)}% damage`]].filter(([k]) => f[k]).map(([k, fn]) => `<span class="rw" style="--c:#f3d58a">${fn(f[k])}</span>`).join('');
  const selectedRoom = D.ROOMS.find(r => r.id === UI.tab.houseRoom) || D.ROOMS[0];
  const selectedFurniture = selectedRoom.furn.find(f => f.id === UI.tab.houseFurniture) || selectedRoom.furn[0];
  const rooms = [selectedRoom].map((r, i) => {
    const built = H.rooms[r.id];
    if (!built) return `<section class="panel room locked" style="--i:${i}"><div class="phead" style="margin:0"><h2>${r.name}</h2><span class="state">Not built</span></div><p class="blurb">${r.blurb}</p><div class="rws">${r.furn.map(fu => `<span class="rw" style="--c:#8fa09e">${ico(fu.ic)}${fu.name}</span>`).join('')}</div><button class="btn ${S().coins >= r.price ? 'primary' : ''}" data-do="buildroom" data-a="${r.id}">Build for ${fmt(r.price)} coins</button></section>`;
    return `<section class="panel room" style="--i:${i}"><label class="page-picker" for="house-furniture">Furniture${UI.choiceButtons(`<select id="house-furniture" data-in="house-furniture">${r.furn.map(fu => `<option value="${fu.id}" ${fu === selectedFurniture ? 'selected' : ''}>${fu.name}</option>`).join('')}</select>`)}</label>${[selectedFurniture].map(fu => {
      const t = H.furn[fu.id] || 0, vals = Object.values(fu.fx)[0], nextCost = fu.costs[t];
      return `<div class="furn"><div class="fu-h"><span class="fu-ic">${DQ.furnIco ? DQ.furnIco(fu.id, fu.ic) : ico(fu.ic)}</span><div><b>${fu.name}</b><small>${t ? fu.label(vals[t - 1]) : 'Not placed yet'}</small></div><span class="pips">${[1, 2, 3].map(n => `<i class="${t >= n ? 'on' : ''}"></i>`).join('')}</span></div>
        ${t < 3 ? `<div class="fu-next"><button class="btn sm ${DQ.canAfford(nextCost) ? 'primary' : ''}" data-do="furnish" data-a="${fu.id}" ${DQ.canAfford(nextCost) ? '' : 'disabled'}>${t ? 'Upgrade' : 'Build'}</button><small>${t ? 'Upgrade' : 'Place'}: ${fu.label(vals[t])}</small><div class="rws">${costChips(nextCost)}</div></div>` : '<small class="ok">Fully upgraded</small>'}</div>`;
    }).join('')}</section>`;
  }).join('');
  return `<section class="panel"><div class="phead"><h2>Your home</h2></div><label class="page-picker" for="house-room">Room${UI.choiceButtons(`<select id="house-room" data-in="house-room">${D.ROOMS.map(r => `<option value="${r.id}" ${r === selectedRoom ? 'selected' : ''}>${r.name}${H.rooms[r.id] ? '' : ' · Not built'}</option>`).join('')}</select>`)}</label></section><div class="qgrid">${rooms}</div><section data-reference="true" class="panel" id="house-bonuses"><h3>Home bonuses &amp; appearance</h3><div class="rws">${sum}</div>${houseArt()}</section>`;
};

/* ---------- Hirelings ---------- */
UI.V.hirelings = () => {
  if (DQ.advLvl() < D.HIRE.adv) return `<section class="panel locked-page fancy" style="--c:#d8a64a"><div class="big">${ico('users')}</div><h2>Workers</h2><p>Hire workers: fishers, woodcutters, miners and farmhands who work for you and level up as they go.</p><p>Opens at <b>Hero level ${D.HIRE.adv}</b>. You are level <b class="mono" data-b="adv"></b>.</p><span class="bar" style="max-width:360px"><i data-b="advbar"></i></span></section>`;
  if (!S().hire.cands.length) DQ.refreshBoard(false);
  const slots = DQ.workerSlots(), ws = S().workers;
  const selectedWorker = ws.find(w => w.id === UI.tab.workerChoice) || ws[0];
  const mine = (selectedWorker ? [selectedWorker] : []).map(w => {
    const L = D.lvlOf(w.xp), sk = D.SK[w.skill], tr = DQ.traitOf(w), node = w.task && D.NODE[w.task];
    const opts = w.skill === 'farming' ? '' : Object.values(D.NODE).filter(n => n.skill === w.skill && DQ.townUnlocked(n.town)).map(n => { const ok = n.lvl <= L, on = w.task === n.kind + ':' + n.id; return `<option value="${n.kind}:${n.id}" ${on ? 'selected' : ''} ${ok ? '' : 'disabled'}>${n.name} · ${D.TOWN[n.town].name} · Level ${n.lvl}</option>`; }).join('');
    const made = Object.entries(w.made).sort((a, b) => b[1] - a[1]).slice(0, 4).map(([id, n]) => `<span class="rw" style="--c:${D.ITEMS[id].col}">${ico(D.ITEMS[id].ic)}${fmtK(n)}</span>`).join('');
    const status = w.unpaid ? '<span class="bad">Unpaid, not working</span>' : w.skill === 'farming' ? (w.task ? 'Tending your farm' : 'Waiting for orders') : node ? `Working: ${node.name} (${D.TOWN[node.town].name})` : 'Idle, pick a job below';
    return `<section class="panel worker" data-b="wk:${w.id}" style="--c:${sk.col}"><div class="wk-h"><span class="w-ic">${(DQ.workerArt && DQ.workerArt(w.skill)) || ico(w.skill)}</span><div><b>${esc(w.name)}</b><small>${sk.name} hand · level <span class="wlv mono">${L}</span> · ${tr[0]}: ${tr[3]}</small></div><button class="linkbtn" data-do="dismiss" data-a="${w.id}">Dismiss</button></div>
      <span class="bar pbar"><i></i></span><small class="dim">${status} · wage ${DQ.workerWage(w).toFixed(1)} coins/min</small>
      ${w.skill === 'farming' ? `<div class="btnrow"><button class="btn sm ${w.task ? '' : 'primary'}" data-do="assign" data-a="${w.id}" data-b="${w.task ? '' : 'farm'}">${w.task ? 'Stop tending' : 'Start tending the farm'}</button></div><small class="dim">Harvests and replants ripe crops and collects from your animals.</small>` : `<label class="page-picker" for="worker-task">Job${UI.choiceButtons(`<select id="worker-task" data-in="worker-task" data-a="${w.id}"><option value="" ${w.task ? '' : 'selected'}>Rest</option>${opts}</select>`)}</label>`}
      ${made ? `<div class="rws"><span class="k">Sent to bank</span>${made}</div>` : ''}</section>`;
  }).join('');
  const selectedCandidate = Math.min(UI.tab.hireChoice || 0, S().hire.cands.length - 1);
  const candidate = S().hire.cands[selectedCandidate];
  const candidateSkill = candidate && D.SK[candidate.skill], trait = candidate && D.HIRE_TRAITS.find(t => t[0] === candidate.trait);
  const canHire = candidate && S().coins >= candidate.fee && ws.length < slots;
  const cands = candidate ? `<div class="cand" style="--c:${candidateSkill.col}"><span class="w-ic">${ico(candidate.skill)}</span><div><b>${esc(candidate.name)}</b><small>${candidateSkill.name} · level ${candidate.lvl}</small><small>${trait[0]}: ${trait[3]}</small><small class="mono">${candidate.wage} coins/min</small></div><button class="btn sm ${canHire ? 'primary' : ''}" data-do="hire" data-a="${selectedCandidate}" ${canHire ? '' : 'disabled'}>Hire · ${fmt(candidate.fee)}</button></div>` : '<p>No candidates right now.</p>';
  const free = GT() - S().hire.at >= 600000;
  const hiring = UI.tab.workersView === 'hire' || !ws.length;
  return `<section class="panel shophead"><div><span class="k">Workers</span><h2>${ws.length} of ${slots} bed${slots > 1 ? 's' : ''} filled</h2><small class="dim">Items go to your bank · wages paid per minute</small></div></section>
    <div class="tabs worker-mobile-tabs"><button class="tab ${hiring ? '' : 'on'}" data-do="tab" data-a="workersView" data-b="team">Your team</button><button class="tab ${hiring ? 'on' : ''}" data-do="tab" data-a="workersView" data-b="hire">Hire</button></div>
    <div class="worker-panels"><div class="worker-team ${hiring ? 'mobile-hide' : ''}">${mine ? `<label class="panel page-picker" for="worker-choice">Worker${UI.choiceButtons(`<select id="worker-choice" data-in="worker-choice">${ws.map(w=>`<option value="${w.id}" ${w === selectedWorker ? 'selected' : ''}>${esc(w.name)} · ${D.SK[w.skill].name}</option>`).join('')}</select>`)}</label>${mine}` : '<section class="panel">Your team is empty. Hire a worker to get started.</section>'}</div>
    <section class="panel worker-board ${hiring ? '' : 'mobile-hide'}"><div class="phead"><h2>Hiring board</h2><span class="btnrow"><small class="mono" data-b="hirewait"></small><button class="btn sm" data-do="refreshboard">${free ? 'Refresh (free)' : 'Refresh · 100'}</button></span></div><label class="page-picker" for="hire-choice">Candidate${UI.choiceButtons(`<select id="hire-choice" data-in="hire-choice">${S().hire.cands.map((c,i)=>`<option value="${i}" ${i === selectedCandidate ? 'selected' : ''}>${esc(c.name)} · ${D.SK[c.skill].name}</option>`).join('')}</select>`)}</label><div class="cands">${cands}</div></section></div>`;
};

/* ---------- Bestiary and creatures ---------- */
UI.V.bestiary = () => {
  const tab = UI.beastTab, B = S().beast;
  let body;
  if (tab === 'monsters') {
    body = D.TOWNS.map(t => `<div class="sgroup"><div class="k">${DQ.townUnlocked(t.id) ? t.name : '???'}</div><div class="beasts">${D.MONLIST.filter(m => m.town === t.id).map(m => {
      const k = B.kills[m.id] || 0, known = k > 0, st = DQ.beastStars(m.id);
      const kn = m.drops.filter(([id]) => B.drops[m.id + ':' + id]), unk = m.drops.length - kn.length;
      const drops = kn.map(([id]) => `<span class="itm sm" style="--c:${D.ITEMS[id].col}" data-tip="item:${id}">${ico(D.ITEMS[id].ic)}</span>`).join('') + (unk ? `<small class="dim unkn" data-tip="text:This monster can drop ${unk} more item${unk > 1 ? 's' : ''} you have not found yet. Keep defeating it. On the Combat page, hover it to see its drops by rarity.">${unk} drop${unk > 1 ? 's' : ''} not found yet</small>` : '');
      return `<div class="beast ${known ? '' : 'unk'} ${m.boss ? 'bossb' : ''}" style="--c:${m.col}">${DQ.monSprite(m, 72, known ? 'bob' : 'sil')}<div><b>${known ? esc(m.name) : '???'}</b><small>${known ? `Lv ${m.cl} · ${m.hp} health · max ${m.max}` : 'Defeat one to learn more'}</small><small class="mono">${fmt(k)} defeated <span class="stars">${'★'.repeat(st)}${'☆'.repeat(3 - st)}</span></small>${known ? `<div class="drops">${drops || '<small class="dim">No drops</small>'}</div>` : ''}</div></div>`;
    }).join('')}</div></div>`).join('');
    body = `<p class="hint" style="margin-top:0">Stars at 10, 50 and 250 defeats. Each star adds 4% damage against that monster.</p>${body}`;
  } else {
    const act = S().pets.active, collection=DQ.collectiblePets?DQ.collectiblePets():D.PETS;
    const chosenPet = collection.find(p=>p.id===UI.tab.petChoice) || collection.find(p=>p.id===act) || collection[0];
    body = `<label class="page-picker" for="pet-choice">Creature${UI.choiceButtons(`<select id="pet-choice" data-in="pet-choice">${collection.map(p => `<option value="${p.id}" ${p === chosenPet ? 'selected' : ''}>${S().pets.owned[p.id] ? p.name : p.kind}</option>`).join('')}</select>`)}</label><div class="pets">${[chosenPet].map(p => {
      const own = S().pets.owned[p.id], lv = DQ.petLevel(p.id), s = p.src;
      const hint = s.type === 'hunt' ? `Can join you while hunting ${D.MON[s.mon].name}` : s.type === 'shop' ? `Found in ${D.TOWN[s.town].name} for ${fmt(s.price)} coins` : s.type === 'boss' ? `Sometimes joins you after defeating ${D.MON[s.mon].name}` : s.type === 'harvest' ? 'Hides among ripe crops' : `Found while ${D.SK[s.skill].name.toLowerCase() === 'thieving' ? 'thieving' : 'training ' + D.SK[s.skill].name}`;
      const shopBtn = !own && s.type === 'shop' && DQ.townUnlocked(s.town) ? `<button class="btn sm ${S().coins >= s.price ? 'primary' : ''}" data-do="buypet" data-a="${p.id}">Adopt · ${fmt(s.price)}</button>` : '';
      const abilities=own&&DQ.creatureAbilities?DQ.creatureAbilities(p.id).map(a=>`<span class="creature-ability ${a.open?'open':'locked'}"><b>Lv ${a.lv} · ${a.name}</b><small>${a.open?a.text:'Locked'}</small></span>`).join(''):'';
      return `<div class="petc ${own ? '' : 'unk'} ${act === p.id ? 'on' : ''}" style="--c:${p.col}">${DQ.petSprite(p, 64, own ? 'bob' : 'sil')}<b>${own ? p.name : '???'}</b><small>${own ? `${p.kind} · Level ${lv}` : hint}</small>${own ? `<small class="ok">${p.text}</small><div class="creature-abilities">${abilities}</div>${act === p.id ? '<span class="tag">Active companion</span>' : `<button class="btn sm" data-do="setpet" data-a="${p.id}">Bring along</button>`}` : shopBtn}</div>`;
    }).join('')}</div>`;
  }
  const collection=DQ.collectiblePets?DQ.collectiblePets():D.PETS, known=D.MONLIST.filter(m=>B.kills[m.id]).length, pets=collection.filter(p=>S().pets.owned[p.id]).length;
  return `<section class="panel shophead"><div><span class="k">Bestiary</span><h2>${known} of ${D.MONLIST.length} monsters · ${pets} of ${collection.length} companions</h2></div><div class="tabs">${[['monsters', 'Field guide'], ['pets', 'Creatures']].map(([k, n]) => `<button class="tab ${tab === k ? 'on' : ''}" data-do="beasttab" data-a="${k}">${n}</button>`).join('')}</div></section><section class="panel">${body}</section>`;
};

/* ---------- Actions ---------- */
const R = () => UI.render(false);
Object.assign(UI.DO, {
  seed: a => { UI.seed = a; if (D.CROP[a]) S().farm.next = a; DQ.sfx('tab'); R(); },
  farmmarket: a => { if (!DQ.townUnlocked('mossbarrow')) return DQ.toast('The livestock trader is in Mossbarrow, past Grubnash', true); const row = document.getElementById('buy-' + (a || 'hen')) || document.getElementById('livestock-market'); if (!row) return; row.scrollIntoView({ behavior: S().settings.reduceFx ? 'auto' : 'smooth', block: 'center' }); row.classList.remove('spotlight'); void row.offsetWidth; row.classList.add('spotlight'); const b = row.querySelector('button:not([disabled])'); if (b) b.focus({ preventScroll: true }); },
  openquest: a => { const st = DQ.questState(D.QM[a]); UI.questTab = st === 'new' ? 'available' : st === 'done' ? 'done' : st === 'locked' ? 'upcoming' : 'active'; UI.tab.questSelected = a; if (UI.view === 'quests') UI.render(false); else DQ.go('quests'); },
  plot: a => { const p = S().farm.plots[a]; if (DQ.plotRipe(p)) DQ.harvest(+a); else if (!p.crop) { if (!UI.seed) return DQ.toast('Pick a seed to plant first. The shop sells them.', true); DQ.plant(+a, UI.seed); } else DQ.toast(`${D.CROP[p.crop].name} is still growing`); },
  plantall: () => { if (!UI.seed) return DQ.toast('Pick a seed to plant first', true); if (!DQ.plantAll(UI.seed)) DQ.toast('No empty plots, or no seeds left'); },
  harvestall: () => DQ.harvestAll(),
  autoreplant: () => { S().farm.autoReplant = !S().farm.autoReplant; R(); },
  buyplot: () => DQ.buyPlot(), buypen: () => DQ.buyPen(), buyanimal: a => DQ.buyAnimal(a),
  collect: a => DQ.collect(+a), collectall: () => DQ.collectAll(), petanimal: a => DQ.petAnimal(+a),
  filltrough: () => DQ.fillTrough(), makefeed: () => DQ.makeFeed(),
  buyhouse: () => DQ.buyHouse(), buildroom: a => DQ.buildRoom(a), furnish: a => DQ.furnish(a),
  hire: a => DQ.hire(+a), dismiss: a => DQ.modal({ title: 'Dismiss this worker?', body: '<p>They will leave and take their experience with them.</p>', actions: [{ label: 'Dismiss', primary: true, fn: () => DQ.dismiss(a) }, { label: 'Keep them' }] }),
  assign: (a, b) => DQ.assign(a, b || null),
  refreshboard: () => DQ.refreshBoard(GT() - S().hire.at < 600000),
  beasttab: a => { UI.beastTab = a; R(); },
  setpet: a => { DQ.setPet(a); DQ.sfx('perk'); UI.renderHud(); R(); },
  buypet: a => { const p = D.PET[a]; if (S().coins < p.src.price) return DQ.toast('Not enough coins', true); S().coins -= p.src.price; DQ.awardPet(a); UI.renderHud(); R(); },
  petpet: () => { const p = S().pets.active && D.PET[S().pets.active]; if (!p) return; DQ.sfx('perk'); DQ.floatAt($('.hud-pet'), '♥', '#f08aa0'); DQ.flash($('.hud-pet'), 'hop'); },
});
const refresh = () => UI.refresh();
DQ.on('farm', () => { if (UI.view === 'farming') refresh(); });
DQ.on('house', () => { UI.renderHud(); if (UI.view === 'house' || UI.view === 'farming') refresh(); });
DQ.on('workers', () => { if (UI.view === 'hirelings') refresh(); });
DQ.on('pets', () => { UI.renderHud(); if (UI.view === 'bestiary' || UI.view === 'overview') refresh(); });
/* A plain reminder that the game carries on while closed */
DQ.on('act', () => {
  if (!DQ.act || S().seen.offlineTip || S().playtime < 240000) return; S().seen.offlineTip = 1;
  setTimeout(() => DQ.notify({ kind: 'info', key: 'offline', icon: 'clock', col: '#8fc7ff', title: 'You can close the game', text: `You will keep ${DQ.actLabel().toLowerCase()} while you are away: full speed for 2 hours, then half speed, up to 8 hours. Crops, animals and workers keep going too.`, sound: false, ttl: 12000 }), 1500);
});

/* ---------- Combat loot: session log, flying loot and loot-table tooltips ---------- */
DQ.lootLog = []; DQ.lootSum = { kills: 0, coins: 0, items: 0 };
const lootRow = e => { const it = D.ITEMS[e.id], where = e.coins ? 'Coins' : e.where || 'Backpack'; return `<div class="lootrow" style="--c:${e.rar[2]}" ${e.coins ? '' : `data-do="showitem" data-a="${e.id}" data-tip="text:Open it in your ${where.toLowerCase()}"`}><span class="itm sm" style="--c:${it.col}" data-tip="item:${e.id}">${DQ.itemIco(it)}</span><span class="ln">${e.coins ? `${it.name} <b class="mono">${fmt(e.n)} coins</b>` : `${e.n > 1 ? `<b class="mono">${fmtK(e.n)}×</b> ` : ''}${it.name}`}</span><span class="rar">${e.rar[1]}<small class="where ${where === 'Bank' ? 'bank' : ''}">${where === 'Bank' ? '→ Bank (backpack full)' : where === 'Coins' ? '' : '→ ' + where}</small></span></div>`; };
UI.lootPanel = () => `<section class="panel lootp"><div class="phead"><h2>Loot</h2><small class="mono" id="lootsum">${DQ.lootSum.kills} defeated · ${fmt(DQ.lootSum.coins)} coins · ${DQ.lootSum.items} items this session</small></div><div class="lootlist" id="lootbox">${DQ.lootLog.length ? DQ.lootLog.slice(0, 8).map(lootRow).join('') : '<p class="dim sm" style="margin:0">Defeat monsters for coins and a chance at gear, gems, seeds, coin pouches and rare treasure chests. Hover a monster to see what it can drop.</p>'}</div></section>`;
DQ.on('loot', (m, drops, c) => {
  DQ.lootSum.kills++; DQ.lootSum.coins += c + drops.filter(d => d.coins).reduce((a, d) => a + d.n, 0); DQ.lootSum.items += drops.filter(d => !d.coins).length;
  drops.forEach(d => { if (!d.coins) d.where = DQ.S.inv[d.id] ? 'Backpack' : DQ.S.bank[d.id] ? 'Bank' : 'Equipped'; const last=DQ.lootLog[0]; if(last && last.id===d.id && last.where===d.where && last.coins===d.coins && last.rar[0]===d.rar[0]) last.n+=d.n; else DQ.lootLog.unshift({...d}); }); DQ.lootLog.length = Math.min(DQ.lootLog.length, 30);
  const box = $('#lootbox'), sum = $('#lootsum'); if (sum) sum.textContent = `${DQ.lootSum.kills} defeated · ${fmt(DQ.lootSum.coins)} coins · ${DQ.lootSum.items} items this session`;
  if (!box || !drops.length) return;
  box.innerHTML = DQ.lootLog.slice(0, 8).map(lootRow).join(''); [...box.children].slice(0, drops.length).forEach(r => r.classList.add('fresh'));
  const from = $('#av-foe'); if (!from || S().settings.reduceFx || document.hidden) return;
  const a = from.getBoundingClientRect(), b = box.getBoundingClientRect(), fx = $('#fx');
  drops.slice(0, 4).forEach((d, i) => {
    const it = D.ITEMS[d.id], el = document.createElement('div'); el.className = 'flyloot'; el.style.setProperty('--c', d.rar[2]); el.innerHTML = DQ.itemIco(it);
    el.style.left = (a.left + a.width / 2) + 'px'; el.style.top = (a.top + a.height / 2) + 'px'; fx.appendChild(el);
    const dx = b.left + 30 - (a.left + a.width / 2), dy = b.top + 20 - (a.top + a.height / 2), up = -60 - Math.random() * 40, sx = (Math.random() - .5) * 80;
    el.animate([{ transform: 'translate(-50%,-50%) scale(.4)', opacity: 0 }, { transform: `translate(calc(-50% + ${sx}px),calc(-50% + ${up}px)) scale(1.3)`, opacity: 1, offset: .35 }, { transform: `translate(calc(-50% + ${dx}px),calc(-50% + ${dy}px)) scale(.7)`, opacity: .9 }], { duration: 900, delay: i * 120, easing: 'cubic-bezier(.3,.7,.4,1)', fill: 'both' }).onfinish = () => el.remove();
  });
});
DQ.tips.mon = id => {
  const m = D.MON[id], seen = S().beast.drops, k = S().beast.kills[id] || 0;
  const rows = D.RARITY.map(r => { const ds = m.drops.filter(d => D.rarityOf(d[2])[0] === r[0]); if (!ds.length) return ''; const known = ds.filter(d => seen[id + ':' + d[0]] || (DQ.knows && DQ.knows(m, 'drops'))).map(d => D.ITEMS[d[0]].name), unk = ds.length - known.length; return `<div style="color:${r[2]}">${r[1]}: ${known.join(', ')}${known.length && unk ? ', ' : ''}${unk ? `${unk} undiscovered` : ''}</div>`; }).join('');
  return `<b style="color:${m.col}">${esc(m.name)}</b><em>${k ? fmt(k) + ' defeated' : 'Not yet defeated'} · drops coins (${m.coins[0]}-${m.coins[1]})</em>${rows}<div class="dim">Research it to see every drop</div>`;
};

/* Open an item wherever it is: backpack first, then bank */
UI.showItem = id => { const inPack = !!DQ.S.inv[id]; UI.sel = id; UI.selFrom = inPack ? 'pack' : 'bank'; if (!DQ.have(id)) { DQ.go('character'); return DQ.toast('That item is equipped or already used'); } DQ.go(inPack ? 'character' : 'bank'); if (UI.view === (inPack ? 'character' : 'bank')) UI.render(false); };
UI.DO.showitem = a => UI.showItem(a);
})();
