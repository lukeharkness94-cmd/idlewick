/* Lettering: Hearthside defaults to bundled Cinzel headings and Alegreya Sans reading/UI text.
   Storybook, Adventurer, Pixel and Original remain available, and explicit saved choices are preserved.
   All fonts are local and embedded by the standalone packager. */
(() => {
const DQ = window.DQ, UI = DQ.ui, root = document.documentElement;
const OPTS = [['hearthside', 'Hearthside', 'Cinzel + Alegreya Sans'], ['storybook', 'Storybook', 'Cinzel + Alegreya'], ['adventurer', 'Adventurer', 'MedievalSharp + Alegreya'], ['pixel', 'Pixel', 'Silkscreen + Pixelify'], ['original', 'Original', 'Alegreya Sans']];
const apply = () => { const v = (DQ.S && DQ.S.settings && DQ.S.settings.lettering) || 'hearthside'; OPTS.forEach(([k]) => root.classList.toggle('type-' + k, k === v)); };
DQ.applyLettering = apply; apply();
UI.DO.lettering = v => { if (!OPTS.some(o => o[0] === v)) return; DQ.S.settings.lettering = v; apply(); DQ.save && DQ.save(); UI.render(false); };
const settings0 = UI.V.settings;
if (settings0) UI.V.settings = () => { const cur = (DQ.S.settings.lettering) || 'hearthside';
  return settings0() + `<section class="panel lettering-set"><div class="phead"><h2>Lettering</h2><small>The game's fonts</small></div><div class="letter-opts">${OPTS.map(([k, n, f]) => `<button class="letter-opt type-sample-${k} ${cur === k ? 'on' : ''}" data-do="lettering" data-a="${k}" aria-pressed="${cur === k}"><b>${n}</b><span>The road to Willowbrook</span><small>${f}</small></button>`).join('')}</div></section>`; };
/* the saved choice arrives with the save: apply it whenever the game renders */
const render0 = UI.render; UI.render = (...a) => { apply(); return render0(...a); };
})();
