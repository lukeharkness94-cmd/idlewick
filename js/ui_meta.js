/* Idlewick: screens for the long game and the testing tools.
   Time panel, "coming soon" teaser pages for locked systems, the Mastery page, the playtest report. */
(() => {
const DQ = window.DQ, D = DQ.data, UI = DQ.ui, { $, $$, ico, fmt, esc } = DQ;
const S = () => DQ.S;
const hm = ms => { const s = Math.floor(Math.max(0, ms) / 1000), h = Math.floor(s / 3600), m = Math.floor(s % 3600 / 60); return h ? `${h}h ${String(m).padStart(2, '0')}m` : m ? `${m}m ${String(s % 60).padStart(2, '0')}s` : `${s}s`; };

/* ---------- Time: in game, away, total ---------- */
UI.B.tm = (e, k) => {
  const t = DQ.timeStats();
  const v = { play: hm(t.play), sess: hm(t.sess), away: hm(t.away), eff: hm(t.awayEff), total: hm(t.total), pct: `${Math.round(t.playPct * 100)}% in game · ${Math.round(t.awayPct * 100)}% away`, sessions: t.sessions }[k];
  if (k === 'pbar') e.style.width = (t.playPct * 100).toFixed(1) + '%'; else if (k === 'abar') e.style.width = (t.awayPct * 100).toFixed(1) + '%'; else UI.set(e, v);
};
UI.timePanel = () => `<section class="panel timep"><div class="phead"><h2>Time</h2><small>Playing and away</small></div>
  <div class="tm-grid"><div class="tm-c"><span class="k">In game</span><b class="mono tm-big" data-b="tm:play"></b><small>This session <span class="mono" data-b="tm:sess"></span></small></div>
  <div class="tm-c away"><span class="k">Away from the game</span><b class="mono tm-big" data-b="tm:away"></b><small>Counted as <span class="mono" data-b="tm:eff"></span> of work</small></div>
  <div class="tm-c"><span class="k">Total</span><b class="mono tm-big" data-b="tm:total"></b><small data-b="tm:pct"></small></div></div>
  <div class="tm-bar" aria-hidden="true"><i class="p" data-b="tm:pbar"></i><i class="a" data-b="tm:abar"></i></div></section>`;

/* ---------- Teaser pages: see what is coming, and how far away it is ---------- */
const heroEta = adv => { const rate = D.SKILLS.reduce((a, s) => a + DQ.xpRate(s.id), 0), need = D.advReq(adv) - DQ.totalXp(); return rate > 0 && need > 0 ? `About ${DQ.fmtTime(need / rate)} at your current pace.` : ''; };
UI.teaser = o => `<section class="panel locked-page teaser fancy" style="--c:${o.col || '#d8a64a'}"><div class="big">${ico(o.ic)}</div>
  <span class="k">Coming at Hero level ${o.adv}</span><h2>${o.title}</h2><p>${o.blurb}</p>
  <ul class="tz-list">${o.bullets.map(b => `<li>${ico('star')}<span>${b}</span></li>`).join('')}</ul>
  <div class="tz-prog"><div class="tz-row"><span>You are Hero level <b class="mono" data-b="adv"></b></span><span class="mono">${o.adv} needed</span></div><span class="bar"><i style="width:${Math.min(100, DQ.totalXp() / Math.max(1, D.advReq(o.adv)) * 100).toFixed(1)}%"></i></span><small class="dim">${heroEta(o.adv) || 'Every task you do earns Hero experience.'}</small></div>
  <div class="quick"><button class="btn primary" data-do="go" data-a="overview">${ico('arrow')}See what to do next</button></div></section>`;
const TEASERS = {
  house: () => ({ ic: 'house', title: 'Your own house', adv: D.HOUSE.adv, col: '#d8a64a', blurb: `Buy ${D.HOUSE.where} and make it yours.`, bullets: ['Buy rooms and furnish them with logs, bars and coins', 'Furniture gives permanent bonuses: more XP, faster crops, health regeneration', 'A storage chest adds backpack slots, and trophies show off your boss kills'] }),
  hirelings: () => ({ ic: 'users', title: 'Workers', adv: D.HIRE.adv, col: '#8fc7ff', blurb: 'Hire people who work for you, even while you are away.', bullets: ['Fishers, woodcutters, miners and farmhands', 'They level up as they work and send you their haul', 'Look after them and they work harder. Ignore them and they sulk'] })
};
['house', 'hirelings'].forEach(k => {
  const orig = UI.V[k], need = () => k === 'house' ? D.HOUSE.adv : D.HIRE.adv;
  UI.V[k] = () => DQ.advLvl() < need() ? UI.teaser(TEASERS[k]()) : orig();
});
/* planning (pace, stop rules, the queue) arrives at Hero level 5 */
const origPlan = UI.planHtml;
UI.planHtml = () => DQ.planUnlocked() ? origPlan() : UI.teaser({ ic: 'clock', title: 'Task planning', adv: D.PLAN_ADV, col: '#8fc7ff', blurb: 'Tell your hero how to work, and what to do next.', bullets: ['Pace: careful, steady or pushing hard', 'Stop rules: for 30 minutes, until 200 done, until the next level', 'A queue, so the next task starts by itself, even while you are away'] });

/* tabs: lock chip while locked, "New" until visited */
UI.tabState = p => {
  const need = p === 'house' ? D.HOUSE.adv : p === 'hirelings' ? D.HIRE.adv : 0;
  if (!need) return null;
  if (DQ.advLvl() < need) return { lock: need };
  return S().seenTabs && S().seenTabs[p] ? null : { fresh: true };
};
const prev = UI.render;
UI.render = fresh => {
  prev(fresh);
  if (!DQ.planUnlocked()) $$('.qadd').forEach(n => n.remove());
  const st = S(); st.seenTabs = st.seenTabs || {};
  if (DQ.advLvl() >= (UI.view === 'house' ? D.HOUSE.adv : UI.view === 'hirelings' ? D.HIRE.adv : 1e9)) st.seenTabs[UI.view] = 1;
};
/* one friendly notice the first time planning is available */
DQ.on('ui', () => {
  const st = S(); if (!DQ.started || !st || !st.seenTabs || st.seenTabs.plan || !DQ.planUnlocked()) return;
  st.seenTabs.plan = 1;
  DQ.notify({ kind: 'unlock', key: 'plan', icon: 'clock', col: '#8fc7ff', title: 'Task planning unlocked', text: 'Choose a pace, set stop rules and queue the next task. Tap the task bar at the top, or the arrow on any card.', action: { label: 'Open plan', fn: () => UI.openPlan() }, sound: 'unlock', ttl: 14000 });
});


/* ---------- Top bar task details and quest cues ---------- */
const sumRate = () => D.SKILLS.reduce((a, x) => a + DQ.xpRate(x.id), 0);
const DONE_WORD = { fish: 'caught', wood: 'chopped', mine: 'mined', thieve: 'stolen', recipe: 'made', fight: 'defeated' };
const HUDB = {
  eta: e => { const a = DQ.act, sk = a && DQ.actSkill(); let t = ''; if (sk && DQ.lvl(sk) < 99) { const r = DQ.xpRate(sk), need = D.XPF[DQ.lvl(sk) + 1] - S().xp[sk]; if (r > 0 && need > 0) t = `Lv ${DQ.lvl(sk) + 1} in ${DQ.fmtTime(need / r)}`; } UI.set(e, t); e.hidden = !t; },
  rate: e => { const r = sumRate() * 3600000; UI.set(e, r > 0 ? `${fmt(r)} XP/hr` : ''); e.hidden = !(r > 0); },
  count: e => { const a = DQ.act; UI.set(e, a ? `${fmt(a.count || 0)} ${DONE_WORD[a.kind] || 'done'}` : ''); },
};
UI.B.hud = (e, k) => HUDB[k] && HUDB[k](e);
Object.assign(UI.B, {
  hudq: e => {
    const a = DQ.act, L = a ? DQ.questLinks(a.kind, a.id) : []; e.hidden = !L.length; if (!L.length) { e._p = ''; return; }
    const f = L[0], t = `\u2605 ${f.q.name} ${f.pr}/${f.o.n}${L.length > 1 ? ` +${L.length - 1}` : ''}`;
    UI.set(e, t); e.dataset.tip = `text:Quest: ${f.q.name}. ${f.o.label}`;
    if (e._p && e._p !== t) { e.classList.remove('bump'); void e.offsetWidth; e.classList.add('bump'); } e._p = t;
  },
  qlink: (e, kind, id) => {
    const L = DQ.questLinks(kind, id); e.hidden = !L.length; if (!L.length) return;
    const f = L[0]; UI.set(e, `\u2605 Quest: ${f.q.name} ${f.pr}/${f.o.n}${L.length > 1 ? ` +${L.length - 1}` : ''}`);
  }
});
const prevR = UI.render;
UI.render = fresh => {
  prevR(fresh);
  $$('#view .card[data-do="act"]').forEach(c => { const m = c.querySelector('.meta'); if (m && !m.querySelector('.qline')) m.insertAdjacentHTML('beforeend', `<small class="qline" data-b="qlink:${c.dataset.a}:${c.dataset.b}" hidden></small>`); });
  UI.upd();
};


/* ---------- The hero, as others would see them ---------- */
const CAPE_NAMES = ['', 'plain', 'trimmed', 'golden'];
DQ.heroMarks = () => {
  const L = DQ.heroLook(S().look || {}), out = [];
  if (L.cape) out.push({ ic: L.topSkill.id, t: `${D.SK[L.topSkill.id].name} cape`, sub: `${CAPE_NAMES[L.cape.level]} · ${D.SK[L.topSkill.id].name} ${L.topSkill.l}` });
  const hl = DQ.advLvl(); if (hl >= 10) out.push({ ic: 'star', t: `${hl >= 75 ? 'Gem' : hl >= 50 ? 'Gold' : hl >= 25 ? 'Silver' : 'Bronze'} medal`, sub: `Hero level ${hl}` });
  if (L.aura) out.push({ ic: 'trophy', t: 'Mastery glow', sub: `${DQ.masteryTotal()} mastery rank${DQ.masteryTotal() > 1 ? 's' : ''}` });
  return out;
};
UI.heroFigure = () => {
  const pet = S().pets.active && D.PET[S().pets.active];
  return `<div class="figure"><div class="fig-stage"><img class="fig-img" src="${DQ.heroFigureUrl(S().look)}" alt="Your hero, wearing what you have equipped" draggable="false">${pet ? `<span class="fig-pet" data-tip="text:${esc(pet.name)} the ${esc(pet.kind.toLowerCase())}">${DQ.petSprite(pet, 48)}</span>` : ''}</div></div>`;
};

/* ---------- Share sheet: a hero card as an image, or as text ---------- */
const loadImg = src => new Promise(res => { const i = new Image(); i.onload = () => res(i); i.onerror = () => res(null); i.src = src; });
const rr = (c, x, y, w, h, r) => { c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath(); };
DQ.heroCardText = () => {
  const st = S(), t = DQ.timeStats(), top = D.SKILLS.filter(x => DQ.skillUnlocked(x.id)).sort((a, b) => DQ.lvl(b.id) - DQ.lvl(a.id)).slice(0, 3);
  return `${st.name}${DQ.heroTitle() ? `, ${DQ.heroTitle()}` : ''} · Hero level ${DQ.advLvl()} · Combat ${DQ.combatLvl()} · Total level ${DQ.totalLvl()}\nTop skills: ${top.map(x => `${x.name} ${DQ.lvl(x.id)}`).join(', ')}\nBosses beaten: ${Object.values(st.towns).filter(x => x.boss).length} · Quests: ${D.QUESTS.filter(q => DQ.questState(q) === 'done').length}/${D.QUESTS.length} · Played ${hm(t.play)}\nPlaying Idlewick`;
};
DQ.heroCard = async () => {
  const st = S(), W = 720, Hh = 420, cv = document.createElement('canvas'); cv.width = W; cv.height = Hh; const c = cv.getContext('2d');
  const cs = getComputedStyle(document.documentElement), disp = (cs.getPropertyValue('--f-display') || 'serif').trim(), body = (cs.getPropertyValue('--f-body') || 'sans-serif').trim(), mono = (cs.getPropertyValue('--f-mono') || 'monospace').trim();
  try { await Promise.all([document.fonts.load(`700 30px ${disp}`), document.fonts.load(`600 16px ${body}`), document.fonts.load(`600 16px ${mono}`)]); } catch (e) {}
  /* parchment-at-night background, always dark so the card looks the same for everyone */
  const g = c.createLinearGradient(0, 0, W, Hh); g.addColorStop(0, '#1d2a31'); g.addColorStop(1, '#0d1215'); c.fillStyle = g; rr(c, 0, 0, W, Hh, 22); c.fill();
  c.strokeStyle = '#d8a64a'; c.lineWidth = 3; rr(c, 6, 6, W - 12, Hh - 12, 18); c.stroke(); c.strokeStyle = '#8a6a2e'; c.lineWidth = 1; rr(c, 12, 12, W - 24, Hh - 24, 14); c.stroke();
  for (let i = 0; i < 40; i++) { c.fillStyle = `rgba(243,213,138,${.05 + (i % 5) * .03})`; c.fillRect((i * 97) % W, (i * 53) % 150, 2, 2); }
  /* stage and figure */
  c.fillStyle = 'rgba(0,0,0,.35)'; c.beginPath(); c.ellipse(165, 350, 92, 13, 0, 0, 7); c.fill();
  c.imageSmoothingEnabled = false; c.drawImage(DQ.heroCanvas(st.look, 8), 69, 82);
  const pet = st.pets.active && D.PET[st.pets.active]; if (pet) { const im = await loadImg(DQ.spr24Url(pet.id)); if (im) c.drawImage(im, 245, 288, 72, 72); }
  /* name and level */
  c.textBaseline = 'alphabetic'; c.fillStyle = '#f3d58a'; c.font = `700 36px ${disp}`; c.fillText(st.name, 350, 78);
  c.fillStyle = '#93a3a1'; c.font = `600 16px ${body}`; const sub = DQ.heroTitle() || `${D.TOWN[st.town].name} adventurer`; c.fillText(sub, 352, 102);
  /* three big numbers */
  [['HERO LEVEL', DQ.advLvl()], ['COMBAT', DQ.combatLvl()], ['TOTAL LEVEL', DQ.totalLvl()]].forEach(([k, v], i) => { const x = 350 + i * 118; c.fillStyle = '#141c21'; rr(c, x, 120, 108, 62, 10); c.fill(); c.strokeStyle = '#364a52'; c.lineWidth = 1; rr(c, x, 120, 108, 62, 10); c.stroke(); c.fillStyle = '#93a3a1'; c.font = `700 11px ${body}`; c.fillText(k, x + 10, 140); c.fillStyle = '#e9e4d5'; c.font = `700 28px ${mono}`; c.fillText(String(v), x + 10, 170); });
  /* top skills */
  const top = D.SKILLS.filter(x => DQ.skillUnlocked(x.id)).sort((a, b) => DQ.lvl(b.id) - DQ.lvl(a.id) || (st.xp[b.id] - st.xp[a.id])).slice(0, 4);
  c.fillStyle = '#93a3a1'; c.font = `700 11px ${body}`; c.fillText('TOP SKILLS', 350, 212);
  top.forEach((s, i) => { const y = 226 + i * 26, L = DQ.lvl(s.id); c.fillStyle = '#e9e4d5'; c.font = `600 15px ${body}`; c.fillText(s.name, 350, y + 14); c.fillStyle = '#0a0f12'; rr(c, 470, y + 4, 150, 10, 5); c.fill(); c.fillStyle = s.col; rr(c, 470, y + 4, Math.max(8, 150 * L / 99), 10, 5); c.fill(); c.fillStyle = '#e9e4d5'; c.font = `700 14px ${mono}`; c.fillText(String(L), 632, y + 14); });
  /* gear and marks */
  const eq = ['head', 'body', 'legs', 'weapon', 'shield', 'amulet'].filter(s => st.equip[s]).map(s => D.ITEMS[st.equip[s]].name);
  c.fillStyle = '#93a3a1'; c.font = `700 11px ${body}`; c.fillText('WEARING', 350, 342);
  c.fillStyle = '#e9e4d5'; c.font = `600 14px ${body}`; const txt = eq.length ? eq.join(' · ') : 'A plain tunic'; wrap(c, txt, 350, 360, 330, 18, 2);
  const marks = DQ.heroMarks(); if (marks.length) { c.fillStyle = '#d8a64a'; c.font = `700 13px ${body}`; c.fillText(marks.map(m => m.t).join('  ·  '), 350, 400); }
  /* footer */
  c.fillStyle = '#8a6a2e'; c.font = `700 14px ${disp}`; c.fillText('IDLEWICK', 34, 400); c.fillStyle = '#93a3a1'; c.font = `600 12px ${body}`; c.fillText(`${hm(DQ.timeStats().play)} played`, 34, 384);
  return cv;
};
function wrap(c, text, x, y, mw, lh, maxLines) {
  const words = text.split(' '); let line = '', n = 0;
  for (const w of words) { const t = line ? line + ' ' + w : w; if (c.measureText(t).width > mw && line) { c.fillText(line, x, y + n * lh); line = w; if (++n >= maxLines) return; } else line = t; }
  if (line) c.fillText(line, x, y + n * lh);
}
const toBlob = cv => new Promise(res => cv.toBlob(res, 'image/png'));
Object.assign(UI.DO, {
  share: async () => {
    const cv = await DQ.heroCard(), url = cv.toDataURL('image/png'), txt = DQ.heroCardText();
    DQ.modal({ title: 'Share your hero', wide: true, body: `<img class="sharecard" src="${url}" alt="Your hero card">
      <p class="sm dim" style="margin:10px 0 0">Save the picture, copy it, or send it straight from your device. If a button does nothing in your browser, press and hold (or right-click) the card to save it.</p>
      <div class="btnrow wrap" style="margin-top:10px"><button class="btn primary" id="sh-save">Save image</button><button class="btn" id="sh-copy">Copy image</button><button class="btn" id="sh-share" hidden>Share…</button><button class="btn" id="sh-text">Copy as text</button></div>`, actions: [{ label: 'Close' }] });
    const note = (m, bad) => DQ.toast(m, !!bad), blobP = toBlob(cv);
    $('#sh-save').onclick = async () => { try { const b = await blobP, a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = `idlewick-${(S().name || 'hero').toLowerCase().replace(/[^a-z0-9]+/g, '-')}.png`; document.body.appendChild(a); a.click(); a.remove(); note('Saved. Check your downloads.'); } catch (e) { note('Could not save here. Press and hold the card to save it.', true); } };
    $('#sh-copy').onclick = async () => { try { await navigator.clipboard.write([new ClipboardItem({ 'image/png': await blobP })]); note('Image copied'); } catch (e) { note('Could not copy the image here. Try Save, or copy as text.', true); } };
    $('#sh-text').onclick = async () => { try { await navigator.clipboard.writeText(txt); note('Copied as text'); } catch (e) { const t = document.createElement('textarea'); t.value = txt; document.body.appendChild(t); t.select(); let ok = false; try { ok = document.execCommand('copy'); } catch (x) {} t.remove(); note(ok ? 'Copied as text' : 'Could not copy here', !ok); } };
    blobP.then(b => { try { const f = new File([b], 'idlewick-hero.png', { type: 'image/png' }); if (navigator.canShare && navigator.canShare({ files: [f] })) { const s = $('#sh-share'); s.hidden = false; s.onclick = () => navigator.share({ files: [f], title: `${S().name} in Idlewick`, text: txt }).catch(() => {}); } } catch (e) {} });
  }
});
DQ.on('equip', () => {});


/* ---------- Screens put the main job first ----------
   Skill pages: a compact header, then the spots/recipes you came to use, then the "about this skill" guide. */
UI.skillHero = (sk, extra = '') => {
  const s = D.SK[sk], l = DQ.lvl(sk);
  const perks = D.GATHER_SKILLS.includes(sk) ? `<div class="perks"><span class="k">Perks</span>${D.PERKS.map(p => `<span class="perk ${l >= p.lvl ? 'on' : ''}" data-tip="text:${p.name} at ${s.name} ${p.lvl}: ${p.speed ? Math.round(p.speed * 100) + '% faster' : Math.round(p.dbl * 100) + '% chance of double yield'}">${p.lvl}</span>`).join('')}</div>` : '';
  return `<section class="panel skillhero compact" style="--c:${s.col};--sc:${s.col}"><div class="big sm">${ico(sk)}</div>
    <div class="sk-main"><div class="sk-top"><h2>${s.name}</h2><b class="mono sk-lv" data-b="lvl:${sk}"></b><span class="chipx" data-tip="skill:${sk}"><span data-b="bonus:${sk}"></span></span></div>
      <span class="bar big"><i data-b="xpbar:${sk}"></i></span><div class="sh-line mono"><span data-b="toNext:${sk}"></span><span data-b="eta:${sk}"></span></div></div>
    <div class="sk-side">${perks}</div>${extra}</section>`;
};
['fishing', 'woodcutting', 'mining', 'thieving', 'farming', 'cooking', 'smithing', 'crafting', 'magic'].forEach(p => {
  const o = UI.V[p]; if (!o) return;
  UI.V[p] = () => { const h = o(); return h.includes('locked-page') || !UI.skillGuide ? h : h + `<details class="panel guidep" id="${p}-guide"><summary>About ${D.SK[p].name}</summary>${UI.skillGuide(p)}</details>`; };
});

/* ---------- Mastery ---------- */
UI.V.mastery = () => {
  const ranks = DQ.masteryTotal(), title = DQ.heroTitle();
  const skills = D.SKILLS.filter(s => DQ.skillUnlocked(s.id));
  const selected = skills.find(s => s.id === UI.tab.masterySkill) || skills[0];
  const picker = `<label class="page-picker" for="mastery-skill">Skill<select id="mastery-skill" data-in="mastery-skill">${skills.map(s => `<option value="${s.id}" ${s === selected ? 'selected' : ''}>${s.name} · Level ${DQ.lvl(s.id)}</option>`).join('')}</select></label>`;
  const rows = (selected ? [selected] : []).map(s => {
    const L = DQ.lvl(s.id), r = DQ.masteryRank(s.id), xp = S().xp[s.id] || 0;
    if (L < 99) { const pct = Math.min(1, xp / D.XPF[99]); return `<div class="msk locked" style="--c:${s.col}"><span class="ic">${ico(s.id)}</span><div class="mb"><b>${s.name}</b><small>Level ${L}. Mastery begins at 99.</small><span class="bar"><i style="width:${(pct * 100).toFixed(1)}%"></i></span></div><span class="mr mono">${(pct * 100).toFixed(0)}%</span></div>`; }
    const into = DQ.masteryXp(s.id) - r * DQ.masteryStep(), pct = r >= 10 ? 1 : into / DQ.masteryStep(), on = S().title === s.id;
    return `<div class="msk ${r ? 'got' : ''}" style="--c:${s.col}"><span class="ic">${ico(s.id)}</span><div class="mb"><b>${s.name}${r ? ` <em>${D.MASTERY_TITLES[r - 1]}</em>` : ''}</b><small>${r >= 10 ? 'Fully mastered.' : `${fmt(Math.ceil(DQ.masteryStep() - into))} xp to rank ${r + 1}`}</small><span class="bar"><i style="width:${(pct * 100).toFixed(1)}%"></i></span></div><span class="mr mono">Rank ${r}/10</span>${r ? `<button class="btn sm ${on ? 'primary' : ''}" data-do="wear" data-a="${on ? '' : s.id}">${on ? 'Wearing title' : 'Wear title'}</button>` : ''}</div>`;
  }).join('');
  return `<section class="panel"><div class="phead"><h2>Mastery</h2><small>${ranks} ranks earned</small></div>${picker}<div class="mlist">${rows}</div>${title ? `<p>Wearing ${esc(title)}</p>` : ''}<details id="mastery-help"><summary>How mastery works</summary><p>Keep training after level 99 to earn ranks and titles. Each rank adds 1% coins. There are 10 ranks per skill.</p></details></section>`;
};
Object.assign(UI.DO, { wear: a => { DQ.setTitle(a || null); DQ.sfx('tab'); UI.render(false); } });
DQ.on('title', () => UI.renderHud());


/* ---------- Your tools: the best tool you own for each skill ---------- */
UI.toolsPanel = () => {
  const rows = D.TOOLS.map(([k, sk, ic, label]) => {
    const t = DQ.toolTier(sk), own = t ? D.ITEMS[`tool_${k}_${t}`] : null, next = t < 5 ? D.ITEMS[`tool_${k}_${t + 1}`] : null, open = DQ.skillUnlocked(sk), pct = Math.round(D.TOOL_SPEED[t] * 100);
    return `<div class="toolrow ${open ? '' : 'locked'}" style="--c:${D.SK[sk].col}"><span class="ti">${ico(ic)}</span><div class="tb"><b>${own ? own.name : `No ${label.toLowerCase()}`}</b>
      <small>${D.SK[sk].name}${open ? ` ${DQ.lvl(sk)}` : ' (locked)'} · ${t ? `${pct}% faster` : 'normal speed'}</small><span class="pips" aria-label="Tier ${t} of 5">${[1, 2, 3, 4, 5].map(i => `<i class="${i <= t ? 'on' : ''}"></i>`).join('')}</span></div>
      ${next ? `<button class="btn sm" data-do="go" data-a="shop" data-tip="text:${esc(next.name)}: ${fmt(next.buy)} coins. Opens the shop.">Upgrade ${DQ.fmtK ? DQ.fmtK(next.buy) : fmt(next.buy)}</button>` : '<span class="max">Best</span>'}</div>`;
  }).join('');
  return `<details class="panel toolsp" id="inventory-tools"><summary>Gathering tools</summary><p class="hint">Your best owned tool is used automatically.</p><div class="toolrows">${rows}</div></details>`;
};
const origChar = UI.V.character;
UI.V.character = () => { const h = origChar().replace('<div class="slots" id="packgrid">', '<div class="selbar" id="selbar"></div><div class="slots" id="packgrid">'), tail = '</section></div></div>', i = h.lastIndexOf(tail); return i < 0 ? h : h.slice(0, i + 10) + UI.toolsPanel() + h.slice(i + 10); };


/* ---------- Item comparison in the item panel and in tooltips ---------- */
const sg = n => (n > 0 ? '+' : n < 0 ? '\u2212' : '') + Math.abs(n);
const arrow = d => d > 0 ? '\u25B2' : d < 0 ? '\u25BC' : '=';
UI.compareHtml = id => {
  const c = DQ.compareItem(id); if (!c) return '';
  if (c.same) return `<div class="cmp"><span class="k">Currently equipped · ${esc(DQ.SLOT_NAMES[c.slot])}</span></div>`;
  if (c.tool) return c.better ? `<div class="cmp"><span class="k">Compared with ${c.cur ? esc(c.cur.name) : 'no tool'}</span>${c.rows.map(r => `<div class="cmprow up"><span>${r.n}</span><b class="mono">${r.a}% \u2192 ${r.b}%</b><em>\u25B2 ${sg(r.d)}%</em></div>`).join('')}</div>` : `<div class="cmp"><span class="k">You already own a better or equal tool</span></div>`;
  const combat = c.rows.filter(r => r.key && r.d !== 0);
  return `<div class="cmp slot-comparison"><div class="k">${esc(DQ.SLOT_NAMES[c.slot])} · equipped ${c.cur ? esc(c.cur.name) : 'nothing'}</div>
    <table><thead><tr><th>Stat</th><th>Equipped</th><th>This item</th><th>Change</th></tr></thead><tbody>${c.itemRows.map(r => `<tr class="${r.d > 0 ? 'up' : r.d < 0 ? 'down' : ''}"><th>${UI.statNames[r.key]}</th><td>${r.a}</td><td>${r.b}</td><td>${r.d ? sg(r.d) : '—'}</td></tr>`).join('')}</tbody></table>
    ${c.styleChange ? `<p class="sm">Style ${c.styleChange[0]} → ${c.styleChange[1]}</p>` : ''}
    ${combat.length ? `<details><summary>Combat impact</summary>${combat.map(r => `<div class="cmprow"><span>${r.n}</span><b>${r.delta ? '' : r.a + ' → ' + r.b}</b><em>${sg(r.d)}${r.unit || ''}</em></div>`).join('')}</details>` : ''}
    ${c.need.map(n => `<p class="bad sm">${esc(n)}</p>`).join('')}${c.unmet ? `<p class="bad sm">${esc(c.unmet)}</p>` : ''}</div>`;
};
UI.compareLine = id => {
  const c = DQ.compareItem(id); if (!c || c.tool) return '';
  if (c.same) return '<span class="dim">Currently equipped</span>';
  return `<span class="cmpline">vs ${c.cur ? esc(c.cur.name) : `empty ${DQ.SLOT_NAMES[c.slot].toLowerCase()} slot`}: ${c.itemRows.map(r => `<span class="${r.d > 0 ? 'up' : r.d < 0 ? 'down' : ''}">${UI.statNames[r.key]} ${r.d ? sg(r.d) : '±0'}</span>`).join(' · ')}</span>`;
};
const origDetail = UI.detail;
UI.detail = (id, from) => {
  let h = origDetail(id, from); const ok = id && DQ.have(id), c = ok ? UI.compareHtml(id) : '';
  if (c) h = h.replace('<div class="btnrow wrap">', c + '<div class="btnrow wrap">');
  if (ok && D.ITEMS[id].flavour) h = h.replace('<div class="btnrow wrap">', `<p class="flavour">${esc(D.ITEMS[id].flavour)}</p><div class="btnrow wrap">`);
  if (ok) { h = h.replace('<div class="detail">', `<div class="detail"><button class="dt-x iconb sm" data-do="desel" aria-label="Close">${ico('close')}</button>`); if (D.ITEMS[id].slot) h = h.replace(/<\/div>$/, '<small class="dim dt-tip">Tip: double-click (or double-tap) an item to equip it.</small></div>'); }
  return h;
};
const origTip = DQ.tips.item;
DQ.tips.item = id => { const h = origTip(id), it = D.ITEMS[id]; if (!h || !it || !(it.slot || it.type === 'tool') || S().equip[it.slot] === id) return h; const c = (UI.compareLine(id) || '') + (it.slot && DQ.have(id) && DQ.canEquip(id).ok ? '<div class="dim">Double-click to equip</div>' : ''); return c ? h.replace('<div class="dim">Worth', c + '<div class="dim">Worth') : h; };
const tipBase = DQ.tips.item;
DQ.tips.item = id => { const h = tipBase(id), f = D.ITEMS[id] && D.ITEMS[id].flavour; return f && h ? h.replace('<div class="dim">Worth', `<div class="flav">${esc(f)}</div><div class="dim">Worth`) : h; };


/* ---------- Picking an item: double-click or double-tap equips, and the details stay in reach ---------- */
UI.selbarHtml = (id, from) => {
  if (!id || !DQ.have(id)) return `<span class="sb-hint dim">${ico('info')} Select an item to equip, use, sell or bank.</span>`;
  const it = D.ITEMS[id], bank = from === 'bank', n = bank ? (S().bank[id] || 0) : (S().inv[id] || 0), can = it.slot ? DQ.canEquip(id) : null;
  const line = it.slot ? `<span>${UI.statLine(it.b)}</span>${UI.compareLine(id)}` : it.heal ? `<span class="dim">Heals ${it.heal} health</span>` : `<span class="dim">${esc(DQ.cap(it.type))}</span>`;
  const b = [];
  if (it.slot) b.push(`<button class="btn sm ${can.ok ? 'primary' : ''}" data-do="equip" data-a="${id}" ${can.ok ? '' : `data-tip="text:${esc(can.why)}"`}>Equip${can.ok ? '' : ' (locked)'}</button>`);
  if (it.heal) b.push(`<button class="btn sm primary" data-do="eat" data-a="${id}">Eat</button>`);
  b.push(bank ? `<button class="btn sm" data-do="withdraw" data-a="${id}" data-b="${n > 1 ? 'all' : 1}">${n > 1 ? 'Take all' : 'Take'}</button>` : `<button class="btn sm" data-do="deposit" data-a="${id}" data-b="all">Bank</button>`);
  b.push(`<button class="btn sm" data-do="sell" data-a="${id}" data-b="1" data-from="${from}">Sell (${fmt(it.val || 0)} coins)</button>`);
  if (n > 1) b.push(`<button class="btn sm" data-do="sell" data-a="${id}" data-b="all" data-from="${from}">Sell all (${fmt((it.val || 0) * n)} coins)</button>`);
  return `<span class="sb-ic" style="--c:${it.col}">${DQ.itemIco(it)}</span><span class="sb-n"><b style="color:${it.col}">${esc(it.name)}</b> <small class="mono dim">x${fmt(n)}</small><span class="sb-l">${line}</span></span><span class="sb-b">${b.join('')}</span>`;
};
const syncSheet = () => {
  const open = !!(UI.sel && DQ.have(UI.sel) && ['character', 'bank'].includes(UI.view)), d = $('#detailbox'), sb = $('#selbar');
  if (d) d.classList.toggle('empty', !open); document.body.classList.toggle('has-sheet', open);
  if (sb) sb.innerHTML = UI.selbarHtml(open ? UI.sel : null, UI.selFrom);
  /* The item sheet keeps actions in reach without moving the page. */
};
const origSel = UI.DO.sel; let lastTap = { id: null, t: 0 };
UI.DO.sel = (a, b, el) => {
  const now = Date.now(), twice = lastTap.id === a && now - lastTap.t < 450; lastTap = { id: a, t: now };
  origSel(a, b, el); syncSheet();
  if (twice && D.ITEMS[a] && D.ITEMS[a].slot) UI.DO.equip(a);
};
Object.assign(UI.DO, { desel: () => { UI.sel = null; $$('.slot.sel').forEach(e => e.classList.remove('sel')); const d = $('#detailbox'); if (d) d.innerHTML = UI.detail(null); syncSheet(); DQ.sfx('tab'); } });
const prevSel = UI.render;
UI.render = fresh => { prevSel(fresh); if (!['character', 'bank'].includes(UI.view)) UI.sel = null; syncSheet(); };

/* ---------- Playtest report ---------- */
const copyText = async text => { try { await navigator.clipboard.writeText(text); return true; } catch (e) { const t = $('#reptext'); if (t) { t.select(); try { return document.execCommand('copy'); } catch (x) {} } return false; } };
UI.playtestPanel = () => `<section class="panel"><div class="phead"><h2>Playtest</h2><small>For testers</small></div><div class="stack"><p class="sm dim">Testing for a few days? This makes a short summary of how you played: time, levels, what you used and where it felt slow. Send it to the person running the test.</p><div class="btnrow"><button class="btn primary" data-do="report">${ico('book')}Copy playtest report</button></div></div></section>`;
Object.assign(UI.DO, {
  report: () => {
    const text = DQ.playtestReport();
    DQ.modal({ title: 'Playtest report', wide: true, body: `<p class="sm dim">Copy this and send it over. It only contains game numbers, nothing personal.</p><textarea id="reptext" rows="16" readonly style="width:100%;font:12px/1.4 var(--f-mono);background:var(--ground);color:var(--ink);border:1px solid var(--line);border-radius:8px;padding:10px">${esc(text)}</textarea>`, actions: [{ label: 'Copy to clipboard', primary: true, fn: () => { copyText(text).then(ok => DQ.toast(ok ? 'Copied' : 'Select the text and copy it by hand', !ok)); return false; } }, { label: 'Close' }] });
    const t = $('#reptext'); if (t) t.focus();
  }
});
const THEMES = [['dark', 'Dark'], ['light', 'Light'], ['auto', 'Match device']];
UI.themeControl = () => `<div><div class="k" style="margin-bottom:6px">Theme</div><div class="seg">${THEMES.map(([k, n]) => `<button class="${(S().settings.theme || 'dark') === k ? 'on' : ''}" data-do="theme" data-a="${k}">${n}</button>`).join('')}</div><p class="sm dim" style="margin:6px 0 0">Press L to switch between dark and light at any time.</p></div>`;
Object.assign(UI.DO, { theme: a => { if (a === 'toggle') DQ.toggleTheme(); else DQ.setTheme(a); DQ.sfx('tab'); UI.renderHud(); UI.render(false); } });
DQ.on('theme', () => { if (DQ.started) UI.renderHud(); });
addEventListener('keydown', e => { if (e.ctrlKey || e.metaKey || e.altKey || /^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName) || !DQ.started) return; if (e.key.toLowerCase() === 'l') UI.DO.theme('toggle'); });
const origBank = UI.V.bank;
UI.V.bank = () => origBank().replace('<div class="slots big" id="bankgrid">', '<div class="selbar" id="selbar"></div><div class="slots big" id="bankgrid">');
const origSettings = UI.V.settings;
UI.V.settings = () => origSettings().replace(/<\/div>\s*$/, UI.timePanel() + UI.playtestPanel() + '</div>').replace('<label class="nameedit">', UI.themeControl() + '<label class="nameedit">');
/* Settings have one category at a time instead of a wall of controls. */
UI.after.settings = () => {
  const view = $('#view'), panels = [...view.querySelectorAll('section.panel')].filter(panel => panel.querySelector('h2'));
  const names = panels.map(panel => panel.querySelector('h2').textContent);
  const selected = names.includes(UI.tab.settingsPanel) ? UI.tab.settingsPanel : names[0];
  panels.forEach((panel, i) => { panel.hidden = names[i] !== selected; });
  view.insertAdjacentHTML('afterbegin', `<label class="panel page-picker" for="settings-category">Settings<select id="settings-category" data-in="settings-category">${names.map(name => `<option value="${esc(name)}" ${name === selected ? 'selected' : ''}>${esc(name)}</option>`).join('')}</select></label>`);
};
})();
