/* Idlewick: villains to fight, animals to hunt (20 Nov 2026, owner feedback: "we need actual villain creatures to
   battle and the chickens, cows etc for hunting early on").
   Willowbrook's two combat areas swap their farm animals for villains at the same odds: on the Meadow Path a Mudling
   (well mud that got up and walked) takes the chicken's place, and in the Goblin Thicket a Goblin raider takes the
   cow's. Each keeps the town's shared drop table, so early gear, pouches and chests drop exactly as before; the raider
   carries the cowhide and feathers it stole, so those still come from combat for Hettie and the tannery.
   Chickens and cows move to a Farm fields hunting ground (area.hunt): Hunting's quarry list offers it, the combat
   window leaves it out. Both creatures stay defined, so old saves keep their kills, field-guide pages and pets. */
(() => {
const DQ = window.DQ, D = DQ.data;
const like = (base, o) => {
  const b = D.MON[base]; if (!b || D.MON[o.id]) return;
  const m = { ...b, ...o, drops: [...o.own, ...b.drops.filter(d => !o.drop.includes(d[0]) && !o.own.some(x => x[0] === d[0]))] };
  delete m.own; delete m.drop; m.hp = Math.round(o.hp * .62); m.max = Math.max(1, Math.round(o.max * .72));
  D.MON[m.id] = m; D.MONLIST.push(m);
  (D.EXTRA_CREATURES = D.EXTRA_CREATURES || {})[m.id] = { body: o.body, mark: o.mark, index: Object.keys(D.EXTRA_CREATURES).length };
};
like('chicken', { id: 'mudling', name: 'Mudling', cl: 1, hp: 3, max: 1, att: 1, def: 1, coins: [0, 3], col: '#7a5a3a', body: 'spectral', mark: 'mud', drop: ['feather'], own: [['seed_potato', [1, 2], .12]] });
like('cow', { id: 'goblin_raider', name: 'Goblin raider', cl: 8, hp: 10, max: 2, att: 3, def: 4, coins: [1, 6], col: '#7fae5c', body: 'humanoid', mark: 'raider', drop: [], own: [['cowhide', [1, 1], .9], ['feather', [2, 5], .5]] });
/* learnable counters, in the same spirit as their neighbours */
if (D.WEAK) { D.WEAK.mudling = { weak: ['slash', 'fire'], resist: ['crush'] }; D.WEAK.goblin_raider = { weak: ['slash'], resist: [] }; }
if (D.LORE) {
  D.LORE.mudling = { note: 'A lump of well mud that got up one night and kept walking. Slow, damp and personally offended by boots.', legend: 'Wren insists the mudlings started when someone tipped the last of the well into the meadow “just to see”. Nobody has owned up. Several people have very clean boots.' };
  D.LORE.goblin_raider = { note: 'One of Grubnash’s farm raiders. Carries a sack of stolen hides and wears a henhouse feather as a sort of uniform.', legend: 'Raiders are ranked by the size of their sack. The biggest sack in the Thicket belongs to a raider called Lumpy, who is mostly sack.' };
}
/* swap the farm animals out of the combat areas, keeping their odds */
const swap = { chicken: 'mudling', cow: 'goblin_raider' };
for (const a of D.AREAS.willowbrook || []) for (const e of a.monsters) if (swap[e.id] && D.MON[swap[e.id]]) e.id = swap[e.id];
/* and give them a field of their own, for Hunting */
if (D.AREAS.willowbrook && !D.AREAS.willowbrook.some(a => a.hunt)) D.AREAS.willowbrook.push({ id: 'willowbrook:farm', town: 'willowbrook', name: 'Farm fields', hunt: true, monsters: [{ id: 'chicken', weight: 60 }, { id: 'cow', weight: 40 }] });
/* their own code-drawn sprites (32 x 32, house style): a mud blob with a pebble crown, a hooded raider with a sack */
const A = DQ.pixelArt;
if (A && A.CREATURE_SPECS && A.blob && A.humanoid) {
  const rp = c => A.ramp(c);
  A.CREATURE_SPECS.mudling = () => { const s = A.blob({ col: '#7a5a3a' }); for (const [x, y] of [[11, 7], [16, 5], [21, 7]]) s.ell(x, y, 1.6, 1.6, rp('#9a9488')); s.line(23, 18, 29, 12, rp('#8fa860')); s.fix(29, 11, '#c8d890'); return s; };
  A.CREATURE_SPECS.goblin_raider = () => { const s = A.humanoid({ skin: '#7fae5c', cloth: '#7a5a36', ears: 'goblin', mouth: 'grin', hat: 'hood', hatCol: '#4e3f2e', weapon: 'dagger', belt: '#5a3a22' }); s.ell(7, 19, 4, 5, rp('#9c7a4c')); s.ell(7, 16, 2, 1, rp('#b8955f')); s.line(9, 14, 12, 12, rp('#6e5235')); s.line(19, 2, 22, 0, rp('#eee5cf')); s.fix(21, 1, '#ffffff'); return s; };
}
DQ.combatAreas = town => (D.AREAS[town] || []).filter(a => !a.hunt);
/* every ordinary enemy can become a companion (hunting.js); the newcomers too */
for (const id of ['mudling', 'goblin_raider']) {
  const m = D.MON[id], pid = 'wild_' + id; if (!m || !D.PET || D.PET[pid]) continue;
  const p = { id: pid, name: m.name, kind: 'Wild beast', spr: 'quad', mon: id, col: m.col, collectible: false, src: { type: 'hunt', mon: id }, bonus: id === 'mudling' ? { dr: .02 } : { coin: .03 }, text: id === 'mudling' ? '−2% damage taken' : '+3% coins' };
  D.PETS.push(p); D.PET[pid] = p;
}
})();
