/* Overflow sweep (owner, 26 Nov 2026: "run through every UI element, make sure nothing like this happens" — an arrow's
   "3 Arrow power" spilled out of its backpack tile). Opens every page (DQ.ui.V) at 1440 × 900, 1280 × 720 and 390 × 844
   with a granted mid-game fixture and reports text that spills outside its box (button, tile, card, chip, panel) or is
   clipped inside it. Usage: node scripts/audit-overflow.cjs [EVIDENCE=out.json]; exits 1 when anything is found. */
const { chromium } = require('playwright');
const fs = require('fs');
const SIZES = [[1440, 900], [1280, 720], [390, 844]];
(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined }); const found = []; const errors = [];
  for (const [w, h] of SIZES) {
    const p = await b.newPage({ viewport: { width: w, height: h } }); p.on('pageerror', e => errors.push(e.message));
    await p.goto(process.env.IDLEWICK_URL || 'http://127.0.0.1:8765/'); await p.locator('#t-new').click(); await p.locator('#cr-go').click();
    await p.waitForFunction(() => DQ.started && document.querySelector('#title').hidden);
    const pages = await p.evaluate(() => { const Q = DQ, D = Q.data, S = Q.S; Q.paused = true; S.settings.notify = false; S.tut.hidden = true;
      for (const sk of Object.keys(S.xp)) { S.xp[sk] = D.XPF[30]; S.unlocked[sk] = true; }
      for (const t of ['willowbrook', 'mossbarrow', 'saltmere']) S.towns[t] = { visited: true, boss: t !== 'saltmere' };
      for (const id of ['arrow_bronze', 'arrow_iron', 'bronze_sword', 'iron_sword', 'bow_oak', 'staff_oak', 'bronze_helm', 'iron_body', 'iron_legs', 'iron_shield', 'bread', 'raw_shrimp', 'log_normal', 'log_oak', 'ore_copper', 'bar_bronze', 'rune', 'seed_potato', 'cowhide', 'string'])
        if (D.ITEMS[id]) Q.give(id, id.startsWith('arrow') || id === 'rune' ? 250 : 12);
      S.coins = 25000; Q.fxDirty && Q.fxDirty(); Q.ui.renderDock && Q.ui.renderDock(); for (let i = 0; i < 12; i++) Q.closeModal();
      return Object.keys(Q.ui.V); });
    for (const page of pages) {
      const r = await p.evaluate(async v => { for (let i = 0; i < 6; i++) DQ.closeModal(); try { DQ.go(v); DQ.ui.render(true); } catch (e) { return { err: String(e) }; }
        await new Promise(res => setTimeout(res, 120));
        const BOX = 'button, .slot, .illustrated-card, .chip, [class*="chip"], .card, .tile, .panel, li, .stock-item, .cw-chip, .pill, .badge, .tag';
        const vis = e => { const r = e.getBoundingClientRect(), cs = getComputedStyle(e); return r.width > 0 && r.height > 0 && cs.visibility !== 'hidden' && cs.display !== 'none' && +cs.opacity > .05; };
        const name = e => e.tagName.toLowerCase() + (e.className && typeof e.className === 'string' ? '.' + e.className.trim().split(/\s+/).slice(0, 2).join('.') : '');
        const out = [];
        for (const e of document.querySelectorAll('#view *, #nowcard *, #skilldock *')) {
          if (!vis(e) || ![...e.childNodes].some(n => n.nodeType === 3 && n.textContent.trim())) continue;
          { const rr = e.getBoundingClientRect(); if (rr.width <= 1 || rr.height <= 1) continue; } /* visually hidden labels */
          let box = e.parentElement && e.parentElement.closest(BOX); if (!box || !vis(box)) continue;
          /* a scrolling list between the text and its box is where it lives: text below its fold is not a spill */
          let scrolls = false; for (let a = e.parentElement; a && a !== box; a = a.parentElement) { const c = getComputedStyle(a); if (/(auto|scroll)/.test(c.overflowY + c.overflowX)) { scrolls = true; break; } }
          if (scrolls) continue;
          /* the Village map's site labels are pills drawn over the scene, wider than their hotspot on purpose */
          if (box.classList.contains('site-spot')) continue;
          const r = e.getBoundingClientRect(), bb = box.getBoundingClientRect(), cs = getComputedStyle(box);
          /* range of the text itself (an inline span can be wider than its words) */
          const rg = document.createRange(); rg.selectNodeContents(e); const tr = rg.getBoundingClientRect();
          const spill = tr.right > bb.right + 2 || tr.left < bb.left - 2 || (tr.bottom > bb.bottom + 2 && cs.overflowY === 'visible');
          const ce = getComputedStyle(e), clipped = (ce.overflow === 'hidden' || ce.overflowX === 'hidden') && e.scrollWidth > e.clientWidth + 1 && ce.textOverflow !== 'ellipsis';
          if ((spill && !/(auto|scroll)/.test(cs.overflowX + cs.overflowY)) || clipped) out.push({ text: e.textContent.trim().slice(0, 40), el: name(e), box: name(box), kind: spill ? 'spills' : 'clipped', by: Math.round(Math.max(tr.right - bb.right, bb.left - tr.left, tr.bottom - bb.bottom)) });
        }
        return { out }; }, page);
      if (r.err) { found.push({ size: `${w}x${h}`, page, text: 'render error: ' + r.err }); continue; }
      for (const x of r.out) found.push({ size: `${w}x${h}`, page, ...x });
    }
    await p.close();
  }
  await b.close();
  const key = f => `${f.page}|${f.el}|${f.box}|${f.text}`; const uniq = new Map(); for (const f of found) { const k = key(f); if (!uniq.has(k)) uniq.set(k, { ...f, sizes: [] }); uniq.get(k).sizes.push(f.size); }
  const list = [...uniq.values()];
  console.log(`${list.length} overflow problems` + (errors.length ? `; page errors: ${errors.slice(0, 3).join(' | ')}` : ''));
  for (const f of list.slice(0, 200)) console.log(`${f.page.padEnd(14)} ${f.kind.padEnd(7)} ${String(f.by).padStart(4)}px  ${f.el} in ${f.box} · "${f.text}" · ${f.sizes.join(',')}`);
  if (process.env.EVIDENCE) fs.writeFileSync(process.env.EVIDENCE, JSON.stringify(list, null, 1));
  process.exit(list.length || errors.length ? 1 : 0);
})();
