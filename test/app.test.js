'use strict';

const test = require('node:test');
const assert = require('node:assert');
const { request, db, createApp, resetDb, csrfFrom, createUser, login } = require('./helpers');

const app = createApp();
test.before(resetDb);
test.after(() => db.pool.end());

const PROTECTED = ['/', '/math/addition', '/math/decimals', '/math/fractions', '/math/fractions/worksheet?op=add&seed=3', '/math/addition/worksheet?digits=3', '/math/word-problems', '/reading/phonics', '/reading/phonics/worksheet?category=cvc&subtype=all',
  '/reading/sight-words', '/reading/sight-words/worksheet?list=primer', '/writing', '/writing/worksheet', '/admin/users', '/admin/audit', '/account/password'];

test('unauthenticated visitors only see login/register; everything else redirects to /login', async () => {
  for (const url of PROTECTED) {
    const res = await request(app).get(url);
    assert.strictEqual(res.status, 302, url);
    assert.strictEqual(res.headers.location, '/login', url);
  }
  assert.strictEqual((await request(app).get('/login')).status, 200);
  assert.strictEqual((await request(app).get('/register')).status, 200);
  assert.strictEqual((await request(app).get('/healthz')).status, 200);
  assert.strictEqual((await request(app).get('/nope')).status, 302);
  assert.strictEqual((await request(app).post('/logout')).status, 403); // no CSRF token
});

test('CSS and JS URLs are versioned so a stale cached stylesheet can never be paired with new pages', async () => {
  const html = (await request(app).get('/login')).text;
  const m = /\/static\/css\/app\.css\?v=([0-9a-f]{10})/.exec(html);
  assert.ok(m, 'stylesheet link has a content hash');
  assert.match(html, new RegExp(`/static/js/app\\.js\\?v=${m[1]}`));
  const css = await request(app).get(`/static/css/app.css?v=${m[1]}`);
  assert.strictEqual(css.status, 200);
  assert.match(css.headers['content-type'], /css/);
});

test('security headers and cookie flags', async () => {
  const res = await request(app).get('/login');
  assert.match(res.headers['content-security-policy'], /default-src 'self'/);
  assert.match(res.headers['content-security-policy'], /frame-ancestors 'none'/);
  assert.ok(res.headers['strict-transport-security']);
  assert.strictEqual(res.headers['x-content-type-options'], 'nosniff');
  assert.strictEqual(res.headers['x-powered-by'], undefined);
  assert.strictEqual(res.headers['cache-control'], 'no-store');
  const cookie = res.headers['set-cookie'].join(';');
  assert.match(cookie, /HttpOnly/i);
  assert.match(cookie, /SameSite=Lax/i);
});

test('registration creates a pending user and cannot sign in until approved', async () => {
  const agent = request.agent(app);
  const page = await agent.get('/register');
  const res = await agent.post('/register').type('form').send({ _csrf: csrfFrom(page.text), name: 'Teacher T', username: 'Teacher.T', password: 'a long safe passphrase' });
  assert.strictEqual(res.status, 200);
  const u = await db.one(`SELECT * FROM users WHERE lower(username) = 'teacher.t'`);
  assert.strictEqual(u.status, 'pending');
  assert.strictEqual(u.role, 'user');
  assert.notStrictEqual(u.password_hash, 'a long safe passphrase');

  const attempt = await login(request.agent(app), 'teacher.t', 'a long safe passphrase');
  assert.strictEqual(attempt.status, 401);
  assert.match(attempt.text, /waiting for admin approval/);

  // duplicate registration looks identical (no account enumeration) and does not overwrite
  const token = csrfFrom((await agent.get('/register')).text);
  const again = await agent.post('/register').type('form').send({ _csrf: token, name: 'Evil', username: 'teacher.t', password: 'another long passphrase' });
  assert.strictEqual(again.status, 422); // username taken: say so, never overwrite
  assert.match(again.text, /already taken/);
  assert.strictEqual((await db.one(`SELECT name FROM users WHERE lower(username) = 'teacher.t'`)).name, 'Teacher T');
});

test('registration rejects weak passwords and cannot self-assign role or status', async () => {
  const agent = request.agent(app);
  const page = await agent.get('/register');
  const weak = await agent.post('/register').type('form').send({ _csrf: csrfFrom(page.text), name: 'X', username: 'xuser', password: 'short', password2: 'short' });
  assert.strictEqual(weak.status, 422);
  await agent.post('/register').type('form').send({ _csrf: csrfFrom(page.text), name: 'Sneaky', username: 'sneaky', password: 'a long safe passphrase', role: 'admin', status: 'approved' });
  const u = await db.one(`SELECT role, status FROM users WHERE lower(username) = 'sneaky'`);
  assert.deepStrictEqual({ role: u.role, status: u.status }, { role: 'user', status: 'pending' });
});

test('CSRF: login without token is refused', async () => {
  const res = await request(app).post('/login').type('form').send({ username: 'a@b.co', password: 'x' });
  assert.strictEqual(res.status, 403);
});

test('approved user signs in, sees worksheets; admin pages are forbidden', async () => {
  await createUser({ username: 'u@example.com' });
  const agent = request.agent(app);
  const res = await login(agent, 'u@example.com');
  assert.strictEqual(res.status, 302);
  assert.strictEqual((await agent.get('/')).status, 200);
  const sheet = await agent.get('/math/addition/worksheet?digits=7&count=10&seed=5');
  assert.strictEqual(sheet.status, 200);
  assert.match(sheet.text, /7-digit addition/);
  assert.strictEqual((await agent.get('/admin/users')).status, 403);
  const csrf = csrfFrom((await agent.get('/')).text);
  assert.strictEqual((await agent.post('/admin/users/1/approve').type('form').send({ _csrf: csrf })).status, 403);
});

test('math worksheets paginate: 25 vertical / 15 horizontal per page, numbering continues, up to 50 (60 facts) allowed', async () => {
  const agent = request.agent(app);
  await login(agent, 'u@example.com');
  const count = (html, re) => (html.match(re) || []).length;
  const v = (await agent.get('/math/addition/worksheet?digits=3&count=50&seed=9&key=0')).text;
  assert.strictEqual(count(v, /<div class="vp">/g), 50);
  assert.strictEqual(count(v, /<ol class="problems vertical d3">/g), 2); // two pages of 25
  assert.match(v, /<span class="pn">26\.<\/span>/); // page 2 continues the numbering
  assert.strictEqual(count(v, /<span class="pn">25\.<\/span>/g), 1);
  const one = (await agent.get('/math/addition/worksheet?digits=3&count=25&seed=9&key=0')).text;
  assert.strictEqual(count(one, /<ol class="problems/g), 1);
  const small = (await agent.get('/math/addition/worksheet?digits=3&count=20&seed=9&key=0')).text;
  assert.strictEqual(count(small, /<ol class="problems/g), 1);
  const h = (await agent.get('/math/addition/worksheet?digits=3&count=40&layout=horizontal&seed=9&key=0')).text;
  assert.strictEqual(count(h, /<ol class="problems horizontal/g), 3); // 15 + 15 + 10
  assert.strictEqual(count(h, /class="hp"/g), 40);
  assert.strictEqual(count((await agent.get('/math/multiplication/worksheet?count=60&seed=9&key=0')).text, /<div class="vp">/g), 60);
  assert.match((await agent.get('/math/addition')).text, /<option[^>]*>50<\/option>/);
  // each page repeats the title and name/date header
  assert.strictEqual(count(v, /Name: <i class="blank">/g), 2);
});

test('every worksheet type renders for a signed-in user, and bad parameters fall back safely', async () => {
  const agent = request.agent(app);
  await login(agent, 'u@example.com');
  const urls = [
    '/math/addition/worksheet?digits=4&layout=horizontal', '/math/subtraction/worksheet?digits=6', '/math/multiplication/worksheet?factor=7', '/math/multiplication/worksheet?mode=mixed&layout=horizontal',
    '/math/division/worksheet?divisor=all', '/math/division/worksheet?mode=mixed', '/math/word-problems/worksheet?grade=5&kind=fraction&op=mixed',
    '/reading/phonics/worksheet?type=blends/l-blends&format=write', '/reading/phonics/worksheet?type=multisyllable', '/reading/sight-words/worksheet?list=nouns&format=cards', '/reading/sight-words/worksheet?list=third&format=trace',
    '/writing/worksheet?grade=3&type=narrative',
    '/math/addition/worksheet?digits=99&count=-5&seed=abc&layout=<script>', '/math/multiplication/worksheet?factor=999&mode[]=x',
  ];
  for (const u of urls) {
    const res = await agent.get(u).redirects(1);
    assert.strictEqual(res.status, 200, u);
    assert.ok(!/<script>/.test(res.text.replace(/<script src="[^"]+" defer><\/script>/, '')), `reflected markup in ${u}`);
  }
  assert.strictEqual((await agent.get('/reading/phonics/worksheet?type=bogus').redirects(1)).status, 422);
  assert.strictEqual((await agent.get('/reading/sight-words/worksheet?list=bogus').redirects(1)).status, 422);
  assert.strictEqual((await agent.get('/math/word-problems/worksheet?grade=1&kind=fraction').redirects(1)).status, 422);
  assert.strictEqual((await agent.get('/math/bogus')).status, 404);
});

test('lockout after repeated failures', async () => {
  await createUser({ username: 'lock@example.com' });
  const agent = request.agent(app);
  for (let i = 0; i < 5; i++) await login(agent, 'lock@example.com', 'wrong password!!');
  const res = await login(agent, 'lock@example.com'); // right password, but locked
  assert.strictEqual(res.status, 401);
  assert.match(res.text, /Too many failed attempts/);
});

test('admin approves a pending user; disabling kills their live session', async () => {
  const admin = await createUser({ username: 'admin@example.com', role: 'admin' });
  const pending = await createUser({ username: 'p@example.com', status: 'pending' });
  const adminAgent = request.agent(app);
  await login(adminAgent, 'admin@example.com');
  const csrf = csrfFrom((await adminAgent.get('/admin/users')).text);
  await adminAgent.post(`/admin/users/${pending.id}/approve`).type('form').send({ _csrf: csrf });
  assert.strictEqual((await db.one('SELECT status FROM users WHERE id=$1', [pending.id])).status, 'approved');

  const userAgent = request.agent(app);
  assert.strictEqual((await login(userAgent, 'p@example.com')).status, 302);
  assert.strictEqual((await userAgent.get('/math/addition')).status, 200);
  await adminAgent.post(`/admin/users/${pending.id}/disable`).type('form').send({ _csrf: csrf });
  const after = await userAgent.get('/math/addition');
  assert.strictEqual(after.status, 302);
  assert.strictEqual(after.headers.location, '/login');

  // the last admin cannot be demoted or disabled, not even by themselves
  await adminAgent.post(`/admin/users/${admin.id}/disable`).type('form').send({ _csrf: csrf });
  assert.strictEqual((await db.one('SELECT status FROM users WHERE id=$1', [admin.id])).status, 'approved');
});

test('admin password reset forces a change before anything else is reachable', async () => {
  const target = await createUser({ username: 'reset@example.com' });
  const adminAgent = request.agent(app);
  await login(adminAgent, 'admin@example.com');
  const csrf = csrfFrom((await adminAgent.get('/admin/users')).text);
  const res = await adminAgent.post(`/admin/users/${target.id}/reset-password`).type('form').send({ _csrf: csrf });
  assert.strictEqual(res.status, 302);
  const temp = /<code>([^<]+)<\/code>/.exec((await adminAgent.get('/admin/users')).text)[1];

  const agent = request.agent(app);
  const l = await login(agent, 'reset@example.com', temp);
  assert.strictEqual(l.headers.location, '/account/password');
  assert.strictEqual((await agent.get('/math/addition')).headers.location, '/account/password');
  const c2 = csrfFrom((await agent.get('/account/password')).text);
  const change = await agent.post('/account/password').type('form').send({ _csrf: c2, current_password: temp, new_password: 'brand new passphrase!', new_password2: 'brand new passphrase!' });
  assert.strictEqual(change.status, 302);
  assert.strictEqual((await agent.get('/math/addition')).status, 200);
});

test('SQL-injection style input in login does not authenticate', async () => {
  const agent = request.agent(app);
  const res = await login(agent, `' OR '1'='1' --`, `' OR '1'='1' --`);
  assert.strictEqual(res.status, 401);
});

test('admins see a pending-request banner; regular users do not', async () => {
  await createUser({ username: 'waiting@example.com', status: 'pending' });
  const adminAgent = request.agent(app);
  await login(adminAgent, 'admin@example.com');
  assert.match((await adminAgent.get('/')).text, /access request[s]? waiting/);
  assert.match((await adminAgent.get('/')).text, /\/admin\/users\?status=pending/);
  const userAgent = request.agent(app);
  await login(userAgent, 'u@example.com');
  assert.doesNotMatch((await userAgent.get('/')).text, /access request/);
});

test('registration asks only for name, username and password', async () => {
  const html = (await request(app).get('/register')).text;
  assert.match(html, /name="name"/);
  assert.match(html, /name="username"/);
  assert.match(html, /name="password"/);
  assert.doesNotMatch(html, /name="email"|name="password2"|name="request_note"/);
  const agent = request.agent(app);
  const page = await agent.get('/register');
  const bad = await agent.post('/register').type('form').send({ _csrf: csrfFrom(page.text), name: 'N', username: 'a b!', password: 'a long safe passphrase' });
  assert.strictEqual(bad.status, 422);
  assert.match(bad.text, /Username must be/);
  const pwInName = await agent.post('/register').type('form').send({ _csrf: csrfFrom(page.text), name: 'N', username: 'jessica', password: 'my-jessica-is-great' });
  assert.match(pwInName.text, /must not contain your username/);
  // usernames are case-insensitive for sign-in
  await createUser({ username: 'MixedCase' });
  assert.strictEqual((await login(request.agent(app), 'mixedcase')).status, 302);
});

test('home page shows a pep talk chosen at sign-in, stable until the next sign-in', async () => {
  const { GREETINGS } = require('../src/lib/greetings');
  const agent = request.agent(app);
  await login(agent, 'u@example.com');
  const grab = (html) => /<p class="greeting">([^<]+)<\/p>/.exec(html)[1].replace(/&#39;/g, "'").replace(/&#34;/g, '"').replace(/&amp;/g, '&');
  const first = grab((await agent.get('/')).text);
  const second = grab((await agent.get('/')).text);
  assert.strictEqual(first, second);
  assert.ok(GREETINGS.some((g) => g.text === first), first);
});

test('greeting levels: mild never swears, off shows nothing', () => {
  const { pick, GREETINGS } = require('../src/lib/greetings');
  const rude = /\b(bitch|ass|damn|hell|badass|ass-kicker|damns)\b/i;
  for (let i = 0; i < 300; i++) assert.doesNotMatch(pick('mild'), rude);
  assert.strictEqual(pick('off'), null);
  assert.ok(GREETINGS.filter((g) => g.spicy).every((g) => rude.test(g.text)), 'spicy greetings should be the swear ones');
  assert.ok(GREETINGS.filter((g) => !g.spicy).every((g) => !rude.test(g.text)), 'mild greetings must be clean');
  assert.ok(GREETINGS.some((g) => g.text === 'Make this day your bitch!'));
});

test('multi-digit multiplication and division worksheets render with the right headings and work space', async () => {
  const agent = request.agent(app);
  await login(agent, 'u@example.com');
  const m = (await agent.get('/math/multiplication/worksheet?mode=multi&top=4&bottom=2&count=12&seed=4')).text;
  assert.match(m, /Multiplication: 4-digit number × 2-digit number/);
  assert.match(m, /class="rule w2"/);
  const m1 = (await agent.get('/math/multiplication/worksheet?mode=multi&top=3&bottom=1&count=12&seed=4')).text;
  assert.match(m1, /3-digit number × 1-digit number/);
  assert.doesNotMatch(m1, /class="rule w2"/);
  const d = (await agent.get('/math/division/worksheet?mode=multi&dividend=4&vdigits=2&remainders=with&count=12&seed=4')).text;
  assert.match(d, /Division: 4-digit dividend ÷ 2-digit divisor, with remainders/);
  assert.match(d, /class="div-bracket w3"/);
  assert.match(d, / R \d+/); // answer key shows remainders
  assert.match((await agent.get('/math/division/worksheet?mode=multi&dividend=bogus&vdigits=9&remainders=x&seed=4')).text, /3-digit dividend ÷ 1-digit divisor, with and without remainders/); // bad params fall back safely
  const form = (await agent.get('/math/division')).text;
  assert.match(form, /name="dividend"/);
  assert.match(form, /name="remainders"/);
  assert.match((await agent.get('/math/multiplication')).text, /name="top"/);
});

test('x0/x1 and ÷1/÷10 option: checkbox on the forms, honoured on the sheet', async () => {
  const agent = request.agent(app);
  await login(agent, 'u@example.com');
  const mf = (await agent.get('/math/multiplication')).text;
  assert.match(mf, /type="hidden" name="special" value="0"/);
  assert.match(mf, /Include multiplying by 0 and 1/);
  assert.match((await agent.get('/math/division')).text, /Include dividing by 1 and 10/);
  assert.match((await agent.get('/math/multiplication?special=0')).text, /name="special" value="1" >/); // unchecked when turned off
  const on = (await agent.get('/math/multiplication/worksheet?mode=multi&top=1&bottom=1&count=50&seed=3&special=0&special=1')).text;
  assert.doesNotMatch(on, /no ×0 or ×1/);
  const off = (await agent.get('/math/multiplication/worksheet?mode=multi&top=1&bottom=1&count=50&seed=3&special=0')).text;
  assert.match(off, /\(no ×0 or ×1\)/);
  assert.doesNotMatch(off.slice(off.indexOf('<ol class="problems')), /<span class="n">[01]<\/span>/);
  assert.match((await agent.get('/math/division/worksheet?special=0&seed=3')).text, /\(no ÷1 or ÷10\)/);
});

test('word problems: difficulty setting on the form and on the sheet', async () => {
  const agent = request.agent(app);
  await login(agent, 'u@example.com');
  const form = (await agent.get('/math/word-problems')).text;
  assert.match(form, /name="level"/);
  assert.match(form, /value="challenge"/);
  const std = (await agent.get('/math/word-problems/worksheet?grade=4&level=standard&seed=8&count=10')).text;
  assert.doesNotMatch(std, /\(challenge\)/);
  const ch = (await agent.get('/math/word-problems/worksheet?grade=4&level=challenge&seed=8&count=10')).text;
  assert.match(ch, /Grade 4 word problems \(challenge\)/);
  assert.strictEqual(((await agent.get('/math/word-problems/worksheet?grade=3&level=bogus&seed=8')).status), 200); // bad value falls back to mixed
  // every grade/number-type/difficulty combination either works or explains itself, and never shows a stack trace
  for (let g = 1; g <= 5; g++) for (const kind of ['whole', 'decimal', 'fraction', 'mixed']) for (const level of ['mixed', 'standard', 'challenge']) {
    const res = await agent.get(`/math/word-problems/worksheet?grade=${g}&kind=${kind}&level=${level}&seed=5&count=12`);
    assert.ok([200, 422].includes(res.status), `${g} ${kind} ${level}: ${res.status}`);
    if (res.status === 200) assert.ok((res.text.match(/class="workspace"/g) || []).length >= 1);
  }
});
