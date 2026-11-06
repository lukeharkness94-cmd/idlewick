/* Idlewick: the adventure journal. The offline summary grew into a persistent, chronological record of the moments that
   matter: boss victories, story quests and decisions, discoveries, unique finds, new skills, Hero milestones, restored
   places, first arrivals and time spent away. One short line each, grouped by day (Home → Journal). It listens to the
   existing systems (notifications, discoveries, quests, travel, the welcome-back summary); it never notifies by itself.
   Saved as S().journal (newest last, capped); older saves are given one opening entry summarising the story so far. */
(() => {
const DQ = window.DQ, D = DQ.data, UI = DQ.ui, { esc, fmt, ico } = DQ;
const S = () => DQ.S;
const CAP = 200;
const day = t => Math.max(1, Math.floor((t - (S().created || t)) / 864e5) + 1);
const firstSentence = t => { const m = String(t || '').match(/^.*?[.!?](\s|$)/); return (m ? m[0] : String(t || '')).trim(); };
DQ.journal = (kind, text, icon) => {
  if (DQ.forecasting || !S() || !text) return;
  if (!Array.isArray(S().journal)) DQ.journalBackfill();
  const J = S().journal = Array.isArray(S().journal) ? S().journal : [];
  if (J.slice(-4).some(e => e.text === text)) return;
  J.push({ t: Date.now(), kind, text: String(text).slice(0, 280), icon: icon || 'star', town: S().town, away: !!(DQ.sim && DQ.sim.on) });
  if (J.length > CAP) J.splice(0, J.length - CAP);
  if (UI.view === 'journal' && !(DQ.sim && DQ.sim.on)) UI.render(false);
};

/* ---------- what is worth writing down ---------- */
const notify0 = DQ.notify;
DQ.notify = o => {
  try {
    const k = o && (o.key || '');
    if (o.kind === 'boss') DQ.journal('boss', `${o.title}. ${o.text || ''}`.trim(), 'skull');
    else if (o.kind === 'unlock' && k.startsWith('unlock:')) DQ.journal('skill', `You learned ${D.SK[k.slice(7)] ? D.SK[k.slice(7)].name : 'a new skill'}.`, k.slice(7));
    else if (o.kind === 'adv' && (DQ.heroRevealWorthy ? DQ.heroRevealWorthy(o) : true)) DQ.journal('level', `${String(o.title || '').replace(/!$/, '')}.${(o.gains || []).length ? ` New: ${o.gains.join(', ')}.` : ''}`, 'star');
    else if (k.startsWith('slayer:')) DQ.journal('title', `${o.title}.`, 'trophy');
    else if (k.startsWith('project:')) DQ.journal('project', `${o.title}. ${firstSentence(o.text)}`, 'house');
  } catch (e) { /* the journal must never break a notification */ }
  return notify0(o);
};
const disc0 = DQ.makeDiscovery;
DQ.makeDiscovery = (id, o) => { const r = disc0(id, o); if (r) DQ.journal('find', `Discovered ${D.DISCOVERIES[id].name.replace(/^A |^The /, m => m.toLowerCase())}${DQ.sim && DQ.sim.on ? ' while you were away' : ''}.`, 'star'); return r; };
const choose0 = DQ.chooseDiscovery;
DQ.chooseDiscovery = (id, c) => { const r = choose0(id, c); if (r) { const ch = (D.DISCOVERIES[id].choices || []).find(x => x.id === c); if (ch) DQ.journal('choice', `${D.DISCOVERIES[id].name}: you chose to ${ch.label.replace(/\s*\(.*\)$/, '').replace(/^./, m => m.toLowerCase())}.`, 'flag'); } return r; };
const story = q => !!(q.adventure || q.unlocks || q.thanks || q.choices || q.obj.some(o => o.ev === 'boss'));
const claim0 = DQ.claimQuest;
DQ.claimQuest = (id, ...rest) => {
  const q = D.QM[id], before = q && DQ.questState(q); const r = claim0(id, ...rest);
  if (q && before === 'ready' && DQ.questState(q) === 'done' && story(q)) DQ.journal('quest', `Completed “${q.name}” for ${q.giver}.${q.thanks ? ` “${firstSentence(q.thanks)}”` : ''}`, 'quest');
  return r;
};
const travel0 = DQ.travel;
DQ.travel = id => { const first = !(S().towns[id] && S().towns[id].visited); const r = travel0(id); if (first && S().town === id) DQ.journal('travel', `Arrived in ${D.TOWN[id].name} for the first time. ${D.TOWN[id].blurb ? firstSentence(D.TOWN[id].blurb) : ''}`.trim(), 'map'); return r; };
DQ.on('welcome', (sum, gap) => {
  const items = Object.entries(sum.items || {}).sort((a, b) => b[1] - a[1]).slice(0, 2).map(([id, n]) => `${fmt(n)} ${D.ITEMS[id] ? D.ITEMS[id].name.toLowerCase() : id}`);
  const lv = (sum.levels || []).length, bits = [sum.label ? sum.label.toLowerCase() : '', items.join(' and '), lv ? `${lv} level-up${lv > 1 ? 's' : ''}` : '', sum.kills ? `${fmt(sum.kills)} defeated` : ''].filter(Boolean);
  if (gap >= 30 * 60000) DQ.journal('rest', `Away for ${DQ.fmtTime(gap)}.${bits.length ? ` Meanwhile: ${bits.join(', ')}.` : ' The hearth kept warm.'}`, 'moon');
});

/* ---------- older saves: one opening entry with the story so far ---------- */
DQ.journalBackfill = () => {
  const st = S(); if (!st || Array.isArray(st.journal)) return;
  st.journal = [];
  const bosses = D.MONLIST.filter(m => m.boss && st.towns[m.town] && st.towns[m.town].boss).map(m => m.boss.short || m.name);
  const quests = D.QUESTS.filter(q => DQ.questState(q) === 'done').length, finds = Object.keys(D.DISCOVERIES || {}).filter(id => DQ.discovered && DQ.discovered(id)).length;
  if (DQ.advLvl() <= 1 && !quests && !bosses.length) return;
  st.journal.push({ t: Date.now(), kind: 'begin', icon: 'quest', town: st.town, text: `The story so far: Hero level ${DQ.advLvl()}, ${fmt(quests)} quest${quests === 1 ? '' : 's'} completed${bosses.length ? `, ${bosses.join(', ')} defeated` : ''}${finds ? `, ${finds} discover${finds === 1 ? 'y' : 'ies'} made` : ''}. From here, the journal remembers.` });
};

/* ---------- the page ---------- */
UI.journalShown = 60;
UI.V.journal = () => {
  DQ.journalBackfill();
  const J = (S().journal || []).slice().reverse(), shown = J.slice(0, UI.journalShown);
  const groups = []; for (const e of shown) { const d = day(e.t), g = groups[groups.length - 1]; if (g && g.d === d) g.e.push(e); else groups.push({ d, e: [e] }); }
  const art = e => e.kind === 'skill' && D.SK[e.icon] ? DQ.artImage('skill', e.icon, 32, 'jr-art', '') : D.ITEMS[e.icon] ? DQ.itemIco(D.ITEMS[e.icon]) : ico(e.icon || 'star');
  return `<section class="panel journal"><div class="phead"><div><span class="k">${esc(S().name)}’s</span><h2>Adventure journal</h2></div><small>${fmt(J.length)} entr${J.length === 1 ? 'y' : 'ies'}</small></div>
    ${groups.length ? groups.map(g => `<div class="jr-day"><div class="jr-date">Day ${g.d}</div><ol class="jr-list">${g.e.map(e => `<li class="jr-${e.kind}"><span class="jr-ic">${art(e)}</span><span><p>${esc(e.text)}</p><small>${esc(D.TOWN[e.town] ? D.TOWN[e.town].name : '')}${e.away ? ' · while away' : ''} · ${new Date(e.t).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</small></span></li>`).join('')}</ol></div>`).join('')
      : '<p class="dim">Nothing written yet. Your first quest, your first boss and every discovery will be recorded here.</p>'}
    ${J.length > shown.length ? `<button class="btn sm" data-do="journalmore">Show older entries</button>` : ''}</section>`;
};
UI.DO.journalmore = () => { UI.journalShown += 60; UI.render(false); };
})();
