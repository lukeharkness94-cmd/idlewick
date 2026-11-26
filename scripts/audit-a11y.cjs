/* Part B accessibility audit: core pages at 390 × 844 (phone), 1280 × 720 (short desktop) and both at 200% browser zoom
   (the CSS viewport halves: 195 × 422 and 640 × 360), both themes. For each page it records horizontal overflow,
   interactive targets under 24 × 24 CSS px (WCAG 2.2 2.5.8) and text under 4.5:1 contrast against its nearest opaque
   background (an approximation: gradients and images behind text are not sampled). Writes JSON to EVIDENCE if set.
   Usage: node scripts/audit-a11y.cjs (preview running). Fixture: a fresh hero with Mining and Combat steps granted. */
const { chromium } = require('playwright');
const fs = require('fs');
const PAGES = ['overview', 'activity', 'quests', 'map', 'projects', 'character', 'bestiary', 'shop', 'combat', 'fishing', 'cooking', 'skillsummary', 'settings'];
const SIZES = [['phone', 390, 844, 1], ['short', 1280, 720, 1], ['phone-200', 195, 422, 2], ['short-200', 640, 360, 2]];
(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined }); const out = []; const errors = [];
  for (const theme of ['light', 'dark']) for (const [name, w, h, dpr] of SIZES) {
    const p = await b.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: dpr }); p.on('pageerror', e => errors.push(e.message));
    await p.goto(process.env.IDLEWICK_URL || 'http://127.0.0.1:8765/'); await p.locator('#t-new').click(); await p.locator('#cr-go').click();
    await p.waitForFunction(() => DQ.started && document.querySelector('#title').hidden);
    await p.evaluate(t => { for (let i = 0; i < 12; i++) DQ.closeModal(); DQ.S.settings.theme = t; DQ.emit('settings'); document.documentElement.dataset.theme = t; }, theme);
    for (const page of PAGES) {
      await p.evaluate(v => { for (let i = 0; i < 4; i++) DQ.closeModal(); DQ.go(v); DQ.ui.render(true); }, page); await p.waitForTimeout(200);
      const r = await p.evaluate(() => {
        const sel = e => { let s = e.tagName.toLowerCase(); if (e.id) return s + '#' + e.id; const c = [...e.classList].slice(0, 2).join('.'); return s + (c ? '.' + c : '') + (e.dataset.do ? `[data-do=${e.dataset.do}]` : ''); };
        const vis = e => { const r = e.getBoundingClientRect(), cs = getComputedStyle(e); return r.width > 0 && r.height > 0 && cs.visibility !== 'hidden' && cs.display !== 'none' && +cs.opacity > 0.05 && r.bottom > 0 && r.right > 0; };
        const small = [...document.querySelectorAll('#view button, #view a[href], #view [role=button], #view [data-do], #hud button, #topnav button, .sidebar button')].filter(vis).filter(e => { const r = e.getBoundingClientRect(); return r.width < 24 || r.height < 24; });
        const lum = c => { const m = c.match(/[\d.]+/g); if (!m) return null; const [r, g, bl] = m.slice(0, 3).map(x => { x = x / 255; return x <= .03928 ? x / 12.92 : ((x + .055) / 1.055) ** 2.4; }); return { L: .2126 * r + .7152 * g + .0722 * bl, a: m[3] === undefined ? 1 : +m[3] }; };
        const bgOf = e => { for (let n = e; n; n = n.parentElement) { const cs = getComputedStyle(n), c = lum(cs.backgroundColor); if (cs.backgroundImage !== 'none' && n !== e) return null; if (c && c.a > .9) return c; } return lum('rgb(255,255,255)'); };
        const low = []; for (const e of document.querySelectorAll('#view *, #hud *, .sidebar *')) { if (![...e.childNodes].some(n => n.nodeType === 3 && n.textContent.trim())) continue; if (!vis(e)) continue;
          const f = lum(getComputedStyle(e).color), bg = bgOf(e); if (!f || !bg) continue; const ratio = (Math.max(f.L, bg.L) + .05) / (Math.min(f.L, bg.L) + .05);
          const fs = parseFloat(getComputedStyle(e).fontSize), bold = +getComputedStyle(e).fontWeight >= 700, need = fs >= 24 || (bold && fs >= 18.66) ? 3 : 4.5;
          if (ratio < need) low.push({ sel: sel(e), ratio: +ratio.toFixed(2), text: e.textContent.trim().slice(0, 30) }); }
        return { overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth, small: small.map(e => { const r = e.getBoundingClientRect(); return { sel: sel(e), w: Math.round(r.width), h: Math.round(r.height) }; }), low };
      });
      out.push({ theme, size: name, page, ...r });
    }
    await p.close();
  }
  await b.close();
  /* summary: per size, overflow pages; small targets and low contrast grouped by selector */
  const group = (k) => { const m = {}; for (const r of out) for (const x of r[k]) { const key = x.sel; (m[key] = m[key] || { n: 0, where: new Set(), ex: x }).n++; m[key].where.add(`${r.size}/${r.theme}/${r.page}`); } return Object.entries(m).sort((a, c) => c[1].n - a[1].n).map(([s, v]) => ({ sel: s, n: v.n, pages: v.where.size, ex: v.ex })); };
  const summary = { overflow: out.filter(r => r.overflow > 0).map(r => `${r.size}/${r.theme}/${r.page}: ${r.overflow}px`), small: group('small').slice(0, 40), low: group('low').slice(0, 40), errors };
  console.log(JSON.stringify(summary, null, 1));
  if (process.env.EVIDENCE) fs.writeFileSync(process.env.EVIDENCE, JSON.stringify({ summary, out }, null, 1));
})();
