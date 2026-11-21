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
  melee: [
    ART('steady', 'Steady Strikes', 1, '+8% accuracy', { acc: .08 }),
    ART('cleave_art', 'Cleaving Blows', 8, 'Slash damage · +4% damage', { dtype: 'slash', dmg: .04 }),
    ART('thrust', 'Piercing Thrust', 15, 'Stab damage · +6% accuracy', { dtype: 'stab', acc: .06 }),
    ART('crush_art', 'Crushing Blows', 22, 'Crush damage · +5% damage', { dtype: 'crush', dmg: .05 }),
    ART('heavy', 'Heavy Swing', 30, '+14% damage · −8% accuracy', { dmg: .14, acc: -.08 }),
    ART('bleed', 'Bleeding Edge', 40, 'Hits make the foe bleed', { bleed: true }),
    ART('breaker', 'Guard Breaker', 50, '+12% accuracy · +4% damage', { acc: .12, dmg: .04 }),
    ART('riposte', 'Riposte', 62, '−6% damage taken · +4% damage', { dr: .06, dmg: .04 }),
    ART('whirl', 'Whirlwind', 75, 'Every 4th hit strikes twice', { twice: 4 }),
    ART('master_form', 'Master’s Form', 90, '+9% damage · +9% accuracy', { dmg: .09, acc: .09 })
  ],
  ranged: [
    ART('aimed_draw', 'Aimed Draw', 1, '+8% accuracy', { acc: .08 }),
    ART('broadhead', 'Broadheads', 8, '+6% damage', { dmg: .06 }),
    ART('fire_arrows', 'Fire Arrows', 16, 'Fire damage', { dtype: 'fire' }),
    ART('frost_arrows', 'Frost Arrows', 28, 'Frost damage', { dtype: 'frost' }),
    ART('pinning', 'Pinning Shot', 36, 'Hits pin the foe in place', { pin: true }),
    ART('storm_arrows', 'Storm Arrows', 46, 'Storm damage · +3% damage', { dtype: 'storm', dmg: .03 }),
    ART('hunters_mark', 'Hunter’s Mark', 55, '+20% damage to animals you hunt', { animals: .2 }),
    ART('volley_art', 'Volley', 66, 'Every 4th shot hits twice', { twice: 4 }),
    ART('piercing_bolt', 'Piercing Bolt', 78, '+12% accuracy · +5% damage', { acc: .12, dmg: .05 }),
    ART('starshot', 'Starshot', 90, 'Aether damage · +7% damage', { dtype: 'aether', dmg: .07 })
  ]
};
D.ART = Object.fromEntries(Object.values(D.ARTS).flat().map(a => [a.id, a]));
/* the spellbook: the five spells stay, seven join them between and after */
const MORE = [['ember_dart', 'Ember Dart', 6, 6, 1, 'fire'], ['gale', 'Gale Cutter', 18, 12, 2, 'storm'], ['hail', 'Hailstorm', 34, 20, 3, 'frost'], ['inferno', 'Inferno', 49, 30, 4, 'fire'],
  ['blizzard', 'Blizzard', 66, 39, 5, 'frost'], ['tempest', 'Tempest', 76, 42, 6, 'storm'], ['starfall', 'Starfall', 86, 45, 6, 'aether']];
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
  if (a.animals && m.hl) dealt = Math.max(1, Math.round(dealt * (1 + a.animals)));
  if (a.bleed) f.poison = Math.min(3, (f.poison || 0) + 1);
  if (a.pin) f.pinned = 2;
  if (a.twice && f.pa % a.twice === 0) { dealt += Q.rnd(1, Math.max(1, Math.round(max))); Q.splat('foe', a.name, 'hit', 180); }
  return dealt; };
/* ---------- the page: Combat → Combat arts ---------- */
const SK_ICON = { melee: 'attack', ranged: 'ranged', magic: 'magic' };
let tab = null;
UI.V.arts = () => {
  const st = Q.weaponStyle(); if (!tab) tab = st;
  const tabs = `<nav class="arts-tabs btnrow" role="tablist">${['melee', 'ranged', 'magic'].map(k => `<button class="btn ${tab === k ? 'on' : ''}" role="tab" aria-selected="${tab === k}" data-do="artstab" data-a="${k}">${UI.activityIcon ? UI.activityIcon(k) : ico(SK_ICON[k])}${esc(D.SK[k].name)} <b class="mono">${Q.lvl(k)}</b></button>`).join('')}</nav>`;
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
  return `<section class="panel arts-head"><div class="phead"><div><span class="k">Combat arts</span><h2>${esc(D.SK[tab].name)} ${tab === 'magic' ? 'spellbook' : tab === 'melee' ? 'techniques' : 'shots'}</h2></div>${tabs}</div></section>
  <div class="arts-page"><section class="panel arts-focus"><span class="k">In use</span>${focus}${next ? `<p class="arts-next">Next · Lv ${next.lvl} ${esc(UI.unlockShort ? 'Something new' : '')}</p>` : ''}</section>
  <section class="panel arts-book"><div class="illustrated-choices arts-grid">${cards}</div></section></div>`;
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
  const html = `<button type="button" class="linkish cx-art" data-do="go" data-a="arts" data-tip="text:Combat arts: choose a ${st === 'magic' ? 'spell' : st === 'ranged' ? 'shot' : 'technique'}">${ico('book')}<span>${esc(art.name)}</span></button>`;
  const dps = box.querySelector('[data-b="dps"]'); if (dps) { const row = document.createElement('div'); row.className = 'cx-dpsrow'; dps.before(row); row.append(dps); row.insertAdjacentHTML('beforeend', html); } else box.querySelector('.kit-head')?.insertAdjacentHTML('afterend', html); };
UI.render = (...a) => { const r = render0(...a); try { place(); setTimeout(place, 0); } catch (e) {} return r; };
})();
