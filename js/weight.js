/* Idlewick: weighted moments (polish stage 1, owner 28 Nov 2026: "Every action answered", weight scales with
   significance; docs/polish-pass.md). js/weight_rules.js holds the timings table (seconds) and the decisions as pure
   functions; this file only draws and plays what they decide, after the game has already changed.
   - Levels: an ordinary skill or Hero level keeps today's answer (the rail row's glow) and adds a small chime pitched by
     how many milestones are behind you. A milestone (10, 25, 50, 75, 90, 99) also gets a short title moment at the top
     of the page ("Woodcutting 50" with the skill's emblem) and a deeper chord; 99 is the grandest. It needs no click,
     lets every click through, and waits behind a pop-up or a fight on the combat stage. Several level-ups at once are one
     moment, for the biggest.
   - Finds (D.RARITY bands of their own chance): common keeps today's flight; uncommon and up glint on the flying item and
     chime longer; rare and up light the work scene or the fight stage where they were found; the rarest get a title
     the first time the hero ever finds that item (the save's acquisition history, S.seen.items).
   - Sales: one answer per gesture (Sell all junk included), coins dropping into the purse and a clunk that deepens with
     the sum, in a few bands; the purse keeps its number roll (js/finish.js).
   - Blows: crits and killing blows stagger the creature further (js/personality.js reads hitOf), land with a heavier
     sound and hold the stage sprites still for a hit-stop under 80 ms; a boss's first defeat keeps its story.
   Nothing here plays in a simulation, a forecast, time away (Welcome Back reports it) or a hidden window. Under Reduce
   effects and reduced motion nothing moves: a title shows still, sounds still play. A click or a key finishes every
   effect at once. It never draws from Math.random (the game's rolls) or touches the save. tests/polish-weight.cjs. */
(() => {
const DQ = window.DQ, D = DQ.data, UI = DQ.ui, S = () => DQ.S, W = DQ.WEIGHT;
if (!W) return;
const T = W.T; DQ.weight = DQ.weight || {};
const calm = () => document.documentElement.classList.contains('calm') || !!(S() && S().settings && S().settings.reduceFx) || matchMedia('(prefers-reduced-motion: reduce)').matches;
const popup = () => !!document.querySelector('.modal, .story-stage, .encounter-moment, #intro:not([hidden])');
const fight = () => UI.view === 'combat' && !!DQ.act && DQ.act.kind === 'fight';
const gate = title => W.gate({ sim: !!(DQ.sim && DQ.sim.on), forecasting: !!DQ.forecasting, hidden: document.hidden, calm: calm(), popup: popup(), fight: fight(), title });
const page = v => DQ.toPage ? DQ.toPage(v) : v;
const zoom = () => DQ.zoom || 1;
const shown = el => !!el && el.isConnected && el.getClientRects().length > 0 && (r => r.width > 0 && r.height > 0 && r.bottom > 0 && r.top < innerHeight && r.right > 0 && r.left < innerWidth)(el.getBoundingClientRect());
const ms = s => Math.round(s * 1000);

const stats = { titles: 0, chimes: 0, finds: 0, lights: 0, sales: 0, coins: 0, stops: 0, hits: 0, queued: 0, hurried: 0, sounds: {} };
const log = [];
const note = (type, o) => { log.push({ type, at: performance.now(), ...o }); if (log.length > 40) log.shift(); };
const play = (name, delay = 0) => { if (!name || !DQ.sfx) return; stats.sounds[name] = (stats.sounds[name] || 0) + 1;
  if (delay > 0) setTimeout(() => { if (!document.hidden) DQ.sfx(name); }, ms(delay)); else DQ.sfx(name); };

/* ---------- running effects: a click or a key finishes them all ---------- */
const live = new Set();
const track = anim => { if (!anim) return anim; const e = { finish: () => { try { anim.finish(); } catch (x) { try { anim.cancel(); } catch (y) {} } } }; live.add(e);
  const off = () => live.delete(e); anim.addEventListener('finish', off); anim.addEventListener('cancel', off); return anim; };
const hurry = () => { if (!live.size) return; stats.hurried++; for (const e of [...live]) { try { e.finish(); } catch (x) {} } };
document.addEventListener('pointerdown', hurry, { capture: true, passive: true });
document.addEventListener('keydown', e => { if (!e.repeat) hurry(); }, { capture: true, passive: true });

/* ---------- pictures drawn once in code: the glint star and the find light (pixel steps, no smooth gradient) ---------- */
const sprites = {};
const canvas = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };
const rgb = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
const glintUrl = col => sprites['g' + col] || (sprites['g' + col] = (() => {
  /* a four-point pixel star, 7 x 7: a white heart, arms in the band's colour lit towards the top-left */
  const c = canvas(7, 7), x = c.getContext('2d'), [r, g, b] = rgb(col), lite = `rgb(${Math.min(255, r + 70)},${Math.min(255, g + 70)},${Math.min(255, b + 70)})`;
  const px = (X, Y, f) => { x.fillStyle = f; x.fillRect(X, Y, 1, 1); };
  for (const [X, Y] of [[3, 0], [0, 3], [6, 3], [3, 6]]) px(X, Y, col);
  for (const [X, Y] of [[3, 1], [1, 3], [5, 3], [3, 5]]) px(X, Y, lite);
  for (const [X, Y] of [[2, 3], [4, 3], [3, 2], [3, 4]]) px(X, Y, '#fff7dc'); px(3, 3, '#ffffff');
  return c.toDataURL(); })());
const glowUrl = col => sprites['l' + col] || (sprites['l' + col] = (() => {
  /* a light on the ground and in the air where the find was made: a 48 x 32 ellipse in four stepped rings, brightest at
     its heart, with four sparkle pixels; shown at the scene's own whole-number scale */
  const c = canvas(48, 32), x = c.getContext('2d'), [r, g, b] = rgb(col);
  [[24, 16, .22], [19, 13, .36], [14, 9, .52], [8, 5, .72]].forEach(([rx, ry, a]) => { x.fillStyle = `rgba(${Math.min(255, r + 60)},${Math.min(255, g + 60)},${Math.min(255, b + 60)},${a})`;
    for (let j = -ry; j < ry; j++) { const w = Math.round(rx * Math.sqrt(Math.max(0, 1 - ((j + .5) * (j + .5)) / (ry * ry)))); if (w > 0) x.fillRect(24 - w, 16 + j, w * 2, 1); } });
  x.fillStyle = '#fff4d0'; for (const [X, Y] of [[24, 15], [23, 16], [10, 9], [37, 21], [31, 6]]) x.fillRect(X, Y, 1, 1);
  return c.toDataURL(); })());
const glintVars = () => { const B = D.RARITY || []; const root = document.documentElement.style;
  B.forEach((r, i) => { if (i) root.setProperty('--lw-glint-' + i, `url("${glintUrl(r[2])}")`); });
  root.setProperty('--lw-glint-s', ms(T.find.glint) + 'ms'); };
try { glintVars(); } catch (e) { /* headless start-up without a canvas: the flight simply has no star */ }

/* ---------- the title moment ---------- */
let showing = null, queue = [];
const titleHtml = m => {
  if (m.type === 'find') { const it = D.ITEMS[m.id], A = DQ.pixelArt || {}, u = A.itemUrl && A.itemUrl(m.id), lg = (u && A.logicalOf && A.logicalOf(u)) || [16, 16];
    /* the item's own sprite at 4x its drawn size (whole-number scale, as js/pixel_runtime.js keeps it) */
    return `<span class="lwm-art">${u ? `<img class="pxa" src="${u}" alt="" width="${lg[0] * 4}" height="${lg[1] * 4}">` : DQ.itemIco(it)}</span><span class="lwm-txt"><small>${DQ.esc(m.label)} find</small><b>${DQ.esc(it.name)}</b></span>`; }
  const hero = m.who === 'hero', name = hero ? 'Hero level' : (D.SK[m.id] || {}).name || 'Level';
  const art = hero ? (DQ.heroFigureUrl ? `<img class="pxa" src="${DQ.heroFigureUrl(S().look)}" width="48" height="64" alt="">` : DQ.ico('star')) : DQ.artImage ? DQ.artImage('skill', m.id, 64, 'pxa', '') : DQ.ico(m.id);
  return `<span class="lwm-art">${art}</span><span class="lwm-txt"><small>${m.rank === W.MARKS.length ? 'Mastered' : 'Milestone'}</small><b>${DQ.esc(name)} ${m.level}</b></span>`;
};
const place = el => {
  const v = document.getElementById('view'), r = v && shown(v) ? v.getBoundingClientRect() : { left: 0, width: innerWidth, top: 60 };
  const top = Math.max(r.top, 0) + (innerWidth <= 860 ? 8 : 14);
  Object.assign(el.style, { left: page(r.left + r.width / 2) + 'px', top: page(top) + 'px' });
};
const showTitle = m => {
  if (showing) { queue = W.queueAdd(queue, m, performance.now()); return; }
  const times = m.times || W.titleTimes(m.rank || 0), still = calm();
  const el = document.createElement('div'); el.className = `lw-moment ${m.type}${m.rank === W.MARKS.length ? ' grand' : ''}${m.band ? ' band-' + m.band : ''}`;
  el.setAttribute('role', 'status'); el.setAttribute('aria-live', 'polite');
  if (m.col) el.style.setProperty('--lwm-c', m.col); else if (m.type === 'level' && m.who !== 'hero' && D.SK[m.id]) el.style.setProperty('--lwm-c', D.SK[m.id].col);
  el.innerHTML = titleHtml(m); document.body.appendChild(el); place(el);
  stats.titles++; note('title', { m: { type: m.type, id: m.id, level: m.level, rank: m.rank, band: m.band }, still });
  if (m.chord) play(m.chord, T.title.chord);
  let done = false, timer = 0, anim = null;
  const end = () => { if (done) return; done = true; clearTimeout(timer); el.remove(); live.delete(entry); if (showing === entry) showing = null; setTimeout(flush, 0); };
  const entry = { el, m, finish: end, still }; showing = entry; live.add(entry);
  if (still) { timer = setTimeout(end, ms(times.total)); return; }
  const k1 = times.in / times.total, k2 = (times.in + times.hold) / times.total, out = 'cubic-bezier(.16,1,.3,1)';
  anim = el.animate([{ opacity: 0, translate: '-50% -10px', easing: out }, { opacity: 1, translate: '-50% 0', offset: k1 }, { opacity: 1, translate: '-50% 0', offset: k2, easing: out }, { opacity: 0, translate: '-50% -6px' }],
    { duration: ms(times.total), easing: 'linear', fill: 'both' });
  anim.onfinish = end; anim.oncancel = end;
};
const title = m => {
  const g = gate(true);
  if (g === 'drop') return;
  if (g === 'queue') { stats.queued++; queue = W.queueAdd(queue, m, performance.now()); note('queued', { m: { type: m.type, id: m.id, level: m.level } }); return; }
  showTitle(m);
};
const flush = () => {
  if (showing || !queue.length) return;
  queue = W.queueReady(queue, performance.now()); if (!queue.length) return;
  const g = gate(true); if (g === 'queue' || g === 'drop') return;
  queue.sort((a, b) => (b.type === 'level') - (a.type === 'level') || (b.rank || 0) - (a.rank || 0));
  showTitle(queue.shift());
};
const close0 = DQ.closeModal; if (close0) DQ.closeModal = (...a) => { const r = close0(...a); if (queue.length) setTimeout(flush, 320); return r; };
DQ.on('act', () => { if (queue.length) setTimeout(flush, 0); });
DQ.on('ui', () => { if (queue.length && !showing) flush(); });

/* ---------- levels ---------- */
let batch = null;
const levelUp = (who, id, level) => {
  if (gate(false) === 'drop') return;
  if (!batch) { batch = []; queueMicrotask(flushLevels); }
  batch.push({ who, id, level });
};
const flushLevels = () => {
  const L = batch; batch = null; const m = W.levelMoment(L); if (!m) return;
  stats.chimes++; note('level', { who: m.who, id: m.id, level: m.level, rank: m.rank, sound: m.sound });
  /* an ordinary level: the chime; a milestone: the chime now if its title has to wait, else the chord with the title */
  const g = m.title ? gate(true) : 'show';
  if (!m.title) return play(m.sound, T.level.chime);
  if (g === 'queue') play('lvchime' + Math.min(5, Math.max(0, m.band - 1)), T.level.chime);
  title({ ...m, chord: m.sound });
};
DQ.on('levelup', (sk, to) => levelUp('skill', sk, to));
DQ.on('herolevel', (from, to) => levelUp('hero', null, to));

/* ---------- finds ---------- */
const recording = () => !(DQ.sim && DQ.sim.on) && !DQ.forecasting && DQ.act && DQ.act.kind !== 'fight';
let got = null, huntOut = null, lastFind = null, gemTask = null;
/* the first time the hero ever finds an item, read from the save's own acquisition history (S.seen.items, which
   DQ.grant keeps) just before the grant records it; only a first epic find gets the title. Nothing new is saved. */
const firstEver = id => { const seen = (S() && S().seen && S().seen.items) || {}; return !seen[id] && DQ.have(id) === 0; };
let firsts = null;
const grant0 = DQ.grant;
DQ.grant = (id, n = 1) => {
  if (!(DQ.sim && DQ.sim.on) && !DQ.forecasting && D.ITEMS[id] && n > 0 && firstEver(id)) { if (!firsts) { firsts = new Set(); queueMicrotask(() => { firsts = null; }); } firsts.add(id); }
  const r = grant0(id, n);
  if (recording() && D.ITEMS[id] && n > 0) { if (!got) { got = new Map(); queueMicrotask(() => { got = null; }); } got.set(id, (got.get(id) || 0) + n); }
  return r; };
DQ.on('huntcatch', (m, out) => { huntOut = out || null; queueMicrotask(() => { huntOut = null; }); });
/* the plain gem chime a find used to make waits a moment, so a weighted find's own chime replaces it (never both) */
const sfx0 = DQ.sfx;
let selling = 0;
DQ.sfx = name => {
  if (name === 'sell' && selling) return; /* a sale is answered by its own weighted clunk */
  if (name === 'gem' && !(DQ.sim && DQ.sim.on) && !DQ.forecasting) {
    if (!gemTask) { gemTask = { claimed: false }; const t = gemTask; queueMicrotask(() => { gemTask = null; if (!t.claimed) sfx0('gem'); }); }
    return;
  }
  return sfx0(name);
};
const sceneEl = kind => { const sc = document.querySelector('#view .activity-scene'); return sc && (!kind || sc.dataset.kind === kind) && shown(sc) ? sc : null; };
const light = (scene, at, col, scale) => {
  if (!scene || !at) return;
  const r = scene.getBoundingClientRect(), a = at.getBoundingClientRect(), z = zoom();
  const el = document.createElement('i'); el.className = 'lw-find-light'; el.setAttribute('aria-hidden', 'true');
  const w = 48 * scale, h = 32 * scale;
  Object.assign(el.style, { left: Math.round((a.left + a.width / 2 - r.left) / z - w / 2) + 'px', top: Math.round((a.top + a.height * .62 - r.top) / z - h / 2) + 'px', width: w + 'px', height: h + 'px', backgroundImage: `url("${glowUrl(col)}")` });
  scene.appendChild(el); stats.lights++;
  const peak = T.find.lightPeak / T.find.light;
  const anim = el.animate([{ opacity: 0, scale: '.7' }, { opacity: 1, scale: '1', offset: peak }, { opacity: 0, scale: '1.08' }], { duration: ms(T.find.light), easing: 'cubic-bezier(.16,1,.3,1)' });
  anim.onfinish = anim.oncancel = () => el.remove(); track(anim);
};
const answerFind = (f, where) => {
  const g = gate(false); if (g === 'drop') return;
  stats.finds++; note('find', { id: f.id, band: f.tier.band, sound: f.tier.sound, where });
  if (gemTask) gemTask.claimed = true;
  play(f.tier.sound, T.find.chime);
  if (f.tier.light && g === 'show') {
    if (where === 'fight') { const ar = document.querySelector('.encounter-arena'), foe = document.getElementById('av-foe'); if (shown(ar) && shown(foe)) light(ar, foe, f.tier.col, 4); }
    else { const sc = sceneEl(); if (sc) light(sc, sc.querySelector('.scene-target') || sc, f.tier.col, 3); }
  }
  if (f.tier.title && f.first) title({ type: 'find', id: f.id, band: f.tier.band, label: f.tier.label, col: f.tier.col, rank: 0, chord: null, times: W.titleTimes(0) });
};
DQ.on('workcycle', ev => {
  const g = got, out = huntOut; got = null; lastFind = null; if (!g || !g.size || !ev) return;
  const node = D.NODE && D.NODE[ev.kind + ':' + ev.id], recipe = ev.kind === 'recipe' && D.RECIPES[ev.id], main = node && node.item || recipe && Object.keys(recipe.out || {})[0];
  if (recipe) return; /* making something is not a find */
  const list = [...g.keys()].map(id => {
    const it = D.ITEMS[id] || {}, h = ev.kind === 'hunt' && out ? out.find(o => o.id === id) : null;
    const chance = h ? (h.rar ? h.rar[3] : null) : W.workFindChance({ kind: ev.kind, item: id, main, loot: node && node.loot });
    return { id, chance, unique: !!it.unique };
  }).filter(f => f.chance != null || f.unique);
  const best = W.biggestFind(list); if (!best || best.tier.band < 1) return;
  lastFind = { ev, id: best.id, tier: best.tier };
  answerFind({ ...best, first: !!(firsts && firsts.has(best.id)) }, 'work');
});
DQ.on('loot', (m, drops) => {
  if (!drops || !drops.length) return;
  const best = W.biggestFind(drops.filter(d => !d.coins && d.rar).map(d => ({ id: d.id, chance: d.rar[3], unique: !!(D.ITEMS[d.id] || {}).unique })));
  if (best && best.tier.band >= 1) answerFind({ ...best, first: !!(firsts && firsts.has(best.id)) }, 'fight');
});

/* ---------- sales ---------- */
let sale = null, lastPress = null;
const pressAt = e => { const b = e.target && e.target.closest && e.target.closest('button,[data-do]'); if (b) lastPress = { rect: b.getBoundingClientRect(), at: performance.now() }; };
document.addEventListener('pointerdown', pressAt, { capture: true, passive: true });
document.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') pressAt({ target: document.activeElement }); }, { capture: true, passive: true });
const sell0 = DQ.sell;
DQ.sell = (...a) => {
  const answer = gate(false) !== 'drop';
  if (answer) selling++; let r; try { r = sell0(...a); } finally { if (answer) selling--; }
  if (answer && r > 0) { if (!sale) { sale = { coins: 0, n: 0 }; queueMicrotask(flushSale); } sale.coins += r; sale.n++; }
  return r;
};
const purse = () => [document.querySelector('#hud .h-coin'), document.querySelector('.hud .h-coin')].find(shown) || null;
const flushSale = () => {
  const s = sale; sale = null; const b = W.saleBand(s.coins); if (!b) return;
  const g = gate(false); if (g === 'drop') return;
  stats.sales++; note('sale', { coins: s.coins, band: b.band, sound: b.sound, drop: b.coins });
  play(b.sound, 0); /* the clunk itself waits for the first coin to land (T.sale.clunk, inside the sound) */
  if (g !== 'show') return;
  const to = purse(), from = lastPress && performance.now() - lastPress.at < 4000 ? lastPress.rect : null;
  if (!to || !from) return;
  const t = to.getBoundingClientRect(), size = 16, x1 = page(t.left + 9 - size / 2), y1 = page(t.top + t.height / 2 - size / 2);
  for (let i = 0; i < b.coins; i++) {
    const c = document.createElement('span'); c.className = 'lw-coin'; c.setAttribute('aria-hidden', 'true'); c.innerHTML = DQ.ico('coin');
    /* the coins leave the button spread a little along it (a fixed fan, no randomness) */
    const fan = b.coins > 1 ? (i / (b.coins - 1) - .5) : 0, x0 = page(from.left + from.width / 2 + fan * Math.min(60, from.width * .6) - size / 2), y0 = page(from.top + from.height / 2 - size / 2);
    Object.assign(c.style, { left: x0 + 'px', top: y0 + 'px' }); document.body.appendChild(c); stats.coins++;
    const dx = x1 - x0, dy = y1 - y0, lift = Math.min(-36, dy * .3 - 36) - (i % 3) * 6;
    const anim = c.animate([{ translate: '0 0', opacity: 0 }, { translate: `0 -8px`, opacity: 1, offset: .12 }, { translate: `${dx * .5}px ${dy * .5 + lift}px`, opacity: 1, offset: .5 }, { translate: `${dx}px ${dy}px`, opacity: 1 }],
      { duration: ms(T.sale.flight), delay: ms(i * T.sale.stagger), easing: 'cubic-bezier(.45,.05,.35,1)', fill: 'backwards' });
    const land = () => { c.remove(); if (i === 0 && to.isConnected && !calm()) { to.classList.remove('lw-take'); void to.offsetWidth; to.classList.add('lw-take'); setTimeout(() => to.classList.remove('lw-take'), ms(T.sale.take) + 40); } };
    anim.onfinish = land; anim.oncancel = () => c.remove(); track(anim);
  }
};

/* ---------- blows ---------- */
let cur = null, killKey = null;
const splat0 = DQ.splat;
DQ.splat = (side, text, kind = '', delay = 0) => {
  if ((DQ.sim && DQ.sim.on) || DQ.forecasting || side !== 'foe') return splat0(side, text, kind, delay);
  const n = /^\d/.test(String(text)) ? parseInt(text, 10) || 0 : 0, f = DQ.fight, m = f && D.MON[f.id];
  let killing = false;
  if (n > 0 && f && f.hp <= 0) { const key = f.id + ':' + (S().stats.kill || 0); if (key !== killKey) { killKey = key; killing = true; } }
  const boss = !!m && ((m.boss && !(S().towns[m.town] && S().towns[m.town].boss)) || (m.mini && !(S().minis && S().minis[m.id])));
  const w = W.hitTier({ dealt: n, kind, foeMax: m ? m.hp : 0, killing, boss });
  cur = { side, text, kind, w };
  try { return splat0(side, text, kind, delay); }
  finally { cur = null; if (w && (w.stop || w.sound)) answerHit(w, delay); }
};
const hitOf = (side, text, kind = '') => cur && cur.side === side && cur.text === text && cur.kind === kind ? cur.w : null;
const hitStop = sec => {
  const els = [document.getElementById('av-foe'), document.getElementById('av-you')].filter(Boolean);
  const anims = els.flatMap(e => e.getAnimations({ subtree: true })).filter(a => a.playState === 'running');
  if (!anims.length) return; stats.stops++;
  anims.forEach(a => { try { a.pause(); } catch (e) {} });
  let done = false; const entry = { finish: () => { if (done) return; done = true; live.delete(entry); anims.forEach(a => { try { if (a.playState === 'paused') a.play(); } catch (e) {} }); } };
  live.add(entry); setTimeout(entry.finish, ms(sec));
};
const answerHit = (w, delay) => {
  const g = gate(false); if (g === 'drop' || UI.view !== 'combat') return;
  stats.hits++; note('hit', { tier: w.tier, sound: w.sound, stop: w.stop });
  const at = Math.max(0, delay - 180) + ((DQ.battleTiming && DQ.battleTiming.impact) || 390);
  const go = () => { if (document.hidden || UI.view !== 'combat') return; play(w.sound); if (w.stop && g === 'show' && !calm()) hitStop(w.stop); };
  UI.afterImpact ? UI.afterImpact(go, at) : setTimeout(go, at);
};

Object.assign(DQ.weight, {
  stats, log, track, hurry, hitOf,
  lastWorkFind: ev => lastFind && lastFind.ev === ev ? lastFind : null,
  dropTier: d => d && d.rar ? W.findTier(d.rar[3], { unique: !!(D.ITEMS[d.id] || {}).unique }) : null,
  showing: () => showing && { type: showing.m.type, id: showing.m.id, level: showing.m.level, still: showing.still },
  queued: () => queue.map(q => ({ type: q.type, id: q.id, level: q.level, rank: q.rank })),
  flush,
  /* tests and the Art showcase: run a moment directly, through the same gates */
  levelUp: (who, id, level) => levelUp(who, id, level),
  find: (id, chance, where = 'work', first = firstEver(id)) => { const t = W.findTier(chance, { unique: !!(D.ITEMS[id] || {}).unique }); if (t && t.band >= 1) answerFind({ id, chance, tier: t, first }, where); },
  sale: coins => { if (gate(false) === 'drop') return; if (!sale) { sale = { coins: 0, n: 0 }; queueMicrotask(flushSale); } sale.coins += coins; sale.n++; },
  hit: (tier, delay = 180) => { const w = W.hitTier(tier); if (w) answerHit(w, delay); return w; },
  stop: hitStop
});
})();
