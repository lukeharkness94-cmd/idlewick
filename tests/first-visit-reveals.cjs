/* Unlock pop-ups and first-visit guides are back by default (owner, 26 Nov 2026). Automated browsers opt in with
   localStorage['idlewick.reveals'] = '1' (as the opening story does). Checks: a new skill's unlock opens its celebration;
   the first visit to the museum opens its guide once, and a second visit does not; Settings → Off stops unlock pop-ups. */
const assert = require('node:assert/strict');
const { chromium } = require('playwright');
const path = require('node:path');
(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined }); const errors = [];
  try {
    const p = await b.newPage({ viewport: { width: 1440, height: 900 } }); p.on('pageerror', e => errors.push(e.message));
    await p.goto(process.env.IDLEWICK_URL || 'http://127.0.0.1:8765/'); await p.evaluate(() => localStorage.setItem('idlewick.reveals', '1'));
    await p.locator('#t-new').click(); await p.locator('#cr-go').click(); await p.waitForFunction(() => DQ.started && document.querySelector('#title').hidden);
    await p.evaluate(() => { for (let i = 0; i < 12; i++) DQ.closeModal(); DQ.S.playtime = 10 * 60e3; DQ.S.settings.notify = true; });
    /* unlock pop-up */
    await p.evaluate(() => DQ.notify({ kind: 'unlock', key: 'unlock:mining', icon: 'mining', title: 'Mining unlocked', text: 'Dig ore out of rocks.', sound: false }));
    await p.waitForSelector('.modal .lr-unlock', { timeout: 3000 });
    if (process.env.SHOT_DIR) await p.screenshot({ path: path.join(process.env.SHOT_DIR, 'unlock-popup.png') });
    await p.evaluate(() => DQ.closeModal());
    /* first visit to the museum */
    await p.evaluate(() => { DQ.go('museum'); DQ.ui.render(true); });
    await p.waitForSelector('.modal .first-visit', { timeout: 3000 });
    const title = await p.locator('.modal h2').first().innerText();
    assert.match(title, /museum/i);
    if (process.env.SHOT_DIR) await p.screenshot({ path: path.join(process.env.SHOT_DIR, 'first-visit-museum.png') });
    await p.evaluate(() => DQ.closeModal());
    await p.evaluate(() => { DQ.go('overview'); DQ.ui.render(true); DQ.go('museum'); DQ.ui.render(true); });
    await p.waitForTimeout(600);
    assert.equal(await p.locator('.modal .first-visit').count(), 0, 'shown once');
    /* the field guide's first visit too */
    await p.evaluate(() => { DQ.go('bestiary'); DQ.ui.render(true); });
    await p.waitForSelector('.modal .first-visit', { timeout: 3000 }); await p.evaluate(() => DQ.closeModal());
    /* Settings Off stops unlock pop-ups */
    await p.evaluate(() => { DQ.S.settings.unlockReveals = false; DQ.S.settings.unlockRevealsChosen = true; DQ.notify({ kind: 'unlock', key: 'unlock:farming', icon: 'farming', title: 'Farming unlocked', text: 'Grow things.', sound: false }); });
    await p.waitForTimeout(400);
    assert.equal(await p.locator('.modal .lr-unlock').count(), 0, 'Off means off');
    assert.deepEqual(errors, []);
    console.log('first-visit-reveals: ok');
  } finally { await b.close(); }
})().catch(e => { console.error(e); process.exit(1); });
