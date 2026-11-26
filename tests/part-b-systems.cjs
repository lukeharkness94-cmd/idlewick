const assert = require('node:assert/strict');
const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });
  try {
    const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
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
      DQ.go('overview');
    });
    assert.deepEqual(await page.locator('[data-home-unit]').evaluateAll(els => els.map(el => el.dataset.homeUnit)),
      ['scene', 'activity', 'coins', 'goal']);
    if (process.env.SHOT_DIR) { await page.waitForTimeout(400); await page.screenshot({ path: process.env.SHOT_DIR + '/part-b-home-phone.png' }); }
    const checks = await page.evaluate(() => {
      const Q = DQ, S = Q.S, D = Q.data, U = Q.ui;
      const key = 'dashboard-quest-save-v2';
      const day = Date.now();
      const offers = Q.dailyOffers(day);
      const coins = S.coins;
      const offer = offers[0];
      Q.qev(offer.event, offer.task, offer.target);
      Q.qev(offer.event, offer.task, offer.target);
      const earned = S.coins - coins;
      const nextOffers = Q.dailyOffers(day + 86400000);
      const balances = S.coins;
      Q.give('log_normal', 8);
      Q.give('log_oak', 12);
      const before = Q.sceneUrl('willowbrook');
      const bread = Q.have('bread');
      const contributed = Q.projectGive('well', 'log_oak') + Q.projectGive('well', 'log_normal');
      const bundlePay = Q.have('bread') - bread;
      const duplicate = Q.projectGive('well', 'log_oak');
      S.coins = 500;
      Q.finishProject('well');
      const restored = before !== Q.sceneUrl('willowbrook');
      const state = Q.validateSave(structuredClone(S));
      S.villageProceedsAt = day - 7 * 86400000;
      const proceeds = Q.villageProceeds(day);
      const price = Q.buyPrice('bread'), previousStock = Q.have('bread');
      S.coins = 10 * price;
      const exact = Q.buyMax('bread');
      S.coins--;
      const oneShort = Q.buyMax('bread');
      D.ITEMS.bread.stackLimit = previousStock + 3;
      const capacity = Q.buyMax('bread');
      delete D.ITEMS.bread.stackLimit;
      const current = D.ITEMS[S.equip.weapon];
      const target = D.ITEMS.iron_sword, original = target.b;
      target.b = { ...current.b, atk: (current.b.atk || 0) + 2, str: (current.b.str || 0) - 1 };
      const deltas = Q.itemBonuses('iron_sword');
      target.b = original;
      const oldType = D.ITEMS.log_normal.type;
      D.ITEMS.log_normal.type = 'junk';
      Q.give('log_normal', 1);
      const protectedLogs = !Q.junkSale().entries.some(([id]) => id === 'log_normal');
      D.ITEMS.log_normal.type = oldType;
      const weapon = S.equip.weapon, weaponType = current.type;
      current.type = 'junk';
      Q.give(weapon, 1);
      const protectedWeapon = !Q.junkSale().entries.some(([id]) => id === weapon);
      current.type = weaponType;
      const flaxType = D.ITEMS.flax.type;
      D.ITEMS.flax.type = 'junk';
      Q.give('flax', 1);
      S.q.mq_crafting = { s: 'active', p: [0, 0] };
      const protectedQuest = !Q.junkSale().entries.some(([id]) => id === 'flax');
      delete S.q.mq_crafting;
      D.ITEMS.flax.type = flaxType;
      Q.S.coins = 150;
      Q.save();
      const saved = Q.exportSave();
      Q.S.coins = 155;
      Q.save();
      const backup = JSON.parse(localStorage.getItem(key + '-previous')).coins;
      localStorage.setItem(key, '{broken');
      const recovered = Q.load() && Q.S.coins === 150;
      Q.eraseSave();
      const imported = Q.importSave(saved);
      const importedCoins = Q.S.coins;
      U.shopCategory = 'equipment';
      Q.go('shop');
      return { systems: new Set(offers.map(e => e.skill)).size, earned, reward: offer.reward, fresh: nextOffers.every(o => !o.paid), balances, coins,
        bundlePay, contributed, duplicate, restored, savedRestoration: state.projects.well, proceeds, exact, oneShort, capacity, deltas, protectedLogs,
        protectedWeapon, protectedQuest, backup, recovered, imported, importedCoins };
    });
    assert.equal(checks.systems, 3);
    assert.equal(checks.earned, checks.reward);
    assert.equal(checks.balances, checks.coins + checks.reward);
    assert.ok(checks.fresh);
    assert.equal(checks.contributed, 20);
    assert.equal(checks.bundlePay, 1);
    assert.equal(checks.duplicate, 0);
    assert.ok(checks.restored && checks.savedRestoration);
    assert.equal(checks.proceeds, 2016);
    assert.deepEqual([checks.exact, checks.oneShort, checks.capacity], [10, 9, 3]);
    assert.deepEqual(checks.deltas.map(d => d.value), [2, -1]);
    assert.ok(checks.protectedLogs && checks.protectedWeapon && checks.protectedQuest);
    assert.ok(checks.imported && checks.recovered);
    assert.deepEqual([checks.backup, checks.importedCoins], [150, 150]);
    assert.ok(await page.locator('.stock-item .inline-buy').count());
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), 'Shop fits 390px');
    await page.locator('[data-do=shopcategory][data-a=supplies]').click();
    await page.locator('.stock-item .inline-buy').first().waitFor({ state: 'visible' });
    if (process.env.SHOT_DIR) { await page.waitForTimeout(500); await page.screenshot({ path: process.env.SHOT_DIR + '/part-b-shop-phone.png' }); }

    const audit = await page.evaluate(() => {
      DQ.go('overview');
      const main = document.querySelector('.home-glance');
      const inspect = () => ({ page: DQ.ui.view, gap: document.documentElement.scrollWidth - innerWidth,
        body: parseFloat(getComputedStyle(main).fontSize),
        smallerTargets: [...main.querySelectorAll('button')].filter(b => b.offsetWidth < 48 || b.offsetHeight < (b.classList.contains('primary') ? 56 : 48)).length });
      const normal = inspect();
      main.style.fontSize = '200%';
      const raised = inspect();
      const rgb = hex => hex.trim().match(/[a-f\d]{2}/gi).map(v => parseInt(v, 16) / 255);
      const luminance = hex => rgb(hex).map(v => v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4)
        .reduce((sum, v, i) => sum + v * [0.2126, 0.7152, 0.0722][i], 0);
      const ratios = ['light', 'dark'].map(theme => {
        DQ.setTheme(theme);
        const css = getComputedStyle(document.documentElement);
        const pair = [luminance(css.getPropertyValue('--ink')), luminance(css.getPropertyValue('--panel'))].sort((a, b) => b - a);
        return (pair[0] + 0.05) / (pair[1] + 0.05);
      });
      return { normal, raised, ratios };
    });
    assert.equal(audit.normal.body, 18);
    assert.equal(audit.normal.smallerTargets, 0);
    assert.ok(audit.normal.gap <= 1 && audit.raised.gap <= 1);
    assert.ok(audit.ratios.every(ratio => ratio >= 4.5));
    assert.deepEqual(errors, []);
    console.log('PASS Home glance, Shop fit, deltas/Buy Max, one-time bundle rewards, no-expiry village proceeds, daily rewards, and save string');
    console.log('Home audit at 390px', audit);
  } finally {
    await browser.close();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
