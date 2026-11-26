/* node tests/shape-rule.cjs: the shape rule (owner, 26 Nov 2026), checked on the main pages in both themes at 1440 x 900.
   Needs the preview server (IDLEWICK_URL, default http://127.0.0.1:8765/).
   S1  anything you can click (button, [data-do], [role=button], [role=tab], [role=switch], a[href], text fields) wider than 20px is an
       8px rounded rectangle (all four corners) with a visible outline on all four sides (border, or a 2px inset ring)
   S2  anything you can't click has no outline: no visible border on three or more sides (a one-sided divider or accent
       stripe is not an outline).
   ALLOW lists the few genuine exceptions; keep it short and say why.
   VERBOSE=1 prints every offender; PAGES=a,b limits the pages. */
const { chromium } = require('playwright');
const URL = process.env.IDLEWICK_URL || 'http://127.0.0.1:8765/';
const PAGES = (process.env.PAGES || 'overview,quests,shop,character,bank,combat,woodcutting,cooking,farming,projects,bestiary,settings').split(',');
/* Exceptions (selectors matched with Element.closest):
   - .site-spot / .tc-room / svg: hotspots drawn on the pixel scenes (Village town scene, the tower cutaway, the SVG map);
     an outline would box the art, and AGENTS.md keeps the scenes as drawn. They show their own hover ring.
   - .site-legend .sl-sign: the Village legend's swatches copy the scene's site signs, so they keep the signs' borders
   Text fields count as clickable: they take the same 8px outlined shape. */
const ALLOW_CLICK = ['.site-spot', '.tc-room', 'svg'];
const ALLOW_FLAT = ['svg', '.site-legend .sl-sign'];
const problems = [];

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
        const S = DQ.S, D = DQ.data; S.settings.notify = false;
        for (const s of D.SKILLS) S.unlocked[s.id] = true;
        Object.assign(S.inv, { log_normal: 40, ore_copper: 20, bar_bronze: 6, trout: 10, bread: 10 });
        S.coins = 3000; DQ.setTheme(t);
      }, theme);
      for (const pg of PAGES) {
        await p.evaluate(v => DQ.go(v), pg); await p.waitForTimeout(300);
        await p.evaluate(() => { for (let i = 0; i < 6; i++) if (document.querySelector('.modal')) DQ.closeModal(); document.querySelectorAll('#notes > *, #worldcard').forEach(e => e.remove()); });
        const out = await p.evaluate(({ AC, AF }) => {
          const CLICK = 'button,[data-do],[role=button],[role=tab],[role=switch],a[href],input:not([type=checkbox]):not([type=radio]):not([type=range]):not([type=hidden]),textarea';
          const sig = e => e.tagName.toLowerCase() + (e.id ? '#' + e.id : '') + [...e.classList].slice(0, 3).map(c => '.' + c).join('');
          const where = e => { const a = e.parentElement && e.parentElement.closest('[id],[class]'); return a ? sig(a) : ''; };
          const vis = e => { const r = e.getBoundingClientRect(); if (r.width < 2 || r.height < 2 || r.bottom < 0 || r.top > innerHeight) return false; const cs = getComputedStyle(e); return cs.visibility !== 'hidden' && +cs.opacity > 0.05 && !e.closest('[hidden],[aria-hidden=true]'); };
          const side = (cs, s) => parseFloat(cs[`border${s}Width`]) > 0.5 && cs[`border${s}Style`] !== 'none' && !/rgba\(.*,\s*0\)|transparent/.test(cs[`border${s}Color`]);
          const sides = cs => ['Top', 'Right', 'Bottom', 'Left'].filter(s => side(cs, s)).length;
          const ring = cs => /inset 0px 0px 0px [12]px/.test(cs.boxShadow) || (parseFloat(cs.outlineWidth) >= 1 && cs.outlineStyle !== 'none' && !/rgba\(.*,\s*0\)/.test(cs.outlineColor));
          const r = { click: [], flat: [] };
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
            const okB = sides(cs) === 4 || ring(cs);
            if (!okR || !okB) r.click.push(sig(e) + ' < ' + where(e) + (okR ? '' : ' radius=' + [...new Set(rad)].join('/')) + (okB ? '' : ' no-outline'));
          }
          for (const e of document.querySelectorAll('#app *, body > *:not(script):not(style)')) {
            if (clicks.has(e) || !vis(e) || AF.some(s => e.closest(s))) continue;
            if (e.closest(CLICK)) continue; /* inside a control: the control carries the outline */
            const cs = getComputedStyle(e);
            if (cs.cursor === 'pointer' && !(e.parentElement && getComputedStyle(e.parentElement).cursor === 'pointer')) continue; /* a script-driven control */
            if (sides(cs) >= 3) r.flat.push(sig(e) + ' < ' + where(e));
          }
          return r;
        }, { AC: ALLOW_CLICK, AF: ALLOW_FLAT });
        const tally = a => { const m = new Map(); a.forEach(x => m.set(x, (m.get(x) || 0) + 1)); return [...m].map(([k, n]) => n > 1 ? `${k} x${n}` : k); };
        for (const x of tally(out.click)) problems.push(`S1 ${theme}/${pg}: ${x}`);
        for (const x of tally(out.flat)) problems.push(`S2 ${theme}/${pg}: ${x}`);
      }
      await p.close();
    }
  } finally { await b.close(); }
  errs.forEach(e => problems.push('ERR ' + e));
  const s1 = problems.filter(x => x.startsWith('S1')).length, s2 = problems.filter(x => x.startsWith('S2')).length;
  if (problems.length) {
    const show = process.env.VERBOSE ? problems : problems.slice(0, 60);
    console.log(show.join('\n')); if (show.length < problems.length) console.log(`... ${problems.length - show.length} more (VERBOSE=1)`);
  }
  console.log(`shape-rule: ${PAGES.length} pages x 2 themes; S1 clickable shape problems ${s1}, S2 outlined non-clickables ${s2}, errors ${errs.length}`);
  if (problems.length) process.exit(1);
  console.log('shape-rule: ok');
})().catch(e => { console.error(e); process.exit(1); });
