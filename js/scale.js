/* Whole-game scaling (desktop). The game is laid out for a 1920 × 1080 screen and the whole page — text, panels and
   pixel art — is scaled by the window width (innerWidth / 1920), so any other desktop size shows the same layout,
   only larger or smaller. Phones (≤ 860px) keep the responsive layout at 100%.
   CSS zoom does not rescale vh/vw units, so --vh / --vh100 / --vw100 carry the scaled viewport for the stylesheet,
   and DQ.zoom converts screen coordinates (getBoundingClientRect, mouse events) into page pixels for anything placed
   by script. html.short marks a scaled viewport under 940px tall (the compact left column). */
(() => {
  const DQ = window.DQ, root = document.documentElement, BASE = 1920;
  DQ.zoom = 1;
  DQ.toPage = v => v / DQ.zoom;
  const apply = () => {
    const desk = innerWidth > 860, z = desk ? innerWidth / BASE : 1;
    DQ.zoom = z; root.style.zoom = z === 1 ? '' : String(z);
    const h = innerHeight / z, w = innerWidth / z;
    root.style.setProperty('--vh', h / 100 + 'px'); root.style.setProperty('--vh100', h + 'px'); root.style.setProperty('--vw100', w + 'px');
    root.classList.toggle('scaled', desk); root.classList.toggle('short', desk && h < 940);
  };
  apply(); addEventListener('resize', apply);
})();
