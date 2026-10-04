'use strict';

const bcrypt = require('bcryptjs');

const MIN_LENGTH = 12;
const MAX_BYTES = 72; // bcrypt ignores everything past 72 bytes
const COST = 12;
const COMMON = new Set(['password1234', 'passwordpassword', '123456789012', 'qwertyuiopas', 'iloveyou1234', 'letmein12345']);

// Returns a message if the password is unacceptable, otherwise null (NIST 800-63B style: length over composition).
function passwordProblem(pw, { email = '', name = '' } = {}) {
  if (typeof pw !== 'string' || pw.length < MIN_LENGTH) return `Password must be at least ${MIN_LENGTH} characters.`;
  if (Buffer.byteLength(pw) > MAX_BYTES) return 'Password is too long (72 bytes maximum).';
  const lower = pw.toLowerCase();
  if (COMMON.has(lower)) return 'That password is too common.';
  if (new Set(pw).size < 5) return 'Password is too repetitive.';
  if (email && lower.includes(String(email).split('@')[0].toLowerCase()) && String(email).split('@')[0].length >= 4) return 'Password must not contain your email name.';
  return null;
}

const hash = (pw) => bcrypt.hash(pw, COST);
const verify = (pw, h) => bcrypt.compare(pw, h);
// Dummy hash so unknown-email logins cost the same as real ones (no timing oracle).
const DUMMY_HASH = bcrypt.hashSync('not-a-real-password', COST);

module.exports = { passwordProblem, hash, verify, DUMMY_HASH, MIN_LENGTH };
