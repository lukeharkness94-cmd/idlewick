/* Idlewick: petting looks like petting (owner, 26 Nov 2026: "when you pet, it just goes large rather than actually
   showing a petting animation"). A small code-drawn hand strokes the animal twice from head to tail while the animal
   leans into it and closes its eyes a little (a gentle lean and settle, never a size change), then hearts float up.
   Used by pen animals on the farm and by the companion badge. Presentation only: petting's effects are unchanged.
   Reduce effects / reduced motion: the hearts only. */
(() => {
const Q = window.DQ, UI = Q.ui;
const still = () => document.documentElement.classList.contains('calm') || (window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);
let handUrl = '';
const hand = () => { if (handUrl) return handUrl; const c = document.createElement('canvas'); c.width = 12; c.height = 10; const x = c.getContext('2d'), f = (col, a, b, w, h) => { x.fillStyle = col; x.fillRect(a, b, w, h); };
  /* an open hand seen from above, palm down, fingers to the right: outline, skin, top-left light */
  const o = '#5a3a2a', s = '#f0c49a', l = '#ffe0c0', d = '#c8906a';
  f(o, 1, 2, 7, 7); f(s, 2, 3, 5, 5); f(l, 2, 3, 3, 1);
  for (const [y, len] of [[2, 4], [4, 5], [6, 4]]) { f(o, 7, y - 1, len + 1, 3); f(s, 7, y, len, 1); }
  f(o, 3, 8, 3, 2); f(s, 4, 8, 1, 1); f(d, 2, 7, 5, 1);
  return (handUrl = c.toDataURL()); };
Q.petStroke = el => { if (!el) return; const box = el.getBoundingClientRect(); if (!box.width) return;
  if (Q.floatAt) setTimeout(() => Q.floatAt(el, '♥ ♥', '#f08aa0'), still() ? 0 : 900);
  if (still()) return;
  const h = document.createElement('img'); h.src = hand(); h.className = 'pet-hand'; h.alt = ''; h.setAttribute('aria-hidden', 'true');
  const page = v => Q.toPage ? Q.toPage(v) : v, w = page(box.width), x0 = page(box.left), y0 = page(box.top);
  const k = w >= 80 ? 3 : 2, hw = 12 * k, hh = 10 * k; /* whole-number scale of the 12 x 10 hand, sized to the animal */
  Object.assign(h.style, { width: hw + 'px', height: hh + 'px', left: x0 + w * .1 + 'px', top: y0 - hh * .45 + 'px', '--stroke': Math.max(8, w * .55 - hw * .3) + 'px' });
  document.body.appendChild(h); el.classList.remove('petted'); void el.offsetWidth; el.classList.add('petted');
  setTimeout(() => { h.remove(); el.classList.remove('petted'); }, 1300); };
/* farm pens and the companion badge */
const pen0 = Q.petAnimal; if (pen0) Q.petAnimal = i => { const el = document.querySelector(`.pen[data-i="${i}"] .pspr`); const r = pen0(i); requestAnimationFrame(() => Q.petStroke(document.querySelector(`.pen[data-i="${i}"] .pspr`) || el)); return r; };
if (UI.DO && UI.DO.petpet) { const pp = UI.DO.petpet; UI.DO.petpet = (...a) => { const el = document.querySelector('.hud-pet'); const r = pp(...a); el && el.classList.remove('hop'); Q.petStroke(el); return r; }; }
})();
