const assert = require('node:assert/strict');
const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });
  try {
    const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
    await page.goto(process.env.IDLEWICK_URL || 'http://127.0.0.1:8765/');
    await page.locator('#t-new').click();
    await page.locator('#cr-go').click();
    await page.waitForFunction(() => DQ.started && document.querySelector('#title').hidden);
    const checks = await page.evaluate(() => {
      const Q = DQ, S = Q.S;
      Q.paused = true;
      S.settings.storyScenes = false;
      S.settings.unlockReveals = true;
      Q.grant('raw_shrimp', 7);
      Q.grant('raw_shrimp', 5);
      Q.grant('sapphire', 1);
      Q.flushItemDigest();
      Q.flushItemDigest();
      Q.notify({ kind: 'adv', key: 'adv', title: 'Hero level 5', to: 5 });
      Q.notify({ kind: 'level', key: 'lvl:fishing', title: 'Fishing level 2', to: 2 });
      Q.notify({ kind: 'unlock', key: 'unique:sapphire', title: 'A Sapphire' });
      const routineModal = !!document.querySelector('.modal');
      Q.modal({ title: 'Keep this open', body: '' });
      Q.notify({ kind: 'unlock', key: 'unlock:mining', title: 'Mining unlocked' });
      const protectedModal = document.querySelector('.modal h2').textContent;
      Q.closeModal();
      const caught = Q.have('raw_shrimp');
      const loot = Q.noteLog.filter(row => row.o.kind === 'loot').map(row => row.o.text);
      Q.startAct('fish', 'shrimp', { quiet: true });
      Q.ui.DO.plan();
      return { routineModal, protectedModal, loot, caught, unread: Q.unreadNotes };
    });
    assert.equal(checks.routineModal, false);
    assert.equal(checks.protectedModal, 'Keep this open');
    assert.equal(checks.caught, 12);
    assert.deepEqual(checks.loot, ['×12 Raw shrimp, ×1 Sapphire']);
    assert.ok(checks.unread >= 3);
    await page.locator('#plan-target-level').fill('3');
    await page.locator('[data-do="setlevelstop"]').click();
    assert.equal(await page.evaluate(() => DQ.S.act.lvlTarget), 3);
    await page.evaluate(() => {
      DQ.closeModal();
      DQ.simulate(120000);
      DQ.go('overview');
      DQ.ui.renderHud();
    });
    assert.equal(await page.evaluate(() => DQ.act), null);
    assert.equal(await page.evaluate(() => DQ.lvl('fishing')), 3);
    assert.match(await page.locator('#nowcard').innerText(), /stopped at level 3/);
    await page.evaluate(() => DQ.openBell());
    await page.locator('.bell-list').getByText('×12 Raw shrimp, ×1 Sapphire').waitFor();
    assert.equal(await page.evaluate(() => DQ.unreadNotes), 0);
    console.log('PASS quiet levels and finds, counted loot, no modal replacement, and a saved level-3 stop rule');
  } finally {
    await browser.close();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
