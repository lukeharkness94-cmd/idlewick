/* Part C Task 19: the loot rarity audit. For every tier: what qualifies, how many drop-table entries fall in it, and the
   chance per kill of getting at least one item of that tier from each early creature (Willowbrook and Mossbarrow, the
   first hour's creatures). Rarity is a band of ONE number per drop entry (its own independent per-kill chance p), so
   several entries of the same band on one creature add up. Usage: node scripts/audit-rarity.cjs (preview running). */
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined }); const p = await b.newPage();
  await p.goto(process.env.IDLEWICK_URL || 'http://127.0.0.1:8765/'); await p.waitForFunction(() => window.DQ && DQ.data && DQ.data.MONLIST);
  const out = await p.evaluate(() => {
    const D = DQ.data, R = D.RARITY, tierOf = (m, d) => (m.boss && m.boss.first === d[0]) || (m.mini && m.mini.first === d[0]) ? (D.FIRST_FIND ? D.FIRST_FIND : null) : D.rarityOf(d[2]);
    const def = R.map((r, i) => ({ id: r[0], name: r[1], qualifies: i === R.length - 1 ? `p < ${R[i - 1][3]}` : i === 0 ? `p ≥ ${r[3]}` : `${r[3]} ≤ p < ${R[i - 1][3]}`, entries: 0 }));
    const mons = D.MONLIST.filter(m => !m.tower && m.drops);
    for (const m of mons) for (const d of m.drops) { const t = D.rarityOf(d[2]); const row = def.find(x => x.id === t[0]); row.entries++; }
    const early = mons.filter(m => ['willowbrook', 'mossbarrow'].includes(m.town) && !m.hl).map(m => {
      const per = {}; for (const r of R) { const ps = m.drops.filter(d => d[0] !== 'treasure_chest' && D.rarityOf(d[2])[0] === r[0]).map(d => d[2]); per[r[0]] = +(1 - ps.reduce((a, x) => a * (1 - x), 1)).toFixed(4); }
      return { id: m.id, town: m.town, boss: !!m.boss, mini: !!m.mini, first: (m.boss || m.mini || {}).first || null, chest: (m.drops.find(d => d[0] === 'treasure_chest') || [])[2] || 0, per };
    });
    return { def, early, labels: R.map(r => [r[0], r[1], r[3]]), firstFind: D.FIRST_FIND || null };
  });
  console.log(JSON.stringify(out, null, 1)); await b.close();
})();
