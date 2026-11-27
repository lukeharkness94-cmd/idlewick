/* Idlewick: synthesised sound effects and ambient music (no audio files). */
(() => {
const DQ = window.DQ, { rnd, pick } = DQ;
let ctx = null, master, sfxG, musG, ambG, verb, sverb, started = false, hushG = null, hushF = null, verbBuf = null;
const last = {}, recent = [];
const PENT = [0, 2, 4, 7, 9];
const mtof = m => 440 * Math.pow(2, (m - 69) / 12);
const S = () => DQ.S.settings;
const HUSH_OPEN = 20000; /* the hush filter's resting cutoff: wide open, inaudible */

function init() {
  if (ctx) { if (ctx.state === 'suspended') ctx.resume(); return; }
  const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
  ctx = new AC();
  master = ctx.createGain(); sfxG = ctx.createGain(); musG = ctx.createGain();
  ambG = ctx.createGain(); ambG.gain.value = 0;
  /* music and ambience pass through the hush (a gain and a gentle low-pass) so a pop-up can quieten the world under it;
     interface sounds go straight to master, so clicks inside a pop-up stay clear */
  hushG = ctx.createGain(); hushF = ctx.createBiquadFilter(); hushF.type = 'lowpass'; hushF.Q.value = .5; hushF.frequency.value = HUSH_OPEN;
  sfxG.connect(master); musG.connect(hushG); ambG.connect(hushG); hushG.connect(hushF); hushF.connect(master); master.connect(ctx.destination);
  verb = ctx.createConvolver();
  const len = ctx.sampleRate * 2.6, buf = ctx.createBuffer(2, len, ctx.sampleRate);
  for (let c = 0; c < 2; c++) { const d = buf.getChannelData(c); for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2.4); }
  verb.buffer = buf; verbBuf = buf; const vg = ctx.createGain(); vg.gain.value = .7; verb.connect(vg); vg.connect(musG);
  sverb = ctx.createConvolver(); sverb.buffer = buf; const sg = ctx.createGain(); sg.gain.value = .32; sverb.connect(sg); sg.connect(sfxG);
  applyVolumes(); hushApply(true);
}
function applyVolumes() {
  if (!ctx) return; const s = S(), t = ctx.currentTime;
  master.gain.setTargetAtTime(s.muted ? 0 : (s.masterVol ?? 1), t, .05);
  sfxG.gain.setTargetAtTime(s.sfx ? s.vol * .8 : 0, t, .05);
  musG.gain.setTargetAtTime(s.music ? s.musicVol * .45 : 0, t, .3);
  /* ambience sits under everything, and dips during fights so combat reads clearly */
  if (ambG) ambG.gain.setTargetAtTime(s.ambience === false ? 0 : (s.ambVol ?? .45) * .6 * (DQ.act && DQ.act.kind === 'fight' ? .25 : 1), t, .8);
}
function tone(f, dur, o = {}) {
  if (!ctx) return; const t = ctx.currentTime + (o.at || 0);
  const osc = ctx.createOscillator(), g = ctx.createGain();
  osc.type = o.type || 'sine'; osc.frequency.setValueAtTime(f, t);
  if (o.to) osc.frequency.exponentialRampToValueAtTime(Math.max(20, o.to), t + dur);
  const v = (o.v || .2), a = o.a || .005;
  g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(v, t + a); g.gain.exponentialRampToValueAtTime(.0008, t + dur);
  let src = osc; if (o.filt) { const b = ctx.createBiquadFilter(); b.type = o.filt[0]; b.frequency.value = o.filt[1]; b.Q.value = o.filt[2] || 1; osc.connect(b); src = b; }
  src.connect(g); g.connect(o.dest || sfxG); if (o.wet && sverb) g.connect(sverb); osc.start(t); osc.stop(t + dur + .05);
}
function noise(dur, o = {}) {
  if (!ctx) return; const t = ctx.currentTime + (o.at || 0);
  const n = Math.floor(ctx.sampleRate * dur), buf = ctx.createBuffer(1, n, ctx.sampleRate), d = buf.getChannelData(0);
  for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
  const src = ctx.createBufferSource(); src.buffer = buf;
  const f = ctx.createBiquadFilter(); f.type = o.type || 'bandpass'; f.frequency.setValueAtTime(o.f || 1000, t); if (o.to) f.frequency.exponentialRampToValueAtTime(o.to, t + dur); f.Q.value = o.q || 1;
  const g = ctx.createGain(); g.gain.setValueAtTime(o.v || .15, t); g.gain.exponentialRampToValueAtTime(.0008, t + dur);
  src.connect(f); f.connect(g); g.connect(sfxG); src.start(t);
}
/* paper and quill: noise whose loudness jumps every few milliseconds (the grain of a crinkle or a nib on paper), through
   a band-pass that can sweep, with a quick rise and a soft tail. grain = milliseconds per crinkle (default 4–9) */
function paper(dur, o = {}) {
  if (!ctx) return; const t = ctx.currentTime + (o.at || 0), sr = ctx.sampleRate, n = Math.floor(sr * dur), buf = ctx.createBuffer(1, n, sr), d = buf.getChannelData(0);
  let amp = 1, next = 0; for (let i = 0; i < n; i++) { if (i >= next) { amp = .25 + Math.random() * .75; next = i + Math.floor(sr * (o.grain || (4 + Math.random() * 5)) / 1000); } const k = i / n; d[i] = (Math.random() * 2 - 1) * amp * Math.min(1, k * 14) * Math.pow(1 - k, 1.6); }
  const src = ctx.createBufferSource(); src.buffer = buf;
  const f = ctx.createBiquadFilter(); f.type = 'bandpass'; f.frequency.setValueAtTime(o.f || 3000, t); if (o.to) f.frequency.exponentialRampToValueAtTime(o.to, t + dur); f.Q.value = o.q || .7;
  const g = ctx.createGain(); g.gain.value = o.v || .05; src.connect(f); f.connect(g); g.connect(sfxG); src.start(t);
}
const jit = (f, r = .06) => f * (1 + (Math.random() * 2 - 1) * r);
const note = (root, deg) => mtof(root + PENT[deg % 5] + 12 * Math.floor(deg / 5));

/* a soft bell: inharmonic partials with long decays, sent to the reverb */
const bell = (f, at = 0, v = .06) => [[1, 1], [2.01, .5], [2.76, .32], [5.4, .14]].forEach(([m, g], i) => tone(f * m, 1.6 - i * .28, { v: v * g, at, a: .004, wet: true }));
const SFX = {
  click: () => tone(jit(720), .05, { type: 'triangle', v: .06 }),
  tab: () => tone(jit(520), .07, { type: 'triangle', v: .07, to: 640 }),
  start: () => { tone(440, .1, { type: 'triangle', v: .1 }); tone(660, .16, { type: 'triangle', v: .1, at: .08 }); },
  stop: () => { tone(560, .1, { type: 'triangle', v: .09 }); tone(380, .16, { type: 'triangle', v: .09, at: .08 }); },
  error: () => tone(180, .18, { type: 'triangle', v: .12, to: 140 }),
  notify: () => { tone(jit(880, .02), .22, { v: .08 }); tone(jit(1318, .02), .3, { v: .06, at: .09 }); },
  fish: () => { const p = pick([.9, 1, 1.1, 1.2]); tone(420 * p, .13, { to: 170 * p, v: .16 }); tone(900 * p, .05, { v: .05, at: .06 }); noise(.08, { f: 2200, v: .04 }); },
  wood: () => { noise(.07, { f: pick([700, 900, 1100]), q: 2, v: .22 }); tone(jit(130), .1, { type: 'triangle', v: .14, to: 80 }); },
  mine: () => { const b = pick([1500, 1800, 2200]); tone(b, .12, { type: 'triangle', v: .09 }); tone(b * 1.5, .09, { v: .05 }); noise(.04, { f: 3000, v: .08 }); },
  thieve: () => { tone(jit(1568), .08, { v: .06 }); tone(jit(2093), .12, { v: .05, at: .05 }); },
  sizzle: () => noise(.28, { type: 'highpass', f: 4200, v: .07 }),
  anvil: () => { const b = pick([520, 580, 640]); [1, 1.52, 2.41].forEach((m, i) => tone(b * m, .4 - i * .08, { v: .08 / (i + 1), type: i ? 'sine' : 'triangle' })); noise(.03, { f: 3500, v: .1 }); },
  stitch: () => { tone(jit(1200), .03, { type: 'square', v: .03 }); tone(jit(1500), .03, { type: 'square', v: .03, at: .06 }); },
  cast: () => { const r = pick([57, 60, 62, 64]); [0, 2, 4, 5].forEach((d, i) => tone(note(r, d), .35, { v: .06, at: i * .06 })); },
  bow: () => { noise(.12, { f: 1500, to: 400, v: .1 }); tone(220, .12, { type: 'triangle', v: .08, to: 110 }); },
  hit: () => { noise(.08, { type: 'lowpass', f: 900, v: .22 }); tone(jit(95), .12, { type: 'triangle', v: .22, to: 60 }); },
  miss: () => noise(.1, { f: 1800, to: 600, v: .06 }),
  hurt: () => { tone(jit(150), .2, { type: 'sawtooth', v: .1, to: 80 }); noise(.08, { type: 'lowpass', f: 600, v: .12 }); },
  coin: () => { const r = pick([72, 74, 76]); tone(note(r, rnd(0, 4)), .12, { v: .08, type: 'triangle' }); tone(note(r + 12, rnd(0, 4)), .22, { v: .07, at: .06 }); },
  gem: () => { [0, 2, 4, 7].forEach((d, i) => tone(note(84, d), .3, { v: .05, at: i * .05 })); },
  eat: () => { noise(.06, { f: 900, v: .12 }); noise(.06, { f: 700, v: .1, at: .1 }); },
  equip: () => { noise(.06, { type: 'lowpass', f: 900, v: .14 }); tone(jit(180), .12, { type: 'triangle', v: .1, to: 120 }); bell(jit(1320, .03), .05, .025); },
  /* a purchase (27 Nov 2026, "sound that sits in the room"): two small coins touching, then a soft bell on top. It
     replaces the old bright two-note buy blip, so a purchase still makes exactly one sound */
  buy: () => { const c = jit(2637, .03); tone(c, .07, { v: .03 }); tone(c * 1.5, .05, { v: .014 }); tone(jit(2960, .03), .09, { v: .026, at: .075 }); tone(c * 1.33, .06, { v: .012, at: .075 }); bell(jit(1568, .02), .12, .022); },
  /* a page or tab turning: a short crinkle of paper (grainy noise, band-passed high) with a softer lower swish */
  page: () => { paper(.2, { f: 3200, q: .6, v: .05 }); paper(.14, { f: 1100, q: .8, v: .025, at: .04 }); },
  /* a quest accepted: two quick quill strokes and a dot, scratchy noise swept down through a narrow band */
  quill: () => { [[0, .1, 4200, 2700], [.13, .08, 3900, 2900]].forEach(([at, d, f, to]) => paper(d, { f, to, q: 4, v: .09, at, grain: 2 })); paper(.025, { f: 2400, q: 3, v: .06, at: .28, grain: 1 }); },
  sell: () => { tone(1318, .09, { v: .08, type: 'triangle' }); tone(988, .18, { v: .07, at: .07, type: 'triangle' }); },
  level: () => { const r = pick([60, 62, 64, 65]); [0, 4, 7, 12].forEach((d, i) => tone(mtof(r + d), .55, { v: .08, at: i * .09, type: 'triangle', wet: true })); bell(mtof(r + 24), .36, .045); },
  perk: () => { const r = pick([67, 69]); [0, 7, 12, 16].forEach((d, i) => tone(mtof(r + d), .5, { v: .06, at: i * .07 })); },
  ach: () => { [76, 81, 85].forEach((m, i) => tone(mtof(m), .6, { v: .07, at: i * .1 })); },
  quest: () => { [60, 64, 67, 72, 76].forEach((m, i) => tone(mtof(m), .75, { v: .08, at: i * .11, type: 'triangle', wet: true })); bell(mtof(84), .55, .04); },
  boss: () => { [48, 55, 60, 64, 67, 72].forEach((m, i) => { tone(mtof(m), 1.1, { v: .1, at: i * .14, type: 'triangle' }); tone(mtof(m + 12), 1, { v: .04, at: i * .14 }); }); },
  death: () => [64, 60, 57, 52].forEach((m, i) => tone(mtof(m), .5, { v: .1, at: i * .16, type: 'triangle' })),
  travel: () => [0, 1, 2, 3, 4, 5].forEach(i => noise(.05, { type: 'lowpass', f: 500, v: .08, at: i * .22 })),
  unlock: () => { [72, 76, 79].forEach((m, i) => tone(mtof(m), .4, { v: .07, at: i * .08 })); },
  /* a unique find: a bright rising shimmer with a bell on top, unlike ordinary loot */
  unique: () => { [0, 4, 7, 11, 14].forEach((d, i) => tone(mtof(76 + d), .5, { v: .06, at: i * .06, type: 'triangle', wet: true })); bell(mtof(100), .6, .05); },
  restore: () => { [60, 64, 67].forEach((m, i) => tone(mtof(m), 1.4, { type: 'triangle', v: .05, at: i * .02, a: .25, wet: true })); [72, 76, 79, 84].forEach((m, i) => bell(mtof(m), .25 + i * .14, .05)); },
  region: () => { [55, 62, 67].forEach((m, i) => tone(mtof(m), 1.8, { type: 'triangle', v: .055, at: i * .18, a: .35, wet: true })); bell(mtof(79), .7, .05); },
  adventure: () => { [60, 64, 67, 72, 76, 79].forEach((m, i) => tone(mtof(m), .9, { type: 'triangle', v: .07, at: i * .1, wet: true })); bell(mtof(84), .7, .07); bell(mtof(91), .85, .04); },
  collection: () => { [79, 83, 86].forEach((m, i) => bell(mtof(m), i * .09, .05)); },
  /* Item materials (owner, 27 Nov 2026, "a sound for each material"): equipping, unequipping and moving an item between
     the pack, the bank and the equipment slots sounds like what it is made of (DQ.itemMaterial). All short (under
     a quarter of a second), on the effects bus and the Interface filter, about as loud as the old equip thump. */
  /* metal: a bright clink (three inharmonic sine partials around 2.3 kHz, 1 : 2.76 : 5.4, fast decay), a second
     lighter touch 35 ms later, and a short scrape (noise through a narrow band swept 5.2 kHz down to 2.6 kHz) */
  mat_metal: () => { const f = jit(2350, .05); [[1, .03, .16], [2.76, .014, .1], [5.4, .006, .06]].forEach(([m, v, d]) => tone(f * m, d, { v, a: .002 })); tone(jit(3300, .04), .08, { v: .011, at: .035, a: .002 }); noise(.07, { f: 5200, to: 2600, q: 2.5, v: .026, at: .01 }); },
  /* leather: a soft thump (low-passed noise at 320 Hz with a 95 Hz sine dropping to 70) and a small creak (a sawtooth
     bending 150 to 190 Hz through a narrow 900 Hz band) */
  mat_leather: () => { noise(.09, { type: 'lowpass', f: 320, v: .15 }); tone(jit(95), .1, { v: .06, to: 70 }); tone(jit(150), .15, { type: 'sawtooth', v: .03, at: .03, to: 190, filt: ['bandpass', 900, 3] }); },
  /* cloth: a soft rustle, coarse-grained paper noise (9 ms grains) band-passed low and sweeping 1.5 kHz down to 800 Hz,
     with a fainter brush above it */
  mat_cloth: () => { paper(.17, { f: 1500, to: 800, q: .6, v: .045, grain: 9 }); paper(.12, { f: 2600, to: 1800, q: .8, v: .016, at: .05, grain: 6 }); },
  /* wood: a dull knock, a triangle at 210 Hz falling to 150, a 520 Hz body tone and a narrow 900 Hz click */
  mat_wood: () => { tone(jit(210), .09, { type: 'triangle', v: .1, to: 150 }); tone(jit(520), .05, { v: .03, to: 430 }); noise(.035, { f: 900, q: 4, v: .07 }); },
  /* paper and books: a page slipping, fine-grained paper noise sliding 3.6 kHz down to 2.4 kHz with a soft low swish */
  mat_paper: () => { paper(.13, { f: 3600, to: 2400, q: .7, v: .04, grain: 3 }); paper(.08, { f: 1300, q: .9, v: .016, at: .03 }); },
  /* gems and jewellery: a tiny glassy tick-tick, a 4.4 kHz sine with its 2.76 overtone, then a quieter answer a minor
     third up 50 ms later */
  mat_gem: () => { const f = jit(4400, .04); tone(f, .07, { v: .02, a: .001 }); tone(f * 2.76, .04, { v: .007, a: .001 }); tone(f * 1.19, .06, { v: .011, at: .05, a: .001 }); },
  /* food: a soft pat, low-passed noise at 520 Hz and a 130 Hz sine settling to 95 */
  mat_food: () => { noise(.05, { type: 'lowpass', f: 520, v: .11 }); tone(jit(130), .06, { v: .05, to: 95 }); },
  /* potions: a glass touch (a 2.9 kHz sine with a 2.32 overtone, a little reverb) and a slosh (two noise bands sweeping
     520 to 980 Hz and back down 900 to 450 Hz) with one small bubble rising 640 to 1150 Hz */
  mat_potion: () => { const f = jit(2900, .03); tone(f, .14, { v: .022, a: .002, wet: true }); tone(f * 2.32, .08, { v: .007, a: .002 }); noise(.12, { f: 520, to: 980, q: 3, v: .05, at: .05 }); noise(.12, { f: 900, to: 450, q: 3, v: .04, at: .15 }); tone(jit(640), .04, { v: .012, at: .1, to: 1150 }); },
  discover: () => { tone(1047,.12,{type:'triangle',v:.075});tone(1568,.24,{type:'triangle',v:.065,at:.08});tone(2093,.38,{v:.045,at:.17}); },
};
/* Sounds that fire once per finished task are thinned out and varied so they never become a metronome */
const TASK = new Set(['fish', 'wood', 'mine', 'thieve', 'sizzle', 'anvil', 'stitch', 'cast', 'bow', 'hit', 'miss']);
/* soft interface sounds wait longer before they repeat, so rapid clicks never machine-gun (and a purchase that two
   systems both announce still sounds once) */
const GAP = { page: 350, quill: 400, buy: 250, mat_metal: 90, mat_leather: 90, mat_cloth: 90, mat_wood: 90, mat_paper: 90, mat_gem: 90, mat_food: 90, mat_potion: 90 };
const played = {};
const quiet = () => !!(DQ.sim.on || DQ.forecasting);
DQ.sfx = name => {
  const s = S(); if (!s.sfx || s.muted || quiet()) return;
  if (!ctx) return; const now = performance.now();
  if (TASK.has(name)) {
    if (s.taskSounds === 'off' || DQ.strikeLive === name) return;
    const gap = s.taskSounds === 'varied' ? 450 : 900, prob = s.taskSounds === 'varied' ? .78 : .45;
    if (now - (last[name] || 0) < gap && name !== 'hit' && name !== 'miss') return;
    if (Math.random() > prob && name !== 'hit') return;
  } else if (now - (last[name] || 0) < (GAP[name] || 60)) return;
  const IMPORTANT = new Set(['level', 'quest', 'boss', 'death', 'restore', 'region', 'adventure', 'discover', 'unlock', 'ach', 'collection', 'unique']);
  recent.push(now); while (recent.length && now - recent[0] > 400) recent.shift();
  if (recent.length > 5 && !IMPORTANT.has(name)) return;
  last[name] = now; played[name] = (played[name] || 0) + 1; try { SFX[name] && SFX[name](); } catch (e) {}
};
/* Strike sounds (20 Nov 2026): js/strike_sync.js plays the work sound as each swing lands on screen. While it does,
   the once-per-finished-task sound for that kind stays quiet so nothing doubles up. */
DQ.strikeLive = null;
DQ.sfxStrike = name => {
  const s = S(); if (!s.sfx || s.muted || quiet() || !ctx || s.taskSounds === 'off') return;
  const now = performance.now(); if (now - (last['strike:' + name] || 0) < 140) return;
  last['strike:' + name] = now; try { SFX[name] && SFX[name](); } catch (e) {}
};
DQ.audioInit = init;
DQ.audioApply = applyVolumes;
DQ.setMuted = m => { DQ.S.settings.muted = m; applyVolumes(); DQ.roomRefresh && DQ.roomRefresh(); DQ.emit('settings'); };

/* ---------- Music: a theme for every region, combat and bosses (21 Nov 2026, owner: "something different for combat
   and each region"). Synthesised, no files. Each theme is data: key and mode, tempo, metre (4/4 in sixteenths or 6/8 in
   eighths), a chord progression, four short melody motifs played as a phrase (A A B A, then C D), a lead instrument, a
   bass line, an accompaniment and a drum pattern. A small lookahead sequencer schedules notes on the audio clock, and a
   change of theme crossfades at the next bar. Combat and boss themes borrow the region's key and lead instrument, so a
   fight in Saltmere still sounds like Saltmere, only faster and with drums. */
const MODE = { ionian: [0, 2, 4, 5, 7, 9, 11], dorian: [0, 2, 3, 5, 7, 9, 10], phrygian: [0, 1, 3, 5, 7, 8, 10], lydian: [0, 2, 4, 6, 7, 9, 11], mixolydian: [0, 2, 4, 5, 7, 9, 10], aeolian: [0, 2, 3, 5, 7, 8, 10], harmonic: [0, 2, 3, 5, 7, 8, 11], locrian: [0, 1, 3, 5, 6, 8, 10] };
/* motif notes are [step, scale degree above the chord root, length in steps]; null = a bar of rest */
const MUS = {
  title: { bpm: 76, root: 62, mode: 'ionian', steps: 16, prog: [0, 4, 5, 3], lead: 'flute', acc: 'harp', drums: null, pad: true,
    motifs: [[[0, 4, 4], [4, 2, 2], [6, 4, 2], [8, 7, 6]], [[0, 2, 4], [4, 4, 4], [8, 2, 2], [10, 0, 6]], [[0, 7, 2], [2, 6, 2], [4, 4, 4], [8, 2, 8]], [[0, 0, 12]]] },
  willowbrook: { bpm: 96, root: 55, mode: 'ionian', steps: 16, prog: [0, 3, 0, 4, 5, 3, 4, 0], lead: 'flute', acc: 'harp', bass: 'root2', drums: { k: [0, 8], t: [12] }, pad: false,
    motifs: [[[0, 0, 2], [2, 2, 2], [4, 4, 4], [8, 2, 2], [10, 4, 2], [12, 7, 4]], [[0, 7, 2], [2, 6, 2], [4, 4, 2], [6, 2, 2], [8, 4, 8]], [[0, 4, 3], [3, 5, 1], [4, 4, 2], [6, 2, 2], [8, 0, 4], [12, 2, 4]], [[0, 2, 4], [4, 1, 2], [6, 0, 10]]] },
  mossbarrow: { bpm: 112, root: 50, mode: 'dorian', steps: 12, prog: [0, 6, 0, 3, 0, 6, 4, 0], lead: 'fiddle', acc: 'drone', bass: 'jig', drums: { k: [0, 6], t: [3, 9] }, pad: false,
    motifs: [[[0, 0, 1], [1, 2, 1], [2, 4, 1], [3, 7, 2], [5, 4, 1], [6, 2, 1], [7, 4, 1], [8, 2, 1], [9, 0, 3]], [[0, 4, 2], [2, 5, 1], [3, 4, 1], [4, 2, 1], [5, 0, 1], [6, 2, 3], [9, 1, 3]], [[0, 7, 1], [1, 6, 1], [2, 4, 1], [3, 5, 1], [4, 4, 1], [5, 2, 1], [6, 4, 6]], [[0, 2, 3], [3, 1, 3], [6, 0, 6]]] },
  saltmere: { bpm: 92, root: 57, mode: 'aeolian', steps: 12, prog: [0, 0, 6, 6, 5, 3, 4, 0], lead: 'squeeze', acc: 'chords68', bass: 'shanty', drums: { k: [0, 6], s: [9] }, pad: false,
    motifs: [[[0, 4, 2], [2, 4, 1], [3, 4, 2], [5, 2, 1], [6, 0, 3], [9, 2, 3]], [[0, 4, 3], [3, 5, 3], [6, 7, 6]], [[0, 7, 2], [2, 6, 1], [3, 4, 2], [5, 2, 1], [6, 4, 2], [8, 2, 1], [9, 0, 3]], [[0, 2, 2], [2, 1, 1], [3, 0, 9]]] },
  ironpeak: { bpm: 72, root: 45, mode: 'dorian', steps: 16, prog: [0, 0, 6, 3, 0, 4, 6, 0], lead: 'horn', acc: 'pad', bass: 'drone', drums: { k: [0], anvil: [8] }, pad: true,
    motifs: [[[0, 0, 4], [4, 4, 4], [8, 3, 8]], [[0, 4, 6], [6, 2, 2], [8, 0, 8]], null, [[0, 7, 4], [4, 4, 4], [8, 6, 4], [12, 4, 4]]] },
  gloomfen: { bpm: 64, root: 52, mode: 'phrygian', steps: 16, prog: [0, 1, 0, 6, 0, 1, 5, 0], lead: 'bell', acc: 'choir', bass: 'pulse', drums: null, pad: true,
    motifs: [[[0, 4, 6], [8, 3, 4], [12, 1, 4]], null, [[0, 0, 4], [4, 1, 4], [8, 4, 8]], [[4, 7, 4], [8, 6, 8]]] },
  emberfall: { bpm: 124, root: 50, mode: 'harmonic', steps: 16, prog: [0, 0, 5, 4, 0, 0, 3, 4], lead: 'brass', acc: 'stab', bass: 'drive', drums: { k: [0, 6, 8], s: [4, 12], h: [2, 6, 10, 14] }, pad: false,
    motifs: [[[0, 0, 2], [2, 0, 1], [3, 2, 1], [4, 4, 4], [8, 6, 2], [10, 4, 6]], [[0, 7, 3], [3, 6, 1], [4, 4, 4], [8, 2, 2], [10, 1, 2], [12, 0, 4]], [[0, 4, 2], [2, 4, 2], [4, 5, 2], [6, 4, 2], [8, 6, 8]], [[0, 7, 4], [4, 6, 4], [8, 0, 8]]] },
  skyreach: { bpm: 84, root: 53, mode: 'lydian', steps: 16, prog: [0, 1, 0, 1, 5, 4, 1, 0], lead: 'flute', acc: 'arp16', bass: 'root2', drums: null, pad: true, high: 12,
    motifs: [[[0, 4, 4], [4, 3, 2], [6, 4, 2], [8, 7, 8]], [[0, 9, 4], [4, 7, 4], [8, 4, 8]], null, [[0, 2, 2], [2, 3, 2], [4, 4, 4], [8, 7, 4], [12, 4, 4]]] },
  hollow: { bpm: 58, root: 47, mode: 'locrian', steps: 16, prog: [0, 1, 0, 4, 0, 6, 1, 0], lead: 'bell', acc: 'choir', bass: 'drone', drums: null, pad: true,
    motifs: [[[0, 0, 8], [8, 1, 8]], null, [[4, 4, 4], [8, 3, 8]], null] },
  combat: { bpm: 138, mode: 'aeolian', steps: 16, prog: [0, 0, 5, 6, 0, 0, 3, 4], acc: 'ostinato', bass: 'drive', drums: { k: [0, 3, 8, 11], s: [4, 12], h: [0, 2, 4, 6, 8, 10, 12, 14] }, pad: false, fight: true,
    motifs: [[[0, 4, 2], [2, 4, 2], [4, 5, 2], [6, 4, 2], [8, 7, 4], [12, 6, 4]], [[0, 4, 3], [3, 2, 3], [6, 0, 2], [8, 2, 8]], [[0, 7, 2], [2, 7, 2], [4, 6, 2], [6, 7, 2], [8, 9, 8]], [[0, 4, 4], [4, 2, 4], [8, 1, 4], [12, 0, 4]]] },
  boss: { bpm: 150, mode: 'harmonic', steps: 16, prog: [0, 0, 5, 4, 0, 1, 5, 4], lead: 'brass', acc: 'ostinato', bass: 'drive', drums: { k: [0, 2, 8, 10], s: [4, 12], h: [2, 6, 10, 14], timp: [0, 8] }, pad: true, fight: true,
    motifs: [[[0, 0, 4], [4, 4, 4], [8, 7, 6], [14, 6, 2]], [[0, 7, 4], [4, 6, 2], [6, 4, 2], [8, 3, 8]], [[0, 4, 2], [2, 4, 2], [4, 4, 2], [6, 5, 2], [8, 6, 8]], [[0, 7, 8], [8, 0, 8]]] },
};
if (DQ.data) DQ.data.MUSIC = MUS;
/* combat and boss themes in each region's key with its lead */
const REGION_KEY = { willowbrook: 55, mossbarrow: 50, saltmere: 57, ironpeak: 45, gloomfen: 52, emberfall: 50, skyreach: 53, hollow: 47 };
const PHRASE = [0, 0, 1, 0, 2, 3, 2, 1];
let modeId = 'title', themeId = null, bus = null, seqTimer = null, nextT = 0, step = 0, bar = 0, theme = null;
const isBossy = () => { const m = DQ.fight && DQ.data && DQ.data.MON[DQ.fight.id]; return !!(m && (m.boss || m.mini || m.tower)); };
/* what should be playing now: the title, a fight, or the town you are in */
DQ.musicTheme = () => { if (modeId === 'title') return 'title'; const st = DQ.S; if (DQ.act && DQ.act.kind === 'fight') return isBossy() ? 'boss' : 'combat'; return (st && MUS[st.town]) ? st.town : 'willowbrook'; };
/* Lo-fi treatment (owner, 26 Nov 2026: "the music is a little intense - could it be a little more lo-fi"): every theme
   keeps its tune and key but plays about 18% slower with a light swing, through a warm tape filter with a slow pitch wobble
   and a faint vinyl hiss; leads and drums are softer and the hats nearly gone. The composed tempos stay in D.MUSIC. */
const LOFI = { tempo: .82, swing: .16, cutoff: 1900, wobble: 7, hiss: .006, hats: .3, snare: .55, kick: .8 };
if (DQ.data) DQ.data.MUSIC_LOFI = LOFI;
const build = id => { const town = (DQ.S && DQ.S.town) || 'willowbrook', base = MUS[id] || MUS.title, slow = t => Object.assign({}, t, { bpm: Math.round(t.bpm * LOFI.tempo) });
  if (!base.fight) return slow(base); const region = MUS[town] || MUS.willowbrook;
  return slow(Object.assign({}, base, { root: REGION_KEY[town] || 55, lead: base.lead || region.lead || 'fiddle', town })); };
/* ---- instruments: each takes (time, midi, seconds, gain) and plays into the theme bus ---- */
const out = (node, wet = .5) => { node.connect(bus); if (verb && wet) { const w = ctx.createGain(); w.gain.value = wet; node.connect(w); w.connect(verb); } };
const env = (g, t, a, d, v, rel = .08) => { g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(v, t + a); g.gain.setTargetAtTime(v * .7, t + a, d * .4); g.gain.setTargetAtTime(0, t + d, rel); };
const osc = (type, f, t, end, dest, detune = 0) => { const o = ctx.createOscillator(); o.type = type; o.frequency.setValueAtTime(f, t); o.detune.value = detune; if (tape && tape.wob) tape.wob.connect(o.detune); o.connect(dest); o.start(t); o.stop(end + .5); return o; };
const vib = (o, t, end, rate = 5.2, depth = 5) => { const l = ctx.createOscillator(), lg = ctx.createGain(); l.frequency.value = rate; lg.gain.setValueAtTime(0, t); lg.gain.linearRampToValueAtTime(depth, t + .25); l.connect(lg); lg.connect(o.detune); l.start(t); l.stop(end + .5); };
const lp = (f, q = .7) => { const b = ctx.createBiquadFilter(); b.type = 'lowpass'; b.frequency.value = f; b.Q.value = q; return b; };
const INST = {
  flute: (t, m, d, v) => { const g = ctx.createGain(), f = lp(2600); f.connect(g); vib(osc('triangle', mtof(m), t, t + d, f), t, t + d); osc('sine', mtof(m) * 2, t, t + d, f); env(g, t, .06, d, v * .9); out(g, .55); },
  fiddle: (t, m, d, v) => { const g = ctx.createGain(), f = lp(1400, .9); f.connect(g); const o = osc('sawtooth', mtof(m), t, t + d, f); vib(o, t, t + d, 6, 8); env(g, t, .03, d, v * .55); out(g, .4); },
  squeeze: (t, m, d, v) => { const g = ctx.createGain(), f = lp(1200); f.connect(g); osc('square', mtof(m), t, t + d, f); osc('square', mtof(m), t, t + d, f, 9); env(g, t, .04, d, v * .32); out(g, .35); },
  horn: (t, m, d, v) => { const g = ctx.createGain(), f = lp(500); f.frequency.setValueAtTime(400, t); f.frequency.linearRampToValueAtTime(1300, t + .18); f.frequency.setTargetAtTime(800, t + .2, .3); f.connect(g); osc('sawtooth', mtof(m), t, t + d, f); osc('sawtooth', mtof(m - 12), t, t + d, f, 4); env(g, t, .12, d, v * .5); out(g, .6); },
  brass: (t, m, d, v) => { const g = ctx.createGain(), f = lp(900, 2); f.frequency.setValueAtTime(600, t); f.frequency.linearRampToValueAtTime(1500, t + .06); f.frequency.setTargetAtTime(1000, t + .08, .15); f.connect(g); osc('sawtooth', mtof(m), t, t + d, f); osc('sawtooth', mtof(m), t, t + d, f, -7); env(g, t, .03, d, v * .42); out(g, .35); },
  bell: (t, m, d, v) => { [[1, 1, 2.4], [2.01, .45, 1.6], [2.76, .25, 1.1], [5.4, .1, .6]].forEach(([k, a, len]) => { const g = ctx.createGain(); osc('sine', mtof(m) * k, t, t + len, g); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(v * a * .7, t + .005); g.gain.exponentialRampToValueAtTime(.0005, t + len); out(g, .8); }); },
  harp: (t, m, d, v) => { const g = ctx.createGain(); osc('triangle', mtof(m), t, t + 1.4, g); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(v * .55, t + .005); g.gain.exponentialRampToValueAtTime(.0005, t + 1.3); out(g, .6); },
  bass: (t, m, d, v) => { const g = ctx.createGain(), f = lp(420); f.connect(g); osc('triangle', mtof(m), t, t + d, f); osc('sine', mtof(m), t, t + d, f); env(g, t, .01, d * .9, v * .8, .05); out(g, 0); },
  pad: (t, m, d, v) => { const g = ctx.createGain(), f = lp(900); f.connect(g); [-6, 6].forEach(c => osc('sawtooth', mtof(m), t, t + d, f, c)); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(v * .16, t + d * .35); g.gain.linearRampToValueAtTime(0, t + d); out(g, .8); },
  choir: (t, m, d, v) => { const g = ctx.createGain(), f = ctx.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 700; f.Q.value = 1.4; f.connect(g); [-9, 0, 9].forEach(c => osc('sawtooth', mtof(m), t, t + d, f, c)); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(v * .5, t + d * .4); g.gain.linearRampToValueAtTime(0, t + d); out(g, 1); },
};
const noiseBuf = (() => { let b = null; return () => { if (b) return b; const n = ctx.sampleRate, buf = ctx.createBuffer(1, n, ctx.sampleRate), d = buf.getChannelData(0); for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1; return (b = buf); }; })();
const hit = (t, type, f, len, v, q = 1) => { const s = ctx.createBufferSource(); s.buffer = noiseBuf(); const b = ctx.createBiquadFilter(); b.type = type; b.frequency.value = f; b.Q.value = q; const g = ctx.createGain(); g.gain.setValueAtTime(v, t); g.gain.exponentialRampToValueAtTime(.0005, t + len); s.connect(b); b.connect(g); out(g, .15); s.start(t, Math.random() * .5); s.stop(t + len + .05); };
const DRUM = {
  k: (t, v) => { const g = ctx.createGain(), o = osc('sine', 120, t, t + .3, g); o.frequency.exponentialRampToValueAtTime(42, t + .22); g.gain.setValueAtTime(v * .9, t); g.gain.exponentialRampToValueAtTime(.0005, t + .28); out(g, 0); },
  t: (t, v) => { const g = ctx.createGain(), o = osc('sine', 150, t, t + .3, g); o.frequency.exponentialRampToValueAtTime(80, t + .2); g.gain.setValueAtTime(v * .6, t); g.gain.exponentialRampToValueAtTime(.0005, t + .25); out(g, .2); hit(t, 'lowpass', 600, .08, v * .15); },
  s: (t, v) => { hit(t, 'bandpass', 1800, .16, v * .45, .8); const g = ctx.createGain(); osc('triangle', 190, t, t + .1, g); g.gain.setValueAtTime(v * .25, t); g.gain.exponentialRampToValueAtTime(.0005, t + .1); out(g, .2); },
  h: (t, v) => hit(t, 'highpass', 7000, .05, v * .2),
  anvil: (t, v) => { INST.bell(t, 84, .5, v * .5); },
  timp: (t, v) => { const g = ctx.createGain(), o = osc('sine', 82, t, t + 1.2, g); o.frequency.exponentialRampToValueAtTime(70, t + 1); g.gain.setValueAtTime(v * .9, t); g.gain.exponentialRampToValueAtTime(.0005, t + 1.1); out(g, .4); },
};
const scaleNote = (th, deg) => { const sc = MODE[th.mode] || MODE.ionian, o = Math.floor(deg / 7); return th.root + sc[((deg % 7) + 7) % 7] + 12 * o; };
function playBar(t0) {
  const th = theme, sd = 60 / th.bpm / (th.steps === 12 ? 2 : 4), chord = th.prog[bar % th.prog.length], n = th.steps, barLen = sd * n;
  const tri = [chord, chord + 2, chord + 4].map(d => scaleNote(th, d)), V = .2, at = i => t0 + i * sd + (n === 16 && i % 2 ? sd * LOFI.swing : 0);
  /* pad or choir under everything */
  if (th.pad) tri.forEach(m => (th.acc === 'choir' ? INST.choir : INST.pad)(t0, m, barLen * 1.05, V * .5));
  /* accompaniment */
  const acc = th.acc;
  if (acc === 'harp') for (let i = 0; i < n; i += 2) INST.harp(at(i), tri[[0, 1, 2, 1][(i / 2) % 4]] + 12, sd * 2, V * .5);
  if (acc === 'arp16') for (let i = 0; i < n; i++) INST.bell(at(i), tri[i % 3] + 12 + (i % 6 > 2 ? 12 : 0), sd, V * .25);
  if (acc === 'chords68') [0, 3, 6, 9].forEach(i => tri.forEach(m => INST.squeeze(t0 + i * sd, m, sd * 1.6, V * .22)));
  if (acc === 'drone') INST.fiddle(t0, th.root - 12, barLen, V * .25);
  if (acc === 'stab') [0, 6, 10].forEach(i => tri.forEach(m => INST.brass(t0 + i * sd, m, sd * 1.5, V * .25)));
  if (acc === 'ostinato') for (let i = 0; i < n; i += 2) INST.fiddle(at(i), tri[[0, 2, 1, 2][(i / 2) % 4]], sd * 1.8, V * .35);
  /* bass */
  const b = th.bass, root = tri[0] - 24;
  if (b === 'root2') [0, n / 2].forEach(i => INST.bass(t0 + i * sd, root, sd * n / 2.2, V));
  if (b === 'jig') [0, 3, 6, 9].forEach((i, k) => INST.bass(t0 + i * sd, k % 2 ? root + 7 : root, sd * 2.6, V));
  if (b === 'shanty') [0, 6].forEach((i, k) => INST.bass(t0 + i * sd, k ? root + 7 : root, sd * 5, V));
  if (b === 'drone') INST.bass(t0, root, barLen * .98, V * .8);
  if (b === 'pulse') [0, 8].forEach(i => INST.bass(t0 + i * sd, root, sd * 6, V * .7));
  if (b === 'drive') for (let i = 0; i < n; i += 2) INST.bass(t0 + i * sd, root + (i === 14 ? 7 : 0), sd * 1.6, V * .9);
  /* drums */
  if (th.drums) for (const [k, steps] of Object.entries(th.drums)) for (const i of steps) if (DRUM[k]) DRUM[k](at(i), V * (k === 'h' ? LOFI.hats : k === 's' ? LOFI.snare : k === 'k' ? LOFI.kick : .8));
  /* the tune: a phrase of motifs, the last bar of the progression resolving */
  const mo = th.motifs[PHRASE[bar % PHRASE.length] % th.motifs.length], lead = INST[th.lead] || INST.flute;
  if (mo) for (const [s, deg, len] of mo) lead(at(s), scaleNote(th, chord + deg) + 12 + (th.high || 0), Math.max(sd, len * sd * .95), V * .6);
  return barLen;
}
function sequencer() {
  if (!ctx || !theme) return;
  /* schedule a little ahead on the audio clock; a timer this coarse never affects timing, only how far ahead we plan */
  if (nextT < ctx.currentTime - .1) nextT = ctx.currentTime + .05; /* back from a hidden tab: start fresh, never catch up */
  while (nextT < ctx.currentTime + .35) { const len = playBar(nextT); nextT += len; bar++; step++; }
}
let tape = null;
const tapeChain = () => { if (tape) return tape;
  const hp = ctx.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 70;
  const lo = ctx.createBiquadFilter(); lo.type = 'lowpass'; lo.frequency.value = LOFI.cutoff; lo.Q.value = .5;
  hp.connect(lo); lo.connect(musG);
  const lfo = ctx.createOscillator(), wob = ctx.createGain(); lfo.frequency.value = .35; wob.gain.value = LOFI.wobble; lfo.connect(wob); lfo.start();
  const n = ctx.sampleRate * 2, b = ctx.createBuffer(1, n, ctx.sampleRate), d = b.getChannelData(0); let last = 0;
  for (let i = 0; i < n; i++) { last = (last + .02 * (Math.random() * 2 - 1)) / 1.02; d[i] = last * 3 + (Math.random() < .0004 ? (Math.random() - .5) * .6 : 0); }
  const src = ctx.createBufferSource(); src.buffer = b; src.loop = true; const hg = ctx.createGain(); hg.gain.value = LOFI.hiss; src.connect(hg); hg.connect(lo); src.start();
  return (tape = { in: hp, wob }); };
function switchTheme(id) {
  if (!ctx) { themeId = null; return; }
  if (id === themeId && bus) return;
  const t = ctx.currentTime;
  if (bus) { const old = bus; old.gain.setTargetAtTime(0, t, .5); setTimeout(() => { try { old.disconnect(); } catch (e) {} }, 4000); }
  bus = ctx.createGain(); bus.gain.setValueAtTime(0, t); bus.gain.setTargetAtTime(1, t + .1, .6); bus.connect(tapeChain().in);
  themeId = id; theme = build(id); bar = 0; nextT = t + .15;
}
function musicTick() {
  if (!ctx || !S().music || ctx.state !== 'running') return;
  const want = DQ.musicTheme(), th = build(want);
  if (want !== themeId || (theme && theme.fight && th.root !== theme.root)) switchTheme(want);
  sequencer();
}
function musicStep() { if (!seqTimer) seqTimer = setInterval(musicTick, 90); musicTick(); }
const stopMusic = () => { if (seqTimer) { clearInterval(seqTimer); seqTimer = null; } if (bus && ctx) { const old = bus; old.gain.setTargetAtTime(0, ctx.currentTime, .3); setTimeout(() => { try { old.disconnect(); } catch (e) {} }, 2000); } bus = null; themeId = null; };
/* ---------- Nature ambience: a soft procedural bed per region plus occasional details ---------- */
/* Data-driven (Dec 2026, World Life): one definition per village. `bed` is the place itself (river, forest, sea, wind);
   `nature` are its own sounds at any time; `tiers` are what the people add as the village is restored. A broken village
   is wind, crows and the odd hammer; a restored one has chatter, children, crafters and a bell. Adding a village or a
   tier is a row here, not code. Each entry is [sound, shortest gap, longest gap] in seconds. */
const D = DQ.data || {};
D.AMBIENCE = {
  willowbrook: { bed: ['lowpass', 520, .05], nature: [['bird', 4, 10]], tiers: { ruined: [['wind', 6, 14], ['crow', 9, 20], ['hammer', 18, 40]], mending: [['hammer', 7, 16], ['saw', 10, 22], ['chatter', 12, 26]], restored: [['chatter', 4, 10], ['children', 9, 20], ['anvil', 8, 18], ['bell', 40, 80]] } },
  mossbarrow: { bed: ['lowpass', 620, .055], nature: [['bird', 4, 10], ['cricket', 6, 14]], tiers: { ruined: [['wind', 7, 15], ['crow', 8, 18], ['creak', 12, 26]], mending: [['saw', 8, 18], ['hammer', 9, 20], ['chatter', 14, 28]], restored: [['chatter', 5, 11], ['children', 10, 22], ['saw', 9, 20], ['cowbell', 12, 26]] } },
  saltmere: { bed: ['lowpass', 780, .06], swell: 7, nature: [['gull', 8, 18]], tiers: { ruined: [['wind', 6, 13], ['creak', 8, 18], ['gull', 14, 30]], mending: [['hammer', 8, 18], ['creak', 10, 20], ['chatter', 13, 26]], restored: [['chatter', 4, 10], ['shipbell', 14, 30], ['market', 8, 18], ['children', 12, 24]] } },
  ironpeak: { bed: ['bandpass', 1300, .035], whistle: true, nature: [['drip', 5, 11]], tiers: { ruined: [['wind', 4, 10], ['crow', 12, 26], ['rockfall', 16, 36]], mending: [['hammer', 6, 14], ['anvil', 10, 22], ['chatter', 15, 30]], restored: [['anvil', 4, 10], ['chatter', 6, 14], ['bellows', 8, 18], ['bell', 45, 90]] } },
  gloomfen: { bed: ['lowpass', 380, .05], nature: [['frog', 3, 7], ['cricket', 4, 9]], tiers: { ruined: [['wind', 8, 16], ['crow', 7, 15], ['creak', 10, 22]], mending: [['hammer', 9, 20], ['creak', 9, 20], ['chatter', 15, 30]], restored: [['chatter', 6, 13], ['shipbell', 18, 36], ['children', 14, 28], ['market', 10, 22]] } },
  emberfall: { bed: ['lowpass', 260, .06], nature: [['crackle', 1, 3]], tiers: { ruined: [['wind', 6, 14], ['rockfall', 12, 28], ['crow', 14, 30]], mending: [['anvil', 7, 16], ['bellows', 9, 20], ['chatter', 14, 28]], restored: [['anvil', 3, 8], ['bellows', 6, 13], ['chatter', 6, 14], ['bell', 40, 80]] } },
  skyreach: { bed: ['highpass', 2200, .02], nature: [['chime', 6, 14], ['bird', 9, 18]], tiers: { ruined: [['wind', 4, 9], ['crow', 14, 30]], mending: [['hammer', 9, 20], ['chime', 8, 16], ['chatter', 15, 30]], restored: [['chatter', 7, 15], ['bell', 18, 36], ['children', 14, 28], ['chime', 5, 11]] } },
  hollow: { bed: ['lowpass', 300, .04], drone: true, nature: [['whisper', 8, 16]], tiers: { ruined: [['wind', 7, 15]], mending: [['hammer', 12, 26], ['whisper', 10, 20]], restored: [['chatter', 10, 22], ['bell', 30, 60]] } },
};
D.AMBIENCE_FESTIVAL = [['children', 3, 7], ['market', 3, 8], ['pipe', 2, 5], ['chatter', 2, 6]];
/* how restored a village is: its finished, undamaged projects */
DQ.restorationTier = town => { const st = DQ.S, P = Object.entries((DQ.data || {}).PROJECTS || {}).filter(([, p]) => p.town === town); if (!st || !P.length) return 'mending';
  const f = P.filter(([id]) => st.projects[id] && !(st.damaged || {})[id]).length / P.length; return f < .34 ? 'ruined' : f < .75 ? 'mending' : 'restored'; };
/* the whole audio state as plain data (no AudioContext needed): what should be playing, and how loud the village is */
DQ.ambiencePlan = (town, tier, o = {}) => { const A = D.AMBIENCE[town] || D.AMBIENCE.willowbrook, calm = !!o.calm;
  const layers = o.combat ? [] : [...A.nature, ...(A.tiers[tier] || []), ...(o.festival ? D.AMBIENCE_FESTIVAL : [])].map(([n, lo, hi]) => [n, calm ? lo * 2 : lo, calm ? hi * 2 : hi]);
  return { town, tier, bed: A.bed, layers, duck: o.combat ? .25 : 1, key: `${town}|${tier}|${o.festival ? 1 : 0}` }; };
DQ.audioState = () => { const st = DQ.S; if (!st) return null; const town = st.town || 'willowbrook', combat = !!(DQ.act && DQ.act.kind === 'fight'), on = st.settings.ambience !== false && !st.settings.muted;
  const plan = DQ.ambiencePlan(town, DQ.restorationTier(town), { combat, festival: !!(DQ.worldFestival && DQ.worldFestival()), calm: !!st.settings.reduceFx });
  return Object.assign(plan, { mode: combat ? 'combat' : 'village', music: combat ? (isBossy() ? 'boss' : 'combat') : town, ambienceOn: on, volumes: { master: st.settings.muted ? 0 : (st.settings.masterVol ?? 1), music: st.settings.music ? st.settings.musicVol : 0, ambience: st.settings.ambience === false ? 0 : (st.settings.ambVol ?? .45) * plan.duck, effects: st.settings.sfx ? st.settings.vol : 0 } }); };
let ambTown = null, ambKey = null, ambNodes = [], ambLoop = null;
/* ambience timers forget themselves once they fire, so a long session never accumulates thousands of stale ids */
const ambTimers = new Set(), later = (fn, ms) => { const id = setTimeout(() => { ambTimers.delete(id); fn(); }, ms); ambTimers.add(id); };
const ambTone = (f, dur, o = {}) => tone(f, dur, Object.assign({ dest: ambG }, o));
const AMB_EVENT = {
  bird: () => { const b = 2200 + Math.random() * 1400, n = 2 + Math.floor(Math.random() * 3); for (let i = 0; i < n; i++) ambTone(b * (1 + Math.random() * .12), .09, { v: .05, at: i * .13, to: b * (1.25 + Math.random() * .2) }); },
  cricket: () => { for (let i = 0; i < 6; i++) ambTone(4300 + Math.random() * 200, .03, { v: .02, at: i * .07, type: 'square' }); },
  gull: () => { ambTone(1500, .35, { v: .04, to: 900, type: 'triangle' }); ambTone(1450, .3, { v: .03, at: .4, to: 850, type: 'triangle' }); },
  wind: () => { if (!ctx) return; const t = ctx.currentTime, n = ctx.sampleRate * 3, b = ctx.createBuffer(1, n, ctx.sampleRate), d = b.getChannelData(0); for (let k = 0; k < n; k++) d[k] = Math.random() * 2 - 1; const src = ctx.createBufferSource(); src.buffer = b; const f = ctx.createBiquadFilter(); f.type = 'bandpass'; f.Q.value = 2; f.frequency.setValueAtTime(300, t); f.frequency.linearRampToValueAtTime(700 + Math.random() * 500, t + 1.4); f.frequency.linearRampToValueAtTime(260, t + 3); const g = ctx.createGain(); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(.09, t + 1.2); g.gain.linearRampToValueAtTime(0, t + 3); src.connect(f); f.connect(g); g.connect(ambG); src.start(t); },
  crow: () => { const n = 2 + Math.floor(Math.random() * 2); for (let i = 0; i < n; i++) ambTone(620 + Math.random() * 60, .22, { v: .035, at: i * .34, to: 480, type: 'sawtooth' }); },
  hammer: () => { const n = 2 + Math.floor(Math.random() * 3); for (let i = 0; i < n; i++) { ambTone(190, .07, { v: .06, at: i * .42, type: 'square', to: 120 }); ambTone(1700, .04, { v: .02, at: i * .42 }); } },
  saw: () => { for (let i = 0; i < 4; i++) ambTone(240 + (i % 2) * 70, .2, { v: .022, at: i * .26, type: 'sawtooth', to: 200 + (i % 2) * 60 }); },
  anvil: () => { const n = 1 + Math.floor(Math.random() * 3); for (let i = 0; i < n; i++) { ambTone(2100, .5, { v: .035, at: i * .5 }); ambTone(3150, .35, { v: .018, at: i * .5 }); } },
  bellows: () => { if (!ctx) return; const t = ctx.currentTime, n = ctx.sampleRate * 1.4, b = ctx.createBuffer(1, n, ctx.sampleRate), d = b.getChannelData(0); for (let k = 0; k < n; k++) d[k] = Math.random() * 2 - 1; const src = ctx.createBufferSource(); src.buffer = b; const f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 500; const g = ctx.createGain(); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(.07, t + .6); g.gain.linearRampToValueAtTime(0, t + 1.4); src.connect(f); f.connect(g); g.connect(ambG); src.start(t); },
  chatter: () => { const n = 5 + Math.floor(Math.random() * 6); for (let i = 0; i < n; i++) { const f = 170 + Math.random() * 190; ambTone(f, .11 + Math.random() * .08, { v: .02, at: i * (.12 + Math.random() * .1), type: 'triangle', to: f * (.85 + Math.random() * .35) }); } },
  children: () => { const n = 4 + Math.floor(Math.random() * 4); for (let i = 0; i < n; i++) { const f = 700 + Math.random() * 500; ambTone(f, .09, { v: .022, at: i * .11, type: 'triangle', to: f * 1.3 }); } },
  market: () => { for (let i = 0; i < 3; i++) ambTone(2600 + Math.random() * 900, .12, { v: .02, at: i * .09 }); ambTone(210, .12, { v: .02, at: .4, type: 'triangle' }); },
  bell: () => { [0, 1.4].forEach(at => { ambTone(392, 2.6, { v: .04, at }); ambTone(784, 2, { v: .016, at }); ambTone(1178, 1.4, { v: .008, at }); }); },
  shipbell: () => { [0, .28].forEach(at => { ambTone(1240, .9, { v: .03, at }); ambTone(2480, .5, { v: .012, at }); }); },
  cowbell: () => { ambTone(560, .25, { v: .03, type: 'square' }); ambTone(845, .2, { v: .014, type: 'square', at: .02 }); },
  creak: () => { ambTone(150, .7, { v: .03, type: 'sawtooth', to: 210 }); ambTone(190, .5, { v: .02, type: 'sawtooth', at: .75, to: 140 }); },
  rockfall: () => { for (let i = 0; i < 6; i++) ambTone(90 + Math.random() * 80, .1, { v: .05, at: i * (.08 + Math.random() * .1), type: 'square', to: 60 }); },
  pipe: () => { const sc = [72, 74, 76, 79, 81, 84]; for (let i = 0; i < 5; i++) ambTone(mtof(sc[Math.floor(Math.random() * sc.length)]), .2, { v: .022, at: i * .2, type: 'triangle' }); },
  drip: () => ambTone(1600 + Math.random() * 900, .12, { v: .05, to: 700 }),
  frog: () => { const f = 140 + Math.random() * 60; for (let i = 0; i < 2; i++) ambTone(f, .12, { v: .07, at: i * .18, type: 'square', to: f * .8 }); },
  crackle: () => { if (!ctx) return; for (let i = 0; i < 4; i++) { const t = ctx.currentTime + Math.random() * .6, src = ctx.createBufferSource(), n = Math.floor(ctx.sampleRate * .02), b = ctx.createBuffer(1, n, ctx.sampleRate), d = b.getChannelData(0); for (let k = 0; k < n; k++) d[k] = (Math.random() * 2 - 1) * (1 - k / n); src.buffer = b; const g = ctx.createGain(); g.gain.value = .08 + Math.random() * .08; src.connect(g); g.connect(ambG); src.start(t); } },
  chime: () => { const r = [72, 74, 76, 79, 81][Math.floor(Math.random() * 5)]; ambTone(mtof(r), 2.2, { v: .03 }); ambTone(mtof(r + 7), 2, { v: .02, at: .3 }); },
  whisper: () => { if (!ctx) return; const t = ctx.currentTime, src = ctx.createBufferSource(), n = ctx.sampleRate * 2, b = ctx.createBuffer(1, n, ctx.sampleRate), d = b.getChannelData(0); for (let k = 0; k < n; k++) d[k] = Math.random() * 2 - 1; src.buffer = b; const f = ctx.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 900; f.Q.value = 6; const g = ctx.createGain(); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(.035, t + .8); g.gain.linearRampToValueAtTime(0, t + 2); src.connect(f); f.connect(g); g.connect(ambG); src.start(t); src.stop(t + 2.1); }
};
function stopAmbience(fade = 1.5) {
  ambTimers.forEach(clearTimeout); ambTimers.clear();
  if (!ctx) { ambNodes = []; return; }
  const t = ctx.currentTime; ambNodes.forEach(n => { try { if (n.gain) n.gain.setTargetAtTime(0, t, fade / 3); if (n.stop) n.stop(t + fade + .2); } catch (e) {} }); ambNodes = [];
}
function startAmbience(town, plan) {
  if (!ctx) return; stopAmbience(); ambTown = town; ambKey = plan.key; const A = D.AMBIENCE[town] || D.AMBIENCE.willowbrook, t = ctx.currentTime;
  /* the bed: looped soft noise through a filter, breathing slowly */
  const len = ctx.sampleRate * 3, buf = ctx.createBuffer(1, len, ctx.sampleRate), d = buf.getChannelData(0); let last = 0;
  for (let i = 0; i < len; i++) { last = (last + .02 * (Math.random() * 2 - 1)) / 1.02; d[i] = last * 3.5; }
  const src = ctx.createBufferSource(); src.buffer = buf; src.loop = true; const f = ctx.createBiquadFilter(); f.type = A.bed[0]; f.frequency.value = A.bed[1]; f.Q.value = A.whistle ? 8 : .7;
  const g = ctx.createGain(); g.gain.setValueAtTime(0, t); g.gain.setTargetAtTime(A.bed[2], t, 1.2); src.connect(f); f.connect(g); g.connect(ambG); src.start(t);
  ambNodes.push(src, g);
  const breathe = () => { if (ambTown !== town || !ctx) return; const tt = ctx.currentTime, level = A.bed[2] * (A.swell ? (.35 + .65 * (.5 + .5 * Math.sin(tt / A.swell * Math.PI * 2))) : (.7 + Math.random() * .5)); g.gain.setTargetAtTime(level, tt, A.swell ? .6 : 1.4); if (A.whistle) f.frequency.setTargetAtTime(1000 + Math.random() * 900, tt, 1.5); later(breathe, 1500); };
  breathe();
  if (A.drone) { [55, 55.4].forEach(fr => { const o = ctx.createOscillator(), og = ctx.createGain(); o.type = 'sine'; o.frequency.value = fr; og.gain.setValueAtTime(0, t); og.gain.setTargetAtTime(.025, t, 2); o.connect(og); og.connect(ambG); o.start(t); ambNodes.push(o, og); }); }
  /* details: each on its own loose timer so nothing repeats on a beat */
  plan.layers.forEach(([name, lo, hi]) => { const next = () => { if (ambTown !== town) return; if (ctx.state === 'running' && S().ambience !== false && !(DQ.act && DQ.act.kind === 'fight')) try { AMB_EVENT[name](); } catch (e) {} later(next, (lo + Math.random() * (hi - lo)) * 1000); }; later(next, (lo + Math.random() * (hi - lo)) * 1000); });
}
/* follows the current town (crossfading on travel) and the ambience setting */
/* read-only counters for long-session checks */
DQ.audioStats = () => ({ ambienceTimers: ambTimers.size, ambienceNodes: ambNodes.length, town: ambTown, key: ambKey, state: ctx ? ctx.state : 'none', played: Object.assign({}, played), roomLayers: Object.keys(room).length });
DQ.ambienceRefresh = () => {
  if (!ctx) return; applyVolumes();
  const st = DQ.audioState(), want = S().ambience === false ? null : st.town;
  /* the layers follow the village, its restoration tier and festivals; a fight only ducks them (no restart, so no stacking) */
  const plan = want && DQ.ambiencePlan(want, st.tier, { festival: !!(DQ.worldFestival && DQ.worldFestival()), calm: !!S().reduceFx });
  if (!want) { if (ambTown) { stopAmbience(); ambTown = null; ambKey = null; } }
  else if (plan.key !== ambKey) startAmbience(want, plan);
  DQ.roomRefresh();
};

/* ---------- Room sound (owner, 27 Nov 2026: "cosy ... like a warm dashboard we can feel at home in") ----------
   Continuous layers that sit under the village ambience, on the same ambience bus, so they follow Master volume,
   Ambience volume, the Nature ambience switch, Mute and the fight dip. Settings → Audio → Sound filters → Room sounds
   turns just these off. Each layer is one gain node that fades in and out over a few seconds; a layer that is already
   playing is only re-levelled, never started twice, so re-renders and refreshes cannot stack copies.
   - hearth: on the Home pages, a fire in the grate: a low brown-noise roar, a breathy band of flame that flickers,
     and sparse random crackle pops (now and then a bigger snap).
   - chatter: a market murmur in every town (band-passed noise with slow swells and the odd distant voice: a buzzy
     tone through two vowel formants). Its level and how often a voice carries follow the restoration tier; on the
     Home pages it is heard through the wall, at under half.
   - night (town clock dark > .6): two crickets chirping at their own pitches and the odd owl; day (dark < .35):
     a light bird phrase now and then. Dusk and dawn are hushed.
   - rain (town weather 'rain'): a soft hiss, a bed of tiny drop ticks and the odd drip off the eaves.
   - snow: a soft, slowly moving wind.
   Nothing here plays before the first click (no AudioContext yet), on the title screen, in a simulation or forecast,
   or while the tab is hidden. Reduce effects spaces the details out, as it does for the rest of the ambience.
   Levels (gain on the ambience bus, before the bus's own Ambience volume): */
D.ROOM_SOUND = {
  fade: 1.1, /* time constant in seconds: a layer is most of the way in or out after about 3 s, settled by 5 */
  hearth: { level: .045, hubs: ['home'] },
  chatter: { level: .03, tiers: { ruined: .22, mending: .55, restored: 1 }, voices: { ruined: [22, 44], mending: [8, 16], restored: [2.5, 7] }, indoors: .45 },
  night: { level: .022, from: .6, owl: [28, 75] },
  day: { level: .016, below: .35, gap: [9, 24], none: ['emberfall', 'hollow'] },
  rain: { level: .03 },
  snow: { level: .032 },
};
/* which room layers a moment wants, as plain data: { layer: level }. o = { page, hub, town, tier, dark, weather } */
DQ.roomPlan = (o = {}) => { const R = D.ROOM_SOUND, out = {}, home = o.hub === 'home' || o.page === 'overview';
  if (R.hearth.hubs.includes(o.hub) || o.page === 'overview') out.hearth = R.hearth.level;
  const tier = R.chatter.tiers[o.tier] != null ? o.tier : 'mending'; out.chatter = R.chatter.level * R.chatter.tiers[tier] * (home ? R.chatter.indoors : 1);
  const dark = o.dark || 0; if (dark > R.night.from) out.night = R.night.level; else if (dark < R.day.below && !R.day.none.includes(o.town)) out.day = R.day.level;
  if (o.weather === 'rain') out.rain = R.rain.level; if (o.weather === 'snow') out.snow = R.snow.level;
  return out; };
const roomInputs = () => { const st = DQ.S, UI = DQ.ui || {}, page = UI.view, town = (st && st.town) || 'willowbrook';
  let dark = 0; try { dark = DQ.townLight && DQ.townHour ? DQ.townLight(DQ.townHour()).dark : 0; } catch (e) {}
  let weather = 'clear'; try { weather = DQ.townWeather ? DQ.townWeather(town) : 'clear'; } catch (e) {}
  return { page, hub: UI.hubOf && page ? UI.hubOf(page).id : null, town, tier: DQ.restorationTier(town), dark, weather }; };
const roomOn = () => { const st = DQ.S, s = st && st.settings; return !!(s && modeId !== 'title' && s.ambience !== false && !s.muted && !(s.snd && s.snd.room === false)); };
const room = {};
const R = () => D.ROOM_SOUND;
const nbuf = {}; /* three seconds of looped noise, made once per colour */
const noiseOf = kind => { if (nbuf[kind]) return nbuf[kind]; const n = ctx.sampleRate * 3, b = ctx.createBuffer(1, n, ctx.sampleRate), d = b.getChannelData(0); let l = 0;
  for (let i = 0; i < n; i++) { const w = Math.random() * 2 - 1; if (kind === 'brown') { l = (l + .02 * w) / 1.02; d[i] = l * 3.5; } else d[i] = w; } return (nbuf[kind] = b); };
const bandOf = (type, f, q = .7) => { const b = ctx.createBiquadFilter(); b.type = type; b.frequency.value = f; b.Q.value = q; return b; };
const gainOf = v => { const g = ctx.createGain(); g.gain.value = v; return g; };
/* a looping noise source through a chain of nodes into the layer */
const bedOf = (L, kind, chain) => { const s = ctx.createBufferSource(); s.buffer = noiseOf(kind); s.loop = true; let n = s; for (const c of chain) { n.connect(c); n = c; } n.connect(L.g); s.start(ctx.currentTime, Math.random() * 2.5); L.srcs.push(s); return s; };
/* a detail on its own loose timer; it only sounds while the layer is live, the tab is visible and nothing is being simulated */
const every = (L, gap, fn) => { const calm = () => (DQ.S && DQ.S.settings.reduceFx ? 2 : 1), span = () => (typeof gap === 'function' ? gap() : gap);
  let id = 0; const wait = ms => { id = setTimeout(next, ms); L.timers.add(id); };
  function next() { L.timers.delete(id); if (L.dead) return; if (!L.dying && ctx.state === 'running' && !document.hidden && !quiet()) { try { fn(ctx.currentTime + .02); L.events = (L.events || 0) + 1; } catch (e) { L.errors = (L.errors || 0) + 1; } }
    const [lo, hi] = span(); wait((lo + Math.random() * (hi - lo)) * calm() * 1000); }
  wait(span()[0] * Math.random() * 1000); };
/* a short envelope on a gain: up in a, down to nothing by d */
const blip = (g, t, a, d, v) => { g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(v, t + a); g.gain.exponentialRampToValueAtTime(.0005, t + d); };
const ROOM = {
  hearth: L => {
    const roar = gainOf(.8), flame = gainOf(.07);
    bedOf(L, 'brown', [bandOf('lowpass', 380, .5), roar]);
    bedOf(L, 'white', [bandOf('bandpass', 1100, .7), flame]);
    /* the fire breathes: the roar and the flame band wander a little, never on a beat */
    every(L, [.35, .9], t => { roar.gain.setTargetAtTime(.55 + Math.random() * .45, t, .25); flame.gain.setTargetAtTime(.035 + Math.random() * .08, t, .15); });
    /* crackle: one to three pops close together; one in ten is a bigger snap with a little thump under it */
    every(L, [.12, .95], t => { const k = 1 + Math.floor(Math.random() * 3), snap = Math.random() < .1;
      for (let i = 0; i < k; i++) { const at = t + i * (.012 + Math.random() * .05), len = .006 + Math.random() * (snap ? .03 : .016), s = ctx.createBufferSource(); s.buffer = noiseOf('white');
        const hp = bandOf('highpass', 1200 + Math.random() * 2200), g = ctx.createGain(); blip(g, at, .001, len, (snap ? .9 : .3) + Math.random() * .45); s.connect(hp); hp.connect(g); g.connect(L.g); s.start(at, Math.random() * 2.5, len + .02); }
      if (snap) { const o = ctx.createOscillator(), g = ctx.createGain(); o.frequency.setValueAtTime(190, t); o.frequency.exponentialRampToValueAtTime(70, t + .05); blip(g, t, .002, .06, .5); o.connect(g); g.connect(L.g); o.start(t); o.stop(t + .08); } });
  },
  chatter: L => {
    const murmur = gainOf(.8), band = bandOf('bandpass', 520, .9);
    bedOf(L, 'white', [band, bandOf('lowpass', 1500, .5), murmur]);
    bedOf(L, 'brown', [bandOf('bandpass', 300, 1), gainOf(.6)]);
    /* slow swells as people come and go, and the crowd's centre drifts */
    every(L, [1.8, 4.5], t => { murmur.gain.setTargetAtTime(.4 + Math.random() * .6, t, 1.1); band.frequency.setTargetAtTime(420 + Math.random() * 260, t, 1.6); });
    /* the odd distant voice: a buzzy tone through two vowel formants, one to three syllables, muffled by distance */
    const VOWEL = [[700, 1200], [450, 800], [400, 2000], [600, 1700], [300, 870]];
    every(L, () => R().chatter.voices[L.tier] || R().chatter.voices.mending, t => { const f0 = 115 + Math.random() * 120, n = 1 + Math.floor(Math.random() * 3), far = bandOf('lowpass', 1800, .5); far.connect(L.g);
      for (let i = 0; i < n; i++) { const at = t + i * (.16 + Math.random() * .1), d = .1 + Math.random() * .14, o = ctx.createOscillator(), g = ctx.createGain(), [f1, f2] = VOWEL[Math.floor(Math.random() * VOWEL.length)];
        o.type = 'sawtooth'; o.frequency.setValueAtTime(f0 * (.95 + Math.random() * .12), at); o.frequency.linearRampToValueAtTime(f0 * (.85 + Math.random() * .3), at + d);
        const b1 = bandOf('bandpass', f1, 7), b2 = bandOf('bandpass', f2, 7), g2 = gainOf(.6); o.connect(b1); o.connect(b2); b1.connect(g); b2.connect(g2); g2.connect(g);
        blip(g, at, .03, d, 1.4 + Math.random() * .6); g.connect(far); o.start(at); o.stop(at + d + .05); } });
  },
  night: L => {
    /* two crickets, each at its own pitch: a train of three or four 22 ms chirps, then a breath, sometimes a longer rest */
    [4400 + Math.random() * 200, 4750 + Math.random() * 200].forEach(f => every(L, () => Math.random() < .2 ? [3, 6] : [.7, 1.6], t => {
      const o = ctx.createOscillator(), g = ctx.createGain(), n = 3 + Math.floor(Math.random() * 2), v = .45 + Math.random() * .35; o.frequency.value = f; g.gain.setValueAtTime(0, t);
      for (let i = 0; i < n; i++) { const at = t + i * .05; g.gain.setValueAtTime(0, at); g.gain.linearRampToValueAtTime(v, at + .006); g.gain.linearRampToValueAtTime(0, at + .022); }
      o.connect(g); g.connect(L.g); o.start(t); o.stop(t + n * .05 + .05); }));
    /* the odd owl, far off: hoo ... hoo-hoo, a soft sine falling a little, with a quiet overtone */
    every(L, R().night.owl, t => { const lp = bandOf('lowpass', 900, .5); lp.connect(L.g);
      [[0, .38], [.62, .2], [.88, .42]].forEach(([at, d]) => { const o = ctx.createOscillator(), o2 = ctx.createOscillator(), g = ctx.createGain(), g2 = gainOf(.15), f = 360 + Math.random() * 30;
        o.frequency.setValueAtTime(f, t + at); o.frequency.linearRampToValueAtTime(f * .9, t + at + d); o2.frequency.setValueAtTime(f * 2, t + at); o2.frequency.linearRampToValueAtTime(f * 1.8, t + at + d);
        blip(g, t + at, .07, d + .12, 1.2); o.connect(g); o2.connect(g2); g2.connect(g); g.connect(lp); [o, o2].forEach(x => { x.start(t + at); x.stop(t + at + d + .2); }); }); });
  },
  day: L => {
    /* a light phrase: two to five quick chirps, rising or falling */
    every(L, R().day.gap, t => { const b = 2400 + Math.random() * 1800, n = 2 + Math.floor(Math.random() * 4), up = Math.random() < .6;
      for (let i = 0; i < n; i++) { const at = t + i * (.09 + Math.random() * .07), d = .06 + Math.random() * .06, o = ctx.createOscillator(), g = ctx.createGain(), f = b * (1 + Math.random() * .1);
        o.frequency.setValueAtTime(f, at); o.frequency.exponentialRampToValueAtTime(f * (up ? 1.15 + Math.random() * .25 : .78), at + d); blip(g, at, .008, d, .7 + Math.random() * .3); o.connect(g); g.connect(L.g); o.start(at); o.stop(at + d + .03); } });
  },
  rain: L => {
    const hiss = gainOf(.5);
    bedOf(L, 'white', [bandOf('highpass', 700, .5), bandOf('lowpass', 5000, .5), hiss]);
    /* a bed of tiny drop ticks: a looped five-second buffer of random clicks, too dense and irregular to hear the loop */
    const sr = ctx.sampleRate, n = sr * 5, b = ctx.createBuffer(1, n, sr), d = b.getChannelData(0);
    for (let k = 0; k < 900; k++) { const at = Math.floor(Math.random() * (n - 400)), len = Math.floor(sr * (.002 + Math.random() * .004)), a = .2 + Math.random() * .8; for (let i = 0; i < len; i++) d[at + i] += (Math.random() * 2 - 1) * a * (1 - i / len); }
    const s = ctx.createBufferSource(); s.buffer = b; s.loop = true; const bp = bandOf('bandpass', 2600, .5), g = gainOf(.7); s.connect(bp); bp.connect(g); g.connect(L.g); s.start(); L.srcs.push(s);
    every(L, [3, 6], t => hiss.gain.setTargetAtTime(.38 + Math.random() * .24, t, 1.5));
    /* the odd heavier drip off the eaves */
    every(L, [.4, 1.6], t => { const o = ctx.createOscillator(), g2 = ctx.createGain(), f = 1300 + Math.random() * 700; o.frequency.setValueAtTime(f, t); o.frequency.exponentialRampToValueAtTime(f * .55, t + .05); blip(g2, t, .002, .06, .45); o.connect(g2); g2.connect(L.g); o.start(t); o.stop(t + .08); });
  },
  snow: L => {
    const g = gainOf(.7), bp = bandOf('bandpass', 420, 1.4);
    bedOf(L, 'brown', [bp, g]);
    every(L, [2, 4], t => { bp.frequency.setTargetAtTime(260 + Math.random() * 460, t, 1.5); g.gain.setTargetAtTime(.4 + Math.random() * .6, t, 1.8); });
  },
};
const roomEnd = L => { L.dead = true; L.timers.forEach(clearTimeout); L.timers.clear(); L.srcs.forEach(s => { try { s.stop(); } catch (e) {} }); try { L.g.disconnect(); } catch (e) {} if (room[L.name] === L) delete room[L.name]; };
const roomLevel = (L, v) => { L.target = v; if (L.dying) { clearTimeout(L.kill); L.dying = false; } L.g.gain.setTargetAtTime(v, ctx.currentTime, R().fade); };
const roomFade = L => { if (L.dying) return; L.dying = true; L.target = 0; L.g.gain.setTargetAtTime(0, ctx.currentTime, R().fade); L.kill = setTimeout(() => roomEnd(L), R().fade * 5000); };
/* brings the layers to what the moment wants: starts missing ones, re-levels live ones, fades out the rest */
DQ.roomRefresh = () => {
  if (!ctx || quiet()) return;
  const inp = roomInputs(), want = roomOn() ? DQ.roomPlan(inp) : {};
  for (const name of Object.keys(ROOM)) {
    const L = room[name], v = want[name] || 0;
    if (v > 0) { const live = L || (room[name] = { name, g: gainOf(0), srcs: [], timers: new Set(), target: 0 });
      if (name === 'chatter') live.tier = R().chatter.tiers[inp.tier] != null ? inp.tier : 'mending';
      if (!L) { live.g.connect(ambG); try { ROOM[name](live); } catch (e) {} }
      if (live.target !== v || live.dying) roomLevel(live, v); }
    else if (L) roomFade(L);
  }
};
/* read-only: each room layer's wanted level, its gain right now, and whether it is fading out (tests, long sessions) */
DQ.roomState = () => { const out = {}; for (const [k, L] of Object.entries(room)) out[k] = { target: L.target, gain: L.g.gain.value, dying: !!L.dying, timers: L.timers.size, tier: L.tier || null, events: L.events || 0, errors: L.errors || 0 }; return { on: roomOn(), inputs: DQ.S ? roomInputs() : null, layers: out }; };
/* ---------- Pop-ups hush the world (owner, 27 Nov 2026, subtle polish) ----------
   While a pop-up is open (DQ.modal: pop-ups, the story conversation, a full-screen world event) the music and the
   ambience (village details, room layers, town bells) glide down by D.HUSH.db through a gentle low-pass (12 dB per
   octave, Q .5 so nothing rings) over `down` seconds, and come back over `up` when the last pop-up closes. Effects stay
   clear. The hush is one state, read from the page (is any `.modal` open?), so a pop-up that replaces another, or two
   at once, never deepens it; Mute and the volumes sit on other nodes and are untouched. */
D.HUSH = { db: -9, cutoff: 1800, down: .25, up: .6 };
let hushOn = false;
function hushApply(instant) {
  if (!ctx || !hushG) return; const H = D.HUSH, t = ctx.currentTime, dur = instant ? 0 : hushOn ? H.down : H.up;
  const want = [[hushG.gain, hushOn ? Math.pow(10, H.db / 20) : 1], [hushF.frequency, hushOn ? H.cutoff : HUSH_OPEN]];
  for (const [p, v] of want) { p.cancelScheduledValues(t); if (!dur) { p.setValueAtTime(v, t); continue; } p.setValueAtTime(Math.max(1e-4, p.value), t); p.exponentialRampToValueAtTime(v, t + dur); }
}
const hushCheck = () => { const on = !!(typeof document !== 'undefined' && document.querySelector && document.querySelector('body > .modal')); if (on === hushOn) return; hushOn = on; hushApply(false); };
if (typeof MutationObserver !== 'undefined' && typeof document !== 'undefined' && document.body) new MutationObserver(hushCheck).observe(document.body, { childList: true });
/* read-only: whether the world is hushed, and the hush's gain and cutoff right now */
DQ.hushState = () => ({ on: hushOn, gain: hushG ? hushG.gain.value : null, cutoff: hushF ? hushF.frequency.value : null, master: master ? master.gain.value : null, db: D.HUSH.db });

/* ---------- Item materials ----------
   What an item is made of, from its own data: type, slot, weapon style, the wood flag, its icon and the words in its
   id and name (alloys, woods, hides). One of metal, leather, cloth, wood, paper, gem, food, potion. */
const MAT_WORDS = {
  potion: /\b(draught|potion|tonic|elixir|tea|brew|milk|flask|vial|ale|mead)\b/,
  food: /\b(bait|lure|ration|feast|supper|bread|stonebread|cheese|honey|truffle|egg|pie|stew)\b/,
  paper: /\b(map|book|tome|scroll|chart|letter|notes?|journal|page|recipe|manual|deed|ledger)\b/,
  cloth: /\b(robe|hood|cloth|wool|woollen|cloak|cape|mantle|silk|linen|flax|thread|weave|thornweave|woven|starwoven|sash|tunic|scarf|knot|cord|rope|net|feather|feed|sack|hat)\b/,
  leather: /\b(leather|hide|cowhide|pelt|coif|chaps|vest|scale|bogscale|drakehide|frostpelt|coat|jerkin|boots|gloves?|pouch|string)\b/,
  gem: /\b(gems?|sapphire|emerald|ruby|diamond|quartz|amber|jet|jade|moonstone|bloodstone|obsidian|skyglass|nullite|crystal|pearl|opal|glass|lens|shard|star|core|rune|charm|pendant)\b/,
  wood: /\b(logs?|planks?|bow|longbow|shortbow|recurve|greatbow|staff|wand|wood|wooden|trap|boat|skiff|cog|sloop|caravel|galleon|bone|tusk|oak|willow|maple|yew|birch|elder|hazel|ash|palm|cedar|pine|mangrove|cinderbark|windpine|wraithbark|gloomwood|wicker|chest|arrows?)\b/,
  metal: /\b(bronze|iron|steel|mithril|adamant|runite|astral|gold|silver|copper|tin|metal|bars?|ores?|bell|lantern|cage|crown|helm|greathelm|blade|sword|sabre|saber|dagger|knife|hammer|maul|axe|pick|pickaxe|hoe|rod|torc|censer|chain)\b/,
};
DQ.itemMaterial = id => {
  const it = D.ITEMS && D.ITEMS[id]; if (!it) return null;
  const n = (String(it.name || '') + ' ' + String(id).replace(/[_.-]/g, ' ')).toLowerCase().replace(/[’']s\b/g, ''), has = k => MAT_WORDS[k].test(n), ic = it.ic, type = it.type;
  if (ic === 'bottle' || it.drink || has('potion')) return 'potion';
  if (['food', 'raw', 'crop', 'seed'].includes(type) || (type === 'produce' && !has('cloth')) || it.heal || it.dish || ['bread', 'food', 'fish', 'egg'].includes(ic) || has('food')) return 'food';
  if (type === 'potion') return 'potion';
  if (['scroll', 'book', 'map'].includes(ic) || has('paper')) return 'paper';
  const slot = it.slot;
  if (slot === 'ring' || slot === 'amulet') return /\b(torc|censer|chain|bell)\b/.test(n) ? 'metal' : /\b(knot|feather|cord|woven)\b/.test(n) ? 'cloth' : 'gem';
  if (slot === 'ammo') return 'wood';
  if (slot === 'weapon') return it.style === 'ranged' || it.style === 'magic' || ['bow', 'staff'].includes(it.wtype) || ['bow', 'staff'].includes(ic) ? (/\b(crystal|glass)\b/.test(n) ? 'gem' : 'wood') : 'metal';
  if (slot === 'shield') return it.wood || has('wood') ? 'wood' : has('leather') ? 'leather' : 'metal';
  if (slot) return /^robe_/.test(id) || has('cloth') ? 'cloth' : has('leather') ? 'leather' : 'metal';
  if (type === 'tool') return has('leather') ? 'leather' : 'metal';
  if (has('cloth')) return 'cloth';
  if (has('leather') || ic === 'hide') return 'leather';
  if (type === 'gem' || ic === 'gem' || ic === 'rune' || has('gem')) return 'gem';
  if (type === 'boat' || ['log', 'plank', 'bone'].includes(ic) || has('wood')) return 'wood';
  if (type === 'tool' || ['ore', 'bar', 'bell'].includes(ic) || has('metal')) return 'metal';
  return 'cloth';
};
/* one sound per gesture: moves made together (Bank everything, a saved preparation swapping five slots) are gathered
   for 35 ms and sound once, as the material most of them share */
let matQ = [], matT = 0;
const matStats = { queued: 0, flushed: 0, last: null };
function matFlush() { matT = 0; const q = matQ; matQ = []; if (!q.length) return; const n = {}; for (const m of q) n[m] = (n[m] || 0) + 1;
  const best = Object.keys(n).sort((a, b) => n[b] - n[a] || q.indexOf(a) - q.indexOf(b))[0]; matStats.flushed++; matStats.last = best; DQ.sfx('mat_' + best); }
DQ.itemSound = id => { if (quiet()) return null; const m = DQ.itemMaterial(id); if (!m) return null; matQ.push(m); matStats.queued++; if (!matT) matT = setTimeout(matFlush, 35); return m; };
DQ.itemSoundStats = () => Object.assign({ pending: matQ.length }, matStats);
/* the moves themselves: equip, unequip, pack to bank and back (js/state.js), whoever calls them */
{ const eq0 = DQ.equipItem, un0 = DQ.unequip, dep0 = DQ.deposit, wd0 = DQ.withdraw;
  if (eq0) DQ.equipItem = (id, ...r) => { const res = eq0(id, ...r); if (res && res.ok) DQ.itemSound(id); return res; };
  if (un0) DQ.unequip = (slot, ...r) => { const st = DQ.S, id = st && (slot === 'ammo' ? st.ammo && st.ammo.id : st.equip && st.equip[slot]); const res = un0(slot, ...r); if (res && id) DQ.itemSound(id); return res; };
  if (dep0) DQ.deposit = (id, n, ...r) => { const st = DQ.S, b = (st && st.bank[id]) || 0, res = dep0(id, n, ...r); if (((st && st.bank[id]) || 0) > b) DQ.itemSound(id); return res; };
  if (wd0) DQ.withdraw = (id, n, ...r) => { const res = wd0(id, n, ...r); if (res > 0) DQ.itemSound(id); return res; }; }

/* ---------- Town bells on the hour (owner, 27 Nov 2026) ----------
   By the player's own clock (DQ.townHour, js/town_life.js), each town marks the hour in its own way, on the Home and
   Town pages (where the room sound is), on the ambience bus through a soft low-pass and a little reverb. They follow
   Master and Ambience volume, Mute, the Nature ambience switch and the Room sounds filter. "Always daytime" has no
   clock, so no bells; nothing rings in a simulation or forecast, while the tab is hidden or before the first click.
   Each hour rings once at most: only in its first two minutes (a tab that comes back at 3:20 stays quiet) and never a
   second time for the same hour. Peaks are about .03 to .06 on the ambience bus: the restored village's own bell
   (AMB_EVENT.bell) peaks near .064 and the hearth bed sits at .045, so a bell is no louder than the town already is.
   count: 'hour' strikes the hour (1 to 12, 12 at midnight and noon); a number is a fixed pattern. lp: the low-pass
   cutoff in Hz (distance); wet: the reverb send. */
D.TOWN_BELLS = {
  window: 2 / 60, hubs: ['home', 'town'],
  towns: {
    willowbrook: { kind: 'church', count: 'hour', lp: 3600, wet: .35 },
    mossbarrow: { kind: 'farm', count: 6, lp: 5000, wet: .22 },
    saltmere: { kind: 'harbour', count: 'hour', horn: true, lp: 4200, wet: .35 },
    ironpeak: { kind: 'gong', count: 1, lp: 2400, wet: .45 },
    gloomfen: { kind: 'knock', count: 3, lp: 2200, wet: .45 },
    emberfall: { kind: 'clang', count: 1, lp: 5500, wet: .3 },
    skyreach: { kind: 'chimes', count: 5, lp: 8000, wet: .5 },
    hollow: { kind: 'cracked', count: 2, lp: 1100, wet: .6 },
  },
};
DQ.bellPlan = (town, hour) => { const T = D.TOWN_BELLS.towns, id = T[town] ? town : 'willowbrook', B = T[id], h = ((Math.floor(hour) % 24) + 24) % 24;
  return { town: id, kind: B.kind, hour: h, strokes: Math.min(12, B.count === 'hour' ? (h % 12) || 12 : B.count), horn: !!B.horn, lp: B.lp, wet: B.wet }; };
let aVerb = null;
const ambVerb = () => { if (!aVerb) { aVerb = ctx.createConvolver(); aVerb.buffer = verbBuf; aVerb.connect(ambG); } return aVerb; };
const cents = () => (Math.random() * 2 - 1) * 6; /* each partial a few cents off true, as a cast bell is */
/* one decaying partial: up in a, then an exponential fall over d */
const partial = (dest, t, f, v, a, d, det = 0, type = 'sine') => { const o = ctx.createOscillator(), g = ctx.createGain(); o.type = type; o.frequency.setValueAtTime(f, t); o.detune.value = det;
  g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(v, t + a); g.gain.exponentialRampToValueAtTime(.0002, t + a + d); o.connect(g); g.connect(dest); o.start(t); o.stop(t + a + d + .05); return o; };
/* a short filtered noise burst (a clapper, a mallet, a knuckle on wood) */
const burst = (dest, t, type, f, len, v, q = 1) => { const s = ctx.createBufferSource(); s.buffer = noiseOf('white'); const b = bandOf(type, f, q), g = ctx.createGain(); blip(g, t, .001, len, v); s.connect(b); b.connect(g); g.connect(dest); s.start(t, Math.random() * 2.5, len + .05); };
/* [ratio, gain, decay seconds] per partial */
const CHURCH = [[.5, .55, 5.5], [.5 * 1.0035, .25, 5.5], [1, .5, 4], [1.19, .42, 3.2], [1.5, .2, 2.2], [2, .6, 2.6], [2.5, .16, 1.3], [2.67, .12, 1.1], [4, .08, .8]];
const BELL = {
  /* Willowbrook: a village church bell counting the hour, a stroke every 2.4 s. E4 strike (329.6 Hz) with the minor-
     third bell spectrum (hum .5, prime, tierce 1.19, quint 1.5, nominal 2, 2.5, 2.67, 4), a doubled hum 0.35% apart
     that beats slowly, every partial a few cents off true, decays from 5.5 s (hum) to 0.8 s, and a clapper tap */
  church: (o, t, p) => { const f = jit(329.6, .01); for (let i = 0; i < p.strokes; i++) { const at = t + i * 2.4, V = .018 * (.9 + Math.random() * .1);
    CHURCH.forEach(([m, g, d]) => partial(o, at, f * m, V * g, .004, d, cents())); burst(o, at, 'bandpass', 2400, .025, V * 1.2, 1.5); } },
  /* Mossbarrow: a small yard bell shaken six times (every 0.2 s, alternating strong and light), 880 Hz with partials
     2.4, 3.9 and 5.3, about a second of ring each */
  farm: (o, t, p) => { const f = jit(880, .02); for (let i = 0; i < p.strokes; i++) { const at = t + i * .2, V = .025 * (i % 2 ? .75 : 1);
    [[1, .6, 1.1], [2.4, .25, .6], [3.9, .14, .35], [5.3, .08, .2]].forEach(([m, g, d]) => partial(o, at, f * m, V * g, .003, d, cents())); burst(o, at, 'highpass', 3500, .01, V * .8); } },
  /* Saltmere: one low foghorn blast (two sawtooths at 87 Hz, 7 cents apart, and a square an octave below, sliding up
     from 6% flat as the horn takes air, through a low-pass opening 240 to 420 Hz; 0.5 s swell, 2.3 s hold, 1.2 s fade)
     then the harbour bell (1240 Hz, partials 2, 2.76, 4.07) striking the hour in ship's-bell pairs */
  harbour: (o, t, p) => { let t0 = t;
    if (p.horn) { const lp = bandOf('lowpass', 240, .9), g = gainOf(0); lp.frequency.setValueAtTime(240, t); lp.frequency.linearRampToValueAtTime(420, t + .7); lp.frequency.setTargetAtTime(340, t + 2.2, .5); lp.connect(g); g.connect(o);
      g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(.022, t + .5); g.gain.setValueAtTime(.022, t + 2.3); g.gain.linearRampToValueAtTime(0, t + 3.5);
      [[87, 0, 'sawtooth', 1], [87, 7, 'sawtooth', 1], [43.5, 0, 'square', .35]].forEach(([f, c, type, k]) => { const x = ctx.createOscillator(), xg = gainOf(k); x.type = type; x.frequency.setValueAtTime(f * .94, t); x.frequency.exponentialRampToValueAtTime(f, t + .45); x.detune.value = c; x.connect(xg); xg.connect(lp); x.start(t); x.stop(t + 3.7); });
      t0 = t + 3.9; }
    const f = jit(1240, .01); for (let i = 0; i < p.strokes; i++) { const at = t0 + Math.floor(i / 2) * 1.15 + (i % 2) * .32, V = .02;
      [[1, .6, 1.6], [2, .3, 1], [2.76, .2, .7], [4.07, .1, .4]].forEach(([m, g, d]) => partial(o, at, f * m, V * g, .003, d, cents())); burst(o, at, 'highpass', 4000, .012, V); } },
  /* Ironpeak: one deep mine gong, 73.4 Hz with partials 1.52, 2.03, 2.71, 3.39, 4.11 and 5.4 that bloom in after the
     strike (attacks 0.25 to 1.1 s, higher ones later) and hum for up to 7 s, the fundamental sagging 1.5%; a soft
     mallet thump (noise low-passed at 180 Hz) */
  gong: (o, t) => { const f = jit(73.4, .01), V = .03;
    [[1, .6, 7, .005], [1.52, .35, 5.5, .25], [2.03, .3, 4.5, .4], [2.71, .22, 3.5, .6], [3.39, .15, 2.8, .8], [4.11, .1, 2.2, 1], [5.4, .06, 1.6, 1.1]].forEach(([m, g, d, a], i) => {
      const x = partial(o, t, f * m, V * g, a, d, cents()); if (!i) x.frequency.exponentialRampToValueAtTime(f * .985, t + 2.5); }); burst(o, t, 'lowpass', 180, .09, .05); },
  /* Gloomfen: a hollow wooden knock, knock ... knock (at 0, 0.5 and 1.45 s): a 330 Hz block tone (0.16 s), a 205 Hz
     cavity under it (0.26 s, the hollow), a faint 760 Hz edge and a narrow 1.4 kHz knuckle click */
  knock: (o, t, p) => { [0, .5, 1.45].slice(0, p.strokes).forEach((dt, i) => { const at = t + dt, V = i === 2 ? .05 : .042;
    partial(o, at, jit(330, .02), V, .002, .16); partial(o, at, jit(205, .02), V * .6, .003, .26); partial(o, at, jit(760, .03), V * .25, .001, .05); burst(o, at, 'bandpass', 1400, .02, V * .9, 6); }); },
  /* Emberfall: one bronze clang, 196 Hz with bright inharmonic partials (2.32, 3.1, 4.25, 5.6, 6.63, 8.9; 3 s down to
     0.5 s) and a hard strike (noise high-passed at 3 kHz) */
  clang: (o, t) => { const f = jit(196, .01), V = .028;
    [[1, .4, 3], [2.32, .35, 2.4], [3.1, .25, 1.8], [4.25, .3, 1.4], [5.6, .15, 1], [6.63, .12, .8], [8.9, .08, .5]].forEach(([m, g, d]) => partial(o, t, f * m, V * g, .002, d, cents())); burst(o, t, 'highpass', 3000, .03, .05); },
  /* Skyreach: high monastery chimes, a five-note run down F6 E6 C6 A5 F5 (Skyreach's Lydian key), one every 0.34 s,
     each a small bar chime (partials 2.76, 5.4) ringing about 3 s */
  chimes: (o, t, p) => { [89, 88, 84, 81, 77].slice(0, p.strokes).forEach((m, i) => { const at = t + i * .34, f = mtof(m) * (1 + (Math.random() - .5) * .004), V = .03;
    [[1, .6, 3.2], [2.76, .2, 1.4], [5.4, .08, .7]].forEach(([k, g, d]) => partial(o, at, f * k, V * g, .002, d, cents())); }); },
  /* the Hollow: a distant cracked bell, two slow strokes (the second fainter, 3.4 s on). D3 (146.8 Hz): a hum and prime
     that ring clean, and mistuned upper partials (1.23, 1.46, 2.07, 2.6) cut short and buzzing through a 31 Hz flutter,
     where the crack rattles; a breath of noise at 900 Hz; heard far off (low-pass 1.1 kHz, a lot of reverb) */
  cracked: (o, t, p) => { const f = jit(146.8, .01); for (let i = 0; i < p.strokes; i++) { const at = t + i * 3.4, V = .028 * (i ? .6 : 1);
    [[.5 * .97, .5, 4.5], [1, .45, 3.2]].forEach(([m, g, d]) => partial(o, at, f * m, V * g, .004, d, cents()));
    const buzz = gainOf(.5), lfo = ctx.createOscillator(), lg = gainOf(.5); lfo.type = 'square'; lfo.frequency.value = 31; lfo.connect(lg); lg.connect(buzz.gain); buzz.connect(o); lfo.start(at); lfo.stop(at + 2);
    [[1.23, .4, 1.1], [1.46, .2, .9], [2.07, .5, 1.2], [2.6, .15, .6]].forEach(([m, g, d]) => partial(buzz, at, f * m, V * g, .004, d, cents() * 4)); burst(o, at, 'bandpass', 900, .35, V * .8, 3); } },
};
let bellLast = null; const bellRung = [], bellLog = [];
/* the clock the bells follow: none under "Always daytime" (or a test browser left at daytime) */
const bellClock = () => { const s = DQ.S && DQ.S.settings; if (!s || s.townTime === 'day' || !DQ.townHour) return null;
  if (DQ.townTimeOverride == null && s.townTime == null && typeof navigator !== 'undefined' && navigator.webdriver) return null; return DQ.townHour(); };
const bellPage = () => { const UI = DQ.ui || {}; return !!(UI.view && UI.hubOf && D.TOWN_BELLS.hubs.includes(UI.hubOf(UI.view).id)); };
const bellOk = () => !!(ctx && ctx.state === 'running' && !(typeof document !== 'undefined' && document.hidden) && !quiet() && roomOn() && bellPage());
function bellRing(plan) { const lp = bandOf('lowpass', plan.lp, .5), wet = gainOf(plan.wet); lp.connect(ambG); lp.connect(wet); wet.connect(ambVerb());
  try { BELL[plan.kind](lp, ctx.currentTime + .05, plan); } catch (e) { plan.error = String(e); } played['bell:' + plan.town] = (played['bell:' + plan.town] || 0) + 1; }
/* checked every two seconds with the ambience (and by tests): rings when the clock has just crossed an hour */
DQ.bellTick = () => { let h = null; try { h = bellClock(); } catch (e) {} if (h == null || !isFinite(h)) { bellLast = null; return null; }
  const hour = ((Math.floor(h) % 24) + 24) % 24, prev = bellLast; bellLast = hour; if (prev === null || prev === hour || h - Math.floor(h) > D.TOWN_BELLS.window) return null;
  const key = (DQ.townTimeOverride != null ? 'set' : new Date().toDateString()) + ':' + hour; if (bellRung.includes(key) || !bellOk()) return null;
  bellRung.push(key); if (bellRung.length > 48) bellRung.shift();
  const plan = DQ.bellPlan((DQ.S && DQ.S.town) || 'willowbrook', hour); bellRing(plan); bellLog.push(plan); if (bellLog.length > 8) bellLog.shift(); return plan; };
/* a level meter on the ambience bus, made on first use (tests check a bell is heard and never loud) */
let ambMeter = null; DQ.ambienceLevel = () => { if (!ctx) return null; if (!ambMeter) { ambMeter = ctx.createAnalyser(); ambMeter.fftSize = 2048; ambG.connect(ambMeter); } const d = new Float32Array(ambMeter.fftSize); ambMeter.getFloatTimeDomainData(d); let pk = 0; for (const x of d) pk = Math.max(pk, Math.abs(x)); return { peak: pk, bus: ambG.gain.value }; };
DQ.bellState = () => ({ last: bellLast, rung: bellRung.slice(), log: bellLog.slice(), ok: bellOk() });
const ambWatch = () => { if (!ambLoop) ambLoop = setInterval(() => { if (ctx && !document.hidden) DQ.ambienceRefresh(); DQ.bellTick(); }, 2000); };

DQ.musicMode = id => { modeId = id === 'title' ? 'title' : 'game'; if (ctx) musicTick(); };
DQ.musicStart = () => { init(); applyVolumes(); if (S().music) musicStep(); DQ.ambienceRefresh(); ambWatch(); };
DQ.musicRefresh = () => { applyVolumes(); if (S().music && ctx) musicStep(); else if (!S().music) stopMusic(); DQ.ambienceRefresh(); };
/* read-only: which theme is playing (tests, the Settings page) */
/* a level meter on the music bus, made on first use (tests check no theme clips or goes silent) */
let meter = null; DQ.musicLevel = () => { if (!ctx) return null; if (!meter) { meter = ctx.createAnalyser(); meter.fftSize = 2048; musG.connect(meter); } const d = new Float32Array(meter.fftSize); meter.getFloatTimeDomainData(d); let pk = 0, sq = 0; for (const x of d) { pk = Math.max(pk, Math.abs(x)); sq += x * x; } return { peak: pk, rms: Math.sqrt(sq / d.length) }; };
/* a copy of everything the game plays, as a media stream (used to record samples of the themes) */
DQ.audioTap = () => { init(); const d = ctx.createMediaStreamDestination(); master.connect(d); return d.stream; };
DQ.musicNow = () => ({ theme: themeId, want: DQ.musicTheme(), root: theme ? theme.root : null, bpm: theme ? theme.bpm : null, running: !!seqTimer });
DQ.on('act', () => { if (ctx) musicTick(); applyVolumes(); });
DQ.on('encounter', () => { if (ctx) musicTick(); });
document.addEventListener('visibilitychange', () => { if (ctx) { if (document.hidden) ctx.suspend(); else ctx.resume(); } });
})();
