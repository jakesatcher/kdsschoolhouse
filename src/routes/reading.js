'use strict';

const express = require('express');
const { rateLimit } = require('express-rate-limit');
const config = require('../config');
const ai = require('../lib/reading/ai');
const { generateReading } = require('../lib/reading/generate');
const { SKILLS, byId, LENGTHS, VOCAB_WORDS } = require('../lib/reading/skills');
const { WORD_RE } = require('../lib/reading/text');
const docs = require('../lib/docs');
const library = require('../lib/library');
const { audit } = require('../lib/audit');
const { oneOf, intIn, flag, str } = require('../lib/params');

const router = express.Router();

const strip = (s, max) => str(s).replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, '').replace(/\r/g, '').trim().slice(0, max);
const pickRandom = (arr) => arr[Math.floor(Math.random() * arr.length)];

function renderForm(res, skill, values, errors = [], status = 200) {
  res.status(status).render('learn/reading-form', { title: skill.name, skill, skills: SKILLS, lengths: LENGTHS, v: values, errors, aiReady: ai.configured() });
}

function defaults(skill) {
  return { grade: 3, genre: 'fiction', length: 'medium', topic: '', passageMode: 'generate', passageText: '', questionsMode: 'generate', count: skill.id === 'vocabulary' ? 4 : 5, questionsText: '', vocabMode: 'random', vocabWord: '', purpose: 'any', includeKey: true };
}

function parseForm(skill, b) {
  const length = oneOf(b.length, Object.keys(LENGTHS), 'medium');
  return {
    grade: intIn(b.grade, 1, 5, 3),
    genre: oneOf(b.genre, ['fiction', 'nonfiction'], 'fiction'),
    length,
    topic: strip(b.topic, 150),
    passageMode: oneOf(b.passage_mode, ['generate', 'custom'], 'generate'),
    passageText: strip(b.passage_text, 3000),
    questionsMode: oneOf(b.questions_mode, ['generate', 'custom'], 'generate'),
    count: intIn(b.question_count, 3, 10, skill.id === 'vocabulary' ? 4 : LENGTHS[length].questions),
    questionsText: strip(b.questions_text, 3000),
    vocabMode: oneOf(b.vocab_mode, ['random', 'custom'], 'random'),
    vocabWord: strip(b.vocab_word, 30),
    purpose: oneOf(b.purpose, ['any', 'persuade', 'inform', 'entertain'], 'any'),
    includeKey: flag(b.key, true),
  };
}

const customQuestions = (text) =>
  text.split('\n').map((l) => l.replace(/^\s*(?:\d{1,2}[.)]|[-•*])\s*/, '').trim()).filter(Boolean).slice(0, 12).map((q) => ({ q: q.slice(0, 400), a: '', type: '' }));

const needsAi = (v) => v.passageMode === 'generate' || v.questionsMode === 'generate';

// Cost guard: only requests that call the AI count against the per-teacher hourly limit.
const aiLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: config.aiHourlyLimit,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  skip: (req) => process.env.NODE_ENV === 'test' || !req.needsAi,
  keyGenerator: (req) => `user-${req.user.id}`,
  handler: (req, res) => res.status(429).render('error', { title: 'Slow down', message: 'You have used your hourly limit for AI-written worksheets. You can still write your own passage and questions, or try again later.' }),
});

router.get('/reading', (req, res) => res.redirect('/reading/comprehension'));

router.get('/reading/doc/:ref', async (req, res, next) => {
  const doc = await docs.loadDoc(req, req.params.ref);
  if (!doc) return next();
  const c = doc.content;
  res.render('learn/sheet', {
    title: c.title, partial: 'doc', sheet: { ...c, ref: doc.ref }, ref: doc.ref, saved: doc.saved ? await library.findDoc(req.user.id, doc.ref) : null,
    settingsUrl: `/reading/${c.skill}`, editUrl: `/reading/doc/${req.params.ref}/edit`, seed: null,
  });
});

router.get('/reading/doc/:ref/edit', async (req, res, next) => {
  const doc = await docs.loadDoc(req, req.params.ref);
  if (!doc) return next();
  res.render('learn/doc-edit', { title: 'Edit worksheet', c: doc.content, ref: req.params.ref, errors: [] });
});

router.post('/reading/doc/:ref/edit', async (req, res, next) => {
  const doc = await docs.loadDoc(req, req.params.ref);
  if (!doc) return next();
  const b = req.body;
  const questions = [];
  for (let i = 0; i < 12; i++) {
    const q = strip(b[`q_${i}`], 400);
    if (q) questions.push({ q, a: strip(b[`a_${i}`], 600), type: strip(b[`t_${i}`], 24).toLowerCase() });
  }
  const passage = strip(b.passage, 3000);
  const errors = [];
  if (!passage) errors.push('The passage cannot be empty.');
  let word = doc.content.word || '';
  if (doc.content.skill === 'vocabulary') {
    word = strip(b.word, 30);
    if (!WORD_RE.test(word)) errors.push('The vocabulary word must be a single word (letters, apostrophe or hyphen only).');
  }
  const next_ = {
    ...doc.content, title: strip(b.title, 120) || doc.content.title, passage, word, definition: strip(b.definition, 300), questions, includeKey: flag(b.key, true),
  };
  if (errors.length) return res.status(422).render('learn/doc-edit', { title: 'Edit worksheet', c: next_, ref: req.params.ref, errors });
  await docs.updateDoc(req, doc, next_);
  req.flash('ok', 'Changes saved.');
  res.redirect(`/reading/doc/${doc.ref}`);
});

// Phonics and sight words have their own routes (registered earlier); everything else here is a reading skill.
router.get('/reading/:skill', (req, res, next) => {
  const skill = byId(req.params.skill);
  if (!skill) return next();
  renderForm(res, skill, defaults(skill));
});

router.post('/reading/:skill/generate', (req, res, next) => {
  const skill = byId(req.params.skill);
  if (!skill) return next();
  req.skill = skill;
  req.v = parseForm(skill, req.body);
  req.needsAi = needsAi(req.v);
  next();
}, aiLimiter, async (req, res) => {
  const { skill, v } = req;
  const errors = [];
  if (v.passageMode === 'custom' && v.passageText.length < 20) errors.push('Type or paste your passage (at least a sentence).');
  const own = customQuestions(v.questionsText);
  if (v.questionsMode === 'custom' && !own.length) errors.push('Type at least one question, one per line.');
  let word = '';
  if (skill.id === 'vocabulary') {
    if (v.vocabMode === 'custom') {
      word = v.vocabWord;
      if (!WORD_RE.test(word)) errors.push('Enter one vocabulary word (letters, apostrophe or hyphen only).');
    } else word = pickRandom(VOCAB_WORDS[v.grade]);
  }
  if (errors.length) return renderForm(res, skill, v, errors, 422);
  if (needsAi(v) && !ai.configured()) {
    return renderForm(res, skill, v, ['AI-written passages and questions are not set up on this server yet (the administrator needs to add an ANTHROPIC_API_KEY). You can still write your own passage and your own questions.'], 503);
  }

  let gen = {};
  if (needsAi(v)) {
    try {
      gen = await generateReading({
        skill: skill.id, grade: v.grade, genre: v.genre, length: v.length, topic: v.topic, word, purpose: v.purpose,
        passage: v.passageText, count: v.count, wantPassage: v.passageMode === 'generate', wantQuestions: v.questionsMode === 'generate',
      });
    } catch (err) {
      if (!(err instanceof ai.AiError)) throw err;
      return renderForm(res, skill, v, [err.message], err.code === 'not_configured' ? 503 : 502);
    }
    await audit(req, 'ai_generate', 'reading', skill.id, { grade: v.grade });
  }

  const content = {
    skill: skill.id, skillName: skill.name, grade: v.grade,
    genre: skill.id === 'vocabulary' ? null : v.genre,
    length: skill.id === 'vocabulary' ? null : v.length,
    title: (v.passageMode === 'generate' && gen.title) || (skill.id === 'vocabulary' ? `Vocabulary: ${word}` : skill.name),
    passage: v.passageMode === 'generate' ? gen.passage : v.passageText,
    word, definition: gen.definition || '',
    questions: v.questionsMode === 'generate' ? gen.questions : own,
    includeKey: v.includeKey,
    ai: needsAi(v),
  };
  res.redirect(`/reading/doc/${docs.putDraft(req, content)}`);
});

module.exports = router;
