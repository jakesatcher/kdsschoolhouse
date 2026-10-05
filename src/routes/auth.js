'use strict';

const express = require('express');
const db = require('../db');
const pw = require('../lib/password');
const { audit } = require('../lib/audit');
const { loginLimiter, registerLimiter } = require('../lib/limits');
const { safeReturnTo } = require('../middleware/auth');
const config = require('../config');
const greetings = require('../lib/greetings');

const router = express.Router();

const USERNAME_RE = /^[A-Za-z0-9][A-Za-z0-9._@-]{2,39}$/;
const MAX_FAILS = 5;
const LOCK_MINUTES = 15;

function regenerate(req) {
  return new Promise((resolve, reject) => {
    const keep = { flash: req.session.flash, returnTo: req.session.returnTo };
    req.session.regenerate((err) => {
      if (err) return reject(err);
      Object.assign(req.session, keep);
      resolve();
    });
  });
}

router.get('/login', (req, res) => {
  if (req.user) return res.redirect('/');
  res.render('auth/login', { title: 'Sign in', username: '' });
});

router.post('/login', loginLimiter, async (req, res) => {
  const username = String(req.body.username || '').trim().slice(0, 100);
  const password = String(req.body.password || '');
  const fail = (msg = 'Incorrect username or password.') => {
    res.status(401).render('auth/login', { title: 'Sign in', username, error: msg });
  };

  const user = await db.one('SELECT * FROM users WHERE lower(username) = lower($1)', [username]);
  if (user && user.locked_until && new Date(user.locked_until) > new Date()) {
    await pw.verify(password, user.password_hash); // keep timing uniform
    return fail('Too many failed attempts. Try again in a few minutes.');
  }
  const ok = await pw.verify(password.slice(0, 200), user ? user.password_hash : pw.DUMMY_HASH);
  if (!user || !ok) {
    if (user) {
      const attempts = user.failed_attempts + 1;
      const lock = attempts >= MAX_FAILS;
      await db.query(
        `UPDATE users SET failed_attempts = $2, locked_until = CASE WHEN $3 THEN now() + make_interval(mins => $4) ELSE locked_until END WHERE id = $1`,
        [user.id, lock ? 0 : attempts, lock, LOCK_MINUTES]
      );
      await audit({ ip: req.ip }, lock ? 'login_locked' : 'login_failed', 'user', user.id);
    }
    return fail();
  }
  if (user.status === 'pending') return fail('Your account is waiting for admin approval. You will be able to sign in once it is approved.');
  if (user.status !== 'approved') return fail('This account cannot sign in. Please contact an administrator.');

  const returnTo = safeReturnTo(req.session.returnTo);
  await regenerate(req); // new session id on privilege change (session fixation defence)
  req.session.userId = user.id;
  req.session.greeting = greetings.pick(config.greetingLevel); // a fresh pep talk each sign-in
  await db.query('UPDATE users SET failed_attempts = 0, locked_until = NULL, last_login_at = now() WHERE id = $1', [user.id]);
  await audit({ ip: req.ip, user: { id: user.id } }, 'login', 'user', user.id);
  res.redirect(user.must_change_password ? '/account/password' : returnTo);
});

router.get('/register', (req, res) => {
  if (req.user) return res.redirect('/');
  res.render('auth/register', { title: 'Request access', values: {}, errors: [] });
});

router.post('/register', registerLimiter, async (req, res) => {
  const values = {
    name: String(req.body.name || '').trim().slice(0, 100),
    username: String(req.body.username || '').trim().slice(0, 40),
  };
  const password = String(req.body.password || '');
  const errors = [];
  if (!values.name) errors.push('Name is required.');
  if (!USERNAME_RE.test(values.username)) errors.push('Username must be 3 to 40 characters: letters, numbers, and . _ - @ (starting with a letter or number).');
  const pwErr = pw.passwordProblem(password, values);
  if (pwErr) errors.push(pwErr);
  const fail = (list) => res.status(422).render('auth/register', { title: 'Request access', values, errors: list });
  if (errors.length) return fail(errors);

  // Usernames are shown as taken so people can pick another (registration is rate-limited and needs approval).
  const created = await db.one(
    `INSERT INTO users (username, name, password_hash) VALUES ($1,$2,$3) ON CONFLICT DO NOTHING RETURNING id`,
    [values.username, values.name, await pw.hash(password)]
  );
  if (!created) return fail(['That username is already taken. Please choose another.']);
  await audit({ ip: req.ip }, 'register', 'user', created.id);
  res.render('auth/registered', { title: 'Request received' });
});

router.post('/logout', (req, res, next) => {
  req.session.destroy((err) => {
    if (err) return next(err);
    res.clearCookie('kds.sid');
    res.redirect('/login');
  });
});

module.exports = router;
