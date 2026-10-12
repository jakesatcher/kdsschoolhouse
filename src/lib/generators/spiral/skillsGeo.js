'use strict';

// Graphic and structured skills: coordinate plane, line plots, volume, polygons, tables, matching, expressions.
const C = require('./core');
const S = require('./svg');
const { f, mx, b, sup, segs, text, center, note, line, space, svgBlock, cell, F, int, pick, shuffle, plain } = C;

const commas = (n) => Number(n).toLocaleString('en-US');
const opt = (r, v) => (Array.isArray(v) ? pick(r, v) : v);

const ICONS = [
  { n: 'tree', e: '🌳' }, { n: 'school', e: '🏫' }, { n: 'house', e: '🏠' }, { n: 'cat', e: '🐱' }, { n: 'lion', e: '🦁' },
  { n: 'frog', e: '🐸' }, { n: 'ladybug', e: '🐞' }, { n: 'flower', e: '🌸' }, { n: 'owl', e: '🦉' }, { n: 'penguin', e: '🐧' },
  { n: 'chick', e: '🐥' }, { n: 'fire truck', e: '🚒' }, { n: 'police officer', e: '👮' }, { n: 'bus', e: '🚌' }, { n: 'circus tent', e: '🎪' },
  { n: 'dog', e: '🐶' }, { n: 'rabbit', e: '🐰' }, { n: 'bear', e: '🐻' }, { n: 'sun', e: '☀️' }, { n: 'star', e: '⭐' },
  { n: 'duck', e: '🦆' }, { n: 'turtle', e: '🐢' }, { n: 'butterfly', e: '🦋' }, { n: 'fish', e: '🐟' }, { n: 'monkey', e: '🐵' },
  { n: 'airplane', e: '✈️' }, { n: 'rocket', e: '🚀' }, { n: 'castle', e: '🏰' }, { n: 'sailboat', e: '⛵' }, { n: 'cactus', e: '🌵' },
];
const pair = (x, y) => `(${x},${y})`;
// distinct lattice points
function points(r, n, xmax, ymax, minDist = 2) {
  const out = [];
  for (let guard = 0; out.length < n && guard < 500; guard++) {
    const p = [int(r, 1, xmax), int(r, 1, ymax)];
    if (out.every((q) => Math.abs(q[0] - p[0]) + Math.abs(q[1] - p[1]) >= minDist)) out.push(p);
  }
  return out;
}
const article = (name) => (/^[aeiou]/i.test(name) ? 'an' : 'a');

const skills = {
  // Which ordered pair represents the location of the tree?
  gridLocate(r, p = {}) {
    const xmax = p.size || 5; const ymax = p.size || 5;
    const [a, bb] = shuffle(r, ICONS).slice(0, 2);
    const [pa, pb] = points(r, 2, xmax, ymax, 3);
    const svg = S.plane({ xmax, ymax, icons: [{ x: pa[0], y: pa[1], e: a.e }, { x: pb[0], y: pb[1], e: bb.e }] });
    return cell([text(`Which ordered pair represents the location of the ${a.n}?`), svgBlock(svg, 'Coordinate grid'), line()], pair(pa[0], pa[1]));
  },
  gridPlotOne(r, p = {}) {
    const xmax = 5; const ymax = 5;
    const pt = [int(r, 1, 5), int(r, 1, 5)];
    return cell([text('Plot the ordered pair on the coordinate plane.'), center(pair(pt[0], pt[1])), svgBlock(S.plane({ xmax, ymax }), 'Coordinate grid')], `point at ${pair(pt[0], pt[1])}: ${pt[0]} right, ${pt[1]} up`);
  },
  // Plot four points a-d; which polygon?
  gridPlotFour(r, p = {}) {
    const w = int(r, 2, 4); const h = int(r, 2, 3); const x1 = int(r, 1, 6 - w - (p.shape ? 2 : 0)); const y1 = int(r, 1, 3);
    let pts; let shapeName;
    if (p.shape === 'parallelogram') { const sk = int(r, 1, 2); pts = [[x1, y1], [x1 + w, y1], [x1 + sk, y1 + h], [x1 + sk + w, y1 + h]]; shapeName = 'parallelogram (a quadrilateral)'; } else if (p.shape === 'trapezoid') { pts = [[x1, y1], [x1 + w + 1, y1], [x1 + 1, y1 + h], [x1 + w, y1 + h]]; shapeName = 'trapezoid (a quadrilateral)'; } else { pts = [[x1, y1], [x1 + w, y1], [x1, y1 + h], [x1 + w, y1 + h]]; shapeName = w === h ? 'square (a quadrilateral)' : 'rectangle (a quadrilateral)'; }
    const xmax = Math.max(6, ...pts.map((q) => q[0])); const ymax = Math.max(6, ...pts.map((q) => q[1]));
    const labels = ['a', 'b', 'c', 'd'];
    const listBlock = { t: 'pointlist', rows: pts.map((q, i) => `point ${labels[i]}: ${pair(q[0], q[1])}`) };
    const blocks = [{ t: 'side', left: [text('Plot the following coordinates on the coordinate plane.'), listBlock, note(p.bonus === 'polygon' ? '*Bonus: What polygon did you create?' : p.bonus === 'quad' ? '*Bonus: What quadrilateral did you create?' : '*Bonus: What shape did you create?')], right: [svgBlock(S.plane({ xmax, ymax, cell: 17 }), 'Coordinate grid')] }];
    return cell(blocks, `${pts.map((q, i) => `${labels[i]} ${pair(q[0], q[1])}`).join(', ')}; shape: ${shapeName}`);
  },
  gridPolyCoords(r, p = {}) {
    const x1 = int(r, 1, 3); const y1 = int(r, 1, 2); const w = int(r, 2, 3); const h = int(r, 2, 4);
    const trap = p.shape === 'trapezoid';
    const poly = trap ? [[x1, y1], [x1 + w + 1, y1], [x1 + w, y1 + h], [x1, y1 + h]] : [[x1, y1], [x1 + w, y1], [x1 + w, y1 + h], [x1, y1 + h]];
    const svg = S.plane({ xmax: 6, ymax: 6, cell: 17, poly });
    return cell([{ t: 'side', left: [text('What are the coordinates of the polygon?'), { t: 'line', pre: '', post: '', multi: 4 }], right: [svgBlock(svg, 'Polygon on a grid')] }], poly.map((q) => pair(q[0], q[1])).join(', '));
  },
  // If the polygon were moved so its bottom left vertex was (x, y), what would its other coordinates be?
  gridMovePoly(r) {
    const x1 = int(r, 1, 2); const y1 = int(r, 1, 2); const w = int(r, 1, 2); const h = int(r, 2, 3);
    const poly = [[x1, y1], [x1 + w, y1], [x1 + w, y1 + h], [x1, y1 + h]];
    const nx = int(r, 2, 3); const ny = int(r, 1, 2);
    const moved = poly.map((q) => [q[0] - x1 + nx, q[1] - y1 + ny]);
    const svg = S.plane({ xmax: 5, ymax: 5, cell: 17, poly });
    return cell([{ t: 'side', left: [text(`If the polygon on the coordinate grid were moved so that its bottom left vertex was coordinate ${pair(nx, ny)}, what would its other coordinates be?`), { t: 'line', pre: '', post: '', multi: 4 }], right: [svgBlock(svg, 'Polygon on a grid')] }], moved.slice(1).map((q) => pair(q[0], q[1])).join(', '));
  },
  gridPath(r, p = {}) {
    const [a, bb] = shuffle(r, ICONS).slice(0, 2);
    let pa; let pb;
    do { [pa, pb] = points(r, 2, 5, 5, 4); } while (pa[0] === pb[0] || pa[1] === pb[1]);
    const svg = S.plane({ xmax: p.size || 6, ymax: p.size || 6, icons: [{ x: pa[0], y: pa[1], e: a.e }, { x: pb[0], y: pb[1], e: bb.e }] });
    const dx = pb[0] - pa[0]; const dy = pb[1] - pa[1];
    const path = `${Math.abs(dx)} unit${Math.abs(dx) === 1 ? '' : 's'} ${dx >= 0 ? 'right' : 'left'} and ${Math.abs(dy)} unit${Math.abs(dy) === 1 ? '' : 's'} ${dy >= 0 ? 'up' : 'down'}`;
    return cell([text(`Explain a possible path from the ${a.n} to the ${bb.n}.`), svgBlock(svg, 'Coordinate grid')], `Sample: ${path}. ${a.n} ${pair(pa[0], pa[1])} to ${bb.n} ${pair(pb[0], pb[1])}.`);
  },
  gridCloser(r) {
    for (let t = 0; t < 100; t++) {
      const [a, b1, b2] = shuffle(r, ICONS).slice(0, 3);
      const [pa, p1, p2] = points(r, 3, 5, 5, 3);
      const d1 = Math.abs(pa[0] - p1[0]) + Math.abs(pa[1] - p1[1]); const d2 = Math.abs(pa[0] - p2[0]) + Math.abs(pa[1] - p2[1]);
      if (d1 === d2) continue;
      const svg = S.plane({ xmax: 6, ymax: 6, icons: [{ x: pa[0], y: pa[1], e: a.e }, { x: p1[0], y: p1[1], e: b1.e }, { x: p2[0], y: p2[1], e: b2.e }] });
      const closer = d1 < d2 ? b1 : b2;
      return cell([text(`Is the ${a.n} closer to the ${b1.n} or the ${b2.n}? Explain.`), svgBlock(svg, 'Coordinate grid')], `The ${closer.n} is closer: ${Math.min(d1, d2)} units away compared with ${Math.max(d1, d2)} (counting units across and up/down).`);
    }
    throw new Error('gridCloser');
  },
  gridGraphFromTable(r, p = {}) {
    // graph the pairs from the table in a previous problem
    return cell([text(`Complete the graph based on the table in number ${p.from || 3}.`), svgBlock(S.plane({ xmax: 6, ymax: 6, cell: 17 }), 'Coordinate grid')], 'Plot each (input, output) pair from the table.');
  },

  // ----- tables -----
  unitTable(r, p = {}) {
    const kind = p.kind || pick(r, ['m-mm', 'g-kg', 'km-m', 'in-ft', 'kg-g', 'cm-m']);
    const spec = {
      'm-mm': { head: ['m', 'mm'], mul: 1000, first: () => int(r, 3, 4) },
      'g-kg': { head: ['g', 'kg'], mul: 1 / 1000, vals: [4000, 3000, 2000, 1000] },
      'km-m': { head: ['km', 'm'], mul: 1000, first: () => 4, desc: true },
      'in-ft': { head: ['inches', 'feet'], mul: 1 / 12, vals: [12, 24, 36, 48] },
      'kg-g': { head: ['kg', 'g'], mul: 1000, first: () => int(r, 2, 4) },
      'cm-m': { head: ['cm', 'm'], mul: 1 / 100, vals: [100, 200, 300, 400] },
    }[kind];
    let vals = spec.vals;
    if (!vals) { const s0 = spec.first(); vals = spec.desc ? [s0, s0 - 1, s0 - 2, s0 - 3] : [s0, s0 + 1, s0 + 2, s0 + 3]; }
    const outv = vals.map((v) => { const x = v * spec.mul; return commas(Math.round(x * 1000) / 1000); });
    const prefill = p.prefill !== false;
    const rows = vals.map((v, i) => [commas(v), i === 0 && prefill ? outv[0] : null]);
    return cell([text('Complete the table.'), { t: 'table', head: spec.head, rows }], rows.map((rw, i) => `${rw[0]} → ${outv[i]}`).join('; '));
  },
  addTable(r, p = {}) {
    const a = p.add ? p.add[0] : opt(r, [4, 5, 10, 20]); const bb = p.add ? p.add[1] : opt(r, [5, 3, 8, 30]);
    const start = p.start || int(r, 7, 80);
    const n = p.rows || 5;
    const rows = Array.from({ length: n }, (_, i) => [String(start + i), i === 0 && p.prefill ? String(start + a) : null, i === 0 && p.prefill ? String(start + bb) : null]);
    return cell([text('Complete the table.'), { t: 'table', head: ['', `Add ${a}`, `Add ${bb}`], rows }], rows.map((rw, i) => `${start + i}: +${a} = ${start + i + a}, +${bb} = ${start + i + bb}`).join('; '));
  },
  matchTime(r, p = {}) {
    const sets = [
      [['1 hour', '60 minutes'], ['2 hours', '120 minutes'], ['1 minute', '60 seconds'], ['2 minutes', '120 seconds']],
      [['1 week', '7 days'], ['1 hour', '60 minutes'], ['1 minute', '60 seconds'], ['1 year', '12 months']],
    ];
    const set = p.set === 'a' ? sets[0] : pick(r, sets);
    const left = set.map((x) => x[0]); const right = shuffle(r, set.map((x) => x[1]));
    return cell([text('Draw lines to match.'), { t: 'match', left, right }], set.map((x) => `${x[0]} = ${x[1]}`).join('; '));
  },
  matchMetric(r) {
    const left = shuffle(r, ['cm', 'km', 'm']);
    const rel = { cm: '10 mm', km: '1,000 m', m: '100 cm' };
    const right = shuffle(r, left.map((x) => rel[x]));
    return cell([text('Draw lines to match.'), { t: 'match', left, right }, note('*Bonus: 1 cm = ______ m')], `cm = 10 mm; km = 1,000 m; m = 100 cm; bonus 1 cm = 0.01 m`);
  },

  // ----- expressions -----
  exprWrite(r, p = {}) {
    const kind = p.kind || pick(r, ['double-add', 'double-sub', 'triple-add-times', 'double-product', 'added-divided', 'tripled-addDiv', 'double-addDiv', 'triple-subDiv']);
    const n = (lo, hi) => int(r, lo, hi);
    let t; let ex; let v;
    switch (kind) {
      case 'double-add': { const a = n(3, 9); const c = n(2, 9); t = `double ${a} and then add ${c}`; ex = `(2 × ${a}) + ${c}`; v = 2 * a + c; break; }
      case 'double-sub': { const a = n(4, 9); const c = n(1, 2 * a - 1); t = `double ${a} and then subtract ${c}`; ex = `(2 × ${a}) − ${c}`; v = 2 * a - c; break; }
      case 'triple-add-times': { const a = n(2, 6); const c = n(2, 5); const d = n(2, 5); t = `triple ${a} and then add ${c} times ${d}`; ex = `(3 × ${a}) + (${c} × ${d})`; v = 3 * a + c * d; break; }
      case 'double-product': { const a = n(2, 9); const c = n(2, 9); t = `double the product of ${a} and ${c}`; ex = `2 × (${a} × ${c})`; v = 2 * a * c; break; }
      case 'added-divided': { const d = n(3, 9); const total = d * n(2, 6); const a = n(5, total - 2); const c = total - a; t = `${a} added to ${c} and then divided by ${d}`; ex = `(${a} + ${c}) ÷ ${d}`; v = total / d; break; }
      case 'tripled-addDiv': { const a = n(8, 20); const d = n(2, 5); const c = d * n(2, 6); t = `triple the number ${a} and then add ${c} divided by ${d}`; ex = `(3 × ${a}) + (${c} ÷ ${d})`; v = 3 * a + c / d; break; }
      case 'double-addDiv': { const a = n(10, 30); const d = pick(r, [3, 9]); const c = d * n(3, 9); t = `double the number ${a} and then add ${c} divided by ${d}`; ex = `(2 × ${a}) + (${c} ÷ ${d})`; v = 2 * a + c / d; break; }
      case 'triple-subDiv': { const a = n(20, 40); const d = pick(r, [3, 6, 9]); const c = d * n(3, 9); t = `triple the number ${a} and then subtract ${c} divided by ${d}`; ex = `(3 × ${a}) − (${c} ÷ ${d})`; v = 3 * a - c / d; break; }
      case 'double-two-sub': { const a = n(4, 9); const bb = n(2, 4); const c = n(2, 3); t = `double ${a}, multiply ${bb} and ${c}, and then subtract the second number from the first number`; ex = `(2 × ${a}) − (${bb} × ${c})`; v = 2 * a - bb * c; if (v < 0) return skills.exprWrite(r, p); break; }
      case 'triple-double': { const a = n(2, 5); t = `double the product of ${a} tripled`; ex = `2 × (3 × ${a})`; v = 6 * a; break; }
      default: throw new Error(kind);
    }
    return cell([text(`Write an expression for the calculation ${t}.`)], `${ex} = ${v}`);
  },
  exprEval(r, p = {}) {
    const kind = p.kind || pick(r, ['paren', 'parenDiv', 'twoParens', 'chain', 'sevenMinus', 'mixed', 'brackets']);
    const n = (lo, hi) => int(r, lo, hi);
    let ex; let v;
    switch (kind) {
      case 'paren': { const d = n(2, 9); const q = n(2, 9); const m = n(2, 9); ex = `(${d * q} ÷ ${d}) × ${m}`; v = q * m; break; }
      case 'parenDiv': { const x = n(2, 9); const y = n(x + 1, 12); const z = n(2, 6); const w = n(z + 1, 10); const num = x + y; const den = w - z; if (num % den) return skills.exprEval(r, p); ex = `(${x} + ${y}) ÷ (${w} − ${z})`; v = num / den; break; }
      case 'twoParens': { const a = n(2, 6); const bb = n(2, 6); const c = n(2, 5); const d = n(2, 5); ex = `(${a} × ${bb}) ÷ (${c} × ${d})`; v = (a * bb) / (c * d); if (!Number.isInteger(v) || v < 2) return skills.exprEval(r, p); break; }
      case 'chain': { const a = n(12, 30); const bb = n(2, 5); const c = n(2, 5); const d = n(1, 2); ex = `${a} − (${bb} + ${c}) − ${d}`; v = a - bb - c - d; break; }
      case 'sevenMinus': { const k = n(2, 9); const q = n(3, 9); const inner = k * q; const bb = n(2, 9); const a = inner + bb; const lead = n(inner / k + 2, 30); ex = `${lead} − (${a} − ${bb}) ÷ ${k}`; v = lead - inner / k; break; }
      case 'mixed': { const a = n(10, 20); const bb = n(5, 12); const c = n(20, 60); const d = n(5, 20); ex = `(${a} × ${bb} + ${c}) − (${c + d + 10} − ${d})`; v = a * bb + c - (c + 10); break; }
      case 'brackets': { const a = n(2, 6); const bb = n(2, 6); const c = n(2, 4); const d = n(2, 6); const e = n(2, 6); const g = n(1, 3); ex = `{[${a} × (${bb} + ${c})] − ${g}} + [${d} × (${e} − ${g})]`; v = a * (bb + c) - g + d * (e - g); break; }
      default: throw new Error(kind);
    }
    return cell([center(`${ex} =`), line()], String(v));
  },
};

module.exports = { skills, ICONS };
