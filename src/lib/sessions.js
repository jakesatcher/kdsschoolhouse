'use strict';

const db = require('../db');

// Ends every session for a user, optionally keeping one (the current device).
async function dropSessions(userId, exceptSid = null) {
  await db.query(`DELETE FROM user_sessions WHERE (sess->>'userId') = $1 AND sid <> COALESCE($2, '')`, [String(userId), exceptSid]);
}

module.exports = { dropSessions };
