'use strict';

process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = process.env.TEST_DATABASE_URL || 'postgres://localhost/kds_test';
if (!/test/i.test(new URL(process.env.DATABASE_URL).pathname)) {
  throw new Error('Refusing to run tests: TEST_DATABASE_URL database name must contain "test" (the schema is dropped).');
}
process.env.SESSION_SECRET = 'test-secret';

const request = require('supertest');
const db = require('../src/db');
const pw = require('../src/lib/password');
const { migrate } = require('../src/db/migrate');
const { createApp } = require('../src/app');

async function resetDb() {
  await db.query('DROP SCHEMA public CASCADE; CREATE SCHEMA public;');
  await migrate({ log: () => {} });
}

const csrfFrom = (html) => {
  const m = /name="_csrf" value="([^"]+)"/.exec(html);
  if (!m) throw new Error('No CSRF token in page');
  return m[1];
};

async function createUser({ username, name = 'User', password = 'correct horse battery', role = 'user', status = 'approved' }) {
  return db.one('INSERT INTO users (username, name, password_hash, role, status) VALUES ($1,$2,$3,$4,$5) RETURNING *', [username, name, await pw.hash(password), role, status]);
}

async function login(agent, username, password = 'correct horse battery') {
  const page = await agent.get('/login');
  return agent.post('/login').type('form').send({ _csrf: csrfFrom(page.text), username, password });
}

module.exports = { request, db, createApp, resetDb, csrfFrom, createUser, login };
