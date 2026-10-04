'use strict';

const { rateLimit } = require('express-rate-limit');

function limiter(limit, windowMinutes) {
  return rateLimit({
    windowMs: windowMinutes * 60 * 1000,
    limit,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    skip: () => process.env.NODE_ENV === 'test',
    handler: (req, res) =>
      res.status(429).render('error', { title: 'Slow down', message: 'Too many attempts. Please wait a few minutes and try again.' }),
  });
}

module.exports = {
  loginLimiter: limiter(15, 15),
  registerLimiter: limiter(5, 60),
  passwordLimiter: limiter(10, 15),
  generatorLimiter: limiter(300, 15),
};
