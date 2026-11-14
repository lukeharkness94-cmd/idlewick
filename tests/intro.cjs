/* node tests/intro.cjs (preview server running): the opening for new heroes.
   - plays once after character creation, full screen, with the hero's name in Wren's letter
   - Skip is hidden until the player first clicks or presses a key, then appears and ends it
   - it records S.seen.intro, is not shown again, and existing heroes never see it
   - automated browsers skip it unless localStorage idlewick.intro = 1 (so other suites are unaffected)
   - the story keeps going on its own: it advances without input */
const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const URL = process.env.IDLEWICK_URL || 'http://127.0.0.1:8765/index.html';
(async () => {
  const b = await chromium.launch();
  const make = async force => {
    const ctx = await b.newContext({ viewport: { width: 1440, height: 810 } });
    if (force) await ctx.addInitScript(() => { try { localStorage.setItem('idlewick.intro', '1'); } catch (e) {} });
    const p = await ctx.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message));
    await p.goto(URL); await p.locator('#t-new').click(); await p.locator('#crname').fill('Tamsin'); await p.locator('#cr-go').click();
    return { ctx, p, errs };
  };
  /* automated browser without the flag: no intro */
  { const { ctx, p } = await make(false); await p.waitForTimeout(800); assert.equal(await p.locator('#intro').count(), 0, 'automation skips the intro by default'); await ctx.close(); }
  /* a new hero */
  const { ctx, p, errs } = await make(true);
  await p.waitForTimeout(1500);
  assert.equal(await p.locator('#intro').count(), 1, 'the intro plays for a new hero');
  assert.equal(await p.locator('.in-skip').isHidden(), true, 'no skip prompt before the first click');
  const first = await p.locator('.in-cap').innerText();
  assert.match(first, /bell/i, 'it opens on the bells');
  await p.waitForTimeout(6000);
  assert.notEqual(await p.locator('.in-cap').innerText(), first, 'it moves on by itself');
  assert.equal(await p.locator('.in-skip').isHidden(), true, 'still no skip prompt without input');
  await p.mouse.click(700, 300); await p.waitForTimeout(500);
  assert.equal(await p.locator('.in-skip').isVisible(), true, 'the first click reveals Skip');
  /* hurry to the letter: it names the hero */
  for (let i = 0; i < 12 && !(await p.locator('.in-letter').count()); i++) { await p.mouse.click(700, 300); await p.waitForTimeout(350); }
  assert.match(await p.locator('.in-letter').innerText(), /Dear Tamsin,/, 'Wren writes to the hero by name');
  /* images are whole-number scales */
  const scales = await p.evaluate(() => [...document.querySelectorAll('#intro img.pxa')].map(i => parseFloat(getComputedStyle(i).width) / i.naturalWidth));
  scales.forEach(k => assert.ok(Math.abs(k - Math.round(k)) < .01, 'whole-number scale ' + k));
  await p.locator('.in-skip').click(); await p.waitForTimeout(900);
  assert.equal(await p.locator('#intro').count(), 0, 'Skip ends it');
  assert.equal(await p.evaluate(() => DQ.S.seen.intro), 1, 'recorded as seen');
  assert.equal(await p.evaluate(() => DQ.introWanted()), false, 'never again for this hero');
  /* replay from the Journal */
  await p.evaluate(() => { for (let i = 0; i < 5; i++) if (document.querySelector('.modal')) DQ.closeModal(); DQ.go('journal'); });
  await p.locator('[data-do="introreplay"]').click(); await p.waitForTimeout(600);
  assert.equal(await p.locator('#intro').count(), 1, 'the Journal can replay it');
  await p.keyboard.press('Escape'); await p.keyboard.press('Escape'); await p.waitForTimeout(900);
  assert.equal(await p.locator('#intro').count(), 0, 'Escape (after the first key) ends a replay');
  assert.deepEqual(errs, []);
  await ctx.close(); await b.close();
  console.log('PASS intro: plays once for a new hero, moves on by itself, Skip only after the first click, names the hero, whole-number art, replay from the Journal, automation unaffected');
})().catch(e => { console.error(e); process.exit(1); });
