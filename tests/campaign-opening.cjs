const assert = require('node:assert/strict');
const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    await page.goto(process.env.IDLEWICK_URL || 'http://127.0.0.1:8765/');
    await page.locator('#t-new').click();
    await page.locator('#cr-go').click();
    await page.waitForFunction(() => DQ.started && document.querySelector('#title').hidden);
    await page.evaluate(() => {
      DQ.paused = true;
      DQ.S.settings.storyScenes = false;
      DQ.S.settings.notify = false;
      DQ.go('fishing');
    });
    assert.equal(await page.locator('.modal').count(), 0);
    await page.getByRole('button', { name: 'How to use Fishing' }).click();
    const title = await page.locator('.modal h2').allTextContents();
    assert.deepEqual(title, ['Fishing help'], JSON.stringify(errors));
    await page.getByRole('button', { name: 'Got it', exact: true }).click();

    const checkpoints = await page.evaluate(() => {
      const Q = DQ, U = Q.ui, S = Q.S;
      const advance = id => {
        const step = Q.journeyNext();
        U.DO[step.action](step.a, step.b);
        if (Q.act) Q.simulate(35000);
        return { id, step, quest: structuredClone(S.q[id]) };
      };
      Q.startQuest('first_steps');
      Q.startQuest('goblin_menace');
      const oneMain = !S.q.goblin_menace && Q.currentMainQuest()?.id === 'first_steps';
      const caught = advance('first_steps');
      const chopped = advance('first_steps');
      Q.claimQuest('first_steps');
      Q.startQuest('goblin_menace');
      U.DO.finishstarter();
      Q.startAct('recipe', 'cook_shrimp', { quiet: true });
      Q.simulate(45000);
      Q.startAct('fight', 'mudling', { quiet: true });
      let step = Q.journeyNext();
      // Mabel's cooking request is optional. Run the journal's exact main route here.
      if (step.optional) {
        S.q.hungry_cook = { s: 'done', p: [8] };
        step = Q.journeyNext();
      }
      const before = Q.mainQuestProgress();
      U.DO[step.action](step.a, step.b);
      Q.simulate(35000);
      const after = structuredClone(S.q.goblin_menace);
      const legacy = structuredClone(S);
      legacy.q.first_steps = { s: 'active', p: [5, 2] };
      legacy.q.goblin_menace = { s: 'active', p: [2] };
      const migrated = Q.validateSave(legacy);
      return { oneMain, caught, chopped, step, before, after, restored: migrated.q.goblin_menace };
    });
    assert.ok(checkpoints.oneMain);
    assert.ok(checkpoints.caught.quest.p[0] >= 5);
    assert.ok(checkpoints.chopped.quest.p[1] >= 5);
    assert.equal(checkpoints.step.action, 'huntquest');
    assert.equal(checkpoints.step.a, 'goblin');
    assert.equal(checkpoints.before.have, 0);
    assert.ok(checkpoints.after.p[0] > 0);
    assert.deepEqual(checkpoints.restored, { s: 'locked', p: [2], queuedMain: 'active' });

    await page.setViewportSize({ width: 390, height: 844 });
    for (const view of ['combat', 'shop', 'fishing', 'quests']) {
      const fits = await page.evaluate(view => {
        DQ.go(view);
        return document.documentElement.scrollWidth <= innerWidth + 1;
      }, view);
      assert.ok(fits, view + ' fits on a phone');
    }
    assert.deepEqual(errors, []);
    console.log('PASS optional skill help, one active main quest, two First Steps objectives, exact Goblin patrol, preserved older quest and 4 phone layouts');
  } finally {
    await browser.close();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
