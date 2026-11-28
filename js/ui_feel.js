/* Idlewick: the small things that make the game feel made with care (owner, 27 Nov 2026: "I love the subtle things
   that make games feel more polished ... Let's do all 15"). Presentation only: nothing here changes a rule, a price, a
   reward or a save other than the one Settings switch it adds (settings.quillCursor).
   1. Buttons that press: a control sinks a pixel and its shadow softens while held, then springs back. A drag or a
      scroll lets go of it at once. Enter and Space press too. (css/shape.css, "press")
   2. Gathered items fly to the backpack: work that yields items (logs, ore, fish, crafted output, hunting catches)
      sends a small copy of the item from the work scene to the backpack chip (the Hero portrait on phones), which gulps.
      At most one flight every 0.6 s; a burst merges into the next flight. Never in simulations or forecasts.
   3. XP flows to its skill: the "+XP" from work (and the fight's XP, after the blow lands) drifts into that skill's row
      in the rail (the Skills tab of the phone bar) and the row's bar fills as it arrives.
   4. A quill pointer: a pixel quill drawn in code (js/pixel_feel.js), a pointing hand over controls; desktop pointers
      only; Settings > Display > "Pixel pointer" turns it off. The quill is retired: the pointing hand is used everywhere.
   15. Hold to confirm big spends: a buy or sale worth 10,000 coins or more, or 1,000+ that is a quarter of your coins,
      needs a press and hold (0.6 s) that fills the button from left to right. Letting go early cancels; Enter or Space
      held does the same; a quick click explains. Small amounts stay one click.
   (Item 14, the pictures on empty pages, is UI.emptyState in ui_core.js with art in js/pixel_feel.js.)
   Motion is transform and opacity on the browser's own timeline, and none of it runs under Reduce effects
   (html.calm) or the device's reduced-motion setting. tests/ui-feel.cjs. */
(() => {
const DQ = window.DQ, D = DQ.data, UI = DQ.ui, S = () => DQ.S;
const calm = () => document.documentElement.classList.contains('calm') || !!(S() && S().settings && S().settings.reduceFx) || matchMedia('(prefers-reduced-motion: reduce)').matches;
const quiet = () => calm() || DQ.sim.on || DQ.forecasting || document.hidden;
/* nothing flies across a pop-up: the backpack and the rail sit behind it */
const covered = () => !!document.querySelector('.modal, .story-stage, .encounter-moment');
const page = v => DQ.toPage ? DQ.toPage(v) : v;
const shown = el => !!el && el.isConnected && el.getClientRects().length > 0 && (() => { const r = el.getBoundingClientRect(); return r.width > 0 && r.height > 0 && r.bottom > 0 && r.top < innerHeight && r.right > 0 && r.left < innerWidth; })();
const feel = DQ.feel = { flights: 0, flows: 0, holds: 0 }; /* counts for tests */

/* ================= 1. Buttons that press ================= */
const PRESSABLE = 'button,[data-do],[role=button],[role=tab],[role=switch],a.btn,.btn';
const NOT_PRESSED = '.site-spot,.tc-room,.hearth-spot,#av-foe,input,select,textarea,svg,img';
let pressed = null, pressAt = null;
const pressOf = t => { const el = t && t.closest && t.closest(PRESSABLE); return el && !el.disabled && el.getAttribute('aria-disabled') !== 'true' && !el.matches(NOT_PRESSED) ? el : null; };
const letGo = () => {
  const el = pressed; pressed = null; pressAt = null; if (!el) return;
  el.classList.remove('lw-press'); el.classList.add('lw-release');
  setTimeout(() => el.classList.remove('lw-release'), 340);
};
document.addEventListener('pointerdown', e => {
  if (e.button !== 0 || !e.isPrimary) return; letGo();
  const el = pressOf(e.target); if (!el) return;
  pressed = el; pressAt = [e.clientX, e.clientY]; el.classList.add('lw-press');
}, { capture: true, passive: true });
document.addEventListener('pointermove', e => { if (pressed && pressAt && Math.hypot(e.clientX - pressAt[0], e.clientY - pressAt[1]) > 6) letGo(); }, { capture: true, passive: true });
for (const ev of ['pointerup', 'pointercancel', 'dragstart', 'blur']) addEventListener(ev, letGo, { capture: true, passive: true });
document.addEventListener('scroll', letGo, { capture: true, passive: true });
document.addEventListener('keydown', e => {
  if ((e.key !== 'Enter' && e.key !== ' ') || e.repeat) return;
  const el = pressOf(document.activeElement); if (!el || el === document.body) return;
  letGo(); pressed = el; el.classList.add('lw-press');
}, true);
document.addEventListener('keyup', e => { if (e.key === 'Enter' || e.key === ' ') letGo(); }, true);

/* ================= 2. Gathered items fly to the backpack ================= */
const GAP = 600;
let got = null, lastFlight = -1e9, waiting = null, waitTimer = 0;
const recording = () => !DQ.sim.on && !DQ.forecasting && DQ.act && DQ.act.kind !== 'fight';
const grant0 = DQ.grant;
DQ.grant = (id, n = 1) => {
  const r = grant0(id, n);
  if (recording() && D.ITEMS[id] && n > 0) {
    /* gains made while one action completes: emitted as 'workcycle' in the same task, so a microtask closes the batch */
    if (!got) { got = new Map(); queueMicrotask(() => { got = null; }); }
    got.set(id, (got.get(id) || 0) + n);
  }
  return r;
};
const packTarget = () => [document.querySelector('#hud .packchip'), document.querySelector('#hud .h-hero')].find(shown) || null;
const sceneSource = ev => {
  const scene = document.querySelector('#view .activity-scene');
  if (scene && (!ev || scene.dataset.kind === ev.kind)) { const t = scene.querySelector('.scene-target'); if (shown(t)) return t; }
  const card = document.querySelector('#view .illustrated-card.active, #view .card.active'); return shown(card) ? card : null;
};
const spriteOf = id => { const A = DQ.pixelArt, u = A && A.itemUrl && A.itemUrl(id); if (u) return u;
  const t = document.createElement('template'); t.innerHTML = DQ.itemIco ? DQ.itemIco(D.ITEMS[id]) : ''; const img = t.content.querySelector('img'); return img ? img.getAttribute('src') : null; };
const gulp = target => {
  if (!target) return; const cls = target.matches('.packchip') ? 'pack-gulp' : 'pack-bounce';
  target.classList.remove(cls); void target.offsetWidth; target.classList.add(cls);
  setTimeout(() => target.classList.remove(cls), 460);
};
const launch = (id, n, ev, tier) => {
  waiting = null; clearTimeout(waitTimer);
  if (quiet() || covered()) return;
  const from = sceneSource(ev), to = packTarget(), src = spriteOf(id); if (!from || !to || !src) return;
  lastFlight = performance.now(); feel.flights++;
  const a = from.getBoundingClientRect(), b = to.getBoundingClientRect(), size = 32;
  /* a find of uncommon rarity or rarer glints as it flies (polish stage 1, js/weight.js); its timing is the stage's table */
  const fly = document.createElement('span'); fly.className = 'gain-fly' + (tier && tier.glint ? ` glint glint-${tier.band}` : ''); fly.setAttribute('aria-hidden', 'true');
  if (tier && tier.glint) fly.style.setProperty('--glint-c', tier.col);
  fly.innerHTML = `<img class="pxa" src="${src}" width="${size}" height="${size}" alt="">${n > 1 ? `<b>×${DQ.fmt ? DQ.fmt(n) : n}</b>` : ''}`;
  const x0 = page(a.left + a.width / 2 - size / 2), y0 = page(a.top + a.height / 2 - size / 2), x1 = page(b.left + b.width / 2 - size / 2), y1 = page(b.top + b.height / 2 - size / 2);
  Object.assign(fly.style, { left: x0 + 'px', top: y0 + 'px' });
  document.body.appendChild(fly);
  const dx = x1 - x0, dy = y1 - y0, lift = Math.min(-50, dy * .35 - 50);
  const anim = fly.animate([
    { translate: '0 0', scale: '.6', opacity: 0 },
    { translate: '0 -14px', scale: '1', opacity: 1, offset: .14 },
    { translate: `${dx * .45}px ${dy * .45 + lift}px`, scale: '1', opacity: 1, offset: .55 },
    { translate: `${dx}px ${dy}px`, scale: '.5', opacity: .9 }
  ], { duration: Math.round(((DQ.WEIGHT && DQ.WEIGHT.T.find.flight) || .76) * 1000), easing: 'cubic-bezier(.45,.05,.35,1)' });
  let landed = false; const land = () => { if (landed) return; landed = true; fly.remove(); if (!quiet()) gulp(packTarget()); };
  anim.onfinish = land; anim.oncancel = () => { landed = true; fly.remove(); };
  if (tier && tier.glint && DQ.weight) DQ.weight.track(anim);
};
const fly = (id, n, ev, tier) => {
  if (quiet()) return;
  const now = performance.now();
  if (now - lastFlight >= GAP && !waiting) return launch(id, n, ev, tier);
  /* a burst: the next flight carries everything gathered meanwhile (a find keeps its place at the front) */
  if (waiting && waiting.tier && !tier) return;
  if (waiting && waiting.id === id) waiting.n += n; else waiting = { id, n: (waiting && waiting.id === id ? waiting.n : 0) + n, ev, tier };
  clearTimeout(waitTimer); waitTimer = setTimeout(() => { const w = waiting; if (w) launch(w.id, w.n, w.ev, w.tier); }, Math.max(0, lastFlight + GAP - now));
};
DQ.on('workcycle', ev => {
  const g = got; got = null; if (!g || !g.size || quiet()) return;
  /* the action's own output leads; otherwise the largest gain */
  const node = D.NODE && D.NODE[ev.kind + ':' + ev.id], recipe = ev.kind === 'recipe' && D.RECIPES[ev.id], main = node && node.item || recipe && Object.keys(recipe.out)[0];
  let id = main && g.has(main) ? main : [...g].sort((a, b) => b[1] - a[1])[0][0];
  /* a rare find made in this action flies instead, glinting by its rarity band (js/weight.js decided it already) */
  const find = DQ.weight && DQ.weight.lastWorkFind(ev); if (find && g.has(find.id)) { id = find.id; return fly(id, g.get(id), ev, find.tier); }
  fly(id, g.get(id), ev);
});
DQ.flyToPack = (id, n = 1) => fly(id, n, null); /* for tests and future callers */

/* ================= 3. XP flows to its skill ================= */
const held = new Map();
const railRow = sk => {
  const s = D.SK[sk]; if (!s) return null;
  const rows = [document.querySelector(`#combatnav .cg-tile[data-tip="rail:${sk}"]`), document.querySelector(`#skilldock .dk[data-tip="rail:${sk}"]`), document.querySelector(`#skilldock .dk[data-a="${s.page}"]`)];
  if (sk === 'hitpoints' || sk === 'defence') rows.push(document.querySelector('#combatnav .combat-entry'));
  rows.push(document.querySelector('#rail .hub[data-a="skills"]')); /* phones: the bottom bar's Skills tab */
  return rows.find(shown) || null;
};
const xpbar0 = UI.B.xpbar;
UI.B.xpbar = (e, sk, ...rest) => { if ((held.get(sk) || 0) > 0 && e.closest('#skilldock,#combatnav')) return; return xpbar0(e, sk, ...rest); };
const release = sk => {
  const n = (held.get(sk) || 1) - 1; if (n > 0) held.set(sk, n); else held.delete(sk);
  if (!held.get(sk)) document.querySelectorAll(`#skilldock [data-b="xpbar:${sk}"],#combatnav [data-b="xpbar:${sk}"]`).forEach(e => xpbar0(e, sk));
};
const arrive = row => { if (!row) return; row.classList.remove('xp-arrive'); void row.offsetWidth; row.classList.add('xp-arrive'); setTimeout(() => row.classList.remove('xp-arrive'), 620); };
DQ.flowXp = (sk, amount, fromEl) => {
  if (quiet() || covered() || !(amount > 0)) return false;
  sk = DQ.skId ? DQ.skId(sk) : sk; const s = D.SK[sk]; if (!s) return false;
  const from = fromEl && shown(fromEl) ? fromEl : sceneSource(null), to = railRow(sk);
  if (!from || !to) return false;
  const fx = document.getElementById('fx'); if (!fx) return false;
  held.set(sk, (held.get(sk) || 0) + 1); feel.flows++;
  let done = false; const finish = () => { if (done) return; done = true; release(sk); };
  const go = () => {
    if (!from.isConnected && !shown(to)) return finish();
    const a = from.getBoundingClientRect(), dest = railRow(sk) || to, b = dest.getBoundingClientRect();
    const f = document.createElement('div'); f.className = 'fl xp-flow'; f.style.setProperty('--c', s.col);
    f.innerHTML = `${DQ.ico(sk)}+${DQ.fmt(amount)} XP`; f.setAttribute('aria-hidden', 'true');
    const fighter = fromEl && (fromEl.id === 'av-foe' || fromEl.closest?.('.side'));
    const x0 = page(a.left + a.width / 2), y0 = page(fighter ? a.top - 30 : a.top + Math.min(a.height / 2, 36));
    Object.assign(f.style, { left: x0 + 'px', top: y0 + 'px' }); fx.appendChild(f);
    const x1 = page(b.left + b.width / 2), y1 = page(b.top + b.height / 2), dx = x1 - x0, dy = y1 - y0;
    const anim = f.animate([
      { translate: '-50% 0', scale: '.7', opacity: 0 },
      { translate: '-50% -16px', scale: '1.08', opacity: 1, offset: .16 },
      { translate: '-50% -18px', scale: '1', opacity: 1, offset: .34 },
      { translate: `calc(-50% + ${dx * .9}px) ${dy * .9}px`, scale: '.7', opacity: .95, offset: .86 },
      { translate: `calc(-50% + ${dx}px) ${dy}px`, scale: '.55', opacity: 0 }
    ], { duration: 1150, easing: 'ease-in-out' });
    const end = ok => { f.remove(); finish(); if (ok && !quiet()) arrive(railRow(sk)); };
    anim.onfinish = () => end(true); anim.oncancel = () => end(false);
    setTimeout(() => { if (f.isConnected) end(true); }, 2400); /* a backstop: the bar is never held for long */
  };
  UI.afterImpact ? UI.afterImpact(go, 0) : go();
  setTimeout(finish, 4000);
  return true;
};

/* ================= 4. The quill pointer ================= */
const finePointer = () => matchMedia('(hover: hover) and (pointer: fine)').matches;
const cursorWanted = () => !!(S() && S().settings && S().settings.quillCursor !== false) && finePointer();
let cursorSheetDone = false;
/* rule-level pointers in the game's own sheets read the hand variable, so every clickable thing shows the same hand */
const adoptSheets = () => {
  if (cursorSheetDone) return; cursorSheetDone = true;
  const walk = rules => { for (const r of rules) {
    if (r.style && r.style.cursor === 'pointer') r.style.setProperty('cursor', 'var(--cur-hand, pointer)', r.style.getPropertyPriority('cursor'));
    else if (r.style && r.style.cursor === 'default') r.style.setProperty('cursor', 'var(--cur-quill, default)', r.style.getPropertyPriority('cursor'));
    if (r.cssRules) walk(r.cssRules);
  } };
  for (const sheet of document.styleSheets) { try { walk(sheet.cssRules); } catch (e) { /* a sheet from another origin (web fonts) */ } }
};
const cursorValue = (kind, fallback) => {
  const one = DQ.cursorArt && DQ.cursorArt(kind, 2), two = DQ.cursorArt && DQ.cursorArt(kind, 4), [hx, hy] = (DQ.CURSOR_HOT || {})[kind] || [0, 0];
  if (!one) return null;
  const set = `image-set(url("${one}") 1x, url("${two}") 2x) ${hx * 2} ${hy * 2}, ${fallback}`;
  return CSS.supports('cursor', set) ? set : `url("${one}") ${hx * 2} ${hy * 2}, ${fallback}`;
};
let cursorOn = null;
UI.applyCursor = () => {
  const root = document.documentElement, on = cursorWanted(); cursorOn = on;
  if (on) {
    adoptSheets();
    /* the pointing hand everywhere (owner, 28 Nov 2026: "Not keen on the quill though, make it always the pointing
       hand"); the page keeps the browser's arrow as its fallback, controls the browser's hand */
    const q = cursorValue('hand', 'auto'), h = cursorValue('hand', 'pointer');
    if (q && h) { root.style.setProperty('--cur-quill', q); root.style.setProperty('--cur-hand', h); root.classList.add('lw-cursor'); return; }
  }
  root.classList.remove('lw-cursor'); root.style.removeProperty('--cur-quill'); root.style.removeProperty('--cur-hand');
};
UI.DO.quillcursor = () => { const st = S().settings; st.quillCursor = st.quillCursor === false; UI.applyCursor(); DQ.save && DQ.save(); UI.render(false); };
const settings0 = UI.V.settings;
UI.V.settings = (...a) => {
  const h = settings0(...a); if (UI.tab.settingsPanel !== 'display') return h;
  const on = S().settings.quillCursor !== false;
  const tog = `<button class="tog ${on ? 'on' : ''}" data-do="quillcursor" aria-pressed="${on}"><span class="sw"></span><span><b>Pixel pointer</b><small>${finePointer() ? 'A pixel pointing hand for the mouse pointer' : 'For a mouse or trackpad; touch screens keep their own'}</small></span></button>`;
  /* into the Notifications & accessibility card, beside Reduce effects */
  const i = h.indexOf('<h2>Notifications &amp; accessibility</h2>') >= 0 ? h.indexOf('<h2>Notifications &amp; accessibility</h2>') : h.indexOf('<h2>Notifications & accessibility</h2>');
  if (i < 0) return h;
  const j = h.indexOf('<div class="stack">', i); if (j < 0) return h;
  const k = j + '<div class="stack">'.length; return h.slice(0, k) + tog + h.slice(k);
};
matchMedia('(hover: hover) and (pointer: fine)').addEventListener?.('change', () => UI.applyCursor());

/* ================= 15. Hold to confirm big spends ================= */
const HOLD_MS = 600, SPENDS = new Set(['buy', 'sell', 'buyupgrade', 'localbuy', 'rarebuy', 'buycommission', 'buyplot', 'buypen', 'buyhouse', 'buildroom']);
const SPEND_SEL = [...SPENDS].map(k => `button[data-do="${k}"]`).join(',');
DQ.HOLD_MS = HOLD_MS;
/* a spend is big at 10,000 coins, or at 1,000 when that is a quarter of what you hold */
DQ.bigSpend = coins => coins >= 10000 || (coins >= 1000 && coins >= .25 * (S().coins || 0));
const valueOf = el => { let v = 0; el.querySelectorAll('.money[data-coins]').forEach(m => { v = Math.max(v, +m.dataset.coins || 0); }); return v; };
const HINT = 'Big spend: press and hold to confirm. Letting go early cancels.';
const hint = () => { if (document.getElementById('lw-hold-hint')) return; const h = document.createElement('span'); h.id = 'lw-hold-hint'; h.className = 'lw-sr'; h.textContent = HINT; document.body.appendChild(h); };
const mark = () => {
  const list = document.querySelectorAll(SPEND_SEL); let any = false;
  for (const el of list) {
    const big = !el.disabled && DQ.bigSpend(valueOf(el));
    if (big === (el.dataset.hold === '1')) { any ||= big; continue; }
    if (big) { el.dataset.hold = '1'; el.classList.add('hold-confirm'); const d = (el.getAttribute('aria-describedby') || '').split(' ').filter(Boolean); if (!d.includes('lw-hold-hint')) el.setAttribute('aria-describedby', [...d, 'lw-hold-hint'].join(' ')); const t = el.dataset.tip; if (t && t.startsWith('text:') && !t.includes('hold to confirm')) el.dataset.tip = t + ' · hold to confirm'; any = true; }
    else { delete el.dataset.hold; el.classList.remove('hold-confirm', 'holding'); const d = (el.getAttribute('aria-describedby') || '').split(' ').filter(x => x && x !== 'lw-hold-hint'); if (d.length) el.setAttribute('aria-describedby', d.join(' ')); else el.removeAttribute('aria-describedby'); if (el.dataset.tip) el.dataset.tip = el.dataset.tip.replace(' · hold to confirm', ''); }
  }
  if (any) hint();
};
UI.markHolds = mark;
let hold = null, confirming = false, swallowUntil = 0, lastHint = 0;
const startHold = (el, via) => {
  cancelHold(); feel.holds++;
  el.classList.remove('holding'); void el.offsetWidth; el.classList.add('holding');
  hold = { el, via, done: false, timer: setTimeout(() => completeHold(), HOLD_MS) };
};
const cancelHold = () => { if (!hold) return; clearTimeout(hold.timer); if (!hold.done) hold.el.classList.remove('holding'); hold = null; };
const completeHold = () => {
  const h = hold; if (!h || h.done) return; h.done = true;
  const el = h.el; el.classList.remove('holding'); el.classList.add('hold-done'); setTimeout(() => el.classList.remove('hold-done'), 400);
  if (!el.isConnected || el.disabled) return;
  confirming = true; swallowUntil = Infinity;
  try { el.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, view: window })); } finally { confirming = false; }
};
const tellHold = () => { const now = performance.now(); if (now - lastHint > 1200) { lastHint = now; DQ.toast && DQ.toast('Big spend: press and hold to confirm'); } };
document.addEventListener('pointerdown', e => {
  const el = e.button === 0 && e.target.closest && e.target.closest('[data-hold="1"]');
  if (!el || el.disabled) return; startHold(el, 'pointer');
}, true);
const endPointer = () => { if (!hold || hold.via !== 'pointer') return; const done = hold.done; cancelHold(); swallowUntil = performance.now() + 80; if (!done) tellHold(); };
document.addEventListener('pointerup', endPointer, true);
document.addEventListener('pointercancel', () => { if (hold && hold.via === 'pointer') { cancelHold(); swallowUntil = performance.now() + 80; } }, true);
document.addEventListener('pointerout', e => { if (hold && hold.via === 'pointer' && !hold.done && hold.el.contains(e.target) && !hold.el.contains(e.relatedTarget)) cancelHold(); }, true);
document.addEventListener('keydown', e => {
  if (e.key !== 'Enter' && e.key !== ' ') return;
  const el = document.activeElement && document.activeElement.closest && document.activeElement.closest('[data-hold="1"]'); if (!el) return;
  e.preventDefault(); if (!e.repeat && !hold) startHold(el, 'key');
}, true);
document.addEventListener('keyup', e => {
  if ((e.key !== 'Enter' && e.key !== ' ') || !hold || hold.via !== 'key') return;
  e.preventDefault(); const done = hold.done; cancelHold(); if (!done) tellHold();
}, true);
/* the button's own click only counts when the hold finished; anything else explains instead of spending */
document.addEventListener('click', e => {
  if (confirming) return;
  if (performance.now() < swallowUntil) { swallowUntil = 0; const t = e.target.closest && e.target.closest('[data-do]'); if (t) { e.preventDefault(); e.stopImmediatePropagation(); } return; }
  const el = e.target.closest && e.target.closest('[data-hold="1"]'); if (!el) return;
  e.preventDefault(); e.stopImmediatePropagation(); if (!hold) tellHold();
}, true);

/* keep the marks (and the pointer) current as pages draw and coins change */
const render0 = UI.render;
UI.render = (...a) => { const r = render0(...a); try { mark(); if (cursorOn !== cursorWanted()) UI.applyCursor(); } catch (e) { console.error(e); } return r; };
const modal0 = DQ.modal;
if (modal0) DQ.modal = (...a) => { const r = modal0(...a); try { mark(); } catch (e) { console.error(e); } return r; };
DQ.on('ui', () => { try { mark(); } catch (e) { /* a page mid-redraw */ } });
DQ.on('shop', () => setTimeout(mark, 0));
})();
