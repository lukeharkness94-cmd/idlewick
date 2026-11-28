/* Idlewick: hunting is its own activity, not a fight (owner, 23 Nov 2026: "it's not a fight, it's about tracking,
   laying the trap and then quickly killing. Sometimes we shouldn't successfully kill them and so we go back to hunting").
   Since 28 Nov 2026 the hunt lays a lure instead of a trap (owner: "Hunting shouldn't require a trap, it should require
   a lure - so on the first attempt when hunting, you lay the lure down (something you make in cooking) and then it tells
   you if that animal likes that lure or not, once you've found which lure it likes, its chances of you being able to
   hunt it, increase a lot").
   Hunting → Hunting ground: one ground for the whole world, five tier tabs, eight real game animals in each
   (D.HUNT_GROUND, hunt_tiers_data.js); only your Hunting level matters, never the town you are in.
   Each hunt is one repeating task in three steps: Tracking, Laying the lure, Strike. One lure (Cooking → Lures) is laid
   on every hunt. Every animal secretly prefers one of the eight lures (m.lure): with it the strike lands 80% of the time
   plus 1% per Hunting level above the animal (up to 95%); with any other lure 25% plus 1% a level (up to 45%). The first
   hunt with a lure on an animal tells you plainly whether it likes it or ignores it; that is remembered in the save
   (S.hunt.lures) and shown on the animal's card, its field-guide page and its tooltip from then on.
   A catch gives the animal's drops, a quest kill (DQ.qev('kill')), the creature's field-guide entry (DQ.recordKill) and
   the World Life hooks. No companions (Beastmastery keeps mythical beasts), no combat XP, no damage, no food used.
   Hunting XP per hour roughly matches Fieldwork at the same level; an escape still pays 30% for the tracking.
   An active quest's animal never needs the level or a lure (quests are never blocked); without one it is hunted at the
   ignored-lure odds. It uses DQ.KIND_EXT (kind 'hunt', id = creature id), so offline work, the queue and the Now card
   work as for any other task. */
(() => {
const Q = window.DQ, D = Q.data, UI = Q.ui, S = () => Q.S, { esc, ico } = Q;
D.HUNT_STEPS = [['Tracking', .45, 'paw'], ['Laying the lure', .30, 'pin'], ['Strike', .25, 'dagger']];
const areaOf = id => Object.values(D.AREAS).flat().find(a => a.hunt && a.monsters.some(e => e.id === id)) || null;
const animal = id => { const m = D.MON[id]; return m && m.hl && areaOf(id) ? m : null; };
Q.isAnimal = id => !!animal(id);
const LURES = () => (D.HUNT_LURES || []).map(l => l.id);
/* ---------- lures: what is remembered, what will be laid, what it does to the odds ---------- */
const H = () => { const h = S().hunt = S().hunt || {}; if (!h.lures || typeof h.lures !== 'object') h.lures = {}; if (!h.lureSel || typeof h.lureSel !== 'object') h.lureSel = {}; return h; };
/* true = it likes this lure, false = it ignores it, undefined = not tried on this animal yet */
Q.lureKnown = (id, lure) => { const r = H().lures[id]; return r && lure in r ? !!r[lure] : undefined; };
Q.huntFavourite = id => { const r = H().lures[id] || {}; return Object.keys(r).find(k => r[k]) || null; };
Q.huntLureFound = id => { const m = animal(id); return !!m && !!Q.huntFavourite(id); };
/* the lure the next hunt lays: the one you picked while you hold it; with none picked, the favourite you have found,
   else a lure you have not tried on it yet, else any you hold */
Q.huntLure = id => { const h = H(), sel = h.lureSel[id], held = l => Q.have(l) > 0;
  if (sel && LURES().includes(sel)) return held(sel) ? sel : null;
  const fav = Q.huntFavourite(id); if (fav && held(fav)) return fav;
  return LURES().find(l => held(l) && Q.lureKnown(id, l) === undefined) || LURES().find(held) || null; };
const oddsWith = (m, liked) => { const L = Q.huntLevel ? Q.huntLevel() : Q.lvl('hunting'), d = L - m.hl;
  return liked ? Math.max(.80, Math.min(.95, .80 + .01 * d)) : Math.max(.25, Math.min(.45, .25 + .01 * d)); };
/* the real chance with a given lure (default: the one that would be laid). The page only ever shows a figure the
   player already knows: an untried lure shows both outcomes, never which one it is. */
Q.huntCatch = (id, lure = Q.huntLure(id)) => { const m = animal(id); if (!m) return 0; return oddsWith(m, !!lure && lure === m.lure); };
Q.huntOdds = id => { const m = animal(id); return m ? { liked: oddsWith(m, true), other: oddsWith(m, false) } : { liked: 0, other: 0 }; };
Q.huntDur = id => { const m = animal(id); if (!m) return 6000;
  return Math.max(1500, Math.round((5000 + m.hl * 60) * (Q.speedMult ? Q.speedMult('hunting') : 1))); };
Q.huntXp = (id, caught) => { const m = animal(id); if (!m) return 0; const L = Q.lvl('hunting');
  const base = 8 * (5 + .35 * L) * (Q.huntDur(id) / 8000) * (1 + m.hl / 100) / .75;
  return Math.max(1, Math.round(base * (caught ? 1 : .3))); };
/* what the player actually receives, after the skill's XP multipliers */
Q.huntXpShown = (id, caught) => Math.max(1, Math.round(Q.huntXp(id, caught) * (Q.xpMult ? Q.xpMult('hunting') : 1) * (Q.catchUp ? Q.catchUp('hunting') : 1)));
/* which step the current hunt is on, from how far through the cycle it is */
Q.huntStep = (a = Q.act) => { if (!a || a.kind !== 'hunt') return null; const p = Math.min(1, Math.max(0, (Date.now() - a.t0) / (a.dur || 1)));
  let acc = 0; for (const s of D.HUNT_STEPS) { acc += s[1]; if (p < acc) return s; } return D.HUNT_STEPS[2]; };
/* one short line on what you know about its lures, for the card, the field guide and the tooltip */
Q.huntLureLine = id => { const m = animal(id); if (!m) return ''; const r = H().lures[id] || {}, fav = Q.huntFavourite(id), no = Object.keys(r).filter(k => !r[k] && D.ITEMS[k]).map(k => D.ITEMS[k].name.toLowerCase());
  if (fav) return `Likes ${D.ITEMS[fav].name.toLowerCase()}`;
  return no.length ? `Ignores ${no.join(', ')}` : ''; };
/* ---------- tiers ---------- */
const tierOf = m => D.HUNT_TIERS ? D.HUNT_TIERS[m.tier ?? D.huntTierOf(m.hl)] : null;
Q.huntTierOf = id => { const m = animal(id); return m ? tierOf(m) : null; };
/* any active quest that wants this animal, in any town: such hunts never need the level or a lure */
Q.questWantsAnimal = id => Q.questWantsKill(id);
/* what stands between you and this hunt, as one short reason, or '' */
Q.huntKitNeed = id => { const m = animal(id); if (!m || Q.questWantsAnimal(id)) return '';
  const sel = H().lureSel[id]; if (sel && D.ITEMS[sel] && !Q.have(sel)) return `Needs ${D.ITEMS[sel].name}`;
  return Q.huntLure(id) ? '' : 'Needs a lure'; };
const lootOf = m => { const got = [], out = [];
  for (const [id, [a, b], p] of m.drops || []) { const it = D.ITEMS[id]; if (!it || it.type === 'gear' || it.type === 'ammo' || id === 'coin_pouch' || id === 'treasure_chest') continue;
    if (!Q.chance(Math.min(1, p * (Q.buffMult ? Q.buffMult('luck') : 1)))) continue;
    const n = a + Math.floor(Math.random() * (b - a + 1)); Q.grant(id, n); got.push(id); out.push({ id, n, rar: D.rarityOf ? D.rarityOf(p) : null }); }
  return { got, out }; };
const named = m => (S().beast.kills[m.id] || 0) > 0 ? m.name.toLowerCase() : 'animal';
Q.KIND_EXT.hunt = {
  valid: id => !!animal(id),
  skill: 'hunting', page: 'hunting', skillFor: () => 'hunting', pageFor: () => 'hunting',
  label: a => { const m = animal(a.id), s = Q.huntStep(a); return m ? `${s ? s[0] : 'Hunting'}: ${(S().beast.kills[m.id] || 0) > 0 ? m.name.toLowerCase() : 'unknown quarry'}` : 'Hunting'; },
  dur: id => Q.huntDur(id),
  check: id => { const m = animal(id); if (!m) return 'Choose an animal'; if (!Q.skillUnlocked('hunting')) return 'Learn Hunting first';
    /* one hunting ground for every town (owner, 26 Nov 2026): no travelling, only the Hunting level and a lure */
    const wanted = Q.questWantsAnimal(id); if (!m.ground && !wanted) return 'Not on the hunting ground';
    if (Q.huntLevel() < m.hl && !wanted && !(Q.canHunt && Q.canHunt(m) && Q.questHuntTarget && Q.questHuntTarget() === id)) return `Requires Hunting ${m.hl}`;
    return Q.huntKitNeed(id); },
  done: a => { const m = animal(a.id); if (!m) return Q.stopAct(false, 'That animal is not here.');
    const h = H(), lure = Q.huntLure(a.id), liked = !!lure && lure === m.lure, caught = Q.chance(Q.huntCatch(a.id, lure));
    /* one lure laid per hunt, caught or not */
    if (lure) Q.take(lure, 1);
    /* the first hunt with this lure on this animal tells you whether it likes it (after the roll, never before) */
    const reveal = !!lure && Q.lureKnown(a.id, lure) === undefined && !Q.forecasting;
    if (reveal) (h.lures[a.id] = h.lures[a.id] || {})[lure] = liked ? 1 : 0;
    const stopIfOut = () => { const need = Q.huntKitNeed(a.id); if (need && Q.act === a) Q.stopAct(false, need === 'Needs a lure' ? 'Out of lures. Cook more in Cooking → Lures to keep hunting.' : `${need} to keep hunting.`); };
    Q.addXp('hunting', Q.huntXp(a.id, caught));
    /* which step decided it: a lure it ignores is usually why */
    const failAt = caught ? -1 : (!liked && Math.random() < .6) ? 1 : (r => r < .5 ? 0 : 2)(Math.random());
    const res = { id: m.id, c: caught ? 1 : 0, f: failAt, t: Date.now(), lure, liked: liked ? 1 : 0, reveal: reveal ? 1 : 0 };
    h.recent = [...(h.recent || []), { c: res.c, f: failAt }].slice(-12); a.lastHunt = res;
    if (!Q.sim.on && !Q.forecasting) {
      Q.emit('huntresult', res, m);
      if (reveal) { const ln = D.ITEMS[lure].name, who = caught ? m.name.toLowerCase() : named(m);
        const text = liked ? `The ${who} goes straight for the ${ln.toLowerCase()}. It likes ${ln.toLowerCase()}: about ${Math.round(oddsWith(m, true) * 100)}% a hunt with it.`
          : `The ${who} ignores the ${ln.toLowerCase()}. Try another lure: the one it likes takes the odds to about ${Math.round(oddsWith(m, true) * 100)}%.`;
        Q.log(text, liked ? 'good' : 'warn');
        Q.notify({ kind: 'info', key: 'lure:' + m.id + ':' + lure, icon: 'paw', col: liked ? '#9be07a' : '#d9a066', title: liked ? `It likes ${ln.toLowerCase()}!` : `Ignored: ${ln.toLowerCase()}`, text, sound: false, ttl: 7000 });
        Q.emit('huntlure', res, m); } }
    if (!caught) { h.escaped = (h.escaped || 0) + 1; a.escaped = (a.escaped || 0) + 1; if (!Q.sim.on && !Q.forecasting) { Q.log(`The ${named(m)} slipped away. Back to tracking.`); Q.emit('huntescape', m); } stopIfOut(); return; }
    if (Q.act) Q.act.count++; h.caught = (h.caught || 0) + 1; S().stats.hunts = (S().stats.hunts || 0) + 1;
    const { got, out } = lootOf(m);
    Q.qev('kill', m.id); Q.recordKill(m, got);
    if (!Q.forecasting) { for (const fn of Q.killHooks || []) fn(m); if (Q.recipeOnKill) Q.recipeOnKill(m); if (Q.museumScan && (S().beast.kills[m.id] || 0) <= 1) Q.museumScan(); }
    if (!Q.sim.on && !Q.forecasting) { Q.log(`You catch the ${m.name.toLowerCase()}.${out.length ? ' ' + out.map(o => `${o.n > 1 ? o.n + ' ' : ''}${D.ITEMS[o.id].name.toLowerCase()}`).join(', ') : ''}`, 'good'); Q.emit('huntcatch', m, out); }
    stopIfOut();
  }
};
/* hunts count towards the creature's field-guide page through recordKill, not a second 'hunt' entry */
const tick0 = Q.mastTick; if (tick0) Q.mastTick = (a, ...r) => a && a.kind === 'hunt' ? undefined : tick0(a, ...r);
/* the hunt happens out on the trap lines (towns.js district 'train'); creature pages already hold its field guide */
const du0 = Q.districtUrl; if (du0) Q.districtUrl = (town, kind, ...r) => du0(town, kind === 'hunt' ? 'train' : kind, ...r);
const ml0 = Q.mastLine; if (ml0) Q.mastLine = (kind, id) => kind === 'hunt' ? '' : ml0(kind, id);
const mb0 = Q.mastBadge; if (mb0) Q.mastBadge = (kind, id) => kind === 'hunt' ? '' : mb0(kind, id);
/* ---------- why you need a lure now (item_uses.js): the animals known to like it, from the live save ---------- */
const uses0 = Q.usesOf;
if (uses0) Q.usesOf = id => { const out = uses0(id), l = D.HUNT_LURE && D.HUNT_LURE[id]; if (!l) return out;
  const fans = D.HUNT_GROUND.filter(k => Q.huntFavourite(k) === id).map(k => D.MON[k].name);
  const text = fans.length ? `Lure on the hunting ground: ${fans.slice(0, 3).join(', ')}${fans.length > 3 ? ` and ${fans.length - 3} more` : ''} ${fans.length > 1 ? 'like' : 'likes'} it` : 'Lure on the hunting ground: one is laid on each hunt; try it to see who likes it';
  return [{ k: 'hunt', text, go: { do: 'huntground', a: '', label: 'Hunting' } }, ...out].slice(0, 3); };
/* the creature tooltip names what you know about its lures */
const tipMon0 = Q.tips && Q.tips.mon;
if (tipMon0) Q.tips.mon = id => { const h = tipMon0(id), line = h && animal(id) && (S().beast.kills[id] || 0) > 0 ? Q.huntLureLine(id) : ''; return line ? String(h).replace(/<\/div>\s*$/, `<div class="tt-lure">${esc(line)}</div></div>`) : h; };
/* ---------- routes: anything that tried to fight an animal now hunts it ---------- */
const start0 = Q.startHunt;
Q.startHunt = (areaId, target = null, forQuest = false) => {
  const area = Object.values(D.AREAS).flat().find(a => a.id === areaId);
  /* before Hunting is learned, a quest's animal can still be fought the old way, so the quest stays reachable */
  /* with no target, the best animal on the one ground you can hunt right now */
  if (area && area.hunt && Q.skillUnlocked('hunting')) { const id = target && animal(target) ? target : [...(D.HUNT_GROUND || [])].reverse().find(k => !Q.KIND_EXT.hunt.check(k)); if (!id) return false;
    pick(id); return Q.startAct('hunt', id); }
  return start0(areaId, target, forQuest);
};
const pick = id => { const m = animal(id); if (!m) return; UI.huntMode = 'ground'; UI.huntTier = m.tier ?? D.huntTierOf(m.hl); UI.taskChoice.hunting = id; };
const openHunting = () => UI.view === 'hunting' ? UI.render(false) : Q.go('hunting');
const huntAnimal = id => { if (!animal(id) || !Q.skillUnlocked('hunting')) return false; UI.DO.huntground(id); return true; };
UI.DO.huntground = id => { if (!Q.skillUnlocked('hunting')) return Q.go('hunting'); UI.huntMode = 'ground'; if (id && animal(id)) pick(id); openHunting(); };
const track0 = UI.DO.hunttrack; UI.DO.hunttrack = id => huntAnimal(id) || track0(id);
const hq0 = UI.DO.huntquest; if (hq0) UI.DO.huntquest = id => huntAnimal(id) || hq0(id);
const hg0 = UI.DO.huntgo; if (hg0) UI.DO.huntgo = a => { const id = String(a).split('|')[1]; return huntAnimal(id) || hg0(a); };
/* pick the lure to lay for this animal (a visible button per lure; no dropdown). Picking it again lets the game choose. */
UI.DO.huntlure = arg => { const [id, lure] = String(arg).split('|'); if (!animal(id) || !LURES().includes(lure)) return; const h = H(), before = h.lureSel[id];
  if (before === lure) delete h.lureSel[id]; else h.lureSel[id] = lure;
  if (Q.act && Q.act.kind === 'hunt' && Q.act.id === id) { const need = Q.huntKitNeed(id); if (need) Q.stopAct(false, `${need} to keep hunting.`); }
  Q.save && Q.save(); UI.render(false); };
/* an old save mid-fight with an animal carries on as a hunt */
const resume0 = Q.resumeAfterLoad;
Q.resumeAfterLoad = (...args) => {
  const a = S().act;
  if (a?.kind === 'fight' && animal(a.id) && Q.skillUnlocked('hunting')) {
    S().act = { ...a, kind: 'hunt', progress: 0 };
  }
  /* a hunt saved for an animal that has left the game stops with a note (the old ground's animals, 28 Nov 2026) */
  const b = S().act, gone = b && b.kind === 'hunt' && !animal(b.id);
  const r = resume0(...args);
  if (gone && !Q.act && Q.log) Q.log('The animal you were hunting is no longer on the hunting ground, so that hunt has stopped. Pick another from Hunting.');
  return r;
};
UI.focusHuntingActivity = a => {
  if (a.kind === 'hunt') pick(a.id);
  else {
    UI.huntMode = 'field';
    UI.taskChoice.hunting = a.id;
  }
  openHunting();
};
/* the combat window shows combat areas only */
UI.cwTab = 'areas';
const cw0 = UI.DO.cwtab; if (cw0) UI.DO.cwtab = t => t === 'hunt' ? UI.DO.huntground() : cw0(t);
/* ---------- the Hunting page: Hunting ground | Fieldwork ---------- */
const field0 = UI.V.hunting;
UI.DO.huntmode = mode => { UI.huntMode = mode === 'field' ? 'field' : 'ground'; UI.render(false); };
/* one hunting ground with five tier tabs (owner, 26 Nov 2026: "get rid of there being different towns for each ... Just
   have the different tiers"). Which tier opens first follows your Hunting level. */
const defaultTier = () => { const L = Q.huntLevel(); let t = 0; D.HUNT_TIERS.forEach((T, i) => { if (L >= T.lo) t = i; }); return t; };
/* the animals listed in a tier */
Q.groundTier = i => (D.HUNT_GROUND || []).filter(id => D.MON[id] && D.MON[id].tier === i).map(id => D.MON[id]).sort((a, b) => a.hl - b.hl);
UI.DO.hunttier = i => { UI.huntTier = Math.max(0, Math.min(4, +i || 0)); UI.render(false); };
UI.DO.huntkit = id => { const r = D.RECIPES['craft_' + id] || D.RECIPES['cook_' + id] || D.RECIPES['smith_' + id]; if (!r) return; const bm = UI.view === 'beastmastery'; UI.returnTo = { page: bm ? 'beastmastery' : 'hunting', label: bm ? 'Beastmastery' : 'Hunting' }; UI.focusTask(r.skill, r.id, r.tab, r.skill); };
/* kit counts update live while you hunt (owner, 26 Nov 2026: "need to be able to see how many traps I have left") */
const part = id => { const n = Q.have(id), it = D.ITEMS[id]; return `<button type="button" class="hunt-kit-item ${n ? 'ok' : 'miss'}" data-do="huntkit" data-a="${id}" data-tip="item:${id}" aria-label="${esc(it.name)}: ${n} held, make more">${Q.itemIco(it)}<span>${esc(it.name)}</span><b class="mono" data-b="count:${id}">${n}</b></button>`; };
UI.huntKitPart = part;
/* the five tier tabs, shared with Beastmastery's Capture tab (beast_capture.js) */
UI.huntTierTabs = (cur, action, level) => `<nav class="hunt-tiers btnrow" role="tablist" aria-label="Tiers">${D.HUNT_TIERS.map((t, i) => { const on = i === cur, open = level >= t.lo;
  return `<button type="button" class="btn sm ${on ? 'on' : ''}" role="tab" aria-selected="${on}" data-do="${action}" data-a="${i}">${open ? '' : ico('lock')}${esc(t.name)}<small class="mono">${t.lo}–${t.hi}</small></button>`; }).join('')}</nav>`;
/* a lure is named once you could make it (its recipe's ingredients found) or have held one */
const lureOpen = l => Q.itemDiscovered(l) || (D.RECIPES['cook_' + l] && (!Q.recipeDiscovered || Q.recipeDiscovered(D.RECIPES['cook_' + l])));
/* the lure row: one button per lure with how many you hold and what it does to this animal */
const lureRow = id => { const m = animal(id), lay = Q.huntLure(id), sel = H().lureSel[id], o = Q.huntOdds(id), shown = LURES().filter(lureOpen), hidden = LURES().length - shown.length;
  const btn = l => { const it = D.ITEMS[l], n = Q.have(l), k = Q.lureKnown(id, l), mark = k === true ? '♥' : k === false ? '✗' : '?', say = k === true ? `likes it · ${Math.round(o.liked * 100)}%` : k === false ? `ignores it · ${Math.round(o.other * 100)}%` : 'not tried on it yet';
    return `<button type="button" class="hunt-lure ${l === lay ? 'on' : ''} ${n ? 'ok' : 'miss'} lk-${k === true ? 'yes' : k === false ? 'no' : 'unk'}" data-do="huntlure" data-a="${id}|${l}" aria-pressed="${l === sel}" data-tip="text:${esc(it.name)} · ${n} held · ${say}${l === sel ? ' · chosen (press again to let the game choose)' : ''}" aria-label="${esc(it.name)}: ${n} held, ${say}">${Q.itemIco(it)}<b class="mono" data-b="count:${l}">${n}</b><i aria-hidden="true">${mark}</i></button>`; };
  const make = !lay ? `<button type="button" class="btn sm" data-do="huntkit" data-a="${(sel && D.ITEMS[sel] ? sel : shown[0]) || 'grain_mash'}">${UI.activityIcon ? UI.activityIcon('cooking') : ''}Cook lures</button>` : '';
  return `<div class="hunt-lures"><span class="k">Lure</span><div class="hunt-lure-row">${shown.map(btn).join('')}</div>${make}<small class="dim">One lure per hunt. ${lay ? `Laying ${esc(D.ITEMS[lay].name.toLowerCase())}${sel ? '' : ' (chosen for you)'}.` : 'You hold no lure for this hunt.'}${hidden ? ` ${hidden} more to find in Cooking.` : ''}</small></div>`; };
const oddsLine = id => { const lay = Q.huntLure(id), k = lay ? Q.lureKnown(id, lay) : false, o = Q.huntOdds(id);
  return k === undefined ? `${Math.round(o.other * 100)}% if it ignores the ${esc(D.ITEMS[lay].name.toLowerCase())}, ${Math.round(o.liked * 100)}% if it likes it: this hunt tells you which.` : `${Math.round(Q.huntCatch(id, lay) * 100)}% chance the strike lands; otherwise it slips away and you start tracking again.`; };
const groundPage = () => {
  if (UI.huntTier === undefined) UI.huntTier = defaultTier();
  const T = D.HUNT_TIERS[UI.huntTier], L = Q.huntLevel();
  const ttabs = UI.huntTierTabs(UI.huntTier, 'hunttier', L);
  const choices = Q.groundTier(UI.huntTier).map(m => { const id = m.id, known = (S().beast.kills[id] || 0) > 0, wanted = Q.questWantsAnimal(id), open = L >= m.hl || wanted, need = open ? Q.huntKitNeed(id) : '', lay = Q.huntLure(id), fav = Q.huntFavourite(id), k = lay ? Q.lureKnown(id, lay) : false, pct = Math.round(Q.huntCatch(id, lay) * 100);
    const drops = (m.drops || []).map(d => d[0]).filter((x, i, a) => D.ITEMS[x] && a.indexOf(x) === i && Q.itemDiscovered(x));
    const why = !open ? `Requires Hunting ${m.hl}` : need;
    const state = !open ? 'Locked' : need ? (need === 'Needs a lure' ? 'No lure' : need.replace(/^Needs /, 'No ')) : k === undefined ? 'Try this lure' : fav && lay === fav ? `${pct}% · liked lure` : `${pct}% catch`;
    /* an animal you have not caught yet stays ??? (UI rules: unmet creatures are never named) */
    return { id, name: known ? m.name : '???', artKind: 'creature', artId: id, yieldId: null, locked: !open, revealed: false, blocked: !open || !!need, reason: why, short: !open ? 'Lv ' + m.hl : '',
      caption: `Hunting ${m.hl}${wanted ? ' · Quest' : ''}${fav && known ? ` · <span class="hunt-fav" data-tip="text:Likes ${esc(D.ITEMS[fav].name.toLowerCase())}">${Q.itemIco(D.ITEMS[fav])}</span>` : ''}`, stateText: state,
      info: `<div class="hunt-steps">${D.HUNT_STEPS.map(s => `<span>${ico(s[2])}${s[0]}</span>`).join('<i aria-hidden="true">→</i>')}</div>${open ? lureRow(id) : ''}<p class="dim">${open ? oddsLine(id) : ''} ${Q.huntXpShown(id, true)} Hunting XP a catch, ${Q.huntXpShown(id, false)} if it gets away.</p>${known && Q.huntLureLine(id) ? `<p class="hunt-lure-known">${ico('paw')} ${esc(Q.huntLureLine(id))}</p>` : ''}${drops.length ? `<div class="hunt-drops"><span class="k">Drops</span>${drops.map(x => `<span class="cw-drop" data-tip="item:${x}">${Q.itemIco(D.ITEMS[x])}</span>`).join('')}</div>` : ''}` }; });
  if (!choices.length) return ttabs + UI.emptyState('lens', 'Not a hoofprint.', `No ${esc(T.name.toLowerCase())} animals here.`);
  /* the catalogue's corner gives the tier's level band, not a town: the ground is the same from everywhere */
  return ttabs + UI.taskPanel('hunting', `Hunting ground · ${T.name}`, 'hunt', choices, 'Hunt').replace(`>${D.TOWN[S().town].name}</small>`, `>Hunting ${T.lo}–${T.hi}</small>`);
};
UI.V.hunting = () => {
  if (!Q.skillUnlocked('hunting')) return UI.lockedPage('hunting');
  if (UI.huntMode === 'quarry') UI.huntMode = 'ground';
  if (UI.huntMode === 'field') { const h = field0(); return h.replace(/<nav class="hunt-mode-tabs[\s\S]*?<\/nav>/, tabs()); }
  return tabs() + groundPage() + `<section data-reference="true" class="panel reference-panel" id="hunting-progress">${UI.skillHero('hunting')}</section>`;
};
const tabs = () => `<nav class="hunt-mode-tabs btnrow" role="tablist"><button class="btn ${UI.huntMode !== 'field' ? 'on' : ''}" role="tab" aria-selected="${UI.huntMode !== 'field'}" data-do="huntmode" data-a="ground">${ico('paw')}Hunting ground</button><button class="btn ${UI.huntMode === 'field' ? 'on' : ''}" role="tab" aria-selected="${UI.huntMode === 'field'}" data-do="huntmode" data-a="field">${ico('nest')}Fieldwork</button></nav>`;
if (UI.huntMode === undefined) UI.huntMode = 'ground';
/* the stage says which step the hunt is on */
UI.B.huntstep = e => { const s = Q.huntStep(); UI.set(e, s ? s[0] : ''); };
Q.on('ui', () => { if (UI.view !== 'hunting' || !Q.act || Q.act.kind !== 'hunt') return; const sc = document.querySelector('#view .activity-scene.hunt'); if (!sc || sc.dataset.task !== Q.act.id) return;
  let t = sc.querySelector('.hunt-steptag'); if (!t) { sc.insertAdjacentHTML('beforeend', '<span class="hunt-steptag" role="status"></span>'); t = sc.querySelector('.hunt-steptag'); }
  const s = Q.huntStep(); if (s && t.dataset.s !== s[0]) { t.dataset.s = s[0]; t.innerHTML = `${ico(s[2])}${s[0]}`; sc.dataset.step = D.HUNT_STEPS.indexOf(s); } });
Q.on('huntescape', () => { const sc = document.querySelector('#view .activity-scene.hunt'); if (sc && Q.floatAt) Q.floatAt(sc, 'It got away!', '#d9a066'); });
Q.on('huntcatch', (m, out) => { const sc = document.querySelector('#view .activity-scene.hunt'); if (sc && Q.floatAt) Q.floatAt(sc, out.length ? out.slice(0, 2).map(o => `+${o.n} ${D.ITEMS[o.id].name}`).join(' · ') : 'Caught!', '#f3d58a'); });
/* a lure verdict redraws the card and the lure row, so the heart or cross appears at once */
Q.on('huntlure', res => { const sc = document.querySelector('#view .activity-scene.hunt'); if (sc && Q.floatAt) Q.floatAt(sc, res.liked ? 'It likes this lure!' : 'It ignored the lure', res.liked ? '#9be07a' : '#d9a066'); if (UI.view === 'hunting') setTimeout(() => UI.render(false), 1700); });

/* ---------- how far the hunt has got, and how the last one went (owner, 23 Nov 2026: "more visual at what stage
   you're at with each hunt and whether certain elements were successful") ----------
   A strip of the three steps under the progress bar: the current one lit, the ones behind it ticked. When a hunt
   resolves, the strip shows that hunt's result for a moment: each step that worked gets a tick, the one that failed a
   cross (lost the trail, ignored the lure, missed the strike), and a catch ends on a full row of ticks; a lure tried for
   the first time says whether the animal liked it. Beside it, dots for the last twelve hunts. The scene follows the
   steps: the animal is distant while you track, the lure appears when it is laid, you lunge on the strike, then it is
   caught or bolts. All of it after the roll, never before. */
const FAIL = ['Lost the trail', 'Ignored the lure', 'Missed the strike'];
let showing = null, showTimer = 0;
const stripHtml = () => `<div class="hunt-track" role="status" aria-live="polite"><ol class="hunt-track-steps">${D.HUNT_STEPS.map((s, i) => `<li data-i="${i}"><span class="ht-ico">${ico(s[2])}</span><span class="ht-name">${['Track', 'Lay lure', 'Strike'][i]}</span><span class="ht-mark" aria-hidden="true"></span></li>`).join('')}</ol><div class="hunt-track-out"></div><div class="hunt-recent" aria-label="Last hunts"></div></div>`;
const paint = () => {
  if (UI.view !== 'hunting' || UI.huntMode === 'field') return;
  const stage = document.querySelector('#view .activity-stage'); if (!stage) return;
  const sc = stage.querySelector('.activity-scene'), a0 = Q.act && Q.act.kind === 'hunt' ? Q.act : null;
  /* only the animal you are hunting gets the strip; looking at another card shows its details alone */
  const a = a0 && sc && sc.dataset.task === a0.id ? a0 : null;
  if (!a && !(showing && sc && sc.dataset.task === showing.id)) { stage.querySelector('.hunt-track')?.remove(); sc?.querySelector('.hunt-steptag')?.remove(); if (sc) delete sc.dataset.step; return; }
  let el = stage.querySelector('.hunt-track');
  if (!el) { const after = stage.querySelector('.activity-progress'); if (!after) return; after.insertAdjacentHTML('afterend', stripHtml()); el = stage.querySelector('.hunt-track'); }
  const lis = el.querySelectorAll('.hunt-track-steps li'), out = el.querySelector('.hunt-track-out');
  if (showing) {
    lis.forEach((li, i) => { const st = showing.c ? 'ok' : i < showing.f ? 'ok' : i === showing.f ? 'fail' : 'skip'; if (li.dataset.st !== st) { li.dataset.st = st; li.querySelector('.ht-mark').textContent = st === 'ok' ? '✓' : st === 'fail' ? '✗' : ''; } });
    const verdict = showing.reveal && showing.lure && D.ITEMS[showing.lure] ? ` ${showing.liked ? 'It likes' : 'It ignores'} ${D.ITEMS[showing.lure].name.toLowerCase()}.` : '';
    const txt = (showing.c ? 'Caught!' : `${FAIL[showing.f]}. It got away.`) + verdict; if (out.textContent !== txt) { out.textContent = txt; out.dataset.r = showing.c ? 'ok' : 'fail'; }
  } else {
    const step = a ? D.HUNT_STEPS.indexOf(Q.huntStep(a)) : -1;
    lis.forEach((li, i) => { const st = step < 0 ? 'idle' : i < step ? 'done' : i === step ? 'now' : 'next'; if (li.dataset.st !== st) { li.dataset.st = st; li.querySelector('.ht-mark').textContent = st === 'done' ? '✓' : ''; } });
    const txt = a ? `${Q.huntStep(a)[0]}…` : ''; if (out.textContent !== txt) { out.textContent = txt; out.dataset.r = ''; }
    if (sc && a) { const k = String(step); if (sc.dataset.step !== k) sc.dataset.step = k; }
  }
  const rec = (S().hunt && S().hunt.recent) || [], sig = rec.map(r => r.c + '' + r.f).join(',');
  const box = el.querySelector('.hunt-recent'); if (box.dataset.sig !== sig) { box.dataset.sig = sig;
    box.innerHTML = rec.length ? `<span class="k">Last ${rec.length}</span>${rec.map(r => `<i class="${r.c ? 'ok' : 'fail'}" title="${r.c ? 'Caught' : FAIL[r.f]}"></i>`).join('')}<b class="mono">${rec.filter(r => r.c).length}/${rec.length}</b>` : ''; }
  /* the lure appears in the scene once it is laid */
  if (sc && !sc.querySelector('.hunt-trap')) { const id = Q.act && Q.act.kind === 'hunt' ? Q.huntLure(Q.act.id) : null; if (id && D.ITEMS[id]) sc.insertAdjacentHTML('beforeend', `<span class="hunt-trap hunt-lure-laid" aria-hidden="true">${Q.itemIco(D.ITEMS[id])}</span>`); }
};
Q.on('ui', paint);
Q.on('huntresult', res => {
  showing = res; clearTimeout(showTimer);
  const sc = document.querySelector('#view .activity-scene.hunt'); if (sc) { sc.dataset.result = res.c ? 'caught' : 'escaped'; sc.dataset.step = '2'; }
  paint(); showTimer = setTimeout(() => { showing = null; const s2 = document.querySelector('#view .activity-scene.hunt'); if (s2) delete s2.dataset.result; paint(); }, 1600);
});
})();
