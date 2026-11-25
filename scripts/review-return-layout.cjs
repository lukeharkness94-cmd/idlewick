/* Part B baseline. The returner and mid-game saves are isolated fixtures. */
const assert = require('node:assert/strict');
const { chromium } = require('playwright');
const { mkdirSync, writeFileSync } = require('node:fs');
const path = require('node:path');

const url = process.env.IDLEWICK_URL || 'http://127.0.0.1:8765/';
const output = process.env.EVIDENCE;
const shots = process.env.SHOT_DIR;
const saveKey = 'dashboard-quest-save-v2';

async function record() {
  const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });
  const errors = [];
  const layouts = [];
  try {
    const phone = await browser.newPage({ viewport: { width: 390, height: 844 } });
    phone.on('pageerror', error => errors.push(error.message));
    await phone.goto(url);
    await phone.locator('#t-new').click();
    await phone.locator('#cr-go').click();
    await phone.waitForFunction(() => DQ.started && document.querySelector('#title').hidden);
    await phone.evaluate(() => { DQ.paused = true; });

    async function measure(page, state, views) {
      for (const view of views) {
        const result = await page.evaluate(view => {
          DQ.go(view);
          return {
            view: DQ.ui.view, width: innerWidth, scroll: document.documentElement.scrollWidth,
            hero: DQ.advLvl(), combat: DQ.combatLvl(),
            rendered: !document.querySelector('#view').textContent.includes('Something went wrong'),
          };
        }, view);
        layouts.push({ state, ...result });
        assert.equal(result.view, view);
        assert.ok(result.rendered && result.scroll <= result.width + 1, JSON.stringify(result));
      }
    }
    await measure(phone, 'fresh phone', ['combat', 'shop', 'fishing', 'quests']);
    await phone.setViewportSize({ width: 1440, height: 900 });
    await phone.evaluate(() => {
      const Q = DQ, S = Q.S, D = Q.data;
      for (const skill of D.SKILLS) S.unlocked[skill.id] = true;
      S.xp.melee = D.XPF[30];
      S.xp.defence = S.xp.hitpoints = D.XPF[20];
      S.xp.fishing = D.advReq(52) - Q.totalXp() + S.xp.fishing;
      if (Q.advLvl() !== 52 || Q.combatLvl() !== 29) throw new Error('Saltmere fixture levels differ');
      S.towns.willowbrook.boss = true;
      S.towns.mossbarrow = { visited: true, boss: true };
      S.towns.saltmere = { visited: true, boss: false };
      S.town = 'saltmere';
      Q.fxDirty();
    });
    await measure(phone, 'seeded Saltmere desktop', ['map', 'combat', 'quests', 'projects']);
    await phone.close();

    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    page.on('pageerror', error => errors.push(error.message));
    await page.addInitScript(() => {
      let seed = 19;
      Math.random = () => { seed = seed * 16807 % 2147483647; return (seed - 1) / 2147483646; };
    });
    await page.goto(url);
    const before = await page.evaluate(key => {
      const Q = DQ, S = Q.newState('Return fixture'), D = Q.data;
      Q.S = S;
      S.xp.fishing = D.XPF[20];
      S.xp.woodcutting = D.advReq(26) - Q.totalXp();
      Q.fxDirty();
      if (Q.advLvl() !== 26) throw new Error('Return fixture did not start at Hero 26');
      S.q.first_steps = { s: 'active', p: [5, 0] };
      S.inv = {};
      if (!Q.startAct('fish', 'shrimp', { quiet: true })) throw new Error('Could not start return fixture');
      localStorage.setItem(key, JSON.stringify({ ...S, lastSeen: Date.now() - 6 * 3600000 }));
      return { hero: Q.advLvl(), fishing: Q.lvl('fishing') };
    }, saveKey);
    await page.reload();
    await page.locator('#t-cont').click();
    await page.locator('.wb').waitFor();
    const welcome = await page.evaluate(() => {
      const Q = DQ, S = Q.S, originalQuest = structuredClone(S.q.first_steps);
      const current = Q.journeyNext();
      S.q.first_steps.s = 'done';
      const afterQuestCompleted = Q.journeyNext();
      S.q.first_steps = originalQuest;
      return {
        hero: Q.advLvl(), awayMs: S.lastAway?.gap, effectiveMs: Q.offlineEff(6 * 3600000),
        activity: Q.actLabel(), current, afterQuestCompleted, quest: originalQuest,
        encounters: S.inbox.length,
        sections: [...document.querySelector('.wb').children].map(element => ({
          className: element.className, copy: element.innerText.trim(),
        })),
      };
    });
    assert.equal(welcome.effectiveMs, 4 * 3600000);
    assert.match(welcome.activity, /Fishing shrimp/i);
    assert.notEqual(welcome.current.title, welcome.afterQuestCompleted.title);
    assert.deepEqual(errors, []);
    if (shots) {
      mkdirSync(shots, { recursive: true });
      await page.screenshot({ path: path.join(shots, 'welcome-back-baseline.png') });
    }
    return { fixture: 'Six-hour return from a seeded active First Steps save', before, welcome, layouts, errors };
  } finally {
    await browser.close();
  }
}

record().then(result => {
  const json = JSON.stringify(result, null, 2) + '\n';
  if (output) writeFileSync(output, json);
  console.log(json);
}).catch(error => { console.error(error); process.exitCode = 1; });
