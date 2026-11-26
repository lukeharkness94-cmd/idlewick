/* One offline report, using the same quest progress as Home. */
(() => {
  const Q = window.DQ, D = Q.data, UI = Q.ui;
  const { esc, fmt } = Q;
  const total = values => Object.values(values).reduce((sum, n) => sum + n, 0);
  const list = (items, label) => items.length ? `<ul aria-label="${label}">${items.map(s => `<li>${s}</li>`).join('')}</ul>` : '';

  function activityCard(activity) {
    const xp = Object.entries(activity.xp).map(([id, n]) => `${fmt(n)} ${esc(D.SK[id].name)} XP`);
    const levels = Object.entries(activity.levels).filter(([, level]) => level.to > level.from)
      .map(([id, level]) => `${esc(D.SK[id].name)} ${level.from} → ${level.to}`);
    const items = Object.entries(activity.items).map(([id, n]) => `${fmt(n)} × ${esc(D.ITEMS[id].name)}`);
    const rate = activity.worked ? `<p>${fmt(total(activity.xp) * 3600000 / activity.worked)} XP per hour</p>` : '';
    return `<article class="wb-activity"><h3>${esc(activity.label)}</h3>${rate}${list(xp, 'Experience earned')}${list(levels, 'Levels gained')}${list(items, 'Items found')}</article>`;
  }

  function outsideActivities(sum, activities) {
    const residual = name => {
      const map = { ...sum[name] };
      for (const activity of activities) {
        for (const [id, n] of Object.entries(activity[name])) map[id] -= n;
      }
      return Object.fromEntries(Object.entries(map).filter(([, n]) => n > .01));
    };
    return { label: 'Village and other progress', xp: residual('xp'), items: residual('items'), levels: {} };
  }

  UI.welcomeBody = (sum, gap) => {
    UI.welcomeOwnsChips = true;
    const effective = Q.offlineEff(gap), quest = Q.mainQuestProgress?.();
    const activities = Object.values(sum.activities || {}).filter(a => total(a.xp) || total(a.items));
    const other = outsideActivities(sum, activities);
    if (total(other.xp) || total(other.items)) activities.push(other);
    const running = Q.act ? `${esc(Q.actLabel())} · still going` : sum.label ? 'Your previous task has ended.' : 'Nothing was running.';
    /* the progression ceiling (offline_ceiling.js) is a gate, not a fault: its own line, naming how to raise it */
    const ceiling = sum.ceiling ? `<p class="wb-status wb-ceiling">${esc(Q.ceilingText(sum.ceiling.skill, sum.ceiling.lvl))}</p>` : '';
    const stopped = ceiling || (sum.stopped && sum.stop ?
      `<p class="wb-status warn">Stopped after ${Q.fmtTime(sum.stop.after)} · ${esc(sum.stop.reason)}</p>` : '');
    const pending = Q.S.inbox.length;
    const project = Q.returnChoices?.().find(choice => choice.art?.startsWith('project:'));
    const next = quest ? `<section class="wb-sec wb-main-quest"><h3>${esc(quest.name)}</h3><p>${esc(quest.label)} · <b>${quest.have} / ${quest.need}</b></p></section>` : '';
    return `<div class="wb wb-digest">
      <div class="wb-banner"><div class="wb-hello"><div class="wb-time">${Q.fmtTime(gap)} <small>away</small></div>
      <p>${Q.fmtTime(effective)} counted at full speed. ${Q.offlinePolicy()}</p></div><span class="wb-status">${running}</span></div>
      <div class="wb-totals"><b>${fmt(total(sum.xp || {}))} XP</b><b>${fmt(sum.coins || 0)} coins</b></div>
      ${stopped}${next}
      <div class="wb-activities">${activities.map(activityCard).join('')}</div>
      ${project ? `<p class="wb-restoration">${esc(project.title)} · ${esc(project.text)}</p>` : ''}
      ${pending ? `<button class="btn sm wb-encounter-count" data-do="returnpick" data-a="go" data-b="activity">${pending} away encounter${pending === 1 ? '' : 's'} waiting · View</button>` : ''}
    </div>`;
  };
})();
