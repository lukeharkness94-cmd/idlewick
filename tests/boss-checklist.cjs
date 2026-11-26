/* Part C Task 18: the "Before <boss>" checklist on Home's Next step. Granted fixture: a fresh hero raised to Grubnash's
   Combat requirement in the browser, with an owned helmet in the pack and Power Strike unlocked. */
const assert = require('node:assert/strict');
const { chromium } = require('playwright');
const path = require('node:path');
(async () => {
  const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });
  const errors = [];
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    page.on('pageerror', e => errors.push(e.message));
    page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
    await page.goto(process.env.IDLEWICK_URL || 'http://127.0.0.1:8765/');
    await page.locator('#t-new').click();
    await page.locator('#cr-go').click();
    await page.waitForFunction(() => DQ.started && document.querySelector('#title').hidden);
    const setup = await page.evaluate(() => {
      const Q = DQ, D = Q.data, S = Q.S; Q.paused = true; S.settings.notify = false; S.tut.hidden = true;
      const b = Q.regionBoss(), bq = D.QUESTS.find(q => q.obj.some(o => o.ev === 'boss' && o.key === b.id));
      for (const sk of ['melee', 'defence', 'health']) { let n = 0; while (Q.combatLvl() < b.boss.req && n++ < 400) Q.addXp(sk, 200, { quiet: true }); }
      /* the town's other quests are finished and no restoration is pinned, so Home's goal is the boss quest */
      for (const q of D.QUESTS) if (q.town === b.town && q !== bq && !q.secret) S.q[q.id] = { s: 'done', p: q.obj.map(o => o.n) };
      S.pinnedProject = null; S.tut.weaponFinished = true; S.tut.prepareCombat = false;
      S.q[bq.id] = { s: 'active', p: bq.obj.map(() => 0) };
      for (const sl of ['head', 'body', 'legs', 'shield']) if (S.equip[sl]) { Q.give(S.equip[sl], 1); S.equip[sl] = null; }
      const helm = Object.keys(D.ITEMS).find(id => D.ITEMS[id].slot === 'head' && Q.canEquip(id).ok);
      Q.give(helm, 1); S.abilities = []; for (const a of Object.values(D.AB)) if (Q.abilUnlocked(a) && (!a.style || a.style === Q.weaponStyle())) Q.toggleAbility(a.id);
      S.settings.autoEat = false;
      Q.go('overview'); Q.ui.render(true);
      return { boss: b.id, helm, coins: S.coins, cl: Q.combatLvl(), req: b.boss.req, quest: bq && Q.questState(bq), step: Q.journeyNext().title };
    });
    assert.ok(setup.cl >= setup.req, 'fixture reaches the boss requirement');
    assert.match(setup.step, /^Before /, 'Next step is the checklist: ' + setup.step);
    await page.waitForSelector('.home-next .boss-checklist', { state: 'attached' });
    assert.equal(await page.locator('.home-next .boss-checklist li').count(), 3);
    if (process.env.SHOT_DIR) await page.screenshot({ path: path.join(process.env.SHOT_DIR, 'boss-checklist.png') });
    /* (1) equipping from the inventory, not the checklist, ticks (a) */
    await page.evaluate(h => { DQ.ui.DO.equip(h); DQ.go('overview'); DQ.ui.render(true); }, setup.helm);
    const armourAfter = await page.evaluate(() => DQ.bossArmour());
    assert.ok(armourAfter.done || armourAfter.slot !== 'head', 'the helmet slot is no longer counted empty');
    /* (2) ability button slots one */
    const ab = page.locator('.boss-checklist li[data-check="ability"] .btn');
    if (await ab.count()) { await ab.click(); assert.ok(await page.evaluate(() => DQ.S.abilities.length) > 0, 'ability slotted'); }
    /* (3) auto-eat */
    const ae = page.locator('.boss-checklist li[data-check="food"] .btn');
    if (await ae.count() && /auto-eat/i.test(await ae.innerText())) { await ae.click(); assert.equal(await page.evaluate(() => DQ.S.settings.autoEat), true); }
    /* (5) no checklist button spent coins */
    assert.equal(await page.evaluate(() => DQ.S.coins), setup.coins, 'coins unchanged');
    /* (4) Skip keeps the boss challengeable and the Next step becomes the challenge */
    await page.evaluate(() => { DQ.go('overview'); DQ.ui.render(true); });
    if (await page.locator('.home-next [data-do="bossprepskip"]').count()) await page.locator('.home-next [data-do="bossprepskip"]').click();
    const after = await page.evaluate(() => ({ step: DQ.journeyNext(), coins: DQ.S.coins, skip: DQ.S.bossPrep }));
    /* the checklist is gone (other existing steps, such as this fixture's weapon step, may still come first) */
    assert.equal(after.step.checklist, undefined, 'checklist cleared: ' + after.step.title);
    assert.ok(!/^Before /.test(after.step.title));
    /* and the boss can still be challenged straight away */
    const fought = await page.evaluate(id => { DQ.paused = false; DQ.startAct('fight', id, { quiet: true }); return DQ.act && DQ.act.id; }, setup.boss);
    assert.equal(fought, setup.boss, 'skip never blocks the boss');
    /* (6) a regional challenge already won is claimed from Home before anything else (five-hour replays left them unclaimed) */
    const claim = await page.evaluate(() => { const Q = DQ, D = Q.data, S = Q.S; S.towns.mossbarrow = { visited: true, boss: false }; S.towns.willowbrook.boss = true; S.town = 'mossbarrow'; Q.stopAct(true); for (const x of D.QUESTS) if (x.town === 'willowbrook' && S.q[x.id] && S.q[x.id].s !== 'done') S.q[x.id] = { s: 'done', p: x.obj.map(o => o.n) };
      const q = D.QUESTS.find(x => x.obj.some(o => o.ev === 'kill' && o.key === 'gnarlroot')); S.q[q.id] = { s: 'ready', p: q.obj.map(o => o.n) };
      const n = Q.journeyNext(); return { title: n.title, action: n.action, a: n.a, id: q.id }; });
    assert.equal(claim.action, 'qclaim', 'won challenge is claimed: ' + claim.title); assert.equal(claim.a, claim.id);
    assert.deepEqual(errors, []);
    console.log('boss-checklist: ok', JSON.stringify({ first: setup.step, then: after.step.title }));
  } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exit(1); });
