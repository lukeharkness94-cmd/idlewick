/* Idlewick: shared helpers and icon sprite. Everything hangs off window.DQ. */
window.DQ = { sim: { on: false } };
(() => {
const DQ = window.DQ;
DQ.$ = (s, r = document) => r.querySelector(s);
DQ.$$ = (s, r = document) => [...r.querySelectorAll(s)];
DQ.fmt = n => Math.floor(n).toLocaleString('en-US');
DQ.fmtK = n => { n = Math.floor(n); if (n >= 1e9) return (n / 1e9).toFixed(1) + 'B'; if (n >= 1e6) return (n / 1e6).toFixed(n >= 1e7 ? 1 : 2) + 'M'; if (n >= 1e5) return Math.floor(n / 1e3) + 'K'; return n.toLocaleString('en-US'); };
DQ.rnd = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
DQ.pick = a => a[Math.floor(Math.random() * a.length)];
DQ.clamp = (v, a, b) => Math.min(b, Math.max(a, v));
DQ.chance = p => Math.random() < p;
DQ.esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
DQ.cap = s => s.charAt(0).toUpperCase() + s.slice(1);
DQ.fmtTime = ms => {
  const s = Math.floor(ms / 1000), h = Math.floor(s / 3600), m = Math.floor(s % 3600 / 60);
  return h ? `${h}h ${m}m` : m ? `${m}m ${s % 60}s` : `${s}s`;
};
DQ.weighted = list => { let t = list.reduce((a, x) => a + x[1], 0), r = Math.random() * t; for (const [v, w] of list) { if ((r -= w) <= 0) return v; } return list[0][0]; };

/* tiny event bus */
const subs = {};
DQ.on = (ev, fn) => { (subs[ev] = subs[ev] || []).push(fn); };
// Trial fights must not redraw the live UI or notify gameplay listeners.
DQ.emit = (ev, ...a) => { if (DQ.forecasting) return; (subs[ev] || []).forEach(f => f(...a)); };

/* ---------- Icons (24x24 stroke glyphs) ---------- */
const ICONS = {
  fishing: 'M3 12c3-5 8-6 12-3l5-3v12l-5-3c-4 3-9 2-12-3z M8 11h.01',
  woodcutting: 'M5 20 15 10 M13 5c3-2 7-1 7 3-1 2-3 3-6 3l-3-3c0-1 1-2 2-3z',
  mining: 'M3 10c3-5 15-5 18 0 M12 7v14 M9 21h6',
  thieving: 'M12 3c-4 0-7 3-7 7v2c0 3 2 5 4 6l3 3 3-3c2-1 4-3 4-6v-2c0-4-3-7-7-7z M8 11h3 M13 11h3',
  cooking: 'M5 11h14v6a3 3 0 0 1-3 3H8a3 3 0 0 1-3-3z M3 11h18 M9 7c0-2 2-2 2-4 M14 7c0-2 2-2 2-4',
  smithing: 'M3 7h14c0 2 2 3 4 3-1 2-3 3-5 3h-3v3h3v2H6v-2h3v-3c-4 0-6-2-6-6z',
  crafting: 'M6 4h12l4 6-10 11L2 10z M2 10h20 M9 4l-2 6 5 11 5-11-2-6',
  magic: 'M4 20 13 11 M17 3l1.5 3.5L22 8l-3.5 1.5L17 13l-1.5-3.5L12 8l3.5-1.5z',
  ranged: 'M6 3c8 3 8 15 0 18 M6 3v18 M6 12h14 M17 9l3 3-3 3',
  attack: 'M5 19 19 5 M14 5h5v5 M5 19l-2 2 M7 15l2 2',
  strength: 'M6 7v10 M3 10v4 M18 7v10 M21 10v4 M6 12h12',
  defence: 'M12 3l8 3v6c0 5-4 8-8 9-4-1-8-4-8-9V6z',
  hitpoints: 'M12 20s-8-5-8-11a4.5 4.5 0 0 1 8-2.5A4.5 4.5 0 0 1 20 9c0 6-8 11-8 11z',
  home: 'M4 4h7v7H4z M13 4h7v4h-7z M13 11h7v9h-7z M4 14h7v6H4z',
  map: 'M9 4 3 6v14l6-2 6 2 6-2V4l-6 2z M9 4v14 M15 6v14',
  shop: 'M4 9l1-5h14l1 5 M4 9v11h16V9 M4 9c0 2 3 2 4 0 1 2 3 2 4 0 1 2 3 2 4 0 1 2 4 2 4 0 M9 20v-5h6v5',
  quest: 'M8 4h10a2 2 0 0 1 2 2v1H10 M8 4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h9a2 2 0 0 0 2-2V7 M9 11h7 M9 15h5',
  bag: 'M6 8h12l1 12H5z M9 8V6a3 3 0 0 1 6 0v2',
  bank: 'M3 10 12 4l9 6 M5 10v8 M9 10v8 M15 10v8 M19 10v8 M3 20h18',
  trophy: 'M8 4h8v6a4 4 0 0 1-8 0z M8 6H4c0 3 1 4 4 5 M16 6h4c0 3-1 4-4 5 M12 14v4 M8 20h8',
  gear: 'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z M12 3v3 M12 18v3 M3 12h3 M18 12h3 M5.6 5.6l2.1 2.1 M16.3 16.3l2.1 2.1 M18.4 5.6l-2.1 2.1 M7.7 16.3l-2.1 2.1',
  sound: 'M4 10v4h4l5 4V6L8 10z M16 9c1.5 1.5 1.5 4.5 0 6 M18.5 6.5c3 3 3 8 0 11',
  mute: 'M4 10v4h4l5 4V6L8 10z M17 9l5 6 M22 9l-5 6',
  sun: 'M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8z M12 2v2 M12 20v2 M2 12h2 M20 12h2 M4.9 4.9l1.4 1.4 M17.7 17.7l1.4 1.4 M4.9 19.1l1.4-1.4 M17.7 6.3l1.4-1.4',
  moon: 'M20 14.5A8 8 0 0 1 9.5 4 8 8 0 1 0 20 14.5z',
  music: 'M9 18V6l11-2v12 M9 18a3 3 0 1 1-3-3 3 3 0 0 1 3 3z M20 16a3 3 0 1 1-3-3 3 3 0 0 1 3 3z',
  lock: 'M6 11h12v9H6z M8 11V8a4 4 0 0 1 8 0v3',
  close: 'M6 6l12 12 M18 6 6 18',
  check: 'M5 12l5 5 9-10',
  chevron: 'M9 6l6 6-6 6',
  bell: 'M6 16V11a6 6 0 0 1 12 0v5l1.5 2H4.5L6 16z M10 21h4',
  arrow: 'M5 12h14 M13 6l6 6-6 6',
  star: 'M12 3l2.7 5.8 6.3.8-4.6 4.3 1.2 6.3L12 17l-5.6 3.2 1.2-6.3L3 9.6l6.3-.8z',
  skull: 'M12 3c-5 0-8 3-8 8 0 3 1 4 3 5v4h10v-4c2-1 3-2 3-5 0-5-3-8-8-8z M9 11h.01 M15 11h.01 M10 20v-3 M14 20v-3',
  coin: 'M12 4a8 8 0 1 0 0 16 8 8 0 0 0 0-16z M12 8v8 M9.5 10.5h4a1.5 1.5 0 0 1 0 3h-4',
  pin: 'M12 21s-6-6-6-11a6 6 0 0 1 12 0c0 5-6 11-6 11z M12 10h.01',
  town: 'M4 21V9l3 2V7l3 2V5h4v4l3-2v4l3-2v12z',
  info: 'M12 4a8 8 0 1 0 0 16 8 8 0 0 0 0-16z M12 11v5 M12 8h.01',
  fish: 'M3 12c3-5 8-6 12-3l5-3v12l-5-3c-4 3-9 2-12-3z M8 11h.01',
  log: 'M3 9c0-1.5 1-2.5 2.5-2.5H19v9H5.5C4 15.5 3 14.5 3 13z M19 6.5c1.5 0 2.5 2 2.5 4.5s-1 4.5-2.5 4.5 M7 11h.01',
  ore: 'M12 3l7 6-3 11H8L5 9z M5 9h14 M12 3v17',
  bar: 'M4 15l3-7h10l3 7z M4 15v3h16v-3 M7 8l-.5 3.5 M17 8l.5 3.5',
  gem: 'M6 4h12l4 6-10 11L2 10z M2 10h20 M9 4l-2 6 5 11 5-11-2-6',
  hide: 'M5 5l3 2h8l3-2 2 5-3 2v8H6v-8l-3-2z',
  bone: 'M7 7a2 2 0 1 0-3-1 2 2 0 0 0 1 3l9 9a2 2 0 1 0 3 1 2 2 0 0 0-1-3z',
  bit: 'M12 3c5 3 7 8 4 13-1 2-3 4-4 5-1-1-3-3-4-5-3-5-1-10 4-13z M12 7v12',
  pouch: 'M8 6l-1-3h10l-1 3 M8 6c-4 3-5 8-4 12 1 2 3 3 8 3s7-1 8-3c1-4 0-9-4-12z M12 11v6 M10 12.5h3a1.5 1.5 0 0 1 0 3h-3',
  arrow_ammo: 'M3 21 21 3 M21 3h-5 M21 3v5 M3 21l-1-4 M3 21l4 1',
  helm: 'M4 14c0-5 3-9 8-9s8 4 8 9v3H4z M4 14h16 M12 5v9',
  body: 'M8 4 4 7v5l3 1v7h10v-7l3-1V7l-4-3c-1 2-2 3-4 3S9 6 8 4z',
  legs: 'M7 3h10l1 18h-5l-1-9-1 9H6z',
  shield: 'M12 3l8 3v6c0 5-4 8-8 9-4-1-8-4-8-9V6z M12 3v18',
  staff: 'M5 21 15 11 M17 3a4 4 0 1 1 0 8 4 4 0 0 1 0-8z',
  ring: 'M12 8a6 6 0 1 0 0 12 6 6 0 0 0 0-12z M9 8l1-4h4l1 4',
  amulet: 'M5 4c2 6 3 8 7 11 4-3 5-5 7-11 M12 15a3 3 0 1 0 0 6 3 3 0 0 0 0-6z',
  food: 'M4 14c0-4 3-7 8-7s8 3 8 7v3H4z M8 11l1 2 M12 10l1 2 M16 11l1 2',
  rune: 'M12 3l8 5v8l-8 5-8-5V8z M10 9l4 6 M10 15l4-6',
  nest: 'M3 13c0 4 4 7 9 7s9-3 9-7z M6 13l1-3 M10 13l1-4 M14 13l1-4 M18 13l-1-3',
  rod: 'M4 20 18 4c3 2 3 7 1 9',
  glove: 'M7 12V6a1.5 1.5 0 0 1 3 0v4V4a1.5 1.5 0 0 1 3 0v6V5a1.5 1.5 0 0 1 3 0v6 4c0 4-2 6-5 6s-6-2-6-5l-1-3 2-1z',
  scroll: 'M8 4h10a2 2 0 0 1 2 2v1H10 M8 4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h9a2 2 0 0 0 2-2V7',
  ring_logo: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18z M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8z M12 3v3 M12 18v3 M3 12h3 M18 12h3',
  sword: 'M5 19 19 5 M14 5h5v5 M5 19l-2 2 M7 15l2 2',
  bow: 'M6 3c8 3 8 15 0 18 M6 3v18 M6 12h14 M17 9l3 3-3 3',
  hammer: 'M14 4l6 6-3 3-6-6z M13 8 5 20',
  clock: 'M12 4a8 8 0 1 0 0 16 8 8 0 0 0 0-16z M12 8v4l3 2',
  heart: 'M12 20s-8-5-8-11a4.5 4.5 0 0 1 8-2.5A4.5 4.5 0 0 1 20 9c0 6-8 11-8 11z',
  save: 'M5 4h12l3 3v13H5z M8 4v5h7V4 M8 20v-6h8v6',
  flag: 'M6 21V4 M6 5h11l-2 4 2 4H6',
  seed: 'M12 20v-7 M12 13c-4 0-6-2-6-6 4 0 6 2 6 6z M12 13c4 0 6-2 6-6-4 0-6 2-6 6z',
  crop: 'M12 21V9 M12 9c-3-4-1-7 0-8 1 1 3 4 0 8z M12 14c-4 0-6-3-6-5 3 0 6 2 6 5z M12 14c4 0 6-3 6-5-3 0-6 2-6 5z',
  egg: 'M12 3c4 0 7 6 7 11a7 7 0 0 1-14 0c0-5 3-11 7-11z',
  bottle: 'M10 3h4v4l2 3v10H8V10l2-3z M8 13h8',
  hoe: 'M5 21 17 7 M14 4l6 6 M13 5l3-2 5 5-2 3',
  paw: 'M8 10a2 2 0 1 0 0-4 2 2 0 0 0 0 4z M16 10a2 2 0 1 0 0-4 2 2 0 0 0 0 4z M5 14a2 2 0 1 0 0-4 2 2 0 0 0 0 4z M19 14a2 2 0 1 0 0-4 2 2 0 0 0 0 4z M12 12c3 0 5 4 5 6s-2 2-5 2-5 0-5-2 2-6 5-6z',
  house: 'M3 11 12 4l9 7 M5 10v10h14V10 M10 20v-6h4v6',
  users: 'M9 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6z M3 20c0-4 3-6 6-6s6 2 6 6 M16 5a3 3 0 0 1 0 6 M18 14c2 1 3 3 3 6',
  book: 'M4 5c3-1 6-1 8 1v14c-2-2-5-2-8-1z M20 5c-3-1-6-1-8 1v14c2-2 5-2 8-1z',
  barn: 'M3 10l9-6 9 6v10H3z M9 20v-6h6v6 M9 14l6 6 M15 14l-6 6',
  dagger: 'M14 4l6 0 0 6-9 9-3-3z M8 16l-4 4 M6 14l4 4',
  candle: 'M12 2c1.5 2 2.5 3.2 2.5 4.8a2.5 2.5 0 0 1-5 0C9.5 5.2 10.5 4 12 2z M9 11h6v9H9z M6 20h12 M12 9v2',
  fire: 'M12 3c1 4 5 5 5 10a5 5 0 0 1-10 0c0-2 1-3 2-4 0 2 1 3 2 3 0-3-1-6 1-9z',
};
DQ.ICONS = ICONS;
DQ.ico = (n, cls = '') => DQ.pxIcons ? `<i class="ic pxi pxi-${n in ICONS ? n : 'bit'} ${cls}" aria-hidden="true"></i>` : `<svg class="ic ${cls}" aria-hidden="true"><use href="#i-${n in ICONS ? n : 'bit'}"/></svg>`;
DQ.injectSprite = () => {
  const s = Object.entries(ICONS).map(([k, d]) => `<symbol id="i-${k}" viewBox="0 0 24 24"><path d="${d}" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></symbol>`).join('');
  const el = document.createElement('div');
  el.innerHTML = `<svg width="0" height="0" style="position:absolute" aria-hidden="true"><defs>${s}</defs></svg>`;
  document.body.prepend(el.firstChild);
};
})();
