/* Material tiles (Nov 2026, from the player: "more visual cues as opposed to just text", "use this logic wherever
   anything needs materials"). One tile per thing a task needs: the item's picture with how many it takes, its name,
   and what you hold: green with a tick when you have enough, red with how many are missing (and a route to get
   more) when not. compact tiles drop the name to the tooltip so small cards stay on one screen. */
(() => {
const DQ = window.DQ, D = DQ.data, UI = DQ.ui, { esc, fmt, ico } = DQ, S = () => DQ.S;
const k = n => n >= 1e4 ? (n / 1e3).toFixed(n >= 1e5 ? 0 : 1) + 'k' : fmt(n);
UI.needTile = (id, n, o = {}) => {
  const coins = id === 'coins', it = coins ? null : D.ITEMS[id]; if (!coins && !it) return '';
  const have = coins ? S().coins : DQ.have(id), ok = have >= n, name = coins ? 'Coins' : it.name;
  const art = coins ? ico('coin') : DQ.itemIco(it), route = ok || coins || !UI.routeChip || o.noRoute ? '' : UI.routeChip(id);
  const held = o.live && !coins ? `<b data-b="count:${id}"></b>` : k(have);
  const line = ok ? `✓ ${held} held` : coins ? `✗ need ${k(n - have)} more` : `✗ ${held} of ${k(n)} · need ${k(n - have)}`;
  return `<span class="need-tile ${ok ? 'ok' : 'short'} ${o.compact ? 'compact' : ''}" ${coins ? `data-tip="text:${esc(`${fmt(n)} coins · you have ${fmt(have)}`)}"` : `data-tip="item:${id}"`}><span class="nt-art">${art}<b class="nt-n">${coins ? k(n) : '×' + k(n)}</b></span>${o.compact ? `<small class="nt-c">${ok ? '✓' : `${k(have)}/${k(n)}`}</small>` : `<span class="nt-t"><b>${esc(name)}</b><small>${line}</small></span>`}${route}</span>`;
};
UI.needTiles = (cost, o) => `<span class="need-tiles">${Object.entries(cost || {}).map(([id, n]) => UI.needTile(id, n, o)).join('')}</span>`;
})();
