/* Part C Task 19: rarity names agree with how often they happen.
   (1) Over the first hour's actual kill mix (fixed-seed harness run, SEED=7: kills per creature below), the expected
       number of drops per tier is strictly ordered Common > Uncommon > Rare > Epic, and Epic is in single digits.
   (2) A fixed-seed drop sample (seeded Math.random and frozen clocks, one simulated hour fighting in the mudling area through the real engine) gives identical item
       totals with the old and the new labels: the labels change no roll. */
const assert = require('node:assert/strict');
const { chromium } = require('playwright');
const KILLS = { goblin: 6, brambleback: 2, mudling: 361, grubnash: 1, boar: 10, wolf: 31, poacher: 2, grave_robber: 37, barrow_ghoul: 36, gnarlroot: 1, scarecrow: 9 };
(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined }); const errors = [];
  try {
    const p = await b.newPage(); p.on('pageerror', e => errors.push(e.message));
    await p.goto(process.env.IDLEWICK_URL || 'http://127.0.0.1:8765/');
    await p.locator('#t-new').click(); await p.locator('#cr-go').click();
    await p.waitForFunction(() => DQ.started && document.querySelector('#title').hidden);
    const r = await p.evaluate(K => {
      const D = DQ.data, band = (pp, th) => pp >= th[0] ? 'common' : pp >= th[1] ? 'uncommon' : pp >= th[2] ? 'rare' : 'epic';
      const expect = th => { const o = { common: 0, uncommon: 0, rare: 0, epic: 0 }; for (const [id, k] of Object.entries(K)) for (const d of D.MON[id].drops) o[band(d[2], th)] += k * d[2]; for (const x in o) o[x] = +o[x].toFixed(1); return o; };
      const now = D.RARITY.slice(0, 3).map(x => x[3]);
      /* the same fight twice from the same save with a seeded generator: old labels, then new */
      const Q = DQ; Q.paused = true; Q.S.settings.notify = false;
      for (const sk of ['melee', 'defence', 'hitpoints']) for (let i = 0; i < 60; i++) Q.addXp(sk, 400, { quiet: true });
      Q.S.tut.weaponFinished = true; Q.S.tut.prepareCombat = false; Q.give('bread', 200);
      const snap = JSON.stringify(Q.S);
      const sample = th => {
        const keep = D.RARITY.map(x => x[3]); th.forEach((v, i) => { D.RARITY[i][3] = v; });
        Q.S = JSON.parse(snap); Q.act = null; Q.fight = null;
        let s = 12345; const rnd0 = Math.random, now0 = Date.now, perf0 = performance.now; let clock = 1.9e12, pc = 0; Math.random = () => ((s = (s * 1103515245 + 12345) % 2147483648) / 2147483648); Date.now = () => clock; performance.now = () => pc;
        const tiers = {}, items = {}; let coins0 = Q.S.coins;
        const inv0 = { ...Q.S.inv };
        try { Q.startAct('fight', 'mudling', { quiet: true }); const sum = Q.simulate(3600000, 3600000, { report: true }); Object.assign(items, sum.items); }
        finally { Math.random = rnd0; Date.now = now0; performance.now = perf0; keep.forEach((v, i) => { D.RARITY[i][3] = v; }); }
        const gained = {}; for (const id in Q.S.inv) if ((Q.S.inv[id] || 0) !== (inv0[id] || 0)) gained[id] = Q.S.inv[id] - (inv0[id] || 0);
        /* tiers per item, as labelled: the label of each gained item's drop entry under these bands */
        const m = D.MON.mudling;
        return { gained, coins: Q.S.coins - coins0, kills: Q.S.stats.kill };
      };
      return { before: expect(D.RARITY_BEFORE), after: expect(now), warm: sample(now), s1: sample(D.RARITY_BEFORE), s2: sample(now), s3: sample(D.RARITY_BEFORE) };
    }, KILLS);
    console.log('expected first-hour drops per tier, before', JSON.stringify(r.before), 'after', JSON.stringify(r.after));
    const a = r.after;
    assert.ok(a.common > a.uncommon && a.uncommon > a.rare && a.rare > a.epic, 'strict order');
    assert.ok(a.epic < 10, 'Epic is single digits in the first hour');
    assert.ok(!(r.before.common > r.before.uncommon && r.before.rare > r.before.epic), 'the old bands were out of order');
    /* the first run of a page warms one-time caches, so it is discarded; then old, new, old must all agree */
    assert.deepEqual(r.s3.gained, r.s1.gained, 'control: the sample repeats exactly');
    assert.deepEqual(r.s2.gained, r.s1.gained, 'item totals identical');
    assert.equal(r.s2.coins, r.s1.coins, 'coin totals identical');
    console.log('fixed-seed hour of fighting: items', JSON.stringify(r.s1.gained), 'coins', r.s1.coins, 'kills', r.s1.kills);
    assert.deepEqual(errors, []);
    console.log('rarity-tiers: ok');
  } finally { await b.close(); }
})().catch(e => { console.error(e); process.exit(1); });
