/* The farm's work scene (owner, 28 Nov 2026; js/farm_scene.js, js/work_rig.js SPEC.hoe, js/strike_sync.js DQ.farmWork).
   In the real page:
   (1) with nothing growing the Farming page shows the farm and its crops but no hero, and no rig runs;
   (2) while something grows the hero hoes: the strike clock runs the hoe, the crops shown are the first plots' own
       crops standing on the scene's ground line, and the hoe's sound plays on the frame the blade bites;
   (3) a running activity elsewhere keeps its own scene on its own page, and the farm takes over only on Farming;
   (4) the town's weather and light reach the farm (an outdoor workplace), and under Reduce effects the frame holds;
   (5) on phones the scene is not shown (the phone farm page is fitted to the screen) and nothing errors. */
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
      for (const s of D.SKILLS) { S.unlocked[s.id] = true; S.xp[s.id] = D.XPF[40]; } for (const c of D.CROPS) DQ.give('seed_' + c.id, 5); for (let i = 0; i < 12; i++) DQ.closeModal();
      DQ.townTimeOverride = 13; DQ.townWeatherOverride = 'clear'; DQ.go('farming'); DQ.ui.render(true); });
    await p.waitForTimeout(600);

    /* (1) nothing growing */
    let st = await p.evaluate(() => ({ scene: !!document.querySelector('#view .farm-work .activity-scene.farm'), worker: !!document.querySelector('#view .farm-work .scene-worker'), live: !!DQ.workRig.live, crops: document.querySelectorAll('#view .farm-crop').length }));
    assert.deepEqual(st, { scene: true, worker: false, live: false, crops: 0 }, 'an empty farm: the scene, no hero, no rig ' + JSON.stringify(st));

    /* (2) two crops growing */
    await p.evaluate(() => { const D = DQ.data; DQ.plant(0, D.CROPS[0].id, { quiet: true }); DQ.plant(1, D.CROPS[1].id, { quiet: true }); DQ.ui.render(true); });
    await p.waitForFunction(() => DQ.workRig.live && DQ.workRig.live.spec.id === 'hoe', null, { timeout: 4000 });
    st = await p.evaluate(() => { const sc = document.querySelector('#view .farm-work .activity-scene'), r = sc.getBoundingClientRect(), k = r.height / sc.offsetHeight;
      const crops = [...sc.querySelectorAll('.farm-crop')].map(e => ({ st: e.dataset.st, gap: Math.round((r.bottom - e.getBoundingClientRect().bottom) / k) }));
      const w = sc.querySelector('.scene-worker'), feet = Math.round((r.bottom - w.getBoundingClientRect().bottom) / k);
      return { crops, feet, plots: DQ.S.farm.plots.slice(0, 2).map(p => p.crop) }; });
    assert.equal(st.crops.length, 2, 'the two planted crops stand in the furrow ' + JSON.stringify(st));
    assert.deepEqual(st.crops.map(c => c.st.split(':')[0]), st.plots, 'the scene shows the plots\' own crops ' + JSON.stringify(st));
    /* the ground line is 4 district px at 3x above the scene's floor (12 px; the panel's own edge can add one) */
    assert.ok(Math.abs(st.feet - 12) <= 1, 'the hero\'s feet are on the ground line ' + JSON.stringify(st));
    for (const c of st.crops) assert.equal(c.gap, st.feet, 'each crop stands on the hero\'s ground line ' + JSON.stringify(st));
    const log = await p.evaluate(() => new Promise(res => { const out = [], s0 = DQ.sfxStrike;
      DQ.sfxStrike = name => { const w = document.querySelector('#view .farm-work .scene-worker'), r = DQ.workRig.live; out.push({ name, frame: w ? +w.dataset.frame : null, want: r && r.lastStrike ? r.lastStrike.want : null }); };
      setTimeout(() => { DQ.sfxStrike = s0; res(out); }, 3600); }));
    assert.ok(log.length >= 2 && log.every(e => e.name === 'hoe'), 'the hoe sounds on each stroke ' + JSON.stringify(log));
    assert.ok(log.every(e => e.frame === e.want), 'each hoe sound plays on the frame the blade bites ' + JSON.stringify(log));
    const ws = await p.evaluate(() => DQ.workScenes.live());
    assert.equal(ws.spec, 'hoe'); assert.ok(ws.strikes >= 2 && ws.marksInk > 0, 'the strokes leave clods in the furrow ' + JSON.stringify(ws));

    /* (3) a running activity keeps its own scene on its own page */
    await p.evaluate(() => { DQ.ui.taskChoice.woodcutting = 'normal'; DQ.go('woodcutting'); DQ.startAct('wood', 'normal', { quiet: true }); DQ.ui.render(true); });
    await p.waitForFunction(() => DQ.workRig.live && DQ.workRig.live.spec.id === 'wood', null, { timeout: 4000 });
    await p.evaluate(() => { DQ.go('farming'); DQ.ui.render(true); });
    await p.waitForFunction(() => DQ.workRig.live && DQ.workRig.live.spec.id === 'hoe', null, { timeout: 4000 });
    assert.ok(await p.evaluate(() => DQ.act && DQ.act.kind === 'wood'), 'hoeing on the farm page leaves the running activity alone');
    await p.evaluate(() => DQ.stopAct(true));

    /* (4) weather and light; Reduce effects holds the frame */
    await p.evaluate(() => { DQ.townWeatherOverride = 'rain'; DQ.townTimeOverride = 22.5; });
    await p.waitForFunction(() => { const l = DQ.workScenes.live(); return l.weather === 'rain' && l.outdoor && l.phase === 'night'; }, null, { timeout: 4000 });
    await p.evaluate(() => { DQ.S.settings.reduceFx = true; document.documentElement.classList.add('calm'); });
    await p.waitForTimeout(400);
    const frames = await p.evaluate(() => new Promise(res => { const w = () => document.querySelector('#view .farm-work .scene-worker'), seen = new Set([w().dataset.frame]); let n = 0;
      const t = setInterval(() => { seen.add(w().dataset.frame); if (++n >= 12) { clearInterval(t); res([...seen]); } }, 100); }));
    assert.equal(frames.length, 1, 'under Reduce effects the hoe holds one pose ' + JSON.stringify(frames));
    assert.equal(await p.evaluate(() => DQ.workScenes.live().drops), 0, 'and no rain falls');
    await p.evaluate(() => { DQ.S.settings.reduceFx = false; document.documentElement.classList.remove('calm'); });

    /* (5) phones */
    await p.setViewportSize({ width: 390, height: 844 }); await p.evaluate(() => DQ.ui.render(true)); await p.waitForTimeout(500);
    assert.equal(await p.evaluate(() => { const e = document.querySelector('#view .farm-work'); return e ? getComputedStyle(e).display : 'none'; }), 'none', 'no farm scene on phones');
    assert.deepEqual(errors, []);
    console.log('PASS farm scene: no hero on an empty farm, the hero hoes between the real crops on one ground line with the sound on its frame, a running activity keeps its own scene, weather and night reach the farm, Reduce effects holds the pose, hidden on phones');
  } finally { await b.close(); }
})().catch(e => { console.error(e); process.exit(1); });
