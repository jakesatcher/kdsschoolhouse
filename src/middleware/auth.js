'use strict';

const db = require('../db');

async function loadUser(req, res, next) {
  res.locals.currentUser = null;
  if (req.session && req.session.userId) {
    const user = await db.one('SELECT id, email, name, role, status, must_change_password FROM users WHERE id = $1', [req.session.userId]);
    if (user && user.status === 'approved') {
      req.user = user;
      res.locals.currentUser = user;
    } else {
      delete req.session.userId; // removed, disabled or un-approved since login
    }
  }
  next();
}

function safeReturnTo(url) {
  return typeof url === 'string' && url.startsWith('/') && !url.startsWith('//') && !url.includes('\\') ? url : '/';
}

// Default-deny gate: everything except the explicit public paths requires a signed-in, approved user.
const PUBLIC_PATHS = new Set(['/login', '/register', '/healthz']);

function requireAuthGlobally(req, res, next) {
  if (req.user || PUBLIC_PATHS.has(req.path)) {
    if (req.user && req.user.must_change_password && !['/account/password', '/logout'].includes(req.path)) {
      return res.redirect('/account/password');
    }
    return next();
  }
  if (req.method === 'GET') req.session.returnTo = req.originalUrl;
  return res.redirect('/login');
}

function requireAdmin(req, res, next) {
  if (req.user && req.user.role === 'admin') return next();
  return res.status(403).render('error', { title: 'Not allowed', message: 'Only admins can do that.' });
}

module.exports = { loadUser, requireAuthGlobally, requireAdmin, safeReturnTo };
