/* Idlewick: every item remembers where you first got it (20 Nov 2026, owner feedback).
   The first time an item reaches you, one plain line is saved in S.found, e.g. "Dropped by a goblin on the Meadow
   Path, Willowbrook" or "Bought in the Willowbrook shop", and shown in the item's tooltip and detail panel.
   The line comes from an explicit source (shop, quest, farm, starting pack) or, failing that, from what you were
   doing at that moment. Items already owned before this existed simply have no line; nothing is invented.
   Forecasts never write. */
(() => {
const DQ = window.DQ, D = DQ.data, UI = DQ.ui, S = () => DQ.S, esc = DQ.esc;
let origin = null; /* an explicit source set around a purchase, quest reward, harvest and so on */
const town = id => (D.TOWN[id] || D.TOWN[S().town] || {}).name || '';
const a = word => /^[aeiou]/i.test(word) ? 'an ' + word : 'a ' + word;
const fromAct = () => {
  const act = DQ.act; if (!act) return null;
  if (act.kind === 'fight') {
    const m = D.MON[DQ.fight?.id] || D.MON[act.id], area = act.area && Object.values(D.AREAS || {}).flat().find(x => x.id === act.area);
    if (!m) return null;
    /* you have just beaten it, so its real name is known (the kill is counted after the drop) */
    const who = m.boss || m.mini ? m.name : a(m.name.toLowerCase());
    return `Dropped by ${who}${area ? ` on the ${area.name}` : ''}, ${town(m.town || S().town)}`;
  }
  const n = D.NODE[act.kind + ':' + act.id];
  if (n) { const t = town(n.town || S().town); return ({ wood: `Cut from ${a(n.name.toLowerCase())}, ${t}`, mine: `Mined from ${a(n.name.toLowerCase())}, ${t}`, fish: `Fished up in ${t}`, thieve: `Pickpocketed from ${a(n.name.toLowerCase())}, ${t}` })[act.kind]; }
  if (act.kind === 'recipe') { const r = D.RECIPES[act.id]; if (r) return `Made with ${D.SK[r.skill].name}${r.town ? `, ${town(r.town)}` : ''}`; }
  const sk = DQ.actSkill && DQ.actSkill(); if (sk && D.SK[sk]) return `Found while ${D.SK[sk].name.toLowerCase() === 'hunting' ? 'hunting' : 'training ' + D.SK[sk].name}, ${town(S().town)}`;
  return null;
};
DQ.noteOrigin = (id, text) => { if (!id || !text || DQ.forecasting) return; const f = S().found || (S().found = {}); if (!f[id]) f[id] = text; };
DQ.originOf = id => (S().found || {})[id] || null;
const remember0 = DQ.rememberItem;
DQ.rememberItem = id => { const r = remember0(id); try { if (D.ITEMS[id] && !DQ.forecasting && !DQ.originOf(id)) DQ.noteOrigin(id, origin || fromAct()); } catch (e) {} return r; };
const during = (text, f) => (...args) => { const prev = origin; origin = typeof text === 'function' ? text(...args) : text; try { return f(...args); } finally { origin = prev; } };
const wrap = (name, text) => { if (typeof DQ[name] === 'function') DQ[name] = during(text, DQ[name]); };
wrap('buy', () => `Bought in the ${town()} shop`);
wrap('buyLocalSupply', () => `Bought from ${town()}’s own supplies`);
wrap('claimQuest', id => { const q = D.QM[id]; return q ? `Reward for “${q.name}” from ${q.giver}` : null; });
wrap('harvest', () => 'Grown on your farm');
wrap('collect', i => { const an = S().farm.animals[i], def = an && (D.ANIMALS || []).find(x => x.id === an.id); return def ? `From your ${def.name.toLowerCase()} on the farm` : 'From your farm animals'; });
/* the tooltip and the item panel both read DQ.tips.item */
const tip0 = DQ.tips.item;
DQ.tips.item = id => { const h = tip0(id), o = DQ.originOf(id); return h && o ? h + `<div class="item-origin">${esc(o)}</div>` : h; };
})();
