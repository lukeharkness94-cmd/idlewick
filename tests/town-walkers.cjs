/* Townsfolk walking over the Home and Village scenes (js/town_walkers.js, owner 26 Nov 2026): a canvas of the
   scene's own pixel size sits exactly over the picture, its walkers stay on the two roads and move over time,
   restoring the town adds walkers, the overlay never takes clicks, and html.calm leaves only the painted folk. */
const assert = require('node:assert/strict');
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined }); const errors = [];
  try {
    const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
    p.on('pageerror', e => errors.push(e.message));
    await p.goto(process.env.IDLEWICK_URL || 'http://127.0.0.1:8765/');
    await p.locator('#t-new').click(); await p.locator('#cr-go').click();
    await p.waitForFunction(() => DQ.started && document.querySelector('#title').hidden);
    await p.evaluate(() => { DQ.paused = true; for (let i = 0; i < 12; i++) DQ.closeModal(); DQ.go('overview'); DQ.ui.render(true); });
    await p.waitForFunction(() => DQ.townWalkersLive().length > 0, null, { timeout: 5000 });
    /* (1) overlay matches the picture's box and pixel size, and ignores the pointer */
    const box = await p.evaluate(() => { const img = document.querySelector('.home-scene img.scene'), cv = img.parentElement.querySelector('canvas.town-walkers'), a = img.getBoundingClientRect(), c = cv.getBoundingClientRect(), cs = getComputedStyle(cv);
      return { cls: cv.className, w: [img.naturalWidth, cv.width], h: [img.naturalHeight, cv.height], dx: Math.abs(a.left - c.left) + Math.abs(a.top - c.top) + Math.abs(a.width - c.width) + Math.abs(a.height - c.height), pe: cs.pointerEvents, fit: [getComputedStyle(img).objectFit, cs.objectFit] }; });
    assert.equal(box.cls, 'town-walkers'); assert.equal(box.w[0], box.w[1]); assert.equal(box.h[0], box.h[1]);
    assert.ok(box.dx < 1.5, 'canvas sits exactly over the scene: ' + box.dx); assert.equal(box.pe, 'none'); assert.equal(box.fit[0], box.fit[1]);
    /* (2) they walk the roads, and move */
    const a = await p.evaluate(() => DQ.townWalkersLive()[0].walkers); await p.waitForTimeout(2500); const c = await p.evaluate(() => DQ.townWalkersLive()[0].walkers);
    assert.ok(a.every(w => [162, 163, 244, 245].includes(w.y)), 'feet on the roads');
    assert.ok(c.some((w, i) => w.x !== a[i].x), 'someone moved');
    /* (3) more walkers once the town is restored */
    const n = await p.evaluate(() => { const t = DQ.S.town, before = DQ.townWalkerCount(t); for (const [k, v] of Object.entries(DQ.data.PROJECTS)) if (v.town === t) DQ.S.projects[k] = true; const after = DQ.townWalkerCount(t); for (const [k, v] of Object.entries(DQ.data.PROJECTS)) if (v.town === t) delete DQ.S.projects[k]; return [before, after]; });
    assert.ok(n[1] > n[0], 'restoration brings people out: ' + n);
    /* (4) Village scene too, under the site markers */
    await p.evaluate(() => DQ.go('projects')); await p.waitForFunction(() => document.querySelector('.village-scene canvas.town-walkers'), null, { timeout: 5000 });
    const order = await p.evaluate(() => { const cv = document.querySelector('.village-scene canvas.town-walkers'), spot = document.querySelector('.village-scene .site-spot'); return !spot || !!(cv.compareDocumentPosition(spot) & Node.DOCUMENT_POSITION_FOLLOWING); });
    assert.ok(order, 'site markers paint above the walkers');
    /* (5) Settings → Reduce effects (html.calm): no overlay */
    await p.evaluate(() => { DQ.S.settings.reduceFx = true; DQ.go('overview'); DQ.ui.render(true); });
    await p.waitForTimeout(300);
    assert.equal(await p.locator('canvas.town-walkers').count(), 0, 'no walkers under calm');
    assert.deepEqual(errors, []);
    console.log('PASS town walkers: overlay fits, walks the roads, grows with restoration, Village, calm');
  } finally { await b.close(); }
})().catch(e => { console.error(e); process.exit(1); });
