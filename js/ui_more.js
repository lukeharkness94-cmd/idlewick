/* Idlewick: pinned quest tracker, skill guides, clearer levelling. */
(() => {
const DQ = window.DQ, D = DQ.data, UI = DQ.ui, { $, $$, ico, fmt, esc, clamp } = DQ;
const S = () => DQ.S;

/* ---------- What each skill is for ---------- */
D.SKILL_GUIDE = {
  fishing: ['Catch fish.', ['Cook into healing food', 'Sell for coins'], ['cooking']],
  woodcutting: ['Chop logs.', ['Bows, staves, shields', 'Furniture and planks'], ['crafting']],
  mining: ['Mine ore and gems.', ['Smelt into bars', 'Gems for jewellery and enchanting'], ['smithing', 'crafting']],
  thieving: ['Pickpocket for coins.', ['Failing costs health', 'Cheaper shops, richer chests'], []],
  farming: ['Grow crops, raise animals.', ['Best food ingredients', 'Grows while you do other things'], ['cooking']],
  cooking: ['Cook food.', ['Food heals in combat', 'Higher level: fewer burns'], ['hitpoints']],
  smithing: ['Smelt bars, forge gear.', ['Melee weapons and armour', 'Arrows and tools'], ['attack', 'defence']],
  crafting: ['Leather, bows, staves, jewellery.', ['Ranged and Magic gear', 'Rings and amulets'], ['ranged', 'magic']],
  magic: ['Spells with a staff. Alchemy for coins.', ['Elements hit weaknesses', 'Uses Arcane runes'], []],
  melee: ['Swords, daggers, hammers.', ['Levels as you fight with them', 'Unlocks melee weapons'], []],
  defence: ['Enemies miss more. Unlocks armour.', ['Levels in the Defensive stance'], []],
  ranged: ['Bows and arrows.', ['Levels as you fight with a bow', 'Uses arrows'], []],
  hitpoints: ['Max health.', ['Levels as you deal damage', 'Food and resting restore it'], []],
};
const guideHtml = sk => {
  const g = D.SKILL_GUIDE[sk]; if (!g) return '';
  const feeds = g[2].filter(x => D.SK[x]).map(x => `<button class="chip sm" style="--c:${D.SK[x].col}" data-do="go" data-a="${D.SK[x].page}">${ico(x)}${D.SK[x].name}</button>`).join('');
  return `<div class="guide"><div><span class="k">What it is</span><p>${g[0]}</p></div><div><span class="k">Why train it</span><ul>${g[1].map(x => `<li>${x}</li>`).join('')}</ul></div>${feeds ? `<div><span class="k">Leads to</span><div class="chips">${feeds}</div></div>` : ''}</div>`;
};
UI.skillGuide = guideHtml;
const origHero = UI.skillHero;
UI.skillHero = (sk, extra = '') => {
  const h = origHero(sk, extra), i = h.lastIndexOf('</section>');
  return h.slice(0, i) + `<div class="sh-level"><span class="lvbig"><span class="k">Level</span><b class="mono" data-b="lvl:${sk}"></b></span><div class="lvbar"><span class="bar big"><i data-b="xpbar:${sk}"></i></span><div class="sh-line mono"><span data-b="toNext:${sk}"></span><span data-b="eta:${sk}"></span></div></div></div>` + guideHtml(sk) + h.slice(i);
};
const origTip = DQ.tips.skill;
DQ.tips.skill = sk => { const g = D.SKILL_GUIDE[sk]; return (DQ.tips.rail ? DQ.tips.rail(sk) : origTip(sk)) + (g ? `<div class="dim" style="margin-top:6px">${g[0]}</div>` : ''); };
UI.B.eta = (e, sk) => {
  const rate = DQ.hist.slice(-12).reduce((a, b) => a + (b[sk] || 0), 0) / (Math.min(12, DQ.hist.length) * 5000);
  const L = DQ.lvl(sk); if (L >= 99) return UI.set(e, '');
  const need = D.XPF[L + 1] - S().xp[sk];
  UI.set(e, rate > 0 ? `level ${L + 1} in about ${DQ.fmtTime(need / rate)}` : 'train it to see time to next level');
};

/* ---------- Pinned quests ---------- */
const PAGE_OF = { catch: 'fishing', chop: 'woodcutting', mine: 'mining', thieve: 'thieving', cook: 'cooking', smelt: 'smithing', smith: 'smithing', craft: 'crafting', harvest: 'farming', collect: 'farming', pet: 'farming', visit: 'map' };
DQ.objPage = (q, o) => {
  if (PAGE_OF[o.ev]) return PAGE_OF[o.ev];
  if (o.ev === 'kill' || o.ev === 'boss') return q.town === S().town ? 'combat' : 'map';
  if (o.ev === 'level') return D.SK[o.key].page;
  if (o.ev === 'deliver') { const k = o.key; if (k.startsWith('log_')) return 'woodcutting'; if (k.startsWith('ore_') || k.startsWith('gem_')) return 'mining'; if (k.startsWith('raw_')) return 'fishing'; if (k.startsWith('crop_') || ['egg', 'milk', 'wool'].includes(k)) return 'farming'; if (D.FISH_IDS.includes(k)) return 'cooking'; if (k.startsWith('bar_')) return 'smithing'; return 'combat'; }
  return 'quests';
};
const pinIds = () => {
  const P = (S().pins || []).filter(id => D.QM[id] && DQ.questState(D.QM[id]) !== 'done'); S().pins = P;
  if (P.length) return { ids: P, suggest: false };
  const nx = D.QUESTS.find(q => q.main && DQ.questState(q) === 'new') || D.QUESTS.find(q => DQ.questState(q) === 'new');
  return { ids: nx ? [nx.id] : [], suggest: true };
};
UI.renderPins = () => {
  const box = $('#pins'); if (!box) return;
  const { ids, suggest } = pinIds();
  if (!ids.length) { box.innerHTML = ''; return; }
  box.innerHTML = `<div class="pinbar">${ids.map(id => {
    const q = D.QM[id], st = DQ.questState(q), p = S().q[id], i = q.obj.findIndex((o, j) => DQ.objProg(q, p, j) < o.n), o = q.obj[Math.max(0, i)];
    const sk = q.main && D.SK[q.unlocks];
    const btn = st === 'new' ? `<button class="btn sm primary" data-do="qstart" data-a="${id}">Accept</button>` : st === 'ready' ? `<button class="btn sm primary" data-do="qclaim" data-a="${id}">Claim</button>` : `<button class="btn sm" data-do="go" data-a="${DQ.objPage(q, o)}">Go ${ico('arrow')}</button>`;
    return `<div class="pin ${q.main ? 'main' : ''} ${st}" style="${sk ? `--c:${sk.col}` : ''}"><button class="pin-t" data-do="openquest" data-a="${id}">${q.main ? ico('star') : ico('quest')}<b>${q.name}</b>${suggest ? '<small>Suggested</small>' : ''}</button>
      <div class="pin-o"><span class="sm">${st === 'ready' ? 'All done! Claim your reward.' : st === 'new' ? `${q.giver}, ${D.TOWN[q.town].name}${sk ? ` · teaches ${sk.name}` : ''}` : o.label}</span>${st === 'active' ? `<span class="pin-p"><span class="bar"><i data-b="qbar:${id}:${i}"></i></span><small class="mono" data-b="qtxt:${id}:${i}"></small></span>` : ''}</div>
      ${btn}${suggest ? '' : `<button class="pin-x" data-do="unpin" data-a="${id}" aria-label="Unpin" data-tip="text:Unpin">${ico('close')}</button>`}</div>`;
  }).join('')}</div>`;
  UI.upd();
};
let pinSig = '';
DQ.on('ui', () => { const s = JSON.stringify([S().pins, D.QUESTS.map(q => DQ.questState(q)[0]).join(''), (S().pins || []).map(id => { const q = D.QM[id], p = S().q[id]; return q ? q.obj.findIndex((o, j) => DQ.objProg(q, p, j) < o.n) : 0; })]); if (s !== pinSig) { pinSig = s; UI.renderPins(); } });
DQ.on('quests', () => { pinSig = ''; });
Object.assign(UI.DO, {
  pin: a => { const P = S().pins = S().pins || []; if (P.includes(a)) P.splice(P.indexOf(a), 1); else { P.unshift(a); if (P.length > 3) P.pop(); } pinSig = ''; DQ.sfx('tab'); UI.renderPins(); if (UI.view === 'quests') UI.render(false); },
  unpin: a => { UI.DO.pin(a); },
});
/* Pin buttons on quest cards */
const origRender = UI.render;
UI.render = fresh => {
  origRender(fresh);
  if (UI.view === 'quests') $$('#view .quest').forEach(c => { const id = c.id.slice(2), q = D.QM[id]; if (!q || DQ.questState(q) === 'done') return; const on = (S().pins || []).includes(id); const b = document.createElement('button'); b.className = 'pinbtn' + (on ? ' on' : ''); b.dataset.do = 'pin'; b.dataset.a = id; b.innerHTML = `${ico('pin')}${on ? 'Pinned' : 'Pin'}`; c.appendChild(b); });
};
})();
