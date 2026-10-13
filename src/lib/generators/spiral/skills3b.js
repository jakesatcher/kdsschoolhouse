'use strict';

// Grade 3 skills, part 2: pictures. Fraction models, number lines with lettered points, partitioned shapes, polygons,
// graphs, area grids, rulers, line plots and "about how much" objects. Cells carry `meta` for the tests.
const C = require('./core');
const S = require('./svg');
const S3 = require('./svg3');
const { f, text, center, line, space, svgBlock, cell, F, int, pick, shuffle } = C;

const commas = (n) => Number(n).toLocaleString('en-US');
const opt = (r, v) => (Array.isArray(v) ? pick(r, v) : v);
const rangeInt = (r, v) => (Array.isArray(v) ? int(r, v[0], v[1]) : v);
const gcd = (a, b) => (b ? gcd(b, a % b) : a);

// ---- fraction models: which denominators each model can draw ----
const SUPPORT = {
  pie: (d) => d >= 2 && d <= 12 && d !== 11 && d !== 7 && d !== 9,
  bar: (d) => d >= 2 && d <= 10,
  grid: (d) => !!S3.GRID_SHAPE[d] && d >= 4,
};
const kindsFor = (d, allowed) => allowed.filter((k) => SUPPORT[k](d));
const fracText = (n, d) => `${n}/${d}`;

// ---- "about how much" objects ----
const VOLUME = [
  { e: '🥄', name: 'spoon', a: '5 milliliters', o: ['5 liters', '500 milliliters', '1 liter'] },
  { e: '☕', name: 'mug', a: '300 milliliters', o: ['3 milliliters', '3 liters', '30 liters'] },
  { e: '🥤', name: 'glass', a: '250 milliliters', o: ['25 milliliters', '2 liters', '25 liters'] },
  { e: '🍼', name: 'baby bottle', a: '240 milliliters', o: ['24 milliliters', '24 liters', '2 liters'] },
  { e: '🪣', name: 'bucket', a: '8 liters', o: ['8 milliliters', '80 milliliters', '800 liters'] },
  { e: '🛁', name: 'bathtub', a: '150 liters', o: ['150 milliliters', '15 milliliters', '15 liters'] },
  { e: '🥫', name: 'soup can', a: '400 milliliters', o: ['4 milliliters', '40 liters', '4 liters'] },
  { e: '🐠', name: 'fish tank', a: '40 liters', o: ['4 milliliters', '400 milliliters', '4,000 liters'] },
  { e: '🧴', name: 'shampoo bottle', a: '400 milliliters', o: ['4 milliliters', '4 liters', '40 liters'] },
  { e: '🫖', name: 'teapot', a: '1 liter', o: ['1 milliliter', '100 liters', '10 milliliters'] },
];
const WEIGHT = [
  { e: '📎', name: 'paper clip', a: '1 gram', o: ['1 kilogram', '100 grams', '10 kilograms'] },
  { e: '🍎', name: 'apple', a: '200 grams', o: ['2 grams', '20 kilograms', '2 kilograms'] },
  { e: '🐕', name: 'dog', a: '15 kilograms', o: ['15 grams', '150 grams', '150 kilograms'] },
  { e: '📚', name: 'textbook', a: '1 kilogram', o: ['1 gram', '10 grams', '50 kilograms'] },
  { e: '✏️', name: 'pencil', a: '5 grams', o: ['5 kilograms', '500 grams', '50 kilograms'] },
  { e: '🍊', name: 'orange', a: '200 grams', o: ['2 grams', '20 kilograms', '220 kilograms'] },
  { e: '🚲', name: 'bike', a: '15 kilograms', o: ['15 grams', '150 grams', '1,500 kilograms'] },
  { e: '🐈', name: 'cat', a: '4 kilograms', o: ['4 grams', '40 grams', '400 kilograms'] },
  { e: '🎒', name: 'backpack', a: '3 kilograms', o: ['3 grams', '30 grams', '300 kilograms'] },
  { e: '✂️', name: 'scissors', a: '100 grams', o: ['10 grams', '8 kilograms', '100 milligrams'] },
  { e: '🍇', name: 'bunch of grapes', a: '500 grams', o: ['5 grams', '5 kilograms', '50 kilograms'] },
  { e: '☂️', name: 'umbrella', a: '300 grams', o: ['3 grams', '13 kilograms', '30 kilograms'] },
];

// ---- graph data sets ----
const GRAPHS = [
  { id: 'cookies', title: 'Favorite Type of Cookie', cats: ['Choc. Chip', 'Sugar', 'Oatmeal', 'Ginger'], step: 1, top: 6, unit: 1, read: (c) => `How many people like ${c} the best?`, more: (a, b) => `How many more people like ${a} than ${b}?` },
  { id: 'colors', title: 'Favorite Color', cats: ['Red', 'Blue', 'Green', 'Yellow'], step: 2, top: 8, unit: 1, read: (c) => `How many people like ${c.toLowerCase()} the best?`, more: (a, b) => `How many more people like ${a.toLowerCase()} than ${b.toLowerCase()}?` },
  { id: 'farm', title: 'Animals on Hackberry Farm', cats: ['Cows', 'Pigs', 'Chickens', 'Goats'], step: 2, top: 18, unit: 1, read: (c) => `How many ${c.toLowerCase()} does Hackberry Farm have?`, more: (a, b) => `How many more ${a.toLowerCase()} than ${b.toLowerCase()} does the farm have?` },
  { id: 'snow', title: 'Snow Cone Sales', cats: ['Grape', 'Cherry', 'Melon', 'Swirl'], step: 2, top: 12, unit: 1, read: (c) => `How many ${c} snow cones were sold?`, more: (a, b) => `How many more ${a} snow cones were sold than ${b}?` },
  { id: 'trees', title: 'Trees in the Park', cats: ['Oak', 'Ash', 'Maple', 'Elm'], step: 5, top: 45, unit: 5, read: (c) => `How many ${c} trees are in the park?`, more: (a, b) => `How many more ${a} trees than ${b} trees are in the park?` },
  { id: 'stores', title: 'Stores in Westview Mall', cats: ['Clothing', 'Shoe', 'Hobby', 'Home'], step: 5, top: 30, unit: 5, read: (c) => `How many ${c.toLowerCase()} stores are in the mall?`, more: (a, b) => `How many more ${a.toLowerCase()} stores than ${b.toLowerCase()} stores are in the mall?` },
  { id: 'games', title: 'Favorite Games of 3rd Graders', cats: ['Checkers', 'Chess', 'Cards', 'Dominoes'], step: 4, top: 36, unit: 2, read: (c) => `How many 3rd graders like ${c}?`, more: (a, b) => `How many more 3rd graders like ${a} than ${b}?` },
  { id: 'pies', title: 'Pie Sales at Fair', cats: ['Apple', 'Cherry', 'Pumpkin', 'Choc.'], step: 25, top: 150, unit: 25, read: (c) => `How many ${c.toLowerCase()} pies were sold?`, more: (a, b) => `How many more ${a.toLowerCase()} pies were sold than ${b.toLowerCase()} pies?` },
  { id: 'tshirt', title: 'T-Shirt Orders', cats: ['Blue', 'Red', 'Green', 'Yellow'], step: 200, top: 1200, unit: 100, read: (c) => `How many ${c.toLowerCase()} t-shirts were ordered?`, more: (a, b) => `How many more ${a.toLowerCase()} than ${b.toLowerCase()} t-shirts were ordered?` },
  { id: 'aquarium', title: 'Animals at Seaview Aquarium', cats: ['Starfish', 'Octopus', 'Jellyfish', 'Seahorse'], step: 10, top: 40, unit: 5, read: (c) => `How many ${c.toLowerCase()} were at Seaview Aquarium?`, more: (a, b) => `How many more ${a.toLowerCase()} than ${b.toLowerCase()} were at the aquarium?` },
  { id: 'veg', title: 'Vegetables Planted', cats: ['Carrot', 'Cucumber', 'Beet', 'Bean'], step: 10, top: 90, unit: 5, horizontal: true, xLabel: 'Number of Plants', read: (c) => `How many ${c.toLowerCase()}s were planted?`, more: (a, b) => `How many more ${a.toLowerCase()}s than ${b.toLowerCase()}s were planted?` },
  { id: 'supply', title: 'School Supply Drive', cats: ['Pencils', 'Glue', 'Scissors', 'Folders'], step: 50, top: 450, unit: 50, read: (c) => `How many ${c.toLowerCase()} were collected?`, more: (a, b) => `How many more ${a.toLowerCase()} than ${b.toLowerCase()} were collected?` },
];
const PICTS = [
  { id: 'subjects', title: 'Favorite Subjects', cats: ['Math', 'Reading', 'Science', 'Social Studies'], per: 1, unit: 'student', kind: 'star', read: (c) => `How many students like ${c} best?`, more: (a, b) => `How many more students like ${a} than ${b}?` },
  { id: 'eyes', title: 'Student Eye Colors', cats: ['Blue', 'Green', 'Brown', 'Hazel'], per: 2, unit: 'students', kind: 'circle', read: (c) => `How many people have ${c.toLowerCase()} eyes? (Remember to pay attention to the key.)`, more: (a, b) => `How many more students have ${a.toLowerCase()} eyes than ${b.toLowerCase()} eyes? (Pay attention to the key.)` },
  { id: 'pets', title: 'Class Pets', cats: ['Dog', 'Cat', 'Fish', 'Bird'], per: 2, unit: 'pets', kind: 'heart', read: (c) => `How many ${c.toLowerCase()}s are in the class? (Pay attention to the key.)`, more: (a, b) => `How many more ${a.toLowerCase()}s than ${b.toLowerCase()}s are in the class?` },
];

const skills = {
  // ---------- fractions ----------
  g3Shaded(r, p = {}) {
    const kind = opt(r, p.kind || 'pick');
    const models = p.models || ['pie', 'bar', 'grid'];
    const dPool = p.d || [3, 4, 6, 8];
    if (kind === 'pick') {
      let d; let n; let tries = 0;
      do { d = pick(r, dPool); n = int(r, 1, d - 1); tries += 1; } while (tries < 50 && kindsFor(d, models).length === 0);
      const target = { n, d };
      const opts = [{ n, d }];
      const tryAdd = (cand) => { if (!SUPPORT.pie(cand.d) && !SUPPORT.bar(cand.d) && !SUPPORT.grid(cand.d)) return; if (cand.n < 1 || cand.n >= cand.d) return; if (cand.n * d === n * cand.d) return; if (opts.some((o) => o.n === cand.n && o.d === cand.d)) return; opts.push(cand); };
      shuffle(r, [{ n: n + 1, d }, { n: n - 1, d }, { n: n + 2, d }, { n: n - 2, d }, { n, d: d + 2 }, { n, d: d - 2 }, { n: d - n, d }, { n, d: d + 3 }, { n: n + 1, d: d + 1 }, { n: n + 1, d: d + 2 }, { n: n + 2, d: d + 2 }]).forEach((c) => { if (opts.length < 4) tryAdd(c); });
      if (opts.length < 4) throw new Error('g3Shaded: not enough options');
      const items = shuffle(r, opts).map((o) => ({ ...o, kind: pick(r, kindsFor(o.d, models).length ? kindsFor(o.d, models) : ['pie']) }));
      const correct = items.findIndex((o) => o.n === n && o.d === d);
      const bonus = p.bonus ? ' *Bonus: Name an equivalent fraction.' : '';
      return cell([text([`Circle the shape that is shaded to represent `, f(n, d), `.${bonus}`]), svgBlock(S3.modelOptions(items), 'Fraction models'), ...(p.bonus ? [line()] : [])], `${S3.LETTERS[correct]} (${fracText(n, d)})`, { target, options: items.map(({ n: a, d: b, kind: k }) => ({ n: a, d: b, kind: k })), correct });
    }
    if (kind === 'write') {
      const d = pick(r, dPool); const n = p.full ? d : int(r, 1, d - 1); const k = pick(r, kindsFor(d, models).length ? kindsFor(d, models) : ['pie']);
      return cell([text('Write a fraction for the following shape.'), svgBlock(S3.fractionModel({ kind: k, n, d }), 'Fraction model'), line()], fracText(n, d), { n, d });
    }
    if (kind === 'equiv') {
      for (let g = 0; g < 100; g++) {
        const d = pick(r, p.d || [2, 3, 4]); const k2 = pick(r, p.mult || [2, 3]); const d2 = d * k2; const n = int(r, 1, d - 1);
        const ks = kindsFor(d, models).filter((k) => SUPPORT[k](d2));
        if (!ks.length) continue;
        const kk = pick(r, ks);
        return cell([text('Shade in the visual fraction to find the equivalent fraction.'), svgBlock(S3.equivModels({ kind: kk, n, d, d2 }), 'Equivalent fraction models', true), center(`${n}/${d} = ____ / ____`)], `${n}/${d} = ${n * k2}/${d2}`, { n, d, d2, k: k2 });
      }
      throw new Error('g3Shaded equiv: no model');
    }
    if (kind === 'twoEquiv') {
      const shape = pick(r, [[4, 1], [6, 1], [8, 1], [9, 1], [9, 2], [12, 1], [12, 2], [16, 1], [16, 2], [16, 3], [10, 1]]);
      const d = shape[0]; const rowsShaded = shape[1]; const [cols, rows] = S3.GRID_SHAPE[d];
      const n = rowsShaded * cols;
      const a = gcd(n, d); const lo = [n / a, d / a];
      return cell([text('Write two equivalent fractions for the following shape.'), svgBlock(S3.fractionModel({ kind: 'grid', n, d }), 'Fraction model'), center('____ / ____   and   ____ / ____')], `${n}/${d} and ${rowsShaded}/${rows}${lo[1] !== rows ? ` (or ${lo[0]}/${lo[1]})` : ''}`, { n, d, cols, rows, rowsShaded });
    }
    // compare
    for (let g = 0; g < 200; g++) {
      const d1 = pick(r, p.d || [2, 3, 4, 6, 8]); const d2 = pick(r, p.d || [2, 3, 4, 6, 8]); const n1 = int(r, 1, d1 - 1); const n2 = int(r, 1, d2 - 1);
      if (d1 === d2 && n1 === n2) continue;
      const k1 = kindsFor(d1, p.models || ['pie', 'bar']); const k2 = kindsFor(d2, p.models || ['pie', 'bar']);
      if (!k1.length || !k2.length) continue;
      const kk = pick(r, k1.filter((k) => k2.includes(k)).length ? k1.filter((k) => k2.includes(k)) : k1);
      const left = { kind: kk, n: n1, d: d1 }; const right = { kind: k2.includes(kk) ? kk : k2[0], n: n2, d: d2 };
      const cmp = n1 * d2 === n2 * d1 ? '=' : n1 * d2 < n2 * d1 ? '<' : '>';
      return cell([text([`Write `, { b: '<, >, or =' }, ` to make the statement true.`]), svgBlock(S3.compareModels(left, right), 'Two fractions', true)], `${fracText(n1, d1)} ${cmp} ${fracText(n2, d2)}`, { a: [n1, d1], b: [n2, d2], cmp });
    }
    throw new Error('g3Shaded compare: none');
  },
  g3FracLetter(r, p = {}) {
    if (p.mode === 'eighths') {
      const n = int(r, 1, 7); const pos = new Set([n]); while (pos.size < 5) pos.add(int(r, 1, 8));
      const sorted = [...pos].sort((a, b) => a - b); const idx = sorted.indexOf(n);
      return cell([text([`Which letter best represents `, f(n, 8), `?`]), svgBlock(S3.letterLine({ den: 8, points: sorted.map((at, i) => ({ at, letter: S3.LETTERS[i] })) }), 'Number line', true), line()], S3.LETTERS[idx], { n, d: 8, letter: S3.LETTERS[idx], positions: sorted });
    }
    for (let g = 0; g < 200; g++) {
      const b = pick(r, p.b || [2, 3, 4]); const a = int(r, p.zero ? 0 : 1, b); // a/b in (0,1]
      const m = pick(r, p.mult || [1, 2, 3, 4, 5, 6]); const n = a * m; const d = b * m;
      if (d > (p.maxD || 20) || n < 1) continue;
      if (a === b && !p.whole) continue;
      const denLine = b === 3 ? 3 : 4; const pos = (a * denLine) / b;
      if (!Number.isInteger(pos)) continue;
      const pts = Array.from({ length: denLine + 1 }, (_, i) => ({ at: i, letter: S3.LETTERS[i] }));
      const hint = m > 1 ? ' (Hint: Think about equivalent fractions.)' : '';
      return cell([text([`Which letter best represents `, f(n, d), `?${hint}`]), svgBlock(S3.letterLine({ den: denLine, points: pts }), 'Number line', true), line()], S3.LETTERS[pos], { n, d, line: denLine, letter: S3.LETTERS[pos] });
    }
    throw new Error('g3FracLetter');
  },
  // ---------- partitioning ----------
  g3Partition(r, p = {}) {
    const kind = opt(r, p.kind || 'split');
    const parts = rangeInt(r, p.parts || [2, 8]);
    if (kind === 'line') return cell([text(`Partition the line into ${parts} equal pieces and label each partition.`), svgBlock(S3.openLine(), 'A line', true), space('s'), line()], `${parts} equal pieces, each ${parts === 2 ? 'one half' : `1/${parts}`} of the line`, { parts });
    if (kind === 'isEqual') {
      const shapeKind = pick(r, p.shapes || ['circle', 'rect']);
      const equal = p.equal === undefined ? r() < 0.5 : p.equal;
      const d = rangeInt(r, p.d || [4, 8]);
      let svg; let cnt = d;
      if (shapeKind === 'grid') { const cols = pick(r, [3, 4]); const rows = pick(r, [2, 3]); cnt = cols * rows; svg = S3.partitioned({ kind: 'grid', d: cnt, equal, cols, rows }); } else svg = S3.partitioned({ kind: shapeKind, d, equal });
      const askN = equal ? cnt : (p.askSame === false ? cnt + 1 : cnt);
      return cell([text(`Is the shape partitioned into ${askN} equal pieces? Explain.`), svgBlock(svg, 'A partitioned shape'), space('s')], equal ? `Yes. All ${cnt} pieces are the same size.` : 'No. The pieces are not all the same size.', { d: askN, cnt, equal, shape: shapeKind });
    }
    // split a shape
    const sk = pick(r, p.shapes || ['circle', 'rect', 'square']);
    return cell([text(`${p.draw ? `Draw ${sk === 'rect' ? 'a rectangle' : sk === 'circle' ? 'a circle' : 'a square'}. ` : ''}Split the ${p.draw ? sk === 'rect' ? 'rectangle' : sk : 'shape'} into ${parts} equal parts and label each part with a fraction.`), ...(p.draw ? [{ t: 'box' }] : [svgBlock(S3.plainShape(sk), `A ${sk}`)])], `${parts} equal parts, each labelled 1/${parts}`, { parts });
  },
  // ---------- polygons ----------
  g3Polygon(r, p = {}) {
    const kind = opt(r, p.kind || 'sides');
    const NAME = S3.POLY_NAME; const n = rangeInt(r, p.n || [5, 8]);
    if (kind === 'sides') return cell([text(`${/^[aeiou]/.test(NAME[n]) ? 'An' : 'A'} ${NAME[n]} is a shape with how many sides?`), line()], String(n), { n, ask: 'sides' });
    if (kind === 'story') {
      const st = pick(r, [[6, 'The swimming pool is shaped like a hexagon. How many sides does the pool have?'], [5, 'The fence around the playground is shaped like a pentagon. How many sides does the fence have?'], [8, 'A stop sign is shaped like an octagon. How many sides does it have?'], [6, 'A honeycomb cell is shaped like a hexagon. How many sides does it have?'], [3, 'A yield sign is shaped like a triangle. How many sides does it have?']]);
      return cell([text(st[1]), line()], String(st[0]), { n: st[0], ask: 'sides' });
    }
    if (kind === 'vertices') return cell([text(`How many vertices (points or corners) does ${/^[aeiou]/.test(NAME[n]) ? 'an' : 'a'} ${NAME[n]} have?`), line()], String(n), { n, ask: 'vertices' });
    if (kind === 'whichShape') return cell([text(`What shape has ${n} sides and ${n} vertices (points or corners)?`), line()], NAME[n], { n, ask: 'name' });
    if (kind === 'draw') {
      const irregular = p.irregular === undefined ? r() < 0.5 : p.irregular; const nn = rangeInt(r, p.n || [3, 8]);
      const hint = irregular ? ' (Remember, an irregular polygon does not have congruent, or equal, sides.)' : ' (Remember, a regular polygon has congruent, or equal, sides.)';
      return cell([text(`Draw ${irregular ? 'an irregular' : 'a regular'} ${NAME[nn]}.${p.hint ? hint : ''}`), { t: 'box' }], irregular ? `A ${NAME[nn]} with ${nn} sides that are not all equal` : `A ${NAME[nn]} with ${nn} equal sides and equal angles`, { n: nn, irregular });
    }
    if (kind === 'name') {
      const nn = rangeInt(r, p.n || [5, 8]); const irregular = !!p.irregular;
      const jit = irregular ? Array.from({ length: nn }, () => [r() * 2 - 1, r() * 2 - 1]) : null;
      return cell([text('Identify the type of shape shown.'), svgBlock(S3.polygon(nn, { jitter: jit }), 'A polygon'), line()], NAME[nn], { n: nn, irregular });
    }
    if (kind === 'isShape') {
      const target = pick(r, p.targets || [4, 8, 5, 6]); const shown = pick(r, [3, 4, 5, 6, 7, 8].filter((x) => x !== target)); const yes = r() < 0.4;
      const nn = yes ? target : shown;
      return cell([text(`Is this shape ${/^[aeiou]/.test(NAME[target]) ? 'an' : 'a'} ${NAME[target]}? How do you know?`), svgBlock(S3.polygon(nn, {}), 'A polygon'), space('s')], yes ? `Yes. It has ${target} sides.` : `No. It has ${nn} sides, and ${NAME[target]}s have ${target}.`, { target, shown: nn, yes });
    }
    if (kind === 'table') {
      const ns = shuffle(r, [3, 4, 5, 6, 7, 8]).slice(0, 4).sort((a, b) => a - b);
      return cell([text('Write the name of each polygon.'), { t: 'table', head: ['Number of sides', 'Polygon'], rows: ns.map((x) => [x, null]) }], ns.map((x) => NAME[x]).join(', '), { ns });
    }
    if (kind === 'quadHow') return cell([text('How do you know if a shape is a quadrilateral?'), space('m')], 'A quadrilateral is a closed shape with exactly 4 sides.', {});
    // circle all of one polygon
    const target = pick(r, p.targets || [4, 5, 6, 7, 8]); const list = shuffle(r, [target, target, ...shuffle(r, [3, 4, 5, 6, 7, 8].filter((x) => x !== target)).slice(0, 3)]);
    const letters = list.map((x, i) => (x === target ? S3.LETTERS[i] : null)).filter(Boolean);
    return cell([text(`Circle all of the ${NAME[target]}s.`), svgBlock(S3.polygonSet(list), 'Polygons', true)], letters.join(' and '), { target, list });
  },
  // ---------- graphs ----------
  g3Graph(r, p = {}) {
    const kind = opt(r, p.kind || 'bar');
    const isPict = kind === 'pict';
    const ds = p.id ? [...GRAPHS, ...PICTS].find((x) => x.id === p.id) : pick(r, isPict ? PICTS : GRAPHS.filter((g) => (p.horizontal === undefined ? true : !!g.horizontal === p.horizontal)));
    const q = opt(r, p.q || ['read', 'more']);
    let vals;
    if (isPict) { vals = shuffle(r, [1, 2, 3, 4, 5, 6, 7]).slice(0, 4); } else {
      const steps = ds.top / ds.unit; const pool = Array.from({ length: steps }, (_, i) => (i + 1) * ds.unit);
      vals = shuffle(r, pool).slice(0, 4);
    }
    const idx = shuffle(r, [0, 1, 2, 3]);
    const i = idx[0]; const j = idx[1];
    let question; let answer;
    if (q === 'read') { question = ds.read(ds.cats[i]); answer = vals[i] * (isPict ? ds.per : 1); } else {
      const [hi, lo] = vals[i] >= vals[j] ? [i, j] : [j, i];
      question = ds.more(ds.cats[hi], ds.cats[lo]); answer = (vals[hi] - vals[lo]) * (isPict ? ds.per : 1);
    }
    const svg = isPict
      ? S3.pictograph({ title: ds.title, rows: ds.cats.map((c, k) => [c, vals[k]]), per: ds.per, unit: ds.unit, kind: ds.kind })
      : S3.barGraph({ title: ds.title, cats: ds.cats, vals, step: ds.step, max: ds.top, xLabel: ds.xLabel || '', horizontal: !!ds.horizontal });
    return cell([text(question), svgBlock(svg, ds.title), line()], String(answer), { id: ds.id, cats: ds.cats, vals, per: isPict ? ds.per : 1, q, i, j });
  },
  g3LinePlot(r, p = {}) {
    const names = ['String', 'Ribbon', 'Leaf', 'Pencil', 'Rope', 'Board', 'Straw', 'Carrot', 'Stick', 'Insect'];
    const title = `${pick(r, names)} Lengths`; const whole = int(r, p.whole ? p.whole[0] : 2, p.whole ? p.whole[1] : 8); const q = pick(r, [1, 2]);
    const unit = whole >= 4 && r() < 0.3 ? 'ft.' : 'in.';
    const lab = (v) => { const w = Math.floor(v / 4); const rem = v % 4; const fr = { 0: '', 1: '¼', 2: '½', 3: '¾' }[rem]; return `${w ? w : ''}${fr} ${unit}`.replace(/^ /, ''); };
    const picks = shuffle(r, [0, 1, 2, 3, 4]).slice(0, 3).sort((a, b) => a - b);
    const counts = picks.map(() => int(r, 1, 6));
    const base = whole * 4 + q;
    const rows = picks.map((k, ix) => [lab(base + k), counts[ix]]);
    const svg = S3.quarterPlot({ whole, q, rows: Math.max(...counts) });
    return cell([text('Use the information in the table to fill in the line plot.'), { t: 'side', left: [{ t: 'table', head: [title, 'Number'], rows }], right: [svgBlock(svg, 'Line plot')] }], rows.map(([l, c]) => `${l}: ${c} X${c > 1 ? "'s" : ''}`).join('; '), { whole, q, picks, counts, base });
  },
  // ---------- area and perimeter ----------
  g3Area(r, p = {}) {
    const kind = opt(r, p.kind || 'grid');
    const l = rangeInt(r, p.l || [3, 9]); let w = rangeInt(r, p.w || [2, 6]);
    if (kind === 'grid') {
      const cols = rangeInt(r, p.cols || [4, 11]); const rows = rangeInt(r, p.rows || [3, 6]);
      const q = p.square ? 'What is the area of the square?' : 'What is the area of the rectangle?';
      const c2 = p.square ? rows : cols;
      return cell([text(q), svgBlock(S3.squareGrid({ cols: c2, rows, cell: c2 > 8 ? 14 : 16 }), 'Grid', c2 > 6), { t: 'line', pre: '', post: 'sq. units' }], String(c2 * rows), { cols: c2, rows });
    }
    if (kind === 'draw') {
      const square = !!p.square; if (square) w = l;
      return cell([text(`Draw square units to show the area of the ${square ? 'square' : 'rectangle'}.`), svgBlock(S.rect({ l, w }), 'Rectangle'), { t: 'line', pre: 'Area =', post: 'sq. units' }], String(l * w), { l, w });
    }
    if (kind === 'model') {
      const A = pick(r, ['The Martins', 'The Reids', 'The Carters', 'The Townsends']); const thing = pick(r, [['sandbox', 'installing a sandbox'], ['raised garden', 'building a raised garden'], ['deck', 'building a deck'], ['patio', 'laying a patio']]);
      return cell([text(`${A} were ${thing[1]} with a length of ${l} feet and a width of ${w} feet. How many square feet total is the ${thing[0]}? Draw a model to solve.`), { t: 'box' }], `${l * w} square feet`, { l, w });
    }
    if (kind === 'perimeter') {
      return cell([text('What is the perimeter of the shape?'), svgBlock(S.rect({ l, w }), 'Rectangle'), { t: 'line', pre: '', post: 'units' }], String(2 * (l + w)), { l, w });
    }
    if (kind === 'both') {
      return cell([text('Draw square units to show the area of the rectangle. What is the perimeter of this rectangle?'), svgBlock(S.rect({ l, w }), 'Rectangle'), { t: 'line', pre: 'Area =', post: 'sq. units' }, { t: 'line', pre: 'Perimeter =', post: 'units' }], `Area ${l * w} sq. units; Perimeter ${2 * (l + w)} units`, { l, w });
    }
    // composite columns
    const n = int(r, 5, 8); const heights = Array.from({ length: n }, () => int(r, 1, 4)); heights[int(r, 0, n - 1)] = 1; heights[int(r, 0, n - 1)] = Math.max(...heights, 3);
    return cell([text('Find the area of each figure. Hint: Rearrange the composition of the figure to make a shape you can work with.'), svgBlock(S3.columnsFigure({ heights }), 'Figure made of squares', true), { t: 'line', pre: '', post: 'sq. units' }], String(heights.reduce((a, b) => a + b, 0)), { heights });
  },
  g3Measure(r) {
    const label = pick(r, ['pencil', 'crayon', 'eraser', 'key', 'paper clip', 'feather', 'marker']);
    const halves = int(r, 2, 12); const delta = (r() < 0.5 ? -1 : 1) * (0.07 + r() * 0.12);
    const len = Math.round((halves / 2 + delta) * 100) / 100;
    const ans = halves % 2 ? `${Math.floor(halves / 2) || ''}½ inch${halves > 2 ? 'es' : ''}` : `${halves / 2} inch${halves > 2 ? 'es' : ''}`;
    return cell([text('Measure the item to the nearest ½ inch.'), note0('(Notice this is not to scale.)'), svgBlock(S3.ruler({ len, label }), 'Ruler', true), line()], ans, { len, halves });
  },
  // ---------- units ----------
  g3Units(r, p = {}) {
    const bank = (p.kind || pick(r, ['volume', 'weight'])) === 'volume' ? VOLUME : WEIGHT;
    const kind = bank === VOLUME ? 'volume' : 'weight';
    const o = pick(r, bank);
    const opts = shuffle(r, [o.a, ...o.o]);
    const q = kind === 'volume' ? `Circle the amount that best represents the volume held by the ${o.name}.` : `About how much does the ${o.name} weigh?`;
    return cell([text(q), svgBlock(S3.objectPic(o.e), o.name), { t: 'bullets', rows: opts, plain: true }], o.a, { kind, object: o.name, options: opts, correct: o.a });
  },
};
function note0(s) { return C.note(s); }

module.exports = { skills, VOLUME, WEIGHT, GRAPHS, PICTS };
