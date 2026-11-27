/* Characters and animals with personality (owner, 27 Nov 2026; js/personality.js). In the real page:
   (1) the hero on the paper doll breathes, blinks (a drawn frame on the same <img>, same size) and, after a while with
       nothing running, stretches, yawns or checks the pouch; the companion beside them breathes and flicks an ear or tail,
       then curls up asleep with a Zzz and wakes when work starts;
   (2) in a work scene the brow wipe only ever fills the recovery of a swing (after the strike lands, js/strike_sync.js)
       and leaves the swing's own timing alone;
   (3) on the combat stage the creature winds up before its blow: the wind-up starts before its swing (scene_motion
       starts it at delay - 180 ms) and ends as the blow lands; a landed hit makes it stagger;
   (4) the companion hops on a kill, after the killing blow visibly lands;
   (5) all of it is off under Reduce effects (html.calm) and under the device's reduced-motion setting. */
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
    await p.evaluate(() => { for (let i = 0; i < 12; i++) DQ.closeModal(); const S = DQ.S; S.settings.notify = false; S.settings.storyScenes = false; S.settings.muted = true; S.tut.hidden = true; S.tut.prepareCombat = false;
      DQ.awardPet('biscuit', { hatched: true }); S.pets.active = 'biscuit'; for (let i = 0; i < 12; i++) DQ.closeModal(); DQ.go('character'); DQ.ui.render(true); });
    await p.waitForSelector('.fig-stage .fig-img'); await p.waitForSelector('.fig-pet img');

    /* the frames: drawn in code, the same 24 x 32 as the figure, each one different */
    const frames = await p.evaluate(async () => { const load = u => new Promise(r => { const i = new Image(); i.onload = () => r([i.naturalWidth, i.naturalHeight]); i.src = u; });
      const out = {}; for (const f of [null, 'blink', 'yawn', 'stretch', 'pack', 'wipe']) for (const work of [false, true]) { const u = DQ.heroFrameUrl(DQ.S.look, f, work); out[(f || 'base') + (work ? ':work' : '')] = { u, size: await load(u) }; }
      return { same: DQ.heroFrameUrl(DQ.S.look, null, false) === DQ.heroFigureUrl(DQ.S.look) && DQ.heroFrameUrl(DQ.S.look, null, true) === DQ.heroWorkFigureUrl(DQ.S.look), out }; });
    assert.ok(frames.same, 'no frame is the plain figure');
    assert.equal(new Set(Object.values(frames.out).map(f => f.u)).size, 12, 'every expression is its own drawing');
    for (const [k, f] of Object.entries(frames.out)) assert.deepEqual(f.size, [24, 32], k + ' is drawn at the figure\'s own size');

    /* (1) idle life on the paper doll */
    const idle = await p.evaluate(() => new Promise(res => { const P = DQ.personality; P.BLINK = [150, 300]; P.FLICK = [150, 300]; P.retime();
      const fig = document.querySelector('.fig-stage .fig-img'), pet = document.querySelector('.fig-pet img'), base = fig.getAttribute('src'), petBase = pet.getAttribute('src'), seen = new Set(), petSeen = new Set();
      const blink = DQ.heroFrameUrl(DQ.S.look, 'blink'), t0 = performance.now();
      const iv = setInterval(() => { seen.add(fig.getAttribute('src')); petSeen.add(pet.getAttribute('src')); if (performance.now() - t0 > 2500) { clearInterval(iv);
        res({ blinked: seen.has(blink), back: fig.getAttribute('src') === base || fig.getAttribute('src') === blink, flicks: petSeen.size, petBase: petSeen.has(petBase),
          breathe: fig.getAnimations().some(a => a.animationName === 'lw-breathe'), petBreathe: pet.getAnimations().some(a => a.animationName === 'lw-breathe'), size: [fig.naturalWidth, fig.naturalHeight] }); } }, 10); }));
    assert.ok(idle.breathe && idle.petBreathe, 'hero and companion breathe ' + JSON.stringify(idle));
    assert.ok(idle.blinked && idle.back, 'the hero blinks and opens their eyes again');
    assert.ok(idle.flicks >= 2 && idle.petBase, 'the companion flicks an ear or its tail');
    assert.deepEqual(idle.size, [24, 32]);
    for (const kind of ['stretch', 'yawn', 'pack']) {
      const fid = await p.evaluate(kind => new Promise(res => { const P = DQ.personality; P.BLINK = [9e9, 9e9]; P.IDLE_MS = 100; P.SLEEP_MS = 9e9; P.idleSince = performance.now() - 1000; P.nextFidget = 0; P.force = kind; P.tick();
        const fig = document.querySelector('.fig-stage .fig-img'), want = DQ.heroFrameUrl(DQ.S.look, kind), seen = new Set(), t0 = performance.now(); let moved = false;
        let ended = false; const iv = setInterval(() => { const cur = fig.getAttribute('src'); if (seen.has(want) && cur === DQ.heroFigureUrl(DQ.S.look)) ended = true; seen.add(cur); moved = moved || fig.getAnimations().some(a => a.id === 'lw-fidget'); if (performance.now() - t0 > 2000) { clearInterval(iv); P.IDLE_MS = 9e9; res({ shown: seen.has(want), moved, end: ended }); } }, 15); }), kind);
      assert.ok(fid.shown && fid.moved && fid.end, `idle ${kind}: drawn frame, a little movement, then back to standing ${JSON.stringify(fid)}`);
    }
    const sleep = await p.evaluate(() => new Promise(res => { const P = DQ.personality; P.SLEEP_MS = 300; P.idleSince = performance.now() - 1000; P.tick(); setTimeout(() => {
      const box = document.querySelector('.fig-pet'), asleep = box.classList.contains('lw-asleep'), zzz = box.querySelectorAll('.lw-zzz .lw-z').length; DQ.go('woodcutting'); DQ.startAct('wood', 'normal', { quiet: true }); DQ.go('character'); DQ.ui.render(false); P.SLEEP_MS = 9e9; P.tick();
      setTimeout(() => res({ asleep, zzz, awake: !document.querySelector('.lw-asleep') && !document.querySelector('.lw-zzz') }), 200); }, 300); }));
    assert.ok(sleep.asleep && sleep.zzz === 3, 'the companion curls up asleep with a Zzz ' + JSON.stringify(sleep));
    assert.ok(sleep.awake, 'and wakes when work starts');

    /* (2) the brow wipe sits in a swing's recovery; the swing keeps strike_sync's beat */
    const wipe = await p.evaluate(() => new Promise(res => { const P = DQ.personality; P.BLINK = [9e9, 9e9]; P.WIPE_EVERY = [1, 1]; P.log.length = 0; DQ.go('woodcutting'); DQ.ui.render(false);
      const t0 = performance.now(), seen = []; const want = DQ.heroFrameUrl(DQ.S.look, 'wipe', true);
      const iv = setInterval(() => { const img = document.querySelector('.scene-worker img'), a = DQ.act; if (!img || !a) return; const beat = a.dur / Math.max(1, Math.round(a.dur / 1200)), phase = ((Date.now() - a.t0) % beat) / beat;
        if (img.getAttribute('src') === want) seen.push(+phase.toFixed(3));
        if (performance.now() - t0 > 6000) { clearInterval(iv); const w = document.querySelector('.scene-worker'); res({ seen, log: P.log.slice(), dur: w.style.animationDuration, beat: Math.round(beat) + 'ms', strike: DQ.strikeLive, blink: P.BLINK, src: document.querySelector('.scene-worker img').getAttribute('src') === DQ.heroFrameUrl(DQ.S.look, null, true), calm: document.documentElement.className, hidden: document.hidden }); } }, 10); }));
    assert.ok(wipe.seen.length > 5 && wipe.log.length >= 2, 'the hero wipes their brow while working ' + JSON.stringify(wipe).slice(0, 300));
    assert.ok(wipe.log.every(w => w.phase >= .5 && w.phase < .9), 'each wipe starts after the strike has landed (.4 of the swing) ' + JSON.stringify(wipe.log));
    /* timers on a busy machine can run late; even then a wipe never reaches the swing's strike (wind-up .2 to impact .42) */
    assert.ok(wipe.seen.every(ph => ph >= .45 || ph < .15), 'never over the strike ' + JSON.stringify(wipe.seen));
    assert.equal(wipe.dur, wipe.beat, 'the swing keeps strike_sync\'s beat');
    await p.evaluate(() => { DQ.personality.WIPE_EVERY = [5, 8]; DQ.stopAct(true); });

    /* (3) the creature's wind-up comes before its blow; (4) the companion hops when the killing blow lands */
    await p.evaluate(() => { DQ.go('combat'); DQ.startAct('fight', 'goblin', { quiet: true }); DQ.ui.render(false); });
    await p.waitForSelector('.encounter-arena #av-foe .foe-rig'); await p.waitForSelector('.battle-companion img');
    await p.evaluate(() => { DQ.paused = true; }); await p.waitForTimeout(1500);
    const wind = await p.evaluate(() => new Promise(res => { const rig = document.querySelector('#av-foe .foe-rig'), t0 = performance.now(); let first = null, peak = 0, peakAt = 0, attackAt = null;
      DQ.splat('you', 3, 'hit', 900);
      const iv = setInterval(() => { const t = performance.now() - t0, w = rig.getAnimations().find(a => a.id === 'lw-windup'); if (w && first === null) first = t;
        const x = parseFloat(getComputedStyle(rig).translate) || 0; if (x > peak) { peak = x; peakAt = t; }
        if (attackAt === null && rig.getAnimations().some(a => !(a instanceof CSSAnimation) && a.id !== 'lw-windup' && a.id !== 'lw-stagger')) attackAt = t;
        if (t > 1400) { clearInterval(iv); res({ first, peak, peakAt, attackAt, impactAt: DQ.personality.lastWindup && DQ.personality.lastWindup.impactAt - t0, left: !!rig.getAnimations().find(a => a.id === 'lw-windup') }); } }, 8); }));
    assert.ok(wind.first !== null && wind.peak >= 4, 'the creature leans back before attacking ' + JSON.stringify(wind));
    assert.ok(wind.attackAt !== null && wind.first < wind.attackAt - 100, 'the wind-up starts well before its swing');
    assert.ok(wind.peakAt <= wind.attackAt + 160, 'and peaks as the swing begins');
    assert.ok(Math.abs(wind.impactAt - 1110) < 60 && !wind.left, 'and has let go by the time the blow lands (720 + 390 ms)');
    const stag = await p.evaluate(() => new Promise(res => { const rig = document.querySelector('#av-foe .foe-rig'), t0 = performance.now(); let at = null; DQ.splat('foe', 2, 'hit', 0);
      const iv = setInterval(() => { if (at === null && rig.getAnimations().some(a => a.id === 'lw-stagger')) at = performance.now() - t0; if (performance.now() - t0 > 900) { clearInterval(iv); res(at); } }, 8); }));
    assert.ok(stag !== null && stag >= 360, 'a landed hit staggers the creature when it lands, not before: ' + stag);
    await p.waitForTimeout(600);
    const hop = await p.evaluate(() => new Promise(res => { const img = document.querySelector('.battle-companion img'), t0 = performance.now(); let at = null, top = 0; DQ.emit('slain');
      const iv = setInterval(() => { if (at === null && img.getAnimations().some(a => a.id === 'lw-pet-hop')) at = performance.now() - t0; const y = parseFloat((getComputedStyle(img).translate || '0 0').split(' ')[1]) || 0; top = Math.min(top, y);
        if (performance.now() - t0 > 1300) { clearInterval(iv); res({ at, top }); } }, 8); }));
    assert.ok(hop.at !== null && hop.at >= 370, 'the companion hops once the killing blow has landed ' + JSON.stringify(hop));
    assert.ok(hop.top <= -10, 'a real hop');

    /* (5) off under Reduce effects and under reduced motion */
    for (const mode of ['calm', 'reduced']) {
      if (mode === 'calm') await p.evaluate(() => { DQ.S.settings.reduceFx = true; DQ.ui.render(false); });
      else { await p.evaluate(() => { DQ.S.settings.reduceFx = false; DQ.ui.render(false); }); await p.emulateMedia({ reducedMotion: 'reduce' }); }
      const off = await p.evaluate(() => new Promise(res => { const P = DQ.personality; P.BLINK = [100, 150]; P.FLICK = [100, 150]; P.retime();
        const lw = () => document.getAnimations().filter(a => /^lw-/.test(a.id || a.animationName || '') && a.playState === 'running').map(a => a.id || a.animationName);
        const imgs = () => [...document.querySelectorAll('#av-you .rig-torso img, .battle-companion img')].map(i => i.getAttribute('src'));
        const before = imgs(); DQ.splat('you', 3, 'hit', 900); DQ.emit('slain'); const seen = new Set();
        const iv = setInterval(() => { lw().forEach(n => seen.add(n)); if (imgs().join() !== before.join()) seen.add('frame swap'); }, 10);
        setTimeout(() => { clearInterval(iv); res({ seen: [...seen], calm: document.documentElement.classList.contains('calm') }); }, 1600); }));
      assert.deepEqual(off.seen, [], `${mode}: no idle life, wind-up, hop or frame swaps ${JSON.stringify(off)}`);
      if (mode === 'calm') assert.ok(off.calm);
      for (const page of ['character', 'woodcutting']) {
        const still = await p.evaluate(page => { if (page === 'woodcutting') DQ.startAct('wood', 'normal', { quiet: true }); DQ.go(page); DQ.ui.render(false);
          return [...document.querySelectorAll('.fig-stage .fig-img, .fig-pet img, .scene-worker img, .scene-pet img')].filter(e => e.offsetParent).map(e => getComputedStyle(e).animationName); }, page);
        assert.ok(still.every(n => n === 'none'), `${mode} ${page}: no breathing ${still}`);
      }
      await p.evaluate(() => { DQ.stopAct(true); DQ.go('combat'); DQ.startAct('fight', 'goblin', { quiet: true }); DQ.ui.render(false); DQ.paused = true; });
      await p.waitForSelector('.encounter-arena #av-foe .foe-rig');
    }
    await p.emulateMedia({ reducedMotion: 'no-preference' });
    assert.deepEqual(errors, []);
    console.log('personality: idle life, wind-up, hop, brow wipe in the recovery, all off when calm: ok');
  } finally { await b.close(); }
})().catch(e => { console.error(e); process.exit(1); });
