/* The hearth and the diary (owner, 27 Nov 2026: "a warm dashboard we can feel at home in"):
   1 Home opens inside the hero's room at a whole-number scale, with today's goal pinned to the board
   2 the room's objects are ways in: the chest opens the backpack, the note opens Quests, the window steps outside to the
     town (and "Go inside" comes back); the choice is remembered
   3 the fire moves in normal play and holds still under Reduce effects
   4 Welcome back opens with a diary entry written from the real report (the town, the task, the level it brought)
   5 the season shows in the towns (leaves in autumn) */
const assert = require('node:assert/strict');
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined }); const errors = [];
  try {
    const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
    p.on('pageerror', e => errors.push(e.message));
    await p.addInitScript(() => localStorage.setItem('idlewick.hearth', '1'));
    await p.goto(process.env.IDLEWICK_URL || 'http://127.0.0.1:8765/');
    await p.locator('#t-new').click(); await p.locator('#cr-go').click();
    await p.waitForFunction(() => DQ.started && document.querySelector('#title').hidden);
    await p.evaluate(() => { for (let i = 0; i < 12; i++) DQ.closeModal(); DQ.S.settings.notify = false; DQ.paused = true; DQ.go('overview'); DQ.ui.render(true); });
    await p.waitForFunction(() => DQ.hearthLive && DQ.hearthLive() && DQ.hearthLive().src, null, { timeout: 8000 });
    /* 1 */
    const h = await p.evaluate(() => { const L = DQ.hearthLive(), img = document.querySelector('.hearth-room'); return { ...L, w: parseFloat(img.style.width), town: !!document.querySelector('.home-scene img.scene') }; });
    assert.ok(Number.isInteger(h.scale) && h.scale >= 1 && h.w === 320 * h.scale, 'whole-number room scale: ' + JSON.stringify(h));
    assert.match(h.note, /First Steps/, 'the goal is pinned to the board'); assert.equal(h.town, false, 'inside, not the town picture');
    for (const k of ['window', 'shelf', 'map', 'chest', 'desk']) assert.ok(h.spots.includes(k), 'hotspot ' + k);
    /* 2 */
    await p.click('.hearth-spot[data-spot="chest"]'); assert.equal(await p.evaluate(() => DQ.ui.view), 'character', 'the chest opens the backpack');
    await p.evaluate(() => { DQ.go('overview'); DQ.ui.render(true); }); await p.waitForSelector('.hearth-note');
    await p.click('.hearth-note'); assert.equal(await p.evaluate(() => DQ.ui.view), 'quests', 'the note opens Quests');
    await p.evaluate(() => { DQ.go('overview'); DQ.ui.render(true); }); await p.waitForSelector('.hearth-spot[data-spot="window"]');
    await p.click('.hearth-spot[data-spot="window"]');
    const out = await p.evaluate(() => ({ town: !!document.querySelector('.home-scene img.scene'), hearth: !!document.querySelector('.hearth'), saved: DQ.S.settings.homeView, back: !!document.querySelector('.home-viewswap[data-a="hearth"]') }));
    assert.deepEqual(out, { town: true, hearth: false, saved: 'town', back: true }, 'the window steps outside');
    await p.click('.home-viewswap[data-a="hearth"]'); await p.waitForSelector('.hearth-room');
    /* 3 */
    const t0 = await p.evaluate(() => DQ.hearthLive().t); await p.waitForTimeout(800); const t1 = await p.evaluate(() => DQ.hearthLive().t);
    assert.ok(t1 > t0, 'the fire moves');
    await p.evaluate(() => { DQ.S.settings.reduceFx = true; DQ.ui.render(true); }); await p.waitForTimeout(200);
    const c0 = await p.evaluate(() => DQ.hearthLive().t); await p.waitForTimeout(800); const c1 = await p.evaluate(() => DQ.hearthLive().t);
    assert.equal(c1, c0, 'still under Reduce effects'); await p.evaluate(() => { DQ.S.settings.reduceFx = false; DQ.ui.render(true); });
    /* 4 */
    const diary = await p.evaluate(() => { const Q = DQ; Q.startAct('fish', 'shrimp', { quiet: true }); const sum = Q.simulate(2 * 3600e3, 2 * 3600e3, { report: true }); Q.emit('welcome', sum, 2 * 3600e3);
      return new Promise(r => setTimeout(() => { const d = document.querySelector('.wb-diary'); r(d ? d.innerText : null); Q.stopAct(true); for (let i = 0; i < 8; i++) Q.closeModal(); }, 500)); });
    assert.ok(diary && /in Willowbrook/.test(diary) && /fishing shrimp/i.test(diary) && /Fishing went from 1 to/.test(diary), 'a diary entry from the real report: ' + diary);
    /* 5 */
    await p.evaluate(() => { DQ.seasonOverride = 'autumn'; DQ.S.settings.homeView = 'town'; DQ.go('overview'); DQ.ui.render(true); });
    await p.waitForFunction(() => DQ.townLifeLive().length, null, { timeout: 8000 }); await p.waitForTimeout(500);
    const leaves = await p.evaluate(() => { const cv = document.querySelector('.home-scene canvas.town-life-under'), d = cv.getContext('2d').getImageData(0, 0, cv.width, cv.height).data; let n = 0; for (let i = 0; i < d.length; i += 4) if (d[i] === 0xd8 && d[i + 1] === 0x78 && d[i + 2] === 0x2a) n++; return n; });
    assert.ok(leaves > 0, 'autumn leaves fall in town');
    assert.deepEqual(errors, []);
    console.log('PASS hearth: room at a whole scale with the goal pinned, objects open their pages, step outside and back, fire still under Reduce effects, diary on Welcome back, autumn leaves');
  } finally { await b.close(); }
})().catch(e => { console.error(e); process.exit(1); });
