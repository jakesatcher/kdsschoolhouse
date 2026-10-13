'use strict';
// Grade 4 Spiral Review (rebuilt from the real 36 Test pages): new skills re-derived from what is printed or from `meta`.
const test = require('node:test');
const assert = require('node:assert');
const { makeRng } = require('../src/lib/generators/rng');
const sp = require('../src/lib/generators/spiral');
const skills = require('../src/lib/generators/spiral/skills');
const C = require('../src/lib/generators/spiral/core');
const F = require('../src/lib/generators/fractions');

const run = (id, params = {}, seed = 1) => skills[id](makeRng(seed), params);
const many = (id, params, n = 60) => Array.from({ length: n }, (_, i) => run(id, params, i * 7919 + 13));
const txt = (cell) => cell.blocks.map((b) => (b.seg ? C.plain(b.seg) : '')).join(' ');
const listOf = (cell) => cell.blocks.find((b) => b.t === 'list').rows;
const n = (s) => parseFloat(String(s).replace(/[,$]/g, ''));
const BAD = /undefined|NaN|\[object|null/;

test('grade 4 has practices 1-36 with 10 boxes each, and no picture shares a box with a second problem', () => {
  assert.deepStrictEqual(sp.testNumbers(4), Array.from({ length: 36 }, (_, i) => i + 1));
  for (const grade of [3, 4]) {
    for (const t of sp.testNumbers(grade)) {
      for (let seed = 1; seed <= 12; seed++) {
        const r = sp.buildTest(makeRng(seed * 5 + t), { grade, test: t });
        assert.strictEqual(r.boxes.length, 10);
        r.boxes.forEach((b) => {
          if (b.parts.length > 1) b.parts.forEach((c) => c.blocks.forEach((x) => assert.ok(!['svg', 'box', 'side'].includes(x.t), `G${grade}P${t}.${b.n}: picture in a shared box`)));
          b.parts.forEach((c) => { assert.ok(!BAD.test(String(c.answer))); c.blocks.forEach((x) => { if (x.seg) assert.ok(!BAD.test(C.plain(x.seg))); if (x.svg) assert.ok(!/NaN|undefined/.test(x.svg)); }); });
        });
      }
    }
  }
});

test('place value: times greater, dividing multiples of ten, decimals and fractions', () => {
  for (const c of many('g4TimesGreater', { k: [10, 100] })) { const ans = c.answer.split('; ').map(n); c.meta.rows.forEach((x, i) => assert.strictEqual(ans[i], x.form === 'greater' ? x.n * x.k : x.k)); }
  for (const c of many('g4PlaceDiv', { count: 4 })) { const ans = c.answer.split(', ').map(n); c.meta.eqs.forEach((e, i) => { assert.strictEqual(e.n / e.d, e.q); assert.strictEqual(ans[i], e.q); assert.ok(Number.isInteger(e.q)); }); }
  for (const c of many('g4UnitMul')) { const { a, b, d } = c.meta; assert.ok(a !== b); assert.strictEqual(c.answer, `${b} × 1/${d}`); }
  for (const c of many('g4EquivMul')) { const { first, second } = c.meta; assert.ok(F.frac(first.n, first.d).n === F.frac(first.n * first.k, first.d * first.k).n); const m = c.answer.split('/').map(Number); assert.strictEqual(m[0] * second.d, m[1] * second.n); }
  for (const k of ['g4TenthsHund', 'g4TenthsHund2']) for (const c of many(k)) { const { a, b, c: c2, d } = c.meta; assert.ok(a * 10 + b <= 100 || k === 'g4TenthsHund'); assert.strictEqual(c.answer, `${c2 * 10 + d}/100`); }
  for (const c of many('g4DecList')) { const ans = c.answer.split(', '); c.meta.nums.forEach((x, i) => assert.strictEqual(Number(ans[i]), x / 100)); }
  for (const c of many('g4CompareDec')) { const out = c.answer.split('; '); c.meta.pairs.forEach(([a, b], i) => { const sym = Number(a) === Number(b) ? '=' : Number(a) < Number(b) ? '<' : '>'; assert.strictEqual(out[i], `${a} ${sym} ${b}`); }); }
  for (const c of many('g4FracBars')) { const m = c.meta; if (m.op === 'add') assert.strictEqual(c.answer, F.show(F.frac(m.a + m.b, m.d))); else assert.strictEqual(c.answer, F.show(F.frac(m.n1 - m.a, m.d))); }
  for (const c of many('g4ShadeMult')) { assert.ok(c.meta.k < c.meta.d); assert.ok(c.answer.startsWith(`${c.meta.k}/${c.meta.d}`)); }
});

test('angles, lines, shapes and symmetry', () => {
  for (const c of many('g4MeasureAngle')) { const { deg } = c.meta; assert.ok(deg % 5 === 0 && deg >= 15 && deg <= 165); assert.strictEqual(c.answer, `${deg}°`); }
  for (const kind of ['type', 'measure']) for (const c of many('g4AngleNamed', { kind })) { const m = c.meta.m; if (kind === 'type') assert.strictEqual(c.answer, m < 90 ? 'acute' : m === 90 ? 'right' : 'obtuse'); else { assert.strictEqual(c.answer, `${180 - m}°`); assert.ok(txt(c).includes(`${m}°`)); } }
  for (const c of many('g4LineRel')) assert.ok(c.answer.startsWith(c.meta.kind === 'crossing' ? 'intersecting' : c.meta.kind));
  const TRI = { equilateral: 'acute', isosceles: 'acute', scalene: 'acute', rightIsosceles: 'right', rightScalene: 'right', obtuse: 'obtuse' };
  for (const kind of ['right', 'obtuse', 'acute']) for (const c of many('g4ShapeSet', { kind })) { const want = c.meta.kinds.map((k, i) => (TRI[k] === kind ? i + 1 : null)).filter(Boolean).join(', '); assert.strictEqual(c.answer, want); assert.ok(want.length > 0); }
  for (const c of many('g4ShapeSet', { kind: 'congruent' })) { const want = c.meta.kinds.map((k, i) => (['equilateral', 'isosceles', 'rightIsosceles'].includes(k) ? i + 1 : null)).filter(Boolean).join(', '); assert.strictEqual(c.answer, want); }
  for (const kind of ['quad', 'verts4']) for (const c of many('g4ShapeSet', { kind })) { const want = c.meta.list.map((x, i) => ((kind === 'quad' ? x === 4 : x >= 4) ? 'ABCDEFG'[i] : null)).filter(Boolean).join(' and '); assert.strictEqual(c.answer, want); assert.ok(want.length); }
  for (const c of many('g4PolyTable')) assert.strictEqual(c.answer.split('; ').length, 4);
  const SYM = { H: 2, X: 2, A: 1, T: 1, M: 1, W: 1, B: 1, E: 1, C: 1, D: 1, Z: 0, F: 0, R: 0, P: 0, L: 0 };
  for (const c of many('g4SymLetter')) assert.strictEqual(n(c.answer), SYM[c.meta.ch]);
  for (const c of many('g4AreaPerim')) { const { l, w } = c.meta; assert.ok(c.answer.startsWith(`Area ${l * w} `)); assert.ok(c.answer.includes(`Perimeter ${2 * (l + w)} `)); }
  for (const c of many('g4PerimVar')) { const { P, l, w } = c.meta; assert.strictEqual(P, 2 * (l + w)); assert.ok(txt(c).includes(`${P} `)); assert.ok(c.answer.startsWith(`${w} `)); }
});

test('patterns, time, line plots and word problems', () => {
  for (const c of many('g4RulePattern', { kind: 'twoStep' })) { const { seq, up, down } = c.meta; seq.forEach((v, i) => { if (i) assert.strictEqual(v - seq[i - 1], i % 2 ? up : -down); }); assert.ok(seq.every((v) => v > 0)); }
  for (const c of many('g4RulePattern', { kind: 'shape' })) { const { cyc, nth } = c.meta; assert.ok(txt(c).includes(`${nth}`)); assert.ok(cyc.length === 2 || cyc.length === 3); }
  for (const c of many('g4TimeSum')) { const { mins, total } = c.meta; assert.strictEqual(total, mins.reduce((a, b) => a + b)); assert.ok(c.answer.startsWith(`${total} minutes`)); mins.forEach((m) => assert.ok(txt(c).includes(`${m} minutes`))); }
  for (const q of ['less', 'diff', 'outlier']) for (const c of many('g4LinePlotQ', { q }, 80)) {
    const { counts } = c.meta; const keys = Object.keys(counts).map(Number).sort((a, b) => a - b);
    if (q === 'less') assert.strictEqual(c.meta.answerNum, keys.filter((k) => k < c.meta.t).reduce((a, k) => a + counts[k], 0));
    if (q === 'diff') assert.strictEqual(c.meta.answerNum, keys[keys.length - 1] - keys[0]);
    if (q === 'outlier') { const out = c.meta.out; assert.strictEqual(counts[out], 1); const others = keys.filter((k) => k !== out); assert.ok(others.every((k) => Math.abs(k - out) >= 2)); assert.ok(others[others.length - 1] - others[0] <= 2); }
    assert.strictEqual(n(c.answer), c.meta.answerNum);
  }
  for (const c of many('g4Word2', {}, 160)) {
    const m = c.meta; const a = n(c.answer);
    if (m.kind === 'boxesMinus') assert.strictEqual(a, ((m.boxes - m.gave) * m.total) / m.boxes);
    if (m.kind === 'divMinus') assert.strictEqual(a, m.total / m.per - m.gave);
    if (m.kind === 'mulAdd') assert.strictEqual(a, m.a * m.k + m.extra);
    if (m.kind === 'saveFrac') assert.strictEqual(a, m.total / m.d);
    if (m.kind === 'half') assert.strictEqual(a, (m.amt / 2) * m.w);
    if (m.kind === 'timesMore') assert.strictEqual(a, m.n * m.k);
    if (m.kind === 'roundTrip') assert.strictEqual(a, (m.m * 2) / 1000);
    if (m.kind === 'allowance') assert.strictEqual(Math.round(a * 100), m.cents * m.k);
    assert.ok(!BAD.test(txt(c)) && a > 0);
  }
  for (const c of many('g4FracWord', {}, 120)) { const m = c.meta; if (m.kind === 'addLike') assert.strictEqual(c.answer, F.show(F.frac(m.a + m.b, m.d))); if (m.kind === 'subLeft') { assert.strictEqual(c.answer, F.show(F.frac(m.d - m.a - m.b, m.d))); assert.ok(m.d - m.a - m.b > 0); } if (m.kind === 'sub3') assert.strictEqual(c.answer, F.show(F.frac(m.tot - m.x - m.y, m.d))); }
});

test('grade 4 and 3 sheets render through the app and print the practice number', async () => {
  const { request, createApp, resetDb, createUser, login } = require('./helpers');
  await resetDb();
  await createUser({ username: 'teacher@example.com' });
  const agent = request.agent(createApp());
  await login(agent, 'teacher@example.com');
  for (const [g, t] of [[4, 1], [4, 31], [4, 36], [3, 36]]) {
    const page = await agent.get(`/math/spiral-review/worksheet?grade=${g}&practice=${t}&seed=9&key=1`);
    assert.strictEqual(page.status, 200, `G${g}P${t}`);
    assert.strictEqual((page.text.match(/class="sp-box"/g) || []).length, 10);
    assert.match(page.text, new RegExp(`Practice ${t}`)); assert.match(page.text, /Answer Key/);
  }
});
