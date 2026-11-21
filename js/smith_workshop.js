/* Idlewick: Smithing's own workshop (owner, 22 Nov 2026: "Smithing upgrades should be different anvils that require
   alloys to upgrade and also different hammers. They should give two different buff types").
   Two ladders replace Smithing's generic workshop ranks on the shop shelf:
   - Anvils, cast from bars: a truer, heavier face means fewer blows per piece, so Smithing is faster (DQ.extraSpeed).
   - Hammers, forged from bars on a hardwood haft: a balanced head lands clean strikes, sometimes enough to finish a
     second piece from the same heat (a chance of double output, DQ.dblChance).
   Each rank needs its Smithing level, the previous rank, coins and bars of that alloy, and saves atomically (rolled
   back if the save fails). Owned ranks live in S.smithGear {anvil, hammer}. A save that bought the old Smithing
   workshop ranks keeps their XP bonus (shop_skill_updates.js still reads S.skillUpgrades); they are simply no longer
   sold for Smithing. */
(() => {
const Q = window.DQ, D = Q.data, UI = Q.ui, S = () => Q.S, { esc, ico } = Q;
const METALS = [['bronze', 'Bronze', '#b98d4e', 1], ['iron', 'Iron', '#8b9096', 15], ['steel', 'Steel', '#8fa7c0', 30], ['mithril', 'Mithril', '#6c7fe0', 50], ['adamant', 'Adamant', '#4fbf7a', 70], ['rune', 'Runic', '#46c8d8', 85]];
const HAFT = ['log_normal', 'log_oak', 'log_willow', 'log_maple', 'log_yew', 'log_magic'];
D.SMITH_GEAR = {
  anvil: { name: 'anvil', label: 'Anvils', buff: 'faster Smithing', per: [.04, .08, .12, .16, .20, .25],
    purpose: m => `A ${m.toLowerCase()} anvil has a harder, truer face: metal moves further with each blow, so every piece needs fewer strikes.` },
  hammer: { name: 'hammer', label: 'Hammers', buff: 'chance to make two', per: [.03, .06, .09, .12, .15, .20],
    purpose: m => `A balanced ${m.toLowerCase()} hammer head lands clean, even strikes. Now and then the heat lasts long enough to finish a second piece.` }
};
D.SMITH_GEAR.anvil.cost = i => ({ coins: [150, 1200, 6000, 20000, 60000, 150000][i], ['bar_' + METALS[i][0]]: [10, 20, 30, 40, 50, 60][i] });
D.SMITH_GEAR.hammer.cost = i => ({ coins: [100, 900, 4500, 15000, 45000, 120000][i], ['bar_' + METALS[i][0]]: [4, 8, 12, 16, 20, 25][i], [HAFT[i]]: 5 });
const owned = kind => (S().smithGear || {})[kind] || 0;
Q.smithGearName = (kind, rank) => `${METALS[rank - 1][1]} ${D.SMITH_GEAR[kind].name}`;
Q.smithGear = (kind, rank) => {
  const g = D.SMITH_GEAR[kind], have = owned(kind), next = rank == null ? have + 1 : rank, valid = Number.isInteger(next) && next >= 1 && next <= METALS.length;
  if (!valid) return { kind, rank: have, next, valid: false, ready: false, cost: {} };
  const need = METALS[next - 1][3], cost = g.cost(next - 1), afford = Object.entries(cost).every(([id, n]) => id === 'coins' ? S().coins >= n : Q.have(id) >= n);
  return { kind, rank: have, next, valid, need, cost, value: g.per[next - 1], previous: next - 1, ready: next === have + 1 && Q.skillUnlocked('smithing') && Q.lvl('smithing') >= need && afford };
};
Q.buySmithGear = (kind, rank) => {
  if (!D.SMITH_GEAR[kind] || Q.forecasting || (Q.sim && Q.sim.on)) return false;
  const st = Q.smithGear(kind, rank); if (!st.ready) return false;
  const before = JSON.parse(JSON.stringify(S()));
  S().coins -= st.cost.coins; for (const [id, n] of Object.entries(st.cost)) if (id !== 'coins') Q.take(id, n);
  (S().smithGear ||= {})[kind] = st.next;
  if (!Q.save()) { Q.S = before; if (Q.xpAliases) Q.xpAliases(Q.S); if (Q.fxDirty) Q.fxDirty(); return false; }
  if (Q.fxDirty) Q.fxDirty(); if (Q.sfx) Q.sfx('buy'); Q.emit('shop'); return true;
};
/* the effects, through the shared hooks */
const sp0 = Q.extraSpeed; Q.extraSpeed = sk => (sp0 ? sp0(sk) : 0) + (sk === 'smithing' && owned('anvil') ? D.SMITH_GEAR.anvil.per[owned('anvil') - 1] : 0);
const db0 = Q.dblChance; Q.dblChance = sk => (db0 ? db0(sk) : 0) + (sk === 'smithing' && owned('hammer') ? D.SMITH_GEAR.hammer.per[owned('hammer') - 1] : 0);
/* Smithing's shelf counts as ready when either ladder can be bought (menu dots, the skill nav badge) */
const sc0 = Q.skillCommission;
Q.skillCommission = (sk, sel) => sk === 'smithing' && sel == null ? Object.assign(sc0(sk, sel), { ready: Q.smithGear('anvil').ready || Q.smithGear('hammer').ready }) : sc0(sk, sel);
/* art: a 16 x 16 anvil or hammer in the metal's own colour, shown at 4x */
const A = Q.pixelArt;
const sprite = (kind, i) => { const s = A.Spr(16, 16), m = A.ramp(METALS[i][2]), w = A.R && A.R.wood ? A.R.wood : A.ramp('#8a5a32');
  if (kind === 'anvil') { s.rect(2, 4, 12, 3, m); s.poly([[1, 4], [3, 4], [3, 6]], m); s.rect(5, 7, 6, 3, m); s.rect(3, 10, 10, 2, m); s.rect(2, 12, 12, 2, A.ramp('#5a5048')); s.line(3, 4, 13, 4, null, A.mix ? A.mix(METALS[i][2], '#ffffff', .5) : '#ffffff'); }
  else { s.line(3, 14, 10, 7, w); s.line(4, 14, 11, 7, w); s.rect(8, 2, 6, 5, m); s.rect(13, 3, 2, 3, m); s.line(8, 2, 13, 2, null, A.mix ? A.mix(METALS[i][2], '#ffffff', .5) : '#ffffff'); }
  if (i >= 3) s.fix(kind === 'anvil' ? 8 : 10, kind === 'anvil' ? 5 : 4, '#ffffff');
  return s; };
const art = (kind, i, size = 64) => A && A.url ? `<img class="pxa" src="${A.url(`smithgear:${kind}:${i}`, () => sprite(kind, i))}" width="${size}" height="${size}" alt="" style="image-rendering:pixelated">` : UI.activityIcon('smithing');
/* the shelf */
let pick = null; /* {kind, rank} */
const card = (kind, r) => { const st = Q.smithGear(kind, r), have = owned(kind), sel = pick && pick.kind === kind && pick.rank === r, g = D.SMITH_GEAR[kind];
  return `<button type="button" class="illustrated-card ${sel ? 'selected' : ''} ${r <= have ? 'owned' : ''}" data-do="smithgearpick" data-a="${kind}" data-b="${r}" aria-pressed="${sel}">${art(kind, r - 1)}<b>${esc(Q.smithGearName(kind, r))}</b><small>+${Math.round(g.per[r - 1] * 100)}% ${esc(g.buff)}</small><small>${r <= have ? 'Acquired' : st.ready ? 'Ready' : 'Lv ' + st.need}</small></button>`; };
const view = () => {
  const def = () => { for (const k of ['anvil', 'hammer']) if (owned(k) < METALS.length) return { kind: k, rank: owned(k) + 1 }; return { kind: 'anvil', rank: METALS.length }; };
  if (!pick) pick = def();
  const st = Q.smithGear(pick.kind, pick.rank), g = D.SMITH_GEAR[pick.kind], have = owned(pick.kind), name = Q.smithGearName(pick.kind, pick.rank);
  const show = r => !UI.shopAvailableOnly || r <= owned(pick.kind) || Q.lvl('smithing') >= METALS[r - 1][3];
  const shelf = k => `<h3 class="smith-shelf-h">${esc(D.SMITH_GEAR[k].label)} <small>${esc(D.SMITH_GEAR[k].buff)}</small></h3><div class="illustrated-choices commission-ranks smith-gear">${METALS.map((_, i) => i + 1).filter(r => !UI.shopAvailableOnly || r <= owned(k) || Q.lvl('smithing') >= METALS[r - 1][3]).map(r => card(k, r)).join('')}</div>`;
  const toggle = `<div class="shop-filter-row"><button class="filter-toggle ${UI.shopAvailableOnly ? 'on' : ''}" role="switch" aria-checked="${!!UI.shopAvailableOnly}" data-do="shopavailonly" data-tip="text:Hide ranks that need a Smithing level you haven't reached yet"><span class="ft-track" aria-hidden="true"><span class="ft-knob"></span></span><span>Available only</span><b>${UI.shopAvailableOnly ? 'On' : 'Off'}</b></button></div>`;
  const reqs = `<div class="commission-prerequisites"><span class="${Q.lvl('smithing') >= st.need ? 'ok' : 'bad'}">${UI.activityIcon('smithing')}<span>Smithing</span><b>${Q.lvl('smithing')} / ${st.need}</b></span>${st.previous ? `<span class="${have >= st.previous ? 'ok' : 'bad'}">${art(pick.kind, st.previous - 1, 32)}<span>${esc(Q.smithGearName(pick.kind, st.previous))}</span><b>${have >= st.previous ? 1 : 0} / 1</b></span>` : ''}</div>`;
  const detail = `<section class="panel shop-task"><div class="shop-detail-body"><div class="smith-gear-hero">${art(pick.kind, pick.rank - 1, 64)}<div><h2>${esc(name)}</h2><p>+${Math.round(st.value * 100)}% ${esc(g.buff)}${have && pick.rank > have ? ` <span class="dim">(now +${Math.round(g.per[have - 1] * 100)}%)</span>` : ''}</p></div></div><p class="upgrade-purpose">${esc(g.purpose(METALS[pick.rank - 1][1]))}</p><h3 class="commission-requirements-title">Requirements</h3>${reqs}${pick.rank <= have ? '<p class="ok">Acquired</p>' : UI.needTiles ? UI.needTiles(st.cost) : ''}</div><div class="shop-detail-actions"><span></span><button class="btn primary" data-do="buysmithgear" data-a="${pick.kind}" data-b="${pick.rank}" ${st.ready ? '' : 'disabled'}>${pick.rank <= have ? 'Acquired' : 'Upgrade to ' + esc(name)}</button></div></section>`;
  return { shelf: `${toggle}${shelf('anvil')}${shelf('hammer')}`, detail };
};
const shop0 = UI.V.shop;
UI.V.shop = () => {
  const raw = shop0(); if (!(UI.skillCommissionSelected === 'smithing' && UI.shopCategory === 'tools' && UI.shopTab === 'buy')) return raw;
  const t = document.createElement('template'); t.innerHTML = raw; const work = t.content.querySelector('.visual-shop'); if (!work) return raw;
  const nav = work.querySelector('.tool-families')?.outerHTML || '', v = view();
  work.outerHTML = `<div class="visual-shop"><section class="panel shop-stock">${nav}<h2>Smithing upgrades</h2>${v.shelf}</section>${v.detail}</div>`;
  return t.innerHTML;
};
let lastSpend = -Infinity;
Object.assign(UI.DO, {
  smithgearpick: (kind, r) => { if (!D.SMITH_GEAR[kind]) return; pick = { kind, rank: Math.max(1, Math.min(METALS.length, +r || 1)) }; UI.render(false); },
  buysmithgear: (kind, r) => { if (Date.now() - lastSpend < 500) return; lastSpend = Date.now(); if (Q.buySmithGear(kind, +r)) { const n = owned(kind); pick = n < METALS.length ? { kind, rank: n + 1 } : pick; Q.toast && Q.toast(`${Q.smithGearName(kind, n)} in the forge: +${Math.round(D.SMITH_GEAR[kind].per[n - 1] * 100)}% ${D.SMITH_GEAR[kind].buff}`); } UI.renderHud(); UI.render(false); }
});
/* the Smithing page shows what you forge with */
const hero0 = UI.skillHero;
if (hero0) UI.skillHero = (sk, extra = '') => { if (sk !== 'smithing') return hero0(sk, extra); const a = owned('anvil'), h = owned('hammer');
  const kit = `<span class="smith-kit" data-tip="text:${esc([a ? `${Q.smithGearName('anvil', a)}: +${Math.round(D.SMITH_GEAR.anvil.per[a - 1] * 100)}% faster` : 'No anvil upgrade yet', h ? `${Q.smithGearName('hammer', h)}: +${Math.round(D.SMITH_GEAR.hammer.per[h - 1] * 100)}% chance to make two` : 'No hammer upgrade yet'].join(' · '))}">${a ? art('anvil', a - 1, 32) : ''}${h ? art('hammer', h - 1, 32) : ''}</span>`;
  return hero0(sk, extra + ((a || h) ? kit : '')); };
})();
/* Hero → Tools lists everything you own that makes a skill better: gathering tools, then your workshop (anvil, hammer
   and each skill's workshop rank), each with a link to its shop shelf (22 Nov 2026 layout pass). */
(() => {
const Q = window.DQ, D = Q.data, UI = Q.ui, S = () => Q.S, { esc } = Q;
const v0 = UI.V.tools;
UI.V.tools = () => {
  const a = (S().smithGear || {}).anvil || 0, h = (S().smithGear || {}).hammer || 0, ranks = S().skillUpgrades || {};
  const row = (art, name, line, sk) => `<div class="toolrow" style="--c:${D.SK[sk].col}"><span class="ti">${art}</span><div class="tb"><b>${esc(name)}</b><small>${esc(line)}</small></div><button class="btn sm" data-do="skillupgrades" data-a="${sk}">Upgrade</button></div>`;
  const smith = [a ? row(UI.activityIcon('smithing'), Q.smithGearName('anvil', a), `+${Math.round(D.SMITH_GEAR.anvil.per[a - 1] * 100)}% faster Smithing`, 'smithing') : row(UI.activityIcon('smithing'), 'No anvil upgrade', 'Smithing · normal speed', 'smithing'),
    h ? row(UI.activityIcon('smithing'), Q.smithGearName('hammer', h), `+${Math.round(D.SMITH_GEAR.hammer.per[h - 1] * 100)}% chance to make two`, 'smithing') : row(UI.activityIcon('smithing'), 'No hammer upgrade', 'Smithing · one piece at a time', 'smithing')];
  const others = Object.entries(ranks).filter(([sk, r]) => r > 0 && D.SK[sk] && D.SKILL_COMMISSIONS && D.SKILL_COMMISSIONS[sk] && sk !== 'smithing').map(([sk, r]) => row(UI.activityIcon(sk), `${D.SKILL_COMMISSIONS[sk].name} ${r}`, `+${r * 3}% ${D.SK[sk].name} XP`, sk));
  return v0() + `<section class="panel toolsp workshop-tools"><h3>Workshop</h3><p class="hint">Upgrades for making things. Bought in the shop under each skill.</p><div class="toolrows">${smith.join('')}${others.join('')}</div></section>`;
};
})();
