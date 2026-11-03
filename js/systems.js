/* Idlewick: farming, animals, pets, house bonuses, bestiary and hirelings. */
(() => {
const DQ = window.DQ, D = DQ.data, { rnd, chance, clamp, fmt, pick } = DQ;
const S = () => DQ.S;
const GT = () => S().gameTime || 0;

/* ---------- Combined bonuses from house furniture, the active pet and trophies ---------- */
let fxCache = null;
DQ.fxDirty = () => { fxCache = null; };
DQ.petLevel = id => { const p = S().pets.owned[id]; if (!p) return 0; const m = p.aff || 0; let l = 1; D.PET_LEVELS.forEach((t, i) => { if (m >= t) l = i + 1; }); return l; };
DQ.fx = () => {
  if (fxCache) return fxCache;
  const f = { regen: 0, xpAll: 0, coin: 0, burn: 0, heal: 0, pack: 0, dr: 0, gather: 0, grow: 0, animal: 0, plots: 0, workers: 0, wspeed: 0, wage: 0, trophy: 0, dmg: 0, speedAll: 0, find: 0, dbl: 0, study: 0, xp: {}, speed: {} };
  const h = S().house || {};
  Object.entries(h.furn || {}).forEach(([id, tier]) => {
    const fu = D.FURN[id]; if (!fu || !tier) return;
    Object.entries(fu.fx).forEach(([k, arr]) => { const v = arr[tier - 1];
      if (k.startsWith('xp_')) f.xp[k.slice(3)] = (f.xp[k.slice(3)] || 0) + v; else if (k.startsWith('speed_')) f.speed[k.slice(6)] = (f.speed[k.slice(6)] || 0) + v; else f[k] += v; });
  });
  if (DQ.techFx) DQ.techFx(f);
  if (S().projects && S().projects.well) f.regen += .1;
  if (S().projects && S().projects.inn) f.heal += .05;
  f.dmg += f.trophy * Object.values(S().towns).filter(t => t.boss).length;
  const ap = S().pets.active && D.PET[S().pets.active];
  if (ap) {
    const m = 1 + .25 * (DQ.petLevel(ap.id) - 1), b = ap.bonus;
    if (b.xpAll) f.xpAll += b.xpAll * m; if (b.coin) f.coin += b.coin * m; if (b.dmg) f.dmg += b.dmg * m; if (b.dr) f.dr += b.dr * m; if (b.heal) f.heal += b.heal * m; if (b.speed) f.speedAll += b.speed * m;
    Object.entries(b.xp || {}).forEach(([k, v]) => f.xp[k] = (f.xp[k] || 0) + v * m);
  }
  return (fxCache = f);
};
const GATHER = ['fishing', 'woodcutting', 'mining', 'thieving', 'farming'];
DQ.extraXp = sk => { const f = DQ.fx(); return 1 + f.xpAll + (f.xp[sk] || 0); };
DQ.extraSpeed = sk => { const f = DQ.fx(); return f.speedAll + (f.speed[sk] || 0) + (GATHER.includes(sk) ? f.gather : 0); };
DQ.packMax = () => DQ.PACK_SLOTS + DQ.fx().pack;
DQ.coinMult = () => 1 + DQ.fx().coin;

/* ---------- Pets ---------- */
DQ.awardPet = id => {
  const p = D.PET[id], o = S().pets.owned; if (!p || o[id]) return false;
  o[id] = { aff: 0, found: Date.now() }; S().stats.pets = Object.keys(o).length;
  if (!S().pets.active) { S().pets.active = id; DQ.fxDirty(); }
  DQ.notify({ kind: 'loot', key: 'pet:' + id, icon: 'paw', col: p.col, title: `New pet: ${p.name}!`, text: `A ${p.kind.toLowerCase()} has decided to follow you. ${p.text}.`, action: { label: 'Meet them', fn: () => { DQ.ui.beastTab = 'pets'; DQ.go('bestiary'); } }, sound: 'gem', burst: true, ttl: 14000 });
  DQ.log(`A new pet joins you: ${p.name} the ${p.kind.toLowerCase()}!`, 'quest'); DQ.emit('pets'); DQ.achDirty = true; return true;
};
DQ.petRoll = (type, key) => {
  for (const p of D.PETS) {
    if (S().pets.owned[p.id]) continue; const s = p.src;
    if (s.type === type && (type === 'harvest' || s.skill === key || s.mon === key) && chance(s.chance)) DQ.awardPet(p.id);
  }
};
DQ.setPet = id => { if (id && !S().pets.owned[id]) return; S().pets.active = id; DQ.fxDirty(); DQ.emit('pets'); };

/* ---------- Bestiary ---------- */
DQ.beastStars = id => { const k = (S().beast.kills[id] || 0); return k >= 250 ? 3 : k >= 50 ? 2 : k >= 10 ? 1 : 0; };
DQ.beastBonus = id => DQ.beastStars(id) * .04;
DQ.recordKill = (m, drops) => {
  const b = S().beast, before = DQ.beastStars(m.id); b.kills[m.id] = (b.kills[m.id] || 0) + 1;
  drops.forEach(id => b.drops[m.id + ':' + id] = 1);
  const after = DQ.beastStars(m.id);
  if (after > before) DQ.notify({ kind: 'info', key: 'beast:' + m.id, icon: 'book', col: '#d8a64a', title: `Bestiary: ${m.name} ${'★'.repeat(after)}`, text: `You deal ${after * 4}% more damage to them now.`, sound: 'perk' });
};

/* ---------- Farming ---------- */
DQ.plotCount = () => Math.min(11, S().farm.plotsBought + DQ.fx().plots);
DQ.syncPlots = () => { const F = S().farm; while (F.plots.length < DQ.plotCount()) F.plots.push({ crop: null }); };
DQ.growDur = c => Math.round(c.secs * 1000 * DQ.speedMult('farming') * (1 - DQ.fx().grow));
DQ.plotRipe = p => !!p.crop && GT() >= p.at + p.dur;
DQ.plotPct = p => p.crop ? clamp((GT() - p.at) / p.dur, 0, 1) : 0;
DQ.plant = (i, cid, o = {}) => {
  const F = S().farm, p = F.plots[i], c = D.CROP[cid]; if (!p || p.crop || !c) return false;
  if (!DQ.skillUnlocked('farming')) return o.quiet ? false : DQ.toast('Farming is not unlocked yet', true);
  if (DQ.lvl('farming') < c.lvl) return o.quiet ? false : DQ.toast(`Requires Farming ${c.lvl}`, true);
  if (!DQ.take('seed_' + cid, 1)) return o.quiet ? false : DQ.toast(`You have no ${c.name.toLowerCase()} seeds. The shop sells them.`, true);
  Object.assign(p, { crop: cid, at: GT(), dur: DQ.growDur(c) });
  if (!o.by) { DQ.addXp('farming', c.pxp); DQ.sfx('wood'); }
  F.last = cid; DQ.emit('farm'); return true;
};
DQ.harvest = (i, o = {}) => {
  const F = S().farm, p = F.plots[i]; if (!p || !DQ.plotRipe(p)) return false;
  const c = D.CROP[p.crop], lv = o.by ? D.lvlOf(o.by.xp) : DQ.lvl('farming');
  const n = rnd(c.yld[0], c.yld[1]) + Math.floor(lv / 25);
  DQ.grant('crop_' + c.id, n); p.crop = null;
  if (o.by) { o.by.xp += c.hxp * .6; o.by.made['crop_' + c.id] = (o.by.made['crop_' + c.id] || 0) + n; }
  else {
    const x = DQ.addXp('farming', c.hxp); S().stats.harvest++; DQ.qev('harvest', c.id); DQ.petRoll('harvest');
    DQ.floatAt(document.querySelector(`.plot[data-i="${i}"]`), `${DQ.ico('crop')}+${n} ${c.name.toLowerCase()} · +${fmt(x)} XP`, c.col); DQ.sfx('fish');
  }
  if (F.autoReplant || o.by) DQ.plant(i, c.id, { quiet: true, by: o.by });
  DQ.emit('farm'); return true;
};
DQ.harvestAll = () => { let n = 0; S().farm.plots.forEach((p, i) => { if (DQ.harvest(i)) n++; }); if (!n) DQ.toast('Nothing is ready to harvest yet'); };
DQ.plantAll = cid => { let n = 0; S().farm.plots.forEach((p, i) => { if (!p.crop && DQ.plant(i, cid, { quiet: n > 0 })) n++; }); return n; };
DQ.buyPlot = () => {
  const F = S().farm, price = D.PLOT_PRICES[F.plotsBought]; if (price === undefined) return DQ.toast('No more land to buy', true);
  if (S().coins < price) return DQ.toast('Not enough coins', true);
  S().coins -= price; F.plotsBought++; DQ.syncPlots(); DQ.sfx('buy'); DQ.emit('farm');
};
/* Animals */
DQ.animalPeriod = a => D.ANIMAL[a.id].secs * 1000 * (1 - DQ.fx().animal) * DQ.speedMult('farming');
DQ.buyAnimal = id => {
  const F = S().farm, a = D.ANIMAL[id];
  if (!DQ.townUnlocked('mossbarrow')) return DQ.toast('The livestock trader is in Mossbarrow', true);
  if (DQ.lvl('farming') < a.lvl) return DQ.toast(`Requires Farming ${a.lvl}`, true);
  if (F.animals.length >= F.pensBought) return DQ.toast('All your pens are full. Build another pen first.', true);
  if (S().coins < a.price) return DQ.toast('Not enough coins', true);
  S().coins -= a.price; F.animals.push({ id, t: 0, stored: 0, happy: 0, name: DQ.pick(['Clover', 'Daisy', 'Pickle', 'Muffin', 'Bramble', 'Nutmeg', 'Turnip', 'Poppy', 'Sprout', 'Hazel', 'Beans', 'Fern']) });
  DQ.sfx('buy'); DQ.log(`You buy a ${a.name.toLowerCase()}.`); DQ.emit('farm');
};
DQ.buyPen = () => {
  const F = S().farm, price = D.PEN_PRICES[F.pensBought]; if (price === undefined) return DQ.toast('Your barn is as big as it gets', true);
  if (S().coins < price) return DQ.toast('Not enough coins', true);
  S().coins -= price; F.pensBought++; DQ.sfx('buy'); DQ.emit('farm');
};
DQ.collect = (i, o = {}) => {
  const a = S().farm.animals[i]; if (!a || !a.stored) return 0;
  const A = D.ANIMAL[a.id], n = a.stored; a.stored = 0; DQ.grant(A.prod, n);
  if (o.by) { o.by.xp += A.xp * n * .6; o.by.made[A.prod] = (o.by.made[A.prod] || 0) + n; }
  else { const x = DQ.addXp('farming', A.xp * n); S().stats.collect += n; DQ.qev('collect', A.prod, n); DQ.floatAt(document.querySelector(`.pen[data-i="${i}"]`), `+${n} ${D.ITEMS[A.prod].name.toLowerCase()} · +${fmt(x)} XP`, D.ITEMS[A.prod].col); DQ.sfx('coin'); }
  if (!o.by) S().stats.collect += 0;
  DQ.emit('farm'); return n;
};
DQ.collectAll = () => { let n = 0; S().farm.animals.forEach((a, i) => { n += DQ.collect(i); }); if (!n) DQ.toast('Nothing to collect yet'); };
DQ.petAnimal = i => {
  const a = S().farm.animals[i]; if (!a) return; a.happy = GT() + 180000; DQ.addXp('farming', 2); DQ.qev('pet', a.id); DQ.sfx('perk');
  const el = document.querySelector(`.pen[data-i="${i}"] .px`); DQ.floatAt(el, '♥ ♥', '#f08aa0'); DQ.emit('farm');
};
DQ.fillTrough = () => { const n = DQ.have('feed'); if (!n) return DQ.toast('You have no animal feed. Buy some, or turn spare crops into feed.', true); DQ.take('feed', n); S().farm.feed += n; DQ.sfx('eat'); DQ.emit('farm'); };
DQ.makeFeed = () => { let made = 0; ['crop_potato', 'crop_onion', 'crop_cabbage', 'crop_wheat'].forEach(id => { const n = DQ.have(id); if (n) { DQ.take(id, n); made += n * 3; } }); if (!made) return DQ.toast('You need potatoes, onions, cabbages or wheat to make feed', true); S().farm.feed += made; DQ.toast(`Made ${made} feed for the trough`); DQ.emit('farm'); };

/* ---------- House ---------- */
DQ.buyHouse = () => {
  const H = S().house; if (H.owned) return;
  if (DQ.advLvl() < D.HOUSE.adv) return DQ.toast(`You can buy a house at Hero level ${D.HOUSE.adv}`, true);
  if (S().coins < D.HOUSE.price) return DQ.toast('Not enough coins', true);
  S().coins -= D.HOUSE.price; H.owned = true; H.rooms = { parlour: true }; DQ.sfx('quest');
  DQ.notify({ kind: 'quest', key: 'house', icon: 'house', col: '#d8a64a', title: 'You own a house!', text: `${D.HOUSE.where[0].toUpperCase() + D.HOUSE.where.slice(1)}. Furnish it for permanent bonuses.`, sound: false, burst: true });
  DQ.achDirty = true; DQ.emit('house');
};
DQ.buildRoom = id => {
  const H = S().house, r = D.ROOMS.find(x => x.id === id); if (!H.owned || H.rooms[id]) return;
  if (S().coins < r.price) return DQ.toast('Not enough coins', true);
  S().coins -= r.price; H.rooms[id] = true; DQ.sfx('anvil'); DQ.log(`You build a ${r.name.toLowerCase()}.`, 'quest'); DQ.achDirty = true; DQ.emit('house');
};
DQ.canAfford = cost => Object.entries(cost).every(([k, n]) => k === 'coins' ? S().coins >= n : DQ.have(k) >= n);
DQ.furnish = id => {
  const H = S().house, f = D.FURN[id], t = (H.furn[id] || 0); if (!H.rooms[f.room] || t >= 3) return;
  const cost = f.costs[t]; if (!DQ.canAfford(cost)) return DQ.toast('You are missing coins or materials', true);
  Object.entries(cost).forEach(([k, n]) => { if (k === 'coins') S().coins -= n; else DQ.take(k, n); });
  H.furn[id] = t + 1; DQ.fxDirty(); DQ.syncPlots(); DQ.sfx('equip'); S().stats.furnish = (S().stats.furnish || 0) + 1;
  DQ.notify({ kind: 'perk', key: 'furn:' + id, icon: f.ic, col: '#f3d58a', title: `${f.name}${t ? ' upgraded' : ' added'}`, text: f.label(Object.values(f.fx)[0][t]), sound: false });
  DQ.achDirty = true; DQ.emit('house');
};

/* ---------- Hirelings ---------- */
DQ.workerSlots = () => DQ.advLvl() >= D.HIRE.adv ? 1 + DQ.fx().workers : 0;
const mkCand = () => {
  const skill = pick(D.HIRE.skills), top = Math.max(DQ.lvl(skill), 5), lvl = rnd(1, Math.max(3, Math.floor(top * .6))), tr = pick(D.HIRE_TRAITS);
  return { name: pick(D.HIRE_NAMES), skill, lvl, trait: tr[0], fee: Math.round(150 + 60 * Math.pow(lvl, 1.4)), wage: +(1 + lvl * .6).toFixed(1) };
};
DQ.refreshBoard = paid => {
  if (paid) { if (S().coins < 100) return DQ.toast('Not enough coins', true); S().coins -= 100; }
  S().hire.cands = [mkCand(), mkCand(), mkCand()]; S().hire.at = GT(); DQ.emit('workers');
};
DQ.traitOf = w => D.HIRE_TRAITS.find(t => t[0] === w.trait) || D.HIRE_TRAITS[4];
DQ.hire = i => {
  const c = S().hire.cands[i]; if (!c) return;
  if (S().workers.length >= DQ.workerSlots()) return DQ.toast('No free beds. Build bunks in your servants’ quarters for more workers.', true);
  if (S().coins < c.fee) return DQ.toast('Not enough coins', true);
  S().coins -= c.fee; S().workers.push({ id: Date.now() + '' + i, name: c.name, skill: c.skill, xp: D.XPF[c.lvl], trait: c.trait, wage: c.wage, task: null, t: 0, owed: 0, unpaid: false, made: {} });
  S().hire.cands.splice(i, 1, mkCand()); DQ.sfx('buy'); DQ.log(`You hire ${c.name}, a ${D.SK[c.skill].name.toLowerCase()} hand.`); S().stats.hired = (S().stats.hired || 0) + 1; DQ.achDirty = true; DQ.emit('workers');
};
DQ.dismiss = id => { S().workers = S().workers.filter(w => w.id !== id); DQ.emit('workers'); };
DQ.assign = (id, node) => { const w = S().workers.find(x => x.id === id); if (!w) return; w.task = node; w.t = 0; w.unpaid = false; DQ.sfx('start'); DQ.emit('workers'); };
DQ.workerDur = w => {
  const tr = DQ.traitOf(w), sp = clamp(1 - DQ.fx().wspeed - (tr[1] === 'wspeed' ? tr[2] : 0) - (w.boost || 0), .4, 1) * (w.sulk > GT() ? 1.25 : 1);
  if (w.skill === 'farming') return 8000 * sp;
  const n = D.NODE[w.task]; return n ? n.t * 3 * sp : 0;
};
DQ.workerWage = w => w.wage * (1 - DQ.fx().wage) * (DQ.traitOf(w)[1] === 'wage' ? .75 : 1);
function workStep(w) {
  const tr = DQ.traitOf(w), before = D.lvlOf(w.xp);
  if (w.skill === 'farming') {
    S().farm.plots.forEach((p, i) => { if (DQ.plotRipe(p)) DQ.harvest(i, { by: w }); });
    S().farm.animals.forEach((a, i) => { if (a.stored) DQ.collect(i, { by: w }); });
  } else {
    const n = D.NODE[w.task]; if (!n) { w.task = null; return; }
    const L = D.lvlOf(w.xp), p = clamp(.58 + (L - n.lvl) * .012, .55, .96);
    if (chance(p)) {
      const q = 1 + (tr[1] === 'dbl' && chance(tr[2]) ? 1 : 0);
      S().bank[n.item] = (S().bank[n.item] || 0) + q; DQ.invDirty = true; if (DQ.sim.on) DQ.sim.items[n.item] = (DQ.sim.items[n.item] || 0) + q;
      w.made[n.item] = (w.made[n.item] || 0) + q; w.xp += n.xp * .35 * (tr[1] === 'xp' ? 1 + tr[2] : 1);
    }
  }
  const after = D.lvlOf(w.xp);
  if (after > before && !DQ.sim.on) DQ.notify({ kind: 'info', key: 'w:' + w.id, icon: 'users', col: D.SK[w.skill].col, title: `${w.name} reached level ${after}`, text: `${D.SK[w.skill].name} hand. Better work unlocks as they level.`, sound: false, ttl: 5000 });
  if (after > before) w.wage = +(1 + after * .6).toFixed(1);
}

/* ---------- World clock: runs while playing and, capped, while away ---------- */
let petAcc = 0;
DQ.advanceWorld = dt => {
  const s = S(); if (!s || dt <= 0) return;
  if (dt > 5000) { while (dt > 0) { const c = Math.min(5000, dt); DQ.advanceWorld(c); dt -= c; } return; }
  s.gameTime = (s.gameTime || 0) + dt;
  const F = s.farm, f = DQ.fx(), gt = s.gameTime;
  F.animals.forEach(a => {
    const per = DQ.animalPeriod(a) * (a.happy > gt ? .75 : 1); if (a.stored >= 5) { a.t = 0; return; }
    a.t += dt; let g = 0;
    while (a.t >= per && a.stored < 5 && g++ < 500) { if (F.feed <= 0) { a.t = per; a.hungry = true; break; } F.feed--; a.stored++; a.t -= per; a.hungry = false; }
  });
  s.workers.forEach(w => {
    if (!w.task) return;
    w.owed += DQ.workerWage(w) * dt / 60000;
    if (w.owed >= 1) { const c = Math.floor(w.owed); if (s.coins >= c) { s.coins -= c; w.owed -= c; w.unpaid = false; } else { if (!w.unpaid && !DQ.sim.on) DQ.notify({ kind: 'warn', key: 'unpaid', icon: 'coin', col: '#e5b04a', title: `${w.name} has stopped working`, text: 'You cannot afford their wages. Earn some coins and they will start again.', sound: 'stop' }); w.unpaid = true; w.owed = Math.min(w.owed, 5); return; } }
    const d = DQ.workerDur(w); if (!d) return; w.t += dt; let g = 0;
    while (w.t >= d && g++ < 6000) { w.t -= d; workStep(w); }
  });
  const ap = s.pets.active && s.pets.owned[s.pets.active];
  if (ap) { const lv = DQ.petLevel(s.pets.active); ap.aff = (ap.aff || 0) + dt / 60000; if (DQ.petLevel(s.pets.active) > lv) { DQ.fxDirty(); const p = D.PET[s.pets.active]; DQ.notify({ kind: 'perk', key: 'bond', icon: 'heart', col: p.col, title: `${p.name}: bond level ${DQ.petLevel(p.id)}`, text: `Your bond grows stronger. Their bonus is now ${Math.round((1 + .25 * (DQ.petLevel(p.id) - 1)) * 100)}% as strong.`, sound: 'perk' }); } }
  if ((petAcc += dt) > 2000) { petAcc = 0; DQ.fxDirty(); }
};
})();
