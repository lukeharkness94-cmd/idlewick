/* Sound polish (owner, 27 Nov 2026, "Let's do all 15"): js/audio.js rings each town's bell on the hour by the player's
   clock, hushes music and ambience while a pop-up is open, and gives equipping and moving items a sound by what they
   are made of. This checks the audio module's state, not what it sounds like:
   - bells ring once per hour on Home and Town pages, by the town's own kind; never with "Always daytime", Mute, the
     Room filter off, a hidden tab, a forecast or on another page, never twice for one hour, never late;
   - the hush glides to -9 dB with a low-pass and back, replacing or stacking pop-ups never deepens it, Mute is kept;
   - representative items map to their material, and a bulk move makes one sound, routed through the Interface filter. */
const { chromium } = require('playwright'), assert = require('node:assert/strict');
(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined, args: ['--no-sandbox', '--autoplay-policy=no-user-gesture-required'], headless: true });
  try {
    const p = await b.newPage({ viewport: { width: 1440, height: 900 } }), errors = []; p.on('pageerror', e => errors.push(e.stack));
    await p.goto(process.env.IDLEWICK_URL || 'http://127.0.0.1:8765/index.html');
    await p.locator('#t-new').click(); await p.locator('#cr-go').click();
    await p.waitForFunction(() => DQ.started && document.querySelector('#title').hidden);
    await p.evaluate(() => { DQ.paused = true; for (let i = 0; i < 12; i++) DQ.closeModal && DQ.closeModal(); const s = DQ.S.settings; s.music = true; s.sfx = true; s.ambience = true; s.muted = false;
      s.townTime = 'clock'; DQ.townWeatherOverride = 'clear'; DQ.musicMode('willowbrook'); DQ.musicStart(); });

    /* ---- the material of things: plain data, no audio needed ---- */
    const mats = await p.evaluate(() => Object.fromEntries(['bronze_sword', 'iron_body', 'rune_helm', 'leather_vest', 'drake_chaps', 'robe_apprentice_body', 'stargazer_hood', 'bow_oak', 'staff_willow', 'ash_shield',
      'arrow_bronze', 'ring_sapphire', 'amulet_ruby', 'smugglers_knot', 'gem_ruby', 'shrimp', 'raw_trout', 'egg', 'potion_heal', 'milk', 'wool', 'cowhide', 'log_oak', 'plank_oak', 'bar_iron', 'ore_copper',
      'weathered_map', 'treasure_chest', 'coin_pouch', 'tool_pick_1', 'string', 'feather', 'rune'].map(id => [id, DQ.itemMaterial(id)])));
    assert.deepEqual(mats, { bronze_sword: 'metal', iron_body: 'metal', rune_helm: 'metal', leather_vest: 'leather', drake_chaps: 'leather', robe_apprentice_body: 'cloth', stargazer_hood: 'cloth', bow_oak: 'wood', staff_willow: 'wood', ash_shield: 'wood',
      arrow_bronze: 'wood', ring_sapphire: 'gem', amulet_ruby: 'gem', smugglers_knot: 'cloth', gem_ruby: 'gem', shrimp: 'food', raw_trout: 'food', egg: 'food', potion_heal: 'potion', milk: 'potion', wool: 'cloth', cowhide: 'leather', log_oak: 'wood', plank_oak: 'wood', bar_iron: 'metal', ore_copper: 'metal',
      weathered_map: 'paper', treasure_chest: 'wood', coin_pouch: 'leather', tool_pick_1: 'metal', string: 'leather', feather: 'cloth', rune: 'gem' }, 'materials follow the item data');
    const every = await p.evaluate(() => { const ok = ['metal', 'leather', 'cloth', 'wood', 'paper', 'gem', 'food', 'potion'], bad = Object.keys(DQ.data.ITEMS).filter(id => !ok.includes(DQ.itemMaterial(id)));
      const gear = Object.entries(DQ.data.ITEMS).filter(([, it]) => it.slot).map(([id]) => DQ.itemMaterial(id)); return { bad, kinds: [...new Set(gear)].sort(), none: DQ.itemMaterial('not_an_item') }; });
    assert.deepEqual(every.bad, [], 'every item has one of the eight materials'); assert.equal(every.none, null, 'a non-item has none');
    assert.ok(['cloth', 'gem', 'leather', 'metal', 'wood'].every(k => every.kinds.includes(k)), 'gear spans metal, leather, cloth, wood and gem: ' + every.kinds);

    if ((await p.evaluate(() => DQ.audioStats().state)) !== 'running') { console.log('PASS polish sound (materials only): no running AudioContext in this browser'); return; }
    const played = () => p.evaluate(() => DQ.audioStats().played);
    const diff = async (fn, arg, wait = 120) => { const a = await played(); await p.evaluate(fn, arg); await p.waitForTimeout(wait); const z = await played(), out = {};
      for (const k of new Set([...Object.keys(a), ...Object.keys(z)])) if ((z[k] || 0) !== (a[k] || 0)) out[k] = (z[k] || 0) - (a[k] || 0); return out; };
    const only = (d, prefix) => Object.fromEntries(Object.entries(d).filter(([k]) => k.startsWith(prefix)));

    /* ---- town bells ---- */
    const cross = (from, to) => p.evaluate(([from, to]) => { DQ.townTimeOverride = from; DQ.bellTick(); DQ.townTimeOverride = to; return DQ.bellTick(); }, [from, to]);
    const plans = await p.evaluate(() => ({ w0: DQ.bellPlan('willowbrook', 0), w12: DQ.bellPlan('willowbrook', 12.5), w13: DQ.bellPlan('willowbrook', 13), w23: DQ.bellPlan('willowbrook', 23.99), salt: DQ.bellPlan('saltmere', 3), kinds: Object.keys(DQ.data.TOWN_BELLS.towns).map(t => DQ.bellPlan(t, 9).kind), towns: Object.keys(DQ.data.TOWN) }));
    assert.deepEqual([plans.w0.strokes, plans.w12.strokes, plans.w13.strokes, plans.w23.strokes], [12, 12, 1, 11], 'Willowbrook counts the hour, twelve at most');
    assert.ok(plans.salt.horn && plans.salt.strokes === 3 && plans.salt.kind === 'harbour', 'Saltmere: the foghorn, then the harbour bell');
    assert.deepEqual(plans.kinds, ['church', 'farm', 'harbour', 'gong', 'knock', 'clang', 'chimes', 'cracked'], 'every town its own bell');
    for (const t of plans.towns) assert.ok(await p.evaluate(t => !!DQ.data.TOWN_BELLS.towns[t], t), t + ' has a bell');
    await p.evaluate(() => { DQ.ui.view = null; DQ.go('overview'); });
    let d = await diff(() => { DQ.townTimeOverride = 14.99; DQ.bellTick(); DQ.townTimeOverride = 15; DQ.__bell = DQ.bellTick(); });
    assert.deepEqual(only(d, 'bell'), { 'bell:willowbrook': 1 }, 'Willowbrook rings on the hour on Home: ' + JSON.stringify(d));
    assert.equal(await p.evaluate(() => DQ.__bell.strokes), 3, 'three strokes at three o\'clock');
    assert.equal(await cross(15.5, 15.5), null, 'no bell within the hour');
    assert.equal(await cross(14.99, 15.01), null, 'never twice for the same hour');
    assert.equal(await cross(15.99, 16.2), null, 'a clock that comes back late (12 minutes past) stays quiet');
    await p.evaluate(() => DQ.go('fishing'));
    assert.equal(await cross(17.99, 18), null, 'no bells on a skill page');
    await p.evaluate(() => DQ.go('map'));
    let plan = await cross(18.99, 19); assert.ok(plan && plan.town === 'willowbrook' && plan.strokes === 7, 'the Town pages hear it: ' + JSON.stringify(plan));
    await p.evaluate(() => { DQ.S.town = 'saltmere'; DQ.go('overview'); });
    plan = await cross(19.99, 20); assert.ok(plan && plan.kind === 'harbour' && plan.horn, 'Saltmere sounds its foghorn and harbour bell');
    await p.evaluate(() => { DQ.S.town = 'ironpeak'; }); plan = await cross(20.99, 21); assert.equal(plan && plan.kind, 'gong', 'Ironpeak a deep gong');
    await p.evaluate(() => { DQ.S.town = 'willowbrook'; });
    /* the switches */
    for (const [label, off, on] of [['Always daytime', 's.townTime = "day"', 's.townTime = "clock"'], ['Mute', 'DQ.setMuted(true)', 'DQ.setMuted(false)'], ['Room filter', 's.snd.room = false', 's.snd.room = true'], ['Nature ambience', 's.ambience = false', 's.ambience = true'],
      ['a hidden tab', 'Object.defineProperty(document, "hidden", { configurable: true, get: () => true })', 'delete document.hidden'], ['a forecast', 'DQ.forecasting = true', 'DQ.forecasting = false']]) {
      const h = await p.evaluate(() => DQ.__h = (DQ.__h || 0) + 1);
      d = await diff(([off, on, h]) => { const s = DQ.S.settings; eval(off); try { DQ.townTimeOverride = h - .01; DQ.bellTick(); DQ.townTimeOverride = h % 24; DQ.__r = DQ.bellTick(); } finally { eval(on); } }, [off, on, h]);
      assert.deepEqual(only(d, 'bell'), {}, label + ': no bell'); assert.equal(await p.evaluate(() => DQ.__r), null, label + ': nothing rung');
    }
    const sim = await p.evaluate(() => { DQ.startAct('fish', 'shrimp', { quiet: true }); const a = JSON.stringify(DQ.audioStats().played); DQ.townTimeOverride = 21.99; DQ.bellTick(); DQ.simulate(3 * 3600e3, 3 * 3600e3); DQ.stopAct(true); return [a, JSON.stringify(DQ.audioStats().played)]; });
    assert.equal(sim[0], sim[1], 'an offline simulation rings nothing');
    assert.ok(await cross(22.99, 23), 'and with everything back on the next hour rings');
    const heard = await p.evaluate(() => new Promise(r => { let pk = 0; const t0 = performance.now(); const f = () => { pk = Math.max(pk, DQ.ambienceLevel().peak); if (performance.now() - t0 < 900) setTimeout(f, 20); else r(pk); }; f(); }));
    assert.ok(heard > .002 && heard < .08, 'the bell is heard on the ambience bus and stays quiet: ' + heard);
    assert.ok(!(await p.evaluate(() => DQ.bellState().log.some(x => x.error))), 'every bell played without an error');

    /* ---- pop-ups hush the world ---- */
    const hs = () => p.evaluate(() => DQ.hushState());
    await p.waitForTimeout(100); let h = await hs();
    assert.ok(!h.on && Math.abs(h.gain - 1) < .01 && h.cutoff > 15000, 'open: full level, filter wide open: ' + JSON.stringify(h));
    await p.evaluate(() => DQ.modal({ title: 'A note', body: '<p>Hello</p>' })); await p.waitForTimeout(450); h = await hs();
    const target = Math.pow(10, -9 / 20);
    assert.ok(h.on && Math.abs(h.gain - target) < .03 && h.cutoff < 2500, 'a pop-up glides music and ambience down 9 dB with a low-pass: ' + JSON.stringify(h));
    await p.evaluate(() => DQ.modal({ title: 'Another', body: '<p>Replaces the first</p>' })); await p.waitForTimeout(350); h = await hs();
    assert.ok(h.on && Math.abs(h.gain - target) < .03, 'a pop-up replacing another keeps the same hush: ' + JSON.stringify(h));
    await p.evaluate(() => { const x = document.createElement('div'); x.className = 'modal extra-test-modal'; document.body.appendChild(x); }); await p.waitForTimeout(350); h = await hs();
    assert.ok(h.on && Math.abs(h.gain - target) < .03, 'two pop-ups at once do not compound: ' + JSON.stringify(h));
    await p.evaluate(() => DQ.closeModal()); await p.waitForTimeout(350); h = await hs();
    assert.ok(h.on && Math.abs(h.gain - target) < .03, 'closing one of two keeps the hush');
    await p.evaluate(() => document.querySelector('.extra-test-modal').remove()); await p.waitForTimeout(150); h = await hs();
    assert.ok(!h.on && h.gain > target + .05 && h.gain < .98, 'the world comes back gradually: ' + JSON.stringify(h));
    await p.waitForTimeout(800); h = await hs();
    assert.ok(!h.on && Math.abs(h.gain - 1) < .02 && h.cutoff > 15000, 'and is fully back within a second: ' + JSON.stringify(h));
    /* the story conversation and a full-screen world event are pop-ups too */
    const story = await p.evaluate(() => { const m = DQ.modal({ title: 'Scene', body: '', actions: [] }); m.classList.add('story-modal'); return new Promise(r => setTimeout(() => r(DQ.hushState().on), 30)); });
    assert.ok(story, 'the conversation screen hushes'); await p.evaluate(() => DQ.closeModal()); await p.waitForTimeout(900);
    /* Mute stays muted through a pop-up */
    await p.evaluate(() => DQ.setMuted(true)); await p.waitForTimeout(300);
    await p.evaluate(() => DQ.modal({ title: 'Muted', body: '' })); await p.waitForTimeout(400); await p.evaluate(() => DQ.closeModal()); await p.waitForTimeout(900); h = await hs();
    assert.ok(h.master < .01 && !h.on, 'a pop-up never unmutes: ' + JSON.stringify(h));
    await p.evaluate(() => DQ.setMuted(false)); await p.waitForTimeout(300);

    /* ---- item sounds ---- */
    const setup = await p.evaluate(() => { const S = DQ.S, ids = ['bronze_sword', 'leather_vest', 'ring_sapphire', 'shrimp', 'log_oak', 'potion_heal', 'robe_apprentice_body']; ids.forEach(id => DQ.give(id, 2));
      DQ.go('character'); return ids.every(id => DQ.have(id) >= 2); });
    assert.ok(setup, 'fixture: two of each test item in the pack');
    await p.waitForTimeout(300);
    d = await diff(() => DQ.ui.DO.equip('leather_vest')); assert.deepEqual(only(d, 'mat_'), { mat_leather: 1 }, 'equipping a leather body creaks once: ' + JSON.stringify(d)); assert.ok(!d.equip, 'and the old equip thump does not double it');
    await p.waitForTimeout(150);
    d = await diff(() => DQ.ui.DO.equip('ring_sapphire')); assert.deepEqual(only(d, 'mat_'), { mat_gem: 1 }, 'a ring ticks like glass');
    await p.waitForTimeout(150);
    d = await diff(() => DQ.ui.DO.unequip('body')); assert.deepEqual(only(d, 'mat_'), { mat_leather: 1 }, 'unequipping sounds by what comes off');
    await p.waitForTimeout(150);
    d = await diff(() => DQ.ui.DO.deposit('potion_heal', 1)); assert.deepEqual(only(d, 'mat_'), { mat_potion: 1 }, 'a potion to the bank clinks and sloshes'); assert.ok(!d.tab, 'no extra tab blip');
    await p.waitForTimeout(150);
    d = await diff(() => DQ.ui.DO.withdraw('potion_heal', 'all')); assert.deepEqual(only(d, 'mat_'), { mat_potion: 1 }, 'and back');
    await p.waitForTimeout(150);
    const stats0 = await p.evaluate(() => DQ.itemSoundStats());
    d = await diff(() => DQ.ui.DO.depositall()); const stats1 = await p.evaluate(() => DQ.itemSoundStats());
    assert.ok(stats1.queued - stats0.queued >= 5, 'bank everything moves many items: ' + (stats1.queued - stats0.queued));
    assert.equal(Object.values(only(d, 'mat_')).reduce((a, n) => a + n, 0), 1, 'Bank everything makes one sound: ' + JSON.stringify(d));
    assert.equal(stats1.flushed - stats0.flushed, 1, 'debounced into one');
    await p.waitForTimeout(150);
    d = await diff(() => { for (const id of ['bronze_sword', 'log_oak', 'shrimp']) DQ.withdraw(id, 1); }); assert.equal(Object.values(only(d, 'mat_')).reduce((a, n) => a + n, 0), 1, 'three quick moves, one sound');
    await p.waitForTimeout(150);
    d = await diff(() => { DQ.S.settings.snd.ui = false; DQ.equipItem('bronze_sword'); }); assert.deepEqual(only(d, 'mat_'), {}, 'the Interface filter silences them'); await p.evaluate(() => { DQ.S.settings.snd.ui = true; });
    await p.waitForTimeout(150);
    d = await diff(() => { DQ.setMuted(true); DQ.unequip('weapon'); }); assert.deepEqual(only(d, 'mat_'), {}, 'Mute silences them'); await p.evaluate(() => DQ.setMuted(false));
    await p.waitForTimeout(150);
    const fc = await p.evaluate(() => { const a = DQ.itemSoundStats().queued, mon = Object.values(DQ.data.MON).find(m => m.town === DQ.S.town && !m.boss); DQ.forecasting = true; try { DQ.equipItem('bronze_sword'); DQ.unequip('weapon'); } finally { DQ.forecasting = false; } if (mon && DQ.forecast) DQ.forecast(mon.id); return DQ.itemSoundStats().queued - a; });
    assert.equal(fc, 0, 'a forecast moves gear silently');
    assert.deepEqual(errors, []);
    console.log('PASS polish sound: bells once per hour per town page (silent with Always daytime, Mute, Room off, hidden, forecasts), pop-ups hush without compounding, items sound by material and bulk moves once');
  } finally { await b.close(); }
})().catch(e => { console.error(e); process.exit(1); });
