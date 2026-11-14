/* Idlewick: synthesised sound effects and ambient music (no audio files). */
(() => {
const DQ = window.DQ, { rnd, pick } = DQ;
let ctx = null, master, sfxG, musG, ambG, verb, sverb, started = false;
const last = {}, recent = [];
const PENT = [0, 2, 4, 7, 9];
const mtof = m => 440 * Math.pow(2, (m - 69) / 12);
const S = () => DQ.S.settings;

function init() {
  if (ctx) { if (ctx.state === 'suspended') ctx.resume(); return; }
  const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
  ctx = new AC();
  master = ctx.createGain(); sfxG = ctx.createGain(); musG = ctx.createGain();
  ambG = ctx.createGain(); ambG.gain.value = 0;
  sfxG.connect(master); musG.connect(master); ambG.connect(master); master.connect(ctx.destination);
  verb = ctx.createConvolver();
  const len = ctx.sampleRate * 2.6, buf = ctx.createBuffer(2, len, ctx.sampleRate);
  for (let c = 0; c < 2; c++) { const d = buf.getChannelData(c); for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2.4); }
  verb.buffer = buf; const vg = ctx.createGain(); vg.gain.value = .7; verb.connect(vg); vg.connect(musG);
  sverb = ctx.createConvolver(); sverb.buffer = buf; const sg = ctx.createGain(); sg.gain.value = .32; sverb.connect(sg); sg.connect(sfxG);
  applyVolumes();
}
function applyVolumes() {
  if (!ctx) return; const s = S(), t = ctx.currentTime;
  master.gain.setTargetAtTime(s.muted ? 0 : (s.masterVol ?? 1), t, .05);
  sfxG.gain.setTargetAtTime(s.sfx ? s.vol * .8 : 0, t, .05);
  musG.gain.setTargetAtTime(s.music ? s.musicVol * .55 : 0, t, .3);
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
  osc.connect(g); g.connect(o.dest || sfxG); if (o.wet && sverb) g.connect(sverb); osc.start(t); osc.stop(t + dur + .05);
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
  buy: () => { tone(988, .09, { v: .08, type: 'triangle' }); tone(1318, .18, { v: .07, at: .07, type: 'triangle' }); },
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
  discover: () => { tone(1047,.12,{type:'triangle',v:.075});tone(1568,.24,{type:'triangle',v:.065,at:.08});tone(2093,.38,{v:.045,at:.17}); },
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
  const IMPORTANT = new Set(['level', 'quest', 'boss', 'death', 'restore', 'region', 'adventure', 'discover', 'unlock', 'ach', 'collection', 'unique']);
  recent.push(now); while (recent.length && now - recent[0] > 400) recent.shift();
  if (recent.length > 5 && !IMPORTANT.has(name)) return;
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
  combat: { root: 40, scale: [0, 3, 5, 7, 10], battle: true },
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
    const dur=mode.battle?3.2:7;pad(root + sc[deg] - 12,dur);pad(root + sc[(deg + 2) % 5],dur);
    if(mode.battle){[0,.42,.84,1.26].forEach((at,i)=>tone(mtof(root-12+(i%2)*5),.16,{at,type:'triangle',v:.045,dest:musG}));pluck(root+12+sc[(deg+1)%5]);}
    else if (Math.random() < .8) pluck(root + 12 + sc[rnd(0, 4)] + (Math.random() < .3 ? 12 : 0));
    setTimeout(() => { if (ctx && S().music && Math.random() < (mode.battle ? .9 : .6)) pluck(root + 12 + sc[rnd(0, 4)]); }, mode.battle ? 900 : rnd(1500,3500));
  }
  musicTimer = setTimeout(musicStep, mode.battle?rnd(2100,2900):rnd(4200,6200));
}
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
  return Object.assign(plan, { mode: combat ? 'combat' : 'village', music: combat ? 'combat' : town, ambienceOn: on, volumes: { master: st.settings.muted ? 0 : (st.settings.masterVol ?? 1), music: st.settings.music ? st.settings.musicVol : 0, ambience: st.settings.ambience === false ? 0 : (st.settings.ambVol ?? .45) * plan.duck, effects: st.settings.sfx ? st.settings.vol : 0 } }); };
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
DQ.audioStats = () => ({ ambienceTimers: ambTimers.size, ambienceNodes: ambNodes.length, town: ambTown, key: ambKey, state: ctx ? ctx.state : 'none' });
DQ.ambienceRefresh = () => {
  if (!ctx) return; applyVolumes();
  const st = DQ.audioState(), want = S().ambience === false ? null : st.town;
  /* the layers follow the village, its restoration tier and festivals; a fight only ducks them (no restart, so no stacking) */
  const plan = want && DQ.ambiencePlan(want, st.tier, { festival: !!(DQ.worldFestival && DQ.worldFestival()), calm: !!S().reduceFx });
  if (!want) { if (ambTown) { stopAmbience(); ambTown = null; ambKey = null; } }
  else if (plan.key !== ambKey) startAmbience(want, plan);
};
const ambWatch = () => { if (!ambLoop) ambLoop = setInterval(() => { if (ctx && !document.hidden) DQ.ambienceRefresh(); }, 2000); };

DQ.musicMode = id => { if(modeId===id)return;modeId=id;mode=MODES[id]||MODES.title;if(musicTimer&&ctx){clearTimeout(musicTimer);musicTimer=setTimeout(musicStep,120);} };
DQ.musicStart = () => { init(); applyVolumes(); if (!musicTimer && S().music) musicStep(); DQ.ambienceRefresh(); ambWatch(); };
DQ.musicRefresh = () => { applyVolumes(); if (S().music && !musicTimer && ctx) musicStep(); DQ.ambienceRefresh(); };
DQ.on('act',()=>{DQ.musicMode(DQ.act?.kind==='fight'?'combat':DQ.S.town);applyVolumes();});
document.addEventListener('visibilitychange', () => { if (ctx) { if (document.hidden) ctx.suspend(); else ctx.resume(); } });
})();
