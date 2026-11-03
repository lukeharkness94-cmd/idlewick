/* Pack independent cards without letting one tall card hold the next row down. */
(() => {
  const UI = window.DQ.ui;
  let observer, frame;
  const arrange = () => {
    cancelAnimationFrame(frame);
    frame = requestAnimationFrame(() => {
      const grid = document.querySelector('.combat-dashboard');
      if (!grid) return;
      const wide = matchMedia('(min-width:1600px)').matches;
      const gap = parseFloat(getComputedStyle(grid).rowGap) || 14;
      for (const card of grid.children) {
        card.style.gridRowEnd = wide ? `span ${Math.ceil((card.offsetHeight + gap) / (8 + gap))}` : '';
      }
    });
  };
  const render = UI.render;
  UI.render = fresh => {
    observer?.disconnect();
    render(fresh);
    const grid = document.querySelector('.combat-dashboard');
    if (grid) {
      observer ||= new ResizeObserver(arrange);
      observer.observe(grid);
      for (const card of grid.children) observer.observe(card);
      arrange();
    }
  };
  addEventListener('resize', arrange);
})();
