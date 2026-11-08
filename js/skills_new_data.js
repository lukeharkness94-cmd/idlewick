/* Carpentry, Sailing and Beastmastery (Nov 2026): data. Art is in skills_new_art.js, behaviour and pages in
   skills_new.js.
   - Carpentry (artisan): saw logs into planks, then build boats. Unlocks after chopping 60 logs at Woodcutting 10.
   - Sailing (gathering): timed voyages to islands for loot found nowhere else in such a mix. Each island needs a boat
     of a certain size (Carpentry builds them). Unlocks once you have visited Saltmere and own a skiff.
   - Beastmastery (gathering): train your companions. Every session raises the companion's level, and your
     Beastmastery level makes every companion's bonus stronger and farm animals produce faster. Unlocks with your
     first companion and Hunting 5. */
(() => {
const DQ = window.DQ, D = DQ.data;
for (const s of [
  { id: 'carpentry', name: 'Carpentry', col: '#c08a4a', group: 'artisan', page: 'carpentry', actionReq: { chop: 60, 'skill:woodcutting': 10 }, blurb: 'Saw logs into planks and build boats.' },
  { id: 'sailing', name: 'Sailing', col: '#3f8fc8', group: 'gather', page: 'sailing', actionReq: { 'visit:saltmere': 1, 'own:boat_skiff': 1 }, blurb: 'Sail from Saltmere to far islands and bring back what you find.' },
  { id: 'beastmastery', name: 'Beastmastery', col: '#d08a5a', group: 'gather', page: 'beastmastery', actionReq: { pets: 1, 'skill:hunting': 5 }, blurb: 'Train your companions: stronger bonds and stronger bonuses.' }
]) { D.SKILLS.push(s); D.SK[s.id] = s; }
const icons = DQ.ICONS || {}; for (const k of ['carpentry', 'sailing', 'beastmastery', 'plank', 'boat', 'island']) if (!(k in icons)) icons[k] = 'M4 12h16';

/* ---------- items: planks from the seven main woods, and five boats ---------- */
const item = (id, o) => { D.ITEMS[id] = Object.assign({ id, val: 1, ic: 'plank', col: '#aab', type: 'resource' }, o); return D.ITEMS[id]; };
const WOODS = [['normal', 'Planks', 1, 19], ['oak', 'Oak planks', 10, 31], ['willow', 'Willow planks', 22, 46], ['maple', 'Maple planks', 38, 68], ['yew', 'Yew planks', 52, 86], ['magic', 'Magic planks', 68, 108], ['elder', 'Elder planks', 82, 125]];
D.RLIST.carpentry = D.RLIST.carpentry || [];
const add = r => { r.t = r.t || 2400; D.RECIPES[r.id] = r; D.RLIST.carpentry.push(r); return r; };
for (const [w, name, lvl, xp] of WOODS) {
  const log = D.ITEMS['log_' + w]; if (!log) continue;
  item('plank_' + w, { name, col: log.col, val: Math.round(log.val * 2 + 1), buy: Math.round(log.buy * 2.4), wood: w, sub: `Sawn from ${log.name.toLowerCase()}. Boats are built from them.` });
  add({ id: 'saw_' + w, skill: 'carpentry', tab: 'Planks', name, lvl, xp, t: 2200, in: { ['log_' + w]: 1 }, out: { ['plank_' + w]: 1 }, ev: 'carve' });
}
/* boats: tier sets which islands you can reach; owned boats are moored, not carried (like tools) */
D.BOATS = [
  ['boat_skiff', 'Skiff', 1, 8, 120, { plank_normal: 12, string: 4 }, '#a07a4f'],
  ['boat_cog', 'Cog', 2, 25, 450, { plank_oak: 20, plank_willow: 10, cloth: 4, bar_iron: 6 }, '#b58a52'],
  ['boat_sloop', 'Sloop', 3, 45, 1200, { plank_maple: 25, cloth: 8, bar_steel: 8 }, '#c9703f'],
  ['boat_caravel', 'Caravel', 4, 65, 3000, { plank_yew: 30, cloth: 12, bar_mithril: 8 }, '#5f9a5a'],
  ['boat_galleon', 'Galleon', 5, 85, 7000, { plank_magic: 30, plank_elder: 15, cloth: 20, bar_adamant: 10 }, '#8f7fe0']
];
for (const [id, name, tier, lvl, xp, inp, col] of D.BOATS) {
  item(id, { name, col, type: 'boat', ic: 'boat', tier, val: Object.entries(inp).reduce((v, [k, n]) => v + (D.ITEMS[k] ? D.ITEMS[k].val * n : 0), 0), sub: `A tier ${tier} boat. Moored at Saltmere; Sailing uses your largest.` });
  add({ id: 'build_' + id.slice(5), skill: 'carpentry', tab: 'Boats', name, lvl, xp, t: 9000, in: inp, out: { [id]: 1 }, ev: 'carve' });
}

/* ---------- Sailing: islands ---------- */
/* [id, name, level, boat tier, seconds, xp, coins, loot [[item, [min,max], chance]], blurb] */
D.VOYAGES = [
  ['gull_rock', 'Gull Rock', 1, 1, 20, 24, [10, 40], [['feather', [6, 14], .9], ['raw_herring', [2, 5], .6], ['string', [1, 3], .3]], 'A guano-white stack an hour out of the harbour. Gulls, nests and the odd wreck.'],
  ['kelp_isle', 'Kelp Isle', 10, 1, 28, 42, [20, 60], [['raw_mackerel', [3, 6], .7], ['seed_cabbage', [1, 3], .4], ['cloth', [1, 1], .15]], 'Kelp forests and a hermit who trades seeds for news.'],
  ['smugglers_cay', 'Smugglers’ Cay', 20, 2, 36, 75, [60, 160], [['coin_pouch', [1, 1], .35], ['gem_sapphire', [1, 1], .2], ['cloth', [1, 3], .4]], 'Caves the smugglers think nobody knows about.'],
  ['amber_shoals', 'Amber Shoals', 30, 2, 42, 110, [80, 200], [['ore_amber', [3, 7], .8], ['raw_tuna', [2, 5], .6], ['seed_strawberry', [1, 3], .3]], 'Shallow golden water where amber washes up on every tide.'],
  ['coral_reach', 'Coral Reach', 40, 3, 50, 165, [120, 300], [['raw_swordfish', [2, 4], .7], ['raw_lobster', [2, 5], .6], ['gem_emerald', [1, 1], .2]], 'A reef you can walk along at low tide, if you are quick.'],
  ['spice_atoll', 'Spice Atoll', 52, 3, 58, 225, [160, 380], [['seed_goldleaf', [1, 3], .5], ['seed_pumpkin', [2, 4], .5], ['cloth', [2, 4], .5]], 'Traders who swap rare seeds for good cloth and better stories.'],
  ['storm_spire', 'Storm Spire', 64, 4, 66, 310, [240, 520], [['raw_stormray', [1, 3], .6], ['ore_skyglass', [1, 3], .4], ['gem_ruby', [1, 1], .25]], 'A needle of rock that lightning visits every evening.'],
  ['sunken_crown', 'Sunken Crown', 78, 4, 74, 440, [400, 900], [['raw_monkfish', [2, 4], .6], ['gem_diamond', [1, 1], .15], ['treasure_chest', [1, 1], .08]], 'The drowned palace of a kingdom older than the Hollow.'],
  ['worlds_edge', 'World’s Edge', 90, 5, 84, 620, [700, 1500], [['raw_voideel', [1, 3], .6], ['ore_astralite', [1, 2], .4], ['seed_starfruit', [1, 2], .3]], 'Where the map stops and the sea goes on.']
].map(([id, name, lvl, boat, secs, xp, coins, loot, blurb]) => ({ id, name, lvl, boat, t: secs * 1000, xp: Math.round(secs * (4.5 + lvl * .33)), coins, loot: loot.filter(([k]) => D.ITEMS[k]), blurb }));
/* voyage XP per second is about 85% of gathering at the same level (5 + 0.4 x level raw XP a second), since the haul
   is the main reward */
D.VOYAGE = Object.fromEntries(D.VOYAGES.map(v => [v.id, v]));

/* ---------- unlocks announced on level-up ---------- */
const unl = (sk, l, name) => { if (l <= 1) return; ((D.UNL[sk] = D.UNL[sk] || {})[l] = D.UNL[sk][l] || []).push(name); };
for (const v of D.VOYAGES) unl('sailing', v.lvl, `Voyage to ${v.name}`);
[[10, 'Companion bonuses +5%'], [25, 'Farm animals produce faster'], [30, 'Companion bonuses +15%'], [50, 'Companion bonuses +25%'], [75, 'Companion bonuses +37%'], [99, 'Companion bonuses +50%']].forEach(([l, n]) => unl('beastmastery', l, n));
})();
