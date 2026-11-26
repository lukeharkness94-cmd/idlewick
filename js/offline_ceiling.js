/* Idlewick: the progression ceiling for time away (Part C Task 20).
   Before this file, offline earnings were limited only by time: DQ.simulate (engine.js) runs DQ.advanceTime for
   DQ.offlineEff(gap) = min(gap, 24 h) at full rate, and each completed action pays its full XP and items whatever the
   skill's level. Nothing compared a skill with the content the player had reached, so a two-minute hero left fishing for
   six hours came back far above anything they had unlocked.
   The ceiling is a second, separate limit, applied after counted time and only while catching up on time away (a
   report-mode DQ.simulate, never a forecast, never live play): an activity stops when its skill reaches the highest
   level requirement of the content the player has unlocked. Stopping is the existing DQ.stopAct, so XP and items from
   that activity stop together, the next queued task still starts, other skills are untouched and nothing earned is
   removed. Only skills with a real content gate in the code are capped:
     fishing, woodcutting, mining, thieving: the highest node level (D.NODES) among the towns reached;
     hunting: the highest Hunting level (m.hl) on the one hunting ground (26 Nov 2026: the ground no longer belongs to
       towns, so this is the top animal's level, 98, whatever the region; the tier kit is the real gate);
     melee, ranged, magic, defence, health (fights): the highest creature combat level among the towns reached
       (areas, challenges and bosses; trial towers excluded).
   Every other skill has no clean gate and is listed in docs/offline-ceiling.md for the owner's decision. */
(() => {
const Q = window.DQ, D = Q.data, S = () => Q.S;
const NODE_KIND = { fishing: 'fish', woodcutting: 'wood', mining: 'mine', thieving: 'thieve' };
const COMBAT = ['melee', 'ranged', 'magic', 'defence', 'hitpoints'];
const reached = town => Q.townUnlocked(town);
Q.progressCeiling = skill => {
  if (NODE_KIND[skill]) { const ls = D.NODES[NODE_KIND[skill]].filter(n => reached(n.town)).map(n => n.lvl || 1); return ls.length ? Math.max(...ls) : null; }
  /* one hunting ground for every town (26 Nov 2026): its content reaches the top animal's level whatever the region */
  if (skill === 'hunting') { const ls = D.MONLIST.filter(m => m.hl && !m.tower && (D.HUNT_GROUND ? m.ground : reached(m.town))).map(m => m.hl); return ls.length ? Math.max(...ls) : null; }
  if (COMBAT.includes(skill)) { const ls = D.MONLIST.filter(m => !m.hl && !m.tower && m.cl && reached(m.town)).map(m => m.cl); return ls.length ? Math.max(...ls) : null; }
  return null; /* unmapped: no gate in the code maps cleanly onto this skill */
};
Q.CEILING_SKILLS = [...Object.keys(NODE_KIND), 'hunting', ...COMBAT];
const away = () => Q.sim && Q.sim.on && Q.sim.activities && !Q.forecasting;
const skillOf = a => { const sk = Q.actSkill(a); return sk === 'health' ? 'hitpoints' : sk; };
Q.ceilingText = (skill, lvl) => `${D.SK[skill] ? D.SK[skill].name : skill} stopped at level ${lvl}. That is as far as your current quests and regions reach. Beat a boss or unlock a region to push it further.`;
const check = () => {
  const a = Q.act; if (!a || !away()) return false;
  const sk = skillOf(a), cap = Q.progressCeiling(sk); if (!cap || Q.lvl(sk) < cap) return false;
  Q.sim.ceiling = { skill: sk, lvl: Q.lvl(sk), cap };
  Q.stopAct(true, Q.ceilingText(sk, Q.lvl(sk)));
  return true;
};
Q.checkCeiling = check;
/* after each XP gain while away: the action that reaches the ceiling is the last one */
const addXp0 = Q.addXp;
Q.addXp = (...args) => { const r = addXp0(...args); if (away() && Q.act && skillOf(Q.act) === args[0]) check(); return r; };
/* a skill already at or past its ceiling earns nothing more while away: stop before the first action */
const advance0 = Q.advanceTime;
Q.advanceTime = (...args) => { if (away()) { let n = 0; while (check() && n++ < 10); } return advance0(...args); };
})();
