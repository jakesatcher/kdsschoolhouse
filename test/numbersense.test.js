'use strict';
// Place value and rounding: grade 4 = whole numbers to the millions; grade 5 adds decimals to the thousandths.
// Answers are re-derived from the printed number by reading its digits, independent of the generator's arithmetic.
const test = require('node:test');
const assert = require('node:assert');
const { makeRng } = require('../src/lib/generators/rng');
const ns = require('../src/lib/generators/numberSense');

const WHOLE = ['ones', 'tens', 'hundreds', 'thousands', 'ten thousands', 'hundred thousands', 'millions'];
const DEC = ['tenths', 'hundredths', 'thousandths'];
const parse = (s) => { const [w, f = ''] = s.replace(/,/g, '').split('.'); return { w, f }; };
const inRange = (p, grade, digits) => { const { w, f } = parse(p); assert.ok(w.length <= digits, `${p} too long`); assert.ok(/^(0|[1-9]\d*)$/.test(w)); if (grade === 4) assert.strictEqual(f, ''); assert.ok(f.length <= 3); if (f) assert.ok(!f.endsWith('0')); };

test('place value: grade 4 is whole numbers up to the millions', () => {
  let sawMillions = false; const kinds = new Set(); const places = new Set();
  for (let seed = 1; seed <= 80; seed++) {
    for (const p of ns.placeValue(makeRng(seed), { grade: 4, digits: 7, count: 12 })) {
      inRange(p.plain, 4, 7); if (parse(p.plain).w.length === 7) sawMillions = true; kinds.add(p.kind);
      const { w } = parse(p.plain);
      if (p.kind === 'digit') {
        const place = /in the (.+) place/.exec(p.q)[1]; const idx = WHOLE.indexOf(place); assert.ok(idx >= 0 && idx < w.length);
        assert.strictEqual(p.answerText, w[w.length - 1 - idx]);
      } else {
        assert.strictEqual(p.num.join(''), p.plain, 'underline split rebuilds the number');
        const digit = p.num[1]; const before = p.num[0].replace(/,/g, '').length; const idx = w.length - 1 - before; places.add(WHOLE[idx]);
        assert.strictEqual(w[before], digit);
        if (p.kind === 'place') assert.strictEqual(p.answerText, WHOLE[idx]); else { assert.notStrictEqual(digit, '0'); assert.strictEqual(p.answerText.replace(/,/g, ''), digit + '0'.repeat(idx)); }
      }
    }
  }
  assert.ok(sawMillions); assert.deepStrictEqual([...kinds].sort(), ['digit', 'place', 'value']); assert.ok(places.has('millions') && places.has('ones'));
});

test('place value: grade 5 adds decimals to the thousandths', () => {
  const placesSeen = new Set(); let whole = 0; let dec = 0;
  for (let seed = 1; seed <= 80; seed++) {
    for (const p of ns.placeValue(makeRng(seed), { grade: 5, digits: 7, numbers: 'mixed', decimals: 'mixed', count: 12 })) {
      inRange(p.plain, 5, 7); const { w, f } = parse(p.plain); f ? dec++ : whole++;
      if (p.kind === 'digit') {
        const place = /in the (.+) place/.exec(p.q)[1];
        if (DEC.includes(place)) { const i = DEC.indexOf(place); assert.strictEqual(p.answerText, f[i]); placesSeen.add(place); } else assert.strictEqual(p.answerText, w[w.length - 1 - WHOLE.indexOf(place)]);
      } else {
        assert.strictEqual(p.num.join(''), p.plain);
        const digit = p.num[1]; const beforeDigits = p.num[0].replace(/,/g, '');
        if (beforeDigits.includes('.')) {
          const i = beforeDigits.split('.')[1].length; assert.strictEqual(f[i], digit); placesSeen.add(DEC[i]);
          if (p.kind === 'place') assert.strictEqual(p.answerText, DEC[i]); else assert.strictEqual(Number(p.answerText), Number(digit) / 10 ** (i + 1));
          if (p.kind === 'value') assert.strictEqual(p.answerText, `0.${'0'.repeat(i)}${digit}`);
        } else if (p.kind === 'place') assert.strictEqual(p.answerText, WHOLE[w.length - 1 - beforeDigits.length]);
      }
    }
  }
  assert.ok(whole > 100 && dec > 100); assert.deepStrictEqual([...placesSeen].sort(), ['hundredths', 'tenths', 'thousandths']);
  // decimals only
  for (const p of ns.placeValue(makeRng(3), { grade: 5, numbers: 'decimal', decimals: '3', count: 20 })) assert.strictEqual(parse(p.plain).f.length, 3);
});

// independent rounding: look at the digit just right of the rounding place
function roundByDigits(s, exp) {
  const { w, f } = parse(s); const all = w + f.padEnd(3, '0'); // value x 1000 as a digit string
  const cut = all.length - (exp + 3); // number of digits kept on the left
  const kept = all.slice(0, cut) || '0'; const next = all[cut] || '0';
  let up = BigInt(kept) + (Number(next) >= 5 ? 1n : 0n);
  const scaled = (up * 10n ** BigInt(exp + 3)).toString().padStart(4, '0');
  const outW = scaled.slice(0, -3).replace(/^0+(?=\d)/, '') || '0'; const outF = scaled.slice(-3).slice(0, Math.max(0, -exp));
  return (outW.replace(/\B(?=(\d{3})+(?!\d))/g, ',')) + (outF ? `.${outF}` : '');
}

test('rounding: every answer follows from the digit after the rounding place, with exact halves going up', () => {
  const seenExp = new Set();
  for (const grade of [4, 5]) for (let seed = 1; seed <= 80; seed++) {
    for (const p of ns.rounding(makeRng(seed * 3), { grade, digits: 7, numbers: grade === 5 ? 'mixed' : 'whole', decimals: 'mixed', place: 'mixed', count: 16 })) {
      inRange(p.plain, grade, 7); seenExp.add(p.exp);
      if (grade === 4) assert.ok(p.exp >= 1);
      assert.strictEqual(p.answerText, roundByDigits(p.plain, p.exp), `${p.plain} to ${p.placeName}`);
      assert.ok(ns.ROUND_NAMES[p.exp] === p.placeName);
      const { w, f } = parse(p.plain); if (p.exp > 0) assert.ok(w.length > p.exp); else assert.ok(f.length > -p.exp || p.exp === 0);
    }
  }
  assert.deepStrictEqual([...seenExp].sort((a, b) => a - b), [-2, -1, 0, 1, 2, 3, 4, 5, 6]);
  assert.strictEqual(ns.roundExact({ whole: '4350', frac: '' }, 2), '4,400'); assert.strictEqual(ns.roundExact({ whole: '999999', frac: '' }, 3), '1,000,000');
  assert.strictEqual(ns.roundExact({ whole: '4', frac: '995' }, -2), '5.00'); assert.strictEqual(ns.roundExact({ whole: '0', frac: '996' }, 0), '1');
  assert.strictEqual(ns.roundExact({ whole: '12', frac: '345' }, -1), '12.3'); assert.strictEqual(ns.roundExact({ whole: '12', frac: '350' }, -1), '12.4');
});

test('rounding to one chosen place: the same number ranges as place value, with clear errors for places that do not fit', () => {
  for (const exp of [1, 2, 3, 4, 5, 6]) for (const p of ns.rounding(makeRng(exp), { grade: 4, digits: 7, place: String(exp), count: 20 })) { assert.strictEqual(p.exp, exp); assert.ok(parse(p.plain).w.length > exp); assert.strictEqual(p.answerText, roundByDigits(p.plain, exp)); }
  for (const exp of [0, -1, -2]) for (const p of ns.rounding(makeRng(9), { grade: 5, digits: 7, place: String(exp), decimals: 'mixed', count: 20 })) { assert.strictEqual(p.exp, exp); assert.ok(parse(p.plain).f.length > -exp || exp === 0); assert.strictEqual(p.answerText, roundByDigits(p.plain, exp)); }
  assert.match(ns.validRoundPlace(4, 7, '-1'), /whole numbers only/);
  assert.match(ns.validRoundPlace(5, 5, '6'), /at least 7 digits/);
  assert.strictEqual(ns.validRoundPlace(5, 7, '-2'), ''); assert.strictEqual(ns.validRoundPlace(4, 7, 'mixed'), '');
});

test('place value and rounding pages render through the app, are pinned and can be saved', async () => {
  const { request, createApp, resetDb, createUser, login } = require('./helpers');
  await resetDb(); await createUser({ username: 'teacher@example.com' });
  const agent = request.agent(createApp()); await login(agent, 'teacher@example.com');
  assert.match((await agent.get('/')).text, /\/math\/place-value/); assert.match((await agent.get('/')).text, /\/math\/rounding/);
  for (const t of ['place-value', 'rounding']) { const f = await agent.get(`/math/${t}`); assert.strictEqual(f.status, 200); assert.match(f.text, /name="grade"/); assert.match(f.text, /Millions/); }
  const pv = await agent.get('/math/place-value/worksheet?grade=5&digits=7&numbers=mixed&kind=mixed&count=12&seed=7&key=1');
  assert.strictEqual(pv.status, 200); assert.match(pv.text, /place value/); assert.match(pv.text, /Answer Key/); assert.strictEqual((pv.text.match(/class="ns-q"/g) || []).length, 12);
  assert.ok(!/\sstyle=/.test(pv.text));
  const list = await agent.get('/math/rounding/worksheet?grade=4&digits=6&place=3&count=20&seed=7&key=0');
  assert.strictEqual(list.status, 200); assert.match(list.text, /Round each number to the nearest thousand/); assert.strictEqual((list.text.match(/class="ns-num"/g) || []).length, 20);
  const bad = await agent.get('/math/rounding/worksheet?grade=4&place=-1&seed=7'); assert.strictEqual(bad.status, 422); assert.match(bad.text, /whole numbers only/);
  const odd = await agent.get('/math/place-value/worksheet?grade=9&digits=99&count=-5&kind=<x>&seed=5'); assert.strictEqual(odd.status, 200);
  assert.strictEqual((await agent.get('/math/rounding/worksheet?grade=5&place=mixed&seed=3&count=24&key=0')).text.match(/Round to the nearest/g).length, 24);
  assert.ok(require('../src/lib/sheets').fromUrl('/math/place-value/worksheet?grade=4&seed=42&key=1'));
  assert.strictEqual((await agent.get('/math/place-value/worksheet?grade=4')).status, 302);
});
