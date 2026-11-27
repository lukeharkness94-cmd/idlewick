/* Weapon naming (owner, 27 Nov 2026): "The rare named weapons should only be get-able from drops from rare combat fights,
   bosses etc - rare loot drops. The craftable and upgradeable ones should follow the relevant smithing alloy naming
   convention."
   1 every weapon you can craft, buy or be given by a quest is named for its alloy or wood (Iron sword, Oak shortbow,
     Fine steel longsword), never a fantasy name
   2 every named (unique) weapon has no recipe, no shop listing and no quest reward, and at least one drop source */
const assert = require('node:assert/strict');
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined }); const errors = [];
  try {
    const p = await b.newPage();
    p.on('pageerror', e => errors.push(e.message));
    await p.goto(process.env.IDLEWICK_URL || 'http://127.0.0.1:8765/');
    const r = await p.evaluate(() => { const D = DQ.data;
      const crafted = new Set(Object.values(D.RECIPES).flatMap(x => Object.keys(x.out || {})));
      const sold = new Set(Object.values(D.SHOPS || {}).flat());
      const given = new Set((D.QUESTS || []).flatMap(q => Object.keys((q.reward && q.reward.items) || {})));
      const dropped = new Set([...D.MONLIST.flatMap(m => (m.drops || []).map(d => d[0])), ...Object.values(D.TOWERS || {}).map(T => T.prize)]);
      const material = /^(Tempered |Fine )?(Bronze|Iron|Steel|Mithril|Adamant|Runite|Astral|Wooden|Oak|Willow|Maple|Yew|Magic|Elder)\b/i;
      const badName = [], namedObtainable = [], namedNoDrop = [];
      for (const [id, it] of Object.entries(D.ITEMS)) { if (it.slot !== 'weapon') continue;
        const ways = [crafted.has(id) && 'recipe', sold.has(id) && 'shop', given.has(id) && 'quest'].filter(Boolean);
        if (it.unique) { if (ways.length) namedObtainable.push(`${it.name} (${ways.join(', ')})`); if (!dropped.has(id)) namedNoDrop.push(it.name); }
        else if (ways.length && !material.test(it.name)) badName.push(`${id}: ${it.name}`); }
      const recipeNames = Object.values(D.RECIPES).filter(x => { const o = Object.keys(x.out || {})[0]; return D.ITEMS[o] && D.ITEMS[o].slot === 'weapon' && !D.ITEMS[o].unique; }).filter(x => !material.test(x.name.replace(/^[A-Za-z]+ · /, ''))).map(x => x.name);
      return { badName, namedObtainable, namedNoDrop, recipeNames, sample: ['iron_sword', 'steel_dagger', 'mithril_hammer', 'astral_sword', 'bow_oak', 'staff_elder', 'bow_normal'].map(id => D.ITEMS[id].name) }; });
    assert.deepEqual(r.badName, [], 'craftable, buyable and quest weapons carry their alloy or wood name');
    assert.deepEqual(r.recipeNames, [], 'weapon recipes are named for their alloy or wood');
    assert.deepEqual(r.namedObtainable, [], 'named weapons only drop');
    assert.deepEqual(r.namedNoDrop, [], 'every named weapon has a drop source');
    assert.deepEqual(r.sample, ['Iron sword', 'Steel dagger', 'Mithril warhammer', 'Astral sword', 'Oak shortbow', 'Elder staff', 'Wooden shortbow']);
    assert.deepEqual(errors, []);
    console.log('PASS weapon names: made, bought and quest weapons use alloy or wood names; named weapons only drop');
  } finally { await b.close(); }
})().catch(e => { console.error(e); process.exit(1); });
