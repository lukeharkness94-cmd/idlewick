/* Idlewick: buying something feels like buying something (20 Nov 2026, owner feedback).
   After a purchase that really went through (coins went down or the item count went up), the item's picture flies
   from the shop into the backpack counter, the counter pops with "+N", and the Buy button reads "Bought" for a
   moment. Presentation only: it reads the result of the existing purchase actions and never changes them.
   Reduced motion keeps the button change and the counter's "+N" without the flight. */
(() => {
const DQ = window.DQ, D = DQ.data, UI = DQ.ui;
const calm = () => document.documentElement.classList.contains('calm') || (DQ.S && DQ.S.settings && DQ.S.settings.reduceFx) || matchMedia('(prefers-reduced-motion: reduce)').matches;
const page = v => DQ.toPage ? DQ.toPage(v) : v;
/* a tool counts once: buying one both records the upgrade and puts the tool in the pack (owner saw "Bought ×2", 26 Nov) */
const owned = id => { const n = id && D.ITEMS[id] ? DQ.have(id) : 0; return DQ.S.toolUpgrades && DQ.S.toolUpgrades[id] ? Math.max(n, 1) : n; };
const artFor = (btn, id) => {
  const scope = document.querySelector('#view .shop-task') || document;
  return scope.querySelector(`[data-tip="item:${id}"] img, .shop-preview img, .dt-h img, img.item-art`) || (btn && btn.closest('.illustrated-card,.shop-task')?.querySelector('img'));
};
function celebrate(id, gained, from) {
  const chip = document.querySelector('.packchip'), pick = () => document.querySelector('#view .shop-detail-actions .btn.primary, #view [data-do="buy"].primary, #view [data-do="buyupgrade"], #view [data-do="localbuy"]');
  /* the shop redraws itself after a purchase, so the "Bought" label follows whichever Buy button is on screen */
  const until = performance.now() + 1100, text = `✓ Bought${gained > 1 ? ' ×' + gained : ''}`, keep = new WeakMap();
  /* on the shared animation clock (util.js); returning false ends it */
  const hold = (dt, t) => { const b = pick(); if (b) { if (t < until) { if (!b.classList.contains('just-bought')) { keep.set(b, b.innerHTML); b.classList.add('just-bought'); b.innerHTML = text; } return; } if (b.classList.contains('just-bought')) { b.classList.remove('just-bought'); if (keep.has(b)) b.innerHTML = keep.get(b); else UI.render(false); } return false; } if (t >= until) return false; };
  DQ.frame.add(hold);
  if (DQ.sfx) DQ.sfx('buy');
  if (chip) {
    const plus = document.createElement('b'); plus.className = 'pack-plus'; plus.textContent = '+' + Math.max(1, gained); chip.appendChild(plus);
    chip.classList.remove('pack-pop'); void chip.offsetWidth; chip.classList.add('pack-pop');
    setTimeout(() => plus.remove(), 1200);
  }
  if (calm() || !from || !chip) return;
  const to = chip.getBoundingClientRect(), fly = document.createElement('img');
  fly.src = from.src; fly.className = 'buy-fly pxa'; fly.alt = ''; fly.setAttribute('aria-hidden', 'true');
  const size = 48, x0 = page(from.left + from.width / 2 - size / 2), y0 = page(from.top + from.height / 2 - size / 2), x1 = page(to.left + to.width / 2 - size / 2), y1 = page(to.top + to.height / 2 - size / 2);
  Object.assign(fly.style, { left: x0 + 'px', top: y0 + 'px', width: size + 'px', height: size + 'px' });
  document.body.appendChild(fly);
  const dx = x1 - x0, dy = y1 - y0, lift = Math.min(-60, dy * .4 - 60);
  const anim = fly.animate([
    { translate: '0 0', scale: '1', opacity: 1 },
    { translate: `${dx * .5}px ${dy * .5 + lift}px`, scale: '1.15', opacity: 1, offset: .45 },
    { translate: `${dx}px ${dy}px`, scale: '.45', opacity: .85 }
  ], { duration: 650, easing: 'cubic-bezier(.4,.1,.3,1)' });
  anim.onfinish = anim.oncancel = () => fly.remove();
}
const wrap = (name, idOf) => {
  const f = UI.DO[name]; if (typeof f !== 'function') return;
  UI.DO[name] = (...a) => {
    const id = idOf(...a), btn = document.activeElement, art = artFor(btn, id), rect = art ? { src: art.src, ...art.getBoundingClientRect().toJSON() } : null;
    const coins = DQ.S.coins, had = owned(id), r = f(...a);
    const gained = owned(id) - had;
    if (DQ.S.coins < coins || gained > 0) requestAnimationFrame(() => celebrate(id, Math.max(gained, 1), rect));
    return r;
  };
};
wrap('buy', id => id);
wrap('buyupgrade', id => id);
wrap('localbuy', id => id);
wrap('rarebuy', id => id);
wrap('buycommission', () => null);
})();
