'use strict';

// AI-written word problems (more complex and varied than the built-in scenes). The result is a draft "doc" that can be
// edited, printed, saved to Favorites and queued for Print Later, like the reading worksheets.
const express = require('express');
const { rateLimit } = require('express-rate-limit');
const config = require('../config');
const ai = require('../lib/reading/ai');
const { generateProblems, FORMATS } = require('../lib/wpAi');
const docs = require('../lib/docs');
const library = require('../lib/library');
const wp = require('../lib/generators/wordProblems');
const { audit } = require('../lib/audit');
const { oneOf, intIn, flag, str } = require('../lib/params');

const router = express.Router();
const strip = (s, max) => str(s).replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, '').replace(/\r/g, '').trim().slice(0, max);

const aiLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: config.aiHourlyLimit,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  skip: () => process.env.NODE_ENV === 'test',
  keyGenerator: (req) => `user-${req.user.id}`,
  handler: (req, res) => res.status(429).render('error', { title: 'Slow down', message: 'You have used your hourly limit for AI-written worksheets. The built-in word problems are still available, or try again later.' }),
});

// What the shared word-problem sheet template shows for a saved AI doc
function sheetOf(c) {
  const problems = c.problems.map((p) => {
    const multi = p.parts.length > 1;
    const solution = p.parts.map((q) => q.explain).filter(Boolean).join(' ');
    return {
      text: p.text, table: p.table || undefined, steps: p.steps, solution,
      parts: multi ? p.parts.map((q) => ({ q: q.q, a: q.a })) : undefined,
      answerText: multi ? p.parts.map((q, i) => `${'abcd'[i]}) ${q.a}`).join('   ') : p.parts[0].a,
      explain: /explain|reasonable|correct\?|why/i.test(p.text) || undefined,
    };
  });
  return { title: c.title, subtitle: `Grade ${c.grade} · AI-written word problems`, problems, includeKey: c.includeKey, seed: undefined };
}

router.post('/math/word-problems/ai', aiLimiter, async (req, res) => {
  const b = req.body;
  const o = {
    grade: intIn(b.grade, 1, 5, 3), op: oneOf(b.op, wp.OPS, 'mixed'), kind: oneOf(b.kind, wp.KINDS, 'whole'), steps: oneOf(b.steps, wp.STEPS, 'mixed'),
    level: oneOf(b.level, wp.LEVELS, 'mixed'), count: intIn(b.count, 3, 10, 6), topic: strip(b.topic, 150), format: oneOf(b.format, ['any', ...FORMATS.map((f) => f[0])], 'any'),
  };
  const back = new URLSearchParams({ grade: o.grade, op: o.op, kind: o.kind, steps: o.steps, level: o.level, count: o.count, topic: o.topic, format: o.format });
  const fail = (message, status = 502) => {
    req.flash('error', message);
    res.redirect(`/math/word-problems?${back}`);
    void status;
  };
  if (!ai.configured()) return fail('AI-written word problems are not set up on this server yet (the administrator needs to add an ANTHROPIC_API_KEY). The built-in word problems still work.');
  let result;
  try { result = await generateProblems(o); } catch (err) {
    if (!(err instanceof ai.AiError)) throw err;
    return fail(err.message);
  }
  await audit(req, 'ai_generate', 'math', 'word-problems', { grade: o.grade });
  const content = {
    kind: 'wp-ai', subject: 'math', skill: 'word-problems', skillName: 'Word Problems', grade: o.grade,
    title: `Grade ${o.grade} Word Problems`, problems: result.problems, includeKey: flag(b.key, true), ai: true,
  };
  res.redirect(`/math/doc/${docs.putDraft(req, content)}`);
});

router.get('/math/doc/:ref', async (req, res, next) => {
  const doc = await docs.loadDoc(req, req.params.ref);
  if (!doc || doc.content.kind !== 'wp-ai') return next();
  const c = doc.content;
  res.render('learn/sheet', {
    title: c.title, partial: 'words', sheet: sheetOf(c), ref: doc.ref, saved: doc.saved ? await library.findDoc(req.user.id, doc.ref) : null,
    settingsUrl: `/math/word-problems?grade=${c.grade}`, editUrl: `/math/doc/${req.params.ref}/edit`, seed: null,
  });
});

router.get('/math/doc/:ref/edit', async (req, res, next) => {
  const doc = await docs.loadDoc(req, req.params.ref);
  if (!doc || doc.content.kind !== 'wp-ai') return next();
  res.render('learn/wp-edit', { title: 'Edit word problems', c: doc.content, ref: req.params.ref });
});

router.post('/math/doc/:ref/edit', async (req, res, next) => {
  const doc = await docs.loadDoc(req, req.params.ref);
  if (!doc || doc.content.kind !== 'wp-ai') return next();
  const b = req.body;
  const problems = doc.content.problems.map((p, i) => {
    const text = strip(b[`text_${i}`], 900);
    if (!text) return null;
    return { ...p, text, parts: p.parts.map((q, j) => ({ ...q, q: p.parts.length > 1 ? strip(b[`q_${i}_${j}`], 300) || q.q : q.q, a: strip(b[`a_${i}_${j}`], 300) || q.a })) };
  }).filter(Boolean);
  if (!problems.length) { req.flash('error', 'Keep at least one problem.'); return res.redirect(`/math/doc/${req.params.ref}/edit`); }
  await docs.updateDoc(req, doc, { ...doc.content, title: strip(b.title, 120) || doc.content.title, problems, includeKey: flag(b.key, true) });
  req.flash('ok', 'Changes saved.');
  res.redirect(`/math/doc/${doc.ref}`);
});

module.exports = router;
module.exports.sheetOf = sheetOf;
