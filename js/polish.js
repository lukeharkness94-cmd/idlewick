/* Idlewick: the simplification pass.
   - one idea at a time for new players (a short "first steps" guide, nudges on the right tab)
   - Estate (house + workers), Progress (achievements + mastery) and Settings (+ tuning) share a tab each
   - a calmer Home: the away summary and save reminder live there, nothing else shouts
   - save safety: download / load a file, rolling backups
   - sound and vibration by category
   - a balance sheet (hidden behind a setting) for tuning from real play */
(() => {
const DQ = window.DQ, D = DQ.data, UI = DQ.ui, { $, $$, ico, fmt, esc } = DQ;
const S = () => DQ.S;
const SAVE_KEY = 'dashboard-quest-save-v2', BK_KEY = 'dashboard-quest-backups';

/* ---------- Sound by category, and vibration on touch devices ---------- */
const CAT = { tab: 'ui', click: 'ui', error: 'ui', equip: 'ui', buy: 'ui', sell: 'ui', coin: 'ui', start: 'ui', stop: 'ui', travel: 'ui',
  hit: 'combat', miss: 'combat', hurt: 'combat', eat: 'combat', boss: 'combat', death: 'combat',
  level: 'rewards', perk: 'rewards', ach: 'rewards', quest: 'rewards', unlock: 'rewards', gem: 'rewards', notify: 'rewards' };
const BUZZ = { level: [18, 40, 18], perk: [14, 30, 14], ach: [18, 40, 18], quest: [18, 40, 18], unlock: [12, 30, 12], gem: [14], boss: [40], death: [90] };
const sfx0 = DQ.sfx;
DQ.sfx = name => {
  const st = S().settings;
  if (!DQ.sim.on && st.haptics !== false && BUZZ[name] && !document.hidden && navigator.vibrate) { try { navigator.vibrate(BUZZ[name]); } catch (e) {} }
  const c = CAT[name]; if (c && st.snd && st.snd[c] === false) return;
  sfx0(name);
};

/* ---------- Save safety: rolling backups and files ---------- */
const readBk = () => { try { return JSON.parse(DQ.storage.getItem(BK_KEY)) || []; } catch (e) { return []; } };
DQ.backup = reason => {
  try {
    if (!DQ.S || !DQ.S.xp) return false;
    const L = readBk(); L.unshift({ t: Date.now(), reason: reason || 'auto', hero: DQ.advLvl(), name: DQ.S.name, data: JSON.stringify(DQ.S) });
    while (L.length > 3) L.pop();
    DQ.storage.setItem(BK_KEY, JSON.stringify(L)); return true;
  } catch (e) { try { const L = readBk().slice(0, 1); DQ.storage.setItem(BK_KEY, JSON.stringify(L)); } catch (e2) {} return false; }
};
DQ.backups = () => readBk().map(b => ({ t: b.t, reason: b.reason, hero: b.hero, name: b.name }));
DQ.restoreBackup = i => {
  const b = readBk()[i]; if (!b) return false;
  DQ.backup('before restore');
  try { const o = DQ.validateSave(JSON.parse(b.data)); if (!DQ.importSave(btoa(unescape(encodeURIComponent(JSON.stringify(o)))))) return false; } catch (e) { return false; }
  return true;
};
const importSave0 = DQ.importSave;
DQ.importSave = text => { DQ.backup('before import'); return importSave0(text); };
let bkAcc = 0;
DQ.on('ui', () => { if (!DQ.started || ++bkAcc % 300) return; const L = readBk(); if (!L.length || Date.now() - L[0].t > 20 * 60000) DQ.backup('auto'); });
DQ.downloadSave = () => {
  const text = DQ.exportSave(), d = new Date(), name = `idlewick-${(S().name || 'hero').toLowerCase().replace(/[^a-z0-9]+/g, '-')}-hero${DQ.advLvl()}-${d.toISOString().slice(0, 10)}.txt`;
  try {
    const url = URL.createObjectURL(new Blob([text], { type: 'text/plain' })), a = document.createElement('a'); a.href = url; a.download = name; document.body.appendChild(a); a.click();
    setTimeout(() => { URL.revokeObjectURL(url); a.remove(); }, 500);
  } catch (e) { return DQ.toast('Could not create a file here. Use Copy save text instead.', true); }
  S().exportedAt = Date.now(); DQ.save(); DQ.toast('Backup file saved'); UI.render(false);
};
document.addEventListener('change', e => {
  if (!e.target || e.target.id !== 'impfile') return; const f = e.target.files && e.target.files[0]; if (!f) return;
  const r = new FileReader(); r.onload = () => { if (DQ.importSave(String(r.result))) { DQ.act = null; location.reload(); } else DQ.toast('That file is not a valid Idlewick save', true); }; r.readAsText(f);
});
const ago = t => { const m = Math.round((Date.now() - t) / 60000); return m < 1 ? 'just now' : m < 60 ? `${m} min ago` : m < 2880 ? `${Math.round(m / 60)} h ago` : `${Math.round(m / 1440)} days ago`; };
const savePanel = () => {
  const last = S().exportedAt, L = DQ.backups();
  return `<section class="panel"><div class="phead"><h2>Save data</h2><small class="mono">Autosaves every 10s</small></div><div class="stack">
    <p class="sm dim" style="margin:0">Your game lives in this browser only. ${last ? `Last backup file: <b>${ago(last)}</b>.` : '<b>You have not made a backup file yet.</b>'} A file keeps your hero safe if you clear browser data or change device.</p>
    <div class="btnrow wrap"><button class="btn primary" data-do="dlsave">${ico('save')}Download backup file</button><button class="btn" data-do="ulsave">Load from file</button><input type="file" id="impfile" accept=".txt,.idlewick,text/plain" hidden></div>
    <div class="btnrow wrap"><button class="btn sm" data-do="export">Copy save text</button><button class="btn sm" data-do="import">Paste save text</button><button class="btn sm" data-do="savenow">Save now</button></div>
    ${L.length ? `<div><div class="k" style="margin-bottom:6px">Automatic backups on this device</div><div class="bklist">${L.map((b, i) => `<div class="bkrow"><span><b>${esc(b.name || 'Hero')}</b> · Hero ${b.hero}<small>${ago(b.t)} · ${b.reason}</small></span><button class="btn sm" data-do="bkrestore" data-a="${i}">Restore</button></div>`).join('')}</div></div>` : ''}
    <button class="btn danger" data-do="newgame">Erase and start a new game</button></div></section>`;
};

/* ---------- Settings: sound groups, vibration, tuning, safer save panel ---------- */
const origSet = UI.V.settings;
const togBtn = (on, act, arg, label, sub) => `<button class="tog ${on ? 'on' : ''}" data-do="${act}" data-a="${arg}"><span class="sw"></span><span><b>${label}</b>${sub ? `<small>${sub}</small>` : ''}</span></button>`;
UI.V.settings = () => {
  const st = S().settings, snd = st.snd || {};
  let h = origSet();
  const cats = `<div><div class="k" style="margin-bottom:6px">Which sounds</div><div class="stack tight">${togBtn(snd.ui !== false, 'sndcat', 'ui', 'Interface', 'Clicks, buying, equipping, coins')}${togBtn(snd.combat !== false, 'sndcat', 'combat', 'Combat', 'Hits, damage, eating, bosses')}${togBtn(snd.rewards !== false, 'sndcat', 'rewards', 'Rewards', 'Level-ups, quests, achievements, unlocks')}</div></div>`;
  h = h.replace('Sounds are always varied so they do not repeat exactly.</small></div>', 'Sounds are always varied so they do not repeat exactly.</small></div>' + cats);
  if (navigator.vibrate) h = h.replace(/(<section class="panel"><div class="phead"><h2>Interface<\/h2><\/div><div class="stack">)/, `$1${togBtn(st.haptics !== false, 'hapt', 'x', 'Vibration', 'A short buzz for level-ups and boss fights on phones')}`);
  h = h.replace(/<section class="panel"><div class="phead"><h2>Save data<\/h2>[\s\S]*?<\/section>/, savePanel());
  h = h.replace('<section class="panel"><div class="phead"><h2>About</h2></div>', `<section class="panel"><div class="phead"><h2>About</h2></div><div style="margin-bottom:10px">${togBtn(!!st.dev, 'devtog', 'x', 'Show tuning tools', 'Adds a balance sheet beside Settings. Useful while testing how progress feels')}</div>`);
  return h;
};
Object.assign(UI.DO, {
  sndcat: a => { const st = S().settings; st.snd = st.snd || {}; st.snd[a] = st.snd[a] === false; UI.render(false); if (st.snd[a]) DQ.sfx('tab'); },
  hapt: () => { const st = S().settings; st.haptics = st.haptics === false; if (st.haptics && navigator.vibrate) try { navigator.vibrate(20); } catch (e) {} UI.render(false); },
  devtog: () => { const st = S().settings; st.dev = !st.dev; UI.render(false); },
  dlsave: () => DQ.downloadSave(),
  ulsave: () => { const f = $('#impfile'); if (f) f.click(); },
  bkrestore: a => DQ.modal({ title: 'Restore this backup?', body: '<p>This replaces your current game with the backup. Your current game is saved as a backup first, so you can switch back.</p>', actions: [{ label: 'Restore', primary: true, fn: () => { if (DQ.restoreBackup(+a)) { DQ.act = null; DQ.S = null; location.reload(); } } }, { label: 'Cancel' }] }),
  awaydismiss: () => { if (S().lastAway) S().lastAway.gone = true; UI.render(false); },
  bklater: () => { S().snoozeBk = Date.now() + 3 * 864e5; UI.render(false); },
  guideoff: () => { S().seenTabs.guideOff = 1; UI.render(false); },
});
/* erasing a game keeps one last backup, so a mis-tap is not final */
const nd = UI.DO.newgame; if (nd) UI.DO.newgame = (...a) => { DQ.backup('before erase'); return nd(...a); };

/* ---------- Away summary: it stays on Home until you dismiss it ---------- */
const returnExtras0 = UI.returnExtras;
UI.returnExtras = sum => {
  let h = returnExtras0(sum); const bits = [];
  if ((DQ.awayDone || []).length) bits.push(`Research finished: <b>${DQ.awayDone.map(esc).join(', ')}</b>`);
  const ready = D.QUESTS.filter(q => DQ.questState(q) === 'ready').length; if (ready) bits.push(`<b>${ready}</b> quest reward${ready > 1 ? 's' : ''} ready to claim`);
  return h + (bits.length ? `<p class="sm" style="margin:14px 0 0">${bits.join('<br>')}</p>` : '');
};
DQ.on('welcome', (sum, gap) => {
  const xp = Object.entries(sum.xp || {}).sort((a, b) => b[1] - a[1]).slice(0, 3), items = Object.entries(sum.items || {}).sort((a, b) => ((D.ITEMS[b[0]] || {}).val || 0) * b[1] - ((D.ITEMS[a[0]] || {}).val || 0) * a[1]).slice(0, 3);
  S().lastAway = { at: Date.now(), gap, eff: DQ.offlineEff(gap), xp, items, coins: sum.coins || 0, kills: sum.kills || 0, levels: (sum.levels || []).length, research: (DQ.awayDone || []).slice(), stopped: !!sum.stopped, died: !!sum.died, label: sum.label || '', gone: false };
  DQ.awayDone = [];
});
const awayCard = () => {
  const a = S().lastAway; if (!a || a.gone || Date.now() - a.at > 12 * 3600e3) return '';
  const chips = [...a.xp.map(([k, v]) => `<span class="rw" style="--c:${D.SK[k].col}">${ico(k)}${fmt(v)} XP</span>`), a.coins ? `<span class="rw" style="--c:#f3d58a">${ico('coin')}${fmt(a.coins)}</span>` : '', a.kills ? `<span class="rw" style="--c:#e0564f">${ico('attack')}${fmt(a.kills)} defeated</span>` : '', ...a.items.map(([id, n]) => D.ITEMS[id] ? `<span class="rw" style="--c:${D.ITEMS[id].col}">${ico(D.ITEMS[id].ic)}${fmt(n)}× ${esc(D.ITEMS[id].name)}</span>` : '')].join('');
  const extra = [a.levels ? `${a.levels} level-up${a.levels > 1 ? 's' : ''}` : '', a.research.length ? `research finished: ${a.research.map(esc).join(', ')}` : '', a.stopped ? 'your task stopped early' : '', a.died ? 'you were defeated' : ''].filter(Boolean).join(' · ');
  return `<section data-reference="true" class="panel awaycard"><h3>Your last time away · ${DQ.fmtTime(a.gap)}</h3><div class="phead"><div><span class="k">While you were away</span><h2>${DQ.fmtTime(a.gap)} away, counted as ${DQ.fmtTime(a.eff)}</h2></div><span class="btnrow"><button class="btn sm" data-do="go" data-a="journal">Journal</button><button class="btn sm" data-do="awaydismiss">Dismiss</button></span></div>
    <div class="rws">${chips || '<span class="dim sm">Nothing happened. Start a task before you leave and it keeps going.</span>'}</div>${extra ? `<p class="sm dim" style="margin:8px 0 0">${extra}</p>` : ''}</section>`;
};

/* ---------- Backup reminder: one calm line, only for heroes worth keeping ---------- */
const bkCard = () => {
  if (DQ.advLvl() < 10 || Date.now() < (S().snoozeBk || 0)) return '';
  const last = S().exportedAt || S().created; if (Date.now() - last < 7 * 864e5) return '';
  return `<section class="panel carrot" style="--c:#8fc7ff"><span class="cr-ic">${ico('save')}</span><div class="cr-b"><span class="k">Keep your hero safe</span><b>${S().exportedAt ? 'It has been a while since your last backup' : 'Your game is only stored in this browser'}</b><small>Download a backup file. It takes a second and works on any device.</small></div><div class="cr-act"><button class="btn primary sm" data-do="dlsave">Download backup</button><button class="btn sm" data-do="bklater">Later</button></div></section>`;
};

UI.homeNotices = () => awayCard() + bkCard();

/* ---------- The bell: recent activity, and a dot when something skipped the corner ---------- */
UI.B.belldot = e => { const n = DQ.noteMissed || 0; e.hidden = !n; UI.set(e, n > 9 ? '9+' : String(n)); };
Object.assign(UI.DO, { bell: () => DQ.openBell() });

/* ---------- Balance sheet (Settings > Show tuning tools) ---------- */
const hours = ms => ms == null || !isFinite(ms) ? 'n/a' : ms < 60000 ? '<1 min' : DQ.fmtTime(ms);
const kindName = { fish: 'Fishing', wood: 'Woodcutting', mine: 'Mining', thieve: 'Thieving' };
DQ.balanceRows = () => D.SKILLS.filter(s => s.group === 'gather' && DQ.skillUnlocked(s.id)).map(s => {
  const kind = Object.keys(D.NODES).find(k => D.NODES[k].length && D.NODES[k][0].skill === s.id); if (!kind) return null;
  const L = DQ.lvl(s.id); let best = null;
  D.NODES[kind].forEach(n => {
    if (n.lvl > L) return; const dur = DQ.durFor(kind, n.id), p = DQ.successChance(kind, n), xp = n.xp * DQ.xpMult(s.id) * p * 3600000 / dur, it = D.ITEMS[n.item];
    const val = it ? (it.val || 0) * (1 + DQ.dblChance(s.id)) * p * 3600000 / dur : 0; if (!best || xp > best.xp) best = { n, xp, val, dur };
  });
  if (!best) return null;
  const need = L >= 99 ? 0 : D.XPF[L + 1] - DQ.S.xp[s.id], need5 = L >= 95 ? 0 : D.XPF[Math.min(99, L + 5)] - DQ.S.xp[s.id];
  return { s, L, best, next: need / best.xp * 3600000, next5: need5 / best.xp * 3600000 };
}).filter(Boolean);
UI.V.balance = () => {
  const st = S(), t = st.tele || { adv: {}, first: {} }, ts = DQ.timeStats();
  const rows = DQ.balanceRows().map(r => `<tr><td><span class="dot" style="background:${r.s.col}"></span>${r.s.name}</td><td class="mono">${r.L}</td><td>${esc(r.best.n.name || r.best.n.id)}</td><td class="mono">${fmt(r.best.xp)}</td><td class="mono">${fmt(r.best.val)}</td><td class="mono">${hours(r.next)}</td><td class="mono">${hours(r.next5)}</td></tr>`).join('');
  const adv = Object.entries(t.adv || {}).map(([l, ms]) => [+l, ms]).sort((a, b) => a[0] - b[0]);
  const marks = adv.filter(([l]) => l <= 5 || l % 5 === 0).map(([l, ms], i, arr) => `<tr><td class="mono">Hero ${l}</td><td class="mono">${hours(ms)}</td><td class="mono">${i ? '+' + hours(ms - arr[i - 1][1]) : ''}</td></tr>`).join('');
  const unl = [['Cooking', D.SK.cooking.unlock], ['Mining', D.SK.mining.unlock], ['Task planning', D.PLAN_ADV], ['Farming', D.SK.farming.unlock], ['Smithing (quest)', D.SK.smithing.unlock], ['Thieving (quest)', D.SK.thieving.unlock], ['House', D.HOUSE.adv], ['Crafting (quest)', D.SK.crafting.unlock], ['Research', D.RESEARCH_ADV], ['Ranged (quest)', D.SK.ranged.unlock], ['Workers', D.HIRE.adv], ['Magic (quest)', D.SK.magic.unlock]].sort((a, b) => a[1] - b[1]);
  const first = Object.entries(t.first || {}).sort((a, b) => a[1] - b[1]).map(([k, ms]) => `<tr><td>${esc(k)}</td><td class="mono">${hours(ms)}</td></tr>`).join('');
  return `<section class="panel"><div class="phead"><h2>Balance sheet</h2><small>For tuning. Hidden unless “Show tuning tools” is on in Settings.</small></div>
    <p class="sm dim">Based on your current levels, tools and research. Rates assume you only ever do the best task for XP.</p>
    <div class="btnrow wrap"><span class="rw">Playing <b class="mono">${hours(ts.play)}</b></span><span class="rw">Away <b class="mono">${hours(ts.away)}</b></span><span class="rw">Coins per hour <b class="mono">${fmt(Math.max(0, DQ.coinRate() * 3600000))}</b></span><span class="rw">XP per hour <b class="mono">${fmt(D.SKILLS.reduce((a, x) => a + DQ.xpRate(x.id), 0) * 3600000)}</b></span></div></section>
  <section class="panel"><div class="phead"><h2>Best gathering task, per skill</h2></div><div class="tblwrap"><table class="baltab"><thead><tr><th>Skill</th><th>Lv</th><th>Best task</th><th>XP / h</th><th>Coins / h</th><th>Next level</th><th>+5 levels</th></tr></thead><tbody>${rows || '<tr><td colspan="7" class="dim">No gathering skills yet.</td></tr>'}</tbody></table></div></section>
  <div class="setgrid"><section class="panel"><div class="phead"><h2>When you reached each Hero level</h2><small>Your real play time</small></div><div class="tblwrap"><table class="baltab"><tbody>${marks || '<tr><td class="dim">Play a little to fill this in.</td></tr>'}</tbody></table></div></section>
  <section class="panel"><div class="phead"><h2>Unlock schedule</h2><small>Hero level needed</small></div><div class="tblwrap"><table class="baltab"><tbody>${unl.map(([n, l]) => `<tr><td>${n}</td><td class="mono">Hero ${l}</td><td class="mono">${t.adv && t.adv[l] != null ? hours(t.adv[l]) : st.playtime ? '' : ''}</td></tr>`).join('')}</tbody></table></div></section>
  <section class="panel"><div class="phead"><h2>First times</h2><small>When you first did each thing</small></div><div class="tblwrap"><table class="baltab"><tbody>${first || '<tr><td class="dim">Nothing yet.</td></tr>'}</tbody></table></div></section></div>`;
};
})();
