/* Room sound (owner, 27 Nov 2026: "cosy ... like a warm dashboard we can feel at home in"): js/audio.js lays a hearth
   under the Home pages, a market murmur that grows with the town's restoration tier, crickets and an owl at night,
   birds by day, rain and snow wind with the town weather, and soft interface sounds (a paper turn for pages and tabs,
   a quill for an accepted quest, a coin chime for a purchase). This checks the audio module's state, not what it
   sounds like: layers start and stop with the page, re-level instead of stacking, follow the tier, the clock and the
   weather; interface sounds fire once per action and obey their filter and mute; nothing plays in a forecast. */
const { chromium } = require('playwright'), assert = require('node:assert/strict');
(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined, args: ['--no-sandbox', '--autoplay-policy=no-user-gesture-required'], headless: true });
  try {
    const p = await b.newPage({ viewport: { width: 1440, height: 900 } }), errors = []; p.on('pageerror', e => errors.push(e.stack));
    await p.goto(process.env.IDLEWICK_URL || 'http://127.0.0.1:8765/index.html');
    /* before the first click there is no audio context, so nothing can play */
    assert.equal(await p.evaluate(() => DQ.audioStats().state), 'none', 'no AudioContext before a user gesture');
    await p.locator('#t-new').click(); await p.locator('#cr-go').click();
    await p.waitForFunction(() => DQ.started && document.querySelector('#title').hidden);
    await p.evaluate(() => { DQ.paused = true; for (let i = 0; i < 12; i++) DQ.closeModal && DQ.closeModal(); const s = DQ.S.settings; s.music = false; s.sfx = true; s.ambience = true; s.muted = false;
      DQ.townTimeOverride = 13; DQ.townWeatherOverride = 'clear'; DQ.musicMode('willowbrook'); DQ.musicStart(); });
    const state = () => p.evaluate(() => DQ.roomState());
    const go = v => p.evaluate(v => { DQ.ui.view = null; DQ.go(v); }, v);
    if ((await p.evaluate(() => DQ.audioStats().state)) !== 'running') { console.log('SKIP room sound: no running AudioContext in this browser'); return; }

    /* the hearth: on Home, gone elsewhere, and never twice */
    await go('overview'); let s = await state();
    assert.ok(s.on, 'room sound on'); assert.ok(s.layers.hearth && s.layers.hearth.target > 0 && !s.layers.hearth.dying, 'the hearth starts on Home: ' + JSON.stringify(s.layers));
    assert.ok(s.layers.chatter && s.layers.day && !s.layers.night, 'murmur and daytime birds by day');
    await p.waitForTimeout(1500); s = await state(); assert.ok(s.layers.hearth.gain > .005, 'the hearth fades in: ' + s.layers.hearth.gain);
    const homeChatter = s.layers.chatter.target;
    await p.evaluate(() => { for (let i = 0; i < 12; i++) { DQ.ui.render(false); DQ.ambienceRefresh(); DQ.roomRefresh(); } });
    s = await state(); assert.deepEqual(Object.keys(s.layers).sort(), ['chatter', 'day', 'hearth'], 're-renders and refreshes never stack layers');
    assert.equal(await p.evaluate(() => DQ.audioStats().roomLayers), 3);
    await go('fishing'); s = await state();
    assert.ok(s.layers.hearth.dying && s.layers.hearth.target === 0, 'leaving Home fades the hearth out');
    assert.ok(s.layers.chatter.target > homeChatter, 'outside, the murmur is no longer behind a wall');
    await go('overview'); s = await state(); assert.ok(!s.layers.hearth.dying && s.layers.hearth.target > 0, 'coming back revives the same hearth, not a second one');
    await go('fishing'); await p.waitForTimeout(6000); s = await state(); assert.ok(!s.layers.hearth, 'the hearth stops once faded: ' + JSON.stringify(s.layers));

    /* the murmur follows the restoration tier: ruined quiet, restored lively */
    const tiers = await p.evaluate(() => { const S = DQ.S, D = DQ.data, ids = Object.keys(D.PROJECTS).filter(k => D.PROJECTS[k].town === 'willowbrook'), out = {};
      const set = n => { S.projects = {}; S.damaged = {}; ids.slice(0, n).forEach(k => S.projects[k] = true); DQ.roomRefresh(); const L = DQ.roomState().layers.chatter; return { tier: DQ.restorationTier('willowbrook'), target: L.target, layerTier: L.tier }; };
      out.ruined = set(0); out.mending = set(Math.ceil(ids.length / 2)); out.restored = set(ids.length); return out; });
    assert.deepEqual([tiers.ruined.tier, tiers.mending.tier, tiers.restored.tier], ['ruined', 'mending', 'restored'], JSON.stringify(tiers));
    assert.ok(tiers.ruined.target < tiers.mending.target && tiers.mending.target < tiers.restored.target, 'chatter rises with the tier: ' + JSON.stringify(tiers));
    assert.equal(tiers.restored.layerTier, 'restored', 'voices carry more often in a restored town');
    const plan = await p.evaluate(() => ['ruined', 'mending', 'restored'].map(t => DQ.roomPlan({ town: 'saltmere', tier: t, page: 'map' }).chatter));
    assert.ok(plan[0] < plan[1] && plan[1] < plan[2], 'the plan agrees in every town');

    /* night: crickets and the owl replace the birds; rain and snow follow the weather; changes crossfade */
    await p.evaluate(() => { DQ.townTimeOverride = 23; DQ.roomRefresh(); }); s = await state();
    assert.ok(s.inputs.dark > .6 && s.layers.night && s.layers.night.target > 0, 'night layer on at night: ' + JSON.stringify(s));
    assert.ok(s.layers.day.dying, 'the birds fade out at night');
    await p.evaluate(() => { DQ.townTimeOverride = 19.2; DQ.roomRefresh(); }); s = await state();
    assert.ok(s.inputs.dark > .35 && s.inputs.dark <= .6 && s.layers.night.dying && (!s.layers.day || s.layers.day.dying), 'dusk is hushed');
    await p.evaluate(() => { DQ.townTimeOverride = 23; DQ.townWeatherOverride = 'rain'; DQ.roomRefresh(); }); s = await state();
    assert.ok(s.layers.rain && s.layers.rain.target > 0 && !s.layers.night.dying, 'rain patter with rain, the crickets kept');
    await p.evaluate(() => { DQ.townWeatherOverride = 'snow'; DQ.roomRefresh(); }); s = await state();
    assert.ok(s.layers.snow && s.layers.snow.target > 0 && s.layers.rain.dying, 'snow brings soft wind and the rain fades');
    await p.evaluate(() => { DQ.townWeatherOverride = 'clear'; DQ.townTimeOverride = 13; DQ.roomRefresh(); });

    /* the Room filter, the ambience switch and mute all stop the layers */
    for (const [label, on, off] of [['Room filter', 's.snd.room=true', 's.snd.room=false'], ['Nature ambience', 's.ambience=true', 's.ambience=false'], ['Mute', 'DQ.setMuted(false)', 'DQ.setMuted(true)']]) {
      s = await p.evaluate(off => { const s = DQ.S.settings; s.snd = s.snd || {}; eval(off); DQ.roomRefresh(); return DQ.roomState(); }, off);
      assert.ok(!s.on && Object.values(s.layers).every(L => L.dying), label + ' fades every room layer');
      await p.evaluate(on => { const s = DQ.S.settings; eval(on); DQ.roomRefresh(); }, on);
      assert.ok((await state()).layers.chatter.target > 0, label + ' back on');
    }

    /* interface sounds: once per action, debounced, filtered, muted */
    const played = () => p.evaluate(() => DQ.audioStats().played);
    const diff = async (fn, arg) => { const a = await played(); await p.evaluate(fn, arg); await p.waitForTimeout(60); const z = await played(); const out = {}; for (const k of new Set([...Object.keys(a), ...Object.keys(z)])) if ((z[k] || 0) !== (a[k] || 0)) out[k] = (z[k] || 0) - (a[k] || 0); return out; };
    await p.waitForTimeout(400);
    let d = await diff(() => DQ.go('quests')); assert.deepEqual(d, { page: 1 }, 'a page turn rustles once');
    await p.waitForTimeout(400);
    const before = await played();
    const nav = p.locator('#topnav [data-do="hub"][data-a="town"]').first(); await nav.click(); await p.waitForTimeout(60); let after = await played();
    assert.equal((after.page || 0) - (before.page || 0), 1, 'a real click on the menu rustles once');
    await p.waitForTimeout(400);
    d = await diff(() => { for (let i = 0; i < 6; i++) DQ.sfx('page'); }); assert.deepEqual(d, { page: 1 }, 'six turns at once rustle once');
    await p.waitForTimeout(400);
    d = await diff(() => { ['overview', 'quests', 'map', 'character', 'overview'].forEach(v => DQ.go(v)); }); assert.ok(d.page >= 1 && d.page <= 2, 'five rapid page changes never machine-gun: ' + JSON.stringify(d));
    await p.waitForTimeout(400);
    d = await diff(() => { DQ.ui.DO.tab('characterPanel', 'equipment'); }); assert.deepEqual(d, { page: 1 }, 'a tab inside a page turns a page too');
    await p.waitForTimeout(400);
    d = await diff(() => { DQ.ui.DO.tab('characterPanel', 'equipment'); }); assert.deepEqual(d, {}, 'the tab you are on is silent');
    const qid = await p.evaluate(() => (DQ.data.QUESTS.find(q => DQ.questState(q) === 'new') || {}).id); assert.ok(qid, 'a quest to accept');
    d = await diff(id => DQ.ui.DO.qstart(id), qid); assert.equal(d.quill, 1, 'accepting a quest scratches the quill once: ' + JSON.stringify(d)); assert.ok(!d.start, 'and the old start blip does not double it');
    await p.evaluate(() => { DQ.S.coins = 5000; DQ.go('shop'); }); await p.waitForTimeout(400);
    const item = await p.evaluate(() => Object.keys(DQ.data.ITEMS).find(k => DQ.data.ITEMS[k].type !== 'tool' && DQ.buyPrice && DQ.buyPrice(k) > 0 && DQ.buyPrice(k) < 200 && !DQ.lockedSkillFor(k)));
    d = await diff(id => DQ.ui.DO.buy(id, 1), item); await p.waitForTimeout(200);
    const coinsAfter = await played(); assert.equal(d.buy, 1, 'one coin chime for a purchase: ' + JSON.stringify(d));
    await p.waitForTimeout(400); assert.equal((await played()).buy, coinsAfter.buy, 'the purchase announcement from the shop animation does not chime again');
    await p.waitForTimeout(400);
    d = await diff(() => { DQ.S.settings.snd.ui = false; DQ.go('quests'); DQ.ui.DO.tab('questsX', 'y'); DQ.sfx('buy'); DQ.sfx('quill'); }); assert.deepEqual(d, {}, 'the Interface filter silences them');
    await p.evaluate(() => { DQ.S.settings.snd.ui = true; }); await p.waitForTimeout(500);
    d = await diff(() => { DQ.setMuted(true); DQ.go('map'); DQ.sfx('buy'); DQ.sfx('quill'); }); assert.deepEqual(d, {}, 'mute silences them');
    await p.evaluate(() => DQ.setMuted(false)); await p.waitForTimeout(500);

    /* a forecast plays nothing and starts no layer */
    const fc = await p.evaluate(() => { const st = DQ.roomState(); DQ.forecasting = true; const a = JSON.stringify(DQ.audioStats().played); DQ.ui.view = null;
      try { DQ.go('overview'); DQ.sfx('buy'); DQ.sfx('quill'); DQ.sfx('level'); DQ.roomRefresh(); } finally { DQ.forecasting = false; }
      const mon = Object.values(DQ.data.MON).find(m => m.town === DQ.S.town && !m.boss); const b = JSON.stringify(DQ.audioStats().played); if (mon) DQ.forecast(mon.id);
      return { a, b, c: JSON.stringify(DQ.audioStats().played), hearthBefore: !!(st.layers.hearth && !st.layers.hearth.dying), hearthAfter: !!(DQ.roomState().layers.hearth && !DQ.roomState().layers.hearth.dying) }; });
    assert.equal(fc.a, fc.b, 'nothing plays while forecasting'); assert.equal(fc.b, fc.c, 'a real forecast plays nothing'); assert.equal(fc.hearthAfter, fc.hearthBefore, 'a forecast starts no room layer');
    const sim = await p.evaluate(() => { const fish = DQ.startAct('fish', 'shrimp', { quiet: true }); const a = JSON.stringify(DQ.audioStats().played); DQ.simulate(10 * 60000, 10 * 60000); const z = JSON.stringify(DQ.audioStats().played); DQ.stopAct(true); return [a, z, !!fish]; });
    assert.ok(sim[2], 'a task to simulate'); assert.equal(sim[0], sim[1], 'an offline simulation plays nothing');
    assert.deepEqual(errors, []);
    console.log('PASS room sound: hearth on Home only, murmur by tier, night/day/rain/snow layers crossfade without stacking, interface sounds once and filtered, silent in forecasts');
  } finally { await b.close(); }
})().catch(e => { console.error(e); process.exit(1); });
