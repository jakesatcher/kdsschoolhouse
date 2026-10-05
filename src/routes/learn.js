'use strict';

const express = require('express');
const { oneOf } = require('../lib/params');
const { generatorLimiter } = require('../lib/limits');
const sheets = require('../lib/sheets');
const library = require('../lib/library');
const wp = require('../lib/generators/wordProblems');
const { CATEGORIES } = require('../lib/generators/phonics');
const { LISTS } = require('../lib/generators/sight');
const { TYPES: WRITING_TYPES } = require('../lib/generators/writing');
const scope = require('../lib/generators/scope');

const router = express.Router();
router.use(['/math', '/reading', '/writing'], generatorLimiter);

const GRADES = [1, 2, 3, 4, 5];
const { MATH_TYPES } = sheets;

router.get('/', (req, res) => res.render('home', { title: 'Home' }));

// ---------- settings forms ----------
const mathForm = (res, type, q, error) =>
  res.status(error ? 422 : 200).render('learn/math-form', { title: MATH_TYPES[type], type, types: MATH_TYPES, guide: scope.mathGuide, grades: GRADES, ops: wp.OPS, kinds: wp.KINDS, steps: wp.STEPS, q, error });
const phonicsForm = (res, q, error) => res.status(error ? 422 : 200).render('learn/phonics-form', { title: 'Phonics', categories: CATEGORIES, guide: scope.readingGuide, q, error });
const sightForm = (res, q, error) => res.status(error ? 422 : 200).render('learn/sight-form', { title: 'Sight Words', lists: LISTS, q, error });

router.get('/math', (req, res) => res.redirect('/math/addition'));
router.get('/math/:type', (req, res, next) => (MATH_TYPES[req.params.type] ? mathForm(res, req.params.type, req.query) : next()));
router.get('/reading/phonics', (req, res) => phonicsForm(res, req.query));
router.get('/reading/sight-words', (req, res) => sightForm(res, req.query));
router.get('/writing', (req, res) => res.render('learn/writing-form', { title: 'Writing', types: WRITING_TYPES, grades: GRADES, guide: scope.writingGuide, q: req.query }));

// ---------- worksheets ----------
const FORM_ERRORS = {
  '/reading/phonics': (res, q, e) => phonicsForm(res, q, e),
  '/reading/sight-words': (res, q, e) => sightForm(res, q, e),
};

async function worksheet(req, res, next) {
  if (!sheets.isSheetPath(req.path)) return next();
  // Pin every sheet to a seed in the URL so reloading, saving and re-opening always give the same sheet.
  if (!sheets.validSeed(req.query)) {
    const p = new URLSearchParams(req.originalUrl.split('?')[1] || '');
    p.set('seed', sheets.newSeed());
    return res.redirect(`${req.path}?${p}`);
  }
  const built = sheets.build(req.path, req.query);
  if (!built) return next();
  if (built.error) {
    const mathType = /^\/math\/([a-z-]+)$/.exec(built.formPath);
    if (mathType) return mathForm(res, mathType[1], req.query, built.error);
    return FORM_ERRORS[built.formPath](res, req.query, built.error);
  }
  const p = new URLSearchParams(req.originalUrl.split('?')[1] || '');
  p.delete('seed');
  const again = new URLSearchParams(p);
  again.set('seed', sheets.newSeed());
  const sheetUrl = req.originalUrl;
  const saved = await library.find(req.user.id, sheetUrl);
  res.render('learn/sheet', {
    title: built.title, partial: built.partial, sheet: built.locals, seed: built.seed, sheetUrl, saved,
    settingsUrl: `${built.formPath}?${p}`, newUrl: `${req.path}?${again}`,
  });
}
router.get(/^\/(math\/[a-z-]+|reading\/phonics|reading\/sight-words|writing)\/worksheet$/, worksheet);

module.exports = router;
