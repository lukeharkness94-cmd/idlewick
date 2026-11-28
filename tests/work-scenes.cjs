/* Work scenes that live (owner, 28 Nov 2026; js/work_scenes.js). In the real page:
   (1) the three layers sit on the running work scene, in the backdrop's own pixels (240 x 100 shown at 3x);
   (2) work leaves a mark: strikes and real yields accumulate (a log pile, an ore heap...), a miss adds nothing to the
       pile, the pile is capped however long you work, and starting a different activity clears it;
   (3) nothing changes in a forecast or a simulation (time away): no strike, no yield, no pile;
   (4) outdoor weather follows the town (DQ.townWeatherOverride): rain falls, snow, mist; Settings → Display → Town life
       → Weather off turns it off here too; indoor workplaces keep it to their windows (no rain in the forge);
   (5) the town's hour: an outdoor scene takes the night wash, a workshop does not;
   (6) small life moves in normal play (the cook's steam, bubbles and cat);
   (7) under Reduce effects and reduced motion no creature or weather shows or moves, while the marks and the hour stay. */
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
    await p.evaluate(() => { for (let i = 0; i < 12; i++) DQ.closeModal(); const S = DQ.S, D = DQ.data; S.settings.notify = false; S.settings.storyScenes = false; S.settings.muted = true; S.tut.hidden = true;
      for (const s of D.SKILLS) S.unlocked[s.id] = true; for (const r of Object.values(D.RECIPES)) for (const k of Object.keys(r.in || {})) if (D.ITEMS[k] && !D.ITEMS[k].slot) S.inv[k] = 500;
      DQ.townWeatherOverride = 'clear'; DQ.townTimeOverride = 13; DQ.seasonOverride = 'autumn'; for (let i = 0; i < 12; i++) DQ.closeModal(); });
    const ids = await p.evaluate(() => { const D = DQ.data; return { mine: D.NODES.mine[0].id, forge: D.RLIST.smithing.find(r => !/smelt/.test(r.id)).id, cook: D.RLIST.cooking.slice().sort((a, b) => (a.lvl || 0) - (b.lvl || 0))[0].id }; });
    const start = (kind, id, page) => p.evaluate(([kind, id, page]) => { const D = DQ.data; DQ.stopAct(true);
      if (kind === 'recipe') { const g = DQ.recipeGroup(D.RECIPES[id]), sk = D.RECIPES[id].skill; DQ.ui.tab[sk] = g.g; DQ.ui.tab[sk + 'sub'] = g.s || null; }
      DQ.ui.taskChoice[page] = id; DQ.go(page); const ok = DQ.startAct(kind, id, { quiet: true }); DQ.ui.render(true); return ok; }, [kind, id, page]);
    const live = () => p.evaluate(() => DQ.workScenes.live());
    const until = (fn, arg, ms = 8000) => p.waitForFunction(fn, arg, { timeout: ms });

    /* (1) the layers */
    assert.ok(await start('wood', 'normal', 'woodcutting'), 'woodcutting starts');
    await until(() => DQ.workScenes.live().mounted);
    const lay = await p.evaluate(() => { const sc = document.querySelector('#view .activity-scene'), c = [...sc.querySelectorAll(':scope > canvas.work-layer')];
      return { n: c.length, size: c.map(e => [e.width, e.height, e.offsetWidth, e.offsetHeight].join('x')), tint: !!sc.querySelector(':scope > .work-tint'), clicks: c.every(e => getComputedStyle(e).pointerEvents === 'none'), old: sc.querySelectorAll('.weather,.tod-tint').length }; });
    assert.equal(lay.n, 3, 'marks, life and sky layers'); assert.ok(lay.size.every(s => s === '240x100x720x300'), 'each layer is the 240 x 100 district at 3x: ' + lay.size);
    assert.ok(lay.tint && lay.clicks, 'a wash for the hour; nothing takes a click'); assert.equal(lay.old, 0, 'the old fixed region weather is gone from work scenes');

    /* (2) marks: a real yield grows the pile */
    await until(() => { const l = DQ.workScenes.live(); return l.yields >= 1 && l.strikes >= 1; }, null, 20000);
    let l = await live(); assert.equal(l.spec, 'wood'); assert.ok(l.pile >= 1 && l.marksInk > 0, 'logs pile up beside the tree after a real chop ' + JSON.stringify(l));
    const miss = await p.evaluate(() => { const a = DQ.act, before = DQ.workScenes.live().pile; DQ.emit('workcycle', { kind: a.kind, id: a.id, quantity: 0 }); return [before, DQ.workScenes.live().pile]; });
    assert.equal(miss[1], miss[0], 'a miss adds nothing to the pile');
    await p.evaluate(() => DQ.workScenes.fake(40)); l = await live();
    assert.equal(l.pile, l.cap, 'the pile stops at its cap ' + JSON.stringify(l)); assert.ok(l.cap > 0 && l.cap <= 12 && l.bits <= 40, 'chips are capped too ' + JSON.stringify(l));
    assert.ok(l.yields >= 40, 'yields still count past the cap');
    /* (3) nothing in a forecast or a simulation */
    const fc = await p.evaluate(() => { const a = JSON.stringify(DQ.workScenes.live()); const r = DQ.workRig.live;
      DQ.forecasting = true; try { DQ.emit('workcycle', { kind: DQ.act.kind, id: DQ.act.id, quantity: 3 }); DQ.workScenes.strike(r, r.spec.beats[0]); } finally { DQ.forecasting = false; }
      const b1 = DQ.workScenes.live(); DQ.simulate(20000); const b2 = DQ.workScenes.live(); const pick = o => [o.strikes, o.yields, o.pile, o.bits].join();
      return { a: pick(JSON.parse(a)), b1: pick(b1), b2: pick(b2) }; });
    assert.equal(fc.b1, fc.a, 'a forecast leaves no mark'); assert.equal(fc.b2, fc.a, 'time simulated away leaves no mark');
    /* a different activity clears the scene; the new one starts its own */
    assert.ok(await start('mine', ids.mine, 'mining'));
    await until(id => DQ.workScenes.live().key === 'mine:' + id && DQ.workScenes.live().mounted, ids.mine);
    l = await live(); assert.deepEqual([l.spec, l.yields, l.pile], ['mine', 0, 0], 'mining starts with a clean rock face ' + JSON.stringify(l));
    assert.ok(l.bits <= l.strikes * 2, 'only this rock\'s own grit ' + JSON.stringify(l));
    await p.evaluate(() => DQ.workScenes.fake(5)); l = await live(); assert.ok(l.pile === 5 && l.bits > 0, 'an ore heap and grit ' + JSON.stringify(l));
    assert.ok(await start('wood', 'normal', 'woodcutting')); await until(() => DQ.workScenes.live().key === 'wood:normal');
    l = await live(); assert.equal(l.pile, 0, 'back at the tree, the old log pile has gone');

    /* (4) weather follows the town */
    await p.evaluate(() => { DQ.townWeatherOverride = 'rain'; }); await p.waitForTimeout(1500); l = await live();
    assert.ok(l.outdoor && l.weather === 'rain' && l.drops > 10 && l.skyInk > 30, 'rain falls on the woodcutter ' + JSON.stringify(l));
    await p.evaluate(() => { DQ.townWeatherOverride = 'snow'; }); await p.waitForTimeout(1500); l = await live(); assert.ok(l.weather === 'snow' && l.drops > 10, 'snow ' + JSON.stringify(l));
    await p.evaluate(() => { DQ.townWeatherOverride = 'mist'; }); await p.waitForTimeout(1500); l = await live(); assert.ok(l.weather === 'mist' && l.skyInk > 100, 'sea mist drifts ' + JSON.stringify(l));
    await p.evaluate(() => { DQ.townWeatherOverride = undefined; DQ.S.settings.townWeather = false; }); await p.waitForTimeout(800); l = await live();
    assert.equal(l.weather, 'clear', 'Settings → Town life → Weather off turns it off in work scenes too');
    await p.evaluate(() => { DQ.S.settings.townWeather = true; DQ.townWeatherOverride = 'rain'; });
    assert.ok(await start('recipe', ids.forge, 'smithing')); await until(() => DQ.workScenes.live().spec === 'forge' && DQ.workScenes.live().mounted); await p.waitForTimeout(1200); l = await live();
    assert.ok(!l.outdoor && l.weather === 'rain' && l.drops === 0, 'the forge is indoors: the rain shows only through its windows ' + JSON.stringify(l));
    /* (5) the hour */
    await p.evaluate(() => { DQ.townTimeOverride = 23.5; }); await p.waitForTimeout(800); l = await live();
    assert.equal(l.phase, 'night'); assert.match(l.tint, /rgb\(255, 255, 255\)/, 'no night wash indoors');
    assert.ok(await start('wood', 'normal', 'woodcutting')); await until(() => DQ.workScenes.live().spec === 'wood' && DQ.workScenes.live().mounted); await p.waitForTimeout(800); l = await live();
    const [r, g, bl] = l.tint.match(/\d+/g).map(Number); assert.ok(bl > r && r < 200, 'a night wash on the woodcutter: ' + l.tint);
    await p.evaluate(() => { DQ.townTimeOverride = 13; });

    /* (6) small life moves */
    assert.ok(await start('recipe', ids.cook, 'cooking')); await until(() => DQ.workScenes.live().spec === 'cook' && DQ.workScenes.live().mounted);
    await p.waitForTimeout(2500);
    const moving = await p.evaluate(() => new Promise(res => { const c = document.querySelector('#view canvas.work-life'), snap = () => c.toDataURL(); const a = snap(); setTimeout(() => res({ ink: DQ.workScenes.live().lifeInk, changed: snap() !== a }), 700); }));
    assert.ok(moving.ink > 20 && moving.changed, 'steam, bubbles and the cat by the hearth ' + JSON.stringify(moving));

    /* (7) calm and reduced motion: nothing moves, no weather; the marks and the hour stay */
    for (const mode of ['calm', 'reduced']) {
      if (mode === 'calm') await p.evaluate(() => { DQ.S.settings.reduceFx = true; DQ.applyTheme && DQ.applyTheme(); DQ.ui.render(true); });
      else { await p.evaluate(() => { DQ.S.settings.reduceFx = false; DQ.ui.render(true); }); await p.emulateMedia({ reducedMotion: 'reduce' }); }
      assert.ok(await start('wood', 'normal', 'woodcutting')); await until(() => DQ.workScenes.live().spec === 'wood' && DQ.workScenes.live().mounted);
      await p.evaluate(() => { DQ.townWeatherOverride = 'rain'; DQ.townTimeOverride = 23.5; DQ.workScenes.fake(6); });
      /* the scene reads the hour and weather twice a second: on a busy machine wait until it shows the night, then let
         one calm redraw pass before comparing (28 Nov 2026: flaked under load) */
      await until(() => DQ.workScenes.live().phase === 'night' && DQ.workScenes.live().still); await p.waitForTimeout(1200);
      const st = await p.evaluate(() => new Promise(res => { const sc = document.querySelector('#view .activity-scene'), life = sc.querySelector('canvas.work-life'), sky = sc.querySelector('canvas.work-sky'), a = life.toDataURL() + sky.toDataURL();
        setTimeout(() => res({ live: DQ.workScenes.live(), same: life.toDataURL() + sky.toDataURL() === a }), 900); }));
      l = st.live; assert.ok(l.still && l.drops === 0 && l.lifeInk === 0, `${mode}: no creature, drop or ripple ` + JSON.stringify(l));
      assert.ok(st.same, `${mode}: nothing moves`);
      await p.evaluate(() => { DQ.townWeatherOverride = 'clear'; }); await p.waitForTimeout(1300); const clear = await live();
      assert.equal(clear.skyInk, l.skyInk, `${mode}: the rain is not drawn (only the lit lantern shows either way)`);
      assert.ok(l.pile > 0 && l.marksInk > 0, `${mode}: the log pile still grows`); assert.equal(l.phase, 'night', `${mode}: the hour still shows`); assert.notEqual(l.tint, 'rgb(255, 255, 255)');
    }
    await p.emulateMedia({ reducedMotion: 'no-preference' });
    await p.evaluate(() => { DQ.S.settings.reduceFx = false; DQ.stopAct(true); DQ.townWeatherOverride = undefined; DQ.townTimeOverride = null; DQ.seasonOverride = null; });
    assert.deepEqual(errors, []);
    console.log('PASS work scenes: layers on the backdrop, marks on strikes and real yields (capped, cleared on a new activity, none in a forecast or simulation), the town\'s weather and hour outdoors (windows only indoors, the weather setting obeyed), small life, still under calm and reduced motion');
  } finally { await b.close(); }
})().catch(e => { console.error(e); process.exit(1); });
