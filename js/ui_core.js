/* Idlewick: UI core. Navigation, HUD, binders, tooltips, portrait, overview, skill pages, combat. */
(() => {
const DQ = window.DQ, D = DQ.data, { $, $$, ico, fmt, fmtK, esc, clamp } = DQ;
const S = () => DQ.S;
const UI = DQ.ui = { view: 'overview', tab: {}, V: {}, after: {}, sel: null, resetArmed: false };
const set = (e, v) => { v = String(v); if (e.textContent !== v) e.textContent = v; };
const itm = (id, n) => { const it = D.ITEMS[id]; return `<span class="itm ${it.rare ? 'rare' : ''}" style="--c:${it.col}" data-tip="item:${id}">${DQ.itemIco(it)}${n ? `<b class="mono">${fmtK(n)}</b>` : ''}</span>`; };
UI.itm = itm; UI.set = set;
UI.statLine = b => Object.entries(b || {}).filter(([, v]) => v).map(([k, v]) => `${{ atk: 'Atk', str: 'Str', def: 'Def', rng: 'Rng', rngStr: 'Rng Str', mag: 'Mag' }[k]} +${v}`).join(' · ');
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
UI.collectProg = () => { progEls = $$('[data-prog]'); };
const progOf = key => { const a = DQ.act; if (!a) return 0; if (key !== '@' && key !== a.kind + ':' + a.id) return 0; return clamp((Date.now() - a.t0) / a.dur, 0, 1); };
UI.frame = () => {
  for (const e of progEls) { const p = progOf(e.dataset.prog); if (e.dataset.ring) e.style.strokeDashoffset = 289 * (1 - p); else e.style.width = (p * 100) + '%'; }
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

/* ---------- Gather pages (fishing, woodcutting, mining, thieving) ---------- */
const KIND_OF = { fishing: 'fish', woodcutting: 'wood', mining: 'mine', thieving: 'thieve' };
UI.V.gather = sk => {
  const kind = KIND_OF[sk], town = S().town, all = D.NODES[kind], here = all.filter(n => n.town === town);
  const cards = here.map((n, i) => {
    const locked = DQ.lvl(sk) < n.lvl, on = DQ.act && DQ.act.kind === kind && DQ.act.id === n.id;
    const ch = Math.round(DQ.successChance(kind, n) * 100), secs = (DQ.durFor(kind, n.id) / 1000).toFixed(1), x = (n.xp * DQ.xpMult(sk)).toFixed(n.xp * DQ.xpMult(sk) < 100 ? 1 : 0);
    const yields = kind === 'thieve' ? `<span class="mono">${n.cmin}-${n.cmax}</span> coins` : `<span class="mono" data-b="count:${n.item}"></span> held`;
    return `<button class="card ${locked ? 'locked' : ''} ${on ? 'active' : ''}" style="--c:${n.col};--i:${i}" data-do="act" data-a="${kind}" data-b="${n.id}">
      <span class="ico">${ico(kind === 'thieve' ? 'thieving' : D.ITEMS[n.item].ic)}</span>
      <span class="meta"><b>${n.name}</b><small>Lv ${n.lvl} · ${x} XP · ${secs}s · ${ch}%</small></span>
      <span class="own">${locked ? `Requires ${D.SK[sk].name} ${n.lvl}` : yields}${kind === 'thieve' && !locked ? ` · risk ${n.dmg} dmg` : ''}</span>
      <span class="go">${locked ? 'Locked' : on ? 'Stop' : 'Start'}</span><span class="progw"><i data-prog="${kind}:${n.id}"></i></span></button>`;
  }).join('');
  const others = D.TOWNS.filter(t => t.id !== town).map(t => {
    const ns = all.filter(n => n.town === t.id); if (!ns.length) return '';
    const open = DQ.townUnlocked(t.id);
    return `<div class="elsewhere ${open ? '' : 'dim'}"><span>${ico(open ? 'pin' : 'lock')} <b>${t.name}</b></span><span>${open ? ns.map(n => n.name).join(', ') : `${ns.length} more spot${ns.length > 1 ? 's' : ''}. Reach ${t.name} to unlock`}</span>${open ? `<button class="btn sm" data-do="go" data-a="map">Travel</button>` : ''}</div>`;
  }).join('');
  return `${UI.skillHero(sk, UI.toolLine(sk))}
    <section class="panel"><div class="phead"><h2>${D.TOWN[town].name}</h2><small>${here.length} ${sk === 'thieving' ? 'targets' : 'spots'} here · click one to start, click again to stop</small></div>
    ${here.length ? `<div class="cards">${cards}</div>` : `<p class="dim">Nothing to ${sk === 'fishing' ? 'fish' : sk === 'woodcutting' ? 'chop' : sk === 'mining' ? 'mine' : 'steal'} here. Try another town.</p>`}</section>
    <section class="panel"><div class="phead"><h2>Elsewhere</h2><small>Travel to find more</small></div><div class="elsewheres">${others}</div></section>`;
};

/* ---------- Recipe pages (cooking, smithing, crafting) ---------- */
UI.V.recipes = sk => {
  const list = D.RLIST[sk], tabs = [...new Set(list.map(r => r.tab))];
  const tab = UI.tab[sk] = tabs.includes(UI.tab[sk]) ? UI.tab[sk] : tabs[0], only = UI.tab[sk + 'ready'];
  const rs = list.filter(r => r.tab === tab && (!only || DQ.canMake(r))).sort((a, b) => a.lvl - b.lvl);
  const cards = rs.map((r, i) => {
    const locked = DQ.lvl(sk) < r.lvl, on = DQ.act && DQ.act.kind === 'recipe' && DQ.act.id === r.id, outId = Object.keys(r.out)[0], it = D.ITEMS[outId];
    const x = (r.xp * DQ.xpMult(sk)).toFixed(r.xp * DQ.xpMult(sk) < 100 ? 1 : 0);
    const stat = it.b ? UI.statLine(it.b) : it.heal ? `heals ${it.heal}` : '';
    const ings = Object.entries(r.in).map(([k, n]) => `<span class="ing" data-tip="item:${k}">${ico(D.ITEMS[k].ic)}<i class="mono" data-b="ing:${k}:${n}"></i> ${D.ITEMS[k].name.replace(/ ore$/, '').toLowerCase()}</span>`).join('');
    return `<button class="card recipe ${locked ? 'locked' : ''} ${on ? 'active' : ''}" style="--c:${it.col};--i:${i}" data-do="act" data-a="recipe" data-b="${r.id}">
      <span class="ico" data-tip="item:${outId}">${DQ.itemIco(it)}</span>
      <span class="meta"><b>${r.name}</b><small>Lv ${r.lvl} · ${x} XP · ${(DQ.durFor('recipe', r.id) / 1000).toFixed(1)}s${r.burn ? ` · burns ${Math.round(DQ.burnChance(r) * 100)}%` : ''}</small>${stat ? `<small class="statsm">${stat}</small>` : ''}</span>
      <span class="own">${locked ? `Requires ${D.SK[sk].name} ${r.lvl}` : ings}</span>
      <span class="go">${locked ? 'Locked' : on ? 'Stop' : sk === 'cooking' ? 'Cook' : sk === 'smithing' ? 'Smith' : 'Craft'}</span><span class="progw"><i data-prog="recipe:${r.id}"></i></span></button>`;
  }).join('');
  return `${UI.skillHero(sk)}
    <section class="panel"><div class="phead"><div class="tabs">${tabs.length > 1 ? tabs.map(t => `<button class="tab ${t === tab ? 'on' : ''}" data-do="tab" data-a="${sk}" data-b="${t}">${t}</button>`).join('') : `<h2>Recipes</h2>`}</div>
      <button class="tog ${only ? 'on' : ''}" data-do="readyonly" data-a="${sk}"><span class="sw"></span>Ready to make</button></div>
    ${rs.length ? `<div class="cards">${cards}</div>` : `<p class="dim">${only ? 'Nothing here can be made with your current materials. Check the bank, or gather more.' : 'No recipes.'}</p>`}
    <p class="hint">Tasks keep going while you have materials. They draw from your backpack first, then your bank.</p></section>`;
};

/* ---------- Magic page ---------- */
UI.V.magic = () => {
  const tab = UI.tab.magic = UI.tab.magic || 'Alchemy', l = DQ.lvl('magic'), al = DQ.alchSpell();
  let body = '';
  if (tab === 'Alchemy') {
    const ids = Object.keys({ ...S().inv, ...S().bank }).filter(id => D.ITEMS[id].val >= 8 && !DQ.isEquipped(id) && D.ITEMS[id].type !== 'food' && id !== 'rune').sort((a, b) => D.ITEMS[b].val - D.ITEMS[a].val).slice(0, 40);
    body = !al ? `<p class="dim">Alchemy unlocks at Magic ${D.ALCH[0].lvl}. Until then, cast spells in combat to train Magic: equip a staff and head to the Combat page.</p>` :
      `<p class="hint">${al.name}: turns one item into <b>${al.mult}×</b> its sale value in coins, using ${al.runes} Arcane runes. You have <b class="mono" data-b="runes"></b> runes.</p><div class="cards">${ids.length ? ids.map((id, i) => {
        const it = D.ITEMS[id], on = DQ.act && DQ.act.kind === 'alch' && DQ.act.id === id;
        return `<button class="card ${on ? 'active' : ''}" style="--c:${it.col};--i:${i}" data-do="act" data-a="alch" data-b="${id}"><span class="ico">${ico(it.ic)}</span><span class="meta"><b>${it.name}</b><small>${fmt(Math.round(it.val * al.mult))} coins each</small></span><span class="own"><span class="mono" data-b="count:${id}"></span> held</span><span class="go">${on ? 'Stop' : 'Cast'}</span><span class="progw"><i data-prog="alch:${id}"></i></span></button>`;
      }).join('') : '<p class="dim">You have nothing worth transmuting right now.</p>'}</div>`;
  } else {
    body = `<p class="hint">Spells are cast automatically in combat while you wield a <b>staff</b>. Each cast uses Arcane runes (<b class="mono" data-b="runes"></b> held). The best spell you can afford is used if your selected one is out of reach.</p><div class="spells">${D.SPELLS.map(sp => {
      const ok = l >= sp.lvl, sel = S().spell === sp.id;
      return `<button class="spell ${ok ? '' : 'locked'} ${sel ? 'on' : ''}" ${ok ? `data-do="spell" data-a="${sp.id}"` : 'disabled'} style="--c:#6f7cf0">${ico('magic')}<b>${sp.name}</b><small class="mono">Lv ${sp.lvl} · max ${sp.max} · ${sp.runes} rune${sp.runes > 1 ? 's' : ''}</small>${sel ? '<span class="tag">Selected</span>' : ''}</button>`;
    }).join('')}</div>`;
  }
  return `${UI.skillHero('magic')}<section class="panel"><div class="phead"><div class="tabs">${['Alchemy', 'Spellbook'].map(t => `<button class="tab ${t === tab ? 'on' : ''}" data-do="tab" data-a="magic" data-b="${t}">${t}</button>`).join('')}</div></div>${body}</section>`;
};

/* ---------- Combat page ---------- */
UI.foodChips = () => {
  const foods = DQ.foods();
  return foods.length ? foods.map(id => { const it = D.ITEMS[id]; return `<button class="chip" style="--c:${it.col}" data-do="eat" data-a="${id}" data-tip="item:${id}">${ico(it.ic)}${it.name} <b class="mono" data-b="count:${id}"></b><small class="mono">+${it.heal}</small></button>`; }).join('') : `<p class="dim sm">No food. Cook fish, or buy bread from the shop.</p>`;
};
UI.V.combat = () => {
  const town = S().town, mons = D.MONLIST.filter(m => m.town === town), boss = mons.find(m => m.boss), regular = mons.filter(m => !m.boss);
  const f = DQ.act && DQ.act.kind === 'fight' ? D.MON[DQ.act.id] : null, st = DQ.weaponStyle(), ps = DQ.pstats(), sty = S().style;
  const foe = f ? `<div class="avatar ${f.boss ? 'boss' : ''}" id="av-foe" style="--c:${f.col}">${DQ.monSprite(f, 64, 'bob')}</div><div class="nm">${esc(f.name)} <span class="lvchip ${f.cl - DQ.combatLvl() <= 3 ? 'easy' : f.cl - DQ.combatLvl() <= 14 ? 'fair' : 'hard'}">Lv ${f.cl}</span></div><span class="bar hpb"><i data-b="fhp"></i></span><small class="mono" data-b="fhptxt"></small>`
    : `<div class="avatar idle" id="av-foe" style="--c:#4a5a5e">?</div><div class="empty-foe">Choose a target to start fighting.</div>`;
  const stances = st === 'melee' ? [['accurate', 'Accurate', 'attack'], ['aggressive', 'Aggressive', 'strength'], ['defensive', 'Defensive', 'defence']] : [['offense', 'Offensive', st === 'ranged' ? 'ranged' : 'magic'], ['defensive', 'Defensive', st === 'ranged' ? 'ranged + defence' : 'magic + defence']];
  const cur = sty[st];
  const wname = S().equip.weapon ? D.ITEMS[S().equip.weapon].name : 'Bare hands';
  const card = (m, i) => {
    const d = m.cl - DQ.combatLvl(), tag = d <= 3 ? 'easy' : d <= 14 ? 'fair' : 'hard', on = f && f.id === m.id;
    return `<button class="card ${on ? 'active' : ''}" style="--c:${m.col};--i:${i}" data-do="act" data-a="fight" data-b="${m.id}" data-tip="mon:${m.id}"><span class="ico sprite">${DQ.monSprite(m, 40)}</span>
      <span class="meta"><b>${esc(m.name)}</b><small><span class="lvchip ${tag}">Lv ${m.cl}</span> ${d > 0 ? `${d} above you` : d < 0 ? `${-d} below you` : 'same as you'} · ${DQ.knows(m, 'vitals') ? `${m.hp} health · max ${m.max} · ${m.coins[1] ? m.coins[0] + '-' + m.coins[1] + ' coins' : 'no coins'}` : 'vitals unknown'}</small></span>
      <span class="own"><span class="tag ${tag}" data-tip="text:${{ easy: 'Easy: their level is no more than 3 above yours', fair: 'Fair: a real fight. Bring food', hard: 'Hard: much stronger than you. Level up or upgrade gear first' }[tag]}">${tag}</span>${UI.weakChips(m)}<span class="gbtn" role="button" data-do="guide" data-a="${m.id}" data-tip="text:Open the field guide entry">${ico('book')}</span></span><span class="go">${on ? 'Flee' : 'Fight'}</span><span class="progw"><i data-prog="fight:${m.id}"></i></span></button>`;
  };
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
  return `<div class="cb"><div class="col">
    ${clvl}
    <section class="panel"><div class="phead"><h2>${D.TOWN[town].name} monsters</h2><small>Easy, fair and hard compare to your combat level of <b class="mono" data-b="combat"></b></small></div><div class="cards">${regular.map(card).join('')}</div></section>
    ${bossCard}
    <section class="panel arena"><div class="side"><div class="splats" id="sp-you"></div><div class="avatar you" id="av-you">${UI.portrait(80)}</div><div class="nm">${esc(S().name)} <span class="lvchip you">Combat ${DQ.combatLvl()}</span></div><span class="bar hpb"><i data-b="hpbar"></i></span><small class="mono" data-b="hptxt"></small></div>
      <div class="mid"><span class="vs">vs</span><span class="bar prog" style="--c:var(--brass)"><i data-prog="@"></i></span></div>
      <div class="side"><div class="splats" id="sp-foe"></div>${foe}</div></section>
    ${UI.lootPanel()}
  </div>
    <div class="col">
    <section class="panel"><div class="phead"><h2>Loadout</h2><small class="mono">Max hit ${ps.max}</small></div>
      <div class="loadout"><div>${ico(st === 'ranged' ? 'bow' : st === 'magic' ? 'staff' : 'sword')} <b>${esc(wname)}</b> <span class="tag">${st}</span></div>${UI.weaponLine()}
      ${st === 'ranged' ? `<div class="sm dim">Ammo: <span data-b="ammo"></span></div>` : ''}${st === 'magic' ? `<div class="sm dim">Spell: <b>${ps.spell.name}</b> · Runes: <span class="mono" data-b="runes"></span></div>` : ''}</div>
      <div class="k" style="margin:12px 0 6px" data-tip="text:Decides which skill your fighting trains">Training focus</div><div class="styles s${stances.length}">${stances.map(([k, n, sk]) => `<button class="chip ${cur === k ? 'on' : ''}" data-do="style" data-a="${st}" data-b="${k}"><b>${n}</b><small>${sk} XP</small></button>`).join('')}</div>
      <div style="margin-top:14px;display:flex;flex-direction:column;gap:8px"><button class="tog ${S().settings.autoEat ? 'on' : ''}" data-do="autoeat"><span class="sw"></span>Eat automatically at ${S().settings.eatAt}% health</button>
      <div class="seg eatseg">${[30, 40, 50, 60, 70].map(p => `<button class="${S().settings.eatAt === p ? 'on' : ''}" data-do="eatat" data-a="${p}">${p}%</button>`).join('')}</div></div></section>
    ${UI.abilityPanel()}
    <section class="panel"><div class="phead"><h2>Food</h2><small>Click to eat</small></div><div class="chips" id="foodbox">${UI.foodChips()}</div></section>
    <section class="panel"><div class="phead"><h2>Combat skills</h2><small>What each one does</small></div><div class="tiles two">${['attack', 'strength', 'defence', 'ranged', 'hitpoints'].map((k, i) => { const d = { attack: 'Chance to hit', strength: `Hit harder · max hit ${ps.max}`, defence: `Dodge and armour · blocks ${Math.round(ps.red * 100)}%`, ranged: 'Bows: hit chance and damage', hitpoints: 'Your health' }[k]; return UI.tile(k, i).replace(/<\/button>\s*$/, `<small class="tiledesc">${d}</small></button>`); }).join('')}</div>
      <details class="howfight"><summary>How fighting works</summary><ul><li><b>Attack</b> decides whether your swing lands. <b>Strength</b> decides how much damage it does, up to your <b>max hit</b>.</li><li><b>Defence</b> and your armour make monsters miss you and take some of the sting out of what hits.</li><li>The <b>Training focus</b> you pick above decides which of these skills earns XP.</li><li>Your <b>combat level</b> combines Defence, Health and your best fighting style. The Easy / Fair / Hard tags compare a monster's level with it.</li></ul></details></section></div></div>`;
};
UI.tile = (sk, i = 0) => {
  const s = D.SK[sk], locked = !DQ.skillUnlocked(sk);
  return `<button class="tile ${locked ? 'locked' : ''}" data-skill="${sk}" style="--c:${s.col};--i:${i}" data-do="go" data-a="${s.page}" data-tip="skill:${sk}"><span class="t-ic">${ico(locked ? 'lock' : sk)}</span>${locked ? `<span class="t-lv mono sm">${s.quest ? '★ Quest' : 'Lv ' + s.unlock}</span>` : `<span class="t-lv mono" data-b="lvl:${sk}"></span>`}<span class="t-nm">${s.name}</span><span class="bar"><i ${locked ? '' : `data-b="xpbar:${sk}"`}></i></span><span class="t-xp mono">${locked ? (s.quest ? 'Main quest: ' + s.questName : 'Hero level ' + s.unlock) : ''}<span ${locked ? '' : `data-b="toNext:${sk}"`}></span></span></button>`;
};

UI.renderLog = () => {
  const el = $('#loglist'); if (!el) return;
  el.innerHTML = S().log.slice(0, 14).map(l => { const d = new Date(l.t); return `<li class="${l.k}"><time>${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}</time><span>${l.m}</span></li>`; }).join('') || `<li><time></time><span class="dim">Your adventures will be written here.</span></li>`;
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
