'use strict';

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

// Short content hash of the CSS and JS. Used as ?v= on those URLs so browsers fetch a new file the moment it changes,
// instead of showing new pages with a stale stylesheet from an earlier visit.
function version() {
  const h = crypto.createHash('sha1');
  for (const f of ['css/app.css', 'js/app.js']) h.update(fs.readFileSync(path.join(__dirname, '..', '..', 'public', f)));
  return h.digest('hex').slice(0, 10);
}

module.exports = { version };
