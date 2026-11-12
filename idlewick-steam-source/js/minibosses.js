/* Mini-bosses (Nov 2026): named challenges between a region's ordinary creatures and its boss, so the climb from
   Grubnash (level 12, challenge from Combat 8) to Old Tusk (level 26, from Combat 18) has steps to aim for.
   Gnarlroot (level 18, from Combat 13) and the Rookmother (level 22, from Combat 16) each have a special attack, a
   weakness worth preparing for, a guaranteed piece of gear on the first victory, and a quest from a Mossbarrow local.
   They are fought directly from the Challenges strip (never in random encounters) and are added after hunting areas
   and wild companions are built, so existing companions and saves are unchanged. */
(() => {
const DQ = window.DQ, D = DQ.data, UI = DQ.ui, S = () => DQ.S, { esc, ico } = DQ;
/* stats follow data.js's mon() scaling (health x0.62, max hit x0.72) */
const mini = (id, name, town, cl, hp, max, att, def, coins, col, drops, info) => {
  const m = { id, name, town, cl, hp: Math.round(hp * .62), max: Math.max(1, Math.round(max * .72)), att, def, coins, col, drops, mini: info };
  D.MON[id] = m; D.MONLIST.push(m); return m;
};
mini('gnarlroot', 'Gnarlroot', 'mossbarrow', 18, 52, 4, 15, 17, [40, 90], '#7a5a3a',
  [['log_oak', [4, 8], 1], ['seed_cabbage', [2, 4], .5], ['coin_pouch', [1, 1], .3], ['iron_shield', [1, 1], .04], ['treasure_chest', [1, 1], .05]],
  { short: 'Gnarlroot', req: 13, first: 'iron_shield', special: { every: 4, mult: 1.4, name: 'Root snare' }, won: 'The orchard is quiet. Granny Bramble’s apple trees can grow in peace.' });
mini('rookmother', 'The Rookmother', 'mossbarrow', 22, 70, 5, 17, 13, [70, 150], '#3a3a4a',
  [['feather', [10, 20], 1], ['coin_pouch', [1, 1], .45], ['iron_body', [1, 1], .04], ['bow_oak', [1, 1], .04], ['treasure_chest', [1, 1], .08]],
  { short: 'Rookmother', req: 16, first: 'iron_body', special: { every: 3, mult: 1.4, name: 'Diving strike' }, won: 'The rooks scatter from the wheat fields. Hunter Wynn raises a cup to you.' });
D.WEAK.gnarlroot = { weak: ['fire', 'slash'], resist: ['crush', 'pierce'] };
D.WEAK.rookmother = { weak: ['pierce', 'storm'], resist: ['crush'] };
if (D.LORE) {
  D.LORE.gnarlroot = { note: 'An old orchard stump that walked off one wet spring and never came back quietly. Every few blows it snares you in its roots. Axes and fire bite deep; hammers and arrows barely mark it.', legend: 'Granny Bramble says it was the first apple tree in Mossbarrow, planted by her own great-grandmother, and that it is only cross because nobody has pruned it in eighty years.' };
  D.LORE.rookmother = { note: 'The great crow that leads the rooks of the wheat fields. She dives every third pass, hard. Arrows and lightning bring her down; blunt weapons just ruffle her.', legend: 'Hunter Wynn has been trying to shoot her since he was a boy. He swears she remembers him, and laughs.' };
}
/* quests that point at them, from Mossbarrow locals */
const quest = q => { if (D.QM[q.id]) return; D.QUESTS.push(q); D.QM[q.id] = q; };
quest({ id: 'mb_gnarlroot', town: 'mossbarrow', name: 'Roots in the Orchard', giver: 'Granny Bramble', adv: 12, req: null,
  blurb: 'Something old has woken in Granny Bramble’s orchard: a stump that walks, and swats anyone who comes near the apples. She would like it to stop, please, before harvest.',
  obj: [{ ev: 'guide', key: 'gnarlroot', n: 1, label: 'Study Gnarlroot in your field guide' }, { ev: 'kill', key: 'gnarlroot', n: 1, label: 'Defeat Gnarlroot in the orchard' }],
  reward: { xp: { strength: 1400, defence: 900 }, coins: 400 }, thanks: 'There. It only wanted pruning, poor old thing. Take some coins, and come by for pie.' });
quest({ id: 'mb_rookmother', town: 'mossbarrow', name: 'The Rookmother', giver: 'Hunter Wynn', adv: 15, req: null,
  blurb: 'The rooks are stripping the wheat fields bare, and their mother is bigger than a dog. Hunter Wynn has missed her for twenty years. He would like someone else to try.',
  obj: [{ ev: 'guide', key: 'rookmother', n: 1, label: 'Study the Rookmother in your field guide' }, { ev: 'kill', key: 'rookmother', n: 1, label: 'Bring down the Rookmother' }],
  reward: { xp: { attack: 1800, hitpoints: 1000 }, coins: 650 }, thanks: 'Twenty years! And you just walked up and did it. I am going to need a drink, and so are you.' });

/* ---------- art: two original creatures, drawn in the house style ---------- */
const A = DQ.pixelArt;
if (A && A.CREATURE_SPECS) {
  const { Spr, ramp, mix } = A, rp = c => ramp(c);
  A.CREATURE_SPECS.gnarlroot = () => { const s = Spr(32, 32), bark = rp('#7a5a3a'), dark = rp('#4a3424'), moss = rp('#5f9a45'), ring = rp('#c8a070');
    /* roots for legs, a squat trunk, a cut top with rings, branch arms, moss and glowing knot-eyes */
    s.poly([[8, 30], [11, 24], [13, 25], [11, 31]], dark); s.poly([[24, 30], [21, 24], [19, 25], [21, 31]], dark); s.poly([[14, 31], [15, 25], [17, 25], [18, 31]], dark);
    s.rect(9, 9, 14, 17, bark); s.rect(9, 9, 2, 17, rp(mix('#7a5a3a', '#ffffff', .18))); s.rect(19, 9, 4, 17, dark);
    s.ell(16, 9, 7, 2.6, ring); s.ell(16, 9, 4.4, 1.6, rp('#a8804e')); s.ell(16, 9, 2, .8, ring);
    s.line(9, 15, 3, 10, bark); s.line(4, 10, 2, 6, bark); s.line(4, 10, 6, 6, bark); s.line(23, 14, 29, 9, dark); s.line(28, 9, 30, 5, dark); s.line(28, 9, 26, 5, dark);
    s.ell(3, 6, 2, 1.6, moss); s.ell(29, 5, 2, 1.6, moss); s.ell(12, 11, 3, 1.4, moss); s.ell(21, 21, 2, 1.4, moss);
    for (let y = 12; y < 26; y += 4) s.line(13, y, 14, y + 2, null, '#4a3424');
    s.fix(13, 16, '#d8f070'); s.fix(18, 16, '#d8f070'); s.fix(13, 17, '#a0c040'); s.fix(18, 17, '#a0c040');
    s.line(13, 21, 18, 20, null, '#2a1a10'); return s; };
  A.CREATURE_SPECS.rookmother = () => { const s = Spr(32, 32), body = rp('#3a3a4a'), wing = rp('#2a2a38'), sheen = rp('#5a5a7a'), beak = rp('#9aa0a8');
    /* a great crow with wings half spread, a ruff, a heavy grey beak, red eye and hooked talons */
    s.poly([[15, 13], [1, 8], [4, 14], [2, 18], [13, 21]], wing); s.poly([[17, 13], [31, 8], [28, 14], [30, 18], [19, 21]], wing);
    for (let i = 0; i < 5; i++) { s.line(3 + i * 2, 10 + i, 5 + i * 2, 15 + i, null, '#4a4a64'); s.line(29 - i * 2, 10 + i, 27 - i * 2, 15 + i, null, '#1e1e2a'); }
    s.ell(16, 18, 6, 7, body); s.ell(14, 16, 3, 4, sheen); s.ell(16, 9, 4.4, 4.2, body); s.ell(15, 8, 2, 1.6, sheen);
    s.poly([[11, 12], [16, 15], [21, 12], [19, 15], [16, 17], [13, 15]], wing);
    s.poly([[19, 9], [25, 10], [19, 12]], beak); s.line(19, 11, 24, 10, null, '#5a6068');
    s.fix(17, 8, '#e0403a'); s.fix(17, 7, '#ff8a6a');
    s.poly([[12, 24], [16, 30], [20, 24]], rp('#2a2a38')); for (const x of [13, 19]) { s.line(x, 25, x, 29, null, '#c8b070'); s.fix(x - 1, 30, '#c8b070'); s.fix(x + 1, 30, '#c8b070'); }
    return s; };
}

/* ---------- the Challenges strip on the hunting panel ---------- */
const minisHere = town => D.MONLIST.filter(m => m.mini && m.town === town);
const area0 = UI.areaPanel;
if (area0) UI.areaPanel = town => {
  const h = area0(town), list = minisHere(town); if (!list.length) return h;
  const f = DQ.act && DQ.act.kind === 'fight' && DQ.act.id;
  const cards = list.map(m => { const ok = DQ.combatLvl() >= m.mini.req, done = S().minis && S().minis[m.id], met = (S().beast.kills[m.id] || 0) > 0, on = f === m.id, d = DQ.dangerOf ? DQ.dangerOf(m) : null;
    return `<article class="mini-card ${done ? 'done' : ''} ${on ? 'on' : ''}" style="--c:${m.col}"><button type="button" class="mini-art" data-do="guide" data-a="${m.id}" aria-label="${esc(m.name)}: open its field guide" data-tip="text:${esc(m.name)} · open its field guide">${DQ.monSprite(m, 64)}</button>
      <div class="mini-t"><span class="k">${done ? '✓ Defeated' : 'Challenge'}</span><b>${esc(m.name)}</b><small>Level ${m.cl}${d ? ` · ${esc(d.label)}` : ''}</small><small class="${ok ? 'ok' : 'bad'}">${ok ? '✓' : '✗'} Combat ${m.mini.req}${ok ? '' : ` (you: ${DQ.combatLvl()})`}</small></div>
      <button class="btn sm ${ok && !on ? 'primary' : ''}" ${ok ? `data-do="act" data-a="fight" data-b="${m.id}"` : 'disabled'}>${on ? 'Retreat' : done ? 'Fight again' : 'Challenge'}</button></article>`; }).join('');
  const strip = `<div class="mini-strip"><div class="k">Challenges before ${esc((D.MON[D.TOWN[town].boss] && D.MON[D.TOWN[town].boss].boss && D.MON[D.TOWN[town].boss].boss.short) || 'the boss')}</div><div class="mini-list">${cards}</div></div>`;
  return h.replace('<div class="area-grid">', strip + '<div class="area-grid">');
};
/* quest tracking: a mini-boss target is fought directly (it is never in a random encounter) */
const hq0 = UI.DO.huntquest;
if (hq0) UI.DO.huntquest = id => { if (D.MON[id] && D.MON[id].mini) { DQ.startAct('fight', id); UI.render(false); return; } hq0(id); };
})();
