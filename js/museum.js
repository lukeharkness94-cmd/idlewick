/* The museum (Dec 2026, World Life): the field guide's collection hub. Five wings, each a list of things met, tamed,
   found or beaten. An entry is recorded once, the first time its condition is true (S.museum.got[key] = when), so it
   can never unlock twice; a finished wing gives one small permanent bonus (S.museum.wings). Everything is data:
   D.WINGS. Entries are read from what the save already knows, so nothing here can be granted for free. */
(() => {
const DQ = window.DQ, D = DQ.data, S = () => DQ.S;
const lore = id => { const L = (D.LORE || {})[id]; return L ? (L.note || '').split('. ')[0] + '.' : ''; };
const held = id => DQ.have(id) > 0 || ((S().bank || {})[id] || 0) > 0;
D.WINGS = [
  { id: 'creatures', name: 'Hall of Creatures', bonus: { xpAll: .01 }, gives: '+1% XP',
    entries: () => D.MONLIST.filter(m => !m.boss && !m.mini).map(m => ({ key: 'c:' + m.id, name: m.name, text: lore(m.id), mon: m.id, have: () => (S().beast.kills[m.id] || 0) > 0 })) },
  { id: 'beasts', name: 'The Menagerie', bonus: { coin: .02 }, gives: '+2% coins',
    entries: () => (DQ.collectiblePets ? DQ.collectiblePets() : D.PETS).flatMap(p => [{ key: 'b:' + p.id, name: p.name, text: p.text, pet: p.id, have: () => !!S().pets.owned[p.id] }]
      .concat((D.BEAST_SPECIES || {})[p.id] ? [{ key: 'e:' + p.id, name: D.BEAST_SPECIES[p.id].evolution, text: `${p.name}, at Bond 10.`, pet: p.id, evolved: true, have: () => !!(S().pets.owned[p.id] && S().pets.owned[p.id].evolved) }] : [])) },
  { id: 'relics', name: 'Relic Room', bonus: { find: .02 }, gives: '+2% lucky finds',
    entries: () => Object.values(D.ITEMS).filter(it => it.type === 'relic').map(it => ({ key: 'r:' + it.id, name: it.name, text: it.desc || '', item: it.id, have: () => held(it.id) || Object.entries(D.PROJECTS || {}).some(([pid, p]) => p.relic === it.id && S().projects[pid]) })) },
  { id: 'trophies', name: 'Trophy Hall', bonus: { dmg: .01 }, gives: '+1% damage',
    entries: () => D.MONLIST.filter(m => m.boss || m.mini).sort((a, b) => a.cl - b.cl).map(m => ({ key: 't:' + m.id, name: m.name, text: (m.mini && m.mini.won) || lore(m.id), mon: m.id, tower: !!m.tower, have: () => (S().beast.kills[m.id] || 0) > 0 })) },
  { id: 'curios', name: 'Curiosities', bonus: { speedAll: .01 }, gives: '+1% task speed',
    entries: () => (D.CURIOS || []).map(c => ({ key: 'x:' + c.id, name: c.name, text: c.text, ic: c.ic, have: () => !!((S().museum || {}).curios || {})[c.id] })) },
];
/* things that only an event or a secret can add (js/world_events.js, js/secret_recipes.js) */
D.CURIOS = [
  { id: 'hart', name: 'The Moonlit Hart', ic: 'paw', text: 'White as frost, and gone before you can blink. You were quicker, once.' },
  { id: 'star', name: 'A fallen star', ic: 'gem', text: 'Still warm. It hums if you hold it to your ear.' },
  { id: 'shrine', name: 'The wayside shrine', ic: 'star', text: 'It answered. Nobody else will believe you.' },
  { id: 'festival', name: 'Festival ribbon', ic: 'star', text: 'Everybody danced. Even the smith.' },
  { id: 'bard', name: 'The bard’s song', ic: 'sound', text: 'You still catch yourself humming it.' },
  { id: 'recipes', name: 'A cook’s secret', ic: 'book', text: 'The first recipe that nobody sold you.' },
];
const M = () => { const st = S(); if (!st.museum || typeof st.museum !== 'object') st.museum = { got: {}, wings: {}, curios: {} }; st.museum.got = st.museum.got || {}; st.museum.wings = st.museum.wings || {}; st.museum.curios = st.museum.curios || {}; return st.museum; };
DQ.museumCurio = id => { if (DQ.forecasting || !(D.CURIOS || []).some(c => c.id === id)) return false; if (M().curios[id]) return false; M().curios[id] = Date.now(); DQ.museumScan(); return true; };
DQ.museumHas = key => !!M().got[key];
DQ.museumWing = id => !!M().wings[id];
/* record whatever has newly become true. quiet: say nothing (first run on an old save, or catching up after time away) */
DQ.museumScan = (o = {}) => {
  if (DQ.forecasting || !DQ.S || !DQ.S.beast) return []; const first = !S().museum, mu = M(), fresh = [], quiet = o.quiet || first || (DQ.sim && DQ.sim.on);
  for (const w of D.WINGS) { const list = w.entries(); let all = list.length > 0;
    for (const e of list) { if (mu.got[e.key]) continue; if (e.have()) { mu.got[e.key] = Date.now(); fresh.push({ wing: w, entry: e }); } else all = false; }
    if (all && !mu.wings[w.id]) { mu.wings[w.id] = Date.now(); if (DQ.fxDirty) DQ.fxDirty();
      if (!quiet) DQ.notify({ kind: 'unlock', key: 'wing:' + w.id, icon: 'trophy', col: '#f3d58a', title: `${w.name} complete`, text: `${w.gives}, for good.`, sound: 'gem', burst: true, ttl: 12000 });
      if (DQ.journal) DQ.journal('museum', `${w.name} complete: ${w.gives}.`, 'trophy'); } }
  if (fresh.length && !quiet) { const f = fresh[0]; DQ.notify({ kind: 'info', key: 'museum', icon: 'book', col: '#f3d58a', title: `Museum: ${f.entry.name}`, text: fresh.length > 1 ? `and ${fresh.length - 1} more, in the ${f.wing.name}.` : `New in the ${f.wing.name}.`, sound: false, ttl: 6000, action: { label: 'See it', fn: () => DQ.go('museum') } }); }
  if (fresh.length && DQ.fxDirty) DQ.fxDirty();
  return fresh;
};
/* wing bonuses */
const fx0 = DQ.fx;
DQ.fx = () => { const f = fx0(); if (!f._museum) { f._museum = true; const got = (S().museum || {}).wings || {}; for (const w of D.WINGS) if (got[w.id]) for (const [k, v] of Object.entries(w.bonus)) f[k] = (f[k] || 0) + v; } return f; };
DQ.museumProgress = () => D.WINGS.map(w => { const list = w.entries(); return { wing: w, list, got: list.filter(e => DQ.museumHas(e.key)).length, total: list.length, done: DQ.museumWing(w.id) }; });
})();
