/* Idlewick: pinned quest tracker, skill guides, clearer levelling. */
(() => {
const DQ = window.DQ, D = DQ.data, UI = DQ.ui, { $, $$, ico, fmt, esc, clamp } = DQ;
const S = () => DQ.S;

/* ---------- What each skill is for ---------- */
D.SKILL_GUIDE = {
  fishing: ['Catch fish at the fishing spots in each town.', ['Cook your catch into food that heals you in fights', 'Sell fish for coins', 'Better spots unlock as you level and travel'], ['cooking']],
  woodcutting: ['Chop trees for logs.', ['Carve logs into bows and staves', 'Build house furniture', 'Fuel for quests and sell for coins'], ['crafting']],
  mining: ['Dig ore from rocks, and sometimes gems.', ['Smelt ore into metal bars', 'Gems are set into rings and amulets', 'Sell ore for coins'], ['smithing', 'crafting']],
  thieving: ['Pickpocket townsfolk and raid stalls.', ['A quick way to earn coins', 'Getting caught hurts, so bring food', 'Better gloves make you faster'], []],
  farming: ['Grow crops and raise animals on your homestead.', ['Crops and animal produce make the best food', 'Crops grow even while you do other things', 'Pet animals to make them work faster'], ['cooking']],
  cooking: ['Cook raw fish and farm produce into food.', ['Food heals you in combat and while thieving', 'Higher levels burn less', 'Cooked food sells for more'], ['hitpoints']],
  smithing: ['Smelt ore into bars, then forge weapons and armour.', ['Daggers, swords, warhammers and armour for melee', 'Bars also make arrows and jewellery', 'Sell what you make'], ['attack', 'defence']],
  crafting: ['Sew leather, carve bows and staves, and set jewellery.', ['Gear for ranged and magic fighters', 'Rings and amulets with bonuses', 'Woollen cloth for your house'], ['ranged', 'magic']],
  magic: ['Cast spells with a staff, and turn items into coins with alchemy.', ['Choose an element to hit monster weaknesses', 'Spells use Arcane runes', 'Alchemy turns spare items into coins'], []],
  attack: ['Your chance to hit. Higher Attack means fewer misses.', ['Trained by fighting with the Accurate stance', 'Needed to wield better melee weapons', 'Counts towards your combat level'], []],
  strength: ['How hard you hit. It sets your maximum hit.', ['Trained by fighting with the Aggressive stance', 'Raises your maximum hit', 'Counts towards your combat level'], []],
  defence: ['How often monsters miss you, and which armour you can wear.', ['Trained by fighting with the Defensive stance', 'Better armour needs a higher Defence', 'Counts towards your combat level'], []],
  ranged: ['Fighting from a distance with a bow and arrows.', ['Trained by fighting with a bow equipped', 'Arrows are used up as you shoot'], []],
  hitpoints: ['Your health. The more you have, the longer you last in a fight.', ['Rises a little every time you deal damage', 'Food heals it, and it refills slowly when resting'], []],
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
