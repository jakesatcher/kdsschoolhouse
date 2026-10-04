'use strict';

const { randomToken, safeEqual } = require('../lib/crypto');

function ensureCsrfToken(req) {
  if (!req.session.csrfToken) req.session.csrfToken = randomToken(24);
  return req.session.csrfToken;
}

// Synchronizer-token CSRF check for every state-changing request.
function csrf(req, res, next) {
  res.locals.csrfToken = ensureCsrfToken(req);
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) return next();
  const sent = (req.body && req.body._csrf) || req.get('x-csrf-token') || '';
  if (safeEqual(sent, req.session.csrfToken)) return next();
  return res.status(403).render('error', { title: 'Session expired', message: 'Your form session expired. Please go back, refresh the page and try again.' });
}

function flash(req, res, next) {
  req.flash = (type, message) => {
    req.session.flash = req.session.flash || [];
    req.session.flash.push({ type, message });
  };
  res.locals.flash = req.session.flash || [];
  delete req.session.flash;
  next();
}

// Authenticated pages must never be cached by browsers or shared proxies.
function noStore(req, res, next) {
  res.set('Cache-Control', 'no-store');
  next();
}

module.exports = { csrf, flash, noStore };
