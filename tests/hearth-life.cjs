/* The hearth fills up and the town reacts (owner, 27 Nov 2026: "Let's do all 15", items 8 to 10):
   1 the room shows what the save holds: a trophy per boss beaten (dated from S.trophies), the named weapons you own on
     the rack (a full row ends in "+N"), museum pieces on the shelf and a basket per beast you keep; each opens its page
   2 letters: none before anyone is met or in the first 20 minutes of play, then one per 45-90 minutes of play, at most
     three waiting; written by a giver you have met, true for the save; kept in the save, opened on parchment from the
     desk and filed under Letters in the Journal
   3 finishing a restoration gathers the townsfolk round the site for about a minute
   4 quest givers walk their town only once you have met them, with their name on hover
   5 under Reduce effects nothing walks or cheers, and the room keeps its keepsakes */
const assert = require('node:assert/strict');
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined }); const errors = [];
  try {
    const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
    p.on('pageerror', e => errors.push(e.message));
    await p.addInitScript(() => localStorage.setItem('idlewick.hearth', '1'));
    await p.goto(process.env.IDLEWICK_URL || 'http://127.0.0.1:8765/');
    await p.locator('#t-new').click(); await p.locator('#cr-go').click();
    await p.waitForFunction(() => DQ.started && document.querySelector('#title').hidden);
    await p.evaluate(() => { for (let i = 0; i < 12; i++) DQ.closeModal(); DQ.S.settings.notify = false; DQ.paused = true; DQ.go('overview'); DQ.ui.render(true); });
    await p.waitForFunction(() => DQ.hearthLive() && DQ.hearthLive().src, null, { timeout: 8000 });
    const fresh = await p.evaluate(() => DQ.hearthLive().spots);
    assert.ok(!fresh.some(k => /^(trophy|rack|bed|wing|relic|curio):/.test(k)) && !fresh.includes('letter'), 'a new hero\'s room is bare: ' + fresh);

    /* 2 letters: nobody met yet, so none however long you play */
    const none = await p.evaluate(() => { for (let i = 0; i < 12 * 60; i++) DQ.letterTick(5000); return DQ.S.letters.list.length; });
    assert.equal(none, 0, 'no letters before you have met anyone');
    await p.evaluate(() => { DQ.S.letters = null; DQ.startQuest('first_steps'); DQ.startQuest('goblin_menace'); });
    const clock = await p.evaluate(() => { const out = [], tick = min => { for (let i = 0; i < min * 12; i++) DQ.letterTick(5000); };
      tick(15); out.push(DQ.S.letters.list.length); /* 15 minutes: nothing yet */
      let t = 15; while (!DQ.S.letters.list.length && t < 60) { tick(1); t++; } out.push(t);
      let u = 0; const n1 = DQ.S.letters.list.length; while (DQ.S.letters.list.length === n1 && u < 120) { tick(1); u++; } out.push(u);
      tick(400); out.push(DQ.S.letters.list.length, DQ.lettersWaiting().length);
      return { out, letters: DQ.S.letters.list, met: DQ.folkMet().map(f => f.id) }; });
    assert.equal(clock.out[0], 0, 'nothing in the first 15 minutes');
    assert.ok(clock.out[1] >= 20 && clock.out[1] <= 46, 'the first letter after 20-45 minutes of play: ' + clock.out[1]);
    assert.ok(clock.out[2] >= 45 && clock.out[2] <= 91, 'the next 45-90 minutes later: ' + clock.out[2]);
    assert.equal(clock.out[3], 3, 'at most three waiting'); assert.equal(clock.out[4], 3);
    for (const l of clock.letters) { assert.ok(clock.met.includes(l.from), 'written by someone you have met: ' + l.from); assert.ok(l.hi && l.bye && l.text, 'in their voice'); }
    assert.ok(clock.letters.some(l => l.kind !== 'gossip'), 'a tip among them');
    /* with the well's logs in the pack, a tip says so, from the person who asked for it */
    const tip = await p.evaluate(() => { DQ.S.letters.list = []; DQ.give('log_normal', 20); return { l: DQ.letterWrite({ force: true, kind: 'project' }), state: DQ.projectState('well') }; });
    assert.equal(tip.state, 'ready'); assert.equal(tip.l.kind, 'project'); assert.equal(tip.l.from, 'wren', 'Wren writes about her well');
    assert.match(tip.l.text, /the village well in Willowbrook/, 'a tip true for the save: ' + tip.l.text);
    await p.evaluate(() => { DQ.go('overview'); DQ.ui.render(true); }); await p.waitForSelector('.hearth-spot.hearth-letter');
    const saved = await p.evaluate(() => { DQ.save(); const raw = JSON.parse(localStorage.getItem(Object.keys(localStorage).find(k => (localStorage.getItem(k) || '').includes('"letters"')))); return raw.letters.list.length; });
    assert.ok(saved >= 1, 'letters are kept in the save');
    await p.click('.hearth-spot.hearth-letter');
    const opened = await p.evaluate(() => { const m = document.querySelector('.modal .letter-paper'); return { text: m && m.innerText, read: DQ.S.letters.list.filter(l => l.read).length }; });
    assert.ok(opened.text && opened.text.includes(tip.l.text), 'the letter opens on parchment: ' + opened.text);
    assert.equal(opened.read, 1, 'opening it marks it read');
    await p.evaluate(() => { DQ.closeModal(); DQ.go('journal'); });
    const filed = await p.evaluate(() => [...document.querySelectorAll('.letters-panel .letter-row')].map(r => r.innerText));
    assert.equal(filed.length, 1, 'the Journal keeps the letter'); assert.ok(filed[0].includes(tip.l.text.slice(0, 20)));

    /* 1 keepsakes from save state */
    await p.evaluate(() => { const D = DQ.data, S = DQ.S;
      for (const t of D.TOWNS.slice(0, 2)) { S.towns[t.id] = { visited: true, boss: true }; }
      S.trophies = { grubnash: Date.UTC(2026, 10, 27, 12) };
      for (const id of D.RARE_WEAPONS.slice(0, 6)) DQ.give(id, 1);
      for (const id of ['bubbles', 'acorn', 'whiskers']) S.pets.owned[id] = { bondXp: 0 }; S.pets.active = 'whiskers';
      DQ.give('star_shard', 1); DQ.museumCurio('star'); DQ.museumScan({ quiet: true });
      DQ.go('overview'); DQ.ui.render(true); });
    await p.waitForFunction(() => DQ.hearthLive() && DQ.hearthLive().key.includes('trophy:oldtusk'), null, { timeout: 8000 });
    const room = await p.evaluate(() => { const H = document.querySelector('.hearth'), tip = k => (H.querySelector(`.hearth-spot[data-spot="${k}"]`) || {}).dataset?.tip || '';
      return { spots: DQ.hearthLive().spots, tusk: tip('trophy:grubnash'), old: tip('trophy:oldtusk'), more: (H.querySelector('.hearth-spot[data-spot="rack:more"] .hearth-more') || {}).textContent, scale: DQ.hearthLive().scale }; });
    for (const k of ['trophy:grubnash', 'trophy:oldtusk', 'rack:more', 'bed:bubbles', 'bed:acorn', 'relic:star_shard', 'curio:star']) assert.ok(room.spots.includes(k), 'keepsake ' + k + ' in ' + room.spots);
    assert.ok(!room.spots.includes('bed:whiskers'), 'the companion with you sleeps on the rug, not in a basket');
    assert.equal(room.spots.filter(k => k.startsWith('rack:')).length, 4, 'four slots on the rack'); assert.equal(room.more, '+3', 'the rest summarised');
    assert.match(room.tusk, /Grubnash’s tusk · beaten 27 Nov/); assert.match(room.old, /Old Tusk’s other tusk · beaten$/);
    const opens = [];
    for (const [k, want] of [['trophy:grubnash', 'modal'], ['rack:more', 'character'], ['relic:star_shard', 'museum'], ['bed:acorn', 'beastmastery']]) {
      await p.evaluate(() => { DQ.closeModal(); DQ.go('overview'); DQ.ui.render(true); }); await p.waitForSelector(`.hearth-spot[data-spot="${k}"]`);
      await p.click(`.hearth-spot[data-spot="${k}"]`); await p.waitForTimeout(150);
      opens.push(await p.evaluate(w => w === 'modal' ? !!document.querySelector('.modal') : DQ.ui.view === w, want));
    }
    assert.deepEqual(opens, [true, true, true, true], 'each keepsake opens its page (guide, backpack, museum, pen)');
    assert.equal(await p.evaluate(() => DQ.ui.museumSel), 'r:star_shard', 'the museum opens on that piece');
    await p.evaluate(() => DQ.closeModal());

    /* 4 givers walk only once met */
    const walk = await p.evaluate(() => { DQ.S.settings.homeView = 'town'; DQ.go('overview'); DQ.ui.render(true); return new Promise(r => setTimeout(() => r(DQ.townWalkersLive()[0]), 1200)); });
    const metHere = await p.evaluate(() => DQ.folkMet().filter(f => f.town === DQ.S.town).map(f => f.id).sort());
    assert.deepEqual(walk.givers.map(g => g.id).sort(), metHere, 'the givers you have met walk their town');
    assert.ok(!walk.givers.some(g => g.id === 'mabel'), 'Mabel is not met yet, so she stays indoors');
    assert.equal(walk.tags, metHere.length, 'one hover target each');
    assert.ok(walk.givers.every(g => [162, 163, 244, 245].includes(g.y)), 'on the roads');
    const tag = await p.evaluate(() => document.querySelector('.town-giver[data-a="Elder Wren"]')?.dataset.tip);
    assert.equal(tag, 'text:Elder Wren · Village elder');
    await p.evaluate(() => { DQ.S.q.hungry_cook = { s: 'active', p: DQ.data.QM.hungry_cook.obj.map(() => 0) }; });
    await p.evaluate(() => DQ.ui.render(true)); await p.waitForTimeout(300);
    assert.ok(await p.evaluate(() => DQ.townWalkersLive()[0].givers.some(g => g.id === 'mabel')), 'meeting Mabel brings her out');

    /* 3 a finished restoration gathers a crowd */
    const cheer = await p.evaluate(() => { DQ.S.coins = Math.max(DQ.S.coins, 100); DQ.go('projects'); const ok = DQ.finishProject('well'); DQ.ui.render(true); return ok; });
    assert.ok(cheer, 'the well was finished');
    await p.waitForFunction(() => DQ.townWalkersLive().some(l => l.cheer && l.cheer.id === 'well'), null, { timeout: 5000 });
    const px = await p.evaluate(() => { const cv = document.querySelector('.village-scene canvas.town-walkers'), s = DQ.pixelArt.siteLayout(DQ.S.town).find(x => x.id === 'well'), d = cv.getContext('2d').getImageData(s.X - 14, s.Y + 22, 64, 24).data; let n = 0; for (let i = 3; i < d.length; i += 4) if (d[i]) n++; return n; });
    assert.ok(px > 60, 'townsfolk stand in front of the site: ' + px);
    const gone = await p.evaluate(() => { DQ.townCheer.at -= 61000; return new Promise(r => setTimeout(() => r(DQ.townWalkersLive().some(l => l.cheer)), 300)); });
    assert.equal(gone, false, 'and go home after a minute');

    /* 5 calm */
    await p.evaluate(() => { DQ.S.settings.reduceFx = true; DQ.S.settings.homeView = 'town'; DQ.go('overview'); DQ.ui.render(true); }); await p.waitForTimeout(300);
    assert.equal(await p.locator('canvas.town-walkers').count(), 0, 'nothing walks under calm'); assert.equal(await p.locator('.town-giver').count(), 0, 'no giver targets under calm');
    await p.evaluate(() => { DQ.S.settings.homeView = 'hearth'; DQ.go('overview'); DQ.ui.render(true); });
    await p.waitForFunction(() => DQ.hearthLive() && DQ.hearthLive().src);
    assert.ok(await p.evaluate(() => DQ.hearthLive().spots.includes('trophy:grubnash')), 'the keepsakes stay under calm');
    assert.deepEqual(errors, []);
    console.log('PASS hearth-life: keepsakes from the save open their pages, letters keep their clock and cap, open and file in the Journal, a finished site draws a crowd, givers walk once met, calm holds still');
  } finally { await b.close(); }
})().catch(e => { console.error(e); process.exit(1); });
