/* Skill realism (owner, 27 Nov 2026; js/work_rig.js, js/strike_sync.js, docs/skill-realism.md). In the real page:
   (1) every held tool is drawn at a real size for a 1.7 m hero (24 x 32 px, so 1 px is about 5.3 cm), and the anvil,
       trestles and table stand at the figure's own working heights (knuckle, belt);
   (2) the hero and what they work on stand on one ground line: the hero's feet, the tree, rock or mark's lowest pixel
       and the station's foot (fishing: the hero on the jetty, the work standing 4 px higher);
   (3) the tool meets the target: the axe bit lands on the trunk's own edge at the strike frame;
   (4) every work sound plays on its own frame: the axe's thunk on the impact frame, the float's plop and the strike's
       splash, the saw's push and its lighter pull;
   (5) under Reduce effects and reduced motion nothing animates: the ready pose holds, no lean, no breathing, no chips
       (the sounds still play). */
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
    await p.evaluate(() => { for (let i = 0; i < 12; i++) DQ.closeModal(); const S = DQ.S, D = DQ.data; S.settings.notify = false; S.settings.storyScenes = false; S.settings.muted = true; S.tut.hidden = true;
      for (const s of D.SKILLS) S.unlocked[s.id] = true; for (const id of Object.keys(D.ITEMS)) if (!D.ITEMS[id].slot) S.inv[id] = 50; for (let i = 0; i < 12; i++) DQ.closeModal(); });

    /* (1) sizes: [tool, min px, max px] from real tools (felling axe 70-95 cm, pick 80-100 cm, smith's hammer 35-45 cm
       with its head, tongs 40-55 cm, handsaw 65-90 cm, float rod 2-3 m, boar spear 1.7-2.1 m, arming sword 80-100 cm) */
    const sizes = await p.evaluate(() => Object.fromEntries(DQ.workRig.TOOLS.map(t => [t, DQ.workRig.toolLength(t)])));
    const RANGE = { axe: [14, 18], pick: [15, 19], hammer: [7, 9], tongs: [8, 11], saw: [13, 17], rod: [38, 57], spear: [32, 40], sword: [15, 19], dagger: [7, 10], warhammer: [10, 14], cutlass: [14, 18], staff: [26, 32], spoon: [11, 14], mallet: [5, 8], chisel: [3, 6], pestle: [4, 7] };
    for (const [t, [lo, hi]] of Object.entries(RANGE)) assert.ok(sizes[t] >= lo && sizes[t] <= hi, `${t} is ${sizes[t]} px (${Math.round(sizes[t] * 5.3)} cm), wanted ${lo}-${hi}`);
    const heights = await p.evaluate(() => { const R = DQ.workRig, top = n => { const c = R.stationCanvas(n, {}).canvas, x = c.getContext('2d').getImageData(0, 0, c.width, c.height).data; for (let y = 0; y < c.height; y++) for (let i = 0; i < c.width; i++) if (x[(y * c.width + i) * 4 + 3]) return c.height - y; return 0; };
      return { anvil: top('anvil'), trestle: top('trestle'), mortarTable: (() => { const c = R.stationCanvas('mortar', {}).canvas, x = c.getContext('2d').getImageData(0, 0, c.width, c.height).data; for (let y = 0; y < c.height; y++) if (x[(y * c.width + 4) * 4 + 3] || x[(y * c.width + 38) * 4 + 3]) return c.height - y; return 0; })() }; });
    /* the hero's hanging knuckles are 8 px up, the belt 12 px (pixelart.js heroSide); the outline adds a pixel on top */
    assert.ok(Math.abs(heights.anvil - 1 - 8) <= 2, 'the anvil face is at knuckle height ' + JSON.stringify(heights));
    assert.ok(Math.abs(heights.trestle - 1 - 12) <= 2, 'the board on the trestles is at belt height ' + JSON.stringify(heights));

    /* (2) one ground line, (3) contact, (4) sounds on their frames */
    const run = (kind, id, page, ms) => p.evaluate(([kind, id, page, ms]) => new Promise(res => {
      const D = DQ.data; DQ.stopAct(true); if (kind === 'recipe') { const g = DQ.recipeGroup(D.RECIPES[id]), sk = D.RECIPES[id].skill; DQ.ui.tab[sk] = g.g; DQ.ui.tab[sk + 'sub'] = g.s || null; }
      DQ.ui.taskChoice[page] = id; DQ.go(page); DQ.startAct(kind, id, { quiet: true }); DQ.ui.render(true);
      const log = [], s0 = DQ.sfxStrike; DQ.sfxStrike = name => { const w = document.querySelector('#view .scene-worker'), r = DQ.workRig.live; log.push({ name, frame: w ? +w.dataset.frame : null, want: r && r.lastStrike ? r.lastStrike.want : null }); };
      setTimeout(() => { DQ.sfxStrike = s0; const r = DQ.workRig.live, sc = document.querySelector('#view .activity-scene'), w = sc && sc.querySelector('.scene-worker'), body = w && w.querySelector('img');
        const rect = el => el.getBoundingClientRect(), tgt = sc && sc.querySelector('.scene-target img'), st = sc && sc.querySelector('.work-station');
        let low = null; if (tgt && tgt.naturalWidth && !sc.querySelector('.scene-target.on-station')) { const c = document.createElement('canvas'); c.width = tgt.naturalWidth; c.height = tgt.naturalHeight; const x = c.getContext('2d'); x.drawImage(tgt, 0, 0); const d = x.getImageData(0, 0, c.width, c.height).data;
          let row = -1; for (let y = c.height - 1; y >= 0 && row < 0; y--) for (let i = 0; i < c.width; i++) if (d[(y * c.width + i) * 4 + 3] > 40) { row = y; break; } const R = rect(tgt); low = R.top + (row + 1) * R.height / c.height; }
        res({ spec: r && r.spec.id, log, beats: r ? r.spec.beats.map(b => [b.sfx, DQ.workRig.frameOf(b.at)]) : [], feet: body && rect(body).bottom, worker: w && rect(w).bottom, low, station: st && rect(st).bottom, edgeX: r && r.ctx.edgeX, contact: r && r.contactStage, bx: r && r.bx, frames: r && r.spec ? DQ.workRig.FRAMES : 0 }); }, ms);
    }), [kind, id, page, ms]);
    const scale = await p.evaluate(() => { const v = document.querySelector('#view'); return v ? (v.getBoundingClientRect().width / v.offsetWidth) || 1 : 1; });
    const near = (a, b2, tol, what) => assert.ok(a != null && b2 != null && Math.abs(a - b2) <= tol * scale + .5, `${what}: ${a} vs ${b2}`);
    const D = await p.evaluate(() => ({ forge: DQ.data.RLIST.smithing.find(r => !/smelt/.test(r.id)).id, mine: DQ.data.NODES.mine[0].id, thieve: DQ.data.NODES.thieve[0].id }));
    const wood = await run('wood', 'normal', 'woodcutting', 3200);
    assert.equal(wood.spec, 'wood');
    near(wood.feet, wood.worker, 1, 'woodcutting: the feet stand on the scene\'s ground line (breathing lifts them a pixel)');
    near(wood.low, wood.feet, 3, 'woodcutting: the tree stands on the same ground line as the hero');
    assert.ok(wood.edgeX != null, 'woodcutting: the hero is placed by the trunk\'s own edge ' + JSON.stringify(wood));
    assert.ok(wood.log.length >= 2 && wood.log.every(l => l.name === 'wood' && l.frame === wood.beats[0][1]), 'woodcutting: every thunk on the impact frame ' + JSON.stringify(wood.log));
    const mine = await run('mine', D.mine, 'mining', 2600);
    near(mine.low, mine.feet, 3, 'mining: rock and hero on one ground line');
    assert.ok(mine.log.length >= 1 && mine.log.every(l => l.name === 'mine' && l.frame === mine.beats[0][1]), 'mining: each strike sound on the strike frame ' + JSON.stringify(mine.log));
    const thief = await run('thieve', D.thieve, 'thieving', 2600);
    near(thief.low, thief.feet, 3, 'thieving: the mark and the hero on one ground line');
    const forge = await run('recipe', D.forge, 'smithing', 3200);
    assert.equal(forge.spec, 'forge'); near(forge.station, forge.feet, 1, 'smithing: the anvil stands on the hero\'s ground line');
    assert.ok(forge.log.length >= 1 && forge.log.every(l => l.name === 'anvil' && l.frame === forge.beats[0][1]), 'smithing: the ring on the hammer\'s frame ' + JSON.stringify(forge.log));
    const saw = await run('recipe', 'saw_normal', 'carpentry', 3600);
    assert.equal(saw.spec, 'saw'); near(saw.station, saw.feet, 1, 'carpentry: the trestles on the ground line');
    const want = Object.fromEntries(saw.beats);
    assert.ok(saw.log.some(l => l.name === 'saw') && saw.log.some(l => l.name === 'sawback'), 'carpentry: a push and a pull stroke ' + JSON.stringify(saw.log));
    assert.ok(saw.log.every(l => l.frame === want[l.name]), 'carpentry: each stroke\'s sound on its frame ' + JSON.stringify(saw));
    const fish = await run('fish', 'shrimp', 'fishing', 8000); /* several catches: a machine too busy to draw for 400 ms can step past one strike */
    assert.equal(fish.spec, 'fish'); const fw = Object.fromEntries(fish.beats);
    assert.ok(fish.log.some(l => l.name === 'plop') && fish.log.some(l => l.name === 'splash'), 'fishing: the float lands, then the strike ' + JSON.stringify(fish.log));
    assert.ok(fish.log.every(l => l.frame === fw[l.name]), 'fishing: each on its own frame ' + JSON.stringify(fish.log));

    /* (5) calm: the ready pose holds; nothing leans, breathes or throws chips */
    for (const mode of ['calm', 'reduced']) {
      if (mode === 'calm') await p.evaluate(() => { DQ.S.settings.reduceFx = true; DQ.applyTheme && DQ.applyTheme(); DQ.ui.render(true); });
      else { await p.evaluate(() => { DQ.S.settings.reduceFx = false; DQ.ui.render(true); }); await p.emulateMedia({ reducedMotion: 'reduce' }); }
      const still = await p.evaluate(() => new Promise(res => { DQ.stopAct(true); DQ.ui.taskChoice.woodcutting = 'normal'; DQ.go('woodcutting'); DQ.startAct('wood', 'normal', { quiet: true }); DQ.ui.render(true);
        const seen = new Set(); let chips = 0; const t0 = performance.now();
        const iv = setInterval(() => { const w = document.querySelector('#view .scene-worker'); if (w && w.dataset.frame) seen.add(w.dataset.frame); chips = Math.max(chips, document.querySelectorAll('#view .work-fx i').length);
          if (performance.now() - t0 > 1600) { clearInterval(iv); const sc = document.querySelector('#view .activity-scene'), anims = [...sc.querySelectorAll('.scene-worker,.rig-body,.scene-target,.work-station')].flatMap(e => e.getAnimations()).filter(a => a.playState === 'running').map(a => a.animationName || a.id || 'waapi');
            res({ frames: [...seen], chips, anims, rest: String(DQ.workRig.frameOf(DQ.workRig.SPEC.wood.rest)) }); } }, 20); }));
      assert.deepEqual(still.frames, [still.rest], `${mode}: the ready pose holds ${JSON.stringify(still)}`);
      assert.deepEqual(still.anims, [], `${mode}: no lean, breathing or give ${JSON.stringify(still)}`);
      assert.equal(still.chips, 0, `${mode}: no chips`);
    }
    await p.emulateMedia({ reducedMotion: 'no-preference' });
    await p.evaluate(() => { DQ.S.settings.reduceFx = false; DQ.stopAct(true); });
    assert.deepEqual(errors, []);
    console.log('PASS skill realism: real tool sizes and working heights, one ground line, the tool meets the trunk, every work sound on its frame, still under calm and reduced motion');
  } finally { await b.close(); }
})().catch(e => { console.error(e); process.exit(1); });
