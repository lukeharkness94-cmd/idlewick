/* Beastmastery captures and eggs as lucky finds (owner, 26 Nov 2026; js/beast_capture.js).
   Hunting kills for drops; Beastmastery catches an animal you have hunted and keeps it. Checks: the capture gate (hunted
   first), odds and their bounds, a success keeping the animal once (no egg, trap used), a repeat letting it go (trap
   kept), a failure (30% XP, bait used, nothing awarded), the tier kit and stopping when it runs out, save and reload,
   offline catch-up matching the same work done in small steps, forecasts never awarding a beast, an expedition already
   out still coming back once while no new one can be sent, egg drops hooked into skills and fights at their rare
   rates and never in forecasts, the Collection showing those odds, and the Capture tab itself.
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
    /* 1. the gate: an animal must have been hunted; the skill must be learned */
    const r1 = await p.evaluate(() => { const S = DQ.S, C = DQ.KIND_EXT.capture; const a = C.check('chicken'); S.beast.kills.chicken = 1; delete S.inv.wooden_trap; const b = C.check('chicken'); S.inv.wooden_trap = 2; const c = C.check('chicken');
      S.unlocked.beastmastery = false; const d = C.check('chicken'); S.unlocked.beastmastery = true; return { a, b, c, d, valid: C.valid('chicken'), invalid: C.valid('goblin') }; });
    assert.equal(r1.a, 'Hunt one first'); assert.match(r1.b, /Wooden trap/); assert.equal(r1.c, ''); assert.match(r1.d, /Learn Beastmastery/); assert.equal(r1.valid, true); assert.equal(r1.invalid, false);
    /* 2. odds: 55% + 2.5% per Beastmastery level above the animal, kept between 35% and 90% */
    const r2 = await p.evaluate(() => { const S = DQ.S, D = DQ.data, at = (l, id) => { S.xp.beastmastery = D.XPF[l]; return +DQ.captureChance(id).toFixed(3); };
      const out = { even: at(20, 'seal'), low: at(1, 'celestial_unicorn'), high: at(99, 'chicken'), plus: at(14, 'chicken') }; S.xp.beastmastery = D.XPF[10]; return out; });
    assert.deepEqual(r2, { even: .55, low: .35, high: .9, plus: .875 });
    /* 3. a success keeps the animal at once (no egg), uses the trap, pays XP and records it once */
    const r3 = await p.evaluate(() => { const S = DQ.S, rnd = Math.random; S.inv.wooden_trap = 2; const x0 = S.xp.beastmastery; DQ.startAct('capture', 'chicken');
      Math.random = () => .01; DQ.KIND_EXT.capture.done(DQ.act); Math.random = rnd;
      return { owned: !!S.pets.owned.wild_chicken, egg: !!DQ.eggOf('wild_chicken'), traps: S.inv.wooden_trap, xp: S.xp.beastmastery - x0, count: DQ.act.count, kept: S.pets.capture.kept, events: S.pets.events.filter(e => e.kind === 'capture' && e.id === 'wild_chicken').length, kind: DQ.act.kind }; });
    assert.deepEqual({ ...r3, xp: r3.xp > 0 }, { owned: true, egg: false, traps: 1, xp: true, count: 1, kept: 1, events: 1, kind: 'capture' });
    /* 4. again: already yours, so it is let go: XP, no duplicate, trap kept */
    const r4 = await p.evaluate(() => { const S = DQ.S, rnd = Math.random, n0 = Object.keys(S.pets.owned).length, x0 = S.xp.beastmastery; Math.random = () => .01; DQ.KIND_EXT.capture.done(DQ.act); Math.random = rnd;
      return { n: Object.keys(S.pets.owned).length - n0, traps: S.inv.wooden_trap, released: S.pets.capture.released, xp: S.xp.beastmastery - x0, kept: S.pets.capture.kept }; });
    assert.equal(r4.n, 0); assert.equal(r4.traps, 1); assert.equal(r4.released, 1); assert.ok(r4.xp > 0); assert.equal(r4.kept, 1);
    /* 5. a failure: 30% of the XP, nothing awarded, the trap kept, the task carries on */
    const r5 = await p.evaluate(() => { const S = DQ.S, rnd = Math.random; S.beast.kills.rabbit = 1; DQ.stopAct(); DQ.startAct('capture', 'rabbit'); const full = DQ.captureXp('rabbit', true), part = DQ.captureXp('rabbit', false);
      Math.random = () => .999; DQ.KIND_EXT.capture.done(DQ.act); Math.random = rnd; return { owned: !!S.pets.owned.wild_rabbit, traps: S.inv.wooden_trap, ratio: +(part / full).toFixed(1), still: DQ.act && DQ.act.kind, escaped: S.pets.capture.escaped, tries: S.pets.capture.tries.rabbit }; });
    assert.deepEqual(r5, { owned: false, traps: 1, ratio: .3, still: 'capture', escaped: 1, tries: 1 });
    /* 6. tier kit: Intermediate needs a padded live trap and scent bait; one bait per try; running out stops the task */
    const r6 = await p.evaluate(() => { const S = DQ.S, C = DQ.KIND_EXT.capture, rnd = Math.random; DQ.stopAct(); S.beast.kills.seal = 1; delete S.inv.live_trap; delete S.inv.scent_bait;
      const noTrap = C.check('seal'); S.inv.live_trap = 1; const noBait = C.check('seal'); S.inv.scent_bait = 2; const ok = DQ.startAct('capture', 'seal');
      Math.random = () => .999; C.done(DQ.act); const left = S.inv.scent_bait; C.done(DQ.act); Math.random = rnd; return { noTrap, noBait, ok, left, trap: S.inv.live_trap, stopped: !DQ.act }; });
    assert.match(r6.noTrap, /Padded live trap/); assert.match(r6.noBait, /Scent bait/); assert.equal(r6.ok, true); assert.equal(r6.left, 1); assert.equal(r6.trap, 1); assert.equal(r6.stopped, true);
    /* 7. forecasts never award a beast or an egg */
    const r7 = await p.evaluate(() => { const S = DQ.S, rnd = Math.random; S.beast.kills.sheep = 1; S.xp.hunting = DQ.data.XPF[30]; DQ.startAct('capture', 'sheep'); Math.random = () => 0; DQ.forecasting = true;
      try { DQ.KIND_EXT.capture.done(DQ.act); var egg = DQ.eggDrop('kill'); } finally { DQ.forecasting = false; Math.random = rnd; }
      const r = { owned: !!S.pets.owned.wild_sheep, egg, eggs: DQ.eggs().length }; DQ.stopAct(); return r; });
    assert.deepEqual(r7, { owned: false, egg: false, eggs: 0 });
    /* 8. offline catch-up and the same time in small steps do the same work */
    const r8 = await p.evaluate(() => { const S = DQ.S, D = DQ.data, snap = JSON.stringify(S), rnd = Math.random;
      const seeded = () => { let s = 12345; return () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; }; };
      const run = chunks => { DQ.S = JSON.parse(snap); DQ.fxDirty(); DQ.S.beast.kills.cow = 1; DQ.S.inv.wooden_trap = 40; DQ.S.xp.hunting = D.XPF[30]; Math.random = seeded(); DQ.startAct('capture', 'cow', { quiet: true });
        for (let i = 0; i < chunks; i++) DQ.simulate(600000 / chunks); const out = { tries: DQ.S.pets.capture.tries.cow || 0, owned: !!DQ.S.pets.owned.wild_cow, xp: Math.round(DQ.S.xp.beastmastery), traps: DQ.S.inv.wooden_trap }; DQ.stopAct(); return out; };
      try { const one = run(1), many = run(60); return { one, many }; } finally { Math.random = rnd; DQ.S = JSON.parse(snap); DQ.fxDirty(); } });
    assert.ok(r8.one.tries > 20, 'ten minutes of captures: ' + JSON.stringify(r8)); assert.ok(Math.abs(r8.one.tries - r8.many.tries) <= 1, JSON.stringify(r8)); assert.equal(r8.one.owned, true); assert.equal(r8.many.owned, true);
    assert.ok(Math.abs(r8.one.xp - r8.many.xp) <= Math.max(5, r8.one.xp * .03), JSON.stringify(r8)); assert.equal(r8.one.traps, 39); assert.equal(r8.many.traps, 39);
    /* 9. save and reload: the captured beast, the capture record and a running capture all come back */
    await p.evaluate(() => { const S = DQ.S; S.inv.wooden_trap = 3; DQ.startAct('capture', 'chicken'); DQ.save(); });
    await p.reload(); await p.locator('#t-cont').click(); await p.waitForTimeout(800);
    const r9 = await p.evaluate(() => ({ owned: !!DQ.S.pets.owned.wild_chicken, kept: DQ.S.pets.capture && DQ.S.pets.capture.kept, act: DQ.act && DQ.act.kind + ':' + DQ.act.id }));
    assert.deepEqual(r9, { owned: true, kept: 1, act: 'capture:chicken' });
    await p.evaluate(() => { DQ.paused = true; DQ.stopAct(); for (let i = 0; i < 12; i++) DQ.closeModal && DQ.closeModal(); });
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
    /* 13. the Capture tab: tier tabs, ten cards, live kit counts, the step strip while running */
    const r13 = await p.evaluate(() => new Promise(res => { const S = DQ.S; S.inv.wooden_trap = 3; DQ.ui.beastMode = 'capture'; DQ.ui.captureTier = 0; DQ.ui.taskChoice.beastmastery = 'chicken'; DQ.go('beastmastery'); DQ.startAct('capture', 'chicken'); DQ.ui.render(false); DQ.emit('ui');
      const v = document.querySelector('#view'), out = { tabs: v.querySelectorAll('.ranch-tabs button').length, tiers: v.querySelectorAll('.hunt-tiers button').length, cards: v.querySelectorAll('.illustrated-card').length, count: v.querySelector('[data-b="count:wooden_trap"]')?.textContent, strip: !!v.querySelector('.hunt-track'), unknown: [...v.querySelectorAll('.illustrated-card.locked b')].every(b => b.textContent === '???') };
      DQ.emit('captureresult', { id: 'chicken', c: 0, f: 2, k: 0 }, DQ.data.MON.chicken); setTimeout(() => { out.fail = v.querySelector('.hunt-track-steps li[data-st="fail"]')?.dataset.i; out.text = v.querySelector('.hunt-track-out')?.textContent; DQ.stopAct(); res(out); }, 50); }));
    assert.deepEqual(r13, { tabs: 2, tiers: 5, cards: 10, count: '3', strip: true, unknown: true, fail: '2', text: 'It would not come. It got away.' });
    assert.deepEqual(errors, []);
    console.log('PASS beast capture: hunted-first gate, odds 35-90%, keep once (no egg, trap used), let go when owned, failures, tier kit, forecasts award nothing, offline = small steps, save/reload, expedition resolves once and none can be sent, lucky eggs 1/2000 actions and 1/500 fights (never in forecasts), Collection odds, Capture tab.');
  } finally { await b.close(); }
})().catch(e => { console.error(e); process.exit(1); });
