/* Hunting is its own activity (owner, 23 Nov 2026), plus the fight stage following the foe and night on the stage.
   Needs the preview server (IDLEWICK_URL, default port 8765). */
const { chromium } = require('playwright'), assert = require('node:assert/strict'), fs = require('node:fs');
(async () => {
  const b = await chromium.launch({ headless: true, args: ['--no-sandbox'], ...(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {}) });
  try {
    const p = await b.newPage({ viewport: { width: 1440, height: 900 } }), errors = []; p.on('pageerror', e => errors.push(e.message));
    await p.goto(process.env.IDLEWICK_URL || 'http://127.0.0.1:8765/'); await p.locator('#t-new').click(); await p.locator('#crname').fill('Hunt'); await p.locator('#cr-go').click();
    await p.evaluate(() => { DQ.paused = true; DQ.S.settings.muted = true; DQ.S.tut.hidden = true; DQ.closeModal && DQ.closeModal(); });
    /* 1. the Hunting page opens on the hunting ground with the town's animals */
    const r1 = await p.evaluate(() => { DQ.S.unlocked.hunting = true; DQ.S.xp.hunting = DQ.data.XPF[3]; DQ.ui.huntMode = undefined; DQ.go('hunting');
      const v = document.querySelector('#view'); return { tab: v.querySelector('.hunt-mode-tabs .on')?.textContent.trim(), cards: v.querySelectorAll('.activity-choices .choice, .activity-choices [data-do="taskpick"], .activity-choices .card').length, head: v.querySelector('.activity-choices h2')?.textContent }; });
    assert.equal(r1.tab, 'Hunting ground'); assert.equal(r1.head, 'Choose your quarry');
    /* 2. a catch is a kill for quests, the field guide and drops; it pays Hunting XP and no combat XP */
    const r2 = await p.evaluate(() => { const before = { ...DQ.S.xp }; const rnd = Math.random; Math.random = () => .01;
      const qev = []; const q0 = DQ.qev; DQ.qev = (...a) => { qev.push(a.slice(0, 2).join(':')); return q0(...a); };
      DQ.startAct('hunt', 'chicken'); const ext = DQ.KIND_EXT.hunt; ext.done(DQ.act); DQ.qev = q0; Math.random = rnd;
      return { kind: DQ.act.kind, count: DQ.act.count, kills: DQ.S.beast.kills.chicken || 0, qev, hunting: DQ.S.xp.hunting - before.hunting, melee: DQ.S.xp.melee - before.melee, hp: DQ.S.xp.hitpoints - before.hitpoints, got: Object.keys(DQ.S.inv).filter(k => ['feather', 'egg', 'raw_game'].includes(k)).length }; });
    assert.equal(r2.kind, 'hunt'); assert.equal(r2.count, 1); assert.equal(r2.kills, 1); assert.ok(r2.qev.includes('kill:chicken'), 'a catch counts as a quest kill');
    assert.ok(r2.hunting > 0, 'Hunting XP'); assert.equal(r2.melee, 0, 'no Melee XP'); assert.equal(r2.hp, 0, 'no Health XP'); assert.ok(r2.got >= 1, 'drops granted');
    /* 3. an escape pays some XP, no kill, and the hunt carries on */
    const r3 = await p.evaluate(() => { const k0 = DQ.S.beast.kills.chicken, x0 = DQ.S.xp.hunting, rnd = Math.random; Math.random = () => .999; DQ.KIND_EXT.hunt.done(DQ.act); Math.random = rnd;
      return { kills: DQ.S.beast.kills.chicken - k0, xp: DQ.S.xp.hunting - x0, still: DQ.act && DQ.act.kind, esc: DQ.S.hunt.escaped || 0 }; });
    assert.equal(r3.kills, 0); assert.ok(r3.xp > 0); assert.equal(r3.still, 'hunt'); assert.equal(r3.esc, 1);
    /* 4. the three steps follow the cycle and odds stay within bounds */
    const r4 = await p.evaluate(() => { const a = DQ.act, d = a.dur, at = f => { a.t0 = Date.now() - d * f; return DQ.huntStep(a)[0]; };
      const odds = DQ.data.MONLIST.filter(m => m.hl).map(m => DQ.huntCatch(m.id)); return { s: [at(.1), at(.5), at(.9)], lo: Math.min(...odds), hi: Math.max(...odds) }; });
    assert.deepEqual(r4.s, ['Tracking', 'Setting the trap', 'Strike']); assert.ok(r4.lo >= .45 && r4.hi <= .92);
    /* 5. routes: an Explore of the hunting ground hunts; animals are gone from the combat window */
    const r5 = await p.evaluate(() => { DQ.stopAct(); const g = DQ.huntGround(DQ.S.town); const ok = DQ.startHunt(g.id, null); const k = DQ.act && DQ.act.kind; DQ.stopAct(); DQ.go('combat');
      return { ok, k, tiles: document.querySelectorAll('#view .cw-window-hunt, #view .cw-hunt').length, link: !!document.querySelector('#view .cw-tabs [data-do="huntground"]') }; });
    assert.equal(r5.ok, true); assert.equal(r5.k, 'hunt'); assert.equal(r5.tiles, 0); assert.equal(r5.link, true);
    /* 6. before Hunting is learned, a quest's animal is still reachable as a fight */
    const r6 = await p.evaluate(() => { DQ.S.unlocked.hunting = false; const g = DQ.huntGround(DQ.S.town); const id = g.monsters[0].id; DQ.startHunt(g.id, id, true); const k = DQ.act && DQ.act.kind; DQ.stopAct(); DQ.S.unlocked.hunting = true; return k; });
    assert.equal(r6, 'fight');
    /* 7. the stage follows the foe after each kill (it stayed on the first creature before) */
    await p.evaluate(() => { DQ.paused = false; DQ.S.inv.bread = 20; DQ.go('combat'); const a = DQ.combatAreas(DQ.S.town)[0]; DQ.startHunt(a.id, null); });
    let matched = 0;
    for (let i = 0; i < 8; i++) { await p.waitForTimeout(1500); const s = await p.evaluate(() => { const f = DQ.fight, m = f && DQ.data.MON[f.id]; const sides = document.querySelectorAll('#view .encounter-arena>.side'); const foe = sides[sides.length - 1]?.querySelector('#av-foe'); return m && foe ? foe.dataset.a === m.id : null; }); if (s === true) matched++; if (s === false) { await p.waitForTimeout(1200); assert.equal(await p.evaluate(() => { const sides = document.querySelectorAll('#view .encounter-arena>.side'); return sides[sides.length - 1]?.querySelector('#av-foe')?.dataset.a === DQ.fight?.id; }), true, 'stage shows the current foe'); } }
    assert.ok(matched >= 4);
    /* 8. night tints the landscape, not the fighters */
    const r8 = await p.evaluate(() => { document.body.dataset.tod = 'night'; const t = document.querySelector('#view .encounter-arena>.tod-tint'), s = document.querySelector('#view .encounter-arena>.side'); return t && s ? [+getComputedStyle(t).zIndex, +getComputedStyle(s).zIndex] : null; });
    if (r8) assert.ok(r8[0] < r8[1], 'fighters above the night tint');
    /* 9. the foe card: name and place on one line each */
    const r9 = await p.evaluate(() => { const b = document.querySelector('#view .cw-foe-id>b'), s = document.querySelector('#view .cw-foe-id>small'); return b && s ? [b.getClientRects().length, getComputedStyle(b).whiteSpace, getComputedStyle(s).whiteSpace] : null; });
    if (r9) assert.deepEqual(r9.slice(1), ['nowrap', 'nowrap']);
    await p.evaluate(() => { DQ.stopAct(); DQ.paused = true; });
    assert.deepEqual(errors, []);
    console.log('PASS hunting ground (catch/escape/steps/routes/fallback), stage follows foe, night tint under fighters, foe card single lines.');
  } finally { await b.close(); }
})().catch(e => { console.error(e); process.exit(1); });
