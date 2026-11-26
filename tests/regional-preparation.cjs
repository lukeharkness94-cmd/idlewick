const assert = require('node:assert/strict');
const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });
  try {
    const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(process.env.IDLEWICK_URL || 'http://127.0.0.1:8765/');
    await page.locator('#t-new').click();
    await page.locator('#cr-go').click();
    await page.waitForFunction(() => DQ.started && document.querySelector('#title').hidden);
    const result = await page.evaluate(() => {
      const Q = DQ, S = Q.S, D = Q.data;
      Q.paused = true;
      S.settings.storyScenes = false;
      S.settings.notify = false;
      S.tut.hidden = true;
      const legacy = structuredClone(S);
      legacy.q.boar_hunt = { s: 'active', p: [7, 3] };
      legacy.q.crab_cull = { s: 'done', p: [10] };
      legacy.projectGiven = { market: { crop_potato: 10 }, jetty: { log_oak: 20 } };
      const migrated = Q.validateSave(legacy);
      const twice = Q.validateSave(migrated);
      S.town = 'mossbarrow';
      S.q.boar_hunt = { s: 'active', p: [0, 0, 0, 0] };
      S.towns.willowbrook.boss = true;
      S.towns.mossbarrow = { visited: true, boss: false };
      const first = Q.journeyNext();
      const levels = Object.fromEntries(Object.keys(D.PROJECTS.market.cost).filter(id => id !== 'coins').map(id => {
        const src = Q.sourceOf(id), n = D.NODE[src.kind + ':' + src.id];
        return [id, Q.nodeHere(n) && Q.skillUnlocked(src.skill)];
      }));
      Q.startAct(first.a, first.b, { quiet: true });
      Q.simulate(30000);
      const second = Q.journeyNext();
      Q.stopAct(true);
      S.q.boar_hunt.s = 'done';
      S.town = 'saltmere';
      S.towns.mossbarrow.boss = true;
      S.towns.saltmere = { visited: true, boss: false };
      S.q.crab_cull = { s: 'active', p: [0, 0] };
      const harbour = Q.journeyNext();
      const checks = D.TOWNS.map(town => Q.ui.bossReadiness(D.MON[town.boss]));
      S.town = 'mossbarrow';
      S.towns.mossbarrow.boss = false;
      Q.go('combat');
      return { first, second, harbour, levels, checks, quests: twice.q, given: twice.projectGiven };
    });
    assert.equal(result.first.b, 'normal');
    assert.equal(result.second.b, 'shrimp');
    assert.equal(result.harbour.b, 'normal');
    assert.deepEqual(result.quests.boar_hunt.p, [7, 3, 0, 0]);
    assert.deepEqual(result.quests.crab_cull.p, [10, 8]);
    assert.deepEqual(result.given, { market: { flax: 4 }, jetty: { log_normal: 8 } });
    assert.deepEqual(result.levels, { log_normal: true, flax: true });
    for (const preview of result.checks) assert.match(preview, /Counter.*Your max hit.*Food.*healing/);
    await page.locator('.boss-foot').click();
    await page.locator('.modal .boss-readiness').waitFor({ state: 'visible' });
    if (process.env.SCREENSHOT) await page.screenshot({ path: process.env.SCREENSHOT });
    await page.setViewportSize({ width: 390, height: 844 });
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
    assert.deepEqual(errors, []);
    console.log('PASS regional preparation order, all eight boss previews, exact early supplies, and idempotent migration');
  } finally {
    await browser.close();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
