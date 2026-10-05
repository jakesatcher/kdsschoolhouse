'use strict';

const config = require('./config');
const db = require('./db');
const pw = require('./lib/password');
const { migrate } = require('./db/migrate');
const { createApp } = require('./app');

async function bootstrapAdmin() {
  const { username, email, password, name } = config.bootstrapAdmin;
  if (!username) return;
  const existing = await db.one('SELECT id, role, status FROM users WHERE lower(username) = lower($1)', [username]);
  if (existing) {
    if (existing.role !== 'admin' || existing.status !== 'approved') {
      await db.query(`UPDATE users SET role = 'admin', status = 'approved', updated_at = now() WHERE id = $1`, [existing.id]);
      console.log(`Promoted ${username} to approved admin`);
    }
    return;
  }
  const problem = pw.passwordProblem(password || '', { username });
  if (problem) {
    console.warn(`ADMIN_USERNAME (or ADMIN_EMAIL) is set but ADMIN_PASSWORD is unusable (${problem}); skipping admin bootstrap.`);
    return;
  }
  await db.query(
    `INSERT INTO users (username, email, name, password_hash, role, status, approved_at) VALUES ($1, $2, $3, $4, 'admin', 'approved', now())`,
    [username.trim(), email ? email.trim().toLowerCase() : null, name, await pw.hash(password)]
  );
  console.log(`Created bootstrap admin ${username}`);
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
