'use strict';

const db = require('../db');
const sheets = require('./sheets');
const docs = require('./docs');

const MAX_ITEMS = 200;
const FLAGS = ['favorite', 'print_later'];

const find = (userId, url) => db.one('SELECT id, favorite, print_later FROM saved_items WHERE user_id = $1 AND url = $2', [userId, url]);
const findDoc = (userId, ref) => {
  const m = docs.SAVED_RE.exec(ref || '');
  return m ? db.one('SELECT id, favorite, print_later FROM saved_items WHERE user_id = $1 AND id = $2', [userId, m[1]]) : null;
};

// Flips one flag on a saved item, creating the row first if needed. Rows with neither flag are removed.
// target: { url } for pinned worksheets or { doc } for a loaded doc. Returns { ok, on, message }.
async function toggle(userId, flag, target) {
  if (!FLAGS.includes(flag)) return { ok: false, message: 'Unknown action.' };
  let row;
  if (target.url) {
    const parsed = sheets.fromUrl(target.url);
    if (!parsed) return { ok: false, message: 'That sheet cannot be saved.' };
    row = await find(userId, parsed.url);
    if (!row) {
      if ((await db.one('SELECT count(*)::int AS n FROM saved_items WHERE user_id = $1', [userId])).n >= MAX_ITEMS) return { ok: false, message: `You can keep up to ${MAX_ITEMS} saved sheets. Remove some first.` };
      const b = parsed.built;
      row = await db.one(
        'INSERT INTO saved_items (user_id, subject, kind, title, subtitle, url) VALUES ($1,$2,$3,$4,$5,$6) RETURNING id, favorite, print_later',
        [userId, b.subject, b.kind, b.title, b.subtitle || null, parsed.url]
      );
    }
  } else if (target.doc) {
    const d = target.doc;
    if (d.saved) row = await findDoc(userId, d.ref);
    else {
      if ((await db.one('SELECT count(*)::int AS n FROM saved_items WHERE user_id = $1', [userId])).n >= MAX_ITEMS) return { ok: false, message: `You can keep up to ${MAX_ITEMS} saved sheets. Remove some first.` };
      row = await db.one(
        `INSERT INTO saved_items (user_id, subject, kind, title, subtitle, content) VALUES ($1,'reading',$2,$3,$4,$5) RETURNING id, favorite, print_later`,
        [userId, d.content.skill, d.content.title, docs.subtitleOf(d.content), JSON.stringify(d.content)]
      );
    }
  }
  if (!row) return { ok: false, message: 'Not found.' };
  const on = !row[flag];
  const updated = await db.one(`UPDATE saved_items SET ${flag} = $2, updated_at = now() WHERE id = $1 RETURNING id, favorite, print_later`, [row.id, on]);
  if (!updated.favorite && !updated.print_later) await db.query('DELETE FROM saved_items WHERE id = $1', [row.id]);
  return { ok: true, on, id: row.id, newRef: target.doc && !target.doc.saved ? `s-${row.id}` : null };
}

const list = (userId, flag) => {
  if (!FLAGS.includes(flag)) return [];
  return db.many(`SELECT id, subject, kind, title, subtitle, url, content IS NOT NULL AS is_doc, favorite, print_later, created_at FROM saved_items WHERE user_id = $1 AND ${flag} ORDER BY subject, created_at DESC`, [userId]);
};

const counts = async (userId) => (await db.one(`SELECT count(*) FILTER (WHERE favorite)::int AS favorites, count(*) FILTER (WHERE print_later)::int AS print_later FROM saved_items WHERE user_id = $1`, [userId]));

module.exports = { find, findDoc, toggle, list, counts, FLAGS };
