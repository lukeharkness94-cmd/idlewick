/* Regression checks for the 27 Nov 2026 visual audit (docs/visual-audit-2026-11-27.md): the fixed bugs stay fixed.
   1 no townsfolk standing in activity scenes, even once a town is restored
   2 the backpack's "a restoration needs this" badge is a corner mark, not a slot-sized house over the item
   3 every skill has a real icon (no placeholder dot for Hunting, Exploration, Herbalism...)
   4 buying a tool keeps every tier on the shelf, the bought one marked Owned and still selected
   5 Combat at 1280x720: every doll slot can be clicked
   6 trial tower floors are fighting creatures, never hunting-ground animals
   7 level-up text never reads "+-N%" */
const assert = require('node:assert/strict');
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined }); const errors = [];
  try {
    const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
    p.on('pageerror', e => errors.push(e.message));
    await p.goto(process.env.IDLEWICK_URL || 'http://127.0.0.1:8765/');
    await p.locator('#t-new').click(); await p.locator('#cr-go').click();
    await p.waitForFunction(() => DQ.started && document.querySelector('#title').hidden);
    await p.evaluate(() => { const S = DQ.S, D = DQ.data; DQ.paused = true; for (let i = 0; i < 12; i++) DQ.closeModal(); S.settings.notify = false; S.settings.storyScenes = false; S.tut.prepareCombat = false;
      for (const s of D.SKILLS) { S.unlocked[s.id] = true; S.xp[s.id] = D.XPF[30]; }
      for (const t of ['willowbrook', 'mossbarrow']) S.towns[t] = Object.assign(S.towns[t] || {}, { visited: true, boss: true });
      for (const [k, v] of Object.entries(D.PROJECTS)) if (v.town === 'willowbrook' && !v.relic) S.projects[k] = true;
      S.coins = 50000; for (const id of ['ore_copper', 'ore_tin', 'log_normal', 'bar_bronze', 'raw_herring']) DQ.give(id, 25); });
    /* 1 */
    for (const [page, kind, id] of [['mining', 'mine', 'copper'], ['woodcutting', 'wood', 'normal'], ['smithing', null, null]]) {
      const n = await p.evaluate(([page, kind, id]) => { DQ.go(page); if (kind) DQ.startAct(kind, id, { quiet: true }); DQ.ui.render(true); const c = document.querySelectorAll('.activity-scene .scene-folk').length; DQ.stopAct(true); return c; }, [page, kind, id]);
      assert.equal(n, 0, 'no bystanders in the ' + page + ' scene');
    }
    /* 2 */
    const badge = await p.evaluate(() => { DQ.go('character'); DQ.ui.render(true); const ic = document.querySelector('.slot .bundle-indicator .ic'); return ic ? Math.round(ic.getBoundingClientRect().width / (DQ.zoom || 1)) : null; });
    if (badge !== null) assert.ok(badge <= 20, 'restoration badge is a corner mark: ' + badge + 'px');
    /* 3 */
    const dots = await p.evaluate(() => DQ.data.SKILLS.filter(s => /pxi-bit/.test(DQ.ico(s.id))).map(s => s.id));
    assert.deepEqual(dots, [], 'every skill has its own icon');
    /* 4 */
    const shelf = await p.evaluate(() => { const D = DQ.data; DQ.S.settings.availOnly = { ...DQ.S.settings.availOnly, 'tool:axe': false }; DQ.ui.shopTab = 'buy'; DQ.ui.shopCategory = 'tools'; DQ.ui.shopToolFamily = 'axe'; DQ.go('shop'); DQ.ui.render(true);
      const id = Object.keys(D.ITEMS).find(k => /^tool_axe_/.test(k) && DQ.shopUpgradeState(k) && DQ.shopUpgradeState(k).ready && !DQ.toolUpgradeOwned(k)); const before = document.querySelectorAll('[data-tool]').length;
      DQ.ui.DO.shopselect(id); DQ.ui.DO.buyupgrade(id); DQ.ui.render(true); const card = document.querySelector(`[data-tool="${id}"]`);
      return { id, before, after: document.querySelectorAll('[data-tool]').length, owned: card && /Owned/.test(card.innerText), selected: DQ.ui.shopSelected.buy === id }; });
    assert.equal(shelf.after, shelf.before, 'every tier stays on the shelf: ' + JSON.stringify(shelf)); assert.ok(shelf.owned && shelf.selected, 'the bought tier reads Owned and stays selected: ' + JSON.stringify(shelf));
    /* 5 */
    await p.setViewportSize({ width: 1280, height: 720 });
    const slots = await p.evaluate(async () => { DQ.go('combat'); DQ.ui.render(true); await new Promise(r => setTimeout(r, 300)); return [...document.querySelectorAll('.combat-equipped .eq')].map(e => { const r = e.getBoundingClientRect(), t = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2); return !!t && (t === e || e.contains(t)); }); });
    assert.ok(slots.length >= 7 && slots.every(Boolean), 'every doll slot can be clicked at 1280x720: ' + slots);
    /* 6 */
    const animals = await p.evaluate(() => Object.values(DQ.data.TOWERS).flatMap(T => T.floors).map(f => DQ.data.MON[f.id || f]).filter(m => m && m.base && DQ.isAnimal && DQ.isAnimal(m.base)).map(m => m.name));
    assert.deepEqual(animals, [], 'tower floors are fighting creatures');
    /* 7 */
    const text = await p.evaluate(() => { DQ.S = DQ.newState('Fresh'); DQ.S.settings.notify = false; DQ.noteLog.length = 0; DQ.S.xp.fishing = DQ.data.XPF[2] - 1; DQ.addXp('fishing', 50); return JSON.stringify(DQ.noteLog.slice(-5)); });
    assert.ok(!/\+-\d/.test(text), 'no "+-N%" in level-up text: ' + text.slice(0, 200));
    /* 8 after a kill, the next creature of the same kind is visible (the death fade hid the shared sprite, 27 Nov 2026) */
    await p.setViewportSize({ width: 1440, height: 900 });
    await p.evaluate(() => { const S = DQ.S, D = DQ.data; for (const k of Object.keys(S.xp)) S.xp[k] = D.XPF[99]; S.settings.reduceFx = false; S.equip = {}; for (const g of ['rune_sword', 'rune_helm', 'rune_body', 'rune_legs']) { DQ.give(g, 1); DQ.equipItem(g); } DQ.fxDirty(); S.hp = DQ.maxHp(); S.town = 'willowbrook'; DQ.paused = false; DQ.go('combat'); DQ.startAct('fight', 'goblin', { quiet: true }); DQ.ui.render(true); window.__k0 = S.stats.kill; });
    await p.waitForFunction(() => DQ.S.stats.kill >= window.__k0 + 2, null, { timeout: 30000 });
    await p.waitForTimeout(1500);
    const foe = await p.evaluate(() => { const img = document.querySelector('#av-foe img'); const cs = img && getComputedStyle(img); return img ? { vis: cs.visibility, op: +cs.opacity, id: document.querySelector('#av-foe').dataset.a, cur: DQ.fight && DQ.fight.id } : null; });
    assert.ok(foe && foe.vis === 'visible' && foe.op > .5, 'the next creature is visible after a kill: ' + JSON.stringify(foe));
    await p.evaluate(() => { DQ.stopAct(true); DQ.paused = true; });
    assert.deepEqual(errors, []);
    console.log('PASS visual audit regressions: no bystanders, corner badges, skill icons, tool shelf keeps every tier, doll slots clickable at 1280x720, tower floors, level-up wording, next creature visible after a kill');
  } finally { await b.close(); }
})().catch(e => { console.error(e); process.exit(1); });
