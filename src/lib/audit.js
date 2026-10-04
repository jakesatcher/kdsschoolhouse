'use strict';

const db = require('../db');

async function audit(req, action, targetType, targetId, detail) {
  try {
    await db.query(
      'INSERT INTO audit_log (user_id, action, target_type, target_id, detail, ip) VALUES ($1,$2,$3,$4,$5,$6)',
      [req && req.user ? req.user.id : null, action, targetType || null, targetId == null ? null : String(targetId), detail ? JSON.stringify(detail) : null, req ? req.ip : null]
    );
  } catch (err) {
    console.error('audit failed', err.message);
  }
}

module.exports = { audit };
