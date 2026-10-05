'use strict';

const test = require('node:test');
const assert = require('node:assert');
const { request, db, createApp, resetDb, csrfFrom, createUser, login } = require('./helpers');

const app = createApp();
test.before(resetDb);
test.after(() => db.pool.end());

const PROTECTED = ['/', '/math/addition', '/math/addition/worksheet?digits=3', '/math/word-problems', '/reading/phonics', '/reading/phonics/worksheet?type=cvc',
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
  const res = await agent.post('/register').type('form').send({ _csrf: csrfFrom(page.text), name: 'Teacher T', email: 'T@Example.com', password: 'a long safe passphrase', password2: 'a long safe passphrase' });
  assert.strictEqual(res.status, 200);
  const u = await db.one(`SELECT * FROM users WHERE email = 't@example.com'`);
  assert.strictEqual(u.status, 'pending');
  assert.strictEqual(u.role, 'user');
  assert.notStrictEqual(u.password_hash, 'a long safe passphrase');

  const attempt = await login(request.agent(app), 't@example.com', 'a long safe passphrase');
  assert.strictEqual(attempt.status, 401);
  assert.match(attempt.text, /waiting for admin approval/);

  // duplicate registration looks identical (no account enumeration) and does not overwrite
  const token = csrfFrom((await agent.get('/register')).text);
  const again = await agent.post('/register').type('form').send({ _csrf: token, name: 'Evil', email: 't@example.com', password: 'another long passphrase', password2: 'another long passphrase' });
  assert.strictEqual(again.status, 200);
  assert.strictEqual((await db.one(`SELECT name FROM users WHERE email = 't@example.com'`)).name, 'Teacher T');
});

test('registration rejects weak passwords and cannot self-assign role or status', async () => {
  const agent = request.agent(app);
  const page = await agent.get('/register');
  const weak = await agent.post('/register').type('form').send({ _csrf: csrfFrom(page.text), name: 'X', email: 'x@example.com', password: 'short', password2: 'short' });
  assert.strictEqual(weak.status, 422);
  await agent.post('/register').type('form').send({ _csrf: csrfFrom(page.text), name: 'Sneaky', email: 'sneaky@example.com', password: 'a long safe passphrase', password2: 'a long safe passphrase', role: 'admin', status: 'approved' });
  const u = await db.one(`SELECT role, status FROM users WHERE email = 'sneaky@example.com'`);
  assert.deepStrictEqual({ role: u.role, status: u.status }, { role: 'user', status: 'pending' });
});

test('CSRF: login without token is refused', async () => {
  const res = await request(app).post('/login').type('form').send({ email: 'a@b.co', password: 'x' });
  assert.strictEqual(res.status, 403);
});

test('approved user signs in, sees worksheets; admin pages are forbidden', async () => {
  await createUser({ email: 'u@example.com' });
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
  await createUser({ email: 'lock@example.com' });
  const agent = request.agent(app);
  for (let i = 0; i < 5; i++) await login(agent, 'lock@example.com', 'wrong password!!');
  const res = await login(agent, 'lock@example.com'); // right password, but locked
  assert.strictEqual(res.status, 401);
  assert.match(res.text, /Too many failed attempts/);
});

test('admin approves a pending user; disabling kills their live session', async () => {
  const admin = await createUser({ email: 'admin@example.com', role: 'admin' });
  const pending = await createUser({ email: 'p@example.com', status: 'pending' });
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
  const target = await createUser({ email: 'reset@example.com' });
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
  await createUser({ email: 'waiting@example.com', status: 'pending' });
  const adminAgent = request.agent(app);
  await login(adminAgent, 'admin@example.com');
  assert.match((await adminAgent.get('/')).text, /access request[s]? waiting/);
  assert.match((await adminAgent.get('/')).text, /\/admin\/users\?status=pending/);
  const userAgent = request.agent(app);
  await login(userAgent, 'u@example.com');
  assert.doesNotMatch((await userAgent.get('/')).text, /access request/);
});
