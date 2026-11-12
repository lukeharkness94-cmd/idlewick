/* Idlewick: synthesised sound effects and ambient music (no audio files). */
(() => {
const DQ = window.DQ, { rnd, pick } = DQ;
let ctx = null, master, sfxG, musG, verb, started = false;
const last = {};
const PENT = [0, 2, 4, 7, 9];
const mtof = m => 440 * Math.pow(2, (m - 69) / 12);
const S = () => DQ.S.settings;

function init() {
  if (ctx) { if (ctx.state === 'suspended') ctx.resume(); return; }
  const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
  ctx = new AC();
  master = ctx.createGain(); sfxG = ctx.createGain(); musG = ctx.createGain();
  sfxG.connect(master); musG.connect(master); master.connect(ctx.destination);
  verb = ctx.createConvolver();
  const len = ctx.sampleRate * 2.6, buf = ctx.createBuffer(2, len, ctx.sampleRate);
  for (let c = 0; c < 2; c++) { const d = buf.getChannelData(c); for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2.4); }
  verb.buffer = buf; const vg = ctx.createGain(); vg.gain.value = .7; verb.connect(vg); vg.connect(musG);
  applyVolumes();
}
function applyVolumes() {
  if (!ctx) return; const s = S(), t = ctx.currentTime;
  master.gain.setTargetAtTime(s.muted ? 0 : 1, t, .05);
  sfxG.gain.setTargetAtTime(s.sfx ? s.vol * .8 : 0, t, .05);
  musG.gain.setTargetAtTime(s.music ? s.musicVol * .55 : 0, t, .3);
}
function tone(f, dur, o = {}) {
  if (!ctx) return; const t = ctx.currentTime + (o.at || 0);
  const osc = ctx.createOscillator(), g = ctx.createGain();
  osc.type = o.type || 'sine'; osc.frequency.setValueAtTime(f, t);
  if (o.to) osc.frequency.exponentialRampToValueAtTime(Math.max(20, o.to), t + dur);
  const v = (o.v || .2), a = o.a || .005;
  g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(v, t + a); g.gain.exponentialRampToValueAtTime(.0008, t + dur);
  osc.connect(g); g.connect(o.dest || sfxG); osc.start(t); osc.stop(t + dur + .05);
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
const jit = (f, r = .06) => f * (1 + (Math.random() * 2 - 1) * r);
const note = (root, deg) => mtof(root + PENT[deg % 5] + 12 * Math.floor(deg / 5));

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
  equip: () => { noise(.05, { f: 3000, v: .12 }); tone(jit(420), .1, { type: 'triangle', v: .1, to: 300 }); },
  buy: () => { tone(988, .09, { v: .08, type: 'triangle' }); tone(1318, .18, { v: .07, at: .07, type: 'triangle' }); },
  sell: () => { tone(1318, .09, { v: .08, type: 'triangle' }); tone(988, .18, { v: .07, at: .07, type: 'triangle' }); },
  level: () => { const r = pick([60, 62, 64, 65]); [0, 4, 7, 12].forEach((d, i) => tone(mtof(r + d), .45, { v: .09, at: i * .09, type: 'triangle' })); },
  perk: () => { const r = pick([67, 69]); [0, 7, 12, 16].forEach((d, i) => tone(mtof(r + d), .5, { v: .06, at: i * .07 })); },
  ach: () => { [76, 81, 85].forEach((m, i) => tone(mtof(m), .6, { v: .07, at: i * .1 })); },
  quest: () => { [60, 64, 67, 72, 76].forEach((m, i) => tone(mtof(m), .7, { v: .09, at: i * .11, type: 'triangle' })); },
  boss: () => { [48, 55, 60, 64, 67, 72].forEach((m, i) => { tone(mtof(m), 1.1, { v: .1, at: i * .14, type: 'triangle' }); tone(mtof(m + 12), 1, { v: .04, at: i * .14 }); }); },
  death: () => [64, 60, 57, 52].forEach((m, i) => tone(mtof(m), .5, { v: .1, at: i * .16, type: 'triangle' })),
  travel: () => [0, 1, 2, 3, 4, 5].forEach(i => noise(.05, { type: 'lowpass', f: 500, v: .08, at: i * .22 })),
  unlock: () => { [72, 76, 79].forEach((m, i) => tone(mtof(m), .4, { v: .07, at: i * .08 })); },
};
/* Sounds that fire once per finished task are thinned out and varied so they never become a metronome */
const TASK = new Set(['fish', 'wood', 'mine', 'thieve', 'sizzle', 'anvil', 'stitch', 'cast', 'bow', 'hit', 'miss']);
DQ.sfx = name => {
  const s = S(); if (!s.sfx || s.muted || DQ.sim.on) return;
  if (!ctx) return; const now = performance.now();
  if (TASK.has(name)) {
    if (s.taskSounds === 'off') return;
    const gap = s.taskSounds === 'varied' ? 450 : 900, prob = s.taskSounds === 'varied' ? .78 : .45;
    if (now - (last[name] || 0) < gap && name !== 'hit' && name !== 'miss') return;
    if (Math.random() > prob && name !== 'hit') return;
  } else if (now - (last[name] || 0) < 60) return;
  last[name] = now; try { SFX[name] && SFX[name](); } catch (e) {}
};
DQ.audioInit = init;
DQ.audioApply = applyVolumes;
DQ.setMuted = m => { DQ.S.settings.muted = m; applyVolumes(); DQ.emit('settings'); };

/* ---------- Ambient music: slow pads over a pentatonic scale, tinted per town ---------- */
const MODES = {
  willowbrook: { root: 50, scale: [0, 2, 4, 7, 9] },
  saltmere: { root: 53, scale: [0, 2, 4, 7, 9] },
  ironpeak: { root: 45, scale: [0, 3, 5, 7, 10] },
  gloomfen: { root: 47, scale: [0, 1, 5, 7, 8] },
  emberfall: { root: 43, scale: [0, 3, 5, 6, 10] },
  title: { root: 52, scale: [0, 2, 4, 7, 9] },
};
let musicTimer = null, mode = MODES.title, modeId = 'title';
function pad(m, dur) {
  const t = ctx.currentTime, lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 1100; lp.Q.value = .4;
  const g = ctx.createGain(); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(.09, t + dur * .4); g.gain.linearRampToValueAtTime(0, t + dur);
  [0, 1.003].forEach(d => { const o = ctx.createOscillator(); o.type = 'triangle'; o.frequency.value = mtof(m) * (d || 1); o.connect(lp); o.start(t); o.stop(t + dur + .1); });
  lp.connect(g); g.connect(musG); g.connect(verb);
}
function pluck(m) {
  const t = ctx.currentTime, o = ctx.createOscillator(), g = ctx.createGain(); o.type = 'sine'; o.frequency.value = mtof(m);
  g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(.07, t + .01); g.gain.exponentialRampToValueAtTime(.0008, t + 2.2);
  o.connect(g); g.connect(musG); g.connect(verb); o.start(t); o.stop(t + 2.3);
}
function musicStep() {
  musicTimer = null; if (!ctx || !S().music) return;
  const sc = mode.scale, root = mode.root, deg = rnd(0, 4);
  if (ctx.state === 'running') {
    pad(root + sc[deg] - 12, 7); pad(root + sc[(deg + 2) % 5], 7);
    if (Math.random() < .8) pluck(root + 12 + sc[rnd(0, 4)] + (Math.random() < .3 ? 12 : 0));
    setTimeout(() => { if (ctx && S().music && Math.random() < .6) pluck(root + 12 + sc[rnd(0, 4)]); }, rnd(1500, 3500));
  }
  musicTimer = setTimeout(musicStep, rnd(4200, 6200));
}
DQ.musicMode = id => { modeId = id; mode = MODES[id] || MODES.title; };
DQ.musicStart = () => { init(); applyVolumes(); if (!musicTimer && S().music) musicStep(); };
DQ.musicRefresh = () => { applyVolumes(); if (S().music && !musicTimer && ctx) musicStep(); };
document.addEventListener('visibilitychange', () => { if (ctx) { if (document.hidden) ctx.suspend(); else ctx.resume(); } });
})();
