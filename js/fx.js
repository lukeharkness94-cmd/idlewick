/* Idlewick: visual effects, notifications, tooltips and modals. */
(() => {
const DQ = window.DQ, { $, $$, ico, esc } = DQ;
const reduceOS = matchMedia('(prefers-reduced-motion: reduce)').matches;
const calm = () => reduceOS || DQ.S.settings.reduceFx;
let fxEl, cv, cx, parts = [], running = false, notesEl;

DQ.fxInit = () => {
  fxEl = $('#fx'); cv = $('#confetti'); cx = cv.getContext('2d'); notesEl = $('#notes');
  const fit = () => { cv.width = innerWidth * devicePixelRatio; cv.height = innerHeight * devicePixelRatio; };
  fit(); addEventListener('resize', fit);
  document.addEventListener('pointerdown', e => {
    if (calm() || e.button) return;
    const inter = e.target.closest('button,[data-do],a,.slot');
    ripple(e.clientX, e.clientY, !!inter);
    if (inter && !inter.closest('.rail,.hud')) DQ.sfx('click');
  }, { passive: true });
  initTips();
};

/* ---------- click ripple ---------- */
function ring(x, y, size, dur, delay, col, bw) {
  const d = document.createElement('div');
  d.style.cssText = `position:absolute;left:${x}px;top:${y}px;width:${size}px;height:${size}px;margin:${-size / 2}px 0 0 ${-size / 2}px;border-radius:50%;border:${bw}px solid ${col}`;
  fxEl.appendChild(d);
  const a = d.animate([{ transform: 'scale(.1)', opacity: .9 }, { transform: 'scale(1)', opacity: 0 }], { duration: dur, delay, easing: 'cubic-bezier(.15,.7,.2,1)', fill: 'both' });
  a.onfinish = () => d.remove();
}
function ripple(x, y, big) {
  ring(x, y, big ? 130 : 70, 620, 0, '#d8a64a', 2);
  ring(x, y, big ? 78 : 40, 460, 80, '#f3d58a', 1.5);
  if (!big) return;
  for (let i = 0; i < 8; i++) {
    const s = document.createElement('div'), sz = 3 + Math.random() * 4;
    s.style.cssText = `position:absolute;left:${x}px;top:${y}px;width:${sz}px;height:${sz}px;background:${i % 3 ? '#f3d58a' : '#d8a64a'};transform:rotate(45deg)`;
    fxEl.appendChild(s);
    const ang = i / 8 * 6.283 + Math.random() * .6, dist = 26 + Math.random() * 36;
    const a = s.animate([{ transform: 'translate(0,0) rotate(45deg) scale(1)', opacity: 1 }, { transform: `translate(${Math.cos(ang) * dist}px,${Math.sin(ang) * dist + 8}px) rotate(200deg) scale(0)`, opacity: 0 }], { duration: 480 + Math.random() * 200, easing: 'cubic-bezier(.1,.7,.3,1)', fill: 'both' });
    a.onfinish = () => s.remove();
  }
}

/* ---------- floating text ---------- */
DQ.floatAt = (el, html, col) => {
  if (DQ.sim.on || document.hidden || !el || !fxEl) return;
  const r = el.getBoundingClientRect(); if (!r.width && !r.height) return;
  const f = document.createElement('div'); f.className = 'fl'; f.style.setProperty('--c', col || '#f3d58a');
  f.style.left = (r.left + r.width / 2 + (Math.random() - .5) * Math.min(70, r.width * .5)) + 'px';
  f.style.top = (r.top + Math.min(r.height / 2, 36)) + 'px';
  f.innerHTML = html; fxEl.appendChild(f); f.addEventListener('animationend', () => f.remove());
  const live = fxEl.querySelectorAll('.fl'); if (live.length > 9) live[0].remove();
};
DQ.pulse = sel => { if (DQ.sim.on) return; $$(sel).forEach(el => { el.classList.remove('gain'); void el.offsetWidth; el.classList.add('gain'); }); };
DQ.flash = (el, cls) => { if (!el || DQ.sim.on) return; el.classList.remove(cls); void el.offsetWidth; el.classList.add(cls); };

/* ---------- particles ---------- */
DQ.burstAt = (x, y, col, n = 30) => {
  if (calm() || DQ.sim.on) return;
  for (let i = 0; i < n; i++) {
    const a = Math.random() * 6.283, v = 1.5 + Math.random() * 5;
    parts.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 2.5, life: 1, d: .012 + Math.random() * .014, s: 2.5 + Math.random() * 3.5, c: Math.random() < .6 ? col : '#f3d58a' });
  }
  if (!running) { running = true; requestAnimationFrame(loop); }
};
DQ.burstEl = (el, col, n) => { if (!el) return; const r = el.getBoundingClientRect(); DQ.burstAt(r.left + r.width / 2, r.top + r.height / 2, col, n); };
function loop() {
  cx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0); cx.clearRect(0, 0, innerWidth, innerHeight);
  parts = parts.filter(p => p.life > 0);
  for (const p of parts) { p.vy += .16; p.vx *= .985; p.x += p.vx; p.y += p.vy; p.life -= p.d; cx.globalAlpha = Math.max(0, p.life); cx.fillStyle = p.c; cx.fillRect(p.x, p.y, p.s, p.s * .6); }
  if (parts.length) requestAnimationFrame(loop); else { running = false; cx.clearRect(0, 0, innerWidth, innerHeight); }
}

/* ---------- toast ---------- */
DQ.toast = (msg, bad) => {
  if (DQ.sim.on) return; if (bad) DQ.sfx('error');
  const t = document.createElement('div'); t.className = 'toast' + (bad ? ' bad' : ''); t.textContent = msg;
  $$('.toast').forEach(x => x.remove()); fxEl.appendChild(t); setTimeout(() => t.remove(), 2600);
};

/* ---------- notifications ----------
   Three tiers keep the corner calm:
   - now:    deaths, warnings, rare loot, finished tasks. A card of their own, at most two at a time.
   - digest: level-ups, unlocks, quests, perks, achievements. Anything arriving close together is merged into ONE
             "What's new" card, and a lone level-up never pops a card more than once every 45 seconds.
   - quiet:  tips and chatter. They go to the bell in the top bar only.
   Everything is also kept in the bell's recent list, so nothing is lost. */
const queue = [], MAX_NOW = 2;
const live = () => $$('.note', notesEl).filter(n => !n.classList.contains('out'));
const nowLive = () => live().filter(n => !n.classList.contains('digest')).length;
DQ.noteLog = []; DQ.noteMissed = 0;
const keyOf = o => o.key || '';
const SHOW_INFO = /^(taskdone|offline|death|stopped|unpaid|qskip|chest)$/, BST = /^(beast|research):/;
const tierOf = o => {
  const k = keyOf(o), kd = o.kind;
  if (o.show || kd === 'death' || kd === 'warn' || kd === 'boss' || kd === 'loot' || SHOW_INFO.test(k)) return 'now';
  if (kd === 'info' && !BST.test(k)) return 'quiet';
  return 'digest';
};
const groupOf = o => {
  const k = keyOf(o);
  if (k.startsWith('lvl:') || k === 'adv') return 'lvl';
  if (/^(unlock:|plan$|mq:|tech:|mastery$|house$)/.test(k)) return 'unl';
  if (/^(perk:|bond$|furn:)/.test(k)) return 'perk';
  if (k.startsWith('q')) return 'qst';
  if (k.startsWith('ach')) return 'ach';
  if (BST.test(k)) return 'bst';
  return 'misc';
};
const num = t => +((String(t).match(/\d+/) || [0])[0]);
const isWeak = o => { const k = keyOf(o); return k.startsWith('lvl:') || (k === 'adv' && num(o.title) % 5 !== 0); };
const logNote = o => { DQ.noteLog.unshift({ t: Date.now(), o, silent: false }); if (DQ.noteLog.length > 40) DQ.noteLog.pop(); };
const markSilent = (o, count) => { const e = DQ.noteLog.find(x => x.o === o); if (e) { e.silent = true; if (count) DQ.noteMissed++; } };
DQ.notify = o => {
  if (DQ.sim.on) { DQ.sim.notes.push(o); return; }
  const s = DQ.S.settings; logNote(o);
  if (!s.notify && !o.force) { markSilent(o, false); return; }
  const tier = tierOf(o);
  if (tier === 'quiet') { markSilent(o, true); return; }
  if (tier === 'digest') { addPending(o); return; }
  if (o.key) { $$('.note[data-key="' + o.key + '"]').forEach(n => n.remove()); const i = queue.findIndex(q => q.key === o.key); if (i >= 0) queue.splice(i, 1); }
  if (nowLive() >= MAX_NOW) { queue.push(o); if (queue.length > 6) queue.shift(); return; }
  showNote(o);
};
function pump() { while (queue.length && nowLive() < MAX_NOW) showNote(queue.shift()); }

/* digest: collect for a moment, then show one card */
let pend = [], pendT = 0, pendFirst = 0, dg = null, lastWeakAt = 0;
function addPending(o) {
  if (o.key) { const i = pend.findIndex(p => p.key === o.key); if (i >= 0) pend.splice(i, 1); }
  pend.push(o); const t = performance.now(); if (!pendFirst) pendFirst = t;
  clearTimeout(pendT); pendT = setTimeout(flush, Math.max(0, Math.min(1100, 3500 - (t - pendFirst))));
}
const dgLive = () => dg && dg.el && dg.el.isConnected && !dg.el.classList.contains('out') && Date.now() - dg.born < 14000;
function flush() {
  pendT = 0; pendFirst = 0; const items = pend; pend = []; if (!items.length) return;
  if (dgLive()) { items.forEach(dgAdd); renderDg(true); return; }
  if (items.every(isWeak)) { const now = Date.now(); if (now - lastWeakAt < 45000) { items.forEach(o => markSilent(o, false)); return; } lastWeakAt = now; }
  if (items.length === 1) { showNote(items[0]); return; }
  startDg(items);
}
function dgAdd(o) { if (o.key) dg.items = dg.items.filter(x => x.key !== o.key); dg.items.push(o); }
const short = t => String(t).replace(/^Hero level (\d+)$/, 'Hero $1').replace(/ level (\d+)$/, ' $1');
const trunc = (t, n) => { t = String(t || '').replace(/<[^>]+>/g, ''); return t.length > n ? t.slice(0, n - 1).trimEnd() + '…' : t; };
function dgRows() {
  const items = dg.items, by = g => items.filter(o => groupOf(o) === g), rows = [];
  const one = o => { const a = inferActions(o); return { icon: o.icon, col: o.col, lead: o.title, detail: trunc(o.text, 78), fn: a[0] && a[0].fn }; };
  by('unl').forEach(o => rows.push(one(o)));
  const q = by('qst'); if (q.length === 1) rows.push(one(q[0])); else if (q.length) rows.push({ icon: 'quest', col: q[0].col, lead: `${q.length} quest updates`, detail: trunc(q.map(o => o.title).join(' · '), 78), fn: () => DQ.go('quests') });
  by('perk').forEach(o => rows.push(one(o)));
  const ac = by('ach'); if (ac.length === 1) rows.push(one(ac[0])); else if (ac.length) rows.push({ icon: 'trophy', col: '#f3d58a', lead: `${ac.length} achievements`, detail: trunc(ac.map(o => o.title.replace(/^Achievement: /, '')).join(' · '), 78), fn: () => DQ.go('achievements') });
  const bs = by('bst'); if (bs.length === 1) rows.push(one(bs[0])); else if (bs.length) rows.push({ icon: 'book', col: bs[0].col, lead: `${bs.length} field guide entries`, detail: trunc(bs.map(o => o.title.replace(/^Bestiary: /, '')).join(' · '), 78), fn: () => DQ.go('bestiary') });
  by('misc').forEach(o => rows.push(one(o)));
  const lv = by('lvl'); if (lv.length) { const sk = lv.find(o => o.key !== 'adv'); rows.push({ icon: sk ? sk.icon : 'star', col: sk ? sk.col : '#d8a64a', lead: 'Level up', detail: trunc(lv.map(o => short(o.title)).join(' · '), 78), fn: () => DQ.go(sk ? (DQ.data.SK[keyOf(sk).slice(4)] || {}).page || 'overview' : 'overview') }); }
  return rows;
}
function renderDg(merged) {
  const rows = dgRows(), shown = rows.slice(0, 4), more = rows.length - shown.length, el = dg.el;
  el.innerHTML = `<div class="dg-h"><b>What's new</b><button class="n-x" aria-label="Dismiss">${ico('close')}</button></div><div class="dg-rows">${shown.map((r, i) => `<button class="dg-row" data-i="${i}" style="--c:${r.col || '#d8a64a'};--r:${i}"><span class="n-ic">${ico(r.icon || 'star')}</span><span class="dg-t"><b>${r.lead}</b>${r.detail ? `<small>${esc(r.detail)}</small>` : ''}</span>${ico('chevron')}</button>`).join('')}${more > 0 ? `<button class="dg-row more" data-i="more"><span class="dg-t"><b>+${more} more</b><small>Open recent activity</small></span>${ico('chevron')}</button>` : ''}</div><i class="n-t"></i>`;
  $('.n-x', el).onclick = () => dismiss(el);
  $$('.dg-row', el).forEach(b => b.onclick = () => { dismiss(el); if (b.dataset.i === 'more') DQ.openBell(); else { const r = shown[+b.dataset.i]; r && r.fn && r.fn(); } });
  const ttl = Math.max(3000, Math.min(Math.min(16000, 6500 + 1800 * shown.length), 15000 - (Date.now() - dg.born))), bar = $('.n-t', el); bar.style.animationDuration = ttl + 'ms';
  clearTimeout(dg.timer); dg.left = ttl; const arm = () => { dg.started = performance.now(); dg.timer = setTimeout(() => dismiss(el), dg.left); bar.style.animationPlayState = 'running'; };
  el.onmouseenter = () => { clearTimeout(dg.timer); dg.left -= performance.now() - dg.started; bar.style.animationPlayState = 'paused'; };
  el.onmouseleave = arm; arm();
  if (merged) { el.classList.remove('bump'); void el.offsetWidth; el.classList.add('bump'); }
}
function startDg(items) {
  dg = { items: [], born: Date.now(), el: document.createElement('div') }; items.forEach(dgAdd);
  dg.el.className = 'note digest'; dg.el.setAttribute('role', 'status'); dg.el.style.setProperty('--c', '#d8a64a'); notesEl.appendChild(dg.el); renderDg(false);
  const lead = dg.items.find(o => !isWeak(o) && o.sound !== false) || dg.items.find(o => o.sound !== false); DQ.sfx((lead && lead.sound) || 'notify');
  if (dg.items.some(o => o.burst)) setTimeout(() => dg && dg.el && DQ.burstEl($('.n-ic', dg.el), '#d8a64a', 22), 120);
}
/* the bell: everything recent, including what never got a card */
const ago = t => { const s = Math.round((Date.now() - t) / 1000); return s < 60 ? 'just now' : s < 3600 ? `${Math.round(s / 60)} min ago` : `${Math.round(s / 3600)} h ago`; };
DQ.openBell = () => {
  DQ.noteMissed = 0; const L = DQ.noteLog.slice(0, 25);
  const body = L.length ? `<div class="bell-list">${L.map((e, i) => { const o = e.o, a = inferActions(o)[0]; return `<div class="bell-row ${e.silent ? 'quiet' : ''}" style="--c:${o.col || '#d8a64a'}"><span class="n-ic">${ico(o.icon || 'star')}</span><div class="bell-t"><b>${o.title}</b>${o.text ? `<span>${trunc(o.text, 140)}</span>` : ''}<small>${ago(e.t)}</small></div>${a ? `<button class="btn sm" data-i="${i}">${esc(a.label)}</button>` : ''}</div>`; }).join('')}</div>` : '<p class="dim" style="margin:0">Nothing yet. Level-ups, unlocks and finds will be listed here.</p>';
  DQ.modal({ title: 'Recent activity', wide: true, body, actions: [{ label: 'Close', primary: true }] });
  $$('.bell-row .btn').forEach(b => b.onclick = () => { const e = L[+b.dataset.i], a = e && inferActions(e.o)[0]; DQ.closeModal(); a && a.fn && a.fn(); });
};
/* Every notification gets somewhere to go. Explicit actions win; otherwise infer from what it is about. */
const go = (page, extra) => () => { if (extra) extra(); DQ.go(page); };
function inferActions(o) {
  if (o.actions) return o.actions; if (o.action) return [o.action];
  const k = o.key || '', D = DQ.data, txt = (o.text || '') + ' ' + o.title;
  const skillPage = sk => D.SK[sk] ? D.SK[sk].page : 'overview';
  if (k.startsWith('lvl:') || k.startsWith('perk:')) { const sk = k.startsWith('lvl:') ? k.slice(4) : Object.keys(D.SK).find(s => k.startsWith('perk:' + s)); return [{ label: `Open ${D.SK[sk] ? D.SK[sk].name : 'skill'}`, fn: go(skillPage(sk)) }]; }
  if (k === 'adv') return [{ label: 'See your skills', fn: go('overview') }];
  if (k.startsWith('ach')) return [{ label: 'View achievements', fn: go('achievements') }];
  if (k.startsWith('qd:') || k.startsWith('qr') || k.startsWith('q')) return [{ label: 'Open quests', fn: go('quests') }];
  if (k === 'death') return [{ label: 'Check gear', fn: go('character') }, { label: 'Combat page', fn: go('combat') }];
  if (k === 'stopped') {
    if (/arrow|rune/i.test(txt)) return [{ label: 'Go to shop', fn: go('shop') }, { label: 'Plan', fn: () => DQ.ui.openPlan() }];
    if (/food|health/i.test(txt)) return [{ label: 'Cook food', fn: go('cooking') }, { label: 'Shop', fn: go('shop') }];
    if (/material|transmute/i.test(txt)) return [{ label: 'Open bank', fn: go('bank') }, { label: 'Shop', fn: go('shop') }];
    return [{ label: 'Open plan', fn: () => DQ.ui.openPlan() }];
  }
  if (k.startsWith('rare:') || k.startsWith('drop:') || k === 'chest' || k.startsWith('pet:')) { const id = k.split(':')[1], it = id && D.ITEMS[id]; if (!it) return [{ label: 'Open inventory', fn: go('character') }]; return [{ label: it.slot ? 'See it and equip' : 'See it', fn: () => DQ.ui.showItem(id) }]; }
  if (k === 'overflow') return [{ label: 'Open bank', fn: go('bank') }, { label: 'Backpack', fn: go('character') }];
  if (k === 'taskdone' || k === 'qnext' || k === 'qskip' || k === 'offline') return [{ label: 'Open plan', fn: () => DQ.ui.openPlan() }];
  if (k.startsWith('beast:') || k === 'bond') return [{ label: 'Open bestiary', fn: go('bestiary', () => { DQ.ui.beastTab = k === 'bond' ? 'pets' : 'monsters'; }) }];
  if (k === 'house' || k.startsWith('furn:')) return [{ label: 'Open house', fn: go('house') }];
  if (k.startsWith('w:') || k === 'unpaid') return [{ label: 'Open workers', fn: go('hirelings') }];
  if (k.startsWith('boss:')) return [{ label: 'Open map', fn: go('map') }];
  return [{ label: 'Open Home', fn: go('overview') }];
}
function showNote(o) {
  const acts = inferActions(o);
  const el = document.createElement('div'); el.className = 'note ' + (o.kind || ''); el.style.setProperty('--c', o.col || '#d8a64a'); if (o.key) el.dataset.key = o.key;
  el.setAttribute('role', 'status');
  el.innerHTML = `<span class="n-ic">${ico(o.icon || 'star')}</span><div class="n-b"><b>${o.title}</b>${o.text ? `<span>${o.text}</span>` : ''}${acts.length ? `<span class="n-acts">${acts.map((a, i) => `<button class="n-act" data-i="${i}">${esc(a.label)}</button>`).join('')}</span>` : ''}</div><button class="n-x" aria-label="Dismiss">${ico('close')}</button><i class="n-t"></i>`;
  notesEl.appendChild(el);
  const ttl = o.ttl || 7500; let timer, left = ttl, started = performance.now();
  const bar = $('.n-t', el); bar.style.animationDuration = ttl + 'ms';
  const arm = () => { started = performance.now(); timer = setTimeout(() => dismiss(el), left); bar.style.animationPlayState = 'running'; };
  el.addEventListener('mouseenter', () => { clearTimeout(timer); left -= performance.now() - started; bar.style.animationPlayState = 'paused'; });
  el.addEventListener('mouseleave', arm); arm();
  $('.n-x', el).onclick = () => dismiss(el);
  $$('.n-act', el).forEach(b => b.onclick = () => { dismiss(el); acts[+b.dataset.i].fn(); });
  if (o.sound !== false) DQ.sfx(o.sound || 'notify');
  if (o.burst) setTimeout(() => DQ.burstEl($('.n-ic', el), o.col || '#d8a64a', 22), 120);
  return el;
}
function dismiss(el) { if (!el || el.classList.contains('out')) return; el.classList.add('out'); if (dg && dg.el === el) clearTimeout(dg.timer); setTimeout(() => { el.remove(); pump(); }, 320); }

/* ---------- modal ---------- */
let modalEl = null;
DQ.closeModal = () => { if (modalEl) { const m = modalEl; modalEl = null; m.classList.add('out'); setTimeout(() => m.remove(), 200); } };
DQ.modal = o => {
  DQ.closeModal();
  const m = document.createElement('div'); m.className = 'modal'; m.setAttribute('role', 'dialog'); m.setAttribute('aria-modal', 'true');
  m.innerHTML = `<div class="m-card ${o.wide ? 'wide' : ''}"><h2>${o.title}</h2><div class="m-body">${o.body || ''}</div><div class="m-act">${(o.actions || [{ label: 'Close' }]).map((a, i) => `<button class="btn ${a.primary ? 'primary' : ''}" data-i="${i}">${esc(a.label)}</button>`).join('')}</div></div>`;
  document.body.appendChild(m); modalEl = m;
  $$('.m-act .btn', m).forEach(b => b.onclick = () => { const a = (o.actions || [{}])[+b.dataset.i]; if (a.fn && a.fn(m) === false) return; DQ.closeModal(); });
  m.addEventListener('pointerdown', e => { if (e.target === m && !o.sticky) DQ.closeModal(); });
  const f = $('.btn.primary', m) || $('.btn', m); if (f) f.focus();
  return m;
};
addEventListener('keydown', e => { if (e.key === 'Escape' && modalEl && !modalEl.querySelector('.sticky')) DQ.closeModal(); });

/* ---------- tooltips ---------- */
DQ.tips = {};
let tipEl, tipTimer, tipTarget;
function initTips() {
  tipEl = document.createElement('div'); tipEl.id = 'tip'; tipEl.setAttribute('role', 'tooltip'); document.body.appendChild(tipEl);
  const show = (t, x, y) => {
    const v = t.dataset.tip; const i = v.indexOf(':'), kind = v.slice(0, i), arg = v.slice(i + 1);
    let html = kind === 'text' ? esc(arg) : (DQ.tips[kind] ? DQ.tips[kind](arg, t) : ''); if (!html) return hide();
    tipEl.innerHTML = html; tipEl.classList.add('on'); place(x, y, t);
  };
  const place = (x, y, t) => {
    const r = tipEl.getBoundingClientRect(), tr = t.getBoundingClientRect(); let px = x + 16, py = y + 18;
    if (x === null) { px = tr.left + tr.width / 2 - r.width / 2; py = tr.bottom + 8; }
    if (px + r.width > innerWidth - 8) px = innerWidth - r.width - 8; if (px < 8) px = 8;
    if (py + r.height > innerHeight - 8) py = (x === null ? tr.top - r.height - 8 : y - r.height - 14); if (py < 8) py = 8;
    tipEl.style.transform = `translate(${px}px,${py}px)`;
  };
  const hide = () => { clearTimeout(tipTimer); tipTarget = null; tipEl.classList.remove('on'); };
  document.addEventListener('mouseover', e => {
    const t = e.target.closest('[data-tip]'); if (t === tipTarget) return; hide();
    if (!t || !DQ.S.settings.tips) return; tipTarget = t;
    tipTimer = setTimeout(() => show(t, e.clientX, e.clientY), 220);
  });
  document.addEventListener('mousemove', e => { if (tipEl.classList.contains('on') && tipTarget) place(e.clientX, e.clientY, tipTarget); });
  document.addEventListener('mouseout', e => { if (!e.relatedTarget || !e.relatedTarget.closest || !e.relatedTarget.closest('[data-tip]')) hide(); });
  document.addEventListener('pointerdown', hide, { passive: true });
  document.addEventListener('focusin', e => { const t = e.target.closest && e.target.closest('[data-tip]'); if (t && DQ.S.settings.tips) { tipTarget = t; show(t, null, null); } });
  document.addEventListener('focusout', hide);
  DQ.hideTip = hide;
}
})();
