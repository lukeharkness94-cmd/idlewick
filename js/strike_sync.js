/* Idlewick: the sound lands when the swing lands (20 Nov 2026, owner feedback), now for every skill's real motion
   (skill realism, 27 Nov 2026; docs/skill-realism.md).
   One clock for the work scene. Each activity has a work spec (js/work_rig.js): beat work (chopping, mining, smithing,
   sawing, stitching...) repeats a whole number of swings per action, in step with the action's own clock; action work
   (fishing, thieving, hunting, capture, alchemy) plays one cycle per action. Every frame this works out where in the
   cycle we are, has the rig draw that frame, and then plays each of the cycle's sounds as the frame it belongs to
   appears: the axe's thunk on the frame the bit meets the notch, the float's plop as it lands and the splash as the
   rod strikes, the rasp of the push stroke and the lighter pull of the saw. A sound that marks the action's own end
   (the coin chink of a lifted purse, the alchemy flash) replaces the once-per-task sound, so nothing doubles up.
   Presentation only: action timing and rewards are untouched. Elapsed time drives everything, so refresh rate and
   frame drops change nothing; calm and reduced motion keep the sounds and hold the ready pose. */
(() => {
const DQ = window.DQ, D = DQ.data, UI = DQ.ui;
const R = () => DQ.workRig;
/* the working stage inside #view (what '#view .activity-stage.working' finds), from a live list the browser keeps
   current, so a frame never searches the whole page (27 Nov 2026: that search was the biggest per-frame cost in a fight) */
let viewEl = null, stages = null;
const findStage = () => { const v = document.getElementById('view'); if (v !== viewEl) { viewEl = v; stages = v ? v.getElementsByClassName('activity-stage') : null; }
  if (stages) for (const s of stages) if (s.classList.contains('working')) return s; return null; };
/* the cycle: beat work divides the action into whole swings of about spec.beatMs; action work is one cycle */
DQ.workCycle = (act, spec, now = Date.now()) => {
  const dur = act.dur, beats = spec.mode === 'action' ? 1 : Math.max(1, Math.round(dur / (spec.beatMs || 1200))), beat = dur / beats;
  const elapsed = Math.max(0, (now - act.t0) % dur); return { beat, beats, elapsed, t: (elapsed % beat) / beat, cycle: Math.floor(elapsed / beat) };
};
/* the sound each kind of work used to play once per finished task, kept quiet while its strike sound runs */
const TASK_SOUND = { wood: 'wood', mine: 'mine', fish: 'fish', thieve: 'thieve', alch: 'cast' };
let lastStage = null;
const loop = () => {
  let act = DQ.act, stage = act && findStage(); const rig = R();
  /* no working stage in view: the farm's hoeing, while something grows and the Farming page is open (js/farm_scene.js) */
  if (!stage && DQ.farmWork) { const fw = DQ.farmWork(); if (fw) { act = fw.act; stage = fw.stage; } }
  const spec = rig && act && act.dur && rig.specFor(act);
  if (!spec || !stage || document.hidden) { DQ.strikeLive = null; if (rig) rig.live = null; lastStage = null; return; }
  let r = stage._rig;
  if (!r || r.act !== act || !r.worker.isConnected || !r.sc.isConnected) { r = rig.mount(stage, act, spec); if (!r) { DQ.strikeLive = null; rig.live = null; return; } r.last = {}; }
  const c = DQ.workCycle(act, spec);
  /* (the engine re-bases act.t0 on every tick, so a new action shows as elapsed time starting again, never as a new t0:
     each strike counter falls back to -1 and the next swing plays) */
  if (stage !== lastStage || Math.abs(c.beat - (r.beat || 0)) > 1) {
    /* the body's lean (CSS) runs one loop per cycle, phase-locked to the action's start */
    lastStage = stage; r.beat = c.beat;
    stage.style.setProperty('--work-beat', Math.round(c.beat) + 'ms');
    r.worker.style.animationDuration = Math.round(c.beat) + 'ms'; r.worker.style.animationDelay = -Math.round(c.elapsed % c.beat) + 'ms';
    /* a fresh action: the strikes already behind us this cycle stay played */
    r.last = {}; for (const [j, b] of (spec.beats || []).entries()) r.last[j] = Math.floor(c.elapsed / c.beat - b.at);
  }
  if (rig.freeze != null) c.t = rig.freeze; /* tests and screenshots: hold one moment of the cycle */
  /* swings counted as they pass (a new cycle, or the elapsed time starting again with the next action) */
  if (c.cycle !== r.cyc || c.elapsed + 1 < (r.prevEl || 0)) r.swing = (r.swing || 0) + 1; r.cyc = c.cycle; r.prevEl = c.elapsed;
  r.t = c.t; r.cycleKey = r.swing; rig.live = r;
  /* the strikes this frame crosses; on a slow frame that skipped past one, the strike frame itself is shown with its
     sound (never a sound over the follow-through) */
  const hits = []; (spec.beats || []).forEach((b, j) => { const n = Math.floor(c.elapsed / c.beat - b.at); if (n !== r.last[j]) { if (n >= 0) hits.push(b); r.last[j] = n; } });
  const frame = rig.show(r, hits.length && rig.freeze == null ? hits[hits.length - 1].at : c.t);
  if (spec.heat) rig.heat(r, c.elapsed / act.dur);
  /* each sound plays as its own frame appears (the frame is already on screen: show() ran first) */
  DQ.strikeLive = (spec.beats || []).some(b => b.sfx) ? (TASK_SOUND[act.kind] || (spec.beats.find(b => b.replaces) || {}).replaces || spec.beats[0].sfx) : null;
  for (const b of hits) { r.lastStrike = { sfx: b.sfx, frame, want: rig.frameOf(b.at), at: performance.now() }; if (b.sfx && DQ.sfxStrike) DQ.sfxStrike(b.sfx); if (b.fx) rig.burst(r, b.fx); if (DQ.workScenes) DQ.workScenes.strike(r, b); /* the mark it leaves (js/work_scenes.js) */ }
};
DQ.frame.add(loop); /* the shared animation clock (util.js) */
})();
