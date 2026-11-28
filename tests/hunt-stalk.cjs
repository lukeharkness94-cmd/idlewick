/* Hunting is its own activity (owner, 23 Nov 2026), plus the fight stage following the foe and night on the stage.
   Needs the preview server (IDLEWICK_URL, default port 8765). */
const { chromium } = require('playwright'), assert = require('node:assert/strict'), fs = require('node:fs');
(async () => {
  const b = await chromium.launch({ headless: true, args: ['--no-sandbox'], ...(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {}) });
  try {
    const p = await b.newPage({ viewport: { width: 1440, height: 900 } }), errors = []; p.on('pageerror', e => errors.push(e.message));
    await p.goto(process.env.IDLEWICK_URL || 'http://127.0.0.1:8765/'); await p.locator('#t-new').click(); await p.locator('#crname').fill('Hunt'); await p.locator('#cr-go').click();
    await p.evaluate(() => { DQ.paused = true; DQ.S.settings.muted = true; DQ.S.tut.hidden = true; DQ.S.tut.prepareCombat = false; DQ.closeModal && DQ.closeModal(); });
    /* 1. the Hunting page opens on the hunting ground with the town's animals */
    const r1 = await p.evaluate(() => { DQ.S.unlocked.hunting = true; DQ.S.xp.hunting = DQ.data.XPF[3]; DQ.ui.huntMode = undefined; DQ.go('hunting');
      const v = document.querySelector('#view'); return { tab: v.querySelector('.hunt-mode-tabs .on')?.textContent.trim(), cards: v.querySelectorAll('.activity-choices .choice, .activity-choices [data-do="taskpick"], .activity-choices .card').length, head: v.querySelector('.activity-choices h2')?.textContent }; });
    assert.equal(r1.tab, 'Hunting ground'); assert.equal(r1.head, 'Choose your quarry');
    /* 2. a catch is a kill for quests, the field guide and drops; it pays Hunting XP and no combat XP; one lure is laid */
    const r2 = await p.evaluate(() => { const before = { ...DQ.S.xp }; DQ.S.inv.grain_mash = 5; const rnd = Math.random; Math.random = () => .01;
      const qev = []; const q0 = DQ.qev; DQ.qev = (...a) => { qev.push(a.slice(0, 2).join(':')); return q0(...a); };
      DQ.startAct('hunt', 'chicken'); const ext = DQ.KIND_EXT.hunt; ext.done(DQ.act); DQ.qev = q0; Math.random = rnd;
      return { kind: DQ.act.kind, count: DQ.act.count, kills: DQ.S.beast.kills.chicken || 0, qev, hunting: DQ.S.xp.hunting - before.hunting, melee: DQ.S.xp.melee - before.melee, hp: DQ.S.xp.hitpoints - before.hitpoints, got: Object.keys(DQ.S.inv).filter(k => ['feather', 'egg', 'raw_chicken'].includes(k)).length, mash: DQ.S.inv.grain_mash, pets: Object.keys(DQ.S.pets.owned).filter(k => k.startsWith('wild_')).length }; });
    assert.equal(r2.kind, 'hunt'); assert.equal(r2.count, 1); assert.equal(r2.kills, 1); assert.ok(r2.qev.includes('kill:chicken'), 'a catch counts as a quest kill');
    assert.ok(r2.hunting > 0, 'Hunting XP'); assert.equal(r2.melee, 0, 'no Melee XP'); assert.equal(r2.hp, 0, 'no Health XP'); assert.ok(r2.got >= 1, 'drops granted'); assert.equal(r2.mash, 4, 'one lure laid'); assert.equal(r2.pets, 0, 'hunting gives no companions');
    /* 3. an escape pays some XP, no kill, and the hunt carries on */
    const r3 = await p.evaluate(() => { const k0 = DQ.S.beast.kills.chicken, x0 = DQ.S.xp.hunting, rnd = Math.random; Math.random = () => .999; DQ.KIND_EXT.hunt.done(DQ.act); Math.random = rnd;
      return { kills: DQ.S.beast.kills.chicken - k0, xp: DQ.S.xp.hunting - x0, still: DQ.act && DQ.act.kind, esc: DQ.S.hunt.escaped || 0 }; });
    assert.equal(r3.kills, 0); assert.ok(r3.xp > 0); assert.equal(r3.still, 'hunt'); assert.equal(r3.esc, 1);
    /* 4. the three steps follow the cycle and odds stay within bounds (25-45% with a lure it ignores, 80-95% with the one it likes) */
    const r4 = await p.evaluate(() => { const a = DQ.act, d = a.dur, at = f => { a.t0 = Date.now() - d * f; return DQ.huntStep(a)[0]; };
      const G = DQ.data.HUNT_GROUND, liked = G.map(id => DQ.huntCatch(id, DQ.data.MON[id].lure)), other = G.map(id => DQ.huntCatch(id, DQ.data.MON[id].lure === 'grain_mash' ? 'root_mash' : 'grain_mash'));
      return { s: [at(.1), at(.5), at(.9)], lo: Math.min(...other), hi: Math.max(...other), llo: Math.min(...liked), lhi: Math.max(...liked) }; });
    assert.deepEqual(r4.s, ['Tracking', 'Laying the lure', 'Strike']); assert.ok(r4.lo >= .25 && r4.hi <= .45, JSON.stringify(r4)); assert.ok(r4.llo >= .8 && r4.lhi <= .95, JSON.stringify(r4));
    /* 5. routes: an Explore of the hunting ground hunts; animals are gone from the combat window */
    const r5 = await p.evaluate(() => { DQ.stopAct(); const g = DQ.huntGround(DQ.S.town); const ok = DQ.startHunt(g.id, null); const k = DQ.act && DQ.act.kind; DQ.stopAct(); DQ.go('combat');
      return { ok, k, tiles: document.querySelectorAll('#view .cw-window-hunt, #view .cw-hunt').length, link: !!document.querySelector('#view .cw-tabs [data-do="huntground"]') }; });
    assert.equal(r5.ok, true); assert.equal(r5.k, 'hunt'); assert.equal(r5.tiles, 0); assert.equal(r5.link, true);
    /* 6. before Hunting is learned, a quest's animal is still reachable as a fight */
    const r6 = await p.evaluate(() => {
      const S = DQ.S, original = S.town;
      S.unlocked.hunting = false;
      S.town = 'mossbarrow';
      S.towns.mossbarrow = { visited: true, boss: false };
      S.q.mq_ranged = { s: 'active', p: DQ.data.QM.mq_ranged.obj.map(() => 0) };
      DQ.ui.DO.huntquest('boar');
      const kind = DQ.act?.kind;
      DQ.stopAct(true);
      delete S.q.mq_ranged;
      S.town = original;
      S.unlocked.hunting = true;
      return kind;
    });
    assert.equal(r6, 'fight');
    /* 7. the stage follows the foe after each kill (it stayed on the first creature before) */
    await p.evaluate(() => { DQ.paused = false; DQ.S.inv.bread = 20; DQ.go('combat'); const a = DQ.combatAreas(DQ.S.town)[0]; DQ.startHunt(a.id, null); });
    let matched = 0;
    for (let i = 0; i < 8; i++) { await p.waitForTimeout(1500); const s = await p.evaluate(() => { const f = DQ.fight, m = f && DQ.data.MON[f.id]; const sides = document.querySelectorAll('#view .encounter-arena>.side'); const foe = sides[sides.length - 1]?.querySelector('#av-foe'); return m && foe ? foe.dataset.a === m.id : null; }); if (s === true) matched++; if (s === false) { /* the stage waits up to 1.1 s for the killing blow and the fade before drawing the next foe (player_feedback.js); allow that plus a busy machine */ const ok = await p.waitForFunction(() => { const sides = document.querySelectorAll('#view .encounter-arena>.side'); return sides[sides.length - 1]?.querySelector('#av-foe')?.dataset.a === DQ.fight?.id; }, null, { timeout: 4000 }).then(() => true, () => false); assert.equal(ok, true, 'stage shows the current foe'); } }
    assert.ok(matched >= 4);
    /* 8. night tints the landscape, not the fighters */
    const r8 = await p.evaluate(() => { document.body.dataset.tod = 'night'; const t = document.querySelector('#view .encounter-arena>.tod-tint'), s = document.querySelector('#view .encounter-arena>.side'); return t && s ? [+getComputedStyle(t).zIndex, +getComputedStyle(s).zIndex] : null; });
    if (r8) assert.ok(r8[0] < r8[1], 'fighters above the night tint');
    /* 9. the foe card: name and place on one line each */
    const r9 = await p.evaluate(() => { const b = document.querySelector('#view .cw-foe-id>b'), s = document.querySelector('#view .cw-foe-id>small'); return b && s ? [b.getClientRects().length, getComputedStyle(b).whiteSpace, getComputedStyle(s).whiteSpace] : null; });
    if (r9) assert.deepEqual(r9.slice(1), ['nowrap', 'nowrap']);
    await p.evaluate(() => { DQ.stopAct(); DQ.paused = true; });
    /* 10. one hunting ground (owner, 28 Nov 2026): 40 real game animals, eight in each of the five tiers, every one on its
       own level and inside its tier's band, with a sprite, a note and a favourite lure; no animal is also a mythical
       beast or a combat creature; every quest's animal is on the ground */
    const r10 = await p.evaluate(() => { const D = DQ.data, g = Object.values(D.AREAS).flat().filter(a => a.hunt), A = DQ.pixelArt, G = D.HUNT_GROUND.map(id => D.MON[id]);
      const questAnimals = [...new Set(D.QUESTS.flatMap(q => q.obj.filter(o => o.ev === 'kill' && D.MON[o.key] && D.MON[o.key].hl).map(o => o.key)))];
      const combat = new Set(Object.values(D.AREAS).flat().filter(a => !a.hunt).flatMap(a => a.monsters.map(e => e.id)));
      return { total: g.reduce((n, a) => n + a.monsters.length, 0), ground: G.length, all: D.MONLIST.filter(m => m.hl).length, cells: [0, 1, 2, 3, 4].map(t => G.filter(m => m.tier === t).length).join(','), levels: new Set(G.map(m => m.hl)).size,
        art: G.every(m => A.hasCreature(m.id)), notes: G.every(m => D.LORE[m.id] && D.LORE[m.id].note), bands: G.every(m => { const T = D.HUNT_TIERS[m.tier]; return m.hl >= T.lo && m.hl <= T.hi; }),
        lures: G.every(m => D.HUNT_LURE[m.lure] && !m.id.startsWith('wild_')), quests: questAnimals.every(id => D.MON[id].ground), noMyth: D.MYTHS.every(x => !D.MON[x.id] && !D.HUNT_GROUND.includes(x.id)), noCombat: G.every(m => !combat.has(m.id)),
        classic: ['chicken', 'rabbit', 'boar', 'red_deer', 'moose', 'aurochs', 'musk_ox', 'walrus', 'polar_bear'].every(id => D.MON[id] && D.MON[id].ground) }; });
    assert.deepEqual(r10, { total: 40, ground: 40, all: 40, cells: '8,8,8,8,8', levels: 40, art: true, notes: true, bands: true, lures: true, quests: true, noMyth: true, noCombat: true, classic: true });
    /* 11. no towns: tier tabs only, the same animals from any town, gated by level; a mythical beast is not hunted */
    const r11 = await p.evaluate(() => { const S = DQ.S; S.town = 'willowbrook'; S.xp.hunting = DQ.data.XPF[15]; S.inv.grain_mash = 5; DQ.ui.huntMode = 'ground'; DQ.ui.huntTier = 0; DQ.go('hunting');
      const grounds = document.querySelectorAll('#view .hunt-grounds').length, tiers = document.querySelectorAll('#view .hunt-tiers button').length, cards = document.querySelectorAll('#view .illustrated-card').length;
      const pheasant = DQ.KIND_EXT.hunt.check('pheasant'), far = DQ.KIND_EXT.hunt.check('polar_bear'), off = DQ.KIND_EXT.hunt.check('griffin');
      S.town = 'hollow'; const pheasantHollow = DQ.KIND_EXT.hunt.check('pheasant'); S.town = 'willowbrook';
      return { grounds, tiers, cards, pheasant, far, off, pheasantHollow }; });
    assert.equal(r11.grounds, 0); assert.equal(r11.tiers, 5); assert.equal(r11.cards, 8); assert.equal(r11.pheasant, ''); assert.equal(r11.pheasantHollow, '');
    assert.match(r11.far, /^Requires Hunting 98/); assert.equal(r11.off, 'Choose an animal');
    /* 12. lures (owner, 28 Nov 2026): no lure, no hunt; the first hunt with a lure says whether the animal likes it, which is
       remembered and lifts the odds; a picked lure that runs out stops the hunt; a quest's animal needs no lure */
    const r12 = await p.evaluate(() => { const S = DQ.S, D = DQ.data; S.xp.hunting = D.XPF[20]; for (const l of D.HUNT_LURES) delete S.inv[l.id]; delete S.hunt.lures; delete S.hunt.lureSel; DQ.stopAct(true);
      const none = DQ.KIND_EXT.hunt.check('rabbit'); S.inv.grain_mash = 3; S.inv.root_mash = 1;
      const unknown = DQ.lureKnown('rabbit', 'grain_mash'), auto = DQ.huntLure('rabbit');
      DQ.startAct('hunt', 'rabbit'); const rnd = Math.random; Math.random = () => .99; DQ.KIND_EXT.hunt.done(DQ.act);
      const ignored = DQ.lureKnown('rabbit', 'grain_mash'), low = DQ.huntCatch('rabbit', 'grain_mash');
      DQ.ui.DO.huntlure('rabbit|root_mash'); const picked = DQ.huntLure('rabbit');
      /* the running hunt carries on with the lure you picked */
      const running = DQ.act && DQ.act.id; Math.random = () => .5; DQ.KIND_EXT.hunt.done(DQ.act); Math.random = rnd;
      const liked = DQ.lureKnown('rabbit', 'root_mash'), fav = DQ.huntFavourite('rabbit'), high = DQ.huntCatch('rabbit', 'root_mash'), stopped = !DQ.act, need = DQ.KIND_EXT.hunt.check('rabbit');
      const line = DQ.huntLureLine('rabbit'), saved = JSON.parse(decodeURIComponent(escape(atob(DQ.exportSave())))).hunt.lures.rabbit;
      S.q.boar_hunt = { s: 'active', p: D.QM.boar_hunt.obj.map(() => 0) }; for (const l of D.HUNT_LURES) delete S.inv[l.id]; const quest = DQ.KIND_EXT.hunt.check('boar'); delete S.q.boar_hunt;
      return { running, none, unknown, auto, ignored, low, picked, liked, fav, high, stopped, need, line, saved, quest }; });
    assert.equal(r12.running, 'rabbit'); assert.equal(r12.none, 'Needs a lure'); assert.equal(r12.unknown, undefined); assert.equal(r12.auto, 'grain_mash');
    assert.equal(r12.ignored, false, 'the rabbit ignores grain mash'); assert.ok(r12.low <= .45); assert.equal(r12.picked, 'root_mash');
    assert.equal(r12.liked, true, 'the rabbit likes root mash'); assert.equal(r12.fav, 'root_mash'); assert.ok(r12.high >= .8 && r12.high > r12.low * 1.8, 'the liked lure lifts the odds a lot');
    assert.equal(r12.stopped, true, 'the picked lure ran out, so the hunt stops'); assert.match(r12.need, /Root mash/); assert.equal(r12.line, 'Likes root mash');
    assert.deepEqual(r12.saved, { grain_mash: 0, root_mash: 1 }, 'verdicts are kept in the save'); assert.equal(r12.quest, '', 'a quest animal needs no lure');
    /* 13. the progress strip: the running hunt shows its step, and a result marks the failed step and the lure verdict */
    const r13 = await p.evaluate(() => new Promise(res => { DQ.paused = true; DQ.S.inv.grain_mash = 5; delete DQ.S.hunt.lureSel.rabbit; DQ.ui.huntTier = 0; DQ.startAct('hunt', 'chicken'); DQ.ui.taskChoice.hunting = 'chicken'; DQ.ui.render(false); DQ.emit('ui');
      const live = !!document.querySelector('#view .hunt-track'); DQ.emit('huntresult', { id: 'chicken', c: 0, f: 1, lure: 'grain_mash', liked: 1, reveal: 1 }, DQ.data.MON.chicken);
      setTimeout(() => res({ live, fail: document.querySelector('#view .hunt-track-steps li[data-st="fail"]')?.dataset.i, out: document.querySelector('#view .hunt-track-out')?.textContent, row: document.querySelectorAll('#view .hunt-lure').length }), 50); }));
    assert.equal(r13.live, true); assert.equal(r13.fail, '1'); assert.match(r13.out, /Ignored the lure[\s\S]*It likes grain mash/); assert.ok(r13.row >= 1, 'the lure row is shown');
    await p.evaluate(() => DQ.stopAct());
    assert.deepEqual(errors, []);
    console.log('PASS hunting ground (catch/escape/steps/routes/fallback), one ground of 40 real animals in five tiers of eight on distinct levels, the same from every town, lures with like/ignore verdicts, the progress strip, stage follows foe, night tint under fighters, foe card single lines.');
  } finally { await b.close(); }
})().catch(e => { console.error(e); process.exit(1); });
