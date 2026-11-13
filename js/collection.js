/* Collection log (Dec 2026): Hero → Collection. Every rare thing in the game with its real odds and how many tries
   you have had, read from the live save: companion eggs, rare drops from bosses and challenges, and rare finds while
   working. Nothing here changes any odds. Each try is its own roll; the meter only compares your tries with the
   average needed, so a long dry streak is visible and honest. */
(() => {
const Q = window.DQ, D = Q.data, UI = Q.ui, S = () => Q.S, { esc, ico, fmt } = Q;
const SK_STAT = { fishing: ['catch', 'catches'], woodcutting: ['chop', 'logs cut'], mining: ['mine', 'ores mined'], thieving: ['thieve', 'pockets picked'], cooking: ['cook', 'dishes cooked'], crafting: ['craft', 'things crafted'], smithing: [['smelt', 'smith'], 'bars and pieces made'], sailing: ['voyage', 'voyages'], carpentry: ['carve', 'pieces carved'] };
const stat = k => (Array.isArray(k) ? k : [k]).reduce((n, x) => n + (S().stats[x] || 0), 0);
const oneIn = p => p >= 1 ? 'Guaranteed' : `1 in ${fmt(Math.max(2, Math.round(1 / p)))}`;
/* a companion's source: where, the odds per try, and tries so far */
Q.petOdds = id => { const p = D.PET[id], s = p.src || {}, spec = (D.BEAST_SPECIES || {})[id];
  if (s.type === 'skill') { const st = SK_STAT[s.skill] || ['', 'actions']; return { where: `${D.SK[s.skill].name}: any task`, p: s.chance, per: 'action', tries: st[0] ? stat(st[0]) : 0, unit: st[1], go: D.SK[s.skill].page || s.skill }; }
  if (s.type === 'harvest') return { where: 'Farming: harvesting any crop', p: s.chance, per: 'harvest', tries: S().stats.harvest || 0, unit: 'harvests', go: 'farming' };
  if (s.type === 'boss') return { where: `Defeat ${D.MON[s.mon].name}`, p: s.chance, per: 'victory', tries: S().beast.kills[s.mon] || 0, unit: 'victories', go: 'combat' };
  if (s.type === 'shop') return { where: `For sale in ${D.TOWN[s.town].name}`, price: s.price, go: 'bestiary' };
  if (s.type === 'hunt') { const m = D.MON[s.mon]; return { where: `Defeat ${m.name.toLowerCase()}s in ${D.TOWN[m.town].name}, or lay wooden traps there`, p: Math.max(.008, .05 - m.cl * .00035), per: 'defeat', tries: S().beast.kills[m.id] || 0, unit: 'defeated', go: 'combat' }; }
  if (spec) return { where: `The trapper, from Hero level ${spec.hero}`, trap: true, tracks: (S().pets.tracks || {})[id] || 0, go: 'beastmastery' };
  return { where: 'Unknown' }; };
const meter = (tries, p) => { const exp = Math.max(1, Math.round(1 / p)), pct = Math.min(100, Math.round(tries / exp * 100)); return `<span class="col-meter ${tries > exp ? 'over' : ''}"><span class="bar"><i style="width:${pct}%"></i></span></span>`; };
const petRow = p => { const own = S().pets.owned[p.id], egg = Q.eggOf && Q.eggOf(p.id), o = Q.petOdds(p.id), kind = Q.eggKind ? Q.eggKind(p.id) : { name: 'Egg' };
  const art = own ? Q.petSprite(p, 48) : `<span class="${egg ? 'egg-wobble' : 'col-unk'}">${Q.eggImg ? Q.eggImg(p.id, 48) : ''}</span>`;
  const state = own ? `<span class="tag ok">✓ Hatched</span>` : egg ? `<span class="tag warn">In the hatchery · <span data-beast-due="${egg.due}">${Q.fmtTime(Math.max(0, egg.due - Date.now()))}</span></span>` : '';
  const odds = o.price ? `${fmt(o.price)} coins` : o.trap ? `Trap odds shown at the trapper · ${o.tracks}/5 tracks` : o.p ? `${oneIn(o.p)} per ${o.per}` : '';
  const tries = !own && !egg && o.p ? `<small class="col-tries"><b class="mono">${fmt(o.tries)}</b> ${o.unit} so far${meter(o.tries, o.p)}</small>` : '';
  return `<article class="col-row ${own ? 'got' : egg ? 'egg' : ''}" style="--c:${p.col}"><span class="col-art">${art}</span><div class="col-t"><b>${own ? esc(p.name) : esc(kind.name)}</b><small>${own ? esc(p.text) : esc(o.where)}</small></div><div class="col-o">${state || `<b>${odds}</b>`}${tries}</div></article>`; };
const dropRows = () => { const out = [];
  for (const m of D.MONLIST.filter(m => m.boss || m.mini).sort((a, b) => a.cl - b.cl)) { const kills = S().beast.kills[m.id] || 0, met = kills > 0 || Q.combatLvl() >= (m.boss || m.mini).req;
    for (const [id, , p] of m.drops) { const it = D.ITEMS[id]; if (!it || p >= .2 || !(it.slot || it.unique || it.rare)) continue; const found = !!(S().beast.drops || {})[m.id + ':' + id];
      out.push(`<article class="col-row ${found ? 'got' : ''}" style="--c:${it.col}"><span class="col-art ${found || met ? '' : 'col-unk'}">${Q.itemIco(it)}</span><div class="col-t"><b>${found || met ? esc(it.name) : '???'}</b><small>${met ? esc(m.name) : `A challenge in ${esc(D.TOWN[m.town].name)}`}</small></div><div class="col-o">${found ? `<span class="tag ok">✓ Found</span>` : `<b>${oneIn(p)} per victory</b><small class="col-tries"><b class="mono">${fmt(kills)}</b> victories so far${meter(kills, p)}</small>`}</div></article>`); } }
  return out.join(''); };
const workRows = () => { const E = D.ECONOMY || {}, rows = [['fishing', 'Sunken chest', 'Coins and a gem', E.fishChestChance, 'catch', 'catches'], ['fishing', 'Sodden coin pouch', 'A handful of coins', E.fishPouchChance, 'catch', 'catches'], ['woodcutting', "Bird's nest", 'Coins or a gem', E.woodNestChance, 'chop', 'logs cut'], ['mining', 'Uncut gem', 'A gem in the rock', E.mineGemChance, 'mine', 'ores mined']];
  return rows.filter(r => r[3]).map(([sk, name, what, p, st, unit]) => `<article class="col-row" style="--c:${D.SK[sk].col}"><span class="col-art">${ico(sk)}</span><div class="col-t"><b>${name}</b><small>${D.SK[sk].name} · ${what}</small></div><div class="col-o"><b>${oneIn(p)} per action</b><small class="col-tries"><b class="mono">${fmt(S().stats[st] || 0)}</b> ${unit} so far</small></div></article>`).join(''); };
UI.colTab = 'eggs';
UI.V.collection = () => { const pets = Q.collectiblePets ? Q.collectiblePets() : D.PETS, own = pets.filter(p => S().pets.owned[p.id]).length, tab = UI.colTab;
  const order = p => (S().pets.owned[p.id] ? 0 : Q.eggOf && Q.eggOf(p.id) ? -1 : 1);
  const body = tab === 'eggs' ? `<p class="col-note">Every companion arrives as an egg and hatches at your ranch. Each try is its own roll: the bar compares your tries with the average needed.</p><div class="col-list">${pets.slice().sort((a, b) => order(a) - order(b)).map(petRow).join('')}</div>`
    : tab === 'drops' ? `<p class="col-note">Rare gear from bosses and challenges. The first victory over each always gives its marked reward.</p><div class="col-list">${dropRows()}</div>`
    : `<p class="col-note">Lucky finds while you work.</p><div class="col-list">${workRows()}</div>`;
  return `<section class="panel shophead col-head"><div><span class="k">Collection log</span><h2>${own} of ${pets.length} companions hatched</h2></div><div class="tabs">${[['eggs', 'Companion eggs'], ['drops', 'Rare drops'], ['work', 'Lucky finds']].map(([k, n]) => `<button class="tab ${tab === k ? 'on' : ''}" data-do="coltab" data-a="${k}">${n}</button>`).join('')}</div></section><section class="panel col-panel">${body}</section>`; };
UI.DO.coltab = a => { UI.colTab = a; UI.render(false); };
})();
