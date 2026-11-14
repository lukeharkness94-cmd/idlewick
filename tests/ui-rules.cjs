/* node tests/ui-rules.cjs: the player's standing UI rules, checked on every page in an early and a mid-game save,
   both themes, desktop and phone. Needs the preview server (IDLEWICK_URL, default http://127.0.0.1:8765/index.html).
   R1  locked content is never named: unreached fish, trees, rocks, marks, recipes, crops, livestock, voyages and
       unmet creatures stay ??? / "Something new" / "Unknown creature", on the page and in tooltips
   R2  locked choice cards show a blacked-out picture and ???
   R3  no dropdowns or collapsed disclosures (<select>, <details>)
   R4  every font comes from the Lettering faces (no hard-coded family)
   R5  no visible text under 13px in the 1920 design (desktop)
   R6  sprites at whole-number scales (the Village town scene is the one exception)
   R7  wording: no "Bring along", no reputation, no Attack/Strength skills
   Static: R8 no raw vh/vw lengths in css/style.css outside phone rules. */
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path');
const URL = process.env.IDLEWICK_URL || 'http://127.0.0.1:8765/index.html';
const PAGES = (process.env.PAGES || 'overview,activity,journal,quests,people,map,exploration,projects,house,hirelings,character,tools,bank,skillsummary,mastery,bestiary,museum,collection,achievements,shop,settings,combat,tower,fishing,woodcutting,mining,thieving,farming,cooking,smithing,crafting,magic,research,hunting,brewery,enchanting,carpentry,sailing,beastmastery').split(',');
const FACES = /cinzel|alegreya|medievalsharp|silkscreen|pixelify|system-ui|monospace|sans-serif|serif/i;
const problems = [];
const bad = (rule, where, what) => problems.push(`${rule} ${where}: ${what}`);

/* R8: static CSS check */
{
  const css = fs.readFileSync(path.join(__dirname, '../css/style.css'), 'utf8');
  let depth = 0, phone = 0; const lines = css.split('\n');
  lines.forEach((ln, i) => {
    if (/@media[^{]*max-width:\s*(860|600|480|420|390)px/.test(ln)) phone = depth + 1;
    const hits = ln.replace(/var\([^)]*\)/g, '').match(/[\d.]+(vh|vw|dvh|svh)\b/g);
    if (hits && !phone) bad('R8', `css/style.css:${i + 1}`, hits.join(' '));
    for (const ch of ln) { if (ch === '{') depth++; else if (ch === '}') { depth--; if (phone && depth < phone) phone = 0; } }
  });
}

const SETUP = {
  early: () => { DQ.S.settings.notify = false; },
  mid: () => {
    const S = DQ.S, D = DQ.data;
    for (const k of Object.keys(S.xp)) S.xp[k] = D.XPF[32];
    for (const s of D.SKILLS) S.unlocked[s.id] = true;
    D.TOWNS.slice(0, 3).forEach(t => S.towns[t.id] = { visited: true, boss: t.id !== 'saltmere' });
    S.town = 'saltmere'; S.hp = DQ.maxHp(); S.coins = 8000; S.settings.notify = false; S.house.owned = true;
    Object.assign(S.inv, { trout: 25, log_normal: 80, ore_copper: 30, ore_tin: 30, bar_bronze: 12, cowhide: 8, gem_sapphire: 2, feather: 40 });
    S.beast.kills = { chicken: 20, goblin: 30, rat: 12, crab: 8, wolf: 5, grubnash: 2 };
  }
};

(async () => {
  const b = await chromium.launch();
  for (const [vw, vh] of [[1440, 900], [390, 844]]) for (const save of ['early', 'mid']) for (const theme of ['dark', 'light']) {
    if (vw < 800 && theme === 'light') continue;
    const p = await b.newPage({ viewport: { width: vw, height: vh } }); const errs = [];
    p.on('pageerror', e => errs.push(e.message));
    await p.goto(URL); await p.locator('#t-new').click(); await p.locator('#crname').fill('Rulecheck'); await p.locator('#cr-go').click(); await p.waitForTimeout(700);
    await p.evaluate(`(${SETUP[save].toString()})()`); await p.evaluate(t => DQ.setTheme(t), theme);
    for (const pg of PAGES) {
      const tag = `${save}/${theme}/${vw}/${pg}`;
      const ok = await p.evaluate(v => { try { DQ.go(v); return true; } catch (e) { return String(e); } }, pg);
      if (ok !== true) { bad('ERR', tag, ok); continue; }
      await p.waitForTimeout(250);
      await p.evaluate(() => { for (let i = 0; i < 6; i++) if (document.querySelector('.modal')) DQ.closeModal(); document.querySelectorAll('#notes > *, #worldcard').forEach(e => e.remove()); });
      const out = await p.evaluate(({ desktop }) => {
        const D = DQ.data, S = DQ.S, UI = DQ.ui, L = sk => DQ.skillUnlocked(sk) ? DQ.lvl(sk) : 0, r = [];
        const vis = el => { const s = getComputedStyle(el), q = el.getBoundingClientRect(); return s.visibility !== 'hidden' && s.display !== 'none' && q.width > 0 && q.height > 0; };
        /* R1: names that must not appear */
        const hidden = new Map();
        const add = (name, why) => { if (name && name.length > 3) hidden.set(name, why); };
        Object.values(D.NODE).forEach(n => { if (L(n.skill) < n.lvl) add(n.name, `${n.skill} ${n.lvl}`); });
        /* recipe names are also item names (materials, shop stock, tool upgrades), so they are secrets only on their own skill's page */
        const pageSkill = D.SKILLS.find(k => k.page === UI.view);
        Object.values(D.RECIPES).forEach(x => { if (!x.secret && pageSkill && x.skill === pageSkill.id && L(x.skill) < x.lvl) add(x.name, `${x.skill} ${x.lvl}`); });
        if (UI.view === 'farming') (D.CROPS || []).forEach(c => { if (L('farming') < c.lvl) add(c.name, `farming ${c.lvl}`); });
        (D.VOYAGES || []).forEach(v => { if (L('sailing') < v.lvl) add(v.name, `sailing ${v.lvl}`); });
        const fighting = DQ.fight && DQ.fight.mon;
        /* quests name their targets on purpose */
        if (UI.view !== 'quests') D.MONLIST.forEach(m => { if (!m.boss && !m.mini && !m.tower && !(S.beast.kills[m.id] > 0)) add(m.name, 'unmet creature'); });
        /* names shared with something already reached are not secrets */
        Object.values(D.NODE).forEach(n => { if (L(n.skill) >= n.lvl) hidden.delete(n.name); });
        Object.values(D.RECIPES).forEach(x => { if (L(x.skill) >= x.lvl) hidden.delete(x.name); });
        Object.values(D.ITEMS).forEach(it => { if (DQ.have(it.id) > 0 || Object.values(S.equip || {}).includes(it.id)) hidden.delete(it.name); });
        const root = document.querySelector('#view') || document.body;
        /* proper names shown by design (places, bosses, challenges, tower floors, quests, towns) may contain a creature's name */
        const proper = [...Object.values(D.AREAS || {}).flat().map(a => a && a.name), ...D.MONLIST.filter(m => m.boss || m.mini || m.tower).map(m => m.name), ...D.QUESTS.map(q => q.name), ...D.TOWNS.map(t => t.name)].filter(Boolean).sort((a, b) => b.length - a.length);
        const strip = t => proper.reduce((acc, n) => acc.split(n).join('·'), t);
        const text = strip(root.innerText);
        const tips0 = [...root.querySelectorAll('[title],[data-tip],[aria-label]')].map(e => [e.getAttribute('title'), (e.getAttribute('data-tip') || '').startsWith('text:') ? e.getAttribute('data-tip').slice(5) : '', e.getAttribute('aria-label')].join(' ')).join('\n'), tips = strip(tips0);
        for (const [name, why] of hidden) {
          const re = new RegExp(`(^|[^A-Za-z])${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}([^A-Za-z]|$)`);
          const ctx = src => { const i = src.search(re); return src.slice(Math.max(0, i - 50), i + name.length + 40).replace(/\s+/g, ' '); };
          if (re.test(text)) r.push(['R1', `"${name}" (${why}) named on the page: …${ctx(text)}…`]);
          else if (re.test(tips)) r.push(['R1', `"${name}" (${why}) named in a tooltip: …${ctx(tips)}…`]);
        }
        /* R2 */
        root.querySelectorAll('.illustrated-card.locked').forEach(c => { if (!vis(c)) return; const t = c.innerText; if (!/\?\?\?/.test(t)) r.push(['R2', `locked card without ???: ${t.replace(/\s+/g, ' ').slice(0, 60)}`]); if (!c.querySelector('.blackout,.sil,.locked-art,[class*=blackout]')) r.push(['R2', `locked card picture not blacked out: ${t.replace(/\s+/g, ' ').slice(0, 40)}`]); });
        /* R3 */
        document.querySelectorAll('select,details').forEach(e => { if (vis(e)) r.push(['R3', `<${e.tagName.toLowerCase()}> ${e.className}`]); });
        /* R4, R5 */
        const z = typeof DQ.zoom === 'function' ? DQ.zoom() : (+DQ.zoom || 1), seen = new Set();
        const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
        let n; while ((n = walker.nextNode())) {
          const t = n.textContent.trim(); if (!t) continue; const el = n.parentElement; if (!el || !vis(el) || el.closest('.modal,#notes,.tt,[aria-hidden=true],svg')) continue;
          const cs = getComputedStyle(el), fam = cs.fontFamily.split(',')[0].replace(/["']/g, '').trim();
          if (!/cinzel|alegreya|medievalsharp|silkscreen|pixelify|system-ui|monospace|sans-serif|serif/i.test(fam) && !seen.has('f' + fam)) { seen.add('f' + fam); r.push(['R4', `font "${fam}" on "${t.slice(0, 30)}" (${el.className})`]); }
          const px = parseFloat(cs.fontSize);
          if (desktop && px < 12.95 && !seen.has('s' + el.className)) { seen.add('s' + el.className); r.push(['R5', `${px}px "${t.slice(0, 30)}" (${el.tagName.toLowerCase()}.${el.className})`]); }
        }
        /* R6 */
        root.querySelectorAll('img.pxa, img[class*=pixel], canvas.pxa').forEach(im => {
          if (!vis(im) || im.closest('.townscene,.village-scene,.town-scene,.vscene')) return;
          const cs = getComputedStyle(im), nw = im.naturalWidth || im.width, w = parseFloat(cs.width) - (cs.boxSizing === 'border-box' ? ['paddingLeft', 'paddingRight', 'borderLeftWidth', 'borderRightWidth'].reduce((t, k) => t + parseFloat(cs[k] || 0), 0) : 0);
          if (nw && w) { const k = w / nw; if (Math.abs(k - Math.round(k)) > .02 && k > .98) r.push(['R6', `${im.className} (${(im.closest('[class]:not(img)')||{}).className}) drawn ${nw}px shown at ${k.toFixed(2)}×`]); }
        });
        /* R7 */
        const words = [[/Bring along/i, 'Bring along'], [/reputation/i, 'reputation'], [/\b(Attack|Strength) (level|\d)/, 'Attack/Strength skill']];
        for (const [re, w] of words) if (re.test(text) || re.test(tips)) r.push(['R7', w]);
        return r;
      }, { desktop: vw > 860 });
      for (const [rule, what] of out) bad(rule, tag, what);
    }
    errs.forEach(e => bad('ERR', `${save}/${theme}/${vw}`, e));
    await p.close();
  }
  await b.close();
  const uniq = [...new Set(problems)];
  if (uniq.length) { console.log(uniq.join('\n')); console.log(`FAIL ${uniq.length} UI rule problems`); process.exit(1); }
  console.log('PASS UI rules: locked content never named, locked cards blacked out, no dropdowns or disclosures, lettering faces only, no text under 13px, whole-number sprite scales, wording, no raw viewport units');
})();
