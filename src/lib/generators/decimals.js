'use strict';

// Decimal worksheets: add, subtract, multiply and divide with up to three decimal places (thousandths).
// All arithmetic is done on scaled integers (value x 10^places), never on floats, so answers are exact.
const { int, pick } = require('./rng');

const fmtInt = (n) => Number(n).toLocaleString('en-US');

// scaled integer + places -> "1,234.560"
function show(value, places) {
  if (places === 0) return fmtInt(value);
  const s = String(value).padStart(places + 1, '0');
  return `${fmtInt(s.slice(0, -places))}.${s.slice(-places)}`;
}
// same, with trailing zeros removed ("3.40" -> "3.4", "5.00" -> "5")
function trim(value, places) {
  let v = value;
  let p = places;
  while (p > 0 && v % 10 === 0) { v /= 10; p--; }
  return show(v, p);
}

// A decimal with exactly `places` places (last digit never 0) and `digits` digits before the point.
function decimal(rng, digits, places) {
  const whole = int(rng, digits === 1 ? 1 : 10 ** (digits - 1), 10 ** digits - 1);
  if (!places) return { value: whole, places: 0 };
  const frac = int(rng, 1, 10 ** places - 1);
  const last = frac % 10 === 0 ? frac + int(rng, 1, 9) : frac; // keep every place meaningful
  return { value: whole * 10 ** places + last, places };
}
const placesFor = (rng, v) => (v === 'mixed' ? int(rng, 1, 3) : Number(v));
const rescale = (d, to) => d.value * 10 ** (to - d.places);

// Add / subtract. With "mixed" places the numbers in one problem may have different places, so the point must be lined up.
function addSub(rng, op, { digits = 2, places = '2', count = 20, addends = 2 }) {
  const out = [];
  while (out.length < count) {
    const n = op === '+' ? addends : 2;
    const nums = Array.from({ length: n }, () => decimal(rng, digits, placesFor(rng, places)));
    const P = Math.max(...nums.map((x) => x.places));
    if (places === 'mixed' && new Set(nums.map((x) => x.places)).size === 1) continue;
    let total;
    if (op === '+') total = nums.reduce((s, x) => s + rescale(x, P), 0);
    else {
      nums.sort((a, b) => rescale(b, P) - rescale(a, P));
      total = rescale(nums[0], P) - rescale(nums[1], P);
      if (total === 0) continue;
    }
    out.push({
      op: op === '+' ? '+' : '−',
      operands: nums.map((x) => show(x.value, x.places)),
      pads: nums.map((x) => P - x.places), // invisible zeros so the decimal points line up in a stacked problem
      answerText: trim(total, P),
      work: 0,
    });
  }
  return out;
}

function multiply(rng, { digits = 1, places = '2', count = 20, second = 'whole' }) {
  const out = [];
  while (out.length < count) {
    const a = decimal(rng, digits, placesFor(rng, places));
    const asDecimal = second === 'decimal' || (second === 'mixed' && rng() < 0.5);
    const b = asDecimal ? decimal(rng, 1, Math.min(2, placesFor(rng, places) || 1)) : { value: pick(rng, [2, 3, 4, 5, 6, 7, 8, 9, 10, 12, 15, 20, 25, 36]), places: 0 };
    const product = a.value * b.value;
    out.push({
      op: '×',
      operands: [show(a.value, a.places), show(b.value, b.places)],
      answerText: trim(product, a.places + b.places),
      work: 3,
    });
  }
  return out;
}

// Division always terminates: build quotient x divisor = dividend on scaled integers.
function divide(rng, { digits = 1, places = '2', count = 20, second = 'whole' }) {
  const out = [];
  while (out.length < count) {
    const p = placesFor(rng, places);
    const asDecimal = second === 'decimal' || (second === 'mixed' && rng() < 0.5);
    const dp = asDecimal ? 1 : 0;
    const qp = Math.max(0, p - dp); // dividend always has p places
    const divisor = asDecimal ? pick(rng, [2, 3, 4, 5, 6, 8, 12, 15, 24, 25, 32, 45]) : pick(rng, [2, 3, 4, 5, 6, 7, 8, 9, 11, 12, 15, 25]);
    if (asDecimal && divisor % 10 === 0) continue;
    const q = decimal(rng, digits, qp);
    if (q.value <= 0) continue;
    const dividend = divisor * q.value;
    out.push({
      op: '÷',
      operands: [trim(dividend, dp + qp), show(divisor, dp)],
      answerText: trim(q.value, qp),
      work: 3,
    });
  }
  return out;
}

function decimals(rng, { op = 'add', ...rest }) {
  if (op === 'add') return addSub(rng, '+', rest);
  if (op === 'sub') return addSub(rng, '-', rest);
  if (op === 'mul') return multiply(rng, rest);
  return divide(rng, rest);
}

module.exports = { decimals, show, trim, decimal };
