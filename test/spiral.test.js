'use strict';
// Spiral Review: every test builds, every printed answer is re-derived independently from what is printed on the page,
// and the pages render through the app.
const test = require('node:test');
const assert = require('node:assert');
const { makeRng } = require('../src/lib/generators/rng');
const sp = require('../src/lib/generators/spiral');
const skills = require('../src/lib/generators/spiral/skills');
const C = require('../src/lib/generators/spiral/core');
const F = require('../src/lib/generators/fractions');
const { ICONS } = require('../src/lib/generators/spiral/skillsGeo');

const plainOf = (cell) => cell.blocks.map((b) => (b.seg ? C.plain(b.seg) : '')).join(' ');
const num = (s) => Number(String(s).replace(/,/g, ''));
const run = (id, params = {}, seed = 1) => skills[id](makeRng(seed), params);
const many = (id, params, n = 40) => Array.from({ length: n }, (_, i) => run(id, params, i * 7919 + 13));
const segVal = (s) => (s.f ? F.frac(s.f[0], s.f[1]) : s.m ? F.frac(s.m[0] * s.m[2] + s.m[1], s.m[2]) : null);
const centerOf = (cell) => cell.blocks.find((b) => b.t === 'center').seg;

// exact decimal helpers (BigInt, no floats)
const toScaled = (str, places) => { const [w, d = ''] = String(str).replace(/,/g, '').split('.'); return BigInt(w + d.padEnd(places, '0').slice(0, places)); };
const placesOf = (str) => (String(str).split('.')[1] || '').length;
function shiftStr(str, k) { // exact x * 10^k as a trimmed decimal string
  const [w, d = ''] = String(str).replace(/,/g, '').split('.'); const all = w + d; const pt = w.length + k;
  let out; if (pt >= all.length) out = all + '0'.repeat(pt - all.length); else if (pt <= 0) out = `0.${'0'.repeat(-pt)}${all}`; else out = `${all.slice(0, pt)}.${all.slice(pt)}`;
  return out.replace(/^0+(?=\d)/, '').replace(/(\.\d*?)0+$/, '$1').replace(/\.$/, '');
}
const stripCommas = (s) => String(s).replace(/,/g, '');
function wordsToNumber(str) {
  const small = { zero: 0, one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10, eleven: 11, twelve: 12, thirteen: 13, fourteen: 14, fifteen: 15, sixteen: 16, seventeen: 17, eighteen: 18, nineteen: 19, twenty: 20, thirty: 30, forty: 40, fifty: 50, sixty: 60, seventy: 70, eighty: 80, ninety: 90 };
  let total = 0; let cur = 0;
  for (const w of str.replace(/-/g, ' ').split(/\s+/)) {
    if (w in small) cur += small[w]; else if (w === 'hundred') cur *= 100; else if (w === 'thousand') { total += cur * 1000; cur = 0; } else throw new Error(`unknown word ${w}`);
  }
  return total + cur;
}
const BAD = /undefined|NaN|\[object|null/;
const NUMW = { 3: 'three', 4: 'four', 5: 'five' };
const UNITW = { 2: 'half', 3: 'third', 4: 'fourth', 5: 'fifth', 6: 'sixth', 8: 'eighth' };
const commas2 = (n) => Number(n).toLocaleString('en-US');
const trimDecStr = (v, p = 2) => { const s = (v / 10 ** p).toFixed(p); return s.replace(/0+$/, '').replace(/\.$/, ''); };


test('every grade 4 and 5 test builds 10 boxes, with answers and well-formed blocks, for many seeds', () => {
  const KNOWN = new Set(['text', 'center', 'note', 'line', 'space', 'svg', 'vmul', 'ldiv', 'table', 'circles', 'match', 'list', 'wholes', 'box', 'bullets', 'pointlist', 'side']);
  for (const grade of [4, 5]) {
    assert.deepStrictEqual(sp.testNumbers(grade), Array.from({ length: grade === 4 ? 36 : 30 }, (_, i) => i + 1));
    for (const t of sp.testNumbers(grade)) {
      for (let seed = 1; seed <= 25; seed++) {
        const r = sp.buildTest(makeRng(seed * 7 + t), { grade, test: t });
        assert.strictEqual(r.boxes.length, 10, `G${grade}T${t}`);
        assert.strictEqual(r.key.length, 10);
        const walk = (blocks) => blocks.forEach((b) => { assert.ok(KNOWN.has(b.t), `unknown block ${b.t}`); if (b.seg) assert.ok(!BAD.test(C.plain(b.seg)), `G${grade}T${t}: ${C.plain(b.seg)}`); if (b.t === 'side') { walk(b.left); walk(b.right); } if (b.svg) assert.ok(b.svg.startsWith('<svg') && !/NaN|undefined/.test(b.svg), 'bad svg'); });
        r.boxes.forEach((box) => box.parts.forEach((c) => { walk(c.blocks); assert.ok(String(c.answer).length > 0 && !BAD.test(String(c.answer)), `G${grade}T${t} answer ${c.answer}`); }));
      }
    }
  }
});

test('the same seed gives the same test, different seeds differ', () => {
  const a = sp.buildTest(makeRng(5), { grade: 5, test: 12 }); const b = sp.buildTest(makeRng(5), { grade: 5, test: 12 }); const c = sp.buildTest(makeRng(6), { grade: 5, test: 12 });
  assert.deepStrictEqual(a, b);
  assert.notDeepStrictEqual(a.key, c.key);
});

test('number sense: standard / word / expanded forms, place value and rounding are exact', () => {
  for (const c of many('numToWord', { places: 3, wholeDigits: [1, 2], trailingZero: true })) {
    const [, whole, digits] = /Write (\d+)\.(\d+) in word form/.exec(C.plain(c.blocks[0].seg)) ? [0, ...C.plain(c.blocks[0].seg).match(/Write (\d+)\.(\d+)/).slice(1)] : [];
    const places = { 1: 'tenths', 2: 'hundredths', 3: 'thousandths' }[digits.length];
    assert.ok(c.answer.endsWith(places) || c.answer.endsWith(places.slice(0, -1)), c.answer);
    const [w, frac] = c.answer.split(' and ');
    if (frac) { assert.strictEqual(wordsToNumber(w), Number(whole)); assert.strictEqual(wordsToNumber(frac.replace(/ (tenths?|hundredths?|thousandths?)$/, '')), Number(digits)); }
  }
  for (const c of many('wordToStd', { places: [2, 3] })) {
    const t = C.plain(c.blocks[0].seg).replace(/^Write | in standard form\.$/g, '');
    const m = /^(?:(.+?) and )?(.+?) (tenths?|hundredths?|thousandths?)$/.exec(t);
    const places = { tenth: 1, tenths: 1, hundredth: 2, hundredths: 2, thousandth: 3, thousandths: 3 }[m[3]];
    const frac = String(wordsToNumber(m[2])).padStart(places, '0');
    assert.strictEqual(c.answer, `${m[1] ? wordsToNumber(m[1]) : 0}.${frac}`);
  }
  for (const id of ['sumToStd', 'sumToWord', 'numToExpanded']) {
    for (const c of many(id, id === 'sumToStd' ? { kind: 'dec' } : {})) {
      const t = C.plain(c.blocks[0].seg);
      if (id === 'numToExpanded') { const n = /Write ([\d,.]+) in expanded form/.exec(t)[1]; const total = c.answer.split(' + ').reduce((s, x) => s + toScaled(x, 3), 0n); assert.strictEqual(total, toScaled(n, 3)); continue; }
      const terms = t.replace(/^Write | in (standard|word) form\.$/g, '').split(' + ');
      const total = terms.reduce((s, x) => s + toScaled(x, 3), 0n);
      if (id === 'sumToStd') assert.strictEqual(total, toScaled(c.answer, 3));
      else { const [w, frac] = c.answer.split(' and '); const fd = frac.replace(/ (tenths?|hundredths?|thousandths?)$/, ''); const places = /thousandth/.test(frac) ? 3 : /hundredth/.test(frac) ? 2 : 1; assert.strictEqual(total, BigInt(wordsToNumber(w)) * 1000n + BigInt(wordsToNumber(fd)) * 10n ** BigInt(3 - places)); }
    }
  }
  for (const c of many('sumToStd', {})) { const terms = C.plain(c.blocks[0].seg).replace(/^Write | in standard form\.$/g, '').split(' + '); assert.strictEqual(terms.reduce((s, x) => s + num(x), 0), num(c.answer)); }
  for (const c of many('placeCount', { unit: [1, 2, 3] })) {
    const m = /How many (tenths|hundredths|thousandths) are in the number ([\d,]+)\.(\d+)\?/.exec(C.plain(c.blocks[0].seg));
    const k = { tenths: 1, hundredths: 2, thousandths: 3 }[m[1]];
    assert.strictEqual(num(c.answer), num(m[2]) * 10 ** k + Number(m[3].slice(0, k)));
  }
  for (const c of many('placeValueOf')) {
    const m = /value of (\d) in (\d)\.(\d+)\?/.exec(C.plain(c.blocks[0].seg));
    const idx = m[3].indexOf(m[1]);
    assert.ok(idx >= 0); assert.strictEqual(c.answer.split(' ')[0], `0.${'0'.repeat(idx)}${m[1]}`);
  }
  for (const c of many('g4PlaceValue', { digits: [5, 6] })) {
    const m = /value of the (\d) in ([\d,]+)\?/.exec(C.plain(c.blocks[0].seg)); const s = stripCommas(m[2]); const i = s.indexOf(m[1]);
    assert.strictEqual(num(c.answer), Number(m[1]) * 10 ** (s.length - 1 - i));
  }
  // rounding, half up, checked on exact integers
  for (const to of ['whole', 'tenth', 'hundredth', 'thousandth']) {
    for (const c of many('roundDec', { to, wholeDigits: [1, 2, 3, 4, 5] })) {
      const m = /Round ([\d,]+\.\d+) to the nearest (whole number|tenth|hundredth|thousandth)/.exec(C.plain(c.blocks[0].seg));
      const k = { 'whole number': 0, tenth: 1, hundredth: 2, thousandth: 3 }[m[2]]; const full = placesOf(m[1]);
      const v = toScaled(m[1], full); const unit = 10n ** BigInt(full - k);
      const rounded = ((v + unit / 2n) / unit) * unit; // half up
      assert.strictEqual(toScaled(c.answer, full), rounded, `${m[1]} -> ${c.answer}`);
      if (k) assert.strictEqual(placesOf(c.answer), k, 'keeps the rounded place'); else assert.ok(!c.answer.includes('.'));
    }
  }
  for (const unit of [100, 1000, 10000]) for (const c of many('roundWhole', { unit })) { const n = num(/Round ([\d,]+) to/.exec(C.plain(c.blocks[0].seg))[1]); assert.strictEqual(num(c.answer), Math.floor((n + unit / 2) / unit) * unit); }
  for (const unit of [10, 100, 1000, 10000, 100000]) for (const c of many('g4Round', { unit, list: true })) {
    const nums = c.blocks[1].rows.map((rw) => num(rw.seg[0])); const want = nums.map((n) => Math.floor((n + unit / 2) / unit) * unit);
    assert.deepStrictEqual(c.answer.split(', ').map(num), want);
  }
});

test('powers of ten, decimals and long computation are exact', () => {
  for (const c of many('powDiv', { exp: [2, 3] })) { const m = /([\d,]+) ÷ 10\^(\d)/.exec(C.plain(centerOf(c))); assert.strictEqual(stripCommas(c.answer), shiftStr(m[1], -Number(m[2]))); }
  for (const c of many('powMul', { exp: [2, 3] })) { const m = /([\d,]+) × 10\^(\d)/.exec(C.plain(centerOf(c))); assert.strictEqual(stripCommas(c.answer), shiftStr(m[1], Number(m[2]))); }
  for (const c of many('mulPow10List', { n: 3, maxExp: 4 })) c.blocks[0].rows.forEach((rw, i) => { const m = /([\d,]+) × 10\^(\d)/.exec(C.plain(rw.seg)); assert.strictEqual(stripCommas(c.answer.split('; ')[i]), shiftStr(m[1], Number(m[2]))); });
  for (const c of many('divMultiples')) c.blocks[0].rows.forEach((rw, i) => { const m = /([\d,]+) ÷ ([\d,]+)/.exec(C.plain(rw.seg)); assert.strictEqual(num(m[1]) / num(m[2]), Number(c.answer.split('; ')[i])); });
  for (const c of many('decSub')) { const m = /([\d.]+) − ([\d.]+)/.exec(C.plain(centerOf(c))); assert.strictEqual(toScaled(m[1], 3) - toScaled(m[2], 3), toScaled(c.answer, 3)); assert.ok(toScaled(c.answer, 3) > 0n); }
  for (const c of many('decAdd')) { const m = /([\d.]+) \+ ([\d.]+)/.exec(C.plain(centerOf(c))); assert.strictEqual(toScaled(m[1], 3) + toScaled(m[2], 3), toScaled(c.answer, 3)); }
  for (const c of many('decMul')) { const m = /([\d,.]+) × ([\d.]+)/.exec(C.plain(centerOf(c))); const pa = placesOf(m[1]); const pb = placesOf(m[2]); assert.strictEqual(toScaled(m[1], pa) * toScaled(m[2], pb), toScaled(c.answer, pa + pb)); }
  for (const c of many('decDiv')) { const m = /([\d.]+) ÷ ([\d.]+)/.exec(C.plain(centerOf(c))); const pa = placesOf(m[1]); const pb = placesOf(m[2]); const pq = placesOf(c.answer); assert.strictEqual(toScaled(c.answer, pq) * toScaled(m[2], pb) * 10n ** BigInt(pa), toScaled(m[1], pa) * 10n ** BigInt(pq + pb)); }
  for (const c of many('vmul', { a: [3, 3], b: [2, 2] })) assert.strictEqual(c.blocks[0].a * c.blocks[0].b, num(c.answer));
  for (const c of many('vmul', { a: [2, 2], b: 10 })) { assert.strictEqual(c.blocks[0].b, 10); assert.strictEqual(c.blocks[0].a * 10, num(c.answer)); }
  for (const rem of [false, true]) for (const c of many('ldiv', { divisor: [2, 12], quotient: [20, 999], rem })) {
    const { d, n } = c.blocks[0]; const m = /^([\d,]+)(?: R (\d+))?$/.exec(c.answer); const q = num(m[1]); const rr = Number(m[2] || 0);
    assert.strictEqual(d * q + rr, num(n)); assert.ok(rr < d); assert.strictEqual(rr > 0, rem || rr > 0);
    if (!rem) assert.strictEqual(rr, 0); else assert.ok(rr > 0);
  }
  for (const c of many('unitsEq')) {
    const t = c.blocks[0]; const u = { tens: 10, hundreds: 100, thousands: 1000, ones: 1 };
    const s = `${t.pre}|${t.post}`;
    let m = /^(\d+) (tens|hundreds|thousands) = \|ones$/.exec(s);
    if (m) assert.strictEqual(num(c.answer), Number(m[1]) * u[m[2]]);
    else { m = /^\|(thousands|hundreds) = ([\d,]+) (hundreds|tens)$/.exec(s); assert.ok(m, s); assert.strictEqual(num(c.answer) * u[m[1]], num(m[2]) * u[m[3]]); }
  }
});

test('compare skills: the printed symbol is right', () => {
  for (const id of ['compareDec', 'g4Compare']) for (const c of many(id, id === 'compareDec' ? { kinds: ['lead', 'swap', 'zero', 'zero2', 'close', 'shift', 'whole'] } : { kinds: ['shift', 'close', 'hundreds', 'thousands'] })) {
    c.answer.split('; ').forEach((x) => { const m = /^([\d,.]+) ([<>=]) ([\d,.]+)$/.exec(x); const a = num(m[1]); const b = num(m[3]); assert.strictEqual(m[2], a === b ? '=' : a < b ? '<' : '>', x); });
    assert.ok(c.blocks.find((b) => b.t === 'circles').pairs.length === (id === 'compareDec' ? 7 : 4));
  }
  for (const c of many('g4CompareFrac', { kinds: ['sameDen', 'sameNum', 'bench', 'unlike'] })) {
    const pairs = c.blocks.find((b) => b.t === 'circles').pairs;
    c.answer.split('; ').forEach((x, i) => { const [a, b] = pairs[i].map((p) => p.f); const lhs = a[0] * b[1]; const rhs = b[0] * a[1]; assert.ok(x.includes(` ${lhs === rhs ? '=' : lhs < rhs ? '<' : '>'} `), x); });
  }
});

test('fractions: operations, bonus hints, products, area models and word problems', () => {
  for (const op of ['add', 'sub']) for (const den of ['like', 'unlike']) for (const mixed of [false, true]) for (const c of many('fracOp', { op, den, mixed, related: den === 'unlike' ? undefined : undefined, noBorrow: false, label: false })) {
    const seg = centerOf(c); const vals = seg.map(segVal).filter(Boolean);
    const want = op === 'add' ? F.add(vals[0], vals[1]) : F.sub(vals[0], vals[1]);
    assert.strictEqual(c.answer, F.show(want)); assert.ok(want.n > 0);
    const dens = seg.filter((s) => s.f || s.m).map((s) => (s.f ? s.f[1] : s.m[2]));
    if (den === 'like') assert.strictEqual(dens[0], dens[1], 'like denominators'); else assert.notStrictEqual(dens[0], dens[1], 'unlike denominators');
  }
  for (const c of many('fracOp', { op: 'add', den: 'unlike', bonus: 'convert', label: false })) { const v = centerOf(c).map(segVal).filter(Boolean); const s = F.add(v[0], v[1]); assert.ok(s.n > s.d, 'convert bonus needs an improper fraction'); }
  for (const c of many('fracOp', { op: 'sub', den: 'unlike', related: true, bonus: 'reduce', label: false })) { const [a, b] = centerOf(c).filter((s) => s.f).map((s) => s.f); const L = F.lcm(a[1], b[1]); assert.ok(F.gcd(Math.abs(a[0] * (L / a[1]) - b[0] * (L / b[1])), L) > 1, 'reduce bonus needs a reducible answer'); }
  for (const c of many('fracMul', { bonus: 'reduce' })) { const [a, b] = centerOf(c).filter((s) => s.f).map((s) => s.f); assert.strictEqual(c.answer, F.show(F.mul(F.frac(...a), F.frac(...b)))); assert.ok(F.gcd(a[0] * b[0], a[1] * b[1]) > 1); }
  for (const c of many('fracExprParen')) { const m = centerOf(c); const w = Number(m[0]); const [a, b] = m.filter((s) => s.f).map((s) => s.f); assert.strictEqual(c.answer, F.show(F.add(F.frac(w, 1), F.sub(F.frac(...a), F.frac(...b))))); }
  for (const kind of ['wholeFrac', 'fracFrac', 'mixedFrac', 'mixedSmall']) for (const c of many('moreOrLess', { kind })) {
    const t = c.blocks[0].seg; const target = t.map(segVal).filter(Boolean)[0]; const ex = centerOf(c);
    const vals = ex.map((s) => (typeof s === 'string' && /^\d+$/.test(s) ? F.frac(Number(s), 1) : segVal(s))).filter(Boolean);
    const prod = F.mul(vals[0], vals[1]); const cmp = prod.n * target.d - target.n * prod.d;
    assert.ok(c.answer.startsWith(cmp > 0 ? 'more' : 'less'), `${C.plain(ex)} vs ${target.n}/${target.d}: ${c.answer}`); assert.notStrictEqual(cmp, 0);
  }
  for (const c of many('betweenWhole')) { const ex = centerOf(c); const W = Number(ex[0]); const m = ex.find((s) => s.m).m; const prod = F.mul(F.frac(W, 1), F.frac(m[0] * m[2] + m[1], m[2])); const lo = Math.floor(prod.n / prod.d); assert.ok(prod.d > 1); assert.ok(c.answer.startsWith(`between ${lo} and ${lo + 1}`), c.answer); }
  for (const c of many('shadeArea')) {
    const fr = (c.blocks.find((b) => b.t === 'center') ? centerOf(c) : c.blocks[0].seg).filter((s) => s.f).map((s) => s.f); const [a, b] = fr;
    const prod = F.mul(F.frac(...a), F.frac(...b)); assert.ok(c.answer.endsWith(F.show(prod)), c.answer);
    const svg = c.blocks.find((b) => b.t === 'svg'); if (svg) { const lines = svg.svg.match(/<line /g).length; assert.strictEqual(lines, (b[1] + 1) + (a[1] + 1), 'grid is denominator-2 columns by denominator-1 rows'); }
  }
  for (const c of many('fracDivMark', {})) { const m = C.plain(centerOf(c)).match(/(\d+) ÷ 1\/(\d+)/); assert.strictEqual(Number(c.answer), Number(m[1]) * Number(m[2])); assert.strictEqual(c.blocks.find((b) => b.t === 'wholes').n, Number(m[1])); }
  for (const c of many('drawVisual')) { const m = C.plain(centerOf(c)).match(/(\d+) ÷ 1\/(\d+)/); assert.strictEqual(Number(c.answer), Number(m[1]) * Number(m[2])); }
  for (const c of many('divUnitFracVisual')) { const m = C.plain(centerOf(c)).match(/1\/(\d+) ÷ (\d+)/); assert.strictEqual(c.answer, `1/${Number(m[1]) * Number(m[2])}`); }
  for (const c of many('missingPair')) { const rows = c.blocks.find((b) => b.t === 'list').rows; const m = C.plain(rows[0].seg).match(/1\/(\d+) ÷ (\d+)/); assert.strictEqual(c.answer, `1/${Number(m[1]) * Number(m[2])}`); }
  for (const c of many('explainEq')) { const fr = centerOf(c).filter((s) => s.f).map((s) => s.f); const right = F.sub(F.frac(...fr[0]), F.frac(...fr[1])); const printed = F.frac(...fr[2]); assert.ok(right.n !== printed.n || right.d !== printed.d, 'the printed equation must be wrong'); assert.ok(c.answer.startsWith('No')); assert.ok(c.answer.endsWith(`= ${F.show(right)}.`)); }
  for (const op of ['add', 'sub']) for (const c of many('explainOp', { op })) { const fr = centerOf(c).filter((s) => s.f).map((s) => F.frac(...s.f)); assert.ok(c.answer.endsWith(F.show(op === 'add' ? F.add(fr[0], fr[1]) : F.sub(fr[0], fr[1])))); }
  for (const c of many('fracTimesWholeCompare')) { const ex = centerOf(c); const fr = ex.find((s) => s.f).f; const W = Number(ex.find((s) => typeof s === 'string' && /^\d+$/.test(s))); assert.ok(c.answer.startsWith(F.show(F.mul(F.frac(...fr), F.frac(W, 1))))); }
});

test('word problems: the answer follows from the quantities, and every quantity is printed in the story', () => {
  const dollars = (cents) => `$${(cents / 100).toFixed(2)}`;
  const has = (c, ...vals) => { const t = plainOf(c); vals.forEach((v) => assert.ok(new RegExp(`(^|[^\\d.])${String(v).replace(/[.$]/g, '\\$&')}(?![\\d])`).test(t), `${v} should appear in: ${t}`)); };
  const hasFrac = (c, ...pairs) => pairs.forEach(([n, d]) => assert.ok(plainOf(c).includes(`${n}/${d}`), `${n}/${d} should appear in: ${plainOf(c)}`));
  for (const c of many('moneyDiff', {}, 60)) { has(c, dollars(c.meta.hi), dollars(c.meta.lo)); assert.strictEqual(c.answer, dollars(c.meta.hi - c.meta.lo)); assert.ok(c.meta.hi > c.meta.lo); }
  for (const c of many('moneyChange', {}, 60)) { const { have, spend } = c.meta; has(c, ...spend.map(dollars)); if (have % 100 === 0 && /bill/.test(plainOf(c))) has(c, `$${have / 100}`); else has(c, dollars(have)); assert.ok(have > spend.reduce((x, y) => x + y, 0), 'must be affordable'); assert.strictEqual(c.answer, dollars(have - spend.reduce((x, y) => x + y, 0))); }
  for (const c of many('moneyThree', {}, 60)) { has(c, ...c.meta.nums.map(dollars)); assert.strictEqual(c.answer, dollars(c.meta.nums.reduce((x, y) => x + y, 0))); }
  for (const total of [true, false]) for (const c of many('moneyBeforeTax', { total }, 30)) { has(c, dollars(c.meta.price), dollars(c.meta.tax)); assert.ok(c.answer.startsWith(dollars(total ? c.meta.price + c.meta.tax : c.meta.price))); }
  for (const c of many('decWordMulCompare', {}, 60)) { const { have, per, tails, enough } = c.meta; assert.strictEqual(enough, have >= tails * per); assert.ok(c.answer.startsWith(enough ? 'Yes' : 'No')); has(c, trimDecStr(have, 2), (per / 100).toFixed(2)); assert.ok(plainOf(c).includes(NUMW[tails])); }
  for (const c of many('decWordTimes', {}, 60)) { const { times, base } = c.meta; has(c, trimDecStr(times, 1), trimDecStr(base, 1)); assert.strictEqual(toScaled(c.answer.split(' ')[0], 2), BigInt(times * base)); }
  for (const c of many('cmToM', {}, 40)) { const { first, second, x, total } = c.meta; assert.strictEqual(first + second + 2 * x, total); assert.strictEqual(total % 100, 0); has(c, first, second, x); assert.strictEqual(c.answer, `${total / 100} m`); }
  for (const c of many('convertWord', {}, 80)) { const { n, mult } = c.meta; has(c, commas2(n)); assert.strictEqual(num(c.answer.split(' ')[0]), n * mult); }
  for (const c of many('fwAddLike', {}, 40)) { const { n1, n2, d } = c.meta; hasFrac(c, [n1, d], [n2, d]); assert.strictEqual(c.answer, F.show(F.frac(n1 + n2, d))); assert.ok(n1 + n2 < d); }
  for (const kind of ['book', 'fabric']) for (const c of many('fwSubTwo', { kind }, 40)) {
    if (kind === 'book') { const { total, n1, n2, d } = c.meta; hasFrac(c, [total, d], [n1, d], [n2, d]); assert.strictEqual(c.answer, F.show(F.frac(total - n1 - n2, d))); assert.ok(total > n1 + n2); } else { const { n, d } = c.meta; hasFrac(c, [n, d]); assert.strictEqual(c.answer, F.show(F.sub(F.frac(1, 1), F.frac(2 * n, d)))); }
  }
  for (const c of many('fwAddUnlike', {}, 40)) { const { n1, d1, n2, d2 } = c.meta; hasFrac(c, [n1, d1], [n2, d2]); assert.strictEqual(c.answer, F.show(F.add(F.frac(n1, d1), F.frac(n2, d2)))); assert.notStrictEqual(d1, d2); }
  for (const c of many('mwAdd', {}, 40)) { const { w1, n1, d, w2, n2, d2 } = c.meta; hasFrac(c, [n1, d], [n2, d2]); has(c, w1, w2); assert.strictEqual(c.answer, F.show(F.add(F.frac(w1 * d + n1, d), F.frac(w2 * d2 + n2, d2)))); }
  for (const kind of ['time', 'apples']) for (const c of many('mwSub', { kind }, 40)) { const { w1, n1, w2, n2, d } = c.meta; hasFrac(c, [n1, d], [n2, d]); has(c, w1, w2); const a = F.frac(w1 * d + n1, d); const b = F.frac(w2 * d + n2, d); const want = kind === 'time' ? F.sub(b, a) : F.sub(a, b); assert.ok(want.n > 0); assert.strictEqual(c.answer, F.show(want)); }
  for (const kind of ['cake', 'candy']) for (const c of many('fracOfFracWord', { kind }, 40)) { const { n1, d1, d2 } = c.meta; hasFrac(c, [n1, d1], [1, d2]); assert.strictEqual(c.answer, F.show(F.mul(F.frac(n1, d1), F.frac(1, d2)))); }
  for (const c of many('fracOfWholeWord', {}, 40)) { const { W, n, d } = c.meta; has(c, W); hasFrac(c, [n, d]); assert.strictEqual(c.answer, F.show(F.mul(F.frac(W, 1), F.frac(n, d)))); assert.ok(!/^\d+$/.test(c.answer)); }
  for (const kind of ['boxes', 'turtles', 'bucket', 'packages', 'candy', 'rocks', 'garden', 'paint']) for (const c of many('mixedFracWordMul', { kind }, 40)) { assert.strictEqual(c.answer, F.show(F.mul(c.meta.a, c.meta.b))); assert.ok(c.blocks[0].seg.some((x) => x.f), 'a fraction is printed'); }
  for (const c of many('fracDivWordMixed', {}, 60)) { const { T, k } = c.meta; has(c, T, k === 0 ? 0 : (/and \d+ friends/.test(plainOf(c)) ? k - 1 : k)); assert.strictEqual(c.answer, F.show(F.frac(T, k))); assert.ok(T % k !== 0); }
  for (const c of many('divBetween', {}, 80)) { const { T, k } = c.meta; has(c, T); const q = Math.floor(T / k); assert.ok(c.answer.endsWith(`between ${q} and ${q + 1}`), c.answer); assert.strictEqual(c.answer.split(',')[0], F.show(F.frac(T, k))); const t = plainOf(c); assert.ok(new RegExp(`\\b${/himself|herself/.test(t) ? k - 1 : k}\\b`).test(t), `${k} people/groups in: ${t}`); }
  for (const kind of ['cereal', 'bag', 'dip']) for (const c of many('unitFracDivWord', { kind }, 60)) { const { d, k } = c.meta; assert.strictEqual(c.answer, `1/${d * k}`); assert.ok(plainOf(c).includes(`one-${UNITW[d]}`)); assert.ok(new RegExp(`\\b(${k}|${k - 1})\\b`).test(plainOf(c))); }
  for (const c of many('unitFracDivWord', { kind: 'cups' }, 40)) { const { T, k } = c.meta; has(c, T, k); assert.strictEqual(c.answer, F.show(F.frac(T, k))); }
  for (const c of many('servingsWord', {}, 60)) { const { d, cups } = c.meta; has(c, cups); assert.ok(plainOf(c).includes(`one-${UNITW[d]} cup`)); assert.strictEqual(Number(c.answer), cups * d); }
  for (const c of many('servingsDaysWord', {}, 60)) { const { d, k } = c.meta; has(c, k); assert.ok(plainOf(c).includes(`one-${UNITW[d]} of`)); assert.strictEqual(Number(c.answer), k * d); }
});

test('expressions: evaluating and writing', () => {
  const ev = (s) => Function(`"use strict"; return (${s.replace(/×/g, '*').replace(/÷/g, '/').replace(/−/g, '-').replace(/[{[]/g, '(').replace(/[}\]]/g, ')')})`)();
  for (const kind of ['paren', 'parenDiv', 'twoParens', 'chain', 'sevenMinus', 'mixed', 'brackets']) for (const c of many('exprEval', { kind })) { const e = C.plain(centerOf(c)).replace(/ =$/, ''); assert.strictEqual(ev(e), Number(c.answer), e); assert.ok(Number.isInteger(ev(e))); }
  for (const kind of ['double-add', 'double-sub', 'triple-add-times', 'double-product', 'added-divided', 'tripled-addDiv', 'double-addDiv', 'triple-subDiv', 'double-two-sub', 'triple-double']) for (const c of many('exprWrite', { kind })) {
    const [ex, v] = c.answer.split(' = '); assert.strictEqual(ev(ex), Number(v), c.answer); assert.ok(Number.isInteger(Number(v)) && Number(v) >= 0);
    const printed = [...C.plain(c.blocks[0].seg).matchAll(/\d+/g)].map((m) => m[0]); printed.forEach((p) => assert.ok(new RegExp(`\\b${p}\\b`).test(ex), `${p} should appear in ${ex}`));
  }
});

test('tables, coordinate planes, volume and line plots agree with their pictures', () => {
  const textsIn = (svg) => [...svg.matchAll(/<text [^>]*>([^<]*)<\/text>/g)].map((m) => m[1]);
  for (const c of many('volumeCount', {})) { const svg = c.blocks.find((b) => b.t === 'svg').svg; assert.strictEqual(parseInt(c.answer, 10), (svg.match(/<rect /g) || []).length, 'cubes drawn = volume'); }
  for (const c of many('volumeCount', { fit: true })) { const svg = c.blocks.find((b) => b.t === 'svg').svg; assert.strictEqual(parseInt(c.answer, 10), (svg.match(/<rect /g) || []).length); }
  for (const c of many('volumePrismDims', { l: [6, 40], dec: false })) { const t = textsIn(c.blocks.find((b) => b.t === 'svg').svg).map(num); assert.strictEqual(num(c.answer), t[0] * t[1] * t[2]); }
  for (const c of many('volumePrismDims', { dec: true, l: [8, 14], w: [2, 2], h: [4, 4] })) { const t = textsIn(c.blocks.find((b) => b.t === 'svg').svg).map(Number); assert.strictEqual(Number(stripCommas(c.answer.split(' ')[0])), Math.round(t[0] * t[1] * t[2] * 10) / 10); }
  for (const c of many('volumeComposite')) { const t = textsIn(c.blocks.find((b) => b.t === 'svg').svg).map((x) => parseFloat(x)); const [lw, rw, lh, rh, d] = t; assert.strictEqual(num(c.answer.split(' ')[0]), (lw * lh + rw * rh) * d); assert.notStrictEqual(lh, rh); }
  for (const c of many('cubesTower', { extra: [2, 6] })) { const n = [...plainOf(c).matchAll(/\d+/g)].map((m) => Number(m[0])); assert.strictEqual(parseInt(c.answer, 10), n[0] * n[1] + n[2]); }
  for (const c of many('cubesTower')) { const n = [...plainOf(c).matchAll(/\d+/g)].map((m) => Number(m[0])); assert.strictEqual(parseInt(c.answer, 10), n[0] * n[1]); }
  // coordinates: icons sit on lattice points (plane geometry: left margin 20, top margin 10, cell 20, 5x5 default)
  for (const c of many('gridLocate', {})) {
    const svg = c.blocks.find((b) => b.t === 'svg').svg; const target = /location of the ([a-z ]+)\?/.exec(plainOf(c))[1]; const emoji = ICONS.find((i) => i.n === target).e;
    const m = new RegExp(`<text x="([\\d.]+)" y="([\\d.]+)"[^>]*>${emoji}</text>`).exec(svg); const ymax = 5; const cell = 20;
    const x = Math.round((Number(m[1]) - 20) / cell); const y = Math.round((10 + ymax * cell - (Number(m[2]) - cell * 0.28)) / cell);
    assert.strictEqual(c.answer, `(${x},${y})`);
  }
  for (const c of many('gridPolyCoords', {})) {
    const svg = c.blocks[0].right[0].svg; const pts = /<polygon points="([^"]+)" fill="none" stroke="#000" stroke-width="2"/.exec(svg)[1].split(' ').map((p) => p.split(',').map(Number)); const cell = 17; const ymax = 6;
    const got = pts.map(([px, py]) => `(${Math.round((px - 20) / cell)},${Math.round((10 + ymax * cell - py) / cell)})`).join(', '); assert.strictEqual(got, c.answer);
  }
  for (const c of many('gridMovePoly')) { const m = /coordinate \((\d),(\d)\)/.exec(c.blocks[0].left[0].seg.join('')); const svg = c.blocks[0].right[0].svg; const pts = /<polygon points="([^"]+)" fill="none" stroke="#000" stroke-width="2"/.exec(svg)[1].split(' ').map((p) => p.split(',').map(Number)).map(([px, py]) => [Math.round((px - 20) / 17), Math.round((10 + 5 * 17 - py) / 17)]); const [bx, by] = pts[0]; const want = pts.slice(1).map(([x, y]) => `(${x - bx + Number(m[1])},${y - by + Number(m[2])})`).join(', '); assert.strictEqual(c.answer, want); }
  for (const kind of ['m-mm', 'g-kg', 'km-m', 'in-ft', 'kg-g', 'cm-m']) for (const c of many('unitTable', { kind })) { const t = c.blocks[1]; const f = { 'm-mm': 1000, 'g-kg': 0.001, 'km-m': 1000, 'in-ft': 1 / 12, 'kg-g': 1000, 'cm-m': 0.01 }[kind]; c.answer.split('; ').forEach((x, i) => { const [a, bb] = x.split(' → ').map(num); assert.ok(Math.abs(a * f - bb) < 1e-9, x); assert.strictEqual(num(t.rows[i][0]), a); }); }
  for (const c of many('addTable', { add: [4, 5], start: 10, prefill: true })) { assert.strictEqual(c.blocks[1].rows[0][1], '14'); assert.strictEqual(c.blocks[1].rows[1][1], null); }
  for (const c of many('linePlot', { axis: 'half', question: 'total' })) assert.ok(c.answer.length);
});

test('line plots: the answer matches the X marks drawn', () => {
  for (const [axis, q] of [['int', 'total'], ['half', 'total'], ['half', 'diff'], ['quarter', 'total'], ['quarter', 'diff'], ['eighth', 'diff'], ['eighth', 'less'], ['int', 'diff']]) for (const c of many('linePlot', { axis, question: q }, 25)) {
    const svg = c.blocks.find((b) => b.t === 'svg').svg;
    const ticks = [...svg.matchAll(/<line x1="([\d.]+)" x2="\1" y1="[\d.]+" y2="[\d.]+" stroke="#000" stroke-width="1"\/>/g)].map((m) => Number(m[1]));
    const xs = [...svg.matchAll(/<path d="M([\d.]+) [\d.]+ L([\d.]+) /g)].map((m) => (Number(m[1]) + Number(m[2])) / 2);
    const counts = ticks.map((tx) => xs.filter((x) => Math.abs(x - tx) < 0.2).length);
    const den = { int: 1, half: 2, quarter: 4, eighth: 8 }[axis]; const min = ({ int: 0, half: 5, quarter: 0, eighth: 0 })[axis];
    const title = /<text [^>]*font-weight="bold"[^>]*>([^<]*)</.exec(svg)[1]; const startShift = (title === 'Length of Ribbon in Inches') ? 1 : min;
    const vals = ticks.map((_, i) => F.frac(startShift * den + i, den));
    let want;
    if (q === 'total') want = counts.reduce((s, n, i) => F.add(s, F.mul(F.frac(n, 1), vals[i])), F.frac(0, 1));
    else if (q === 'diff') { const used = counts.map((n, i) => (n ? i : -1)).filter((i) => i >= 0); want = F.sub(vals[used[used.length - 1]], vals[used[0]]); }
    else want = F.frac(counts.reduce((s, n, i) => s + (i < den / 2 ? n : 0), 0), 1);
    assert.strictEqual(c.answer, F.show(want), `${axis}/${q}`);
  }
});

test('grade 4 skills: arithmetic, equations, conversions and geometry facts', () => {
  for (const op of ['add', 'sub']) for (const c of many('g4AddSub', { op, a: [3, 6], b: [3, 6] })) { const m = /([\d,]+) ([+−]) ([\d,]+) =/.exec(C.plain(centerOf(c))); assert.strictEqual(m[2] === '+' ? num(m[1]) + num(m[3]) : num(m[1]) - num(m[3]), num(c.answer)); assert.ok(num(c.answer) > 0); }
  for (const c of many('g4NumToWord', {})) { const n = num(/Write ([\d,]+) in word form/.exec(plainOf(c))[1]); assert.strictEqual(wordsToNumber(c.answer), n); }
  for (const c of many('g4WordToStd', {})) { const w = /Write (.+) in standard form/.exec(plainOf(c))[1]; assert.strictEqual(num(c.answer), wordsToNumber(w)); }
  for (const c of many('g4Expanded', { digits: [4, 6] })) { const n = num(/Write ([\d,]+) in expanded form/.exec(plainOf(c))[1]); assert.strictEqual(c.answer.split(' + ').reduce((s, x) => s + num(x), 0), n); }
  for (const c of many('g4Expanded', { digits: [4, 6], reverse: true })) { const terms = /Write (.+) in standard form/.exec(plainOf(c))[1].split(' + '); assert.strictEqual(terms.reduce((s, x) => s + num(x), 0), num(c.answer)); }
  for (const c of many('g4Equation')) { const [eq] = c.answer.split('; '); const m = /^(\d+) ([×÷−]) (\w+|\d+) = (\w+|\d+)$/.exec(eq); const t = plainOf(c); const nums = [...t.matchAll(/\d+/g)].map((x) => Number(x[0])); const spelled = { 2: 'twice', 3: 'three times', 4: 'four times' }; [m[1], /^\d+$/.test(m[3]) ? m[3] : null, /^\d+$/.test(m[4]) ? m[4] : null].filter(Boolean).forEach((x) => assert.ok(nums.includes(Number(x)) || t.includes(spelled[Number(x)] || '@@') || t.includes(`${x} times`), `${x} should be in the story: ${t}`)); const val = Number(c.answer.split('= ').pop().replace('°', '')); const a = Number(m[1]); const bb = /^\d+$/.test(m[3]) ? Number(m[3]) : null; if (m[2] === '×') assert.strictEqual(a * bb, val); else if (m[2] === '÷') assert.strictEqual(a / bb, val); else assert.strictEqual(a - val, Number(m[4])); }
  for (const kind of ['m-mm', 'km-m', 'kg-g', 'L-mL', 'hr-min', 'ft-in', 'yd-ft', 'gal-qt', 'lb-oz']) for (const c of many('g4UnitTable', { kind })) { const f = { 'm-mm': 1000, 'km-m': 1000, 'kg-g': 1000, 'L-mL': 1000, 'hr-min': 60, 'ft-in': 12, 'yd-ft': 3, 'gal-qt': 4, 'lb-oz': 16 }[kind]; c.answer.split('; ').forEach((x) => { const [a, bb] = x.split(' → ').map(num); assert.strictEqual(a * f, bb); }); }
  for (const kind of ['sub3', 'mulAdd', 'addSub', 'groupsLeft']) for (const c of many('g4MultiStep', { kind }, 60)) { const n = c.meta.nums; n.forEach((x) => assert.ok(new RegExp(`\\b${x}\\b`).test(plainOf(c)), `${x} in ${plainOf(c)}`)); const want = kind === 'sub3' ? n[0] - n[1] - n[2] : kind === 'mulAdd' ? n[0] * n[1] + n[2] : kind === 'addSub' ? n[0] + n[1] - n[2] : n[0] * n[1] - n[2]; assert.strictEqual(num(c.answer), want); assert.ok(want > 0); }
  for (const c of many('g4Convert', {}, 120)) { const { n, mult } = c.meta; assert.ok(new RegExp(`\\b${n}\\b`).test(plainOf(c)), plainOf(c)); assert.strictEqual(num(c.answer.split(' ')[0]), n * mult, plainOf(c)); }
  for (const kind of ['full', 'need']) for (const c of many('g4Remainder', { kind }, 60)) { const { T, k } = c.meta; const q = Math.floor(T / k); const r2 = T % k; assert.ok(r2 > 0); [T, k].forEach((x) => assert.ok(new RegExp(`\\b${x}\\b`).test(plainOf(c)), plainOf(c))); assert.ok(c.answer.startsWith(kind === 'need' ? `${q + 1} ` : `${q} full`), c.answer); }
  for (const op of ['add', 'sub']) for (const c of many('g4MixedWord', { op }, 60)) { const { w1, n1, w2, n2, d } = c.meta; assert.ok(plainOf(c).includes(`${n1}/${d}`) && plainOf(c).includes(`${n2}/${d}`)); const a = F.frac(w1 * d + n1, d); const bb = F.frac(w2 * d + n2, d); assert.strictEqual(c.answer, F.show(op === 'add' ? F.add(a, bb) : F.sub(a, bb))); assert.strictEqual(c.meta.op, op); }
  for (const c of many('g4FracWordMul', {}, 60)) { const { n, d, k } = c.meta; assert.ok(plainOf(c).includes(`${n}/${d}`)); assert.ok(new RegExp(`\\b${k}\\b`).test(plainOf(c))); assert.strictEqual(c.answer, F.show(F.mul(F.frac(k, 1), F.frac(n, d)))); }
  for (const c of many('g4Time', {}, 80)) {
    const t = (x) => `${Math.floor(x / 60)}:${String(x % 60).padStart(2, '0')}`;
    if (c.meta && c.meta.kind === 'end') { const { start, el } = c.meta; assert.ok(plainOf(c).includes(t(start))); assert.strictEqual(c.answer, t(start + el)); const hh = Math.floor(el / 60); const mm = el % 60; if (hh) assert.ok(plainOf(c).includes(`${hh} hour`)); if (mm) assert.ok(plainOf(c).includes(`${mm} minutes`)); continue; }
    const m = [...plainOf(c).matchAll(/(\d+):(\d\d)/g)].map((x) => Number(x[1]) * 60 + Number(x[2])); const el = m[1] - m[0]; const hh = Math.floor(el / 60); const mm = el % 60; assert.strictEqual(c.answer, `${hh ? `${hh} hour${hh > 1 ? 's' : ''} ` : ''}${mm ? `${mm} minutes` : ''}`.trim()); assert.ok(el > 0);
  }
  for (const c of many('g4AngleAdd', {}, 80)) {
    const t = plainOf(c);
    if (c.meta.kind === 'sum') { const { a, b } = c.meta; assert.ok(t.includes(`${a}°`) && t.includes(`${b}°`)); assert.strictEqual(parseInt(c.answer.split('x = ').pop(), 10), a + b); } else { const { total, a } = c.meta; assert.ok(t.includes(`measures ${a}°`)); assert.ok(a < total); assert.strictEqual(parseInt(c.answer.split('x = ').pop(), 10), total - a); }
  }
  for (const c of many('g4Patterns', {}, 80)) {
    if (c.meta.kind === 'fromRule') { const { rule, step, start } = c.meta; const seq = c.answer.split(', ').map(Number); assert.strictEqual(seq.length, 5); assert.strictEqual(seq[0], start); seq.slice(1).forEach((x, i) => assert.strictEqual(x - seq[i], rule === 'add' ? step : -step)); assert.ok(seq.every((x) => x > 0)); assert.ok(plainOf(c).includes(`${rule} ${step}`)); continue; }
    const seq = C.plain(centerOf(c)).split(', ').map((x) => num(x)).filter((x) => !Number.isNaN(x)); const [x4, x5] = c.answer.split(';')[0].split(', ').map(num); const d = seq[1] - seq[0]; if (c.answer.includes('multiply')) { assert.strictEqual(seq[1] / seq[0], x4 / seq[3]); assert.strictEqual(x5, x4 * (seq[1] / seq[0])); } else { assert.strictEqual(seq[3] + d, x4); assert.strictEqual(x4 + d, x5); }
  }
  for (const c of many('g4Factors', { kind: 'circlePrime' })) { const list = c.meta.list; const isP = (n) => { for (let i = 2; i * i <= n; i++) if (n % i === 0) return false; return n > 1; }; assert.deepStrictEqual(c.answer.split(', ').map(Number), list.filter(isP).sort((x, y) => x - y)); assert.ok(list.some((x) => !isP(x)) && list.some(isP)); }
  for (const c of many('g4Factors', { kind: 'multipleOf' }, 60)) { const { n, d, yes } = c.meta; assert.strictEqual(n % d === 0, yes); assert.ok(c.answer.startsWith(yes ? 'Yes' : 'No')); assert.ok(plainOf(c).includes(`${n} a multiple of ${d}`)); }
  for (const c of many('g4ClassifyTri', { kind: 'both' })) { const a = [...plainOf(c).matchAll(/(\d+) cm/g)].map((m) => Number(m[1])); const s = [...a].sort((x, y) => x - y); const same = new Set(a).size; const sides = same === 1 ? 'equilateral' : same === 2 ? 'isosceles' : 'scalene'; const angle = s[0] ** 2 + s[1] ** 2 === s[2] ** 2 ? 'right' : s[0] ** 2 + s[1] ** 2 > s[2] ** 2 ? 'acute' : 'obtuse'; assert.strictEqual(c.answer, `${sides} and ${angle}`); }
  for (const c of many('g4FracDecimal', { kind: 'decToFracTenth' })) { const n = C.plain(c.blocks[0].seg).match(/0\.(\d)/)[1]; assert.strictEqual(c.answer, `${n}/10`); }
  for (const c of many('g4Perimeter', { kind: 'perimeter' })) { const t = [...c.blocks.find((b) => b.t === 'svg').svg.matchAll(/<text [^>]*>([^<]*)<\/text>/g)].map((m) => num(m[1])); assert.strictEqual(num(c.answer), 2 * (t[0] + t[2])); }
  for (const c of many('g4Perimeter', { kind: 'area' })) { const t = [...c.blocks.find((b) => b.t === 'svg').svg.matchAll(/<text [^>]*>([^<]*)<\/text>/g)].map((m) => num(m[1])); assert.strictEqual(num(c.answer), t[0] * t[2]); }
  for (const c of many('g4Perimeter', { kind: 'missing' })) { const m = /perimeter of a rectangle is (\d+) .*length is (\d+)/.exec(plainOf(c)); assert.strictEqual(num(c.answer.split(' ')[0]), Number(m[1]) / 2 - Number(m[2])); }
  for (const c of many('g4ClassifyTri', { kind: 'angles' })) { const a = [...plainOf(c).matchAll(/(\d+)°/g)].map((m) => Number(m[1])); assert.strictEqual(a[0] + a[1] + a[2], 180); assert.strictEqual(c.answer, a.includes(90) ? 'right' : a.some((x) => x > 90) ? 'obtuse' : 'acute'); }
  for (const c of many('g4ClassifyTri', { kind: 'sides' })) { const a = [...plainOf(c).matchAll(/(\d+) cm/g)].map((m) => Number(m[1])); const same = new Set(a).size; assert.strictEqual(c.answer, same === 1 ? 'equilateral' : same === 2 ? 'isosceles' : 'scalene'); }
  for (const c of many('g4Angles')) { const svg = c.blocks.find((b) => b.t === 'svg').svg; const labels = [...svg.matchAll(/font-weight="bold" fill="#000">([abc])</g)].map((m) => m[1]); assert.deepStrictEqual(labels, ['a', 'b', 'c']); assert.strictEqual(new Set(c.answer.split('; ').slice(0, 3).map((x) => x.split(': ')[1])).size, 3); assert.strictEqual((svg.match(/<polyline /g) || []).length, 1, 'exactly one right angle drawn'); }
  for (const c of many('g4Triangles')) { const nRight = (c.blocks[1].svg.match(/<polyline /g) || []).length; const nTicks = c.answer.split('; ').filter((x) => /blue/.test(x)).length; assert.strictEqual(nRight, nTicks); assert.ok(/green/.test(c.answer) && /blue/.test(c.answer)); }
  for (const c of many('g4EquivMissing')) { const ex = centerOf(c); const fr = ex.find((s) => s.f).f; const den = Number(ex[ex.length - 1].replace(/\D/g, '')); const k = den / fr[1]; assert.ok(Number.isInteger(k) && k >= 2); assert.strictEqual(parseInt(c.answer, 10), fr[0] * k); }
  for (const c of many('g4Equiv')) { const g = c.blocks[0].seg.find((s) => s.f).f; const base = F.frac(g[0], g[1]); c.answer.replace(/ \(.*$/, '').split(', ').forEach((x) => { const [a, bb] = x.split('/').map(Number); const fr = F.frac(a, bb); assert.deepStrictEqual(fr, base); assert.notStrictEqual(`${a}/${bb}`, `${g[0]}/${g[1]}`); }); }
  for (const c of many('g4EquivLine')) c.answer.split('; ').forEach((x) => { const [l, r] = x.split(' = ').map((y) => y.split('/').map(Number)); assert.strictEqual(l[0] * r[1], r[0] * l[1]); });
  for (const c of many('g4MulWhole')) { const ex = centerOf(c); const fr = ex.find((s) => s.f).f; assert.strictEqual(c.answer, F.show(F.mul(F.frac(Number(ex[0]), 1), F.frac(...fr)))); }
  for (const c of many('g4MixedImproper')) { const t = c.blocks[0].seg; const fr = t.find((s) => s.f); if (fr) { const w = Math.floor(fr.f[0] / fr.f[1]); assert.strictEqual(c.answer, `${w} ${fr.f[0] - w * fr.f[1]}/${fr.f[1]}`); } else { const m = t.find((s) => s.m).m; assert.strictEqual(c.answer, `${m[0] * m[2] + m[1]}/${m[2]}`); } }
  for (const c of many('g4FracDecimal', { kind: 'tenth' })) { const n = C.plain(c.blocks[0].seg).match(/(\d+)\/10/)[1]; assert.strictEqual(c.answer, `0.${n}`); }
  for (const c of many('g4FracDecimal', { kind: 'hundredth' })) { const n = Number(C.plain(c.blocks[0].seg).match(/(\d+)\/100/)[1]); assert.strictEqual(Number(c.answer), n / 100); }
  for (const c of many('g4FracDecimal', { kind: 'decToFrac' })) { const n = C.plain(c.blocks[0].seg).match(/0\.(\d+)/)[1]; assert.strictEqual(c.answer, `${n}/100`); }
  for (const c of many('g4Factors', { kind: 'list' })) { const n = Number(/factors of (\d+)/.exec(plainOf(c))[1]); const fs = []; for (let i = 1; i <= n; i++) if (n % i === 0) fs.push(i); assert.strictEqual(c.answer, fs.join(', ')); }
  for (const c of many('g4Factors', { kind: 'prime' })) { const n = Number(/Is (\d+) a prime/.exec(plainOf(c))[1]); let prime = n > 1; for (let i = 2; i * i <= n; i++) if (n % i === 0) prime = false; assert.strictEqual(c.answer.startsWith('prime'), prime, `${n}`); }
  for (const c of many('g4Symmetry')) { const svg = c.blocks.find((b) => b.t === 'svg').svg; assert.ok(/^\d/.test(c.answer)); assert.ok(svg.includes('<polygon')); }
  for (const c of many('g4DecomposeFrac', { kind: 'blank' })) { const ex = centerOf(c); const n = ex[0].f[0]; const terms = ex.filter((s) => s.f).length - 1 + ex.filter((s) => s.sp).length; assert.strictEqual(terms, n, 'unit fractions add up to the fraction'); }
  for (const c of many('g4DecomposeFrac', { kind: 'ways' })) { const fr = c.blocks[0].seg.find((s) => s.f).f; c.answer.replace(/ \(.*$/, '').split('; ').forEach((x) => { const [a, bb] = x.split(' + ').map((y) => Number(y.split('/')[0])); assert.strictEqual(a + bb, fr[0]); }); }
});

test('Spiral Review pages render through the app, are pinned to a seed, and carry no inline styles', async () => {
  const { request, createApp, resetDb, createUser, login } = require('./helpers');
  await resetDb();
  await createUser({ username: 'teacher@example.com' });
  const agent = request.agent(createApp());
  await login(agent, 'teacher@example.com');
  const form = await agent.get('/math/spiral-review?grade=5&practice=7');
  assert.strictEqual(form.status, 200);
  assert.match(form.text, /name="grade"/); assert.match(form.text, /name="practice"/); assert.match(form.text, /Practice 30/);
  assert.match((await agent.get('/')).text, /Spiral Review/);
  assert.match((await agent.get('/')).text, /\/math\/spiral-review/);
  const page = await agent.get('/math/spiral-review/worksheet?grade=5&practice=7&seed=9&key=1');
  assert.strictEqual(page.status, 200);
  assert.strictEqual((page.text.match(/class="sp-box"/g) || []).length, 10);
  assert.match(page.text, /Practice 7/); assert.ok(!/>Test \d/.test(page.text)); assert.match(page.text, /Answer Key/);
  assert.ok(!/\sstyle=/.test(page.text.replace(/<svg[\s\S]*?<\/svg>/g, '')), 'CSP forbids inline styles');
  assert.ok(!/<script/i.test(page.text.replace(/<script src="\/static\/js\/app\.js[^"]*"[^>]*><\/script>/g, '')), 'no inline scripts');
  const sheetOf = (html) => html.match(/<article class="sheet spiral-sheet">[\s\S]*?<\/article>/)[0];
  assert.strictEqual(sheetOf(page.text), sheetOf((await agent.get('/math/spiral-review/worksheet?grade=5&practice=7&seed=9&key=1')).text), 'same seed, same sheet');
  assert.strictEqual((await agent.get('/math/spiral-review/worksheet?grade=5&test=7&seed=9&key=0')).text.includes('Answer Key'), false);
  const three = await agent.get('/math/spiral-review/worksheet?grade=4&practice=12&seed=3&pages=3&key=0');
  assert.strictEqual((three.text.match(/class="sp-box"/g) || []).length, 30);
  assert.strictEqual((three.text.match(/<article class="sheet spiral-sheet">/g) || []).length, 3);
  const redirect = await agent.get('/math/spiral-review/worksheet?grade=4&practice=2');
  assert.strictEqual(redirect.status, 302); assert.match(redirect.headers.location, /seed=\d+/);
  // hostile or odd input falls back safely
  const odd = await agent.get('/math/spiral-review/worksheet?grade=<script>&practice=999&pages=-3&seed=5');
  assert.ok([200, 422].includes(odd.status)); assert.ok(!odd.text.includes('<script>alert'));
  assert.strictEqual((await agent.get('/math/spiral-review/worksheet?grade=9&practice=3&seed=5&key=0')).status, 200);
});

test('Spiral Review sheets can be saved to the library and re-opened by URL', async () => {
  const sheets = require('../src/lib/sheets');
  assert.ok(sheets.fromUrl('/math/spiral-review/worksheet?grade=5&test=3&seed=42&key=1'));
  assert.ok(sheets.fromUrl('/math/spiral-review/worksheet?grade=4&test=30&seed=42&pages=2'));
  assert.strictEqual(sheets.fromUrl('/math/spiral-review/worksheet?grade=5&test=3'), null, 'unpinned sheets are not saved');
  assert.strictEqual(sheets.fromUrl('/math/spiral-review/worksheet?grade=5&test=3&seed=1&x=' + 'a'.repeat(700)), null);
});

test('older saved links that use ?test= still open the same practice sheet', () => {
  const sheets = require('../src/lib/sheets');
  const a = sheets.build('/math/spiral-review/worksheet', { grade: '5', test: '9', seed: '77' });
  const b = sheets.build('/math/spiral-review/worksheet', { grade: '5', practice: '9', seed: '77' });
  assert.deepStrictEqual(a.locals.pages, b.locals.pages);
  assert.strictEqual(a.subtitle, 'Spiral Review: Grade 5, Practice 9');
});

test('banks are wide: many different stories per skill, and one practice number is not always the same sheet', () => {
  const names = 'Zach|AC|Screech|Kelly|Lisa|Jessie';
  const norm = (t) => t.replace(new RegExp(`\\b(${names})\\b`, 'g'), 'N').replace(/\$?\d[\d,.]*(\/\d+)?/g, '#').replace(/\b(he|she|his|her|him|himself|herself)\b/gi, 'p');
  const distinct = (id, params = {}) => { const set = new Set(); for (let i = 0; i < 400; i++) { try { set.add(norm(plainOf(run(id, params, i * 17 + 3)))); } catch (e) { /* skip */ } } return set.size; };
  const MIN = { moneyDiff: 30, moneyChange: 12, moneyThree: 8, moneyBeforeTax: 4, decWordMulCompare: 6, decWordTimes: 6, cmToM: 5, convertWord: 9, fwAddLike: 8, fwSubTwo: 5, fwAddUnlike: 8, mwAdd: 3, mwSub: 4, fracOfFracWord: 6, fracOfWholeWord: 4, mixedFracWordMul: 8, fracDivWordMixed: 5, divBetween: 6, unitFracDivWord: 20, servingsWord: 30, servingsDaysWord: 15, g4Equation: 18, g4MultiStep: 14, g4Convert: 14, g4Remainder: 6, g4MixedWord: 4, g4FracWordMul: 4, g4Time: 3, g4Factors: 5, g4Patterns: 3, g4LinePoints: 10, shapeClues: 1 };
  for (const [id, min] of Object.entries(MIN)) assert.ok(distinct(id) >= min, `${id}: only ${distinct(id)} different stories (want ${min}+)`);
  const icons = new Set(); for (let i = 0; i < 300; i++) for (const m of run('gridPath', {}, i).blocks.find((b) => b.t === 'svg').svg.matchAll(/font-family="[^"]*" text-anchor="middle">([^<]+)<\/text>/g)) icons.add(m[1]);
  assert.ok(icons.size >= 20, `${icons.size} pictures to place on a grid`);
  const clues = new Set(); for (let i = 0; i < 400; i++) clues.add(run('shapeClues', {}, i).answer); assert.ok(clues.size >= 10, `${clues.size} shapes described by clues`);
  // the same practice number gives different flavours of the same skill on different sheets
  for (const [grade, practice, box, skillWord, want] of [[4, 6, 6, 'g4Equation', 6], [4, 6, 7, 'g4MultiStep', 6], [5, 21, 3, 'moreOrLess', 3], [5, 19, 6, 'mixedFracWordMul', 6]]) {
    const seen = new Set();
    for (let seed = 1; seed <= 200; seed++) { const t = sp.buildTest(makeRng(seed * 31), { grade, test: practice }); seen.add(norm(plainOf(t.boxes[box - 1].parts[0]))); }
    assert.ok(seen.size >= want, `${skillWord} in G${grade} practice ${practice}: ${seen.size} variants`);
  }
  const fams = new Set(); for (let seed = 1; seed <= 200; seed++) { const t = sp.buildTest(makeRng(seed), { grade: 4, test: 6 }); fams.add(/times as many/.test(plainOf(t.boxes[5].parts[0])) ? 'times' : /twice|three times|four times/.test(plainOf(t.boxes[5].parts[0])) ? 'twice' : /each|into|packs|bags|pages/.test(plainOf(t.boxes[5].parts[0])) ? 'share/groups' : 'other'); }
  assert.ok(fams.size >= 3, 'the equation box swaps flavours: ' + [...fams]);
  // pinned flavours stay the most common one (the practice number still means something)
  let times = 0; for (let seed = 1; seed <= 200; seed++) { const t = sp.buildTest(makeRng(seed * 13), { grade: 4, test: 6 }); if (/times as many/.test(plainOf(t.boxes[5].parts[0]))) times++; }
  assert.ok(times >= 80, `the pinned flavour appears about half the time (${times}/200)`);
});

test('two boxes on one sheet rarely repeat the same flavour of a skill', () => {
  let same = 0; const flavours = new Set();
  for (let seed = 1; seed <= 200; seed++) {
    const t = sp.buildTest(makeRng(seed * 101), { grade: 4, test: 6 });
    const a = t.boxes[5].parts[0].flavour; const b = t.boxes[9].parts[0].flavour; flavours.add(a); flavours.add(b);
    if (a === b) same++;
  }
  assert.strictEqual(same, 0, 'a flavour already on the sheet is never reused while others remain');
  assert.ok(flavours.size >= 4, [...flavours].join(','));
});
