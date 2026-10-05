'use strict';

// "Docs" are reading worksheets whose text can be edited. A doc lives either as a draft in the user's session
// (ref "d-<token>", just generated, not saved) or as a saved library row (ref "s-<id>").
const db = require('../db');
const { randomToken } = require('./crypto');

const MAX_DRAFTS = 8;
const DRAFT_RE = /^d-[A-Za-z0-9_-]{6,24}$/;
const SAVED_RE = /^s-(\d{1,15})$/;

function putDraft(req, content) {
  const token = randomToken(9);
  const drafts = req.session.drafts || {};
  drafts[token] = { content, at: Date.now() };
  const keep = Object.entries(drafts).sort((a, b) => b[1].at - a[1].at).slice(0, MAX_DRAFTS);
  req.session.drafts = Object.fromEntries(keep);
  return `d-${token}`;
}

async function loadDoc(req, ref) {
  if (DRAFT_RE.test(ref)) {
    const d = (req.session.drafts || {})[ref.slice(2)];
    if (!d) return null;
    if (d.savedId) {
      const saved = await loadDoc(req, `s-${d.savedId}`); // already in the library: work on that copy
      if (saved) return saved;
    }
    return { ref, saved: false, content: d.content };
  }
  const m = SAVED_RE.exec(ref);
  if (!m) return null;
  const row = await db.one('SELECT * FROM saved_items WHERE id = $1 AND user_id = $2 AND content IS NOT NULL', [m[1], req.user.id]);
  return row ? { ref, saved: true, content: row.content, row } : null;
}

async function updateDoc(req, doc, content) {
  if (doc.saved) {
    await db.query('UPDATE saved_items SET content = $3, title = $4, subtitle = $5, updated_at = now() WHERE id = $1 AND user_id = $2', [doc.row.id, req.user.id, JSON.stringify(content), content.title, subtitleOf(content)]);
  } else {
    req.session.drafts[doc.ref.slice(2)] = { content, at: Date.now() };
  }
}

const subtitleOf = (c) => `Grade ${c.grade} · ${c.skillName}`;

function markDraftSaved(req, ref, id) {
  const d = DRAFT_RE.test(ref) && (req.session.drafts || {})[ref.slice(2)];
  if (d) d.savedId = id;
}

module.exports = { markDraftSaved, putDraft, loadDoc, updateDoc, subtitleOf, DRAFT_RE, SAVED_RE };
