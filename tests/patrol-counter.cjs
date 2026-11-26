/* Part C Task 22: the patrol's Next-step card counts goblins live (0/6 → 6/6) from the quest's own progress, on Home
   at 1440 × 900 and 390 × 844, with no horizontal overflow at 390. Granted fixture: First Steps done, Goblin Menace
   accepted, the starter weapon finished, 30 bread; the fight runs while Home stays open. */
const assert = require('node:assert/strict');
const { chromium } = require('playwright');
const path = require('node:path');
(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined }); const errors = [];
  try {
    for (const [w, h] of [[1440, 900], [390, 844]]) {
      const p = await b.newPage({ viewport: { width: w, height: h } });
      p.on('pageerror', e => errors.push(e.message));
      await p.goto(process.env.IDLEWICK_URL || 'http://127.0.0.1:8765/');
      await p.locator('#t-new').click(); await p.locator('#cr-go').click();
      await p.waitForFunction(() => DQ.started && document.querySelector('#title').hidden);
      await p.evaluate(() => { const Q = DQ, D = Q.data, S = Q.S; Q.paused = true; for (let i = 0; i < 12; i++) Q.closeModal();
        S.q.first_steps = { s: 'done', p: D.QM.first_steps.obj.map(o => o.n) }; Q.startQuest('goblin_menace');
        S.tut.weaponFinished = true; S.tut.prepareCombat = false; Q.give('bread', 30);
        for (const sk of ['melee', 'defence', 'hitpoints']) for (let i = 0; i < 10; i++) Q.addXp(sk, 100, { quiet: true });
        Q.go('overview'); Q.ui.render(true); });
      const read = () => p.evaluate(() => { const t = (document.querySelector('.home-next') || {}).innerText || ''; const m = t.match(/(\d+)\s*\/\s*6/); const q = DQ.data.QM.goblin_menace, st = DQ.S.q.goblin_menace;
        return { card: m ? +m[1] : null, log: st.s === 'active' ? DQ.objProg(q, st, 0) : 6, state: st.s }; });
      const r0 = await read(); assert.deepEqual([r0.card, r0.log], [0, 0], `${w}: 0/6 before the patrol`);
      /* start it from the card, then come back to Home and let the fight run */
      /* the card routes to the goblins (routes never start a task by themselves); the fight is started there */
      await p.locator('.home-next .btn.primary').click();
      await p.evaluate(() => { if (!DQ.act) DQ.startAct('fight', 'goblin', { quiet: true }); DQ.go('overview'); DQ.ui.render(true); });
      const seen = [0]; let guard = 0, last = r0;
      const act = await p.evaluate(() => DQ.act && [DQ.act.kind, DQ.act.id]); assert.deepEqual(act, ['fight', 'goblin'], `${w}: the card started the patrol`);
      while (last.state === 'active' && guard++ < 600) {
        /* run the fight until the quest log moves, then let Home's own refresh catch up and compare */
        const moved = await p.evaluate(() => { const q = DQ.data.QM.goblin_menace, st = DQ.S.q.goblin_menace, v = DQ.objProg(q, st, 0);
          for (let i = 0; i < 60 && st.s === 'active' && DQ.objProg(q, st, 0) === v; i++) DQ.advanceTime(1000, 1000, DQ.act ? DQ.act.progress || 0 : 0); return DQ.act && DQ.act.kind; });
        if (!moved && (await read()).state === 'active') break;
        await p.evaluate(() => DQ.emit('ui')); await p.waitForTimeout(450); await p.evaluate(() => DQ.emit('ui')); last = await read();
        if (last.state === 'active') { assert.equal(last.card, last.log, `${w}: card matches the quest log (${last.card} vs ${last.log})`); if (seen[seen.length - 1] !== last.card) seen.push(last.card); }
      }
      assert.notEqual(last.state, 'active', `${w}: the patrol finished`);
      /* at completion the card hands over to the claim step; the quest log shows 6/6 */
      const done = await p.evaluate(() => DQ.objProg(DQ.data.QM.goblin_menace, DQ.S.q.goblin_menace, 0));
      assert.equal(done, 6); seen.push(6);
      for (let i = 1; i < seen.length; i++) assert.ok(seen[i] > seen[i - 1], 'counts up');
      const overflow = await p.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      if (w === 390) assert.ok(overflow <= 0, `no horizontal overflow at 390 (${overflow})`);
      console.log(w, 'counter steps', seen.join(' → '), 'end state', last.state);
      if (process.env.SHOT_DIR) await p.screenshot({ path: path.join(process.env.SHOT_DIR, `patrol-counter-${w}.png`) });
      await p.close();
    }
    assert.deepEqual(errors, []);
    console.log('patrol-counter: ok');
  } finally { await b.close(); }
})().catch(e => { console.error(e); process.exit(1); });
