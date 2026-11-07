/* Idlewick: words. Monster field notes and legends (unlocked by defeating them), and weapon names that get cooler as they get rarer. */
(() => {
const DQ = window.DQ, D = DQ.data;

/* ---------- Weapons: plain names for starter gear, grander ones as the metal improves ---------- */
const T = ['bronze', 'iron', 'steel', 'mithril', 'adamant', 'rune', 'astral'];
const WEAPON_NAMES = {
  sword: ['Bronze Shortsword', "Soldier's Blade", "Knight's Longsword", 'Skyforged Saber', 'Emerald Reaver', 'Glacier Fang', 'Starsunder'],
  dagger: ['Bronze Knife', 'Alley Knife', 'Quickfang', 'Whisperblade', "Viper's Kiss", 'Frostbite', 'Nightglint'],
  hammer: ['Bronze Mallet', "Smith's Maul", 'Siegebreaker', 'Thunderhead', 'Earthshaker', 'Avalanche', 'Worldbreaker'],
};
const W = {};
T.forEach((t, i) => Object.entries(WEAPON_NAMES).forEach(([k, names]) => { W[`${t}_${k}`] = names[i]; }));
Object.assign(W, {
  bow_normal: 'Wooden Shortbow', bow_oak: "Hunter's Bow", bow_willow: 'Whisperwood Bow', bow_maple: 'Autumn Recurve', bow_yew: 'Nightyew Longbow', bow_magic: 'Spellstring', bow_elder: 'Elderthorn Greatbow',
  staff_normal: 'Wooden Staff', staff_oak: "Acolyte's Staff", staff_willow: 'Willowshade Staff', staff_maple: 'Emberwood Staff', staff_yew: 'Yewbound Staff', staff_magic: 'Aetherwood Staff', staff_elder: 'Elderlight',
  barnacle_cutlass: 'Saltbitten Cutlass', witch_staff: "Morwenna's Hexstaff", emberfang_bow: 'Emberfang, the Wyrm Bow',
});
D.WEAPON_NAMES = W;
const FL_METAL = ['Plain and practical.', 'Issued to town guards.', "A knight's pride.", 'It hums faintly when drawn.', 'Cold and green as a deep pool.', 'Etched with old magic.', 'Forged from falling stars.'];
const FL_WOOD = ['Cut from a roadside tree.', 'Strong and steady.', 'Supple and quick.', 'Fine-grained and sweet-smelling.', 'The longbow everyone trusts.', 'Wood that remembers spells.', 'Older than the towns.'];
const WOODS = ['normal', 'oak', 'willow', 'maple', 'yew', 'magic', 'elder'];
Object.keys(W).forEach(id => {
  const it = D.ITEMS[id]; if (!it) return; it.name = W[id];
  const m = id.match(/^(bronze|iron|steel|mithril|adamant|rune|astral)_/), w = id.match(/^(?:bow|staff)_(\w+)$/);
  it.flavour = m ? FL_METAL[T.indexOf(m[1])] : w ? FL_WOOD[WOODS.indexOf(w[1])] : { barnacle_cutlass: 'Still smells of the sea, and of an apology.', witch_staff: 'The cauldron may have been involved.', emberfang_bow: 'The string is the colour of a sunset in a bad mood.' }[id];
});
Object.values(D.RECIPES).forEach(r => { const out = Object.keys(r.out || {})[0]; if (W[out]) r.name = W[out]; });

/* ---------- The research ladder: what each kind of defeat count teaches you ---------- */
D.RESEARCH = {
  ranks: [['sighted', 'Sighted', 'Name, level and where it lives'], ['weak', 'Weak points', 'What hurts it, and what it shrugs off'], ['vitals', 'Vitals', 'Health, biggest hit and what it carries'], ['drops', 'Drop table', 'Everything it can drop, and how rare'], ['notes', 'Field notes', 'How it behaves'], ['legend', 'Legend', 'Its story']],
  regular: [1, 3, 10, 25, 50, 100], boss: [1, 1, 3, 5, 8, 12],
};

/* ---------- Field notes (rank 5) and legends (rank 6) ---------- */
const L = (note, legend) => ({ note, legend });
D.LORE = {
  chicken: L('Fussy, loud and very sure of itself. Stays near farmyards and flaps at anything that moves.', 'Willowbrook folk swear the first chicken in the valley belonged to Elder Wren herself, and has been laying eggs of increasing disapproval ever since.'),
  rat: L('Grew large on mill grain and bad decisions. Hits weakly but never stops chewing.', 'The millers say the rats were normal-sized until the Great Cheese Spill. Nobody will say whose cheese it was.'),
  goblin: L('Scrappy raiders who steal first and plan later. They fear loud noises and organised farmers.', 'Goblin clans measure wealth in shiny buttons. A chief with forty buttons is considered unbeatable, which Grubnash has been testing.'),
  cow: L('Placid, enormous, and bafflingly hard to hurry. Kicks if startled, which is nearly always.', 'A cow called Brindle is said to have refused to leave one field for three years, and the farm was built around her.'),
  grubnash: L('Hits harder when angry, and he is nearly always angry. A warhammer cracks his armour.', 'Grubnash took the hill fort with a stolen cart and a very good speech. His war cry is mostly vowels. The goblins follow him because he has never lost an argument, mainly because nobody dares to continue one.'),
  boar: L('Territorial and short-tempered. It charges in straight lines, which is its only plan.', 'Hunters talk of a boar so stubborn it once charged a river, and lost.'),
  wolf: L('Hunts at dusk and respects fire. Lone wolves are bold; packs are bolder.', 'The Grey Wolf of Mossbarrow Wood is a story told to children to make them come home before dark. It works about half the time.'),
  scarecrow: L('Stuffed with straw and old grudges. Moves only when you are not quite looking. Fire is its undoing.', 'Farmers swear they only ever built one scarecrow per field. The fields have more now. Nobody will discuss it.'),
  oldtusk: L('Charges in a brutal line. Fight him at range and he can barely touch you.', 'Old Tusk is older than the market itself. The first Mossbarrow farmers fenced around him rather than risk a conversation. His tusks are carved with the dates of every fence that failed.'),
  crab: L('Armoured, patient, and exactly the colour of a rock. Slashing blades skid off its shell.', 'Fishermen mark good reefs with a painted stone. Sometimes the stone gets up and leaves.'),
  bandit: L('Poachers of the coast road. Quick with a knife and quicker with an excuse.', 'The Saltmere bandits hold a vote on every robbery. It takes so long that most travellers escape.'),
  smuggler: L('Hauls contraband through the dunes and fights dirty when cornered.', 'Smugglers swear their cargo is "mostly turnips". The turnips make a clinking sound.'),
  pirate: L('Salt-stained sailors turned raiders. Fond of loud noises and tight ropes.', "Captain Barnacle's crew keeps a ledger of every ship they have robbed, ranked by how rude the captain was about it."),
  barnacle: L('His crust of barnacles turns away blades and arrows. Crushing blows and storm spells work best.', 'Barnacle was the harbour\'s finest captain until the tide took his ship and a reef took his pride. He now commands the wreck from its beach, convinced the sea owes him a refund. His cannon has never missed, only arrived late.'),
  bat: L('Swarms in cold tunnels and strikes from above. Unnerved by sharp light.', 'Ironpeak miners keep a bell in every tunnel. The bats hate it. The miners love how much the bats hate it.'),
  icewolf: L('A pale hunter of the high passes whose breath freezes in the air. Fire makes it hesitate.', 'Travellers say you can hear an ice wolf by the silence it leaves. Then you cannot.'),
  raider: L('A dwarf of the lower deeps, armoured and stubborn. Lightning cracks their iron.', 'The raiders were once honest miners who simply stopped being paid. They have since developed strong opinions about invoices.'),
  troll: L('Huge, slow and tougher than the rock it sleeps on. Fire scorches its thick hide.', 'Mountain trolls turn to stone in sunlight, and have been caught out so often that the high road is lined with very surprised statues.'),
  frostmaw: L('His glacier slam can freeze you in place. Fire breaks the ice, and is his weakness.', "Frostmaw wasn't born cold. The mountain was warm once, they say, until Frostmaw sat down on it. Where he sleeps the snow never melts, and the avalanches arrive with timing that feels personal."),
  zombie: L('Shambles slowly, but never stops. Fire spooks it more than blades.', 'The Gloomfen dead are patient. They simply wait for a living traveller to look lost enough to follow.'),
  skeleton: L('Bones that remember how to fight. Heavy blows rattle them apart.', 'Marsh skeletons collect buttons from the dead, and nobody knows why. The buttons are sorted by size.'),
  bogsnapper: L('A moss-green reptile that hides under still water and snaps at passing boots.', 'Fen guides say every pond has a snapper king under it. The guides never go back to check.'),
  wraith: L('A cold spirit that drifts across the water. Ordinary blades pass through it; aether and fire bite.', 'Wraiths are the memory of fen travellers, repeating their last walk. Some walk in loops, forever late for supper.'),
  morwenna: L('Her Hex curses you for several attacks. Wards and daggers work; most spells slide off her.', 'Morwenna was the fen\'s herbalist before the fog came in and offered her a better recipe. Her hex is mostly gossip, weaponised. Her cauldron has never been scrubbed, and every apprentice who offered has left permanently changed.'),
  imp: L('A cackling spark of mischief that hurls small fireballs. Frost sends it sulking.', 'Imps set fires purely for the applause. Reviews at Emberfall are, apparently, strong.'),
  hound: L('Molten fur and a bad temper. Frost cracks its hide.', 'Emberfall children are taught to say "good dog" very quietly. The hounds appreciate it and bite anyway.'),
  drake: L('A young dragon, proud and hungry. Arrows through the wing find its weak spot.', 'Every drake believes it is the wyrm\'s chosen heir. Pyrrhax lets them believe it until they get too tall.'),
  emberlord: L('An armoured knight wrapped in glowing coals. It ignores most fire, so bring frost.', "The Cinder knights swore an oath to guard Emberfall's gate. The gate burned down centuries ago. They are still very diligent."),
  pyrrhax: L('Wyrmfire scorches everything. Frost dampens the flames by half and is his weakness.', "Pyrrhax is a wyrm older than the citadel, which was built, according to Emberfall's records, around a nap. His fire is patient; his pride is not. Frost can blunt the flames, but nothing has ever blunted the stare."),
  hawk: L('Rides the thermals above Skyreach and dives on anything shiny. Arrows and lightning bring it down.', 'Skyreach shepherds have trained a few storm hawks to guard sheep. The hawks have trained the shepherds to bring snacks.'),
  golem: L('Living stone shaped like a cloud. Crushing blows and aether break it.', "Skyreach's founders carved the golems as bridges. The golems promptly decided they would rather be doormen."),
  wyvern: L('A smaller cousin of the dragons that hunts on the wing. Frost and arrows ground it.', 'A wyvern will follow a stormfront for weeks just to sit on it. Weather scholars call this unscientific.'),
  zephyrion: L('Stays in the air. Pin him with a bow, or melee will barely reach him.', "Zephyrion rides the storm like a pony. Its wingbeats can be heard three valleys away; its shadow can be felt in two. Sailors say it keeps the weather in a nest, and that the eggs are very upset."),
  voidknight: L('A hollow armour animated by something that has no name. Aether and crushing blows break it.', 'The Void knights swore fealty to a king who no longer exists. They continue to raise a banner for him anyway.'),
  shade: L('A darkness with a shape. Ordinary weapons barely scratch it; fire and aether sting.', 'Shades are what is left when a name is forgotten. They hum, and the tune is a little too familiar.'),
  horror: L('Too many eyes and not enough patience. Fire and piercing arrows hurt it.', 'Scholars who study the Abyssal horrors have filed hundreds of reports. All of them end with the word "anyway".'),
  hollowking: L('Changes form twice. Crush first, then aether and fire, then pierce.', 'The Hollow King wore a crown of every title he ever claimed, until the weight made him forget the rest. He rules a realm of shadows from a throne he cannot leave, and his court is polite, patient and endless. He has been waiting for you, specifically.'),
};
})();
