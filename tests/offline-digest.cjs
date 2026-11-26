const assert = require('node:assert/strict');
const { chromium } = require('playwright');
const path = require('node:path');

const wait = 3600000;
const url = process.env.IDLEWICK_URL || 'http://127.0.0.1:8765/';

(async () => {
  const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });
  try {
    const errors = [];
    const evidence = [];
    for (const hours of [1, 6, 12, 32]) {
      const page = await browser.newPage({ viewport: { width: hours === 6 ? 390 : 1440, height: 900 } });
      page.on('pageerror', error => errors.push(error.message));
      await page.goto(url);
      const cooking = hours === 6;
      await page.evaluate(({ hours, cooking }) => {
        const Q = DQ, S = Q.newState('Offline fixture');
        Q.S = S;
        S.settings.storyScenes = false;
        S.settings.notify = false;
        S.q.first_steps = { s: 'active', p: [5, 0] };
        S.inv.raw_shrimp = 12;
        Q.startAct(cooking ? 'recipe' : 'fish', cooking ? 'cook_shrimp' : 'shrimp', { quiet: true });
        localStorage.setItem('dashboard-quest-save-v2', JSON.stringify({ ...S, lastSeen: Date.now() - hours * 3600000 }));
      }, { hours, cooking });
      await page.reload();
      const started = Date.now();
      await page.locator('#t-cont').click();
      await page.locator('.wb-digest').waitFor({ timeout: 60000 });
      const ms = Date.now() - started;
      assert.equal(await page.evaluate(hours => DQ.offlineEff(hours * 3600000), hours), Math.min(hours, 24) * wait);
      assert.match(await page.locator('.wb-totals').innerText(), /XP.*coins/is);
      assert.equal(await page.locator('.wb-activities .wb-activity').count() >= 1, true);
      assert.match(await page.locator('.wb-activity').first().innerText(), /XP per hour/);
      assert.match(await page.locator('.wb-main-quest').innerText(), /First Steps.*Chop 5 logs.*0 \/ 5/is);
      assert.equal(await page.locator('.wb #inboxbox, .wb [data-do="openevent"]').count(), 0);
      const pending = await page.evaluate(() => DQ.S.inbox.length);
      assert.equal(await page.locator('.wb-encounter-count').count(), pending > 0 ? 1 : 0);
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
      const visibleContinue = await page.getByRole('button', { name: 'Continue', exact: true }).evaluate(el => {
        const rect = el.getBoundingClientRect();
        return rect.top >= 0 && rect.bottom <= innerHeight + 1;
      });
      assert.ok(visibleContinue, 'Continue is reachable without scrolling the digest');
      if (cooking) {
        assert.match(await page.locator('.wb-status.warn').innerText(), /Stopped after.*out of raw shrimp/i);
        await page.waitForFunction(() => document.querySelector('#title').hidden);
        if (process.env.SHOT_DIR) await page.screenshot({ path: path.join(process.env.SHOT_DIR, 'offline-digest-phone.png') });
      }
      await page.getByRole('button', { name: 'Continue', exact: true }).click();
      assert.equal(await page.locator('.wb-digest').count(), 0);
      assert.equal(await page.evaluate(() => DQ.act?.id || null), cooking ? null : 'shrimp');
      if (!cooking) {
        const preview = await page.evaluate(() => DQ.ui.planHtml());
        assert.match(preview, /XP per hour/);
        assert.match(preview, /raw shrimp per hour/i);
        assert.match(preview, /24 hours at full speed/);
      }
      evidence.push({ hours, counted: Math.min(hours, 24), ms, stopped: cooking });
      await page.close();
    }
    assert.deepEqual(errors, []);
    console.log(JSON.stringify(evidence));
  } finally {
    await browser.close();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
