'use strict';

require('dotenv').config({ quiet: true });

const env = process.env;
const isProd = env.NODE_ENV === 'production';

function bool(v, dflt = false) {
  if (v === undefined || v === '') return dflt;
  return ['1', 'true', 'yes', 'on'].includes(String(v).toLowerCase());
}

const sessionSecret = env.SESSION_SECRET || (isProd ? null : 'dev-only-insecure-secret');
if (!sessionSecret || (isProd && sessionSecret.length < 32)) {
  throw new Error('SESSION_SECRET must be set to a random string of at least 32 characters in production');
}

module.exports = {
  isProd,
  port: Number(env.PORT) || 3000,
  appName: env.APP_NAME || 'KDS Schoolhouse',
  databaseUrl: env.DATABASE_URL || 'postgres://localhost/kdsschoolhouse',
  databaseSsl: bool(env.DATABASE_SSL, false),
  sessionSecret,
  // AI-written passages and questions (reading section). Without a key the teacher-written options still work.
  anthropicApiKey: env.ANTHROPIC_API_KEY || null,
  aiModel: env.AI_MODEL || 'claude-opus-5-5',
  aiHourlyLimit: Number(env.AI_HOURLY_LIMIT) || 30,
  bootstrapAdmin: {
    email: env.ADMIN_EMAIL,
    password: env.ADMIN_PASSWORD,
    name: env.ADMIN_NAME || 'Admin',
  },
};
