'use strict';

const path = require('path');
const express = require('express');
const session = require('express-session');
const PgStore = require('connect-pg-simple')(session);
const helmet = require('helmet');

const config = require('./config');
const db = require('./db');
const { csrf, flash, noStore } = require('./middleware/security');
const { loadUser, requireAuthGlobally } = require('./middleware/auth');

function createApp() {
  const app = express();
  app.set('view engine', 'ejs');
  app.set('views', path.join(__dirname, '..', 'views'));
  app.set('trust proxy', 1); // Railway terminates TLS at its proxy
  app.disable('x-powered-by');

  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          imgSrc: ["'self'", 'data:'],
          scriptSrc: ["'self'"],
          styleSrc: ["'self'"],
          objectSrc: ["'none'"],
          baseUri: ["'self'"],
          formAction: ["'self'"],
          frameAncestors: ["'none'"],
          upgradeInsecureRequests: config.isProd ? [] : null,
        },
      },
      strictTransportSecurity: { maxAge: 63072000, includeSubDomains: true, preload: false },
      referrerPolicy: { policy: 'same-origin' },
      crossOriginResourcePolicy: { policy: 'same-origin' },
    })
  );

  // Health check reveals nothing but liveness; it is the only unauthenticated endpoint besides login/register.
  app.get('/healthz', async (req, res) => {
    try {
      await db.query('SELECT 1');
      res.json({ ok: true });
    } catch {
      res.status(503).json({ ok: false });
    }
  });

  // Static assets: CSS, JS and the icon only (needed to draw the login page). No user data lives here.
  app.use('/static', express.static(path.join(__dirname, '..', 'public'), { maxAge: config.isProd ? '7d' : 0, dotfiles: 'ignore', index: false }));
  app.get('/favicon.ico', (req, res) => res.redirect(301, '/static/favicon.svg'));

  app.use(express.urlencoded({ extended: false, limit: '20kb' }));

  app.use(
    session({
      store: new PgStore({ pool: db.pool, tableName: 'user_sessions', createTableIfMissing: false }),
      name: 'kds.sid',
      secret: config.sessionSecret,
      resave: false,
      saveUninitialized: false,
      rolling: true,
      cookie: {
        httpOnly: true,
        sameSite: 'lax',
        secure: config.isProd,
        maxAge: 1000 * 60 * 60 * 8, // 8 hours idle timeout
      },
    })
  );

  app.use(noStore);
  app.use((req, res, next) => {
    res.locals.appName = config.appName;
    res.locals.path = req.path;
    res.locals.title = null;
    res.locals.currentUser = null;
    res.locals.csrfToken = '';
    res.locals.flash = [];
    res.locals.rtext = require('./lib/reading/text');
    next();
  });
  app.use(flash);
  app.use(csrf);
  app.use(loadUser);
  app.use(requireAuthGlobally); // default deny: nothing below is reachable without a signed-in, approved user

  app.use(require('./routes/auth'));
  app.use(require('./routes/account'));
  app.use('/admin', require('./routes/admin'));
  app.use(require('./routes/learn'));
  app.use(require('./routes/reading'));
  app.use(require('./routes/library'));

  app.use((req, res) => {
    res.status(404).render('error', { title: 'Not found', message: "That page doesn't exist." });
  });

  // eslint-disable-next-line no-unused-vars
  app.use((err, req, res, next) => {
    console.error(err); // details stay in the server log, never in the response
    const status = err.status || err.statusCode || 500;
    res.status(status >= 400 && status < 600 ? status : 500).render('error', {
      title: 'Something went wrong',
      message: status === 413 ? 'That request was too large.' : 'An unexpected error occurred. Please try again.',
    });
  });

  return app;
}

module.exports = { createApp };
