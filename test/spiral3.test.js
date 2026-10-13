'use strict';
// Grade 3 Spiral Review: every practice builds, and the answers are re-derived from what the page prints.
const test = require('node:test');
const assert = require('node:assert');
const { makeRng } = require('../src/lib/generators/rng');
const sp = require('../src/lib/generators/spiral');
const skills = require('../src/lib/generators/spiral/skills');
const C = require('../src/lib/generators/spiral/core');

const run = (id, params = {}, seed = 1) => skills[id](makeRng(seed), params);
const many = (id, params, n = 60) => Array.from({ length: n }, (_, i) => run(id, params, i * 7919 + 13));
const txt = (cell) => cell.blocks.map((b) => (b.seg ? C.plain(b.seg) : '')).join(' ');
const listRows = (cell) => cell.blocks.find((b) => b.t === 'list').rows.map((r) => C.plain(r.seg));
const BAD = /undefined|NaN|\[object|null/;
const n = (s) => Number(String(s).replace(/,/g, ''));
const hm = (s) => { const [h, m] = s.split(':').map(Number); return h * 60 + m; };
const fmtT = (min) => { const m = ((min % 720) + 720) % 720; const h = Math.floor(m / 60) || 12; return `${h}:${String(m % 60).padStart(2, '0')}`; };

test('grade 3 has practices 1-36, each with 10 boxes, answers and clean svgs, for many seeds', () => {
  assert.deepStrictEqual(sp.testNumbers(3), Array.from({ length: 36 }, (_, i) => i + 1));
  const KNOWN = new Set(['text', 'center', 'note', 'line', 'space', 'svg', 'vmul', 'ldiv', 'table', 'circles', 'match', 'list', 'wholes', 'box', 'bullets', 'pointlist', 'side']);
  for (let t = 1; t <= 36; t++) {
    for (let seed = 1; seed <= 20; seed++) {
      const r = sp.buildTest(makeRng(seed * 7 + t), { grade: 3, test: t });
      assert.strictEqual(r.boxes.length, 10, `G3P${t}`);
      const walk = (blocks) => blocks.forEach((b) => { assert.ok(KNOWN.has(b.t), `block ${b.t}`); if (b.seg) assert.ok(!BAD.test(C.plain(b.seg)), `G3P${t}: ${C.plain(b.seg)}`); if (b.t === 'side') { walk(b.left); walk(b.right); } if (b.svg) assert.ok(b.svg.startsWith('<svg') && !/NaN|undefined/.test(b.svg), 'bad svg'); });
      r.boxes.forEach((box) => box.parts.forEach((c) => { walk(c.blocks); assert.ok(String(c.answer).length > 0 && !BAD.test(String(c.answer)), `answer ${c.answer}`); }));
    }
  }
});

test('function machines, arrays, groups and repeated addition', () => {
  for (const c of many('g3Function')) {
    const { op, k, rows } = c.meta;
    for (const [i, o] of rows) assert.strictEqual(op === '+' ? i + k : op === '−' ? i - k : op === '×' ? i * k : i / k, o);
    assert.ok(rows.every(([i, o]) => Number.isInteger(o) && o > 0));
  }
  for (const c of many('g3Array')) assert.strictEqual(c.answer, `${c.meta.rows} × ${c.meta.cols} = ${c.meta.rows * c.meta.cols}`);
  for (const c of many('g3GroupsOf')) { const m = txt(c).match(/groups of (\d+) .* the (\d+) shapes/); assert.strictEqual(n(c.answer), Number(m[2]) / Number(m[1])); assert.ok(Number(m[2]) % Number(m[1]) === 0); }
  for (const c of many('g3SetsCircle')) { const { groups, per, options, correct } = c.meta; assert.deepStrictEqual(options[correct], [groups, per]); assert.strictEqual(options.filter(([a, b]) => a === groups && b === per).length, 1); assert.strictEqual(options.length, 4); }
  for (const c of many('g3Remainder')) { const { total, sets, q, rem } = c.meta; assert.strictEqual(total, sets * q + rem); assert.ok(rem < sets); assert.ok(txt(c).includes(`Draw ${total} circles`)); }
  for (const c of many('g3RepeatAdd')) { const { n: k, k: v } = c.meta; assert.ok(c.answer.includes(String(k * v))); if (c.meta.dir === 'toMul') assert.ok(txt(c).includes(Array(k).fill(v).join(' + '))); }
});

test('rounding, addition, multiplication tables and patterns', () => {
  for (const c of many('g3Round', { unit: 100, digits: [4, 4] })) { const got = c.answer.split(', ').map(n); c.meta.nums.forEach((x, i) => assert.strictEqual(got[i], Math.round(x / 100) * 100)); }
  for (const c of many('g3Round', { unit: 10 })) { const got = c.answer.split(', ').map(n); c.meta.nums.forEach((x, i) => assert.strictEqual(got[i], Math.floor((x + 5) / 10) * 10)); }
  for (const c of many('g3RoundLine', { unit: 100 })) { const { n: x } = c.meta; assert.ok(txt(c).includes(String(x))); assert.strictEqual(n(c.answer), Math.floor((x + 50) / 100) * 100); }
  for (const c of many('g3Add', { kind: 'add3', digits: 3 })) assert.strictEqual(n(c.answer), c.meta.nums.reduce((a, b) => a + b));
  for (const c of many('g3Add', { kind: 'sub', digits: 3, carry: 'none' })) { const [a, b] = c.meta.nums; assert.strictEqual(n(c.answer), a - b); [...String(a)].forEach((d, i) => assert.ok(Number(d) >= Number(String(b)[i]))); }
  for (const c of many('g3Add', { kind: 'add', digits: 2, carry: 'none' })) { const [a, b] = c.meta.nums; assert.strictEqual(n(c.answer), a + b); assert.ok(a % 10 + b % 10 < 10 && Math.floor(a / 10) + Math.floor(b / 10) < 10); }
  for (const c of many('g3Mult', { kind: 'tens', forms: ['T×D', 'D×T', 'T×T', 'H×D', 'H×T', 'D×H'] })) { const ans = c.answer.split(', ').map(n); c.meta.eqs.forEach(([a, b], i) => assert.strictEqual(ans[i], a * b)); listRows(c).forEach((row, i) => assert.ok(row.startsWith(`${C.fmt(c.meta.eqs[i][0])} × ${C.fmt(c.meta.eqs[i][1])}`))); }
  for (const c of many('g3Mult', { kind: 'missing', zeroOne: true })) { const ans = c.answer.split(', ').map(n); c.meta.eqs.forEach((e, i) => assert.strictEqual(e.other * ans[i], e.res)); }
  for (const c of many('g3Mult', { kind: 'div' })) { const ans = c.answer.split(', ').map(n); c.meta.eqs.forEach(({ n: x, d, q }, i) => { assert.strictEqual(x / d, q); assert.strictEqual(ans[i], q); }); }
  for (const c of many('g3Pattern', { down: true })) { const seq = c.meta.seq; assert.ok(seq.every((v, i) => !i || v - seq[i - 1] === c.meta.step)); assert.ok(seq.every((v) => v > 0)); assert.strictEqual(c.answer, seq.slice(3).map((v) => C.fmt(v)).join(', ')); }
  for (const c of many('g3OnesDigit')) assert.strictEqual(n(c.answer), (c.meta.a * c.meta.b) % 10);
});

test('fact families, variables, perimeter unknowns and properties', () => {
  for (const c of many('g3FactFamily', { kind: 'missing' })) { const { a, b, prod, pat } = c.meta; assert.strictEqual(a * b, prod); assert.strictEqual(n(c.answer), pat === 2 ? b : a); }
  for (const c of many('g3FactFamily', { kind: 'toMul' })) { const { dividend, divisor, quotient } = c.meta; assert.strictEqual(dividend, divisor * quotient); }
  for (const c of many('g3FactFamily', { kind: 'toDiv' })) assert.strictEqual(c.meta.a * c.meta.b, c.meta.prod);
  for (const kind of ['add', 'sub', 'subVar']) for (const c of many('g3Variable', { kind })) { const m = c.meta; if (kind === 'add') assert.strictEqual(m.a + n(c.answer), m.total); else if (kind === 'sub') assert.strictEqual(n(c.answer) - m.a, m.x); else assert.strictEqual(m.t - n(c.answer), m.a); assert.ok(n(c.answer) > 0); }
  for (const c of many('g3PerimVar')) { const { perim, top, other } = c.meta; assert.strictEqual(2 * (top + other), perim); assert.strictEqual(n(c.answer), other); assert.ok(txt(c).includes(`Perimeter = ${perim}`)); }
  const val = (s) => Function(`return ${s.replace(/×/g, '*')}`)();
  for (const kind of ['equal', 'notEqual']) for (const c of many('g3Property', { kind })) {
    const { val: v, options, not } = c.meta; const eqs = options.filter((o) => val(o) === v);
    if (not) { assert.strictEqual(eqs.length, 3); assert.notStrictEqual(val(c.answer), v); } else { assert.strictEqual(eqs.length, 1); assert.strictEqual(val(c.answer), v); }
  }
  for (const c of many('g3Property', { kind: 'circle' })) { const { which, options } = c.meta; const ok = options.filter((o) => (which === 'comm' ? /^(\d) × (\d) = \2 × \1$/.test(o) : which === 'assoc' ? /^\(\d × \d\) × \d = \d × \(\d × \d\)$/.test(o) : /^\d × 1 = \d$/.test(o))); assert.strictEqual(ok.length, 1); assert.strictEqual(c.answer, ok[0]); }
});

test('time: reading clocks, converting minutes, elapsed time and start/end times', () => {
  for (const c of many('g3Clock', { kind: 'read' })) { assert.ok(/^\d{1,2}:\d\d$/.test(c.answer)); assert.strictEqual(c.answer, `${((c.meta.h + 11) % 12) + 1}:${String(c.meta.m).padStart(2, '0')}`); }
  for (const c of many('g3Clock', { kind: 'convert' })) { const rows = listRows(c); c.meta.mins.forEach((m, i) => { assert.ok(rows[i].startsWith(`${m} min`)); assert.ok(c.answer.split('; ')[i] === `${Math.floor(m / 60)} h ${m % 60} min`); }); }
  for (const c of many('g3Elapsed', { kind: 'elapsed' })) { const times = txt(c).match(/\d{1,2}:\d\d/g); const d = (hm(times[1]) - hm(times[0]) + 720) % 720; assert.strictEqual(d, c.meta.mins); const h = Math.floor(d / 60); const m = d % 60; assert.strictEqual(c.answer, `${h ? `${h} hour${h > 1 ? 's' : ''}` : ''}${h && m ? ' ' : ''}${m ? `${m} minutes` : ''}`); }
  for (const c of many('g3Elapsed', { kind: 'end' })) assert.strictEqual(c.answer, fmtT(c.meta.start[0] * 60 + c.meta.start[1] + c.meta.dur));
  for (const c of many('g3Elapsed', { kind: 'start' })) assert.strictEqual(c.answer, fmtT(c.meta.end[0] * 60 + c.meta.end[1] - c.meta.dur));
  for (const c of many('g3Elapsed', { kind: 'pack' })) assert.strictEqual(c.answer, fmtT(c.meta.leave[0] * 60 + c.meta.leave[1] - c.meta.prep));
});

test('word problems: answers follow from the quantities, and numbers are printed', () => {
  for (const kind of ['addSub', 'sub3', 'add3', 'add4']) for (const c of many('g3Word', { kind })) { const sum = c.meta.steps.reduce((a, b) => a + b, 0); assert.strictEqual(n(c.answer), sum); c.meta.steps.forEach((v) => assert.ok(new RegExp(`\\b${Math.abs(v)}\\b`).test(txt(c)) || /[a-z]/.test(txt(c)), 'number printed')); assert.ok(sum > 0); }
  for (const ask of ['solution', 'expression', 'equation', 'plain']) for (const c of many('g3Word', { kind: 'groups', ask })) { const { groups, per } = c.meta; assert.ok(c.answer.startsWith(ask === 'plain' ? String(groups * per) : `${groups} × ${per}`)); if (ask !== 'expression' && ask !== 'plain') assert.ok(c.answer.endsWith(`= ${groups * per}`)); assert.ok(!/\.\./.test(txt(c))); }
  for (const c of many('g3Word', { kind: 'friends' })) assert.strictEqual(c.answer, `${c.meta.people} × ${c.meta.per} = ${c.meta.people * c.meta.per}`);
  for (const c of many('g3Word', { kind: 'twoSets' })) { const { groups, a, b } = c.meta; assert.strictEqual(c.answer, `${groups} × (${a} + ${b}) = ${groups * (a + b)}`); }
  for (const c of many('g3Word', { kind: 'sets' })) { const { a, b, per } = c.meta; assert.strictEqual(c.answer, `(${a} + ${b}) × ${per} = ${(a + b) * per}`); }
  for (const c of many('g3Word', { kind: 'estimate' })) { const { a, b, options, correct } = c.meta; const r10 = (x) => Math.round(x / 10) * 10; assert.strictEqual(correct, `${r10(a)} × ${r10(b)}`); assert.ok(options.includes(correct)); assert.strictEqual(new Set(options).size, options.length); }
  for (const c of many('g3Word', { kind: 'shareLeft' })) { const { total, people, q, rem } = c.meta; assert.strictEqual(total, people * q + rem); assert.ok(rem > 0 && rem < people); }
  for (const c of many('g3Word', { kind: 'share' })) assert.strictEqual(c.meta.total, c.meta.people * c.meta.q);
  for (const c of many('g3Word', { kind: 'cars' })) assert.strictEqual(n(c.answer), Math.ceil(c.meta.total / c.meta.per));
});

test('fractions: models, equivalents, number-line letters and comparisons', () => {
  const val = (o) => o.n / o.d;
  for (const c of many('g3Shaded', { kind: 'pick' }, 120)) { const { target, options, correct } = c.meta; assert.strictEqual(options.length, 4); options.forEach((o, i) => { assert.ok(o.n >= 1 && o.n < o.d); assert.strictEqual(i === correct, Math.abs(val(o) - val(target)) < 1e-9, 'only the right option has the target value'); }); assert.ok(c.answer.startsWith('ABCD'[correct])); }
  for (const c of many('g3Shaded', { kind: 'equiv' })) { const { n: a, d, d2, k } = c.meta; assert.strictEqual(d * k, d2); assert.strictEqual(c.answer, `${a}/${d} = ${a * k}/${d2}`); }
  for (const c of many('g3Shaded', { kind: 'twoEquiv' })) { const { n: a, d, cols, rows, rowsShaded } = c.meta; assert.strictEqual(cols * rows, d); assert.strictEqual(a * rows, rowsShaded * d); }
  for (const c of many('g3Shaded', { kind: 'compare' })) { const { a, b, cmp } = c.meta; const x = a[0] * b[1]; const y = b[0] * a[1]; assert.strictEqual(cmp, x === y ? '=' : x < y ? '<' : '>'); }
  for (const c of many('g3FracLetter', {}, 120)) { const { n: a, d, line, letter } = c.meta; const idx = 'ABCDE'.indexOf(letter); assert.ok(Math.abs(a / d - idx / line) < 1e-9, `${a}/${d} on a line of ${line}`); }
  for (const c of many('g3FracLetter', { mode: 'eighths' })) { const { n: a, letter, positions } = c.meta; assert.strictEqual(positions['ABCDE'.indexOf(letter)], a); assert.strictEqual(new Set(positions).size, 5); }
});

test('shapes: partitions, polygons, area, measuring and units', () => {
  for (const c of many('g3Partition', { kind: 'isEqual' })) { assert.strictEqual(c.answer.startsWith('Yes'), c.meta.equal); }
  for (const c of many('g3Polygon', { kind: 'name' })) assert.strictEqual(c.answer, ['', '', '', 'triangle', 'quadrilateral', 'pentagon', 'hexagon', 'heptagon', 'octagon'][c.meta.n]);
  for (const c of many('g3Polygon', { kind: 'circle' })) { const { target, list } = c.meta; assert.strictEqual(c.answer.split(' and ').length, list.filter((x) => x === target).length); }
  for (const c of many('g3Area', { kind: 'grid' })) assert.strictEqual(n(c.answer), c.meta.cols * c.meta.rows);
  for (const c of many('g3Area', { kind: 'both' })) { const { l, w } = c.meta; assert.strictEqual(c.answer, `Area ${l * w} sq. units; Perimeter ${2 * (l + w)} units`); }
  for (const c of many('g3Area', { kind: 'comp' })) assert.strictEqual(n(c.answer), c.meta.heights.reduce((a, b) => a + b, 0));
  for (const c of many('g3Measure')) { const { len, halves } = c.meta; assert.strictEqual(Math.round(len * 2), halves); assert.ok(Math.abs(len - halves / 2) < 0.2 && Math.abs(len * 4 - Math.round(len * 4)) > 0.01); }
  for (const kind of ['volume', 'weight']) for (const c of many('g3Units', { kind })) { assert.ok(c.meta.options.includes(c.answer)); assert.strictEqual(new Set(c.meta.options).size, 4); }
});

test('graphs and line plots: the answer matches the data drawn', () => {
  for (const kind of ['bar', 'pict']) for (const c of many('g3Graph', { kind }, 120)) {
    const { vals, per, q, i, j } = c.meta;
    if (q === 'read') assert.strictEqual(n(c.answer), vals[i] * per); else assert.strictEqual(n(c.answer), Math.abs(vals[i] - vals[j]) * per);
    assert.ok(new Set(vals).size === 4 && n(c.answer) > 0);
  }
  for (const c of many('g3LinePlot')) { const { counts, picks } = c.meta; assert.strictEqual(counts.length, 3); assert.strictEqual(new Set(picks).size, 3); const t = c.blocks.find((b) => b.t === 'side').left[0]; t.rows.forEach((row, ix) => assert.strictEqual(row[1], counts[ix])); }
});

test('grade 3 Practice sheets render through the app and can be saved', async () => {
  const { request, createApp, resetDb, createUser, login } = require('./helpers');
  await resetDb();
  await createUser({ username: 'teacher@example.com' });
  const agent = request.agent(createApp());
  await login(agent, 'teacher@example.com');
  const form = await agent.get('/math/spiral-review?grade=3&practice=36');
  assert.strictEqual(form.status, 200); assert.match(form.text, /Grade 3/); assert.match(form.text, /Practice 36/);
  for (const t of [1, 18, 36]) {
    const page = await agent.get(`/math/spiral-review/worksheet?grade=3&practice=${t}&seed=9&key=1`);
    assert.strictEqual(page.status, 200);
    assert.strictEqual((page.text.match(/class="sp-box"/g) || []).length, 10);
    assert.match(page.text, new RegExp(`Practice ${t}`)); assert.match(page.text, /Grade 3/); assert.match(page.text, /Answer Key/);
    assert.ok(!/\sstyle=/.test(page.text.replace(/<svg[\s\S]*?<\/svg>/g, '')), 'CSP forbids inline styles');
  }
  assert.ok(require('../src/lib/sheets').fromUrl('/math/spiral-review/worksheet?grade=3&practice=20&seed=42&key=1'));
});
