/* node tests/shape-rule.cjs: the shape rule (owner, 26 Nov 2026), no lines around anything you can't click and only
   navigation outlined (owner, 27 Nov 2026: "I despise seeing physical lines around things"; "Unless it's a menu item to
   navigate, we can just either make it float on over or have a slight backdrop so its obvious it's clickable").
   Checked on every page, in a fight and in the common pop-ups, in both themes at 1440 x 900. Needs the preview server.
   S1  anything you can click (button, [data-do], [role=button], [role=tab], [role=switch], a[href], text fields) wider
       than 20px is an 8px rounded rectangle (all four corners) with no outline that floats: a shadow, or a fill that
       differs from what it sits on (a disabled control may sit flat). Menus too (owner, 27 Nov 2026)
   S2  anything you can't click draws no line around itself: no border on three or more sides (a one-sided divider or
       accent stripe is not an outline), no border at all on a round thing, no outline and no box-shadow ring; the same
       for its ::before and ::after
   S3  inside a control, the control's outline is the only line: no ring round a dot, frame round a portrait or dashed
       label inside it
   ALLOW lists the few genuine exceptions; keep it short and say why.
   VERBOSE=1 prints every offender; PAGES=a,b limits the pages. */
const { chromium } = require('playwright');
const URL = process.env.IDLEWICK_URL || 'http://127.0.0.1:8765/';
/* Exceptions (selectors matched with Element.closest):
   - .site-spot / .tc-room / svg: hotspots drawn on the pixel scenes (Village town scene, the tower cutaway, the SVG map);
     they glow or tint when chosen instead of floating, so the art stays as drawn
   - #av-foe in the combat stage: the creature itself is the hotspot; a box round it would frame the fight
   - .pen-bowl / .pen-flag / .pen-sign / .work-atmosphere / .tower-cutaway / .combat-projectile: drawn scene art and
     effects, whose dark edges are the pixel-art outline, not a frame
   Text fields count as clickable: they take the same 8px outlined shape. */
const ALLOW_CLICK = ['.site-spot', '.tc-room', '.hearth-spot', 'svg', '.encounter-arena #av-foe'];
const ALLOW_FLAT = ['svg', '.tc-room', '.pen-bowl', '.pen-flag', '.pen-sign', '.work-atmosphere', '.tower-cutaway', '.combat-projectile', '#title'];
/* the menus you navigate with keep their outline (css/shape.css lists the same) */
const NAV = '#topnav .tnav,#pagebar button,#pagebar [data-do],#combatnav button,#combatnav [data-do],#skilldock .dk,#dock .dk,.cg-tile,#hud .iconb,#hud .packchip,#hud .h-hero,[role=tab],.tab,.stab,[data-do=hub],[data-do=shopcategory],[data-do=shoptab],[data-do=settingsgroup],[data-do=estatesection],[data-do=toolfamily]';
const problems = [];

const MODALS = {
  unlock: () => { localStorage.setItem('idlewick.reveals', '1'); const n = DQ.S.settings.notify; DQ.S.settings.notify = true; DQ.S.playtime = 10 * 60000; DQ.go('overview'); DQ.ui.render(true); DQ.notify({ kind: 'unlock', key: 'unlock:sailing', title: 'Sailing unlocked', text: 'Boats await.' }); DQ.S.settings.notify = n; localStorage.removeItem('idlewick.reveals'); },
  item: () => DQ.ui.DO.showitem('bread'),
  help: () => { DQ.go('mining'); DQ.ui.render(true); DQ.ui.DO.pagehelp(); },
  bell: () => DQ.openBell(),
  event: () => { DQ.worldInput && DQ.worldInput(); DQ.worldFire(null); },
  story: () => DQ.openStory('story_willowbrook'),
  welcome: () => { const Q = DQ; Q.startAct('fish', 'shrimp', { quiet: true }); const sum = Q.simulate(3600e3, 3600e3, { report: true }); Q.emit('welcome', sum, 3600e3); },
};

(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });
  const errs = [];
  try {
    for (const theme of ['light', 'dark']) {
      const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
      p.on('pageerror', e => errs.push(e.message));
      await p.goto(URL);
      await p.locator('#t-new').click(); await p.locator('#cr-go').click();
      await p.waitForFunction(() => DQ.started && document.querySelector('#title').hidden);
      await p.evaluate(t => {
        for (let i = 0; i < 12; i++) DQ.closeModal();
        const S = DQ.S, D = DQ.data; S.settings.notify = false; S.settings.storyScenes = false; S.tut.prepareCombat = false; DQ.paused = true;
        for (const s of D.SKILLS) { S.unlocked[s.id] = true; S.xp[s.id] = D.XPF[30]; }
        for (const t of ['willowbrook', 'mossbarrow']) S.towns[t] = Object.assign(S.towns[t] || {}, { visited: true, boss: true });
        Object.assign(S.inv, { log_normal: 40, ore_copper: 20, bar_bronze: 6, trout: 10, bread: 10 });
        S.coins = 30000; DQ.setTheme(t);
      }, theme);
      const check = async label => {
        await p.evaluate(() => document.querySelectorAll('#notes > *').forEach(e => e.remove()));
        const out = await p.evaluate(({ AC, AF, NAV }) => {
          const CLICK = 'button,[data-do],[role=button],[role=tab],[role=switch],a[href],input:not([type=checkbox]):not([type=radio]):not([type=range]):not([type=hidden]),textarea';
          const sig = e => e.tagName.toLowerCase() + (e.id ? '#' + e.id : '') + [...e.classList].slice(0, 3).map(c => '.' + c).join('');
          const where = e => { const a = e.parentElement && e.parentElement.closest('[id],[class]'); return a ? sig(a) : ''; };
          const vis = e => { const r = e.getBoundingClientRect(); if (r.width < 3 || r.height < 3 || r.bottom < 0 || r.top > innerHeight || r.right < 0 || r.left > innerWidth) return false; const cs = getComputedStyle(e); return cs.visibility !== 'hidden' && +cs.opacity > 0.05 && !e.closest('[hidden],[aria-hidden=true]'); };
          const alpha = c => { if (!c || c === 'transparent') return 0; const m = c.match(/\(([^)]+)\)/); if (!m) return 1; const v = m[1].split(/[ ,/]+/).filter(Boolean); const a = c.startsWith('color(') ? v[4] : v[3]; return a === undefined ? 1 : parseFloat(a); };
          const sides = cs => ['Top', 'Right', 'Bottom', 'Left'].filter(s => parseFloat(cs[`border${s}Width`]) > 0.5 && !/none|hidden/.test(cs[`border${s}Style`]) && alpha(cs[`border${s}Color`]) > 0.12).length;
          const ring = cs => cs.boxShadow !== 'none' && cs.boxShadow.split(/,(?![^(]*\))/).some(sh => { const col = (sh.match(/(rgba?|color)\([^)]*\)/) || ['rgb(0,0,0)'])[0]; const n = sh.replace(col, '').match(/-?[\d.]+px/g) || []; const [, , blur = 0, spread = 0] = n.map(parseFloat); return spread >= 0.9 && blur <= 3 && alpha(col) > 0.15; });
          const outline = cs => parseFloat(cs.outlineWidth) >= 1 && cs.outlineStyle !== 'none' && alpha(cs.outlineColor) > 0.12;
          const lined = (cs, w, h) => { const sd = sides(cs), rad = parseFloat(cs.borderTopLeftRadius) || 0, round = /%/.test(cs.borderTopLeftRadius) ? parseFloat(cs.borderTopLeftRadius) >= 40 : rad >= Math.min(w, h) / 2 - 1;
            return [sd >= 3 && 'border', round && sd >= 1 && sd < 3 && 'round border', outline(cs) && 'outline', ring(cs) && 'ring'].filter(Boolean).join('+'); };
          const r = { click: [], flat: [], inner: [] };
          const clicks = new Set(document.querySelectorAll(CLICK));
          for (const e of clicks) {
            if (!vis(e) || AC.some(s => e.closest(s))) continue;
            const box = e.getBoundingClientRect(); if (box.width <= 20) continue;
            /* an inner clickable filling its clickable parent is one control: judge the outer one */
            const outer = e.parentElement && e.parentElement.closest(CLICK);
            if (outer) { const o = outer.getBoundingClientRect(); if (Math.abs(o.width - box.width) < 6 && Math.abs(o.height - box.height) < 6) continue; }
            const cs = getComputedStyle(e);
            const rad = ['TopLeft', 'TopRight', 'BottomRight', 'BottomLeft'].map(k => cs[`border${k}Radius`]);
            const okR = rad.every(v => v === '8px');
            let okB, why;
            { /* navigation floats too (owner, 27 Nov 2026: "get rid of all the borders around the menu items") */
              const lined = sides(cs) > 0 || ring(cs) || outline(cs);
              const bg = c => { for (let a = c; a; a = a.parentElement) { const s = getComputedStyle(a); if (alpha(s.backgroundColor) > 0.05) return s.backgroundColor; } return ''; };
              const floats = cs.boxShadow !== 'none' || (alpha(cs.backgroundColor) > 0.05 && cs.backgroundColor !== bg(e.parentElement)) || cs.backgroundImage !== 'none' || e.disabled;
              okB = !lined && floats; why = lined ? ' outlined' : ' does not float (no shadow or fill)';
            }
            if (!okR || !okB) r.click.push(sig(e) + ' < ' + where(e) + (okR ? '' : ' radius=' + [...new Set(rad)].join('/')) + (okB ? '' : why));
          }
          for (const e of document.querySelectorAll('body *:not(script):not(style)')) {
            if (clicks.has(e) || !vis(e) || AF.some(s => e.closest(s))) continue;
            const cs = getComputedStyle(e);
            if (cs.cursor === 'pointer' && !e.closest(CLICK) && !(e.parentElement && getComputedStyle(e.parentElement).cursor === 'pointer')) continue; /* a script-driven control */
            const host = e.closest(CLICK), list = host ? r.inner : r.flat, rect = e.getBoundingClientRect();
            const self = lined(cs, rect.width, rect.height); if (self) list.push(sig(e) + ' [' + self + '] < ' + where(e));
            for (const ps of ['::before', '::after']) { const pc = getComputedStyle(e, ps); if (pc.content === 'none' || pc.display === 'none' || pc.visibility === 'hidden' || +pc.opacity < 0.05) continue; const w = parseFloat(pc.width) || rect.width, h = parseFloat(pc.height) || rect.height; if (w < 3 || h < 3) continue; const l = lined(pc, w, h); if (l) list.push(sig(e) + ps + ' [' + l + '] < ' + where(e)); }
          }
          return r;
        }, { AC: ALLOW_CLICK, AF: ALLOW_FLAT, NAV });
        const tally = a => { const m = new Map(); a.forEach(x => m.set(x, (m.get(x) || 0) + 1)); return [...m].map(([k, n]) => n > 1 ? `${k} x${n}` : k); };
        for (const x of tally(out.click)) problems.push(`S1 ${theme}/${label}: ${x}`);
        for (const x of tally(out.flat)) problems.push(`S2 ${theme}/${label}: ${x}`);
        for (const x of tally(out.inner)) problems.push(`S3 ${theme}/${label}: ${x}`);
      };
      const pages = process.env.PAGES ? process.env.PAGES.split(',') : await p.evaluate(() => Object.keys(DQ.ui.V));
      for (const pg of pages) {
        await p.evaluate(v => { for (let i = 0; i < 6; i++) DQ.closeModal(); DQ.go(v); DQ.ui.render(true); }, pg); await p.waitForTimeout(250);
        await p.evaluate(() => { for (let i = 0; i < 6; i++) if (document.querySelector('.modal')) DQ.closeModal(); document.querySelectorAll('#worldcard').forEach(e => e.remove()); });
        await check(pg);
      }
      if (!process.env.PAGES) {
        /* a running fight: the stage, the foe card, the floats and the defeat caption */
        await p.evaluate(() => { const S = DQ.S; S.hp = DQ.maxHp(); S.town = 'willowbrook'; DQ.go('combat'); DQ.startAct('fight', 'goblin', { quiet: true }); DQ.paused = false; DQ.ui.render(true); window.__k = S.stats.kill || 0; });
        await p.waitForFunction(() => (DQ.S.stats.kill || 0) > window.__k, null, { timeout: 20000 }).catch(() => {});
        await p.waitForTimeout(200); await check('fight');
        await p.evaluate(() => { DQ.stopAct(true); DQ.paused = true; });
        for (const [label, fn] of Object.entries(MODALS)) {
          await p.evaluate(fn); await p.waitForTimeout(600); await check('pop-up:' + label);
          await p.evaluate(() => { DQ.stopAct && DQ.stopAct(true); DQ.paused = true; for (let i = 0; i < 8; i++) DQ.closeModal(); document.querySelectorAll('.story-screen,#story').forEach(e => e.hidden = true); });
        }
      }
      await p.close();
    }
  } finally { await b.close(); }
  errs.forEach(e => problems.push('ERR ' + e));
  const n = k => problems.filter(x => x.startsWith(k)).length;
  if (problems.length) {
    const show = process.env.VERBOSE ? problems : problems.slice(0, 60);
    console.log(show.join('\n')); if (show.length < problems.length) console.log(`... ${problems.length - show.length} more (VERBOSE=1)`);
  }
  console.log(`shape-rule: pages, a fight and pop-ups x 2 themes; S1 clickable shape problems ${n('S1')}, S2 lines round non-clickables ${n('S2')}, S3 lines inside controls ${n('S3')}, errors ${errs.length}`);
  if (problems.length) process.exit(1);
  console.log('shape-rule: ok');
})().catch(e => { console.error(e); process.exit(1); });
