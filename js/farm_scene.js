/* Idlewick: the farm's work scene (owner, 28 Nov 2026: "worth looking at farming work scenes").
   Farming has no running activity (plots grow on their own clocks), so the Farming page gets its own close-up: the
   farm district (towns.js districtFor 'farm', 240 x 100 at 3x), your first plots' crops standing in the furrow at
   their real growth stage, and the hero hoeing between the rows while anything grows (js/work_rig.js SPEC.hoe: lift,
   bite, draw back). The strike clock (js/strike_sync.js) drives it through DQ.farmWork() whenever no activity stage is
   in view, so the hoe's sound lands on its frame, the brow wipe fits between strokes, clods pile up along the furrow,
   a robin comes for the worms, and the town's weather, hour and season show (js/work_scenes.js) exactly as in the
   other work scenes. Nothing grows: the hero is not in the field. Presentation only: nothing here is saved or
   changes a crop. */
(() => {
const Q = window.DQ, D = Q.data, UI = Q.ui, A = Q.pixelArt, S = () => Q.S;
if (!A || !A.districtFor) return;
const PX = 3, GROUND = 4, SHOW = 6;          /* district px per css px, the ground line, crops shown */
const X = i => 104 + i * 17;                /* each crop's centre along the furrow (district px; the hero hoes at ~99) */
const ACT = { kind: 'farm', id: 'plots', t0: Date.now(), dur: 3200 }; /* two strokes per cycle; one stable object */
const stageOf = p => !p || !p.crop ? -1 : Q.plotRipe(p) ? 3 : Q.plotPct(p) < .08 ? 0 : Q.plotPct(p) < .45 ? 1 : 2;
const growing = () => (S().farm && S().farm.plots || []).some(p => p.crop && !Q.plotRipe(p));
const crops = () => (S().farm.plots || []).slice(0, SHOW).map((p, i) => { const st = stageOf(p);
  if (st < 0) return '';
  const c = D.CROP[p.crop], alt = c ? c.name + (st >= 3 ? ' ready to harvest' : ' growing') : '';
  return `<img class="px farm-crop" data-i="${i}" data-st="${p.crop}:${st}" src="${A.plantUrl(st, p.crop)}" width="${16 * PX}" height="${16 * PX}" alt="${alt}" draggable="false" style="left:calc(50% + ${(X(i) - 120 - 8) * PX}px)">`; }).join('');
UI.farmStage = () => { const town = S().town, on = growing();
  return `<section class="panel farm-work" aria-label="Your farm"><div class="activity-scene farm skill-farming" data-kind="farm" data-task="plots" style="--landscape:url('${Q.districtUrl(town, 'farm', 'farming')}')"><span class="farm-crops">${crops()}</span>${on ? `<span class="scene-worker" aria-hidden="true"><img class="px" src="${Q.heroWorkFigureUrl ? Q.heroWorkFigureUrl(S().look) : Q.heroFigureUrl(S().look)}" width="72" height="96" alt=""></span>` : ''}</div></section>`; };
/* keep the crops' pictures in step with their growth, at most once a second, touching only this scene */
let cropsAt = 0;
const refreshCrops = (sc, now) => { if (now - cropsAt < 1000) return; cropsAt = now; const box = sc.querySelector('.farm-crops'); if (!box) return;
  const want = (S().farm.plots || []).slice(0, SHOW).map((p, i) => stageOf(p) < 0 ? '' : p.crop + ':' + stageOf(p) + '@' + i).join(','), have = [...box.children].map(e => e.dataset.st + '@' + e.dataset.i).join(',');
  if (want !== have) box.innerHTML = crops(); };
/* what the strike clock asks each frame when no activity stage is in view: the farm's stage and its stroke clock */
let stageEl = null;
Q.farmWork = () => {
  if (UI.view !== 'farming' || document.hidden) return null;
  if (!stageEl || !stageEl.isConnected) { const v = document.getElementById('view'); stageEl = v && v.querySelector('.farm-work'); if (!stageEl) return null; }
  const sc = stageEl.firstElementChild; refreshCrops(sc, performance.now());
  if (!sc.querySelector('.scene-worker') || !stageEl.offsetParent) return null;
  return { act: ACT, stage: stageEl };
};
Q.farmAct = ACT;
/* the Farming page: the scene heads the right-hand column (beside the fields it shows) */
const render0 = UI.render;
UI.render = (...a) => { const r = render0(...a); try { if (UI.view === 'farming') { const col = document.querySelector('#view .estate-supplies');
  if (col && !col.querySelector('.farm-work')) col.insertAdjacentHTML('afterbegin', UI.farmStage()); else if (col) { const w = col.querySelector('.farm-work'), on = growing(), has = !!w.querySelector('.scene-worker'); if (on !== has) w.outerHTML = UI.farmStage(); } } } catch (e) { console.error('farm scene', e); } return r; };
})();
