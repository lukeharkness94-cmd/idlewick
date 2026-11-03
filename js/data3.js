/* Idlewick: combat builds (weapon types, damage types, weaknesses, abilities, boss mechanics) and away events. */
(() => {
const DQ = window.DQ, D = DQ.data;

/* ---------- Damage types ---------- */
D.DTYPES = {
  stab: { name: 'Stab', col: '#d8d0b8', ic: 'dagger' }, slash: { name: 'Slash', col: '#e0564f', ic: 'sword' }, crush: { name: 'Crush', col: '#c88a4a', ic: 'hammer' },
  pierce: { name: 'Pierce', col: '#b5d84b', ic: 'arrow_ammo' }, fire: { name: 'Fire', col: '#ff7a2a', ic: 'fire' }, frost: { name: 'Frost', col: '#8fd8ff', ic: 'star' },
  storm: { name: 'Storm', col: '#e8e070', ic: 'magic' }, aether: { name: 'Aether', col: '#c07aff', ic: 'ring_logo' },
};
D.PHYSICAL = ['stab', 'slash', 'crush', 'pierce'];
D.WTYPES = {
  dagger: { name: 'Dagger', speed: 1600, acc: 1.15, dmg: .75, dtype: 'stab', note: 'Fast and accurate, light hits' },
  sword: { name: 'Sword', speed: 2000, acc: 1, dmg: 1, dtype: 'slash', note: 'Balanced' },
  hammer: { name: 'Warhammer', speed: 2600, acc: .9, dmg: 1.45, dtype: 'crush', note: 'Slow, heavy, cracks armour' },
  bow: { name: 'Bow', speed: 2000, acc: 1, dmg: 1, dtype: 'pierce', note: 'Strikes from range, uses arrows' },
  staff: { name: 'Staff', speed: 2200, acc: 1, dmg: 1, dtype: null, note: 'Casts your chosen spell, uses runes' },
};
D.SPELL_EL = { spark: 'storm', frost: 'frost', fire: 'fire', storm: 'storm', aether: 'aether' };
D.weaponType = () => {
  const w = D.ITEMS[DQ.S.equip.weapon];
  if (!w) return 'sword';
  if (w.style === 'ranged') return 'bow'; if (w.style === 'magic') return 'staff';
  return w.wtype || 'sword';
};

/* ---------- Weaknesses (x1.5 damage) and resistances (x0.5) ---------- */
const WR = (weak, resist = []) => ({ weak, resist });
D.WEAK = {
  chicken: WR(['pierce']), rat: WR(['crush']), goblin: WR(['slash']), cow: WR(['stab']),
  grubnash: WR(['crush'], ['slash', 'stab']),
  boar: WR(['pierce', 'stab'], ['crush']), wolf: WR(['fire', 'slash']), scarecrow: WR(['fire', 'slash'], ['pierce', 'stab']),
  oldtusk: WR(['pierce'], ['crush', 'slash']),
  crab: WR(['crush', 'storm'], ['slash', 'pierce']), bandit: WR(['stab']), smuggler: WR(['slash']), pirate: WR(['pierce']),
  barnacle: WR(['crush', 'storm'], ['slash', 'pierce']),
  bat: WR(['pierce'], ['crush']), icewolf: WR(['fire'], ['frost']), raider: WR(['storm', 'crush'], ['slash']), troll: WR(['fire', 'stab'], ['crush']),
  frostmaw: WR(['fire'], ['frost', 'slash']),
  zombie: WR(['fire', 'slash'], ['stab']), skeleton: WR(['crush'], ['stab', 'pierce']), bogsnapper: WR(['storm', 'crush'], ['slash']), wraith: WR(['aether', 'fire'], ['stab', 'slash', 'crush', 'pierce']),
  morwenna: WR(['pierce', 'stab'], ['aether', 'frost', 'fire', 'storm']),
  imp: WR(['frost'], ['fire']), hound: WR(['frost'], ['fire', 'slash']), drake: WR(['frost', 'pierce'], ['fire']), emberlord: WR(['frost', 'crush'], ['fire', 'slash', 'stab']),
  pyrrhax: WR(['frost', 'pierce'], ['fire', 'slash']),
  hawk: WR(['pierce'], ['crush']), golem: WR(['crush', 'aether'], ['slash', 'stab', 'pierce']), wyvern: WR(['pierce', 'frost'], ['fire']),
  zephyrion: WR(['pierce', 'storm'], ['stab', 'slash', 'crush']),
  voidknight: WR(['aether', 'crush'], ['slash', 'stab']), shade: WR(['aether', 'fire'], ['stab', 'slash', 'crush', 'pierce']), horror: WR(['fire', 'pierce'], ['aether']),
  hollowking: WR([], []),
};
/* Regional additions use their anatomy and habitat for learnable counters. */
for(const [id,shape] of Object.entries(D.EXTRA_CREATURES||{})){
 const m=D.MON[id],physical={beast:'stab',winged:'pierce',clawed:'crush',humanoid:'slash',spectral:'aether'}[shape.body];
 const element={ironpeak:'fire',gloomfen:'fire',emberfall:'frost',saltmere:'storm',skyreach:'pierce',hollow:'aether'}[m.town];
 D.WEAK[id]=WR([...new Set([physical,element].filter(Boolean))],shape.body==='clawed'?['slash']:m.town==='emberfall'?['fire']:m.town==='ironpeak'?['frost']:[]);
}
D.STUDY_KILLS = 3;   // kills needed to learn a regular creature's weaknesses

/* ---------- Abilities: slot two (three from combat level 40). They trigger on their own. ---------- */
const AB = (id, name, ic, skill, lvl, style, text, extra) => Object.assign({ id, name, ic, skill, lvl, style, text }, extra || {});
D.ABIL = [
  AB('power', 'Power Strike', 'strength', 'strength', 8, 'melee', 'Every 4th attack hits for double damage.'),
  AB('bash', 'Shield Bash', 'shield', 'defence', 12, 'melee', 'Interrupts a boss special attack. Needs a shield. Ready every 8 attacks.', { needShield: true }),
  AB('brace', 'Brace', 'defence', 'defence', 20, null, 'Boss special attacks deal half damage.'),
  AB('second', 'Second Wind', 'heart', 'hitpoints', 20, null, 'Once per fight, heal 30% of your health when it drops below 30%.'),
  AB('execute', 'Executioner', 'attack', 'attack', 35, 'melee', '+50% damage against monsters below 30% health.'),
  AB('aimed', 'Aimed Shot', 'ranged', 'ranged', 5, 'ranged', 'Every 3rd shot always hits for 1.5x damage.'),
  AB('pin', 'Pin Down', 'arrow_ammo', 'ranged', 25, 'ranged', 'Hits pin the monster: 25% less accurate for 2 attacks, and flying monsters are grounded.'),
  AB('kite', 'Keep Distance', 'bow', 'ranged', 40, 'ranged', 'Enemy normal attacks deal 30% less damage.'),
  AB('focus', 'Elemental Focus', 'magic', 'magic', 10, 'magic', 'Weaknesses take 2x damage instead of 1.5x.'),
  AB('ward', 'Arcane Ward', 'ring_logo', 'magic', 30, 'magic', 'Absorbs a boss special attack. Ready every 6 attacks.'),
];
D.AB = Object.fromEntries(D.ABIL.map(a => [a.id, a]));

/* ---------- Boss mechanics: what each boss does and what beats it ---------- */
D.BOSSMECH = {
  grubnash: { mech: 'enrage', text: 'Enrages below half health and hits 25% harder.', counters: ['Brace softens his War cry', 'A warhammer cracks his armour (crush)', 'Shield Bash stops the War cry'] },
  oldtusk: { mech: 'charge', text: 'His Trampling charge is brutal up close, but only half as hard against ranged fighters.', counters: ['Fight him with a bow', 'Pierce damage (arrows) is his weakness', 'Brace'] },
  barnacle: { mech: 'armour', text: 'Crusted in barnacles: slashing and arrows glance off. Cannon volleys hit hard.', counters: ['Warhammer (crush) or Storm spells', 'Shield Bash interrupts the cannon volley'] },
  frostmaw: { mech: 'freeze', text: 'Glacier slam freezes you solid: you lose your next attack, unless you fight with fire.', counters: ['Fire Surge breaks the ice and is his weakness', 'Arcane Ward or Brace for the slam'] },
  morwenna: { mech: 'hex', text: 'Her Hex curses you for 4 attacks of damage over time. She shrugs off most spells.', counters: ['Arcane Ward absorbs the Hex', 'Daggers (stab) and arrows (pierce)', 'Bring plenty of food'] },
  pyrrhax: { mech: 'flames', text: 'Wyrmfire scorches everything. Frost spells dampen the flames by half.', counters: ['Frost Bolt: his weakness, and it halves Wyrmfire', 'Arrows (pierce) through the wings', 'Brace or Ward'] },
  zephyrion: { mech: 'airborne', text: 'Stays in the air: melee barely reaches him unless he is pinned to the ground.', counters: ['Bow with Pin Down grounds him', 'Storm spells and arrows', 'Brace for Thunder dive'] },
  hollowking: { mech: 'phases', text: 'Changes form twice. Above two thirds health he is weak to crush, then to aether and fire, then to pierce.', counters: ['A warhammer for phase one', 'Magic for phase two', 'A bow for the final phase', 'Elemental Focus and Ward'] },
};
D.HOLLOW_PHASES = [WR(['crush'], ['aether', 'fire', 'frost', 'storm']), WR(['aether', 'fire'], ['stab', 'slash', 'crush', 'pierce']), WR(['pierce'], ['stab', 'slash', 'crush', 'aether'])];

/* ---------- Pace for idle tasks ---------- */
D.PACE = {
  careful: { name: 'Careful', speed: .85, risk: .5, text: '15% slower. Half the risk: fewer burns and failed attempts, and less damage taken. Retreats from fights at low health with no food.' },
  steady: { name: 'Steady', speed: 1, risk: 1, text: 'The normal pace.' },
  push: { name: 'Push', speed: 1.2, risk: 1.6, text: '20% faster, but more burns, failed attempts and damage taken. Pushing while away can cause injuries.' },
};
D.STOP_RULES = [['none', 'Until I stop it'], ['time:30', 'For 30 minutes'], ['time:60', 'For 1 hour'], ['time:120', 'For 2 hours'], ['count:50', 'Until 50 done'], ['count:200', 'Until 200 done'], ['count:1000', 'Until 1,000 done'], ['level', 'Until the next level']];
})();
