/* Idlewick: visual effects, notifications, tooltips and modals. */
(() => {
const DQ = window.DQ, { $, $$, ico, esc } = DQ;
const reduceOS = matchMedia('(prefers-reduced-motion: reduce)').matches;
const calm = () => reduceOS || DQ.S.settings.reduceFx;
let fxEl, cv, cx, parts = [], running = false, notesEl, particleTime=0;

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
  if (!running) { running = true; particleTime=performance.now(); requestAnimationFrame(loop); }
};
DQ.burstEl = (el, col, n) => { if (!el) return; const r = el.getBoundingClientRect(); DQ.burstAt(r.left + r.width / 2, r.top + r.height / 2, col, n); };
/* Exact time-based integration keeps the same motion at 60, 120 or 144 Hz. */
DQ.stepParticle = (p, ms) => {
  const frames=ms/(1000/60), rate=-Math.log(.985), drag=Math.exp(-rate*frames);
  p.x+=p.vx*(1-drag)/rate;p.vx*=drag;
  p.y+=p.vy*frames+.08*frames*frames;p.vy+=.16*frames;p.life-=p.d*frames;
};
function loop(now) {
  const dt=Math.max(0,Math.min(100,now-particleTime));particleTime=now;
  if(document.hidden||calm()){parts=[];running=false;cx.clearRect(0,0,innerWidth,innerHeight);return;}
  cx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0); cx.clearRect(0, 0, innerWidth, innerHeight);
  parts = parts.filter(p => p.life > 0);
  for (const p of parts) { DQ.stepParticle(p,dt); cx.globalAlpha = Math.max(0, p.life); cx.fillStyle = p.c; cx.fillRect(p.x, p.y, p.s, p.s * .6); }
  if (parts.length) requestAnimationFrame(loop); else { running = false; cx.clearRect(0, 0, innerWidth, innerHeight); }
}

/* ---------- toast ---------- */
DQ.toast = (msg, bad) => {
  if (DQ.sim.on) return; if (bad) DQ.sfx('error');
  const t = document.createElement('div'); t.className = 'toast' + (bad ? ' bad' : ''); t.textContent = msg;
  $$('.toast').forEach(x => x.remove()); fxEl.appendChild(t); setTimeout(() => t.remove(), 2600);
};

/* Routine progress stays in the interface and recent activity.
   Unlocks, interruptions and boss victories receive a corner card. */
const queue = [], MAX_NOW = 1;
const live = () => $$('.note', notesEl).filter(n => !n.classList.contains('out'));
const nowLive = () => live().length;
DQ.noteLog = []; DQ.noteMissed = 0;
DQ.notificationTier = o => ['level', 'adv', 'unlock', 'death', 'warn', 'boss'].includes(o.kind) || /^(qr:|qo:|qnew$|project:)/.test(o.key || '') ? 'now' : 'quiet';
DQ.notificationPage = o => {
  if (o.page) return o.page;
  const k = o.key || '', D = DQ.data;
  if (/^(q|mq:)/.test(k)) return 'quests';
  if (k.startsWith('unlock:')) return (D.SK[k.slice(7)] || {}).page || 'skillsummary';
  if (k.startsWith('lvl:')) return (D.SK[k.slice(4)] || {}).page || 'skillsummary';
  if (k.startsWith('perk:')) return (D.SK[Object.keys(D.SK).find(sk => k.startsWith('perk:' + sk))] || {}).page || 'skillsummary';
  if (k === 'adv') return 'skillsummary';
  if (k.startsWith('ach') || k === 'mastery') return 'achievements';
  if (/^(beast:|research:|pet:|bond$)/.test(k)) return 'bestiary';
  if (k.startsWith('tech:')) return 'research';
  if (k.startsWith('project:')) return 'projects';
  if (k === 'house' || k.startsWith('furn:')) return 'house';
  if (k.startsWith('w:') || k === 'unpaid') return 'hirelings';
  if (k === 'overflow') return 'bank';
  if (o.kind === 'loot') return 'character';
  if (o.kind === 'discovery') return 'character';
  if (o.kind === 'boss') return 'combat';
  if (o.kind === 'death') return 'combat';
  return 'overview';
};
/* Menu counts describe current decisions, never unread history. */
DQ.actionCount = page => {
  const s = DQ.S, D = DQ.data;
  if (page === 'activity') return (s.inbox || []).length;
  if (page === 'quests') return D.QUESTS.filter(q => ['new', 'ready'].includes(DQ.questState(q))).length;
  if (page === 'projects') return Object.entries(D.PROJECTS || {}).filter(([id, p]) => p.town === s.town && !s.projects[id] && DQ.canAfford(p.cost)).length;
  if (page === 'farming' && DQ.skillUnlocked('farming')) return s.farm.plots.filter(DQ.plotRipe).length + s.farm.animals.filter(a => a.stored > 0).length;
  if (page === 'research' && DQ.advLvl() >= D.RESEARCH_ADV && DQ.researchSlots) {
    const free = DQ.researchSlots() - (s.research?.active || []).length;
    return Math.max(0, Math.min(free, D.TECHS.filter(t => !DQ.techReason(t) && DQ.techCanAfford(t)).length));
  }
  return 0;
};
DQ.noticeCount = pages => [...new Set(Array.isArray(pages) ? pages : [pages])].reduce((n, page) => n + DQ.actionCount(page), 0);
DQ.markNoticesRead = page => {
  // Discard legacy unread badges; actions remain visible until resolved.
  if (DQ.S.noticeBadges) delete DQ.S.noticeBadges[page];
  $$('.note', notesEl).filter(el => el.dataset.page === page && !['unlock','level','adv'].includes(el.dataset.kind)).forEach(dismiss);
};
const logNote = o => { DQ.noteLog.unshift({ t: Date.now(), o, silent: false }); if (DQ.noteLog.length > 40) DQ.noteLog.pop(); };
const markSilent = (o, count) => { const e = DQ.noteLog.find(x => x.o === o); if (e) { e.silent = true; if (count) DQ.noteMissed++; } };
const showSkillUnlock=o=>false; /* Skill unlocks use the prominent bottom card; they never cover play. */
const levelQueue=[];let levelRetry=0;
const pumpLevel=()=>{clearTimeout(levelRetry);if(!levelQueue.length)return;if(modalEl){levelRetry=setTimeout(pumpLevel,300);return;}showLevelReveal(levelQueue.shift());};
/* the painted star, re-centred on its own centre of mass (its source crop carries stray edge pixels that pull it off-centre) */
let starUrl=null;
const centredStar=()=>{
  if(!starUrl&&DQ.pixelArt){starUrl=DQ.pixelArt.iconUrl('star');}if(starUrl)return `<img class="lr-star-img pxa" src="${starUrl}" width="96" height="96" alt="" draggable="false">`;if(!starUrl){const raw=null;if(!raw)return '';
    try{const W=raw.width,H=raw.height,a=raw.getContext('2d').getImageData(0,0,W,H).data;let n=0,sx=0,sy=0;
      for(let y=0;y<H;y++)for(let x=0;x<W;x++)if(a[(y*W+x)*4+3]>128){n++;sx+=x;sy+=y;}
      const cx=sx/n,cy=sy/n;let R=0;for(let y=0;y<H;y++)for(let x=0;x<W;x++)if(a[(y*W+x)*4+3]>128){const d=Math.hypot(x-cx,y-cy);if(d>R&&d<Math.min(W,H)*.62)R=d;}
      const S=256,c=document.createElement('canvas');c.width=c.height=S;const k=(S/2*.94)/R,x=c.getContext('2d');x.imageSmoothingQuality='high';
      /* only the star itself: clip to its radius so stray edge pixels never show */
      x.beginPath();x.arc(S/2,S/2,S/2,0,Math.PI*2);x.clip();x.drawImage(raw,S/2-cx*k,S/2-cy*k,W*k,H*k);starUrl=c.toDataURL();}catch(e){return '';}}
  return `<img class="lr-star-img" src="${starUrl}" width="104" height="104" alt="" draggable="false">`;
};
const showLevelReveal=o=>{
  if(modalEl){levelQueue.push(o);pumpLevel();return true;}
  const sk=o.skill&&DQ.data.SK[o.skill],hero=o.kind==='adv',name=hero?'Hero':(sk?.name||'Skill'),level=o.to||String(o.title||'').match(/\d+/)?.[0]||'';
  const art=hero?`<span class="level-star">${centredStar()||ico('star')}</span>`:DQ.artImage('skill',o.skill,112,'',name);
  DQ.modal({title:`${name} level up`,wide:true,sticky:true,body:`<div class="level-reveal lr-v2" style="--c:${o.col||'#d8a64a'}"><div class="lr-stage"><span class="lr-glow" aria-hidden="true"></span><span class="lr-ripple" aria-hidden="true"></span><span class="lr-ripple r2" aria-hidden="true"></span><span class="lr-ripple r3" aria-hidden="true"></span><span class="lr-rays" aria-hidden="true"></span><div class="level-emblem">${art}</div></div><span class="lr-ribbon">Level up</span><h2>${esc(name)} <b>${esc(level)}</b></h2><p>${esc(o.text||'Your training has paid off.')}</p></div>`,actions:[{label:'Continue',primary:true,fn:()=>{DQ.closeModal();setTimeout(pumpLevel,180);}}]});
  DQ.sfx(o.sound||'level');setTimeout(()=>DQ.burstEl(document.querySelector('.level-emblem'),o.col||'#d8a64a',38),100);return true;
};
DQ.notify = o => {
  if (DQ.sim.on) { DQ.sim.notes.push(o); return; }
  if (o.kind === 'level') {
    const previous = queue.find(n => n.key === o.key) || $$('.note', notesEl).find(n => n.dataset.key === o.key)?._notification;
    if (previous?.kind === 'level' && Number.isFinite(previous.from) && previous.to <= o.to) {
      o = { ...o, from: previous.from, unlocks: [...new Set([...(previous.unlocks || []), ...(o.unlocks || [])])] };
      o.title = `${DQ.data.SK[o.skill]?.name || 'Skill'} levels ${o.from + 1}–${o.to}!`;
      if (o.unlocks.length) o.text = o.unlocks.join(' ');
    }
  }
  const s = DQ.S.settings; logNote(o);
  if(o.kind==='unlock'){
    const id=(o.key||'').startsWith('unlock:')?o.key.slice(7):(o.key||'').startsWith('feature:')?o.key.slice(8):null;
    if(id){DQ.S.seen['tutorial:'+id]=true;if(DQ.S.tut?.done)delete DQ.S.tut.done['lesson:'+id];}
  }
  if(o.kind==='unlock'&&(o.key||'').startsWith('unlock:')&&showSkillUnlock(o))return;
  /* Skill levels use compact bottom cards; only the overall Hero level takes over. */
  if(o.kind==='adv'&&showLevelReveal(o))return;
  if (DQ.ui && DQ.ui.view === DQ.notificationPage(o) && !['unlock','level','adv'].includes(o.kind)) {
    markSilent(o, false);
    if (DQ.notificationTier(o) === 'now') {
      DQ.ui.pageNotice = { page: DQ.notificationPage(o), title: String(o.title || ''), text: String(o.text || '') };
      if (DQ.ui.renderPageNotice) DQ.ui.renderPageNotice();
    }
    return;
  }
  if (!s.notify && !o.force && o.kind!=='unlock') { markSilent(o, false); return; }
  const tier = DQ.notificationTier(o);
  if (tier === 'quiet') { markSilent(o, true); return; }
  if (o.key) { $$('.note', notesEl).filter(n => n.dataset.key === o.key).forEach(n => n.remove()); const i = queue.findIndex(q => q.key === o.key); if (i >= 0) queue.splice(i, 1); }
  if (document.hidden || DQ.holdNotes || nowLive() >= MAX_NOW) { queue.push(o); return; }
  showNote(o);
};
/* Cards wait behind the welcome-back summary, then follow it one at a time. */
function pump() { if (document.hidden || DQ.holdNotes) return; while (queue.length && nowLive() < MAX_NOW) showNote(queue.shift()); }

const trunc = (t, n) => { t = String(t || '').replace(/<[^>]+>/g, ''); return t.length > n ? t.slice(0, n - 1).trimEnd() + '…' : t; };
/* The bell keeps routine information; actionable alerts appear in context. */
const ago = t => { const s = Math.round((Date.now() - t) / 1000); return s < 60 ? 'just now' : s < 3600 ? `${Math.round(s / 60)} min ago` : `${Math.round(s / 3600)} h ago`; };
DQ.openBell = () => {
  DQ.noteMissed = 0; const L = DQ.noteLog.filter(e => DQ.notificationTier(e.o) === 'quiet').slice(0, 25);
  const body = L.length ? `<div class="bell-list">${L.map((e, i) => { const o = e.o, a = inferActions(o)[0]; return `<div class="bell-row ${e.silent ? 'quiet' : ''}" style="--c:${o.col || '#d8a64a'}"><span class="n-ic">${ico(o.icon || 'star')}</span><div class="bell-t"><b>${esc(o.title)}</b>${o.text ? `<span>${esc(trunc(o.text, 140))}</span>` : ''}<small>${ago(e.t)}</small></div>${a ? `<button class="btn sm" data-i="${i}">${esc(a.label)}</button>` : ''}</div>`; }).join('')}</div>` : '<p class="dim" style="margin:0">Nothing yet. Routine progress and finds will be listed here.</p>';
  DQ.modal({ title: 'Recent activity', wide: true, body, actions: [{ label: 'Close', primary: true }] });
  $$('.bell-row .btn').forEach(b => b.onclick = () => { const e = L[+b.dataset.i], a = e && inferActions(e.o)[0]; DQ.closeModal(); a && a.fn && a.fn(); });
};
/* Every notification gets somewhere to go. Explicit actions win; otherwise infer from what it is about. */
const go = (page, extra) => () => { if (extra) extra(); DQ.go(page); };
function inferActions(o) {
  if (o.actions) return o.actions; if (o.action) return [o.action];
  const k = o.key || '', D = DQ.data, txt = (o.text || '') + ' ' + o.title;
  const skillPage = sk => D.SK[sk] ? D.SK[sk].page : 'overview';
  if (k.startsWith('unlock:')) return [{ label: `Open ${D.SK[k.slice(7)]?.name || 'skill'}`, fn: go(skillPage(k.slice(7))) }];
  if (k.startsWith('lvl:') || k.startsWith('perk:')) { const sk = k.startsWith('lvl:') ? k.slice(4) : Object.keys(D.SK).find(s => k.startsWith('perk:' + s)); return [{ label: `Open ${D.SK[sk] ? D.SK[sk].name : 'skill'}`, fn: go(skillPage(sk)) }]; }
  if (k === 'adv') return [{ label: 'See your skills', fn: go('skillsummary') }];
  if (k.startsWith('ach')) return [{ label: 'View achievements', fn: go('achievements') }];
  if (k.startsWith('qd:') || k.startsWith('qr') || k.startsWith('q')) return [{ label: 'Open quests', fn: go('quests') }];
  if (k === 'death') return [{ label: 'Check gear', fn: go('character') }, { label: 'Combat page', fn: go('combat') }];
  if (k === 'stopped') {
    if (/arrow|rune/i.test(txt)) return [{ label: 'Go to shop', fn: go('shop') }, { label: 'Plan', fn: () => DQ.ui.openPlan() }];
    if (/food|health/i.test(txt)) return [{ label: 'Cook food', fn: go('cooking') }, { label: 'Shop', fn: go('shop') }];
    if (/material|transmute/i.test(txt)) return [{ label: 'Open bank', fn: go('bank') }, { label: 'Shop', fn: go('shop') }];
    return [{ label: 'Open plan', fn: () => DQ.ui.openPlan() }];
  }
  if (k.startsWith('rare:') || k.startsWith('drop:') || k.startsWith('discovery:') || k === 'chest' || k.startsWith('pet:')) { const id = k.split(':')[1], it = id && D.ITEMS[id]; if (!it) return [{ label: 'Open inventory', fn: go('character') }]; return [{ label: it.slot ? 'See it and equip' : 'See it', fn: () => DQ.ui.showItem(id) }]; }
  if (k === 'overflow') return [{ label: 'Open bank', fn: go('bank') }, { label: 'Backpack', fn: go('character') }];
  if (k === 'taskdone' || k === 'qnext' || k === 'qskip' || k === 'offline') return [{ label: 'Open plan', fn: () => DQ.ui.openPlan() }];
  if (k.startsWith('beast:') || k === 'bond') return [{ label: 'Open bestiary', fn: go('bestiary', () => { DQ.ui.beastTab = k === 'bond' ? 'pets' : 'monsters'; }) }];
  if (k === 'house' || k.startsWith('furn:')) return [{ label: 'Open house', fn: go('house') }];
  if (k.startsWith('w:') || k === 'unpaid') return [{ label: 'Open workers', fn: go('hirelings') }];
  if (k.startsWith('boss:')) return [{ label: 'Open map', fn: go('map') }];
  return [{ label: 'Open Home', fn: go('overview') }];
}
function showNote(o) {
  if (!notesEl) return; /* no notification area yet (before start-up, or headless tests) */
  if (DQ.ui && DQ.ui.view === DQ.notificationPage(o) && !['unlock','level','adv'].includes(o.kind)) return;
  const acts = inferActions(o);
  const el = document.createElement('div'); el.className = 'note ' + (o.kind || ''); el.style.setProperty('--c', o.col || '#d8a64a'); if (o.key) el.dataset.key = o.key;
  el.setAttribute('role', 'status'); el.dataset.page = DQ.notificationPage(o); el.dataset.kind = o.kind || ''; el._notification = o;
  el.innerHTML = `<span class="n-ic">${ico(o.icon || 'star')}</span><div class="n-b"><b>${esc(o.title)}</b>${o.text ? `<span>${esc(o.text)}</span>` : ''}${acts.length ? `<span class="n-acts">${acts.map((a, i) => `<button class="n-act" data-i="${i}">${esc(a.label)}</button>`).join('')}</span>` : ''}</div><button class="n-x" aria-label="Dismiss">${ico('close')}</button><i class="n-t"></i>`;
  notesEl.appendChild(el);
  const ttl = o.ttl || 7500; let timer, left = ttl, started = performance.now();
  const bar = $('.n-t', el); bar.style.animationDuration = ttl + 'ms'; bar.style.animationPlayState = 'paused';
  const arm = () => { if (timer || document.hidden || el.contains(document.activeElement) || el.matches(':hover')) return; started = performance.now(); timer = setTimeout(() => dismiss(el), left); bar.style.animationPlayState = 'running'; };
  const pause = () => { if (timer) { clearTimeout(timer); timer = null; left = Math.max(0, left - (performance.now() - started)); } bar.style.animationPlayState = 'paused'; };
  el._pauseNote = pause; el._resumeNote = arm;
  el.addEventListener('mouseenter', pause); el.addEventListener('mouseleave', arm);
  el.addEventListener('focusin', pause); el.addEventListener('focusout', () => setTimeout(arm, 0)); arm();
  $('.n-x', el).onclick = () => dismiss(el);
  $$('.n-act', el).forEach(b => b.onclick = () => { dismiss(el); acts[+b.dataset.i].fn(); });
  if (o.sound !== false) DQ.sfx(o.sound || 'notify');
  if (o.burst) setTimeout(() => DQ.burstEl($('.n-ic', el), o.col || '#d8a64a', 22), 120);
  return el;
}
document.addEventListener('visibilitychange', () => {
  live().forEach(el => document.hidden ? el._pauseNote?.() : el._resumeNote?.());
  if (!document.hidden) pump();
});
function dismiss(el) { if (!el || el.classList.contains('out')) return; el.classList.add('out'); setTimeout(() => { el.remove(); pump(); }, 320); }

/* ---------- modal ---------- */
let modalEl = null, modalTrigger = null;
const inertBefore = new Map();
DQ.closeModal = () => {
  if (!modalEl) return;
  modalEl.remove(); modalEl = null;
  for (const [el, inert] of inertBefore) el.inert = inert;
  inertBefore.clear();
  if (modalTrigger && modalTrigger.isConnected) modalTrigger.focus();
  if (DQ.holdNotes) { DQ.holdNotes = false; setTimeout(pump, 250); }
};
DQ.modal = o => {
  DQ.closeModal(); modalTrigger = document.activeElement;
  const m = document.createElement('div'); m.className = 'modal';
  m.setAttribute('role', 'dialog'); m.setAttribute('aria-modal', 'true');
  m.setAttribute('aria-labelledby', 'active-dialog-title'); m.dataset.sticky = o.sticky ? 'true' : 'false';
  m.innerHTML = `<div class="m-card ${o.wide ? 'wide' : ''}"><h2 id="active-dialog-title">${esc(o.title)}</h2><div class="m-body">${o.body || ''}</div><div class="m-act">${(o.actions || [{ label: 'Close' }]).map((a, i) => `<button class="btn ${a.primary ? 'primary' : ''}" data-i="${i}">${esc(a.label)}</button>`).join('')}</div></div>`;
  for (const el of document.body.children) { inertBefore.set(el, el.inert); el.inert = true; }
  document.body.appendChild(m); modalEl = m;
  $$('.m-act .btn', m).forEach(b => b.onclick = () => {
    const a = (o.actions || [{}])[+b.dataset.i];
    if (a.fn && a.fn(m) === false) return;
    if (modalEl === m) DQ.closeModal();
  });
  m.addEventListener('pointerdown', e => { if (e.target === m && !o.sticky) DQ.closeModal(); });
  const f = $('.btn.primary', m) || $('.btn', m); if (f) f.focus();
  return m;
};
addEventListener('keydown', e => {
  if (!modalEl) return;
  if (e.key === 'Escape' && modalEl.dataset.sticky !== 'true') { e.preventDefault(); DQ.closeModal(); }
  if (e.key !== 'Tab') return;
  const controls = [...modalEl.querySelectorAll('button, input, select, textarea, a[href], [tabindex="0"]')].filter(el => !el.disabled && el.offsetParent);
  const first = controls[0], last = controls[controls.length - 1];
  if (!first) { e.preventDefault(); return; }
  if (e.shiftKey && (document.activeElement === first || !modalEl.contains(document.activeElement))) { e.preventDefault(); last.focus(); }
  else if (!e.shiftKey && (document.activeElement === last || !modalEl.contains(document.activeElement))) { e.preventDefault(); first.focus(); }
});

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
