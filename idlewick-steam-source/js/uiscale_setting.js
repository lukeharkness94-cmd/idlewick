/* Settings → Interface size: Smaller / Standard / Larger, on top of the automatic fit (js/scale.js). Desktop only. */
(() => {
  const DQ = window.DQ, UI = DQ.ui;
  const OPTS = [[0.9, 'Smaller'], [1, 'Standard'], [1.15, 'Larger']];
  UI.DO.uiscale = v => { DQ.S.settings.uiScale = +v; DQ.applyScale && DQ.applyScale(); DQ.save && DQ.save(); UI.render(false); };
  const settings0 = UI.V.settings;
  if (settings0) UI.V.settings = () => { const cur = +(DQ.S.settings.uiScale || 1);
    return settings0() + `<section class="panel ui-size"><div class="phead"><h2>Interface size</h2><small>Desktop · fits your screen automatically, then this</small></div><div class="btnrow wrap">${OPTS.map(([v, n]) => `<button class="btn ${Math.abs(cur - v) < .01 ? 'primary' : ''}" data-do="uiscale" data-a="${v}" aria-pressed="${Math.abs(cur - v) < .01}">${n}</button>`).join('')}</div></section>`; };
})();
