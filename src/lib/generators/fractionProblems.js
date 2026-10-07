'use strict';

// Fraction worksheets: add, subtract, multiply and divide fractions and mixed numbers, with like or unlike denominators.
// Operands are { w, n, d } (whole part, numerator, denominator); a plain whole number is { w: k, n: 0, d: 1 }.
const { int, pick } = require('./rng');
const F = require('./fractions');

const value = (o) => F.frac(o.w * o.d + o.n, o.d);
const text = (o) => (o.n === 0 ? String(o.w) : `${o.w ? `${o.w} ` : ''}${o.n}/${o.d}`);
const whole = (k) => ({ w: k, n: 0, d: 1 });

function fraction(rng, d, form) {
  let n = int(rng, 1, d - 1);
  for (let i = 0; i < 50 && F.gcd(n, d) !== 1; i++) n = int(rng, 1, d - 1); // operands are in lowest terms
  if (F.gcd(n, d) !== 1) n = 1;
  const asMixed = form === 'mixed' || (form === 'mix' && rng() < 0.5);
  return { w: asMixed ? int(rng, 1, 4) : 0, n, d };
}

// Picks two denominators according to the teacher's choice.
function denominators(rng, den, maxDen) {
  const like = den === 'like' || (den === 'mixed' && rng() < 0.4);
  const d1 = int(rng, 2, maxDen);
  if (like) return [d1, d1];
  for (let i = 0; i < 100; i++) {
    const d2 = int(rng, 2, maxDen);
    if (d2 !== d1 && F.lcm(d1, d2) <= 72) return [d1, d2];
  }
  return [d1, d1 === 2 ? 3 : 2];
}

function fractionProblems(rng, { op = 'add', den = 'mixed', form = 'proper', maxDen = 8, count = 20 }) {
  const out = [];
  const seen = new Set();
  let guard = 0;
  while (out.length < count && guard++ < count * 200) {
    const [d1, d2] = denominators(rng, den, maxDen);
    let a = fraction(rng, d1, form);
    let b = fraction(rng, d2, form);
    // multiplying / dividing: now and then use a whole number so fraction x whole number and whole number / fraction appear
    if ((op === 'mul' || op === 'div') && form === 'mix' && rng() < 0.2) {
      if (rng() < 0.5) a = whole(int(rng, 2, 9)); else b = whole(int(rng, 2, 9));
    }
    let va = value(a);
    let vb = value(b);
    let sym = { add: '+', sub: '−', mul: '×', div: '÷' }[op];
    if (op === 'sub') {
      const diff = F.sub(va, vb).n;
      if (diff === 0) continue;
      if (diff < 0) { [a, b] = [b, a]; [va, vb] = [vb, va]; }
    }
    if (op === 'div' && a.n === 0 && b.n === 0) continue;
    const result = { add: F.add, sub: F.sub, mul: F.mul, div: F.div }[op](va, vb);
    if (result.d > (op === 'add' || op === 'sub' ? 72 : 64) || result.n > 80) continue;
    if (text(a) === text(b)) continue;
    const key = `${text(a)}${sym}${text(b)}`;
    if (seen.has(key) && guard < count * 100) continue; // repeats only when the choices are nearly used up
    seen.add(key);
    out.push({ op: sym, fr: true, operands: [a, b], expr: `${text(a)} ${sym} ${text(b)}`, answerText: F.show(result), work: 0 });
  }
  return out;
}

module.exports = { fractionProblems, text };
