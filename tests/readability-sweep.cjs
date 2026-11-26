/* Part C Task 24: A floating combat text sits on a dark chip above the foe, never over its sprite, on a light and a dark
   arena; B the Now card and Welcome Back show "Fighting Mudling" and "Fishing shrimp" in full at 1440 × 900; C no skill
   name is cut off in the rail at 1440 × 900 or in the skill list at 390 × 844. */
const assert = require('node:assert/strict');
const { chromium } = require('playwright');
const path = require('node:path');
const cut = sel => [...document.querySelectorAll(sel)].filter(e => e.offsetWidth && (e.scrollWidth > e.clientWidth + 1 || e.scrollHeight > e.clientHeight + 1)).map(e => e.textContent.trim());
(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined }); const errors = [];
  const fresh = async (w, h) => { const p = await b.newPage({ viewport: { width: w, height: h } }); p.on('pageerror', e => errors.push(e.message));
    await p.goto(process.env.IDLEWICK_URL || 'http://127.0.0.1:8765/'); await p.locator('#t-new').click(); await p.locator('#cr-go').click();
    await p.waitForFunction(() => DQ.started && document.querySelector('#title').hidden);
    await p.evaluate(() => { for (let i = 0; i < 12; i++) DQ.closeModal(); DQ.S.tut.weaponFinished = true; DQ.S.tut.prepareCombat = false; DQ.give('bread', 50); }); return p; };
  try {
    const p = await fresh(1440, 900);
    /* B: Now card labels */
    const label = async () => p.evaluate(() => { const e = document.querySelector('#nowcard .now-go b'); return e ? { text: e.textContent, cut: e.scrollWidth > e.clientWidth + 1 || e.scrollHeight > e.clientHeight + 1 } : null; });
    await p.evaluate(() => { DQ.startAct('fight', 'mudling', { quiet: true }); DQ.go('combat'); DQ.ui.render(true); });
    const l1 = await label(); assert.equal(l1.text, 'Fighting Mudling'); assert.equal(l1.cut, false, 'Fighting Mudling in full');
    /* A: a loot float after a kill, measured against the foe sprite */
    for (const [town, area] of [['willowbrook', null], ['skyreach', null]]) {
      const geo = await p.evaluate(async t => { const Q = DQ; if (t !== 'willowbrook') { Q.S.towns[t] = { visited: true, boss: false }; Q.S.town = t; Q.stopAct(true);
          const m = Q.data.MONLIST.find(x => x.town === t && !x.boss && !x.mini && !x.hl && !x.tower); for (const sk of ['melee', 'defence', 'hitpoints']) for (let i = 0; i < 80; i++) Q.addXp(sk, 4000, { quiet: true }); Q.startAct('fight', m.id, { quiet: true }); Q.go('combat'); Q.ui.render(true); }
        await new Promise(r => setTimeout(r, 300));
        const foe = document.getElementById('av-foe'); Q.floatAt(foe, `${Q.ico('coin')}+12 coins · 2 bones`, '#f3d58a'); Q.floatAt(foe, `+4 XP`, '#9ad');
        await new Promise(r => setTimeout(r, 250));
        const fr = foe.getBoundingClientRect(), fl = [...document.querySelectorAll('#fx .fl')].map(e => { const r = e.getBoundingClientRect(), cs = getComputedStyle(e); return { r: [r.left, r.top, r.right, r.bottom], bg: cs.backgroundColor }; });
        const over = fl.some(f => f.r[0] < fr.right && f.r[2] > fr.left && f.r[1] < fr.bottom && f.r[3] > fr.top);
        return { town: t, floats: fl.length, over, bg: fl.map(f => f.bg) }; }, town);
      console.log('A', JSON.stringify(geo));
      assert.ok(geo.floats >= 2); assert.equal(geo.over, false, `${town}: no float over the foe sprite`); assert.ok(geo.bg.every(c => /rgba?\(22, 17, 12/.test(c)), 'dark chip');
      if (process.env.SHOT_DIR) await p.screenshot({ path: path.join(process.env.SHOT_DIR, `float-${town}.png`) });
    }
    await p.evaluate(() => { DQ.S.town = 'willowbrook'; DQ.stopAct(true); DQ.startAct('fish', 'shrimp', { quiet: true }); DQ.go('overview'); DQ.ui.render(true); });
    const l2 = await label(); assert.equal(l2.text, 'Fishing shrimp'); assert.equal(l2.cut, false, 'Fishing shrimp in full');
    /* Welcome Back with a fishing summary */
    const wb = await p.evaluate(() => { const sum = DQ.simulate(20 * 60e3, 20 * 60e3, { report: true }); DQ.makeAwayEvents(sum, 20 * 60e3); DQ.emit('welcome', sum, 20 * 60e3); return true; });
    await p.waitForTimeout(500);
    const wbCut = await p.evaluate(`(${cut})('.modal :is(h2,h3,b,span,small,p,.wb-status)')`);
    console.log('B welcome cut', JSON.stringify(wbCut));
    assert.ok(!wbCut.some(t => /Fishing shri/.test(t) && !/Fishing shrimp/.test(t)), 'Welcome Back label in full');
    assert.deepEqual(wbCut.filter(t => /Fishing/.test(t)), [], 'no fishing label cut on Welcome Back');
    if (process.env.SHOT_DIR) await p.screenshot({ path: path.join(process.env.SHOT_DIR, 'welcome-fishing-label.png') });
    await p.evaluate(() => { for (let i = 0; i < 5; i++) DQ.closeModal(); });
    /* C: rail names at 1440 */
    const rail = await p.evaluate(() => [...document.querySelectorAll('#skilldock .dk')].map(d => { const n = d.querySelector('.dk-n, .nm, b, span'); const all = [...d.querySelectorAll('*')].filter(e => e.children.length === 0 && e.textContent.trim() && e.offsetWidth);
      return { id: d.dataset.a, cut: all.filter(e => e.scrollWidth > e.clientWidth + 1).map(e => e.textContent.trim()), text: d.innerText.replace(/\s+/g, ' ').trim() }; }));
    console.log('C 1440 checked', rail.map(r => r.id).join(', '));
    assert.ok(rail.length >= 16); assert.deepEqual(rail.filter(r => r.cut.length), [], 'no rail name cut at 1440');
    const over1440 = await p.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth); assert.ok(over1440 <= 0);
    /* C at 390: the skill list a phone shows */
    const q = await fresh(390, 844);
    await q.evaluate(() => { DQ.go('skillsummary'); DQ.ui.render(true); });
    const phone = await q.evaluate(() => [...document.querySelectorAll('#view *')].filter(e => e.children.length === 0 && e.offsetWidth && DQ.data.SKILLS.some(s => e.textContent.trim().startsWith(s.name.slice(0, 5))) && e.scrollWidth > e.clientWidth + 1).map(e => e.textContent.trim()));
    console.log('C 390 cut', JSON.stringify(phone));
    assert.deepEqual(phone, [], 'no skill name cut at 390');
    const over390 = await q.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth); assert.ok(over390 <= 0, 'no overflow at 390');
    assert.deepEqual(errors, []);
    console.log('readability-sweep: ok');
  } finally { await b.close(); }
})().catch(e => { console.error(e); process.exit(1); });
