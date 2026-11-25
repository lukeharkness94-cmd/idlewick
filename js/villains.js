/* Idlewick: villains to fight, animals to hunt (20–21 Nov 2026, owner feedback).
   Combat areas hold only hostile creatures; animals live in each town's hunting ground (area.hunt, id "<town>:hunt"),
   which Hunting's Quarry tab offers and the combat window leaves out. The roster and stats are data in
   creature_roster.js; this file adds the Mudling and Goblin raider (cloned from the chicken and cow so their drop
   tables match), lays out the areas from D.ROSTER, writes the field-guide notes and gates animals by Hunting level.
   Every creature keeps its id, so old saves keep their kills, field-guide pages and pets. */
(() => {
const DQ = window.DQ, D = DQ.data;
const like = (base, o) => {
  const b = D.MON[base]; if (!b || D.MON[o.id]) return;
  const m = { ...b, ...o, drops: [...o.own, ...b.drops.filter(d => !o.drop.includes(d[0]) && !o.own.some(x => x[0] === d[0]))] };
  delete m.own; delete m.drop; delete m.hl; m.hp = Math.round(o.hp * .62); m.max = Math.max(1, Math.round(o.max * .72));
  D.MON[m.id] = m; D.MONLIST.push(m);
  (D.EXTRA_CREATURES = D.EXTRA_CREATURES || {})[m.id] = { body: o.body, mark: o.mark, index: Object.keys(D.EXTRA_CREATURES).length };
};
/* the chicken and cow lost their weapon drops in creature_roster.js; the villains get them back from the town table */
const townLoot = town => { const g = D.TOWN_GEAR[town] || []; return [['coin_pouch', [1, 1], .05], ['treasure_chest', [1, 1], .004], ...g.map(id => [id, [1, 1], .006]), ['seed_potato', [1, 3], .04], ['bread', [1, 2], .03], ['gem_sapphire', [1, 1], .008]]; };
like('chicken', { id: 'mudling', name: 'Mudling', cl: 1, hp: 3, max: 1, att: 1, def: 1, coins: [0, 3], col: '#7a5a3a', body: 'spectral', mark: 'mud', drop: ['feather', 'egg', 'raw_game'], own: [['seed_potato', [1, 2], .12], ...townLoot('willowbrook')] });
like('cow', { id: 'goblin_raider', name: 'Goblin raider', cl: 8, hp: 10, max: 2, att: 3, def: 4, coins: [1, 6], col: '#7fae5c', body: 'humanoid', mark: 'raider', drop: ['raw_game'], own: [['cowhide', [1, 1], .9], ['feather', [2, 5], .5], ...townLoot('willowbrook')] });
if (D.WEAK) { D.WEAK.mudling = { weak: ['slash', 'fire'], resist: ['crush'] }; D.WEAK.goblin_raider = { weak: ['slash'], resist: [] }; }

/* ---------- field-guide notes, in the house voice ---------- */
const NOTES = {
  mudling: ['A lump of well mud that got up one night and kept walking. Slow, damp and personally offended by boots.', 'Wren insists the mudlings started when someone tipped the last of the well into the meadow “just to see”. Nobody has owned up. Several people have very clean boots.'],
  goblin_raider: ['One of Grubnash’s farm raiders. Carries a sack of stolen hides and wears a henhouse feather as a sort of uniform.', 'Raiders are ranked by the size of their sack. The biggest sack in the Thicket belongs to a raider called Lumpy, who is mostly sack.'],
  goblin_slinger: ['A goblin with a sling and a pocket of gravel. Aims for the head, hits the knee, counts it anyway.', 'Slingers practise on the scarecrow at the edge of the meadow. The scarecrow has started wearing a pan.'],
  thicket_spider: ['The size of a dinner plate and twice as pleased to see you. Its silk makes decent bowstring.', 'Hettie once tried to keep one for the silk. It ate the box it was kept in, then sat on the shelf looking innocent.'],
  goblin_hexer: ['The goblin who read half a spellbook. Throws green sparks and a lot of confident shouting.', 'Hexers claim to know every curse in the world. The one they actually use mostly makes your socks damp.'],
  goblin_brute: ['The biggest goblin in the Thicket, and it has worked out that it is the biggest. Hits like a falling gate.', 'Brutes are fed first and argued with last. Nobody has ever won an argument with one, mainly because they don’t listen.'],
  rabbit: ['A wild rabbit that has eaten half the vegetable patch and plans to finish it. Good for a stew.', 'Old Mother Fern says every rabbit in Willowbrook is related to one called Admiral. The Admiral is long gone. The appetite is not.'],
  pheasant: ['Loud, bright and not as quick off the ground as it thinks. Tail feathers fletch a fine arrow.', 'A pheasant will run along a hedge for a mile rather than fly over it. It considers this a strategy.'],
  sheep: ['A sheep that left the farm and never looked back. Its wool still spins into good cloth.', 'Wild sheep can be counted, but they will not hold still for it. This is why the shepherd is always awake.'],
  poacher: ['Sets snares in the Bramble glades and does not like being found. Carries an axe for the arguments.', 'Poachers leave a coin on the stump for every deer they take. It is the same coin. They take it back on the way out.'],
  mossback_spider: ['A spider that lets moss grow on its back so it can sit in the open and look like a rock. It is not a rock.', 'Foresters tap every rock with a stick before they sit down. They say it is a superstition. It is not.'],
  barrow_ghoul: ['Something that climbed out of the old barrows and found it preferred the fresh air. It still smells of the barrow.', 'The barrows were sealed with a stone and a stern note. The ghouls read the note and left anyway.'],
  grave_robber: ['Digs up the barrows at night for the grave goods and swings the shovel at anyone who asks questions.', 'Grave robbers know every burial in Mossbarrow better than the priest does. Ask them where your great-aunt is. Then run.'],
  bramble_witch: ['Lives in a thicket of her own growing and throws thorns, curses and the occasional jar of jam.', 'Her jam is said to be excellent. Nobody has eaten any. You have to go into the thicket to get it.'],
  dire_wolf: ['A wolf the size of a pony with a pony’s worth of appetite. The pack follows it because nobody else will lead.', 'Dire wolves howl at the moon, and in Mossbarrow the moon seems to have got used to it.'],
  red_deer: ['A big red stag that rules the glades in autumn. Its hide tans into good leather and its haunch feeds a family.', 'Stags roar all through rutting season. The villagers roar back, mostly asking them to stop.'],
  tide_thief: ['Wades in at low tide, steals what the fishers left on the sand, and is gone before the water turns.', 'Every fisher in Saltmere has lost a bucket to a tide thief. Most of the buckets end up back on the beach, empty.'],
  drowned_sailor: ['A sailor who went down with the ship and came back up without it. Still wants his wages.', 'The drowned still keep the ship’s watches. Ring a bell at the right hour and they line up for supper.'],
  pirate_bosun: ['Runs the deck with a cutlass and a voice that carries over a storm. Owes everyone money.', 'A bosun’s whistle can call a crew from three coves away. Unfortunately it also calls every gull.'],
  sea_hag: ['Weedy hair, a laugh like a gutter and very strong opinions about your rowing. Curses in three tides.', 'Sea hags trade in names. Never tell one yours. Tell her your cousin’s.'],
  reef_serpent: ['A long green serpent that coils around the reefs and treats ships as ornaments. Bites through rope.', 'Its scales flash like coins under the water, which has drowned more greedy divers than the serpent ever did.'],
  gull: ['A herring gull: loud, fearless and convinced your lunch is its lunch. Plenty of feathers, sometimes eggs.', 'Saltmere has tried nets, scarecrows and a man with a drum. The gulls ate the man’s sandwiches.'],
  seal: ['A grey seal hauled out on the rocks, fat with fish. Its thick hide makes a good waterproof leather.', 'Seals sing on still nights. Fishers say it is a lament for lost sailors. It is mostly about fish.'],
  kobold: ['A little miner with a lamp on its helmet and a grudge against anyone else in its tunnel.', 'Kobolds sing while they dig. The song has forty verses and all of them are complaints about dwarves.'],
  ice_wight: ['A cold shape in the pass that drifts toward warmth. It will take yours if you let it.', 'Wights cannot cross a lit hearth. Ironpeak’s hearthkeepers have not let a fire go out in two hundred years.'],
  yeti: ['A great white shape in the snow with long arms and a short temper. The fur is warm. Getting it is not.', 'Yetis are very shy. They only come out when you are halfway up a cliff with both hands full.'],
  mountain_goat: ['Climbs cliffs that would scare a cat. Gives meat, a little wool and the occasional frosty pelt.', 'Goats on the high pastures will eat anything. They have eaten maps, boots, and once a whole sign that said “No goats”.'],
  snow_hare: ['White on white, fast as a thrown snowball. The pelt is soft and very warm.', 'Snow hares turn brown in summer and white in winter. Ironpeak doesn’t have a summer, so they are white.'],
  woolly_yak: ['A slow shaggy mountain of wool with horns. Shears for days, if it lets you.', 'Ironpeak weavers say one yak gives enough wool for a family’s winter. The yak would like a word about that.'],
  ice_elk: ['An elk with antlers like icicles that ring when it shakes its head. The pelt is frost-white and warm.', 'Old miners say the ice elk lead lost travellers down to the valley. They lead them down the steep way.'],
  giant_leech: ['A leech as long as your arm and twice as hungry. Waits in the shallows of the Sunken Road.', 'Fen people wear their trousers tucked into their boots. They do not explain why. You will find out.'],
  bog_hag: ['Sits in a hut on stilts and sells cures nobody asked for. Fights with a staff and a very long memory.', 'A bog hag will grant one wish for one favour. The favour always involves fetching something from deep water.'],
  fen_ghoul: ['Something pale and bony that drags itself out of the reeds at dusk. Chews on old bones and new ones.', 'Fen ghouls hate lanterns. Gloomfen houses hang three on every porch, and one spare.'],
  marsh_heron: ['A tall grey heron that stands so still in the reeds you forget it is there. Its feathers are long and fine.', 'A heron will stand on one leg for an hour to catch one fish. Gloomfen fishers find this deeply relatable.'],
  fen_boar: ['A black boar that wallows in the bog and comes out wearing it. Its hide dries into tough scale.', 'Fen boars smell the way the fen smells, only more. Hunters track them by the wind and a strong stomach.'],
  mirelight_stag: ['A stag whose antlers glow green at night. Folk once followed the light into the bog. Some came back.', 'The glow comes from moss on the antlers. Knowing this does not make it less unsettling at midnight.'],
  moss_tortoise: ['A tortoise as big as a cart with a garden growing on its shell. It is older than most of the houses.', 'Children in Gloomfen ride the moss tortoises to school. They arrive late, but in good spirits.'],
  ash_cultist: ['Wears a grey hood and worships the volcano. The volcano has not noticed but the cultist has a staff anyway.', 'Cultists chant at sunrise. The chant is mostly “please don’t”. The volcano is also not listening to that.'],
  magma_golem: ['Rock and lava stuck together with bad intentions. Drips on the floor and sets it on fire.', 'Emberfall smiths would love to keep one for a forge. Nobody has worked out how to keep it from wandering off.'],
  ember_wraith: ['A drifting flame with a face in it. Looks for something to burn and settles for you.', 'Ember wraiths are what is left when a forge fire is put out with too many angry words.'],
  cinder_lizard: ['A red lizard that basks on hot rocks and spits sparks when cornered. Its skin cures into drakehide.', 'Cinder lizards are good luck in a smithy. Bad luck in a hayloft.'],
  ember_stag: ['A stag with antlers that smoulder like embers. The hide is tough and smells faintly of bonfires.', 'Hunters in Emberfall wear wet cloaks. It doesn’t stop the stag. It does stop the cloak catching.'],
  ashen_boar: ['A grey boar with cracks of fire down its back. Charges straight through anything that is not a mountain.', 'Ashen boars roll in hot ash to keep the flies off. It works. It also keeps the hunters off.'],
  firebird: ['A bird of red and gold flame. Its tail feathers are prized and its temper is legendary.', 'A firebird feather in the window keeps the house warm all winter. Also, sometimes, the curtains.'],
  harpy: ['Half bird, half shouting. Swoops on travellers for shiny things and stays to argue about them.', 'Harpies keep a nest of stolen spoons. Nobody knows why spoons. Nobody has asked twice.'],
  sky_pirate: ['Raids airships from a kite with a cutlass and good boots. Very polite until the cutlass comes out.', 'Sky pirates bury treasure on clouds. They lose most of it when the weather changes.'],
  storm_elemental: ['A thundercloud that decided to walk. Hits like lightning, because it is.', 'Skyreach weather wardens try to reason with storm elementals. The elementals reply with weather.'],
  cloud_giant: ['A giant who lives in the clouds and treats the peaks as stepping stones. Very large, very bored.', 'Cloud giants play catch with boulders. When it hails rocks in Skyreach, someone has dropped one.'],
  griffin: ['An eagle’s head and wings on a lion’s body, and the pride of both. Feathers and hide from one hunt.', 'Griffins mate for life and hold grudges for longer. Hunt one and its partner remembers your face.'],
  sky_stag: ['A white stag with golden antlers that grazes on the clouds. Hunters say you only see one once.', 'Hunters say that about all sorts of things. They see the sky stag fairly often, if they are honest.'],
  void_stalker: ['A spider shape made of the dark between stars. Waits on the ceiling of the Causeway for footsteps.', 'Look up when you hear nothing at all in the Hollow. That is when it is closest.'],
  hollow_wight: ['A cold crowned shadow of one of the Hollow King’s court. Still giving orders. Nobody is listening.', 'Wights keep the old court’s hours. They wake at midnight and expect to be bowed to.'],
  moon_hare: ['A pale hare that glows faintly and is said to carry a little moonlight in its pouch.', 'Children leave carrots out for the moon hare. In the morning the carrots are gone and there is moonlight on the step.'],
  star_stag: ['A dark stag with stars in its coat and pale antlers. Its scales shine like the night sky.', 'The star stag only walks where no lamps are lit. The Hollow has plenty of those, these days.'],
  shadow_lynx: ['A lynx made of shadow with two violet eyes. You only see it when it wants to be seen.', 'Shadow lynxes hunt by sitting perfectly still in the dark. They are excellent at it. So is the dark.'],
  eclipse_roc: ['A black bird big enough to blot out the sun, with a ring of gold where its eye catches the light.', 'When the eclipse roc flies over the Hollow, every candle gutters. Then everyone checks the candles are still there.']
};
if (D.LORE) for (const [id, [note, legend]] of Object.entries(NOTES)) if (D.MON[id] && !D.LORE[id]) D.LORE[id] = { note, legend };

/* ---------- areas from D.ROSTER: two combat areas and a hunting ground per town ---------- */
const W = D.ROSTER_WEIGHTS || [30, 24, 18, 13, 9, 6];
for (const [town, r] of Object.entries(D.ROSTER || {})) {
  const old = D.AREAS[town] || [], area = (i, name, ids) => ({ ...(old[i] || {}), id: `${town}:${i}`, town, name, monsters: ids.filter(id => D.MON[id]).map((id, j) => ({ id, weight: W[j] || 5 })) });
  const list = r.areas.map(([name, ids], i) => area(i, name, ids));
  list.push({ id: `${town}:hunt`, town, name: r.hunt[0], hunt: true, monsters: r.hunt[1].filter(id => D.MON[id]).map((id, j) => ({ id, weight: W[j] || 5 })) });
  D.AREAS[town] = list;
}
DQ.combatAreas = town => (D.AREAS[town] || []).filter(a => !a.hunt);
DQ.huntGround = town => (D.AREAS[town] || []).find(a => a.hunt) || null;
/* an old save fighting in yesterday's Farm fields keeps going in the new hunting ground */
const areaById = id => Object.values(D.AREAS).flat().find(a => a.id === id);
const legacy = { 'willowbrook:farm': 'willowbrook:hunt' };

/* ---------- Hunting level: animals above it cannot be tracked yet; a quest target always can ---------- */
DQ.huntLevel = () => DQ.fieldAccessLevel ? DQ.fieldAccessLevel() : DQ.lvl('hunting');
DQ.canHunt = m => !m || !m.hl || DQ.huntLevel() >= m.hl || DQ.questWantsKill(m.id);
const pick0 = DQ.pickEncounter;
DQ.pickEncounter = (area, target) => {
  if (!area || !area.hunt) return pick0(area, target);
  if (target && area.monsters.some(e => e.id === target)) return D.MON[target];
  const open = area.monsters.filter(e => DQ.canHunt(D.MON[e.id]));
  return open.length ? pick0({ ...area, monsters: open }, null) : null;
};
const start0 = DQ.startHunt;
DQ.startHunt = (areaId, target = null, forQuest = false) => {
  areaId = legacy[areaId] || areaId; const area = areaById(areaId);
  if (area && area.hunt) { if (target && !DQ.canHunt(D.MON[target])) return false; if (!target && !area.monsters.some(e => DQ.canHunt(D.MON[e.id]))) return false; }
  return start0(areaId, target, forQuest);
};
const next0 = DQ.nextEncounter;
DQ.nextEncounter = defeated => {
  if (DQ.act && legacy[DQ.act.area]) { DQ.act.area = legacy[DQ.act.area]; if (DQ.S.act) DQ.S.act.area = DQ.act.area; }
  const area = DQ.act && areaById(DQ.act.area);
  /* a hunt pays Hunting three times what an ordinary fight does (skill_expansion gives cl x 1.4 for every kill) */
  if (area && area.hunt && defeated && DQ.skillUnlocked && DQ.skillUnlocked('hunting') && !DQ.forecasting) DQ.addXp('hunting', Math.max(6, Math.round(defeated.cl * 2.8)));
  return next0(defeated);
};
/* ---------- fieldwork traps catch the hunting ground's animals, so they bring back what those animals drop ---------- */
const fieldMats = () => {
  if (!DQ.fieldMaterials || DQ.fieldMaterials._roster) return;
  const fm0 = DQ.fieldMaterials;
  DQ.fieldMaterials = town => {
    const g = DQ.huntGround(town); if (!g) return fm0(town);
    const out = [];
    for (const e of g.monsters) { const m = D.MON[e.id]; if (!m || (m.hl && DQ.huntLevel() < m.hl)) continue; for (const [k] of m.drops || []) { const it = D.ITEMS[k]; if (it && !it.slot && it.type !== 'container' && !it.unique && !out.includes(k)) out.push(k); } }
    return out.length ? out : fm0(town);
  };
  DQ.fieldMaterials._roster = true;
};
setTimeout(fieldMats, 0); if (document.readyState !== 'loading') fieldMats(); else document.addEventListener('DOMContentLoaded', fieldMats);

/* ---------- every ordinary enemy can become a companion (hunting.js); the late arrivals too ---------- */
for (const id of ['mudling', 'goblin_raider']) {
  const m = D.MON[id], pid = 'wild_' + id; if (!m || !D.PET || D.PET[pid]) continue;
  const p = { id: pid, name: m.name, kind: 'Wild beast', spr: 'quad', mon: id, col: m.col, collectible: false, src: { type: 'hunt', mon: id }, bonus: id === 'mudling' ? { dr: .02 } : { coin: .03 }, text: id === 'mudling' ? '−2% damage taken' : '+3% coins' };
  D.PETS.push(p); D.PET[pid] = p;
}
/* sprites for the two cloned villains */
const A = DQ.pixelArt;
if (A && A.CREATURE_SPECS && A.blob && A.humanoid) {
  const rp = c => A.ramp(c);
  A.CREATURE_SPECS.mudling = () => { const s = A.blob({ col: '#7a5a3a' }); for (const [x, y] of [[11, 7], [16, 5], [21, 7]]) s.ell(x, y, 1.6, 1.6, rp('#9a9488')); s.line(23, 18, 29, 12, rp('#8fa860')); s.fix(29, 11, '#c8d890'); return s; };
  A.CREATURE_SPECS.goblin_raider = () => { const s = A.humanoid({ skin: '#7fae5c', cloth: '#7a5a36', ears: 'goblin', mouth: 'grin', hat: 'hood', hatCol: '#4e3f2e', weapon: 'dagger', belt: '#5a3a22' }); s.ell(7, 19, 4, 5, rp('#9c7a4c')); s.ell(7, 16, 2, 1, rp('#b8955f')); s.line(9, 14, 12, 12, rp('#6e5235')); s.line(19, 2, 22, 0, rp('#eee5cf')); s.fix(21, 1, '#ffffff'); return s; };
}
})();
