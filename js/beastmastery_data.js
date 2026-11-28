/* Beast bonds: additive content. Existing companion IDs, bonuses and tricks remain valid. */
(() => {
const D = window.DQ.data;
D.BOND_XP = [0, 25, 100, 300, 750, 1400, 2400, 3800, 5600, 8000];
D.BOND_MILESTONES = [2, 4, 6, 8, 10];
D.BOND_PASSIVE_STEP = .006; // Five upgrades total +3 percentage points.
D.BEAST_SPECIES = {
  bond_wolf: { name: 'Hearthfire chimera', kind: 'Chimera', hero: 15, town: 'willowbrook', rarity: 'common', passive: 'crit', critDamage: 1.5, evolvedCritDamage: 2, base: .05, damage: .85, evolution: 'Moonmane', col: '#96acba' },
  bond_boar: { name: 'Bramblekin', kind: 'Briar fae', hero: 18, town: 'mossbarrow', rarity: 'common', passive: 'coin', base: .08, damage: 1, evolution: 'Briarback', col: '#a47b55' },
  bond_owl: { name: 'Duskwatch sylph', kind: 'Sylph', hero: 22, town: 'willowbrook', rarity: 'rare', passive: 'xpAll', base: .10, damage: .7, evolution: 'Starwarden', col: '#b0a0c8' },
  bond_bear: { name: 'Honeycomb golem', kind: 'Amber golem', hero: 26, town: 'mossbarrow', rarity: 'rare', passive: 'boss', base: .05, damage: 1.15, evolution: 'Sunkeeper', col: '#bb8950' }
};
/* mythical since 28 Nov 2026 (owner: companions are mythical, no animal in both skills); ids, passives and evolutions kept */
const BOND_LORE = {
  bond_wolf: 'A chimera cub with a lion’s mane of embers, a goat’s horns and a tail that answers back. Lies across the hearth and bites at the right moment.',
  bond_boar: 'A briar fae the size of a gate-post, all thorn and bark, that walks the hedgerows and trips up anyone you dislike.',
  bond_owl: 'A sylph of the dusk wind that reads over your shoulder and turns the pages for you.',
  bond_bear: 'A golem of honeycomb and amber that hums like a hive and stands between you and the worst a boss can do.'
};
for (const [id, s] of Object.entries(D.BEAST_SPECIES)) {
  const p = { id, name: s.name, kind: s.kind, col: s.col, collectible: true, bonus: {}, text: 'A bond shaped by your adventures.', lore: BOND_LORE[id], src: { type: 'beasttrap', hero: s.hero, town: s.town } };
  D.PETS.push(p); D.PET[id] = p;
}
/* the mythical beasts (hunt_tiers_data.js D.MYTHS, owner 28 Nov 2026) are the companions Beastmastery Capture keeps:
   wild_<id>, a bonus that grows with the beast's tier. Four were the old regional signature beasts, whose egg fieldwork's
   wooden traps can still leave (skills_new.js DQ.signatureOf, beast_capture.js). */
const MYTH_BONUS = [['dmg', v => `+${v}% damage`], ['dr', v => `${v}% less damage taken`], ['coin', v => `+${v}% coins from every source`], ['xpAll', v => `+${v}% XP to every skill`], ['speed', v => `Every task is ${v}% faster`]];
for (const m of D.MYTHS || []) { const id = 'wild_' + m.id; if (D.PET[id]) continue;
  const [k, say] = MYTH_BONUS[m.index % MYTH_BONUS.length], v = [2, 3, 4, 5, 6][m.tier];
  const p = { id, name: m.name, kind: 'Mythical beast', spr: 'quad', mon: m.id, myth: m.id, town: m.town, col: m.col, lore: m.note, collectible: true, signature: ['thimblefox', 'tideglass', 'candletoad', 'prismkite'].includes(m.id), src: { type: 'capture', myth: m.id }, bonus: { [k]: v / 100 }, text: say(v) };
  D.PETS.push(p); D.PET[id] = p; }
D.BEAST_TRAPS = {
  basic: { name: 'Basic trap', cost: 40, hours: 1, common: .4, rare: .1, consolation: 5 },
  iron: { name: 'Iron trap', cost: 120, hours: 2, common: .6, rare: .3, consolation: 10 },
  rune: { name: 'Rune trap', item: 'rune_trap', hours: 4, common: .8, rare: .6, consolation: 20 }
};
D.ITEMS.rune_trap = { id: 'rune_trap', name: 'Rune trap', type: 'resource', ic: 'beastmastery', col: '#64bdd2', val: 80, sub: 'Rare regional boss drop. Send it from Beastmastery; a four-hour expedition has the best capture odds.' };
for (const m of D.MONLIST.filter(m => m.boss)) if (!m.drops.some(d => d[0] === 'rune_trap')) m.drops.push(['rune_trap', [1, 1], .05]);
})();
