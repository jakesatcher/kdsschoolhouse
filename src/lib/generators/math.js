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

function multiplication(rng, { factor = 'all', mode = 'facts', count = 20 }) {
  const out = [];
  const push = (a, b) => out.push({ op: '×', operands: [a, b], answer: a * b, answerText: fmt(a * b) });
  if (mode === 'facts') {
    if (factor === 'all') {
      const pairs = [];
      for (const a of FACTS) for (const b of FACTS) pairs.push([a, b]);
      cycle(rng, pairs, count).forEach(([a, b]) => push(a, b));
    } else {
      const f = Number(factor);
      cycle(rng, FACTS, count).forEach((b) => (rng() < 0.5 ? push(f, b) : push(b, f)));
    }
  } else {
    // mixed: facts plus multi-digit work
    for (let i = 0; i < count; i++) {
      const kind = int(rng, 0, 3);
      if (kind === 0) push(int(rng, 0, 12), int(rng, 0, 12));
      else if (kind === 1) push(int(rng, 10, 99), int(rng, 2, 9));
      else if (kind === 2) push(int(rng, 100, 999), int(rng, 2, 9));
      else push(int(rng, 11, 99), int(rng, 11, 99));
    }
  }
  return out;
}

function division(rng, { divisor = 'all', mode = 'facts', count = 20 }) {
  const out = [];
  const push = (dividend, d, q, r = 0) =>
    out.push({ op: '÷', operands: [dividend, d], answer: q, remainder: r, answerText: r ? `${fmt(q)} R ${r}` : fmt(q) });
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

module.exports = { addition, subtraction, multiplication, division, carries, borrows, fmt };
