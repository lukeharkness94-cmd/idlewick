/* Idlewick: the "Before <boss>" checklist (Part C Task 18) and the regional challenges on the way to a boss (Part B
   reward gap). Both live inside the existing Next-step system (DQ.journeyNext / DQ.regionNext); no new screen, tutorial
   or quest type.
   Before <boss>: once the region boss's Combat requirement is met (the fixed first-hour harness showed "Challenge
   Grubnash" becoming the Next step at that point), Home's Next step becomes a three-item checklist:
     a) Armour: an empty head/body/legs/shield slot with a wearable piece in the pack is equipped by its button
        (UI.DO.equip, the same action the existing equip steps use). With nothing wearable, the button opens the shop
        with the cheapest piece for an empty slot selected; it never buys anything.
     b) Ability: an empty ability slot and an unlocked ability for this weapon: the button slots the first one
        (DQ.toggleAbility). Change it later through Manage.
     c) Food: the carried healing and auto-eat state in the Combat page's own words ("Food lasts ≈ X"). With no food the
        button points at cooking (or the shop's food) without buying.
   Each item ticks itself from the live save, however it was satisfied. "Skip" (one click, S.bossPrep[boss] = 'skip')
   never blocks the boss. Once every item is done or the list is skipped, the Next step is the challenge itself.
   No coins are spent by any checklist button, no stats or drops change.
   Regional challenges (reward gap between Scholarship and Old Tusk, 82.5 simulated minutes in Codex's replay): while
   training for a region boss, if one of the region's two existing challenge mini-bosses is within reach (its Combat
   requirement met, not yet beaten, and the battle forecast wins at least 60%), Home offers it as the Next step, with
   its existing quest (Roots in the Orchard: 400 coins; The Rookmother: 650 coins; each with a first-victory iron piece).
   No new reward is added. */
(() => {
const Q = window.DQ, D = Q.data, UI = Q.ui, S = () => Q.S, { esc, ico } = Q;
const ARMOUR = ['head', 'body', 'legs', 'shield'];
const prep = () => (S().bossPrep = S().bossPrep || {});
const boss = () => Q.regionBoss && Q.regionBoss();
const wearable = id => { const it = D.ITEMS[id]; if (!it || !ARMOUR.includes(it.slot)) return false; const c = Q.canEquip ? Q.canEquip(id) : { ok: true }; return !!(c && c.ok); };
const emptyArmour = () => ARMOUR.filter(sl => !S().equip[sl] && !(sl === 'shield' && Q.weaponStyle && Q.weaponStyle() !== 'melee'));
/* (a) armour: an owned piece for an empty slot, else the cheapest shop piece for one */
Q.bossArmour = () => {
  const empty = emptyArmour(); if (!empty.length) return { done: true };
  const owned = Object.keys(S().inv).filter(id => S().inv[id] > 0 && wearable(id) && empty.includes(D.ITEMS[id].slot))
    .sort((a, b) => ((D.ITEMS[b].b || {}).def || 0) - ((D.ITEMS[a].b || {}).def || 0))[0];
  if (owned) return { done: false, own: owned, slot: D.ITEMS[owned].slot };
  const stock = (D.SHOPS[S().town] || []).filter(id => D.ITEMS[id] && empty.includes(D.ITEMS[id].slot) && !(Q.itemReqs && Q.itemReqs(id).some(r => !r.ok)))
    .sort((a, b) => (Q.buyPrice ? Q.buyPrice(a) - Q.buyPrice(b) : 0))[0];
  return { done: false, shop: stock || null, slot: empty[0] };
};
/* (b) ability: an unlocked ability for this weapon, an empty slot */
Q.bossAbility = () => {
  const on = S().abilities || [], free = (Q.abilSlots ? Q.abilSlots() : 2) - on.length;
  const sty = Q.weaponStyle ? Q.weaponStyle() : 'melee';
  const open = Object.values(D.AB || {}).filter(a => Q.abilUnlocked(a) && !on.includes(a.id) && (!a.style || a.style === sty) && (!a.needShield || S().equip.shield));
  if (free <= 0 || !open.length) return { done: true, none: !open.length && !on.length };
  return { done: false, id: open.sort((a, b) => a.lvl - b.lvl)[0].id };
};
/* (c) food */
Q.bossFood = () => {
  const have = (Q.foods ? Q.foods() : []).reduce((n, f) => n + Q.have(f), 0), auto = S().settings.autoEat !== false;
  let lasts = ''; try { const e = Q.expedition && Q.expedition(); if (e && !e.unknown) lasts = `Food lasts ≈ ${Q.expeditionSpan(e.minutes)}`; } catch (e) {}
  return { done: have > 0 && auto, have, auto, lasts };
};
Q.bossChecklist = () => {
  const b = boss(); if (!b) return null;
  const a = Q.bossArmour(), ab = Q.bossAbility(), f = Q.bossFood();
  return { boss: b, items: [
    { key: 'armour', done: a.done, label: a.done ? 'Armour on' : a.own ? `Wear your ${D.ITEMS[a.own].name.toLowerCase()}` : a.shop ? `Armour: ${D.ITEMS[a.shop].name} is the cheapest piece for your ${Q.SLOT_NAMES[a.slot].toLowerCase()}` : 'Armour: nothing to buy here yet',
      action: a.own ? { do: 'equip', a: a.own, text: 'Equip' } : a.shop ? { do: 'bossshop', a: a.shop, text: 'See it in the shop' } : null },
    { key: 'ability', done: ab.done, label: ab.done ? (ab.none ? 'No abilities learned yet' : 'Ability slots filled') : `Slot ${D.AB[ab.id].name}`,
      action: ab.done ? null : { do: 'bossabil', a: ab.id, text: 'Slot it' } },
    { key: 'food', done: f.done, label: f.have ? `${Q.fmt(f.have)} food · ${f.lasts || 'healing ready'} · auto-eat ${f.auto ? 'on' : 'off'}` : 'No food in your pack',
      action: f.have && !f.auto ? { do: 'bossautoeat', a: '', text: 'Turn on auto-eat' } : !f.have ? { do: 'bossfood', a: '', text: 'Get food' } : null }
  ] };
};
const allDone = c => c && c.items.every(i => i.done);
/* actions: equip reuses UI.DO.equip; the rest are small and never spend coins */
UI.DO.bossabil = id => { if (D.AB[id] && Q.toggleAbility(id)) { Q.sfx && Q.sfx('equip'); Q.save && Q.save(); } UI.render(false); };
UI.DO.bossautoeat = () => { S().settings.autoEat = true; Q.save && Q.save(); UI.render(false); };
UI.DO.bossshop = id => { UI.shopTab = 'buy'; UI.shopCategory = 'equipment'; UI.shopSelected = UI.shopSelected || {}; UI.shopSelected.buy = id; UI.returnTo = { page: UI.view, label: 'Home' }; Q.go('shop'); };
UI.DO.bossfood = () => { const r = Object.values(D.RECIPES).find(x => x.skill === 'cooking' && Q.canMake && Q.canMake(x) && Object.keys(x.out).some(id => D.ITEMS[id] && D.ITEMS[id].heal));
  if (r && UI.focusTask) return UI.focusTask('cooking', r.id, r.tab, 'cooking');
  UI.shopTab = 'buy'; UI.shopCategory = 'supplies'; UI.shopSelected = UI.shopSelected || {}; UI.shopSelected.buy = 'bread'; Q.go('shop'); };
UI.DO.bossprepskip = id => { prep()[id || (boss() || {}).id] = 'skip'; Q.save && Q.save(); UI.render(false); };
/* ---------- Next step: challenges on the way, then the checklist, then the boss ---------- */
const minisFor = town => D.MONLIST.filter(m => m.mini && !m.tower && m.town === town).sort((a, c) => (a.mini.req || 0) - (c.mini.req || 0));
const beaten = m => !!(S().minis && S().minis[m.id]) || (S().beast.kills[m.id] || 0) > 0;
const forecastOk = id => { try { const f = Q.bossForecast && Q.bossForecast(id); return f && f.winRate >= .6; } catch (e) { return false; } };
Q.regionalChallengeStep = () => {
  const b = boss(); if (!b || S().town !== b.town || Q.combatLvl() >= b.boss.req) return null;
  const m = minisFor(b.town).find(x => !beaten(x) && Q.combatLvl() >= (x.mini.req || 0)); if (!m) return null;
  const q = D.QUESTS.find(x => x.obj.some(o => o.ev === 'kill' && o.key === m.id));
  if (q && Q.questState(q) === 'new') return { title: `Accept “${q.name}”`, detail: `${q.giver} has a job on the way to ${b.boss.short || b.name}: ${m.name}. It pays ${Q.fmt(q.reward.coins || 0)} coins.`, action: 'qstart', a: q.id };
  if (q && Q.questState(q) === 'ready') return { title: `Claim “${q.name}”`, detail: `${q.giver} is waiting to thank you.`, action: 'qclaim', a: q.id };
  if (q && Q.questState(q) === 'active') { const i = q.obj.findIndex((o, k) => Q.objProg(q, S().q[q.id], k) < o.n), o = q.obj[i];
    if (o && o.ev === 'guide') return { title: o.label, detail: `Read ${m.name}'s field-guide entry before the fight.`, action: 'guide', a: m.id }; }
  if (!forecastOk(m.id)) return null;
  return { title: `Challenge ${m.mini.short || m.name}`, detail: `A challenge on the way to ${b.boss.short || b.name}. First victory: ${D.ITEMS[m.mini.first] ? D.ITEMS[m.mini.first].name : 'a reward'}.`, action: 'journeytask', a: 'fight', b: m.id };
};
Q.bossPrepStep = () => {
  const b = boss(); if (!b || S().town !== b.town || Q.combatLvl() < b.boss.req || prep()[b.id]) return null;
  const c = Q.bossChecklist(); if (!c || allDone(c)) return null;
  return { title: `Before ${b.boss.short || b.name}`, detail: 'Three quick checks before the fight. Each one ticks itself off.', action: 'bossprepskip', a: b.id, checklist: c, skip: true };
};
const region0 = Q.regionNext;
Q.regionNext = () => { const s = Q.bossPrepStep() || Q.regionalChallengeStep(); return s || region0(); };
/* the checklist, rendered inside the Home goal card (and anywhere a journey step is drawn with UI.bossChecklistHtml) */
UI.bossChecklistHtml = step => {
  if (!step || !step.checklist) return '';
  return `<ul class="boss-checklist" aria-label="${esc(step.title)}">${step.checklist.items.map(i => `<li class="${i.done ? 'done' : ''}" data-check="${i.key}"><span class="bc-mark" aria-hidden="true">${i.done ? '✓' : ''}</span><span class="bc-label">${esc(i.label)}</span>${!i.done && i.action ? `<button class="btn sm" data-do="${i.action.do}" data-a="${esc(i.action.a)}">${esc(i.action.text)}</button>` : ''}</li>`).join('')}</ul>`;
};
})();
