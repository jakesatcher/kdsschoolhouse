'use strict';

const config = require('./config');
const db = require('./db');
const pw = require('./lib/password');
const { migrate } = require('./db/migrate');
const { createApp } = require('./app');

async function bootstrapAdmin() {
  const { email, password, name } = config.bootstrapAdmin;
  if (!email) return;
  const existing = await db.one('SELECT id, role, status FROM users WHERE lower(email) = lower($1)', [email]);
  if (existing) {
    if (existing.role !== 'admin' || existing.status !== 'approved') {
      await db.query(`UPDATE users SET role = 'admin', status = 'approved', updated_at = now() WHERE id = $1`, [existing.id]);
      console.log(`Promoted ${email} to approved admin`);
    }
    return;
  }
  const problem = pw.passwordProblem(password || '', { email });
  if (problem) {
    console.warn(`ADMIN_EMAIL is set but ADMIN_PASSWORD is unusable (${problem}); skipping admin bootstrap.`);
    return;
  }
  await db.query(
    `INSERT INTO users (email, name, password_hash, role, status, approved_at) VALUES ($1, $2, $3, 'admin', 'approved', now())`,
    [email.trim().toLowerCase(), name, await pw.hash(password)]
  );
  console.log(`Created bootstrap admin ${email}`);
}

async function main() {
  await migrate();
  await bootstrapAdmin();
  createApp().listen(config.port, () => console.log(`${config.appName} listening on port ${config.port}`));
}

if (require.main === module) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}

module.exports = { bootstrapAdmin };
