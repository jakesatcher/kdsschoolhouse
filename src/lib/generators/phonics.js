'use strict';

const { shuffle, sample } = require('./rng');
const { CATEGORIES } = require('./phonicsData');

const MIXES = { mixed: 0.3, real: 0, nonsense: 1 }; // share of nonsense words

function findCategory(id) {
  return CATEGORIES.find((c) => c.id === id) || null;
}

function phonics(rng, { category, subtype = 'all', count = 20, mix = 'mixed' }) {
  const cat = findCategory(category);
  if (!cat) return { words: [], error: 'Choose a phonics type.' };
  const subs = subtype === 'all' ? cat.subtypes : cat.subtypes.filter((s) => s.id === subtype);
  if (!subs.length) return { words: [], error: 'Choose a valid sub-type.' };
  const real = [...new Set(subs.flatMap((s) => s.real))];
  const nonsense = [...new Set(subs.flatMap((s) => s.nonsense))];

  const share = MIXES[mix] === undefined ? MIXES.mixed : MIXES[mix];
  let wantNon = Math.min(Math.round(count * share), nonsense.length);
  let wantReal = mix === 'nonsense' ? 0 : Math.min(count - wantNon, real.length);
  if (mix === 'real') wantNon = 0;
  // In a mixed sheet, top up from the other pool if one is too small so the sheet still reaches `count`.
  if (mix === 'mixed' && wantReal + wantNon < count) wantNon = Math.min(count - wantReal, nonsense.length);

  const words = shuffle(rng, [
    ...shuffle(rng, real).slice(0, wantReal).map((word) => ({ word, nonsense: false })),
    ...shuffle(rng, nonsense).slice(0, wantNon).map((word) => ({ word, nonsense: true })),
  ]);
  return { words, error: null, category: cat, subtypeName: subtype === 'all' ? 'All' : subs[0].name };
}

module.exports = { phonics, findCategory, CATEGORIES, sample };
