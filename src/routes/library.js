'use strict';

const express = require('express');
const db = require('../db');
const library = require('../lib/library');
const docs = require('../lib/docs');
const sheets = require('../lib/sheets');
const { safeReturnTo } = require('../middleware/auth');
const { str } = require('../lib/params');

const router = express.Router();

const SUBJECTS = [['math', 'Math'], ['reading', 'Reading'], ['writing', 'Writing']];
const group = (items) => SUBJECTS.map(([id, name]) => ({ id, name, items: items.filter((i) => i.subject === id) })).filter((g) => g.items.length);
const href = (i) => (i.is_doc ? `/reading/doc/s-${i.id}` : i.url);

router.get('/favorites', async (req, res) => {
  res.render('library/favorites', { title: 'Favorites', groups: group(await library.list(req.user.id, 'favorite')), href });
});

router.get('/print-later', async (req, res) => {
  res.render('library/print-later', { title: 'Print Later', groups: group(await library.list(req.user.id, 'print_later')), href });
});

// Prints every queued sheet back to back, then offers to clear the queue.
router.get('/print-later/all', async (req, res) => {
  const items = await library.list(req.user.id, 'print_later');
  const rendered = [];
  for (const item of items) {
    if (item.is_doc) {
      const doc = await docs.loadDoc(req, `s-${item.id}`);
      if (doc) rendered.push({ partial: 'doc', locals: { ...doc.content, ref: doc.ref } });
    } else {
      const parsed = sheets.fromUrl(item.url);
      if (parsed) rendered.push({ partial: parsed.built.partial, locals: parsed.built.locals });
    }
  }
  res.render('library/print-all', { title: 'Print everything in the queue', rendered, count: rendered.length });
});

router.post('/print-later/clear', async (req, res) => {
  await db.query('UPDATE saved_items SET print_later = false, updated_at = now() WHERE user_id = $1 AND print_later', [req.user.id]);
  await db.query('DELETE FROM saved_items WHERE user_id = $1 AND NOT favorite AND NOT print_later', [req.user.id]);
  req.flash('ok', 'Print Later queue cleared.');
  res.redirect('/print-later');
});

// Toggle favorite / print-later for a worksheet URL, a doc ref, or a saved item id.
router.post('/library/toggle', async (req, res) => {
  const flag = str(req.body.flag);
  const back = safeReturnTo(str(req.body.back));
  let target;
  if (req.body.url) target = { url: str(req.body.url) };
  else if (req.body.ref) {
    const doc = await docs.loadDoc(req, str(req.body.ref));
    if (!doc) { req.flash('error', 'That sheet is no longer available. Please generate it again.'); return res.redirect('/'); }
    target = { doc };
  } else if (req.body.id) {
    const row = await db.one('SELECT id, content IS NOT NULL AS is_doc, url FROM saved_items WHERE id = $1 AND user_id = $2', [Number.parseInt(str(req.body.id), 10) || 0, req.user.id]);
    if (!row) return res.redirect(back);
    target = row.is_doc ? { doc: await docs.loadDoc(req, `s-${row.id}`) } : { url: row.url };
  } else return res.redirect(back);

  const result = await library.toggle(req.user.id, flag, target);
  if (!result.ok) { req.flash('error', result.message); return res.redirect(back); }
  const label = flag === 'favorite' ? 'Favorites' : 'Print Later';
  req.flash('ok', result.on ? `Added to ${label}.` : `Removed from ${label}.`);
  if (result.newRef) {
    docs.markDraftSaved(req, str(req.body.ref), result.id);
    return res.redirect(`/reading/doc/${result.newRef}`);
  }
  res.redirect(back);
});

module.exports = router;
