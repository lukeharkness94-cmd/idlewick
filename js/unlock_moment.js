/* Idlewick: a choice opening on the page you are looking at gets a moment (20 Nov 2026, owner feedback).
   When a level-up opens a new fish, tree, rock, recipe or other choice card while its page is on screen, the card
   keeps its place in the list (your scroll position is never moved), its blackout lifts with a light sweeping across, it pops and glows, and a
   "New" ribbon stays on it until you pick it or leave the page. Presentation only; nothing about unlocking changes.
   Reduced motion keeps the ribbon and a still glow. */
(() => {
const DQ = window.DQ, UI = DQ.ui;
let lastPage = null, lastLocked = new Set();
const fresh = new Set();
const lockedNow = () => new Set([...document.querySelectorAll('#view .illustrated-card.locked[data-task-id]')].map(c => c.dataset.page + ':' + c.dataset.taskId));
const mark = () => {
  for (const c of document.querySelectorAll('#view .illustrated-card[data-task-id]')) {
    const key = c.dataset.page + ':' + c.dataset.taskId;
    if (!fresh.has(key) || c.classList.contains('locked')) continue;
    if (!c.querySelector('.new-ribbon')) c.insertAdjacentHTML('beforeend', '<span class="new-ribbon" aria-hidden="true">New</span>');
  }
};
const render0 = UI.render;
UI.render = (...a) => {
  const r = render0(...a);
  try {
    const page = UI.view, now = lockedNow();
    if (page !== lastPage) fresh.clear();
    else {
      const opened = [...lastLocked].filter(k => !now.has(k));
      opened.forEach(k => fresh.add(k));
      if (opened.length) requestAnimationFrame(() => {
        opened.forEach((k, i) => {
          const [pg, id] = k.split(':'), c = document.querySelector(`#view .illustrated-card[data-page="${pg}"][data-task-id="${CSS.escape(id)}"]`);
          if (!c) return;
          c.classList.remove('just-unlocked'); void c.offsetWidth; c.classList.add('just-unlocked');
          setTimeout(() => c.isConnected && c.classList.remove('just-unlocked'), 2400);
        });
        if (DQ.sfx) DQ.sfx('unlock');
      });
    }
    lastPage = page; lastLocked = now; mark();
  } catch (e) {}
  return r;
};
/* picking the new card retires its ribbon */
document.addEventListener('click', e => { const c = e.target.closest && e.target.closest('#view .illustrated-card[data-task-id]'); if (c) { fresh.delete(c.dataset.page + ':' + c.dataset.taskId); c.querySelector('.new-ribbon')?.remove(); } }, true);
})();
