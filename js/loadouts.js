/* Idlewick: saved preparations (Inventory). Save the equipment, ammunition, abilities, spell and companion you are
   using under a name; see what applying one would change; apply only what you own and can use (taking a needed item
   from the bank, never inventing one); and return to your previous preparation in one click. Equipping goes through
   DQ.equipItem / DQ.unequip, so items are conserved exactly as with manual swaps. Also: Copy build, a plain-text summary
   of the current preparation to share by hand (no save data, no identifiers). Saved as S().loadouts / S().loadoutPrev. */
(() => {
const DQ = window.DQ, D = DQ.data, UI = DQ.ui, { esc, ico } = DQ;
const S = () => DQ.S;
const GEAR = ['head', 'body', 'legs', 'weapon', 'shield', 'ring', 'amulet'];
const MAX = 6;
DQ.loadouts = () => (S().loadouts = Array.isArray(S().loadouts) ? S().loadouts : []);
DQ.loadoutCapture = name => ({ name: String(name || 'Preparation').slice(0, 24), equip: Object.fromEntries(GEAR.map(sl => [sl, S().equip[sl] || null])), /* null = saved as empty; a missing slot is left alone */ ammo: S().ammo.id || null, abilities: (S().abilities || []).slice(), spell: S().spell || null, pet: S().pets.active || null });
const owned = id => (S().inv[id] || 0) + ((S().bank && S().bank[id]) || 0);
const reqWhy = id => { const it = D.ITEMS[id]; if (!it) return 'no longer exists'; for (const [sk, l] of Object.entries(it.req || {})) { if (!DQ.skillUnlocked(sk)) return `${D.SK[sk].name} is not learned`; if (DQ.lvl(sk) < l) return `needs ${D.SK[sk].name} ${l}`; } return ''; };
/* what applying would change, slot by slot, honestly */
DQ.loadoutPlan = lo => {
  const rows = [];
  for (const sl of GEAR) {
    if (!(sl in (lo.equip || {}))) continue;
    const from = S().equip[sl] || null, to = (lo.equip || {})[sl] || null;
    if (from === to) continue;
    if (!to) { rows.push({ slot: sl, from, to, status: 'remove' }); continue; }
    const why = reqWhy(to);
    if (why) rows.push({ slot: sl, from, to, status: 'locked', why });
    else if (S().inv[to]) rows.push({ slot: sl, from, to, status: 'equip' });
    else if (S().bank && S().bank[to]) rows.push({ slot: sl, from, to, status: 'bank' });
    else rows.push({ slot: sl, from, to, status: 'missing' });
  }
  if (lo.ammo && lo.ammo !== S().ammo.id) { const why = reqWhy(lo.ammo); rows.push({ slot: 'ammo', from: S().ammo.id, to: lo.ammo, status: why ? 'locked' : owned(lo.ammo) ? (S().inv[lo.ammo] ? 'equip' : 'bank') : 'missing', why }); }
  const abil = (lo.abilities || []).filter(id => D.AB[id]), usable = abil.filter(id => DQ.abilUnlocked(D.AB[id])).slice(0, DQ.abilSlots()), lockedAb = abil.filter(id => !DQ.abilUnlocked(D.AB[id]));
  const spellOk = lo.spell && D.SPELLS.find(x => x.id === lo.spell && DQ.lvl('magic') >= x.lvl);
  const petOk = lo.pet && S().pets.owned[lo.pet];
  return { rows, abilities: usable, lockedAbilities: lockedAb, abilityChange: usable.join() !== (S().abilities || []).join(), spell: spellOk ? lo.spell : null, spellChange: !!spellOk && lo.spell !== S().spell, spellLocked: lo.spell && !spellOk, pet: petOk ? lo.pet : null, petChange: !!petOk && lo.pet !== S().pets.active, petMissing: lo.pet && !petOk };
};
DQ.loadoutChanges = p => p.rows.filter(r => ['equip', 'bank', 'remove'].includes(r.status)).length + (p.abilityChange ? 1 : 0) + (p.spellChange ? 1 : 0) + (p.petChange ? 1 : 0);
DQ.loadoutApply = (lo, { remember = true } = {}) => {
  const p = DQ.loadoutPlan(lo), skipped = [];
  if (remember) S().loadoutPrev = DQ.loadoutCapture('Previous preparation');
  for (const r of p.rows) {
    if (r.status === 'remove') { if (r.slot === 'ammo') DQ.unequip('ammo'); else DQ.unequip(r.slot); continue; }
    if (r.status === 'bank') { const before = S().inv[r.to] || 0; DQ.withdraw(r.to, r.slot === 'ammo' ? S().bank[r.to] : 1); if ((S().inv[r.to] || 0) <= before) { skipped.push(`${D.ITEMS[r.to].name} (no backpack room)`); continue; } }
    if (r.status === 'equip' || r.status === 'bank') { const res = DQ.equipItem(r.to); if (res && res.ok === false) skipped.push(`${D.ITEMS[r.to].name} (${res.why})`); continue; }
    if (r.status === 'missing') skipped.push(`${D.ITEMS[r.to] ? D.ITEMS[r.to].name : r.to} (not owned)`);
    if (r.status === 'locked') skipped.push(`${D.ITEMS[r.to] ? D.ITEMS[r.to].name : r.to} (${r.why})`);
  }
  if (p.abilityChange) S().abilities = p.abilities;
  if (p.spell) S().spell = p.spell;
  if (p.pet && p.petChange) DQ.setPet(p.pet);
  p.lockedAbilities.forEach(id => skipped.push(`${D.AB[id].name} (not learned)`));
  if (p.spellLocked) skipped.push('spell (Magic too low)'); if (p.petMissing) skipped.push('companion (not found yet)');
  DQ.fxDirty(); DQ.invDirty = true; DQ.emit('lvl'); DQ.save && DQ.save();
  return { skipped };
};
DQ.loadoutSave = name => { const L = DQ.loadouts(), lo = DQ.loadoutCapture(name), i = L.findIndex(x => x.name === lo.name); if (i >= 0) L[i] = lo; else { if (L.length >= MAX) return false; L.push(lo); } DQ.save && DQ.save(); return true; };
DQ.loadoutDelete = i => { DQ.loadouts().splice(i, 1); DQ.save && DQ.save(); };

/* Copy build: what you are wearing and why, as plain text. Nothing from the save beyond the build itself. */
DQ.buildText = () => {
  const st = S(), L = DQ.lvl, it = id => D.ITEMS[id], lines = [];
  const style = DQ.weaponStyle(), main = style === 'melee' ? `Attack ${L('attack')} · Strength ${L('strength')}` : style === 'ranged' ? `Ranged ${L('ranged')}` : `Magic ${L('magic')}`;
  lines.push(`Idlewick build · combat ${DQ.combatLvl()} (${main} · Defence ${L('defence')} · Health ${L('hitpoints')})`);
  for (const sl of GEAR) { const id = st.equip[sl]; if (!id) continue; const x = it(id), e = (st.enchants || {})[id]; lines.push(`- ${DQ.SLOT_NAMES ? DQ.SLOT_NAMES[sl] : sl}: ${x.name}${e ? ` +${e}` : ''}${x.unique ? ` — ${x.unique.name}: ${x.unique.text}` : ''}`); }
  if (st.ammo.id) lines.push(`- Ammunition: ${it(st.ammo.id).name}`);
  const ab = (st.abilities || []).filter(id => D.AB[id]).map(id => D.AB[id].name); if (ab.length) lines.push(`- Abilities: ${ab.join(', ')}`);
  if (style === 'magic' && st.spell) { const sp = D.SPELLS.find(x => x.id === st.spell); if (sp) lines.push(`- Spell: ${sp.name}`); }
  const p = st.pets.active && D.PET[st.pets.active]; if (p) lines.push(`- Companion: ${p.name}${p.trick ? ` — ${p.trick.name}: ${p.trick.text}` : ''}`);
  return lines.join('\n');
};
DQ.copyText = async (text, label) => {
  try { await navigator.clipboard.writeText(text); DQ.toast(`${label} copied`); }
  catch (e) { DQ.modal({ title: label, body: `<p class="sm dim">Copy the text below.</p><textarea class="copy-box" readonly rows="8">${esc(text)}</textarea>`, actions: [{ label: 'Done', primary: true }] }); setTimeout(() => { const t = document.querySelector('.copy-box'); if (t) t.select(); }, 50); }
};

/* ---------- the Inventory panel ---------- */
const STATUS = { equip: ['up', 'Equip'], bank: ['up', 'From bank'], remove: ['dim', 'Unequip'], missing: ['bad', 'Not owned'], locked: ['bad', 'Locked'] };
UI.loadoutPanel = () => {
  const L = DQ.loadouts(), prev = S().loadoutPrev, prevPlan = prev && DQ.loadoutPlan(prev);
  const card = (lo, i) => { const p = DQ.loadoutPlan(lo), n = DQ.loadoutChanges(p);
    const lines = p.rows.map(r => `<li class="${STATUS[r.status][0]}">${esc(STATUS[r.status][1])}: ${esc(r.to ? D.ITEMS[r.to].name : D.ITEMS[r.from].name)}${r.why ? ` (${esc(r.why)})` : ''}</li>`).concat(p.abilityChange ? [`<li class="up">Abilities: ${esc(p.abilities.map(a => D.AB[a].name).join(', ') || 'none')}</li>`] : [], p.spellChange ? [`<li class="up">Spell: ${esc(D.SPELLS.find(x => x.id === p.spell).name)}</li>`] : [], p.petChange ? [`<li class="up">Companion: ${esc(D.PET[p.pet].name)}</li>`] : [], p.lockedAbilities.map(a => `<li class="bad">Not learned: ${esc(D.AB[a].name)}</li>`), p.petMissing ? ['<li class="bad">Companion not found yet</li>'] : []);
    return `<div class="lo-card"><div class="lo-head"><b>${esc(lo.name)}</b><span class="lo-icons">${Object.values(lo.equip || {}).filter(Boolean).map(id => D.ITEMS[id] ? DQ.itemIco(D.ITEMS[id]) : '').join('')}</span></div>${n || lines.length ? `<ul class="lo-diff">${lines.join('')}</ul>` : '<small class="dim">This is what you are wearing.</small>'}<div class="btnrow"><button class="btn sm ${n ? 'primary' : ''}" data-do="loapply" data-a="${i}" ${n ? '' : 'disabled'}>${n ? `Apply (${n} change${n > 1 ? 's' : ''})` : 'Applied'}</button><button class="btn sm" data-do="lodelete" data-a="${i}" aria-label="Delete ${esc(lo.name)}">Delete</button></div></div>`; };
  return `<section class="panel loadouts"><div class="phead"><h2>Preparations</h2><small>${L.length} / ${MAX}</small></div>
    <div class="lo-save"><input id="lo-name" maxlength="24" placeholder="Name this preparation (e.g. Frostmaw)" aria-label="Preparation name"><button class="btn sm primary" data-do="losave">Save current</button>${prev && DQ.loadoutChanges(prevPlan) ? `<button class="btn sm" data-do="loprev">Return to previous</button>` : ''}<button class="btn sm" data-do="copybuild">${ico('quest')} Copy build</button></div>
    ${L.length ? `<div class="lo-list">${L.map(card).join('')}</div>` : '<p class="sm dim">Save what you are wearing, try something else, and switch back in one click. Missing or locked items are shown, never invented.</p>'}</section>`;
};
Object.assign(UI.DO, {
  losave: () => { const el = document.getElementById('lo-name'), name = (el && el.value.trim()) || `Preparation ${DQ.loadouts().length + 1}`; if (!DQ.loadoutSave(name)) return DQ.toast(`You can keep ${MAX} preparations. Delete one first.`, true); DQ.sfx('equip'); UI.render(false); },
  loapply: i => { const lo = DQ.loadouts()[+i]; if (!lo) return; const r = DQ.loadoutApply(lo); DQ.sfx('equip'); UI.renderHud && UI.renderHud(); UI.render(false); if (r.skipped.length) DQ.toast(`Applied “${lo.name}”. Skipped: ${r.skipped.join(', ')}`); else DQ.toast(`Applied “${lo.name}”`); },
  loprev: () => { const lo = S().loadoutPrev; if (!lo) return; const r = DQ.loadoutApply(lo); DQ.sfx('equip'); UI.renderHud && UI.renderHud(); UI.render(false); DQ.toast(r.skipped.length ? `Back to your previous preparation. Skipped: ${r.skipped.join(', ')}` : 'Back to your previous preparation'); },
  lodelete: i => { DQ.loadoutDelete(+i); UI.render(false); },
  copybuild: () => DQ.copyText(DQ.buildText(), 'Build')
});
const char0 = UI.V.character;
UI.V.character = () => char0() + UI.loadoutPanel();
})();
