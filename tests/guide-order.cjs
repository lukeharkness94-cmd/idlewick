/* Field guide order (owner, 28 Nov 2026: "left-to-right should be the unlocks as you unlock"): every page lists its
   entries in unlock order, and an entry close to its next entry keeps its place (it only gains the "Near next entry"
   line) instead of jumping to the front. */
const assert = require('node:assert/strict');
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined }); const errors = [];
  try {
    const p = await b.newPage({ viewport: { width: 1920, height: 1080 } });
    p.on('pageerror', e => errors.push(e.message));
    await p.goto(process.env.IDLEWICK_URL || 'http://127.0.0.1:8765/');
    await p.locator('#t-new').click(); await p.locator('#cr-go').click();
    await p.waitForFunction(() => DQ.started && document.querySelector('#title').hidden);
    const r = await p.evaluate(() => { for (let i = 0; i < 12; i++) DQ.closeModal(); const S = DQ.S, D = DQ.data;
      S.unlocked.woodcutting = true; S.xp.woodcutting = D.XPF[40];
      const trees = [...D.NODES.wood].sort((a, b) => a.lvl - b.lvl), mid = trees[3];
      S.mast = S.mast || {}; S.mast['wood:' + trees[0].id] = 30; S.mast['wood:' + mid.id] = 95;   /* the mid tree is nearest its next entry */
      DQ.go('bestiary'); DQ.ui.DO.guidetopic('wood'); DQ.ui.render(true);
      const keys = [...document.querySelectorAll('.guide-entry-list .gt')].map(e => e.dataset.a);
      const near = [...document.querySelectorAll('.guide-entry-list .gt')].filter(e => /Near next entry/.test(e.textContent)).map(e => e.dataset.a);
      return { keys, expected: trees.map(t => t.id), mid: mid.id, near };
    });
    assert.deepEqual(r.keys, r.expected, 'Woodcutting entries run left to right in unlock order');
    assert.ok(r.near.includes(r.mid), 'the tree nearest its next entry is still marked');
    assert.equal(r.keys.indexOf(r.mid), 3, 'and keeps its place in the order');
    assert.deepEqual(errors, []);
    console.log('guide-order: entries in unlock order; near entries keep their place');
  } finally { await b.close(); }
})().catch(e => { console.error(e); process.exit(1); });
