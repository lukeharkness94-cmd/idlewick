/* Desktop scaling with a readability floor.
   The game is designed at 1920 × 1080. Larger desktops zoom the whole page up by width / 1920, but never more than
   height / 1080 (so an ultrawide screen gains width rather than giant text; height never shrinks a 1920 screen), times the player's Interface size
   (Settings: 90%, 100%, 115%) so the layout and pixel
   art fill the screen. Narrower desktops zoom down only as far as MIN_ZOOM; below that the page stays at MIN_ZOOM and
   the layout itself adapts (wrapping columns, compact rows) instead of shrinking text and controls further.
   At 85% the 16.5px body text still renders at 14px and 44px controls at 37px.
   Phones and small tablets (≤ 860px) use the responsive layout at 100%.
   CSS zoom does not rescale vh/vw units, so --vh / --vh100 / --vw100 carry the scaled viewport for the stylesheet,
   and DQ.toPage() converts screen coordinates (getBoundingClientRect, mouse events) into page pixels for anything
   placed by script. Classes on <html>: scaled (desktop), short (page height under 940px), lw-1600 / lw-1300 (page
   width under 1600 / 1300 page pixels: layouts drop to fewer columns), lw-wide (over 2300 page pixels: ultrawide). */
(() => {
  const DQ = window.DQ, root = document.documentElement, BASE = 1920, BASE_H = 1080, MIN_ZOOM = 0.85;
  DQ.zoom = 1;
  DQ.toPage = v => v / DQ.zoom;
  const apply = () => {
    /* fit the 1920 × 1080 design by whichever side is tighter, so ultrawide screens do not blow the interface up
       (3440 × 1440 is 133%, not 179%) and the extra width goes to the layout; then the player's Interface size choice */
    const pref = DQ.S && DQ.S.settings && +DQ.S.settings.uiScale || 1;
    const desk = innerWidth > 860, z = desk ? Math.max(MIN_ZOOM, Math.min(innerWidth / BASE, Math.max(1, innerHeight / BASE_H)) * pref) : 1;
    DQ.zoom = z; root.style.zoom = z === 1 ? '' : String(z);
    const h = innerHeight / z, w = innerWidth / z;
    root.style.setProperty('--vh', h / 100 + 'px'); root.style.setProperty('--vh100', h + 'px'); root.style.setProperty('--vw100', w + 'px');
    root.classList.toggle('scaled', desk); root.classList.toggle('short', desk && h < 940);
    root.classList.toggle('lw-1600', desk && w < 1600); root.classList.toggle('lw-1300', desk && w < 1300); root.classList.toggle('lw-wide', desk && w > 2300);
  };
  DQ.applyScale = apply;
  apply(); addEventListener('resize', apply);
})();
