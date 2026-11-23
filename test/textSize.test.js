'use strict';
// Accessibility: one readable typeface everywhere (self-hosted Andika) and a reader-chosen text size.
const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const { request, db, createApp, resetDb, createUser, login } = require('./helpers');

let agent;
test.before(async () => { await resetDb(); await createUser({ username: 't@example.com', name: 'Teacher' }); agent = request.agent(createApp()); await login(agent, 't@example.com'); });
test.after(async () => { await db.pool.end(); });

const css = fs.readFileSync(path.join(__dirname, '..', 'public', 'css', 'app.css'), 'utf8');

test('one dyslexia-friendly typeface for the site and every worksheet, served from our own server', () => {
  assert.match(css, /--font: "Andika"/);
  assert.ok(!/Arial|Trebuchet|Impact/.test(css), 'no hard-coded fonts left');
  assert.ok(!/font-style: italic/.test(css) && !/text-transform: uppercase/.test(css), 'no italics or all-caps');
  for (const f of ['andika-latin-400-normal', 'andika-latin-700-normal']) assert.ok(fs.existsSync(path.join(__dirname, '..', 'public', 'fonts', f + '.woff2')), f);
  assert.ok(fs.existsSync(path.join(__dirname, '..', 'public', 'fonts', 'ANDIKA-OFL.txt')));
});

test('the header offers four text sizes and the saved choice is drawn on the first paint', async () => {
  const std = await agent.get('/');
  assert.match(std.text, /<html lang="en" class="ts-1">/);
  for (const n of [1, 2, 3, 4]) assert.match(std.text, new RegExp(`data-ts="${n}"`));
  const big = await agent.get('/').set('Cookie', 'ts=3');
  assert.match(big.text, /class="ts-3"/);
  assert.match(big.text, /data-ts="3" aria-pressed="true"/);
  assert.match((await agent.get('/').set('Cookie', 'ts=9')).text, /class="ts-1"/); // anything else is ignored
});

test('fixed-grid math sheets cancel the zoom (they have their own font size), reading sheets scale; math form defaults follow the choice', async () => {
  assert.match((await agent.get('/math/addition/worksheet?seed=1')).text, /class="sheet fixed"/);
  assert.ok(!/class="sheet fixed"/.test((await agent.get('/reading/phonics/worksheet?category=cvc&subtype=all&seed=1')).text));
  assert.match(css, /html\.ts-3 body \{ zoom: 1\.5; \}/);
  assert.match(css, /html\.ts-3 \.sheet\.fixed \{ zoom: \.6666667; \}/);
  const form = await agent.get('/math/addition').set('Cookie', 'ts=4');
  assert.match(form.text, /<option value="largest" selected>/);
});
