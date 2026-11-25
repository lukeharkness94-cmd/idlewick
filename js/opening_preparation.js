/* Fresh heroes finish a starter weapon and cook before entering a fight. */
(() => {
  const Q = window.DQ, UI = Q.ui, D = Q.data;
  const current = () => Q.S;
  const log = 'log_normal';

  Q.openingCombatNeed = () => {
    const S = current();
    if (!S.tut.prepareCombat) return null;
    if (!S.tut.weaponFinished) {
      if (!Q.have(log)) {
        return {
          title: 'Cut a log for your weapon', detail: 'Cut 1 log to finish your starter weapon.',
          action: 'journeytask', a: 'wood', b: 'normal',
        };
      }
      if (!S.equip.weapon) return { title: 'Equip your starter weapon', detail: 'Equip a weapon before finishing it.', action: 'go', a: 'character' };
      const weapon = D.ITEMS[S.equip.weapon]?.name || 'starter weapon';
      return {
        title: 'Finish your ' + weapon.toLowerCase(), detail: 'Use 1 log to finish assembling your weapon.',
        action: 'finishstarter',
      };
    }
    if (S.stats.cook < 1) {
      if (!Q.have('raw_shrimp')) {
        return {
          title: 'Catch shrimp for your first meal', detail: 'Catch shrimp, then cook 1 serving before fighting.',
          action: 'journeytask', a: 'fish', b: 'shrimp',
        };
      }
      return {
        title: 'Cook a shrimp before your first fight', detail: 'Cook 1 shrimp to finish your combat preparation.',
        action: 'journeytask', a: 'recipe', b: 'cook_shrimp',
      };
    }
    return null;
  };

  UI.DO.finishstarter = () => {
    const S = current();
    if (Q.openingCombatNeed()?.action !== 'finishstarter' || !S.equip.weapon || Q.forecasting) return;
    const pack = S.inv[log] || 0;
    const bank = S.bank[log] || 0;
    if (!Q.take(log, 1)) return;
    S.tut.weaponFinished = true;
    if (!Q.save()) {
      delete S.tut.weaponFinished;
      if (pack) S.inv[log] = pack;
      if (bank) S.bank[log] = bank;
      Q.toast(Q.saveHealth || 'Could not save your preparation.', true);
      return;
    }
    Q.log(`You finish assembling your ${D.ITEMS[S.equip.weapon].name.toLowerCase()}.`);
    UI.render(false);
  };

  const journeyNext = Q.journeyNext;
  Q.journeyNext = (...args) => {
    const next = journeyNext(...args);
    if ((next.action === 'journeytask' && next.a === 'fight') || ['journeytrain', 'huntquest'].includes(next.action)) {
      return Q.openingCombatNeed() || next;
    }
    return next;
  };

  const supplyEntry = UI.fightSupplyEntry;
  UI.fightSupplyEntry = () => {
    const need = Q.openingCombatNeed();
    if (!need) return supplyEntry();
    return `<div class="fight-supply" role="status"><span>${Q.esc(need.detail)}</span><button class="btn sm" data-do="${need.action}" data-a="${need.a || ''}" data-b="${need.b || ''}">${Q.esc(need.title)}</button></div>`;
  };
})();
