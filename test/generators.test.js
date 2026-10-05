'use strict';

const test = require('node:test');
const assert = require('node:assert');
const { makeRng } = require('../src/lib/generators/rng');
const math = require('../src/lib/generators/math');
const wp = require('../src/lib/generators/wordProblems');
const { phonics, CATEGORIES } = require('../src/lib/generators/phonics');
const { LISTS, sightWords } = require('../src/lib/generators/sight');

const digitsLen = (n) => String(n).length;

test('addition: 2-7 digits, correct sums, every problem regroups', () => {
  for (let d = 2; d <= 7; d++) {
    for (const p of math.addition(makeRng(d), { digits: d, count: 40, addends: 2 })) {
      assert.ok(p.operands.every((n) => digitsLen(n) === d));
      assert.strictEqual(p.answer, p.operands[0] + p.operands[1]);
      assert.ok(math.carries(p.operands) >= 1, `no carry in ${p.operands}`);
    }
  }
});

test('subtraction: 2-7 digits, never negative, every problem borrows', () => {
  for (let d = 2; d <= 7; d++) {
    for (const p of math.subtraction(makeRng(d), { digits: d, count: 40 })) {
      const [a, b] = p.operands;
      assert.ok(a > b && digitsLen(a) === d && digitsLen(b) === d);
      assert.strictEqual(p.answer, a - b);
      assert.ok(math.borrows(a, b) >= 1, `no borrow in ${a}-${b}`);
    }
  }
});

test('multiplication facts cover 0-12 and answers are right', () => {
  const ps = math.multiplication(makeRng(1), { factor: '7', count: 26 });
  assert.ok(ps.every((p) => p.operands.includes(7) && p.answer === p.operands[0] * p.operands[1]));
  const seen = new Set(ps.map((p) => p.operands.find((n) => n !== 7) ?? 7));
  assert.strictEqual(seen.size, 13);
  const all = math.multiplication(makeRng(2), { factor: 'all', count: 60 });
  assert.ok(all.every((p) => p.operands.every((n) => n >= 0 && n <= 12)));
});

test('division is exact for facts, never by zero, remainders correct when mixed', () => {
  for (const p of math.division(makeRng(3), { divisor: 'all', count: 100 })) {
    const [n, d] = p.operands;
    assert.ok(d >= 1 && d <= 12 && n % d === 0 && n / d === p.answer && p.answer <= 12);
  }
  for (const p of math.division(makeRng(4), { mode: 'mixed', count: 100 })) {
    const [n, d] = p.operands;
    assert.ok(d >= 1);
    assert.strictEqual(d * p.answer + p.remainder, n);
    assert.ok(p.remainder < d);
  }
});

test('word problems: every grade/op/kind combination yields consistent, non-empty output or a clear error', () => {
  let produced = 0;
  for (let grade = 1; grade <= 5; grade++) {
    for (const op of wp.OPS) for (const kind of wp.KINDS) for (const steps of wp.STEPS) {
      const r = wp.wordProblems(makeRng(grade), { grade, op, kind, steps, count: 6 });
      if (r.error) { assert.strictEqual(r.problems.length, 0); continue; }
      produced++;
      for (const p of r.problems) {
        assert.ok(p.text.length > 10 && p.answerText && !/NaN|undefined|Infinity|-\d/.test(p.text + p.answerText), p.text + ' => ' + p.answerText);
      }
    }
  }
  assert.ok(produced > 40);
});

test('word problem templates are deterministic for a seed and cover each operation at grades 3-5', () => {
  const a = wp.wordProblems(makeRng(9), { grade: 4, count: 8 });
  const b = wp.wordProblems(makeRng(9), { grade: 4, count: 8 });
  assert.deepStrictEqual(a, b);
  for (const grade of [3, 4, 5]) for (const op of ['add', 'sub', 'mul', 'div']) {
    assert.ok(wp.pool({ grade, op, kind: 'whole', steps: 'single' }).length > 0, `${grade} ${op}`);
  }
});

test('phonics data: pools big enough, nonsense never real, no blocked strings', () => {
  const BLOCK = ['fuk', 'fuc', 'shit', 'cunt', 'nig', 'fag', 'dik', 'tit', 'sex', 'cum', 'vag', 'gat', 'fap', 'wop', 'jap'];
  for (const c of CATEGORIES) for (const s of c.subtypes) {
    assert.ok(s.real.length >= 14 && s.nonsense.length >= 6, `${c.id}/${s.id} pool too small`);
    const real = new Set(CATEGORIES.flatMap((x) => x.subtypes.flatMap((y) => y.real)));
    for (const n of s.nonsense) {
      assert.ok(!real.has(n), `nonsense word "${n}" is also a real word in the pools`);
      assert.ok(!BLOCK.some((b) => n.includes(b)), `blocked string in "${n}"`);
    }
    assert.strictEqual(new Set(s.real).size, s.real.length, `${c.id}/${s.id} has duplicate real words`);
  }
});

test('phonics worksheets have 20 unique words with the requested real/nonsense mix', () => {
  for (const c of CATEGORIES) for (const sub of ['all', ...c.subtypes.map((s) => s.id)]) {
    for (const mix of ['mixed', 'real', 'nonsense']) {
      const r = phonics(makeRng(5), { category: c.id, subtype: sub, mix });
      const pool = [...new Set((sub === 'all' ? c.subtypes : c.subtypes.filter((s) => s.id === sub)).flatMap((s) => s.nonsense))].length;
      // nonsense-only sheets are capped by the size of the nonsense pool for that pattern
      assert.strictEqual(r.words.length, mix === 'nonsense' ? Math.min(20, pool) : 20, `${c.id}/${sub}/${mix}`);
      assert.strictEqual(new Set(r.words.map((w) => w.word)).size, r.words.length);
      const non = r.words.filter((w) => w.nonsense).length;
      if (mix === 'real') assert.strictEqual(non, 0);
      if (mix === 'nonsense') assert.strictEqual(non, r.words.length);
      if (mix === 'mixed') assert.ok(non >= 1 && non <= 8, `mixed gave ${non} nonsense`);
    }
  }
  assert.ok(phonics(makeRng(1), { category: 'nope' }).error);
});

test('Dolch lists have the official sizes', () => {
  const sizes = Object.fromEntries(LISTS.map((l) => [l.id, l.words.length]));
  assert.deepStrictEqual(sizes, { 'pre-primer': 40, primer: 52, first: 41, second: 46, third: 41, nouns: 95 });
  assert.strictEqual(LISTS.slice(0, 5).reduce((n, l) => n + l.words.length, 0), 220);
  for (const l of LISTS) assert.strictEqual(new Set(l.words).size, l.words.length, `${l.id} duplicates`);
  assert.strictEqual(sightWords(makeRng(1), { list: 'first', count: '10', order: 'random' }).words.length, 10);
});

test('print: the phone-layout media query is screen-only (a printed page is ~720px wide and used to trigger it)', () => {
  const css = require('fs').readFileSync(require('path').join(__dirname, '..', 'public', 'css', 'app.css'), 'utf8');
  const bare = css.match(/@media\s*\(\s*max-width[^)]*\)/g) || [];
  assert.deepStrictEqual(bare, [], 'every max-width media query must be "screen and (max-width ...)"');
  assert.match(css, /@media screen and \(max-width: 760px\)/);
  assert.match(css, /@media print\s*\{[\s\S]*ol\.problems \{ grid-template-columns: repeat\(4, 1fr\)/);
});

test('print: fit step shrinks with problem count and always has a matching CSS rule', () => {
  const { fitFor, FITS } = require('../src/lib/sheets');
  const css = require('fs').readFileSync(require('path').join(__dirname, '..', 'public', 'css', 'app.css'), 'utf8');
  for (const f of FITS.slice(1)) assert.match(css, new RegExp(`ol\\.problems\\.fit-${f.id} \\{ --lh: ${f.lh}px`), `css for fit-${f.id}`);
  assert.strictEqual(fitFor(2, 10, 'vertical'), 'a');          // few problems: roomy
  const order = 'abcdef';
  const fits = [10, 20, 30, 40, 50].map((n) => order.indexOf(fitFor(2, n, 'vertical')));
  assert.deepStrictEqual(fits, fits.slice().sort((a, b) => a - b), 'more problems never gets roomier');
  assert.ok(order.indexOf(fitFor(3, 50, 'vertical')) >= order.indexOf(fitFor(2, 50, 'vertical')), 'three addends need at least as much shrink');
  assert.ok(FITS.some((f) => f.id === fitFor(3, 50, 'vertical')));
});

test('multi-digit multiplication: 1-4 digit number x 1-2 digit number, exact products', () => {
  const len = (n) => String(n).length;
  for (const top of ['1', '2', '3', '4']) for (const bottom of ['1', '2']) {
    for (const p of math.multiplication(makeRng(Number(top) * 7 + Number(bottom)), { mode: 'multi', top, bottom, count: 60 })) {
      const [a, b] = p.operands;
      assert.strictEqual(len(a), Number(top), `${a} should have ${top} digits`);
      assert.strictEqual(len(b), Number(bottom), `${b} should have ${bottom} digits`);
      assert.strictEqual(p.answer, a * b);
      assert.strictEqual(p.work, Number(bottom) === 2 ? 2 : 0);
    }
  }
  const mixed = math.multiplication(makeRng(5), { mode: 'multi', top: 'mixed', bottom: 'mixed', count: 200 });
  assert.deepStrictEqual([...new Set(mixed.map((p) => len(p.operands[0])))].sort(), [1, 2, 3, 4]);
  assert.deepStrictEqual([...new Set(mixed.map((p) => len(p.operands[1])))].sort(), [1, 2]);
});

test('multi-digit division: up to 4-digit dividends by 1-2 digit divisors, with and without remainders', () => {
  const len = (n) => String(n).length;
  for (const dividend of ['2', '3', '4']) for (const vdigits of ['1', '2']) for (const remainders of ['none', 'with', 'mixed']) {
    const ps = math.division(makeRng(Number(dividend) * 11 + Number(vdigits)), { mode: 'multi', dividend, vdigits, remainders, count: 80 });
    assert.strictEqual(ps.length, 80);
    for (const p of ps) {
      const [n, d] = p.operands;
      assert.strictEqual(len(n), Number(dividend), `dividend ${n} digits`);
      assert.strictEqual(len(d), Number(vdigits), `divisor ${d} digits`);
      assert.strictEqual(d * p.answer + p.remainder, n, `${n} / ${d}`);
      assert.ok(p.remainder >= 0 && p.remainder < d);
      assert.ok(p.answer >= 2, 'quotient is at least 2');
      if (remainders === 'none') assert.strictEqual(p.remainder, 0);
      if (remainders === 'with') assert.ok(p.remainder >= 1);
      assert.strictEqual(p.answerText, p.remainder ? `${p.answer.toLocaleString('en-US')} R ${p.remainder}` : p.answer.toLocaleString('en-US'));
    }
    if (remainders === 'mixed') assert.ok(ps.some((p) => p.remainder === 0) && ps.some((p) => p.remainder > 0), 'mixed has both kinds');
  }
  const mixed = math.division(makeRng(3), { mode: 'multi', dividend: 'mixed', vdigits: 'mixed', remainders: 'mixed', count: 300 });
  assert.deepStrictEqual([...new Set(mixed.map((p) => len(p.operands[0])))].sort(), [2, 3, 4]);
  assert.deepStrictEqual([...new Set(mixed.map((p) => len(p.operands[1])))].sort(), [1, 2]);
});

test('print: work space shrinks (problems are never dropped) so a full page of long division still fits', () => {
  const { fitSheet } = require('../src/lib/sheets');
  const few = math.division(makeRng(1), { mode: 'multi', dividend: '4', vdigits: '2', count: 12 });
  fitSheet(few, 'vertical');
  assert.ok(few.every((p) => p.work === 3), 'plenty of room: full work space kept');
  const many = math.division(makeRng(1), { mode: 'multi', dividend: '4', vdigits: '2', count: 50 });
  fitSheet(many, 'vertical');
  assert.strictEqual(many.length, 50);
  assert.ok(many.every((p) => p.work < 3), 'work space trimmed to fit 50 on a page');
});
