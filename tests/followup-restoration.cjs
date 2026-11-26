/* Part B reward gap, follow-up restoration (owner, 26 Nov 2026). Granted fixture: Grubnash beaten, in Mossbarrow with
   the market restored, both regional challenges beaten, Combat 15 (< Old Tusk's 18), Woodcutting 17, 900 coins.
   Home then offers the windmill: first a route to the supply shelf's wool (selected, never bought by the route), then the
   project's own steps. Offered only after 30 minutes of play without a reward (S.lastBeatAt); restoring the windmill is a
   reward, so nothing more is offered straight after. */
const assert = require('node:assert/strict');
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined }); const errors = [];
  try {
    const p = await b.newPage({ viewport: { width: 1440, height: 900 } }); p.on('pageerror', e => errors.push(e.message));
    await p.goto(process.env.IDLEWICK_URL || 'http://127.0.0.1:8765/'); await p.locator('#t-new').click(); await p.locator('#cr-go').click();
    await p.waitForFunction(() => DQ.started && document.querySelector('#title').hidden);
    const r = await p.evaluate(() => { const Q = DQ, D = Q.data, S = Q.S; Q.paused = true; for (let i = 0; i < 12; i++) Q.closeModal();
      S.tut.weaponFinished = true; S.tut.prepareCombat = false;
      for (const q of D.QUESTS) if (q.town === 'willowbrook' || (q.town === 'mossbarrow' && !q.obj.some(o => o.ev === 'boss'))) S.q[q.id] = { s: 'done', p: q.obj.map(o => o.n) };
      S.towns.willowbrook.boss = true; S.towns.mossbarrow = { visited: true, boss: false }; S.town = 'mossbarrow'; S.projects.market = true; S.minis = { gnarlroot: true, rookmother: true };
      const bq = D.QUESTS.find(q => q.obj.some(o => o.ev === 'boss' && o.key === 'oldtusk')); S.q[bq.id] = { s: 'active', p: bq.obj.map(() => 0) };
      for (const sk of ['melee', 'defence', 'hitpoints']) { let n = 0; while (Q.combatLvl() < 15 && n++ < 500) Q.addXp(sk, 200, { quiet: true }); }
      for (let i = 0; i < 60; i++) Q.addXp('woodcutting', 300, { quiet: true }); S.coins = 900; Q.give('bread', 30); S.lastBeatAt = (S.gameTime || 0) - 31 * 60e3;
      const out = { steps: [] }; S.coins = 100; out.poor = Q.followupRestorationStep(); S.coins = 900; const coins0 = S.coins;
      let n = Q.journeyNext(); out.steps.push(n.title);
      Q.ui.DO[n.action](n.a, n.b); out.routeSpent = coins0 - S.coins; out.view = Q.ui.view; out.selected = Q.ui.localSupply;
      out.bought = Q.buyLocalSupply(n.a, +n.b);
      for (let k = 0; k < 8; k++) { n = Q.journeyNext(); out.steps.push(n.title + ' · ' + n.action);
        if (n.action === 'journeytask' && n.a === 'wood') Q.give('log_' + n.b, 30); else if (n.action === 'projectfinish') { Q.finishProject(n.a); break; } else break; }
      out.done = !!S.projects.moss_windmill; out.after = Q.journeyNext().title; out.offered = Q.followupRestorationStep && Q.followupRestorationStep();
      /* a shelf with a carry limit (wheat: 12 at a time) is bought and delivered in rounds for the granary */
      S.projects.moss_pond = true; S.coins = 5000; S.lastBeatAt = (S.gameTime || 0) - 31 * 60e3; out.rounds = [];
      for (let k = 0; k < 10; k++) { const x = Q.journeyNext(); out.rounds.push(x.action);
        if (x.action === 'localroute') Q.buyLocalSupply(x.a, +x.b); else if (x.action === 'projectgive') Q.projectGive(...x.a.split('|'));
        else if (x.action === 'journeytask' && x.a === 'wood') Q.give('log_' + x.b, 40); else if (x.action === 'projectfinish') { Q.finishProject(x.a); break; } else break; }
      out.granary = !!S.projects.moss_granary;
      return out; });
    console.log(JSON.stringify(r));
    assert.equal(r.poor, null, 'not offered when the project and its supplies cost more than the hero carries');
    assert.match(r.steps[0], /^Buy 8 wool for the windmill sails$/); assert.equal(r.routeSpent, 0, 'the route spends nothing');
    assert.equal(r.view, 'shop'); assert.equal(r.selected, 'market:wool'); assert.ok(r.bought);
    assert.ok(r.done, 'windmill restored'); assert.equal(r.offered, null, 'not offered again right after a reward');
    assert.match(r.after, /Old Tusk/);
    assert.ok(r.granary, 'granary restored in rounds: ' + r.rounds.join(' > ')); assert.ok(r.rounds.filter(x => x === 'localroute').length >= 2 && r.rounds.includes('projectgive'));
    /* Saltmere for a combat-trained hero (Woodcutting far below palm's 27): the jetty's shelf sells palm logs (owner, 26 Nov) */
    const salt = await p.evaluate(() => { const Q = DQ, D = Q.data, S = Q.S;
      S.towns.mossbarrow.boss = true; S.towns.saltmere = { visited: true, boss: false }; S.town = 'saltmere'; S.projects.jetty = true;
      for (const q of D.QUESTS) if (q.town === 'mossbarrow' || (q.town === 'saltmere' && !q.obj.some(o => o.ev === 'boss'))) S.q[q.id] = { s: 'done', p: q.obj.map(o => o.n) };
      const bq = D.QUESTS.find(q => q.obj.some(o => o.ev === 'boss' && o.key === D.TOWN.saltmere.boss)); S.q[bq.id] = { s: 'active', p: bq.obj.map(() => 0) };
      for (const m of D.MONLIST.filter(m => m.mini && m.town === 'saltmere')) S.minis[m.id] = true;
      while (Q.lvl('fishing') < 12) Q.addXp('fishing', 500, { quiet: true });
      S.coins = 5000; S.lastBeatAt = (S.gameTime || 0) - 31 * 60e3; const wc = Q.lvl('woodcutting'), steps = [];
      for (let k = 0; k < 10; k++) { const x = Q.journeyNext(); steps.push(x.title);
        if (x.action === 'localroute') Q.buyLocalSupply(x.a, +x.b); else if (x.action === 'projectgive') Q.projectGive(...x.a.split('|'));
        else if (x.action === 'journeytask' && x.a === 'fish') Q.give('raw_' + x.b, 25); else if (x.action === 'projectfinish') { Q.finishProject(x.a); break; } else break; }
      return { wc, steps, done: !!S.projects.salt_smokehouse }; });
    console.log('saltmere', JSON.stringify(salt));
    assert.ok(salt.wc < 27); assert.match(salt.steps[0], /^Buy 40 palm logs for the smokehouse$/); assert.ok(salt.done, 'smokehouse restored');
    assert.deepEqual(errors, []);
    console.log('followup-restoration: ok');
  } finally { await b.close(); }
})().catch(e => { console.error(e); process.exit(1); });
