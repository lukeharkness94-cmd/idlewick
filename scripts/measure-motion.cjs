#!/usr/bin/env node
/* Idlewick: measure the animation clock and per-frame work (27 Nov 2026, docs/motion-performance.md).
   Usage: IDLEWICK_URL=http://127.0.0.1:PORT/ node scripts/measure-motion.cjs [seconds]
   Opens a fresh hero at 1440 x 900 in Playwright's Chromium and records, for 10 s each on Home (woodcutting) and on
   Combat (a fight): requestAnimationFrame callbacks per frame, frame times from rAF timestamps, scripting / layout /
   style time per second (CDP Performance.getMetrics), long tasks (PerformanceObserver) and the time spent inside the
   pixel snapper (CDP CPU profile, inclusive time of the snapper's functions: snapAll before, snapEls after).
   Evidence about this machine's headless Chromium only: headless frames are paced at 60 Hz, so the numbers say how
   much work each frame does, not how a 120/144 Hz display looks. */
const { chromium } = require('playwright');
const SECS = +(process.argv[2] || 10);
const init = () => {
  /* count every rAF callback and group them by the frame timestamp each one receives */
  const raf0 = window.requestAnimationFrame.bind(window), M = window.__motion = { frames: new Map(), cbMs: 0, long: [], on: false };
  window.requestAnimationFrame = cb => raf0(t => { if (!M.on) return cb(t); M.frames.set(t, (M.frames.get(t) || 0) + 1); const a = performance.now(); try { return cb(t); } finally { M.cbMs += performance.now() - a; } });
  try { new PerformanceObserver(l => { if (M.on) for (const e of l.getEntries()) M.long.push(Math.round(e.duration)); }).observe({ entryTypes: ['longtask'] }); } catch (e) { /* no long-task timing */ }
};
const metrics = async cdp => Object.fromEntries((await cdp.send('Performance.getMetrics')).metrics.map(m => [m.name, m.value]));
const inclusive = (profile, names) => {
  const byId = new Map(profile.nodes.map(n => [n.id, n])), parent = new Map();
  for (const n of profile.nodes) for (const c of n.children || []) parent.set(c, n.id);
  const dt = new Map(); profile.samples.forEach((id, i) => dt.set(id, (dt.get(id) || 0) + (profile.timeDeltas[i + 1] || 0)));
  let us = 0; for (const [id, t] of dt) { for (let k = id; k != null; k = parent.get(k)) if (names.includes(byId.get(k).callFrame.functionName)) { us += t; break; } }
  return us / 1000;
};
const sample = async (p, cdp, label) => {
  await p.waitForTimeout(1500); await p.evaluate(() => { for (let i = 0; i < 12; i++) DQ.closeModal(); });
  const modals = await p.evaluate(() => document.querySelectorAll('.modal').length);
  await cdp.send('Profiler.enable'); await cdp.send('Profiler.setSamplingInterval', { interval: 200 }); await cdp.send('Profiler.start');
  const m0 = await metrics(cdp); await p.evaluate(() => { const M = window.__motion; M.frames.clear(); M.cbMs = 0; M.long = []; M.on = true; });
  await p.waitForTimeout(SECS * 1000);
  const r = await p.evaluate(() => { const M = window.__motion; M.on = false; const ts = [...M.frames.keys()].sort((a, b) => a - b), d = ts.slice(1).map((t, i) => t - ts[i]).sort((a, b) => a - b), cbs = [...M.frames.values()];
    return { frames: ts.length, cbPerFrame: cbs.reduce((a, b) => a + b, 0) / Math.max(1, cbs.length), maxCb: Math.max(0, ...cbs), cbMs: M.cbMs, p50: d[Math.floor(d.length * .5)] || 0, p95: d[Math.floor(d.length * .95)] || 0, slow: d.filter(x => x > 25).length, long: M.long, clock: DQ.frame ? DQ.frame.size : null }; });
  const m1 = await metrics(cdp), { profile } = await cdp.send('Profiler.stop');
  const per = k => +(((m1[k] - m0[k]) / SECS) * 1000).toFixed(1);
  const out = { label, modals, fps: +(r.frames / SECS).toFixed(1), rafCallbacksPerFrame: +r.cbPerFrame.toFixed(2), maxCallbacksInAFrame: r.maxCb, rafMsPerSec: +(r.cbMs / SECS).toFixed(1),
    frameP50ms: +r.p50.toFixed(1), frameP95ms: +r.p95.toFixed(1), framesOver25ms: r.slow, scriptMsPerSec: per('ScriptDuration'), layoutMsPerSec: per('LayoutDuration'), styleMsPerSec: per('RecalcStyleDuration'), taskMsPerSec: per('TaskDuration'),
    longTasks: r.long.length, longestTaskMs: Math.max(0, ...r.long), snapMsPerSec: +(inclusive(profile, ['snapAll', 'snapFlush', 'snapEls']) / SECS).toFixed(2), clockCallbacks: r.clock };
  console.log(JSON.stringify(out)); return out;
};
(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });
  try {
    const p = await b.newPage({ viewport: { width: 1440, height: 900 } }); await p.addInitScript(init);
    const errors = []; p.on('pageerror', e => errors.push(e.message));
    await p.goto(process.env.IDLEWICK_URL || 'http://127.0.0.1:8765/');
    await p.locator('#t-new').click(); await p.locator('#cr-go').click();
    await p.waitForFunction(() => DQ.started && document.querySelector('#title').hidden);
    const cdp = await p.context().newCDPSession(p); await cdp.send('Performance.enable');
    await p.evaluate(() => { for (let i = 0; i < 12; i++) DQ.closeModal(); DQ.go('overview'); DQ.ui.render(true); DQ.startAct('wood', 'normal', { quiet: true }); for (let i = 0; i < 12; i++) DQ.closeModal(); });
    await sample(p, cdp, 'home');
    await p.evaluate(() => { for (let i = 0; i < 12; i++) DQ.closeModal(); DQ.S.xp.health = DQ.data.XPF[40]; DQ.go('combat'); DQ.startAct('fight', 'chicken', { quiet: true }); for (let i = 0; i < 12; i++) DQ.closeModal(); });
    await sample(p, cdp, 'combat');
    if (errors.length) console.log('page errors: ' + errors.join(' | '));
  } finally { await b.close(); }
})().catch(e => { console.error(e); process.exit(1); });
