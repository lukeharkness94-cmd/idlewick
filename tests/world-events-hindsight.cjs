/* World events in hindsight (owner, 26 Nov 2026: "can these random events come up as a full-screen pop up. When idle or
   offline, these can be tasks people can come choose their action in hindsight"). In the real page:
   (1) a world event opens full-screen over the whole window, its first choice focused without scrolling, and the
       running task keeps going behind it; (2) Decide later (and Escape) leaves it waiting in the inbox: Activity lists it
       and Home counts it; (3) after a save and reload it opens again from Activity and the choice resolves in place;
       unaffordable choices are disabled with the reason; (4) an event that comes due while the player is idle waits
       quietly (no pop-up, a bell line); (5) time away rolls waiting events, at most three, counted on Welcome Back.
   Needs a preview server: IDLEWICK_URL=http://127.0.0.1:8765/ node tests/world-events-hindsight.cjs */
const assert = require('node:assert/strict');
const { chromium } = require('playwright');
const path = require('node:path');
const URL = process.env.IDLEWICK_URL || 'http://127.0.0.1:8765/';
const KEY = 'dashboard-quest-save-v2';
(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined }); const errors = [];
  const shot = async (p, name) => { if (process.env.SHOT_DIR) await p.screenshot({ path: path.join(process.env.SHOT_DIR, name) }); };
  try {
    const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
    p.on('pageerror', e => errors.push(e.message));
    await p.goto(URL);
    await p.locator('#t-new').click(); await p.locator('#crname').fill('Hindsight'); await p.locator('#cr-go').click();
    await p.waitForFunction(() => DQ.started && document.querySelector('#title').hidden);
    const closeAll = () => p.evaluate(() => { for (let i = 0; i < 12; i++) if (document.querySelector('.modal')) DQ.closeModal(); });
    await closeAll();
    await p.evaluate(() => { const S = DQ.S; S.settings.notify = true; S.settings.storyScenes = false; S.coins = 500; S.inv.shrimp = 0; DQ.startAct('fish', 'shrimp', { quiet: true }); DQ.go('overview'); });
    await p.waitForTimeout(300);

    /* (1) full-screen, focused, nothing scrolled, work carries on */
    assert.ok(await p.evaluate(() => DQ.worldFire('bard')), 'the event fires');
    await p.locator('.modal.event-fullscreen.world-moment').waitFor();
    const box = await p.evaluate(() => { const m = document.querySelector('.modal.event-fullscreen'), r = m.getBoundingClientRect(), c = m.querySelector('.m-card').getBoundingClientRect(); return { w: r.width, h: r.height, cw: c.width, ch: c.height, iw: innerWidth, ih: innerHeight }; });
    assert.ok(box.w >= box.iw - 1 && box.h >= box.ih - 1, 'the scene covers the whole window ' + JSON.stringify(box));
    assert.ok(box.ch >= box.ih * .85, 'and its card fills the height');
    assert.match(await p.locator('.world-moment #active-dialog-title').innerText(), /wandering bard/i);
    assert.match(await p.locator('.world-moment .ev-b > p').first().innerText(), /bard/i, 'the event text is shown');
    assert.ok(await p.locator('.world-moment .we-art').count() === 1, 'it has its own picture');
    assert.equal(await p.evaluate(() => document.activeElement && document.activeElement.matches('.world-moment .ev-opt:not([disabled])') && document.activeElement.dataset.b), 'pay', 'the first choice has focus');
    assert.equal(await p.evaluate(() => { const m = document.querySelector('.modal'); return [m, ...m.querySelectorAll('.m-card,.m-body')].every(el => el.scrollTop === 0); }), true, 'nothing scrolled');
    assert.ok(await p.locator('.world-moment .m-act button', { hasText: 'Decide later' }).count() === 1, 'a clear Decide later');
    const prog0 = await p.evaluate(() => [DQ.act && DQ.act.id, DQ.S.xp.fishing || 0, DQ.act ? DQ.act.progress || 0 : 0]);
    await p.waitForTimeout(2500);
    const prog1 = await p.evaluate(() => [DQ.act && DQ.act.id, DQ.S.xp.fishing || 0, DQ.act ? DQ.act.progress || 0 : 0]);
    assert.equal(prog1[0], 'shrimp', 'the task is still running');
    assert.ok(prog1[1] > prog0[1] || prog1[2] !== prog0[2], 'and it moved on while the scene was open ' + JSON.stringify([prog0, prog1]));
    await p.waitForTimeout(700); await shot(p, 'world-event-fullscreen.png');

    /* (2) Escape is Decide later: the event waits in the inbox, Activity lists it, Home counts it */
    await p.keyboard.press('Escape'); await p.waitForTimeout(200);
    assert.equal(await p.locator('.modal').count(), 0, 'Escape closes the scene ' + await p.evaluate(() => [...document.querySelectorAll('.modal')].map(m => m.className + ':' + (m.querySelector('h2') || {}).textContent).join('|')));
    const waiting = await p.evaluate(() => DQ.S.inbox.filter(e => e.type === 'world').map(e => ({ id: e.id, ev: e.ev })));
    assert.equal(waiting.length, 1, 'the event is waiting'); assert.equal(waiting[0].ev, 'bard');
    await p.evaluate(() => DQ.ui.render(true)); await p.waitForTimeout(200);
    assert.match(await p.locator('#view').innerText(), /1 decision waiting/i, 'Home counts it');
    /* a second event, closed with the button this time */
    await p.evaluate(() => { for (const id of DQ.foods()) { delete DQ.S.inv[id]; if (DQ.S.bank) delete DQ.S.bank[id]; } DQ.worldFire('traveller'); }); await p.locator('.world-moment').waitFor({ timeout: 5000 }).catch(async e => { throw new Error('no scene; modals: ' + await p.evaluate(() => [...document.querySelectorAll('.modal')].map(m => m.className + ':' + (m.querySelector('h2') || {}).textContent).join('|') + ' inbox ' + JSON.stringify(DQ.S.inbox.map(x => x.ev)))); });
    assert.equal(await p.locator('.world-moment .ev-opt[data-b="feed"]').isDisabled(), true, 'an unaffordable choice is disabled');
    assert.match(await p.locator('.world-moment .ev-opt[data-b="feed"]').innerText(), /Need 3 cooked food/, 'with the reason');
    await p.locator('.world-moment .m-act button', { hasText: 'Decide later' }).click(); await p.waitForTimeout(200);
    assert.equal(await p.evaluate(() => DQ.S.inbox.filter(e => e.type === 'world').length), 2);
    await p.evaluate(() => DQ.go('activity')); await p.waitForTimeout(300);
    assert.equal(await p.locator('.inboxp [data-do="openevent"]').count(), 2, 'Activity lists both');
    await shot(p, 'world-event-waiting.png');

    /* (3) save, reload, open from Activity and choose in hindsight */
    await p.evaluate(() => DQ.save());
    await p.reload(); await p.locator('#t-cont').click();
    await p.waitForFunction(() => DQ.started && document.querySelector('#title').hidden); await closeAll();
    assert.equal(await p.evaluate(() => DQ.S.inbox.filter(e => e.type === 'world').length), 2, 'both still waiting after reload');
    await p.evaluate(() => { DQ.go('activity'); DQ.ui.render(true); }); await p.waitForTimeout(300);
    const bardId = waiting[0].id;
    await p.locator(`.inboxp [data-do="openevent"][data-a="${bardId}"]`).click();
    await p.locator('.world-moment').waitFor();
    const coins = await p.evaluate(() => DQ.S.coins);
    await p.locator('.world-moment .ev-opt[data-b="pay"]').click(); await p.waitForTimeout(300);
    assert.equal(await p.locator('.world-moment .ev-result').count(), 1, 'the outcome replaces the choice in the same scene');
    assert.match(await p.locator('.world-moment .ev-result').innerText(), /tune/i);
    const after = await p.evaluate(() => ({ coins: DQ.S.coins, buffs: DQ.buffs().map(x => x.name), left: DQ.S.inbox.filter(e => e.type === 'world').map(e => e.ev), journal: DQ.S.journal.some(e => /wandering bard/i.test(e.text)) }));
    assert.ok(after.coins < coins && after.buffs.some(n => /bard/i.test(n)), 'paid and the song is playing ' + JSON.stringify(after));
    assert.deepEqual(after.left, ['traveller'], 'only the other event still waits'); assert.ok(after.journal, 'journal entry');
    const saved = await p.evaluate(k => JSON.parse(localStorage.getItem(k)).inbox.filter(e => e.type === 'world').map(e => e.ev), KEY);
    assert.deepEqual(saved, ['traveller'], 'the choice was saved with the inbox');
    await closeAll();

    /* (4) idle: an event that comes due waits quietly, no pop-up */
    await p.evaluate(() => { DQ.go('overview'); DQ.__idle = DQ.worldIdle; DQ.worldIdle = () => true; const W = DQ.worldState; W.next = W.played; DQ.worldTick(1000); DQ.worldIdle = DQ.__idle; });
    await p.waitForTimeout(200);
    assert.equal(await p.locator('.modal').count(), 0, 'no pop-up while idle');
    const idle = await p.evaluate(() => { const L = DQ.S.inbox.filter(e => e.type === 'world'); const e = L[L.length - 1]; return { n: L.length, how: e.how, bell: DQ.noteLog.some(x => x.o.key === 'world:' + e.id) }; });
    assert.equal(idle.n, 2, 'it joined the waiting list'); assert.equal(idle.how, 'idle'); assert.ok(idle.bell, 'with a bell line');

    /* (5) time away: up to three waiting world events, counted on Welcome Back */
    await p.evaluate(k => { const S = DQ.S; S.inbox = []; S.settings.storyScenes = false; DQ.save(); localStorage.setItem(k, JSON.stringify({ ...JSON.parse(localStorage.getItem(k)), lastSeen: Date.now() - 9 * 3600000 })); }, KEY);
    await p.reload(); await p.locator('#t-cont').click();
    await p.locator('.wb-digest').waitFor({ timeout: 60000 });
    const away = await p.evaluate(() => ({ world: DQ.S.inbox.filter(e => e.type === 'world').map(e => e.how), all: DQ.S.inbox.length }));
    assert.equal(away.world.length, 3, 'nine hours away leaves three waiting world events ' + JSON.stringify(away));
    assert.ok(away.world.every(h => h === 'away'), 'marked as from time away');
    assert.equal(await p.locator('.world-moment').count(), 0, 'time away never opens a scene by itself');
    assert.match(await p.locator('.wb-encounter-count').innerText(), new RegExp(`^${away.all} `), 'Welcome Back counts every waiting decision');
    await p.locator('.wb-encounter-count').click(); await p.waitForTimeout(400); await closeAll();
    await p.evaluate(() => DQ.go('activity')); await p.waitForTimeout(300);
    const first = await p.evaluate(() => DQ.S.inbox.find(e => e.type === 'world').id);
    await p.locator(`.inboxp [data-do="openevent"][data-a="${first}"]`).click(); await p.locator('.world-moment').waitFor();
    assert.match(await p.locator('.world-moment .we-when').innerText(), /While you were away/, 'the scene says it waited');
    await p.waitForTimeout(700); await shot(p, 'world-event-from-away.png');
    await closeAll();
    assert.deepEqual(errors, [], 'no page errors');
    console.log('PASS world events in hindsight: full-screen with work running, Decide later and Escape wait in the inbox, reload and choose later, disabled reasons, idle waits quietly, time away fills at most three');
  } finally { await b.close(); }
})().catch(e => { console.error(e); process.exit(1); });
