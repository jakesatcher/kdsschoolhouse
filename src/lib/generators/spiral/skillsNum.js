'use strict';

// Place value, rounding, comparing, powers of ten and whole-number / decimal computation skills.
const C = require('./core');
const { f, sup, segs, text, center, line, cell, fmt, words, decimalWords, randomDecimal, decStr, scaled, fromScaled, trimDec, roundDecimalTo, roundWholeTo, int, pick, shuffle } = C;

// Move the decimal point: k > 0 multiplies by 10^k, k < 0 divides. Works on digit strings so it is exact.
function shiftPoint(str, k) {
  let [w, d = ''] = String(str).replace(/,/g, '').split('.');
  if (k > 0) { d = d.padEnd(k, '0'); w += d.slice(0, k); d = d.slice(k); } else if (k < 0) { const m = -k; w = w.padStart(m + 1, '0'); d = w.slice(-m) + d; w = w.slice(0, -m); }
  w = w.replace(/^0+(?=\d)/, ''); d = d.replace(/0+$/, '');
  return `${Number(w).toLocaleString('en-US')}${d ? `.${d}` : ''}`;
}
const commas = (n) => Number(n).toLocaleString('en-US');
const opt = (r, v) => (Array.isArray(v) ? pick(r, v) : v);

const skills = {
  // "Write 8 x 1 + 4 x (1/10) + 7 x (1/100) in standard form."
  expandedFrac(r, p = {}) {
    const places = p.places || 2;
    const d = Array.from({ length: places + 1 }, (_, i) => (i === 0 ? int(r, 1, 9) : int(r, 1, 9)));
    const unit = [null, [1, 10], [1, 100], [1, 1000]];
    const terms = d.map((x, i) => (i === 0 ? [`${x} × 1`] : [`${x} × (`, f(...unit[i]), ')']));
    const out = [];
    terms.forEach((t, i) => { if (i) out.push(' + '); out.push(...t); });
    const std = `${d[0]}.${d.slice(1).join('')}`;
    return cell([text('Write ', ...out, ' in standard form.'), line()], std);
  },
  wordToStd(r, p = {}) {
    // sixty-three thousandths / thirty-seven and four hundred sixty-one thousandths
    const places = opt(r, p.places || 3);
    const wholeNum = p.whole === false ? 0 : int(r, 2, 99);
    const digits = randomDecimal(r, { wholeDigits: 0, places }).digits;
    if (p.whole === false) {
      const std = `0.${digits}`;
      return cell([text('Write ', C.decimalWords(0, digits), ' in standard form.'), line()], std);
    }
    return cell([text('Write ', decimalWords(wholeNum, digits), ' in standard form.'), line()], `${wholeNum}.${digits}`);
  },
  // "Write 800,000 + 70,000 + 1,000 + 4 in standard form."
  sumToStd(r, p = {}) {
    if (p.kind === 'dec') {
      const w = randomDecimal(r, { wholeDigits: 3, places: 3, lastNonZero: true });
      const wd = String(w.whole).split('').map(Number);
      const terms = [];
      wd.forEach((x, i) => { if (x) terms.push(String(x * 10 ** (wd.length - 1 - i))); });
      w.digits.split('').forEach((x, i) => { if (x !== '0') terms.push(`0.${'0'.repeat(i)}${x}`); });
      return cell([text('Write ', terms.join(' + '), ' in standard form.'), line()], decStr(w));
    }
    const n = int(r, 100000, 999999);
    const ds = String(n).split('').map(Number);
    if (ds[3] === 0 || r() < 0.5) ds[3] = 0;
    if (r() < 0.5) ds[1] = 0;
    const total = Number(ds.join(''));
    const terms = [];
    ds.forEach((x, i) => { if (x) terms.push(commas(x * 10 ** (ds.length - 1 - i))); });
    return cell([text('Write ', terms.join(' + '), ' in standard form.'), line()], commas(total));
  },
  sumToWord(r) {
    const w = randomDecimal(r, { wholeDigits: 3, places: 3 });
    const wd = String(w.whole).split('').map(Number);
    const terms = [];
    wd.forEach((x, i) => { if (x) terms.push(String(x * 10 ** (wd.length - 1 - i))); });
    w.digits.split('').forEach((x, i) => { if (x !== '0') terms.push(`0.${'0'.repeat(i)}${x}`); });
    return cell([text('Write ', terms.join(' + '), ' in word form.')], decimalWords(w.whole, w.digits));
  },
  numToWord(r, p = {}) {
    const places = opt(r, p.places || 2);
    const w = randomDecimal(r, { wholeDigits: opt(r, p.wholeDigits ?? 1), places, lastNonZero: p.trailingZero ? false : true });
    if (p.trailingZero) w.digits = w.digits.slice(0, -1) + '0';
    const answer = decimalWords(w.whole, w.digits.replace(/0+$/, '') || w.digits);
    // a trailing zero keeps its place name: 6.870 -> "six and eight hundred seventy thousandths"
    const a = p.trailingZero ? decimalWords(w.whole, w.digits) : answer;
    return cell([text('Write ', decStr(w), ' in word form.')], a);
  },
  numToExpanded(r, p = {}) {
    const places = p.places || 2;
    const w = randomDecimal(r, { wholeDigits: opt(r, p.wholeDigits ?? 3), places });
    const wd = String(w.whole).split('').map(Number);
    const terms = [];
    wd.forEach((x, i) => { if (x) terms.push(String(x * 10 ** (wd.length - 1 - i))); });
    w.digits.split('').forEach((x, i) => { if (x !== '0') terms.push(`0.${'0'.repeat(i)}${x}`); });
    return cell([text('Write ', decStr(w), ' in expanded form.')], terms.join(' + '));
  },
  // "What is the value of 5 in 7.859?"
  placeValueOf(r) {
    const pool = shuffle(r, [1, 2, 3, 4, 5, 6, 7, 8, 9]);
    const whole = pool[0]; const d = pool.slice(1, 4);
    const idx = int(r, 0, 2);
    const names = ['tenths', 'hundredths', 'thousandths'];
    const value = `0.${'0'.repeat(idx)}${d[idx]}`;
    return cell([text(`What is the value of ${d[idx]} in ${whole}.${d.join('')}?`), line()], `${value} (${d[idx]} ${d[idx] === 1 ? names[idx].replace(/s$/, '') : names[idx]})`);
  },
  // "How many hundredths are in the number 80.965?"
  placeCount(r, p = {}) {
    const k = opt(r, p.unit || [1, 2]);
    const w = randomDecimal(r, { wholeDigits: opt(r, p.wholeDigits ?? 2), places: 3 });
    const count = Number(`${w.whole}${w.digits.slice(0, k)}`);
    const name = { 1: 'tenths', 2: 'hundredths', 3: 'thousandths' }[k];
    return cell([text(`How many ${name} are in the number ${commas(w.whole)}.${w.digits}?`), line()], commas(count));
  },
  // "70 hundreds = ___ ones", "___ thousands = 80 hundreds"
  unitsEq(r, p = {}) {
    const form = opt(r, p.form || ['ones-from', 'blank-first']);
    const units = { tens: 10, hundreds: 100, thousands: 1000 };
    if (form === 'blank-first') {
      // __ thousands = N hundreds  (or __ hundreds = N tens)
      const [big, small] = pick(r, [['thousands', 'hundreds'], ['hundreds', 'tens'], ['thousands', 'tens']]);
      const ratio = units[big] / units[small];
      const n = ratio * int(r, 2, 9) * (ratio === 10 ? 1 : 1);
      const total = n * units[small];
      return cell([{ t: 'line', pre: '', post: `${big} = ${commas(n)} ${small}` }], commas(total / units[big]));
    }
    const unit = pick(r, ['tens', 'hundreds', 'thousands']);
    const n = unit === 'tens' ? int(r, 5, 25) : int(r, 2, 90);
    return cell([{ t: 'line', pre: `${n} ${unit} = `, post: 'ones' }], commas(n * units[unit]));
  },
  roundDec(r, p = {}) {
    const to = p.to || 'tenth';
    const places = { whole: 0, tenth: 1, hundredth: 2, thousandth: 3 }[to];
    const want = p.digits || Math.min(3, places + 1 + int(r, 0, 1));
    const w = randomDecimal(r, { wholeDigits: opt(r, p.wholeDigits ?? 2), places: Math.max(want, places + 1) });
    const ans = roundDecimalTo(w.whole, w.digits, places);
    const nearest = to === 'whole' ? 'whole number' : to;
    return cell([text(`Round ${commas(w.whole)}.${w.digits} to the nearest ${nearest}.`), line()], ans);
  },
  roundWhole(r, p = {}) {
    const unit = p.unit || 100;
    const n = p.digits ? int(r, 10 ** (p.digits - 1), 10 ** p.digits - 1) : int(r, 10000, 899999);
    const name = { 10: 'ten', 100: 'hundred', 1000: 'thousand', 10000: 'ten thousand' }[unit];
    return cell([text(`Round ${commas(n)} to the nearest ${name}.`), line()], commas(roundWholeTo(n, unit)));
  },
  roundWholeList(r, p = {}) {
    const unit = p.unit || 10000;
    const nums = Array.from({ length: 3 }, () => int(r, 10000, 89999));
    const name = { 100: 'hundred', 1000: 'thousand', 10000: 'ten thousand' }[unit];
    return cell([text(`Round each number to the nearest ${name}.`), { t: 'list', rows: nums.map((n) => ({ seg: [commas(n)], blank: true })) }], nums.map((n) => commas(roundWholeTo(n, unit))).join(', '));
  },
  // three comparisons with circles
  compareDec(r, p = {}) {
    const mk = {
      lead: () => { const a = int(r, 1, 9); const b = a === 1 ? 2 : int(r, 1, 9); return [`0.${a}0`, `0.0${b}`]; },
      swap: () => { const a = int(r, 1, 9); let b = int(r, 1, 9); if (a === b) b = (b % 9) + 1; return [`0.${a}${b}`, `0.${b}${a}`]; },
      zero: () => { const a = int(r, 1, 9); const b = int(r, 1, 9); return r() < 0.5 ? [`0.${a}${b}`, `0.${a}${b}0`] : [`${a}.${b}`, `${a}.${b}0`]; },
      zero2: () => { const a = int(r, 1, 9); return [`0.${a}`, `0.${a}0`]; },
      close: () => { const a = int(r, 10, 98); const x = int(r, 1, 9); let y = int(r, 1, 9); if (x === y) y = (y % 9) + 1; return [`${a}.${x}${y}${int(r, 1, 9)}`, `${a}.${y}${x}${int(r, 1, 9)}`]; },
      shift: () => { const a = int(r, 100, 999); const k = int(r, 1, 9); return [`${a}.${k}`, `${String(a).slice(0, 2)}.${String(a).slice(2)}${k}`]; },
      whole: () => { const a = int(r, 10, 99); const x = int(r, 1, 9); return [`${a}.${x}${int(r, 1, 9)}`, `${a}${x}.${int(r, 1, 9)}`]; },
    };
    const kinds = p.kinds || ['lead', 'zero', 'swap'];
    const pairs = kinds.map((k) => mk[k]()).map(([a, b]) => (r() < 0.5 ? [a, b] : [b, a]));
    const sym = ([a, b]) => { const x = Number(a); const y = Number(b); return x === y ? '=' : x < y ? '<' : '>'; };
    return cell([text('Compare the two decimals using <, =, >.'), { t: 'circles', pairs }], pairs.map((pr) => `${pr[0]} ${sym(pr)} ${pr[1]}`).join('; '));
  },
  // 600 / 10^2 =
  powDiv(r, p = {}) {
    const e = opt(r, p.exp || [2, 3]);
    const n = pick(r, [int(r, 2, 9) * 100, int(r, 2, 9) * 10 * int(r, 1, 9) + 0, int(r, 11, 99), int(r, 100, 999) * 10, int(r, 1000, 9999) * 10]);
    return cell([{ t: 'center', seg: [commas(n), ' ÷ 10', sup(e), ' ='] }, line()], shiftPoint(String(n), -e));
  },
  powMul(r, p = {}) {
    const e = opt(r, p.exp || [2, 3]);
    const n = pick(r, [int(r, 2, 9) * 10, int(r, 2, 9) * 100, int(r, 11, 99), int(r, 100, 999)]);
    return cell([{ t: 'center', seg: [commas(n), ' × 10', sup(e), ' ='] }, line()], shiftPoint(String(n), e));
  },
  mulPow10List(r, p = {}) {
    const n = p.n || 3;
    const rows = []; const ans = [];
    for (let i = 0; i < n; i++) {
      const base = pick(r, [int(r, 2, 9) * 10, int(r, 2, 9) * 100, int(r, 2, 9)]);
      const e = int(r, 3, p.maxExp || 3);
      rows.push({ seg: [commas(base), ' × 10', sup(e), ' ='], blank: true });
      ans.push(shiftPoint(String(base), e));
    }
    return cell([{ t: 'list', rows }], ans.join('; '));
  },
  divMultiples(r, p = {}) {
    const rows = []; const ans = [];
    for (let i = 0; i < (p.n || 4); i++) {
      const x = int(r, 2, 9); const b = int(r, 3, 4); const q = pick(r, [10, 100]);
      const divisor = x * 10 ** b; const dividend = divisor * q;
      rows.push({ seg: [commas(dividend), ' ÷ ', commas(divisor), ' ='], blank: true });
      ans.push(String(q));
    }
    return cell([{ t: 'list', rows }], ans.join('; '));
  },
  // vertical multiplication
  vmul(r, p = {}) {
    const a = p.a ? int(r, 10 ** (p.a[0] - 1), 10 ** p.a[1] - 1) : int(r, 10, 99);
    const bn = p.b === 10 ? 10 : p.b ? int(r, 10 ** (p.b[0] - 1), 10 ** p.b[1] - 1) : int(r, 11, 99);
    return cell([{ t: 'vmul', a, b: bn }], commas(a * bn));
  },
  // long division, always divides evenly unless p.rem
  ldiv(r, p = {}) {
    const [dLo, dHi] = p.divisor || [3, 9];
    const d = int(r, dLo, dHi);
    const [qLo, qHi] = p.quotient || [100, 999];
    const q = int(r, qLo, qHi);
    const rem = p.rem ? int(r, 1, d - 1) : 0;
    const n = d * q + rem;
    return cell([{ t: 'ldiv', d, n: commas(n) }], rem ? `${commas(q)} R ${rem}` : commas(q));
  },
  // decimals
  decSub(r, p = {}) {
    const a = randomDecimal(r, { wholeDigits: 1, places: 3 }); const b = randomDecimal(r, { wholeDigits: 1, places: 3 });
    let x = scaled(a.whole, 3) + Number(a.digits); let y = scaled(b.whole, 3) + Number(b.digits);
    if (x < y) [x, y] = [y, x];
    const sx = fromScaled(x, 3); const sy = fromScaled(y, 3);
    return cell([center(sx, ' − ', sy, ' =')], trimDec(fromScaled(x - y, 3)));
  },
  decAdd(r) {
    const a = randomDecimal(r, { wholeDigits: 1, places: 3 }); const b = randomDecimal(r, { wholeDigits: 1, places: 3 });
    const x = scaled(a.whole, 3) + Number(a.digits); const y = scaled(b.whole, 3) + Number(b.digits);
    return cell([center(fromScaled(x, 3), ' + ', fromScaled(y, 3), ' =')], trimDec(fromScaled(x + y, 3)));
  },
  decMul(r, p = {}) {
    const kind = p.kind || pick(r, ['wholeTenth', 'wholeHundredth', 'decDec']);
    let a; let b; let ans;
    if (kind === 'wholeTenth') { const w = int(r, 100, 999); const t = int(r, 2, 9); a = String(w); b = `0.${t}`; ans = trimDec(fromScaled(w * t, 1)); } else if (kind === 'wholeHundredth') { const w = int(r, 100, 999); const h = int(r, 11, 49); a = String(w); b = `0.${String(h).padStart(2, '0')}`; ans = trimDec(fromScaled(w * h, 2)); } else { const x = int(r, 101, 999); const y = int(r, 11, 99); a = fromScaled(x, 2); b = fromScaled(y, 2); ans = trimDec(fromScaled(x * y, 4)); }
    return cell([center(a, ' × ', b, ' ='), line()], ans);
  },
  decDiv(r) {
    const dv = int(r, 1, 9); const q = int(r, 2, 30);
    const dividend = trimDec(fromScaled(dv * q, 2)); const divisor = fromScaled(dv, 1);
    const dividendShown = /^0\.\d$/.test(dividend) || dividend.includes('.') ? dividend : `${dividend}`;
    return cell([center(dividendShown, ' ÷ ', divisor, ' ='), line()], trimDec(fromScaled(q, 1)));
  },
};

module.exports = { skills, shiftPoint, commas, opt };
