/* The Beastmastery ranch (Nov 2026). Your beasts live in pens. Pick a food from the shelf and feed a beast: that is
   the training session (the same cost, cooldown and bond XP as before), shown as the food flying to the bowl, the
   beast hopping the hurdle and the bond XP rising. A trained beast naps until its real cooldown ends. The companion
   with you flies a flag. Capturing moves to the Trapper's shed and wooden-trap fieldwork keeps its own page, so the
   ranch is only about owning and caring for your beasts. */
(() => {
const Q = window.DQ, D = Q.data, UI = Q.ui, S = () => Q.S, A = Q.pixelArt, { esc, ico, fmt } = Q;
if (!D.BEAST_SPECIES || !A || !A.penBackUrl) return;
const MAX = 10, page0 = UI.V.beastmastery;
const phone = () => innerWidth <= 860, tight = () => /\b(short|lw-1600)\b/.test(document.documentElement.className) && !phone();
const K = () => phone() ? 2 : (innerHeight / (Q.zoom || 1) >= 900 ? 3 : 2), PER = () => phone() ? 1 : 6; /* whole-number pen scale: 3x when the window is tall enough for two rows, else 2x */
UI.beastPenPage = 0; UI.beastFood = null;
const view = () => UI.beastMode === 'field' ? 'field' : (UI.beastMode === 'capture' || UI.beastMode === 'shed') ? 'shed' : 'ranch';
const owned = () => D.PETS.filter(p => S().pets.owned[p.id]);
const foodsHeld = () => (Q.foods ? Q.foods() : []).filter(id => Q.have(id) > 0 && D.ITEMS[id] && D.ITEMS[id].heal > 0);
const chosenFood = () => { const f = foodsHeld(); if (UI.beastFood && f.includes(UI.beastFood) && Q.have(UI.beastFood) >= 2) return UI.beastFood; return f.find(id => Q.have(id) >= 2) || f[0] || null; };
const tabs = v => `<div class="beast-tabs btnrow ranch-tabs" role="tablist">${[['ranch', 'Ranch · beasts and eggs'], ['shed', 'Trapper · send for an egg'], ['field', 'Wooden traps · search a region']].map(([k, l]) => `<button class="btn ${v === k ? 'on' : ''}" role="tab" aria-selected="${v === k}" data-do="beastmode" data-a="${k}">${l}</button>`).join('')}</div>`;
const stateOf = id => { const t = Q.beastTraining(id, chosenFood()), o = S().pets.owned[id];
  if (Q.petLevel(id) >= MAX) return { k: 'max', text: 'Fully bonded', t };
  if (t.left > 0) return { k: 'nap', until: o.trainingUntil, t };
  return t.ok ? { k: 'ready', text: 'Hungry for training', t } : { k: 'wait', text: t.reason, t }; };
const penHtml = (p, k, sel) => {
  const id = p.id, st = stateOf(id), lv = Q.petLevel(id), o = S().pets.owned[id], active = S().pets.active === id, food = chosenFood();
  const note = st.k === 'nap' ? `Napping · ready in <span data-beast-due="${st.until}">${Q.fmtTime(Math.max(0, st.until - Date.now()))}</span>` : esc(st.text);
  const base = D.BOND_XP[lv - 1], next = D.BOND_XP[lv] || base, pct = lv >= MAX ? 100 : Math.max(0, Math.min(100, 100 * (o.bondXp - base) / (next - base)));
  return `<div class="pen-cell"><button class="pen ps-${st.k} ${sel ? 'sel' : ''} ${active ? 'active' : ''}" data-id="${id}" data-do="beastselect" data-a="${id}" aria-pressed="${sel}" aria-label="${esc(p.name)}, bond ${lv}. ${active ? 'Companion. ' : ''}${esc(st.k === 'nap' ? 'Napping' : st.text)}" style="--k:${k};width:${96 * k}px;height:${64 * k}px">
      <img class="pen-back" src="${A.penBackUrl(id, p.col)}" width="${96 * k}" height="${64 * k}" alt="" draggable="false">
      <span class="pen-beast">${Q.petSprite(p, 32 * k)}</span>
      <img class="pen-front" src="${A.penFrontUrl()}" width="${96 * k}" height="${64 * k}" alt="" draggable="false">
      ${active ? `<span class="pen-flag">★ Companion</span>` : ''}
      ${st.k === 'ready' && food ? `<span class="pen-bowl" aria-hidden="true">${Q.itemIco(D.ITEMS[food])}</span>` : ''}
      ${st.k === 'nap' ? `<span class="pen-zz" aria-hidden="true">Zz</span>` : ''}
      ${st.k === 'ready' ? `<span class="pen-want" aria-hidden="true">♥</span>` : ''}
      <span class="pen-bond"><b>Bond ${lv}</b><span class="bar"><i style="width:${pct}%"></i></span></span></button>
    <div class="pen-name"><b>${esc(o.evolved && Q.beastSpec(id) ? Q.beastSpec(id).evolution : p.name)}</b><small class="ps-${st.k}">${note}</small></div></div>`; };
const emptyPen = k => `<div class="pen-cell"><button class="pen empty" data-do="beastmode" data-a="shed" style="--k:${k};width:${96 * k}px;height:${64 * k}px" aria-label="Empty pen. Hatch an egg to fill it."><img class="pen-back" src="${A.penBackUrl('empty', '#9a9a9a')}" width="${96 * k}" height="${64 * k}" alt="" draggable="false"><img class="pen-front" src="${A.penFrontUrl()}" width="${96 * k}" height="${64 * k}" alt="" draggable="false"><span class="pen-sign">Empty pen<small>Hatch an egg to fill it</small></span></button></div>`;
const shelf = () => { const f = foodsHeld(), cur = chosenFood();
  const tiles = f.length ? f.map(id => { const it = D.ITEMS[id]; return `<button class="shelf-food ${id === cur ? 'on' : ''}" data-do="beastfood" data-a="${id}" aria-pressed="${id === cur}" data-tip="item:${id}">${Q.itemIco(it)}<span><b>${esc(it.name)}</b><small>×${fmt(Q.have(id))} · +${it.heal}</small></span></button>`; }).join('')
    : `<span class="shelf-none">The shelf is bare. Cook fish in Cooking, or buy bread at the shop: each session uses 2 cooked food.</span>`;
  return `<div class="ranch-shelf"><span class="shelf-label">Food shelf</span><div class="shelf-items">${tiles}</div></div>`; };
const sheet = id => { const p = D.PET[id], o = S().pets.owned[id], lv = Q.petLevel(id), st = stateOf(id), t = st.t, job = Q.beastJob && Q.beastJob(id), active = S().pets.active === id, food = chosenFood();
  const next = D.BOND_XP[lv] || D.BOND_XP[MAX - 1], base = D.BOND_XP[lv - 1], pct = lv >= MAX ? 100 : Math.min(100, 100 * (o.bondXp - base) / (next - base));
  const foodName = food ? D.ITEMS[food].name.toLowerCase() : 'cooked food';
  return `<section class="panel ranch-sheet"><div class="rs-head"><span class="rs-art">${Q.petSprite(p, 96)}</span><div><span class="k">${active ? 'Companion' : 'In its pen'}${job ? ' · ' + esc(job.role) : ''} · Bond ${lv}/${MAX}</span><h2>${esc(o.evolved && Q.beastSpec(id) ? Q.beastSpec(id).evolution : p.name)}</h2></div></div>
    ${UI.beastJourney ? UI.beastJourney(id) : ''}
    <p class="rs-passive">${esc(Q.beastPassiveText(id))}</p>
    <div class="bar" role="progressbar" aria-label="Bond progress" aria-valuenow="${Math.round(pct)}" aria-valuemin="0" aria-valuemax="100"><i style="width:${pct}%"></i></div>
    <small class="rs-xp">${lv >= MAX ? 'Bond complete' : `${fmt(o.bondXp)} / ${fmt(next)} bond XP`}</small>
    <div class="beast-milestones">${D.BOND_MILESTONES.map(n => `<span class="tag ${lv >= n ? 'ok' : ''}" data-tip="text:Bond ${n}: ${n === 10 ? 'evolves · final upgrade' : 'passive upgrade'}">${lv >= n ? '✓' : '◇'} ${n}</span>`).join('')}</div>
    <p class="sm dim rs-cost">${lv >= MAX ? 'This bond is complete.' : `${t.coins} coins + 2 ${esc(foodName)} → +${t.xp} bond XP · 45 min nap`}</p>
    <div class="btnrow wrap"><button class="btn primary" data-do="beastfeed" data-a="${id}" ${t.ok ? '' : 'disabled'}>${t.ok ? `Feed & train · +${t.xp} bond XP` : esc(t.reason)}</button>${active ? `<span class="rs-with">★ Companion</span>` : `<button class="btn" data-do="setpet" data-a="${id}">Make companion</button>`}</div></section>`; };
const shedTeaser = () => { const j = S().pets.expedition; return `<section class="panel ranch-shedcard"><span class="k">Trapper</span><p>${j ? `<b>Trap out:</b> ${esc(D.PET[j.species].name)} · <span data-beast-due="${j.due}">${Q.fmtTime(Math.max(0, j.due - Date.now()))}</span> left` : 'No trap is out. Send one and it brings back an egg.'}</p><button class="btn" data-do="beastmode" data-a="shed">Open the shed</button><button class="linkish ranch-eggs-link" data-do="eggways">Where do eggs come from?</button></section>`; };
const ranch = () => {
  const list = owned(), k = K(), per = PER(), pages = Math.max(1, Math.ceil(list.length / per)); UI.beastPenPage = Math.min(UI.beastPenPage, pages - 1);
  const sel = list.find(p => p.id === UI.beastSelected) || list.find(p => p.id === S().pets.active) || list[0];
  const slice = list.slice(UI.beastPenPage * per, UI.beastPenPage * per + per);
  const cells = slice.map(p => penHtml(p, k, sel && p.id === sel.id)).join('') + (phone() ? '' : Array.from({ length: Math.max(0, per - slice.length) }, () => emptyPen(k)).join(''));
  const nav = pages > 1 ? `<div class="pen-pages" role="group" aria-label="Pens">${Array.from({ length: pages }, (_, i) => `<button class="btn sm ${i === UI.beastPenPage ? 'on' : ''}" data-do="beastpenpage" data-a="${i}">${phone() ? (i + 1) + ' of ' + pages : i + 1}</button>`).join('')}</div>` : '';
  const board = `<section class="ranch-board" style="--k:${k}"><div class="ranch-strip" style="background-image:url(${A.ranchStripUrl()});--k:${k}" role="img" aria-label="Your ranch"><h2 class="ranch-sign">Your ranch</h2></div>
    ${list.length ? `<div class="pen-grid">${cells}</div>${nav}` : `<div class="ranch-empty"><p><b>The pens are empty.</b> Every beast starts as an egg. Send a trap from the shed to bring home your first.</p><button class="btn primary" data-do="beastmode" data-a="shed">Open the Trapper's shed</button></div>`}${list.length ? shelf() : ''}</section>`;
  return `<div class="ranch-layout"><div class="ranch-main">${board}</div><div class="ranch-side">${sel ? sheet(sel.id) : ''}${shedTeaser()}</div></div>`; };
UI.V.beastmastery = () => {
  if (!Q.skillUnlocked('beastmastery')) return page0();
  const v = view(); let h;
  if (v === 'ranch') h = ranch();
  else { const keep = UI.beastMode; UI.beastMode = v === 'shed' ? 'beasts' : 'field'; try { h = page0(); } finally { UI.beastMode = keep; } h = `<div class="beast-subpage mode-${v}">${h.replace(/<div class="beast-tabs[^>]*>[\s\S]*?<\/div>/, '')}</div>`; }
  return tabs(v) + h; };
UI.DO.beastfood = id => { UI.beastFood = id; UI.render(false); };
UI.DO.beastpenpage = i => { UI.beastPenPage = Math.max(0, +i || 0); UI.render(false); };
const mode0 = UI.DO.beastmode; UI.DO.beastmode = a => { UI.beastMode = a === 'ranch' ? 'beasts' : a; if (mode0 && !['ranch', 'shed', 'field'].includes(a)) return mode0(a); UI.render(false); };
const sel0 = UI.DO.beastselect; UI.DO.beastselect = a => { UI.beastSelected = a; const i = owned().findIndex(p => p.id === a); if (i >= 0) UI.beastPenPage = Math.floor(i / PER()); UI.beastMode = view() === 'ranch' ? UI.beastMode : 'beasts'; UI.render(false); };
/* feeding: the food flies from the shelf to the bowl, the beast hops the hurdle, hearts and the bond XP rise */
const calm = () => !!(S().settings.reduceFx || document.documentElement.classList.contains('calm') || (window.matchMedia && matchMedia('(prefers-reduced-motion:reduce)').matches));
const page = v => v / (Q.zoom || 1);
const float = (x, y, text, cls = '') => { const e = document.createElement('div'); e.className = 'ranch-float ' + cls; e.textContent = text; e.style.cssText = `position:fixed;left:${page(x)}px;top:${page(y)}px;z-index:430;pointer-events:none`; document.body.appendChild(e); const a = e.animate([{ transform: 'translate(-50%,0)', opacity: 0 }, { transform: 'translate(-50%,-14px)', opacity: 1, offset: .2 }, { transform: 'translate(-50%,-64px)', opacity: 0 }], { duration: 1600, easing: 'ease-out' }); a.onfinish = () => e.remove(); };
UI.DO.beastfeed = id => {
  const food = chosenFood(), t = Q.beastTraining(id, food); if (!t.ok) { Q.toast && Q.toast(t.reason, true); return; }
  const chip = document.querySelector(`.shelf-food[data-a="${t.food}"]`), c = chip && chip.getBoundingClientRect(), lvBefore = Q.petLevel(id), icon = chip && chip.querySelector('.item-art');
  const ok = Q.trainBeast(id, food); UI.beastStatus = ok ? 'Training complete' : t.reason; UI.render(false);
  if (!ok || calm()) return;
  requestAnimationFrame(() => {
    const pen = document.querySelector(`.pen[data-id="${id}"]`); if (!pen) return; const r = pen.getBoundingClientRect(), tx = r.left + r.width / 2, ty = r.top + r.height * .78;
    if (c && icon) { const g = icon.cloneNode(true); g.removeAttribute('data-snapped'); g.style.cssText = `position:fixed;left:${page(c.left + 8)}px;top:${page(c.top)}px;width:32px;height:32px;z-index:430;pointer-events:none`; document.body.appendChild(g);
      const a = g.animate([{ transform: 'translate(0,0) scale(1)', opacity: 1 }, { transform: `translate(${page(tx - c.left) * .5}px,${page(ty - c.top) * .5 - 50}px) scale(1.25)`, opacity: 1, offset: .5 }, { transform: `translate(${page(tx - c.left - 8)}px,${page(ty - c.top)}px) scale(.5)`, opacity: .2 }], { duration: 700, easing: 'cubic-bezier(.4,.1,.3,1)', fill: 'forwards' }); a.onfinish = () => g.remove(); }
    pen.classList.add('training'); setTimeout(() => pen.classList.remove('training'), 2200);
    setTimeout(() => { float(tx, r.top + r.height * .45, `+${t.xp} bond XP`, 'xp'); for (let i = 0; i < 4; i++) setTimeout(() => float(tx + (i - 1.5) * 26, r.top + r.height * .5, '♥', 'heart'), i * 140); if (Q.petLevel(id) > lvBefore) setTimeout(() => float(tx, r.top + r.height * .25, `Bond ${Q.petLevel(id)}!`, 'up'), 500); }, 650);
  });
};
addEventListener('resize', () => { if (UI.view === 'beastmastery') UI.render(false); });
/* a nap ends: refresh the pens once, quietly */
let n = 0; Q.on('ui', () => { if (UI.view !== 'beastmastery' || ++n % 4 || view() !== 'ranch') return; const due = [...document.querySelectorAll('.pen.ps-nap [data-beast-due]')]; const now = Date.now(); if (due.some(e => +e.dataset.beastDue <= now)) UI.render(false); });
})();
