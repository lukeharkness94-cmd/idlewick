/* Idlewick: UI core. Navigation, HUD, binders, tooltips, portrait, overview, skill pages, combat. */
(() => {
const DQ = window.DQ, D = DQ.data, { $, $$, ico, fmt, fmtK, esc, clamp } = DQ;
const S = () => DQ.S;
const UI = DQ.ui = { view: 'overview', tab: {}, V: {}, after: {}, sel: null, resetArmed: false };
const set = (e, v) => { v = String(v); if (e.textContent !== v) e.textContent = v; };
const itm = (id, n) => { const it = D.ITEMS[id]; return `<span class="itm ${it.rare ? 'rare' : ''}" style="--c:${it.col}" data-tip="item:${id}">${DQ.itemIco(it)}${n ? `<b class="mono">${fmtK(n)}</b>` : ''}</span>`; };
UI.itm = itm; UI.set = set;
UI.money = amount => `<span class="money" role="img" aria-label="${fmt(amount)} coins"><span class="money-icon" aria-hidden="true">${ico('coin')}</span><span aria-hidden="true">${fmt(amount)}</span></span>`;
/* Render existing choice definitions as visible buttons, never native dropdowns.
   The select is parsed in an inert template only; it never enters the page. */
UI.choiceButtons = html => {
  const template = document.createElement('template'); template.innerHTML = html;
  const source = template.content.querySelector('select');
  const kind = source.dataset.in;
  const labels = { page: 'Pages', 'training-focus': 'Training focus', 'eat-threshold': 'Eat below', 'combat-spell': 'Combat spell', qrule: 'Stop rule', qpace: 'Pace', itemfilter: 'Item category' };
  const label = source.getAttribute('aria-label') || labels[kind] || DQ.cap(kind.replace(/-/g, ' '));
  const attrs = [...source.attributes].filter(a => a.name.startsWith('data-')).map(a => `${a.name}="${esc(a.value)}"`).join(' ');
  return `<span class="choice-buttons" role="group" aria-label="${esc(label)}" ${source.id ? `id="${esc(source.id)}"` : ''}>${[...source.options].map(option => {
    const id = option.value, item = D.ITEMS[id];
    const art = item ? DQ.itemIco(item) : kind === 'pet-choice' ? DQ.artImage('creature', id, 40, '', '') : '';
    return `<button type="button" class="choice-button ${option.selected ? 'on' : ''}" data-do="choose" ${attrs} data-b="${esc(id)}" value="${esc(id)}" aria-pressed="${option.selected}" ${source.disabled || option.disabled ? 'disabled' : ''}>${art}<span>${esc(option.textContent)}</span></button>`;
  }).join('')}</span>`;
};
UI.statNames = { atk: 'Atk', str: 'Str', def: 'Def', rng: 'Rng', rngStr: 'Rng Str', mag: 'Mag' };
UI.statLine = b => Object.entries(b || {}).filter(([, v]) => v).map(([k, v]) => `${UI.statNames[k] || k} ${v}`).join(' · ');
UI.rewards = r => [...Object.entries(r.xp || {}).map(([k, v]) => `<span class="rw" style="--c:${D.SK[k].col}">${ico(k)}${fmt(v)} XP</span>`), r.coins ? `<span class="rw" style="--c:#f3d58a">${ico('coin')}${fmt(r.coins)} coins</span>` : '', ...Object.entries(r.items || {}).map(([k, v]) => `<span class="rw" style="--c:${D.ITEMS[k].col}">${ico(D.ITEMS[k].ic)}${v > 1 ? v + '× ' : ''}${D.ITEMS[k].name}</span>`)].join('');
UI.townOf = id => D.TOWN[id];

/* ---------- Live binders ---------- */
const B = UI.B = {
  lvl: (e, a) => set(e, DQ.lvl(a)),
  toNext: (e, a) => set(e, DQ.lvl(a) >= 99 ? 'Maxed' : `${fmt(D.XPF[DQ.lvl(a) + 1] - S().xp[a])} XP to ${DQ.lvl(a) + 1}`),
  xpbar: (e, a) => { const w = DQ.pctNext(a).toFixed(1) + '%'; if (e.style.width !== w) e.style.width = w; },
  xpline: (e, a) => set(e, `${fmt(S().xp[a])} XP`),
  bonus: (e, a) => set(e, `+${Math.round((DQ.xpMult(a) - 1) * 100)}% XP`),
  coins: e => set(e, fmt(S().coins)),
  combat: e => set(e, DQ.combatLvl()),
  adv: e => set(e, DQ.advLvl()),
  totlvl: e => set(e, DQ.totalLvl()),
  advbar: e => { const w = DQ.advProgress().pct.toFixed(1) + '%'; if (e.style.width !== w) e.style.width = w; },
  advline: e => { const p = DQ.advProgress(); set(e, p.need > 0 ? `${Math.floor(p.pct)}%` : 'Max'); const h = e.closest('.h-name'); if (h) h.dataset.tip = p.need > 0 ? `text:Hero level ${DQ.advLvl()}: ${fmt(p.need)} XP to level ${DQ.advLvl() + 1}` : 'text:Hero level maxed'; },
  advbonus: e => set(e, `+${((DQ.advLvl() - 1) * .25).toFixed(1).replace(".0", "")}% XP everywhere`),
  hptxt: e => set(e, `${Math.ceil(S().hp)} / ${DQ.maxHp()}`),
  hpbar: e => { const p = clamp(S().hp / DQ.maxHp() * 100, 0, 100); e.style.width = p + '%'; const h = e.closest('.hp'); if (h) h.classList.toggle('low', p < 30); },
  count: (e, a) => set(e, fmtK(DQ.have(a))),
  ing: (e, a, b) => { const n = DQ.have(a); set(e, `${fmtK(n)}/${b}`); e.classList.toggle('bad', n < +b); },
  fhp: e => { if (DQ.fight) e.style.width = clamp(DQ.fight.hp / D.MON[DQ.fight.id].hp * 100, 0, 100) + '%'; },
  fhptxt: e => { if (DQ.fight) set(e, `${Math.max(0, DQ.fight.hp)} / ${D.MON[DQ.fight.id].hp} health`); },
  qbar: (e, a, b) => { const q = D.QM[a], st = S().q[a]; e.style.width = clamp(DQ.objProg(q, st, +b) / q.obj[b].n * 100, 0, 100) + '%'; },
  qtxt: (e, a, b) => { const q = D.QM[a], st = S().q[a]; set(e, `${fmt(DQ.objProg(q, st, +b))} / ${fmt(q.obj[b].n)}`); },
  qall: (e, a) => { const q = D.QM[a], st = S().q[a]; let d = 0, t = 0; q.obj.forEach((o, i) => { d += Math.min(o.n, DQ.objProg(q, st, i)); t += o.n; }); e.style.width = (d / t * 100) + '%'; },
  qbadge: e => { const n = D.QUESTS.filter(q => DQ.questState(q) === 'ready').length; set(e, n); e.classList.toggle('show', n > 0); },
  ammo: e => { const a = S().ammo; set(e, a.id ? `${fmtK(a.n)} ${D.ITEMS[a.id].name.toLowerCase()} (+${fmtK(DQ.have(a.id))} spare)` : 'None equipped'); },
  runes: e => set(e, fmtK(DQ.have('rune'))),
  packn: e => set(e, `${DQ.packSlots()} / ${DQ.packMax()}`),
  town: e => set(e, D.TOWN[S().town].name),
  playtime: e => set(e, DQ.fmtTime(S().playtime)),
};
DQ.actPage = () => { const a = DQ.act; if (!a) return null; if (a.kind === 'fight') return 'combat'; if (a.kind === 'alch') return 'magic'; if (a.kind === 'recipe') return D.RECIPES[a.id].skill; return { fish: 'fishing', wood: 'woodcutting', mine: 'mining', thieve: 'thieving' }[a.kind]; };
UI.upd = () => { $$('[data-b]').forEach(e => { const [k, a, b] = e.dataset.b.split(':'); if (B[k]) B[k](e, a, b); }); };
let progEls = [];
UI.collectProg = () => { progEls = $$('[data-prog]'); for (const el of progEls) if (!el.dataset.ring) { el.style.width='100%'; el.style.transformOrigin='left'; el.style.transform=`scaleX(${progOf(el.dataset.prog)})`; } };
const progOf = key => { const a = DQ.act; if (!a) return 0; if (key !== '@' && key !== a.kind + ':' + a.id) return 0; return clamp((Date.now() - a.t0) / a.dur, 0, 1); };
UI.frame = () => {
  for (const e of progEls) { const p = progOf(e.dataset.prog); if (e.dataset.ring) e.style.strokeDashoffset = 289 * (1 - p); else e.style.transform = `scaleX(${p})`; }
  requestAnimationFrame(UI.frame);
};

/* ---------- Portrait ---------- */
UI.portrait = (px = 48, cls = '') => {
  const L = S().look, eq = S().equip, I = D.ITEMS;
  const body = eq.body ? I[eq.body].col : L.tunic, helm = eq.head ? I[eq.head].col : null;
  return `<svg class="portrait ${cls}" viewBox="0 0 100 100" width="${px}" height="${px}" aria-hidden="true"><defs><radialGradient id="pbg" cx="50%" cy="30%" r="80%"><stop offset="0" stop-color="#2c4350"/><stop offset="1" stop-color="#111a1f"/></radialGradient><clipPath id="pclip"><circle cx="50" cy="50" r="47"/></clipPath></defs>
  <circle cx="50" cy="50" r="48" fill="url(#pbg)"/><g clip-path="url(#pclip)">
  <path d="M10 100c2-22 17-32 40-32s38 10 40 32z" fill="${body}"/><path d="M38 68c4 6 20 6 24 0l-2 8c-6 4-14 4-20 0z" fill="#00000030"/>
  ${eq.body ? `<path d="M10 100c2-22 17-32 40-32s38 10 40 32" fill="none" stroke="#ffffff55" stroke-width="2"/><path d="M50 70v30" stroke="#00000030" stroke-width="2"/>` : ''}
  <rect x="42" y="56" width="16" height="16" rx="6" fill="${L.skin}"/><path d="M42 62h16v4c-4 3-12 3-16 0z" fill="#00000022"/>
  <ellipse cx="50" cy="41" rx="17" ry="20" fill="${L.skin}"/>
  ${helm ? `<path d="M31 42c-1-18 7-27 19-27s20 9 19 27l-4 1c-2-5-4-9-15-9s-13 4-15 9z" fill="${helm}" stroke="#00000055" stroke-width="1.2"/><rect x="48" y="30" width="4" height="14" fill="${helm}" stroke="#00000044"/>`
    : `<path d="M32 40c-1-15 7-24 18-24s19 9 18 24c-4-7-10-10-18-10s-14 3-18 10z" fill="${L.hair}"/>`}
  <circle cx="43" cy="43" r="1.9" fill="#2a2018"/><circle cx="57" cy="43" r="1.9" fill="#2a2018"/><path d="M45 52q5 3 10 0" stroke="#00000055" stroke-width="1.6" fill="none" stroke-linecap="round"/></g>
  <circle cx="50" cy="50" r="47.5" fill="none" stroke="#d8a64a" stroke-width="2.2"/></svg>`;
};

/* ---------- Town art ---------- */
const SCENES = {
  willowbrook: ['#6fa8c8', '#cfe6c0', `<circle cx="320" cy="34" r="16" fill="#fff3b0"/><path d="M0 100q70-34 150-8t170-6 120 8v50H0z" fill="#5f9a4a"/><path d="M0 116q90-26 190-4t250 0v40H0z" fill="#4a8438"/><g fill="#d9c9a0"><rect x="60" y="92" width="34" height="22"/><rect x="130" y="98" width="28" height="18"/></g><g fill="#a5523a"><path d="M54 92l23-18 23 18z"/><path d="M126 98l18-14 18 14z"/></g><circle cx="300" cy="86" r="22" fill="#3f7a35"/><circle cx="324" cy="92" r="17" fill="#4a8a3c"/><rect x="306" y="96" width="6" height="26" fill="#5a3f28"/>`],
  saltmere: ['#8cc4dc', '#e8f1f5', `<circle cx="70" cy="36" r="14" fill="#fff6d8"/><rect y="96" width="440" height="60" fill="#3d8aa8"/><path d="M0 108q20-6 40 0t40 0 40 0 40 0 40 0 40 0 40 0 40 0 40 0 40 0 40 0" fill="none" stroke="#a9dcec" stroke-width="2"/><rect x="250" y="40" width="18" height="60" fill="#e8e0d0"/><path d="M246 40h26l-13-14z" fill="#b04a3a"/><rect x="110" y="90" width="150" height="8" fill="#6a4a30"/><path d="M180 86l22-34v34z" fill="#f4efe2"/><path d="M178 90h46l-6 8h-34z" fill="#7a4a30"/><g fill="#5a4630"><rect x="300" y="82" width="40" height="22"/></g><path d="M294 82l26-18 26 18z" fill="#8a3f30"/>`],
  ironpeak: ['#7d8fa6', '#dfe6ee', `<path d="M0 130l70-80 50 50 60-70 70 90 70-60 60 70v30H0z" fill="#59677a"/><path d="M70 50l-14 18 14-6 10 8zM180 30l-16 22 16-8 12 10z" fill="#f2f6fa"/><path d="M0 142l90-30 80 14 100-16 170 20v26H0z" fill="#3c4756"/><rect x="250" y="96" width="46" height="34" fill="#2a323d"/><rect x="266" y="108" width="14" height="22" fill="#ff9a3a"/><circle cx="273" cy="104" r="26" fill="#ff9a3a" opacity=".18"/>`],
  gloomfen: ['#2b2547', '#6b5a8f', `<circle cx="340" cy="38" r="15" fill="#d9d2f0" opacity=".85"/><rect y="104" width="440" height="50" fill="#1d1a33"/><path d="M0 112q40-8 80 0t80 0 80 0 80 0 80 0 40 0" fill="none" stroke="#4a4478" stroke-width="2"/><g stroke="#0e0c1c" stroke-width="5" stroke-linecap="round" fill="none"><path d="M60 110V60M60 80l-14-14M60 70l12-10"/><path d="M180 112V70M180 88l-12-12M180 78l10-9"/><path d="M290 110V54M290 76l-14-14M290 64l14-10"/></g><g fill="#c8ff8a"><circle cx="120" cy="96" r="3"/><circle cx="230" cy="88" r="3"/><circle cx="350" cy="98" r="3"/></g><g fill="#c8ff8a" opacity=".18"><circle cx="120" cy="96" r="14"/><circle cx="230" cy="88" r="14"/><circle cx="350" cy="98" r="14"/></g>`],
  emberfall: ['#4a1f1a', '#e8703a', `<path d="M60 150L170 56l20 8 14-14 120 100z" fill="#2a1512"/><path d="M170 56l20 8 14-14-10 14-14 6z" fill="#ff7a2a"/><path d="M178 60q10 30-4 60M196 64q2 30 10 56" stroke="#ff6a2a" stroke-width="3" fill="none"/><circle cx="190" cy="44" r="24" fill="#ff7a2a" opacity=".25"/><g fill="#1c0e0c"><rect x="290" y="92" width="14" height="50"/><rect x="310" y="82" width="16" height="60"/><rect x="332" y="96" width="14" height="46"/><path d="M290 92l7-12 7 12zM310 82l8-14 8 14zM332 96l7-12 7 12z"/></g><path d="M0 138h440v20H0z" fill="#1c0e0c"/><g fill="#ffb066"><circle cx="40" cy="30" r="1.6"/><circle cx="120" cy="20" r="1.4"/><circle cx="260" cy="26" r="1.6"/><circle cx="400" cy="40" r="1.4"/></g>`],
};
SCENES.mossbarrow = ['#9cc8d8', '#f0e4c0', `<path d="M0 104q90-24 190-8t250-4v58H0z" fill="#8aa84a"/><g fill="#d9b860"><path d="M40 112q16-26 32 0z"/><path d="M80 116q14-22 28 0z"/></g><rect x="200" y="78" width="70" height="40" fill="#b8503a"/><path d="M194 80l41-28 41 28z" fill="#7a3a2a"/><rect x="228" y="94" width="16" height="24" fill="#4a2a1a"/><g stroke="#8a6a3a" stroke-width="3"><path d="M290 120h140M300 110v14M330 110v14M360 110v14M390 110v14M420 110v14"/></g><circle cx="70" cy="34" r="14" fill="#fff3c0"/>`];
SCENES.skyreach = ['#7ab8e8', '#e8f4ff', `<g fill="#ffffff" opacity=".85"><ellipse cx="80" cy="120" rx="90" ry="18"/><ellipse cx="330" cy="130" rx="120" ry="20"/></g><path d="M150 110l40-70 40 70z" fill="#8a9aa8"/><path d="M280 96l30-50 30 50z" fill="#9aa8b8"/><rect x="176" y="62" width="28" height="30" fill="#e8dcc8"/><path d="M170 64l20-16 20 16z" fill="#c8503a"/><path d="M210 80q35 -12 85 0" stroke="#6a4a30" stroke-width="2" fill="none"/><circle cx="380" cy="30" r="12" fill="#fff8d0"/>`];
SCENES.hollow = ['#2a1a4a', '#8a5ad8', `<circle cx="80" cy="40" r="16" fill="#e8d8ff" opacity=".8"/><rect y="112" width="440" height="40" fill="#1a1030"/><g fill="#120a24"><rect x="170" y="54" width="100" height="62"/><path d="M164 56l20-24 20 24zM214 56l6-30 6 30zM236 56l20-24 20 24z"/></g><path d="M200 46l8-10 8 10 8-10 8 10v8h-32z" fill="#b08aff"/><g fill="#b08aff" opacity=".5"><circle cx="120" cy="100" r="2"/><circle cx="330" cy="90" r="2"/><circle cx="380" cy="104" r="2"/></g>`];
UI.scene = (id, cls = '') => { const [a, b, body] = SCENES[id]; return `<svg class="scene ${cls}" viewBox="0 0 440 150" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><defs><linearGradient id="sk-${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient></defs><rect width="440" height="150" fill="url(#sk-${id})"/>${body}</svg>`; };

/* ---------- Tooltips ---------- */
const reqLine = it => Object.entries(it.req || {}).map(([sk, l]) => { const ok = DQ.skillUnlocked(sk) && DQ.lvl(sk) >= l; return `<div class="${ok ? 'ok' : 'bad'}">${ok ? '✓' : '✗'} ${D.SK[sk].name} ${l}</div>`; }).join('');
DQ.tips.item = id => {
  const it = D.ITEMS[id]; if (!it) return '';
  const kind = { gear: it.slot ? DQ.cap(it.slot) + (it.style ? ' · ' + it.style : '') : 'Gear', ammo: 'Ammunition', food: 'Food', tool: 'Tool', raw: 'Raw fish', resource: 'Resource', gem: 'Gem', junk: 'Junk', supply: 'Supply', drop: 'Drop' }[it.type] || '';
  const bonus = UI.statLine(it.b);
  let extra = '';
  if (it.heal) extra += `<div class="ok">Heals ${it.heal} hitpoints</div>`;
  if (it.type === 'tool') extra += `<div>${Math.round(D.TOOL_SPEED[it.tier] * 100)}% faster ${D.SK[it.toolSkill].name.toLowerCase()}</div>`;
  const own = DQ.have(id);
  return `<b style="color:${it.col}">${esc(it.name)}${it.rare ? ' ★' : ''}</b><em>${kind}</em>${bonus ? `<div class="stat-l">${bonus}</div>` : ''}${extra}${reqLine(it)}<div class="dim">Worth ${fmt(it.val)} coins${own ? ` · You have ${fmt(own)}` : ''}</div>`;
};
DQ.tips.skill = sk => {
  const s = D.SK[sk], l = DQ.lvl(sk); if (!DQ.skillUnlocked(sk)) return `<b>${s.name}</b><div class="bad">${DQ.unlockHow(sk)} to learn it.</div>${s.quest ? `<div class="dim">${D.QM[s.quest].giver}, ${D.TOWN[D.QM[s.quest].town].name}</div>` : ''}`;
  const perks = D.GATHER_SKILLS.includes(sk) ? D.PERKS.map(p => `<div class="${l >= p.lvl ? 'ok' : 'dim'}">${l >= p.lvl ? '✓' : '○'} ${p.lvl}: ${p.name} (${p.speed ? Math.round(p.speed * 100) + '% faster' : Math.round(p.dbl * 100) + '% double yield'})</div>`).join('') : '';
  return `<b style="color:${s.col}">${s.name} ${l}</b><div>${fmt(S().xp[sk])} XP · +${Math.round((DQ.xpMult(sk) - 1) * 100)}% XP bonus</div><div class="dim">Each skill level adds +0.5% XP, each Hero level +0.25%.</div>${perks}`;
};

/* ---------- Page chrome ---------- */
UI.skillHero = (sk, extra = '') => {
  const s = D.SK[sk], l = DQ.lvl(sk), perks = D.GATHER_SKILLS.includes(sk) ? `<div class="perks"><span class="k">Perks</span>${D.PERKS.map(p => `<span class="perk ${l >= p.lvl ? 'on' : ''}" data-tip="text:${p.name} at ${s.name} ${p.lvl}: ${p.speed ? Math.round(p.speed * 100) + '% faster actions' : Math.round(p.dbl * 100) + '% chance of double yield'}">${p.lvl}</span>`).join('')}</div>` : '';
  return `<section class="panel skillhero fancy" style="--c:${s.col}"><div class="big">${ico(sk)}</div><div class="sh-main"><h2>${s.name}</h2><p>${s.blurb}</p><span class="bar"><i data-b="xpbar:${sk}"></i></span><div class="sh-line mono"><span data-b="xpline:${sk}"></span><span data-b="toNext:${sk}"></span></div>${perks}</div>
    <div class="sh-side"><div class="lv mono" data-b="lvl:${sk}"></div><span class="chipx" data-tip="skill:${sk}"><span data-b="bonus:${sk}"></span></span></div>${extra}</section>`;
};
UI.toolLine = sk => {
  const k = DQ.toolKey(sk); if (!k) return '';
  const t = DQ.toolTier(sk), nx = t < 5 ? D.ITEMS[`tool_${k}_${t + 1}`] : null, spd = Math.round((1 - DQ.speedMult(sk)) * 100);
  return `<div class="toolline"><span>${ico(D.TOOLS.find(x => x[0] === k)[2])} <b>${t ? D.ITEMS[`tool_${k}_${t}`].name : D.TOOL_TIERS[0] + ' ' + D.TOOLS.find(x => x[0] === k)[3].toLowerCase()}</b> · ${spd}% faster</span>${nx ? `<button class="btn sm" data-do="go" data-a="shop">Next: ${nx.name} (${fmt(nx.buy)})</button>` : '<span class="dim">Best tool owned</span>'}</div>`;
};
UI.lockedPage = sk => {
  const s = D.SK[sk], need = s.unlock, cur = DQ.advLvl();
  if(s.actionReq){const pages={kill:'combat',catch:'fishing',chop:'woodcutting',harvest:'farming',craft:'crafting',smith:'smithing'};return `<section class="panel locked-page" style="--c:${s.col}">${DQ.artImage('skill',sk,64,'',s.name)}<h2>${s.name}</h2><p>${esc(s.blurb)}</p><h3>Unlock through play</h3><p>${esc(DQ.unlockHow(sk))}</p>${DQ.actionProgress(sk).map(r=>`<div class="stack"><span class="bar"><i style="width:${Math.min(100,r.have/r.need*100)}%"></i></span><button class="btn" data-do="go" data-a="${pages[r.stat]}">Continue ${D.SK[pages[r.stat]]?.name||'Combat'}</button></div>`).join('')}</section>`;}

  if (s.quest) {
    const q = D.QM[s.quest], st = DQ.questState(q), blk = DQ.questBlockers(q), t = D.TOWN[q.town];
    const btn = st === 'new' ? `<button class="btn primary" data-do="qstart" data-a="${q.id}">Accept the quest</button>` : st === 'ready' ? `<button class="btn primary" data-do="qclaim" data-a="${q.id}">Finish the quest</button>` : `<button class="btn" data-do="openquest" data-a="${q.id}">Open in quest log</button>`;
    return `<section class="panel locked-page fancy" style="--c:${s.col}"><div class="big">${ico(sk)}</div><span class="mq-ribbon">${ico('star')} Main quest</span><h2>Learn ${s.name}</h2><p>${s.blurb}</p>
      <div class="mq-box"><h3>${q.name}</h3><small>${q.giver} · ${t.name}</small><p class="blurb">${q.blurb}</p>
      ${st === 'locked' ? `<div class="reqs">${blk.map(b => `<div class="bad">✗ ${b}</div>`).join('')}</div>` : `<div class="mq-objs">${q.obj.map((o, j) => `<div class="obj"><span>${o.label}</span><span class="mono" ${S().q[q.id] ? `data-b="qtxt:${q.id}:${j}"` : ''}>${S().q[q.id] ? '' : '0 / ' + o.n}</span><span class="bar"><i ${S().q[q.id] ? `data-b="qbar:${q.id}:${j}"` : ''}></i></span></div>`).join('')}</div>`}
      <div class="quick" style="justify-content:center">${st === 'locked' ? '' : btn}</div></div></section>`;
  }
  return `<section class="panel locked-page fancy" style="--c:${s.col}"><div class="big">${ico('lock')}</div><h2>${s.name} is locked</h2><p>${s.blurb}</p><p>Reach <b>Hero level ${need}</b> to unlock it. You are level <b class="mono" data-b="adv"></b>.</p><span class="bar" style="max-width:360px"><i data-b="advbar"></i></span><small class="mono" data-b="advline"></small><div class="quick"><button class="btn" data-do="go" data-a="overview">Back to overview</button></div></section>`;
};

/* Illustrated choices stay visible; the selected target gets the main stage. */
UI.taskChoice = {};
UI.taskToolbar = {};
UI.taskPanel = (key, title, kind, choices, verb) => {
  const active = DQ.act && DQ.act.kind === kind && choices.find(c => c.id === DQ.act.id);
  const choice = choices.find(c => c.id === UI.taskChoice[key]) || active || choices.find(c => !c.locked) || choices[0];
  if (!choice) return `<section class="panel"><h2>${esc(title)}</h2><p>No tasks here yet. Visit another town to find more.</p><button class="btn" data-do="go" data-a="map">World map</button></section>`;
  UI.taskChoice[key] = choice.id;
  const running = DQ.act && DQ.act.kind === kind && DQ.act.id === choice.id;
  const art = (c, size=96) => c.artKind === 'item' ? `<span class="activity-item-art" style="--art-size:${size}px">${DQ.itemIco(D.ITEMS[c.artId || c.id])}</span>` : DQ.artImage(c.artKind || (kind==='fight'?'creature':kind),c.artId || c.id,size,'',c.name);
  const action = `<div class="activity-actions">${choice.away?`<button class="btn primary" data-do="taskmap" data-a="${choice.town}">View ${esc(D.TOWN[choice.town].name)}</button>`:''}<button class="btn primary task-primary" data-do="act" data-a="${kind}" data-b="${choice.id}" ${!running && choice.blocked ? 'disabled' : ''}>${running ? kind === 'fight' ? 'Retreat' : 'Stop' : esc(verb+' '+choice.name.replace(/^(Cook|Bars|Weapons|Armour) · /,''))}</button>${DQ.planUnlocked && DQ.planUnlocked() ? `<button class="btn" data-do="queueadd" data-a="${kind}" data-b="${choice.id}" ${choice.locked||choice.away ? 'disabled' : ''}>Queue</button>` : ''}</div>`;
  const cards = `<section class="panel activity-choices"><div class="phead"><h2>${kind==='fight'?'Choose an opponent':kind==='recipe'?'Choose what to make':kind==='alch'?'Choose an item':({fish:'Fish catalogue',wood:'Trees',mine:'Ore deposits',thieve:'Targets'}[kind]||'Choose your spot')}</h2><small>${choices.some(c=>c.town)?`${choices.length} resources · all regions`:D.TOWN[S().town].name}</small></div>${UI.taskToolbar[key] || ''}<div class="illustrated-choices">${choices.filter(c=>c.visible!==false).map(c=>{
    const working=DQ.act&&DQ.act.kind===kind&&DQ.act.id===c.id;
    return `<button class="illustrated-card ${working?'active':''} ${choice.id===c.id?'selected':''} ${c.locked?'locked':''}" data-do="taskselect" data-a="${kind}" data-b="${c.id}" data-page="${key}" aria-pressed="${choice.id===c.id}" ${c.locked&&!c.inspectable?'disabled':''}>
      <span class="choice-art">${art(c,96)}</span><b>${esc(c.name)}</b><small>${c.caption||esc(c.reason||'')}</small><span class="choice-state">${working?'● Working':c.locked?'Locked':c.away?'Travel required':choice.id===c.id?'✓ Selected':'Available'}</span>${working?`<span class="bar prog"><i data-prog="${kind}:${c.id}"></i></span>`:''}</button>`;
  }).join('') || '<p class="dim">No recipes match. Try another category.</p>'}</div></section>`;
  if(kind==='fight')return `<section class="panel encounter-controls"><div class="phead"><h2>${esc(choice.name)}</h2><small>Combat <b data-b="combat"></b></small></div>${action}<div class="task-summary">${choice.info||''}</div></section>${cards}`;
  const stage = `<section class="panel activity-stage ${running?'working':''}" style="--c:${D.SK[key]?.col||'var(--brass)'};--work-beat:${Math.max(900,Math.min(1700,(DQ.act?.dur||3600)/3))}ms"><div class="activity-scene ${kind} skill-${key}" data-kind="${kind}" data-task="${choice.id}" style="--landscape:url('${DQ.sceneUrl ? DQ.sceneUrl(S().town) : ''}')"><span class="scene-target">${art(choice,192)}</span>${choice.yieldId&&kind!=='fish'?`<span class="scene-yield"><small>Produces</small>${DQ.itemIco(D.ITEMS[choice.yieldId])}</span>`:''}${running?`<span class="scene-worker" aria-hidden="true"><img class="px" src="${DQ.heroWorkFigureUrl?DQ.heroWorkFigureUrl(S().look):DQ.heroFigureUrl(S().look)}" width="72" height="102" alt=""></span><span class="action-tool" aria-hidden="true">${ico({wood:'woodcutting',mine:'mining',fish:'rod',thieve:'glove',recipe:{cooking:'cooking',smithing:'hammer',crafting:'crafting'}[key],alch:'staff'}[kind]||key)}</span><span class="work-atmosphere" aria-hidden="true"><i></i><i></i><i></i><i></i></span>`:''}</div>
    <div class="activity-caption"><div class="phead"><div><small>${esc(title)} · Level <b data-b="lvl:${key}"></b></small><h2>${esc(choice.name)}</h2></div><span class="activity-state ${running?'ok':'dim'}">${running?'● Working':choice.blocked?'Preview':'Ready'}</span></div>${running?'<span class="bar prog activity-progress"><i data-prog="@"></i></span>':''}${action}<div class="task-summary">${choice.info||''}${choice.blocked&&!running?`<p class="bad">${esc(choice.reason)}</p>`:''}</div></div></section>`;
  return `<div class="activity-workspace task-panel">${stage}${cards}</div>`;
};

/* ---------- Gather pages (fishing, woodcutting, mining, thieving) ---------- */
const KIND_OF = { fishing: 'fish', woodcutting: 'wood', mining: 'mine', thieving: 'thieve' };
UI.V.gather = sk => {
  const kind=KIND_OF[sk],nodes=[...D.NODES[kind]].sort((a,b)=>a.lvl-b.lvl);
  const choices=nodes.map(n=>{
    const away=n.town!==S().town,levelLocked=DQ.lvl(sk)<n.lvl,townLocked=!DQ.townUnlocked(n.town);
    const town=D.TOWN[n.town],prev=D.TOWNS[town.idx-1];
    const requirements=[levelLocked?`Requires ${D.SK[sk].name} ${n.lvl}`:'',townLocked?(prev?`Defeat ${D.MON[prev.boss].name} in ${prev.name} to open ${town.name}`:`Unlock ${town.name}`):away?`Travel to ${town.name}`:''].filter(Boolean);
    return {id:n.id,name:n.name,artKind:kind,yieldId:n.item,town:n.town,away,inspectable:true,
      locked:levelLocked||townLocked,blocked:levelLocked||away,reason:requirements.join(' · '),
      caption:`Level ${n.lvl} · ${esc(town.name)}`,
      info:`<p>${(n.xp*DQ.xpMult(sk)).toFixed(1)} XP · ${(DQ.durFor(kind,n.id)/1000).toFixed(1)}s per ${kind==='wood'||kind==='mine'?'resource':kind==='fish'?'catch':'attempt'} · ${kind==='wood'||kind==='mine'?'3 steady strikes · never misses':kind==='fish'?'Guaranteed catch':Math.round(DQ.successChance(kind,n)*100)+'% success'}</p><p>${n.item?`<b class="mono" data-b="count:${n.item}"></b> ${esc(D.ITEMS[n.item].name.toLowerCase())} held`:`${n.cmin}–${n.cmax} coins · ${n.dmg} damage if caught`}</p>`};
  });
  if(!UI.taskChoice[sk]&&!DQ.act)UI.taskChoice[sk]=choices.find(c=>!c.blocked)?.id;
  return UI.taskPanel(sk,D.SK[sk].name,kind,choices,{fish:'Fish',wood:'Chop',mine:'Mine',thieve:'Pickpocket'}[kind])+`<section data-reference="true" class="panel reference-panel" id="${sk}-progress"><h3>Skill progress &amp; tools</h3>${UI.skillHero(sk,UI.toolLine(sk))}</section>`;
};

/* ---------- Recipe pages ---------- */
UI.V.recipes = sk => {
  const list=D.RLIST[sk],tabs=[...new Set(list.map(r=>r.tab))],tab=UI.tab[sk]=tabs.includes(UI.tab[sk])?UI.tab[sk]:tabs[0],only=UI.tab[sk+'ready'];
  UI.taskToolbar[sk]=`<div class="recipe-categories">${tabs.map(t=>`<button class="chip ${t===tab?'on':''}" data-do="tab" data-a="${sk}" data-b="${t}">${t}</button>`).join('')}<button class="chip ${only?'on':''}" data-do="readyonly" data-a="${sk}">Ready to make</button></div>`;
  const choices=list.map(r=>{const outId=Object.keys(r.out)[0],it=D.ITEMS[outId];return {id:r.id,name:r.name,artKind:'item',artId:outId,visible:r.tab===tab&&(!only||DQ.canMake(r)),locked:DQ.lvl(sk)<r.lvl,blocked:DQ.lvl(sk)<r.lvl||!DQ.canMake(r),reason:DQ.lvl(sk)<r.lvl?`Requires ${D.SK[sk].name} ${r.lvl}`:'Gather the missing ingredients first.',caption:`Level ${r.lvl} · ${UI.statLine(it.b)||`${(DQ.durFor('recipe',r.id)/1000).toFixed(1)}s`}`,
    info:`<p>${(r.xp*DQ.xpMult(sk)).toFixed(1)} XP · ${(DQ.durFor('recipe',r.id)/1000).toFixed(1)}s per attempt${r.burn?` · ${Math.round(DQ.burnChance(r)*100)}% burn chance`:''}</p><div class="recipe-ingredients">${Object.entries(r.in).map(([id,n])=>`<span class="ingredient ${DQ.have(id)>=n?'':'bad'}">${DQ.itemIco(D.ITEMS[id])}<span>${esc(D.ITEMS[id].name)} <b data-b="count:${id}"></b> / ${n}</span>${DQ.have(id)>=n||!UI.routeChip?'':UI.routeChip(id)}</span>`).join('')}</div>`};});
  return UI.taskPanel(sk,D.SK[sk].name,'recipe',choices,sk==='cooking'?'Cook':sk==='smithing'?'Make':'Craft')+`<section data-reference="true" class="panel reference-panel" id="${sk}-progress"><h3>Skill progress</h3>${UI.skillHero(sk)}</section>`;
};

/* ---------- Magic page ---------- */
UI.V.magic = () => {
  const tab = UI.tab.magic || 'Alchemy', level = DQ.lvl('magic'), alchemy = DQ.alchSpell();
  let body;
  if (tab === 'Alchemy') {
    const ids = Object.keys({ ...S().inv, ...S().bank }).filter(id => D.ITEMS[id].val >= 8 && !DQ.isEquipped(id) && D.ITEMS[id].type !== 'food' && id !== 'rune').sort((a, b) => D.ITEMS[b].val - D.ITEMS[a].val);
    const choices = ids.map(id => ({ id, name: D.ITEMS[id].name, artKind: 'item', blocked: !alchemy || DQ.have('rune') < alchemy.runes, reason: 'Not enough Arcane runes.', info: alchemy ? `<p>${fmt(Math.round(D.ITEMS[id].val * alchemy.mult))} coins per cast · ${alchemy.runes} runes used · <b data-b="runes"></b> runes held · <b data-b="count:${id}"></b> items held</p>` : '' }));
    body = !alchemy ? `<section class="panel"><p>Alchemy opens at Magic ${D.ALCH[0].lvl}. Equip a staff and fight to train Magic.</p><button class="btn" data-do="go" data-a="combat">Combat</button></section>` : choices.length ? UI.taskPanel('magic', 'Alchemy', 'alch', choices, 'Cast') : '<section class="panel"><p>You have nothing worth transmuting right now.</p></section>';
  } else {
    const spell = D.SPELLS.find(sp => sp.id === S().spell) || D.SPELLS[0];
    body = `<section class="panel"><div class="phead"><h2>Combat magic</h2><small>Magic level ${level}</small></div><div class="task-controls"><label for="combat-spell">Spell${UI.choiceButtons(`<select id="combat-spell" data-in="combat-spell">${D.SPELLS.map(sp => `<option value="${sp.id}" ${sp === spell ? 'selected' : ''} ${level < sp.lvl ? 'disabled' : ''}>${sp.name} · Level ${sp.lvl}</option>`).join('')}</select>`)}</label><button class="btn primary" data-do="go" data-a="combat">Combat</button></div><p class="sm">Max hit ${spell.max} · ${spell.runes} runes per cast. Spells are cast automatically with a staff.</p></section>`;
  }
  return `<div class="tabs magic-tabs">${['Alchemy', 'Spellbook'].map(t => `<button class="tab ${t === tab ? 'on' : ''}" data-do="tab" data-a="magic" data-b="${t}">${t}</button>`).join('')}</div>${body}<section data-reference="true" class="panel reference-panel" id="magic-progress"><h3>Skill progress</h3>${UI.skillHero('magic')}</section>`;
};

/* ---------- Combat page ---------- */
UI.foodChips = () => {
  const foods = DQ.foods();
  return foods.length ? foods.map(id => { const it = D.ITEMS[id]; return `<button class="chip" style="--c:${it.col}" data-do="eat" data-a="${id}" data-tip="item:${id}">${ico(it.ic)}${it.name} <b class="mono" data-b="count:${id}"></b><small class="mono">+${it.heal}</small></button>`; }).join('') : `<p class="dim sm">No food. Cook fish, or buy bread from the shop.</p>`;
};
UI.V.combat = () => {
  const town = S().town, mons = D.MONLIST.filter(m => m.town === town), boss = mons.find(m => m.boss);
  const f = DQ.act && DQ.act.kind === 'fight' ? D.MON[DQ.act.id] : null, st = DQ.weaponStyle(), ps = DQ.pstats(), sty = S().style;
  const preview = f || mons.find(m=>m.id===UI.taskChoice.combat) || mons[0];
  const foe = preview ? `<div class="avatar ${preview.boss ? 'boss' : ''}" id="av-foe" style="--c:${preview.col}">${DQ.battleFoe ? DQ.battleFoe(preview) : DQ.monSprite(preview,192)}</div><div class="nm">${esc(preview.name)} <span class="lvchip ${preview.cl - DQ.combatLvl() <= 3 ? 'easy' : preview.cl - DQ.combatLvl() <= 14 ? 'fair' : 'hard'}">Lv ${preview.cl}</span></div><span class="bar hpb"><i ${f?'data-b="fhp"':'style="width:100%"'}></i></span><small class="mono" ${f?'data-b="fhptxt"':''}>${preview.hp} / ${preview.hp} health</small>`
    : `<div class="avatar idle" id="av-foe" style="--c:#4a5a5e">?</div><div class="empty-foe">Choose a target to start fighting.</div>`;
  const stances = st === 'melee' ? [['accurate', 'Accurate', 'attack'], ['aggressive', 'Aggressive', 'strength'], ['defensive', 'Defensive', 'defence']] : [['offense', 'Offensive', st === 'ranged' ? 'ranged' : 'magic'], ['defensive', 'Defensive', st === 'ranged' ? 'ranged + defence' : 'magic + defence']];
  const cur = sty[st];
  const wname = S().equip.weapon ? D.ITEMS[S().equip.weapon].name : 'Bare hands';
  let bossCard = '';
  if (boss) {
    const t = D.TOWN[town], done = S().towns[town] && S().towns[town].boss, req = boss.boss.req, ok = DQ.combatLvl() >= req, next = D.TOWNS[t.idx + 1], on = f && f.id === boss.id;
    bossCard = `<section class="panel bosscard fancy" style="--c:${boss.col}"><div class="avatar boss" style="--c:${boss.col}">${DQ.monSprite(boss, 64, 'bob')}</div><div class="bc-main"><span class="k">${done ? 'Defeated' : 'Boss'}</span><h2>${esc(boss.name)}</h2>
      <p class="sm dim">${done ? 'Fight again for loot, with a small chance at its trophy.' : next ? `Defeat it to open the road to <b>${next.name}</b>.` : 'The final challenge in the realm.'}</p>
      <div class="bc-req ${ok ? 'ok' : 'bad'}">${ok ? '✓' : '✗'} Combat level ${req} required <span class="mono">(you: ${DQ.combatLvl()})</span></div></div>
      ${UI.bossIntel(boss)}
      <button class="btn ${ok ? 'primary' : ''} bc-btn" ${ok ? '' : 'data-do="noop" data-tip="text:Train combat skills, upgrade your gear and stock up on food first"'} ${ok ? `data-do="act" data-a="fight" data-b="${boss.id}"` : ''}>${on ? 'Retreat' : done ? 'Fight again' : 'Challenge'}</button><span class="progw"><i data-prog="fight:${boss.id}"></i></span></section>`;
  }
  const Lv = DQ.lvl, melee = .325 * (Lv('attack') + Lv('strength')), rng = .325 * Math.floor(1.5 * Lv('ranged')), mag = .325 * Math.floor(1.5 * Lv('magic')), best = Math.max(melee, rng, mag);
  const bestName = best === melee ? 'Melee' : best === rng ? 'Ranged' : 'Magic';
  const clvl = `<section class="panel clvl slim"><div class="cl-num" data-tip="text:Combat level is made from Defence, Health and your best fighting style. Train any of them to raise it. Monsters are tagged against it."><span class="k">Your combat level</span><b class="mono" data-b="combat"></b></div>
    <div class="cl-b"><div class="cl-parts"><span>${ico('defence')}Defence <b class="mono">${Lv('defence')}</b></span><span>${ico('hitpoints')}Health <b class="mono">${Lv('hitpoints')}</b></span><span>${ico(bestName === 'Melee' ? 'attack' : bestName === 'Ranged' ? 'ranged' : 'magic')}${bestName === 'Melee' ? `Attack <b class="mono">${Lv('attack')}</b> + Strength <b class="mono">${Lv('strength')}</b>` : `${bestName} <b class="mono">${Lv(bestName.toLowerCase())}</b>`}</span></div></div>
    <div class="cl-key"><span class="lvchip easy">Easy</span><span class="lvchip fair">Fair</span><span class="lvchip hard">Hard</span></div></section>`;
  const choices = mons.map(m => ({ id: m.id, name: m.name, artKind: 'creature', caption: `Level ${m.cl}${m.boss ? ' · Boss' : ''}`, blocked: !!m.boss && DQ.combatLvl() < m.boss.req, locked: !!m.boss && DQ.combatLvl() < m.boss.req, reason: m.boss ? `Combat level ${m.boss.req} required` : '', info: `<p>Level ${m.cl} · ${m.hp} health${m.boss ? ' · Boss' : ''}. Food available restores ${fmt(DQ.foods().reduce((n, id) => n + DQ.have(id) * D.ITEMS[id].heal, 0))} health.</p>` }));
  const controls = UI.areaPanel ? UI.areaPanel(town) : UI.taskPanel('combat', 'Combat', 'fight', choices, 'Fight');
  const battle = `<section class="panel arena encounter-arena" style="--landscape:url('${DQ.sceneUrl ? DQ.sceneUrl(town) : ''}');background-image:linear-gradient(color-mix(in srgb,var(--panel) 45%,transparent),color-mix(in srgb,var(--panel) 70%,transparent)),var(--landscape)"><div class="side"><div class="splats" id="sp-you"></div><div class="avatar you" id="av-you">${DQ.battleHero ? DQ.battleHero() : `<img class="px encounter-hero" src="${DQ.heroFigureUrl(S().look)}" width="144" height="204" alt="Your equipped hero">`}</div><div class="nm">${esc(S().name)} <span class="lvchip you">Combat ${DQ.combatLvl()}</span></div><span class="bar hpb"><i data-b="hpbar"></i></span><small class="mono" data-b="hptxt"></small></div>
      <div class="mid"><span class="vs">vs</span>${f ? `<span class="bar prog" aria-label="Next attack" style="--c:var(--brass)"><i data-prog="fight:${f.id}"></i></span>` : `<small class="dim">Preview</small>`}</div>
      <div class="side"><div class="splats" id="sp-foe"></div>${foe}</div></section>`;
  const training = `<section class="panel combat-training"><label for="training-focus">Train${UI.choiceButtons(`<select id="training-focus" data-in="training-focus" data-a="${st}">${stances.map(([value, name, skill]) => `<option value="${value}" ${cur === value ? 'selected' : ''}>${D.SK[skill] ? D.SK[skill].name : skill} · ${name}</option>`).join('')}</select>`)}</label><button class="tog ${S().settings.autoEat ? 'on' : ''}" data-do="autoeat"><span class="sw"></span>Auto-eat ${S().settings.autoEat ? 'on' : 'off'}</button><label for="eat-threshold">Eat below${UI.choiceButtons(`<select id="eat-threshold" data-in="eat-threshold">${[30,40,50,60,70].map(n=>`<option value="${n}" ${S().settings.eatAt === n ? 'selected' : ''}>${n}% health</option>`).join('')}</select>`)}</label></section>`;
  return `<div class="combat-dashboard"><div class="combat-live">${battle}${clvl}${training}</div><div class="combat-targets">${controls}</div>${bossCard}
    <section class="panel"><div class="phead"><h2>Loadout</h2><small class="mono">Max hit ${ps.max}</small></div>
      <div class="loadout"><div>${ico(st === 'ranged' ? 'bow' : st === 'magic' ? 'staff' : 'sword')} <b>${esc(wname)}</b> <span class="tag">${st}</span></div>${UI.weaponLine()}<div class="combat-speed"><b>Attack speed</b> ${esc(DQ.combatSpeedText())}</div>
      ${st === 'ranged' ? `<div class="sm dim">Ammo: <span data-b="ammo"></span></div>` : ''}${st === 'magic' ? `<div class="sm dim">Spell: <b>${ps.spell.name}</b> · Runes: <span class="mono" data-b="runes"></span></div>` : ''}</div>
</section>
    ${UI.abilityPanel()}
    <section class="panel"><div class="phead"><h2>Food</h2><small>Click to eat</small></div><div class="chips" id="foodbox">${UI.foodChips()}</div></section>
    <section class="panel"><div class="phead"><h2>Combat skills</h2><small>What each one does</small></div><div class="tiles two">${['attack', 'strength', 'defence', 'ranged', 'hitpoints'].map((k, i) => { const d = { attack: 'Chance to hit', strength: `Hit harder · max hit ${ps.max}`, defence: `Dodge and armour · blocks ${Math.round(ps.red * 100)}%`, ranged: 'Bows: hit chance and damage', hitpoints: 'Your health' }[k]; return UI.tile(k, i).replace(/<\/button>\s*$/, `<small class="tiledesc">${d}</small></button>`); }).join('')}</div>
      <section data-reference="true" class="howfight"><h3>How fighting works</h3><ul><li><b>Attack</b> decides whether your swing lands. <b>Strength</b> decides how much damage it does, up to your <b>max hit</b>.</li><li><b>Defence</b> and your armour make monsters miss you and take some of the sting out of what hits.</li><li>The <b>Training focus</b> you pick above decides which of these skills earns XP.</li><li>Your <b>combat level</b> combines Defence, Health and your best fighting style. The Easy / Fair / Hard tags compare a monster's level with it.</li></ul></section></section>${UI.lootPanel()}</div>`;
};
UI.tile = (sk, i = 0) => {
  const s = D.SK[sk], locked = !DQ.skillUnlocked(sk);
  return `<button class="tile ${locked ? 'locked' : ''}" data-skill="${sk}" style="--c:${s.col};--i:${i}" data-do="go" data-a="${s.page}" data-tip="skill:${sk}"><span class="t-ic">${ico(locked ? 'lock' : sk)}</span>${locked ? `<span class="t-lv mono sm">${s.actionReq ? 'Actions' : s.quest ? '★ Quest' : 'Lv ' + s.unlock}</span>` : `<span class="t-lv mono" data-b="lvl:${sk}"></span>`}<span class="t-nm">${s.name}</span><span class="bar"><i ${locked ? '' : `data-b="xpbar:${sk}"`}></i></span><span class="t-xp mono">${locked ? esc(DQ.unlockHow(sk)) : ''}<span ${locked ? '' : `data-b="toNext:${sk}"`}></span></span></button>`;
};

UI.renderLog = () => {
  const el = $('#loglist'); if (!el) return;
  el.innerHTML = S().log.slice(0, 14).map(l => { const d = new Date(l.t); return `<li class="${esc(l.k || '')}"><time>${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}</time><span>${esc(l.m)}</span></li>`; }).join('') || `<li><time></time><span class="dim">Your adventures will be written here.</span></li>`;
};
UI.chart = () => {
  const W = 600, H = 150, L = 36, T = 8, bw = (W - L) / 60, bk = DQ.hist.slice(-60), off = 60 - bk.length;
  const sums = bk.map(b => Object.values(b).reduce((a, v) => a + v, 0)), top = Math.max(50, Math.ceil(Math.max(50, ...sums) / 50) * 50), ph = H - T - 16;
  let g = '', bars = '';
  for (let i = 0; i <= 2; i++) { const y = T + ph - ph * i / 2; g += `<line class="gl" x1="${L}" x2="${W}" y1="${y}" y2="${y}"/><text x="${L - 6}" y="${y + 3}" text-anchor="end">${DQ.fmtK(top * i / 2)}</text>`; }
  bk.forEach((b, i) => { let y = T + ph; D.SKILLS.forEach(k => { const v = b[k.id]; if (!v) return; const h = v / top * ph; y -= h; bars += `<rect x="${(L + (off + i) * bw + 1).toFixed(1)}" y="${y.toFixed(1)}" width="${(bw - 2).toFixed(1)}" height="${h.toFixed(1)}" rx="1.5" fill="${k.col}"/>`; }); });
  const tot = bk.reduce((a, b) => a + Object.values(b).reduce((x, v) => x + v, 0), 0), secs = Math.max(30, Math.min(300, bk.length * 5));
  const c = $('#chart'), sig = bk.length + ':' + sums.join(',') + ':' + top;
  if (c && !(c.firstChild && (c.dataset.sig === sig || Date.now() - (+c.dataset.at || 0) < 6000))) { c.dataset.at = Date.now(); c.dataset.sig = sig; c.innerHTML = `<svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="Experience gained over the last five minutes">${g}${bars}<text x="${L}" y="${H - 2}">5 min ago</text><text x="${W}" y="${H - 2}" text-anchor="end">now</text></svg>`; }
  const xph = $('#xph'); if (xph) UI.set(xph, `${DQ.fmt(tot / secs * 3600)} XP / hr`);
};
})();

(() => {
const DQ = window.DQ, D = DQ.data, UI = DQ.ui, S = () => DQ.S, { ico, fmt } = DQ;
UI.petBadge = () => { const p = S().pets.active && D.PET[S().pets.active]; return p ? `<button class="hud-pet" data-do="petpet" data-tip="text:${p.name} the ${p.kind.toLowerCase()}. ${p.text}. Click to give them a pat.">${DQ.petSprite(p, 34, 'bob')}</button>` : ''; };
UI.homestead = () => {
  if (!DQ.skillUnlocked('farming')) return '';
  const F = S().farm, ripe = F.plots.filter(p => DQ.plotRipe(p)).length, growing = F.plots.filter(p => p.crop && !DQ.plotRipe(p)).length, stored = F.animals.reduce((a, x) => a + x.stored, 0);
  const w = S().workers.filter(x => x.task && !x.unpaid).length;
  return `<section class="panel"><div class="phead"><h2>Homestead</h2><button class="btn sm" data-do="go" data-a="farming">Open farm</button></div><div class="homestats">
    <div class="${ripe ? 'hot' : ''}">${ico('crop')}<b class="mono">${ripe}</b><small>ready to harvest</small></div><div>${ico('seed')}<b class="mono">${growing}</b><small>growing</small></div>
    <div class="${stored ? 'hot' : ''}">${ico('egg')}<b class="mono">${stored}</b><small>produce to collect</small></div><div>${ico('users')}<b class="mono">${w}</b><small>workers working</small></div></div></section>`;
};
})();
