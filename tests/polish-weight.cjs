/* node tests/polish-weight.cjs: weighted moments (polish stage 1, owner 28 Nov 2026: "Every action answered"; weight
   scales with significance). js/weight_rules.js (timings table, pure decisions), js/weight.js (drawing and wiring), the
   weighted sounds in js/audio.js. Needs the preview server for the browser part.
   Node: the decisions (level tiers and the merge of several level-ups, find bands from D.RARITY, work-find chances,
         sale bands, blow tiers, the gate, the queue) and that the table is in seconds and within the rules.
   Browser, fixture a new hero (granted XP, items and coins as stated):
   1  each moment answers and finishes: an ordinary level chimes; a milestone shows its title and leaves on its own;
      several level-ups at once are one moment for the biggest; a find glints, lights the scene and (rarest) titles;
      a sale drops coins into the purse with a clunk by band; a crit and a killing blow hit-stop the stage sprites
   2  the save (JSON) is the same before and after every effect, and no effect draws from Math.random (the game's rolls)
   3  nothing waits: a second sale mid-effect sells at once and finishes the coins; a click mid-title changes page at once
   4  Reduce effects: the title stands still and complete, no coins, light or hit-stop, sounds still answer
   5  nothing in a simulation (time away), a forecast or a hidden window; a pop-up or a fight on the stage queues a title
   6  every weighted sound peaks below -1 dBFS at full volume (rendered offline) and is audible */
const assert = require('node:assert/strict');
const fs = require('node:fs'), path = require('node:path');
const { harness } = require('./engine-harness.cjs');

/* ---------------- Node: the decisions ---------------- */
{
  /* values made in the game's own context: compared by value */
  const eq = (a, b, m) => assert.deepEqual(JSON.parse(JSON.stringify(a)), b, m);
  const h = harness(); h.load('weight_rules'); const W = h.q.WEIGHT, D = h.q.data, T = W.T;
  /* the table: seconds, the title 1.5 to 2.5 s, the hit-stop under 80 ms, interface motion about a quarter second */
  const tt = W.MARKS.map((m, i) => W.titleTimes(i + 1).total);
  assert.ok(tt.every(t => t >= 1.5 && t <= 2.5), 'titles last 1.5 to 2.5 s: ' + tt);
  assert.ok(tt.every((t, i) => !i || t >= tt[i - 1]), 'a bigger milestone stays at least as long');
  assert.ok(Object.values(T.hit.stop).every(s => s > 0 && s < .08), 'hit-stops under 80 ms');
  assert.ok(T.ui >= .2 && T.ui <= .3 && T.find.flight < 2 && T.sale.flight < 1, 'all in seconds');
  /* levels */
  eq(W.MARKS, [10, 25, 50, 75, 90, 99]);
  eq([9, 10, 24, 25, 51, 99].map(l => W.levelTier(l).rank), [0, 1, 0, 2, 0, 6]);
  eq([1, 9, 10, 49, 98].map(l => W.levelTier(l).band), [0, 0, 1, 2, 5], 'the band counts the marks behind you');
  let m = W.levelMoment([{ who: 'skill', id: 'fishing', level: 7 }]);
  assert.equal(m.title, false); assert.equal(m.sound, 'lvchime0', 'an ordinary early level: the lowest chime');
  assert.equal(W.levelMoment([{ who: 'skill', id: 'fishing', level: 60 }]).sound, 'lvchime3', 'pitched by tier');
  m = W.levelMoment([{ who: 'skill', id: 'mining', level: 26 }, { who: 'skill', id: 'woodcutting', level: 50 }, { who: 'hero', level: 25 }]);
  eq([m.who, m.id, m.level, m.rank, m.sound], ['skill', 'woodcutting', 50, 3, 'milestone3'], 'several at once: the biggest');
  m = W.levelMoment([{ who: 'skill', id: 'mining', level: 25 }, { who: 'hero', level: 25 }]);
  assert.equal(m.who, 'hero', 'a tie goes to the Hero level');
  assert.equal(W.levelMoment([{ who: 'skill', id: 'magic', level: 99 }]).sound, 'milestone6', '99 the grandest');
  assert.equal(W.levelMoment([]), null);
  /* finds */
  eq([.5, .1, .05, .02, .01, .005, .004, 0].map(c => W.findTier(c).id), ['common', 'common', 'uncommon', 'uncommon', 'rare', 'rare', 'epic', 'epic'], 'the D.RARITY bands');
  eq(D.RARITY.map(r => r[3]), [.1, .02, .005, 0], 'the bands are the data\'s own');
  const ft = W.findTier(.001); assert.ok(ft.glint && ft.light && ft.title && ft.sound === 'find3');
  const fu = W.findTier(.03); assert.ok(fu.glint && !fu.light && !fu.title && fu.sound === 'find1', 'uncommon: glint and chime only');
  const fr = W.findTier(.008); assert.ok(fr.glint && fr.light && !fr.title && fr.sound === 'find2', 'rare: and light');
  assert.equal(W.findTier(.5).glint, false, 'common keeps today\'s flight');
  assert.equal(W.findTier(.9, { unique: true }).id, 'epic', 'a named weapon is the rarest');
  const E = D.ECONOMY, gw = Object.fromEntries(D.GEM_WEIGHTS), tot = Object.values(gw).reduce((a, b) => a + b, 0);
  assert.equal(W.workFindChance({ kind: 'mine', item: 'gem_ruby', main: 'ore_copper', data: D }), E.mineGemChance * gw.gem_ruby / tot);
  assert.equal(W.workFindChance({ kind: 'wood', item: 'gem_sapphire', main: 'log', data: D }), E.woodNestChance * .5 * gw.gem_sapphire / tot);
  assert.equal(W.workFindChance({ kind: 'mine', item: 'ore_copper', main: 'ore_copper', data: D }), null, 'the action\'s own yield is no find');
  assert.equal(W.workFindChance({ kind: 'thieve', item: 'bread', main: null, loot: ['bread', .12], data: D }), .12);
  assert.equal(W.biggestFind([{ id: 'a', chance: .03 }, { id: 'b', chance: .001 }, { id: 'c', chance: .5 }]).id, 'b');
  /* sales */
  eq([1, 99, 100, 999, 1000, 9999, 10000, 1e6].map(c => W.saleBand(c).band), [0, 0, 1, 1, 2, 2, 3, 3]);
  eq([0, 1, 2, 3].map(b => W.saleBand([5, 500, 5000, 50000][b]).coins), [1, 3, 5, 8], 'more coins as the sum grows');
  assert.equal(W.saleBand(0), null);
  /* blows */
  assert.equal(W.hitTier({ dealt: 0, kind: 'miss', foeMax: 10 }), null);
  assert.equal(W.hitTier({ dealt: 1, kind: 'hit ', foeMax: 100 }).tier, 'normal');
  assert.equal(W.hitTier({ dealt: 25, kind: 'hit ', foeMax: 100 }).tier, 'big');
  assert.equal(W.hitTier({ dealt: 3, kind: 'hit power', foeMax: 100 }).tier, 'crit');
  assert.equal(W.hitTier({ dealt: 40, kind: 'hit weak', foeMax: 100 }).tier, 'crit');
  const k = W.hitTier({ dealt: 2, kind: 'hit ', foeMax: 100, killing: true }); eq([k.tier, k.sound], ['kill', 'killblow']);
  const bk = W.hitTier({ dealt: 2, kind: 'hit ', foeMax: 100, killing: true, boss: true }); eq([bk.tier, bk.sound], ['boss', null], 'a boss keeps its story');
  assert.ok(W.hitTier({ dealt: 3, kind: 'hit power', foeMax: 100 }).stagger > W.hitTier({ dealt: 25, kind: 'hit', foeMax: 100 }).stagger, 'a crit staggers further');
  /* the gate and the queue */
  assert.equal(W.gate({ sim: true, title: true }), 'drop'); assert.equal(W.gate({ forecasting: true }), 'drop'); assert.equal(W.gate({ hidden: true }), 'drop');
  assert.equal(W.gate({ popup: true, title: true }), 'queue'); assert.equal(W.gate({ fight: true, title: true }), 'queue');
  assert.equal(W.gate({ fight: true }), 'show', 'only titles wait for a fight'); assert.equal(W.gate({ calm: true, title: true }), 'still');
  let q = W.queueAdd([], { type: 'level', level: 25, rank: 2 }, 0); q = W.queueAdd(q, { type: 'level', level: 10, rank: 1 }, 1);
  eq(q.map(x => x.level), [25], 'a smaller title never replaces a bigger one');
  q = W.queueAdd(q, { type: 'level', level: 50, rank: 3 }, 2); q = W.queueAdd(q, { type: 'find', band: 3 }, 3);
  eq(q.map(x => x.type + (x.level || '')), ['level50', 'find'], 'one per kind, the biggest');
  eq(W.queueReady(q, 3 + 61000).map(x => x.type), ['level'], 'a stale find is let go; a milestone waits');
  /* the weighted sounds exist for every name the rules can give */
  const audio = fs.readFileSync(path.join(__dirname, '../js/audio.js'), 'utf8');
  assert.ok(/\.\.\.weighted\(\)/.test(audio), 'audio.js includes the weighted sounds');
  console.log('PASS polish weight (rules)');
}

/* ---------------- Browser ---------------- */
const { chromium } = require('playwright');
const URL = process.env.IDLEWICK_URL || 'http://127.0.0.1:8765/';
const AUDIO = fs.readFileSync(path.join(__dirname, '../js/audio.js'), 'utf8').split('\n');
const WEIGHTED = [AUDIO.findIndex(l => l.startsWith('function weighted()')) + 1, AUDIO.findIndex((l, i) => i > 0 && l.startsWith('  return out;')) + 1];

(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined, args: ['--autoplay-policy=no-user-gesture-required'] });
  try {
    const p = await b.newPage({ viewport: { width: 1440, height: 900 } }), errors = []; p.on('pageerror', e => errors.push(e.stack || e.message));
    await p.goto(URL); await p.locator('#t-new').click(); await p.locator('#cr-go').click();
    await p.waitForFunction(() => DQ.started && document.querySelector('#title').hidden);
    await p.evaluate(([lo, hi]) => {
      for (let i = 0; i < 12; i++) DQ.closeModal(); const S = DQ.S; S.settings.storyScenes = false; S.settings.notify = false; S.tut.hidden = true; S.tut.prepareCombat = false;
      Object.assign(S.settings, { sfx: true, muted: false, vol: 1, masterVol: 1 }); DQ.audioInit(); DQ.paused = true;
      /* every call of the game's random roll is recorded with where it came from */
      const r0 = Math.random; window.__rng = []; Math.random = function () { const s = new Error().stack || ''; const own = /\/js\/weight(_rules)?\.js/.test(s) || s.split('\n').some(f => { const m = f.match(/\/js\/audio\.js:(\d+)/); return m && +m[1] >= lo && +m[1] <= hi; }); if (own) window.__rng.push(s); return r0(); };
      window.__snap = () => JSON.stringify(DQ.S);
    }, WEIGHTED);
    const W = () => p.evaluate(() => ({ stats: JSON.parse(JSON.stringify(DQ.weight.stats)), showing: DQ.weight.showing(), queued: DQ.weight.queued(), n: document.querySelectorAll('.lw-moment').length }));
    const settle = async (ms = 2800) => { await p.waitForTimeout(ms); };
    /* the save stays the same while an effect plays: snapshot just after the trigger, again once it has finished */
    const untouched = async (label, trigger, wait = 2800) => {
      await p.evaluate(trigger); const a = await p.evaluate(() => window.__snap()); await settle(wait); const z = await p.evaluate(() => window.__snap());
      assert.equal(z, a, label + ': the save is unchanged while it plays');
    };

    /* ---- 1 + 2: levels ---- */
    await p.evaluate(() => { DQ.go('settings'); DQ.ui.render(true); });
    let s0 = (await W()).stats;
    await untouched('an ordinary level', () => DQ.weight.levelUp('skill', 'fishing', 7), 400);
    let s1 = (await W()).stats; assert.equal(s1.chimes - s0.chimes, 1); assert.equal(s1.titles, s0.titles, 'an ordinary level has no title');
    assert.equal(s1.sounds.lvchime0, 1, 'a small chime, pitched by tier');
    await p.evaluate(() => DQ.weight.levelUp('skill', 'woodcutting', 50));
    await p.waitForTimeout(400);
    let w = await W(); assert.deepEqual([w.showing.id, w.showing.level, w.n], ['woodcutting', 50, 1], 'a milestone shows its title');
    const look = await p.evaluate(() => { const el = document.querySelector('.lw-moment'), r = el.getBoundingClientRect(), v = document.getElementById('view').getBoundingClientRect(), img = el.querySelector('img');
      return { text: el.textContent.trim(), pe: getComputedStyle(el).pointerEvents, role: el.getAttribute('role'), inView: r.left >= v.left - 1 && r.right <= v.right + 1 && r.top >= v.top - 1, img: img && [img.naturalWidth, img.offsetWidth] }; });
    assert.match(look.text, /Woodcutting 50/); assert.equal(look.pe, 'none', 'it lets every click through'); assert.equal(look.role, 'status');
    assert.ok(look.inView, 'it sits at the top of the page, clear of the menus');
    assert.ok(look.img && look.img[1] % look.img[0] === 0, 'the emblem at a whole-number scale ' + look.img);
    await settle(2400); w = await W(); assert.equal(w.n, 0, 'and leaves on its own'); assert.equal(w.showing, null);
    s0 = w.stats;
    await untouched('several level-ups at once', () => { DQ.weight.levelUp('skill', 'mining', 25); DQ.weight.levelUp('hero', null, 10); DQ.weight.levelUp('skill', 'fishing', 51); }, 0);
    await p.waitForTimeout(200); w = await W();
    assert.equal(w.stats.chimes - s0.chimes, 1, 'one moment'); assert.equal(w.stats.titles - s0.titles, 1); assert.deepEqual([w.showing.id, w.showing.level], ['mining', 25], 'for the biggest');
    await p.evaluate(() => DQ.weight.hurry()); await p.waitForTimeout(100);
    assert.equal((await W()).n, 0, 'a key or click finishes it');
    /* a real level-up from XP: the engine's own event */
    s0 = (await W()).stats;
    await p.evaluate(() => { DQ.addXp('woodcutting', DQ.data.XPF[10] - DQ.S.xp.woodcutting + 1, { raw: true }); });
    await p.waitForTimeout(300); w = await W();
    assert.deepEqual([w.showing && w.showing.id, w.showing && w.showing.level], ['woodcutting', 10], 'a real level 10 gets its moment: ' + JSON.stringify(w));
    assert.equal(w.stats.sounds.milestone1, 1, 'with its chord');
    await settle(2200);

    /* ---- finds ---- */
    await p.evaluate(() => { DQ.paused = false; DQ.go('woodcutting'); DQ.startAct('wood', DQ.data.NODES.wood[0].id); DQ.ui.render(true); });
    await p.waitForTimeout(800); await p.evaluate(() => { DQ.paused = true; }); await p.waitForTimeout(900);
    s0 = (await W()).stats;
    const find = await p.evaluate(() => new Promise(res => { const seen = new Set(); const mo = new MutationObserver(r => r.forEach(x => x.addedNodes.forEach(n => n.nodeType === 1 && seen.add(n.className)))); mo.observe(document.body, { childList: true, subtree: true });
      const id = DQ.act.id; DQ.grant(DQ.data.NODE['wood:' + id].item, 1); DQ.grant('gem_diamond', 1); window.__a = window.__snap(); DQ.emit('workcycle', { kind: 'wood', id, quantity: 1 });
      setTimeout(() => { mo.disconnect(); res([...seen]); }, 1500); }));
    assert.ok(find.some(c => /gain-fly glint glint-3/.test(c)), 'the diamond flies with an epic glint: ' + find.join(' | '));
    assert.ok(find.includes('lw-find-light'), 'it lights the work scene');
    assert.ok(find.some(c => /lw-moment find/.test(c)), 'the rarest gets a title');
    await settle(1600);
    assert.equal(await p.evaluate(() => window.__snap()), await p.evaluate(() => window.__a), 'a find: the save is unchanged while it plays');
    w = await W(); assert.equal(w.stats.sounds.find3 - (s0.sounds.find3 || 0), 1, 'with the longest chime');
    assert.equal(await p.evaluate(() => document.querySelectorAll('.lw-find-light,.gain-fly,.lw-moment').length), 0, 'everything has finished');
    /* an uncommon find: a glint and a chime, no light */
    s0 = w.stats; await p.evaluate(() => DQ.weight.find('gem_sapphire', .03)); w = await W();
    assert.equal(w.stats.lights, s0.lights, 'uncommon: no light'); assert.equal(w.stats.sounds.find1, 1);
    await p.evaluate(() => { DQ.stopAct(true); });

    /* ---- sales ---- */
    await p.evaluate(() => { DQ.give('gem_diamond', 60); DQ.give('gem_sapphire', 3); DQ.go('character'); DQ.ui.sel = 'gem_sapphire'; DQ.ui.selFrom = 'pack'; DQ.ui.render(true); });
    await p.waitForTimeout(300);
    s0 = (await W()).stats;
    const c0 = await p.evaluate(() => DQ.S.coins);
    await p.locator('#view button[data-do="sell"][data-b="1"]:visible').first().click();
    const c1 = await p.evaluate(() => DQ.S.coins); assert.ok(c1 > c0, 'the sale is made on the click');
    const coins1 = await p.evaluate(() => document.querySelectorAll('.lw-coin').length);
    w = await W(); assert.equal(w.stats.sales - s0.sales, 1); assert.ok(coins1 >= 1 && coins1 <= 3, 'a small sale drops a coin or three: ' + coins1);
    const snapSale = await p.evaluate(() => window.__snap()); await settle(1000);
    assert.equal(await p.evaluate(() => window.__snap()), snapSale, 'a sale: the save is unchanged while the coins fall');
    assert.equal(await p.evaluate(() => document.querySelectorAll('.lw-coin').length), 0, 'the coins land');
    /* a big sale (hold to confirm), then a second sale mid-effect */
    await p.evaluate(() => { DQ.ui.sel = 'gem_diamond'; DQ.ui.render(true); });
    const big = p.locator('#view button[data-do="sell"][data-b="keep1"]:visible').first(), bb = await big.boundingBox();
    await p.mouse.move(bb.x + bb.width / 2, bb.y + bb.height / 2); await p.mouse.down(); await p.waitForTimeout(720); await p.mouse.up();
    await p.waitForTimeout(80);
    w = await W(); const last = await p.evaluate(() => DQ.weight.log.filter(x => x.type === 'sale').pop());
    assert.equal(last.band, 3, 'a big sale is the top band: ' + JSON.stringify(last)); assert.equal(last.drop, 8, 'eight coins');
    assert.ok(await p.evaluate(() => document.querySelectorAll('.lw-coin').length) >= 1, 'coins in the air');
    const before2 = await p.evaluate(() => DQ.S.coins);
    await p.locator('#view button[data-do="sell"][data-b="1"]:visible').first().click();
    const after2 = await p.evaluate(() => [DQ.S.coins, DQ.weight.log.filter(x => x.type === 'sale').length]);
    assert.ok(after2[0] > before2, 'a second sale mid-effect sells at once');
    assert.ok(await p.evaluate(() => DQ.weight.stats.hurried) > w.stats.hurried, 'and the click finished the falling coins');
    await settle(1000);
    /* Sell all junk: one answer for the whole gesture */
    s0 = (await W()).stats;
    await p.evaluate(() => { const junk = Object.keys(DQ.data.ITEMS).filter(id => DQ.data.ITEMS[id].type === 'junk' && DQ.sellable(id)).slice(0, 3); junk.forEach(id => DQ.give(id, 4)); DQ.sellJunk(); });
    await p.waitForTimeout(50); w = await W(); assert.equal(w.stats.sales - s0.sales, 1, 'selling all junk is one sale');
    const clunks = st => Object.entries(st.sounds).filter(([k]) => /^sale\d$/.test(k)).reduce((a, [, v]) => a + v, 0);
    assert.equal(clunks(w.stats) - clunks(s0), 1, 'with one clunk');

    /* ---- blows ---- */
    await p.evaluate(() => { DQ.paused = false; DQ.go('combat'); DQ.startAct('fight', 'goblin', { quiet: true }); DQ.ui.render(true); });
    await p.waitForFunction(() => DQ.fight && document.getElementById('av-foe'), null, { timeout: 8000 });
    await p.evaluate(() => { DQ.paused = true; }); await p.waitForTimeout(1500);
    s0 = (await W()).stats;
    const crit = await p.evaluate(() => new Promise(res => { const f = DQ.fight, m = DQ.data.MON[f.id]; let paused = 0; const a = window.__snap();
      DQ.splat('foe', Math.max(1, Math.round(m.hp * .4)), 'hit power', 180);
      const t0 = performance.now(), iv = setInterval(() => { const n = [document.getElementById('av-foe'), document.getElementById('av-you')].flatMap(e => e ? e.getAnimations({ subtree: true }) : []).filter(x => x.playState === 'paused').length; paused = Math.max(paused, n);
        if (performance.now() - t0 > 1400) { clearInterval(iv); res({ paused, same: window.__snap() === a, page: document.querySelectorAll('body *').length > 0 && document.documentElement.getAnimations().filter(x => x.playState === 'paused').length }); } }, 4); }));
    w = await W();
    assert.equal(w.stats.hits - s0.hits, 1); assert.equal(w.stats.sounds.crit, 1, 'a crit lands with a heavier sound');
    assert.equal(w.stats.stops - s0.stops, 1, 'a hit-stop'); assert.ok(crit.paused > 0, 'it holds the stage sprites'); assert.ok(crit.same, 'a crit: the save is unchanged');
    const stopLog = await p.evaluate(() => DQ.weight.log.filter(x => x.type === 'hit').pop()); assert.ok(stopLog.stop < .08, 'under 80 ms');
    /* a killing blow: the first splat that leaves the creature at 0 */
    const kill = await p.evaluate(() => { const f = DQ.fight, hp = f.hp, n0 = DQ.weight.log.filter(x => x.type === 'hit').length; f.hp = 0;
      DQ.splat('foe', 3, 'hit ', 180); const first = DQ.weight.hitOf('foe', 3, 'hit '); let after = null; DQ.on('splat', (s, t, k) => { if (t === 1) after = DQ.weight.hitOf(s, t, k); }); DQ.splat('foe', 1, 'hit ', 300); f.hp = hp;
      const L = DQ.weight.log.filter(x => x.type === 'hit'); return { n: L.length - n0, tier: L[L.length - 1].tier, after: after && after.tier }; });
    assert.deepEqual(kill, { n: 1, tier: 'kill', after: 'big' }, 'the killing blow lands harder; a splash after it is not a second kill');
    await p.waitForTimeout(900);
    /* titles wait for the fight to end */
    await p.evaluate(() => { DQ.paused = false; }); await p.waitForTimeout(200);
    await p.evaluate(() => DQ.weight.levelUp('skill', 'melee', 25)); await p.waitForTimeout(100);
    w = await W(); assert.equal(w.n, 0, 'no title over a fight on the stage'); assert.deepEqual(w.queued.map(q => q.level), [25], 'it waits');
    await p.evaluate(() => { DQ.stopAct(true); }); await p.waitForTimeout(300);
    w = await W(); assert.equal(w.showing && w.showing.level, 25, 'and shows when the fight ends');
    await p.evaluate(() => DQ.weight.hurry());

    /* ---- 3: a click mid-title changes page at once ---- */
    await p.evaluate(() => { DQ.go('overview'); DQ.ui.render(true); DQ.weight.levelUp('skill', 'fishing', 75); }); await p.waitForTimeout(300);
    assert.equal((await W()).n, 1);
    await p.locator('#topnav .tnav[data-a="quests"]').click();
    assert.equal(await p.evaluate(() => DQ.ui.view), 'quests', 'the click went through at once');
    assert.equal((await W()).n, 0, 'and finished the title');

    /* ---- pop-ups queue a title ---- */
    await p.evaluate(() => { DQ.modal({ title: 'A note', body: '<p>Hello</p>' }); DQ.weight.levelUp('skill', 'mining', 90); }); await p.waitForTimeout(150);
    w = await W(); assert.equal(w.n, 0, 'never over a pop-up'); assert.equal(w.queued.length, 1);
    await p.evaluate(() => DQ.closeModal()); await p.waitForTimeout(600);
    w = await W(); assert.deepEqual([w.showing && w.showing.id, w.n], ['mining', 1], 'shown once the pop-up closes');
    await p.evaluate(() => DQ.weight.hurry());

    /* ---- the game's rolls were never touched ---- */
    const own = await p.evaluate(() => window.__rng.length);
    assert.equal(own, 0, 'no weighted effect draws from Math.random: ' + (await p.evaluate(() => window.__rng.slice(0, 2).join('\n---\n'))));

    /* ---- 4: Reduce effects ---- */
    await p.evaluate(() => { DQ.S.settings.reduceFx = true; document.documentElement.classList.add('calm'); DQ.go('woodcutting'); DQ.ui.render(true); });
    s0 = (await W()).stats;
    await p.evaluate(() => DQ.weight.levelUp('skill', 'cooking', 50)); await p.waitForTimeout(300);
    const still = await p.evaluate(() => { const el = document.querySelector('.lw-moment'); return el && { anims: el.getAnimations({ subtree: true }).length, op: getComputedStyle(el).opacity, text: el.textContent.trim(), still: DQ.weight.showing().still }; });
    assert.ok(still && still.anims === 0 && still.op === '1' && still.still, 'the title stands complete and still: ' + JSON.stringify(still)); assert.match(still.text, /Cooking 50/);
    await p.evaluate(() => DQ.weight.hurry());
    await p.evaluate(() => { DQ.weight.sale(50000); DQ.weight.find('gem_diamond', .0004); DQ.weight.hit({ dealt: 9, kind: 'hit power', foeMax: 10 }); }); await p.waitForTimeout(50);
    w = await W();
    assert.equal(await p.evaluate(() => document.querySelectorAll('.lw-coin,.lw-find-light').length), 0, 'no coins and no light move');
    assert.equal(w.stats.coins, s0.coins); assert.equal(w.stats.lights, s0.lights); assert.equal(w.stats.stops, s0.stops);
    assert.ok(w.stats.sounds.sale3 > (s0.sounds.sale3 || 0) && w.stats.sounds.find3 > s0.sounds.find3, 'the sounds still answer');
    await p.evaluate(() => { DQ.weight.hurry(); DQ.S.settings.reduceFx = false; document.documentElement.classList.remove('calm'); });

    /* ---- 5: nothing in a simulation, a forecast or a hidden window ---- */
    s0 = (await W()).stats;
    const simLv = await p.evaluate(() => { DQ.startAct('fish', 'shrimp', { quiet: true }); const lv = DQ.lvl('fishing'); DQ.simulate(3 * 3600e3, 3 * 3600e3); const lv2 = DQ.lvl('fishing'); DQ.stopAct(true); return [lv, lv2]; });
    assert.ok(simLv[1] > simLv[0], 'the simulation crossed levels ' + simLv);
    await p.evaluate(() => DQ.forecast && DQ.forecast('goblin'));
    await p.evaluate(() => { Object.defineProperty(document, 'hidden', { configurable: true, get: () => true }); try { DQ.weight.levelUp('skill', 'fishing', 99); DQ.weight.sale(500); DQ.weight.find('gem_diamond', .0004); } finally { delete document.hidden; } });
    await p.waitForTimeout(100); w = await W();
    for (const k of ['chimes', 'titles', 'sales', 'finds', 'hits', 'queued']) assert.equal(w.stats[k], s0[k], `nothing (${k}) from time away, a forecast or a hidden window`);

    /* ---- 6: peaks below -1 dBFS ---- */
    const peaks = await p.evaluate(async () => { const out = {}; for (const n of DQ.sfxNames().filter(n => /^(lvchime|milestone|find|sale)\d$|^(crit|killblow)$/.test(n))) out[n] = await DQ.sfxPeak(n, { seconds: 4 }); return out; });
    const names = Object.keys(peaks); assert.equal(names.length, 6 + 6 + 3 + 4 + 2, 'every weighted sound: ' + names);
    for (const [n, r] of Object.entries(peaks)) { assert.ok(r.dbfs < -1, `${n} peaks below -1 dBFS (${r.dbfs.toFixed(1)})`); assert.ok(r.dbfs > -40, `${n} is audible (${r.dbfs.toFixed(1)} dBFS)`); }
    console.log('peaks (dBFS at full volume): ' + Object.entries(peaks).map(([n, r]) => `${n} ${r.dbfs.toFixed(1)}`).join(', '));
    assert.equal(await p.evaluate(() => window.__rng.length), 0, 'still no draws from Math.random');

    assert.deepEqual(errors, [], 'no page errors');
    console.log('PASS polish weight (browser)');
  } finally { await b.close(); }
})().catch(e => { console.error(e); process.exit(1); });
