/* Beastmastery captures mythical beasts, and eggs are lucky finds (owner, 26 and 28 Nov 2026; js/beast_capture.js).
   Hunting kills real game for drops; Beastmastery catches mythical beasts (D.MYTHS) with a crafted capture tool and
   Cooking bait. Checks: the gate (Beastmastery level, the tool that suits the beast, its bait), odds and their bounds
   (lower beasts easier the higher you are), a success keeping the beast once (no egg, tool used, bait used), a repeat
   letting it go (tool kept), a failure (30% XP, bait used, nothing awarded), the tier kit and stopping when it runs
   out, companions from ordinary animals let go on load, save and reload, offline catch-up matching the same work done in
   small steps, forecasts never awarding a beast, an expedition already out still coming back once while no new one can
   be sent, egg drops hooked into skills and fights at their rare rates and never in forecasts, the Collection showing
   those odds, and the Capture tab itself.
   Needs the preview server (IDLEWICK_URL, default port 8765). Isolated test hero with granted levels and items. */
const { chromium } = require('playwright'), assert = require('node:assert/strict');
(async () => {
  const b = await chromium.launch({ headless: true, args: ['--no-sandbox'], ...(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {}) });
  try {
    const p = await b.newPage({ viewport: { width: 1440, height: 900 } }), errors = []; p.on('pageerror', e => errors.push(e.message));
    await p.goto(process.env.IDLEWICK_URL || 'http://127.0.0.1:8765/'); await p.locator('#t-new').click(); await p.locator('#crname').fill('Capture QA'); await p.locator('#cr-go').click();
    await p.waitForTimeout(600);
    await p.evaluate(() => { const S = DQ.S, D = DQ.data; DQ.paused = true; Object.assign(S.settings, { muted: true, notify: false }); S.tut.hidden = true; for (let i = 0; i < 12; i++) DQ.closeModal && DQ.closeModal();
      S.unlocked.hunting = true; S.unlocked.beastmastery = true; S.xp.hunting = D.XPF[30]; S.xp.beastmastery = D.XPF[10]; });
    /* 1. the gate: Beastmastery at the beast's level, the tool that suits it, its bait; the skill must be learned; only
       mythical beasts can be captured (a hunting animal or a combat creature cannot) */
    const r1 = await p.evaluate(() => { const S = DQ.S, C = DQ.KIND_EXT.capture; delete S.inv.wooden_trap; delete S.inv.seed_cake; const a = C.check('thimblefox'); S.inv.wooden_trap = 2; const b = C.check('thimblefox'); S.inv.seed_cake = 3; const c = C.check('thimblefox');
      const high = C.check('eclipse_roc'); S.unlocked.beastmastery = false; const d = C.check('thimblefox'); S.unlocked.beastmastery = true;
      return { a, b, c, d, high, valid: C.valid('thimblefox'), animal: C.valid('chicken'), invalid: C.valid('goblin'), kit: DQ.captureKit('griffin').tool, net: DQ.captureKit('firebird').tool, halter: DQ.captureKit('kirin').tool }; });
    assert.match(r1.a, /Wooden trap/); assert.match(r1.b, /Seed cake/); assert.equal(r1.c, ''); assert.match(r1.d, /Learn Beastmastery/); assert.match(r1.high, /Requires Beastmastery 95/);
    assert.equal(r1.valid, true); assert.equal(r1.animal, false); assert.equal(r1.invalid, false); assert.deepEqual([r1.kit, r1.net, r1.halter], ['ironjaw_cage', 'starwoven_net', 'rope_halter']);
    /* 2. odds: 55% + 2.5% per Beastmastery level above the beast, kept between 35% and 90% */
    const r2 = await p.evaluate(() => { const S = DQ.S, D = DQ.data, at = (l, id) => { S.xp.beastmastery = D.XPF[l]; return +DQ.captureChance(id).toFixed(3); };
      const out = { even: at(21, 'prismkite'), low: at(1, 'eclipse_roc'), high: at(99, 'thimblefox'), plus: at(12, 'candletoad') }; S.xp.beastmastery = D.XPF[10]; return out; });
    assert.deepEqual(r2, { even: .55, low: .35, high: .9, plus: .65 });
    /* 3. a success keeps the beast at once (no egg), uses the tool and one bait, pays XP and records it once */
    const r3 = await p.evaluate(() => { const S = DQ.S, rnd = Math.random; S.inv.wooden_trap = 2; S.inv.seed_cake = 3; const x0 = S.xp.beastmastery; DQ.startAct('capture', 'thimblefox');
      Math.random = () => .01; DQ.KIND_EXT.capture.done(DQ.act); Math.random = rnd;
      return { owned: !!S.pets.owned.wild_thimblefox, egg: !!DQ.eggOf('wild_thimblefox'), traps: S.inv.wooden_trap, bait: S.inv.seed_cake, xp: S.xp.beastmastery - x0, count: DQ.act.count, kept: S.pets.capture.kept, events: S.pets.events.filter(e => e.kind === 'capture' && e.id === 'wild_thimblefox').length, kind: DQ.act.kind, name: DQ.mythName('thimblefox') }; });
    assert.deepEqual({ ...r3, xp: r3.xp > 0 }, { owned: true, egg: false, traps: 1, bait: 2, xp: true, count: 1, kept: 1, events: 1, kind: 'capture', name: 'Thimblefox' });
    /* 4. again: already yours, so it is let go: XP, no duplicate, tool kept, bait used */
    const r4 = await p.evaluate(() => { const S = DQ.S, rnd = Math.random, n0 = Object.keys(S.pets.owned).length, x0 = S.xp.beastmastery; Math.random = () => .01; DQ.KIND_EXT.capture.done(DQ.act); Math.random = rnd;
      return { n: Object.keys(S.pets.owned).length - n0, traps: S.inv.wooden_trap, bait: S.inv.seed_cake, released: S.pets.capture.released, xp: S.xp.beastmastery - x0, kept: S.pets.capture.kept }; });
    assert.equal(r4.n, 0); assert.equal(r4.traps, 1); assert.equal(r4.bait, 1); assert.equal(r4.released, 1); assert.ok(r4.xp > 0); assert.equal(r4.kept, 1);
    /* 5. a failure: 30% of the XP, nothing awarded, the tool kept, the bait used, the task carries on; the beast is named once tried */
    const r5 = await p.evaluate(() => { const S = DQ.S, rnd = Math.random; S.inv.seed_cake = 3; DQ.stopAct(); const unnamed = DQ.mythName('bellhare'); DQ.startAct('capture', 'bellhare'); const full = DQ.captureXp('bellhare', true), part = DQ.captureXp('bellhare', false);
      Math.random = () => .999; DQ.KIND_EXT.capture.done(DQ.act); Math.random = rnd; return { unnamed, named: DQ.mythName('bellhare'), owned: !!S.pets.owned.wild_bellhare, traps: S.inv.wooden_trap, bait: S.inv.seed_cake, ratio: +(part / full).toFixed(1), still: DQ.act && DQ.act.kind, escaped: S.pets.capture.escaped, tries: S.pets.capture.tries.bellhare }; });
    assert.deepEqual(r5, { unnamed: '???', named: 'Bellhare', owned: false, traps: 1, bait: 2, ratio: .3, still: 'capture', escaped: 1, tries: 1 });
    /* 6. tier kit: an Intermediate winged beast needs a fowling net and scent bait; one bait per try; running out stops the task */
    const r6 = await p.evaluate(() => { const S = DQ.S, C = DQ.KIND_EXT.capture, rnd = Math.random; DQ.stopAct(); S.xp.beastmastery = DQ.data.XPF[25]; delete S.inv.fowling_net; delete S.inv.scent_bait;
      const noTool = C.check('prismkite'); S.inv.fowling_net = 1; const noBait = C.check('prismkite'); S.inv.scent_bait = 2; const ok = DQ.startAct('capture', 'prismkite');
      Math.random = () => .999; C.done(DQ.act); const left = S.inv.scent_bait; C.done(DQ.act); Math.random = rnd; return { noTool, noBait, ok, left, net: S.inv.fowling_net, stopped: !DQ.act }; });
    assert.match(r6.noTool, /Fowling net/); assert.match(r6.noBait, /Scent bait/); assert.equal(r6.ok, true); assert.equal(r6.left, 1); assert.equal(r6.net, 1); assert.equal(r6.stopped, true);
    /* 7. forecasts never award a beast or an egg */
    const r7 = await p.evaluate(() => { const S = DQ.S, rnd = Math.random; S.inv.wooden_trap = 2; S.inv.seed_cake = 2; DQ.startAct('capture', 'candletoad'); Math.random = () => 0; DQ.forecasting = true;
      try { DQ.KIND_EXT.capture.done(DQ.act); var egg = DQ.eggDrop('kill'); } finally { DQ.forecasting = false; Math.random = rnd; }
      const r = { owned: !!S.pets.owned.wild_candletoad, egg, eggs: DQ.eggs().length }; DQ.stopAct(); return r; });
    assert.deepEqual(r7, { owned: false, egg: false, eggs: 0 });
    /* 8. offline catch-up and the same time in small steps do the same work */
    /* the live world-event clock runs on real time between steps and draws from the same random stream, so a busy machine
       shifted the stepped run's luck (26 Nov); it isn't what this compares, so it is held still here */
    const r8 = await p.evaluate(() => { const S = DQ.S, D = DQ.data, snap = JSON.stringify(S), rnd = Math.random, W = DQ.worldState, next0 = W && W.next; if (W) W.next = Infinity;
      const seeded = () => { let s = 12345; return () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; }; };
      const run = chunks => { DQ.S = JSON.parse(snap); DQ.fxDirty(); DQ.S.inv.wooden_trap = 40; DQ.S.inv.seed_cake = 400; DQ.S.xp.beastmastery = D.XPF[14]; Math.random = seeded(); DQ.startAct('capture', 'tideglass', { quiet: true });
        for (let i = 0; i < chunks; i++) DQ.simulate(600000 / chunks); const out = { tries: DQ.S.pets.capture.tries.tideglass || 0, owned: !!DQ.S.pets.owned.wild_tideglass, xp: Math.round(DQ.S.xp.beastmastery), traps: DQ.S.inv.wooden_trap, bait: DQ.S.inv.seed_cake }; DQ.stopAct(); return out; };
      try { const one = run(1), many = run(60); const flip = DQ.captureXpShown('tideglass', true) - DQ.captureXpShown('tideglass', false); return { one, many, flip }; } finally { Math.random = rnd; DQ.S = JSON.parse(snap); DQ.fxDirty(); if (W) W.next = next0; } });
    assert.ok(r8.one.tries > 20, 'ten minutes of captures: ' + JSON.stringify(r8)); assert.ok(Math.abs(r8.one.tries - r8.many.tries) <= 1, JSON.stringify(r8)); assert.equal(r8.one.owned, true); assert.equal(r8.many.owned, true);
    /* the same work either way (tries above, within one); the luck can differ (see engine.js act.t0); a real double-count
       or lost step would be far outside 10% */
    assert.ok(Math.abs(r8.one.xp - r8.many.xp) <= Math.max(5 * r8.flip, r8.one.xp * .10), JSON.stringify(r8)); assert.equal(r8.one.traps, 39); assert.equal(r8.many.traps, 39); assert.equal(400 - r8.one.bait, r8.one.tries, 'one bait per try');
    /* 9. save and reload: the captured beast, the capture record and a running capture all come back; a companion caught
       from an ordinary animal before 28 Nov 2026 is let go with a note (owner: "Get rid") */
    await p.evaluate(() => { const S = DQ.S; S.inv.wooden_trap = 3; S.inv.seed_cake = 3; S.pets.owned.wild_chicken = { bondXp: 0, trainingUntil: 0 }; S.pets.active = 'wild_chicken'; DQ.startAct('capture', 'thimblefox'); DQ.save(); });
    await p.reload(); await p.locator('#t-cont').click(); await p.waitForTimeout(800);
    const r9 = await p.evaluate(() => ({ owned: !!DQ.S.pets.owned.wild_thimblefox, kept: DQ.S.pets.capture && DQ.S.pets.capture.kept, act: DQ.act && DQ.act.kind + ':' + DQ.act.id, chicken: !!DQ.S.pets.owned.wild_chicken, active: DQ.S.pets.active, note: (DQ.S.log || []).some(l => /let go/.test(l.m)) }));
    assert.deepEqual(r9, { owned: true, kept: 1, act: 'capture:thimblefox', chicken: false, active: null, note: true });
    /* 10. expeditions: none can be sent; one already out comes back once */
    const r10 = await p.evaluate(() => { const S = DQ.S, now = Date.now(); S.coins = 5000; const sent = DQ.sendBeastTrap('bond_wolf', 'basic');
      S.pets.expedition = { species: 'bond_wolf', tier: 'basic', sent: now - 3600000, due: now - 1, roll: 0 }; const first = DQ.resolveBeastTrap(), second = DQ.resolveBeastTrap();
      return { sent, first, second, out: S.pets.expedition, egg: !!DQ.eggOf('bond_wolf') || !!S.pets.owned.bond_wolf }; });
    assert.deepEqual(r10, { sent: false, first: true, second: false, out: null, egg: true });
    /* 11. eggs as lucky finds: rare rates, hooked into skills and fights, never in forecasts, only beasts you could have */
    const r11 = await p.evaluate(() => { const S = DQ.S, D = DQ.data, rnd = Math.random; for (const k of Object.keys(S.xp)) S.xp[k] = Math.max(S.xp[k], D.XPF[40]); DQ.fxDirty();
      const rates = [D.EGG_DROP.action, D.EGG_DROP.kill]; S.towns.mossbarrow = { visited: true, boss: false }; const pool0 = DQ.eggPool();
      const e0 = DQ.eggs().length, ids0 = new Set(DQ.eggs().map(e => e.id)); Math.random = () => .5; for (let i = 0; i < 200; i++) { DQ.petRoll('skill', 'fishing'); for (const h of DQ.killHooks) h(D.MON.goblin); } const none = DQ.eggs().length - e0;
      Math.random = () => 0; DQ.forecasting = true; const fc = DQ.eggDrop('action'); DQ.forecasting = false;
      const before = DQ.eggs().length; DQ.petRoll('skill', 'mining'); const fromSkill = DQ.eggs().length - before; const b2 = DQ.eggs().length; for (const h of DQ.killHooks) h(D.MON.goblin); const fromKill = DQ.eggs().length - b2; Math.random = rnd;
      return { rates, pool: pool0.length, none, fc, fromSkill: fromSkill >= 1, fromKill: fromKill >= 1, onlyPool: DQ.eggs().filter(e => !ids0.has(e.id)).every(e => !D.BEAST_SPECIES[e.id] || pool0.includes(e.id)) }; });
    assert.deepEqual(r11.rates, [1 / 2000, 1 / 500]); assert.ok(r11.pool >= 1, 'a beast is in the pool'); assert.equal(r11.none, 0); assert.equal(r11.fc, false); assert.equal(r11.fromSkill, true, r11.dbg); assert.equal(r11.fromKill, true, r11.dbg); assert.equal(r11.onlyPool, true);
    /* 12. the Collection shows those odds */
    const r12 = await p.evaluate(() => { DQ.ui.colTab = 'eggs'; DQ.go('collection'); return document.querySelector('#view .col-list').innerText; });
    assert.match(r12, /Lucky find/); assert.match(r12, /per action · 1 in [\d,]+ per fight|From Hero/);
    /* 13. the Capture tab: tier tabs, six cards, live kit counts, the step strip while running, unmet beasts unnamed */
    const r13 = await p.evaluate(() => new Promise(res => { const S = DQ.S; S.inv.wooden_trap = 3; S.inv.seed_cake = 3; DQ.ui.beastMode = 'capture'; DQ.ui.captureTier = 0; DQ.ui.taskChoice.beastmastery = 'thimblefox'; DQ.go('beastmastery'); DQ.stopAct(true); DQ.startAct('capture', 'thimblefox'); DQ.ui.render(false); DQ.emit('ui');
      const v = document.querySelector('#view'), out = { tabs: v.querySelectorAll('.ranch-tabs button').length, tiers: v.querySelectorAll('.hunt-tiers button').length, cards: v.querySelectorAll('.illustrated-card').length, count: v.querySelector('[data-b="count:wooden_trap"]')?.textContent, strip: !!v.querySelector('.hunt-track'), unknown: [...v.querySelectorAll('.illustrated-card.locked b')].every(b => b.textContent === '???') };
      DQ.paused = true; DQ.emit('captureresult', { id: 'thimblefox', c: 0, f: 2, k: 0 }, DQ.data.MYTH.thimblefox);
      /* a busy machine can redraw the stage in between: wait for the result strip (up to a second) rather than a fixed 50 ms */
      const t0 = Date.now(), look = () => { const li = document.querySelector('#view .hunt-track-steps li[data-st="fail"]'); if (!li && Date.now() - t0 < 1000) { DQ.emit('ui'); return setTimeout(look, 40); } out.fail = li?.dataset.i; out.text = document.querySelector('#view .hunt-track-out')?.textContent; DQ.stopAct(); res(out); }; setTimeout(look, 40); }));
    assert.deepEqual(r13, { tabs: 2, tiers: 5, cards: 6, count: '3', strip: true, unknown: true, fail: '2', text: 'It would not come. It got away.' });
    assert.deepEqual(errors, []);
    console.log('PASS beast capture: mythical beasts only, level + tool + bait gate, odds 35-90%, keep once (no egg, tool used), let go when owned, failures use bait, tier kit, ordinary-animal companions let go on load, forecasts award nothing, offline = small steps, save/reload, expedition resolves once and none can be sent, lucky eggs 1/2000 actions and 1/500 fights (never in forecasts), Collection odds, Capture tab.');
  } finally { await b.close(); }
})().catch(e => { console.error(e); process.exit(1); });
