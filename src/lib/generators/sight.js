'use strict';

const { shuffle } = require('./rng');
const w = (s) => s.trim().split(/\s+/);

// Dolch sight word lists (E. W. Dolch, 1936/1948). 220 service words plus 95 nouns.
const LISTS = [
  { id: 'pre-primer', name: 'Pre-Primer', words: w("a and away big blue can come down find for funny go help here I in is it jump little look make me my not one play red run said see the three to two up we where yellow you") },
  { id: 'primer', name: 'Primer', words: w('all am are at ate be black brown but came did do eat four get good have he into like must new no now on our out please pretty ran ride saw say she so soon that there they this too under want was well went what white who will with yes') },
  { id: 'first', name: 'First Grade', words: w('after again an any as ask by could every fly from give going had has her him his how just know let live may of old once open over put round some stop take thank them then think walk were when') },
  { id: 'second', name: 'Second Grade', words: w("always around because been before best both buy call cold does don't fast first five found gave goes green its made many off or pull read right sing sit sleep tell their these those upon us use very wash which why wish work would write your") },
  { id: 'third', name: 'Third Grade', words: w('about better bring carry clean cut done draw drink eight fall far full got grow hold hot hurt if keep kind laugh light long much myself never only own pick seven shall show six small start ten today together try warm') },
  { id: 'nouns', name: 'Dolch Noun List', words: ['apple', 'baby', 'back', 'ball', 'bear', 'bed', 'bell', 'bird', 'birthday', 'boat', 'box', 'boy', 'bread', 'brother', 'cake', 'car', 'cat', 'chair', 'chicken', 'children', 'Christmas', 'coat', 'corn', 'cow', 'day', 'dog', 'doll', 'door', 'duck', 'egg', 'eye', 'farm', 'farmer', 'father', 'feet', 'fire', 'fish', 'floor', 'flower', 'game', 'garden', 'girl', 'goodbye', 'grass', 'ground', 'hand', 'head', 'hill', 'home', 'horse', 'house', 'kitty', 'leg', 'letter', 'man', 'men', 'milk', 'money', 'morning', 'mother', 'name', 'nest', 'night', 'paper', 'party', 'picture', 'pig', 'rabbit', 'rain', 'ring', 'robin', 'Santa Claus', 'school', 'seed', 'sheep', 'shoe', 'sister', 'snow', 'song', 'squirrel', 'stick', 'street', 'sun', 'table', 'thing', 'time', 'top', 'toy', 'tree', 'watch', 'water', 'way', 'wind', 'window', 'wood'] },
];

function sightWords(rng, { list, count = 'all', order = 'alphabetical' }) {
  const found = LISTS.find((l) => l.id === list);
  if (!found) return { words: [], error: 'Choose a word list.' };
  let words = found.words.slice();
  if (order === 'random') words = shuffle(rng, words);
  else words.sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()));
  if (count !== 'all') words = words.slice(0, Math.max(1, Math.min(Number(count) || words.length, words.length)));
  return { words, error: null, list: found };
}

module.exports = { sightWords, LISTS };
