/* Idlewick: the sound lands when the swing lands (20 Nov 2026, owner feedback).
   For work you can see being struck (chopping, mining, smithing, crafting, carpentry) the activity scene swings a
   whole number of times per action, in step with the action's own clock, and the work sound plays on each swing's
   impact rather than once when the action finishes. Fishing, cooking and the rest keep their single sound.
   Presentation only: action timing and rewards are untouched. Elapsed time drives everything, so refresh rate and
   frame drops change nothing; reduced motion keeps the sounds without the swinging. */
(() => {
const DQ = window.DQ, D = DQ.data, UI = DQ.ui;
const IMPACT = .4; /* the share of each swing at which the tool meets wood, rock or metal (matches css work keyframes) */
const soundOf = act => {
  if (!act) return null;
  if (act.kind === 'wood') return 'wood';
  if (act.kind === 'mine') return 'mine';
  if (act.kind === 'recipe') { const r = D.RECIPES[act.id]; return r && ({ smithing: 'anvil', crafting: 'stitch', carpentry: 'wood' })[r.skill] || null; }
  return null;
};
let stageEl = null, beatSet = 0, lastStrike = -1, lastAct = null;
/* the working stage inside #view (what '#view .activity-stage.working' finds), from a live list the browser keeps
   current, so a frame never searches the whole page (27 Nov 2026: that search was the biggest per-frame cost in a fight) */
let viewEl = null, stages = null;
const findStage = () => { const v = document.getElementById('view'); if (v !== viewEl) { viewEl = v; stages = v ? v.getElementsByClassName('activity-stage') : null; }
  if (stages) for (const s of stages) if (s.classList.contains('working')) return s; return null; };
const loop = () => {
  const act = DQ.act, name = soundOf(act), stage = name && findStage();
  if (!name || !stage || document.hidden || !act.dur) { DQ.strikeLive = null; stageEl = null; return; }
  const dur = act.dur, swings = Math.max(1, Math.round(dur / 1200)), beat = dur / swings;
  const elapsed = Math.max(0, (Date.now() - act.t0) % dur);
  if (stage !== stageEl || Math.abs(beat - beatSet) > 1 || act !== lastAct) {
    /* one swing per beat, phase-locked to the action's start, so the last swing ends as the action completes */
    stageEl = stage; beatSet = beat; lastAct = act;
    stage.style.setProperty('--work-beat', Math.round(beat) + 'ms');
    stage.querySelectorAll('.scene-worker,.action-tool,.work-atmosphere i').forEach(el => { el.style.animationDuration = Math.round(beat) + 'ms'; el.style.animationDelay = -Math.round(elapsed % beat) + 'ms'; });
    lastStrike = Math.floor(elapsed / beat - IMPACT);
  }
  DQ.strikeLive = name;
  const strike = Math.floor(elapsed / beat - IMPACT);
  if (strike !== lastStrike) { if (strike >= 0) DQ.sfxStrike && DQ.sfxStrike(name); lastStrike = strike; } /* -1 is the wind-up before the first swing lands */
};
DQ.frame.add(loop); /* the shared animation clock (util.js) */
})();
