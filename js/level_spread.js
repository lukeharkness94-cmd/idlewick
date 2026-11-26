/* Idlewick: no two things on the same ladder at the same level (owner, 26 Nov 2026: "Don't make any same item the same
   level. For example, copper and tin shouldn't be the same level. If a quest requires someone to quickly carry on
   learning a skill, that's fine"; the owner chose "gathering + each recipe ladder").
   Runs once, after every recipe and gathering spot has been defined and before anything reads their levels:
   - gathering spots (D.NODES, per kind): a later spot sharing a level moves up one (tin: Mining 1 -> 2);
   - recipes: within each category and type of a skill (DQ.recipeGroup g + s, e.g. Smithing > Bronze > Weapons) each
     recipe gets its own level, in definition order (dagger before sword), one above the previous where they clashed.
     Tools spread within their own family (each pickaxe tier is its own level), so different tools may share a level.
   A move never goes more than four levels above the original (a category with no room keeps a shared level rather
   than drifting into the next metal's band; D.LEVEL_SPREAD.kept lists any). Secret recipes are left alone (they are
   learned, not levelled into). The unlock index (D.UNL, D.UNL_SEED) is moved with them so level-ups, Skill levels and
   "Next · Lv N" stay truthful. Equipment requirements are unchanged. */
(() => {
const Q = window.DQ, D = Q.data;
const MAX_UP = 4, moved = [], kept = [];
const moveUnl = (skill, from, to, name) => { const U = D.UNL && D.UNL[skill]; if (!U) return; const list = U[from]; const i = list ? list.indexOf(name) : -1; if (i >= 0) { list.splice(i, 1); if (!list.length) delete U[from]; }
  if (to > 1) (U[to] = U[to] || []).push(name);
  for (const row of D.UNL_SEED || []) if (row[0] === skill && row[1] === from && row[2] === name) { row[1] = to; break; } };
/* spread one ladder in place: items in their existing order, each at least one above the one before when they clash */
/* where two clash, the one a quest asks for keeps its level (the opening's string and wooden trap stay at Crafting 1 and 2) */
const QUEST_EV = ['craft', 'smith', 'cook', 'smelt', 'carve', 'brew'], questKeys = new Set();
for (const q of D.QUESTS || []) for (const o of q.obj || []) if (QUEST_EV.includes(o.ev) && o.key && o.key !== '*') questKeys.add(o.key);
const asked = x => x.out ? (questKeys.has(x.id) || Object.keys(x.out).some(k => questKeys.has(k))) : false;
/* the opening's own route wins a tie outright: Hettie teaches flax string at Crafting 1, the Hunting gate's wooden trap is Crafting 2 */
const OPENING = new Set(['craft_flax_string', 'craft_trap']);
const rank = x => OPENING.has(x.id) ? 0 : asked(x) ? 1 : 2;
/* each item takes the lowest free level at or above its own: the opening's recipes first, then quest ones, then the
   rest in definition order (dagger before sword) */
const spread = (items, skillOf, nameOf, label) => { const taken = new Set(), order = items.map((x, i) => ({ x, i, l: x.lvl || 1, q: rank(x) })).sort((a, b) => a.q - b.q || a.l - b.l || a.i - b.i);
  for (const e of order) { let want = e.l; while (taken.has(want) && want - e.l <= MAX_UP) want++;
    if (want - e.l > MAX_UP) { kept.push(`${label}: ${nameOf(e.x)} stays Lv ${e.l}`); continue; }
    taken.add(want); if (want !== e.l) { moveUnl(skillOf(e.x), e.l, want, nameOf(e.x)); moved.push(`${label}: ${nameOf(e.x)} Lv ${e.l} -> ${want}`); e.x.lvl = want; } } };
/* gathering spots */
for (const [kind, nodes] of Object.entries(D.NODES || {})) spread(nodes, n => n.skill, n => n.name, kind);
/* recipe ladders */
/* tools climb their own family's ladder (axe, pickaxe, gloves...), not one shared list */
const toolFam = r => { const o = Object.keys(r.out || {})[0] || ''; const m = /^tool_([a-z]+)_/.exec(o); return m ? 'tool:' + m[1] : null; };
const groupOf = r => { const t = toolFam(r); if (t) return t; try { const g = Q.recipeGroup ? Q.recipeGroup(r) : { g: r.tab || '', s: '' }; return (g.g || '') + '|' + (g.s || ''); } catch (e) { return (r.tab || '') + '|'; } };
for (const [skill, list] of Object.entries(D.RLIST || {})) { const ladders = {};
  for (const r of list) { if (r.secret || r.cross && r.lead) continue; (ladders[groupOf(r)] = ladders[groupOf(r)] || []).push(r); }
  for (const [g, rs] of Object.entries(ladders)) spread(rs, r => r.skill, r => r.name, `${skill} ${g}`); }
D.LEVEL_SPREAD = { moved, kept };
})();
