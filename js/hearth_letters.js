/* Idlewick: letters on the desk (owner, 27 Nov 2026: "subtle polish"). Now and then someone you have met through their
   quests leaves a short letter on the hearth's desk, in their own voice (js/folk_personality.js D.FOLK_LETTERS): a tip
   that is true for the save at the moment it is written (a skill close to its next perk, a restoration you could hand
   something to or finish, how far along the goal you are on, whether you are ready for the next boss) or a bit of
   gossip. Rules: none in the first 20 minutes of play, then one every 45 to 90 minutes of visible play at most, never
   more than three waiting (the clock holds while three are unread). The hearth draws them as envelopes on the desk; a
   click opens one on parchment, and read letters are kept in the Journal (Story) under Letters. Saved in S.letters
   (list, played, next); nothing is ever removed. Never in a simulation or forecast. tests/hearth-life.cjs. */
(() => {
const Q = window.DQ, D = Q.data, UI = Q.ui, S = () => Q.S, { esc, ico } = Q;
const MIN = 60000, FIRST = [20 * MIN, 45 * MIN], GAP = [45 * MIN, 90 * MIN], CAP = 3;
const span = ([a, b]) => a + Math.random() * (b - a);
const box = () => { const st = S(); if (!st.letters || typeof st.letters !== 'object' || !Array.isArray(st.letters.list)) st.letters = { list: [], played: 0, next: 0 };
  const L = st.letters; if (!(L.played >= 0)) L.played = 0; if (!L.next) L.next = L.played + span(FIRST); return L; };
Q.lettersWaiting = () => (S() ? box().list.filter(l => !l.read) : []);
Q.lettersRead = () => (S() ? box().list.filter(l => l.read) : []);
Q.LETTER_RULES = { first: FIRST, gap: GAP, cap: CAP };

/* ---------- what a letter can truthfully say right now ---------- */
const folk = id => D.FOLK.find(f => f.id === id);
const metIds = () => (Q.folkMet ? Q.folkMet() : []).map(f => f.id);
/* who writes about what: the person whose trade it is, if you know them */
const BY_SKILL = { mining: ['brannoc', 'dagna', 'dunmore'], smithing: ['tolla', 'grotta', 'kael', 'brannoc'], cooking: ['mabel', 'piers', 'brunn'], fishing: ['ilsa', 'piers'], crafting: ['hettie'],
  thieving: ['whisper'], ranged: ['wynn'], hunting: ['wynn'], farming: ['bramble'], magic: ['merrow'], research: ['merrow', 'seren'], herbalism: ['alder'], woodcutting: ['sorrel', 'wynn'], carpentry: ['sorrel'],
  sailing: ['ilsa', 'sorrel'], beastmastery: ['bramble', 'wynn'], melee: ['orrin', 'hrod'], defence: ['orrin', 'hrod'], hitpoints: ['mabel'], enchanting: ['merrow'], exploration: ['aldous'] };
const giverOf = name => { const f = Q.folkOf && Q.folkOf(name); return f ? f.id : null; };
const lvls = n => n === 1 ? 'one level' : `${n} levels`;
const tips = () => { const out = [], st = S();
  /* the goal on the notice board, from its own giver */
  const g = Q.homeGoalNow, gq = g && D.QM && D.QM[g.id];
  if (g && gq) { const who = giverOf(gq.giver);
    if (g.state === 'ready') out.push({ kind: 'goal', top: true, who: [who], page: 'quests', go: 'Open Quests', text: `“${g.name}” is done, as far as I can tell. Come and hand it in when you are passing.` });
    else if (g.state === 'active' && g.need > 1 && g.have > 0 && g.have < g.need) out.push({ kind: 'goal', who: [who], page: 'quests', go: 'Open Quests', text: `${g.label}: ${g.have} of ${g.need} so far, for “${g.name}”. ${g.need - g.have} to go.` }); }
  /* a skill one to three levels short of a named perk */
  for (const s of D.SKILLS || []) { if (!Q.skillUnlocked || !Q.skillUnlocked(s.id) || !UI.nextUnlock || !UI.unlockShort) continue; const nx = UI.nextUnlock(s.id), perks = nx && UI.unlockShort(nx); if (!perks) continue;
    const gap = nx.lvl - Q.lvl(s.id); if (gap >= 1 && gap <= 3) out.push({ kind: 'perk', who: BY_SKILL[s.id] || [], page: s.page, go: `Open ${s.name}`, text: `Your ${s.name} is ${lvls(gap)} off ${nx.lvl}. At ${nx.lvl} you get ${perks}.` }); }
  /* a restoration you could finish, or hand something to */
  for (const [id, p] of Object.entries(D.PROJECTS || {})) { if (p.relic || st.projects[id] || !(Q.townUnlocked && Q.townUnlocked(p.town)) || !Q.projectState) continue; const ps = Q.projectState(id), place = p.name.replace(/^\w+ the /, 'the '), town = D.TOWN[p.town].name, who = [giverOf((D.PROJECT_VOICES || {})[id] && D.PROJECT_VOICES[id][0])].concat(D.FOLK.filter(f => f.town === p.town).map(f => f.id));
    if (ps === 'ready') out.push({ kind: 'project', top: true, who, page: 'projects', go: 'Open Town projects', text: `Everything ${place} in ${town} needs is in your pack. It only wants finishing.` });
    else if (ps === 'can' && Q.contributionText) out.push({ kind: 'project', who, page: 'projects', go: 'Open Town projects', text: `You could hand ${Q.contributionText(id)} to ${place} in ${town} today.` }); }
  /* the next boss: ready, or nearly */
  const b = Q.regionBoss && Q.regionBoss(); if (b && b.boss && Q.townUnlocked && Q.townUnlocked(b.town)) { const cl = Q.combatLvl(), req = b.boss.req, nm = b.boss.short || b.name, who = ['orrin', 'hrod', 'ignis', 'wynn', 'vess'].concat(D.FOLK.filter(f => f.town === b.town).map(f => f.id));
    if (cl >= req) out.push({ kind: 'boss', top: true, who, page: 'combat', go: 'Open Fight', text: `${nm} wants combat level ${req}. You are ${cl}. I am only saying.` });
    else if (req - cl <= 4) out.push({ kind: 'boss', who, page: 'combat', go: 'Open Fight', text: `${lvls(req - cl).replace(/^./, c => c.toUpperCase())} of combat and you could take on ${nm}. ${D.TOWN[b.town].name} would sleep better.` }); }
  return out; };

/* ---------- writing one ---------- */
const pick = a => a[Math.floor(Math.random() * a.length)];
Q.letterWrite = (o = {}) => { if (!S() || Q.forecasting || (Q.sim && Q.sim.on)) return null; const L = box(), met = metIds().filter(id => D.FOLK_LETTERS && D.FOLK_LETTERS[id]); if (!met.length) return null;
  if (!o.force && Q.lettersWaiting().length >= CAP) return null;
  const sent = id => L.list.filter(l => l.from === id).length, usedLines = id => L.list.filter(l => l.from === id && l.kind === 'gossip').map(l => l.text);
  /* tips and gossip take turns (a tip first); a tip goes to whoever knows that trade, if you have met them */
  const T = tips(), wantTip = o.kind ? o.kind !== 'gossip' : L.list.length % 2 === 0;
  let from, kind = 'gossip', text = '', page = null, go = null;
  if (wantTip && T.length) { const lastKind = (L.list.filter(l => l.kind !== 'gossip').slice(-1)[0] || {}).kind;
    /* something not said lately, from someone whose trade it is, and not the same kind of tip twice running */
    let pool = o.kind && o.kind !== 'tip' ? T.filter(x => x.kind === o.kind) : T.filter(t => !L.list.slice(-6).some(l => l.text === t.text));
    if (!pool.length) pool = T; const own = pool.filter(t => (t.who || []).some(id => met.includes(id))); if (own.length) pool = own; const other = pool.filter(t => t.kind !== lastKind); if (other.length) pool = other;
    const top = pool.filter(t => t.top); const t = pick(top.length ? top : pool); /* something you could do today comes first */
    from = (t.who || []).find(id => id && met.includes(id)) || met.slice().sort((a, b) => sent(a) - sent(b))[0]; kind = t.kind; text = t.text; page = t.page; go = t.go; }
  if (!text) { const pool = met.filter(id => D.FOLK_LETTERS[id].gossip.some(g => !usedLines(id).includes(g))); from = (pool.length ? pool : met).slice().sort((a, b) => sent(a) - sent(b))[0];
    const lines = D.FOLK_LETTERS[from].gossip, unused = lines.filter(g => !usedLines(from).includes(g)); text = pick(unused.length ? unused : lines); }
  const V = D.FOLK_LETTERS[from], n = L.list.length + 1;
  const letter = { id: 'L' + n + '-' + Date.now().toString(36), from, kind, hi: V.hi, text, bye: V.bye, at: Date.now(), town: S().town, read: false };
  if (page) Object.assign(letter, { page, go });
  L.list.push(letter);
  if (!o.quiet) { const f = folk(from); Q.notify && Q.notify({ kind: 'info', key: 'letter:' + letter.id, icon: 'quest', col: '#d8a64a', page: 'overview', title: `A letter from ${f.n}`, text: 'It is waiting on your desk at home.', sound: false, ttl: 6000 }); }
  Q.save && Q.save(); if (UI.view === 'overview' || UI.view === 'journal') UI.render(true); return letter; };

/* the letter clock: visible play only, a hidden tab and time away do not count */
let last = Date.now();
Q.letterTick = dt => { if (!S() || (Q.sim && Q.sim.on) || Q.forecasting) return; const L = box(); L.played += Math.max(0, Math.min(dt, 5000));
  if (L.played < L.next) return;
  if (Q.lettersWaiting().length >= CAP) { L.next = L.played + 10 * MIN; return; }
  L.next = L.played + span(GAP); if (!Q.letterWrite()) L.next = L.played + 10 * MIN; };
Q.on && Q.on('ui', () => { const now = Date.now(), dt = now - last; last = now; if (typeof document !== 'undefined' && document.hidden) return; Q.letterTick(dt); });

/* ---------- reading ---------- */
const when = t => new Date(t).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
Q.letterHtml = l => { const f = folk(l.from) || { n: 'A friend' };
  return `<div class="letter-paper"><div class="letter-head">${Q.folkPortrait ? Q.folkPortrait(f.n, 64, 'letter-face') : ''}<span><b>${esc(f.n)}</b><small>${esc(f.role || '')}${D.TOWN[f.town] ? ' · ' + esc(D.TOWN[f.town].name) : ''} · ${esc(when(l.at))}</small></span></div>
    <p class="letter-hi">${esc(l.hi)}</p><p>${esc(l.text)}</p><p class="letter-bye">${esc(l.bye)}</p><p class="letter-sign">${esc(f.n)}</p></div>`; };
UI.DO.letteropen = id => { const L = box(), l = L.list.find(x => x.id === id) || Q.lettersWaiting()[0]; if (!l) return; const f = folk(l.from) || { n: 'A friend' };
  if (!l.read) { l.read = true; l.readAt = Date.now(); Q.save && Q.save(); }
  const acts = [{ label: Q.lettersWaiting().length ? 'Next letter' : 'Keep it in the Journal', primary: true, fn: () => { const nx = Q.lettersWaiting()[0]; if (nx) { setTimeout(() => UI.DO.letteropen(nx.id), 0); } } }];
  if (l.page && l.go) acts.unshift({ label: l.go, fn: () => { Q.go(l.page); } });
  Q.modal({ title: `A letter from ${f.n}`, body: Q.letterHtml(l), actions: acts });
  if (UI.view === 'overview' || UI.view === 'journal') UI.render(true); };

/* ---------- the Journal keeps every letter you have read ---------- */
const journal0 = UI.V.journal;
if (journal0) UI.V.journal = (...a) => { const h = journal0(...a), R = Q.lettersRead().slice().reverse(); if (!R.length) return h;
  const rows = R.map(l => { const f = folk(l.from) || { n: 'A friend' }; return `<button class="letter-row" data-do="letteropen" data-a="${esc(l.id)}" aria-label="${esc(`Letter from ${f.n}, ${when(l.at)}`)}">${Q.folkPortrait ? Q.folkPortrait(f.n, 32, 'letter-face') : ''}<span><b>${esc(f.n)}</b><small>${esc(when(l.at))}</small><em>${esc(l.text)}</em></span></button>`; }).join('');
  return `<section class="panel letters-panel"><div class="phead"><h2>${ico('quest')}Letters</h2><small>${R.length} kept</small></div><div class="letter-list">${rows}</div></section>` + h; };
})();
