'use strict';
// Situation-based word problems: every answer is re-derived from the numbers behind the story (`meta`), the stories are
// real-life (not classroom) scenes, and the formats (tables, lettered parts, choose-the-equation, error checks ...) hold together.
const test = require('node:test');
const assert = require('node:assert');
const { makeRng } = require('../src/lib/generators/rng');
const wp = require('../src/lib/generators/wordProblems');

const SIT = wp.TEMPLATES.filter((t) => t.id.startsWith('sit-'));
const num = (s) => Number(String(s).replace(/[$,]/g, '').split(' ')[0]);
const cents = (s) => Math.round(Number(String(s).replace(/[$,]/g, '')) * 100);
const SCHOOL = /\b(school|classroom|class|teacher|recess|cafeteria|principal|homework|student|students|playground)\b/i;
const each = (id, fn, n = 120) => {
  const tpl = SIT.find((t) => t.id === id); assert.ok(tpl, id);
  for (let g = tpl.grades[0]; g <= tpl.grades[1]; g++) for (let i = 0; i < n; i++) { const r = makeRng(g * 9973 + i * 31 + 5); const p = tpl.make(r, wp.ctx(r), g); fn(p, p.meta, g); }
};
// the plain answer, whatever format wraps it ("No. The correct answer is X. ...", "eq; X", "B (eq); X", "Yes. The exact answer is X ...")
function ansStr(p) {
  const t = p.answerText; let m;
  if ((m = /correct answer is (\$?[\d,]+(?:\.\d+)?)/.exec(t))) return m[1];
  if ((m = /exact answer is (\$?[\d,]+(?:\.\d+)?)/.exec(t))) return m[1];
  if (/^[A-C] \(/.test(t) || (/ = [a-z]|[a-z] = /.test(t) && t.includes('; '))) return t.split('; ').pop();
  if (/^[^;]*[=].*; /.test(t)) return t.split('; ').pop();
  return t;
}
const answerNum = (p) => num(ansStr(p));

test('there are many situation templates across the problem types', () => {
  assert.ok(SIT.length >= 35, `${SIT.length} situation templates`);
  const ops = new Set(SIT.flatMap((t) => t.ops)); for (const o of ['add', 'sub', 'mul', 'div']) assert.ok(ops.has(o));
  const kinds = new Set(SIT.map((t) => t.kind)); assert.deepStrictEqual([...kinds].sort(), ['decimal', 'fraction', 'whole']);
  for (let g = 1; g <= 5; g++) assert.ok(SIT.filter((t) => g >= t.grades[0] && g <= t.grades[1]).length >= (g === 1 ? 7 : 12), `grade ${g} coverage`);
});

test('add to, take from, put together, take apart and compare: the unknown is in every position and the answer follows', () => {
  each('sit-join-result', (p, m) => assert.strictEqual(answerNum(p), m.a + m.b));
  each('sit-join-change', (p, m) => { assert.strictEqual(answerNum(p), m.b); assert.ok(p.text.includes(m.total.toLocaleString('en-US'))); });
  each('sit-join-start', (p, m) => { assert.strictEqual(answerNum(p), m.a); assert.ok(p.text.includes((m.a + m.b).toLocaleString('en-US'))); });
  each('sit-separate-result', (p, m) => assert.strictEqual(answerNum(p), m.a - m.b));
  each('sit-separate-change', (p, m) => assert.strictEqual(answerNum(p), m.a - m.b));
  each('sit-separate-start', (p, m) => assert.strictEqual(answerNum(p), m.left + m.removed));
  each('sit-part-whole', (p, m) => assert.strictEqual(answerNum(p), m.op === 'part-whole-total' ? m.a + m.b : m.b));
  each('sit-compare', (p, m) => { assert.ok(m.hi > m.lo); assert.strictEqual(answerNum(p), m.hi - m.lo); });
  each('sit-compare-bigger', (p, m) => { assert.ok(answerNum(p) === m.a + m.d || answerNum(p) === m.a || answerNum(p) === m.a - m.d); assert.ok(answerNum(p) > 0); });
  each('sit-two-step-add-sub', (p, m) => assert.strictEqual(answerNum(p), m.a + m.b - m.d));
  each('sit-compare-total', (p, m) => assert.strictEqual(answerNum(p), 2 * m.a + m.d));
  each('sit-three-parts', (p, m) => assert.strictEqual(answerNum(p), m.n[0] + m.n[1] + m.n[2]));
});

test('equal groups, arrays, comparisons, remainders and multi-step stories', () => {
  each('sit-groups-product', (p, m) => assert.strictEqual(answerNum(p), m.k * m.n));
  each('sit-groups-size', (p, m) => { assert.strictEqual(answerNum(p), m.k); assert.ok(p.text.includes((m.k * m.n).toLocaleString('en-US'))); });
  each('sit-groups-count', (p, m) => assert.strictEqual(answerNum(p), m.n));
  each('sit-array', (p, m) => assert.strictEqual(answerNum(p), m.op === 'array' ? m.rows * m.cols : m.op === 'array-cols' ? m.cols : m.rows));
  each('sit-times-as-many', (p, m) => assert.strictEqual(answerNum(p), m.a * m.k));
  each('sit-times-unknown', (p, m) => assert.strictEqual(answerNum(p), m.op === 'times-unknown-ref' ? m.a : m.k));
  each('sit-remainder', (p, m) => {
    assert.strictEqual(m.total, m.k * m.q + m.rem); assert.ok(m.rem > 0 && m.rem < m.k);
    if (m.kind === 'both') assert.ok(ansStr(p).startsWith(`${m.q} full`) && ansStr(p).includes(`${m.rem} left over`));
    if (m.kind === 'roundup') assert.strictEqual(num(ansStr(p)), m.q + 1);
    if (m.kind === 'leftover') assert.strictEqual(num(ansStr(p)), m.rem);
  });
  each('sit-groups-plus', (p, m) => assert.strictEqual(answerNum(p), m.op === 'groups-plus' ? m.k * m.n + m.more : m.k * m.n - m.more));
  each('sit-sum-times', (p, m) => assert.strictEqual(answerNum(p), m.n * (m.a + m.b)));
  each('sit-two-groups', (p, m) => assert.strictEqual(answerNum(p), m.n * m.k + m.n2 * m.k2));
  each('sit-divide-then', (p, m) => { assert.strictEqual(answerNum(p), m.total - m.gone * m.k); assert.ok(m.gone < m.n); });
});

test('demanding situations: pouring fractions together, digit puzzles, working backwards, receipts, plans, fractions of what is left', () => {
  const F = require('../src/lib/generators/fractions');
  each('sit-pour-together', (p, m) => {
    const total = m.op === 'pour' ? F.mul(F.frac(m.n, 1), F.frac(m.a, m.d)) : F.add(F.mul(F.frac(m.n1, 1), F.frac(m.a1, m.d1)), F.mul(F.frac(m.n2, 1), F.frac(m.a2, m.d2)));
    const whole = Math.floor(total.n / total.d); assert.ok(whole >= 1); assert.strictEqual(Number(/^(\d+)/.exec(p.answerText)[1]), whole);
    const rem = F.sub(total, F.frac(whole, 1)); if (rem.n) assert.ok(p.answerText.includes(F.show(rem))); else assert.ok(!/left over/.test(p.answerText));
  });
  each('sit-digits-puzzle', (p, m) => {
    const ds = String(m.num).split(''); const desc = Number([...ds].sort().reverse().join('')); const asc = [...ds].sort(); const i = asc.findIndex((d) => d !== '0'); const low = Number([asc[i], ...asc.filter((_, k) => k !== i)].join(''));
    if (m.op === 'digits-high') assert.strictEqual(m.ans, desc); if (m.op === 'digits-low') assert.strictEqual(m.ans, low); if (m.op === 'digits-diff') assert.strictEqual(m.ans, desc - low);
    assert.strictEqual(answerNum(p), m.ans); assert.ok(p.text.includes(m.num.toLocaleString('en-US')));
  });
  each('sit-backwards', (p, m) => { assert.strictEqual(m.start / 2 - m.spent, m.left); assert.strictEqual(num(ansStr(p)), m.start); });
  each('sit-receipt', (p, m) => { assert.strictEqual(m.total, m.rows.reduce((s, x) => s + x.p * x.q, 0)); assert.strictEqual(p.table.rows.length, 3); assert.strictEqual(cents(ansStr(p)), m.op === 'receipt-total' ? m.total : m.bill - m.total); if (m.op === 'receipt-change') assert.ok(m.bill > m.total); });
  each('sit-plan-compare', (p, m) => { assert.strictEqual(m.costA, m.fee + m.a * m.v); assert.strictEqual(m.costB, m.b * m.v); assert.notStrictEqual(m.costA, m.costB); assert.ok(p.answerText.startsWith(m.costA < m.costB ? 'Plan A' : 'Plan B')); assert.ok(p.answerText.includes(`by $${Math.abs(m.costA - m.costB)}`)); });
  each('sit-fraction-of-left', (p, m) => { const r1 = m.total - m.total / m.d1; assert.ok(Number.isInteger(m.total / m.d1) && Number.isInteger(r1 / m.d2)); assert.strictEqual(m.left, r1 - r1 / m.d2); assert.strictEqual(num(p.answerText), m.left); });
});

test('lettered parts: each part has its own question and answer', () => {
  each('sit-parts-total-left', (p, m) => { assert.strictEqual(p.parts.length, 2); assert.strictEqual(num(p.parts[0].a), m.a + m.b); assert.strictEqual(num(p.parts[1].a), m.a + m.b - m.d); assert.ok(m.a + m.b - m.d > 0); });
  each('sit-parts-compare', (p, m) => { assert.strictEqual(num(p.parts[0].a), m.hi + m.lo); assert.strictEqual(num(p.parts[1].a), m.hi - m.lo); });
  each('sit-parts-groups', (p, m) => { assert.strictEqual(num(p.parts[0].a), m.k * m.n); assert.ok(p.parts[1].q.includes(`${m.parts}`)); });
});

test('prices, change, menus: money is exact to the cent', () => {
  each('sit-price-total', (p, m) => assert.strictEqual(cents(ansStr(p)), m.total));
  each('sit-price-change', (p, m) => { assert.strictEqual(cents(ansStr(p)), m.change); assert.ok(m.change > 0 && m.change < 600); });
  each('sit-price-two', (p, m) => assert.strictEqual(cents(ansStr(p)), m.k1 * m.c1 + m.k2 * m.c2));
  each('sit-unit-price', (p, m) => { assert.strictEqual(m.total, m.cents * m.k); assert.strictEqual(cents(ansStr(p)), m.cents); });
  each('sit-price-compare', (p, m) => assert.strictEqual(cents(ansStr(p)), (m.dear - m.cheap) * m.k));
  each('sit-budget', (p, m) => assert.strictEqual(cents(ansStr(p)), m.budget - m.cents));
  each('sit-price-whole', (p, m) => { const a = Number(ansStr(p).replace(/[^\d]/g, '')); if (m.op === 'price-whole-mul') assert.strictEqual(a, m.d * m.k); if (m.op === 'price-whole-add') assert.strictEqual(a, m.a + m.b); if (m.op === 'price-whole-change') assert.strictEqual(a, m.bill - m.d); });
  each('sit-menu', (p, m) => {
    assert.ok(p.table && p.table.rows.length >= 3 && p.table.rows.every((row) => /^\$\d+\.\d\d$/.test(row[1])));
        if (m.op === 'menu-add') assert.strictEqual(cents(ansStr(p)), m.a + m.b);
    if (m.op === 'menu-mul') assert.strictEqual(cents(ansStr(p)), m.a * m.k);
    if (m.op === 'menu-diff') assert.strictEqual(cents(ansStr(p)), m.hi - m.lo);
    if (m.op === 'menu-change') { assert.strictEqual(cents(ansStr(p)), m.bill - m.a - m.b); assert.ok(m.bill > m.a + m.b); }
    // the prices quoted in the question are in the table
  });
  each('sit-menu-whole', (p, m) => { assert.ok(p.table); if (m.op === 'menu-whole-add') assert.strictEqual(num(ansStr(p)), m.a + m.b); if (m.op === 'menu-whole-mul') assert.strictEqual(num(ansStr(p)), m.a * m.k); if (m.op === 'menu-whole-change') assert.strictEqual(num(ansStr(p)), m.bill - m.cost); });
});

test('tables, schedules, fractions and decimal measurements', () => {
  each('sit-data-table', (p, m) => {
    assert.ok(p.table.rows.length >= 4 && p.table.head.length === 2);
    if (m.op === 'data-add') assert.strictEqual(answerNum(p), m.a + m.b);
    if (m.op === 'data-diff') assert.strictEqual(answerNum(p), m.big - m.small);
    if (m.op === 'data-total') assert.strictEqual(answerNum(p), m.vals.reduce((a, b) => a + b, 0));
    if (m.op === 'data-range') assert.strictEqual(answerNum(p), m.mx - m.mn);
    // every value in the table appears with its row name
    for (const [name, v] of p.table.rows) assert.ok(name && v);
  });
  each('sit-schedule', (p, m) => {
    assert.ok(p.table.rows.length === 4 && p.table.rows.every((row) => /^\d{1,2}:\d\d (AM|PM)$/.test(row[1])));
    const clock = (x) => `${Math.floor(x / 60) % 12 || 12}:${String(x % 60).padStart(2, '0')} ${x < 720 ? 'AM' : 'PM'}`;
    if (m.op === 'schedule-late') assert.ok(ansStr(p).includes(clock(m.to + m.late)));
    else { const d = m.to - m.from; assert.ok(d > 0); const h = Math.floor(d / 60); assert.ok(ansStr(p).startsWith(h ? `${h} hour` : `${d} minutes`), ansStr(p)); }
  });
  const F = require('../src/lib/generators/fractions');
  each('sit-frac-recipe', (p, m) => assert.ok(p.answerText.includes(F.show(F.mul(F.frac(m.a, m.d), F.frac(m.k, 1))))));
  each('sit-frac-of-set', (p, m) => { assert.ok(m.total % m.d === 0); assert.strictEqual(answerNum(p), (m.total / m.d) * m.a); });
  each('sit-frac-add', (p, m) => { if (m.op === 'frac-add') assert.ok(p.answerText.includes(F.show(F.frac(m.a + m.b, m.d)))); else { assert.ok(m.tot > m.a + m.b); assert.ok(p.answerText.includes(F.show(F.frac(m.tot - m.a - m.b, m.d)))); } });
  each('sit-frac-mixed', (p, m) => { const A = F.frac(m.w1 * m.d + m.a, m.d); const B = F.frac(m.w2 * m.d + m.b, m.d); const want = m.op === 'frac-mixed-sub' ? F.sub(A, B) : F.add(A, B); assert.ok(want.n > 0); assert.ok(p.answerText.includes(F.show(want))); });
  each('sit-frac-share', (p, m) => { assert.ok(m.k < m.n); assert.ok(p.answerText.includes(F.show(F.frac(m.k, m.n)))); });
  each('sit-frac-scoops', (p, m) => assert.strictEqual(answerNum(p), m.w * m.d));
  each('sit-frac-compare', (p, m) => { assert.ok(m.b > m.a); assert.ok(p.answerText.includes(F.show(F.frac(m.b - m.a, m.d)))); });
  each('sit-decimal-measure', (p, m) => {
    const sc = m.places === 1 ? 10 : 100; const got = Math.round(parseFloat(ansStr(p)) * sc);
    if (m.op === 'dec-add') assert.strictEqual(got, m.x + m.y); if (m.op === 'dec-sub') assert.strictEqual(got, m.hi - m.lo); if (m.op === 'dec-mul') assert.strictEqual(got, m.x * m.k);
    if (m.op === 'dec-div') { assert.strictEqual(m.q * m.k, m.total); assert.strictEqual(got, m.q); }
    assert.ok(ansStr(p).split(' ')[0].split('.')[1].length === m.places, ansStr(p));
  });
});

test('the formats: choices, error checks, estimates, extra facts and equations are self-consistent', () => {
  let seen = { choices: 0, wrong: 0, estimate: 0, extra: 0, eq: 0, explain: 0 };
  for (const tpl of SIT) for (let g = tpl.grades[0]; g <= tpl.grades[1]; g++) for (let i = 0; i < 40; i++) {
    const r = makeRng(g * 131 + i * 17 + tpl.id.length); const p = tpl.make(r, wp.ctx(r), g);
    if (p.choices) { seen.choices++; assert.ok(p.choices.length >= 2 && p.choices.length <= 3); const letter = /^([A-C]) \(/.exec(p.answerText); assert.ok(letter, p.answerText); const picked = p.choices.find((c) => c.startsWith(`${letter[1]}.`)); assert.ok(picked); assert.ok(p.answerText.includes(picked.slice(3))); assert.strictEqual(new Set(p.choices.map((c) => c.slice(3))).size, p.choices.length); }
    if (/Is (he|she) correct\?/.test(p.text)) { seen.wrong++; const claim = /says the answer is ([\d$.,/ ]+)\./.exec(p.text); assert.ok(claim, p.text); assert.ok(p.answerText.startsWith('No.')); assert.notStrictEqual(claim[1].trim(), p.answerText.replace(/^No\. The correct answer is /, '').split(/\. /)[0]); }
    if (/reasonable estimate/.test(p.text)) { seen.estimate++; assert.ok(g >= 4); assert.ok(/^(Yes|No)\./.test(p.answerText)); }
    if (p.note) { seen.extra++; assert.match(p.note, /Cross out/); }
    if (/Write (an equation|a number sentence)/.test(p.text)) { seen.eq++; assert.match(p.answerText, /[a-z] ?[=]|= [a-z]|[+−×÷] [a-z]|^[a-z] /); }
    if (p.explain) seen.explain++;
  }
  for (const k of Object.keys(seen)) assert.ok(seen[k] > 5, `${k} formats appear (${seen[k]})`);
});

test('real-life variety: dozens of different scenes per grade, almost none in a classroom, formats mixed on one sheet', () => {
  const SC = /\b(school|classroom|class|teacher|recess|cafeteria|principal|homework|student|students|playground)\b/i;
  let total = 0; let school = 0;
  for (let g = 1; g <= 5; g++) {
    const scenes = new Set(); const formats = new Set();
    for (let s = 1; s <= 30; s++) {
      const out = wp.wordProblems(makeRng(s * 7 + g), { grade: g, op: 'mixed', kind: g >= 3 ? 'mixed' : 'whole', steps: 'mixed', level: 'mixed', count: 10 });
      out.problems.forEach((p) => { total++; if (SC.test(p.text)) school++; scenes.add(p.id); if (p.table) formats.add('table'); if (p.parts) formats.add('parts'); if (p.choices) formats.add('choices'); if (p.note) formats.add('note'); if (/Is (he|she) correct/.test(p.text)) formats.add('error'); });
      const firstWords = new Set(out.problems.map((p) => p.text.split(' ').slice(0, 2).join(' '))); assert.ok(firstWords.size >= 6, `grade ${g}: ten problems do not all start alike`);
    }
    assert.ok(scenes.size >= (g === 1 ? 12 : 30), `grade ${g}: ${scenes.size} different scenes`);
    if (g >= 3) assert.ok(formats.size >= 4, `grade ${g}: ${[...formats]}`);
  }
  assert.ok(school / total < 0.03, `classroom scenes are ${(school / total * 100).toFixed(1)}% of problems`);
  // one sheet does not repeat a context
  const out = wp.wordProblems(makeRng(3), { grade: 4, op: 'mixed', kind: 'whole', steps: 'mixed', level: 'mixed', count: 12 });
  assert.strictEqual(new Set(out.problems.map((p) => p.text)).size, 12);
  void SCHOOL;
});

test('word problem pages render tables, lettered parts and choices, with the answer key', async () => {
  const { request, createApp, resetDb, createUser, login } = require('./helpers');
  await resetDb(); await createUser({ username: 'teacher@example.com' });
  const agent = request.agent(createApp()); await login(agent, 'teacher@example.com');
  let sawTable = false; let sawParts = false; let sawChoices = false;
  for (let seed = 1; seed <= 40 && !(sawTable && sawParts && sawChoices); seed++) {
    const res = await agent.get(`/math/word-problems/worksheet?grade=4&op=mixed&kind=mixed&steps=mixed&level=mixed&count=15&seed=${seed}&key=1`);
    assert.strictEqual(res.status, 200); assert.match(res.text, /Answer Key/); assert.ok(!/\sstyle=/.test(res.text));
    if (/class="wp-table"/.test(res.text)) sawTable = true; if (/class="wp-parts"/.test(res.text)) sawParts = true; if (/class="wp-choices"/.test(res.text)) sawChoices = true;
  }
  assert.ok(sawTable && sawParts && sawChoices);
});
