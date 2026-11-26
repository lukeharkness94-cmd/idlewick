/* Buying one tool upgrade reads "Bought", not "Bought ×2" (owner, 26 Nov 2026): the purchase both records the upgrade
   and puts the tool in the pack, and js/purchase_feedback.js must count that once. */
const assert = require('node:assert/strict');
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined }); const errors = [];
  try {
    const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
    p.on('pageerror', e => errors.push(e.message));
    await p.goto(process.env.IDLEWICK_URL || 'http://127.0.0.1:8765/');
    await p.locator('#t-new').click(); await p.locator('#cr-go').click();
    await p.waitForFunction(() => DQ.started && document.querySelector('#title').hidden);
    const r = await p.evaluate(() => { DQ.paused = true; for (let i = 0; i < 12; i++) DQ.closeModal(); const S = DQ.S, D = DQ.data; S.coins = 99999;
      const id = Object.keys(D.ITEMS).find(k => /^tool_/.test(k) && DQ.shopUpgradeState(k) && !DQ.shopUpgradeState(k).owned && DQ.shopUpgradeState(k).reachable && !DQ.shopUpgradeState(k).lock);
      for (const [k, n] of Object.entries(DQ.shopUpgradeState(id).cost)) DQ.give(k, n);
      DQ.go('shop'); DQ.ui.DO.toolfamily(id.split('_')[1]); window.__labels = []; new MutationObserver(() => document.querySelectorAll('.just-bought').forEach(b => window.__labels.push(b.textContent.trim()))).observe(document.body, { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: ['class'] }); const coins = S.coins; DQ.ui.DO.buyupgrade(id); return { id, spent: coins - S.coins, owned: !!S.toolUpgrades[id] }; });
    assert.ok(r.owned && r.spent > 0, 'the upgrade went through: ' + JSON.stringify(r));
    await p.waitForTimeout(600);
    if (process.env.DEBUG) console.log(await p.evaluate(() => JSON.stringify({ btn: [...document.querySelectorAll('#view [data-do]')].map(b => b.dataset.do).filter(d => /buy/.test(d)), view: document.querySelector('#view').className, mod: document.querySelectorAll('.modal').length })));
    const labels = [...new Set(await p.evaluate(() => window.__labels))];
    assert.deepEqual(labels, ['✓ Bought'], 'one tool, one purchase: ' + labels.join('|') + ' ' + r.id);
    assert.deepEqual(errors, []);
    console.log('PASS purchase feedback: a tool upgrade reads "Bought" once');
  } finally { await b.close(); }
})().catch(e => { console.error(e); process.exit(1); });
