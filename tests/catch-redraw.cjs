/* The catch animation survives a redraw (owner, 26 Nov 2026: "the animations of the fish being caught are chopped
   sometimes"): a scene redrawn 200 ms after a catch still shows the rising catch and the fish's leap, and the
   rising catch stays below the scene's top edge. */
const assert = require('node:assert/strict');
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined }); const errors = [];
  try {
    const p = await b.newPage({ viewport: { width: 1280, height: 720 } });
    p.on('pageerror', e => errors.push(e.message));
    await p.goto(process.env.IDLEWICK_URL || 'http://127.0.0.1:8765/');
    await p.locator('#t-new').click(); await p.locator('#cr-go').click();
    await p.waitForFunction(() => DQ.started && document.querySelector('#title').hidden);
    const log = await p.evaluate(async () => { for (let i = 0; i < 12; i++) DQ.closeModal(); DQ.go('fishing'); DQ.startAct('fish', 'shrimp'); DQ.ui.render(true); const log = [];
      DQ.on('workcycle', () => setTimeout(() => { const before = document.querySelector('.activity-scene'); DQ.ui.render(true); const after = document.querySelector('.activity-scene');
        setTimeout(() => { const fx = after.querySelector('.work-result'), top = fx ? fx.getBoundingClientRect().top - after.getBoundingClientRect().top : null;
          log.push({ replaced: before !== after, fly: after.querySelectorAll('.work-result').length, leap: after.querySelector('.scene-target').getAnimations().length, top }); }, 60); }, 200));
      await new Promise(r => setTimeout(r, 4600)); return log; });
    assert.ok(log.length >= 1, 'at least one catch');
    for (const l of log) { assert.ok(l.replaced, 'the scene was redrawn'); assert.equal(l.fly, 1, 'the rising catch carried on'); assert.ok(l.leap >= 2, 'the leap carried on'); assert.ok(l.top >= 0, 'inside the scene'); }
    assert.deepEqual(errors, []);
    console.log('PASS catch animation survives a redraw and stays inside the scene');
  } finally { await b.close(); }
})().catch(e => { console.error(e); process.exit(1); });
