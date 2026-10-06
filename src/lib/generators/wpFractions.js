'use strict';

// Fraction scenes: recipes, pizza, ribbons, distance, and sharing, where the fractions come up naturally.
module.exports = function register(t, H) {
  const { int, pick, fmt, F } = H;
  const show = F.show;
  const money = (n) => `$${fmt(n)}`;
  const mixedFrac = (w, a, d) => F.frac(w * d + a, d);
  const label = (w, a, d) => `${w} ${a}/${d}`;

  // ---------- parts of a whole ----------
  t({ id: 'fr-pizza-left', ops: ['sub'], kind: 'fraction', steps: 2, grades: [3, 5], make: (r, { A, B }) => {
    const d = pick(r, [6, 8, 10, 12]); const a = int(r, 1, 3); const b = int(r, 1, Math.min(3, d - a - 1));
    return { text: `The pizza at ${A}'s party was cut into ${d} equal slices. ${A} ate ${a} ${a === 1 ? 'slice' : 'slices'}, and ${B} ate ${b} ${b === 1 ? 'slice' : 'slices'}. What fraction of the pizza is left?`, answerText: show(F.frac(d - a - b, d)) };
  } });
  t({ id: 'fr-of-a-set', ops: ['mul', 'div'], kind: 'fraction', steps: 1, grades: [3, 5], make: (r, { A, B }, g) => {
    const d = g === 3 ? pick(r, [2, 3, 4, 5]) : pick(r, [3, 4, 5, 6, 8]); const a = g === 3 ? 1 : int(r, 2, d - 1); const q = g === 3 ? int(r, 2, 6) : int(r, 3, 10);
    return { text: `${A} has ${d * q} baseball cards in a shoebox. ${A.S} gives ${a === 1 ? `1/${d}` : `${a}/${d}`} of them to ${B}. How many cards does ${A.s} give to ${B}?`, answerText: fmt(a * q) };
  } });
  t({ id: 'fr-recipe-batches', ops: ['mul'], kind: 'fraction', steps: 1, grades: [4, 5], make: (r, { A }) => {
    const d = pick(r, [2, 3, 4, 8]); const a = int(r, 1, d - 1); const k = int(r, 2, 6);
    return { text: `A pancake recipe uses ${a}/${d} cup of milk for one batch. ${A} wants to make ${k} batches for a breakfast fundraiser. How many cups of milk will ${A.s} need?`, answerText: F.unit(F.mul(F.frac(a, d), F.frac(k)), 'cup', 'cups') };
  } });
  t({ id: 'fr-mixed-flour', ops: ['add'], kind: 'fraction', steps: 1, grades: [4, 5], make: (r, { A }) => {
    const d = pick(r, [3, 4, 5, 6, 8]); const w1 = int(r, 1, 3); const w2 = int(r, 1, 3); const a = int(r, 1, d - 1); const b = int(r, 1, d - 1);
    return { text: `${A} is baking for a class party. ${A.S} uses ${label(w1, a, d)} cups of flour for the bread and ${label(w2, b, d)} cups for the rolls. How much flour does ${A.s} use in all?`, answerText: F.unit(F.add(mixedFrac(w1, a, d), mixedFrac(w2, b, d)), 'cup', 'cups') };
  } });
  t({ id: 'fr-mixed-board', ops: ['sub'], kind: 'fraction', steps: 1, grades: [4, 5], make: (r, { A }) => {
    const d = pick(r, [3, 4, 5, 6, 8]); const w1 = int(r, 3, 6); const w2 = int(r, 1, w1 - 1); const a = int(r, 1, d - 1); const b = int(r, 1, d - 1);
    return { text: `${A} is building a bookshelf from a board that is ${label(w1, a, d)} feet long. ${A.S} saws off a piece that is ${label(w2, b, d)} feet long. How long is the board now?`, answerText: F.unit(F.sub(mixedFrac(w1, a, d), mixedFrac(w2, b, d)), 'foot', 'feet') };
  } });
  t({ id: 'fr-three-walks', ops: ['add'], kind: 'fraction', steps: 1, grades: [4, 5], make: (r, { A }) => {
    const d = pick(r, [5, 6, 8, 10, 12]); const a = int(r, 1, d - 1); const b = int(r, 1, d - 1); const e = int(r, 1, d - 1);
    return { text: `${A} walks around the neighborhood three times a day. This morning ${A.s} walked ${a}/${d} mile, at lunch ${A.s} walked ${b}/${d} mile, and after dinner ${A.s} walked ${e}/${d} mile. How far did ${A.s} walk in all?`, answerText: F.unit(F.frac(a + b + e, d), 'mile', 'miles') };
  } });
  t({ id: 'fr-unlike-walk', ops: ['add'], kind: 'fraction', steps: 1, grades: [5, 5], make: (r, { A }) => {
    const [d1, d2] = pick(r, [[2, 3], [2, 4], [3, 4], [2, 5], [3, 6], [4, 6], [3, 5], [4, 8]]); const a = int(r, 1, d1 - 1); const b = int(r, 1, d2 - 1);
    return { text: `${A} walks ${a}/${d1} mile to the bus stop and then ${b}/${d2} mile from the bus stop to school. How far does ${A.s} walk altogether?`, answerText: F.unit(F.add(F.frac(a, d1), F.frac(b, d2)), 'mile', 'miles') };
  } });
  t({ id: 'fr-unlike-jug', ops: ['sub'], kind: 'fraction', steps: 1, grades: [5, 5], make: (r, { A }) => {
    for (;;) {
      const [d1, d2] = pick(r, [[2, 3], [3, 4], [2, 5], [4, 6], [3, 5], [4, 8], [3, 6]]); const a = int(r, 1, d1 - 1); const b = int(r, 1, d2 - 1);
      const x = F.frac(a, d1); const y = F.frac(b, d2);
      if (x.n * y.d > y.n * x.d) return { text: `A water jug for the soccer team held ${a}/${d1} gallon. ${A} pours out ${b}/${d2} gallon for the players. How much water is left in the jug?`, answerText: F.unit(F.sub(x, y), 'gallon', 'gallons') };
    }
  } });
  t({ id: 'fr-fraction-of-fraction', ops: ['mul'], kind: 'fraction', steps: 1, grades: [5, 5], make: (r, { A }) => {
    const d1 = pick(r, [2, 3, 4, 5]); const d2 = pick(r, [2, 3, 4, 5, 6]); const a = int(r, 1, d1 - 1); const b = int(r, 1, d2 - 1);
    return { text: `After dinner, ${a}/${d1} of a lasagna was left in the pan. ${A} ate ${b}/${d2} of what was left for lunch the next day. What fraction of the whole lasagna did ${A.s} eat for lunch?`, answerText: show(F.mul(F.frac(a, d1), F.frac(b, d2))) };
  } });
  t({ id: 'fr-share-trail-mix', ops: ['div'], kind: 'fraction', steps: 1, grades: [5, 5], make: (r, { A }) => {
    const d = pick(r, [2, 3, 4]); const k = int(r, 2, 5);
    return { text: `${A} has 1/${d} of a pound of trail mix left from a hike. ${A.S} splits it equally among ${k} friends. How much of a pound does each friend get?`, answerText: `${show(F.frac(1, d * k))} of a pound` };
  } });
  t({ id: 'fr-dough-rolls', ops: ['div'], kind: 'fraction', steps: 1, grades: [5, 5], make: (r, { A }) => {
    const w = int(r, 2, 6); const d = pick(r, [2, 3, 4]);
    return { text: `A baker has ${w} pounds of dough. Each dinner roll uses 1/${d} pound of dough. How many rolls can ${A} make?`, answerText: `${w * d} rolls` };
  } });

  // grade 3: fractions as equal parts and unit fractions of a set
  t({ id: 'fr-sandwich', ops: ['sub'], kind: 'fraction', steps: 1, grades: [3, 3], make: (r, { A }) => {
    const d = pick(r, [4, 6, 8]); const a = int(r, 1, Math.floor(d / 2));
    return { text: `${A} cuts a sandwich into ${d} equal pieces for lunch and eats ${a} ${a === 1 ? 'piece' : 'pieces'}. What fraction of the sandwich is left?`, answerText: show(F.frac(d - a, d)) };
  } });
  t({ id: 'fr-garden-sections', ops: ['sub'], kind: 'fraction', steps: 1, grades: [3, 4], make: (r, { A }) => {
    const d = pick(r, [8, 10, 12]); const a = int(r, 2, Math.floor(d / 2)); const b = int(r, 1, Math.min(3, d - a - 1));
    return { text: `${A}'s garden is divided into ${d} equal sections. ${A.S} planted tomatoes in ${a} of the sections and beans in ${b} of them. What fraction of the garden is still empty?`, answerText: show(F.frac(d - a - b, d)) };
  } });
  t({ id: 'fr-chocolate-bar', ops: ['mul', 'div'], kind: 'fraction', steps: 1, grades: [3, 4], make: (r, { A }) => {
    const d = pick(r, [2, 3, 4]); const squares = d * int(r, 2, 4);
    return { text: `A chocolate bar has ${squares} equal squares. ${A} eats 1/${d} of the bar. How many squares does ${A.s} eat?`, answerText: fmt(squares / d) };
  } });
  t({ id: 'fr-laps-half', ops: ['mul', 'div'], kind: 'fraction', steps: 1, grades: [3, 4], make: (r, { A }) => {
    const d = pick(r, [2, 4, 5]); const laps = d * int(r, 2, 5);
    return { text: `${A} is going to run ${laps} laps around the track for charity. By the water break, ${A.s} has finished 1/${d} of the laps. How many laps has ${A.s} run so far?`, answerText: fmt(laps / d) };
  } });

  // ---------- challenge ----------
  t({ id: 'fr-c-set-left', ops: ['mul', 'sub'], kind: 'fraction', steps: 2, level: 2, grades: [4, 5], make: (r, { A, B }, g) => {
    const d = pick(r, [3, 4, 5, 6, 8]); const a = int(r, 2, d - 1); const q = g === 4 ? int(r, 3, 9) : int(r, 5, 14);
    return { text: `${A} has ${d * q} stickers. ${A.S} gives ${a}/${d} of them to ${B} and keeps the rest. How many stickers does ${A} keep?`, answerText: fmt(d * q - a * q) };
  } });
  t({ id: 'fr-c-who-ran-farther', ops: ['sub'], kind: 'fraction', steps: 2, level: 2, grades: [4, 5], make: (r, { A, B }, g) => {
    let n1; let d1; let n2; let d2;
    if (g === 4) { d1 = pick(r, [4, 6, 8, 10]); d2 = d1; n1 = int(r, 3, d1 - 1); n2 = int(r, 1, n1 - 1); } else {
      [d1, d2] = pick(r, [[4, 8], [3, 6], [2, 4], [5, 10], [3, 4], [2, 3], [4, 6]]);
      do { n1 = int(r, 1, d1 - 1); n2 = int(r, 1, d2 - 1); } while (n1 * d2 === n2 * d1);
    }
    const x = F.frac(n1, d1); const y = F.frac(n2, d2); const first = x.n * y.d > y.n * x.d;
    return { text: `In the school mini-marathon, ${A} ran ${n1}/${d1} mile and ${B} ran ${n2}/${d2} mile. Who ran farther, and how much farther?`, answerText: `${first ? A : B} ran ${show(first ? F.sub(x, y) : F.sub(y, x))} mile farther` };
  } });
  t({ id: 'fr-c-brownie-pan', ops: ['add', 'sub'], kind: 'fraction', steps: 3, level: 2, grades: [4, 5], make: (r, { A, B, C }) => {
    const d = pick(r, [8, 10, 12]); const a = int(r, 1, 2); const b = int(r, 1, 2); const e = int(r, 1, 2);
    return { text: `A pan of brownies is cut into ${d} equal pieces. ${A} eats ${a} ${a === 1 ? 'piece' : 'pieces'}, ${B} eats ${b} ${b === 1 ? 'piece' : 'pieces'}, and ${C} takes ${e} ${e === 1 ? 'piece' : 'pieces'} home. What fraction of the pan is left?`, answerText: show(F.frac(d - a - b - e, d)) };
  } });
  t({ id: 'fr-c-how-we-get-to-school', ops: ['mul', 'sub'], kind: 'fraction', steps: 3, level: 2, grades: [4, 5], make: (r, { A }) => {
    const n = pick(r, [24, 36, 48]);
    return { text: `In ${A}'s class of ${n} students, 1/4 of the students walk to school and 1/3 ride a bus. Everyone else is dropped off by a family member. How many students are dropped off?`, answerText: fmt(n - n / 4 - n / 3) };
  } });
  t({ id: 'fr-c-allowance', ops: ['mul', 'sub'], kind: 'fraction', steps: 3, level: 2, grades: [5, 5], make: (r, { A }) => {
    const total = 12 * int(r, 3, 10);
    return { text: `${A} earned ${money(total)} doing chores this month. ${A.S} spent 1/3 of the money on a book and 1/4 of the money on snacks. How much money does ${A.s} have left?`, answerText: money(total - total / 3 - total / 4) };
  } });
  t({ id: 'fr-c-whole-minus-mixed', ops: ['sub'], kind: 'fraction', steps: 1, level: 2, grades: [5, 5], make: (r, { A }) => {
    const d = pick(r, [2, 3, 4, 5, 6, 8]); const w = int(r, 1, 3); const a = int(r, 1, d - 1); const total = int(r, w + 2, w + 5);
    return { text: `${A} ordered ${total} pizzas for a team party. By the end of the night, the players had eaten ${label(w, a, d)} pizzas. How much pizza is left over?`, answerText: F.unit(F.sub(F.frac(total), mixedFrac(w, a, d)), 'pizza', 'pizzas') };
  } });
};
