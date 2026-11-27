/* Idlewick: characters and animals with personality (owner, 27 Nov 2026: "characters and animals with personality",
   so the game feels cosy and alive). Presentation only: no timer, chance, reward or save changes.

   The hero, wherever they stand (the Hero page and Combat paper doll, the combat stage, a work scene), breathes (CSS,
   css/motion.css), blinks every few seconds and, once nothing has run for a while (IDLE_MS), stretches, yawns or checks
   their belt pouch on the paper doll. In a work scene they wipe their brow every few swings, in the swing's recovery
   (after the tool has landed), so js/strike_sync.js keeps every strike and its sound exactly where it was.
   Expressions are sprite frames drawn in code (js/pixelart.js `expr`, DQ.heroFrameUrl) swapped onto the same <img>:
   same size, same whole-number scale; frames step, the little rises and leans move continuously.

   The companion (beside the hero on the paper doll, in work scenes and on the combat stage) breathes, flicks an ear or
   its tail (frames made from its own sprite: a row of pixels moved by one), hops on a kill (when the blow visibly lands),
   a catch, a capture or a level, and curls up asleep with a small Zzz once nothing has run for SLEEP_MS.

   Creatures on the combat stage wind up before each attack: a lean back and crouch that starts in proportion to their
   own attack interval, peaks as their swing begins and releases into it, so the existing lunge and impact
   (js/scene_motion.js, UI.afterImpact) land where they always did. A landed blow makes them stagger back and dip.

   Everything is off under Settings > Reduce effects (html.calm) and the device's reduced-motion setting, in the
   simulator and in forecasts. Motion is WAAPI/CSS on transform properties only (`translate`, added onto whatever else
   is moving), on the browser's own timeline. */
(() => {
const Q = window.DQ, D = Q.data, UI = Q.ui, S = () => Q.S;
const calm = () => document.documentElement.classList.contains('calm') || !!(S() && S().settings && S().settings.reduceFx) || matchMedia('(prefers-reduced-motion: reduce)').matches;
const quiet = () => !!((Q.sim && Q.sim.on) || Q.forecasting);
/* its own little generator: idle life never draws from Math.random, so seeded runs and the game's own rolls are
   untouched by how often a hero blinks */
let seed = (Date.now() ^ 0x5bd1e995) >>> 0 || 1;
const rnd = () => { seed ^= seed << 13; seed >>>= 0; seed ^= seed >>> 17; seed ^= seed << 5; seed >>>= 0; return seed / 4294967296; };
const rand = (a, b) => a + rnd() * (b - a);
const P = Q.personality = {
  IDLE_MS: 20000,          /* nothing running this long: the hero starts fidgeting on the paper doll */
  SLEEP_MS: 45000,         /* ...and the companion curls up */
  BLINK: [2600, 6400],     /* time between blinks */
  FIDGET: [9000, 16000],   /* time between idle fidgets */
  FLICK: [3500, 8500],     /* time between ear/tail flicks */
  WIPE_EVERY: [5, 8],      /* swings between brow wipes */
  WIPE: [.52, .86],        /* the part of a swing the wipe fills: after the impact (.4), before the next wind-up */
  idleSince: performance.now(), nextFidget: 0, force: null, epoch: 0, log: [] /* force: the next fidget (stretch, yawn, pack), for tests and the showcase */
};
const animate = (el, frames, opts) => { if (!el || !el.isConnected || calm() || document.hidden) return null; try { return el.animate(frames, Object.assign({ composite: 'add' }, opts)); } catch (e) { return null; } };
const keep = []; /* decoded frames stay alive, so a swap never shows a blank */
const preload = url => { if (!url) return; const im = new Image(); im.src = url; if (im.decode) im.decode().catch(() => {}); keep.push(im); if (keep.length > 160) keep.splice(0, keep.length - 160); };

/* ---------- the hero ---------- */
const HERO_FRAMES = ['blink', 'yawn', 'stretch', 'pack', 'wipe'];
const heroUrl = (frame, work) => Q.heroFrameUrl ? Q.heroFrameUrl(S().look, frame, work) : null;
const warmed = new Set();
const heroBase = work => { const base = heroUrl(null, work); if (base && !warmed.has(base)) { warmed.add(base); HERO_FRAMES.forEach(f => preload(heroUrl(f, work))); } return base; };
const heroEls = () => [...document.querySelectorAll('.fig-stage .fig-img, #av-you .rig-torso img, .scene-worker img')];
const state = new WeakMap();
const stOf = (el, mk) => { let st = state.get(el); if (!st) { st = mk(); state.set(el, st); } return st; };
const show = (el, st, url) => { if (url && el.getAttribute('src') !== url) el.setAttribute('src', url); st.set = url; };
/* a sequence is [[ms, frame], ...]; frame null is the plain figure */
const play = (st, seq, now, kind) => { st.seq = seq; st.t0 = now; st.kind = kind; };
const BLINK1 = [[0, 'blink'], [130, null]], BLINK2 = [[0, 'blink'], [110, null], [250, 'blink'], [370, null]];
const FIDGETS = {
  stretch: { seq: [[0, 'blink'], [180, 'stretch'], [1250, 'blink'], [1450, null]], move: [{ translate: '0 0' }, { translate: '0 -3px', offset: .3 }, { translate: '0 -3px', offset: .78 }, { translate: '0 0' }], ms: 1450 },
  yawn: { seq: [[0, 'blink'], [160, 'yawn'], [1100, 'blink'], [1260, null]], move: [{ translate: '0 0' }, { translate: '0 -1px', offset: .45 }, { translate: '0 0' }], ms: 1260 },
  pack: { seq: [[0, 'pack'], [1700, null]], move: [{ translate: '0 0' }, { translate: '-1px 2px', offset: .18 }, { translate: '-1px 2px', offset: .85 }, { translate: '0 0' }], ms: 1700 }
};
let lastFidget = '';
const strikeBeat = () => { const a = Q.act; if (!a || !a.dur || !Q.strikeLive) return null; const beat = a.dur / Math.max(1, Math.round(a.dur / 1200)), t = Math.max(0, Date.now() - a.t0); return { beat, key: a.t0 + ':' + Math.floor(t / beat), phase: (t % beat) / beat }; };

function heroTick(now, idle, due) {
  const fidget = idle >= P.IDLE_MS && now >= P.nextFidget;
  let fidgeted = false;
  for (const el of heroEls()) {
    const work = !!el.closest('.scene-worker'), base = heroBase(work), cur = el.getAttribute('src');
    const st = stOf(el, () => ({ next: now + rand(900, P.BLINK[1]), set: null, seq: null, wipeAt: 0, nextWipe: now + rand(14000, 22000) }));
    if (st.epoch !== P.epoch) { st.epoch = P.epoch; st.next = Math.min(st.next, now + rand(P.BLINK[0], P.BLINK[1])); }
    if (cur !== base && cur !== st.set) continue; /* someone else's picture (an old look mid-redraw): leave it */
    if (calm()) { if (st.seq || cur !== base) { st.seq = null; show(el, st, base); } continue; }
    /* the brow wipe: in the recovery part of a swing, every few swings; slower work every 14-22 s */
    if (work && (!st.seq || st.kind === 'blink')) {
      const b = strikeBeat();
      /* swings are counted as they pass (each action restarts its own clock, so a swing is its action's start and index) */
      if (b) { if (b.key !== st.swing) { st.swing = b.key; st.swings = (st.swings || 0) + 1; } if (!st.wipeAt) st.wipeAt = st.swings + Math.round(rand(P.WIPE_EVERY[0], P.WIPE_EVERY[1]));
        if (st.swings >= st.wipeAt && b.phase >= P.WIPE[0] && b.phase < P.WIPE[1] - .05) { play(st, [[0, 'wipe'], [Math.round((P.WIPE[1] - b.phase) * b.beat), null]], now, 'wipe'); st.wipeAt = st.swings + Math.round(rand(P.WIPE_EVERY[0], P.WIPE_EVERY[1])); P.log.push({ wipe: now, phase: b.phase, swing: st.swings }); if (P.log.length > 40) P.log.shift(); }
        else due((b.phase < P.WIPE[0] ? (P.WIPE[0] - b.phase) : (1 + P.WIPE[0] - b.phase)) * b.beat + 4); }
      else if (Q.act && now >= st.nextWipe) { play(st, [[0, 'wipe'], [650, null]], now, 'wipe'); st.nextWipe = now + rand(14000, 22000); }
      else if (Q.act) due(st.nextWipe - now);
    }
    if (!work && fidget && el.matches('.fig-img') && !st.seq) {
      const pool = Object.keys(FIDGETS).filter(k => k !== lastFidget), kind = FIDGETS[P.force] ? P.force : pool[Math.floor(rnd() * pool.length)], f = FIDGETS[kind]; P.force = null;
      play(st, f.seq, now, kind); animate(el, f.move.map(k => ({ easing: 'ease-in-out', ...k })), { duration: f.ms, easing: 'linear', id: 'lw-fidget' }); fidgeted = kind;
    }
    if (!st.seq && now >= st.next) { play(st, rnd() < .2 ? BLINK2 : BLINK1, now, 'blink'); st.next = now + rand(P.BLINK[0], P.BLINK[1]); }
    if (st.seq) {
      const t = now - st.t0; let frame = null, next = Infinity;
      for (const [at, f] of st.seq) { if (at <= t) frame = f; else { next = at; break; } }
      show(el, st, frame ? heroUrl(frame, work) : base);
      if (next === Infinity) st.seq = null; else due(next - t);
    }
    if (!st.seq) due(st.next - now);
  }
  if (fidgeted) { lastFidget = fidgeted; P.nextFidget = now + rand(P.FIDGET[0], P.FIDGET[1]); }
}

/* ---------- the companion ---------- */
const PET_SEL = '.fig-pet img:not(.lw-z), .scene-pet img:not(.lw-z), .battle-companion img:not(.lw-z)';
const petFrames = new Map();
/* frames from the companion's own sprite: an ear twitch (the top rows on the head side move back a pixel), a tail
   flick (the back end lifts a pixel) and asleep (legs folded under: the body settles onto the ground line, and plain
   ink eyes close to a darker line). Pixel for pixel, at the sprite's own size. */
const makeFrames = img => {
  const src = img.getAttribute('src'); if (petFrames.has(src)) return petFrames.get(src);
  if (!img.complete || !img.naturalWidth || img.naturalWidth > 64) return null;
  const w = img.naturalWidth, h = img.naturalHeight, c = document.createElement('canvas'); c.width = w; c.height = h;
  const x = c.getContext('2d'); x.drawImage(img, 0, 0); let px; try { px = x.getImageData(0, 0, w, h).data; } catch (e) { petFrames.set(src, false); return false; }
  let x0 = w, y0 = h, x1 = -1, y1 = -1;
  for (let y = 0; y < h; y++) for (let i = 0; i < w; i++) if (px[(y * w + i) * 4 + 3]) { x0 = Math.min(x0, i); x1 = Math.max(x1, i); y0 = Math.min(y0, y); y1 = Math.max(y1, y); }
  if (x1 < 0) { petFrames.set(src, false); return false; }
  const bw = x1 - x0 + 1, bh = y1 - y0 + 1, out = () => new Uint8ClampedArray(w * h * 4);
  const put = (o, X, Y, i) => { if (X < 0 || Y < 0 || X >= w || Y >= h) return; const j = (Y * w + X) * 4; o[j] = px[i]; o[j + 1] = px[i + 1]; o[j + 2] = px[i + 2]; o[j + 3] = px[i + 3]; };
  const frame = move => { const o = out(); for (let y = 0; y < h; y++) for (let i = 0; i < w; i++) { const k = (y * w + i) * 4; if (!px[k + 3]) continue; const [X, Y] = move(i, y); put(o, X, Y, k); } return o; };
  const url = o => { const cv = document.createElement('canvas'); cv.width = w; cv.height = h; cv.getContext('2d').putImageData(new ImageData(o, w, h), 0, 0); return cv.toDataURL(); };
  const midX = x0 + Math.floor(bw / 2), tailX = x0 + Math.floor(bw * .25), tailY = y0 + Math.floor(bh * .7), legs = Math.max(1, Math.round(bh * .16));
  const ears = frame((i, y) => y <= y0 + 2 && i >= midX ? [i - 1, y] : [i, y]);
  const tail = frame((i, y) => i <= tailX && y <= tailY ? [i, y - 1] : [i, y]);
  const sleep = out(); for (let y = y0; y <= y1 - legs; y++) for (let i = 0; i < w; i++) { const k = (y * w + i) * 4; if (px[k + 3]) put(sleep, i, y + legs, k); }
  const at = (o, i, y) => (y * w + i) * 4, ink = (o, j) => o[j + 3] && o[j] === 42 && o[j + 1] === 28 && o[j + 2] === 31;
  const eyes = []; for (let y = y0 + legs; y < y0 + legs + bh * .65; y++) for (let i = x0; i <= x1; i++) if (ink(sleep, at(sleep, i, y))) eyes.push([i, y]);
  if (eyes.length && eyes.length <= 8) for (const [i, y] of eyes) { const j = at(sleep, i, y), n = [[i - 1, y], [i + 1, y], [i, y + 1]].map(([a, b]) => a >= 0 && a < w && b < h ? at(sleep, a, b) : -1).find(k => k >= 0 && sleep[k + 3] && !ink(sleep, k));
    if (n === undefined) continue; for (let q = 0; q < 3; q++) sleep[j + q] = Math.round(sleep[n + q] * .62); /* a closed lid: the fur beside it, in shadow */
    for (const [a, b] of [[i, y - 1], [i - 1, y - 1], [i + 1, y - 1]]) { if (a < 0 || b < 0 || a >= w) continue; const k = at(sleep, a, b); if (sleep[k + 3] && sleep[k] > 235 && sleep[k + 1] > 235 && sleep[k + 2] > 235) for (let q = 0; q < 3; q++) sleep[k + q] = sleep[n + q]; } }
  const f = { ears: url(ears), tail: url(tail), sleep: url(sleep), base: src }; Object.values(f).forEach(preload); petFrames.set(src, f); return f;
};
let zUrl = '';
const zzz = () => { if (zUrl) return zUrl; const A = Q.pixelArt; if (!A) return ''; const s = A.Spr(7, 7), r = A.ramp('#e4ecf6'); s.grid(['.......', '.zzzzz.', '....z..', '...z...', '..z....', '.zzzzz.', '.......'], { z: r }); const c = A.toCanvas(s); return (zUrl = c.toDataURL()); };
const zzzHtml = img => { const k = (img.offsetHeight || 48) >= 64 ? 2 : 1; /* 7 x 7 drawn at 1x beside a small companion, 2x beside a big one */
  return `<span class="lw-zzz" aria-hidden="true">${[0, 1, 2].map(i => `<img class="pxa lw-z" src="${zzz()}" width="${7 * k}" height="${7 * k}" style="width:${7 * k}px;height:${7 * k}px;--z:${i}" alt="" draggable="false">`).join('')}</span>`; };
const wake = (img, st) => { const box = img.parentElement; box && box.classList.remove('lw-asleep'); box && box.querySelector(':scope > .lw-zzz')?.remove(); st.asleep = false; if (st.frames && img.getAttribute('src') === st.frames.sleep) img.setAttribute('src', st.frames.base); st.set = null; };
function petTick(now, idle, due) {
  for (const img of document.querySelectorAll(PET_SEL)) {
    const st = stOf(img, () => ({ next: now + rand(1200, P.FLICK[1]), seq: null, set: null, asleep: false, frames: null }));
    if (st.epoch !== P.epoch) { st.epoch = P.epoch; st.next = Math.min(st.next, now + rand(P.FLICK[0], P.FLICK[1])); }
    const cur = img.getAttribute('src');
    if (!st.frames || (cur !== st.frames.base && cur !== st.set)) { const f = makeFrames(img); if (f === null) { due(120); continue; } if (!f) continue; if (st.frames && st.frames.base !== f.base) st.asleep = false; st.frames = f; }
    const F = st.frames;
    if (cur !== F.base && cur !== st.set) continue;
    if (calm()) { if (st.asleep || st.seq || cur !== F.base) { st.seq = null; wake(img, st); img.setAttribute('src', F.base); } continue; }
    const sleepy = idle >= P.SLEEP_MS && !Q.act;
    if (sleepy && !st.asleep) { st.seq = null; st.asleep = true; img.setAttribute('src', F.sleep); st.set = F.sleep; const box = img.parentElement; if (box) { box.classList.add('lw-asleep'); if (!box.querySelector(':scope > .lw-zzz')) box.insertAdjacentHTML('beforeend', zzzHtml(img)); } }
    else if (!sleepy && st.asleep) { wake(img, st); hop(img, .5); }
    if (st.asleep) { const box = img.parentElement; if (box && !box.querySelector(':scope > .lw-zzz')) { box.classList.add('lw-asleep'); box.insertAdjacentHTML('beforeend', zzzHtml(img)); } if (img.getAttribute('src') !== F.sleep) img.setAttribute('src', F.sleep); st.set = F.sleep; continue; }
    if (!st.seq && now >= st.next) { const ear = rnd() < .55; st.seq = ear ? [[0, 'ears'], [140, null]] : [[0, 'tail'], [120, null], [240, 'tail'], [360, null]]; st.t0 = now; st.next = now + rand(P.FLICK[0], P.FLICK[1]); }
    if (st.seq) { const t = now - st.t0; let fr = null, next = Infinity; for (const [at, f] of st.seq) { if (at <= t) fr = f; else { next = at; break; } }
      const u = fr ? F[fr] : F.base; if (cur !== u) img.setAttribute('src', u); st.set = u; if (next === Infinity) st.seq = null; else due(next - t); }
    if (!st.seq) due(st.next - now);
  }
}
/* a happy hop, scaled to the companion's height; a sleeping one wakes first */
const hop = (img, k = 1) => { const st = state.get(img); if (st && st.asleep) wake(img, st); const h = Math.max(4, Math.round((img.offsetHeight || 48) * .2 * k));
  const up = 'cubic-bezier(.2,.7,.4,1)', down = 'cubic-bezier(.6,0,.8,.4)';
  return animate(img, [{ translate: '0 0', easing: up }, { translate: `0 ${-h}px`, offset: .36, easing: down }, { translate: '0 0', offset: .7, easing: up }, { translate: `0 ${-Math.round(h / 4)}px`, offset: .84, easing: down }, { translate: '0 0' }], { duration: 560, easing: 'linear', id: 'lw-pet-hop' }); };
const cheer = () => { if (quiet() || calm() || document.hidden) return; P.idleSince = performance.now(); for (const img of document.querySelectorAll(PET_SEL)) hop(img); };
P.cheer = cheer;
Q.on('slain', () => { if (quiet()) return; UI.afterImpact ? UI.afterImpact(cheer, Q.battleTiming?.impact || 390) : cheer(); }); /* when the killing blow visibly lands */
Q.on('huntcatch', cheer); Q.on('capturekept', cheer); Q.on('levelup', () => setTimeout(cheer, 120));
Q.on('workcycle', e => { if (e && e.kind === 'fish' && e.quantity > 0) setTimeout(cheer, 300); });

/* ---------- creatures on the combat stage ---------- */
const foeRig = () => document.querySelector('.encounter-arena #av-foe .foe-rig');
const foeMon = () => { const id = Q.fight && Q.fight.id || document.querySelector('.encounter-arena #av-foe')?.dataset.a; return id && D.MON[id]; };
Q.on('splat', (side, text, kind = '', delay = 0) => {
  if (quiet() || calm() || document.hidden || UI.view !== 'combat' || !/^\d/.test(String(text))) return;
  const start = Math.max(0, delay - 180), T = Q.battleTiming || { impact: 390, duration: 720 }, m = foeMon();
  if (side === 'you') {
    /* the wind-up: longer for slow, heavy hitters; it peaks as the creature's swing begins (scene_motion starts it at
       delay - 180) and lets go into the lunge, finishing as the blow lands */
    const wind = Math.min(start - 40, Math.max(300, Math.min(640, (m && m.attackMs || 2000) * .24)));
    if (wind < 150) return;
    setTimeout(() => {
      const rig = foeRig(); if (!rig || calm()) return; const u = parseFloat(getComputedStyle(rig).getPropertyValue('--rig-unit')) || 4, back = Math.round(u * 2.5), dip = Math.round(u), all = wind + T.impact;
      rig.dataset.windup = '1'; P.lastWindup = { at: performance.now(), wind, impactAt: performance.now() + all };
      const a = animate(rig, [{ translate: '0 0', easing: 'cubic-bezier(.45,0,.4,1)' }, { translate: `${back}px ${dip}px`, offset: wind / all }, { translate: `${back}px ${dip}px`, offset: (wind + 140) / all, easing: 'cubic-bezier(.5,0,.9,.6)' }, { translate: '0 0' }], { duration: all, easing: 'linear', id: 'lw-windup' });
      const done = () => { if (rig.dataset.windup) delete rig.dataset.windup; }; if (a) { a.onfinish = done; a.oncancel = done; } else done();
    }, start - wind);
  } else if (side === 'foe' && !kind.includes('miss')) {
    /* a stagger when the blow visibly lands: pushed back and the knees give a little, more for a big hit */
    const n = parseInt(text, 10) || 0, big = String(text).includes('!') || (m && n >= m.hp * .2), k = big ? 1.6 : 1;
    const go = () => { const rig = foeRig(); if (!rig) return; const u = parseFloat(getComputedStyle(rig).getPropertyValue('--rig-unit')) || 4;
      animate(rig, [{ translate: '0 0' }, { translate: `${Math.round(u * k)}px ${Math.round(u * .5 * k)}px`, offset: .22 }, { translate: `${-Math.round(u * .25 * k)}px 0`, offset: .6 }, { translate: '0 0' }], { duration: big ? 460 : 360, easing: 'cubic-bezier(.22,.7,.3,1)', id: 'lw-stagger' }); };
    UI.afterImpact ? UI.afterImpact(go, start + T.impact) : setTimeout(go, start + T.impact);
  }
});
/* each creature breathes at its own pace: heavy, slow hitters slower */
const breathe = () => { const rig = foeRig(), m = foeMon(); if (!rig || !m || rig.dataset.breath === m.id) return; rig.dataset.breath = m.id; rig.style.animationDuration = Math.round(Math.max(2400, Math.min(4400, (m.attackMs || 2000) * 1.45))) + 'ms'; };

/* ---------- the clock: one timer, set for the next thing due (never a fixed-rate loop) ---------- */
let timer = 0;
const tick = () => {
  clearTimeout(timer); timer = 0;
  const now = performance.now(); if (Q.act) P.idleSince = now;
  if (!P.nextFidget || P.nextFidget < P.idleSince + P.IDLE_MS) P.nextFidget = P.idleSince + P.IDLE_MS;
  let next = 400; const due = ms => { if (ms > 0 && ms < next) next = ms; };
  if (!document.hidden && S()) { const idle = now - P.idleSince; try { heroTick(now, idle, due); petTick(now, idle, due); breathe(); } catch (e) { P.err = String(e && e.stack || e); if (Q.debug) console.error(e); } }
  timer = setTimeout(tick, Math.max(16, Math.min(400, next)));
};
P.tick = tick;
P.retime = () => { P.epoch++; tick(); }; /* after changing BLINK or FLICK: every figure picks the new pace now */
document.addEventListener('visibilitychange', () => { if (!document.hidden) tick(); });
const render0 = UI.render; UI.render = (...a) => { const r = render0(...a); if (!timer || calm()) setTimeout(tick, 0); return r; };
setTimeout(tick, 500);
})();
