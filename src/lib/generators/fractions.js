'use strict';

const gcd = (a, b) => (b === 0 ? Math.abs(a) : gcd(b, a % b));
const lcm = (a, b) => (a / gcd(a, b)) * b;

// Fractions are { n, d } with d > 0.
function frac(n, d = 1) {
  const g = gcd(n, d) || 1;
  return { n: n / g, d: d / g };
}
const add = (a, b) => frac(a.n * b.d + b.n * a.d, a.d * b.d);
const sub = (a, b) => frac(a.n * b.d - b.n * a.d, a.d * b.d);
const mul = (a, b) => frac(a.n * b.n, a.d * b.d);
const div = (a, b) => frac(a.n * b.d, a.d * b.n);

// "3/8", "1 3/8" or "2" (simplest form)
function show(f) {
  if (f.d === 1) return String(f.n);
  const whole = Math.floor(f.n / f.d);
  const rem = f.n - whole * f.d;
  return whole ? `${whole} ${rem}/${f.d}` : `${rem}/${f.d}`;
}
const raw = (n, d) => `${n}/${d}`;
// Value with its unit: amounts of one or less take the singular ("1/2 cup", "1 cup"), more than one the plural ("1 1/2 cups").
const unit = (f, one, many) => `${show(f)} ${f.n <= f.d ? one : many}`;

module.exports = { gcd, lcm, frac, add, sub, mul, div, show, raw, unit };
