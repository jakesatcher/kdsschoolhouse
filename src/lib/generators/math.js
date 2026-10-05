'use strict';

const { int, shuffle } = require('./rng');

const fmt = (n) => Number(n).toLocaleString('en-US');

function digitsRange(d) {
  return [10 ** (d - 1), 10 ** d - 1];
}

function digitsOf(n) {
  return String(n).split('').reverse().map(Number);
}

function carries(nums) {
  const cols = nums.map(digitsOf);
  const len = Math.max(...cols.map((c) => c.length));
  let carry = 0;
  let count = 0;
  for (let i = 0; i < len; i++) {
    const sum = carry + cols.reduce((s, c) => s + (c[i] || 0), 0);
    carry = Math.floor(sum / 10);
    if (carry > 0) count++;
  }
  return count;
}

function borrows(a, b) {
  const x = digitsOf(a);
  const y = digitsOf(b);
  let borrow = 0;
  let count = 0;
  for (let i = 0; i < x.length; i++) {
    const top = x[i] - borrow;
    const bottom = y[i] || 0;
    if (top < bottom) {
      borrow = 1;
      count++;
    } else borrow = 0;
  }
  return count;
}

// Every problem: { op, operands:[...], answer, answerText, layout }
function addition(rng, { digits = 2, count = 20, addends = 2, regroup = 'always' }) {
  const [lo, hi] = digitsRange(digits);
  const out = [];
  while (out.length < count) {
    let nums;
    let tries = 0;
    do {
      nums = Array.from({ length: addends }, () => int(rng, lo, hi));
      tries++;
    } while (regroup === 'always' && carries(nums) === 0 && tries < 500);
    const answer = nums.reduce((s, n) => s + n, 0);
    out.push({ op: '+', operands: nums, answer, answerText: fmt(answer) });
  }
  return out;
}

function subtraction(rng, { digits = 2, count = 20, regroup = 'always' }) {
  const [lo, hi] = digitsRange(digits);
  const out = [];
  while (out.length < count) {
    let a;
    let b;
    let tries = 0;
    do {
      a = int(rng, lo, hi);
      b = int(rng, lo, hi);
      if (b > a) [a, b] = [b, a];
      tries++;
    } while ((a === b || (regroup === 'always' && borrows(a, b) === 0)) && tries < 500);
    out.push({ op: '−', operands: [a, b], answer: a - b, answerText: fmt(a - b) });
  }
  return out;
}

// Cycles through every value in `values` (shuffled) so a fact family worksheet covers the whole family.
function cycle(rng, values, count) {
  const out = [];
  while (out.length < count) out.push(...shuffle(rng, values));
  return out.slice(0, count);
}

const FACTS = Array.from({ length: 13 }, (_, i) => i); // 0..12

// Number with `d` digits for a multi-digit factor. One-digit numbers are 0-9; longer ones span the whole range (10-99, 100-999, ...).
const digitsNumber = (rng, d) => (d === 1 ? int(rng, 0, 9) : int(rng, ...digitsRange(d)));
const pickDigits = (rng, v, lo, hi) => (v === 'mixed' ? int(rng, lo, hi) : Number(v));

// Multiplication: facts (0-12), multi (choose the digits of each number: 1-4 digits x 1-2 digits), or mixed.
function multiplication(rng, { factor = 'all', mode = 'facts', count = 20, top = '2', bottom = '1' }) {
  const out = [];
  // `work` = extra lines of workspace under the problem (a 2-digit multiplier needs partial products).
  const push = (a, b, work = 0) => out.push({ op: '×', operands: [a, b], answer: a * b, answerText: fmt(a * b), work });
  if (mode === 'facts') {
    if (factor === 'all') {
      const pairs = [];
      for (const a of FACTS) for (const b of FACTS) pairs.push([a, b]);
      cycle(rng, pairs, count).forEach(([a, b]) => push(a, b));
    } else {
      const f = Number(factor);
      cycle(rng, FACTS, count).forEach((b) => (rng() < 0.5 ? push(f, b) : push(b, f)));
    }
  } else if (mode === 'multi') {
    for (let i = 0; i < count; i++) {
      const t = pickDigits(rng, top, 1, 4);
      const b = pickDigits(rng, bottom, 1, 2);
      push(digitsNumber(rng, t), digitsNumber(rng, b), b >= 2 ? 2 : 0);
    }
  } else {
    // mixed: facts plus multi-digit work
    for (let i = 0; i < count; i++) {
      const kind = int(rng, 0, 3);
      if (kind === 0) push(int(rng, 0, 12), int(rng, 0, 12));
      else if (kind === 1) push(int(rng, 10, 99), int(rng, 2, 9));
      else if (kind === 2) push(int(rng, 100, 999), int(rng, 2, 9));
      else push(int(rng, 11, 99), int(rng, 11, 99), 2);
    }
  }
  return out;
}

// One long-division problem: `dd`-digit dividend, divisor of `vd` digits, exact or with a remainder.
// The quotient is always at least 2 so the problem is worth working out. Returns null if no problem fits.
function longDivision(rng, dd, vd, withRemainder) {
  const [lo, hi] = digitsRange(dd);
  const vLo = vd === 1 ? 2 : 10; // 1-digit divisors are 2-9; 2-digit divisors are 10-99
  const vHi = Math.min(vd === 1 ? 9 : 99, Math.floor(hi / 2));
  if (vLo > vHi) return null;
  for (let tries = 0; tries < 200; tries++) {
    const d = int(rng, vLo, vHi);
    const r = withRemainder ? int(rng, 1, d - 1) : 0;
    const qLo = Math.max(2, Math.ceil((lo - r) / d));
    const qHi = Math.floor((hi - r) / d);
    if (qLo > qHi) continue;
    const q = int(rng, qLo, qHi);
    return { dividend: d * q + r, d, q, r };
  }
  return null;
}

// Division: facts (0-12), multi (up to 4-digit dividends by 1-2 digit divisors, with/without remainders), or mixed.
function division(rng, { divisor = 'all', mode = 'facts', count = 20, dividend: dvd = '3', vdigits = '1', remainders = 'mixed' }) {
  const out = [];
  const push = (dividend, d, q, r = 0, work = 0) =>
    out.push({ op: '÷', operands: [dividend, d], answer: q, remainder: r, answerText: r ? `${fmt(q)} R ${r}` : fmt(q), work });
  if (mode === 'facts') {
    const divisors = Array.from({ length: 12 }, (_, i) => i + 1); // never divide by zero
    if (divisor === 'all') {
      const pairs = [];
      for (const d of divisors) for (const q of FACTS) pairs.push([d, q]);
      cycle(rng, pairs, count).forEach(([d, q]) => push(d * q, d, q));
    } else {
      const d = Number(divisor);
      cycle(rng, FACTS, count).forEach((q) => push(d * q, d, q));
    }
  } else if (mode === 'multi') {
    for (let i = 0; i < count; i++) {
      let p = null;
      while (!p) {
        const dd = pickDigits(rng, dvd, 2, 4);
        const vd = pickDigits(rng, vdigits, 1, 2);
        const rem = remainders === 'mixed' ? rng() < 0.5 : remainders === 'with';
        p = longDivision(rng, dd, vd, rem);
      }
      // long division needs room: more digits in the dividend or divisor means more lines of work
      push(p.dividend, p.d, p.q, p.r, String(p.dividend).length >= 3 || p.d >= 10 ? 3 : 2);
    }
  } else {
    for (let i = 0; i < count; i++) {
      const kind = int(rng, 0, 3);
      if (kind === 0) {
        const d = int(rng, 1, 12);
        const q = int(rng, 0, 12);
        push(d * q, d, q);
      } else if (kind === 1) {
        const d = int(rng, 2, 9);
        const q = int(rng, 10, 99);
        const r = int(rng, 0, d - 1);
        push(d * q + r, d, q, r);
      } else if (kind === 2) {
        const d = int(rng, 2, 9);
        const q = int(rng, 100, 999);
        const r = int(rng, 0, d - 1);
        push(d * q + r, d, q, r);
      } else {
        const d = int(rng, 11, 25);
        const q = int(rng, 10, 99);
        const r = int(rng, 0, d - 1);
        push(d * q + r, d, q, r);
      }
    }
  }
  return out;
}

module.exports = { addition, subtraction, multiplication, division, longDivision, carries, borrows, fmt };
