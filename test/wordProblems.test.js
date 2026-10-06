'use strict';

const test = require('node:test');
const assert = require('node:assert');
const { makeRng } = require('../src/lib/generators/rng');
const wp = require('../src/lib/generators/wordProblems');
const F = require('../src/lib/generators/fractions');

const num = (s) => Number(String(s).replace(/,/g, ''));
const sentences = (text) => text.split(/(?<=[.?!])\s+/).filter(Boolean);
const words = (s) => (s.match(/[A-Za-z0-9$]+(?:[',.][A-Za-z0-9]+)*/g) || []).length;

function sample(tpl, grade, n = 60) {
  const out = [];
  for (let i = 0; i < n; i++) {
    const rng = makeRng(grade * 1000 + i * 7 + tpl.id.length);
    out.push(tpl.make(rng, wp.ctx(rng), grade));
  }
  return out;
}

test('every template, every grade it claims: well-formed text, sane answers, only the six character names', () => {
  const extras = new RegExp(`\\b(${wp.EXTRA_NAMES.join('|')})\\b`);
  for (const tpl of wp.TEMPLATES) {
    for (let g = tpl.grades[0]; g <= tpl.grades[1]; g++) {
      const texts = new Set();
      for (const p of sample(tpl, g)) {
        const label = `${tpl.id} g${g}: ${p.text}`;
        assert.ok(/[?]$/.test(p.text), `ends with a question: ${label}`);
        assert.ok(!/NaN|undefined|Infinity|null|\[object/.test(p.text + p.answerText), label);
        assert.ok(!/(^|[^\d.])-\d/.test(p.text + ' ' + p.answerText), `no negative numbers: ${label}`);
        assert.ok(p.answerText && p.answerText.length < 80, label);
        assert.ok(!/(^|[\s$])1 (miles|cups|feet|pizzas)\b|(^|[\s$])0 (mile|cup|foot|pizza)\b/.test(p.answerText), `unit agreement: ${p.answerText}`);
        assert.ok(!extras.test(p.text), `only the six main character names: ${label}`);
        assert.ok(!/\$\d+\.\d$/.test(p.answerText), `money has cents: ${p.answerText}`);
        texts.add(p.text);
      }
      assert.ok(texts.size >= 10, `${tpl.id} g${g} varies (${texts.size} distinct of 60)`);
    }
  }
});

test('variety: plenty of structures for every grade, standard and challenge', () => {
  assert.ok(wp.TEMPLATES.length >= 80, `${wp.TEMPLATES.length} templates`);
  for (let g = 1; g <= 5; g++) {
    const std = wp.pool({ grade: g, op: 'mixed', kind: 'whole', steps: 'mixed', level: 'standard' }).length;
    const ch = wp.pool({ grade: g, op: 'mixed', kind: 'whole', steps: 'mixed', level: 'challenge' }).length;
    assert.ok(std >= (g === 1 ? 6 : 10) && ch >= 1, `grade ${g}: ${std} standard, ${ch} challenge whole-number templates`);
  }
  for (let g = 3; g <= 5; g++) assert.ok(wp.pool({ grade: g, op: 'mixed', kind: 'decimal', steps: 'mixed', level: 'standard' }).length >= 3);
  for (let g = 4; g <= 5; g++) {
    assert.ok(wp.pool({ grade: g, op: 'mixed', kind: 'fraction', steps: 'mixed', level: 'challenge' }).length >= 2, `grade ${g} challenge fractions`);
    assert.ok(wp.pool({ grade: g, op: 'mixed', kind: 'decimal', steps: 'mixed', level: 'challenge' }).length >= 2, `grade ${g} challenge decimals`);
  }
  // a mixed sheet of 10 uses many different structures, not one template over and over
  const r = wp.wordProblems(makeRng(5), { grade: 4, count: 10, kind: 'whole' });
  assert.strictEqual(r.problems.length, 10);
  const kinds = new Set(r.problems.map((p) => p.text.replace(/[\d,$./]+/g, '#').split(' ').slice(0, 6).join(' ')));
  assert.ok(kinds.size >= 7, `distinct openings: ${kinds.size}`);
});

test('difficulty setting: standard has no challenge items, challenge only challenge items, mixed has both', () => {
  const lv = (level) => new Set(wp.wordProblems(makeRng(11), { grade: 5, level, count: 20, kind: 'whole' }).problems.map((p) => p.level));
  assert.deepStrictEqual([...lv('standard')], [1]);
  assert.deepStrictEqual([...lv('challenge')], [2]);
  assert.deepStrictEqual([...lv('mixed')].sort(), [1, 2]);
  assert.ok(wp.wordProblems(makeRng(1), { grade: 5, level: 'challenge', count: 8, kind: 'fraction' }).problems.every((p) => p.steps >= 1));
});

test('reading load stays grade-appropriate (average and longest sentence)', () => {
  const LIMIT = { 1: [8, 16], 2: [8.5, 17], 3: [9.5, 18], 4: [10, 20], 5: [11, 22] }; // [average words per sentence, longest sentence]
  for (let g = 1; g <= 5; g++) {
    let total = 0;
    let count = 0;
    let longest = 0;
    for (const tpl of wp.TEMPLATES.filter((x) => g >= x.grades[0] && g <= x.grades[1])) {
      for (const p of sample(tpl, g, 15)) {
        for (const s of sentences(p.text)) { const n = words(s); total += n; count++; longest = Math.max(longest, n); }
      }
    }
    const avg = total / count;
    assert.ok(avg <= LIMIT[g][0], `grade ${g}: average ${avg.toFixed(1)} words per sentence (limit ${LIMIT[g][0]})`);
    assert.ok(longest <= LIMIT[g][1], `grade ${g}: longest sentence ${longest} words (limit ${LIMIT[g][1]})`);
  }
});

// Independent re-solving: read the numbers back out of the printed problem and recompute the answer a different way.
test('answers re-derive from the text for the multi-step and challenge templates', () => {
  const run = (id, grades, fn) => {
    const tpl = wp.TEMPLATES.find((t) => t.id === id);
    assert.ok(tpl, id);
    for (const g of grades) for (const p of sample(tpl, g, 80)) fn(p, g);
  };
  const m = (re, text) => { const x = re.exec(text); assert.ok(x, `pattern ${re} in: ${text}`); return x.slice(1); };

  run('w2-c-mul-sub-div', [4, 5], (p) => {
    const [b, per, lost, cls] = m(/buys (\d+) boxes of markers with (\d+) markers.*?(\d+) markers are broken.*?among (\d+) classes/, p.text).map(num);
    assert.strictEqual((b * per - lost) % cls, 0, 'divides evenly');
    assert.ok(lost > 0 && lost < b * per && (b * per - lost) / cls >= 2);
    assert.strictEqual(num(p.answerText), (b * per - lost) / cls);
  });
  run('w2-c-buses-needed', [4, 5], (p) => {
    const [t, k] = m(/has ([\d,]+) students\. Each bus holds (\d+)/, p.text).map(num);
    assert.strictEqual(p.answerText, `${Math.ceil(t / k)} buses`);
    assert.notStrictEqual(t % k, 0);
  });
  run('w2-c-tickets-left', [3, 4, 5], (p) => {
    const [w, price] = m(/has \$([\d,]+)\. Each ticket costs \$(\d+)/, p.text).map(num);
    assert.strictEqual(p.answerText, `${Math.floor(w / price)} tickets and $${w % price} left over`);
    assert.ok(w % price > 0);
  });
  run('w2-c-stops', [1, 2, 3, 4, 5], (p) => {
    const [a, off1, on, off2] = m(/had ([\d,]+) riders\. At the first stop, ([\d,]+) riders got off and ([\d,]+) got on\. At the next stop, ([\d,]+) riders/, p.text).map(num);
    assert.ok(off1 <= a && off2 <= a - off1 + on);
    assert.strictEqual(num(p.answerText), a - off1 + on - off2);
  });
  run('w2-c-laps', [3, 4, 5], (p) => {
    const [a, fewer] = m(/ran ([\d,]+) laps\. .*? twice as many.*? ran ([\d,]+) fewer laps/, p.text).map(num);
    assert.ok(2 * a - fewer > 0);
    assert.strictEqual(num(p.answerText), 2 * a - fewer);
  });
  run('w2-c-packs-needed', [3, 4, 5], (p) => {
    const [need, have, k] = m(/needs ([\d,]+) .*? already has ([\d,]+)\. .*? packs of (\d+)/, p.text).map(num);
    assert.strictEqual((need - have) % k, 0);
    assert.strictEqual(p.answerText, `${(need - have) / k} packs`);
  });
  run('w2-c-change', [4, 5], (p) => {
    const [n, each, nb, paid] = m(/buys (\d+) pens for \$(\d+) each and a notebook for \$(\d+)\. .*? pays with \$(\d+)/, p.text).map(num);
    assert.ok(paid > n * each + nb);
    assert.strictEqual(p.answerText, `$${paid - n * each - nb}`);
  });
  run('w2-c-compare-products', [3, 4, 5], (p) => {
    const [a, b, d, e] = m(/packed (\d+) boxes with ([\d,]+) .*? in each box\. .*? packed (\d+) boxes with ([\d,]+)/, p.text).map(num);
    assert.notStrictEqual(a * b, d * e);
    assert.match(p.answerText, new RegExp(`packed ${Math.abs(a * b - d * e).toLocaleString('en-US')} more$`));
    const who = a * b > d * e ? /^(\w+) packed/.exec(p.text)[1] : /\. (\w+) packed/.exec(p.text)[1];
    assert.ok(p.answerText.startsWith(who));
  });
  run('w2-c-times-then-total', [3, 4, 5], (p) => {
    const [a, k] = m(/has ([\d,]+) .*?\. .*? has (\d+) times as many/, p.text).map(num);
    assert.strictEqual(num(p.answerText), a + a * k);
  });
  run('w2-leftover', [4, 5], (p) => {
    const [t, k] = m(/has ([\d,]+) .*?\. .*? puts (\d+) .*? in each bag/, p.text).map(num);
    assert.strictEqual(p.answerText, `${Math.floor(t / k).toLocaleString('en-US')} full bags with ${t % k} left over`);
    assert.ok(t % k >= 1);
  });
  run('w2-spend-two', [2, 3, 4, 5], (p) => {
    const [a, b, d] = m(/had \$([\d,]+)\. .*? spent \$([\d,]+) on lunch and \$([\d,]+) on a book/, p.text).map(num);
    assert.ok(a - b - d > 0);
    assert.strictEqual(p.answerText, `$${(a - b - d).toLocaleString('en-US')}`);
  });
  run('w2-pages-left', [3, 4, 5], (p) => {
    const [per, d, total] = m(/reads (\d+) pages .*? for (\d+) days\. The book has ([\d,]+) pages/, p.text).map(num);
    assert.strictEqual(num(p.answerText), total - per * d);
    assert.ok(total - per * d > 0);
  });
  run('w2-basketball', [3, 4, 5], (p) => {
    const [a, b] = m(/scored (\d+) baskets worth 2 points each and (\d+) baskets worth 3/, p.text).map(num);
    assert.strictEqual(num(p.answerText), 2 * a + 3 * b);
  });
  run('d2-c-sale', [5], (p) => {
    const [price, off, k] = m(/costs \$([\d.]+)\. .*? \$([\d.]+) off\. .*? buys (\d+) jackets/, p.text).map(Number);
    assert.strictEqual(p.answerText, `$${(Math.round((price - off) * 100) * k / 100).toFixed(2)}`);
  });
  run('d2-c-share-cost', [4, 5], (p) => {
    const [x, y] = m(/cost \$([\d.]+) and \$([\d.]+)\./, p.text).map((v) => Math.round(Number(v) * 100));
    assert.strictEqual((x + y) % 3, 0, 'splits into whole cents');
    assert.strictEqual(p.answerText, `$${((x + y) / 3 / 100).toFixed(2)}`);
  });
  run('d2-c-need-more', [4, 5], (p) => {
    const [a, b, cost] = m(/has \$([\d.]+) and .*? has \$([\d.]+)\. .*? costs \$([\d.]+)\./, p.text).map((v) => Math.round(Number(v) * 100));
    assert.ok(cost > a + b);
    assert.strictEqual(p.answerText, `$${((cost - a - b) / 100).toFixed(2)}`);
  });
  run('d2-longer', [4, 5], (p) => {
    const [a, b] = m(/is ([\d.]+) meters long\. .*? is ([\d.]+) meters long/, p.text).map(Number);
    assert.ok(a > b);
    assert.strictEqual(p.answerText, `${(Math.round((a - b) * 100) / 100).toFixed(/\.\d{2}\b/.test(String(m(/is ([\d.]+) meters long/, p.text)[0])) ? 2 : 1)} meters`);
  });
  run('f2-c-money-parts', [5], (p) => {
    const [total] = m(/had \$(\d+)\./, p.text).map(num);
    assert.strictEqual(total % 12, 0);
    assert.strictEqual(p.answerText, `$${total - total / 3 - total / 4}`);
  });
  run('f2-c-farther', [4, 5], (p) => {
    const [n1, d1, n2, d2] = m(/ran (\d+)\/(\d+) mile\. .*? ran (\d+)\/(\d+) mile/, p.text).map(Number);
    const diff = F.sub(F.frac(Math.max(n1 * d2, n2 * d1), d1 * d2), F.frac(Math.min(n1 * d2, n2 * d1), d1 * d2));
    assert.ok(diff.n > 0);
    assert.ok(p.answerText.endsWith(`${F.show(diff)} mile farther`), p.answerText);
    assert.ok(p.answerText.startsWith(n1 * d2 > n2 * d1 ? /^(\w+) ran/.exec(p.text)[1] : /\. (\w+) ran/.exec(p.text)[1]));
  });
  run('f2-mixed-add', [4, 5], (p) => {
    const [w1, a, d, w2, b] = m(/used (\d+) (\d+)\/(\d+) cups .*? and (\d+) (\d+)\/\d+ cups/, p.text).map(Number).concat();
    const [, , dd] = m(/used (\d+) (\d+)\/(\d+) cups/, p.text).map(Number);
    const total = F.add(F.frac(w1 * dd + a, dd), F.frac(w2 * dd + b, dd));
    assert.strictEqual(p.answerText, F.unit(total, 'cup', 'cups'));
  });
  run('f2-of-whole-number', [4, 5], (p) => {
    const [t, a, d] = m(/has (\d+) .*? gives (\d+)\/(\d+) of them/, p.text).map(Number);
    assert.strictEqual(t % d, 0);
    assert.strictEqual(num(p.answerText), (t / d) * a);
  });
});
