/* Part C Task 20: the progression ceiling for time away. Fixtures (granted, in the browser):
   A "close after the tutorial, return tomorrow": a fresh hero, about 2 minutes of live play fishing shrimp, First Steps not
     finished, then away 6 hours and (separately) 24 hours. Run once with the ceiling switched off (before) and once on.
   B counter-fixture: the same hero with every region reached keeps earning Fishing past where A stopped.
   C a short absence that never reaches the ceiling shows no ceiling line; A's Welcome Back shows exactly one. */
const assert = require('node:assert/strict');
const { chromium } = require('playwright');
const path = require('node:path');
(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined }); const errors = [];
  try {
    const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
    p.on('pageerror', e => errors.push(e.message)); p.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
    await p.goto(process.env.IDLEWICK_URL || 'http://127.0.0.1:8765/');
    await p.locator('#t-new').click(); await p.locator('#cr-go').click();
    await p.waitForFunction(() => DQ.started && document.querySelector('#title').hidden);
    const r = await p.evaluate(() => {
      const Q = DQ, D = Q.data; Q.paused = true; Q.S.settings.notify = false;
      /* about two minutes of play: fishing shrimp, First Steps accepted, not finished */
      Q.startAct('fish', 'shrimp', { quiet: true }); Q.advanceTime(120000, 120000, 0); Q.S.playtime += 120000;
      const snap = JSON.stringify(Q.S), ceil0 = Q.progressCeiling;
      const away = (ms, opts = {}) => {
        Q.S = JSON.parse(snap); Q.S.inbox = Q.S.inbox || []; Q.act = null; Q.fight = null; Q.startAct('fish', 'shrimp', { quiet: true });
        if (opts.allTowns) for (const t of D.TOWNS) Q.S.towns[t.id] = Q.S.towns[t.id] || { visited: true, boss: false };
        Q.progressCeiling = opts.off ? () => null : ceil0;
        const eff = Q.offlineEff(ms); const sum = Q.simulate(eff, Math.min(ms, Q.OFFLINE_CAP), { report: true });
        Q.progressCeiling = ceil0;
        const body = Q.ui.welcomeBody ? Q.ui.welcomeBody(sum, ms) : '';
        return { hero: Q.advLvl(), fishing: Q.lvl('fishing'), fishingXp: Math.round(sum.xp.fishing || 0), shrimp: Q.have('raw_shrimp'), coins: sum.coins || 0,
          ceiling: sum.ceiling || null, cap: Q.progressCeiling('fishing'), firstSteps: Q.S.q.first_steps && Q.S.q.first_steps.s,
          ceilingLines: (body.match(/wb-ceiling/g) || []).length, line: (body.match(/<p class="wb-status wb-ceiling">([^<]*)/) || [])[1] || '' };
      };
      return { start: { fishing: Q.lvl('fishing'), shrimp: Q.have('raw_shrimp') },
        before6: away(6 * 3600e3, { off: true }), before24: away(24 * 3600e3, { off: true }),
        after6: away(6 * 3600e3), after24: away(24 * 3600e3),
        counter6: away(6 * 3600e3, { allTowns: true }), short: away(10 * 60e3) };
    });
    for (const k of Object.keys(r)) console.log(k.padEnd(9), JSON.stringify(r[k]));
    /* A: the after-state is not the runaway before-state, and the ceiling is named */
    assert.ok(r.before6.fishing > r.after6.fishing, 'the ceiling bites at 6 hours');
    assert.ok(r.after6.fishing <= r.after6.cap + 1 && r.after24.fishing <= r.after24.cap + 1, 'Fishing stops at the ceiling');
    assert.equal(r.after24.fishing, r.after6.fishing, '24 hours stop at the same place');
    assert.ok(r.after24.shrimp < r.before24.shrimp / 3, 'items stop with XP');
    assert.ok(r.after6.ceiling && r.after6.ceiling.skill === 'fishing');
    assert.equal(r.after6.ceilingLines, 1); assert.match(r.after6.line, /^Fishing stopped at level \d+\. .*Beat a boss or unlock a region/);
    /* B: a player who has reached the content keeps earning past that point */
    assert.ok(r.counter6.fishing > r.after6.fishing, 'counter-fixture earns past the new hero\'s stop');
    /* C: no ceiling, no line */
    assert.equal(r.short.ceiling, null); assert.equal(r.short.ceilingLines, 0);
    await p.evaluate(() => { DQ.go('overview'); });
    assert.deepEqual(errors, []);
    console.log('offline-ceiling: ok');
  } finally { await b.close(); }
})().catch(e => { console.error(e); process.exit(1); });
