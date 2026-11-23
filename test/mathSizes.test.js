'use strict';
// Font size (Regular / Larger / Largest) with matching problems per page, Fast Facts (50 per page), and the bracket markup.
const test = require('node:test');
const assert = require('node:assert');
const { request, db, createApp, resetDb, createUser, login } = require('./helpers');
const sheets = require('../src/lib/sheets');

let agent;
test.before(async () => { await resetDb(); await createUser({ username: 't@example.com', name: 'Teacher' }); agent = request.agent(createApp()); await login(agent, 't@example.com'); });
test.after(() => db.pool.end());

const count = (html, re) => (html.match(re) || []).length;
const pages = (html) => count(html, /<article class="sheet fixed">/g);
const olClass = (html) => (/<ol class="problems ([^"]*)"/.exec(html) || [])[1] || '';

test('grid sheets: larger type means fewer problems per page, with matching grid classes', async () => {
  const get = (q) => agent.get(`/math/addition/worksheet?digits=3&count=50&key=0&seed=3&${q}`);
  for (const [size, per, cls] of [['regular', 25, ''], ['larger', 16, 'cols-4 rows-4 fs-24'], ['largest', 9, 'cols-3 rows-3 fs-30']]) {
    const html = (await get(`size=${size}&layout=vertical`)).text;
    assert.strictEqual(pages(html), Math.ceil(50 / per), size); assert.strictEqual(count(html, /<li><span class="pn">/g), 50);
    assert.strictEqual(count(html.split('</article>')[0], /<li><span class="pn">/g), per, `${size} first page`);
    if (cls) assert.ok(olClass(html).includes(cls), olClass(html)); else assert.ok(!/cols-|fs-/.test(olClass(html)));
  }
  for (const [size, per] of [['regular', 15], ['larger', 10], ['largest', 6]]) {
    const html = (await get(`size=${size}&layout=horizontal`)).text;
    assert.strictEqual(count(html.split('</article>')[0], /<li><span class="pn">/g), per, `${size} horizontal`);
  }
  assert.ok(olClass((await get('size=bogus&layout=vertical')).text) === 'vertical d3', 'unknown size falls back to regular');
});

test('multiplication and division facts, decimals, fractions and word problems all take the size', async () => {
  const first = async (path) => (await agent.get(path)).text.split('</article>')[0];
  assert.strictEqual(count(await first('/math/multiplication/worksheet?mode=facts&count=40&size=regular&key=0&seed=2'), /<span class="pn">/g), 20);
  assert.strictEqual(count(await first('/math/multiplication/worksheet?mode=facts&count=40&size=larger&key=0&seed=2'), /<span class="pn">/g), 12);
  assert.strictEqual(count(await first('/math/division/worksheet?mode=facts&count=40&size=largest&layout=horizontal&key=0&seed=2'), /<span class="pn">/g), 8);
  assert.strictEqual(count(await first('/math/decimals/worksheet?op=add&count=30&size=larger&key=0&seed=2'), /<span class="pn">/g), 16);
  assert.strictEqual(count(await first('/math/fractions/worksheet?op=add&count=30&size=largest&key=0&seed=2'), /<span class="pn">/g), 9);
  assert.match((await agent.get('/math/word-problems/worksheet?grade=3&size=largest&count=5&key=0&seed=2')).text, /words-problems wp-largest/);
  assert.match((await agent.get('/math/word-problems/worksheet?grade=3&count=5&key=0&seed=2')).text, /words-problems wp-regular/);
  const pv = (size) => agent.get(`/math/place-value/worksheet?grade=5&count=12&size=${size}&key=0&seed=2`);
  assert.strictEqual(pages((await pv('regular')).text), 1); assert.strictEqual(pages((await pv('larger')).text), 2); assert.strictEqual(pages((await pv('largest')).text), 2);
  assert.match((await pv('largest')).text, /nsz-largest/);
  assert.strictEqual(count((await agent.get('/math/rounding/worksheet?grade=4&place=3&count=20&size=larger&key=0&seed=2')).text, /<article class="sheet fixed">/g), 2);
});

test('the form offers Regular, Larger and Largest for math problem pages, and not for fast facts or spiral review', async () => {
  for (const t of ['addition', 'subtraction', 'multiplication', 'division', 'decimals', 'fractions', 'word-problems', 'place-value', 'rounding']) {
    const html = (await agent.get(`/math/${t}`)).text;
    assert.match(html, /name="size"/, t); assert.match(html, /<option value="larger"/); assert.match(html, /<option value="largest"/);
  }
  for (const t of ['fast-facts-multiplication', 'fast-facts-division', 'spiral-review']) assert.doesNotMatch((await agent.get(`/math/${t}`)).text, /name="size"/, t);
  const home = (await agent.get('/')).text; assert.match(home, /fast-facts-multiplication/); assert.match(home, /fast-facts-division/);
});

test('Fast Facts: 50 problems a page, one tab for multiplication and one for division', async () => {
  assert.ok(sheets.MATH_TYPES['fast-facts-multiplication'] && sheets.MATH_TYPES['fast-facts-division']);
  for (const t of ['fast-facts-multiplication', 'fast-facts-division']) {
    const f = await agent.get(`/math/${t}`); assert.strictEqual(f.status, 200); assert.match(f.text, /50 problems/); assert.match(f.text, /name="range"/); assert.match(f.text, /name="pages"/);
  }
  const m = (await agent.get('/math/fast-facts-multiplication/worksheet?range=10&pages=2&layout=horizontal&key=1&seed=5')).text;
  assert.strictEqual(pages(m), 2); assert.strictEqual(count(m, /<span class="pn">/g), 100); assert.match(m, /problems horizontal d2 facts fast/); assert.match(m, /Answer Key/); assert.match(m, /Fast Facts Worksheet/);
  const nums = [...m.matchAll(/<div class="hp">(\d+) × (\d+) =/g)].map((x) => [Number(x[1]), Number(x[2])]);
  assert.strictEqual(nums.length, 100); assert.ok(nums.every(([a, b]) => a <= 10 && b <= 10), '0-10 only');
  const first50 = nums.slice(0, 50).map(([a, b]) => [a, b].sort((x, y) => x - y).join('x')); assert.strictEqual(new Set(first50).size, 50, 'no repeated fact on a page');
  const d = (await agent.get('/math/fast-facts-division/worksheet?range=12&layout=vertical&key=1&seed=5')).text;
  assert.strictEqual(pages(d), 1); assert.strictEqual(count(d, /<span class="pn">/g), 50); assert.match(d, /div-bracket/);
  for (const x of d.matchAll(/<span class="divisor">(\d+)<\/span><span class="dividend">([\d,]+)<\/span>/g)) { const dv = Number(x[1]); assert.ok(dv >= 1 && dv <= 12); assert.strictEqual(Number(x[2].replace(/,/g, '')) % dv, 0); }
  const seven = (await agent.get('/math/fast-facts-multiplication/worksheet?factor=7&range=12&layout=horizontal&key=0&seed=2')).text;
  assert.ok([...seven.matchAll(/<div class="hp">(\d+) × (\d+) =/g)].every((x) => x[1] === '7' || x[2] === '7'));
  const noDivZero = (await agent.get('/math/fast-facts-division/worksheet?factor=0&layout=horizontal&key=0&seed=2')).text; assert.ok(![...noDivZero.matchAll(/÷ 0 =/g)].length);
  assert.strictEqual((await agent.get('/math/fast-facts-multiplication/worksheet?pages=99&layout=horizontal&key=0&seed=2')).text.match(/<article class="sheet fixed">/g).length, 1, 'an invalid page count falls back to one page');
  assert.strictEqual(count((await agent.get('/math/fast-facts-multiplication/worksheet?key=0&seed=2')).text, /problems horizontal/g), 1, 'across is the default');
});

test('easy facts (0 and 1) and big facts (11 and 12) are thinned out on a mixed sheet', () => {
  const math = require('../src/lib/generators/math'); const { makeRng } = require('../src/lib/generators/rng');
  let easy = 0; let big = 0; let total = 0;
  for (let s = 1; s <= 60; s++) for (const p of math.multiplication(makeRng(s), { range: '12', count: 50 })) { total++; if (p.operands.some((n) => n <= 1)) easy++; if (p.operands.some((n) => n >= 11)) big++; }
  assert.ok(easy / total < 0.25, `0s and 1s are ${(easy / total).toFixed(2)}`); assert.ok(big / total < 0.2, `11s and 12s are ${(big / total).toFixed(2)}`); assert.ok(easy > 0 && big > 0);
});

test('the long-division bracket is drawn around the numbers only, so it grows with the type', () => {
  const css = require('fs').readFileSync(require('path').join(__dirname, '..', 'public', 'css', 'app.css'), 'utf8');
  const rule = /\.div-bracket \.dividend \{([^}]*)\}/.exec(css)[1];
  assert.match(rule, /padding: [\d.]+em/); assert.doesNotMatch(rule, /var\(--space\)|var\(--lh\)/, 'work space is outside the bracket');
  assert.match(css, /\.div-bracket \{[^}]*margin-bottom: var\(--space\)/);
});
