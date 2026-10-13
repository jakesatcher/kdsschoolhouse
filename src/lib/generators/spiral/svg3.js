'use strict';

// Graphics for the grade 3 and grade 4 spiral reviews that the grade 5 sheets did not need: dot arrays and groups,
// clocks, fraction models, number lines with lettered points, partitioned shapes, polygons, picture and bar graphs,
// rulers, area grids and staircase figures. Same rules as svg.js: numbers and our own labels only, presentation
// attributes only (the CSP forbids inline styles).
const { open, text, r1, fracLabel, esc } = require('./svg');

const LETTERS = 'ABCDEFGHIJ';

// ---------- glyphs for arrays and groups ----------
function glyph(kind, cx, cy, s) {
  const r = s * 0.4;
  const poly = (pts) => `<polygon points="${pts.map(([x, y]) => `${r1(cx + x)},${r1(cy + y)}`).join(' ')}" fill="#000"/>`;
  if (kind === 'star') {
    const pts = []; for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + (i * Math.PI) / 5; const rr = i % 2 ? r * 0.45 : r; pts.push([rr * Math.cos(a), rr * Math.sin(a)]); }
    return poly(pts);
  }
  if (kind === 'burst') {
    const pts = []; for (let i = 0; i < 16; i++) { const a = -Math.PI / 2 + (i * Math.PI) / 8; const rr = i % 2 ? r * 0.6 : r; pts.push([rr * Math.cos(a), rr * Math.sin(a)]); }
    return poly(pts);
  }
  if (kind === 'triangle') return poly([[0, -r], [r, r * 0.85], [-r, r * 0.85]]);
  if (kind === 'diamond') return poly([[0, -r], [r, 0], [0, r], [-r, 0]]);
  if (kind === 'square') return `<rect x="${r1(cx - r * 0.85)}" y="${r1(cy - r * 0.85)}" width="${r1(r * 1.7)}" height="${r1(r * 1.7)}" fill="#000"/>`;
  if (kind === 'plus') { const t = r * 0.38; return poly([[-t, -r], [t, -r], [t, -t], [r, -t], [r, t], [t, t], [t, r], [-t, r], [-t, t], [-r, t], [-r, -t], [-t, -t]]); }
  if (kind === 'heart') return `<path d="M${r1(cx)} ${r1(cy + r)} C${r1(cx - r * 1.5)} ${r1(cy)} ${r1(cx - r * 0.7)} ${r1(cy - r * 1.1)} ${r1(cx)} ${r1(cy - r * 0.35)} C${r1(cx + r * 0.7)} ${r1(cy - r * 1.1)} ${r1(cx + r * 1.5)} ${r1(cy)} ${r1(cx)} ${r1(cy + r)} Z" fill="#000"/>`;
  return `<circle cx="${r1(cx)}" cy="${r1(cy)}" r="${r1(r)}" fill="#000"/>`;
}
const GLYPHS = ['star', 'heart', 'circle', 'triangle', 'plus', 'burst', 'diamond', 'square'];

// `total` glyphs laid out `perRow` to a row (the last row may be short)
function glyphField({ total, perRow, kind = 'star', s = 13, label = 'Shapes' }) {
  const rows = Math.ceil(total / perRow);
  const W = perRow * s + 8; const H = rows * s + 8;
  let g = '';
  for (let i = 0; i < total; i++) g += glyph(kind, 4 + (i % perRow) * s + s / 2, 4 + Math.floor(i / perRow) * s + s / 2, s);
  return `${open(W, H, `${total} ${label}`)}${g}</svg>`;
}
// rows x cols array of dots (multiplication arrays)
const dotArray = ({ rows, cols, kind = 'circle', s = 15 }) => glyphField({ total: rows * cols, perRow: cols, kind, s, label: `array with ${rows} rows and ${cols} columns` });

// Sets drawn as ovals holding dots: options = [[groups, perGroup], ...]; each shown with a letter
function setOptions(options, { kind = 'circle' } = {}) {
  const cw = 118; const ch = 62; const cols = 2;
  const W = cols * cw + 8; const rowsN = Math.ceil(options.length / cols); const H = rowsN * (ch + 16) + 6;
  let s = open(W, H, 'Sets of dots');
  options.forEach(([g, k], i) => {
    const ox = 6 + (i % cols) * cw; const oy = 4 + Math.floor(i / cols) * (ch + 16);
    const per = 10; const gw = Math.min(34, (cw - 8) / g);
    for (let a = 0; a < g; a++) {
      const gx = ox + a * gw;
      s += `<ellipse cx="${r1(gx + gw / 2 - 1)}" cy="${oy + ch / 2}" rx="${r1(gw / 2 - 2)}" ry="${ch / 2 - 4}" fill="none" stroke="#000" stroke-width="1.2"/>`;
      const cols2 = k > 6 ? 2 : 1; const dw = Math.min(8, (gw - 6) / cols2); const rowsK = Math.ceil(k / cols2);
      const dh = Math.min(8, (ch - 14) / rowsK);
      for (let d = 0; d < k; d++) s += glyph(kind, gx + gw / 2 - 1 + (cols2 === 1 ? 0 : (d % 2 ? dw / 2 : -dw / 2)), oy + 8 + (Math.floor(d / cols2) + 0.5) * dh + (ch - 14 - rowsK * dh) / 2, per * 0.8);
    }
    s += text(ox + (g * gw) / 2, oy + ch + 12, LETTERS[i], { size: 10, weight: 'bold' });
  });
  return `${s}</svg>`;
}

// ---------- clocks ----------
function clock({ h = 12, m = 0, hands = true, size = 112 }) {
  const c = size / 2; const R = c - 5;
  let s = open(size, size, hands ? `Clock showing ${h}:${String(m).padStart(2, '0')}` : 'Blank clock face');
  s += `<circle cx="${c}" cy="${c}" r="${R}" fill="#fff" stroke="#000" stroke-width="1.8"/>`;
  for (let i = 0; i < 60; i++) {
    const a = (i * Math.PI) / 30; const long = i % 5 === 0; const r0 = R - (long ? 7 : 3);
    s += `<line x1="${r1(c + r0 * Math.sin(a))}" y1="${r1(c - r0 * Math.cos(a))}" x2="${r1(c + (R - 1) * Math.sin(a))}" y2="${r1(c - (R - 1) * Math.cos(a))}" stroke="#000" stroke-width="${long ? 1.2 : 0.6}"/>`;
  }
  for (let i = 1; i <= 12; i++) { const a = (i * Math.PI) / 6; s += text(c + (R - 15) * Math.sin(a), c - (R - 15) * Math.cos(a) + 3.6, i, { size: 10, weight: 'bold' }); }
  if (hands) {
    const hm = ((h % 12) + m / 60) * 30; const mm = m * 6;
    const hand = (deg, len, w) => `<line x1="${c}" y1="${c}" x2="${r1(c + len * Math.sin((deg * Math.PI) / 180))}" y2="${r1(c - len * Math.cos((deg * Math.PI) / 180))}" stroke="#000" stroke-width="${w}" stroke-linecap="round"/>`;
    s += hand(hm, R * 0.5, 3.2) + hand(mm, R * 0.78, 1.8);
  }
  return `${s}<circle cx="${c}" cy="${c}" r="2.4" fill="#000"/></svg>`;
}

// ---------- fraction models ----------
const SHADE = '#b0b0b0';
function pieAt(s, cx, cy, R, n, d) {
  if (d === 1) return `<circle cx="${cx}" cy="${cy}" r="${R}" fill="${n ? SHADE : '#fff'}" stroke="#000" stroke-width="1.4"/>`;
  let o = `<circle cx="${cx}" cy="${cy}" r="${R}" fill="#fff" stroke="#000" stroke-width="1.4"/>`;
  for (let i = 0; i < n; i++) {
    const a0 = -Math.PI / 2 + (i * 2 * Math.PI) / d; const a1 = -Math.PI / 2 + ((i + 1) * 2 * Math.PI) / d;
    o += d === n && n === 1 ? '' : `<path d="M${cx} ${cy} L${r1(cx + R * Math.cos(a0))} ${r1(cy + R * Math.sin(a0))} A${R} ${R} 0 ${a1 - a0 > Math.PI ? 1 : 0} 1 ${r1(cx + R * Math.cos(a1))} ${r1(cy + R * Math.sin(a1))} Z" fill="${SHADE}" stroke="none"/>`;
  }
  for (let i = 0; i < d && d > 1; i++) { const a = -Math.PI / 2 + (i * 2 * Math.PI) / d; o += `<line x1="${cx}" y1="${cy}" x2="${r1(cx + R * Math.cos(a))}" y2="${r1(cy + R * Math.sin(a))}" stroke="#000" stroke-width="1"/>`; }
  void s;
  return o + `<circle cx="${cx}" cy="${cy}" r="${R}" fill="none" stroke="#000" stroke-width="1.4"/>`;
}
function barAt(x, y, w, h, n, d) {
  let o = ''; const cw = w / d;
  for (let i = 0; i < d; i++) o += `<rect x="${r1(x + i * cw)}" y="${y}" width="${r1(cw)}" height="${h}" fill="${i < n ? SHADE : '#fff'}" stroke="#000" stroke-width="1.2"/>`;
  return o;
}
// grid model: cols x rows cells, `n` cells shaded in reading order (rows listed so that d = cols * rows)
function gridAt(x, y, cw, ch, cols, rows, n) {
  let o = '';
  for (let i = 0; i < cols * rows; i++) o += `<rect x="${r1(x + (i % cols) * cw)}" y="${r1(y + Math.floor(i / cols) * ch)}" width="${cw}" height="${ch}" fill="${i < n ? SHADE : '#fff'}" stroke="#000" stroke-width="1.2"/>`;
  return o;
}
// one model: kind 'pie' | 'bar' | 'grid'; grid layouts for the common denominators
const GRID_SHAPE = { 4: [2, 2], 6: [3, 2], 8: [4, 2], 9: [3, 3], 10: [5, 2], 12: [4, 3], 16: [4, 4], 3: [3, 1], 2: [2, 1], 5: [5, 1], 20: [5, 4], 18: [6, 3], 7: [7, 1] };
function modelSize(kind, d) { if (kind === 'pie') return [60, 60]; if (kind === 'bar') return [Math.min(116, 20 * d + 8), 24]; const [c, r] = GRID_SHAPE[d] || [d, 1]; return [c * 22 + 4, r * 22 + 4]; }
function modelAt(kind, x, y, n, d) {
  const [w, h] = modelSize(kind, d);
  if (kind === 'pie') return pieAt(null, x + 30, y + 30, 27, n, d);
  if (kind === 'bar') return barAt(x + 2, y + 2, w - 4, h - 4, n, d);
  const [c, r] = GRID_SHAPE[d] || [d, 1];
  return gridAt(x + 2, y + 2, 22, 22, c, r, n);
}
const fractionModel = ({ kind = 'pie', n, d }) => { const [w, h] = modelSize(kind, d); return `${open(w, h, `Shape divided into ${d} equal parts with ${n} shaded`)}${modelAt(kind, 0, 0, n, d)}</svg>`; };

// Several models labelled A, B, C ... ; items: [{ kind, n, d }]
function modelOptions(items, { cols = 2 } = {}) {
  const cells = items.map((it) => modelSize(it.kind, it.d));
  const cw = Math.max(...cells.map((c) => c[0])) + 14; const chh = Math.max(...cells.map((c) => c[1])) + 18;
  const rowsN = Math.ceil(items.length / cols);
  const W = cols * cw; const H = rowsN * chh + 2;
  let s = open(W, H, 'Fraction models');
  items.forEach((it, i) => {
    const [w, h] = cells[i]; const ox = (i % cols) * cw + (cw - w) / 2; const oy = Math.floor(i / cols) * chh + 2;
    s += modelAt(it.kind, ox, oy, it.n, it.d) + text(ox + w / 2, oy + h + 11, LETTERS[i], { size: 10, weight: 'bold' });
  });
  return `${s}</svg>`;
}
// `shaded model = empty model` with an equals sign between them
function equivModels({ kind, n, d, d2 }) {
  const a = modelSize(kind, d); const b = modelSize(kind, d2);
  const W = a[0] + b[0] + 36; const H = Math.max(a[1], b[1]) + 4;
  return `${open(W, H, `${n}/${d} shown next to a shape cut into ${d2} equal parts`)}${modelAt(kind, 0, (H - a[1]) / 2, n, d)}${text(a[0] + 18, H / 2 + 5, '=', { size: 16 })}${modelAt(kind, a[0] + 36, (H - b[1]) / 2, 0, d2)}</svg>`;
}
// two models with a blank between them (compare with < > =)
function compareModels(left, right) {
  const a = modelSize(left.kind, left.d); const b = modelSize(right.kind, right.d);
  const W = a[0] + b[0] + 50; const H = Math.max(a[1], b[1]) + 4;
  return `${open(W, H, 'Two fraction models to compare')}${modelAt(left.kind, 0, (H - a[1]) / 2, left.n, left.d)}<circle cx="${a[0] + 25}" cy="${H / 2}" r="10" fill="none" stroke="#000" stroke-width="1.2"/>${modelAt(right.kind, a[0] + 50, (H - b[1]) / 2, right.n, right.d)}</svg>`;
}

// ---------- number lines ----------
// A line from 0 to 1 with lettered points. points: [{ at: tickIndex, letter }], den = number of equal steps
function letterLine({ den, points, ticks = den, labelEnds = true }) {
  const W = 250; const H = 62; const x0 = 22; const span = W - 46; const y = 30;
  let s = open(W, H, 'Number line from 0 to 1 with lettered points');
  s += `<line x1="6" x2="${W - 6}" y1="${y}" y2="${y}" stroke="#000" stroke-width="1.4"/><polygon points="6,${y} 12,${y - 3} 12,${y + 3}" fill="#000"/><polygon points="${W - 6},${y} ${W - 12},${y - 3} ${W - 12},${y + 3}" fill="#000"/>`;
  for (let i = 0; i <= ticks; i++) { const x = x0 + (i / ticks) * span; s += `<line x1="${r1(x)}" x2="${r1(x)}" y1="${y - 4}" y2="${y + 4}" stroke="#000" stroke-width="1"/>`; }
  points.forEach(({ at, letter }) => { const x = x0 + (at / den) * span; s += `<circle cx="${r1(x)}" cy="${y}" r="3.2" fill="#000"/>${text(x, y - 10, letter, { size: 10, weight: 'bold' })}`; });
  if (labelEnds) s += text(x0, y + 20, 0, { size: 11 }) + text(x0 + span, y + 20, 1, { size: 11 });
  return `${s}</svg>`;
}
// A plain number line (multiplication jumps): 0..max with a label at every tick
function numberLine({ max = 12, step = 1 }) {
  const n = Math.floor(max / step); const px = Math.min(22, 250 / n); const W = n * px + 36; const H = 44;
  let s = open(W, H, `Number line from 0 to ${max}`);
  s += `<line x1="6" x2="${W - 6}" y1="18" y2="18" stroke="#000" stroke-width="1.3"/><polygon points="6,18 12,15 12,21" fill="#000"/><polygon points="${W - 6},18 ${W - 12},15 ${W - 12},21" fill="#000"/>`;
  for (let i = 0; i <= n; i++) { const x = 18 + i * px; s += `<line x1="${r1(x)}" x2="${r1(x)}" y1="13" y2="23" stroke="#000" stroke-width="1"/>${text(x, 37, i * step, { size: 9 })}`; }
  return `${s}</svg>`;
}
// A segment with three labelled tick marks and a dot for the number being rounded
function roundLine({ lo, mid, hi, n }) {
  const W = 250; const H = 56; const x0 = 22; const span = W - 44; const y = 24;
  let s = open(W, H, `Number line from ${lo} to ${hi}`);
  s += `<line x1="8" x2="${W - 8}" y1="${y}" y2="${y}" stroke="#000" stroke-width="1.4"/>`;
  [[lo, 0], [mid, 0.5], [hi, 1]].forEach(([v, f]) => { const x = x0 + f * span; s += `<line x1="${r1(x)}" x2="${r1(x)}" y1="${y - 5}" y2="${y + 5}" stroke="#000" stroke-width="1.2"/>${text(x, y + 19, v, { size: 11 })}`; });
  const xn = x0 + ((n - lo) / (hi - lo)) * span;
  s += `<circle cx="${r1(xn)}" cy="${y}" r="3.6" fill="#000"/>${text(xn, y - 8, n, { size: 11, weight: 'bold' })}`;
  return `${s}</svg>`;
}
// A line with arrowheads to partition (the student draws the marks)
function openLine({ width = 220 } = {}) {
  const H = 24;
  return `${open(width, H, 'A line')}<line x1="8" x2="${width - 8}" y1="12" y2="12" stroke="#000" stroke-width="1.6"/><polygon points="6,12 14,8 14,16" fill="#000"/><polygon points="${width - 6},12 ${width - 14},8 ${width - 14},16" fill="#000"/></svg>`;
}

// ---------- partitioned shapes ----------
function plainShape(kind, { w = 110, h = 70 } = {}) {
  const W = w + 8; const H = h + 8; const o = open(W, H, `A ${kind}`);
  if (kind === 'circle') return `${open(h + 8, h + 8, 'A circle')}<circle cx="${h / 2 + 4}" cy="${h / 2 + 4}" r="${h / 2}" fill="none" stroke="#000" stroke-width="2"/></svg>`;
  if (kind === 'square') return `${open(h + 8, h + 8, 'A square')}<rect x="4" y="4" width="${h}" height="${h}" fill="none" stroke="#000" stroke-width="2"/></svg>`;
  if (kind === 'triangle') return `${o}<polygon points="${W / 2},4 ${W - 4},${H - 4} 4,${H - 4}" fill="none" stroke="#000" stroke-width="2"/></svg>`;
  if (kind === 'diamond') return `${o}<polygon points="${W / 2},4 ${W - 4},${H / 2} ${W / 2},${H - 4} 4,${H / 2}" fill="none" stroke="#000" stroke-width="2"/></svg>`;
  return `${o}<rect x="4" y="4" width="${w}" height="${h}" fill="none" stroke="#000" stroke-width="2"/></svg>`;
}
// A shape already cut into `d` parts; equal = true gives equal parts, otherwise one cut is moved so the parts are unequal.
// kind: 'circle' | 'rect' | 'grid'
function partitioned({ kind, d, equal, cols, rows }) {
  const sk = '#000';
  if (kind === 'circle') {
    const R = 36; const c = 42; let s = open(2 * c + 4, 2 * c + 4, `A circle cut into ${d} parts`);
    s += `<circle cx="${c + 2}" cy="${c + 2}" r="${R}" fill="none" stroke="${sk}" stroke-width="1.8"/>`;
    const angs = [];
    for (let i = 0; i < d; i++) angs.push(-90 + (i * 360) / d);
    if (!equal) angs[1] += 360 / d / 2.2; // pull one cut off-centre
    angs.forEach((a) => { const rad = (a * Math.PI) / 180; s += `<line x1="${c + 2}" y1="${c + 2}" x2="${r1(c + 2 + R * Math.cos(rad))}" y2="${r1(c + 2 + R * Math.sin(rad))}" stroke="${sk}" stroke-width="1.4"/>`; });
    if (d === 2 && !equal) s = s.replace(/<line[^>]*\/>/g, '') + `<line x1="${c + 2 - R * 0.55}" y1="${c + 2 - R * 0.83}" x2="${c + 2 + R * 0.55}" y2="${c + 2 - R * 0.83}" stroke="${sk}" stroke-width="1.4"/>`;
    return `${s}</svg>`;
  }
  if (kind === 'grid') {
    const cw = 26; const W = cols * cw + 8; const H = rows * cw + 8; let s = open(W, H, `A rectangle cut into ${cols * rows} parts`);
    s += `<rect x="4" y="4" width="${cols * cw}" height="${rows * cw}" fill="none" stroke="${sk}" stroke-width="1.8"/>`;
    for (let i = 1; i < cols; i++) { const x = 4 + i * cw + (!equal && i === 1 ? 10 : 0); s += `<line x1="${x}" x2="${x}" y1="4" y2="${4 + rows * cw}" stroke="${sk}" stroke-width="1.3"/>`; }
    for (let j = 1; j < rows; j++) s += `<line y1="${4 + j * cw}" y2="${4 + j * cw}" x1="4" x2="${4 + cols * cw}" stroke="${sk}" stroke-width="1.3"/>`;
    return `${s}</svg>`;
  }
  const w = 120; const h = 54; let s = open(w + 8, h + 8, `A rectangle cut into ${d} parts`);
  s += `<rect x="4" y="4" width="${w}" height="${h}" fill="none" stroke="${sk}" stroke-width="1.8"/>`;
  for (let i = 1; i < d; i++) { const x = 4 + (i * w) / d + (!equal && i === 1 ? w / d / 1.8 : 0); s += `<line x1="${r1(x)}" x2="${r1(x)}" y1="4" y2="${4 + h}" stroke="${sk}" stroke-width="1.4"/>`; }
  return `${s}</svg>`;
}

// ---------- polygons ----------
const POLY_NAME = { 3: 'triangle', 4: 'quadrilateral', 5: 'pentagon', 6: 'hexagon', 7: 'heptagon', 8: 'octagon' };
// Regular n-gon, or an irregular one (vertices pushed around by `jitter`, an array of [dx, dy] pairs of -1..1)
function polygon(n, { jitter = null, size = 40, label } = {}) {
  const c = size + 6; const pts = [];
  for (let i = 0; i < n; i++) {
    const a = -Math.PI / 2 + (i * 2 * Math.PI) / n + (n === 4 && !jitter ? Math.PI / 4 : 0);
    const j = jitter ? jitter[i % jitter.length] : [0, 0];
    pts.push([c + (size + j[0] * size * 0.34) * Math.cos(a), c + (size + j[1] * size * 0.34) * Math.sin(a)]);
  }
  return `${open(2 * c, 2 * c, label || `A ${jitter ? 'irregular ' : ''}${POLY_NAME[n]}`)}<polygon points="${pts.map((p) => `${r1(p[0])},${r1(p[1])}`).join(' ')}" fill="none" stroke="#000" stroke-width="2"/></svg>`;
}
// A set of regular polygons (circle the ...) numbered 1..k
function polygonSet(list) {
  const cw = 78; const W = list.length * cw; const H = 92;
  let s = open(W, H, 'Polygons');
  list.forEach((n, i) => {
    const ox = i * cw + cw / 2; const oy = 40; const size = 30;
    const pts = [];
    if (n === 'circle') s += `<circle cx="${ox}" cy="${oy}" r="${size - 2}" fill="none" stroke="#000" stroke-width="1.6"/>`;
    else {
      for (let k = 0; k < n; k++) { const a = -Math.PI / 2 + (k * 2 * Math.PI) / n + (n === 4 ? Math.PI / 4 : 0); pts.push([ox + size * Math.cos(a), oy + size * Math.sin(a)]); }
      s += `<polygon points="${pts.map((p) => `${r1(p[0])},${r1(p[1])}`).join(' ')}" fill="none" stroke="#000" stroke-width="1.6"/>`;
    }
    s += text(ox, 88, LETTERS[i], { size: 10, weight: 'bold' });
  });
  return `${s}</svg>`;
}

// ---------- graphs ----------
// Vertical bar graph. cats: [name], vals: [number]; step = gridline spacing
function barGraph({ title, cats, vals, step = 1, max, xLabel = '', yLabel = '', horizontal = false, width = 190 }) {
  const top = max || Math.ceil(Math.max(...vals) / step) * step;
  if (horizontal) {
    const W = width; const H = 22 + cats.length * 18 + 22; const x0 = 54; const pw = W - x0 - 10;
    let s = open(W, H, `Bar graph: ${title}`);
    s += text(W / 2, 11, title, { size: 9.5, weight: 'bold' });
    for (let v = 0; v <= top; v += step) { const x = x0 + (v / top) * pw; s += `<line x1="${r1(x)}" x2="${r1(x)}" y1="16" y2="${16 + cats.length * 18}" stroke="#999" stroke-width="0.7"/>${text(x, 16 + cats.length * 18 + 10, v, { size: 7.5 })}`; }
    cats.forEach((c, i) => { const y = 16 + i * 18; s += `<rect x="${x0}" y="${y + 3}" width="${r1((vals[i] / top) * pw)}" height="12" fill="#666" stroke="#000" stroke-width="0.8"/>${text(x0 - 4, y + 12, c, { size: 8, anchor: 'end' })}`; });
    s += `<rect x="${x0}" y="16" width="${pw}" height="${cats.length * 18}" fill="none" stroke="#000" stroke-width="1"/>${text(W / 2, H - 2, xLabel, { size: 8 })}`;
    return `${s}</svg>`;
  }
  const W = width; const H = 118; const x0 = 28; const y0 = 20; const ph = 70; const pw = W - x0 - 8;
  let s = open(W, H, `Bar graph: ${title}`);
  s += text(W / 2 + 6, 11, title, { size: 9.5, weight: 'bold' });
  for (let v = 0; v <= top; v += step) { const y = y0 + ph - (v / top) * ph; s += `<line x1="${x0}" x2="${x0 + pw}" y1="${r1(y)}" y2="${r1(y)}" stroke="#999" stroke-width="0.7"/>${text(x0 - 3, y + 3, v >= 1000 ? v.toLocaleString('en-US') : v, { size: 7.5, anchor: 'end' })}`; }
  const bw = pw / cats.length;
  cats.forEach((c, i) => { const h = (vals[i] / top) * ph; s += `<rect x="${r1(x0 + i * bw + bw * 0.22)}" y="${r1(y0 + ph - h)}" width="${r1(bw * 0.56)}" height="${r1(h)}" fill="#666" stroke="#000" stroke-width="0.8"/>${text(x0 + i * bw + bw / 2, y0 + ph + 11, c, { size: 7.5 })}`; });
  s += `<rect x="${x0}" y="${y0}" width="${pw}" height="${ph}" fill="none" stroke="#000" stroke-width="1"/>`;
  if (xLabel) s += text(x0 + pw / 2, H - 3, xLabel, { size: 8 });
  if (yLabel) s += `<text x="8" y="${y0 + ph / 2}" font-size="7.5" font-family="Arial,Helvetica,sans-serif" text-anchor="middle" transform="rotate(-90 8 ${y0 + ph / 2})">${esc(yLabel)}</text>`;
  return `${s}</svg>`;
}
// Picture graph: rows [[label, symbols]] where each symbol stands for `per` (key printed under the graph)
function pictograph({ title, rows, per = 1, unit = 'students', kind = 'circle' }) {
  const rh = 20; const x0 = 70; const maxN = Math.max(...rows.map((r) => r[1]));
  const W = x0 + maxN * 17 + 14; const H = 20 + rows.length * rh + 22;
  let s = open(W, H, `Picture graph: ${title}`);
  s += text(W / 2, 11, title, { size: 9.5, weight: 'bold' });
  s += `<rect x="4" y="16" width="${W - 8}" height="${rows.length * rh}" fill="none" stroke="#000" stroke-width="1"/>`;
  rows.forEach(([label, k], i) => {
    const y = 16 + i * rh; if (i) s += `<line x1="4" x2="${W - 4}" y1="${y}" y2="${y}" stroke="#000" stroke-width="0.8"/>`;
    s += text(x0 - 6, y + 13, label, { size: 8.5, anchor: 'end' });
    for (let j = 0; j < k; j++) s += glyph(kind, x0 + 8 + j * 17, y + rh / 2, 15);
  });
  s += glyph(kind, 14, 16 + rows.length * rh + 11, 11) + text(22, 16 + rows.length * rh + 14, `= ${per} ${unit}`, { size: 8.5, anchor: 'start' });
  return `${s}</svg>`;
}

// ---------- rulers ----------
// A ruler marked in halves of an inch from 0 to 7 with an object bar of true length `len` inches above it (not to scale)
function ruler({ len, label = 'object', inch = 30 }) {
  const W = 7 * inch + 30; const H = 66; const x0 = 12; const y = 34;
  let s = open(W, H, `A ${label} above a ruler`);
  const w = len * inch;
  s += `<rect x="${x0}" y="6" width="${r1(w)}" height="14" rx="5" fill="#d9d9d9" stroke="#000" stroke-width="1.5"/>${text(x0 + w / 2, 17, label, { size: 8.5 })}`;
  s += `<rect x="${x0 - 4}" y="${y}" width="${7 * inch + 8}" height="26" fill="#fff" stroke="#000" stroke-width="1.2"/>`;
  for (let i = 0; i <= 14; i++) {
    const x = x0 + (i * inch) / 2; const whole = i % 2 === 0;
    s += `<line x1="${r1(x)}" x2="${r1(x)}" y1="${y}" y2="${y + (whole ? 10 : 6)}" stroke="#000" stroke-width="1"/>`;
    if (whole) s += text(x, y + 21, i / 2, { size: 9, weight: 'bold' });
  }
  return `${s}</svg>`;
}

// ---------- area ----------
// rows x cols grid of unit squares
function squareGrid({ cols, rows, cell = 16 }) {
  const W = cols * cell + 6; const H = rows * cell + 6;
  let s = open(W, H, `Grid of ${cols} by ${rows} unit squares`);
  for (let i = 0; i <= cols; i++) s += `<line x1="${3 + i * cell}" x2="${3 + i * cell}" y1="3" y2="${3 + rows * cell}" stroke="#000" stroke-width="1"/>`;
  for (let j = 0; j <= rows; j++) s += `<line x1="3" x2="${3 + cols * cell}" y1="${3 + j * cell}" y2="${3 + j * cell}" stroke="#000" stroke-width="1"/>`;
  return `${s}</svg>`;
}
// Figure made of columns of unit squares standing on a base line: heights = [3, 1, 2, ...]
function columnsFigure({ heights, cell = 14 }) {
  const W = heights.length * cell + 6; const H = Math.max(...heights) * cell + 6;
  let s = open(W, H, 'A figure made of unit squares');
  heights.forEach((h, i) => { for (let j = 0; j < h; j++) s += `<rect x="${3 + i * cell}" y="${H - 3 - (j + 1) * cell}" width="${cell}" height="${cell}" fill="#fff" stroke="#000" stroke-width="1.2"/>`; });
  return `${s}</svg>`;
}
// A rectangle with one side labelled and the other a letter (perimeter -> unknown side), `lengthSide` on top, `varSide` letter on the right
function rectVar({ top, letter, unit = 'cm' }) {
  const W = 150; const H = 82; let s = open(W, H, `Rectangle with one side ${top} ${unit} and the other side ${letter}`);
  s += `<rect x="30" y="22" width="86" height="38" fill="none" stroke="#000" stroke-width="2"/>${text(73, 15, `${top} ${unit}`, { size: 11 })}${text(124, 45, letter, { size: 12, anchor: 'start', weight: 'bold' })}`;
  return `${s}</svg>`;
}

// A pictured object for "about how much does it weigh / hold": an emoji with an optional oval to circle the answer
function objectPic(emoji, size = 40) {
  return `${open(size + 8, size + 6, 'Picture')}<text x="${(size + 8) / 2}" y="${size - 4}" font-size="${size - 6}" text-anchor="middle" font-family="Apple Color Emoji,Segoe UI Emoji,Noto Color Emoji,sans-serif">${emoji}</text></svg>`;
}


// Empty line plot for measurements in quarter inches: ticks at whole + q/4 ... five ticks, labelled as mixed numbers
function quarterPlot({ whole, q = 1, rows = 5, ticks = 5 }) {
  const px = 31; const W = ticks * px + 24; const plotH = rows * 10 + 8; const axisY = plotH + 8; const H = axisY + 26;
  let s = open(W, H, 'Empty line plot');
  s += `<line x1="6" x2="${W - 6}" y1="${axisY}" y2="${axisY}" stroke="#000" stroke-width="1.4"/><polygon points="4,${axisY} 10,${axisY - 3} 10,${axisY + 3}" fill="#000"/><polygon points="${W - 4},${axisY} ${W - 10},${axisY - 3} ${W - 10},${axisY + 3}" fill="#000"/>`;
  for (let i = 0; i < ticks; i++) {
    const x = 22 + i * px; const tot = (whole - 0) * 4 + (q - 1) + i + 1 - 1 + 0; const v = whole * 4 + q + i;
    void tot;
    const w = Math.floor(v / 4); const rem = v % 4;
    s += `<line x1="${x}" x2="${x}" y1="${axisY - 4}" y2="${axisY + 4}" stroke="#000" stroke-width="1"/>`;
    if (rem === 0) s += text(x, axisY + 17, w, { size: 11 });
    else { const g = rem === 2 ? [1, 2] : [rem, 4]; s += text(x - 7, axisY + 17, w, { size: 11 }) + fracLabel(x + 6, axisY + 13, g[0], g[1], 8); }
  }
  return `${s}</svg>`;
}

module.exports = {
  quarterPlot,
  LETTERS, GLYPHS, glyph, glyphField, dotArray, setOptions, clock, fractionModel, modelOptions, equivModels, compareModels, GRID_SHAPE,
  letterLine, numberLine, roundLine, openLine, plainShape, partitioned, polygon, polygonSet, POLY_NAME, barGraph, pictograph, ruler,
  squareGrid, columnsFigure, rectVar, objectPic, fracLabel,
};
