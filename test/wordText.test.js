'use strict';
// Phonics and sight words with sentences or a short passage written from the sheet's words (AI-written and checked).
const test = require('node:test');
const assert = require('node:assert');
const { request, db, createApp, resetDb, csrfFrom, createUser, login } = require('./helpers');
const ai = require('../src/lib/reading/ai');
const wt = require('../src/lib/wordText');

function stub(replies) {
  const calls = [];
  ai.setClient({ messages: { create: async (req) => { calls.push(req); const r = replies.shift(); if (r instanceof Error) throw r; return { stop_reason: 'end_turn', content: [{ type: 'text', text: typeof r === 'function' ? r(req) : r }] }; } } });
  return calls;
}
const app = createApp(); let agent;
test.before(async () => { await resetDb(); await createUser({ username: 't@example.com', name: 'Teacher' }); agent = request.agent(app); await login(agent, 't@example.com'); });
test.after(() => { ai.setClient(null); return db.pool.end(); });
const post = async (path, body) => { const page = await agent.get('/'); return agent.post(path).type('form').send({ _csrf: csrfFrom(page.text), ...body }); };
const wordsIn = (prompt) => /<word_list>([^<]*)<\/word_list>/.exec(prompt)[1].split(', ');

test('the checks: enough of the words, the right number of sentences, short sentences', () => {
  const words = ['cat', 'hat', 'mat', 'sat', 'bat', 'rat', 'pat', 'fat', 'can', 'man'];
  const good = { sentences: ['The cat sat on the mat.', 'I see a hat.', 'The bat and the rat ran.', 'Pat can fat man.', 'A man has a hat.', 'The cat is fat.', 'I can pat the cat.'] };
  const r = wt.check(good, words, 'sentences'); assert.deepStrictEqual(r.problems, []); assert.ok(r.used.length >= 8);
  assert.match(wt.check({ sentences: ['The cat sat.'] }, words, 'sentences').problems.join(' '), /sentences; write/);
  assert.match(wt.check({ passage: 'The cat sat. The hat is fat.' }, words, 'passage').problems.join(' '), /3 to 5/);
  assert.deepStrictEqual(wt.check({ passage: 'The cat sat on the mat. A bat hit the hat. The rat sat by the fat man.' }, words, 'passage').problems, []);
  assert.match(wt.check({ passage: 'The dog ran. The dog sat. The dog hid.' }, words, 'passage').problems.join(' '), /target words/);
  assert.ok(wt.hasWord('The cat sat.', 'cat')); assert.ok(!wt.hasWord('A category', 'cat')); assert.ok(!wt.hasWord('cats', 'cat'));
  const prompt = wt.buildPrompt({ words, mode: 'passage', level: 'grade 1', topic: 'a farm <b>' });
  assert.match(prompt, /3 to 5 sentences/); assert.match(prompt, /<word_list>cat, hat/); assert.ok(!/<b>/.test(prompt)); assert.match(prompt, /Names to use for characters/);
});

test('phonics with sentences: the word list page, then a page of sentences with the words in bold', async () => {
  const calls = stub([(req) => { const w = wordsIn(req.messages[0].content); return JSON.stringify({ sentences: Array.from({ length: 12 }, (_, i) => `I see the ${w[(2 * i) % w.length]} and the ${w[(2 * i + 1) % w.length]}.`) }); }]);
  const res = await post('/reading/phonics/with-text', { category: 'cvc', subtype: 'all', mix: 'real', format: 'list', mark: '1', key: '1', extra: 'sentences' });
  assert.strictEqual(res.status, 302, res.text && res.text.slice(0, 200)); assert.match(res.headers.location, /^\/reading\/doc\/d-/);
  assert.strictEqual(calls.length, 1); const words = wordsIn(calls[0].messages[0].content); assert.ok(words.length >= 10);
  const page = await agent.get(res.headers.location); assert.strictEqual(page.status, 200);
  assert.strictEqual((page.text.match(/<article class="sheet">/g) || []).length, 2); assert.match(page.text, /Read the sentences/); assert.match(page.text, /<ol class="wt-list">/);
  assert.ok(words.slice(0, 3).every((w) => new RegExp(`<strong>${w}</strong>`).test(page.text)), 'target words are bold');
  assert.match(page.text, /Teacher Key/); assert.match(page.text, /Words used in the sentences/); assert.match(page.text, /Edit/);
  assert.ok(!/\sstyle=/.test(page.text));
});

test('sight words with a short passage: 3 to 5 sentences, retried when the first reply is wrong', async () => {
  const calls = stub([
    (req) => JSON.stringify({ title: 'Too short', passage: 'We can go.' }),
    (req) => { const w = wordsIn(req.messages[0].content); assert.match(req.messages[0].content, /3 to 5 sentences/); return JSON.stringify({ title: 'At the Park', passage: `We ${w[0]} to the park. I ${w[1]} a big dog. The dog can ${w[2]} and ${w[3]}.` }); },
  ]);
  const res = await post('/reading/sight-words/with-text', { list: 'pre-primer', count: '20', order: 'alphabetical', format: 'list', extra: 'passage' });
  assert.strictEqual(res.status, 302); assert.strictEqual(calls.length, 2); assert.match(calls[1].messages[0].content, /Your previous reply had problems/);
  const page = await agent.get(res.headers.location); assert.match(page.text, /At the Park/); assert.match(page.text, /wt-passage/);
  const ref = res.headers.location.split('/').pop();
  // edit
  const edit = await agent.get(`/reading/doc/${ref}/edit`); assert.strictEqual(edit.status, 200); assert.match(edit.text, /Passage/);
  const saved = await post(`/reading/doc/${ref}/edit`, { passage_title: 'My Park Day', passage: 'We go to the park. I see a dog. The dog can run.' });
  assert.strictEqual(saved.status, 302); assert.match((await agent.get(saved.headers.location)).text, /My Park Day/);
  // Favorites and Print Later
  const fav = await post('/library/toggle', { flag: 'favorite', ref, back: `/reading/doc/${ref}` });
  assert.match(fav.headers.location, /^\/reading\/doc\/s-\d+$/);
  const favs = await agent.get('/favorites'); assert.match(favs.text, /Pre-Primer/); assert.match(favs.text, /with a short passage/);
  await post('/library/toggle', { flag: 'print_later', ref: fav.headers.location.split('/').pop(), back: fav.headers.location });
  const all = await agent.get('/print-later/all'); assert.strictEqual(all.status, 200); assert.match(all.text, /My Park Day|Park/);
});

test('clear messages: no real words, AI not set up, unusable replies; and the forms offer the choice', async () => {
  let res = await post('/reading/phonics/with-text', { category: 'cvc', subtype: 'all', mix: 'nonsense', format: 'list', extra: 'sentences' });
  assert.strictEqual(res.status, 302); assert.match((await agent.get(res.headers.location)).text, /not enough real words/);
  stub(['nonsense', 'still nonsense']);
  res = await post('/reading/sight-words/with-text', { list: 'primer', count: '10', order: 'random', format: 'list', extra: 'sentences' });
  assert.match((await agent.get(res.headers.location)).text, /could not write text/);
  res = await post('/reading/sight-words/with-text', { list: '', extra: 'sentences' }); assert.strictEqual(res.status, 302);
  const cfg = require('../src/config'); const key = cfg.anthropicApiKey; ai.setClient(null); cfg.anthropicApiKey = '';
  res = await post('/reading/sight-words/with-text', { list: 'primer', count: '10', order: 'random', format: 'list', extra: 'passage' });
  assert.match((await agent.get(res.headers.location)).text, /not set up on this server/); cfg.anthropicApiKey = key;
  for (const p of ['/reading/phonics', '/reading/sight-words']) { const f = await agent.get(p); assert.match(f.text, /name="extra"/); assert.match(f.text, /Add sentences that use the words/); assert.match(f.text, /Add a short passage \(3-5 sentences\)/); assert.match(f.text, /data-extra-post/); }
  // the plain word sheet is unchanged
  assert.match((await agent.get('/reading/sight-words/worksheet?list=primer&count=10&seed=4&extra=none')).text, /wordgrid/);
});
