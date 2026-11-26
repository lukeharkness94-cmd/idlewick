/* Part C Task 21 (live notes are the 'now' tier since Task 12: quest-ready, warnings, deaths; level-ups go to the digest): live notes leave by themselves (DQ.NOTE_TTL, 6 s) and stay in the bell; none covers the Combat page's
   Food or ability panels during a fight; a burst of 10 never shows more than one at a time or keeps more than three. */
const assert = require('node:assert/strict');
const { chromium } = require('playwright');
const path = require('node:path');
(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined }); const errors = [];
  try {
    const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
    p.on('pageerror', e => errors.push(e.message));
    await p.goto(process.env.IDLEWICK_URL || 'http://127.0.0.1:8765/');
    await p.locator('#t-new').click(); await p.locator('#cr-go').click();
    await p.waitForFunction(() => DQ.started && document.querySelector('#title').hidden);
    await p.evaluate(() => { for (let i = 0; i < 12; i++) DQ.closeModal(); DQ.S.settings.notify = true; DQ.holdNotes = false; DQ.go('quests'); });
    /* (1) one note: on screen, gone after the TTL, still in the log */
    const ttl = await p.evaluate(() => { DQ.notify({ kind: 'warn', key: 'qr:test-one', title: 'Quest ready', text: 'Return to Wren', icon: 'star', page: 'quests-x' }); return DQ.NOTE_TTL; });
    assert.ok(ttl >= 4000 && ttl <= 8000);
    assert.equal(await p.locator('#notes .note:not(.out)').count(), 1, 'note shown');
    await p.mouse.move(5, 5);
    await p.waitForTimeout(ttl + 800);
    assert.equal(await p.locator('#notes .note').count(), 0, 'note left by itself');
    assert.ok(await p.evaluate(() => DQ.noteLog.some(e => e.o.key === 'qr:test-one')), 'still in history');
    /* (3) a burst of 10: never more than one on screen, three in all, the rest in history */
    const seen = await p.evaluate(async () => {
      let max = 0; const shown = new Set(); const watch = () => { const n = [...document.querySelectorAll('#notes .note:not(.out)')]; max = Math.max(max, n.length); n.forEach(x => shown.add(x.dataset.key)); };
      const mo = new MutationObserver(watch); mo.observe(document.querySelector('#notes'), { childList: true, subtree: true });
      for (let i = 0; i < 10; i++) DQ.notify({ kind: 'warn', key: 'qr:burst' + i, title: 'Burst ' + i, icon: 'star', page: 'quests-x' });
      watch(); await new Promise(r => setTimeout(r, 3 * (DQ.NOTE_TTL + 500))); watch(); mo.disconnect();
      return { max, shown: shown.size, logged: DQ.noteLog.filter(e => String(e.o.key).startsWith('qr:burst')).length };
    });
    console.log('burst', JSON.stringify(seen));
    assert.ok(seen.max <= 1, 'one at a time'); assert.ok(seen.shown <= 3, 'at most three overlay in a burst'); assert.equal(seen.logged, 10, 'all ten in history');
    /* (2) a level-up during a fight on the Combat page: no overlay, the Food panel stays clear and clickable */
    await p.evaluate(() => { const Q = DQ; Q.S.tut.weaponFinished = true; Q.S.tut.prepareCombat = false; Q.give('bread', 20); Q.startAct('fight', 'mudling', { quiet: true }); Q.go('combat'); Q.ui.render(true); });
    await p.evaluate(() => DQ.notify({ kind: 'warn', key: 'qr:combat', title: 'Quest ready', text: 'Return to Wren', icon: 'star', page: 'quests-x' }));
    await p.waitForTimeout(400);
    const geo = await p.evaluate(() => {
      const food = [...document.querySelectorAll('#view .panel')].find(x => x.offsetWidth > 0 && /^\s*Food/i.test(x.innerText));
      const notes = [...document.querySelectorAll('#notes .note:not(.out)')].map(n => n.getBoundingClientRect());
      const f = food && food.getBoundingClientRect();
      const hit = f && notes.some(n => n.left < f.right && n.right > f.left && n.top < f.bottom && n.bottom > f.top);
      const c = f && document.elementFromPoint(f.left + f.width / 2, f.top + f.height / 2);
      return { at: c ? (c.className || c.tagName) + ' < ' + (c.parentElement && c.parentElement.className) : null, f: f && [f.left, f.top, f.width, f.height].map(Math.round), food: !!food, notes: notes.length, overlap: !!hit, topIsFood: !!(c && food.contains(c)), logged: DQ.noteLog.some(e => e.o.key === 'qr:combat') };
    });
    console.log('combat', JSON.stringify(geo));
    assert.ok(geo.food, 'Food panel found'); assert.equal(geo.overlap, false); assert.ok(geo.topIsFood, 'Food panel is clickable'); assert.ok(geo.logged, 'level-up kept in history');
    if (process.env.SHOT_DIR) await p.screenshot({ path: path.join(process.env.SHOT_DIR, 'live-notes-combat.png') });
    assert.deepEqual(errors, []);
    console.log('live-notes: ok');
  } finally { await b.close(); }
})().catch(e => { console.error(e); process.exit(1); });
