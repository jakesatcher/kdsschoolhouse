'use strict';

const express = require('express');
const { oneOf, intIn, flag, str } = require('../lib/params');
const { generatorLimiter } = require('../lib/limits');
const { makeRng } = require('../lib/generators/rng');
const math = require('../lib/generators/math');
const wp = require('../lib/generators/wordProblems');
const { phonics, CATEGORIES } = require('../lib/generators/phonics');
const { sightWords, LISTS } = require('../lib/generators/sight');
const { writing, TYPES: WRITING_TYPES } = require('../lib/generators/writing');
const scope = require('../lib/generators/scope');

const router = express.Router();
router.use(['/math', '/reading', '/writing'], generatorLimiter);

const GRADES = [1, 2, 3, 4, 5];
const MATH_TYPES = {
  addition: 'Addition',
  subtraction: 'Subtraction',
  multiplication: 'Multiplication',
  division: 'Division',
  'word-problems': 'Word Problems',
};

router.get('/', (req, res) => res.render('home', { title: 'Home' }));

// A worksheet always has a seed so the same sheet can be regenerated; the key and sheet share it.
function seedFrom(q) {
  const seed = intIn(q.seed, 1, 2147483647, 0);
  return seed || Math.floor(Math.random() * 2147483646) + 1;
}

// ---------- Math ----------
router.get('/math', (req, res) => res.redirect('/math/addition'));

router.get('/math/:type', (req, res, next) => {
  const type = req.params.type;
  if (!MATH_TYPES[type]) return next();
  res.render('learn/math-form', { title: MATH_TYPES[type], type, types: MATH_TYPES, guide: scope.mathGuide, grades: GRADES, ops: wp.OPS, kinds: wp.KINDS, steps: wp.STEPS, q: req.query });
});

router.get('/math/:type/worksheet', (req, res, next) => {
  const type = req.params.type;
  if (!MATH_TYPES[type]) return next();
  const q = req.query;
  const seed = seedFrom(q);
  const rng = makeRng(seed);
  const grade = intIn(q.grade, 1, 5, 3);
  const base = { title: `${MATH_TYPES[type]} Worksheet`, type, seed, grade, includeKey: flag(q.key, true), layout: oneOf(q.layout, ['vertical', 'horizontal'], 'vertical') };
  let problems;

  if (type === 'addition') {
    const digits = intIn(q.digits, 2, 7, 2);
    const count = intIn(q.count, 5, 40, 20);
    problems = math.addition(rng, { digits, count, addends: intIn(q.addends, 2, 3, 2), regroup: oneOf(q.regroup, ['always', 'any'], 'always') });
    Object.assign(base, { subtitle: `${digits}-digit addition${q.regroup === 'any' ? '' : ' with regrouping'}`, digits });
  } else if (type === 'subtraction') {
    const digits = intIn(q.digits, 2, 7, 2);
    const count = intIn(q.count, 5, 40, 20);
    problems = math.subtraction(rng, { digits, count, regroup: oneOf(q.regroup, ['always', 'any'], 'always') });
    Object.assign(base, { subtitle: `${digits}-digit subtraction${q.regroup === 'any' ? '' : ' with regrouping'}`, digits });
  } else if (type === 'multiplication') {
    const mode = oneOf(q.mode, ['facts', 'mixed'], 'facts');
    const factor = oneOf(q.factor, ['all', ...Array.from({ length: 13 }, (_, i) => i)], 'all');
    problems = math.multiplication(rng, { mode, factor, count: intIn(q.count, 5, 60, 30) });
    Object.assign(base, { subtitle: mode === 'mixed' ? 'Mixed multiplication' : factor === 'all' ? 'Multiplication facts 0-12 (mixed)' : `Multiplication facts: ${factor}s`, digits: mode === 'mixed' ? 3 : 2 });
  } else if (type === 'division') {
    const mode = oneOf(q.mode, ['facts', 'mixed'], 'facts');
    const divisor = oneOf(q.divisor, ['all', ...Array.from({ length: 12 }, (_, i) => i + 1)], 'all');
    problems = math.division(rng, { mode, divisor, count: intIn(q.count, 5, 60, 30) });
    Object.assign(base, { subtitle: mode === 'mixed' ? 'Mixed division (with remainders)' : divisor === 'all' ? 'Division facts 0-12 (mixed)' : `Division facts: divide by ${divisor}`, digits: mode === 'mixed' ? 4 : 2 });
  } else {
    const result = wp.wordProblems(rng, {
      grade,
      op: oneOf(q.op, wp.OPS, 'mixed'),
      kind: oneOf(q.kind, wp.KINDS, 'whole'),
      steps: oneOf(q.steps, wp.STEPS, 'mixed'),
      count: intIn(q.count, 3, 20, 10),
    });
    if (result.error) {
      return res.status(422).render('learn/math-form', { title: MATH_TYPES[type], type, types: MATH_TYPES, guide: scope.mathGuide, grades: GRADES, ops: wp.OPS, kinds: wp.KINDS, steps: wp.STEPS, q, error: result.error });
    }
    return res.render('learn/worksheet-words', { ...base, subtitle: `Grade ${grade} word problems`, problems: result.problems });
  }
  res.render('learn/worksheet-math', { ...base, problems });
});

// ---------- Reading ----------
router.get('/reading', (req, res) => res.redirect('/reading/phonics'));

router.get('/reading/phonics', (req, res) => {
  res.render('learn/phonics-form', { title: 'Phonics', categories: CATEGORIES, guide: scope.readingGuide, q: req.query });
});

router.get('/reading/phonics/worksheet', (req, res) => {
  const [category, sub] = str(req.query.type).split('/');
  const seed = seedFrom(req.query);
  const result = phonics(makeRng(seed), { category, subtype: sub || 'all', count: 20, mix: oneOf(req.query.mix, ['mixed', 'real', 'nonsense'], 'mixed') });
  if (result.error) {
    return res.status(422).render('learn/phonics-form', { title: 'Phonics', categories: CATEGORIES, guide: scope.readingGuide, q: req.query, error: result.error });
  }
  res.render('learn/worksheet-phonics', {
    title: 'Phonics Worksheet', seed, result,
    format: oneOf(req.query.format, ['list', 'write'], 'list'),
    markNonsense: flag(req.query.mark, true),
    includeKey: flag(req.query.key, true),
  });
});

router.get('/reading/sight-words', (req, res) => {
  res.render('learn/sight-form', { title: 'Sight Words', lists: LISTS, q: req.query });
});

router.get('/reading/sight-words/worksheet', (req, res) => {
  const seed = seedFrom(req.query);
  const result = sightWords(makeRng(seed), {
    list: str(req.query.list),
    count: oneOf(req.query.count, ['all', '10', '20', '30'], 'all'),
    order: oneOf(req.query.order, ['alphabetical', 'random'], 'alphabetical'),
  });
  if (result.error) return res.status(422).render('learn/sight-form', { title: 'Sight Words', lists: LISTS, q: req.query, error: result.error });
  res.render('learn/worksheet-sight', { title: 'Sight Words Worksheet', seed, result, format: oneOf(req.query.format, ['list', 'cards', 'trace'], 'list') });
});

// ---------- Writing ----------
router.get('/writing', (req, res) => {
  res.render('learn/writing-form', { title: 'Writing', types: WRITING_TYPES, grades: GRADES, guide: scope.writingGuide, q: req.query });
});

router.get('/writing/worksheet', (req, res) => {
  const seed = seedFrom(req.query);
  const grade = intIn(req.query.grade, 1, 5, 2);
  const type = oneOf(req.query.type, WRITING_TYPES, 'opinion');
  const sheet = writing(makeRng(seed), { type, grade, count: intIn(req.query.count, 1, 4, 2), lines: intIn(req.query.lines, 4, 14, 8) });
  res.render('learn/worksheet-writing', { title: 'Writing Worksheet', seed, type, grade, sheet });
});

module.exports = router;
