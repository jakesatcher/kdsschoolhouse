'use strict';
const test = require('node:test');
const assert = require('node:assert');
const { makeRng } = require('../src/lib/generators/rng');
const { decimals } = require('../src/lib/generators/decimals');
const { fractionProblems, text } = require('../src/lib/generators/fractionProblems');
const F = require('../src/lib/generators/fractions');
const sheets = require('../src/lib/sheets');

const num = (s) => Number(String(s).replace(/,/g, ''));
const places = (s) => (String(s).split('.')[1] || '').length;
const near = (a, b) => Math.abs(a - b) < 1e-9 * Math.max(1, Math.abs(b));

test('decimals: every answer is exact and no place exceeds thousandths', () => {
  for (const op of ['add', 'sub', 'mul', 'div']) {
    for (const pl of ['1', '2', '3', 'mixed']) {
      for (const second of ['whole', 'decimal', 'mixed']) {
        const ps = decimals(makeRng(11), { op, places: pl, digits: 4, second, addends: 3, count: 40 });
        assert.strictEqual(ps.length, 40);
        for (const p of ps) {
          const [a, b, c] = p.operands.map(num);
          const ans = num(p.answerText);
          if (op === 'add') assert.ok(near(ans, a + b + (c || 0)), p.operands.join('+'));
          else if (op === 'sub') assert.ok(a > b && near(ans, a - b));
          else if (op === 'mul') assert.ok(near(ans, a * b));
          else { assert.ok(near(ans * b, a), `${a}/${b}`); assert.ok(places(p.answerText) <= 3); }
          for (const o of p.operands) assert.ok(places(o) <= 3, `${o} has too many places`);
          if (pl !== 'mixed' && (op === 'add' || op === 'sub')) p.operands.forEach((o) => assert.strictEqual(places(o), Number(pl)));
        }
      }
    }
  }
});

test('decimals: mixed places really mix, and stacked problems pad so the points line up', () => {
  const ps = decimals(makeRng(2), { op: 'add', places: 'mixed', digits: 2, count: 30, addends: 2 });
  for (const p of ps) {
    assert.notStrictEqual(places(p.operands[0]), places(p.operands[1]));
    const P = Math.max(...p.operands.map(places));
    p.operands.forEach((o, i) => assert.strictEqual(places(o) + p.pads[i], P));
  }
});

test('fractions: operands are in lowest terms, answers are correct, simplest and tidy', () => {
  for (const op of ['add', 'sub', 'mul', 'div']) {
    for (const den of ['like', 'unlike', 'mixed']) {
      for (const form of ['proper', 'mixed', 'mix']) {
        const ps = fractionProblems(makeRng(21), { op, den, form, maxDen: 12, count: 30 });
        assert.strictEqual(ps.length, 30, `${op}/${den}/${form}`);
        for (const p of ps) {
          const [a, b] = p.operands;
          const va = F.frac(a.w * a.d + a.n, a.d);
          const vb = F.frac(b.w * b.d + b.n, b.d);
          [a, b].forEach((o) => assert.strictEqual(F.gcd(o.n, o.d), o.n ? 1 : o.d, `lowest terms ${text(o)}`));
          const want = { add: F.add, sub: F.sub, mul: F.mul, div: F.div }[op](va, vb);
          assert.strictEqual(p.answerText, F.show(want));
          assert.ok(want.n > 0, 'positive answer');
          if (den === 'like') assert.ok(a.n === 0 || b.n === 0 || a.d === b.d);
          if (den === 'unlike' && a.n && b.n) assert.notStrictEqual(a.d, b.d);
          if (form === 'proper') assert.ok(a.w === 0 && b.w === 0);
        }
      }
    }
  }
});

test('sheets: decimals and fractions build, validate input, and stay reproducible', () => {
  for (const path of ['/math/decimals/worksheet', '/math/fractions/worksheet']) {
    const a = sheets.build(path, { op: 'mul', seed: '7', count: '12' });
    const b = sheets.build(path, { op: 'mul', seed: '7', count: '12' });
    assert.deepStrictEqual(a.locals.problems, b.locals.problems);
    assert.strictEqual(a.locals.problems.length, 12);
    const evil = sheets.build(path, { op: '<script>', places: '99', den: 'x', form: 'x', digits: '99', count: '-4', seed: '7' });
    assert.ok(evil.locals.problems.length >= 5);
    assert.ok(sheets.fromUrl(`${path}?op=add&seed=5`));
  }
  assert.strictEqual(sheets.build('/math/fractions/worksheet', { op: 'div', layout: 'vertical', seed: '3' }).locals.layout, 'horizontal');
  assert.strictEqual(sheets.build('/math/fractions/worksheet', { op: 'add', layout: 'vertical', seed: '3' }).locals.layout, 'vertical');
});

test('decimals: whole-number part goes up to the thousands', () => {
  for (const op of ['add', 'sub', 'mul', 'div']) {
    const ps = decimals(makeRng(8), { op, places: '3', digits: 4, count: 30, second: 'whole', addends: 2 });
    assert.ok(ps.some((p) => num(p.operands[0].split('.')[0]) >= 1000), op);
    assert.ok(ps.every((p) => num(p.operands[0].split('.')[0]) <= 9999), op); // the number being divided is also at most 4 digits
  }
  assert.strictEqual(sheets.build('/math/decimals/worksheet', { op: 'add', digits: '4', seed: '2' }).locals.digits, 8);
});

test('fractions: largest denominator goes up to 20 and is respected', () => {
  for (const op of ['add', 'sub', 'mul', 'div']) {
    for (const den of ['like', 'unlike', 'mixed']) {
      const ps = fractionProblems(makeRng(31), { op, den, form: 'mix', maxDen: 20, count: 50 });
      assert.strictEqual(ps.length, 50, `${op}/${den}`);
      for (const p of ps) p.operands.forEach((o) => assert.ok(o.d <= 20 && (o.n === 0 || o.d >= 2)));
      assert.ok(ps.some((p) => p.operands.some((o) => o.d > 12)), `${op}/${den} uses the larger denominators`);
    }
  }
  assert.strictEqual(sheets.build('/math/fractions/worksheet', { op: 'add', maxden: '20', seed: '3' }).locals.problems.length, 20);
  const over = sheets.build('/math/fractions/worksheet', { op: 'add', maxden: '99', seed: '3' }).locals.problems;
  assert.ok(over.every((p) => p.operands.every((o) => o.d <= 8)), 'out-of-range value falls back to the default');
});
