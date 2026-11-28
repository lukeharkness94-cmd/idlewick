/* Idlewick: the opening (owner, 28 Nov 2026: "this needs a complete redo ... it's not particularly immersive - use the
   new interactive characters, motions etc to make the opening scene far more immersive").
   A short living scene, played once after the character is made, built from the game's own living systems:
   1 noon    Willowbrook from above as it was (js/town_scene.js), its townsfolk walking the streets
             (js/town_walkers.js), smoke, animals and the noon light (js/town_life.js); the bell swings in its belfry,
             drawn close up (js/opening_art.js) and rung with the town's own cast-bell voice (js/audio.js); everyone
             stops and turns towards it.
   2 night   night falls (lamps and windows come up), a shadowy shape takes the bell, and at dawn only the rope swings;
             the music thins.
   3 empty   days pass in quick light, rain on the second; people leave one by one with their bundles and the good
             pans, one of them says so, and the town falls into its present, ruined look.
   4 lodging far down the road the hero (the player's look and starter weapon, breathing and blinking: js/personality.js)
             is in their room (js/hearth.js); a knock, and a letter slides under the door.
   5 letter  the wax seal breaks and Wren's letter opens on parchment (js/hearth_letters.js's paper, Wren's portrait,
             the hero's name).
   6 road    the walk home, side-on: parallax hills, hedgerow and road in the season, the hero in a real walk cycle
             (js/pixelart.js), past the signpost for Willowbrook; holding a key or the pointer walks faster.
   7 home    the hero walks in to the broken well where Wren is waiting, and they talk in the conversation screen
             (js/story.js, scene opening_home in js/story_data.js), ending on the plain goal and one reply (S.choices).
   8 title   the view pulls back over the town; Idlewick; Begin.
   Everything moves on by itself (about two minutes if you only watch); a click, Space or Enter hurries the beat; Skip
   appears after the first input and Escape skips at any time. Begin and Skip both end in the game with S.seen.intro
   recorded, and nothing else changed: the opening grants nothing. Under Reduce effects, html.calm and reduced motion
   nothing moves: each beat is one still frame with its words, and it can still be skipped. Motion runs on the one
   clock (DQ.frame) with transforms and opacity; every picture is shown at a whole-number multiple of its drawn size,
   cropped by the screen. Replay from Home > Journal. tests/intro.cjs. */
(() => {
const DQ = window.DQ, D = DQ.data, UI = DQ.ui, S = () => DQ.S, esc = DQ.esc;
const A = () => DQ.pixelArt || {};
const root = document.documentElement, TOWN = 'willowbrook';
const calm = () => root.classList.contains('calm') || !!(S() && S().settings && S().settings.reduceFx) || matchMedia('(prefers-reduced-motion: reduce)').matches;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v)), smooth = t => { t = clamp(t, 0, 1); return t * t * (3 - 2 * t); };
const el = (tag, cls, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; };
const canvasEl = (w, h, cls) => { const c = el('canvas', cls); c.width = w; c.height = h; c.setAttribute('aria-hidden', 'true'); return c; };
const size = (e, w, h) => { e.style.width = w + 'px'; e.style.height = h + 'px'; };
const move = (e, x, y) => { e.style.transform = `translate3d(${Math.round(x)}px,${Math.round(y)}px,0)`; };

/* ---------- the words: spoken or shown, a line at a time ---------- */
const WORDS = {
  bells: 'Every town on the old road had a bell.',
  noon: 'It rang once, at noon. The market opened, the kettles went on, and somebody always went to the well to complain about the weather.',
  noonSay: 'Noon already? I’ve done nothing.',
  work: 'Nobody thought much about the bells. You don’t, with things that work.',
  missing: 'Then the bells started to go missing.',
  rope: 'By breakfast there was just a rope, swinging a bit guiltily. Several people saw nothing, very carefully.',
  traders: 'Without the noon bell, fewer traders came. Then whole market days went by with nobody on the road.',
  pans: 'I’m off to my sister’s. I’m taking the good pans.',
  left: 'People did what people do. They packed up and left.',
  far: 'Far down the road, someone who grew up in Willowbrook was having a perfectly ordinary week.',
  knock: 'Knock, knock.',
  knight: 'You are not a knight. Nobody chose you. There was no prophecy, just a letter and a very long walk.',
  enough: 'You can fish, cut timber, cook a decent meal and hold your ground when it matters. It turns out that is enough to start.',
  home: 'Willowbrook. Home, more or less.',
  goal: 'Help a town get back on its feet, then beat the creature blocking its road. That opens the way to the next town.',
  word: 'Somewhere at the end of that road is whoever has the bells. You would like a word.'
};
const LETTER = name => [
  ['date', 'Willowbrook, early spring'],
  ['dear', `Dear ${name},`],
  ['', 'The well is broken and someone has taken the bucket. Who steals a bucket? Goblins, apparently.'],
  ['', 'Half the houses on the green are empty, and Mabel is feeding the rest of us out of sheer stubbornness.'],
  ['', 'I can’t pay much. There is a bed, a rod, an axe, and more work than one person ought to take on. I am told that is what friends are for.'],
  ['', 'You grew up here. Come home. Bring boots.'],
  ['sign', 'Wren'],
  ['ps', 'P.S. Orrin says hello. He doesn’t, but he would if he were nicer.']
];

/* ---------- Willowbrook as it was, and as it is (the belfry is drawn by the opening itself) ---------- */
const scenes = {};
const projectIds = () => Object.keys(D.PROJECTS || {}).filter(k => D.PROJECTS[k].town === TOWN);
const sceneOf = (stages, extras) => { const a = A(); if (!a.sceneFor) return null; const keep = a.sceneMeta && a.sceneMeta[TOWN];
  const c = a.sceneFor(TOWN, stages, extras), meta = c.meta; if (keep && a.sceneMeta) a.sceneMeta[TOWN] = keep; /* the Home and Village scenes keep their own record */
  return { url: c.toDataURL(), meta }; };
const nowScene = () => { const st = Object.fromEntries(projectIds().map(k => [k, DQ.projectStage ? DQ.projectStage(k) : 0])), key = JSON.stringify(st);
  if (!scenes.now || scenes.nowKey !== key) { scenes.now = sceneOf(st, { skip: ['bell'], farm: !!((S().unlocked || {}).farming) }); scenes.nowKey = key; } return scenes.now; };
const pastScene = () => { nowScene(); return scenes.past || (scenes.past = sceneOf(Object.fromEntries(projectIds().map(k => [k, D.PROJECTS[k].relic ? 0 : 4])), { skip: ['bell'] })); };
const ruinScene = () => { nowScene(); return scenes.ruin || (scenes.ruin = sceneOf(Object.fromEntries(projectIds().map(k => [k, 0])), { skip: ['bell'] })); };
const bellSite = () => { const s = (A().siteLayout ? A().siteLayout(TOWN) : []).find(x => x.id === 'bell'); return s ? { X: s.X, Y: s.Y } : { X: 570, Y: 196 }; };
const heroChibi = () => { const L = S().look || {}; return { skin: L.skin || '#e8b98e', hair: L.hair || '#3a2414', hs: 'short', cloth: L.tunic || '#3f7fbf' }; };
const folk = n => DQ.folkOf ? DQ.folkOf(n) : null;

let R = null; /* the opening while it plays */
DQ.introLive = () => !!R;
DQ.introSeen = () => !!(S() && S().seen && S().seen.intro);

/* ---------- shots: a layer each, dipped in and out ---------- */
const addShot = cls => { const s = el('div', 'op-shot ' + cls); R.stage.appendChild(s); if (R.still) s.classList.add('on'); else requestAnimationFrame(() => s.classList.add('on')); return s; };
const dropShot = s => { if (!s) return; s.classList.remove('on'); s.classList.add('off'); setTimeout(() => s.remove(), R && !R.still ? 700 : 0); };

/* the narrator: one line at a time, large, on its own dark backing */
const say = (text, pos = 'bottom') => { const box = R.sayEl; box.dataset.pos = R.box.phone ? 'bottom' : pos; const old = box.querySelector('p.on'); if (old) { old.classList.remove('on'); old.classList.add('gone'); setTimeout(() => old.remove(), R.still ? 0 : 400); }
  box.classList.toggle('empty', !text); if (!text) return; const p = el('p', R.still ? 'on' : ''); p.textContent = text; box.appendChild(p); if (!R.still) requestAnimationFrame(() => p.classList.add('on')); R.said.push(text); };
/* a speech bubble over a townsperson (or a fixed point), following them as they walk */
const bubble = (text, at, secs = 3.4) => { const b = el('div', 'op-bubble'); b.textContent = text; b.setAttribute('role', 'note'); R.el.appendChild(b); const B = { b, at, until: R.clock + secs, half: b.offsetWidth / 2 }; R.bubbles.push(B); placeBubble(B); R.said.push(text);
  if (!R.still) requestAnimationFrame(() => b.classList.add('on')); else b.classList.add('on'); return B; };
/* kept on screen: a speaker near the edge has their bubble pulled in (measured once, when it is made) */
const placeBubble = B => { const p = B.at(); if (p) move(B.b, clamp(p[0], B.half + 10, R.box.w - B.half - 10), p[1]); B.b.style.transform += ' translate(-50%,-100%)'; };
const bubblesTick = () => { for (const B of R.bubbles.slice()) { if (R.clock > B.until || !B.b.isConnected) { B.b.classList.remove('on'); setTimeout(() => B.b.remove(), 300); R.bubbles.splice(R.bubbles.indexOf(B), 1); continue; } placeBubble(B); } };

/* ---------- the town from above: scene, belfry, townsfolk and town life, under a camera ---------- */
function townShot(o) {
  const shot = addShot('op-town'), world = el('div', 'op-world'), img = new Image(), props = canvasEl(640, 360, 'op-props');
  img.className = 'op-scene'; img.alt = ''; img.draggable = false; world.appendChild(img); shot.appendChild(world);
  const T = { shot, world, img, props, px: props.getContext('2d'), k: 1, tx: 0, ty: 0, cam: { x: o.focus[0], y: o.focus[1] }, want: { x: o.focus[0], y: o.focus[1] }, belfry: o.belfry || 'rope', nudge: 0, ripples: [], cast: o.cast || [], meta: o.meta, drawn: '' };
  const site = bellSite();
  T.people = () => (T.walk ? T.walk.L.walkers : T.cast);
  /* night deepens a little more than on the Home page, so the theft happens in the dark (multiplied, like the hour's tint) */
  const night = el('div', 'op-night'); night.setAttribute('aria-hidden', 'true'); world.appendChild(night);
  T.layout = () => { const { w, h, phone } = R.box; let k = phone ? clamp(Math.floor((h * .86) / 360), 1, 3) : Math.max(1, Math.ceil(Math.max(w / 640, h / 360) - .02)); if (o.wide) k = Math.max(1, k - 1); if (o.close) k = Math.min(phone ? 3 : 6, k + 1);
    T.k = k; for (const e of [world, img, props, night]) size(e, 640 * k, 360 * k); T.place(); T.shade(); };
  T.place = () => { const { w, h, phone } = R.box, k = T.k, W = 640 * k, H = 360 * k, ay = o.anchorY || .5;
    T.tx = Math.round(W <= w ? (w - W) / 2 : clamp(w / 2 - T.cam.x * k, w - W, 0));
    T.ty = Math.round(H <= h ? (phone ? Math.max(0, (h - H) * .22) : (h - H) / 2) : clamp(h * ay - T.cam.y * k, h - H, 0));
    const at = T.tx + ',' + T.ty + ',' + k; if (at !== T.at) { T.at = at; move(world, T.tx, T.ty); } /* written only when the camera has moved a whole pixel */ };
  T.shade = () => { const d = DQ.townLight ? DQ.townLight(((R.hour % 24) + 24) % 24).dark : 0, key = Math.round(d * 40); if (key === T.shadeKey) return; T.shadeKey = key;
    night.style.display = d > .02 ? '' : 'none'; /* no extra blended layer by day */
    night.style.backgroundColor = `rgb(${[255, 255, 255].map((v, i) => Math.round(v + ([70, 82, 128][i] - v) * d * .5)).join(',')})`; };
  T.relight = () => { if (T.life) T.life.repaint(); T.shade(); T.drawProps(true); };
  T.screen = (x, y) => [T.tx + x * T.k, T.ty + y * T.k];
  /* the belfry at its site, the bell nudged a pixel as it swings (or the rope alone), and rings of sound as it strikes */
  T.drawProps = force => { const key = T.belfry + T.nudge + ':' + T.ripples.map(r => Math.round(r.age * 20)).join(','); if (!force && key === T.drawn) return; T.drawn = key;
    const x = T.px; x.clearRect(0, 0, 640, 360); if (!T.belfry) return; x.fillStyle = 'rgba(6,8,14,.3)'; for (let j = -3; j <= 3; j++) { const ww = Math.round(15 * Math.sqrt(1 - (j * j) / 12.5)); x.fillRect(site.X + 16 - ww, site.Y + 30 + j, ww * 2, 1); }
    const art = A().openingBelfryTop && A().openingBelfryTop(T.belfry, T.nudge); if (art) x.drawImage(art, site.X, site.Y);
    /* still (Reduce effects, reduced motion): nobody walks, so the cast stands where they are, drawn once */
    if (R.still && A().townFolk) for (const w of [...T.cast].sort((a, b) => a.y - b.y)) if (!w.hidden && !w.thief && !w.leave) A().townFolk(x, w.goal != null && w.hold ? w.goal : w.x, w.y, w.look, 0, w.face || 0);
    for (const r of T.ripples) { const rad = 8 + r.age * 70, a = Math.max(0, .55 * (1 - r.age / 1.8)); x.fillStyle = `rgba(255,236,170,${a.toFixed(3)})`; for (let i = 0; i < 96; i++) { const t = i / 96 * Math.PI * 2; x.fillRect(Math.round(site.X + 16 + Math.cos(t) * rad), Math.round(site.Y + 12 + Math.sin(t) * rad * .6), 1, 1); } } };
  T.ring = () => { if (!R.still) T.ripples.push({ age: 0 }); };
  T.update = dt => { const k = 1 - Math.exp(-dt * 1.6); T.cam.x += (T.want.x - T.cam.x) * k; T.cam.y += (T.want.y - T.cam.y) * k; T.place(); T.shade();
    for (const r of T.ripples) r.age += dt; T.ripples = T.ripples.filter(r => r.age < 1.8); T.drawProps(); };
  T.swap = (scene, done) => { const go = () => { img.removeEventListener('load', go); if (T.life) T.life.remove(); T.meta = scene.meta; T.life = DQ.townLifeMount ? DQ.townLifeMount(img, { meta: scene.meta, town: TOWN, hour: () => R.hour, weather: () => R.weather, share: o.shareAfter }) : null; done && done(); };
    img.addEventListener('load', go); img.src = scene.url; };
  T.remove = () => { if (T.walk) T.walk.remove(); if (T.life) T.life.remove(); T.walk = T.life = null; R.shots.delete(T); dropShot(shot); };
  img.addEventListener('load', () => { if (!R || !shot.isConnected || T.mounted) return; T.mounted = true;
    T.walk = DQ.townWalkersMount && !R.still ? DQ.townWalkersMount(img, { walkers: T.cast }) : null; img.after(props);
    T.life = DQ.townLifeMount ? DQ.townLifeMount(img, { meta: T.meta, town: TOWN, hour: () => R.hour, weather: () => R.weather, share: o.share }) : null; T.drawProps(true); }, { once: true });
  img.src = o.url; R.shots.add(T); T.layout(); return T;
}
const site0 = () => bellSite();
const turnToBell = T => { const s = site0(), bx = s.X + 16; for (const w of T.people()) { if (w.thief || w.hidden) continue; w.goal = null; w.rest = 4.5 + Math.random() * 1.5; w.face = w.x < bx ? 1 : -1; } };
const leave = (w, carry, pace = 16) => { if (!w) return; w.carry = carry || null; w.leave = true; w.script = true; w.rest = 0; w.goal = null; w.dir = w.x < 320 ? -1 : 1; w.pace = pace; };
const castOf = (n, seed) => { const list = DQ.townWalkersMake ? DQ.townWalkersMake(seed || TOWN, 640, n) : []; for (const w of list) w.look = { skin: w.skin, hair: w.hair, hs: w.hs, cloth: w.cloth, basket: w.basket }; return list; };

/* ---------- the bell, close up, in a framed window of its own ---------- */
const inset = (state, i = 2, sky = 'noon') => { let box = R.inset; if (!box) { box = R.inset = el('div', 'op-inset'); box.setAttribute('aria-hidden', 'true'); box.appendChild(canvasEl(64, 64, 'op-bellcv')); R.el.appendChild(box); }
  const k = R.box.phone ? 3 : clamp(Math.floor(R.box.h / 260), 3, 5), c = box.firstChild; if (+box.dataset.k !== k) { box.dataset.k = k; size(c, 64 * k, 64 * k); } if (!box.classList.contains('on')) box.classList.add('on');
  const key = state + i + sky; if (box.dataset.key !== key) { box.dataset.key = key; const x = c.getContext('2d'); x.clearRect(0, 0, 64, 64); const art = A().openingBelfry && A().openingBelfry(state, i, sky); if (art) x.drawImage(art, 0, 0); } };
const insetOff = () => { if (R.inset) R.inset.classList.remove('on'); };
const swingIndex = deg => clamp(Math.round(deg / 13) + 2, 0, 4);

/* ---------- the lodging: the hearth room, borrowed, with the hero standing in it ---------- */
function roomShot() {
  const H0 = DQ.HEARTH_ROOM || { w: 320, h: 280, oy: 40, hero: { x: 140, y: 172 } }, shot = addShot('op-room'), world = el('div', 'op-world'), img = new Image(), lights = canvasEl(H0.w, H0.h, 'op-lights');
  img.className = 'op-scene'; img.alt = ''; img.draggable = false;
  const fig = el('span', 'fig-stage op-hero'), hero = el('img', 'fig-img'); hero.alt = ''; hero.draggable = false; hero.src = DQ.heroFigureUrl ? DQ.heroFigureUrl(S().look) : ''; fig.appendChild(hero);
  const env = canvasEl(18, 12, 'op-env'), ea = A().openingEnvelope && A().openingEnvelope('small'); if (ea) env.getContext('2d').drawImage(ea, 0, 0);
  world.append(img, lights, fig, env); shot.appendChild(world);
  const P = { shot, world, img, lights, lx: lights.getContext('2d'), fig, hero, env, k: 1, tx: 0, ty: 0, t: 0, envAt: null, H0 };
  P.layout = () => { const { w, h, phone } = R.box, k = P.k = phone ? clamp(Math.floor(h * .8 / H0.h), 1, 3) : Math.max(1, Math.floor(Math.min(w / H0.w, h / 240))), W = H0.w * k, H = H0.h * k;
    for (const e of [world, img, lights]) size(e, W, H);
    for (const [p, v] of Object.entries({ left: H0.hero.x * k + 'px', top: (H0.oy + H0.hero.y - 32) * k + 'px', width: 24 * k + 'px', height: 32 * k + 'px' })) hero.style.setProperty(p, v, 'important');
    size(env, 18 * k, 12 * k);
    P.tx = Math.round(W <= w ? (w - W) / 2 : clamp(w / 2 - (H0.hero.x + 12) * k, w - W, 0)); P.ty = Math.round(H <= h ? (phone ? (h - H) * .3 : (h - H) / 2) : clamp(h / 2 - (H0.oy + 150) * k, h - H, 0)); move(world, P.tx, P.ty); P.placeEnv(); };
  /* the envelope: under the door at the left, across the boards to the rug */
  P.placeEnv = () => { const k = P.k, a = P.envAt; if (a == null) { env.style.opacity = '0'; return; } env.style.opacity = '1'; move(env, (-22 + 70 * smooth(a)) * k, (H0.oy + 226) * k); };
  P.envScreen = () => [P.tx + (-22 + 70 + 9) * P.k, P.ty + (H0.oy + 226) * P.k];
  P.update = dt => { P.t += dt; if (DQ.hearthLightsDraw) DQ.hearthLightsDraw(P.lx, P.t, .1, !R.still); };
  P.remove = () => { R.shots.delete(P); dropShot(shot); };
  (DQ.hearthRoomUrl ? DQ.hearthRoomUrl('saltmere', 8.4) : Promise.resolve('')).then(u => { if (u) img.src = u; if (DQ.hearthLightsDraw) DQ.hearthLightsDraw(P.lx, 0, .1, false); });
  R.shots.add(P); P.layout(); return P;
}

/* ---------- the road home, side-on, in layers ---------- */
function roadShot() {
  const RD = A().OPENING_ROAD || { w: 320, h: 180, ground: 160 }, season = DQ.season ? DQ.season() : 'autumn', L = A().openingRoad ? A().openingRoad(TOWN, season) : null;
  const shot = addShot('op-road'), layers = {};
  /* each layer is two copies of its seamless strip side by side; sliding it left by up to one copy always covers the
     screen, since the strip at its whole-number scale is at least as wide as the screen */
  for (const [name, f] of [['sky', .03], ['far', .14], ['mid', .5], ['near', 1]]) { const c = canvasEl(RD.w * 2, RD.h, 'op-layer op-' + name); if (L) for (let i = 0; i < 2; i++) c.getContext('2d').drawImage(L[name], i * RD.w, 0); shot.appendChild(c); layers[name] = { c, f }; }
  const tint = el('div', 'op-roadtint'), fx = canvasEl(RD.w, RD.h, 'op-fx'), shadow = el('i', 'op-shadow'), hero = el('img', 'op-walker'), sign = el('div', 'op-sign'), sc = canvasEl(36, 46, 'op-signcv'), name = el('b', 'op-signname', 'Willowbrook');
  hero.alt = ''; hero.draggable = false; const sp = A().openingSignpost && A().openingSignpost(); if (sp) sc.getContext('2d').drawImage(sp, 0, 0); sign.append(name, sc);
  const hint = el('small', 'op-hint', R.box.phone ? 'Hold the screen to walk faster' : 'Hold Space or the mouse button to walk faster');
  shot.append(sign, tint, shadow, hero, fx, hint); /* the light of the hour falls on the scenery and the signpost, not on the hero */
  const frames = [0, 1, 2, 3].map(i => DQ.heroWalkUrl ? DQ.heroWalkUrl(S().look, i) : (DQ.heroFigureUrl ? DQ.heroFigureUrl(S().look) : ''));
  frames.forEach(u => { const im = new Image(); im.src = u; });
  const Rd = { shot, layers, tint, fx, fxx: fx.getContext('2d'), hero, shadow, sign, name, hint, frames, k: 1, baseX: 0, ty: 0, dist: 0, frame: -1, end: 420, signX: 0, hx: 0, season, leaves: [], tintKey: '' };
  for (let i = 0; i < 26; i++) Rd.leaves.push({ x: Math.random() * RD.w, y: Math.random() * RD.h, s: 8 + Math.random() * 10, p: Math.random() * 6.28 });
  Rd.layout = () => { const { w, h, phone } = R.box, k = Rd.k = phone ? Math.max(clamp(Math.floor(h * .66 / RD.h), 1, 4), Math.ceil(w / RD.w)) :Math.max(1, Math.ceil(Math.max(w / RD.w, h / RD.h) - .02)), W = RD.w * k, H = RD.h * k;
    Rd.baseX = Math.round((w - W) / 2); Rd.ty = Math.round(phone ? Math.max(0, (h - H) * .3) : h - H);
    for (const { c } of Object.values(layers)) { size(c, W * 2, H); c.style.left = Rd.baseX + 'px'; c.style.top = Rd.ty + 'px'; }
    for (const e of [tint, fx]) { size(e, W, H); e.style.left = Rd.baseX + 'px'; e.style.top = Rd.ty + 'px'; }
    size(hero, 24 * k, 32 * k); const hxs = Math.round(w * (phone ? .42 : .4) - 12 * k); hero.style.left = hxs + 'px'; hero.style.top = (Rd.ty + (RD.ground - 32) * k) + 'px';
    size(shadow, 16 * k, 3 * k); shadow.style.left = (hxs + 4 * k) + 'px'; shadow.style.top = (Rd.ty + (RD.ground - 2) * k) + 'px';
    size(sc, 36 * k, 46 * k); sign.style.top = (Rd.ty + (151 - 46) * k) + 'px';
    Rd.hx = (hxs + 12 * k - Rd.baseX) / k; if (!Rd.signX) Rd.signX = Rd.hx + 300; Rd.place(); };
  Rd.place = () => { const k = Rd.k, W = RD.w * k;
    for (const { c, f } of Object.values(layers)) { const off = ((Rd.dist * f * k) % W + W) % W; c.style.transform = `translate3d(${-Math.round(off)}px,0,0)`; }
    move(sign, Rd.baseX + (Rd.signX - Rd.dist - 18) * k, 0);
    const f = Math.floor(Rd.dist / 7) % 4; if (f !== Rd.frame) { if (!R.still && (f === 0 || f === 2) && Rd.frame >= 0) DQ.sfx && DQ.sfx('step'); Rd.frame = f; hero.src = frames[f]; }
    const hr = 9 + 8 * clamp(Rd.dist / Rd.end, 0, 1), tc = DQ.townTint ? DQ.townTint(hr) : [255, 255, 255], key = tc.join(','); if (key !== Rd.tintKey) { Rd.tintKey = key; tint.style.backgroundColor = `rgb(${key})`; } };
  Rd.update = dt => { const sp = 28 * (R.holding || R.hurried ? 3 : 1); Rd.dist += sp * dt; Rd.place();
    const x = Rd.fxx, s = Rd.season; x.clearRect(0, 0, RD.w, RD.h); if (s === 'summer') return;
    const col = s === 'autumn' ? ['#d8782a', '#c8482a', '#e8b040'] : s === 'winter' ? ['#f4f8fc', '#ffffff', '#e8eef6'] : ['#f4c4d0', '#ffffff', '#f8dce4'];
    Rd.leaves.forEach((l, i) => { l.y += l.s * dt * (s === 'winter' ? .8 : 1); l.x += (Math.sin(R.clock * 1.2 + l.p) * 8 - sp * .6) * dt; if (l.y > RD.h) { l.y = -2; l.x = Math.random() * RD.w; } if (l.x < -4) l.x += RD.w + 8;
      x.fillStyle = col[i % 3]; x.fillRect(Math.round(l.x), Math.round(l.y), s === 'winter' ? 1 : 2, 1); }); };
  Rd.remove = () => { R.shots.delete(Rd); dropShot(shot); };
  R.shots.add(Rd); Rd.layout(); return Rd;
}

/* ---------- the beats ---------- */
const BEATS = [
  { id: 'noon', len: 12.5, enter() { R.hour = 12; R.weather = 'clear'; DQ.musicMode && DQ.musicMode('game'); DQ.musicDim && DQ.musicDim(1);
      const sc = pastScene(); if (!sc) return; const s = site0(); R.town = townShot({ url: sc.url, meta: sc.meta, share: 1, belfry: 'bell', cast: castOf(9), focus: [400, 214] }); R.town.want = { x: s.X + 16, y: s.Y + 30 }; },
    cues: [[.6, () => say(WORDS.bells), 1], [3.4, () => { R.ringAt = R.bt; inset('bell', 4); if (DQ.storyBell) DQ.storyBell('church', 3); if (R.town) { turnToBell(R.town); R.town.ring(); } }, 1],
      [4.2, () => say(WORDS.noon), 1], [5.8, () => R.town && R.town.ring()], [8.2, () => R.town && R.town.ring()],
      [9.4, () => { const T = R.town; if (!T) return; const w = T.people().filter(p => !p.hidden).sort((a, b) => Math.abs(a.x - T.cam.x + 40) - Math.abs(b.x - T.cam.x + 40))[0]; if (w) bubble(WORDS.noonSay, () => T.screen(w.x + 2.5, w.y - 15), 2.8); }]],
    update(dt) { if (R.ringAt == null) return; const e = R.bt - R.ringAt, amp = 26 * clamp(1 - (e - 4.8) / 2.6, 0, 1), deg = amp * Math.cos(Math.PI * e / 2.4); inset('bell', swingIndex(deg));
      if (R.town) R.town.nudge = Math.round(deg / 18); } },
  { id: 'night', len: 14, enter() { DQ.musicMode && DQ.musicMode('title'); DQ.musicDim && DQ.musicDim(.6); insetOff(); R.ringAt = null; if (R.town) R.town.nudge = 0; if (R.still) { R.hour = 22; R.town && R.town.relight(); } },
    cues: [[.4, () => say(WORDS.work), 1], [.6, () => { if (R.town) { for (const w of R.town.people()) leave(w, null, 24); R.town.drawProps(true); } }],
      [4.4, () => { say(WORDS.missing); const T = R.town; if (!T || !T.walk) return; const s = site0(); R.thief = { x: 660, y: 244, dir: -1, pace: 30, walked: 0, rest: 0, script: true, thief: true, goal: s.X + 14, hold: 1e9, face: 0,
        look: { skin: '#2a2230', hair: '#100c14', hs: 'short', cloth: '#120e16', hat: ['hood', '#1a1622'], glow: '#f0d060' } }; T.walk.L.walkers.push(R.thief); }, 1],
      [6.8, () => { const T = R.town; if (!T) return; T.belfry = 'rope'; T.drawProps(true); const th = R.thief; if (th) { th.x = th.goal != null ? th.goal : th.x; th.goal = null; th.carry = 'bell'; th.rest = 0; th.leave = true; th.dir = 1; th.pace = 30; } }],
      [8.8, () => { R.dawnAt = R.bt; }], [10.4, () => { inset('rope', 2, 'dawn'); say(WORDS.rope); if (R.still) { R.hour = 6.5; R.town && R.town.relight(); } }, 1]],
    update() { R.hour = R.dawnAt != null ? 22 + 8.5 * smooth((R.bt - R.dawnAt) / 2.2) : 12 + 10 * smooth(R.bt / 4);
      if (R.inset && R.inset.classList.contains('on')) inset('rope', clamp(Math.round(2 + 2 * Math.sin(R.clock * 2.1)), 0, 4), 'dawn'); } },
  { id: 'empty', len: 11.5, enter() { DQ.musicDim && DQ.musicDim(.45); R.dawnAt = null; R.hour = R.still ? 9 : 6.5; if (R.still && R.town) R.town.relight();
      if (R.town && R.town.walk) { const cast = castOf(6, TOWN + ':after'); R.town.walk.L.walkers = cast; } },
    cues: [[.4, () => { insetOff(); say(WORDS.traders); }, 1], [1.4, () => leave(R.town && R.town.people()[0], 'bundle')],
      [2.8, () => { const T = R.town; if (!T) return; const w = T.people()[1]; if (!w) return; leave(w, 'pan', 12); T.want = { x: w.x, y: w.y - 20 }; bubble(WORDS.pans, () => T.screen(w.x + 2.5, w.y - 16), 3.4); }],
      [5, () => leave(R.town && R.town.people()[2], 'bundle')], [5.9, () => { const sc = ruinScene(); if (sc && R.town) R.town.swap(sc, () => { if (R.still) R.hour = 15; R.town.relight(); }); }],
      [6.8, () => say(WORDS.left), 1], [7.6, () => leave(R.town && R.town.people()[3], 'pan')], [8.8, () => leave(R.town && R.town.people()[4], 'bundle')]],
    update() { R.hour = 6.5 + R.bt / 3.4 * 24; R.weather = R.bt > 3.4 && R.bt < 6.6 ? 'rain' : 'clear'; } },
  { id: 'lodging', len: 9.5, enter() { DQ.musicDim && DQ.musicDim(.75); R.weather = 'clear'; if (R.town) { R.town.remove(); R.town = null; } insetOff(); say(null); R.room = roomShot(); },
    cues: [[.5, () => say(WORDS.far, 'top'), 1], [1.6, () => { const P = DQ.personality; if (P && !R.still) { const now = performance.now(); P.force = 'yawn'; P.idleSince = Math.min(P.idleSince, now - P.IDLE_MS - 1); P.nextFidget = 0; P.tick && P.tick(); } }],
      [3.6, () => { DQ.storyKnock && DQ.storyKnock(); const P = R.room; bubble(WORDS.knock, () => [P.tx + 14 * P.k, P.ty + (P.H0.oy + 150) * P.k], 2); }, 1],
      [4.6, () => { R.envFrom = R.bt; if (R.still && R.room) { R.room.envAt = 1; R.room.placeEnv(); } }],
      [6.2, () => { R.room.envAt = 1; R.room.placeEnv(); openPrompt(); }, 1]],
    update(dt) { if (R.room) { R.room.update(dt); if (R.envFrom != null && R.room.envAt !== 1) { R.room.envAt = clamp((R.bt - R.envFrom) / 1.3, 0, 1); R.room.placeEnv(); } } },
    leave() { R.envFrom = null; if (R.prompt) { R.prompt.remove(); R.prompt = null; } } },
  { id: 'letter', len: 16, enter() { say(null); if (R.room) { R.room.envAt = null; R.room.placeEnv(); } openLetter(); },
    cues: [[.8, () => crackSeal()], [1.3, () => { if (R.paper) R.paper.classList.add('on'); DQ.sfx && DQ.sfx('page'); }], ...LETTER('').map((_, i) => [1.9 + i * 1.15, () => showLine(i), i === 0])],
    hurry() { const hidden = R.paper && R.paper.querySelector('.op-l:not(.on)'); if (hidden) { R.bt = Math.max(R.bt, 1.9 + (LETTER('').length - 1) * 1.15 + .01); return true; } R.next(); return true; },
    update(dt) { if (R.room) R.room.update(dt); },
    leave() { if (R.letterBox) { const b = R.letterBox; b.classList.add('off'); setTimeout(() => b.remove(), R.still ? 0 : 500); R.letterBox = R.paper = null; } if (R.room) { R.room.remove(); R.room = null; } } },
  { id: 'road', len: null, enter() { DQ.musicMode && DQ.musicMode('game'); DQ.musicDim && DQ.musicDim(.9); R.hurried = false; R.road = roadShot(); if (R.still) { R.road.dist = R.road.signX - R.road.hx - 34; R.road.place(); } },
    cues: [[.8, () => say(WORDS.knight, 'top'), 1], [1.6, () => R.road && R.road.hint.classList.add('on')], [7.4, () => say(WORDS.enough, 'top'), 1], [12.5, () => R.road && R.road.hint.classList.remove('on')], [13, () => { if (R.still) R.next(); }]],
    hurry() { R.hurried = true; return true; },
    update(dt) { const Rd = R.road; if (!Rd) return; Rd.update(dt); if (Rd.dist >= Rd.end) R.next(); },
    leave() { if (R.road) { R.road.remove(); R.road = null; } R.holding = R.hurried = false; } },
  { id: 'home', len: null, enter() { DQ.musicDim && DQ.musicDim(1); R.hour = 18.3; R.weather = 'clear'; R.met = null; R.talked = false;
      const sc = nowScene(), wren = folk('Elder Wren'), cast = castOf(3, TOWN + ':now');
      R.hero = { x: -10, y: 244, dir: 1, pace: 42, walked: 0, rest: 0, script: true, goal: 306, hold: 1e9, face: 1, look: heroChibi(), arrive: () => meet() };
      R.wren = { x: 334, y: 244, dir: -1, pace: 0, walked: 0, rest: 1e9, face: -1, script: true, look: (DQ.townGiverLook && DQ.townGiverLook(wren)) || { skin: '#e8b98e', hair: '#c8c4bc', hs: 'long', cloth: '#5a7a4a' } };
      R.town = townShot({ url: sc.url, meta: sc.meta, belfry: 'rope', close: true, anchorY: .36, cast: cast.concat([R.wren, R.hero]), focus: [R.still ? 320 : 120, 244] }); say(WORDS.home); if (R.still) setTimeout(() => meet(), 1200); },
    cues: [[9, () => { if (R.met == null && R.hero) { R.hero.x = 306; R.hero.goal = null; R.hero.rest = 1e9; meet(); } }]],
    hurry() { if (R.met == null && R.hero) { R.hero.x = 306; R.hero.goal = null; R.hero.rest = 1e9; R.hero.face = 1; meet(); } return true; },
    update(dt) { const T = R.town; if (!T) return; if (R.hero) T.want = { x: R.met != null ? 320 : clamp(R.hero.x + 70, 0, 320), y: 244 }; T.update(dt); /* the camera walks in with the hero, then settles on the two of them */
      if (R.wren && R.hero && R.met == null) R.wren.pose = R.hero.x > 200 && Math.floor(R.clock * 2.5) % 2 ? 'cheer' : null; },
    leave() { if (R.wren) R.wren.pose = null; } },
  { id: 'title', len: null, enter() { R.wait = true; say(null); const old = R.town, sc = nowScene(); R.town = townShot({ url: sc.url, meta: sc.meta, belfry: 'rope', wide: true, cast: old ? old.people() : [], focus: [320, 230] }); R.town.want = { x: 320, y: 150 }; if (old) old.remove(); showTitle(); },
    cues: [], hurry() { return true; }, update(dt) { if (R.town) R.town.update(dt * .35); } }
];
BEATS.forEach(b => { b.cues = b.cues || []; });

/* the lodging's letter: a button by the envelope, and the letter itself */
const openPrompt = () => { if (R.prompt || !R.room) return; const b = el('button', 'btn primary op-open'), [x, y] = R.room.envScreen();
  b.type = 'button'; b.dataset.op = 'open'; b.innerHTML = `${DQ.ico ? DQ.ico('quest') : ''}<span>Open Wren’s letter</span>`; R.el.appendChild(b); b.style.left = Math.round(clamp(x, 170, R.box.w - 170)) + 'px'; b.style.top = Math.round(clamp(y - 72, 60, R.box.h - 80)) + 'px';
  R.prompt = b; if (R.still) b.classList.add('on'); else requestAnimationFrame(() => b.classList.add('on')); };
const openLetter = () => { const name = (S().name || 'friend').trim() || 'friend', w = folk('Elder Wren'), box = el('div', 'op-letterbox'), kB = R.box.phone ? 4 : clamp(Math.floor(R.box.h / 180), 4, 6);
  const env = canvasEl(48, 46, 'op-bigenv'), draw = open => { const x = env.getContext('2d'); x.clearRect(0, 0, 48, 46); const a = A().openingEnvelope && A().openingEnvelope('big', open); if (a) x.drawImage(a, 0, open ? 0 : 14); };
  draw(false); size(env, 48 * kB, 46 * kB); R.drawEnv = draw;
  const halves = ['l', 'r'].map(s => { const c = canvasEl(7, 12, 'op-seal op-seal-' + s), a = A().openingSealHalf && A().openingSealHalf(s); if (a) c.getContext('2d').drawImage(a, 0, 0); size(c, 7 * kB, 12 * kB); c.style.left = `calc(50% + ${(s === 'l' ? 17 : 24) * kB - 24 * kB}px)`; c.style.top = `calc(50% + ${(14 + 9) * kB - 23 * kB}px)`; return c; });
  const paper = el('div', 'letter-paper op-letter', `<div class="letter-head">${DQ.folkPortrait ? DQ.folkPortrait('Elder Wren', 64, 'letter-face') : ''}<span><b>${esc(w ? w.n : 'Elder Wren')}</b><small>${esc(w ? w.role : 'Village elder')} · ${esc(D.TOWN[TOWN] ? D.TOWN[TOWN].name : 'Willowbrook')}</small></span></div>`
    + LETTER(name).map(([cls, t], i) => `<p class="op-l ${cls ? 'letter-' + cls : ''}" data-i="${i}">${esc(t)}</p>`).join(''));
  paper.setAttribute('role', 'document'); paper.setAttribute('aria-label', 'Wren’s letter');
  box.append(env, ...halves, paper); R.el.appendChild(box); R.letterBox = box; R.paper = paper; R.envCv = env;
  if (R.still) { box.classList.add('cracked', 'on'); draw(true); paper.classList.add('on'); paper.querySelectorAll('.op-l').forEach(p => p.classList.add('on')); }
  else requestAnimationFrame(() => box.classList.add('on')); };
const crackSeal = () => { if (!R.letterBox || R.still) return; DQ.sfx && DQ.sfx('seal'); R.letterBox.classList.add('cracked'); setTimeout(() => R.drawEnv && R.drawEnv(true), 140); };
const showLine = i => { const p = R.paper && R.paper.querySelector(`.op-l[data-i="${i}"]`); if (p) p.classList.add('on'); };

/* home: they meet at the well, and talk */
const meet = () => { if (!R || R.met != null) return; R.met = R.clock; if (R.hero) { R.hero.face = 1; R.hero.rest = 1e9; } if (R.wren) { R.wren.pose = null; R.wren.face = -1; } };
const talk = () => { if (R.talked) return; R.talked = true; R.wait = true; say(null);
  const ok = DQ.openStory && DQ.openStory('opening_home', { cls: 'op-talk', onDone: () => { if (R && !R.ended && R.beat && R.beat.id === 'home') R.next(); }, auto: { word: 220, decide: 9000 } });
  if (!ok) { R.wait = false; R.next(); } };

/* the title moment */
const showTitle = () => { const t = el('div', 'op-title', `<div class="op-titlecard"><div class="logo">${DQ.ico ? DQ.ico('candle') : ''}<h1>Idlewick</h1></div><p class="op-tag">Mend the towns, find the missing bells, put the kettle on.</p>
  <div class="op-goal"><p>${esc(WORDS.goal)}</p><p>${esc(WORDS.word)}</p></div><button class="tbtn primary" type="button" data-op="begin"><span>Begin</span></button></div>`);
  const ic = t.querySelector('.logo .ic'), icn = R.box.phone ? 48 : 64; if (ic) for (const p of ['width', 'height']) ic.style.setProperty(p, icn + 'px', 'important'); /* the candle at a whole multiple of its 16 px drawing */
  R.el.appendChild(t); R.titleEl = t; R.said.push(WORDS.goal, WORDS.word); if (R.still) t.classList.add('on'); else requestAnimationFrame(() => t.classList.add('on'));
  setTimeout(() => { const b = t.querySelector('[data-op="begin"]'); if (b && R && !R.ended) b.focus({ preventScroll: true }); }, R.still ? 0 : 900); };

/* ---------- playing it ---------- */
const measure = () => { if (!R) return; R.box = { w: R.el.clientWidth || 1280, h: R.el.clientHeight || 720, phone: innerWidth <= 860 }; };
DQ.playIntro = (opts = {}) => {
  if (document.getElementById('intro')) return;
  const box = el('div'); box.id = 'intro'; box.setAttribute('role', 'dialog'); box.setAttribute('aria-modal', 'true'); box.setAttribute('aria-label', 'The story so far');
  box.innerHTML = `<div class="op-stage"></div><div class="op-say empty" aria-live="polite"></div><button class="btn sm op-skip" type="button" data-op="skip" hidden>Skip ›</button>`;
  document.body.appendChild(box);
  R = { el: box, stage: box.querySelector('.op-stage'), sayEl: box.querySelector('.op-say'), skip: box.querySelector('.op-skip'), still: calm(), bi: -1, bt: 0, clock: 0, wait: false, beat: null, fired: new Set(), shots: new Set(), bubbles: [], said: [], reached: [], hour: 12, weather: 'clear', touched: false, holding: false, hurried: false, ended: false, opts };
  if (R.still) box.classList.add('op-still');
  measure();
  /* the beats in order; a beat with no length waits for its own end (the road's last step, the conversation, Begin) */
  R.next = () => { if (R.ended) return; const prev = R.beat; if (prev && prev.leave) prev.leave(); R.bi++; R.bt = 0; R.wait = false; R.fired = new Set(); const b = BEATS[R.bi]; R.beat = b || null; if (!b) return finish(); R.reached.push(b.id); b.enter(); };
  const step = dt => { if (!R || R.ended) return false; R.clock += dt; const b = R.beat; if (!b) return;
    if (!R.wait) R.bt += dt;
    for (let i = 0; i < b.cues.length; i++) { if (R.fired.has(i) || R.bt < b.cues[i][0]) continue; R.fired.add(i); try { b.cues[i][1](); } catch (e) { console.error('opening', e); } if (R.beat !== b || R.ended) return; }
    if (!R.still) { try { if (b.update) b.update(dt); else for (const s of R.shots) if (s.update) s.update(dt); if (b.id !== 'home' && b.id !== 'title' && R.town && b.update) R.town.update(dt); } catch (e) { console.error('opening', e); } }
    bubblesTick();
    if (b.id === 'home' && R.met != null && !R.talked && R.clock - R.met > .7) talk(); /* still or moving: they talk once they have met */
    if (R.beat === b && !R.wait && b.len != null && R.bt >= b.len) R.next(); };
  R.frameFn = dt => step(dt);
  /* a click, Space or Enter hurries the beat: on to its next line, or to the next beat */
  R.hurry = () => { const b = R.beat; if (!b || R.ended) return; if (b.hurry && b.hurry()) return;
    const ahead = b.cues.map((c, i) => [c[0], i, c[2]]).filter(([t, i, mark]) => mark && !R.fired.has(i) && t > R.bt).sort((a, z) => a[0] - z[0])[0];
    if (ahead && (b.len == null || ahead[0] < b.len)) R.bt = ahead[0]; else if (!R.wait) R.next(); };
  const touch = () => { if (R.touched) return; R.touched = true; R.skip.hidden = false; requestAnimationFrame(() => R.skip.classList.add('on')); if (DQ.audioInit) DQ.audioInit(); };
  const finish = () => { if (!R || R.ended) return; const r = R; r.ended = true;
    if (DQ.storyActive && DQ.storyActive() && DQ.storyActive().id === 'opening_home') DQ.closeModal();
    S().seen = S().seen || {}; S().seen.intro = 1; if (DQ.save) DQ.save();
    DQ.musicMode && DQ.musicMode('game'); DQ.musicDim && DQ.musicDim(1);
    document.removeEventListener('keydown', onKey, true); document.removeEventListener('keyup', onKeyUp, true); removeEventListener('resize', onResize);
    for (const s of [...r.shots]) s.remove && s.remove(); r.bubbles.forEach(B => B.b.remove());
    box.classList.add('out'); setTimeout(() => { box.remove(); if (R === r) R = null; if (opts.onDone) opts.onDone(); }, r.still ? 0 : 700); };
  R.finish = finish;
  box.addEventListener('pointerdown', e => { if (e.target.closest('button')) return; touch(); if (R.beat && R.beat.id === 'road') { R.holding = true; R.pressAt = performance.now(); } });
  const lift = () => { if (!R) return; if (R.holding && R.beat && R.beat.id === 'road' && performance.now() - (R.pressAt || 0) < 260) R.hurried = true; R.holding = false; };
  box.addEventListener('pointerup', lift); box.addEventListener('pointercancel', () => { if (R) R.holding = false; });
  box.addEventListener('click', e => { const b = e.target.closest('[data-op]');
    if (b && b.dataset.op === 'skip') return finish();
    if (b && b.dataset.op === 'begin') { DQ.sfx && DQ.sfx('click'); return finish(); }
    if (b && b.dataset.op === 'open') { touch(); if (R.beat && R.beat.id === 'lodging') R.next(); return; }
    touch(); if (R.beat && R.beat.id !== 'road' && R.beat.id !== 'title') R.hurry(); });
  const onKey = e => { if (!R || R.ended || !document.getElementById('intro')) return;
    if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); return finish(); }
    if (DQ.storyActive && DQ.storyActive()) return; /* the conversation screen owns its keys */
    const go = e.key === ' ' || e.key === 'Enter' || e.key === 'ArrowRight'; if (!go) return;
    if (e.target && e.target.closest && e.target.closest('#intro button')) { touch(); return; } /* a focused button presses itself */
    e.preventDefault(); e.stopPropagation(); touch();
    if (R.beat && R.beat.id === 'title') return finish();
    if (R.beat && R.beat.id === 'road') { if (!e.repeat) R.pressAt = performance.now(); R.holding = true; return; }
    if (!e.repeat) R.hurry(); };
  const onKeyUp = e => { if (!R || !(e.key === ' ' || e.key === 'Enter' || e.key === 'ArrowRight')) return; lift(); };
  const onResize = () => { measure(); for (const s of R.shots) s.layout && s.layout(); if (R.inset && R.inset.classList.contains('on')) { const key = R.inset.dataset.key; delete R.inset.dataset.key; const m = /^(bell|rope)(\d)(\w+)$/.exec(key || ''); if (m) inset(m[1], +m[2], m[3]); } };
  document.addEventListener('keydown', onKey, true); document.addEventListener('keyup', onKeyUp, true); addEventListener('resize', onResize);
  /* draw the pictures it needs ahead of time, a few at once, so no beat waits on a painter */
  setTimeout(() => { try { pastScene(); ruinScene(); if (A().openingRoad) A().openingRoad(TOWN, DQ.season ? DQ.season() : 'autumn'); } catch (e) { console.error('opening', e); } }, 0);
  R.next(); DQ.frame.add(R.frameFn);
};
/* for tests and the screenshots: where the opening is, what it has said, and a way to jump ahead */
DQ.introState = () => R ? { beat: R.beat && R.beat.id, reached: R.reached.slice(), bt: Math.round(R.bt * 100) / 100, wait: R.wait, still: R.still, touched: R.touched, skip: !R.skip.hidden, said: R.said.slice(), hour: R.hour, weather: R.weather, dist: R.road ? Math.round(R.road.dist) : null, talk: !!(DQ.storyActive && DQ.storyActive()) } : null;
DQ.introJump = (id, at = 0) => { if (!R) return false; let n = 0; while (R && !R.ended && R.beat && R.beat.id !== id && n++ < 12) R.next(); if (R && R.beat && R.beat.id === id) { R.bt = at; return true; } return false; };
DQ.INTRO_BEATS = BEATS.map(b => b.id);

/* a new hero sees it once; automated browsers skip it unless a test asks (localStorage idlewick.intro = 1) */
DQ.introWanted = () => {
  if (DQ.introSeen() || (S().settings && S().settings.storyScenes === false)) return false;
  let forced = false; try { forced = localStorage.getItem('idlewick.intro') === '1'; } catch (e) {}
  return forced || !navigator.webdriver;
};

/* replay from the Journal */
if (UI && UI.V && UI.V.journal) {
  const j0 = UI.V.journal;
  UI.V.journal = (...a) => `<div class="in-replay"><button class="btn sm" data-do="introreplay">${DQ.ico('candle')} Watch the opening again</button></div>` + j0(...a);
  UI.DO.introreplay = () => DQ.playIntro();
}
})();
