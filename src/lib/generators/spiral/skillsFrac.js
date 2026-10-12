'use strict';

// Fraction skills: operations, "more or less than", "between which two whole numbers", area models, marking off,
// and the word problems that go with them.
const C = require('./core');
const S = require('./svg');
const { f, mx, b, segs, text, center, note, line, space, svgBlock, cell, F, seg, mixedSeg, fmt, int, pick, shuffle, plain } = C;

const commas = (n) => Number(n).toLocaleString('en-US');
const opt = (r, v) => (Array.isArray(v) ? pick(r, v) : v);
const SYM = { add: '+', sub: '−', mul: '×', div: '÷' };
const ans = (v) => F.show(v); // simplest form, mixed number when improper
const raw = (w, n, d) => (w ? mx(w, n, d) : f(n, d)); // operands exactly as written (not reduced)

// denominators for a pair of fractions
function pickDens(r, p) {
  const likeList = p.likeDens || [4, 5, 6, 8, 10, 12, 15, 20];
  if (p.den === 'like') { const d = pick(r, likeList.filter((x) => x <= (p.maxDen || 20))); return [d, d]; }
  const related = [[4, 12], [2, 6], [3, 9], [2, 8], [3, 6], [5, 10], [4, 8], [6, 12], [2, 4], [3, 12], [5, 15], [4, 20]];
  const unrelated = [[5, 7], [4, 6], [3, 4], [5, 6], [2, 3], [3, 5], [7, 10], [8, 12], [3, 7], [4, 5], [2, 5], [6, 9], [5, 8]];
  const pair = p.related ? pick(r, related) : pick(r, [...unrelated, ...(p.related === false ? [] : related)]);
  return r() < 0.5 ? pair : [pair[1], pair[0]];
}

const skills = {
  // add / subtract fractions or mixed numbers; bonus 'reduce' or 'convert'
  fracOp(r, p = {}) {
    const op = opt(r, p.op || 'add');
    for (let tries = 0; tries < 400; tries++) {
      const [d1, d2] = pickDens(r, p);
      let n1 = int(r, 1, d1 - 1); let n2 = int(r, 1, d2 - 1);
      const w1 = p.mixed ? int(r, 2, p.maxWhole || 30) : 0;
      let w2 = p.mixed ? int(r, 1, 9) : 0;
      if (op === 'sub') {
        if (p.mixed && p.noBorrow !== false && F.sub(F.frac(n1, d1), F.frac(n2, d2)).n < 0) continue;
        if (!p.mixed && F.sub(F.frac(n1, d1), F.frac(n2, d2)).n <= 0) { [n1, n2] = [n2, n1]; if (d1 !== d2) continue; }
      }
      if (p.mixed && op === 'sub' && w1 <= w2) w2 = Math.max(1, w1 - 1);
      const a = F.frac(w1 * d1 + n1, d1); const bb = F.frac(w2 * d2 + n2, d2);
      const res = op === 'add' ? F.add(a, bb) : F.sub(a, bb);
      if (res.n <= 0) continue;
      const L = F.lcm(d1, d2);
      const totalNum = (w1 * d1 + n1) * (L / d1) + (op === 'add' ? 1 : -1) * (w2 * d2 + n2) * (L / d2);
      const reducible = F.gcd(Math.abs(totalNum), L) > 1;
      if (p.bonus === 'reduce' && (!reducible || res.d === 1)) continue;
      if (p.bonus === 'convert' && !(op === 'add' && res.n > res.d && !p.mixed)) continue;
      const label = op === 'add' ? 'Add the fractions.' : 'Subtract the fractions.';
      const blocks = [];
      if (p.label !== false) blocks.push(text(label));
      blocks.push(center(raw(w1, n1, d1), ` ${SYM[op]} `, raw(w2, n2, d2), ' ='));
      if (p.bonus === 'reduce') blocks.push(note('*Bonus: Reduce the fraction.'));
      if (p.bonus === 'convert') blocks.push(note('*Bonus: Convert the improper fraction to a mixed number.'));
      if (p.remember) blocks.push(note('*Remember: Find a common denominator.'));
      return cell(blocks, ans(res));
    }
    throw new Error('fracOp: no problem found');
  },
  fracMul(r, p = {}) {
    for (let t = 0; t < 400; t++) {
      const d1 = int(r, 2, p.maxDen || 9); const d2 = int(r, 2, p.maxDen || 9);
      const n1 = int(r, 1, d1 - 1); const n2 = int(r, 1, d2 - 1);
      const res = F.mul(F.frac(n1, d1), F.frac(n2, d2));
      if (p.bonus === 'reduce' && F.gcd(n1 * n2, d1 * d2) === 1) continue;
      if (p.bonus !== 'reduce' && p.noReduce && F.gcd(n1 * n2, d1 * d2) > 1) continue;
      const blocks = [center(f(n1, d1), ' × ', f(n2, d2), ' =')];
      if (p.bonus === 'reduce') blocks.push(note('*Bonus: Reduce the fraction.'));
      return cell(blocks, ans(res));
    }
    throw new Error('fracMul');
  },
  // 13 + ( 5/9 - 4/9 ) =
  fracExprParen(r) {
    const d = int(r, 5, 9); const n1 = int(r, 3, d - 1); const n2 = int(r, 1, n1 - 1);
    const w = int(r, 10, 20);
    const res = F.add(F.frac(w, 1), F.sub(F.frac(n1, d), F.frac(n2, d)));
    return cell([center(String(w), ' + ( ', f(n1, d), ' − ', f(n2, d), ' ) =')], ans(res));
  },
  // Will the product be more or less than ...?
  moreOrLess(r, p = {}) {
    const kind = p.kind || pick(r, ['wholeFrac', 'fracFrac', 'mixedFrac', 'timesOne']);
    const frac = (maxD) => { for (;;) { const d = int(r, 3, maxD); const n = int(r, 1, d - 1); if (F.gcd(n, d) === 1) return F.frac(n, d); } };
    let target; let expr; let verdict; let product;
    if (kind === 'timesOne') {
      const d = int(r, 3, 9); const n = int(r, 1, d - 1);
      return cell([text('Will the product be more or less than 1?'), center(f(n, d), ' × 1 = ?'), line()], `less than 1 (the product is ${n}/${d})`);
    }
    if (kind === 'wholeFrac') { const W = int(r, 3, 9); const fr = frac(8); target = fr; expr = [String(W), ' × ', f(fr.n, fr.d), ' ='];
      verdict = 'more'; product = F.mul(F.frac(W, 1), fr); }
    else if (kind === 'fracFrac') { const a = frac(8); const bb = frac(8); target = a; expr = [f(a.n, a.d), ' × ', f(bb.n, bb.d), ' ='];
      verdict = 'less'; product = F.mul(a, bb); }
    else if (kind === 'mixedFrac') { const W = int(r, 2, 9); const x = frac(9); const fr = frac(9); target = fr; expr = [mx(W, x.n, x.d), ' × ', f(fr.n, fr.d), ' ='];
      verdict = 'more'; product = F.mul(F.frac(W * x.d + x.n, x.d), fr); }
    else { // mixed number times a fraction, compared with the mixed number
      const W = int(r, 2, 9); const x = frac(9); const fr = frac(9); target = F.frac(W * x.d + x.n, x.d); expr = [f(fr.n, fr.d), ' × ', mx(W, x.n, x.d), ' ='];
      verdict = 'less'; product = F.mul(F.frac(W * x.d + x.n, x.d), fr);
      return cell([text('Will the product be more or less than ', mx(W, x.n, x.d), ' ?'), center(...expr), line()], `less than (multiplying by a fraction less than 1); product ${ans(product)}`);
    }
    return cell([text('Will the product be more or less than ', f(target.n, target.d), ' ?'), center(...expr), line()], `${verdict} than ${plain([f(target.n, target.d)])}; product ${ans(product)}`);
  },
  // 5 x 4 3/8 : between which two whole numbers?
  betweenWhole(r, p = {}) {
    for (let t = 0; t < 200; t++) {
      const W = int(r, 3, 9); const w = int(r, 2, 9); const d = int(r, 2, 9); const n = int(r, 1, d - 1);
      if (F.gcd(n, d) !== 1) continue;
      const prod = F.mul(F.frac(W, 1), F.frac(w * d + n, d));
      if (prod.d === 1) continue;
      const lo = Math.floor(prod.n / prod.d);
      return cell([text('Between which two whole numbers will the product be found?'),
        center(String(W), ' × ', mx(w, n, d), ' ='),
        { t: 'line', pre: '', post: 'and', second: true }], `between ${lo} and ${lo + 1} (product ${ans(prod)})`);
    }
    throw new Error('betweenWhole');
  },
  // area model
  shadeArea(r, p = {}) {
    const d1 = int(r, 3, 6); const d2 = int(r, 3, 5);
    const n1 = int(r, 1, d1 - 1); const n2 = int(r, 1, d2 - 1);
    const prod = F.mul(F.frac(n1, d1), F.frac(n2, d2));
    const frac = [f(n1, d1), ' × ', f(n2, d2), ' .'];
    const key = `shade ${n1} row${n1 > 1 ? 's' : ''} and ${n2} column${n2 > 1 ? 's' : ''}: ${n1 * n2}/${d1 * d2} = ${ans(prod)}`;
    if (p.create) return cell([text('Create a grid. Then, shade an area on the grid that shows'), center(...frac)], key);
    return cell([text('Shade the area on the grid that shows ', ...frac), svgBlock(S.areaGrid({ cols: d2, rows: d1, cell: 16 }), 'Grid')], key);
  },
  // 2 / 1/6 : mark off
  fracDivMark(r, p = {}) {
    const whole = opt(r, p.wholes || [2, 3, 4]);
    const d = whole >= 4 ? int(r, 3, 6) : int(r, 4, 8);
    return cell([text('Solve by marking off the fractions.'), center(String(whole), ' ÷ ', f(1, d), ' = ', { sp: 'blank' }), { t: 'wholes', n: whole }], String(whole * d));
  },
  drawVisual(r, p = {}) {
    const whole = int(r, 4, 6); const d = pick(r, [3, 4, 5, 6]);
    return cell([text('Draw a visual to solve'), center(String(whole), ' ÷ ', f(1, d), ' =')], String(whole * d));
  },
  divUnitFracVisual(r) {
    const d = pick(r, [4, 5, 6, 8]); const k = pick(r, [3, 4, 5]);
    return cell([text('Use the box to show a visual example of how to divide a fraction and a whole number.'), center(f(1, d), ' ÷ ', String(k), ' ='), { t: 'box' }], ans(F.frac(1, d * k)));
  },
  missingPair(r) {
    const d = int(r, 3, 9); const k = int(r, 3, 9);
    const q = F.frac(1, d * k);
    return cell([text('Determine the number that correctly completes both equations.'),
      { t: 'list', rows: [{ seg: [f(1, d), ' ÷ ', String(k), ' ='], blank: true }, { seg: [{ sp: 'blank' }, ' × ', String(k), ' = ', f(1, d)], blank: false }] }], ans(q));
  },
  fracTimesWholeCompare(r, p = {}) {
    const greater = p.dir ? p.dir === 'greater' : r() < 0.5;
    const d = int(r, 3, 9); const n = int(r, 1, d - 1);
    const W = p.whole || (r() < 0.5 ? 9 : pick(r, [12, 15, 18, 24, 36, 80]));
    const prod = F.mul(F.frac(n, d), F.frac(W, 1));
    const hint = greater ? `Use a larger fraction, e.g. a fraction greater than ${n}/${d}.` : `Use a smaller fraction, e.g. a fraction less than ${n}/${d}.`;
    return cell([center(f(n, d), ' × ', String(W), ' = ', { sp: 'blank' }), text(`How could you change the fraction to get an answer ${greater ? 'greater' : 'less'} than the product?`)], `${ans(prod)}. ${hint}`);
  },
  explainEq(r) {
    for (let t = 0; t < 500; t++) {
      const b1 = int(r, 4, 9); const d = int(r, 2, b1 - 1);
      const a = int(r, 2, b1 - 1); const c = int(r, 1, d - 1);
      if (!(a > c) || F.sub(F.frac(a, b1), F.frac(c, d)).n <= 0) continue;
      if (b1 - d <= 0 || a - c >= b1 - d) continue;
      if (F.lcm(b1, d) === b1 && b1 % d === 0 && false) continue;
      const wrong = F.frac(a - c, b1 - d);
      const right = F.sub(F.frac(a, b1), F.frac(c, d));
      if (wrong.n === right.n && wrong.d === right.d) continue;
      return cell([text('Does'), center(f(a, b1), ' − ', f(c, d), ' = ', f(a - c, b1 - d)), text('Explain.')], `No. Subtracting the numerators and the denominators is not right; ${a}/${b1} − ${c}/${d} = ${ans(right)}.`);
    }
    throw new Error('explainEq');
  },
  explainOp(r, p = {}) {
    const op = p.op || 'sub';
    for (let t = 0; t < 200; t++) {
      const [d1, d2] = pickDens(r, { den: 'unlike' });
      const n1 = int(r, 1, d1 - 1); const n2 = int(r, 1, d2 - 1);
      const a = F.frac(n1, d1); const c = F.frac(n2, d2);
      if (op === 'sub' && F.sub(a, c).n <= 0) continue;
      const res = op === 'add' ? F.add(a, c) : F.sub(a, c);
      const L = F.lcm(d1, d2);
      return cell([text(p.draw ? 'Draw a visual to solve' : 'Explain how to solve'), center(f(n1, d1), ` ${SYM[op]} `, f(n2, d2), ' =')],
        `Rewrite with the common denominator ${L}: ${n1 * (L / d1)}/${L} ${SYM[op]} ${n2 * (L / d2)}/${L} = ${ans(res)}`);
    }
    throw new Error('explainOp');
  },
};

module.exports = { skills };
