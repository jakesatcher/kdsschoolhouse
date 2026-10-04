'use strict';

// Strict query-string parsing: anything unexpected falls back to the default (never trusted as-is).
const str = (v) => (typeof v === 'string' ? v : Array.isArray(v) ? String(v[0] ?? '') : '');
const oneOf = (v, allowed, dflt) => (allowed.map(String).includes(str(v)) ? str(v) : dflt);
function intIn(v, min, max, dflt) {
  const n = Number.parseInt(str(v), 10);
  return Number.isInteger(n) && n >= min && n <= max ? n : dflt;
}
const flag = (v, dflt = false) => (v === undefined ? dflt : ['1', 'on', 'true'].includes(str(v)));

module.exports = { str, oneOf, intIn, flag };
