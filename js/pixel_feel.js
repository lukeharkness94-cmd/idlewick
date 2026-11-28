/* Idlewick pixel art: the small pictures for empty pages and the quill pointer (27 Nov 2026, owner: "I love the subtle
   things that make games feel more polished"). House style (docs/pixel-art-style.md): top-left light from the shared
   ramps, selective outlines, whole-number scales only.
   - DQ.emptyArt(kind, box): a 24 x 24 picture for an empty state (UI.emptyState in ui_core.js), shown at the largest
     whole multiple that fits the box (3x on desktop, 2x where space is short).
   - DQ.cursorArt(kind, scale): the quill (default pointer) and the pointing hand (over controls), 16 x 16 drawn here and
     scaled by whole numbers to a PNG data URL for a CSS cursor (js/ui_feel.js sets them). */
(() => {
const DQ = window.DQ, A = DQ.pixelArt; if (!A) return;
const { Spr, ramp, R, SKIN } = A;
const INK = '#2a1c1f', THREAD = '#b9b09c', GLASS = ramp('#a9cfe0', { gl: .8 }), PEWTER = ramp('#9ba2a8', { gl: .72 });

const ART = {
  /* the bank: a beam corner with an abandoned web and one loose thread (the spider has moved out) */
  cobweb() { const s = Spr(24, 24); s.rect(0, 0, 24, 3, R.beam).rect(0, 0, 3, 24, R.beam);
    for (const [x, y] of [[20, 3], [16, 9], [9, 16], [3, 20], [12, 13]]) s.line(3, 3, x, y, null, THREAD);
    for (const r of [5, 9, 13]) for (let i = 0; i <= 12; i++) { const t = i / 12 * Math.PI / 2; s.fix(Math.round(3 + Math.cos(t) * r), Math.round(3 + Math.sin(t) * r), THREAD); }
    s.line(16, 9, 16, 19, null, THREAD); s.fix(16, 20, '#8f8676'); return s; },
  /* an open crate with nothing in it but shadow */
  crate() { const s = Spr(24, 24); s.poly([[3, 9], [21, 9], [19, 5], [5, 5]], R.woodLight); s.poly([[5, 9], [19, 9], [17.5, 6.5], [6.5, 6.5]], R.barkDark);
    s.rect(3, 9, 18, 12, R.wood); s.rect(3, 9, 2, 12, R.beam).rect(19, 9, 2, 12, R.beam);
    for (const y of [13, 17]) s.line(5, y, 18, y, null, R.wood.lo); s.fix(4, 11, '#e6b84a'); s.fix(20, 11, '#e6b84a'); return s; },
  /* a looking glass over nothing in particular */
  lens() { const s = Spr(24, 24); s.line(14, 14, 20, 20, R.wood); s.line(15, 14, 21, 20, R.wood); s.line(14, 15, 20, 21, R.wood);
    s.ell(9, 9, 7, 7, R.iron); s.ell(9, 9, 5, 5, GLASS); s.fix(7, 6, '#ffffff'); s.fix(6, 7, '#ffffff'); return s; },
  /* a quiet inn table: one mug, nobody drinking from it */
  table() { const s = Spr(24, 24); s.rect(2, 12, 20, 3, R.wood); s.rect(4, 15, 2, 7, R.beam).rect(18, 15, 2, 7, R.beam);
    s.rect(13, 6, 5, 6, PEWTER); s.rect(18, 7, 2, 1, PEWTER).rect(19, 8, 1, 2, PEWTER).rect(18, 10, 2, 1, PEWTER); s.line(13, 6, 17, 6, null, PEWTER.gl);
    s.rect(6, 9, 2, 3, R.plaster); s.fix(6, 8, '#f0c060'); s.fix(7, 8, '#e08a30'); return s; },
  /* a blank scroll, rolled at both ends */
  scroll() { const s = Spr(24, 24); s.rect(6, 4, 12, 16, R.plaster); s.rect(4, 2, 16, 3, R.straw).rect(4, 19, 16, 3, R.straw);
    s.fix(4, 3, R.strawDark.lo); s.fix(19, 3, R.strawDark.lo); s.fix(4, 20, R.strawDark.lo); s.fix(19, 20, R.strawDark.lo); return s; },
  /* an empty shelf on brackets, dusted and waiting */
  shelf() { const s = Spr(24, 24); s.rect(1, 12, 22, 2, R.wood); s.poly([[4, 14], [7, 14], [4, 18]], R.beam); s.poly([[17, 14], [20, 14], [20, 18]], R.beam);
    s.rect(15, 10, 3, 2, ramp('#c8bfae')); s.fix(16, 9, '#d8d0c0'); return s; },
  /* an inkpot and a quill, nothing yet written */
  inkpot() { const s = Spr(24, 24); s.ell(9, 17, 6, 4, ramp('#3c4a7a')); s.rect(7, 11, 5, 3, ramp('#3c4a7a')); s.rect(6, 10, 7, 1, R.ink);
    for (let i = 0; i <= 10; i++) { const x = 11 + i, y = 12 - i; s.fix(x, y, '#c8a060'); if (i > 3) { s.dot(x + 1, y, R.feather); s.dot(x, y - 1, R.feather); if (i > 5 && i < 10) s.dot(x + 1, y - 1, R.feather); } }
    s.fix(8, 18, '#6a7ab0'); return s; },
  /* an empty bench, everyone busy elsewhere */
  bench() { const s = Spr(24, 24); s.rect(2, 13, 20, 2, R.wood); s.rect(3, 8, 18, 2, R.woodLight);
    s.rect(4, 10, 2, 3, R.beam).rect(18, 10, 2, 3, R.beam); s.rect(4, 15, 2, 6, R.beam).rect(18, 15, 2, 6, R.beam); return s; },
  /* a clean plate and two crumbs */
  plate() { const s = Spr(24, 24); s.ell(12, 14, 10, 5, R.plaster); s.ell(12, 14, 6, 3, ramp('#e2d6bb'));
    s.fix(9, 14, '#b88a4a'); s.fix(15, 13, '#b88a4a'); return s; },
  /* an hourglass with all its sand at the bottom */
  hourglass() { const s = Spr(24, 24); s.rect(5, 2, 14, 2, R.wood).rect(5, 20, 14, 2, R.wood); s.rect(6, 4, 1, 16, R.beam).rect(17, 4, 1, 16, R.beam);
    s.poly([[8, 4], [16, 4], [12.5, 11.5], [11.5, 11.5]], GLASS); s.poly([[11.5, 12.5], [12.5, 12.5], [16, 20], [8, 20]], GLASS);
    s.poly([[9.5, 20], [14.5, 20], [13, 16], [11, 16]], R.straw); return s; },
  /* a closed chest with iron bands */
  chest() { const s = Spr(24, 24); s.rect(3, 9, 18, 11, R.wood); s.ell(12, 9, 9, 3, R.woodLight); s.rect(3, 9, 18, 1, R.beam);
    s.rect(6, 7, 2, 13, R.iron).rect(16, 7, 2, 13, R.iron); s.rect(11, 10, 2, 3, R.gold); return s; },
  /* a map that is mostly blank, which is the fun part */
  map() { const s = Spr(24, 24); s.poly([[2, 5], [8, 3], [15, 5], [22, 3], [22, 19], [15, 21], [8, 19], [2, 21]], R.path);
    s.line(8, 3, 8, 19, null, R.path.lo); s.line(15, 5, 15, 21, null, R.path.lo);
    for (const [x, y] of [[4, 17], [6, 15], [8, 14], [10, 13]]) s.fix(x, y, '#9a4a3a'); s.fix(11, 11, '#c8483c'); s.fix(12, 11, '#c8483c'); s.fix(11, 12, '#c8483c'); s.fix(12, 12, '#c8483c'); return s; }
};
DQ.EMPTY_ART = Object.keys(ART);
DQ.emptyArt = (kind, box = 72, alt = '') => { if (!ART[kind]) return ''; return A.img(A.url('empty:' + kind, ART[kind]), 24, 24, box, 'empty-art', alt); };

/* ---------- the pointer ---------- */
const CUR = {
  /* a quill, nib at the top left (the hotspot) and the feather trailing down to the right */
  quill() { const s = Spr(16, 16), shaft = '#c8a060';
    s.poly([[5.5, 3], [10, 5], [14.5, 10], [15, 15], [10, 14.5], [5, 10], [3, 5.5]], R.feather);
    s.dot(2, 2, R.iron); s.dot(3, 3, R.iron); s.dot(2, 3, R.iron); s.dot(3, 2, R.iron); s.dot(4, 4, R.iron); s.fix(1, 1, INK);
    for (let i = 5; i <= 14; i++) s.fix(i, i, shaft);
    s.fix(9, 6, R.feather.lo); s.fix(6, 9, R.feather.lo); s.fix(12, 9, R.feather.lo); s.fix(9, 12, R.feather.lo);
    return s; },
  /* a pointing hand with a brown cuff, fingertip at the top (the hotspot) */
  hand() { const s = Spr(16, 16), sk = SKIN[0];
    s.grid(['', '......ss', '......ss', '......ss', '......ss', '......ssss', '......sssssss', '..ss..sssssssss', '..sss.sssssssss', '...ssssssssssss', '...ssssssssssss',
      '....ssssssssss', '.....ssssssss', '.....cccccccc', '.....cccccccc'], { s: sk, c: R.leather });
    for (const x of [8, 10, 12]) s.fix(x, 6, sk.lo); return s; }
};
/* hotspots in sprite pixels: the quill's nib and the hand's fingertip */
DQ.CURSOR_HOT = { quill: [1, 1], hand: [6, 1] };
const curCache = new Map();
DQ.cursorArt = (kind, scale = 2) => {
  const key = kind + ':' + scale; if (curCache.has(key)) return curCache.get(key);
  if (!CUR[kind] || typeof document === 'undefined' || !document.createElement) return null;
  const src = A.toCanvas(CUR[kind]()), c = document.createElement('canvas'); c.width = src.width * scale; c.height = src.height * scale;
  const x = c.getContext('2d'); if (!x) return null; x.imageSmoothingEnabled = false; x.drawImage(src, 0, 0, c.width, c.height);
  const u = c.toDataURL(); curCache.set(key, u); return u;
};
})();
