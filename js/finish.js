/* Idlewick: the finish layer (Nov 2026). Small, consistent motion that makes the whole game feel made with care:
   - pages arrive: their panels fade and rise in turn, whenever the page is freshly drawn (never on a live refresh)
   - a brass ink slides under the top menu and the page tabs to the page you chose
   Everything is transform and opacity on top of the existing layout (nothing moves the page around), uses the
   browser's own timeline, and is off under Settings > Reduce effects and the device's reduced-motion setting.
   The look itself (cards, buttons, bars, pop-ups) is the "Finish layer" block in css/style.css. */
(() => {
const DQ = window.DQ, UI = DQ.ui;
const calm = () => document.documentElement.classList.contains('calm') || (DQ.S && DQ.S.settings && DQ.S.settings.reduceFx) || matchMedia('(prefers-reduced-motion: reduce)').matches;
let lastView = null, enterTimer = 0;

/* pages arrive: stagger the visible blocks of the new page */
const blocks = view => {
  let list = [...view.children].filter(e => e.offsetParent !== null && !e.matches('.page-help'));
  if (list.length < 3) { const inner = list.flatMap(e => [...e.children].filter(c => c.offsetParent !== null)); if (inner.length >= list.length) list = inner.length > 8 ? list : inner; }
  return list.slice(0, 7);
};
const enter = () => {
  const view = document.getElementById('view'); if (!view) return;
  clearTimeout(enterTimer); view.classList.remove('fin-enter');
  if (calm()) return;
  blocks(view).forEach((el, i) => el.style.setProperty('--fin-i', i));
  void view.offsetWidth; view.classList.add('fin-enter');
  enterTimer = setTimeout(() => view.classList.remove('fin-enter'), 900);
};

/* the ink: one brass bar per menu that slides to the active entry */
const memory = new Map();
const ink = (box, active, key) => {
  if (!box) return;
  let bar = box.querySelector(':scope > .fin-ink');
  if (!active || active.offsetParent === null) { if (bar) bar.style.opacity = '0'; return; }
  const fresh = !bar;
  if (fresh) { bar = document.createElement('i'); bar.className = 'fin-ink'; bar.setAttribute('aria-hidden', 'true'); box.appendChild(bar); }
  const x = active.offsetLeft, w = active.offsetWidth, y = active.offsetTop + active.offsetHeight - 3, before = memory.get(key);
  const place = (px, pw, py) => { bar.style.transform = `translate(${px}px, ${py}px)`; bar.style.width = pw + 'px'; };
  if (fresh && before && !calm()) { bar.style.transition = 'none'; place(before.x, before.w, before.y); void bar.offsetWidth; bar.style.transition = ''; }
  else if (fresh) { bar.style.transition = 'none'; place(x, w, y); void bar.offsetWidth; bar.style.transition = ''; }
  bar.style.opacity = '1'; place(x, w, y);
  memory.set(key, { x, w, y });
};
const inks = () => {
  const nav = document.getElementById('topnav'); ink(nav, nav && nav.querySelector('.tnav.on'), 'top');
  const sub = document.querySelector('#subnav .subnav'); if (sub) ink(sub, sub.querySelector('.stab.on'), 'sub:' + sub.className);
};

/* coins roll up to a new total (gains only; spending shows at once so a price is never in doubt) */
const shown = new WeakMap();
const coins0 = UI.B && UI.B.coins;
if (coins0) UI.B.coins = e => {
  const target = DQ.S.coins, st = shown.get(e);
  if (st && target === st.to) { if (!st.raf) coins0(e); return; }
  if (!st || calm() || target < st.to || target - st.to > 1e7) { if (st && st.raf) cancelAnimationFrame(st.raf); shown.set(e, { from: target, to: target, now: target }); return coins0(e); }
  const from = st.now, start = performance.now(), dur = Math.min(900, 380 + Math.log10(target - from + 1) * 120);
  if (st.raf) cancelAnimationFrame(st.raf);
  const step = t => { const k = Math.min(1, (t - start) / dur), ease = 1 - Math.pow(1 - k, 3), v = Math.round(from + (target - from) * ease);
    st.now = v; UI.set(e, DQ.fmt(v)); st.raf = k < 1 ? requestAnimationFrame(step) : 0; if (k >= 1) { e.classList.remove('fin-roll'); } };
  Object.assign(st, { to: target }); e.classList.add('fin-roll'); st.raf = requestAnimationFrame(step);
};

const render0 = UI.render;
UI.render = (...a) => {
  const r = render0(...a);
  try {
    /* the page's own fresh render (ui_pages.js adds .enter) now arrives panel by panel instead of as one block */
    const v = document.getElementById('view'); if (v && v.classList.contains('enter')) { if (lastView !== null) enter(); lastView = UI.view; }
    inks();
  } catch (e) {}
  return r;
};
addEventListener('resize', () => { try { inks(); } catch (e) {} });
})();
