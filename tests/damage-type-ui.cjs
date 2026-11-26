/* Combat shows the damage type you deal (owner, 26 Nov: "it states that the creatures are weak to Slash, but where is
   this?"): a "You deal" chip on the foe card (green when it is weak to you, red when it resists), a tick on the matching
   weakness, the type at the start of the DPS line, and a tooltip on every type naming what deals it. Fresh hero, sword. */
const assert = require('node:assert/strict');
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined }); const errors = [];
  try {
    const p = await b.newPage({ viewport: { width: 1440, height: 900 } }); p.on('pageerror', e => errors.push(e.message));
    await p.goto(process.env.IDLEWICK_URL || 'http://127.0.0.1:8765/'); await p.locator('#t-new').click(); await p.locator('#cr-go').click();
    await p.waitForFunction(() => DQ.started && document.querySelector('#title').hidden);
    const r = await p.evaluate(() => { const Q = DQ; for (let i = 0; i < 12; i++) Q.closeModal(); Q.S.tut.weaponFinished = true; Q.S.tut.prepareCombat = false; Q.give('bread', 20);
      Q.startAct('fight', 'mudling', { quiet: true }); Q.go('combat'); Q.ui.render(true);
      const you = document.querySelector('.cw-you'), weak = [...document.querySelectorAll('.cw-chip .cw-dt')].filter(e => !e.closest('.cw-you'));
      return { mine: Q.myDtype(), you: you && you.innerText.replace(/\s+/g, ' '), good: you && you.classList.contains('good'), tip: you && you.dataset.tip,
        ticked: weak.filter(e => e.classList.contains('mine')).map(e => e.innerText), tips: weak.map(e => e.dataset.tip), dps: document.querySelector('[data-b="dps"]').innerText,
        weakOf: Q.weakOf(Q.data.MON.mudling).weak }; });
    console.log(JSON.stringify(r));
    assert.equal(r.mine, 'slash'); assert.match(r.you, /You deal Slash/); assert.match(r.dps, /^Slash · /);
    assert.equal(r.good, r.weakOf.includes('slash'), 'green exactly when the foe is weak to it');
    if (r.weakOf.includes('slash')) assert.deepEqual(r.ticked, ['✓ Slash']);
    assert.ok(r.tips.every(t => /^text:\w+: .+/.test(t)), 'every type says what deals it'); assert.match(r.tip, /Slash: Swords/);
    assert.deepEqual(errors, []);
    console.log('damage-type-ui: ok');
  } finally { await b.close(); }
})().catch(e => { console.error(e); process.exit(1); });
