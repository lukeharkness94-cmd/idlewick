/* node tests/intro.cjs (preview server running): the opening for new heroes (owner, 28 Nov 2026: redone as a living,
   playable scene; js/intro.js).
   - plays once after character creation; automated browsers skip it unless localStorage idlewick.intro = 1
   - it moves on by itself; Skip is hidden until the first input; a click, Space or Enter hurries the beat
   - every beat is reached in order: noon, night, empty, lodging, letter, road, home, title
   - the living systems are really there: townsfolk and town life over the town, the bell rung on the effects bus, the
     hero breathing in the lodging, the walk cycle on the road, the conversation screen at the well (music hushed)
   - Wren's letter names the hero; the reply lands in S.choices.story_opening; Begin records S.seen.intro and leaves
     the game exactly as it was (nothing granted)
   - every picture is at a whole-number multiple of its drawn size
   - Escape ends a replay from the Journal at once
   - under reduced motion nothing moves: one still frame per beat, still skippable
   - no page errors */
const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const URL = process.env.IDLEWICK_URL || 'http://127.0.0.1:8765/index.html';
const BEATS = ['noon', 'night', 'empty', 'lodging', 'letter', 'road', 'home', 'title'];
(async () => {
  const b = await chromium.launch();
  const make = async (force, o = {}) => {
    const ctx = await b.newContext({ viewport: o.viewport || { width: 1440, height: 810 }, reducedMotion: o.reduce ? 'reduce' : 'no-preference' });
    if (force) await ctx.addInitScript(() => { try { localStorage.setItem('idlewick.intro', '1'); } catch (e) {} });
    const p = await ctx.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message));
    await p.goto(URL); await p.locator('#t-new').click(); await p.locator('#crname').fill('Tamsin'); await p.locator('#cr-go').click();
    return { ctx, p, errs };
  };
  const state = p => p.evaluate(() => DQ.introState());
  /* every picture in the opening at a whole-number multiple of its own pixels */
  const wholeScales = p => p.evaluate(() => [...document.querySelectorAll('#intro canvas, #intro img')].filter(e => e.offsetWidth && (e.tagName === 'CANVAS' ? e.width : e.naturalWidth)).map(e => {
    const nat = e.tagName === 'CANVAS' ? e.width : e.naturalWidth; return { cls: e.className, k: parseFloat(getComputedStyle(e).width) / nat }; }));
  const checkScales = async (p, where) => { const list = await wholeScales(p); assert.ok(list.length > 0, 'pictures in ' + where); for (const s of list) assert.ok(s.k >= 1 && Math.abs(s.k - Math.round(s.k)) < .01, `${where}: ${s.cls} at ${s.k}x`); };

  /* an automated browser without the flag: no opening */
  { const { ctx, p } = await make(false); await p.waitForTimeout(800); assert.equal(await p.locator('#intro').count(), 0, 'automation skips the opening by default'); await ctx.close(); }

  /* a new hero, watching */
  const { ctx, p, errs } = await make(true);
  await p.waitForSelector('#intro');
  const before = await p.evaluate(() => JSON.stringify([DQ.S.coins, DQ.S.inv, DQ.S.bank, DQ.S.equip, DQ.S.ammo, DQ.S.xp, DQ.S.q, DQ.S.projects]));
  assert.equal(await p.locator('.op-skip').isHidden(), true, 'no Skip before the first input');
  await p.waitForTimeout(1500);
  let st = await state(p);
  assert.equal(st.beat, 'noon'); assert.match(st.said[0], /bell/i, 'it opens on the bells');
  const town = await p.evaluate(() => ({ walkers: document.querySelectorAll('#intro canvas.town-walkers').length, life: document.querySelectorAll('#intro canvas.town-life').length, scene: !!document.querySelector('#intro .op-scene') }));
  assert.ok(town.scene && town.walkers === 1 && town.life === 2, 'the town is alive: its picture, walkers and town life ' + JSON.stringify(town));
  const audio = await p.evaluate(() => DQ.audioStats().state);
  assert.equal(audio, 'running', 'the sound is running: character creation was a click');
  await p.waitForTimeout(3200);
  st = await state(p);
  assert.ok(st.said.length >= 2, 'it moves on by itself: ' + JSON.stringify(st.said));
  assert.equal(await p.locator('.op-inset.on').count(), 1, 'the bell is shown close up as it rings');
  assert.ok((await p.evaluate(() => DQ.audioStats().played['story:church'] || 0)) >= 1, 'the noon bell is heard');
  assert.equal(await p.locator('.op-skip').isHidden(), true, 'still no Skip without input');
  await checkScales(p, 'noon');

  /* the first click reveals Skip; clicks hurry the beats along */
  await p.mouse.click(700, 300); await p.waitForTimeout(500);
  assert.equal(await p.locator('.op-skip').isVisible(), true, 'the first click reveals Skip');
  for (let i = 0; i < 40 && (await state(p)).beat !== 'lodging'; i++) { await p.mouse.click(700, 300); await p.waitForTimeout(300); }
  assert.equal((await state(p)).beat, 'lodging', 'clicks hurry on to the lodging');
  await p.waitForTimeout(400);
  assert.equal(await p.locator('#intro .op-room .fig-stage .fig-img').count(), 1, 'the hero stands in the room as a living figure (breathing and blinking: js/personality.js)');
  await checkScales(p, 'lodging');
  for (let i = 0; i < 20 && !(await p.locator('[data-op="open"]').count()); i++) { await p.mouse.click(700, 300); await p.waitForTimeout(250); }
  await p.locator('[data-op="open"]').click(); await p.waitForTimeout(2200);
  assert.equal((await state(p)).beat, 'letter');
  assert.match(await p.locator('.op-letter').innerText(), /Dear Tamsin,/, 'Wren writes to the hero by name');
  await checkScales(p, 'letter');
  await p.mouse.click(700, 300); await p.waitForTimeout(300); await p.mouse.click(700, 300); await p.waitForTimeout(900);
  assert.equal((await state(p)).beat, 'road', 'the letter read, the road home');
  const walk = await p.evaluate(async () => { const seen = new Set(), xs = []; for (let i = 0; i < 70; i++) { await new Promise(r => requestAnimationFrame(r)); seen.add(document.querySelector('.op-walker').getAttribute('src')); xs.push(DQ.introState().dist); } return { frames: seen.size, xs }; });
  assert.ok(walk.frames >= 2, 'the hero walks in a stride cycle: ' + walk.frames + ' frames');
  for (let i = 1; i < walk.xs.length; i++) assert.ok(walk.xs[i] >= walk.xs[i - 1] && walk.xs[i] - walk.xs[i - 1] < 12, 'the walk is continuous');
  await checkScales(p, 'road');
  /* holding the pointer walks faster */
  const d0 = (await state(p)).dist; await p.mouse.move(700, 300); await p.mouse.down(); await p.waitForTimeout(1000); const d1 = (await state(p)).dist; await p.mouse.up();
  assert.ok(d1 - d0 > 50, 'holding walks faster: ' + (d1 - d0));
  await p.waitForFunction(() => DQ.introState() && DQ.introState().beat === 'home', null, { timeout: 25000 });
  await p.mouse.click(700, 200);
  await p.waitForSelector('.modal.op-talk .story-line', { timeout: 8000 });
  assert.equal((await state(p)).beat, 'home');
  assert.match(await p.locator('.op-talk .story-speaker-name').innerText(), /wren/i, 'Wren speaks in the conversation screen');
  assert.equal(await p.evaluate(() => DQ.hushState().on), true, 'the conversation hushes the music');
  await checkScales(p, 'home');
  const lines = [];
  for (let i = 0; i < 6 && !(await p.locator('.op-talk [data-do="storychoose"]').count()); i++) { lines.push(await p.locator('.op-talk .story-line').innerText()); await p.locator('.op-talk .story-line').click(); await p.waitForTimeout(300); }
  assert.match(lines.slice(-2).join(' '), /town back on its feet.*next town opens.*whoever has the bells/is, 'the conversation ends on the plain goal, before the reply');
  await p.locator('.op-talk [data-do="storychoose"][data-b="kettle"]').click(); await p.waitForTimeout(300);
  assert.equal(await p.evaluate(() => DQ.S.choices.story_opening), 'kettle', 'the reply is kept in S.choices');
  await p.locator('.op-talk [data-do="storynext"]').click();
  await p.waitForSelector('[data-op="begin"]'); await p.waitForTimeout(600);
  st = await state(p);
  assert.deepEqual(st.reached, BEATS, 'every beat, in order');
  await p.locator('[data-op="begin"]').click(); await p.waitForTimeout(1000);
  assert.equal(await p.locator('#intro').count(), 0, 'Begin ends it');
  assert.equal(await p.evaluate(() => DQ.S.seen.intro), 1, 'recorded as seen');
  assert.equal(await p.evaluate(() => DQ.introWanted()), false, 'never again for this hero');
  assert.equal(await p.locator('.modal').count(), 0, 'nothing left open');
  assert.notEqual(await p.evaluate(() => DQ.musicNow().want), 'title', 'the music is the game’s again');
  assert.equal(await p.evaluate(() => JSON.stringify([DQ.S.coins, DQ.S.inv, DQ.S.bank, DQ.S.equip, DQ.S.ammo, DQ.S.xp, DQ.S.q, DQ.S.projects])), before, 'the opening grants nothing and changes no progress');

  /* replay from the Journal: Skip shows after the first key, Escape ends it at once */
  await p.evaluate(() => { for (let i = 0; i < 5; i++) if (document.querySelector('.modal')) DQ.closeModal(); DQ.go('journal'); });
  await p.locator('[data-do="introreplay"]').click(); await p.waitForTimeout(700);
  assert.equal(await p.locator('#intro').count(), 1, 'the Journal can replay it');
  await p.keyboard.press('Escape'); await p.waitForTimeout(900);
  assert.equal(await p.locator('#intro').count(), 0, 'Escape ends it at once');
  assert.deepEqual(errs, []);
  await ctx.close();

  /* reduced motion: still frames with their words, nothing moves, still skippable */
  { const { ctx, p, errs } = await make(true, { reduce: true, viewport: { width: 390, height: 844 } });
    await p.waitForSelector('#intro'); await p.waitForTimeout(1200);
    const s0 = await state(p); assert.equal(s0.still, true, 'reduced motion plays the still version');
    const snap = () => p.evaluate(() => { const world = document.querySelector('#intro .op-world'), props = document.querySelector('#intro .op-props');
      return { world: world && world.style.transform, props: props && props.toDataURL().length, walkers: document.querySelectorAll('#intro canvas.town-walkers').length, anims: document.getAnimations().filter(a => a.effect && a.effect.target && a.effect.target.closest && a.effect.target.closest('#intro') && a.playState === 'running').length }; });
    const a = await snap(); await p.waitForTimeout(1500); const c = await snap();
    assert.equal(a.walkers, 0, 'no townsfolk walking'); assert.equal(c.anims, 0, 'no animations running');
    assert.deepEqual(a, c, 'nothing moves in the still frame');
    assert.ok((await state(p)).said.length >= 1, 'the words still show');
    await checkScales(p, 'still noon (phone)');
    for (const id of ['lodging', 'road', 'home']) { await p.evaluate(id => DQ.introJump(id), id); await p.waitForTimeout(500); await checkScales(p, 'still ' + id + ' (phone)'); }
    await p.mouse.click(200, 200); await p.waitForTimeout(300);
    if (await p.locator('.modal.op-talk').count()) await p.keyboard.press('Escape'); else await p.locator('.op-skip').click();
    await p.waitForTimeout(400);
    assert.equal(await p.locator('#intro').count(), 0, 'the still version can be skipped');
    assert.equal(await p.evaluate(() => DQ.S.seen.intro), 1);
    assert.deepEqual(errs, []);
    await ctx.close(); }
  await b.close();
  console.log('PASS intro: plays once for a new hero; noon, night, empty, lodging, letter, road, home and title in order; living town, bell, breathing hero, walk cycle, conversation with a kept reply; names the hero; whole-number art; nothing granted; Skip after the first input, Escape at once; still under reduced motion; automation unaffected');
})().catch(e => { console.error(e); process.exit(1); });
