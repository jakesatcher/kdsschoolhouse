'use strict';

const express = require('express');
const db = require('../db');
const pw = require('../lib/password');
const { tempPassword } = require('../lib/crypto');
const { audit } = require('../lib/audit');
const { dropSessions } = require('../lib/sessions');
const { requireAdmin } = require('../middleware/auth');

const router = express.Router();
router.use(requireAdmin);

const STATUSES = ['pending', 'approved', 'rejected', 'disabled'];

router.get('/', (req, res) => res.redirect('/admin/users'));

router.get('/users', async (req, res) => {
  const filter = STATUSES.includes(req.query.status) ? req.query.status : null;
  const users = await db.many(
    `SELECT id, email, name, role, status, request_note, last_login_at, created_at FROM users
     WHERE ($1::text IS NULL OR status = $1) ORDER BY (status = 'pending') DESC, created_at DESC LIMIT 500`,
    [filter]
  );
  const counts = Object.fromEntries((await db.many('SELECT status, count(*)::int AS n FROM users GROUP BY status')).map((r) => [r.status, r.n]));
  const tempPw = req.session.tempPw || null; // shown once, then discarded
  delete req.session.tempPw;
  res.render('admin/users', { title: 'Users', users, filter, counts, tempPw });
});

async function adminCount() {
  return (await db.one(`SELECT count(*)::int AS n FROM users WHERE role = 'admin' AND status = 'approved'`)).n;
}

router.post('/users/:id/:action', async (req, res) => {
  const id = Number(req.params.id);
  const action = req.params.action;
  const target = Number.isInteger(id) ? await db.one('SELECT * FROM users WHERE id = $1', [id]) : null;
  if (!target) return res.status(404).render('error', { title: 'Not found', message: 'That user does not exist.' });

  const self = target.id === req.user.id;
  const losesAdmin = target.role === 'admin' && target.status === 'approved';
  if (self && ['reject', 'disable', 'make-user'].includes(action)) {
    req.flash('error', 'You cannot remove your own admin access.');
    return res.redirect('/admin/users');
  }
  if (losesAdmin && ['reject', 'disable', 'make-user'].includes(action) && (await adminCount()) <= 1) {
    req.flash('error', 'There must be at least one approved admin.');
    return res.redirect('/admin/users');
  }

  switch (action) {
    case 'approve':
    case 'enable':
      await db.query(`UPDATE users SET status = 'approved', approved_at = now(), approved_by = $2, failed_attempts = 0, locked_until = NULL, updated_at = now() WHERE id = $1`, [id, req.user.id]);
      break;
    case 'reject':
      await db.query(`UPDATE users SET status = 'rejected', updated_at = now() WHERE id = $1`, [id]);
      await dropSessions(id);
      break;
    case 'disable':
      await db.query(`UPDATE users SET status = 'disabled', updated_at = now() WHERE id = $1`, [id]);
      await dropSessions(id);
      break;
    case 'make-admin':
      await db.query(`UPDATE users SET role = 'admin', updated_at = now() WHERE id = $1`, [id]);
      break;
    case 'make-user':
      await db.query(`UPDATE users SET role = 'user', updated_at = now() WHERE id = $1`, [id]);
      break;
    case 'reset-password': {
      const temp = tempPassword();
      await db.query(`UPDATE users SET password_hash = $2, must_change_password = true, failed_attempts = 0, locked_until = NULL, updated_at = now() WHERE id = $1`, [id, await pw.hash(temp)]);
      await dropSessions(id);
      req.session.tempPw = { email: target.email, password: temp };
      break;
    }
    default:
      return res.status(404).render('error', { title: 'Not found', message: 'Unknown action.' });
  }
  await audit(req, `admin_${action}`, 'user', id);
  if (action !== 'reset-password') req.flash('ok', `Done: ${action.replace('-', ' ')} ${target.email}.`);
  res.redirect('/admin/users');
});

router.get('/audit', async (req, res) => {
  const rows = await db.many(
    `SELECT a.*, u.email AS actor FROM audit_log a LEFT JOIN users u ON u.id = a.user_id ORDER BY a.created_at DESC LIMIT 200`
  );
  res.render('admin/audit', { title: 'Audit log', rows });
});

module.exports = router;
