'use strict';

const test = require('node:test');
const assert = require('node:assert');
const { makeRng } = require('../src/lib/generators/rng');
const wp = require('../src/lib/generators/wordProblems');
const F = require('../src/lib/generators/fractions');

const num = (s) => Number(String(s).replace(/,/g, ''));
const sentences = (text) => text.split(/(?<=[.?!])\s+/).filter(Boolean);
const words = (s) => (s.match(/[A-Za-z0-9$]+(?:[',.][A-Za-z0-9]+)*/g) || []).length;
const FEMALE = ['Kelly', 'Lisa', 'Jessie'];
const MALE = ['Zach', 'AC', 'Screech'];

function sample(tpl, grade, n = 60) {
  const out = [];
  for (let i = 0; i < n; i++) {
    const rng = makeRng(grade * 1000 + i * 7 + tpl.id.length);
    out.push(tpl.make(rng, wp.ctx(rng), grade));
  }
  return out;
}
const eachScene = (fn) => { for (const tpl of wp.TEMPLATES) for (let g = tpl.grades[0]; g <= tpl.grades[1]; g++) fn(tpl, g, sample(tpl, g)); };

test('every scene, every grade it claims: well-formed text, sane answers, correct names and pronouns', () => {
  const extras = new RegExp(`\\b(${wp.EXTRA_NAMES.join('|')})\\b`);
  eachScene((tpl, g, problems) => {
    const texts = new Set();
    for (const p of problems) {
      const label = `${tpl.id} g${g}: ${p.text}`;
      assert.ok(/[?]$/.test(p.text), `ends with a question: ${label}`);
      assert.ok(!/NaN|undefined|Infinity|null|\[object|\$\{/.test(p.text + p.answerText), label);
      assert.ok(!/(^|[^\d.])-\d/.test(p.text + ' ' + p.answerText), `no negative numbers: ${label}`);
      assert.ok(p.answerText && p.answerText.length < 80, label);
      assert.ok(!/(^|[\s$])1 (miles|cups|feet|pizzas|gallons)\b|(^|[\s$])0 (mile|cup|foot|pizza|gallon)\b/.test(p.answerText), `unit agreement: ${p.answerText}`);
      assert.ok(!extras.test(p.text), `only the six main character names: ${label}`);
      assert.ok(!/\$\d+\.\d($|[^\d])/.test(p.text + p.answerText), `money shows cents: ${label}`);
      assert.ok(!/ {2}|\s[.,?]|\.\./.test(p.text), `tidy spacing: ${label}`);
      // pronouns agree with the characters in the story (only checked when everyone in it has the same gender)
      const present = [...FEMALE, ...MALE].filter((n) => new RegExp(`\\b${n}\\b`).test(p.text));
      const allF = present.length > 0 && present.every((n) => FEMALE.includes(n));
      const allM = present.length > 0 && present.every((n) => MALE.includes(n));
      if (allF) assert.ok(!/\b(he|him|his|himself)\b/i.test(p.text), `female story uses she/her: ${label}`);
      if (allM) assert.ok(!/\b(she|her|hers|herself)\b/i.test(p.text), `male story uses he/him: ${label}`);
      texts.add(p.text);
    }
    assert.ok(texts.size >= 8, `${tpl.id} g${g} varies (${texts.size} distinct of 60)`);
  });
});

// Safety net for realism: the scenes pick believable ranges on purpose; these catch regressions like "a bag of 242 apples".
test('realism: nothing absurd (bus loads, container sizes, number size for the grade)', () => {
  const CAP = { bus: 72, van: 15, bag: 30, box: 100, carton: 12, tub: 20, case: 48, page: 10, team: 20, classroom: 32, table: 10, row: 30, plate: 20, tray: 36 };
  const MAXNUM = { 1: 20, 2: 100, 3: 1000, 4: 100000, 5: 100000 };
  eachScene((tpl, g, problems) => {
    for (const p of problems) {
      const label = `${tpl.id} g${g}: ${p.text}`;
      for (const m of p.text.matchAll(/(?:each|every|in each|on each|per) (bus|van|bag|box|carton|tub|case|page|team|classroom|table|row|plate|tray)\b[^.]*?(\d[\d,]*)/gi)) {
        // "each bus holds 48" style: the number after the container word
        assert.ok(num(m[2]) <= CAP[m[1].toLowerCase()] * 1.0 || /seats|desks|miles|dollar|\$/.test(m[0]), `container size: ${m[0]} | ${label}`);
      }
      for (const m of p.text.matchAll(/(\d[\d,]*) (?:\w+ )?(?:in each|on each) (bus|van|bag|box|carton|tub|case|page|team|row|tray)/gi)) {
        assert.ok(num(m[1]) <= CAP[m[2].toLowerCase()], `${m[0]} | ${label}`);
      }
      for (const m of p.text.matchAll(/each (bus|van) (?:holds|carries|has|can carry) (\d[\d,]*)/gi)) assert.ok(num(m[2]) <= CAP[m[1].toLowerCase()], `${m[0]} | ${label}`);
      for (const m of p.text.matchAll(/(\d[\d,]*) (?:riders|passengers)/gi)) assert.ok(num(m[1]) <= 60, `a city bus can't carry ${m[1]} riders | ${label}`);
      const biggest = Math.max(...(p.text + ' ' + p.answerText).replace(/\$?(\d[\d,]*)(\.\d+)?/g, (all, whole) => ` N${num(whole)} `).match(/N\d+/g).map((x) => Number(x.slice(1))));
      assert.ok(biggest <= MAXNUM[g], `numbers too big for grade ${g} (${biggest}): ${label}`);
      if (g === 1) assert.ok(biggest <= 20, `grade 1 stays within 20: ${label}`);
    }
  });
});

test('variety: lots of scenes per grade, narrated, and not all the same "A has X" shape', () => {
  assert.ok(wp.TEMPLATES.length >= 120, `${wp.TEMPLATES.length} scenes`);
  for (let g = 1; g <= 5; g++) {
    const std = wp.pool({ grade: g, op: 'mixed', kind: 'whole', steps: 'mixed', level: 'standard' }).length;
    const ch = wp.pool({ grade: g, op: 'mixed', kind: 'whole', steps: 'mixed', level: 'challenge' }).length;
    assert.ok(std >= (g === 1 ? 8 : 15) && ch >= 1, `grade ${g}: ${std} standard, ${ch} challenge whole-number scenes`);
  }
  for (let g = 3; g <= 5; g++) assert.ok(wp.pool({ grade: g, op: 'mixed', kind: 'decimal', steps: 'mixed', level: 'standard' }).length >= 4);
  for (let g = 3; g <= 5; g++) assert.ok(wp.pool({ grade: g, op: 'mixed', kind: 'fraction', steps: 'mixed', level: 'standard' }).length >= 4, `grade ${g} fractions`);
  for (let g = 4; g <= 5; g++) {
    assert.ok(wp.pool({ grade: g, op: 'mixed', kind: 'fraction', steps: 'mixed', level: 'challenge' }).length >= 2);
    assert.ok(wp.pool({ grade: g, op: 'mixed', kind: 'decimal', steps: 'mixed', level: 'challenge' }).length >= 2);
  }
  for (let g = 1; g <= 5; g++) {
    const r = wp.wordProblems(makeRng(5 + g), { grade: g, count: 10, kind: 'whole' });
    assert.strictEqual(r.problems.length, 10);
    const names = '(Zach|AC|Screech|Kelly|Lisa|Jessie)';
    const aHas = r.problems.filter((p) => new RegExp(`^${names} (has|had) [\\d,]+ \\w+\\. ${names} (has|had)`).test(p.text)).length;
    assert.ok(aHas === 0, `no "A has X. B has Y." openers (${aHas})`);
    const openers = new Set(r.problems.map((p) => p.text.split(' ').slice(0, 3).join(' ').replace(/\d[\d,]*/g, '#')));
    assert.ok(openers.size >= 7, `grade ${g}: distinct openers ${openers.size}`);
    const avgSentences = r.problems.reduce((s, p) => s + sentences(p.text).length, 0) / 10;
    assert.ok(avgSentences >= (g <= 2 ? 2.5 : 2.7), `grade ${g}: ${avgSentences.toFixed(1)} sentences per problem on average`);
  }
});

test('difficulty setting: standard has no challenge items, challenge only challenge items, mixed has both', () => {
  const lv = (level) => new Set(wp.wordProblems(makeRng(11), { grade: 5, level, count: 20, kind: 'whole' }).problems.map((p) => p.level));
  assert.deepStrictEqual([...lv('standard')], [1]);
  assert.deepStrictEqual([...lv('challenge')], [2]);
  assert.deepStrictEqual([...lv('mixed')].sort(), [1, 2]);
});

test('reading load stays grade-appropriate (average and longest sentence)', () => {
  const LIMIT = { 1: [8, 16], 2: [9, 18], 3: [10.5, 21], 4: [12, 24], 5: [13, 27] }; // [average words per sentence, longest sentence]
  for (let g = 1; g <= 5; g++) {
    let total = 0;
    let count = 0;
    let longest = [0, ''];
    for (const tpl of wp.TEMPLATES.filter((x) => g >= x.grades[0] && g <= x.grades[1])) {
      for (const p of sample(tpl, g, 15)) for (const s of sentences(p.text)) { const n = words(s); total += n; count++; if (n > longest[0]) longest = [n, s]; }
    }
    const avg = total / count;
    assert.ok(avg <= LIMIT[g][0], `grade ${g}: average ${avg.toFixed(1)} words per sentence (limit ${LIMIT[g][0]})`);
    assert.ok(longest[0] <= LIMIT[g][1], `grade ${g}: longest sentence ${longest[0]} words (limit ${LIMIT[g][1]}): ${longest[1]}`);
  }
});

// Independent re-solving: read the numbers back out of the printed story and recompute the answer another way.
test('answers re-derive from the story text', () => {
  const run = (id, fn, grades) => {
    const tpl = wp.TEMPLATES.find((t) => t.id === id);
    assert.ok(tpl, id);
    for (let g = tpl.grades[0]; g <= tpl.grades[1]; g++) { if (grades && !grades.includes(g)) continue; for (const p of sample(tpl, g, 80)) fn(p, g); }
  };
  const m = (re, text) => { const x = re.exec(text); assert.ok(x, `pattern ${re} in: ${text}`); return x.slice(1); };
  const dollars = (n) => `$${n.toLocaleString('en-US')}`;
  const cents = (c) => `$${(c / 100).toFixed(2)}`;
  const toCents = (s) => Math.round(Number(s) * 100);

  run('ch-markers-shared', (p) => {
    const [b, per, lost, cls] = m(/opens (\d+) new boxes of markers with (\d+) markers in each box\. (\d+) markers.*?among (\d+) classes/, p.text).map(num);
    assert.strictEqual((b * per - lost) % cls, 0); assert.ok(lost > 0 && (b * per - lost) / cls >= 2);
    assert.strictEqual(num(p.answerText), (b * per - lost) / cls);
  });
  run('rem-vans', (p) => { const [t, k] = m(/([\d,]+) players need rides\. Each van holds (\d+)/, p.text).map(num); assert.strictEqual(p.answerText, `${Math.ceil(t / k)} vans`); assert.notStrictEqual(t % k, 0); });
  run('rem-muffin-boxes', (p) => { const [t, k] = m(/baked ([\d,]+) muffins.*? packs (\d+) muffins in each box/, p.text).map(num); assert.strictEqual(p.answerText, `${Math.floor(t / k)} full boxes with ${t % k} left over`); assert.ok(t % k >= 1); });
  run('rem-pizza', (p) => { const [f, s] = m(/Each of the (\d+) friends will eat about (\d+) slices/, p.text).map(num); assert.strictEqual(p.answerText, `${Math.ceil((f * s) / 8)} pizzas`); });
  run('ch-laps', (p) => { const [a, fewer] = m(/ran (\d+) laps around the track\. .*? twice as many.*? ran (\d+) fewer laps/, p.text).map(num); assert.ok(2 * a - fewer > 0); assert.strictEqual(num(p.answerText), 2 * a - fewer); });
  run('ch-packs-needed', (p) => { const [need, have, k] = m(/needs ([\d,]+) index cards.*? already has ([\d,]+)\. .*? packs of (\d+)/, p.text).map(num); assert.strictEqual((need - have) % k, 0); assert.strictEqual(p.answerText, `${(need - have) / k} packs`); });
  run('ch-change-two-items', (p) => { const [n, each, nb, paid] = m(/buys (\d+) pens for \$(\d+) each and a notebook for \$(\d+)\. .*? \$(\d+) bill/, p.text).map(num); assert.ok(paid > n * each + nb); assert.strictEqual(p.answerText, `$${paid - n * each - nb}`); });
  run('ch-reading-plan', (p) => { const [total, x, d1, m2] = m(/([\d,]+)-page novel.*? read (\d+) pages a day for the first (\d+) days.*? last (\d+) days/, p.text).map(num); assert.strictEqual((total - x * d1) % m2, 0); assert.strictEqual(p.answerText, `${(total - x * d1) / m2} pages a day`); });
  run('ch-weekly-steps', (p) => { const [per, goal] = m(/walks about ([\d,]+) steps.*? walk ([\d,]+) steps in one week/, p.text).map(num); assert.ok(goal > per * 7); assert.strictEqual(num(p.answerText), goal - per * 7); });
  run('two-cards', (p) => { const [a, b, d] = m(/had ([\d,]+) cards in a shoebox, and \w+ got ([\d,]+) more.*? gave ([\d,]+) cards/, p.text).map(num); assert.strictEqual(num(p.answerText), a + b - d); });
  run('two-spend-allowance', (p) => { const [a, b, d] = m(/got \$([\d,]+) for.*? spent \$([\d,]+) on a book and \$([\d,]+) on a snack/, p.text).map(num); assert.ok(a - b - d > 0); assert.strictEqual(p.answerText, dollars(a - b - d)); });
  run('two-concert-tickets', (p) => { const [a, pa, k, ps] = m(/sold (\d+) adult tickets for \$(\d+) each and (\d+) student tickets for \$(\d+) each/, p.text).map(num); assert.strictEqual(p.answerText, dollars(a * pa + k * ps)); });
  run('two-nickels-dimes', (p) => { const [q, d, n] = m(/found (\d+) quarters, (\d+) dimes(?:, and (\d+) nickels)?/, p.text); assert.strictEqual(num(p.answerText), num(q) * 25 + num(d) * 10 + (n ? num(n) * 5 : 0)); });
  run('two-basketball', (p) => { const [a, b] = m(/made (\d+) two-point baskets and (\d+) three-point/, p.text).map(num); assert.strictEqual(num(p.answerText), 2 * a + 3 * b); });
  run('two-buses-absent', (p) => { const [b, s, x] = m(/has (\d+) buses.*? carry (\d+) students\..*? (\d+) students are out sick/, p.text).map(num); assert.strictEqual(num(p.answerText), b * s - x); });
  run('two-play-chairs', (p) => { const [rows, per, x] = m(/sets up (\d+) rows with (\d+) chairs in each row\. .*? carries (\d+) more chairs/, p.text).map(num); assert.strictEqual(num(p.answerText), rows * per + x); });
  run('two-pages-left', (p) => { const [total, per, d] = m(/([\d,]+)-page chapter book\. .*? reads (\d+) pages every night for (\d+) nights/, p.text).map(num); assert.ok(total > per * d); assert.strictEqual(num(p.answerText), total - per * d); });
  run('two-city-bus', (p) => { const [a, off1, on, off2] = m(/leaves the station with (\d+) riders\. At Maple Street, (\d+) riders get off and (\d+) get on\. At the next stop, (\d+) more/, p.text).map(num); assert.ok(off2 <= a - off1 + on); assert.strictEqual(num(p.answerText), a - off1 + on - off2); });
  run('two-pond-ducks', (p) => { const [a, left, joined] = m(/^(\d+) ducks were swimming.*?(\d+) ducks flew away\. Then (\d+) more/, p.text).map(num); assert.strictEqual(num(p.answerText), a - left + joined); });
  run('two-shelter-dogs', (p) => { const [a, ad, nw] = m(/had (\d+) dogs on Monday\. .*?, (\d+) dogs were adopted, and (\d+) new dogs/, p.text).map(num); assert.strictEqual(num(p.answerText), a - ad + nw); });
  run('ch-field-day-relay', (p) => { const [a, j, l] = m(/^[^.]*?(\d[\d,]*) students lined up.*? Then ([\d,]+) students.*? Later, ([\d,]+) students/, p.text).map(num); assert.ok(l < a + j); assert.strictEqual(num(p.answerText), a + j - l); });
  run('ch-bakery-trays', (p) => { const [t, per, sold, k] = m(/bakes (\d+) trays of muffins with (\d+) muffins on each tray\. By noon, (\d+) of the muffins.*? boxes of (\d+)/, p.text).map(num); assert.strictEqual((t * per - sold) % k, 0); assert.strictEqual(p.answerText, `${(t * per - sold) / k} boxes`); });
  run('ch-fair-goal', (p) => { const [goal, a, b, d] = m(/wanted ([\d,]+) visitors.*? ([\d,]+) people came on Friday, ([\d,]+) came on Saturday, and ([\d,]+) came on Sunday/, p.text).map(num); assert.ok(goal > a + b + d); assert.strictEqual(num(p.answerText), goal - a - b - d); });
  run('ch-pencil-order', (p) => { const [b, per, rooms] = m(/orders (\d+) boxes of pencils with (\d+) pencils.*? among (\d+) classrooms/, p.text).map(num); assert.strictEqual((b * per) % rooms, 0); assert.strictEqual(num(p.answerText), (b * per) / rooms); });
  run('geo-fence-cost', (p) => { const [l, w, price] = m(/is (\d+) meters long and (\d+) meters wide.*? \$(\d+) for every meter/, p.text).map(num); assert.strictEqual(p.answerText, dollars(2 * (l + w) * price)); });
  run('geo-area', (p) => { const [l, w, unit] = m(/It is (\d+) \w+ long and (\d+) \w+ wide\. What is its area in square (\w+)/, p.text); assert.strictEqual(p.answerText, `${(num(l) * num(w)).toLocaleString('en-US')} square ${unit}`); });
  run('geo-perimeter', (p) => { const [l, w] = m(/is (\d+) \w+ long and (\d+) \w+ wide\. How many/, p.text).map(num); assert.ok(p.answerText.startsWith(String(2 * (l + w)))); });
  run('rate-practice', (p) => { const [mn, d, w] = m(/practices (\d+) minutes a day, (\d+) days a week.*? in (\d+) weeks/, p.text).map(num); assert.strictEqual(num(p.answerText), mn * d * w); });
  run('rate-road-trip', (p) => { const [s1, h1, s2, h2] = m(/drove (\d+) miles per hour for (\d+) hours.*? drove (\d+) miles per hour for (\d+) more hours/, p.text).map(num); assert.strictEqual(num(p.answerText), s1 * h1 + s2 * h2); });
  run('money-c-sale', (p) => { const [price, off, k] = m(/costs \$(\d+\.\d{2})\. .*? takes \$(\d+\.\d{2}) off every shirt\. .*? buys (\d+) shirts/, p.text).map(Number); assert.strictEqual(p.answerText, cents((toCents(price) - toCents(off)) * k)); });
  run('money-c-share-snacks', (p) => { const [x, y] = m(/chips cost \$(\d+\.\d{2}), and the drinks cost \$(\d+\.\d{2})\./, p.text).map(toCents); assert.strictEqual((x + y) % 3, 0); assert.strictEqual(p.answerText, cents((x + y) / 3)); });
  run('money-c-need-more', (p) => { const [cost, a, b] = m(/costs \$(\d+\.\d{2})\. \w+ has \$(\d+\.\d{2}), and \w+ has \$(\d+\.\d{2})/, p.text).map(toCents); assert.ok(cost > a + b); assert.strictEqual(p.answerText, cents(cost - a - b)); });
  run('money-c-two-friends-change', (p) => { const [each, extra, bill] = m(/each buy .*? for \$(\d+\.\d{2}), and they share a snack that costs \$(\d+\.\d{2})\. .*? with a \$(\d+) bill/, p.text).map(Number); const total = 2 * toCents(each) + toCents(extra); assert.ok(bill * 100 > total); assert.strictEqual(p.answerText, cents(bill * 100 - total)); });
  run('money-change', (p) => { const [a, b, bill] = m(/buys .*? for \$(\d+\.\d{2})\. \w+ also buys .*? for \$(\d+\.\d{2})\. .*? \$(\d+) bill/, p.text).map(Number); assert.strictEqual(p.answerText, cents(bill * 100 - toCents(a) - toCents(b))); });
  run('money-split-bill', (p) => { const [t] = m(/came to \$(\d+\.\d{2})/, p.text).map(toCents); assert.strictEqual(t % 3, 0); assert.strictEqual(p.answerText, cents(t / 3)); });
  run('money-unit-price', (p) => { const [k, total] = m(/bought (\d+) .*? paid \$(\d+\.\d{2}) in all/, p.text).map(Number); assert.strictEqual(toCents(total) % k, 0); assert.strictEqual(p.answerText, cents(toCents(total) / k)); });
  run('money-savings-goal', (p) => { const [cost, have, x] = m(/costs \$(\d+\.\d{2})\. .*? has \$(\d+\.\d{2}) saved up and earns \$(\d+\.\d{2})/, p.text).map(toCents); assert.strictEqual(p.answerText, cents(cost - have - x)); });
  run('meas-dash', (p) => { const [slow, fast] = m(/in ([\d.]+) seconds\. \w+ ran it in ([\d.]+) seconds/, p.text).map(Number); assert.ok(fast < slow); const places = (p.text.match(/in (\d+\.(\d+)) seconds/) || [])[2].length; assert.strictEqual(p.answerText, `${(Math.round((slow - fast) * 10 ** places) / 10 ** places).toFixed(places)} seconds`); });
  run('meas-walk-to-school', (p) => { const [a] = m(/lives ([\d.]+) miles/, p.text).map(Number); const v = Math.round(a * 10 * 10) / 10; assert.strictEqual(p.answerText, `${Number.isInteger(v) ? v : v.toFixed(1)} miles`); });
  run('fr-c-who-ran-farther', (p) => { const [n1, d1, n2, d2] = m(/ran (\d+)\/(\d+) mile and \w+ ran (\d+)\/(\d+) mile/, p.text).map(Number); const x = F.frac(n1, d1); const y = F.frac(n2, d2); const diff = x.n * y.d > y.n * x.d ? F.sub(x, y) : F.sub(y, x); assert.ok(p.answerText.endsWith(`${F.show(diff)} mile farther`)); const first = /In the school mini-marathon, (\w+) ran/.exec(p.text)[1]; assert.ok(p.answerText.startsWith(x.n * y.d > y.n * x.d ? first : /and (\w+) ran/.exec(p.text)[1])); });
  run('fr-mixed-flour', (p) => { const [w1, a, d, w2, b] = m(/uses (\d+) (\d+)\/(\d+) cups of flour for the bread and (\d+) (\d+)\/\d+ cups/, p.text).map(Number); assert.strictEqual(p.answerText, F.unit(F.add(F.frac(w1 * d + a, d), F.frac(w2 * d + b, d)), 'cup', 'cups')); });
  run('fr-mixed-board', (p) => { const [w1, a, d, w2, b] = m(/board that is (\d+) (\d+)\/(\d+) feet long\. .*? piece that is (\d+) (\d+)\/\d+ feet/, p.text).map(Number); assert.strictEqual(p.answerText, F.unit(F.sub(F.frac(w1 * d + a, d), F.frac(w2 * d + b, d)), 'foot', 'feet')); });
  run('fr-pizza-left', (p) => { const [d, a, b] = m(/cut into (\d+) equal slices\. \w+ ate (\d+) slices?, and \w+ ate (\d+) slices?/, p.text).map(Number); assert.strictEqual(p.answerText, F.show(F.frac(d - a - b, d))); assert.ok(d - a - b > 0); });
  run('fr-of-a-set', (p) => { const [t, a, d] = m(/has (\d+) baseball cards.*? gives (\d+)\/(\d+) of them|has (\d+) baseball cards.*? gives () ?1\/(\d+)/, p.text).filter(Boolean).map(Number).concat([]); void t; void a; void d; const mm = /has (\d+) baseball cards in a shoebox\. \w+ gives (\d+)\/(\d+) of them/.exec(p.text); assert.ok(mm); const [, tt, aa, dd] = mm.map(Number); assert.strictEqual(tt % dd, 0); assert.strictEqual(num(p.answerText), (tt / dd) * aa); });
  run('fr-c-set-left', (p) => { const [t, a, d] = m(/has (\d+) stickers\. \w+ gives (\d+)\/(\d+) of them/, p.text).map(Number); assert.strictEqual(t % d, 0); assert.strictEqual(num(p.answerText), t - (t / d) * a); });
  run('fr-c-allowance', (p) => { const [total] = m(/earned \$(\d+) doing chores/, p.text).map(Number); assert.strictEqual(total % 12, 0); assert.strictEqual(p.answerText, `$${total - total / 3 - total / 4}`); });
  run('fr-c-how-we-get-to-school', (p) => { const [n] = m(/class of (\d+) students/, p.text).map(Number); assert.strictEqual(n % 12, 0); assert.strictEqual(num(p.answerText), n - n / 4 - n / 3); });
  run('fr-c-brownie-pan', (p) => { const [d, a, b, c2] = m(/cut into (\d+) equal pieces\. \w+ eats (\d+) pieces?, \w+ eats (\d+) pieces?, and \w+ takes (\d+) pieces?/, p.text).map(Number); assert.strictEqual(p.answerText, F.show(F.frac(d - a - b - c2, d))); assert.ok(d - a - b - c2 > 0); });
  run('fr-garden-sections', (p) => { const [d, a, b] = m(/divided into (\d+) equal sections\. \w+ planted tomatoes in (\d+) of the sections and beans in (\d+)/, p.text).map(Number); assert.ok(d - a - b > 0); assert.strictEqual(p.answerText, F.show(F.frac(d - a - b, d))); });
  run('cmp-cranes', (p) => { const [a, x, b, y] = m(/Room 3 folds (\d+) cranes a day for (\d+) days\. Room 5 folds (\d+) cranes a day for (\d+) days/, p.text).map(Number); assert.notStrictEqual(a * x, b * y); assert.strictEqual(p.answerText, `Room ${a * x > b * y ? 3 : 5} folds ${Math.abs(a * x - b * y).toLocaleString('en-US')} more`); });
});
