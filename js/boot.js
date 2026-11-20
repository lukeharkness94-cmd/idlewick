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

function create() {
  const look = { skin: D.LOOKS.skin[0], hair: D.LOOKS.hair[1], tunic: D.LOOKS.tunic[0], face: 'bright' }, keep = DQ.S.settings;
  const previous = DQ.S;
  let starter='sword';
  DQ.S = DQ.newState('', look); DQ.S.settings = keep; DQ.S.journal = [{ t: Date.now(), kind: 'begin', icon: 'candle', town: 'willowbrook', text: 'You come home to Willowbrook with an empty pack and Wren’s letter in your pocket.' }]; DQ.applyTheme();
  /* faces: three distinct pixel designs, shown as small portraits */
  const faceRow = () => DQ.HERO_FACES && DQ.pixelArt ? `<div><span class="k">Face</span><div class="sws faces">${DQ.HERO_FACES.map(f => `<button class="swatch face-swatch ${look.face === f ? 'on' : ''}" data-k="face" data-c="${f}" aria-label="Face: ${f}"><img class="pxa" src="${DQ.heroBustUrl(Object.assign({}, look, { face: f }))}" width="32" height="32" alt=""></button>`).join('')}</div></div>` : '';
  const preview=()=>`<img src="${DQ.heroFigureUrl(look)}" width="96" height="128" alt="Your hero with a ${D.STARTER_KITS[starter].label.toLowerCase()}">`;
  const sw = (k) => D.LOOKS[k].map((c, i) => `<button class="swatch ${look[k] === c ? 'on' : ''}" data-k="${k}" data-c="${c}" style="background:${c}" aria-label="${k} ${i + 1}"></button>`).join('');
  $('#tmenu').innerHTML = `<div class="create"><div class="cr-port" id="crp">${preview()}</div><div class="cr-form"><label><span class="k">Hero name</span><input id="crname" maxlength="20" placeholder="Adventurer" autocomplete="off"></label>
    <div><span class="k">Skin</span><div class="sws">${sw('skin')}</div></div><div><span class="k">Hair</span><div class="sws">${sw('hair')}</div></div><div><span class="k">Tunic</span><div class="sws">${sw('tunic')}</div></div>${faceRow()}</div><fieldset class="cr-weapons"><legend>Starting weapon</legend><div class="cr-kit-options">${Object.entries(D.STARTER_KITS).map(([id,k])=>`<button type="button" class="btn ${id==='sword'?'on':''}" data-kit="${id}" aria-pressed="${id==='sword'}">${DQ.itemIco(D.ITEMS[k.weapon])}<b>${k.label}</b><small>${k.hint}</small></button>`).join('')}</div><p>You can change weapons anytime. Other starter weapons and supplies are sold in the shop.</p></fieldset>
    <div class="cr-act"><button class="tbtn" id="cr-back"><span>Back</span></button><button class="tbtn primary" id="cr-go"><span>Begin adventure</span></button></div></div>`;
  $('#crname').focus();
  $('#tmenu').onclick = e => { const kit=e.target.closest('[data-kit]');if(kit){starter=kit.dataset.kit;DQ.S.equip.weapon=D.STARTER_KITS[starter].weapon;$$('[data-kit]').forEach(x=>{x.classList.toggle('on',x===kit);x.setAttribute('aria-pressed',x===kit);});$('#crp').innerHTML=`<img src="${DQ.heroFigureUrl(look)}" width="96" height="128" alt="Your hero with a ${D.STARTER_KITS[starter].label.toLowerCase()}">`;return;}const b = e.target.closest('.swatch'); if (!b) return; look[b.dataset.k] = b.dataset.c; DQ.S.look = look; DQ.sfx('click'); $$(`.swatch[data-k="${b.dataset.k}"]`).forEach(x => x.classList.toggle('on', x === b)); $('#crp').innerHTML = preview(); };
  $('#cr-back').onclick = () => { DQ.sfx('click'); DQ.S = previous; showTitle(); };
  const commit = () => { const draft = DQ.S, chosen=DQ.newState('',look,starter);draft.equip=chosen.equip;draft.ammo=chosen.ammo;draft.inv=chosen.inv; DQ.S = previous; if (DQ.hasSave() && DQ.backup && !DQ.backup('before new hero')) { DQ.S = draft; DQ.toast('Could not back up your existing hero. Download a backup first.', true); return; } DQ.S = draft; DQ.S.name = $('#crname').value.trim().slice(0, 20) || 'Adventurer'; DQ.S.look = look; if (DQ.save()) start(true); else DQ.toast(DQ.saveHealth, true); };
  const begin = () => DQ.hasSave() ? DQ.modal({ title: 'Begin a new hero?', body: '<p>Your existing hero will be kept in automatic backups. Your new adventure replaces the active save.</p>', actions: [{ label: 'Begin new hero', primary: true, fn: commit }, { label: 'Keep existing hero' }] }) : commit();
  $('#cr-go').onclick = begin; $('#crname').addEventListener('keydown', e => { if (e.key === 'Enter') begin(); });
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
