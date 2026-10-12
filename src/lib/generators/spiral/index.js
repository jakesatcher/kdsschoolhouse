'use strict';

// Spiral Review: one practice sheet = 10 numbered boxes; each box holds one or more problems. `buildTest` returns plain data that
// views/sheets/spiral.ejs renders (and that the tests walk through).
const skills = require('./skills');
const { plain } = require('./core');

const SPECS = { 5: require('./specs5'), 4: require('./specs4') };

// Randomizing: a practice number fixes which skills appear in which box, but when a box names one flavour of a skill
// (say a "times as many" equation) the sheet may swap in another flavour of the same skill and difficulty. Only
// interchangeable, same-size flavours are listed, so the page layout and the level stay the same.
const FAMILIES = {
  g4Equation: ['kind', [['times', 'twice', 'share', 'groups', 'unknownSub']]],
  g4MultiStep: ['kind', [['sub3', 'mulAdd', 'addSub', 'groupsLeft']]],
  g4Convert: ['kind', [['cups-pt', 'yd-ft', 'hr-min', 'ft-in', 'kg-g', 'L-mL', 'lb-oz', 'gal-qt']]],
  g4UnitTable: ['kind', [['m-mm', 'km-m', 'kg-g', 'L-mL', 'hr-min', 'ft-in', 'yd-ft', 'gal-qt', 'lb-oz']]],
  g4Perimeter: ['kind', [['perimeter', 'area', 'missing']]],
  g4Factors: ['kind', [['list', 'prime', 'multiples', 'circlePrime', 'multipleOf']]],
  g4Patterns: ['kind', [['add', 'sub', 'mul', 'fromRule']]],
  g4DecomposeFrac: ['kind', [['blank', 'ways']]],
  g4FracDecimal: ['kind', [['tenth', 'hundredth', 'decToFrac', 'decToFracTenth', 'tenthsToHundredths']]],
  g4MixedImproper: ['kind', [['toMixed', 'toImproper']]],
  g4ClassifyTri: ['kind', [['angles', 'sides', 'both']]],
  g4Remainder: ['kind', [['full', 'need']]],
  g4MixedWord: ['op', [['add', 'sub']]],
  g4LinePoints: ['pick', [[0, 1, 2, 3, 4, 5, 6, 7, 8, 9]]],
  mixedFracWordMul: ['kind', [['boxes', 'turtles', 'bucket', 'packages', 'candy', 'rocks', 'garden', 'paint']]],
  moreOrLess: ['kind', [['wholeFrac', 'fracFrac', 'mixedFrac', 'mixedSmall']]],
  fwSubTwo: ['kind', [['book', 'fabric']]],
  mwSub: ['kind', [['time', 'apples']]],
  fracOfFracWord: ['kind', [['cake', 'candy']]],
  unitFracDivWord: ['kind', [['cereal', 'bag', 'dip', 'cups']]],
  convertWord: ['kind', [['L', 'cm', 'oz', 'kg', 'm']]],
  unitsEq: ['form', [['ones-from', 'blank-first']]],
  shapeIs: ['pick', [[0, 4, 6], [1, 2, 3, 5]]], // picture questions stay picture questions
  shapeExplain: ['pick', [[0, 1, 3, 6], [2, 4, 5]]],
  exprWrite: ['kind', [['double-add', 'double-sub'], ['triple-add-times', 'double-product', 'added-divided', 'double-two-sub', 'triple-double'], ['tripled-addDiv', 'double-addDiv', 'triple-subDiv']]],
  exprEval: ['kind', [['paren', 'chain'], ['parenDiv', 'twoParens', 'sevenMinus'], ['mixed', 'brackets']]],
};
// `used` remembers which flavours of a skill are already on this sheet, so two boxes rarely repeat the same flavour.
function vary(rng, id, params, used) {
  const fam = FAMILIES[id];
  if (!fam || !params || !(fam[0] in params)) return params;
  const key = fam[0];
  const group = fam[1].find((g) => g.includes(params[key]));
  if (!group) return params;
  const seen = used.get(id) || new Set();
  let pick = params[key];
  const fresh = group.filter((k) => !seen.has(k));
  if (seen.has(pick) && fresh.length) pick = fresh[Math.floor(rng() * fresh.length)]; // already used: change it
  else if (rng() >= 0.5) { const pool = fresh.length ? fresh : group; pick = pool[Math.floor(rng() * pool.length)]; }
  seen.add(pick); used.set(id, seen);
  return pick === params[key] ? params : { ...params, [key]: pick };
}

const GRADES = [4, 5];

const testNumbers = (grade) => Object.keys(SPECS[grade] || {}).map(Number).sort((a, b) => a - b);

function runSkill(rng, id, params) {
  const fn = skills[id];
  if (!fn) throw new Error(`Unknown spiral skill: ${id}`);
  let lastErr;
  for (let i = 0; i < 6; i++) {
    try { return fn(rng, params || {}); } catch (e) { lastErr = e; }
  }
  throw lastErr;
}

function buildTest(rng, { grade, test }) {
  const spec = SPECS[grade] && SPECS[grade][test];
  if (!spec) return null;
  const used = new Map();
  const boxes = spec.map((box, i) => ({
    n: i + 1,
    stack: !!box.stack,
    parts: box.parts.map(([id, params]) => {
      const chosen = vary(rng, id, params, used);
      const c = runSkill(rng, id, chosen);
      if (FAMILIES[id] && chosen && FAMILIES[id][0] in chosen) c.flavour = chosen[FAMILIES[id][0]]; // which flavour of the skill this is
      return c;
    }),
  }));
  const key = boxes.map((b) => ({
    n: b.n,
    answers: b.parts.map((p) => (Array.isArray(p.answer) ? p.answer.join('; ') : String(p.answer))),
  }));
  return { grade, test, boxes, key };
}

module.exports = { buildTest, testNumbers, GRADES, SPECS, runSkill, plain };
