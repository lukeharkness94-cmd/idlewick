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
/* Damage-type rules, one table for the engine and every piece of advice (plan.js DQ.typeMult / DQ.typeRuleText).
   Bosses are counter checks, not locks: weaknesses help and resistances hurt, but less than on ordinary creatures. */
/* Style parity (owner-approved melee rebalance, Nov 2026). Combat level counts Attack + Strength for melee but 1.5x
   Ranged or Magic, so at equal combat level an archer's or mage's level is 4/3 of a fighter's Attack and Strength.
   Melee therefore uses 4/3 of Attack and Strength as its effective levels for hitting and damage (engine pstats),
   keeping Attack = accuracy and Strength = damage. Evidence: PARITY=1 node scripts/sim-bosses.cjs. */
/* One scale for all three styles (Nov 2026): Ranged and Magic use the same 4/3 effective level, the same combat-level weight
   and the same XP per hit as Melee, so a level means the same thing whichever weapon family you train. Before this a bow or
   staff hero needed 1.5 to 4 times the fighting to reach each boss requirement (scripts/sim-bosses.cjs, EFFORT=1). */
D.STYLE_TUNE = { meleeLevel: 4 / 3, level: 4 / 3 };
D.TYPE_RULES = { normal: { weak: 1.5, focus: 2, resist: .5 }, boss: { weak: 1.3, focus: 1.6, resist: .7 } };
D.ABIL = [
  AB('power', 'Power Strike', 'strength', 'strength', 8, 'melee', 'Every 4th attack hits for double damage.'),
  AB('bash', 'Shield Bash', 'shield', 'defence', 12, 'melee', 'Interrupts a boss special attack. Needs a shield. Ready every 8 attacks.', { needShield: true }),
  AB('brace', 'Brace', 'defence', 'defence', 20, null, 'Boss special attacks deal half damage.'),
  AB('second', 'Second Wind', 'heart', 'hitpoints', 20, null, 'Once per fight, heal 30% of your health when it drops below 30%.'),
  AB('execute', 'Executioner', 'attack', 'attack', 35, 'melee', '+50% damage against monsters below 30% health.'),
  AB('aimed', 'Aimed Shot', 'ranged', 'ranged', 4, 'ranged', 'Every 3rd shot always hits for 1.5x damage.'),
  AB('pin', 'Pin Down', 'arrow_ammo', 'ranged', 18, 'ranged', 'Hits pin the monster: 25% less accurate for 2 attacks, and flying monsters are grounded.'),
  AB('kite', 'Keep Distance', 'bow', 'ranged', 30, 'ranged', 'Enemy normal attacks deal 30% less damage.'),
  AB('focus', 'Elemental Focus', 'magic', 'magic', 8, 'magic', `Spells that hit a weakness deal ${D.TYPE_RULES.normal.focus}x instead of ${D.TYPE_RULES.normal.weak}x (against bosses ${D.TYPE_RULES.boss.focus}x instead of ${D.TYPE_RULES.boss.weak}x).`),
  AB('ward', 'Arcane Ward', 'ring_logo', 'magic', 22, 'magic', 'Absorbs a boss special attack. Ready every 6 attacks.'),
  /* levels 60 to 95 (Nov 2026): the combat skills used to unlock nothing after 60 while the last bosses need 74 to 85 */
  AB('cleave', 'Cleave', 'attack', 'melee', 70, 'melee', 'Every 5th attack strikes twice.'),
  AB('bloodlust', 'Bloodlust', 'strength', 'melee', 90, 'melee', 'Each hit in a row adds 5% damage, up to 25%. A miss resets it.'),
  AB('volley', 'Volley', 'arrow_ammo', 'ranged', 70, 'ranged', 'Every 4th shot looses a second arrow.'),
  AB('deadeye', 'Deadeye', 'bow', 'ranged', 90, 'ranged', 'Your shots never deal less than half your max hit.'),
  AB('overcharge', 'Overcharge', 'magic', 'magic', 70, 'magic', 'Every 5th spell deals double damage.'),
  AB('echo', 'Spell Echo', 'ring_logo', 'magic', 90, 'magic', 'Spells have a 20% chance to strike again for half damage.'),
  AB('fortress', 'Fortress', 'shield', 'defence', 80, null, 'Enemy normal attacks deal 15% less damage.'),
  AB('unbreakable', 'Unbreakable', 'defence', 'defence', 95, null, 'Once per fight, a blow that would defeat you leaves you on 1 health.'),
];
/* Techniques: passive, always on once learned (no slot). fx: dmg and acc apply to that fighting style; dr is damage taken;
   special is boss special attacks; free is the chance a spell costs no runes. */
const TQ = (skill, lvl, name, text, fx) => ({ skill, lvl, name, text, fx });
D.TECHNIQUES = [
  TQ('melee', 65, 'Heavy Hands', '+3% melee damage', { dmg: .03 }), TQ('melee', 75, 'Keen Edge', '+4% melee accuracy', { acc: .04 }), TQ('melee', 80, 'Battle Rhythm', '+3% melee damage', { dmg: .03 }), TQ('melee', 85, 'Follow Through', '+4% melee accuracy', { acc: .04 }), TQ('melee', 95, 'Weapon Master', '+4% melee damage and accuracy', { dmg: .04, acc: .04 }),
  TQ('ranged', 65, 'Steady Draw', '+3% ranged damage', { dmg: .03 }), TQ('ranged', 75, 'Hawk Eye', '+4% ranged accuracy', { acc: .04 }), TQ('ranged', 80, 'Heavy Draw', '+3% ranged damage', { dmg: .03 }), TQ('ranged', 85, 'Fletcher’s Thrift', '15% chance a shot uses no arrow', { free: .15 }), TQ('ranged', 95, 'Marksman', '+4% ranged damage and accuracy', { dmg: .04, acc: .04 }),
  TQ('magic', 65, 'Deep Channel', '+3% spell damage', { dmg: .03 }), TQ('magic', 75, 'Clear Mind', '+4% spell accuracy', { acc: .04 }), TQ('magic', 80, 'Kindled Runes', '+3% spell damage', { dmg: .03 }), TQ('magic', 85, 'Runic Thrift', '15% chance a spell uses no runes', { free: .15 }), TQ('magic', 95, 'Archmage', '+4% spell damage and accuracy', { dmg: .04, acc: .04 }),
  TQ('defence', 65, 'Hardened', '2% less damage taken', { dr: .02 }), TQ('defence', 75, 'Stalwart', '2% less damage taken', { dr: .02 }), TQ('defence', 85, 'Set Feet', 'Boss special attacks deal 8% less', { special: .08 }), TQ('defence', 90, 'Immovable', '2% less damage taken', { dr: .02 }),
];
D.ABIL.forEach(a => { const sk = (D.SKILL_ALIAS && D.SKILL_ALIAS[a.skill]) || a.skill; ((D.UNL[sk] = D.UNL[sk] || {})[a.lvl] = D.UNL[sk][a.lvl] || []).push('Ability: ' + a.name); });
D.TECHNIQUES.forEach(t => { ((D.UNL[t.skill] = D.UNL[t.skill] || {})[t.lvl] = D.UNL[t.skill][t.lvl] || []).push(`Technique: ${t.name} (${t.text})`); });
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
D.HOLLOW_PHASES = [WR(['crush'], ['aether', 'fire', 'frost', 'storm']), WR(['aether', 'fire'], ['stab', 'slash', 'crush', 'pierce']), WR(['pierce'], ['stab', 'slash', 'crush'])];

/* ---------- Pace for idle tasks ---------- */
D.PACE = {
  careful: { name: 'Careful', speed: .85, risk: .5, text: '15% slower. Half the risk: fewer burns and failed attempts, and less damage taken. Retreats from fights at low health with no food.' },
  steady: { name: 'Steady', speed: 1, risk: 1, text: 'The normal pace.' },
  push: { name: 'Push', speed: 1.2, risk: 1.6, text: '20% faster, but more burns, failed attempts and damage taken. Pushing while away can cause injuries.' },
};
D.STOP_RULES = [['none', 'Until I stop it'], ['time:30', 'For 30 minutes'], ['time:60', 'For 1 hour'], ['time:120', 'For 2 hours'], ['count:50', 'Until 50 done'], ['count:200', 'Until 200 done'], ['count:1000', 'Until 1,000 done'], ['level', 'Until the next level']];
})();

/* ---------- Practical skill unlocks (Nov 2026 brief) ----------
   Unlocks use the existing actionReq system, extended with a few requirement kinds (state.js DQ.actionProgress):
   stats (personal action records: catch, chop, harvest, craft, smith, kill), hero, combat, skill:<id>, tool:<skill>
   (any owned tool of that skill, checked), own:<item> (checked, kept), use:<item> (consumed when you learn the skill),
   visit:<town>, beasts (different creatures studied). D.UNLOCK_BEFORE keeps every skill older saves had already earned.
   Revert one skill by restoring its old rule from D.UNLOCK_BEFORE. */
(() => {
const D = window.DQ.data, set = (id, req) => { const s = D.SK[id]; if (!s) return; s.actionReq = req; delete s.unlock; };
D.UNLOCK_BEFORE = { cooking: { hero: 3 }, mining: { hero: 6 }, farming: { hero: 10 }, research: { hero: 16 }, hunting: { kill: 10 }, herbalism: { harvest: 20 }, exploration: { catch: 25, chop: 25 } };
set('cooking', { catch: 5, chop: 5 });
set('mining', { 'tool:mining': 1 });
set('farming', { hero: 5, chop: 15, 'use:seed_potato': 5 });
set('research', { hero: 12, beasts: 8 });
set('hunting', { chop: 20, 'own:wooden_trap': 3, combat: 8 });
set('herbalism', { harvest: 20, 'skill:farming': 10 });
set('exploration', { catch: 25, chop: 25, 'visit:mossbarrow': 1 });
/* starter routes that no longer ask for the skill they unlock */
const mp = D.QM.miners_pick; if (mp) { mp.adv = 3; mp.blurb = 'Brannoc’s old mine is full of rats and its props are rotten. Clear the rats and bring timber, and he will hand you his spare pickaxe so you can learn Mining.'; mp.obj = [{ ev: 'chop', key: 'normal', n: 10, label: 'Chop 10 logs for new pit props' }, { ev: 'kill', key: 'rat', n: 4, label: 'Clear 4 rats from the old mine' }]; }
const mc = D.QM.mq_crafting; if (mc) { mc.adv = 8; D.SK.crafting.unlock = 8; mc.obj = mc.obj.map(o => o.ev === 'chop' && o.key === 'birch' ? { ev: 'chop', key: 'normal', n: 15, label: 'Chop 15 logs for her frames' } : o); }
})();

(() => {
const D = window.DQ.data, add = r => { r.t = r.t || 2400; D.RECIPES[r.id] = r; D.RLIST[r.skill].push(r); return r; };
/* Make your own gathering tools (Nov 2026): Smithing forges pickaxes, axes and hoes; Crafting makes rods and thief
   gloves. Inputs cost about the tool's sale value (the shop sells at three times that), so making is the cheaper route
   for a skilled player without becoming a money loop. */
D.TOOL_MAKE = { bars: ['bar_iron', 'bar_steel', 'bar_mithril', 'bar_adamant', 'bar_rune'], smith: [16, 31, 51, 71, 86], logs: ['log_normal', 'log_oak', 'log_willow', 'log_maple', 'log_yew'], rodLvl: [10, 26, 46, 61, 76], hides: ['cowhide', 'frost_pelt', 'bogscale', 'drakehide', 'wyrm_scale'], gloveLvl: [8, 30, 50, 70, 85] };
for (let t = 1; t <= 5; t++) {
  const T = D.TOOL_MAKE, bar = T.bars[t - 1], bv = D.ITEMS[bar].val, need = id => Math.max(2, Math.ceil(D.ITEMS[id].val * .9 / bv));
  for (const k of ['pick', 'axe', 'hoe']) { const id = `tool_${k}_${t}`; add({ id: 'smith_' + id, skill: 'smithing', tab: 'Tools', name: D.ITEMS[id].name, lvl: T.smith[t - 1], xp: Math.round(30 * Math.pow(2.1, t)), t: 3000, in: { [bar]: need(id), [T.logs[t - 1]]: 2 }, out: { [id]: 1 }, ev: 'smith' }); }
  const rod = `tool_rod_${t}`, gl = `tool_gloves_${t}`, hv = D.ITEMS[T.hides[t - 1]].val;
  add({ id: 'craft_' + rod, skill: 'crafting', tab: 'Tools', name: D.ITEMS[rod].name, lvl: T.rodLvl[t - 1], xp: Math.round(28 * Math.pow(2.1, t)), t: 3000, in: { [T.logs[t - 1]]: 3, string: 2, [bar]: Math.max(1, Math.ceil(D.ITEMS[rod].val * .7 / bv)) }, out: { [rod]: 1 }, ev: 'craft' });
  add({ id: 'craft_' + gl, skill: 'crafting', tab: 'Tools', name: D.ITEMS[gl].name, lvl: T.gloveLvl[t - 1], xp: Math.round(28 * Math.pow(2.1, t)), t: 3000, in: { [T.hides[t - 1]]: Math.max(2, Math.ceil(D.ITEMS[gl].val * .9 / hv)), string: 2 }, out: { [gl]: 1 }, ev: 'craft' });
}
})();
