'use strict';

// Word-problem skills for the Spiral Review sheets. Names come from the same cast as every other worksheet.
// Each skill keeps a bank of different stories (and sometimes different sentence shapes), so two sheets for the same
// practice number rarely read alike. Every cell also carries `meta` (the numbers behind the story) so tests can
// re-derive the answer from the quantities and confirm each one is printed in the text.
const C = require('./core');
const { ctx } = require('../wordProblems');
const { f, mx, text, line, cell, F, int, pick, shuffle, fromScaled, trimDec } = C;

const commas = (n) => Number(n).toLocaleString('en-US');
const money = (cents) => `$${(cents / 100).toFixed(2)}`;
const ans = (v) => F.show(v);
const coprime = (r, d) => { for (let i = 0; i < 50; i++) { const n = int(r, 1, d - 1); if (F.gcd(n, d) === 1) return n; } return 1; };
const ITEMS = ['a book', 'a computer game', 'a pair of shoes', 'a backpack', 'a board game', 'a jacket', 'a puzzle', 'a soccer ball', 'a skateboard helmet', 'a water bottle', 'a set of markers', 'a basketball', 'a kite', 'a sweatshirt'];
const NUM_WORD = { 2: 'two', 3: 'three', 4: 'four', 5: 'five', 6: 'six', 7: 'seven', 8: 'eight', 9: 'nine' };
const UNIT = { 2: 'half', 3: 'third', 4: 'fourth', 5: 'fifth', 6: 'sixth', 8: 'eighth' };

const skills = {
  // ---------------- money ----------------
  moneyDiff(r) {
    const { A, B } = ctx(r);
    const [x, y] = shuffle(r, ITEMS);
    const lo = int(r, 500, 1500); const hi = lo + int(r, 100, 900);
    const shape = pick(r, [1, 2, 3]);
    const meta = { hi, lo };
    if (shape === 1) { const cheaper = int(r, 0, 1); const loName = cheaper ? A : B; const hiName = cheaper ? B : A;
      return cell([text(`${loName} buys ${x} for ${money(lo)}. ${hiName} buys ${y} for ${money(hi)}. How much more money does ${hiName} spend than ${loName}?`), line()], money(hi - lo), meta); }
    if (shape === 2) return cell([text(`${x.replace(/^an? /, 'The ')} that ${A} wants costs ${money(hi)} at one store and ${money(lo)} at another store. How much money would ${A} save by buying it at the cheaper store?`), line()], money(hi - lo), meta);
    return cell([text(`${A} wants to buy ${x} that costs ${money(hi)}. ${A.S} has saved ${money(lo)}. How much more money does ${A} need?`), line()], money(hi - lo), meta);
  },
  moneyChange(r) {
    const { A } = ctx(r);
    const shape = pick(r, [1, 2, 3]);
    if (shape === 2) { const bill = pick(r, [20, 50, 100]); const cost = int(r, bill * 100 * 0.3, bill * 100 - 100);
      const [x, y] = [pick(r, ['a toy', 'a hat', 'a book', 'a lunch', 'a game', 'a poster'])];
      void y;
      return cell([text(`${A} buys ${x} that costs ${money(cost)} and pays with a $${bill} bill. How much change does ${A.s} get back?`), line()], money(bill * 100 - cost), { have: bill * 100, spend: [cost] }); }
    const have = pick(r, [4000, 5000, 6000, 10000]);
    const a = int(r, 900, 2400); const b = int(r, 300, 900);
    if (shape === 3) { const [i1, i2] = pick(r, [['a skateboard wheel set', 'a sticker pack'], ['a video game', 'a case'], ['two movie tickets', 'a snack'], ['a pair of jeans', 'a belt']]);
      return cell([text(`${A} earned ${money(have)} doing yard work. ${A.S} spent ${money(a)} on ${i1} and ${money(b)} on ${i2}. How much of the money is left?`), line()], money(have - a - b), { have, spend: [a, b] }); }
    const [i1, i2] = pick(r, [['a computer game', 'a hat'], ['a jacket', 'a pair of gloves'], ['a game', 'a snack'], ['a book', 'a bookmark'], ['a toy robot', 'batteries'], ['a backpack', 'a lunch box']]);
    return cell([text(`${A} has ${money(have)} and buys ${i1} for ${money(a)} and ${i2} for ${money(b)}. How much money does ${A.s} have left?`), line()], money(have - a - b), { have, spend: [a, b] });
  },
  moneyThree(r) {
    const { A } = ctx(r);
    const a = int(r, 600, 1400); const b = int(r, 300, 900); const c = int(r, 200, 700);
    const [i1, i2, i3] = pick(r, [['a movie ticket', 'popcorn', 'a drink'], ['a sandwich', 'a bag of chips', 'a juice box'], ['a notebook', 'a pack of pencils', 'an eraser'], ['a collar', 'a chew toy', 'a bag of treats'], ['a zoo ticket', 'a snack', 'a souvenir'], ['a slice of pizza', 'a salad', 'lemonade']]);
    const verb = pick(r, ['spent', 'paid']);
    const where = i1 === 'a movie ticket' ? '' : '';
    return cell([text(`${A} ${verb} ${money(a)} for ${i1}, ${money(b)} for ${i2}, and ${money(c)} for ${i3}${where}. How much did ${A.s} spend in all?`), line()], money(a + b + c), { nums: [a, b, c] });
  },
  moneyBeforeTax(r, p = {}) {
    const { A } = ctx(r);
    const price = int(r, 2500, 6500); const tax = Math.round(price * 0.07);
    const x = pick(r, ['a pair of shoes', 'a jacket', 'a backpack', 'a pair of headphones', 'a board game']);
    if (p.total) return cell([text(`${A} bought ${x} for ${money(price)}. The sales tax was ${money(tax)}. How much money did ${A} spend in all?`), line()], money(price + tax), { price, tax, total: true });
    return cell([text(`${A} bought ${x} for ${money(price)}. The sales tax was ${money(tax)}. How much money did ${A} spend on ${x} before taxes?`), line()], `${money(price)} (the tax is extra information)`, { price, tax, total: false });
  },
  decWordMulCompare(r) {
    const { A } = ctx(r);
    const tails = int(r, 3, 5); const per = int(r, 120, 240); // hundredths of a metre
    const enough = r() < 0.5;
    const total = tails * per;
    const have = enough ? Math.ceil((total + int(r, 20, 90)) / 10) * 10 : Math.floor((total - int(r, 20, 90)) / 10) * 10;
    const number = NUM_WORD[tails];
    const haveS = trimDec(fromScaled(have, 2)); const perS = fromScaled(per, 2);
    const ctxt = pick(r, [
      `${A} has ${haveS} m of string for ${A.p} kites. ${A.S} uses ${perS} m for each kite's tail. Does ${A} have enough string for ${number} kite tails? Explain.`,
      `${A} has ${haveS} m of ribbon for a craft project. Each bow takes ${perS} m of ribbon. Does ${A} have enough ribbon for ${number} bows? Explain.`,
      `${A} bought ${haveS} m of wood trim. Each picture frame needs ${perS} m of trim. Does ${A} have enough trim for ${number} picture frames? Explain.`,
    ]);
    return cell([text(ctxt)], `${enough ? 'Yes' : 'No'}: ${tails} × ${perS} = ${trimDec(fromScaled(total, 2))} m, ${enough ? 'which is less than' : 'which is more than'} ${haveS} m.`, { have, per, tails, enough });
  },
  decWordTimes(r) {
    const { A, B } = ctx(r);
    const times = int(r, 12, 39); const base = int(r, 8, 19); // tenths
    const t = trimDec(fromScaled(times, 1)); const b = trimDec(fromScaled(base, 1));
    const shape = pick(r, [1, 2, 3]);
    let txt; let unit;
    if (shape === 1) { const food = pick(r, ['shrimp', 'grapes', 'apples', 'pasta', 'watermelon']); unit = 'pounds'; txt = `${A} ate ${t} times as many pounds of ${food} as ${B}. If ${B} ate ${b} pounds, how many pounds of ${food} did ${A} eat?`; } else if (shape === 2) { unit = 'kilograms'; txt = `A large pumpkin weighs ${t} times as much as a small pumpkin. The small pumpkin weighs ${b} kilograms. How many kilograms does the large pumpkin weigh?`; } else { unit = 'miles'; txt = `${A} ran ${t} times as far as ${B} did this week. ${B} ran ${b} miles. How many miles did ${A} run?`; }
    return cell([text(txt), line()], `${trimDec(fromScaled(times * base, 2))} ${unit}`, { times, base });
  },
  cmToM(r) {
    const { A } = ctx(r);
    const x = pick(r, [25, 50, 75]);
    const total = pick(r, [800, 1000, 1200, 1500]);
    let first = int(r, 250, 700); first = Math.round(first / 2) * 2;
    const second = total - first - 2 * x;
    if (second < 60) return skills.cmToM(r);
    const what = pick(r, [['rope', 'rope'], ['ribbon', 'ribbon'], ['wire', 'wire'], ['yarn', 'yarn'], ['string', 'string'], ['tape', 'tape'], ['chain', 'chain']]);
    return cell([text(`${A} measures 4 pieces of ${what[0]}. The first piece measures ${first} cm. The second piece measures ${second} cm, and the third and fourth pieces each measure ${x} cm. How many meters of ${what[1]} does ${A.s} have altogether?`)], `${total / 100} m`, { first, second, x, total });
  },
  convertWord(r, p = {}) {
    const { A } = ctx(r);
    const kind = p.kind || pick(r, ['L', 'cm', 'oz', 'kg', 'm']);
    if (kind === 'L') { const n = int(r, 3, 12); return cell([text(pick(r, [`${A}'s fish tank holds ${n} liters of water. How many milliliters of water would that be?`, `A water jug holds ${n} liters. How many milliliters is that?`, `${A} drank ${n} liters of water over the weekend. How many milliliters did ${A.s} drink?`])), line()], `${commas(n * 1000)} milliliters`, { n, mult: 1000, unit: 'milliliters' }); }
    if (kind === 'cm') { const n = int(r, 3, 9) * 100; return cell([text(pick(r, [`${A} has ${commas(n)} centimeters of chain. How many meters of chain does ${A.s} have?`, `A hallway is ${commas(n)} centimeters long. How many meters long is the hallway?`])), line()], `${n / 100} meters`, { n, mult: 0.01, unit: 'meters' }); }
    if (kind === 'oz') { const n = int(r, 3, 9) * 8; return cell([text(pick(r, [`${A} has ${n} ounces of orange juice. How many cups of orange juice does ${A.s} have?`, `A recipe needs ${n} fluid ounces of milk. How many cups of milk is that?`])), line()], `${n / 8} cups`, { n, mult: 0.125, unit: 'cups' }); }
    if (kind === 'kg') { const n = int(r, 2, 9); return cell([text(pick(r, [`A bag of rice weighs ${n} kilograms. How many grams is that?`, `${A}'s backpack weighs ${n} kilograms. How many grams does it weigh?`])), line()], `${commas(n * 1000)} grams`, { n, mult: 1000, unit: 'grams' }); }
    const n = int(r, 3, 9); return cell([text(pick(r, [`${A} walked ${n} kilometers. How many meters did ${A.s} walk?`, `A bike trail is ${n} kilometers long. How many meters long is the trail?`])), line()], `${commas(n * 1000)} meters`, { n, mult: 1000, unit: 'meters' });
  },

  // ---------------- fractions ----------------
  fwAddLike(r) {
    const { A, B } = ctx(r);
    for (;;) {
      const d = pick(r, [4, 6, 8, 10, 12]); const n1 = int(r, 1, d - 2); const n2 = int(r, 1, d - n1 - 1);
      if (n1 + n2 >= d) continue;
      if (F.gcd(n1 + n2, d) === 1) continue;
      const shape = pick(r, [1, 2]);
      if (shape === 2) { const [x, y] = pick(r, [['math', 'reading'], ['science', 'spelling'], ['piano', 'drawing']]);
        return cell([text(`${A} spent `, f(n1, d), ` of an hour on ${x} homework and `, f(n2, d), ` of an hour on ${y} homework. How much total time did ${A} spend on homework? Reduce the fraction.`)], ans(F.frac(n1 + n2, d)), { n1, n2, d }); }
      const task = pick(r, ['clean the room', 'finish the homework', 'walk the dog', 'wash the car', 'set the table', 'pack a lunch', 'rake the leaves']);
      return cell([text(`If it takes ${A} `, f(n1, d), ` of an hour to ${task} and it takes ${B} `, f(n2, d), ` of an hour to ${task}, how much total time does it take ${A} and ${B} to ${task}? Reduce the fraction.`)], ans(F.frac(n1 + n2, d)), { n1, n2, d });
    }
  },
  fwSubTwo(r, p = {}) {
    const { A } = ctx(r);
    const kind = p.kind || pick(r, ['book', 'fabric']);
    if (kind === 'book') {
      for (;;) {
        const d = pick(r, [8, 10, 12]); const total = int(r, Math.ceil(d * 0.6), d - 1); const n1 = int(r, 1, 4); const n2 = int(r, 1, 4);
        if (total - n1 - n2 <= 0) continue;
        const meta = { total, n1, n2, d };
        const shape = pick(r, [1, 2, 3]);
        if (shape === 2) return cell([text(`${A} had `, f(total, d), ` of a pizza left. ${A.S} ate `, f(n1, d), ` of the pizza for lunch and `, f(n2, d), ` of the pizza for a snack. How much of the pizza is left?`)], ans(F.frac(total - n1 - n2, d)), meta);
        if (shape === 3) return cell([text(`A jug was `, f(total, d), ` full of juice. ${A} poured out `, f(n1, d), ` of the jug for breakfast and `, f(n2, d), ` of the jug for lunch. How much of the jug is still full?`)], ans(F.frac(total - n1 - n2, d)), meta);
        return cell([text(`${A} had `, f(total, d), ` of ${A.p} book to finish reading. If ${A.s} reads `, f(n1, d), ` on Monday and `, f(n2, d), ` on Tuesday, how much of ${A.p} book does ${A.s} still have left to finish reading?`)], ans(F.frac(total - n1 - n2, d)), meta);
      }
    }
    const d = pick(r, [8, 12, 16]); const n = int(r, 2, Math.floor(d / 2) - 1);
    const what = pick(r, [['a yard of fabric', 'fabric', 'yard'], ['a yard of ribbon', 'ribbon', 'yard'], ['a yard of rope', 'rope', 'yard']]);
    return cell([text(`${A} had ${what[0]}. ${A.S} cut `, f(n, d), ` yard of ${what[1]}. Then, ${A.s} cut another `, f(n, d), ` yard from the same ${what[1]}. How much ${what[1]} did ${A.s} have left to use? *Bonus: Reduce the fraction.`)], ans(F.sub(F.frac(1, 1), F.frac(2 * n, d))), { n, d });
  },
  fwAddUnlike(r) {
    const { A } = ctx(r);
    const [d1, d2] = pick(r, [[8, 3], [4, 3], [6, 4], [5, 2], [3, 5], [8, 6], [4, 5], [5, 3], [3, 4]]);
    const n1 = int(r, 1, d1 - 1); const n2 = int(r, 1, d2 - 1);
    const meta = { n1, d1, n2, d2 };
    if (r() < 0.35) { const [x, y] = pick(r, [['school', 'the park'], ['the library', 'a friend\'s house'], ['the store', 'the bus stop']]);
      return cell([text(`${A} walked `, f(n1, d1), ` mile to ${x} and then `, f(n2, d2), ` mile to ${y}. How many miles did ${A} walk altogether?`)], ans(F.add(F.frac(n1, d1), F.frac(n2, d2))), meta); }
    const [x, y] = pick(r, [['flour', 'sugar'], ['milk', 'water'], ['oats', 'raisins'], ['sand', 'gravel'], ['rice', 'beans'], ['butter', 'honey'], ['paint', 'water']]);
    return cell([text(`${A}'s recipe calls for `, f(n1, d1), ` cup of ${x} and `, f(n2, d2), ` cup of ${y}. How many cups altogether?`)], ans(F.add(F.frac(n1, d1), F.frac(n2, d2))), meta);
  },
  mwAdd(r) {
    const { A } = ctx(r);
    const w1 = int(r, 2, 9); const w2 = int(r, 2, 9); const d = pick(r, [5, 4, 3]); const n1 = int(r, 1, d - 1); const k = pick(r, [2, 2, 3]); const n2 = int(r, 1, d * k - 1);
    const sum = F.add(F.frac(w1 * d + n1, d), F.frac(w2 * d * k + n2, d * k));
    const meta = { w1, n1, d, w2, n2, d2: d * k };
    if (r() < 0.5) return cell([text(`${A}'s class recycled ${w1} `, f(n1, d), ` boxes of paper in a month. If they recycled another ${w2} `, f(n2, d * k), ` boxes the next month, what is the total amount they recycled? *Bonus: Reduce the fraction.`)], ans(sum), meta);
    const shape = pick(r, [1, 2, 3]);
    if (shape === 2) return cell([text(`${A} biked ${w1} `, f(n1, d), ` miles on Saturday. On Sunday ${A.s} biked ${w2} `, f(n2, d * k), ` miles. How many miles did ${A.s} bike in all? *Bonus: Reduce the fraction.`)], ans(sum), meta);
    if (shape === 3) return cell([text(`${A} worked ${w1} `, f(n1, d), ` hours at the animal shelter in the morning and ${w2} `, f(n2, d * k), ` hours in the afternoon. How many hours did ${A.s} work in all? *Bonus: Reduce the fraction.`)], ans(sum), meta);
    return cell([text(`${A}'s team collected ${w1} `, f(n1, d), ` pounds of cans on Saturday. On Sunday the team collected ${w2} `, f(n2, d * k), ` pounds of cans. How many pounds of cans did the team collect in all? *Bonus: Reduce the fraction.`)], ans(sum), meta);
  },
  mwSub(r, p = {}) {
    const { A, B } = ctx(r);
    const kind = p.kind || pick(r, ['time', 'apples']);
    if (kind === 'time') {
      for (;;) {
        const d = pick(r, [4, 5, 8]); const w1 = int(r, 1, 3); const w2 = w1 + int(r, 1, 2);
        const n1 = coprime(r, d); const n2 = coprime(r, d);
        if (n1 === n2) continue;
        const x = F.frac(w1 * d + n1, d); const y = F.frac(w2 * d + n2, d);
        const meta = { w1, n1, w2, n2, d, op: 'time' };
        if (r() < 0.5) return cell([text(`${A} cleans ${A.p} house in ${w1} `, f(n1, d), ` hours. ${B} cleans ${B.p} house in ${w2} `, f(n2, d), ` hours. How much longer does it take ${B} to clean ${B.p} house than ${A}?`)], ans(F.sub(y, x)), meta);
        return cell([text(`${A} finished a puzzle in ${w1} `, f(n1, d), ` hours. ${B} finished the same puzzle in ${w2} `, f(n2, d), ` hours. How much longer did ${B} take than ${A}?`)], ans(F.sub(y, x)), meta);
      }
    }
    const d = pick(r, [5, 8, 10]); const w1 = int(r, 4, 9); const n1 = int(r, 2, d - 1); const w2 = int(r, 1, w1 - 2); const n2 = int(r, 1, n1 - 1);
    const meta = { w1, n1, w2, n2, d, op: 'apples' };
    if (r() < 0.5) return cell([text(`${A} bought a box of apples that weighed ${w1} `, f(n1, d), ` kilograms. If ${A.s} gave away ${w2} `, f(n2, d), ` kilograms of apples to ${A.p} friends, how many kilograms does ${A.s} have left?`)], ans(F.sub(F.frac(w1 * d + n1, d), F.frac(w2 * d + n2, d))), meta);
    return cell([text(`${A} had a bag of potatoes that weighed ${w1} `, f(n1, d), ` pounds. ${A.S} used ${w2} `, f(n2, d), ` pounds to make soup. How many pounds of potatoes are left?`)], ans(F.sub(F.frac(w1 * d + n1, d), F.frac(w2 * d + n2, d))), meta);
  },
  fracOfFracWord(r, p = {}) {
    const { A, B } = ctx(r);
    if ((p.kind || pick(r, ['cake', 'candy'])) === 'cake') {
      const d1 = pick(r, [2, 3, 4]); const n1 = 1; const d2 = pick(r, [3, 4, 5]);
      const what = pick(r, ['birthday cake', 'pizza', 'pan of lasagna', 'watermelon']);
      return cell([text(`After a party there was `, f(n1, d1), ` of a ${what} leftover. If ${A} gave `, f(1, d2), ` of the leftover ${what} to ${B}, what fraction of the entire ${what} was given away?`), line()], ans(F.mul(F.frac(n1, d1), F.frac(1, d2))), { n1, d1, d2 });
    }
    for (;;) {
      const d1 = pick(r, [6, 8, 10]); const n1 = int(r, 2, d1 - 2); const d2 = pick(r, [2, 3, 4, 5]);
      if (F.gcd(n1, d1) === 1) continue;
      const what = pick(r, ['a box of candy', 'a tray of cookies', 'a case of juice']);
      return cell([text(`For a fundraiser ${A} sold `, f(n1, d1), ` of ${what}. If ${B} sold `, f(1, d2), ` the amount ${A} sold, what fraction did ${B} sell? *Bonus: Reduce the fraction.`), line()], ans(F.mul(F.frac(n1, d1), F.frac(1, d2))), { n1, d1, d2 });
    }
  },
  fracOfWholeWord(r) {
    for (;;) {
      const { A } = ctx(r);
      const W = int(r, 2, 6); const d = pick(r, [4, 5, 6, 8]); const n = int(r, 2, d - 1);
      const prod = F.mul(F.frac(W, 1), F.frac(n, d));
      if (prod.d === 1) continue;
      const what = pick(r, ['branch', 'rope', 'ribbon', 'board', 'pipe']);
      return cell([text(`A ${what} was originally ${W} feet long. ${A} cut `, f(n, d), ` of the ${what} off. How many feet did ${A.s} cut off? Write the answer as a mixed number. *Bonus: Reduce the fraction.`)], ans(prod), { W, n, d });
    }
  },
  mixedFracWordMul(r, p = {}) {
    const { A } = ctx(r);
    const kind = p.kind || pick(r, ['boxes', 'turtles', 'bucket', 'packages', 'candy', 'rocks', 'garden', 'paint']);
    const done = (blocks, a, b, extra = {}) => cell(blocks, ans(F.mul(a, b)), { a, b, ...extra });
    if (kind === 'rocks') { const w = int(r, 2, 6); const d2 = pick(r, [3, 4, 5, 6]); return done([text(`${A} had two rocks on a scale that weighed ${w} `, f(1, 2), ` pounds together. Rock A was `, f(1, d2), ` of the total weight. How much did Rock A weigh?`)], F.frac(2 * w + 1, 2), F.frac(1, d2)); }
    if (kind === 'boxes') { const full = int(r, 2, 4); const d = pick(r, [3, 4, 5, 8]); const n = coprime(r, d); const kg = int(r, 2, 5);
      return done([text(`${A}'s family had ${full} full boxes of spoons and `, f(n, d), ` of a box. If each full box weighed ${kg} kilograms, what is the combined weight of the boxes ${A}'s family has?`)], F.frac(full * d + n, d), F.frac(kg, 1)); }
    if (kind === 'turtles') { const w = int(r, 3, 9); const d = pick(r, [5, 6, 7, 8]); const n = coprime(r, d); const k = int(r, 3, 6);
      return done([text(`An adult turtle weighed ${w} `, f(n, d), ` ounces. How much would ${k} adult turtles weigh?`)], F.frac(w * d + n, d), F.frac(k, 1), { w, n, d, k }); }
    if (kind === 'bucket') { const w = int(r, 2, 5); const d = pick(r, [4, 8]); const n = coprime(r, d); const d2 = pick(r, [3, 4, 5, 7]); const n2 = coprime(r, d2);
      return done([text(`A full bucket of water weighed ${w} `, f(n, d), ` pounds. If the bucket were filled up only `, f(n2, d2), ` full, how much would it weigh?`)], F.frac(w * d + n, d), F.frac(n2, d2)); }
    if (kind === 'packages') { const w = int(r, 2, 4); const d = pick(r, [4, 5]); const n = coprime(r, d); const k = int(r, 2, 6);
      return done([text(`A package of paper weighs ${w} `, f(n, d), ` ounces. If ${A} put ${k} `, f(1, 2), ` packages of paper on a scale, how much would they weigh?`)], F.frac(w * d + n, d), F.frac(2 * k + 1, 2)); }
    if (kind === 'garden') { const w = int(r, 2, 5); const d = pick(r, [3, 4, 5, 8]); const n = coprime(r, d); const k = int(r, 3, 7);
      return done([text(`${A} watered the garden with ${w} `, f(n, d), ` gallons of water each day. How many gallons of water did ${A.s} use in ${k} days?`)], F.frac(w * d + n, d), F.frac(k, 1)); }
    if (kind === 'paint') { const w = int(r, 2, 6); const d = pick(r, [2, 4]); const n = d === 2 ? 1 : pick(r, [1, 3]); const d2 = pick(r, [3, 4, 5]); const n2 = coprime(r, d2);
      return done([text(`${A} used `, f(n2, d2), ` of a can that held ${w} `, f(n, d), ` liters of paint. How many liters of paint did ${A.s} use?`)], F.frac(w * d + n, d), F.frac(n2, d2)); }
    const w = int(r, 2, 3); const d = pick(r, [5, 4]); const n = coprime(r, d); const k = int(r, 2, 3); const d2 = pick(r, [3, 9]); const n2 = coprime(r, d2);
    return done([text(`A bag of strawberry candy takes ${w} `, f(n, d), ` ounces of strawberries to make. If you have ${k} `, f(n2, d2), ` bags, how many ounces of strawberries did it take to make them? *Bonus: Reduce the fraction.`)], F.frac(w * d + n, d), F.frac(k * d2 + n2, d2));
  },
  fracDivWordMixed(r) {
    const { A } = ctx(r);
    for (;;) {
      const k = int(r, 4, 9); const T = int(r, 20, 99);
      if (T % k === 0) continue;
      const res = ans(F.frac(T, k)); const meta = { T, k };
      const kind = pick(r, ['apples', 'chips', 'cakes', 'pencils', 'pizza']);
      if (kind === 'apples') return cell([text(`If ${k} people want to share ${T} apples equally, how many apples can each person get? Write the answer as a mixed number.`)], res, meta);
      if (kind === 'chips') return cell([text(`If ${k} people want to share ${T} bags of chips equally, how many bags can each person get? Write the answer as a mixed number.`)], res, meta);
      if (kind === 'pencils') return cell([text(`A teacher shares ${T} pencils equally among ${k} students. How many pencils does each student get? Write the answer as a mixed number.`)], res, meta);
      if (kind === 'pizza') return cell([text(`${A} and ${k - 1} friends share ${T} slices of pizza equally. How many slices does each person get? Write the answer as a mixed number.`)], res, meta);
      return cell([text(`${A} had ${T} snack cakes. If the snack cakes were split into ${k} different groups, how many cakes were in each group? Write the answer as a mixed number.`)], res, meta);
    }
  },
  divBetween(r) {
    for (;;) {
      const { A } = ctx(r);
      const k = int(r, 3, 9); const T = int(r, 3 * k + 1, Math.min(99, k * 14));
      if (T % k === 0) continue;
      const lo = Math.floor(T / k);
      const kind = pick(r, ['paper', 'wood', 'candy', 'flour', 'peanuts', 'rope', 'water']);
      const res = `${ans(F.frac(T, k))}, between ${lo} and ${lo + 1}`;
      const tail = ' Between what two whole numbers does your answer lie?';
      const meta = { T, k };
      if (kind === 'paper') return cell([text(`A teacher had ${T} packages of paper. ${A.S} wanted to split them equally into ${k} piles. How much should be in each pile?${tail}`)], res, meta);
      if (kind === 'wood') return cell([text(`${A} had ${T} feet of wood. If ${A.s} wanted to use the wood to make ${k} picture frames, each using the same amount of wood, how much wood could be used for each frame?${tail}`)], res, meta);
      if (kind === 'candy') return cell([text(`${A} had ${T} candy bars. If ${A.s} splits the candy bars evenly among ${k} friends, how many candy bars would each friend get?${tail}`)], res, meta);
      if (kind === 'flour') return cell([text(`${A} had ${T} pounds of flour. If ${A.s} split the flour evenly among ${k} batches of chicken, how much flour would each batch use?${tail}`)], res, meta);
      if (kind === 'rope') return cell([text(`${A} cut a ${T}-foot rope into ${k} equal pieces for a obstacle course. How long is each piece?${tail}`.replace('a obstacle', 'an obstacle'))], res, meta);
      if (kind === 'water') return cell([text(`${A} poured ${T} liters of water equally into ${k} buckets. How much water is in each bucket?${tail}`)], res, meta);
      return cell([text(`${A} had ${T} pounds of peanuts. If ${A.s} wanted to split the peanuts equally among ${A.self} and ${k - 1} friends, how much would each person get?${tail}`)], res, meta);
    }
  },
  unitFracDivWord(r, p = {}) {
    const { A } = ctx(r);
    const kind = p.kind || pick(r, ['cereal', 'cups', 'bag', 'dip']);
    if (kind === 'cups') { const k = pick(r, [5, 6, 7, 8]); const T = int(r, 2, 6); const res = F.frac(T, k);
      return cell([text(pick(r, [`${A} has ${T} cups of chocolate chips and plans to divide this amount into equal parts to make ${k} batches of chocolate chip cookies. What fraction of a cup of chocolate chips will be used for each batch? *Bonus: Reduce the fraction.`, `${A} has ${T} cups of rice and plans to divide it equally into ${k} bowls. What fraction of a cup of rice will go in each bowl? *Bonus: Reduce the fraction.`])), line()], ans(res), { T, k }); }
    const d = pick(r, [3, 4, 5, 6]); const k = int(r, 3, 7);
    const res = ans(F.frac(1, d * k)); const w = UNIT[d]; const meta = { d, k };
    if (kind === 'cereal') return cell([text(pick(r, [`${A}'s family has ${k} members. If they only had one-${w} of a box of cereal and each person got the same amount, what fraction of the box would each person get?`, `${k} friends share one-${w} of a pizza equally. What fraction of the whole pizza does each friend get?`])), line()], res, meta);
    if (kind === 'bag') return cell([text(pick(r, [`${A} used one-${w} of a bag of peanuts to make ${k} batches of cookies. How much of the bag did ${A.s} use for each batch?`, `${A} used one-${w} of a tank of gas to drive ${k} equal trips. How much of the tank did each trip use?`])), line()], res, meta);
    return cell([text(pick(r, [`At a restaurant ${k} people were at a table when the waiter brought out one-${w} of a bowl of cheese dip. If they split the bowl evenly, how much would each person get?`, `${A} had one-${w} of a pan of brownies left and shared it equally with ${k - 1} friends. What fraction of the whole pan did each person get?`])), line()], res, meta);
  },
  servingsWord(r) {
    const d = pick(r, [2, 3, 4, 8]); const cups = int(r, 2, 8);
    const name = { 2: 'one-half', 3: 'one-third', 4: 'one-fourth', 8: 'one-eighth' }[d];
    const what = pick(r, ['sugar', 'rice', 'flour', 'juice', 'oats', 'milk']);
    return cell([text(pick(r, [`How many ${name} cup servings are in ${cups} cups of ${what}?`, `A bag holds ${cups} cups of ${what}. How many ${name} cup servings can be made from the bag?`])), line()], String(cups * d), { d, cups });
  },
  servingsDaysWord(r) {
    const { A } = ctx(r);
    const d = pick(r, [3, 4, 6, 8]); const k = int(r, 3, 7);
    const name = { 3: 'one-third', 4: 'one-fourth', 6: 'one-sixth', 8: 'one-eighth' }[d];
    const what = pick(r, [['bag of chips', 'bags', 'school lunches'], ['box of ice cream sandwiches', 'boxes', 'snack time'], ['loaf of bread', 'loaves', 'sandwiches'], ['carton of eggs', 'cartons', 'breakfast'], ['box of cereal', 'boxes', 'breakfast']]);
    return cell([text(`${A}'s family uses ${name} of a ${what[0]} for ${what[2]} every day. How many days would ${k} whole ${what[1]} last them?`), line()], String(k * d), { d, k });
  },
};

module.exports = { skills };
