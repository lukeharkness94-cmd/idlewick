/* Idlewick: quest progress pictures (owner, 26 Nov 2026: "each quest [should] have a visual representation on the
   quest screen. For example, if the quest is to build a photo frame, for each piece of wood collected to slowly build
   that frame ... something more visually appealing to accompany just the numbers going up").
   Two pictures, both read from the live quest progress (UI.questProgress); nothing here changes a quest:
   1. Each objective gets a row of up to ten of the thing it asks for: the ore, log, fish, crop, item or creature named
      by the objective (its skill's emblem for "any" objectives, a footprint trail to a flag for visits). They start as
      dark silhouettes and fill in colour as the count rises; with more than ten to get, each picture is a tenth of it.
   2. A quest that makes or teaches something (a main quest's new skill, or a piece of equipment or a tool among its
      rewards) shows that thing as a blueprint beside the objectives, and it assembles block by block, bottom row
      first, as the whole quest fills: the Cold Forge builds its anvil as the ore and logs come in.
   Unmet creatures stay silhouettes (only a defeated one is shown in colour) and nothing is named in alt text, so the
   locked-content rules hold. Sprites stay at whole-number scales. New pieces drop into place over elapsed time;
   under Reduce effects (html.calm) or reduced motion they simply appear. */
(() => {
const Q = window.DQ, D = Q.data, UI = Q.ui, A = Q.pixelArt, S = () => Q.S; if (!A) return;
const CELLS = 10;
const still = () => document.documentElement.classList.contains('calm') || (window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);
const icon = id => ({ url: A.url('qicon:' + id, () => A.iconSprite(id)), w: 16, h: 16 });
const item = id => D.ITEMS[id] && A.itemUrl(id) ? { url: A.itemUrl(id), w: 16, h: 16 } : null;
const mon = id => { const k = String(id).replace(/^wild_/, ''); return A.hasCreature && A.hasCreature(k) ? { url: A.creatureUrl(k), w: 32, h: 32, mon: k } : null; };
const emblem = id => A.emblemUrl && A.emblemUrl(id) ? { url: A.emblemUrl(id), w: 32, h: 32 } : null;
const node = (kind, key) => { const n = (D.NODES[kind] || []).find(x => x.id === key); return n && item(n.item); };
const recipeOut = key => { const r = D.RECIPES && D.RECIPES[key]; const o = r && Object.keys(r.out || {})[0]; return o && item(o); };
const anyItem = key => item(key) || item('cooked_' + key) || item('crop_' + key) || item('raw_' + key) || recipeOut(key);
const SKILL_OF = { mine: 'mining', chop: 'woodcutting', catch: 'fishing', cook: 'cooking', harvest: 'farming', thieve: 'thieving', smelt: 'smithing', smith: 'smithing', craft: 'crafting', brew: 'herbalism', carve: 'carpentry', collect: 'farming' };
/* the picture for one objective: { url, w, h, mon? }; null leaves the row as it was */
Q.objectivePicture = o => { const k = o.key, ev = o.ev; let p = null;
  if (k === '*' && SKILL_OF[ev]) return emblem(SKILL_OF[ev]) || icon(SKILL_OF[ev]);
  if (ev === 'mine') p = node('mine', k); else if (ev === 'chop') p = node('wood', k); else if (ev === 'catch') p = node('fish', k) || anyItem(k);
  else if (ev === 'thieve') p = emblem('thieving'); else if (ev === 'harvest') p = item('crop_' + k) || anyItem(k);
  else if (['kill', 'boss', 'guide'].includes(ev)) p = mon(k); else if (ev === 'guildfight') p = mon(String(k).split(':')[1]);
  else if (ev === 'visit') p = icon('flag'); else if (ev === 'sail') p = emblem('sailing') || icon('sailing'); else if (ev === 'survey') p = icon('map');
  else if (ev === 'train') p = mon(String(k).replace(/^bond_/, '')) || emblem('beastmastery'); else if (ev === 'study') p = icon('research');
  else if (ev === 'guildheal') p = item('bread'); else if (ev === 'guildproof') p = icon('star'); else if (ev === 'pet') p = icon('egg');
  else p = anyItem(k);
  return p || (SKILL_OF[ev] && (emblem(SKILL_OF[ev]) || icon(SKILL_OF[ev]))) || null; };
/* what the quest makes or teaches: the main quest's new skill, else the first equipment or tool among its rewards */
Q.questBuild = q => { if (q.build) return Object.assign({ name: q.buildName || '' }, item(q.build) || emblem(q.build));
  if (q.main && q.unlocks && D.SK[q.unlocks]) { const e = emblem(q.unlocks); if (e) return Object.assign({ name: D.SK[q.unlocks].name }, e); }
  for (const id of Object.keys((q.reward && q.reward.items) || {})) { const it = D.ITEMS[id]; if (it && (it.slot || it.tool || /^tool_/.test(id))) { const p = item(id); if (p) return Object.assign({ name: it.name }, p); } }
  return null; };

/* ---------- objective rows ---------- */
const scale = p => p.w >= 32 ? 1 : 2; /* every cell is 32 px: 16 px sprites at 2x, 32 px sprites at 1x */
const cellsFor = o => Math.min(CELLS, o.n);
const filledFor = (o, v) => Math.min(cellsFor(o), Math.floor(v / o.n * cellsFor(o) + 1e-9));
const rowHtml = (q, j, v) => { const o = q.obj[j], p = Q.objectivePicture(o); if (!p) return ''; const k = scale(p), n = cellsFor(o), f = filledFor(o, v);
  const trail = o.ev === 'visit' && o.n === 1;
  const cells = Array.from({ length: n }, (_, i) => `<i class="qp-cell ${i < f ? 'got' : ''}"><img src="${p.url}" width="${p.w * k}" height="${p.h * k}" alt="" draggable="false"></i>`).join('');
  return `<span class="obj-pic ${trail ? 'trail' : ''}" aria-hidden="true" data-b="qpic:${q.id}:${j}" data-f="${f}">${trail ? '<i class="qp-step"></i><i class="qp-step"></i><i class="qp-step"></i>' : ''}${cells}</span>`; };
UI.B.qpic = (e, id, j) => { const q = D.QM[id]; if (!q) return; const v = UI.questProgress(q).values[+j], f = filledFor(q.obj[+j], v), was = +e.dataset.f;
  if (f === was) return; e.dataset.f = f; e.querySelectorAll('.qp-cell').forEach((c, i) => { const got = i < f; if (got && !c.classList.contains('got') && !still()) { c.classList.add('pop'); setTimeout(() => c.classList.remove('pop'), 700); } c.classList.toggle('got', got); });
  e.classList.toggle('walked', f > 0); };

/* ---------- the blueprint that assembles ---------- */
const pieces = {}; /* url -> { w, h, data, blocks: [[x, y, w, h]] } in build order */
const load = (url, done) => { if (pieces[url]) return done(pieces[url]); const im = new Image(); im.onload = () => { const c = document.createElement('canvas'); c.width = im.width; c.height = im.height; const x = c.getContext('2d'); x.drawImage(im, 0, 0);
  const d = x.getImageData(0, 0, c.width, c.height), bs = Math.max(2, Math.round(Math.max(c.width, c.height) / 8)), blocks = [];
  for (let by = 0; by < c.height; by += bs) for (let bx = 0; bx < c.width; bx += bs) { let any = false; for (let y = by; y < Math.min(by + bs, c.height) && !any; y++) for (let xx = bx; xx < Math.min(bx + bs, c.width); xx++) if (d.data[(y * c.width + xx) * 4 + 3] > 20) { any = true; break; } if (any) blocks.push([bx, by]); }
  /* build order: bottom row first, and within a row a fixed shuffle so it does not read like a printer */
  blocks.sort((a, b) => (b[1] - a[1]) || (((a[0] * 37) % 11) - ((b[0] * 37) % 11)));
  pieces[url] = { w: c.width, h: c.height, img: im, bs, blocks }; done(pieces[url]); }; im.src = url; };
const paint = (cv, P, shown, drop) => { const x = cv.getContext('2d'); x.clearRect(0, 0, cv.width, cv.height); const pad = 4;
  /* the blueprint: every block still to come as a faint silhouette */
  x.save(); x.globalAlpha = .22; x.drawImage(P.img, 0, pad); x.globalCompositeOperation = 'source-atop'; x.fillStyle = '#4f78b8'; x.fillRect(0, 0, cv.width, cv.height); x.restore();
  P.blocks.forEach(([bx, by], i) => { if (i >= shown) return; const dy = drop && drop[i] ? drop[i] : 0; x.clearRect(bx, by + pad, P.bs, P.bs); x.drawImage(P.img, bx, by, P.bs, P.bs, bx, by + pad - dy, P.bs, P.bs); }); };
const shownFor = (P, pct) => Math.round(P.blocks.length * Math.max(0, Math.min(100, pct)) / 100);
const buildHtml = (q, pct) => { const b = Q.questBuild(q); if (!b) return ''; const k = b.w >= 32 ? 3 : 6;
  return `<figure class="quest-build" aria-hidden="true"><canvas width="${b.w}" height="${b.h + 4}" style="width:${b.w * k}px;height:${(b.h + 4) * k}px" data-url="${b.url}" data-b="qbuild:${q.id}" data-pct="${pct}" data-shown="-1"></canvas>${b.name ? `<figcaption>${Q.esc ? Q.esc(b.name) : b.name}</figcaption>` : ''}</figure>`; };
const anim = new Map();
UI.B.qbuild = (cv, id) => { const q = D.QM[id]; if (!q) return; const pr = UI.questProgress(q), pct = pr.state === 'done' || pr.state === 'ready' ? 100 : pr.pct;
  load(cv.dataset.url, P => { const n = shownFor(P, pct), was = +cv.dataset.shown; if (n === was && !anim.has(cv)) return; cv.dataset.shown = n;
    if (was < 0 || n <= was || still()) { anim.delete(cv); return paint(cv, P, n); }
    /* new blocks fall a few pixels into place, staggered, timed by elapsed time */
    const t0 = performance.now(), fresh = Array.from({ length: n - was }, (_, i) => was + i); anim.set(cv, 1);
    const step = t => { const drop = {}; let busy = false; fresh.forEach((i, k) => { const u = Math.min(1, Math.max(0, (t - t0 - k * 70) / 260)); if (u < 1) busy = true; drop[i] = Math.round((1 - u * u) * 6); });
      paint(cv, P, n, drop); if (busy && cv.isConnected) requestAnimationFrame(step); else anim.delete(cv); };
    requestAnimationFrame(step); }); };

/* ---------- put them on the quest card ---------- */
const decorate = () => { const card = document.querySelector('#view .quest-journal[id^="q-"]'); if (!card || card.dataset.pics) return; const q = D.QM[card.id.slice(2)]; if (!q) return;
  card.dataset.pics = '1'; const pr = UI.questProgress(q), box = card.querySelector('.quest-objs'); if (!box) return;
  const rows = [...box.querySelectorAll(':scope > .obj')];
  rows.forEach((row, j) => { if (q.obj[j]) row.insertAdjacentHTML('beforeend', rowHtml(q, j, pr.values[j])); });
  const b = buildHtml(q, pr.pct); if (b && rows.length) { const list = document.createElement('div'); list.className = 'quest-obj-list'; rows[0].before(list); rows.forEach(r => list.append(r)); const wrap = document.createElement('div'); wrap.className = 'quest-obj-build'; list.before(wrap); wrap.append(list); wrap.insertAdjacentHTML('beforeend', b); }
  box.querySelectorAll('[data-b^="qbuild:"],[data-b^="qpic:"]').forEach(e => { const [k, a, c] = e.dataset.b.split(':'); UI.B[k](e, a, c); }); };
const render0 = UI.render;
UI.render = (...a) => { const r = render0(...a); try { decorate(); } catch (e) { /* the quest card keeps its numbers */ } return r; };
/* quest selection and claims redraw the card in place without a full render */
const upd0 = UI.upd; UI.upd = (...a) => { const r = upd0(...a); try { decorate(); } catch (e) { /* as above */ } return r; };
})();
