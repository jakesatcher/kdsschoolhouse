'use strict';

// Small seedable RNG so worksheets can be reproduced (and tested). Not for security purposes.
function makeRng(seed) {
  if (seed === undefined || seed === null) return Math.random;
  let a = seed >>> 0;
  return function next() {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const int = (rng, min, max) => min + Math.floor(rng() * (max - min + 1));
const pick = (rng, arr) => arr[Math.floor(rng() * arr.length)];

function shuffle(rng, arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// n distinct picks; if the pool is smaller than n it is cycled (reshuffled) to fill.
function sample(rng, arr, n) {
  const out = [];
  while (out.length < n) out.push(...shuffle(rng, arr).slice(0, n - out.length));
  return out;
}

module.exports = { makeRng, int, pick, shuffle, sample };
