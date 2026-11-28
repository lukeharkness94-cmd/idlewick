/* node tests/ui-feel.cjs: the small things that make the game feel made with care (owner, 27 Nov 2026: "Let's do all
   15"; js/ui_feel.js, js/pixel_feel.js, UI.emptyState in js/ui_core.js). Needs the preview server.
   1  a control sinks a pixel while held (translate, softer shadow) and lets go on a drag; Enter presses too; nothing
      moves under Reduce effects
   2  work that yields items flies a copy to the backpack: one flight per 0.6 s at most (a burst merges), none in an
      offline simulation or a forecast, none under Reduce effects
   3  work XP drifts into its skill's rail row, whose bar waits for it and then fills to the real value
   4  the quill pointer is on for a mouse, off for touch and when the Settings switch is off
   14 empty pages show a pixel picture and a one-liner (bank, backpack, quests, achievements, journal, activity)
   15 a big spend needs a 0.6 s hold that fills the button; a click or an early release spends nothing; a held Enter
      confirms; small buys stay one click; screen readers get the hint */
const assert = require('node:assert/strict');
const { chromium } = require('playwright');
const URL = process.env.IDLEWICK_URL || 'http://127.0.0.1:8765/';

const fresh = async (b, opts = {}) => {
  const ctx = await b.newContext({ viewport: { width: 1440, height: 900 }, ...opts });
  const p = await ctx.newPage(); const errors = []; p.on('pageerror', e => errors.push(e.message));
  await p.goto(URL); await p.locator('#t-new').click(); await p.locator('#cr-go').click();
  await p.waitForFunction(() => DQ.started && document.querySelector('#title').hidden);
  await p.evaluate(() => { for (let i = 0; i < 12; i++) DQ.closeModal(); DQ.S.settings.storyScenes = false; });
  return { p, ctx, errors };
};

(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });
  try {
    const { p, errors } = await fresh(b);

    /* ---------- 1. press ---------- */
    await p.evaluate(() => { DQ.paused = true; DQ.go('overview'); DQ.ui.render(true); });
    const nav = p.locator('#topnav .tnav').nth(1), nb = await nav.boundingBox();
    await p.mouse.move(nb.x + nb.width / 2, nb.y + nb.height / 2); await p.mouse.down(); await p.waitForTimeout(120);
    const held = await nav.evaluate(e => ({ cls: e.classList.contains('lw-press'), tr: getComputedStyle(e).translate }));
    assert.ok(held.cls, 'a held control is marked pressed'); assert.equal(held.tr, '0px 1px', 'it sinks one pixel');
    await p.mouse.move(nb.x + nb.width / 2 + 40, nb.y + nb.height / 2 + 40); await p.waitForTimeout(30);
    assert.equal(await nav.evaluate(e => e.classList.contains('lw-press')), false, 'a drag lets go');
    await p.mouse.up();
    await p.evaluate(() => { DQ.go('overview'); DQ.ui.render(true); });
    await p.locator('#topnav .tnav').nth(1).focus(); await p.keyboard.down('Enter');
    assert.ok(await p.evaluate(() => !!document.querySelector('.lw-press')), 'Enter presses the focused control');
    await p.keyboard.up('Enter');
    await p.evaluate(() => { DQ.S.settings.reduceFx = true; document.documentElement.classList.add('calm'); DQ.go('overview'); DQ.ui.render(true); });
    const calmNav = p.locator('#topnav .tnav').nth(2), cb = await calmNav.boundingBox();
    await p.mouse.move(cb.x + cb.width / 2, cb.y + cb.height / 2); await p.mouse.down(); await p.waitForTimeout(80);
    assert.equal(await calmNav.evaluate(e => getComputedStyle(e).translate), 'none', 'nothing moves under Reduce effects');
    await p.mouse.up();
    await p.evaluate(() => { DQ.S.settings.reduceFx = false; document.documentElement.classList.remove('calm'); });

    /* ---------- 2 and 3. flights and XP flow ---------- */
    await p.evaluate(() => { DQ.paused = false; window.__fly = []; new MutationObserver(m => { for (const r of m) for (const n of r.addedNodes) if (n.nodeType === 1 && (n.classList.contains('gain-fly') || n.classList.contains('xp-flow'))) window.__fly.push(n.className); }).observe(document.body, { childList: true, subtree: true });
      DQ.go('fishing'); DQ.startAct('fish', 'shrimp'); DQ.ui.render(true); });
    await p.waitForFunction(() => DQ.feel.flights > 0 && DQ.feel.flows > 0, null, { timeout: 15000 });
    const seen = await p.evaluate(() => window.__fly.slice());
    assert.ok(seen.includes('gain-fly'), 'a caught shrimp flies to the backpack');
    assert.ok(seen.some(c => c.includes('xp-flow')), 'its XP drifts to the rail');
    /* the rail bar waits for the XP to arrive, then shows the real value */
    const bar = await p.evaluate(() => new Promise(res => { const n0 = DQ.feel.flows; const t = setInterval(() => { if (DQ.feel.flows > n0) { clearInterval(t); const e = document.querySelector('#skilldock [data-b="xpbar:fishing"]'); const w0 = e.style.width; DQ.ui.upd(); const w1 = e.style.width; DQ.paused = true; /* no more catches while we watch this one land */
        const t1 = performance.now(), wait = setInterval(() => { if (!document.querySelector('.xp-flow') || performance.now() - t1 > 5000) { clearInterval(wait); setTimeout(() => { DQ.ui.upd(); res({ w0, w1, after: e.style.width, real: DQ.pctNext('fishing').toFixed(1) + '%' }); }, 100); } }, 50); } }, 20); }));
    await p.evaluate(() => { DQ.paused = false; });
    assert.equal(bar.w0, bar.w1, 'the rail bar holds while the XP is in the air: ' + JSON.stringify(bar));
    assert.equal(bar.after, bar.real, 'and fills to the real value when it lands');
    /* bursts merge: three gains at once launch at most one flight now */
    const burst = await p.evaluate(async () => { await new Promise(r => setTimeout(r, 700)); const f0 = DQ.feel.flights; DQ.flyToPack(DQ.data.NODE['fish:shrimp'].item, 1); DQ.flyToPack(DQ.data.NODE['fish:shrimp'].item, 1); DQ.flyToPack(DQ.data.NODE['fish:shrimp'].item, 1); const now = DQ.feel.flights - f0; await new Promise(r => setTimeout(r, 700)); return { now, later: DQ.feel.flights - f0 }; });
    assert.ok(burst.now <= 1 && burst.later <= 2, 'one flight per 0.6 s at most: ' + JSON.stringify(burst));
    /* never in simulations or forecasts */
    const sim = await p.evaluate(() => { const f0 = DQ.feel.flights, x0 = DQ.feel.flows, live = document.querySelectorAll('.gain-fly,.xp-flow').length; DQ.simulate(20 * 60e3, 20 * 60e3); const fc = DQ.forecastActivity ? DQ.forecastActivity : null; return { flights: DQ.feel.flights - f0, flows: DQ.feel.flows - x0, extra: document.querySelectorAll('.gain-fly,.xp-flow').length - live }; });
    assert.deepEqual({ f: sim.flights, x: sim.flows }, { f: 0, x: 0 }, 'an offline simulation flies nothing: ' + JSON.stringify(sim));
    const fore = await p.evaluate(() => { const f0 = DQ.feel.flights, x0 = DQ.feel.flows; DQ.forecasting = true; try { DQ.grant(DQ.data.NODE['fish:shrimp'].item, 1); DQ.emit('workcycle', { kind: 'fish', id: 'shrimp', quantity: 1 }); DQ.flowXp('fishing', 5); } finally { DQ.forecasting = false; } return DQ.feel.flights - f0 + DQ.feel.flows - x0; });
    assert.equal(fore, 0, 'a forecast flies nothing');
    const calmFly = await p.evaluate(async () => { DQ.S.settings.reduceFx = true; document.documentElement.classList.add('calm'); await new Promise(r => setTimeout(r, 700)); const f0 = DQ.feel.flights, x0 = DQ.feel.flows; DQ.flyToPack(DQ.data.NODE['fish:shrimp'].item, 2); const flowed = DQ.flowXp('fishing', 5); DQ.S.settings.reduceFx = false; document.documentElement.classList.remove('calm'); return { f: DQ.feel.flights - f0, x: DQ.feel.flows - x0, flowed }; });
    assert.deepEqual(calmFly, { f: 0, x: 0, flowed: false }, 'Reduce effects: no flights and the XP float stays where it was');
    await p.evaluate(() => DQ.stopAct(true));

    /* ---------- 4. the quill pointer ---------- */
    await p.evaluate(() => { DQ.paused = true; DQ.go('overview'); DQ.ui.render(true); });
    const cur = await p.evaluate(() => ({ on: document.documentElement.classList.contains('lw-cursor'), body: getComputedStyle(document.body).cursor, btn: getComputedStyle(document.querySelector('#topnav .tnav')).cursor }));
    assert.ok(cur.on, 'a mouse gets the quill pointer');
    assert.match(cur.body, /^(image-set|url)\(.*auto$/, 'the quill, falling back to the normal pointer');
    assert.match(cur.btn, /^(image-set|url)\(.* pointer$/, 'the hand over controls, falling back to the normal hand');
    await p.evaluate(() => { DQ.go('settings'); DQ.ui.render(true); });
    assert.equal(await p.locator('[data-do="quillcursor"]').count(), 1, 'Settings > Display has the switch');
    await p.locator('[data-do="quillcursor"]').click();
    assert.deepEqual(await p.evaluate(() => [document.documentElement.classList.contains('lw-cursor'), DQ.S.settings.quillCursor, getComputedStyle(document.body).cursor]), [false, false, 'auto'], 'switched off: the normal pointer');
    await p.locator('[data-do="quillcursor"]').click();
    assert.ok(await p.evaluate(() => document.documentElement.classList.contains('lw-cursor')), 'and back on');
    {
      const t = await fresh(b, { hasTouch: true, isMobile: true, viewport: { width: 390, height: 844 } });
      assert.equal(await t.p.evaluate(() => document.documentElement.classList.contains('lw-cursor')), false, 'touch screens keep their own pointer');
      assert.deepEqual(t.errors, []); await t.ctx.close();
    }

    /* ---------- 14. empty pages ---------- */
    const empty = await p.evaluate(() => {
      const look = () => { const e = document.querySelector('#view .empty-state, #view .journal-empty'); return e ? { art: !!e.querySelector('img.empty-art'), line: (e.querySelector('.es-line') || {}).textContent || '' } : null; };
      const out = {};
      for (const k of Object.keys(DQ.S.bank)) delete DQ.S.bank[k];
      DQ.go('bank'); DQ.ui.render(true); out.bank = look();
      for (const k of Object.keys(DQ.S.inv)) if (!DQ.isTool(k)) delete DQ.S.inv[k];
      DQ.go('character'); DQ.ui.render(true); out.pack = look();
      DQ.go('quests'); DQ.ui.DO.qtab('done'); out.quests = look();
      DQ.ui.DO.qtab('current'); out.questsText = document.querySelector('#view').textContent.includes('undefined');
      const ach = DQ.S.ach; DQ.S.ach = {}; DQ.go('achievements'); DQ.ui.DO.achfilter('done'); out.ach = look(); DQ.S.ach = ach;
      DQ.S.journal = []; const jb = DQ.journalBackfill; DQ.journalBackfill = () => {}; DQ.go('journal'); DQ.ui.render(true); out.journal = look(); DQ.journalBackfill = jb;
      DQ.S.inbox = []; DQ.go('activity'); DQ.ui.render(true); out.activity = look();
      return out;
    });
    for (const k of ['bank', 'pack', 'quests', 'ach', 'journal', 'activity']) { assert.ok(empty[k] && empty[k].art, `${k}: a pixel picture`); assert.ok(empty[k].line.length > 12, `${k}: a one-liner`); }
    assert.equal(empty.bank.line, 'Even the spiders moved out.');
    assert.equal(empty.questsText, false, 'no "undefined" on an empty quest tab');
    const art = await p.evaluate(() => DQ.EMPTY_ART.map(k => { const d = document.createElement('div'); d.innerHTML = DQ.emptyArt(k, 72); const i = d.querySelector('img'); return [k, +i.width, +i.height]; }));
    for (const [k, w, h] of art) assert.ok(w === 72 && h === 72, `${k} is drawn at a whole-number scale (3 x 24)`);

    /* ---------- 15. hold to confirm ---------- */
    await p.evaluate(() => { DQ.S.coins = 30000; DQ.go('shop'); DQ.ui.DO.shopcategory('supplies'); DQ.ui.render(true); });
    const marks = await p.evaluate(() => ({ big: [...document.querySelectorAll('#view [data-do="buy"][data-hold="1"]')].map(b => b.dataset.b), small: [...document.querySelectorAll('#view [data-do="buy"]:not([data-hold])')].map(b => b.dataset.b), hint: document.getElementById('lw-hold-hint')?.textContent || '', described: [...document.querySelectorAll('[data-hold="1"]')].every(b => (b.getAttribute('aria-describedby') || '').includes('lw-hold-hint')) }));
    assert.ok(marks.big.length > 0, 'a Max buy worth 30,000 coins needs a hold');
    assert.ok(marks.small.includes('1'), 'a single buy stays one click');
    assert.ok(marks.described && /hold/.test(marks.hint), 'screen readers get the hold hint');
    const sel = '#view [data-hold="1"][data-do="buy"]', coins = () => p.evaluate(() => DQ.S.coins);
    const c0 = await coins(); await p.locator(sel).first().click(); await p.waitForTimeout(150);
    assert.equal(await coins(), c0, 'a click on a big spend spends nothing');
    assert.match(await p.evaluate(() => document.querySelector('.toast')?.textContent || ''), /hold/i, 'and says to hold');
    const hb = await p.locator(sel).first().boundingBox();
    await p.mouse.move(hb.x + hb.width / 2, hb.y + hb.height / 2); await p.mouse.down(); await p.waitForTimeout(200);
    const filling = await p.locator(sel).first().evaluate(e => ({ holding: e.classList.contains('holding'), scale: getComputedStyle(e, '::before').scale }));
    assert.ok(filling.holding && filling.scale !== '0 1', 'the button fills while held: ' + JSON.stringify(filling));
    await p.mouse.up(); await p.waitForTimeout(150);
    assert.equal(await coins(), c0, 'letting go early cancels');
    /* keyboard: Enter held confirms; a single buy below the threshold stays instant */
    await p.locator(sel).first().focus(); await p.keyboard.down('Enter'); await p.waitForTimeout(800); await p.keyboard.up('Enter'); await p.waitForTimeout(150);
    const c1 = await coins(); assert.ok(c1 < c0, 'holding Enter confirms the big spend');
    await p.evaluate(() => { DQ.S.coins = 30000; DQ.ui.render(true); });
    const hb2 = await p.locator(sel).first().boundingBox();
    await p.mouse.move(hb2.x + hb2.width / 2, hb2.y + hb2.height / 2); await p.mouse.down(); await p.waitForTimeout(750); await p.mouse.up(); await p.waitForTimeout(150);
    assert.ok(await coins() < 30000, 'holding the pointer for 0.6 s confirms');
    await p.evaluate(() => { DQ.S.coins = 30000; DQ.ui.render(true); });
    const one = p.locator('#view [data-do="buy"][data-b="1"]:not([data-hold])').first(); const c2 = await coins(); await one.click(); await p.waitForTimeout(150);
    assert.ok(await coins() < c2, 'a small buy is one click');
    assert.equal(await p.evaluate(() => [(DQ.S.coins = 1e6, DQ.bigSpend(9999)), DQ.bigSpend(10000), (DQ.S.coins = 3000, DQ.bigSpend(800)), DQ.bigSpend(1000)].join()), 'false,true,false,true', 'thresholds: 10,000 coins, or 1,000 that is a quarter of your coins');

    assert.deepEqual(errors, []);
    console.log('PASS ui feel: press, flights, XP flow, quill pointer, empty pages, hold to confirm');
  } finally { await b.close(); }
})().catch(e => { console.error(e); process.exit(1); });
