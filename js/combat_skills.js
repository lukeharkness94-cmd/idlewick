/* Idlewick: the combat skills as areas of their own (owner, 22 Nov 2026).
   The left menu gains a Combat group above the skills: Melee, Ranged, Magic, Defence and Health. Melee and Ranged now
   have pages like Magic's: their book of arts (combat_arts.js) and a practice yard. Magic keeps its own page
   (Spellbook, Runes, Alchemy) and leaves the Skills list for the Combat group.
   Practice (drills): a training post for Melee, an archery range for Ranged. Each drill is an ordinary repeating task
   (offline, queue and field guide all work through DQ.KIND_EXT) that needs the matching weapon and pays that style's XP
   at about a fifth to a third of a fair fight (0.22 x your max hit every 3 s, up to 1.3x at better posts) and no Health XP,
   no loot, no coins and no quest kills, so fighting stays the way to progress; drills are for a quiet hour or a
   lagging style. Field-guide entries for drills make them 2% faster each (applied in dur). */
(() => {
const Q = window.DQ, D = Q.data, UI = Q.ui, S = () => Q.S, { esc, ico } = Q;
D.SK.melee.page = 'melee'; D.SK.ranged.page = 'ranged';
D.DRILLS = {
  melee: [
    { id: 'straw', name: 'Straw dummy', lvl: 1, mult: 1, art: 'crop_wheat', text: 'A sack of straw on a post. It never hits back.' },
    { id: 'oak', name: 'Oak post', lvl: 20, mult: 1.1, art: 'plank_oak', text: 'A hardwood post that jars your arms properly.' },
    { id: 'iron', name: 'Iron-bound dummy', lvl: 40, mult: 1.2, art: 'bar_iron', text: 'Swings back on a spring. Keep your guard up.' },
    { id: 'runed', name: 'Runed dummy', lvl: 70, mult: 1.3, art: 'rune', text: 'Knows a little magic and a lot of footwork.' }
  ],
  ranged: [
    { id: 'butts', name: 'Hay-bale butts', lvl: 1, mult: 1, art: 'feather', text: 'Close targets on hay bales. The range provides practice arrows.' },
    { id: 'swing', name: 'Swinging target', lvl: 20, mult: 1.1, art: 'log_oak', text: 'A target on a rope, swinging in the wind.' },
    { id: 'long', name: 'Long range', lvl: 40, mult: 1.2, art: 'arrow_iron', text: 'Targets at the far end of the meadow.' },
    { id: 'wind', name: 'Wind range', lvl: 70, mult: 1.3, art: 'storm_feather', text: 'On the cliff top, where every shot needs judging.' }
  ]
};
const drill = id => { const [st, d] = String(id).split(':'); const row = (D.DRILLS[st] || []).find(x => x.id === d); return row ? { st, row } : null; };
const STYLE_WORD = { melee: 'a melee weapon', ranged: 'a bow' };
Q.drillXp = id => { const x = drill(id); if (!x) return 0; const ps = Q.pstats(); const max = ps.style === x.st ? ps.max : 1; return Math.max(1, Math.round(.22 * max * x.row.mult * 10) / 10); };
const holdsPracticeWeapon = style => !!S().equip.weapon && Q.weaponStyle() === style;
Q.KIND_EXT.drill = {
  valid: id => !!drill(id),
  skillFor: id => (drill(id) || {}).st || 'melee', pageFor: id => (drill(id) || {}).st || 'melee', skill: 'melee', page: 'melee',
  label: a => { const x = drill(a.id); return x ? `Practising at the ${x.row.name.toLowerCase()}` : 'Practising'; },
  dur: id => Math.round(3000 * (1 - (Q.mastSpeed ? Q.mastSpeed('drill', id) : 0))),
  check: id => { const x = drill(id); if (!x) return 'Choose a practice target'; if (Q.lvl(x.st) < x.row.lvl) return `Requires ${D.SK[x.st].name} ${x.row.lvl}`; if (!holdsPracticeWeapon(x.st)) return `Equip ${STYLE_WORD[x.st]} to practise`; return ''; },
  done: a => { const x = drill(a.id); if (!x) return; if (!holdsPracticeWeapon(x.st)) return Q.stopAct(false, `You put down ${STYLE_WORD[x.st]}, so practice stopped.`);
    if (Q.act) Q.act.count++; Q.addXp(x.st, Q.drillXp(a.id)); const st = S().stats; st.drills = (st.drills || 0) + 1; }
};
/* the field guide counts drills like any other repeating task */
if (Q.entryPerk) { const ep0 = Q.entryPerk; Q.entryPerk = (kind, star) => kind === 'drill' ? `${star * 2}% faster` : ep0(kind, star); }
/* ---------- the pages ---------- */
const tabs = {};
const page = st => () => {
  const t = tabs[st] || (tabs[st] = 'book'), hero = UI.skillHero ? UI.skillHero(st) : '';
  const nav = `<nav class="btnrow style-page-tabs" role="tablist"><button class="btn ${t === 'book' ? 'on' : ''}" role="tab" aria-selected="${t === 'book'}" data-do="styletab" data-a="${st}" data-b="book">${ico('book')}${st === 'melee' ? 'Techniques' : 'Shots'}</button><button class="btn ${t === 'drill' ? 'on' : ''}" role="tab" aria-selected="${t === 'drill'}" data-do="styletab" data-a="${st}" data-b="drill">${UI.activityIcon ? UI.activityIcon(st) : ico('attack')}${st === 'melee' ? 'Training yard' : 'Archery range'}</button><button class="btn" data-do="go" data-a="combat">${ico('attack')}Fight</button></nav>`;
  if (t === 'book') return `${hero}${nav}${Q.artsBook(st)}`;
  const L = Q.lvl(st), holding = holdsPracticeWeapon(st);
  const choices = D.DRILLS[st].map(r => { const id = `${st}:${r.id}`, locked = L < r.lvl; return { id, name: r.name, artKind: 'item', artId: r.art, yieldId: null, locked, blocked: locked || !holding, reason: locked ? `Requires ${D.SK[st].name} ${r.lvl}` : !holding ? `Equip ${STYLE_WORD[st]} to practise` : '', short: locked ? 'Lv ' + r.lvl : '', caption: `${D.SK[st].name} ${r.lvl}`, stateText: locked ? 'Locked' : `${Q.drillXp(id)} XP · 3s`, info: `<p>${esc(r.text)}</p><p class="dim">${D.SK[st].name} XP only: no Health XP, loot or coins. ${st === 'ranged' ? ' Practice needs a bow and uses no arrows.' : ''} Fights level you faster.</p>` }; });
  const h = UI.taskPanel(st, st === 'melee' ? 'Training yard' : 'Archery range', 'drill', choices, 'Practise');
  return `${hero}${nav}${h}`;
};
UI.selectStyleBook = style => {
  if (style === 'magic') UI.tab.magic = 'Spellbook';
  else tabs[style] = 'book';
};
UI.focusPractice = (style, id) => {
  tabs[style] = 'drill';
  UI.focusTask(style, id);
};
UI.V.melee = page('melee'); UI.V.ranged = page('ranged');
UI.DO.styletab = (st, t) => { if (!D.DRILLS[st]) return; tabs[st] = t === 'drill' ? 'drill' : 'book'; UI.render(false); };
/* ---------- the left menu: a Combat group above the skills ---------- */
const GROUP = [['melee', 'melee'], ['ranged', 'ranged'], ['magic', 'magic'], ['defence', 'combat'], ['hitpoints', 'combat']];
const SHORT = { hitpoints: 'Health' };
const tiles = () => { const cur = UI.view, ap = Q.act && Q.actSkill ? Q.actSkill() : null;
  return `<div class="cg-tiles" role="group" aria-label="Combat skills">${GROUP.map(([sk, pg]) => { const s = D.SK[sk], lv = Q.lvl(sk), lock = !Q.skillUnlocked(sk);
    return `<button class="cg-tile ${cur === pg && pg !== 'combat' ? 'on' : ''} ${ap === sk ? 'working' : ''} ${lock ? 'locked' : ''}" style="--c:${s.col}" data-do="go" data-a="${pg}" data-tip="rail:${sk}" aria-label="${esc(s.name)} ${lv}">${Q.artImage('skill', sk, 24, 'skill-emblem', s.name)}<span class="cg-t"><b>${esc(SHORT[sk] || s.name)}</b><small class="mono" data-b="lvl:${sk}">${lv}</small></span><span class="bar"><i data-b="xpbar:${sk}"></i></span></button>`; }).join('')}</div>`; };
const rail0 = UI.renderRail;
UI.renderRail = (...a) => { const r = rail0(...a); try { const box = document.getElementById('combatnav'); if (box && !box.querySelector('.cg-tiles')) box.insertAdjacentHTML('beforeend', tiles()); else if (box) box.querySelector('.cg-tiles').outerHTML = tiles(); UI.fitDock && requestAnimationFrame(UI.fitDock); } catch (e) {} return r; };
/* Magic moves from the Skills list to the Combat group */
const order0 = UI.skillDockOrder; UI.skillDockOrder = () => order0().filter(s => s.id !== 'magic');
const r0 = UI.render; UI.render = (...a) => { const r = r0(...a); try { const box = document.getElementById('combatnav'), t = box && box.querySelector('.cg-tiles'); if (t) t.outerHTML = tiles(); else if (box) box.insertAdjacentHTML('beforeend', tiles()); if (UI.upd) UI.upd(); } catch (e) {} return r; };
Q.on('lvl', () => UI.renderRail && UI.renderRail());
Q.on('act', () => UI.renderRail && UI.renderRail());
})();
