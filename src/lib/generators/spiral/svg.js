'use strict';

// Inline SVG graphics for the Spiral Review sheets. Everything is built from numbers and our own label text
// (escaped), never from user input. No style attributes (the CSP forbids inline styles): presentation attributes only.
const F = require('../fractions');

const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const r1 = (n) => Math.round(n * 10) / 10;
const EMOJI_FONT = 'Apple Color Emoji,Segoe UI Emoji,Noto Color Emoji,sans-serif';
const open = (w, h, label, cls = 'sv') => `<svg class="${cls}" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${r1(w)} ${r1(h)}" width="${r1(w)}" height="${r1(h)}" role="img" aria-label="${esc(label)}">`;
const text = (x, y, s, { size = 10, anchor = 'middle', weight = 'normal', fill = '#000' } = {}) =>
  `<text x="${r1(x)}" y="${r1(y)}" font-size="${size}" font-family="Arial,Helvetica,sans-serif" text-anchor="${anchor}" font-weight="${weight}" fill="${fill}">${esc(s)}</text>`;

// A small stacked fraction at (x, y) = vertical middle of the numerator/denominator pair
function fracLabel(x, y, n, d, size = 8) {
  const w = Math.max(String(n).length, String(d).length) * size * 0.62 + 2;
  return text(x, y - 1.5, n, { size }) + `<line x1="${r1(x - w / 2)}" x2="${r1(x + w / 2)}" y1="${r1(y)}" y2="${r1(y)}" stroke="#000" stroke-width="0.8"/>` + text(x, y + size, d, { size });
}
// A value (in units of 1/den) as a tick label: whole, fraction or mixed number; `keepDen` leaves fractions unreduced (e.g. 2/8)
function numberLabel(x, y, units, den, keepDen = false) {
  const whole = Math.floor(units / den);
  const rem = units - whole * den;
  if (rem === 0) return text(x, y + 4, whole, { size: 9 });
  let n = rem; let d = den;
  if (!keepDen) { const v = F.frac(rem, den); n = v.n; d = v.d; }
  if (!whole) return fracLabel(x, y, n, d);
  return text(x - 6, y + 4, whole, { size: 9 }) + fracLabel(x + 5, y, n, d);
}

// ---------- coordinate plane ----------
// icons: [{x, y, e}] emoji centred on the lattice point; dots: [{x, y, label}]; poly: [[x,y],...] outlined polygon
function plane({ xmax = 5, ymax = 5, cell = 20, icons = [], dots = [], poly = null, label = 'Coordinate plane' }) {
  const ml = 20; const mb = 18; const mt = 10; const mr = 16;
  const W = ml + xmax * cell + mr; const H = mt + ymax * cell + mb;
  const ox = ml; const oy = mt + ymax * cell;
  const px = (x) => ox + x * cell; const py = (y) => oy - y * cell;
  let s = open(W, H, label);
  for (let i = 0; i <= xmax; i++) s += `<line x1="${px(i)}" x2="${px(i)}" y1="${py(0)}" y2="${py(ymax)}" stroke="#555" stroke-width="0.8"/>`;
  for (let j = 0; j <= ymax; j++) s += `<line x1="${px(0)}" x2="${px(xmax)}" y1="${py(j)}" y2="${py(j)}" stroke="#555" stroke-width="0.8"/>`;
  s += `<line x1="${px(0)}" x2="${px(xmax) + 10}" y1="${py(0)}" y2="${py(0)}" stroke="#000" stroke-width="1.6"/><polygon points="${px(xmax) + 12},${py(0)} ${px(xmax) + 6},${py(0) - 3} ${px(xmax) + 6},${py(0) + 3}" fill="#000"/>`;
  s += `<line x1="${px(0)}" x2="${px(0)}" y1="${py(0)}" y2="${py(ymax) - 10}" stroke="#000" stroke-width="1.6"/><polygon points="${px(0)},${py(ymax) - 12} ${px(0) - 3},${py(ymax) - 6} ${px(0) + 3},${py(ymax) - 6}" fill="#000"/>`;
  for (let i = 0; i <= xmax; i++) s += text(px(i), py(0) + 13, i, { size: 9 });
  for (let j = 1; j <= ymax; j++) s += text(px(0) - 6, py(j) + 3, j, { size: 9, anchor: 'end' });
  if (poly) {
    s += `<polygon points="${poly.map(([x, y]) => `${px(x)},${py(y)}`).join(' ')}" fill="none" stroke="#000" stroke-width="2"/>`;
    poly.forEach(([x, y]) => { s += `<circle cx="${px(x)}" cy="${py(y)}" r="3.2" fill="#000"/>`; });
  }
  dots.forEach((d) => {
    s += `<circle cx="${px(d.x)}" cy="${py(d.y)}" r="3.4" fill="#000"/>`;
    if (d.label) s += text(px(d.x) + 7, py(d.y) - 5, d.label, { size: 10, weight: 'bold' });
  });
  icons.forEach((ic) => { s += `<text x="${px(ic.x)}" y="${py(ic.y) + cell * 0.28}" font-size="${r1(cell * 0.78)}" font-family="${EMOJI_FONT}" text-anchor="middle">${ic.e}</text>`; });
  return `${s}</svg>`;
}

// ---------- line plot ----------
// counts: { unitsFromMin: count } keyed by tick index (0 = first tick). Ticks are every 1/den from min to max.
function linePlot({ min = 0, max = 8, den = 1, counts = {}, title = '', keepDen = false, width = 272 }) {
  const ticks = (max - min) * den;
  const maxCount = Math.max(1, ...Object.values(counts));
  const px = Math.min(34, (width - 50) / ticks);
  const W = 30 + ticks * px + 30;
  const top = title ? 22 : 8;
  const plotH = 10 + maxCount * 9.5 + 4;
  const axisY = top + plotH;
  const H = axisY + 24;
  let s = open(W, H, `Line plot${title ? `: ${title}` : ''}`);
  s += `<rect x="6" y="${top - 4}" width="${r1(W - 12)}" height="${r1(plotH + 4)}" fill="none" stroke="#000" stroke-width="1"/>`;
  if (title) s += text(W / 2, 12, title, { size: 10, weight: 'bold' });
  s += `<line x1="12" x2="${r1(W - 12)}" y1="${axisY}" y2="${axisY}" stroke="#000" stroke-width="1.4"/>`;
  s += `<polygon points="10,${axisY} 16,${axisY - 3} 16,${axisY + 3}" fill="#000"/><polygon points="${r1(W - 10)},${axisY} ${r1(W - 16)},${axisY - 3} ${r1(W - 16)},${axisY + 3}" fill="#000"/>`;
  for (let i = 0; i <= ticks; i++) {
    const x = 30 + i * px;
    s += `<line x1="${r1(x)}" x2="${r1(x)}" y1="${axisY - 3}" y2="${axisY + 3}" stroke="#000" stroke-width="1"/>`;
    s += numberLabel(x, axisY + 11, min * den + i, den, keepDen);
    const c = counts[i] || 0;
    for (let k = 0; k < c; k++) {
      const cy = axisY - 8 - k * 9.5;
      s += `<path d="M${r1(x - 4)} ${cy - 4} L${r1(x + 4)} ${cy + 4} M${r1(x - 4)} ${cy + 4} L${r1(x + 4)} ${cy - 4}" stroke="#000" stroke-width="1.5" fill="none"/>`;
    }
  }
  return `${s}</svg>`;
}

// ---------- unit cubes (oblique view) ----------
// heights[row][col]: row 0 is the front row; columns run left to right
function cubes(heights, { s = 24 } = {}) {
  const depth = heights.length;
  const cols = Math.max(...heights.map((r) => r.length));
  const maxH = Math.max(...heights.flat());
  const dx = s * 0.5; const dy = s * 0.45;
  const W = cols * s + depth * dx + 6; const H = maxH * s + depth * dy + 6;
  let out = open(W, H, 'Figure made of unit cubes');
  for (let r = depth - 1; r >= 0; r--) {
    for (let c = 0; c < cols; c++) {
      const h = heights[r][c] || 0;
      for (let z = 0; z < h; z++) {
        const x = 3 + c * s + r * dx;
        const yb = H - 3 - (z * s + r * dy);
        const yt = yb - s;
        out += `<polygon points="${r1(x)},${r1(yt)} ${r1(x + dx)},${r1(yt - dy)} ${r1(x + s + dx)},${r1(yt - dy)} ${r1(x + s)},${r1(yt)}" fill="#eee" stroke="#000" stroke-width="1"/>`;
        out += `<rect x="${r1(x)}" y="${r1(yt)}" width="${s}" height="${s}" fill="#fff" stroke="#000" stroke-width="1"/>`;
        out += `<polygon points="${r1(x + s)},${r1(yt)} ${r1(x + s + dx)},${r1(yt - dy)} ${r1(x + s + dx)},${r1(yt - dy + s)} ${r1(x + s)},${r1(yt + s)}" fill="#cfcfcf" stroke="#000" stroke-width="1"/>`;
      }
    }
  }
  return `${out}</svg>`;
}

// ---------- rectangular prism with labelled edges ----------
// dims: { l, w, h } printed on the figure; layers draws a line halfway up (two layers of cubes)
function prism({ l, w, h, unit = '', layers = false, width = 200 }) {
  const fw = 108; const fh = 44; const dx = 22; const dy = 14;
  const W = fw + dx + 52; const H = fh + dy + 34;
  const x0 = 34; const y0 = H - 10; // bottom-left of the front face
  let s = open(W, H, `Rectangular prism ${l} by ${w} by ${h}`);
  s += `<polygon points="${x0},${y0 - fh} ${x0 + dx},${y0 - fh - dy} ${x0 + fw + dx},${y0 - fh - dy} ${x0 + fw},${y0 - fh}" fill="#f2f2f2" stroke="#000" stroke-width="1.4"/>`;
  s += `<rect x="${x0}" y="${y0 - fh}" width="${fw}" height="${fh}" fill="#fff" stroke="#000" stroke-width="1.4"/>`;
  s += `<polygon points="${x0 + fw},${y0 - fh} ${x0 + fw + dx},${y0 - fh - dy} ${x0 + fw + dx},${y0 - dy} ${x0 + fw},${y0}" fill="#d6d6d6" stroke="#000" stroke-width="1.4"/>`;
  if (layers) {
    s += `<line x1="${x0}" x2="${x0 + fw}" y1="${y0 - fh / 2}" y2="${y0 - fh / 2}" stroke="#000" stroke-width="1.2"/>`;
    s += `<line x1="${x0 + fw}" x2="${x0 + fw + dx}" y1="${y0 - fh / 2}" y2="${y0 - fh / 2 - dy}" stroke="#000" stroke-width="1.2"/>`;
  }
  const u = unit ? ` ${unit}` : '';
  s += text(x0 + fw / 2 + dx / 2, y0 - fh - dy - 4, `${l}${u}`, { size: 10 });
  s += text(x0 - 5, y0 - fh / 2 + 4, `${h}${u}`, { size: 10, anchor: 'end' });
  s += text(x0 + 4, y0 - fh - dy / 2 + 2, `${w}${u}`, { size: 10, anchor: 'end' });
  return `${s}</svg>`;
}

// ---------- two prisms side by side (an L-shaped figure) ----------
// left: { w, h }, right: { w, h }, depth d; labels are the real measurements
function composite({ left, right, d, unit = '' }) {
  const k = 11; // px per unit height/width scale (not to scale, just proportional)
  const lw = Math.max(46, left.w * 14); const rw = Math.max(46, right.w * 14);
  const lh = Math.max(30, left.h * k + 10); const rh = Math.max(30, right.h * k + 10);
  const dx = 22; const dy = 15;
  const maxH = Math.max(lh, rh);
  const W = lw + rw + dx + 70; const H = maxH + dy + 40;
  const x0 = 40; const y0 = H - 16;
  const u = unit ? ` ${unit}` : '';
  let s = open(W, H, 'Figure made of two rectangular prisms');
  const block = (x, w, h) => {
    let t = `<polygon points="${r1(x)},${r1(y0 - h)} ${r1(x + dx)},${r1(y0 - h - dy)} ${r1(x + w + dx)},${r1(y0 - h - dy)} ${r1(x + w)},${r1(y0 - h)}" fill="#f2f2f2" stroke="#000" stroke-width="1.4"/>`;
    t += `<polygon points="${r1(x + w)},${r1(y0 - h)} ${r1(x + w + dx)},${r1(y0 - h - dy)} ${r1(x + w + dx)},${r1(y0 - dy)} ${r1(x + w)},${r1(y0)}" fill="#d6d6d6" stroke="#000" stroke-width="1.4"/>`;
    t += `<rect x="${r1(x)}" y="${r1(y0 - h)}" width="${r1(w)}" height="${r1(h)}" fill="#fff" stroke="#000" stroke-width="1.4"/>`;
    return t;
  };
  s += block(x0, lw, lh) + block(x0 + lw, rw, rh);
  s += text(x0 + lw / 2, y0 + 12, `${left.w}${u}`, { size: 10 });
  s += text(x0 + lw + rw / 2, y0 + 12, `${right.w}${u}`, { size: 10 });
  s += text(x0 - 5, y0 - lh / 2 + 4, `${left.h}${u}`, { size: 10, anchor: 'end' });
  s += text(x0 + lw + rw + dx + 5, y0 - rh / 2 - dy / 2 + 4, `${right.h}${u}`, { size: 10, anchor: 'start' });
  s += text(x0 + lw + rw + dx + 5, y0 - 2, `${d}${u}`, { size: 10, anchor: 'start' });
  return `${s}</svg>`;
}

// ---------- shapes ----------
const SHAPES = {
  square: { pts: [[10, 10], [70, 10], [70, 70], [10, 70]], rights: [0, 1, 2, 3], ticks: [[0, 1], [1, 2], [2, 3], [3, 0]] },
  rectangle: { pts: [[6, 14], [90, 14], [90, 62], [6, 62]], rights: [0, 1, 2, 3], ticks: [[0, 1, 1], [1, 2, 2], [2, 3, 1], [3, 0, 2]] },
  rhombus: { pts: [[40, 6], [78, 40], [40, 74], [2, 40]], rights: [], ticks: [[0, 1], [1, 2], [2, 3], [3, 0]] },
  parallelogram: { pts: [[22, 14], [92, 14], [70, 66], [0, 66]], rights: [], ticks: [[0, 1, 1], [1, 2, 2], [2, 3, 1], [3, 0, 2]] },
  trapezoid: { pts: [[24, 14], [70, 14], [94, 66], [0, 66]], rights: [], ticks: [] },
  quadrilateral: { pts: [[14, 10], [84, 22], [72, 68], [2, 52]], rights: [], ticks: [] },
  triangle: { pts: [[44, 8], [90, 68], [0, 68]], rights: [], ticks: [] },
  'right triangle': { pts: [[8, 8], [8, 68], [84, 68]], rights: [1], ticks: [] },
  pentagon: { pts: [[44, 4], [86, 34], [70, 72], [18, 72], [2, 34]], rights: [], ticks: [] },
  hexagon: { pts: [[24, 6], [66, 6], [88, 40], [66, 74], [24, 74], [2, 40]], rights: [], ticks: [] },
};
function shape(kind, { marks = false, size = 1 } = {}) {
  if (kind === 'circle') return `${open(96 * size, 84 * size, 'A circle')}<circle cx="${48 * size}" cy="${42 * size}" r="${36 * size}" fill="none" stroke="#000" stroke-width="2"/></svg>`;
  const sh = SHAPES[kind];
  const pts = sh.pts.map(([x, y]) => [x * size + 4, y * size + 4]);
  let s = open(100 * size + 8, 80 * size + 8, `A ${kind}`);
  s += `<polygon points="${pts.map((p) => p.join(',')).join(' ')}" fill="none" stroke="#000" stroke-width="2"/>`;
  if (marks) {
    sh.rights.forEach((i) => {
      const [x, y] = pts[i]; const p = pts[(i + pts.length - 1) % pts.length]; const n = pts[(i + 1) % pts.length];
      const u = (a) => { const l = Math.hypot(a[0] - x, a[1] - y); return [(a[0] - x) / l * 9, (a[1] - y) / l * 9]; };
      const a = u(p); const c = u(n);
      s += `<polyline points="${r1(x + a[0])},${r1(y + a[1])} ${r1(x + a[0] + c[0])},${r1(y + a[1] + c[1])} ${r1(x + c[0])},${r1(y + c[1])}" fill="none" stroke="#000" stroke-width="1.2"/>`;
    });
    sh.ticks.forEach(([i, j, n = 1]) => {
      const a = pts[i]; const c = pts[j]; const mxp = (a[0] + c[0]) / 2; const myp = (a[1] + c[1]) / 2;
      const l = Math.hypot(c[0] - a[0], c[1] - a[1]); const nx = -(c[1] - a[1]) / l * 5; const ny = (c[0] - a[0]) / l * 5;
      for (let k = 0; k < n; k++) {
        const o = (k - (n - 1) / 2) * 4; const ox = (c[0] - a[0]) / l * o; const oy = (c[1] - a[1]) / l * o;
        s += `<line x1="${r1(mxp - nx + ox)}" y1="${r1(myp - ny + oy)}" x2="${r1(mxp + nx + ox)}" y2="${r1(myp + ny + oy)}" stroke="#000" stroke-width="1.3"/>`;
      }
    });
  }
  return `${s}</svg>`;
}

// ---------- area model grid for multiplying fractions ----------
// cols x rows cells; shade the top `shadeRows` rows and left `shadeCols` columns (their overlap is the product)
function areaGrid({ cols, rows, shadeRows = 0, shadeCols = 0, cell = 22 }) {
  const W = cols * cell + 6; const H = rows * cell + 6;
  let s = open(W, H, `Grid with ${cols} columns and ${rows} rows`);
  if (shadeRows && shadeCols) s += `<rect x="3" y="3" width="${shadeCols * cell}" height="${shadeRows * cell}" fill="#b5b5b5"/>`;
  for (let i = 0; i <= cols; i++) s += `<line x1="${3 + i * cell}" x2="${3 + i * cell}" y1="3" y2="${3 + rows * cell}" stroke="#000" stroke-width="1"/>`;
  for (let j = 0; j <= rows; j++) s += `<line x1="3" x2="${3 + cols * cell}" y1="${3 + j * cell}" y2="${3 + j * cell}" stroke="#000" stroke-width="1"/>`;
  return `${s}</svg>`;
}

// ---------- number line with fractions (grade 4 equivalent fractions) ----------
function fractionLine({ den = 8, above = [] }) {
  const W = 330; const H = 70; const x0 = 22; const span = W - 56; const y = 38;
  let s = open(W, H, 'Number line from 0 to 1');
  s += `<line x1="8" x2="${W - 8}" y1="${y}" y2="${y}" stroke="#000" stroke-width="1.4"/>`;
  for (let i = 0; i <= den; i++) {
    const x = x0 + (i / den) * span;
    s += `<line x1="${r1(x)}" x2="${r1(x)}" y1="${y - 4}" y2="${y + 4}" stroke="#000" stroke-width="1"/>`;
    s += i === 0 ? text(x, y + 18, 0, { size: 10 }) : i === den ? text(x, y + 18, 1, { size: 10 }) : fracLabel(x, y + 12, i, den, 9);
  }
  above.forEach(([n, d]) => { const x = x0 + (n / d) * span; s += `<line x1="${r1(x)}" x2="${r1(x)}" y1="${y - 6}" y2="${y - 12}" stroke="#000" stroke-width="1"/>${fracLabel(x, y - 22, n, d, 9)}`; });
  return `${s}</svg>`;
}

// ---------- angles (grade 4) ----------
function angle(deg, { label = '', length = 54 } = {}) {
  const W = 96; const H = 80; const vx = 16; const vy = H - 14;
  const rad = (deg * Math.PI) / 180;
  const ex = vx + length * Math.cos(rad); const ey = vy - length * Math.sin(rad);
  let s = open(W, H, `${deg} degree angle`);
  s += `<line x1="${vx}" y1="${vy}" x2="${vx + length}" y2="${vy}" stroke="#000" stroke-width="1.6"/><line x1="${vx}" y1="${vy}" x2="${r1(ex)}" y2="${r1(ey)}" stroke="#000" stroke-width="1.6"/>`;
  if (deg === 90) s += `<polyline points="${vx + 9},${vy} ${vx + 9},${vy - 9} ${vx},${vy - 9}" fill="none" stroke="#000" stroke-width="1.2"/>`;
  else { const rr = 14; s += `<path d="M${vx + rr} ${vy} A${rr} ${rr} 0 0 0 ${r1(vx + rr * Math.cos(rad))} ${r1(vy - rr * Math.sin(rad))}" fill="none" stroke="#000" stroke-width="1.2"/>`; }
  if (label) s += text(vx + 22, vy - 4, label, { size: 10, weight: 'bold', anchor: 'start' });
  return `${s}</svg>`;
}


// ---------- grade 4 figures ----------
// A rectangle with its four sides labelled (perimeter / area problems)
function rect({ l, w, unit = '', width = 150 }) {
  const rw = 108; const rh = 44; const W = rw + 70; const H = rh + 44; const x0 = 36; const y0 = 22;
  const u = unit ? ` ${unit}` : '';
  let s = open(W, H, `Rectangle ${l} by ${w}`);
  s += `<rect x="${x0}" y="${y0}" width="${rw}" height="${rh}" fill="none" stroke="#000" stroke-width="2"/>`;
  s += text(x0 + rw / 2, y0 - 6, `${l}${u}`, { size: 10 }) + text(x0 + rw / 2, y0 + rh + 14, `${l}${u}`, { size: 10 });
  s += text(x0 - 5, y0 + rh / 2 + 4, `${w}${u}`, { size: 10, anchor: 'end' }) + text(x0 + rw + 5, y0 + rh / 2 + 4, `${w}${u}`, { size: 10, anchor: 'start' });
  return `${s}</svg>`;
}

// Triangles in a row, numbered. kinds: equilateral, isosceles, rightIsosceles, rightScalene, scalene, obtuse
const TRI = {
  equilateral: { pts: [[32, 6], [62, 56], [2, 56]], ticks: [[0, 1], [1, 2], [2, 0]], right: null },
  isosceles: { pts: [[32, 6], [54, 56], [10, 56]], ticks: [[0, 1], [2, 0]], right: null },
  rightIsosceles: { pts: [[6, 8], [6, 56], [54, 56]], ticks: [[0, 1], [1, 2]], right: 1 },
  rightScalene: { pts: [[6, 12], [6, 56], [62, 56]], ticks: [], right: 1 },
  scalene: { pts: [[14, 8], [62, 56], [2, 56]], ticks: [], right: null },
  obtuse: { pts: [[2, 56], [64, 56], [20, 34]], ticks: [], right: null },
};
function triangles(kinds) {
  const cw = 76; const W = kinds.length * cw + 4; const H = 82;
  let s = open(W, H, 'Triangles');
  kinds.forEach((k, i) => {
    const t = TRI[k]; const ox = 4 + i * cw; const oy = 4;
    const pts = t.pts.map(([x, y]) => [x + ox, y + oy]);
    s += `<polygon points="${pts.map((q) => q.join(',')).join(' ')}" fill="none" stroke="#000" stroke-width="2"/>`;
    if (t.right !== null) {
      const [x, y] = pts[t.right]; const a = pts[(t.right + 2) % 3]; const c = pts[(t.right + 1) % 3];
      const u = (q) => { const l = Math.hypot(q[0] - x, q[1] - y); return [(q[0] - x) / l * 9, (q[1] - y) / l * 9]; };
      const ua = u(a); const uc = u(c);
      s += `<polyline points="${r1(x + ua[0])},${r1(y + ua[1])} ${r1(x + ua[0] + uc[0])},${r1(y + ua[1] + uc[1])} ${r1(x + uc[0])},${r1(y + uc[1])}" fill="none" stroke="#000" stroke-width="1.2"/>`;
    }
    t.ticks.forEach(([a, b2]) => {
      const p1 = pts[a]; const p2 = pts[b2]; const mxp = (p1[0] + p2[0]) / 2; const myp = (p1[1] + p2[1]) / 2;
      const l = Math.hypot(p2[0] - p1[0], p2[1] - p1[1]); const nx = -(p2[1] - p1[1]) / l * 5; const ny = (p2[0] - p1[0]) / l * 5;
      s += `<line x1="${r1(mxp - nx)}" y1="${r1(myp - ny)}" x2="${r1(mxp + nx)}" y2="${r1(myp + ny)}" stroke="#000" stroke-width="1.3"/>`;
    });
    s += text(ox + 32, H - 6, String(i + 1), { size: 10, weight: 'bold' });
  });
  return `${s}</svg>`;
}

// Three labelled angles side by side (a, b, c)
function angles(list) {
  const cw = 92; const W = list.length * cw + 4; const H = 78;
  let s = open(W, H, 'Angles');
  list.forEach((a, i) => {
    const ox = 6 + i * cw; const vx = ox + 10; const vy = H - 12; const rad = (a.deg * Math.PI) / 180; const len = 52;
    s += `<line x1="${vx}" y1="${vy}" x2="${vx + len}" y2="${vy}" stroke="#000" stroke-width="1.6"/>`;
    s += `<line x1="${vx}" y1="${vy}" x2="${r1(vx + len * Math.cos(rad))}" y2="${r1(vy - len * Math.sin(rad))}" stroke="#000" stroke-width="1.6"/>`;
    if (a.deg === 90) s += `<polyline points="${vx + 9},${vy} ${vx + 9},${vy - 9} ${vx},${vy - 9}" fill="none" stroke="#000" stroke-width="1.2"/>`;
    else { const rr = 13; s += `<path d="M${vx + rr} ${vy} A${rr} ${rr} 0 0 0 ${r1(vx + rr * Math.cos(rad))} ${r1(vy - rr * Math.sin(rad))}" fill="none" stroke="#000" stroke-width="1.2"/>`; }
    s += text(vx + 22, vy - 5, a.label, { size: 11, weight: 'bold', anchor: 'start' });
  });
  return `${s}</svg>`;
}

module.exports = { rect, triangles, angles, TRI, esc, plane, linePlot, cubes, prism, composite, shape, areaGrid, fractionLine, angle, EMOJI_FONT, SHAPES };
