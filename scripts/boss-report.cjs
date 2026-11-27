/* Exact-entry boss forecasts. The legacy ladder and parity modes use their original fixtures. */
const STARTERS = { melee: 'sword', ranged: 'bow', magic: 'staff' };

function trainToEntry(q, style, requirement) {
  for (let level = 2; level <= 99; level++) {
    for (const skill of [style, 'defence', 'hitpoints']) {
      if (q.lvl(skill) < level) q.S.xp[skill] = q.data.XPF[level];
      if (q.combatLvl() === requirement) return;
    }
  }
  throw Error('Cannot build a Combat ' + requirement + ' hero');
}

function buildHero(q, boss, style) {
  const D = q.data;
  const S = q.S = q.newState('Forecast', undefined, STARTERS[style]);
  S.settings.notify = false;
  S.unlocked[style] = true;
  const index = D.TOWN[boss.town].idx;
  S.town = boss.town;
  for (const town of D.TOWNS.slice(0, index + 1)) {
    S.towns[town.id] = { visited: true, boss: town.id !== boss.town };
  }
  trainToEntry(q, style, boss.boss.req);
  const previous = D.TOWNS[Math.max(0, index - 1)].id;
  const region = [...new Set([
    S.equip.weapon,
    ...D.TOWN_GEAR[boss.town],
    ...D.TOWN_GEAR[previous]
  ])];
  const eligible = id => id === q.S.equip.weapon || q.canEquip(id).ok;
  const equip = (id, quantity = 1) => {
    if (q.S.equip[D.ITEMS[id].slot] === id && D.ITEMS[id].slot !== 'ammo') return;
    q.give(id, quantity);
    const result = q.equipItem(id);
    if (!result.ok) throw Error('Cannot equip ' + id + ' for ' + boss.id + ': ' + result.why);
  };
  for (const slot of ['head', 'body', 'legs', 'shield']) {
    const armour = region.filter(id => D.ITEMS[id].slot === slot && eligible(id))
      .sort((a, b) => (D.ITEMS[b].b.def || 0) - (D.ITEMS[a].b.def || 0))[0];
    if (armour) equip(armour);
  }
  const food = D.FISH_IDS.filter(id => {
    const recipe = D.RECIPES['cook_' + id];
    return recipe && recipe.lvl <= q.lvl(style);
  }).sort((a, b) => D.ITEMS[b].heal - D.ITEMS[a].heal)[0] || 'shrimp';
  S.inv = { [food]: 15 };
  if (style === 'ranged') {
    const stock = new Set([...D.SHOPS[boss.town], ...D.SHOPS[previous]]);
    const arrows = D.TIERS.map(t => 'arrow_' + t.id).filter(id => stock.has(id) && eligible(id));
    equip(arrows.at(-1), 5000);
  }
  if (style === 'magic') S.inv.rune = 10000;
  S.hp = q.maxHp();
  q.fxDirty();
  return { region, eligible, equip };
}

const capability = (item, style) => {
  const bonus = item.b;
  return style === 'magic' ? bonus.mag || 0 : style === 'ranged' ? bonus.rng || 0 : (bonus.atk || 0) + (bonus.str || 0);
};

function loadouts(q, style, { region, eligible }) {
  const D = q.data;
  const weapons = region.filter(id => D.ITEMS[id].slot === 'weapon' && D.ITEMS[id].style === style && eligible(id))
    .sort((a, b) => capability(D.ITEMS[b], style) - capability(D.ITEMS[a], style));
  if (style === 'magic') {
    const spells = D.SPELLS.filter(s => q.lvl(style) >= s.lvl)
      .sort((a, b) => b.max - a.max || a.runes - b.runes);
    return spells.map(s => ({ weapon: weapons[0], art: s, dtype: D.SPELL_EL[s.id] }));
  }
  const [starter, ...arts] = D.ARTS[style];
  if (style === 'melee') {
    const sword = weapons.findIndex(id => D.ITEMS[id].wtype === 'sword');
    if (sword > 0) weapons.unshift(...weapons.splice(sword, 1));
  }
  const options = [starter, ...arts.filter(a => a.dtype && q.lvl(style) >= a.lvl)];
  return weapons.flatMap(weapon => options.map(art => ({
    weapon, art, dtype: art.dtype || D.WTYPES[style === 'ranged' ? 'bow' : D.ITEMS[weapon].wtype || 'sword'].dtype
  })));
}

function simulate(q, boss, dtype, withoutWeakness, resetSeed, seed) {
  const weakOf = q.weakOf;
  if (withoutWeakness) q.weakOf = (...args) => {
    const rules = weakOf(...args);
    return { ...rules, weak: rules.weak.filter(type => type !== dtype) };
  };
  try {
    resetSeed(seed);
    const result = q.forecast(boss.id);
    if (!result || result.blocked) throw Error('Forecast could not start: ' + boss.id);
    return result;
  } finally {
    q.weakOf = weakOf;
  }
}

const wins = result => result.wins + '/' + result.trials + ' (' + Math.round(100 * result.winRate) + '%)';
const foodUsed = result => result.foodPerKill?.toFixed(1) ?? '—';
const seconds = result => result.avgMs == null ? '—' : String(Math.round(result.avgMs / 1000));

function* bossReport(q, resetSeed, only) {
  const D = q.data;
  const bosses = D.MONLIST.filter(m => m.boss && (!only || only.split(',').includes(m.id)));
  if (!bosses.length) throw Error('No matching regional boss');
  yield [
    '# Boss forecasts at the entry requirement',
    '',
    'Each result uses 24 seeded fights, 15 meals and the current combat arts. Gear, skills and ammunition are supplied to each fixture.',
    'The comparison column keeps the loadout and boss mechanics and removes only the selected damage type’s weakness bonus. Resistances and phases still apply.',
    ''
  ].join('\n');
  for (const boss of bosses) {
    const phases = boss.id === 'hollowking' ? D.HOLLOW_PHASES : [q.weakOf(boss)];
    const weak = dtype => phases.filter(phase => phase.weak.includes(dtype)).length;
    const resist = dtype => phases.filter(phase => phase.resist.includes(dtype)).length;
    const rows = [
      '## ' + boss.boss.short + ' · Combat ' + boss.boss.req, '',
      '| Style | Combat | Build | Weapon and art/spell | Type | Wins | Food/win | Seconds/win | Same build without weakness¹ |',
      '| --- | ---: | --- | --- | --- | --- | ---: | ---: | --- |'
    ];
    for (const style of Object.keys(STARTERS)) {
      const hero = buildHero(q, boss, style);
      const level = q.combatLvl();
      const options = loadouts(q, style, hero);
      const general = options[0];
      const counter = [...options].sort((a, b) => weak(b.dtype) - weak(a.dtype) || resist(a.dtype) - resist(b.dtype))[0];
      // Keep the seed for a boss/style stable when other rows are filtered out.
      const seed = [...boss.id + ':' + style].reduce((n, ch) => (n * 31 + ch.charCodeAt(0)) % 2147483646, 7) + 1;
      const builds = [['General', general]];
      if (counter !== general && counter.dtype !== general.dtype) {
        builds.push([weak(counter.dtype) ? 'Counter' : 'Avoid resistance', counter]);
      }
      for (const [label, choice] of builds) {
        hero.equip(choice.weapon);
        if (style === 'magic') q.S.spell = choice.art.id;
        else q.S.arts = { [style]: choice.art.id };
        q.S.abilities = [];
        q.fxDirty();
        q.fillAbilities();
        if (q.combatLvl() !== boss.boss.req || q.weaponStyle() !== style || q.myDtype() !== choice.dtype) {
          throw Error('Unexpected entry loadout for ' + boss.id + ': ' + style + ' ' + label);
        }
        const live = simulate(q, boss, choice.dtype, false, resetSeed, seed);
        const control = weak(choice.dtype) ? simulate(q, boss, choice.dtype, true, resetSeed, seed) : null;
        const details = control ? wins(control) + ', ' + foodUsed(control) + ' food, ' + seconds(control) + ' s' : '—';
        const affinity = [
          weak(choice.dtype) ? 'weak ' + weak(choice.dtype) + '/' + phases.length : '',
          resist(choice.dtype) ? 'resists ' + resist(choice.dtype) + '/' + phases.length : ''
        ].filter(Boolean).join(', ');
        const ammo = style === 'ranged' ? ' + ' + D.ITEMS[q.S.ammo.id].name.toLowerCase() : '';
        const kit = D.ITEMS[choice.weapon].name + ammo + ' · ' + choice.art.name;
        rows.push('| ' + [D.SK[style].name, level, label, kit,
          choice.dtype + (affinity ? ' (' + affinity + ')' : ''), wins(live), foodUsed(live), seconds(live), details].join(' | ') + ' |');
      }
    }
    rows.push('', '¹ Wins, food per win and seconds per win for the same build with the weakness bonus removed.', '');
    yield rows.join('\n');
  }
}

module.exports = { bossReport };
