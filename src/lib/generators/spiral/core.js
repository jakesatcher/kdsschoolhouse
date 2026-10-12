'use strict';

// Shared pieces for the Spiral Review sheets: text segments, block builders, number words, formatting.
//
// A "segment" is a string (escaped when rendered) or a small object for math notation:
//   { f: [n, d] } fraction, { m: [w, n, d] } mixed number, { b: 'text' } bold, { sup: '2' } superscript.
// A "cell" is { blocks: [...], answer: 'text' | ['line', ...] }; blocks are rendered by views/sheets/_spiral_cell.ejs.
const F = require('../fractions');
const { int, pick, shuffle } = require('../rng');

const f = (n, d) => ({ f: [n, d] });
const mx = (w, n, d) => ({ m: [w, n, d] });
const b = (s) => ({ b: s });
const sup = (s) => ({ sup: String(s) });
const segs = (...parts) => parts.flat();

// Plain-text version of segments (used in answer keys and tests)
function plain(list) {
  return segs(list).map((s) => {
    if (typeof s === 'string') return s;
    if (s.f) return `${s.f[0]}/${s.f[1]}`;
    if (s.m) return `${s.m[0]} ${s.m[1]}/${s.m[2]}`;
    if (s.sup) return `^${s.sup}`;
    if (s.sp) return '____';
    return s.b;
  }).join('');
}

// Block builders
const text = (...s) => ({ t: 'text', seg: segs(...s) });
const center = (...s) => ({ t: 'center', seg: segs(...s) });
const note = (...s) => ({ t: 'note', seg: segs(...s) });
const line = (post = '', pre = '') => ({ t: 'line', pre, post });
const space = (size = 'm') => ({ t: 'space', size });
const svgBlock = (svg, caption, wide = false) => ({ t: 'svg', svg, caption, wide });
const cell = (blocks, answer) => ({ blocks, answer });

const fmt = (n) => Number(n).toLocaleString('en-US');

// Fraction helpers: a number as a segment (whole, fraction or mixed number) from a reduced F value
function seg(v) {
  const whole = Math.floor(v.n / v.d);
  const rem = v.n - whole * v.d;
  if (v.d === 1) return String(v.n);
  if (!whole) return f(v.n, v.d);
  return mx(whole, rem, v.d);
}
// A mixed number straight from its parts
const mixedSeg = (w, n, d) => (w ? mx(w, n, d) : f(n, d));

// ---- number words ----
const ONES = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen'];
const TENS = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];
function below1000(n) {
  const out = [];
  if (n >= 100) { out.push(`${ONES[Math.floor(n / 100)]} hundred`); n %= 100; }
  if (n >= 20) { out.push(TENS[Math.floor(n / 10)] + (n % 10 ? `-${ONES[n % 10]}` : '')); } else if (n > 0) out.push(ONES[n]);
  return out.join(' ');
}
function words(n) {
  if (n === 0) return 'zero';
  const parts = [];
  if (n >= 1000) { parts.push(`${below1000(Math.floor(n / 1000))} thousand`); n %= 1000; }
  if (n > 0) parts.push(below1000(n));
  return parts.join(' ');
}
const PLACE_NAMES = { 1: 'tenths', 2: 'hundredths', 3: 'thousandths' };
// 47.091 -> "forty-seven and ninety-one thousandths"; 0.703 -> "seven hundred three thousandths"
function decimalWords(whole, fracDigits) {
  const places = fracDigits.length;
  const fracInt = Number(fracDigits);
  const fracPart = `${words(fracInt)} ${fracInt === 1 ? PLACE_NAMES[places].replace(/s$/, '') : PLACE_NAMES[places]}`;
  return whole === 0 ? fracPart : `${words(whole)} and ${fracPart}`;
}

// Decimal as { whole, digits:'091' } helpers
function randomDecimal(rng, { wholeDigits = 2, places = 3, lastNonZero = true } = {}) {
  const whole = wholeDigits === 0 ? 0 : int(rng, wholeDigits === 1 ? 1 : 10 ** (wholeDigits - 1), 10 ** wholeDigits - 1);
  let digits = '';
  for (let i = 0; i < places; i++) digits += int(rng, 0, 9);
  if (lastNonZero && /0$/.test(digits)) digits = digits.slice(0, -1) + int(rng, 1, 9);
  return { whole, digits };
}
const decStr = (d) => `${d.whole}.${d.digits}`;
const decVal = (d) => d.whole + Number(`0.${d.digits}`); // for display/comparison only, never for exact answers

// Exact decimal arithmetic on scaled integers
const scaled = (x, places) => Math.round(x * 10 ** places);
function fromScaled(v, places) {
  if (places === 0) return String(v);
  const neg = v < 0; const a = Math.abs(v);
  const s = String(a).padStart(places + 1, '0');
  return `${neg ? '-' : ''}${s.slice(0, -places)}.${s.slice(-places)}`;
}
function trimDec(s) { return s.includes('.') ? s.replace(/0+$/, '').replace(/\.$/, '') : s; }

// Rounding with half-up, exact on the digit string
function roundDecimalTo(whole, digits, places) {
  // value = whole.digits ; round to `places` decimal places (0 = whole number)
  const total = BigInt(whole) * 10n ** BigInt(digits.length) + BigInt(digits || '0');
  const drop = digits.length - places;
  if (drop <= 0) return `${whole}.${digits.padEnd(places, '0')}`;
  const base = 10n ** BigInt(drop);
  let q = total / base;
  if (total % base >= base / 2n) q += 1n;
  if (places === 0) return String(q);
  const s = String(q).padStart(places + 1, '0');
  return `${s.slice(0, -places)}.${s.slice(-places)}`;
}
function roundWholeTo(n, unit) {
  return Math.floor((n + unit / 2) / unit) * unit;
}

module.exports = {
  f, mx, b, sup, segs, plain, text, center, note, line, space, svgBlock, cell, fmt, seg, mixedSeg,
  words, decimalWords, PLACE_NAMES, randomDecimal, decStr, decVal, scaled, fromScaled, trimDec, roundDecimalTo, roundWholeTo,
  F, int, pick, shuffle,
};
