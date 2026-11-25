/* Idlewick: combat arts (owner, 22 Nov 2026: "each combat type - ranged, melee and magic - [should work] like magic,
   where as you use them they level up and you can then unlock new skills and specialties").
   Melee and Ranged now have a book like Magic's spellbook: ten arts each, opened by that style's own level. You choose
   one per style (S.arts.melee / S.arts.ranged); it is used whenever you fight with that style, the way a chosen spell is.
   An art changes accuracy or damage, can change the damage type (thrusts stab, maces crush, fire arrows burn), or adds
   an effect on a hit (bleeding, pinning, striking twice, a hunter's mark on animals). The spellbook grows from five
   spells to twelve across the four elements. Effects reach combat through DQ.pstats, the dtype the engine reads
   (ps.dtype) and DQ.artHit; nothing else about combat changes. Page: Combat → Combat arts. */
(() => {
const Q = window.DQ, D = Q.data, UI = Q.ui, S = () => Q.S, { esc, ico } = Q;
/* ---------- the books ---------- */
const ART = (id, name, lvl, text, fx) => ({ id, name, lvl, text, ...fx });
D.ARTS = {
  /* power-neutral by design (22 Nov audit): each art trades one thing for another, changes the damage type, or adds
     an effect at a cost, so boss balance (scripts/sim-bosses.cjs, run without arts) still holds. Capstones give +4%/+4%. */
  melee: [
    ART('steady', 'Steady Strikes', 1, '+8% accuracy · −6% damage', { acc: .08, dmg: -.06 }),
    ART('cleave_art', 'Cleaving Blows', 8, 'Slash damage', { dtype: 'slash' }),
    ART('thrust', 'Piercing Thrust', 15, 'Stab damage', { dtype: 'stab' }),
    ART('crush_art', 'Crushing Blows', 22, 'Crush damage', { dtype: 'crush' }),
    ART('heavy', 'Heavy Swing', 30, '+14% damage · −12% accuracy', { dmg: .14, acc: -.12 }),
    ART('bleed', 'Bleeding Edge', 40, 'Hits make the foe bleed · −8% damage', { bleed: true, dmg: -.08 }),
    ART('breaker', 'Guard Breaker', 50, '+15% accuracy · −10% damage', { acc: .15, dmg: -.1 }),
    ART('riposte', 'Riposte', 62, '−8% damage taken · −8% damage', { dr: .08, dmg: -.08 }),
    ART('whirl', 'Whirlwind', 75, 'Every 5th hit strikes twice · −12% damage', { twice: 5, dmg: -.12 }),
    ART('master_form', 'Master’s Form', 90, '+4% damage · +4% accuracy', { dmg: .04, acc: .04 })
  ],
  ranged: [
    ART('aimed_draw', 'Aimed Draw', 1, '+8% accuracy · −6% damage', { acc: .08, dmg: -.06 }),
    ART('broadhead', 'Broadheads', 8, '+10% damage · −8% accuracy', { dmg: .1, acc: -.08 }),
    ART('fire_arrows', 'Fire Arrows', 16, 'Fire damage', { dtype: 'fire' }),
    ART('frost_arrows', 'Frost Arrows', 28, 'Frost damage', { dtype: 'frost' }),
    ART('pinning', 'Pinning Shot', 36, 'Hits pin the foe · −8% damage', { pin: true, dmg: -.08 }),
    ART('storm_arrows', 'Storm Arrows', 46, 'Storm damage', { dtype: 'storm' }),
    ART('hunters_mark', 'Hunter’s Mark', 55, '+20% damage to animals · −6% to others', { animals: .2, others: -.06 }),
    ART('volley_art', 'Volley', 66, 'Every 5th shot hits twice · −12% damage', { twice: 5, dmg: -.12 }),
    ART('piercing_bolt', 'Piercing Bolt', 78, '+15% accuracy · −10% damage', { acc: .15, dmg: -.1 }),
    ART('starshot', 'Starshot', 90, 'Aether damage · +4% damage · +4% accuracy', { dtype: 'aether', dmg: .04, acc: .04 })
  ]
};
D.ART = Object.fromEntries(Object.values(D.ARTS).flat().map(a => [a.id, a]));
/* the spellbook: the five spells stay, seven join them between and after */
/* the new spells fill elements and levels between the old ones; none hits harder than Aether Blast (36), so Magic
   stays level with Melee and Ranged (D.STYLE_TUNE parity); the late ones are worth it for their element and cost */
const MORE = [['ember_dart', 'Ember Dart', 6, 5, 1, 'fire'], ['gale', 'Gale Cutter', 18, 12, 2, 'storm'], ['hail', 'Hailstorm', 34, 20, 3, 'frost'], ['inferno', 'Inferno', 49, 30, 4, 'fire'],
  ['blizzard', 'Blizzard', 66, 36, 5, 'frost'], ['tempest', 'Tempest', 76, 36, 4, 'storm'], ['starfall', 'Starfall', 86, 36, 3, 'aether']];
for (const [id, name, lvl, max, runes, el] of MORE) if (!D.SPELLS.some(s => s.id === id)) { D.SPELLS.push({ id, name, lvl, max, runes }); D.SPELL_EL[id] = el; ((D.UNL.magic = D.UNL.magic || {})[lvl] = D.UNL.magic[lvl] || []).push(name + ' spell'); }
D.SPELLS.sort((a, b) => a.lvl - b.lvl);
for (const [sk, list] of Object.entries(D.ARTS)) for (const a of list) if (a.lvl > 1) ((D.UNL[sk] = D.UNL[sk] || {})[a.lvl] = D.UNL[sk][a.lvl] || []).push(`${a.name} (combat art)`);
/* ---------- which art is in use ---------- */
const open = a => a && Q.lvl(Object.keys(D.ARTS).find(k => D.ARTS[k].includes(a))) >= a.lvl;
Q.artFor = style => { const list = D.ARTS[style]; if (!list) return null; const id = (S().arts || {})[style], a = D.ART[id]; return open(a) ? a : list[0]; };
Q.setArt = (style, id) => { const a = D.ART[id]; if (!a || !D.ARTS[style] || !D.ARTS[style].includes(a) || !open(a)) return false; (S().arts ||= {})[style] = id; Q.save(); Q.fxDirty && Q.fxDirty(); return true; };
const ps0 = Q.pstats;
Q.pstats = () => { const ps = ps0(); const a = Q.artFor(ps.style); if (!a) return ps;
  ps.art = a; ps.acc *= 1 + (a.acc || 0); if (a.dmg) { ps.maxRaw *= 1 + a.dmg; ps.max = Math.max(1, Math.round(ps.maxRaw)); }
  if (a.dtype) ps.dtype = a.dtype; if (a.dr) ps.red = Math.min(.75, ps.red + a.dr); return ps; };
const dt0 = Q.myDtype; if (dt0) Q.myDtype = () => { const st = Q.weaponStyle(), a = st !== 'magic' && Q.artFor(st); return a && a.dtype ? a.dtype : dt0(); };
/* effects on a hit: called by the engine with the hit already rolled */
Q.artHit = (ps, dealt, m, f, max) => { const a = ps && ps.art; if (!a) return dealt;
  if (a.animals) dealt = Math.max(1, Math.round(dealt * (1 + (m.hl ? a.animals : (a.others || 0)))));
  if (a.bleed) f.poison = Math.min(3, (f.poison || 0) + 1);
  if (a.pin) f.pinned = 2;
  if (a.twice && f.pa % a.twice === 0) { dealt += Q.rnd(1, Math.max(1, Math.round(max))); Q.splat('foe', a.name, 'hit', 180); }
  return dealt; };
/* ---------- the page: Combat → Combat arts ---------- */
const SK_ICON = { melee: 'attack', ranged: 'ranged', magic: 'magic' };
let tab = null;
/* one style's book, used by the Melee, Ranged and Magic pages (combat_skills.js) */
Q.artsBook = style => {
  const st = Q.weaponStyle(), tab = style;
  let cards, focus;
  if (tab === 'magic') {
    const cur = D.SPELLS.find(s => s.id === S().spell && Q.lvl('magic') >= s.lvl) || D.SPELLS[0];
    cards = D.SPELLS.map(sp => { const ok = Q.lvl('magic') >= sp.lvl, el = D.DTYPES[D.SPELL_EL[sp.id]];
      return `<button type="button" class="illustrated-card art-card ${ok ? '' : 'locked'} ${sp === cur ? 'selected' : ''}" data-do="${ok ? 'artspell' : ''}" data-a="${sp.id}" ${ok ? '' : 'disabled'} aria-pressed="${sp === cur}"><span class="art-dot ${ok ? '' : 'plain'}" style="--c:${ok ? el.col : 'var(--brass)'}"></span><b>${ok ? esc(sp.name) : '???'}</b><small>${ok ? `${esc(el.name)} · max ${sp.max} · ${sp.runes} rune${sp.runes > 1 ? 's' : ''}` : `${ico('lock')}Lv ${sp.lvl}`}</small></button>`; }).join('');
    const el = D.DTYPES[D.SPELL_EL[cur.id]];
    focus = `<h2>${esc(cur.name)}</h2><p>${esc(el.name)} · base max hit ${cur.max} · ${cur.runes} rune${cur.runes > 1 ? 's' : ''} a cast</p><p class="dim">Cast automatically when you fight with a staff.</p>`;
  } else {
    const cur = Q.artFor(tab);
    cards = D.ARTS[tab].map(a => { const ok = open(a), el = a.dtype && D.DTYPES[a.dtype];
      return `<button type="button" class="illustrated-card art-card ${ok ? '' : 'locked'} ${a === cur ? 'selected' : ''}" data-do="${ok ? 'artpick' : ''}" data-a="${tab}" data-b="${a.id}" ${ok ? '' : 'disabled'} aria-pressed="${a === cur}">${ok && el ? `<span class="art-dot" style="--c:${el.col}"></span>` : `<span class="art-dot plain"></span>`}<b>${ok ? esc(a.name) : '???'}</b><small>${ok ? esc(a.text) : `${ico('lock')}Lv ${a.lvl}`}</small></button>`; }).join('');
    focus = `<h2>${esc(cur.name)}</h2><p>${esc(cur.text)}</p><p class="dim">Used whenever you fight with ${tab === 'melee' ? 'a melee weapon' : 'a bow'}${st === tab ? '' : `. You are holding ${st === 'magic' ? 'a staff' : st === 'ranged' ? 'a bow' : 'a melee weapon'} now`}.</p>`;
  }
  const next = (tab === 'magic' ? D.SPELLS : D.ARTS[tab]).find(x => Q.lvl(tab) < x.lvl);
  return `<div class="arts-page"><section class="panel arts-focus"><span class="k">In use</span>${focus}${next ? `<p class="arts-next">Next · Lv ${next.lvl} ${esc(UI.unlockShort ? 'Something new' : '')}</p>` : ''}</section>
  <section class="panel arts-book"><div class="illustrated-choices arts-grid">${cards}</div></section></div>`;
};
/* the old Combat arts tab now opens the book of the style you fight with */
UI.V.arts = () => {
  const style = Q.weaponStyle();
  UI.selectStyleBook(style);
  setTimeout(() => { if (UI.view === 'arts') Q.go(style); }, 0);
  return UI.V[style]();
};
Object.assign(UI.DO, {
  artstab: k => { if (['melee', 'ranged', 'magic'].includes(k)) { tab = k; UI.render(false); } },
  artpick: (style, id) => { if (Q.setArt(style, id)) { Q.sfx && Q.sfx('tab'); UI.render(false); } },
  artspell: id => { const sp = D.SPELLS.find(s => s.id === id); if (!sp || Q.lvl('magic') < sp.lvl) return; S().spell = id; Q.save(); Q.sfx && Q.sfx('tab'); UI.render(false); }
});
/* the combat page's Fighting style panel names the art in use and opens the book */
const render0 = UI.render;
const place = () => { if (UI.view !== 'combat') return; const box = document.querySelector('#view .hud-train'); if (!box || box.querySelector('.cx-art')) return;
  const st = Q.weaponStyle(), art = st === 'magic' ? (D.SPELLS.find(s => s.id === S().spell && Q.lvl('magic') >= s.lvl) || D.SPELLS[0]) : Q.artFor(st); if (!art) return;
  const html = `<button type="button" class="linkish cx-art" data-do="go" data-a="${st === 'magic' ? 'magic' : st}" data-tip="text:Choose a ${st === 'magic' ? 'spell' : st === 'ranged' ? 'shot' : 'technique'}">${ico('book')}<span>${esc(art.name)}</span></button>`;
  const dps = box.querySelector('[data-b="dps"]'); if (dps) { const row = document.createElement('div'); row.className = 'cx-dpsrow'; dps.before(row); row.append(dps); row.insertAdjacentHTML('beforeend', html); } else box.querySelector('.kit-head')?.insertAdjacentHTML('afterend', html); };
UI.render = (...a) => { const r = render0(...a); try { place(); setTimeout(place, 0); } catch (e) {} return r; };
})();
