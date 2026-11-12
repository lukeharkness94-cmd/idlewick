/* Idlewick: nice little touches. Small, quiet details layered onto the existing scenes and systems, never new menus
   or notifications: villagers return to restored places, the light follows your clock, each region has its weather,
   your weapon and companion keep you company while you work, the journal keeps small memories, villagers leave notes
   and nod at your title, unique finds sparkle, and boss specials are telegraphed. Motion is CSS (time-based) and is
   switched off by Reduce effects and reduced-motion settings. Loaded after journal.js, before pixel_runtime.js. */
(() => {
const DQ = window.DQ, D = DQ.data, UI = DQ.ui, { esc, ico, fmt } = DQ;
const S = () => DQ.S;
const hash = str => { let h = 2166136261; for (const c of String(str)) h = Math.imul(h ^ c.charCodeAt(0), 16777619); return (h >>> 0) / 4294967296; };
const dayKey = () => new Date().toDateString();

/* ---------- 2. time of day, from the player's own clock ---------- */
DQ.timeOfDay = (h = new Date().getHours()) => h >= 5 && h < 8 ? 'dawn' : h >= 8 && h < 18 ? 'day' : h >= 18 && h < 21 ? 'dusk' : 'night';
const syncTod = () => { if (document.body && document.body.dataset) document.body.dataset.tod = DQ.timeOfDay(); };
syncTod(); setInterval(syncTod, 5 * 60000);

/* ---------- 3. weather by region ---------- */
const WEATHER = { willowbrook: 'pollen', mossbarrow: 'leaves', saltmere: 'rain', ironpeak: 'snow', gloomfen: 'mist', emberfall: 'embers', skyreach: 'wind', hollow: 'motes' };
const weatherHtml = town => {
  const w = WEATHER[town]; if (!w) return '';
  const n = w === 'mist' ? 5 : w === 'rain' ? 22 : 14;
  return `<span class="weather w-${w}" aria-hidden="true">${Array.from({ length: n }, (_, i) => { const r = hash(town + i), r2 = hash(i + town + 'b'); return `<i style="--x:${Math.round(r * 100)}%;--d:${(2 + r2 * 4).toFixed(2)}s;--t:-${(r * 6).toFixed(2)}s;--s:${(.6 + r2 * .8).toFixed(2)}"></i>`; }).join('')}</span>`;
};

/* ---------- 1. villagers return to restored places ---------- */
const TOWNSFOLK = { willowbrook: ['villager', 'farmer'], mossbarrow: ['farmhand', 'villager'], saltmere: ['dockhand', 'merchant'], ironpeak: ['dwarf', 'dockhand'], gloomfen: ['witch', 'villager'], emberfall: ['fireguard', 'dwarf'], skyreach: ['monk', 'villager'], hollow: ['monk', 'fireguard'] };
const villagersHtml = town => {
  /* people come back when a town is restored, or when the threat over it is gone */
  const restored = Object.entries(D.PROJECTS || {}).filter(([id, p]) => p.town === town && S().projects[id]).length + (S().towns[town] && S().towns[town].boss ? 1 : 0); if (!restored) return '';
  const folk = (TOWNSFOLK[town] || ['villager']).slice(0, Math.min(2, restored)).filter(id => DQ.pixelArt && DQ.pixelArt.hasCreature(id));
  return folk.map((id, i) => `<span class="scene-folk f${i}" aria-hidden="true">${DQ.artImage('creature', id, 96, '', '')}</span>`).join('');
};

/* ---------- 5. your companion keeps you company (work scenes show your tool, never your weapon) ---------- */
const petHtml = () => { const p = S().pets.active && D.PET[S().pets.active]; return p ? `<span class="scene-pet ${['fish', 'ghost', 'bird'].includes(p.spr) ? 'floats' : ''}" aria-hidden="true">${DQ.petSprite(p, 64)}</span>` : ''; };
const trick0 = DQ.trickNote;
if (trick0) DQ.trickNote = (text, where) => { trick0(text, where); const pet = !(DQ.sim && DQ.sim.on) && !DQ.forecasting && document.querySelector('.scene-pet'); if (pet) { pet.classList.remove('hop'); void pet.offsetWidth; pet.classList.add('hop'); } };

/* layered onto every render: work scenes and the arena */
const render0 = UI.render;
UI.render = fresh => {
  render0(fresh);
  const town = S().town, scene = document.querySelector('.activity-scene');
  if (scene && !scene.querySelector('.weather')) {
    scene.insertAdjacentHTML('beforeend', '<span class="tod-tint" aria-hidden="true"></span>' + weatherHtml(town) + (scene.classList.contains('fish') ? '' : villagersHtml(town)) + (scene.querySelector('.scene-worker') ? petHtml() : ''));
  }
  const arena = document.querySelector('.encounter-arena');
  if (arena && !arena.querySelector('.weather')) arena.insertAdjacentHTML('afterbegin', '<span class="tod-tint" aria-hidden="true"></span>' + weatherHtml(town));
  /* 7. a fresh unique glows in the pack until you have looked at it */
  if (S().freshUnique && UI.view === 'character') { const id = S().freshUnique; setTimeout(() => { if (S().freshUnique === id && UI.view === 'character') S().freshUnique = null; }, 4000); }
  /* 11. a cosy home at night */
  if (UI.view === 'overview' && DQ.timeOfDay() === 'night' && !document.querySelector('.night-home')) {
    const view = document.getElementById('view'); if (view) view.insertAdjacentHTML('afterbegin', nightHtml());
  }
};
const pack0 = UI.packGrid;
if (pack0) UI.packGrid = () => { const h = pack0(), id = S().freshUnique; return id ? h.replace(`data-a="${id}" data-b="pack"`, `data-a="${id}" data-b="pack" data-fresh="1"`) : h; };

/* ---------- 11. the night-time home ---------- */
const nightHtml = () => {
  const owned = S().house && S().house.owned, act = DQ.act ? DQ.actLabel().toLowerCase() : '';
  return `<section class="panel night-home" aria-label="Night">${owned && DQ.cottageArt ? `<span class="nh-art">${DQ.cottageArt()}<i class="nh-glow"></i></span>` : `<span class="nh-art nh-fire">${ico('fire')}</span>`}<div><span class="k">Night in ${esc(D.TOWN[S().town].name)}</span><p>${owned ? `The cottage windows glow. ${esc(S().name)} rests by the fire` : `${esc(S().name)} warms their hands at the inn’s hearth`}${act ? `, while the night shift carries on ${esc(act)}` : ''}.</p></div></section>`;
};

/* ---------- 8. boss tells: a warning beat before the special, a nudge when it lands ---------- */
DQ.on('bossTell', (m, next) => { const foe = document.getElementById('av-foe'); if (!foe) return; foe.classList.toggle('tell', !!next); });
DQ.on('bossSpecial', () => {
  const arena = document.querySelector('.encounter-arena'); if (!arena || S().settings.reduceFx) return;
  arena.classList.remove('shake'); void arena.offsetWidth; arena.classList.add('shake'); setTimeout(() => arena.classList.remove('shake'), 420);
});

/* ---------- 9. villagers notice your title (once each) ---------- */
DQ.titleNod = q => {
  const t = DQ.heroTitle && DQ.heroTitle(); if (!t || !q || !q.giver) return '';
  const nods = S().nods = S().nods || {}; if (nods[q.giver]) return ''; nods[q.giver] = t;
  return `${q.giver} looks again at you. “${t}? Word travels.” `;
};

/* ---------- 10. a note left on the door ---------- */
const NOTES = {
  willowbrook: [['Mabel', 'Saved you a pie. It is on the sill. Do not tell Orrin.'], ['Elder Wren', 'The well is running sweet today. Thought you would like to know.'], ['Sergeant Orrin', 'Goblins quiet. Too quiet. Come by when you can.']],
  mossbarrow: [['Granny Bramble', 'The hens have been laying double since you left. Coincidence, I am sure.'], ['Granny Bramble', 'Your boots were muddy on my step. I cleaned them. You are welcome, dear.']],
  saltmere: [['Harbourmaster Ilsa', 'A gull stole my lunch and I thought of you. No idea why.'], ['Harbourmaster Ilsa', 'Tide charts for the week are pinned by the door. Mind the spring tide.']],
  ironpeak: [['Captain Hrod', 'Snow on the pass again. Bring a scarf.'], ['Foreman Dunmore', 'Found a nice seam of copper. Saved you a bucket.']],
  gloomfen: [['Gravewarden Lysa', 'The dead stayed put all night. Small mercies.']],
  emberfall: [['Magmasmith Kael', 'Forge is warm if you want to dry your socks.']],
  skyreach: [['Abbot Seren', 'The bells rang on their own at dawn. A good sign.']],
  hollow: [['The Last Herald', 'Even here, someone waits for you to come back.']]
};
const extras0 = UI.returnExtras;
UI.returnExtras = sum => {
  const h = extras0 ? extras0(sum) : '', gap = (sum && sum.real) || 0, b = D.TOWN[S().town] && D.MON[D.TOWN[S().town].boss], won = b && S().towns[S().town] && S().towns[S().town].boss && D.BOSS_VOICES && D.BOSS_VOICES[b.id];
  const list = (NOTES[S().town] || NOTES.willowbrook).concat(won ? [[D.BOSS_VOICES[b.id][0], D.BOSS_VOICES[b.id][2]]] : []);
  if (gap < 4 * 3600e3 || hash(dayKey() + S().name) > .45) return h;
  const [who, text] = list[Math.floor(hash(dayKey() + 'note') * list.length)];
  return h + `<div class="door-note" role="note"><p>${esc(text)}</p><small>— ${esc(who)}</small></div>`;
};

/* ---------- 6. small memories in the journal ---------- */
const mem = key => { const M = S().memories = S().memories || {}; if (M[key]) return false; M[key] = 1; return true; };
const kill0 = DQ.recordKill;
DQ.recordKill = (m, drops) => {
  kill0(m, drops); if (DQ.forecasting || !DQ.journal) return;
  const k = S().beast.kills[m.id] || 0;
  if ((k === 100 || k === 1000) && mem(`kills:${m.id}:${k}`)) DQ.journal('memory', `Your ${fmt(k)}th ${m.name.toLowerCase()}. ${k === 1000 ? 'They tell stories about you now.' : 'You could do it in your sleep.'}`, 'skull');
};
const qev0 = DQ.qev;
DQ.qev = (ev, key, n) => {
  qev0(ev, key, n); if (DQ.forecasting || !DQ.journal) return;
  if (ev === 'catch') { const node = D.NODE && D.NODE['fish:' + key]; if (node && node.lvl >= 20 && mem('fish:' + key)) DQ.journal('memory', `Landed your first ${node.name.toLowerCase()}.`, 'fish'); }
};
DQ.on('welcome', (sum, gap) => { if (gap >= 8 * 3600e3 && DQ.journal && mem('away8')) DQ.journal('memory', 'The longest you have been away: eight hours or more. The village kept your seat warm.', 'moon'); });
const notify0 = DQ.notify;
DQ.notify = o => { if (o && o.kind === 'death' && DQ.journal && mem('death')) DQ.journal('memory', 'Knocked out for the first time. You woke by the campfire, a little wiser.', 'heart'); return notify0(o); };
})();
