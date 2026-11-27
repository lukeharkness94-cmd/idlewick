/* node tests/motion-clock.cjs: the one animation clock and page turns (27 Nov 2026, owner: "smoother and higher FPS
   animations, more logical flow"; docs/motion-performance.md).
   (1) one requestAnimationFrame loop drives the scene layers: on Home with an activity running, the progress bars,
       strike beat, town life and walkers are all subscribers of DQ.frame and a frame runs one rAF callback
   (2) nothing runs while the tab is hidden, and coming back does not catch up (the first dt is 0)
   (3) the pixel snapper measures only what changed, never the whole page on each change, and still snaps a new sprite
       and one revealed from a hidden panel to a whole-number scale
   (4) page turns are off in automated browsers, on with localStorage['idlewick.transitions'] = '1' (a short
       transition of the main view only; the top bar and rail do not move), and off again under Reduce effects
       (html.calm) and the device's reduced-motion setting
   Needs the preview server (IDLEWICK_URL). */
const assert = require('node:assert/strict');
const { chromium } = require('playwright');
const URL = process.env.IDLEWICK_URL || 'http://127.0.0.1:8765/';
const COUNT = () => { /* count rAF callbacks per frame: callbacks in one frame share its timestamp */
  const raf0 = window.requestAnimationFrame.bind(window), M = window.__raf = { on: false, frames: new Map() };
  window.requestAnimationFrame = cb => raf0(t => { if (M.on) M.frames.set(t, (M.frames.get(t) || 0) + 1); return cb(t); });
};
const start = async (b, opts = {}) => {
  const p = await b.newPage({ viewport: { width: 1440, height: 900 }, ...opts }); const errors = [];
  p.on('pageerror', e => errors.push(e.message)); await p.addInitScript(COUNT);
  await p.goto(URL); await p.locator('#t-new').click(); await p.locator('#cr-go').click();
  await p.waitForFunction(() => DQ.started && document.querySelector('#title').hidden);
  await p.evaluate(() => { for (let i = 0; i < 12; i++) DQ.closeModal(); DQ.S.settings.notify = false; });
  return { p, errors };
};
const frames = p => p.evaluate(n => new Promise(r => { let k = 0; const f = () => (++k < n ? requestAnimationFrame(f) : r()); requestAnimationFrame(f); }), 3);
(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });
  try {
    /* (1) one loop */
    const { p, errors } = await start(b);
    await p.evaluate(() => { DQ.go('overview'); DQ.ui.render(true); DQ.startAct('wood', 'normal', { quiet: true }); for (let i = 0; i < 12; i++) DQ.closeModal(); });
    await p.waitForFunction(() => DQ.townWalkersLive().length > 0 && DQ.townLifeLive().length > 0, null, { timeout: 8000 });
    const one = await p.evaluate(() => new Promise(res => { const M = window.__raf, s0 = DQ.frame.stats(); M.frames.clear(); M.on = true;
      setTimeout(() => { M.on = false; const c = [...M.frames.values()].sort((a, b) => a - b), s1 = DQ.frame.stats();
        res({ frames: c.length, median: c[Math.floor(c.length / 2)], ones: c.filter(x => x === 1).length, subs: s1.subscribers, ran: s1.frames - s0.frames, calls: s1.calls - s0.calls, running: s1.running }); }, 1500); }));
    assert.ok(one.frames >= 5, 'frames ran: ' + JSON.stringify(one));
    assert.equal(one.median, 1, 'one rAF callback per frame: ' + JSON.stringify(one));
    assert.ok(one.ones >= one.frames * .8, 'nearly every frame is just the clock: ' + JSON.stringify(one));
    assert.ok(one.subs >= 4, 'progress bars, strike beat, town life and walkers share the clock: ' + JSON.stringify(one));
    assert.ok(one.calls >= one.ran * 4, 'every subscriber runs each frame: ' + JSON.stringify(one));
    const a = await p.evaluate(() => DQ.townWalkersLive()[0].walkers); await p.waitForTimeout(1500); const c = await p.evaluate(() => DQ.townWalkersLive()[0].walkers);
    assert.ok(c.some((w, i) => w.x !== a[i].x), 'the walkers still walk on the shared clock');

    /* (2) hidden: nothing runs; back: no catch-up */
    const hid = await p.evaluate(() => new Promise(res => {
      const dts = []; let probe = true; DQ.frame.add(dt => { if (probe) dts.push(dt); return probe; });
      const vis = v => { Object.defineProperty(document, 'hidden', { value: v, configurable: true }); Object.defineProperty(document, 'visibilityState', { value: v ? 'hidden' : 'visible', configurable: true }); document.dispatchEvent(new Event('visibilitychange')); };
      setTimeout(() => { vis(true); const s0 = DQ.frame.stats(), w0 = JSON.stringify(DQ.townWalkersLive()), n0 = dts.length;
        setTimeout(() => { const s1 = DQ.frame.stats(), w1 = JSON.stringify(DQ.townWalkersLive()), n1 = dts.length; vis(false);
          const t0 = performance.now(), wait = () => { if (dts.length < n1 + 4 && performance.now() - t0 < 5000) return setTimeout(wait, 50);
            probe = false; delete document.hidden; delete document.visibilityState; res({ hiddenFrames: s1.frames - s0.frames, running: s1.running, walkersMoved: w0 !== w1, probeCalls: n1 - n0, firstBack: dts[n1], after: dts.slice(n1 + 1, n1 + 4), runningAgain: DQ.frame.stats().running }); }; wait(); }, 900); }, 200); }));
    assert.equal(hid.hiddenFrames, 0, 'no frames while hidden: ' + JSON.stringify(hid)); assert.equal(hid.running, false);
    assert.equal(hid.probeCalls, 0); assert.equal(hid.walkersMoved, false, 'the town stands still while hidden');
    assert.equal(hid.firstBack, 0, 'the first frame back has dt 0 (no catch-up): ' + JSON.stringify(hid));
    assert.ok(hid.after.length && hid.after.every(d => d > 0 && d <= .1), 'then real frame times, capped: ' + JSON.stringify(hid)); assert.ok(hid.runningAgain);

    /* (3) the snapper works on what changed */
    const snap = await p.evaluate(() => new Promise(res => {
      const total = document.querySelectorAll('img.pxa, i.ic.pxi').length, s0 = DQ.snapStats();
      setTimeout(() => { const s1 = DQ.snapStats(), quiet = s1.measured - s0.measured, src = ([...document.querySelectorAll('img.pxa')].find(i => i.naturalWidth && i.naturalWidth <= 32) || {}).src; if (!src) return res({ total, flushes: 0, measured: 0, none: true });
        const box = document.createElement('div'); box.style.cssText = 'position:fixed;left:0;top:0;width:200px'; box.innerHTML = `<img class="pxa" id="mc-new" src="${src}" style="width:61px">`;
        const hiddenBox = document.createElement('div'); hiddenBox.id = 'mc-hidden'; hiddenBox.style.display = 'none'; hiddenBox.innerHTML = `<img class="pxa" id="mc-later" src="${src}" style="width:61px">`;
        document.body.append(box, hiddenBox);
        setTimeout(() => { hiddenBox.style.display = 'block'; hiddenBox.className = 'shown';
          setTimeout(() => { const nw = document.getElementById('mc-new'), lt = document.getElementById('mc-later'), k = el => el.offsetWidth / ((DQ.pixelArt.logicalOf && DQ.pixelArt.logicalOf(el.src) || [el.naturalWidth])[0]);
            const s2 = DQ.snapStats(); res({ total, quiet, flushes: s2.flushes - s1.flushes, measured: s2.measured - s1.measured, kNew: k(nw), kLater: k(lt), snappedNew: nw.dataset.snapped, snappedLater: lt.dataset.snapped }); box.remove(); hiddenBox.remove(); }, 400); }, 300); }, 2000); }));
    assert.ok(snap.total > 30, 'a page full of sprites: ' + snap.total);
    assert.ok(snap.flushes > 0, 'the snapper ran while the page changed: ' + JSON.stringify(snap));
    assert.ok(snap.measured < snap.total / 2, 'two new sprites are measured, not the whole page: ' + JSON.stringify(snap));
    assert.ok(snap.quiet < snap.total, 'two seconds of a running task do not rescan the page: ' + JSON.stringify(snap));
    for (const k of [snap.kNew, snap.kLater]) assert.ok(Math.abs(k - Math.round(k)) < .02, 'whole-number scale: ' + JSON.stringify(snap));
    assert.equal(snap.snappedNew, '1'); assert.equal(snap.snappedLater, '1', 'a sprite revealed from a hidden panel is snapped too');

    /* (4) page turns: off for automated browsers by default */
    assert.equal(await p.evaluate(() => DQ.ui.pageTurnsOn()), false, 'off under webdriver');
    await p.evaluate(() => { DQ.stopAct && DQ.stopAct(); for (let i = 0; i < 12; i++) DQ.closeModal(); });
    await p.locator('#topnav .tnav[data-a="quests"]').click();
    assert.deepEqual(await p.evaluate(() => [DQ.ui.hubOf(DQ.ui.view).id, document.documentElement.classList.contains('page-turning')]), ['quests', false], 'navigation is immediate with no transition');
    assert.deepEqual(errors, []); await p.close();

    /* ...on with the flag: only the main view turns, quickly, and nothing else moves */
    const t = await start(b); await t.p.evaluate(() => { localStorage.setItem('idlewick.transitions', '1'); DQ.go('overview'); DQ.ui.render(true); });
    assert.equal(await t.p.evaluate(() => DQ.ui.pageTurnsOn()), !!(await t.p.evaluate(() => typeof document.startViewTransition === 'function')));
    const turn = await t.p.evaluate(() => new Promise(res => {
      const rect = s => { const r = document.querySelector(s).getBoundingClientRect(); return [r.x, r.y, r.width, r.height].map(Math.round).join(); };
      for (let i = 0; i < 12; i++) DQ.closeModal(); const before = { top: rect('#topnav'), rail: rect('#rail'), view: rect('#view') }, btn = document.querySelector('#topnav .tnav[data-a="quests"]');
      btn.click(); const sync = DQ.ui.view; const seen = { names: new Set(), dur: 0, top: new Set(), rail: new Set(), turning: false }; const t0 = performance.now();
      const look = () => { for (const a of document.getAnimations()) { const pe = a.effect && a.effect.pseudoElement; if (pe && /idw-page/.test(pe)) { seen.names.add(pe); seen.dur = Math.max(seen.dur, a.effect.getComputedTiming().duration); } }
        seen.top.add(rect('#topnav')); seen.rail.add(rect('#rail')); if (document.documentElement.classList.contains('page-turning')) seen.turning = true;
        const busy = document.documentElement.classList.contains('page-turning'); if ((performance.now() - t0 < 700 || busy) && performance.now() - t0 < 6000) requestAnimationFrame(look); else res({ sync, view: DQ.ui.view, names: [...seen.names], dur: seen.dur, turning: seen.turning, left: document.documentElement.classList.contains('page-turning'), top: [...seen.top], rail: [...seen.rail], before, after: { view: rect('#view') } }); };
      requestAnimationFrame(look); }));
    assert.notEqual(turn.view, 'overview', 'the page changed');
    assert.equal(turn.sync, 'overview', 'the click is replayed inside the transition, one frame later');
    assert.ok(turn.turning, 'html.page-turning while it runs'); assert.equal(turn.left, false, 'and cleared afterwards');
    assert.ok(turn.names.some(n => /old\(idw-page\)/.test(n)) && turn.names.some(n => /new\(idw-page\)/.test(n)), 'the main view cross-fades: ' + JSON.stringify(turn.names));
    assert.ok(turn.dur >= 150 && turn.dur <= 230, 'about 200 ms: ' + turn.dur);
    assert.deepEqual(turn.top, [turn.before.top], 'the top bar never moves'); assert.deepEqual(turn.rail, [turn.before.rail], 'the rail never moves');
    assert.equal(turn.after.view, turn.before.view, 'the main view keeps its box');
    /* a click that stays on the page skips the animation */
    const stay = await t.p.evaluate(() => new Promise(res => { DQ.go('quests'); const b = document.createElement('button'); b.dataset.do = 'openquest'; b.dataset.a = DQ.data.QUESTS[0].id; document.body.appendChild(b); b.click();
      requestAnimationFrame(() => requestAnimationFrame(() => { const anims = document.getAnimations().filter(a => /idw-page/.test(a.effect && a.effect.pseudoElement || '')).length; const t0 = performance.now(), end = () => { if (document.documentElement.classList.contains('page-turning') && performance.now() - t0 < 3000) return setTimeout(end, 50); b.remove(); res({ view: DQ.ui.view, anims, turning: document.documentElement.classList.contains('page-turning') }); }; setTimeout(end, 100); })); }));
    assert.equal(stay.view, 'quests'); assert.equal(stay.anims, 0, 'a click that stays on the page has no turn'); assert.equal(stay.turning, false);
    /* ...and off under Reduce effects */
    await t.p.evaluate(() => { DQ.S.settings.reduceFx = true; DQ.emit('settings'); document.documentElement.classList.add('calm'); });
    assert.equal(await t.p.evaluate(() => DQ.ui.pageTurnsOn()), false, 'off under html.calm');
    await t.p.evaluate(() => { for (let i = 0; i < 12; i++) DQ.closeModal(); }); await t.p.locator('#topnav .tnav[data-a="home"]').click();
    assert.deepEqual(await t.p.evaluate(() => [DQ.ui.hubOf(DQ.ui.view).id, document.documentElement.classList.contains('page-turning')]), ['home', false]);
    assert.deepEqual(t.errors, []); await t.p.close();
    /* ...and under the device's reduced-motion setting */
    const r = await start(b, { reducedMotion: 'reduce' }); await r.p.evaluate(() => localStorage.setItem('idlewick.transitions', '1'));
    assert.equal(await r.p.evaluate(() => DQ.ui.pageTurnsOn()), false, 'off under prefers-reduced-motion');
    assert.deepEqual(r.errors, []); await r.p.close();
    console.log('PASS motion clock: one rAF loop drives the scenes, nothing runs hidden, no catch-up, the snapper measures changes only, page turns follow the rules');
  } finally { await b.close(); }
})().catch(e => { console.error(e); process.exit(1); });
