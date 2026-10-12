'use strict';

// Grade 4 skills. Anchored to the two real 4th grade tests in the sample (6 and 7) and the SC grade 4 standards:
// whole-number place value to 1,000,000, multi-digit operations, equivalent fractions and like-denominator operations,
// decimals to hundredths, measurement conversions, perimeter / area, angles and lines.
const C = require('./core');
const S = require('./svg');
const { ctx } = require('../wordProblems');
const { f, mx, text, center, note, line, space, svgBlock, cell, F, words, int, pick, shuffle } = C;

const commas = (n) => Number(n).toLocaleString('en-US');
const opt = (r, v) => (Array.isArray(v) ? pick(r, v) : v);
const sym = (a, b) => (a === b ? '=' : a < b ? '<' : '>');
const digitsNum = (r, d) => int(r, 10 ** (d - 1), 10 ** d - 1);
const ans = (v) => F.show(v);

const skills = {
  // ----- number sense -----
  g4Compare(r, p = {}) {
    const [dLo, dHi] = p.digits || [3, 5];
    const makers = {
      shift: () => { const a = digitsNum(r, int(r, Math.max(dLo, 4), Math.max(dHi, 4))); return [a, Math.floor(a / 10)]; },
      close: () => { const a = digitsNum(r, int(r, Math.max(dLo, 4), Math.max(dHi, 4))); const d = int(r, 1, 9); return [a, a - (a % 10) + ((a % 10) + d) % 10]; },
      hundreds: () => { const a = digitsNum(r, 3); const b = a + 100 * (r() < 0.5 ? 1 : -1); return [a, b > 99 && b < 1000 ? b : a + 100]; },
      thousands: () => { const a = digitsNum(r, int(r, 4, 6)); const step = 10 ** (String(a).length - 2); return [a, a + step * (r() < 0.5 ? 1 : -1)]; },
    };
    const kinds = p.kinds || ['shift', 'close', 'hundreds'];
    const pairs = kinds.map((k) => makers[k]()).map(([a, b]) => (r() < 0.5 ? [a, b] : [b, a]));
    return cell([text('Write <, > or = to make the statements true.'), { t: 'circles', pairs: pairs.map(([a, b]) => [commas(a), commas(b)]) }], pairs.map(([a, b]) => `${commas(a)} ${sym(a, b)} ${commas(b)}`).join('; '));
  },
  g4Round(r, p = {}) {
    const unit = opt(r, p.unit || 10);
    const name = { 10: 'ten', 100: 'hundred', 1000: 'thousand', 10000: 'ten thousand', 100000: 'hundred thousand' }[unit];
    const minD = String(unit).length + 1; const maxD = Math.min(6, minD + 1);
    const round = (n) => Math.floor((n + unit / 2) / unit) * unit;
    if (p.list) {
      const nums = Array.from({ length: 3 }, () => digitsNum(r, int(r, minD, maxD)));
      return cell([text(`Round each number to the nearest ${name}.`), { t: 'list', rows: nums.map((n) => ({ seg: [commas(n)], blank: true })) }], nums.map((n) => commas(round(n))).join(', '));
    }
    const n = digitsNum(r, int(r, minD, maxD));
    return cell([text(`Round ${commas(n)} to the nearest ${name}.`), line()], commas(round(n)));
  },
  g4NumToWord(r, p = {}) {
    const n = digitsNum(r, opt(r, p.digits || [4, 5]));
    return cell([text(`Write ${commas(n)} in word form.`)], words(n));
  },
  g4WordToStd(r, p = {}) {
    const n = digitsNum(r, opt(r, p.digits || [4, 5]));
    return cell([text(`Write ${words(n)} in standard form.`), line()], commas(n));
  },
  g4Expanded(r, p = {}) {
    const n = digitsNum(r, opt(r, p.digits || [4, 5]));
    const ds = String(n).split('').map(Number);
    const terms = []; ds.forEach((d, i) => { if (d) terms.push(commas(d * 10 ** (ds.length - 1 - i))); });
    if (p.reverse) return cell([text(`Write ${terms.join(' + ')} in standard form.`), line()], commas(n));
    return cell([text(`Write ${commas(n)} in expanded form.`)], terms.join(' + '));
  },
  g4PlaceValue(r, p = {}) {
    const d = opt(r, p.digits || [5, 6]);
    for (;;) {
      const n = digitsNum(r, d); const s = String(n); const i = int(r, 0, d - 1);
      if (s.split('').filter((x) => x === s[i]).length !== 1 || s[i] === '0') continue;
      return cell([text(`What is the value of the ${s[i]} in ${commas(n)}?`), line()], commas(Number(s[i]) * 10 ** (d - 1 - i)));
    }
  },
  g4AddSub(r, p = {}) {
    const op = opt(r, p.op || ['add', 'sub']);
    const da = opt(r, p.a || 4); const db = opt(r, p.b || 3);
    let a = digitsNum(r, da); let b = digitsNum(r, db);
    if (op === 'sub' && b > a) [a, b] = [b, a];
    if (op === 'sub' && a === b) a += 1;
    return cell([center(`${commas(a)} ${op === 'add' ? '+' : '−'} ${commas(b)} =`)], commas(op === 'add' ? a + b : a - b));
  },
  g4Remainder(r, p = {}) {
    const { A } = ctx(r);
    for (;;) {
      const k = int(r, 3, 9); const T = int(r, 20, 99);
      if (T % k === 0) continue;
      const q = Math.floor(T / k); const rem = T % k;
      const kind = p.kind || pick(r, ['full', 'need']);
      if (kind === 'full') return cell([text(`${A} has ${T} stickers to put ${k} on each page of an album. How many full pages can ${A.s} fill, and how many stickers are left over?`)], `${q} full pages, ${rem} left over (${T} ÷ ${k} = ${q} R ${rem})`);
      return cell([text(`${A} has ${T} pencils. Each box holds ${k} pencils. How many boxes does ${A.s} need to hold all of the pencils?`)], `${q + 1} boxes (${T} ÷ ${k} = ${q} R ${rem}, so one more box is needed)`);
    }
  },

  // ----- word problems -----
  g4Equation(r, p = {}) {
    const { A, B } = ctx(r);
    const kind = p.kind || pick(r, ['times', 'twice', 'share', 'groups', 'unknownSub']);
    const letter = pick(r, ['m', 'n', 'p', 'b', 'c', 't']);
    if (kind === 'times') { const k = int(r, 2, 6); const n = int(r, 3, 9); const what = pick(r, ['marbles', 'stickers', 'cards']);
      return cell([text(`Write the equation.`), text(`${A} has ${k} times as many ${what} in ${A.p} collection than ${B}. ${B} has ${n} ${what} in ${B.p} collection. How many ${what} does ${A} have?`)], `${k} × ${n} = ${letter}; ${letter} = ${k * n}`); }
    if (kind === 'twice') { const k = pick(r, [2, 3, 4]); const n = int(r, 3, 9); const what = pick(r, ['ribbons', 'trophies', 'medals']);
      const word = { 2: 'twice', 3: 'three times', 4: 'four times' }[k];
      return cell([text(`Write the equation.`), text(`${A} won ${k * n} ${what} at last night's swim meet. That is ${word} as many as ${B}. How many ${what} did ${B} win?`)], `${k * n} ÷ ${k} = ${letter}; ${letter} = ${n}`); }
    if (kind === 'share') { const k = int(r, 3, 9); const n = int(r, 4, 9);
      return cell([text(`${A} organized the books on ${A.p} bookshelf. ${A.S} made ${k} categories of books. ${A.S} split ${k * n} books into the ${k} categories. How many books were in each category? Write the equation.`)], `${k * n} ÷ ${k} = ${letter}; ${letter} = ${n}`); }
    if (kind === 'groups') { const k = int(r, 3, 9); const n = int(r, 4, 9);
      return cell([text(`${A} filled ${k} bags with ${n} apples in each bag. How many apples did ${A.s} pack in all? Write the equation.`)], `${k} × ${n} = ${letter}; ${letter} = ${k * n}`); }
    const total = int(r, 40, 90); const left = int(r, 15, total - 10);
    return cell([text(`${A} had ${total} stickers. After giving some to ${B}, ${A.s} had ${left} stickers left. Write an equation to show how many stickers ${A} gave away.`)], `${total} − ${letter} = ${left}; ${letter} = ${total - left}`);
  },
  g4MultiStep(r, p = {}) {
    const { A } = ctx(r);
    const kind = p.kind || pick(r, ['sub3', 'mulAdd', 'addSub']);
    if (kind === 'sub3') { const total = int(r, 70, 99); const a = int(r, 15, 30); const b = int(r, 15, 30);
      const what = pick(r, ['sea shells', 'rocks', 'leaves']);
      return cell([text(`While at the beach, ${A} searched for ${what}. ${A.S} found a total of ${total}. In the morning, ${A.s} found ${a}. After lunch ${A.s} found ${b}. ${A.S} found the rest right before going home. How many did ${A.s} find at the very end of the day?`)], String(total - a - b)); }
    if (kind === 'mulAdd') { const k = int(r, 3, 6); const n = int(r, 4, 9); const extra = int(r, 3, 12);
      return cell([text(`${A} bought ${k} packs of trading cards with ${n} cards in each pack. Then ${A.s} got ${extra} more cards as a gift. How many cards does ${A.s} have now?`)], String(k * n + extra)); }
    const a = int(r, 120, 260); const b = int(r, 30, 90); const c = int(r, 20, 60);
    return cell([text(`${A} had ${a} baseball cards. ${A.S} bought ${b} more and then gave ${c} to a friend. How many cards does ${A.s} have now?`)], String(a + b - c));
  },
  g4Convert(r, p = {}) {
    const { A } = ctx(r);
    const kind = p.kind || pick(r, ['cups-pt', 'yd-ft', 'hr-min', 'ft-in', 'kg-g', 'L-mL', 'lb-oz', 'gal-qt']);
    const n = int(r, 2, 9);
    const t = {
      'cups-pt': () => { const c = 2 * int(r, 2, 6); return [`${A} baked several pies. ${A.S} used ${c} cups of flour for the dough. How many pints of flour did ${A.s} use?`, `${c / 2} pints`]; },
      'yd-ft': () => [`${A} needs ${n} yards of fabric to sew a curtain. How many feet of fabric would that be?`, `${n * 3} feet`],
      'hr-min': () => [`${A} practiced the piano for ${n} hours this week. How many minutes is that?`, `${n * 60} minutes`],
      'ft-in': () => [`A rope is ${n} feet long. How many inches long is the rope?`, `${n * 12} inches`],
      'kg-g': () => [`A bag of flour weighs ${n} kilograms. How many grams is that?`, `${commas(n * 1000)} grams`],
      'L-mL': () => [`${A}'s water bottle holds ${n} liters. How many milliliters does it hold?`, `${commas(n * 1000)} milliliters`],
      'lb-oz': () => [`A puppy weighs ${n} pounds. How many ounces does the puppy weigh?`, `${n * 16} ounces`],
      'gal-qt': () => [`${A}'s family drank ${n} gallons of milk. How many quarts is that?`, `${n * 4} quarts`],
    }[kind]();
    return cell([text(t[0])], t[1]);
  },
  g4UnitTable(r, p = {}) {
    const kind = p.kind || pick(r, ['m-mm', 'km-m', 'kg-g', 'L-mL', 'hr-min', 'ft-in', 'yd-ft', 'gal-qt', 'lb-oz']);
    const spec = { 'm-mm': [['m', 'mm'], 1000], 'km-m': [['km', 'm'], 1000], 'kg-g': [['kg', 'g'], 1000], 'L-mL': [['L', 'mL'], 1000], 'hr-min': [['hours', 'minutes'], 60], 'ft-in': [['feet', 'inches'], 12], 'yd-ft': [['yards', 'feet'], 3], 'gal-qt': [['gallons', 'quarts'], 4], 'lb-oz': [['pounds', 'ounces'], 16] }[kind];
    const s0 = int(r, 1, 4); const vals = [s0, s0 + 1, s0 + 2, s0 + 3];
    const rows = vals.map((v, i) => [commas(v), i === 0 && p.prefill !== false ? commas(v * spec[1]) : null]);
    return cell([text('Complete the table.'), { t: 'table', head: spec[0], rows }], vals.map((v) => `${v} → ${commas(v * spec[1])}`).join('; '));
  },
  g4MatchUnits(r, p = {}) {
    const sets = {
      time: [['1 week', '7 days'], ['1 hour', '60 minutes'], ['1 minute', '60 seconds'], ['1 year', '12 months']],
      length: [['1 foot', '12 inches'], ['1 yard', '3 feet'], ['1 meter', '100 centimeters'], ['1 kilometer', '1,000 meters']],
      capacity: [['1 pint', '2 cups'], ['1 quart', '2 pints'], ['1 gallon', '4 quarts'], ['1 pound', '16 ounces']],
    };
    const set = sets[p.set || pick(r, Object.keys(sets))];
    return cell([text('Draw lines to match.'), { t: 'match', left: set.map((x) => x[0]), right: shuffle(r, set.map((x) => x[1])) }], set.map((x) => `${x[0]} = ${x[1]}`).join('; '));
  },
  g4Time(r) {
    const { A } = ctx(r);
    const h = int(r, 1, 8); const m = pick(r, [0, 5, 10, 15, 20, 30, 45]); const el = pick(r, [25, 35, 40, 50, 65, 75, 85, 95, 105]);
    const start = h * 60 + m; const end = start + el;
    const t = (x) => `${Math.floor(x / 60)}:${String(x % 60).padStart(2, '0')}`;
    const hh = Math.floor(el / 60); const mm = el % 60;
    return cell([text(`${A}'s practice started at ${t(start)} and ended at ${t(end)}. How much time passed?`), line()], `${hh ? `${hh} hour${hh > 1 ? 's' : ''} ` : ''}${mm ? `${mm} minutes` : ''}`.trim());
  },

  // ----- measurement and geometry -----
  g4Perimeter(r, p = {}) {
    const unit = pick(r, ['mm', 'cm', 'in.', 'ft', 'm']);
    const l = int(r, 6, 20); const w = int(r, 3, l - 1);
    const kind = p.kind || 'perimeter';
    if (kind === 'missing') return cell([text(`The perimeter of a rectangle is ${2 * (l + w)} ${unit}. The length is ${l} ${unit}. What is the width?`), line(unit)], `${w} ${unit}`);
    if (kind === 'area') return cell([text('Find the area of the rectangle.'), svgBlock(S.rect({ l, w, unit }), 'Rectangle'), line(`square ${unit}`)], `${l * w} square ${unit}`);
    return cell([text('Find the perimeter of the rectangle.'), svgBlock(S.rect({ l, w, unit }), 'Rectangle'), line(unit)], `${2 * (l + w)} ${unit}`);
  },
  g4Vertices(r) {
    const k = pick(r, ['triangle', 'quadrilateral', 'trapezoid', 'pentagon', 'hexagon']);
    const n = { triangle: 3, quadrilateral: 4, trapezoid: 4, pentagon: 5, hexagon: 6 }[k];
    return cell([text('Circle the vertices. Trace over the sides with a crayon.'), svgBlock(S.shape(k, { size: 0.8 }), k)], `${n} vertices and ${n} sides`);
  },
  g4LinePoints(r, p = {}) {
    const items = [
      ['Draw a line and add three points to the line. Label each point with the letters: a, b and c.', 'A straight line with arrows on both ends and three labeled points on it.'],
      ['Draw a line segment. Label its endpoints P and Q.', 'A straight segment with endpoints P and Q (no arrows).'],
      ['Draw a ray. Label its endpoint R.', 'A straight line that starts at R and has an arrow on the other end.'],
      ['Draw a pair of parallel lines.', 'Two lines that stay the same distance apart and never meet.'],
      ['Draw a pair of perpendicular lines.', 'Two lines that cross to make right angles.'],
      ['Draw a right angle. Label the vertex V.', 'An angle of exactly 90° (a square corner) with vertex V.'],
      ['Draw an obtuse angle.', 'An angle greater than 90° and less than 180°.'],
      ['Draw an acute angle.', 'An angle less than 90°.'],
    ];
    const it = p.pick !== undefined ? items[p.pick] : pick(r, items);
    return cell([text(it[0])], it[1]);
  },
  g4Angles(r) {
    const order = shuffle(r, ['acute', 'right', 'obtuse']);
    const deg = { acute: int(r, 35, 70), right: 90, obtuse: int(r, 115, 150) };
    const list = order.map((k, i) => ({ deg: deg[k], label: 'abc'[i], kind: k }));
    return cell([text('Match.'), svgBlock(S.angles(list), 'Angles', true), { t: 'bullets', rows: ['acute angle', 'right angle', 'obtuse angle'], blank: true, plain: true, inline: true }, note('*Bonus: How do you classify an acute angle?')], list.map((a) => `${a.label}: ${a.kind}`).join('; ') + '; an acute angle is less than 90°');
  },
  g4Triangles(r) {
    const props = { equilateral: ['acute', 'equilateral'], isosceles: ['acute', 'isosceles'], rightIsosceles: ['right', 'isosceles'], rightScalene: ['right', 'scalene'], scalene: ['acute', 'scalene'], obtuse: ['obtuse', 'scalene'] };
    const kinds = shuffle(r, ['isosceles', pick(r, ['rightScalene', 'rightIsosceles']), ...shuffle(r, ['scalene', 'obtuse', 'equilateral']).slice(0, 2)]);
    const clauses = [['right', 'blue', 0], ['isosceles', 'green', 1]];
    const ansList = kinds.map((k, i) => { const colors = []; if (props[k][0] === 'right') colors.push('blue'); if (props[k][1] === 'isosceles') colors.push('green'); return `${i + 1}: ${colors.join(' and ') || 'no color'}`; });
    void clauses;
    return cell([text('Color the right triangles blue. Color the isosceles triangles green.'), svgBlock(S.triangles(kinds), 'Triangles', true)], ansList.join('; '));
  },
  g4ClassifyTri(r, p = {}) {
    const kind = p.kind || pick(r, ['angles', 'sides']);
    if (kind === 'angles') {
      const sets = [[40, 60, 80, 'acute'], [90, 45, 45, 'right'], [30, 40, 110, 'obtuse'], [55, 65, 60, 'acute'], [90, 30, 60, 'right'], [20, 50, 110, 'obtuse']];
      const s = pick(r, sets);
      return cell([text(`A triangle has angles that measure ${s[0]}°, ${s[1]}° and ${s[2]}°. Is it an acute, right or obtuse triangle?`), line()], s[3]);
    }
    const sets = [[5, 5, 8, 'isosceles'], [6, 6, 6, 'equilateral'], [4, 5, 7, 'scalene'], [9, 9, 4, 'isosceles'], [3, 4, 5, 'scalene'], [7, 7, 7, 'equilateral']];
    const s = pick(r, sets);
    return cell([text(`A triangle has sides that measure ${s[0]} cm, ${s[1]} cm and ${s[2]} cm. Is it equilateral, isosceles or scalene?`), line()], s[3]);
  },
  g4Symmetry(r) {
    const k = pick(r, [['square', 4], ['rectangle', 2], ['rhombus', 2], ['trapezoid', 1], ['parallelogram', 0], ['triangle', 1]]);
    return cell([text('How many lines of symmetry does this shape have?'), svgBlock(S.shape(k[0], { marks: false, size: 0.7 }), k[0]), line()], `${k[1]}${k[0] === 'triangle' ? ' (as drawn, an isosceles triangle)' : ''}`);
  },
  g4AngleAdd(r) {
    const total = pick(r, [90, 90, 180, 120]); const a = pick(r, [20, 25, 30, 35, 40, 45, 55, 60, 70]);
    if (a >= total) return skills.g4AngleAdd(r);
    const what = { 90: 'A right angle', 180: 'A straight angle', 120: 'An angle that measures 120°' }[total];
    return cell([text(`${what} is split into two smaller angles. One of the angles measures ${a}°. What is the measure of the other angle? Write an equation.`)], `${a} + x = ${total}; x = ${total - a}°`);
  },

  // ----- fractions and decimals -----
  g4EquivLine(r) {
    const spec = pick(r, [
      { den: 8, above: [[1, 4], [1, 2], [3, 4]] },
      { den: 10, above: [[1, 5], [2, 5], [3, 5], [4, 5]] },
      { den: 6, above: [[1, 3], [2, 3], [1, 2]] },
    ]);
    const pairs = spec.above.map(([n, d]) => `${n}/${d} = ${n * (spec.den / d)}/${spec.den}`);
    return cell([text('Circle two equivalent fractions on the number line.'), svgBlock(S.fractionLine(spec), 'Number line', true), note('*Bonus: Show an equation to prove that they are equivalent.')], pairs.join('; '));
  },
  g4Equiv(r) {
    const base = pick(r, [[1, 2], [2, 3], [3, 4], [4, 5], [3, 5], [1, 3], [5, 6], [2, 5], [3, 10]]);
    const k = int(r, 2, 4);
    const g = [base[0] * k, base[1] * k];
    const others = [1, 2, 3, 4, 5].filter((m) => m !== k).slice(0, 3).map((m) => `${base[0] * m}/${base[1] * m}`);
    return cell([text('Draw two fractions that are equivalent to ', f(g[0], g[1]), '.')], `${others.join(', ')} (any fraction equal to ${base[0]}/${base[1]})`);
  },
  g4EquivMissing(r) {
    const base = pick(r, [[1, 2], [2, 3], [3, 4], [1, 4], [2, 5], [3, 5], [5, 6], [1, 3]]);
    const k = int(r, 2, 6);
    return cell([center(f(base[0], base[1]), ' = ', { sp: 'blank' }, ' / ', String(base[1] * k)), line()], `${base[0] * k} (${base[0]}/${base[1]} = ${base[0] * k}/${base[1] * k})`);
  },
  g4CompareFrac(r, p = {}) {
    const mk = {
      sameDen: () => { const d = int(r, 4, 12); let a = int(r, 1, d - 1); let b = int(r, 1, d - 1); if (a === b) b = (b % (d - 1)) + 1; return [[a, d], [b, d]]; },
      sameNum: () => { const n = int(r, 1, 5); let d1 = int(r, n + 1, 9); let d2 = int(r, n + 1, 9); if (d1 === d2) d2 = d1 === 9 ? 8 : d1 + 1; return [[n, d1], [n, d2]]; },
      bench: () => { const d = pick(r, [5, 7, 8, 9, 10]); let n = int(r, 1, d - 1); if (2 * n === d) n += 1; return [[n, d], [1, 2]]; },
      unlike: () => { const x = pick(r, [[2, 3, 3, 4], [3, 5, 2, 3], [5, 6, 3, 4], [3, 8, 1, 2], [4, 5, 7, 10], [2, 4, 3, 6]]); return [[x[0], x[1]], [x[2], x[3]]]; },
    };
    const kinds = p.kinds || ['sameDen', 'sameNum', 'bench'];
    const pairs = kinds.map((k) => mk[k]()).map((pr) => (r() < 0.5 ? pr : [pr[1], pr[0]]));
    const cmp = (x, y) => { const a = x[0] * y[1]; const b = y[0] * x[1]; return a === b ? '=' : a < b ? '<' : '>'; };
    return cell([text('Compare the fractions using <, =, >.'), { t: 'circles', pairs: pairs.map((pr) => [{ f: pr[0] }, { f: pr[1] }]) }], pairs.map((pr) => `${pr[0][0]}/${pr[0][1]} ${cmp(pr[0], pr[1])} ${pr[1][0]}/${pr[1][1]}`).join('; '));
  },
  g4MulWhole(r, p = {}) {
    const d = pick(r, [3, 4, 5, 6, 8, 10]); const n = p.unit ? 1 : int(r, 1, d - 1); const W = int(r, 2, 8);
    const res = F.mul(F.frac(W, 1), F.frac(n, d));
    return cell([center(String(W), ' × ', f(n, d), ' ='), line()], ans(res));
  },
  g4DecomposeFrac(r, p = {}) {
    const d = pick(r, [4, 5, 6, 8, 10, 12]); const n = int(r, 3, Math.min(d - 1, 7));
    if ((p.kind || pick(r, ['blank', 'ways'])) === 'blank') {
      const blanks = int(r, 1, 2); const k = n - blanks;
      const terms = [...Array.from({ length: k }, () => f(1, d)), ...Array.from({ length: blanks }, () => ({ sp: 'blank' }))];
      const out = []; terms.forEach((t, i) => { if (i) out.push(' + '); out.push(t); });
      return cell([text('Fill in the missing unit fractions.'), center(f(n, d), ' = ', ...out)], `each blank is 1/${d}`);
    }
    const a1 = int(r, 1, n - 1); let a2 = int(r, 1, n - 1);
    for (let i = 0; i < 20 && (a2 === a1 || a2 === n - a1); i++) a2 = int(r, 1, n - 1);
    return cell([text('Write ', f(n, d), ' as a sum of two fractions in two different ways.')], `${a1}/${d} + ${n - a1}/${d}; ${a2}/${d} + ${n - a2}/${d} (many answers are correct)`);
  },
  g4FracDecimal(r, p = {}) {
    const kind = p.kind || pick(r, ['tenth', 'hundredth', 'decToFrac', 'tenthsToHundredths']);
    if (kind === 'tenth') { const n = int(r, 1, 9); return cell([text('Write ', f(n, 10), ' as a decimal.'), line()], `0.${n}`); }
    if (kind === 'hundredth') { const n = int(r, 1, 99); return cell([text('Write ', f(n, 100), ' as a decimal.'), line()], `0.${String(n).padStart(2, '0')}`); }
    if (kind === 'decToFrac') { const n = int(r, 11, 99); return cell([text(`Write 0.${n} as a fraction.`), line()], `${n}/100`); }
    const n = int(r, 1, 9); return cell([center(f(n, 10), ' = ', { sp: 'blank' }, ' / 100')], `${n * 10}/100`);
  },
  g4MixedImproper(r, p = {}) {
    const d = int(r, 3, 8); const w = int(r, 1, 5); const n = int(r, 1, d - 1);
    if ((p.kind || pick(r, ['toMixed', 'toImproper'])) === 'toMixed') return cell([text('Write ', f(w * d + n, d), ' as a mixed number.'), line()], `${w} ${n}/${d}`);
    return cell([text('Write ', mx(w, n, d), ' as an improper fraction.'), line()], `${w * d + n}/${d}`);
  },
  g4MixedWord(r, p = {}) {
    const { A, B } = ctx(r);
    const d = pick(r, [4, 5, 6, 8, 10]); const w1 = int(r, 2, 6); const w2 = int(r, 1, 5); const n1 = int(r, 1, d - 1); const n2 = int(r, 1, d - 1);
    if ((p.op || pick(r, ['add', 'sub'])) === 'add') return cell([text(`${A} walked ${w1} `, f(n1, d), ` miles on Saturday and ${w2} `, f(n2, d), ` miles on Sunday. How many miles did ${A.s} walk in all?`)], ans(F.add(F.frac(w1 * d + n1, d), F.frac(w2 * d + n2, d))));
    const big = F.frac((w1 + w2 + 1) * d + n1, d); const small = F.frac(w2 * d + n2, d);
    return cell([text(`${B} had ${w1 + w2 + 1} `, f(n1, d), ` yards of ribbon and used ${w2} `, f(n2, d), ` yards for a project. How much ribbon does ${B.s} have left?`)], ans(F.sub(big, small)));
  },
  g4FracWordMul(r) {
    const { A } = ctx(r);
    const d = pick(r, [3, 4, 5, 6, 8]); const n = int(r, 1, d - 1); const k = int(r, 3, 8);
    return cell([text(`${A} drinks `, f(n, d), ` of a liter of milk every day. How many liters of milk does ${A.s} drink in ${k} days?`)], ans(F.mul(F.frac(k, 1), F.frac(n, d))));
  },
  g4Patterns(r, p = {}) {
    const kind = p.kind || pick(r, ['add', 'sub', 'mul']);
    const start = int(r, 2, 20); const step = kind === 'mul' ? int(r, 2, 3) : int(r, 3, 12);
    const seq = [start];
    for (let i = 0; i < 5; i++) seq.push(kind === 'add' ? seq[i] + step : kind === 'mul' ? seq[i] * step : seq[i] - step);
    if (kind === 'sub') { const s0 = int(r, 60, 99); seq.length = 0; seq.push(s0); for (let i = 0; i < 5; i++) seq.push(seq[i] - step); }
    const rule = kind === 'add' ? `add ${step}` : kind === 'sub' ? `subtract ${step}` : `multiply by ${step}`;
    return cell([text('Find the missing numbers. What is the rule?'), center(`${seq.slice(0, 4).map(commas).join(', ')}, ____, ____`)], `${commas(seq[4])}, ${commas(seq[5])}; rule: ${rule}`);
  },
  g4Factors(r, p = {}) {
    const kind = p.kind || pick(r, ['list', 'prime', 'multiples']);
    if (kind === 'list') { const n = pick(r, [12, 16, 18, 20, 24, 28, 30, 36]); const fs = []; for (let i = 1; i <= n; i++) if (n % i === 0) fs.push(i);
      return cell([text(`List all of the factors of ${n}.`), line()], fs.join(', ')); }
    if (kind === 'multiples') { const n = int(r, 3, 9); return cell([text(`Write the first five multiples of ${n}.`), line()], [1, 2, 3, 4, 5].map((k) => k * n).join(', ')); }
    const n = pick(r, [23, 27, 29, 31, 39, 41, 47, 49, 51, 53, 57, 61]); const isPrime = ![27, 39, 49, 51, 57].includes(n);
    return cell([text(`Is ${n} a prime number or a composite number? Explain.`)], isPrime ? `prime: its only factors are 1 and ${n}` : `composite: it has more than two factors`);
  },
};

module.exports = { skills };
