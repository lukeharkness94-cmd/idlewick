/* Fresh navigation, exact gates, and prepared combat in the published browser entry point. */
const assert = require('node:assert/strict');
const { chromium } = require('playwright');
const path = require('node:path');

(async () => {
  const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(process.env.IDLEWICK_URL || 'http://127.0.0.1:8765/');
    await page.locator('#t-new').click();
    await page.locator('#cr-go').click();
    await page.waitForFunction(() => DQ.started && document.querySelector('#title').hidden);
    const starter = await page.locator('#skilldock .dk').evaluateAll(rows => rows.map(row => row.dataset.a));
    assert.deepEqual(starter, ['fishing', 'woodcutting', 'cooking']);
    await page.locator('#skilldock .dk-requirements').click();
    assert.equal(await page.locator('.skill-requirement-group').count(), 1);
    assert.ok(await page.locator('.skill-requirement-group .locked').count() > 8);
    for (const row of await page.locator('.skill-requirement-group .locked').all()) {
      assert.ok((await row.locator('small').innerText()).trim().length > 3);
    }
    assert.equal(await page.locator('.skill-summary details, .skill-summary select').count(), 0);
    if (process.env.SHOT_DIR) await page.screenshot({ path: path.join(process.env.SHOT_DIR, 'locked-skill-requirements.png') });
    const exact = await page.evaluate(() => {
      const Q = DQ;
      Q.paused = true;
      Q.S.settings.notify = false;
      Q.S.tut.hidden = true;
      Object.keys(Q.skillLessons).forEach(key => { Q.S.tut.done['lesson:' + key] = true; });
      const before = Q.data.SKILLS.filter(skill => Q.skillUnlocked(skill.id)).map(skill => skill.id);
      Q.give('tool_pick_1', 1);
      if (Q.skillUnlocked('mining')) return ['purchase bypassed the gate'];
      Q.startAct('wood', 'normal', { quiet: true });
      while (Q.S.stats.chop < 10) Q.simulate(Q.act.dur);
      Q.stopAct(true);
      return Q.data.SKILLS.filter(skill => Q.skillUnlocked(skill.id) && !before.includes(skill.id)).map(skill => skill.id);
    });
    assert.deepEqual(exact, ['mining']);
    const prep = await page.evaluate(() => {
      const Q = DQ;
      const blocked = !Q.startAct('fight', 'mudling', { quiet: true });
      const logs = Q.have('log_normal');
      for (let i = 0; i < 8; i++) Q.closeModal();
      Q.ui.DO.finishstarter();
      Q.ui.DO.finishstarter();
      const consumed = logs - Q.have('log_normal');
      const noFood = !Q.startAct('fight', 'mudling', { quiet: true });
      Q.startAct('fish', 'shrimp', { quiet: true });
      Q.simulate(Q.act.dur * 10);
      Q.startAct('recipe', 'cook_shrimp', { quiet: true });
      Q.simulate(Q.act.dur * 10);
      const canFight = Q.startAct('fight', 'mudling', { quiet: true });
      return { blocked, consumed, noFood, canFight };
    });
    assert.deepEqual(prep, { blocked: true, consumed: 1, noFood: true, canFight: true });
    const returning = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    returning.on('pageerror', error => errors.push(error.message));
    await returning.goto(process.env.IDLEWICK_URL || 'http://127.0.0.1:8765/');
    await returning.evaluate(() => {
      const Q = DQ, S = Q.newState('Returning');
      S.xp.carpentry = Q.data.XPF[10];
      S.xp.beastmastery = Q.data.XPF[10];
      localStorage.setItem('dashboard-quest-save-v2', JSON.stringify(S));
    });
    await returning.reload();
    await returning.locator('#t-cont').click();
    await returning.waitForFunction(() => DQ.started && document.querySelector('#title').hidden);
    assert.equal(await returning.locator('#skilldock .dk[data-a="carpentry"]').count(), 1);
    assert.equal(await returning.locator('#skilldock .dk[data-a="beastmastery"]').count(), 1);
    await returning.locator('#skilldock .dk-requirements').click();
    await returning.locator('[data-do="skiponboarding"]').click();
    assert.ok(await returning.locator('#skilldock .dk.locked').count() > 5);
    await returning.close();
    await page.setViewportSize({ width: 390, height: 844 });
    for (const view of ['combat', 'shop', 'fishing', 'quests', 'skillsummary']) {
      const fit = await page.evaluate(view => {
        DQ.go(view);
        return document.documentElement.scrollWidth <= innerWidth + 1 &&
          !document.querySelector('#view').textContent.includes('Something went wrong');
      }, view);
      assert.ok(fit, view + ' fits a 390px phone');
    }
    assert.deepEqual(errors, []);
    console.log('PASS 3 starter skills, visible requirements, exact Mining unlock, combat preparation, 2 preserved legacy skills, Skip Onboarding and 5 phone layouts');
  } finally {
    await browser.close();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
