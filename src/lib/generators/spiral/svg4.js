'use strict';

// Grade 4 graphics: protractor with an angle to read, lines and angles through a point, letters for symmetry,
// and rows of shapes for repeating patterns. Same rules as svg.js (no style attributes).
const { open, text, r1 } = require('./svg');
const { glyph } = require('./svg3');

const rad = (d) => (d * Math.PI) / 180;

// Protractor (0 on the right, 180 on the left) with one ray drawn at `deg` degrees from the right-hand baseline
function protractor({ deg }) {
  const W = 170; const H = 98; const cx = 85; const cy = 84; const R = 70;
  let s = open(W, H, 'A protractor with an angle drawn on it');
  s += `<path d="M${cx - R} ${cy} A${R} ${R} 0 0 1 ${cx + R} ${cy} Z" fill="#fff" stroke="#000" stroke-width="1.3"/>`;
  s += `<line x1="${cx - R - 6}" y1="${cy}" x2="${cx + R + 6}" y2="${cy}" stroke="#000" stroke-width="1.3"/>`;
  for (let a = 0; a <= 180; a += 5) {
    const len = a % 10 === 0 ? 9 : 5;
    s += `<line x1="${r1(cx + (R - 1) * Math.cos(rad(a)))}" y1="${r1(cy - (R - 1) * Math.sin(rad(a)))}" x2="${r1(cx + (R - len) * Math.cos(rad(a)))}" y2="${r1(cy - (R - len) * Math.sin(rad(a)))}" stroke="#000" stroke-width="0.8"/>`;
    if (a % 30 === 0) s += text(cx + (R - 17) * Math.cos(rad(a)), cy - (R - 17) * Math.sin(rad(a)) + 3, a, { size: 7.5 });
  }
  s += `<circle cx="${cx}" cy="${cy}" r="2" fill="#000"/>`;
  s += `<line x1="${cx}" y1="${cy}" x2="${r1(cx + (R + 6) * Math.cos(rad(deg)))}" y2="${r1(cy - (R + 6) * Math.sin(rad(deg)))}" stroke="#000" stroke-width="1.8"/>`;
  return `${s}</svg>`;
}

// Lines through one point O. lines: [{ deg, a, b }] each drawn through O with letter labels at both ends (b is the end at deg + 180)
function throughPoint(lines, { size = 54 } = {}) {
  const W = size * 2 + 40; const H = size * 2 + 26; const cx = W / 2; const cy = H / 2;
  let s = open(W, H, 'Lines meeting at a point');
  lines.forEach(({ deg, a, b }) => {
    const x1 = cx + size * Math.cos(rad(deg)); const y1 = cy - size * Math.sin(rad(deg)); const x2 = cx - size * Math.cos(rad(deg)); const y2 = cy + size * Math.sin(rad(deg));
    s += `<line x1="${r1(x1)}" y1="${r1(y1)}" x2="${r1(x2)}" y2="${r1(y2)}" stroke="#000" stroke-width="1.5"/>`;
    s += `<circle cx="${r1(x1)}" cy="${r1(y1)}" r="2" fill="#000"/><circle cx="${r1(x2)}" cy="${r1(y2)}" r="2" fill="#000"/>`;
    s += text(cx + (size + 11) * Math.cos(rad(deg)), cy - (size + 11) * Math.sin(rad(deg)) + 3.5, a, { size: 11, weight: 'bold' });
    s += text(cx - (size + 11) * Math.cos(rad(deg)), cy + (size + 11) * Math.sin(rad(deg)) + 3.5, b, { size: 11, weight: 'bold' });
  });
  return `${s}<circle cx="${cx}" cy="${cy}" r="2.5" fill="#000"/>${text(cx + 8, cy + 14, 'O', { size: 10, weight: 'bold' })}</svg>`;
}

// Two separate lines: parallel, perpendicular or crossing at another angle (each labelled at both ends)
function twoLines(kind, labels) {
  const W = 150; const H = 96; let s = open(W, H, `Two lines: ${kind}`);
  const seg = (x1, y1, x2, y2, a, b) => `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#000" stroke-width="1.5"/>${text(x1 - 8, y1 + 4, a, { size: 11, weight: 'bold' })}${text(x2 + 8, y2 + 4, b, { size: 11, weight: 'bold' })}`;
  if (kind === 'parallel') s += seg(24, 30, 126, 30, labels[0], labels[1]) + seg(24, 68, 126, 68, labels[2], labels[3]);
  else if (kind === 'perpendicular') s += seg(24, 48, 126, 48, labels[0], labels[1]) + `<line x1="75" y1="10" x2="75" y2="86" stroke="#000" stroke-width="1.5"/>${text(75, 8, labels[2], { size: 11, weight: 'bold' })}${text(75, 96, labels[3], { size: 11, weight: 'bold' })}`;
  else s += seg(24, 78, 126, 20, labels[0], labels[1]) + seg(24, 22, 126, 74, labels[2], labels[3]);
  return `${s}</svg>`;
}

// A big letter for line-of-symmetry questions
function bigLetter(ch) {
  return `${open(70, 76, `The letter ${ch}`)}<text x="35" y="60" font-size="64" font-family="Arial,Helvetica,sans-serif" font-weight="bold" text-anchor="middle" fill="none" stroke="#000" stroke-width="1.6">${ch}</text></svg>`;
}

// A row of shapes (repeating pattern), then a dotted "..." and a numbered gap
function glyphRow(kinds, { s = 20 } = {}) {
  const W = kinds.length * s + 40; const H = s + 8; let g = '';
  kinds.forEach((k, i) => { g += glyph(k, 6 + i * s + s / 2, H / 2, s); });
  return `${open(W, H, 'A pattern of shapes')}${g}${text(kinds.length * s + 20, H / 2 + 4, '. . .', { size: 14 })}</svg>`;
}

module.exports = { protractor, throughPoint, twoLines, bigLetter, glyphRow };
