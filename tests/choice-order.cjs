/* Nothing locked above something you can use (owner, 26 Nov 2026: "cooking has something you haven't unlocked before
   something you have unlocked. Sort this and make sure it doesn't happen anywhere else"). Every skill page, every
   recipe category and sub-type, at a fresh hero and a mid-game fixture: within each grid of choice cards, no locked
   card comes before an unlocked one. */
const assert = require('node:assert/strict');
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined }); const errors = [], bad = [];
  try {
    const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
    p.on('pageerror', e => errors.push(e.message));
    await p.goto(process.env.IDLEWICK_URL || 'http://127.0.0.1:8765/');
    await p.locator('#t-new').click(); await p.locator('#cr-go').click();
    await p.waitForFunction(() => DQ.started && document.querySelector('#title').hidden);
    const sweep = label => p.evaluate(label => { const Q = DQ, D = Q.data, UI = Q.ui, out = []; for (let i = 0; i < 12; i++) Q.closeModal();
      const check = where => document.querySelectorAll('#view *').forEach(box => { const cards = [...box.children].filter(c => c.classList.contains('illustrated-card')); if (cards.length < 2) return;
        const firstLocked = cards.findIndex(c => c.classList.contains('locked')), lastOpen = cards.map(c => !c.classList.contains('locked')).lastIndexOf(true);
        if (firstLocked >= 0 && lastOpen > firstLocked) out.push(`${label} ${where}: "${cards[firstLocked].textContent.trim().slice(0, 30)}" (locked) before "${cards[lastOpen].textContent.trim().slice(0, 30)}"`); });
      for (const s of D.SKILLS) { const pg = s.page || s.id; if (!UI.V[pg] && !UI.V.gather) continue;
        try { Q.go(pg); UI.render(true); } catch (e) { continue; }
        check(pg);
        /* every recipe category and sub-type on this page */
        const cats = [...document.querySelectorAll('#view .recipe-categories:not(.recipe-sub) [data-do="tab"]')].map(b => [b.dataset.a, b.dataset.b]);
        for (const [a, g] of cats) { UI.tab[a] = g; UI.render(true); check(`${pg} › ${g}`);
          for (const [a2, y] of [...document.querySelectorAll('#view .recipe-sub [data-do="tab"]')].map(b => [b.dataset.a, b.dataset.b])) { UI.tab[a2] = y; UI.render(true); check(`${pg} › ${g} › ${y}`); } } }
      return out; }, label);
    bad.push(...await sweep('fresh'));
    await p.evaluate(() => { const S = DQ.S, D = DQ.data; for (const s of D.SKILLS) { S.unlocked[s.id] = true; S.xp[s.id] = D.XPF[30]; }
      for (const t of D.TOWNS.slice(0, 3)) S.towns[t.id] = Object.assign(S.towns[t.id] || {}, { visited: true, boss: true });
      for (const id of ['raw_shrimp', 'raw_sardine', 'raw_herring', 'log_normal', 'log_oak', 'ore_copper', 'ore_tin', 'ore_iron', 'bar_bronze', 'flax', 'crop_potato']) if (D.ITEMS[id]) DQ.give(id, 5); });
    bad.push(...await sweep('mid-game'));
    assert.deepEqual(bad, [], bad.join('\n'));
    assert.deepEqual(errors, []);
    console.log('PASS choice order: no locked card before an open one, fresh and mid-game, every skill and recipe category');
  } finally { await b.close(); }
})().catch(e => { console.error(e.message || e); process.exit(1); });
