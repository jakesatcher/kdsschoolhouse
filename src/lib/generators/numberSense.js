'use strict';

// Place value and rounding practice.
//   Grade 4: whole numbers up to the millions place.
//   Grade 5: whole numbers up to the millions place AND decimals to the thousandths place.
// Every number is built from digits (never floats), and rounding is done on a BigInt so the answers are exact.
const { int, pick } = require('./rng');

const WHOLE_PLACES = ['ones', 'tens', 'hundreds', 'thousands', 'ten thousands', 'hundred thousands', 'millions'];
const DEC_PLACES = ['tenths', 'hundredths', 'thousandths'];
// Rounding places by exponent: 1 = nearest ten ... 6 = nearest million, 0 = nearest whole number, -1 = tenth, -2 = hundredth
const ROUND_NAMES = { 6: 'million', 5: 'hundred thousand', 4: 'ten thousand', 3: 'thousand', 2: 'hundred', 1: 'ten', 0: 'whole number', '-1': 'tenth', '-2': 'hundredth' };
const ROUND_ORDER = [1, 2, 3, 4, 5, 6, 0, -1, -2];

const commas = (s) => String(s).replace(/\B(?=(\d{3})+(?!\d))/g, ',');

// ---------- building numbers ----------
// A number is { whole: '4370215', frac: '' | '916' }
function wholeDigits(rng, len) {
  let s = String(int(rng, 1, 9));
  for (let i = 1; i < len; i++) s += int(rng, 0, 9);
  return s;
}
function wholeLength(rng, max, min = 4) {
  return rng() < 0.5 ? max : int(rng, Math.min(min, max), max);
}
function makeWhole(rng, max, min = 4) { return { whole: wholeDigits(rng, wholeLength(rng, max, min)), frac: '' }; }
function makeDecimal(rng, places, { minFrac = 1 } = {}) {
  const p = places === 'mixed' ? int(rng, Math.max(1, minFrac), 3) : Math.max(Number(places), minFrac);
  let frac = '';
  for (let i = 0; i < p; i++) frac += int(rng, 0, 9);
  if (frac.endsWith('0')) frac = frac.slice(0, -1) + int(rng, 1, 9);
  const wholeLen = int(rng, 1, 4);
  const whole = rng() < 0.12 ? '0' : wholeDigits(rng, wholeLen);
  return { whole, frac };
}
const show = (n) => commas(n.whole) + (n.frac ? `.${n.frac}` : '');

// Every digit of a number with its place name, value text and whether it is in the whole or decimal part
function digitsOf(n) {
  const out = [];
  const w = n.whole;
  for (let i = 0; i < w.length; i++) {
    const exp = w.length - 1 - i;
    out.push({ digit: w[i], place: WHOLE_PLACES[exp], value: commas(w[i] + '0'.repeat(exp)), part: 'whole', index: i });
  }
  for (let i = 0; i < n.frac.length; i++) {
    out.push({ digit: n.frac[i], place: DEC_PLACES[i], value: `0.${'0'.repeat(i)}${n.frac[i]}`, part: 'frac', index: i });
  }
  return out;
}
// The number split around one digit, so the page can underline it: [before, digit, after]
function wholeSplit(n, d) {
  // keep commas in the right place: format the whole number, then find the d.index-th digit in the formatted string
  const f = commas(n.whole); let seen = -1; let pos = 0;
  for (let i = 0; i < f.length; i++) { if (f[i] !== ',') { seen += 1; if (seen === d.index) { pos = i; break; } } }
  return [f.slice(0, pos), f[pos], f.slice(pos + 1) + (n.frac ? `.${n.frac}` : '')];
}
const splitFor = (n, d) => (d.part === 'whole' ? wholeSplit(n, d) : [`${commas(n.whole)}.${n.frac.slice(0, d.index)}`, d.digit, n.frac.slice(d.index + 1)]);

// ---------- place value ----------
function placeValue(rng, { grade = 4, digits = 7, numbers = 'whole', decimals = 'mixed', kind = 'mixed', count = 10 }) {
  const out = [];
  const kinds = ['place', 'value', 'digit'];
  for (let i = 0; out.length < count && i < count * 20; i++) {
    const useDec = grade === 5 && (numbers === 'decimal' || (numbers === 'mixed' && i % 2 === 1));
    const n = useDec ? makeDecimal(rng, decimals) : makeWhole(rng, digits);
    const ds = digitsOf(n);
    const k = kind === 'mixed' ? kinds[out.length % 3] : kind;
    let d;
    if (k === 'value') { const nz = ds.filter((x) => x.digit !== '0'); d = pick(rng, nz); } else d = pick(rng, ds);
    const num = show(n);
    if (k === 'place') {
      out.push({ kind: k, q: 'In what place is the underlined digit?', num: splitFor(n, d), plain: num, answerText: d.place, n, target: d });
    } else if (k === 'value') {
      out.push({ kind: k, q: 'What is the value of the underlined digit?', num: splitFor(n, d), plain: num, answerText: d.value, n, target: d });
    } else {
      out.push({ kind: k, q: `Which digit is in the ${d.place} place?`, num: [num, '', ''], plain: num, answerText: d.digit, n, target: d });
    }
  }
  return out;
}

// ---------- rounding ----------
// Exact half-up rounding to 10^exp. exp >= 0: tens, hundreds ... ; exp < 0: tenths, hundredths ...
function roundExact(n, exp) {
  const S = BigInt(n.whole) * 1000n + BigInt((n.frac || '').padEnd(3, '0'));
  const unit = 10n ** BigInt(exp + 3);
  const R = ((S + unit / 2n) / unit) * unit;
  const whole = (R / 1000n).toString();
  if (exp >= 0) return commas(whole);
  const frac = (R % 1000n).toString().padStart(3, '0').slice(0, -exp);
  return `${commas(whole)}.${frac}`;
}

// Rounding places that make sense for a given number: whole numbers need more digits than the place; decimals need more places
function placesFor(n) {
  if (n.frac) return [0, -1, -2].filter((e) => n.frac.length > -e || e === 0);
  return [1, 2, 3, 4, 5, 6].filter((e) => n.whole.length > e);
}

function rounding(rng, { grade = 4, digits = 7, numbers = 'whole', decimals = 'mixed', place = 'mixed', count = 12 }) {
  const out = [];
  const exact = place !== 'mixed' ? Number(place) : null;
  for (let i = 0; out.length < count && i < count * 40; i++) {
    let n;
    let exp;
    if (exact !== null) {
      if (exact <= 0) {
        // nearest whole number / tenth / hundredth: need more decimal places than the target
        const minFrac = exact === 0 ? 1 : -exact + 1;
        n = makeDecimal(rng, decimals === 'mixed' ? 'mixed' : String(Math.max(Number(decimals), minFrac)), { minFrac });
      } else {
        n = makeWhole(rng, digits, Math.min(digits, exact + 1));
        if (n.whole.length <= exact) continue;
      }
      exp = exact;
    } else {
      const useDec = grade === 5 && (numbers === 'decimal' || (numbers === 'mixed' && i % 2 === 1));
      n = useDec ? makeDecimal(rng, decimals, { minFrac: 2 }) : makeWhole(rng, digits, 3);
      const choices = placesFor(n);
      if (!choices.length) continue;
      exp = pick(rng, choices);
    }
    if (out.some((p) => p.plain === show(n) && p.exp === exp)) continue;
    out.push({ kind: 'round', exp, placeName: ROUND_NAMES[exp], n, plain: show(n), answerText: roundExact(n, exp) });
  }
  return out;
}

const validRoundPlace = (grade, digits, place) => {
  if (place === 'mixed') return '';
  const e = Number(place);
  if (!ROUND_ORDER.includes(e)) return 'Choose one of the rounding places in the list.';
  if (e <= 0 && grade !== 5) return 'Grade 4 rounds whole numbers only. Pick a whole-number place, or switch to grade 5 for decimals.';
  if (e > 0 && e >= digits) return `Rounding to the nearest ${ROUND_NAMES[e]} needs numbers with at least ${e + 1} digits. Choose a larger number size.`;
  return '';
};

module.exports = { placeValue, rounding, roundExact, digitsOf, splitFor, show, ROUND_NAMES, ROUND_ORDER, WHOLE_PLACES, DEC_PLACES, validRoundPlace };
