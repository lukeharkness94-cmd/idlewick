/* Restoration payoff in the village itself (Nov 2026): no cutscene. When you hand supplies to a site the items fly from
   the list to the building; when the last of it goes in, the old picture of the town melts into the repaired one in
   place with a flash of light, then one villager says their piece and the benefit that is now active is stated.
   Reduced-motion and calm settings skip the movement and keep the banner. */
(() => {
const Q = window.DQ, D = Q.data, UI = Q.ui, S = () => Q.S;
const calm = () => !!(S().settings.reduceFx || document.documentElement.classList.contains('calm') || (window.matchMedia && matchMedia('(prefers-reduced-motion:reduce)').matches));
const page = v => v / (Q.zoom || 1);
/* what the player is about to hand over, and the picture of the town as it is now */
const snapshot = (arg, finish) => {
  const [id, item] = String(arg).split('|'), lines = [...document.querySelectorAll('.village-projects .proj-line')];
  const src = lines.filter(l => { const b = l.querySelector('[data-do="projectgive"]'); return b && (finish || !item || String(b.dataset.a).split('|')[1] === item); })
    .map(l => { const ic = l.querySelector('.proj-ic'), r = ic.getBoundingClientRect(); return { html: ic.innerHTML, x: r.left + r.width / 2, y: r.top + r.height / 2 }; });
  const img = document.querySelector('.village-scene > img.scene');
  return { id, src, old: img ? img.src : null, was: !!S().projects[id] };
};
const fly = (snap) => {
  const spot = document.querySelector('.village-scene .site-spot[data-a="' + snap.id + '"]'); if (!spot || !snap.src.length) return;
  const r = spot.getBoundingClientRect(), tx = r.left + r.width / 2, ty = r.top + r.height * .6;
  snap.src.slice(0, 6).forEach((s, i) => {
    const g = document.createElement('div'); g.className = 'supply-ghost'; g.innerHTML = s.html; g.setAttribute('aria-hidden', 'true');
    g.style.cssText = `position:fixed;left:${page(s.x) - 16}px;top:${page(s.y) - 16}px;width:32px;height:32px;z-index:420;pointer-events:none`;
    document.body.appendChild(g);
    const a = g.animate([{ transform: 'translate(0,0) scale(1)', opacity: 1 }, { transform: `translate(${page(tx - s.x) * .5}px,${page(ty - s.y) * .5 - 40}px) scale(1.2)`, opacity: 1, offset: .5 }, { transform: `translate(${page(tx - s.x)}px,${page(ty - s.y)}px) scale(.35)`, opacity: .15 }], { duration: 760 + i * 90, delay: i * 70, easing: 'cubic-bezier(.4,.1,.3,1)', fill: 'forwards' });
    a.onfinish = () => g.remove();
  });
};
const reveal = (snap) => {
  const wrap = document.querySelector('.village-scene'), spot = wrap && wrap.querySelector('.site-spot[data-a="' + snap.id + '"]'); if (!wrap || !spot || !snap.old) return;
  const old = document.createElement('img'); old.className = 'scene pxscene scene-old'; old.src = snap.old; old.alt = ''; old.setAttribute('aria-hidden', 'true'); wrap.appendChild(old);
  const burst = document.createElement('span'); burst.className = 'restore-burst'; burst.setAttribute('aria-hidden', 'true');
  burst.style.cssText = `left:${spot.style.left};top:${spot.style.top};width:${spot.style.width};height:${spot.style.height}`; wrap.appendChild(burst);
  setTimeout(() => { old.remove(); burst.remove(); }, 2200);
};
const wrapDO = (name, finish) => { const f = UI.DO[name]; if (!f) return; UI.DO[name] = arg => {
  if (UI.view !== 'projects') return f(arg);
  const snap = snapshot(arg, finish); const r = f(arg); if (calm()) return r;
  requestAnimationFrame(() => { fly(snap); if (S().projects[snap.id] && !snap.was) reveal(snap); }); return r; }; };
wrapDO('projectgive', false); wrapDO('projectfinish', true);
})();
