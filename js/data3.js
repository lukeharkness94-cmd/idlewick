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
  AB('power', 'Power Strike', 'strength', 'strength', 8, 'melee', 'Every 4th attack: 2× damage'),
  AB('bash', 'Shield Bash', 'shield', 'defence', 12, 'melee', 'Blocks a boss special · 8-attack cooldown · needs a shield', { needShield: true }),
  AB('brace', 'Brace', 'defence', 'defence', 20, null, 'Boss specials: −50% damage'),
  AB('second', 'Second Wind', 'heart', 'hitpoints', 20, null, 'Below 30% health: heal 30%, once per fight'),
  AB('execute', 'Executioner', 'attack', 'attack', 35, 'melee', '+50% damage to targets below 30% health'),
  AB('aimed', 'Aimed Shot', 'ranged', 'ranged', 4, 'ranged', 'Every 3rd shot: sure hit, 1.5× damage'),
  AB('pin', 'Pin Down', 'arrow_ammo', 'ranged', 18, 'ranged', 'On hit: target −25% accuracy for 2 attacks · grounds flyers'),
  AB('kite', 'Keep Distance', 'bow', 'ranged', 30, 'ranged', 'Normal attacks: −30% damage taken'),
  AB('focus', 'Elemental Focus', 'magic', 'magic', 8, 'magic', `Weakness hits: ${D.TYPE_RULES.normal.focus}× (bosses ${D.TYPE_RULES.boss.focus}×)`),
  AB('ward', 'Arcane Ward', 'ring_logo', 'magic', 22, 'magic', 'Blocks a boss special · 6-attack cooldown'),
  /* levels 60 to 95 (Nov 2026): the combat skills used to unlock nothing after 60 while the last bosses need 74 to 85 */
  AB('cleave', 'Cleave', 'attack', 'melee', 70, 'melee', 'Every 5th attack: hits twice'),
  AB('bloodlust', 'Bloodlust', 'strength', 'melee', 90, 'melee', '+5% damage per hit in a row (max +25%) · resets on a miss'),
  AB('volley', 'Volley', 'arrow_ammo', 'ranged', 70, 'ranged', 'Every 4th shot: hits twice'),
  AB('deadeye', 'Deadeye', 'bow', 'ranged', 90, 'ranged', 'Minimum hit: half your max hit'),
  AB('overcharge', 'Overcharge', 'magic', 'magic', 70, 'magic', 'Every 5th spell: 2× damage'),
  AB('echo', 'Spell Echo', 'ring_logo', 'magic', 90, 'magic', '20% chance: extra hit for half damage'),
  AB('fortress', 'Fortress', 'shield', 'defence', 80, null, 'Normal attacks: −15% damage taken'),
  AB('unbreakable', 'Unbreakable', 'defence', 'defence', 95, null, 'Survive one fatal blow per fight on 1 health'),
];
/* Techniques: passive, always on once learned (no slot). fx: dmg and acc apply to that fighting style; dr is damage taken;
   special is boss special attacks; free is the chance a spell costs no runes. */
const TQ = (skill, lvl, name, text, fx) => ({ skill, lvl, name, text, fx });
D.TECHNIQUES = [
  TQ('melee', 65, 'Heavy Hands', '+3% melee damage', { dmg: .03 }), TQ('melee', 75, 'Keen Edge', '+4% melee accuracy', { acc: .04 }), TQ('melee', 80, 'Battle Rhythm', '+3% melee damage', { dmg: .03 }), TQ('melee', 85, 'Follow Through', '+4% melee accuracy', { acc: .04 }), TQ('melee', 95, 'Weapon Master', '+4% melee damage and accuracy', { dmg: .04, acc: .04 }),
  TQ('ranged', 65, 'Steady Draw', '+3% ranged damage', { dmg: .03 }), TQ('ranged', 75, 'Hawk Eye', '+4% ranged accuracy', { acc: .04 }), TQ('ranged', 80, 'Heavy Draw', '+3% ranged damage', { dmg: .03 }), TQ('ranged', 85, 'Fletcher’s Thrift', '15% chance: free shot', { free: .15 }), TQ('ranged', 95, 'Marksman', '+4% ranged damage and accuracy', { dmg: .04, acc: .04 }),
  TQ('magic', 65, 'Deep Channel', '+3% spell damage', { dmg: .03 }), TQ('magic', 75, 'Clear Mind', '+4% spell accuracy', { acc: .04 }), TQ('magic', 80, 'Kindled Runes', '+3% spell damage', { dmg: .03 }), TQ('magic', 85, 'Runic Thrift', '15% chance: free cast', { free: .15 }), TQ('magic', 95, 'Archmage', '+4% spell damage and accuracy', { dmg: .04, acc: .04 }),
  TQ('defence', 65, 'Hardened', '−2% damage taken', { dr: .02 }), TQ('defence', 75, 'Stalwart', '−2% damage taken', { dr: .02 }), TQ('defence', 85, 'Set Feet', 'Boss specials: −8% damage', { special: .08 }), TQ('defence', 90, 'Immovable', '−2% damage taken', { dr: .02 }),
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
D.SK.cooking.unlock = 0; // A recipe still requires its ingredient to have been discovered.
set('mining', { chop: 10, 'tool:mining': 1 });
set('farming', { hero: 5, chop: 15, 'use:seed_potato': 5 });
set('research', { hero: 12, beasts: 8 });
/* Hunting lays a lure instead of a trap (owner, 28 Nov 2026): three grain mash (Cooking 1, from bread) to learn it */
set('hunting', { chop: 20, 'own:grain_mash': 3, combat: 8 });
set('herbalism', { harvest: 20, 'skill:farming': 10 });
set('exploration', { catch: 25, chop: 25, 'visit:mossbarrow': 1 });
/* starter routes that no longer ask for the skill they unlock */
const mp = D.QM.miners_pick; if (mp) { mp.adv = 3; mp.blurb = 'The rats have come up out of the old mine and moved onto the Meadow Path, where they eat anything you put down for more than a minute. The timber holding the mine roof has seen better days, too. Cut some fresh logs and chase the rats off the path, and you can have my spare pickaxe. Mind the handle. It’s older than you, and considerably less forgiving.'; mp.obj = [{ ev: 'chop', key: 'normal', n: 10, label: 'Chop 10 logs for new pit props' }, { ev: 'kill', key: 'rat', n: 4, label: 'Clear 4 rats from the Meadow Path' }]; }
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

/* Base-game equipment progression: intermediate workmanship uses existing mineable metals. */
(() => {
const D=window.DQ.data, add=r=>{D.RECIPES[r.id]=r;D.RLIST[r.skill].push(r);};
D.STARTER_KITS={sword:{weapon:'bronze_sword',label:'Sword',hint:'Straightforward melee combat.'},bow:{weapon:'bow_normal',label:'Bow',hint:'Ranged combat · 300 bronze arrows.',ammo:'arrow_bronze',quantity:300},staff:{weapon:'staff_normal',label:'Staff',hint:'Magic combat · Spark and 300 runes.',runes:300}};
D.TOOL_ORDER=[.5,1,1.5,2,2.5,3,3.5,4,4.5,5];
/* Ten tool tiers, each its own mined material in Mining-level order (20 Nov 2026, owner feedback: no more
   "Reinforced" repeats, and each tool wears its mineral's colours). Existing ores and bars only; speeds, prices,
   Smithing levels and item IDs are unchanged. Colours are the mineral's own, spread so neighbours read apart. */
const grades=['Copper','Bronze','Iron','Silver','Steel','Gold','Mithril','Adamant','Obsidian','Runic'];
const matIn=[n=>({ore_copper:n}),n=>({bar_bronze:n}),n=>({bar_iron:n}),n=>({ore_silver:n}),n=>({bar_steel:n}),n=>({bar_gold:n}),n=>({bar_mithril:n}),n=>({bar_adamant:n}),n=>({ore_obsidian:Math.round(n*.45),bar_adamant:Math.round(n*.45)}),n=>({bar_rune:n})];
const toolCols=['#d4723a','#b98d4e','#8b9096','#eef2f6','#8fa7c0','#f0c75a','#6c7fe0','#4fbf7a','#5a4378','#46c8d8'];
D.TOOL_MATERIAL=grades;
const speeds=[.04,.08,.12,.16,.205,.25,.30,.35,.40,.45],prices=[60,120,290,700,1600,3500,7500,16000,32500,65000],levels=[1,6,16,31,40,51,60,71,80,86],counts=[2,3,4,6,8,12,16,22,28,36];
D.TOOL_PURPOSE={
 rod:'Balanced fittings and controlled line retrieval reduce the time needed to land each catch.',
 axe:'A well-shaped cutting edge and secure handle remove wood efficiently with each stroke.',
 pick:'A durable point and balanced head break the ore-bearing rock with less wasted effort.',
 gloves:'Fitted fingers and reinforced cuffs give better control when handling pockets and locks.',
 hoe:'Better soil preparation improves root access to air and water, shortening crop growing time.'
};
D.TOOL_COSTS={};
for(const [key,sk,ic,label]of D.TOOLS)for(let i=0;i<10;i++){
 const tier=D.TOOL_ORDER[i],id=`tool_${key}_${tier}`,base=D.ITEMS[`tool_${key}_${Math.ceil(tier)}`];
 if(!D.ITEMS[id]){D.ITEMS[id]={...base,id,tier,buy:prices[i],val:Math.round(prices[i]/3),artBase:base.id,workmanship:i};for(const stock of Object.values(D.SHOPS))if(stock.includes(base.id))stock.push(id);}
 const it=D.ITEMS[id];it.purpose=D.TOOL_PURPOSE[key];it.name=grades[i]+' '+label.toLowerCase();it.col=toolCols[i];D.TOOL_SPEED[tier]=speeds[i];D.TOOL_PRICE[tier]=prices[i];
 const inputs=matIn[i](counts[i]),wood=D.TOOL_MAKE.logs[Math.ceil(tier)-1];
 if(key==='gloves'){inputs[D.TOOL_MAKE.hides[Math.ceil(tier)-1]]=2;inputs.string=2;}else{inputs[wood]=2;if(key==='rod')inputs.string=2;}
 D.TOOL_COSTS[id]=inputs;it.val=Math.max(1,Math.floor(Object.entries(inputs).reduce((n,[k,v])=>n+D.ITEMS[k].val*v,0)*.5*.7));
 const rid='smith_'+id,old=D.RECIPES[rid];if(old){old.name=it.name;old.lvl=levels[i];old.in={...inputs};}else add({id:rid,skill:'smithing',tab:'Tools',name:it.name,lvl:levels[i],xp:Math.round(30*Math.pow(2.1,tier)),t:3000,in:{...inputs},out:{[id]:1},ev:'smith'});
 const craft=D.RECIPES['craft_'+id];if(craft){craft.name=it.name;craft.in={...inputs};}
}
// Ordinary bows and staves need forged fittings as well as their wood and casting supplies.
for(const r of D.RLIST.crafting)for(const id of Object.keys(r.out)){const it=D.ITEMS[id];if(it.slot==='weapon'&&Number.isInteger(it.tier)){const bar='bar_'+D.TIERS[it.tier].id;r.in[bar]=Math.max(1,r.in[bar]||1);}}
const families={sword:D.TIERS.map(t=>t.id+'_sword'),dagger:D.TIERS.map(t=>t.id+'_dagger'),hammer:D.TIERS.map(t=>t.id+'_hammer'),bow:['normal','oak','willow','maple','yew','magic','elder'].map(x=>'bow_'+x),staff:['normal','oak','willow','maple','yew','magic','elder'].map(x=>'staff_'+x)};
const extra=[3,5,15,25,35,45,55],labels=['Tempered bronze','Fine bronze','Fine iron','Fine steel','Fine mithril','Fine adamant','Fine runite'],nouns={sword:'longsword',dagger:'dagger',hammer:'warhammer',bow:'fitted bow',staff:'banded staff'};
D.WEAPON_BRIDGES=[];
for(const [family,ids]of Object.entries(families))for(let i=0;i<extra.length;i++){
 const level=extra[i],hi=ids.findIndex(id=>Math.max(...Object.values(D.ITEMS[id].req))>level),a=D.ITEMS[ids[hi-1]],b=D.ITEMS[ids[hi]],la=Math.max(...Object.values(a.req)),lb=Math.max(...Object.values(b.req)),t=(level-la)/(lb-la),id=`fine_${family}_${level}`,stats={};
 for(const key of new Set([...Object.keys(a.b),...Object.keys(b.b)]))stats[key]=Math.round((a.b[key]||0)+((b.b[key]||0)-(a.b[key]||0))*t);
 const baseRecipe=Object.values(D.RECIPES).find(r=>r.out[a.id]),recipeUpper=Object.values(D.RECIPES).find(r=>r.out[b.id]),metal=D.TIERS[hi-1],bar='bar_'+metal.id;
 const it=D.ITEMS[id]={...a,id,name:labels[i]+' '+nouns[family],b:stats,req:{[Object.keys(a.req)[0]]:level},tier:hi-1,buy:Math.round(a.buy*Math.pow(b.buy/a.buy,t)/10)*10,artBase:a.id,workmanship:i+1};it.val=Math.min(Math.round(it.buy/3),Math.max(a.val,Math.round((a.val+b.val)/2)));
 const skill=baseRecipe.skill,rid=(skill==='smithing'?'smith_':'craft_')+id,inputs={...baseRecipe.in};inputs[bar]=Math.max(1,(inputs[bar]||1)+(i===0?1:2));
 add({id:rid,skill,tab:baseRecipe.tab,name:it.name,lvl:Math.min(99,Math.round(baseRecipe.lvl+(recipeUpper.lvl-baseRecipe.lvl)*t)),xp:Math.round(baseRecipe.xp+(recipeUpper.xp-baseRecipe.xp)*t),t:baseRecipe.t,in:inputs,out:{[id]:1},ev:baseRecipe.ev});
 D.WEAPON_BRIDGES.push(id);for(const stock of Object.values(D.SHOPS))if(stock.includes(a.id))stock.push(id);
}
})();

/* Willowbrook's fibre route: gathering precedes the Crafting lesson. */
(() => {const D=window.DQ.data;
D.ITEMS.flax={id:'flax',name:'Flax fibres',type:'resource',ic:'woodcutting',col:'#78a58b',val:2,sub:'Gather at the Willowbrook woodland edge. Hettie teaches you to spin it into string.'};
const n={id:'flax',kind:'wood',name:'Wild flax',town:'willowbrook',skill:'woodcutting',lvl:2,xp:7,t:3000,item:'flax',col:'#78a58b',ic:'woodcutting'};D.NODES.wood.push(n);D.NODE['wood:flax']=n;
const r={id:'craft_flax_string',name:'Flax string',skill:'crafting',tab:'Leather',lvl:1,xp:6,t:1800,in:{flax:2},out:{string:3},ev:'craft'};D.RECIPES[r.id]=r;D.RLIST.crafting.push(r);
const q=D.QM.mq_crafting;q.town='willowbrook';q.adv=3;D.SK.crafting.unlock=3;
q.blurb='I came to Willowbrook to mend a coat, dear, and found half the village waiting with theirs. There is flax along the woodland edge. Bring me ten handfuls and five logs for a frame, and I’ll teach you to spin strong string. After that, we can tackle the coats.';q.spoken=q.blurb;
q.obj=[{ev:'deliver',key:'flax',n:10,label:'Bring Hettie 10 flax fibres'},{ev:'deliver',key:'log_normal',n:5,label:'Bring 5 logs for her frame'}];
D.UNL.woodcutting[2]=[...(D.UNL.woodcutting[2]||[]),'Wild flax'];D.UNL.crafting[1]=[...(D.UNL.crafting[1]||[]),'Flax string'];
})();
