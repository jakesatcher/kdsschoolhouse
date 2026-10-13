'use strict';

// Grade 3 skills, part 1: number work, patterns, properties, time and word problems. Anchored to the real 3rd grade
// Weekly and Test pages (rounding, equal groups and arrays, fact families, function rules, properties of multiplication,
// elapsed time, two-step stories). Every cell carries `meta` (the numbers behind it) so the tests can re-derive the answer.
const C = require('./core');
const S3 = require('./svg3');
const { ctx } = require('../wordProblems');
const { f, text, center, line, space, svgBlock, cell, int, pick, shuffle, words } = C;

const commas = (n) => Number(n).toLocaleString('en-US');
const opt = (r, v) => (Array.isArray(v) ? pick(r, v) : v);
const rangeInt = (r, v) => (Array.isArray(v) ? int(r, v[0], v[1]) : v);
const clockStr = (h, m) => `${((h + 11) % 12) + 1}:${String(m).padStart(2, '0')}`;
const LETTER_POOL = ['N', 'W', 'S', 'K', 'M', 'R', 'V', 'P', 'B', 'T'];
const NUMW = { 2: 'two', 3: 'three', 4: 'four', 5: 'five', 6: 'six', 7: 'seven', 8: 'eight', 9: 'nine', 10: 'ten' };
const nw = (n) => NUMW[n] || String(n);

// ---- stories for equal groups: container, singular container, thing inside, verb scene ----
const GROUP_STORIES = [
  { c: 'boxes', c1: 'box', t: 'books', max: 8, verb: (A, g, k, c) => `${A} bought ${nw(g)} ${c} of books at a yard sale. Each box had ${nw(k)} books.` },
  { c: 'cases', c1: 'case', t: 'sodas', max: 10, verb: (A, g, k) => `${A} bought ${nw(g)} cases of soda at the grocery store. Each case had ${k} sodas.` },
  { c: 'batches', c1: 'batch', t: 'cookies', max: 9, verb: (A, g, k) => `${A} baked ${g} batches of cookies. Each batch had ${k} cookies.` },
  { c: 'packs', c1: 'pack', t: 'pieces of gum', max: 8, verb: (A, g, k) => `${A} had ${nw(g)} packs of gum. Each pack had ${nw(k)} pieces.` },
  { c: 'pages', c1: 'page', t: 'pictures', max: 6, verb: (A, g, k) => `${A} has ${nw(g)} pages of photos in an album. Each page has ${nw(k)} pictures on it.` },
  { c: 'baskets', c1: 'basket', t: 'apples', max: 8, verb: (A, g, k) => `${A} picked ${g} baskets of apples. Each basket held ${k} apples.` },
  { c: 'trays', c1: 'tray', t: 'muffins', max: 8, verb: (A, g, k) => `${A} baked ${g} trays of muffins. Each tray held ${k} muffins.` },
  { c: 'bags', c1: 'bag', t: 'oranges', max: 6, verb: (A, g, k) => `${A} bought ${g} bags of oranges. Each bag had ${k} oranges.` },
  { c: 'shelves', c1: 'shelf', t: 'books', max: 9, verb: (A, g, k) => `The library had ${g} shelves of picture books. Each shelf held ${k} books.` },
  { c: 'rows', c1: 'row', t: 'chairs', max: 9, verb: (A, g, k) => `The gym had ${g} rows of chairs. Each row had ${k} chairs.` },
  { c: 'packs', c1: 'pack', t: 'markers', max: 8, verb: (A, g, k) => `${A} bought ${g} packs of markers. Each pack had ${k} markers.` },
  { c: 'vases', c1: 'vase', t: 'flowers', max: 8, verb: (A, g, k) => `${A} put flowers in ${g} vases. Each vase held ${k} flowers.` },
];

// Rewrite an equal-groups sentence into the question the PDF asks: solution sentence, expression, equation, or plain count
function groupsAsk(ask, g, k) {
  if (ask === 'solution') return { q: 'Write the solution sentence.', a: `${g} × ${k} = ${g * k}` };
  if (ask === 'expression') return { q: 'Write the expression that will solve the problem.', a: `${g} × ${k}` };
  if (ask === 'equation') return { q: 'Write the equation.', a: `${g} × ${k} = ${g * k}` };
  return { q: 'How many are there in all?', a: String(g * k) };
}

const skills = {
  // ---------- function machine ----------
  g3Function(r, p = {}) {
    const op = opt(r, p.op || ['+', '−', '×']);
    const k = rangeInt(r, p.k || (op === '×' ? [2, 5] : op === '÷' ? 2 : [2, 10]));
    let ins;
    if (op === '×') ins = shuffle(r, [1, 2, 3, 4, 5, 6, 7, 8]).slice(0, 4);
    else if (op === '÷') ins = shuffle(r, [4, 6, 8, 10, 12, 14, 16]).slice(0, 4);
    else if (op === '−') ins = shuffle(r, Array.from({ length: 14 }, (_, i) => i + k + 2)).slice(0, 4);
    else ins = shuffle(r, Array.from({ length: 14 }, (_, i) => i + 3)).slice(0, 4);
    if (p.sorted) ins.sort((a, b) => a - b);
    const out = (x) => (op === '+' ? x + k : op === '−' ? x - k : op === '×' ? x * k : x / k);
    const rows = ins.map((x) => [x, out(x)]);
    const rule = { '+': `add ${k}`, '−': `subtract ${k}`, '×': `multiply by ${k}`, '÷': `divide by ${k}` }[op];
    return cell([text('Determine what rule the function machine is using.'), { t: 'table', head: ['Input', 'Output'], rows }, line()], `${rule} (${op}${k})`, { op, k, rows });
  },
  // ---------- arrays and groups ----------
  g3Array(r, p = {}) {
    const rows = rangeInt(r, p.rows || [2, 5]); let cols = rangeInt(r, p.cols || [2, 8]);
    if (cols === rows && !p.square) cols = Math.min(9, rows + 1);
    const kind = pick(r, S3.GLYPHS);
    return cell([text('Write the array as a multiplication problem and solve.'), svgBlock(S3.dotArray({ rows, cols, kind }), `${rows} rows of ${cols}`), line()], `${rows} × ${cols} = ${rows * cols}`, { rows, cols });
  },
  g3GroupsOf(r, p = {}) {
    const per = rangeInt(r, p.per || [3, 9]); const groups = rangeInt(r, p.groups || [2, 6]);
    const total = per * groups; const kind = pick(r, S3.GLYPHS);
    const perRow = pick(r, [7, 8, 9]);
    return cell([text(`How many groups of ${per} can you make with the ${total} shapes?`), svgBlock(S3.glyphField({ total, perRow, kind }), `${total} shapes`), line()], String(groups), { total, per });
  },
  g3SetsCircle(r, p = {}) {
    const g = rangeInt(r, p.groups || [2, 4]); const k = rangeInt(r, p.per || [3, 6]);
    const wrong = [[k, g], [g + 1, k], [g, k + 1], [g - 1 || g + 2, k]].filter(([a, b]) => a * b !== g * k || (a !== g && b !== k));
    const opts = shuffle(r, [[g, k], ...wrong.filter(([a, b]) => !(a === g && b === k)).slice(0, 3)]);
    const correct = opts.findIndex(([a, b]) => a === g && b === k);
    return cell([text(`Circle the set that shows ${g} groups of ${k}.`), svgBlock(S3.setOptions(opts), 'Sets of dots')], `${S3.LETTERS[correct]} (${g} groups of ${k})`, { groups: g, per: k, options: opts, correct });
  },
  g3Remainder(r, p = {}) {
    const sets = rangeInt(r, p.sets || [2, 5]); const q = rangeInt(r, p.q || [3, 6]);
    const rem = p.rem === false ? 0 : int(r, 1, sets - 1);
    const total = sets * q + rem;
    const askLeft = p.rem !== false && p.askLeft !== false;
    const t = `Draw ${total} circles. Put them equally into ${sets === 2 ? 'two' : sets} sets. How many circles are in each set?${askLeft ? ' Do you have any left over? If so, how many?' : ''}`;
    return cell([text(t), { t: 'box' }, line()], `${q} in each set${askLeft ? (rem ? `, ${rem} left over` : ', none left over') : ''}`, { total, sets, q, rem });
  },
  g3RepeatAdd(r, p = {}) {
    const k = rangeInt(r, p.k || [3, 8]); const n = rangeInt(r, p.n || [3, 6]);
    if (p.dir === 'toAdd') {
      return cell([text('Rewrite the multiplication problem as an addition problem and solve the problem.'), center(`${n} × ${k} =`), space('m')], `${Array(n).fill(k).join(' + ')} = ${n * k}`, { n, k, dir: 'toAdd' });
    }
    return cell([text('Rewrite the addition problem as a multiplication problem. Solve the problem.'), center(`${Array(n).fill(k).join(' + ')} =`), line()], `${n} × ${k} = ${n * k}`, { n, k, dir: 'toMul' });
  },
  g3NumberLineMul(r, p = {}) {
    const a = rangeInt(r, p.a || [2, 5]); let b = rangeInt(r, p.b || [2, 5]);
    if (a === b) b = a === 5 ? 2 : a + 1;
    return cell([text(`Show ${a} × ${b} on the number line.`), svgBlock(S3.numberLine({ max: Math.max(12, a * b + 2) }), 'Number line', true), line()], `${a} jumps of ${b} lands on ${a * b}`, { a, b });
  },
  g3EvenOdd(r) {
    const kind = pick(r, [0, 1, 2]);
    const n = int(r, 3, 9); const m = int(r, 2, 9);
    if (kind === 0) return cell([text(`How do you know that ${n} × 2 is an even number?`), space('m')], 'Any number times 2 is two equal groups (doubles), so the product can always be split into pairs: even.', { kind });
    if (kind === 1) return cell([text(`Is the product of ${n % 2 ? n : n + 1} × 4 odd or even? How do you know?`), space('m')], 'Even. Multiplying by an even number always gives an even product.', { kind });
    return cell([text('When you multiply an odd number by an even number, is the product odd or even?'), line()], 'Even', { kind, m });
  },
  g3OnesDigit(r) {
    const a = pick(r, [2, 5, 4, 3]); const b = int(r, 100, 899);
    return cell([text(`Use a multiplication table to answer this question. What digit would be in the ones place for the product of ${a} × ${b}?`), line()], String((a * b) % 10), { a, b });
  },
  // ---------- rounding ----------
  g3RoundLine(r, p = {}) {
    const unit = opt(r, p.unit || 10); const digits = unit === 10 ? 2 : 3;
    let n; do { n = int(r, 10 ** (digits - 1) + 1, 10 ** digits - 1); } while (n % unit === 0 || n % unit === unit / 2);
    const lo = Math.floor(n / unit) * unit; const hi = lo + unit; const mid = lo + unit / 2;
    const nameU = { 10: 'ten', 100: 'hundred', 1000: 'thousand' }[unit];
    return cell([text(`Use the line segment to round ${n} to the nearest ${nameU}.`), svgBlock(S3.roundLine({ lo, mid, hi, n }), 'Number line', true), line()], String(n - lo > unit / 2 ? hi : lo), { n, unit });
  },
  g3Round(r, p = {}) {
    const unit = opt(r, p.unit || 10);
    const nameU = { 10: 'ten', 100: 'hundred', 1000: 'thousand' }[unit];
    const [dLo, dHi] = p.digits || (unit === 10 ? [2, 2] : unit === 100 ? [3, 4] : [4, 4]);
    const make = () => { let n; do { n = int(r, 10 ** (int(r, dLo, dHi) - 1), 10 ** dHi - 1); } while (n % unit === unit / 2 || n < unit / 2 + 1); return n; };
    const count = p.count || 3;
    const nums = Array.from({ length: count }, make);
    const rnd = (n) => Math.floor((n + unit / 2) / unit) * unit;
    if (count === 1) return cell([text(`Round ${commas(nums[0])} to the nearest ${nameU}.`), line()], commas(rnd(nums[0])), { nums, unit });
    return cell([text(`Round each number to the nearest ${nameU}.`), { t: 'list', rows: nums.map((n) => ({ seg: [commas(n)], blank: true })) }], nums.map((n) => commas(rnd(n))).join(', '), { nums, unit });
  },
  // ---------- fact families, operations ----------
  g3FactFamily(r, p = {}) {
    const a = rangeInt(r, p.a || [2, 9]); const b = rangeInt(r, p.b || [2, 9]); const prod = a * b;
    const kind = opt(r, p.kind || 'missing');
    if (kind === 'missing') {
      const pat = pick(r, [0, 1, 2]);
      const lines = [
        [`${a} × ${b} = ${prod}`, `${prod} ÷ ? = ${b}`, `${b} × ${a} = ${prod}`, `${prod} ÷ ${b} = ?`],
        [`? × ${b} = ${prod}`, `${prod} ÷ ? = ${b}`, `${b} × ? = ${prod}`, `${prod} ÷ ${b} = ?`],
        [`${a} × ${b} = ${prod}`, `${prod} ÷ ${a} = ?`, `${b} × ${a} = ${prod}`, `${prod} ÷ ? = ${a}`],
      ][pat];
      return cell([text('Determine the missing number from the fact family.'), { t: 'bullets', rows: lines, plain: true }, line()], String(pat === 2 ? b : a), { a, b, prod, pat });
    }
    if (kind === 'fill') {
      const facts = [`${a} × ${b} = ${prod}`, `${prod} ÷ ${b} = ${a}`, `${b} × ${a} = ${prod}`, `${prod} ÷ ${a} = ${b}`];
      const hide = int(r, 0, 3); const shown = facts.map((x, i) => (i === hide ? '__________' : x));
      return cell([text('Write the missing fact in the fact family.'), { t: 'bullets', rows: shown, plain: true }], facts[hide], { a, b, prod, hide });
    }
    if (kind === 'toMul') return cell([text('Write a related multiplication sentence to the following equation.'), center(`${prod} ÷ ${b} = ${a}`), line()], `${a} × ${b} = ${prod} (or ${b} × ${a} = ${prod})`, { dividend: prod, divisor: b, quotient: a });
    return cell([text('Write a related division sentence to the following equation.'), center(`${a} × ${b} = ${prod}`), line()], `${prod} ÷ ${a} = ${b} (or ${prod} ÷ ${b} = ${a})`, { a, b, prod });
  },
  g3Add(r, p = {}) {
    const kind = opt(r, p.kind || 'add'); const dg = opt(r, p.digits || 2);
    const lo = 10 ** (dg - 1); const hi = 10 ** dg - 1;
    const noCarry = p.carry === 'none';
    const digs = (n) => String(n).split('').map(Number);
    const mk = () => int(r, lo, hi);
    if (kind === 'add3') {
      const nums = [mk(), mk(), mk()];
      return cell([text(`${nums.map(commas).join(' + ')} =`), space('m')], commas(nums[0] + nums[1] + nums[2]), { op: 'add', nums });
    }
    for (let guard = 0; guard < 500; guard++) {
      let a = mk(); let b = mk();
      if (kind === 'sub' && b > a) [a, b] = [b, a];
      if (kind === 'sub' && a === b) continue;
      if (noCarry) {
        const da = digs(a); const db = digs(b); if (da.length !== db.length) continue;
        if (kind === 'add' && da.some((x, i) => x + db[i] > 9)) continue;
        if (kind === 'sub' && da.some((x, i) => x < db[i])) continue;
      }
      return cell([text(`${commas(a)} ${kind === 'add' ? '+' : '−'} ${commas(b)} =`), space('m')], commas(kind === 'add' ? a + b : a - b), { op: kind, nums: [a, b] });
    }
    throw new Error('g3Add: no numbers');
  },
  g3Mult(r, p = {}) {
    const kind = opt(r, p.kind || 'tens');
    if (kind === 'missing') {
      // eqs like 4 × ___ = 28, ___ × 5 = 35, 5 × ___ = 0
      const eqs = [];
      const forms = p.forms || ['first', 'first', 'last'];
      forms.forEach((fm) => {
        const a = int(r, 2, 9); const b = p.zeroOne ? pick(r, [0, 1]) : int(r, 2, 9);
        if (fm === 'last') eqs.push({ left: ['', a], res: a * b, blank: 'first', other: a, ans: b });
        else eqs.push({ left: [a, ''], res: a * b, blank: 'second', other: a, ans: b });
      });
      const rows = eqs.map((e) => ({ seg: e.blank === 'first' ? [{ sp: 'blank' }, ` × ${e.other} = ${e.res}`] : [`${e.other} × `, { sp: 'blank' }, ` = ${e.res}`] }));
      return cell([text('Complete the equations.'), { t: 'list', rows }], eqs.map((e) => String(e.ans)).join(', '), { eqs: eqs.map((e) => ({ other: e.other, res: e.res, blank: e.blank, ans: e.ans })) });
    }
    if (kind === 'div') {
      const rows = []; const eqs = [];
      for (let i = 0; i < 3; i++) {
        const form = pick(r, p.forms || ['fact', 'fact', 'self']);
        let d; let q;
        if (form === 'self') { d = int(r, 2, 9); q = 1; } else if (form === 'one') { d = 1; q = int(r, 2, 9); } else { d = int(r, 2, 9); q = int(r, 2, 9); }
        const n = d * q; eqs.push([n, d, q]);
        rows.push({ seg: [`${n} ÷ ${d} = `], blank: true });
      }
      return cell([text('Complete the equations.'), { t: 'list', rows }], eqs.map((e) => String(e[2])).join(', '), { eqs: eqs.map(([n, d, q]) => ({ n, d, q })) });
    }
    // tens / hundreds / tens×tens
    const forms = p.forms || ['T×D', 'T×D', 'T×D'];
    const eqs = forms.map((fm) => {
      const tens = () => int(r, 1, 9) * 10; const dig = () => int(r, 2, 9); const hun = () => int(r, 1, 9) * 100;
      let a; let b;
      if (fm === 'T×D') { a = tens(); b = dig(); if (a === 10) a = 20; } else if (fm === 'D×T') { a = dig(); b = tens(); if (b === 10) b = 30; } else if (fm === 'T×T') { a = int(r, 2, 9) * 10; b = int(r, 2, 9) * 10; } else if (fm === 'H×D') { a = hun(); b = dig(); } else if (fm === 'D×H') { a = dig(); b = hun(); } else if (fm === 'H×T') { a = hun(); b = int(r, 1, 9) * 10; } else if (fm === 'D×10') { a = dig(); b = 10; } else { a = 10; b = int(r, 1, 9); }
      return [a, b];
    });
    return cell([text(p.title || 'Complete the equations.'), { t: 'list', rows: eqs.map(([a, b]) => ({ seg: [`${commas(a)} × ${commas(b)} = `], blank: true })) }], eqs.map(([a, b]) => commas(a * b)).join(', '), { eqs });
  },
  g3Pattern(r, p = {}) {
    const step = rangeInt(r, p.step || [2, 10]) * (p.down ? -1 : 1);
    const start = p.down ? int(r, 60, 150) + Math.abs(step) * 4 : rangeInt(r, p.start || [1, 20]);
    const seq = Array.from({ length: 6 }, (_, i) => start + i * step);
    return cell([text('Write the missing numbers to complete the pattern.'), center(seq.slice(0, 3).map(commas).join(', ')), { t: 'line', multi: 3 }], seq.slice(3).map(commas).join(', '), { seq, step });
  },
  g3Variable(r, p = {}) {
    const letter = pick(r, LETTER_POOL); const kind = opt(r, p.kind || 'sub');
    const dg = rangeInt(r, p.digits || [2, 3]);
    const lo = 10 ** (dg - 1); const hi = 10 ** dg - 1;
    if (kind === 'add') { const a = int(r, lo, hi); const x = int(r, lo, hi); return cell([text('Find the value of the letter.'), center(`${letter} + ${a} = ${a + x}`), line('', `${letter} =`)], String(x), { kind, letter, a, total: a + x, x }); }
    if (kind === 'subVar') { const t = int(r, lo + 100, hi + 400); const a = int(r, lo, t - 20); return cell([text('Find the value of the variable.'), center(`${t} − ${letter} = ${a}`), line('', `${letter} =`)], String(t - a), { kind, letter, t, a, x: t - a }); }
    const x = int(r, lo + 100, hi + 500); const a = int(r, lo, 400); return cell([text('Find the value of the letter.'), center(`${letter} − ${a} = ${x}`), line('', `${letter} =`)], String(x + a), { kind: 'sub', letter, a, x, total: x + a, ans: x + a });
  },
  g3PerimVar(r) {
    const top = int(r, 4, 10); const other = int(r, 3, 9); const perim = 2 * (top + other); const letter = pick(r, LETTER_POOL);
    return cell([text(`Determine the value of the variable. Perimeter = ${perim} cm`), svgBlock(S3.rectVar({ top, letter }), 'Rectangle'), line('', `${letter} =`)], String(other), { perim, top, other, letter });
  },
  // ---------- properties ----------
  g3Property(r, p = {}) {
    const kind = opt(r, p.kind || 'name');
    const a = int(r, 2, 9); const b = int(r, 2, 9); const c = int(r, 2, 6);
    const eqs = {
      comm: `${a} × ${b} = ${b} × ${a}`,
      assoc: `(${a} × ${b}) × ${c} = ${a} × (${b} × ${c})`,
      ident: `${a} × 1 = ${a}`,
      zero: `${b} × 0 = 0`,
    };
    const NAMES = { comm: 'Commutative Property', assoc: 'Associative Property', ident: 'Identity Property' };
    if (kind === 'name') {
      const which = pick(r, p.which || ['comm', 'assoc', 'ident']);
      return cell([text('Circle the property of multiplication shown.'), center(eqs[which]), { t: 'bullets', rows: ['Identity Property', 'Associative Property', 'Commutative Property'], plain: true }], NAMES[which], { which, eq: eqs[which] });
    }
    if (kind === 'circle') {
      const which = pick(r, p.which || ['comm', 'assoc']);
      const bad = pick(r, ['zero', ...['comm', 'assoc', 'ident'].filter((k) => k !== which)]);
      const others = shuffle(r, ['comm', 'assoc', 'ident', 'zero'].filter((k) => k !== which)).slice(0, 3);
      const order = shuffle(r, [which, ...others]);
      void bad;
      const def = which === 'ident' ? ' (When you multiply any number by one, the product is that number.)' : '';
      return cell([text(`Circle the equation using the ${NAMES[which]} of Multiplication.${def}`), { t: 'bullets', rows: order.map((k) => eqs[k]), plain: true }], eqs[which], { which, options: order.map((k) => eqs[k]) });
    }
    // which expression is (not) equal to  (a × b) × c
    const not = kind === 'notEqual';
    const expr = `(${a} × ${b}) × ${c}`; const val = a * b * c;
    const same = [`${a} × (${b} × ${c})`, `${c} × (${a} × ${b})`, `(${a} × ${c}) × ${b}`];
    const calc = (e) => Function(`return ${e.replace(/×/g, '*')}`)(); // digits and operators only
    const diff = [`${a} + (${b} × ${c})`, `(${a} × ${b}) + ${c}`, `(${a} + ${b}) × ${c}`, `${a} × ${b} + ${c}`].filter((e) => calc(e) !== val);
    const target = not ? shuffle(r, diff)[0] : shuffle(r, same)[0];
    const fillers = not ? shuffle(r, same).slice(0, 3) : shuffle(r, diff).slice(0, 3);
    const order = shuffle(r, [target, ...fillers]);
    return cell([text(not ? [`Which expression is `, { b: 'not' }, ` equal to ${expr}?`] : `Which expression is equal to ${expr}?`), { t: 'bullets', rows: order, plain: true }], target, { expr, val, options: order, not });
  },
  // ---------- time ----------
  g3Clock(r, p = {}) {
    const kind = opt(r, p.kind || 'read');
    const stepMin = opt(r, p.step || 5);
    const h = int(r, 1, 12); const m = stepMin === 60 ? 0 : int(r, 0, Math.floor(59 / stepMin)) * stepMin;
    if (kind === 'draw') return cell([text(`Draw the hands on the clock to show ${clockStr(h, m)}.`), svgBlock(S3.clock({ hands: false }), 'Blank clock')], `${clockStr(h, m)} (short hand near the ${h}, long hand on the ${m / 5 === 0 ? 12 : m / 5}${m % 5 ? ' (just past)' : ''})`, { h, m });
    if (kind === 'convert') {
      const mins = Array.from({ length: 3 }, () => int(r, 61, 330));
      const rows = mins.map((n) => ({ seg: [`${n} min = `, { sp: 'blank' }, ' h ', { sp: 'blank' }, ' min'] }));
      return cell([text('Convert each time from only minutes to hours (h) and minutes (min).'), { t: 'list', rows }], mins.map((n) => `${Math.floor(n / 60)} h ${n % 60} min`).join('; '), { mins });
    }
    return cell([text('What time is shown on the clock?'), svgBlock(S3.clock({ h, m }), 'Clock'), line()], clockStr(h, m), { h, m });
  },
  g3Elapsed(r, p = {}) {
    const { A, B } = ctx(r);
    const kind = opt(r, p.kind || 'elapsed');
    const acts = [
      ['reading a book', 'finished reading it'], ['playing a video game', 'stopped playing'], ['working on homework', 'finished'], ['cleaning his room', 'finished cleaning'],
      ['practicing piano', 'stopped practicing'], ['raking the yard', 'finished raking'], ['baking cookies', 'took the cookies out'], ['drawing a picture', 'finished drawing'],
    ];
    const [doing, finish] = pick(r, acts);
    const who = pick(r, [A, B]);
    const mm = () => pick(r, p.mins || [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55]);
    const startH = int(r, 1, 11); const startM = mm();
    if (kind === 'elapsed') {
      const dh = int(r, p.dh ? p.dh[0] : 1, p.dh ? p.dh[1] : 2); const dm = pick(r, p.dmins || [0, 10, 15, 20, 25, 30, 40, 45, 50]);
      const total = dh * 60 + dm; const end = startH * 60 + startM + total;
      const eh = Math.floor(end / 60); const em = end % 60;
      const nice = (h, m) => `${h}:${String(m).padStart(2, '0')}`;
      const txt = `${who} started ${doing.replace('his ', `${who.p} `).replace('her ', `${who.p} `)} at ${nice(startH, startM)}. If ${who.s} ${finish.replace('his ', `${who.p} `)} at ${clockStr(eh, em)}, how long did ${who.s} spend?`;
      return cell([text(txt.replace(/spend\?$/, 'spend on it?')), space('m'), line()], `${dh ? `${dh} hour${dh > 1 ? 's' : ''}` : ''}${dh && dm ? ' ' : ''}${dm ? `${dm} minutes` : ''}`, { start: [startH, startM], end: [eh, em], mins: total });
    }
    if (kind === 'end') {
      const dh = int(r, 1, 3); const dm = pick(r, [15, 20, 25, 30, 40, 45, 50, 55]);
      const end = startH * 60 + startM + dh * 60 + dm;
      return cell([text(`${who} started ${doing} at ${clockStr(startH, startM)}. ${who.S} spent ${dh} hour${dh > 1 ? 's' : ''} and ${dm} minutes. What time was it when ${who.s} ${finish}?`), line()], clockStr(Math.floor(end / 60), end % 60), { start: [startH, startM], dur: dh * 60 + dm });
    }
    if (kind === 'start') {
      const dh = int(r, 1, 3); const dm = pick(r, [15, 20, 25, 30, 40, 45, 50, 55]);
      const endMin = startH * 60 + startM + dh * 60 + dm; const endH = Math.floor(endMin / 60);
      return cell([text(`${who} ${finish} at ${clockStr(endH, endMin % 60)}. If ${who.s} had spent ${dh} hour${dh > 1 ? 's' : ''} and ${dm} minutes ${doing}, what time was it when ${who.s} started?`), line()], clockStr(startH, startM), { end: [endH, endMin % 60], dur: dh * 60 + dm });
    }
    // get ready: leaving time minus 30 minutes
    const leaveH = int(r, 3, 11); const leaveM = pick(r, [15, 30, 45, 0]); const prep = pick(r, [20, 30, 40, 45]);
    const startMin = leaveH * 60 + leaveM - prep;
    return cell([text(`${who} is leaving for ${pick(r, ['a soccer game', 'a birthday party', 'a piano lesson', 'a school concert', 'swim practice'])} at ${clockStr(leaveH, leaveM)}. It takes ${who.o} ${prep} minutes to get ready. What time should ${who.s} start getting ready so ${who.s} can leave on time?`), line()], clockStr(Math.floor(startMin / 60), startMin % 60), { leave: [leaveH, leaveM], prep });
  },
  // ---------- word problems ----------
  g3Word(r, p = {}) {
    const { A, B, C: Cc } = ctx(r);
    const kind = opt(r, p.kind || 'addSub');
    const asWords = !!p.words;
    const n = (v) => (asWords ? words(v) : String(v));
    if (kind === 'addSub') {
      const a = int(r, 10, 40); const b = int(r, 5, 30); const c = int(r, 5, a + b - 5);
      const stories = [
        () => ({ t: `${A} picked ${n(a)} tulips and ${n(b)} roses to make flower arrangements. ${A.S} only used ${n(c)} of the flowers. How many extra flowers did ${A} pick?`, ans: a + b - c }),
        () => ({ t: `${A} had ${n(a)} stickers. ${A.S} bought ${n(b)} more at the school store and gave ${n(c)} to ${B}. How many stickers does ${A} have now?`, ans: a + b - c }),
        () => ({ t: `A pet store had ${n(a)} black lizards and ${n(b)} green lizards. If ${n(c)} of the lizards were sold, how many lizards are left?`, ans: a + b - c }),
        () => ({ t: `${A} had ${n(a)} dollars. ${A.S} earned ${n(b)} dollars mowing a neighbor's grass, but spent ${n(c)} dollars on a new game. How much money does ${A.s} have now?`, ans: a + b - c }),
        () => ({ t: `The school store had ${n(a)} packs of paper on the shelf. They put ${n(b)} more packs on the shelf, but sold ${n(c)} packs. How many packs would they have left?`, ans: a + b - c }),
        () => ({ t: `${A} had ${n(a)} hair bows. ${A.S} gave ${n(c)} to ${B.name}'s little sister and bought ${n(b)} new ones. How many hair bows does ${A} have?`, ans: a + b - c }),
      ];
      const s = pick(r, stories)();
      return cell([text(s.t), space('m'), line()], String(s.ans), { steps: [a, b, -c] });
    }
    if (kind === 'sub3') {
      const a = int(r, 30, 60); const b = int(r, 3, 12); const c = int(r, 3, 12); const d = int(r, 3, 12);
      const t = pick(r, [
        `${A} baked ${a} cupcakes. ${A.S} gave ${b} to the teacher, ${c} to ${B}, and ate ${d}. How many cupcakes are left?`,
        `A farmer picked ${a} carrots. ${b} were too small, ${c} were eaten by rabbits and ${d} were sold at the stand. How many carrots does the farmer have left?`,
      ]);
      return cell([text(t), space('m'), line()], String(a - b - c - d), { steps: [a, -b, -c, -d] });
    }
    if (kind === 'add3') {
      const nums = [int(r, 100, 499), int(r, 100, 499), int(r, 100, 499)];
      const t = pick(r, [
        `The grocery store needed to restock the canned foods. They put ${nums[0]} cans of corn, ${nums[1]} cans of tomatoes and ${nums[2]} cans of peas on the shelves. How many cans did they put on the shelves?`,
        `At the fair there were ${nums[0]} candy apples, ${nums[1]} plain caramel apples and ${nums[2]} caramel apples with nuts. How many apples were at the fair?`,
        `A school had ${nums[0]} red pens, ${nums[1]} blue pens and ${nums[2]} black pens to sell in the school store. How many pens did the school have to sell?`,
        `The museum has three large rooms. Room A can hold ${nums[0]} people, Room B can hold ${nums[1]} people and Room C can hold ${nums[2]} people. How many people can the museum hold in all?`,
        `The bookshelf had three shelves. The first shelf had ${nums[0]} books, the second shelf had ${nums[1]} books and the third shelf had ${nums[2]} books. How many books are on the bookshelf?`,
        `A fruit stand had ${nums[0]} bananas, ${nums[1]} apples and ${nums[2]} peaches. How many pieces of fruit did the stand have altogether?`,
      ]);
      return cell([text(t), space('m'), line()], commas(nums[0] + nums[1] + nums[2]), { steps: nums });
    }
    if (kind === 'add4') {
      const nums = [int(r, 300, 650), int(r, 300, 650), int(r, 300, 650), int(r, 300, 650)];
      return cell([text(`A school collected box tops. The 3rd grade collected ${nums[0]} tops, 4th grade collected ${nums[1]} tops, 5th grade collected ${nums[2]} tops and 2nd grade collected ${nums[3]} tops. How many box tops did they collect in all?`), space('m'), line()], commas(nums.reduce((x, y) => x + y)), { steps: nums });
    }
    if (kind === 'groups') {
      const st = pick(r, GROUP_STORIES); const g = int(r, 2, 7); const k = int(r, 2, Math.min(9, st.max));
      const ask = opt(r, p.ask || 'solution'); const q = groupsAsk(ask, g, k);
      const body = st.verb(A, g, k, st.c);
      const sentence = `${body} How many ${st.t} are there in all?`;
      return cell([text(`${sentence} ${q.q}`), space('m'), line()], q.a, { groups: g, per: k, ask });
    }
    if (kind === 'friends') {
      const k = int(r, 3, 9); const fr = int(r, 3, 8); const obj = pick(r, ['toy cars', 'trading cards', 'bracelets', 'notebooks', 'reward tickets', 'pieces of gum', 'pencils', 'erasers']);
      const ask = opt(r, p.ask || 'equation');
      return cell([text(`${A} and ${nw(fr)} of ${A.p} friends each had ${nw(k)} ${obj}. How many ${obj} did they have altogether? ${ask === 'expression' ? 'Write the expression.' : 'Write the equation.'}`), space('m'), line()], `${fr + 1} × ${k} = ${(fr + 1) * k}`, { people: fr + 1, per: k });
    }
    if (kind === 'twoSets') {
      const rows = int(r, 3, 9); const x = int(r, 3, 7); const y = int(r, 2, 5);
      const t = pick(r, [
        [`A pet store has ${nw(rows)} lizard cages. If each cage has ${nw(x)} brown lizards and ${nw(y)} green lizards in it, how many lizards does the pet store have total?`, rows * (x + y)],
        [`A waiter had ${nw(rows)} tables he was waiting on, with ${nw(x)} women and ${nw(y)} men at each table. How many customers total did the waiter have?`, rows * (x + y)],
        [`The Warren family has ${nw(rows)} fish tanks. If each tank has ${nw(x)} goldfish and ${nw(y)} rainbow fish in it, how many fish does the family have in all?`, rows * (x + y)],
        [`${A} has ${nw(rows)} bird cages. Each cage has ${nw(x)} parrots and ${nw(y)} parakeets in it. How many birds does ${A} have in all?`, rows * (x + y)],
      ]);
      return cell([text(t[0]), space('m'), line()], `${rows} × (${x} + ${y}) = ${t[1]}`, { groups: rows, a: x, b: y });
    }
    if (kind === 'estimate') {
      const a = int(r, 21, 95); let b = int(r, 21, 95);
      if (Math.round(a / 10) * 10 === Math.round(b / 10) * 10) b += 20;
      const ra = Math.round(a / 10) * 10; const rb = Math.round(b / 10) * 10;
      const opts = shuffle(r, [`${ra} × ${rb}`, `${ra + 10} × ${rb}`, `${ra} × ${rb - 10}`, `${ra - 10} × ${rb + 10}`].filter((x, i, arr) => arr.indexOf(x) === i)).slice(0, 3);
      if (!opts.includes(`${ra} × ${rb}`)) opts[0] = `${ra} × ${rb}`;
      const order = shuffle(r, opts);
      const item = pick(r, [['bags', 'cans', `${A}'s school collected cans for recycling. They had ${a} bags with ${b} cans inside each bag.`], ['rows', 'pairs of shoes', `A shoe store has ${a} rows of shoes. Each row holds ${b} pairs of shoes.`], ['stores', 'pieces of luggage', `An airplane has ${a} containers that can hold ${b} pieces of luggage each.`], ['packs', 'crayons', `${A} bought ${a} packs of crayons with ${b} crayons in each pack.`]]);
      return cell([text(`${item[2]} Which expression shows about how many ${item[1]} there are in all?`), { t: 'bullets', rows: order, plain: true }], `${ra} × ${rb}`, { a, b, options: order, correct: `${ra} × ${rb}` });
    }
    if (kind === 'shareLeft') {
      const friends = int(r, 3, 8); const people = friends + 1; const q = int(r, 4, 12); const rem = int(r, 1, people - 1); const total = people * q + rem;
      const obj = pick(r, ['jellybeans', 'stickers', 'grapes', 'marbles', 'pencils']);
      return cell([text(`${A} wants to share ${total} ${obj} with ${nw(friends)} friends. How many will each person get? Will there be any left over?`), space('m'), line()], `${q} each, ${rem} left over`, { total, people, q, rem });
    }
    if (kind === 'share') {
      const people = int(r, 2, 7); const q = int(r, 2, 8); const total = people * q;
      const obj = pick(r, ['toy cars', 'candy bars', 'packs of gum', 'cookies', 'stickers']);
      const frs = people - 1;
      return cell([text(`${A} and ${nw(frs)} of ${A.p} friends had ${total} ${obj}. How many could each person have if they wanted to share the ${obj} equally? Write the equation.`), space('m'), line()], `${total} ÷ ${people} = ${q}`, { total, people, q });
    }
    if (kind === 'cars') {
      const per = int(r, 3, 6); const carsN = int(r, 3, 6); const total = per * (carsN - 1) + int(r, 1, per - 1);
      return cell([text(`The cars used for a field trip can each hold ${nw(per)} people. If ${total} people need to go, how many cars will be needed?`), space('m'), line()], String(Math.ceil(total / per)), { total, per });
    }
    if (kind === 'sets') {
      const a = int(r, 2, 5); const b = int(r, 2, 6); const per = int(r, 3, 6);
      return cell([text(`${A} had ${nw(a)} pages of math homework and ${nw(b)} pages of reading homework. If each page had ${nw(per)} problems on it, how many problems did ${A.s} have to complete in all?`), space('m'), line()], `(${a} + ${b}) × ${per} = ${(a + b) * per}`, { a, b, per });
    }
    // two groups: "A rode the bumper cars ..." expression
    const a = int(r, 3, 9); const b = int(r, 2, 9); const per = int(r, 2, 6);
    return cell([text(`At the fair ${A} rode the Ferris wheel ${nw(a)} times and the bumper cars ${nw(b)} times. If each ride cost ${nw(per)} tickets, how many tickets did ${A.s} use?`), space('m'), line()], `(${a} + ${b}) × ${per} = ${(a + b) * per}`, { a, b, per });
  },
};

module.exports = { skills, clockStr };
