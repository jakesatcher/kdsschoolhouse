'use strict';

// Phonics and sight-word worksheets with sentences or a short passage written from the sheet's words (AI-written, checked).
// The result is a draft "doc": it can be edited, printed, and saved to Favorites / Print Later like the reading worksheets.
const express = require('express');
const { rateLimit } = require('express-rate-limit');
const config = require('../config');
const ai = require('../lib/reading/ai');
const { generateWordText } = require('../lib/wordText');
const sheets = require('../lib/sheets');
const docs = require('../lib/docs');
const { audit } = require('../lib/audit');
const { oneOf, flag, str } = require('../lib/params');

const router = express.Router();

const aiLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: config.aiHourlyLimit,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  skip: () => process.env.NODE_ENV === 'test',
  keyGenerator: (req) => `user-${req.user.id}`,
  handler: (req, res) => res.status(429).render('error', { title: 'Slow down', message: 'You have used your hourly limit for AI-written worksheets. The plain word lists are still available, or try again later.' }),
});

const LEVEL = { 'pre-primer': 'kindergarten, very first readers', primer: 'kindergarten to grade 1', first: 'grade 1', second: 'grade 2', third: 'grade 3', nouns: 'kindergarten to grade 1' };
const CLEAN = (s, max) => str(s).replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, '').replace(/\r/g, '').trim().slice(0, max);

function handler(kind) {
  const isPhonics = kind === 'phonics';
  const path = isPhonics ? '/reading/phonics/worksheet' : '/reading/sight-words/worksheet';
  const formPath = isPhonics ? '/reading/phonics' : '/reading/sight-words';
  return async (req, res) => {
    const b = req.body;
    const mode = oneOf(b.extra, ['sentences', 'passage', 'paragraph'], 'sentences');
    const q = isPhonics
      ? { category: str(b.category), subtype: str(b.subtype), mix: str(b.mix), format: str(b.format), mark: str(b.mark), key: str(b.key) }
      : { list: str(b.list), count: str(b.count), order: str(b.order), format: str(b.format) };
    const back = new URLSearchParams({ ...q, extra: mode });
    const fail = (message) => { req.flash('error', message); res.redirect(`${formPath}?${back}`); };
    const built = sheets.build(path, { ...q, seed: String(sheets.newSeed()) });
    if (!built) return fail('Choose the settings for the word sheet first.');
    if (built.error) return fail(built.error);
    if (!ai.configured()) return fail('Sentences and passages are not set up on this server yet (the administrator needs to add an ANTHROPIC_API_KEY). The word sheet itself still works.');
    const result = built.locals.result;
    const words = isPhonics ? result.words.filter((w) => !w.nonsense).map((w) => w.word) : result.words;
    const level = isPhonics ? 'kindergarten to grade 2 (phonics practice)' : LEVEL[result.list.id] || 'kindergarten to grade 2';
    let text;
    try { text = await generateWordText({ words, mode, level, topic: CLEAN(b.topic, 80) }); } catch (err) {
      if (!(err instanceof ai.AiError)) throw err;
      return fail(err.message);
    }
    await audit(req, 'ai_generate', 'reading', kind, { mode });
    const content = {
      kind: 'wordtext', subject: 'reading', skill: kind, skillName: isPhonics ? 'Phonics' : 'Sight Words', grade: null,
      title: built.title, subtitleText: `${built.subtitle} · with ${mode === 'paragraph' ? 'a paragraph' : mode === 'passage' ? 'a short passage' : 'sentences'}`, sheetKind: kind, sheetFormat: built.locals.format,
      markNonsense: !!built.locals.markNonsense, wordList: result.words, practiceMode: mode, sentences: mode === 'sentences' ? text.sentences : [], passage: mode !== 'sentences' ? text.body : '',
      passageTitle: text.title || '', targets: text.words, includeKey: isPhonics ? flag(b.key, true) : false, ai: true,
    };
    res.redirect(`/reading/doc/${docs.putDraft(req, content)}`);
  };
}

router.post('/reading/phonics/with-text', aiLimiter, handler('phonics'));
router.post('/reading/sight-words/with-text', aiLimiter, handler('sight-words'));

module.exports = router;
