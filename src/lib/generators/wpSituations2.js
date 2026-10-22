'use strict';

// Part 2 of the situation-based word problems: prices and menus, data tables, schedules, fractions of sets and recipes,
// and decimal measurements. (Part 1 is wpSituations.js: join / separate / compare / equal groups / remainders.)
module.exports = function register(t, H) {
  const { int, pick, shuffle, fmt, F } = H;
  const { reg, finish, money, dollars, cap, plural } = H.sit;

  // ---------- things people buy ----------
  const BUY = [
    ['loaf of bread', 'loaves of bread', 250, 550], ['jar of honey', 'jars of honey', 500, 1100], ['box of cereal', 'boxes of cereal', 300, 650], ['basket of strawberries', 'baskets of strawberries', 300, 700],
    ['soccer ball', 'soccer balls', 800, 2400], ['jump rope', 'jump ropes', 400, 1000], ['bag of dog food', 'bags of dog food', 1200, 3000], ['bike helmet', 'bike helmets', 1500, 4000],
    ['pack of baseball cards', 'packs of baseball cards', 200, 500], ['movie ticket', 'movie tickets', 600, 1200], ['ice cream cone', 'ice cream cones', 200, 500], ['bottle of juice', 'bottles of juice', 100, 350],
    ['T-shirt', 'T-shirts', 800, 2000], ['pair of socks', 'pairs of socks', 300, 800], ['phone case', 'phone cases', 800, 2000], ['jigsaw puzzle', 'jigsaw puzzles', 600, 1500],
    ['paint set', 'paint sets', 700, 1500], ['flashlight', 'flashlights', 500, 1200], ['water bottle', 'water bottles', 600, 1500], ['bag of mulch', 'bags of mulch', 300, 600],
    ['tomato plant', 'tomato plants', 200, 500], ['pumpkin', 'pumpkins', 300, 900], ['scented candle', 'scented candles', 400, 1200], ['bird feeder', 'bird feeders', 900, 2200],
    ['bag of oranges', 'bags of oranges', 400, 800], ['garden glove set', 'garden glove sets', 500, 1100], ['tent stake pack', 'tent stake packs', 500, 1000], ['fishing lure', 'fishing lures', 300, 900],
  ];
  const round5 = (c) => Math.round(c / 5) * 5;
  const SHOPS = {
    'at a sports store': ['soccer ball', 'jump rope', 'bike helmet', 'water bottle', 'fishing lure'], 'at a camping store': ['flashlight', 'tent stake pack', 'water bottle', 'fishing lure'],
    'at a garden center': ['bag of mulch', 'tomato plant', 'pumpkin', 'bird feeder', 'garden glove set'], 'at a farmers market': ['jar of honey', 'basket of strawberries', 'pumpkin', 'bag of oranges', 'loaf of bread', 'bottle of juice'],
    'at a corner store': ['box of cereal', 'bottle of juice', 'loaf of bread', 'ice cream cone', 'pack of baseball cards', 'bag of oranges'], 'at a craft fair': ['scented candle', 'jigsaw puzzle', 'paint set', 'phone case', 'bird feeder', 'jar of honey'],
    'at a street fair': ['ice cream cone', 'T-shirt', 'pair of socks', 'phone case', 'bottle of juice', 'scented candle'], 'at the hardware store': ['flashlight', 'bag of mulch', 'garden glove set', 'tent stake pack'],
    'at a pet store': ['bag of dog food'], 'at a toy store': ['jigsaw puzzle', 'jump rope', 'soccer ball'], 'at the movie theater': ['movie ticket'],
  };
  const shopFor = (r, name) => { const opts = Object.keys(SHOPS).filter((k) => SHOPS[k].includes(name)); return opts.length ? pick(r, opts) : 'at a corner store'; };
  function item(r, g, whole = false) {
    const [s, p, lo, hi] = pick(r, BUY);
    let c = int(r, lo, hi);
    c = whole ? Math.max(100, Math.round(c / 100) * 100) : g === 3 ? Math.round(c / 25) * 25 : round5(c);
    return { s, p, c, shop: shopFor(r, s) };
  }
  const verbBuy = (c) => `${c.A.name} buys`;

  reg('sit-price-total', { ops: ['mul'], kind: 'decimal', grades: [3, 5] }, (r, c, g) => {
    const it = item(r, g); const k = int(r, 2, g === 5 ? 12 : 9); const total = it.c * k;
    const frames = [
      { story: `${verbBuy(c)} ${k} ${it.p} ${it.shop}. Each one costs ${money(it.c)}.`, question: `How much does ${c.A.s} spend in all?` },
      { story: `${cap(it.p)} cost ${money(it.c)} each ${it.shop}.`, question: `What is the total cost of ${k} ${it.p}?` },
    ];
    const f = pick(r, frames);
    return { ...f, answer: money(total), eq: `${k} × ${money(it.c)} = ?`, wrongEqs: [`${k} + ${money(it.c)} = ?`, `${money(it.c)} ÷ ${k} = ?`], wrong: { value: money(it.c + k), mistake: `${k} items at ${money(it.c)} each means ${k} × ${money(it.c)}.` }, estimate: g >= 4 ? { exact: total / 100, good: Math.round(it.c / 100) * k, bad: Math.round(it.c / 100) * k * 10, why: 'it is about ten times too much' } : null, meta: { op: 'price-total', cents: it.c, k, total } };
  });
  reg('sit-price-change', { ops: ['mul', 'sub'], kind: 'decimal', steps: 2, level: 2, grades: [3, 5] }, (r, c, g) => {
    const it = item(r, g); const k = int(r, 2, 6); const total = it.c * k; const bill = Math.ceil((total + 100) / 500) * 500;
    return { story: `${verbBuy(c)} ${k} ${it.p} ${it.shop} for ${money(it.c)} each and pays with ${dollars(bill)}.`, question: 'How much change should he get back?'.replace('he', c.A.s), answer: money(bill - total), eq: `${dollars(bill)} − ${k} × ${money(it.c)} = ?`, wrong: { value: money(total), mistake: `That is the cost. The change is ${dollars(bill)} − ${money(total)}.` }, meta: { op: 'price-change', cents: it.c, k, bill, change: bill - total } };
  });
  reg('sit-price-two', { ops: ['muladd'], kind: 'decimal', steps: 3, level: 2, grades: [4, 5] }, (r, c, g) => {
    let a = item(r, g); for (let i = 0; i < 60 && SHOPS[a.shop].length < 2; i++) a = item(r, g);
    const bName = pick(r, SHOPS[a.shop].filter((n) => n !== a.s)); const row = BUY.find((x) => x[0] === bName); const b = { s: row[0], p: row[1], c: round5(int(r, row[2], row[3])), shop: a.shop }; const k1 = int(r, 2, 5); const k2 = int(r, 2, 5);
    return { story: `${verbBuy(c)} ${k1} ${a.p} for ${money(a.c)} each and ${k2} ${b.p} for ${money(b.c)} each ${a.shop}.`, question: 'What is the total cost?', answer: money(k1 * a.c + k2 * b.c), eq: `${k1} × ${money(a.c)} + ${k2} × ${money(b.c)} = ?`, estimate: { exact: (k1 * a.c + k2 * b.c) / 100, good: Math.round(a.c / 100) * k1 + Math.round(b.c / 100) * k2, bad: (Math.round(a.c / 100) * k1 + Math.round(b.c / 100) * k2) * 2, why: 'it is about double the real cost' }, meta: { op: 'price-two', c1: a.c, k1, c2: b.c, k2 } };
  });
  reg('sit-unit-price', { ops: ['div'], kind: 'decimal', level: 2, grades: [4, 5] }, (r, c, g) => {
    const it = item(r, g); const k = int(r, 2, 8); const total = it.c * k;
    return { story: `A store sells ${k} ${it.p} for ${money(total)}. Every one costs the same.`, question: `How much does one ${it.s} cost?`, answer: money(it.c), eq: `${money(total)} ÷ ${k} = ?`, wrongEqs: [`${money(total)} × ${k} = ?`], wrong: { value: money(total - k), mistake: `Finding the price of one means dividing ${money(total)} by ${k}.` }, meta: { op: 'unit-price', total, k, cents: it.c } };
  });
  reg('sit-price-compare', { ops: ['sub'], kind: 'decimal', grades: [3, 5] }, (r, c, g) => {
    const it = item(r, g); const save = round5(int(r, 40, Math.max(60, Math.floor(it.c * 0.4)))); const other = it.c + save; const k = g >= 4 ? int(r, 1, 4) : 1;
    const two = k > 1;
    return { story: `${c.A.name} sees a ${it.s} for ${money(other)} at one store and for ${money(it.c)} at another store.`, question: two ? `How much would ${c.A.s} save by buying ${k} ${it.p} at the cheaper store?` : `How much would ${c.A.s} save by buying it at the cheaper store?`, answer: money(save * k), eq: `${two ? `${k} × ` : ''}(${money(other)} − ${money(it.c)}) = ?`, meta: { op: 'price-compare', cheap: it.c, dear: other, k } };
  });
  reg('sit-budget', { ops: ['sub'], kind: 'decimal', grades: [3, 5] }, (r, c, g) => {
    const it = item(r, g); const budget = Math.ceil((it.c + 200) / 500) * 500;
    return { story: `${c.A.name} has ${dollars(budget)} to spend ${it.shop}. ${c.A.S} buys one ${it.s} for ${money(it.c)}.`, question: 'How much money is left?', answer: money(budget - it.c), eq: `${dollars(budget)} − ${money(it.c)} = ?`, wrongEqs: [`${dollars(budget)} + ${money(it.c)} = ?`], meta: { op: 'budget', budget, cents: it.c } };
  });
  // whole-dollar prices for grades 2 and 3
  reg('sit-price-whole', { ops: ['mul', 'add', 'sub'], grades: [2, 3] }, (r, c, g) => {
    const it = item(r, g, true); const d = it.c / 100; const kind = int(r, 0, 2);
    if (kind === 0) { const k = int(r, 2, 5); return { story: `${verbBuy(c)} ${k} ${it.p} ${it.shop}. Each one costs $${d}.`, question: `How much does ${c.A.s} spend in all?`, answer: `$${d * k}`, eq: `${k} × $${d} = ?`, meta: { op: 'price-whole-mul', d, k } }; }
    if (kind === 1) { const it2 = item(r, g, true); return { story: `${verbBuy(c)} a ${it.s} for $${d} and a ${it2.s} for $${it2.c / 100}.`, question: `How much does ${c.A.s} spend in all?`, answer: `$${d + it2.c / 100}`, eq: `$${d} + $${it2.c / 100} = ?`, meta: { op: 'price-whole-add', a: d, b: it2.c / 100 } }; }
    const bill = Math.ceil((d + 1) / 5) * 5; return { story: `${verbBuy(c)} a ${it.s} for $${d} and pays with a $${bill} bill.`, question: 'How much change does he get?'.replace('he', c.A.s), answer: `$${bill - d}`, eq: `$${bill} − $${d} = ?`, meta: { op: 'price-whole-change', d, bill } };
  });

  // ---------- menus and price lists (the data is a table) ----------
  const MENUS = [
    { title: 'Corner Bakery', items: [['Blueberry muffin', 225], ['Bagel', 175], ['Cinnamon roll', 350], ['Orange juice', 200], ['Oatmeal cookie', 125]] },
    { title: 'Ballpark Snack Bar', items: [['Hot dog', 450], ['Popcorn', 375], ['Lemonade', 300], ['Nachos', 500], ['Soft pretzel', 400]] },
    { title: 'Sunny Farm Stand', items: [['Sweet corn (ear)', 75], ['Pint of berries', 450], ['Pumpkin', 600], ['Apple cider', 500], ['Jar of honey', 800]] },
    { title: 'Pet Palace', items: [['Chew toy', 650], ['Cat treats', 475], ['Fish food', 325], ['Leash', 1200], ['Dog bone', 400]] },
    { title: 'Frosty Cream Shop', items: [['Ice cream cone', 350], ['Sundae', 575], ['Milkshake', 625], ['Fruit ice', 250], ['Cookie sandwich', 450]] },
    { title: 'Trail Outfitters', items: [['Water bottle', 950], ['Trail map', 400], ['Bug spray', 725], ['Flashlight', 1150], ['Sunscreen', 850]] },
  ];
  const WHOLE_MENUS = [
    { title: 'Pizza Corner', items: [['Pizza slice', 3], ['Garden salad', 5], ['Lemonade', 2], ['Garlic knots', 4], ['Brownie', 3]] },
    { title: 'Toy Shop', items: [['Yo-yo', 4], ['Jump rope', 6], ['Kite', 9], ['Puzzle', 8], ['Marbles', 3]] },
    { title: 'Garden Center', items: [['Flower pot', 6], ['Seed packet', 2], ['Watering can', 9], ['Bag of soil', 7], ['Garden gloves', 5]] },
    { title: 'Bike Shop', items: [['Bell', 5], ['Water bottle', 6], ['Reflector', 3], ['Basket', 12], ['Patch kit', 4]] },
  ];
  const menuPick = (r, list, n = 4) => { const m = pick(r, list); return { m, items: shuffle(r, m.items).slice(0, n) }; };
  reg('sit-menu', { ops: ['add', 'sub', 'mul'], kind: 'decimal', steps: 2, grades: [3, 5] }, (r, c, g) => {
    const { m, items } = menuPick(r, MENUS); const table = { title: m.title, head: ['Item', 'Price'], rows: items.map(([n, p]) => [n, money(p)]) };
    const kind = int(r, 0, 3); const [a, b] = items;
    if (kind === 0) return { story: `${c.A.name} looks at the price list at ${m.title}.`, table, question: `How much do a ${a[0].toLowerCase()} and a ${b[0].toLowerCase()} cost together?`, answer: money(a[1] + b[1]), eq: `${money(a[1])} + ${money(b[1])} = ?`, meta: { op: 'menu-add', a: a[1], b: b[1] } };
    if (kind === 1) { const k = int(r, 2, 4); return { story: `${c.A.name} is buying snacks for friends at ${m.title}.`, table, question: `How much will ${k} ${a[0].toLowerCase()}s cost?`, answer: money(a[1] * k), eq: `${k} × ${money(a[1])} = ?`, meta: { op: 'menu-mul', a: a[1], k } }; }
    if (kind === 2) { const hi = Math.max(a[1], b[1]); const lo = Math.min(a[1], b[1]); return { story: `Look at the price list at ${m.title}.`, table, question: `How much more does the ${(a[1] >= b[1] ? a : b)[0].toLowerCase()} cost than the ${(a[1] >= b[1] ? b : a)[0].toLowerCase()}?`, answer: money(hi - lo), eq: `${money(hi)} − ${money(lo)} = ?`, meta: { op: 'menu-diff', hi, lo } }; }
    const bill = Math.ceil((a[1] + b[1] + 100) / 500) * 500;
    return { story: `${c.A.name} buys one ${a[0].toLowerCase()} and one ${b[0].toLowerCase()} at ${m.title} and pays with ${dollars(bill)}.`, table, question: `How much change does ${c.A.s} get back?`, answer: money(bill - a[1] - b[1]), eq: `${dollars(bill)} − (${money(a[1])} + ${money(b[1])}) = ?`, meta: { op: 'menu-change', a: a[1], b: b[1], bill } };
  });
  reg('sit-menu-whole', { ops: ['add', 'sub', 'mul'], grades: [2, 3] }, (r, c) => {
    const { m, items } = menuPick(r, WHOLE_MENUS, 4); const table = { title: m.title, head: ['Item', 'Price'], rows: items.map(([n, p]) => [n, `$${p}`]) };
    const kind = int(r, 0, 2); const [a, b] = items;
    if (kind === 0) return { story: `${c.A.name} shops at the ${m.title}.`, table, question: `How much do a ${a[0].toLowerCase()} and a ${b[0].toLowerCase()} cost together?`, answer: `$${a[1] + b[1]}`, eq: `$${a[1]} + $${b[1]} = ?`, meta: { op: 'menu-whole-add', a: a[1], b: b[1] } };
    if (kind === 1) { const k = int(r, 2, 5); return { story: `${c.A.name} shops at the ${m.title}.`, table, question: `How much will ${k} ${a[0].toLowerCase()}s cost?`, answer: `$${a[1] * k}`, eq: `${k} × $${a[1]} = ?`, meta: { op: 'menu-whole-mul', a: a[1], k } }; }
    const bill = 20; const cost = a[1] + b[1];
    return { story: `${c.A.name} buys one ${a[0].toLowerCase()} and one ${b[0].toLowerCase()} at the ${m.title} and pays with $20.`, table, question: 'How much change does ' + c.A.s + ' get?', answer: `$${bill - cost}`, eq: `$20 − ($${a[1]} + $${b[1]}) = ?`, meta: { op: 'menu-whole-change', cost, bill } };
  });

  // ---------- data tables ----------
  const DATA = [
    { title: 'Laps Swum This Week', col: 'Laps', rows: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'], unit: 'laps', max: 60, ask: 'laps' },
    { title: 'Visitors to Maple Park', col: 'Visitors', rows: ['Saturday', 'Sunday', 'Monday', 'Tuesday'], unit: 'visitors', max: 5000, ask: 'visitors' },
    { title: 'Rainfall by Month', col: 'Inches', rows: ['April', 'May', 'June', 'July'], unit: 'inches of rain', max: 14, ask: 'inches of rain' },
    { title: 'Steps Walked Each Day', col: 'Steps', rows: ['Monday', 'Tuesday', 'Wednesday', 'Thursday'], unit: 'steps', max: 18000, ask: 'steps' },
    { title: 'Customers at the Bakery', col: 'Customers', rows: ['Friday', 'Saturday', 'Sunday', 'Monday'], unit: 'customers', max: 400, ask: 'customers' },
    { title: 'Miles Driven on the Road Trip', col: 'Miles', rows: ['Day 1', 'Day 2', 'Day 3', 'Day 4'], unit: 'miles', max: 600, ask: 'miles' },
    { title: 'Points Scored This Season', col: 'Points', rows: ['Game 1', 'Game 2', 'Game 3', 'Game 4', 'Game 5'], unit: 'points', max: 70, ask: 'points' },
    { title: 'Cars Washed at the Fundraiser', col: 'Cars', rows: ['9 AM', '10 AM', '11 AM', '12 PM'], unit: 'cars', max: 45, ask: 'cars' },
    { title: 'Photos Taken on the Trip', col: 'Photos', rows: ['Day 1', 'Day 2', 'Day 3', 'Day 4'], unit: 'photos', max: 800, ask: 'photos' },
    { title: 'Jars of Honey Sold', col: 'Jars', rows: ['Week 1', 'Week 2', 'Week 3', 'Week 4'], unit: 'jars', max: 500, ask: 'jars' },
  ];
  const GMAX = { 2: 40, 3: 300, 4: 2000, 5: 20000 };
  reg('sit-data-table', { ops: ['add', 'sub'], steps: 2, grades: [2, 5] }, (r, c, g) => {
    const ds = pick(r, DATA); const hi = Math.min(ds.max, GMAX[g]); const lo = Math.max(2, Math.floor(hi / 6));
    const n = g === 2 ? 4 : ds.rows.length; const names = ds.rows.slice(0, n); const vals = []; while (vals.length < n) { const v = int(r, lo, hi); if (!vals.includes(v)) vals.push(v); }
    const table = { title: ds.title, head: ['', ds.col], rows: names.map((nm, i) => [nm, fmt(vals[i])]) };
    const kind = g === 2 ? int(r, 0, 1) : int(r, 0, 3); const i = int(r, 0, n - 1); let j = int(r, 0, n - 1); if (j === i) j = (i + 1) % n;
    if (kind === 0) return { story: `The table shows ${ds.title.toLowerCase()}.`, table, question: `How many ${ds.ask} are there in all for ${names[i]} and ${names[j]} together?`, answer: fmt(vals[i] + vals[j]), eq: `${fmt(vals[i])} + ${fmt(vals[j])} = ?`, meta: { op: 'data-add', a: vals[i], b: vals[j] } };
    if (kind === 1) { const [big, small] = vals[i] >= vals[j] ? [i, j] : [j, i]; return { story: `The table shows ${ds.title.toLowerCase()}.`, table, question: `How many more ${ds.ask} were counted for ${names[big]} than for ${names[small]}?`, answer: fmt(vals[big] - vals[small]), eq: `${fmt(vals[big])} − ${fmt(vals[small])} = ?`, meta: { op: 'data-diff', big: vals[big], small: vals[small] } }; }
    if (kind === 2) return { story: `The table shows ${ds.title.toLowerCase()}.`, table, question: `What is the total number of ${ds.ask} for all ${n} rows?`, answer: fmt(vals.reduce((a, b) => a + b, 0)), eq: `${vals.map(fmt).join(' + ')} = ?`, meta: { op: 'data-total', vals } };
    const mx = Math.max(...vals); const mn = Math.min(...vals);
    return { story: `The table shows ${ds.title.toLowerCase()}.`, table, question: `What is the difference between the greatest and the least number of ${ds.ask}?`, answer: fmt(mx - mn), eq: `${fmt(mx)} − ${fmt(mn)} = ?`, meta: { op: 'data-range', mx, mn } };
  });

  // ---------- schedules (time) ----------
  const ROUTES = [
    { what: 'train', stops: ['Oakville', 'Pine Ridge', 'Lake City', 'Riverton', 'Maple Heights'] },
    { what: 'bus', stops: ['Main Street', 'City Park', 'Harbor Mall', 'Hilltop', 'Airport'] },
    { what: 'ferry', stops: ['Pier 4', 'Gull Island', 'Sandy Point', 'Cedar Cove'] },
    { what: 'shuttle', stops: ['Hotel', 'Aquarium', 'Science Center', 'Zoo', 'Beach'] },
  ];
  const clock = (m) => `${Math.floor(m / 60) % 12 || 12}:${String(m % 60).padStart(2, '0')} ${m < 720 ? 'AM' : 'PM'}`;
  const span = (m) => { const h = Math.floor(m / 60); const mm = m % 60; return `${h ? `${h} hour${h > 1 ? 's' : ''}` : ''}${h && mm ? ' ' : ''}${mm ? `${mm} minutes` : ''}`; };
  reg('sit-schedule', { ops: ['sub', 'add'], steps: 2, grades: [3, 5] }, (r, c, g) => {
    const rt = pick(r, ROUTES); const stops = shuffle(r, rt.stops).slice(0, 4);
    const steps = g === 3 ? [20, 30, 40, 45, 60] : [25, 35, 45, 50, 70, 85];
    const sched = [int(r, 6, 10) * 60 + pick(r, [0, 15, 30, 45])]; for (let i = 1; i < stops.length; i++) sched.push(sched[i - 1] + pick(r, steps));
    const table = { title: `${cap(rt.what)} Schedule`, head: ['Stop', 'Time'], rows: stops.map((s, i) => [s, clock(sched[i])]) };
    const i = int(r, 0, 1); const j = int(r, 2, 3);
    if (g === 3 || r() < 0.5) return { story: `${c.A.name} rides the ${rt.what}. The schedule is shown below.`, table, question: `How long is the ride from ${stops[i]} to ${stops[j]}?`, answer: span(sched[j] - sched[i]), eq: `${clock(sched[j])} − ${clock(sched[i])} = ?`, meta: { op: 'schedule-elapsed', from: sched[i], to: sched[j] } };
    const late = pick(r, [10, 15, 20, 25]);
    return { story: `${c.A.name} rides the ${rt.what}. The schedule is shown below. One day the ${rt.what} is ${late} minutes late leaving ${stops[i]} and stays that much behind the whole way.`, table, question: `What time will it arrive at ${stops[j]} that day?`, answer: clock(sched[j] + late), eq: `${clock(sched[j])} + ${late} minutes = ?`, meta: { op: 'schedule-late', to: sched[j], late } };
  });

  // ---------- fractions ----------
  const RECIPES = [
    { dish: 'pancakes', what: 'milk', unit: ['cup', 'cups'], occ: 'a Saturday breakfast' }, { dish: 'banana bread', what: 'flour', unit: ['cup', 'cups'], occ: 'a bake sale' },
    { dish: 'granola bars', what: 'oats', unit: ['cup', 'cups'], occ: 'a hiking trip' }, { dish: 'trail mix', what: 'raisins', unit: ['cup', 'cups'], occ: 'a camping weekend' },
    { dish: 'lemonade', what: 'lemon juice', unit: ['cup', 'cups'], occ: 'a block party' }, { dish: 'pizza dough', what: 'water', unit: ['cup', 'cups'], occ: 'a family pizza night' },
    { dish: 'vegetable soup', what: 'broth', unit: ['quart', 'quarts'], occ: 'a neighborhood potluck' }, { dish: 'fruit punch', what: 'orange juice', unit: ['pint', 'pints'], occ: 'a birthday party' },
  ];
  const FRAC_LEN = [
    { what: 'ribbon', unit: ['yard', 'yards'], uses: ['a gift bow', 'a wreath'] }, { what: 'rope', unit: ['foot', 'feet'], uses: ['a tire swing', 'a tent line'] },
    { what: 'fabric', unit: ['yard', 'yards'], uses: ['a pillow', 'a costume cape'] }, { what: 'wood trim', unit: ['foot', 'feet'], uses: ['a picture frame', 'a window box'] },
    { what: 'yarn', unit: ['yard', 'yards'], uses: ['a scarf', 'a hat'] }, { what: 'copper pipe', unit: ['foot', 'feet'], uses: ['a sink', 'a garden spigot'] },
  ];
  reg('sit-frac-recipe', { ops: ['mul'], kind: 'fraction', grades: [4, 5] }, (r, c) => {
    const rc = pick(r, RECIPES); const d = pick(r, [2, 3, 4, 8]); const a = int(r, 1, d - 1); const k = int(r, 2, 8);
    return { story: `A recipe for ${rc.dish} uses ${a}/${d} ${rc.unit[0]} of ${rc.what} for one batch. ${c.A.name} makes ${k} batches for ${rc.occ}.`, question: `How many ${rc.unit[1]} of ${rc.what} does ${c.A.s} need?`, answer: F.unit(F.mul(F.frac(a, d), F.frac(k, 1)), rc.unit[0], rc.unit[1]), eq: `${k} × ${a}/${d} = ?`, wrong: { value: `${a + k}/${d}`, mistake: `${k} batches means multiplying ${a}/${d} by ${k}, not adding.` }, meta: { op: 'frac-recipe', a, d, k } };
  });
  reg('sit-frac-of-set', { ops: ['mul', 'div'], kind: 'fraction', grades: [3, 5] }, (r, c, g) => {
    const { x, lo, hi } = H.sit.pickCtx(r, g, 400, (y) => H.sit.hasSplit(y)); void lo; void hi; const d = g === 3 ? pick(r, [2, 3, 4, 5]) : pick(r, [3, 4, 5, 6, 8]); const a = g === 3 ? 1 : int(r, 1, d - 1); const q = int(r, g === 3 ? 2 : 3, g === 3 ? 8 : 12); const total = d * q;
    const label = `${a}/${d}`;
    return { story: `${c.A.name} counts ${fmt(total)} ${x.item[1]}. ${label} of them are ${x.split[0]}.`, question: `How many ${x.split[0]} ${x.item[1]} are there?`, answer: fmt(a * q), eq: `${label} × ${fmt(total)} = ?`, wrong: { value: fmt(total - a * q), mistake: `That is the number that are not ${x.split[0]}. The question asks about the ${label}.` }, meta: { op: 'frac-of-set', a, d, total } };
  });
  reg('sit-frac-add', { ops: ['add', 'sub'], kind: 'fraction', steps: 2, grades: [3, 5] }, (r, c, g) => {
    const f = pick(r, FRAC_LEN); const d = g === 5 ? pick(r, [4, 6, 8, 10, 12]) : pick(r, [4, 5, 6, 8]); const a = int(r, 1, d - 2); const b = int(r, 1, d - 1 - a);
    if (r() < 0.5) return { story: `${c.A.name} uses ${a}/${d} ${f.unit[0]} of ${f.what} for ${f.uses[0]} and ${b}/${d} ${f.unit[0]} for ${f.uses[1]}.`, question: `How much ${f.what} does ${c.A.s} use in all?`, answer: F.unit(F.frac(a + b, d), f.unit[0], f.unit[1]), eq: `${a}/${d} + ${b}/${d} = ?`, meta: { op: 'frac-add', a, b, d } };
    const tot = a + b + int(r, 1, 2); return { story: `${c.A.name} has ${tot}/${d} ${f.unit[0]} of ${f.what}. ${c.A.S} uses ${a}/${d} ${f.unit[0]} for ${f.uses[0]} and ${b}/${d} ${f.unit[0]} for ${f.uses[1]}.`, question: `How much ${f.what} is left?`, answer: F.unit(F.frac(tot - a - b, d), f.unit[0], f.unit[1]), eq: `${tot}/${d} − ${a}/${d} − ${b}/${d} = ?`, meta: { op: 'frac-sub3', tot, a, b, d } };
  });
  reg('sit-frac-mixed', { ops: ['add', 'sub'], kind: 'fraction', level: 2, grades: [4, 5] }, (r, c, g) => {
    const f = pick(r, FRAC_LEN); const d = pick(r, [3, 4, 5, 6, 8]); const w1 = int(r, 3, 7); const w2 = int(r, 1, w1 - 1); const a = int(r, 1, d - 1); const b = int(r, 1, d - 1);
    const m1 = F.frac(w1 * d + a, d); const m2 = F.frac(w2 * d + b, d); const lab = (w, n) => `${w} ${n}/${d}`;
    if (r() < 0.5) return { story: `${c.A.name} has ${lab(w1, a)} ${f.unit[1]} of ${f.what}. ${c.A.S} cuts off ${lab(w2, b)} ${f.unit[1]} for ${f.uses[0]}.`, question: `How much ${f.what} is left?`, answer: F.unit(F.sub(m1, m2), f.unit[0], f.unit[1]), eq: `${lab(w1, a)} − ${lab(w2, b)} = ?`, meta: { op: 'frac-mixed-sub', w1, a, w2, b, d } };
    return { story: `${c.A.name} uses ${lab(w1, a)} ${f.unit[1]} of ${f.what} for ${f.uses[0]} and ${lab(w2, b)} ${f.unit[1]} for ${f.uses[1]}.`, question: `How much ${f.what} does ${c.A.s} use altogether?`, answer: F.unit(F.add(m1, m2), f.unit[0], f.unit[1]), eq: `${lab(w1, a)} + ${lab(w2, b)} = ?`, meta: { op: 'frac-mixed-add', w1, a, w2, b, d } };
  });
  reg('sit-frac-compare', { ops: ['sub'], kind: 'fraction', grades: [3, 4] }, (r, c) => {
    const d = pick(r, [4, 5, 6, 8, 10]); const a = int(r, 1, d - 2); const b = int(r, a + 1, d - 1); const A = c.A.name; const B = c.B.name; const act = pick(r, [['walked', 'mile', 'miles'], ['biked', 'mile', 'miles'], ['ran', 'mile', 'miles']]);
    return { story: `${A} ${act[0]} ${a}/${d} of a ${act[1]} and ${B} ${act[0]} ${b}/${d} of a ${act[1]}.`, question: `Who went farther, and how much farther?`, answer: `${B}, by ${F.show(F.frac(b - a, d))} of a ${act[1]}`, eq: `${b}/${d} − ${a}/${d} = ?`, meta: { op: 'frac-compare', a, b, d } };
  });
  reg('sit-frac-share', { ops: ['div'], kind: 'fraction', level: 2, grades: [5, 5] }, (r, c) => {
    const rc = pick(r, RECIPES.filter((x) => x.unit[0] === 'cup')); const n = int(r, 3, 8); const k = int(r, 1, n - 1);
    return { story: `${c.A.name} has ${k} ${plural(k, 'cup', 'cups')} of ${rc.what} to share equally among ${n} jars.`, question: `How much ${rc.what} goes in each jar?`, answer: F.unit(F.frac(k, n), 'cup', 'cups'), eq: `${k} ÷ ${n} = ?`, meta: { op: 'frac-share', k, n } };
  });
  reg('sit-frac-scoops', { ops: ['div', 'mul'], kind: 'fraction', level: 2, grades: [5, 5] }, (r, c) => {
    const rc = pick(r, RECIPES.filter((x) => x.unit[0] === 'cup')); const d = pick(r, [2, 3, 4, 8]); const w = int(r, 2, 6);
    return { story: `${c.A.name} measures ${rc.what} with a scoop that holds 1/${d} cup.`, question: `How many scoops does it take to measure ${w} cups of ${rc.what}?`, answer: fmt(w * d), eq: `${w} ÷ 1/${d} = ?`, meta: { op: 'frac-scoops', w, d } };
  });

  // ---------- decimals in measurements ----------
  const dec = (h, places) => (places === 1 ? (h / 10).toFixed(1) : (h / 100).toFixed(2));
  const MEAS = [
    { frames: [(A, x, y) => `${A.name} jogs ${x} miles on Saturday and ${y} miles on Sunday.`], unit: 'miles', q: 'How many miles did $he jog in all?', diff: (A, hi, lo) => `${A.name} jogged ${hi} miles on Saturday but only ${lo} miles on Sunday. How many more miles did ${A.s} jog on Saturday?`, mul: (A, x, k) => `${A.name} walks ${x} miles every day for ${k} days. How many miles does ${A.s} walk in all?` },
    { frames: [(A, x, y) => `A weather station records ${x} inches of rain in June and ${y} inches in July.`], unit: 'inches', q: 'How many inches of rain fell in all?', diff: (A, hi, lo) => `A weather station records ${hi} inches of rain in June and ${lo} inches in July. How many more inches fell in June?`, mul: (A, x, k) => `A rain gauge collects ${x} inches of water each week. How many inches will it collect in ${k} weeks?` },
    { frames: [(A, x, y) => `${A.name} has two pieces of ribbon, one ${x} meters long and one ${y} meters long.`], unit: 'meters', q: 'How many meters of ribbon does $he have in all?', diff: (A, hi, lo) => `${A.name} has two pieces of ribbon, one ${hi} meters long and one ${lo} meters long. How much longer is the long piece?`, mul: (A, x, k) => `Each fence board is ${x} meters wide. How wide is a fence made of ${k} boards?` },
    { frames: [(A, x, y) => `${A.name} fills the gas tank with ${x} gallons on Monday and ${y} gallons on Friday.`], unit: 'gallons', q: 'How many gallons did $he buy in all?', diff: (A, hi, lo) => `${A.name} fills the tank with ${hi} gallons on Monday and ${lo} gallons on Friday. How many more gallons did ${A.s} buy on Monday?`, mul: (A, x, k) => `A car uses ${x} gallons of gas on each trip. How many gallons does it use in ${k} trips?` },
    { frames: [(A, x, y) => `${A.name} buys ${x} pounds of apples and ${y} pounds of pears at the market.`], unit: 'pounds', q: 'How many pounds of fruit did $he buy?', diff: (A, hi, lo) => `${A.name} buys ${hi} pounds of apples and ${lo} pounds of pears. How many more pounds of apples than pears?`, mul: (A, x, k) => `A bag of potatoes weighs ${x} pounds. How much do ${k} bags weigh?` },
  ];
  reg('sit-decimal-measure', { ops: ['add', 'sub', 'mul', 'div'], kind: 'decimal', grades: [4, 5] }, (r, c, g) => {
    const places = g === 4 ? 1 : pick(r, [1, 2]); const scale = places === 1 ? 10 : 100; const m = pick(r, MEAS); const A = c.A;
    const x = int(r, 12, places === 1 ? 95 : 899); let y = int(r, 12, places === 1 ? 95 : 899); if (y === x) y += 1; const kind = int(r, 0, 3); const k = int(r, 2, 9);
    const D = (h) => dec(h, places);
    if (kind === 0) return { story: m.frames[0](A, D(x), D(y)), question: m.q.replace('$he', A.s), answer: `${D(x + y)} ${m.unit}`, eq: `${D(x)} + ${D(y)} = ?`, meta: { op: 'dec-add', x, y, places } };
    if (kind === 1) { const hi = Math.max(x, y); const lo = Math.min(x, y); return { text: m.diff(A, D(hi), D(lo)), answer: `${D(hi - lo)} ${m.unit}`, eq: `${D(hi)} − ${D(lo)} = ?`, meta: { op: 'dec-sub', hi, lo, places } }; }
    if (kind === 2) return { text: m.mul(A, D(x), k), answer: `${D(x * k)} ${m.unit}`, eq: `${k} × ${D(x)} = ?`, meta: { op: 'dec-mul', x, k, places } };
    const q = int(r, 12, places === 1 ? 60 : 300); const tot = q * k;
    return { text: `${A.name} cuts a board that is ${D(tot)} meters long into ${k} equal pieces. How long is each piece?`, answer: `${D(q)} meters`, eq: `${D(tot)} ÷ ${k} = ?`, meta: { op: 'dec-div', total: tot, k, q, places } };
  });
  void finish;
};
