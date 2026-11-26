/* Optional daily errands use the quest event stream and carry no streak or completion bonus. */
(() => {
  const Q = window.DQ, D = Q.data, UI = Q.ui, { esc, fmt } = Q;
  const errands = [
    { event: 'catch', skill: 'fishing', task: 'shrimp', label: 'Make 8 catches', target: 8, reward: 15 },
    { event: 'chop', skill: 'woodcutting', task: 'normal', label: 'Gather 8 woodcutting resources', target: 8, reward: 15 },
    { event: 'cook', skill: 'cooking', task: 'cook_shrimp', label: 'Cook 4 meals', target: 4, reward: 20 },
    { event: 'mine', skill: 'mining', task: 'copper', label: 'Mine 8 ore', target: 8, reward: 20 },
    { event: 'kill', skill: 'combat', task: null, label: 'Defeat 6 creatures', target: 6, reward: 25 },
  ];
  const dayId = now => Math.floor(now / 86400000);
  const available = e => e.skill === 'combat' ? !Q.openingCombatNeed() && Q.S.stats.kill > 0 : Q.skillUnlocked(e.skill);
  const stateFor = now => {
    const day = dayId(now);
    if (!Q.S.dailyErrands || Q.S.dailyErrands.day < day) {
      const eligible = errands.filter(available);
      const start = day % eligible.length;
      const rows = [...eligible.slice(start), ...eligible.slice(0, start)].slice(0, 3);
      Q.S.dailyErrands = { day, rows: rows.map(e => ({ event: e.event, have: 0, paid: false })) };
    }
    return Q.S.dailyErrands;
  };
  Q.dailyOffers = (now = Date.now()) => stateFor(now).rows.flatMap(row => {
    const errand = errands.find(e => e.event === row.event);
    return errand ? [{ ...errand, ...row }] : [];
  });

  const questEvent = Q.qev;
  Q.qev = (event, key, count = 1) => {
    const result = questEvent(event, key, count);
    if (!Q.forecasting && Number.isSafeInteger(count) && count > 0) {
      const errand = errands.find(e => e.event === event);
      if (!errand) return result;
      const row = stateFor(Date.now()).rows.find(r => r.event === event);
      if (row && !row.paid) {
        row.have = Math.min(errand.target, row.have + count);
        if (row.have === errand.target) {
          row.paid = true;
          Q.addCoins(errand.reward);
          Q.log(`Daily errand complete. Earned ${fmt(errand.reward)} coins.`, 'good');
        }
      }
    }
    return result;
  };
  const quests = UI.V.quests;
  UI.V.quests = () => {
    const daily = UI.tab.dailyErrands;
    const toggle = `<button class="btn" data-do="dailyerrands">${daily ? 'Quest journal' : 'Daily errands'}</button>`;
    if (!daily) return quests().replace('<nav class="tabs" aria-label="Quest status">', '<nav class="tabs" aria-label="Quest status">' + toggle);
    return `<section class="panel daily-errands"><div class="phead"><h2>Daily errands</h2>${toggle}</div><p>Three optional jobs. Each pays when you finish it.</p><div class="daily-list">${Q.dailyOffers().map(e =>
      `<section class="panel"><h3>${esc(e.label)}</h3><p>${e.have} / ${e.target} · ${e.paid ? '✓ Paid' : fmt(e.reward) + ' coins'}</p><progress value="${e.have}" max="${e.target}" aria-label="${esc(e.label)}"></progress>${e.paid ? '' :
        `<button class="btn" data-do="dailyroute" data-a="${e.event}">Open ${esc(D.SK[e.skill]?.name || 'Combat')}</button>`}</section>`).join('')}</div></section>`;
  };
  UI.DO.dailyerrands = () => { UI.tab.dailyErrands = !UI.tab.dailyErrands; UI.render(false); };
  const openQuest = UI.DO.openquest;
  UI.DO.openquest = (...args) => {
    UI.tab.dailyErrands = false;
    return openQuest(...args);
  };
  UI.DO.dailyroute = event => {
    const e = errands.find(row => row.event === event);
    if (!e) return;
    if (!e.task) Q.go(e.skill);
    else UI.focusTask(e.skill, e.task);
  };
})();
