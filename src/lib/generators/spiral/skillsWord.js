'use strict';

// Word-problem skills for the Spiral Review sheets. Names come from the same cast as every other worksheet.
const C = require('./core');
const { ctx } = require('../wordProblems');
const { f, mx, text, line, cell, F, int, pick, shuffle, scaled, fromScaled, trimDec } = C;

const commas = (n) => Number(n).toLocaleString('en-US');
const money = (cents) => `$${(cents / 100).toFixed(2)}`;
const ans = (v) => F.show(v);
const coprime = (r, d) => { for (let i = 0; i < 50; i++) { const n = int(r, 1, d - 1); if (F.gcd(n, d) === 1) return n; } return 1; };
const ITEMS = ['a book', 'a computer game', 'a pair of shoes', 'a backpack', 'a board game', 'a jacket', 'a puzzle', 'a soccer ball'];

const skills = {
  moneyDiff(r) {
    const { A, B } = ctx(r);
    const [x, y] = shuffle(r, ITEMS);
    const lo = int(r, 500, 1500); const hi = lo + int(r, 100, 900);
    const cheaper = int(r, 0, 1);
    const loName = cheaper ? A : B; const hiName = cheaper ? B : A;
    return cell([text(`${loName} buys ${x} for ${money(lo)}. ${hiName} buys ${y} for ${money(hi)}. How much more money does ${hiName} spend than ${loName}?`), line()], money(hi - lo));
  },
  moneyChange(r) {
    const { A } = ctx(r);
    const have = pick(r, [4000, 5000, 6000, 10000]);
    const [i1, i2] = pick(r, [['a computer game', 'a hat'], ['a jacket', 'a pair of gloves'], ['a game', 'a snack'], ['a book', 'a bookmark']]);
    const a = int(r, 900, 2400) + int(r, 0, 9) * 1; const b = int(r, 300, 900); // always affordable: 2400 + 9 + 900 < 4000
    return cell([text(`${A} has ${money(have)} and buys ${i1} for ${money(a)} and ${i2} for ${money(b)}. How much money does ${A.s} have left?`), line()], money(have - a - b));
  },
  moneyThree(r) {
    const { A } = ctx(r);
    const a = int(r, 600, 1400); const b = int(r, 300, 900); const c = int(r, 200, 700);
    return cell([text(`${A} spent ${money(a)} for a movie ticket, ${money(b)} for popcorn, and ${money(c)} for a drink. How much did ${A.s} spend in all?`), line()], money(a + b + c));
  },
  moneyBeforeTax(r, p = {}) {
    const { A } = ctx(r);
    const price = int(r, 2500, 6500); const tax = Math.round(price * 0.07);
    if (p.total) return cell([text(`${A} bought a pair of shoes for ${money(price)}. The sales tax was ${money(tax)}. How much money did ${A} spend in all?`), line()], money(price + tax));
    return cell([text(`${A} bought a pair of shoes for ${money(price)}. The sales tax was ${money(tax)}. How much money did ${A} spend on the pair of shoes before taxes?`), line()], `${money(price)} (the tax is extra information)`);
  },
  decWordMulCompare(r) {
    const { A } = ctx(r);
    const tails = int(r, 3, 5); const per = int(r, 120, 240); // hundredths of a metre
    const enough = r() < 0.5;
    const total = tails * per; // hundredths
    const have = enough ? Math.ceil((total + int(r, 20, 90)) / 10) * 10 : Math.floor((total - int(r, 20, 90)) / 10) * 10;
    const number = ['', '', '', 'three', 'four', 'five'][tails];
    const haveS = trimDec(fromScaled(have, 2)); const perS = fromScaled(per, 2);
    return cell([text(`${A} has ${haveS} m of string for ${A.p} kites. ${A.S} uses ${perS} m for each kite's tail. Does ${A} have enough string for ${number} kite tails? Explain.`)],
      `${enough ? 'Yes' : 'No'}: ${tails} × ${perS} = ${trimDec(fromScaled(total, 2))} m, ${enough ? 'which is less than' : 'which is more than'} ${haveS} m.`);
  },
  decWordTimes(r) {
    const { A, B } = ctx(r);
    const times = int(r, 12, 39); const base = int(r, 8, 19); // tenths
    const food = pick(r, ['shrimp', 'grapes', 'apples', 'pasta', 'watermelon']);
    return cell([text(`${A} ate ${trimDec(fromScaled(times, 1))} times as many pounds of ${food} as ${B}. If ${B} ate ${trimDec(fromScaled(base, 1))} pounds, how many pounds of ${food} did ${A} eat?`), line()], `${trimDec(fromScaled(times * base, 2))} pounds`);
  },
  cmToM(r) {
    const { A } = ctx(r);
    const x = pick(r, [25, 50, 75]);
    const total = pick(r, [800, 1000, 1200, 1500]);
    let first = int(r, 250, 700); first = Math.round(first / 2) * 2;
    const second = total - first - 2 * x;
    if (second < 60) return skills.cmToM(r);
    return cell([text(`${A} measures 4 pieces of rope. The first piece measures ${first} cm. The second piece measures ${second} cm, and the third and fourth pieces each measure ${x} cm. How many meters of rope does ${A.s} have altogether?`)], `${total / 100} m`);
  },
  convertWord(r, p = {}) {
    const { A } = ctx(r);
    const kind = p.kind || pick(r, ['L', 'cm', 'oz', 'kg', 'm']);
    if (kind === 'L') { const n = int(r, 3, 12); return cell([text(`${A}'s fish tank holds ${n} liters of water. How many milliliters of water would that be?`), line()], `${commas(n * 1000)} milliliters`); }
    if (kind === 'cm') { const n = int(r, 3, 9) * 100; return cell([text(`${A} has ${commas(n)} centimeters of chain. How many meters of chain does ${A.s} have?`), line()], `${n / 100} meters`); }
    if (kind === 'oz') { const n = int(r, 3, 9) * 8; return cell([text(`${A} has ${n} ounces of orange juice. How many cups of orange juice does ${A.s} have?`), line()], `${n / 8} cups`); }
    if (kind === 'kg') { const n = int(r, 2, 9); return cell([text(`A bag of rice weighs ${n} kilograms. How many grams is that?`), line()], `${commas(n * 1000)} grams`); }
    const n = int(r, 3, 9); return cell([text(`${A} walked ${n} kilometers. How many meters did ${A.s} walk?`), line()], `${commas(n * 1000)} meters`);
  },
  // fractions
  fwAddLike(r) {
    const { A, B } = ctx(r);
    for (;;) {
      const d = pick(r, [4, 6, 8, 10, 12]); const n1 = int(r, 1, d - 2); const n2 = int(r, 1, d - n1 - 1);
      if (n1 + n2 >= d) continue;
      if (F.gcd(n1 + n2, d) === 1) continue;
      const task = pick(r, ['clean the room', 'finish the homework', 'walk the dog']);
      return cell([text(`If it takes ${A} `, f(n1, d), ` of an hour to ${task} and it takes ${B} `, f(n2, d), ` of an hour to ${task}, how much total time does it take ${A} and ${B} to ${task}? Reduce the fraction.`)], ans(F.frac(n1 + n2, d)));
    }
  },
  fwSubTwo(r, p = {}) {
    const { A } = ctx(r);
    const kind = p.kind || pick(r, ['book', 'fabric']);
    if (kind === 'book') {
      for (;;) {
        const d = pick(r, [8, 10, 12]); const total = int(r, Math.ceil(d * 0.6), d - 1); const n1 = int(r, 1, 4); const n2 = int(r, 1, 4);
        if (total - n1 - n2 <= 0) continue;
        return cell([text(`${A} had `, f(total, d), ` of ${A.p} book to finish reading. If ${A.s} reads `, f(n1, d), ` on Monday and `, f(n2, d), ` on Tuesday, how much of ${A.p} book does ${A.s} still have left to finish reading?`)], ans(F.frac(total - n1 - n2, d)));
      }
    }
    const d = pick(r, [8, 12, 16]); const n = int(r, 2, Math.floor(d / 2) - 1);
    return cell([text(`${A} had a yard of fabric. ${A.S} cut `, f(n, d), ` yard of fabric. Then, ${A.s} cut another `, f(n, d), ` yard from the same fabric. How much fabric did ${A.s} have left to use? *Bonus: Reduce the fraction.`)], ans(F.sub(F.frac(1, 1), F.frac(2 * n, d))));
  },
  fwAddUnlike(r) {
    const { A } = ctx(r);
    const [d1, d2] = pick(r, [[8, 3], [4, 3], [6, 4], [5, 2], [3, 5], [8, 6], [4, 5]]);
    const n1 = int(r, 1, d1 - 1); const n2 = int(r, 1, d2 - 1);
    const [x, y] = pick(r, [['flour', 'sugar'], ['milk', 'water'], ['oats', 'raisins'], ['sand', 'gravel']]);
    return cell([text(`${A}'s recipe calls for `, f(n1, d1), ` cup of ${x} and `, f(n2, d2), ` cup of ${y}. How many cups altogether?`)], ans(F.add(F.frac(n1, d1), F.frac(n2, d2))));
  },
  mwAdd(r) {
    const { A } = ctx(r);
    const w1 = int(r, 2, 9); const w2 = int(r, 2, 9); const d = pick(r, [5, 4, 3]); const n1 = int(r, 1, d - 1); const k = pick(r, [2, 2, 3]); const n2 = int(r, 1, d * k - 1);
    const sum = F.add(F.frac(w1 * d + n1, d), F.frac(w2 * d * k + n2, d * k));
    return cell([text(`${A}'s class recycled ${w1} `, f(n1, d), ` boxes of paper in a month. If they recycled another ${w2} `, f(n2, d * k), ` boxes the next month, what is the total amount they recycled? *Bonus: Reduce the fraction.`)], ans(sum));
  },
  mwSub(r, p = {}) {
    const { A, B } = ctx(r);
    const kind = p.kind || pick(r, ['time', 'apples']);
    if (kind === 'time') {
      const d = pick(r, [4, 5, 8]); const w1 = int(r, 1, 3); const w2 = w1 + int(r, 1, 2);
      const n1 = coprime(r, d); const n2 = coprime(r, d);
      const x = F.frac(w1 * d + n1, d); const y = F.frac(w2 * d + n2, d);
      if (n1 === n2) return skills.mwSub(r, p);
      return cell([text(`${A} cleans ${A.p} house in ${w1} `, f(n1, d), ` hours. ${B} cleans ${B.p} house in ${w2} `, f(n2, d), ` hours. How much longer does it take ${B} to clean ${B.p} house than ${A}?`)], ans(F.sub(y, x)));
    }
    for (;;) {
      const d = pick(r, [5, 8, 10]); const w1 = int(r, 4, 9); const n1 = int(r, 2, d - 1); const w2 = int(r, 1, w1 - 2); const n2 = int(r, 1, n1 - 1);
      return cell([text(`${A} bought a box of apples that weighed ${w1} `, f(n1, d), ` kilograms. If ${A.s} gave away ${w2} `, f(n2, d), ` kilograms of apples to ${A.p} friends, how many kilograms does ${A.s} have left?`)], ans(F.sub(F.frac(w1 * d + n1, d), F.frac(w2 * d + n2, d))));
    }
  },
  fracOfFracWord(r, p = {}) {
    const { A, B } = ctx(r);
    if ((p.kind || pick(r, ['cake', 'candy'])) === 'cake') {
      const d1 = pick(r, [2, 3, 4]); const n1 = 1; const d2 = pick(r, [3, 4, 5]);
      return cell([text(`After a party there was `, f(n1, d1), ` of a birthday cake leftover. If ${A} gave `, f(1, d2), ` of the leftover birthday cake to ${B}, what fraction of the entire birthday cake was given away?`), line()], ans(F.mul(F.frac(n1, d1), F.frac(1, d2))));
    }
    for (;;) {
      const d1 = pick(r, [6, 8, 10]); const n1 = int(r, 2, d1 - 2); const d2 = pick(r, [2, 3, 4, 5]);
      if (F.gcd(n1, d1) === 1) continue;
      return cell([text(`For a fundraiser ${A} sold `, f(n1, d1), ` of a box of candy. If ${B} sold `, f(1, d2), ` the amount ${A} sold, what fraction did ${B} sell? *Bonus: Reduce the fraction.`), line()], ans(F.mul(F.frac(n1, d1), F.frac(1, d2))));
    }
  },
  fracOfWholeWord(r) {
    for (;;) {
      const { A } = ctx(r);
      const W = int(r, 2, 6); const d = pick(r, [4, 5, 6, 8]); const n = int(r, 2, d - 1);
      const prod = F.mul(F.frac(W, 1), F.frac(n, d));
      if (prod.d === 1) continue;
      const what = pick(r, ['branch', 'rope', 'ribbon']);
      return cell([text(`A ${what} was originally ${W} feet long. ${A} cut `, f(n, d), ` of the ${what} off. How many feet did ${A.s} cut off? Write the answer as a mixed number. *Bonus: Reduce the fraction.`)], ans(prod));
    }
  },
  mixedFracWordMul(r, p = {}) {
    const { A } = ctx(r);
    const kind = p.kind || pick(r, ['boxes', 'turtles', 'bucket', 'packages', 'candy', 'rocks']);
    if (kind === 'rocks') { const w = int(r, 2, 6); const d2 = pick(r, [3, 4, 5, 6]); return cell([text(`${A} had two rocks on a scale that weighed ${w} `, f(1, 2), ` pounds together. Rock A was `, f(1, d2), ` of the total weight. How much did Rock A weigh?`)], ans(F.mul(F.frac(2 * w + 1, 2), F.frac(1, d2)))); }
    if (kind === 'boxes') { const full = int(r, 2, 4); const d = pick(r, [3, 4, 5, 8]); const n = coprime(r, d); const kg = int(r, 2, 5);
      return cell([text(`${A}'s family had ${full} full boxes of spoons and `, f(n, d), ` of a box. If each full box weighed ${kg} kilograms, what is the combined weight of the boxes ${A}'s family has?`)], ans(F.mul(F.frac(full * d + n, d), F.frac(kg, 1)))); }
    if (kind === 'turtles') { const w = int(r, 3, 9); const d = pick(r, [5, 6, 7, 8]); const n = coprime(r, d); const k = int(r, 3, 6);
      return cell([text(`An adult turtle weighed ${w} `, f(n, d), ` ounces. How much would ${k} adult turtles weigh?`)], ans(F.mul(F.frac(w * d + n, d), F.frac(k, 1)))); }
    if (kind === 'bucket') { const w = int(r, 2, 5); const d = pick(r, [4, 8]); const n = coprime(r, d); const d2 = pick(r, [3, 4, 5, 7]); const n2 = coprime(r, d2);
      return cell([text(`A full bucket of water weighed ${w} `, f(n, d), ` pounds. If the bucket were filled up only `, f(n2, d2), ` full, how much would it weigh?`)], ans(F.mul(F.frac(w * d + n, d), F.frac(n2, d2)))); }
    if (kind === 'packages') { const w = int(r, 2, 4); const d = pick(r, [4, 5]); const n = coprime(r, d); const k = int(r, 2, 6);
      return cell([text(`A package of paper weighs ${w} `, f(n, d), ` ounces. If ${A} put ${k} `, f(1, 2), ` packages of paper on a scale, how much would they weigh?`)], ans(F.mul(F.frac(w * d + n, d), F.frac(2 * k + 1, 2)))); }
    const w = int(r, 2, 3); const d = pick(r, [5, 4]); const n = coprime(r, d); const k = int(r, 2, 3); const d2 = pick(r, [3, 9]); const n2 = coprime(r, d2);
    return cell([text(`A bag of strawberry candy takes ${w} `, f(n, d), ` ounces of strawberries to make. If you have ${k} `, f(n2, d2), ` bags, how many ounces of strawberries did it take to make them? *Bonus: Reduce the fraction.`)], ans(F.mul(F.frac(w * d + n, d), F.frac(k * d2 + n2, d2))));
  },
  fracDivWordMixed(r) {
    const { A } = ctx(r);
    for (;;) {
      const k = int(r, 4, 9); const T = int(r, 20, 99);
      if (T % k === 0) continue;
      const kind = pick(r, ['apples', 'chips', 'cakes']);
      const res = ans(F.frac(T, k));
      if (kind === 'apples') return cell([text(`If ${k} people want to share ${T} apples equally, how many apples can each person get? Write the answer as a mixed number.`)], res);
      if (kind === 'chips') return cell([text(`If ${k} people want to share ${T} bags of chips equally, how many bags can each person get? Write the answer as a mixed number.`)], res);
      return cell([text(`${A} had ${T} snack cakes. If the snack cakes were split into ${k} different groups, how many cakes were in each group? Write the answer as a mixed number.`)], res);
    }
  },
  divBetween(r) {
    for (;;) {
      const { A } = ctx(r);
      const k = int(r, 3, 9); const T = int(r, 3 * k + 1, Math.min(99, k * 14));
      if (T % k === 0) continue;
      const lo = Math.floor(T / k);
      const kind = pick(r, ['paper', 'wood', 'candy', 'flour', 'peanuts']);
      const res = `${ans(F.frac(T, k))}, between ${lo} and ${lo + 1}`;
      const tail = ' Between what two whole numbers does your answer lie?';
      if (kind === 'paper') return cell([text(`A teacher had ${T} packages of paper. ${A.S} wanted to split them equally into ${k} piles. How much should be in each pile?${tail}`)], res);
      if (kind === 'wood') return cell([text(`${A} had ${T} feet of wood. If ${A.s} wanted to use the wood to make ${k} picture frames, each using the same amount of wood, how much wood could be used for each frame?${tail}`)], res);
      if (kind === 'candy') return cell([text(`${A} had ${T} candy bars. If ${A.s} splits the candy bars evenly among ${k} friends, how many candy bars would each friend get?${tail}`)], res);
      if (kind === 'flour') return cell([text(`${A} had ${T} pounds of flour. If ${A.s} split the flour evenly among ${k} batches of chicken, how much flour would each batch use?${tail}`)], res);
      return cell([text(`${A} had ${T} pounds of peanuts. If ${A.s} wanted to split the peanuts equally among ${A.self} and ${k - 1} friends, how much would each person get?${tail}`)], res);
    }
  },
  unitFracDivWord(r, p = {}) {
    const { A } = ctx(r);
    const kind = p.kind || pick(r, ['cereal', 'cups', 'bag', 'dip']);
    if (kind === 'cups') { const k = pick(r, [5, 6, 7, 8]); const T = int(r, 2, 6); const res = F.frac(T, k);
      return cell([text(`${A} has ${T} cups of chocolate chips and plans to divide this amount into equal parts to make ${k} batches of chocolate chip cookies. What fraction of a cup of chocolate chips will be used for each batch? *Bonus: Reduce the fraction.`), line()], ans(res)); }
    const d = pick(r, [3, 4, 5, 6]); const k = int(r, 3, 7);
    const res = ans(F.frac(1, d * k));
    if (kind === 'cereal') return cell([text(`${A}'s family has ${k} members. If they only had one-${['', '', 'half', 'third', 'fourth', 'fifth', 'sixth'][d]} of a box of cereal and each person got the same amount, what fraction of the box would each person get?`), line()], res);
    if (kind === 'bag') return cell([text(`${A} used one-${['', '', 'half', 'third', 'fourth', 'fifth', 'sixth'][d]} of a bag of peanuts to make ${k} batches of cookies. How much of the bag did ${A.s} use for each batch?`), line()], res);
    return cell([text(`At a restaurant ${k} people were at a table when the waiter brought out one-${['', '', 'half', 'third', 'fourth', 'fifth', 'sixth'][d]} of a bowl of cheese dip. If they split the bowl evenly, how much would each person get?`), line()], res);
  },
  servingsWord(r) {
    const d = pick(r, [2, 3, 4, 8]); const cups = int(r, 2, 8);
    const name = { 2: 'one-half', 3: 'one-third', 4: 'one-fourth', 8: 'one-eighth' }[d];
    const what = pick(r, ['sugar', 'rice', 'flour', 'juice']);
    return cell([text(`How many ${name} cup servings are in ${cups} cups of ${what}?`), line()], String(cups * d));
  },
  servingsDaysWord(r) {
    const { A } = ctx(r);
    const d = pick(r, [3, 4, 6, 8]); const k = int(r, 3, 7);
    const name = { 3: 'one-third', 4: 'one-fourth', 6: 'one-sixth', 8: 'one-eighth' }[d];
    const what = pick(r, [['bag of chips', 'bags', 'school lunches'], ['box of ice cream sandwiches', 'boxes', 'snack time'], ['loaf of bread', 'loaves', 'sandwiches']]);
    return cell([text(`${A}'s family uses ${name} of a ${what[0]} for ${what[2]} every day. How many days would ${k} whole ${what[1]} last them?`), line()], String(k * d));
  },
};

module.exports = { skills };
