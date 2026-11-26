/* Part C Task 23: "Available only" is ON by default for a shelf family the hero owns nothing from, with a hidden-count
   line; OFF shows every tier; once the hero owns one, their last choice stands; the choice is remembered per family
   (settings.availOnly). Checked at 1440 × 900 and 390 × 844 (no horizontal overflow). */
const assert = require('node:assert/strict');
const { chromium } = require('playwright');
const path = require('node:path');
(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined }); const errors = [];
  try {
    for (const [w, h] of [[1440, 900], [390, 844]]) {
      const p = await b.newPage({ viewport: { width: w, height: h } });
      p.on('pageerror', e => errors.push(e.message));
      await p.goto(process.env.IDLEWICK_URL || 'http://127.0.0.1:8765/');
      await p.locator('#t-new').click(); await p.locator('#cr-go').click();
      await p.waitForFunction(() => DQ.started && document.querySelector('#title').hidden);
      const open = fam => p.evaluate(f => { for (let i = 0; i < 12; i++) DQ.closeModal(); const U = DQ.ui; U.shopTab = 'buy'; U.shopCategory = 'tools'; U.skillCommissionSelected = null; U.shopToolFamily = f; DQ.go('shop'); U.render(true); }, fam);
      const state = () => p.evaluate(() => ({ on: document.querySelector('.shop-tools .filter-toggle')?.getAttribute('aria-checked'), cards: document.querySelectorAll('.shop-tools [data-tool]').length,
        line: (document.querySelector('.shop-tools .avail-hidden') || {}).textContent || '', overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth }));
      const fam = await p.evaluate(() => DQ.data.TOOLS[0][0]);
      await open(fam);
      const s1 = await state();
      assert.equal(s1.on, 'true', `${w}: ON for a fresh hero`); assert.ok(s1.cards < 10, 'only available tiers'); assert.match(s1.line, /^\d+ higher tiers? hidden · turn off Available only to preview them$/);
      if (process.env.SHOT_DIR) await p.screenshot({ path: path.join(process.env.SHOT_DIR, `shop-available-${w}.png`) });
      await p.locator('.shop-tools .filter-toggle').click();
      const s2 = await state(); assert.equal(s2.on, 'false'); assert.equal(s2.cards, 10, `${w}: OFF shows all ten tiers`); assert.equal(s2.line, '');
      /* another family keeps its own default */
      const fam2 = await p.evaluate(() => DQ.data.TOOLS[1][0]); await open(fam2); assert.equal((await state()).on, 'true', 'per family');
      /* a hero who owns a tool in the family keeps the choice they made */
      await p.evaluate(f => { DQ.give('tool_' + f + '_0.5', 1); }, fam); await open(fam);
      const s3 = await state(); assert.equal(s3.on, 'false', 'owner keeps their OFF');
      assert.equal(await p.evaluate(f => DQ.S.settings.availOnly['tool:' + f], fam), false, 'saved in settings');
      /* an owner who never touched the switch starts OFF (the earlier default) */
      await p.evaluate(f => { delete DQ.S.settings.availOnly['tool:' + f]; }, fam2);
      await p.evaluate(f => DQ.give('tool_' + f + '_0.5', 1), fam2); await open(fam2); assert.equal((await state()).on, 'false');
      assert.ok(s1.overflow <= 0 && s2.overflow <= 0, `${w}: no horizontal overflow`);
      console.log(w, JSON.stringify({ s1, s2 }));
      await p.close();
    }
    assert.deepEqual(errors, []);
    console.log('shop-available-default: ok');
  } finally { await b.close(); }
})().catch(e => { console.error(e); process.exit(1); });
