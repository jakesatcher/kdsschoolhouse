'use strict';

// Strict query-string parsing: anything unexpected falls back to the default (never trusted as-is).
const str = (v) => (typeof v === 'string' ? v : Array.isArray(v) ? String(v[0] ?? '') : '');
const oneOf = (v, allowed, dflt) => (allowed.map(String).includes(str(v)) ? str(v) : dflt);
function intIn(v, min, max, dflt) {
  const n = Number.parseInt(str(v), 10);
  return Number.isInteger(n) && n >= min && n <= max ? n : dflt;
}
// Checkboxes: an unchecked box sends nothing, so forms add a hidden "0" before the checkbox. When both are sent
// the last value wins (checked); a bare link with no parameter at all falls back to the default.
function flag(v, dflt = false) {
  const last = Array.isArray(v) ? v[v.length - 1] : v;
  return last === undefined ? dflt : ['1', 'on', 'true'].includes(String(last));
}

module.exports = { str, oneOf, intIn, flag };
