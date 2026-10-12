'use strict';

// Volume, polygons and line plots.
const C = require('./core');
const S = require('./svg');
const { f, mx, text, center, note, line, svgBlock, cell, F, int, pick, shuffle } = C;

const commas = (n) => Number(n).toLocaleString('en-US');

// A stack of unit cubes: heights[row][col], row 0 in front. Back rows are never taller than the row in front of them,
// so every cube can be counted from the picture.
function cubeHeights(r, kind) {
  if (kind === 'row') return [[...Array(int(r, 4, 8))].map(() => 1)];
  if (kind === 'block') { const w = int(r, 3, 5); const h = int(r, 2, 3); const d = int(r, 2, 3); return Array.from({ length: d }, () => Array(w).fill(h)); }
  if (kind === 'twoRows') { const w = int(r, 3, 6); return [Array(w).fill(1), Array(w).fill(1)]; }
  if (kind === 'wall') { const w = int(r, 3, 6); return [Array.from({ length: w }, () => int(r, 1, 3)), Array.from({ length: w }, () => 1)].map((row, i) => (i ? row.map((v, c) => Math.min(v, 1)) : row)); }
  // stairs / complex
  const w = int(r, 3, 5); const depth = kind === 'complex' ? int(r, 2, 3) : int(r, 1, 2);
  const front = Array.from({ length: w }, () => int(r, 1, kind === 'complex' ? 4 : 3));
  const rows = [front];
  for (let d = 1; d < depth; d++) rows.push(rows[d - 1].map((v) => int(r, 0, v)));
  // every column of the back rows that is non-zero must be adjacent to something visible: keep as is
  return rows;
}
const volumeOf = (h) => h.flat().reduce((a, b) => a + b, 0);

const skills = {
  volumeCount(r, p = {}) {
    const heights = cubeHeights(r, p.kind || pick(r, ['row', 'wall', 'stairs', 'complex', 'block']));
    const v = volumeOf(heights);
    if (v > 42 || v < 3) return skills.volumeCount(r, p);
    const ask = p.fit ? 'How many cubic units would fit into the figure?' : 'Find the volume of the figure by counting the unit cubes.';
    return cell([text(ask), svgBlock(S.cubes(heights, { s: 20 }), 'Unit cubes'), { t: 'line', pre: '', post: p.fit ? '' : 'cubic units' }], `${v} cubic units`);
  },
  cubesTower(r, p = {}) {
    const h = p.h ? int(r, p.h[0], p.h[1]) : int(r, 4, 12); const d = p.d ? int(r, p.d[0], p.d[1]) : int(r, 3, 9);
    const extra = p.extra ? int(r, p.extra[0], p.extra[1]) : 0;
    if (!extra) return cell([text(`How many unit cubes would you need to create a tower that was ${h} units tall and ${d} units deep?`), line()], `${h * d}`);
    return cell([text(`How many unit cubes would you need to create a figure that was ${h} unit cubes tall and ${d} unit cubes deep with ${extra} extra unit cubes in front?`), line()], `${h * d + extra} (${h} × ${d} + ${extra})`);
  },
  volumePrismDims(r, p = {}) {
    const dec = p.dec ? true : false;
    const l = p.l ? int(r, p.l[0], p.l[1]) : int(r, 6, 40);
    const w = p.w ? int(r, p.w[0], p.w[1]) : int(r, 1, 4);
    const h = p.h ? int(r, p.h[0], p.h[1]) : int(r, 2, 5);
    const L = dec ? `${l}.5` : String(l);
    const vol = dec ? ((l * 10 + 5) * w * h) / 10 : l * w * h;
    const unit = p.unit || '';
    const svg = S.prism({ l: L, w, h, unit, layers: p.layers ?? h >= 2 });
    const unitName = { in: 'cubic inches', cm: 'cubic centimeters', m: 'cubic meters', ft: 'cubic feet' }[p.cubic] || '';
    return cell([text(p.wording === 'figure' ? 'Find the volume of the figure.' : 'Find the volume of the rectangular prism.'), svgBlock(svg, 'Rectangular prism'), { t: 'line', pre: '', post: unitName }], `${commas(vol)}${unitName ? ` ${unitName}` : ''}`);
  },
  volumeComposite(r) {
    const unit = pick(r, ['in.', 'm', 'cm']);
    const left = { w: int(r, 3, 8), h: int(r, 2, 6) }; const right = { w: int(r, 4, 10), h: int(r, 3, 7) };
    if (left.h === right.h) right.h += 1;
    const d = int(r, 2, 5);
    const v = (left.w * left.h + right.w * right.h) * d;
    const cubic = { 'in.': 'cubic inches', m: 'cubic meters', cm: 'cubic centimeters' }[unit];
    return cell([text('Find the volume of the figure.'), svgBlock(S.composite({ left, right, d, unit }), 'Two prisms joined', true), { t: 'line', pre: '', post: cubic }], `${commas(v)} ${cubic} (${left.w}×${left.h}×${d} + ${right.w}×${right.h}×${d})`);
  },

  // ----- polygons -----
  shapeClues(r) {
    const sets = [
      { lines: ['The shape has no right angles.', 'None of the sides are congruent.', 'The total of its angles is less than 360°.'], a: 'triangle (a scalene triangle)' },
      { lines: ['The shape has four congruent sides.', 'The opposite angles are congruent.', 'It has no right angles.'], a: 'rhombus' },
      { lines: ['The shape has four right angles.', 'Opposite sides are congruent.', 'The sides are not all congruent.'], a: 'rectangle' },
      { lines: ['The shape has four right angles.', 'All four sides are congruent.'], a: 'square' },
      { lines: ['The shape has two pairs of parallel sides.', 'Opposite sides are congruent.', 'It has no right angles.', 'The sides are not all congruent.'], a: 'parallelogram' },
      { lines: ['The shape has exactly three sides.', 'It has one right angle.'], a: 'right triangle' },
      { lines: ['The shape has five sides.', 'The total of its angles is 540°.'], a: 'pentagon' },
      { lines: ['The shape has six sides.', 'The total of its angles is 720°.'], a: 'hexagon' },
      { lines: ['The shape has three congruent sides.', 'All of its angles are acute.'], a: 'equilateral triangle' },
      { lines: ['The shape has exactly two congruent sides.', 'It has no right angles.', 'It has three sides.'], a: 'isosceles triangle' },
      { lines: ['The shape has four sides.', 'It has exactly one pair of parallel sides.'], a: 'trapezoid' },
      { lines: ['The shape has four congruent sides.', 'It has four right angles.'], a: 'square' },
    ];
    const s = pick(r, sets);
    return cell([text('Which shape is described by the clues below?'), { t: 'bullets', rows: s.lines }, line()], s.a);
  },
  shapeIs(r, p = {}) {
    const qs = [
      { q: 'Is this shape a rectangle? Explain.', shape: 'square', a: 'Yes. A square has 4 right angles and opposite sides that are congruent, so it is a rectangle.' },
      { q: 'Is a rhombus a square? Explain.', a: 'Not always. A rhombus has 4 congruent sides, but a square must also have 4 right angles.' },
      { q: 'Is a rectangle a square? Explain.', a: 'Not always. A rectangle has 4 right angles, but a square must also have 4 congruent sides.' },
      { q: 'Is a square a rhombus? Explain.', a: 'Yes. A square has 4 congruent sides, which is what makes a rhombus.' },
      { q: 'Is this shape a rhombus? Explain.', shape: 'rhombus', a: 'Yes. All 4 sides are congruent.' },
      { q: 'Is every rectangle also a parallelogram? Explain.', a: 'Yes. A rectangle has two pairs of parallel sides, which is what makes a parallelogram.' },
      { q: 'Is this shape a parallelogram? Explain.', shape: 'parallelogram', a: 'Yes. Both pairs of opposite sides are parallel (and congruent).' },
    ];
    const s = p.pick !== undefined ? qs[p.pick] : pick(r, qs);
    const blocks = [text(s.q)];
    if (s.shape) blocks.push(svgBlock(S.shape(s.shape, { marks: true, size: 0.8 }), s.shape));
    return cell(blocks, s.a);
  },
  shapeExplain(r, p = {}) {
    const qs = [
      { q: 'How do you know the following polygon is only a quadrilateral?', shape: 'quadrilateral', a: 'It has 4 sides, but no pairs of parallel sides and no equal sides, so it is not a special quadrilateral.' },
      { q: 'How do you know the following shape is a quadrilateral and a parallelogram? Explain.', shape: 'parallelogram', marks: true, a: 'It has 4 sides, and both pairs of opposite sides are parallel and congruent.' },
      { q: 'How do you know that a circle is not a polygon?', a: 'A polygon is made of straight sides. A circle has no straight sides.' },
      { q: 'How do you know the following figure is a quadrilateral and a trapezoid?', shape: 'trapezoid', a: 'It has 4 sides and at least one pair of parallel sides.' },
      { q: 'How do you know that a square is also a rhombus?', a: 'A rhombus has 4 congruent sides, and every square has 4 congruent sides.' },
      { q: 'How do you know that a pentagon is a polygon but not a quadrilateral?', a: 'A pentagon is made of straight sides, but it has 5 sides, and a quadrilateral has exactly 4.' },
      { q: 'How do you know the following shape is not a parallelogram?', shape: 'trapezoid', a: 'It has only one pair of parallel sides; a parallelogram needs two pairs.' },
    ];
    const s = p.pick !== undefined ? qs[p.pick] : pick(r, qs);
    const blocks = [text(s.q)];
    if (s.shape) blocks.push(svgBlock(S.shape(s.shape, { marks: !!s.marks, size: 0.85 }), s.shape));
    return cell(blocks, s.a);
  },
  polygonNames(r) {
    const spec = {
      square: { valid: ['square', 'rhombus', 'rectangle', 'parallelogram', 'quadrilateral'], bad: ['triangle', 'pentagon'] },
      rectangle: { valid: ['rectangle', 'parallelogram', 'quadrilateral'], bad: ['triangle'] },
      rhombus: { valid: ['rhombus', 'parallelogram', 'quadrilateral'], bad: ['triangle'] },
      parallelogram: { valid: ['parallelogram', 'quadrilateral'], bad: ['hexagon'] },
    };
    const kind = pick(r, Object.keys(spec));
    const sp = spec[kind]; const bad = pick(r, sp.bad);
    const names = shuffle(r, [...sp.valid, bad]);
    return cell([{ t: 'side', left: [text('Circle the name that does not identify the polygon.'), svgBlock(S.shape(kind, { marks: kind === 'square' || kind === 'rhombus', size: 0.42 }), kind)], right: [{ t: 'bullets', rows: names, plain: true }] }], bad);
  },
  shapeIdentify(r) {
    const kinds = [
      { s: 'square', yes: ['quadrilateral', 'trapezoid', 'parallelogram', 'rhombus', 'rectangle', 'square'] },
      { s: 'rectangle', yes: ['quadrilateral', 'trapezoid', 'parallelogram', 'rectangle'] },
      { s: 'rhombus', yes: ['quadrilateral', 'trapezoid', 'parallelogram', 'rhombus'] },
      { s: 'parallelogram', yes: ['quadrilateral', 'trapezoid', 'parallelogram'] },
      { s: 'trapezoid', yes: ['quadrilateral', 'trapezoid'] },
    ];
    const k = pick(r, kinds);
    const all = ['quadrilateral', 'trapezoid', 'parallelogram', 'rhombus', 'rectangle', 'square'];
    return cell([{ t: 'side', left: [text('Determine if the shape shown is a quadrilateral, trapezoid, parallelogram, rhombus, rectangle, or square. Write yes or no.'), svgBlock(S.shape(k.s, { marks: true, size: 0.55 }), k.s)], right: [{ t: 'bullets', rows: all, blank: true }] }],
      all.map((n) => `${n}: ${k.yes.includes(n) ? 'yes' : 'no'}`).join('; ') + ' (a trapezoid has at least one pair of parallel sides)');
  },

  // ----- line plots -----
  linePlot(r, p = {}) {
    const sets = {
      int: [
        { title: 'Songs Downloaded Last Month', min: 0, max: 8, den: 1, total: 'How many total songs were downloaded last month?', big: 'What is the difference between the most and fewest songs downloaded?' },
        { title: 'Glasses of Water Per Student', min: 0, max: 8, den: 1, total: 'How many total glasses of water?', big: 'What is the difference between the most and fewest glasses of water?' },
        { title: 'Pages Read Each Night', min: 0, max: 8, den: 1, total: 'How many total pages were read?', big: 'What is the difference between the most and fewest pages read?' },
        { title: 'Goals Scored This Season', min: 0, max: 8, den: 1, total: 'How many total goals were scored?', big: 'What is the difference between the most and fewest goals scored?' },
        { title: 'Books Checked Out Per Student', min: 0, max: 8, den: 1, total: 'How many total books were checked out?', big: 'What is the difference between the most and fewest books checked out?' },
      ],
      half: [
        { title: 'Miles Run', min: 5, max: 9, den: 2, total: 'How many total miles were run?', big: 'What is the difference between the most and fewest miles run?' },
        { title: 'Hours Spent Reading Last Week', min: 5, max: 9, den: 2, total: 'How many total hours were spent reading?', big: 'What is the difference between the greatest and smallest amount read?' },
        { title: 'Length of Books in Inches', min: 5, max: 9, den: 2, total: 'What is the total length of all the books?', big: 'What is the difference between the longest and shortest book?' },
        { title: 'Length of Ribbon in Inches', min: 1, max: 5, den: 2, total: 'What is the total length of all the ribbons?', big: 'What is the difference between the largest and smallest ribbon?' },
        { title: 'Cups of Dog Food Served', min: 5, max: 9, den: 2, total: 'What is the total amount of dog food served (cups)?', big: 'What is the difference between the most and least dog food served?' },
        { title: 'Pounds of Apples Picked', min: 5, max: 9, den: 2, total: 'How many total pounds of apples were picked?', big: 'What is the difference between the most and fewest pounds picked?' },
        { title: 'Height of Sunflowers in Feet', min: 5, max: 9, den: 2, total: 'What is the total height of all the sunflowers?', big: 'What is the difference between the tallest and shortest sunflower?' },
      ],
      quarter: [
        { title: 'Boxes of Cereal in Pounds', min: 0, max: 1, den: 4, total: 'What is the total weight of the cereal in pounds?', big: 'What is the difference between the largest and smallest amount of cereal?' },
        { title: 'Bags of Flour in Pounds', min: 0, max: 1, den: 4, total: 'What is the total weight of the flour in pounds?', big: 'What is the difference between the heaviest and lightest bag?' },
        { title: 'Jars of Paint in Gallons', min: 0, max: 1, den: 4, total: 'How many total gallons of paint are there?', big: 'What is the difference between the fullest and emptiest jar?' },
      ],
      eighth: [
        { title: 'Length of Leaves (inches)', min: 0, max: 1, den: 8, keepDen: true, total: 'What is the total length of all the leaves?', big: 'What is the difference between the longest and shortest leaf?', less: 'How many leaves were shorter than' },
        { title: 'Length of Insects (inches)', min: 0, max: 1, den: 8, keepDen: true, total: 'What is the total length of all the insects?', big: 'What is the difference between the longest and shortest insect?', less: 'How many insects were shorter than' },
        { title: 'Length of Pencils (feet)', min: 0, max: 1, den: 8, keepDen: true, total: 'What is the total length of all the pencils?', big: 'What is the difference between the longest and shortest pencil?', less: 'How many pencils were shorter than' },
      ],
    };
    const q0 = p.question || 'total';
    const axis = q0 === 'less' ? 'eighth' : (p.axis || 'half');
    const d = pick(r, sets[axis]);
    const ticks = (d.max - d.min) * d.den + 1;
    const counts = {};
    const used = shuffle(r, Array.from({ length: ticks }, (_, i) => i)).slice(0, Math.max(3, Math.min(ticks - 1, int(r, 4, 7))));
    used.forEach((t) => { counts[t] = int(r, 1, 4); });
    const q = p.question || 'total';
    const unitsOf = (t) => d.min * d.den + t;
    const svg = S.linePlot({ min: d.min, max: d.max, den: d.den, counts, title: d.title, keepDen: !!d.keepDen });
    let ask; let answer;
    if (q === 'total') {
      const sum = Object.entries(counts).reduce((a, [t, c]) => a + c * unitsOf(Number(t)), 0);
      answer = F.show(F.frac(sum, d.den)); ask = d.total;
    } else if (q === 'diff') {
      const ts = Object.keys(counts).map(Number);
      const dd = Math.max(...ts) - Math.min(...ts);
      answer = F.show(F.frac(dd, d.den)); ask = d.big;
    } else {
      const cut = d.den / 2; // shorter than 1/2
      const n = Object.entries(counts).filter(([t]) => Number(t) < cut).reduce((a, [, c]) => a + c, 0);
      answer = String(n); ask = null;
      return cell([text('Use the line plot below to answer the question.'), svgBlock(svg, d.title, true), text(`${d.less} `, f(1, 2), ' ?'), line()], answer);
    }
    return cell([text('Use the line plot below to answer the question.'), svgBlock(svg, d.title, true), text(ask), line()], answer);
  },
};

module.exports = { skills };
