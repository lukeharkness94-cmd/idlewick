/* Living towns (owner, 27 Nov 2026: "moving town scenes, animated animals and characters ... cosy"), js/town_life.js:
   1 the town scene records its lit windows and chimneys (A.sceneMeta) and Home gets the life layers over its picture
   2 the light follows the hour: no tint by day, a dark blue one at night, a warm sky at dusk; windows glow only after dark
   3 animals move and smoke rises in normal play; weather falls when the town's weather says so
   4 under Reduce effects nothing moves, but the hour's light still shows
   5 Settings → Display has Town life (follow my clock / always daytime, weather) and they apply
   6 the layers never take a click: the Village's signs stay on top and clickable */
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
    await p.evaluate(() => { for (let i = 0; i < 12; i++) DQ.closeModal(); const S = DQ.S; S.settings.notify = false; DQ.paused = true; for (const t of ['willowbrook', 'mossbarrow']) S.towns[t] = Object.assign(S.towns[t] || {}, { visited: true, boss: true });
      DQ.townTimeOverride = 13; DQ.townWeatherOverride = 'clear'; DQ.go('overview'); DQ.ui.render(true); });
    await p.waitForFunction(() => DQ.townLifeLive().length > 0, null, { timeout: 8000 });
    /* 1 */
    const meta = await p.evaluate(() => { const m = DQ.pixelArt.sceneMeta.willowbrook; return { windows: m.windows.length, chimneys: m.chimneys.length, layers: document.querySelectorAll('.home-scene canvas.town-life').length, tint: !!document.querySelector('.home-scene .town-tint') }; });
    assert.ok(meta.windows > 10 && meta.chimneys > 5, 'the scene records its windows and chimneys: ' + JSON.stringify(meta));
    assert.equal(meta.layers, 2); assert.ok(meta.tint);
    /* 2 */
    const at = async h => { await p.evaluate(h => { DQ.townTimeOverride = h; }, h); await p.waitForTimeout(250); return p.evaluate(() => { const t = document.querySelector('.home-scene .town-tint'), cv = document.querySelector('.home-scene canvas.town-life-over'), m = DQ.pixelArt.sceneMeta.willowbrook, [wx, wy] = m.windows[0];
      const lit = cv.getContext('2d').getImageData(wx, wy, 1, 1).data[3]; return { phase: t.dataset.phase, tint: t.style.backgroundColor, glow: document.querySelector('.home-scene .town-glow').style.background, lit }; }); };
    const day = await at(13), night = await at(23.5), dusk = await at(19);
    assert.equal(day.phase, 'day'); assert.match(day.tint, /rgb\(255, 255, 255\)/, 'no tint by day'); assert.equal(day.lit, 0, 'windows are not lit by day');
    assert.equal(night.phase, 'night'); const [r, g, bl] = night.tint.match(/\d+/g).map(Number); assert.ok(bl > r && r < 175, 'a blue tint at night (gentler since the towns are painted at dusk): ' + night.tint); assert.ok(night.lit > 150, 'windows glow at night: ' + night.lit);
    assert.equal(dusk.phase, 'dusk'); assert.match(dusk.glow, /gradient/, 'a warm sky at dusk');
    /* 3 */
    await p.evaluate(() => { DQ.townTimeOverride = 13; DQ.townWeatherOverride = 'rain'; });
    const a0 = await p.evaluate(() => DQ.townLifeLive()[0].animals.map(a => a.x).join(','));
    await p.waitForTimeout(6000);
    const live = await p.evaluate(() => DQ.townLifeLive()[0]);
    assert.ok(live.animals.length >= 3, 'animals in Willowbrook: ' + live.animals.length);
    assert.notEqual(live.animals.map(a => a.x).join(','), a0, 'animals move');
    assert.ok(live.drops > 20 && live.weather === 'rain', 'rain falls: ' + live.drops);
    /* 4 */
    await p.evaluate(() => { DQ.S.settings.reduceFx = true; DQ.townTimeOverride = 23; DQ.ui.render(true); });
    await p.waitForTimeout(400); const c0 = await p.evaluate(() => DQ.townLifeLive()[0].animals.map(a => a.x).join(','));
    await p.waitForTimeout(2500); const c1 = await p.evaluate(() => ({ x: DQ.townLifeLive()[0].animals.map(a => a.x).join(','), phase: DQ.townLifeLive()[0].phase }));
    assert.equal(c1.x, c0, 'nothing moves under Reduce effects'); assert.equal(c1.phase, 'night', 'the hour still shows');
    await p.evaluate(() => { DQ.S.settings.reduceFx = false; DQ.ui.render(true); DQ.townTimeOverride = null; DQ.townWeatherOverride = undefined; });
    /* 5 */
    const set = await p.evaluate(() => { DQ.ui.tab.settingsPanel = 'display'; DQ.go('settings'); DQ.ui.render(true); const has = !!document.querySelector('[data-do="townclock"][data-a="day"]');
      DQ.ui.DO.townclock('day'); const hour = DQ.townHour(); DQ.ui.DO.townweather(); const wet = DQ.townWeather('ironpeak'); DQ.ui.DO.townweather(); DQ.ui.DO.townclock('clock'); return { has, hour, wet, saved: DQ.S.settings.townTime }; });
    assert.ok(set.has, 'Town life controls in Settings → Display'); assert.equal(set.hour, 13, 'always daytime'); assert.equal(set.wet, 'clear', 'weather off'); assert.equal(set.saved, 'clock');
    /* 6 */
    const click = await p.evaluate(() => { DQ.go('projects'); DQ.ui.render(true); return new Promise(r => setTimeout(() => { const s = document.querySelector('.village-scene .site-spot'); if (!s) return r('no site'); const R = s.getBoundingClientRect(), hit = document.elementFromPoint(R.left + R.width / 2, R.top + R.height / 2); r(!!document.querySelector('.village-scene canvas.town-life') && (hit === s || s.contains(hit))); }, 800)); });
    assert.equal(click, true, 'the Village signs stay clickable above the life layers');
    assert.deepEqual(errors, []);
    console.log('PASS town life: scene meta, day/dusk/night light and lit windows, animals and rain, still under Reduce effects, Settings, signs clickable');
  } finally { await b.close(); }
})().catch(e => { console.error(e); process.exit(1); });
