'use strict';

const config = require('./config');
const db = require('./db');
const pw = require('./lib/password');
const { migrate } = require('./db/migrate');
const { createApp } = require('./app');
const { audit } = require('./lib/audit');

async function bootstrapAdmin() {
  const { username, email, password, name, reset } = config.bootstrapAdmin;
  if (!username) return;
  // The account may be known by its username or, on older deployments, by the email it was created with.
  const existing = await db.one('SELECT id, username, role, status FROM users WHERE lower(username) = lower($1) OR ($2::text IS NOT NULL AND lower(email) = lower($2)) ORDER BY (lower(username) = lower($1)) DESC LIMIT 1', [username, email || null]);
  if (existing) {
    if (reset) {
      const bad = pw.passwordProblem(password || '', { username });
      if (bad) console.warn(`ADMIN_RESET_PASSWORD is true but ADMIN_PASSWORD is unusable (${bad}); password not changed.`);
      else {
        await db.query(
          `UPDATE users SET password_hash = $2, role = 'admin', status = 'approved', must_change_password = true, failed_attempts = 0, locked_until = NULL, updated_at = now() WHERE id = $1`,
          [existing.id, await pw.hash(password)]
        );
        await audit({ ip: null }, 'admin_password_reset_by_env', 'user', existing.id);
        console.warn(`Reset the password for admin ${existing.username} (sign in with that username) from ADMIN_PASSWORD. Remove ADMIN_RESET_PASSWORD now.`);
        return;
      }
    }
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
  // A problem with the admin settings must never keep the whole site down.
  await bootstrapAdmin().catch((err) => console.error('Admin bootstrap failed (site will still start):', err.message));
  createApp().listen(config.port, () => console.log(`${config.appName} listening on port ${config.port}`));
}

if (require.main === module) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}

module.exports = { bootstrapAdmin };
