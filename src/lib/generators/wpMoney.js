'use strict';

// Decimal scenes: money and measurement, with prices and sizes you would really find.
module.exports = function register(t, H) {
  const { int, pick, shuffle, fmt, cents, dec } = H;

  // Things you can buy, with believable price ranges in cents.
  const SHOPS = [
    { place: 'the school store', items: [
      { one: 'a notebook', many: 'notebooks', lo: 249, hi: 499 }, { one: 'a pack of pencils', many: 'packs of pencils', lo: 129, hi: 349 },
      { one: 'a folder', many: 'folders', lo: 79, hi: 199 }, { one: 'an eraser', many: 'erasers', lo: 59, hi: 149 }, { one: 'a glue stick', many: 'glue sticks', lo: 99, hi: 249 } ] },
    { place: 'the snack bar at the pool', items: [
      { one: 'a slice of pizza', many: 'slices of pizza', lo: 225, hi: 350 }, { one: 'a lemonade', many: 'lemonades', lo: 150, hi: 299 },
      { one: 'a bag of popcorn', many: 'bags of popcorn', lo: 150, hi: 350 }, { one: 'an ice cream cone', many: 'ice cream cones', lo: 199, hi: 399 } ] },
    { place: 'the book fair', items: [
      { one: 'a paperback book', many: 'paperback books', lo: 499, hi: 999 }, { one: 'a bookmark', many: 'bookmarks', lo: 99, hi: 249 },
      { one: 'a poster', many: 'posters', lo: 399, hi: 899 }, { one: 'a set of stickers', many: 'sets of stickers', lo: 149, hi: 349 } ] },
  ];
  const BILLS = [5, 10, 20, 50];
  const billFor = (totalCents) => BILLS.find((b) => b * 100 > totalCents) || 100;
  const price = (r, item) => int(r, item.lo, item.hi);
  const R = Math.round;
  const tenths = (v) => dec(v, 1).replace(/\.0$/, ''); // "12.0" reads better as "12"

  // ---------- money, standard ----------
  t({ id: 'money-three-items', ops: ['add'], kind: 'decimal', steps: 1, grades: [3, 5], make: (r, { A }) => {
    const shop = pick(r, SHOPS); const [x, y, z] = shuffle(r, shop.items).slice(0, 3); const a = price(r, x); const b = price(r, y); const d = price(r, z);
    return { text: `${A} is shopping at ${shop.place}. ${A.S} picks out ${x.one} for ${cents(a)}, ${y.one} for ${cents(b)}, and ${z.one} for ${cents(d)}. How much will ${A.s} spend in all?`, answerText: cents(a + b + d) };
  } });
  t({ id: 'money-change', ops: ['add', 'sub'], kind: 'decimal', steps: 2, grades: [3, 5], make: (r, { A }) => {
    const shop = pick(r, SHOPS); const [x, y] = shuffle(r, shop.items).slice(0, 2); const a = price(r, x); const b = price(r, y); const bill = billFor(a + b);
    return { text: `At ${shop.place}, ${A} buys ${x.one} for ${cents(a)}. ${A.S} also buys ${y.one} for ${cents(b)}. ${A.S} hands the cashier a $${bill} bill. How much change should ${A.s} get back?`, answerText: cents(bill * 100 - a - b) };
  } });
  t({ id: 'money-several', ops: ['mul'], kind: 'decimal', steps: 1, grades: [4, 5], make: (r, { A }, g) => {
    const shop = pick(r, SHOPS); const item = pick(r, shop.items); const p = price(r, item); const k = g === 4 ? int(r, 2, 6) : int(r, 3, 9);
    return { text: `${A} is treating ${k} friends at ${shop.place}. Each friend gets ${item.one}, and each one costs ${cents(p)}. How much will ${A.s} spend on the ${k} friends?`, answerText: cents(p * k) };
  } });
  t({ id: 'money-unit-price', ops: ['div'], kind: 'decimal', steps: 1, grades: [4, 5], make: (r, { A }) => {
    const [what, lo, hi, kmin, kmax] = pick(r, [['granola bars for a hiking trip', 79, 149, 4, 8], ['pencils for the first day of school', 20, 45, 8, 20], ['apples for a snack', 50, 99, 4, 8], ['stickers for a reward chart', 15, 40, 10, 30]]);
    const each = int(r, lo, hi); const k = int(r, kmin, kmax);
    return { text: `${A} bought ${k} ${what} and paid ${cents(each * k)} in all. Every one cost the same amount. How much did one cost?`, answerText: cents(each) };
  } });
  t({ id: 'money-split-bill', ops: ['div'], kind: 'decimal', steps: 1, grades: [4, 5], make: (r, { A, B, C }) => {
    const each = int(r, 450, 900);
    return { text: `${A}, ${B}, and ${C} had lunch together at the pizza place. The whole bill came to ${cents(each * 3)}, and they agreed to split it equally. How much did each friend pay?`, answerText: cents(each) };
  } });
  t({ id: 'money-how-much-more', ops: ['sub'], kind: 'decimal', steps: 1, grades: [3, 5], make: (r, { A }) => {
    const shop = pick(r, SHOPS); const [x, y] = shuffle(r, shop.items).slice(0, 2); let a = price(r, x); let b = price(r, y); if (a === b) a += 5;
    const [hi, lo] = a > b ? [[x, a], [y, b]] : [[y, b], [x, a]];
    return { text: `${A} is deciding what to buy at ${shop.place}. ${hi[0].one.replace(/^an? /, 'The ')} costs ${cents(hi[1])}, and ${lo[0].one.replace(/^an? /, 'the ')} costs ${cents(lo[1])}. How much more does ${hi[0].one.replace(/^an? /, 'the ')} cost?`, answerText: cents(hi[1] - lo[1]) };
  } });
  t({ id: 'money-single-change', ops: ['sub'], kind: 'decimal', steps: 1, grades: [3, 4], make: (r, { A }) => {
    const shop = pick(r, SHOPS); const x = pick(r, shop.items); const a = price(r, x); const bill = billFor(a);
    return { text: `${A} walks up to the counter at ${shop.place} to buy ${x.one}. It costs ${cents(a)}, and ${A.s} pays with a $${bill} bill. How much change does ${A.s} get?`, answerText: cents(bill * 100 - a) };
  } });
  t({ id: 'money-lemonade-stand', ops: ['mul'], kind: 'decimal', steps: 1, grades: [3, 4], make: (r, { A, B }) => {
    const p = pick(r, [25, 50, 75]); const k = int(r, 4, 12);
    return { text: `${A} and ${B} set up a lemonade stand on a hot Saturday. They charge ${cents(p)} for each cup. They sell ${k} cups before lunch. How much money do they make?`, answerText: cents(p * k) };
  } });
  t({ id: 'money-dollars-quarters', ops: ['add'], kind: 'decimal', steps: 1, grades: [3, 3], make: (r, { A }) => {
    const d = int(r, 2, 9); const q = int(r, 1, 3);
    return { text: `${A} is counting the money in ${A.p} wallet. ${A.S} has ${d} dollar bills and ${q} ${q === 1 ? 'quarter' : 'quarters'}. How much money does ${A.s} have?`, answerText: cents(d * 100 + q * 25) };
  } });
  t({ id: 'money-savings-goal', ops: ['add', 'sub'], kind: 'decimal', steps: 2, grades: [4, 5], make: (r, { A }) => {
    const cost = int(r, 2499, 5999); const have = int(r, 800, Math.floor(cost * 0.4)); const x = int(r, 500, Math.floor(cost * 0.3));
    return { text: `${A} wants a video game that costs ${cents(cost)}. ${A.S} has ${cents(have)} saved up and earns ${cents(x)} washing cars on Saturday. How much more money does ${A.s} need?`, answerText: cents(cost - have - x) };
  } });

  // ---------- measurement ----------
  t({ id: 'meas-ribbon', ops: ['sub'], kind: 'decimal', steps: 1, grades: [4, 5], make: (r, { A }, g) => {
    const places = g === 4 ? 1 : 2; const k = 10 ** places; const a = int(r, R(2.5 * k), R(6 * k)); const b = int(r, R(0.8 * k), Math.min(R(2 * k), a - R(0.3 * k)));
    return { text: `${A} has a ribbon that is ${dec(a, places)} meters long. ${A.S} cuts off ${dec(b, places)} meters to wrap a gift. How much ribbon is left?`, answerText: `${dec(a - b, places)} meters` };
  } });
  t({ id: 'meas-dash', ops: ['sub'], kind: 'decimal', steps: 1, grades: [4, 5], make: (r, { A, B }, g) => {
    const places = g === 4 ? 1 : 2; const k = 10 ** places; const slow = int(r, R(17.5 * k), R(26 * k)); const fast = slow - int(r, R(0.3 * k), R(2.4 * k));
    return { text: `At field day, ${A} ran the 100-meter dash in ${dec(slow, places)} seconds. ${B} ran it in ${dec(fast, places)} seconds, which was faster. How much faster was ${B}?`, answerText: `${dec(slow - fast, places)} seconds` };
  } });
  t({ id: 'meas-backpack', ops: ['add'], kind: 'decimal', steps: 1, grades: [4, 5], make: (r, { A }) => {
    const a = int(r, 12, 25); const b = int(r, 6, 15); const d = int(r, 4, 10);
    return { text: `${A} is packing ${A.p} backpack for school. The math book weighs ${dec(a, 1)} kilograms, the lunch box weighs ${dec(b, 1)} kilograms, and the water bottle weighs ${dec(d, 1)} kilograms. How much do the three things weigh together?`, answerText: `${tenths(a + b + d)} kilograms` };
  } });
  t({ id: 'meas-rain', ops: ['add'], kind: 'decimal', steps: 1, grades: [4, 5], make: (r, c, g) => {
    const places = g === 4 ? 1 : 2; const k = 10 ** places; const a = int(r, R(0.3 * k), R(2.5 * k)); const b = int(r, R(0.3 * k), R(2.5 * k));
    return { text: `A weather station measured ${dec(a, places)} inches of rain on Monday and ${dec(b, places)} inches on Tuesday. How many inches of rain fell on the two days?`, answerText: `${dec(a + b, places)} inches` };
  } });
  t({ id: 'meas-plant', ops: ['sub'], kind: 'decimal', steps: 1, grades: [4, 5], make: (r, { A }) => {
    const a = int(r, 45, 90); const grow = int(r, 8, 25);
    return { text: `${A} planted a bean seed for the science fair. On Monday, the plant was ${dec(a, 1)} centimeters tall. By Friday, it was ${dec(a + grow, 1)} centimeters tall. How many centimeters did it grow?`, answerText: `${dec(grow, 1)} centimeters` };
  } });
  t({ id: 'meas-walk-to-school', ops: ['mul'], kind: 'decimal', steps: 2, grades: [5, 5], make: (r, { A }) => {
    const a = int(r, 4, 15);
    return { text: `${A} lives ${dec(a, 1)} miles from school and walks there and back every day. How many miles does ${A.s} walk in 5 school days?`, answerText: `${tenths(a * 10)} miles` };
  } });
  t({ id: 'meas-gas', ops: ['mul'], kind: 'decimal', steps: 1, grades: [5, 5], make: (r, { A }) => {
    const p = int(r, 299, 399); const g = int(r, 6, 12);
    return { text: `Gas costs ${cents(p)} per gallon at the station near ${A}'s house. ${A.P} dad pumps ${g} gallons into the family car. How much does the gas cost?`, answerText: cents(p * g) };
  } });
  t({ id: 'meas-recipe', ops: ['mul'], kind: 'decimal', steps: 1, grades: [5, 5], make: (r, { A }) => {
    const a = int(r, 15, 35); const k = int(r, 2, 6);
    return { text: `One batch of banana bread uses ${dec(a, 1)} cups of flour. ${A} is baking ${k} batches for the fundraiser. How many cups of flour does ${A.s} need?`, answerText: `${tenths(a * k)} cups` };
  } });

  // ---------- challenge ----------
  t({ id: 'money-c-sale', ops: ['sub', 'mul'], kind: 'decimal', steps: 2, level: 2, grades: [5, 5], make: (r, { A }) => {
    const p = int(r, 1299, 1999); const off = int(r, 200, 500); const k = int(r, 2, 4);
    return { text: `A T-shirt at the team store costs ${cents(p)}. This week, the store takes ${cents(off)} off every shirt. ${A} buys ${k} shirts at the sale price. How much does ${A.s} pay in all?`, answerText: cents((p - off) * k) };
  } });
  t({ id: 'money-c-need-more', ops: ['add', 'sub'], kind: 'decimal', steps: 2, level: 2, grades: [4, 5], make: (r, { A, B }) => {
    const a = int(r, 500, 1800); const b = int(r, 500, 1800); const cost = a + b + int(r, 150, 900);
    return { text: `${A} and ${B} want to chip in for a board game that costs ${cents(cost)}. ${A} has ${cents(a)}, and ${B} has ${cents(b)}. How much more money do they need?`, answerText: cents(cost - a - b) };
  } });
  t({ id: 'money-c-share-snacks', ops: ['add', 'div'], kind: 'decimal', steps: 2, level: 2, grades: [4, 5], make: (r, { A, B, C }) => {
    const each = int(r, 250, 900); const total = each * 3; const first = int(r, 400, Math.floor(total * 0.6));
    return { text: `${A}, ${B}, and ${C} are buying snacks for a movie night. The chips cost ${cents(first)}, and the drinks cost ${cents(total - first)}. They split the total cost equally. How much does each friend pay?`, answerText: cents(each) };
  } });
  t({ id: 'meas-c-mixed-places', ops: ['sub'], kind: 'decimal', steps: 1, level: 2, grades: [5, 5], make: (r, { A, B }) => {
    const a = int(r, 300, 480); const bt = int(r, 30, Math.floor((a - 20) / 10));
    return { text: `At the long jump pit, ${A} jumped ${dec(a, 2)} meters. ${B} jumped ${dec(bt, 1)} meters. How much farther did ${A} jump than ${B}?`, answerText: `${dec(a - bt * 10, 2)} meters` };
  } });
  t({ id: 'money-c-two-friends-change', ops: ['mul', 'add', 'sub'], kind: 'decimal', steps: 3, level: 2, grades: [4, 5], make: (r, { A, B }) => {
    const shop = pick(r, SHOPS); const item = pick(r, shop.items); const p = price(r, item); const extra = int(r, 99, 249); const total = p * 2 + extra; const bill = billFor(total);
    return { text: `${A} and ${B} are at ${shop.place}. They each buy ${item.one} for ${cents(p)}, and they share a snack that costs ${cents(extra)}. ${A} pays for everything with a $${bill} bill. How much change does ${A.s} get back?`, answerText: cents(bill * 100 - total) };
  } });
};
