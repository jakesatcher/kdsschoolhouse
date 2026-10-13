'use strict';

// Grade 4 skills, part 2: the skills the real 4th grade Test pages use that the first grade 4 set did not have:
// place-value patterns (10 times, 100 times, dividing multiples of ten), unit fractions and tenths-and-hundredths,
// protractor and lines-and-angles diagrams, shape sets, shape patterns, line plots with questions, and word problems.
const C = require('./core');
const S = require('./svg');
const S3 = require('./svg3');
const S4 = require('./svg4');
const { ctx } = require('../wordProblems');
const { f, mx, text, center, note, line, space, svgBlock, cell, F, int, pick, shuffle } = C;

const commas = (n) => Number(n).toLocaleString('en-US');
const opt = (r, v) => (Array.isArray(v) ? pick(r, v) : v);
const ans = (v) => F.show(v);
const money = (c) => `$${(c / 100).toFixed(2)}`;
const BLANK = { sp: 'blank' };

const GLYPH_NAME = { star: 'star', heart: 'heart', circle: 'circle', triangle: 'triangle', plus: 'plus sign', burst: 'starburst', diamond: 'diamond', square: 'square' };
const TRI_NAME = { equilateral: 'acute', isosceles: 'acute', scalene: 'acute', rightIsosceles: 'right', rightScalene: 'right', obtuse: 'obtuse' };
const SYM_LETTERS = { H: 2, X: 2, A: 1, T: 1, M: 1, W: 1, B: 1, E: 1, C: 1, D: 1, Z: 0, F: 0, R: 0, P: 0, L: 0 };
const PLOTS = [
  { title: 'Glasses of Water Drunk', what: 'students', q: (t) => `How many students drank less than ${t} glasses of water?` },
  { title: 'Pets in Each Family', what: 'families', q: (t) => `How many families have fewer than ${t} pets?` },
  { title: 'Books Read This Month', what: 'students', q: (t) => `How many students read fewer than ${t} books?` },
  { title: 'Miles Run in a Week', what: 'runners', q: (t) => `How many runners ran fewer than ${t} miles?` },
  { title: 'Hours Spent Reading', what: 'students', q: (t) => `How many students spent less than ${t} hours reading?` },
  { title: 'Snacks Bought at Lunch', what: 'students', q: (t) => `How many students bought fewer than ${t} snacks?` },
];

const skills = {
  // ---------- place value patterns ----------
  g4TimesGreater(r, p = {}) {
    const ks = p.k || [10, 100];
    const rows = ks.map((k, i) => {
      const n = int(r, 2, 9);
      const form = (p.forms || ['greater', 'larger'])[i % 2];
      return { form, n, k };
    });
    const out = rows.map((x) => ({ seg: x.form === 'greater' ? [`What number is ${commas(x.k)} times greater than ${x.n}?`] : [`${commas(x.n * x.k)} is `, BLANK, ` times as large as ${x.n}.`], blank: x.form === 'greater' }));
    return cell([{ t: 'list', rows: out }], rows.map((x) => (x.form === 'greater' ? commas(x.n * x.k) : commas(x.k))).join('; '), { rows });
  },
  g4PlaceDiv(r, p = {}) {
    const count = p.count || 3; const eqs = [];
    while (eqs.length < count) {
      const m = int(r, 2, 9); const i = int(r, 0, 4); const q0 = int(r, 1, 9); const j = int(r, 0, 2);
      const d = m * 10 ** i; const q = q0 * 10 ** j; const n = d * q;
      if (n > 900000 || d < 2 || eqs.some((e) => e.d === d)) continue;
      eqs.push({ n, d, q });
    }
    return cell([text('Complete the equations.'), { t: 'list', rows: eqs.map((e) => ({ seg: [`${commas(e.n)} ÷ ${commas(e.d)} = `], blank: true })) }], eqs.map((e) => commas(e.q)).join(', '), { eqs });
  },
  // ---------- fractions ----------
  g4UnitMul(r) {
    const d = int(r, 4, 12); const a = int(r, 2, d - 2); let b = int(r, 2, d - 1); if (b === a) b = a === d - 1 ? 2 : a + 1;
    return cell([text('Write each fraction as a multiple of a unit fraction.'), { t: 'list', rows: [{ seg: [f(a, d), ' = ', `${a} × `, f(1, d)] }, { seg: [f(b, d), ' = ', BLANK, ' × ', BLANK] }] }], `${b} × 1/${d}`, { a, b, d });
  },
  g4EquivMul(r, p = {}) {
    const d1 = pick(r, [2, 3, 4, 5, 6]); const n1 = int(r, 1, d1 - 1); const k1 = int(r, 2, 5); let k2 = int(r, 2, 5); if (k2 === k1) k2 = k1 === 5 ? 2 : k1 + 1;
    const d2 = pick(r, [3, 4, 5, 7]); const n2 = int(r, 1, d2 - 1);
    const first = { n: n1, d: d1, k: k1 }; const second = p.same ? { n: n1, d: d1, k: k2 } : { n: n2, d: d2, k: k2 };
    const row = (x, blank) => ({ seg: [f(x.n, x.d), ' × ', f(x.k, x.k), ' = ', ...(blank ? [BLANK, ' / ', BLANK] : [f(x.n * x.k, x.d * x.k)])] });
    return cell([text('Use multiplication to write an equivalent fraction.'), { t: 'list', rows: [row(first, false), row(second, true)] }], `${second.n * second.k}/${second.d * second.k}`, { first, second });
  },
  g4TenthsHund(r) {
    const a = int(r, 1, 8); const b = int(r, 1, 9); const c = int(r, 1, 8); const d = int(r, 1, 9);
    return cell([text('Add the tenths and hundredths.'), { t: 'list', rows: [{ seg: [f(a, 10), ' + ', f(b, 100), ' = ', f(a * 10 + b, 100)] }, { seg: [f(c, 10), ' + ', f(d, 100), ' = ', BLANK, ' / ', BLANK] }] }], `${c * 10 + d}/100`, { a, b, c, d });
  },
  g4TenthsHund2(r) {
    const a = int(r, 1, 4); const b = int(r, 2, 5) * 10; const c = int(r, 1, 4); const d = int(r, 2, 5) * 10;
    return cell([text('Add the tenths and hundredths.'), { t: 'list', rows: [{ seg: [f(a, 10), ' + ', f(b, 100), ' = ', f(a * 10 + b, 100)] }, { seg: [f(c, 10), ' + ', f(d, 100), ' = ', BLANK, ' / ', BLANK] }] }, note('Hint: write the tenths as hundredths first.')], `${c * 10 + d}/100`, { a, b, c, d });
  },
  g4DecList(r, p = {}) {
    const count = Math.min(p.count || 2, 2); const nums = shuffle(r, Array.from({ length: 98 }, (_, i) => i + 2).filter((x) => x % 10 !== 0)).slice(0, count + 1);
    const dec = (n) => `0.${String(n).padStart(2, '0')}`;
    const rows = [{ seg: [f(nums[0], 100), ' = ', dec(nums[0])] }, ...nums.slice(1).map((n) => ({ seg: [f(n, 100), ' = '], blank: true }))];
    return cell([text('Write each fraction as a decimal.'), { t: 'list', rows }], nums.slice(1).map(dec).join(', '), { nums: nums.slice(1) });
  },
  g4CompareDec(r, p = {}) {
    const mk = [
      () => { const a = int(r, 1, 9); return [`0.${a}0`, `0.${a}`]; },
      () => { const a = int(r, 1, 8); const b = int(r, 1, 9); return [`0.${a}${b}`, `0.${a + 1}`]; },
      () => { const a = int(r, 1, 9); return [`${a}.${int(r, 1, 9)}`, `${a}.${int(r, 1, 9)}0`]; },
      () => { const a = int(r, 1, 9); let b = int(r, 1, 9); if (a === b) b = (b % 9) + 1; return [`0.${a}${b}`, `0.${b}${a}`]; },
    ];
    const pairs = Array.from({ length: p.count || 3 }, () => pick(r, mk)()).map(([a, b]) => (r() < 0.5 ? [a, b] : [b, a]));
    const sym = ([a, b]) => (Number(a) === Number(b) ? '=' : Number(a) < Number(b) ? '<' : '>');
    return cell([text('Compare the decimals using <, > or =.'), { t: 'circles', pairs }], pairs.map((pr) => `${pr[0]} ${sym(pr)} ${pr[1]}`).join('; '), { pairs });
  },
  g4ShadeMult(r, p = {}) {
    const d = pick(r, p.d || [4, 5, 6, 8]); const k = int(r, 2, d - 1);
    const kind = pick(r, d === 6 || d === 8 ? ['pie', 'grid'] : ['pie', 'bar']);
    return cell([text(['Shade in ', `${k} × `, f(1, d), ` on the shape.`]), svgBlock(S3.fractionModel({ kind, n: 0, d }), `Shape divided into ${d} equal parts`), line()], `${k}/${d} (${k} of the ${d} parts shaded)`, { k, d });
  },
  g4CreateFrac(r) {
    const d = pick(r, [5, 6, 7, 8, 10]); const n = int(r, 2, d - 2);
    return cell([text(['Shade the bar to show ', f(n, d), '.']), svgBlock(S3.fractionModel({ kind: 'bar', n: 0, d }), `Bar cut into ${d} equal parts`)], `${n} of the ${d} parts shaded`, { n, d });
  },
  g4FracBars(r, p = {}) {
    const d = pick(r, [5, 6, 8, 10]); const a = int(r, 1, 3); const b = int(r, 1, 3);
    const op = opt(r, p.op || 'add');
    if (op === 'sub') { const n1 = a + b; return cell([text(['Use the bar to model ', f(n1, d), ' − ', f(a, d), '. Write the difference.']), svgBlock(S3.fractionModel({ kind: 'bar', n: 0, d }), 'Bar'), line()], ans(F.frac(b, d)), { op, n1, a, d }); }
    return cell([text(['Use the bar to model ', f(a, d), ' + ', f(b, d), '. Write the sum.']), svgBlock(S3.fractionModel({ kind: 'bar', n: 0, d }), 'Bar'), line()], ans(F.frac(a + b, d)), { op, a, b, d });
  },
  g4EquivNL(r) {
    const spec = pick(r, [{ den: 8, a: [1, 2], b: [4, 8] }, { den: 8, a: [1, 2], b: [5, 8] }, { den: 8, a: [3, 4], b: [6, 8] }, { den: 6, a: [1, 3], b: [2, 6] }, { den: 6, a: [2, 3], b: [3, 6] }, { den: 10, a: [1, 5], b: [3, 10] }, { den: 10, a: [2, 5], b: [4, 10] }]);
    const eq = spec.a[0] * spec.b[1] === spec.a[1] * spec.b[0];
    return cell([text(['Are ', f(spec.a[0], spec.a[1]), ' and ', f(spec.b[0], spec.b[1]), ' equivalent? Use the number line to explain.']), svgBlock(S.fractionLine({ den: spec.den, above: [spec.a] }), 'Number line', true), space('s')], eq ? 'Yes. They are at the same point on the number line.' : 'No. They are at different points on the number line.', { a: spec.a, b: spec.b, eq });
  },
  // ---------- angles, lines and shapes ----------
  g4MeasureAngle(r) {
    const deg = int(r, 3, 33) * 5;
    return cell([text('Use the protractor to measure the angle.'), svgBlock(S4.protractor({ deg }), 'Protractor'), line('°')], `${deg}°`, { deg });
  },
  g4LineRel(r, p = {}) {
    const kind = opt(r, p.kind || ['parallel', 'perpendicular', 'crossing']);
    const labels = shuffle(r, 'ABCDEFGH'.split('')).slice(0, 4);
    const [a, b, c, d] = labels;
    const q = pick(r, [`How are lines ${a}${b} and ${c}${d} related?`, `How are line ${a}${b} and line ${c}${d} related?`]);
    const word = { parallel: 'parallel', perpendicular: 'perpendicular', crossing: 'intersecting (not perpendicular)' }[kind];
    return cell([text(`${q} Write parallel, perpendicular or intersecting.`), svgBlock(S4.twoLines(kind, labels), 'Two lines'), line()], word, { kind });
  },
  g4AngleNamed(r, p = {}) {
    const kind = opt(r, p.kind || 'type');
    const letters = shuffle(r, 'ABCDEFGH'.split('')); const [A, B, Cc, D] = letters;
    if (kind === 'type') {
      const m = pick(r, [35, 50, 60, 90, 110, 125, 140, 70]); const th1 = int(r, 0, 20) * 3;
      const lines = [{ deg: th1, a: A, b: B }, { deg: th1 + m, a: Cc, b: D }];
      const name = `∠${A}O${Cc}`; const type = m < 90 ? 'acute' : m === 90 ? 'right' : 'obtuse';
      return cell([text(`What type of angle is ${name}? Write acute, right or obtuse.`), svgBlock(S4.throughPoint(lines), 'Lines through a point'), line()], type, { m, kind });
    }
    const m = pick(r, [30, 40, 50, 60, 70, 110, 120]); const th1 = int(r, 0, 20) * 3;
    const lines = [{ deg: th1, a: A, b: B }, { deg: th1 + m, a: Cc, b: D }];
    return cell([text(`Lines ${A}${B} and ${Cc}${D} cross at point O. ∠${A}O${Cc} measures ${m}°. What is the measure of ∠${Cc}O${B}?`), svgBlock(S4.throughPoint(lines), 'Lines through a point'), line('°')], `${180 - m}°`, { m, kind });
  },
  g4ShapeSet(r, p = {}) {
    const kind = opt(r, p.kind || 'right');
    if (kind === 'quad' || kind === 'verts4') {
      const list = shuffle(r, [4, 4, 3, 5, 6, 8].slice(0, 5)).slice(0, 4);
      if (!list.some((x) => (kind === 'quad' ? x === 4 : x >= 4))) list[0] = 4;
      const hit = list.map((x, i) => ((kind === 'quad' ? x === 4 : x >= 4) ? S3.LETTERS[i] : null)).filter(Boolean);
      return cell([text(kind === 'quad' ? 'Circle all of the quadrilaterals.' : 'Circle the shapes that have at least 4 vertices.'), svgBlock(S3.polygonSet(list), 'Shapes', true)], hit.join(' and '), { kind, list });
    }
    const ALL = ['equilateral', 'isosceles', 'scalene', 'rightIsosceles', 'rightScalene', 'obtuse'];
    const match = (k) => (kind === 'right' ? TRI_NAME[k] === 'right' : kind === 'obtuse' ? TRI_NAME[k] === 'obtuse' : kind === 'acute' ? TRI_NAME[k] === 'acute' : (k === 'equilateral' || k === 'isosceles' || k === 'rightIsosceles'));
    const hits = shuffle(r, ALL.filter(match)); const misses = shuffle(r, ALL.filter((k) => !match(k)));
    const kinds = shuffle(r, [...hits.slice(0, 2), ...misses.slice(0, 2)]);
    const idx = kinds.map((k, i) => (match(k) ? i + 1 : null)).filter(Boolean);
    const label = { right: 'right triangles', obtuse: 'obtuse triangles', acute: 'acute triangles', congruent: 'triangles that have at least two congruent sides' }[kind];
    return cell([text(`Circle the ${label}.`), svgBlock(S.triangles(kinds), 'Triangles', true)], idx.join(', '), { kind, kinds });
  },
  g4PolyTable(r) {
    const names = { 3: 'triangle', 4: 'quadrilateral', 5: 'pentagon', 6: 'hexagon', 8: 'octagon' };
    const ns = shuffle(r, [3, 4, 5, 6, 8]).slice(0, 4).sort((a, b) => a - b);
    return cell([text('Complete the table.'), { t: 'table', head: ['Polygon', 'Sides', 'Vertices'], rows: ns.map((n) => [names[n], n, null]) }], ns.map((n) => `${names[n]}: ${n} vertices`).join('; '), { ns });
  },
  g4SymLetter(r) {
    const ch = pick(r, Object.keys(SYM_LETTERS));
    return cell([text(`How many lines of symmetry does the letter ${ch} have?`), svgBlock(S4.bigLetter(ch), `The letter ${ch}`), line()], String(SYM_LETTERS[ch]), { ch, n: SYM_LETTERS[ch] });
  },
  g4AreaPerim(r) {
    const unit = pick(r, ['mm', 'cm', 'in.', 'ft', 'm']); const w = int(r, 2, 8); const l = int(r, w + 1, 14);
    return cell([text('Find the area and perimeter of the rectangle.'), svgBlock(S.rect({ l, w, unit }), 'Rectangle'), { t: 'line', pre: 'Area =', post: `square ${unit}` }, { t: 'line', pre: 'Perimeter =', post: unit }], `Area ${l * w} square ${unit}; Perimeter ${2 * (l + w)} ${unit}`, { l, w });
  },
  g4PerimVar(r) {
    const unit = pick(r, ['m', 'ft', 'cm']); const l = int(r, 10, 24); const w = int(r, 4, l - 2); const P = 2 * (l + w);
    return cell([text(`The perimeter of the rectangle is ${P} ${unit}. Find the width.`), svgBlock(S3.rectVar({ top: l, letter: 'w', unit }), 'Rectangle'), line(unit, 'w =')], `${w} ${unit}`, { P, l, w });
  },
  // ---------- patterns ----------
  g4RulePattern(r, p = {}) {
    const kind = opt(r, p.kind || 'twoStep');
    if (kind === 'shape') {
      const cycleLen = pick(r, [2, 3]); const cyc = shuffle(r, S3.GLYPHS).slice(0, cycleLen);
      const row = Array.from({ length: 7 }, (_, i) => cyc[i % cycleLen]);
      const nth = pick(r, [9, 11, 13, 16, 17, 19, 23, 26]);
      const ord = (n) => `${n}${n % 10 === 1 && n !== 11 ? 'st' : n % 10 === 2 && n !== 12 ? 'nd' : n % 10 === 3 && n !== 13 ? 'rd' : 'th'}`;
      return cell([text(`What will the ${ord(nth)} shape in the pattern be?`), svgBlock(S4.glyphRow(row), 'Shape pattern', true), line()], GLYPH_NAME[cyc[(nth - 1) % cycleLen]], { cyc, nth });
    }
    const start = int(r, 3, 20); const up = int(r, 3, 12); const down = int(r, 1, up - 1);
    const seq = [start]; for (let i = 0; i < 4; i++) seq.push(i % 2 === 0 ? seq[i] + up : seq[i] - down);
    return cell([text(`Start at ${start}. The rule is add ${up}, subtract ${down}, add ${up}, subtract ${down}. Write the first five numbers.`), line()], seq.join(', '), { seq, start, up, down });
  },
  // ---------- time ----------
  g4TimeSum(r) {
    const { A } = ctx(r);
    const n = pick(r, [2, 3]);
    const mins = Array.from({ length: n }, () => pick(r, [10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60, 90]));
    const total = mins.reduce((a, b) => a + b, 0);
    const what = pick(r, ['cleaning the garage', 'working on homework', 'practicing the guitar', 'training for a race']);
    const parts = n === 2 ? `${mins[0]} minutes and then ${mins[1]} minutes` : `${mins[0]} minutes, then ${mins[1]} minutes, and then ${mins[2]} minutes`;
    const h = Math.floor(total / 60); const m = total % 60;
    return cell([text(`${A} spent ${parts} ${what}. How much time did ${A.s} spend in all? Write your answer in hours and minutes.`), line()], `${total} minutes = ${h ? `${h} hour${h > 1 ? 's' : ''}` : ''}${h && m ? ' ' : ''}${m ? `${m} minutes` : ''}`, { mins, total });
  },
  // ---------- line plots ----------
  g4LinePlotQ(r, p = {}) {
    const ds = pick(r, PLOTS); const q = opt(r, p.q || ['less', 'diff', 'outlier']);
    const lo = 0; const hi = 8; const counts = {};
    const mid = int(r, 2, 4); [mid, mid + 1, mid + 2].forEach((t) => { counts[t] = int(r, 1, 4); });
    const gap = int(r, 2, 3); const out = mid + 2 + gap <= hi ? mid + 2 + gap : 0; counts[out] = 1;
    const keys = Object.keys(counts).map(Number).sort((a, b) => a - b);
    const svg = S.linePlot({ min: lo, max: hi, den: 1, counts, title: ds.title });
    let question; let answer; const meta = { counts, q };
    if (q === 'less') { const t = mid + 1; question = ds.q(t); answer = keys.filter((k) => k < t).reduce((a, k) => a + counts[k], 0); meta.t = t; } else if (q === 'diff') { question = 'What is the difference between the largest value and the smallest value in the data?'; answer = keys[keys.length - 1] - keys[0]; } else { question = 'Which value is an outlier in the data?'; answer = out; meta.out = out; }
    return cell([text(question), svgBlock(svg, ds.title, true), line()], String(answer), { ...meta, answerNum: answer });
  },
  // ---------- word problems ----------
  g4Word2(r, p = {}) {
    const { A, B } = ctx(r);
    const kind = opt(r, p.kind || ['boxesMinus', 'divMinus', 'mulAdd', 'saveFrac', 'half', 'timesMore', 'roundTrip', 'allowance']);
    if (kind === 'boxesMinus') { const boxes = int(r, 3, 6); const per = int(r, 12, 40); const gave = int(r, 1, boxes - 1); const total = boxes * per;
      return cell([text(`${A} had ${total} books. ${A.S} put them equally into ${boxes} boxes and then gave away ${gave} ${gave === 1 ? 'box' : 'boxes'} of books. How many books does ${A.s} have left?`), line()], String((boxes - gave) * per), { kind, total, boxes, gave, ans: (boxes - gave) * per }); }
    if (kind === 'divMinus') { const per = int(r, 4, 9); const bags = int(r, 18, 40); const gave = int(r, 5, bags - 5); const total = per * bags;
      return cell([text(`${A} has ${total} game pieces. ${A.S} puts them in bags of ${per}. If ${A.s} gives ${gave} bags to a friend, how many bags does ${A.s} have left?`), line()], String(bags - gave), { kind, total, per, gave, ans: bags - gave }); }
    if (kind === 'mulAdd') { const a = int(r, 25, 90); const k = int(r, 3, 6); const extra = int(r, 20, 80);
      return cell([text(`${A} filled ${k} boxes with ${a} beads in each box. Then ${A.s} found ${extra} more beads. How many beads does ${A.s} have in all?`), line()], String(a * k + extra), { kind, a, k, extra, ans: a * k + extra }); }
    if (kind === 'saveFrac') { const d = pick(r, [2, 4, 5, 10]); const total = d * int(r, 20, 120) ; const save = total / d;
      const fr = d === 2 ? 'half' : `1/${d}`;
      return cell([text(`${A} earned ${commas(total)} dollars mowing lawns and saved ${fr} of it. How many dollars did ${A.s} save?`), line()], String(save), { kind, total, d, ans: save }); }
    if (kind === 'half') { const w = int(r, 4, 9); const amt = pick(r, [10, 20, 30, 40]);
      return cell([text(`${A} gets $${amt} each week and saves half of it. How much money does ${A.s} save in ${w} weeks?`), line()], `$${(amt / 2) * w}`, { kind, w, amt, ans: (amt / 2) * w }); }
    if (kind === 'timesMore') { const k = pick(r, [2, 3, 4, 5, 8]); const n = int(r, 108, 899);
      const [one, two] = pick(r, [['butterflies', 'dragonflies'], ['canoes', 'kayaks'], ['cars', 'trucks'], ['stickers', 'cards']]);
      return cell([text(`${A} counted ${n} ${one} at the park. ${B} counted ${k === 2 ? 'twice' : `${k} times`} as many ${two}. How many ${two} did ${B} count?`), line()], commas(n * k), { kind, n, k, ans: n * k }); }
    if (kind === 'roundTrip') { const m = int(r, 2, 9) * 500; const trips = 2;
      return cell([text(`${A} walks ${commas(m)} meters to school and then walks the same way back home. How many kilometers does ${A.s} walk in all?`), line('km')], `${(m * trips) / 1000} km`, { kind, m, trips, ans: (m * trips) / 1000 }); }
    const cents = pick(r, [450, 550, 650, 750, 825, 950]); const k = int(r, 3, 8);
    return cell([text(`${A} gets an allowance of ${money(cents)} each week. How much allowance does ${A.s} get in ${k} weeks?`), line()], money(cents * k), { kind, cents, k, ans: cents * k });
  },
  g4FracWord(r, p = {}) {
    const { A, B } = ctx(r);
    const kind = opt(r, p.kind || ['addLike', 'subLeft', 'sub3']);
    const d = pick(r, [6, 8, 10, 12]);
    if (kind === 'addLike') { const a = int(r, 1, d - 2); const b = int(r, 1, d - 1 - a);
      return cell([text(['Today ', `${A} ate `, f(a, d), ` of a pizza and ${B} ate `, f(b, d), ` of the same pizza. How much of the pizza did they eat in all? Write your answer in simplest form.`]), line()], ans(F.frac(a + b, d)), { kind, a, b, d }); }
    if (kind === 'subLeft') { const a = int(r, 1, d - 3); const b = int(r, 1, d - 1 - a);
      return cell([text([`${A} ate `, f(a, d), ` of a cake in the morning and `, f(b, d), ` of the cake at night. How much of the cake is left?`]), line()], ans(F.frac(d - a - b, d)), { kind, a, b, d }); }
    const x = int(r, 1, 3); const y = int(r, 1, 3); const tot = x + y + int(r, 1, 3);
    return cell([text([`${A} had `, f(tot, d), ` of a gallon of paint. ${A.S} used `, f(x, d), ` of a gallon on a fence and `, f(y, d), ` of a gallon on a door. How much paint is left?`]), line()], ans(F.frac(tot - x - y, d)), { kind, x, y, tot, d });
  },
};

module.exports = { skills };
