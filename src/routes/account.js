'use strict';

const express = require('express');
const db = require('../db');
const pw = require('../lib/password');
const { audit } = require('../lib/audit');
const { passwordLimiter } = require('../lib/limits');
const { dropSessions } = require('../lib/sessions');

const router = express.Router();

router.get('/account/password', (req, res) => {
  res.render('account/password', { title: 'Change password', errors: [], forced: req.user.must_change_password });
});

router.post('/account/password', passwordLimiter, async (req, res) => {
  const row = await db.one('SELECT * FROM users WHERE id = $1', [req.user.id]);
  const errors = [];
  const next = String(req.body.new_password || '');
  if (!(await pw.verify(String(req.body.current_password || '').slice(0, 200), row.password_hash))) errors.push('Your current password is incorrect.');
  const problem = pw.passwordProblem(next, row);
  if (problem) errors.push(problem);
  if (next !== String(req.body.new_password2 || '')) errors.push('New passwords do not match.');
  if (next && next === req.body.current_password) errors.push('Choose a password you have not used for this account.');
  if (errors.length) return res.status(422).render('account/password', { title: 'Change password', errors, forced: req.user.must_change_password });

  await db.query('UPDATE users SET password_hash = $2, must_change_password = false, updated_at = now() WHERE id = $1', [req.user.id, await pw.hash(next)]);
  await dropSessions(req.user.id, req.sessionID); // sign out every other device
  await audit(req, 'password_changed', 'user', req.user.id);
  req.flash('ok', 'Password updated.');
  res.redirect('/');
});

module.exports = router;
