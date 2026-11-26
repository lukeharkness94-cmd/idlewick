/* Part C Task 26: no "next:" / milestone preview renders a placeholder ("Something new", "N new things") or an empty
   value. A preview names a real perk or leaves the clause out; locked content stays unnamed (???, blacked-out art).
   Pages checked: Home, Activity, Welcome Back (fishing returner near a level), Skill levels, every skill page and the
   rail's hover details. Granted fixture: Fishing raised to 29 and most of the way to 30. */
const assert = require('node:assert/strict');
const { chromium } = require('playwright');
const BAD = /Something new|\d+ new things|next:\s*[.;·]|next:\s*$|Next at level \d+:\s*\./i;
(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined }); const errors = [];
  try {
    const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
    p.on('pageerror', e => errors.push(e.message));
    await p.goto(process.env.IDLEWICK_URL || 'http://127.0.0.1:8765/');
    await p.locator('#t-new').click(); await p.locator('#cr-go').click();
    await p.waitForFunction(() => DQ.started && document.querySelector('#title').hidden);
    const info = await p.evaluate(() => { const Q = DQ; for (let i = 0; i < 12; i++) Q.closeModal(); Q.paused = true;
      while (Q.lvl('fishing') < 29) Q.addXp('fishing', 500, { quiet: true });
      const need = () => Q.xpFor ? 0 : 0; let n = 0; while (Q.pctNext('fishing') < 78 && n++ < 2000) Q.addXp('fishing', 20, { quiet: true });
      return { lvl: Q.lvl('fishing'), pct: Math.round(Q.pctNext('fishing')), unl30: Q.data.UNL.fishing[30] || null, short: Q.ui.unlockShort(Q.ui.nextUnlock('fishing')) }; });
    console.log('Fishing', JSON.stringify(info));
    const found = [];
    const scan = async where => { const t = await p.evaluate(() => [document.querySelector('#view')?.innerText || '', document.querySelector('.modal')?.innerText || '', [...document.querySelectorAll('[data-tip],[title]')].map(e => (e.dataset.tip || '') + ' ' + (e.title || '')).join('\n')].join('\n'));
      for (const line of t.split('\n')) if (BAD.test(line)) found.push(`${where}: ${line.trim().slice(0, 120)}`); };
    for (const page of ['overview', 'activity', 'skillsummary']) { await p.evaluate(v => { DQ.go(v); DQ.ui.render(true); }, page); await p.waitForTimeout(250); await scan(page); }
    const pages = await p.evaluate(() => [...new Set(DQ.data.SKILLS.filter(s => DQ.skillUnlocked(s.id)).map(s => s.page))]);
    for (const page of pages) { await p.evaluate(v => { DQ.go(v); DQ.ui.render(true); }, page); await p.waitForTimeout(150); await scan(page); }
    /* rail hover details */
    const rail = await p.evaluate(() => [...document.querySelectorAll('#skilldock .dk')].map(d => d.dataset.a));
    for (const sk of rail) { const tip = await p.evaluate(s => { const d = document.querySelector(`#skilldock .dk[data-a="${s}"]`); d.dispatchEvent(new MouseEvent('mouseover', { bubbles: true })); return document.querySelector('#tip')?.innerText || ''; }, sk);
      for (const line of tip.split('\n')) if (BAD.test(line)) found.push(`rail ${sk}: ${line.trim()}`); }
    /* Welcome Back: the "is close" row for Fishing */
    const close = await p.evaluate(() => { const Q = DQ; Q.startAct('fish', 'shrimp', { quiet: true }); const c = (Q.returnChoices() || []).find(x => /Fishing \d+ is close/.test(x.title)); const sum = Q.simulate(30 * 60e3, 30 * 60e3, { report: true }); Q.emit('welcome', sum, 30 * 60e3); return c ? c.title + ' · ' + c.text : null; });
    await p.waitForTimeout(400); await scan('welcome');
    console.log('Fishing row:', close);
    if (close) { assert.ok(!BAD.test(close), close); if (!info.short) assert.ok(!/next:/.test(close), 'no next clause when nothing can be named'); else assert.ok(close.includes(info.short)); }
    assert.deepEqual(found, [], 'no placeholder previews');
    assert.deepEqual(errors, []);
    console.log('next-preview: ok');
  } finally { await b.close(); }
})().catch(e => { console.error(e); process.exit(1); });
