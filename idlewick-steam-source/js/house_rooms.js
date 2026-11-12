/* House rooms and worker beds (Nov 2026).
   1. Every room button on the House page has its own little picture: a 24 x 24 room scene with its signature furniture,
      drawn in code in the house style (parlour fireside, kitchen range, bedroom, workshop anvil, garden beds, bunks).
   2. Worker beds are easy to find: the Workers page shows your beds, and the exact next step to get another one (buy
      the cottage, build the Servants' quarters, add or upgrade Bunk beds), with a button that goes straight there. */
(() => {
const DQ = window.DQ, D = DQ.data, UI = DQ.ui, S = () => DQ.S, { esc, fmt, ico } = DQ, A = DQ.pixelArt;

/* ---------- room pictures ---------- */
const ROOM_ART = A && (() => {
  const { Spr, ramp, R } = A, rp = c => ramp(c);
  const room = (wall, floor) => { const s = Spr(24, 24); s.rect(0, 0, 24, 15, rp(wall)); s.rect(0, 15, 24, 9, rp(floor)); s.rect(0, 14, 24, 1, rp('#5a3a26')); for (let x = 3; x < 24; x += 6) s.line(x, 16, x - 2, 23, null, '#00000022'); s.rect(0, 0, 24, 1, rp('#3a2a20')); return s; };
  return {
    parlour: () => { const s = room('#8a5a4a', '#7a5236'); s.rect(13, 5, 9, 10, R.stone); s.rect(15, 9, 5, 6, rp('#2a2424')); s.poly([[16, 14], [17.5, 10], [19, 14]], ramp('#ff8a3a', { gl: .85 })); s.rect(12, 4, 11, 2, R.wood);
      s.rect(2, 10, 8, 7, rp('#b8483a')); s.rect(2, 8, 8, 3, rp('#c8584a')); s.rect(1, 10, 2, 7, rp('#8a3a2a')); s.rect(9, 10, 2, 7, rp('#8a3a2a')); s.ell(10, 20, 6, 2, rp('#c8a050')); return s; },
    kitchen: () => { const s = room('#e0d0b0', '#8a7a6a'); for (let y = 2; y < 14; y += 3) for (let x = (y % 2) * 2; x < 24; x += 4) s.fix(x, y, '#d0c0a0');
      s.rect(2, 9, 10, 9, R.iron); s.rect(4, 13, 6, 4, rp('#2a2424')); s.fix(6, 15, '#ff8a3a'); s.rect(9, 3, 2, 6, R.iron); s.ell(6, 8, 3, 1.4, rp('#6a6a74'));
      s.rect(14, 3, 9, 2, R.wood); [[15, '#c8483c'], [18, '#e6b84a'], [21, '#7ab04a']].forEach(([x, c]) => s.rect(x, 1, 2, 2, rp(c))); s.rect(14, 12, 9, 7, R.wood); s.ell(18, 11, 3, 1, rp('#f0d070')); return s; },
    bedroom: () => { const s = room('#6a7aa0', '#7a5236'); s.rect(2, 3, 6, 6, rp('#cfe6f2')); s.line(5, 3, 5, 8, null, '#7a5236'); s.line(2, 6, 7, 6, null, '#7a5236');
      s.rect(9, 11, 13, 7, R.wood); s.rect(10, 9, 4, 3, rp('#f4ecd8')); s.rect(14, 10, 8, 3, rp('#3f7fbf')); s.rect(9, 8, 2, 10, R.wood); s.rect(21, 10, 2, 8, R.wood); s.rect(2, 16, 5, 5, R.wood); s.rect(3, 15, 3, 1, R.gold); return s; },
    workshop: () => { const s = room('#7a6a5a', '#6a5a4a'); s.rect(1, 4, 22, 2, R.wood); s.line(4, 6, 4, 12, R.iron); s.line(9, 6, 9, 13, R.wood); s.rect(8, 6, 3, 2, R.iron); s.line(14, 6, 14, 12, R.wood);
      s.poly([[4, 17], [16, 17], [14, 20], [6, 20]], R.iron); s.rect(8, 20, 4, 3, R.iron); s.rect(2, 16, 4, 1, R.steel); s.fix(9, 16, '#ffb04a'); s.rect(18, 13, 5, 9, R.wood); s.rect(18, 13, 5, 1, R.woodLight); return s; },
    garden: () => { const s = Spr(24, 24); s.rect(0, 0, 24, 10, rp('#a8d8ec')); s.ell(19, 4, 2.4, 2.4, ramp('#ffe08a', { gl: .9 })); s.rect(0, 10, 24, 14, rp('#6aa244'));
      for (let x = 0; x < 24; x += 3) s.rect(x, 7, 1, 4, R.wood); s.rect(0, 8, 24, 1, R.wood);
      for (const [x, y] of [[2, 14], [13, 14], [2, 19], [13, 19]]) { s.rect(x, y, 9, 3, R.soil); for (let i = 1; i < 9; i += 3) { s.line(x + i, y - 2, x + i, y, R.leafCrop); s.fix(x + i, y - 3, ['#e48aa8', '#f0d060', '#ffffff'][i % 3]); } } return s; },
    trophy: () => { const s = room('#4a3a5a', '#5a4a3a'); s.rect(0, 2, 24, 1, R.gold);
      for (const [x, c] of [[2, '#8a5a3a'], [10, '#7a8a9a'], [18, '#6a9a5a']]) { s.poly([[x, 4], [x + 4, 4], [x + 4, 9], [x + 2, 11], [x, 9]], R.wood); s.ell(x + 2, 7, 1.4, 1.4, rp(c)); }
      s.poly([[8, 15], [16, 15], [15, 19], [9, 19]], R.gold); s.rect(11, 19, 2, 2, R.gold); s.rect(8, 21, 8, 2, R.wood); s.fix(10, 16, '#fff2a0');
      s.rect(1, 13, 3, 10, rp('#8a3a3a')); s.rect(20, 13, 3, 10, rp('#8a3a3a')); s.fix(2, 15, '#e6b84a'); s.fix(21, 15, '#e6b84a'); return s; },
    quarters: () => { const s = room('#9a8a6a', '#7a5236'); for (const x of [2, 13]) { s.rect(x, 3, 2, 19, R.wood); s.rect(x + 8, 3, 2, 19, R.wood); s.rect(x, 9, 10, 2, R.wood); s.rect(x, 18, 10, 2, R.wood);
      s.rect(x + 2, 7, 6, 2, rp('#c8b890')); s.rect(x + 2, 6, 2, 1, rp('#f4ecd8')); s.rect(x + 2, 16, 6, 2, rp('#8aa0c0')); s.rect(x + 2, 15, 2, 1, rp('#f4ecd8')); } return s; }
  };
})();
DQ.roomArt = (id, size = 48) => { const f = ROOM_ART && ROOM_ART[id]; if (!f) return ''; const u = A.url('room:' + id, f); return A.img(u, 24, 24, size, 'room-art', ''); };
const house0 = UI.V.house;
if (house0) UI.V.house = () => house0().replace(/(<button class="hroom[^"]*" data-do="houseroom" data-a="([a-z]+)"[^>]*>)/g, (all, open, id) => open + `<span class="hroom-art">${DQ.roomArt(id, 48)}</span>`);

/* ---------- worker beds: what you have and the one next step for another ---------- */
DQ.bedPlan = () => {
  const H = S().house || {}, room = D.ROOMS.find(r => r.id === 'quarters'), cot = room && room.furn.find(f => f.id === 'cot'), tier = (H.furn && H.furn.cot) || 0;
  const slots = DQ.workerSlots(), used = S().workers.length;
  if (!H.owned) return { slots, used, title: 'Buy your cottage', text: 'Worker beds go in your house. Buy the cottage first.', action: 'house' };
  if (!(H.rooms && H.rooms.quarters)) return { slots, used, title: `Build the Servants’ quarters · ${fmt(room.price)} coins`, text: 'A room in your house for the people who work for you. Then add bunk beds.', action: 'quarters', ready: S().coins >= room.price };
  if (tier < 3) { const cost = cot.costs[tier], adds = cot.fx.workers[tier] - (tier ? cot.fx.workers[tier - 1] : 0);
    return { slots, used, title: `${tier ? 'Upgrade' : 'Place'} the bunk beds · +${adds} bed${adds > 1 ? 's' : ''}`, text: Object.entries(cost).map(([k, n]) => k === 'coins' ? `${fmt(n)} coins` : `${n} ${D.ITEMS[k].name.toLowerCase()}`).join(' · '), action: 'quarters', ready: DQ.canAfford(cost) }; }
  return { slots, used, title: 'Every bed is built', text: 'Your quarters are full of bunks. Workers you hire now replace others.', action: null };
};
UI.DO.bedsgo = to => { if (to === 'quarters') UI.tab.houseRoom = 'quarters'; DQ.go('house'); };
const hire0 = UI.V.hirelings;
if (hire0) UI.V.hirelings = () => {
  const h = hire0(); if (DQ.advLvl() < D.HIRE.adv) return h;
  const p = DQ.bedPlan(), beds = Array.from({ length: Math.max(p.slots, 1) }, (_, i) => `<i class="bed ${i < p.used ? 'full' : ''}" title="${i < p.used ? 'A worker sleeps here' : 'Empty bed'}"></i>`).join('');
  const panel = `<section class="panel worker-beds"><div class="wb-now"><span class="k">Worker beds</span><h2>${p.used} of ${p.slots} bed${p.slots === 1 ? '' : 's'} filled</h2><div class="wb-beds" aria-hidden="true">${beds}</div><small class="dim">Items go to your bank · wages paid per minute</small></div>
    <div class="wb-next">${DQ.roomArt('quarters', 72)}<div><span class="k">${p.action ? 'More beds' : 'Beds'}</span><b>${esc(p.title)}</b><small>${esc(p.text)}</small></div>${p.action ? `<button class="btn ${p.ready ? 'primary' : ''}" data-do="bedsgo" data-a="${p.action}">${p.action === 'house' ? 'Go to House' : 'Open Servants’ quarters'}</button>` : ''}</div></section>`;
  return h.replace(/<section class="panel shophead"><div><span class="k">Workers<\/span>[\s\S]*?<\/section>/, panel);
};
/* the hire refusal says where beds come from and offers the way there */
const toast0 = DQ.toast;
DQ.toast = (msg, bad) => { if (bad && /No free beds/.test(String(msg))) { const p = DQ.bedPlan(); return toast0(p.action ? `No free beds. Next: ${p.title.split(' · ')[0]} (House → Servants’ quarters).` : 'Every bed is full. Dismiss a worker to hire another.', true); } return toast0(msg, bad); };
})();
