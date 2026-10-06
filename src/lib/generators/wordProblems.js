'use strict';

const { int, pick, shuffle } = require('./rng');
const F = require('./fractions');
const { fmt } = require('./math');

// Character names are always the six main characters first; names outside this set are only used when a
// template needs more than six people (none do today), and are randomized.
const NAMES = ['Zach', 'AC', 'Screech', 'Kelly', 'Lisa', 'Jessie'];
const EXTRA_NAMES = ['Mia', 'Leo', 'Ava', 'Sam', 'Zoe', 'Max', 'Ella', 'Ben', 'Lily', 'Noah', 'Ruby', 'Eli'];
// Settings paired with things that are natural to count there: [plural, singular].
const THEMES = [
  { setting: 'At the school carnival', items: [['tickets', 'ticket'], ['balloons', 'balloon'], ['prizes', 'prize'], ['stickers', 'sticker']] },
  { setting: 'During the book fair', items: [['bookmarks', 'bookmark'], ['books', 'book'], ['posters', 'poster'], ['pencils', 'pencil']] },
  { setting: 'At the bake sale', items: [['cookies', 'cookie'], ['cupcakes', 'cupcake'], ['brownies', 'brownie'], ['muffins', 'muffin']] },
  { setting: 'On the field trip', items: [['photos', 'photo'], ['postcards', 'postcard'], ['seashells', 'seashell'], ['rocks', 'rock']] },
  { setting: 'At the farmers market', items: [['apples', 'apple'], ['pumpkins', 'pumpkin'], ['peaches', 'peach'], ['jars of honey', 'jar of honey']] },
  { setting: 'At soccer practice', items: [['soccer balls', 'soccer ball'], ['cones', 'cone'], ['water bottles', 'water bottle'], ['jerseys', 'jersey']] },
  { setting: 'At the science fair', items: [['magnets', 'magnet'], ['rocks', 'rock'], ['plants', 'plant'], ['posters', 'poster']] },
  { setting: 'In the school garden', items: [['seeds', 'seed'], ['flowers', 'flower'], ['tomatoes', 'tomato'], ['carrots', 'carrot']] },
  { setting: 'At the library', items: [['library books', 'library book'], ['bookmarks', 'bookmark'], ['chairs', 'chair'], ['puzzles', 'puzzle']] },
  { setting: 'During art class', items: [['crayons', 'crayon'], ['markers', 'marker'], ['beads', 'bead'], ['paper cranes', 'paper crane']] },
  { setting: 'At the pet shelter', items: [['dog treats', 'dog treat'], ['toys', 'toy'], ['blankets', 'blanket'], ['cans of food', 'can of food']] },
  { setting: 'On the camping trip', items: [['marshmallows', 'marshmallow'], ['sticks', 'stick'], ['flashlights', 'flashlight'], ['granola bars', 'granola bar']] },
  { setting: 'At the card swap', items: [['trading cards', 'trading card'], ['stamps', 'stamp'], ['coins', 'coin'], ['marbles', 'marble']] },
];
const GROUPS = ['bags', 'boxes', 'baskets', 'jars', 'packs'];
const SHOP = [['notebook', 'notebooks'], ['lunch', 'lunches'], ['toy', 'toys'], ['kite', 'kites'], ['puzzle', 'puzzles'], ['book', 'books'], ['hat', 'hats'], ['ball', 'balls']];
const FOODS = ['pizza', 'pie', 'sandwich', 'cake', 'pan of brownies'];
const THINGS_LONG = ['ribbon', 'rope', 'board', 'string', 'hose'];

// Grade profiles control number sizes (kept inside SC grade-level expectations; verify with the SC standards).
const PROFILE = {
  1: { addPair: (r) => { const a = int(r, 2, 10); return [a, int(r, 2, 20 - a)]; }, subPair: (r) => { const a = int(r, 8, 20); return [a, int(r, 2, a - 1)]; } },
  2: { addPair: (r) => { const a = int(r, 12, 60); return [a, int(r, 10, 99 - a)]; }, subPair: (r) => { const a = int(r, 30, 99); return [a, int(r, 11, a - 5)]; }, mulPair: (r) => [int(r, 2, 5), int(r, 2, 5)], divPair: (r) => [int(r, 2, 5), int(r, 2, 5)] },
  3: { addPair: (r) => { const a = int(r, 100, 600); return [a, int(r, 100, 999 - a)]; }, subPair: (r) => { const a = int(r, 300, 999); return [a, int(r, 100, a - 50)]; }, mulPair: (r) => [int(r, 2, 10), int(r, 2, 10)], divPair: (r) => [int(r, 2, 10), int(r, 2, 10)] },
  4: { addPair: (r) => [int(r, 1200, 48000), int(r, 1200, 48000)], subPair: (r) => { const a = int(r, 20000, 99000); return [a, int(r, 1200, a - 1000)]; }, mulPair: (r) => [int(r, 2, 9), int(r, 12, 250)], divPair: (r) => [int(r, 2, 9), int(r, 12, 99)] },
  5: { addPair: (r) => [int(r, 12000, 480000), int(r, 12000, 480000)], subPair: (r) => { const a = int(r, 200000, 900000); return [a, int(r, 12000, a - 10000)]; }, mulPair: (r) => [int(r, 12, 99), int(r, 12, 99)], divPair: (r) => [int(r, 11, 25), int(r, 10, 99)] },
};

const cents = (c) => `$${(c / 100).toFixed(2)}`;
const dec = (tenthsOrHundredths, places) => (tenthsOrHundredths / 10 ** places).toFixed(places);

function ctx(rng) {
  const [n1, n2, n3] = shuffle(rng, NAMES);
  const theme = pick(rng, THEMES);
  const [items, item] = pick(rng, theme.items);
  return { n1, n2, n3, setting: theme.setting, extraName: () => pick(rng, EXTRA_NAMES), items, item, group: pick(rng, GROUPS), shop: pick(rng, SHOP) };
}

// Template: { id, op, kind:'whole'|'decimal'|'fraction', steps, grades:[min,max], make(rng, c, g) -> { text, answerText } }
// "op" is the main operation tag used by the operation filter; multi-step templates are tagged 'multi' and with each op they use.
const T = [];
const t = (def) => T.push({ level: 1, ...def }); // level 1 = standard, 2 = challenge

// ---------- whole numbers, single step ----------
t({ id: 'w-add-1', ops: ['add'], kind: 'whole', steps: 1, grades: [1, 5], make: (r, c, g) => { const [a, b] = PROFILE[g].addPair(r); return { text: `${c.n1} has ${fmt(a)} ${c.items}. ${c.n2} has ${fmt(b)} ${c.items}. How many ${c.items} do they have in all?`, answerText: fmt(a + b) }; } });
t({ id: 'w-add-2', ops: ['add'], kind: 'whole', steps: 1, grades: [1, 5], make: (r, c, g) => { const [a, b] = PROFILE[g].addPair(r); return { text: `${c.n1} had ${fmt(a)} ${c.items}. Then ${c.n1} found ${fmt(b)} more. How many ${c.items} does ${c.n1} have now?`, answerText: fmt(a + b) }; } });
t({ id: 'w-sub-1', ops: ['sub'], kind: 'whole', steps: 1, grades: [1, 5], make: (r, c, g) => { const [a, b] = PROFILE[g].subPair(r); return { text: `${c.n1} had ${fmt(a)} ${c.items}. ${c.n1} gave ${fmt(b)} to ${c.n2}. How many ${c.items} does ${c.n1} have left?`, answerText: fmt(a - b) }; } });
t({ id: 'w-sub-2', ops: ['sub'], kind: 'whole', steps: 1, grades: [1, 5], make: (r, c, g) => { const [a, b] = PROFILE[g].subPair(r); return { text: `There are ${fmt(a)} ${c.items} in a box. ${fmt(b)} of them are red. The rest are blue. How many are blue?`, answerText: fmt(a - b) }; } });
t({ id: 'w-mul-1', ops: ['mul'], kind: 'whole', steps: 1, grades: [2, 5], make: (r, c, g) => { const [a, b] = PROFILE[g].mulPair(r); return { text: `${c.n1} has ${fmt(a)} ${c.group}. Each of the ${c.group} has ${fmt(b)} ${c.items}. How many ${c.items} does ${c.n1} have in all?`, answerText: fmt(a * b) }; } });
t({ id: 'w-mul-2', ops: ['mul'], kind: 'whole', steps: 1, grades: [2, 5], make: (r, c, g) => { const [a, b] = PROFILE[g].mulPair(r); return { text: `A display has ${fmt(a)} rows of ${c.items}. Each row has ${fmt(b)} ${c.items}. How many ${c.items} are on the display?`, answerText: fmt(a * b) }; } });
t({ id: 'w-div-1', ops: ['div'], kind: 'whole', steps: 1, grades: [2, 5], make: (r, c, g) => { const [d, q] = PROFILE[g].divPair(r); return { text: `${c.n1} has ${fmt(d * q)} ${c.items}. ${c.n1} puts them into ${fmt(d)} equal groups. How many ${c.items} are in each group?`, answerText: fmt(q) }; } });
t({ id: 'w-div-2', ops: ['div'], kind: 'whole', steps: 1, grades: [2, 5], make: (r, c, g) => { const [d, q] = PROFILE[g].divPair(r); return { text: `${c.n1} has ${fmt(d * q)} ${c.items}. ${c.n1} puts ${fmt(q)} ${c.items} in each ${c.group.slice(0, -1)}. How many ${c.group} does ${c.n1} fill?`, answerText: fmt(d) }; } });

// ---------- whole numbers, multi-step ----------
t({ id: 'w-m-add-sub', ops: ['add', 'sub'], kind: 'whole', steps: 2, grades: [1, 5], make: (r, c, g) => { const [a, b] = PROFILE[g].addPair(r); const k = int(r, 1, Math.max(1, Math.floor((a + b) / 3))); return { text: `${c.n1} had ${fmt(a)} ${c.items}. ${c.n1} got ${fmt(b)} more. Then ${c.n1} gave ${fmt(k)} ${c.items} to ${c.n2}. How many ${c.items} does ${c.n1} have now?`, answerText: fmt(a + b - k) }; } });
t({ id: 'w-m-sub-sub', ops: ['sub'], kind: 'whole', steps: 2, grades: [1, 5], make: (r, c, g) => { const [a, b] = PROFILE[g].subPair(r); const k = int(r, 1, Math.max(1, Math.floor((a - b) / 2))); return { text: `${c.n1} had ${fmt(a)} ${c.items}. ${c.n1} gave ${fmt(b)} to ${c.n2} and ${fmt(k)} to a friend. How many ${c.items} are left?`, answerText: fmt(a - b - k) }; } });
t({ id: 'w-m-mul-add', ops: ['mul', 'add'], kind: 'whole', steps: 2, grades: [2, 5], make: (r, c, g) => { const [a, b] = PROFILE[g].mulPair(r); const k = int(r, 2, 3 * a); return { text: `${c.n1} has ${fmt(a)} ${c.group} with ${fmt(b)} ${c.items} in each. ${c.n2} gives ${c.n1} ${fmt(k)} more ${c.items}. How many ${c.items} does ${c.n1} have now?`, answerText: fmt(a * b + k) }; } });
t({ id: 'w-m-mul-sub', ops: ['mul', 'sub'], kind: 'whole', steps: 2, grades: [2, 5], make: (r, c, g) => { const [a, b] = PROFILE[g].mulPair(r); const k = int(r, 1, Math.max(1, Math.floor((a * b) / 2))); return { text: `${c.n1} buys ${fmt(a)} ${c.group} of ${c.items}. Each has ${fmt(b)} ${c.items}. ${c.n1} gives away ${fmt(k)} ${c.items}. How many ${c.items} are left?`, answerText: fmt(a * b - k) }; } });
t({ id: 'w-m-div-sub', ops: ['div', 'sub'], kind: 'whole', steps: 2, grades: [2, 5], make: (r, c, g) => { const [d, q] = PROFILE[g].divPair(r); const k = int(r, 1, Math.max(1, q - 1)); return { text: `${c.n1} shares ${fmt(d * q)} ${c.items} equally with ${fmt(d - 1)} friends. Then ${c.n1} gives ${fmt(k)} of ${c.n1}'s ${c.items} to ${c.n2}. How many ${c.items} does ${c.n1} have left?`, answerText: fmt(q - k) }; } });
t({ id: 'w-m-add-div', ops: ['add', 'div'], kind: 'whole', steps: 2, grades: [3, 5], make: (r, c, g) => { const [d, q] = PROFILE[g].divPair(r); const a = int(r, 1, d * q - 1); const b = d * q - a; return { text: `${c.n1} has ${fmt(a)} ${c.items}. ${c.n2} has ${fmt(b)} ${c.items}. They put all of them into ${fmt(d)} equal groups. How many ${c.items} are in each group?`, answerText: fmt(q) }; } });

// ---------- decimals (money for grades 3-4; measurement and money for grade 5) ----------
t({ id: 'd-add-1', ops: ['add'], kind: 'decimal', steps: 1, grades: [3, 5], make: (r, c) => { const a = int(r, 150, 1200), b = int(r, 150, 1200); return { text: `${c.n1} buys a ${c.shop[0]} for ${cents(a)} and a snack for ${cents(b)}. How much does ${c.n1} spend in all?`, answerText: cents(a + b) }; } });
t({ id: 'd-sub-1', ops: ['sub'], kind: 'decimal', steps: 1, grades: [3, 5], make: (r, c) => { const price = int(r, 125, 1850); const paid = Math.ceil((price + 1) / 500) * 500; return { text: `${c.n1} pays ${cents(paid)} for a ${c.shop[0]} that costs ${cents(price)}. How much change does ${c.n1} get back?`, answerText: cents(paid - price) }; } });
t({ id: 'd-mul-1', ops: ['mul'], kind: 'decimal', steps: 1, grades: [3, 5], make: (r, c) => { const p = int(r, 75, 650); const k = int(r, 2, 9); return { text: `One ${c.shop[0]} costs ${cents(p)}. ${c.n1} buys ${k} of them. How much do they cost in all?`, answerText: cents(p * k) }; } });
t({ id: 'd-div-1', ops: ['div'], kind: 'decimal', steps: 1, grades: [3, 5], make: (r, c) => { const each = int(r, 60, 480); const k = int(r, 2, 9); return { text: `${c.n1} pays ${cents(each * k)} for ${k} ${c.shop[1]} that cost the same. How much does one ${c.shop[0]} cost?`, answerText: cents(each) }; } });
t({ id: 'd-add-2', ops: ['add'], kind: 'decimal', steps: 1, grades: [5, 5], make: (r, c) => { const a = int(r, 120, 990), b = int(r, 120, 990); return { text: `${c.n1} walked ${dec(a, 2)} miles to school and ${dec(b, 2)} miles to the park. How many miles did ${c.n1} walk?`, answerText: dec(a + b, 2) }; } });
t({ id: 'd-sub-2', ops: ['sub'], kind: 'decimal', steps: 1, grades: [4, 5], make: (r, c) => { const a = int(r, 300, 990), b = int(r, 100, a - 50); const t1 = pick(r, THINGS_LONG); return { text: `A ${t1} is ${dec(a, 1)} meters long. ${c.n1} cuts off ${dec(b, 1)} meters. How long is the ${t1} now?`, answerText: `${dec(a - b, 1)} meters` }; } });
t({ id: 'd-mul-2', ops: ['mul'], kind: 'decimal', steps: 1, grades: [5, 5], make: (r, c) => { const a = int(r, 15, 99), k = int(r, 3, 9); return { text: `${c.n1} runs ${dec(a, 1)} kilometers each day for ${k} days. How many kilometers does ${c.n1} run in all?`, answerText: `${dec(a * k, 1)} kilometers` }; } });
t({ id: 'd-div-2', ops: ['div'], kind: 'decimal', steps: 1, grades: [5, 5], make: (r, c) => { const each = int(r, 12, 90), k = int(r, 2, 9); return { text: `${c.n1} has ${dec(each * k, 1)} liters of juice. ${c.n1} pours it equally into ${k} bottles. How many liters are in each bottle?`, answerText: `${dec(each, 1)} liters` }; } });
t({ id: 'd-m-money-1', ops: ['mul', 'sub'], kind: 'decimal', steps: 2, grades: [3, 5], make: (r, c) => { const p = int(r, 125, 575); const k = int(r, 2, 6); const paid = Math.ceil((p * k + 1) / 1000) * 1000; return { text: `${c.n1} buys ${k} ${c.shop[1]} that cost ${cents(p)} each. ${c.n1} pays with ${cents(paid)}. How much change does ${c.n1} get?`, answerText: cents(paid - p * k) }; } });
t({ id: 'd-m-money-2', ops: ['add', 'sub'], kind: 'decimal', steps: 2, grades: [3, 5], make: (r, c) => { const a = int(r, 150, 900), b = int(r, 150, 900); const paid = Math.ceil((a + b + 1) / 1000) * 1000; return { text: `${c.n1} buys a ${c.shop[0]} for ${cents(a)} and a pencil set for ${cents(b)}. ${c.n1} pays with ${cents(paid)}. How much change does ${c.n1} get?`, answerText: cents(paid - a - b) }; } });
t({ id: 'd-m-money-3', ops: ['div', 'add'], kind: 'decimal', steps: 2, grades: [4, 5], make: (r, c) => { const each = int(r, 60, 400), k = int(r, 2, 8), extra = int(r, 50, 300); return { text: `${c.n1} pays ${cents(each * k)} for ${k} ${c.shop[1]} that cost the same. ${c.n1} also buys a sticker for ${cents(extra)}. How much does ${c.n1} spend on one ${c.shop[0]} and the sticker together?`, answerText: cents(each + extra) }; } });

// ---------- fractions ----------
const DEN_LIKE = [3, 4, 5, 6, 8, 10, 12];
t({ id: 'f-set-3', ops: ['mul', 'div'], kind: 'fraction', steps: 1, grades: [3, 3], make: (r, c) => { const d = pick(r, [2, 3, 4, 5, 6]); const q = int(r, 2, 8); return { text: `${c.n1} has ${d * q} ${c.items}. ${c.n1} gives 1/${d} of them to ${c.n2}. How many ${c.items} does ${c.n1} give away?`, answerText: String(q) }; } });
t({ id: 'f-add-like', ops: ['add'], kind: 'fraction', steps: 1, grades: [4, 5], make: (r, c) => { const d = pick(r, DEN_LIKE); const a = int(r, 1, d - 1), b = int(r, 1, d - 1); const food = pick(r, FOODS); return { text: `${c.n1} ate ${F.raw(a, d)} of a ${food}. ${c.n2} ate ${F.raw(b, d)} of the same ${food}. How much of the ${food} did they eat in all?`, answerText: F.show(F.add(F.frac(a, d), F.frac(b, d))) }; } });
t({ id: 'f-sub-like', ops: ['sub'], kind: 'fraction', steps: 1, grades: [4, 5], make: (r, c) => { const d = pick(r, DEN_LIKE); const a = int(r, 2, d - 1), b = int(r, 1, a - 1); const t1 = pick(r, THINGS_LONG); return { text: `${c.n1} has a ${t1} that is ${F.raw(a, d)} of a yard long. ${c.n1} cuts off ${F.raw(b, d)} of a yard. How much of a yard is left?`, answerText: `${F.show(F.sub(F.frac(a, d), F.frac(b, d)))} of a yard` }; } });
t({ id: 'f-mul-whole', ops: ['mul'], kind: 'fraction', steps: 1, grades: [4, 5], make: (r, c) => { const d = pick(r, [2, 3, 4, 5, 6, 8]); const a = int(r, 1, d - 1); const k = int(r, 2, 9); return { text: `One bag needs ${F.raw(a, d)} cup of flour. ${c.n1} makes ${k} bags. How many cups of flour does ${c.n1} need?`, answerText: F.unit(F.mul(F.frac(a, d), F.frac(k)), 'cup', 'cups') }; } });
t({ id: 'f-add-unlike', ops: ['add'], kind: 'fraction', steps: 1, grades: [5, 5], make: (r, c) => { const pairs = [[2, 3], [2, 4], [3, 4], [2, 5], [3, 6], [4, 6], [2, 6], [3, 5], [4, 8], [2, 8]]; const [d1, d2] = pick(r, pairs); const a = int(r, 1, d1 - 1), b = int(r, 1, d2 - 1); return { text: `${c.n1} walked ${F.raw(a, d1)} mile in the morning and ${F.raw(b, d2)} mile after school. How many miles did ${c.n1} walk in all?`, answerText: F.unit(F.add(F.frac(a, d1), F.frac(b, d2)), 'mile', 'miles') }; } });
t({ id: 'f-sub-unlike', ops: ['sub'], kind: 'fraction', steps: 1, grades: [5, 5], make: (r, c) => { for (;;) { const pairs = [[2, 3], [2, 4], [3, 4], [2, 5], [3, 6], [4, 6], [3, 5], [4, 8]]; const [d1, d2] = pick(r, pairs); const a = int(r, 1, d1 - 1), b = int(r, 1, d2 - 1); const x = F.frac(a, d1), y = F.frac(b, d2); if (x.n * y.d > y.n * x.d) return { text: `${c.n1} had ${F.raw(a, d1)} of a pizza left. ${c.n1} ate ${F.raw(b, d2)} of the whole pizza. How much of the pizza is left?`, answerText: F.show(F.sub(x, y)) }; } } });
t({ id: 'f-mul-frac', ops: ['mul'], kind: 'fraction', steps: 1, grades: [5, 5], make: (r, c) => { const d1 = pick(r, [2, 3, 4, 5]), d2 = pick(r, [2, 3, 4, 5, 6]); const a = int(r, 1, d1 - 1), b = int(r, 1, d2 - 1); return { text: `${c.n1} has ${F.raw(a, d1)} of a pan of brownies left. ${c.n1} eats ${F.raw(b, d2)} of what is left. How much of the whole pan does ${c.n1} eat?`, answerText: F.show(F.mul(F.frac(a, d1), F.frac(b, d2))) }; } });
t({ id: 'f-div-unit', ops: ['div'], kind: 'fraction', steps: 1, grades: [5, 5], make: (r, c) => { if (r() < 0.5) { const w = int(r, 2, 6), d = pick(r, [2, 3, 4]); return { text: `${c.n1} has ${w} pies. ${c.n1} cuts each pie into pieces that are 1/${d} of a pie. How many pieces does ${c.n1} have?`, answerText: String(w * d) }; } const d = pick(r, [2, 3, 4]); const k = int(r, 2, 5); return { text: `${c.n1} has 1/${d} of a pound of trail mix. ${c.n1} shares it equally among ${k} friends. How much of a pound does each friend get?`, answerText: `${F.show(F.frac(1, d * k))} of a pound` }; } });
t({ id: 'f-m-add-sub', ops: ['add', 'sub'], kind: 'fraction', steps: 2, grades: [4, 5], make: (r, c) => { const d = pick(r, DEN_LIKE); const a = int(r, 1, d - 2), b = int(r, 1, d - 1 - a); const k = int(r, 1, Math.max(1, a + b - 1)); const x = F.frac(a + b, d); return { text: `${c.n1} ate ${F.raw(a, d)} of a pizza at lunch and ${F.raw(b, d)} of the pizza at dinner. ${c.n2} ate ${F.raw(k, d)} of the pizza. How much more pizza did ${c.n1} eat than ${c.n2}?`, answerText: F.show(F.sub(x, F.frac(k, d))) }; } });
t({ id: 'f-m-mul-sub', ops: ['mul', 'sub'], kind: 'fraction', steps: 2, grades: [5, 5], make: (r, c) => { const d = pick(r, [2, 3, 4, 5]), a = 1, k = int(r, 3, 8); const total = F.mul(F.frac(a, d), F.frac(k)); const use = Math.floor(total.n / total.d); const left = F.sub(total, F.frac(use)); return { text: `${c.n1} has ${k} bags of beads. Each bag is ${F.raw(a, d)} full of beads that weigh 1 pound when full. ${c.n1} uses ${use} pound${use === 1 ? '' : 's'} of beads. How many pounds of beads are left?`, answerText: `${F.show(left)} pounds` }; } });

const OPS = ['add', 'sub', 'mul', 'div', 'mixed'];
const KINDS = ['whole', 'decimal', 'fraction', 'mixed'];
const STEPS = ['single', 'multi', 'mixed'];

const LEVELS = ['mixed', 'standard', 'challenge'];

function pool({ grade, op, kind, steps, level = 'mixed' }) {
  return T.filter(
    (x) =>
      grade >= x.grades[0] && grade <= x.grades[1] &&
      (level === 'mixed' || x.level === (level === 'challenge' ? 2 : 1)) &&
      (kind === 'mixed' || x.kind === kind) &&
      (op === 'mixed' || x.ops.includes(op)) &&
      (steps === 'mixed' || (steps === 'single' ? x.steps === 1 : x.steps > 1))
  );
}

function wordProblems(rng, { grade = 3, op = 'mixed', kind = 'whole', steps = 'mixed', level = 'mixed', count = 10 }) {
  const available = pool({ grade, op, kind, steps, level });
  if (!available.length) return { problems: [], error: 'No word problems match those choices for this grade. Try a different grade, number type or step setting.' };
  const out = [];
  const seen = new Set();
  let deck = [];
  let guard = 0;
  while (out.length < count && guard++ < count * 40) {
    // Walk a shuffled deck of templates so a sheet uses as many different structures as possible before repeating one.
    if (deck.length === 0) deck = shuffle(rng, available);
    const tpl = deck.pop();
    const p = tpl.make(rng, ctx(rng), grade);
    if (seen.has(p.text)) continue;
    seen.add(p.text);
    out.push({ text: p.text, answerText: p.answerText, steps: tpl.steps, kind: tpl.kind, level: tpl.level });
  }
  return { problems: out, error: null };
}

require('./wordProblemsExtra')(t, { PROFILE, int, pick, F, fmt, cents, dec });

module.exports = { wordProblems, pool, ctx, OPS, KINDS, STEPS, LEVELS, TEMPLATES: T, NAMES, EXTRA_NAMES, THEMES };
