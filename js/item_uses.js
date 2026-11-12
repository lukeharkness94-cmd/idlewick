/* Why you need it, not just what it makes (Nov 2026). Seeds, fish, ore and planks said what they produce but not why
   you want them now. This reads the live save and names, in priority order, the real uses that apply to you today:
   a project you could finish in this town, a hand-in for an active quest, a research step, the next boat you could
   build, or the recipe it feeds. Each use links straight to the place that uses it. Nothing is shown that is not true. */
(() => {
const Q = window.DQ, D = Q.data, UI = Q.ui, S = () => Q.S, { esc, ico, fmt } = Q;
const held = k => k === 'coins' ? S().coins : Q.have(k);
Q.usesOf = id => {
  const it = D.ITEMS[id], out = []; if (!it || it.type === 'tool') return out;
  /* 1 a restoration here that still needs it (the pinned one first) */
  const projects = Object.keys(D.PROJECTS || {}).filter(k => D.PROJECTS[k].town === S().town && !S().projects[k] && (Q.projectNeed(k)[id] || 0) > 0)
    .sort((a, b) => (S().pinnedProject === b) - (S().pinnedProject === a));
  for (const k of projects.slice(0, 1)) out.push({ k: 'project', text: `Used in your ${S().pinnedProject === k ? 'pinned ' : ''}restoration: ${D.PROJECTS[k].name.toLowerCase()} (${fmt(Q.projectNeed(k)[id])} more)`, go: { do: 'openproject', a: k, label: 'Open it' } });
  /* 2 a hand-in an active quest asks for */
  for (const q of D.QUESTS) { if (Q.questState(q) !== 'active') continue; const st = S().q[q.id], o = q.obj.find((o, j) => o.ev === 'deliver' && o.key === id && Q.objProg(q, st, j) < o.n); if (o) { out.push({ k: 'quest', text: `Hand-in for “${q.name}” (${fmt(o.n - Q.objProg(q, st, q.obj.indexOf(o)))} more)`, go: { do: 'go', a: 'quests', label: 'Quests' } }); break; } }
  /* 3 a research step that spends it */
  const tech = (D.TECHS || []).find(t => t.cost && t.cost[id] && !(Q.techDone && Q.techDone(t.id)) && (!t.req || t.req.every(r => Q.techDone(r))));
  if (tech) out.push({ k: 'research', text: `Needed for ${tech.name.replace(/ (I|II|III|IV)$/, '')} research (${fmt(Math.min(held(id), tech.cost[id]))}/${fmt(tech.cost[id])})`, go: { do: 'go', a: 'research', label: 'Scholarship' } });
  /* 4 the next boat you could build */
  const boat = (D.BOATS || []).find(([bid]) => !Q.have(bid)); if (boat) { const r = D.RECIPES['build_' + boat[0].slice(5)]; if (r && r.in[id]) out.push({ k: 'boat', text: `Makes your next boat: the ${boat[1].toLowerCase()} (${fmt(Math.min(held(id), r.in[id]))}/${fmt(r.in[id])})`, go: { do: 'go', a: 'carpentry', label: 'Carpentry' } }); }
  /* 5 a recipe you can already make with it */
  if (out.length < 3) { const r = Object.values(D.RECIPES).filter(r => r.in && r.in[id] && r.skill !== 'carpentry' && Q.skillUnlocked(r.skill) && Q.recipeLvlOk(r)).sort((a, b) => b.lvl - a.lvl)[0];
    if (r) { const o = Object.keys(r.out)[0]; out.push({ k: 'recipe', text: `${{ cooking: 'Cooks into', smithing: 'Smelts or smiths into', crafting: 'Crafts into' }[r.skill] || 'Makes'} ${D.ITEMS[o] ? D.ITEMS[o].name.toLowerCase() : o}`, go: { do: 'go', a: D.SK[r.skill].page || r.skill, label: D.SK[r.skill].name } }); } }
  /* 6 a seed grows into a crop worth something */
  if (!out.length && id.startsWith('seed_')) out.push({ k: 'farm', text: 'Plant it in a field plot', go: { do: 'go', a: 'farming', label: 'Farm' } });
  return out.slice(0, 3);
};
Q.usesHtml = (id, cls = '') => { const u = Q.usesOf(id); if (!u.length) return ''; return `<ul class="item-uses ${cls}" aria-label="Why you need this">${u.map(x => `<li class="u-${x.k}"><span>${esc(x.text)}</span>${x.go ? `<button class="linkish" data-do="${x.go.do}" data-a="${esc(x.go.a)}">${esc(x.go.label)}</button>` : ''}</li>`).join('')}</ul>`; };
/* in every item tooltip and inventory panel */
const tip0 = Q.tips.item;
Q.tips.item = id => { const h = tip0(id); if (!h) return h; const u = Q.usesOf(id); if (!u.length) return h;
  const add = `<div class="tt-k">Why you need it</div><ul class="tt-list">${u.map(x => `<li class="ok"><span class="tt-l">${esc(x.text)}</span></li>`).join('')}</ul>`; return h.replace(/<\/div>\s*$/, add + '</div>'); };
/* on the activity page: under the selected task, the item it makes and why you want it now */
const itemOf = el => { const kind = el.dataset.kind, task = el.dataset.task; if (!task) return null;
  if (kind === 'recipe') { const r = D.RECIPES[task]; return r ? Object.keys(r.out)[0] : null; }
  const n = D.NODE && D.NODE[kind + ':' + task]; return n ? n.item : null; };
const render0 = UI.render;
UI.render = function (...a) { const r = render0.apply(this, a);
  try { const sc = document.querySelector('#view .activity-scene[data-task]'), box = sc && document.querySelector('#view .activity-caption .task-summary');
    if (sc && box && !box.querySelector('.item-uses')) { const id = itemOf(sc); const h = id && Q.usesHtml(id); if (h) box.insertAdjacentHTML('afterbegin', h); } } catch (e) { /* the page is still usable without it */ }
  return r; };
})();
