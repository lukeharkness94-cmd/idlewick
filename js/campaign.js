/* The quest journal and Home share one active main chapter. */
(() => {
  const Q = window.DQ, D = Q.data;
  const chain = [];
  const visit = quest => {
    if (!quest || chain.includes(quest)) return;
    visit(D.QM[quest.req]);
    chain.push(quest);
    quest.main = true;
  };
  visit(D.QM.first_steps);
  for (const town of D.TOWNS) visit(D.QUESTS.find(q => q.obj.some(o => o.ev === 'boss' && o.key === town.boss)));
  const main = [...chain, ...D.QUESTS.filter(q => q.main && !chain.includes(q))];
  const isActive = status => status === 'active' || status === 'ready';
  const regionalPreparation = { boar_hunt: 2, crab_cull: 1 };

  Q.currentMainQuest = () => main.find(q => isActive(Q.S.q[q.id]?.s)) || null;
  Q.reconcileMainQuests = state => {
    for (const [id, start] of Object.entries(regionalPreparation)) {
      const record = state.q[id], objectives = D.QM[id].obj;
      if (record?.p?.length !== start) continue;
      const earned = ['ready', 'done'].includes(record.queuedMain || record.s);
      record.p.push(...objectives.slice(start).map(o => earned ? o.n : 0));
    }
    const active = main.filter(q => isActive(state.q[q.id]?.s));
    for (const quest of active.slice(1)) {
      const record = state.q[quest.id];
      record.queuedMain = record.s;
      record.s = 'locked';
    }
    return state;
  };

  const questBlockers = Q.questBlockers;
  Q.questBlockers = q => { if (Q.S.q[q.id]?.queuedMain) return ['Continue the current main quest first. Your objectives here are saved.'];
    const out = questBlockers(q), current = q.main && !Q.S.q[q.id] && Q.currentMainQuest();
    return current && current.id !== q.id ? [...out, `Finish “${current.name}” first`] : out; };

  const startQuest = Q.startQuest;
  Q.startQuest = id => {
    const q = D.QM[id];
    if (!q) return;
    const current = Q.currentMainQuest();
    if (q.main && current && current.id !== id) {
      Q.toast(`Finish ${current.name} before accepting another main quest.`, true);
      return;
    }
    return startQuest(id);
  };

  const claimQuest = Q.claimQuest;
  Q.claimQuest = (id, ...args) => {
    const result = claimQuest(id, ...args);
    if (D.QM[id]?.main && Q.S.q[id]?.s === 'done' && !Q.currentMainQuest()) {
      const resume = main.find(q => Q.S.q[q.id]?.queuedMain);
      if (resume) {
        const record = Q.S.q[resume.id];
        record.s = record.queuedMain;
        delete record.queuedMain;
        Q.save();
        Q.emit('quests');
      }
    }
    return result;
  };

  // Pay a small part of the next chapter's practical cost, while keeping accepted quest IDs and goals.
  for (let i = 0; i < chain.length - 1; i++) {
    const q = chain[i], next = chain[i + 1];
    const delivery = next.obj.find(o => o.ev === 'deliver');
    const harvest = next.obj.find(o => o.ev === 'harvest');
    const craft = next.obj.find(o => o.ev === 'craft');
    const item = delivery?.key || (harvest && D.ITEMS['seed_' + harvest.key] ? 'seed_' + harvest.key :
      craft ? 'flax' : 'bread');
    if (D.ITEMS[item]) {
      q.reward.items = { [item]: Math.min(3, delivery?.n || 3), ...q.reward.items };
    }
  }

  const questEntry = q => {
    const record = Q.S.q[q.id];
    const incomplete = (o, i) => Q.objProg(q, record, i) < o.n;
    const preparation = q.obj.findIndex((o, i) => regionalPreparation[q.id] !== undefined && i >= regionalPreparation[q.id] && incomplete(o, i));
    const index = preparation >= 0 ? preparation : q.obj.findIndex(incomplete);
    const objective = q.obj[index];
    return { q, record, index, objective };
  };
  Q.unfinishedObjective = q => q ? questEntry(q).objective : undefined;

  Q.mainQuestProgress = () => {
    const q = Q.currentMainQuest() || chain.find(q => Q.questState(q) === 'new');
    if (!q) return null;
    const { record, index, objective } = questEntry(q);
    return {
      id: q.id, name: q.name, state: Q.questState(q),
      label: objective?.label || 'Return to ' + q.giver,
      have: objective ? Q.objProg(q, record, index) : q.obj.length,
      need: objective?.n || q.obj.length,
    };
  };

  const journeyNext = Q.journeyNext;
  const step = (title, detail, action, a, b) => ({ title, detail, action, a, b });
  Q.journeyNext = (goal = Q.S.journey || 'boss') => {
    const guidance = journeyNext(goal);
    const quest = Q.currentMainQuest();
    if (goal !== 'boss' || !quest) return guidance;
    if (guidance.a === 'hungry_cook' || /Mabel/.test(guidance.title)) {
      return { ...guidance, optional: true };
    }
    const { record, index, objective } = questEntry(quest);
    if (quest.town !== Q.S.town) return step(`Return to ${D.TOWN[quest.town].name}`, quest.name, 'journeytravel', quest.town);
    if (record.s === 'ready') return step(`Return to ${quest.giver}`, quest.name, 'qclaim', quest.id);
    if (!objective || objective.ev === 'boss') return guidance;
    const detail = `${quest.name} · ${Q.objProg(quest, record, index)} / ${objective.n}`;
    if (objective.ev === 'kill') {
      const hunt = Q.isAnimal?.(objective.key) && Q.skillUnlocked('hunting');
      const supplies = hunt ? null : Q.combatSupplyStep?.();
      return Q.openingCombatNeed?.() || supplies || Q.foodStep?.('Bring enough food to finish your patrol.') ||
        step(objective.label, detail, 'huntquest', objective.key);
    }
    if (objective.ev === 'cook' && objective.key === 'shrimp') {
      return Q.have('raw_shrimp') ?
        step(objective.label, detail, 'journeytask', 'recipe', 'cook_shrimp') :
        step('Catch shrimp for the patrol', detail, 'journeytask', 'fish', 'shrimp');
    }
    const kind = { catch: 'fish', chop: 'wood', mine: 'mine', thieve: 'thieve' }[objective.ev];
    if (kind && D.NODE[kind + ':' + objective.key]) {
      return step(objective.label, detail, 'journeytask', kind, objective.key);
    }
    return step(objective.label, detail, 'questcontinue', quest.id);
  };
})();
