'use strict';
// AI-written word problems: answers are verified before they are shown, bad problems are dropped, and the result is an
// editable doc that can be saved and printed like the reading worksheets.
const test = require('node:test');
const assert = require('node:assert');
const { request, db, createApp, resetDb, csrfFrom, createUser, login } = require('./helpers');
const ai = require('../src/lib/reading/ai');
const R = require('../src/lib/rational');
const { normalize, buildPrompt } = require('../src/lib/wpAi');

function stub(replies) {
  const calls = [];
  ai.setClient({ messages: { create: async (req) => { calls.push(req); const r = replies.shift(); if (r instanceof Error) throw r; return { stop_reason: 'end_turn', content: [{ type: 'text', text: typeof r === 'function' ? r(req) : r }] }; } } });
  return calls;
}
const prob = (over = {}) => ({
  format: 'pour-together', text: 'There are 8 water bottles at a campsite, and each bottle is 3/4 full of water. If Zach pours all the water together, how many bottles can be filled all the way?', steps: 2,
  parts: [{ answer_text: '6 bottles', answer_value: '6', expression: '8*(3/4)', explain: 'Eight bottles of 3/4 hold 6 bottles of water.' }], ...over,
});

const app = createApp();
let agent;
test.before(async () => { await resetDb(); await createUser({ username: 't@example.com', name: 'Teacher' }); agent = request.agent(app); await login(agent, 't@example.com'); });
test.after(() => { ai.setClient(null); return db.pool.end(); });
const post = async (path, body) => { const page = await agent.get('/'); return agent.post(path).type('form').send({ _csrf: csrfFrom(page.text), ...body }); };

test('exact arithmetic: expressions and answers are compared as fractions, and only plain arithmetic is evaluated', () => {
  const same = (e, a) => R.eq(R.evaluate(e), R.parseAnswer(a));
  assert.ok(same('8*(3/4)', '6')); assert.ok(same('(2+3)/4', '1 1/4')); assert.ok(same('12.5+3*0.25', '13.25')); assert.ok(same('$4.50*2', '$9.00')); assert.ok(same('1/3+1/3+1/3', '1'));
  assert.ok(!same('8*(3/4)', '7')); assert.ok(!same('1/3', '0.33'));
  for (const bad of ['process.exit()', '2**3', 'a+1', '1/0', '(1+2', '']) assert.throws(() => R.evaluate(bad), bad);
  assert.strictEqual(R.parseAnswer('about 6 bottles').n, 6n); assert.strictEqual(R.parseAnswer('Yes, it is'), null);
});

test('checks: wrong expressions, classroom settings, long sentences and out-of-grade numbers are rejected', () => {
  const run = (p, g = 4) => normalize({ problems: [p] }, g);
  assert.strictEqual(run(prob()).problems.length, 1);
  assert.match(run(prob({ parts: [{ answer_text: '7 bottles', answer_value: '7', expression: '8*(3/4)', explain: 'x' }] })).rejected[0], /does not equal/);
  assert.match(run(prob({ parts: [{ answer_text: '6', answer_value: '6', expression: null }] })).rejected[0], /missing expression/);
  assert.match(run(prob({ text: 'Zach and Kelly sit in the classroom with 8 bottles that are each 3/4 full of water, and pour them out.' })).rejected[0], /classroom/);
  assert.match(run(prob({ text: `Zach ${'really '.repeat(40)}pours 8 bottles that are each 3/4 full into one big jug at camp.` })).rejected[0], /too long/);
  assert.match(run(prob({ text: 'Kelly counts 9,000,000,000 grains of sand on the beach and pours them into 8 pails at once.' }), 3).rejected[0], /too large/);
  assert.strictEqual(run(prob({ parts: [{ question: 'What is 8 times 3/4?', answer_text: '6', answer_value: '6', expression: '8*3/4' }, { question: 'Say it in words.', answer_text: 'six', answer_value: null, expression: null }] })).problems[0].parts.length, 2);
  // an explain-style answer needs no number
  assert.strictEqual(run(prob({ parts: [{ answer_text: 'No. Mia added instead of multiplied.', answer_value: null, expression: null }] })).problems.length, 1);
});

test('the prompt asks for variety, real-life settings, the grade guide and the teacher topic (quoted as data)', () => {
  const p = buildPrompt({ grade: 5, count: 6, op: 'mixed', kind: 'fraction', steps: 'multi', level: 'challenge', topic: 'a camping trip <b>', format: 'pour-together' });
  assert.match(p, /Grade 5/); assert.match(p, /do not repeat a setting|vary the others/); assert.match(p, /NOT all read/); assert.match(p, /pour-together/);
  assert.match(p, /<teacher_input>a camping trip\s+b<\/teacher_input>/); assert.ok(!/<b>/.test(p));
  assert.match(p, /water bottles/); assert.match(p, /expression/);
});

test('AI worksheet: bad problems are dropped, the judge pass can veto, and the result can be edited, saved and printed', async () => {
  const good1 = prob(); const bad = prob({ text: 'Lisa buys 4 bags of apples that cost $3.50 each at a farm stand and pays with a $20 bill. How much change does she get?', parts: [{ answer_text: '$5.00', answer_value: '5', expression: '20-4*3.50', explain: 'x' }] });
  const good2 = prob({ format: 'multi-part', text: 'A camp store sells 12 flashlights on Monday and 3 times as many on Tuesday.', parts: [{ question: 'How many flashlights were sold on Tuesday?', answer_text: '36', answer_value: '36', expression: '12*3', explain: '3 times 12 is 36.' }, { question: 'How many were sold in all?', answer_text: '48', answer_value: '48', expression: '12+36', explain: '12 plus 36.' }] });
  const vetoed = prob({ text: 'AC walks 3 miles each day for 4 days along a mountain trail and then rests. How many miles did he walk in all?', parts: [{ answer_text: '12 miles', answer_value: '12', expression: '3*4', explain: 'x' }] });
  const calls = stub([
    JSON.stringify({ problems: [good1, bad, good2, vetoed] }),
    (req) => { assert.match(req.messages[0].content, /proposed_answer/); return JSON.stringify({ results: [{ id: 0, ok: true }, { id: 1, ok: true }, { id: 2, ok: false, why: 'ambiguous' }] }); },
    JSON.stringify({ problems: [prob({ text: 'Kelly packs 15 boxes with 24 granola bars in each box for a hiking trip. How many bars are there?', parts: [{ answer_text: '360 bars', answer_value: '360', expression: '15*24', explain: '15 times 24.' }] })] }),
    JSON.stringify({ results: [{ id: 0, ok: true }] }),
  ]);
  const res = await post('/math/word-problems/ai', { grade: '4', op: 'mixed', kind: 'mixed', steps: 'multi', level: 'standard', count: '3', topic: 'camping', format: 'any', key: '1' });
  assert.strictEqual(res.status, 302); assert.match(res.headers.location, /^\/math\/doc\/d-/);
  assert.strictEqual(calls.length, 4, 'generate, judge, top-up generate, judge');
  assert.match(calls[0].messages[0].content, /camping/);
  const page = await agent.get(res.headers.location);
  assert.strictEqual(page.status, 200);
  assert.match(page.text, /water bottles/); assert.match(page.text, /granola bars/); assert.doesNotMatch(page.text, /change does she get/); assert.doesNotMatch(page.text, /mountain trail/);
  assert.match(page.text, /Answer Key/); assert.match(page.text, /6 bottles/); assert.match(page.text, /class="wp-parts"/); assert.match(page.text, /Edit/);
  assert.ok(!/\sstyle=/.test(page.text));

  // edit
  const ref = res.headers.location.split('/').pop();
  const edit = await agent.get(`/math/doc/${ref}/edit`); assert.strictEqual(edit.status, 200); assert.match(edit.text, /Problem 1/);
  const saved = await post(`/math/doc/${ref}/edit`, { title: 'Camp math', text_0: 'There are 8 water bottles, and each is 3/4 full. If we pour them all together, how many bottles can we fill?', a_0_0: '6 full bottles', text_1: '', a_1_0: '', key: '1' });
  assert.strictEqual(saved.status, 302);
  const after = await agent.get(saved.headers.location); assert.match(after.text, /Camp math/); assert.match(after.text, /6 full bottles/); assert.doesNotMatch(after.text, /flashlights/);

  // save to Favorites and Print Later: the saved copy opens under /math/doc/
  const fav = await post('/library/toggle', { flag: 'favorite', ref, back: `/math/doc/${ref}` });
  assert.strictEqual(fav.status, 302); assert.match(fav.headers.location, /^\/math\/doc\/s-\d+$/);
  const favs = await agent.get('/favorites'); assert.match(favs.text, /Camp math/); assert.match(favs.text, /\/math\/doc\/s-\d+/);
  assert.strictEqual((await agent.get(fav.headers.location)).status, 200);
  await post('/library/toggle', { flag: 'print_later', ref: fav.headers.location.split('/').pop(), back: fav.headers.location });
  const all = await agent.get('/print-later/all'); assert.strictEqual(all.status, 200); assert.match(all.text, /6 full bottles/);
  assert.strictEqual((await agent.get(`/reading/doc/${fav.headers.location.split('/').pop()}`)).status, 404, 'a math doc does not open as a reading doc');
});

test('AI worksheet: not configured, unusable replies and the hourly limit path give clear messages', async () => {
  ai.setClient(null); const saveKey = require('../src/config').anthropicApiKey; require('../src/config').anthropicApiKey = '';
  let res = await post('/math/word-problems/ai', { grade: '3', count: '4' });
  assert.strictEqual(res.status, 302); assert.match(res.headers.location, /^\/math\/word-problems\?/);
  assert.match((await agent.get(res.headers.location)).text, /not set up on this server/);
  require('../src/config').anthropicApiKey = saveKey;
  stub(['not json at all', 'still not json']);
  res = await post('/math/word-problems/ai', { grade: '3', count: '4' });
  assert.strictEqual(res.status, 302); assert.match((await agent.get(res.headers.location)).text, /could not produce problems/);
  // the form offers the AI button
  const form = await agent.get('/math/word-problems'); assert.match(form.text, /Write with AI/); assert.match(form.text, /name="format"/); assert.match(form.text, /pour together/);
});
