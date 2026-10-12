'use strict';

// Spiral Review: one test = 10 numbered boxes; each box holds one or more problems. `buildTest` returns plain data that
// views/sheets/spiral.ejs renders (and that the tests walk through).
const skills = require('./skills');
const { plain } = require('./core');

const SPECS = { 5: require('./specs5'), 4: require('./specs4') };
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
  const boxes = spec.map((box, i) => ({
    n: i + 1,
    stack: !!box.stack,
    parts: box.parts.map(([id, params]) => runSkill(rng, id, params)),
  }));
  const key = boxes.map((b) => ({
    n: b.n,
    answers: b.parts.map((p) => (Array.isArray(p.answer) ? p.answer.join('; ') : String(p.answer))),
  }));
  return { grade, test, boxes, key };
}

module.exports = { buildTest, testNumbers, GRADES, SPECS, runSkill, plain };
