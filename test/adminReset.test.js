'use strict';
const test = require('node:test');
const assert = require('node:assert');
const { request, db, createApp, resetDb, createUser, login } = require('./helpers');
const config = require('../src/config');
const { bootstrapAdmin } = require('../src/server');

test('ADMIN_RESET_PASSWORD recovers a locked-out admin, forces a new password, and is audited', async () => {
  await resetDb();
  await createUser({ username: 'boss', role: 'admin', password: 'forgotten passphrase here' });
  await db.query(`UPDATE users SET failed_attempts = 9, locked_until = now() + interval '1 hour' WHERE username = 'boss'`);
  Object.assign(config.bootstrapAdmin, { username: 'boss', password: 'brand new temp passphrase', reset: false });
  const warn = console.warn; console.warn = () => {};
  try {
    // without the switch nothing changes: the env password is ignored for an existing account
    await bootstrapAdmin();
    let agent = request.agent(createApp());
    assert.notStrictEqual((await login(agent, 'boss', 'brand new temp passphrase')).headers.location, '/');
    // a too-weak password with the switch on changes nothing
    config.bootstrapAdmin.reset = true; config.bootstrapAdmin.password = 'short';
    await bootstrapAdmin();
    assert.strictEqual((await db.one(`SELECT failed_attempts FROM users WHERE username = 'boss'`)).failed_attempts, 9);
    // the real reset
    config.bootstrapAdmin.password = 'brand new temp passphrase';
    await bootstrapAdmin();
  } finally { console.warn = warn; config.bootstrapAdmin.reset = false; }
  const u = await db.one(`SELECT * FROM users WHERE username = 'boss'`);
  assert.strictEqual(u.must_change_password, true);
  assert.strictEqual(u.failed_attempts, 0);
  assert.strictEqual(u.locked_until, null);
  const agent = request.agent(createApp());
  const res = await login(agent, 'boss', 'brand new temp passphrase');
  assert.strictEqual(res.headers.location, '/account/password');
  assert.ok(await db.one(`SELECT 1 FROM audit_log WHERE action = 'admin_password_reset_by_env'`));
});

test('admin bootstrap finds the account by email when the username differs, and never crashes on a clash', async () => {
  await resetDb();
  await db.query(`INSERT INTO users (username, email, name, password_hash, role, status) VALUES ('oldadmin', 'boss@example.com', 'Boss', 'x', 'admin', 'approved')`);
  Object.assign(config.bootstrapAdmin, { username: 'admin', email: 'boss@example.com', password: 'another temp passphrase', reset: true });
  const warn = console.warn; console.warn = () => {};
  try { await bootstrapAdmin(); } finally { console.warn = warn; config.bootstrapAdmin.reset = false; }
  assert.strictEqual((await db.one('SELECT count(*)::int AS n FROM users')).n, 1, 'no second account is created');
  const agent = request.agent(createApp());
  assert.strictEqual((await login(agent, 'oldadmin', 'another temp passphrase')).headers.location, '/account/password');
  Object.assign(config.bootstrapAdmin, { username: null, email: null, password: undefined });
});
