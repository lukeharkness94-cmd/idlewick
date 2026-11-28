/* Lettering: Hearthside, the default, is pixel lettering (owner, 28 Nov 2026: Silkscreen headings, Pixelify Sans for
   everything else on desktop; on phones sentences keep Alegreya Sans and only labels are pixel). Classic keeps the old
   Cinzel + Alegreya Sans; Storybook, Adventurer and Original remain. The old separate Pixel choice is the default now.
   All fonts are local and embedded by the standalone packager. */
(() => {
const DQ = window.DQ, UI = DQ.ui, root = document.documentElement;
const OPTS = [['hearthside', 'Pixel', 'Silkscreen + Tiny5'], ['terminal', 'Terminal', 'Silkscreen + VT323'], ['classic', 'Classic', 'Cinzel + Alegreya Sans'], ['storybook', 'Storybook', 'Cinzel + Alegreya'], ['adventurer', 'Adventurer', 'MedievalSharp + Alegreya'], ['original', 'Original', 'Alegreya Sans']];
const apply = () => { const st = DQ.S && DQ.S.settings; if (st && st.lettering === 'pixel') st.lettering = 'hearthside'; const v = (st && st.lettering) || 'hearthside';
  /* Classic is the Hearthside layout in its old book faces */
  OPTS.forEach(([k]) => root.classList.toggle('type-' + k, k === v || (k === 'hearthside' && (v === 'classic' || v === 'terminal')))); root.classList.remove('type-pixel'); };
DQ.applyLettering = apply; apply();
UI.DO.lettering = v => { if (!OPTS.some(o => o[0] === v)) return; DQ.S.settings.lettering = v; apply(); DQ.save && DQ.save(); UI.render(false); };
const settings0 = UI.V.settings;
if (settings0) UI.V.settings = () => { const cur = (DQ.S.settings.lettering) || 'hearthside';
  return settings0() + `<section class="panel lettering-set"><div class="phead"><h2>Lettering</h2><small>The game's fonts</small></div><div class="letter-opts">${OPTS.map(([k, n, f]) => `<button class="letter-opt type-sample-${k} ${cur === k ? 'on' : ''}" data-do="lettering" data-a="${k}" aria-pressed="${cur === k}"><b>${n}</b><span>The road to Willowbrook</span><small>${f}</small></button>`).join('')}</div></section>`; };
/* the saved choice arrives with the save: apply it whenever the game renders */
const render0 = UI.render; UI.render = (...a) => { apply(); return render0(...a); };
})();
