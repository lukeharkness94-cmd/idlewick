/* Idlewick: title screen, character creation and startup. */
(() => {
const DQ = window.DQ, D = DQ.data, { $, $$, ico, esc } = DQ;
DQ.started = false;

function fireflies(cv) {
  const tint = document.documentElement.dataset.theme === 'dark' ? '243,213,138' : '255,236,190';
  const cx = cv.getContext('2d'); let w, h; const fit = () => { w = cv.width = innerWidth; h = cv.height = innerHeight; }; fit(); addEventListener('resize', fit);
  const fl = Array.from({ length: 46 }, () => ({ x: Math.random(), y: Math.random(), r: .6 + Math.random() * 1.8, p: Math.random() * 6, s: .02 + Math.random() * .05 }));
  let lastFrame=performance.now();
  const loop = t => {
    if (!cv.isConnected) return;
    const frames=Math.max(0,Math.min(3,(t-lastFrame)/(1000/60)));lastFrame=t; cx.clearRect(0, 0, w, h);
    for (const f of fl) { f.x += Math.sin(t / 2400 + f.p) * .0004 * frames; f.y -= f.s * .0006 * frames; if (f.y < -.02) { f.y = 1.02; f.x = Math.random(); } const a = .35 + .65 * Math.abs(Math.sin(t / 900 + f.p)); cx.fillStyle = `rgba(${tint},${a * .85})`; cx.beginPath(); cx.arc(f.x * w, f.y * h, f.r, 0, 6.3); cx.fill(); cx.fillStyle = `rgba(${tint},${a * .12})`; cx.beginPath(); cx.arc(f.x * w, f.y * h, f.r * 6, 0, 6.3); cx.fill(); }
    requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);
}

/* The title (20 Nov 2026 redo): it follows the player's theme like the rest of the game. Behind a parchment card,
   the hero's current town (a new hero's Willowbrook, half-mended or not) at the smallest whole-number scale that
   covers the window, cropped from the middle and never stretched; dusk under the dark theme. */
const titleTown = () => { const t = DQ.S && DQ.S.town; return t && D.TOWN && D.TOWN[t] ? t : 'willowbrook'; };
function sceneFit() {
  const box = $('#title .title-scene'), img = box && box.querySelector('img'); if (!img) return;
  const w = box.clientWidth || innerWidth, h = box.clientHeight || innerHeight, k = Math.max(1, Math.ceil(Math.max(w / 640, h / 360)));
  Object.assign(img.style, { width: 640 * k + 'px', height: 360 * k + 'px', left: Math.round((w - 640 * k) / 2) + 'px', top: Math.round((h - 360 * k) / 2) + 'px' });
}
function titleHtml(has) {
  const S = DQ.S, url = DQ.sceneUrl ? DQ.sceneUrl(titleTown()) : '';
  return `<div class="title-scene" aria-hidden="true">${url ? `<img class="pxa" src="${url}" alt="" draggable="false">` : ''}</div><div class="title-wash"></div><canvas id="tcv"></canvas>
    <div class="title-in"><div class="title-card"><div class="logo">${ico('candle')}<h1>Idlewick</h1><p>A cosy idle adventure. Mend the towns, find the missing bells, put the kettle on.</p></div>
    ${DQ.saveHealth ? `<p role="alert">${esc(DQ.saveHealth)}</p>` : ''}<div class="tmenu" id="tmenu">${has ? `<button class="tbtn primary" id="t-cont"><span>Continue</span><small>${esc(S.name)} · Hero ${DQ.advLvl()} · ${DQ.fmtTime(S.playtime)} played</small>${(() => { let a = ''; try { a = S.act ? DQ.actLabel(S.act) : ''; } catch (e) { a = ''; } const t = D.TOWN[S.town] ? D.TOWN[S.town].name : ''; return `<small class="t-last">${a ? `Last time: ${esc(a.charAt(0).toLowerCase() + a.slice(1))} in ${esc(t)}` : `Resting in ${esc(t)}`}</small>`; })()}</button>` : ''}<button class="tbtn ${has ? '' : 'primary'}" id="t-new"><span>New game</span></button></div></div></div>
    <button class="iconb tmute" id="t-mute" aria-label="Mute">${ico('sound')}</button><small class="ver">Version 0.4 · Close the game any time: your hero keeps working while you are away</small>`;
}

addEventListener('resize', () => { if (!$('#title').hidden) sceneFit(); });
function showTitle() {
  const has = DQ.load(), t = $('#title'); DQ.applyTheme(); t.hidden = false; t.innerHTML = titleHtml(has); sceneFit(); fireflies($('#tcv'));
  const go = () => { DQ.audioInit(); DQ.musicMode('title'); DQ.musicStart(); };
  $('#t-mute').onclick = () => { go(); DQ.setMuted(!DQ.S.settings.muted); $('#t-mute').innerHTML = ico(DQ.S.settings.muted ? 'mute' : 'sound'); };
  if (has) { $('#t-cont').onclick = () => { go(); start(false); }; $('#t-cont').focus(); }
  $('#t-new').onclick = () => { go(); DQ.sfx('click'); create(); };
  if (!has) $('#t-new').focus({ preventScroll: true, focusVisible: false });
}

/* Hero creation (20 Nov 2026, the owner's chosen "road home" + "letter" concept): three short steps with the town
   drifting closer behind the card. 1 Who's coming home: name and look (Surprise me; Quick start begins at once).
   2 Write back to Wren: what you've been doing since you left picks the starting weapon, and the real starter pack
   is shown underneath. 3 Wren at the gate greets you by name and weapon, then the opening story plays.
   #cr-go always means "begin now" (Quick start on step 1, Begin on step 3); no class lock, the kits are unchanged. */
const BACKSTORY = {
  sword: { title: 'Guarding turnips', text: 'at a warehouse in Ironpeak. Not one went missing.', bring: 'sword', greet: n => `${n}! Look at you. Is that a sword? Good. The goblins have been very rude about the well.`, pack: 'a bronze sword' },
  bow: { title: 'Shooting pigeons', text: 'off the mill roof, a penny each. The miller still owes me.', bring: 'bow', greet: n => `${n}! You brought a bow. Lovely. Please don’t shoot the ducks, they’re Orrin’s.`, pack: 'a bow and 300 arrows' },
  staff: { title: 'Helping a wizard', text: 'who mostly did people’s taxes. I can do a spark. And sums.', bring: 'staff', greet: n => `${n}! A staff. Can it fix a well? No? Well. It’s a nice stick.`, pack: 'a staff and 300 runes' }
};
const NAMES = ['Tamsin', 'Hob', 'Bryn', 'Odo', 'Petra', 'Wil', 'Mags', 'Cuthbert', 'Nell', 'Alder', 'Rook', 'Fen', 'Ottilie', 'Barnaby'];
function create() {
  const look = { skin: D.LOOKS.skin[0], hair: D.LOOKS.hair[1], tunic: D.LOOKS.tunic[0], face: 'bright' }, keep = DQ.S.settings;
  const previous = DQ.S, pick = list => list[Math.floor(Math.random() * list.length)];
  let starter = 'sword', step = 0, seen = 0, name = '';
  DQ.S = DQ.newState('', look); DQ.S.settings = keep; DQ.applyTheme();
  const heroName = () => name.trim().slice(0, 20) || 'Adventurer';
  const kit = () => D.STARTER_KITS[starter];
  const preview = () => { DQ.S.equip.weapon = kit().weapon; DQ.S.look = look; return `<img class="pxa" src="${DQ.heroFigureUrl(look)}" width="96" height="128" alt="Your hero with a ${kit().label.toLowerCase()}">`; };
  const sw = k => D.LOOKS[k].map((c, i) => `<button type="button" class="swatch ${look[k] === c ? 'on' : ''}" data-k="${k}" data-c="${c}" style="background:${c}" aria-label="${k} ${i + 1}" aria-pressed="${look[k] === c}"></button>`).join('');
  const faceRow = () => DQ.HERO_FACES && DQ.pixelArt ? `<div><span class="k">Face</span><div class="sws faces">${DQ.HERO_FACES.map(f => `<button type="button" class="swatch face-swatch ${look.face === f ? 'on' : ''}" data-k="face" data-c="${f}" aria-label="Face: ${f}" aria-pressed="${look.face === f}"><img class="pxa" src="${DQ.heroBustUrl(Object.assign({}, look, { face: f }))}" width="32" height="32" alt=""></button>`).join('')}</div></div>` : '';
  const item = (id, n, label, mark) => `<div class="cr-slot ${mark ? 'new' : ''}">${DQ.itemIco(D.ITEMS[id])}<span>${esc(label)}${n > 1 ? ` ×${n}` : ''}</span></div>`;
  const pack = () => { const k = kit(); return `<div class="cr-pack" aria-label="Your starting pack">${item(k.weapon, 1, D.ITEMS[k.weapon].name, 1)}${k.ammo ? item(k.ammo, k.quantity, 'Arrows', 1) : ''}${k.runes ? item('rune', k.runes, 'Runes', 1) : ''}${item('bread', 5, 'Bread')}<div class="cr-slot">${ico('coin')}<span>25 coins</span></div></div>`; };
  const steps = ['Who’s coming home', 'Write to Wren', 'Wren at the gate'];
  const bar = () => `<ol class="cr-steps">${steps.map((t, i) => `<li><button type="button" class="${i === step ? 'on' : ''} ${i < step ? 'done' : ''}" data-step="${i}" ${i > seen ? 'disabled' : ''} aria-current="${i === step ? 'step' : 'false'}"><b>${i + 1}</b><span>${t}</span></button></li>`).join('')}</ol>`;
  const wren = DQ.folkOf && (DQ.folkOf('Elder Wren') || DQ.folkOf('Wren'));
  const bodies = [
    () => `<label><span class="k">Hero name</span><input id="crname" maxlength="20" placeholder="Adventurer" autocomplete="off" value="${esc(name)}"></label>
      <div><span class="k">Skin</span><div class="sws">${sw('skin')}</div></div><div><span class="k">Hair</span><div class="sws">${sw('hair')}</div></div><div><span class="k">Tunic</span><div class="sws">${sw('tunic')}</div></div>${faceRow()}
      <div class="cr-row"><button type="button" class="tbtn" id="cr-dice"><span>Surprise me</span></button><button type="button" class="tbtn" id="cr-go"><span>Quick start</span></button></div>
      <div class="cr-act"><button type="button" class="tbtn" id="cr-back"><span>Back</span></button><button type="button" class="tbtn primary" id="cr-next"><span>Write to Wren</span></button></div>`,
    () => `<div class="cr-letter"><p class="date">On the road home, early spring</p><p>Dear Wren,</p><p>It’s <b class="blank">${esc(heroName())}</b>. Yes, I remember the well. I’ll be home by Thursday.</p><p>Since I left, I’ve been</p>
      <div class="cr-kit-options" role="group" aria-label="What you have been doing, which sets your starting weapon">${Object.entries(BACKSTORY).map(([id, b]) => `<button type="button" class="btn ${id === starter ? 'on' : ''}" data-kit="${id}" aria-pressed="${id === starter}">${DQ.itemIco(D.ITEMS[D.STARTER_KITS[id].weapon])}<b>${b.title}</b><small>${b.text}</small></button>`).join('')}</div>
      <p>so I’m bringing my <b class="blank">${BACKSTORY[starter].bring}</b>. Put the kettle on.</p></div>
      <div><span class="k">Your pack</span>${pack()}<p class="cr-note">${starter === 'staff' ? 'Spark is ready to cast; each cast uses a rune.' : starter === 'bow' ? 'Arrows are equipped. Any shop sells more.' : 'No ammunition needed.'} You can change weapon any time.</p></div>
      <div class="cr-act"><button type="button" class="tbtn" id="cr-prev"><span>Back</span></button><button type="button" class="tbtn primary" id="cr-next"><span>Walk to the gate</span></button></div>`,
    () => `<div class="cr-greet">${wren ? `<img class="pxa" src="${DQ.folkUrl(wren)}" width="96" height="96" alt="Wren">` : ''}<div><span class="k">Wren</span><p>“${esc(BACKSTORY[starter].greet(heroName()))}”</p><p class="cr-note">“Your old room’s made up. Mind the third stair.”</p></div></div>
      <div class="cr-act"><button type="button" class="tbtn" id="cr-prev"><span>Back</span></button><button type="button" class="tbtn primary" id="cr-go"><span>Begin</span></button></div>`
  ];
  const draw = () => {
    seen = Math.max(seen, step);
    $('#tmenu').innerHTML = `<div class="create cr-step-${step}">${bar()}<div class="cr-port" id="crp">${preview()}</div><div class="cr-form">${bodies[step]()}</div></div>`;
    const scene = $('#title .title-scene'); if (scene) scene.style.setProperty('--step', step);
    const focus = $('#crname') || $('#tmenu [data-kit].on') || $('#cr-go'); if (focus) focus.focus({ preventScroll: true });
  };
  const go = n => { const input = $('#crname'); if (input) name = input.value; step = Math.max(0, Math.min(2, n)); DQ.sfx('click'); draw(); };
  const commit = () => { const input = $('#crname'); if (input) name = input.value; const draft = DQ.S, chosen = DQ.newState('', look, starter); draft.equip = chosen.equip; draft.ammo = chosen.ammo; draft.inv = chosen.inv; DQ.S = previous; if (DQ.hasSave() && DQ.backup && !DQ.backup('before new hero')) { DQ.S = draft; DQ.toast('Could not back up your existing hero. Download a backup first.', true); return; } DQ.S = draft; DQ.S.name = heroName(); DQ.S.look = look; DQ.S.journal = [{ t: Date.now(), kind: 'begin', icon: 'candle', town: 'willowbrook', text: `You come home to Willowbrook with ${BACKSTORY[starter].pack}, five loaves and Wren’s letter in your pocket.` }]; if (DQ.save()) start(true); else DQ.toast(DQ.saveHealth, true); };
  const begin = () => DQ.hasSave() ? DQ.modal({ title: 'Begin a new hero?', body: '<p>Your existing hero will be kept in automatic backups. Your new adventure replaces the active save.</p>', actions: [{ label: 'Begin new hero', primary: true, fn: commit }, { label: 'Keep existing hero' }] }) : commit();
  $('#tmenu').onclick = e => {
    const t = e.target.closest('button'); if (!t) return;
    if (t.id === 'cr-go') return begin();
    if (t.id === 'cr-back') { DQ.sfx('click'); DQ.S = previous; return showTitle(); }
    if (t.id === 'cr-next') return go(step + 1);
    if (t.id === 'cr-prev') return go(step - 1);
    if (t.dataset.step) return go(+t.dataset.step);
    if (t.id === 'cr-dice') { for (const k of ['skin', 'hair', 'tunic']) look[k] = pick(D.LOOKS[k]); if (DQ.HERO_FACES) look.face = pick(DQ.HERO_FACES); name = pick(NAMES); starter = pick(Object.keys(D.STARTER_KITS)); DQ.sfx('click'); return draw(); }
    if (t.dataset.kit) { starter = t.dataset.kit; DQ.sfx('click'); return draw(); }
    if (t.dataset.k) { const input = $('#crname'); if (input) name = input.value; look[t.dataset.k] = t.dataset.c; DQ.sfx('click'); $$(`.swatch[data-k="${t.dataset.k}"]`).forEach(x => { x.classList.toggle('on', x === t); x.setAttribute('aria-pressed', x === t); }); $('#crp').innerHTML = preview(); if (t.dataset.k !== 'face') $$('.face-swatch img').forEach((im, i) => { im.src = DQ.heroBustUrl(Object.assign({}, look, { face: DQ.HERO_FACES[i] })); }); }
  };
  $('#tmenu').onkeydown = e => { if (e.key === 'Enter' && e.target.id === 'crname') { e.preventDefault(); go(1); } };
  draw();
}

function start(isNew) {
  const S = DQ.S, away = Date.now() - S.lastSeen;
  DQ.firstRun = isNew; DQ.started = true; if (DQ.applyScale) DQ.applyScale(); if (DQ.applyLettering) DQ.applyLettering();
  $('#title').classList.add('out'); setTimeout(() => { $('#title').hidden = true; $('#title').classList.remove('out'); $('#title').innerHTML = ''; }, 600);
  $('#app').hidden = false; DQ.musicMode(DQ.act?.kind === 'fight' ? 'combat' : S.town); DQ.musicStart(); DQ.audioApply();
  D.SKILLS.forEach(s => { if (DQ.skillUnlocked(s.id)) S.unlocked[s.id] = true; });
  DQ.resumeAfterLoad(); DQ.ui.init();
  const h = location.hash.slice(1); if (h && (DQ.ui.V[h] || D.SK[h]) && !isNew) { DQ.ui.view = h; DQ.ui.render(true); }
  if (!isNew && away > 30000) { const eff = DQ.offlineEff(away); DQ.noteAway(away, eff); const sum = DQ.simulate(eff, Math.min(away, DQ.OFFLINE_CAP)); DQ.makeAwayEvents(sum, away); DQ.emit('welcome', sum, away); }
  S.tele = S.tele || { adv: {}, skill: {}, first: {}, away: [], sessions: 0 }; S.tele.sessions++; DQ.sessMs = 0; DQ.sessStart = Date.now();
  DQ.startLoop(); DQ.checkAch();
  if (isNew) {
    DQ.log(`Welcome to Willowbrook, ${S.name}. Start by catching some shrimp.`);
    setTimeout(() => { DQ.firstRun = false; }, 900);
    setTimeout(() => { const q = D.QUESTS.filter(x => DQ.questState(x) === 'new'); q.forEach(x => S.seen['q:' + x.id] = 1); }, 100);
  } else DQ.firstRun = false;
  DQ.save();
  /* a new hero hears why they are here (js/intro.js) */
  if (isNew && DQ.playIntro && DQ.introWanted && DQ.introWanted()) DQ.playIntro();
}

function ready() { DQ.injectSprite(); DQ.pixelInit(); DQ.fxInit(); showTitle(); }
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', ready); else ready();
})();
