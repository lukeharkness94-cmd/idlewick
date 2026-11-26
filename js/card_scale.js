/* Idlewick: gathering cards show their picture larger, at a whole-number scale that follows the real thing's size
   (owner, 26 Nov 2026: "Could the images of the minerals/trees etc be a little larger in the cards? ... is flax really
   that big in real life? Do some research into how large each thing ... is and make it relevant").
   Approximate real sizes used:
     woodcutting: wild flax under 1 m (drawn as a low clump); hazel and elder are shrub-trees of 3-6 m (1x); every
       other tree is 10-40 m (2x, 96 px tall);
     fishing (the fish sprite is small, so one step up throughout): shrimp and minnow under 10 cm (2x); sardine to
       salmon, lobster, carp, perch, trout, 20-80 cm (3x); pike, catfish, monkfish, anglerfish, tuna, swordfish, shark
       and the large regional fish, 1-3 m and more (4x, 128 px long);
     mining: an ore boulder about a metre across (2x); thieving marks are people (2x).
   Sprites are shown exactly at that whole-number scale, standing on the card's ground line; the card's art box is
   96 px tall on these pages. Presentation only. */
(() => {
const Q = window.DQ, UI = Q.ui;
const SIZE = {
  wood: { flax: 1, hazel: 1, elder: 1, _: 2, w: 32, h: 48 },
  fish: { shrimp: 2, minnow: 2, pike: 4, catfish: 4, monkfish: 4, anglerfish: 4, tuna: 4, swordfish: 4, shark: 4, basaltjaw: 4, stormray: 4, bogray: 4, voideel: 4, skyfin: 4, _: 3, w: 32, h: 16 },
  mine: { _: 2, w: 32, h: 32 }, thieve: { _: 2, w: 32, h: 32 } };
Q.cardScale = (kind, id) => { const t = SIZE[kind]; return t ? (t[id] || t._) : 0; };
const apply = () => { document.querySelectorAll('#view .activity-choices .illustrated-card[data-a]').forEach(card => { const kind = card.dataset.a, t = SIZE[kind]; if (!t || card.dataset.scaled) return;
  const img = card.querySelector('.choice-art img'); if (!img) return; const k = Q.cardScale(kind, card.dataset.b);
  card.dataset.scaled = k; card.classList.add('card-scaled'); for (const [p, v] of [['width', t.w * k + 'px'], ['height', t.h * k + 'px'], ['max-width', 'none'], ['max-height', 'none']]) img.style.setProperty(p, v, 'important'); }); };
const render0 = UI.render; UI.render = (...a) => { const r = render0(...a); try { apply(); } catch (e) { /* cards keep their old size */ } return r; };
})();
