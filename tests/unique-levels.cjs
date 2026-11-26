/* No two things on one ladder share a level (owner, 26 Nov 2026): gathering spots per kind, and recipes within each
   category and type (tools within their own family). The opening keeps its route: flax string Crafting 1, wooden
   trap Crafting 2, copper Mining 1; tin is Mining 2. The unlock index moves with the levels. */
const assert = require('node:assert/strict');
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });
  try {
    const p = await b.newPage(); await p.goto(process.env.IDLEWICK_URL || 'http://127.0.0.1:8765/');
    await p.waitForFunction(() => window.DQ && DQ.data && DQ.data.LEVEL_SPREAD);
    const r = await p.evaluate(() => { const D = DQ.data, dup = [];
      const check = (label, list) => { const by = {}; for (const x of list) (by[x.lvl] = by[x.lvl] || []).push(x.name); for (const [l, n] of Object.entries(by)) if (n.length > 1) dup.push(`${label} Lv ${l}: ${n.join(', ')}`); };
      for (const [k, nodes] of Object.entries(D.NODES)) check(k, nodes);
      const fam = r => { const o = Object.keys(r.out || {})[0] || ''; const m = /^tool_([a-z]+)_/.exec(o); return m ? 'tool:' + m[1] : null; };
      for (const [sk, list] of Object.entries(D.RLIST)) { const g = {}; for (const r of list) { if (r.secret || r.cross && r.lead) continue; const k = fam(r) || (DQ.recipeGroup(r).g + '|' + (DQ.recipeGroup(r).s || '')); (g[k] = g[k] || []).push(r); } for (const [k, rs] of Object.entries(g)) check(sk + ' ' + k, rs); }
      const unlAt = (sk, name) => Object.entries(D.UNL[sk] || {}).filter(([, ns]) => ns.includes(name)).map(([l]) => +l);
      return { dup, kept: D.LEVEL_SPREAD.kept, tin: D.NODE['mine:tin'].lvl, copper: D.NODE['mine:copper'].lvl, flax: D.RECIPES.craft_flax_string.lvl, trap: D.RECIPES.craft_trap.lvl, tinUnl: unlAt('mining', D.NODE['mine:tin'].name) }; });
    assert.deepEqual(r.dup, [], r.dup.join('\n'));
    assert.deepEqual(r.kept, []);
    assert.equal(r.copper, 1); assert.equal(r.tin, 2); assert.equal(r.flax, 1); assert.equal(r.trap, 2);
    assert.deepEqual(r.tinUnl, [2], 'tin is announced at Mining 2');
    console.log('PASS unique levels: no shared level on any gathering or recipe ladder; opening route kept; unlock index follows');
  } finally { await b.close(); }
})().catch(e => { console.error(e.message || e); process.exit(1); });
