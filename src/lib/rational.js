'use strict';

// Exact arithmetic for checking AI-written answers. Evaluates "8*(3/4)", "12.5 + 3*0.25", "(2+3)/4" ... with BigInt
// rationals, and parses answers such as "6", "$4.50", "3/4", "1 1/2" or "2,350". Anything else throws, so only plain
// arithmetic is ever evaluated (never eval).
const gcd = (a, b) => { a = a < 0n ? -a : a; b = b < 0n ? -b : b; while (b) { [a, b] = [b, a % b]; } return a; };
const make = (n, d = 1n) => { if (d === 0n) throw new Error('division by zero'); if (d < 0n) { n = -n; d = -d; } const g = gcd(n, d) || 1n; return { n: n / g, d: d / g }; };
const add = (a, b) => make(a.n * b.d + b.n * a.d, a.d * b.d);
const sub = (a, b) => make(a.n * b.d - b.n * a.d, a.d * b.d);
const mul = (a, b) => make(a.n * b.n, a.d * b.d);
const div = (a, b) => make(a.n * b.d, a.d * b.n);
const eq = (a, b) => a.n === b.n && a.d === b.d;

function parseNumber(s) {
  const m = /^(\d+)(?:\.(\d+))?$/.exec(s);
  if (!m) throw new Error('bad number');
  const frac = m[2] || '';
  return make(BigInt(m[1] + frac), 10n ** BigInt(frac.length));
}

function evaluate(expr) {
  const src = String(expr).replace(/[×x·]/g, '*').replace(/[÷]/g, '/').replace(/−/g, '-').replace(/[,$]/g, '').replace(/\s+/g, '');
  if (!src || src.length > 200 || !/^[0-9+\-*/().]+$/.test(src)) throw new Error('not plain arithmetic');
  let i = 0;
  const peek = () => src[i];
  function atom() {
    if (peek() === '(') { i++; const v = sum(); if (peek() !== ')') throw new Error('missing )'); i++; return v; }
    if (peek() === '-') { i++; const v = atom(); return make(-v.n, v.d); }
    let j = i; while (j < src.length && /[0-9.]/.test(src[j])) j++;
    if (j === i) throw new Error('number expected');
    const v = parseNumber(src.slice(i, j)); i = j; return v;
  }
  function product() { let v = atom(); while (peek() === '*' || peek() === '/') { const op = src[i++]; const r = atom(); v = op === '*' ? mul(v, r) : div(v, r); } return v; }
  function sum() { let v = product(); while (peek() === '+' || peek() === '-') { const op = src[i++]; const r = product(); v = op === '+' ? add(v, r) : sub(v, r); } return v; }
  const v = sum();
  if (i !== src.length) throw new Error('unexpected text');
  return v;
}

// "6", "6.5", "$4.50", "3/4", "1 1/2", "2,350", "6 bottles" (a trailing unit is ignored) -> rational, or null
function parseAnswer(text) {
  const t = String(text == null ? '' : text).trim().replace(/[$,]/g, '').replace(/^about\s+/i, '');
  let m = /^(\d+)\s+(\d+)\/(\d+)(?:\s+[A-Za-z].*)?$/.exec(t);
  if (m) return add(make(BigInt(m[1])), make(BigInt(m[2]), BigInt(m[3])));
  m = /^(\d+)\/(\d+)(?:\s+[A-Za-z].*)?$/.exec(t);
  if (m) return make(BigInt(m[1]), BigInt(m[2]));
  m = /^(\d+(?:\.\d+)?)(?:\s+[A-Za-z%].*)?$/.exec(t);
  if (m) return parseNumber(m[1]);
  return null;
}

module.exports = { evaluate, parseAnswer, eq, make };
