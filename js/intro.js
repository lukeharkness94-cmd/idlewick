/* Idlewick: the opening (Nov 2026). A full-screen story for a new hero, played once after the character is made:
   why the towns are quiet (the noon bells went missing), who you are (someone Wren wrote to), and what you do
   (mend one town, and the road to the next opens). Built from the game's own pixel art at whole-number scales.
   It moves on by itself; a click or key hurries it along, and only after that first click does Skip appear.
   Reduced motion keeps the words and drops the pans. Replay from Home > Journal. Recorded in S.seen.intro. */
(() => {
const DQ = window.DQ, D = DQ.data, UI = DQ.ui, S = () => DQ.S, esc = DQ.esc;
const calm = () => document.documentElement.classList.contains('calm') || (S() && S().settings && S().settings.reduceFx) || matchMedia('(prefers-reduced-motion: reduce)').matches;

/* the script: one entry per shot; each line is shown in turn */
const SCRIPT = name => [
  { shot: 'town', town: 'willowbrook', bell: true, lines: [
    'Every town on the old road had a bell.',
    'It rang once, at noon. The market opened, the kettles went on, and somebody always wandered over to the well to complain about the weather.'] },
  { shot: 'town', town: 'mossbarrow', lines: [
    'Nobody thought much about the bells. You don’t, with things that work. Ask anyone over fifty about their knees.'] },
  { shot: 'dark', town: 'saltmere', lines: [
    'Then the bells started to go missing. A town would have its bell at supper, and by breakfast there would just be a rope, swinging a bit guiltily.',
    'Nobody saw who took them. Several people saw nothing, very carefully.'] },
  { shot: 'dark', town: 'willowbrook', lines: [
    'Without the bell, the market stopped meeting. Without the market, the roads stopped mattering.',
    'Fields went wild. Goblins moved into the east farms and called it a kingdom. Smugglers took the harbour and called it business.',
    'People did what people do. They packed up and left. A few left notes. Most just took the good pans.'] },
  { shot: 'letter', letter: [
    'Willowbrook, early spring',
    `Dear ${name},`,
    'The well is broken and someone has taken the bucket. Who steals a bucket? Goblins, apparently.',
    'Half the houses on the green are empty, and Mabel is feeding the rest of us out of sheer stubbornness.',
    'I can’t pay much. There is a bed, a rod, an axe, and more work than one person ought to take on. I am told that is what friends are for.',
    'You grew up here. Come home. Bring boots.',
    '— Wren',
    'P.S. Orrin says hello. He doesn’t, but he would if he were nicer.'] },
  { shot: 'hero', town: 'willowbrook', lines: [
    'You are not a knight. Nobody chose you. There was no prophecy, just a letter and a very long walk.',
    'You can learn to fish, cut timber, cook a decent meal and hold your ground when it matters. It turns out that is enough to start.'] },
  { shot: 'road', lines: [
    'Mend one town, and the road to the next one opens.',
    'Somewhere at the end of that road is whoever has the bells. You would like a word.'] },
  { shot: 'title' }
];

/* the stage's own size in its CSS pixels (the page may be zoomed); the captions keep the bottom band */
let stageBox = { w: 1920, h: 1080 };
const capBand = h => Math.max(150, Math.round(h * .24));
/* a town scene at the largest whole-number scale whose full width fits the screen; when it is taller than the space,
   only sky is trimmed from the top. The caption sits below when there is room, otherwise over the faded foot.
   On a phone (wider than the screen even at 1x) the picture pans slowly, exactly edge to edge. */
const sceneK = () => { const { w, h } = stageBox; let k = Math.max(1, Math.floor((w - 16) / 640)); while (k > 1 && 360 * k * .8 > h) k--; return k; };
const sceneHtml = (town, cls = '', inner = '') => {
  const url = DQ.sceneUrl ? DQ.sceneUrl(town) : DQ.backdropUrl && DQ.backdropUrl(town + ':0'); if (!url) return '';
  const { w, h } = stageBox, k = sceneK(), iw = 640 * k, ih = 360 * k, below = ih + capBand(h) <= h;
  const fw = Math.min(iw, w), fh = Math.min(ih, below ? h - capBand(h) : h), pan = Math.max(0, Math.round((iw - fw) / 2));
  return `<div class="in-frame ${cls} ${pan ? 'pan' : ''} ${below ? 'below' : 'over'}" style="--k:${k};--pan:${pan}px;width:${fw}px;height:${fh}px"><img class="pxa in-town" src="${url}" width="${iw}" height="${ih}" style="left:${Math.round((fw - iw) / 2)}px;top:${fh - ih}px" alt="" draggable="false">${inner}</div>`;
};
/* the bell (drawn 16 x 16) and the hero (drawn 24 x 32) at whole-number scales tied to the town's */
const bellHtml = (m = 4) => { const u = DQ.gearIconUrl && DQ.gearIconUrl('millers_bell'); return u ? `<img class="pxa in-bell" src="${u}" width="${16 * m}" height="${16 * m}" style="width:${16 * m}px;height:${16 * m}px" alt="" draggable="false">` : ''; };
const heroHtml = m => { const u = DQ.heroFigureUrl && DQ.heroFigureUrl(S().look); return u ? `<img class="pxa in-hero" src="${u}" width="${24 * m}" height="${32 * m}" style="width:${24 * m}px;height:${32 * m}px" alt="" draggable="false">` : ''; };
const roadHtml = () => {
  const n = D.TOWNS.length, first = D.TOWNS[0];
  const dots = D.TOWNS.map((t, i) => `<li style="--i:${i}" class="${i === 0 ? 'here' : i === n - 1 ? 'end' : ''}"><i></i><span>${i === 0 ? esc(first.name) : i === n - 1 ? bellHtml() : ''}</span></li>`).join('');
  return `<div class="in-road"><ol>${dots}</ol></div>`;
};
const shotHtml = f => {
  const k = sceneK();
  if (f.shot === 'town') return sceneHtml(f.town, '', f.bell ? `<div class="in-bellwrap">${bellHtml(2 * k + 2)}</div>` : '');
  if (f.shot === 'dark') return sceneHtml(f.town, 'dark');
  if (f.shot === 'hero') return sceneHtml(f.town, 'dawn', `<div class="in-walk">${heroHtml(2 * k + 2)}</div>`);
  if (f.shot === 'road') return roadHtml();
  if (f.shot === 'letter') return `<div class="in-paper"><div class="in-letter">${f.letter.map((l, i) => `<p class="${i === 0 ? 'date' : i === 1 ? 'dear' : /^— /.test(l) ? 'sign' : /^P\.S\./.test(l) ? 'ps' : ''}" style="--i:${i}">${esc(l)}</p>`).join('')}</div></div>`;
  if (f.shot === 'title') return `<div class="in-title"><div class="logo">${DQ.ico('candle')}<h1>Idlewick</h1></div><p>Your work carries on while you’re away.</p><button class="tbtn primary" data-in="begin"><span>Begin</span></button></div>`;
  return '';
};

DQ.introSeen = () => !!(S() && S().seen && S().seen.intro);
DQ.playIntro = (opts = {}) => {
  if (document.getElementById('intro')) return;
  const name = (S().name || 'friend').trim() || 'friend', script = SCRIPT(name), quick = calm();
  const el = document.createElement('div'); el.id = 'intro'; el.setAttribute('role', 'dialog'); el.setAttribute('aria-modal', 'true'); el.setAttribute('aria-label', 'The story so far');
  el.innerHTML = `<div class="in-stage"></div><div class="in-cap" aria-live="polite"></div><button class="in-skip" data-in="skip" hidden>Skip intro ›</button>`;
  document.body.appendChild(el);
  const stage = el.querySelector('.in-stage'), cap = el.querySelector('.in-cap'), skip = el.querySelector('.in-skip');
  const measure = () => { stageBox = { w: el.clientWidth || 1280, h: el.clientHeight || 720 }; el.style.setProperty('--capband', capBand(stageBox.h) + 'px'); };
  DQ._introBox = () => stageBox;
  measure();
  let fi = -1, li = 0, timer = 0, touched = false, ended = false;
  const readTime = t => Math.max(2400, Math.min(6500, 900 + t.split(/\s+/).length * 270));
  const showShot = () => {
    measure(); const f = script[fi], olds = [...stage.querySelectorAll('.in-shot')];
    const shot = document.createElement('div'); shot.className = `in-shot shot-${f.shot}`; shot.innerHTML = shotHtml(f); stage.appendChild(shot);
    requestAnimationFrame(() => shot.classList.add('on'));
    olds.forEach(old => { old.classList.remove('on'); old.classList.add('off'); setTimeout(() => old.remove(), 1200); });
    if (f.bell && DQ.sfx) DQ.sfx('bell');
    cap.innerHTML = ''; li = 0;
  };
  const showLine = () => {
    const f = script[fi]; clearTimeout(timer);
    if (f.shot === 'title') { cap.innerHTML = ''; const b = el.querySelector('[data-in="begin"]'); if (b) setTimeout(() => b.focus({ preventScroll: true }), 50); skip.hidden = true; return; }
    if (f.shot === 'letter') { const total = f.letter.reduce((a, l) => a + readTime(l) * .55, 0); el.querySelectorAll('.in-letter p').forEach((p, i) => p.style.animationDelay = `${i * (quick ? 0 : 1.1)}s`); timer = setTimeout(next, quick ? 9000 : total + 1500); li = f.letter.length; return; }
    const t = f.lines[li]; const p = document.createElement('p'); p.textContent = t; cap.appendChild(p); requestAnimationFrame(() => p.classList.add('on'));
    while (cap.children.length > 2) cap.firstElementChild.remove();
    timer = setTimeout(advance, readTime(t));
  };
  const next = () => { if (fi >= script.length - 1) return; fi++; showShot(); setTimeout(showLine, fi === 0 ? 900 : 650); };
  const advance = () => { const f = script[fi]; if (!f || f.shot === 'title') return; if (f.lines && li < f.lines.length - 1) { li++; showLine(); } else next(); };
  const finish = () => {
    if (ended) return; ended = true; clearTimeout(timer);
    S().seen = S().seen || {}; S().seen.intro = 1; if (DQ.save) DQ.save();
    el.classList.add('out'); setTimeout(() => { el.remove(); if (opts.onDone) opts.onDone(); }, quick ? 0 : 700);
    document.removeEventListener('keydown', onKey, true);
  };
  const touch = () => { if (!touched) { touched = true; skip.hidden = false; requestAnimationFrame(() => skip.classList.add('on')); } };
  el.addEventListener('click', e => {
    const b = e.target.closest('[data-in]');
    if (b && b.dataset.in === 'skip') return finish();
    if (b && b.dataset.in === 'begin') { DQ.sfx && DQ.sfx('click'); return finish(); }
    touch(); advance();
  });
  const onKey = e => {
    if (!document.getElementById('intro')) return;
    e.stopPropagation();
    if (e.key === 'Escape') { if (touched) finish(); else touch(); e.preventDefault(); return; }
    if (e.key === ' ' || e.key === 'Enter' || e.key === 'ArrowRight') { e.preventDefault(); if (script[fi] && script[fi].shot === 'title') return finish(); touch(); advance(); }
  };
  document.addEventListener('keydown', onKey, true);
  next();
};

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
