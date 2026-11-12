/* Beast bonds: additive content. Existing companion IDs, bonuses and tricks remain valid. */
(() => {
const D = window.DQ.data;
D.BOND_XP = [0, 25, 100, 300, 750, 1400, 2400, 3800, 5600, 8000];
D.BOND_MILESTONES = [2, 4, 6, 8, 10];
D.BOND_PASSIVE_STEP = .006; // Five upgrades total +3 percentage points.
D.BEAST_SPECIES = {
  bond_wolf: { name: 'Hearthwolf', kind: 'Wolf', hero: 15, town: 'willowbrook', rarity: 'common', passive: 'crit', critDamage: 1.5, evolvedCritDamage: 2, base: .05, damage: .85, evolution: 'Moonmane', col: '#96acba' },
  bond_boar: { name: 'Bramble boar', kind: 'Boar', hero: 18, town: 'mossbarrow', rarity: 'common', passive: 'coin', base: .08, damage: 1, evolution: 'Briarback', col: '#a47b55' },
  bond_owl: { name: 'Duskwatch owl', kind: 'Owl', hero: 22, town: 'willowbrook', rarity: 'rare', passive: 'xpAll', base: .10, damage: .7, evolution: 'Starwarden', col: '#b0a0c8' },
  bond_bear: { name: 'Honeyclaw', kind: 'Bear', hero: 26, town: 'mossbarrow', rarity: 'rare', passive: 'boss', base: .05, damage: 1.15, evolution: 'Sunkeeper', col: '#bb8950' }
};
for (const [id, s] of Object.entries(D.BEAST_SPECIES)) {
  const p = { id, name: s.name, kind: s.kind, col: s.col, collectible: true, bonus: {}, text: 'A bond shaped by your adventures.', src: { type: 'beasttrap', hero: s.hero, town: s.town } };
  D.PETS.push(p); D.PET[id] = p;
}
D.BEAST_TRAPS = {
  basic: { name: 'Basic trap', cost: 40, hours: 1, common: .4, rare: .1, consolation: 5 },
  iron: { name: 'Iron trap', cost: 120, hours: 2, common: .6, rare: .3, consolation: 10 },
  rune: { name: 'Rune trap', item: 'rune_trap', hours: 4, common: .8, rare: .6, consolation: 20 }
};
D.ITEMS.rune_trap = { id: 'rune_trap', name: 'Rune trap', type: 'resource', ic: 'beastmastery', col: '#64bdd2', val: 80, sub: 'Rare regional boss drop. Send it from Beastmastery; a four-hour expedition has the best capture odds.' };
for (const m of D.MONLIST.filter(m => m.boss)) if (!m.drops.some(d => d[0] === 'rune_trap')) m.drops.push(['rune_trap', [1, 1], .05]);
})();
