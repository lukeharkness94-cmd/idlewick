const assert = require('node:assert/strict');
const { chromium } = require('playwright');
const path = require('node:path');

(async () => {
  const browser = await chromium.launch({ args: ['--no-sandbox'],
    ...(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {}) });
  try {
    const errors = [];
    const newHero = async (preparedFixture = false) => {
      const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
      page.on('pageerror', error => errors.push(error.message));
      await page.goto(process.env.IDLEWICK_URL || 'http://127.0.0.1:8765/');
      await page.locator('#t-new').click();
      await page.locator('#crname').fill('Combat QA');
      await page.locator('#cr-go').click();
      await page.evaluate(prepared => {
        const Q = DQ;
        Q.paused = true;
        Object.assign(Q.S.settings, { muted: true, notify: false, storyScenes: false, reduceFx: true });
        Q.S.tut.hidden = true;
        if (prepared) { Q.S.tut.weaponFinished = true; Q.S.stats.cook = 1; }
        for (const skill of Object.keys(Q.skillLessons)) Q.S.tut.done['lesson:' + skill] = true;
        Q.closeModal();
      }, preparedFixture);
      return page;
    };
    let page = await newHero();
    await page.evaluate(() => {
      const Q = DQ, D = Q.data;
      // Fresh hero: earn the inputs, quest reward, traps and Combat 8 through gameplay.
      const check = (ok, msg) => { if (!ok) throw Error(msg); };
      const work = (kind, id, until, max = 120) => {
        let steps = 0;
        while (!until() && steps++ < max) {
          if (!Q.act) check(Q.startAct(kind, id, { quiet: true }), 'Could not start ' + id);
          Q.simulate(15000);
        }
        Q.stopAct(true);
        check(until(), 'Did not finish ' + id);
      };
      check(Q.sourceOf('cowhide').id === 'goblin_raider', 'Fresh cowhide source');
      Q.go('crafting');
      Q.ui.DO.route('cowhide');
      check(!Q.act && Q.ui.returnTo.page === 'crafting', 'Cowhide route starts no work');
      check(document.querySelector('[data-do="routefight"][data-a="goblin_raider"]'), 'Exact raider action');
      Q.startQuest('first_steps');
      work('fish', 'shrimp', () => Q.S.q.first_steps?.p[0] >= 5);
      work('wood', 'normal', () => Q.lvl('woodcutting') >= 2 && Q.have('log_normal') >= 20);
      check(Q.questState(D.QM.first_steps) === 'ready', 'Complete the first main quest before taking the Crafting lesson');
      Q.claimQuest('first_steps');
      work('wood', 'flax', () => Q.have('flax') >= 10 && Q.advLvl() >= 3);
      Q.startQuest('mq_crafting');
      check(Q.questState(D.QM.mq_crafting) === 'ready', 'Hettie uses flax and logs on current main');
      Q.claimQuest('mq_crafting');
      check(Q.skillUnlocked('crafting') && Q.have('cowhide') >= 6, 'Crafting and hide reward');
      /* the opening's string is flax string at Crafting 1 (leather string is Crafting 3 since the 26 Nov level spread) */
      work('wood', 'flax', () => Q.have('flax') >= 12);
      work('recipe', 'craft_flax_string', () => Q.lvl('crafting') >= 2 && Q.have('string') >= 3);
      work('recipe', 'craft_trap', () => Q.have('wooden_trap') >= 3);
      Q.ui.DO.finishstarter();
      work('recipe', 'cook_shrimp', () => Q.S.stats.cook >= 1);
      Q.S.settings.autoEat = false;
      // Advance the earned fight and pause to recover when needed.
      for (let i = 0; i < 400 && Q.combatLvl() < 8; i++) {
        if (Q.S.hp < Q.maxHp() * .55) { Q.stopAct(true); Q.simulate(30000); }
        else {
          if (!Q.act) Q.startAct('fight', 'mudling', { quiet: true });
          Q.simulate(10000);
        }
      }
      Q.stopAct(true);
      check(Q.combatLvl() >= 8 && Q.skillUnlocked('hunting'), 'Earned Hunting with crafted traps');
      Q.ui.focusTask('cooking', 'cook_scent_bait');
      Q.ui.DO.route('raw_game');
      const src = Q.sourceOf('raw_game');
      check(src.kind === 'hunt' && !Q.KIND_EXT.hunt.check(src.id), 'Accessible raw game source');
      check(Q.ui.huntTier === D.MON[src.id].tier && Q.ui.huntGroundAt === src.town &&
        Q.ui.taskChoice.hunting === src.id && !Q.act && Q.ui.returnTo.page === 'cooking', 'Exact raw game route');
    });

    console.log('PASS fresh Cowhide → Crafting → wooden traps → Hunting, and Raw game source');

    // Use a separate context so delayed unlocks from the fresh-hero run cannot interrupt route clicks.
    await page.close();
    page = await newHero(true);

    // Granted progression fixture for concurrent quests and a real reload.
    await page.evaluate(() => {
      const Q = DQ;
      Q.S.unlocked.hunting = false;
      Q.S.inv.wooden_trap = 0;
      Q.S.bank.wooden_trap = 0;
      if (Q.skillUnlocked('hunting')) throw Error('Fixture requires Hunting to be locked');
      Q.S.towns.mossbarrow = { visited: true, boss: false };
      Q.S.q.wb_tattercaps = { s: 'active', p: [0, 0] };
      Q.S.q.mq_ranged = { s: 'active', p: [10, 40, 0] };
      Q.give('log_birch', 10);
      Q.give('feather', 40);
      Q.go('quests');
      Q.ui.DO.questcontinue('mq_ranged');
    });
    assert.equal(await page.locator('[data-do="routetravel"][data-a="mossbarrow"]').count(), 1,
      JSON.stringify(await page.evaluate(() => [DQ.ui.view, DQ.ui.routeSource, DQ.unfinishedObjective(DQ.data.QM.mq_ranged)])));
    await page.locator('[data-do="routetravel"][data-a="mossbarrow"]').click();
    await page.waitForFunction(() => DQ.S.town === 'mossbarrow' && DQ.ui.view === 'combat');
    assert.equal(await page.evaluate(() => DQ.act), null, 'Travel must not start the fight');
    await page.evaluate(() => {
      for (let i = 0; i < 4; i++) DQ.closeModal();
      DQ.S.pins = ['mq_ranged'];
      DQ.go('overview');
    });
    await page.locator('#pins [data-do="questcontinue"][data-a="mq_ranged"]').click();
    await page.locator('[data-do="routefight"][data-a="boar"]').click();
    assert.equal(await page.evaluate(() => DQ.act?.id), 'boar');
    await page.evaluate(() => { DQ.S.act.count = 2; if (!DQ.save()) throw Error('save failed'); });
    await page.reload();
    await page.locator('#t-cont').click();
    await page.waitForFunction(() => DQ.act?.kind === 'fight' && DQ.act.id === 'boar');
    assert.equal(await page.evaluate(() => DQ.act.count), 2);
    await page.evaluate(() => { DQ.paused = true; DQ.stopAct(true); DQ.closeModal(); DQ.S.unlocked.hunting = true; DQ.give('wooden_trap', 3); });
    await page.evaluate(() => DQ.ui.DO.questcontinue('mq_ranged'));
    assert.deepEqual(await page.evaluate(() => [DQ.ui.view, DQ.ui.huntGroundAt, DQ.ui.taskChoice.hunting, DQ.KIND_EXT.hunt.check('boar')]),
      ['hunting', 'mossbarrow', 'boar', '']);

    await page.evaluate(() => {
      const Q = DQ;
      const save = JSON.parse(JSON.stringify(Q.S));
      save.xp.hunting = Q.data.XPF[Q.data.MON.hill_goat.hl];
      save.inv.reinforced_trap = 1;
      save.inv.scent_bait = 4;
      save.unlocked.beastmastery = true;
      save.act = { kind: 'hunt', id: 'wild_goat', progress: 125, count: 3 };
      save.queue = [{ kind: 'hunt', id: 'wild_turkey' }];
      save.beast.kills = { wild_goat: 3, hill_goat: 2, wild_turkey: 4 };
      save.beast.drops = { 'wild_goat:raw_game': 1 };
      const migrated = Q.validateSave(save);
      const twice = Q.validateSave(JSON.parse(JSON.stringify(migrated)));
      if (migrated.act.id !== 'hill_goat' || migrated.act.count !== 3 || migrated.queue[0].id !== 'turkey' ||
          twice.beast.kills.hill_goat !== 5 || twice.beast.kills.turkey !== 4 ||
          twice.beast.drops['hill_goat:raw_game'] !== 1 || 'wild_goat' in twice.beast.kills) throw Error('Quarry migration');
      // Also save the migrated activity and queue through the real storage path.
      Q.S = migrated; Q.resumeAfterLoad();
      if (!Q.save()) throw Error('Hunt save failed');
    });
    await page.reload();
    await page.locator('#t-cont').click();
    await page.waitForFunction(() => DQ.act?.kind === 'hunt' && DQ.act.id === 'hill_goat');
    assert.deepEqual(await page.evaluate(() => [DQ.act.count, DQ.S.queue[0].id]), [3, 'turkey']);
    console.log('PASS routed boar fight and hunt migration through isolated reloads');
    await page.evaluate(() => {
      DQ.paused = true; DQ.closeModal(); DQ.S.queue = [];
      DQ.ui.DO.huntground('boar');
      DQ.ui.DO.nowactivity();
    });
    assert.deepEqual(await page.evaluate(() => [DQ.ui.huntGroundAt, DQ.ui.huntTier, DQ.ui.taskChoice.hunting]), ['willowbrook', 1, 'hill_goat']);
    await page.evaluate(() => {
      const Q = DQ;
      Q.stopAct(true);
      const target = Q.data.DRILLS.ranged[1];
      Q.S.xp.ranged = Q.data.XPF[target.lvl];
      Q.S.unlocked.ranged = true;
      const meleeTarget = 'melee:' + Q.data.DRILLS.melee[0].id;
      Q.S.equip.weapon = null;
      if (Q.startAct('drill', meleeTarget, { quiet: true })) throw Error('Melee drill accepted empty hands');
      Q.S.equip.weapon = 'bow_normal';
      Q.S.ammo = { id: null, n: 0 };
      if (Q.startAct('drill', meleeTarget, { quiet: true })) throw Error('Melee drill accepted a bow');
      if (!Q.startAct('drill', 'ranged:' + target.id, { quiet: true })) throw Error('Archery drill required arrows');
      Q.go('overview');
      Q.ui.DO.nowactivity();
      if (Q.ui.taskChoice.ranged !== Q.act.id || !document.querySelector('.activity-stage').textContent.includes('uses no arrows')) throw Error('Wrong Archery practice destination');
      Q.go('arts');
    });
    await page.waitForFunction(() => DQ.ui.view === 'ranged' && !!document.querySelector('.arts-grid'));
    await page.evaluate(() => {
      const Q = DQ;
      Q.stopAct(true);
      Q.S.equip.weapon = 'staff_normal';
      Q.S.unlocked.magic = true;
      Q.ui.tab.magic = 'Runes';
      Q.go('arts');
    });
    await page.waitForFunction(() => DQ.ui.view === 'magic' && DQ.ui.tab.magic === 'Spellbook');
    await page.evaluate(() => {
      const Q = DQ;
      Q.S.equip.weapon = 'bronze_sword';
      Q.ui.DO.styletab('melee', 'drill');
      Q.go('arts');
    });
    await page.waitForFunction(() => DQ.ui.view === 'melee' && !!document.querySelector('.arts-grid'));
    await page.evaluate(() => {
      const Q = DQ;
      Q.S.equip.weapon = 'staff_normal';
      Q.S.inv.rune = 0;
      Q.S.bank.rune = 0;
      Q.go('combat');
    });
    assert.equal(await page.locator('.fight-supply [data-do="route"]').innerText(), 'Find runes');
    await page.evaluate(() => {
      const Q = DQ;
      Q.S.equip.weapon = 'bow_normal';
      Q.give('arrow_bronze', 15);
      Q.ui.render(false);
      for (let i = 0; i < 4; i++) Q.closeModal();
    });
    await page.locator('.fight-supply [data-do="combatequip"]').click();
    assert.equal(await page.evaluate(() => DQ.S.ammo.id), 'arrow_bronze');
    await page.evaluate(() => {
      const Q = DQ;
      Q.travel('willowbrook');
      if (!Q.startAct('train', 'lure:willowbrook', { quiet: true })) throw Error('Could not start Fieldwork');
      for (let i = 0; i < 4; i++) Q.closeModal();
      Q.ui.DO.huntground('hill_goat');
      Q.ui.DO.nowactivity();
      if (Q.ui.huntMode !== 'field' || Q.ui.taskChoice.hunting !== 'lure:willowbrook') throw Error('Wrong Fieldwork destination');
      Q.S.equip.weapon = 'bronze_sword';
    });
    await page.evaluate(() => {
      DQ.stopAct(true); DQ.travel('willowbrook');
      DQ.go('combat'); DQ.ui.DO.hunttrack('goblin_raider');
    });
    await page.getByRole('button', { name: 'Explore instead' }).click();
    assert.deepEqual(await page.evaluate(() => {
      const a = DQ.act, s = DQ.S;
      return [a.area, a.target, a.track, s.act.target, s.act.track, s.hunt.target, DQ.fight.tracking];
    }), ['willowbrook:1', null, false, null, false, null, 0]);
    assert.equal(await page.evaluate(() => {
      const old = Math.random;
      try { Math.random = () => 0; return DQ.nextEncounter(DQ.data.MON.goblin_raider).id === DQ.combatAreas('willowbrook')[1].monsters[0].id; }
      finally { Math.random = old; }
    }), true);
    await page.getByRole('button', { name: 'Retreat', exact: true }).last().click();
    assert.equal(await page.evaluate(() => DQ.act), null);

    console.log('PASS exact Now destinations, #arts, supplies and Explore instead');
    for (const theme of ['light', 'dark']) for (const [width,height] of [[320,780],[390,844],[1280,720]]) {
      await page.setViewportSize({ width, height });
      await page.evaluate(theme => {
        DQ.S.settings.theme = theme;
        DQ.applyTheme();
        DQ.S.equip.weapon = 'bow_normal';
        DQ.S.ammo = { id: null, n: 0 };
        DQ.S.inv.arrow_bronze = 0;
        DQ.S.bank.arrow_bronze = 0;
        if (DQ.ui.view === 'combat') DQ.ui.render(false); else DQ.go('combat');
      }, theme);
      assert.equal(await page.locator('.fight-supply [data-do="route"]').innerText(), 'Find arrows');
      assert.equal(await page.locator('.cw-mon small').first().isVisible(), true);
      assert.ok(await page.locator('[data-do="autoeat"]').first().evaluate(e => e.getBoundingClientRect().right <= innerWidth));
      if (width < 861) {
        assert.ok(await page.locator('.cw-mon [data-do="hunttrack"]').first().evaluate(e => e.getBoundingClientRect().height >= 44));
        await page.locator('#subnav [data-a="magic"]').click();
        assert.equal(await page.evaluate(() => DQ.ui.hubOf(DQ.ui.view).id), 'combat');
      }
      await page.evaluate(() => {
        DQ.S.xp.hunting = DQ.data.XPF[99];
        DQ.S.towns.ironpeak = { visited: true, boss: false };
        delete DQ.S.inv.reinforced_trap;
        delete DQ.S.inv.scent_bait;
        DQ.ui.DO.huntground('mountain_goat');
      });
      assert.equal(await page.locator('.task-primary').isDisabled(), true);
      assert.equal(await page.locator('.hunt-grounds button').count(), 8);
      assert.equal(await page.locator('.hunt-tiers button').count(), 5);
      await page.evaluate(() => {
        DQ.ui.DO.huntground('chicken');
        DQ.startAct('hunt', 'chicken', { quiet: true });
        DQ.emit('ui');
      });
      assert.equal(await page.locator('.hunt-track').isVisible(), true);
      assert.equal(await page.locator('.task-primary').innerText(), 'Stop');
      assert.ok(await page.locator('.task-primary').evaluate(e => e.getBoundingClientRect().right <= innerWidth));
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), theme + ' ' + width + ' horizontal overflow');
      console.log('PASS ' + theme + ' layout ' + width + '×' + height);
      await page.evaluate(() => DQ.stopAct(true));
    }
    if (process.env.SHOT_DIR) {
      await page.screenshot({ path: path.join(process.env.SHOT_DIR, 'idlewick-hunting-qa.png') });
      await page.evaluate(() => DQ.go('combat'));
      await page.screenshot({ path: path.join(process.env.SHOT_DIR, 'idlewick-combat-qa.png') });
    }
    assert.deepEqual(errors, []);
    console.log('PASS fresh Crafting/Hunting, ingredient and pinned routes, weighted Explore, isolated reload/migration, Now and responsive combat/hunting.');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exit(1); });
